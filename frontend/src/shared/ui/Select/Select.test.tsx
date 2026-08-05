import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { axe } from "vitest-axe";

import { Select } from "./index";

const MOCK_OPTIONS = [
  { label: "Option 1", value: "1" },
  { label: "Option 2", value: "2" },
  { label: "Option 3", value: "3", disabled: true },
];

describe("Select", () => {
  it("renders with placeholder", () => {
    render(<Select options={MOCK_OPTIONS} placeholder="Choose something" />);
    // Verify native select has placeholder
    expect(screen.getByTestId("native-select")).toHaveValue("");
    // Verify custom combobox displays placeholder
    expect(screen.getByTestId("combobox-trigger")).toHaveTextContent(
      "Choose something",
    );
  });

  it("handles native select changes", () => {
    const onChange = vi.fn();
    render(<Select options={MOCK_OPTIONS} onChange={onChange} />);

    const nativeSelect = screen.getByTestId("native-select");
    fireEvent.change(nativeSelect, { target: { value: "2" } });

    expect(onChange).toHaveBeenCalledWith("2");
  });

  it("toggles listbox on click and handles custom selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select options={MOCK_OPTIONS} onChange={onChange} />);

    const trigger = screen.getByTestId("combobox-trigger");
    expect(screen.queryByTestId("combobox-listbox")).not.toBeInTheDocument();

    // Open
    await user.click(trigger);
    expect(screen.getByTestId("combobox-listbox")).toBeInTheDocument();

    // Select Option 2
    const listbox = screen.getByTestId("combobox-listbox");
    await user.click(within(listbox).getByRole("option", { name: "Option 2" }));
    expect(onChange).toHaveBeenCalledWith("2");

    // Auto closes after selection
    expect(screen.queryByTestId("combobox-listbox")).not.toBeInTheDocument();
  });

  it("does not select disabled options in custom listbox", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select options={MOCK_OPTIONS} onChange={onChange} />);

    await user.click(screen.getByTestId("combobox-trigger"));
    const listbox = screen.getByTestId("combobox-listbox");
    await user.click(within(listbox).getByRole("option", { name: "Option 3" }));

    expect(onChange).not.toHaveBeenCalled();
    // Doesn't close on disabled click
    expect(screen.getByTestId("combobox-listbox")).toBeInTheDocument();
  });

  it("supports keyboard toggle via Enter/Space", async () => {
    const user = userEvent.setup();
    render(<Select options={MOCK_OPTIONS} />);

    const trigger = screen.getByTestId("combobox-trigger");
    trigger.focus();

    await user.keyboard("[Enter]");
    expect(screen.getByTestId("combobox-listbox")).toBeInTheDocument();

    await user.keyboard("[Escape]");
    expect(screen.queryByTestId("combobox-listbox")).not.toBeInTheDocument();
  });

  it("is fully disabled when disabled prop is true", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select options={MOCK_OPTIONS} disabled onChange={onChange} />);

    const nativeSelect = screen.getByTestId("native-select");
    expect(nativeSelect).toBeDisabled();

    const trigger = screen.getByTestId("combobox-trigger");
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(screen.queryByTestId("combobox-listbox")).not.toBeInTheDocument();
  });

  it("forwards ref successfully to the combobox button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Select ref={ref} options={MOCK_OPTIONS} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("BUTTON");
  });

  it("passes accessibility check in closed state", async () => {
    const { container } = render(
      <Select label="Accessible Select" options={MOCK_OPTIONS} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
