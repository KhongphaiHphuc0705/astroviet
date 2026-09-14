import { useMutation } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import * as errorMessagesModule from "@shared/lib/error-messages";
import * as reportErrorModule from "@shared/lib/report-error";

import { createQueryClient, queryClient } from "./queryClient";

// Wrapper sử dụng queryClient instance mới để tránh leak cache
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    QueryClientProvider,
    { client: createQueryClient() },
    children,
  );

describe("queryClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Provider tồn tại và có thể lấy default options
  it("queryClient is defined and has defaultOptions", () => {
    expect(queryClient).toBeDefined();
    const opts = queryClient.getDefaultOptions();
    expect(opts.queries?.retry).toBe(false);
    expect(opts.mutations?.onError).toBeDefined();
  });

  describe("mutations onError", () => {
    it("reports error if it is not a known business error", () => {
      const reportErrorSpy = vi
        .spyOn(reportErrorModule, "reportError")
        .mockImplementation(() => {});

      vi.spyOn(errorMessagesModule, "isKnownBusinessError").mockReturnValue(
        false,
      );

      const defaultOptions = queryClient.getDefaultOptions();
      const onError = defaultOptions.mutations?.onError;

      expect(onError).toBeDefined();

      const testError = { errorCode: "SOME_UNKNOWN_ERROR" };
      if (onError) {
        onError(testError, null, null, null);
      }

      expect(reportErrorSpy).toHaveBeenCalledWith(
        testError,
        "TanStack Query Mutation",
      );
    });

    it("does not report error if it is a known business error", () => {
      const reportErrorSpy = vi
        .spyOn(reportErrorModule, "reportError")
        .mockImplementation(() => {});

      vi.spyOn(errorMessagesModule, "isKnownBusinessError").mockReturnValue(
        true,
      );

      const defaultOptions = queryClient.getDefaultOptions();
      const onError = defaultOptions.mutations?.onError;

      const testError = { errorCode: "INVALID_CREDENTIALS" };
      if (onError) {
        onError(testError, null, null, null);
      }

      expect(reportErrorSpy).not.toHaveBeenCalled();
    });
  });

  // 2. renderWithProviders support: component using useMutation không throw "No QueryClient set"
  it("renderHook with QueryClientProvider wrapper does not throw for useMutation", () => {
    expect(() => {
      renderHook(() => useMutation({ mutationFn: async () => "ok" }), {
        wrapper,
      });
    }).not.toThrow();
  });
});
