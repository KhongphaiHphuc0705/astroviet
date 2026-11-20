import { useId } from "react";

import { cn } from "@shared/lib/cn";
import { Button } from "@shared/ui/Button";

import {
  CATEGORY_FILTER_ALL,
  type KnowledgeCategoryFilterValue,
} from "../model/categoryFilter";
import {
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_CATEGORY_LABELS,
} from "../model/types";

export interface CategoryFilterProps {
  readonly selected: KnowledgeCategoryFilterValue;
  readonly onSelect: (value: KnowledgeCategoryFilterValue) => void;
  readonly allButtonRef?: React.Ref<HTMLButtonElement>;
  readonly className?: string;
}

/**
 * CategoryFilter component (KB-U31, KB-AC-14, D-F6.3-03, D-F6.3-12)
 *
 * Renders a canonical 6-button filter group for knowledge categories:
 * "Tất cả" + 5 categories from `KNOWLEDGE_CATEGORIES`.
 *
 * Uses toggle buttons with `aria-pressed` within a labeled `role="group"`
 * container for clean accessibility without improper tablist/radiogroup semantics.
 */
export function CategoryFilter({
  selected,
  onSelect,
  allButtonRef,
  className,
}: CategoryFilterProps): JSX.Element {
  const headingId = useId();

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-2", className)}
    >
      <p id={headingId} className="text-label font-medium text-secondary">
        Lọc theo chủ đề
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={allButtonRef as React.Ref<any>}
          type="button"
          size="md"
          variant={selected === CATEGORY_FILTER_ALL ? "primary" : "secondary"}
          aria-pressed={selected === CATEGORY_FILTER_ALL}
          onClick={() => onSelect(CATEGORY_FILTER_ALL)}
        >
          Tất cả
        </Button>

        {KNOWLEDGE_CATEGORIES.map((category) => {
          const isPressed = selected === category;
          return (
            <Button
              key={category}
              type="button"
              size="md"
              variant={isPressed ? "primary" : "secondary"}
              aria-pressed={isPressed}
              onClick={() => onSelect(category)}
            >
              {KNOWLEDGE_CATEGORY_LABELS[category]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
