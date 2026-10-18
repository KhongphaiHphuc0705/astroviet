import { KNOWN_ASPECT_TYPES, type AspectType } from "../api/types";

import type { AspectVM, PlanetVM } from "./chartViewModel";
import {
  polarToCartesian,
  roundCoord,
  toScreenAngle,
  WHEEL_CENTER,
  WHEEL_RADII,
  type Point,
} from "./geometry";
import type { NatureTone } from "./labels";

export type AspectShape = "chord" | "arc" | "dot";

export interface AspectLineStyleSpec {
  shape: "chord" | "arc";
  dasharray: string | null;
  width: number;
  linecap: "butt" | "round";
  patternLabelVi: string;
}

/**
 * Standard visual styles per aspect type.
 * Values confirmed in Decision D-M6-05:
 * Width: 1.5 (Level 1), 2.5 (Level 2), 3.0 (Level 3)
 * Dash: null (solid), "1 5" (dots), "8 5" (dashes), "16 6" (long dashes)
 * Linecap: "round" for dots and Conjunction, "butt" for chords.
 */
export const ASPECT_LINE_STYLES: Record<AspectType, AspectLineStyleSpec> = {
  Trine: {
    shape: "chord",
    dasharray: null,
    width: 1.5,
    linecap: "butt",
    patternLabelVi: "Nét liền, mảnh",
  },
  Sextile: {
    shape: "chord",
    dasharray: "1 5",
    width: 1.5,
    linecap: "round",
    patternLabelVi: "Nét chấm, mảnh",
  },
  Square: {
    shape: "chord",
    dasharray: "8 5",
    width: 2.5,
    linecap: "butt",
    patternLabelVi: "Nét đứt, vừa",
  },
  Opposition: {
    shape: "chord",
    dasharray: "16 6",
    width: 2.5,
    linecap: "butt",
    patternLabelVi: "Nét gạch dài, vừa",
  },
  Conjunction: {
    shape: "arc",
    dasharray: null,
    width: 3,
    linecap: "round",
    patternLabelVi: "Cung liền, dày",
  },
};

export interface AspectLineGeometry {
  key: string;
  typeKey: string;
  natureTone: NatureTone;
  natureKey: string;
  shape: AspectShape;
  start: Point;
  end: Point;
  d: string | null;
  separationDeg: number;
  style: AspectLineStyleSpec;
  orb: number;
}

export type AspectSkipReason =
  | "ENDPOINT_MISSING"
  | "ENDPOINT_AMBIGUOUS"
  | "NON_FINITE"
  | "SELF_REFERENCE"
  | "UNSUPPORTED_TYPE"
  | "DUPLICATE";

export interface SkippedAspect {
  key: string;
  reason: AspectSkipReason;
}

export interface AspectLegendEntry {
  typeKey: string;
  typeLabelVi: string;
  natureKey: string;
  natureLabelVi: string;
  natureTone: NatureTone;
  style: AspectLineStyleSpec;
}

export interface AspectGeometryResult {
  lines: AspectLineGeometry[];
  skipped: SkippedAspect[];
  legend: AspectLegendEntry[];
  ringRadius: number;
}

/**
 * Calculates the shortest signed angular difference (b - a) in degrees,
 * constrained to the range (-180, 180].
 */
export function shortestSignedAngleDeg(aDeg: number, bDeg: number): number {
  const diff = ((((bDeg - aDeg + 540) % 360) + 360) % 360) - 180;
  return diff === -180 ? 180 : diff;
}

/**
 * Pure mathematical builder for aspect wheel geometries.
 * Computes SVG-ready chords and arcs along the aspect ring (r = 108).
 * Never mutates inputs; strictly deterministic.
 */
export function buildAspectGeometry(
  aspects: readonly AspectVM[],
  planets: readonly PlanetVM[],
  rotation: number,
): AspectGeometryResult {
  if (!Number.isFinite(rotation)) {
    throw new RangeError("rotation must be a finite number");
  }

  const R = WHEEL_RADII.aspectRing;
  const lines: AspectLineGeometry[] = [];
  const skipped: SkippedAspect[] = [];

  // 1. Build planet lookup and detect duplicate entity keys
  const planetKeyCounts = new Map<string, number>();
  const planetMap = new Map<string, PlanetVM>();

  for (const p of planets) {
    const k = p.key;
    planetKeyCounts.set(k, (planetKeyCounts.get(k) ?? 0) + 1);
    if (!planetMap.has(k)) {
      planetMap.set(k, p);
    }
  }

  // 2. Process each aspect
  const seenAspectPairs = new Set<string>();
  const drawnLegendMap = new Map<string, AspectLegendEntry>();

  for (const aspect of aspects) {
    const key = aspect.key;
    const keyA = aspect.planetA.key;
    const keyB = aspect.planetB.key;

    // Self-reference check
    if (keyA === keyB) {
      skipped.push({ key, reason: "SELF_REFERENCE" });
      continue;
    }

    // Supported aspect type check
    const typeKey = aspect.type.key as AspectType;
    const style = ASPECT_LINE_STYLES[typeKey];
    if (!style) {
      skipped.push({ key, reason: "UNSUPPORTED_TYPE" });
      continue;
    }

    // Ambiguous endpoints check
    if (
      (planetKeyCounts.get(keyA) ?? 0) > 1 ||
      (planetKeyCounts.get(keyB) ?? 0) > 1
    ) {
      skipped.push({ key, reason: "ENDPOINT_AMBIGUOUS" });
      continue;
    }

    // Missing endpoints check
    const planetA = planetMap.get(keyA);
    const planetB = planetMap.get(keyB);
    if (!planetA || !planetB) {
      skipped.push({ key, reason: "ENDPOINT_MISSING" });
      continue;
    }

    // Finite coordinates check
    if (
      !Number.isFinite(planetA.longitude) ||
      !Number.isFinite(planetB.longitude)
    ) {
      skipped.push({ key, reason: "NON_FINITE" });
      continue;
    }

    // Unordered pair duplicate check
    const sortedPair = [keyA, keyB].sort().join(":");
    const aspectPairKey = `${typeKey}:${sortedPair}`;
    if (seenAspectPairs.has(aspectPairKey)) {
      skipped.push({ key, reason: "DUPLICATE" });
      continue;
    }
    seenAspectPairs.add(aspectPairKey);

    // Compute screen angles at true planetary longitudes
    const thetaA = toScreenAngle(planetA.longitude, rotation);
    const thetaB = toScreenAngle(planetB.longitude, rotation);

    const start = polarToCartesian(WHEEL_CENTER, WHEEL_CENTER, R, thetaA);
    const end = polarToCartesian(WHEEL_CENTER, WHEEL_CENTER, R, thetaB);

    start.x = roundCoord(start.x);
    start.y = roundCoord(start.y);
    end.x = roundCoord(end.x);
    end.y = roundCoord(end.y);

    const dSigned = shortestSignedAngleDeg(thetaA, thetaB);
    const separationDeg = roundCoord(Math.abs(dSigned));

    let shape: AspectShape = style.shape;
    let d: string | null = null;

    if (style.shape === "arc") {
      // Degenerate conjunction (endpoints identical within tolerance)
      if (separationDeg < 1e-4) {
        shape = "dot";
        d = null;
      } else {
        shape = "arc";
        // In SVG coordinates with inverted y, counter-clockwise is sweep = 0, clockwise is sweep = 1.
        // dSigned > 0 means increasing screen angle (counter-clockwise) -> sweep = 0.
        // dSigned < 0 means decreasing screen angle (clockwise) -> sweep = 1.
        const sweep = dSigned > 0 ? 0 : 1;
        d = `M ${start.x} ${start.y} A ${R} ${R} 0 0 ${sweep} ${end.x} ${end.y}`;
      }
    } else {
      shape = "chord";
      d = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    }

    const natureTone: NatureTone =
      aspect.nature.tone === "harmonious" ||
      aspect.nature.tone === "tense" ||
      aspect.nature.tone === "neutral"
        ? aspect.nature.tone
        : "unknown";

    lines.push({
      key,
      typeKey,
      natureTone,
      natureKey: aspect.nature.key,
      shape,
      start,
      end,
      d,
      separationDeg,
      style,
      orb: aspect.orb,
    });

    if (!drawnLegendMap.has(typeKey)) {
      drawnLegendMap.set(typeKey, {
        typeKey,
        typeLabelVi: aspect.type.labelVi,
        natureKey: aspect.nature.key,
        natureLabelVi: aspect.nature.labelVi,
        natureTone,
        style,
      });
    }
  }

  // 3. Sort lines by orb descending (tight aspects drawn last on top), tie-broken by key ascending
  lines.sort((a, b) => b.orb - a.orb || a.key.localeCompare(b.key));

  // 4. Construct legend in canonical KNOWN_ASPECT_TYPES order
  const legend: AspectLegendEntry[] = [];
  for (const canonicalType of KNOWN_ASPECT_TYPES) {
    const entry = drawnLegendMap.get(canonicalType);
    if (entry) {
      legend.push(entry);
    }
  }

  return {
    lines,
    skipped,
    legend,
    ringRadius: R,
  };
}
