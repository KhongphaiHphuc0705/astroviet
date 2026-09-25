import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import {
  birthProfileForbidden,
  birthProfileNotFound,
  getBirthProfileSuccess,
  mockGetBirthProfile,
} from "../api/mocks/handlers";

import { useBirthProfileQuery } from "./useBirthProfileQuery";

describe("useBirthProfileQuery", () => {
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

  it("returns profile data on success", async () => {
    server.use(getBirthProfileSuccess());
    const { result } = renderHook(() => useBirthProfileQuery("123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.id).toBeDefined();
  });

  it("is disabled and does not fetch when id is undefined", () => {
    const { result } = renderHook(() => useBirthProfileQuery(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.isPending).toBe(true);
  });

  it("returns ApiError on 404 NOT FOUND", async () => {
    server.use(birthProfileNotFound(mockGetBirthProfile));
    const { result } = renderHook(() => useBirthProfileQuery("123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(404);
  });

  it("returns ApiError on 403 FORBIDDEN", async () => {
    server.use(birthProfileForbidden(mockGetBirthProfile));
    const { result } = renderHook(() => useBirthProfileQuery("123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(403);
  });
});
