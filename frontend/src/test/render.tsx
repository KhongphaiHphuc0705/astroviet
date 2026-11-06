import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import React, { type ReactElement } from "react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";

import { ThemeProvider } from "@app/providers/ThemeProvider";
import { createQueryClient } from "@shared/api/queryClient";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: MemoryRouterProps["initialEntries"];
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ["/"], queryClient, ...options }: CustomRenderOptions = {},
) {
  // Create a new QueryClient for each test to prevent cache leakage
  const testQueryClient = queryClient ?? createQueryClient();

  const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <ThemeProvider>
        {/* TODO(Core): Bọc I18nextProvider khi thực sự cài đặt (Architecture Spec §14.3) */}
        <QueryClientProvider client={testQueryClient}>
          <MemoryRouter initialEntries={initialEntries}>
            {children}
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeProvider>
    );
  };

  const result = render(ui, { wrapper: AllProviders, ...options });
  return Object.assign(result, { queryClient: testQueryClient });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
