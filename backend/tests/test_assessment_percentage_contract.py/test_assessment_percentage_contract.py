"""Assessment score contract tests across the UI payload, route, and data service.

The assessment page sends a four-point ``scores`` map for backend analysis and
the separately calculated ``total_score_percentage`` that its history chart
renders on a 0-100 axis.  These tests use the real development in-memory
``UserDataService`` behind the Flask blueprint so the submit -> storage -> read
cycle is covered without Firebase or MySQL.
"""
import os
import sys

import pytest
from flask import Flask


BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_ROOT)

from app.routes import assessment_routes
from app.services import firestore_service
from app.services.user_data_service import user_data_service


QUESTION_CATEGORIES = (
    "savings",
    "risk",
    "emergency",
    "debt",
    "knowledge",
    "income",
    "goals",
    "tracking",
    "insurance",
    "pressure",
)


@pytest.fixture(autouse=True)
def isolated_development_store(monkeypatch):
    """Keep the real in-memory service deterministic between test cases."""
    monkeypatch.setenv("DEV_MODE", "true")
    monkeypatch.delenv("DB_TYPE", raising=False)
    firestore_service._dev_db["users"].clear()
    yield
    firestore_service._dev_db["users"].clear()


@pytest.fixture
def client():
    app = Flask(__name__)
    app.config.update(TESTING=True, DEV_MODE=True)
    app.register_blueprint(
        assessment_routes.assessment_bp, url_prefix="/api/assessment"
    )
    return app.test_client()


def frontend_assessment_payload(score=4):
    """Mirror Assessment.handleSaveResult's payload shape and score scale."""
    return {
        "assessment": {
            "answers": {
                str(index): {
                    "optionId": "d" if score == 4 else "c",
                    "score": score,
                    "category": category,
                }
                for index, category in enumerate(QUESTION_CATEGORIES, start=1)
            },
            "scores": {category: score for category in QUESTION_CATEGORIES},
            "categoryScores": {
                category: score * 25 for category in QUESTION_CATEGORIES
            },
            "total_score_percentage": score * 25,
        }
    }


def test_frontend_percentage_survives_submit_storage_and_history_read(client):
    """A UI 100% result must stay 100% when the history chart reads it back.

    This is the cross-module contract: Assessment.js -> api.js -> Flask route
    -> UserDataService -> Flask history response.  Before the fix, the final
    history value was 4.0 because the route overwrote the UI percentage with
    the four-point average score.
    """
    submitted = client.post("/api/assessment/submit", json=frontend_assessment_payload())
    assert submitted.status_code == 200

    history = client.get("/api/assessment/history")
    assert history.status_code == 200
    assert history.get_json()["history"][0]["total_score_percentage"] == 100


def test_pre_fix_persisted_four_point_percentage_is_normalized_on_read(client):
    """Old records keep their average score but are displayed on the % scale.

    Earlier server versions stored the four-point average in both
    ``total_score`` and the misnamed percentage field.  The read compatibility
    path must correct that presentation-only value without rewriting the
    historical record or changing ``total_score`` for dashboard consumers.
    """
    legacy_record = {
        "answers": {"1": {"score": 3, "category": "savings"}},
        "scores": {"savings": 3},
        "total_score": 3.0,
        "total_score_percentage": 3.0,
        "category_scores_percentage": {"savings": 75},
        "recommendations": [],
        "completed": True,
    }
    saved, _ = user_data_service.save_user_data(
        "test_user_id", "assessments", legacy_record
    )
    assert saved is True

    history = client.get("/api/assessment/history")
    latest = client.get("/api/assessment/latest")

    assert history.status_code == 200
    assert latest.status_code == 200
    assert history.get_json()["history"][0]["total_score_percentage"] == 75.0
    assert latest.get_json()["assessment"]["total_score_percentage"] == 75.0
    assert latest.get_json()["assessment"]["total_score"] == 3.0
