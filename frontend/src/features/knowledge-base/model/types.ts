export const KNOWLEDGE_CATEGORIES = [
  "fundamentals",
  "planets",
  "signs",
  "houses",
  "aspects",
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export const KNOWLEDGE_CATEGORY_LABELS: Readonly<
  Record<KnowledgeCategory, string>
> = {
  fundamentals: "Khái niệm cơ bản",
  planets: "Hành tinh",
  signs: "Cung",
  houses: "Nhà",
  aspects: "Góc chiếu",
};

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const RESERVED_SLUGS = ["index", "images"] as const;

export function isKnowledgeCategory(value: string): value is KnowledgeCategory {
  return (KNOWLEDGE_CATEGORIES as readonly string[]).includes(value);
}

export interface KnowledgeArticleMetadata {
  readonly slug: string;
  readonly title: string;
  readonly category: KnowledgeCategory;
  readonly summary: string;
  readonly order: number;
  readonly updatedAt: string; /* YYYY-MM-DD */
}

export interface KnowledgeArticleContent {
  readonly markdown: string;
}

export interface KnowledgeArticle
  extends KnowledgeArticleMetadata, KnowledgeArticleContent {}

export type KnowledgeContentErrorReason =
  "missing-file" | "load-failed" | "empty-content";

export type KnowledgeArticleResult =
  | { readonly status: "found"; readonly article: KnowledgeArticle }
  | { readonly status: "not-found"; readonly slug: string }
  | {
      readonly status: "content-error";
      readonly slug: string;
      readonly reason: KnowledgeContentErrorReason;
      readonly cause?: unknown;
    };

export interface ListArticlesOptions {
  readonly category?: KnowledgeCategory;
}
