import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { chartFull, chartNoHouses } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";
import { buildInterpretationModel } from "../../model/interpretation";

import {
  InterpretationPanel,
  type InterpretationPanelHandle,
} from "./InterpretationPanel";

function build(dto: typeof chartFull) {
  const vm = toChartViewModel(dto);
  return { vm, model: buildInterpretationModel(dto, vm) };
}

describe("InterpretationPanel selection & navigation", () => {
  it("PS-01: highlights and expands the selected item when selectedPlanetKey is set", () => {
    const { vm, model } = build(chartFull);
    // Mars is in the planets group, which starts collapsed
    render(
      <InterpretationPanel vm={vm} model={model} selectedPlanetKey="Mars" />,
    );

    const marsButton = screen.getByRole("button", {
      name: /^Sao Hỏa/,
    });
    expect(marsButton).toHaveAttribute("aria-current", "true");
    expect(marsButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Đang chọn")).toBeInTheDocument();
  });

  it("PS-02: [O-2/A] allows user to collapse the currently selected item, and expands it again when re-selected", async () => {
    const user = userEvent.setup();
    const { vm, model } = build(chartFull);
    const { rerender } = render(
      <InterpretationPanel vm={vm} model={model} selectedPlanetKey="Mars" />,
    );

    const marsButton = screen.getByRole("button", {
      name: /^Sao Hỏa/,
    });
    expect(marsButton).toHaveAttribute("aria-expanded", "true");

    // User collapses the item
    await user.click(marsButton);
    expect(marsButton).toHaveAttribute("aria-expanded", "false");

    // Same selectedPlanetKey does not re-force expansion on rerender
    rerender(
      <InterpretationPanel vm={vm} model={model} selectedPlanetKey="Mars" />,
    );
    expect(marsButton).toHaveAttribute("aria-expanded", "false");

    // Deselect
    rerender(
      <InterpretationPanel vm={vm} model={model} selectedPlanetKey={null} />,
    );
    expect(marsButton).toHaveAttribute("aria-expanded", "false");

    // Select again -> expands
    rerender(
      <InterpretationPanel vm={vm} model={model} selectedPlanetKey="Mars" />,
    );
    expect(marsButton).toHaveAttribute("aria-expanded", "true");
  });

  it("PS-03: transfers active badge when selection changes and retains previously opened items", () => {
    const { vm, model } = build(chartFull);
    const { rerender } = render(
      <InterpretationPanel vm={vm} model={model} selectedPlanetKey="Sun" />,
    );

    const sunButton = screen.getByRole("button", { name: /^Mặt Trời/ });
    expect(sunButton).toHaveAttribute("aria-current", "true");
    expect(sunButton).toHaveAttribute("aria-expanded", "true");

    // Change selection to Mars
    rerender(
      <InterpretationPanel vm={vm} model={model} selectedPlanetKey="Mars" />,
    );

    const marsButton = screen.getByRole("button", { name: /^Sao Hỏa/ });
    expect(marsButton).toHaveAttribute("aria-current", "true");
    expect(marsButton).toHaveAttribute("aria-expanded", "true");

    // Sun is no longer active, but remains expanded
    expect(sunButton).not.toHaveAttribute("aria-current");
    expect(sunButton).toHaveAttribute("aria-expanded", "true");
  });

  it("PS-04: clears active badge when selectedPlanetKey becomes null while keeping expanded items open", () => {
    const { vm, model } = build(chartFull);
    const { rerender } = render(
      <InterpretationPanel vm={vm} model={model} selectedPlanetKey="Mars" />,
    );

    const marsButton = screen.getByRole("button", { name: /^Sao Hỏa/ });
    expect(marsButton).toHaveAttribute("aria-current", "true");

    rerender(
      <InterpretationPanel vm={vm} model={model} selectedPlanetKey={null} />,
    );

    expect(marsButton).not.toHaveAttribute("aria-current");
    expect(marsButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText("Đang chọn")).toBeNull();
  });

  it("PS-05: ignores keys outside 10 MVP bodies without errors or unexpected expansion", () => {
    const { vm, model } = build(chartFull);
    render(
      <InterpretationPanel
        vm={vm}
        model={model}
        selectedPlanetKey={"Chiron" as never}
      />,
    );

    expect(screen.queryByText("Đang chọn")).toBeNull();
  });

  it("PS-06: safely handles unavailable states (S-03 and S-08) without errors", () => {
    const { vm } = build(chartFull);
    const unpublished = buildInterpretationModel(
      { ...chartFull, interpretations: [], interpretationVersion: null },
      vm,
    );
    render(
      <InterpretationPanel
        vm={vm}
        model={unpublished}
        selectedPlanetKey="Mars"
      />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Đang chọn")).toBeNull();
  });

  it("PS-07: marks and expands an item even when some parts are missing", () => {
    const { vm, model } = build(chartNoHouses);
    render(
      <InterpretationPanel vm={vm} model={model} selectedPlanetKey="Mars" />,
    );

    const marsButton = screen.getByRole("button", { name: /^Sao Hỏa/ });
    expect(marsButton).toHaveAttribute("aria-current", "true");
    expect(marsButton).toHaveAttribute("aria-expanded", "true");
  });

  it("PS-08: expands and moves focus to the target item button via ref.revealItem", () => {
    const { vm, model } = build(chartFull);
    const ref = createRef<InterpretationPanelHandle>();
    render(<InterpretationPanel ref={ref} vm={vm} model={model} />);

    const marsButton = screen.getByRole("button", { name: /^Sao Hỏa/ });
    expect(marsButton).toHaveAttribute("aria-expanded", "false");

    let result = false;
    act(() => {
      result = ref.current?.revealItem("Mars") ?? false;
    });

    expect(result).toBe(true);
    expect(marsButton).toHaveAttribute("aria-expanded", "true");
    expect(document.activeElement).toBe(marsButton);
  });

  it("PS-09: returns false from revealItem when target is invalid or absent without moving focus", () => {
    const { vm, model } = build(chartFull);
    const ref = createRef<InterpretationPanelHandle>();
    render(<InterpretationPanel ref={ref} vm={vm} model={model} />);

    const result1 = ref.current?.revealItem("Chiron");
    expect(result1).toBe(false);

    const result2 = ref.current?.revealItem("");
    expect(result2).toBe(false);
  });

  it("PS-10: returns false from revealItem when model removes item on rerender", () => {
    const { vm, model } = build(chartFull);
    const ref = createRef<InterpretationPanelHandle>();
    const { rerender } = render(
      <InterpretationPanel ref={ref} vm={vm} model={model} />,
    );

    // Rerender with empty groups
    const emptyModel = {
      ...model,
      itemsById: {},
      groups: [],
    };
    rerender(<InterpretationPanel ref={ref} vm={vm} model={emptyModel} />);

    expect(ref.current?.revealItem("Mars")).toBe(false);
  });

  it("PS-11: passes onViewOnChart only to planet items, omitting it on Ascendant", () => {
    const { vm, model } = build(chartFull);
    const onViewOnChart = vi.fn();
    render(
      <InterpretationPanel
        vm={vm}
        model={model}
        onViewOnChart={onViewOnChart}
      />,
    );

    // Core group is expanded by default
    // Mặt Trời (planet) has "Xem trên biểu đồ"
    expect(
      screen.getByRole("button", { name: "Xem trên biểu đồ: Mặt Trời" }),
    ).toBeInTheDocument();

    // Cung Mọc (angle) does NOT have "Xem trên biểu đồ"
    expect(
      screen.queryByRole("button", { name: /Xem trên biểu đồ: Cung Mọc/ }),
    ).toBeNull();
  });

  it("PS-12: executes revealItem synchronously and shifts focus immediately without waiting for timers", () => {
    const { vm, model } = build(chartFull);
    const ref = createRef<InterpretationPanelHandle>();
    render(<InterpretationPanel ref={ref} vm={vm} model={model} />);

    const marsButton = screen.getByRole("button", { name: /^Sao Hỏa/ });
    expect(document.activeElement).not.toBe(marsButton);

    act(() => {
      ref.current?.revealItem("Mars");
    });

    expect(document.activeElement).toBe(marsButton);
    expect(marsButton).toHaveAttribute("aria-expanded", "true");
  });

  it("PS-A: passes axe accessibility checks with and without selection", async () => {
    const { vm, model } = build(chartFull);
    const { container, rerender } = render(
      <InterpretationPanel
        vm={vm}
        model={model}
        selectedPlanetKey="Mars"
        onViewOnChart={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();

    rerender(
      <InterpretationPanel
        vm={vm}
        model={model}
        selectedPlanetKey={null}
        onViewOnChart={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
