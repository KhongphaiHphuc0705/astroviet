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
      it("S-A1: selecting a planet from ChartWheel syncs to PlanetTable and SelectionDetail", () => {
        controller = installMatchMedia(true);
        const vm = toChartViewModel(chartFull);
        const { container } = render(<ChartViewerShell vm={vm} />);

        const wheelSunBtn = container.querySelector(
          '[data-part="labels"] > [data-planet="Sun"]',
        );
        expect(wheelSunBtn).toBeInTheDocument();
        expect(wheelSunBtn).toHaveAttribute("aria-pressed", "false");

        fireEvent.click(wheelSunBtn!);

        expect(wheelSunBtn).toHaveAttribute("aria-pressed", "true");
        const tableSunBtn = screen.getByRole("button", {
          name: "Chọn Mặt Trời",
        });
        expect(tableSunBtn).toHaveAttribute("aria-pressed", "true");

        expect(
          screen.getByRole("button", { name: "Bỏ chọn" }),
        ).toBeInTheDocument();
        expect(screen.getByText("Đang lọc: Mặt Trời")).toBeInTheDocument();
      });

      it("S-C1: selecting an aspect from ChartWheel syncs to AspectTable and SelectionDetail", () => {
        controller = installMatchMedia(true);
        const vm = toChartViewModel(chartFull);
        const { container } = render(<ChartViewerShell vm={vm} />);

        const firstAspectHit = container.querySelector(
          '[data-part="aspect-hit-targets"] path, [data-part="aspect-hit-targets"] circle',
        );
        expect(firstAspectHit).toBeInTheDocument();

        fireEvent.click(firstAspectHit!);

        expect(
          screen.getByRole("button", { name: "Bỏ chọn" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("status").textContent).toContain(
          "Đã chọn góc chiếu",
        );
      });

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

      it("S-G1: click then hover prioritizes hovered target over focused target in preview", () => {
        controller = installMatchMedia(true);
        const vm = toChartViewModel(chartFull);
        const { container } = render(<ChartViewerShell vm={vm} />);

        const sunBtn = screen.getByRole("button", { name: "Chọn Mặt Trời" });
        const moonBtn = screen.getByRole("button", { name: "Chọn Mặt Trăng" });

        // 1. Click Sun: Sun is selected and focused
        fireEvent.click(sunBtn);
        expect(sunBtn).toHaveAttribute("aria-pressed", "true");

        // 2. Hover Moon: pointer hover preview takes precedence over lingering focus
        fireEvent.pointerEnter(moonBtn, { pointerType: "mouse" });

        // On the wheel, Moon's label should not be dimmed because it's previewed!
        const moonWheelLabel = container.querySelector(
          '[data-part="labels"] > [data-planet="Moon"]',
        );
        expect(moonWheelLabel).not.toHaveClass("opacity-40");

        // 3. Pointer leaves Moon: preview falls back cleanly
        fireEvent.pointerLeave(moonBtn, { pointerType: "mouse" });
      });

      it("S-G2: interleaved enter and leave protects against race conditions", () => {
        controller = installMatchMedia(true);
        const vm = toChartViewModel(chartFull);
        const { container } = render(<ChartViewerShell vm={vm} />);

        const sunBtn = screen.getByRole("button", { name: "Chọn Mặt Trời" });
        const moonBtn = screen.getByRole("button", { name: "Chọn Mặt Trăng" });

        // Enter Sun
        fireEvent.pointerEnter(sunBtn, { pointerType: "mouse" });
        // Enter Moon (before leaving Sun)
        fireEvent.pointerEnter(moonBtn, { pointerType: "mouse" });
        // Leave Sun (stale leave event)
        fireEvent.pointerLeave(sunBtn, { pointerType: "mouse" });

        // Moon should STILL be emphasized and NOT dimmed because Moon is the active hover!
        const moonWheelLabel = container.querySelector(
          '[data-part="labels"] > [data-planet="Moon"]',
        );
        expect(moonWheelLabel).not.toHaveClass("opacity-40");
      });

      it("S-G3: clicking 'Bỏ chọn' and clearing filter chip return focus to stable semantic elements", () => {
        controller = installMatchMedia(true);
        const vm = toChartViewModel(chartFull);
        render(<ChartViewerShell vm={vm} />);

        // 1. Select a planet
        const sunBtn = screen.getByRole("button", { name: "Chọn Mặt Trời" });
        fireEvent.click(sunBtn);

        // 2. Click 'Bỏ chọn'
        const clearBtn = screen.getByRole("button", { name: "Bỏ chọn" });
        fireEvent.click(clearBtn);

        // Document activeElement should be the SelectionDetail section, not document.body
        const selectionSection = screen.getByRole("region", {
          name: "Chi tiết đang chọn",
        });
        expect(document.activeElement).toBe(selectionSection);

        // 3. Select planet again to show filter chip
        fireEvent.click(sunBtn);
        const deleteFilterBtn = screen.getByRole("button", {
          name: "Xóa bộ lọc theo Mặt Trời",
        });
        fireEvent.click(deleteFilterBtn);

        // Focus shifts to AspectTable heading
        const aspectHeading = screen.getByRole("heading", {
          name: "Góc chiếu",
        });
        expect(document.activeElement).toBe(aspectHeading);
      });
    });
  });

  describe("M9.1 & M9.2: Layout Foundation & Zoom Integration", () => {
    it("RS-H1: renders sr-only h2 headings for overview and chart wheel cards linked via aria-labelledby", () => {
      const vm = toChartViewModel(chartFull);
      render(<ChartViewerShell vm={vm} />);

      const overviewHeading = screen.getByRole("heading", {
        name: "Thông tin lá số",
        level: 2,
      });
      expect(overviewHeading).toBeInTheDocument();
      expect(overviewHeading).toHaveClass("sr-only");

      const wheelHeading = screen.getByRole("heading", {
        name: "Biểu đồ lá số",
        level: 2,
      });
      expect(wheelHeading).toBeInTheDocument();
      expect(wheelHeading).toHaveClass("sr-only");
    });

    it("RS-L1: renders two-column container query grid, sticky left column wrapper, and min-w-0 tables column", () => {
      const vm = toChartViewModel(chartFull);
      const { container } = render(<ChartViewerShell vm={vm} />);

      // Container query inline-size wrapper
      const cqWrapper = container.querySelector(
        '[class*="[container-type:inline-size]"]',
      );
      expect(cqWrapper).toBeInTheDocument();

      // Responsive grid
      const grid = container.querySelector(
        '[class*="[@container(min-width:1010px)]:grid"]',
      );
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass(
        "[@container(min-width:1010px)]:grid-cols-[minmax(448px,5fr)_minmax(0,7fr)]",
        "[@container(min-width:1010px)]:items-start",
        "[@container(min-width:1010px)]:gap-6",
      );

      // Sticky left column with height clamp
      const stickyCol = container.querySelector(
        '[class*="[@media(min-height:1000px)]:sticky"]',
      );
      expect(stickyCol).toBeInTheDocument();
      expect(stickyCol).toHaveClass("[@media(min-height:1000px)]:top-[88px]");

      // Right column tables container with min-w-0 and stable id
      const rightCol = container.querySelector("#chart-data-tables");
      expect(rightCol).toBeInTheDocument();
      expect(rightCol).toHaveAttribute("tabindex", "-1");
      expect(rightCol).toHaveClass("min-w-0", "focus:outline-none");
    });

    it("RS-L2: preserves natural DOM order between left wheel card and right tables column with no order-* classes", () => {
      const vm = toChartViewModel(chartFull);
      const { container } = render(<ChartViewerShell vm={vm} />);

      const stickyCol = container.querySelector(
        '[class*="[@media(min-height:1000px)]:sticky"]',
      );
      const rightCol = container.querySelector("#chart-data-tables");
      expect(stickyCol).toBeInTheDocument();
      expect(rightCol).toBeInTheDocument();

      // Ensure stickyCol precedes rightCol in DOM tree
      expect(stickyCol!.compareDocumentPosition(rightCol!)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );

      // Ensure neither column nor grid items use visual reordering classes
      expect(stickyCol?.className).not.toMatch(/\border-/);
      expect(rightCol?.className).not.toMatch(/\border-/);
    });

    it("Z-S1: renders ChartZoomControls when matchesMd is false (< md) and controls zoom on ChartWheel", () => {
      controller = installMatchMedia(false); // Mobile viewport (< 768px)
      const vm = toChartViewModel(chartFull);
      render(<ChartViewerShell vm={vm} />);

      const zoomGroup = screen.getByRole("group", {
        name: "Thu phóng biểu đồ",
      });
      expect(zoomGroup).toBeInTheDocument();

      const scrollRegion = screen.getByRole("region", {
        name: "Khung biểu đồ, có thể cuộn khi phóng to hoặc màn hình hẹp",
      });
      expect(scrollRegion.style.getPropertyValue("--zoom")).toBe("1");

      const zoomInBtn = screen.getByRole("button", {
        name: "Phóng to biểu đồ",
      });
      fireEvent.click(zoomInBtn);

      expect(screen.getByLabelText("Mức thu phóng")).toHaveTextContent("150%");
      expect(scrollRegion.style.getPropertyValue("--zoom")).toBe("1.5");

      const resetBtn = screen.getByRole("button", {
        name: "Đặt lại thu phóng",
      });
      fireEvent.click(resetBtn);

      expect(screen.getByLabelText("Mức thu phóng")).toHaveTextContent("100%");
      expect(scrollRegion.style.getPropertyValue("--zoom")).toBe("1");
    });

    it("Z-S2: does not render ChartZoomControls when matchesMd is true (>= md)", () => {
      controller = installMatchMedia(true); // Tablet/Desktop (>= 768px)
      const vm = toChartViewModel(chartFull);
      render(<ChartViewerShell vm={vm} />);

      expect(
        screen.queryByRole("group", { name: "Thu phóng biểu đồ" }),
      ).not.toBeInTheDocument();
    });

    it("Z-S3: preserves selection state when zoom is modified", () => {
      controller = installMatchMedia(false);
      const vm = toChartViewModel(chartFull);
      render(<ChartViewerShell vm={vm} />);

      // Select a planet (cards on mobile)
      const sunBtn = screen.getByRole("button", { name: "Chọn Mặt Trời" });
      fireEvent.click(sunBtn);
      expect(sunBtn).toHaveAttribute("aria-pressed", "true");

      // Zoom in
      const zoomInBtn = screen.getByRole("button", {
        name: "Phóng to biểu đồ",
      });
      fireEvent.click(zoomInBtn);

      // Sun should still be selected
      expect(
        screen.getByRole("button", { name: "Chọn Mặt Trời" }),
      ).toHaveAttribute("aria-pressed", "true");
      expect(
        screen.getByRole("heading", { name: "Chi tiết đang chọn", level: 2 }),
      ).toBeInTheDocument();
    });
  });
});
