import React, { useState, useEffect } from "react";
import { Form, Spinner, Alert } from "react-bootstrap";
import { analyseArticle, getSamples, extractFromUrl } from "../api/client.js";
import PredictionCard from "../components/PredictionCard.jsx";
import TermsHighlight from "../components/TermsHighlight.jsx";
import NeighboursTable from "../components/NeighboursTable.jsx";

const DEFAULT_SAMPLES = [
  {
    name: "Sample 1 (Fake Pattern)",
    title: "BREAKING: Proof Of Secret Coup Revealed By High Official",
    text: "Shocking new leaked documents reveal an active treasonous plot by deep-state officials to overturn democratic election results overnight. Whistleblowers have confirmed covert operations and illegal surveillance sweeps targeting prominent patriots across Washington. Mainstream media networks remain completely silent, actively colluding with corrupt bureaucrats to bury the explosive revelations. Share this report everywhere before it gets scrubbed from all public platforms!",
  },
  {
    name: "Sample 2 (Real Pattern)",
    title: "Federal Reserve Holds Benchmark Interest Rates Steady Amid Inflation Data",
    text: "The Federal Reserve decided to maintain its key interest rate target on Wednesday, noting continued economic expansion alongside moderating consumer price pressures. In an official policy statement released following the Federal Open Market Committee meeting, Chairman Jerome Powell stated that committee members remain committed to achieving their dual mandate of maximum employment and two percent inflation over the longer term. Financial markets responded with modest gains across major equity indexes.",
  },
  {
    name: "Sample 3 (Borderline Claim)",
    title: "Global Tech Summit Announces New Artificial Intelligence Energy Standards",
    text: "Industry leaders and environmental policy researchers gathered in Geneva this week to establish voluntary guidelines aimed at reducing carbon footprints from large-scale computing clusters. While prominent software conglomerates pledged adherence to energy efficiency targets, independent environmental groups questioned whether voluntary mechanisms provide sufficient accountability without binding regulatory enforcement.",
  },
];

export default function AnalyseView() {
  const [inputMode, setInputMode] = useState("text"); // "text" | "url"
  const [url, setUrl] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [model, setModel] = useState("lr");
  const [retriever, setRetriever] = useState("tfidf");
  const [k, setK] = useState(5);
  const [showSettings, setShowSettings] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [samples, setSamples] = useState(DEFAULT_SAMPLES);

  useEffect(() => {
    getSamples().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setSamples(fetched);
      }
    });
  }, []);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isValidLength = wordCount >= 20;

  const triggerAnalysis = async (docTitle, docText) => {
    const wc = docText.trim() ? docText.trim().split(/\s+/).length : 0;
    if (wc < 20) {
      setError(`Article must contain at least 20 words for reliable analysis (${wc} currently).`);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await analyseArticle({
        title: docTitle,
        text: docText,
        model,
        retriever,
        k,
      });
      setResult(res);
    } catch (err) {
      setError(err.message || "Analysis request failed. Please check server status.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyse = (e) => {
    if (e) e.preventDefault();
    triggerAnalysis(title, text);
  };

  const handleFetchUrl = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;
    setError("");
    setFetchingUrl(true);
    try {
      const extracted = await extractFromUrl(url.trim());
      setTitle(extracted.title || "");
      setText(extracted.text || "");
      setInputMode("text"); // Switch back to text so user sees what was extracted
      // Automatically run analysis on extracted text
      await triggerAnalysis(extracted.title || "", extracted.text || "");
    } catch (err) {
      setError(err.message || "Failed to extract article from URL. Please paste the article text manually.");
    } finally {
      setFetchingUrl(false);
    }
  };

  const loadSample = (sample) => {
    setTitle(sample.title || "");
    setText(sample.text || "");
    setError("");
    setResult(null);
    setInputMode("text");
  };

  return (
    <div className="py-3">
      {/* Minimalist Heading */}
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-3">
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--app-ink)", margin: 0 }}>
            Article Credibility & Evidence Retrieval
          </h1>
          <p style={{ fontSize: "14px", color: "var(--app-fog)", margin: "4px 0 0 0" }}>
            Paste any news text or enter an online article URL to inspect credibility patterns, lexical triggers, and corroborating stories.
          </p>
        </div>

        {/* Minimal Quick Samples */}
        <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
          <span style={{ fontSize: "12px", color: "var(--app-fog)" }}>Try example:</span>
          {samples.slice(0, 3).map((s, idx) => (
            <button
              key={idx}
              type="button"
              className="btn-clean-subtle"
              onClick={() => loadSample(s)}
            >
              {s.name.replace(/Sample \d+ \((.*?)\)/, "$1")}
            </button>
          ))}
        </div>
      </div>

      {/* Input Mode Selector: Direct Text vs URL */}
      <div className="d-flex align-items-center gap-2 mb-2">
        <div className="segmented-bar">
          <button
            type="button"
            className={`segmented-bar-btn ${inputMode === "text" ? "active" : ""}`}
            onClick={() => setInputMode("text")}
          >
            Direct Text Input
          </button>
          <button
            type="button"
            className={`segmented-bar-btn ${inputMode === "url" ? "active" : ""}`}
            onClick={() => setInputMode("url")}
          >
            Fetch From URL
          </button>
        </div>
        <span style={{ fontSize: "12px", color: "var(--app-pewter)" }}>
          {inputMode === "url" ? "Enter any public news link to auto-extract" : "Paste title and article body"}
        </span>
      </div>

      {/* Input Card */}
      <div className="card-clean mb-4">
        {inputMode === "url" ? (
          /* URL Input Mode */
          <Form onSubmit={handleFetchUrl}>
            <div className="mb-3">
              <label className="form-label mono-text" style={{ fontSize: "11px", color: "var(--app-fog)", textTransform: "uppercase" }}>
                Public News Article Link
              </label>
              <div className="d-flex flex-wrap gap-2">
                <Form.Control
                  type="url"
                  placeholder="https://www.reuters.com/world/... or any public news URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="form-control-minimal"
                  style={{ flex: 1, minWidth: "260px" }}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn-clean-primary d-flex align-items-center gap-2"
                  disabled={fetchingUrl || !url.trim()}
                >
                  {fetchingUrl && <Spinner animation="border" size="sm" style={{ borderWidth: "2px" }} />}
                  <span>{fetchingUrl ? "Extracting..." : "Extract & Verify Article"}</span>
                </button>
              </div>
              <div className="mt-2" style={{ fontSize: "12.5px", color: "var(--app-fog)" }}>
                Extracts the headline and main body text automatically from the web page, removing ads, navigation, and boilerplate.
              </div>
            </div>
          </Form>
        ) : (
          /* Direct Text Input Mode */
          <Form onSubmit={handleAnalyse}>
            {/* Headline Input (Optional) */}
            <div className="mb-3">
              <Form.Control
                type="text"
                placeholder="Article title or headline (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-control-minimal"
                style={{ fontWeight: 500 }}
              />
            </div>

            {/* Article Textarea */}
            <div className="mb-3">
              <Form.Control
                as="textarea"
                rows={6}
                placeholder="Paste article text here (minimum 20 words)..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="form-control-minimal"
                style={{ fontSize: "13.5px", lineHeight: "1.65" }}
              />
            </div>

            {/* Action Row & Minimal Settings Toggle */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div className="d-flex align-items-center gap-3">
                <button
                  type="submit"
                  className="btn-clean-primary d-flex align-items-center gap-2"
                  disabled={loading || !isValidLength}
                >
                  {loading && <Spinner animation="border" size="sm" style={{ borderWidth: "2px" }} />}
                  <span>{loading ? "Analyzing..." : "Verify Article"}</span>
                </button>

                <span
                  className="mono-text"
                  style={{
                    fontSize: "12px",
                    color: isValidLength ? "var(--app-real-ink)" : wordCount > 0 ? "var(--app-alert-ink)" : "var(--app-pewter)",
                  }}
                >
                  {wordCount} words {isValidLength ? "✓" : "(20 min)"}
                </span>
              </div>

              <button
                type="button"
                className="btn-clean-subtle d-flex align-items-center gap-1"
                onClick={() => setShowSettings(!showSettings)}
              >
                <span>Options</span>
                <span style={{ fontSize: "10px", opacity: 0.7 }}>{showSettings ? "▲" : "▼"}</span>
              </button>
            </div>

            {/* Collapsible Refined Settings (No Clutter by Default) */}
            {showSettings && (
              <div
                className="mt-3 pt-3 d-flex flex-wrap gap-4 align-items-center"
                style={{ borderTop: "1px solid var(--app-border-subtle)" }}
              >
                {/* Model */}
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: "12px", color: "var(--app-fog)" }}>Classifier:</span>
                  <div className="segmented-bar">
                    <button
                      type="button"
                      className={`segmented-bar-btn ${model === "lr" ? "active" : ""}`}
                      onClick={() => setModel("lr")}
                    >
                      Logistic Reg
                    </button>
                    <button
                      type="button"
                      className={`segmented-bar-btn ${model === "svm" ? "active" : ""}`}
                      onClick={() => setModel("svm")}
                    >
                      Linear SVM
                    </button>
                    <button
                      type="button"
                      className={`segmented-bar-btn ${model === "nb" ? "active" : ""}`}
                      onClick={() => setModel("nb")}
                    >
                      Naive Bayes
                    </button>
                  </div>
                </div>

                {/* Retriever */}
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: "12px", color: "var(--app-fog)" }}>Retriever:</span>
                  <div className="segmented-bar">
                    <button
                      type="button"
                      className={`segmented-bar-btn ${retriever === "tfidf" ? "active" : ""}`}
                      onClick={() => setRetriever("tfidf")}
                    >
                      TF-IDF Cosine
                    </button>
                    <button
                      type="button"
                      className={`segmented-bar-btn ${retriever === "bm25" ? "active" : ""}`}
                      onClick={() => setRetriever("bm25")}
                    >
                      BM25 Okapi
                    </button>
                  </div>
                </div>

                {/* Top-K */}
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: "12px", color: "var(--app-fog)" }}>Matches:</span>
                  <div className="segmented-bar">
                    {[3, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`segmented-bar-btn ${k === num ? "active" : ""}`}
                        onClick={() => setK(num)}
                      >
                        Top {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Form>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <Alert variant="danger" className="py-2 px-3 mb-4" style={{ borderRadius: "5px", fontSize: "13px" }}>
          {error}
        </Alert>
      )}

      {/* Analysis Output Section */}
      {result && (
        <div>
          {/* Verdict Banner */}
          <PredictionCard
            result={result}
            selectedModel={model}
            selectedRetriever={retriever}
          />

          {/* Lexical Explainability ("Show Don't Tell" with inline highlights) */}
          <TermsHighlight
            terms={result.terms}
            originalText={text}
          />

          {/* Retrieved Corroborating Evidence */}
          <NeighboursTable
            neighbours={result.neighbours}
            vote={result.vote}
            retriever={retriever}
          />
        </div>
      )}
    </div>
  );
}
