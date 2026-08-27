import { describe, it, expect, vi } from 'vitest';

import {
  ChartBuilder,
  ChartBuilderInput,
} from '../../../../../../src/modules/chart/domain/engine/chart-builder.js';
import { ENGINE_VERSION } from '../../../../../../src/modules/chart/domain/engine/engine-version.constant.js';
import { ChartCalculationFailed } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import { IEphemerisProvider } from '../../../../../../src/modules/chart/domain/ports/ephemeris-provider.port.js';
import {
  ChartType,
  HouseSystem,
  PlanetName,
} from '../../../../../../src/modules/chart/domain/types/chart.types.js';
import { EngineInput } from '../../../../../../src/modules/chart/domain/value-objects/engine-input.vo.js';

describe('ChartBuilder', () => {
  const createMockEphemerisProvider = (): IEphemerisProvider => {
    return {
      calculateNatal: vi.fn().mockResolvedValue({
        planets: [
          { name: PlanetName.Sun, longitude: 10, latitude: 0, speed: 1 },
          { name: PlanetName.Moon, longitude: 20, latitude: 0, speed: 1 },
          { name: PlanetName.Mercury, longitude: 30, latitude: 0, speed: 1 },
          { name: PlanetName.Venus, longitude: 40, latitude: 0, speed: 1 },
          { name: PlanetName.Mars, longitude: 50, latitude: 0, speed: 1 },
          { name: PlanetName.Jupiter, longitude: 60, latitude: 0, speed: 1 },
          { name: PlanetName.Saturn, longitude: 70, latitude: 0, speed: 1 },
          { name: PlanetName.Uranus, longitude: 80, latitude: 0, speed: 1 },
          { name: PlanetName.Neptune, longitude: 90, latitude: 0, speed: 1 },
          { name: PlanetName.Pluto, longitude: 100, latitude: 0, speed: 1 },
        ],
      }),
      calculateTransit: vi.fn().mockResolvedValue({ planets: [] }),
      calculateHouses: vi.fn().mockResolvedValue({
        status: 'success',
        data: {
          cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
          ascendant: 0,
          midheaven: 270,
        },
      }),
    };
  };

  const createEngineInput = (isBirthTimeKnown: boolean = true): EngineInput => {
    return EngineInput.create(
      {
        birthDate: new Date('2000-01-01'),
        birthTime: isBirthTimeKnown ? { hour: 12, minute: 0, second: 0 } : null,
        latitude: 10,
        longitude: 106,
        timezoneId: 'Asia/Ho_Chi_Minh',
        isBirthTimeKnown,
      },
      {
        houseSystem: HouseSystem.Placidus,
        chartType: ChartType.Natal,
        includeOptionalPoints: [],
      },
    );
  };

  it('should successfully build a chart with all data when birth time is known (TR-14, TR-15)', async () => {
    const provider = createMockEphemerisProvider();
    const builder = new ChartBuilder(provider);

    const input: ChartBuilderInput = {
      id: 'test-id',
      userId: 'user-id',
      birthProfileId: 'profile-id',
      engineInput: createEngineInput(true),
    };

    const chart1 = await builder.build(input);
    const chart2 = await builder.build(input); // Call second time for TR-15 (determinism)

    expect(chart1).toBeDefined();
    expect(chart1.id).toBe('test-id');
    expect(chart1.planets).toHaveLength(10);
    expect(chart1.houses).toHaveLength(12);
    expect(chart1.angles).toHaveLength(4);
    expect(chart1.isHouseDataAvailable).toBe(true);
    expect(chart1.calculationMetadata.engineVersion).toBe(ENGINE_VERSION);

    // House assignment check
    const sun = chart1.planets.find((p) => p.name === PlanetName.Sun);
    expect(sun).toBeDefined();
    expect(sun?.house).toBe(1); // 10 degrees is in house 1 (0-30)

    // TR-15 Determinism
    expect(chart1.planets[0]?.longitude).toEqual(chart2.planets[0]?.longitude);
    expect(chart1.houses[0]?.cuspDegree).toEqual(chart2.houses[0]?.cuspDegree);
  });

  it('should bypass house/angle calculations when birth time is unknown (TR-7)', async () => {
    const provider = createMockEphemerisProvider();
    const builder = new ChartBuilder(provider);

    const input: ChartBuilderInput = {
      id: 'test-id',
      userId: 'user-id',
      birthProfileId: 'profile-id',
      engineInput: createEngineInput(false),
    };

    const chart = await builder.build(input);

    expect(chart.isHouseDataAvailable).toBe(false);
    expect(chart.houses).toHaveLength(0);
    expect(chart.angles).toHaveLength(0);

    const sun = chart.planets.find((p) => p.name === PlanetName.Sun);
    expect(sun?.house).toBeNull(); // No house data assigned

    expect(provider.calculateHouses).not.toHaveBeenCalled();
    expect(provider.calculateNatal).toHaveBeenCalled();
  });

  it('should add a warning when house system is not convergent', async () => {
    const provider = createMockEphemerisProvider();
    provider.calculateHouses = vi.fn().mockResolvedValue({
      status: 'not_convergent',
      data: {
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
        ascendant: 0,
        midheaven: 270,
      },
    });

    const builder = new ChartBuilder(provider);
    const chart = await builder.build({
      id: 'test-id',
      userId: null,
      birthProfileId: null,
      engineInput: createEngineInput(true),
    });

    expect(chart.warnings).toHaveLength(1);
    expect(chart.warnings[0]?.code).toBe('HOUSE_SYSTEM_NOT_CONVERGING');
  });

  it('should wrap unhandled exceptions in ChartCalculationFailed', async () => {
    const provider = createMockEphemerisProvider();
    provider.calculateNatal = vi.fn().mockRejectedValue(new Error('Swisseph crashed'));

    const builder = new ChartBuilder(provider);

    await expect(
      builder.build({
        id: 'test-id',
        userId: null,
        birthProfileId: null,
        engineInput: createEngineInput(true),
      }),
    ).rejects.toThrowError(ChartCalculationFailed);
  });

  it('should propagate Domain Errors directly without wrapping (AC #5)', async () => {
    const provider = createMockEphemerisProvider();
    // Simulate Sun being retrograde (which violates INV-14)
    provider.calculateNatal = vi.fn().mockResolvedValue({
      planets: [
        { name: PlanetName.Sun, longitude: 10, latitude: 0, speed: -1 }, // Speed < 0 -> Retrograde
        { name: PlanetName.Moon, longitude: 20, latitude: 0, speed: 1 },
      ],
    });

    const builder = new ChartBuilder(provider);

    await expect(
      builder.build({
        id: 'test-id',
        userId: 'user-id',
        birthProfileId: null,
        engineInput: createEngineInput(true),
      }),
    ).rejects.toThrowError('Sun cannot be retrograde');
  });
});
