import re
from typing import List, Dict, Any, Optional
from app.rag.retriever import AUTHORITY_WEIGHTS

class DetectedConflict:
    def __init__(
        self,
        topic: str,
        title: str,
        description: str,
        source_a_document: str,
        source_a_version: str,
        source_a_authority: str,
        source_a_text: str,
        source_a_chunk_id: Optional[str],
        source_b_document: str,
        source_b_version: str,
        source_b_authority: str,
        source_b_text: str,
        source_b_chunk_id: Optional[str],
        higher_authority_source: Optional[str],
        is_resolvable: bool,
        resolution_explanation: str
    ):
        self.topic = topic
        self.title = title
        self.description = description
        self.source_a_document = source_a_document
        self.source_a_version = source_a_version
        self.source_a_authority = source_a_authority
        self.source_a_text = source_a_text
        self.source_a_chunk_id = source_a_chunk_id
        self.source_b_document = source_b_document
        self.source_b_version = source_b_version
        self.source_b_authority = source_b_authority
        self.source_b_text = source_b_text
        self.source_b_chunk_id = source_b_chunk_id
        self.higher_authority_source = higher_authority_source
        self.is_resolvable = is_resolvable
        self.resolution_explanation = resolution_explanation

class ConflictDetector:
    # Common procedural topics to scan for discrepancies
    TOPIC_SIGNATURES = [
        {
            "topic": "Venue Booking Notice Deadline",
            "regex": r"(?:auditorium|venue|hall|facility)\s*(?:booking|reservation|application)[^\.\n]*?(?:at least|\bno later than\b|\bwithin\b)?\s*(\d+)\s*(?:business\s*days?|working\s*days?|calendar\s*days?|days?|weeks?)",
            "extract_val": lambda m: m.group(0)
        },
        {
            "topic": "External Speaker Approval Deadline",
            "regex": r"(?:external\s*speaker|guest\s*speaker|external\s*guest)[^\.\n]*?(?:approval|permission|clearance)[^\.\n]*?(\d+)\s*(?:business\s*days?|working\s*days?|days?|weeks?)",
            "extract_val": lambda m: m.group(0)
        },
        {
            "topic": "Food & Catering Authorization",
            "regex": r"(catering|food|refreshments?)\s*(?:must|shall|is strictly|requires?)[^\.\n]*?(?:permitted|prohibited|licensed|approved\s*caterer|external\s*vendors?)",
            "extract_val": lambda m: m.group(0)
        },
        {
            "topic": "Security Deposit or Budget Limit",
            "regex": r"(?:security\s*deposit|budget\s*limit|reimbursement\s*cap)[^\.\n]*?(\$|₹|USD|INR|EUR)?\s*([0-9,]+)",
            "extract_val": lambda m: m.group(0)
        },
        {
            "topic": "Attendance & Crowd Threshold for Fire Safety",
            "regex": r"(?:attendance|crowd|occupancy)\s*(?:exceeding|over|greater than|\babove\b)\s*(\d+)\s*(?:persons?|participants?|attendees?|students?)",
            "extract_val": lambda m: m.group(0)
        }
    ]

    @classmethod
    def analyze_chunks(cls, chunks: List[Dict[str, Any]]) -> List[DetectedConflict]:
        """Scan all chunks across documents to detect institutional discrepancies."""
        detected: List[DetectedConflict] = []

        # Group chunks by topics
        for sig in cls.TOPIC_SIGNATURES:
            topic_name = sig["topic"]
            pattern = re.compile(sig["regex"], re.IGNORECASE)

            # Collect matches across different documents
            matched_items: List[Dict[str, Any]] = []
            for c in chunks:
                text = c["content"]
                m = pattern.search(text)
                if m:
                    extracted = sig["extract_val"](m)
                    matched_items.append({
                        "chunk": c,
                        "match_text": extracted,
                        "full_sentence": cls._extract_surrounding_sentence(text, m.start())
                    })

            # Check for conflicting pairs from different documents
            for i in range(len(matched_items)):
                for j in range(i + 1, len(matched_items)):
                    item_a = matched_items[i]
                    item_b = matched_items[j]

                    chunk_a = item_a["chunk"]
                    chunk_b = item_b["chunk"]

                    # Only compare if different documents or different versions
                    if chunk_a["document_id"] == chunk_b["document_id"] and chunk_a.get("version") == chunk_b.get("version"):
                        continue

                    # If extracted requirements differ substantially
                    if item_a["match_text"].lower().strip() != item_b["match_text"].lower().strip():
                        conflict = cls._evaluate_conflict(
                            topic=topic_name,
                            item_a=item_a,
                            item_b=item_b
                        )
                        # Avoid duplicates
                        if not any(d.topic == conflict.topic and d.source_a_document == conflict.source_a_document and d.source_b_document == conflict.source_b_document for d in detected):
                            detected.append(conflict)

        return detected

    @classmethod
    def _extract_surrounding_sentence(cls, text: str, match_idx: int) -> str:
        # Find start of sentence
        start = max(0, text.rfind(".", 0, match_idx) + 1)
        end = text.find(".", match_idx)
        if end == -1:
            end = len(text)
        else:
            end = end + 1
        return text[start:end].strip()

    @classmethod
    def _evaluate_conflict(cls, topic: str, item_a: Dict[str, Any], item_b: Dict[str, Any]) -> DetectedConflict:
        chunk_a = item_a["chunk"]
        chunk_b = item_b["chunk"]

        auth_a = chunk_a.get("authority_level", "Guideline")
        auth_b = chunk_b.get("authority_level", "Guideline")

        weight_a = AUTHORITY_WEIGHTS.get(auth_a, 0.5)
        weight_b = AUTHORITY_WEIGHTS.get(auth_b, 0.5)

        is_superseded_a = chunk_a.get("is_superseded", False)
        is_superseded_b = chunk_b.get("is_superseded", False)

        higher_auth = None
        is_resolvable = False
        explanation = ""

        # Check superseding version first
        if is_superseded_a and not is_superseded_b:
            higher_auth = f"{chunk_b['document_title']} ({chunk_b.get('version', 'v1')})"
            is_resolvable = True
            explanation = f"{chunk_a['document_title']} {chunk_a.get('version', '')} is marked as superseded. The active document {chunk_b['document_title']} {chunk_b.get('version', '')} governs."
        elif is_superseded_b and not is_superseded_a:
            higher_auth = f"{chunk_a['document_title']} ({chunk_a.get('version', 'v1')})"
            is_resolvable = True
            explanation = f"{chunk_b['document_title']} {chunk_b.get('version', '')} is marked as superseded. The active document {chunk_a['document_title']} {chunk_a.get('version', '')} governs."
        elif weight_a > weight_b + 0.15:
            higher_auth = f"{chunk_a['document_title']} ({auth_a})"
            is_resolvable = True
            explanation = f"'{auth_a}' holds higher administrative authority than '{auth_b}' per institutional policy hierarchy."
        elif weight_b > weight_a + 0.15:
            higher_auth = f"{chunk_b['document_title']} ({auth_b})"
            is_resolvable = True
            explanation = f"'{auth_b}' holds higher administrative authority than '{auth_a}' per institutional policy hierarchy."
        else:
            higher_auth = None
            is_resolvable = False
            explanation = "The available documents do not provide enough evidence to resolve this conflict. Both sources carry comparable authority or lack explicit precedence rules."

        return DetectedConflict(
            topic=topic,
            title=f"Conflicting Requirements: {topic}",
            description=f"Discrepancy found between '{chunk_a['document_title']}' and '{chunk_b['document_title']}'.",
            source_a_document=chunk_a["document_title"],
            source_a_version=chunk_a.get("version", "v1.0"),
            source_a_authority=auth_a,
            source_a_text=item_a["full_sentence"] or item_a["match_text"],
            source_a_chunk_id=chunk_a.get("id"),
            source_b_document=chunk_b["document_title"],
            source_b_version=chunk_b.get("version", "v1.0"),
            source_b_authority=auth_b,
            source_b_text=item_b["full_sentence"] or item_b["match_text"],
            source_b_chunk_id=chunk_b.get("id"),
            higher_authority_source=higher_auth,
            is_resolvable=is_resolvable,
            resolution_explanation=explanation
        )
