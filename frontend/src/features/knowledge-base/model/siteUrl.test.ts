// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  buildKnowledgeArticlePageMeta,
  buildKnowledgeListPageMeta,
  DEFAULT_DEV_SITE_URL,
  resolveSiteUrl,
  resolveSiteUrlDetailed,
} from "./siteUrl";
import type { KnowledgeArticleMetadata } from "./types";

const sampleArticle: KnowledgeArticleMetadata = {
  slug: "what-is-astrology",
  title: "Chiêm tinh học là gì?",
  category: "fundamentals",
  summary: "Tổng quan về chiêm tinh học phương Tây.",
  order: 1,
  updatedAt: "2026-11-19",
};

describe("resolveSiteUrl & page meta adapters (KB-U51, D-F6.4-01, AC-F6.4-A06)", () => {
  it("should normalize valid site URLs and strip trailing slashes in both dev and production", () => {
    expect(resolveSiteUrl("https://astroviet.com/", { isDev: false })).toBe(
      "https://astroviet.com",
    );
    expect(resolveSiteUrl("  https://astroviet.com  ", { isDev: false })).toBe(
      "https://astroviet.com",
    );
    expect(resolveSiteUrl("http://localhost:5173/", { isDev: true })).toBe(
      "http://localhost:5173",
    );
  });

  it("should fall back to localhost in dev when VITE_SITE_URL is missing or empty", () => {
    expect(resolveSiteUrl(undefined, { isDev: true })).toBe(
      DEFAULT_DEV_SITE_URL,
    );
    expect(resolveSiteUrl("", { isDev: true })).toBe(DEFAULT_DEV_SITE_URL);
    expect(resolveSiteUrl("   ", { isDev: true })).toBe(DEFAULT_DEV_SITE_URL);
  });

  it("should return undefined without guessing a domain in production when VITE_SITE_URL is missing", () => {
    expect(resolveSiteUrl(undefined, { isDev: false })).toBeUndefined();
    expect(resolveSiteUrl("", { isDev: false })).toBeUndefined();
    expect(resolveSiteUrlDetailed(undefined, { isDev: false })).toEqual({
      siteUrl: undefined,
    });
  });

  it("should reject malformed URLs, sub-paths, query strings, hashes, and unsupported schemes", () => {
    const invalidInputs = [
      "not-a-url",
      "astroviet.com",
      "https://astroviet.com/subpath",
      "https://astroviet.com?foo=bar",
      "https://astroviet.com#hash",
      "ftp://astroviet.com",
      "javascript:alert(1)",
    ];

    for (const raw of invalidInputs) {
      expect(resolveSiteUrl(raw, { isDev: true })).toBeUndefined();
      expect(resolveSiteUrl(raw, { isDev: false })).toBeUndefined();

      const detailed = resolveSiteUrlDetailed(raw, { isDev: false });
      expect(detailed.siteUrl).toBeUndefined();
      expect(detailed.invalidError).toBeInstanceOf(Error);
    }
  });

  it("should include canonical and og:url when siteUrl is defined and omit them when undefined (without og:image)", () => {
    const listWithUrl = buildKnowledgeListPageMeta("https://astroviet.com/");
    expect(listWithUrl.canonicalUrl).toBe("https://astroviet.com/knowledge");
    expect(listWithUrl.openGraph.url).toBe("https://astroviet.com/knowledge");
    expect("image" in listWithUrl.openGraph).toBe(false);

    const listWithoutUrl = buildKnowledgeListPageMeta(undefined);
    expect(listWithoutUrl.title).toBe("Kiến thức chiêm tinh — AstroViet");
    expect(listWithoutUrl.canonicalUrl).toBeUndefined();
    expect(listWithoutUrl.openGraph.url).toBeUndefined();

    const articleWithUrl = buildKnowledgeArticlePageMeta(
      sampleArticle,
      "https://astroviet.com/",
    );
    expect(articleWithUrl.canonicalUrl).toBe(
      "https://astroviet.com/knowledge/what-is-astrology",
    );
    expect(articleWithUrl.openGraph.type).toBe("article");
    expect(articleWithUrl.openGraph.url).toBe(
      "https://astroviet.com/knowledge/what-is-astrology",
    );

    const articleWithoutUrl = buildKnowledgeArticlePageMeta(
      sampleArticle,
      undefined,
    );
    expect(articleWithoutUrl.title).toBe("Chiêm tinh học là gì? — AstroViet");
    expect(articleWithoutUrl.description).toBe(sampleArticle.summary);
    expect(articleWithoutUrl.canonicalUrl).toBeUndefined();
    expect(articleWithoutUrl.openGraph.url).toBeUndefined();
  });
});
