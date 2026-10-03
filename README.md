# CampusFlow — Campus Event Planning Assistant

**CampusFlow** is a production-grade, evidence-backed campus event planning and procedural compliance platform. It bridges the gap between complex institutional documents (venue policies, student club guidelines, fire safety circulars, finance protocols) and event organizers by converting official requirements into a grounded, traceable, multi-step planning checklist.

---

## 1. Core Problem & Principle

### The Challenge
Campus event procedures, approval requirements, venue rules, safety measures, budget caps, and administrative workflows are distributed across disconnected institutional circulars, PDFs, and handbooks. Students and faculty frequently struggle with unexpected booking rejections, missed deadlines, or unapproved guest clearance.

### Hard Principle: Zero Hallucinated Institutional Information
CampusFlow strictly adheres to an uncompromising rule:
* The system **never** invents approval authorities, deadlines, fees, permits, forms, or policies.
* If a requirement cannot be substantiated by verified documents in the repository, CampusFlow explicitly reports:  
  **"No authoritative information was found in the available institutional documents."**
* Every procedural assertion links directly to an authoritative source citation (document title, ratified version, section, page number, and verbatim excerpt).

---

## 2. Key Capabilities

* **Guided 10-Step Event Intake**: Step-by-step intake covering Overview, Schedule, Venue & Attendance, Resources & Facilities, Budget & Funding, Special Circumstances, Analysis, Checklist, Conflicts, and Final Readiness Review.
* **Live Desktop Split-Screen Assistant**: Live dynamic analysis updates in real-time as fields change (e.g., increasing attendance above 200 immediately triggers crowd management marshals and medical post assignment).
* **Missing Information Detection**: Detects missing parameters and provides document-grounded explanations why each field is mandatory.
* **Classification Taxonomy**:
  * **Mandatory Requirements**: Institutional directives directly supported by authoritative documents.
  * **Conditional Requirements**: Triggered only when specific criteria are met (external guests, large crowds, catering, electrical rigging).
  * **Optional Recommendations**: Non-mandatory suggestions (media archives, banner reservations).
  * **Unknown**: Aspects not addressed in the uploaded repository.
* **Cross-Document Conflict Engine**: Identifies policy discrepancies across versions and departments (e.g., 7 days vs 14 days venue notice), presents side-by-side comparisons, and analyzes administrative precedence.
* **Document Management & Inspection**: Upload PDF, DOCX, TXT, and Markdown files; view chunk units, authority tags, preconditions, and deadlines in the Document Inspector.
* **Printable / Exportable Dossier**: Generates a formal, print-ready compliance dossier and JSON export.

---

## 3. Technology Stack

### Frontend
* **Framework**: React 19 + TypeScript + Vite 6
* **Styling**: Tailwind CSS v4 + Custom Dark Theme (Deep Navy `#0a0f1d`, Cyan `#06b6d4`, Teal `#14b8a6`, Rose `#ef4444`)
* **Icons**: Lucide React
* **Build System**: Native TypeScript compiler (`tsc -b`) & Vite bundler

### Backend
* **Framework**: Python 3.13 + FastAPI + Uvicorn
* **Database**: SQLite (WAL mode, parameterized SQLAlchemy ORM, production-swappable to PostgreSQL + pgvector)
* **Document Processing**: `pypdf` (page extraction), `python-docx` (XML table/paragraph extraction)
* **Hybrid RAG Retrieval**: BM25 (`rank-bm25`) + TF-IDF Vector Cosine Similarity (`scikit-learn`) + Authority Level & Version Rank Weighting
* **Anti-Hallucination Guardrails**: Substantive token overlap verification and fallback logic

---

## 4. Folder Structure

```text
campus/
├── .env                  # Local runtime environment
├── .env.example          # Environment template
├── README.md             # Product documentation
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── events.py        # Event CRUD, intake, analyze, checklist, export
│   │   │   ├── documents.py     # Document upload, chunk inspection, status, reindex
│   │   │   ├── qa.py            # Grounded procedural Q&A endpoint
│   │   │   ├── conflicts.py     # Policy conflict detection endpoint
│   │   │   └── demo.py          # Demo document seeder with DEMO labels
│   │   ├── database/
│   │   │   ├── models.py        # SQLAlchemy models (Events, Documents, Chunks, etc.)
│   │   │   └── session.py       # Engine and session initialization
│   │   ├── documents/
│   │   │   ├── cleaner.py       # Text normalization
│   │   │   ├── extractor.py     # PDF, DOCX, TXT, MD extractors
│   │   │   └── chunker.py       # Procedural unit chunker
│   │   ├── rag/
│   │   │   ├── retriever.py     # Hybrid BM25 + Vector cosine similarity
│   │   │   └── conflict_detector.py # Cross-document discrepancy engine
│   │   ├── schemas/             # Pydantic schemas (event, document, checklist, etc.)
│   │   ├── services/
│   │   │   ├── event_analyzer.py# Real-time compliance and readiness scoring
│   │   │   ├── qa_service.py    # Grounded Q&A engine
│   │   │   └── export_service.py# Structured dossier payload generator
│   │   ├── config.py            # Application configuration
│   │   └── main.py              # FastAPI lifespan & startup
│   ├── tests/
│   │   └── test_full_system.py  # Automated integration test suite
│   ├── requirements.txt
│   └── venv/                    # Isolated Python virtual environment
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx       # Navigation and active event switcher
│   │   │   ├── StatusBadge.tsx  # Color and icon status tokens
│   │   │   ├── CitationDrawer.tsx # Traceable excerpt modal
│   │   │   └── EmptyState.tsx   # Contextual empty state component
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # Operational metrics and active events
│   │   │   ├── GuidedEventPlanner.tsx # 10-step intake with live assistant
│   │   │   ├── EventWorkspace.tsx # Checklist completion and readiness
│   │   │   ├── AskAssistant.tsx # Grounded procedural QA interface
│   │   │   ├── DocumentCenter.tsx # Document upload and corpus manager
│   │   │   ├── DocumentInspector.tsx # Chunk inspection and RAG debugger
│   │   │   ├── ConflictCenter.tsx # Discrepancy comparison matrix
│   │   │   └── ExportDossierModal.tsx # Printable / PDF dossier modal
│   │   ├── services/
│   │   │   └── api.ts           # Complete REST API client
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript definitions
│   │   ├── App.tsx              # Main application router
│   │   ├── index.css            # Tailwind v4 styles and print media queries
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── data/
    ├── documents/               # Storage for uploaded policy files
    └── database/                # SQLite database persistence
```

---

## 5. Quickstart & Running the Application

### Prerequisites
* **Python**: 3.11+ (Python 3.13 verified)
* **Node.js**: 20+ (Node v24.15 verified)
* **npm**: 10+

### Step 1: Clone / Navigate to Directory
```powershell
cd c:\Users\ynmne_rou70pp\OneDrive\Desktop\campus
```

### Step 2: Start the Backend Service
From the root directory:
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* **API Documentation (Swagger UI)**: `http://127.0.0.1:8000/docs`
* **Health Check**: `http://127.0.0.1:8000/api/health`

### Step 3: Start the Frontend Application
In a separate terminal:
```powershell
cd frontend
npm run dev
```
* **Application URL**: `http://localhost:5173/`

---

## 6. Running Automated Tests

Run the complete backend integration test suite:
```powershell
cd backend
.\venv\Scripts\python.exe -m unittest tests/test_full_system.py
```

### Verified Test Cases:
1. `test_01_document_corpus_and_chunking`: Validates ingestion, authority tagging, and deadline extraction across institutional files.
2. `test_02_conflict_detection_and_precedence`: Verifies detection of contradictory venue notice deadlines and automated resolution of superseded circulars.
3. `test_03_grounded_qa_with_evidence`: Verifies grounded procedural answers with citations when authoritative documents exist.
4. `test_04_zero_hallucination_guarantee`: Verifies strict fallback ("No authoritative information was found...") for fabricated queries.
5. `test_05_event_intake_and_readiness_synthesis`: Verifies 10-step intake, missing parameter detection, conditional trigger evaluation, and mathematical readiness score computation.
6. `test_06_export_dossier`: Verifies structured print/export generation.

---

## 7. Sample Institutional Documents (Labeled as DEMO)

To demonstrate functionality without fabricating unofficial rules, CampusFlow seeds sample documents clearly labeled as **DEMO DOCUMENT**:
1. `DEMO DOCUMENT: Auditorium & Campus Venue Booking Policy (v2.0)` (Institutional Policy)
2. `DEMO DOCUMENT: Student Club & Activity Regulations (v3.1)` (Official Regulation)
3. `DEMO DOCUMENT: Campus Safety, Crowd Management & Fire Rules (v1.5)` (Institutional Policy)
4. `DEMO DOCUMENT: Institutional Finance, Sponsorship & Catering Rules (v1.0)` (Official Regulation)
5. `DEMO DOCUMENT: Legacy Venue Usage Circular (Superseded) (v1.0)` (Demonstrates version superseding and conflict resolution)

Authorized administrators can upload real university documents (PDF, DOCX, TXT, MD) via the **Document Center** tab.

---

## 8. Security & Production Considerations

* **File Type Validation**: Only searchable `.pdf`, `.docx`, `.txt`, and `.md` files are permitted.
* **Payload Verification**: Enforces 25MB maximum file size and SHA256 checksums to avoid duplicate file processing.
* **Environment Secrets**: API keys are loaded via `.env` and never exposed to the client bundle.
* **Safe Error Handling**: User-facing exceptions provide actionable feedback without exposing internal stack traces.
