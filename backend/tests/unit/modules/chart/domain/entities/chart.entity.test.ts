import { describe, it, expect } from 'vitest';

import { Angle } from '../../../../../../src/modules/chart/domain/entities/angle.entity.js';
import { Aspect } from '../../../../../../src/modules/chart/domain/entities/aspect.entity.js';
import { Chart } from '../../../../../../src/modules/chart/domain/entities/chart.entity.js';
import { House } from '../../../../../../src/modules/chart/domain/entities/house.entity.js';
import { Planet } from '../../../../../../src/modules/chart/domain/entities/planet.entity.js';
import { DataIntegrityError } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import {
  ChartType,
  HouseSystem,
  PlanetCategory,
  PlanetName,
  AspectType,
} from '../../../../../../src/modules/chart/domain/types/chart.types.js';
import { ChartCalculationMetadata } from '../../../../../../src/modules/chart/domain/value-objects/calculation-metadata.vo.js';
import { EngineInput } from '../../../../../../src/modules/chart/domain/value-objects/engine-input.vo.js';
import { ZodiacPosition } from '../../../../../../src/modules/chart/domain/value-objects/zodiac-position.vo.js';

describe('Chart Entity', () => {
  const mockEngineInput = EngineInput.create(
    {
      birthDate: new Date(),
      birthTime: { hour: 12, minute: 0, second: 0 },
      isBirthTimeKnown: true,
      latitude: 0,
      longitude: 0,
      timezoneId: 'UTC',
      fullName: 'Test User',
      placeName: 'Test Location',
    },
    { houseSystem: HouseSystem.Placidus, includeOptionalPoints: [], chartType: ChartType.Natal },
  );

  const mockMetadata = ChartCalculationMetadata.create({
    calculatedAt: new Date(),
    engineVersion: '1.0.0',
  });

  const generatePlanets = (count: number) => {
    return Array.from({ length: count }, (_, i) =>
      Planet.create({
        id: `p-${i}`,
        name: PlanetName.Sun,
        category: PlanetCategory.Personal,
        longitude: 0,
        latitude: 0,
        speed: 0,
        isRetrograde: false,
        zodiacPosition: ZodiacPosition.fromLongitude(0),
        house: 1,
      }),
    );
  };

  const generateHouses = (count: number) => {
    return Array.from({ length: count }, (_, i) =>
      House.create({
        id: `h-${i + 1}`,
        number: i + 1,
        cuspDegree: 0,
        houseSystem: HouseSystem.Placidus,
      }),
    );
  };

  const createAngles = (asc: number, mc: number) => {
    return [
      Angle.create({ id: 'a1', type: 'Ascendant', longitude: asc }),
      Angle.create({ id: 'a2', type: 'Descendant', longitude: (asc + 180) % 360 }),
      Angle.create({ id: 'a3', type: 'Midheaven', longitude: mc }),
      Angle.create({ id: 'a4', type: 'ImumCoeli', longitude: (mc + 180) % 360 }),
    ];
  };

  const validProps = {
    id: 'test-chart',
    userId: null,
    chartType: ChartType.Natal,
    birthProfileId: null,
    engineInput: mockEngineInput,
    planets: generatePlanets(10),
    houses: generateHouses(12),
    angles: createAngles(0, 270),
    aspects: [],
    patterns: [],
    houseSystem: HouseSystem.Placidus,
    isHouseDataAvailable: true,
    calculationMetadata: mockMetadata,
    warnings: [],
    createdAt: new Date(),
    deletedAt: null,
  };

  it('should create correctly with isHouseDataAvailable=true', () => {
    const chart = Chart.create(validProps);
    expect(chart.id).toBe('test-chart');
    expect(chart.houses).toHaveLength(12);
    expect(chart.angles).toHaveLength(4);
  });

  it('should create correctly with isHouseDataAvailable=false', () => {
    const chart = Chart.create({
      ...validProps,
      houses: [],
      angles: [],
      isHouseDataAvailable: false,
    });
    expect(chart.houses).toHaveLength(0);
    expect(chart.angles).toHaveLength(0);
  });

  it('should throw DataIntegrityError if chartType !== Natal (INV-1)', () => {
    expect(() => {
      Chart.create({ ...validProps, chartType: 'Transit' as any });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if planets < 10 (INV-2)', () => {
    expect(() => {
      Chart.create({ ...validProps, planets: generatePlanets(9) });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if isHouseDataAvailable=true but houses/angles missing (INV-4)', () => {
    expect(() => {
      Chart.create({ ...validProps, houses: [], angles: [] });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if isHouseDataAvailable=false but houses/angles present (INV-4)', () => {
    expect(() => {
      Chart.create({ ...validProps, isHouseDataAvailable: false });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if houses are not 1-12 without duplicates (INV-5)', () => {
    const badHouses = generateHouses(12);
    // Duplicate house number 1, replacing house 12
    badHouses[11] = House.create({
      id: 'h-bad',
      number: 1,
      cuspDegree: 0,
      houseSystem: HouseSystem.Placidus,
    });
    expect(() => {
      Chart.create({ ...validProps, houses: badHouses });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if aspect pair is duplicated (INV-10)', () => {
    const aspect = Aspect.create({
      id: 'as-1',
      planetA: PlanetName.Moon,
      planetB: PlanetName.Sun,
      aspectType: AspectType.Conjunction,
      exactAngle: 0,
      orb: 1,
      isApplying: true,
    });

    expect(() => {
      Chart.create({ ...validProps, aspects: [aspect, aspect] });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if angles ASC/DSC are not opposite (INV-15)', () => {
    const badAngles = [
      Angle.create({ id: 'a1', type: 'Ascendant', longitude: 0 }),
      Angle.create({ id: 'a2', type: 'Descendant', longitude: 10 }), // Not 180
      Angle.create({ id: 'a3', type: 'Midheaven', longitude: 270 }),
      Angle.create({ id: 'a4', type: 'ImumCoeli', longitude: 90 }),
    ];
    expect(() => {
      Chart.create({ ...validProps, angles: badAngles });
    }).toThrow(DataIntegrityError);
  });

  it('should throw DataIntegrityError if angles MC/IC are not opposite (INV-15)', () => {
    const badAngles = [
      Angle.create({ id: 'a1', type: 'Ascendant', longitude: 0 }),
      Angle.create({ id: 'a2', type: 'Descendant', longitude: 180 }),
      Angle.create({ id: 'a3', type: 'Midheaven', longitude: 270 }),
      Angle.create({ id: 'a4', type: 'ImumCoeli', longitude: 80 }), // Not 90
    ];
    expect(() => {
      Chart.create({ ...validProps, angles: badAngles });
    }).toThrow(DataIntegrityError);
  });

  it('should successfully softDelete and return new instance', () => {
    const chart = Chart.create(validProps);
    const deletedChart = chart.softDelete();

    expect(chart.deletedAt).toBeNull();
    expect(deletedChart.deletedAt).toBeInstanceOf(Date);
    expect(deletedChart).not.toBe(chart); // Immutable check
  });

  it('should reconstitute correctly', () => {
    const chart = Chart.reconstitute({ ...validProps, isHouseDataAvailable: false }); // even with houses array full
    expect(chart.isHouseDataAvailable).toBe(false);
    expect(chart.houses).toHaveLength(12); // Bypasses validation
  });
});
