import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders with required props only", () => {
    render(<EmptyState title="Empty Title" />);

    expect(screen.getByText("Empty Title")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders with all props (default variant)", () => {
    render(
      <EmptyState
        title="Empty Title"
        description="Empty Description"
        icon={<svg data-testid="test-icon" />}
        action={<button>Action Button</button>}
      />,
    );

    expect(screen.getByText("Empty Title")).toBeInTheDocument();
    expect(screen.getByText("Empty Description")).toBeInTheDocument();
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Action Button" }),
    ).toBeInTheDocument();

    const iconContainer = screen.getByTestId("empty-state-icon");
    expect(iconContainer).toHaveClass("text-subtle");
    expect(screen.getByText("Empty Title")).toHaveClass("text-default");
  });

  it("renders with danger variant", () => {
    render(
      <EmptyState
        title="Error Occurred"
        description="Something went wrong"
        icon={<svg data-testid="error-icon" />}
        variant="danger"
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();

    const iconContainer = screen.getByTestId("empty-state-icon");
    expect(iconContainer).toHaveClass("text-danger");
    expect(screen.getByText("Error Occurred")).toHaveClass("text-danger");
  });
});
