import type { ElementType, HTMLAttributes } from "react";

import { cn } from "@shared/lib/cn";

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  size?: "default" | "wide" | "narrow" | "full";
  paddingX?: boolean;
  as?: ElementType;
}

const SIZE_MAPPING = {
  default: "max-w-container-default",
  narrow: "max-w-container-narrow",
  wide: "max-w-container-wide",
  full: "max-w-full",
};

export function Container({
  size = "default",
  paddingX = true,
  as: Component = "div",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full",
        SIZE_MAPPING[size],
        paddingX && "px-4 md:px-8",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
