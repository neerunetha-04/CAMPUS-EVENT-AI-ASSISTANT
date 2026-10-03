from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.events import get_all_chunks_metadata
from app.rag.conflict_detector import ConflictDetector

router = APIRouter(prefix="/conflicts", tags=["Conflicts"])

@router.get("")
def list_all_conflicts(db: Session = Depends(get_db)):
    """List detected institutional policy conflicts across the document corpus."""
    all_chunks = get_all_chunks_metadata(db)
    conflicts = ConflictDetector.analyze_chunks(all_chunks)
    
    return [
        {
            "topic": c.topic,
            "title": c.title,
            "description": c.description,
            "source_a": {
                "document": c.source_a_document,
                "version": c.source_a_version,
                "authority": c.source_a_authority,
                "text": c.source_a_text,
                "chunk_id": c.source_a_chunk_id
            },
            "source_b": {
                "document": c.source_b_document,
                "version": c.source_b_version,
                "authority": c.source_b_authority,
                "text": c.source_b_text,
                "chunk_id": c.source_b_chunk_id
            },
            "higher_authority_source": c.higher_authority_source,
            "is_resolvable": c.is_resolvable,
            "resolution_explanation": c.resolution_explanation
        }
        for c in conflicts
    ]
