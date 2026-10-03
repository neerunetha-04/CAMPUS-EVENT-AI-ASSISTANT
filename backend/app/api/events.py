import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import Event, ChecklistItem, DocumentChunk, Document, DocumentVersion, AuditLog
from app.schemas.event import EventCreate, EventUpdate, EventResponse, EventReadinessSummary, MissingFieldInfo
from app.schemas.checklist import ChecklistItemResponse, ChecklistGrouped, ChecklistItemUpdate
from app.services.event_analyzer import EventAnalyzerService
from app.services.export_service import ExportService

router = APIRouter(prefix="/events", tags=["Events"])

def get_all_chunks_metadata(db: Session) -> List[Dict[str, Any]]:
    """Retrieve all chunk metadata joined with document and version info."""
    chunks = db.query(DocumentChunk).all()
    results = []
    for c in chunks:
        doc = db.query(Document).filter(Document.id == c.document_id).first()
        ver = db.query(DocumentVersion).filter(DocumentVersion.id == c.version_id).first() if c.version_id else None
        results.append({
            "id": c.id,
            "document_id": c.document_id,
            "document_title": doc.title if doc else "Campus Policy",
            "version": ver.version_number if ver else (doc.active_version if doc else "v1.0"),
            "authority_level": doc.authority_level if doc else "Guideline",
            "section": c.section,
            "procedure": c.procedure,
            "authority": c.authority,
            "page_number": c.page_number,
            "source_location": c.source_location,
            "content": c.content,
            "is_active": ver.is_active if ver else (doc.status == "Active" if doc else True),
            "is_superseded": ver.is_superseded if ver else (doc.status == "Superseded" if doc else False),
            "preconditions": c.preconditions or [],
            "requirements": c.requirements or [],
            "deadline": c.deadline
        })
    return results

@router.get("", response_model=List[EventResponse])
def list_events(db: Session = Depends(get_db)):
    """List all campus events."""
    return db.query(Event).order_by(Event.created_at.desc()).all()

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(event_in: EventCreate, db: Session = Depends(get_db)):
    """Create a new event and perform initial procedural analysis."""
    event_data = event_in.model_dump()
    event = Event(**event_data)
    db.add(event)
    db.flush()

    # Run initial analysis
    all_chunks = get_all_chunks_metadata(db)
    checklist_data, missing_fields, readiness, conflicts = EventAnalyzerService.analyze_event(
        event=event,
        all_chunks=all_chunks
    )

    # Save checklist items
    for item in checklist_data:
        db_item = ChecklistItem(
            event_id=event.id,
            title=item["title"],
            description=item.get("description"),
            status=item.get("status", "pending"),
            requirement_type=item["requirement_type"],
            trigger=item.get("trigger"),
            source=item.get("source"),
            source_version=item.get("source_version"),
            authority=item.get("authority"),
            deadline_if_documented=item.get("deadline_if_documented"),
            owner_if_documented=item.get("owner_if_documented"),
            citation_chunk_id=item.get("citation_chunk_id")
        )
        db.add(db_item)

    event.planning_status = readiness.planning_status
    event.readiness_score = readiness.readiness_score
    event.missing_fields_cache = [m.model_dump() for m in missing_fields]

    audit = AuditLog(
        action="CREATE_EVENT",
        details=f"Created event '{event.name}' with readiness score {readiness.readiness_score}%.",
        actor=event.organizer_name or "Organizer"
    )
    db.add(audit)
    db.commit()
    db.refresh(event)
    return event

@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    """Get single event details."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.patch("/{event_id}", response_model=EventResponse)
def update_event(event_id: str, event_update: EventUpdate, db: Session = Depends(get_db)):
    """Update event fields and immediately re-evaluate procedural rules in real time."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = event_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(event, field, val)

    # Re-analyze event based on new fields
    all_chunks = get_all_chunks_metadata(db)
    checklist_data, missing_fields, readiness, conflicts = EventAnalyzerService.analyze_event(
        event=event,
        all_chunks=all_chunks
    )

    # Preserve status of existing checklist items
    existing_items = {i.title: i.status for i in event.checklist_items}
    # Clear old items and repopulate synthesized items
    db.query(ChecklistItem).filter(ChecklistItem.event_id == event.id).delete()

    for item in checklist_data:
        saved_status = existing_items.get(item["title"], item.get("status", "pending"))
        db_item = ChecklistItem(
            event_id=event.id,
            title=item["title"],
            description=item.get("description"),
            status=saved_status,
            requirement_type=item["requirement_type"],
            trigger=item.get("trigger"),
            source=item.get("source"),
            source_version=item.get("source_version"),
            authority=item.get("authority"),
            deadline_if_documented=item.get("deadline_if_documented"),
            owner_if_documented=item.get("owner_if_documented"),
            citation_chunk_id=item.get("citation_chunk_id")
        )
        db.add(db_item)

    event.planning_status = readiness.planning_status
    event.readiness_score = readiness.readiness_score
    event.missing_fields_cache = [m.model_dump() for m in missing_fields]
    event.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(event)
    return event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: str, db: Session = Depends(get_db)):
    """Delete an event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return None

@router.post("/{event_id}/analyze")
def trigger_analysis(event_id: str, db: Session = Depends(get_db)):
    """Explicitly trigger procedural analysis for an event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    all_chunks = get_all_chunks_metadata(db)
    checklist_data, missing_fields, readiness, conflicts = EventAnalyzerService.analyze_event(
        event=event,
        all_chunks=all_chunks
    )

    event.planning_status = readiness.planning_status
    event.readiness_score = readiness.readiness_score
    event.missing_fields_cache = [m.model_dump() for m in missing_fields]
    db.commit()

    return {
        "readiness": readiness,
        "missing_fields": missing_fields,
        "conflicts": conflicts
    }

@router.get("/{event_id}/checklist", response_model=ChecklistGrouped)
def get_event_checklist(event_id: str, db: Session = Depends(get_db)):
    """Get categorized checklist items for an event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    items = db.query(ChecklistItem).filter(ChecklistItem.event_id == event_id).all()
    grouped = ChecklistGrouped()

    for item in items:
        # Fetch chunk content if available
        excerpt = None
        if item.citation_chunk_id:
            c = db.query(DocumentChunk).filter(DocumentChunk.id == item.citation_chunk_id).first()
            if c:
                excerpt = c.content

        item_resp = ChecklistItemResponse(
            id=item.id,
            event_id=item.event_id,
            title=item.title,
            description=item.description,
            status=item.status,
            requirement_type=item.requirement_type,
            trigger=item.trigger,
            source=item.source,
            source_version=item.source_version,
            authority=item.authority,
            deadline_if_documented=item.deadline_if_documented,
            owner_if_documented=item.owner_if_documented,
            citation_chunk_id=item.citation_chunk_id,
            created_at=item.created_at,
            excerpt=excerpt
        )

        if item.requirement_type == "mandatory":
            grouped.mandatory.append(item_resp)
        elif item.requirement_type == "conditional":
            grouped.conditional.append(item_resp)
        elif item.requirement_type == "optional":
            grouped.optional.append(item_resp)
        else:
            grouped.unknown.append(item_resp)

    return grouped

@router.patch("/{event_id}/checklist/{item_id}", response_model=ChecklistItemResponse)
def update_checklist_item(event_id: str, item_id: str, update_in: ChecklistItemUpdate, db: Session = Depends(get_db)):
    """Toggle or update status of a checklist item."""
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id, ChecklistItem.event_id == event_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    if update_in.status:
        item.status = update_in.status
        db.commit()

    # Recalculate event readiness score after item completion
    event = db.query(Event).filter(Event.id == event_id).first()
    all_chunks = get_all_chunks_metadata(db)
    checklist_data, missing_fields, readiness, conflicts = EventAnalyzerService.analyze_event(
        event=event,
        all_chunks=all_chunks
    )
    event.planning_status = readiness.planning_status
    event.readiness_score = readiness.readiness_score
    db.commit()

    excerpt = None
    if item.citation_chunk_id:
        c = db.query(DocumentChunk).filter(DocumentChunk.id == item.citation_chunk_id).first()
        if c:
            excerpt = c.content

    return ChecklistItemResponse(
        id=item.id,
        event_id=item.event_id,
        title=item.title,
        description=item.description,
        status=item.status,
        requirement_type=item.requirement_type,
        trigger=item.trigger,
        source=item.source,
        source_version=item.source_version,
        authority=item.authority,
        deadline_if_documented=item.deadline_if_documented,
        owner_if_documented=item.owner_if_documented,
        citation_chunk_id=item.citation_chunk_id,
        created_at=item.created_at,
        excerpt=excerpt
    )

@router.get("/{event_id}/export")
def export_event_dossier(event_id: str, db: Session = Depends(get_db)):
    """Export complete grounded event planning dossier."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    items = db.query(ChecklistItem).filter(ChecklistItem.event_id == event_id).all()
    all_chunks = get_all_chunks_metadata(db)
    checklist_data, missing_fields, readiness, conflicts = EventAnalyzerService.analyze_event(
        event=event,
        all_chunks=all_chunks
    )

    dossier = ExportService.generate_export_payload(
        event=event,
        items=items,
        missing_fields=[m.model_dump() for m in missing_fields],
        conflicts=[{
            "topic": c.topic,
            "title": c.title,
            "source_a": f"{c.source_a_document} ({c.source_a_version})",
            "source_b": f"{c.source_b_document} ({c.source_b_version})",
            "is_resolvable": c.is_resolvable,
            "resolution": c.resolution_explanation
        } for c in conflicts],
        readiness=readiness.model_dump()
    )
    return dossier
