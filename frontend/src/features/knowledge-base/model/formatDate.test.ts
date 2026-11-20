import { describe, it, expect } from "vitest";

import { formatKnowledgeDate } from "./formatDate";

describe("formatKnowledgeDate (KB-U34, D-F6.3-04)", () => {
  it("formats standard YYYY-MM-DD date to dd/MM/yyyy", () => {
    expect(formatKnowledgeDate("2026-11-20")).toBe("20/11/2026");
    expect(formatKnowledgeDate("2026-01-05")).toBe("05/01/2026");
    expect(formatKnowledgeDate("2024-02-29")).toBe("29/02/2024");
    expect(formatKnowledgeDate("2025-12-31")).toBe("31/12/2025");
  });

  it("trims whitespace from valid dates", () => {
    expect(formatKnowledgeDate("  2026-11-20  ")).toBe("20/11/2026");
  });

  it("returns original input unchanged if not matching YYYY-MM-DD", () => {
    expect(formatKnowledgeDate("invalid-date")).toBe("invalid-date");
    expect(formatKnowledgeDate("")).toBe("");
    expect(formatKnowledgeDate("2026/11/20")).toBe("2026/11/20");
    expect(formatKnowledgeDate("2026-1-1")).toBe("2026-1-1");
    expect(formatKnowledgeDate("2026-11-20T12:00:00Z")).toBe(
      "2026-11-20T12:00:00Z",
    );
    expect(formatKnowledgeDate("20-11-2026")).toBe("20-11-2026");
  });

  it("returns empty string if input is not a string", () => {
    expect(formatKnowledgeDate(null as unknown as string)).toBe("");
    expect(formatKnowledgeDate(undefined as unknown as string)).toBe("");
    expect(formatKnowledgeDate(12345 as unknown as string)).toBe("");
  });

  it("is purely string-based and immune to timezone shifts", () => {
    // Pure string transformation ensures no Date object parsing or UTC/local timezone shifts
    const input = "2026-11-20";
    const result = formatKnowledgeDate(input);
    expect(result).toBe("20/11/2026");
  });
});
