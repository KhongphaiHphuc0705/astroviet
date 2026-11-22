import { useCallback, useEffect, useMemo, useRef, type JSX } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArticleNotFound,
  classifyArticleResult,
  formatKnowledgeDate,
  KNOWLEDGE_CATEGORY_LABELS,
  KNOWLEDGE_LIST_PATH,
  knowledgeContentService,
  useKnowledgeArticle,
} from "@features/knowledge-base";
// Documented exception (D-F6.4-03): KnowledgeArticleView is deep-imported ONLY here
// so `react-markdown` stays isolated in the lazy detail route chunk and never enters
// the feature barrel or the `/knowledge` listing chunk.
import { KnowledgeArticleView } from "@features/knowledge-base/ui/KnowledgeArticleView";
import { reportError } from "@shared/lib/report-error";
import { Badge } from "@shared/ui/Badge";
import { Button } from "@shared/ui/Button";
import { EmptyState } from "@shared/ui/EmptyState";
import { Skeleton } from "@shared/ui/Skeleton";

/**
 * KnowledgeArticlePage component (/knowledge/:slug)
 *
 * Public detail page for a single Knowledge Base article.
 * - Resolves article metadata synchronously via `knowledgeContentService.getArticleMetadata`.
 * - Unknown slugs render `ArticleNotFound` synchronously without async fetches.
 * - Valid slugs show header immediately while body markdown loads via `useKnowledgeArticle`.
 * - Classifies `found | not-found | content-error` explicitly via `classifyArticleResult`.
 */
export default function KnowledgeArticlePage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();

  const metadata = useMemo(
    () => (slug ? knowledgeContentService.getArticleMetadata(slug) : undefined),
    [slug],
  );

  const { data, isPending, refetch } = useKnowledgeArticle(
    slug,
    metadata !== undefined,
  );

  const classified = useMemo(
    () => (data ? classifyArticleResult(data) : null),
    [data],
  );

  const reportedKeyRef = useRef<string | null>(null);
  const errorReport =
    classified && "report" in classified ? classified.report : undefined;

  useEffect(() => {
    if (!errorReport || !slug) {
      return;
    }
    const reportKey = `${slug}:${errorReport.context}`;
    if (reportedKeyRef.current === reportKey) {
      return;
    }
    reportedKeyRef.current = reportKey;
    reportError(errorReport.error, errorReport.context);
  }, [slug, errorReport]);

  const isKnownSlug = useCallback(
    (candidate: string) =>
      knowledgeContentService.getArticleMetadata(candidate) !== undefined,
    [],
  );

  if (!metadata || !slug) {
    return <ArticleNotFound />;
  }

  if (classified?.kind === "article") {
    return (
      <KnowledgeArticleView
        key={slug}
        article={classified.article}
        isKnownSlug={isKnownSlug}
      />
    );
  }

  if (classified?.kind === "not-found") {
    return <ArticleNotFound />;
  }

  const categoryLabel = KNOWLEDGE_CATEGORY_LABELS[metadata.category];
  const formattedDate = formatKnowledgeDate(metadata.updatedAt);

  return (
    <article className="mx-auto w-full max-w-[65ch] text-[16px] leading-relaxed [overflow-wrap:anywhere]">
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
          {metadata.title}
        </h1>

        {formattedDate && (
          <p className="text-body-sm text-muted">
            Cập nhật <time dateTime={metadata.updatedAt}>{formattedDate}</time>
          </p>
        )}
      </header>

      {isPending ? (
        <div
          role="status"
          aria-label="Đang tải nội dung bài viết"
          className="flex flex-col gap-3"
        >
          <Skeleton variant="text" count={4} />
        </div>
      ) : (
        <EmptyState
          headingLevel="h2"
          variant="danger"
          title="Không thể tải bài viết"
          description="Đã xảy ra lỗi khi tải nội dung. Vui lòng thử lại."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Thử lại
            </Button>
          }
        />
      )}
    </article>
  );
}
