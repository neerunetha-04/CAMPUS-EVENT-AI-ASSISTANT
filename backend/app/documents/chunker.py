import re
import uuid
from typing import List, Dict, Any, Optional
from app.documents.extractor import ExtractedPage

class ProceduralChunk:
    def __init__(
        self,
        document_id: str,
        version_id: Optional[str],
        section: str,
        procedure: str,
        authority: str,
        preconditions: List[str],
        requirements: List[str],
        steps: List[str],
        exceptions: List[str],
        deadline: Optional[str],
        effective_date: Optional[str],
        source_location: str,
        page_number: int,
        content: str
    ):
        self.id = str(uuid.uuid4())
        self.document_id = document_id
        self.version_id = version_id
        self.section = section
        self.procedure = procedure
        self.authority = authority
        self.preconditions = preconditions
        self.requirements = requirements
        self.steps = steps
        self.exceptions = exceptions
        self.deadline = deadline
        self.effective_date = effective_date
        self.source_location = source_location
        self.page_number = page_number
        self.content = content
        self.token_count = len(content.split())

class ProceduralChunker:
    # Authority keywords
    AUTHORITY_PATTERNS = [
        r"(Office of the Dean of Student Affairs|Dean of Student Affairs|Dean|Associate Dean)",
        r"(Campus Safety and Security Office|Chief Security Officer|Security Division|Campus Police)",
        r"(Facilities Management Division|Director of Estates|Estate Officer|Venues Office)",
        r"(Finance Office|Chief Financial Officer|Accounts Department|Bursar)",
        r"(Office of the Registrar|University Registrar|Deputy Registrar)",
        r"(Head of Department|HOD|Faculty Advisor|Club Coordinator)",
        r"(Vice-Chancellor|Pro Vice-Chancellor|Provost|Director of Campus)"
    ]

    # Deadline patterns
    DEADLINE_PATTERNS = [
        r"(\d+\s*(?:business\s*days?|working\s*days?|calendar\s*days?|days?|weeks?|months?)\s*(?:prior to|before|in advance of|ahead of)\b[^\.\n]*)",
        r"(no later than\s*\d+\s*(?:days?|weeks?|working days?)\b[^\.\n]*)",
        r"(at least\s*\d+\s*(?:days?|weeks?|working days?)\s*(?:prior|in advance|before)\b[^\.\n]*)"
    ]

    # Precondition patterns
    PRECONDITION_PATTERNS = [
        r"(if\s+[^\.,\n]{5,60}(?:is|are|exceeds?|occurs?|involves?)[^\.,\n]*)",
        r"(for events\s+[^\.,\n]{5,60})",
        r"(whenever\s+[^\.,\n]{5,60})",
        r"(in cases? where\s+[^\.,\n]{5,60})"
    ]

    # Requirement patterns
    REQUIREMENT_PATTERNS = [
        r"([^\.\n]*\b(?:must|shall|is strictly required to|is mandatory to|requires? written approval|submit form)\b[^\.\n]*)",
    ]

    # Exception patterns
    EXCEPTION_PATTERNS = [
        r"(except (?:when|where|for|in cases of)\b[^\.\n]*)",
        r"(unless prior written exemption\b[^\.\n]*)",
        r"(exemptions? may be granted\b[^\.\n]*)"
    ]

    @classmethod
    def chunk_document(
        cls,
        document_id: str,
        version_id: Optional[str],
        pages: List[ExtractedPage],
        default_authority: str = "Institutional Administration",
        effective_date: Optional[str] = None
    ) -> List[ProceduralChunk]:
        """Split extracted pages into meaningful procedural chunks."""
        chunks: List[ProceduralChunk] = []

        # Heading detection regex
        heading_regex = re.compile(
            r"^(?:Section\s+\d+|[0-9]+\.[0-9]+|[0-9]+\.0|[A-Z\s]{4,}|#{1,4}\s+[^\n]+)",
            re.MULTILINE
        )

        for page in pages:
            text = page.text
            # Split page into logical sections by double line breaks or headers
            blocks = [b.strip() for b in text.split("\n\n") if b.strip()]
            
            current_section = f"Page {page.page_number} - General Provisions"
            current_procedure = "Campus Event Procedure"
            current_paragraphs: List[str] = []

            for block in blocks:
                # Check if block starts with a section heading
                lines = block.split("\n")
                first_line = lines[0].strip()

                is_heading = (
                    bool(heading_regex.match(first_line)) or
                    (len(first_line) < 80 and first_line.endswith(":") and len(lines) > 1) or
                    (first_line.isupper() and len(first_line) > 5 and len(first_line) < 80)
                )

                if is_heading and current_paragraphs:
                    # Flush previous chunk
                    full_content = "\n\n".join(current_paragraphs)
                    chunk = cls._build_chunk(
                        document_id=document_id,
                        version_id=version_id,
                        section=current_section,
                        procedure=current_procedure,
                        default_authority=default_authority,
                        effective_date=effective_date,
                        page_number=page.page_number,
                        content=full_content
                    )
                    chunks.append(chunk)
                    current_paragraphs = []

                if is_heading:
                    current_section = first_line.lstrip("#").strip()
                    current_procedure = current_section
                    remaining_text = "\n".join(lines[1:]).strip()
                    if remaining_text:
                        current_paragraphs.append(remaining_text)
                else:
                    current_paragraphs.append(block)

            # Flush any remaining paragraphs on page
            if current_paragraphs:
                full_content = "\n\n".join(current_paragraphs)
                chunk = cls._build_chunk(
                    document_id=document_id,
                    version_id=version_id,
                    section=current_section,
                    procedure=current_procedure,
                    default_authority=default_authority,
                    effective_date=effective_date,
                    page_number=page.page_number,
                    content=full_content
                )
                chunks.append(chunk)

        # Fallback if no chunks generated
        if not chunks and pages:
            for p in pages:
                chunks.append(ProceduralChunk(
                    document_id=document_id,
                    version_id=version_id,
                    section=f"Page {p.page_number}",
                    procedure="General Guidelines",
                    authority=default_authority,
                    preconditions=[],
                    requirements=[],
                    steps=[],
                    exceptions=[],
                    deadline=None,
                    effective_date=effective_date,
                    source_location=f"Page {p.page_number}",
                    page_number=p.page_number,
                    content=p.text
                ))

        return chunks

    @classmethod
    def _build_chunk(
        cls,
        document_id: str,
        version_id: Optional[str],
        section: str,
        procedure: str,
        default_authority: str,
        effective_date: Optional[str],
        page_number: int,
        content: str
    ) -> ProceduralChunk:
        # Extract authority
        authority = default_authority
        for pattern in cls.AUTHORITY_PATTERNS:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                authority = match.group(0).strip()
                break

        # Extract deadline
        deadline = None
        for pattern in cls.DEADLINE_PATTERNS:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                deadline = match.group(0).strip()
                break

        # Extract preconditions
        preconditions = []
        for pattern in cls.PRECONDITION_PATTERNS:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                snippet = match.group(0).strip()
                if len(snippet) < 120 and snippet not in preconditions:
                    preconditions.append(snippet)

        # Extract requirements
        requirements = []
        for pattern in cls.REQUIREMENT_PATTERNS:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                snippet = match.group(0).strip()
                if len(snippet) < 200 and snippet not in requirements:
                    requirements.append(snippet)

        # Extract numbered steps
        steps = []
        step_matches = re.findall(r"(?:^|\n)\s*(?:(?:\d+\.|\([a-z0-9]+\)|Step\s+\d+:))\s*([^\n]+)", content)
        for s in step_matches[:6]:
            if len(s.strip()) > 5:
                steps.append(s.strip())

        # Extract exceptions
        exceptions = []
        for pattern in cls.EXCEPTION_PATTERNS:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                snippet = match.group(0).strip()
                if len(snippet) < 150 and snippet not in exceptions:
                    exceptions.append(snippet)

        source_loc = f"Page {page_number} ({section})"

        return ProceduralChunk(
            document_id=document_id,
            version_id=version_id,
            section=section,
            procedure=procedure,
            authority=authority,
            preconditions=preconditions[:4],
            requirements=requirements[:5],
            steps=steps,
            exceptions=exceptions[:3],
            deadline=deadline,
            effective_date=effective_date,
            source_location=source_loc,
            page_number=page_number,
            content=content
        )
