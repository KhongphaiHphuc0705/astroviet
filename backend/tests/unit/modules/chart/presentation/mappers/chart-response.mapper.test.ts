import { describe, expect, it } from 'vitest';

import { Chart } from '../../../../../../src/modules/chart/domain/entities/chart.entity.js';
import {
  ChartType,
  HouseSystem,
} from '../../../../../../src/modules/chart/domain/types/chart.types.js';
import { ChartCalculationMetadata } from '../../../../../../src/modules/chart/domain/value-objects/calculation-metadata.vo.js';
import { EngineInput } from '../../../../../../src/modules/chart/domain/value-objects/engine-input.vo.js';
import { Warning } from '../../../../../../src/modules/chart/domain/value-objects/warning.vo.js';
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
    planets: [],
    houses: [],
    angles: [],
    aspects: [],
    patterns: [],
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

    const response = ChartResponseMapper.toResponse(chart);

    expect(response.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(response.chartType).toBe(ChartType.Natal);
    expect(response.houseSystem).toBe(HouseSystem.Placidus);
    expect(response.isHouseDataAvailable).toBe(false);
    expect(response.planets).toEqual([]);
    expect(response.houses).toEqual([]);
    expect(response.angles).toEqual([]);
    expect(response.aspects).toEqual([]);
    expect(response.patterns).toEqual([]);
    expect(response.interpretations).toEqual([]); // D-2 gap
    expect(response.warnings.length).toBe(1);
    expect(response.warnings[0]?.code).toBe('W1');
    expect(response.warnings[0]?.message).toBe('Warning 1');
    expect(response.warnings[0]?.severity).toBe('warning');
    expect(response.calculatedAt).toBe('2023-01-01T00:00:00.000Z');
    expect(response.engineVersion).toBe('1.0.0');
  });
});
