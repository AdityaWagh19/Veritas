import React, { useState } from "react";
import { Container } from "react-bootstrap";
import AppNavbar from "./components/Navbar.jsx";
import AnalyseView from "./views/AnalyseView.jsx";
import DashboardView from "./views/DashboardView.jsx";
import AboutView from "./views/AboutView.jsx";

export default function App() {
  const [activeTab, setActiveTab] = useState("analyse");

  return (
    <div className="d-flex flex-column min-vh-100">
      <AppNavbar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-grow-1">
        <Container className="app-container py-4">
          {activeTab === "analyse" && <AnalyseView />}
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "about" && <AboutView />}
        </Container>
      </main>

      <footer className="py-4 mt-5" style={{ borderTop: "1px solid var(--app-border-subtle)" }}>
        <Container className="app-container d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="mono-text" style={{ fontSize: "12px", color: "var(--app-fog)" }}>
            Veritas · SPPU Information Retrieval Mini Project · WELFake Dataset
          </div>
          <div className="mono-text" style={{ fontSize: "12px", color: "var(--app-pewter)" }}>
            TF-IDF · BM25 Okapi · Cosine VSM · Classical ML
          </div>
        </Container>
      </footer>
    </div>
  );
}
