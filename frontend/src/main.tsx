import { StrictMode } from "react";

import "@app/styles/tokens.css";
import "@app/styles/base.css";
import App from "@app/App";
import { mountApp } from "@app/hydrate";
import { registerAuthInfrastructure } from "@features/auth";

// Register API infrastructure
registerAuthInfrastructure();

mountApp(
  document.getElementById("root"),
  <StrictMode>
    <App />
  </StrictMode>,
);
