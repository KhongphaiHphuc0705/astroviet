import type { ElementType, HTMLAttributes } from "react";

import { cn } from "@shared/lib/cn";

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  size?: "default" | "wide" | "narrow" | "full";
  paddingX?: boolean;
  as?: ElementType;
}

const SIZE_CLASSES = {
  default: "max-w-[1200px]",
  wide: "max-w-[1440px]",
  narrow: "max-w-[768px]",
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
        SIZE_CLASSES[size],
        paddingX && "px-4 md:px-8",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
