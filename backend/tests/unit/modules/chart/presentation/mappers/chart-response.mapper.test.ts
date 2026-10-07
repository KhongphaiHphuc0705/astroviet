import { describe, expect, it } from 'vitest';

import { InterpretationResult } from '../../../../../../src/modules/chart/application/services/interpretation-lookup.service.js';
import { Angle } from '../../../../../../src/modules/chart/domain/entities/angle.entity.js';
import { Aspect } from '../../../../../../src/modules/chart/domain/entities/aspect.entity.js';
import { Chart } from '../../../../../../src/modules/chart/domain/entities/chart.entity.js';
import { House } from '../../../../../../src/modules/chart/domain/entities/house.entity.js';
import { Pattern } from '../../../../../../src/modules/chart/domain/entities/pattern.entity.js';
import { Planet } from '../../../../../../src/modules/chart/domain/entities/planet.entity.js';
import {
  AspectType,
  ChartType,
  HouseSystem,
  PlanetCategory,
  PlanetName,
} from '../../../../../../src/modules/chart/domain/types/chart.types.js';
import { ChartCalculationMetadata } from '../../../../../../src/modules/chart/domain/value-objects/calculation-metadata.vo.js';
import { EngineInput } from '../../../../../../src/modules/chart/domain/value-objects/engine-input.vo.js';
import { Warning } from '../../../../../../src/modules/chart/domain/value-objects/warning.vo.js';
import { ZodiacPosition } from '../../../../../../src/modules/chart/domain/value-objects/zodiac-position.vo.js';
import { ChartResponseMapper } from '../../../../../../src/modules/chart/presentation/mappers/chart-response.mapper.js';

describe('ChartResponseMapper', () => {
  const dummyDate = new Date('2023-01-01T00:00:00Z');

  const dummyEngineInput = EngineInput.create(
    {
      fullName: 'Test',
      placeName: 'Test Place',
      birthDate: dummyDate,
      birthTime: { hour: 12, minute: 0, second: 0 },
      isBirthTimeKnown: true,
      latitude: 0,
      longitude: 0,
      timezoneId: 'UTC',
    },
    {
      houseSystem: HouseSystem.Placidus,
      includeOptionalPoints: [],
      chartType: ChartType.Natal,
    },
  );

  const mockChartProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user-1',
    chartType: ChartType.Natal,
    birthProfileId: null,
    engineInput: dummyEngineInput,
    planets: [
      Planet.reconstitute({
        id: 'p-1',
        name: PlanetName.Sun,
        category: PlanetCategory.Personal,
        longitude: 15.5,
        latitude: 0,
        speed: 1,
        isRetrograde: false,
        zodiacPosition: ZodiacPosition.fromLongitude(15.5),
        house: 1,
      }),
    ],
    houses: [
      House.reconstitute({
        id: 'h-1',
        number: 1,
        cuspDegree: 10,
        houseSystem: HouseSystem.Placidus,
      }),
    ],
    angles: [
      Angle.reconstitute({
        id: 'a-1',
        type: 'Ascendant',
        longitude: 10,
      }),
    ],
    aspects: [
      Aspect.reconstitute({
        id: 'as-1',
        planetA: PlanetName.Moon,
        planetB: PlanetName.Sun,
        aspectType: AspectType.Trine,
        exactAngle: 120,
        orb: 2,
        isApplying: true,
      }),
    ],
    patterns: [
      Pattern.reconstitute({
        id: 'pt-1',
        patternType: 'Grand Trine',
        involvedPlanets: [PlanetName.Sun, PlanetName.Moon, PlanetName.Jupiter],
      }),
    ],
    houseSystem: HouseSystem.Placidus,
    isHouseDataAvailable: false,
    calculationMetadata: ChartCalculationMetadata.create({
      calculatedAt: dummyDate,
      engineVersion: '1.0.0',
    }),
    warnings: [Warning.create({ code: 'W1', message: 'Warning 1', severity: 'warning' })],
    createdAt: dummyDate,
    deletedAt: null,
  };

  it('should map Chart to ChartResponse correctly with isHouseDataAvailable = false', () => {
    // using reconstitute to bypass domain invariant checks that expect 10 planets etc for tests
    const chart = Chart.reconstitute({ ...mockChartProps, isHouseDataAvailable: false });
    const response = ChartResponseMapper.toResponse(chart, { version: null, items: [] });

    expect(response.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(response.chartType).toBe(ChartType.Natal);
    expect(response.houseSystem).toBe(HouseSystem.Placidus);
    expect(response.isHouseDataAvailable).toBe(false);
    expect(response.planets).toEqual([
      {
        name: PlanetName.Sun,
        category: PlanetCategory.Personal,
        longitude: 15.5,
        speed: 1,
        isRetrograde: false,
        sign: 'Aries',
        degreeInSign: 15.5,
        house: 1,
      },
    ]);
    expect(response.houses).toEqual([
      {
        number: 1,
        cuspDegree: 10,
        signOnCusp: 'Aries',
      },
    ]);
    expect(response.angles).toEqual([
      {
        type: 'Ascendant',
        longitude: 10,
        sign: 'Aries',
        degreeInSign: 10,
      },
    ]);
    expect(response.aspects).toEqual([
      {
        aspectType: AspectType.Trine,
        planetA: PlanetName.Moon,
        planetB: PlanetName.Sun,
        exactAngle: 120,
        orb: 2,
        isApplying: true,
        nature: 'Harmonious',
      },
    ]);
    expect(response.patterns).toEqual([
      {
        patternType: 'Grand Trine',
        involvedPlanets: [PlanetName.Sun, PlanetName.Moon, PlanetName.Jupiter],
      },
    ]);
    expect(response.interpretations).toEqual([]);
    expect(response.interpretationVersion).toBeNull();
    expect(response.warnings.length).toBe(1);
    expect(response.warnings[0]?.code).toBe('W1');
    expect(response.warnings[0]?.message).toBe('Warning 1');
    expect(response.warnings[0]?.severity).toBe('warning');
    expect(response.calculatedAt).toBe('2023-01-01T00:00:00.000Z');
    expect(response.engineVersion).toBe('1.0.0');
  });

  it('should map interpretations and interpretationVersion correctly, filtering out internal fields and preserving order', () => {
    const chart = Chart.reconstitute({ ...mockChartProps, isHouseDataAvailable: true });

    const interpretation: InterpretationResult = {
      version: '1.0',
      items: [
        {
          id: 'int-1', // internal
          subjectType: 'PlanetInSign',
          subjectKey: 'Sun_in_Aries',
          language: 'vi',
          bodyText: 'Mặt Trời Bạch Dương...',
          tone: null,
          version: '1.0', // internal
          status: 'Published', // internal
          contentSource: 'Hybrid', // internal
          createdAt: dummyDate,
          updatedAt: dummyDate,
        } as any,
        {
          id: 'int-2',
          subjectType: 'PlanetInHouse',
          subjectKey: 'Sun_in_House_1',
          language: 'vi',
          bodyText: 'Mặt Trời nhà 1...',
          tone: 'casual',
          version: '1.0',
          status: 'Published',
          contentSource: 'Hybrid',
          createdAt: dummyDate,
          updatedAt: dummyDate,
        } as any,
      ],
    };

    const response = ChartResponseMapper.toResponse(chart, interpretation);

    expect(response.interpretationVersion).toBe('1.0');
    expect(response.interpretations).toEqual([
      {
        subjectType: 'PlanetInSign',
        subjectKey: 'Sun_in_Aries',
        language: 'vi',
        bodyText: 'Mặt Trời Bạch Dương...',
        tone: null,
      },
      {
        subjectType: 'PlanetInHouse',
        subjectKey: 'Sun_in_House_1',
        language: 'vi',
        bodyText: 'Mặt Trời nhà 1...',
        tone: 'casual',
      },
    ]);

    // Check that there are strictly 5 keys
    expect(Object.keys(response.interpretations[0]!)).toEqual([
      'subjectType',
      'subjectKey',
      'language',
      'bodyText',
      'tone',
    ]);
  });
});
