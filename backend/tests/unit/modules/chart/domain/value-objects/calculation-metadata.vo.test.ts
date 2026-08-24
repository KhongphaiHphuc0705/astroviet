import { describe, it, expect } from 'vitest';

import { DataIntegrityError } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import { ChartCalculationMetadata } from '../../../../../../src/modules/chart/domain/value-objects/calculation-metadata.vo.js';

describe('ChartCalculationMetadata VO', () => {
  it('should create correctly and copy Date for immutability', () => {
    const calculatedAt = new Date('2024-01-01T00:00:00Z');
    const metadata = ChartCalculationMetadata.create({
      calculatedAt,
      engineVersion: '1.0.0',
    });

    expect(metadata.calculatedAt).toEqual(calculatedAt);
    expect(metadata.engineVersion).toBe('1.0.0');

    // Immutability
    expect(metadata.calculatedAt).not.toBe(calculatedAt);
  });

  it('should throw DataIntegrityError if engineVersion is empty', () => {
    expect(() => {
      ChartCalculationMetadata.create({
        calculatedAt: new Date(),
        engineVersion: '',
      });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if engineVersion is only whitespace', () => {
    expect(() => {
      ChartCalculationMetadata.create({
        calculatedAt: new Date(),
        engineVersion: '   ',
      });
    }).toThrow(DataIntegrityError);
  });
});
