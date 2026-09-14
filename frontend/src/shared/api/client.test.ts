import { http, HttpResponse } from "msw";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { useAuthStore } from "@shared/stores/authStore";
import { server } from "@test/msw-server";

import { apiClient, ApiError } from "./client";

describe("apiClient", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: "fake-token",
      status: "authenticated",
    });
  });

  it("attaches authorization header if token exists", async () => {
    let capturedHeaders: Headers;

    server.use(
      http.get("http://localhost:5173/api/test-endpoint", ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ success: true });
      }),
    );

    await apiClient.get("/test-endpoint", {
      baseURL: "http://localhost:5173/api",
    });

    expect(capturedHeaders!.get("Authorization")).toBe("Bearer fake-token");
  });

  describe("ApiError standardizations", () => {
    // 1. Lỗi thường (không fieldErrors) → ApiError đúng field cơ bản.
    it("1. standardizes basic ApiError without fieldErrors", async () => {
      server.use(
        http.get("http://localhost:5173/api/error", () => {
          return HttpResponse.json(
            {
              errorCode: "AUTH_002",
              title: "Basic error",
              detail: "Some detail",
            },
            { status: 400 },
          );
        }),
      );

      try {
        await apiClient.get("/error", { baseURL: "http://localhost:5173/api" });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(400);
        expect(apiError.errorCode).toBe("AUTH_002");
        expect(apiError.title).toBe("Basic error");
        expect(apiError.detail).toBe("Some detail");
        expect(apiError.fieldErrors).toBeUndefined();
      }
    });

    // 2. RFC7807 với metadata.fieldErrors 1 field, 1 message.
    // Và đồng thời test M1.6: trigger logout on 401 (lưu ý: M1.6 sẽ sửa cái logout này sau, giờ M1.3 vẫn giữ nguyên là test có logout)
    it("2. parses metadata.fieldErrors (1 field, 1 message) and triggers logout on 401", async () => {
      const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout");
      server.use(
        http.get("http://localhost:5173/api/error", () => {
          return HttpResponse.json(
            {
              errorCode: "AUTH_001",
              title: "Invalid token",
              metadata: {
                fieldErrors: { token: ["Invalid"] },
              },
            },
            { status: 401 },
          );
        }),
      );

      try {
        await apiClient.get("/error", { baseURL: "http://localhost:5173/api" });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(401);
        expect(apiError.fieldErrors).toEqual({ token: ["Invalid"] });
      }
      expect(logoutSpy).toHaveBeenCalled();
    });

    // 3. metadata.fieldErrors 1 field, nhiều message.
    it("3. parses metadata.fieldErrors (1 field, multiple messages)", async () => {
      server.use(
        http.get("http://localhost:5173/api/error", () => {
          return HttpResponse.json(
            {
              errorCode: "VALIDATION_ERROR",
              metadata: {
                fieldErrors: { password: ["Too short", "Needs a number"] },
              },
            },
            { status: 400 },
          );
        }),
      );

      try {
        await apiClient.get("/error", { baseURL: "http://localhost:5173/api" });
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as ApiError).fieldErrors).toEqual({
          password: ["Too short", "Needs a number"],
        });
      }
    });

    // 4. metadata.fieldErrors nhiều field.
    it("4. parses metadata.fieldErrors with multiple fields", async () => {
      server.use(
        http.get("http://localhost:5173/api/error", () => {
          return HttpResponse.json(
            {
              errorCode: "VALIDATION_ERROR",
              metadata: {
                fieldErrors: {
                  email: ["Invalid format"],
                  password: ["Too short"],
                },
              },
            },
            { status: 400 },
          );
        }),
      );

      try {
        await apiClient.get("/error", { baseURL: "http://localhost:5173/api" });
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as ApiError).fieldErrors).toEqual({
          email: ["Invalid format"],
          password: ["Too short"],
        });
      }
    });

    // 5. Response không có metadata → fieldErrors là undefined, không throw.
    it("5. handles missing metadata safely", async () => {
      server.use(
        http.get("http://localhost:5173/api/error", () => {
          return HttpResponse.json(
            { errorCode: "SOME_ERROR" },
            { status: 400 },
          );
        }),
      );

      try {
        await apiClient.get("/error", { baseURL: "http://localhost:5173/api" });
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as ApiError).fieldErrors).toBeUndefined();
      }
    });

    // 6. Response không đúng shape RFC7807 (lỗi mạng thô) → fallback errorCode: "UNKNOWN_ERROR".
    it("6. falls back to UNKNOWN_ERROR on completely malformed response", async () => {
      server.use(
        http.get("http://localhost:5173/api/error", () => {
          return new HttpResponse("Plain text error", { status: 500 });
        }),
      );

      try {
        await apiClient.get("/error", { baseURL: "http://localhost:5173/api" });
        expect.fail("Should have thrown");
      } catch (error) {
        const apiError = error as ApiError;
        expect(apiError.errorCode).toBe("UNKNOWN_ERROR");
        expect(apiError.status).toBe(500);
      }
    });

    // 7. metadata tồn tại nhưng không có fieldErrors bên trong → undefined, không throw.
    it("7. handles metadata without fieldErrors safely", async () => {
      server.use(
        http.get("http://localhost:5173/api/error", () => {
          return HttpResponse.json(
            {
              errorCode: "SOME_ERROR",
              metadata: { someOtherKey: "value" },
            },
            { status: 400 },
          );
        }),
      );

      try {
        await apiClient.get("/error", { baseURL: "http://localhost:5173/api" });
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as ApiError).fieldErrors).toBeUndefined();
      }
    });
  });
});
