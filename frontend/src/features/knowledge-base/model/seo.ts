import { SLUG_PATTERN, type KnowledgeArticleMetadata } from "./types";
import { compareManifestEntries } from "./validateManifest";

export const SITE_NAME = "AstroViet";

export const KNOWLEDGE_LIST_TITLE = `Kiến thức chiêm tinh — ${SITE_NAME}`;
export const KNOWLEDGE_LIST_DESCRIPTION =
  "Các bài viết giải thích khái niệm chiêm tinh phương Tây: hành tinh, cung, nhà và góc chiếu.";

export const KNOWLEDGE_NOT_FOUND_TITLE = `Không tìm thấy bài viết — ${SITE_NAME}`;
export const KNOWLEDGE_NOT_FOUND_DESCRIPTION =
  "Bài viết bạn tìm không tồn tại hoặc đã được di chuyển.";

export interface KnowledgeSeo {
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl?: string;
  readonly robots?: "noindex";
  readonly openGraph: {
    readonly type: "website" | "article";
    readonly title: string;
    readonly description: string;
    readonly url?: string;
  };
}

export class KnowledgeSeoError extends Error {
  readonly code: string;

  constructor(message: string, code = "INVALID_SITE_URL") {
    super(message);
    this.name = "KnowledgeSeoError";
    this.code = code;
  }
}

export function normalizeSiteUrl(raw: string): string {
  if (!raw || typeof raw !== "string" || raw.trim().length === 0) {
    throw new KnowledgeSeoError(
      "Site URL must be a non-empty string",
      "EMPTY_SITE_URL",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch (err) {
    throw new KnowledgeSeoError(
      `Invalid site URL format: ${String(err)}`,
      "MALFORMED_URL",
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new KnowledgeSeoError(
      `Unsupported site URL protocol: ${parsed.protocol}`,
      "UNSUPPORTED_SCHEME",
    );
  }

  if (parsed.username || parsed.password) {
    throw new KnowledgeSeoError(
      "Site URL must not contain credentials",
      "CONTAINS_CREDENTIALS",
    );
  }

  if (parsed.search) {
    throw new KnowledgeSeoError(
      "Site URL must not contain query parameters",
      "CONTAINS_QUERY",
    );
  }

  if (parsed.hash) {
    throw new KnowledgeSeoError(
      "Site URL must not contain a hash fragment",
      "CONTAINS_HASH",
    );
  }

  if (parsed.pathname !== "" && parsed.pathname !== "/") {
    throw new KnowledgeSeoError(
      "Site URL must not contain a sub-path",
      "CONTAINS_PATH",
    );
  }

  return parsed.origin;
}

export interface BuildKnowledgeListSeoInput {
  readonly siteUrl?: string;
}

export function buildKnowledgeListSeo(
  input: BuildKnowledgeListSeoInput = {},
): KnowledgeSeo {
  const canonicalUrl =
    input.siteUrl !== undefined
      ? `${normalizeSiteUrl(input.siteUrl)}/knowledge`
      : undefined;

  return {
    title: KNOWLEDGE_LIST_TITLE,
    description: KNOWLEDGE_LIST_DESCRIPTION,
    ...(canonicalUrl !== undefined ? { canonicalUrl } : {}),
    openGraph: {
      type: "website",
      title: KNOWLEDGE_LIST_TITLE,
      description: KNOWLEDGE_LIST_DESCRIPTION,
      ...(canonicalUrl !== undefined ? { url: canonicalUrl } : {}),
    },
  };
}

export interface BuildKnowledgeArticleSeoInput {
  readonly siteUrl?: string;
  readonly article: KnowledgeArticleMetadata;
}

export function buildKnowledgeArticleSeo(
  input: BuildKnowledgeArticleSeoInput,
): KnowledgeSeo {
  if (!SLUG_PATTERN.test(input.article.slug)) {
    throw new KnowledgeSeoError(
      `Invalid article slug for canonical URL: "${input.article.slug}"`,
      "INVALID_SLUG",
    );
  }

  const canonicalUrl =
    input.siteUrl !== undefined
      ? `${normalizeSiteUrl(input.siteUrl)}/knowledge/${input.article.slug}`
      : undefined;

  return {
    title: `${input.article.title} — ${SITE_NAME}`,
    description: input.article.summary,
    ...(canonicalUrl !== undefined ? { canonicalUrl } : {}),
    openGraph: {
      type: "article",
      title: input.article.title,
      description: input.article.summary,
      ...(canonicalUrl !== undefined ? { url: canonicalUrl } : {}),
    },
  };
}

export function buildKnowledgeNotFoundSeo(): KnowledgeSeo {
  return {
    title: KNOWLEDGE_NOT_FOUND_TITLE,
    description: KNOWLEDGE_NOT_FOUND_DESCRIPTION,
    robots: "noindex",
    openGraph: {
      type: "website",
      title: KNOWLEDGE_NOT_FOUND_TITLE,
      description: KNOWLEDGE_NOT_FOUND_DESCRIPTION,
    },
  };
}

/**
 * Escapes HTML special characters for safe attribute and text node serialization.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escapes XML special characters for sitemap generation.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface SerializeHeadTagsOptions {
  /** When true, stamps `data-prerendered="1"` so client `usePageMeta` owns and cleans up prerendered tags (D-F6.5-06). */
  readonly marker?: boolean;
}

/**
 * Serializes meta, canonical, robots, and Open Graph tags from a `KnowledgeSeo` object.
 *
 * Guarantees:
 * - All attribute values are HTML-escaped (`& < > " '`).
 * - Never emits `og:image`, `twitter:*`, or JSON-LD (D-F6-D1).
 * - Rejects empty title or description instead of fabricating fallback copy.
 */
export function serializeHeadTags(
  seo: KnowledgeSeo,
  options?: SerializeHeadTagsOptions,
): string {
  if (seo.title.trim().length === 0) {
    throw new KnowledgeSeoError(
      "SEO title must be a non-empty string",
      "EMPTY_TITLE",
    );
  }
  if (seo.description.trim().length === 0) {
    throw new KnowledgeSeoError(
      "SEO description must be a non-empty string",
      "EMPTY_DESCRIPTION",
    );
  }

  const markerAttr = options?.marker ? ' data-prerendered="1"' : "";
  const tags: string[] = [
    `<meta name="description" content="${escapeHtml(seo.description)}"${markerAttr} />`,
  ];

  if (seo.robots) {
    tags.push(
      `<meta name="robots" content="${escapeHtml(seo.robots)}"${markerAttr} />`,
    );
  }

  if (seo.canonicalUrl) {
    tags.push(
      `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}"${markerAttr} />`,
    );
  }

  tags.push(
    `<meta property="og:title" content="${escapeHtml(seo.openGraph.title)}"${markerAttr} />`,
    `<meta property="og:description" content="${escapeHtml(seo.openGraph.description)}"${markerAttr} />`,
    `<meta property="og:type" content="${escapeHtml(seo.openGraph.type)}"${markerAttr} />`,
  );

  if (seo.openGraph.url) {
    tags.push(
      `<meta property="og:url" content="${escapeHtml(seo.openGraph.url)}"${markerAttr} />`,
    );
  }

  return tags.join("\n");
}

export interface BuildSitemapXmlInput {
  readonly siteUrl: string;
  readonly articles: readonly KnowledgeArticleMetadata[];
}

/**
 * Builds deterministic `sitemap.xml` covering `/knowledge` and all manifest articles (D-F6-S1, KB-AC-29).
 *
 * - Never includes `/` (home route).
 * - Listing `<url>` appears first with `lastmod` = latest article `updatedAt` (omitted if 0 articles).
 * - Articles are sorted deterministically via `compareManifestEntries`.
 * - Rejects invalid/duplicate slugs.
 */
export function buildSitemapXml(input: BuildSitemapXmlInput): string {
  const normalizedSiteUrl = normalizeSiteUrl(input.siteUrl);
  const sorted = [...input.articles].sort(compareManifestEntries);

  const seenSlugs = new Set<string>();
  let latestUpdatedAt = "";
  for (const article of sorted) {
    if (!SLUG_PATTERN.test(article.slug)) {
      throw new KnowledgeSeoError(
        `Invalid article slug in sitemap: "${article.slug}"`,
        "INVALID_SLUG",
      );
    }
    if (seenSlugs.has(article.slug)) {
      throw new KnowledgeSeoError(
        `Duplicate article slug in sitemap: "${article.slug}"`,
        "DUPLICATE_SLUG",
      );
    }
    seenSlugs.add(article.slug);

    if (article.updatedAt > latestUpdatedAt) {
      latestUpdatedAt = article.updatedAt;
    }
  }

  const entries: string[] = [];

  const listingLines = [
    "  <url>",
    `    <loc>${escapeXml(`${normalizedSiteUrl}/knowledge`)}</loc>`,
  ];
  if (latestUpdatedAt) {
    listingLines.push(`    <lastmod>${escapeXml(latestUpdatedAt)}</lastmod>`);
  }
  listingLines.push("  </url>");
  entries.push(listingLines.join("\n"));

  for (const article of sorted) {
    const articleLines = [
      "  <url>",
      `    <loc>${escapeXml(`${normalizedSiteUrl}/knowledge/${article.slug}`)}</loc>`,
      `    <lastmod>${escapeXml(article.updatedAt)}</lastmod>`,
      "  </url>",
    ];
    entries.push(articleLines.join("\n"));
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
}

export interface BuildRobotsTxtInput {
  readonly siteUrl: string;
}

/**
 * Builds approved `robots.txt` pointing to `${siteUrl}/sitemap.xml` (D-F6-S1, KB-AC-30).
 */
export function buildRobotsTxt(input: BuildRobotsTxtInput): string {
  const normalizedSiteUrl = normalizeSiteUrl(input.siteUrl);
  return [
    "User-agent: *",
    "Disallow: /app/",
    "",
    `Sitemap: ${normalizedSiteUrl}/sitemap.xml`,
    "",
  ].join("\n");
}
