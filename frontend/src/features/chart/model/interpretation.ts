import {
  KNOWN_INTERPRETATION_SUBJECT_TYPES,
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

const ISSUE_CODE_ORDER: readonly InterpretationIssueCode[] = [
  "CONTENT_NOT_PUBLISHED",
  "HOUSE_DATA_UNAVAILABLE",
  "ENTRY_MALFORMED",
  "SUBJECT_UNSUPPORTED",
  "LANGUAGE_NOT_SUPPORTED",
  "DUPLICATE_SUBJECT",
  "ENTRY_NOT_APPLICABLE",
  "CONTENT_MISSING",
  "IDENTIFIER_UNRESOLVED",
  "AMBIGUOUS_IDENTIFIER",
  "VERSION_INVALID",
];

function getIssueCategory(
  code: InterpretationIssueCode,
): InterpretationIssueCategory {
  if (code === "CONTENT_NOT_PUBLISHED" || code === "HOUSE_DATA_UNAVAILABLE") {
    return "degraded";
  }
  return "defect";
}

const KEY_SPACE = buildInterpretationKeySpace();
const VALID_KEYS_BY_TYPE: Record<InterpretationSubjectType, Set<string>> = {
  PlanetInSign: new Set(),
  AngleInSign: new Set(),
  PlanetInHouse: new Set(),
};
for (const item of KEY_SPACE) {
  VALID_KEYS_BY_TYPE[item.subjectType].add(item.subjectKey);
}

interface RawIssue {
  code: InterpretationIssueCode;
  subject: string;
  count: number;
}

interface ValidEntryCandidate {
  subjectType: InterpretationSubjectType;
  subjectKey: string;
  bodyText: string;
}

interface ClassifiedEntries {
  accepted: Map<string, string>;
  ambiguousKeys: Set<string>;
  issues: RawIssue[];
}

function classifyEntries(rawInterpretations: unknown): ClassifiedEntries {
  if (!Array.isArray(rawInterpretations)) {
    return {
      accepted: new Map(),
      ambiguousKeys: new Set(),
      issues: [
        {
          code: "ENTRY_MALFORMED",
          subject: "interpretations",
          count: 1,
        },
      ],
    };
  }

  const issues: RawIssue[] = [];
  const validCandidates: ValidEntryCandidate[] = [];

  for (const item of rawInterpretations) {
    // Rule 1: Shape and types check
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      issues.push({
        code: "ENTRY_MALFORMED",
        subject: "entry:unidentified",
        count: 1,
      });
      continue;
    }

    const entry = item as Record<string, unknown>;
    const subjectTypeRaw = entry.subjectType;
    const subjectKeyRaw = entry.subjectKey;
    const languageRaw = entry.language;
    const bodyTextRaw = entry.bodyText;

    const hasStringType = typeof subjectTypeRaw === "string";
    const hasStringKey = typeof subjectKeyRaw === "string";
    const hasStringLang = typeof languageRaw === "string";
    const hasStringBody = typeof bodyTextRaw === "string";

    const nonBlankKey = hasStringKey && subjectKeyRaw.length > 0;
    const nonBlankBody = hasStringBody && bodyTextRaw.trim().length > 0;

    if (!hasStringType || !nonBlankKey || !hasStringLang || !nonBlankBody) {
      const subject =
        hasStringType &&
        subjectTypeRaw.length > 0 &&
        hasStringKey &&
        subjectKeyRaw.length > 0
          ? `${subjectTypeRaw}:${subjectKeyRaw}`
          : "entry:unidentified";

      issues.push({
        code: "ENTRY_MALFORMED",
        subject,
        count: 1,
      });
      continue;
    }

    // Rule 2: Supported subject type and key
    const subjectType = subjectTypeRaw;
    const subjectKey = subjectKeyRaw;

    const isKnownType = (
      KNOWN_INTERPRETATION_SUBJECT_TYPES as readonly string[]
    ).includes(subjectType);

    if (!isKnownType) {
      issues.push({
        code: "SUBJECT_UNSUPPORTED",
        subject: `type:${subjectType}`,
        count: 1,
      });
      continue;
    }

    const validKeySet =
      VALID_KEYS_BY_TYPE[subjectType as InterpretationSubjectType];
    if (!validKeySet.has(subjectKey)) {
      issues.push({
        code: "SUBJECT_UNSUPPORTED",
        subject: `${subjectType}:${subjectKey}`,
        count: 1,
      });
      continue;
    }

    // Rule 3: Language exact match "vi"
    if (entry.language !== "vi") {
      issues.push({
        code: "LANGUAGE_NOT_SUPPORTED",
        subject: `${subjectType}:${subjectKey}`,
        count: 1,
      });
      continue;
    }

    validCandidates.push({
      subjectType: subjectType as InterpretationSubjectType,
      subjectKey,
      bodyText: entry.bodyText as string,
    });
  }

  // Rule 4: Group duplicates
  const grouped = new Map<string, ValidEntryCandidate[]>();
  for (const candidate of validCandidates) {
    const key = `${candidate.subjectType}:${candidate.subjectKey}`;
    const list = grouped.get(key);
    if (list) {
      list.push(candidate);
    } else {
      grouped.set(key, [candidate]);
    }
  }

  const accepted = new Map<string, string>();
  const ambiguousKeys = new Set<string>();

  for (const [key, list] of grouped) {
    if (list.length > 1) {
      ambiguousKeys.add(key);
      issues.push({
        code: "DUPLICATE_SUBJECT",
        subject: key,
        count: list.length,
      });
    } else {
      accepted.set(key, list[0]!.bodyText);
    }
  }

  return { accepted, ambiguousKeys, issues };
}

export function buildInterpretationModel(
  dto: Pick<ChartResponse, "interpretations" | "interpretationVersion">,
  vm: Pick<ChartViewModel, "planets" | "angles" | "flags">,
): InterpretationModel {
  const rawIssues: RawIssue[] = [];

  // Step 1: Version normalization
  let version: string | null = null;
  if (typeof dto.interpretationVersion === "string") {
    version = dto.interpretationVersion;
  } else if (dto.interpretationVersion === null) {
    version = null;
  } else {
    version = null;
    rawIssues.push({
      code: "VERSION_INVALID",
      subject: "interpretationVersion",
      count: 1,
    });
  }

  // Step 2 & 3: Classify entries
  const {
    accepted,
    ambiguousKeys,
    issues: classificationIssues,
  } = classifyEntries(dto.interpretations);
  rawIssues.push(...classificationIssues);

  const isUnreleased =
    dto.interpretationVersion === null &&
    Array.isArray(dto.interpretations) &&
    dto.interpretations.length === 0;

  // Step 7: Degraded conditions check
  const houseDataAvailable = Boolean(vm.flags.houseDataAvailable);
  if (!houseDataAvailable) {
    rawIssues.push({
      code: "HOUSE_DATA_UNAVAILABLE",
      subject: "houses",
      count: 1,
    });
  }

  if (isUnreleased) {
    rawIssues.push({
      code: "CONTENT_NOT_PUBLISHED",
      subject: "interpretations",
      count: 1,
    });
  }

  const consumedKeys = new Set<string>();

  function resolvePart(
    subjectType: InterpretationSubjectType,
    expectedKey: string,
  ): InterpretationPart {
    const fullKey = `${subjectType}:${expectedKey}`;
    const bodyText = accepted.get(fullKey);

    if (bodyText !== undefined) {
      consumedKeys.add(fullKey);
      return { state: "available", subjectKey: expectedKey, bodyText };
    }

    if (ambiguousKeys.has(fullKey)) {
      return { state: "ambiguous", reason: "DUPLICATE_ENTRIES" };
    }

    if (isUnreleased) {
      return { state: "unavailable", reason: "CONTENT_NOT_PUBLISHED" };
    }

    rawIssues.push({
      code: "CONTENT_MISSING",
      subject: fullKey,
      count: 1,
    });
    return { state: "missing", subjectKey: expectedKey };
  }

  // Step 4 & 5: Derive subjects from VM and match with accepted entries
  const planetItems: InterpretationItem[] = [];
  let sunItem: InterpretationItem | null = null;
  let moonItem: InterpretationItem | null = null;

  for (const planetName of INTERPRETATION_PLANETS) {
    const matches = (vm.planets ?? []).filter((p) => p.key === planetName);

    if (matches.length === 0) {
      continue;
    }

    const group: InterpretationGroupId =
      planetName === "Sun" || planetName === "Moon" ? "core" : "planets";

    if (matches.length > 1) {
      rawIssues.push({
        code: "AMBIGUOUS_IDENTIFIER",
        subject: `planet:${planetName}`,
        count: matches.length,
      });

      const item: InterpretationItem = {
        id: `planet:${planetName}`,
        group,
        kind: "planet",
        subject: planetName,
        bySign: { state: "ambiguous", reason: "DUPLICATE_IDENTIFIER" },
        byHouse: { state: "ambiguous", reason: "DUPLICATE_IDENTIFIER" },
      };

      if (planetName === "Sun") {
        sunItem = item;
      } else if (planetName === "Moon") {
        moonItem = item;
      } else {
        planetItems.push(item);
      }
      continue;
    }

    const p = matches[0]!;

    // Resolve bySign
    let bySign: InterpretationPart;
    const signKey = p.sign.known
      ? buildPlanetInSignKey(planetName, p.sign.key)
      : null;
    if (signKey === null) {
      bySign = { state: "unavailable", reason: "SIGN_UNRESOLVED" };
      rawIssues.push({
        code: "IDENTIFIER_UNRESOLVED",
        subject: `planet:${planetName}.sign`,
        count: 1,
      });
    } else {
      bySign = resolvePart("PlanetInSign", signKey);
    }

    // Resolve byHouse
    let byHouse: InterpretationPart;
    if (!houseDataAvailable) {
      byHouse = { state: "unavailable", reason: "HOUSE_DATA_UNAVAILABLE" };
    } else {
      const key = buildPlanetInHouseKey(planetName, p.houseNumber);
      if (key === null) {
        byHouse = { state: "unavailable", reason: "HOUSE_NUMBER_UNRESOLVED" };
        rawIssues.push({
          code: "IDENTIFIER_UNRESOLVED",
          subject: `planet:${planetName}.house`,
          count: 1,
        });
      } else {
        byHouse = resolvePart("PlanetInHouse", key);
      }
    }

    const item: InterpretationItem = {
      id: `planet:${planetName}`,
      group,
      kind: "planet",
      subject: planetName,
      bySign,
      byHouse,
    };

    if (planetName === "Sun") {
      sunItem = item;
    } else if (planetName === "Moon") {
      moonItem = item;
    } else {
      planetItems.push(item);
    }
  }

  // Resolve Ascendant (always present as item angle:Ascendant)
  const matchingAscendants = (vm.angles ?? []).filter(
    (a) => a.key === "Ascendant",
  );

  let ascendantBySign: InterpretationPart;
  if (matchingAscendants.length === 0) {
    ascendantBySign = { state: "unavailable", reason: "ANGLE_ABSENT" };
  } else if (matchingAscendants.length > 1) {
    ascendantBySign = { state: "ambiguous", reason: "DUPLICATE_IDENTIFIER" };
    rawIssues.push({
      code: "AMBIGUOUS_IDENTIFIER",
      subject: "angle:Ascendant",
      count: matchingAscendants.length,
    });
  } else {
    const a = matchingAscendants[0]!;
    const ascKey = a.sign.known ? buildAscendantInSignKey(a.sign.key) : null;
    if (ascKey === null) {
      ascendantBySign = { state: "unavailable", reason: "SIGN_UNRESOLVED" };
      rawIssues.push({
        code: "IDENTIFIER_UNRESOLVED",
        subject: "angle:Ascendant.sign",
        count: 1,
      });
    } else {
      ascendantBySign = resolvePart("AngleInSign", ascKey);
    }
  }

  const ascendantItem: InterpretationItem = {
    id: "angle:Ascendant",
    group: "core",
    kind: "angle",
    subject: "Ascendant",
    bySign: ascendantBySign,
    byHouse: null,
  };

  // Step 6: Superfluous entries (accepted but unconsumed)
  for (const [key] of accepted) {
    if (!consumedKeys.has(key)) {
      rawIssues.push({
        code: "ENTRY_NOT_APPLICABLE",
        subject: key,
        count: 1,
      });
    }
  }

  // Step 8: Assembly & ordering
  const assembledItems: InterpretationItem[] = [];
  if (sunItem) assembledItems.push(sunItem);
  if (moonItem) assembledItems.push(moonItem);
  assembledItems.push(ascendantItem);
  for (const item of planetItems) {
    assembledItems.push(item);
  }

  const itemsById: Partial<Record<InterpretationItemId, InterpretationItem>> =
    {};
  for (const item of assembledItems) {
    itemsById[item.id] = Object.freeze({
      ...item,
      bySign: Object.freeze(item.bySign),
      byHouse: item.byHouse !== null ? Object.freeze(item.byHouse) : null,
    });
  }

  const frozenItems = Object.freeze(
    assembledItems.map((item) => itemsById[item.id]!),
  );

  const coreItemIds = frozenItems
    .filter((item) => item.group === "core")
    .map((item) => item.id);
  const planetsItemIds = frozenItems
    .filter((item) => item.group === "planets")
    .map((item) => item.id);

  const groups: InterpretationGroup[] = [];
  if (coreItemIds.length > 0) {
    groups.push(
      Object.freeze({
        id: "core" as const,
        itemIds: Object.freeze(coreItemIds),
      }),
    );
  }
  if (planetsItemIds.length > 0) {
    groups.push(
      Object.freeze({
        id: "planets" as const,
        itemIds: Object.freeze(planetsItemIds),
      }),
    );
  }

  let availableCount = 0;
  for (const item of frozenItems) {
    if (item.bySign.state === "available") {
      availableCount += 1;
    }
    if (item.byHouse !== null && item.byHouse.state === "available") {
      availableCount += 1;
    }
  }

  let status: InterpretationStatus;
  if (availableCount === 0) {
    status = "unavailable";
  } else {
    let hasDefectOrMissing = false;
    for (const item of frozenItems) {
      if (
        item.bySign.state === "missing" ||
        item.bySign.state === "ambiguous" ||
        (item.bySign.state === "unavailable" &&
          item.bySign.reason === "SIGN_UNRESOLVED")
      ) {
        hasDefectOrMissing = true;
        break;
      }
      if (item.byHouse !== null) {
        if (
          item.byHouse.state === "missing" ||
          item.byHouse.state === "ambiguous" ||
          (item.byHouse.state === "unavailable" &&
            item.byHouse.reason === "HOUSE_NUMBER_UNRESOLVED")
        ) {
          hasDefectOrMissing = true;
          break;
        }
      }
    }

    status = hasDefectOrMissing ? "partial" : "ready";
  }

  // Aggregate and sort issues
  const aggregatedIssues = new Map<
    string,
    { code: InterpretationIssueCode; subject: string; count: number }
  >();

  for (const raw of rawIssues) {
    const safeSubject =
      raw.subject.length > 80 ? raw.subject.slice(0, 80) : raw.subject;
    const aggKey = `${raw.code}::${safeSubject}`;
    const existing = aggregatedIssues.get(aggKey);
    if (existing) {
      existing.count += raw.count;
    } else {
      aggregatedIssues.set(aggKey, {
        code: raw.code,
        subject: safeSubject,
        count: raw.count,
      });
    }
  }

  const sortedIssues: InterpretationIssue[] = Array.from(
    aggregatedIssues.values(),
  )
    .sort((a, b) => {
      const idxA = ISSUE_CODE_ORDER.indexOf(a.code);
      const idxB = ISSUE_CODE_ORDER.indexOf(b.code);
      if (idxA !== idxB) {
        return idxA - idxB;
      }
      return a.subject < b.subject ? -1 : a.subject > b.subject ? 1 : 0;
    })
    .map((item) =>
      Object.freeze({
        code: item.code,
        category: getIssueCategory(item.code),
        subject: item.subject,
        count: item.count,
      }),
    );

  return Object.freeze({
    status,
    version,
    houseDataAvailable,
    items: frozenItems,
    itemsById: Object.freeze(itemsById),
    groups: Object.freeze(groups),
    availableCount,
    issues: Object.freeze(sortedIssues),
  });
}
