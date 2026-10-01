import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ml.config import REPORTS, ROOT
from ml.predict import analyse, models_loaded

app = FastAPI(
    title="Veritas — Fake News Detection & Retrieval API",
    description="Veritas: IR-powered fake news classifier, similar news retriever (TF-IDF & BM25), and explainability service.",
    version="1.1.0"
)

# Enable CORS for local cross-origin development if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

class AnalyseRequest(BaseModel):
    title: str = Field(default="", description="News article headline")
    text: str = Field(..., description="Full text or body of the news article")
    model: str = Field(default="lr", description="Classifier: lr, svm, nb")
    retriever: str = Field(default="tfidf", description="Retriever: tfidf or bm25")
    k: int = Field(default=5, ge=3, le=10, description="Top K similar articles to retrieve")

@app.get("/api/health")
def health():
    """Healthcheck endpoint for Vercel and frontend liveness."""
    return {
        "status": "ok",
        "models_loaded": models_loaded(),
        "runtime": "Python 3.12"
    }

@app.post("/api/analyse")
def analyse_route(req: AnalyseRequest):
    """
    Classify a news document, rank top-K similar articles, and extract lexical contributions.
    """
    words = req.text.strip().split()
    if len(words) < 20:
        raise HTTPException(
            status_code=422,
            detail=f"Please enter at least 20 words for reliable analysis (currently {len(words)} words)."
        )
        
    valid_models = ("lr", "svm", "nb")
    if req.model not in valid_models:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid model '{req.model}'. Must be one of {valid_models}."
        )
        
    valid_retrievers = ("tfidf", "bm25")
    if req.retriever not in valid_retrievers:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid retriever '{req.retriever}'. Must be one of {valid_retrievers}."
        )
        
    try:
        result = analyse(
            raw_title=req.title,
            raw_text=req.text,
            model_name=req.model,
            retriever=req.retriever,
            k=req.k
        )
        return result
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis pipeline error: {str(e)}"
        )

@app.get("/api/metrics")
def metrics():
    """Returns saved model performance metrics and ablation figures."""
    metrics_path = REPORTS / "metrics.json"
    if metrics_path.exists():
        try:
            return json.loads(metrics_path.read_text(encoding="utf-8"))
        except Exception as e:
            raise HTTPException(500, f"Error reading metrics: {str(e)}")
            
    return {
        "status": "pending_training",
        "message": "Models are currently being trained. Metrics will appear once ml.train finishes."
    }

@app.get("/api/samples")
def get_samples():
    """Provides curated sample articles for instant one-click testing in the UI."""
    samples_file = ROOT / "public" / "samples.json"
    if samples_file.exists():
        try:
            return json.loads(samples_file.read_text(encoding="utf-8"))
        except Exception:
            pass
    return []
