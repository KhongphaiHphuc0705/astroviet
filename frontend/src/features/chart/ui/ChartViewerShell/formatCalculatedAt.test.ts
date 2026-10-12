import { describe, expect, it } from "vitest";

import { formatCalculatedAt } from "./formatCalculatedAt";

describe("formatCalculatedAt", () => {
  it("formats valid ISO timestamp into localized vi-VN string", () => {
    const formatted = formatCalculatedAt("2026-10-10T10:00:00.000Z");
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe("string");
    // Verify it includes expected year
    expect(formatted).toContain("2026");
  });

  it("returns fallback input string when date is invalid", () => {
    expect(formatCalculatedAt("invalid-date-string")).toBe(
      "invalid-date-string",
    );
  });
});
