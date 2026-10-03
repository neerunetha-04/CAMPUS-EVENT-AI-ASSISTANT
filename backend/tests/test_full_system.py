import os
import sys
import unittest
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.session import SessionLocal, init_db
from app.database.models import Event, Document, DocumentChunk, ChecklistItem
from app.api.demo import seed_demo_documents
from app.api.events import get_all_chunks_metadata
from app.services.event_analyzer import EventAnalyzerService
from app.services.qa_service import GroundedQAService
from app.rag.conflict_detector import ConflictDetector
from app.services.export_service import ExportService

class TestCampusFlowSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.db = SessionLocal()
        seed_demo_documents(cls.db)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_document_corpus_and_chunking(self):
        """Verify institutional documents are processed into procedural chunks."""
        docs = self.db.query(Document).all()
        self.assertGreaterEqual(len(docs), 5, "Should have at least 5 institutional documents")

        chunks = self.db.query(DocumentChunk).all()
        self.assertGreaterEqual(len(chunks), 15, "Should have extracted procedural chunks")

        # Verify procedural units (authorities, deadlines, preconditions)
        has_authority = any(c.authority is not None for c in chunks)
        has_deadline = any(c.deadline is not None for c in chunks)
        self.assertTrue(has_authority, "Chunks must contain extracted authorities")
        self.assertTrue(has_deadline, "Chunks must contain extracted deadlines")

    def test_02_conflict_detection_and_precedence(self):
        """Verify cross-document conflict detection and precedence analysis."""
        chunks_meta = get_all_chunks_metadata(self.db)
        conflicts = ConflictDetector.analyze_chunks(chunks_meta)

        self.assertGreaterEqual(len(conflicts), 1, "Should detect at least 1 conflict (7 vs 14 day venue notice)")
        conflict = conflicts[0]
        self.assertIn("Venue", conflict.topic)
        self.assertTrue(conflict.is_resolvable, "Superseded notice should be resolvable via metadata")
        self.assertIn("superseded", conflict.resolution_explanation.lower())

    def test_03_grounded_qa_with_evidence(self):
        """Verify grounded QA returns citations and correct classification when evidence exists."""
        chunks_meta = get_all_chunks_metadata(self.db)
        question = "Do I need approval for an external speaker?"
        
        answer = asyncio.run(GroundedQAService.answer_question(question, chunks_meta))
        self.assertTrue(answer.has_authoritative_source)
        self.assertIn("Mandatory", answer.requirement_type)
        self.assertGreaterEqual(len(answer.citations), 1)
        self.assertIn("Student Club", answer.citations[0].document_title)

    def test_04_zero_hallucination_guarantee(self):
        """Verify zero hallucination when query has no backing evidence in corpus."""
        chunks_meta = get_all_chunks_metadata(self.db)
        fake_question = "Can I bring a pet elephant into the auditorium?"
        
        answer = asyncio.run(GroundedQAService.answer_question(fake_question, chunks_meta))
        self.assertFalse(answer.has_authoritative_source)
        self.assertEqual(answer.requirement_type, "Unknown")
        self.assertIn("No authoritative information was found", answer.answer)
        self.assertEqual(len(answer.citations), 0)

    def test_05_event_intake_and_readiness_synthesis(self):
        """Verify event intake evaluates rules and computes genuine readiness score."""
        chunks_meta = get_all_chunks_metadata(self.db)

        # Test incomplete event (missing date, venue, attendance)
        draft_event = Event(
            name="Incomplete Workshop",
            event_type="Workshop",
            organizing_department="Computer Science Club"
        )
        self.db.add(draft_event)
        self.db.commit()

        items, missing, readiness, conflicts = EventAnalyzerService.analyze_event(draft_event, chunks_meta)
        self.assertEqual(readiness.planning_status, "Needs Information")
        self.assertGreaterEqual(len(missing), 2, "Must flag missing critical parameters")
        self.assertLess(readiness.readiness_score, 70, "Incomplete event cannot have high readiness")

        # Now configure event with venue, attendance, and external guests
        draft_event.event_date = "2026-11-20"
        draft_event.preferred_venue = "Main University Auditorium"
        draft_event.expected_attendance = 350
        draft_event.has_external_guests = True
        draft_event.catering = True
        self.db.commit()

        items2, missing2, readiness2, conflicts2 = EventAnalyzerService.analyze_event(draft_event, chunks_meta)
        
        # Verify conditional requirements triggered
        titles = [i["title"] for i in items2]
        self.assertTrue(any("External Speaker" in t for t in titles), "External guests must trigger speaker clearance")
        self.assertTrue(any("Crowd Safety" in t for t in titles), "Attendance 350 must trigger crowd safety plan")
        self.assertTrue(any("Catering" in t for t in titles), "Catering flag must trigger food safety approval")

    def test_06_export_dossier(self):
        """Verify export dossier structure."""
        event = self.db.query(Event).first()
        items = self.db.query(ChecklistItem).all()
        chunks_meta = get_all_chunks_metadata(self.db)
        items_data, missing, readiness, conflicts = EventAnalyzerService.analyze_event(event, chunks_meta)

        dossier = ExportService.generate_export_payload(
            event=event,
            items=items,
            missing_fields=[m.model_dump() for m in missing],
            conflicts=[],
            readiness=readiness.model_dump()
        )
        self.assertIn("project_name", dossier)
        self.assertIn("checklist", dossier)
        self.assertIn("mandatory", dossier["checklist"])

if __name__ == "__main__":
    unittest.main()
