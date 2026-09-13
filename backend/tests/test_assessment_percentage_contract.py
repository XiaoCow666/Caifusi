"""Cross-module assessment score contract regression tests."""
import os
import sys
import pytest
from flask import Flask

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_ROOT)
from app.routes import assessment_routes
from app.services import firestore_service
from app.services.user_data_service import user_data_service
CATEGORIES = ("savings", "risk", "emergency", "debt", "knowledge", "income", "goals", "tracking", "insurance", "pressure")

@pytest.fixture(autouse=True)
def isolated_store(monkeypatch):
    monkeypatch.setenv("DEV_MODE", "true")
    firestore_service._dev_db["users"].clear()
    yield
    firestore_service._dev_db["users"].clear()

@pytest.fixture
def client():
    app = Flask(__name__)
    app.config.update(TESTING=True, DEV_MODE=True)
    app.register_blueprint(assessment_routes.assessment_bp, url_prefix="/api/assessment")
    return app.test_client()

def frontend_payload(score=4):
    return {"assessment": {"answers": {}, "scores": {c: score for c in CATEGORIES}, "categoryScores": {c: score * 25 for c in CATEGORIES}, "total_score_percentage": score * 25}}

def test_frontend_percentage_survives_submit_storage_and_history_read(client):
    submitted = client.post("/api/assessment/submit", json=frontend_payload())
    assert submitted.status_code == 200
    history = client.get("/api/assessment/history")
    assert history.status_code == 200
    assert history.get_json()["history"][0]["total_score_percentage"] == 100

def test_legacy_four_point_percentage_is_normalized_on_read(client):
    legacy = {"answers": {}, "scores": {"savings": 3}, "total_score": 3.0, "total_score_percentage": 3.0, "category_scores_percentage": {}, "recommendations": [], "completed": True}
    saved, _ = user_data_service.save_user_data("test_user_id", "assessments", legacy)
    assert saved is True
    history = client.get("/api/assessment/history")
    latest = client.get("/api/assessment/latest")
    assert history.status_code == latest.status_code == 200
    assert history.get_json()["history"][0]["total_score_percentage"] == 75.0
    assert latest.get_json()["assessment"]["total_score_percentage"] == 75.0
    assert latest.get_json()["assessment"]["total_score"] == 3.0
