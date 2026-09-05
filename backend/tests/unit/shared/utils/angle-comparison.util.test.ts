import { describe, expect, it } from 'vitest';

import {
  circularDelta,
  isWithinAngleTolerance,
  normalizeAngle,
} from '../../../../src/shared/utils/angle-comparison.util.js';

describe('Angle Comparison Utility', () => {
  describe('normalizeAngle', () => {
    it('should leave angles between 0 and 360 unchanged', () => {
      expect(normalizeAngle(0)).toBe(0);
      expect(normalizeAngle(180)).toBe(180);
      expect(normalizeAngle(359.99)).toBe(359.99);
    });

    it('should wrap around angles greater than or equal to 360', () => {
      expect(normalizeAngle(360)).toBe(0);
      expect(normalizeAngle(361)).toBe(1);
      expect(normalizeAngle(725)).toBe(5);
    });

    it('should wrap around negative angles', () => {
      expect(normalizeAngle(-1)).toBe(359);
      expect(normalizeAngle(-180)).toBe(180);
      expect(normalizeAngle(-365)).toBe(355);
    });
  });

  describe('circularDelta', () => {
    it('should calculate the normal absolute difference for simple cases', () => {
      expect(circularDelta(10, 20)).toBe(10);
      expect(circularDelta(20, 10)).toBe(10);
      expect(circularDelta(100, 200)).toBe(100);
    });

    it('should calculate the shortest path across the 360/0 boundary', () => {
      expect(circularDelta(350, 10)).toBe(20);
      expect(circularDelta(10, 350)).toBe(20);
    });

    it('should correctly handle decimal wrap-arounds', () => {
      expect(circularDelta(359.999, 0.001)).toBeCloseTo(0.002, 5);
      expect(circularDelta(0.001, 359.999)).toBeCloseTo(0.002, 5);
    });

    it('should handle negative numbers as arguments', () => {
      expect(circularDelta(-10, 10)).toBe(20);
      expect(circularDelta(-350, 10)).toBe(0);
    });
  });

  describe('isWithinAngleTolerance', () => {
    it('should return true if within tolerance', () => {
      expect(isWithinAngleTolerance(359.999, 0.001, 0.01)).toBe(true); // Delta: 0.002
      expect(isWithinAngleTolerance(180, 180.005, 0.01)).toBe(true);
    });

    it('should return false if outside tolerance', () => {
      expect(isWithinAngleTolerance(359.9, 0.1, 0.01)).toBe(false); // Delta: 0.2
      expect(isWithinAngleTolerance(180, 181, 0.01)).toBe(false);
    });
  });
});
