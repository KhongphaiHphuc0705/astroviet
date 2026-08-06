import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton } from "./index";

describe("Skeleton", () => {
  it("renders correctly with default classes", () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("animate-pulse");
    expect(skeleton).toHaveClass("bg-surface-hover");
    expect(skeleton).toHaveClass("motion-reduce:animate-none");
  });

  it("merges custom className correctly", () => {
    render(
      <Skeleton data-testid="skeleton" className="h-10 w-10 rounded-full" />,
    );
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("h-10");
    expect(skeleton).toHaveClass("w-10");
    expect(skeleton).toHaveClass("rounded-full");
    // Should still have base classes
    expect(skeleton).toHaveClass("animate-pulse");
  });
});
