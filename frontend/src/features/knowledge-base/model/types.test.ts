import { describe, it, expect } from "vitest";

import {
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_CATEGORY_LABELS,
  SLUG_PATTERN,
  RESERVED_SLUGS,
  isKnowledgeCategory,
} from "./types";

describe("Knowledge Base Types & Constants (KB-U03)", () => {
  it("should define exactly 5 categories with fundamentals as first", () => {
    expect(KNOWLEDGE_CATEGORIES).toHaveLength(5);
    expect(KNOWLEDGE_CATEGORIES[0]).toBe("fundamentals");
    expect(KNOWLEDGE_CATEGORIES).toEqual([
      "fundamentals",
      "planets",
      "signs",
      "houses",
      "aspects",
    ]);
  });

  it("should have correct Vietnamese labels for all 5 categories", () => {
    expect(KNOWLEDGE_CATEGORY_LABELS.fundamentals).toBe("Khái niệm cơ bản");
    expect(KNOWLEDGE_CATEGORY_LABELS.planets).toBe("Hành tinh");
    expect(KNOWLEDGE_CATEGORY_LABELS.signs).toBe("Cung");
    expect(KNOWLEDGE_CATEGORY_LABELS.houses).toBe("Nhà");
    expect(KNOWLEDGE_CATEGORY_LABELS.aspects).toBe("Góc chiếu");
  });

  it("should correctly identify valid and invalid categories via isKnowledgeCategory", () => {
    expect(isKnowledgeCategory("fundamentals")).toBe(true);
    expect(isKnowledgeCategory("planets")).toBe(true);
    expect(isKnowledgeCategory("signs")).toBe(true);
    expect(isKnowledgeCategory("houses")).toBe(true);
    expect(isKnowledgeCategory("aspects")).toBe(true);

    expect(isKnowledgeCategory("")).toBe(false);
    expect(isKnowledgeCategory("unknown")).toBe(false);
    expect(isKnowledgeCategory("Fundamentals")).toBe(false);
    expect(isKnowledgeCategory("PLANETS")).toBe(false);
  });

  it("should validate slug pattern correctly", () => {
    expect(SLUG_PATTERN.test("what-is-astrology")).toBe(true);
    expect(SLUG_PATTERN.test("sun")).toBe(true);
    expect(SLUG_PATTERN.test("house-1")).toBe(true);
    expect(SLUG_PATTERN.test("12-zodiac-signs")).toBe(true);

    expect(SLUG_PATTERN.test("")).toBe(false);
    expect(SLUG_PATTERN.test("Uppercase")).toBe(false);
    expect(SLUG_PATTERN.test("a--b")).toBe(false);
    expect(SLUG_PATTERN.test("-a")).toBe(false);
    expect(SLUG_PATTERN.test("a-")).toBe(false);
    expect(SLUG_PATTERN.test("with space")).toBe(false);
    expect(SLUG_PATTERN.test("tiếng-việt")).toBe(false);
    expect(SLUG_PATTERN.test("a_b")).toBe(false);
  });

  it("should reserve index and images slugs", () => {
    expect(RESERVED_SLUGS).toContain("index");
    expect(RESERVED_SLUGS).toContain("images");
  });
});
