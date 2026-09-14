import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';

import { Angle } from '../../../../../src/modules/chart/domain/entities/angle.entity.js';
import { Aspect } from '../../../../../src/modules/chart/domain/entities/aspect.entity.js';
import { Chart } from '../../../../../src/modules/chart/domain/entities/chart.entity.js';
import { House } from '../../../../../src/modules/chart/domain/entities/house.entity.js';
import { Planet } from '../../../../../src/modules/chart/domain/entities/planet.entity.js';
import {
  ChartType,
  HouseSystem,
  PlanetCategory,
  PlanetName,
  AspectType,
} from '../../../../../src/modules/chart/domain/types/chart.types.js';
import { ChartCalculationMetadata } from '../../../../../src/modules/chart/domain/value-objects/calculation-metadata.vo.js';
import { EngineInput } from '../../../../../src/modules/chart/domain/value-objects/engine-input.vo.js';
import { ZodiacPosition } from '../../../../../src/modules/chart/domain/value-objects/zodiac-position.vo.js';
import { PrismaChartRepository } from '../../../../../src/modules/chart/infrastructure/repositories/prisma-chart.repository.js';
import { InfrastructureError } from '../../../../../src/shared/errors/app-error.js';
import { PrismaTestFactory } from '../../../../fixtures/prisma-test.factory.js';
import { DatabaseTestHelper } from '../../../../helpers/database.helper.js';

describe('PrismaChartRepository Integration', () => {
  let prisma: PrismaClient;
  let dbHelper: DatabaseTestHelper;
  let factory: PrismaTestFactory;
  let repository: PrismaChartRepository;

  beforeAll(() => {
    prisma = new PrismaClient();
    dbHelper = new DatabaseTestHelper(prisma);
    factory = new PrismaTestFactory(prisma);
    repository = new PrismaChartRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
  });

  const createTestChart = (
    userId: string,
    birthProfileId: string | null = null,
    fullName: string = 'Test User',
  ): Chart => {
    const engineInput = EngineInput.create(
      {
        birthDate: new Date('1990-01-01T00:00:00Z'),
        birthTime: { hour: 12, minute: 0, second: 0 },
        isBirthTimeKnown: true,
        latitude: 10.8231,
        longitude: 106.6297,
        timezoneId: 'Asia/Ho_Chi_Minh',
        fullName,
        placeName: 'Ho Chi Minh',
      },
      { houseSystem: HouseSystem.Placidus, includeOptionalPoints: [], chartType: ChartType.Natal },
    );

    const calculationMetadata = ChartCalculationMetadata.create({
      calculatedAt: new Date(),
      engineVersion: '1.0.0',
    });

    const names = [
      PlanetName.Sun,
      PlanetName.Moon,
      PlanetName.Mercury,
      PlanetName.Venus,
      PlanetName.Mars,
      PlanetName.Jupiter,
      PlanetName.Saturn,
      PlanetName.Uranus,
      PlanetName.Neptune,
      PlanetName.Pluto,
    ];
    const planets = names.map((name, i) =>
      Planet.create({
        id: crypto.randomUUID(),
        name,
        category: PlanetCategory.Personal,
        longitude: i * 10,
        latitude: i,
        speed: 1,
        isRetrograde: false,
        zodiacPosition: ZodiacPosition.fromLongitude(i * 10),
        house: 1,
      }),
    );

    const houses = Array.from({ length: 12 }, (_, i) =>
      House.create({
        id: crypto.randomUUID(),
        number: i + 1,
        cuspDegree: i * 30,
        houseSystem: HouseSystem.Placidus,
      }),
    );

    const angles = [
      Angle.create({ id: crypto.randomUUID(), type: 'Ascendant', longitude: 0 }),
      Angle.create({ id: crypto.randomUUID(), type: 'Descendant', longitude: 180 }),
      Angle.create({ id: crypto.randomUUID(), type: 'Midheaven', longitude: 270 }),
      Angle.create({ id: crypto.randomUUID(), type: 'ImumCoeli', longitude: 90 }),
    ];

    const aspects = [
      Aspect.create({
        id: crypto.randomUUID(),
        planetA: PlanetName.Moon,
        planetB: PlanetName.Sun,
        aspectType: AspectType.Conjunction,
        exactAngle: 0,
        orb: 1,
        isApplying: true,
      }),
    ];

    return Chart.create({
      id: crypto.randomUUID(),
      userId,
      chartType: ChartType.Natal,
      birthProfileId,
      engineInput,
      planets,
      houses,
      angles,
      aspects,
      patterns: [],
      houseSystem: HouseSystem.Placidus,
      isHouseDataAvailable: true,
      calculationMetadata,
      warnings: [],
      createdAt: new Date(),
      deletedAt: null,
    });
  };

  describe('save()', () => {
    it('should save a valid chart and all its relations', async () => {
      const user = await factory.createUser();
      const chart = createTestChart(user.id);

      await repository.save(chart);

      const rawChart = await prisma.chart.findUnique({
        where: { id: chart.id },
        include: {
          planets: true,
          houses: true,
          angles: true,
          aspects: true,
          patterns: true,
        },
      });

      expect(rawChart).not.toBeNull();
      expect(rawChart?.user_id).toBe(user.id);
      expect(rawChart?.planets).toHaveLength(10);
      expect(rawChart?.houses).toHaveLength(12);
      expect(rawChart?.angles).toHaveLength(4);
      expect(rawChart?.aspects).toHaveLength(1);
      expect(rawChart?.patterns).toHaveLength(0);

      expect(rawChart?.snapshot_full_name).toBe('Test User');
      expect(rawChart?.snapshot_place_name).toBe('Ho Chi Minh');
      expect(rawChart?.snapshot_latitude.toNumber()).toBe(10.8231);
    });

    it('should rollback entirely on constraint violation', async () => {
      const user = await factory.createUser();
      const chart = createTestChart(user.id);

      // Create a bad chart bypassing domain validation to trigger DB CHECK constraint
      // Longitude = 400 is invalid
      const badChart = Chart.reconstitute({
        id: chart.id,
        userId: chart.userId,
        birthProfileId: chart.birthProfileId,
        chartType: chart.chartType,
        houseSystem: chart.houseSystem,
        isHouseDataAvailable: chart.isHouseDataAvailable,
        engineInput: chart.engineInput,
        planets: [
          ...chart.planets.slice(1),
          Planet.reconstitute({
            id: chart.planets[0].id,
            name: chart.planets[0].name,
            category: chart.planets[0].category,
            longitude: 400,
            latitude: chart.planets[0].latitude,
            speed: chart.planets[0].speed,
            isRetrograde: chart.planets[0].isRetrograde,
            zodiacPosition: chart.planets[0].zodiacPosition,
            house: chart.planets[0].house,
          }),
        ],
        houses: [...chart.houses],
        angles: [...chart.angles],
        aspects: [...chart.aspects],
        patterns: [...chart.patterns],
        calculationMetadata: chart.calculationMetadata,
        warnings: [...chart.warnings],
        createdAt: chart.createdAt,
        deletedAt: chart.deletedAt,
      });

      await expect(repository.save(badChart)).rejects.toThrow(InfrastructureError);

      const rawChart = await prisma.chart.findUnique({ where: { id: chart.id } });
      expect(rawChart).toBeNull();

      const countPlanets = await prisma.chartPlanet.count({ where: { chart_id: chart.id } });
      expect(countPlanets).toBe(0);
    });
  });

  describe('Chart Snapshot Immutability (T-DB-03)', () => {
    it('should retain original snapshot data even if birth profile is updated', async () => {
      const user = await factory.createUser();

      // 1. Create a Birth Profile with a specific full_name we will later mutate
      const profile = await factory.createBirthProfile(user.id, {
        full_name: 'Original Name',
        birth_date: new Date('1990-01-01T00:00:00Z'),
      });

      // 2. Create and save a chart using the SAME full_name as the profile.
      //    This simulates the real use-case where the snapshot captures the profile
      //    value at chart creation time (via CreateNatalChartUseCase → EngineInput).
      const chart = createTestChart(user.id, profile.id, profile.full_name);
      await repository.save(chart);

      // 3. Verify the snapshot recorded the profile's name at creation time
      let savedChart = await prisma.chart.findUnique({ where: { id: chart.id } });
      expect(savedChart?.snapshot_full_name).toBe('Original Name');

      // 4. Mutate the Birth Profile — simulates the user editing their profile after
      //    the chart was already calculated
      await prisma.birthProfile.update({
        where: { id: profile.id },
        data: { full_name: 'Modified Name', birth_date: new Date('1995-05-05T00:00:00Z') },
      });

      // 5. Re-fetch the Chart and assert snapshot is still the ORIGINAL value.
      //    If the Chart were a live JOIN back to BirthProfile, this would now return
      //    'Modified Name' — proving the snapshot design is what keeps it at 'Original Name'.
      savedChart = await prisma.chart.findUnique({ where: { id: chart.id } });
      expect(savedChart?.snapshot_full_name).toBe('Original Name');

      // 6. Also verify via repository.findById() — the full Domain reconstruction path
      //    must also return the original name, not the updated profile name.
      //    This confirms neither the mapper nor any JOIN reads live BirthProfile data.
      const domainChart = await repository.findById(chart.id);
      expect(domainChart?.engineInput.birthData.fullName).toBe('Original Name');
    });
  });

  describe('findById()', () => {
    it('should retrieve a saved chart with exact fields (roundtrip)', async () => {
      const user = await factory.createUser();
      const chart = createTestChart(user.id);

      await repository.save(chart);

      const found = await repository.findById(chart.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(chart.id);
      expect(found?.userId).toBe(chart.userId);
      expect(found?.chartType).toBe(chart.chartType);

      expect(found?.engineInput.birthData.fullName).toBe(chart.engineInput.birthData.fullName);
      expect(found?.engineInput.birthData.placeName).toBe(chart.engineInput.birthData.placeName);
      expect(found?.engineInput.birthData.latitude).toBe(chart.engineInput.birthData.latitude);

      expect(found?.planets).toHaveLength(10);
      expect(found?.planets[0]?.name).toBeDefined();

      expect(found?.houses).toHaveLength(12);
      expect(found?.angles).toHaveLength(4);
      expect(found?.aspects).toHaveLength(1);
    });

    it('should return null if not found', async () => {
      const found = await repository.findById(crypto.randomUUID());
      expect(found).toBeNull();
    });
  });

  describe('softDelete()', () => {
    it('should mark chart as deleted and omit from findById', async () => {
      const user = await factory.createUser();
      const chart = createTestChart(user.id);

      await repository.save(chart);

      const success = await repository.softDelete(chart.id, user.id);
      expect(success).toBe(true);

      const found = await repository.findById(chart.id);
      expect(found).toBeNull();

      const rawChart = await prisma.chart.findUnique({ where: { id: chart.id } });
      expect(rawChart?.deleted_at).not.toBeNull();

      const planetsCount = await prisma.chartPlanet.count({ where: { chart_id: chart.id } });
      expect(planetsCount).toBe(10);
    });

    it('should fail if user is not the owner', async () => {
      const user = await factory.createUser();
      const user2 = await factory.createUser();
      const chart = createTestChart(user.id);

      await repository.save(chart);

      const success = await repository.softDelete(chart.id, user2.id);
      expect(success).toBe(false);

      const found = await repository.findById(chart.id);
      expect(found).not.toBeNull();
    });
  });

  describe('Constraints Check', () => {
    it('should reject UNIQUE constraint violation (same planet name)', async () => {
      const user = await factory.createUser();
      const chart = createTestChart(user.id);

      const badChart = Chart.reconstitute({
        id: chart.id,
        userId: chart.userId,
        birthProfileId: chart.birthProfileId,
        chartType: chart.chartType,
        houseSystem: chart.houseSystem,
        isHouseDataAvailable: chart.isHouseDataAvailable,
        engineInput: chart.engineInput,
        planets: [
          ...chart.planets.slice(0, 9),
          Planet.reconstitute({
            id: chart.planets[9].id,
            name: chart.planets[0].name, // duplicate name
            category: chart.planets[9].category,
            longitude: chart.planets[9].longitude,
            latitude: chart.planets[9].latitude,
            speed: chart.planets[9].speed,
            isRetrograde: chart.planets[9].isRetrograde,
            zodiacPosition: chart.planets[9].zodiacPosition,
            house: chart.planets[9].house,
          }),
        ],
        houses: [...chart.houses],
        angles: [...chart.angles],
        aspects: [...chart.aspects],
        patterns: [...chart.patterns],
        calculationMetadata: chart.calculationMetadata,
        warnings: [...chart.warnings],
        createdAt: chart.createdAt,
        deletedAt: chart.deletedAt,
      });

      await expect(repository.save(badChart)).rejects.toThrow(InfrastructureError);
    });

    it('should reject CHECK constraint violation (aspect planet_a >= planet_b)', async () => {
      const user = await factory.createUser();
      const chart = createTestChart(user.id);

      const badChart = Chart.reconstitute({
        id: chart.id,
        userId: chart.userId,
        birthProfileId: chart.birthProfileId,
        chartType: chart.chartType,
        houseSystem: chart.houseSystem,
        isHouseDataAvailable: chart.isHouseDataAvailable,
        engineInput: chart.engineInput,
        planets: [...chart.planets],
        houses: [...chart.houses],
        angles: [...chart.angles],
        aspects: [
          Aspect.reconstitute({
            id: chart.aspects[0].id,
            planetA: PlanetName.Venus, // Venus >= Sun is True alphabetically
            planetB: PlanetName.Sun,
            aspectType: chart.aspects[0].aspectType,
            exactAngle: chart.aspects[0].exactAngle,
            orb: chart.aspects[0].orb,
            isApplying: chart.aspects[0].isApplying,
          }),
        ],
        patterns: [...chart.patterns],
        calculationMetadata: chart.calculationMetadata,
        warnings: [...chart.warnings],
        createdAt: chart.createdAt,
        deletedAt: chart.deletedAt,
      });

      await expect(repository.save(badChart)).rejects.toThrow(InfrastructureError);
    });
  });
});
