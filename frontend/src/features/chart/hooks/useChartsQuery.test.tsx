import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import type { ListChartsResponse } from "../api/types";

import { chartKeys } from "./query-keys";
import { useChartsQuery } from "./useChartsQuery";

const mockResponsePage1: ListChartsResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
};

const mockResponsePage2: ListChartsResponse = {
  items: [],
  total: 0,
  page: 2,
  pageSize: 20,
};

describe("useChartsQuery", () => {
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

  it("keeps previous data while fetching new page, verifies params sent and query key used", async () => {
    let capturedUrlStr: string | null = null;
    server.use(
      http.get("*/api/v1/charts", async ({ request }) => {
        capturedUrlStr = request.url;
        const url = new URL(request.url);
        if (url.searchParams.get("page") === "2") {
          return HttpResponse.json(mockResponsePage2);
        }
        return HttpResponse.json(mockResponsePage1);
      }),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result, rerender } = renderHook(
      (props: { page: number }) =>
        useChartsQuery({ page: props.page, pageSize: 20 }),
      {
        wrapper: Wrapper,
        initialProps: { page: 1 },
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.page).toBe(1);
    expect(result.current.isPlaceholderData).toBe(false);

    // verify key and params
    const url1 = new URL(capturedUrlStr!);
    expect(url1.searchParams.get("page")).toBe("1");
    expect(url1.searchParams.get("pageSize")).toBe("20");
    expect(
      queryClient.getQueryData(chartKeys.list({ page: 1, pageSize: 20 })),
    ).toBeDefined();

    // change page
    rerender({ page: 2 });

    // while fetching page 2, we still see page 1 data and isPlaceholderData is true
    expect(result.current.data?.page).toBe(1);
    expect(result.current.isPlaceholderData).toBe(true);

    await waitFor(() => {
      expect(result.current.data?.page).toBe(2);
      expect(result.current.isPlaceholderData).toBe(false);
    });

    const url2 = new URL(capturedUrlStr!);
    expect(url2.searchParams.get("page")).toBe("2");
    expect(
      queryClient.getQueryData(chartKeys.list({ page: 2, pageSize: 20 })),
    ).toBeDefined();
  });

  it("returns ApiError on failure", async () => {
    server.use(
      http.get("*/api/v1/charts", () => {
        return HttpResponse.json(
          { errorCode: "MALFORMED_REQUEST", status: 400 },
          {
            status: 400,
            headers: { "Content-Type": "application/problem+json" },
          },
        );
      }),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useChartsQuery({ page: 1, pageSize: 20 }),
      {
        wrapper: Wrapper,
      },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).errorCode).toBe(
      "MALFORMED_REQUEST",
    );
  });
});
