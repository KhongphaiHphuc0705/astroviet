import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import { getBirthProfile } from "./getBirthProfile";
import {
  birthProfileForbidden,
  birthProfileNotFound,
  getBirthProfileSuccess,
  mockGetBirthProfile,
} from "./mocks/handlers";

describe("getBirthProfile", () => {
  it("sends correct request and returns BirthProfile on success", async () => {
    server.use(getBirthProfileSuccess());
    const result = await getBirthProfile("123");
    expect(result.id).toBeDefined();
  });

  it("rejects with ApiError on 403 FORBIDDEN", async () => {
    server.use(birthProfileForbidden(mockGetBirthProfile));
    const promise = getBirthProfile("123");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "FORBIDDEN",
      status: 403,
    });
  });

  it("rejects with ApiError on 404 RESOURCE_NOT_FOUND", async () => {
    server.use(birthProfileNotFound(mockGetBirthProfile));
    const promise = getBirthProfile("123");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "RESOURCE_NOT_FOUND",
      status: 404,
    });
  });
});
