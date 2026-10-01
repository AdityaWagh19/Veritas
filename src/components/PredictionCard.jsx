import React from "react";

export default function PredictionCard({ result, selectedModel, selectedRetriever }) {
  if (!result) return null;

  const isFake = result.label.toLowerCase() === "fake";
  const confidencePct = Math.round(result.confidence * 100);
  const vote = result.vote || {};
  const fakePct = Math.round((vote.fake_pct || 0) * 100);
  const realPct = Math.round((vote.real_pct || 0) * 100);

  return (
    <div
      className="card-clean mb-3"
      style={{
        borderLeft: `4px solid ${isFake ? "var(--app-fake-ink)" : "var(--app-real-ink)"}`,
      }}
    >
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
        {/* Verdict & Context */}
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span
              className={`tag-badge ${isFake ? "tag-fake" : "tag-real"}`}
              style={{ fontSize: "12px", padding: "3px 8px" }}
            >
              {isFake ? "POTENTIAL MISINFORMATION" : "VERIFIED / CREDIBLE PATTERN"}
            </span>
            <span style={{ fontSize: "12px", color: "var(--app-fog)" }}>
              via {selectedModel.toUpperCase()} + {selectedRetriever.toUpperCase()}
            </span>
          </div>

          <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "6px 0 2px 0", color: "var(--app-ink)" }}>
            {isFake
              ? "Stylistic & lexical deception patterns detected"
              : "Standard factual & journalistic patterns detected"}
          </h3>

          <div style={{ fontSize: "13px", color: "var(--app-steel)" }}>
            Neighbor consensus: <strong>{isFake ? `${fakePct}% Fake` : `${realPct}% Real`}</strong> among top reference matches.
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="text-start text-sm-end" style={{ minWidth: "140px" }}>
          <div className="d-flex align-items-baseline gap-1 justify-content-sm-end">
            <span className="mono-text" style={{ fontSize: "30px", fontWeight: 700, color: "var(--app-ink)", lineHeight: 1 }}>
              {confidencePct}%
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--app-fog)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Confidence Score
          </span>
          <div className="progress-minimal mt-1" style={{ width: "100%", maxWidth: "150px" }}>
            <div
              className={isFake ? "progress-bar-fake" : "progress-bar-real"}
              style={{ width: `${confidencePct}%`, height: "100%" }}
            />
          </div>
        </div>
      </div>

      {/* Discrepancy or Warning Notice */}
      {result.warnings && result.warnings.length > 0 && (
        <div
          className="mt-3 p-2 px-3 d-flex align-items-center gap-2"
          style={{
            backgroundColor: "var(--app-alert-bg)",
            border: "1px solid var(--app-alert-border)",
            borderRadius: "4px",
            fontSize: "12.5px",
            color: "var(--app-alert-ink)",
          }}
        >
          <span>⚠️</span>
          <span>{result.warnings[0]}</span>
        </div>
      )}
    </div>
  );
}
