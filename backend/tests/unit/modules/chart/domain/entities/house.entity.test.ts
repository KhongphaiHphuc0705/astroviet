import { describe, it, expect } from 'vitest';

import { House } from '../../../../../../src/modules/chart/domain/entities/house.entity.js';
import { DataIntegrityError } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import { HouseSystem } from '../../../../../../src/modules/chart/domain/types/chart.types.js';

describe('House Entity', () => {
  const validProps = {
    id: 'test-id',
    number: 1,
    cuspDegree: 15.5,
    houseSystem: HouseSystem.Placidus,
  };

  it('should create correctly with valid props', () => {
    const house = House.create(validProps);
    expect(house.id).toBe(validProps.id);
    expect(house.number).toBe(1);
  });

  it('should throw DataIntegrityError if number < 1', () => {
    expect(() => {
      House.create({ ...validProps, number: 0 });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if number > 12', () => {
    expect(() => {
      House.create({ ...validProps, number: 13 });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if number is not integer', () => {
    expect(() => {
      House.create({ ...validProps, number: 1.5 });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if cuspDegree < 0', () => {
    expect(() => {
      House.create({ ...validProps, cuspDegree: -1 });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if cuspDegree >= 360', () => {
    expect(() => {
      House.create({ ...validProps, cuspDegree: 360 });
    }).toThrow(DataIntegrityError);
  });

  it('should reconstitute correctly', () => {
    const house = House.reconstitute({ ...validProps, number: 99 });
    expect(house.number).toBe(99);
  });
});
