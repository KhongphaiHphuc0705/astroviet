import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, it, expect, beforeEach } from "vitest";

import { createQueryClient } from "@shared/api/queryClient";
import { useAuthStore } from "@shared/stores/authStore";
import { server } from "@test/msw-server";

import { useLogoutMutation } from "./useLogoutMutation";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("useLogoutMutation", () => {
  beforeEach(() => {
    // Start from authenticated for these tests
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "fake-access-token",
      user: {
        id: "123",
        email: "test@example.com",
        displayName: "Test",
        role: "user",
        createdAt: "2023-01-01T00:00:00.000Z",
      },
    });
  });

  it("E — Logout success: clears session", async () => {
    server.use(
      http.post("*/api/v1/auth/logout", () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHook(() => useLogoutMutation(), { wrapper });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const state = useAuthStore.getState();
    expect(state.status).toBe("unauthenticated");
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it("F — Logout failure: still clears session (onSettled), exposes error", async () => {
    server.use(
      http.post("*/api/v1/auth/logout", () => {
        return HttpResponse.json(
          { errorCode: "INTERNAL_SERVER_ERROR" },
          { status: 500 },
        );
      }),
    );

    const { result } = renderHook(() => useLogoutMutation(), { wrapper });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const state = useAuthStore.getState();
    expect(state.status).toBe("unauthenticated");
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });
});
