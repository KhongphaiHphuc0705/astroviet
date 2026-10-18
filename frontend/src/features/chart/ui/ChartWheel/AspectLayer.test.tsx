import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { chartAllAspects, chartFull } from "../../api/mocks/fixtures";
import { buildAspectGeometry } from "../../model/aspectGeometry";
import { toChartViewModel } from "../../model/chartViewModel";

import { AspectLayer } from "./AspectLayer";

describe("AspectLayer (A1 - A6, A10 - A13)", () => {
  const allAspectsVM = toChartViewModel(chartAllAspects);
  const fullVM = toChartViewModel(chartFull);
  const allAspectsGeom = buildAspectGeometry(
    allAspectsVM.aspects,
    allAspectsVM.planets,
    allAspectsVM.flags.ascendantLongitude ?? 0,
  );

  it("A1: renders exact count of [data-aspect] matching geometry.lines.length for chartAllAspects", () => {
    const { container } = render(
      <svg viewBox="0 0 600 600">
        <AspectLayer geometry={allAspectsGeom} />
      </svg>,
    );

    const aspectElements = container.querySelectorAll("[data-aspect]");
    expect(aspectElements).toHaveLength(allAspectsGeom.lines.length);
    expect(allAspectsGeom.lines.length).toBeGreaterThan(0);
  });

  it("A2: applies presentation attributes (stroke-width, strokeDasharray, strokeLinecap) strictly per type", () => {
    const { container } = render(
      <svg viewBox="0 0 600 600">
        <AspectLayer geometry={allAspectsGeom} />
      </svg>,
    );

    // Trine: width 1.5, solid (no dasharray), butt
    const trine = container.querySelector('[data-type="Trine"]');
    expect(trine).toBeInTheDocument();
    expect(trine).toHaveAttribute("stroke-width", "1.5");
    expect(trine).not.toHaveAttribute("stroke-dasharray");
    expect(trine).toHaveAttribute("stroke-linecap", "butt");

    // Sextile: width 1.5, "1 5", round
    const sextile = container.querySelector('[data-type="Sextile"]');
    expect(sextile).toBeInTheDocument();
    expect(sextile).toHaveAttribute("stroke-width", "1.5");
    expect(sextile).toHaveAttribute("stroke-dasharray", "1 5");
    expect(sextile).toHaveAttribute("stroke-linecap", "round");

    // Square: width 2.5, "8 5", butt
    const square = container.querySelector('[data-type="Square"]');
    expect(square).toBeInTheDocument();
    expect(square).toHaveAttribute("stroke-width", "2.5");
    expect(square).toHaveAttribute("stroke-dasharray", "8 5");
    expect(square).toHaveAttribute("stroke-linecap", "butt");

    // Opposition: width 2.5, "16 6", butt
    const opposition = container.querySelector('[data-type="Opposition"]');
    expect(opposition).toBeInTheDocument();
    expect(opposition).toHaveAttribute("stroke-width", "2.5");
    expect(opposition).toHaveAttribute("stroke-dasharray", "16 6");
    expect(opposition).toHaveAttribute("stroke-linecap", "butt");

    // Conjunction: width 3, solid (no dasharray), round
    const conjunction = container.querySelector('[data-type="Conjunction"]');
    expect(conjunction).toBeInTheDocument();
    expect(conjunction).toHaveAttribute("stroke-width", "3");
    expect(conjunction).not.toHaveAttribute("stroke-dasharray");
    expect(conjunction).toHaveAttribute("stroke-linecap", "round");
  });

  it("A3: distinguishes nature and type not by color alone; line dash patterns differ across types", () => {
    // 5 types use distinct visual configurations (dasharray, width, linecap)
    const patterns = new Set(
      allAspectsGeom.lines.map(
        (l) =>
          `${l.style.dasharray ?? "solid"}|${l.style.width}|${l.style.linecap}`,
      ),
    );
    expect(patterns.size).toBeGreaterThanOrEqual(4);

    // Verify mutating tone doesn't change stroke pattern
    const geomWithUnknownTone = {
      ...allAspectsGeom,
      lines: allAspectsGeom.lines.map((l) => ({
        ...l,
        natureTone: "unknown" as const,
      })),
    };

    const { container } = render(
      <svg viewBox="0 0 600 600">
        <AspectLayer geometry={geomWithUnknownTone} />
      </svg>,
    );

    const square = container.querySelector('[data-type="Square"]');
    expect(square).toHaveAttribute("stroke-dasharray", "8 5");
    expect(square).toHaveAttribute("stroke-width", "2.5");
  });

  it("A4: applies literal CSS utility classes for stroke and fill according to natureTone", () => {
    const { container } = render(
      <svg viewBox="0 0 600 600">
        <AspectLayer geometry={allAspectsGeom} />
      </svg>,
    );

    // Harmonious -> stroke-accent-secondary
    const harmoniousLine = container.querySelector(
      '[data-nature="Harmonious"]',
    );
    expect(harmoniousLine).toHaveClass("stroke-accent-secondary");

    // Challenging -> stroke-accent-primary
    const challengingLine = container.querySelector(
      '[data-nature="Challenging"]',
    );
    expect(challengingLine).toHaveClass("stroke-accent-primary");

    // Neutral -> stroke-secondary
    const neutralLine = container.querySelector('[data-nature="Neutral"]');
    expect(neutralLine).toHaveClass("stroke-secondary");

    // Test dot shape and unknown tone
    const dotGeom = {
      ...allAspectsGeom,
      lines: [
        {
          ...allAspectsGeom.lines[0]!,
          key: "dot-test",
          shape: "dot" as const,
          natureTone: "unknown" as const,
          start: { x: 300, y: 192 },
          end: { x: 300, y: 192 },
          d: null,
          style: {
            shape: "arc" as const,
            dasharray: null,
            width: 3,
            linecap: "round" as const,
            patternLabelVi: "Cung liền, dày",
          },
        },
      ],
    };

    const { container: dotContainer } = render(
      <svg viewBox="0 0 600 600">
        <AspectLayer geometry={dotGeom} />
      </svg>,
    );

    const dot = dotContainer.querySelector('circle[data-shape="dot"]');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("fill-muted");
    expect(dot).toHaveAttribute("cx", "300");
    expect(dot).toHaveAttribute("cy", "192");
    expect(dot).toHaveAttribute("r", "1.5");
  });

  it("A5: returns null when geometry.lines is empty", () => {
    const emptyGeom = {
      lines: [],
      skipped: [],
      legend: [],
      ringRadius: 108,
    };

    const { container } = render(
      <svg viewBox="0 0 600 600">
        <AspectLayer geometry={emptyGeom} />
      </svg>,
    );

    expect(container.querySelector('[data-layer="aspects"]')).toBeNull();
    expect(container.querySelector("circle")).toBeNull();
  });

  it("A6: renders deterministically with identical innerHTML across multiple renders", () => {
    const fullGeom = buildAspectGeometry(
      fullVM.aspects,
      fullVM.planets,
      fullVM.flags.ascendantLongitude ?? 0,
    );

    const { container: firstRender } = render(
      <svg viewBox="0 0 600 600">
        <AspectLayer geometry={fullGeom} />
      </svg>,
    );
    const { container: secondRender } = render(
      <svg viewBox="0 0 600 600">
        <AspectLayer geometry={fullGeom} />
      </svg>,
    );

    expect(firstRender.innerHTML).toBe(secondRender.innerHTML);
  });

  it("A10: enforces accessibility and non-interactive constraints (aria-hidden, pointer-events-none, no tabIndex/role/handlers)", () => {
    const { container } = render(
      <svg viewBox="0 0 600 600">
        <AspectLayer geometry={allAspectsGeom} />
      </svg>,
    );

    const layerGroup = container.querySelector('[data-layer="aspects"]');
    expect(layerGroup).toHaveAttribute("aria-hidden", "true");
    expect(layerGroup).toHaveClass("pointer-events-none");

    const allDescendants = container.querySelectorAll(
      '[data-layer="aspects"] *',
    );
    allDescendants.forEach((el) => {
      expect(el.getAttribute("role")).toBeNull();
      expect(el.getAttribute("tabindex")).toBeNull();
      expect(el.getAttribute("onclick")).toBeNull();
      expect(el.getAttribute("onmouseenter")).toBeNull();
    });
  });

  it("A11: assigns unique data-aspect and keys to all lines", () => {
    const { container } = render(
      <svg viewBox="0 0 600 600">
        <AspectLayer geometry={allAspectsGeom} />
      </svg>,
    );

    const aspectEls = container.querySelectorAll("[data-aspect]");
    const keys = Array.from(aspectEls).map((el) =>
      el.getAttribute("data-aspect"),
    );
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });

  it("A13: ensures all line and circle coordinates fall strictly within viewBox [0, 600]", () => {
    const { container } = render(
      <svg viewBox="0 0 600 600">
        <AspectLayer geometry={allAspectsGeom} />
      </svg>,
    );

    // Anchor ring
    const ring = container.querySelector('[data-part="aspect-ring"]');
    expect(ring).toBeInTheDocument();
    expect(Number(ring?.getAttribute("cx"))).toBe(300);
    expect(Number(ring?.getAttribute("cy"))).toBe(300);
    expect(Number(ring?.getAttribute("r"))).toBe(108);

    // All path commands
    const paths = container.querySelectorAll("path");
    paths.forEach((p) => {
      const d = p.getAttribute("d");
      expect(d).toBeTruthy();
      expect(d).not.toContain("NaN");
      expect(d).not.toContain("Infinity");

      // Extract numbers from path d
      const numbers = (d?.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
      numbers.forEach((num) => {
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(600);
      });
    });
  });
});
