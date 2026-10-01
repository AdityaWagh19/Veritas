import React from "react";

export default function AboutView() {
  return (
    <div className="py-2">
      <div className="mb-4">
        <h1 style={{ fontSize: "36px", fontWeight: 600, color: "var(--app-ink)", letterSpacing: "-0.03em" }}>
          About Veritas
        </h1>
        <p style={{ fontSize: "16px", color: "var(--app-fog)", maxWidth: "760px", marginTop: "6px" }}>
          Veritas is an Information Retrieval (IR) system demonstrating text classification, ranked similarity retrieval, and lexical explainability on the WELFake dataset.
        </p>
      </div>

      {/* IR Mapping Card */}
      <div className="card-paper mb-4">
        <h5 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
          Syllabus Mapping: What Makes This an IR Project
        </h5>
        <p style={{ fontSize: "14px", color: "var(--app-fog)", marginBottom: "16px" }}>
          This system implements core concepts from modern Information Retrieval curricula:
        </p>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="p-3" style={{ backgroundColor: "var(--app-cream)", borderRadius: "12px", border: "1px solid var(--app-border)" }}>
              <div className="mono-text" style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-ink)", marginBottom: "4px" }}>
                1. Vector Space Model (VSM) & TF-IDF
              </div>
              <p style={{ fontSize: "13px", color: "var(--app-steel)", margin: 0, lineHeight: "1.6" }}>
                Documents and query inputs are mapped into high-dimensional sparse vector space using smooth inverse document frequency and sublinear term frequency weighting, normalized under L2 norm.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3" style={{ backgroundColor: "var(--app-cream)", borderRadius: "12px", border: "1px solid var(--app-border)" }}>
              <div className="mono-text" style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-ink)", marginBottom: "4px" }}>
                2. Cosine Similarity via Dot Product
              </div>
              <p style={{ fontSize: "13px", color: "var(--app-steel)", margin: 0, lineHeight: "1.6" }}>
                With unit L2-normalized sparse vectors, cosine similarity simplifies to matrix-vector multiplication <span className="mono-text">q · d</span>, evaluated in sub-second latency across 15,000 indexed articles.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3" style={{ backgroundColor: "var(--app-cream)", borderRadius: "12px", border: "1px solid var(--app-border)" }}>
              <div className="mono-text" style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-ink)", marginBottom: "4px" }}>
                3. Probabilistic BM25 Okapi Ranking
              </div>
              <p style={{ fontSize: "13px", color: "var(--app-steel)", margin: 0, lineHeight: "1.6" }}>
                Incorporates non-linear term frequency saturation (<span className="mono-text">k1 = 1.5</span>) and document length normalization (<span className="mono-text">b = 0.75</span>) via a two-stage retrieval pipeline.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3" style={{ backgroundColor: "var(--app-cream)", borderRadius: "12px", border: "1px solid var(--app-border)" }}>
              <div className="mono-text" style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-ink)", marginBottom: "4px" }}>
                4. Label Consistency & Neighbor Consensus
              </div>
              <p style={{ fontSize: "13px", color: "var(--app-steel)", margin: 0, lineHeight: "1.6" }}>
                Retrieved top-$K$ documents serve as empirical evidence: the neighbor vote calculates consensus and flags low agreement warnings if retrieved context contradicts the classifier.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset & Architecture Grid */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-6">
          <div className="card-paper h-100">
            <h5 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
              Dataset: WELFake Corpus
            </h5>
            <p style={{ fontSize: "13px", color: "var(--app-steel)", lineHeight: "1.6" }}>
              The model was trained on the <strong>WELFake</strong> benchmark dataset (Zenodo record 4561253) comprising <strong>72,134 news articles</strong> collected from Kaggle, McIntire, Reuters, and BuzzFeed.
            </p>
            <ul style={{ fontSize: "13px", color: "var(--app-steel)", paddingLeft: "18px", lineHeight: "1.7" }}>
              <li><strong>Balanced Classes:</strong> ~35,000 real and ~37,000 fake articles.</li>
              <li><strong>Split:</strong> 80% train (57,707 docs) / 20% held-out test (14,427 docs).</li>
              <li><strong>Convention:</strong> Verified and standardized: <span className="mono-text">0 = Fake, 1 = Real</span>.</li>
              <li><strong>Serving Index:</strong> 15,000 stratified training articles compressed into float32 CSR format for fast serverless retrieval.</li>
            </ul>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card-paper h-100">
            <h5 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
              Architecture & Deployment
            </h5>
            <p style={{ fontSize: "13px", color: "var(--app-steel)", lineHeight: "1.6" }}>
              Designed as a unified monorepo deploying both client and API serverlessly on Vercel:
            </p>
            <ul style={{ fontSize: "13px", color: "var(--app-steel)", paddingLeft: "18px", lineHeight: "1.7" }}>
              <li><strong>Frontend:</strong> React 18 + Vite + Bootstrap 5 following the restrained xAI light editorial design system.</li>
              <li><strong>Backend API:</strong> Python 3.12 running FastAPI on Vercel Functions.</li>
              <li><strong>Zero Cold-start Downloads:</strong> Bundled NLTK data and pre-trained joblib weights ship directly in the deployment package.</li>
              <li><strong>Stateless:</strong> Submitted articles are processed in memory and never persisted or logged.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Limitations & Ethics */}
      <div className="card-cream mb-4">
        <h5 style={{ fontSize: "16px", fontWeight: 600, color: "var(--app-ink)", marginBottom: "6px" }}>
          Important Limitations & Ethical Disclaimer
        </h5>
        <p style={{ fontSize: "13px", color: "var(--app-steel)", lineHeight: "1.6", margin: 0 }}>
          <strong>Lexical, Not Truth-Theoretic:</strong> This system detects vocabulary, stylistic patterns, and agency b-lines correlated with news classes in the WELFake training corpus. It does <em>not</em> cross-reference real-time knowledge graphs or verify factual claims. Sarcasm, satire, recent breaking events, and unseen entities outside the vocabulary cannot be verified through lexical modeling alone.
        </p>
      </div>
    </div>
  );
}
