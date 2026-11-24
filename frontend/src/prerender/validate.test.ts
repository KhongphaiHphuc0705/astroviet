// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  buildKnowledgeArticleSeo,
  buildKnowledgeListSeo,
  buildRobotsTxt,
  buildSitemapXml,
  serializeHeadTags,
  type KnowledgeArticleMetadata,
} from "@features/knowledge-base";

import { PRERENDER_VERSION } from "./marker";
import {
  injectIntoTemplate,
  MIN_ARTICLE_TEXT_LENGTH,
  validatePrerenderOutput,
  type PrerenderValidationInput,
} from "./validate";

const TEMPLATE_HTML = `<!doctype html>
<html lang="vi">
  <head>
    <script>/* theme-init */</script>
    <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/inter/inter-regular.woff2" />
    <meta charset="UTF-8" />
    <title>AstroViet</title>
    <script type="module" crossorigin src="/assets/index-abc123.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-def456.css">
  </head>
  <body>
    <div id="root"></div>
    <div id="modal-root"></div>
  </body>
</html>`;

const SAMPLE_ARTICLES: readonly KnowledgeArticleMetadata[] = [
  {
    slug: "what-is-astrology",
    title: "Chiêm tinh học là gì?",
    category: "fundamentals",
    summary:
      "Khái niệm tổng quan về chiêm tinh học phương Tây, lịch sử phát triển và góc nhìn hiện đại về bản đồ sao cá nhân.",
    order: 1,
    updatedAt: "2026-11-19",
  },
  {
    slug: "sun-in-astrology",
    title: "Mặt Trời trong bản đồ sao",
    category: "planets",
    summary: "Ý nghĩa biểu tượng và vai trò cốt lõi của Mặt Trời.",
    order: 1,
    updatedAt: "2026-11-22",
  },
];

const LONG_ARTICLE_PARAGRAPH =
  "Chiêm tinh học phương Tây là hệ thống kiến thức cổ xưa nghiên cứu mối tương quan mang tính biểu tượng giữa vị trí, chuyển động của các thiên thể và đời sống con người trên Trái Đất. Trọng tâm của chiêm tinh học là bản đồ sao cá nhân tại thời điểm và địa điểm sinh ra.";

function buildValidFixture(options?: {
  siteUrl?: string;
  strict?: boolean;
  articles?: readonly KnowledgeArticleMetadata[];
}): PrerenderValidationInput {
  const siteUrl = options?.siteUrl ?? "https://astroviet.vn";
  const strict = options?.strict ?? true;
  const articles = options?.articles ?? SAMPLE_ARTICLES;

  const listSeo = buildKnowledgeListSeo({ siteUrl });
  const listHtml = injectIntoTemplate({
    templateHtml: TEMPLATE_HTML,
    appHtml: `<main id="main-content"><h1>Kiến thức chiêm tinh</h1><p>Mô tả</p></main>`,
    routePath: "/knowledge",
    seo: listSeo,
    headTags: serializeHeadTags(listSeo, { marker: true }),
  });

  const htmlFiles: Record<string, string> = {
    "knowledge.html": listHtml,
    "knowledge/index.html": listHtml,
  };

  for (const article of articles) {
    const seo = buildKnowledgeArticleSeo({ siteUrl, article });
    htmlFiles[`knowledge/${article.slug}.html`] = injectIntoTemplate({
      templateHtml: TEMPLATE_HTML,
      appHtml: `<main id="main-content"><article><h1>${article.title}</h1><h2>Nội dung</h2><p>${LONG_ARTICLE_PARAGRAPH}</p></article></main>`,
      routePath: `/knowledge/${article.slug}`,
      seo,
      headTags: serializeHeadTags(seo, { marker: true }),
    });
  }

  return {
    siteUrl,
    strict,
    articles,
    htmlFiles,
    sitemapXml: buildSitemapXml({ siteUrl, articles }),
    robotsTxt: buildRobotsTxt({ siteUrl }),
    allKnowledgeFiles: Object.keys(htmlFiles),
  };
}

describe("injectIntoTemplate (D-F6-P2, D-F6.5-06)", () => {
  it("should inject title, data-base-title, head tags, and #root prerender markers while preserving template assets", () => {
    const seo = buildKnowledgeArticleSeo({
      siteUrl: "https://example.org",
      article: SAMPLE_ARTICLES[0]!,
    });
    const out = injectIntoTemplate({
      templateHtml: TEMPLATE_HTML,
      appHtml: `<main id="main-content"><p>Giá trị đặc biệt $& và $1 và $$ giữ nguyên</p></main>`,
      routePath: "/knowledge/what-is-astrology",
      seo,
      headTags: serializeHeadTags(seo, { marker: true }),
    });

    expect(out).toContain(
      '<title data-base-title="AstroViet">Chiêm tinh học là gì? — AstroViet</title>',
    );
    expect(out).toContain("/* theme-init */");
    expect(out).toContain("/fonts/inter/inter-regular.woff2");
    expect(out).toContain("/assets/index-abc123.js");
    expect(out).toContain('<div id="modal-root"></div>');
    expect(out).toContain(
      `<div id="root" data-prerendered="1" data-prerender-route="/knowledge/what-is-astrology" data-prerender-version="${PRERENDER_VERSION}">`,
    );
    expect(out).toContain("Giá trị đặc biệt $& và $1 và $$ giữ nguyên");
  });

  it("should fail loudly when required template anchors are missing", () => {
    const seo = buildKnowledgeListSeo({ siteUrl: "https://example.org" });
    const headTags = serializeHeadTags(seo, { marker: true });

    expect(() =>
      injectIntoTemplate({
        templateHtml:
          '<html><head></head><body><div id="root"></div></body></html>',
        appHtml: "<main></main>",
        routePath: "/knowledge",
        seo,
        headTags,
      }),
    ).toThrow(/<title>/);

    expect(() =>
      injectIntoTemplate({
        templateHtml:
          '<html><head><title>AstroViet</title><body><div id="root"></div></body></html>',
        appHtml: "<main></main>",
        routePath: "/knowledge",
        seo,
        headTags,
      }),
    ).toThrow(/<\/head>/);

    expect(() =>
      injectIntoTemplate({
        templateHtml:
          "<html><head><title>AstroViet</title></head><body></body></html>",
        appHtml: "<main></main>",
        routePath: "/knowledge",
        seo,
        headTags,
      }),
    ).toThrow(/id="root"/);
  });
});

describe("validatePrerenderOutput (KB-P01..KB-P11)", () => {
  it("should pass all KB-P01..KB-P11 checks on valid strict production fixture", () => {
    const fixture = buildValidFixture({ strict: true });
    const result = validatePrerenderOutput(fixture);

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.checks).toHaveLength(11);
    for (const check of result.checks) {
      expect(check.status, `Expected ${check.id} to pass`).toBe("pass");
    }
  });

  it("should pass all KB-P01..KB-P11 checks on valid non-strict localhost fixture", () => {
    const fixture = buildValidFixture({
      siteUrl: "http://localhost:5173",
      strict: false,
    });
    const result = validatePrerenderOutput(fixture);

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("KB-P01: should fail when <title> is missing or duplicated across distinct routes", () => {
    const fixture = buildValidFixture();
    const brokenFiles = {
      ...fixture.htmlFiles,
      "knowledge/what-is-astrology.html": fixture.htmlFiles[
        "knowledge/what-is-astrology.html"
      ]!.replace(/<title[^>]*>[^<]*<\/title>/, ""),
    };

    const res = validatePrerenderOutput({ ...fixture, htmlFiles: brokenFiles });
    expect(res.ok).toBe(false);
    expect(res.checks.find((c) => c.id === "KB-P01")?.status).toBe("fail");

    // Duplicate title across two articles
    const duplicateTitleArticles: KnowledgeArticleMetadata[] = [
      SAMPLE_ARTICLES[0]!,
      { ...SAMPLE_ARTICLES[1]!, title: SAMPLE_ARTICLES[0]!.title },
    ];
    const dupFixture = buildValidFixture({ articles: duplicateTitleArticles });
    const dupRes = validatePrerenderOutput(dupFixture);
    expect(dupRes.ok).toBe(false);
    expect(dupRes.checks.find((c) => c.id === "KB-P01")?.status).toBe("fail");
  });

  it("KB-P02: should fail when meta description is missing or mismatched", () => {
    const fixture = buildValidFixture();
    const brokenFiles = {
      ...fixture.htmlFiles,
      "knowledge.html": fixture.htmlFiles["knowledge.html"]!.replace(
        /<meta name="description"[^>]*\/>/,
        "",
      ),
    };
    const res = validatePrerenderOutput({ ...fixture, htmlFiles: brokenFiles });
    expect(res.checks.find((c) => c.id === "KB-P02")?.status).toBe("fail");
  });

  it("KB-P03: should fail when canonical has trailing slash or wrong host", () => {
    const fixture = buildValidFixture();
    const brokenFiles = {
      ...fixture.htmlFiles,
      "knowledge/what-is-astrology.html": fixture.htmlFiles[
        "knowledge/what-is-astrology.html"
      ]!.replace(
        'href="https://astroviet.vn/knowledge/what-is-astrology"',
        'href="https://astroviet.vn/knowledge/what-is-astrology/"',
      ),
    };
    const res = validatePrerenderOutput({ ...fixture, htmlFiles: brokenFiles });
    expect(res.checks.find((c) => c.id === "KB-P03")?.status).toBe("fail");
  });

  it("KB-P04: should fail when og:image is present or OG tags are duplicated", () => {
    const fixture = buildValidFixture();
    const brokenFiles = {
      ...fixture.htmlFiles,
      "knowledge/what-is-astrology.html": fixture.htmlFiles[
        "knowledge/what-is-astrology.html"
      ]!.replace(
        "</head>",
        '<meta property="og:image" content="https://astroviet.vn/fake.png" /></head>',
      ),
    };
    const res = validatePrerenderOutput({ ...fixture, htmlFiles: brokenFiles });
    expect(res.checks.find((c) => c.id === "KB-P04")?.status).toBe("fail");
  });

  it("KB-P05: should fail when sitemap includes root /, duplicates a URL, or misses an article", () => {
    const fixture = buildValidFixture();
    const withHome = fixture.sitemapXml.replace(
      "</urlset>",
      "  <url><loc>https://astroviet.vn/</loc></url>\n</urlset>",
    );
    const resHome = validatePrerenderOutput({
      ...fixture,
      sitemapXml: withHome,
    });
    expect(resHome.checks.find((c) => c.id === "KB-P05")?.status).toBe("fail");

    const missingArticle = buildSitemapXml({
      siteUrl: fixture.siteUrl,
      articles: [SAMPLE_ARTICLES[0]!],
    });
    const resMissing = validatePrerenderOutput({
      ...fixture,
      sitemapXml: missingArticle,
    });
    expect(resMissing.checks.find((c) => c.id === "KB-P05")?.status).toBe(
      "fail",
    );
  });

  it("KB-P06: should fail when robots.txt diverges or contains placeholder domain", () => {
    const fixture = buildValidFixture();
    const res = validatePrerenderOutput({
      ...fixture,
      robotsTxt:
        "User-agent: *\nDisallow: /app/\n\nSitemap: https://<production-domain>/sitemap.xml\n",
    });
    expect(res.checks.find((c) => c.id === "KB-P06")?.status).toBe("fail");
    expect(res.checks.find((c) => c.id === "KB-P08")?.status).toBe("fail");
  });

  it("KB-P07: should fail when h1 count !== 1 or article body text is shorter than minimum threshold", () => {
    const fixture = buildValidFixture();
    const shortArticle = fixture.htmlFiles[
      "knowledge/what-is-astrology.html"
    ]!.replace(LONG_ARTICLE_PARAGRAPH, "Quá ngắn.");
    expect("Quá ngắn.".length).toBeLessThan(MIN_ARTICLE_TEXT_LENGTH);

    const resShort = validatePrerenderOutput({
      ...fixture,
      htmlFiles: {
        ...fixture.htmlFiles,
        "knowledge/what-is-astrology.html": shortArticle,
      },
    });
    expect(resShort.checks.find((c) => c.id === "KB-P07")?.status).toBe("fail");

    const twoH1s = fixture.htmlFiles["knowledge.html"]!.replace(
      "</h1>",
      "</h1><h1>Extra</h1>",
    );
    const resTwoH1 = validatePrerenderOutput({
      ...fixture,
      htmlFiles: { ...fixture.htmlFiles, "knowledge.html": twoH1s },
    });
    expect(resTwoH1.checks.find((c) => c.id === "KB-P07")?.status).toBe("fail");
  });

  it("KB-P09: should fail when knowledge.html or knowledge/index.html is missing, stale file exists, or nested <slug>/index.html exists", () => {
    const fixture = buildValidFixture();
    const { "knowledge/index.html": _omitted, ...withoutSubdir } =
      fixture.htmlFiles;
    void _omitted;
    const resMissing = validatePrerenderOutput({
      ...fixture,
      htmlFiles: withoutSubdir,
      allKnowledgeFiles: Object.keys(withoutSubdir),
    });
    expect(resMissing.checks.find((c) => c.id === "KB-P09")?.status).toBe(
      "fail",
    );

    const resNested = validatePrerenderOutput({
      ...fixture,
      allKnowledgeFiles: [
        ...(fixture.allKnowledgeFiles ?? []),
        "knowledge/what-is-astrology/index.html",
      ],
    });
    expect(resNested.checks.find((c) => c.id === "KB-P09")?.status).toBe(
      "fail",
    );
    expect(resNested.checks.find((c) => c.id === "KB-P09")?.message).toContain(
      "Forbidden nested",
    );

    const resStale = validatePrerenderOutput({
      ...fixture,
      allKnowledgeFiles: [
        ...(fixture.allKnowledgeFiles ?? []),
        "knowledge/old-removed-article.html",
      ],
    });
    expect(resStale.checks.find((c) => c.id === "KB-P09")?.status).toBe("fail");
  });

  it("KB-P10: should fail when #root prerender route or version marker is wrong", () => {
    const fixture = buildValidFixture();
    const wrongVersion = fixture.htmlFiles["knowledge.html"]!.replace(
      `data-prerender-version="${PRERENDER_VERSION}"`,
      'data-prerender-version="999"',
    );
    const res = validatePrerenderOutput({
      ...fixture,
      htmlFiles: { ...fixture.htmlFiles, "knowledge.html": wrongVersion },
    });
    expect(res.checks.find((c) => c.id === "KB-P10")?.status).toBe("fail");
  });

  it("KB-P11: should fail in strict mode on localhost, http://, RFC 2606/6761 reserved domains, or empty manifest", () => {
    const localStrict = buildValidFixture({
      siteUrl: "http://localhost:5173",
      strict: true,
    });
    const resLocal = validatePrerenderOutput(localStrict);
    expect(resLocal.checks.find((c) => c.id === "KB-P11")?.status).toBe("fail");

    for (const reservedUrl of [
      "https://astroviet.example",
      "https://astroviet.test",
      "https://astroviet.invalid",
      "https://example.com",
      "https://example.org",
      "https://example.net",
    ]) {
      const reservedStrict = buildValidFixture({
        siteUrl: reservedUrl,
        strict: true,
      });
      const resReserved = validatePrerenderOutput(reservedStrict);
      expect(
        resReserved.checks.find((c) => c.id === "KB-P11")?.status,
        `Expected KB-P11 fail for ${reservedUrl}`,
      ).toBe("fail");
      expect(
        resReserved.checks.find((c) => c.id === "KB-P08")?.status,
        `Expected KB-P08 fail for ${reservedUrl}`,
      ).toBe("fail");
    }

    const emptyStrict = buildValidFixture({
      siteUrl: "https://astroviet.vn",
      strict: true,
      articles: [],
    });
    const resEmpty = validatePrerenderOutput(emptyStrict);
    expect(resEmpty.checks.find((c) => c.id === "KB-P11")?.status).toBe("fail");

    // Same empty manifest is allowed in non-strict mode
    const emptyNonStrict = buildValidFixture({
      siteUrl: "http://localhost:5173",
      strict: false,
      articles: [],
    });
    const resEmptyNonStrict = validatePrerenderOutput(emptyNonStrict);
    expect(resEmptyNonStrict.ok).toBe(true);
  });
});
