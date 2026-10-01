import React from "react";
import { Alert } from "react-bootstrap";

export default function PredictionCard({ result, selectedModel, selectedRetriever }) {
  if (!result) return null;

  const isFake = result.label.toLowerCase() === "fake";
  const confidencePct = Math.round(result.confidence * 100);

  return (
    <div className="card-cream mb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div>
          <span className="mono-text" style={{ fontSize: "12px", color: "var(--app-fog)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Classification Verdict
          </span>
          <div className="d-flex align-items-center gap-3 mt-1">
            <span
              className={`pill-badge ${isFake ? "pill-fake" : "pill-real"}`}
              style={{ fontSize: "16px", padding: "6px 18px", fontWeight: 700 }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: isFake ? "var(--app-fake-ink)" : "var(--app-real-ink)",
                }}
              />
              {result.label.toUpperCase()} NEWS
            </span>
            <span className="mono-text" style={{ fontSize: "14px", color: "var(--app-steel)" }}>
              {isFake ? "Misinformation Patterns Detected" : "Credible Editorial Patterns Detected"}
            </span>
          </div>
        </div>

        <div className="text-end">
          <div className="mono-text" style={{ fontSize: "28px", fontWeight: 700, color: "var(--app-ink)", lineHeight: 1 }}>
            {confidencePct}%
          </div>
          <span className="mono-text" style={{ fontSize: "11px", color: "var(--app-pewter)", letterSpacing: "0.04em" }}>
            CALIBRATED CONFIDENCE
          </span>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="progress-editorial mb-3">
        <div
          className={isFake ? "progress-bar-fake" : "progress-bar-real"}
          style={{
            width: `${confidencePct}%`,
            height: "100%",
            transition: "width 0.4s ease-out",
          }}
        />
      </div>

      {/* Meta details & Latency */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-2" style={{ borderTop: "1px solid var(--app-border-subtle)" }}>
        <div className="d-flex align-items-center gap-2">
          <span className="pill-badge pill-neutral" style={{ fontSize: "11px", padding: "2px 8px" }}>
            Model: {selectedModel.toUpperCase()}
          </span>
          <span className="pill-badge pill-neutral" style={{ fontSize: "11px", padding: "2px 8px" }}>
            Retriever: {selectedRetriever.toUpperCase()}
          </span>
        </div>
        <span className="mono-text" style={{ fontSize: "12px", color: "var(--app-fog)" }}>
          Inference Latency: <strong>{result.latency_ms} ms</strong>
        </span>
      </div>

      {/* Warnings & Agreement Notice */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="mt-3">
          {result.warnings.map((warn, i) => (
            <Alert
              key={i}
              className="pill-alert m-0 mb-2 py-2 px-3 d-flex align-items-center gap-2"
              style={{ fontSize: "13px", borderRadius: "10px" }}
            >
              <span>⚠️</span>
              <span>{warn}</span>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}
