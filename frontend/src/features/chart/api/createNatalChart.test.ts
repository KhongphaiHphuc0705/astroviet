import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import { createNatalChart } from "./createNatalChart";
import { chartFull } from "./mocks/fixtures";
import {
  chartNotFound,
  chartDomainError,
  mockCreateNatalChart,
  mockGetChart,
  problemDetails,
} from "./mocks/handlers";

describe("createNatalChart", () => {
  it("sends correct POST request with save=true and returns ChartResponse on success (Placidus)", async () => {
    let capturedBody: unknown = null;
    let capturedUrlStr: string | null = null;
    server.use(
      http.post("*/api/v1/charts/natal", async ({ request }) => {
        capturedUrlStr = request.url;
        capturedBody = await request.json();
        return HttpResponse.json(chartFull, { status: 201 });
      }),
    );

    const result = await createNatalChart("profile-1", "Placidus");

    expect(result.id).toBe(chartFull.id);
    const url = new URL(capturedUrlStr!);
    expect(url.searchParams.get("save")).toBe("true");
    expect(url.searchParams.toString()).toBe("save=true"); // verify ONLY save is present
    expect(capturedBody).toStrictEqual({
      birthProfileId: "profile-1",
      houseSystem: "Placidus",
      includeOptionalPoints: [],
    });
  });

  it("sends correct POST request for WholeSign", async () => {
    let capturedBody: Record<string, unknown> | undefined = undefined;
    server.use(
      http.post("*/api/v1/charts/natal", async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(chartFull, { status: 201 });
      }),
    );

    await createNatalChart("profile-1", "WholeSign");
    expect(
      (capturedBody as { houseSystem?: string } | undefined)?.houseSystem,
    ).toBe("WholeSign");
  });

  it("rejects with ApiError on 401", async () => {
    server.use(mockCreateNatalChart(() => problemDetails(401, "UNAUTHORIZED")));
    const promise = createNatalChart("profile-1", "Placidus");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "UNAUTHORIZED",
      status: 401,
    });
  });

  it("rejects with ApiError on 404", async () => {
    server.use(
      chartNotFound(mockCreateNatalChart as unknown as typeof mockGetChart),
    );
    const promise = createNatalChart("profile-1", "Placidus");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "RESOURCE_NOT_FOUND",
      status: 404,
    });
  });

  it("rejects with ApiError on 422", async () => {
    server.use(chartDomainError(mockCreateNatalChart, "INVALID_DATETIME"));

    const promise = createNatalChart("profile-1", "Placidus");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "INVALID_DATETIME",
      status: 422,
    });
  });
});
