import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import { createNatalChart } from "./createNatalChart";
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

describe("createNatalChart", () => {
  it("sends correct POST request with save=true and returns ChartResponse on success", async () => {
    let capturedBody: unknown = null;
    let capturedUrlStr: string | null = null;
    server.use(
      http.post("*/api/v1/charts/natal", async ({ request }) => {
        capturedUrlStr = request.url;
        capturedBody = await request.json();
        return HttpResponse.json(mockChart, { status: 201 });
      }),
    );

    const url = new URL(capturedUrlStr!);
    expect(url.searchParams.get("save")).toBe("true");
    expect(capturedBody).toStrictEqual({
      birthProfileId: "profile-1",
      houseSystem: "Placidus",
      includeOptionalPoints: [],
    });
  });

  it("rejects with ApiError on 422", async () => {
    server.use(
      http.post("*/api/v1/charts/natal", () => {
        return HttpResponse.json(
          { errorCode: "INVALID_DATETIME", status: 422 },
          {
            status: 422,
            headers: { "Content-Type": "application/problem+json" },
          },
        );
      }),
    );

    const promise = createNatalChart("profile-1", "Placidus");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "INVALID_DATETIME",
      status: 422,
    });
  });
});
