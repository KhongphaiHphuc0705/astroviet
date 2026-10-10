import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import { chartFull } from "../api/mocks/fixtures";
import {
  createNatalChartSuccess,
  chartDomainError,
  mockCreateNatalChart,
} from "../api/mocks/handlers";

import { chartKeys } from "./query-keys";
import { useCreateNatalChartMutation } from "./useCreateNatalChartMutation";

describe("useCreateNatalChartMutation", () => {
  const createWrapper = () => {
    const queryClient = createQueryClient();
    return {
      queryClient,
      Wrapper: function Wrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        );
      },
    };
  };

  it("mutates successfully, seeds detail cache, and invalidates lists", async () => {
    server.use(createNatalChartSuccess());
    const { Wrapper, queryClient } = createWrapper();

    // Setup initial state: a list query that should be invalidated
    queryClient.setQueryData(chartKeys.list({ page: 1 }), { data: "old-list" });
    expect(
      queryClient.getQueryState(chartKeys.list({ page: 1 }))?.isInvalidated,
    ).toBe(false);

    const { result } = renderHook(() => useCreateNatalChartMutation(), {
      wrapper: Wrapper,
    });

    result.current.mutate({ profileId: "profile-1", houseSystem: "Placidus" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.id).toBe(chartFull.id);

    // Verify detail cache seeded
    const cachedDetail = queryClient.getQueryData(
      chartKeys.detail(chartFull.id),
    );
    expect(cachedDetail).toStrictEqual(chartFull);

    // Verify lists invalidated
    expect(
      queryClient.getQueryState(chartKeys.list({ page: 1 }))?.isInvalidated,
    ).toBe(true);
  });

  it("handles ApiError correctly", async () => {
    server.use(
      chartDomainError(
        mockCreateNatalChart as unknown as Parameters<
          typeof chartDomainError
        >[0],
        "INVALID_DATETIME",
      ),
    );
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateNatalChartMutation(), {
      wrapper: Wrapper,
    });

    result.current.mutate({ profileId: "profile-1", houseSystem: "Placidus" });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.errorCode).toBe("INVALID_DATETIME");
  });
});
