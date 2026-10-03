from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class DocumentVersionResponse(BaseModel):
    id: str
    document_id: str
    version_number: str
    effective_date: Optional[str] = None
    published_date: Optional[str] = None
    is_active: bool
    is_superseded: bool
    uploaded_at: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentChunkResponse(BaseModel):
    id: str
    document_id: str
    version_id: Optional[str] = None
    section: Optional[str] = None
    procedure: Optional[str] = None
    authority: Optional[str] = None
    preconditions: List[str] = []
    requirements: List[str] = []
    steps: List[str] = []
    exceptions: List[str] = []
    deadline: Optional[str] = None
    effective_date: Optional[str] = None
    source_location: Optional[str] = None
    page_number: Optional[int] = None
    content: str
    token_count: int = 0

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: str
    title: str
    department: Optional[str] = None
    document_type: str
    authority_level: str
    status: str
    file_name: str
    file_size: int
    checksum: Optional[str] = None
    is_demo: bool
    uploaded_at: datetime
    active_version: str
    versions_count: int = 1
    chunks_count: int = 0

    class Config:
        from_attributes = True

class DocumentUploadMetadata(BaseModel):
    title: str
    department: Optional[str] = "General Administration"
    document_type: str = "Policy" # Policy, Regulation, Circular, Guideline, Form, Reference
    authority_level: str = "Institutional Policy" # Institutional Policy, Official Regulation, Department Policy, Official Circular, Procedure, Guideline, Form, Reference
    version_number: str = "v1.0"
    effective_date: Optional[str] = None
    published_date: Optional[str] = None
    is_demo: bool = False
