import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { axe } from "vitest-axe";

import { Switch } from "./index";

describe("Switch", () => {
  it("renders unchecked by default", () => {
    render(<Switch label="Bật thông báo" />);
    const switchEl = screen.getByLabelText("Bật thông báo");
    expect(switchEl).toBeInTheDocument();
    expect(switchEl).not.toBeChecked();
    expect(switchEl).toHaveAttribute("role", "switch");
  });

  it("toggles state on click and spacebar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Bật thông báo" onChange={onChange} />);

    const switchEl = screen.getByLabelText("Bật thông báo");

    // Click
    await user.click(switchEl);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(switchEl).toBeChecked();

    // Spacebar
    await user.keyboard("[Space]");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(switchEl).not.toBeChecked();

    // Enter
    await user.keyboard("[Enter]");
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(switchEl).toBeChecked();
  });

  it("renders size sm and description correctly", () => {
    render(
      <Switch
        label="Size test"
        size="sm"
        description="This is a small switch"
      />,
    );
    expect(screen.getByText("This is a small switch")).toBeInTheDocument();
    const switchEl = screen.getByLabelText("Size test");
    const track = switchEl.nextElementSibling;
    expect(track).toHaveClass("h-5", "w-10");
  });

  it("is disabled when disabled prop is true", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Bật thông báo" disabled onChange={onChange} />);

    const switchEl = screen.getByLabelText("Bật thông báo");
    expect(switchEl).toBeDisabled();

    await user.click(switchEl);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("passes accessibility with aria-label (no text label)", async () => {
    const { container } = render(<Switch aria-label="Theme toggle" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("passes accessibility with text label", async () => {
    const { container } = render(<Switch label="Bật thông báo" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
