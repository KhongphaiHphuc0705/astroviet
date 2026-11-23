import type { JSX } from "react";
import { Link } from "react-router-dom";

import { cn } from "@shared/lib/cn";
import { Button } from "@shared/ui/Button";

import { KNOWLEDGE_LIST_PATH } from "../model/routes";

export interface ArticleNotFoundProps {
  readonly className?: string;
}

/**
 * ArticleNotFound component (KB-AC-05, D-F6-U1)
 *
 * Renders inside MarketingLayout (NOT full-viewport h-screen) when an article slug
 * does not exist or its content file cannot be resolved.
 * Provides a single `h1` and an accessible link back to the knowledge listing.
 */
export function ArticleNotFound({
  className,
}: ArticleNotFoundProps): JSX.Element {
  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-[65ch] flex-col items-center py-12 text-center",
        className,
      )}
    >
      <h1 className="text-heading-lg font-bold text-primary md:text-display-lg">
        Không tìm thấy bài viết
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-secondary">
        Bài viết bạn tìm không tồn tại hoặc đã được di chuyển.
      </p>
      <div className="mt-6">
        <Button
          as={Link}
          to={KNOWLEDGE_LIST_PATH}
          variant="secondary"
          size="md"
          className="inline-flex min-h-[44px] items-center gap-1.5"
        >
          <span aria-hidden="true">←</span>
          <span>Tất cả bài viết</span>
        </Button>
      </div>
    </section>
  );
}
