import { describe, it, expect } from 'vitest';

import { AngleCalculator } from '../../../../../../../src/modules/chart/domain/engine/calculators/angle.calculator.js';
import { HouseCalculationResult } from '../../../../../../../src/modules/chart/domain/ports/ephemeris-provider.port.js';

describe('AngleCalculator', () => {
  it('should return exactly 4 angles for a convergent result', () => {
    const result: HouseCalculationResult = {
      status: 'success',
      data: {
        cusps: [], // Not used for angles
        ascendant: 45.5,
        midheaven: 135.2,
      },
    };

    const angles = AngleCalculator.calculate(result);

    expect(angles).toHaveLength(4);

    const types = angles.map((a) => a.type);
    expect(types).toContain('Ascendant');
    expect(types).toContain('Midheaven');
    expect(types).toContain('Descendant');
    expect(types).toContain('ImumCoeli');
  });

  it('should calculate Ascendant and Midheaven directly from raw data', () => {
    const result: HouseCalculationResult = {
      status: 'success',
      data: {
        cusps: [],
        ascendant: 359.5,
        midheaven: 89.2,
      },
    };

    const angles = AngleCalculator.calculate(result);

    const asc = angles.find((a) => a.type === 'Ascendant');
    const mc = angles.find((a) => a.type === 'Midheaven');

    expect(asc?.longitude).toBe(359.5);
    expect(mc?.longitude).toBe(89.2);
  });

  it('should calculate Descendant and ImumCoeli as exactly 180 degrees opposite with correct normalization', () => {
    const result: HouseCalculationResult = {
      status: 'success',
      data: {
        cusps: [],
        ascendant: 195.5, // + 180 = 375.5 -> 15.5
        midheaven: 275.2, // + 180 = 455.2 -> 95.2
      },
    };

    const angles = AngleCalculator.calculate(result);

    const desc = angles.find((a) => a.type === 'Descendant');
    const ic = angles.find((a) => a.type === 'ImumCoeli');

    expect(desc?.longitude).toBeCloseTo(15.5, 10);
    expect(ic?.longitude).toBeCloseTo(95.2, 10);
  });

  it('should safely normalize negative values or extreme degrees', () => {
    const result: HouseCalculationResult = {
      status: 'success',
      data: {
        cusps: [],
        ascendant: -10, // -10 -> 350
        midheaven: 725, // 725 -> 5
      },
    };

    const angles = AngleCalculator.calculate(result);

    const asc = angles.find((a) => a.type === 'Ascendant');
    const mc = angles.find((a) => a.type === 'Midheaven');

    expect(asc?.longitude).toBe(350);
    expect(mc?.longitude).toBe(5);
  });

  it('should return an empty array if the house calculation did not converge', () => {
    const result: HouseCalculationResult = {
      status: 'not_convergent',
    };

    const angles = AngleCalculator.calculate(result);

    expect(angles).toEqual([]);
  });
});
