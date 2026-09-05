import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { Angle } from '../../domain/entities/angle.entity.js';
import { Aspect } from '../../domain/entities/aspect.entity.js';
import { Chart } from '../../domain/entities/chart.entity.js';
import { House } from '../../domain/entities/house.entity.js';
import { Pattern } from '../../domain/entities/pattern.entity.js';
import { Planet } from '../../domain/entities/planet.entity.js';
import { Warning } from '../../domain/value-objects/warning.vo.js';
import { ZodiacPosition } from '../../domain/value-objects/zodiac-position.vo.js';

extendZodWithOpenApi(z);

const planetResponseSchema = z.object({
  name: z.string(),
  category: z.string(),
  longitude: z.number(),
  speed: z.number(),
  isRetrograde: z.boolean(),
  sign: z.string(),
  degreeInSign: z.number(),
  house: z.number().nullable(),
});

const houseResponseSchema = z.object({
  number: z.number(),
  cuspDegree: z.number(),
  signOnCusp: z.string(),
});

const angleResponseSchema = z.object({
  type: z.string(),
  longitude: z.number(),
  sign: z.string(),
  degreeInSign: z.number(),
});

const aspectResponseSchema = z.object({
  aspectType: z.string(),
  planetA: z.string(),
  planetB: z.string(),
  exactAngle: z.number(),
  orb: z.number(),
  isApplying: z.boolean(),
  nature: z.string(),
});

const patternResponseSchema = z.object({
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
        name: planet.name,
        category: planet.category,
        longitude: planet.longitude,
        speed: planet.speed,
        isRetrograde: planet.isRetrograde,
        sign: planet.zodiacPosition.sign,
        degreeInSign: planet.zodiacPosition.degreeInSign,
        house: planet.house,
      })),
      houses: chart.houses.map((house: House) => ({
        number: house.number,
        cuspDegree: house.cuspDegree,
        signOnCusp: ZodiacPosition.fromLongitude(house.cuspDegree).sign,
      })),
      angles: chart.angles.map((angle: Angle) => ({
        type: angle.type,
        longitude: angle.longitude,
        sign: ZodiacPosition.fromLongitude(angle.longitude).sign,
        degreeInSign: ZodiacPosition.fromLongitude(angle.longitude).degreeInSign,
      })),
      aspects: chart.aspects.map((aspect: Aspect) => ({
        aspectType: aspect.aspectType,
        planetA: aspect.planetA,
        planetB: aspect.planetB,
        exactAngle: aspect.exactAngle,
        orb: aspect.orb,
        isApplying: aspect.isApplying,
        nature: aspect.nature,
      })),
      patterns: chart.patterns.map((pattern: Pattern) => ({
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
