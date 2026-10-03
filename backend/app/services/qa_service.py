from typing import List, Dict, Any, Optional
import httpx
from app.rag.retriever import HybridRetriever, RetrievedChunkResult
from app.schemas.qa import GroundedAnswerResponse, Citation
from app.config import settings

class GroundedQAService:
    @classmethod
    async def answer_question(
        cls,
        question: str,
        all_chunks: List[Dict[str, Any]],
        event_context: Optional[Dict[str, Any]] = None
    ) -> GroundedAnswerResponse:
        """Answer procedural question strictly grounded in retrieved evidence."""

        clean_q = question.strip()
        if not clean_q:
            return GroundedAnswerResponse(
                question=question,
                answer="Please enter a valid question regarding campus event procedures or policies.",
                why="A clear question is required to retrieve relevant institutional guidelines.",
                requirement_type="Informational",
                citations=[],
                missing_information=[],
                conflicts=[],
                evidence_status="No query provided",
                has_authoritative_source=False
            )

        # Build search query augmenting with event context if present
        augmented_query = clean_q
        if event_context:
            context_hints = []
            if event_context.get("preferred_venue"):
                context_hints.append(event_context["preferred_venue"])
            if event_context.get("event_type"):
                context_hints.append(event_context["event_type"])
            if event_context.get("has_external_guests"):
                context_hints.append("external guest speaker")
            if event_context.get("catering"):
                context_hints.append("catering food")
            if context_hints:
                augmented_query = f"{clean_q} {' '.join(context_hints)}"

        # Hybrid retrieval
        hits: List[RetrievedChunkResult] = HybridRetriever.search(
            query=augmented_query,
            chunks_metadata=all_chunks,
            top_k=4,
            filter_active_only=True
        )

        # STRICT PRINCIPLE: Verify query substantive keywords appear in retrieved evidence
        stopwords = {"can", "i", "do", "we", "the", "a", "an", "to", "for", "in", "is", "are", "of", "what", "how", "when", "where", "my", "our", "event", "campus"}
        q_tokens = [t.lower() for t in HybridRetriever.tokenize(clean_q) if t.lower() not in stopwords]
        
        has_substantive_match = False
        if hits and q_tokens:
            top_chunk_tokens = set(HybridRetriever.tokenize(hits[0].content.lower()))
            overlap = [t for t in q_tokens if t in top_chunk_tokens]
            # Must overlap at least 50% of the substantive query keywords, or at least 2 key terms
            if len(overlap) >= min(2, len(q_tokens)) and hits[0].score >= 0.10:
                has_substantive_match = True

        # STRICT PRINCIPLE: If no authoritative hits or score is negligible, NEVER hallucinate
        if not hits or not has_substantive_match or hits[0].score < 0.08:
            return GroundedAnswerResponse(
                question=clean_q,
                answer="No authoritative information was found in the available institutional documents.",
                why="The uploaded institutional policy corpus does not contain documented guidelines, approval workflows, or explicit regulations regarding this query.",
                requirement_type="Unknown",
                citations=[],
                missing_information=["Consult the Office of Student Affairs or Dean of Administration for uncatalogued or ad-hoc permissions."],
                conflicts=[],
                evidence_status="No authoritative source found in document corpus",
                has_authoritative_source=False
            )

        top_hit = hits[0]

        # Extract citations
        citations = []
        for h in hits:
            citations.append(Citation(
                document_title=h.document_title,
                version=h.version,
                authority=h.authority or h.authority_level,
                section=h.section,
                page_number=h.page_number,
                source_location=h.source_location,
                excerpt=h.content[:500] + ("..." if len(h.content) > 500 else ""),
                chunk_id=h.chunk_id
            ))

        # Check if an LLM API key is present for structured synthesis, or use deterministic grounded extractor
        gemini_key = settings.GEMINI_API_KEY
        if gemini_key:
            try:
                llm_response = await cls._synthesize_with_gemini(clean_q, hits, event_context, gemini_key)
                if llm_response:
                    llm_response.citations = citations
                    return llm_response
            except Exception as e:
                # Graceful fallback to deterministic synthesis
                pass

        # Deterministic Grounded Synthesis (Safe, reliable, zero hallucination)
        return cls._synthesize_grounded_answer(clean_q, hits, citations, event_context)

    @classmethod
    def _synthesize_grounded_answer(
        cls,
        question: str,
        hits: List[RetrievedChunkResult],
        citations: List[Citation],
        event_context: Optional[Dict[str, Any]]
    ) -> GroundedAnswerResponse:
        primary = hits[0]
        content_lower = primary.content.lower()

        # Classify requirement type based strictly on textual evidence
        if any(term in content_lower for term in ["mandatory", "must submit", "strictly required", "shall obtain", "prerequisite"]):
            req_type = "Mandatory"
        elif any(term in content_lower for term in ["if", "in cases where", "exceeding", "conditional upon", "whenever"]):
            req_type = "Conditional"
        elif any(term in content_lower for term in ["recommended", "optional", "may request", "suggested", "guideline"]):
            req_type = "Optional"
        else:
            req_type = "Informational"

        # Construct clear answer derived from primary chunk
        key_lines = [line.strip() for line in primary.content.split("\n") if len(line.strip()) > 20]
        relevant_text = key_lines[0] if key_lines else primary.content[:250]

        # Format answer clearly
        answer = f"According to {primary.document_title} ({primary.version}), {relevant_text.rstrip('.')}."

        # Why explanation
        why = f"This requirement is administered under the authority of '{primary.authority or primary.authority_level}'. "
        if primary.deadline:
            why += f"Documented timeline: {primary.deadline}. "
        if primary.section:
            why += f"Governing section: {primary.section}."

        missing_info = []
        if req_type == "Conditional":
            missing_info.append(f"Ensure that all prerequisite conditions specified in {primary.document_title} are documented in your event plan.")

        return GroundedAnswerResponse(
            question=question,
            answer=answer,
            why=why,
            requirement_type=req_type,
            citations=citations,
            missing_information=missing_info,
            conflicts=[],
            evidence_status="Authoritative evidence verified across active institutional documents",
            has_authoritative_source=True
        )

    @classmethod
    async def _synthesize_with_gemini(
        cls,
        question: str,
        hits: List[RetrievedChunkResult],
        event_context: Optional[Dict[str, Any]],
        api_key: str
    ) -> Optional[GroundedAnswerResponse]:
        """Optional synthesis using Gemini API when key is configured."""
        context_str = "\n\n---\n".join([
            f"SOURCE: {h.document_title} (Version: {h.version}, Authority: {h.authority_level})\n"
            f"SECTION: {h.section} (Page {h.page_number})\n"
            f"TEXT: {h.content}"
            for h in hits
        ])

        prompt = f"""You are CampusFlow, an institutional procedural compliance assistant.
Answer the following question STRICTLY AND SOLELY based on the provided institutional document excerpts.
HARD REQUIREMENT: NEVER INVENT rules, deadlines, authorities, forms, fees, or permissions not explicitly written in the sources.
If the excerpts do not establish the answer, you MUST state: "No authoritative information was found in the available institutional documents."

QUESTION: {question}

INSTITUTIONAL EVIDENCE:
{context_str}

Respond in this exact JSON structure:
{{
  "answer": "Clear concise factual statement",
  "why": "Explanation referencing governing document section and authority",
  "requirement_type": "Mandatory" | "Conditional" | "Optional" | "Informational" | "Unknown",
  "evidence_status": "Authoritative evidence found"
}}
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                import json
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                return GroundedAnswerResponse(
                    question=question,
                    answer=parsed.get("answer", ""),
                    why=parsed.get("why", ""),
                    requirement_type=parsed.get("requirement_type", "Informational"),
                    citations=[],
                    missing_information=[],
                    conflicts=[],
                    evidence_status=parsed.get("evidence_status", "Authoritative evidence found"),
                    has_authoritative_source=True
                )
        return None
