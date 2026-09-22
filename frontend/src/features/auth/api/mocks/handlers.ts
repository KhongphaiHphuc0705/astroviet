import { http, HttpResponse, delay } from "msw";

import { AUTH_REFRESH_ENDPOINT } from "@shared/api/client";

/**
 * Coding Standards §13.3: MSW handlers tập trung tại đây thay vì định nghĩa
 * inline trong từng test file, để endpoint string và các response mẫu chỉ có
 * 1 nguồn duy nhất (tránh lệch giữa các test khi backend contract đổi).
 *
 * Test nào cần body/response đặc thù (ví dụ test parser ApiError với RFC7807
 * đầy đủ) vẫn có thể truyền resolver riêng vào mock*(resolver) — chỉ URL là
 * dùng chung, không ép mọi test phải trả về cùng 1 response.
 */

// ---------- Endpoint URLs (nguồn duy nhất, khớp backend contract thật) ----------
export const AUTH_ENDPOINTS = {
  register: "*/api/v1/auth/register",
  login: "*/api/v1/auth/login",
  refresh: `*${AUTH_REFRESH_ENDPOINT}`,
  logout: "*/api/v1/auth/logout",
} as const;

// ---------- Fixture mặc định ----------
export const mockUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "123",
  email: "test@example.com",
  displayName: "Test User",
  role: "user" as const,
  createdAt: "2023-01-01T00:00:00.000Z",
  ...overrides,
});

// ---------- RFC7807 Problem Details builder (dùng cho test parser ApiError) ----------
export const problemDetails = ({
  type = "https://errors.astroviet.com/error",
  title = "Error",
  status,
  errorCode,
  detail,
}: {
  type?: string;
  title?: string;
  status: number;
  errorCode: string;
  detail?: string;
}) =>
  HttpResponse.json(
    { type, title, status, errorCode, ...(detail !== undefined && { detail }) },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );

// ---------- Handler factory theo endpoint (resolver tùy biến khi cần) ----------
type Resolver = Parameters<typeof http.post>[1];

export const mockRegister = (resolver: Resolver) =>
  http.post(AUTH_ENDPOINTS.register, resolver);
export const mockLogin = (resolver: Resolver) =>
  http.post(AUTH_ENDPOINTS.login, resolver);
export const mockRefresh = (resolver: Resolver) =>
  http.post(AUTH_ENDPOINTS.refresh, resolver);
export const mockLogout = (resolver: Resolver) =>
  http.post(AUTH_ENDPOINTS.logout, resolver);

// ---------- Kịch bản chuẩn (dùng lại nguyên vẹn ở đa số test UI-level) ----------
export const registerSuccess = () =>
  mockRegister(() => HttpResponse.json({ user: mockUser() }, { status: 201 }));

export const registerConflict = () =>
  mockRegister(() =>
    HttpResponse.json({ errorCode: "EMAIL_ALREADY_EXISTS" }, { status: 409 }),
  );

export const registerServerError = () =>
  mockRegister(() =>
    HttpResponse.json(
      { errorCode: "INTERNAL_SERVER_ERROR", title: "Something went wrong" },
      { status: 500 },
    ),
  );

export const loginSuccess = (
  overrides: Partial<Record<string, unknown>> = {},
) =>
  mockLogin(() =>
    HttpResponse.json(
      {
        accessToken: "fake-access-token",
        refreshToken: "fake-refresh-token",
        expiresIn: 3600,
        user: mockUser(),
        ...overrides,
      },
      { status: 200 },
    ),
  );

export const loginInvalidCredentials = () =>
  mockLogin(() =>
    HttpResponse.json({ errorCode: "INVALID_CREDENTIALS" }, { status: 401 }),
  );

export const refreshSuccess = (
  overrides: Partial<Record<string, unknown>> = {},
) =>
  mockRefresh(() =>
    HttpResponse.json(
      {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        expiresIn: 3600,
        user: mockUser(),
        ...overrides,
      },
      { status: 200 },
    ),
  );

export const refreshUnauthorized = () =>
  mockRefresh(() =>
    HttpResponse.json({ errorCode: "UNAUTHORIZED" }, { status: 401 }),
  );

export const logoutSuccess = () =>
  mockLogout(() => new HttpResponse(null, { status: 204 }));

export const logoutServerError = () =>
  mockLogout(() =>
    HttpResponse.json({ errorCode: "INTERNAL_SERVER_ERROR" }, { status: 500 }),
  );

// ---------- Bộ handler "happy path" đầy đủ cho integration test (giữ nguyên từ trước) ----------
// Lưu ý: fixture user ở đây (id "1") độc lập với mockUser() ở trên (id "123") —
// đây là 2 fixture khác nhau đã tồn tại từ trước, không gộp lại để tránh đổi
// hành vi test đã pass.
const integrationFlowUser = mockUser({ id: "1" });

export const authFlowHandlers = [
  http.post(AUTH_ENDPOINTS.register, async () => {
    await delay(10);
    return HttpResponse.json({ user: integrationFlowUser }, { status: 201 });
  }),

  http.post(AUTH_ENDPOINTS.login, async () => {
    await delay(10);
    return HttpResponse.json(
      {
        user: integrationFlowUser,
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        expiresIn: 3600,
      },
      { status: 200 },
    );
  }),

  http.post(AUTH_ENDPOINTS.refresh, async () => {
    await delay(10);
    return HttpResponse.json(
      {
        user: integrationFlowUser,
        accessToken: "new-mock-access-token",
        refreshToken: "new-mock-refresh-token",
        expiresIn: 3600,
      },
      { status: 200 },
    );
  }),

  http.post(AUTH_ENDPOINTS.logout, async () => {
    await delay(10);
    return new HttpResponse(null, { status: 204 });
  }),
];
