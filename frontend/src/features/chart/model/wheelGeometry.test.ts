import { describe, expect, it } from "vitest";

import { chartFull, chartNoHouses } from "../api/mocks/fixtures";
import { KNOWN_ZODIAC_SIGNS, type ChartResponse } from "../api/types";

import { toChartViewModel } from "./chartViewModel";
import { normalizeLongitude, toScreenAngle, WHEEL_CENTER } from "./geometry";
import { buildWheelGeometry, WheelGeometryError } from "./wheelGeometry";

function measureScreenAngle(x: number, y: number): number {
  // SVG y goes down, so dy = cy - y; dx = x - cx
  const dx = x - WHEEL_CENTER;
  const dy = WHEEL_CENTER - y;
  const rad = Math.atan2(dy, dx);
  const deg = (rad * 180) / Math.PI;
  return normalizeLongitude(deg);
}

describe("buildWheelGeometry (M4.2: W1 - W19)", () => {
  const fullVM = toChartViewModel(chartFull);
  const noHousesVM = toChartViewModel(chartNoHouses);

  it("W1: builds complete wheel geometry for chartFull", () => {
    const geo = buildWheelGeometry(fullVM);

    expect(geo.rotation).toBe(fullVM.flags.ascendantLongitude);
    expect(geo.hasHouses).toBe(true);
    expect(geo.signs).toHaveLength(12);
    expect(geo.ticks).toHaveLength(72);
    expect(geo.houses).toHaveLength(12);
    expect(geo.angles).toHaveLength(4);
  });

  it("W2: ASC angle marker is positioned exactly at 180 degrees (anti-double-rotation)", () => {
    const geo = buildWheelGeometry(fullVM);
    const ascMarker = geo.angles.find((a) => a.key === "Ascendant");
    expect(ascMarker).toBeDefined();

    // Measure angle from center to outer point
    const angle = measureScreenAngle(ascMarker!.line.x2, ascMarker!.line.y2);
    expect(angle).toBeCloseTo(180, 2);
  });

  it("W3: Aries boundary (lambda = 0) is at theta = 180 - rotation (mod 360)", () => {
    const geo = buildWheelGeometry(fullVM);
    const aries = geo.signs[0]!;
    expect(aries.key).toBe("Aries");

    const expectedTheta = normalizeLongitude(180 - geo.rotation);
    const measuredTheta = measureScreenAngle(
      aries.boundary.x2,
      aries.boundary.y2,
    );
    expect(measuredTheta).toBeCloseTo(expectedTheta, 2);
  });

  it("W4: 12 sign boundaries have successive angular differences of 30 degrees", () => {
    const geo = buildWheelGeometry(fullVM);
    expect(geo.signs).toHaveLength(12);

    for (let i = 0; i < 12; i++) {
      const curr = geo.signs[i]!;
      const next = geo.signs[(i + 1) % 12]!;

      const thetaCurr = measureScreenAngle(curr.boundary.x2, curr.boundary.y2);
      const thetaNext = measureScreenAngle(next.boundary.x2, next.boundary.y2);

      const diff = normalizeLongitude(thetaNext - thetaCurr);
      expect(diff).toBeCloseTo(30, 2);
    }
  });

  it("W5: 72 ticks with 5-degree angular steps and exactly 12 major ticks at multiples of 30", () => {
    const geo = buildWheelGeometry(fullVM);
    expect(geo.ticks).toHaveLength(72);

    const majorTicks = geo.ticks.filter((t) => t.kind === "major");
    const minorTicks = geo.ticks.filter((t) => t.kind === "minor");
    expect(majorTicks).toHaveLength(12);
    expect(minorTicks).toHaveLength(60);

    // Each major tick must have longitude divisible by 30
    majorTicks.forEach((t) => {
      expect(t.longitude % 30).toBe(0);
    });

    // Check 5-degree successive steps
    for (let i = 0; i < 71; i++) {
      const t1 = geo.ticks[i]!;
      const t2 = geo.ticks[i + 1]!;
      const a1 = measureScreenAngle(t1.x1, t1.y1);
      const a2 = measureScreenAngle(t2.x1, t2.y1);
      const diff = normalizeLongitude(a2 - a1);
      expect(diff).toBeCloseTo(5, 2);
    }
  });

  it("W6: cusp house 1 in Placidus has the same screen angle as ASC (180 degrees)", () => {
    const geo = buildWheelGeometry(fullVM);
    const house1 = geo.houses![0]!;
    expect(house1.number).toBe(1);

    const thetaCusp1 = measureScreenAngle(house1.cusp.x2, house1.cusp.y2);
    expect(thetaCusp1).toBeCloseTo(180, 2);
  });

  it("W7: house number label is at the midpoint between consecutive cusps", () => {
    const geo = buildWheelGeometry(fullVM);
    geo.houses!.forEach((house, i) => {
      const currCusp = fullVM.houses[i]!.cuspLongitude;
      const nextCusp = fullVM.houses[(i + 1) % 12]!.cuspLongitude;
      const expectedLong = normalizeLongitude(
        currCusp + normalizeLongitude(nextCusp - currCusp) / 2,
      );
      const expectedTheta = toScreenAngle(expectedLong, geo.rotation);

      const measuredTheta = measureScreenAngle(
        house.labelPoint.x,
        house.labelPoint.y,
      );
      expect(measuredTheta).toBeCloseTo(expectedTheta, 2);
    });
  });

  it("W8: layer alignment: sign boundaries, cusps, and angles all align with toScreenAngle", () => {
    const geo = buildWheelGeometry(fullVM);

    // Sign boundaries
    geo.signs.forEach((sign) => {
      const expected = toScreenAngle(sign.startLongitude, geo.rotation);
      const measured = measureScreenAngle(sign.boundary.x2, sign.boundary.y2);
      expect(measured).toBeCloseTo(expected, 2);
    });

    // Cusps
    geo.houses!.forEach((house, i) => {
      const expected = toScreenAngle(
        fullVM.houses[i]!.cuspLongitude,
        geo.rotation,
      );
      const measured = measureScreenAngle(house.cusp.x2, house.cusp.y2);
      expect(measured).toBeCloseTo(expected, 2);
    });

    // Angles
    geo.angles.forEach((angle) => {
      const vmAngle = fullVM.angles.find((a) => a.key === angle.key)!;
      const expected = toScreenAngle(vmAngle.longitude, geo.rotation);
      const measured = measureScreenAngle(angle.line.x2, angle.line.y2);
      expect(measured).toBeCloseTo(expected, 2);
    });
  });

  it("W9: chartNoHouses produces rotation=0, hasHouses=false, houses=null, angles=[]", () => {
    const geo = buildWheelGeometry(noHousesVM);

    expect(geo.hasHouses).toBe(false);
    expect(geo.houses).toBeNull();
    expect(geo.angles).toHaveLength(0);
    expect(geo.rotation).toBe(0);

    // Aries start at 180 degrees (since rotation=0)
    const aries = geo.signs[0]!;
    expect(
      measureScreenAngle(aries.boundary.x2, aries.boundary.y2),
    ).toBeCloseTo(180, 2);
  });

  it("W10: output does not contain planets or aspects keys", () => {
    const geo = buildWheelGeometry(fullVM);
    const keys = Object.keys(geo);
    expect(keys).not.toContain("planets");
    expect(keys).not.toContain("aspects");
  });

  it("W11: handles Whole Sign derived fixture correctly (narrow houses 1 & 12, label at true midpoint)", () => {
    // DERIVED Whole Sign fixture: cusp 1 = ASC (e.g. 14.5), cusps 2..12 = start of signs (30, 60, ... 330)
    const ascLong = 14.5;
    const wholeSignDTO: ChartResponse = {
      ...chartFull,
      houseSystem: "WholeSign",
      houses: [
        { number: 1, signOnCusp: "Aries", cuspDegree: ascLong },
        ...Array.from({ length: 11 }, (_, i) => ({
          number: i + 2,
          signOnCusp: KNOWN_ZODIAC_SIGNS[i + 1] ?? "Taurus",
          cuspDegree: (i + 1) * 30,
        })),
      ],
      angles: chartFull.angles.map((a) =>
        a.type === "Ascendant" ? { ...a, longitude: ascLong } : a,
      ),
    };

    const wsVM = toChartViewModel(wholeSignDTO);
    const geo = buildWheelGeometry(wsVM);

    expect(geo.houses).toHaveLength(12);

    // House 1 cusp matches ASC (theta = 180)
    const h1 = geo.houses![0]!;
    expect(measureScreenAngle(h1.cusp.x2, h1.cusp.y2)).toBeCloseTo(180, 2);

    // House 1 span is (30 - 14.5) = 15.5 degrees (< 30)
    const h1MidExpected = toScreenAngle(14.5 + 15.5 / 2, geo.rotation);
    expect(measureScreenAngle(h1.labelPoint.x, h1.labelPoint.y)).toBeCloseTo(
      h1MidExpected,
      2,
    );
  });

  it("W12: handles partial angle arrays without throwing", () => {
    // Only Ascendant
    const onlyAscVM = {
      ...fullVM,
      angles: fullVM.angles.filter((a) => a.key === "Ascendant"),
    };
    const geoAsc = buildWheelGeometry(onlyAscVM);
    expect(geoAsc.angles).toHaveLength(1);
    expect(geoAsc.angles[0]!.key).toBe("Ascendant");
    expect(geoAsc.rotation).toBe(fullVM.flags.ascendantLongitude);

    // Only Midheaven (no Ascendant => rotation = 0)
    const onlyMcVM = {
      ...fullVM,
      flags: { ...fullVM.flags, ascendantLongitude: null },
      angles: fullVM.angles.filter((a) => a.key === "Midheaven"),
    };
    const geoMc = buildWheelGeometry(onlyMcVM);
    expect(geoMc.angles).toHaveLength(1);
    expect(geoMc.angles[0]!.key).toBe("Midheaven");
    expect(geoMc.rotation).toBe(0);

    // Empty angles
    const emptyAnglesVM = { ...fullVM, angles: [] };
    const geoEmpty = buildWheelGeometry(emptyAnglesVM);
    expect(geoEmpty.angles).toHaveLength(0);
  });

  it("W13: omits unrecognized or unknown angles without throwing", () => {
    const unknownAngleVM = {
      ...fullVM,
      angles: [
        ...fullVM.angles,
        {
          key: "Vertex" as unknown as "Ascendant",
          known: false,
          shortLabel: "VTX",
          labelVi: "Điểm đỉnh",
          ariaLabel: "Điểm đỉnh (Vertex)",
          longitude: 150,
          sign: { key: "Leo", labelVi: "Sư Tử", glyph: "♌", known: true },
          degreeLabel: "0°00'",
        },
      ],
    };

    const geo = buildWheelGeometry(unknownAngleVM);
    expect(geo.angles).toHaveLength(4);
    expect(geo.angles.some((a) => a.shortLabel === "VTX")).toBe(false);
  });

  it("W14: sets rotation=0 when houseDataAvailable is true but ascendantLongitude is null", () => {
    const noAscVM = {
      ...fullVM,
      flags: { ...fullVM.flags, ascendantLongitude: null },
    };
    const geo = buildWheelGeometry(noAscVM);
    expect(geo.rotation).toBe(0);
    expect(geo.hasHouses).toBe(true);
  });

  it("W15: deterministic output and does not mutate deep-frozen VM", () => {
    const geo1 = buildWheelGeometry(fullVM);
    const geo2 = buildWheelGeometry(fullVM);
    expect(geo1).toStrictEqual(geo2);

    const frozenVM = JSON.parse(JSON.stringify(fullVM));
    Object.freeze(frozenVM);
    Object.freeze(frozenVM.flags);
    Object.freeze(frozenVM.houses);
    Object.freeze(frozenVM.angles);

    expect(() => buildWheelGeometry(frozenVM)).not.toThrow();
  });

  it("W16: throws WheelGeometryError when houseDataAvailable=true but houses contract is violated", () => {
    // 11 houses
    const elevenHousesVM = {
      ...fullVM,
      houses: fullVM.houses.slice(0, 11),
    };
    expect(() => buildWheelGeometry(elevenHousesVM)).toThrow(
      WheelGeometryError,
    );

    // Duplicate house numbers
    const dupHousesVM = {
      ...fullVM,
      houses: fullVM.houses.map((h, i) => (i === 1 ? { ...h, number: 1 } : h)),
    };
    expect(() => buildWheelGeometry(dupHousesVM)).toThrow(WheelGeometryError);
  });

  it("W17: coordinates are rounded to at most 3 decimal places without -0", () => {
    const geo = buildWheelGeometry(fullVM);

    // Check signs
    geo.signs.forEach((s) => {
      [s.boundary.x1, s.boundary.y1, s.boundary.x2, s.boundary.y2].forEach(
        (val) => {
          expect(Object.is(val, -0)).toBe(false);
          const decimals = (val.toString().split(".")[1] || "").length;
          expect(decimals).toBeLessThanOrEqual(3);
        },
      );
      [s.glyphPoint.x, s.glyphPoint.y].forEach((val) => {
        expect(Object.is(val, -0)).toBe(false);
        const decimals = (val.toString().split(".")[1] || "").length;
        expect(decimals).toBeLessThanOrEqual(3);
      });
    });

    // Check ticks
    geo.ticks.forEach((t) => {
      [t.x1, t.y1, t.x2, t.y2].forEach((val) => {
        expect(Object.is(val, -0)).toBe(false);
        const decimals = (val.toString().split(".")[1] || "").length;
        expect(decimals).toBeLessThanOrEqual(3);
      });
    });
  });

  it("W18: contract note: fixture contract is verified by integration suite", () => {
    expect(fullVM.meta.houseSystem.key).toBe("Placidus");
  });

  it("W19: handles boundary rotation values (0, 359.9999, 29.9999) without NaN", () => {
    const boundaryRotations = [0, 359.9999, 29.9999];
    boundaryRotations.forEach((rot) => {
      const vm = {
        ...fullVM,
        flags: { ...fullVM.flags, ascendantLongitude: rot },
      };
      const geo = buildWheelGeometry(vm);
      expect(geo.rotation).toBe(rot);
      expect(Number.isNaN(geo.signs[0]!.boundary.x1)).toBe(false);
      expect(Number.isNaN(geo.ticks[0]!.x1)).toBe(false);
      expect(Number.isNaN(geo.houses![0]!.cusp.x1)).toBe(false);
      expect(Number.isNaN(geo.angles[0]!.line.x1)).toBe(false);
    });
  });
});
