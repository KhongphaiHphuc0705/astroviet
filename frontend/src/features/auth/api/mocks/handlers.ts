import { http, HttpResponse, delay } from "msw";

export const authFlowHandlers = [
  http.post("*/api/v1/auth/register", async () => {
    await delay(10);
    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  http.post("*/api/v1/auth/login", async () => {
    await delay(10);
    return HttpResponse.json(
      {
        user: {
          id: "1",
          email: "test@example.com",
          displayName: "Test User",
          role: "user",
          createdAt: new Date().toISOString(),
        },
        accessToken: "mock-access-token",
        expiresIn: 3600,
      },
      { status: 200 },
    );
  }),

  http.post("*/api/v1/auth/refresh", async () => {
    await delay(10);
    return HttpResponse.json(
      {
        accessToken: "new-mock-access-token",
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
