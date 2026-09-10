"""Small, dependency-backed smoke tests for the Flask application factory.

These tests intentionally exercise only route registration and the local health
endpoint. The test cases do not call the AI provider, Firebase, MySQL, or any
other external service; app initialization may still import optional integration
modules while registering routes.
"""

import os
import sys
import unittest
from importlib import import_module
from pathlib import Path
from unittest.mock import patch


# Resolve the backend package without requiring a package installation or
# changing the application's import layout.
BACKEND_ROOT = Path(__file__).resolve().parents[1]


def build_test_app():
    """Create the app with temporary test-only environment and import path."""
    with patch.dict(os.environ, {"DB_TYPE": "memory"}):
        with patch.object(sys, "path", [str(BACKEND_ROOT), *sys.path]):
            create_app = import_module("app").create_app
            app = create_app()

    app.config.update(TESTING=True)
    return app


class AppSmokeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = build_test_app()
        cls.client = cls.app.test_client()

    def test_health_endpoint_returns_healthy(self):
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json().get("status"), "healthy")

    def test_app_setup_restores_process_state(self):
        original_db_type = os.environ.get("DB_TYPE")
        original_sys_path = sys.path

        build_test_app()

        self.assertEqual(os.environ.get("DB_TYPE"), original_db_type)
        self.assertIs(sys.path, original_sys_path)

    def test_app_setup_restores_process_state_when_creation_fails(self):
        original_db_type = os.environ.get("DB_TYPE")
        original_sys_path = sys.path
        app_module = import_module("app")

        with patch.object(
            app_module,
            "create_app",
            side_effect=RuntimeError("simulated app factory failure"),
        ):
            with self.assertRaisesRegex(RuntimeError, "simulated app factory failure"):
                build_test_app()

        self.assertEqual(os.environ.get("DB_TYPE"), original_db_type)
        self.assertIs(sys.path, original_sys_path)

    def test_expected_core_routes_are_registered(self):
        registered_methods = {}
        for rule in self.app.url_map.iter_rules():
            registered_methods.setdefault(rule.rule, set()).update(rule.methods)

        expected_methods = {
            "/api/coach/chat": {"POST"},
            "/api/coach/health": {"GET"},
            "/api/assessment/submit": {"POST"},
            "/api/assessment/latest": {"GET"},
            "/api/assessment/history": {"GET"},
            "/api/dashboard/overview": {"GET"},
            "/api/dashboard/goals": {"GET", "POST"},
        }

        missing_routes = sorted(set(expected_methods) - set(registered_methods))
        missing_methods = {
            route: sorted(methods - registered_methods.get(route, set()))
            for route, methods in expected_methods.items()
            if methods - registered_methods.get(route, set())
        }

        self.assertFalse(
            missing_routes or missing_methods,
            msg=(
                f"Missing routes: {missing_routes}; "
                f"missing methods: {missing_methods}"
            ),
        )


if __name__ == "__main__":
    unittest.main()
