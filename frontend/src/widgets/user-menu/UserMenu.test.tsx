import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, afterEach, describe, expect, it } from "vitest";

import {
  logoutSuccess,
  logoutServerError,
} from "@features/auth/api/mocks/handlers";
import { createQueryClient } from "@shared/api/queryClient";
import { useAuthStore } from "@shared/stores/authStore";
import { server } from "@test/msw-server";

import { UserMenu } from "./index";

const mockUser = {
  id: "1",
  email: "test@example.com",
  displayName: "Test User",
  role: "user" as const,
  createdAt: new Date().toISOString(),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>
    <MemoryRouter initialEntries={["/app"]}>
      <Routes>
        <Route path="/app" element={children} />
        <Route
          path="/login"
          element={<div data-testid="login-page">Login Page</div>}
        />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>
);

describe("UserMenu - Tests", () => {
  beforeEach(() => {
    // Setup authenticated state
    useAuthStore.setState({
      status: "authenticated",
      user: mockUser,
      accessToken: "fake-token",
    });
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("Test 1: Logout success - clears session and navigates to /login", async () => {
    server.use(logoutSuccess());

    const user = userEvent.setup();
    render(<UserMenu />, { wrapper });

    // Verify initial rendering
    expect(screen.getByText("Test User")).toBeInTheDocument();

    // Click logout
    const logoutBtn = screen.getByRole("button", { name: "Đăng xuất" });
    await user.click(logoutBtn);

    // Wait for the navigation to happen
    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });

    // Check store state
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });

  it("Test 2: Logout failure - still clears session and navigates to /login", async () => {
    server.use(logoutServerError());

    const user = userEvent.setup();
    render(<UserMenu />, { wrapper });

    expect(screen.getByText("Test User")).toBeInTheDocument();

    // Click logout
    const logoutBtn = screen.getByRole("button", { name: "Đăng xuất" });
    await user.click(logoutBtn);

    // Wait for the navigation to happen even on failure
    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });

    // Check store state
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });
});
