import React, { useState } from "react";

export default function TermsHighlight({ terms = [], originalText = "" }) {
  const [showInText, setShowInText] = useState(false);

  if (!terms || terms.length === 0) {
    return (
      <div className="card-paper mb-4">
        <h5 style={{ fontSize: "16px", marginBottom: "8px" }}>Lexical Explainability</h5>
        <p className="text-muted small m-0">No strong discriminative lexical features identified in this sample.</p>
      </div>
    );
  }

  const fakeTerms = terms.filter((t) => t.direction === "Fake");
  const realTerms = terms.filter((t) => t.direction === "Real");

  // Highlight terms inside original text
  const renderHighlightedText = () => {
    if (!originalText) return null;
    const termMap = new Map();
    terms.forEach((t) => termMap.set(t.term.toLowerCase(), t));

    // Regex to split words while preserving delimiters
    const tokens = originalText.split(/(\s+|[.,!?;:()"])/);

    return tokens.map((part, index) => {
      const clean = part.toLowerCase().replace(/[^a-z]/g, "");
      const match = termMap.get(clean);
      if (match) {
        const isFake = match.direction === "Fake";
        return (
          <span
            key={index}
            style={{
              backgroundColor: isFake ? "var(--app-fake-bg)" : "var(--app-real-bg)",
              color: isFake ? "var(--app-fake-ink)" : "var(--app-real-ink)",
              border: `1px solid ${isFake ? "var(--app-fake-border)" : "var(--app-real-border)"}`,
              padding: "1px 4px",
              borderRadius: "4px",
              fontWeight: 600,
              cursor: "help",
            }}
            title={`${match.term} (${match.direction}: ${match.weight > 0 ? "+" : ""}${match.weight})`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="card-paper mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 style={{ fontSize: "16px", margin: 0, fontWeight: 600 }}>
            Lexical Explainability
          </h5>
          <span style={{ fontSize: "13px", color: "var(--app-fog)" }}>
            Top terms contributing to the decision: <span className="mono-text">TF-IDF(t) × Coef(t)</span>
          </span>
        </div>
        <button
          className="btn-pill-ghost"
          style={{ fontSize: "12px", padding: "4px 12px" }}
          onClick={() => setShowInText(!showInText)}
        >
          {showInText ? "Hide In-Text Highlight" : "Highlight In Article Text"}
        </button>
      </div>

      {showInText && (
        <div
          className="p-3 mb-3"
          style={{
            backgroundColor: "var(--app-cream)",
            border: "1px solid var(--app-border)",
            borderRadius: "12px",
            fontSize: "14px",
            lineHeight: "1.7",
            maxHeight: "220px",
            overflowY: "auto",
            color: "var(--app-steel)",
          }}
        >
          {renderHighlightedText()}
        </div>
      )}

      <div className="row g-3">
        {fakeTerms.length > 0 && (
          <div className="col-12 col-md-6">
            <div className="p-3" style={{ backgroundColor: "var(--app-cream)", borderRadius: "12px", border: "1px solid var(--app-border-subtle)" }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--app-fake-ink)" }} />
                <span className="mono-text" style={{ fontSize: "12px", fontWeight: 600, color: "var(--app-fake-ink)", textTransform: "uppercase" }}>
                  Pushed Toward Fake ({fakeTerms.length})
                </span>
              </div>
              <div className="d-flex flex-wrap">
                {fakeTerms.map((t, idx) => (
                  <span key={idx} className="term-chip term-chip-fake mono-text">
                    {t.term} <small style={{ opacity: 0.8 }}>({t.weight > 0 ? "+" : ""}{t.weight})</small>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {realTerms.length > 0 && (
          <div className="col-12 col-md-6">
            <div className="p-3" style={{ backgroundColor: "var(--app-cream)", borderRadius: "12px", border: "1px solid var(--app-border-subtle)" }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--app-real-ink)" }} />
                <span className="mono-text" style={{ fontSize: "12px", fontWeight: 600, color: "var(--app-real-ink)", textTransform: "uppercase" }}>
                  Pushed Toward Real ({realTerms.length})
                </span>
              </div>
              <div className="d-flex flex-wrap">
                {realTerms.map((t, idx) => (
                  <span key={idx} className="term-chip term-chip-real mono-text">
                    {t.term} <small style={{ opacity: 0.8 }}>({t.weight > 0 ? "+" : ""}{t.weight})</small>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
