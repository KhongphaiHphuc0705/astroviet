// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  KNOWLEDGE_LIST_DESCRIPTION,
  KNOWLEDGE_LIST_TITLE,
  knowledgeContentService,
} from "@features/knowledge-base";
import { RICH_FIXTURE_ARTICLE } from "@test/fixtures/knowledge-base/articles";

import {
  buildHead,
  listPrerenderRoutes,
  render,
  verifyContentIntegrity,
} from "./entry-server";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Dedicated SSR Entry — entry-server.tsx (KB-U-ssr, D-F6-P1, D-F6.5-05)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should execute in pure Node environment with window and document undefined (Scenario 6)", () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
  });

  it("should NOT import @app/router, @app/App, registerAuthInfrastructure, or Playwright", () => {
    const source = readFileSync(join(__dirname, "entry-server.tsx"), "utf-8");
    expect(source).not.toMatch(/from\s+["']@app\/router["']/);
    expect(source).not.toMatch(/from\s+["']@app\/App["']/);
    expect(source).not.toMatch(/registerAuthInfrastructure/);
    expect(source).not.toMatch(/@playwright\/test/);
  });

  it("should pass content integrity verification and list listing + manifest routes with flat layout (D-F6.5-01)", () => {
    const integrity = verifyContentIntegrity();
    expect(integrity).toEqual({ ok: true, errors: [] });

    const routes = listPrerenderRoutes();
    expect(routes.length).toBeGreaterThanOrEqual(2);
    expect(routes[0]).toEqual({
      kind: "list",
      url: "/knowledge",
      outputPaths: ["knowledge.html", "knowledge/index.html"],
    });

    const articleRoute = routes.find(
      (r) => r.kind === "article" && r.slug === "what-is-astrology",
    );
    expect(articleRoute).toBeDefined();
    if (articleRoute && articleRoute.kind === "article") {
      expect(articleRoute.url).toBe("/knowledge/what-is-astrology");
      expect(articleRoute.outputPaths).toEqual([
        "knowledge/what-is-astrology.html",
      ]);
    }
  });

  it("should render /knowledge listing with single h1, filter group, main#main-content, and article cards (Scenario 1)", async () => {
    const { html, route } = await render("/knowledge");

    expect(route).toEqual({ kind: "list", url: "/knowledge" });
    expect(html).toContain('id="main-content"');
    expect(html).toContain("Kiến thức chiêm tinh");
    expect(html).toContain("Lọc theo chủ đề");
    expect(html).toContain("<article");

    const h1Matches = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/g) ?? [];
    expect(h1Matches).toHaveLength(1);
    expect(h1Matches[0]).toContain("Kiến thức chiêm tinh");
  });

  it("should render a valid manifest article with h1 title and body h2 headings (Scenario 2)", async () => {
    const { html, route } = await render("/knowledge/what-is-astrology");

    expect(route.kind).toBe("article");
    if (route.kind === "article") {
      expect(route.slug).toBe("what-is-astrology");
    }

    const h1Matches = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/g) ?? [];
    expect(h1Matches).toHaveLength(1);
    expect(h1Matches[0]).toContain("Chiêm tinh học là gì?");
    expect(html).toContain("<h2");
    expect(html).toContain("Khái niệm nền tảng về chiêm tinh học");
    expect(html).toContain("Lịch sử phát triển");
    expect(html).not.toContain("Đang tải nội dung bài viết");
  });

  it("should render rich headings (h2, h3, h4) and internal links <a href='/knowledge/...'> via fixture (Scenarios 3 & 4)", async () => {
    const knownMeta = new Map([
      [RICH_FIXTURE_ARTICLE.slug, RICH_FIXTURE_ARTICLE],
      [
        "sun-planet",
        {
          ...RICH_FIXTURE_ARTICLE,
          slug: "sun-planet",
          title: "Hành tinh Mặt Trời",
        },
      ],
    ]);

    vi.spyOn(knowledgeContentService, "getArticleMetadata").mockImplementation(
      (slug) => knownMeta.get(slug),
    );
    vi.spyOn(knowledgeContentService, "getArticle").mockResolvedValue({
      status: "found",
      article: RICH_FIXTURE_ARTICLE,
    });

    const { html } = await render(`/knowledge/${RICH_FIXTURE_ARTICLE.slug}`);

    expect(html).toContain("<h2");
    expect(html).toContain("Nền tảng biểu tượng");
    expect(html).toContain("<h3");
    expect(html).toContain("Bốn trụ cột chính");
    expect(html).toContain("<h4");
    expect(html).toContain("Ví dụ ký hiệu và liên kết");
    expect(html).toContain('href="/knowledge/sun-planet"');
    expect(html).toContain('href="https://example.com/astrology-reference"');
  });

  it("should build head metadata and data-prerendered tags from single seo.ts source (Scenario 5)", () => {
    const siteUrl = "https://example.org/";
    const listHead = buildHead({ kind: "list", url: "/knowledge" }, siteUrl);

    expect(listHead.seo.title).toBe(KNOWLEDGE_LIST_TITLE);
    expect(listHead.seo.description).toBe(KNOWLEDGE_LIST_DESCRIPTION);
    expect(listHead.seo.canonicalUrl).toBe("https://example.org/knowledge");
    expect(listHead.headTags).toContain('data-prerendered="1"');
    expect(listHead.headTags).toContain(
      'rel="canonical" href="https://example.org/knowledge"',
    );
    expect(listHead.headTags).not.toContain("og:image");

    const articleHead = buildHead(
      {
        kind: "article",
        url: `/knowledge/${RICH_FIXTURE_ARTICLE.slug}`,
        slug: RICH_FIXTURE_ARTICLE.slug,
        article: RICH_FIXTURE_ARTICLE,
      },
      siteUrl,
    );

    expect(articleHead.seo.title).toBe(
      `${RICH_FIXTURE_ARTICLE.title} — AstroViet`,
    );
    expect(articleHead.seo.canonicalUrl).toBe(
      `https://example.org/knowledge/${RICH_FIXTURE_ARTICLE.slug}`,
    );
    expect(articleHead.headTags).toContain(
      'property="og:type" content="article"',
    );
    expect(articleHead.headTags).toContain('data-prerendered="1"');
  });

  it("should render ArticleNotFound without throwing for unknown slugs (Scenario 7)", async () => {
    const { html, route } = await render("/knowledge/slug-khong-ton-tai");

    expect(route).toEqual({
      kind: "not-found",
      url: "/knowledge/slug-khong-ton-tai",
    });
    expect(html).toContain("Không tìm thấy bài viết");
    const h1Matches = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/g) ?? [];
    expect(h1Matches).toHaveLength(1);
  });

  it("should throw on content-error so broken articles fail prerender (Scenario 8)", async () => {
    vi.spyOn(knowledgeContentService, "getArticle").mockResolvedValueOnce({
      status: "content-error",
      slug: "what-is-astrology",
      reason: "missing-file",
    });

    await expect(render("/knowledge/what-is-astrology")).rejects.toThrow(
      /content-error \(missing-file\)/,
    );

    vi.spyOn(knowledgeContentService, "getArticle").mockResolvedValueOnce({
      status: "content-error",
      slug: "what-is-astrology",
      reason: "empty-content",
    });

    await expect(render("/knowledge/what-is-astrology")).rejects.toThrow(
      /content-error \(empty-content\)/,
    );
  });

  it("should produce byte-for-byte deterministic output with no cross-route state leakage (Scenario 9)", async () => {
    const firstList = await render("/knowledge");
    const article = await render("/knowledge/what-is-astrology");
    const secondList = await render("/knowledge");

    expect(firstList.html).toBe(secondList.html);
    expect(article.html).not.toBe(firstList.html);

    // Trailing slash normalizes identically to canonical route
    const listWithTrailingSlash = await render("/knowledge/");
    expect(listWithTrailingSlash.html).toBe(firstList.html);
    expect(listWithTrailingSlash.route).toEqual({
      kind: "list",
      url: "/knowledge",
    });
  });
});
