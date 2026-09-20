import { http, HttpResponse } from "msw";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { useAuthStore } from "@shared/stores/authStore";
import { server } from "@test/msw-server";

import {
  setRefreshHandler,
  __resetRefreshCoordinatorForTests,
} from "./auth-refresh-coordinator";
import { apiClient, ApiError, AUTH_REFRESH_ENDPOINT } from "./client";

describe("apiClient", () => {
  beforeEach(() => {
    __resetRefreshCoordinatorForTests();
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
    it("2. parses metadata.fieldErrors (1 field, 1 message)", async () => {
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
            { status: 400 }, // Đổi thành 400 để không trigger logic 401 retry ở đây
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
        expect(apiError.fieldErrors).toEqual({ token: ["Invalid"] });
      }
    });

    describe("401 Retry Integration (M1.6)", () => {
      it("retries original request with new token from coordinator on 401", async () => {
        let attempt = 0;
        let capturedToken = "";

        server.use(
          http.get("http://localhost:5173/api/protected", ({ request }) => {
            attempt++;
            if (attempt === 1) {
              return HttpResponse.json(
                { errorCode: "TOKEN_EXPIRED" },
                { status: 401 },
              );
            }
            // Second attempt
            capturedToken = request.headers.get("Authorization") || "";
            return HttpResponse.json({ success: true });
          }),
        );

        const handlerSpy = vi.fn().mockImplementation(async () => {
          // Simulate the real features/auth handler behavior: it updates the store with the new token
          useAuthStore.setState({ accessToken: "new-refreshed-token" });
          return "new-refreshed-token";
        });
        setRefreshHandler(handlerSpy);

        const response = await apiClient.get("/protected", {
          baseURL: "http://localhost:5173/api",
        });

        expect(response.data).toEqual({ success: true });
        expect(handlerSpy).toHaveBeenCalledTimes(1);
        expect(capturedToken).toBe("Bearer new-refreshed-token");
      });

      it("rejects with ORIGINAL 401 error if refresh fails", async () => {
        server.use(
          http.get("http://localhost:5173/api/protected", () => {
            return HttpResponse.json(
              { errorCode: "TOKEN_EXPIRED" },
              { status: 401 },
            );
          }),
        );

        const handlerSpy = vi
          .fn()
          .mockRejectedValue(new Error("Refresh completely failed"));
        setRefreshHandler(handlerSpy);

        try {
          await apiClient.get("/protected", {
            baseURL: "http://localhost:5173/api",
          });
          expect.fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(401);
          expect((error as ApiError).errorCode).toBe("TOKEN_EXPIRED");
        }
        expect(handlerSpy).toHaveBeenCalledTimes(1);
      });

      it("rejects with ORIGINAL 401 error if coordinator throws No handler registered", async () => {
        server.use(
          http.get("http://localhost:5173/api/protected", () => {
            return HttpResponse.json(
              { errorCode: "TOKEN_EXPIRED" },
              { status: 401 },
            );
          }),
        );

        // We explicitly do NOT register a handler here to simulate the state where features/auth is missing.
        try {
          await apiClient.get("/protected", {
            baseURL: "http://localhost:5173/api",
          });
          expect.fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(401);
          expect((error as ApiError).errorCode).toBe("TOKEN_EXPIRED");
        }
      });

      it("deduplicates concurrent 401 requests using the coordinator", async () => {
        let attempts = 0;

        server.use(
          http.get("http://localhost:5173/api/protected", () => {
            attempts++;
            if (attempts <= 3) {
              return HttpResponse.json(
                { errorCode: "TOKEN_EXPIRED" },
                { status: 401 },
              );
            }
            return HttpResponse.json({ success: true });
          }),
        );

        let resolveHandler: (val: string) => void;
        const pendingPromise = new Promise<string>((resolve) => {
          resolveHandler = resolve;
        });

        const handlerSpy = vi.fn().mockImplementation(() => {
          return pendingPromise;
        });
        setRefreshHandler(handlerSpy);

        // Fire 3 concurrent requests that will all hit 401
        const req1 = apiClient.get("/protected", {
          baseURL: "http://localhost:5173/api",
        });
        const req2 = apiClient.get("/protected", {
          baseURL: "http://localhost:5173/api",
        });
        const req3 = apiClient.get("/protected", {
          baseURL: "http://localhost:5173/api",
        });

        // Resolve the handler
        resolveHandler!("concurrent-token");

        await Promise.all([req1, req2, req3]);

        // The handler should only be called once, despite 3 concurrent 401s
        expect(handlerSpy).toHaveBeenCalledTimes(1);
      });

      it("rejects immediately with 401 and does not call coordinator if the failed request was a refresh request", async () => {
        server.use(
          http.post(`http://localhost:5173${AUTH_REFRESH_ENDPOINT}`, () => {
            return HttpResponse.json(
              { errorCode: "REFRESH_FAILED" },
              { status: 401 },
            );
          }),
        );

        const handlerSpy = vi.fn();
        setRefreshHandler(handlerSpy);

        try {
          await apiClient.post(
            AUTH_REFRESH_ENDPOINT,
            {},
            {
              baseURL: "http://localhost:5173",
            },
          );
          expect.fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(401);
          expect((error as ApiError).errorCode).toBe("REFRESH_FAILED");
        }

        // The spy should not be called because it bypasses the 401 interceptor retry logic
        expect(handlerSpy).not.toHaveBeenCalled();
      });
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

    // 8. Lỗi network thuần túy (không có response) → fallback statusCode 500 và UNKNOWN_ERROR.
    it("8. handles pure network errors (no response)", async () => {
      server.use(
        http.get("http://localhost:5173/api/error", () => {
          return HttpResponse.error();
        }),
      );

      try {
        await apiClient.get("/error", { baseURL: "http://localhost:5173/api" });
        expect.fail("Should have thrown");
      } catch (error) {
        const apiError = error as ApiError;
        expect(apiError.status).toBe(500);
        expect(apiError.errorCode).toBe("UNKNOWN_ERROR");
        expect(apiError.title).toBe("Network Error");
      }
    });
  });
});
