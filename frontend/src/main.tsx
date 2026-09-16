import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@app/styles/tokens.css";
import "@app/styles/base.css";
import App from "@app/App";
import { registerAuthInfrastructure } from "@features/auth";

// Register API infrastructure
registerAuthInfrastructure();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
