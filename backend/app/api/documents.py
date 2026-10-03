import os
import hashlib
import shutil
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import Document, DocumentVersion, DocumentChunk, AuditLog
from app.schemas.document import DocumentResponse, DocumentChunkResponse, DocumentVersionResponse
from app.documents.extractor import DocumentExtractor
from app.documents.chunker import ProceduralChunker
from app.config import UPLOAD_DIR

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".markdown"}
MAX_FILE_SIZE = 25 * 1024 * 1024 # 25 MB

@router.get("", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    """List all documents with version and chunk counts."""
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    results = []
    for d in docs:
        v_count = len(d.versions)
        c_count = len(d.chunks)
        results.append(DocumentResponse(
            id=d.id,
            title=d.title,
            department=d.department,
            document_type=d.document_type,
            authority_level=d.authority_level,
            status=d.status,
            file_name=d.file_name,
            file_size=d.file_size,
            checksum=d.checksum,
            is_demo=d.is_demo,
            uploaded_at=d.uploaded_at,
            active_version=d.active_version,
            versions_count=v_count,
            chunks_count=c_count
        ))
    return results

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    department: str = Form("General Administration"),
    document_type: str = Form("Policy"),
    authority_level: str = Form("Institutional Policy"),
    version_number: str = Form("v1.0"),
    effective_date: Optional[str] = Form(None),
    is_demo: bool = Form(False),
    db: Session = Depends(get_db)
):
    """Upload and process official institutional policy/regulation."""
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read content and compute checksum
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 25MB.")
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    checksum = hashlib.sha256(contents).hexdigest()

    # Check for duplicate
    existing = db.query(Document).filter(Document.checksum == checksum).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"This exact document has already been uploaded as '{existing.title}' (ID: {existing.id})."
        )

    # Save to disk
    safe_filename = f"{checksum[:10]}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename
    with open(file_path, "wb") as f:
        f.write(contents)

    # Create Document record
    doc = Document(
        title=title,
        department=department,
        document_type=document_type,
        authority_level=authority_level,
        status="Active",
        file_name=file.filename,
        file_path=str(file_path),
        file_size=len(contents),
        checksum=checksum,
        is_demo=is_demo,
        active_version=version_number
    )
    db.add(doc)
    db.flush()

    # Create Version record
    version = DocumentVersion(
        document_id=doc.id,
        version_number=version_number,
        effective_date=effective_date,
        published_date=effective_date,
        is_active=True,
        is_superseded=False,
        file_path=str(file_path),
        notes="Uploaded via Admin Document Center"
    )
    db.add(version)
    db.flush()

    # Extract text and chunk
    try:
        pages = DocumentExtractor.extract_file(str(file_path))
        chunks = ProceduralChunker.chunk_document(
            document_id=doc.id,
            version_id=version.id,
            pages=pages,
            default_authority=authority_level,
            effective_date=effective_date
        )

        for c in chunks:
            chunk_row = DocumentChunk(
                id=c.id,
                document_id=doc.id,
                version_id=version.id,
                section=c.section,
                procedure=c.procedure,
                authority=c.authority,
                preconditions=c.preconditions,
                requirements=c.requirements,
                steps=c.steps,
                exceptions=c.exceptions,
                deadline=c.deadline,
                effective_date=c.effective_date,
                source_location=c.source_location,
                page_number=c.page_number,
                content=c.content,
                token_count=c.token_count
            )
            db.add(chunk_row)

        audit = AuditLog(
            action="UPLOAD_DOCUMENT",
            details=f"Uploaded '{title}' ({version_number}) with {len(chunks)} procedural units extracted.",
            actor="Admin"
        )
        db.add(audit)
        db.commit()
        db.refresh(doc)

        return DocumentResponse(
            id=doc.id,
            title=doc.title,
            department=doc.department,
            document_type=doc.document_type,
            authority_level=doc.authority_level,
            status=doc.status,
            file_name=doc.file_name,
            file_size=doc.file_size,
            checksum=doc.checksum,
            is_demo=doc.is_demo,
            uploaded_at=doc.uploaded_at,
            active_version=doc.active_version,
            versions_count=1,
            chunks_count=len(chunks)
        )
    except Exception as e:
        db.rollback()
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(e)}. Try uploading a searchable PDF, DOCX, or text file."
        )

@router.get("/{document_id}")
def get_document(document_id: str, db: Session = Depends(get_db)):
    """Get single document with full metadata and versions."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    versions = [
        DocumentVersionResponse(
            id=v.id,
            document_id=v.document_id,
            version_number=v.version_number,
            effective_date=v.effective_date,
            published_date=v.published_date,
            is_active=v.is_active,
            is_superseded=v.is_superseded,
            uploaded_at=v.uploaded_at,
            notes=v.notes
        )
        for v in doc.versions
    ]

    return {
        "id": doc.id,
        "title": doc.title,
        "department": doc.department,
        "document_type": doc.document_type,
        "authority_level": doc.authority_level,
        "status": doc.status,
        "file_name": doc.file_name,
        "file_size": doc.file_size,
        "checksum": doc.checksum,
        "is_demo": doc.is_demo,
        "uploaded_at": doc.uploaded_at,
        "active_version": doc.active_version,
        "versions": versions,
        "chunks_count": len(doc.chunks)
    }

@router.get("/{document_id}/chunks", response_model=List[DocumentChunkResponse])
def get_document_chunks(document_id: str, db: Session = Depends(get_db)):
    """Inspect all extracted procedural chunks for Document Inspector."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).order_by(DocumentChunk.page_number.asc()).all()
    return chunks

@router.patch("/{document_id}/status")
def update_document_status(document_id: str, status_val: str, db: Session = Depends(get_db)):
    """Update document lifecycle status (Active, Superseded, Inactive)."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if status_val not in ["Active", "Superseded", "Inactive", "Archived"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    doc.status = status_val
    for v in doc.versions:
        if status_val == "Superseded":
            v.is_superseded = True
            v.is_active = False
        elif status_val == "Active":
            v.is_active = True
            v.is_superseded = False
        else:
            v.is_active = False

    audit = AuditLog(
        action="UPDATE_STATUS",
        details=f"Document '{doc.title}' status changed to {status_val}.",
        actor="Admin"
    )
    db.add(audit)
    db.commit()
    return {"message": f"Document status updated to {status_val}", "id": doc.id, "status": doc.status}

@router.post("/{document_id}/reindex")
def reindex_document(document_id: str, db: Session = Depends(get_db)):
    """Re-extract and re-chunk an uploaded document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not Path(doc.file_path).exists():
        raise HTTPException(status_code=400, detail="Source file is missing on storage.")

    # Remove existing chunks
    db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()

    pages = DocumentExtractor.extract_file(doc.file_path)
    active_version = doc.versions[0] if doc.versions else None

    chunks = ProceduralChunker.chunk_document(
        document_id=doc.id,
        version_id=active_version.id if active_version else None,
        pages=pages,
        default_authority=doc.authority_level,
        effective_date=active_version.effective_date if active_version else None
    )

    for c in chunks:
        chunk_row = DocumentChunk(
            id=c.id,
            document_id=doc.id,
            version_id=active_version.id if active_version else None,
            section=c.section,
            procedure=c.procedure,
            authority=c.authority,
            preconditions=c.preconditions,
            requirements=c.requirements,
            steps=c.steps,
            exceptions=c.exceptions,
            deadline=c.deadline,
            effective_date=c.effective_date,
            source_location=c.source_location,
            page_number=c.page_number,
            content=c.content,
            token_count=c.token_count
        )
        db.add(chunk_row)

    audit = AuditLog(
        action="REINDEX_DOCUMENT",
        details=f"Re-indexed '{doc.title}'. Extracted {len(chunks)} procedural chunks.",
        actor="Admin"
    )
    db.add(audit)
    db.commit()
    return {"message": f"Successfully re-indexed {len(chunks)} procedural chunks", "chunks_count": len(chunks)}

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document and all associated versions and chunks."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove file on disk if exists
    if Path(doc.file_path).exists():
        try:
            Path(doc.file_path).unlink()
        except Exception:
            pass

    db.delete(doc)
    audit = AuditLog(
        action="DELETE_DOCUMENT",
        details=f"Deleted document '{doc.title}'.",
        actor="Admin"
    )
    db.add(audit)
    db.commit()
    return None
