import { describe, it, expect } from 'vitest';

import {
  HouseSystem,
  PlanetName,
  ChartType,
} from '../../../../../../src/modules/chart/domain/types/chart.types.js';
import {
  EngineInput,
  EngineInputBirthData,
  EngineInputChartOptions,
} from '../../../../../../src/modules/chart/domain/value-objects/engine-input.vo.js';

describe('EngineInput VO', () => {
  it('should create correctly and copy objects for immutability', () => {
    const birthData: EngineInputBirthData = {
      birthDate: new Date('1990-01-01T00:00:00Z'),
      birthTime: { hour: 12, minute: 30, second: 0 },
      isBirthTimeKnown: true,
      latitude: 10,
      longitude: 20,
      timezoneId: 'UTC',
    };

    const chartOptions: EngineInputChartOptions = {
      houseSystem: HouseSystem.Placidus,
      includeOptionalPoints: [PlanetName.Chiron],
      chartType: ChartType.Natal,
    };

    const input = EngineInput.create(birthData, chartOptions);

    expect(input.birthData.birthDate).toEqual(new Date('1990-01-01T00:00:00Z'));
    expect(input.birthData.birthTime).toEqual({ hour: 12, minute: 30, second: 0 });
    expect(input.birthData.latitude).toBe(10);

    expect(input.chartOptions.houseSystem).toBe(HouseSystem.Placidus);
    expect(input.chartOptions.includeOptionalPoints).toEqual([PlanetName.Chiron]);

    // Test immutability (copies were made)
    expect(input.birthData.birthDate).not.toBe(birthData.birthDate);
    if (input.birthData.birthTime) {
      expect(input.birthData.birthTime).not.toBe(birthData.birthTime);
    }
    expect(input.chartOptions.includeOptionalPoints).not.toBe(chartOptions.includeOptionalPoints);
  });

  it('should handle null birthTime', () => {
    const birthData: EngineInputBirthData = {
      birthDate: new Date('1990-01-01T00:00:00Z'),
      birthTime: null,
      isBirthTimeKnown: false,
      latitude: 10,
      longitude: 20,
      timezoneId: 'UTC',
    };

    const chartOptions: EngineInputChartOptions = {
      houseSystem: HouseSystem.Placidus,
      includeOptionalPoints: [],
      chartType: ChartType.Natal,
    };

    const input = EngineInput.create(birthData, chartOptions);
    expect(input.birthData.birthTime).toBeNull();
  });
});
