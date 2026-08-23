import { describe, it, expect } from 'vitest';

import { Pattern } from '../../../../../../src/modules/chart/domain/entities/pattern.entity.js';
import { DataIntegrityError } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import { PlanetName } from '../../../../../../src/modules/chart/domain/types/chart.types.js';

describe('Pattern Entity', () => {
  const validProps = {
    id: 'test-id',
    patternType: 'Grand Trine',
    involvedPlanets: [PlanetName.Sun, PlanetName.Moon, PlanetName.Mars],
  };

  it('should create correctly with valid props', () => {
    const pattern = Pattern.create(validProps);
    expect(pattern.id).toBe(validProps.id);
    expect(pattern.patternType).toBe('Grand Trine');
    expect(pattern.involvedPlanets).toEqual([PlanetName.Sun, PlanetName.Moon, PlanetName.Mars]);
  });

  it('should throw DataIntegrityError if involvedPlanets.length < 3', () => {
    expect(() => {
      Pattern.create({ ...validProps, involvedPlanets: [PlanetName.Sun, PlanetName.Moon] });
    }).toThrow(DataIntegrityError);
  });

  it('should reconstitute correctly', () => {
    const pattern = Pattern.reconstitute({ ...validProps, involvedPlanets: [PlanetName.Sun] });
    // Reconstitute bypasses validation
    expect(pattern.involvedPlanets).toEqual([PlanetName.Sun]);
  });
});
