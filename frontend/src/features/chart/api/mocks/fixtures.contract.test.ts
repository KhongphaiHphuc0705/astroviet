import { describe, expect, it } from "vitest";

import { isValidChartId } from "../isValidChartId";
import {
  KNOWN_HOUSE_SYSTEMS,
  KNOWN_PLANET_NAMES,
  KNOWN_PLANET_CATEGORIES,
  KNOWN_ZODIAC_SIGNS,
  KNOWN_ASPECT_TYPES,
  KNOWN_ANGLE_TYPES,
  KNOWN_ASPECT_NATURES,
  KNOWN_INTERPRETATION_SUBJECT_TYPES,
  type ListChartsResponse,
} from "../types";

import { chartFull, chartNoHouses, chartSummaryFixtures } from "./fixtures";

// Constants matching backend Presentation mapper (chart-response.mapper.ts)
const EXPECTED_TOP_LEVEL_KEYS = [
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
].sort();

const EXPECTED_PLANET_KEYS = [
  "name",
  "category",
  "longitude",
  "speed",
  "isRetrograde",
  "sign",
  "degreeInSign",
  "house",
].sort();

const EXPECTED_HOUSE_KEYS = ["number", "cuspDegree", "signOnCusp"].sort();

const EXPECTED_ANGLE_KEYS = [
  "type",
  "longitude",
  "sign",
  "degreeInSign",
].sort();

const EXPECTED_ASPECT_KEYS = [
  "aspectType",
  "planetA",
  "planetB",
  "exactAngle",
  "orb",
  "isApplying",
  "nature",
].sort();

const EXPECTED_INTERPRETATION_KEYS = [
  "subjectType",
  "subjectKey",
  "language",
  "bodyText",
  "tone",
].sort();

const EXPECTED_SUMMARY_KEYS = [
  "id",
  "birthProfileId",
  "birthProfileLabel",
  "houseSystem",
  "calculatedAt",
].sort();

const STANDARD_ASPECT_ANGLES: Record<string, number> = {
  Conjunction: 0,
  Sextile: 60,
  Square: 90,
  Trine: 120,
  Opposition: 180,
};

describe("Chart Fixtures Contract (Sprint F4 M1 Section 18)", () => {
  describe("Key-set compliance (exact match with chart-response.mapper.ts)", () => {
    it("chartFull has exactly the expected top-level keys", () => {
      expect(Object.keys(chartFull).sort()).toEqual(EXPECTED_TOP_LEVEL_KEYS);
    });

    it("chartNoHouses has exactly the expected top-level keys", () => {
      expect(Object.keys(chartNoHouses).sort()).toEqual(
        EXPECTED_TOP_LEVEL_KEYS,
      );
    });

    it("every planet item has exactly the expected keys", () => {
      for (const planet of chartFull.planets) {
        expect(Object.keys(planet).sort()).toEqual(EXPECTED_PLANET_KEYS);
      }
      for (const planet of chartNoHouses.planets) {
        expect(Object.keys(planet).sort()).toEqual(EXPECTED_PLANET_KEYS);
      }
    });

    it("every house item has exactly the expected keys", () => {
      expect(chartFull.houses.length).toBe(12);
      for (const house of chartFull.houses) {
        expect(Object.keys(house).sort()).toEqual(EXPECTED_HOUSE_KEYS);
      }
    });

    it("every angle item has exactly the expected keys", () => {
      expect(chartFull.angles.length).toBe(4);
      for (const angle of chartFull.angles) {
        expect(Object.keys(angle).sort()).toEqual(EXPECTED_ANGLE_KEYS);
      }
    });

    it("every aspect item has exactly the expected keys", () => {
      for (const aspect of chartFull.aspects) {
        expect(Object.keys(aspect).sort()).toEqual(EXPECTED_ASPECT_KEYS);
      }
      for (const aspect of chartNoHouses.aspects) {
        expect(Object.keys(aspect).sort()).toEqual(EXPECTED_ASPECT_KEYS);
      }
    });

    it("every interpretation item has exactly the expected keys", () => {
      for (const interp of chartFull.interpretations) {
        expect(Object.keys(interp).sort()).toEqual(
          EXPECTED_INTERPRETATION_KEYS,
        );
      }
      for (const interp of chartNoHouses.interpretations) {
        expect(Object.keys(interp).sort()).toEqual(
          EXPECTED_INTERPRETATION_KEYS,
        );
      }
    });
  });

  describe("String literal union membership", () => {
    it("validates string literals against KNOWN arrays", () => {
      expect(KNOWN_HOUSE_SYSTEMS as readonly string[]).toContain(
        chartFull.houseSystem,
      );
      expect(KNOWN_HOUSE_SYSTEMS as readonly string[]).toContain(
        chartNoHouses.houseSystem,
      );

      for (const p of [...chartFull.planets, ...chartNoHouses.planets]) {
        expect(KNOWN_PLANET_NAMES as readonly string[]).toContain(p.name);
        expect(KNOWN_PLANET_CATEGORIES as readonly string[]).toContain(
          p.category,
        );
        expect(KNOWN_ZODIAC_SIGNS as readonly string[]).toContain(p.sign);
      }

      for (const a of chartFull.angles) {
        expect(KNOWN_ANGLE_TYPES as readonly string[]).toContain(a.type);
        expect(KNOWN_ZODIAC_SIGNS as readonly string[]).toContain(a.sign);
      }

      for (const a of [...chartFull.aspects, ...chartNoHouses.aspects]) {
        expect(KNOWN_ASPECT_TYPES as readonly string[]).toContain(a.aspectType);
        expect(KNOWN_PLANET_NAMES as readonly string[]).toContain(a.planetA);
        expect(KNOWN_PLANET_NAMES as readonly string[]).toContain(a.planetB);
        expect(KNOWN_ASPECT_NATURES as readonly string[]).toContain(a.nature);
      }

      for (const i of [
        ...chartFull.interpretations,
        ...chartNoHouses.interpretations,
      ]) {
        expect(
          KNOWN_INTERPRETATION_SUBJECT_TYPES as readonly string[],
        ).toContain(i.subjectType);
      }
    });
  });

  describe("House data invariants", () => {
    it("chartFull (isHouseDataAvailable = true) invariants", () => {
      expect(chartFull.isHouseDataAvailable).toBe(true);
      expect(chartFull.houses.length).toBe(12);
      expect(chartFull.angles.length).toBe(4);
      expect(chartFull.planets.length).toBe(10);

      // Houses 1..12 in strict sequence
      expect(chartFull.houses.map((h) => h.number)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
      ]);

      // Every planet has a house between 1 and 12
      chartFull.planets.forEach((p) => {
        expect(p.house).not.toBeNull();
        expect(p.house).toBeGreaterThanOrEqual(1);
        expect(p.house).toBeLessThanOrEqual(12);
      });

      // Ascendant angle equals cusp of house 1
      const ascendant = chartFull.angles.find((a) => a.type === "Ascendant");
      expect(ascendant).toBeDefined();
      expect(chartFull.houses[0]).toBeDefined();
      expect(ascendant?.longitude).toBe(chartFull.houses[0]?.cuspDegree);

      expect(chartFull.warnings).toEqual([]);
      expect(chartFull.patterns).toEqual([]);
    });

    it("chartNoHouses (isHouseDataAvailable = false) invariants", () => {
      expect(chartNoHouses.isHouseDataAvailable).toBe(false);
      expect(chartNoHouses.houses.length).toBe(0);
      expect(chartNoHouses.angles.length).toBe(0);
      expect(chartNoHouses.planets.length).toBe(10);

      // Every planet has house = null
      chartNoHouses.planets.forEach((p) => {
        expect(p.house).toBeNull();
      });

      expect(chartNoHouses.warnings).toEqual([]);
      expect(chartNoHouses.patterns).toEqual([]);
    });
  });

  describe("Math and astronomical invariants", () => {
    it("signOnCusp matches cuspDegree / 30", () => {
      chartFull.houses.forEach((h) => {
        const signIndex = Math.floor(h.cuspDegree / 30);
        expect(KNOWN_ZODIAC_SIGNS[signIndex]).toBe(h.signOnCusp);
      });
    });

    it("degreeInSign equals longitude % 30 within tolerance", () => {
      for (const p of [...chartFull.planets, ...chartNoHouses.planets]) {
        const expectedDeg = p.longitude % 30;
        expect(Math.abs(expectedDeg - p.degreeInSign)).toBeLessThan(1e-6);
      }
      for (const a of chartFull.angles) {
        const expectedDeg = a.longitude % 30;
        expect(Math.abs(expectedDeg - a.degreeInSign)).toBeLessThan(1e-6);
      }
    });

    it("isRetrograde <=> speed < 0", () => {
      for (const p of [...chartFull.planets, ...chartNoHouses.planets]) {
        expect(p.isRetrograde).toBe(p.speed < 0);
      }
    });

    it("orb equals |exactAngle - standardAngle| within tolerance", () => {
      for (const aspect of [...chartFull.aspects, ...chartNoHouses.aspects]) {
        const standardAngle = STANDARD_ASPECT_ANGLES[aspect.aspectType];
        expect(standardAngle).toBeDefined();
        const expectedOrb = Math.abs(aspect.exactAngle - standardAngle!);
        expect(Math.abs(expectedOrb - aspect.orb)).toBeLessThan(1e-4);
      }
    });
  });

  describe("Interpretation business rules", () => {
    it("both fixtures have interpretationVersion = '1.0' and common properties", () => {
      expect(chartFull.interpretationVersion).toBe("1.0");
      expect(chartNoHouses.interpretationVersion).toBe("1.0");

      for (const item of [
        ...chartFull.interpretations,
        ...chartNoHouses.interpretations,
      ]) {
        expect(item.language).toBe("vi");
        expect(item.tone).toBeNull();
        expect(item.bodyText.length).toBeGreaterThan(0);
      }
    });

    it("chartFull has exactly 21 interpretations in fixed order matching derived keys", () => {
      expect(chartFull.interpretations.length).toBe(21);

      // Breakdown: 10 PlanetInSign, 1 AngleInSign, 10 PlanetInHouse
      const planetInSigns = chartFull.interpretations.filter(
        (i) => i.subjectType === "PlanetInSign",
      );
      const angleInSigns = chartFull.interpretations.filter(
        (i) => i.subjectType === "AngleInSign",
      );
      const planetInHouses = chartFull.interpretations.filter(
        (i) => i.subjectType === "PlanetInHouse",
      );

      expect(planetInSigns.length).toBe(10);
      expect(angleInSigns.length).toBe(1);
      expect(planetInHouses.length).toBe(10);

      // Verify derived subjectKey matches fixture exactly in order
      const derivedKeys = [
        ...chartFull.planets.map((p) => `${p.name}_in_${p.sign}`),
        "Ascendant_in_Aries",
        ...chartFull.planets.map((p) => `${p.name}_in_House_${p.house}`),
      ];

      expect(chartFull.interpretations.map((i) => i.subjectKey)).toEqual(
        derivedKeys,
      );
    });

    it("chartNoHouses has exactly 10 PlanetInSign and 0 AngleInSign/PlanetInHouse", () => {
      expect(chartNoHouses.interpretations.length).toBe(10);

      const planetInSigns = chartNoHouses.interpretations.filter(
        (i) => i.subjectType === "PlanetInSign",
      );
      const angleInSigns = chartNoHouses.interpretations.filter(
        (i) => i.subjectType === "AngleInSign",
      );
      const planetInHouses = chartNoHouses.interpretations.filter(
        (i) => i.subjectType === "PlanetInHouse",
      );

      expect(planetInSigns.length).toBe(10);
      expect(angleInSigns.length).toBe(0);
      expect(planetInHouses.length).toBe(0);

      // Derived keys match 10 planets
      const derivedKeys = chartNoHouses.planets.map(
        (p) => `${p.name}_in_${p.sign}`,
      );
      expect(chartNoHouses.interpretations.map((i) => i.subjectKey)).toEqual(
        derivedKeys,
      );
    });
  });

  describe("ListChartsResponse envelope and summary fixtures", () => {
    it("validates ListChartsResponse 4-key envelope and items", () => {
      const envelope: ListChartsResponse = {
        items: chartSummaryFixtures,
        total: chartSummaryFixtures.length,
        page: 1,
        pageSize: 20,
      };

      expect(Object.keys(envelope).sort()).toEqual([
        "items",
        "page",
        "pageSize",
        "total",
      ]);
      expect(envelope.items.length).toBe(2);

      for (const summary of chartSummaryFixtures) {
        expect(Object.keys(summary).sort()).toEqual(EXPECTED_SUMMARY_KEYS);
      }

      // First summary has valid UUID birthProfileId
      expect(
        isValidChartId(chartSummaryFixtures[0]?.birthProfileId ?? undefined),
      ).toBe(true);
      expect(chartSummaryFixtures[0]?.birthProfileLabel).toBeNull();

      // Second summary has null birthProfileId
      expect(chartSummaryFixtures[1]?.birthProfileId).toBeNull();
      expect(chartSummaryFixtures[1]?.birthProfileLabel).toBeNull();
    });
  });

  describe("CalculatedAt and forbidden root keys", () => {
    it("validates calculatedAt is valid ISO", () => {
      expect(Number.isNaN(Date.parse(chartFull.calculatedAt))).toBe(false);
      expect(Number.isNaN(Date.parse(chartNoHouses.calculatedAt))).toBe(false);
    });

    it("does not contain birthProfileId or snapshotInterpretationVersion at the root", () => {
      expect("birthProfileId" in chartFull).toBe(false);
      expect("snapshotInterpretationVersion" in chartFull).toBe(false);
      expect("birthProfileId" in chartNoHouses).toBe(false);
      expect("snapshotInterpretationVersion" in chartNoHouses).toBe(false);
    });
  });
});
