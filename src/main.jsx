import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { LanguageProvider } from "./i18n.jsx";
import "./base.css";
import "./language-switch.css";
import "./portfolio.css";
import "./hero.css";
import "./projects.css";
import "./services.css";
import "./about.css";
import "./faq.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
);
