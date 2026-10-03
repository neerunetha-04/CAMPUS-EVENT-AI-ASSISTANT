from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import init_db, get_db
from app.database.models import Event, Document, DocumentChunk
from app.api.events import router as events_router
from app.api.documents import router as documents_router
from app.api.qa import router as qa_router
from app.api.conflicts import router as conflicts_router
from app.api.demo import seed_demo_documents

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite schema
    init_db()
    
    # Pre-seed demo documents (strictly labeled as DEMO DOCUMENT per req #4)
    db = next(get_db())
    try:
        seed_demo_documents(db)
    finally:
        db.close()
    
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(events_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)
app.include_router(qa_router, prefix=settings.API_V1_STR)
app.include_router(conflicts_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@app.get("/api/stats")
def get_system_stats(db: Session = Depends(get_db)):
    """Summary metrics for the dashboard."""
    events_count = db.query(Event).count()
    docs_count = db.query(Document).filter(Document.status == "Active").count()
    chunks_count = db.query(DocumentChunk).count()
    
    # Calculate events needing review
    needs_info = db.query(Event).filter(Event.planning_status == "Needs Information").count()
    ready = db.query(Event).filter(Event.planning_status == "Ready for Submission").count()

    return {
        "active_events": events_count,
        "active_documents": docs_count,
        "procedural_chunks": chunks_count,
        "needs_information_events": needs_info,
        "ready_events": ready
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
