import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@test/msw-server";

import { listCharts } from "./listCharts";
import type { ListChartsResponse } from "./types";

const mockResponse: ListChartsResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
};

describe("listCharts", () => {
  it("sends correct request and returns ListChartsResponse", async () => {
    let capturedUrlStr: string | null = null;
    server.use(
      http.get("*/api/v1/charts", ({ request }) => {
        capturedUrlStr = request.url;
        return HttpResponse.json(mockResponse);
      }),
    );

    const result = await listCharts({ page: 2, pageSize: 12 });
    expect(result).toStrictEqual(mockResponse);
    const url = new URL(capturedUrlStr!);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("pageSize")).toBe("12");
  });

  it("works without params", async () => {
    let capturedUrlStr: string | null = null;
    server.use(
      http.get("*/api/v1/charts", ({ request }) => {
        capturedUrlStr = request.url;
        return HttpResponse.json(mockResponse);
      }),
    );

    const result = await listCharts();
    expect(result).toStrictEqual(mockResponse);
    const url = new URL(capturedUrlStr!);
    expect(url.searchParams.has("page")).toBe(false);
  });
});
