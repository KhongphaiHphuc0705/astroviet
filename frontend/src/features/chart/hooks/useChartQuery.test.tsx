import {
  QueryClientProvider,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { ApiError } from "@shared/api/client";
import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import { chartFull } from "../api/mocks/fixtures";

import { chartKeys } from "./query-keys";
import { useChartQuery } from "./useChartQuery";

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

  beforeEach(() => {
    focusManager.setFocused(true);
    onlineManager.setOnline(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns chart data on success, id is valid", async () => {
    let reqCount = 0;
    server.use(
      http.get("*/api/v1/charts/:id", () => {
        reqCount++;
        return HttpResponse.json(chartFull);
      }),
    );
    const { Wrapper, queryClient } = createWrapper();
    const validId = chartFull.id;
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
    expect(reqCount).toBe(1);
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

  it("focus/reconnect does not cause second request", async () => {
    let reqCount = 0;
    server.use(
      http.get("*/api/v1/charts/:id", () => {
        reqCount++;
        return HttpResponse.json(chartFull);
      }),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useChartQuery(chartFull.id), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(reqCount).toBe(1);

    // trigger focus
    focusManager.setFocused(false);
    focusManager.setFocused(true);

    // trigger reconnect
    onlineManager.setOnline(false);
    onlineManager.setOnline(true);

    // wait a bit
    await new Promise((r) => setTimeout(r, 100));
    expect(reqCount).toBe(1); // no additional requests
  });

  it("second hook with same id does not fetch again", async () => {
    let reqCount = 0;
    server.use(
      http.get("*/api/v1/charts/:id", () => {
        reqCount++;
        return HttpResponse.json(chartFull);
      }),
    );
    const { Wrapper } = createWrapper();
    const hook1 = renderHook(() => useChartQuery(chartFull.id), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(hook1.result.current.isSuccess).toBe(true));

    const hook2 = renderHook(() => useChartQuery(chartFull.id), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(hook2.result.current.isSuccess).toBe(true));

    expect(reqCount).toBe(1); // fetched only once
  });

  it("seed cache does not fetch", async () => {
    let reqCount = 0;
    server.use(
      http.get("*/api/v1/charts/:id", () => {
        reqCount++;
        return HttpResponse.json(chartFull);
      }),
    );
    const { Wrapper, queryClient } = createWrapper();

    // seed cache
    queryClient.setQueryData(chartKeys.detail(chartFull.id), chartFull);

    const { result } = renderHook(() => useChartQuery(chartFull.id), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(reqCount).toBe(0); // no network requests
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
    const { result } = renderHook(() => useChartQuery(chartFull.id), {
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
    const { result } = renderHook(() => useChartQuery(chartFull.id), {
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
