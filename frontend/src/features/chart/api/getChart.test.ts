import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import { getChart } from "./getChart";
import { chartFull } from "./mocks/fixtures";
import {
  chartForbidden,
  chartNotFound,
  chartMalformedRequest,
  chartDomainError,
  mockGetChart,
} from "./mocks/handlers";

describe("getChart", () => {
  it("sends correct request (with encodeURIComponent) and returns ChartResponse on success", async () => {
    let capturedPathname: string | null = null;
    server.use(
      http.get("*/api/v1/charts/:id", ({ request }) => {
        capturedPathname = new URL(request.url).pathname;
        return HttpResponse.json(chartFull, { status: 200 });
      }),
    );
    const result = await getChart("a b/c");
    expect(result.id).toBe(chartFull.id);
    expect(capturedPathname).toBe("/api/v1/charts/a%20b%2Fc");
  });

  it("rejects with ApiError on 403 FORBIDDEN", async () => {
    server.use(chartForbidden(mockGetChart));
    const promise = getChart("123");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "FORBIDDEN",
      status: 403,
    });
  });

  it("rejects with ApiError on 404 RESOURCE_NOT_FOUND", async () => {
    server.use(chartNotFound(mockGetChart));
    const promise = getChart("123");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "RESOURCE_NOT_FOUND",
      status: 404,
    });
  });

  it("rejects with ApiError on 400 MALFORMED_REQUEST", async () => {
    server.use(chartMalformedRequest(mockGetChart));
    const promise = getChart("invalid-id");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "MALFORMED_REQUEST",
      status: 400,
    });
  });

  it("rejects with ApiError on 422", async () => {
    server.use(chartDomainError(mockGetChart, "INVALID_DATETIME"));
    const promise = getChart("123");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "INVALID_DATETIME",
      status: 422,
    });
  });
});
