import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { chartFull } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";
import { buildWheelGeometry } from "../../model/wheelGeometry";

import { AngleLayer } from "./AngleLayer";

describe("AngleLayer", () => {
  const vm = toChartViewModel(chartFull);
  const geo = buildWheelGeometry(vm);

  it("renders 4 angle markers with stroke-strong lines and accessible text labels", () => {
    const { container } = render(
      <svg>
        <AngleLayer angles={geo.angles} />
      </svg>,
    );

    const layer = container.querySelector('[data-layer="angle-markers"]');
    expect(layer).toBeInTheDocument();

    const angleGroups = container.querySelectorAll("[data-angle]");
    expect(angleGroups).toHaveLength(4);

    const keys = Array.from(angleGroups).map((el) =>
      el.getAttribute("data-angle"),
    );
    expect(keys).toEqual(["Ascendant", "Midheaven", "Descendant", "ImumCoeli"]);

    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(4);
    lines.forEach((line) => {
      expect(line).toHaveClass("stroke-strong");
      expect(line.getAttribute("stroke-width")).toBe("2.5");
    });

    const texts = container.querySelectorAll("text");
    expect(texts).toHaveLength(4);
    const labels = Array.from(texts).map((t) => t.textContent);
    expect(labels).toEqual(["ASC", "MC", "DSC", "IC"]);

    texts.forEach((text) => {
      expect(text).toHaveClass("fill-primary", "font-data", "font-bold");
      expect(text.getAttribute("aria-label")).toBeTruthy();
    });
  });

  it("renders empty layer group gracefully when angles array is empty", () => {
    const { container } = render(
      <svg>
        <AngleLayer angles={[]} />
      </svg>,
    );

    const layer = container.querySelector('[data-layer="angle-markers"]');
    expect(layer).toBeInTheDocument();
    expect(container.querySelectorAll("[data-angle]")).toHaveLength(0);
  });
});
