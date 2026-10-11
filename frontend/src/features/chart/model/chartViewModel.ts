import type { ChartResponse } from "../api/types";
import {
  KNOWN_ANGLE_TYPES,
  KNOWN_ASPECT_TYPES,
  KNOWN_PLANET_NAMES,
} from "../api/types";

import { formatDegreeMinute } from "./format";
import type { GlyphLabel, NatureLabel } from "./labels";
import {
  APPLYING_LABEL_VI,
  formatHouseAriaLabel,
  formatHouseLabel,
  resolveAngle,
  resolveAspectNature,
  resolveAspectType,
  resolveHouseSystem,
  resolvePlanet,
  resolveSign,
  resolveWarningCode,
  RETROGRADE_LABEL_VI,
  SEPARATING_LABEL_VI,
} from "./labels";

export type PlanetKey = string;
export type AspectKey = string;

export interface PlanetVM {
  key: PlanetKey;
  nameVi: string;
  glyph: string | null;
  known: boolean;
  longitude: number;
  sign: GlyphLabel;
  degreeLabel: string | null;
  houseNumber: number | null;
  isRetrograde: boolean;
  ariaLabel: string;
}

export interface HouseVM {
  number: number;
  labelVi: string;
  ariaLabel: string;
  cuspLongitude: number;
  sign: GlyphLabel;
  degreeLabel: string | null;
}

export interface AngleVM {
  key: string;
  known: boolean;
  shortLabel: string | null;
  labelVi: string;
  ariaLabel: string;
  longitude: number;
  sign: GlyphLabel;
  degreeLabel: string | null;
}

export interface AspectVM {
  key: AspectKey;
  planetA: GlyphLabel;
  planetB: GlyphLabel;
  type: GlyphLabel;
  nature: NatureLabel;
  orb: number;
  orbLabel: string | null;
  isApplying: boolean;
  applyingLabelVi: string;
}

export interface ChartWarningVM {
  code: string;
  severity: "info" | "warning";
  labelVi: string | null;
}

export type ChartIssueCode =
  | "UNKNOWN_VALUE"
  | "VALUE_OUT_OF_RANGE"
  | "ENTRY_DROPPED"
  | "CORE_BODY_MISSING"
  | "HOUSE_FLAG_CONTRADICTION"
  | "DUPLICATE_ENTITY"
  | "ASPECT_ENDPOINT_MISSING";

export interface ChartIssue {
  code: ChartIssueCode;
  subject: string;
}

export interface ChartViewModel {
  meta: {
    id: string;
    houseSystem: GlyphLabel;
    calculatedAt: string;
    engineVersion: string;
  };
  flags: {
    houseDataAvailable: boolean;
    hasAngles: boolean;
    partialData: boolean;
    ascendantLongitude: number | null;
  };
  planets: PlanetVM[];
  houses: HouseVM[];
  angles: AngleVM[];
  aspects: AspectVM[];
  warnings: ChartWarningVM[];
  issues: ChartIssue[];
}

export class ChartViewModelError extends Error {
  readonly code = "MALFORMED_CHART_RESPONSE" as const;
  readonly path?: string;

  constructor(message: string, path?: string) {
    super(message);
    this.name = "ChartViewModelError";
    this.path = path;
  }
}

const CORE_BODIES = [
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

const PLANET_ORDER_MAP = new Map<string, number>(
  KNOWN_PLANET_NAMES.map((name, idx) => [name, idx]),
);

const ANGLE_ORDER_MAP = new Map<string, number>(
  KNOWN_ANGLE_TYPES.map((type, idx) => [type, idx]),
);

const ASPECT_TYPE_ORDER_MAP = new Map<string, number>(
  KNOWN_ASPECT_TYPES.map((type, idx) => [type, idx]),
);

const PARTIAL_DATA_CODES = new Set<ChartIssueCode>([
  "ENTRY_DROPPED",
  "CORE_BODY_MISSING",
  "HOUSE_FLAG_CONTRADICTION",
]);

interface IntermediatePlanet {
  readonly inputIndex: number;
  readonly vm: PlanetVM;
  readonly rawHouse: unknown;
}

interface IntermediateAngle {
  readonly inputIndex: number;
  readonly vm: AngleVM;
}

interface IntermediateAspect {
  readonly inputIndex: number;
  readonly vm: AspectVM;
}

function compareRank(
  keyA: string,
  keyB: string,
  orderMap: Map<string, number>,
): number {
  const rankA = orderMap.has(keyA)
    ? (orderMap.get(keyA) as number)
    : Number.POSITIVE_INFINITY;
  const rankB = orderMap.has(keyB)
    ? (orderMap.get(keyB) as number)
    : Number.POSITIVE_INFINITY;

  if (rankA !== rankB) {
    return rankA - rankB;
  }

  if (rankA === Number.POSITIVE_INFINITY) {
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
  }

  return 0;
}

function validateStructure(dto: unknown): asserts dto is ChartResponse {
  if (dto === null || typeof dto !== "object") {
    throw new ChartViewModelError("DTO must be a non-null object", "dto");
  }

  const candidate = dto as Record<string, unknown>;

  if (typeof candidate.id !== "string" || candidate.id.length === 0) {
    throw new ChartViewModelError("Invalid or missing chart id", "id");
  }

  if (typeof candidate.isHouseDataAvailable !== "boolean") {
    throw new ChartViewModelError(
      "isHouseDataAvailable must be a boolean",
      "isHouseDataAvailable",
    );
  }

  if (
    typeof candidate.calculatedAt !== "string" ||
    candidate.calculatedAt.length === 0
  ) {
    throw new ChartViewModelError(
      "Invalid or missing calculatedAt",
      "calculatedAt",
    );
  }

  if (
    typeof candidate.engineVersion !== "string" ||
    candidate.engineVersion.length === 0
  ) {
    throw new ChartViewModelError(
      "Invalid or missing engineVersion",
      "engineVersion",
    );
  }

  if (!Array.isArray(candidate.planets)) {
    throw new ChartViewModelError("planets must be an array", "planets");
  }

  if (!Array.isArray(candidate.houses)) {
    throw new ChartViewModelError("houses must be an array", "houses");
  }

  if (!Array.isArray(candidate.angles)) {
    throw new ChartViewModelError("angles must be an array", "angles");
  }

  if (!Array.isArray(candidate.aspects)) {
    throw new ChartViewModelError("aspects must be an array", "aspects");
  }

  if (!Array.isArray(candidate.warnings)) {
    throw new ChartViewModelError("warnings must be an array", "warnings");
  }
}

function buildPlanets(
  rawPlanets: unknown[],
  issues: ChartIssue[],
): {
  intermediatePlanets: IntermediatePlanet[];
  keptPlanetKeys: Set<string>;
} {
  const intermediatePlanets: IntermediatePlanet[] = [];
  const seenPlanetNames = new Set<string>();

  for (let i = 0; i < rawPlanets.length; i++) {
    const p = rawPlanets[i];
    if (p === null || typeof p !== "object") {
      issues.push({ code: "ENTRY_DROPPED", subject: `planet:${i}` });
      continue;
    }

    const candidate = p as Record<string, unknown>;
    const hasValidName =
      typeof candidate.name === "string" && candidate.name.length > 0;
    const hasValidLongitude =
      typeof candidate.longitude === "number" &&
      Number.isFinite(candidate.longitude) &&
      candidate.longitude >= 0 &&
      candidate.longitude < 360;
    const hasValidSign =
      typeof candidate.sign === "string" && candidate.sign.length > 0;
    const hasValidRetrograde = typeof candidate.isRetrograde === "boolean";

    if (
      !hasValidName ||
      !hasValidLongitude ||
      !hasValidSign ||
      !hasValidRetrograde
    ) {
      const subjectKey = hasValidName ? (candidate.name as string) : `${i}`;
      issues.push({ code: "ENTRY_DROPPED", subject: `planet:${subjectKey}` });
      continue;
    }

    const planetName = candidate.name as string;
    const longitude = candidate.longitude as number;
    const signName = candidate.sign as string;
    const isRetrograde = candidate.isRetrograde as boolean;

    const planetLabel = resolvePlanet(planetName);
    if (!planetLabel.known) {
      issues.push({ code: "UNKNOWN_VALUE", subject: `planet:${planetName}` });
    }

    const signLabel = resolveSign(signName);
    if (!signLabel.known) {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `planet:${planetName}.sign:${signName}`,
      });
    }

    if (seenPlanetNames.has(planetName)) {
      issues.push({
        code: "DUPLICATE_ENTITY",
        subject: `planet:${planetName}`,
      });
    }
    seenPlanetNames.add(planetName);

    let degreeLabel: string | null = null;
    if (
      typeof candidate.degreeInSign === "number" &&
      Number.isFinite(candidate.degreeInSign) &&
      candidate.degreeInSign >= 0 &&
      candidate.degreeInSign < 30
    ) {
      degreeLabel = formatDegreeMinute(candidate.degreeInSign);
    } else {
      issues.push({
        code: "VALUE_OUT_OF_RANGE",
        subject: `planet:${planetName}.degreeInSign`,
      });
    }

    const ariaLabel = isRetrograde
      ? `${planetLabel.labelVi}, ${RETROGRADE_LABEL_VI.toLowerCase()}`
      : planetLabel.labelVi;

    intermediatePlanets.push({
      inputIndex: i,
      rawHouse: candidate.house,
      vm: {
        key: planetName,
        nameVi: planetLabel.labelVi,
        glyph: planetLabel.glyph,
        known: planetLabel.known,
        longitude,
        sign: signLabel,
        degreeLabel,
        houseNumber: null,
        isRetrograde,
        ariaLabel,
      },
    });
  }

  intermediatePlanets.sort((a, b) => {
    const diff = compareRank(a.vm.key, b.vm.key, PLANET_ORDER_MAP);
    if (diff !== 0) return diff;
    return a.inputIndex - b.inputIndex;
  });

  const keptPlanetKeys = new Set(intermediatePlanets.map((p) => p.vm.key));
  for (const core of CORE_BODIES) {
    if (!keptPlanetKeys.has(core)) {
      issues.push({ code: "CORE_BODY_MISSING", subject: `planet:${core}` });
    }
  }

  return { intermediatePlanets, keptPlanetKeys };
}

function buildHouses(
  rawHouses: unknown[],
  isHouseDataAvailable: boolean,
  issues: ChartIssue[],
): {
  housesVM: HouseVM[];
  effectiveHouseDataAvailable: boolean;
} {
  let effectiveHouseDataAvailable = false;
  const housesVM: HouseVM[] = [];

  const validHousesList: {
    number: number;
    cuspDegree: number;
    signOnCusp: string;
    inputIndex: number;
  }[] = [];

  for (let i = 0; i < rawHouses.length; i++) {
    const h = rawHouses[i];
    if (h !== null && typeof h === "object") {
      const candidate = h as Record<string, unknown>;
      if (
        typeof candidate.number === "number" &&
        Number.isInteger(candidate.number) &&
        candidate.number >= 1 &&
        candidate.number <= 12 &&
        typeof candidate.cuspDegree === "number" &&
        Number.isFinite(candidate.cuspDegree) &&
        candidate.cuspDegree >= 0 &&
        candidate.cuspDegree < 360 &&
        typeof candidate.signOnCusp === "string" &&
        candidate.signOnCusp.length > 0
      ) {
        validHousesList.push({
          number: candidate.number,
          cuspDegree: candidate.cuspDegree,
          signOnCusp: candidate.signOnCusp,
          inputIndex: i,
        });
      }
    }
  }

  const has12DistinctNumbers =
    validHousesList.length === 12 &&
    rawHouses.length === 12 &&
    new Set(validHousesList.map((h) => h.number)).size === 12;

  if (isHouseDataAvailable) {
    if (has12DistinctNumbers) {
      effectiveHouseDataAvailable = true;
      validHousesList.sort((a, b) => a.number - b.number);

      for (const h of validHousesList) {
        const sign = resolveSign(h.signOnCusp);
        if (!sign.known) {
          issues.push({
            code: "UNKNOWN_VALUE",
            subject: `house:${h.number}.sign:${h.signOnCusp}`,
          });
        }

        const degreeLabel = formatDegreeMinute(h.cuspDegree % 30);
        housesVM.push({
          number: h.number,
          labelVi: formatHouseLabel(h.number),
          ariaLabel: formatHouseAriaLabel(h.number),
          cuspLongitude: h.cuspDegree,
          sign,
          degreeLabel,
        });
      }
    } else {
      effectiveHouseDataAvailable = false;
      issues.push({ code: "HOUSE_FLAG_CONTRADICTION", subject: "houses" });
    }
  } else {
    if (rawHouses.length > 0) {
      effectiveHouseDataAvailable = false;
      issues.push({ code: "HOUSE_FLAG_CONTRADICTION", subject: "houses" });
    } else {
      effectiveHouseDataAvailable = false;
    }
  }

  return { housesVM, effectiveHouseDataAvailable };
}

function resolvePlanetHouseNumbers(
  intermediatePlanets: IntermediatePlanet[],
  effectiveHouseDataAvailable: boolean,
  issues: ChartIssue[],
): PlanetVM[] {
  return intermediatePlanets.map((item) => {
    let resolvedHouseNumber: number | null = null;
    if (effectiveHouseDataAvailable) {
      if (item.rawHouse !== null && item.rawHouse !== undefined) {
        if (
          typeof item.rawHouse === "number" &&
          Number.isInteger(item.rawHouse) &&
          item.rawHouse >= 1 &&
          item.rawHouse <= 12
        ) {
          resolvedHouseNumber = item.rawHouse;
        } else {
          issues.push({
            code: "VALUE_OUT_OF_RANGE",
            subject: `planet:${item.vm.key}.house`,
          });
        }
      }
    } else {
      if (item.rawHouse !== null && item.rawHouse !== undefined) {
        issues.push({
          code: "VALUE_OUT_OF_RANGE",
          subject: `planet:${item.vm.key}.house`,
        });
      }
    }

    return {
      ...item.vm,
      houseNumber: resolvedHouseNumber,
    };
  });
}

function buildAngles(
  rawAngles: unknown[],
  issues: ChartIssue[],
): {
  anglesVM: AngleVM[];
  hasAngles: boolean;
  ascendantLongitude: number | null;
} {
  const intermediateAngles: IntermediateAngle[] = [];
  const seenAngleTypes = new Set<string>();

  for (let i = 0; i < rawAngles.length; i++) {
    const a = rawAngles[i];
    if (a === null || typeof a !== "object") {
      issues.push({ code: "ENTRY_DROPPED", subject: `angle:${i}` });
      continue;
    }

    const candidate = a as Record<string, unknown>;
    const hasValidType =
      typeof candidate.type === "string" && candidate.type.length > 0;
    const hasValidLongitude =
      typeof candidate.longitude === "number" &&
      Number.isFinite(candidate.longitude) &&
      candidate.longitude >= 0 &&
      candidate.longitude < 360;
    const hasValidSign =
      typeof candidate.sign === "string" && candidate.sign.length > 0;

    if (!hasValidType || !hasValidLongitude || !hasValidSign) {
      const subjectKey = hasValidType ? (candidate.type as string) : `${i}`;
      issues.push({ code: "ENTRY_DROPPED", subject: `angle:${subjectKey}` });
      continue;
    }

    const angleType = candidate.type as string;
    const longitude = candidate.longitude as number;
    const signName = candidate.sign as string;

    const angleLabel = resolveAngle(angleType);
    if (!angleLabel.known) {
      issues.push({ code: "UNKNOWN_VALUE", subject: `angle:${angleType}` });
    }

    const signLabel = resolveSign(signName);
    if (!signLabel.known) {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `angle:${angleType}.sign:${signName}`,
      });
    }

    if (seenAngleTypes.has(angleType)) {
      issues.push({ code: "DUPLICATE_ENTITY", subject: `angle:${angleType}` });
    }
    seenAngleTypes.add(angleType);

    let degreeLabel: string | null = null;
    if (
      typeof candidate.degreeInSign === "number" &&
      Number.isFinite(candidate.degreeInSign) &&
      candidate.degreeInSign >= 0 &&
      candidate.degreeInSign < 30
    ) {
      degreeLabel = formatDegreeMinute(candidate.degreeInSign);
    } else {
      issues.push({
        code: "VALUE_OUT_OF_RANGE",
        subject: `angle:${angleType}.degreeInSign`,
      });
    }

    intermediateAngles.push({
      inputIndex: i,
      vm: {
        key: angleType,
        known: angleLabel.known,
        shortLabel: angleLabel.shortLabel,
        labelVi: angleLabel.labelVi,
        ariaLabel: angleLabel.ariaLabel,
        longitude,
        sign: signLabel,
        degreeLabel,
      },
    });
  }

  intermediateAngles.sort((a, b) => {
    const diff = compareRank(a.vm.key, b.vm.key, ANGLE_ORDER_MAP);
    if (diff !== 0) return diff;
    return a.inputIndex - b.inputIndex;
  });

  const anglesVM = intermediateAngles.map((item) => item.vm);
  const hasAngles = anglesVM.length > 0;
  const ascendantAngle = anglesVM.find((a) => a.key === "Ascendant");
  const ascendantLongitude = ascendantAngle ? ascendantAngle.longitude : null;

  return { anglesVM, hasAngles, ascendantLongitude };
}

function buildAspects(
  rawAspects: unknown[],
  keptPlanetKeys: Set<string>,
  issues: ChartIssue[],
): AspectVM[] {
  const intermediateAspects: IntermediateAspect[] = [];
  const aspectKeyCounts = new Map<string, number>();

  for (let i = 0; i < rawAspects.length; i++) {
    const asp = rawAspects[i];
    if (asp === null || typeof asp !== "object") {
      issues.push({ code: "ENTRY_DROPPED", subject: `aspect:${i}` });
      continue;
    }

    const candidate = asp as Record<string, unknown>;
    const hasValidPlanetA =
      typeof candidate.planetA === "string" && candidate.planetA.length > 0;
    const hasValidPlanetB =
      typeof candidate.planetB === "string" && candidate.planetB.length > 0;
    const hasValidType =
      typeof candidate.aspectType === "string" &&
      candidate.aspectType.length > 0;
    const hasValidOrb =
      typeof candidate.orb === "number" &&
      Number.isFinite(candidate.orb) &&
      candidate.orb >= 0;
    const hasValidApplying = typeof candidate.isApplying === "boolean";

    if (
      !hasValidPlanetA ||
      !hasValidPlanetB ||
      !hasValidType ||
      !hasValidOrb ||
      !hasValidApplying
    ) {
      const subjectKey = `${String(candidate.planetA ?? "")}:${String(candidate.aspectType ?? "")}:${String(candidate.planetB ?? "")}`;
      issues.push({ code: "ENTRY_DROPPED", subject: `aspect:${subjectKey}` });
      continue;
    }

    const planetAName = candidate.planetA as string;
    const planetBName = candidate.planetB as string;
    const aspectTypeName = candidate.aspectType as string;
    const orb = candidate.orb as number;
    const isApplying = candidate.isApplying as boolean;
    const rawNature = candidate.nature;

    const planetALabel = resolvePlanet(planetAName);
    if (!planetALabel.known) {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `aspect.planetA:${planetAName}`,
      });
    }

    const planetBLabel = resolvePlanet(planetBName);
    if (!planetBLabel.known) {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `aspect.planetB:${planetBName}`,
      });
    }

    const typeLabel = resolveAspectType(aspectTypeName);
    if (!typeLabel.known) {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `aspect.type:${aspectTypeName}`,
      });
    }

    const natureLabel = resolveAspectNature(rawNature);
    if (!natureLabel.known) {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `aspect.nature:${String(rawNature)}`,
      });
    }

    if (!keptPlanetKeys.has(planetAName)) {
      issues.push({
        code: "ASPECT_ENDPOINT_MISSING",
        subject: `aspect:${planetAName}:${aspectTypeName}:${planetBName}.missing:${planetAName}`,
      });
    }
    if (!keptPlanetKeys.has(planetBName)) {
      issues.push({
        code: "ASPECT_ENDPOINT_MISSING",
        subject: `aspect:${planetAName}:${aspectTypeName}:${planetBName}.missing:${planetBName}`,
      });
    }

    const baseKey = `${planetAName}:${aspectTypeName}:${planetBName}`;
    const count = (aspectKeyCounts.get(baseKey) ?? 0) + 1;
    aspectKeyCounts.set(baseKey, count);
    const key = count === 1 ? baseKey : `${baseKey}#${count}`;
    if (count > 1) {
      issues.push({ code: "DUPLICATE_ENTITY", subject: `aspect:${baseKey}` });
    }

    const orbLabel = formatDegreeMinute(orb);
    const applyingLabelVi = isApplying
      ? APPLYING_LABEL_VI
      : SEPARATING_LABEL_VI;

    intermediateAspects.push({
      inputIndex: i,
      vm: {
        key,
        planetA: planetALabel,
        planetB: planetBLabel,
        type: typeLabel,
        nature: natureLabel,
        orb,
        orbLabel,
        isApplying,
        applyingLabelVi,
      },
    });
  }

  intermediateAspects.sort((a, b) => {
    // 1. orb ascending
    if (a.vm.orb !== b.vm.orb) {
      return a.vm.orb - b.vm.orb;
    }

    // 2. planetA canonical index
    const planetAComparison = compareRank(
      a.vm.planetA.key,
      b.vm.planetA.key,
      PLANET_ORDER_MAP,
    );
    if (planetAComparison !== 0) {
      return planetAComparison;
    }

    // 3. planetB canonical index
    const planetBComparison = compareRank(
      a.vm.planetB.key,
      b.vm.planetB.key,
      PLANET_ORDER_MAP,
    );
    if (planetBComparison !== 0) {
      return planetBComparison;
    }

    // 4. aspectType canonical index
    const typeComparison = compareRank(
      a.vm.type.key,
      b.vm.type.key,
      ASPECT_TYPE_ORDER_MAP,
    );
    if (typeComparison !== 0) {
      return typeComparison;
    }

    // 5. stable tie-break
    return a.inputIndex - b.inputIndex;
  });

  return intermediateAspects.map((item) => item.vm);
}

function buildWarnings(
  rawWarnings: unknown[],
  issues: ChartIssue[],
): ChartWarningVM[] {
  const warningsVM: ChartWarningVM[] = [];
  for (let i = 0; i < rawWarnings.length; i++) {
    const w = rawWarnings[i];
    if (w === null || typeof w !== "object") {
      issues.push({ code: "ENTRY_DROPPED", subject: `warning:${i}` });
      continue;
    }

    const candidate = w as Record<string, unknown>;
    if (typeof candidate.code !== "string" || candidate.code.length === 0) {
      issues.push({ code: "ENTRY_DROPPED", subject: `warning:${i}` });
      continue;
    }

    let severity: "info" | "warning" = "warning";
    if (candidate.severity === "info" || candidate.severity === "warning") {
      severity = candidate.severity;
    } else {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `warning:${candidate.code}.severity:${String(candidate.severity)}`,
      });
    }

    const warningLabel = resolveWarningCode(candidate.code);
    warningsVM.push({
      code: candidate.code,
      severity,
      labelVi: warningLabel.labelVi,
    });
  }
  return warningsVM;
}

export function toChartViewModel(dto: ChartResponse): ChartViewModel {
  validateStructure(dto);

  const issues: ChartIssue[] = [];

  const { intermediatePlanets, keptPlanetKeys } = buildPlanets(
    dto.planets,
    issues,
  );
  const { housesVM, effectiveHouseDataAvailable } = buildHouses(
    dto.houses,
    dto.isHouseDataAvailable,
    issues,
  );
  const planetsVM = resolvePlanetHouseNumbers(
    intermediatePlanets,
    effectiveHouseDataAvailable,
    issues,
  );
  const { anglesVM, hasAngles, ascendantLongitude } = buildAngles(
    dto.angles,
    issues,
  );
  const aspectsVM = buildAspects(dto.aspects, keptPlanetKeys, issues);
  const warningsVM = buildWarnings(dto.warnings, issues);

  const houseSystemLabel = resolveHouseSystem(dto.houseSystem);
  if (!houseSystemLabel.known) {
    issues.push({
      code: "UNKNOWN_VALUE",
      subject: `houseSystem:${dto.houseSystem}`,
    });
  }

  const partialData = issues.some((issue) =>
    PARTIAL_DATA_CODES.has(issue.code),
  );

  return {
    meta: {
      id: dto.id,
      houseSystem: houseSystemLabel,
      calculatedAt: dto.calculatedAt,
      engineVersion: dto.engineVersion,
    },
    flags: {
      houseDataAvailable: effectiveHouseDataAvailable,
      hasAngles,
      partialData,
      ascendantLongitude,
    },
    planets: planetsVM,
    houses: housesVM,
    angles: anglesVM,
    aspects: aspectsVM,
    warnings: warningsVM,
    issues,
  };
}
