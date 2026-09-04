import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { Angle } from '../../domain/entities/angle.entity.js';
import { Aspect } from '../../domain/entities/aspect.entity.js';
import { Chart } from '../../domain/entities/chart.entity.js';
import { House } from '../../domain/entities/house.entity.js';
import { Pattern } from '../../domain/entities/pattern.entity.js';
import { Planet } from '../../domain/entities/planet.entity.js';
import { Warning } from '../../domain/value-objects/warning.vo.js';

extendZodWithOpenApi(z);

const zodiacPositionSchema = z.object({
  longitude: z.number(),
  sign: z.string(),
  degreeInSign: z.number(),
});

const planetResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  longitude: z.number(),
  latitude: z.number(),
  speed: z.number(),
  isRetrograde: z.boolean(),
  zodiacPosition: zodiacPositionSchema,
  house: z.number().nullable(),
});

const houseResponseSchema = z.object({
  id: z.string().uuid(),
  number: z.number(),
  cuspDegree: z.number(),
  houseSystem: z.string(),
});

const angleResponseSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  longitude: z.number(),
});

const aspectResponseSchema = z.object({
  id: z.string().uuid(),
  aspectType: z.string(),
  planetA: z.string(),
  planetB: z.string(),
  exactAngle: z.number(),
  orb: z.number(),
  isApplying: z.boolean(),
  nature: z.string(),
});

const patternResponseSchema = z.object({
  id: z.string().uuid(),
  patternType: z.string(),
  involvedPlanets: z.array(z.string()),
});

const warningSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: z.string(),
  field: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

const interpretationResponseSchema = z
  .object({
    subjectType: z.string(),
    subjectKey: z.string(),
    language: z.string(),
    bodyText: z.string(),
    tone: z.string().nullable().optional(),
  })
  .openapi('InterpretationResponse'); // đúng REST API Spec §5.5, dù runtime luôn rỗng (D-2)

export const chartResponseSchema = z
  .object({
    id: z.string().uuid(),
    chartType: z.string(),
    houseSystem: z.string(),
    isHouseDataAvailable: z.boolean(),
    planets: z.array(planetResponseSchema),
    houses: z.array(houseResponseSchema),
    angles: z.array(angleResponseSchema),
    aspects: z.array(aspectResponseSchema),
    patterns: z.array(patternResponseSchema),
    interpretations: z.array(interpretationResponseSchema), // D-2 — luôn rỗng runtime, schema vẫn đúng contract
    warnings: z.array(warningSchema),
    calculatedAt: z.string().datetime(),
    engineVersion: z.string(),
  })
  .openapi('ChartResponse');

export class ChartResponseMapper {
  static toResponse(chart: Chart): z.infer<typeof chartResponseSchema> {
    return {
      id: chart.id,
      chartType: chart.chartType,
      houseSystem: chart.houseSystem,
      isHouseDataAvailable: chart.isHouseDataAvailable,
      planets: chart.planets.map((planet: Planet) => ({
        id: planet.id,
        name: planet.name,
        category: planet.category,
        longitude: planet.longitude,
        latitude: planet.latitude,
        speed: planet.speed,
        isRetrograde: planet.isRetrograde,
        zodiacPosition: {
          longitude: planet.zodiacPosition.longitude,
          sign: planet.zodiacPosition.sign,
          degreeInSign: planet.zodiacPosition.degreeInSign,
        },
        house: planet.house,
      })),
      houses: chart.houses.map((house: House) => ({
        id: house.id,
        number: house.number,
        cuspDegree: house.cuspDegree,
        houseSystem: house.houseSystem,
      })),
      angles: chart.angles.map((angle: Angle) => ({
        id: angle.id,
        type: angle.type,
        longitude: angle.longitude,
      })),
      aspects: chart.aspects.map((aspect: Aspect) => ({
        id: aspect.id,
        aspectType: aspect.aspectType,
        planetA: aspect.planetA,
        planetB: aspect.planetB,
        exactAngle: aspect.exactAngle,
        orb: aspect.orb,
        isApplying: aspect.isApplying,
        nature: aspect.nature,
      })),
      patterns: chart.patterns.map((pattern: Pattern) => ({
        id: pattern.id,
        patternType: pattern.patternType,
        involvedPlanets: pattern.involvedPlanets as string[],
      })),
      interpretations: [], // D-2: Known Gap — Interpretation module chưa tồn tại (Sprint 3)
      warnings: chart.warnings.map((warning: Warning) => ({
        code: warning.code,
        message: warning.message,
        severity: warning.severity,
        field: warning.field,
        details: warning.details,
      })),
      calculatedAt: chart.calculationMetadata.calculatedAt.toISOString(),
      engineVersion: chart.calculationMetadata.engineVersion,
    };
  }
}
