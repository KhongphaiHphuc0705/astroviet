/**
 * Pure, deterministic label layout engine for planet labels on the Chart Wheel.
 * Independent of React, DOM, SVG, and ChartViewModel.
 *
 * Implements cluster-merge spreading algorithm with circular 0°/360° boundary handling,
 * orientation-aware footprints, AABB collision checks, and 2-tier fallback (D-S45-05, D-S45-09).
 */

import {
  normalizeLongitude,
  type Point,
  polarToCartesian,
  roundCoord,
  toScreenAngle,
  WHEEL_CENTER,
  WHEEL_RADII,
} from "./geometry";

export interface LabelLayoutItem {
  id: string;
  longitude: number;
  rank: number;
  hasRetrograde: boolean;
  degreeText: string | null;
  inputIndex: number;
}

export type LayoutTier = "A" | "B";

export interface LabelBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
  height: number;
}

export interface PlacedLabel {
  id: string;
  trueAngle: number;
  labelAngle: number;
  center: Point;
  box: LabelBox;
  displaced: boolean;
  displacementDeg: number;
}

export interface LeaderLineGeometry {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LabelLayoutResult {
  status: "ok" | "overflow";
  tier: LayoutTier;
  items: PlacedLabel[];
  maxDisplacementDeg: number;
}

export const PLANET_TEXT_SIZES = {
  glyph: 18,
  retrograde: 16,
  degree: 16,
} as const;

export const LABEL_METRICS = {
  glyphWidth: 1.1 * PLANET_TEXT_SIZES.glyph, // 19.8
  retrogradeWidth: 1.0 * PLANET_TEXT_SIZES.retrograde, // 16.0
  rxGap: 2,
  lineGap: 2,
  pad: 2,
  minLeaderGap: 4,
} as const;

export const MAX_DISPLACEMENT_A_DEG = 30.0;
export const LEADER_MIN_GAP = 4;

/**
 * Returns the shortest angular distance between two angles in [0, 360).
 */
export function circularDistance(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new RangeError("Angles must be finite numbers");
  }
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

/**
 * Computes box dimensions (width, height) for a given item and layout tier.
 */
export function computeBoxDimensions(
  item: { hasRetrograde: boolean; degreeText: string | null },
  tier: LayoutTier,
): { width: number; height: number } {
  const topWidth =
    LABEL_METRICS.glyphWidth +
    (item.hasRetrograde
      ? LABEL_METRICS.retrogradeWidth + LABEL_METRICS.rxGap
      : 0);

  if (tier === "A") {
    const degChars = item.degreeText ? item.degreeText.length : 0;
    const degWidth = degChars * 0.6 * PLANET_TEXT_SIZES.degree;
    const width = roundCoord(Math.max(topWidth, degWidth));
    const height =
      PLANET_TEXT_SIZES.glyph +
      LABEL_METRICS.lineGap +
      PLANET_TEXT_SIZES.degree; // 18 + 2 + 16 = 36
    return { width, height };
  }

  // Tier B
  const width = roundCoord(topWidth);
  const height = PLANET_TEXT_SIZES.glyph; // 18
  return { width, height };
}

/**
 * Computes tangential angular footprint (in degrees) of an AABB at a given screen angle and radius.
 */
export function computeFootprint(
  width: number,
  height: number,
  screenAngleDeg: number,
  laneRadius: number,
): number {
  const rad = (screenAngleDeg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const projected = width * sin + height * cos + 2 * LABEL_METRICS.pad;
  return (projected / laneRadius) * (180 / Math.PI);
}

/**
 * Computes leader line geometry from the inner tip of a marker (r=168)
 * to the boundary of the label box expanded by 1 unit.
 * Returns null if displaced is false or if the gap is <= LEADER_MIN_GAP.
 */
export function computeLeaderLine(
  markerInner: Point,
  box: LabelBox,
  displaced: boolean,
): LeaderLineGeometry | null {
  if (!displaced) {
    return null;
  }

  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;

  // Box expanded by 1 unit on all sides
  const xMin = box.x0 - 1;
  const xMax = box.x1 + 1;
  const yMin = box.y0 - 1;
  const yMax = box.y1 + 1;

  const dx = cx - markerInner.x;
  const dy = cy - markerInner.y;

  let tEnter = 0;

  if (dx !== 0) {
    const tx1 = (xMin - markerInner.x) / dx;
    const tx2 = (xMax - markerInner.x) / dx;
    tEnter = Math.max(tEnter, Math.min(tx1, tx2));
  }

  if (dy !== 0) {
    const ty1 = (yMin - markerInner.y) / dy;
    const ty2 = (yMax - markerInner.y) / dy;
    tEnter = Math.max(tEnter, Math.min(ty1, ty2));
  }

  const x2 = roundCoord(markerInner.x + tEnter * dx);
  const y2 = roundCoord(markerInner.y + tEnter * dy);

  const gap = Math.hypot(x2 - markerInner.x, y2 - markerInner.y);
  if (gap <= LEADER_MIN_GAP) {
    return null;
  }

  return {
    x1: roundCoord(markerInner.x),
    y1: roundCoord(markerInner.y),
    x2,
    y2,
  };
}

/**
 * Validates independent geometry checks on placed labels:
 * 1. No pair of boxes (expanded by PAD) overlap (AABB).
 * 2. All 4 corners of all boxes lie within [planetZoneInner, planetMarkerOuter].
 * 3. Cyclic order of labelAngle matches cyclic order of trueAngle.
 */
function validatePlacement(placed: PlacedLabel[]): boolean {
  const N = placed.length;
  if (N <= 1) {
    return true;
  }

  // 1. AABB Non-Overlap check with PAD = 2
  for (let i = 0; i < N; i++) {
    const a = placed[i]!.box;
    const boxA = {
      x0: a.x0 - LABEL_METRICS.pad,
      x1: a.x1 + LABEL_METRICS.pad,
      y0: a.y0 - LABEL_METRICS.pad,
      y1: a.y1 + LABEL_METRICS.pad,
    };
    for (let j = i + 1; j < N; j++) {
      const b = placed[j]!.box;
      const boxB = {
        x0: b.x0 - LABEL_METRICS.pad,
        x1: b.x1 + LABEL_METRICS.pad,
        y0: b.y0 - LABEL_METRICS.pad,
        y1: b.y1 + LABEL_METRICS.pad,
      };

      const xOverlap = boxA.x0 < boxB.x1 && boxA.x1 > boxB.x0;
      const yOverlap = boxA.y0 < boxB.y1 && boxA.y1 > boxB.y0;
      if (xOverlap && yOverlap) {
        return false;
      }
    }
  }

  // 2. Ring containment check: all 4 corners in [planetZoneInner, planetMarkerOuter]
  const rMin = WHEEL_RADII.planetZoneInner - 1e-3;
  const rMax = WHEEL_RADII.planetMarkerOuter + 1e-3;

  for (let i = 0; i < N; i++) {
    const box = placed[i]!.box;
    const corners = [
      { x: box.x0, y: box.y0 },
      { x: box.x1, y: box.y0 },
      { x: box.x0, y: box.y1 },
      { x: box.x1, y: box.y1 },
    ];
    for (const c of corners) {
      const dist = Math.hypot(c.x - WHEEL_CENTER, c.y - WHEEL_CENTER);
      if (dist < rMin || dist > rMax) {
        return false;
      }
    }
  }

  // 3. Cyclic order check
  for (let i = 0; i < N; i++) {
    const nextIdx = (i + 1) % N;
    const diff = normalizeLongitude(
      placed[nextIdx]!.labelAngle - placed[i]!.labelAngle,
    );
    if (diff <= 1e-6 || diff >= 360 - 1e-6) {
      return false;
    }
  }

  return true;
}

/**
 * Runs layout on a single tier (either A or B).
 */
export function layoutForSingleTier(
  rawItems: LabelLayoutItem[],
  rotation: number,
  tier: LayoutTier,
): LabelLayoutResult {
  if (!Number.isFinite(rotation)) {
    throw new RangeError("rotation must be a finite number");
  }

  // Validate and normalize items
  const items: LabelLayoutItem[] = rawItems.map((item) => {
    if (!Number.isFinite(item.longitude)) {
      throw new RangeError(`Item ${item.id} longitude must be a finite number`);
    }
    return {
      ...item,
      longitude: normalizeLongitude(item.longitude),
      degreeText: tier === "A" ? item.degreeText : null,
    };
  });

  if (items.length === 0) {
    return { status: "ok", tier, items: [], maxDisplacementDeg: 0 };
  }

  const laneRadius =
    tier === "A" ? WHEEL_RADII.planetLaneA : WHEEL_RADII.planetLaneB;

  if (items.length === 1) {
    const item = items[0]!;
    const trueAngle = toScreenAngle(item.longitude, rotation);
    const boxDim = computeBoxDimensions(item, tier);
    const center = polarToCartesian(
      WHEEL_CENTER,
      WHEEL_CENTER,
      laneRadius,
      trueAngle,
    );
    const box: LabelBox = {
      x0: roundCoord(center.x - boxDim.width / 2),
      x1: roundCoord(center.x + boxDim.width / 2),
      y0: roundCoord(center.y - boxDim.height / 2),
      y1: roundCoord(center.y + boxDim.height / 2),
      width: boxDim.width,
      height: boxDim.height,
    };
    return {
      status: "ok",
      tier,
      items: [
        {
          id: item.id,
          trueAngle,
          labelAngle: trueAngle,
          center,
          box,
          displaced: false,
          displacementDeg: 0,
        },
      ],
      maxDisplacementDeg: 0,
    };
  }

  // Canonical sort order of items: (longitude ↑, rank ↑, id ↑, inputIndex ↑)
  const canonicalItems = [...items].sort((a, b) => {
    if (Math.abs(a.longitude - b.longitude) > 1e-9) {
      return a.longitude - b.longitude;
    }
    const rankA = Number.isFinite(a.rank) ? a.rank : Number.POSITIVE_INFINITY;
    const rankB = Number.isFinite(b.rank) ? b.rank : Number.POSITIVE_INFINITY;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    const idCmp = a.id.localeCompare(b.id);
    if (idCmp !== 0) {
      return idCmp;
    }
    return a.inputIndex - b.inputIndex;
  });

  const N = canonicalItems.length;

  // Compute trueAngles for all sorted items
  const angles = canonicalItems.map((item) =>
    toScreenAngle(item.longitude, rotation),
  );

  // Find circular order of angles
  const circularOrder = angles.map((_, i) => i);
  circularOrder.sort((ia, ib) => {
    const angA = angles[ia]!;
    const angB = angles[ib]!;
    if (Math.abs(angA - angB) > 1e-9) {
      return angA - angB;
    }
    const itemA = canonicalItems[ia]!;
    const itemB = canonicalItems[ib]!;
    if (itemA.rank !== itemB.rank) {
      return itemA.rank - itemB.rank;
    }
    const idCmp = itemA.id.localeCompare(itemB.id);
    if (idCmp !== 0) {
      return idCmp;
    }
    return itemA.inputIndex - itemB.inputIndex;
  });

  // Find largest gap between adjacent items on the circle
  let maxGap = -1;
  let cutIndex = 0;
  for (let i = 0; i < N; i++) {
    const currAngle = angles[circularOrder[i]!]!;
    const nextAngle = angles[circularOrder[(i + 1) % N]!]!;
    let gap = normalizeLongitude(nextAngle - currAngle);
    if (gap === 0 && i === N - 1) {
      gap = 360;
    }
    if (gap > maxGap) {
      maxGap = gap;
      cutIndex = i;
    }
  }

  // Unwrap sequence starting from (cutIndex + 1) % N
  const startIdx = (cutIndex + 1) % N;
  interface UnwrappedItem {
    canonicalIndex: number;
    trueAngle: number;
    u: number;
    boxDim: { width: number; height: number };
    f: number;
  }

  const unwrapped: UnwrappedItem[] = [];
  let prevAngle = angles[circularOrder[startIdx]!]!;
  let currU = prevAngle;

  for (let j = 0; j < N; j++) {
    const cIdx = circularOrder[(startIdx + j) % N]!;
    const item = canonicalItems[cIdx]!;
    const ang = angles[cIdx]!;
    if (j > 0) {
      const dAng = normalizeLongitude(ang - prevAngle);
      currU += dAng;
      prevAngle = ang;
    }
    const boxDim = computeBoxDimensions(item, tier);
    const f = computeFootprint(boxDim.width, boxDim.height, ang, laneRadius);
    unwrapped.push({
      canonicalIndex: cIdx,
      trueAngle: ang,
      u: currU,
      boxDim,
      f,
    });
  }

  // Total footprint check
  const totalFootprint = unwrapped.reduce((sum, item) => sum + item.f, 0);
  if (totalFootprint >= 360 - 1e-6) {
    return { status: "overflow", tier, items: [], maxDisplacementDeg: 360 };
  }

  // Cluster-merge algorithm
  interface Cluster {
    itemIndices: number[]; // indices in unwrapped array
    d: number[];
    span: number;
    qStart: number;
  }

  const clusters: Cluster[] = unwrapped.map((item, idx) => ({
    itemIndices: [idx],
    d: [0],
    span: 0,
    qStart: item.u,
  }));

  function optimalQStart(itemIndices: number[], d: number[]): number {
    let sum = 0;
    for (let m = 0; m < itemIndices.length; m++) {
      sum += unwrapped[itemIndices[m]!]!.u - d[m]!;
    }
    return sum / itemIndices.length;
  }

  let merged = true;
  let iterations = 0;
  const maxIterations = N * 4 + 20;

  while (merged && iterations++ < maxIterations) {
    merged = false;

    // Linear merges between adjacent clusters
    for (let i = 0; i < clusters.length - 1; i++) {
      const c1 = clusters[i]!;
      const c2 = clusters[i + 1]!;
      const last1 = c1.itemIndices[c1.itemIndices.length - 1]!;
      const first2 = c2.itemIndices[0]!;
      const requiredSep = (unwrapped[last1]!.f + unwrapped[first2]!.f) / 2;
      const qLast1 = c1.qStart + c1.span;
      const qFirst2 = c2.qStart;

      if (qFirst2 - qLast1 < requiredSep - 1e-9) {
        const newItemIndices = [...c1.itemIndices, ...c2.itemIndices];
        const offset = c1.span + requiredSep;
        const newD = [...c1.d, ...c2.d.map((val) => val + offset)];
        const newQStart = optimalQStart(newItemIndices, newD);
        const newSpan = newD[newD.length - 1]!;

        clusters.splice(i, 2, {
          itemIndices: newItemIndices,
          d: newD,
          span: newSpan,
          qStart: newQStart,
        });
        merged = true;
        break;
      }
    }

    // Circular wrap check between last and first cluster
    if (!merged && clusters.length > 1) {
      const lastC = clusters[clusters.length - 1]!;
      const firstC = clusters[0]!;
      const lastItem = lastC.itemIndices[lastC.itemIndices.length - 1]!;
      const firstItem = firstC.itemIndices[0]!;
      const requiredSep =
        (unwrapped[lastItem]!.f + unwrapped[firstItem]!.f) / 2;
      const qLast = lastC.qStart + lastC.span;
      const qFirstWrapped = firstC.qStart + 360;

      if (qFirstWrapped - qLast < requiredSep - 1e-9) {
        const offset = lastC.span + requiredSep;
        const newItemIndices = [...lastC.itemIndices, ...firstC.itemIndices];
        const newD = [...lastC.d, ...firstC.d.map((val) => val + offset)];

        let sum = 0;
        for (let m = 0; m < lastC.itemIndices.length; m++) {
          sum += unwrapped[lastC.itemIndices[m]!]!.u - newD[m]!;
        }
        for (let m = 0; m < firstC.itemIndices.length; m++) {
          const idx = firstC.itemIndices[m]!;
          sum += unwrapped[idx]!.u + 360 - newD[lastC.itemIndices.length + m]!;
        }
        const newQStart = sum / newItemIndices.length;
        const newSpan = newD[newD.length - 1]!;

        clusters.splice(clusters.length - 1, 1);
        clusters.splice(0, 1, {
          itemIndices: newItemIndices,
          d: newD,
          span: newSpan,
          qStart: newQStart,
        });
        merged = true;
      }
    }
  }

  // Collect target unwrapped angles
  const targetQs: number[] = new Array(N);
  for (const c of clusters) {
    for (let m = 0; m < c.itemIndices.length; m++) {
      targetQs[c.itemIndices[m]!] = c.qStart + c.d[m]!;
    }
  }

  // Helper to construct placed label from index and angle
  function makePlaced(uIdx: number, q: number): PlacedLabel {
    const unwrappedItem = unwrapped[uIdx]!;
    const labelAngle = normalizeLongitude(q);
    const trueAngle = unwrappedItem.trueAngle;
    const center = polarToCartesian(
      WHEEL_CENTER,
      WHEEL_CENTER,
      laneRadius,
      labelAngle,
    );
    const box: LabelBox = {
      x0: roundCoord(center.x - unwrappedItem.boxDim.width / 2),
      x1: roundCoord(center.x + unwrappedItem.boxDim.width / 2),
      y0: roundCoord(center.y - unwrappedItem.boxDim.height / 2),
      y1: roundCoord(center.y + unwrappedItem.boxDim.height / 2),
      width: unwrappedItem.boxDim.width,
      height: unwrappedItem.boxDim.height,
    };
    const displacementDeg = circularDistance(labelAngle, trueAngle);
    const displaced = displacementDeg > 1e-4;

    return {
      id: canonicalItems[unwrappedItem.canonicalIndex]!.id,
      trueAngle,
      labelAngle,
      center,
      box,
      displaced,
      displacementDeg: roundCoord(displacementDeg),
    };
  }

  const placedUnwrapped = targetQs.map((q, idx) => makePlaced(idx, q));

  // Fine-tuning relaxation: resolve any residual AABB overlap between adjacent items
  for (let pass = 0; pass < 20; pass++) {
    let adjusted = false;
    for (let i = 0; i < N - 1; i++) {
      const a = placedUnwrapped[i]!.box;
      const b = placedUnwrapped[i + 1]!.box;
      const boxA = {
        x0: a.x0 - LABEL_METRICS.pad,
        x1: a.x1 + LABEL_METRICS.pad,
        y0: a.y0 - LABEL_METRICS.pad,
        y1: a.y1 + LABEL_METRICS.pad,
      };
      const boxB = {
        x0: b.x0 - LABEL_METRICS.pad,
        x1: b.x1 + LABEL_METRICS.pad,
        y0: b.y0 - LABEL_METRICS.pad,
        y1: b.y1 + LABEL_METRICS.pad,
      };

      const xOverlap = boxA.x0 < boxB.x1 && boxA.x1 > boxB.x0;
      const yOverlap = boxA.y0 < boxB.y1 && boxA.y1 > boxB.y0;

      if (xOverlap && yOverlap) {
        const xDepth = Math.min(boxA.x1 - boxB.x0, boxB.x1 - boxA.x0);
        const yDepth = Math.min(boxA.y1 - boxB.y0, boxB.y1 - boxA.y0);
        const depth = Math.min(xDepth, yDepth);
        const push = Math.max(
          (depth / laneRadius) * (180 / Math.PI) + 0.1,
          0.4,
        );
        const qCurrA = targetQs[i]!;
        const qCurrB = targetQs[i + 1]!;
        targetQs[i] = qCurrA - push / 2;
        targetQs[i + 1] = qCurrB + push / 2;
        placedUnwrapped[i] = makePlaced(i, targetQs[i]!);
        placedUnwrapped[i + 1] = makePlaced(i + 1, targetQs[i + 1]!);
        adjusted = true;
      }
    }
    if (!adjusted) {
      break;
    }
  }

  // Validate geometry constraints on placed labels
  const isValid = validatePlacement(placedUnwrapped);
  if (!isValid) {
    return {
      status: "overflow",
      tier,
      items: placedUnwrapped,
      maxDisplacementDeg: 360,
    };
  }

  // Sort output items canonically by original canonical order
  const placedMap = new Map<string, PlacedLabel>();
  for (const p of placedUnwrapped) {
    placedMap.set(p.id, p);
  }

  const finalItems: PlacedLabel[] = canonicalItems.map((item) => {
    return placedMap.get(item.id)!;
  });

  const maxDisplacementDeg = roundCoord(
    Math.max(0, ...finalItems.map((p) => p.displacementDeg)),
  );

  return {
    status: "ok",
    tier,
    items: finalItems,
    maxDisplacementDeg,
  };
}

/**
 * Main layout entry point for Chart Wheel planet labels.
 * Deterministically chooses Tier A if max displacement <= 30° and all validation checks pass.
 * Otherwise falls back to Tier B.
 */
export function layoutPlanetLabels(
  items: LabelLayoutItem[],
  rotation: number,
  forcedTier?: LayoutTier,
): LabelLayoutResult {
  if (forcedTier) {
    return layoutForSingleTier(items, rotation, forcedTier);
  }

  // 1. Try Tier A (glyph + ℞ + degree)
  const resultA = layoutForSingleTier(items, rotation, "A");
  if (
    resultA.status === "ok" &&
    resultA.maxDisplacementDeg <= MAX_DISPLACEMENT_A_DEG + 1e-6
  ) {
    return resultA;
  }

  // 2. Fallback to Tier B (glyph + ℞ only, no degree line on wheel)
  const resultB = layoutForSingleTier(items, rotation, "B");
  if (resultB.status === "ok") {
    return resultB;
  }

  // 3. Overflow if both tiers fail
  return {
    status: "overflow",
    tier: "B",
    items: resultB.items,
    maxDisplacementDeg: resultB.maxDisplacementDeg,
  };
}
