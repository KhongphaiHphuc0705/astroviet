import { render, type RenderOptions } from "@testing-library/react";
import React, { type ReactElement } from "react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";

import { ThemeProvider } from "@app/providers/ThemeProvider";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: MemoryRouterProps["initialEntries"];
}

export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ["/"], ...options }: CustomRenderOptions = {},
) {
  const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <ThemeProvider>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </ThemeProvider>
    );
  };

  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
