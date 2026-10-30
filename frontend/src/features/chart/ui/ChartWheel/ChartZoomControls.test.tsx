import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { ChartZoomControls } from "./ChartZoomControls";

describe("ChartZoomControls (M9.2: Z8 - Z12)", () => {
  it("Z8: renders accessible group with buttons and percentage output", () => {
    render(
      <ChartZoomControls
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onZoomReset={vi.fn()}
      />,
    );

    const group = screen.getByRole("group", { name: "Thu phóng biểu đồ" });
    expect(group).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Thu nhỏ biểu đồ" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Phóng to biểu đồ" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Đặt lại thu phóng" }),
    ).toBeInTheDocument();

    const output = screen.getByLabelText("Mức thu phóng");
    expect(output).toHaveTextContent("100%");
  });

  it("Z9: triggers onZoomIn, onZoomOut, and onZoomReset when clicked", () => {
    const handleZoomIn = vi.fn();
    const handleZoomOut = vi.fn();
    const handleZoomReset = vi.fn();

    render(
      <ChartZoomControls
        zoom={1.5}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Phóng to biểu đồ" }));
    expect(handleZoomIn).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Thu nhỏ biểu đồ" }));
    expect(handleZoomOut).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Đặt lại thu phóng" }));
    expect(handleZoomReset).toHaveBeenCalledTimes(1);
  });

  it("Z10: at ZOOM_MIN (100%), zoomOut and reset have aria-disabled='true' and clicks are ignored", () => {
    const handleZoomOut = vi.fn();
    const handleZoomReset = vi.fn();

    render(
      <ChartZoomControls
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />,
    );

    const zoomOutBtn = screen.getByRole("button", { name: "Thu nhỏ biểu đồ" });
    expect(zoomOutBtn).toHaveAttribute("aria-disabled", "true");
    expect(zoomOutBtn).not.toBeDisabled(); // Maintains keyboard DOM focus!

    const resetBtn = screen.getByRole("button", { name: "Đặt lại thu phóng" });
    expect(resetBtn).toHaveAttribute("aria-disabled", "true");
    expect(resetBtn).not.toBeDisabled();

    fireEvent.click(zoomOutBtn);
    expect(handleZoomOut).not.toHaveBeenCalled();

    fireEvent.click(resetBtn);
    expect(handleZoomReset).not.toHaveBeenCalled();
  });

  it("Z11: at ZOOM_MAX (300%), zoomIn has aria-disabled='true' and click is ignored", () => {
    const handleZoomIn = vi.fn();

    render(
      <ChartZoomControls
        zoom={3}
        onZoomIn={handleZoomIn}
        onZoomOut={vi.fn()}
        onZoomReset={vi.fn()}
      />,
    );

    const zoomInBtn = screen.getByRole("button", { name: "Phóng to biểu đồ" });
    expect(zoomInBtn).toHaveAttribute("aria-disabled", "true");
    expect(zoomInBtn).not.toBeDisabled();

    fireEvent.click(zoomInBtn);
    expect(handleZoomIn).not.toHaveBeenCalled();

    const output = screen.getByLabelText("Mức thu phóng");
    expect(output).toHaveTextContent("300%");
  });

  it("Z12: passes axe accessibility check at different zoom states", async () => {
    const { container: initialContainer } = render(
      <ChartZoomControls
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onZoomReset={vi.fn()}
      />,
    );
    expect(await axe(initialContainer)).toHaveNoViolations();

    const { container: zoomedContainer } = render(
      <ChartZoomControls
        zoom={2}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onZoomReset={vi.fn()}
      />,
    );
    expect(await axe(zoomedContainer)).toHaveNoViolations();
  });
});
