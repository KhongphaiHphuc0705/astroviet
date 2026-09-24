import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

import {
  registerConflict,
  registerSuccess,
} from "@features/auth/api/mocks/handlers";
import { createQueryClient } from "@shared/api/queryClient";
import { useAuthStore } from "@shared/stores/authStore";
import { server } from "@test/msw-server";

import { useRegisterMutation } from "./useRegisterMutation";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("useRegisterMutation", () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      status: "unauthenticated", // Start from unauthenticated for this test
      accessToken: null,
      user: null,
    });
  });

  it("C — Register 409: mutation fails, leaves store unmodified", async () => {
    server.use(registerConflict());

    const { result } = renderHook(() => useRegisterMutation(), { wrapper });

    act(() => {
      result.current.mutate({
        email: "test@example.com",
        password: "Password1",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const state = useAuthStore.getState();
    expect(state.status).toBe("unauthenticated");
  });

  it("D — Register success: mutation succeeds, leaves store unmodified (does not authenticate)", async () => {
    server.use(registerSuccess());

    const { result } = renderHook(() => useRegisterMutation(), { wrapper });

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
    expect(state.status).toBe("unauthenticated");
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });
});
