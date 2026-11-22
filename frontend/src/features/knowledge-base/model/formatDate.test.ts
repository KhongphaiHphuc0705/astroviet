import { describe, expect, it } from "vitest";

import { formatKnowledgeDate } from "./formatDate";

describe("formatKnowledgeDate (KB-U34, KB-U44, D-F6.3-04, AC-F6.4-A01)", () => {
  it("should format valid YYYY-MM-DD calendar dates to dd/MM/yyyy", () => {
    expect(formatKnowledgeDate("2026-11-21")).toBe("21/11/2026");
    expect(formatKnowledgeDate("2026-01-05")).toBe("05/01/2026");
    expect(formatKnowledgeDate("2024-02-29")).toBe("29/02/2024"); // leap year
    expect(formatKnowledgeDate("2025-12-31")).toBe("31/12/2025");
  });

  it("should trim surrounding whitespace on valid dates", () => {
    expect(formatKnowledgeDate("  2026-11-21  ")).toBe("21/11/2026");
  });

  it("should return empty string for invalid calendar dates (non-leap Feb 29, Feb 30, month 13)", () => {
    expect(formatKnowledgeDate("2026-02-29")).toBe("");
    expect(formatKnowledgeDate("2026-02-30")).toBe("");
    expect(formatKnowledgeDate("2026-04-31")).toBe("");
    expect(formatKnowledgeDate("2026-13-01")).toBe("");
    expect(formatKnowledgeDate("2026-00-10")).toBe("");
    expect(formatKnowledgeDate("2026-01-00")).toBe("");
  });

  it("should return empty string for malformed, empty, or datetime strings", () => {
    expect(formatKnowledgeDate("")).toBe("");
    expect(formatKnowledgeDate("invalid-date")).toBe("");
    expect(formatKnowledgeDate("2026-1-5")).toBe("");
    expect(formatKnowledgeDate("2026/11/21")).toBe("");
    expect(formatKnowledgeDate("21-11-2026")).toBe("");
    expect(formatKnowledgeDate("2026-11-21T00:00:00Z")).toBe("");
  });

  it("should return empty string when input is not a string", () => {
    expect(formatKnowledgeDate(null as unknown as string)).toBe("");
    expect(formatKnowledgeDate(undefined as unknown as string)).toBe("");
    expect(formatKnowledgeDate(12345 as unknown as string)).toBe("");
  });

  it("should produce identical output regardless of process TZ setting", () => {
    const originalTz = process.env.TZ;
    const zones = ["UTC", "Asia/Ho_Chi_Minh", "America/Los_Angeles"];

    try {
      for (const tz of zones) {
        process.env.TZ = tz;
        expect(formatKnowledgeDate("2026-11-21")).toBe("21/11/2026");
        expect(formatKnowledgeDate("2024-02-29")).toBe("29/02/2024");
        expect(formatKnowledgeDate("2026-02-29")).toBe("");
      }
    } finally {
      if (originalTz === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTz;
      }
    }
  });
});
