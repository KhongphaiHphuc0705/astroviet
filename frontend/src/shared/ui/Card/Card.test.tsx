import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./index";

describe("Card", () => {
  it("renders Card and its subcomponents correctly", () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="card-header">
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent data-testid="card-content">
          <p>Card Content</p>
        </CardContent>
        <CardFooter data-testid="card-footer">
          <button>Card Footer Button</button>
        </CardFooter>
      </Card>,
    );

    const card = screen.getByTestId("card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass(
      "rounded-xl border border-subtle bg-surface text-primary shadow-level-1",
    );

    expect(screen.getByTestId("card-header")).toBeInTheDocument();
    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card Title")).toHaveClass(
      "font-display text-heading-md font-semibold",
    );

    expect(screen.getByText("Card Description")).toBeInTheDocument();
    expect(screen.getByText("Card Description")).toHaveClass(
      "text-body-sm text-secondary",
    );

    expect(screen.getByTestId("card-content")).toBeInTheDocument();
    expect(screen.getByText("Card Content")).toBeInTheDocument();

    expect(screen.getByTestId("card-footer")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Card Footer Button" }),
    ).toBeInTheDocument();
  });

  it("merges custom classNames correctly", () => {
    render(<Card data-testid="card" className="custom-class bg-subtle" />);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("custom-class");
    expect(card).toHaveClass("bg-subtle");
    expect(card).toHaveClass("rounded-xl"); // maintains base classes
  });

  it("passes accessibility check", async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Accessible Card</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
