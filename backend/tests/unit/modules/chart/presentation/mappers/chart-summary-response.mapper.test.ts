import { describe, expect, it } from 'vitest';

import { Chart } from '../../../../../../src/modules/chart/domain/entities/chart.entity.js';
import {
  ChartType,
  HouseSystem,
} from '../../../../../../src/modules/chart/domain/types/chart.types.js';
import { ChartCalculationMetadata } from '../../../../../../src/modules/chart/domain/value-objects/calculation-metadata.vo.js';
import { EngineInput } from '../../../../../../src/modules/chart/domain/value-objects/engine-input.vo.js';
import { ChartSummaryResponseMapper } from '../../../../../../src/modules/chart/presentation/mappers/chart-summary-response.mapper.js';

describe('ChartSummaryResponseMapper', () => {
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
    birthProfileId: 'profile-123',
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
    warnings: [],
    createdAt: dummyDate,
    deletedAt: null,
  };

  it('should map Chart to ChartSummaryResponse correctly', () => {
    const chart = Chart.reconstitute(mockChartProps);

    const response = ChartSummaryResponseMapper.toResponse(chart);

    expect(response.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(response.birthProfileId).toBe('profile-123');
    expect(response.birthProfileLabel).toBeNull(); // D-3 gap
    expect(response.houseSystem).toBe(HouseSystem.Placidus);
    expect(response.calculatedAt).toBe('2023-01-01T00:00:00.000Z');
  });
});
