import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import { createBirthProfile } from "./createBirthProfile";
import {
  birthProfileMalformedRequest,
  birthProfileValidationError,
  createBirthProfileSuccess,
  mockCreateBirthProfile,
} from "./mocks/handlers";

describe("createBirthProfile", () => {
  const validInput = {
    label: "My Profile",
    birthDate: "1995-05-12",
    isBirthTimeKnown: false,
    birthLocation: {
      placeName: "Hồ Chí Minh, Việt Nam",
      latitude: 10.7756,
      longitude: 106.7019,
      historicalTimezoneId: "Asia/Ho_Chi_Minh",
    },
  };

  it("sends correct request and returns BirthProfile on success", async () => {
    server.use(createBirthProfileSuccess());
    const result = await createBirthProfile(validInput);
    expect(result.id).toBeDefined();
    expect(result.label).toBe("My Profile");
  });

  it("rejects with ApiError on 400 MALFORMED_REQUEST", async () => {
    server.use(birthProfileMalformedRequest(mockCreateBirthProfile));
    const promise = createBirthProfile(validInput);
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "MALFORMED_REQUEST",
      status: 400,
    });
  });

  it("rejects with ApiError on 422 validation error", async () => {
    server.use(
      birthProfileValidationError(
        mockCreateBirthProfile,
        "INVALID_BIRTH_TIME_STATE",
      ),
    );
    const promise = createBirthProfile(validInput);
    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      errorCode: "INVALID_BIRTH_TIME_STATE",
      status: 422,
    });
  });
});
