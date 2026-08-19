import { screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";

import { ProtectedRoute } from "@app/routing/ProtectedRoute";
import { useAuthStore } from "@shared/stores/authStore";

import { renderWithProviders } from "./render";

describe("renderWithProviders Helper", () => {
  beforeEach(() => {
    // Set a predictable state so ProtectedRoute renders something predictable
    useAuthStore.setState({
      status: "resolving",
      accessToken: null,
      user: null,
    });
  });

  it("successfully renders a component that requires Router and Theme providers", () => {
    // ProtectedRoute uses useLocation() internally, which will THROW if not wrapped in a Router.
    // By using renderWithProviders, we prove the helper supplies the MemoryRouter context correctly.
    // Additionally, the ThemeProvider is also mounted implicitly.
    expect(() => {
      renderWithProviders(<ProtectedRoute />, {
        initialEntries: ["/app/some-path"],
      });
    }).not.toThrow();

    // Verify it rendered the spinner (because status is 'resolving')
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
