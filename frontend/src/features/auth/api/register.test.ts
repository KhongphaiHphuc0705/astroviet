import { HttpResponse } from "msw";
import { describe, it, expect } from "vitest";

import {
  mockRegister,
  mockUser,
  problemDetails,
} from "@features/auth/api/mocks/handlers";
import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import { register } from "./register";

describe("register API", () => {
  it("sends correct request and returns user on success", async () => {
    let capturedBody: unknown = null;

    server.use(
      mockRegister(async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ user: mockUser() }, { status: 201 });
      }),
    );

    const input = {
      email: "test@example.com",
      password: "Password1",
      displayName: "Test User",
    };

    const response = await register(input);

    expect(capturedBody).toEqual(input);
    expect(response.user).toEqual(mockUser());
  });

  it("rejects with ApiError on 409 EMAIL_ALREADY_EXISTS", async () => {
    server.use(
      mockRegister(() =>
        problemDetails({
          type: "https://errors.astroviet.com/conflict",
          title: "Conflict",
          status: 409,
          errorCode: "EMAIL_ALREADY_EXISTS",
          detail: "Email already exists",
        }),
      ),
    );

    const input = {
      email: "test@example.com",
      password: "Password1",
    };

    let caughtError: unknown;
    try {
      await register(input);
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(ApiError);
    if (caughtError instanceof ApiError) {
      expect(caughtError.errorCode).toBe("EMAIL_ALREADY_EXISTS");
      expect(caughtError.status).toBe(409);
    }
  });
});
