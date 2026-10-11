import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import { listCharts } from "./listCharts";
import { problemDetails, mockListCharts } from "./mocks/handlers";

describe("listCharts", () => {
  it("sends correct request and returns ListChartsResponse", async () => {
    let capturedUrlStr: string | null = null;
    server.use(
      http.get("*/api/v1/charts", ({ request }) => {
        capturedUrlStr = request.url;
        // mock listChartsSuccess logic is handled by the handler manually here to assert url
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 2,
          pageSize: 12,
        });
      }),
    );

    const result = await listCharts({
      page: 2,
      pageSize: 12,
      sortBy: "calculatedAt",
      order: "asc",
      birthProfileId: "bp-1",
    });
    expect(result.page).toBe(2);

    const url = new URL(capturedUrlStr!);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("pageSize")).toBe("12");
    expect(url.searchParams.get("sortBy")).toBe("calculatedAt");
    expect(url.searchParams.get("order")).toBe("asc");
    expect(url.searchParams.get("birthProfileId")).toBe("bp-1");
  });

  it("works without params", async () => {
    let capturedUrlStr: string | null = null;
    server.use(
      http.get("*/api/v1/charts", ({ request }) => {
        capturedUrlStr = request.url;
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
        });
      }),
    );

    await listCharts();
    const url = new URL(capturedUrlStr!);
    expect(url.searchParams.has("page")).toBe(false);
    expect(url.searchParams.has("sortBy")).toBe(false);
  });

  it("rejects with ApiError on 400", async () => {
    server.use(mockListCharts(() => problemDetails(400, "MALFORMED_REQUEST")));
    const promise = listCharts({ page: -1 });
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "MALFORMED_REQUEST",
      status: 400,
    });
  });

  it("rejects with ApiError on 401", async () => {
    server.use(mockListCharts(() => problemDetails(401, "UNAUTHORIZED")));
    const promise = listCharts();
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "UNAUTHORIZED",
      status: 401,
    });
  });
});
