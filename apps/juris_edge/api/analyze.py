"""
JURIS-AGI Analyze endpoint.

Vercel Python serverless function that exposes the JURIS-AGI analysis capabilities.
"""

import json
import sys
from pathlib import Path

# Add python directory to path for imports
python_path = Path(__file__).parent.parent / "python"
sys.path.insert(0, str(python_path))

from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    """Vercel serverless function handler for /api/analyze."""

    def do_POST(self):
        """Handle POST requests for analysis."""
        try:
            # Parse request body
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}

            # Import JURIS-AGI modules
            from juris_agi.evidence_client import EvidenceApiClient, ContextConstraints
            from juris_agi.controller import Controller

            # Extract parameters
            deal_id = data.get("deal_id")
            question = data.get("question")
            claims = data.get("claims")  # Optional: direct claims for demo mode

            if not deal_id:
                self._send_error(400, "deal_id is required")
                return

            # Build response
            result = {
                "status": "success",
                "deal_id": deal_id,
                "question": question,
                "message": "JURIS-AGI analysis endpoint ready",
                # Actual analysis would be added here
            }

            self._send_json(200, result)

        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON")
        except ImportError as e:
            self._send_error(500, f"Module import error: {str(e)}")
        except Exception as e:
            self._send_error(500, str(e))

    def do_GET(self):
        """Handle GET requests - health check."""
        self._send_json(200, {
            "status": "ok",
            "service": "juris-agi-analyze",
            "version": "1.0.0"
        })

    def _send_json(self, status: int, data: dict):
        """Send JSON response."""
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_error(self, status: int, message: str):
        """Send error response."""
        self._send_json(status, {"error": message})
