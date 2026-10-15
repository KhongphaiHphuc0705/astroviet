import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { usePreferenceStore } from "@shared/stores/preferenceStore";
import { installMatchMedia } from "@test/matchMedia";

import { chartFull, chartNoHouses } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";

import { ChartViewerShell } from "./ChartViewerShell";

describe("ChartViewerShell", () => {
  let controller: ReturnType<typeof installMatchMedia> | null = null;

  beforeEach(() => {
    usePreferenceStore.setState({ densityMode: "comfortable" });
  });

  afterEach(() => {
    if (controller) {
      controller.restore();
      controller = null;
    }
  });

  it("renders metadata, engine version, and visualization placeholder cleanly for chartFull", () => {
    const vm = toChartViewModel(chartFull);
    render(<ChartViewerShell vm={vm} />);

    expect(screen.getByText("Hệ nhà")).toBeInTheDocument();
    // "Placidus" appears in exactly 2 places: metadata DL and HouseTable header badge
    expect(screen.getAllByText("Placidus")).toHaveLength(2);
    expect(screen.getByText("Tính lúc")).toBeInTheDocument();
    expect(screen.getByText(chartFull.engineVersion)).toBeInTheDocument();

    const timeElement = screen.getByText((_, element) => {
      return (
        element?.tagName.toLowerCase() === "time" &&
        element.getAttribute("dateTime") === chartFull.calculatedAt
      );
    });
    expect(timeElement).toBeInTheDocument();

    expect(
      screen.getByTestId("chart-visualization-placeholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Biểu đồ tròn sẽ xuất hiện ở đây."),
    ).toBeInTheDocument();

    // No house data notice when houses are available
    expect(
      screen.queryByText("Dữ liệu Nhà và các góc chưa khả dụng"),
    ).not.toBeInTheDocument();
    // No partial data warning
    expect(screen.queryByText("Dữ liệu chưa đầy đủ")).not.toBeInTheDocument();
  });

  it("renders HouseDataNotice when houseDataAvailable is false", () => {
    const vm = toChartViewModel(chartNoHouses);
    render(<ChartViewerShell vm={vm} />);

    expect(
      screen.getByText("Dữ liệu Nhà và các góc chưa khả dụng"),
    ).toBeInTheDocument();
  });

  it("renders partialData warning alert when flags.partialData is true", () => {
    const vm = toChartViewModel(chartFull);
    const vmWithPartial = {
      ...vm,
      flags: {
        ...vm.flags,
        partialData: true,
      },
    };

    render(<ChartViewerShell vm={vmWithPartial} />);

    expect(screen.getByText("Dữ liệu chưa đầy đủ")).toBeInTheDocument();
    expect(
      screen.getByText("Một số dữ liệu của lá số chưa thể hiển thị đầy đủ."),
    ).toBeInTheDocument();
  });

  describe("Integration Tests (nhóm S)", () => {
    it("S1: renders 3 tables and no cards when matchMedia >= 640px", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);

      render(<ChartViewerShell vm={vm} />);

      // PlanetTable, HouseTable (houses + angles = 2 tables), AspectTable => 4 tables in total
      const tables = screen.getAllByRole("table");
      expect(tables.length).toBeGreaterThanOrEqual(3);
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("S2: renders cards layout and no tables when matchMedia < 640px", () => {
      controller = installMatchMedia(false);
      const vm = toChartViewModel(chartFull);

      render(<ChartViewerShell vm={vm} />);

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      const lists = screen.getAllByRole("list");
      expect(lists.length).toBeGreaterThanOrEqual(3);
    });

    it("S3: dynamically switches between cards and tables when viewport changes without losing content", () => {
      controller = installMatchMedia(false);
      const vm = toChartViewModel(chartFull);

      render(<ChartViewerShell vm={vm} />);

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.getAllByRole("list").length).toBeGreaterThanOrEqual(3);
      expect(screen.getAllByText("Mặt Trời").length).toBeGreaterThan(0);

      // Viewport increases to desktop
      act(() => {
        controller?.setMatches("(min-width: 640px)", true);
      });

      expect(screen.getAllByRole("table").length).toBeGreaterThanOrEqual(3);
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      expect(screen.getAllByText("Mặt Trời").length).toBeGreaterThan(0);
    });

    it("S4: renders HouseDataNotice exactly once inside HouseTable when houseDataAvailable is false", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartNoHouses);

      render(<ChartViewerShell vm={vm} />);

      // HouseDataNotice is rendered exactly once
      const notices = screen.getAllByText(
        "Dữ liệu Nhà và các góc chưa khả dụng",
      );
      expect(notices).toHaveLength(1);

      // PlanetTable has no House column
      expect(
        screen.queryByRole("columnheader", { name: /^nhà$/i }),
      ).not.toBeInTheDocument();

      // Planets are all present
      expect(screen.getAllByText("Mặt Trời").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Sao Thổ").length).toBeGreaterThan(0);
    });

    it("S5: applies compact padding to tables when densityMode is compact", () => {
      controller = installMatchMedia(true);
      usePreferenceStore.setState({ densityMode: "compact" });
      const vm = toChartViewModel(chartFull);

      render(<ChartViewerShell vm={vm} />);

      const firstHeader = screen.getAllByRole("columnheader")[0]!;
      expect(firstHeader).toHaveClass("px-2 py-2");
    });

    it("S6: placeholder wheel exists with data-testid and updated text", () => {
      const vm = toChartViewModel(chartFull);
      render(<ChartViewerShell vm={vm} />);

      const placeholder = screen.getByTestId("chart-visualization-placeholder");
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveTextContent("Biểu đồ tròn sẽ xuất hiện ở đây.");
    });

    it("S7: selection buttons are not rendered in M7 presentation-only mode", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);

      render(<ChartViewerShell vm={vm} />);

      // No interactive buttons rendered inside tables
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  it("passes axe accessibility checks across desktop, mobile, and missing-data states", async () => {
    // Desktop layout
    controller = installMatchMedia(true);
    const vm = toChartViewModel(chartFull);
    const { container: desktopContainer } = render(
      <ChartViewerShell vm={vm} />,
    );
    expect(await axe(desktopContainer)).toHaveNoViolations();

    // Mobile layout
    act(() => {
      controller?.setMatches("(min-width: 640px)", false);
    });
    const { container: mobileContainer } = render(<ChartViewerShell vm={vm} />);
    expect(await axe(mobileContainer)).toHaveNoViolations();

    // Missing house data
    const noHousesVM = toChartViewModel(chartNoHouses);
    const { container: noHousesContainer } = render(
      <ChartViewerShell vm={noHousesVM} />,
    );
    expect(await axe(noHousesContainer)).toHaveNoViolations();
  });
});
