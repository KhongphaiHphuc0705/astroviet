import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./index";

describe("Badge", () => {
  it("renders correctly with default props", () => {
    render(<Badge data-testid="badge">Default</Badge>);
    const badge = screen.getByTestId("badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-surface-raised");
    expect(badge).toHaveClass("h-6"); // size="md" by default
  });

  it("renders small size correctly", () => {
    render(
      <Badge size="sm" data-testid="badge">
        Small
      </Badge>,
    );
    const badge = screen.getByTestId("badge");
    expect(badge).toHaveClass("h-5");
  });

  it("renders variants correctly", () => {
    render(
      <Badge variant="danger" data-testid="badge">
        Danger
      </Badge>,
    );
    const badge = screen.getByTestId("badge");
    expect(badge).toHaveClass("bg-danger text-on-accent");
  });

  it("strips onClick and tabIndex props to enforce non-interactive rule", () => {
    // @ts-expect-error - We intentionally pass forbidden props to test runtime protection
    render(
      <Badge onClick={() => {}} tabIndex={0} data-testid="badge">
        Non-interactive
      </Badge>,
    );
    const badge = screen.getByTestId("badge");
    expect(badge).not.toHaveAttribute("tabindex");
    expect(badge.onclick).toBeNull();
  });
});
