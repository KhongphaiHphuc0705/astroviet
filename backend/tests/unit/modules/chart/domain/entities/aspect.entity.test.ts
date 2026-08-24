import { describe, it, expect } from 'vitest';

import { Aspect } from '../../../../../../src/modules/chart/domain/entities/aspect.entity.js';
import { DataIntegrityError } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import {
  PlanetName,
  AspectType,
} from '../../../../../../src/modules/chart/domain/types/chart.types.js';

describe('Aspect Entity', () => {
  const validProps = {
    id: 'test-id',
    planetA: PlanetName.Moon,
    planetB: PlanetName.Sun,
    aspectType: AspectType.Conjunction,
    exactAngle: 0,
    orb: 1.5,
    isApplying: true,
  };

  it('should create correctly with valid props', () => {
    const aspect = Aspect.create(validProps);
    expect(aspect.id).toBe(validProps.id);
    expect(aspect.planetA).toBe(PlanetName.Moon);
    expect(aspect.planetB).toBe(PlanetName.Sun);
  });

  it('should throw DataIntegrityError if planetA === planetB', () => {
    expect(() => {
      Aspect.create({ ...validProps, planetA: PlanetName.Sun, planetB: PlanetName.Sun });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if planets are not in canonical order (alphabetical)', () => {
    expect(() => {
      // 'Sun' is lexicographically greater than 'Moon'
      Aspect.create({ ...validProps, planetA: PlanetName.Sun, planetB: PlanetName.Moon });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if orb < 0', () => {
    expect(() => {
      Aspect.create({ ...validProps, orb: -0.1 });
    }).toThrow(DataIntegrityError);
  });

  it('should reconstitute correctly', () => {
    const aspect = Aspect.reconstitute({ ...validProps, orb: -1 });
    expect(aspect.orb).toBe(-1);
  });
});
