import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Divider } from "./index";

describe("Divider", () => {
  it("renders horizontal solid by default", () => {
    render(<Divider data-testid="divider" />);
    const divider = screen.getByTestId("divider");
    expect(divider).toHaveAttribute("role", "separator");
    expect(divider).toHaveAttribute("aria-orientation", "horizontal");
    expect(divider.firstChild).toHaveClass("border-solid", "border-t");
  });

  it("renders vertical dashed", () => {
    render(
      <Divider data-testid="divider" orientation="vertical" variant="dashed" />,
    );
    const divider = screen.getByTestId("divider");
    expect(divider).toHaveAttribute("aria-orientation", "vertical");
    expect(divider.firstChild).toHaveClass("border-dashed", "border-l");
  });

  it("renders with a label", () => {
    render(<Divider label="OR" />);
    expect(screen.getByText("OR")).toBeInTheDocument();
  });

  it("renders ring variant with aria-hidden", () => {
    render(<Divider variant="ring" data-testid="ring-divider" />);
    const divider = screen.getByTestId("ring-divider");
    expect(divider).toHaveAttribute("aria-hidden", "true");
    expect(divider).toHaveAttribute("role", "separator");
    // Should have opacity-15 for the subtle signature effect
    expect(divider).toHaveClass("opacity-15");
  });
});
