import { describe, it, expect } from 'vitest';

import { HouseSystem } from '../../../../../../src/modules/chart/domain/types/chart.types.js';
import { houseSystemMapping } from '../../../../../../src/modules/chart/infrastructure/adapters/house-system.mapping.js';

describe('houseSystemMapping', () => {
  it('should map Placidus to "P"', () => {
    expect(houseSystemMapping[HouseSystem.Placidus]).toBe('P');
  });

  it('should map WholeSign to "W"', () => {
    expect(houseSystemMapping[HouseSystem.WholeSign]).toBe('W');
  });

  it('should have exactly 2 mappings', () => {
    expect(Object.keys(houseSystemMapping)).toHaveLength(2);
  });
});
