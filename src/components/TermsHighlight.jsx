import React, { useState } from "react";

export default function TermsHighlight({ terms = [], originalText = "" }) {
  const [viewMode, setViewMode] = useState("inline"); // "inline" | "list"

  if (!terms || terms.length === 0) {
    return null;
  }

  const fakeTerms = terms.filter((t) => t.direction === "Fake");
  const realTerms = terms.filter((t) => t.direction === "Real");

  // Inline highlight inside article text
  const renderHighlightedText = () => {
    if (!originalText) return null;
    const termMap = new Map();
    terms.forEach((t) => termMap.set(t.term.toLowerCase(), t));

    const tokens = originalText.split(/(\s+|[.,!?;:()"])/);

    return tokens.map((part, index) => {
      const clean = part.toLowerCase().replace(/[^a-z]/g, "");
      const match = termMap.get(clean);
      if (match) {
        const isFake = match.direction === "Fake";
        return (
          <span
            key={index}
            className={isFake ? "token-highlight-fake" : "token-highlight-real"}
            title={`${match.term} (${isFake ? "Suspicious" : "Credible"} indicator)`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Find max weight for proportional bars
  const maxWeight = Math.max(...terms.map((t) => Math.abs(t.weight)), 1.0);

  return (
    <div className="card-clean mb-3">
      {/* Header & View Toggle */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h4 style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "var(--app-ink)" }}>
            Lexical Signals & Attribution
          </h4>
          <span style={{ fontSize: "12.5px", color: "var(--app-fog)" }}>
            Words with strongest influence on the classification outcome.
          </span>
        </div>

        {/* Minimal Legend & Toggle */}
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2" style={{ fontSize: "12px" }}>
            <span style={{ color: "var(--app-fake-ink)", fontWeight: 500 }}>■ Suspicious</span>
            <span style={{ color: "var(--app-real-ink)", fontWeight: 500 }}>■ Credible</span>
          </div>

          <div className="segmented-bar">
            <button
              type="button"
              className={`segmented-bar-btn ${viewMode === "inline" ? "active" : ""}`}
              onClick={() => setViewMode("inline")}
            >
              In Article Text
            </button>
            <button
              type="button"
              className={`segmented-bar-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              Signal Breakdown
            </button>
          </div>
        </div>
      </div>

      {/* Inline Text Highlighting (Show Don't Tell) */}
      {viewMode === "inline" && (
        <div
          className="p-3"
          style={{
            backgroundColor: "var(--app-surface-subtle)",
            border: "1px solid var(--app-border-subtle)",
            borderRadius: "5px",
            fontSize: "13.5px",
            lineHeight: "1.75",
            maxHeight: "200px",
            overflowY: "auto",
            color: "var(--app-steel)",
          }}
        >
          {renderHighlightedText()}
        </div>
      )}

      {/* Visual Signal Bars */}
      {viewMode === "list" && (
        <div className="row g-3">
          {/* Fake Influences */}
          <div className="col-12 col-md-6">
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--app-fake-ink)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Top Misinformation Indicators
            </span>
            <div className="mt-2 d-flex flex-column gap-2">
              {fakeTerms.slice(0, 5).map((item, idx) => {
                const widthPct = Math.round((Math.abs(item.weight) / maxWeight) * 100);
                return (
                  <div key={idx} className="d-flex align-items-center gap-2">
                    <span className="mono-text" style={{ fontSize: "12px", width: "90px", color: "var(--app-ink)", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.term}
                    </span>
                    <div style={{ flex: 1, height: "6px", backgroundColor: "var(--app-border-subtle)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ width: `${widthPct}%`, height: "100%", backgroundColor: "var(--app-fake-ink)" }} />
                    </div>
                  </div>
                );
              })}
              {fakeTerms.length === 0 && (
                <span style={{ fontSize: "12px", color: "var(--app-pewter)" }}>None detected</span>
              )}
            </div>
          </div>

          {/* Real Influences */}
          <div className="col-12 col-md-6">
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--app-real-ink)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Top Credible Indicators
            </span>
            <div className="mt-2 d-flex flex-column gap-2">
              {realTerms.slice(0, 5).map((item, idx) => {
                const widthPct = Math.round((Math.abs(item.weight) / maxWeight) * 100);
                return (
                  <div key={idx} className="d-flex align-items-center gap-2">
                    <span className="mono-text" style={{ fontSize: "12px", width: "90px", color: "var(--app-ink)", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.term}
                    </span>
                    <div style={{ flex: 1, height: "6px", backgroundColor: "var(--app-border-subtle)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ width: `${widthPct}%`, height: "100%", backgroundColor: "var(--app-real-ink)" }} />
                    </div>
                  </div>
                );
              })}
              {realTerms.length === 0 && (
                <span style={{ fontSize: "12px", color: "var(--app-pewter)" }}>None detected</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
