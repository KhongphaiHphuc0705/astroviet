import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ThemeProvider } from "@app/providers/ThemeProvider";
import { routesConfig } from "@app/router";
import { __resetRefreshCoordinatorForTests } from "@shared/api/auth-refresh-coordinator";
import { apiClient } from "@shared/api/client";
import { createQueryClient } from "@shared/api/queryClient";
import { useAuthStore } from "@shared/stores/authStore";
import { server } from "@test/msw-server";

import { authFlowHandlers } from "./api/mocks/handlers";

import { registerAuthInfrastructure } from "./index";

describe("M8: Full Auth Flow Integration", () => {
  beforeEach(() => {
    // 1. Reset coordinator and store
    __resetRefreshCoordinatorForTests();
    useAuthStore.getState().clearSession();

    // 2. Register real API client interceptors
    registerAuthInfrastructure();

    // 3. Setup default MSW handlers for the flow
    server.use(...authFlowHandlers);
  });

  afterEach(() => {
    __resetRefreshCoordinatorForTests();
  });

  it("completes the full flow: Register -> Login -> App -> 401 Refresh -> App -> Logout", async () => {
    // We will use a mock protected resource that returns 401 on first call, 200 on second
    let mockProtectedCallCount = 0;
    server.use(
      http.get("*/api/v1/mock-protected-resource", () => {
        mockProtectedCallCount++;
        if (mockProtectedCallCount === 1) {
          return HttpResponse.json(
            { errorCode: "UNAUTHORIZED" },
            { status: 401 },
          );
        }
        return HttpResponse.json({ data: "secret data" }, { status: 200 });
      }),
    );

    const user = userEvent.setup();
    const testQueryClient = createQueryClient();

    // Render the real router starting at /register
    const router = createMemoryRouter(routesConfig, {
      initialEntries: ["/register"],
    });

    render(
      <ThemeProvider>
        <QueryClientProvider client={testQueryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ThemeProvider>,
    );

    // --- STEP 1: Register ---
    // Wait for page to load
    const emailInput = await screen.findByRole("textbox", { name: "Email" });
    const passwordInput = screen.getByLabelText(/^Mật khẩu/i);
    const confirmPasswordInput = screen.getByLabelText(/^Xác nhận mật khẩu/i);

    // Fill the form
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.type(confirmPasswordInput, "Password123!");

    const registerBtn = screen.getByRole("button", { name: "Đăng ký" });
    await user.click(registerBtn);

    // Assert success alert is shown and it navigates to /login
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/thành công/i);
    });

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: "ĐĂNG NHẬP" }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // --- STEP 2: Login ---
    const loginEmail = screen.getByRole("textbox", { name: "Email" });
    const loginPassword = screen.getByLabelText("Mật khẩu");

    await user.type(loginEmail, "test@example.com");
    await user.type(loginPassword, "Password123!");

    const loginBtn = screen.getByRole("button", { name: "Đăng nhập" });
    await user.click(loginBtn);

    // Assert it navigates to /app
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Bảng điều khiển" }),
      ).toBeInTheDocument();
    });

    expect(useAuthStore.getState().status).toBe("authenticated");

    // --- STEP 3: 401 Refresh Retry ---
    // Trigger the protected resource call directly
    const response = await apiClient.get("/api/v1/mock-protected-resource");

    // Assert it eventually succeeds after refresh
    expect(response.data).toEqual({ data: "secret data" });
    expect(mockProtectedCallCount).toBe(2); // First failed (401), second succeeded (200)
    expect(useAuthStore.getState().status).toBe("authenticated"); // Still authenticated
    expect(useAuthStore.getState().user).toMatchObject({
      id: "1",
      email: "test@example.com",
    }); // User data must survive the refresh

    // --- STEP 4: Logout ---
    // Click the logout button inside UserMenu (which is visible in AppLayout)
    const logoutBtn = screen.getByRole("button", { name: "Đăng xuất" });
    await user.click(logoutBtn);

    // Assert it navigates to /login
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "ĐĂNG NHẬP" }),
      ).toBeInTheDocument();
    });

    // Check store is cleared
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });
});
