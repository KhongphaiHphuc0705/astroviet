import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, it, expect, beforeEach } from "vitest";

import { createQueryClient } from "@shared/api/queryClient";
import { useAuthStore } from "@shared/stores/authStore";
import { server } from "@test/msw-server";

import { useLoginMutation } from "./useLoginMutation";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("useLoginMutation", () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      status: "unauthenticated", // Start from unauthenticated for this test
      accessToken: null,
      user: null,
    });
  });

  it("A — Login success: updates store with user and accessToken, does NOT store refreshToken", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () => {
        return HttpResponse.json(
          {
            accessToken: "fake-access-token",
            refreshToken: "fake-refresh-token",
            expiresIn: 3600,
            user: {
              id: "123",
              email: "test@example.com",
              displayName: "Test User",
              role: "user",
              createdAt: "2023-01-01T00:00:00.000Z",
            },
          },
          { status: 200 },
        );
      }),
    );

    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    act(() => {
      result.current.mutate({
        email: "test@example.com",
        password: "Password1",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const state = useAuthStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.user).toEqual({
      id: "123",
      email: "test@example.com",
      displayName: "Test User",
      role: "user",
      createdAt: "2023-01-01T00:00:00.000Z",
    });
    expect(state.accessToken).toBe("fake-access-token");

    // Strictly check that refreshToken does not exist on the state
    expect("refreshToken" in state).toBe(false);
  });

  it("B — Login failure: leaves store as unauthenticated", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () => {
        return HttpResponse.json(
          {
            errorCode: "INVALID_CREDENTIALS",
          },
          { status: 401 },
        );
      }),
    );

    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    act(() => {
      result.current.mutate({
        email: "test@example.com",
        password: "wrong",
      });
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
