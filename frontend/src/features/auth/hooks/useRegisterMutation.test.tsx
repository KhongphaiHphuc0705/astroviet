import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, it, expect, beforeEach } from "vitest";

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
    server.use(
      http.post("*/api/v1/auth/register", () => {
        return HttpResponse.json(
          {
            errorCode: "EMAIL_ALREADY_EXISTS",
          },
          { status: 409 },
        );
      }),
    );

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
    server.use(
      http.post("*/api/v1/auth/register", () => {
        return HttpResponse.json(
          {
            user: {
              id: "123",
              email: "test@example.com",
              displayName: null,
              role: "user",
              createdAt: "2023-01-01T00:00:00.000Z",
            },
          },
          { status: 201 },
        );
      }),
    );

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
