import os
from pathlib import Path
from sqlalchemy.orm import Session
from app.database.models import Document, DocumentVersion, DocumentChunk, AuditLog
from app.documents.chunker import ProceduralChunker
from app.documents.extractor import ExtractedPage
from app.config import UPLOAD_DIR

# Sample documents strictly labeled as DEMO DOCUMENT / TEST DOCUMENT per requirement #4
SAMPLE_DOCUMENTS = [
    {
        "title": "DEMO DOCUMENT: Auditorium & Campus Venue Booking Policy",
        "department": "Facilities Management Division",
        "document_type": "Policy",
        "authority_level": "Institutional Policy",
        "version_number": "v2.0",
        "effective_date": "2025-01-01",
        "is_active": True,
        "is_superseded": False,
        "content": """DEMO DOCUMENT - FOR TESTING AND DEMONSTRATION PURPOSES ONLY.
NOT AN OFFICIAL INSTITUTIONAL POLICY UNLESS FORMALLY RATIFIED.

Section 1: General Provisions and Venue Hierarchy
The Facilities Management Division oversees all physical academic halls, open auditoriums, amphitheaters, and meeting spaces. All student, departmental, and external event reservations must be processed through the central venue scheduling portal.

Section 2: Booking Notice Timelines and Deadlines
Venue booking requisitions for the Main Auditorium, Grand Hall, and Seminar Complex must be submitted at least 14 days prior to the proposed event date. Requisitions submitted under 14 days will be automatically declined unless an extraordinary waiver is approved in writing by the Campus Registrar.

Section 3: Mandatory Preconditions and Security Deposit
Every approved auditorium reservation requires:
1. Formal endorsement from the Dean of Student Affairs or academic department chair.
2. A refundable security deposit of $250 deposited to the Cashier's Office at least 5 business days prior to setup.
3. Written undertaking acknowledging liability for equipment and upholstery.

Section 4: Technical and Rigging Clearance
Any event requiring stage rigging, elevated scaffolding, supplemental lighting rigs, or external sound amplification exceeding 1000 Watts must obtain written technical clearance from the Facilities Electrical Engineer at least 48 hours prior to load-in.

Section 5: Cancellation and Rescheduling Policy
Cancellations must be notified in writing at least 72 hours before the scheduled setup time to be eligible for a full refund of security deposits."""
    },
    {
        "title": "DEMO DOCUMENT: Student Club & Activity Regulations",
        "department": "Office of the Dean of Student Affairs",
        "document_type": "Regulation",
        "authority_level": "Official Regulation",
        "version_number": "v3.1",
        "effective_date": "2025-02-15",
        "is_active": True,
        "is_superseded": False,
        "content": """DEMO DOCUMENT - FOR TESTING AND DEMONSTRATION PURPOSES ONLY.
NOT AN OFFICIAL INSTITUTIONAL POLICY UNLESS FORMALLY RATIFIED.

Section 1: Club Event Authorization Workflow
All student club events, workshops, technical competitions, and cultural celebrations require prior institutional authorization. The Lead Event Organizer must submit the Event Permission Form through the Student Affairs portal no later than 14 business days before the scheduled date.

Section 2: External Speakers, Dignitaries, and Media Guests
Whenever an event involves external speakers, political dignitaries, corporate VIPs, or non-campus performers:
1. The organizing committee must submit the speaker's CV, affiliation, and speaking topic outline to the Dean of Student Affairs.
2. Submission must occur at least 10 business days prior to public announcement or advertising.
3. The Campus Safety and Security Office must issue written clearance before invitations are formalized.

Section 3: Overnight and Late-Night Activities
Any student event extending beyond the standard campus curfew hours (22:00 / 10:00 PM) requires a Special Overnight Permit approved by the Dean of Student Affairs and the Chief Proctor. Overnight activities are restricted to enclosed, designated zones with assigned faculty chaperones.

Section 4: Publicity, Posters, and Banners
No posters, digital billboards, or banners may be distributed across campus until the stamped Event Permission Form is validated by the Communications Office. Unauthorized banners will be confiscated and result in club probationary review."""
    },
    {
        "title": "DEMO DOCUMENT: Campus Safety, Crowd Management & Fire Rules",
        "department": "Campus Safety and Security Office",
        "document_type": "Policy",
        "authority_level": "Institutional Policy",
        "version_number": "v1.5",
        "effective_date": "2024-09-01",
        "is_active": True,
        "is_superseded": False,
        "content": """DEMO DOCUMENT - FOR TESTING AND DEMONSTRATION PURPOSES ONLY.
NOT AN OFFICIAL INSTITUTIONAL POLICY UNLESS FORMALLY RATIFIED.

Section 1: Crowd Thresholds and Security Marshal Requirements
Safety protocols are graduated according to expected attendance:
1. Events with attendance exceeding 200 participants require at least 4 certified student marshals and 2 Campus Security officers assigned to entrance vestibules.
2. Events with attendance exceeding 500 participants require a formal crowd safety plan, fire marshal on-site walk-through, and dedicated ambulance/paramedic standby post.

Section 2: Fire Safety and Electrical Standards
Open flames, pyrotechnics, smoke machines, and unauthorized extension cords are strictly prohibited across all university indoor venues. All electrical equipment must be grounded and bear approved electrical safety inspection tags.

Section 3: Emergency Egress and Corridor Clearance
All fire exits, egress doors, and aisles must remain entirely unobstructed by chairs, temporary displays, or cabling. Any venue found violating exit clearance will be closed immediately by the Security Division."""
    },
    {
        "title": "DEMO DOCUMENT: Institutional Finance, Sponsorship & Catering Rules",
        "department": "Finance & Accounts Office",
        "document_type": "Regulation",
        "authority_level": "Official Regulation",
        "version_number": "v1.0",
        "effective_date": "2024-11-01",
        "is_active": True,
        "is_superseded": False,
        "content": """DEMO DOCUMENT - FOR TESTING AND DEMONSTRATION PURPOSES ONLY.
NOT AN OFFICIAL INSTITUTIONAL POLICY UNLESS FORMALLY RATIFIED.

Section 1: External Sponsorship Protocols
Clubs and departments soliciting corporate sponsorships or financial partnerships must submit draft contracts to the Finance Office at least 14 days prior to signing. Commercial logos and advertisements must conform to university branding guidelines.

Section 2: Food Handling and Catering Permits
All food and refreshments provided during campus gatherings must be procured through university-approved catering contractors or vendors holding current municipal health licenses. Homemade or uninspected commercial food distribution is strictly prohibited.

Section 3: Post-Event Financial Reconciliation
A complete itemized expenditure statement along with original tax receipts must be submitted to the Accounts Department within 10 business days of event conclusion."""
    },
    {
        "title": "DEMO DOCUMENT: Legacy Venue Usage Circular (Superseded)",
        "department": "Facilities Management Division",
        "document_type": "Circular",
        "authority_level": "Official Circular",
        "version_number": "v1.0",
        "effective_date": "2022-03-01",
        "is_active": False,
        "is_superseded": True,
        "content": """DEMO DOCUMENT - FOR TESTING AND DEMONSTRATION PURPOSES ONLY.
SUPERSEDED NOTICE: THIS CIRCULAR HAS BEEN SUPERSEDED BY AUDITORIUM POLICY V2.0.

Section 1: Previous Venue Booking Timeline
Notice: Venue booking requisitions for halls and auditoriums must be submitted at least 7 days before the event.
Note: Superseded by 2025 Policy requiring 14 days notice. Kept for institutional historical archive and conflict resolution demonstration."""
    }
]

def seed_demo_documents(db: Session):
    """Seed test documents if corpus is empty."""
    existing_count = db.query(Document).count()
    if existing_count > 0:
        return

    for doc_data in SAMPLE_DOCUMENTS:
        # Save file to disk
        file_name = f"{doc_data['title'].replace(' ', '_').replace(':', '')[:50]}.txt"
        file_path = UPLOAD_DIR / file_name
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(doc_data["content"])

        doc = Document(
            title=doc_data["title"],
            department=doc_data["department"],
            document_type=doc_data["document_type"],
            authority_level=doc_data["authority_level"],
            status="Active" if doc_data["is_active"] else "Superseded",
            file_name=file_name,
            file_path=str(file_path),
            file_size=len(doc_data["content"]),
            is_demo=True,
            active_version=doc_data["version_number"]
        )
        db.add(doc)
        db.flush()

        version = DocumentVersion(
            document_id=doc.id,
            version_number=doc_data["version_number"],
            effective_date=doc_data["effective_date"],
            published_date=doc_data["effective_date"],
            is_active=doc_data["is_active"],
            is_superseded=doc_data["is_superseded"],
            file_path=str(file_path),
            notes="Demo document for testing grounded compliance"
        )
        db.add(version)
        db.flush()

        # Chunk document
        pages = [ExtractedPage(page_number=1, text=doc_data["content"])]
        chunks = ProceduralChunker.chunk_document(
            document_id=doc.id,
            version_id=version.id,
            pages=pages,
            default_authority=doc_data["authority_level"],
            effective_date=doc_data["effective_date"]
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
            action="SEED_DEMO_DOCUMENT",
            details=f"Seeded demo document '{doc.title}' with {len(chunks)} procedural chunks.",
            actor="System Init"
        )
        db.add(audit)

    db.commit()
