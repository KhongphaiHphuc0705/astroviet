import { describe, expect, it } from "vitest";

import { chartFull, chartNoHouses } from "../api/mocks/fixtures";

import type { PlanetVM } from "./chartViewModel";
import { toChartViewModel } from "./chartViewModel";
import {
  polarToCartesian,
  toScreenAngle,
  WHEEL_CENTER,
  WHEEL_RADII,
} from "./geometry";
import { buildPlanetAriaLabel, buildPlanetWheelModel } from "./planetGeometry";

describe("planetGeometry (M5 Task 3: P1 - P7)", () => {
  const fullVM = toChartViewModel(chartFull);
  const noHousesVM = toChartViewModel(chartNoHouses);
  const rotation = fullVM.flags.ascendantLongitude ?? 0;
  const basePlanet: PlanetVM = fullVM.planets[0]!;

  it("P1: markers at r=175/168 strictly match polarToCartesian for all 10 planets of chartFull independent of layout", () => {
    const model = buildPlanetWheelModel(fullVM.planets, rotation);
    expect(model.planets).toHaveLength(10);

    // Also build a forced Tier B model where displacements differ
    const modelTierB = buildPlanetWheelModel(fullVM.planets, rotation, {
      forcedTier: "B",
    });

    for (const item of model.planets) {
      const originalPlanet = fullVM.planets.find((p) => p.key === item.id);
      expect(originalPlanet).toBeDefined();

      const expectedTrueAngle = toScreenAngle(
        originalPlanet!.longitude,
        rotation,
      );
      expect(item.trueAngle).toBeCloseTo(expectedTrueAngle, 6);

      const expectedOuter = polarToCartesian(
        WHEEL_CENTER,
        WHEEL_CENTER,
        WHEEL_RADII.planetMarkerOuter,
        expectedTrueAngle,
      );
      const expectedInner = polarToCartesian(
        WHEEL_CENTER,
        WHEEL_CENTER,
        WHEEL_RADII.planetMarkerInner,
        expectedTrueAngle,
      );

      expect(item.markerOuter.x).toBeCloseTo(expectedOuter.x, 3);
      expect(item.markerOuter.y).toBeCloseTo(expectedOuter.y, 3);
      expect(item.markerInner.x).toBeCloseTo(expectedInner.x, 3);
      expect(item.markerInner.y).toBeCloseTo(expectedInner.y, 3);

      // Verify that changing tier / layout does NOT change marker coordinates
      const tierBItem = modelTierB.planets.find((p) => p.id === item.id);
      expect(tierBItem).toBeDefined();
      expect(tierBItem!.markerOuter.x).toBe(item.markerOuter.x);
      expect(tierBItem!.markerOuter.y).toBe(item.markerOuter.y);
      expect(tierBItem!.markerInner.x).toBe(item.markerInner.x);
      expect(tierBItem!.markerInner.y).toBe(item.markerInner.y);
    }
  });

  it("P2: rotation applied exactly once (planet at lon = ASC is at screen angle 180°)", () => {
    const ascLon = fullVM.flags.ascendantLongitude ?? 0;
    const planetAtAsc: PlanetVM = {
      ...basePlanet,
      key: "Sun",
      longitude: ascLon,
    };

    const model = buildPlanetWheelModel([planetAtAsc], ascLon);
    expect(model.planets).toHaveLength(1);

    const item = model.planets[0]!;
    expect(item.trueAngle).toBeCloseTo(180, 5);

    // Screen angle 180° corresponds to dx = -r, dy = 0 (left horizontal)
    expect(item.markerOuter.x).toBeCloseTo(
      WHEEL_CENTER - WHEEL_RADII.planetMarkerOuter,
      3,
    );
    expect(item.markerOuter.y).toBeCloseTo(WHEEL_CENTER, 3);
  });

  it("P3: duplicate keys produce stable, unique ids (e.g. Sun, Sun#2)", () => {
    const duplicates: PlanetVM[] = [
      { ...basePlanet, key: "Sun" },
      {
        ...basePlanet,
        key: "Sun",
        longitude: (basePlanet.longitude + 10) % 360,
      },
      {
        ...basePlanet,
        key: "Sun",
        longitude: (basePlanet.longitude + 20) % 360,
      },
    ];

    const model = buildPlanetWheelModel(duplicates, rotation);
    expect(model.planets).toHaveLength(3);
    expect(model.planets[0]!.id).toBe("Sun");
    expect(model.planets[1]!.id).toBe("Sun#2");
    expect(model.planets[2]!.id).toBe("Sun#3");
  });

  it("P4: known === false or glyph === null produces 2-char fallback from nameVi and preserves aria", () => {
    const unknownPlanet: PlanetVM = {
      ...basePlanet,
      key: "CustomBody",
      nameVi: "Sao Lạ",
      known: false,
      glyph: null,
    };

    const model = buildPlanetWheelModel([unknownPlanet], rotation);
    expect(model.planets).toHaveLength(1);

    const item = model.planets[0]!;
    expect(item.glyph).toBeNull();
    expect(item.fallbackText).toBe("Sa");
    expect(item.ariaLabel).toContain("Sao Lạ");
    expect(item.ariaLabel).toContain(unknownPlanet.sign.labelVi);
  });

  it("P5: buildPlanetAriaLabel generates comprehensive labels with conditional parts", () => {
    const labelFull = buildPlanetAriaLabel(basePlanet);
    expect(labelFull).toBe("Mặt Trời, ở Ma Kết, 10°31′, nhà 9");

    const retroPlanet = fullVM.planets.find((p) => p.isRetrograde)!;
    const labelRetro = buildPlanetAriaLabel(retroPlanet);
    expect(labelRetro).toContain(", nghịch hành, ở ");

    // Without houseNumber
    const noHousePlanet: PlanetVM = {
      ...basePlanet,
      houseNumber: null,
    };
    const labelNoHouse = buildPlanetAriaLabel(noHousePlanet);
    expect(labelNoHouse).toBe("Mặt Trời, ở Ma Kết, 10°31′");
    expect(labelNoHouse).not.toContain("nhà");

    // Without degreeLabel
    const noDegreePlanet: PlanetVM = {
      ...basePlanet,
      degreeLabel: null,
    };
    const labelNoDegree = buildPlanetAriaLabel(noDegreePlanet);
    expect(labelNoDegree).toBe("Mặt Trời, ở Ma Kết, nhà 9");
    expect(labelNoDegree).not.toContain("10°");

    // Without both house and degree
    const minimalPlanet: PlanetVM = {
      ...basePlanet,
      houseNumber: null,
      degreeLabel: null,
    };
    const labelMinimal = buildPlanetAriaLabel(minimalPlanet);
    expect(labelMinimal).toBe("Mặt Trời, ở Ma Kết");
  });

  it("P6: does not mutate vm (deep frozen input preserves integrity)", () => {
    const frozenPlanets = Object.freeze(
      fullVM.planets.map((p) => Object.freeze({ ...p })),
    );

    expect(() => {
      buildPlanetWheelModel(frozenPlanets, rotation);
    }).not.toThrow();
  });

  it("P7: Tier A provides degreeText; Tier B sets degreeText to null", () => {
    // chartFull resolves to Tier A
    const modelA = buildPlanetWheelModel(fullVM.planets, rotation, {
      forcedTier: "A",
    });
    expect(modelA.tier).toBe("A");
    expect(modelA.planets[0]!.degreeText).toBe("10°");

    // Forced Tier B sets degreeText: null on all planets
    const modelB = buildPlanetWheelModel(fullVM.planets, rotation, {
      forcedTier: "B",
    });
    expect(modelB.tier).toBe("B");
    for (const item of modelB.planets) {
      expect(item.degreeText).toBeNull();
    }
  });

  it("P8: handles empty planets array gracefully and configures baseline when !hasHouses", () => {
    const emptyModel = buildPlanetWheelModel([], rotation, {
      hasHouses: false,
    });
    expect(emptyModel.planets).toHaveLength(0);
    expect(emptyModel.hasHouses).toBe(false);
    expect(emptyModel.baselineRadius).toBe(WHEEL_RADII.planetMarkerOuter);

    const noHousesModel = buildPlanetWheelModel(
      noHousesVM.planets,
      noHousesVM.flags.ascendantLongitude ?? 0,
      { hasHouses: false },
    );
    expect(noHousesModel.hasHouses).toBe(false);
    expect(noHousesModel.baselineRadius).toBe(175);
    expect(noHousesModel.planets).toHaveLength(10);
  });

  it("P9 (P-key): every planet render item carries its raw key and duplicate keys retain unique ids", () => {
    const duplicates: PlanetVM[] = [
      { ...basePlanet, key: "Sun" },
      {
        ...basePlanet,
        key: "Sun",
        longitude: (basePlanet.longitude + 15) % 360,
      },
      {
        ...basePlanet,
        key: "Moon",
        longitude: (basePlanet.longitude + 30) % 360,
      },
    ];

    const model = buildPlanetWheelModel(duplicates, rotation);
    expect(model.planets).toHaveLength(3);

    expect(model.planets[0]!.id).toBe("Sun");
    expect(model.planets[0]!.key).toBe("Sun");

    expect(model.planets[1]!.id).toBe("Sun#2");
    expect(model.planets[1]!.key).toBe("Sun");

    expect(model.planets[2]!.id).toBe("Moon");
    expect(model.planets[2]!.key).toBe("Moon");
  });
});
