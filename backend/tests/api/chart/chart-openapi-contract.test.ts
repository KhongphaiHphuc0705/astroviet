import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { describe, it, expect, beforeAll } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('OpenAPI Contract for Chart Interpretations (O-M5-1)', () => {
  let openapiObj: any;

  beforeAll(() => {
    // openapi.json is generated at backend/openapi.json
    const openapiPath = path.resolve(__dirname, '../../../openapi.json');
    if (!fs.existsSync(openapiPath)) {
      throw new Error(
        `openapi.json not found at ${openapiPath}. Run npm run generate:openapi first.`,
      );
    }
    const content = fs.readFileSync(openapiPath, 'utf8');
    openapiObj = JSON.parse(content);
  });

  it('should define InterpretationResponse with exactly 5 properties (subjectType, subjectKey, language, bodyText, tone)', () => {
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
  });

  it('should define tone as nullable', () => {
    const interpretationSchema = openapiObj.components.schemas.InterpretationResponse;
    const toneProp = interpretationSchema.properties.tone;
    // OpenAPI 3.0 uses nullable: true
    // Some Zod-to-OpenAPI implementations represent this differently (e.g. type: ['string', 'null'])
    // We check either one.
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
