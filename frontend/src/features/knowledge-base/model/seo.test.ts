// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  buildKnowledgeArticleSeo,
  buildKnowledgeListSeo,
  buildKnowledgeNotFoundSeo,
  KnowledgeSeoError,
  normalizeSiteUrl,
  SITE_NAME,
} from "./seo";
import type { KnowledgeArticleMetadata } from "./types";

describe("Knowledge Base SEO Helpers (KB-U18, KB-U19, KB-U28)", () => {
  const sampleArticle: KnowledgeArticleMetadata = {
    slug: "what-is-astrology",
    title: "Khái niệm nền tảng về chiêm tinh học",
    category: "fundamentals",
    summary:
      "Tổng quan về chiêm tinh học phương Tây: nguồn gốc, bốn yếu tố cấu thành bản đồ sao cá nhân và ứng dụng thực tiễn.",
    order: 1,
    updatedAt: "2026-11-19",
  };

  describe("SSR Environment Safety (KB-U28)", () => {
    it("should execute in pure Node environment without window or document globals", () => {
      expect(typeof window).toBe("undefined");
      expect(typeof document).toBe("undefined");
    });
  });

  describe("normalizeSiteUrl (KB-U19)", () => {
    it("should accept valid https and http origins and strip trailing slashes", () => {
      expect(normalizeSiteUrl("https://astroviet.com")).toBe(
        "https://astroviet.com",
      );
      expect(normalizeSiteUrl("https://astroviet.com/")).toBe(
        "https://astroviet.com",
      );
      expect(normalizeSiteUrl("http://localhost:5173")).toBe(
        "http://localhost:5173",
      );
      expect(normalizeSiteUrl("http://localhost:5173/")).toBe(
        "http://localhost:5173",
      );
      expect(normalizeSiteUrl("https://astroviet.com:8443")).toBe(
        "https://astroviet.com:8443",
      );
      expect(normalizeSiteUrl("https://astroviet.com:8443/")).toBe(
        "https://astroviet.com:8443",
      );
      expect(normalizeSiteUrl("https://sub.domain.astroviet.com/")).toBe(
        "https://sub.domain.astroviet.com",
      );
    });

    it("should reject empty or whitespace strings", () => {
      expect(() => normalizeSiteUrl("")).toThrow(KnowledgeSeoError);
      expect(() => normalizeSiteUrl("   ")).toThrow(KnowledgeSeoError);
      expect(() => normalizeSiteUrl(undefined as unknown as string)).toThrow(
        KnowledgeSeoError,
      );
    });

    it("should reject URLs containing paths", () => {
      expect(() => normalizeSiteUrl("https://astroviet.com/path")).toThrow(
        KnowledgeSeoError,
      );
      expect(() => normalizeSiteUrl("https://astroviet.com/knowledge")).toThrow(
        KnowledgeSeoError,
      );
    });

    it("should reject URLs containing query strings or hash fragments", () => {
      expect(() =>
        normalizeSiteUrl("https://astroviet.com?utm_source=test"),
      ).toThrow(KnowledgeSeoError);
      expect(() => normalizeSiteUrl("https://astroviet.com#heading")).toThrow(
        KnowledgeSeoError,
      );
    });

    it("should reject unsupported schemes (non-http/https)", () => {
      expect(() => normalizeSiteUrl("ftp://astroviet.com")).toThrow(
        KnowledgeSeoError,
      );
      expect(() => normalizeSiteUrl("file:///tmp/index.html")).toThrow(
        KnowledgeSeoError,
      );
      expect(() => normalizeSiteUrl("javascript:alert(1)")).toThrow(
        KnowledgeSeoError,
      );
      expect(() => normalizeSiteUrl("data:text/plain;base64,SGVsbG8=")).toThrow(
        KnowledgeSeoError,
      );
    });

    it("should reject URLs with credentials", () => {
      expect(() =>
        normalizeSiteUrl("https://user:password@astroviet.com"),
      ).toThrow(KnowledgeSeoError);
    });

    it("should reject malformed or protocol-relative strings", () => {
      expect(() => normalizeSiteUrl("astroviet.com")).toThrow(
        KnowledgeSeoError,
      );
      expect(() => normalizeSiteUrl("//astroviet.com")).toThrow(
        KnowledgeSeoError,
      );
      expect(() => normalizeSiteUrl("invalid-url-format")).toThrow(
        KnowledgeSeoError,
      );
    });
  });

  describe("buildKnowledgeListSeo (KB-U18, KB-U19)", () => {
    it("should build listing SEO metadata with correct titles, canonical URL, and OG", () => {
      const seo = buildKnowledgeListSeo({
        siteUrl: "https://astroviet.com/",
      });

      expect(seo.title).toBe(`Kiến thức chiêm tinh — ${SITE_NAME}`);
      expect(seo.description).toContain("chiêm tinh phương Tây");
      expect(seo.canonicalUrl).toBe("https://astroviet.com/knowledge");
      expect(seo.robots).toBeUndefined();

      expect(seo.openGraph).toEqual({
        type: "website",
        title: `Kiến thức chiêm tinh — ${SITE_NAME}`,
        description: seo.description,
        url: "https://astroviet.com/knowledge",
      });

      // Structural guarantee: no image field
      expect("image" in seo).toBe(false);
      expect("image" in seo.openGraph).toBe(false);
    });
  });

  describe("buildKnowledgeArticleSeo (KB-U18, KB-U19)", () => {
    it("should build article SEO metadata with title suffix for document, bare title for OG, and canonical URL", () => {
      const seo = buildKnowledgeArticleSeo({
        siteUrl: "https://astroviet.com",
        article: sampleArticle,
      });

      expect(seo.title).toBe(`${sampleArticle.title} — ${SITE_NAME}`);
      expect(seo.description).toBe(sampleArticle.summary);
      expect(seo.canonicalUrl).toBe(
        `https://astroviet.com/knowledge/${sampleArticle.slug}`,
      );
      expect(seo.robots).toBeUndefined();

      expect(seo.openGraph).toEqual({
        type: "article",
        title: sampleArticle.title, // bare title without suffix
        description: sampleArticle.summary,
        url: `https://astroviet.com/knowledge/${sampleArticle.slug}`,
      });

      // Structural guarantee: no image field
      expect("image" in seo).toBe(false);
      expect("image" in seo.openGraph).toBe(false);
    });
  });

  describe("buildKnowledgeNotFoundSeo (KB-U18)", () => {
    it("should build not-found SEO metadata with noindex robots and no canonical URL", () => {
      const seo = buildKnowledgeNotFoundSeo();

      expect(seo.title).toBe(`Không tìm thấy bài viết — ${SITE_NAME}`);
      expect(seo.description).toBe(
        "Bài viết bạn tìm không tồn tại hoặc đã được di chuyển.",
      );
      expect(seo.robots).toBe("noindex");
      expect(seo.canonicalUrl).toBeUndefined();

      expect(seo.openGraph).toEqual({
        type: "website",
        title: `Không tìm thấy bài viết — ${SITE_NAME}`,
        description: "Bài viết bạn tìm không tồn tại hoặc đã được di chuyển.",
      });

      // Structural guarantee: no image field
      expect("image" in seo).toBe(false);
      expect("image" in seo.openGraph).toBe(false);
    });
  });
});
