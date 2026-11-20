import { describe, it, expect } from "vitest";

import {
  classifyLinkHref,
  classifyImageSrc,
  validateImageAlt,
  normalizeHeadingLevel,
} from "./markdownPolicy";

describe("Markdown Policy (KB-U11, KB-U12, KB-AC-22, KB-AC-23, KB-AC-25)", () => {
  const isKnownSlug = (slug: string) =>
    ["what-is-astrology", "sun-in-astrology", "major-aspects"].includes(slug);

  describe("classifyLinkHref (KB-U11, KB-AC-22, KB-AC-23)", () => {
    it("should accept valid https external links", () => {
      const res = classifyLinkHref("https://astroviet.com/docs", isKnownSlug);
      expect(res.type).toBe("external");
      if (res.type === "external") {
        expect(res.href).toBe("https://astroviet.com/docs");
      }
    });

    it("should reject https links with user credentials", () => {
      const res = classifyLinkHref("https://user:pass@evil.com", isKnownSlug);
      expect(res.type).toBe("rejected");
      if (res.type === "rejected") {
        expect(res.reason).toBe("credentials-not-allowed");
      }
    });

    it("should reject hostile and non-https schemes", () => {
      const hostileSchemes = [
        "javascript:alert(1)",
        "JaVaScRiPt:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:msgbox(1)",
        "http://insecure-example.com",
        "mailto:test@example.com",
        "tel:0123456789",
        "file:///etc/passwd",
        "blob:https://example.com/uuid",
        "ftp://ftp.example.com",
      ];

      for (const href of hostileSchemes) {
        const res = classifyLinkHref(href, isKnownSlug);
        expect(res.type).toBe("rejected");
        if (res.type === "rejected") {
          expect(res.reason).toBe("unsupported-scheme");
        }
      }
    });

    it("should reject protocol-relative links (// and \\)", () => {
      const p1 = classifyLinkHref("//evil.com/x", isKnownSlug);
      expect(p1.type).toBe("rejected");
      if (p1.type === "rejected") {
        expect(p1.reason).toBe("protocol-relative");
      }

      const p2 = classifyLinkHref("\\\\evil.com\\x", isKnownSlug);
      expect(p2.type).toBe("rejected");
      if (p2.type === "rejected") {
        expect(p2.reason).toBe("protocol-relative");
      }
    });

    it("should reject relative anchors, queries, and dot-relative paths", () => {
      const relatives = ["#section", "./relative", "../parent", "?query=1"];
      for (const href of relatives) {
        const res = classifyLinkHref(href, isKnownSlug);
        expect(res.type).toBe("rejected");
        if (res.type === "rejected") {
          expect(res.reason).toBe("unsupported-relative");
        }
      }
    });

    it("should reject control and zero-width characters in URL", () => {
      const hostile = "https://example.com/\u200Bmalicious";
      const res = classifyLinkHref(hostile, isKnownSlug);
      expect(res.type).toBe("rejected");
      if (res.type === "rejected") {
        expect(res.reason).toBe("invalid-characters");
      }
    });

    it("should route /knowledge to internal-list", () => {
      const res = classifyLinkHref("/knowledge", isKnownSlug);
      expect(res.type).toBe("internal-list");
      if (res.type === "internal-list") {
        expect(res.to).toBe("/knowledge");
      }
    });

    it("should route valid known slug to internal-article", () => {
      const res = classifyLinkHref("/knowledge/what-is-astrology", isKnownSlug);
      expect(res.type).toBe("internal-article");
      if (res.type === "internal-article") {
        expect(res.slug).toBe("what-is-astrology");
        expect(res.to).toBe("/knowledge/what-is-astrology");
      }
    });

    it("should reject internal link with unknown slug as broken-internal", () => {
      const res = classifyLinkHref(
        "/knowledge/non-existent-article",
        isKnownSlug,
      );
      expect(res.type).toBe("rejected");
      if (res.type === "rejected") {
        expect(res.reason).toBe("broken-internal");
      }
    });

    it("should reject non-knowledge internal paths", () => {
      const paths = [
        "/app",
        "/login",
        "/knowledge/",
        "/knowledge/what-is-astrology/",
      ];
      for (const p of paths) {
        const res = classifyLinkHref(p, isKnownSlug);
        expect(res.type).toBe("rejected");
        if (res.type === "rejected") {
          expect(res.reason).toBe("unsupported-relative");
        }
      }
    });
  });

  describe("classifyImageSrc (KB-U12, KB-AC-25)", () => {
    it("should accept valid local knowledge images", () => {
      const validImages = [
        "/knowledge/images/chart.png",
        "/knowledge/images/planets/sun.jpg",
        "/knowledge/images/signs/aries.jpeg",
        "/knowledge/images/aspects/conjunction.webp",
        "/knowledge/images/houses/house-1.avif",
      ];

      for (const src of validImages) {
        const res = classifyImageSrc(src);
        expect(res.type).toBe("local");
        if (res.type === "local") {
          expect(res.src).toBe(src);
        }
      }
    });

    it("should reject remote images and CDN URLs", () => {
      const remote = "https://cdn.example.com/image.png";
      const res = classifyImageSrc(remote);
      expect(res.type).toBe("rejected");
      if (res.type === "rejected") {
        expect(res.reason).toBe("unsupported-image-source");
      }
    });

    it("should reject directory traversal, query parameters, or hash in image src", () => {
      const badPaths = [
        "/knowledge/images/../secret.png",
        "/knowledge/images/chart.png?v=1",
        "/knowledge/images/chart.png#hash",
        "/knowledge/images//chart.png",
        "/knowledge/images/chart%20image.png",
      ];

      for (const path of badPaths) {
        const res = classifyImageSrc(path);
        expect(res.type).toBe("rejected");
        if (res.type === "rejected") {
          expect(res.reason).toBe("invalid-path");
        }
      }
    });

    it("should reject unsupported image extensions", () => {
      const unsupported = [
        "/knowledge/images/vector.svg",
        "/knowledge/images/animated.gif",
        "/knowledge/images/bitmap.bmp",
        "/knowledge/images/payload.exe",
      ];

      for (const path of unsupported) {
        const res = classifyImageSrc(path);
        expect(res.type).toBe("rejected");
        if (res.type === "rejected") {
          expect(res.reason).toBe("unsupported-image-source");
        }
      }
    });
  });

  describe("validateImageAlt (KB-U12, KB-AC-25)", () => {
    it("should accept meaningful descriptive alt text", () => {
      expect(validateImageAlt("Biểu đồ sao hoàng đạo")).toBe(true);
      expect(validateImageAlt("Sơ đồ 12 nhà chiêm tinh")).toBe(true);
    });

    it("should reject empty, undefined or short alt text", () => {
      expect(validateImageAlt(undefined)).toBe(false);
      expect(validateImageAlt("")).toBe(false);
      expect(validateImageAlt("   ")).toBe(false);
      expect(validateImageAlt("ab")).toBe(false);
    });

    it("should reject alt text longer than 200 characters", () => {
      expect(validateImageAlt("A".repeat(201))).toBe(false);
    });

    it("should reject alt text that is merely a filename", () => {
      expect(validateImageAlt("chart.png")).toBe(false);
      expect(validateImageAlt("sun-diagram.webp")).toBe(false);
      expect(validateImageAlt("IMAGE.JPG")).toBe(false);
    });
  });

  describe("normalizeHeadingLevel", () => {
    it("should normalize H1 to H2 with originalLevel 1", () => {
      expect(normalizeHeadingLevel(1)).toEqual({
        renderAs: "h2",
        originalLevel: 1,
      });
    });

    it("should preserve H2, H3, H4 levels", () => {
      expect(normalizeHeadingLevel(2)).toEqual({ renderAs: "h2" });
      expect(normalizeHeadingLevel(3)).toEqual({ renderAs: "h3" });
      expect(normalizeHeadingLevel(4)).toEqual({ renderAs: "h4" });
    });

    it("should normalize H5 and H6 to H4 with originalLevel marker", () => {
      expect(normalizeHeadingLevel(5)).toEqual({
        renderAs: "h4",
        originalLevel: 5,
      });
      expect(normalizeHeadingLevel(6)).toEqual({
        renderAs: "h4",
        originalLevel: 6,
      });
    });
  });
});
