import React, { useState, useEffect } from "react";
import { Form, Spinner, Alert } from "react-bootstrap";
import { analyseArticle, getSamples } from "../api/client.js";
import PredictionCard from "../components/PredictionCard.jsx";
import TermsHighlight from "../components/TermsHighlight.jsx";
import NeighboursTable from "../components/NeighboursTable.jsx";

// Fallback curated samples if backend samples.json is not generated yet
const DEFAULT_SAMPLES = [
  {
    name: "Sample 1 (Fake Pattern)",
    title: "BREAKING BOMBSHELL: Proof Of Secret Coup Revealed By High Official",
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
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [model, setModel] = useState("lr");
  const [retriever, setRetriever] = useState("tfidf");
  const [k, setK] = useState(5);

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

  const handleAnalyse = async (e) => {
    if (e) e.preventDefault();
    if (!isValidLength) {
      setError(`Article must contain at least 20 words for analysis (currently ${wordCount} words).`);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await analyseArticle({
        title,
        text,
        model,
        retriever,
        k,
      });
      setResult(res);
    } catch (err) {
      setError(err.message || "Analysis failed. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (sample) => {
    setTitle(sample.title || "");
    setText(sample.text || "");
    setError("");
    setResult(null);
  };

  return (
    <div className="py-2">
      {/* Editorial Header */}
      <div className="mb-4">
        <h1 style={{ fontSize: "36px", fontWeight: 600, color: "var(--app-ink)", letterSpacing: "-0.03em" }}>
          Veritas: Fake News Detection & Evidence Retrieval
        </h1>
        <p style={{ fontSize: "16px", color: "var(--app-fog)", maxWidth: "760px", marginTop: "6px" }}>
          Analyze news articles using classical Machine Learning and Vector Space Models. The system classifies textual patterns, explains influential terms, and retrieves supporting articles from the WELFake corpus.
        </p>
      </div>

      {/* Input Box Card */}
      <div className="card-paper mb-4">
        <Form onSubmit={handleAnalyse}>
          {/* Headline Input */}
          <div className="mb-3">
            <label className="form-label mono-text" style={{ fontSize: "12px", color: "var(--app-fog)", textTransform: "uppercase" }}>
              Headline / Title (Optional)
            </label>
            <Form.Control
              type="text"
              placeholder="e.g. Breaking: Major government investigation announced..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-control-editorial"
            />
          </div>

          {/* Article Textarea */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label mono-text m-0" style={{ fontSize: "12px", color: "var(--app-fog)", textTransform: "uppercase" }}>
                Article Body (Minimum 20 Words)
              </label>
              <span
                className="mono-text"
                style={{
                  fontSize: "12px",
                  color: isValidLength ? "var(--app-real-ink)" : wordCount > 0 ? "var(--app-alert-ink)" : "var(--app-pewter)",
                }}
              >
                {wordCount} words {isValidLength ? "· Valid length" : "(Need 20+)"}
              </span>
            </div>
            <Form.Control
              as="textarea"
              rows={7}
              placeholder="Paste the full text of the news article here to evaluate styling, vocabulary, and retrieve related stories..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="form-control-editorial"
            />
          </div>

          {/* Controls Bar */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-2 mb-4">
            {/* Model Selector */}
            <div className="d-flex align-items-center gap-2">
              <span className="mono-text" style={{ fontSize: "12px", color: "var(--app-fog)" }}>
                Classifier:
              </span>
              <div className="segmented-control">
                <button
                  type="button"
                  className={`segmented-control-btn ${model === "lr" ? "active" : ""}`}
                  onClick={() => setModel("lr")}
                >
                  Logistic Reg. (Default)
                </button>
                <button
                  type="button"
                  className={`segmented-control-btn ${model === "svm" ? "active" : ""}`}
                  onClick={() => setModel("svm")}
                >
                  Linear SVM
                </button>
                <button
                  type="button"
                  className={`segmented-control-btn ${model === "nb" ? "active" : ""}`}
                  onClick={() => setModel("nb")}
                >
                  Naive Bayes
                </button>
              </div>
            </div>

            {/* Retriever Selector */}
            <div className="d-flex align-items-center gap-2">
              <span className="mono-text" style={{ fontSize: "12px", color: "var(--app-fog)" }}>
                Retriever:
              </span>
              <div className="segmented-control">
                <button
                  type="button"
                  className={`segmented-control-btn ${retriever === "tfidf" ? "active" : ""}`}
                  onClick={() => setRetriever("tfidf")}
                >
                  TF-IDF Cosine
                </button>
                <button
                  type="button"
                  className={`segmented-control-btn ${retriever === "bm25" ? "active" : ""}`}
                  onClick={() => setRetriever("bm25")}
                >
                  BM25 Okapi
                </button>
              </div>
            </div>

            {/* Top-K Selector */}
            <div className="d-flex align-items-center gap-2">
              <span className="mono-text" style={{ fontSize: "12px", color: "var(--app-fog)" }}>
                Top-K:
              </span>
              <div className="segmented-control">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`segmented-control-btn ${k === num ? "active" : ""}`}
                    onClick={() => setK(num)}
                  >
                    K={num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--app-border-subtle)" }}>
            <div className="d-flex align-items-center gap-3">
              <button
                type="submit"
                className="btn-pill-primary d-flex align-items-center gap-2"
                disabled={loading || !isValidLength}
              >
                {loading && <Spinner animation="border" size="sm" style={{ borderWidth: "2px" }} />}
                <span>{loading ? "Analyzing Article..." : "Analyse article"}</span>
              </button>
              {loading && (
                <span className="mono-text" style={{ fontSize: "12px", color: "var(--app-fog)" }}>
                  Warming up models & calculating similarity...
                </span>
              )}
            </div>

            {/* Sample Buttons */}
            <div className="d-flex align-items-center gap-2">
              <span className="mono-text" style={{ fontSize: "11px", color: "var(--app-pewter)" }}>
                Load Sample:
              </span>
              {samples.slice(0, 3).map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn-pill-ghost"
                  onClick={() => loadSample(s)}
                >
                  {s.name || `Sample ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        </Form>

        {error && (
          <Alert variant="warning" className="pill-alert mt-3 mb-0">
            {error}
          </Alert>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div id="results-section">
          <PredictionCard
            result={result}
            selectedModel={model}
            selectedRetriever={retriever}
          />
          <TermsHighlight terms={result.terms} originalText={text} />
          <NeighboursTable
            neighbours={result.neighbours}
            vote={result.vote}
            retriever={retriever}
          />
        </div>
      )}

      {/* Disclaimer Strip */}
      <div className="text-center py-4">
        <p className="mono-text" style={{ fontSize: "12px", color: "var(--app-pewter)", maxWidth: "720px", margin: "0 auto" }}>
          Notice: This Information Retrieval system detects writing patterns, vocabulary, and stylistic markers correlated with fake news in its training corpus. It does not verify real-world factual claims.
        </p>
      </div>
    </div>
  );
}
