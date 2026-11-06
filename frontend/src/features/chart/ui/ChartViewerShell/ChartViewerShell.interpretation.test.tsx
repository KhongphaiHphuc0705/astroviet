import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

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
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    const scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;

    try {
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

      // Verify "Bỏ chọn" button exists and is visible before pressing Escape
      expect(
        screen.getByRole("button", { name: "Bỏ chọn" }),
      ).toBeInTheDocument();

      const shell = screen.getByTestId("chart-viewer-shell");
      fireEvent.keyDown(shell, { key: "Escape" });

      expect(screen.queryByRole("button", { name: "Bỏ chọn" })).toBeNull();
      expect(sunHeaderBtn).not.toHaveAttribute("aria-current");
    } finally {
      Element.prototype.scrollIntoView = originalScrollIntoView;
      scrollToSpy.mockRestore();
    }
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

    // 3. F-MoonEdge: Moon positioned close to sign boundary in Aquarius (degreeInSign 29.99°, longitude 329.99°)
    // Aquarius spans 300°..330°, so 29.99° in Aquarius is 329.99° longitude.
    // Preserving Moon_in_Aquarius ensures Moon interpretation is rendered and tested.
    const moonEdgeDto = {
      ...chartFull,
      planets: chartFull.planets.map((planet) =>
        planet.name === "Moon"
          ? {
              ...planet,
              longitude: 329.99,
              sign: "Aquarius" as const,
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

    // Affirmative assertion: Moon interpretation content is actively displayed
    expect(moonSection.textContent).toMatch(/Mặt Trăng ở Bảo Bình/i);
    expect(moonSection.textContent).not.toMatch(
      /Chưa có nội dung cho mục này/i,
    );

    // Negative assertions: No speculative uncertainty or boundary disclaimers
    expect(moonSection.textContent).not.toMatch(
      /bất định|không chắc|ranh giới|uncertain/i,
    );
    expect(containerMoonEdge.textContent).not.toMatch(
      /bất định|không chắc|ranh giới|uncertain/i,
    );
    unmount3();
  });

  it("A6-H01: heading hierarchy is continuous and has no level skips across S-02, S-05, and S-03", () => {
    function assertContinuousHierarchy(container: HTMLElement) {
      const headings = Array.from(
        container.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      ) as HTMLElement[];
      expect(headings.length).toBeGreaterThan(0);

      const levels = headings.map((h) => parseInt(h.tagName.substring(1), 10));

      // First heading must be level 1 (h1)
      expect(levels[0]).toBe(1);

      // No level skips: level[i] <= level[i-1] + 1
      for (let i = 1; i < levels.length; i++) {
        const current = levels[i]!;
        const prev = levels[i - 1]!;
        expect(
          current <= prev + 1,
          `Heading level jumped from h${prev} to h${current} at index ${i} (${headings[i]?.textContent?.trim()})`,
        ).toBe(true);
      }
    }

    // 1. S-02: Full chart with houses & interpretation
    const vmFull = toChartViewModel(chartFull);
    const interpFull = buildInterpretationModel(chartFull, vmFull);
    const { container: containerS02, unmount: unmountS02 } = render(
      <div>
        <h1 tabIndex={-1}>Lá số sinh</h1>
        <ChartViewerShell vm={vmFull} interpretation={interpFull} />
      </div>,
    );
    assertContinuousHierarchy(containerS02);
    unmountS02();

    // 2. S-05: Degraded chart without house data
    const vmNoHouses = toChartViewModel(chartNoHouses);
    const interpNoHouses = buildInterpretationModel(chartNoHouses, vmNoHouses);
    const { container: containerS05, unmount: unmountS05 } = render(
      <div>
        <h1 tabIndex={-1}>Lá số sinh</h1>
        <ChartViewerShell vm={vmNoHouses} interpretation={interpNoHouses} />
      </div>,
    );
    assertContinuousHierarchy(containerS05);
    unmountS05();

    // 3. S-03: Degraded chart with unavailable interpretation
    const unavailDto = {
      ...chartFull,
      interpretationVersion: null,
      interpretations: [],
    };
    const vmUnavail = toChartViewModel(unavailDto);
    const interpUnavail = buildInterpretationModel(unavailDto, vmUnavail);
    const { container: containerS03, unmount: unmountS03 } = render(
      <div>
        <h1 tabIndex={-1}>Lá số sinh</h1>
        <ChartViewerShell vm={vmUnavail} interpretation={interpUnavail} />
      </div>,
    );
    assertContinuousHierarchy(containerS03);
    unmountS03();
  });

  it("A6-H02: accessible names and roles conform to semantic specification with 0 axe violations", async () => {
    const vm = toChartViewModel(chartFull);
    const interp = buildInterpretationModel(chartFull, vm);

    const { container } = render(
      <div>
        <h1 tabIndex={-1}>Lá số sinh</h1>
        <ChartViewerShell vm={vm} interpretation={interp} />
      </div>,
    );

    // 1. Panel heading is level 2 with accessible name "Diễn giải"
    const panelHeading = screen.getByRole("heading", {
      name: "Diễn giải",
      level: 2,
    });
    expect(panelHeading).toBeInTheDocument();

    // 2. Group headings are level 3 with names "Cốt lõi" and "Các hành tinh"
    const coreHeading = screen.getByRole("heading", {
      name: "Cốt lõi",
      level: 3,
    });
    const planetsHeading = screen.getByRole("heading", {
      name: "Các hành tinh",
      level: 3,
    });
    expect(coreHeading).toBeInTheDocument();
    expect(planetsHeading).toBeInTheDocument();

    // 3. H6-10 Verification: Sub-groups do NOT declare nested region landmarks
    // The only region under InterpretationPanel is the panel itself
    expect(screen.queryByRole("region", { name: "Cốt lõi" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Các hành tinh" })).toBeNull();

    // 4. Item headings are level 4 and contain accessible disclosure buttons
    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const sunButton = within(panel).getByRole("button", {
      name: /^Mặt Trời/,
    });
    expect(sunButton).toHaveAttribute("aria-expanded", "true");
    const sunHeading = sunButton.closest("h4");
    expect(sunHeading).not.toBeNull();

    // 5. Selected item shows badge in heading and aria-current on disclosure button
    // Selecting Mars from PlanetTable
    const marsTableBtn = screen.getByRole("button", {
      name: "Chọn Sao Hỏa",
    });
    fireEvent.click(marsTableBtn);

    const marsDisclosureBtn = within(panel).getByRole("button", {
      name: /^Sao Hỏa/,
    });
    expect(marsDisclosureBtn).toHaveAttribute("aria-current", "true");
    const marsHeading = marsDisclosureBtn.closest("h4");
    expect(marsHeading?.textContent).toContain("Đang chọn");

    // 6. Axe accessibility check on full composite document
    const axeResult = await axe(container);
    expect(axeResult).toHaveNoViolations();
  });
});
