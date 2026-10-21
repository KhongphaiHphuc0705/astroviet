import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { chartFull, chartNoHouses } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";
import { buildPlanetWheelModel } from "../../model/planetGeometry";

import { PlanetLayer } from "./PlanetLayer";

describe("PlanetLayer (M5 Task 4: PL1 - PL15)", () => {
  const fullVM = toChartViewModel(chartFull);
  const noHousesVM = toChartViewModel(chartNoHouses);
  const rotation = fullVM.flags.ascendantLongitude ?? 0;
  const fullModelA = buildPlanetWheelModel(fullVM.planets, rotation, {
    forcedTier: "A",
  });
  const fullModelB = buildPlanetWheelModel(fullVM.planets, rotation, {
    forcedTier: "B",
  });

  it("PL1: renders exact number of planet groups (10) and markers (10) for chartFull", () => {
    const { container } = render(
      <svg>
        <PlanetLayer model={fullModelA} />
      </svg>,
    );

    const planetGroups = container.querySelectorAll(
      '[data-part="labels"] > [data-planet]',
    );
    expect(planetGroups).toHaveLength(10);

    const markers = container.querySelectorAll(
      '[data-part="marks"] line[data-part="marker"]',
    );
    expect(markers).toHaveLength(10);
  });

  it("PL2: renders 10 glyph elements with stable canonical data-planet keys", () => {
    const { container } = render(
      <svg>
        <PlanetLayer model={fullModelA} />
      </svg>,
    );

    const glyphs = container.querySelectorAll(
      '[data-part="labels"] text[data-part="glyph"]',
    );
    expect(glyphs).toHaveLength(10);

    const expectedKeys = fullVM.planets.map((p) => p.key);
    const renderedKeys = Array.from(
      container.querySelectorAll('[data-part="labels"] > [data-planet]'),
    ).map((el) => el.getAttribute("data-planet"));

    expect(renderedKeys).toEqual(expectedKeys);
  });

  it("PL3: retrograde symbol ℞ appears exactly 3 times (Mercury, Venus, Jupiter) and nowhere else", () => {
    const { container } = render(
      <svg>
        <PlanetLayer model={fullModelA} />
      </svg>,
    );

    const retroTexts = container.querySelectorAll(
      '[data-part="labels"] text[data-part="retrograde"]',
    );
    expect(retroTexts).toHaveLength(3);

    const retroPlanets = Array.from(retroTexts).map((el) =>
      el.parentElement?.getAttribute("data-planet"),
    );
    expect(retroPlanets).toEqual(["Mercury", "Venus", "Jupiter"]);

    retroTexts.forEach((el) => {
      expect(el.textContent).toBe("℞");
    });
  });

  it("PL4: degree labels render as whole degrees D° in Tier A and are absent in Tier B", () => {
    // Tier A
    const { container: containerA } = render(
      <svg>
        <PlanetLayer model={fullModelA} />
      </svg>,
    );
    const degreesA = containerA.querySelectorAll(
      '[data-part="labels"] text[data-part="degree"]',
    );
    expect(degreesA).toHaveLength(10);
    degreesA.forEach((deg) => {
      expect(deg.textContent).toMatch(/^\d+°$/);
    });

    // Tier B
    const { container: containerB } = render(
      <svg>
        <PlanetLayer model={fullModelB} />
      </svg>,
    );
    const degreesB = containerB.querySelectorAll(
      '[data-part="labels"] text[data-part="degree"]',
    );
    expect(degreesB).toHaveLength(0);
  });

  it("PL5: leader lines are rendered only for displaced items with gap > 4", () => {
    const { container } = render(
      <svg>
        <PlanetLayer model={fullModelA} />
      </svg>,
    );

    const leaderLines = container.querySelectorAll(
      '[data-part="marks"] line[data-part="leader"]',
    );
    const expectedLeaderCount = fullModelA.planets.filter(
      (p) => p.leader !== null,
    ).length;
    expect(leaderLines).toHaveLength(expectedLeaderCount);
  });

  it("PL6: renders deterministically with stable element keys and structure across re-renders", () => {
    const { container: first } = render(
      <svg>
        <PlanetLayer model={fullModelA} />
      </svg>,
    );
    const { container: second } = render(
      <svg>
        <PlanetLayer model={fullModelA} />
      </svg>,
    );

    expect(first.innerHTML).toBe(second.innerHTML);
  });

  it("PL7: accessible groups have role='img' and descriptive aria-label", () => {
    const { container } = render(
      <svg>
        <PlanetLayer model={fullModelA} />
      </svg>,
    );

    const sunGroup = container.querySelector(
      '[data-part="labels"] > [data-planet="Sun"]',
    );
    expect(sunGroup).toHaveAttribute("role", "img");
    expect(sunGroup).toHaveAttribute(
      "aria-label",
      "Mặt Trời, ở Ma Kết, 10°31′, nhà 9",
    );

    const mercuryGroup = container.querySelector(
      '[data-part="labels"] > [data-planet="Mercury"]',
    );
    expect(mercuryGroup).toHaveAttribute(
      "aria-label",
      "Sao Thủy, nghịch hành, ở Ma Kết, 25°45′, nhà 10",
    );
  });

  it("PL8: marks group has aria-hidden='true' and decorative elements have no aria-label", () => {
    const { container } = render(
      <svg>
        <PlanetLayer model={fullModelA} />
      </svg>,
    );

    const marksGroup = container.querySelector('[data-part="marks"]');
    expect(marksGroup).toHaveAttribute("aria-hidden", "true");

    const textParts = container.querySelectorAll(
      '[data-part="glyph"], [data-part="retrograde"], [data-part="degree"]',
    );
    textParts.forEach((text) => {
      expect(text).toHaveAttribute("aria-hidden", "true");
      expect(text.getAttribute("aria-label")).toBeNull();
    });
  });

  it("PL9: completely non-interactive (no button, tabindex, or handler attributes)", () => {
    const { container } = render(
      <svg>
        <PlanetLayer model={fullModelA} />
      </svg>,
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    const allElements = container.querySelectorAll("*");
    allElements.forEach((el) => {
      expect(el.getAttribute("tabindex")).toBeNull();
      expect(el.getAttribute("onclick")).toBeNull();
    });
  });

  it("PL10: true position marker coordinates in DOM do NOT change between Tier A and Tier B", () => {
    const { container: containerA } = render(
      <svg>
        <PlanetLayer model={fullModelA} />
      </svg>,
    );
    const { container: containerB } = render(
      <svg>
        <PlanetLayer model={fullModelB} />
      </svg>,
    );

    fullModelA.planets.forEach((p) => {
      const markerA = containerA.querySelector(
        `line[data-part="marker"][data-planet="${p.id}"]`,
      );
      const markerB = containerB.querySelector(
        `line[data-part="marker"][data-planet="${p.id}"]`,
      );

      expect(markerA).toBeInTheDocument();
      expect(markerB).toBeInTheDocument();

      expect(markerA?.getAttribute("x1")).toBe(markerB?.getAttribute("x1"));
      expect(markerA?.getAttribute("y1")).toBe(markerB?.getAttribute("y1"));
      expect(markerA?.getAttribute("x2")).toBe(markerB?.getAttribute("x2"));
      expect(markerA?.getAttribute("y2")).toBe(markerB?.getAttribute("y2"));
    });
  });

  it("PL11: all fontSizes >= 15 and scale >= 10 CSS px at 400px minimum display", () => {
    const { container } = render(
      <svg>
        <PlanetLayer model={fullModelA} />
      </svg>,
    );

    const texts = container.querySelectorAll("text");
    expect(texts.length).toBeGreaterThan(0);
    texts.forEach((text) => {
      const fontSizeAttr =
        text.getAttribute("font-size") ?? text.getAttribute("fontSize");
      expect(fontSizeAttr).toBeTruthy();
      const fontSize = Number.parseFloat(fontSizeAttr!);
      expect(fontSize).toBeGreaterThanOrEqual(15);
      // At 400px viewBox scale (400/600):
      expect(fontSize * (400 / 600)).toBeGreaterThanOrEqual(10);
    });
  });

  it("PL12: label center coordinates remain within the [0, 600] viewBox boundaries", () => {
    const { container } = render(
      <svg>
        <PlanetLayer model={fullModelA} />
      </svg>,
    );

    const texts = container.querySelectorAll("text");
    texts.forEach((text) => {
      const x = Number.parseFloat(text.getAttribute("x")!);
      const y = Number.parseFloat(text.getAttribute("y")!);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(600);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(600);
    });
  });

  it("PL13: chartNoHouses renders baseline circle, has no house numbers, and omits house in aria", () => {
    const noHousesModel = buildPlanetWheelModel(
      noHousesVM.planets,
      noHousesVM.flags.ascendantLongitude ?? 0,
      { hasHouses: false },
    );

    const { container } = render(
      <svg>
        <PlanetLayer model={noHousesModel} />
      </svg>,
    );

    const baseline = container.querySelector('circle[data-part="baseline"]');
    expect(baseline).toBeInTheDocument();
    expect(baseline).toHaveAttribute("r", "175");
    expect(baseline).toHaveAttribute("aria-hidden", "true");

    const sunGroup = container.querySelector(
      '[data-part="labels"] > [data-planet="Sun"]',
    );
    expect(sunGroup).toBeInTheDocument();
    expect(sunGroup?.getAttribute("aria-label")).not.toContain("nhà");
  });

  it("PL14: passes vitest-axe accessibility audit without violations", async () => {
    const { container } = render(
      <svg role="group" aria-label="Biểu đồ hành tinh">
        <PlanetLayer model={fullModelA} />
      </svg>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("PL15: returns null when model has 0 planets", () => {
    const emptyModel = buildPlanetWheelModel([], 0, { hasHouses: true });
    const { container } = render(
      <svg>
        <PlanetLayer model={emptyModel} />
      </svg>,
    );

    expect(container.querySelector('[data-layer="planets"]')).toBeNull();
  });

  it("PL16: in overflow status renders accessible label groups without visible text and passes axe", async () => {
    const overflowModel = {
      ...fullModelA,
      status: "overflow" as const,
    };

    const { container } = render(
      <svg role="group" aria-label="Biểu đồ hành tinh overflow">
        <PlanetLayer model={overflowModel} />
      </svg>,
    );

    // 10 accessible planet groups are still present
    const planetGroups = container.querySelectorAll(
      '[data-part="labels"] > [data-planet]',
    );
    expect(planetGroups).toHaveLength(10);
    planetGroups.forEach((g) => {
      expect(g).toHaveAttribute("role", "img");
      expect(g.getAttribute("aria-label")).toBeTruthy();
    });

    // 0 visible text elements
    expect(
      container.querySelectorAll('[data-part="labels"] text'),
    ).toHaveLength(0);

    // Markers are still present
    expect(
      container.querySelectorAll(
        '[data-part="marks"] line[data-part="marker"]',
      ),
    ).toHaveLength(10);

    // Accessibility passes
    expect(await axe(container)).toHaveNoViolations();
  });

  describe("PlanetLayer Interactive Mode (PL-I1 - PL-I10)", () => {
    it("PL-I1: renders role='button', tabIndex={0}, aria-pressed, and accessible name starting with 'Chọn'", () => {
      const mockInteraction = {
        selection: { kind: "planet" as const, key: "Sun" },
        emphasis: {
          planets: new Set(["Sun", "Moon"]),
          aspects: new Set<string>(),
          active: true,
        },
        onSelect: vi.fn(),
        onPreview: vi.fn(),
      };

      const { container } = render(
        <svg>
          <PlanetLayer model={fullModelA} interaction={mockInteraction} />
        </svg>,
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(10);

      const sunButton = container.querySelector(
        '[data-part="labels"] > [data-planet="Sun"]',
      );
      expect(sunButton).toHaveAttribute("role", "button");
      expect(sunButton).toHaveAttribute("tabindex", "0");
      expect(sunButton).toHaveAttribute("aria-pressed", "true");
      expect(sunButton?.getAttribute("aria-label")).toMatch(/^Chọn /);

      const moonButton = container.querySelector(
        '[data-part="labels"] > [data-planet="Moon"]',
      );
      expect(moonButton).toHaveAttribute("aria-pressed", "false");
    });

    it("PL-I2: renders touch target rect >= 36x36 for all planets", () => {
      const mockInteraction = {
        selection: { kind: "none" as const },
        emphasis: {
          planets: new Set<string>(),
          aspects: new Set<string>(),
          active: false,
        },
        onSelect: vi.fn(),
        onPreview: vi.fn(),
      };

      const { container } = render(
        <svg>
          <PlanetLayer model={fullModelA} interaction={mockInteraction} />
        </svg>,
      );

      const rects = container.querySelectorAll(
        '[data-part="labels"] > [data-planet] rect[aria-hidden="true"]',
      );
      expect(rects.length).toBeGreaterThanOrEqual(10);
      rects.forEach((rect) => {
        const width = Number(rect.getAttribute("width"));
        const height = Number(rect.getAttribute("height"));
        expect(width).toBeGreaterThanOrEqual(36);
        expect(height).toBeGreaterThanOrEqual(36);
      });
    });

    it("PL-I3: clicking planet triggers interaction.onSelect", () => {
      const onSelect = vi.fn();
      const mockInteraction = {
        selection: { kind: "none" as const },
        emphasis: {
          planets: new Set<string>(),
          aspects: new Set<string>(),
          active: false,
        },
        onSelect,
        onPreview: vi.fn(),
      };

      const { container } = render(
        <svg>
          <PlanetLayer model={fullModelA} interaction={mockInteraction} />
        </svg>,
      );

      const sun = container.querySelector(
        '[data-part="labels"] > [data-planet="Sun"]',
      )!;
      fireEvent.click(sun);
      expect(onSelect).toHaveBeenCalledWith({ kind: "planet", key: "Sun" });
    });

    it("PL-I4: pressing Enter and Space triggers onSelect, Space prevents default", () => {
      const onSelect = vi.fn();
      const mockInteraction = {
        selection: { kind: "none" as const },
        emphasis: {
          planets: new Set<string>(),
          aspects: new Set<string>(),
          active: false,
        },
        onSelect,
        onPreview: vi.fn(),
      };

      const { container } = render(
        <svg>
          <PlanetLayer model={fullModelA} interaction={mockInteraction} />
        </svg>,
      );

      const sun = container.querySelector(
        '[data-part="labels"] > [data-planet="Sun"]',
      )!;
      fireEvent.keyDown(sun, { key: "Enter" });
      expect(onSelect).toHaveBeenCalledWith({ kind: "planet", key: "Sun" });

      const spaceEvent = new KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(spaceEvent, "preventDefault");
      sun.dispatchEvent(spaceEvent);
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(onSelect).toHaveBeenCalledTimes(2);
    });

    it("PL-I5: pointer enter/leave with pointerType='mouse' triggers onPreview", () => {
      const onPreview = vi.fn();
      const mockInteraction = {
        selection: { kind: "none" as const },
        emphasis: {
          planets: new Set<string>(),
          aspects: new Set<string>(),
          active: false,
        },
        onSelect: vi.fn(),
        onPreview,
      };

      const { container } = render(
        <svg>
          <PlanetLayer model={fullModelA} interaction={mockInteraction} />
        </svg>,
      );

      const sun = container.querySelector(
        '[data-part="labels"] > [data-planet="Sun"]',
      )!;

      // Touch pointer events do not trigger preview (no sticky hover on mobile)
      fireEvent.pointerEnter(sun, { pointerType: "touch" });
      expect(onPreview).not.toHaveBeenCalled();

      // Mouse pointer events trigger preview
      fireEvent.pointerEnter(sun, { pointerType: "mouse" });
      expect(onPreview).toHaveBeenCalledWith(
        { kind: "planet", key: "Sun" },
        "hover",
        "enter",
      );

      fireEvent.pointerLeave(sun, { pointerType: "mouse" });
      expect(onPreview).toHaveBeenCalledWith(
        { kind: "planet", key: "Sun" },
        "hover",
        "leave",
      );
    });

    it("PL-I6: focus and blur triggers onPreview with focus source", () => {
      const onPreview = vi.fn();
      const mockInteraction = {
        selection: { kind: "none" as const },
        emphasis: {
          planets: new Set<string>(),
          aspects: new Set<string>(),
          active: false,
        },
        onSelect: vi.fn(),
        onPreview,
      };

      const { container } = render(
        <svg>
          <PlanetLayer model={fullModelA} interaction={mockInteraction} />
        </svg>,
      );

      const sun = container.querySelector(
        '[data-part="labels"] > [data-planet="Sun"]',
      )!;
      fireEvent.focus(sun);
      expect(onPreview).toHaveBeenCalledWith(
        { kind: "planet", key: "Sun" },
        "focus",
        "enter",
      );

      fireEvent.blur(sun);
      expect(onPreview).toHaveBeenCalledWith(
        { kind: "planet", key: "Sun" },
        "focus",
        "leave",
      );
    });

    it("PL-I7: renders selected and related halo rings and dimming classes", () => {
      const mockInteraction = {
        selection: { kind: "planet" as const, key: "Sun" },
        emphasis: {
          planets: new Set(["Sun", "Moon"]),
          aspects: new Set<string>(),
          active: true,
        },
        onSelect: vi.fn(),
        onPreview: vi.fn(),
      };

      const { container } = render(
        <svg>
          <PlanetLayer model={fullModelA} interaction={mockInteraction} />
        </svg>,
      );

      const sun = container.querySelector(
        '[data-part="labels"] > [data-planet="Sun"]',
      )!;
      expect(
        sun.querySelector("circle.stroke-accent-primary"),
      ).toBeInTheDocument();

      const moon = container.querySelector(
        '[data-part="labels"] > [data-planet="Moon"]',
      )!;
      expect(
        moon.querySelector("circle.stroke-accent-secondary"),
      ).toBeInTheDocument();

      const mars = container.querySelector(
        '[data-part="labels"] > [data-planet="Mars"]',
      )!;
      expect(mars).toHaveClass("opacity-40");
    });
  });
});
