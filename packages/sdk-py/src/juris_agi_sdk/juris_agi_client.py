"""
JURIS-AGI API Client for Python.
"""

from typing import Any, Callable, Optional

import httpx

from .types import AnalyzeRequest, AnalyzeResponse


class JurisAgiError(Exception):
    """Error from JURIS-AGI API."""

    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.status_code = status_code


class JurisAgiClient:
    """
    Client for the JURIS-AGI API.

    Example:
        async with JurisAgiClient(base_url="...") as client:
            result = await client.analyze(deal_id="my-deal")
    """

    def __init__(
        self,
        base_url: str,
        auth_token: Optional[str] = None,
        timeout: float = 60.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.auth_token = auth_token
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self) -> "JurisAgiClient":
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

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
            raise JurisAgiError(message, response.status_code)
        return response.json()

    async def health(self) -> dict:
        """Health check."""
        return await self._request("GET", "/api/health")

    async def analyze(
        self,
        deal_id: str,
        question: Optional[str] = None,
        claims: Optional[list[dict[str, Any]]] = None,
        **kwargs,
    ) -> AnalyzeResponse:
        """Run JURIS-AGI analysis on a deal."""
        request = AnalyzeRequest(
            deal_id=deal_id,
            question=question,
            claims=claims,
            **kwargs,
        )
        data = await self._request(
            "POST",
            "/api/analyze",
            json=request.model_dump(exclude_none=True),
        )
        return AnalyzeResponse(**data)

    async def analyze_stream(
        self,
        deal_id: str,
        question: Optional[str] = None,
        on_event: Optional[Callable[[str], None]] = None,
        **kwargs,
    ) -> None:
        """Stream analysis results."""
        request = AnalyzeRequest(deal_id=deal_id, question=question, **kwargs)

        async with self.client.stream(
            "POST",
            "/api/analyze/stream",
            json=request.model_dump(exclude_none=True),
        ) as response:
            if not response.is_success:
                raise JurisAgiError(f"HTTP {response.status_code}", response.status_code)

            async for chunk in response.aiter_text():
                if on_event:
                    on_event(chunk)

    async def build_context(
        self,
        deal_id: str,
        question: Optional[str] = None,
        max_claims: int = 100,
        min_confidence: float = 0.5,
    ) -> dict:
        """Build evidence context for analysis."""
        return await self._request(
            "POST",
            "/api/context/build",
            json={
                "deal_id": deal_id,
                "question": question,
                "max_claims": max_claims,
                "min_confidence": min_confidence,
            },
        )

    async def generate_report(
        self,
        analysis_id: str,
        format: str = "markdown",
        include_sections: Optional[list[str]] = None,
    ) -> dict:
        """Generate analysis report."""
        payload: dict[str, Any] = {"analysis_id": analysis_id, "format": format}
        if include_sections:
            payload["include_sections"] = include_sections

        return await self._request("POST", "/api/reports/generate", json=payload)
