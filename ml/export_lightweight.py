"""
Export trained scikit-learn models and vectorizer into a lightweight NumPy format.
This allows high-performance inference at runtime without requiring scipy or scikit-learn,
drastically reducing serverless bundle size from 281 MB to <90 MB.
"""
import gzip
import json
from pathlib import Path
import joblib
import numpy as np
from scipy import sparse
from ml.config import MODELS

def export_all():
    print("Loading models and vectorizer...")
    vec = joblib.load(MODELS / "tfidf_vectorizer.joblib")
    lr = joblib.load(MODELS / "lr.joblib")
    nb = joblib.load(MODELS / "nb.joblib")
    svm = joblib.load(MODELS / "svm_calibrated.joblib")

    # 1. Vocabulary in index order
    vocab_size = len(vec.vocabulary_)
    vocab_words = [None] * vocab_size
    for word, idx in vec.vocabulary_.items():
        vocab_words[idx] = word

    # 2. Vectorizer IDF
    idf = vec.idf_.astype(np.float32)

    # 3. Logistic Regression
    lr_coef = lr.coef_[0].astype(np.float32)
    lr_intercept = np.float32(lr.intercept_[0])

    # 4. Naive Bayes
    nb_feature_log_prob = nb.feature_log_prob_.astype(np.float32)
    nb_class_log_prior = nb.class_log_prior_.astype(np.float32)

    # 5. SVM Calibrated Classifiers (5-fold ensemble)
    svm_coefs = np.array([clf.estimator.coef_[0] for clf in svm.calibrated_classifiers_], dtype=np.float32)
    svm_intercepts = np.array([clf.estimator.intercept_[0] for clf in svm.calibrated_classifiers_], dtype=np.float32)
    svm_calib_a = np.array([clf.calibrators[0].a_ for clf in svm.calibrated_classifiers_], dtype=np.float32)
    svm_calib_b = np.array([clf.calibrators[0].b_ for clf in svm.calibrated_classifiers_], dtype=np.float32)

    # 6. Serving Matrix in CSC format (for sub-millisecond sparse column lookups)
    csr = sparse.load_npz(MODELS / "serving_matrix.npz")
    csc = csr.tocsc()

    out_weights = MODELS / "serving_weights.npz"
    np.savez_compressed(
        out_weights,
        vocab_words=np.array(vocab_words, dtype=object),
        idf=idf,
        lr_coef=lr_coef,
        lr_intercept=lr_intercept,
        nb_feature_log_prob=nb_feature_log_prob,
        nb_class_log_prior=nb_class_log_prior,
        svm_coefs=svm_coefs,
        svm_intercepts=svm_intercepts,
        svm_calib_a=svm_calib_a,
        svm_calib_b=svm_calib_b,
        csc_data=csc.data.astype(np.float32),
        csc_indices=csc.indices.astype(np.int32),
        csc_indptr=csc.indptr.astype(np.int32),
        csc_shape=np.array(csc.shape, dtype=np.int32),
    )

    size_mb = out_weights.stat().st_size / (1024 * 1024)
    print(f"Successfully exported lightweight weights to {out_weights} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    export_all()
