import { describe, expect, it } from "vitest";

import {
  buildChartItemAriaLabel,
  PROFILE_LABEL_FALLBACKS,
  resolveChartProfileLabel,
  type ChartProfileLookup,
} from "./profileLabel";

describe("profileLabel", () => {
  const readyLookup: ChartProfileLookup = {
    status: "ready",
    labelsById: new Map([
      ["profile-1", "Nguyễn Văn A"],
      ["profile-2", "Hồ sơ cá nhân"],
    ]),
    isComplete: true,
  };

  const incompleteLookup: ChartProfileLookup = {
    status: "ready",
    labelsById: new Map([["profile-1", "Nguyễn Văn A"]]),
    isComplete: false,
  };

  const loadingLookup: ChartProfileLookup = {
    status: "loading",
    labelsById: new Map(),
    isComplete: false,
  };

  const errorLookup: ChartProfileLookup = {
    status: "error",
    labelsById: new Map(),
    isComplete: false,
  };

  it("A5: resolves profile label when present in Map", () => {
    const result = resolveChartProfileLabel("profile-1", readyLookup);
    expect(result).toEqual({
      kind: "resolved",
      text: "Nguyễn Văn A",
    });
  });

  it("A6: returns deleted fallback when birthProfileId is null, undefined, or empty, even if lookup is loading or error", () => {
    expect(resolveChartProfileLabel(null, readyLookup)).toEqual({
      kind: "deleted",
      text: PROFILE_LABEL_FALLBACKS.deleted,
    });
    expect(resolveChartProfileLabel(null, loadingLookup)).toEqual({
      kind: "deleted",
      text: PROFILE_LABEL_FALLBACKS.deleted,
    });
    expect(resolveChartProfileLabel(null, errorLookup)).toEqual({
      kind: "deleted",
      text: PROFILE_LABEL_FALLBACKS.deleted,
    });
    expect(resolveChartProfileLabel(undefined, readyLookup)).toEqual({
      kind: "deleted",
      text: PROFILE_LABEL_FALLBACKS.deleted,
    });
    expect(resolveChartProfileLabel("   ", readyLookup)).toEqual({
      kind: "deleted",
      text: PROFILE_LABEL_FALLBACKS.deleted,
    });
  });

  it("A7: returns deleted fallback when id is not in Map and lookup is complete", () => {
    const result = resolveChartProfileLabel("non-existent-id", readyLookup);
    expect(result).toEqual({
      kind: "deleted",
      text: PROFILE_LABEL_FALLBACKS.deleted,
    });
  });

  it("A8: returns unknown fallback when id is not in Map and lookup is incomplete (D-M11-3)", () => {
    const result = resolveChartProfileLabel(
      "non-existent-id",
      incompleteLookup,
    );
    expect(result).toEqual({
      kind: "unknown",
      text: PROFILE_LABEL_FALLBACKS.unknown,
    });
  });

  it("A9: returns loading kind and loading text when lookup is loading and id is non-null", () => {
    const result = resolveChartProfileLabel("profile-1", loadingLookup);
    expect(result).toEqual({
      kind: "loading",
      text: PROFILE_LABEL_FALLBACKS.loading,
    });
    expect(result.text).not.toBe(PROFILE_LABEL_FALLBACKS.deleted);
  });

  it("A10: returns unavailable kind and unavailable text when lookup is in error", () => {
    const result = resolveChartProfileLabel("profile-1", errorLookup);
    expect(result).toEqual({
      kind: "unavailable",
      text: PROFILE_LABEL_FALLBACKS.unavailable,
    });
  });

  it("buildChartItemAriaLabel formats aria-label template correctly", () => {
    const ariaLabel = buildChartItemAriaLabel(
      "Nguyễn Văn A",
      "10:30 13/10/2026",
    );
    expect(ariaLabel).toBe(
      "Xem lá số: Nguyễn Văn A, tính lúc 10:30 13/10/2026",
    );

    const fallbackAriaLabel = buildChartItemAriaLabel(
      PROFILE_LABEL_FALLBACKS.deleted,
      "10:30 13/10/2026",
    );
    expect(fallbackAriaLabel).toBe(
      "Xem lá số: Hồ sơ đã xoá hoặc không còn, tính lúc 10:30 13/10/2026",
    );
  });
});
