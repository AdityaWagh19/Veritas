import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/theme.css";
import App from "./App.jsx";

// Enforce strict light theme across the application
document.documentElement.setAttribute("data-bs-theme", "light");

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
