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
