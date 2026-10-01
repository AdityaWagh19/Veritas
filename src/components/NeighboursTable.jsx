import React from "react";

export default function NeighboursTable({ neighbours = [], vote = {}, retriever = "tfidf" }) {
  if (!neighbours || neighbours.length === 0) return null;

  const fakePct = Math.round((vote.fake_pct || 0) * 100);
  const realPct = Math.round((vote.real_pct || 0) * 100);

  return (
    <div className="card-paper mb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div>
          <h5 style={{ fontSize: "16px", margin: 0, fontWeight: 600 }}>
            Ranked Evidence Retrieval (Top-{neighbours.length})
          </h5>
          <span style={{ fontSize: "13px", color: "var(--app-fog)" }}>
            Similar documents retrieved from the indexed training corpus via{" "}
            <strong>{retriever === "bm25" ? "BM25 Okapi" : "TF-IDF Cosine Dot Product"}</strong>.
          </span>
        </div>

        {/* Neighbour Vote Consensus Strip */}
        <div className="d-flex align-items-center gap-3 p-2 px-3" style={{ backgroundColor: "var(--app-cream)", borderRadius: "9999px", border: "1px solid var(--app-border)" }}>
          <span className="mono-text" style={{ fontSize: "12px", color: "var(--app-steel)" }}>
            Neighbor Consensus:
          </span>
          <div className="d-flex align-items-center gap-2">
            <span className="pill-badge pill-fake" style={{ fontSize: "11px", padding: "2px 8px" }}>
              {fakePct}% Fake
            </span>
            <span className="pill-badge pill-real" style={{ fontSize: "11px", padding: "2px 8px" }}>
              {realPct}% Real
            </span>
          </div>
          {vote.agrees ? (
            <span className="mono-text" style={{ fontSize: "11px", color: "var(--app-real-ink)", fontWeight: 600 }}>
              ✓ High Agreement
            </span>
          ) : (
            <span className="mono-text" style={{ fontSize: "11px", color: "var(--app-alert-ink)", fontWeight: 600 }}>
              ⚠️ Low Agreement
            </span>
          )}
        </div>
      </div>

      {/* Retrieved Documents Table */}
      <div className="table-responsive">
        <table className="similar-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>Rank</th>
              <th style={{ width: "110px" }}>Score</th>
              <th style={{ width: "90px" }}>Corpus Label</th>
              <th>Article Title & Content Snippet</th>
            </tr>
          </thead>
          <tbody>
            {neighbours.map((item, index) => {
              const isItemFake = item.label.toLowerCase() === "fake";
              return (
                <tr key={index}>
                  <td>
                    <span className="mono-text" style={{ fontWeight: 600, color: "var(--app-ink)" }}>
                      #{index + 1}
                    </span>
                  </td>
                  <td>
                    <span className="mono-text" style={{ fontSize: "12px", color: "var(--app-steel)" }}>
                      {retriever === "bm25" ? "BM25: " : "Sim: "}
                      <strong>{item.score}</strong>
                    </span>
                  </td>
                  <td>
                    <span
                      className={`pill-badge ${isItemFake ? "pill-fake" : "pill-real"}`}
                      style={{ fontSize: "11px", padding: "2px 8px" }}
                    >
                      {item.label}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--app-ink)", fontSize: "14px", marginBottom: "4px" }}>
                      {item.title || "Untitled Article"}
                    </div>
                    <div style={{ color: "var(--app-steel)", fontSize: "13px", lineHeight: "1.5" }}>
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
