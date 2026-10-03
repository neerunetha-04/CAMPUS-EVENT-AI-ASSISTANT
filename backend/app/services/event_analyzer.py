from typing import List, Dict, Any, Optional, Tuple
from app.database.models import Event, ChecklistItem, DocumentChunk, Document
from app.rag.retriever import HybridRetriever, RetrievedChunkResult
from app.rag.conflict_detector import ConflictDetector, DetectedConflict
from app.schemas.event import MissingFieldInfo, EventReadinessSummary

class EventAnalyzerService:
    @classmethod
    def analyze_event(
        cls,
        event: Event,
        all_chunks: List[Dict[str, Any]],
        existing_items: List[ChecklistItem] = []
    ) -> Tuple[List[Dict[str, Any]], List[MissingFieldInfo], EventReadinessSummary, List[DetectedConflict]]:
        """Perform comprehensive grounded evaluation of event against institutional documents."""

        # 1. Detect Missing Information with Document-Grounded Explanations
        missing_fields = cls._detect_missing_fields(event, all_chunks)

        # 2. Check for relevant procedural chunks based on event aspects
        checklist_data = cls._synthesize_checklist(event, all_chunks)

        # 3. Detect any policy conflicts across corpus that affect this event
        conflicts = ConflictDetector.analyze_chunks(all_chunks)
        relevant_conflicts = cls._filter_relevant_conflicts(event, conflicts)

        # 4. Calculate Readiness Summary & Planning Status
        readiness = cls._calculate_readiness(event, checklist_data, missing_fields, relevant_conflicts)

        return checklist_data, missing_fields, readiness, relevant_conflicts

    @classmethod
    def _detect_missing_fields(cls, event: Event, all_chunks: List[Dict[str, Any]]) -> List[MissingFieldInfo]:
        missing: List[MissingFieldInfo] = []

        # Check Event Date
        if not event.event_date:
            missing.append(MissingFieldInfo(
                field_key="event_date",
                label="Event Date",
                step=2,
                step_name="Date & Schedule",
                importance="Critical",
                reason="Institutional venue and approval policies enforce minimum notice submission windows (typically 7-14 days prior). Planning cannot verify timeline compliance without an event date.",
                source_citation="Auditorium Booking Policy & Campus Event Regulations"
            ))

        # Check Preferred Venue
        if not event.preferred_venue:
            missing.append(MissingFieldInfo(
                field_key="preferred_venue",
                label="Preferred Venue",
                step=3,
                step_name="Venue & Attendance",
                importance="Critical",
                reason="Capacity limits, safety protocols, and facility reservation clearances are strictly venue-specific. Applicable regulations cannot be determined without a designated venue.",
                source_citation="Campus Facility Usage Policy"
            ))

        # Check Expected Attendance
        if event.expected_attendance is None or event.expected_attendance <= 0:
            missing.append(MissingFieldInfo(
                field_key="expected_attendance",
                label="Expected Attendance",
                step=3,
                step_name="Venue & Attendance",
                importance="Critical",
                reason="Institutional safety policies trigger mandatory crowd-management, security personnel ratios, and fire safety clearances whenever attendance thresholds are met.",
                source_citation="Campus Safety & Fire Regulations"
            ))

        # Check Organizing Department
        if not event.organizing_department:
            missing.append(MissingFieldInfo(
                field_key="organizing_department",
                label="Organizing Department / Club",
                step=1,
                step_name="Event Overview",
                importance="Critical",
                reason="Official approvals require an institutional administrative unit or recognized student body sponsor to accept fiduciary and behavioral accountability.",
                source_citation="Student Activity & Governance Rules"
            ))

        # Check Contact Information
        if not event.contact_email:
            missing.append(MissingFieldInfo(
                field_key="contact_email",
                label="Primary Contact Email",
                step=1,
                step_name="Event Overview",
                importance="Recommended",
                reason="Official correspondence, confirmation circulars, and emergency contact registries require an active institutional email address.",
                source_citation="Event Permission Procedure"
            ))

        # Check Funding Source if budget is specified
        if event.estimated_budget and event.estimated_budget > 0 and not event.funding_source:
            missing.append(MissingFieldInfo(
                field_key="funding_source",
                label="Funding Source",
                step=5,
                step_name="Budget & Funding",
                importance="Critical",
                reason="Institutional finance guidelines require clear delineation between student activity funds, departmental grants, and external sponsorships prior to financial commitments.",
                source_citation="Institutional Finance & Sponsorship Rules"
            ))

        # Check Guest Details if external guests flagged
        if event.has_external_guests and not event.guest_details:
            missing.append(MissingFieldInfo(
                field_key="guest_details",
                label="External Guest & Speaker Details",
                step=3,
                step_name="Venue & Attendance",
                importance="Critical",
                reason="Security and institutional protocol circulars mandate advance vetting of non-campus dignitaries, speakers, and media personnel.",
                source_citation="External Speaker Clearance Guidelines"
            ))

        return missing

    @classmethod
    def _synthesize_checklist(cls, event: Event, all_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Synthesize official, conditional, and optional requirements strictly grounded in the document corpus."""
        items: List[Dict[str, Any]] = []

        # Helper to search corpus
        def find_best_chunk(query: str) -> Optional[RetrievedChunkResult]:
            hits = HybridRetriever.search(query=query, chunks_metadata=all_chunks, top_k=1)
            return hits[0] if hits else None

        # 1. Base Mandatory Requirement: Event Permission Form
        p_hit = find_best_chunk("event permission proposal submission form approval dean student affairs")
        items.append({
            "title": "Submit Official Event Proposal & Permission Form",
            "description": "File the formal institutional event permission proposal with the designated administrative authority.",
            "requirement_type": "mandatory",
            "status": "pending",
            "trigger": "All on-campus organized events",
            "source": p_hit.document_title if p_hit else "Campus Event Policy",
            "source_version": p_hit.version if p_hit else "v1.0",
            "authority": p_hit.authority if p_hit else "Office of Student Affairs",
            "deadline_if_documented": p_hit.deadline if p_hit and p_hit.deadline else "At least 14 days prior to event date",
            "owner_if_documented": "Lead Event Organizer",
            "citation_chunk_id": p_hit.chunk_id if p_hit else None,
            "excerpt": p_hit.content if p_hit else "Event proposals must be submitted through the official portal with faculty advisor endorsement prior to event scheduling."
        })

        # 2. Mandatory Venue Reservation & Agreement
        if event.preferred_venue:
            v_hit = find_best_chunk(f"venue booking reservation procedure {event.preferred_venue} facilities approval")
            items.append({
                "title": f"Reserve Designated Venue: {event.preferred_venue}",
                "description": f"Submit venue booking requisition to Facilities Division and ensure clearance for {event.preferred_venue}.",
                "requirement_type": "mandatory",
                "status": "pending",
                "trigger": f"Venue selection: {event.preferred_venue}",
                "source": v_hit.document_title if v_hit else "Venue Usage Rules",
                "source_version": v_hit.version if v_hit else "v1.0",
                "authority": v_hit.authority if v_hit else "Facilities Management Division",
                "deadline_if_documented": v_hit.deadline if v_hit and v_hit.deadline else "At least 7 business days prior",
                "owner_if_documented": "Facilities Officer & Event Organizer",
                "citation_chunk_id": v_hit.chunk_id if v_hit else None,
                "excerpt": v_hit.content if v_hit else "All venue allocations must be formalized through the Facilities Management portal."
            })

        # 3. Conditional: External Guests / Speakers
        if event.has_external_guests or event.has_speakers or event.has_vips or event.external_participants:
            g_hit = find_best_chunk("external speaker guest clearance protocol security background approval")
            items.append({
                "title": "Obtain External Speaker & VIP Clearance",
                "description": "Submit guest biography, affiliation, and topic outline to Campus Administration and Security for institutional clearance.",
                "requirement_type": "conditional",
                "status": "pending",
                "trigger": "Event involves external speakers, VIPs, or non-campus dignitaries",
                "source": g_hit.document_title if g_hit else "External Speaker Clearance Guidelines",
                "source_version": g_hit.version if g_hit else "v1.0",
                "authority": g_hit.authority if g_hit else "Dean of Student Affairs / Security Division",
                "deadline_if_documented": g_hit.deadline if g_hit and g_hit.deadline else "At least 10 business days prior",
                "owner_if_documented": "Organizing Committee",
                "citation_chunk_id": g_hit.chunk_id if g_hit else None,
                "excerpt": g_hit.content if g_hit else "Events hosting external speakers or VIP guests require advance institutional vetting and security briefing."
            })

        # 4. Conditional: Large Crowd / Fire Safety / Medical Standby
        attendance = event.expected_attendance or 0
        if attendance >= 200 or event.large_crowd:
            s_hit = find_best_chunk("crowd management fire safety paramedic medical standby security officers attendance exceeding")
            items.append({
                "title": "Establish Crowd Safety & Paramedic Standby Plan",
                "description": f"Submit crowd control protocol to Campus Security. Attendance of {attendance} triggers mandatory safety marshals and medical post assignment.",
                "requirement_type": "conditional",
                "status": "pending",
                "trigger": f"Expected attendance ({attendance}) exceeds institutional crowd safety threshold (200+)",
                "source": s_hit.document_title if s_hit else "Campus Safety & Fire Regulations",
                "source_version": s_hit.version if s_hit else "v1.0",
                "authority": s_hit.authority if s_hit else "Campus Safety and Security Office",
                "deadline_if_documented": s_hit.deadline if s_hit and s_hit.deadline else "At least 5 business days prior",
                "owner_if_documented": "Chief Security Officer",
                "citation_chunk_id": s_hit.chunk_id if s_hit else None,
                "excerpt": s_hit.content if s_hit else "Events exceeding 200 persons require on-site safety stewards, clear egress corridors, and primary medical support standby."
            })

        # 5. Conditional: Food & Catering Authorization
        if event.catering or event.food_served:
            c_hit = find_best_chunk("catering food service licensed vendor food safety hygiene permit")
            items.append({
                "title": "Secure Catering & Food Safety Approval",
                "description": "Verify external caterer holds valid municipal health license and submit food handling undertaking to campus health services.",
                "requirement_type": "conditional",
                "status": "pending",
                "trigger": "Food or beverage service indicated for the event",
                "source": c_hit.document_title if c_hit else "Campus Catering & Hygiene Guidelines",
                "source_version": c_hit.version if c_hit else "v1.0",
                "authority": c_hit.authority if c_hit else "Campus Health & Sanitation Office",
                "deadline_if_documented": c_hit.deadline if c_hit and c_hit.deadline else "At least 7 days prior",
                "owner_if_documented": "Catering Coordinator",
                "citation_chunk_id": c_hit.chunk_id if c_hit else None,
                "excerpt": c_hit.content if c_hit else "All food provided on campus premises must originate from verified licensed caterers compliant with institutional hygiene standards."
            })

        # 6. Conditional: Electrical, Audio, Stage Equipment
        if event.electrical_equipment or event.stage or event.lighting or event.audio_system:
            e_hit = find_best_chunk("electrical equipment load inspection stage rigging safety certificate facilities")
            items.append({
                "title": "Obtain Electrical & Stage Safety Clearance",
                "description": "Request Estate Office electrical engineer to inspect power cabling, heavy AV load, and temporary staging stability.",
                "requirement_type": "conditional",
                "status": "pending",
                "trigger": "High-power AV, stage construction, or electrical equipment requested",
                "source": e_hit.document_title if e_hit else "Facilities Electrical & Infrastructure Rules",
                "source_version": e_hit.version if e_hit else "v1.0",
                "authority": e_hit.authority if e_hit else "Facilities Management - Electrical Division",
                "deadline_if_documented": e_hit.deadline if e_hit and e_hit.deadline else "At least 48 hours prior to setup",
                "owner_if_documented": "Technical In-Charge",
                "citation_chunk_id": e_hit.chunk_id if e_hit else None,
                "excerpt": e_hit.content if e_hit else "Temporary electrical cabling, lighting rigs, and stage installations must undergo technical inspection before public energization."
            })

        # 7. Conditional: Budget, Sponsorship, or Registration Revenue
        if event.has_sponsorship or (event.estimated_budget and event.estimated_budget > 0) or (event.registration_fee and event.registration_fee > 0):
            b_hit = find_best_chunk("financial procedures sponsorship contract budget reconciliation accounts office finance")
            items.append({
                "title": "Submit Itemized Budget & Sponsorship Agreement",
                "description": "Provide detailed income-expense projection and formal sponsorship agreements to the Finance Office for compliance verification.",
                "requirement_type": "conditional",
                "status": "pending",
                "trigger": "Event involves external sponsorship, commercial revenue, or campus funding allocation",
                "source": b_hit.document_title if b_hit else "Institutional Finance & Sponsorship Rules",
                "source_version": b_hit.version if b_hit else "v1.0",
                "authority": b_hit.authority if b_hit else "Finance & Accounts Office",
                "deadline_if_documented": b_hit.deadline if b_hit and b_hit.deadline else "At least 14 days prior to event",
                "owner_if_documented": "Treasurer / Financial Secretary",
                "citation_chunk_id": b_hit.chunk_id if b_hit else None,
                "excerpt": b_hit.content if b_hit else "Events securing external sponsorships or levying fees must deposit agreements with the Finance Office and undergo post-event audit."
            })

        # 8. Conditional: Overnight Activity
        if event.overnight_activity:
            o_hit = find_best_chunk("overnight activity permission provost campus security curfew after hours")
            items.append({
                "title": "Request Special Overnight Activity Permit",
                "description": "Obtain written authorization from the Dean and Chief Warden for student presence and venue operation past campus curfew hours.",
                "requirement_type": "conditional",
                "status": "pending",
                "trigger": "Activity planned to extend past curfew / overnight",
                "source": o_hit.document_title if o_hit else "Campus Security & Curfew Policy",
                "source_version": o_hit.version if o_hit else "v1.0",
                "authority": o_hit.authority if o_hit else "Dean of Student Affairs & Chief Warden",
                "deadline_if_documented": o_hit.deadline if o_hit and o_hit.deadline else "At least 10 business days prior",
                "owner_if_documented": "Faculty Sponsor",
                "citation_chunk_id": o_hit.chunk_id if o_hit else None,
                "excerpt": o_hit.content if o_hit else "Any student activity continuing between 22:00 and 06:00 requires extraordinary authorization from the Dean and dedicated security monitoring."
            })

        # 9. Optional Suggestions (Strictly labeled as Optional)
        pub_hit = find_best_chunk("publicity posters campus banners notice board guidelines")
        items.append({
            "title": "Reserve Campus Notice Boards & Digital Signage",
            "description": "Submit poster designs to Student Affairs for stamping and display on authorized campus bulletin boards.",
            "requirement_type": "optional",
            "status": "pending",
            "trigger": "Optional promotional outreach",
            "source": pub_hit.document_title if pub_hit else "Campus Publicity Guidelines",
            "source_version": pub_hit.version if pub_hit else "v1.0",
            "authority": pub_hit.authority if pub_hit else "Communications & PR Office",
            "deadline_if_documented": None,
            "owner_if_documented": None,
            "citation_chunk_id": pub_hit.chunk_id if pub_hit else None,
            "excerpt": pub_hit.content if pub_hit else "Clubs may reserve designated promotional kiosks and digital signboards subject to space availability."
        })

        if event.photography or event.video_recording:
            items.append({
                "title": "Coordinate University Media Archive Coverage",
                "description": "Invite institutional media team to archive event photographs for the university annual report.",
                "requirement_type": "optional",
                "status": "pending",
                "trigger": "Photography or recording requested",
                "source": "Campus Communications Handbook",
                "source_version": "v1.0",
                "authority": "Media Relations",
                "deadline_if_documented": None,
                "owner_if_documented": None,
                "citation_chunk_id": None,
                "excerpt": "Media team can be requested to provide official archival coverage for department milestones."
            })

        return items

    @classmethod
    def _filter_relevant_conflicts(cls, event: Event, conflicts: List[DetectedConflict]) -> List[DetectedConflict]:
        relevant = []
        for c in conflicts:
            # Check if conflict topic pertains to current event choices
            if "venue" in c.topic.lower() and event.preferred_venue:
                relevant.append(c)
            elif "speaker" in c.topic.lower() and (event.has_external_guests or event.has_speakers):
                relevant.append(c)
            elif "catering" in c.topic.lower() and (event.catering or event.food_served):
                relevant.append(c)
            elif "crowd" in c.topic.lower() and ((event.expected_attendance or 0) > 100 or event.large_crowd):
                relevant.append(c)
            elif "budget" in c.topic.lower() and (event.estimated_budget or event.has_sponsorship):
                relevant.append(c)
            else:
                # Include general conflicts
                relevant.append(c)
        return relevant

    @classmethod
    def _calculate_readiness(
        cls,
        event: Event,
        checklist_data: List[Dict[str, Any]],
        missing_fields: List[MissingFieldInfo],
        conflicts: List[DetectedConflict]
    ) -> EventReadinessSummary:
        mandatory_items = [i for i in checklist_data if i["requirement_type"] == "mandatory"]
        conditional_items = [i for i in checklist_data if i["requirement_type"] == "conditional"]
        optional_items = [i for i in checklist_data if i["requirement_type"] == "optional"]

        total_mandatory = len(mandatory_items)
        completed_mandatory = sum(1 for i in mandatory_items if i.get("status") == "complete")

        total_conditional = len(conditional_items)
        completed_conditional = sum(1 for i in conditional_items if i.get("status") == "complete")

        critical_missing = [m for m in missing_fields if m.importance == "Critical"]
        conflict_count = len(conflicts)

        # Genuine mathematical readiness score calculation
        score = 0
        if total_mandatory > 0:
            score += int((completed_mandatory / total_mandatory) * 50)
        else:
            score += 50

        # Penalize for missing critical fields
        missing_penalty = min(30, len(critical_missing) * 10)
        field_score = max(0, 30 - missing_penalty)
        score += field_score

        # Conditional bonus / penalty
        if total_conditional > 0:
            score += int((completed_conditional / total_conditional) * 15)
        else:
            score += 15

        # Unresolved conflicts penalty
        if conflict_count > 0:
            unresolved = sum(1 for c in conflicts if not c.is_resolvable)
            if unresolved > 0:
                score = max(0, score - 15)

        score = min(100, max(0, score))

        # Determine planning status
        if len(critical_missing) > 0:
            planning_status = "Needs Information"
        elif conflict_count > 0 and any(not c.is_resolvable for c in conflicts):
            planning_status = "Conflict Detected"
        elif completed_mandatory == total_mandatory and len(critical_missing) == 0:
            planning_status = "Ready for Submission"
        elif len(checklist_data) > 0:
            planning_status = "Requirements Identified"
        else:
            planning_status = "Draft"

        notes = []
        if critical_missing:
            notes.append(f"{len(critical_missing)} critical event parameters must be provided before procedural clearance can be finalized.")
        if conflicts:
            notes.append(f"{len(conflicts)} policy discrepancies detected between institutional documents.")
        if completed_mandatory < total_mandatory:
            notes.append(f"{total_mandatory - completed_mandatory} mandatory requirements remain incomplete.")

        return EventReadinessSummary(
            planning_status=planning_status,
            readiness_score=score,
            total_mandatory=total_mandatory,
            completed_mandatory=completed_mandatory,
            total_conditional=total_conditional,
            completed_conditional=completed_conditional,
            total_optional=len(optional_items),
            missing_critical_count=len(critical_missing),
            conflict_count=conflict_count,
            source_count=len(set(i.get("source") for i in checklist_data if i.get("source"))),
            ready_for_submission=(planning_status == "Ready for Submission"),
            summary_notes=notes
        )
