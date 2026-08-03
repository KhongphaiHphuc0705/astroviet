import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { Checkbox } from "./index";

describe("Checkbox", () => {
  it("renders unchecked by default", () => {
    render(<Checkbox label="Ghi nhớ" />);
    const checkbox = screen.getByLabelText("Ghi nhớ");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("toggles state on click and spacebar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Ghi nhớ" onChange={onChange} />);

    const checkbox = screen.getByLabelText("Ghi nhớ");

    // Click
    await user.click(checkbox);
    expect(onChange).toHaveBeenCalledTimes(1);

    // Spacebar
    await user.keyboard("[Space]");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("handles indeterminate state via DOM property", () => {
    render(<Checkbox label="Ghi nhớ" indeterminate />);
    const checkbox = screen.getByLabelText("Ghi nhớ") as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
  });

  it("is disabled when disabled prop is true", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Ghi nhớ" disabled onChange={onChange} />);

    const checkbox = screen.getByLabelText("Ghi nhớ");
    expect(checkbox).toBeDisabled();

    await user.click(checkbox);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders description and hit-area properly", () => {
    render(<Checkbox label="Ghi nhớ" description="Lưu 30 ngày" />);
    expect(screen.getByText("Lưu 30 ngày")).toBeInTheDocument();

    // Check hit area classes
    const checkbox = screen.getByLabelText("Ghi nhớ");
    expect(checkbox).toHaveClass("h-[44px]", "w-[44px]");
  });
});
