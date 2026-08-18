import { StrictMode } from "react";
import { RouterProvider } from "react-router-dom";

import { ThemeProvider } from "@app/providers/ThemeProvider";
import { router } from "@app/router";

export default function App() {
  return (
    <StrictMode>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </StrictMode>
  );
}
