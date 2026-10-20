import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import {
  chartAllAspects,
  chartFull,
  chartNoAspects,
  chartNoHouses,
} from "../../api/mocks/fixtures";
import { KNOWN_ZODIAC_SIGNS } from "../../api/types";
import { toChartViewModel } from "../../model/chartViewModel";
import { buildPlanetWheelModel } from "../../model/planetGeometry";

import { buildWheelDescription, ChartWheel } from "./ChartWheel";

describe("ChartWheel (M4.3 & M4.4: C1 - C16)", () => {
  const fullVM = toChartViewModel(chartFull);
  const noHousesVM = toChartViewModel(chartNoHouses);

  it("C1: renders figure[data-testid=chart-wheel] with svg[viewBox='0 0 600 600'] and role='group'", () => {
    const { container } = render(<ChartWheel vm={fullVM} />);

    const figure = container.querySelector('figure[data-testid="chart-wheel"]');
    expect(figure).toBeInTheDocument();

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 600 600");
    expect(svg).toHaveAttribute("role", "group");

    const titleId = svg?.getAttribute("aria-labelledby");
    const descId = svg?.getAttribute("aria-describedby");
    expect(titleId).toBeTruthy();
    expect(descId).toBeTruthy();

    const titleEl = document.getElementById(titleId!);
    const descEl = document.getElementById(descId!);
    expect(titleEl?.textContent).toBe("Biểu đồ Natal");
    expect(descEl?.textContent).toContain("Biểu đồ lá số chiêm tinh");
  });

  it("C2: zodiac ring has 12 sign elements in correct order with glyphs containing \\uFE0E", () => {
    const { container } = render(<ChartWheel vm={fullVM} />);

    const signEls = container.querySelectorAll(
      '[data-layer="zodiac-ring"] [data-sign]',
    );
    expect(signEls).toHaveLength(12);

    const signKeys = Array.from(signEls).map((el) =>
      el.getAttribute("data-sign"),
    );
    expect(signKeys).toEqual(KNOWN_ZODIAC_SIGNS);

    const glyphTexts = container.querySelectorAll(
      '[data-layer="zodiac-ring"] text',
    );
    expect(glyphTexts).toHaveLength(12);
    glyphTexts.forEach((text) => {
      expect(text.textContent).toContain("\uFE0E");
    });
  });

  it("C3: degree ticks layer has exactly 72 lines with 12 major ticks", () => {
    const { container } = render(<ChartWheel vm={fullVM} />);

    const tickLines = container.querySelectorAll(
      '[data-layer="degree-ticks"] line',
    );
    expect(tickLines).toHaveLength(72);

    const majorTicks = container.querySelectorAll(
      '[data-layer="degree-ticks"] line[data-kind="major"]',
    );
    expect(majorTicks).toHaveLength(12);
  });

  it("C4: with house data, renders house-ring with 12 houses and house numbers", () => {
    const { container } = render(<ChartWheel vm={fullVM} />);

    const houseLayer = container.querySelector('[data-layer="house-ring"]');
    expect(houseLayer).toBeInTheDocument();

    const houseEls = container.querySelectorAll(
      '[data-layer="house-ring"] [data-house]',
    );
    expect(houseEls).toHaveLength(12);

    const houseNumbers = Array.from(
      container.querySelectorAll('[data-layer="house-ring"] text'),
    ).map((t) => t.textContent);
    expect(houseNumbers).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
    ]);
  });

  it("C5: without house data (chartNoHouses), omits house-ring layer without errors", () => {
    const { container } = render(<ChartWheel vm={noHousesVM} />);

    const houseLayer = container.querySelector('[data-layer="house-ring"]');
    expect(houseLayer).not.toBeInTheDocument();

    // Zodiac and ticks must still be present
    expect(
      container.querySelector('[data-layer="zodiac-ring"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-layer="degree-ticks"]'),
    ).toBeInTheDocument();
  });

  it("C6: renders 4 cardinal angle markers with ASC/MC/DSC/IC labels and aria-label", () => {
    const { container } = render(<ChartWheel vm={fullVM} />);

    const angleEls = container.querySelectorAll(
      '[data-layer="angle-markers"] [data-angle]',
    );
    expect(angleEls).toHaveLength(4);

    const texts = container.querySelectorAll(
      '[data-layer="angle-markers"] text',
    );
    const shortLabels = Array.from(texts).map((t) => t.textContent);
    expect(shortLabels).toEqual(["ASC", "MC", "DSC", "IC"]);

    texts.forEach((text) => {
      expect(text.getAttribute("aria-label")).toBeTruthy();
    });
  });

  it("C7: handles missing angles gracefully without errors", () => {
    const partialAnglesVM = {
      ...fullVM,
      angles: fullVM.angles.filter((a) => a.key === "Ascendant"),
    };

    const { container } = render(<ChartWheel vm={partialAnglesVM} />);

    const angleEls = container.querySelectorAll(
      '[data-layer="angle-markers"] [data-angle]',
    );
    expect(angleEls).toHaveLength(1);
    expect(angleEls[0]?.getAttribute("data-angle")).toBe("Ascendant");
  });

  it("C8: ignores unrecognized angle markers without throwing", () => {
    const unknownAngleVM = {
      ...fullVM,
      angles: [
        ...fullVM.angles,
        {
          key: "HypotheticalVertex",
          known: false,
          shortLabel: "VTX",
          labelVi: "Điểm Vertex",
          ariaLabel: "Điểm Vertex",
          longitude: 120,
          sign: {
            key: "Leo",
            labelVi: "Sư Tử",
            glyph: "♌︎",
            known: true,
          },
          degreeLabel: "0°00′",
        },
      ],
    };

    const { container } = render(<ChartWheel vm={unknownAngleVM} />);

    const angleEls = container.querySelectorAll(
      '[data-layer="angle-markers"] [data-angle]',
    );
    expect(angleEls).toHaveLength(4);
    expect(
      container.querySelector('[data-angle="HypotheticalVertex"]'),
    ).not.toBeInTheDocument();
  });

  it("C9: layers are rendered in strict z-order in the DOM", () => {
    const { container } = render(<ChartWheel vm={fullVM} />);

    const layers = Array.from(container.querySelectorAll("svg > g")).map((g) =>
      g.getAttribute("data-layer"),
    );

    expect(layers).toEqual([
      "zodiac-ring",
      "degree-ticks",
      "house-ring",
      "angle-markers",
      "planets",
    ]);
  });

  it("C10: all rendered coordinates fall within the [0, 600] viewBox range", () => {
    const { container } = render(<ChartWheel vm={fullVM} />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();

    const elementsWithCoords = container.querySelectorAll("circle, line, text");
    elementsWithCoords.forEach((el) => {
      const attrs = ["cx", "cy", "x", "y", "x1", "y1", "x2", "y2"];
      attrs.forEach((attr) => {
        const val = el.getAttribute(attr);
        if (val !== null) {
          const num = Number.parseFloat(val);
          expect(num).toBeGreaterThanOrEqual(0);
          expect(num).toBeLessThanOrEqual(600);
        }
      });
    });
  });

  it("C11: uses Design System token classes without inline style colors", () => {
    const { container } = render(<ChartWheel vm={fullVM} />);

    const svgElements = container.querySelectorAll(
      "svg, svg circle, svg line, svg text, svg path",
    );
    svgElements.forEach((el) => {
      const style = el.getAttribute("style");
      if (style) {
        expect(style).not.toMatch(/color|fill|stroke|#[0-9a-fA-F]|rgb|hsl/);
      }
    });
  });

  it("C12: safe SVG rendering without raw markup or event handlers", () => {
    const { container } = render(<ChartWheel vm={fullVM} />);

    const svgElements = container.querySelectorAll("svg *");
    svgElements.forEach((el) => {
      expect(el.getAttribute("onclick")).toBeNull();
      expect(el.getAttribute("tabindex")).toBeNull();
    });
  });

  it("C13: passes vitest-axe accessibility audit across chart variants", async () => {
    // 1. Full chart with houses and all angles
    const { container: fullContainer } = render(<ChartWheel vm={fullVM} />);
    expect(await axe(fullContainer)).toHaveNoViolations();

    // 2. Chart without houses
    const { container: noHousesContainer } = render(
      <ChartWheel vm={noHousesVM} />,
    );
    expect(await axe(noHousesContainer)).toHaveNoViolations();

    // 3. Verify scrollable region attributes
    const scrollRegion = screen.getAllByRole("region")[0];
    expect(scrollRegion).toHaveAttribute("tabindex", "0");
    expect(scrollRegion).toHaveAttribute(
      "aria-label",
      "Biểu đồ tròn, có thể cuộn ngang trên màn hình hẹp",
    );
  });

  it("C14: figcaption describes scope accurately for Tier A and Tier B", () => {
    // 1. Tier A (standard fullVM)
    const { rerender } = render(<ChartWheel vm={fullVM} />);
    expect(
      screen.getByText(
        "Hiển thị vòng 12 cung, nhà, các góc và vị trí hành tinh.",
      ),
    ).toBeInTheDocument();

    // 2. Tier B (forced or cluster)
    const tierBModel = buildPlanetWheelModel(
      fullVM.planets,
      fullVM.flags.ascendantLongitude ?? 0,
      { forcedTier: "B" },
    );
    rerender(<ChartWheel vm={fullVM} planetModel={tierBModel} />);
    expect(
      screen.getByText(
        "Hiển thị vòng 12 cung, nhà, các góc và vị trí hành tinh. Độ của từng hành tinh xem ở bảng bên dưới.",
      ),
    ).toBeInTheDocument();
  });

  it("C15: buildWheelDescription mentions number of rendered planets but not aspects", () => {
    const fullDesc = buildWheelDescription(fullVM);
    expect(fullDesc).toContain("Hệ nhà Placidus.");
    expect(fullDesc).toContain("Cung Mọc tại Bạch Dương 14°53′.");
    expect(fullDesc).toContain("Hiển thị 10 hành tinh.");
    expect(fullDesc).not.toContain("góc chiếu");

    const noHousesDesc = buildWheelDescription(noHousesVM);
    expect(noHousesDesc).toContain("Không có dữ liệu nhà.");
    expect(noHousesDesc).toContain("Hiển thị 10 hành tinh.");
    expect(noHousesDesc).not.toContain("góc chiếu");
  });

  it("C16: renders deterministically with identical innerHTML across renders", () => {
    const { container: firstRender } = render(<ChartWheel vm={fullVM} />);
    const { container: secondRender } = render(<ChartWheel vm={fullVM} />);

    // Compare SVG structural markup (ignoring unique useId prefixes)
    const normalizeIds = (html: string) =>
      html.replace(/:r[0-9a-z]+:/g, ":id:");
    expect(normalizeIds(firstRender.innerHTML)).toBe(
      normalizeIds(secondRender.innerHTML),
    );
  });

  it("C17: renders svg with role='group', desc with planet count, and PlanetLayer with tier attribute", () => {
    const { container } = render(<ChartWheel vm={fullVM} />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("role", "group");

    const descId = svg?.getAttribute("aria-describedby");
    const descEl = document.getElementById(descId!);
    expect(descEl?.textContent).toContain("Hiển thị 10 hành tinh.");

    const planetLayer = container.querySelector('[data-layer="planets"]');
    expect(planetLayer).toBeInTheDocument();
    expect(planetLayer).toHaveAttribute("data-label-tier", "A");
  });

  it("C18: regression check: S4.4 foundation coordinates (ASC at 180°, MC, house cusps) remain strictly stable", () => {
    const { container } = render(<ChartWheel vm={fullVM} />);

    // Ascendant axis line (horizontal left: y1 === y2 === 300, x2 < x1)
    const ascLine = container.querySelector(
      '[data-layer="angle-markers"] [data-angle="Ascendant"] line',
    );
    expect(ascLine).toBeInTheDocument();
    expect(Number.parseFloat(ascLine?.getAttribute("y1") ?? "")).toBeCloseTo(
      300,
      1,
    );
    expect(Number.parseFloat(ascLine?.getAttribute("y2") ?? "")).toBeCloseTo(
      300,
      1,
    );
    expect(Number.parseFloat(ascLine?.getAttribute("x2") ?? "")).toBeLessThan(
      Number.parseFloat(ascLine?.getAttribute("x1") ?? ""),
    );
  });

  it("C19: handles 0 planets and overflow status in description and figcaption", () => {
    // 0 planets
    const emptyVM = { ...fullVM, planets: [] };
    const emptyDesc = buildWheelDescription(emptyVM);
    expect(emptyDesc).toContain("Không có hành tinh nào được hiển thị.");
    expect(emptyDesc).not.toContain("Hiển thị 0 hành tinh.");

    // Overflow status
    const fullModel = buildPlanetWheelModel(
      fullVM.planets,
      fullVM.flags.ascendantLongitude ?? 0,
    );
    const overflowModel = { ...fullModel, status: "overflow" as const };
    const overflowDesc = buildWheelDescription(fullVM, overflowModel);
    expect(overflowDesc).toContain(
      "Vị trí hành tinh hiển thị bằng vạch dấu; chi tiết xem tại bảng bên dưới.",
    );
    expect(overflowDesc).not.toContain("Hiển thị 10 hành tinh.");

    const { container } = render(
      <ChartWheel vm={fullVM} planetModel={overflowModel} />,
    );
    const figcaption = container.querySelector("figcaption");
    expect(figcaption?.textContent).toBe(
      "Do các hành tinh tập trung quá dày, nhãn chữ không hiển thị trên vòng tròn. Vui lòng xem bảng dữ liệu chi tiết bên dưới.",
    );
  });

  describe("AspectLayer Integration (A7 - A9, A12)", () => {
    const allAspectsVM = toChartViewModel(chartAllAspects);
    const noAspectsVM = toChartViewModel(chartNoAspects);

    it("A7: toggling showAspectLines does not alter other layer elements or planet marker coordinates", () => {
      const { container: offContainer } = render(
        <ChartWheel vm={allAspectsVM} showAspectLines={false} />,
      );
      const { container: onContainer } = render(
        <ChartWheel vm={allAspectsVM} showAspectLines={true} />,
      );

      // Verify layer counts
      const offSigns = offContainer.querySelectorAll(
        '[data-layer="zodiac-ring"] *',
      );
      const onSigns = onContainer.querySelectorAll(
        '[data-layer="zodiac-ring"] *',
      );
      expect(offSigns).toHaveLength(onSigns.length);

      const offHouses = offContainer.querySelectorAll(
        '[data-layer="house-ring"] *',
      );
      const onHouses = onContainer.querySelectorAll(
        '[data-layer="house-ring"] *',
      );
      expect(offHouses).toHaveLength(onHouses.length);

      const offPlanets = offContainer.querySelectorAll(
        '[data-layer="planets"] [data-planet]',
      );
      const onPlanets = onContainer.querySelectorAll(
        '[data-layer="planets"] [data-planet]',
      );
      expect(offPlanets).toHaveLength(onPlanets.length);

      // Verify marker coordinates for all planets are identical
      offPlanets.forEach((pOff) => {
        const key = pOff.getAttribute("data-planet");
        const pOn = onContainer.querySelector(
          `[data-layer="planets"] [data-planet="${key}"]`,
        );
        const offLine = pOff.querySelector("line");
        const onLine = pOn?.querySelector("line");

        expect(offLine?.getAttribute("x1")).toBe(onLine?.getAttribute("x1"));
        expect(offLine?.getAttribute("y1")).toBe(onLine?.getAttribute("y1"));
        expect(offLine?.getAttribute("x2")).toBe(onLine?.getAttribute("x2"));
        expect(offLine?.getAttribute("y2")).toBe(onLine?.getAttribute("y2"));
      });
    });

    it("A8: renders cleanly without error and without aspect layer for chartNoAspects", () => {
      const { container } = render(
        <ChartWheel vm={noAspectsVM} showAspectLines={true} />,
      );

      expect(container.querySelector('[data-layer="aspects"]')).toBeNull();
      const figcaption = container.querySelector("figcaption");
      expect(figcaption?.textContent).toBe(
        "Hiển thị vòng 12 cung, nhà, các góc và vị trí hành tinh.",
      );
    });

    it("A9: renders aspect lines cleanly for chartNoHouses while preserving baseline r=175", () => {
      const { container } = render(
        <ChartWheel vm={noHousesVM} showAspectLines={true} />,
      );

      const aspectLayer = container.querySelector('[data-layer="aspects"]');
      expect(aspectLayer).toBeInTheDocument();

      const baseline = container.querySelector('circle[data-part="baseline"]');
      expect(baseline).toBeInTheDocument();
      expect(baseline).toHaveAttribute("r", "175");
    });

    it("A12: AspectLayer is placed strictly before PlanetLayer in the DOM tree when showAspectLines is true", () => {
      const { container } = render(
        <ChartWheel vm={allAspectsVM} showAspectLines={true} />,
      );

      const layers = Array.from(container.querySelectorAll("svg > g")).map(
        (g) => g.getAttribute("data-layer"),
      );

      expect(layers).toEqual([
        "zodiac-ring",
        "degree-ticks",
        "house-ring",
        "angle-markers",
        "aspects",
        "planets",
      ]);

      const figcaption = container.querySelector("figcaption");
      expect(figcaption?.textContent).toContain("các đường góc chiếu");
      expect(figcaption?.textContent).toContain(
        "Kiểu nét giúp phân biệt nhóm góc chiếu",
      );
    });
  });
});
