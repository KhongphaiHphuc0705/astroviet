import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import { deleteBirthProfile } from "./deleteBirthProfile";
import {
  birthProfileForbidden,
  birthProfileNotFound,
  deleteBirthProfileSuccess,
  mockDeleteBirthProfile,
} from "./mocks/handlers";

describe("deleteBirthProfile", () => {
  it("sends correct request and returns void on success", async () => {
    server.use(deleteBirthProfileSuccess());
    const promise = deleteBirthProfile("123");
    await expect(promise).resolves.toBeUndefined();
  });

  it("rejects with ApiError on 403 FORBIDDEN", async () => {
    server.use(birthProfileForbidden(mockDeleteBirthProfile));
    const promise = deleteBirthProfile("123");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "FORBIDDEN",
      status: 403,
    });
  });

  it("rejects with ApiError on 404 RESOURCE_NOT_FOUND", async () => {
    server.use(birthProfileNotFound(mockDeleteBirthProfile));
    const promise = deleteBirthProfile("123");
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "RESOURCE_NOT_FOUND",
      status: 404,
    });
  });
});
