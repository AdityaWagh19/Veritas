import React from "react";

export default function AboutView() {
  return (
    <div className="py-3">
      {/* Heading */}
      <div className="mb-4">
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--app-ink)", margin: 0 }}>
          System Methodology & Architecture
        </h1>
        <p style={{ fontSize: "14px", color: "var(--app-fog)", margin: "4px 0 0 0" }}>
          How Veritas combines Vector Space Retrieval with classical classification and token-level attribution.
        </p>
      </div>

      {/* 3 Core Pillars (Show Don't Tell) */}
      <div className="row g-3 mb-4">
        {/* Pillar 1 */}
        <div className="col-12 col-md-4">
          <div className="card-clean h-100">
            <div className="mono-text" style={{ fontSize: "11px", fontWeight: 600, color: "var(--app-fog)", textTransform: "uppercase" }}>
              01 / Retrieval Engine
            </div>
            <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "8px 0 6px 0", color: "var(--app-ink)" }}>
              Dual-Engine IR
            </h4>
            <p style={{ fontSize: "13px", color: "var(--app-steel)", margin: 0, lineHeight: "1.6" }}>
              Searches 15,000 indexed articles using <strong>TF-IDF Cosine</strong> dot product and <strong>BM25 Okapi</strong> probabilistic re-ranking to find matching historical reporting.
            </p>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="col-12 col-md-4">
          <div className="card-clean h-100">
            <div className="mono-text" style={{ fontSize: "11px", fontWeight: 600, color: "var(--app-fog)", textTransform: "uppercase" }}>
              02 / Classifier
            </div>
            <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "8px 0 6px 0", color: "var(--app-ink)" }}>
              95.7% Precision
            </h4>
            <p style={{ fontSize: "13px", color: "var(--app-steel)", margin: 0, lineHeight: "1.6" }}>
              Calibrated <strong>Linear SVM</strong> and <strong>Logistic Regression</strong> trained on 63,613 balanced news stories with 5-fold stratified cross-validation.
            </p>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="col-12 col-md-4">
          <div className="card-clean h-100">
            <div className="mono-text" style={{ fontSize: "11px", fontWeight: 600, color: "var(--app-fog)", textTransform: "uppercase" }}>
              03 / Explainability
            </div>
            <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "8px 0 6px 0", color: "var(--app-ink)" }}>
              Transparent Signals
            </h4>
            <p style={{ fontSize: "13px", color: "var(--app-steel)", margin: 0, lineHeight: "1.6" }}>
              Deconstructs decisions into exact word contributions, highlighting suspicious sensational terms and credible factual markers directly inside the text.
            </p>
          </div>
        </div>
      </div>

      {/* Dataset & Specs Summary */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="card-clean h-100">
            <h4 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 8px 0", color: "var(--app-ink)" }}>
              Dataset Specification
            </h4>
            <div className="d-flex flex-column gap-2" style={{ fontSize: "13px", color: "var(--app-steel)" }}>
              <div className="d-flex justify-content-between border-bottom pb-1">
                <span>Corpus</span>
                <span className="mono-text" style={{ color: "var(--app-ink)" }}>WELFake (Zenodo 4561253)</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-1">
                <span>Filtered Articles</span>
                <span className="mono-text" style={{ color: "var(--app-ink)" }}>63,613 verified stories</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-1">
                <span>Class Ratio</span>
                <span className="mono-text" style={{ color: "var(--app-ink)" }}>54.6% Fake / 45.4% Real</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Feature Space</span>
                <span className="mono-text" style={{ color: "var(--app-ink)" }}>30,000 sublinear TF-IDF terms</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card-clean h-100">
            <h4 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 8px 0", color: "var(--app-ink)" }}>
              Implementation & Serving
            </h4>
            <div className="d-flex flex-column gap-2" style={{ fontSize: "13px", color: "var(--app-steel)" }}>
              <div className="d-flex justify-content-between border-bottom pb-1">
                <span>Frontend</span>
                <span className="mono-text" style={{ color: "var(--app-ink)" }}>React 18 + Vite (Clean Editorial)</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-1">
                <span>Backend API</span>
                <span className="mono-text" style={{ color: "var(--app-ink)" }}>FastAPI (Python 3.12)</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-1">
                <span>Serving Latency</span>
                <span className="mono-text" style={{ color: "var(--app-ink)" }}>~42 ms (In-memory cached)</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Storage Footprint</span>
                <span className="mono-text" style={{ color: "var(--app-ink)" }}>&lt;25 MB total compressed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Concise Transparency Note */}
      <div className="p-3" style={{ backgroundColor: "var(--app-surface-subtle)", border: "1px solid var(--app-border-subtle)", borderRadius: "4px" }}>
        <span style={{ fontSize: "12.5px", color: "var(--app-fog)", lineHeight: "1.6" }}>
          <strong>Transparency Note:</strong> Veritas evaluates linguistic, stylistic, and lexical patterns correlated with reporting in the WELFake benchmark corpus. It does not replace real-time fact-checking investigative journalism.
        </span>
      </div>
    </div>
  );
}
