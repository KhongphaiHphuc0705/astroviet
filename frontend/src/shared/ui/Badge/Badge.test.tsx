import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./index";

describe("Badge", () => {
  it("renders correctly with default props", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default").closest("span")!;
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-surface-raised");
    expect(badge).toHaveClass("h-6"); // size="md" by default
  });

  it("renders small size correctly", () => {
    render(<Badge size="sm">Small</Badge>);
    const badge = screen.getByText("Small").closest("span")!;
    expect(badge).toHaveClass("h-5");
  });

  it("renders variants correctly", () => {
    render(<Badge variant="danger">Danger</Badge>);
    const badge = screen.getByText("Danger").closest("span")!;
    expect(badge).toHaveClass("bg-danger text-on-accent");
  });

  it("strips onClick and tabIndex props to enforce non-interactive rule", () => {
    // @ts-expect-error - We intentionally pass forbidden props to test runtime protection
    render(
      <Badge onClick={() => {}} tabIndex={0}>
        Non-interactive
      </Badge>,
    );
    const badge = screen.getByText("Non-interactive").closest("span")!;
    expect(badge).not.toHaveAttribute("tabindex");
    expect(badge.onclick).toBeNull();
  });
});
