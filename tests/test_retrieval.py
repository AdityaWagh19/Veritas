import numpy as np
from scipy import sparse
from ml.engine import tfidf_topk, calculate_neighbour_vote, bm25_topk

def test_tfidf_topk_ranking():
    # Mock 3 documents and a query in 4-dimensional term space
    # D1 = [1, 0, 0, 0]
    # D2 = [0.707, 0.707, 0, 0]
    # D3 = [0, 0, 1, 0]
    corpus = sparse.csr_matrix([
        [1.0, 0.0, 0.0, 0.0],
        [0.7071, 0.7071, 0.0, 0.0],
        [0.0, 0.0, 1.0, 0.0]
    ])
    # Query matching D1 exactly
    query = sparse.csr_matrix([[1.0, 0.0, 0.0, 0.0]])
    
    top_indices, scores = tfidf_topk(query, corpus, k=2)
    assert len(top_indices) == 2
    assert top_indices[0] == 0  # D1 has highest cosine similarity (1.0)
    assert top_indices[1] == 1  # D2 has second highest (0.7071)
    assert np.isclose(scores[0], 1.0, atol=1e-3)

def test_calculate_neighbour_vote():
    # 5 retrieved labels (0 = Fake, 1 = Real)
    labels = [0, 0, 0, 1, 0]
    indices = np.array([0, 1, 2, 3, 4])
    
    vote = calculate_neighbour_vote(labels, indices)
    assert vote["fake_count"] == 4
    assert vote["real_count"] == 1
    assert vote["fake_pct"] == 0.8
    assert vote["majority_label"] == "Fake"

def test_bm25_topk():
    corpus_tokens = [
        ["breaking", "election", "scandal"],
        ["economy", "rates", "inflation", "growth"],
        ["election", "vote", "ballot", "count"]
    ]
    corpus_matrix = sparse.csr_matrix([
        [0.8, 0.6, 0.0, 0.0],
        [0.0, 0.0, 0.7, 0.7],
        [0.6, 0.8, 0.0, 0.0]
    ])
    query_tokens = ["election", "scandal"]
    query_vec = sparse.csr_matrix([[0.7, 0.7, 0.0, 0.0]])
    
    top_idx, scores = bm25_topk(query_tokens, corpus_tokens, corpus_matrix, query_vec, k=2)
    assert len(top_idx) == 2
    assert top_idx[0] == 0  # Document 0 contains both "breaking" and "scandal"
