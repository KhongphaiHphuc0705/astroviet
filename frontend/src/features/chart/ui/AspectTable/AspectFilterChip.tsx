import { cn } from "@shared/lib/cn";

import type { GlyphLabel } from "../../model/labels";

export interface AspectFilterChipProps {
  planet: GlyphLabel;
  onClear?: () => void;
  className?: string;
}

export function AspectFilterChip({
  planet,
  onClear,
  className,
}: AspectFilterChipProps) {
  const label = `Đang lọc: ${planet.labelVi}`;

  if (!onClear) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-raised px-3 py-1 text-body-sm font-medium text-primary",
          className,
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Xóa bộ lọc theo ${planet.labelVi}`}
      className={cn(
        "inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-subtle bg-surface-raised px-3 py-1 text-body-sm font-medium text-primary transition-colors",
        "hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus active:scale-[0.98]",
        className,
      )}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className="ml-0.5 text-body-xs font-bold text-secondary"
      >
        ✕
      </span>
    </button>
  );
}
