import { describe, it, expect } from "vitest";

import {
  VALID_FIXTURE_MANIFEST,
  INVALID_ENTRY_MANIFEST,
  INVALID_SLUG_MANIFEST,
  RESERVED_SLUG_MANIFEST,
  DUPLICATE_SLUG_MANIFEST,
  INVALID_CATEGORY_MANIFEST,
  INVALID_TITLE_MANIFEST,
  INVALID_SUMMARY_MANIFEST,
  INVALID_ORDER_MANIFEST,
  INVALID_UPDATED_AT_MANIFEST,
} from "../../../test/fixtures/knowledge-base/manifests";

import { knowledgeContentService } from "./knowledgeContentService";
import { KNOWLEDGE_MANIFEST } from "./manifest";
import { KNOWLEDGE_CATEGORIES } from "./types";
import { validateManifest } from "./validateManifest";

describe("validateManifest (KB-U01, KB-U02, KB-U06)", () => {
  describe("KB-U01: Metadata validation & runtime checks", () => {
    it("should accept valid fixture manifest and return valid status with entries", () => {
      const result = validateManifest(VALID_FIXTURE_MANIFEST);
      expect(result.status).toBe("valid");
      if (result.status === "valid") {
        expect(result.entries).toHaveLength(VALID_FIXTURE_MANIFEST.length);
      }
    });

    it("should validate production KNOWLEDGE_MANIFEST cleanly", () => {
      const result = validateManifest(KNOWLEDGE_MANIFEST);
      expect(result.status).toBe("valid");
      if (result.status === "valid") {
        expect(result.entries).toHaveLength(KNOWLEDGE_MANIFEST.length);
        expect(result.entries[0]?.slug).toBe("what-is-astrology");
      }
    });

    it("should detect non-object entries with INVALID_ENTRY", () => {
      const result = validateManifest(INVALID_ENTRY_MANIFEST);
      expect(result.status).toBe("invalid");
      if (result.status === "invalid") {
        expect(result.issues).toHaveLength(4);
        result.issues.forEach((issue) => {
          expect(issue.code).toBe("INVALID_ENTRY");
        });
      }
    });

    it("should detect invalid title (empty or >120 chars) with INVALID_TITLE", () => {
      const result = validateManifest(INVALID_TITLE_MANIFEST);
      expect(result.status).toBe("invalid");
      if (result.status === "invalid") {
        expect(result.issues).toHaveLength(2);
        expect(result.issues[0]?.code).toBe("INVALID_TITLE");
        expect(result.issues[0]?.field).toBe("title");
        expect(result.issues[1]?.code).toBe("INVALID_TITLE");
        expect(result.issues[1]?.field).toBe("title");
      }
    });

    it("should detect invalid summary (empty or >160 chars) with INVALID_SUMMARY", () => {
      const result = validateManifest(INVALID_SUMMARY_MANIFEST);
      expect(result.status).toBe("invalid");
      if (result.status === "invalid") {
        expect(result.issues).toHaveLength(2);
        expect(result.issues[0]?.code).toBe("INVALID_SUMMARY");
        expect(result.issues[0]?.field).toBe("summary");
        expect(result.issues[1]?.code).toBe("INVALID_SUMMARY");
        expect(result.issues[1]?.field).toBe("summary");
      }
    });

    it("should detect invalid order (negative, float, non-number) with INVALID_ORDER", () => {
      const result = validateManifest(INVALID_ORDER_MANIFEST);
      expect(result.status).toBe("invalid");
      if (result.status === "invalid") {
        expect(result.issues).toHaveLength(2);
        expect(result.issues[0]?.code).toBe("INVALID_ORDER");
        expect(result.issues[0]?.field).toBe("order");
        expect(result.issues[1]?.code).toBe("INVALID_ORDER");
        expect(result.issues[1]?.field).toBe("order");
      }
    });

    it("should detect invalid calendar dates (non-existent, invalid month, wrong format) with INVALID_UPDATED_AT", () => {
      const result = validateManifest(INVALID_UPDATED_AT_MANIFEST);
      expect(result.status).toBe("invalid");
      if (result.status === "invalid") {
        expect(result.issues).toHaveLength(3);
        expect(result.issues[0]?.code).toBe("INVALID_UPDATED_AT");
        expect(result.issues[1]?.code).toBe("INVALID_UPDATED_AT");
        expect(result.issues[2]?.code).toBe("INVALID_UPDATED_AT");
      }
    });

    it("should detect invalid category with INVALID_CATEGORY", () => {
      const result = validateManifest(INVALID_CATEGORY_MANIFEST);
      expect(result.status).toBe("invalid");
      if (result.status === "invalid") {
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0]?.code).toBe("INVALID_CATEGORY");
        expect(result.issues[0]?.field).toBe("category");
      }
    });
  });

  describe("KB-U02: Slug format, reserved slugs, and uniqueness", () => {
    it("should detect malformed slugs with INVALID_SLUG", () => {
      const result = validateManifest(INVALID_SLUG_MANIFEST);
      expect(result.status).toBe("invalid");
      if (result.status === "invalid") {
        expect(result.issues).toHaveLength(4);
        result.issues.forEach((issue) => {
          expect(issue.code).toBe("INVALID_SLUG");
          expect(issue.field).toBe("slug");
        });
      }
    });

    it("should detect reserved slugs with RESERVED_SLUG", () => {
      const result = validateManifest(RESERVED_SLUG_MANIFEST);
      expect(result.status).toBe("invalid");
      if (result.status === "invalid") {
        expect(result.issues).toHaveLength(2);
        expect(result.issues[0]?.code).toBe("RESERVED_SLUG");
        expect(result.issues[0]?.slug).toBe("index");
        expect(result.issues[1]?.code).toBe("RESERVED_SLUG");
        expect(result.issues[1]?.slug).toBe("images");
      }
    });

    it("should detect duplicate slugs with DUPLICATE_SLUG", () => {
      const result = validateManifest(DUPLICATE_SLUG_MANIFEST);
      expect(result.status).toBe("invalid");
      if (result.status === "invalid") {
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0]?.code).toBe("DUPLICATE_SLUG");
        expect(result.issues[0]?.slug).toBe("same-slug");
      }
    });
  });

  describe("KB-U06: Deterministic sorting", () => {
    it("should sort entries deterministically by category -> order -> slug across permutations", () => {
      const permutation1 = [...VALID_FIXTURE_MANIFEST];
      const permutation2 = [...VALID_FIXTURE_MANIFEST].reverse();
      const permutation3 = [
        VALID_FIXTURE_MANIFEST[3],
        VALID_FIXTURE_MANIFEST[0],
        VALID_FIXTURE_MANIFEST[5],
        VALID_FIXTURE_MANIFEST[1],
        VALID_FIXTURE_MANIFEST[4],
        VALID_FIXTURE_MANIFEST[2],
      ];

      const res1 = validateManifest(permutation1);
      const res2 = validateManifest(permutation2);
      const res3 = validateManifest(permutation3);

      expect(res1.status).toBe("valid");
      expect(res2.status).toBe("valid");
      expect(res3.status).toBe("valid");

      if (
        res1.status === "valid" &&
        res2.status === "valid" &&
        res3.status === "valid"
      ) {
        expect(res1.entries).toEqual(res2.entries);
        expect(res2.entries).toEqual(res3.entries);

        // Verify category order: fundamentals -> planets -> signs -> houses -> aspects
        expect(res1.entries[0]?.category).toBe("fundamentals");
        expect(res1.entries[1]?.category).toBe("planets");
        expect(res1.entries[2]?.category).toBe("planets");
        expect(res1.entries[3]?.category).toBe("signs");
        expect(res1.entries[4]?.category).toBe("houses");
        expect(res1.entries[5]?.category).toBe("aspects");

        // Verify order within same category (planets: order 1 sun, order 2 moon)
        expect(res1.entries[1]?.slug).toBe("sun-in-astrology");
        expect(res1.entries[2]?.slug).toBe("moon-in-astrology");
      }
    });

    it("should break ties in order within the same category by slug ascending", () => {
      const sameOrderEntries = [
        {
          slug: "zebra-article",
          title: "Zebra",
          category: "fundamentals" as const,
          summary: "Summary Z.",
          order: 1,
          updatedAt: "2026-11-18",
        },
        {
          slug: "alpha-article",
          title: "Alpha",
          category: "fundamentals" as const,
          summary: "Summary A.",
          order: 1,
          updatedAt: "2026-11-18",
        },
      ];

      const res = validateManifest(sameOrderEntries);
      expect(res.status).toBe("valid");
      if (res.status === "valid") {
        expect(res.entries[0]?.slug).toBe("alpha-article");
        expect(res.entries[1]?.slug).toBe("zebra-article");
      }
    });
  });

  describe("KB-U03b: Production 15-Article Scope Contract & Integrity Gates (F6.6.5)", () => {
    // Hard-coded MVP scope contract (15 slugs across 5 categories x 3 articles per F6.6 plan §6 & §9)
    const CONTRACT_SLUGS = [
      "what-is-astrology",
      "how-to-read-a-natal-chart",
      "planets-signs-houses",
      "sun-moon-rising",
      "personal-planets",
      "social-and-outer-planets",
      "zodiac-signs-overview",
      "elements-and-modalities",
      "sign-rulerships",
      "astrological-houses-overview",
      "angular-succedent-cadent-houses",
      "house-rulers",
      "what-are-astrological-aspects",
      "major-aspects",
      "orbs-and-applying-separating",
    ] as const;

    // Fixed upper-bound calendar date to prevent clock-based CI flake (F6.6 plan §9 KB-U03b-4)
    const MAX_ALLOWED_UPDATED_AT = "2026-12-31";

    // Regex gate for obvious authoring placeholders (KB-U03b-6).
    // Known limitation: regex checks obvious markers only; semantic completeness is verified via manual checklist §7.5.
    const PLACEHOLDER_REGEX =
      /\b(?:TODO|FIXME|Lorem(?:\s+ipsum)?|Draft)\b|\[placeholder\]|\.\.\./i;

    it("KB-U03b-1: should contain exactly 15 production entries matching the approved scope contract slugs", () => {
      expect(KNOWLEDGE_MANIFEST).toHaveLength(15);

      const actualSlugs = KNOWLEDGE_MANIFEST.map((entry) => entry.slug);
      expect(actualSlugs).toEqual([...CONTRACT_SLUGS]);
    });

    it("KB-U03b-2 & KB-U03b-3: should have exactly 3 articles per category with order values {1, 2, 3}", () => {
      expect(KNOWLEDGE_CATEGORIES).toHaveLength(5);

      for (const category of KNOWLEDGE_CATEGORIES) {
        const categoryEntries = KNOWLEDGE_MANIFEST.filter(
          (entry) => entry.category === category,
        );
        expect(
          categoryEntries,
          `Category "${category}" must contain exactly 3 articles`,
        ).toHaveLength(3);

        const sortedOrders = categoryEntries
          .map((entry) => entry.order)
          .sort((a, b) => a - b);
        expect(sortedOrders).toEqual([1, 2, 3]);
      }
    });

    it("KB-U03b-4: should have realistic non-future updatedAt dates within deterministic upper bound", () => {
      for (const entry of KNOWLEDGE_MANIFEST) {
        expect(entry.updatedAt >= "2026-01-01").toBe(true);
        expect(entry.updatedAt <= MAX_ALLOWED_UPDATED_AT).toBe(true);
      }
    });

    it("KB-U03b-5: should enforce unique titles and unique summaries across all 15 articles", () => {
      const titles = KNOWLEDGE_MANIFEST.map((entry) => entry.title.trim());
      const summaries = KNOWLEDGE_MANIFEST.map((entry) => entry.summary.trim());

      expect(new Set(titles).size).toBe(KNOWLEDGE_MANIFEST.length);
      expect(new Set(summaries).size).toBe(KNOWLEDGE_MANIFEST.length);
    });

    it("KB-U03b-6: should contain zero placeholder tokens in title, summary, or article markdown body", async () => {
      for (const entry of KNOWLEDGE_MANIFEST) {
        expect(
          PLACEHOLDER_REGEX.test(entry.title),
          `Title for "${entry.slug}" contains placeholder token`,
        ).toBe(false);
        expect(
          PLACEHOLDER_REGEX.test(entry.summary),
          `Summary for "${entry.slug}" contains placeholder token`,
        ).toBe(false);

        const result = await knowledgeContentService.getArticle(entry.slug);
        expect(result.status).toBe("found");
        if (result.status === "found") {
          expect(
            PLACEHOLDER_REGEX.test(result.article.markdown),
            `Markdown body for "${entry.slug}" contains placeholder token`,
          ).toBe(false);
        }
      }
    });
  });
});
