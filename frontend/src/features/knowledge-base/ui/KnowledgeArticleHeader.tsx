import { useEffect, useRef, type JSX } from "react";
import { Link } from "react-router-dom";

import { reportError } from "@shared/lib/report-error";
import { Badge } from "@shared/ui/Badge";

import { formatKnowledgeDate } from "../model/formatDate";
import { KNOWLEDGE_LIST_PATH } from "../model/routes";
import {
  KNOWLEDGE_CATEGORY_LABELS,
  type KnowledgeArticleMetadata,
} from "../model/types";

export interface KnowledgeArticleHeaderProps {
  readonly article: Pick<
    KnowledgeArticleMetadata,
    "slug" | "title" | "category" | "updatedAt"
  >;
}

/**
 * KnowledgeArticleHeader component
 *
 * Shared article back-link and header (`Badge`, `h1`, formatted updated date)
 * used across loading, retryable-error, and loaded reading states on `/knowledge/:slug`.
 *
 * Intentionally has zero Markdown imports so it can be exported from the feature barrel
 * without leaking `react-markdown` into listing or entry bundles.
 */
export function KnowledgeArticleHeader({
  article,
}: KnowledgeArticleHeaderProps): JSX.Element {
  const categoryLabel = KNOWLEDGE_CATEGORY_LABELS[article.category];
  const formattedDate = formatKnowledgeDate(article.updatedAt);
  const reportedInvalidDateRef = useRef<string | null>(null);

  useEffect(() => {
    if (formattedDate !== "") {
      return;
    }
    const reportKey = `${article.slug}:${article.updatedAt}`;
    if (reportedInvalidDateRef.current === reportKey) {
      return;
    }
    reportedInvalidDateRef.current = reportKey;
    reportError(
      new Error(
        `Invalid updatedAt "${article.updatedAt}" on article "${article.slug}"`,
      ),
      "knowledge-article:invalid-updated-at",
    );
  }, [article.slug, article.updatedAt, formattedDate]);

  return (
    <>
      <Link
        to={KNOWLEDGE_LIST_PATH}
        className="mb-6 inline-flex items-center gap-1.5 rounded-sm text-body-sm font-medium text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <span aria-hidden="true">←</span>
        <span>Tất cả bài viết</span>
      </Link>

      <header className="mb-8 flex flex-col gap-3">
        <div>
          <Badge variant="outline" size="sm">
            {categoryLabel}
          </Badge>
        </div>

        <h1 className="break-words text-heading-lg font-bold text-primary md:text-display-lg">
          {article.title}
        </h1>

        {formattedDate && (
          <p className="text-body-sm text-secondary">
            Cập nhật <time dateTime={article.updatedAt}>{formattedDate}</time>
          </p>
        )}
      </header>
    </>
  );
}
