import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

import {
  loginSuccess,
  loginInvalidCredentials,
  mockUser,
} from "@features/auth/api/mocks/handlers";
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
    server.use(loginSuccess());

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
    expect(state.user).toEqual(mockUser());
    expect(state.accessToken).toBe("fake-access-token");

    // Strictly check that refreshToken does not exist on the state
    expect("refreshToken" in state).toBe(false);
  });

  it("B — Login failure: leaves store as unauthenticated", async () => {
    server.use(loginInvalidCredentials());

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
