import { Link } from "react-router-dom";

import { cn } from "@shared/lib/cn";
import { Badge } from "@shared/ui/Badge";
import { Card } from "@shared/ui/Card";

import { formatKnowledgeDate } from "../model/formatDate";
import { knowledgeArticlePath } from "../model/routes";
import {
  KNOWLEDGE_CATEGORY_LABELS,
  type KnowledgeArticleMetadata,
} from "../model/types";

export interface ArticleCardProps {
  readonly article: KnowledgeArticleMetadata;
  readonly className?: string;
}

/**
 * ArticleCard component (KB-U31a, D-F6.3-02, D-F6.3-04)
 * Renders an article card preview with category badge, title link,
 * summary, and formatted updated date.
 *
 * Uses the stretched link technique (Link has `after:absolute after:inset-0`)
 * inside an interactive `Card` to turn the entire card surface into an accessible link
 * without nested anchors or keyboard trap issues.
 */
export function ArticleCard({
  article,
  className,
}: ArticleCardProps): JSX.Element {
  const categoryLabel = KNOWLEDGE_CATEGORY_LABELS[article.category];
  const formattedDate = formatKnowledgeDate(article.updatedAt);

  return (
    <Card
      as="article"
      interactive
      padding="md"
      className={cn("relative flex h-full flex-col", className)}
    >
      <div className="mb-3 flex items-center justify-between">
        <Badge variant="outline" size="sm">
          {categoryLabel}
        </Badge>
      </div>

      <h2 className="mb-2 break-words text-heading-sm font-semibold text-primary">
        <Link
          to={knowledgeArticlePath(article.slug)}
          className="after:absolute after:inset-0 focus:outline-none"
        >
          {article.title}
        </Link>
      </h2>

      <p className="mb-4 break-words text-[14px] leading-relaxed text-secondary">
        {article.summary}
      </p>

      <div className="mt-auto pt-2 text-body-sm text-muted">
        <time dateTime={article.updatedAt}>Cập nhật {formattedDate}</time>
      </div>
    </Card>
  );
}
