"""
Health check endpoint for JURIS-AGI.
"""

import json
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    """Health check handler."""

    def do_GET(self):
        """Return health status."""
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "healthy",
            "service": "juris-agi",
            "version": "1.0.0"
        }).encode())
