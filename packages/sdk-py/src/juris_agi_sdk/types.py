"""
Shared types for JURIS-AGI SDK.

These types are derived from the OpenAPI specs in @juris-agi/contracts.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


# ============================================================================
# Evidence API Types
# ============================================================================


class ClaimPolarity(str, Enum):
    """Polarity of a claim relative to investment thesis."""

    SUPPORTIVE = "supportive"
    RISK = "risk"
    NEUTRAL = "neutral"


class ConfidenceLevel(str, Enum):
    """Confidence level for a claim."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ConflictType(str, Enum):
    """Type of conflict between claims."""

    CONTRADICTION = "contradiction"
    INCONSISTENCY = "inconsistency"
    TEMPORAL = "temporal"
    SOURCE_DISAGREEMENT = "source_disagreement"


class DocumentType(str, Enum):
    """Type of document."""

    PITCH_DECK = "pitch_deck"
    FINANCIAL_MODEL = "financial_model"
    LEGAL = "legal"
    OTHER = "other"


class DocumentStatus(str, Enum):
    """Status of document processing."""

    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class Citation(BaseModel):
    """A citation linking a claim to its source document."""

    citation_id: str
    claim_id: str
    document_id: str
    document_type: str
    locator: str
    quote: str
    extraction_date: Optional[datetime] = None


class TimeSeriesPoint(BaseModel):
    """A single point in a time series."""

    t: str
    value: float
    confidence: float = 1.0


class Claim(BaseModel):
    """A structured claim extracted from evidence documents."""

    claim_id: str
    claim_type: str
    field: str
    value: Any
    confidence: float = Field(ge=0.0, le=1.0)
    polarity: ClaimPolarity
    unit: Optional[str] = None
    as_of_date: Optional[datetime] = None
    citations: list[Citation] = Field(default_factory=list)
    timeseries: Optional[list[TimeSeriesPoint]] = None

    @property
    def confidence_level(self) -> ConfidenceLevel:
        """Convert numeric confidence to categorical level."""
        if self.confidence >= 0.8:
            return ConfidenceLevel.HIGH
        elif self.confidence >= 0.5:
            return ConfidenceLevel.MEDIUM
        return ConfidenceLevel.LOW


class Conflict(BaseModel):
    """A detected conflict between two or more claims."""

    conflict_id: str
    conflict_type: ConflictType
    claim_ids: list[str] = Field(min_length=2)
    description: str
    severity: float = Field(ge=0.0, le=1.0)
    resolution_hint: Optional[str] = None


class ContextConstraints(BaseModel):
    """Constraints for building an evidence context."""

    max_claims: int = Field(default=100, ge=1, le=1000)
    per_bucket_cap: int = Field(default=20, ge=1, le=100)
    min_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    include_conflicts: bool = True
    include_citations: bool = True
    claim_types: Optional[list[str]] = None
    exclude_claim_types: Optional[list[str]] = None


class ContextRequest(BaseModel):
    """Request to build an evidence context for a deal/question."""

    deal_id: str
    question: Optional[str] = None
    constraints: ContextConstraints = Field(default_factory=ContextConstraints)


class ContextSummary(BaseModel):
    """Summary statistics for an evidence context."""

    total_claims: int
    claims_by_type: dict[str, int] = Field(default_factory=dict)
    claims_by_polarity: dict[str, int] = Field(default_factory=dict)
    avg_confidence: float
    conflict_count: int = 0
    document_count: int = 0


class ContextResponse(BaseModel):
    """Response from POST /context endpoint."""

    context_id: str
    claims: list[Claim]
    conflicts: list[Conflict] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)
    summary: ContextSummary


class Document(BaseModel):
    """A document in the evidence repository."""

    document_id: str
    filename: str
    project_id: str
    document_type: Optional[DocumentType] = None
    status: DocumentStatus
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    page_count: Optional[int] = None
    file_size: Optional[int] = None


class SearchRequest(BaseModel):
    """Request for semantic search."""

    query: str
    project_id: Optional[str] = None
    document_types: Optional[list[str]] = None
    limit: int = 10
    min_score: float = 0.5


class SearchResult(BaseModel):
    """A single search result."""

    document_id: str
    chunk_id: str
    score: float
    text: str
    metadata: Optional[dict[str, Any]] = None


class SearchResponse(BaseModel):
    """Response from semantic search."""

    results: list[SearchResult]
    total_count: Optional[int] = None
    query: Optional[str] = None


# ============================================================================
# JURIS-AGI Types
# ============================================================================


class AnalysisType(str, Enum):
    """Type of analysis to perform."""

    FULL = "full"
    QUICK = "quick"
    TARGETED = "targeted"


class ReasoningStepType(str, Enum):
    """Type of reasoning step."""

    OBSERVATION = "observation"
    HYPOTHESIS = "hypothesis"
    VERIFICATION = "verification"
    CONCLUSION = "conclusion"
    WARNING = "warning"


class FindingCategory(str, Enum):
    """Category of finding."""

    STRENGTH = "strength"
    WEAKNESS = "weakness"
    OPPORTUNITY = "opportunity"
    THREAT = "threat"
    NEUTRAL = "neutral"


class FindingSeverity(str, Enum):
    """Severity of finding."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class Recommendation(str, Enum):
    """Investment recommendation."""

    STRONG_INVEST = "strong_invest"
    INVEST = "invest"
    NEUTRAL = "neutral"
    CAUTION = "caution"
    STRONG_AVOID = "strong_avoid"


class AnalysisConstraints(BaseModel):
    """Constraints for analysis."""

    max_claims: int = 100
    min_confidence: float = 0.5
    focus_areas: Optional[list[str]] = None


class AnalyzeRequest(BaseModel):
    """Request to run JURIS-AGI analysis."""

    deal_id: str
    question: Optional[str] = None
    claims: Optional[list[dict[str, Any]]] = None
    analysis_type: AnalysisType = AnalysisType.FULL
    include_reasoning: bool = True
    constraints: AnalysisConstraints = Field(default_factory=AnalysisConstraints)


class ReasoningStep(BaseModel):
    """A step in the reasoning trace."""

    step_id: str
    type: ReasoningStepType
    content: str
    confidence: Optional[float] = None
    supporting_claims: list[str] = Field(default_factory=list)
    timestamp: Optional[datetime] = None


class Finding(BaseModel):
    """A finding from analysis."""

    finding_id: str
    category: FindingCategory
    title: str
    description: str
    severity: FindingSeverity
    confidence: Optional[float] = None
    supporting_claims: list[str] = Field(default_factory=list)
    reasoning_trace: list[ReasoningStep] = Field(default_factory=list)


class AnalyzeResponse(BaseModel):
    """Response from JURIS-AGI analysis."""

    analysis_id: str
    deal_id: str
    status: str
    summary: Optional[str] = None
    recommendation: Optional[Recommendation] = None
    confidence: Optional[float] = None
    findings: list[Finding] = Field(default_factory=list)
    reasoning_trace: list[ReasoningStep] = Field(default_factory=list)
    conflicts_detected: list[dict[str, Any]] = Field(default_factory=list)
    claims_analyzed: Optional[int] = None
    created_at: Optional[datetime] = None
