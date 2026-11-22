import { useEffect, useRef, type JSX } from "react";
import { Link } from "react-router-dom";

import { cn } from "@shared/lib/cn";
import { reportError } from "@shared/lib/report-error";
import { Badge } from "@shared/ui/Badge";

import { formatKnowledgeDate } from "../model/formatDate";
import { KNOWLEDGE_LIST_PATH } from "../model/routes";
import {
  KNOWLEDGE_CATEGORY_LABELS,
  type KnowledgeArticle,
} from "../model/types";

import { MarkdownRenderer } from "./MarkdownRenderer";

export interface KnowledgeArticleViewProps {
  readonly article: KnowledgeArticle;
  readonly isKnownSlug: (slug: string) => boolean;
  readonly className?: string;
}

/**
 * KnowledgeArticleView component (KB-AC-19..25, D-F6.4-03, D-F6.4-07)
 *
 * Pure presentational reading view for a knowledge base article (SSR/prerender ready).
 * Shares a single `max-w-[65ch]` reading column with explicit `text-[16px]`
 * across back-link, header, and Markdown body so `ch` width calculations match body copy.
 *
 * Intentionally NOT exported via `features/knowledge-base/index.ts` so `react-markdown`
 * remains isolated to the lazy detail route chunk.
 */
export function KnowledgeArticleView({
  article,
  isKnownSlug,
  className,
}: KnowledgeArticleViewProps): JSX.Element {
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
    <article
      className={cn(
        "mx-auto w-full max-w-[65ch] text-[16px] leading-relaxed [overflow-wrap:anywhere]",
        className,
      )}
    >
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
          <p className="text-body-sm text-muted">
            Cập nhật <time dateTime={article.updatedAt}>{formattedDate}</time>
          </p>
        )}
      </header>

      <MarkdownRenderer markdown={article.markdown} isKnownSlug={isKnownSlug} />
    </article>
  );
}
