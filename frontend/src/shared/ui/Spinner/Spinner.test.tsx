import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Spinner } from "./index";

describe("Spinner", () => {
  it("renders correctly with default props", () => {
    render(<Spinner data-testid="spinner" />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute("role", "status");
    expect(spinner).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Loading...")).toHaveClass("sr-only");
  });

  it("renders with custom label", () => {
    render(<Spinner label="Processing" />);
    expect(screen.getByText("Processing")).toBeInTheDocument();
  });

  it("renders without label when label is empty", () => {
    const { container } = render(<Spinner label="" />);
    expect(container.querySelector(".sr-only")).not.toBeInTheDocument();
  });

  it("applies size classes correctly", () => {
    render(<Spinner size="lg" data-testid="spinner-lg" />);
    expect(screen.getByTestId("spinner-lg")).toHaveClass("h-8 w-8");
  });
});
