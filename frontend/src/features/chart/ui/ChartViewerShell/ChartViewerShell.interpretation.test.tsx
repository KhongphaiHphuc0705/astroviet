import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { chartFull, chartNoHouses } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";
import { buildInterpretationModel } from "../../model/interpretation";

import { ChartViewerShell } from "./ChartViewerShell";

describe("ChartViewerShell interpretation integration", () => {
  it("keeps the panel optional for existing F4 callers", () => {
    render(<ChartViewerShell vm={toChartViewModel(chartFull)} />);
    expect(screen.queryByRole("region", { name: "Diễn giải" })).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Vị trí hành tinh" }),
    ).toBeInTheDocument();
  });

  it("renders interpretation after the existing chart tables", () => {
    render(
      <ChartViewerShell
        vm={toChartViewModel(chartFull)}
        interpretation={buildInterpretationModel(
          chartFull,
          toChartViewModel(chartFull),
        )}
      />,
    );
    const tables = document.getElementById("chart-data-tables");
    const panel = screen.getByRole("region", { name: "Diễn giải" });
    expect(tables?.compareDocumentPosition(panel)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(
      screen.getByRole("heading", { name: "Biểu đồ lá số" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Chiêm tinh là một góc nhìn để bạn khám phá và suy ngẫm về bản thân, không phải kết luận tuyệt đối về con người hay tương lai. Hãy đón nhận những nội dung phù hợp với trải nghiệm của chính bạn.",
      ),
    ).toBeInTheDocument();
  });

  it("SH-03: selecting a planet in chart does not change interpretation panel state", () => {
    render(
      <ChartViewerShell
        vm={toChartViewModel(chartFull)}
        interpretation={buildInterpretationModel(
          chartFull,
          toChartViewModel(chartFull),
        )}
      />,
    );
    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const sunItemToggle = within(panel).getByRole("button", {
      name: /^Mặt Trời/,
    });
    expect(sunItemToggle).toHaveAttribute("aria-expanded", "true");

    const selectSunBtn = screen.getByRole("button", { name: "Chọn Mặt Trời" });
    fireEvent.click(selectSunBtn);

    expect(screen.getByRole("button", { name: "Bỏ chọn" })).toBeInTheDocument();
    expect(sunItemToggle).toHaveAttribute("aria-expanded", "true");
  });

  it("SH-04: toggling interpretation panel items does not mutate or trigger chart selection", () => {
    render(
      <ChartViewerShell
        vm={toChartViewModel(chartFull)}
        interpretation={buildInterpretationModel(
          chartFull,
          toChartViewModel(chartFull),
        )}
      />,
    );
    expect(screen.queryByRole("button", { name: "Bỏ chọn" })).toBeNull();

    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const sunItemToggle = within(panel).getByRole("button", {
      name: /^Mặt Trời/,
    });
    fireEvent.click(sunItemToggle);
    expect(sunItemToggle).toHaveAttribute("aria-expanded", "false");

    expect(screen.queryByRole("button", { name: "Bỏ chọn" })).toBeNull();
  });

  it("D5-H01: F-Full does not render house data notice inside interpretation panel", () => {
    const vm = toChartViewModel(chartFull);
    const interpretation = buildInterpretationModel(chartFull, vm);
    render(<ChartViewerShell vm={vm} interpretation={interpretation} />);

    const panel = screen.getByRole("region", { name: "Diễn giải" });
    expect(within(panel).queryByText(/Dữ liệu Nhà/i)).toBeNull();
  });

  it("D5-H02: F-NoHouse renders exactly one house notice in panel without mentioning birth time or latitude, keeping F4 notice distinct", () => {
    const vm = toChartViewModel(chartNoHouses);
    const interpretation = buildInterpretationModel(chartNoHouses, vm);
    render(<ChartViewerShell vm={vm} interpretation={interpretation} />);

    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const panelHouseNotice = within(panel).getByText(
      "Dữ liệu Nhà và một số góc trong lá số này chưa khả dụng. Bạn vẫn có thể xem các diễn giải theo cung.",
    );
    expect(panelHouseNotice).toBeInTheDocument();
    expect(panel.textContent).not.toMatch(/giờ sinh|birth|vĩ độ|latitude/i);

    const f4Notice = screen.getByText("Dữ liệu Nhà và các góc chưa khả dụng");
    expect(panel.contains(f4Notice)).toBe(false);
  });

  it("D5-A03: F-NoHouse M4 regression - selecting planet marks and expands item, Read Interpretation focuses header, Escape clears selection, Ascendant never selected", () => {
    const scrollToSpy = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});
    const scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;

    const vm = toChartViewModel(chartNoHouses);
    const interpretation = buildInterpretationModel(chartNoHouses, vm);
    render(<ChartViewerShell vm={vm} interpretation={interpretation} />);

    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const sunHeaderBtn = within(panel).getByRole("button", {
      name: /^Mặt Trời/,
    });
    const ascendantHeaderBtn = within(panel).getByRole("button", {
      name: /^Cung Mọc/,
    });

    expect(sunHeaderBtn).toHaveAttribute("aria-expanded", "true");
    expect(sunHeaderBtn).not.toHaveAttribute("aria-current");
    expect(ascendantHeaderBtn).not.toHaveAttribute("aria-current");

    const tableSunBtn = screen.getByRole("button", { name: "Chọn Mặt Trời" });
    tableSunBtn.focus();
    fireEvent.click(tableSunBtn);

    expect(document.activeElement).toBe(tableSunBtn);
    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();

    expect(sunHeaderBtn).toHaveAttribute("aria-current", "true");
    expect(within(panel).getByText("Đang chọn")).toBeInTheDocument();
    expect(sunHeaderBtn).toHaveAttribute("aria-expanded", "true");
    expect(ascendantHeaderBtn).not.toHaveAttribute("aria-current");

    const readBtn = screen.getByRole("button", { name: "Đọc diễn giải" });
    fireEvent.click(readBtn);

    expect(document.activeElement).toBe(sunHeaderBtn);

    const shell = screen.getByTestId("chart-viewer-shell");
    fireEvent.keyDown(shell, { key: "Escape" });

    expect(screen.queryByRole("button", { name: "Bỏ chọn" })).toBeNull();
    expect(sunHeaderBtn).not.toHaveAttribute("aria-current");

    scrollToSpy.mockRestore();
  });

  it("D5-M01: F-NoHouse, F-NullEmpty, and F-MoonEdge never render speculative uncertainty or boundary disclaimers around Moon", () => {
    // 1. F-NoHouse
    const vmNoHouses = toChartViewModel(chartNoHouses);
    const interpNoHouses = buildInterpretationModel(chartNoHouses, vmNoHouses);
    const { container: containerNoHouses, unmount: unmount1 } = render(
      <ChartViewerShell vm={vmNoHouses} interpretation={interpNoHouses} />,
    );
    expect(containerNoHouses.textContent).not.toMatch(
      /bất định|không chắc|ranh giới|uncertain/i,
    );
    unmount1();

    // 2. F-NullEmpty
    const nullEmptyDto = {
      ...chartFull,
      interpretationVersion: null,
      interpretations: [],
    };
    const vmNullEmpty = toChartViewModel(nullEmptyDto);
    const interpNullEmpty = buildInterpretationModel(nullEmptyDto, vmNullEmpty);
    const { container: containerNullEmpty, unmount: unmount2 } = render(
      <ChartViewerShell vm={vmNullEmpty} interpretation={interpNullEmpty} />,
    );
    expect(containerNullEmpty.textContent).not.toMatch(
      /bất định|không chắc|ranh giới|uncertain/i,
    );
    unmount2();

    // 3. F-MoonEdge: Moon positioned close to sign boundary (e.g. 29.99 degrees)
    const moonEdgeDto = {
      ...chartFull,
      planets: chartFull.planets.map((planet) =>
        planet.name === "Moon"
          ? {
              ...planet,
              longitude: 29.99,
              sign: "Aries" as const,
              degreeInSign: 29.99,
            }
          : planet,
      ),
    };
    const vmMoonEdge = toChartViewModel(moonEdgeDto);
    const interpMoonEdge = buildInterpretationModel(moonEdgeDto, vmMoonEdge);
    const { container: containerMoonEdge, unmount: unmount3 } = render(
      <ChartViewerShell vm={vmMoonEdge} interpretation={interpMoonEdge} />,
    );

    const moonSection = screen
      .getByRole("button", { name: /^Mặt Trăng/ })
      .closest("article")!;
    expect(moonSection.textContent).not.toMatch(
      /bất định|không chắc|ranh giới|uncertain/i,
    );
    expect(containerMoonEdge.textContent).not.toMatch(
      /bất định|không chắc|ranh giới|uncertain/i,
    );
    unmount3();
  });
});
