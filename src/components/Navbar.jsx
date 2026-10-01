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
        <div className="d-flex align-items-center gap-2">
          <Navbar.Brand
            className="navbar-brand-custom m-0"
            role="button"
            onClick={() => onSelectTab("analyse")}
            style={{ cursor: "pointer" }}
          >
            <span
              style={{
                display: "inline-block",
                width: "9px",
                height: "9px",
                backgroundColor: "var(--app-ink)",
                borderRadius: "2px",
              }}
            />
            Veritas
          </Navbar.Brand>
          <span className="tag-badge tag-neutral d-none d-sm-inline-flex" style={{ fontSize: "10px" }}>
            IR System
          </span>
        </div>

        <div className="d-flex align-items-center gap-1">
          <Nav activeKey={activeTab} onSelect={onSelectTab} className="d-flex gap-1">
            <Nav.Link eventKey="analyse" className={`nav-link-custom ${activeTab === "analyse" ? "active" : ""}`}>
              Verify
            </Nav.Link>
            <Nav.Link eventKey="dashboard" className={`nav-link-custom ${activeTab === "dashboard" ? "active" : ""}`}>
              Benchmarks
            </Nav.Link>
            <Nav.Link eventKey="about" className={`nav-link-custom ${activeTab === "about" ? "active" : ""}`}>
              Methodology
            </Nav.Link>
          </Nav>

          <div
            className="d-none d-md-flex align-items-center gap-2 ms-3 ps-3"
            style={{ borderLeft: "1px solid var(--app-border-subtle)" }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: health.models_loaded ? "#12b76a" : "#f79009",
              }}
            />
            <span className="mono-text" style={{ fontSize: "11px", color: "var(--app-fog)" }}>
              {health.models_loaded ? "Engine Ready" : "Standby"}
            </span>
          </div>
        </div>
      </Container>
    </Navbar>
  );
}
