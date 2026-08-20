import { StrictMode } from "react";
import { RouterProvider } from "react-router-dom";

import { ThemeProvider } from "@app/providers/ThemeProvider";
import { router } from "@app/router";

export default function App() {
  return (
    <StrictMode>
      <ThemeProvider>
        {/* TODO(Core): Bọc QueryClientProvider và I18nextProvider khi thực sự cài đặt (Architecture Spec §14.3) */}
        <RouterProvider router={router} />
      </ThemeProvider>
    </StrictMode>
  );
}
