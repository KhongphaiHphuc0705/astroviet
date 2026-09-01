import {
  Prisma,
  Chart as PrismaChart,
  ChartPlanet,
  ChartHouse,
  ChartAngle,
  ChartAspect,
  ChartPattern,
  ChartPatternPlanet,
} from '@prisma/client';

import { Angle } from '../../domain/entities/angle.entity.js';
import { Aspect } from '../../domain/entities/aspect.entity.js';
import { Chart } from '../../domain/entities/chart.entity.js';
import { House } from '../../domain/entities/house.entity.js';
import { Pattern } from '../../domain/entities/pattern.entity.js';
import { Planet } from '../../domain/entities/planet.entity.js';
import { DataIntegrityError } from '../../domain/errors/chart.errors.js';
import {
  ChartType,
  HouseSystem,
  PlanetName,
  PlanetCategory,
  AspectType,
} from '../../domain/types/chart.types.js';
import { ChartCalculationMetadata } from '../../domain/value-objects/calculation-metadata.vo.js';
import { EngineInputBirthData, EngineInput } from '../../domain/value-objects/engine-input.vo.js';
import { Warning, WarningSeverity } from '../../domain/value-objects/warning.vo.js';
import { ZodiacPosition } from '../../domain/value-objects/zodiac-position.vo.js';

export type PrismaChartWithRelations = PrismaChart & {
  planets: ChartPlanet[];
  houses: ChartHouse[];
  angles: ChartAngle[];
  aspects: ChartAspect[];
  patterns: (ChartPattern & { pattern_planets: ChartPatternPlanet[] })[];
};

export interface ChartPersistenceData {
  chart: Prisma.ChartUncheckedCreateInput;
  planets: Prisma.ChartPlanetUncheckedCreateInput[];
  houses: Prisma.ChartHouseUncheckedCreateInput[];
  angles: Prisma.ChartAngleUncheckedCreateInput[];
  aspects: Prisma.ChartAspectUncheckedCreateInput[];
  patterns: (Prisma.ChartPatternUncheckedCreateInput & {
    pattern_planets: {
      create: Prisma.ChartPatternPlanetUncheckedCreateWithoutPatternInput[];
    };
  })[];
}

export class PrismaChartMapper {
  static toDomain(record: PrismaChartWithRelations): Chart {
    const engineInputBirthData: EngineInputBirthData = {
      fullName: record.snapshot_full_name,
      placeName: record.snapshot_place_name,
      birthDate: record.snapshot_birth_date,
      birthTime: record.snapshot_birth_time
        ? {
            hour: record.snapshot_birth_time.getUTCHours(),
            minute: record.snapshot_birth_time.getUTCMinutes(),
            second: record.snapshot_birth_time.getUTCSeconds(),
          }
        : null,
      isBirthTimeKnown: record.snapshot_is_birth_time_known,
      latitude: record.snapshot_latitude.toNumber(),
      longitude: record.snapshot_longitude.toNumber(),
      timezoneId: record.snapshot_timezone_id,
    };

    const engineInput = EngineInput.create(engineInputBirthData, {
      houseSystem: record.house_system as HouseSystem,
      includeOptionalPoints: [],
      chartType: record.chart_type as ChartType,
    });

    const calculationMetadata = ChartCalculationMetadata.create({
      engineVersion: record.engine_version,
      calculatedAt: record.calculated_at,
    });

    const rawWarnings = record.warnings as {
      code: string;
      message: string;
      severity: WarningSeverity;
      field?: string;
      details?: Record<string, unknown>;
    }[];

    const warnings: Warning[] = rawWarnings.map((w) =>
      Warning.create({
        code: w.code,
        message: w.message,
        severity: w.severity,
        field: w.field,
        details: w.details,
      }),
    );

    const planets = record.planets.map((p) => {
      if (p.latitude === null) {
        throw new DataIntegrityError(
          `Latitude is missing for planet ${p.name} in chart ${record.id}`,
        );
      }
      return Planet.reconstitute({
        id: p.id,
        name: p.name as PlanetName,
        category: p.category as PlanetCategory,
        longitude: p.longitude.toNumber(),
        latitude: p.latitude.toNumber(),
        speed: p.speed.toNumber(),
        isRetrograde: p.is_retrograde,
        zodiacPosition: ZodiacPosition.fromLongitude(p.longitude.toNumber()),
        house: p.house_number,
      });
    });

    const houses = record.houses.map((h) =>
      House.reconstitute({
        id: h.id,
        number: h.number,
        cuspDegree: h.cusp_degree.toNumber(),
        houseSystem: record.house_system as HouseSystem,
      }),
    );

    const angles = record.angles.map((a) =>
      Angle.reconstitute({
        id: a.id,
        type: a.type as 'Ascendant' | 'Descendant' | 'Midheaven' | 'ImumCoeli',
        longitude: a.longitude.toNumber(),
      }),
    );

    const aspects = record.aspects.map((a) =>
      Aspect.reconstitute({
        id: a.id,
        planetA: a.planet_a as PlanetName,
        planetB: a.planet_b as PlanetName,
        aspectType: a.aspect_type as AspectType,
        exactAngle: a.exact_angle.toNumber(),
        orb: a.orb.toNumber(),
        isApplying: a.is_applying,
      }),
    );

    // Reconstruct patterns
    // We need to map planet_ids back to planet names
    const planetIdToName = new Map(record.planets.map((p) => [p.id, p.name as PlanetName]));

    const patterns = record.patterns.map((p) => {
      const involvedPlanets = p.pattern_planets
        .map((pp) => planetIdToName.get(pp.planet_id))
        .filter((name): name is PlanetName => name !== undefined);

      return Pattern.reconstitute({
        id: p.id,
        patternType: p.pattern_type,
        involvedPlanets,
      });
    });

    return Chart.reconstitute({
      id: record.id,
      userId: record.user_id,
      birthProfileId: record.birth_profile_id,
      chartType: record.chart_type as ChartType,
      houseSystem: record.house_system as HouseSystem,
      isHouseDataAvailable: record.is_house_data_available,
      engineInput,
      planets,
      houses,
      angles,
      aspects,
      patterns,
      calculationMetadata,
      warnings,
      createdAt: record.created_at,
      deletedAt: record.deleted_at,
    });
  }

  static toPersistence(chart: Chart): ChartPersistenceData {
    const input = chart.engineInput.birthData;

    let snapshotBirthTime: Date | null = null;
    if (input.birthTime) {
      snapshotBirthTime = new Date(
        Date.UTC(1970, 0, 1, input.birthTime.hour, input.birthTime.minute, input.birthTime.second),
      );
    }

    if (!chart.userId) {
      throw new DataIntegrityError(
        'Cannot persist a Chart without a userId (transient charts must not be saved)',
      );
    }

    const chartData: Prisma.ChartUncheckedCreateInput = {
      id: chart.id,
      user_id: chart.userId,
      birth_profile_id: chart.birthProfileId,
      chart_type: chart.chartType,
      house_system: chart.houseSystem,
      is_house_data_available: chart.isHouseDataAvailable,
      engine_version: chart.calculationMetadata.engineVersion,
      calculated_at: chart.calculationMetadata.calculatedAt,
      warnings: chart.warnings as unknown as Prisma.InputJsonValue,
      snapshot_interpretation_version: null, // As specified in M5-T04: always null for now
      snapshot_full_name: input.fullName ?? null,
      snapshot_birth_date: input.birthDate,
      snapshot_birth_time: snapshotBirthTime,
      snapshot_is_birth_time_known: input.isBirthTimeKnown,
      snapshot_place_name: input.placeName,
      snapshot_latitude: input.latitude,
      snapshot_longitude: input.longitude,
      snapshot_timezone_id: input.timezoneId,
      created_at: chart.createdAt,
      deleted_at: chart.deletedAt,
    };

    const planets = chart.planets.map((p) => ({
      id: p.id,
      chart_id: chart.id,
      name: p.name,
      category: p.category,
      longitude: p.longitude,
      latitude: p.latitude,
      speed: p.speed,
      is_retrograde: p.isRetrograde,
      sign: p.zodiacPosition.sign,
      degree_in_sign: p.zodiacPosition.degreeInSign,
      house_number: p.house,
    }));

    const planetNameToId = new Map(planets.map((p) => [p.name, p.id]));

    const houses = chart.houses.map((h) => {
      const zodiac = ZodiacPosition.fromLongitude(h.cuspDegree);
      return {
        id: h.id,
        chart_id: chart.id,
        number: h.number,
        cusp_degree: h.cuspDegree,
        sign_on_cusp: zodiac.sign,
      };
    });

    const angles = chart.angles.map((a) => {
      const zodiac = ZodiacPosition.fromLongitude(a.longitude);
      return {
        id: a.id,
        chart_id: chart.id,
        type: a.type,
        longitude: a.longitude,
        sign: zodiac.sign,
        degree_in_sign: zodiac.degreeInSign,
      };
    });

    const aspects = chart.aspects.map((a) => ({
      id: a.id,
      chart_id: chart.id,
      planet_a: a.planetA,
      planet_b: a.planetB,
      aspect_type: a.aspectType,
      exact_angle: a.exactAngle,
      orb: a.orb,
      is_applying: a.isApplying,
      nature: a.nature,
    }));

    const patterns = chart.patterns.map((p) => ({
      id: p.id,
      chart_id: chart.id,
      pattern_type: p.patternType,
      pattern_planets: {
        create: p.involvedPlanets.map((pName) => ({
          planet_id: planetNameToId.get(pName)!,
        })),
      },
    }));

    return {
      chart: chartData,
      planets,
      houses,
      angles,
      aspects,
      patterns,
    };
  }
}
