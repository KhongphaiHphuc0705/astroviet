import { describe, expect, it } from "vitest";

import {
  canZoomIn,
  canZoomOut,
  DEFAULT_ZOOM,
  formatZoomPercent,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  zoomIn,
  zoomOut,
} from "./zoom";

describe("zoom model (M9.2: Z4 - Z7)", () => {
  it("Z4: defines expected bounds and default constants", () => {
    expect(ZOOM_MIN).toBe(1);
    expect(ZOOM_MAX).toBe(3);
    expect(ZOOM_STEP).toBe(0.5);
    expect(DEFAULT_ZOOM).toBe(1);
  });

  it("Z5: zoomIn increases by ZOOM_STEP and clamps at ZOOM_MAX", () => {
    expect(zoomIn(1)).toBe(1.5);
    expect(zoomIn(1.5)).toBe(2);
    expect(zoomIn(2)).toBe(2.5);
    expect(zoomIn(2.5)).toBe(3);
    // Boundary clamp: cannot exceed 3
    expect(zoomIn(3)).toBe(3);
    expect(zoomIn(3.5)).toBe(3.5); // already past max, no-op
  });

  it("Z6: zoomOut decreases by ZOOM_STEP and clamps at ZOOM_MIN", () => {
    expect(zoomOut(3)).toBe(2.5);
    expect(zoomOut(2.5)).toBe(2);
    expect(zoomOut(2)).toBe(1.5);
    expect(zoomOut(1.5)).toBe(1);
    // Boundary clamp: cannot go below 1
    expect(zoomOut(1)).toBe(1);
    expect(zoomOut(0.5)).toBe(0.5); // already below min, no-op
  });

  it("Z7: canZoomIn and canZoomOut reflect boundaries accurately", () => {
    expect(canZoomIn(1)).toBe(true);
    expect(canZoomIn(2.5)).toBe(true);
    expect(canZoomIn(3)).toBe(false);

    expect(canZoomOut(1)).toBe(false);
    expect(canZoomOut(1.5)).toBe(true);
    expect(canZoomOut(3)).toBe(true);
  });

  it("formats percentage cleanly without floating point artifacts", () => {
    expect(formatZoomPercent(1)).toBe("100%");
    expect(formatZoomPercent(1.5)).toBe("150%");
    expect(formatZoomPercent(2)).toBe("200%");
    expect(formatZoomPercent(2.5)).toBe("250%");
    expect(formatZoomPercent(3)).toBe("300%");
  });
});
