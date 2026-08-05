import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { axe } from "vitest-axe";

import { RadioGroup } from "./index";

const MOCK_OPTIONS = [
  { label: "Option 1", value: "1" },
  { label: "Option 2", value: "2", description: "Desc 2" },
];

describe("RadioGroup", () => {
  it("renders options correctly", () => {
    render(<RadioGroup label="Select one" options={MOCK_OPTIONS} />);
    expect(screen.getByText("Select one")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Option 1/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Option 2/ })).toBeInTheDocument();
    expect(screen.getByText("Desc 2")).toBeInTheDocument();
  });

  it("handles selection changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RadioGroup options={MOCK_OPTIONS} onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: /Option 2/ }));
    expect(onChange).toHaveBeenCalledWith("2");
  });

  it("applies auto-switch correctly based on options count (Micro Spec §6.8)", () => {
    // 2 options -> horizontal doesn't auto-switch
    const { rerender } = render(
      <RadioGroup options={MOCK_OPTIONS} orientation="horizontal" />,
    );
    const group1 = screen.getByTestId("radiogroup-inner");
    expect(group1).toHaveClass("flex-row");
    expect(group1).not.toHaveClass("sm:flex-row");

    // 3 options -> auto-switch
    const MOCK_3 = [...MOCK_OPTIONS, { label: "Option 3", value: "3" }];
    rerender(<RadioGroup options={MOCK_3} orientation="horizontal" />);
    const group2 = screen.getByTestId("radiogroup-inner");
    expect(group2).toHaveClass("flex-col", "sm:flex-row");
  });

  it("is disabled when disabled prop is true", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RadioGroup options={MOCK_OPTIONS} disabled onChange={onChange} />);

    const radio1 = screen.getByRole("radio", { name: /Option 1/ });
    expect(radio1).toBeDisabled();

    await user.click(radio1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports individual option disabling", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const MOCK_DIS = [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2", disabled: true },
    ];
    render(<RadioGroup options={MOCK_DIS} onChange={onChange} />);

    expect(screen.getByRole("radio", { name: /Option 2/ })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /Option 1/ })).not.toBeDisabled();

    await user.click(screen.getByRole("radio", { name: /Option 2/ }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("forwards ref successfully", () => {
    const ref = createRef<HTMLDivElement>();
    render(<RadioGroup ref={ref} options={MOCK_OPTIONS} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getAttribute("role")).toBe("radiogroup");
  });

  it("passes accessibility check", async () => {
    const { container } = render(
      <RadioGroup label="Accessible Radio" options={MOCK_OPTIONS} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
