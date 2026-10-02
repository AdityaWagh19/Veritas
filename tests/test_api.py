from fastapi.testclient import TestClient
from api.index import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "models_loaded" in data

def test_api_validation_short_text():
    res = client.post("/api/analyse", json={"text": "Too short"})
    assert res.status_code == 422
    assert "Please enter at least 20 words" in res.json()["error"]

def test_api_validation_invalid_model():
    text_20_words = " ".join(["word"] * 25)
    res = client.post("/api/analyse", json={"text": text_20_words, "model": "invalid_model"})
    assert res.status_code == 422
    assert "Invalid model" in res.json()["error"]

def test_api_extract_url_validation():
    res = client.post("/api/extract-url", json={"url": "not-a-valid-url"})
    assert res.status_code == 400
    assert "valid web URL" in res.json()["error"]

