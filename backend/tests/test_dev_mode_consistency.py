"""Regression tests for the development-auth boundary shared by API modules.

The development launch scripts set DEV_MODE as an environment variable.
Assessment routes already honored that source, while Dashboard routes only
looked at Flask config and returned 401 in the same process. These tests use
the real blueprints together, without Firebase or a database, to lock the
cross-module behavior and the production-compatible 401 path.
"""

import sys
from pathlib import Path

import pytest
from flask import Flask

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.routes import assessment_routes, dashboard_routes


@pytest.fixture
def app(monkeypatch):
    monkeypatch.setenv("DB_TYPE", "memory")
    flask_app = Flask(__name__)
    flask_app.config.update(TESTING=True)
    flask_app.register_blueprint(
        assessment_routes.assessment_bp, url_prefix="/api/assessment"
    )
    flask_app.register_blueprint(
        dashboard_routes.dashboard_bp, url_prefix="/api/dashboard"
    )
    return flask_app


def test_dev_environment_bypass_is_consistent_across_modules(app, monkeypatch):
    """The same dev process must reach both assessment and Dashboard APIs."""
    monkeypatch.setenv("DEV_MODE", "true")
    client = app.test_client()

    assessment = client.get("/api/assessment/history")
    dashboard = client.get("/api/dashboard/overview")

    assert assessment.status_code == 200
    assert dashboard.status_code == 200
    assert dashboard.get_json()["data"]["user_id"] == "test_user_id"


def test_without_dev_mode_both_modules_keep_authentication_boundary(app, monkeypatch):
    """Unset/false DEV_MODE still requires the existing auth token."""
    monkeypatch.delenv("DEV_MODE", raising=False)
    app.config["DEV_MODE"] = False
    client = app.test_client()

    assessment = client.get("/api/assessment/history")
    dashboard = client.get("/api/dashboard/overview")

    assert assessment.status_code == 401
    assert dashboard.status_code == 401
