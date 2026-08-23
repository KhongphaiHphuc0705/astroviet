import { describe, it, expect } from 'vitest';

import { Planet } from '../../../../../../src/modules/chart/domain/entities/planet.entity.js';
import { DataIntegrityError } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import {
  PlanetName,
  PlanetCategory,
} from '../../../../../../src/modules/chart/domain/types/chart.types.js';
import { ZodiacPosition } from '../../../../../../src/modules/chart/domain/value-objects/zodiac-position.vo.js';

describe('Planet Entity', () => {
  const validProps = {
    id: 'test-id',
    name: PlanetName.Sun,
    category: PlanetCategory.Personal,
    longitude: 15,
    latitude: 0,
    speed: 1,
    isRetrograde: false,
    zodiacPosition: ZodiacPosition.fromLongitude(15),
    house: 1,
  };

  it('should create correctly with valid props', () => {
    const planet = Planet.create(validProps);
    expect(planet.id).toBe(validProps.id);
    expect(planet.longitude).toBe(validProps.longitude);
  });

  it('should throw DataIntegrityError if longitude < 0', () => {
    expect(() => {
      Planet.create({ ...validProps, longitude: -1 });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if longitude >= 360', () => {
    expect(() => {
      Planet.create({ ...validProps, longitude: 360 });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if Sun is retrograde', () => {
    expect(() => {
      Planet.create({ ...validProps, name: PlanetName.Sun, isRetrograde: true });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if Moon is retrograde', () => {
    expect(() => {
      Planet.create({ ...validProps, name: PlanetName.Moon, isRetrograde: true });
    }).toThrow(DataIntegrityError);
  });

  it('should allow other planets to be retrograde', () => {
    expect(() => {
      Planet.create({ ...validProps, name: PlanetName.Mercury, isRetrograde: true });
    }).not.toThrow();
  });

  it('should reconstitute correctly', () => {
    const planet = Planet.reconstitute({ ...validProps, longitude: 500 });
    // Reconstitute skips validation
    expect(planet.longitude).toBe(500);
  });
});
