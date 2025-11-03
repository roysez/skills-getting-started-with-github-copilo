import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


@pytest.fixture
def client():
    return TestClient(app)


def test_get_activities(client):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # sanity check for a known activity
    assert "Chess Club" in data


def test_signup_and_unregister(client):
    activity = "Chess Club"
    email = "teststudent@mergington.edu"

    # Snapshot original participants and ensure test email not present
    orig = activities[activity]["participants"][:]
    if email in orig:
        activities[activity]["participants"].remove(email)

    # Signup should succeed
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    # Signing up the same email again should return 400
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400

    # Unregister should succeed
    resp3 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp3.status_code == 200
    assert email not in activities[activity]["participants"]

    # Restore original participants
    activities[activity]["participants"] = orig


def test_unregister_nonexistent(client):
    activity = "Chess Club"
    email = "noone@mergington.edu"
    orig = activities[activity]["participants"][:]
    if email in orig:
        activities[activity]["participants"].remove(email)

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 404

    activities[activity]["participants"] = orig


def test_activity_not_found(client):
    resp = client.post("/activities/NoSuchActivity/signup?email=a@b.com")
    assert resp.status_code == 404

    resp2 = client.delete("/activities/NoSuchActivity/participants?email=a@b.com")
    assert resp2.status_code == 404
