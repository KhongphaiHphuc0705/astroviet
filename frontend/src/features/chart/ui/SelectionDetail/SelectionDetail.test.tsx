import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { chartFull } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";

import { SelectionDetail } from "./SelectionDetail";

describe("SelectionDetail (M8 Task 2: SD1 - SD6)", () => {
  const fullVM = toChartViewModel(chartFull);

  it("SD1: renders empty instruction state when selection is none", () => {
    render(
      <SelectionDetail
        selection={{ kind: "none" }}
        vm={fullVM}
        onClear={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Chọn một hành tinh hoặc góc chiếu để xem chi tiết."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bỏ chọn" })).toBeNull();
  });

  it("SD2: renders planet details and clear button when planet is selected", () => {
    const onClear = vi.fn();
    render(
      <SelectionDetail
        selection={{ kind: "planet", key: "Sun" }}
        vm={fullVM}
        onClear={onClear}
      />,
    );

    const sun = fullVM.planets.find((p) => p.key === "Sun")!;
    expect(screen.getByText(sun.nameVi)).toBeInTheDocument();
    expect(screen.getByText(sun.sign.labelVi)).toBeInTheDocument();
    expect(screen.getByText(sun.degreeLabel!)).toBeInTheDocument();
    if (sun.houseNumber !== null) {
      expect(screen.getByText(`Nhà ${sun.houseNumber}`)).toBeInTheDocument();
    }

    const clearBtn = screen.getByRole("button", { name: "Bỏ chọn" });
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("SD3: renders retrograde badge when selected planet is retrograde", () => {
    const retroPlanet = fullVM.planets.find((p) => p.isRetrograde);
    if (!retroPlanet) return;

    render(
      <SelectionDetail
        selection={{ kind: "planet", key: retroPlanet.key }}
        vm={fullVM}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByText("Nghịch hành")).toBeInTheDocument();
  });

  it("SD4: renders aspect details when aspect is selected", () => {
    const aspect = fullVM.aspects[0]!;
    const onClear = vi.fn();

    render(
      <SelectionDetail
        selection={{ kind: "aspect", key: aspect.key }}
        vm={fullVM}
        onClear={onClear}
      />,
    );

    expect(
      screen.getByText(`${aspect.planetA.labelVi} – ${aspect.planetB.labelVi}`),
    ).toBeInTheDocument();
    expect(screen.getByText(aspect.nature.labelVi)).toBeInTheDocument();
    expect(screen.getByText(aspect.applyingLabelVi)).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: "Bỏ chọn" });
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("SD5: clicking clear button calls onClear callback", () => {
    const onClear = vi.fn();
    render(
      <SelectionDetail
        selection={{ kind: "planet", key: "Moon" }}
        vm={fullVM}
        onClear={onClear}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Bỏ chọn" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("SD6: falls back to empty instruction state when key is missing in vm", () => {
    render(
      <SelectionDetail
        selection={{ kind: "planet", key: "NonExistent" }}
        vm={fullVM}
        onClear={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Chọn một hành tinh hoặc góc chiếu để xem chi tiết."),
    ).toBeInTheDocument();

    render(
      <SelectionDetail
        selection={{ kind: "aspect", key: "NonExistent:Aspect" }}
        vm={fullVM}
        onClear={vi.fn()}
      />,
    );

    expect(
      screen.getAllByText("Chọn một hành tinh hoặc góc chiếu để xem chi tiết."),
    ).toHaveLength(2);
  });
});
