import { http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";

import { ApiError } from "@shared/api/client";
import { server } from "@test/msw-server";

import { logout } from "./logout";

describe("logout API", () => {
  it("resolves without throwing on 204 success", async () => {
    let capturedMethod = "";
    server.use(
      http.post("*/api/v1/auth/logout", ({ request }) => {
        capturedMethod = request.method;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(logout()).resolves.toBeUndefined();
    expect(capturedMethod).toBe("POST");
  });

  it("rejects with ApiError on 401", async () => {
    server.use(
      http.post("*/api/v1/auth/logout", () => {
        return HttpResponse.json(
          {
            type: "https://errors.astroviet.com/unauthorized",
            title: "Unauthorized",
            status: 401,
            errorCode: "UNAUTHORIZED",
          },
          { status: 401 },
        );
      }),
    );

    let caughtError: unknown;
    try {
      await logout();
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(ApiError);
    if (caughtError instanceof ApiError) {
      expect(caughtError.errorCode).toBe("UNAUTHORIZED");
      expect(caughtError.status).toBe(401);
    }
  });
});
