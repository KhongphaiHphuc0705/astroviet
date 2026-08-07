import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { Skeleton } from "./index";

describe("Skeleton", () => {
  it("renders correctly with default classes", () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("animate-pulse");
    expect(skeleton).toHaveClass("bg-subtle");
    expect(skeleton).toHaveClass("motion-reduce:animate-none");
    expect(skeleton).toHaveClass("rounded-md"); // default is rectangular
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
  });

  it("merges custom className correctly", () => {
    render(<Skeleton data-testid="skeleton" className="h-10 w-10" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("h-10");
    expect(skeleton).toHaveClass("w-10");
    // Should still have base classes
    expect(skeleton).toHaveClass("animate-pulse");
  });

  it("renders circular variant", () => {
    render(<Skeleton variant="circular" data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("rounded-full");
  });

  it("renders text variant", () => {
    render(<Skeleton variant="text" data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("h-4 w-full rounded-md");
  });

  it("applies width and height from props", () => {
    render(<Skeleton width="100px" height="50px" data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveStyle({ width: "100px", height: "50px" });
  });

  it("renders multiple elements when count > 1", () => {
    const { container } = render(<Skeleton count={3} />);
    // When count > 1, the root element is a div with flex flex-col gap-2, containing the 3 skeletons
    expect(container.firstChild).toHaveClass("flex flex-col gap-2");
    expect(container.querySelectorAll("div[aria-hidden='true']")).toHaveLength(
      3,
    );
  });

  it("passes accessibility check", async () => {
    const { container } = render(<Skeleton />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
