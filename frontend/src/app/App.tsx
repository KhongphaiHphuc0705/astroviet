import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { RouterProvider } from "react-router-dom";

import { ThemeProvider } from "@app/providers/ThemeProvider";
import { router } from "@app/router";
import { queryClient } from "@shared/api/queryClient";

export default function App() {
  return (
    <StrictMode>
      <ThemeProvider>
        {/* TODO(Core): Bọc I18nextProvider khi thực sự cài đặt (Architecture Spec §14.3) */}
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
