import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import {
  birthProfileMalformedRequest,
  listBirthProfilesSuccess,
  mockListBirthProfiles,
} from "../api/mocks/handlers";

import { useBirthProfilesQuery } from "./useBirthProfilesQuery";

describe("useBirthProfilesQuery", () => {
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

  it("returns items and total on success", async () => {
    server.use(listBirthProfilesSuccess());
    const { result } = renderHook(() => useBirthProfilesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.total).toBe(1);
  });

  it("returns ApiError on failure", async () => {
    server.use(birthProfileMalformedRequest(mockListBirthProfiles));
    const { result } = renderHook(
      () =>
        useBirthProfilesQuery({
          sortBy: "invalid" as unknown as "createdAt",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(400);
  });
});
