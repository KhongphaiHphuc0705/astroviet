import { describe, expect, it } from "vitest";

import { chartFull, chartNoHouses } from "../api/mocks/fixtures";
import type { ChartResponse } from "../api/types";

import { ChartViewModelError, toChartViewModel } from "./chartViewModel";

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    // @ts-expect-error - recursively freezing properties
    deepFreeze(obj[key]);
  }
  return obj;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeDto(mutator?: (copy: any) => void): ChartResponse {
  const copy = structuredClone(chartFull);
  if (mutator) {
    mutator(copy);
  }
  return copy as unknown as ChartResponse;
}

describe("Chart ViewModel and Canonical Ordering (F4-M2.3)", () => {
  describe("Group A: toChartViewModel baseline & invariants", () => {
    it("A1: maps chartFull cleanly with 10 planets, 12 houses, 4 angles, 9 aspects", () => {
      const vm = toChartViewModel(chartFull);

      expect(vm.meta.id).toBe(chartFull.id);
      expect(vm.meta.houseSystem.key).toBe("Placidus");
      expect(vm.meta.houseSystem.known).toBe(true);
      expect(vm.meta.calculatedAt).toBe(chartFull.calculatedAt);
      expect(vm.meta.engineVersion).toBe(chartFull.engineVersion);

      expect(vm.flags.houseDataAvailable).toBe(true);
      expect(vm.flags.hasAngles).toBe(true);
      expect(vm.flags.partialData).toBe(false);
      expect(vm.flags.ascendantLongitude).not.toBeNull();

      expect(vm.planets).toHaveLength(10);
      expect(vm.houses).toHaveLength(12);
      expect(vm.angles).toHaveLength(4);
      expect(vm.aspects).toHaveLength(9);
      expect(vm.warnings).toHaveLength(0);
      expect(vm.issues).toHaveLength(0);
    });

    it("A2: maps chartNoHouses cleanly with no houses, no angles, and null houseNumbers", () => {
      const vm = toChartViewModel(chartNoHouses);

      expect(vm.flags.houseDataAvailable).toBe(false);
      expect(vm.flags.hasAngles).toBe(false);
      expect(vm.flags.partialData).toBe(false);
      expect(vm.flags.ascendantLongitude).toBeNull();

      expect(vm.houses).toHaveLength(0);
      expect(vm.angles).toHaveLength(0);
      expect(vm.planets).toHaveLength(10);

      for (const p of vm.planets) {
        expect(p.houseNumber).toBeNull();
      }
    });

    it("A3: preserves all planet attributes between chartFull and chartNoHouses except houseNumber", () => {
      const vmFull = toChartViewModel(chartFull);
      const vmNoHouses = toChartViewModel(chartNoHouses);

      expect(vmFull.planets).toHaveLength(vmNoHouses.planets.length);

      for (let i = 0; i < vmFull.planets.length; i++) {
        const pFull = vmFull.planets[i]!;
        const pNoHouses = vmNoHouses.planets[i]!;

        expect(pFull.key).toBe(pNoHouses.key);
        expect(pFull.longitude).toBe(pNoHouses.longitude);
        expect(pFull.sign).toStrictEqual(pNoHouses.sign);
        expect(pFull.degreeLabel).toBe(pNoHouses.degreeLabel);
        expect(pFull.isRetrograde).toBe(pNoHouses.isRetrograde);
        expect(pFull.ariaLabel).toBe(pNoHouses.ariaLabel);

        expect(pFull.houseNumber).not.toBeNull();
        expect(pNoHouses.houseNumber).toBeNull();
      }
    });

    it("A4: handles null optional fields and out-of-range display degrees safely", () => {
      const dto = makeDto((d) => {
        d.planets[0].house = null;
        d.planets[1].degreeInSign = 35.5; // > 30 out of range
      });

      const vm = toChartViewModel(dto);
      expect(vm.planets[0]?.houseNumber).toBeNull();
      expect(vm.planets[1]?.degreeLabel).toBeNull();
      expect(vm.flags.partialData).toBe(false);
      expect(vm.issues.some((i) => i.code === "VALUE_OUT_OF_RANGE")).toBe(true);
    });

    it("A5: handles empty optional arrays without setting partialData", () => {
      const dto = makeDto((d) => {
        d.aspects = [];
        d.warnings = [];
      });

      const vm = toChartViewModel(dto);
      expect(vm.aspects).toHaveLength(0);
      expect(vm.warnings).toHaveLength(0);
      expect(vm.flags.partialData).toBe(false);
    });

    it("A6: ignores interpretations completely (changing interpretations produces identical VM)", () => {
      const vmOriginal = toChartViewModel(chartFull);

      const modifiedDto = makeDto((d) => {
        d.interpretations = [];
        d.interpretationVersion = null;
      });
      const vmModified = toChartViewModel(modifiedDto);

      expect(vmModified).toStrictEqual(vmOriginal);
    });

    it("A7: handles corrupted interpretation arrays without throwing", () => {
      const vmOriginal = toChartViewModel(chartFull);

      const malformedDto = makeDto((d) => {
        d.interpretations = [null, { bad: "garbage" }, 123];
        d.interpretationVersion = "arbitrary-version";
      });
      const vmModified = toChartViewModel(malformedDto);

      expect(vmModified).toStrictEqual(vmOriginal);
    });

    it("A8: enforces strict immutability (deepFreeze does not throw, dto is unmodified)", () => {
      const dto = makeDto();
      deepFreeze(dto);

      expect(() => toChartViewModel(dto)).not.toThrow();
    });

    it("A9: guarantees repeatability and creates independent arrays (no alias)", () => {
      const vm1 = toChartViewModel(chartFull);
      const vm2 = toChartViewModel(chartFull);

      expect(vm1).toStrictEqual(vm2);
      expect(vm1.planets).not.toBe(chartFull.planets);
      expect(vm1.houses).not.toBe(chartFull.houses);
      expect(vm1.angles).not.toBe(chartFull.angles);
      expect(vm1.aspects).not.toBe(chartFull.aspects);
    });

    it("A10: reflects ascendantLongitude correctly", () => {
      const vmFull = toChartViewModel(chartFull);
      expect(vmFull.flags.ascendantLongitude).toBe(
        chartFull.angles.find((a) => a.type === "Ascendant")?.longitude,
      );

      const vmNoHouses = toChartViewModel(chartNoHouses);
      expect(vmNoHouses.flags.ascendantLongitude).toBeNull();
    });

    it("A11: processes warnings cleanly, mapping labelVi and stripping raw message", () => {
      const dto = makeDto((d) => {
        d.warnings = [
          {
            code: "HOUSE_SYSTEM_NOT_CONVERGING",
            message: "Internal solver failed",
            severity: "warning",
          },
          {
            code: "CUSTOM_INTERNAL_WARN",
            message: "Some debug msg",
            severity: "info",
          },
          {
            code: "WEIRD_SEVERITY",
            message: "Unknown severity level",
            severity: "fatal",
          },
        ];
      });

      const vm = toChartViewModel(dto);
      expect(vm.warnings).toHaveLength(3);
      expect(vm.warnings[0]).toStrictEqual({
        code: "HOUSE_SYSTEM_NOT_CONVERGING",
        severity: "warning",
        labelVi: "Không tính được chính xác hệ nhà tại vị trí này.",
      });
      expect(vm.warnings[1]).toStrictEqual({
        code: "CUSTOM_INTERNAL_WARN",
        severity: "info",
        labelVi: null,
      });
      expect(vm.warnings[2]).toStrictEqual({
        code: "WEIRD_SEVERITY",
        severity: "warning",
        labelVi: null,
      });
      expect(
        vm.issues.some(
          (i) => i.code === "UNKNOWN_VALUE" && i.subject.includes("severity"),
        ),
      ).toBe(true);
    });
  });

  describe("Group D: Canonical ordering & determinism", () => {
    it("D1: produces identical VM when input arrays are scrambled / reversed", () => {
      const normalVm = toChartViewModel(chartFull);

      const scrambledDto = makeDto((d) => {
        d.planets.reverse();
        d.houses.reverse();
        d.angles.reverse();
        d.aspects.reverse();
      });
      const scrambledVm = toChartViewModel(scrambledDto);

      expect(scrambledVm).toStrictEqual(normalVm);
    });

    it("D2: emits CORE_BODY_MISSING and sets partialData=true when core planets are missing", () => {
      const dto = makeDto((d) => {
        d.planets = d.planets.filter(
          (p: { name: string }) => p.name !== "Moon" && p.name !== "Pluto",
        );
      });

      const vm = toChartViewModel(dto);
      expect(vm.planets).toHaveLength(8);
      expect(vm.flags.partialData).toBe(true);

      const missingCodes = vm.issues.filter(
        (i) => i.code === "CORE_BODY_MISSING",
      );
      expect(missingCodes).toHaveLength(2);
      expect(missingCodes[0]?.subject).toBe("planet:Moon");
      expect(missingCodes[1]?.subject).toBe("planet:Pluto");
    });

    it("D3: places unknown celestial bodies after known bodies sorted alphabetically", () => {
      const dto = makeDto((d) => {
        d.planets.push(
          {
            name: "Vesta",
            category: "Asteroid",
            longitude: 100,
            speed: 0.5,
            isRetrograde: false,
            sign: "Cancer",
            degreeInSign: 10,
            house: 4,
          },
          {
            name: "Ceres",
            category: "DwarfPlanet",
            longitude: 50,
            speed: 0.3,
            isRetrograde: false,
            sign: "Taurus",
            degreeInSign: 20,
            house: 2,
          },
        );
      });

      const vm = toChartViewModel(dto);
      expect(vm.planets).toHaveLength(12);

      // The last 2 should be Ceres, then Vesta
      expect(vm.planets[10]?.key).toBe("Ceres");
      expect(vm.planets[10]?.known).toBe(false);
      expect(vm.planets[11]?.key).toBe("Vesta");
      expect(vm.planets[11]?.known).toBe(false);
    });

    it("D4: tie-breaks aspects with identical orb by planetA, planetB, aspectType, then index", () => {
      const dto = makeDto((d) => {
        d.aspects = [
          {
            aspectType: "Trine",
            planetA: "Sun",
            planetB: "Mars",
            exactAngle: 120,
            orb: 2.5,
            isApplying: true,
            nature: "Harmonious",
          },
          {
            aspectType: "Sextile",
            planetA: "Sun",
            planetB: "Moon",
            exactAngle: 60,
            orb: 2.5,
            isApplying: false,
            nature: "Harmonious",
          },
        ];
      });

      const vm = toChartViewModel(dto);
      expect(vm.aspects).toHaveLength(2);
      // Sun-Moon comes before Sun-Mars because Moon precedes Mars in canonical order
      expect(vm.aspects[0]?.key).toBe("Sun:Sextile:Moon");
      expect(vm.aspects[1]?.key).toBe("Sun:Trine:Mars");
    });

    it("D5: preserves duplicate entities with issue and suffixes duplicate aspect keys", () => {
      const dto = makeDto((d) => {
        d.planets.push({ ...d.planets[0] }); // duplicate Sun
        d.aspects.push({ ...d.aspects[0] }); // duplicate aspect
      });

      const vm = toChartViewModel(dto);
      expect(vm.planets.filter((p) => p.key === "Sun")).toHaveLength(2);
      expect(
        vm.issues.some(
          (i) => i.code === "DUPLICATE_ENTITY" && i.subject === "planet:Sun",
        ),
      ).toBe(true);

      const duplicatedBaseKey = `${dto.aspects[0]?.planetA}:${dto.aspects[0]?.aspectType}:${dto.aspects[0]?.planetB}`;
      const matched = vm.aspects.filter((a) =>
        a.key.startsWith(duplicatedBaseKey),
      );
      expect(matched).toHaveLength(2);
      expect(matched.some((a) => a.key.includes("#2"))).toBe(true);
    });

    it("D6: strictly orders houses 1..12 and angles Ascendant..ImumCoeli", () => {
      const dto = makeDto((d) => {
        d.houses.sort(() => (Math.sin(1) > 0 ? -1 : 1));
        d.angles.sort(() => (Math.cos(1) > 0 ? -1 : 1));
      });

      const vm = toChartViewModel(dto);
      expect(vm.houses.map((h) => h.number)).toStrictEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
      ]);
      expect(vm.angles.map((a) => a.key)).toStrictEqual([
        "Ascendant",
        "Midheaven",
        "Descendant",
        "ImumCoeli",
      ]);
    });

    it("D7: sorts aspects by increasing orb", () => {
      const vm = toChartViewModel(chartFull);
      for (let i = 0; i < vm.aspects.length - 1; i++) {
        expect(vm.aspects[i]!.orb).toBeLessThanOrEqual(vm.aspects[i + 1]!.orb);
      }
    });
  });

  describe("Group E: Degraded-data semantics", () => {
    it("E1: sets houseDataAvailable=true and partialData=false on valid full chart", () => {
      const vm = toChartViewModel(chartFull);
      expect(vm.flags.houseDataAvailable).toBe(true);
      expect(vm.flags.partialData).toBe(false);
    });

    it("E2: sets houseDataAvailable=false and partialData=false on valid chartNoHouses", () => {
      const vm = toChartViewModel(chartNoHouses);
      expect(vm.flags.houseDataAvailable).toBe(false);
      expect(vm.flags.partialData).toBe(false);
    });

    it("E3: marks contradiction and partialData=true when flag is true but a house is missing", () => {
      const dto = makeDto((d) => {
        d.isHouseDataAvailable = true;
        d.houses.pop(); // 11 houses
      });

      const vm = toChartViewModel(dto);
      expect(vm.flags.houseDataAvailable).toBe(false);
      expect(vm.flags.partialData).toBe(true);
      expect(vm.houses).toHaveLength(0);
      expect(vm.issues.some((i) => i.code === "HOUSE_FLAG_CONTRADICTION")).toBe(
        true,
      );
    });

    it("E4: marks contradiction and partialData=true when flag is false but houses array is populated", () => {
      const dto = makeDto((d) => {
        d.isHouseDataAvailable = false;
        // houses array still contains 12 items
      });

      const vm = toChartViewModel(dto);
      expect(vm.flags.houseDataAvailable).toBe(false);
      expect(vm.flags.partialData).toBe(true);
      expect(vm.houses).toHaveLength(0);
      expect(vm.issues.some((i) => i.code === "HOUSE_FLAG_CONTRADICTION")).toBe(
        true,
      );
    });

    it("E5: does NOT trigger partialData for safe degraded states", () => {
      const dto = makeDto((d) => {
        d.isHouseDataAvailable = false;
        d.houses = [];
        d.aspects = [];
        d.warnings = [];
        d.planets[0].degreeInSign = 32; // VALUE_OUT_OF_RANGE
      });

      const vm = toChartViewModel(dto);
      expect(vm.flags.partialData).toBe(false);
    });

    it("E6: preserves HOUSE_SYSTEM_NOT_CONVERGING warning when houses are unavailable", () => {
      const dto = makeDto((d) => {
        d.isHouseDataAvailable = false;
        d.houses = [];
        d.warnings = [
          {
            code: "HOUSE_SYSTEM_NOT_CONVERGING",
            message: "Placidus failed to converge",
            severity: "warning",
          },
        ];
      });

      const vm = toChartViewModel(dto);
      expect(vm.flags.houseDataAvailable).toBe(false);
      expect(vm.flags.partialData).toBe(false);
      expect(vm.warnings[0]?.code).toBe("HOUSE_SYSTEM_NOT_CONVERGING");
      expect(vm.warnings[0]?.labelVi).toBe(
        "Không tính được chính xác hệ nhà tại vị trí này.",
      );
    });
  });

  describe("Group F: Unknown / malformed values & error boundaries", () => {
    it("F1: keeps unknown enums without crashing or coercing", () => {
      const dto = makeDto((d) => {
        d.houseSystem = "Koch";
        d.planets[0].sign = "Ophiuchus";
        d.aspects[0].aspectType = "Quintile";
        d.aspects[0].nature = "Mixed";
      });

      const vm = toChartViewModel(dto);
      expect(vm.meta.houseSystem.key).toBe("Koch");
      expect(vm.meta.houseSystem.known).toBe(false);

      expect(vm.planets[0]?.sign.key).toBe("Ophiuchus");
      expect(vm.planets[0]?.sign.known).toBe(false);

      const modifiedAspect = vm.aspects.find((a) => a.type.key === "Quintile");
      expect(modifiedAspect).toBeDefined();
      expect(modifiedAspect?.type.known).toBe(false);
      expect(modifiedAspect?.nature.tone).toBe("unknown");
    });

    it("F2: drops individual entities with missing required fields and sets partialData=true", () => {
      const dto = makeDto((d) => {
        delete d.planets[0].longitude; // missing longitude
        d.aspects[0].orb = -1; // negative orb
      });

      const vm = toChartViewModel(dto);
      expect(vm.planets).toHaveLength(9);
      expect(vm.aspects).toHaveLength(8);
      expect(vm.flags.partialData).toBe(true);

      const dropped = vm.issues.filter((i) => i.code === "ENTRY_DROPPED");
      expect(dropped).toHaveLength(2);
    });

    it("F3: drops entity when longitude is NaN or out of range", () => {
      const dto = makeDto((d) => {
        d.planets[0].longitude = Number.NaN;
      });

      const vm = toChartViewModel(dto);
      expect(vm.planets).toHaveLength(9);
      expect(vm.flags.partialData).toBe(true);
      expect(
        vm.issues.some(
          (i) => i.code === "ENTRY_DROPPED" && i.subject.includes("planet"),
        ),
      ).toBe(true);
    });

    it("F4: throws ChartViewModelError for top-level structural corruption", () => {
      // @ts-expect-error - testing invalid argument
      expect(() => toChartViewModel(null)).toThrow(ChartViewModelError);
      // @ts-expect-error - testing invalid argument
      expect(() => toChartViewModel({})).toThrow(ChartViewModelError);

      expect(() => toChartViewModel(makeDto((d) => (d.id = "")))).toThrow(
        ChartViewModelError,
      );

      expect(() =>
        toChartViewModel(makeDto((d) => (d.isHouseDataAvailable = "true"))),
      ).toThrow(ChartViewModelError);

      expect(() =>
        toChartViewModel(makeDto((d) => (d.planets = null))),
      ).toThrow(ChartViewModelError);
    });

    it("F5: drops house when nested required field is null, triggering house contradiction", () => {
      const dto = makeDto((d) => {
        d.houses[0].signOnCusp = null;
      });

      const vm = toChartViewModel(dto);
      expect(vm.flags.houseDataAvailable).toBe(false);
      expect(vm.houses).toHaveLength(0);
      expect(vm.flags.partialData).toBe(true);
    });

    it("F6: ensures errors are never silently swallowed into an empty VM", () => {
      expect(() => toChartViewModel({} as unknown as ChartResponse)).toThrow(
        ChartViewModelError,
      );
    });

    it("F7: emits ASPECT_ENDPOINT_MISSING when aspect references planet not in planets array", () => {
      const dto = makeDto((d) => {
        d.aspects.push({
          aspectType: "Conjunction",
          planetA: "Sun",
          planetB: "UnknownAsteroid",
          exactAngle: 0,
          orb: 1.0,
          isApplying: true,
          nature: "Neutral",
        });
      });

      const vm = toChartViewModel(dto);
      expect(
        vm.issues.some(
          (i) =>
            i.code === "ASPECT_ENDPOINT_MISSING" &&
            i.subject.includes("UnknownAsteroid"),
        ),
      ).toBe(true);
      expect(vm.flags.partialData).toBe(false);
    });

    it("F8: handles null elements inside planets, angles, aspects, and warnings arrays", () => {
      const dto = makeDto((d) => {
        d.planets.push(null);
        d.angles.push(null);
        d.aspects.push(null);
        d.warnings.push(null);
      });

      const vm = toChartViewModel(dto);
      expect(
        vm.issues.some(
          (i) => i.code === "ENTRY_DROPPED" && i.subject.startsWith("planet:"),
        ),
      ).toBe(true);
      expect(
        vm.issues.some(
          (i) => i.code === "ENTRY_DROPPED" && i.subject.startsWith("angle:"),
        ),
      ).toBe(true);
      expect(
        vm.issues.some(
          (i) => i.code === "ENTRY_DROPPED" && i.subject.startsWith("aspect:"),
        ),
      ).toBe(true);
    });

    it("F9: handles invalid planet house numbers and comprehensive aspect canonical tie-breaks", () => {
      const dto = makeDto((d) => {
        d.planets[0].house = 15; // out of range integer
        d.aspects = [
          {
            aspectType: "Opposition",
            planetA: "Sun",
            planetB: "Mars",
            exactAngle: 180,
            orb: 1.0,
            isApplying: true,
            nature: "Challenging",
          },
          {
            aspectType: "Trine",
            planetA: "Sun",
            planetB: "Mars",
            exactAngle: 120,
            orb: 1.0,
            isApplying: true,
            nature: "Harmonious",
          },
          {
            aspectType: "Trine",
            planetA: "Mars",
            planetB: "Moon",
            exactAngle: 120,
            orb: 1.0,
            isApplying: true,
            nature: "Harmonious",
          },
          {
            aspectType: "Trine",
            planetA: "Zeta",
            planetB: "Alpha",
            exactAngle: 120,
            orb: 1.0,
            isApplying: true,
            nature: "Harmonious",
          },
          {
            aspectType: "Trine",
            planetA: "Alpha",
            planetB: "Zeta",
            exactAngle: 120,
            orb: 1.0,
            isApplying: true,
            nature: "Harmonious",
          },
        ];
      });

      const vm = toChartViewModel(dto);
      expect(vm.planets.find((p) => p.key === "Sun")?.houseNumber).toBeNull();
      expect(
        vm.issues.some(
          (i) =>
            i.code === "VALUE_OUT_OF_RANGE" && i.subject === "planet:Sun.house",
        ),
      ).toBe(true);
      expect(vm.aspects).toHaveLength(5);
    });
  });

  describe("Group G: Defensive edge cases, structural checks & complete branch coverage (R-1, R-2)", () => {
    it.each([
      ["dto is null", () => null as unknown as ChartResponse, "dto"],
      [
        "dto is string primitive",
        () => "not-an-object" as unknown as ChartResponse,
        "dto",
      ],
      [
        "id missing or not string",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => {
          delete d.id;
        },
        "id",
      ],
      [
        "id is empty string",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => {
          d.id = "";
        },
        "id",
      ],
      [
        "isHouseDataAvailable not boolean",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => {
          d.isHouseDataAvailable = "yes";
        },
        "isHouseDataAvailable",
      ],
      [
        "calculatedAt missing",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => {
          delete d.calculatedAt;
        },
        "calculatedAt",
      ],
      [
        "calculatedAt is empty string",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => {
          d.calculatedAt = "";
        },
        "calculatedAt",
      ],
      [
        "engineVersion missing",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => {
          delete d.engineVersion;
        },
        "engineVersion",
      ],
      [
        "engineVersion is empty string",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => {
          d.engineVersion = "";
        },
        "engineVersion",
      ],
      [
        "planets is not array",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => {
          d.planets = null;
        },
        "planets",
      ],
      [
        "houses is not array",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => {
          d.houses = "not-an-array";
        },
        "houses",
      ],
      [
        "angles is not array",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => {
          d.angles = {};
        },
        "angles",
      ],
      [
        "aspects is not array",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => {
          d.aspects = 123;
        },
        "aspects",
      ],
      [
        "warnings is not array",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => {
          d.warnings = false;
        },
        "warnings",
      ],
    ])(
      "G1: rejects %s throwing ChartViewModelError on path '%s'",
      (_, mutator, expectedPath) => {
        let input: ChartResponse;
        if (typeof mutator === "function" && mutator.length === 0) {
          input = (mutator as () => ChartResponse)();
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input = makeDto(mutator as (copy: any) => void);
        }

        expect(() => toChartViewModel(input)).toThrowError(ChartViewModelError);
        try {
          toChartViewModel(input);
        } catch (err) {
          expect(err).toBeInstanceOf(ChartViewModelError);
          expect((err as ChartViewModelError).path).toBe(expectedPath);
        }
      },
    );

    it("G2.1: drops angle with missing or empty type", () => {
      const dto = makeDto((d) => {
        d.angles = [
          { type: "", longitude: 100, sign: "Cancer", degreeInSign: 10 },
        ];
      });
      const vm = toChartViewModel(dto);
      expect(vm.angles).toHaveLength(0);
      expect(vm.issues).toContainEqual({
        code: "ENTRY_DROPPED",
        subject: "angle:0",
      });
    });

    it("G2.2: drops angle with out-of-range longitude", () => {
      const dto = makeDto((d) => {
        d.angles = [
          {
            type: "Ascendant",
            longitude: -1,
            sign: "Cancer",
            degreeInSign: 10,
          },
          {
            type: "Midheaven",
            longitude: 360,
            sign: "Cancer",
            degreeInSign: 10,
          },
          {
            type: "Descendant",
            longitude: Number.NaN,
            sign: "Cancer",
            degreeInSign: 10,
          },
        ];
      });
      const vm = toChartViewModel(dto);
      expect(vm.angles).toHaveLength(0);
      expect(vm.issues).toContainEqual({
        code: "ENTRY_DROPPED",
        subject: "angle:Ascendant",
      });
      expect(vm.issues).toContainEqual({
        code: "ENTRY_DROPPED",
        subject: "angle:Midheaven",
      });
      expect(vm.issues).toContainEqual({
        code: "ENTRY_DROPPED",
        subject: "angle:Descendant",
      });
    });

    it("G2.3: drops angle with missing or empty sign", () => {
      const dto = makeDto((d) => {
        d.angles = [
          {
            type: "Ascendant",
            longitude: 100,
            sign: "",
            degreeInSign: 10,
          },
        ];
      });
      const vm = toChartViewModel(dto);
      expect(vm.angles).toHaveLength(0);
      expect(vm.issues).toContainEqual({
        code: "ENTRY_DROPPED",
        subject: "angle:Ascendant",
      });
    });

    it("G2.4: flags unknown angle type, unknown sign, duplicate angle and out-of-range degreeInSign", () => {
      const dto = makeDto((d) => {
        d.angles = [
          {
            type: "Vertex",
            longitude: 100,
            sign: "Ophiuchus",
            degreeInSign: 32,
          },
          {
            type: "Vertex",
            longitude: 100,
            sign: "Cancer",
            degreeInSign: -1,
          },
        ];
      });
      const vm = toChartViewModel(dto);
      expect(vm.angles).toHaveLength(2);
      expect(vm.angles[0]?.known).toBe(false);
      expect(vm.angles[0]?.degreeLabel).toBeNull();
      expect(vm.issues).toContainEqual({
        code: "UNKNOWN_VALUE",
        subject: "angle:Vertex",
      });
      expect(vm.issues).toContainEqual({
        code: "UNKNOWN_VALUE",
        subject: "angle:Vertex.sign:Ophiuchus",
      });
      expect(vm.issues).toContainEqual({
        code: "DUPLICATE_ENTITY",
        subject: "angle:Vertex",
      });
      expect(vm.issues).toContainEqual({
        code: "VALUE_OUT_OF_RANGE",
        subject: "angle:Vertex.degreeInSign",
      });
    });

    it("G3.1: flags unknown signOnCusp on house", () => {
      const dto = makeDto((d) => {
        d.houses[0].signOnCusp = "MysticSign";
      });
      const vm = toChartViewModel(dto);
      expect(vm.houses[0]?.sign.known).toBe(false);
      expect(vm.issues).toContainEqual({
        code: "UNKNOWN_VALUE",
        subject: "house:1.sign:MysticSign",
      });
    });

    it("G3.2: sorts unknown keys alphabetically in compareRank", () => {
      const dto = makeDto((d) => {
        d.planets.push(
          {
            name: "ZetaPlanet",
            longitude: 10,
            sign: "Aries",
            degreeInSign: 10,
            isRetrograde: false,
            house: 1,
          },
          {
            name: "AlphaPlanet",
            longitude: 10,
            sign: "Aries",
            degreeInSign: 10,
            isRetrograde: false,
            house: 1,
          },
        );
        d.angles = [
          {
            type: "ZetaAngle",
            longitude: 10,
            sign: "Aries",
            degreeInSign: 10,
          },
          {
            type: "AlphaAngle",
            longitude: 10,
            sign: "Aries",
            degreeInSign: 10,
          },
        ];
      });
      const vm = toChartViewModel(dto);
      const unknownPlanets = vm.planets.filter(
        (p) => p.key === "AlphaPlanet" || p.key === "ZetaPlanet",
      );
      expect(unknownPlanets[0]?.key).toBe("AlphaPlanet");
      expect(unknownPlanets[1]?.key).toBe("ZetaPlanet");

      expect(vm.angles[0]?.key).toBe("AlphaAngle");
      expect(vm.angles[1]?.key).toBe("ZetaAngle");
    });

    it("G3.3: drops planet without valid name using index subject", () => {
      const dto = makeDto((d) => {
        d.planets.push({
          name: "",
          longitude: 10,
          sign: "Aries",
          degreeInSign: 10,
          isRetrograde: false,
        });
      });
      const vm = toChartViewModel(dto);
      expect(
        vm.issues.some(
          (i) => i.code === "ENTRY_DROPPED" && i.subject === "planet:10",
        ),
      ).toBe(true);
    });

    it("G4.1: drops invalid warning entries and flags unknown severity", () => {
      const dto = makeDto((d) => {
        d.warnings = [
          null,
          { notCode: "invalid" },
          { code: "", severity: "warning" },
          { code: 123, severity: "warning" },
          { code: "HOUSE_SYSTEM_NOT_CONVERGING", severity: "critical_level" },
        ];
      });
      const vm = toChartViewModel(dto);
      expect(
        vm.issues.filter(
          (i) => i.code === "ENTRY_DROPPED" && i.subject.startsWith("warning:"),
        ),
      ).toHaveLength(4);
      expect(vm.flags.partialData).toBe(true);

      expect(vm.warnings).toHaveLength(1);
      expect(vm.warnings[0]?.code).toBe("HOUSE_SYSTEM_NOT_CONVERGING");
      expect(vm.warnings[0]?.severity).toBe("warning");
      expect(vm.issues).toContainEqual({
        code: "UNKNOWN_VALUE",
        subject: "warning:HOUSE_SYSTEM_NOT_CONVERGING.severity:critical_level",
      });
    });

    it("G4.2: flags planets[].house with invalid type (string '5') as VALUE_OUT_OF_RANGE", () => {
      const dto = makeDto((d) => {
        d.planets[0].house = "5";
      });
      const vm = toChartViewModel(dto);
      expect(vm.planets[0]?.houseNumber).toBeNull();
      expect(vm.issues).toContainEqual({
        code: "VALUE_OUT_OF_RANGE",
        subject: `planet:${vm.planets[0]?.key}.house`,
      });
    });

    it("G4.3: flags planet having house value when isHouseDataAvailable is false", () => {
      const dto = structuredClone(chartNoHouses);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dto.planets[0] as any).house = 5;
      const vm = toChartViewModel(dto);
      expect(vm.planets[0]?.houseNumber).toBeNull();
      expect(vm.issues).toContainEqual({
        code: "VALUE_OUT_OF_RANGE",
        subject: `planet:${vm.planets[0]?.key}.house`,
      });
    });

    it("G4.4: ignores null elements in houses array during filtering", () => {
      const dto = makeDto((d) => {
        d.houses.push(null);
      });
      const vm = toChartViewModel(dto);
      expect(vm.flags.houseDataAvailable).toBe(false);
      expect(vm.issues).toContainEqual({
        code: "HOUSE_FLAG_CONTRADICTION",
        subject: "houses",
      });
    });

    it("G4.5: drops aspect with invalid fields like negative orb or missing planetA", () => {
      const dto = makeDto((d) => {
        d.aspects.push(
          {
            planetA: "Sun",
            planetB: "Moon",
            aspectType: "Trine",
            orb: -1,
            isApplying: true,
            nature: "Harmonious",
          },
          {
            planetB: "Moon",
            aspectType: "Trine",
            orb: 1.0,
            isApplying: true,
            nature: "Harmonious",
          },
          {
            planetA: "Sun",
            planetB: "Moon",
            orb: 1.0,
            isApplying: true,
            nature: "Harmonious",
          },
          {
            planetA: "Sun",
            aspectType: "Trine",
            orb: 1.0,
            isApplying: true,
            nature: "Harmonious",
          },
        );
      });
      const vm = toChartViewModel(dto);
      expect(
        vm.issues.some(
          (i) =>
            i.code === "ENTRY_DROPPED" && i.subject === "aspect:Sun:Trine:Moon",
        ),
      ).toBe(true);
      expect(
        vm.issues.some(
          (i) =>
            i.code === "ENTRY_DROPPED" && i.subject === "aspect::Trine:Moon",
        ),
      ).toBe(true);
    });

    it("G4.6: exercises both branch directions of compareRank for unknown keys", () => {
      const dto = makeDto((d) => {
        d.planets.push(
          {
            name: "BetaPlanet",
            longitude: 10,
            sign: "Aries",
            degreeInSign: 10,
            isRetrograde: false,
            house: 1,
          },
          {
            name: "AlphaPlanet",
            longitude: 10,
            sign: "Aries",
            degreeInSign: 10,
            isRetrograde: false,
            house: 1,
          },
          {
            name: "GammaPlanet",
            longitude: 10,
            sign: "Aries",
            degreeInSign: 10,
            isRetrograde: false,
            house: 1,
          },
        );
      });
      const vm = toChartViewModel(dto);
      const filtered = vm.planets
        .filter((p) =>
          ["AlphaPlanet", "BetaPlanet", "GammaPlanet"].includes(p.key),
        )
        .map((p) => p.key);
      expect(filtered).toEqual(["AlphaPlanet", "BetaPlanet", "GammaPlanet"]);
    });
  });

  describe("Group I: Backend Sprint 4 Interpretations tolerance (G-1 / M10.3)", () => {
    it("I1: handles interpretations as empty array and interpretationVersion as null without error", () => {
      const dto = makeDto((d) => {
        d.interpretations = [];
        d.interpretationVersion = null;
      });
      const vm = toChartViewModel(dto);
      expect(vm.meta.id).toBe(dto.id);
      expect(vm.planets).toHaveLength(10);
      expect(vm.aspects).toHaveLength(9);
      expect(vm.issues).toHaveLength(0);
    });

    it("I2: handles interpretations with missing or null tone property without error", () => {
      const dto = makeDto((d) => {
        d.interpretations = [
          {
            subjectType: "PlanetInSign",
            subjectKey: "Sun_Aries",
            language: "vi",
            bodyText: "Mặt Trời ở Bạch Dương thể hiện năng lượng tiên phong.",
            tone: null,
          },
          {
            subjectType: "PlanetInSign",
            subjectKey: "Moon_Taurus",
            language: "vi",
            bodyText: "Mặt Trăng ở Kim Ngưu biểu thị sự ổn định cảm xúc.",
          },
        ];
        d.interpretationVersion = "1.0";
      });
      const vm = toChartViewModel(dto);
      expect(vm.meta.id).toBe(dto.id);
      expect(vm.planets).toHaveLength(10);
      expect(vm.aspects).toHaveLength(9);
      expect(vm.issues).toHaveLength(0);
    });
  });
});
