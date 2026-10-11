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
  readonly rawHouse: number | null;
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

export function toChartViewModel(dto: ChartResponse): ChartViewModel {
  // Step 1: Structural Validation
  if (dto === null || typeof dto !== "object") {
    throw new ChartViewModelError("DTO must be a non-null object", "dto");
  }

  if (typeof dto.id !== "string" || dto.id.length === 0) {
    throw new ChartViewModelError("Invalid or missing chart id", "id");
  }

  if (typeof dto.isHouseDataAvailable !== "boolean") {
    throw new ChartViewModelError(
      "isHouseDataAvailable must be a boolean",
      "isHouseDataAvailable",
    );
  }

  if (typeof dto.calculatedAt !== "string" || dto.calculatedAt.length === 0) {
    throw new ChartViewModelError(
      "Invalid or missing calculatedAt",
      "calculatedAt",
    );
  }

  if (typeof dto.engineVersion !== "string" || dto.engineVersion.length === 0) {
    throw new ChartViewModelError(
      "Invalid or missing engineVersion",
      "engineVersion",
    );
  }

  if (!Array.isArray(dto.planets)) {
    throw new ChartViewModelError("planets must be an array", "planets");
  }

  if (!Array.isArray(dto.houses)) {
    throw new ChartViewModelError("houses must be an array", "houses");
  }

  if (!Array.isArray(dto.angles)) {
    throw new ChartViewModelError("angles must be an array", "angles");
  }

  if (!Array.isArray(dto.aspects)) {
    throw new ChartViewModelError("aspects must be an array", "aspects");
  }

  if (!Array.isArray(dto.warnings)) {
    throw new ChartViewModelError("warnings must be an array", "warnings");
  }

  const issues: ChartIssue[] = [];

  // Step 2: Planets
  const intermediatePlanets: IntermediatePlanet[] = [];
  const seenPlanetNames = new Set<string>();

  for (let i = 0; i < dto.planets.length; i++) {
    const p = dto.planets[i];
    if (p === null || typeof p !== "object") {
      issues.push({ code: "ENTRY_DROPPED", subject: `planet:${i}` });
      continue;
    }

    const hasValidName = typeof p.name === "string" && p.name.length > 0;
    const hasValidLongitude =
      typeof p.longitude === "number" &&
      Number.isFinite(p.longitude) &&
      p.longitude >= 0 &&
      p.longitude < 360;
    const hasValidSign = typeof p.sign === "string" && p.sign.length > 0;
    const hasValidRetrograde = typeof p.isRetrograde === "boolean";

    if (
      !hasValidName ||
      !hasValidLongitude ||
      !hasValidSign ||
      !hasValidRetrograde
    ) {
      const subjectKey = hasValidName ? p.name : `${i}`;
      issues.push({ code: "ENTRY_DROPPED", subject: `planet:${subjectKey}` });
      continue;
    }

    const planetLabel = resolvePlanet(p.name);
    if (!planetLabel.known) {
      issues.push({ code: "UNKNOWN_VALUE", subject: `planet:${p.name}` });
    }

    const signLabel = resolveSign(p.sign);
    if (!signLabel.known) {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `planet:${p.name}.sign:${p.sign}`,
      });
    }

    if (seenPlanetNames.has(p.name)) {
      issues.push({ code: "DUPLICATE_ENTITY", subject: `planet:${p.name}` });
    }
    seenPlanetNames.add(p.name);

    let degreeLabel: string | null = null;
    if (
      typeof p.degreeInSign === "number" &&
      Number.isFinite(p.degreeInSign) &&
      p.degreeInSign >= 0 &&
      p.degreeInSign < 30
    ) {
      degreeLabel = formatDegreeMinute(p.degreeInSign);
    } else {
      issues.push({
        code: "VALUE_OUT_OF_RANGE",
        subject: `planet:${p.name}.degreeInSign`,
      });
    }

    const ariaLabel = p.isRetrograde
      ? `${planetLabel.labelVi}, ${RETROGRADE_LABEL_VI.toLowerCase()}`
      : planetLabel.labelVi;

    const rawHouse =
      typeof p.house === "number" || p.house === null ? p.house : null;

    intermediatePlanets.push({
      inputIndex: i,
      rawHouse,
      vm: {
        key: p.name,
        nameVi: planetLabel.labelVi,
        glyph: planetLabel.glyph,
        known: planetLabel.known,
        longitude: p.longitude,
        sign: signLabel,
        degreeLabel,
        houseNumber: null, // will be resolved in Step 3
        isRetrograde: p.isRetrograde,
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

  // Step 3: Houses & houseDataAvailable
  let effectiveHouseDataAvailable = false;
  const housesVM: HouseVM[] = [];

  const rawHouses = dto.houses;
  const validHousesList: {
    number: number;
    cuspDegree: number;
    signOnCusp: string;
    inputIndex: number;
  }[] = [];

  for (let i = 0; i < rawHouses.length; i++) {
    const h = rawHouses[i];
    if (
      h !== null &&
      typeof h === "object" &&
      typeof h.number === "number" &&
      Number.isInteger(h.number) &&
      h.number >= 1 &&
      h.number <= 12 &&
      typeof h.cuspDegree === "number" &&
      Number.isFinite(h.cuspDegree) &&
      h.cuspDegree >= 0 &&
      h.cuspDegree < 360 &&
      typeof h.signOnCusp === "string" &&
      h.signOnCusp.length > 0
    ) {
      validHousesList.push({
        number: h.number,
        cuspDegree: h.cuspDegree,
        signOnCusp: h.signOnCusp,
        inputIndex: i,
      });
    }
  }

  const has12DistinctNumbers =
    validHousesList.length === 12 &&
    rawHouses.length === 12 &&
    new Set(validHousesList.map((h) => h.number)).size === 12;

  if (dto.isHouseDataAvailable) {
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

  // Populate houseNumber on planets
  const planetsVM: PlanetVM[] = intermediatePlanets.map((item) => {
    let resolvedHouseNumber: number | null = null;
    if (effectiveHouseDataAvailable) {
      if (item.rawHouse !== null && item.rawHouse !== undefined) {
        if (
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
    }

    return {
      ...item.vm,
      houseNumber: resolvedHouseNumber,
    };
  });

  // Step 4: Angles
  const intermediateAngles: IntermediateAngle[] = [];
  const seenAngleTypes = new Set<string>();

  for (let i = 0; i < dto.angles.length; i++) {
    const a = dto.angles[i];
    if (a === null || typeof a !== "object") {
      issues.push({ code: "ENTRY_DROPPED", subject: `angle:${i}` });
      continue;
    }

    const hasValidType = typeof a.type === "string" && a.type.length > 0;
    const hasValidLongitude =
      typeof a.longitude === "number" &&
      Number.isFinite(a.longitude) &&
      a.longitude >= 0 &&
      a.longitude < 360;
    const hasValidSign = typeof a.sign === "string" && a.sign.length > 0;

    if (!hasValidType || !hasValidLongitude || !hasValidSign) {
      const subjectKey = hasValidType ? a.type : `${i}`;
      issues.push({ code: "ENTRY_DROPPED", subject: `angle:${subjectKey}` });
      continue;
    }

    const angleLabel = resolveAngle(a.type);
    if (!angleLabel.known) {
      issues.push({ code: "UNKNOWN_VALUE", subject: `angle:${a.type}` });
    }

    const signLabel = resolveSign(a.sign);
    if (!signLabel.known) {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `angle:${a.type}.sign:${a.sign}`,
      });
    }

    if (seenAngleTypes.has(a.type)) {
      issues.push({ code: "DUPLICATE_ENTITY", subject: `angle:${a.type}` });
    }
    seenAngleTypes.add(a.type);

    let degreeLabel: string | null = null;
    if (
      typeof a.degreeInSign === "number" &&
      Number.isFinite(a.degreeInSign) &&
      a.degreeInSign >= 0 &&
      a.degreeInSign < 30
    ) {
      degreeLabel = formatDegreeMinute(a.degreeInSign);
    } else {
      issues.push({
        code: "VALUE_OUT_OF_RANGE",
        subject: `angle:${a.type}.degreeInSign`,
      });
    }

    intermediateAngles.push({
      inputIndex: i,
      vm: {
        key: a.type,
        known: angleLabel.known,
        shortLabel: angleLabel.shortLabel,
        labelVi: angleLabel.labelVi,
        ariaLabel: angleLabel.ariaLabel,
        longitude: a.longitude,
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

  // Step 5: Aspects
  const intermediateAspects: IntermediateAspect[] = [];
  const aspectKeyCounts = new Map<string, number>();

  for (let i = 0; i < dto.aspects.length; i++) {
    const asp = dto.aspects[i];
    if (asp === null || typeof asp !== "object") {
      issues.push({ code: "ENTRY_DROPPED", subject: `aspect:${i}` });
      continue;
    }

    const hasValidPlanetA =
      typeof asp.planetA === "string" && asp.planetA.length > 0;
    const hasValidPlanetB =
      typeof asp.planetB === "string" && asp.planetB.length > 0;
    const hasValidType =
      typeof asp.aspectType === "string" && asp.aspectType.length > 0;
    const hasValidOrb =
      typeof asp.orb === "number" && Number.isFinite(asp.orb) && asp.orb >= 0;
    const hasValidApplying = typeof asp.isApplying === "boolean";

    if (
      !hasValidPlanetA ||
      !hasValidPlanetB ||
      !hasValidType ||
      !hasValidOrb ||
      !hasValidApplying
    ) {
      const subjectKey = `${asp?.planetA ?? ""}:${asp?.aspectType ?? ""}:${asp?.planetB ?? ""}`;
      issues.push({ code: "ENTRY_DROPPED", subject: `aspect:${subjectKey}` });
      continue;
    }

    const planetALabel = resolvePlanet(asp.planetA);
    if (!planetALabel.known) {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `aspect.planetA:${asp.planetA}`,
      });
    }

    const planetBLabel = resolvePlanet(asp.planetB);
    if (!planetBLabel.known) {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `aspect.planetB:${asp.planetB}`,
      });
    }

    const typeLabel = resolveAspectType(asp.aspectType);
    if (!typeLabel.known) {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `aspect.type:${asp.aspectType}`,
      });
    }

    const natureLabel = resolveAspectNature(asp.nature);
    if (!natureLabel.known) {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `aspect.nature:${String(asp.nature)}`,
      });
    }

    if (!keptPlanetKeys.has(asp.planetA)) {
      issues.push({
        code: "ASPECT_ENDPOINT_MISSING",
        subject: `aspect:${asp.planetA}:${asp.aspectType}:${asp.planetB}.missing:${asp.planetA}`,
      });
    }
    if (!keptPlanetKeys.has(asp.planetB)) {
      issues.push({
        code: "ASPECT_ENDPOINT_MISSING",
        subject: `aspect:${asp.planetA}:${asp.aspectType}:${asp.planetB}.missing:${asp.planetB}`,
      });
    }

    const baseKey = `${asp.planetA}:${asp.aspectType}:${asp.planetB}`;
    const count = (aspectKeyCounts.get(baseKey) ?? 0) + 1;
    aspectKeyCounts.set(baseKey, count);
    const key = count === 1 ? baseKey : `${baseKey}#${count}`;
    if (count > 1) {
      issues.push({ code: "DUPLICATE_ENTITY", subject: `aspect:${baseKey}` });
    }

    const orbLabel = formatDegreeMinute(asp.orb);
    const applyingLabelVi = asp.isApplying
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
        orb: asp.orb,
        orbLabel,
        isApplying: asp.isApplying,
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

  const aspectsVM = intermediateAspects.map((item) => item.vm);

  // Step 6: Warnings
  const warningsVM: ChartWarningVM[] = [];
  for (const w of dto.warnings) {
    if (w === null || typeof w !== "object") continue;

    let severity: "info" | "warning" = "warning";
    if (w.severity === "info" || w.severity === "warning") {
      severity = w.severity;
    } else {
      issues.push({
        code: "UNKNOWN_VALUE",
        subject: `warning:${String(w.code)}.severity:${String(w.severity)}`,
      });
    }

    const warningLabel = resolveWarningCode(w.code);
    warningsVM.push({
      code: String(w.code),
      severity,
      labelVi: warningLabel.labelVi,
    });
  }

  // Step 7: Meta
  const houseSystemLabel = resolveHouseSystem(dto.houseSystem);
  if (!houseSystemLabel.known) {
    issues.push({
      code: "UNKNOWN_VALUE",
      subject: `houseSystem:${dto.houseSystem}`,
    });
  }

  // Step 8: Flags
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
