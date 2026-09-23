import { HttpResponse } from "msw";
import { describe, it, expect } from "vitest";

import { mockRefresh, mockUser } from "@features/auth/api/mocks/handlers";
import { server } from "@test/msw-server";

import { refresh } from "./refresh";

describe("refresh API", () => {
  it("sends correct request and returns AuthResponse on success", async () => {
    let capturedBody: unknown = null;

    server.use(
      mockRefresh(async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          {
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
            expiresIn: 3600,
            user: mockUser(),
          },
          { status: 200 },
        );
      }),
    );

    const response = await refresh();

    expect(capturedBody).toEqual({});
    expect(response).toEqual({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      expiresIn: 3600,
      user: mockUser(),
    });
  });
});
