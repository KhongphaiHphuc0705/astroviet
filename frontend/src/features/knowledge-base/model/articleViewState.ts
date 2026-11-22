import type { KnowledgeArticle, KnowledgeArticleResult } from "./types";

export interface ArticleErrorReport {
  readonly context:
    | "knowledge-article:missing-file"
    | "knowledge-article:empty-content"
    | "knowledge-article:load-failed";
  readonly error: Error;
}

export type ArticleViewClassification =
  | {
      readonly kind: "article";
      readonly article: KnowledgeArticle;
    }
  | {
      readonly kind: "not-found";
      readonly slug: string;
      readonly report?: ArticleErrorReport;
    }
  | {
      readonly kind: "error";
      readonly slug: string;
      readonly report: ArticleErrorReport;
    };

/**
 * Pure classifier for `KnowledgeArticleResult` (D-F6.4-04, AC-F6.4-A04).
 *
 * Distinguishes:
 * - `not-found` (unknown slug): user-facing Not Found, no technical error report.
 * - `content-error` (`missing-file` | `empty-content`): user-facing Not Found
 *   accompanied by a technical error report (integrity/build defect).
 * - `content-error` (`load-failed`): user-facing retryable error state
 *   accompanied by a technical error report (chunk/network load defect).
 */
export function classifyArticleResult(
  result: KnowledgeArticleResult,
): ArticleViewClassification {
  if (result.status === "found") {
    return {
      kind: "article",
      article: result.article,
    };
  }

  if (result.status === "not-found") {
    return {
      kind: "not-found",
      slug: result.slug,
    };
  }

  if (result.reason === "missing-file") {
    return {
      kind: "not-found",
      slug: result.slug,
      report: {
        context: "knowledge-article:missing-file",
        error: new Error(
          `Knowledge article markdown file missing for slug "${result.slug}"`,
        ),
      },
    };
  }

  if (result.reason === "empty-content") {
    return {
      kind: "not-found",
      slug: result.slug,
      report: {
        context: "knowledge-article:empty-content",
        error: new Error(
          `Knowledge article markdown content is empty for slug "${result.slug}"`,
        ),
      },
    };
  }

  const error =
    result.cause instanceof Error
      ? result.cause
      : new Error(
          `Failed to load knowledge article "${result.slug}": ${String(result.cause ?? "unknown cause")}`,
        );

  return {
    kind: "error",
    slug: result.slug,
    report: {
      context: "knowledge-article:load-failed",
      error,
    },
  };
}
