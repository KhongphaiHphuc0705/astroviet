import { describe, it, expect } from "vitest";

import { VALID_FIXTURE_MANIFEST } from "@test/fixtures/knowledge-base/manifests";

import {
  CATEGORY_FILTER_ALL,
  filterArticlesByCategory,
  type KnowledgeCategoryFilterValue,
} from "./categoryFilter";
import { isKnowledgeCategory } from "./types";

describe("categoryFilter (KB-U32, D-F6.3-03, D-F6.3-04)", () => {
  it("exports CATEGORY_FILTER_ALL constant as 'all'", () => {
    expect(CATEGORY_FILTER_ALL).toBe("all");
  });

  describe("filterArticlesByCategory", () => {
    it("returns all articles unchanged in original order when selected is 'all'", () => {
      const result = filterArticlesByCategory(VALID_FIXTURE_MANIFEST, "all");
      expect(result).toHaveLength(VALID_FIXTURE_MANIFEST.length);
      expect(result).toEqual(VALID_FIXTURE_MANIFEST);
    });

    it("filters articles matching a category with multiple articles (planets)", () => {
      const result = filterArticlesByCategory(
        VALID_FIXTURE_MANIFEST,
        "planets",
      );
      expect(result).toHaveLength(2);
      expect(result.map((a) => a.slug)).toEqual([
        "sun-in-astrology",
        "moon-in-astrology",
      ]);
      expect(result.every((a) => a.category === "planets")).toBe(true);
    });

    it("filters articles matching a category with a single article (fundamentals)", () => {
      const result = filterArticlesByCategory(
        VALID_FIXTURE_MANIFEST,
        "fundamentals",
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.slug).toBe("what-is-astrology");
      expect(result[0]?.category).toBe("fundamentals");
    });

    it("returns empty array when category has no matching articles in dataset", () => {
      const noSignsManifest = VALID_FIXTURE_MANIFEST.filter(
        (a) => a.category !== "signs",
      );
      const result = filterArticlesByCategory(noSignsManifest, "signs");
      expect(result).toEqual([]);
    });

    it("returns empty array when input articles array is empty", () => {
      expect(filterArticlesByCategory([], "all")).toEqual([]);
      expect(filterArticlesByCategory([], "planets")).toEqual([]);
    });

    it("does not mutate the input array", () => {
      const copy = [...VALID_FIXTURE_MANIFEST];
      Object.freeze(copy); // guarantees runtime throw if mutated
      expect(() => filterArticlesByCategory(copy, "planets")).not.toThrow();
    });

    it("returns empty array for invalid/unknown filter value coerced via cast", () => {
      const result = filterArticlesByCategory(
        VALID_FIXTURE_MANIFEST,
        "invalid-category" as KnowledgeCategoryFilterValue,
      );
      expect(result).toEqual([]);
    });
  });

  describe("isKnowledgeCategory boundary", () => {
    it("returns true for all 5 canonical knowledge categories", () => {
      expect(isKnowledgeCategory("fundamentals")).toBe(true);
      expect(isKnowledgeCategory("planets")).toBe(true);
      expect(isKnowledgeCategory("signs")).toBe(true);
      expect(isKnowledgeCategory("houses")).toBe(true);
      expect(isKnowledgeCategory("aspects")).toBe(true);
    });

    it("returns false for non-category strings or filter constants", () => {
      expect(isKnowledgeCategory("all")).toBe(false);
      expect(isKnowledgeCategory("")).toBe(false);
      expect(isKnowledgeCategory("PLANETS")).toBe(false);
      expect(isKnowledgeCategory("tarot")).toBe(false);
    });
  });
});
