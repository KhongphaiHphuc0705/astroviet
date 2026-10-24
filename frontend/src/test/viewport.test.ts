import { describe, it, expect, vi, afterEach } from "vitest";

import {
  evaluateMediaQueryForWidth,
  installViewport,
  type ViewportController,
} from "./viewport";

describe("evaluateMediaQueryForWidth", () => {
  it("evaluates min-width queries correctly", () => {
    expect(evaluateMediaQueryForWidth("(min-width: 640px)", 639)).toBe(false);
    expect(evaluateMediaQueryForWidth("(min-width: 640px)", 640)).toBe(true);
    expect(evaluateMediaQueryForWidth("(min-width: 640px)", 1024)).toBe(true);
  });

  it("evaluates max-width queries correctly", () => {
    expect(evaluateMediaQueryForWidth("(max-width: 767px)", 767)).toBe(true);
    expect(evaluateMediaQueryForWidth("(max-width: 767px)", 768)).toBe(false);
    expect(evaluateMediaQueryForWidth("(max-width: 767.98px)", 767.98)).toBe(
      true,
    );
    expect(evaluateMediaQueryForWidth("(max-width: 767.98px)", 768)).toBe(
      false,
    );
  });

  it("evaluates range/compound queries correctly", () => {
    const rangeQuery = "(min-width: 768px) and (max-width: 1023px)";
    expect(evaluateMediaQueryForWidth(rangeQuery, 767)).toBe(false);
    expect(evaluateMediaQueryForWidth(rangeQuery, 768)).toBe(true);
    expect(evaluateMediaQueryForWidth(rangeQuery, 900)).toBe(true);
    expect(evaluateMediaQueryForWidth(rangeQuery, 1023)).toBe(true);
    expect(evaluateMediaQueryForWidth(rangeQuery, 1024)).toBe(false);
  });

  it("evaluates comma-separated OR queries correctly", () => {
    const orQuery = "(max-width: 400px), (min-width: 1200px)";
    expect(evaluateMediaQueryForWidth(orQuery, 375)).toBe(true);
    expect(evaluateMediaQueryForWidth(orQuery, 800)).toBe(false);
    expect(evaluateMediaQueryForWidth(orQuery, 1280)).toBe(true);
  });

  it("returns false for non-width queries without fallback", () => {
    expect(
      evaluateMediaQueryForWidth("(prefers-reduced-motion: reduce)", 1024),
    ).toBe(false);
  });
});

describe("installViewport", () => {
  let viewport: ViewportController | null = null;

  afterEach(() => {
    if (viewport) {
      viewport.restore();
      viewport = null;
    }
  });

  it("initializes with specified width and sets window.innerWidth", () => {
    viewport = installViewport(375);
    expect(viewport.getWidth()).toBe(375);
    expect(window.innerWidth).toBe(375);

    const mql640 = window.matchMedia("(min-width: 640px)");
    expect(mql640.matches).toBe(false);

    const mqlMobile = window.matchMedia("(max-width: 639px)");
    expect(mqlMobile.matches).toBe(true);
  });

  it("defaults to 1024px if not specified", () => {
    viewport = installViewport();
    expect(viewport.getWidth()).toBe(1024);
    expect(window.innerWidth).toBe(1024);

    const mql = window.matchMedia("(min-width: 768px)");
    expect(mql.matches).toBe(true);
  });

  it("dispatches change events to active listeners when setWidth crosses boundary", () => {
    viewport = installViewport(375);
    const mql = window.matchMedia("(min-width: 768px)");
    expect(mql.matches).toBe(false);

    const changeListener = vi.fn();
    mql.addEventListener("change", changeListener);

    viewport.setWidth(800);
    expect(mql.matches).toBe(true);
    expect(changeListener).toHaveBeenCalledTimes(1);
    expect(changeListener).toHaveBeenCalledWith(
      expect.objectContaining({
        matches: true,
        media: "(min-width: 768px)",
      }),
    );

    // Scaling down back to mobile
    viewport.setWidth(375);
    expect(mql.matches).toBe(false);
    expect(changeListener).toHaveBeenCalledTimes(2);
    expect(changeListener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        matches: false,
        media: "(min-width: 768px)",
      }),
    );
  });

  it("restores original window.matchMedia and window.innerWidth upon restore", () => {
    const originalInnerWidth = window.innerWidth;
    viewport = installViewport(500);
    expect(window.innerWidth).toBe(500);

    viewport.restore();
    viewport = null;

    expect(window.innerWidth).toBe(originalInnerWidth);
  });
});
