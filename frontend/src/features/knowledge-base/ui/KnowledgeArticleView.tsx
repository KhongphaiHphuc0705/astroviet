import type { JSX } from "react";

import { cn } from "@shared/lib/cn";

import type { KnowledgeArticle } from "../model/types";

import { KnowledgeArticleHeader } from "./KnowledgeArticleHeader";
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
  return (
    <article
      className={cn(
        "mx-auto w-full max-w-[65ch] text-[16px] leading-relaxed [overflow-wrap:anywhere]",
        className,
      )}
    >
      <KnowledgeArticleHeader article={article} />

      <MarkdownRenderer markdown={article.markdown} isKnownSlug={isKnownSlug} />
    </article>
  );
}
