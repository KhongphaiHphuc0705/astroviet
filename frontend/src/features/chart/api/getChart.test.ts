import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import { getChart } from "./getChart";
import type { ChartResponse } from "./types";

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

describe("getChart", () => {
  it("sends correct request and returns ChartResponse on success", async () => {
    server.use(
      http.get("*/api/v1/charts/:id", ({ params }) => {
        if (params.id === encodeURIComponent("a b/c")) {
          return HttpResponse.json(mockChart);
        }
        return HttpResponse.json(mockChart);
      }),
    );
    const result = await getChart("a b/c");
    expect(result.id).toBe(mockChart.id);
  });

  it("rejects with ApiError on 403 FORBIDDEN", async () => {
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
    const promise = getChart("123");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "FORBIDDEN",
      status: 403,
    });
  });

  it("rejects with ApiError on 404 RESOURCE_NOT_FOUND", async () => {
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
    const promise = getChart("123");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "RESOURCE_NOT_FOUND",
      status: 404,
    });
  });
});
