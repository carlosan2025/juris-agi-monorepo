"""
Evidence API Client for Python.
"""

from typing import Optional

import httpx

from .types import (
    Claim,
    ContextRequest,
    ContextResponse,
    Document,
    SearchRequest,
    SearchResponse,
)


class EvidenceApiError(Exception):
    """Error from Evidence API."""

    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.status_code = status_code


class EvidenceApiClient:
    """
    Client for the Evidence Repository API.

    Example:
        async with EvidenceApiClient(base_url="...", api_key="...") as client:
            context = await client.create_context(
                deal_id="my-deal",
                question="Should we invest?"
            )
    """

    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        timeout: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self) -> "EvidenceApiClient":
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key

        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=headers,
            timeout=self.timeout,
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            await self._client.aclose()
            self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            raise RuntimeError("Client not initialized. Use 'async with' context.")
        return self._client

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        """Make HTTP request and handle errors."""
        response = await self.client.request(method, path, **kwargs)
        if not response.is_success:
            try:
                error = response.json()
                message = error.get("message", f"HTTP {response.status_code}")
            except Exception:
                message = f"HTTP {response.status_code}"
            raise EvidenceApiError(message, response.status_code)
        return response.json()

    async def health(self) -> dict:
        """Health check."""
        return await self._request("GET", "/api/v1/health")

    async def list_documents(
        self,
        project_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Document]:
        """List documents."""
        params = {"limit": limit, "offset": offset}
        if project_id:
            params["project_id"] = project_id

        data = await self._request("GET", "/api/v1/documents", params=params)
        return [Document(**doc) for doc in data]

    async def get_document(self, document_id: str) -> Document:
        """Get document by ID."""
        data = await self._request("GET", f"/api/v1/documents/{document_id}")
        return Document(**data)

    async def create_context(
        self,
        deal_id: str,
        question: Optional[str] = None,
        **kwargs,
    ) -> ContextResponse:
        """Create evidence context for a deal/question."""
        request = ContextRequest(deal_id=deal_id, question=question, **kwargs)
        data = await self._request(
            "POST",
            "/api/v1/context",
            json=request.model_dump(exclude_none=True),
        )
        return ContextResponse(**data)

    async def get_claim(self, claim_id: str) -> Claim:
        """Get claim by ID."""
        data = await self._request("GET", f"/api/v1/claims/{claim_id}")
        return Claim(**data["claim"])

    async def search(
        self,
        query: str,
        project_id: Optional[str] = None,
        limit: int = 10,
        min_score: float = 0.5,
    ) -> SearchResponse:
        """Semantic search."""
        request = SearchRequest(
            query=query,
            project_id=project_id,
            limit=limit,
            min_score=min_score,
        )
        data = await self._request(
            "POST",
            "/api/v1/search",
            json=request.model_dump(exclude_none=True),
        )
        return SearchResponse(**data)
