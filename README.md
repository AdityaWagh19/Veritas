# Veritas — Fake News Detection & Similar News Retrieval
> **SPPU | Information Retrieval (IR) | Mini Project**  
---

## 1. Project Summary & Objectives

| Item | Detail |
|---|---|
| **Domain** | Information Retrieval, Text Mining, Natural Language Processing |
| **Problem** | Given a news headline or article, classify it as Fake or Real, retrieve similar known articles as supporting evidence, and explain the lexical decision. |
| **Input** | Headline and/or article body (text) |
| **Output** | Fake/Real label, calibrated confidence %, local term contributions, top-$K$ similar retrieved articles, neighbor vote consensus |
| **Dataset** | WELFake (~72,000 articles, balanced, Zenodo record 4561253) |
| **Core IR Concepts** | Vector Space Model (VSM), TF-IDF, Cosine Similarity, BM25 Okapi, Label-Consistency@K, Inverted Index |
| **Classifiers** | Logistic Regression (interpretable default), Linear SVM (calibrated), Multinomial Naive Bayes |
| **Interface** | React + Bootstrap single-page app (light, restrained editorial theme) backed by FastAPI |
| **Deployment** | Vercel monorepo from GitHub (frontend + Python serverless functions) |

---

## Syllabus Mapping

| IR Syllabus Concept | Implementation in this Project |
|---|---|
| **Tokenization & Preprocessing** | Lowercasing, regex cleaning (URLs/HTML/digits), NLTK English stopword filtering, and WordNet lemmatization (`ml/preprocess.py`). |
| **Vector Space Model (VSM)** | Every document and user query is represented as an $L_2$-normalized vector in term space (`ml/engine.py`). |
| **TF-IDF Weighting** | Sublinear term frequency ($1 + \log(\text{tf})$) and smooth inverse document frequency ($\log((1+N)/(1+\text{df})) + 1$). |
| **Cosine Similarity** | With $L_2$-normalized sparse vectors, cosine similarity equals the matrix-vector dot product ($\mathbf{q} \cdot \mathbf{d}$), evaluated in sub-second latency across 15,000 indexed documents. |
| **Probabilistic Ranking (BM25)** | BM25 Okapi incorporating term frequency saturation ($k_1 = 1.5$) and document length normalization ($b = 0.75$) via two-stage candidate re-ranking. |
| **Ranked Retrieval & Neighbor Vote** | Returns top-$K$ similar articles with scores, snippets, and calculates neighbor agreement % to flag model uncertainty. |
| **IR System Evaluation** | Precision@K, Label-Consistency@K, and Mean Reciprocal Rank (MRR) evaluated across test queries. |
| **Lexical Explainability** | Global feature coefficients and per-prediction local term weights ($\text{TF-IDF}(t) \times \text{coef}(t)$). |

---

## 3. System Architecture & Workflow

```text
                     ┌──────────────────────────────┐
                     │      WELFake CSV Dataset     │
                     └──────────────┬───────────────┘
                                    ↓
                     ┌──────────────────────────────┐
                     │ Cleaning & Normalization     │
                     │ (Lowercase, Regex, Stopwords,│
                     │  WordNet Lemmatization)      │
                     └──────────────┬───────────────┘
                                    ↓
               ┌────────────────────┴─────────────────────┐
               ↓                                          ↓
  ┌──────────────────────────┐              ┌───────────────────────────┐
  │ TF-IDF Vectorizer        │              │ BM25 Serving Index        │
  │ (Fitted on TRAIN only)   │              │ (Sampled stratified subset)│
  └─────────────┬────────────┘              └─────────────┬─────────────┘
                ↓                                         │
  ┌──────────────────────────┐                            │
  │ Logistic Regression /    │                            │
  │ Calibrated Linear SVM    │                            │
  └─────────────┬────────────┘                            │
                ↓                                         ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │      FastAPI Backend: /api/analyse  /api/metrics  /api/health    │
  │  Text In → Prediction + Confidence + Top Terms + Top-K Similar   │
  └─────────────────────────────────┬────────────────────────────────┘
                                    ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │       React + Bootstrap Frontend (Light Restrained Design)       │
  └──────────────────────────────────────────────────────────────────┘
```

> **Golden Rule:** Feature extraction (`TfidfVectorizer`) and BM25 index statistics are fitted strictly on the **training split only** to prevent test information leakage.

---

## 4. UI Design System (Restrained Editorial Theme)

Adapted from an editorial research laboratory design:
- **Canvas:** Paper white (`#ffffff`) background with cream surfaces (`#f9f8f6`) and hairline borders (`1px solid #d5d9e2`).
- **Signature Interaction:** Monolithic black pill button (`#0a0a0a` with white text and `9999px` radius) for primary actions.
- **Dual Typography:**
  - `Inter` / `System UI` for display headlines and editorial UI text with tight negative tracking (`-0.025em`).
  - `Geist Mono` for model confidence percentages, retrieval scores, latency readouts, and weights.
- **Semantic Signaling:**
  - Fake News: Soft crimson (`#b42318` text on `#fef3f2` background).
  - Real News: Soft emerald (`#067647` text on `#ecfdf3` background).
  - Low Agreement Alert: Warm amber (`#b54708` on `#fffaeb`).
- **Strict Light Mode:** Enforced via `data-bs-theme="light"` (no dark mode).

---

## 5. Consolidated Repository Structure

```text
IR Mini Project/
├── README.md                   # Single master documentation file
├── package.json                # Vite + React + Bootstrap dependencies
├── vite.config.js              # Dev proxy (/api -> http://localhost:8000)
├── index.html                  # HTML entry point (data-bs-theme="light")
├── vercel.json                 # Vercel serverless rewrite configuration
├── .vercelignore               # Bundling exclusion rules
├── .gitignore                  # Ignores .venv, node_modules, data/raw, data/processed
├── requirements.txt            # Runtime dependencies for Vercel
├── requirements-train.txt      # Full local training dependencies
│
├── public/
│   ├── samples.json            # Curated samples for one-click UI demo
│   └── favicon.svg
│
├── api/
│   └── index.py                # FastAPI endpoints (/api/health, /api/analyse, /api/metrics)
│
├── ml/                         # Core Machine Learning & IR package
│   ├── config.py               # Paths, constants, seeds, LABEL_MAP
│   ├── preprocess.py           # Text cleaning, tokenization, lemmatization
│   ├── engine.py               # Unified IR (Cosine, BM25, vote) & Explainability
│   ├── train.py                # 5-fold CV training, evaluation & slim serving export
│   ├── predict.py              # Cached runtime loader & inference runner
│   └── nltk_data/              # Bundled NLTK corpora for offline serverless
│
├── src/                        # React + Bootstrap frontend
│   ├── main.jsx                # Bootstrap import & root rendering
│   ├── App.jsx                 # Navbar, state router, footer
│   ├── api/client.js           # API fetch client
│   ├── views/                  # AnalyseView, DashboardView, AboutView
│   ├── components/             # PredictionCard, TermsHighlight, NeighboursTable
│   └── styles/theme.css        # Minimalist light theme tokens
│
├── data/
│   ├── raw/                    # WELFake_Dataset.csv (auto-downloaded)
│   └── processed/              # Cleaned splits & local matrices
│
├── models/                     # Committed slim deployment artifacts (<50MB each)
│   ├── tfidf_vectorizer.joblib
│   ├── lr.joblib
│   ├── nb.joblib
│   ├── svm_calibrated.joblib
│   ├── serving_matrix.npz      # Float32 CSR retrieval matrix
│   └── serving_meta.json.gz    # Gzipped document snippets & labels
│
├── notebooks/                  # 3 Consolidated milestone notebooks
│   ├── 01_eda_and_prep.ipynb   # Data cleaning, distributions, verified mapping
│   ├── 02_model_experiments.ipynb # Model CV tuning & ablation studies
│   └── 03_retrieval_eval.ipynb # TF-IDF vs BM25 offline evaluation
│
├── reports/
│   ├── metrics.json            # Model evaluation metrics & ablations
│   └── figures/                # Saved charts for report and presentation
│
└── tests/
    ├── test_preprocess.py      # Unit tests for text normalization
    ├── test_retrieval.py       # Unit tests for Cosine & BM25 ranking
    └── test_api.py             # Integration tests for FastAPI routes
```

---

## 6. Setup, Training, and Running

### 6.1 Prerequisites
- **Python 3.12**
- **Node.js 18+** & `npm`

### 6.2 Setup
```bash
# 1. Activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1       # On Linux/macOS: source .venv/bin/activate

# 2. Install Python packages
pip install -r requirements-train.txt

# 3. Bundle NLTK data
python -c "import nltk; [nltk.download(x, download_dir='ml/nltk_data') for x in ['stopwords','wordnet','omw-1.4']]"

# 4. Install Frontend packages
npm install
```

### 6.3 Train and Export Serving Artifacts
```bash
python -m ml.train
```
This single command:
1. Cleans the WELFake dataset and verifies class balance (`0: Fake`, `1: Real`).
2. Splits into 80/20 train/test.
3. Fits the TF-IDF vectorizer on the train set only.
4. Tunes Naive Bayes, Logistic Regression, and Calibrated Linear SVM using 5-fold cross-validation.
5. Saves tuned models to `models/`.
6. Exports a compressed float32 sparse retrieval matrix (`serving_matrix.npz`) and metadata (`serving_meta.json.gz`) for 15,000 articles.
7. Executes ablation studies (A1, A2, A4, A7, A9) and writes `reports/metrics.json` and `public/samples.json`.

### 6.4 Running Locally
Start both backend and frontend:

**Terminal 1 (FastAPI API):**
```bash
uvicorn api.index:app --reload --port 8000
```

**Terminal 2 (React Frontend):**
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 6.5 Running Tests
```bash
pytest tests/ -v
```

---

## 7. API Contract

All endpoints live under `/api` and return JSON.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Returns healthcheck and `models_loaded` status. |
| `POST` | `/api/analyse` | Accepts article title, text, model, retriever, and $K$. Returns label, confidence, term weights, and top-$K$ neighbours. |
| `GET` | `/api/metrics` | Serves contents of `reports/metrics.json` for live dashboard display. |
| `GET` | `/api/samples` | Returns curated sample articles for instant demo testing. |

---

## 8. Viva Question Bank (Examination Prep)

### IR Concepts
1. **What is the Vector Space Model?**  
   A model where documents and queries are represented as vectors in term space. Similarity between a query and document is measured by the cosine of the angle between their vectors.
2. **Why L2-normalize vectors?**  
   $L_2$ normalization ensures that document length does not unfairly skew similarity scores. With unit vectors, cosine similarity simplifies directly to the dot product $\mathbf{q} \cdot \mathbf{d}$, which is computed via fast sparse matrix multiplication.
3. **How does BM25 improve over TF-IDF?**  
   BM25 incorporates non-linear term frequency saturation ($k_1$) and document length normalization ($b$), preventing very frequent term repetitions in long documents from dominating scores.
4. **Why use a two-stage retrieval design for BM25?**  
   Computing BM25 across 50,000+ documents in pure Python can be slow. We use TF-IDF dot products to pre-filter candidate documents (e.g. top 200), then re-rank with BM25 Okapi.
5. **What is Label-Consistency@K?**  
   Since human relevance judgments are unavailable, the fraction of retrieved top-$K$ documents sharing the same class label as the query serves as an empirical proxy for retrieval quality.

### ML & Engineering Concepts
6. **Why use Logistic Regression as the default model?**  
   LR provides native calibrated probabilities via the sigmoid function and directly interpretable feature coefficients ($\beta_j$), allowing straightforward lexical term explainability.
7. **How do you get probabilities from Linear SVM?**  
   `LinearSVC` only computes signed decision boundaries ($w^T x + b$). We wrap it using `CalibratedClassifierCV` (Platt scaling or isotonic regression) using cross-validated folds.
8. **Why fit the vectorizer strictly on training data?**  
   Fitting on the full dataset causes **data leakage** because vocabulary selection and IDF weights would incorporate information from the test set.
9. **How is the system optimized for serverless deployment on Vercel?**  
   The serving index uses a float32 CSR sparse matrix and gzipped metadata sampled from 15,000 articles, keeping every artifact under 50 MB to comply with GitHub and Vercel limits. Preprocessing bundles NLTK corpora locally to operate in a read-only environment without network downloads.

---

## 9. Ethics & Limitations
- **Pattern Detection vs. Truth:** The tool detects stylistic, vocabulary, and agency markers correlated with the WELFake dataset labels. It does **not** fact-check claims against live knowledge graphs.
- **Privacy:** Articles submitted through the interface are processed in memory and never logged or stored.
