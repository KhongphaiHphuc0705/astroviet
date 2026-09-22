import { http, HttpResponse, delay } from "msw";

const mockUser = {
  id: "1",
  email: "test@example.com",
  displayName: "Test User",
  role: "user" as const,
  createdAt: new Date().toISOString(),
};

export const authFlowHandlers = [
  http.post("*/api/v1/auth/register", async () => {
    await delay(10);
    return HttpResponse.json({ user: mockUser }, { status: 201 });
  }),

  http.post("*/api/v1/auth/login", async () => {
    await delay(10);
    return HttpResponse.json(
      {
        user: mockUser,
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        expiresIn: 3600,
      },
      { status: 200 },
    );
  }),

  http.post("*/api/v1/auth/refresh", async () => {
    await delay(10);
    return HttpResponse.json(
      {
        user: mockUser,
        accessToken: "new-mock-access-token",
        refreshToken: "new-mock-refresh-token",
        expiresIn: 3600,
      },
      { status: 200 },
    );
  }),

  http.post("*/api/v1/auth/logout", async () => {
    await delay(10);
    return new HttpResponse(null, { status: 204 });
  }),
];
