import {
  isKnowledgeCategory,
  type KnowledgeArticleMetadata,
  type KnowledgeCategory,
} from "./types";

export const CATEGORY_FILTER_ALL = "all" as const;

export type KnowledgeCategoryFilterValue =
  KnowledgeCategory | typeof CATEGORY_FILTER_ALL;

/**
 * Pure filter function for Knowledge Base articles by category.
 *
 * - When `selected === "all"`: returns all articles, preserving input order.
 * - When `selected` is a valid `KnowledgeCategory`: returns only articles matching that category.
 * - When `selected` is an unknown/invalid value: returns empty array `[]`.
 * - Does not mutate the input array.
 */
export function filterArticlesByCategory(
  articles: readonly KnowledgeArticleMetadata[],
  selected: KnowledgeCategoryFilterValue,
): readonly KnowledgeArticleMetadata[] {
  if (selected === CATEGORY_FILTER_ALL) {
    return articles;
  }

  if (isKnowledgeCategory(selected)) {
    return articles.filter((article) => article.category === selected);
  }

  return [];
}
