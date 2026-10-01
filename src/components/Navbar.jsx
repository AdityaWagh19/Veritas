import React, { useEffect, useState } from "react";
import { Container, Navbar, Nav } from "react-bootstrap";
import { checkHealth } from "../api/client.js";

export default function AppNavbar({ activeTab, onSelectTab }) {
  const [health, setHealth] = useState({ status: "checking", models_loaded: false });

  useEffect(() => {
    let isMounted = true;
    checkHealth().then((res) => {
      if (isMounted) setHealth(res);
    });
    const interval = setInterval(() => {
      checkHealth().then((res) => {
        if (isMounted) setHealth(res);
      });
    }, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Navbar className="app-navbar sticky-top">
      <Container className="app-container d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <Navbar.Brand
            className="navbar-brand-custom m-0"
            role="button"
            onClick={() => onSelectTab("analyse")}
          >
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                backgroundColor: "#0a0a0a",
                borderRadius: "9999px",
              }}
            />
            Veritas
          </Navbar.Brand>
          <span className="pill-badge pill-neutral" style={{ fontSize: "11px", padding: "2px 8px" }}>
            IR Mini Project
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Nav activeKey={activeTab} onSelect={onSelectTab} className="d-flex gap-1">
            <Nav.Link eventKey="analyse" className={`nav-link-custom ${activeTab === "analyse" ? "active" : ""}`}>
              Analyse
            </Nav.Link>
            <Nav.Link eventKey="dashboard" className={`nav-link-custom ${activeTab === "dashboard" ? "active" : ""}`}>
              Dashboard
            </Nav.Link>
            <Nav.Link eventKey="about" className={`nav-link-custom ${activeTab === "about" ? "active" : ""}`}>
              About
            </Nav.Link>
          </Nav>

          <div
            className="d-none d-md-flex align-items-center gap-2 ms-3 ps-3"
            style={{ borderLeft: "1px solid var(--app-border)" }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: health.models_loaded ? "#28c840" : "#ffbd2e",
              }}
              title={health.models_loaded ? "Models active and cached" : "Models loading / cold"}
            />
            <span className="mono-text" style={{ fontSize: "11px", color: "var(--app-fog)" }}>
              {health.models_loaded ? "Models Loaded" : "Engine Standby"}
            </span>
          </div>
        </div>
      </Container>
    </Navbar>
  );
}
