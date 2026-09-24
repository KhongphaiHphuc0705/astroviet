import { describe, it, expect, beforeEach } from "vitest";

import {
  refreshSuccess,
  refreshUnauthorized,
} from "@features/auth/api/mocks/handlers";
import {
  coordinateRefresh,
  __resetRefreshCoordinatorForTests,
} from "@shared/api/auth-refresh-coordinator";
import { useAuthStore } from "@shared/stores/authStore";
import { server } from "@test/msw-server";

import {
  registerAuthInfrastructure,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
} from "./index";

describe("registerAuthInfrastructure", () => {
  beforeEach(() => {
    __resetRefreshCoordinatorForTests();
    useAuthStore.setState({
      status: "resolving",
      accessToken: null,
      user: null,
    });
  });

  it("registers handler that calls refresh and returns accessToken", async () => {
    server.use(refreshSuccess());

    registerAuthInfrastructure();

    const token = await coordinateRefresh();
    expect(token).toBe("new-access-token");

    // Verify M4-2 behavior: handler should update authStore on success
    const state = useAuthStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.accessToken).toBe("new-access-token");
    expect(state.user?.email).toBe("test@example.com");
  });

  it("is safe to call multiple times", async () => {
    server.use(refreshSuccess({ accessToken: "new-access-token-2" }));

    registerAuthInfrastructure();
    registerAuthInfrastructure(); // Second call

    const token = await coordinateRefresh();
    expect(token).toBe("new-access-token-2");
  });

  it("clears authStore on failed refresh", async () => {
    // Start with a mock authenticated state to prove it clears
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "old-token",
      user: {
        id: "1",
        email: "old@example.com",
        displayName: "Old",
        role: "user",
        createdAt: "2023-01-01T00:00:00.000Z",
      },
    });

    server.use(refreshUnauthorized());

    registerAuthInfrastructure();

    await expect(coordinateRefresh()).rejects.toThrow();

    // Verify M4-2 behavior: handler should clear session on failure
    const state = useAuthStore.getState();
    expect(state.status).toBe("unauthenticated");
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });
});

describe("features/auth import side-effects", () => {
  beforeEach(() => {
    __resetRefreshCoordinatorForTests();
  });

  it("does not register handler merely by importing", async () => {
    // We already imported at the top, so if there were side effects,
    // coordinateRefresh would not throw.
    await expect(coordinateRefresh()).rejects.toThrow(
      "No refresh handler registered",
    );
  });
});

describe("features/auth exports", () => {
  it("exports all public hooks as functions", () => {
    expect(typeof useLoginMutation).toBe("function");
    expect(typeof useRegisterMutation).toBe("function");
    expect(typeof useLogoutMutation).toBe("function");
  });
});
