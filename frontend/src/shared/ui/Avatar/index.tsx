import { useState, type HTMLAttributes } from "react";

import { cn } from "@shared/lib/cn";
import { Skeleton } from "@shared/ui/Skeleton";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string; // Required for a11y and initials
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";

  const firstWord = words[0];
  const lastWord = words[words.length - 1];

  if (!firstWord) return "?";
  if (words.length === 1) return firstWord.substring(0, 2).toUpperCase();
  if (!lastWord) return firstWord.substring(0, 2).toUpperCase();

  return (firstWord.charAt(0) + lastWord.charAt(0)).toUpperCase();
}

export const Avatar = ({
  src,
  name,
  size = "md",
  isLoading = false,
  className,
  ...props
}: AvatarProps) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: "h-6 w-6 text-body-sm",
    sm: "h-8 w-8 text-label",
    md: "h-10 w-10 text-body-lg font-medium",
    lg: "h-14 w-14 text-heading-md font-medium",
  };

  if (isLoading) {
    return (
      <Skeleton
        variant="circular"
        className={cn(sizeClasses[size], className)}
        {...props}
      />
    );
  }

  const showInitials = !src || hasError;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium transition-colors",
        "border border-subtle bg-subtle text-primary",
        sizeClasses[size],
        className,
      )}
      // M6 Spec §3.13: Ensure correct accessible label when displaying initials
      aria-label={showInitials ? name : undefined}
      role={showInitials ? "img" : undefined}
      {...props}
    >
      {showInitials ? (
        <span aria-hidden="true">{getInitials(name)}</span>
      ) : (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};
