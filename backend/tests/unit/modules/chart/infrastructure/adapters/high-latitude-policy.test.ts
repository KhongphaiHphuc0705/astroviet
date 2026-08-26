import { describe, it, expect } from 'vitest';

import {
  isAboveConvergenceLatitude,
  CONVERGENCE_LATITUDE_THRESHOLD,
} from '../../../../../../src/modules/chart/infrastructure/adapters/high-latitude-policy.js';

describe('highLatitudePolicy', () => {
  describe('isAboveConvergenceLatitude', () => {
    it('should return false for normal latitudes', () => {
      expect(isAboveConvergenceLatitude(40.7128)).toBe(false); // NYC
      expect(isAboveConvergenceLatitude(0)).toBe(false); // Equator
      expect(isAboveConvergenceLatitude(-33.8688)).toBe(false); // Sydney
    });

    it('should return false for latitudes exactly on the threshold', () => {
      // 66.5 is the exact threshold, so it should NOT be "above"
      expect(isAboveConvergenceLatitude(CONVERGENCE_LATITUDE_THRESHOLD)).toBe(false);
      expect(isAboveConvergenceLatitude(-CONVERGENCE_LATITUDE_THRESHOLD)).toBe(false);
    });

    it('should return true for latitudes slightly above the threshold', () => {
      expect(isAboveConvergenceLatitude(66.51)).toBe(true);
      expect(isAboveConvergenceLatitude(-66.51)).toBe(true);
    });

    it('should return true for extreme latitudes', () => {
      expect(isAboveConvergenceLatitude(80)).toBe(true);
      expect(isAboveConvergenceLatitude(89.9)).toBe(true);
      expect(isAboveConvergenceLatitude(-75)).toBe(true);
    });
  });
});
