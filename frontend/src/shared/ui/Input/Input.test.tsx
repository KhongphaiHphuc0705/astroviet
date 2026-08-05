import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { axe } from "vitest-axe";

import { Input } from "./index";

describe("Input", () => {
  it("renders correctly with label", () => {
    render(<Input label="Username" placeholder="Enter username" />);
    const inputEl = screen.getByLabelText("Username");
    expect(inputEl).toBeInTheDocument();
    expect(inputEl).toHaveAttribute("placeholder", "Enter username");
  });

  it("forwards ref successfully and focuses", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input label="Username" ref={ref} />);

    expect(ref.current).not.toBeNull();
    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });

  it("renders error state and message", () => {
    render(<Input label="Username" error="Invalid username" />);
    const inputEl = screen.getByLabelText("Username");

    expect(inputEl).toHaveAttribute("aria-invalid", "true");
    const wrapper = inputEl.parentElement;
    expect(wrapper).toHaveClass("border-danger");

    const errorText = screen.getByText("Invalid username");
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveClass("text-danger");
  });

  it("renders success state", () => {
    render(<Input label="Username" success />);
    const inputEl = screen.getByLabelText("Username");
    const wrapper = inputEl.parentElement;
    expect(wrapper).toHaveClass("border-success");
  });

  it("renders sizes and variants correctly", () => {
    const { rerender } = render(
      <Input label="Input" size="sm" variant="filled" />,
    );
    let wrapper = screen.getByLabelText("Input").parentElement;
    expect(wrapper).toHaveClass("h-9", "bg-canvas");

    rerender(<Input label="Input" size="lg" variant="default" />);
    wrapper = screen.getByLabelText("Input").parentElement;
    expect(wrapper).toHaveClass("h-14", "bg-surface");
  });

  it("renders adornments", () => {
    render(
      <Input
        label="Money"
        leftAdornment={<span>$</span>}
        rightAdornment={<span>.00</span>}
      />,
    );
    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText(".00")).toBeInTheDocument();
  });

  it("distinguishes disabled and readOnly", async () => {
    const user = userEvent.setup();

    // Disabled test
    const { rerender } = render(
      <Input label="Test" disabled data-testid="test-input" />,
    );
    const disabledInput = screen.getByTestId("test-input");
    expect(disabledInput).toBeDisabled();
    expect(disabledInput).not.toHaveAttribute("readonly");

    // Attempt typing
    await user.type(disabledInput, "abc");
    expect(disabledInput).toHaveValue("");

    // ReadOnly test
    rerender(<Input label="Test" readOnly data-testid="test-input" />);
    const readOnlyInput = screen.getByTestId("test-input");

    // Key distinction: readOnly is NOT technically "disabled" in DOM forms
    expect(readOnlyInput).not.toBeDisabled();
    expect(readOnlyInput).toHaveAttribute("readonly");

    // Attempt typing
    await user.type(readOnlyInput, "abc");
    expect(readOnlyInput).toHaveValue("");
  });

  it("passes accessibility with text label", async () => {
    const { container } = render(
      <Input label="Username" helperText="Enter your name" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("passes accessibility with aria-label (no text label)", async () => {
    const { container } = render(
      <Input aria-label="Search" placeholder="Search..." />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
