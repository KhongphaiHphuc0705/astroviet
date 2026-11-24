// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  buildKnowledgeArticleSeo,
  buildKnowledgeListSeo,
  buildKnowledgeNotFoundSeo,
  buildRobotsTxt,
  buildSitemapXml,
  escapeHtml,
  KnowledgeSeoError,
  normalizeSiteUrl,
  serializeHeadTags,
  SITE_NAME,
} from "./seo";
import type { KnowledgeArticleMetadata } from "./types";

describe("Knowledge Base SEO Helpers (KB-U18, KB-U19, KB-U20, KB-U21, KB-U28)", () => {
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

    it("should omit canonicalUrl and openGraph.url when siteUrl is undefined", () => {
      const seo = buildKnowledgeListSeo({ siteUrl: undefined });

      expect(seo.title).toBe(`Kiến thức chiêm tinh — ${SITE_NAME}`);
      expect(seo.description).toContain("chiêm tinh phương Tây");
      expect(seo.canonicalUrl).toBeUndefined();
      expect(seo.openGraph.url).toBeUndefined();
      expect("canonicalUrl" in seo).toBe(false);
      expect("url" in seo.openGraph).toBe(false);
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

    it("should omit canonicalUrl and openGraph.url when siteUrl is undefined", () => {
      const seo = buildKnowledgeArticleSeo({
        article: sampleArticle,
        siteUrl: undefined,
      });

      expect(seo.title).toBe(`${sampleArticle.title} — ${SITE_NAME}`);
      expect(seo.description).toBe(sampleArticle.summary);
      expect(seo.canonicalUrl).toBeUndefined();
      expect(seo.openGraph).toEqual({
        type: "article",
        title: sampleArticle.title,
        description: sampleArticle.summary,
      });
      expect("canonicalUrl" in seo).toBe(false);
      expect("url" in seo.openGraph).toBe(false);
    });

    it("should keep throwing KnowledgeSeoError when siteUrl is an empty or malformed string", () => {
      expect(() =>
        buildKnowledgeArticleSeo({ article: sampleArticle, siteUrl: "" }),
      ).toThrow(KnowledgeSeoError);
      expect(() => buildKnowledgeListSeo({ siteUrl: "not-a-url" })).toThrow(
        KnowledgeSeoError,
      );
    });

    it("should reject encoded or invalid article slugs so canonical URLs stay clean (KB-U19)", () => {
      const invalidSlugs = [
        "what%20is%20astrology",
        "planets/sun",
        "../secret",
        "Bad_Slug",
      ];
      for (const slug of invalidSlugs) {
        expect(() =>
          buildKnowledgeArticleSeo({
            siteUrl: "https://astroviet.com",
            article: { ...sampleArticle, slug },
          }),
        ).toThrow(KnowledgeSeoError);
      }
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

  describe("serializeHeadTags & escapeHtml (KB-U18, D-F6-D1, D-F6.5-06)", () => {
    it("should serialize listing and article SEO tags without og:image or duplicate tags", () => {
      const articleSeo = buildKnowledgeArticleSeo({
        siteUrl: "https://astroviet.com/",
        article: sampleArticle,
      });

      const html = serializeHeadTags(articleSeo);
      expect(html).toContain(
        `<meta name="description" content="${sampleArticle.summary}" />`,
      );
      expect(html).toContain(
        `<link rel="canonical" href="https://astroviet.com/knowledge/${sampleArticle.slug}" />`,
      );
      expect(html).toContain(
        `<meta property="og:title" content="${sampleArticle.title}" />`,
      );
      expect(html).toContain(
        `<meta property="og:description" content="${sampleArticle.summary}" />`,
      );
      expect(html).toContain('<meta property="og:type" content="article" />');
      expect(html).toContain(
        `<meta property="og:url" content="https://astroviet.com/knowledge/${sampleArticle.slug}" />`,
      );

      // No og:image, no robots on valid article, no duplicate tags
      expect(html).not.toContain("og:image");
      expect(html).not.toContain("twitter:");
      expect(html).not.toContain('name="robots"');
      expect(html.match(/name="description"/g)).toHaveLength(1);
      expect(html.match(/rel="canonical"/g)).toHaveLength(1);
      expect(html.match(/property="og:title"/g)).toHaveLength(1);
    });

    it("should escape &, <, >, quotes, and apostrophes safely in head attributes", () => {
      const specialArticle: KnowledgeArticleMetadata = {
        ...sampleArticle,
        title: `Mặt Trời & "Mặt Trăng" <101> 'Cơ bản'`,
        summary: `Tóm tắt với ký tự <script> & "nháy kép" 'nháy đơn'.`,
      };
      const seo = buildKnowledgeArticleSeo({
        siteUrl: "https://astroviet.com",
        article: specialArticle,
      });

      const html = serializeHeadTags(seo);
      expect(html).toContain(
        'property="og:title" content="Mặt Trời &amp; &quot;Mặt Trăng&quot; &lt;101&gt; &#39;Cơ bản&#39;"',
      );
      expect(html).toContain(
        'name="description" content="Tóm tắt với ký tự &lt;script&gt; &amp; &quot;nháy kép&quot; &#39;nháy đơn&#39;."',
      );
      expect(html).not.toContain("<script>");
      expect(escapeHtml(`A & B < C > "D" 'E'`)).toBe(
        "A &amp; B &lt; C &gt; &quot;D&quot; &#39;E&#39;",
      );
    });

    it("should attach data-prerendered marker when marker option is true and serialize robots for not-found", () => {
      const notFoundSeo = buildKnowledgeNotFoundSeo();
      const html = serializeHeadTags(notFoundSeo, { marker: true });

      const lines = html.split("\n");
      expect(lines.length).toBe(5); // description, robots, og:title, og:description, og:type
      for (const line of lines) {
        expect(line).toContain('data-prerendered="1"');
      }
      expect(html).toContain(
        '<meta name="robots" content="noindex" data-prerendered="1" />',
      );
      expect(html).not.toContain('rel="canonical"');
      expect(html).not.toContain('property="og:url"');
    });

    it("should throw KnowledgeSeoError when title or description is empty", () => {
      const base = buildKnowledgeListSeo({ siteUrl: "https://astroviet.com" });
      expect(() => serializeHeadTags({ ...base, title: "   " })).toThrow(
        KnowledgeSeoError,
      );
      expect(() => serializeHeadTags({ ...base, description: "" })).toThrow(
        KnowledgeSeoError,
      );
    });
  });

  describe("buildSitemapXml (KB-U20, D-F6-S1)", () => {
    const articles: KnowledgeArticleMetadata[] = [
      {
        slug: "sun-in-astrology",
        title: "Mặt Trời trong chiêm tinh",
        category: "planets",
        summary: "Vai trò của Mặt Trời.",
        order: 1,
        updatedAt: "2026-11-22",
      },
      sampleArticle,
    ];

    it("should emit /knowledge first and all manifest articles in deterministic order without home /", () => {
      const xml = buildSitemapXml({
        siteUrl: "https://astroviet.com/",
        articles,
      });

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      );

      const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      expect(locs).toEqual([
        "https://astroviet.com/knowledge",
        "https://astroviet.com/knowledge/what-is-astrology",
        "https://astroviet.com/knowledge/sun-in-astrology",
      ]);

      // Does not include root home URL
      expect(locs).not.toContain("https://astroviet.com/");
      expect(locs).not.toContain("https://astroviet.com");

      // Listing lastmod equals latest article updatedAt (2026-11-22)
      const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
        (m) => m[1],
      );
      expect(lastmods).toEqual(["2026-11-22", "2026-11-19", "2026-11-22"]);
    });

    it("should emit only /knowledge without lastmod when articles list is empty", () => {
      const xml = buildSitemapXml({
        siteUrl: "https://astroviet.com",
        articles: [],
      });

      const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      expect(locs).toEqual(["https://astroviet.com/knowledge"]);
      expect(xml).not.toContain("<lastmod>");
    });

    it("should reject duplicate slugs, invalid slugs, and invalid siteUrl", () => {
      expect(() =>
        buildSitemapXml({
          siteUrl: "https://astroviet.com",
          articles: [sampleArticle, sampleArticle],
        }),
      ).toThrow(KnowledgeSeoError);

      expect(() =>
        buildSitemapXml({
          siteUrl: "https://astroviet.com",
          articles: [{ ...sampleArticle, slug: "bad%20slug" }],
        }),
      ).toThrow(KnowledgeSeoError);

      expect(() =>
        buildSitemapXml({
          siteUrl: "invalid-url",
          articles: [sampleArticle],
        }),
      ).toThrow(KnowledgeSeoError);
    });
  });

  describe("buildRobotsTxt (KB-U21, D-F6-S1)", () => {
    it("should generate approved robots.txt with normalized Sitemap URL and no placeholders", () => {
      const robots = buildRobotsTxt({ siteUrl: "https://astroviet.com/" });

      expect(robots).toBe(
        [
          "User-agent: *",
          "Disallow: /app/",
          "",
          "Sitemap: https://astroviet.com/sitemap.xml",
          "",
        ].join("\n"),
      );
      expect(robots).not.toContain("<production-domain>");
      expect(robots).not.toContain("//sitemap.xml");
    });

    it("should reject invalid siteUrl", () => {
      expect(() => buildRobotsTxt({ siteUrl: "" })).toThrow(KnowledgeSeoError);
      expect(() =>
        buildRobotsTxt({ siteUrl: "https://astroviet.com/path" }),
      ).toThrow(KnowledgeSeoError);
    });
  });
});
