import { http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import { register } from "./register";

describe("register API", () => {
  it("sends correct request and returns user on success", async () => {
    let capturedBody: unknown = null;

    server.use(
      http.post("*/api/v1/auth/register", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          {
            user: {
              id: "123",
              email: "test@example.com",
              displayName: "Test User",
              role: "user",
              createdAt: "2023-01-01T00:00:00.000Z",
            },
          },
          { status: 201 },
        );
      }),
    );

    const input = {
      email: "test@example.com",
      password: "Password1",
      displayName: "Test User",
    };

    const response = await register(input);

    expect(capturedBody).toEqual(input);
    expect(response.user).toEqual({
      id: "123",
      email: "test@example.com",
      displayName: "Test User",
      role: "user",
      createdAt: "2023-01-01T00:00:00.000Z",
    });
  });

  it("rejects with ApiError on 409 EMAIL_ALREADY_EXISTS", async () => {
    server.use(
      http.post("*/api/v1/auth/register", () => {
        return HttpResponse.json(
          {
            type: "https://errors.astroviet.com/conflict",
            title: "Conflict",
            status: 409,
            errorCode: "EMAIL_ALREADY_EXISTS",
            detail: "Email already exists",
          },
          {
            status: 409,
            headers: {
              "Content-Type": "application/problem+json",
            },
          },
        );
      }),
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
