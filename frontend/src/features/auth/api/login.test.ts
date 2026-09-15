import { http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import { login } from "./login";

describe("login API", () => {
  it("sends correct request and returns AuthResponse on success", async () => {
    let capturedBody: unknown = null;

    server.use(
      http.post("*/api/v1/auth/login", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          {
            accessToken: "fake-access-token",
            refreshToken: "fake-refresh-token",
            expiresIn: 3600,
            user: {
              id: "123",
              email: "test@example.com",
              displayName: "Test User",
              role: "user",
              createdAt: "2023-01-01T00:00:00.000Z",
            },
          },
          { status: 200 },
        );
      }),
    );

    const input = {
      email: "test@example.com",
      password: "Password1",
    };

    const response = await login(input);

    expect(capturedBody).toEqual(input);
    expect(response).toEqual({
      accessToken: "fake-access-token",
      refreshToken: "fake-refresh-token",
      expiresIn: 3600,
      user: {
        id: "123",
        email: "test@example.com",
        displayName: "Test User",
        role: "user",
        createdAt: "2023-01-01T00:00:00.000Z",
      },
    });
  });

  it("rejects with ApiError on 401 INVALID_CREDENTIALS", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () => {
        return HttpResponse.json(
          {
            type: "https://errors.astroviet.com/unauthorized",
            title: "Unauthorized",
            status: 401,
            errorCode: "INVALID_CREDENTIALS",
            detail: "Invalid credentials",
          },
          {
            status: 401,
            headers: {
              "Content-Type": "application/problem+json",
            },
          },
        );
      }),
    );

    const input = {
      email: "test@example.com",
      password: "wrong",
    };

    let caughtError: unknown;
    try {
      await login(input);
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(ApiError);
    if (caughtError instanceof ApiError) {
      expect(caughtError.errorCode).toBe("INVALID_CREDENTIALS");
      expect(caughtError.status).toBe(401);
    }
  });
});
