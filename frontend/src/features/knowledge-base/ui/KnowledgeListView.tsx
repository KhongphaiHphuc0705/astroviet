import { useCallback, useMemo, useRef, useState } from "react";

import { cn } from "@shared/lib/cn";
import { Button } from "@shared/ui/Button";
import { EmptyState } from "@shared/ui/EmptyState";
import { Grid } from "@shared/ui/Grid";

import {
  CATEGORY_FILTER_ALL,
  type KnowledgeCategoryFilterValue,
  filterArticlesByCategory,
} from "../model/categoryFilter";
import type { KnowledgeArticleMetadata } from "../model/types";

import { ArticleCard } from "./ArticleCard";
import { CategoryFilter } from "./CategoryFilter";

export interface KnowledgeListViewProps {
  readonly articles: readonly KnowledgeArticleMetadata[];
  readonly className?: string;
}

/**
 * KnowledgeListView component (KB-U13, KB-U14, KB-U35, KB-AC-13, 15, 16, 17)
 *
 * Coordinates:
 * - CategoryFilter with 6 canonical filter buttons ("Tất cả" + 5 categories)
 * - Persistent accessible live announcement: `<p role="status">Hiển thị {n} bài viết</p>`
 * - Responsive 1->2->3 column grid (`Grid as="ul" role="list"`) of ArticleCards
 * - EmptyState when 0 articles match filter, with reset button returning to "all" and restoring focus
 */
export function KnowledgeListView({
  articles,
  className,
}: KnowledgeListViewProps): JSX.Element {
  const [selectedCategory, setSelectedCategory] =
    useState<KnowledgeCategoryFilterValue>(CATEGORY_FILTER_ALL);
  const allButtonRef = useRef<HTMLElement>(null);

  const filteredArticles = useMemo(
    () => filterArticlesByCategory(articles, selectedCategory),
    [articles, selectedCategory],
  );

  const handleReset = useCallback(() => {
    setSelectedCategory(CATEGORY_FILTER_ALL);
    allButtonRef.current?.focus();
  }, []);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <CategoryFilter
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        allButtonRef={allButtonRef}
      />

      <p role="status" className="text-body-sm text-secondary">
        Hiển thị {filteredArticles.length} bài viết
      </p>

      {filteredArticles.length === 0 ? (
        <EmptyState
          headingLevel="h2"
          title="Chưa có bài viết trong chủ đề này"
          action={
            <Button variant="secondary" onClick={handleReset}>
              Xem tất cả bài viết
            </Button>
          }
        />
      ) : (
        <Grid
          as="ul"
          role="list"
          columns={{ xs: "1", md: "2", lg: "3" }}
          className="gap-6"
        >
          {filteredArticles.map((article) => (
            <li key={article.slug} className="flex h-full">
              <ArticleCard article={article} />
            </li>
          ))}
        </Grid>
      )}
    </div>
  );
}
