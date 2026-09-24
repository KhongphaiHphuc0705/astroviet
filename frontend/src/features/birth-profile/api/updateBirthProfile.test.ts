import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import {
  birthProfileForbidden,
  birthProfileMalformedRequest,
  birthProfileNotFound,
  birthProfileValidationError,
  mockUpdateBirthProfile,
  updateBirthProfileSuccess,
} from "./mocks/handlers";
import { updateBirthProfile } from "./updateBirthProfile";

describe("updateBirthProfile", () => {
  const validUpdate = {
    label: "Updated Profile",
  };

  it("sends correct request and returns BirthProfile on success", async () => {
    server.use(updateBirthProfileSuccess());
    const result = await updateBirthProfile("123", validUpdate);
    expect(result.id).toBeDefined();
  });

  it("preserves explicitly sent birthTime: null in request body", async () => {
    let capturedBody: unknown;
    server.use(
      mockUpdateBirthProfile(async ({ request }) => {
        capturedBody = await request.json();
        return new Response(JSON.stringify({ id: "123" }), { status: 200 });
      }),
    );
    await updateBirthProfile("123", { birthTime: null });
    expect(capturedBody).toBeDefined();
    expect(capturedBody).toHaveProperty("birthTime", null);
  });

  it("rejects with ApiError on 400 MALFORMED_REQUEST", async () => {
    server.use(birthProfileMalformedRequest(mockUpdateBirthProfile));
    const promise = updateBirthProfile("123", validUpdate);
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "MALFORMED_REQUEST",
      status: 400,
    });
  });

  it("rejects with ApiError on 403 FORBIDDEN", async () => {
    server.use(birthProfileForbidden(mockUpdateBirthProfile));
    const promise = updateBirthProfile("123", validUpdate);
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "FORBIDDEN",
      status: 403,
    });
  });

  it("rejects with ApiError on 404 RESOURCE_NOT_FOUND", async () => {
    server.use(birthProfileNotFound(mockUpdateBirthProfile));
    const promise = updateBirthProfile("123", validUpdate);
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "RESOURCE_NOT_FOUND",
      status: 404,
    });
  });

  it("rejects with ApiError on 422 validation error", async () => {
    server.use(
      birthProfileValidationError(
        mockUpdateBirthProfile,
        "INVALID_BIRTH_TIME_STATE",
      ),
    );
    const promise = updateBirthProfile("123", validUpdate);
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "INVALID_BIRTH_TIME_STATE",
      status: 422,
    });
  });
});
