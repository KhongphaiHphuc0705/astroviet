import {
  buildKnowledgeArticleSeo,
  buildKnowledgeListSeo,
  KNOWLEDGE_LIST_DESCRIPTION,
  KNOWLEDGE_LIST_TITLE,
  normalizeSiteUrl,
  SITE_NAME,
  type KnowledgeSeo,
} from "./seo";
import type { KnowledgeArticleMetadata } from "./types";

export const DEFAULT_DEV_SITE_URL = "http://localhost:5173";

export interface ResolveSiteUrlOptions {
  readonly isDev: boolean;
}

export interface SiteUrlResolution {
  readonly siteUrl: string | undefined;
  readonly invalidError?: Error;
}

/**
 * Resolves and normalizes `VITE_SITE_URL` with diagnostic details (D-F6.4-01, AC-F6.4-A06).
 *
 * Pure and SSR-safe (zero browser globals or runtime env reads):
 * - When `raw` is provided and valid: returns normalized origin (no trailing slash).
 * - When `raw` is provided and invalid: returns `{ siteUrl: undefined, invalidError }`.
 * - When `raw` is omitted/empty and `isDev` is true: falls back to `http://localhost:5173`.
 * - When `raw` is omitted/empty and `isDev` is false: returns `{ siteUrl: undefined }`
 *   (never guesses a production domain).
 */
export function resolveSiteUrlDetailed(
  raw: string | undefined,
  options: ResolveSiteUrlOptions,
): SiteUrlResolution {
  if (typeof raw === "string" && raw.trim().length > 0) {
    try {
      return { siteUrl: normalizeSiteUrl(raw.trim()) };
    } catch (err) {
      return {
        siteUrl: undefined,
        invalidError:
          err instanceof Error
            ? err
            : new Error(`Invalid VITE_SITE_URL: ${String(err)}`),
      };
    }
  }

  if (options.isDev) {
    return { siteUrl: DEFAULT_DEV_SITE_URL };
  }

  return { siteUrl: undefined };
}

/**
 * Resolves `VITE_SITE_URL` to a normalized origin or `undefined` (D-F6.4-01).
 */
export function resolveSiteUrl(
  raw: string | undefined,
  options: ResolveSiteUrlOptions,
): string | undefined {
  return resolveSiteUrlDetailed(raw, options).siteUrl;
}

/**
 * Builds Knowledge Base listing SEO metadata, omitting `canonicalUrl` and `openGraph.url`
 * when `siteUrl` is unavailable in production (D-F6.4-01, AC-F6.4-A06).
 */
export function buildKnowledgeListPageMeta(
  siteUrl: string | undefined,
): KnowledgeSeo {
  if (siteUrl !== undefined) {
    return buildKnowledgeListSeo({ siteUrl });
  }

  return {
    title: KNOWLEDGE_LIST_TITLE,
    description: KNOWLEDGE_LIST_DESCRIPTION,
    openGraph: {
      type: "website",
      title: KNOWLEDGE_LIST_TITLE,
      description: KNOWLEDGE_LIST_DESCRIPTION,
    },
  };
}

/**
 * Builds Knowledge Base article SEO metadata, omitting `canonicalUrl` and `openGraph.url`
 * when `siteUrl` is unavailable in production (D-F6.4-01, AC-F6.4-A06).
 */
export function buildKnowledgeArticlePageMeta(
  article: KnowledgeArticleMetadata,
  siteUrl: string | undefined,
): KnowledgeSeo {
  if (siteUrl !== undefined) {
    return buildKnowledgeArticleSeo({ siteUrl, article });
  }

  return {
    title: `${article.title} — ${SITE_NAME}`,
    description: article.summary,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
    },
  };
}
