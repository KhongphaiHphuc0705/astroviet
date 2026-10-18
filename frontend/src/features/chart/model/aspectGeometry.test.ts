import { describe, expect, it } from "vitest";

import {
  ASPECT_LINE_STYLES,
  buildAspectGeometry,
  shortestSignedAngleDeg,
} from "./aspectGeometry";
import type { AspectVM, PlanetVM } from "./chartViewModel";
import {
  polarToCartesian,
  toScreenAngle,
  WHEEL_CENTER,
  WHEEL_RADII,
} from "./geometry";
import type { NatureTone } from "./labels";
import { buildPlanetWheelModel } from "./planetGeometry";

function makePlanet(key: string, longitude: number): PlanetVM {
  return {
    key,
    nameVi: key,
    glyph: "☉",
    known: true,
    longitude,
    sign: { key: "Aries", labelVi: "Bạch Dương", glyph: "♈", known: true },
    degreeLabel: `${Math.floor(longitude % 30)}°`,
    houseNumber: 1,
    isRetrograde: false,
    ariaLabel: key,
  };
}

function makeAspect(
  key: string,
  planetA: string,
  planetB: string,
  typeKey: string,
  orb = 1.0,
  natureKey = "Harmonious",
  natureTone: NatureTone = "harmonious",
): AspectVM {
  return {
    key,
    planetA: { key: planetA, labelVi: planetA, glyph: "☉", known: true },
    planetB: { key: planetB, labelVi: planetB, glyph: "☽", known: true },
    type: { key: typeKey, labelVi: typeKey, glyph: "△", known: true },
    nature: {
      key: natureKey,
      labelVi: natureKey,
      tone: natureTone,
      known: true,
    },
    orb,
    orbLabel: `${orb}°`,
    isApplying: true,
    applyingLabelVi: "Đang tiến",
  };
}

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  Object.freeze(obj);
  for (const prop of Object.getOwnPropertyNames(obj)) {
    const val = (obj as Record<string, unknown>)[prop];
    if (
      val !== null &&
      (typeof val === "object" || typeof val === "function")
    ) {
      deepFreeze(val);
    }
  }
  return obj;
}

describe("aspectGeometry (M6.2: G1 - G25)", () => {
  // G1: đầu mút A
  it("G1: computes start endpoint at Sun@0° with rotation=0 as (192, 300)", () => {
    const planets = [makePlanet("Sun", 0), makePlanet("Moon", 90)];
    const aspects = [makeAspect("A1", "Sun", "Moon", "Square")];
    const res = buildAspectGeometry(aspects, planets, 0);

    expect(res.lines).toHaveLength(1);
    const line = res.lines[0]!;
    // λ=0, rot=0 => θ=180 => x = 300 + 108*cos(180) = 192, y = 300 - 108*sin(180) = 300
    expect(line.start.x).toBe(192);
    expect(line.start.y).toBe(300);
  });

  // G2: đầu mút B
  it("G2: computes end endpoint at Mars@90° with rotation=0 as (300, 408)", () => {
    const planets = [makePlanet("Sun", 0), makePlanet("Mars", 90)];
    const aspects = [makeAspect("A1", "Sun", "Mars", "Square")];
    const res = buildAspectGeometry(aspects, planets, 0);

    expect(res.lines).toHaveLength(1);
    const line = res.lines[0]!;
    // λ=90, rot=0 => θ=270 => x = 300 + 108*cos(270) = 300, y = 300 - 108*sin(270) = 408
    expect(line.end.x).toBe(300);
    expect(line.end.y).toBe(408);
  });

  // G3: thứ tự đầu mút không bị hoán đổi
  it("G3: preserves start=planetA and end=planetB even when lonA > lonB", () => {
    const planets = [makePlanet("Venus", 180), makePlanet("Mercury", 30)];
    const aspects = [makeAspect("A1", "Venus", "Mercury", "Trine")];
    const res = buildAspectGeometry(aspects, planets, 0);

    const line = res.lines[0]!;
    // Venus (180): θ=0 => (408, 300)
    expect(line.start.x).toBe(408);
    expect(line.start.y).toBe(300);
    // Mercury (30): θ=210 => (300 + 108*cos(210), 300 - 108*sin(210))
    const expectedEnd = polarToCartesian(300, 300, 108, 210);
    expect(line.end.x).toBeCloseTo(expectedEnd.x, 3);
    expect(line.end.y).toBeCloseTo(expectedEnd.y, 3);
  });

  // G4: Conjunction trùng vị trí
  it("G4: renders shape 'dot' with d=null when conjunction endpoints are identical", () => {
    const planets = [makePlanet("Sun", 45), makePlanet("Moon", 45)];
    const aspects = [makeAspect("A1", "Sun", "Moon", "Conjunction", 0)];
    const res = buildAspectGeometry(aspects, planets, 0);

    expect(res.lines).toHaveLength(1);
    const line = res.lines[0]!;
    expect(line.shape).toBe("dot");
    expect(line.d).toBeNull();
    expect(Number.isNaN(line.start.x)).toBe(false);
    expect(Number.isNaN(line.start.y)).toBe(false);
    expect(line.start.x).toBe(line.end.x);
    expect(line.start.y).toBe(line.end.y);
  });

  // G5: hệ toạ độ chung và khớp PlanetRenderItem.trueAngle
  it("G5: uses shared coordinate system matching toScreenAngle and PlanetRenderItem.trueAngle", () => {
    const rotation = 34.5;
    const planets = [makePlanet("Sun", 123.4), makePlanet("Moon", 243.4)];
    const aspects = [makeAspect("A1", "Sun", "Moon", "Trine")];

    const res = buildAspectGeometry(aspects, planets, rotation);
    const planetModel = buildPlanetWheelModel(planets, rotation);

    const line = res.lines[0]!;
    const sunItem = planetModel.planets.find((p) => p.id === "Sun")!;
    const moonItem = planetModel.planets.find((p) => p.id === "Moon")!;

    const angleStart = toScreenAngle(123.4, rotation);
    const angleEnd = toScreenAngle(243.4, rotation);

    expect(sunItem.trueAngle).toBeCloseTo(angleStart, 3);
    expect(moonItem.trueAngle).toBeCloseTo(angleEnd, 3);

    const ptA = polarToCartesian(300, 300, 108, sunItem.trueAngle);
    expect(line.start.x).toBeCloseTo(ptA.x, 3);
    expect(line.start.y).toBeCloseTo(ptA.y, 3);
  });

  // G6: kinh độ không hữu hạn
  it("G6: skips aspect with NON_FINITE reason when planet longitude is non-finite", () => {
    const planets = [makePlanet("Sun", Number.NaN), makePlanet("Moon", 90)];
    const aspects = [makeAspect("A1", "Sun", "Moon", "Square")];
    const res = buildAspectGeometry(aspects, planets, 0);

    expect(res.lines).toHaveLength(0);
    expect(res.skipped).toHaveLength(1);
    expect(res.skipped[0]!.reason).toBe("NON_FINITE");
  });

  // G7: thiếu hành tinh đầu mút
  it("G7: skips aspect with ENDPOINT_MISSING reason when planet is missing", () => {
    const planets = [makePlanet("Sun", 0)];
    const aspects = [makeAspect("A1", "Sun", "Mars", "Square")];
    const res = buildAspectGeometry(aspects, planets, 0);

    expect(res.lines).toHaveLength(0);
    expect(res.skipped).toHaveLength(1);
    expect(res.skipped[0]!.reason).toBe("ENDPOINT_MISSING");
  });

  // G8: cung Conjunction có tâm ngược (F.6.5) = (300, 300) cho cả 2 hướng
  it("G8: computes Conjunction arc with center (300, 300) for both dSigned > 0 and dSigned < 0", () => {
    const R = WHEEL_RADII.aspectRing; // 108

    // Test case 1: dSigned > 0 (θA=180, θB=185 => counter-clockwise, sweep=0)
    const planets1 = [makePlanet("Sun", 0), makePlanet("Moon", 5)];
    const aspects1 = [makeAspect("A1", "Sun", "Moon", "Conjunction", 5)];
    const res1 = buildAspectGeometry(aspects1, planets1, 0);
    const line1 = res1.lines[0]!;
    expect(line1.shape).toBe("arc");
    expect(line1.d).toContain(`A ${R} ${R} 0 0 0`);

    // Verify center reconstruction from SVG F.6.5 for sweep=0
    verifyArcCenter(
      line1.start.x,
      line1.start.y,
      line1.end.x,
      line1.end.y,
      R,
      0,
    );

    // Test case 2: dSigned < 0 (θA=185, θB=180 => clockwise, sweep=1)
    const planets2 = [makePlanet("Sun", 5), makePlanet("Moon", 0)];
    const aspects2 = [makeAspect("A2", "Sun", "Moon", "Conjunction", 5)];
    const res2 = buildAspectGeometry(aspects2, planets2, 0);
    const line2 = res2.lines[0]!;
    expect(line2.shape).toBe("arc");
    expect(line2.d).toContain(`A ${R} ${R} 0 0 1`);

    verifyArcCenter(
      line2.start.x,
      line2.start.y,
      line2.end.x,
      line2.end.y,
      R,
      1,
    );
  });

  // Helper verifying center using SVG specification Appendix F.6.5
  function verifyArcCenter(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    r: number,
    sweepFlag: number,
  ) {
    const x1p = (x1 - x2) / 2;
    const y1p = (y1 - y2) / 2;
    const sq = (r * r - (x1p * x1p + y1p * y1p)) / (x1p * x1p + y1p * y1p);
    const sign = sweepFlag === 0 ? -1 : 1; // fA=0, so fA != fS is true when fS=1 => +
    const c = sign * Math.sqrt(Math.max(0, sq));
    const cxp = c * y1p;
    const cyp = -c * x1p;
    const cx = (x1 + x2) / 2 + cxp;
    const cy = (y1 + y2) / 2 + cyp;
    expect(cx).toBeCloseTo(WHEEL_CENTER, 2);
    expect(cy).toBeCloseTo(WHEEL_CENTER, 2);
  }

  // G9: 0 aspect
  it("G9: returns empty lines, skipped, and legend for 0 aspects", () => {
    const planets = [makePlanet("Sun", 0)];
    const res = buildAspectGeometry([], planets, 0);
    expect(res.lines).toEqual([]);
    expect(res.skipped).toEqual([]);
    expect(res.legend).toEqual([]);
    expect(res.ringRadius).toBe(108);
  });

  // G10: 1 aspect
  it("G10: renders 1 line and 1 legend entry for a single aspect", () => {
    const planets = [makePlanet("Sun", 0), makePlanet("Moon", 120)];
    const aspects = [makeAspect("A1", "Sun", "Moon", "Trine")];
    const res = buildAspectGeometry(aspects, planets, 0);
    expect(res.lines).toHaveLength(1);
    expect(res.legend).toHaveLength(1);
    expect(res.legend[0]!.typeKey).toBe("Trine");
  });

  // G11: thứ tự vẽ: orb giảm dần, hoà theo key tăng dần; bất biến đảo mảng (I8)
  it("G11: sorts lines by orb descending, tie-broken by key ascending; order is invariant to input order", () => {
    const planets = [
      makePlanet("Sun", 0),
      makePlanet("Moon", 120),
      makePlanet("Mars", 60),
      makePlanet("Jupiter", 180),
    ];
    const a1 = makeAspect("K1", "Sun", "Moon", "Trine", 1.2);
    const a2 = makeAspect("K2", "Sun", "Mars", "Sextile", 3.5);
    const a3 = makeAspect("K3", "Sun", "Jupiter", "Opposition", 1.2);

    const resForward = buildAspectGeometry([a1, a2, a3], planets, 0);
    const resReverse = buildAspectGeometry([a3, a2, a1], planets, 0);

    // Expected order:
    // Highest orb: a2 (orb 3.5)
    // Next: a1 and a3 (orb 1.2) -> tie-broken by key: "K1" then "K3"
    expect(resForward.lines.map((l) => l.key)).toEqual(["K2", "K1", "K3"]);
    expect(resReverse.lines.map((l) => l.key)).toEqual(["K2", "K1", "K3"]);
  });

  // G12: hành tinh trùng key
  it("G12: skips aspect with ENDPOINT_AMBIGUOUS reason when planet key is duplicated (both keyA and keyB)", () => {
    const planetsA = [
      makePlanet("Sun", 0),
      makePlanet("Sun", 10), // duplicated keyA
      makePlanet("Moon", 90),
    ];
    const aspectsA = [makeAspect("A1", "Sun", "Moon", "Square")];
    const resA = buildAspectGeometry(aspectsA, planetsA, 0);

    expect(resA.lines).toHaveLength(0);
    expect(resA.skipped).toHaveLength(1);
    expect(resA.skipped[0]!.reason).toBe("ENDPOINT_AMBIGUOUS");

    // Test when keyB is duplicated
    const planetsB = [
      makePlanet("Sun", 0),
      makePlanet("Moon", 90),
      makePlanet("Moon", 95), // duplicated keyB
    ];
    const aspectsB = [makeAspect("A2", "Sun", "Moon", "Square")];
    const resB = buildAspectGeometry(aspectsB, planetsB, 0);

    expect(resB.lines).toHaveLength(0);
    expect(resB.skipped).toHaveLength(1);
    expect(resB.skipped[0]!.reason).toBe("ENDPOINT_AMBIGUOUS");
  });

  // G13: A = B (tự tham chiếu)
  it("G13: skips aspect with SELF_REFERENCE reason when planetA equals planetB", () => {
    const planets = [makePlanet("Sun", 0)];
    const aspects = [makeAspect("A1", "Sun", "Sun", "Conjunction")];
    const res = buildAspectGeometry(aspects, planets, 0);

    expect(res.lines).toHaveLength(0);
    expect(res.skipped).toHaveLength(1);
    expect(res.skipped[0]!.reason).toBe("SELF_REFERENCE");
  });

  // G14: aspect trùng (cùng loại, cùng cặp hành tinh không thứ tự)
  it("G14: preserves first aspect and marks subsequent same-pair aspect as DUPLICATE", () => {
    const planets = [makePlanet("Sun", 0), makePlanet("Moon", 120)];
    const a1 = makeAspect("First", "Sun", "Moon", "Trine", 1.0);
    const a2 = makeAspect("Second", "Moon", "Sun", "Trine", 2.0); // reverse pair

    const res = buildAspectGeometry([a1, a2], planets, 0);
    expect(res.lines).toHaveLength(1);
    expect(res.lines[0]!.key).toBe("First");
    expect(res.skipped).toHaveLength(1);
    expect(res.skipped[0]!.key).toBe("Second");
    expect(res.skipped[0]!.reason).toBe("DUPLICATE");
  });

  // G15: loại lạ không hỗ trợ
  it("G15: skips unsupported aspect type with UNSUPPORTED_TYPE reason", () => {
    const planets = [makePlanet("Sun", 0), makePlanet("Moon", 150)];
    const aspects = [makeAspect("A1", "Sun", "Moon", "Quincunx")];
    const res = buildAspectGeometry(aspects, planets, 0);

    expect(res.lines).toHaveLength(0);
    expect(res.skipped).toHaveLength(1);
    expect(res.skipped[0]!.reason).toBe("UNSUPPORTED_TYPE");
  });

  // G16: nature lạ / unknown
  it("G16: draws aspect with natureTone 'unknown' when nature tone is unrecognized", () => {
    const planets = [makePlanet("Sun", 0), makePlanet("Moon", 120)];
    const aspect = makeAspect(
      "A1",
      "Sun",
      "Moon",
      "Trine",
      1.0,
      "Mystical",
      "unknown" as NatureTone,
    );
    const res = buildAspectGeometry([aspect], planets, 0);

    expect(res.lines).toHaveLength(1);
    expect(res.lines[0]!.natureTone).toBe("unknown");
    expect(res.legend[0]!.natureTone).toBe("unknown");
  });

  // G17: rotation không hữu hạn
  it("G17: throws RangeError when rotation is NaN or Infinity", () => {
    const planets = [makePlanet("Sun", 0), makePlanet("Moon", 120)];
    const aspects = [makeAspect("A1", "Sun", "Moon", "Trine")];

    expect(() => buildAspectGeometry(aspects, planets, Number.NaN)).toThrow(
      RangeError,
    );
    expect(() =>
      buildAspectGeometry(aspects, planets, Number.POSITIVE_INFINITY),
    ).toThrow(RangeError);
  });

  // G18: tất định 50 lần
  it("G18: is strictly deterministic across 50 repeated invocations", () => {
    const planets = [
      makePlanet("Sun", 12.3),
      makePlanet("Moon", 72.3),
      makePlanet("Mars", 132.3),
    ];
    const aspects = [
      makeAspect("A1", "Sun", "Moon", "Sextile", 0.5),
      makeAspect("A2", "Sun", "Mars", "Trine", 1.5),
    ];

    const baseline = buildAspectGeometry(aspects, planets, 45);
    for (let i = 0; i < 50; i++) {
      const run = buildAspectGeometry(aspects, planets, 45);
      expect(run).toEqual(baseline);
    }
  });

  // G19: qua 0°: Conjunction 359.5° / 0.5° vẽ cung ngắn 1°
  it("G19: handles 0° wrap-around for Conjunction 359.5° / 0.5° with 1° separation", () => {
    const planets = [makePlanet("Sun", 359.5), makePlanet("Moon", 0.5)];
    const aspects = [makeAspect("A1", "Sun", "Moon", "Conjunction", 1.0)];
    const res = buildAspectGeometry(aspects, planets, 0);

    const line = res.lines[0]!;
    expect(line.shape).toBe("arc");
    expect(line.separationDeg).toBe(1);
  });

  // G20: Opposition 0° ↔ 180° vẽ chord qua tâm
  it("G20: draws Opposition between 0° and 180° passing through center (300, 300)", () => {
    const planets = [makePlanet("Sun", 0), makePlanet("Moon", 180)];
    const aspects = [makeAspect("A1", "Sun", "Moon", "Opposition")];
    const res = buildAspectGeometry(aspects, planets, 0);

    const line = res.lines[0]!;
    expect(line.shape).toBe("chord");
    expect(line.start.x).toBe(192);
    expect(line.start.y).toBe(300);
    expect(line.end.x).toBe(408);
    expect(line.end.y).toBe(300);

    // Distance from center (300, 300) to horizontal segment y=300 is 0
    expect(Math.abs(line.start.y - WHEEL_CENTER)).toBe(0);
    expect(Math.abs(line.end.y - WHEEL_CENTER)).toBe(0);
  });

  // G21: mọi điểm nằm trong đĩa r <= 108 + 1e-3
  it("G21: all endpoints and curve bounds lie within radius <= 108", () => {
    const planets = [
      makePlanet("Sun", 10),
      makePlanet("Moon", 70),
      makePlanet("Mars", 100),
      makePlanet("Jupiter", 130),
      makePlanet("Saturn", 190),
    ];
    const aspects = [
      makeAspect("A1", "Sun", "Moon", "Sextile"),
      makeAspect("A2", "Sun", "Mars", "Square"),
      makeAspect("A3", "Sun", "Jupiter", "Trine"),
      makeAspect("A4", "Sun", "Saturn", "Opposition"),
      makeAspect("A5", "Sun", "Sun", "Conjunction"), // skipped
    ];

    const res = buildAspectGeometry(aspects, planets, 15);
    for (const line of res.lines) {
      const rStart = Math.hypot(
        line.start.x - WHEEL_CENTER,
        line.start.y - WHEEL_CENTER,
      );
      const rEnd = Math.hypot(
        line.end.x - WHEEL_CENTER,
        line.end.y - WHEEL_CENTER,
      );
      expect(rStart).toBeLessThanOrEqual(108 + 1e-3);
      expect(rEnd).toBeLessThanOrEqual(108 + 1e-3);
    }
  });

  // G22: legend chỉ chứa loại được vẽ, theo thứ tự KNOWN_ASPECT_TYPES
  it("G22: legend only contains drawn types, sorted in canonical order", () => {
    const planets = [
      makePlanet("Sun", 0),
      makePlanet("Moon", 180),
      makePlanet("Mars", 60),
    ];
    // Oppositions and Sextiles only (no Conjunction, Square, Trine)
    const aspects = [
      makeAspect("A1", "Sun", "Moon", "Opposition"),
      makeAspect("A2", "Sun", "Mars", "Sextile"),
    ];

    const res = buildAspectGeometry(aspects, planets, 0);
    expect(res.legend.map((e) => e.typeKey)).toEqual(["Sextile", "Opposition"]);
  });

  // G23: không làm biến dị (mutate) đầu vào
  it("G23: does not mutate frozen inputs", () => {
    const planets = deepFreeze([makePlanet("Sun", 0), makePlanet("Moon", 90)]);
    const aspects = deepFreeze([makeAspect("A1", "Sun", "Moon", "Square")]);

    expect(() => buildAspectGeometry(aspects, planets, 0)).not.toThrow();
  });

  // G24: kiểu nét độc lập với màu
  it("G24: line style (width, dasharray, shape) is invariant to nature tone", () => {
    const planets = [makePlanet("Sun", 0), makePlanet("Moon", 90)];
    const aspectTense = makeAspect(
      "A1",
      "Sun",
      "Moon",
      "Square",
      1,
      "Challenging",
      "tense",
    );
    const aspectHarmonious = makeAspect(
      "A2",
      "Sun",
      "Moon",
      "Square",
      1,
      "Harmonious",
      "harmonious",
    );

    const res1 = buildAspectGeometry([aspectTense], planets, 0);
    const res2 = buildAspectGeometry([aspectHarmonious], planets, 0);

    expect(res1.lines[0]!.style).toEqual(res2.lines[0]!.style);
  });

  // G25: 5 kiểu khác nhau cho 5 loại aspect
  it("G25: defines distinct (shape, width, dasharray) signatures for all 5 aspect types", () => {
    const signatures = new Set(
      Object.values(ASPECT_LINE_STYLES).map(
        (s) => `${s.shape}:${s.width}:${s.dasharray ?? "solid"}`,
      ),
    );
    expect(signatures.size).toBe(5);
  });

  // Helper unit tests
  it("shortestSignedAngleDeg computes signed difference in (-180, 180]", () => {
    expect(shortestSignedAngleDeg(10, 20)).toBe(10);
    expect(shortestSignedAngleDeg(20, 10)).toBe(-10);
    expect(shortestSignedAngleDeg(350, 10)).toBe(20);
    expect(shortestSignedAngleDeg(10, 350)).toBe(-20);
    expect(shortestSignedAngleDeg(0, 180)).toBe(180);
    expect(shortestSignedAngleDeg(180, 0)).toBe(180);
  });
});
