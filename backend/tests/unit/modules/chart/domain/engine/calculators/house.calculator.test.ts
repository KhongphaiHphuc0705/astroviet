import { describe, it, expect } from 'vitest';

import { HouseCalculator } from '../../../../../../../src/modules/chart/domain/engine/calculators/house.calculator.js';
import { HouseCalculationResult } from '../../../../../../../src/modules/chart/domain/ports/ephemeris-provider.port.js';
import { HouseSystem } from '../../../../../../../src/modules/chart/domain/types/chart.types.js';

describe('HouseCalculator', () => {
  const mockCusps = [
    10.5, 45.2, 75.8, 105.1, 135.4, 165.7, 190.5, 225.2, 255.8, 285.1, 315.4, 345.7,
  ];

  it('should return exactly 12 houses for a convergent result (TR-5)', () => {
    const result: HouseCalculationResult = {
      status: 'success',
      data: {
        cusps: mockCusps,
        ascendant: 10.5,
        midheaven: 105.1,
      },
    };

    const houses = HouseCalculator.calculate(result, HouseSystem.Placidus);

    expect(houses).toHaveLength(12);
  });

  it('should return an empty array if the house calculation did not converge (TR-6)', () => {
    const result: HouseCalculationResult = {
      status: 'not_convergent',
    };

    const houses = HouseCalculator.calculate(result, HouseSystem.Placidus);

    expect(houses).toEqual([]);
  });

  it('should assign house numbers exactly from 1 to 12 (TR-3)', () => {
    const result: HouseCalculationResult = {
      status: 'success',
      data: {
        cusps: mockCusps,
        ascendant: 10.5,
        midheaven: 105.1,
      },
    };

    const houses = HouseCalculator.calculate(result, HouseSystem.Placidus);
    const houseNumbers = houses.map((h) => h.number);

    expect(houseNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('should use Ascendant directly for House 1 cusp, overriding cusps[0] if they differ slightly', () => {
    const result: HouseCalculationResult = {
      status: 'success',
      data: {
        cusps: mockCusps, // cusps[0] is 10.5
        ascendant: 10.50000000001, // Ascendant has higher precision
        midheaven: 105.1,
      },
    };

    const houses = HouseCalculator.calculate(result, HouseSystem.Placidus);

    expect(houses[0]?.cuspDegree).toBeCloseTo(10.50000000001, 10); // Takes from ascendant
    expect(houses[1]?.cuspDegree).toBe(45.2); // Takes from cusps[1]
  });

  it('should assign the provided houseSystem to all House entities', () => {
    const result: HouseCalculationResult = {
      status: 'success',
      data: {
        cusps: mockCusps,
        ascendant: 10.5,
        midheaven: 105.1,
      },
    };

    const houses = HouseCalculator.calculate(result, HouseSystem.WholeSign);

    for (const house of houses) {
      expect(house.houseSystem).toBe(HouseSystem.WholeSign);
    }
  });

  it('should normalize negative cusps correctly', () => {
    const negativeCusps = [...mockCusps];
    negativeCusps[1] = -15; // House 2 cusp is negative

    const result: HouseCalculationResult = {
      status: 'success',
      data: {
        cusps: negativeCusps,
        ascendant: -30, // Ascendant is negative
        midheaven: 105.1,
      },
    };

    const houses = HouseCalculator.calculate(result, HouseSystem.Placidus);

    expect(houses[0]?.cuspDegree).toBe(330); // -30 normalized to 330
    expect(houses[1]?.cuspDegree).toBe(345); // -15 normalized to 345
  });
});
