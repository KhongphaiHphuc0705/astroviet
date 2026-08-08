import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { Card } from "./index";

describe("Card (Flat API)", () => {
  it("renders with default props", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("p-6"); // default padding md
    expect(card).toHaveClass("border-subtle bg-surface shadow-level-1"); // default variant
    expect(card).toHaveClass("rounded-md"); // spec compliant radius
  });

  it("applies padding variants correctly", () => {
    const { rerender } = render(
      <Card padding="none" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card")).toHaveClass("p-0");

    rerender(
      <Card padding="sm" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card")).toHaveClass("p-4");

    rerender(
      <Card padding="lg" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card")).toHaveClass("p-8");
  });

  it("applies stylistic variants correctly", () => {
    const { rerender } = render(
      <Card variant="raised" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card")).toHaveClass(
      "bg-surface-raised shadow-level-2",
    );

    rerender(
      <Card variant="outline-accent" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card")).toHaveClass("border-accent-secondary");
  });

  it("applies interactive styles", () => {
    render(
      <Card interactive data-testid="card">
        Content
      </Card>,
    );
    const card = screen.getByTestId("card");
    expect(card).toHaveClass(
      "cursor-pointer",
      "hover:bg-surface-raised",
      "focus-within:ring-2",
    );
  });

  it("supports polymorphic as prop", () => {
    render(
      <Card as="label" data-testid="card">
        Content
      </Card>,
    );
    const card = screen.getByTestId("card");
    expect(card.tagName).toBe("LABEL");
  });

  it("passes accessibility check", async () => {
    const { container } = render(
      <Card as="article" variant="default" padding="md">
        <h2>Accessible Card</h2>
        <p>Content</p>
      </Card>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
