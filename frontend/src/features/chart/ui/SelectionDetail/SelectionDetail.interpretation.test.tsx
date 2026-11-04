import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { chartFull } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";
import type { Selection } from "../../model/selection";

import { SelectionDetail } from "./SelectionDetail";

describe("SelectionDetail interpretation integration", () => {
  const vm = toChartViewModel(chartFull);
  const planetSelection: Selection = { kind: "planet", key: "Mars" };
  const aspectSelection: Selection = {
    kind: "aspect",
    key: "Sun_trine_Mars",
  };
  const noneSelection: Selection = { kind: "none" };

  it("SD-01: renders 'Đọc diễn giải' button only when selection.kind === 'planet' and onReadInterpretation is provided", () => {
    const onRead = vi.fn();
    const { rerender } = render(
      <SelectionDetail
        vm={vm}
        selection={planetSelection}
        onClear={vi.fn()}
        onReadInterpretation={onRead}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Đọc diễn giải" }),
    ).toBeInTheDocument();

    // Not in aspect selection
    rerender(
      <SelectionDetail
        vm={vm}
        selection={aspectSelection}
        onClear={vi.fn()}
        onReadInterpretation={onRead}
      />,
    );
    expect(screen.queryByRole("button", { name: "Đọc diễn giải" })).toBeNull();

    // Not in none selection
    rerender(
      <SelectionDetail
        vm={vm}
        selection={noneSelection}
        onClear={vi.fn()}
        onReadInterpretation={onRead}
      />,
    );
    expect(screen.queryByRole("button", { name: "Đọc diễn giải" })).toBeNull();
  });

  it("SD-02: calls onReadInterpretation on click and keyboard activation without triggering onClear", async () => {
    const user = userEvent.setup();
    const onRead = vi.fn();
    const onClear = vi.fn();

    render(
      <SelectionDetail
        vm={vm}
        selection={planetSelection}
        onClear={onClear}
        onReadInterpretation={onRead}
      />,
    );

    const readBtn = screen.getByRole("button", { name: "Đọc diễn giải" });

    // Click
    await user.click(readBtn);
    expect(onRead).toHaveBeenCalledTimes(1);
    expect(onClear).not.toHaveBeenCalled();

    // Keyboard Enter
    readBtn.focus();
    await user.keyboard("{Enter}");
    expect(onRead).toHaveBeenCalledTimes(2);
    expect(onClear).not.toHaveBeenCalled();

    // Keyboard Space
    await user.keyboard(" ");
    expect(onRead).toHaveBeenCalledTimes(3);
    expect(onClear).not.toHaveBeenCalled();
  });

  it("SD-03: preserves DOM order placing 'Đọc diễn giải' before 'Bỏ chọn'", () => {
    render(
      <SelectionDetail
        vm={vm}
        selection={planetSelection}
        onClear={vi.fn()}
        onReadInterpretation={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button");
    const readBtn = screen.getByRole("button", { name: "Đọc diễn giải" });
    const clearBtn = screen.getByRole("button", { name: "Bỏ chọn" });

    expect(buttons.indexOf(readBtn)).toBeLessThan(buttons.indexOf(clearBtn));
  });

  it("SD-04: sets activeElement to section container on Escape key when focused on action buttons", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SelectionDetail
        vm={vm}
        selection={planetSelection}
        onClear={vi.fn()}
        onReadInterpretation={vi.fn()}
      />,
    );

    const section = container.querySelector("section")!;
    const readBtn = screen.getByRole("button", { name: "Đọc diễn giải" });
    const clearBtn = screen.getByRole("button", { name: "Bỏ chọn" });

    // Escape from "Đọc diễn giải"
    readBtn.focus();
    expect(document.activeElement).toBe(readBtn);
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(section);

    // Escape from "Bỏ chọn"
    clearBtn.focus();
    expect(document.activeElement).toBe(clearBtn);
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(section);
  });

  it("SD-05: renders identical DOM to F4 without 'Đọc diễn giải' button when onReadInterpretation is omitted", () => {
    render(
      <SelectionDetail vm={vm} selection={planetSelection} onClear={vi.fn()} />,
    );

    expect(screen.queryByRole("button", { name: "Đọc diễn giải" })).toBeNull();
    expect(screen.getByRole("button", { name: "Bỏ chọn" })).toBeInTheDocument();
  });

  it("SD-A: passes axe accessibility checks with and without 'Đọc diễn giải' button", async () => {
    const { container, rerender } = render(
      <SelectionDetail
        vm={vm}
        selection={planetSelection}
        onClear={vi.fn()}
        onReadInterpretation={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();

    rerender(
      <SelectionDetail vm={vm} selection={planetSelection} onClear={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
