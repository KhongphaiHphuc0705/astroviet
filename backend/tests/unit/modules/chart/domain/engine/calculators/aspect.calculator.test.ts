import { describe, it, expect } from 'vitest';

import { AspectCalculator } from '../../../../../../../src/modules/chart/domain/engine/calculators/aspect.calculator.js';
import { Planet } from '../../../../../../../src/modules/chart/domain/entities/planet.entity.js';
import {
  PlanetName,
  PlanetCategory,
} from '../../../../../../../src/modules/chart/domain/types/chart.types.js';
import { ZodiacPosition } from '../../../../../../../src/modules/chart/domain/value-objects/zodiac-position.vo.js';

describe('AspectCalculator', () => {
  const createPlanet = (name: PlanetName, longitude: number, speed: number = 1): Planet => {
    return Planet.create({
      id: 'test-id',
      name,
      category: PlanetCategory.Personal, // Category is not used for orb logic, just required for creation
      longitude,
      latitude: 0,
      speed,
      isRetrograde: speed < 0,
      zodiacPosition: ZodiacPosition.fromLongitude(longitude),
      house: null,
    });
  };

  it('should detect an exact square aspect (TR-8)', () => {
    const p1 = createPlanet(PlanetName.Sun, 10);
    const p2 = createPlanet(PlanetName.Moon, 100); // Exactly 90 degrees apart

    const aspects = AspectCalculator.calculate([p1, p2]);

    expect(aspects).toHaveLength(1);
    expect(aspects[0]?.aspectType).toBe('Square');
    expect(aspects[0]?.exactAngle).toBe(90);
    expect(aspects[0]?.orb).toBe(0);
  });

  it('should detect an aspect within orb boundary (TR-9)', () => {
    const p1 = createPlanet(PlanetName.Sun, 10);
    const p2 = createPlanet(PlanetName.Mars, 107); // Separation = 97. Square ideal = 90. Orb = 7. Max personal orb for Square = 7.

    const aspects = AspectCalculator.calculate([p1, p2]);

    expect(aspects).toHaveLength(1);
    expect(aspects[0]?.aspectType).toBe('Square');
    expect(aspects[0]?.exactAngle).toBe(97);
    expect(aspects[0]?.orb).toBe(7);
  });

  it('should not detect an aspect slightly outside the orb boundary (TR-10)', () => {
    const p1 = createPlanet(PlanetName.Sun, 10);
    const p2 = createPlanet(PlanetName.Mars, 107.01); // Orb = 7.01 > 7

    const aspects = AspectCalculator.calculate([p1, p2]);

    expect(aspects).toHaveLength(0);
  });

  it('should apply narrower orbs when both planets are NonPersonal (D-5)', () => {
    const p1 = createPlanet(PlanetName.Jupiter, 10);
    const p2 = createPlanet(PlanetName.Saturn, 105.5); // Orb = 5.5. Max allowed = 5.

    const aspects1 = AspectCalculator.calculate([p1, p2]);
    expect(aspects1).toHaveLength(0); // 5.5 > 5

    const p3 = createPlanet(PlanetName.Saturn, 105); // Orb = 5
    const aspects2 = AspectCalculator.calculate([p1, p3]);
    expect(aspects2).toHaveLength(1);
    expect(aspects2[0]?.aspectType).toBe('Square');
  });

  it('should apply Personal (wider) orb if at least one planet is Personal (Decision M3-8)', () => {
    // Sun is Personal, Jupiter is NonPersonal.
    // Square max orb for Personal is 7, for NonPersonal is 5.
    // If we have a separation of 96.5, orb is 6.5.
    // It should be detected as a Square because 6.5 <= 7 (Personal orb wins).
    const p1 = createPlanet(PlanetName.Sun, 10);
    const p2 = createPlanet(PlanetName.Jupiter, 106.5);

    const aspects = AspectCalculator.calculate([p1, p2]);

    expect(aspects).toHaveLength(1);
    expect(aspects[0]?.aspectType).toBe('Square');
    expect(aspects[0]?.orb).toBeCloseTo(6.5, 5);
  });

  it('should order planets alphabetically in canonical ordering (TR-11)', () => {
    const p1 = createPlanet(PlanetName.Sun, 10); // 'Sun' > 'Moon'
    const p2 = createPlanet(PlanetName.Moon, 10);

    const aspects = AspectCalculator.calculate([p1, p2]);

    expect(aspects).toHaveLength(1);
    expect(aspects[0]?.planetA).toBe(PlanetName.Moon);
    expect(aspects[0]?.planetB).toBe(PlanetName.Sun);
  });

  it('should correctly calculate angular separation across the 0/360 boundary (TR-18)', () => {
    const p1 = createPlanet(PlanetName.Sun, 358);
    const p2 = createPlanet(PlanetName.Moon, 4); // Separation = 6. Max Conjunction orb = 8.

    const aspects = AspectCalculator.calculate([p1, p2]);

    expect(aspects).toHaveLength(1);
    expect(aspects[0]?.aspectType).toBe('Conjunction');
    expect(aspects[0]?.exactAngle).toBe(6);
    expect(aspects[0]?.orb).toBe(6);
  });

  it('should correctly determine isApplying when planets are getting closer', () => {
    const p1 = createPlanet(PlanetName.Sun, 10, 1);
    const p2 = createPlanet(PlanetName.Moon, 16, 0); // Separation = 6 (orb 6 <= 8 max allowed)

    const aspects = AspectCalculator.calculate([p1, p2]);

    expect(aspects).toHaveLength(1);
    expect(aspects[0]?.isApplying).toBe(true);
  });

  it('should correctly determine isApplying when planets are moving apart', () => {
    // Mars can be retrograde, Sun cannot
    const p1 = createPlanet(PlanetName.Mars, 10, -1);
    const p2 = createPlanet(PlanetName.Moon, 16, 0); // Separation = 6. Next is 9 and 16 -> Sep = 7. (Moving apart)

    const aspects = AspectCalculator.calculate([p1, p2]);

    expect(aspects).toHaveLength(1);
    expect(aspects[0]?.isApplying).toBe(false);
  });
});
