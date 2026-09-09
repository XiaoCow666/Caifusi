"""Small, dependency-backed smoke tests for the Flask application factory.

These tests intentionally exercise only route registration and the local health
endpoint. They do not call the AI provider, Firebase, MySQL, or any other
external service.
"""

import os
import sys
import unittest
from pathlib import Path


# Allow the test command to be run from the repository root without requiring
# a package installation or changing the application's import layout.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# Keep this smoke test deterministic and prevent an inherited developer
# environment from initializing MySQL or another persistent backend.
os.environ["DB_TYPE"] = "memory"

from app import create_app  # noqa: E402


class AppSmokeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config.update(TESTING=True)
        cls.client = cls.app.test_client()

    def test_health_endpoint_returns_healthy(self):
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json().get("status"), "healthy")

    def test_expected_core_routes_are_registered(self):
        registered_routes = {rule.rule for rule in self.app.url_map.iter_rules()}
        expected_routes = {
            "/api/coach/chat",
            "/api/coach/health",
            "/api/assessment/submit",
            "/api/assessment/latest",
            "/api/assessment/history",
            "/api/dashboard/overview",
            "/api/dashboard/goals",
        }

        self.assertTrue(
            expected_routes.issubset(registered_routes),
            msg=f"Missing routes: {sorted(expected_routes - registered_routes)}",
        )


if __name__ == "__main__":
    unittest.main()
