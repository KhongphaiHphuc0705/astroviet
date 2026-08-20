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

    // VITE_API_BASE_URL is usually a fully qualified URL (e.g. http://localhost:3000)
    // To ensure MSW intercepts it correctly in this isolated test, we override baseURL
    // with a specific localhost address that matches the MSW handler.
    await apiClient.get("/test-endpoint", {
      baseURL: "http://localhost:5173/api",
    });

    expect(capturedHeaders!.get("Authorization")).toBe("Bearer fake-token");
  });

  it("standardizes ApiError and triggers logout on 401", async () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout");

    server.use(
      http.get("http://localhost:5173/api/unauthorized", () => {
        return HttpResponse.json(
          {
            errorCode: "AUTH_001",
            title: "Invalid token",
            detail: "Token expired",
            fieldErrors: [{ field: "token", message: "Invalid" }],
          },
          { status: 401 },
        );
      }),
    );

    try {
      await apiClient.get("/unauthorized", {
        baseURL: "http://localhost:5173/api",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(401);
      expect((error as ApiError).errorCode).toBe("AUTH_001");
      expect((error as ApiError).title).toBe("Invalid token");
      expect((error as ApiError).detail).toBe("Token expired");
      expect((error as ApiError).fieldErrors).toEqual([
        { field: "token", message: "Invalid" },
      ]);
    }

    expect(logoutSpy).toHaveBeenCalled();
  });
});
