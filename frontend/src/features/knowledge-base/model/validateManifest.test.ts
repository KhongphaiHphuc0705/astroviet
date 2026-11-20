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

import { KNOWLEDGE_MANIFEST } from "./manifest";
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
});
