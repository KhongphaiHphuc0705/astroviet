import { describe, expect, it } from "vitest";

import {
  KNOWN_HOUSE_SYSTEMS,
  KNOWN_PLANET_NAMES,
  KNOWN_PLANET_CATEGORIES,
  KNOWN_ZODIAC_SIGNS,
  KNOWN_ASPECT_TYPES,
  KNOWN_ANGLE_TYPES,
  KNOWN_ASPECT_NATURES,
  KNOWN_INTERPRETATION_SUBJECT_TYPES,
} from "../types";

import { chartFull, chartNoHouses, chartSummaryFixtures } from "./fixtures";

describe("Chart Fixtures Contract", () => {
  it("chartFull has exactly the expected top-level keys", () => {
    const expectedKeys = [
      "id",
      "chartType",
      "houseSystem",
      "isHouseDataAvailable",
      "planets",
      "houses",
      "angles",
      "aspects",
      "patterns",
      "interpretations",
      "interpretationVersion",
      "warnings",
      "calculatedAt",
      "engineVersion",
    ];
    expect(Object.keys(chartFull).sort()).toEqual(expectedKeys.sort());
  });

  it("validates string literals against KNOWN arrays", () => {
    expect(KNOWN_HOUSE_SYSTEMS as readonly string[]).toContain(
      chartFull.houseSystem,
    );
    chartFull.planets.forEach((p) => {
      expect(KNOWN_PLANET_NAMES as readonly string[]).toContain(p.name);
      expect(KNOWN_PLANET_CATEGORIES as readonly string[]).toContain(
        p.category,
      );
      expect(KNOWN_ZODIAC_SIGNS as readonly string[]).toContain(p.sign);
    });
    chartFull.angles.forEach((a) => {
      expect(KNOWN_ANGLE_TYPES as readonly string[]).toContain(a.type);
      expect(KNOWN_ZODIAC_SIGNS as readonly string[]).toContain(a.sign);
    });
    chartFull.aspects.forEach((a) => {
      expect(KNOWN_ASPECT_TYPES as readonly string[]).toContain(a.aspectType);
      expect(KNOWN_PLANET_NAMES as readonly string[]).toContain(a.planetA);
      expect(KNOWN_PLANET_NAMES as readonly string[]).toContain(a.planetB);
      expect(KNOWN_ASPECT_NATURES as readonly string[]).toContain(a.nature);
    });
  });

  it("validates invariant isHouseDataAvailable = true", () => {
    expect(chartFull.isHouseDataAvailable).toBe(true);
    expect(chartFull.houses.length).toBe(12);
    expect(chartFull.angles.length).toBe(4);
    chartFull.planets.forEach((p) => {
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
    });
  });

  it("validates invariant isHouseDataAvailable = false", () => {
    expect(chartNoHouses.isHouseDataAvailable).toBe(false);
    expect(chartNoHouses.houses.length).toBe(0);
    expect(chartNoHouses.angles.length).toBe(0);
    chartNoHouses.planets.forEach((p) => {
      expect(p.house).toBeNull();
    });
  });

  it("validates math logic for signOnCusp and degreeInSign", () => {
    chartFull.houses.forEach((h) => {
      const signIndex = Math.floor(h.cuspDegree / 30);
      expect(KNOWN_ZODIAC_SIGNS[signIndex]).toBe(h.signOnCusp);
    });
    chartFull.planets.forEach((p) => {
      const degree = p.longitude % 30;
      expect(Math.abs(degree - p.degreeInSign)).toBeLessThan(1e-6);
    });
  });

  it("validates interpretations", () => {
    expect(chartFull.interpretationVersion).toBe("1.0");
    expect(chartFull.interpretations.length).toBeGreaterThan(0);
    chartFull.interpretations.forEach((interp) => {
      expect(KNOWN_INTERPRETATION_SUBJECT_TYPES as readonly string[]).toContain(
        interp.subjectType,
      );
    });
  });

  it("validates ListChartsResponse wrapper", () => {
    expect(chartSummaryFixtures.length).toBe(2);
    expect(chartSummaryFixtures[0]?.birthProfileLabel).toBeNull();
    expect(chartSummaryFixtures[1]?.birthProfileId).toBeNull();
  });

  it("validates calculatedAt is valid ISO", () => {
    expect(Number.isNaN(Date.parse(chartFull.calculatedAt))).toBe(false);
  });

  it("does not contain birthProfileId or snapshotInterpretationVersion at the root", () => {
    // @ts-expect-error verifying no runtime presence
    expect(chartFull.birthProfileId).toBeUndefined();
    // @ts-expect-error verifying no runtime presence
    expect(chartFull.snapshotInterpretationVersion).toBeUndefined();
  });
});
