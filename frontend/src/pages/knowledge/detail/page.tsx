import { useCallback, useEffect, useMemo, useRef, type JSX } from "react";
import { useParams } from "react-router-dom";

import {
  ArticleNotFound,
  buildKnowledgeArticleSeo,
  buildKnowledgeNotFoundSeo,
  classifyArticleResult,
  KnowledgeArticleHeader,
  knowledgeContentService,
  useKnowledgeArticle,
  useKnowledgeSiteUrl,
} from "@features/knowledge-base";
// Documented exception (D-F6.4-03): KnowledgeArticleView is deep-imported ONLY here
// so `react-markdown` stays isolated in the lazy detail route chunk and never enters
// the feature barrel or the `/knowledge` listing chunk.
import { KnowledgeArticleView } from "@features/knowledge-base/ui/KnowledgeArticleView";
import { usePageMeta } from "@shared/hooks/usePageMeta";
import { reportError } from "@shared/lib/report-error";
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
 * - Updates `<head>` metadata via `usePageMeta` and scrolls to top on slug changes (D-F6.4-06).
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

  const siteUrl = useKnowledgeSiteUrl();

  const pageMeta = useMemo(() => {
    if (!metadata || !slug || classified?.kind === "not-found") {
      return buildKnowledgeNotFoundSeo();
    }
    return buildKnowledgeArticleSeo({ article: metadata, siteUrl });
  }, [metadata, slug, classified?.kind, siteUrl]);

  usePageMeta(pageMeta);

  // Instant scroll to top on slug transition (respects prefers-reduced-motion, D-F6.4-06)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.scrollTo === "function"
    ) {
      window.scrollTo(0, 0);
    }
  }, [slug]);

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

  return (
    <article className="mx-auto w-full max-w-[65ch] text-[16px] leading-relaxed [overflow-wrap:anywhere]">
      <KnowledgeArticleHeader article={metadata} />

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
