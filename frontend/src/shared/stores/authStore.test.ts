import { act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { useAuthStore, bootstrapAuthResolution } from "./authStore";

describe("authStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clean up store state before each test to ensure isolation
    useAuthStore.setState({
      status: "resolving",
      accessToken: null,
      user: null,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("has correct initial shape and default state resolving", () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe("resolving");
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(typeof state.login).toBe("function");
    expect(typeof state.logout).toBe("function");
  });

  it("transitions to unauthenticated automatically after a short delay", () => {
    bootstrapAuthResolution();

    expect(useAuthStore.getState().status).toBe("resolving");

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });

  it("can explicitly set state to authenticated", () => {
    act(() => {
      useAuthStore.setState({ status: "authenticated" });
    });
    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  it("login() is a stub that does not throw", () => {
    expect(() => {
      act(() => {
        useAuthStore.getState().login();
      });
    }).not.toThrow();
  });

  it("logout() resets state to unauthenticated", () => {
    act(() => {
      useAuthStore.setState({
        status: "authenticated",
        accessToken: "fake-token",
        user: { id: "1", email: "test@example.com" },
      });
    });

    expect(useAuthStore.getState().status).toBe("authenticated");

    act(() => {
      useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.status).toBe("unauthenticated");
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
