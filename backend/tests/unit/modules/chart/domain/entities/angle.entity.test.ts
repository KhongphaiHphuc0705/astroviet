import { describe, it, expect } from 'vitest';

import { Angle } from '../../../../../../src/modules/chart/domain/entities/angle.entity.js';
import { DataIntegrityError } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';

describe('Angle Entity', () => {
  const validProps = {
    id: 'test-id',
    type: 'Ascendant' as const,
    longitude: 120.5,
  };

  it('should create correctly with valid props', () => {
    const angle = Angle.create(validProps);
    expect(angle.id).toBe(validProps.id);
    expect(angle.type).toBe('Ascendant');
    expect(angle.longitude).toBe(120.5);
  });

  it('should throw DataIntegrityError if longitude < 0', () => {
    expect(() => {
      Angle.create({ ...validProps, longitude: -0.1 });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if longitude >= 360', () => {
    expect(() => {
      Angle.create({ ...validProps, longitude: 360 });
    }).toThrow(DataIntegrityError);
  });

  it('should reconstitute correctly', () => {
    const angle = Angle.reconstitute({ ...validProps, longitude: 500 });
    expect(angle.longitude).toBe(500);
  });
});
