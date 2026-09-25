import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@shared/api/client";
import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import {
  birthProfileValidationError,
  createBirthProfileSuccess,
  mockCreateBirthProfile,
} from "../api/mocks/handlers";

import { birthProfileKeys } from "./query-keys";
import { useCreateBirthProfileMutation } from "./useCreateBirthProfileMutation";

describe("useCreateBirthProfileMutation", () => {
  const createWrapper = () => {
    const queryClient = createQueryClient();
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  };

  const mockInput = {
    label: "My Profile",
    birthDate: "1995-05-12",
    isBirthTimeKnown: true,
    birthTime: "14:30:00",
    birthLocation: {
      placeName: "Ho Chi Minh",
      latitude: 10,
      longitude: 106,
      historicalTimezoneId: "Asia/Ho_Chi_Minh",
    },
  };

  it("calls create API and invalidates lists query on success", async () => {
    server.use(createBirthProfileSuccess());
    const queryClient = createQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateBirthProfileMutation(), {
      wrapper,
    });

    act(() => {
      result.current.mutate(mockInput);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: birthProfileKeys.lists(),
    });
  });

  it("returns error without throwing on validation error (422)", async () => {
    server.use(
      birthProfileValidationError(
        mockCreateBirthProfile,
        "INVALID_BIRTH_TIME_STATE",
      ),
    );

    const { result } = renderHook(() => useCreateBirthProfileMutation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(mockInput);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).errorCode).toBe(
      "INVALID_BIRTH_TIME_STATE",
    );
  });
});
