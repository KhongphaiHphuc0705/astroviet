/**
 * Pure domain geometry helper for Chart Wheel planet visualization.
 * Converts PlanetVM[] from ChartViewModel into a complete PlanetWheelModel
 * with true position markers, connector leaders, accessible labels, and layout tiers.
 *
 * Implements decisions:
 * - D-S45-01 (Unicode glyphs and fallback text)
 * - D-S45-02 (True position markers r: 175 -> 168, baseline circle when !hasHouses)
 * - D-S45-04 (Whole degree formatting on wheel, degree preserved in aria)
 * - D-S45-07 (Accessible text labels)
 */

import { KNOWN_PLANET_NAMES, type PlanetName } from "../api/types";

import type { PlanetKey, PlanetVM } from "./chartViewModel";
import { formatDegreeOnly } from "./format";
import {
  polarToCartesian,
  roundCoord,
  toScreenAngle,
  WHEEL_CENTER,
  WHEEL_RADII,
  type Point,
} from "./geometry";
import {
  computeLeaderLine,
  layoutPlanetLabels,
  type LabelBox,
  type LabelLayoutItem,
  type LayoutTier,
  type LeaderLineGeometry,
  type PlacedLabel,
} from "./labelLayout";

export interface PlanetRenderItem {
  id: string;
  key: PlanetKey;
  nameVi: string;
  glyph: string | null;
  fallbackText: string;
  isRetrograde: boolean;
  degreeText: string | null;
  ariaLabel: string;
  trueAngle: number;
  labelAngle: number;
  center: Point;
  box: LabelBox;
  glyphPoint: Point;
  retrogradePoint: Point | null;
  degreePoint: Point | null;
  markerInner: Point;
  markerOuter: Point;
  leader: LeaderLineGeometry | null;
}

export interface PlanetWheelModel {
  tier: LayoutTier;
  status: "ok" | "overflow";
  maxDisplacementDeg: number;
  hasHouses: boolean;
  baselineRadius: number;
  planets: PlanetRenderItem[];
}

export interface BuildPlanetWheelModelOptions {
  hasHouses?: boolean;
  forcedTier?: LayoutTier;
}

/**
 * Builds a comprehensive accessible aria-label for a planet item.
 * Format: "{nameVi}[, nghịch hành], ở {sign.labelVi}[, {degreeLabel}][, nhà {houseNumber}]"
 */
export function buildPlanetAriaLabel(planet: PlanetVM): string {
  const parts: string[] = [];

  if (planet.isRetrograde) {
    parts.push(`${planet.nameVi}, nghịch hành`);
  } else {
    parts.push(planet.nameVi);
  }

  parts.push(`ở ${planet.sign.labelVi}`);

  if (planet.degreeLabel) {
    parts.push(planet.degreeLabel);
  }

  if (planet.houseNumber !== null && planet.houseNumber !== undefined) {
    parts.push(`nhà ${planet.houseNumber}`);
  }

  return parts.join(", ");
}

/**
 * Maps PlanetVM[] to a render-ready PlanetWheelModel.
 * Preserves true position markers independent of layout label displacement.
 */
export function buildPlanetWheelModel(
  planets: readonly PlanetVM[],
  rotation: number,
  options: BuildPlanetWheelModelOptions = {},
): PlanetWheelModel {
  const hasHouses = options.hasHouses ?? true;

  if (planets.length === 0) {
    return {
      tier: "A",
      status: "ok",
      maxDisplacementDeg: 0,
      hasHouses,
      baselineRadius: WHEEL_RADII.planetMarkerOuter,
      planets: [],
    };
  }

  // Assign stable, unique ids to items handling any duplicate keys
  const keyCounts = new Map<string, number>();
  const itemsWithId = planets.map((planet, index) => {
    const count = (keyCounts.get(planet.key) ?? 0) + 1;
    keyCounts.set(planet.key, count);
    const id = count === 1 ? planet.key : `${planet.key}#${count}`;
    return { planet, id, inputIndex: index };
  });

  const layoutItems: LabelLayoutItem[] = itemsWithId.map(
    ({ planet, id, inputIndex }) => {
      const knownIndex = (KNOWN_PLANET_NAMES as readonly string[]).indexOf(
        planet.key as PlanetName,
      );
      const rank = knownIndex >= 0 ? knownIndex : Number.POSITIVE_INFINITY;
      return {
        id,
        longitude: planet.longitude,
        rank,
        hasRetrograde: planet.isRetrograde,
        degreeText: formatDegreeOnly(planet.degreeLabel),
        inputIndex,
      };
    },
  );

  const layoutResult = layoutPlanetLabels(
    layoutItems,
    rotation,
    options.forcedTier,
  );

  const placedMap = new Map<string, PlacedLabel>();
  for (const p of layoutResult.items) {
    placedMap.set(p.id, p);
  }

  const renderItems: PlanetRenderItem[] = itemsWithId.map(({ planet, id }) => {
    const placed = placedMap.get(id);

    // If layout overflowed or item not found, compute fallback coordinates from trueAngle
    const trueAngle = toScreenAngle(planet.longitude, rotation);
    const labelAngle = placed ? placed.labelAngle : trueAngle;
    const center = placed
      ? placed.center
      : polarToCartesian(
          WHEEL_CENTER,
          WHEEL_CENTER,
          layoutResult.tier === "A"
            ? WHEEL_RADII.planetLaneA
            : WHEEL_RADII.planetLaneB,
          trueAngle,
        );
    const box = placed
      ? placed.box
      : {
          x0: roundCoord(center.x - 10),
          x1: roundCoord(center.x + 10),
          y0: roundCoord(center.y - 10),
          y1: roundCoord(center.y + 10),
          width: 20,
          height: 20,
        };

    const markerOuter = polarToCartesian(
      WHEEL_CENTER,
      WHEEL_CENTER,
      WHEEL_RADII.planetMarkerOuter,
      trueAngle,
    );
    const markerInner = polarToCartesian(
      WHEEL_CENTER,
      WHEEL_CENTER,
      WHEEL_RADII.planetMarkerInner,
      trueAngle,
    );

    const leader = placed
      ? computeLeaderLine(markerInner, box, placed.displaced)
      : null;

    const fallbackText = planet.glyph === null ? planet.nameVi.slice(0, 2) : "";

    const degreeText =
      layoutResult.tier === "A" ? formatDegreeOnly(planet.degreeLabel) : null;

    const ariaLabel = buildPlanetAriaLabel(planet);

    const glyphPoint: Point = {
      x: center.x,
      y: layoutResult.tier === "A" ? roundCoord(center.y - 8) : center.y,
    };

    const retrogradePoint: Point | null = planet.isRetrograde
      ? {
          x: roundCoord(center.x + 12),
          y:
            layoutResult.tier === "A"
              ? roundCoord(center.y - 12)
              : roundCoord(center.y - 6),
        }
      : null;

    const degreePoint: Point | null =
      degreeText !== null
        ? {
            x: center.x,
            y: roundCoord(center.y + 10),
          }
        : null;

    return {
      id,
      key: planet.key,
      nameVi: planet.nameVi,
      glyph: planet.glyph,
      fallbackText,
      isRetrograde: planet.isRetrograde,
      degreeText,
      ariaLabel,
      trueAngle,
      labelAngle,
      center,
      box,
      glyphPoint,
      retrogradePoint,
      degreePoint,
      markerInner,
      markerOuter,
      leader,
    };
  });

  return {
    tier: layoutResult.tier,
    status: layoutResult.status,
    maxDisplacementDeg: layoutResult.maxDisplacementDeg,
    hasHouses,
    baselineRadius: WHEEL_RADII.planetMarkerOuter,
    planets: renderItems,
  };
}
