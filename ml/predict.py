import gzip
import json
import time
from functools import lru_cache
from pathlib import Path
import joblib
from scipy import sparse
from ml.config import MODELS, MAX_CHARS, LABEL_MAP
from ml.preprocess import preprocess
from ml.engine import (
    tfidf_topk,
    bm25_topk,
    calculate_neighbour_vote,
    get_local_term_contributions,
)

MODEL_FILES = {
    "lr": "lr.joblib",
    "svm": "svm_calibrated.joblib",
    "nb": "nb.joblib",
}

@lru_cache(maxsize=1)
def load_artifacts():
    """
    Cached artifact loader designed for fast warm requests and serverless runtimes.
    Loads the fitted TF-IDF vectorizer, all three tuned classifiers, and the slim
    serving matrix with gzipped document metadata.
    """
    if not (MODELS / "tfidf_vectorizer.joblib").exists():
        raise FileNotFoundError(
            f"Model artifacts not found in {MODELS}. Please run 'python -m ml.train' first."
        )

    vec = joblib.load(MODELS / "tfidf_vectorizer.joblib")
    
    models = {
        name: joblib.load(MODELS / filename)
        for name, filename in MODEL_FILES.items()
        if (MODELS / filename).exists()
    }
    
    # Load slim serving matrix (float32 sparse CSR)
    matrix_path = MODELS / "serving_matrix.npz"
    if matrix_path.exists():
        serving_matrix = sparse.load_npz(matrix_path).tocsr()
    else:
        serving_matrix = sparse.csr_matrix((0, vec.max_features or 50000))
        
    # Load compressed serving metadata
    meta_path = MODELS / "serving_meta.json.gz"
    if meta_path.exists():
        with gzip.open(meta_path, "rt", encoding="utf-8") as f:
            serving_meta = json.load(f)
    else:
        serving_meta = []
        
    meta_labels = [doc["label"] for doc in serving_meta]
    corpus_tokens = [doc["clean"].split() for doc in serving_meta]

    return {
        "vec": vec,
        "models": models,
        "matrix": serving_matrix,
        "meta": serving_meta,
        "meta_labels": meta_labels,
        "corpus_tokens": corpus_tokens,
    }

def models_loaded() -> bool:
    """Return True if model artifacts are already cached in memory."""
    try:
        return load_artifacts.cache_info().currsize > 0
    except Exception:
        return False

def analyse(
    raw_title: str,
    raw_text: str,
    model_name: str = "lr",
    retriever: str = "tfidf",
    k: int = 5
) -> dict:
    """
    Core inference pipeline executed on /api/analyse.
    Matches the exact JSON response contract specified in Section 11.7.
    """
    start_time = time.time()
    artifacts = load_artifacts()
    
    vec = artifacts["vec"]
    models = artifacts["models"]
    matrix = artifacts["matrix"]
    meta = artifacts["meta"]
    corpus_tokens = artifacts["corpus_tokens"]
    meta_labels = artifacts["meta_labels"]

    # 1. Input Construction & Bounds
    title = (raw_title or "").strip()
    text = (raw_text or "").strip()
    doc_raw = f"{title} {text}".strip()[:MAX_CHARS]
    
    # 2. Text Preprocessing
    clean_doc = preprocess(doc_raw)
    query_vec = vec.transform([clean_doc])
    
    # 3. Model Classification & Confidence
    selected_model = models.get(model_name, models.get("lr"))
    
    # Probability prediction: class 0 = Fake, class 1 = Real
    probs = selected_model.predict_proba(query_vec)[0]
    pred_class = int(selected_model.predict(query_vec)[0])
    label_str = LABEL_MAP.get(pred_class, "Fake")
    confidence = round(float(probs[pred_class]), 4)

    # 4. Explainability (local terms always derived from interpretable Logistic Regression)
    lr_model = models.get("lr", selected_model)
    influential_terms = get_local_term_contributions(vec, lr_model, clean_doc, top_n=10)

    # 5. Top-K Similar News Retrieval
    k = min(max(k, 3), 10)
    warnings = []
    
    if matrix.shape[0] > 0:
        if retriever == "bm25":
            top_indices, scores = bm25_topk(
                clean_doc.split(), corpus_tokens, matrix, query_vec, k=k
            )
        else:
            top_indices, scores = tfidf_topk(query_vec, matrix, k=k)
            
        neighbours = []
        for idx, score in zip(top_indices, scores):
            item = meta[idx]
            neighbours.append({
                "title": item.get("title", "Untitled News"),
                "snippet": item.get("snippet", ""),
                "label": LABEL_MAP.get(item.get("label", 0), "Fake"),
                "score": round(float(score), 4),
            })
            
        vote_stats = calculate_neighbour_vote(meta_labels, top_indices)
        agrees = (vote_stats["majority_label"] == label_str)
        
        vote_data = {
            "fake_pct": vote_stats["fake_pct"],
            "real_pct": vote_stats["real_pct"],
            "majority": vote_stats["majority_label"],
            "agrees": agrees,
        }
        
        if not agrees:
            pct = int(max(vote_stats["fake_pct"], vote_stats["real_pct"]) * 100)
            warnings.append(
                f"Low Agreement: The classifier predicted {label_str.upper()}, but {pct}% of similar retrieved articles are labelled {vote_stats['majority_label'].upper()}."
            )
    else:
        neighbours = []
        vote_data = {"fake_pct": 0.5, "real_pct": 0.5, "majority": label_str, "agrees": True}

    # Short input warning
    word_count = len(text.split())
    if word_count < 35:
        warnings.append(
            f"Short text ({word_count} words): Predictions and retrieval have higher fidelity with longer articles (50+ words)."
        )

    latency_ms = round((time.time() - start_time) * 1000, 1)

    return {
        "label": label_str,
        "confidence": confidence,
        "terms": influential_terms,
        "neighbours": neighbours,
        "vote": vote_data,
        "warnings": warnings,
        "latency_ms": latency_ms,
    }
