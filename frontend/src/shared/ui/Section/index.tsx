import type { ElementType, HTMLAttributes } from "react";

import { cn } from "@shared/lib/cn";
import { Container, type ContainerProps } from "@shared/ui/Container";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  containerSize?: ContainerProps["size"];
  spacing?: "default" | "compact";
  as?: ElementType;
}

const SPACING_CLASSES = {
  default: "py-16",
  compact: "py-12",
};

export function Section({
  containerSize = "default",
  spacing = "default",
  as: Component = "section",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <Component className={cn(SPACING_CLASSES[spacing], className)} {...props}>
      <Container size={containerSize}>{children}</Container>
    </Component>
  );
}
