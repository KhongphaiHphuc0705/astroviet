import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { axe } from "vitest-axe";

import { Textarea } from "./index";

describe("Textarea", () => {
  it("renders correctly with label", () => {
    render(<Textarea label="Bio" placeholder="Enter bio" />);
    const textareaEl = screen.getByLabelText("Bio");
    expect(textareaEl).toBeInTheDocument();
    expect(textareaEl).toHaveAttribute("placeholder", "Enter bio");
  });

  it("forwards ref successfully and focuses", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea label="Bio" ref={ref} />);

    expect(ref.current).not.toBeNull();
    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });

  it("renders error state and message", () => {
    render(<Textarea label="Bio" error="Too short" />);
    const textareaEl = screen.getByLabelText("Bio");

    expect(textareaEl).toHaveAttribute("aria-invalid", "true");
    const wrapper = textareaEl.parentElement;
    expect(wrapper).toHaveClass("border-danger");

    const errorText = screen.getByText("Too short");
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveClass("text-danger");
  });

  it("displays character count with aria-live polite when maxLength is provided", async () => {
    const user = userEvent.setup();
    render(<Textarea label="Bio" maxLength={100} />);

    const counter = screen.getByText("0 / 100");
    expect(counter).toBeInTheDocument();
    expect(counter).toHaveAttribute("aria-live", "polite");

    const textareaEl = screen.getByLabelText("Bio");
    await user.type(textareaEl, "Hello");

    expect(screen.getByText("5 / 100")).toBeInTheDocument();
  });

  it("handles autoResize explicitly provided", () => {
    render(<Textarea label="Bio" autoResize />);
    const textareaEl = screen.getByLabelText("Bio");
    expect(textareaEl).toHaveClass("resize-none", "overflow-hidden");
  });

  it("passes accessibility check", async () => {
    const { container } = render(
      <Textarea
        label="Bio"
        helperText="Tell us about yourself"
        maxLength={500}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
