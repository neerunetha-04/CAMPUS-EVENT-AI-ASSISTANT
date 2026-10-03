from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class ChecklistItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "pending" # pending, complete, not_applicable, needs_review
    requirement_type: str # mandatory, conditional, optional, missing_information, unknown
    trigger: Optional[str] = None
    source: Optional[str] = None
    source_version: Optional[str] = None
    authority: Optional[str] = None
    deadline_if_documented: Optional[str] = None
    owner_if_documented: Optional[str] = None
    citation_chunk_id: Optional[str] = None

class ChecklistItemCreate(ChecklistItemBase):
    event_id: str

class ChecklistItemUpdate(BaseModel):
    status: Optional[str] = None

class ChecklistItemResponse(ChecklistItemBase):
    id: str
    event_id: str
    created_at: datetime
    excerpt: Optional[str] = None # Attached excerpt for citation drawer

    class Config:
        from_attributes = True

class ChecklistGrouped(BaseModel):
    mandatory: List[ChecklistItemResponse] = []
    conditional: List[ChecklistItemResponse] = []
    optional: List[ChecklistItemResponse] = []
    unknown: List[ChecklistItemResponse] = []
    missing_information: List[ChecklistItemResponse] = []
