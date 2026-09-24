import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import {
  birthProfileMalformedRequest,
  mockSearchLocations,
  searchLocationsSuccess,
} from "./mocks/handlers";
import { searchLocations } from "./searchLocations";

describe("searchLocations", () => {
  it("sends correct request and returns LocationSuggestion array on success", async () => {
    server.use(searchLocationsSuccess());
    const result = await searchLocations({
      q: "Ho Chi Minh",
      date: "1995-05-12",
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.placeName).toBe("Hồ Chí Minh, Việt Nam");
  });

  it("sends correct query parameters in the request", async () => {
    let capturedUrl: URL | undefined;
    server.use(
      mockSearchLocations(async ({ request }) => {
        capturedUrl = new URL(request.url);
        return new Response(JSON.stringify([]), { status: 200 });
      }),
    );
    await searchLocations({
      q: "Test City",
      date: "2000-01-01",
    });
    expect(capturedUrl).toBeDefined();
    expect(capturedUrl?.searchParams.get("q")).toBe("Test City");
    expect(capturedUrl?.searchParams.get("date")).toBe("2000-01-01");
  });

  it("rejects with ApiError on 400 MALFORMED_REQUEST", async () => {
    server.use(birthProfileMalformedRequest(mockSearchLocations));
    const promise = searchLocations({
      q: "H", // Too short
      date: "1995-05-12",
    });
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "MALFORMED_REQUEST",
      status: 400,
    });
  });
});
