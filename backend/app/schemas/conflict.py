from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ConflictRecordResponse(BaseModel):
    id: str
    topic: str
    title: str
    description: Optional[str] = None
    
    source_a_document: str
    source_a_version: str
    source_a_authority: str
    source_a_text: str
    source_a_chunk_id: Optional[str] = None
    
    source_b_document: str
    source_b_version: str
    source_b_authority: str
    source_b_text: str
    source_b_chunk_id: Optional[str] = None

    higher_authority_source: Optional[str] = None
    is_resolvable: bool = False
    resolution_explanation: Optional[str] = None
    detected_at: datetime

    class Config:
        from_attributes = True
