from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class EventBase(BaseModel):
    name: str = Field(..., description="Event name")
    event_type: Optional[str] = "Workshop" # Workshop, Conference, Cultural, Sports, Hackathon, Guest Lecture, Exhibition, Club Meeting
    category: Optional[str] = "Academic" # Academic, Student Activity, Departmental, Administrative, External
    organizing_department: Optional[str] = None
    organizer_name: Optional[str] = None
    organizer_role: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

    # Step 2: Schedule
    event_date: Optional[str] = None # YYYY-MM-DD
    start_time: Optional[str] = None # HH:MM
    end_time: Optional[str] = None # HH:MM
    setup_time: Optional[str] = None
    cleanup_time: Optional[str] = None

    # Step 3: Venue & Attendance
    preferred_venue: Optional[str] = None
    indoor_outdoor: Optional[str] = "indoor"
    expected_occupancy: Optional[int] = None
    seating_arrangement: Optional[str] = "theater"
    multiple_venues: Optional[bool] = False
    secondary_venues: Optional[List[str]] = []
    expected_attendance: Optional[int] = None
    student_participants: Optional[bool] = True
    faculty_participants: Optional[bool] = False
    external_participants: Optional[bool] = False
    has_external_guests: Optional[bool] = False
    has_vips: Optional[bool] = False
    has_speakers: Optional[bool] = False
    has_performers: Optional[bool] = False
    guest_details: Optional[str] = None

    # Step 4: Resources & Facilities
    audio_system: Optional[bool] = False
    projector: Optional[bool] = False
    lighting: Optional[bool] = False
    stage: Optional[bool] = False
    internet: Optional[bool] = False
    electrical_equipment: Optional[bool] = False
    furniture: Optional[bool] = False
    photography: Optional[bool] = False
    video_recording: Optional[bool] = False
    catering: Optional[bool] = False
    transportation: Optional[bool] = False
    security: Optional[bool] = False
    medical_support: Optional[bool] = False
    resource_notes: Optional[str] = None

    # Step 5: Budget & Funding
    estimated_budget: Optional[float] = None
    funding_source: Optional[str] = None
    has_sponsorship: Optional[bool] = False
    sponsorship_details: Optional[str] = None
    registration_fee: Optional[float] = 0.0
    expected_expenses: Optional[Dict[str, float]] = {}

    # Step 6: Special Requirements
    external_visitors: Optional[bool] = False
    overnight_activity: Optional[bool] = False
    food_served: Optional[bool] = False
    fire_electrical_equipment: Optional[bool] = False
    large_crowd: Optional[bool] = False
    outdoor_activity: Optional[bool] = False
    sensitive_equipment: Optional[bool] = False
    special_permissions: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    name: Optional[str] = None
    event_type: Optional[str] = None
    category: Optional[str] = None
    organizing_department: Optional[str] = None
    organizer_name: Optional[str] = None
    organizer_role: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

    event_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    setup_time: Optional[str] = None
    cleanup_time: Optional[str] = None

    preferred_venue: Optional[str] = None
    indoor_outdoor: Optional[str] = None
    expected_occupancy: Optional[int] = None
    seating_arrangement: Optional[str] = None
    multiple_venues: Optional[bool] = None
    secondary_venues: Optional[List[str]] = None
    expected_attendance: Optional[int] = None
    student_participants: Optional[bool] = None
    faculty_participants: Optional[bool] = None
    external_participants: Optional[bool] = None
    has_external_guests: Optional[bool] = None
    has_vips: Optional[bool] = None
    has_speakers: Optional[bool] = None
    has_performers: Optional[bool] = None
    guest_details: Optional[str] = None

    audio_system: Optional[bool] = None
    projector: Optional[bool] = None
    lighting: Optional[bool] = None
    stage: Optional[bool] = None
    internet: Optional[bool] = None
    electrical_equipment: Optional[bool] = None
    furniture: Optional[bool] = None
    photography: Optional[bool] = None
    video_recording: Optional[bool] = None
    catering: Optional[bool] = None
    transportation: Optional[bool] = None
    security: Optional[bool] = None
    medical_support: Optional[bool] = None
    resource_notes: Optional[str] = None

    estimated_budget: Optional[float] = None
    funding_source: Optional[str] = None
    has_sponsorship: Optional[bool] = None
    sponsorship_details: Optional[str] = None
    registration_fee: Optional[float] = None
    expected_expenses: Optional[Dict[str, float]] = None

    external_visitors: Optional[bool] = None
    overnight_activity: Optional[bool] = None
    food_served: Optional[bool] = None
    fire_electrical_equipment: Optional[bool] = None
    large_crowd: Optional[bool] = None
    outdoor_activity: Optional[bool] = None
    sensitive_equipment: Optional[bool] = None
    special_permissions: Optional[str] = None
    
    planning_status: Optional[str] = None

class MissingFieldInfo(BaseModel):
    field_key: str
    label: str
    step: int
    step_name: str
    importance: str # Critical, Recommended
    reason: str # Grounded explanation from document corpus why this field is required
    source_citation: Optional[str] = None

class EventReadinessSummary(BaseModel):
    planning_status: str # "Draft", "Needs Information", "Requirements Identified", "Ready for Submission", "Conflict Detected"
    readiness_score: int # 0 to 100 percentage
    total_mandatory: int
    completed_mandatory: int
    total_conditional: int
    completed_conditional: int
    total_optional: int
    missing_critical_count: int
    conflict_count: int
    source_count: int
    ready_for_submission: bool
    summary_notes: List[str]

class EventResponse(EventBase):
    id: str
    created_at: datetime
    updated_at: datetime
    planning_status: str
    readiness_score: int
    missing_fields_cache: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True
