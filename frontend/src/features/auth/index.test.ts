import { http, HttpResponse } from "msw";
import { describe, it, expect, beforeEach } from "vitest";

import {
  coordinateRefresh,
  __resetRefreshCoordinatorForTests,
} from "@shared/api/auth-refresh-coordinator";
import { AUTH_REFRESH_ENDPOINT } from "@shared/api/client";
import { server } from "@test/msw-server";

import { registerAuthInfrastructure } from "./index";

describe("registerAuthInfrastructure", () => {
  beforeEach(() => {
    __resetRefreshCoordinatorForTests();
  });

  it("registers handler that calls refresh and returns accessToken", async () => {
    server.use(
      http.post(`*${AUTH_REFRESH_ENDPOINT}`, () => {
        return HttpResponse.json(
          {
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
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

    registerAuthInfrastructure();

    const token = await coordinateRefresh();
    expect(token).toBe("new-access-token");
  });

  it("is safe to call multiple times", async () => {
    server.use(
      http.post(`*${AUTH_REFRESH_ENDPOINT}`, () => {
        return HttpResponse.json(
          {
            accessToken: "new-access-token-2",
            refreshToken: "new-refresh-token",
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

    registerAuthInfrastructure();
    registerAuthInfrastructure(); // Second call

    const token = await coordinateRefresh();
    expect(token).toBe("new-access-token-2");
  });
});

describe("features/auth import side-effects", () => {
  beforeEach(() => {
    __resetRefreshCoordinatorForTests();
  });

  it("does not register handler merely by importing", async () => {
    // We already imported at the top, so if there were side effects,
    // coordinateRefresh would not throw.
    await expect(coordinateRefresh()).rejects.toThrow(
      "No refresh handler registered",
    );
  });
});
