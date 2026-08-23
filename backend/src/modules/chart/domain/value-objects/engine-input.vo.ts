import { HouseSystem, PlanetName, ChartType } from '../types/chart.types.js';

export interface EngineInputBirthData {
  readonly birthDate: Date;
  readonly birthTime: {
    readonly hour: number;
    readonly minute: number;
    readonly second: number;
  } | null;
  readonly isBirthTimeKnown: boolean;
  readonly latitude: number;
  readonly longitude: number;
  readonly timezoneId: string;
}

export interface EngineInputChartOptions {
  readonly houseSystem: HouseSystem;
  readonly includeOptionalPoints: PlanetName[];
  readonly chartType: ChartType;
}

export class EngineInput {
  private constructor(
    private readonly _birthData: EngineInputBirthData,
    private readonly _chartOptions: EngineInputChartOptions,
  ) {}

  public get birthData(): EngineInputBirthData {
    return this._birthData;
  }

  public get chartOptions(): EngineInputChartOptions {
    return this._chartOptions;
  }

  public static create(
    birthData: EngineInputBirthData,
    chartOptions: EngineInputChartOptions,
  ): EngineInput {
    // Basic structural validations can be added here if needed,
    // but business rule validations are handled by Validation Module (M3).
    return new EngineInput(
      // Copy objects to ensure immutability
      {
        birthDate: new Date(birthData.birthDate.getTime()),
        birthTime: birthData.birthTime ? { ...birthData.birthTime } : null,
        isBirthTimeKnown: birthData.isBirthTimeKnown,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezoneId: birthData.timezoneId,
      },
      {
        houseSystem: chartOptions.houseSystem,
        includeOptionalPoints: [...chartOptions.includeOptionalPoints],
        chartType: chartOptions.chartType,
      },
    );
  }
}
