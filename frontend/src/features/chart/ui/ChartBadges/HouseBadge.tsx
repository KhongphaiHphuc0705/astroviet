import { cn } from "@shared/lib/cn";

export const ROMAN_HOUSE_NUMERALS: readonly string[] = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

export interface HouseBadgeProps {
  house: number;
  ariaLabel?: string;
  numeralStyle?: "arabic" | "roman";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function HouseBadge({
  house,
  ariaLabel,
  numeralStyle = "arabic",
  size = "md",
  className,
}: HouseBadgeProps) {
  const isValid = Number.isInteger(house) && house >= 1 && house <= 12;

  const displayText = isValid
    ? numeralStyle === "roman"
      ? ROMAN_HOUSE_NUMERALS[house - 1]
      : String(house)
    : "—";

  const accessibleName = isValid
    ? (ariaLabel ?? `Nhà thứ ${house}`)
    : (ariaLabel ?? "Không rõ nhà");

  const sizeClasses = {
    sm: "h-5 min-w-5 px-1.5 text-label",
    md: "h-6 min-w-6 px-2 text-body-sm",
    lg: "h-7 min-w-7 px-2.5 text-body-md",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-subtle bg-surface-raised font-medium text-secondary",
        sizeClasses,
        className,
      )}
    >
      <span aria-hidden="true">{displayText}</span>
      <span className="sr-only">{accessibleName}</span>
    </span>
  );
}
