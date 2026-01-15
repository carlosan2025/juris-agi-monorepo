"""
JURIS-AGI Python SDK

Provides clients for Evidence API and JURIS-AGI API.

Example usage:

    from juris_agi_sdk import EvidenceApiClient, JurisAgiClient

    # Evidence API
    evidence_client = EvidenceApiClient(
        base_url="https://evidence-api.vercel.app",
        api_key="your-api-key"
    )
    context = await evidence_client.create_context(
        deal_id="my-deal",
        question="Should we invest?"
    )

    # JURIS-AGI API
    juris_client = JurisAgiClient(
        base_url="https://juris-agi.vercel.app"
    )
    result = await juris_client.analyze(deal_id="my-deal")
"""

from .evidence_client import EvidenceApiClient
from .juris_agi_client import JurisAgiClient
from .types import (
    # Evidence types
    Claim,
    ClaimPolarity,
    Citation,
    Conflict,
    ConflictType,
    ContextConstraints,
    ContextRequest,
    ContextResponse,
    ContextSummary,
    Document,
    SearchRequest,
    SearchResponse,
    # JURIS-AGI types
    AnalyzeRequest,
    AnalyzeResponse,
    Finding,
    ReasoningStep,
)

__version__ = "1.0.0"

__all__ = [
    # Clients
    "EvidenceApiClient",
    "JurisAgiClient",
    # Evidence types
    "Claim",
    "ClaimPolarity",
    "Citation",
    "Conflict",
    "ConflictType",
    "ContextConstraints",
    "ContextRequest",
    "ContextResponse",
    "ContextSummary",
    "Document",
    "SearchRequest",
    "SearchResponse",
    # JURIS-AGI types
    "AnalyzeRequest",
    "AnalyzeResponse",
    "Finding",
    "ReasoningStep",
]
