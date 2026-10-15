import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { chartFull } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";
import { buildWheelGeometry } from "../../model/wheelGeometry";

import { HouseLayer } from "./HouseLayer";

describe("HouseLayer", () => {
  const vm = toChartViewModel(chartFull);
  const geo = buildWheelGeometry(vm);

  it("renders house ring with 2 concentric circles, 12 spokes, and 12 numbers", () => {
    const { container } = render(
      <svg>
        <HouseLayer houses={geo.houses} />
      </svg>,
    );

    const layer = container.querySelector('[data-layer="house-ring"]');
    expect(layer).toBeInTheDocument();
    expect(layer).toHaveAttribute("aria-hidden", "true");

    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(2);
    circles.forEach((circle) => {
      expect(circle).toHaveClass("stroke-subtle");
      expect(circle.getAttribute("stroke-width")).toBe("1");
    });

    const houseGroups = container.querySelectorAll("[data-house]");
    expect(houseGroups).toHaveLength(12);

    const textElements = container.querySelectorAll("text");
    expect(textElements).toHaveLength(12);
    textElements.forEach((text, i) => {
      expect(text.textContent).toBe(String(i + 1));
      expect(text).toHaveClass("fill-secondary", "font-data");
      expect(text).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("returns null when houses is null or empty", () => {
    const { container: nullContainer } = render(
      <svg>
        <HouseLayer houses={null} />
      </svg>,
    );
    expect(
      nullContainer.querySelector('[data-layer="house-ring"]'),
    ).not.toBeInTheDocument();

    const { container: emptyContainer } = render(
      <svg>
        <HouseLayer houses={[]} />
      </svg>,
    );
    expect(
      emptyContainer.querySelector('[data-layer="house-ring"]'),
    ).not.toBeInTheDocument();
  });
});
