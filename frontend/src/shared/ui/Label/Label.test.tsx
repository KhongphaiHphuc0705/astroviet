import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Label } from "./index";

describe("Label", () => {
  it("renders children correctly", () => {
    render(<Label htmlFor="test-input">Test Label</Label>);
    const label = screen.getByText("Test Label");
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", "test-input");
  });

  it("renders required asterisk when required is true", () => {
    render(
      <Label htmlFor="test-input" required>
        Test Label
      </Label>,
    );
    // Find by text because the * is inside a span
    const asterisk = screen.getByText("*");
    expect(asterisk).toBeInTheDocument();
    expect(asterisk).toHaveClass("text-danger");
    expect(asterisk).toHaveAttribute("aria-hidden", "true");
  });

  it("renders optional text when optional is true", () => {
    render(
      <Label htmlFor="test-input" optional>
        Test Label
      </Label>,
    );
    const optionalText = screen.getByText("(Tùy chọn)");
    expect(optionalText).toBeInTheDocument();
    expect(optionalText).toHaveClass("text-muted");
  });
});
