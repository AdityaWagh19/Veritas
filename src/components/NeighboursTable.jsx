import React from "react";

export default function NeighboursTable({ neighbours = [], vote = {}, retriever = "tfidf" }) {
  if (!neighbours || neighbours.length === 0) return null;

  const fakePct = Math.round((vote.fake_pct || 0) * 100);
  const realPct = Math.round((vote.real_pct || 0) * 100);

  return (
    <div className="card-clean mb-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h4 style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "var(--app-ink)" }}>
            Corroborating Reference Stories (Top {neighbours.length})
          </h4>
          <span style={{ fontSize: "12.5px", color: "var(--app-fog)" }}>
            Similar articles retrieved via {retriever === "bm25" ? "BM25 Okapi" : "TF-IDF Cosine"} for cross-verification.
          </span>
        </div>

        {/* Minimal Consensus Bar */}
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: "12px", color: "var(--app-steel)" }}>Corpus match:</span>
          <span className="tag-badge tag-neutral" style={{ fontSize: "11px" }}>
            {fakePct}% Fake · {realPct}% Real
          </span>
          {vote.agrees ? (
            <span style={{ fontSize: "11px", color: "var(--app-real-ink)", fontWeight: 600 }}>
              ✓ Consistent
            </span>
          ) : (
            <span style={{ fontSize: "11px", color: "var(--app-alert-ink)", fontWeight: 600 }}>
              ⚠️ Divergent
            </span>
          )}
        </div>
      </div>

      {/* Clean Table */}
      <div className="table-responsive">
        <table className="clean-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>#</th>
              <th style={{ width: "95px" }}>Status</th>
              <th style={{ width: "90px" }}>Match</th>
              <th>Article Headline & Snippet</th>
            </tr>
          </thead>
          <tbody>
            {neighbours.map((item, index) => {
              const isItemFake = item.label.toLowerCase() === "fake";
              // Calculate a visual normalized match percentage
              const scoreVal = typeof item.score === "number" ? item.score : parseFloat(item.score) || 0;
              const matchPct = retriever === "bm25" 
                ? Math.min(100, Math.round((scoreVal / 25) * 100)) 
                : Math.min(100, Math.round(scoreVal * 100));

              return (
                <tr key={index}>
                  <td>
                    <span className="mono-text" style={{ fontSize: "12px", color: "var(--app-fog)" }}>
                      {index + 1}
                    </span>
                  </td>
                  <td>
                    <span className={`tag-badge ${isItemFake ? "tag-fake" : "tag-real"}`}>
                      {item.label}
                    </span>
                  </td>
                  <td>
                    <div style={{ width: "70px" }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="mono-text" style={{ fontSize: "11px", color: "var(--app-steel)" }}>
                          {item.score}
                        </span>
                      </div>
                      <div style={{ height: "4px", backgroundColor: "var(--app-border-subtle)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${Math.max(10, matchPct)}%`, height: "100%", backgroundColor: "var(--app-steel)" }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--app-ink)", fontSize: "13.5px", marginBottom: "3px" }}>
                      {item.title || "Untitled Reference Article"}
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--app-fog)", lineHeight: "1.5" }}>
                      {item.snippet}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
