import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { chartFull } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";
import { buildWheelGeometry } from "../../model/wheelGeometry";

import { TickLayer } from "./TickLayer";

describe("TickLayer", () => {
  const vm = toChartViewModel(chartFull);
  const geo = buildWheelGeometry(vm);

  it("renders 72 total tick lines with aria-hidden", () => {
    const { container } = render(
      <svg>
        <TickLayer ticks={geo.ticks} />
      </svg>,
    );

    const layer = container.querySelector('[data-layer="degree-ticks"]');
    expect(layer).toBeInTheDocument();
    expect(layer).toHaveAttribute("aria-hidden", "true");

    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(72);
  });

  it("renders 12 major ticks with stroke-strong and stroke-width 1.5", () => {
    const { container } = render(
      <svg>
        <TickLayer ticks={geo.ticks} />
      </svg>,
    );

    const majorLines = container.querySelectorAll('line[data-kind="major"]');
    expect(majorLines).toHaveLength(12);

    majorLines.forEach((line) => {
      expect(line).toHaveClass("stroke-strong");
      expect(line.getAttribute("stroke-width")).toBe("1.5");
    });
  });

  it("renders 60 minor ticks with stroke-subtle and stroke-width 1", () => {
    const { container } = render(
      <svg>
        <TickLayer ticks={geo.ticks} />
      </svg>,
    );

    const minorLines = container.querySelectorAll('line[data-kind="minor"]');
    expect(minorLines).toHaveLength(60);

    minorLines.forEach((line) => {
      expect(line).toHaveClass("stroke-subtle");
      expect(line.getAttribute("stroke-width")).toBe("1");
    });
  });
});
