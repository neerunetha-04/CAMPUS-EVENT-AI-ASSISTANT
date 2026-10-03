from typing import List, Optional
from pydantic import BaseModel, Field

class Citation(BaseModel):
    document_title: str
    version: str
    authority: str
    section: Optional[str] = None
    page_number: Optional[int] = None
    source_location: Optional[str] = None
    excerpt: str
    chunk_id: Optional[str] = None

class GroundedAnswerResponse(BaseModel):
    question: str
    answer: str = Field(..., description="Direct answer strictly derived from authoritative documents")
    why: str = Field(..., description="Explanation of the underlying institutional rule")
    requirement_type: str = Field(..., description="Mandatory, Conditional, Optional, Informational, or Unknown")
    citations: List[Citation] = []
    missing_information: List[str] = []
    conflicts: List[str] = []
    evidence_status: str = Field("Authoritative evidence found", description="Status of evidence")
    has_authoritative_source: bool = True

class QuestionRequest(BaseModel):
    question: str
    event_id: Optional[str] = None
