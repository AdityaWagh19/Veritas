import numpy as np
from scipy import sparse
from rank_bm25 import BM25Okapi
from ml.config import LABEL_MAP

# -----------------------------------------------------------------------------
# 1. Retrieval Engine: Vector Space Model (TF-IDF Cosine) & BM25 Ranking
# -----------------------------------------------------------------------------

def tfidf_topk(query_vec: sparse.csr_matrix, corpus_matrix: sparse.csr_matrix, k: int = 5):
    """
    Ranked retrieval using the Vector Space Model with Cosine Similarity.
    Because corpus_matrix and query_vec are L2-normalized, cosine similarity
    is equivalent to the sparse matrix-vector dot product.
    Returns: (top_indices, similarity_scores)
    """
    # Sparse matrix multiplication: shape (N, 1) -> flat array
    scores = (corpus_matrix @ query_vec.T).toarray().ravel()
    
    # Efficient top-k partition
    k = min(k, len(scores))
    if k == 0:
        return np.array([], dtype=int), np.array([], dtype=float)
    if k >= len(scores):
        sorted_top_idx = np.argsort(-scores)
    else:
        candidate_idx = np.argpartition(-scores, k)[:k]
        sorted_top_idx = candidate_idx[np.argsort(-scores[candidate_idx])]
    
    return sorted_top_idx, scores[sorted_top_idx]

def bm25_topk(
    query_tokens: list[str],
    corpus_tokens: list[list[str]],
    corpus_matrix: sparse.csr_matrix,
    query_vec: sparse.csr_matrix,
    candidate_pool_size: int = 200,
    k: int = 5
):
    """
    Two-stage retrieval engine:
    Stage 1: Fast candidate filtering using TF-IDF sparse dot product (top 200).
    Stage 2: Probabilistic BM25 Okapi re-ranking on candidate documents.
    This avoids slow full-corpus Python looping while preserving BM25 ranking precision.
    """
    num_docs = len(corpus_tokens)
    if num_docs == 0:
        return np.array([]), np.array([])
        
    candidate_size = min(candidate_pool_size, num_docs)
    candidate_indices, _ = tfidf_topk(query_vec, corpus_matrix, k=candidate_size)
    
    # Extract candidate token lists for BM25
    candidate_docs = [corpus_tokens[i] for i in candidate_indices]
    
    if not query_tokens:
        return candidate_indices[:k], np.zeros(min(k, len(candidate_indices)))
        
    # Fit BM25 on the candidate subset
    bm25 = BM25Okapi(candidate_docs, k1=1.5, b=0.75)
    bm25_scores = np.array(bm25.get_scores(query_tokens))
    
    # Sort top-k from the candidate pool
    k = min(k, len(candidate_indices))
    rel_top_idx = np.argsort(-bm25_scores)[:k]
    
    final_indices = candidate_indices[rel_top_idx]
    final_scores = bm25_scores[rel_top_idx]
    
    return final_indices, final_scores

def calculate_neighbour_vote(labels: list[int] | np.ndarray, top_indices: np.ndarray):
    """
    Compute neighbor voting statistics among the retrieved top-K documents.
    Returns: {"fake_pct": float, "real_pct": float, "majority_label": str}
    """
    if len(top_indices) == 0:
        return {"fake_pct": 0.0, "real_pct": 0.0, "majority_label": "Unknown"}
        
    top_labels = np.array([labels[i] for i in top_indices])
    
    # In WELFake convention: 0 = Fake, 1 = Real
    fake_count = int(np.sum(top_labels == 0))
    real_count = int(np.sum(top_labels == 1))
    total = len(top_labels)
    
    fake_pct = round(fake_count / total, 3)
    real_pct = round(real_count / total, 3)
    majority = "Fake" if fake_pct >= real_pct else "Real"
    
    return {
        "fake_pct": fake_pct,
        "real_pct": real_pct,
        "majority_label": majority,
        "fake_count": fake_count,
        "real_count": real_count,
        "total": total
    }

# -----------------------------------------------------------------------------
# 2. Explainability Engine: Global & Local Lexical Term Contributions
# -----------------------------------------------------------------------------

def get_global_influential_terms(vectorizer, lr_model, top_n: int = 25):
    """
    Extract global terms with highest magnitude coefficients from Logistic Regression.
    In WELFake binary classification (0 = Fake, 1 = Real):
    - Negative coefficients push toward class 0 (Fake)
    - Positive coefficients push toward class 1 (Real)
    """
    feature_names = np.array(vectorizer.get_feature_names_out())
    coefs = lr_model.coef_[0]
    
    # Sort ascending: most negative first (Fake-driving) -> most positive last (Real-driving)
    sorted_indices = np.argsort(coefs)
    
    fake_terms = [
        {"term": feature_names[i], "weight": round(float(coefs[i]), 4), "direction": "Fake"}
        for i in sorted_indices[:top_n]
    ]
    
    real_terms = [
        {"term": feature_names[i], "weight": round(float(coefs[i]), 4), "direction": "Real"}
        for i in sorted_indices[-top_n:][::-1]
    ]
    
    return {"fake_terms": fake_terms, "real_terms": real_terms}

def get_local_term_contributions(vectorizer, lr_model, text_clean: str, top_n: int = 10):
    """
    Compute local term contributions for an individual prediction:
    contribution(term) = tfidf_value(term) * coef(term)
    Direction is assigned based on whether contribution pushes toward Fake or Real.
    """
    if not text_clean:
        return []
        
    x = vectorizer.transform([text_clean])
    coefs = lr_model.coef_[0]
    
    # Element-wise product of sparse tfidf vector and model coefficients
    contributions = x.multiply(coefs).tocoo()
    
    if contributions.nnz == 0:
        return []
        
    feature_names = vectorizer.get_feature_names_out()
    pairs = []
    
    for col_idx, weight in zip(contributions.col, contributions.data):
        term = feature_names[col_idx]
        # In WELFake (0=Fake, 1=Real): negative weight pushes to Fake, positive to Real
        direction = "Real" if weight > 0 else "Fake"
        pairs.append({
            "term": term,
            "weight": round(float(weight), 4),
            "abs_weight": abs(weight),
            "direction": direction
        })
        
    # Sort by absolute impact
    pairs.sort(key=lambda p: p["abs_weight"], reverse=True)
    return pairs[:top_n]
