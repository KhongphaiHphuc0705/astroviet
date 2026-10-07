import { describe, it, expect, beforeAll } from 'vitest';

import { generateOpenApiDocument } from '../../../src/docs/openapi.js';
import '../../../src/modules/chart/presentation/openapi/chart.openapi.js';

describe('OpenAPI Contract for Chart Interpretations', () => {
  let openapiObj: any;

  beforeAll(() => {
    openapiObj = generateOpenApiDocument();
  });

  it('should define InterpretationResponse with exactly 5 properties and correct required fields', () => {
    const interpretationSchema = openapiObj.components.schemas.InterpretationResponse;
    expect(interpretationSchema).toBeDefined();

    const props = interpretationSchema.properties;
    expect(Object.keys(props).sort()).toEqual([
      'bodyText',
      'language',
      'subjectKey',
      'subjectType',
      'tone',
    ]);

    expect(interpretationSchema.required.sort()).toEqual([
      'bodyText',
      'language',
      'subjectKey',
      'subjectType',
    ]);
  });

  it('should define tone as nullable', () => {
    const interpretationSchema = openapiObj.components.schemas.InterpretationResponse;
    const toneProp = interpretationSchema.properties.tone;
    // OpenAPI 3.0 uses nullable: true
    // Some Zod-to-OpenAPI implementations represent this differently (e.g. type: ['string', 'null'])
    const isNullable =
      toneProp.nullable === true ||
      (Array.isArray(toneProp.type) && toneProp.type.includes('null'));
    expect(isNullable).toBe(true);
  });

  it('should define interpretationVersion as nullable string in ChartResponse', () => {
    const chartResponseSchema = openapiObj.components.schemas.ChartResponse;
    expect(chartResponseSchema).toBeDefined();

    const versionProp = chartResponseSchema.properties.interpretationVersion;
    expect(versionProp).toBeDefined();

    const isNullable =
      versionProp.nullable === true ||
      (Array.isArray(versionProp.type) && versionProp.type.includes('null'));
    expect(isNullable).toBe(true);
  });

  it('should include interpretations array in ChartResponse', () => {
    const chartResponseSchema = openapiObj.components.schemas.ChartResponse;
    const interpretationsProp = chartResponseSchema.properties.interpretations;

    expect(interpretationsProp).toBeDefined();
    expect(interpretationsProp.type).toBe('array');
    expect(interpretationsProp.items.$ref).toBe('#/components/schemas/InterpretationResponse');
  });
});
