import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@app/styles/tokens.css";
import "@app/styles/base.css";
import App from "@app/App";
import { bootstrapAuthResolution } from "@shared/stores/authStore";

// Initialize auth store state early
bootstrapAuthResolution();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
