export interface EventData {
  id: string;
  name: string;
  event_type?: string;
  category?: string;
  organizing_department?: string;
  organizer_name?: string;
  organizer_role?: string;
  contact_email?: string;
  contact_phone?: string;

  event_date?: string;
  start_time?: string;
  end_time?: string;
  setup_time?: string;
  cleanup_time?: string;

  preferred_venue?: string;
  indoor_outdoor?: string;
  expected_occupancy?: number;
  seating_arrangement?: string;
  multiple_venues?: boolean;
  secondary_venues?: string[];
  expected_attendance?: number;
  student_participants?: boolean;
  faculty_participants?: boolean;
  external_participants?: boolean;
  has_external_guests?: boolean;
  has_vips?: boolean;
  has_speakers?: boolean;
  has_performers?: boolean;
  guest_details?: string;

  audio_system?: boolean;
  projector?: boolean;
  lighting?: boolean;
  stage?: boolean;
  internet?: boolean;
  electrical_equipment?: boolean;
  furniture?: boolean;
  photography?: boolean;
  video_recording?: boolean;
  catering?: boolean;
  transportation?: boolean;
  security?: boolean;
  medical_support?: boolean;
  resource_notes?: string;

  estimated_budget?: number;
  funding_source?: string;
  has_sponsorship?: boolean;
  sponsorship_details?: string;
  registration_fee?: number;
  expected_expenses?: Record<string, number>;

  external_visitors?: boolean;
  overnight_activity?: boolean;
  food_served?: boolean;
  fire_electrical_equipment?: boolean;
  large_crowd?: boolean;
  outdoor_activity?: boolean;
  sensitive_equipment?: boolean;
  special_permissions?: string;

  planning_status: string;
  readiness_score: number;
  missing_fields_cache?: MissingField[];
  created_at: string;
  updated_at: string;
}

export interface MissingField {
  field_key: string;
  label: string;
  step: number;
  step_name: string;
  importance: 'Critical' | 'Recommended';
  reason: string;
  source_citation?: string;
}

export interface ChecklistItem {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'complete' | 'not_applicable' | 'needs_review';
  requirement_type: 'mandatory' | 'conditional' | 'optional' | 'missing_information' | 'unknown';
  trigger?: string;
  source?: string;
  source_version?: string;
  authority?: string;
  deadline_if_documented?: string;
  owner_if_documented?: string;
  citation_chunk_id?: string;
  created_at: string;
  excerpt?: string;
}

export interface ChecklistGrouped {
  mandatory: ChecklistItem[];
  conditional: ChecklistItem[];
  optional: ChecklistItem[];
  unknown: ChecklistItem[];
  missing_information: ChecklistItem[];
}

export interface DocumentItem {
  id: string;
  title: string;
  department?: string;
  document_type: string;
  authority_level: string;
  status: string;
  file_name: string;
  file_size: number;
  checksum?: string;
  is_demo: boolean;
  uploaded_at: string;
  active_version: string;
  versions_count: number;
  chunks_count: number;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  version_id?: string;
  section?: string;
  procedure?: string;
  authority?: string;
  preconditions: string[];
  requirements: string[];
  steps: string[];
  exceptions: string[];
  deadline?: string;
  effective_date?: string;
  source_location?: string;
  page_number?: number;
  content: string;
  token_count: number;
}

export interface ConflictItem {
  topic: string;
  title: string;
  description: string;
  source_a: {
    document: string;
    version: string;
    authority: string;
    text: string;
    chunk_id?: string;
  };
  source_b: {
    document: string;
    version: string;
    authority: string;
    text: string;
    chunk_id?: string;
  };
  higher_authority_source?: string;
  is_resolvable: boolean;
  resolution_explanation?: string;
}

export interface Citation {
  document_title: string;
  version: string;
  authority: string;
  section?: string;
  page_number?: number;
  source_location?: string;
  excerpt: string;
  chunk_id?: string;
}

export interface GroundedAnswer {
  question: string;
  answer: string;
  why: string;
  requirement_type: string;
  citations: Citation[];
  missing_information: string[];
  conflicts: string[];
  evidence_status: string;
  has_authoritative_source: boolean;
}

export interface SystemStats {
  active_events: number;
  active_documents: number;
  procedural_chunks: number;
  needs_information_events: number;
  ready_events: number;
}
