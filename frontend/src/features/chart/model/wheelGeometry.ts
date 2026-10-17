import { KNOWN_ZODIAC_SIGNS } from "../api/types";

import type { ChartViewModel } from "./chartViewModel";
import {
  arcPath,
  polarToCartesian,
  sectorMidAngle,
  toScreenAngle,
  WHEEL_CENTER,
  WHEEL_RADII,
} from "./geometry";
import { resolveSign } from "./labels";

export class WheelGeometryError extends Error {
  readonly code: "INVALID_WHEEL_INPUT";

  constructor(message: string) {
    super(message);
    this.name = "WheelGeometryError";
    this.code = "INVALID_WHEEL_INPUT";
  }
}

export interface WheelSignCell {
  key: string;
  labelVi: string;
  glyph: string | null;
  startLongitude: number;
  path: string;
  boundary: { x1: number; y1: number; x2: number; y2: number };
  glyphPoint: { x: number; y: number };
}

export interface WheelTick {
  longitude: number;
  kind: "major" | "minor";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface WheelHouseSpoke {
  number: number;
  cusp: { x1: number; y1: number; x2: number; y2: number };
  labelPoint: { x: number; y: number };
}

export interface WheelAngleMarker {
  key: "Ascendant" | "Midheaven" | "Descendant" | "ImumCoeli";
  shortLabel: string;
  ariaLabel: string;
  line: { x1: number; y1: number; x2: number; y2: number };
  labelPoint: { x: number; y: number };
}

export interface WheelGeometry {
  rotation: number;
  hasHouses: boolean;
  signs: WheelSignCell[];
  ticks: WheelTick[];
  houses: WheelHouseSpoke[] | null;
  angles: WheelAngleMarker[];
}

const TICK_STEP_DEG = 5;
const MAJOR_TICK_MODULO = 30;
const TICK_R_MAJOR_INNER = 211; // 225 -> 211 (length 14)
const TICK_R_MINOR_INNER = 219; // 225 -> 219 (length 6)
const HOUSE_LABEL_RADIUS = 195; // (215 + 175) / 2
const ZODIAC_GLYPH_RADIUS = 242.5; // (260 + 225) / 2

const SUPPORTED_ANGLES = new Set<string>([
  "Ascendant",
  "Midheaven",
  "Descendant",
  "ImumCoeli",
]);

const DEFAULT_ANGLE_SHORT_LABELS: Record<string, string> = {
  Ascendant: "ASC",
  Midheaven: "MC",
  Descendant: "DSC",
  ImumCoeli: "IC",
};

/**
 * Builds the geometric data model required to render the Chart Wheel SVG.
 * Accepts a ChartViewModel and returns deterministic coordinate structures.
 */
export function buildWheelGeometry(vm: ChartViewModel): WheelGeometry {
  const rotation = vm.flags.ascendantLongitude ?? 0;
  const hasHouses = vm.flags.houseDataAvailable;

  // Contract verification: when houseDataAvailable is true, exactly 12 unique houses (1-12) must be present.
  if (hasHouses) {
    if (vm.houses.length !== 12) {
      throw new WheelGeometryError(
        `Expected 12 houses when houseDataAvailable is true, got ${vm.houses.length}`,
      );
    }
    const numbers = new Set(vm.houses.map((h) => h.number));
    if (numbers.size !== 12) {
      throw new WheelGeometryError(
        "House numbers must be unique and contain all numbers from 1 to 12",
      );
    }
    for (let i = 1; i <= 12; i++) {
      if (!numbers.has(i)) {
        throw new WheelGeometryError(
          `Missing house number ${i} in houses list`,
        );
      }
    }
  }

  // 1. Build 12 zodiac sign cells
  const signs: WheelSignCell[] = KNOWN_ZODIAC_SIGNS.map((signKey, k) => {
    const signMeta = resolveSign(signKey);
    const startLongitude = k * 30;
    const startAngle = toScreenAngle(startLongitude, rotation);
    const path = arcPath(
      WHEEL_CENTER,
      WHEEL_CENTER,
      WHEEL_RADII.signOuter,
      WHEEL_RADII.signInner,
      startAngle,
      30,
    );

    const pInner = polarToCartesian(
      WHEEL_CENTER,
      WHEEL_CENTER,
      WHEEL_RADII.signInner,
      startAngle,
    );
    const pOuter = polarToCartesian(
      WHEEL_CENTER,
      WHEEL_CENTER,
      WHEEL_RADII.signOuter,
      startAngle,
    );

    const midLongitude = startLongitude + 15;
    const midAngle = toScreenAngle(midLongitude, rotation);
    const glyphPoint = polarToCartesian(
      WHEEL_CENTER,
      WHEEL_CENTER,
      ZODIAC_GLYPH_RADIUS,
      midAngle,
    );

    return {
      key: signKey,
      labelVi: signMeta.labelVi,
      glyph: signMeta.glyph,
      startLongitude,
      path,
      boundary: {
        x1: pInner.x,
        y1: pInner.y,
        x2: pOuter.x,
        y2: pOuter.y,
      },
      glyphPoint,
    };
  });

  // 2. Build 72 degree division ticks (every 5 degrees, major at multiples of 30)
  const ticksCount = 360 / TICK_STEP_DEG;
  const ticks: WheelTick[] = Array.from({ length: ticksCount }, (_, j) => {
    const longitude = j * TICK_STEP_DEG;
    const kind = longitude % MAJOR_TICK_MODULO === 0 ? "major" : "minor";
    const theta = toScreenAngle(longitude, rotation);
    const rInner = kind === "major" ? TICK_R_MAJOR_INNER : TICK_R_MINOR_INNER;

    const pOuter = polarToCartesian(
      WHEEL_CENTER,
      WHEEL_CENTER,
      WHEEL_RADII.signInner,
      theta,
    );
    const pInner = polarToCartesian(WHEEL_CENTER, WHEEL_CENTER, rInner, theta);

    return {
      longitude,
      kind,
      x1: pOuter.x,
      y1: pOuter.y,
      x2: pInner.x,
      y2: pInner.y,
    };
  });

  // 3. Build house spokes (when house data available)
  let houses: WheelHouseSpoke[] | null = null;
  if (hasHouses) {
    const sortedHouses = [...vm.houses].sort((a, b) => a.number - b.number);
    houses = sortedHouses.map((currHouse, i) => {
      const nextHouse = sortedHouses[(i + 1) % 12]!;
      const cuspTheta = toScreenAngle(currHouse.cuspLongitude, rotation);

      const p1 = polarToCartesian(
        WHEEL_CENTER,
        WHEEL_CENTER,
        WHEEL_RADII.houseInner,
        cuspTheta,
      );
      const p2 = polarToCartesian(
        WHEEL_CENTER,
        WHEEL_CENTER,
        WHEEL_RADII.signInner,
        cuspTheta,
      );

      const midLong = sectorMidAngle(
        currHouse.cuspLongitude,
        nextHouse.cuspLongitude,
      );
      const midTheta = toScreenAngle(midLong, rotation);
      const labelPoint = polarToCartesian(
        WHEEL_CENTER,
        WHEEL_CENTER,
        HOUSE_LABEL_RADIUS,
        midTheta,
      );

      return {
        number: currHouse.number,
        cusp: {
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
        },
        labelPoint,
      };
    });
  }

  // 4. Build recognized angle markers (Ascendant, Midheaven, Descendant, ImumCoeli)
  const angles: WheelAngleMarker[] = vm.angles
    .filter((a) => a.known && SUPPORTED_ANGLES.has(a.key))
    .map((angle) => {
      const theta = toScreenAngle(angle.longitude, rotation);
      const p1 = polarToCartesian(
        WHEEL_CENTER,
        WHEEL_CENTER,
        WHEEL_RADII.houseInner,
        theta,
      );
      const p2 = polarToCartesian(
        WHEEL_CENTER,
        WHEEL_CENTER,
        WHEEL_RADII.signOuter,
        theta,
      );
      const labelPoint = polarToCartesian(
        WHEEL_CENTER,
        WHEEL_CENTER,
        WHEEL_RADII.angleLabel,
        theta,
      );

      return {
        key: angle.key as
          "Ascendant" | "Midheaven" | "Descendant" | "ImumCoeli",
        shortLabel:
          angle.shortLabel ??
          DEFAULT_ANGLE_SHORT_LABELS[angle.key] ??
          angle.key,
        ariaLabel: angle.ariaLabel,
        line: {
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
        },
        labelPoint,
      };
    });

  return {
    rotation,
    hasHouses,
    signs,
    ticks,
    houses,
    angles,
  };
}
