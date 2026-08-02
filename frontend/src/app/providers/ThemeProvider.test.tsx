import { render } from "@testing-library/react";
import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import { usePreferenceStore } from "@shared/stores/preferenceStore";

import { ThemeProvider } from "./ThemeProvider";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("ThemeProvider", () => {
  beforeEach(() => {
    usePreferenceStore.setState({
      preference: "system",
      resolvedTheme: "light",
    });
    document.documentElement.setAttribute("data-theme", "light");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("syncs resolvedTheme to DOM attribute when mounted", () => {
    usePreferenceStore.setState({ preference: "dark", resolvedTheme: "dark" });
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("sets resolvedTheme based on explicit light preference", () => {
    usePreferenceStore.setState({ preference: "light" });
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>,
    );
    expect(usePreferenceStore.getState().resolvedTheme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("sets resolvedTheme based on explicit dark preference", () => {
    usePreferenceStore.setState({ preference: "dark" });
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>,
    );
    expect(usePreferenceStore.getState().resolvedTheme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
