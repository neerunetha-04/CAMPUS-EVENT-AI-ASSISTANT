from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import Event
from app.schemas.qa import QuestionRequest, GroundedAnswerResponse
from app.services.qa_service import GroundedQAService
from app.api.events import get_all_chunks_metadata

router = APIRouter(prefix="/questions", tags=["Procedural QA"])

@router.post("", response_model=GroundedAnswerResponse)
async def ask_procedural_question(req: QuestionRequest, db: Session = Depends(get_db)):
    """Answer procedural questions strictly grounded in the institutional document corpus."""
    all_chunks = get_all_chunks_metadata(db)

    event_context = None
    if req.event_id:
        event = db.query(Event).filter(Event.id == req.event_id).first()
        if event:
            event_context = {
                "name": event.name,
                "event_type": event.event_type,
                "preferred_venue": event.preferred_venue,
                "expected_attendance": event.expected_attendance,
                "has_external_guests": event.has_external_guests,
                "catering": event.catering
            }

    response = await GroundedQAService.answer_question(
        question=req.question,
        all_chunks=all_chunks,
        event_context=event_context
    )
    return response
