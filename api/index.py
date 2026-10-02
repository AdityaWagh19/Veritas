import json
from pathlib import Path
import httpx
from bs4 import BeautifulSoup
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

class ExtractUrlRequest(BaseModel):
    url: str = Field(..., description="Web article URL to fetch and parse")

def extract_article_from_url(url: str) -> dict:
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Please enter a valid web URL starting with http:// or https://")
        
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        with httpx.Client(timeout=10.0, follow_redirects=True, headers=headers) as client:
            resp = client.get(url)
            if resp.status_code == 403:
                raise HTTPException(status_code=400, detail="This news site blocks automated article extraction. Please copy and paste the article text directly.")
            resp.raise_for_status()
            html = resp.text
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="The article URL took too long to respond. Please check the link or paste text directly.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not load article from URL: {str(e)}")

    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "aside", "svg", "form"]):
        tag.decompose()

    title = ""
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        title = og_title["content"].strip()
    elif soup.title and soup.title.string:
        title = soup.title.string.strip()

    article_tag = soup.find("article") or soup.find("main") or soup.body
    if article_tag:
        paras = [p.get_text(separator=" ", strip=True) for p in article_tag.find_all("p")]
    else:
        paras = [p.get_text(separator=" ", strip=True) for p in soup.find_all("p")]

    cleaned_paras = [p for p in paras if len(p.split()) >= 6]
    body_text = " ".join(cleaned_paras)

    if not body_text or len(body_text.split()) < 20:
        if soup.body:
            body_text = soup.body.get_text(separator=" ", strip=True)

    word_count = len(body_text.split())
    if word_count < 20:
        raise HTTPException(
            status_code=422,
            detail="Could not extract enough article body text from this URL. Please paste the article text manually."
        )

    return {
        "title": title,
        "text": body_text[:4000],
        "word_count": word_count,
        "url": url
    }

class AnalyseRequest(BaseModel):
    title: str = Field(default="", description="News article headline")
    text: str = Field(default="", description="Full text or body of the news article")
    url: str = Field(default="", description="Optional news article URL to fetch directly")
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

@app.post("/api/extract-url")
def extract_url_route(req: ExtractUrlRequest):
    """Fetch article headline and body text directly from a URL."""
    return extract_article_from_url(req.url)

@app.post("/api/analyse")
def analyse_route(req: AnalyseRequest):
    """
    Classify a news document, rank top-K similar articles, and extract lexical contributions.
    """
    title = req.title
    text = req.text

    if req.url and not text.strip():
        extracted = extract_article_from_url(req.url)
        if not title:
            title = extracted["title"]
        text = extracted["text"]

    words = text.strip().split()
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
