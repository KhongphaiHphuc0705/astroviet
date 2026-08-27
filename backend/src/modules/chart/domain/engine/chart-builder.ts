import { Chart } from '../entities/chart.entity.js';
import { House } from '../entities/house.entity.js';
import { Planet } from '../entities/planet.entity.js';
import { ChartCalculationFailed } from '../errors/chart.errors.js';
import { IEphemerisProvider } from '../ports/ephemeris-provider.port.js';
import { ChartCalculationMetadata } from '../value-objects/calculation-metadata.vo.js';
import { EngineInput } from '../value-objects/engine-input.vo.js';
import { Warning } from '../value-objects/warning.vo.js';

import { AngleCalculator } from './calculators/angle.calculator.js';
import { AspectCalculator } from './calculators/aspect.calculator.js';
import { HouseCalculator } from './calculators/house.calculator.js';
import { PatternCalculator } from './calculators/pattern.calculator.js';
import { PlanetCalculator } from './calculators/planet.calculator.js';
import { ENGINE_VERSION } from './engine-version.constant.js';
import { convertLocalTimeToUtc } from './time-conversion.js';
import { ChartInputValidator } from './validation/chart-input.validator.js';

export interface ChartBuilderInput {
  id: string;
  userId: string | null;
  birthProfileId: string | null;
  engineInput: EngineInput;
}

export class ChartBuilder {
  constructor(private readonly ephemerisProvider: IEphemerisProvider) {}

  public async build(input: ChartBuilderInput): Promise<Chart> {
    try {
      // 1. Validate Input
      ChartInputValidator.validate(input.engineInput);

      const birthData = input.engineInput.birthData;
      const chartOptions = input.engineInput.chartOptions;

      // 2. Time Conversion
      const utcDate = convertLocalTimeToUtc(
        birthData.birthDate,
        birthData.birthTime
          ? { hour: birthData.birthTime.hour, minute: birthData.birthTime.minute, second: 0 }
          : null,
        birthData.isBirthTimeKnown,
        birthData.timezoneId,
      );

      const providerInput = {
        utcDateTime: utcDate,
        coordinates: { latitude: birthData.latitude, longitude: birthData.longitude },
      };

      const rawEphemeris = await this.ephemerisProvider.calculateNatal(providerInput);
      let planets = PlanetCalculator.calculate(rawEphemeris, chartOptions.includeOptionalPoints);

      let houses: House[] = [];
      let angles: ReturnType<typeof AngleCalculator.calculate> = [];
      const warnings: Warning[] = [];

      if (birthData.isBirthTimeKnown) {
        const houseResult = await this.ephemerisProvider.calculateHouses({
          ...providerInput,
          houseSystem: chartOptions.houseSystem,
        });

        if (houseResult.status === 'not_convergent') {
          warnings.push(
            Warning.create({
              code: 'NON_CONVERGENT_HOUSE_SYSTEM',
              message:
                'The house system did not converge mathematically. Results may be inaccurate.',
              severity: 'warning',
            }),
          );
        }

        houses = HouseCalculator.calculate(houseResult, chartOptions.houseSystem);
        angles = AngleCalculator.calculate(houseResult);

        // Assign house placement to each planet
        planets = this.assignHousesToPlanets(planets, houses);
      }

      // 4. Aspects
      const aspects = AspectCalculator.calculate(planets);

      // 5. Patterns
      const patterns = PatternCalculator.calculate(planets, aspects);

      // 6. Metadata
      const calculationMetadata = ChartCalculationMetadata.create({
        engineVersion: ENGINE_VERSION,
        calculatedAt: new Date(),
      });

      // 7. Assemble Entity
      return Chart.create({
        id: input.id,
        userId: input.userId,
        chartType: chartOptions.chartType,
        birthProfileId: input.birthProfileId,
        engineInput: input.engineInput,
        planets,
        houses,
        angles,
        aspects,
        patterns,
        houseSystem: chartOptions.houseSystem,
        isHouseDataAvailable: houses.length === 12,
        calculationMetadata,
        warnings,
        createdAt: new Date(),
        deletedAt: null,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new ChartCalculationFailed(`Failed to calculate chart: ${error.message}`, error);
      }
      throw new ChartCalculationFailed('Failed to calculate chart due to an unknown error');
    }
  }

  private assignHousesToPlanets(planets: Planet[], houses: House[]): Planet[] {
    return planets.map((planet) => {
      let assignedHouse: number | null = null;

      for (let i = 0; i < houses.length; i++) {
        const currentHouse = houses[i]!;
        const nextHouse = houses[(i + 1) % houses.length]!;

        if (this.isBetween(planet.longitude, currentHouse.cuspDegree, nextHouse.cuspDegree)) {
          assignedHouse = currentHouse.number;
          break;
        }
      }

      // Reconstitute planet with assigned house
      return Planet.reconstitute({
        id: planet.id,
        name: planet.name,
        category: planet.category,
        longitude: planet.longitude,
        latitude: planet.latitude,
        speed: planet.speed,
        isRetrograde: planet.isRetrograde,
        zodiacPosition: planet.zodiacPosition,
        house: assignedHouse,
      });
    });
  }

  private isBetween(value: number, start: number, end: number): boolean {
    if (start <= end) {
      return value >= start && value < end;
    }
    // Crosses the 0 degree mark
    return value >= start || value < end;
  }
}
