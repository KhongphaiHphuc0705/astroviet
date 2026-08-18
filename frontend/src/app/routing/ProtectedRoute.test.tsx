import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, beforeEach } from "vitest";

import { useAuthStore } from "@shared/stores/authStore";

import { ProtectedRoute } from "./ProtectedRoute";

// Mock page to see where we landed
const LoginPage = () => {
  const location = useLocation();
  return (
    <div data-testid="login-page">
      Login Page. Redirect:{" "}
      {new URLSearchParams(location.search).get("redirect")}
    </div>
  );
};

const ProtectedContent = () => (
  <div data-testid="protected-content">Protected Content</div>
);

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: "resolving",
      accessToken: null,
      user: null,
    });
  });

  it("renders a spinner when resolving", () => {
    render(
      <MemoryRouter initialEntries={["/app/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/app/dashboard" element={<ProtectedContent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renders the outlet content when authenticated", () => {
    useAuthStore.setState({ status: "authenticated" });

    render(
      <MemoryRouter initialEntries={["/app/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/app/dashboard" element={<ProtectedContent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("redirects to login with proper encoded path when unauthenticated", () => {
    useAuthStore.setState({ status: "unauthenticated" });

    render(
      <MemoryRouter initialEntries={["/app/dashboard?filter=active#section"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/app/dashboard" element={<ProtectedContent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("login-page")).toBeInTheDocument();

    // Check if the redirect parameter was constructed properly.
    // MemoryRouter parses the initialEntry into the location object.
    expect(
      screen.getByText(
        "Login Page. Redirect: /app/dashboard?filter=active#section",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });
});
