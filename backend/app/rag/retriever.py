import math
import re
from typing import List, Dict, Any, Optional, Tuple
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Authority weights
AUTHORITY_WEIGHTS = {
    "Institutional Policy": 1.0,
    "Official Regulation": 0.95,
    "Department Policy": 0.85,
    "Official Circular": 0.80,
    "Procedure": 0.75,
    "Guideline": 0.65,
    "Form": 0.55,
    "Reference": 0.45
}

class RetrievedChunkResult:
    def __init__(
        self,
        chunk_id: str,
        document_id: str,
        document_title: str,
        version: str,
        authority_level: str,
        section: Optional[str],
        procedure: Optional[str],
        authority: Optional[str],
        page_number: Optional[int],
        source_location: Optional[str],
        content: str,
        score: float,
        is_active: bool,
        is_superseded: bool,
        preconditions: List[str] = [],
        requirements: List[str] = [],
        deadline: Optional[str] = None
    ):
        self.chunk_id = chunk_id
        self.document_id = document_id
        self.document_title = document_title
        self.version = version
        self.authority_level = authority_level
        self.section = section
        self.procedure = procedure
        self.authority = authority
        self.page_number = page_number
        self.source_location = source_location
        self.content = content
        self.score = score
        self.is_active = is_active
        self.is_superseded = is_superseded
        self.preconditions = preconditions
        self.requirements = requirements
        self.deadline = deadline

class HybridRetriever:
    @staticmethod
    def tokenize(text: str) -> List[str]:
        return re.findall(r"\b\w{2,}\b", text.lower())

    @classmethod
    def search(
        cls,
        query: str,
        chunks_metadata: List[Dict[str, Any]],
        top_k: int = 6,
        filter_active_only: bool = True
    ) -> List[RetrievedChunkResult]:
        """Perform hybrid BM25 + Vector retrieval with authority and version weighting."""
        if not chunks_metadata:
            return []

        # Filter by active status if requested
        candidates = chunks_metadata
        if filter_active_only:
            active_candidates = [c for c in candidates if c.get("is_active", True) and not c.get("is_superseded", False)]
            if active_candidates:
                candidates = active_candidates

        if not candidates:
            return []

        corpus = [c["content"] for c in candidates]
        tokenized_corpus = [cls.tokenize(doc) for doc in corpus]
        tokenized_query = cls.tokenize(query)

        if not tokenized_query:
            return []

        # 1. BM25 Scoring
        bm25 = BM25Okapi(tokenized_corpus)
        bm25_scores = bm25.get_scores(tokenized_query)
        max_bm25 = max(bm25_scores) if len(bm25_scores) > 0 and max(bm25_scores) > 0 else 1.0
        normalized_bm25 = [s / max_bm25 for s in bm25_scores]

        # 2. TF-IDF Cosine Similarity
        try:
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(corpus)
            query_vec = vectorizer.transform([query])
            cos_scores = cosine_similarity(query_vec, tfidf_matrix)[0]
        except Exception:
            cos_scores = [0.0] * len(candidates)

        results: List[RetrievedChunkResult] = []

        for i, chunk in enumerate(candidates):
            bm_score = normalized_bm25[i]
            vec_score = float(cos_scores[i])
            hybrid_score = (bm_score * 0.5) + (vec_score * 0.5)

            # Apply Authority level multiplier
            authority_level = chunk.get("authority_level", "Guideline")
            auth_weight = AUTHORITY_WEIGHTS.get(authority_level, 0.6)
            
            # Penalize superseded versions
            if chunk.get("is_superseded", False):
                auth_weight *= 0.3

            final_score = hybrid_score * auth_weight

            # Threshold for relevancy
            if final_score > 0.04 or bm_score > 0.15 or vec_score > 0.12:
                results.append(RetrievedChunkResult(
                    chunk_id=chunk["id"],
                    document_id=chunk["document_id"],
                    document_title=chunk["document_title"],
                    version=chunk.get("version", "v1.0"),
                    authority_level=authority_level,
                    section=chunk.get("section"),
                    procedure=chunk.get("procedure"),
                    authority=chunk.get("authority"),
                    page_number=chunk.get("page_number"),
                    source_location=chunk.get("source_location"),
                    content=chunk["content"],
                    score=final_score,
                    is_active=chunk.get("is_active", True),
                    is_superseded=chunk.get("is_superseded", False),
                    preconditions=chunk.get("preconditions", []),
                    requirements=chunk.get("requirements", []),
                    deadline=chunk.get("deadline")
                ))

        # Rank by final score descending
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]
