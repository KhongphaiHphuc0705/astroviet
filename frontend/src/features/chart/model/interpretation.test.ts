import { describe, expect, it } from "vitest";

import { chartFull, chartNoHouses } from "../api/mocks/fixtures";
import type { ChartResponse } from "../api/types";

import { toChartViewModel } from "./chartViewModel";
import {
  buildAscendantInSignKey,
  buildInterpretationKeySpace,
  buildInterpretationModel,
  buildPlanetInHouseKey,
  buildPlanetInSignKey,
  getInterpretationItemId,
  HOUSE_NUMBERS,
  INTERPRETATION_PLANETS,
} from "./interpretation";

function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, unknown>)[key];
    if (val !== null && typeof val === "object" && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

function makeVmInput(
  baseFixture: ChartResponse,
  dtoMutator?: (dto: ChartResponse) => void,
  vmMutator?: (vm: ReturnType<typeof toChartViewModel>) => void,
) {
  const cloned = structuredClone(baseFixture);
  if (dtoMutator) {
    dtoMutator(cloned);
  }
  const vm = toChartViewModel(cloned);
  if (vmMutator) {
    vmMutator(vm);
  }
  return { dto: cloned, vm };
}

describe("interpretation model - key builders and key space", () => {
  it("U-01: builds valid keys for supported planet, sign, house, and angle", () => {
    expect(buildPlanetInSignKey("Sun", "Capricorn")).toBe("Sun_in_Capricorn");
    expect(buildPlanetInHouseKey("Sun", 7)).toBe("Sun_in_House_7");
    expect(buildAscendantInSignKey("Leo")).toBe("Ascendant_in_Leo");

    // Boundary checks for houses 1 and 12
    expect(buildPlanetInHouseKey("Moon", 1)).toBe("Moon_in_House_1");
    expect(buildPlanetInHouseKey("Pluto", 12)).toBe("Pluto_in_House_12");
    expect(INTERPRETATION_PLANETS).toHaveLength(10);
    expect(HOUSE_NUMBERS).toHaveLength(12);

    // getInterpretationItemId helper
    expect(getInterpretationItemId("Sun")).toBe("planet:Sun");
    expect(getInterpretationItemId("Ascendant")).toBe("angle:Ascendant");
    expect(getInterpretationItemId("Chiron")).toBeNull();
  });

  it("U-02: returns null for invalid, malformed, or prototype-polluting values", () => {
    // Unsupported / malformed planet names
    expect(buildPlanetInSignKey("Chiron", "Aries")).toBeNull();
    expect(buildPlanetInSignKey("sun", "Aries")).toBeNull();
    expect(buildPlanetInSignKey("SUN", "Aries")).toBeNull();
    expect(buildPlanetInSignKey("toString", "Aries")).toBeNull();
    expect(buildPlanetInSignKey("__proto__", "Aries")).toBeNull();
    expect(buildPlanetInSignKey(null, "Aries")).toBeNull();
    expect(buildPlanetInSignKey(undefined, "Aries")).toBeNull();
    expect(buildPlanetInSignKey(42, "Aries")).toBeNull();

    // Unsupported / malformed signs
    expect(buildPlanetInSignKey("Sun", "capricorn")).toBeNull();
    expect(buildPlanetInSignKey("Sun", "Capricorn ")).toBeNull();
    expect(buildPlanetInSignKey("Sun", "Ophiuchus")).toBeNull();
    expect(buildPlanetInSignKey("Sun", "toString")).toBeNull();
    expect(buildPlanetInSignKey("Sun", 7)).toBeNull();
    expect(buildPlanetInSignKey("Sun", null)).toBeNull();
    expect(buildPlanetInSignKey("Sun", undefined)).toBeNull();

    // Unsupported / malformed houses
    expect(buildPlanetInHouseKey("Sun", 0)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", 13)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", 7.5)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", "7")).toBeNull();
    expect(buildPlanetInHouseKey("Sun", NaN)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", -1)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", Infinity)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", null)).toBeNull();
    expect(buildPlanetInHouseKey("Sun", undefined)).toBeNull();

    // Ascendant with malformed signs
    expect(buildAscendantInSignKey("leo")).toBeNull();
    expect(buildAscendantInSignKey("Leo ")).toBeNull();
    expect(buildAscendantInSignKey(null)).toBeNull();
    expect(buildAscendantInSignKey(undefined)).toBeNull();
    expect(buildAscendantInSignKey("toString")).toBeNull();
  });

  it("U-03: generates exact key space of 252 unique subjects with correct breakdown", () => {
    const keySpace = buildInterpretationKeySpace();

    expect(keySpace).toHaveLength(252);
    expect(Object.isFrozen(keySpace)).toBe(true);

    const planetInSign = keySpace.filter(
      (ref) => ref.subjectType === "PlanetInSign",
    );
    const angleInSign = keySpace.filter(
      (ref) => ref.subjectType === "AngleInSign",
    );
    const planetInHouse = keySpace.filter(
      (ref) => ref.subjectType === "PlanetInHouse",
    );

    expect(planetInSign).toHaveLength(120);
    expect(angleInSign).toHaveLength(12);
    expect(planetInHouse).toHaveLength(120);

    // Verify 100% uniqueness
    const uniqueKeys = new Set(
      keySpace.map((ref) => `${ref.subjectType}:${ref.subjectKey}`),
    );
    expect(uniqueKeys.size).toBe(252);

    // Verify all items are frozen
    for (const item of keySpace) {
      expect(Object.isFrozen(item)).toBe(true);
    }
  });
});

describe("interpretation model - baseline and fixtures (U-04, U-05)", () => {
  it("U-04: full fixture chartFull yields 21 available parts and status ready", () => {
    const { dto, vm } = makeVmInput(chartFull);
    const model = buildInterpretationModel(dto, vm);

    expect(model.availableCount).toBe(21);
    expect(model.status).toBe("ready");
    expect(model.houseDataAvailable).toBe(true);
    expect(model.version).toBe("1.0");
    expect(model.issues).toEqual([]);

    expect(model.groups).toHaveLength(2);
    expect(model.groups[0]!.id).toBe("core");
    expect(model.groups[0]!.itemIds).toEqual([
      "planet:Sun",
      "planet:Moon",
      "angle:Ascendant",
    ]);

    expect(model.groups[1]!.id).toBe("planets");
    expect(model.groups[1]!.itemIds).toHaveLength(8);
    expect(model.groups[1]!.itemIds).toEqual([
      "planet:Mercury",
      "planet:Venus",
      "planet:Mars",
      "planet:Jupiter",
      "planet:Saturn",
      "planet:Uranus",
      "planet:Neptune",
      "planet:Pluto",
    ]);

    // Every planet item has available bySign and byHouse
    for (const planetName of INTERPRETATION_PLANETS) {
      const item = model.itemsById[`planet:${planetName}`]!;
      expect(item).toBeDefined();
      expect(item.bySign.state).toBe("available");
      expect(item.byHouse).not.toBeNull();
      expect(item.byHouse!.state).toBe("available");
    }

    // Ascendant item
    const ascendantItem = model.itemsById["angle:Ascendant"]!;
    expect(ascendantItem).toBeDefined();
    expect(ascendantItem.bySign.state).toBe("available");
    expect(ascendantItem.byHouse).toBeNull();

    // Verify keys and verbatim bodyText match dto.interpretations
    const dtoMap = new Map(
      dto.interpretations.map((i) => [
        `${i.subjectType}:${i.subjectKey}`,
        i.bodyText,
      ]),
    );

    for (const item of model.items) {
      if (item.bySign.state === "available") {
        const type = item.kind === "angle" ? "AngleInSign" : "PlanetInSign";
        const expectedBody = dtoMap.get(`${type}:${item.bySign.subjectKey}`);
        expect(expectedBody).toBeDefined();
        expect(item.bySign.bodyText).toBe(expectedBody);
      }
      if (item.byHouse && item.byHouse.state === "available") {
        const expectedBody = dtoMap.get(
          `PlanetInHouse:${item.byHouse.subjectKey}`,
        );
        expect(expectedBody).toBeDefined();
        expect(item.byHouse.bodyText).toBe(expectedBody);
      }
    }
  });

  it("U-05: fixture without houses chartNoHouses yields 10 available parts and degraded issue", () => {
    const { dto, vm } = makeVmInput(chartNoHouses);
    const model = buildInterpretationModel(dto, vm);

    expect(model.availableCount).toBe(10);
    expect(model.status).toBe("ready");
    expect(model.houseDataAvailable).toBe(false);

    // 10 bySign available
    for (const planetName of INTERPRETATION_PLANETS) {
      const item = model.itemsById[`planet:${planetName}`]!;
      expect(item).toBeDefined();
      expect(item.bySign.state).toBe("available");
      expect(item.byHouse).toEqual({
        state: "unavailable",
        reason: "HOUSE_DATA_UNAVAILABLE",
      });
    }

    // Ascendant has ANGLE_ABSENT because angles is empty in chartNoHouses
    const ascendant = model.itemsById["angle:Ascendant"]!;
    expect(ascendant.bySign).toEqual({
      state: "unavailable",
      reason: "ANGLE_ABSENT",
    });

    expect(model.issues).toEqual([
      {
        code: "HOUSE_DATA_UNAVAILABLE",
        category: "degraded",
        subject: "houses",
        count: 1,
      },
    ]);
  });
});

describe("interpretation model - classification pipeline (Task 4: U-10..U-13, U-18, U-22)", () => {
  it("U-10: rejects malformed entries and groups unidentified entries while keeping valid ones", () => {
    const { dto, vm } = makeVmInput(chartFull, (d) => {
      const corrupt: unknown[] = [
        null,
        "string-entry",
        [],
        {
          subjectType: "PlanetInSign",
          subjectKey: "Sun_in_Capricorn",
          language: "vi",
        }, // missing bodyText
        {
          subjectType: "PlanetInSign",
          subjectKey: "Sun_in_Capricorn",
          language: "vi",
          bodyText: "",
        },
        {
          subjectType: "PlanetInSign",
          subjectKey: "Sun_in_Capricorn",
          language: "vi",
          bodyText: "   ",
        },
        {
          subjectType: "PlanetInSign",
          subjectKey: "Sun_in_Capricorn",
          language: "vi",
          bodyText: 42,
        },
        {
          subjectType: "PlanetInSign",
          subjectKey: "",
          language: "vi",
          bodyText: "Text",
        },
        {
          subjectType: "PlanetInSign",
          subjectKey: 42,
          language: "vi",
          bodyText: "Text",
        },
        { subjectKey: "Sun_in_Capricorn", language: "vi", bodyText: "Text" }, // missing subjectType
      ];
      // Append corrupt items to interpretations
      d.interpretations = [
        ...d.interpretations,
        ...(corrupt as unknown as typeof d.interpretations),
      ];
    });

    const model = buildInterpretationModel(dto, vm);

    // 21 parts still available
    expect(model.availableCount).toBe(21);
    expect(model.status).toBe("ready");

    const malformedIssues = model.issues.filter(
      (i) => i.code === "ENTRY_MALFORMED",
    );
    expect(malformedIssues.length).toBeGreaterThan(0);

    const unidentified = malformedIssues.find(
      (i) => i.subject === "entry:unidentified",
    );
    expect(unidentified).toBeDefined();
    expect(unidentified!.count).toBe(6); // null, "string-entry", [], subjectKey empty, subjectKey 42, missing subjectType

    const identified = malformedIssues.find(
      (i) => i.subject === "PlanetInSign:Sun_in_Capricorn",
    );
    expect(identified).toBeDefined();
    expect(identified!.count).toBe(4); // missing bodyText, empty bodyText, blank spaces bodyText, number bodyText
  });

  it("U-11: rejects unsupported subject types and keys", () => {
    const { dto, vm } = makeVmInput(chartFull, (d) => {
      d.interpretations.push(
        {
          subjectType:
            "AspectInSign" as unknown as (typeof d.interpretations)[number]["subjectType"],
          subjectKey: "Sun_trine_Moon",
          language: "vi",
          bodyText: "Sample",
        },
        {
          subjectType: "PlanetInSign",
          subjectKey: "Chiron_in_Aries",
          language: "vi",
          bodyText: "Sample",
        },
        {
          subjectType: "PlanetInSign",
          subjectKey: "Sun_in_aries",
          language: "vi",
          bodyText: "Sample",
        },
        {
          subjectType: "PlanetInHouse",
          subjectKey: "Sun_in_House_13",
          language: "vi",
          bodyText: "Sample",
        },
        {
          subjectType: "PlanetInSign",
          subjectKey: "Sun_in_House_1",
          language: "vi",
          bodyText: "Sample",
        },
      );
    });

    const model = buildInterpretationModel(dto, vm);

    expect(model.issues).toContainEqual({
      code: "SUBJECT_UNSUPPORTED",
      category: "defect",
      subject: "type:AspectInSign",
      count: 1,
    });
    expect(model.issues).toContainEqual({
      code: "SUBJECT_UNSUPPORTED",
      category: "defect",
      subject: "PlanetInSign:Chiron_in_Aries",
      count: 1,
    });
    expect(model.issues).toContainEqual({
      code: "SUBJECT_UNSUPPORTED",
      category: "defect",
      subject: "PlanetInSign:Sun_in_aries",
      count: 1,
    });
    expect(model.issues).toContainEqual({
      code: "SUBJECT_UNSUPPORTED",
      category: "defect",
      subject: "PlanetInHouse:Sun_in_House_13",
      count: 1,
    });
    expect(model.issues).toContainEqual({
      code: "SUBJECT_UNSUPPORTED",
      category: "defect",
      subject: "PlanetInSign:Sun_in_House_1",
      count: 1,
    });
  });

  it("U-12: rejects unsupported languages and keeps vi when mixed", () => {
    const { dto, vm } = makeVmInput(chartFull, (d) => {
      d.interpretations.push(
        {
          subjectType: "PlanetInSign",
          subjectKey: "Mars_in_Aries",
          language: "en",
          bodyText: "Mars text",
        },
        {
          subjectType: "PlanetInSign",
          subjectKey: "Venus_in_Taurus",
          language: "VI",
          bodyText: "Venus text",
        },
        {
          subjectType: "PlanetInSign",
          subjectKey: "Jupiter_in_Gemini",
          language: "vi-VN",
          bodyText: "Jupiter text",
        },
        {
          subjectType: "PlanetInSign",
          subjectKey: "Saturn_in_Cancer",
          language: 42 as unknown as string,
          bodyText: "Saturn text",
        },
        // Mixed: English version of Sun_in_Capricorn added alongside existing vi version
        {
          subjectType: "PlanetInSign",
          subjectKey: "Sun_in_Capricorn",
          language: "en",
          bodyText: "Sun english text",
        },
      );
    });

    const model = buildInterpretationModel(dto, vm);

    expect(model.issues).toContainEqual({
      code: "LANGUAGE_NOT_SUPPORTED",
      category: "defect",
      subject: "PlanetInSign:Mars_in_Aries",
      count: 1,
    });
    expect(model.issues).toContainEqual({
      code: "LANGUAGE_NOT_SUPPORTED",
      category: "defect",
      subject: "PlanetInSign:Venus_in_Taurus",
      count: 1,
    });
    expect(model.issues).toContainEqual({
      code: "LANGUAGE_NOT_SUPPORTED",
      category: "defect",
      subject: "PlanetInSign:Jupiter_in_Gemini",
      count: 1,
    });
    expect(model.issues).toContainEqual({
      code: "ENTRY_MALFORMED",
      category: "defect",
      subject: "PlanetInSign:Saturn_in_Cancer",
      count: 1,
    });
    expect(model.issues).toContainEqual({
      code: "LANGUAGE_NOT_SUPPORTED",
      category: "defect",
      subject: "PlanetInSign:Sun_in_Capricorn",
      count: 1,
    });

    // The Vietnamese Sun_in_Capricorn is still available and NOT flagged as duplicate
    expect(model.itemsById["planet:Sun"]!.bySign.state).toBe("available");
    const duplicateIssues = model.issues.filter(
      (i) => i.code === "DUPLICATE_SUBJECT",
    );
    expect(duplicateIssues).toHaveLength(0);
  });

  it("U-13: marks duplicate subjects as ambiguous and rejects both", () => {
    const { dto, vm } = makeVmInput(chartFull, (d) => {
      // Add duplicate Sun_in_Capricorn
      d.interpretations.push({
        subjectType: "PlanetInSign",
        subjectKey: "Sun_in_Capricorn",
        language: "vi",
        bodyText: "Duplicate text",
      });
    });

    const model = buildInterpretationModel(dto, vm);

    expect(model.itemsById["planet:Sun"]!.bySign).toEqual({
      state: "ambiguous",
      reason: "DUPLICATE_ENTRIES",
    });

    expect(model.issues).toContainEqual({
      code: "DUPLICATE_SUBJECT",
      category: "defect",
      subject: "PlanetInSign:Sun_in_Capricorn",
      count: 2,
    });
  });

  it("U-18: handles non-array interpretations gracefully", () => {
    for (const invalid of [undefined, null, {}, "string-data"]) {
      const { vm } = makeVmInput(chartFull);
      const model = buildInterpretationModel(
        {
          interpretations:
            invalid as unknown as typeof chartFull.interpretations,
          interpretationVersion: "1.0",
        },
        vm,
      );

      expect(model.status).toBe("unavailable");
      expect(model.availableCount).toBe(0);
      expect(model.issues).toContainEqual({
        code: "ENTRY_MALFORMED",
        category: "defect",
        subject: "interpretations",
        count: 1,
      });
    }
  });

  it("U-22: normalizes invalid version and handles null version with items", () => {
    // 1. Invalid version number 5
    const { dto: dto1, vm: vm1 } = makeVmInput(chartFull, (d) => {
      (d as unknown as Record<string, unknown>).interpretationVersion = 5;
    });
    const model1 = buildInterpretationModel(dto1, vm1);
    expect(model1.version).toBeNull();
    expect(model1.issues).toContainEqual({
      code: "VERSION_INVALID",
      category: "defect",
      subject: "interpretationVersion",
      count: 1,
    });

    // 2. null version with items
    const { dto: dto2, vm: vm2 } = makeVmInput(chartFull, (d) => {
      d.interpretationVersion = null as unknown as string;
    });
    const model2 = buildInterpretationModel(dto2, vm2);
    expect(model2.version).toBeNull();
    expect(model2.availableCount).toBe(21);
    expect(model2.status).toBe("ready");
  });
});

describe("interpretation model - derivation, assembly, and status (Task 5: U-07..U-09, U-14..U-17, U-19, U-23, U-24, U-26)", () => {
  it("U-07: flags missing PlanetInSign and sets status partial", () => {
    const { dto, vm } = makeVmInput(chartFull, (d) => {
      d.interpretations = d.interpretations.filter(
        (i) => i.subjectKey !== "Mars_in_Sagittarius",
      );
    });

    const model = buildInterpretationModel(dto, vm);

    expect(model.availableCount).toBe(20);
    expect(model.status).toBe("partial");
    expect(model.itemsById["planet:Mars"]!.bySign).toEqual({
      state: "missing",
      subjectKey: "Mars_in_Sagittarius",
    });
    expect(model.issues).toContainEqual({
      code: "CONTENT_MISSING",
      category: "defect",
      subject: "PlanetInSign:Mars_in_Sagittarius",
      count: 1,
    });
  });

  it("U-08: flags missing PlanetInHouse when houses available and sets status partial", () => {
    const { dto, vm } = makeVmInput(chartFull, (d) => {
      d.interpretations = d.interpretations.filter(
        (i) => i.subjectKey !== "Mars_in_House_8",
      );
    });

    const model = buildInterpretationModel(dto, vm);

    expect(model.availableCount).toBe(20);
    expect(model.status).toBe("partial");
    expect(model.itemsById["planet:Mars"]!.byHouse).toEqual({
      state: "missing",
      subjectKey: "Mars_in_House_8",
    });
    expect(model.issues).toContainEqual({
      code: "CONTENT_MISSING",
      category: "defect",
      subject: "PlanetInHouse:Mars_in_House_8",
      count: 1,
    });
  });

  it("U-09: handles unreleased vs published empty interpretations", () => {
    // (a) [] + version null -> unreleased
    const { vm } = makeVmInput(chartFull);
    const modelA = buildInterpretationModel(
      { interpretations: [], interpretationVersion: null },
      vm,
    );
    expect(modelA.status).toBe("unavailable");
    expect(modelA.availableCount).toBe(0);
    expect(modelA.itemsById["planet:Sun"]!.bySign).toEqual({
      state: "unavailable",
      reason: "CONTENT_NOT_PUBLISHED",
    });
    expect(modelA.issues).toEqual([
      {
        code: "CONTENT_NOT_PUBLISHED",
        category: "degraded",
        subject: "interpretations",
        count: 1,
      },
    ]);

    // (b) [] + version "1.0" -> published but missing all 21 parts
    const modelB = buildInterpretationModel(
      { interpretations: [], interpretationVersion: "1.0" },
      vm,
    );
    expect(modelB.status).toBe("unavailable");
    expect(modelB.availableCount).toBe(0);
    expect(modelB.itemsById["planet:Sun"]!.bySign).toEqual({
      state: "missing",
      subjectKey: "Sun_in_Capricorn",
    });
    const missingIssues = modelB.issues.filter(
      (i) => i.code === "CONTENT_MISSING",
    );
    expect(missingIssues).toHaveLength(21);
  });

  it("U-09b: corrupted response vs unreleased (prevents false unreleased status)", () => {
    const { vm } = makeVmInput(chartFull);

    // 1. interpretations not an array + version null
    const model1 = buildInterpretationModel(
      {
        interpretations:
          undefined as unknown as typeof chartFull.interpretations,
        interpretationVersion: null,
      },
      vm,
    );
    expect(model1.status).toBe("unavailable");
    expect(model1.availableCount).toBe(0);
    expect(model1.itemsById["planet:Sun"]!.bySign).toEqual({
      state: "missing",
      subjectKey: "Sun_in_Capricorn",
    });
    expect(model1.issues).toContainEqual({
      code: "ENTRY_MALFORMED",
      category: "defect",
      subject: "interpretations",
      count: 1,
    });
    expect(model1.issues.some((i) => i.code === "CONTENT_NOT_PUBLISHED")).toBe(
      false,
    );
    expect(model1.issues.some((i) => i.code === "CONTENT_MISSING")).toBe(true);

    // 2. [] + number version (e.g. 5)
    const model2 = buildInterpretationModel(
      {
        interpretations: [],
        interpretationVersion: 5 as unknown as string,
      },
      vm,
    );
    expect(model2.status).toBe("unavailable");
    expect(model2.availableCount).toBe(0);
    expect(model2.itemsById["planet:Sun"]!.bySign).toEqual({
      state: "missing",
      subjectKey: "Sun_in_Capricorn",
    });
    expect(model2.issues).toContainEqual({
      code: "VERSION_INVALID",
      category: "defect",
      subject: "interpretationVersion",
      count: 1,
    });
    expect(model2.issues.some((i) => i.code === "CONTENT_NOT_PUBLISHED")).toBe(
      false,
    );
    expect(model2.issues.some((i) => i.code === "CONTENT_MISSING")).toBe(true);

    // 3. [] + undefined version (missing field)
    const model3 = buildInterpretationModel(
      {
        interpretations: [],
        interpretationVersion: undefined as unknown as string,
      },
      vm,
    );
    expect(model3.status).toBe("unavailable");
    expect(model3.availableCount).toBe(0);
    expect(model3.itemsById["planet:Sun"]!.bySign).toEqual({
      state: "missing",
      subjectKey: "Sun_in_Capricorn",
    });
    expect(model3.issues).toContainEqual({
      code: "VERSION_INVALID",
      category: "defect",
      subject: "interpretationVersion",
      count: 1,
    });
    expect(model3.issues.some((i) => i.code === "CONTENT_NOT_PUBLISHED")).toBe(
      false,
    );
    expect(model3.issues.some((i) => i.code === "CONTENT_MISSING")).toBe(true);
  });

  it("U-14: flags non-applicable entries", () => {
    // 1. Valid entry but wrong sign for this chart (Moon in Gemini instead of Aquarius)
    const { dto, vm } = makeVmInput(chartFull, (d) => {
      d.interpretations = d.interpretations.filter(
        (i) => i.subjectKey !== "Moon_in_Aquarius",
      );
      d.interpretations.push({
        subjectType: "PlanetInSign",
        subjectKey: "Moon_in_Gemini",
        language: "vi",
        bodyText: "Moon in Gemini text",
      });
    });

    const model = buildInterpretationModel(dto, vm);

    expect(model.itemsById["planet:Moon"]!.bySign).toEqual({
      state: "missing",
      subjectKey: "Moon_in_Aquarius",
    });
    expect(model.issues).toContainEqual({
      code: "ENTRY_NOT_APPLICABLE",
      category: "defect",
      subject: "PlanetInSign:Moon_in_Gemini",
      count: 1,
    });
    expect(model.issues).toContainEqual({
      code: "CONTENT_MISSING",
      category: "defect",
      subject: "PlanetInSign:Moon_in_Aquarius",
      count: 1,
    });

    // 2. PlanetInHouse delivered when houseDataAvailable is false
    const { dto: dto2, vm: vm2 } = makeVmInput(chartNoHouses, (d) => {
      d.interpretations.push({
        subjectType: "PlanetInHouse",
        subjectKey: "Sun_in_House_1",
        language: "vi",
        bodyText: "Sun in House 1 text",
      });
    });

    const model2 = buildInterpretationModel(dto2, vm2);
    expect(model2.itemsById["planet:Sun"]!.byHouse).toEqual({
      state: "unavailable",
      reason: "HOUSE_DATA_UNAVAILABLE",
    });
    expect(model2.issues).toContainEqual({
      code: "ENTRY_NOT_APPLICABLE",
      category: "defect",
      subject: "PlanetInHouse:Sun_in_House_1",
      count: 1,
    });
  });

  it("U-15: flags unresolved sign or house identifiers", () => {
    const { dto, vm } = makeVmInput(chartFull, undefined, (v) => {
      const sun = v.planets.find((p) => p.key === "Sun")!;
      sun.sign = {
        known: false,
        key: "UnknownSign",
        labelVi: "Không rõ",
        glyph: "?",
      };

      const moon = v.planets.find((p) => p.key === "Moon")!;
      moon.houseNumber = null;
    });

    const model = buildInterpretationModel(dto, vm);

    expect(model.status).toBe("partial");
    expect(model.itemsById["planet:Sun"]!.bySign).toEqual({
      state: "unavailable",
      reason: "SIGN_UNRESOLVED",
    });
    expect(model.itemsById["planet:Moon"]!.byHouse).toEqual({
      state: "unavailable",
      reason: "HOUSE_NUMBER_UNRESOLVED",
    });

    expect(model.issues).toContainEqual({
      code: "IDENTIFIER_UNRESOLVED",
      category: "defect",
      subject: "planet:Sun.sign",
      count: 1,
    });
    expect(model.issues).toContainEqual({
      code: "IDENTIFIER_UNRESOLVED",
      category: "defect",
      subject: "planet:Moon.house",
      count: 1,
    });

    // Invalid sign key with known: true for planet and Ascendant
    const { dto: dtoInv, vm: vmInv } = makeVmInput(
      chartFull,
      undefined,
      (v) => {
        const sun = v.planets.find((p) => p.key === "Sun")!;
        sun.sign = {
          known: true,
          key: "InvalidSign" as unknown as typeof sun.sign.key,
          labelVi: "Không hợp lệ",
          glyph: "?",
        };
        const asc = v.angles.find((a) => a.key === "Ascendant")!;
        asc.sign = {
          known: true,
          key: "InvalidSign" as unknown as typeof asc.sign.key,
          labelVi: "Không hợp lệ",
          glyph: "?",
        };
      },
    );
    const modelInv = buildInterpretationModel(dtoInv, vmInv);
    expect(modelInv.itemsById["planet:Sun"]!.bySign).toEqual({
      state: "unavailable",
      reason: "SIGN_UNRESOLVED",
    });
    expect(modelInv.itemsById["angle:Ascendant"]!.bySign).toEqual({
      state: "unavailable",
      reason: "SIGN_UNRESOLVED",
    });
  });

  it("U-16: ignores non-MVP planets in VM and rejects their interpretations if delivered", () => {
    const { dto, vm } = makeVmInput(
      chartFull,
      (d) => {
        d.interpretations.push({
          subjectType: "PlanetInSign",
          subjectKey: "Chiron_in_Aries",
          language: "vi",
          bodyText: "Chiron text",
        });
      },
      (v) => {
        v.planets.push({
          key: "Chiron" as unknown as (typeof v.planets)[number]["key"],
          nameVi: "Chiron",
          glyph: null,
          known: true,
          longitude: 10,
          sign: {
            known: true,
            key: "Aries",
            labelVi: "Bạch Dương",
            glyph: "♈",
          },
          degreeLabel: "10°",
          houseNumber: 1,
          isRetrograde: false,
          ariaLabel: "Chiron Bạch Dương",
        });
      },
    );

    const model = buildInterpretationModel(dto, vm);

    expect(
      (model.itemsById as Record<string, unknown>)["planet:Chiron"],
    ).toBeUndefined();
    expect(model.items.some((i) => (i.id as string) === "planet:Chiron")).toBe(
      false,
    );

    // Delivered Chiron interpretation rejected as SUBJECT_UNSUPPORTED
    expect(model.issues).toContainEqual({
      code: "SUBJECT_UNSUPPORTED",
      category: "defect",
      subject: "PlanetInSign:Chiron_in_Aries",
      count: 1,
    });

    // No issue reported for the Chiron planet itself
    const planetIssues = model.issues.filter((i) =>
      i.subject.includes("Chiron"),
    );
    expect(planetIssues).toEqual([
      {
        code: "SUBJECT_UNSUPPORTED",
        category: "defect",
        subject: "PlanetInSign:Chiron_in_Aries",
        count: 1,
      },
    ]);
  });

  it("U-17: marks duplicate planets in VM as ambiguous identifier", () => {
    const { dto, vm } = makeVmInput(chartFull, undefined, (v) => {
      const sun = v.planets.find((p) => p.key === "Sun")!;
      v.planets.push(structuredClone(sun));

      const moon = v.planets.find((p) => p.key === "Moon")!;
      v.planets.push(structuredClone(moon));

      const mercury = v.planets.find((p) => p.key === "Mercury")!;
      v.planets.push(structuredClone(mercury));
    });

    const model = buildInterpretationModel(dto, vm);

    for (const key of ["Sun", "Moon", "Mercury"] as const) {
      const item = model.itemsById[`planet:${key}`]!;
      expect(item.bySign).toEqual({
        state: "ambiguous",
        reason: "DUPLICATE_IDENTIFIER",
      });
      expect(item.byHouse).toEqual({
        state: "ambiguous",
        reason: "DUPLICATE_IDENTIFIER",
      });

      expect(model.issues).toContainEqual({
        code: "AMBIGUOUS_IDENTIFIER",
        category: "defect",
        subject: `planet:${key}`,
        count: 2,
      });
    }
  });

  it("U-19: omits empty planets group when VM has no planets", () => {
    const { dto, vm } = makeVmInput(chartFull, undefined, (v) => {
      v.planets = [];
    });

    const model = buildInterpretationModel(dto, vm);

    // Only core group is emitted (containing Ascendant)
    expect(model.groups).toHaveLength(1);
    expect(model.groups[0]!.id).toBe("core");
    expect(model.groups[0]!.itemIds).toEqual(["angle:Ascendant"]);
  });

  it("U-23: verifies Ascendant rules across all states", () => {
    // (a) Ascendant valid and matched -> available
    const { dto: dtoA, vm: vmA } = makeVmInput(chartFull);
    const modelA = buildInterpretationModel(dtoA, vmA);
    expect(modelA.itemsById["angle:Ascendant"]!.bySign.state).toBe("available");

    // (b) Ascendant absent -> ANGLE_ABSENT
    const { dto: dtoB, vm: vmB } = makeVmInput(chartFull, undefined, (v) => {
      v.angles = [];
    });
    const modelB = buildInterpretationModel(dtoB, vmB);
    expect(modelB.itemsById["angle:Ascendant"]!.bySign).toEqual({
      state: "unavailable",
      reason: "ANGLE_ABSENT",
    });

    // (c) Two Ascendants -> DUPLICATE_IDENTIFIER
    const { dto: dtoC, vm: vmC } = makeVmInput(chartFull, undefined, (v) => {
      const asc = v.angles.find((a) => a.key === "Ascendant")!;
      v.angles.push(structuredClone(asc));
    });
    const modelC = buildInterpretationModel(dtoC, vmC);
    expect(modelC.itemsById["angle:Ascendant"]!.bySign).toEqual({
      state: "ambiguous",
      reason: "DUPLICATE_IDENTIFIER",
    });
    expect(modelC.issues).toContainEqual({
      code: "AMBIGUOUS_IDENTIFIER",
      category: "defect",
      subject: "angle:Ascendant",
      count: 2,
    });

    // (d) sign known: false -> SIGN_UNRESOLVED
    const { dto: dtoD, vm: vmD } = makeVmInput(chartFull, undefined, (v) => {
      const asc = v.angles.find((a) => a.key === "Ascendant")!;
      asc.sign = {
        known: false,
        key: "Unknown",
        labelVi: "Không rõ",
        glyph: "?",
      };
    });
    const modelD = buildInterpretationModel(dtoD, vmD);
    expect(modelD.itemsById["angle:Ascendant"]!.bySign).toEqual({
      state: "unavailable",
      reason: "SIGN_UNRESOLVED",
    });
    expect(modelD.issues).toContainEqual({
      code: "IDENTIFIER_UNRESOLVED",
      category: "defect",
      subject: "angle:Ascendant.sign",
      count: 1,
    });

    // (e) houseDataAvailable = false BUT Ascendant present in angles and interpretation matches (J-5)
    const { dto: dtoE, vm: vmE } = makeVmInput(chartFull, undefined, (v) => {
      v.flags.houseDataAvailable = false;
    });
    const modelE = buildInterpretationModel(dtoE, vmE);
    expect(modelE.itemsById["angle:Ascendant"]!.bySign.state).toBe("available");
  });

  it("U-24: adheres strictly to AC-09 structure (no house group or item)", () => {
    for (const fixture of [chartFull, chartNoHouses]) {
      const { dto, vm } = makeVmInput(fixture);
      const model = buildInterpretationModel(dto, vm);

      for (const group of model.groups) {
        expect(["core", "planets"]).toContain(group.id);
        expect((group.id as string).toLowerCase()).not.toContain("house");
      }

      for (const item of model.items) {
        expect(
          item.id.startsWith("planet:") || item.id === "angle:Ascendant",
        ).toBe(true);
        expect(item.id.toLowerCase()).not.toContain("house");
      }
    }
  });

  it("U-26: does not infer birth time or create birth-time issues", () => {
    const { dto, vm } = makeVmInput(chartNoHouses);
    const model = buildInterpretationModel(dto, vm);

    expect(model.issues).toEqual([
      {
        code: "HOUSE_DATA_UNAVAILABLE",
        category: "degraded",
        subject: "houses",
        count: 1,
      },
    ]);

    // Check no birth time related text or codes in model
    const serialized = JSON.stringify(model);
    expect(serialized).not.toContain("birthTime");
    expect(serialized).not.toContain("BIRTH_TIME");
  });
});

describe("interpretation model - properties, determinism, and immutability (Task 6: U-06, U-20, U-21, U-25)", () => {
  it("U-06: order independence under arbitrary permutations", () => {
    for (const fixture of [chartFull, chartNoHouses]) {
      const { dto: baseDto, vm: baseVm } = makeVmInput(fixture);
      const baseline = buildInterpretationModel(baseDto, baseVm);

      // Permutation 1: Reverse all arrays
      const { dto: dto1, vm: vm1 } = makeVmInput(fixture, (d) => {
        d.interpretations.reverse();
      });
      vm1.planets = [...vm1.planets].reverse();
      vm1.angles = [...vm1.angles].reverse();
      const model1 = buildInterpretationModel(dto1, vm1);
      expect(model1).toEqual(baseline);

      // Permutation 2: Rotate arrays by 7
      const { dto: dto2, vm: vm2 } = makeVmInput(fixture, (d) => {
        const pivot = 7 % d.interpretations.length;
        d.interpretations = [
          ...d.interpretations.slice(pivot),
          ...d.interpretations.slice(0, pivot),
        ];
      });
      const pPivot = 7 % vm2.planets.length;
      vm2.planets = [
        ...vm2.planets.slice(pPivot),
        ...vm2.planets.slice(0, pPivot),
      ];
      const model2 = buildInterpretationModel(dto2, vm2);
      expect(model2).toEqual(baseline);

      // Permutation 3: Even/odd split and recombine
      const { dto: dto3, vm: vm3 } = makeVmInput(fixture, (d) => {
        const evens = d.interpretations.filter((_, idx) => idx % 2 === 0);
        const odds = d.interpretations.filter((_, idx) => idx % 2 !== 0);
        d.interpretations = [...odds, ...evens];
      });
      const pEvens = vm3.planets.filter((_, idx) => idx % 2 === 0);
      const pOdds = vm3.planets.filter((_, idx) => idx % 2 !== 0);
      vm3.planets = [...pOdds, ...pEvens];
      const model3 = buildInterpretationModel(dto3, vm3);
      expect(model3).toEqual(baseline);
    }
  });

  it("U-20: preserves input immutability when inputs are deeply frozen", () => {
    const { dto, vm } = makeVmInput(chartFull);
    const dtoSnapshot = structuredClone(dto);
    const vmSnapshot = structuredClone(vm);

    deepFreeze(dto);
    deepFreeze(vm);

    // Call buildInterpretationModel on frozen inputs
    const model = buildInterpretationModel(dto, vm);
    expect(model.availableCount).toBe(21);

    // Inputs must remain identical to snapshot
    expect(dto).toEqual(dtoSnapshot);
    expect(vm).toEqual(vmSnapshot);
  });

  it("U-21: is strictly deterministic and serializable", () => {
    const { dto, vm } = makeVmInput(chartFull);

    const call1 = buildInterpretationModel(dto, vm);
    const call2 = buildInterpretationModel(dto, vm);

    expect(call1).toEqual(call2);

    const serialized = JSON.stringify(call1);
    const deserialized = JSON.parse(serialized);

    expect(deserialized).toEqual(call1);
  });

  it("U-25: preserves verbatim bodyText without trimming or escaping", () => {
    const rawSpecialText =
      "  \n <b>Sample Rich Text & Special Chars: @#$% </b> \t ";

    const { dto, vm } = makeVmInput(chartFull, (d) => {
      const sun = d.interpretations.find(
        (i) => i.subjectKey === "Sun_in_Capricorn",
      )!;
      sun.bodyText = rawSpecialText;
    });

    const model = buildInterpretationModel(dto, vm);

    const sunItem = model.itemsById["planet:Sun"]!;
    expect(sunItem.bySign.state).toBe("available");
    if (sunItem.bySign.state === "available") {
      expect(sunItem.bySign.bodyText).toBe(rawSpecialText);
    }
  });
});
