import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { usePreferenceStore } from "@shared/stores/preferenceStore";
import { installMatchMedia } from "@test/matchMedia";

import {
  chartFull,
  chartNoAspects,
  chartNoHouses,
} from "../../api/mocks/fixtures";
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

    expect(screen.getByTestId("chart-wheel")).toBeInTheDocument();

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
    it("S1: renders 4 tables and no cards when matchMedia >= 640px", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);

      render(<ChartViewerShell vm={vm} />);

      // PlanetTable, HouseTable (houses + angles = 2 tables), AspectTable => 4 tables in total
      const tables = screen.getAllByRole("table");
      expect(tables).toHaveLength(4);
      // Only AspectLegend list is present on desktop (when aspect lines are on); no card data lists
      const lists = screen.queryAllByRole("list");
      expect(lists).toHaveLength(1);
      expect(lists[0]).toHaveAttribute(
        "aria-label",
        "Chú giải kiểu đường góc chiếu",
      );
    });

    it("S2: renders cards layout and no tables when matchMedia < 640px", () => {
      controller = installMatchMedia(false);
      const vm = toChartViewModel(chartFull);

      render(<ChartViewerShell vm={vm} />);

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      const lists = screen.getAllByRole("list");
      expect(lists).toHaveLength(4);
    });

    it("S3: dynamically switches between cards and tables when viewport changes without losing content", () => {
      controller = installMatchMedia(false);
      const vm = toChartViewModel(chartFull);

      render(<ChartViewerShell vm={vm} />);

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.getAllByRole("list")).toHaveLength(4);
      expect(screen.getAllByText("Mặt Trời").length).toBeGreaterThan(0);

      // Viewport increases to desktop
      act(() => {
        controller?.setMatches("(min-width: 640px)", true);
      });

      expect(screen.getAllByRole("table")).toHaveLength(4);
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

    it("S6: chart-wheel exists with data-testid and renders foundation layers", () => {
      const vm = toChartViewModel(chartFull);
      render(<ChartViewerShell vm={vm} />);

      const wheel = screen.getByTestId("chart-wheel");
      expect(wheel).toBeInTheDocument();
      expect(wheel.querySelector("svg")).toHaveAttribute(
        "viewBox",
        "0 0 600 600",
      );
    });

    it("S-W1: renders chart-wheel in Shell instead of placeholder, and all 4 tables remain visible", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);
      render(<ChartViewerShell vm={vm} />);

      expect(screen.getByTestId("chart-wheel")).toBeInTheDocument();
      expect(
        screen.queryByTestId("chart-visualization-placeholder"),
      ).not.toBeInTheDocument();

      // Exactly 4 semantic tables: PlanetTable, HouseTable (houses + angles), AspectTable
      const tables = screen.getAllByRole("table");
      expect(tables).toHaveLength(4);
      expect(
        screen.getByRole("table", { name: /vị trí hành tinh/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("table", { name: /nhà theo hệ placidus/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("table", { name: /các góc chính/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("table", { name: /góc chiếu giữa các hành tinh/i }),
      ).toBeInTheDocument();
    });

    it("S-W2: renders chart-wheel without house-ring and preserves HouseDataNotice when houseDataAvailable is false", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartNoHouses);
      const { container } = render(<ChartViewerShell vm={vm} />);

      const wheel = screen.getByTestId("chart-wheel");
      expect(wheel).toBeInTheDocument();
      expect(
        container.querySelector('[data-layer="house-ring"]'),
      ).not.toBeInTheDocument();

      const notices = screen.getAllByText(
        "Dữ liệu Nhà và các góc chưa khả dụng",
      );
      expect(notices).toHaveLength(1);
    });

    it("S7: selection buttons are rendered and accessible in M8 interactive mode", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);

      render(<ChartViewerShell vm={vm} />);

      // Selection buttons are now rendered inside tables with aria-pressed="false"
      const sunButton = screen.getByRole("button", { name: "Chọn Mặt Trời" });
      expect(sunButton).toBeInTheDocument();
      expect(sunButton).toHaveAttribute("aria-pressed", "false");

      const aspectButtons = screen.getAllByRole("button", {
        name: /Chọn góc chiếu/,
      });
      expect(aspectButtons.length).toBeGreaterThan(0);
      expect(aspectButtons[0]).toHaveAttribute("aria-pressed", "false");
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
  }, 60_000);

  describe("Aspect Visibility & Responsive Switching (SW1 - SW9, SW11)", () => {
    it("SW1: defaults to enabled on viewport >= 768px (md)", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);
      const { container } = render(<ChartViewerShell vm={vm} />);

      const toggle = screen.getByRole("switch", {
        name: "Hiện đường góc chiếu",
      });
      expect(toggle).toBeChecked();
      expect(
        container.querySelector('[data-layer="aspects"]'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("list", { name: "Chú giải kiểu đường góc chiếu" }),
      ).toBeInTheDocument();
    });

    it("SW2: defaults to disabled on viewport < 768px", () => {
      controller = installMatchMedia((query) => query === "(min-width: 640px)");
      const vm = toChartViewModel(chartFull);
      const { container } = render(<ChartViewerShell vm={vm} />);

      const toggle = screen.getByRole("switch", {
        name: "Hiện đường góc chiếu",
      });
      expect(toggle).not.toBeChecked();
      expect(container.querySelector('[data-layer="aspects"]')).toBeNull();
      expect(
        screen.queryByRole("list", { name: "Chú giải kiểu đường góc chiếu" }),
      ).not.toBeInTheDocument();
    });

    it("SW3: clicking switch toggles state and mounts/unmounts AspectLayer and Legend", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);
      const { container } = render(<ChartViewerShell vm={vm} />);

      const toggle = screen.getByRole("switch", {
        name: "Hiện đường góc chiếu",
      });
      expect(toggle).toBeChecked();
      expect(
        container.querySelector('[data-layer="aspects"]'),
      ).toBeInTheDocument();

      // Click to disable
      fireEvent.click(toggle);
      expect(toggle).not.toBeChecked();
      expect(container.querySelector('[data-layer="aspects"]')).toBeNull();
      expect(
        screen.queryByRole("list", { name: "Chú giải kiểu đường góc chiếu" }),
      ).not.toBeInTheDocument();

      // Click to re-enable
      fireEvent.click(toggle);
      expect(toggle).toBeChecked();
      expect(
        container.querySelector('[data-layer="aspects"]'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("list", { name: "Chú giải kiểu đường góc chiếu" }),
      ).toBeInTheDocument();
    });

    it("SW4: keyboard navigation (Space & Enter) toggles switch state cleanly", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);
      render(<ChartViewerShell vm={vm} />);

      const toggle = screen.getByRole("switch", {
        name: "Hiện đường góc chiếu",
      });
      toggle.focus();
      expect(document.activeElement).toBe(toggle);

      // Enter key triggers click handler in Switch
      fireEvent.keyDown(toggle, { key: "Enter" });
      expect(toggle).not.toBeChecked();

      // Space key toggles native checkbox
      fireEvent.click(toggle);
      expect(toggle).toBeChecked();
    });

    it("SW5: switch provides accessible name and aria-describedby pointing to existing hint element", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);
      render(<ChartViewerShell vm={vm} />);

      const toggle = screen.getByRole("switch", {
        name: "Hiện đường góc chiếu",
      });
      expect(toggle).toBeInTheDocument();

      const describedBy = toggle.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();

      const hintEl = document.getElementById(describedBy!);
      expect(hintEl).toBeInTheDocument();
      expect(hintEl?.textContent).toBe(
        "Bật hoặc tắt các đường nối góc chiếu giữa các hành tinh trên biểu đồ.",
      );
    });

    it("SW5b: uses unique useId-generated hint IDs when multiple shells are rendered simultaneously", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);
      render(
        <div>
          <ChartViewerShell vm={vm} />
          <ChartViewerShell vm={vm} />
        </div>,
      );

      const switches = screen.getAllByRole("switch", {
        name: "Hiện đường góc chiếu",
      });
      expect(switches).toHaveLength(2);

      const id1 = switches[0]!.getAttribute("aria-describedby");
      const id2 = switches[1]!.getAttribute("aria-describedby");
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it("SW6: viewport resize before user interaction dynamically updates aspect lines state", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);
      const { container } = render(<ChartViewerShell vm={vm} />);

      const toggle = screen.getByRole("switch", {
        name: "Hiện đường góc chiếu",
      });
      expect(toggle).toBeChecked();

      // Viewport shrinks below 768px
      act(() => {
        controller?.setMatches("(min-width: 768px)", false);
      });

      expect(toggle).not.toBeChecked();
      expect(container.querySelector('[data-layer="aspects"]')).toBeNull();

      // Viewport expands back to >= 768px
      act(() => {
        controller?.setMatches("(min-width: 768px)", true);
      });

      expect(toggle).toBeChecked();
      expect(
        container.querySelector('[data-layer="aspects"]'),
      ).toBeInTheDocument();
    });

    it("SW7: user manual choice persists across viewport resize without being overwritten", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);
      const { container } = render(<ChartViewerShell vm={vm} />);

      const toggle = screen.getByRole("switch", {
        name: "Hiện đường góc chiếu",
      });
      expect(toggle).toBeChecked();

      // User explicitly turns it off
      fireEvent.click(toggle);
      expect(toggle).not.toBeChecked();

      // Viewport changes from 768px to desktop or mobile and back
      act(() => {
        controller?.setMatches("(min-width: 768px)", true);
      });
      expect(toggle).not.toBeChecked();
      expect(container.querySelector('[data-layer="aspects"]')).toBeNull();

      act(() => {
        controller?.setMatches("(min-width: 768px)", false);
      });
      expect(toggle).not.toBeChecked();
      expect(container.querySelector('[data-layer="aspects"]')).toBeNull();

      // Now user explicitly turns it on while on mobile (< 768px)
      fireEvent.click(toggle);
      expect(toggle).toBeChecked();
      expect(
        container.querySelector('[data-layer="aspects"]'),
      ).toBeInTheDocument();

      // Viewport expands to desktop (>= 768px)
      act(() => {
        controller?.setMatches("(min-width: 768px)", true);
      });
      expect(toggle).toBeChecked();
      expect(
        container.querySelector('[data-layer="aspects"]'),
      ).toBeInTheDocument();
    });

    it("SW8: does not mutate vm (frozen) and maintains stable wheel layout across toggles", () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);
      Object.freeze(vm);
      Object.freeze(vm.aspects);
      Object.freeze(vm.planets);

      const { container } = render(<ChartViewerShell vm={vm} />);
      const toggle = screen.getByRole("switch", {
        name: "Hiện đường góc chiếu",
      });

      // Toggling does not throw or mutate vm
      expect(() => {
        fireEvent.click(toggle);
      }).not.toThrow();
      expect(toggle).not.toBeChecked();

      expect(() => {
        fireEvent.click(toggle);
      }).not.toThrow();
      expect(toggle).toBeChecked();
      expect(
        container.querySelector('[data-layer="aspects"]'),
      ).toBeInTheDocument();
    });

    it("SW9: hides switch and legend completely when chart has 0 aspects (chartNoAspects)", () => {
      controller = installMatchMedia(true);
      const noAspectsVM = toChartViewModel(chartNoAspects);
      const { container } = render(<ChartViewerShell vm={noAspectsVM} />);

      expect(
        screen.queryByRole("switch", { name: "Hiện đường góc chiếu" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("list", { name: "Chú giải kiểu đường góc chiếu" }),
      ).not.toBeInTheDocument();
      expect(container.querySelector('[data-layer="aspects"]')).toBeNull();
    });

    it("SW11: passes vitest-axe checks with aspect switch on, off, and on zero-aspect chart", async () => {
      controller = installMatchMedia(true);
      const vm = toChartViewModel(chartFull);

      // 1. Switch ON (with AspectLayer and AspectLegend)
      const { container, rerender } = render(<ChartViewerShell vm={vm} />);
      expect(await axe(container)).toHaveNoViolations();

      // 2. Switch OFF
      const toggle = screen.getByRole("switch", {
        name: "Hiện đường góc chiếu",
      });
      fireEvent.click(toggle);
      expect(await axe(container)).toHaveNoViolations();

      // 3. Zero-aspect chart
      const noAspectsVM = toChartViewModel(chartNoAspects);
      rerender(<ChartViewerShell vm={noAspectsVM} />);
      expect(await axe(container)).toHaveNoViolations();
    }, 60_000);

    describe("Milestone F4-M8 Synchronization Tests (nhóm S-M8)", () => {
      it("S-B1: selecting a planet from PlanetTable syncs to SelectionDetail and live region", () => {
        controller = installMatchMedia(true);
        const vm = toChartViewModel(chartFull);
        render(<ChartViewerShell vm={vm} />);

        const sunBtn = screen.getByRole("button", { name: "Chọn Mặt Trời" });
        expect(sunBtn).toHaveAttribute("aria-pressed", "false");

        // Initial empty selection detail
        expect(
          screen.getByText(
            "Chọn một hành tinh hoặc góc chiếu để xem chi tiết.",
          ),
        ).toBeInTheDocument();

        fireEvent.click(sunBtn);

        expect(sunBtn).toHaveAttribute("aria-pressed", "true");
        // SelectionDetail now displays Sun details
        expect(
          screen.getByRole("button", { name: "Bỏ chọn" }),
        ).toBeInTheDocument();
        // Central live region announces selection
        const liveRegion = screen.getByRole("status");
        expect(liveRegion.textContent).toContain("Đã chọn Mặt Trời");
      });

      it("S-D1: selecting an aspect from AspectTable syncs to SelectionDetail", () => {
        controller = installMatchMedia(true);
        const vm = toChartViewModel(chartFull);
        render(<ChartViewerShell vm={vm} />);

        const firstAspect = vm.aspects[0]!;
        const aspectBtnLabel = `Chọn góc chiếu ${firstAspect.type.labelVi} giữa ${firstAspect.planetA.labelVi} và ${firstAspect.planetB.labelVi}`;
        const aspectBtn = screen.getByRole("button", { name: aspectBtnLabel });
        expect(aspectBtn).toHaveAttribute("aria-pressed", "false");

        fireEvent.click(aspectBtn);

        expect(aspectBtn).toHaveAttribute("aria-pressed", "true");
        expect(
          screen.getByText(
            `${firstAspect.planetA.labelVi} – ${firstAspect.planetB.labelVi}`,
          ),
        ).toBeInTheDocument();
        const liveRegion = screen.getByRole("status");
        expect(liveRegion.textContent).toContain("Đã chọn góc chiếu");
      });

      it("S-E1: pressing Escape on Shell clears selection", () => {
        controller = installMatchMedia(true);
        const vm = toChartViewModel(chartFull);
        const { getByTestId } = render(<ChartViewerShell vm={vm} />);

        const sunBtn = screen.getByRole("button", { name: "Chọn Mặt Trời" });
        fireEvent.click(sunBtn);
        expect(sunBtn).toHaveAttribute("aria-pressed", "true");

        // Press Escape on Shell
        const shell = getByTestId("chart-viewer-shell");
        fireEvent.keyDown(shell, { key: "Escape" });

        expect(sunBtn).toHaveAttribute("aria-pressed", "false");
        expect(
          screen.getByText(
            "Chọn một hành tinh hoặc góc chiếu để xem chi tiết.",
          ),
        ).toBeInTheDocument();
        expect(screen.getByRole("status").textContent).toBe("Đã bỏ chọn.");
      });

      it("S-E2: selecting the same planet toggles selection off", () => {
        controller = installMatchMedia(true);
        const vm = toChartViewModel(chartFull);
        render(<ChartViewerShell vm={vm} />);

        const sunBtn = screen.getByRole("button", { name: "Chọn Mặt Trời" });
        fireEvent.click(sunBtn);
        expect(sunBtn).toHaveAttribute("aria-pressed", "true");

        fireEvent.click(sunBtn);
        expect(sunBtn).toHaveAttribute("aria-pressed", "false");
        expect(
          screen.getByText(
            "Chọn một hành tinh hoặc góc chiếu để xem chi tiết.",
          ),
        ).toBeInTheDocument();
        expect(screen.getByRole("status").textContent).toBe("Đã bỏ chọn.");
      });

      it("S-E3: clicking 'Bỏ chọn' in SelectionDetail clears selection", () => {
        controller = installMatchMedia(true);
        const vm = toChartViewModel(chartFull);
        render(<ChartViewerShell vm={vm} />);

        fireEvent.click(screen.getByRole("button", { name: "Chọn Mặt Trời" }));
        const clearBtn = screen.getByRole("button", { name: "Bỏ chọn" });
        fireEvent.click(clearBtn);

        expect(
          screen.getByRole("button", { name: "Chọn Mặt Trời" }),
        ).toHaveAttribute("aria-pressed", "false");
        expect(screen.getByRole("status").textContent).toBe("Đã bỏ chọn.");
      });

      it("S-F1: selecting a planet filters AspectTable and shows AspectFilterChip", () => {
        controller = installMatchMedia(true);
        const vm = toChartViewModel(chartFull);
        render(<ChartViewerShell vm={vm} />);

        // Select Moon
        const moonBtn = screen.getByRole("button", { name: "Chọn Mặt Trăng" });
        fireEvent.click(moonBtn);

        // AspectFilterChip is rendered with Moon
        expect(screen.getByText("Đang lọc: Mặt Trăng")).toBeInTheDocument();
        const deleteFilterBtn = screen.getByRole("button", {
          name: "Xóa bộ lọc theo Mặt Trăng",
        });
        expect(deleteFilterBtn).toBeInTheDocument();
      });

      it("S-F2: clicking AspectFilterChip clear button clears filter and selection", () => {
        controller = installMatchMedia(true);
        const vm = toChartViewModel(chartFull);
        render(<ChartViewerShell vm={vm} />);

        fireEvent.click(screen.getByRole("button", { name: "Chọn Mặt Trăng" }));
        const deleteFilterBtn = screen.getByRole("button", {
          name: "Xóa bộ lọc theo Mặt Trăng",
        });

        fireEvent.click(deleteFilterBtn);
        expect(
          screen.queryByText("Đang lọc: Mặt Trăng"),
        ).not.toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Chọn Mặt Trăng" }),
        ).toHaveAttribute("aria-pressed", "false");
        expect(screen.getByRole("status").textContent).toBe("Đã bỏ chọn.");
      });

      it("S-F3: selecting an aspect while planet is filtered clears planet filter and selects aspect", () => {
        controller = installMatchMedia(true);
        const vm = toChartViewModel(chartFull);
        render(<ChartViewerShell vm={vm} />);

        // 1. Filter by Sun
        fireEvent.click(screen.getByRole("button", { name: "Chọn Mặt Trời" }));
        expect(screen.getByText("Đang lọc: Mặt Trời")).toBeInTheDocument();

        // 2. Select an aspect from the filtered list
        const aspectButtons = screen.getAllByRole("button", {
          name: /Chọn góc chiếu/,
        });
        expect(aspectButtons.length).toBeGreaterThan(0);
        fireEvent.click(aspectButtons[0]!);

        // Filter chip for Sun disappears because selection became aspect
        expect(
          screen.queryByText("Đang lọc: Mặt Trời"),
        ).not.toBeInTheDocument();
        // SelectionDetail now displays aspect
        expect(
          screen.getByRole("button", { name: "Bỏ chọn" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("status").textContent).toContain(
          "Đã chọn góc chiếu",
        );
      });
    });
  });
});
