import gzip
import json
import time
from collections import Counter
from functools import lru_cache
from pathlib import Path
import numpy as np

from ml.config import MODELS, MAX_CHARS, LABEL_MAP
from ml.preprocess import preprocess
from ml.engine import (
    tfidf_topk,
    bm25_topk,
    calculate_neighbour_vote,
    get_local_term_contributions,
)

# Optional joblib and scipy for training/offline environments
try:
    import joblib
except ImportError:
    joblib = None

try:
    from scipy import sparse
except ImportError:
    sparse = None


class LightweightVectorizer:
    """Zero-dependency TF-IDF vectorizer identical to scikit-learn sublinear TF-IDF."""
    def __init__(self, vocab_words: np.ndarray, idf: np.ndarray):
        self.vocab = {w: i for i, w in enumerate(vocab_words)}
        self.feature_names = vocab_words
        self.idf = idf
        self.dim = len(vocab_words)

    def transform_sparse(self, text: str):
        words = text.split()
        if not words:
            return np.array([], dtype=int), np.array([], dtype=np.float32)
        counts = Counter(words)
        cols = []
        vals = []
        for w, c in counts.items():
            if w in self.vocab:
                idx = self.vocab[w]
                cols.append(idx)
                vals.append((1.0 + np.log(c)) * self.idf[idx])
        if not cols:
            return np.array([], dtype=int), np.array([], dtype=np.float32)
        cols = np.array(cols, dtype=int)
        vals = np.array(vals, dtype=np.float32)
        norm = np.linalg.norm(vals)
        if norm > 0:
            vals /= norm
        return cols, vals

    def get_feature_names_out(self):
        return self.feature_names


class LightweightLR:
    """Zero-dependency Logistic Regression inference."""
    def __init__(self, coef: np.ndarray, intercept: float):
        self.coef_ = coef.reshape(1, -1)
        self.intercept = float(intercept)

    def predict_proba(self, query):
        if isinstance(query, tuple):
            cols, vals = query
        else:
            cols, vals = getattr(query, "indices", []), getattr(query, "data", [])
        if len(cols) == 0:
            z = self.intercept
        else:
            z = float(np.sum(self.coef_[0, cols] * vals) + self.intercept)
        p1 = 1.0 / (1.0 + np.exp(-z))
        p1 = float(np.clip(p1, 0.0, 1.0))
        return np.array([[1.0 - p1, p1]])

    def predict(self, query):
        probs = self.predict_proba(query)[0]
        return np.array([1 if probs[1] >= 0.5 else 0])


class LightweightSVM:
    """Zero-dependency Calibrated LinearSVC (5-fold Platt Sigmoid ensemble)."""
    def __init__(self, coefs: np.ndarray, intercepts: np.ndarray, calib_a: np.ndarray, calib_b: np.ndarray):
        self.coefs = coefs
        self.intercepts = intercepts
        self.calib_a = calib_a
        self.calib_b = calib_b
        # Average coefficients for feature ranking
        self.coef_ = np.mean(coefs, axis=0, keepdims=True)

    def predict_proba(self, query):
        if isinstance(query, tuple):
            cols, vals = query
        else:
            cols, vals = getattr(query, "indices", []), getattr(query, "data", [])
        if len(cols) == 0:
            z = self.intercepts
        else:
            z = np.sum(self.coefs[:, cols] * vals, axis=1) + self.intercepts
        p1_folds = 1.0 / (1.0 + np.exp(self.calib_a * z + self.calib_b))
        p1 = float(np.clip(np.mean(p1_folds), 0.0, 1.0))
        return np.array([[1.0 - p1, p1]])

    def predict(self, query):
        probs = self.predict_proba(query)[0]
        return np.array([1 if probs[1] >= 0.5 else 0])


class LightweightNB:
    """Zero-dependency Multinomial Naive Bayes inference."""
    def __init__(self, feature_log_prob: np.ndarray, class_log_prior: np.ndarray):
        self.feat_log_prob = feature_log_prob
        self.class_log_prior = class_log_prior
        self.coef_ = (feature_log_prob[1:2] - feature_log_prob[0:1])

    def predict_proba(self, query):
        if isinstance(query, tuple):
            cols, vals = query
        else:
            cols, vals = getattr(query, "indices", []), getattr(query, "data", [])
        if len(cols) == 0:
            ll0 = self.class_log_prior[0]
            ll1 = self.class_log_prior[1]
        else:
            ll0 = self.class_log_prior[0] + np.sum(self.feat_log_prob[0, cols] * vals)
            ll1 = self.class_log_prior[1] + np.sum(self.feat_log_prob[1, cols] * vals)
        m = max(ll0, ll1)
        e0 = np.exp(ll0 - m)
        e1 = np.exp(ll1 - m)
        total = max(e0 + e1, 1e-12)
        p0 = float(e0 / total)
        p1 = float(e1 / total)
        return np.array([[p0, p1]])

    def predict(self, query):
        probs = self.predict_proba(query)[0]
        return np.array([1 if probs[1] >= 0.5 else 0])


class LightweightCSCMatrix:
    """Zero-dependency CSC sparse matrix representation for sub-millisecond document scoring."""
    def __init__(self, data: np.ndarray, indices: np.ndarray, indptr: np.ndarray, shape: tuple):
        self.data = data
        self.indices = indices
        self.indptr = indptr
        self.shape = tuple(shape)

    def dot_sparse(self, cols, vals):
        num_docs = self.shape[0]
        scores = np.zeros(num_docs, dtype=np.float32)
        if len(cols) == 0:
            return scores
        for col, val in zip(cols, vals):
            start = self.indptr[col]
            end = self.indptr[col + 1]
            if start < end:
                scores[self.indices[start:end]] += self.data[start:end] * val
        return scores


@lru_cache(maxsize=1)
def load_artifacts():
    """
    Cached artifact loader designed for fast warm requests and serverless runtimes.
    Loads lightweight weights (.npz) if available to avoid loading scipy/scikit-learn.
    Falls back to joblib artifacts if run during local training.
    """
    weights_path = MODELS / "serving_weights.npz"
    meta_path = MODELS / "serving_meta.json.gz"

    # Compressed serving metadata
    if meta_path.exists():
        with gzip.open(meta_path, "rt", encoding="utf-8") as f:
            serving_meta = json.load(f)
    else:
        serving_meta = []
        
    meta_labels = [doc["label"] for doc in serving_meta]
    corpus_tokens = [doc["clean"].split() for doc in serving_meta]

    # Primary lightweight runtime (pure NumPy)
    if weights_path.exists():
        npz = np.load(weights_path, allow_pickle=True)
        vec = LightweightVectorizer(npz["vocab_words"], npz["idf"])
        models = {
            "lr": LightweightLR(npz["lr_coef"], npz["lr_intercept"]),
            "svm": LightweightSVM(npz["svm_coefs"], npz["svm_intercepts"], npz["svm_calib_a"], npz["svm_calib_b"]),
            "nb": LightweightNB(npz["nb_feature_log_prob"], npz["nb_class_log_prior"]),
        }
        serving_matrix = LightweightCSCMatrix(
            npz["csc_data"], npz["csc_indices"], npz["csc_indptr"], tuple(npz["csc_shape"])
        )
        return {
            "vec": vec,
            "models": models,
            "matrix": serving_matrix,
            "meta": serving_meta,
            "meta_labels": meta_labels,
            "corpus_tokens": corpus_tokens,
            "is_lightweight": True,
        }

    # Fallback joblib loader (used in full development environments)
    if joblib is None:
        raise FileNotFoundError(
            f"Neither {weights_path} nor joblib is available. Please run 'python -m ml.export_lightweight'."
        )

    vec = joblib.load(MODELS / "tfidf_vectorizer.joblib")
    models = {
        name: joblib.load(MODELS / filename)
        for name, filename in [("lr", "lr.joblib"), ("svm", "svm_calibrated.joblib"), ("nb", "nb.joblib")]
        if (MODELS / filename).exists()
    }
    
    matrix_path = MODELS / "serving_matrix.npz"
    if matrix_path.exists() and sparse is not None:
        serving_matrix = sparse.load_npz(matrix_path).tocsr()
    else:
        serving_matrix = None

    return {
        "vec": vec,
        "models": models,
        "matrix": serving_matrix,
        "meta": serving_meta,
        "meta_labels": meta_labels,
        "corpus_tokens": corpus_tokens,
        "is_lightweight": False,
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
    Matches the exact JSON response contract.
    """
    start_time = time.time()
    artifacts = load_artifacts()
    
    vec = artifacts["vec"]
    models = artifacts["models"]
    matrix = artifacts["matrix"]
    meta = artifacts["meta"]
    corpus_tokens = artifacts["corpus_tokens"]
    meta_labels = artifacts["meta_labels"]
    is_lightweight = artifacts.get("is_lightweight", False)

    # 1. Input Construction & Bounds
    title = (raw_title or "").strip()
    text = (raw_text or "").strip()
    doc_raw = f"{title} {text}".strip()[:MAX_CHARS]
    
    # 2. Text Preprocessing
    clean_doc = preprocess(doc_raw)
    
    if is_lightweight:
        cols, vals = vec.transform_sparse(clean_doc)
        query_vec = (cols, vals)
    else:
        query_vec = vec.transform([clean_doc])
    
    # 3. Model Classification & Confidence
    selected_model = models.get(model_name, models.get("lr"))
    
    # Probability prediction: class 0 = Real, class 1 = Fake (WELFake convention)
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
    
    num_docs = matrix.shape[0] if matrix is not None and hasattr(matrix, "shape") else 0
    
    if num_docs > 0:
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
