import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { chartFull } from "../../api/mocks/fixtures";
import { KNOWN_ZODIAC_SIGNS } from "../../api/types";
import { toChartViewModel } from "../../model/chartViewModel";
import { buildWheelGeometry } from "../../model/wheelGeometry";

import { ZodiacLayer } from "./ZodiacLayer";

describe("ZodiacLayer", () => {
  const vm = toChartViewModel(chartFull);
  const geo = buildWheelGeometry(vm);

  it("renders 12 sign cells with data-sign in correct zodiac order", () => {
    const { container } = render(
      <svg>
        <ZodiacLayer signs={geo.signs} />
      </svg>,
    );

    const layer = container.querySelector('[data-layer="zodiac-ring"]');
    expect(layer).toBeInTheDocument();
    expect(layer).toHaveAttribute("aria-hidden", "true");

    const signElements = container.querySelectorAll("[data-sign]");
    expect(signElements).toHaveLength(12);

    const renderedKeys = Array.from(signElements).map((el) =>
      el.getAttribute("data-sign"),
    );
    expect(renderedKeys).toEqual(KNOWN_ZODIAC_SIGNS);
  });

  it("renders two concentric circles with stroke-strong and strokeWidth 1.5", () => {
    const { container } = render(
      <svg>
        <ZodiacLayer signs={geo.signs} />
      </svg>,
    );

    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(2);

    circles.forEach((circle) => {
      expect(circle).toHaveClass("stroke-strong");
      expect(circle.getAttribute("stroke-width")).toBe("1.5");
      expect(circle.getAttribute("fill")).toBe("none");
    });
  });

  it("renders sign glyphs containing variation selector-15 (\\uFE0E)", () => {
    const { container } = render(
      <svg>
        <ZodiacLayer signs={geo.signs} />
      </svg>,
    );

    const textElements = container.querySelectorAll("text");
    expect(textElements).toHaveLength(12);

    textElements.forEach((el) => {
      expect(el.textContent).toContain("\uFE0E");
      expect(el).toHaveClass("fill-primary", "font-display");
      expect(el).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("uses token classes without inline style color overrides", () => {
    const { container } = render(
      <svg>
        <ZodiacLayer signs={geo.signs} />
      </svg>,
    );

    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(12);
    lines.forEach((line) => {
      expect(line).toHaveClass("stroke-subtle");
      expect(line.getAttribute("style")).toBeNull();
    });
  });
});
