import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, beforeEach } from "vitest";

import { useAuthStore } from "@shared/stores/authStore";

import { GuestRoute } from "./GuestRoute";

const AppPage = () => <div data-testid="app-page">App Page</div>;
const GuestContent = () => <div data-testid="guest-content">Guest Content</div>;

describe("GuestRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: "resolving",
      accessToken: null,
      user: null,
    });
  });

  it("renders a spinner when resolving", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<GuestContent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByTestId("guest-content")).not.toBeInTheDocument();
  });

  it("renders the outlet content when unauthenticated", () => {
    useAuthStore.setState({ status: "unauthenticated" });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<GuestContent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("guest-content")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("redirects to /app when authenticated", () => {
    useAuthStore.setState({ status: "authenticated" });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/app" element={<AppPage />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<GuestContent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("app-page")).toBeInTheDocument();
    expect(screen.queryByTestId("guest-content")).not.toBeInTheDocument();
  });
});
