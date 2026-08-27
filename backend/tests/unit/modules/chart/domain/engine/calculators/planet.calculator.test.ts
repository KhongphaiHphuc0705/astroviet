import { describe, it, expect } from 'vitest';

import { PlanetCalculator } from '../../../../../../../src/modules/chart/domain/engine/calculators/planet.calculator.js';
import { DataIntegrityError } from '../../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import { RawEphemerisData } from '../../../../../../../src/modules/chart/domain/ports/ephemeris-provider.port.js';
import {
  PlanetName,
  PlanetCategory,
} from '../../../../../../../src/modules/chart/domain/types/chart.types.js';

describe('PlanetCalculator', () => {
  // A helper function to create a complete mock of 14 planets
  const createMockRawEphemeris = (
    overrides: Record<string, Partial<any>> = {},
  ): RawEphemerisData => {
    const allNames = [
      PlanetName.Sun,
      PlanetName.Moon,
      PlanetName.Mercury,
      PlanetName.Venus,
      PlanetName.Mars,
      PlanetName.Jupiter,
      PlanetName.Saturn,
      PlanetName.Uranus,
      PlanetName.Neptune,
      PlanetName.Pluto,
      PlanetName.Chiron,
      PlanetName.NorthNode,
      PlanetName.SouthNode,
      PlanetName.Lilith,
    ];

    const planets = allNames.map((name) => {
      const base = {
        name,
        longitude: 0,
        latitude: 0,
        speed: 1, // Standard positive speed (direct)
      };
      if (overrides[name]) {
        return { ...base, ...overrides[name] };
      }
      return base;
    });

    return { planets };
  };

  it('should return exactly 10 standard planets when includeOptionalPoints is empty (TR-20)', () => {
    const rawData = createMockRawEphemeris();
    const result = PlanetCalculator.calculate(rawData, []);

    expect(result).toHaveLength(10);
    const names = result.map((p) => p.name);
    expect(names).not.toContain(PlanetName.Chiron);
    expect(names).not.toContain(PlanetName.NorthNode);
    expect(names).not.toContain(PlanetName.SouthNode);
    expect(names).not.toContain(PlanetName.Lilith);
  });

  it('should include optional points if explicitly requested (TR-21)', () => {
    const rawData = createMockRawEphemeris();
    const result = PlanetCalculator.calculate(rawData, [PlanetName.Chiron, PlanetName.NorthNode]);

    expect(result).toHaveLength(12);
    const names = result.map((p) => p.name);
    expect(names).toContain(PlanetName.Chiron);
    expect(names).toContain(PlanetName.NorthNode);
    // Should NOT contain unrequested ones
    expect(names).not.toContain(PlanetName.SouthNode);
  });

  it('should correctly set isRetrograde=true for negative speed (TR-12)', () => {
    const rawData = createMockRawEphemeris({
      [PlanetName.Mercury]: { speed: -0.5 },
      [PlanetName.Venus]: { speed: 1.2 },
    });

    const result = PlanetCalculator.calculate(rawData, []);

    const mercury = result.find((p) => p.name === PlanetName.Mercury);
    const venus = result.find((p) => p.name === PlanetName.Venus);

    expect(mercury?.isRetrograde).toBe(true);
    expect(venus?.isRetrograde).toBe(false);
  });

  it('should let DataIntegrityError bubble up if Sun or Moon is retrograde (TR-13, INV-14)', () => {
    const rawDataSun = createMockRawEphemeris({
      [PlanetName.Sun]: { speed: -0.1 },
    });

    expect(() => PlanetCalculator.calculate(rawDataSun, [])).toThrowError(DataIntegrityError);

    const rawDataMoon = createMockRawEphemeris({
      [PlanetName.Moon]: { speed: -0.1 },
    });

    expect(() => PlanetCalculator.calculate(rawDataMoon, [])).toThrowError(DataIntegrityError);
  });

  it('should accurately calculate Zodiac position and degree in sign (TR-2)', () => {
    const rawData = createMockRawEphemeris({
      [PlanetName.Mars]: { longitude: 195.5 }, // 195.5 -> Libra (index 6, 180-210), 15.5 degree
    });

    const result = PlanetCalculator.calculate(rawData, []);
    const mars = result.find((p) => p.name === PlanetName.Mars);

    expect(mars?.zodiacPosition.sign).toBe('Libra');
    expect(mars?.zodiacPosition.degreeInSign).toBe(15.5);
    expect(mars?.longitude).toBe(195.5);
  });

  it('should normalize negative longitude effectively through ZodiacPosition', () => {
    const rawData = createMockRawEphemeris({
      [PlanetName.Jupiter]: { longitude: -10 }, // -10 -> 350 -> Pisces
    });

    const result = PlanetCalculator.calculate(rawData, []);
    const jupiter = result.find((p) => p.name === PlanetName.Jupiter);

    expect(jupiter?.zodiacPosition.sign).toBe('Pisces');
    expect(jupiter?.zodiacPosition.degreeInSign).toBe(20); // 350 - 330
    expect(jupiter?.longitude).toBe(350);
  });

  it('should always set house to null', () => {
    const rawData = createMockRawEphemeris();
    const result = PlanetCalculator.calculate(rawData, [PlanetName.Chiron]);

    for (const planet of result) {
      expect(planet.house).toBeNull();
    }
  });

  it('should assign correct PlanetCategory based on domain rules', () => {
    const rawData = createMockRawEphemeris();
    const result = PlanetCalculator.calculate(rawData, [
      PlanetName.Chiron,
      PlanetName.Lilith,
      PlanetName.NorthNode,
      PlanetName.SouthNode,
    ]);

    const findCat = (name: PlanetName) => result.find((p) => p.name === name)?.category;

    expect(findCat(PlanetName.Sun)).toBe(PlanetCategory.Personal);
    expect(findCat(PlanetName.Mercury)).toBe(PlanetCategory.Personal);

    expect(findCat(PlanetName.Jupiter)).toBe(PlanetCategory.Social);
    expect(findCat(PlanetName.Saturn)).toBe(PlanetCategory.Social);

    expect(findCat(PlanetName.Uranus)).toBe(PlanetCategory.Outer);

    // Optional points are designated as Outer natively in this engine iteration (Decision M3-2)
    expect(findCat(PlanetName.Chiron)).toBe(PlanetCategory.Outer);
    expect(findCat(PlanetName.Lilith)).toBe(PlanetCategory.Outer);
    expect(findCat(PlanetName.NorthNode)).toBe(PlanetCategory.Outer);
    expect(findCat(PlanetName.SouthNode)).toBe(PlanetCategory.Outer);
  });
});
