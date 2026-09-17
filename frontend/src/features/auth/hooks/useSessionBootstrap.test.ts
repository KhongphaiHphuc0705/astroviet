import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import * as coordinator from "@shared/api/auth-refresh-coordinator";

import { useSessionBootstrap } from "./useSessionBootstrap";

vi.mock("@shared/api/auth-refresh-coordinator", () => ({
  coordinateRefresh: vi.fn(),
}));

describe("useSessionBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Test A — calls coordinateRefresh exactly once on mount", async () => {
    vi.mocked(coordinator.coordinateRefresh).mockResolvedValueOnce(
      "fake-access-token",
    );

    renderHook(() => useSessionBootstrap());

    await waitFor(() => {
      expect(coordinator.coordinateRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it("Test B — swallows errors silently if coordinateRefresh rejects", async () => {
    // Suppress console error if vitest logs unhandled rejections
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(coordinator.coordinateRefresh).mockRejectedValueOnce(
      new Error("Refresh failed"),
    );

    expect(() => renderHook(() => useSessionBootstrap())).not.toThrow();

    await waitFor(() => {
      expect(coordinator.coordinateRefresh).toHaveBeenCalledTimes(1);
    });

    consoleSpy.mockRestore();
  });
});
