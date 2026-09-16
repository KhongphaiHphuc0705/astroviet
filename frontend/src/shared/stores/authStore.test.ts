import { act } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";

import { useAuthStore } from "./authStore";

describe("authStore", () => {
  beforeEach(() => {
    // Clean up store state before each test to ensure isolation
    useAuthStore.setState({
      status: "resolving",
      accessToken: null,
      user: null,
    });
  });

  it("has correct initial shape and default state resolving", () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe("resolving");
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(typeof state.setSession).toBe("function");
    expect(typeof state.clearSession).toBe("function");
  });

  it("setSession updates status, user, and accessToken", () => {
    const mockUser = {
      id: "1",
      email: "test@example.com",
      displayName: "Test",
      role: "user" as const,
      createdAt: "2023-01-01T00:00:00Z",
    };

    act(() => {
      useAuthStore.getState().setSession(mockUser, "token-abc");
    });

    const state = useAuthStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe("token-abc");
  });

  it("clearSession transitions from authenticated to unauthenticated and clears user/token", () => {
    // Setup state as authenticated
    act(() => {
      useAuthStore.setState({
        status: "authenticated",
        accessToken: "fake-token",
        user: {
          id: "1",
          email: "test@example.com",
          displayName: "Test",
          role: "user",
          createdAt: "2023-01-01T00:00:00Z",
        },
      });
    });

    expect(useAuthStore.getState().status).toBe("authenticated");

    act(() => {
      useAuthStore.getState().clearSession();
    });

    const state = useAuthStore.getState();
    expect(state.status).toBe("unauthenticated");
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("does not have old API login/logout anymore", () => {
    const state = useAuthStore.getState() as unknown as Record<string, unknown>;
    expect("login" in state).toBe(false);
    expect("logout" in state).toBe(false);
  });
});
