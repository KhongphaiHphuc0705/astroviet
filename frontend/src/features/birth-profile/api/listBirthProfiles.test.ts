import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import { listBirthProfiles } from "./listBirthProfiles";
import {
  birthProfileMalformedRequest,
  listBirthProfilesSuccess,
  mockListBirthProfiles,
} from "./mocks/handlers";

describe("listBirthProfiles", () => {
  it("sends correct request and returns ListBirthProfilesResponse on success", async () => {
    server.use(listBirthProfilesSuccess());
    const result = await listBirthProfiles();
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("sends correct query parameters in the request when provided", async () => {
    let capturedUrl: URL | undefined;
    server.use(
      mockListBirthProfiles(async ({ request }) => {
        capturedUrl = new URL(request.url);
        return new Response(JSON.stringify({ items: [], total: 0 }), {
          status: 200,
        });
      }),
    );
    await listBirthProfiles({
      page: 2,
      pageSize: 50,
      sortBy: "fullName",
      order: "asc",
    });
    expect(capturedUrl).toBeDefined();
    expect(capturedUrl?.searchParams.get("page")).toBe("2");
    expect(capturedUrl?.searchParams.get("pageSize")).toBe("50");
    expect(capturedUrl?.searchParams.get("sortBy")).toBe("fullName");
    expect(capturedUrl?.searchParams.get("order")).toBe("asc");
  });

  it("rejects with ApiError on 400 MALFORMED_REQUEST", async () => {
    server.use(birthProfileMalformedRequest(mockListBirthProfiles));
    const promise = listBirthProfiles({
      sortBy: "invalid" as unknown as "createdAt",
    });
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "MALFORMED_REQUEST",
      status: 400,
    });
  });
});
