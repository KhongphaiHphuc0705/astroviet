import { describe, expect, it } from "vitest";

import {
  checkContentParity,
  contentKeyFor,
  KnowledgeContentIntegrityError,
  normalizeGlobKey,
} from "./contentIntegrity";
import type { KnowledgeArticleMetadata } from "./types";

describe("Content Integrity Helpers (KB-U04, KB-U05)", () => {
  describe("contentKeyFor", () => {
    it("should compute exact content key path for an article metadata", () => {
      expect(
        contentKeyFor({
          category: "fundamentals",
          slug: "what-is-astrology",
        }),
      ).toBe("content/fundamentals/what-is-astrology.md");

      expect(
        contentKeyFor({
          category: "planets",
          slug: "sun",
        }),
      ).toBe("content/planets/sun.md");
    });
  });

  describe("normalizeGlobKey", () => {
    it("should normalize valid relative glob keys from model directory", () => {
      expect(
        normalizeGlobKey("../content/fundamentals/what-is-astrology.md"),
      ).toBe("content/fundamentals/what-is-astrology.md");
      expect(normalizeGlobKey("./content/planets/sun.md")).toBe(
        "content/planets/sun.md",
      );
      expect(normalizeGlobKey("content/signs/aries.md")).toBe(
        "content/signs/aries.md",
      );
    });

    it("should normalize Windows backslashes", () => {
      expect(normalizeGlobKey("..\\content\\houses\\house-1.md")).toBe(
        "content/houses/house-1.md",
      );
    });

    it("should return undefined for malformed or invalid keys", () => {
      expect(normalizeGlobKey("../content/README.md")).toBeUndefined();
      expect(
        normalizeGlobKey("../content/fundamentals/nested/doc.md"),
      ).toBeUndefined();
      expect(
        normalizeGlobKey("../content/unknown-category/sun.md"),
      ).toBeUndefined();
      expect(
        normalizeGlobKey("../content/fundamentals/Uppercase.md"),
      ).toBeUndefined();
      expect(
        normalizeGlobKey("../content/fundamentals/a--b.md"),
      ).toBeUndefined();
      expect(
        normalizeGlobKey("../content/fundamentals/doc.txt"),
      ).toBeUndefined();
    });
  });

  describe("checkContentParity", () => {
    const mockManifest: readonly KnowledgeArticleMetadata[] = [
      {
        slug: "what-is-astrology",
        title: "Chiêm tinh học là gì?",
        category: "fundamentals",
        summary: "Tổng quan.",
        order: 1,
        updatedAt: "2026-11-18",
      },
      {
        slug: "sun-in-astrology",
        title: "Mặt Trời",
        category: "planets",
        summary: "Mặt trời.",
        order: 1,
        updatedAt: "2026-11-18",
      },
    ];

    it("should pass when manifest entries and glob keys match 1:1", () => {
      const globKeys = [
        "../content/fundamentals/what-is-astrology.md",
        "../content/planets/sun-in-astrology.md",
      ];

      const result = checkContentParity(mockManifest, globKeys);
      expect(result.missingFiles).toHaveLength(0);
      expect(result.orphanFiles).toHaveLength(0);
      expect(result.malformedKeys).toHaveLength(0);
    });

    it("KB-U04: should detect missing files when manifest has entry but file is missing", () => {
      const globKeys = ["../content/fundamentals/what-is-astrology.md"]; // missing sun-in-astrology.md

      const result = checkContentParity(mockManifest, globKeys);
      expect(result.missingFiles).toHaveLength(1);
      expect(result.missingFiles[0]?.slug).toBe("sun-in-astrology");
      expect(result.missingFiles[0]?.key).toBe(
        "content/planets/sun-in-astrology.md",
      );
      expect(result.orphanFiles).toHaveLength(0);
      expect(result.malformedKeys).toHaveLength(0);
    });

    it("KB-U05: should detect orphan files when file exists without manifest entry", () => {
      const globKeys = [
        "../content/fundamentals/what-is-astrology.md",
        "../content/planets/sun-in-astrology.md",
        "../content/signs/orphan-sign.md",
      ];

      const result = checkContentParity(mockManifest, globKeys);
      expect(result.missingFiles).toHaveLength(0);
      expect(result.orphanFiles).toHaveLength(1);
      expect(result.orphanFiles[0]?.slug).toBe("orphan-sign");
      expect(result.orphanFiles[0]?.key).toBe("content/signs/orphan-sign.md");
      expect(result.malformedKeys).toHaveLength(0);
    });

    it("KB-U05: should detect malformed keys in content directory", () => {
      const globKeys = [
        "../content/fundamentals/what-is-astrology.md",
        "../content/planets/sun-in-astrology.md",
        "../content/README.md",
        "../content/planets/Nested/deep.md",
      ];

      const result = checkContentParity(mockManifest, globKeys);
      expect(result.missingFiles).toHaveLength(0);
      expect(result.orphanFiles).toHaveLength(0);
      expect(result.malformedKeys).toHaveLength(2);
      expect(result.malformedKeys).toContain("../content/README.md");
      expect(result.malformedKeys).toContain(
        "../content/planets/Nested/deep.md",
      );
    });
  });

  describe("KnowledgeContentIntegrityError", () => {
    it("should instantiate with message and default/custom error code", () => {
      const err = new KnowledgeContentIntegrityError("Parity failed");
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("KnowledgeContentIntegrityError");
      expect(err.message).toBe("Parity failed");
      expect(err.code).toBe("CONTENT_PARITY_FAILED");

      const customErr = new KnowledgeContentIntegrityError(
        "Custom message",
        "CUSTOM_CODE",
      );
      expect(customErr.code).toBe("CUSTOM_CODE");
    });
  });
});
