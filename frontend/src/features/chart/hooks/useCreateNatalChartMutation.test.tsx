import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@shared/api/client";
import { createQueryClient } from "@shared/api/queryClient";
import * as reportErrorModule from "@shared/lib/report-error";
import { server } from "@test/msw-server";

import {
  chartFull,
  chartNoHouses,
  chartSummaryFixtures,
} from "../api/mocks/fixtures";
import {
  createNatalChartSuccess,
  chartDomainError,
  mockCreateNatalChart,
  mockListCharts,
} from "../api/mocks/handlers";

import { chartKeys } from "./query-keys";
import { useChartsQuery } from "./useChartsQuery";
import { useCreateNatalChartMutation } from "./useCreateNatalChartMutation";

describe("useCreateNatalChartMutation (Sprint F4 M1 Section 18)", () => {
  let reportErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reportErrorSpy = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    reportErrorSpy.mockRestore();
  });

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

  it("mutates successfully, seeds detail cache, and invalidates lists without invalidating detail", async () => {
    server.use(createNatalChartSuccess());
    const { Wrapper, queryClient } = createWrapper();

    // Setup initial state: a list query that should be invalidated
    queryClient.setQueryData(chartKeys.list({ page: 1 }), {
      data: "old-list",
    });
    expect(
      queryClient.getQueryState(chartKeys.list({ page: 1 }))?.isInvalidated,
    ).toBe(false);

    const { result } = renderHook(() => useCreateNatalChartMutation(), {
      wrapper: Wrapper,
    });

    result.current.mutate({
      profileId: "profile-1",
      houseSystem: "Placidus",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.id).toBe(chartFull.id);

    // Verify detail cache seeded
    const cachedDetail = queryClient.getQueryData(
      chartKeys.detail(chartFull.id),
    );
    expect(cachedDetail).toStrictEqual(chartFull);

    // Verify detail is NOT marked as invalidated (it is a stable snapshot)
    expect(
      queryClient.getQueryState(chartKeys.detail(chartFull.id))?.isInvalidated,
    ).toBe(false);

    // Verify lists invalidated
    expect(
      queryClient.getQueryState(chartKeys.list({ page: 1 }))?.isInvalidated,
    ).toBe(true);
  });

  it("refetches active mounted list queries on mutation success", async () => {
    let listFetchCount = 0;
    server.use(
      mockListCharts(() => {
        listFetchCount++;
        return HttpResponse.json({
          items: chartSummaryFixtures,
          total: chartSummaryFixtures.length,
          page: 1,
          pageSize: 20,
        });
      }),
      createNatalChartSuccess(),
    );

    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => ({
        list: useChartsQuery({ page: 1 }),
        mutation: useCreateNatalChartMutation(),
      }),
      { wrapper: Wrapper },
    );

    // Initial mount triggers 1 list fetch
    await waitFor(() => {
      expect(result.current.list.isSuccess).toBe(true);
    });
    expect(listFetchCount).toBe(1);

    // Trigger mutation
    await result.current.mutation.mutateAsync({
      profileId: "profile-1",
      houseSystem: "Placidus",
    });

    // Active mounted list query is automatically refetched (count 1 -> 2)
    await waitFor(() => {
      expect(listFetchCount).toBe(2);
    });

    // Detail is cached and not invalidated
    expect(
      queryClient.getQueryState(chartKeys.detail(chartFull.id))?.isInvalidated,
    ).toBe(false);
  });

  it("on mutation error: cache is untouched and list is not invalidated", async () => {
    server.use(chartDomainError(mockCreateNatalChart, "INVALID_DATETIME"));
    const { Wrapper, queryClient } = createWrapper();

    // Setup initial list cache
    queryClient.setQueryData(chartKeys.list({ page: 1 }), {
      data: "old-list",
    });

    const { result } = renderHook(() => useCreateNatalChartMutation(), {
      wrapper: Wrapper,
    });

    result.current.mutate({
      profileId: "profile-1",
      houseSystem: "Placidus",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.errorCode).toBe("INVALID_DATETIME");

    // Detail cache remained untouched
    expect(
      queryClient.getQueryData(chartKeys.detail(chartFull.id)),
    ).toBeUndefined();

    // List query cache was NOT invalidated
    expect(
      queryClient.getQueryState(chartKeys.list({ page: 1 }))?.isInvalidated,
    ).toBe(false);
  });

  it("telemetry: calls reportError only for unmapped error codes", async () => {
    // 1. Unmapped error code -> reportError IS called
    server.use(
      chartDomainError(mockCreateNatalChart, "CHART_CALCULATION_FAILED"),
    );
    const { Wrapper: Wrapper1 } = createWrapper();

    const { result: result1 } = renderHook(
      () => useCreateNatalChartMutation(),
      { wrapper: Wrapper1 },
    );

    result1.current.mutate({
      profileId: "profile-1",
      houseSystem: "Placidus",
    });

    await waitFor(() => {
      expect(result1.current.isError).toBe(true);
    });

    expect(reportErrorSpy).toHaveBeenCalledTimes(1);
    expect(reportErrorSpy).toHaveBeenCalledWith(
      expect.any(ApiError),
      "TanStack Query Mutation",
    );

    // 2. Mapped business error code -> reportError is NOT called
    reportErrorSpy.mockClear();
    server.use(chartDomainError(mockCreateNatalChart, "INVALID_DATETIME"));
    const { Wrapper: Wrapper2 } = createWrapper();

    const { result: result2 } = renderHook(
      () => useCreateNatalChartMutation(),
      { wrapper: Wrapper2 },
    );

    result2.current.mutate({
      profileId: "profile-1",
      houseSystem: "Placidus",
    });

    await waitFor(() => {
      expect(result2.current.isError).toBe(true);
    });

    expect(reportErrorSpy).not.toHaveBeenCalled();
  });

  it("consecutive mutations create distinct snapshot detail cache entries", async () => {
    server.use(createNatalChartSuccess(chartFull));
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useCreateNatalChartMutation(), {
      wrapper: Wrapper,
    });

    await result.current.mutateAsync({
      profileId: "profile-1",
      houseSystem: "Placidus",
    });

    expect(
      queryClient.getQueryData(chartKeys.detail(chartFull.id)),
    ).toStrictEqual(chartFull);

    // Second mutation returns chartNoHouses
    server.use(createNatalChartSuccess(chartNoHouses));
    await result.current.mutateAsync({
      profileId: "profile-2",
      houseSystem: "Placidus",
    });

    expect(
      queryClient.getQueryData(chartKeys.detail(chartNoHouses.id)),
    ).toStrictEqual(chartNoHouses);
    // First snapshot is still preserved
    expect(
      queryClient.getQueryData(chartKeys.detail(chartFull.id)),
    ).toStrictEqual(chartFull);
  });
});
