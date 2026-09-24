import { render, screen, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { useEffect } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";

import { ProtectedRoute } from "@app/routing/ProtectedRoute";
import { mockRefresh, mockUser } from "@features/auth/api/mocks/handlers";
import { __resetRefreshCoordinatorForTests } from "@shared/api/auth-refresh-coordinator";
import { apiClient } from "@shared/api/client";
import { useAuthStore } from "@shared/stores/authStore";
import { server } from "@test/msw-server";

import { registerAuthInfrastructure } from "../index";

import { useSessionBootstrap } from "./useSessionBootstrap";

const TestRaceComponent = () => {
  useSessionBootstrap();

  useEffect(() => {
    // Fire two concurrent requests on mount that will get 401 immediately
    apiClient.get("/api/v1/mock-protected-1").catch(() => {});
    apiClient.get("/api/v1/mock-protected-2").catch(() => {});
  }, []);

  return <div>Test Component</div>;
};

describe("Integration: useSessionBootstrap Race Condition", () => {
  beforeEach(() => {
    __resetRefreshCoordinatorForTests();
    useAuthStore.setState({
      status: "resolving",
      accessToken: null,
      user: null,
    });
    registerAuthInfrastructure();
  });

  it("triggers exactly ONE refresh request when bootstrap and 401s happen concurrently", async () => {
    let refreshCallCount = 0;

    server.use(
      http.get("*/api/v1/mock-protected-1", () => {
        return HttpResponse.json(
          { errorCode: "UNAUTHORIZED" },
          { status: 401 },
        );
      }),
      http.get("*/api/v1/mock-protected-2", () => {
        return HttpResponse.json(
          { errorCode: "UNAUTHORIZED" },
          { status: 401 },
        );
      }),
      mockRefresh(async () => {
        refreshCallCount++;
        await delay(50); // Simulate network delay to force the race condition
        return HttpResponse.json(
          {
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
            expiresIn: 3600,
            user: mockUser(),
          },
          { status: 200 },
        );
      }),
    );

    render(<TestRaceComponent />);

    await waitFor(() => {
      // Check if the store correctly transition to authenticated
      expect(useAuthStore.getState().status).toBe("authenticated");
    });

    // Despite 1 direct call from bootstrap and 2 requests hitting 401 (causing 2 interceptor retries),
    // the refresh API should have been called EXACTLY ONCE.
    expect(refreshCallCount).toBe(1);
  });
});

describe("Integration: Router Rendering Order", () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: "resolving",
      accessToken: null,
      user: null,
    });
  });

  it("shows Spinner while resolving, then shows content when authenticated", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Initial state is resolving, Spinner should be visible
    expect(screen.getByText("Đang xác thực...")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();

    // Simulate successful bootstrap resolving
    act(() => {
      useAuthStore.setState({
        status: "authenticated",
        accessToken: "fake-token",
        user: {
          id: "1",
          email: "test@example.com",
          displayName: "User",
          role: "user",
          createdAt: "2023-01-01T00:00:00.000Z",
        },
      });
    });

    // Spinner should disappear, content should render
    await waitFor(() => {
      expect(screen.queryByText("Đang xác thực...")).not.toBeInTheDocument();
      expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    });
  });
});
