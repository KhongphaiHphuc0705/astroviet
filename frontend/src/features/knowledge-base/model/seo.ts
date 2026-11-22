import type { KnowledgeArticleMetadata } from "./types";

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
