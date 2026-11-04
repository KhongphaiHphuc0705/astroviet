import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { chartFull } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";
import { buildInterpretationModel } from "../../model/interpretation";

import { ChartViewerShell } from "./ChartViewerShell";

describe("ChartViewerShell navigation and synchronization", () => {
  const vm = toChartViewModel(chartFull);
  const interpretation = buildInterpretationModel(chartFull, vm);

  const getWheelPlanetButton = (container: HTMLElement, planetKey: string) =>
    container.querySelector(
      `[data-testid="chart-wheel"] [role="button"][data-planet="${planetKey}"]`,
    ) as SVGElement;

  it("SH-N1: selecting from wheel updates table aria-pressed and panel badge/expanded without moving focus or scrolling", () => {
    const scrollToSpy = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});
    const scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;

    const { container } = render(
      <ChartViewerShell vm={vm} interpretation={interpretation} />,
    );
    const wheelMars = getWheelPlanetButton(container, "Mars");
    expect(wheelMars).toBeTruthy();

    wheelMars.focus();
    fireEvent.click(wheelMars);

    // Planet table button for Mars has aria-pressed="true"
    const tableMarsBtn = screen.getByRole("button", { name: "Chọn Sao Hỏa" });
    expect(tableMarsBtn).toHaveAttribute("aria-pressed", "true");

    // Panel Mars item is marked and expanded
    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const marsHeaderBtn = within(panel).getByRole("button", {
      name: /^Sao Hỏa/,
    });
    expect(marsHeaderBtn).toHaveAttribute("aria-expanded", "true");
    expect(marsHeaderBtn).toHaveAttribute("aria-current", "true");
    expect(within(panel).getByText("Đang chọn")).toBeInTheDocument();

    // Focus remains on wheel element
    expect(document.activeElement).toBe(wheelMars);
    // Scrolling to panel was not called
    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();

    // Deselect and re-select via keyboard
    fireEvent.keyDown(wheelMars, { key: "Enter" });
    expect(tableMarsBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.keyDown(wheelMars, { key: " " });
    expect(tableMarsBtn).toHaveAttribute("aria-pressed", "true");
    expect(marsHeaderBtn).toHaveAttribute("aria-current", "true");
    expect(document.activeElement).toBe(wheelMars);
    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();

    scrollToSpy.mockRestore();
  });

  it("SH-N2: selecting from Planet Table updates wheel and panel while keeping focus on table button", () => {
    const scrollToSpy = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});
    const scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;

    const { container } = render(
      <ChartViewerShell vm={vm} interpretation={interpretation} />,
    );
    const tableMarsBtn = screen.getByRole("button", { name: "Chọn Sao Hỏa" });
    tableMarsBtn.focus();
    fireEvent.click(tableMarsBtn);

    const wheelMars = getWheelPlanetButton(container, "Mars");
    expect(wheelMars).toHaveAttribute("aria-pressed", "true");

    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const marsHeaderBtn = within(panel).getByRole("button", {
      name: /^Sao Hỏa/,
    });
    expect(marsHeaderBtn).toHaveAttribute("aria-expanded", "true");
    expect(marsHeaderBtn).toHaveAttribute("aria-current", "true");
    expect(within(panel).getByText("Đang chọn")).toBeInTheDocument();

    expect(document.activeElement).toBe(tableMarsBtn);
    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();

    // Deselect and re-select via keyboard
    fireEvent.click(tableMarsBtn);
    expect(wheelMars).toHaveAttribute("aria-pressed", "false");

    tableMarsBtn.focus();
    fireEvent.keyDown(tableMarsBtn, { key: "Enter" });
    fireEvent.click(tableMarsBtn);
    expect(wheelMars).toHaveAttribute("aria-pressed", "true");
    expect(document.activeElement).toBe(tableMarsBtn);
    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();

    scrollToSpy.mockRestore();
  });

  it("SH-N3: selecting a non-MVP body (Chiron) or aspect does not mark or mutate panel items", () => {
    const vmWithChiron = {
      ...vm,
      planets: [
        ...vm.planets,
        {
          key: "Chiron",
          nameVi: "Chiron",
          glyph: "⚷",
          sign: {
            key: "Aries",
            labelVi: "Bạch Dương",
            glyph: "♈",
            known: true,
          },
          degreeLabel: "15° Bạch Dương",
          longitude: 15,
          houseNumber: 1,
          isRetrograde: false,
          known: false,
          ariaLabel: "Chiron ở Bạch Dương",
        },
      ],
    };

    render(
      <ChartViewerShell
        vm={vmWithChiron}
        interpretation={buildInterpretationModel(chartFull, vmWithChiron)}
      />,
    );

    const chironBtn = screen.getByRole("button", { name: "Chọn Chiron" });
    fireEvent.click(chironBtn);

    const panel = screen.getByRole("region", { name: "Diễn giải" });
    expect(within(panel).queryByText("Đang chọn")).toBeNull();

    // Deselect Chiron so aspect table is not filtered out
    fireEvent.click(chironBtn);

    // Selecting aspect
    const firstAspectBtn = screen.getAllByRole("button", {
      name: /^Chọn góc chiếu/,
    })[0];
    if (firstAspectBtn) {
      fireEvent.click(firstAspectBtn);
      expect(within(panel).queryByText("Đang chọn")).toBeNull();
    }
  });

  it("SH-N4: toggling Mars selection on then off removes badge but keeps item open", () => {
    const { container } = render(
      <ChartViewerShell vm={vm} interpretation={interpretation} />,
    );
    const wheelMars = getWheelPlanetButton(container, "Mars");
    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const marsHeaderBtn = within(panel).getByRole("button", {
      name: /^Sao Hỏa/,
    });

    // Select Mars
    fireEvent.click(wheelMars);
    expect(within(panel).getByText("Đang chọn")).toBeInTheDocument();
    expect(marsHeaderBtn).toHaveAttribute("aria-expanded", "true");

    // Deselect Mars (toggle off)
    fireEvent.click(wheelMars);
    expect(within(panel).queryByText("Đang chọn")).toBeNull();
    expect(marsHeaderBtn).toHaveAttribute("aria-expanded", "true");
  });

  it("SH-N5: 'Đọc diễn giải' moves focus to panel item header, expands it, and preserves chart selection and live region", () => {
    const { container } = render(
      <ChartViewerShell vm={vm} interpretation={interpretation} />,
    );
    const wheelMars = getWheelPlanetButton(container, "Mars");
    fireEvent.click(wheelMars);

    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const marsHeaderBtn = within(panel).getByRole("button", {
      name: /^Sao Hỏa/,
    });

    // User collapses Mars item
    fireEvent.click(marsHeaderBtn);
    expect(marsHeaderBtn).toHaveAttribute("aria-expanded", "false");

    // Click "Đọc diễn giải"
    const readBtn = screen.getByRole("button", { name: "Đọc diễn giải" });
    fireEvent.click(readBtn);

    // Focus moves to Mars item header button, and item is re-expanded
    expect(document.activeElement).toBe(marsHeaderBtn);
    expect(marsHeaderBtn).toHaveAttribute("aria-expanded", "true");

    // Chart selection unchanged
    expect(wheelMars).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Chọn Sao Hỏa" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("SH-N6: 'Xem trên biểu đồ' returns focus to wheel element without mutating selection", () => {
    const { container } = render(
      <ChartViewerShell vm={vm} interpretation={interpretation} />,
    );
    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const marsHeaderBtn = within(panel).getByRole("button", {
      name: /^Sao Hỏa/,
    });
    const wheelMars = getWheelPlanetButton(container, "Mars");

    // Case A: When Mars is ALREADY selected
    fireEvent.click(wheelMars);
    expect(wheelMars).toHaveAttribute("aria-pressed", "true");
    expect(marsHeaderBtn).toHaveAttribute("aria-expanded", "true");

    const viewOnChartBtn = screen.getByRole("button", {
      name: "Xem trên biểu đồ: Sao Hỏa",
    });
    fireEvent.click(viewOnChartBtn);
    expect(document.activeElement).toBe(wheelMars);
    expect(wheelMars).toHaveAttribute("aria-pressed", "true");

    // Case B: When Mars is NOT selected
    const clearBtn = screen.getByRole("button", { name: "Bỏ chọn" });
    fireEvent.click(clearBtn);
    expect(wheelMars).toHaveAttribute("aria-pressed", "false");

    // Item remains expanded
    expect(marsHeaderBtn).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(viewOnChartBtn);
    expect(document.activeElement).toBe(wheelMars);
    expect(wheelMars).toHaveAttribute("aria-pressed", "false");
  });

  it("SH-N7: falls back to PlanetTable button when wheel target element is not available", () => {
    const { container } = render(
      <ChartViewerShell vm={vm} interpretation={interpretation} />,
    );
    // Remove wheel button for Mars to simulate non-interactive or overflow
    const wheelMars = getWheelPlanetButton(container, "Mars");
    wheelMars?.remove();

    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const marsHeaderBtn = within(panel).getByRole("button", {
      name: /^Sao Hỏa/,
    });
    fireEvent.click(marsHeaderBtn);

    const viewOnChartBtn = screen.getByRole("button", {
      name: "Xem trên biểu đồ: Sao Hỏa",
    });
    fireEvent.click(viewOnChartBtn);

    const tableMarsBtn = screen.getByRole("button", { name: "Chọn Sao Hỏa" });
    expect(document.activeElement).toBe(tableMarsBtn);
  });

  it("SH-N8: pressing Escape while focused on panel item header clears selection without moving focus", () => {
    const { container } = render(
      <ChartViewerShell vm={vm} interpretation={interpretation} />,
    );
    const wheelMars = getWheelPlanetButton(container, "Mars");
    fireEvent.click(wheelMars);

    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const marsHeaderBtn = within(panel).getByRole("button", {
      name: /^Sao Hỏa/,
    });
    marsHeaderBtn.focus();

    fireEvent.keyDown(marsHeaderBtn, { key: "Escape" });

    // Selection cleared
    expect(screen.queryByRole("button", { name: "Bỏ chọn" })).toBeNull();
    expect(within(panel).queryByText("Đang chọn")).toBeNull();
    // Focus remains on header button
    expect(document.activeElement).toBe(marsHeaderBtn);
    expect(marsHeaderBtn).toHaveAttribute("aria-expanded", "true");
    // Live region announces deselection
    expect(container.querySelector('div[role="status"]')).toHaveTextContent(
      "Đã bỏ chọn.",
    );
  });

  it("SH-N9: pressing Escape on 'Đọc diễn giải' recovers focus to SelectionDetail section", () => {
    const { container } = render(
      <ChartViewerShell vm={vm} interpretation={interpretation} />,
    );
    const wheelMars = getWheelPlanetButton(container, "Mars");
    fireEvent.click(wheelMars);

    const readBtn = screen.getByRole("button", { name: "Đọc diễn giải" });
    readBtn.focus();

    fireEvent.keyDown(readBtn, { key: "Escape" });

    expect(screen.queryByRole("button", { name: "Đọc diễn giải" })).toBeNull();
    const selectionDetailSection = screen.getByRole("region", {
      name: "Chi tiết đang chọn",
    });
    expect(document.activeElement).toBe(selectionDetailSection);
  });

  it("SH-N10: fast repeat/multi-target navigation is idempotent and has no asynchronous timers", async () => {
    const { container } = render(
      <ChartViewerShell vm={vm} interpretation={interpretation} />,
    );
    const wheelMars = getWheelPlanetButton(container, "Mars");
    fireEvent.click(wheelMars);

    const tableSunBtn = screen.getByRole("button", { name: "Chọn Mặt Trời" });
    fireEvent.click(tableSunBtn);

    const readBtn = screen.getByRole("button", { name: "Đọc diễn giải" });

    vi.useFakeTimers();

    // Click triggers revealItem synchronously without advancing timers
    fireEvent.click(readBtn);

    const panel = screen.getByRole("region", { name: "Diễn giải" });
    const sunHeaderBtn = within(panel).getByRole("button", {
      name: /^Mặt Trời/,
    });
    // Focus shifted immediately (synchronous)
    expect(document.activeElement).toBe(sunHeaderBtn);

    // Consecutive click is idempotent
    fireEvent.click(readBtn);
    expect(document.activeElement).toBe(sunHeaderBtn);

    // Running pending zero-delay event timers leaves 0 pending timers
    vi.runAllTimers();
    expect(vi.getTimerCount()).toBe(0);

    vi.useRealTimers();
    const user = userEvent.setup();

    // Tab moves focus to the next interactive element inside open Sun item ("Xem trên biểu đồ: Mặt Trời")
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Xem trên biểu đồ: Mặt Trời" }),
    );

    // Next Tab moves to the next panel item header (Mặt Trăng)
    await user.tab();
    expect(document.activeElement).toBe(
      within(panel).getByRole("button", { name: /^Mặt Trăng/ }),
    );
  });

  it("SH-N11: stale selection safely resets when selected planet is removed from viewModel", () => {
    const { container, rerender } = render(
      <ChartViewerShell vm={vm} interpretation={interpretation} />,
    );
    const wheelMars = getWheelPlanetButton(container, "Mars");
    fireEvent.click(wheelMars);

    expect(
      screen.getByRole("button", { name: "Đọc diễn giải" }),
    ).toBeInTheDocument();

    const vmWithoutMars = {
      ...vm,
      planets: vm.planets.filter((p) => p.key !== "Mars"),
    };
    rerender(
      <ChartViewerShell
        vm={vmWithoutMars}
        interpretation={buildInterpretationModel(chartFull, vmWithoutMars)}
      />,
    );

    expect(screen.queryByRole("button", { name: "Đọc diễn giải" })).toBeNull();
    const panel = screen.getByRole("region", { name: "Diễn giải" });
    expect(within(panel).queryByText("Đang chọn")).toBeNull();
  });

  it("SH-N12: hides 'Đọc diễn giải' without error or clearing selection when interpretation status becomes unavailable", () => {
    const { container, rerender } = render(
      <ChartViewerShell vm={vm} interpretation={interpretation} />,
    );
    const wheelMars = getWheelPlanetButton(container, "Mars");
    fireEvent.click(wheelMars);

    expect(
      screen.getByRole("button", { name: "Đọc diễn giải" }),
    ).toBeInTheDocument();

    rerender(
      <ChartViewerShell
        vm={vm}
        interpretation={{
          ...interpretation,
          status: "unavailable",
        }}
      />,
    );

    expect(screen.queryByRole("button", { name: "Đọc diễn giải" })).toBeNull();
    expect(screen.getByRole("button", { name: "Bỏ chọn" })).toBeInTheDocument();
  });

  it("SH-N13: maintains exactly one polite live region in shell without exposing interpretation body", () => {
    const { container } = render(
      <ChartViewerShell vm={vm} interpretation={interpretation} />,
    );
    const countLive = () =>
      container.querySelectorAll('[aria-live],[role="status"],[role="alert"]')
        .length;

    expect(countLive()).toBe(1);

    const wheelMars = getWheelPlanetButton(container, "Mars");
    fireEvent.click(wheelMars);
    expect(countLive()).toBe(1);

    const readBtn = screen.getByRole("button", { name: "Đọc diễn giải" });
    fireEvent.click(readBtn);
    expect(countLive()).toBe(1);

    const viewOnChartBtn = screen.getByRole("button", {
      name: "Xem trên biểu đồ: Sao Hỏa",
    });
    fireEvent.click(viewOnChartBtn);
    expect(countLive()).toBe(1);

    const shell = screen.getByTestId("chart-viewer-shell");
    fireEvent.keyDown(shell, { key: "Escape" });
    expect(countLive()).toBe(1);

    const liveRegion = container.querySelector('[role="status"]')!;
    expect(liveRegion.textContent).not.toMatch(
      /khám phá|nghị lực|hành động|chưa có nội dung/i,
    );
  });

  it("SH-N14: omits 'Đọc diễn giải' when interpretation prop is not provided", () => {
    const { container } = render(<ChartViewerShell vm={vm} />);
    const wheelMars = getWheelPlanetButton(container, "Mars");
    fireEvent.click(wheelMars);

    expect(screen.getByRole("button", { name: "Bỏ chọn" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đọc diễn giải" })).toBeNull();
  });
});
