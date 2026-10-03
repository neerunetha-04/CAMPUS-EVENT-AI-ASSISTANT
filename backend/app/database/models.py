import datetime
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="organizer") # organizer, admin, faculty, reviewer
    department = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    events = relationship("Event", back_populates="organizer")

class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=generate_uuid)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)

    # Step 1: Basic Event Details
    name = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=True) # Workshop, Conference, Cultural, Sports, Hackathon, Guest Lecture, Exhibition, Club Meeting
    category = Column(String, nullable=True) # Academic, Student Activity, Departmental, Administrative, External
    organizing_department = Column(String, nullable=True)
    organizer_name = Column(String, nullable=True)
    organizer_role = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)

    # Step 2: Schedule
    event_date = Column(String, nullable=True) # YYYY-MM-DD
    start_time = Column(String, nullable=True) # HH:MM
    end_time = Column(String, nullable=True) # HH:MM
    setup_time = Column(String, nullable=True) # HH:MM
    cleanup_time = Column(String, nullable=True) # HH:MM

    # Step 3: Venue & Attendance
    preferred_venue = Column(String, nullable=True) # e.g., Main Auditorium, Seminar Hall A, Open Amphitheater, Sports Complex
    indoor_outdoor = Column(String, default="indoor") # indoor, outdoor, hybrid
    expected_occupancy = Column(Integer, nullable=True)
    seating_arrangement = Column(String, nullable=True) # theater, classroom, banquet, open
    multiple_venues = Column(Boolean, default=False)
    secondary_venues = Column(JSON, default=list)
    expected_attendance = Column(Integer, nullable=True)
    student_participants = Column(Boolean, default=True)
    faculty_participants = Column(Boolean, default=False)
    external_participants = Column(Boolean, default=False)
    has_external_guests = Column(Boolean, default=False)
    has_vips = Column(Boolean, default=False)
    has_speakers = Column(Boolean, default=False)
    has_performers = Column(Boolean, default=False)
    guest_details = Column(Text, nullable=True)

    # Step 4: Resources & Facilities
    audio_system = Column(Boolean, default=False)
    projector = Column(Boolean, default=False)
    lighting = Column(Boolean, default=False)
    stage = Column(Boolean, default=False)
    internet = Column(Boolean, default=False)
    electrical_equipment = Column(Boolean, default=False)
    furniture = Column(Boolean, default=False)
    photography = Column(Boolean, default=False)
    video_recording = Column(Boolean, default=False)
    catering = Column(Boolean, default=False)
    transportation = Column(Boolean, default=False)
    security = Column(Boolean, default=False)
    medical_support = Column(Boolean, default=False)
    resource_notes = Column(Text, nullable=True)

    # Step 5: Budget & Funding
    estimated_budget = Column(Float, nullable=True)
    funding_source = Column(String, nullable=True) # Department Funding, Student Club Budget, Corporate Sponsorship, Ticket/Registration Revenue, Self-Funded
    has_sponsorship = Column(Boolean, default=False)
    sponsorship_details = Column(Text, nullable=True)
    registration_fee = Column(Float, default=0.0)
    expected_expenses = Column(JSON, default=dict)

    # Step 6: Special Requirements
    external_visitors = Column(Boolean, default=False)
    overnight_activity = Column(Boolean, default=False)
    food_served = Column(Boolean, default=False)
    fire_electrical_equipment = Column(Boolean, default=False)
    large_crowd = Column(Boolean, default=False) # e.g. >200 or >500
    outdoor_activity = Column(Boolean, default=False)
    sensitive_equipment = Column(Boolean, default=False)
    special_permissions = Column(Text, nullable=True)

    # Planning Synthesis State
    planning_status = Column(String, default="Draft") # Draft, Needs Information, Requirements Identified, Ready for Submission, Conflict Detected
    readiness_score = Column(Integer, default=0) # 0 to 100 percentage based on completed mandatory items and resolved missing fields
    missing_fields_cache = Column(JSON, default=list)

    # Relationships
    organizer = relationship("User", back_populates="events")
    checklist_items = relationship("ChecklistItem", back_populates="event", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False, index=True)
    department = Column(String, nullable=True)
    document_type = Column(String, nullable=False) # Policy, Regulation, Guideline, Circular, Form, Reference
    authority_level = Column(String, nullable=False) # Institutional Policy, Official Regulation, Department Policy, Official Circular, Procedure, Guideline, Form, Reference
    status = Column(String, default="Active") # Active, Superseded, Inactive, Archived
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    checksum = Column(String, nullable=True)
    is_demo = Column(Boolean, default=False) # Label clearly as DEMO DOCUMENT if true
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    active_version = Column(String, default="v1.0")

    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    version_number = Column(String, nullable=False) # e.g., v1, v2, v3
    effective_date = Column(String, nullable=True) # YYYY-MM-DD
    published_date = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superseded = Column(Boolean, default=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)

    document = relationship("Document", back_populates="versions")
    chunks = relationship("DocumentChunk", back_populates="version", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    version_id = Column(String, ForeignKey("document_versions.id"), nullable=True)
    
    section = Column(String, nullable=True) # Section 4.2: Auditorium Booking
    procedure = Column(String, nullable=True) # Procedure name
    authority = Column(String, nullable=True) # Dean of Student Affairs / Campus Registrar
    
    preconditions = Column(JSON, default=list) # e.g. ["Event in Auditorium", "Attendance > 100"]
    requirements = Column(JSON, default=list) # e.g. ["Submit Form A7", "Pay Security Deposit"]
    steps = Column(JSON, default=list)
    exceptions = Column(JSON, default=list)
    deadline = Column(String, nullable=True) # e.g., "7 days before event"
    effective_date = Column(String, nullable=True)
    source_location = Column(String, nullable=True) # Page 3, Paragraph 2
    page_number = Column(Integer, nullable=True)
    
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    embedding = Column(JSON, nullable=True) # Float vector stored as JSON array for SQLite

    document = relationship("Document", back_populates="chunks")
    version = relationship("DocumentVersion", back_populates="chunks")

class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    event_id = Column(String, ForeignKey("events.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="pending") # pending, complete, not_applicable, needs_review
    requirement_type = Column(String, nullable=False) # mandatory, conditional, optional, missing_information, unknown
    trigger = Column(String, nullable=True) # Condition that triggered this (e.g. "External guests invited", "Auditorium venue selected")
    source = Column(String, nullable=True) # Document title
    source_version = Column(String, nullable=True) # v2.0
    authority = Column(String, nullable=True) # Dean / Facilities / Security Office
    deadline_if_documented = Column(String, nullable=True) # ONLY if documented
    owner_if_documented = Column(String, nullable=True) # ONLY if documented
    citation_chunk_id = Column(String, ForeignKey("document_chunks.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    event = relationship("Event", back_populates="checklist_items")

class ConflictRecord(Base):
    __tablename__ = "conflict_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    topic = Column(String, nullable=False) # e.g. "Venue Booking Notice Period", "Catering Permission"
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Source A
    source_a_document = Column(String, nullable=False)
    source_a_version = Column(String, nullable=False)
    source_a_authority = Column(String, nullable=False)
    source_a_text = Column(Text, nullable=False)
    source_a_chunk_id = Column(String, nullable=True)
    
    # Source B
    source_b_document = Column(String, nullable=False)
    source_b_version = Column(String, nullable=False)
    source_b_authority = Column(String, nullable=False)
    source_b_text = Column(Text, nullable=False)
    source_b_chunk_id = Column(String, nullable=True)

    # Resolution
    higher_authority_source = Column(String, nullable=True) # Which source has higher authority, if determinable
    is_resolvable = Column(Boolean, default=False)
    resolution_explanation = Column(Text, nullable=True) # Explains which has authority or says "The available documents do not provide enough evidence to resolve this conflict."
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    action = Column(String, nullable=False) # UPLOAD_DOCUMENT, DEACTIVATE_VERSION, REINDEX, CONFLICT_DETECTED, CHECKLIST_GENERATED
    details = Column(Text, nullable=True)
    actor = Column(String, default="System")
