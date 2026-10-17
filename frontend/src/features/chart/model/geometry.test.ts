import { describe, expect, it } from "vitest";

import {
  arcPath,
  normalizeLongitude,
  polarToCartesian,
  roundCoord,
  sectorMidAngle,
  toScreenAngle,
  WHEEL_CENTER,
  WHEEL_MIN_DISPLAY_PX,
  WHEEL_RADII,
  WHEEL_VIEWBOX_SIZE,
} from "./geometry";

describe("geometry primitives (M4.1: G1 - G10)", () => {
  describe("G1 & G2: normalizeLongitude", () => {
    it("G1: normalizes valid values into [0, 360) and never returns 360", () => {
      expect(normalizeLongitude(0)).toBe(0);
      expect(normalizeLongitude(360)).toBe(0);
      expect(normalizeLongitude(-360)).toBe(0);
      expect(normalizeLongitude(720.5)).toBeCloseTo(0.5, 9);
      expect(normalizeLongitude(-0.0001)).toBeCloseTo(359.9999, 9);
      expect(normalizeLongitude(359.9999999)).toBeCloseTo(359.9999999, 9);
      expect(normalizeLongitude(360 - 1e-12)).toBeLessThan(360);
      expect(normalizeLongitude(360 - 1e-12)).toBeGreaterThanOrEqual(0);
    });

    it("G2: throws RangeError for NaN, Infinity, -Infinity", () => {
      expect(() => normalizeLongitude(Number.NaN)).toThrow(RangeError);
      expect(() => normalizeLongitude(Number.POSITIVE_INFINITY)).toThrow(
        RangeError,
      );
      expect(() => normalizeLongitude(Number.NEGATIVE_INFINITY)).toThrow(
        RangeError,
      );
    });
  });

  describe("G3 & G4: toScreenAngle", () => {
    it("G3: maps cardinal relative longitudes correctly (ASC to 180, bottom 270, DSC 0, top 90)", () => {
      const rot = 45;
      expect(toScreenAngle(rot, rot)).toBe(180);
      expect(toScreenAngle(rot + 90, rot)).toBe(270);
      expect(toScreenAngle(rot + 180, rot)).toBe(0);
      expect(toScreenAngle(rot + 270, rot)).toBe(90);
    });

    it("G4: correctly handles 0/360 wrap-around when lambda=0 and rot=350", () => {
      // 180 + (0 - 350) = 180 - 350 = -170 => normalized to 190
      expect(toScreenAngle(0, 350)).toBe(190);
    });

    it("throws RangeError if arguments are not finite", () => {
      expect(() => toScreenAngle(Number.NaN, 0)).toThrow(RangeError);
      expect(() => toScreenAngle(0, Number.POSITIVE_INFINITY)).toThrow(
        RangeError,
      );
    });
  });

  describe("G5, G6 & G7: polarToCartesian", () => {
    const cx = 300;
    const cy = 300;
    const r = 100;

    it("G5: computes exact cardinal positions in SVG space (y down)", () => {
      // theta = 0 => (400, 300)
      const p0 = polarToCartesian(cx, cy, r, 0);
      expect(p0.x).toBeCloseTo(400, 6);
      expect(p0.y).toBeCloseTo(300, 6);

      // theta = 90 => (300, 200) [top]
      const p90 = polarToCartesian(cx, cy, r, 90);
      expect(p90.x).toBeCloseTo(300, 6);
      expect(p90.y).toBeCloseTo(200, 6);

      // theta = 180 => (200, 300) [left / ASC]
      const p180 = polarToCartesian(cx, cy, r, 180);
      expect(p180.x).toBeCloseTo(200, 6);
      expect(p180.y).toBeCloseTo(300, 6);

      // theta = 270 => (300, 400) [bottom]
      const p270 = polarToCartesian(cx, cy, r, 270);
      expect(p270.x).toBeCloseTo(300, 6);
      expect(p270.y).toBeCloseTo(400, 6);
    });

    it("G6: theta and theta + 180 are symmetrical across center", () => {
      const angles = [15, 45, 123.45, 260];
      for (const theta of angles) {
        const p1 = polarToCartesian(cx, cy, r, theta);
        const p2 = polarToCartesian(cx, cy, r, theta + 180);

        expect((p1.x + p2.x) / 2).toBeCloseTo(cx, 3);
        expect((p1.y + p2.y) / 2).toBeCloseTo(cy, 3);
      }
    });

    it("G7: r=0 returns center; negative or non-finite r throws RangeError", () => {
      expect(polarToCartesian(cx, cy, 0, 45)).toEqual({ x: cx, y: cy });
      expect(() => polarToCartesian(cx, cy, -10, 45)).toThrow(RangeError);
      expect(() =>
        polarToCartesian(cx, cy, Number.POSITIVE_INFINITY, 45),
      ).toThrow(RangeError);
      expect(() => polarToCartesian(cx, cy, r, Number.NaN)).toThrow(RangeError);
    });
  });

  describe("G8 & G9: arcPath", () => {
    const cx = 300;
    const cy = 300;
    const rOuter = 260;
    const rInner = 225;

    it("G8: generates valid SVG path with matching start/end points and correct sweep/large-arc flags", () => {
      const startAngle = 165;
      const span = 30;
      const path = arcPath(cx, cy, rOuter, rInner, startAngle, span);

      const p1 = polarToCartesian(cx, cy, rOuter, startAngle);
      const p2 = polarToCartesian(cx, cy, rOuter, startAngle + span);
      const p3 = polarToCartesian(cx, cy, rInner, startAngle + span);
      const p4 = polarToCartesian(cx, cy, rInner, startAngle);

      expect(path).toBe(
        `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 0 0 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 0 1 ${p4.x} ${p4.y} Z`,
      );
    });

    it("G9: sets large-arc=1 when span > 180 and throws for invalid spans or radii", () => {
      const pathLarge = arcPath(cx, cy, rOuter, rInner, 10, 200);
      expect(pathLarge).toContain(`A ${rOuter} ${rOuter} 0 1 0`);
      expect(pathLarge).toContain(`A ${rInner} ${rInner} 0 1 1`);

      // Invalid span
      expect(() => arcPath(cx, cy, rOuter, rInner, 0, 0)).toThrow(RangeError);
      expect(() => arcPath(cx, cy, rOuter, rInner, 0, -10)).toThrow(RangeError);
      expect(() => arcPath(cx, cy, rOuter, rInner, 0, 360)).toThrow(RangeError);
      expect(() => arcPath(cx, cy, rOuter, rInner, 0, 400)).toThrow(RangeError);

      // Invalid radii
      expect(() => arcPath(cx, cy, 200, 200, 0, 30)).toThrow(RangeError);
      expect(() => arcPath(cx, cy, 150, 200, 0, 30)).toThrow(RangeError);
      expect(() => arcPath(cx, cy, 200, -10, 0, 30)).toThrow(RangeError);
    });
  });

  describe("G10: sectorMidAngle", () => {
    it("G10: computes mid-angle with wrap-around, narrow houses, and wide spans", () => {
      expect(sectorMidAngle(350, 20)).toBeCloseTo(5, 9);
      expect(sectorMidAngle(0, 30)).toBeCloseTo(15, 9);
      expect(sectorMidAngle(14.89, 30)).toBeCloseTo(22.445, 9);
      expect(sectorMidAngle(20, 20)).toBe(20);
      expect(sectorMidAngle(300, 60)).toBe(0);
    });

    it("throws RangeError if arguments are not finite", () => {
      expect(() => sectorMidAngle(Number.NaN, 20)).toThrow(RangeError);
      expect(() => sectorMidAngle(0, Number.POSITIVE_INFINITY)).toThrow(
        RangeError,
      );
    });
  });

  describe("roundCoord & Constants", () => {
    it("roundCoord rounds to 3 decimal places and normalizes -0 to 0", () => {
      expect(roundCoord(12.3456)).toBe(12.346);
      expect(roundCoord(-0)).toBe(0);
      expect(Object.is(roundCoord(-0), 0)).toBe(true);
      expect(() => roundCoord(Number.NaN)).toThrow(RangeError);
    });

    it("exports layout constants with correct values", () => {
      expect(WHEEL_VIEWBOX_SIZE).toBe(600);
      expect(WHEEL_CENTER).toBe(300);
      expect(WHEEL_MIN_DISPLAY_PX).toBe(400);
      expect(WHEEL_RADII.signOuter).toBe(260);
      expect(WHEEL_RADII.signInner).toBe(225);
      expect(WHEEL_RADII.tickOuter).toBe(225);
      expect(WHEEL_RADII.tickInner).toBe(215);
      expect(WHEEL_RADII.houseOuter).toBe(215);
      expect(WHEEL_RADII.houseInner).toBe(175);
      expect(WHEEL_RADII.angleLabel).toBe(282);
      expect(WHEEL_RADII.planetMarkerOuter).toBe(175);
      expect(WHEEL_RADII.planetMarkerInner).toBe(168);
      expect(WHEEL_RADII.planetLaneA).toBe(141);
      expect(WHEEL_RADII.planetLaneB).toBe(146);
      expect(WHEEL_RADII.planetZoneInner).toBe(114);
    });
  });
});
