import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import type { ChartResponse } from "../api/types";

import { chartKeys } from "./query-keys";
import { useChartQuery } from "./useChartQuery";

const mockChart: ChartResponse = {
  id: "5d24bbf6-ef0d-47fc-9c02-a1c8ca5e08a4",
  chartType: "Natal",
  houseSystem: "Placidus",
  isHouseDataAvailable: false,
  planets: [],
  houses: [],
  angles: [],
  aspects: [],
  patterns: [],
  interpretations: [],
  interpretationVersion: null,
  warnings: [],
  calculatedAt: "2026-10-10T00:00:00Z",
  engineVersion: "1.0",
};

describe("useChartQuery", () => {
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

  it("returns chart data on success, id is valid", async () => {
    server.use(
      http.get("*/api/v1/charts/:id", () => {
        return HttpResponse.json(mockChart);
      }),
    );
    const { Wrapper, queryClient } = createWrapper();
    const validId = mockChart.id;
    const { result } = renderHook(() => useChartQuery(validId), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.id).toBe(validId);
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: chartKeys.detail(validId) })
        ?.isStale(),
    ).toBe(false);
  });

  it("is disabled and does not fetch when id is undefined or invalid UUID", () => {
    const { Wrapper } = createWrapper();

    // undefined
    const hook1 = renderHook(() => useChartQuery(undefined), {
      wrapper: Wrapper,
    });
    expect(hook1.result.current.fetchStatus).toBe("idle");
    expect(hook1.result.current.isPending).toBe(true);

    // invalid uuid
    const hook2 = renderHook(() => useChartQuery("abc"), { wrapper: Wrapper });
    expect(hook2.result.current.fetchStatus).toBe("idle");
    expect(hook2.result.current.isPending).toBe(true);
  });

  it("returns ApiError on 404 NOT FOUND", async () => {
    server.use(
      http.get("*/api/v1/charts/:id", () => {
        return HttpResponse.json(
          { errorCode: "RESOURCE_NOT_FOUND", status: 404 },
          {
            status: 404,
            headers: { "Content-Type": "application/problem+json" },
          },
        );
      }),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useChartQuery(mockChart.id), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(404);
    expect((result.current.error as ApiError).errorCode).toBe(
      "RESOURCE_NOT_FOUND",
    );
  });

  it("returns ApiError on 403 FORBIDDEN", async () => {
    server.use(
      http.get("*/api/v1/charts/:id", () => {
        return HttpResponse.json(
          { errorCode: "FORBIDDEN", status: 403 },
          {
            status: 403,
            headers: { "Content-Type": "application/problem+json" },
          },
        );
      }),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useChartQuery(mockChart.id), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(403);
    expect((result.current.error as ApiError).errorCode).toBe("FORBIDDEN");
  });
});
