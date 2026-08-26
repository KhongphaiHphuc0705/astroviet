import SwissEph from 'swisseph-wasm';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

import { UnsupportedChartTypeError } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import {
  PlanetName,
  HouseSystem,
} from '../../../../../../src/modules/chart/domain/types/chart.types.js';
import { CONVERGENCE_LATITUDE_THRESHOLD } from '../../../../../../src/modules/chart/infrastructure/adapters/high-latitude-policy.js';
import { SwissEphemerisAdapter } from '../../../../../../src/modules/chart/infrastructure/adapters/swiss-ephemeris.adapter.js';
import { ExternalServiceError } from '../../../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../../../src/shared/errors/error-codes.js';

describe('SwissEphemerisAdapter Integration', () => {
  let swe: SwissEph;
  let adapter: SwissEphemerisAdapter;

  beforeAll(async () => {
    // We are testing with real WASM
    swe = new SwissEph();
    await swe.initSwissEph();
    adapter = new SwissEphemerisAdapter(swe);
  });

  afterAll(() => {
    swe.close();
  });

  describe('calculateNatal', () => {
    it('should calculate 14 celestial bodies with correct shape', async () => {
      const request = {
        utcDateTime: new Date('1990-05-15T14:30:00Z'),
        coordinates: { latitude: 40.7128, longitude: -74.006 },
      };

      const result = await adapter.calculateNatal(request);

      expect(result.planets).toHaveLength(14);

      const planetNames = result.planets.map((p) => p.name);
      expect(planetNames).toContain(PlanetName.Sun);
      expect(planetNames).toContain(PlanetName.Moon);
      expect(planetNames).toContain(PlanetName.NorthNode);
      expect(planetNames).toContain(PlanetName.SouthNode);
      expect(planetNames).toContain(PlanetName.Chiron);
      expect(planetNames).toContain(PlanetName.Lilith);

      const sun = result.planets.find((p) => p.name === PlanetName.Sun)!;
      expect(sun.longitude).toBeGreaterThanOrEqual(0);
      expect(sun.longitude).toBeLessThan(360);
      expect(typeof sun.latitude).toBe('number');
      expect(typeof sun.speed).toBe('number');

      const northNode = result.planets.find((p) => p.name === PlanetName.NorthNode)!;
      const southNode = result.planets.find((p) => p.name === PlanetName.SouthNode)!;

      expect(southNode.longitude).toBeCloseTo((northNode.longitude + 180) % 360, 5);
      expect(southNode.latitude).toBe(0);
      expect(southNode.speed).toBe(0);
    });

    it('should translate underlying errors to ExternalServiceError', async () => {
      // Mock sweeping error
      const mockSwe = {
        julday: vi.fn().mockImplementation(() => {
          throw new Error('C++ exception');
        }),
      } as unknown as SwissEph;

      const failingAdapter = new SwissEphemerisAdapter(mockSwe);

      const request = {
        utcDateTime: new Date(),
        coordinates: { latitude: 0, longitude: 0 },
      };

      await expect(failingAdapter.calculateNatal(request)).rejects.toThrowError(
        ExternalServiceError,
      );
      await expect(failingAdapter.calculateNatal(request)).rejects.toHaveProperty(
        'errorCode',
        ErrorCode.EPHEMERIS_PROVIDER_ERROR,
      );
    });
  });

  describe('calculateHouses', () => {
    it('should calculate Placidus houses correctly for normal latitude', async () => {
      const request = {
        utcDateTime: new Date('2000-06-21T00:00:00Z'),
        coordinates: { latitude: 40.7128, longitude: -74.006 },
        houseSystem: HouseSystem.Placidus,
      };

      const result = await adapter.calculateHouses(request);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.cusps).toHaveLength(12);
        expect(typeof result.data.ascendant).toBe('number');
        expect(typeof result.data.midheaven).toBe('number');

        // Ensure index 0 of raw SWISSEPH is sliced out correctly
        // The first cusp should be valid longitude [0, 360)
        expect(result.data.cusps[0]).toBeGreaterThanOrEqual(0);
        expect(result.data.cusps[0]).toBeLessThan(360);
      }
    });

    it('should calculate Placidus houses correctly for specific reference coordinates (Technical Spike data)', async () => {
      // Reference data from Technical Spike:
      // Date: 2000-06-21T12:00:00Z
      // Lat: 60, Lng: 0
      // Expected cusps[0..2] (Houses 1-3): 179.99, 201.69, 231.00
      // This test ensures we sliced index 1-12 correctly and avoided the off-by-one bug.
      const request = {
        utcDateTime: new Date('2000-06-21T12:00:00Z'),
        coordinates: { latitude: 60, longitude: 0 },
        houseSystem: HouseSystem.Placidus,
      };

      const result = await adapter.calculateHouses(request);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.cusps).toHaveLength(12);

        // Match specific values to prevent silent slice offset errors
        expect(result.data.cusps[0]).toBeCloseTo(179.99, 1);
        expect(result.data.cusps[1]).toBeCloseTo(201.69, 1);
        expect(result.data.cusps[2]).toBeCloseTo(231.0, 1);
      }
    });

    it('should calculate Whole Sign houses correctly (separated by exactly 30 degrees)', async () => {
      const request = {
        utcDateTime: new Date('2000-06-21T00:00:00Z'),
        coordinates: { latitude: 40.7128, longitude: -74.006 },
        houseSystem: HouseSystem.WholeSign,
      };

      const result = await adapter.calculateHouses(request);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.cusps).toHaveLength(12);

        // Check if cusps are ~30 degrees apart
        const cusp1 = result.data.cusps[0];
        const cusp2 = result.data.cusps[1];

        let diff = Math.abs(cusp2 - cusp1);
        if (diff > 180) diff = 360 - diff;

        expect(diff).toBeCloseTo(30, 1);
      }
    });

    it('should return not_convergent for extreme latitudes', async () => {
      const request = {
        utcDateTime: new Date('2000-06-21T00:00:00Z'),
        coordinates: { latitude: 70, longitude: -74.006 },
        houseSystem: HouseSystem.Placidus,
      };

      const result = await adapter.calculateHouses(request);
      expect(result.status).toBe('not_convergent');
    });

    it('should return success for threshold exact latitude', async () => {
      const request = {
        utcDateTime: new Date('2000-06-21T00:00:00Z'),
        coordinates: { latitude: CONVERGENCE_LATITUDE_THRESHOLD, longitude: -74.006 },
        houseSystem: HouseSystem.Placidus,
      };

      const result = await adapter.calculateHouses(request);
      expect(result.status).toBe('success');
    });

    it('should translate underlying errors to ExternalServiceError', async () => {
      const mockSwe = {
        houses: vi.fn().mockImplementation(() => {
          throw new Error('C++ exception');
        }),
        julday: vi.fn().mockReturnValue(2451545),
      } as unknown as SwissEph;

      const failingAdapter = new SwissEphemerisAdapter(mockSwe);

      const request = {
        utcDateTime: new Date(),
        coordinates: { latitude: 0, longitude: 0 },
        houseSystem: HouseSystem.Placidus,
      };

      await expect(failingAdapter.calculateHouses(request)).rejects.toThrowError(
        ExternalServiceError,
      );
    });
  });

  describe('calculateTransit', () => {
    it('should throw UnsupportedChartTypeError', async () => {
      const request = {
        utcDateTime: new Date(),
        coordinates: { latitude: 0, longitude: 0 },
      };

      await expect(adapter.calculateTransit(request)).rejects.toThrowError(
        UnsupportedChartTypeError,
      );
    });
  });

  describe('Uninitialized SwissEph', () => {
    it('should throw if used before initSwissEph', async () => {
      const uninitSwe = new SwissEph();
      // Notice we are NOT calling await initSwissEph()
      const uninitAdapter = new SwissEphemerisAdapter(uninitSwe);

      const request = {
        utcDateTime: new Date(),
        coordinates: { latitude: 0, longitude: 0 },
      };

      await expect(uninitAdapter.calculateNatal(request)).rejects.toThrowError(
        ExternalServiceError,
      );
    });
  });
});
