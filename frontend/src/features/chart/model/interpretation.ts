import {
  KNOWN_ZODIAC_SIGNS,
  type ChartResponse,
  type InterpretationSubjectType,
} from "../api/types";

import type { ChartViewModel } from "./chartViewModel";

export const INTERPRETATION_PLANETS = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
] as const;

export type InterpretationPlanet = (typeof INTERPRETATION_PLANETS)[number];

export const HOUSE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type HouseNumber = (typeof HOUSE_NUMBERS)[number];

const INTERPRETATION_PLANET_SET = new Set<string>(INTERPRETATION_PLANETS);
const KNOWN_ZODIAC_SIGN_SET = new Set<string>(KNOWN_ZODIAC_SIGNS);

export function buildPlanetInSignKey(
  planet: unknown,
  sign: unknown,
): string | null {
  if (
    typeof planet !== "string" ||
    typeof sign !== "string" ||
    !INTERPRETATION_PLANET_SET.has(planet) ||
    !KNOWN_ZODIAC_SIGN_SET.has(sign)
  ) {
    return null;
  }
  return `${planet}_in_${sign}`;
}

export function buildPlanetInHouseKey(
  planet: unknown,
  house: unknown,
): string | null {
  if (
    typeof planet !== "string" ||
    typeof house !== "number" ||
    !Number.isInteger(house) ||
    house < 1 ||
    house > 12 ||
    !INTERPRETATION_PLANET_SET.has(planet)
  ) {
    return null;
  }
  return `${planet}_in_House_${house}`;
}

export function buildAscendantInSignKey(sign: unknown): string | null {
  if (typeof sign !== "string" || !KNOWN_ZODIAC_SIGN_SET.has(sign)) {
    return null;
  }
  return `Ascendant_in_${sign}`;
}

export interface InterpretationSubjectRef {
  subjectType: InterpretationSubjectType;
  subjectKey: string;
}

export function buildInterpretationKeySpace(): readonly InterpretationSubjectRef[] {
  const result: InterpretationSubjectRef[] = [];

  // 1. PlanetInSign: 10 planets x 12 signs = 120
  for (const planet of INTERPRETATION_PLANETS) {
    for (const sign of KNOWN_ZODIAC_SIGNS) {
      const key = buildPlanetInSignKey(planet, sign);
      if (key !== null) {
        result.push(
          Object.freeze({ subjectType: "PlanetInSign", subjectKey: key }),
        );
      }
    }
  }

  // 2. AngleInSign: 1 angle (Ascendant) x 12 signs = 12
  for (const sign of KNOWN_ZODIAC_SIGNS) {
    const key = buildAscendantInSignKey(sign);
    if (key !== null) {
      result.push(
        Object.freeze({ subjectType: "AngleInSign", subjectKey: key }),
      );
    }
  }

  // 3. PlanetInHouse: 10 planets x 12 houses = 120
  for (const planet of INTERPRETATION_PLANETS) {
    for (const house of HOUSE_NUMBERS) {
      const key = buildPlanetInHouseKey(planet, house);
      if (key !== null) {
        result.push(
          Object.freeze({ subjectType: "PlanetInHouse", subjectKey: key }),
        );
      }
    }
  }

  return Object.freeze(result);
}

export type InterpretationGroupId = "core" | "planets";
export type InterpretationItemId =
  `planet:${InterpretationPlanet}` | "angle:Ascendant";

export type InterpretationUnavailableReason =
  | "HOUSE_DATA_UNAVAILABLE"
  | "HOUSE_NUMBER_UNRESOLVED"
  | "SIGN_UNRESOLVED"
  | "ANGLE_ABSENT"
  | "CONTENT_NOT_PUBLISHED";

export type InterpretationPart =
  | { state: "available"; subjectKey: string; bodyText: string }
  | { state: "missing"; subjectKey: string }
  | { state: "ambiguous"; reason: "DUPLICATE_ENTRIES" | "DUPLICATE_IDENTIFIER" }
  | { state: "unavailable"; reason: InterpretationUnavailableReason };

export interface InterpretationItem {
  id: InterpretationItemId;
  group: InterpretationGroupId;
  kind: "planet" | "angle";
  subject: string;
  bySign: InterpretationPart;
  byHouse: InterpretationPart | null;
}

export interface InterpretationGroup {
  id: InterpretationGroupId;
  itemIds: readonly InterpretationItemId[];
}

export type InterpretationStatus = "ready" | "partial" | "unavailable";

export type InterpretationIssueCategory = "degraded" | "defect";
export type InterpretationIssueCode =
  | "CONTENT_NOT_PUBLISHED"
  | "HOUSE_DATA_UNAVAILABLE"
  | "ENTRY_MALFORMED"
  | "SUBJECT_UNSUPPORTED"
  | "LANGUAGE_NOT_SUPPORTED"
  | "DUPLICATE_SUBJECT"
  | "ENTRY_NOT_APPLICABLE"
  | "CONTENT_MISSING"
  | "IDENTIFIER_UNRESOLVED"
  | "AMBIGUOUS_IDENTIFIER"
  | "VERSION_INVALID";

export interface InterpretationIssue {
  code: InterpretationIssueCode;
  category: InterpretationIssueCategory;
  subject: string;
  count: number;
}

export interface InterpretationModel {
  status: InterpretationStatus;
  version: string | null;
  houseDataAvailable: boolean;
  items: readonly InterpretationItem[];
  itemsById: Readonly<
    Partial<Record<InterpretationItemId, InterpretationItem>>
  >;
  groups: readonly InterpretationGroup[];
  availableCount: number;
  issues: readonly InterpretationIssue[];
}

export function getInterpretationItemId(
  planetKey: string,
): InterpretationItemId | null {
  if (planetKey === "Ascendant") {
    return "angle:Ascendant";
  }
  if (INTERPRETATION_PLANET_SET.has(planetKey)) {
    return `planet:${planetKey as InterpretationPlanet}`;
  }
  return null;
}

export function buildInterpretationModel(
  dto: Pick<ChartResponse, "interpretations" | "interpretationVersion">,
  vm: Pick<ChartViewModel, "planets" | "angles" | "flags">,
): InterpretationModel {
  // Stub for Task 2-3; full pipeline will be implemented in Task 4-5
  const houseDataAvailable = vm.flags.houseDataAvailable;
  const version =
    typeof dto.interpretationVersion === "string"
      ? dto.interpretationVersion
      : null;

  return Object.freeze({
    status: "unavailable" as const,
    version,
    houseDataAvailable,
    items: Object.freeze([]),
    itemsById: Object.freeze({}),
    groups: Object.freeze([]),
    availableCount: 0,
    issues: Object.freeze([]),
  });
}
