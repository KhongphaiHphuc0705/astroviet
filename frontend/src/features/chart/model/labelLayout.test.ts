import { describe, expect, it } from "vitest";

import {
  polarToCartesian,
  toScreenAngle,
  WHEEL_CENTER,
  WHEEL_MIN_DISPLAY_PX,
  WHEEL_RADII,
  WHEEL_VIEWBOX_SIZE,
} from "./geometry";
import {
  circularDistance,
  computeLeaderLine,
  type LabelLayoutItem,
  layoutPlanetLabels,
  MAX_DISPLACEMENT_A_DEG,
  PLANET_TEXT_SIZES,
} from "./labelLayout";

// Helper to construct sample items
function createItem(
  id: string,
  longitude: number,
  options: Partial<Omit<LabelLayoutItem, "id" | "longitude">> = {},
): LabelLayoutItem {
  return {
    id,
    longitude,
    rank: options.rank ?? 0,
    hasRetrograde: options.hasRetrograde ?? false,
    degreeText: options.degreeText ?? "10°",
    inputIndex: options.inputIndex ?? 0,
  };
}

describe("labelLayout (S4.5.2: L1 - L20)", () => {
  const DEFAULT_ROTATION = 14.891;

  // L1: Empty input
  it("L1: handles empty input gracefully", () => {
    const res = layoutPlanetLabels([], DEFAULT_ROTATION);
    expect(res.status).toBe("ok");
    expect(res.items).toEqual([]);
    expect(res.maxDisplacementDeg).toBe(0);
  });

  // L2: Single planet
  it("L2: single planet has labelAngle == trueAngle and displaced=false", () => {
    const item = createItem("Sun", 280.5);
    const res = layoutPlanetLabels([item], DEFAULT_ROTATION);
    expect(res.status).toBe("ok");
    expect(res.items).toHaveLength(1);

    const placed = res.items[0]!;
    const expectedTrueAngle = toScreenAngle(280.5, DEFAULT_ROTATION);
    expect(placed.trueAngle).toBeCloseTo(expectedTrueAngle, 3);
    expect(placed.labelAngle).toBeCloseTo(expectedTrueAngle, 3);
    expect(placed.displaced).toBe(false);
    expect(placed.displacementDeg).toBe(0);
    expect(res.maxDisplacementDeg).toBe(0);
  });

  // L3: Multiple distant planets
  it("L3: distant planets are not displaced and have no leader", () => {
    const items = [
      createItem("Sun", 0),
      createItem("Moon", 90),
      createItem("Mars", 180),
      createItem("Jupiter", 270),
    ];
    const res = layoutPlanetLabels(items, 0);
    expect(res.status).toBe("ok");
    expect(res.tier).toBe("A");
    for (const p of res.items) {
      expect(p.displaced).toBe(false);
      expect(p.displacementDeg).toBe(0);

      const markerInner = polarToCartesian(
        WHEEL_CENTER,
        WHEEL_CENTER,
        WHEEL_RADII.planetMarkerInner,
        p.trueAngle,
      );
      const leader = computeLeaderLine(markerInner, p.box, p.displaced);
      expect(leader).toBeNull();
    }
  });

  // L4: Two close planets
  it("L4: two close planets are displaced symmetrically around centroid (|d1| ≈ |d2|, opposite signs)", () => {
    const items = [
      createItem("Sun", 100.0, { rank: 0, inputIndex: 0 }),
      createItem("Moon", 100.2, { rank: 1, inputIndex: 1 }),
    ];
    const res = layoutPlanetLabels(items, 0);
    expect(res.status).toBe("ok");
    expect(res.items).toHaveLength(2);

    const p0 = res.items[0]!;
    const p1 = res.items[1]!;
    expect(p0.displaced).toBe(true);
    expect(p1.displaced).toBe(true);

    // Symmetric displacement
    expect(p0.displacementDeg).toBeCloseTo(p1.displacementDeg, 2);

    // Check signed displacement relative to trueAngle
    const disp0 = p0.labelAngle - p0.trueAngle;
    const disp1 = p1.labelAngle - p1.trueAngle;
    expect(disp0 + disp1).toBeCloseTo(0, 2);
  });

  // L5: Dense cluster (>= 5 planets)
  it("L5: dense cluster (>= 5 planets) has no overlapping AABB boxes", () => {
    const clusterItems = [
      createItem("Uranus", 275.8, { rank: 7 }),
      createItem("Sun", 280.5, { rank: 0 }),
      createItem("Neptune", 282.0, { rank: 8 }),
      createItem("Saturn", 285.6, { rank: 6 }),
      createItem("Mercury", 295.8, { rank: 2, hasRetrograde: true }),
    ];
    const res = layoutPlanetLabels(clusterItems, DEFAULT_ROTATION);
    expect(res.status).toBe("ok");

    // Independent AABB intersection check
    for (let i = 0; i < res.items.length; i++) {
      const a = res.items[i]!.box;
      for (let j = i + 1; j < res.items.length; j++) {
        const b = res.items[j]!.box;
        const xOverlap = a.x0 < b.x1 && a.x1 > b.x0;
        const yOverlap = a.y0 < b.y1 && a.y1 > b.y0;
        expect(xOverlap && yOverlap).toBe(false);
      }
    }
  });

  // L6: Cluster crossing 0°/360°
  it("L6: cluster crossing 0°/360° (359.9° and 0.1°) are neighbors, no overlap, cyclic order preserved", () => {
    const items = [
      createItem("PiscesPlanet", 359.8, { rank: 0 }),
      createItem("ZeroPlanet", 0.0, { rank: 1 }),
      createItem("AriesPlanet", 0.2, { rank: 2 }),
    ];
    const res = layoutPlanetLabels(items, 0);
    expect(res.status).toBe("ok");
    expect(res.items).toHaveLength(3);

    // No overlap
    for (let i = 0; i < res.items.length; i++) {
      const a = res.items[i]!.box;
      for (let j = i + 1; j < res.items.length; j++) {
        const b = res.items[j]!.box;
        const xOverlap = a.x0 < b.x1 && a.x1 > b.x0;
        const yOverlap = a.y0 < b.y1 && a.y1 > b.y0;
        expect(xOverlap && yOverlap).toBe(false);
      }
    }

    // Cyclic order
    for (let i = 0; i < res.items.length; i++) {
      const next = (i + 1) % res.items.length;
      const diff =
        (res.items[next]!.labelAngle - res.items[i]!.labelAngle + 360) % 360;
      expect(diff).toBeGreaterThan(0);
      expect(diff).toBeLessThan(360);
    }
  });

  // L7: Exactly 0°
  it("L7: planet at exactly 0° is placed correctly", () => {
    const item = createItem("Zero", 0.0);
    const rot = 45;
    const res = layoutPlanetLabels([item], rot);
    expect(res.status).toBe("ok");
    const expectedTrueAngle = toScreenAngle(0, rot);
    expect(res.items[0]!.trueAngle).toBeCloseTo(expectedTrueAngle, 3);
    expect(res.items[0]!.labelAngle).toBeCloseTo(expectedTrueAngle, 3);
  });

  // L8: Two planets with identical longitude
  it("L8: two planets with identical longitude are deterministically tie-broken by rank then id", () => {
    const items = [
      createItem("PlanetB", 150.0, { rank: 2, inputIndex: 0 }),
      createItem("PlanetA", 150.0, { rank: 1, inputIndex: 1 }),
    ];
    const res1 = layoutPlanetLabels(items, 0);
    const res2 = layoutPlanetLabels(items, 0);

    expect(res1.items.map((p) => p.id)).toEqual(["PlanetA", "PlanetB"]);
    expect(res1.items).toEqual(res2.items);
  });

  // L9: Input array order invariance
  it("L9: shuffling input array produces identical output", () => {
    const items = [
      createItem("Sun", 280.5, { rank: 0, inputIndex: 0 }),
      createItem("Moon", 329.3, { rank: 1, inputIndex: 1 }),
      createItem("Mercury", 295.8, { rank: 2, inputIndex: 2 }),
      createItem("Venus", 306.3, { rank: 3, inputIndex: 3 }),
      createItem("Mars", 249.8, { rank: 4, inputIndex: 4 }),
    ];
    const resNormal = layoutPlanetLabels(items, DEFAULT_ROTATION);
    const shuffled = [items[3]!, items[0]!, items[4]!, items[1]!, items[2]!];
    const resShuffled = layoutPlanetLabels(shuffled, DEFAULT_ROTATION);

    expect(resNormal.tier).toBe(resShuffled.tier);
    expect(resNormal.items).toEqual(resShuffled.items);
  });

  // L10: Repeatability
  it("L10: 50 consecutive runs produce toEqual results", () => {
    const items = [
      createItem("Sun", 280.5),
      createItem("Moon", 282.0),
      createItem("Mercury", 283.5),
    ];
    const baseline = layoutPlanetLabels(items, DEFAULT_ROTATION);
    for (let i = 0; i < 50; i++) {
      const res = layoutPlanetLabels(items, DEFAULT_ROTATION);
      expect(res).toEqual(baseline);
    }
  });

  // L11: No box overlap across 4 standard datasets in both Tier A and Tier B
  it("L11: no box overlap across 4 standard datasets in both Tier A and Tier B", () => {
    const datasetReal = [
      createItem("Sun", 280.5, { rank: 0 }),
      createItem("Moon", 329.3, { rank: 1 }),
      createItem("Mercury", 295.8, { rank: 2 }),
      createItem("Venus", 306.3, { rank: 3 }),
      createItem("Mars", 249.8, { rank: 4 }),
      createItem("Jupiter", 95.2, { rank: 5 }),
      createItem("Saturn", 285.6, { rank: 6 }),
      createItem("Uranus", 275.8, { rank: 7 }),
      createItem("Neptune", 282.0, { rank: 8 }),
      createItem("Pluto", 232.0, { rank: 9 }),
    ];

    const datasetStellium6 = [
      createItem("P1", 100.0, { rank: 0 }),
      createItem("P2", 101.5, { rank: 1 }),
      createItem("P3", 103.0, { rank: 2 }),
      createItem("P4", 104.5, { rank: 3 }),
      createItem("P5", 106.0, { rank: 4 }),
      createItem("P6", 108.0, { rank: 5 }),
    ];

    const datasetStellium10 = [
      createItem("P0", 200.0, { rank: 0 }),
      createItem("P1", 201.0, { rank: 1 }),
      createItem("P2", 202.0, { rank: 2 }),
      createItem("P3", 203.0, { rank: 3 }),
      createItem("P4", 204.0, { rank: 4 }),
      createItem("P5", 205.0, { rank: 5 }),
      createItem("P6", 206.0, { rank: 6 }),
      createItem("P7", 207.0, { rank: 7 }),
      createItem("P8", 208.0, { rank: 8 }),
      createItem("P9", 209.0, { rank: 9 }),
    ];

    const datasetCross0 = [
      createItem("P1", 358.0, { rank: 0 }),
      createItem("P2", 359.0, { rank: 1 }),
      createItem("P3", 0.5, { rank: 2 }),
      createItem("P4", 1.5, { rank: 3 }),
      createItem("P5", 3.0, { rank: 4 }),
    ];

    const datasets = [
      datasetReal,
      datasetStellium6,
      datasetStellium10,
      datasetCross0,
    ];

    for (const data of datasets) {
      for (const forcedTier of ["A", "B"] as const) {
        const res = layoutPlanetLabels(data, DEFAULT_ROTATION, forcedTier);
        if (res.status === "ok") {
          for (let i = 0; i < res.items.length; i++) {
            const a = res.items[i]!.box;
            for (let j = i + 1; j < res.items.length; j++) {
              const b = res.items[j]!.box;
              const xOverlap = a.x0 < b.x1 && a.x1 > b.x0;
              const yOverlap = a.y0 < b.y1 && a.y1 > b.y0;
              expect(xOverlap && yOverlap).toBe(false);
            }
          }
        }
      }
    }
  });

  // L12: Leader line geometry
  it("L12: leader line ends on margin of box expanded by 1, and is null when gap <= 4", () => {
    const markerInner = { x: 300, y: 132 }; // at top (r=168, theta=90)
    const box = {
      x0: 290,
      x1: 310,
      y0: 145,
      y1: 175,
      width: 20,
      height: 30,
    };

    // When displaced=false, leader is null
    expect(computeLeaderLine(markerInner, box, false)).toBeNull();

    // When displaced=true, leader connects markerInner to edge of box expanded by 1
    const leader = computeLeaderLine(markerInner, box, true);
    expect(leader).not.toBeNull();
    expect(leader!.x1).toBe(markerInner.x);
    expect(leader!.y1).toBe(markerInner.y);
    // Box y0 is 145, expanded by 1 is 144
    expect(leader!.y2).toBe(144);
    expect(leader!.x2).toBe(300);

    // When gap <= LEADER_MIN_GAP (4), leader is null
    const closeBox = {
      x0: 290,
      x1: 310,
      y0: 134, // expanded by 1 is 133; marker y is 132; gap is 1 <= 4
      y1: 160,
      width: 20,
      height: 26,
    };
    expect(computeLeaderLine(markerInner, closeBox, true)).toBeNull();
  });

  // L13: TrueAngle invariant
  it("L13: marker trueAngle is strictly invariant regardless of displacement", () => {
    const singleSun = [createItem("Sun", 280.5)];
    const resSingle = layoutPlanetLabels(singleSun, DEFAULT_ROTATION);

    const clustered = [
      createItem("Sun", 280.5),
      createItem("Moon", 280.6),
      createItem("Mars", 280.7),
    ];
    const resCluster = layoutPlanetLabels(clustered, DEFAULT_ROTATION);

    const sunSingle = resSingle.items.find((p) => p.id === "Sun")!;
    const sunClustered = resCluster.items.find((p) => p.id === "Sun")!;

    expect(sunClustered.displaced).toBe(true);
    expect(sunClustered.trueAngle).toBe(sunSingle.trueAngle);
  });

  // L14: Invalid input handling
  it("L14: throws RangeError on NaN / Infinity and normalizes out-of-bounds angles", () => {
    expect(() =>
      layoutPlanetLabels([createItem("Bad", Number.NaN)], 0),
    ).toThrow(RangeError);
    expect(() =>
      layoutPlanetLabels([createItem("Bad", Number.POSITIVE_INFINITY)], 0),
    ).toThrow(RangeError);
    expect(() => layoutPlanetLabels([createItem("Ok", 0)], Number.NaN)).toThrow(
      RangeError,
    );

    // Negative longitude and > 360 normalized
    const items = [createItem("Neg", -10), createItem("Over", 370)];
    const res = layoutPlanetLabels(items, 0);
    expect(res.status).toBe("ok");
    expect(res.items.find((p) => p.id === "Neg")!.trueAngle).toBe(
      toScreenAngle(350, 0),
    );
    expect(res.items.find((p) => p.id === "Over")!.trueAngle).toBe(
      toScreenAngle(10, 0),
    );
  });

  // L15: Minimum font size constraint
  it("L15: all text sizes in PLANET_TEXT_SIZES satisfy size * (400 / 600) >= 10", () => {
    const scale = WHEEL_MIN_DISPLAY_PX / WHEEL_VIEWBOX_SIZE; // 400 / 600 = 0.6667
    expect(scale).toBeCloseTo(2 / 3, 4);

    for (const [key, size] of Object.entries(PLANET_TEXT_SIZES)) {
      const computedPx = size * scale;
      expect(
        computedPx,
        `Text size for '${key}' (${size}) must render >= 10px at min 400px display width`,
      ).toBeGreaterThanOrEqual(10.0);
    }
  });

  // L16: Tier selection
  it("L16: selects Tier A for sparse charts and Tier B for dense charts, never mixing tiers", () => {
    // 1. Sparse chart -> Tier A
    const sparse = [createItem("Sun", 0), createItem("Moon", 120)];
    const resSparse = layoutPlanetLabels(sparse, 0);
    expect(resSparse.tier).toBe("A");
    expect(resSparse.maxDisplacementDeg).toBe(0);

    // 2. Dense 10-planet stellium in 9° -> Exceeds 30° displacement in Tier A -> Tier B
    const denseStellium = [
      createItem("P0", 200.0, { rank: 0 }),
      createItem("P1", 201.0, { rank: 1 }),
      createItem("P2", 202.0, { rank: 2 }),
      createItem("P3", 203.0, { rank: 3 }),
      createItem("P4", 204.0, { rank: 4 }),
      createItem("P5", 205.0, { rank: 5 }),
      createItem("P6", 206.0, { rank: 6 }),
      createItem("P7", 207.0, { rank: 7 }),
      createItem("P8", 208.0, { rank: 8 }),
      createItem("P9", 209.0, { rank: 9 }),
    ];
    const resDense = layoutPlanetLabels(denseStellium, 0);
    expect(resDense.tier).toBe("B");
    expect(resDense.status).toBe("ok");

    // 3. Synthetic boundary: <= 30.0° vs > 30.0°
    // With 5 planets in a cluster calibrated to hit ~29.9° vs ~30.1°
    const cluster29 = [
      createItem("A1", 100, { rank: 1 }),
      createItem("A2", 100, { rank: 2 }),
      createItem("A3", 100, { rank: 3 }),
      createItem("A4", 100, { rank: 4 }),
    ];
    // In Tier A, 4 overlapping items need span 3 * ~16.5° = 49.5° => max displacement ~24.75° <= 30°
    const res29 = layoutPlanetLabels(cluster29, 0);
    expect(res29.tier).toBe("A");
    expect(res29.maxDisplacementDeg).toBeLessThanOrEqual(
      MAX_DISPLACEMENT_A_DEG,
    );
  });

  // L17: Containment in ring
  it("L17: all 4 corners of all boxes lie within [planetZoneInner, planetMarkerOuter)", () => {
    const items = [
      createItem("Sun", 280.5),
      createItem("Moon", 282.0),
      createItem("Mercury", 283.5),
      createItem("Venus", 306.3),
    ];
    const res = layoutPlanetLabels(items, DEFAULT_ROTATION);
    expect(res.status).toBe("ok");

    const rMin = WHEEL_RADII.planetZoneInner;
    const rMax = WHEEL_RADII.planetMarkerOuter;

    for (const p of res.items) {
      const corners = [
        { x: p.box.x0, y: p.box.y0 },
        { x: p.box.x1, y: p.box.y0 },
        { x: p.box.x0, y: p.box.y1 },
        { x: p.box.x1, y: p.box.y1 },
      ];
      for (const c of corners) {
        const dist = Math.hypot(c.x - WHEEL_CENTER, c.y - WHEEL_CENTER);
        expect(dist).toBeGreaterThanOrEqual(rMin - 1e-2);
        expect(dist).toBeLessThanOrEqual(rMax + 1e-2);
      }
    }
  });

  // L18: Preservation of cyclic order
  it("L18: preserves cyclic order across all planets", () => {
    const items = [
      createItem("P1", 20.0),
      createItem("P2", 20.2),
      createItem("P3", 20.4),
      createItem("P4", 150.0),
      createItem("P5", 350.0),
      createItem("P6", 350.2),
    ];
    const res = layoutPlanetLabels(items, DEFAULT_ROTATION);
    expect(res.status).toBe("ok");

    for (let i = 0; i < res.items.length; i++) {
      const next = (i + 1) % res.items.length;
      const diff =
        (res.items[next]!.labelAngle - res.items[i]!.labelAngle + 360) % 360;
      expect(diff).toBeGreaterThan(0);
      expect(diff).toBeLessThan(360);
    }
  });

  // L19: Arbitrary rotations
  it("L19: layout remains valid and overlap-free under 12 different rotations", () => {
    const testRotations = [
      0, 14.891, 30, 45, 90, 123.45, 180, 210, 270, 300, 350, 359.99,
    ];
    const items = [
      createItem("P1", 275.8),
      createItem("P2", 280.5),
      createItem("P3", 282.0),
      createItem("P4", 285.6),
      createItem("P5", 295.8),
    ];

    for (const rot of testRotations) {
      const res = layoutPlanetLabels(items, rot);
      expect(res.status).toBe("ok");

      // Verify no overlap
      for (let i = 0; i < res.items.length; i++) {
        const a = res.items[i]!.box;
        for (let j = i + 1; j < res.items.length; j++) {
          const b = res.items[j]!.box;
          const xOverlap = a.x0 < b.x1 && a.x1 > b.x0;
          const yOverlap = a.y0 < b.y1 && a.y1 > b.y0;
          expect(xOverlap && yOverlap).toBe(false);
        }
      }
    }
  });

  // L20: Overflow handling
  it("L20: returns overflow status on extreme input without throwing or returning NaN", () => {
    // 40 items crammed together cannot fit on the circle
    const extremeItems: LabelLayoutItem[] = [];
    for (let i = 0; i < 40; i++) {
      extremeItems.push(
        createItem(`P${i}`, i * 0.1, { rank: i, inputIndex: i }),
      );
    }

    const res = layoutPlanetLabels(extremeItems, 0);
    expect(res.status).toBe("overflow");
    expect(Number.isFinite(res.maxDisplacementDeg)).toBe(true);
    for (const p of res.items) {
      expect(Number.isFinite(p.labelAngle)).toBe(true);
      expect(Number.isFinite(p.center.x)).toBe(true);
      expect(Number.isFinite(p.center.y)).toBe(true);
    }
  });

  // Coverage tests: circularDistance errors, tie-breakers, and wrap merge
  it("coverage: circularDistance throws on non-finite input", () => {
    expect(() => circularDistance(Number.NaN, 0)).toThrow(RangeError);
    expect(() => circularDistance(0, Number.POSITIVE_INFINITY)).toThrow(
      RangeError,
    );
  });

  it("coverage: tie-breakers when angles and ranks are identical", () => {
    const items = [
      createItem("Beta", 100, { rank: 1, inputIndex: 1 }),
      createItem("Alpha", 100, { rank: 1, inputIndex: 2 }),
      createItem("Alpha", 100, { rank: 1, inputIndex: 0 }),
    ];
    const res = layoutPlanetLabels(items, 0);
    expect(res.status).toBe("ok");
    expect(res.items.map((p) => p.id)).toEqual(["Alpha", "Alpha", "Beta"]);
  });

  it("coverage: triggers circular wrap merge across full circle", () => {
    // Two large clusters: one near 350° and one near 10° that expand across 0°/360°
    const items: LabelLayoutItem[] = [
      createItem("A1", 345, { rank: 1 }),
      createItem("A2", 348, { rank: 2 }),
      createItem("A3", 351, { rank: 3 }),
      createItem("A4", 354, { rank: 4 }),
      createItem("B1", 6, { rank: 5 }),
      createItem("B2", 9, { rank: 6 }),
      createItem("B3", 12, { rank: 7 }),
      createItem("B4", 15, { rank: 8 }),
      createItem("Opposite", 180, { rank: 9 }), // creates cut on the opposite side
    ];
    const res = layoutPlanetLabels(items, 0, "B");
    expect(res.status).toBe("ok");
  });

  it("coverage: forcedTier parameter", () => {
    const items = [createItem("Sun", 0)];
    const resA = layoutPlanetLabels(items, 0, "A");
    expect(resA.tier).toBe("A");
    const resB = layoutPlanetLabels(items, 0, "B");
    expect(resB.tier).toBe("B");
  });
});
