import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { Chart } from '../../domain/entities/chart.entity.js';

extendZodWithOpenApi(z);

export const chartSummaryResponseSchema = z
  .object({
    id: z.string().uuid(),
    birthProfileId: z.string().uuid().nullable(),
    birthProfileLabel: z.string().nullable(), // D-3 — luôn null, xem comment
    houseSystem: z.string(),
    calculatedAt: z.string().datetime(),
  })
  .openapi('ChartSummaryResponse');

export class ChartSummaryResponseMapper {
  static toResponse(chart: Chart): z.infer<typeof chartSummaryResponseSchema> {
    return {
      id: chart.id,
      birthProfileId: chart.birthProfileId,
      birthProfileLabel: null, // D-3: Known Gap — birth-profile/index.ts không export label cross-module
      houseSystem: chart.houseSystem,
      calculatedAt: chart.calculationMetadata.calculatedAt.toISOString(),
    };
  }
}
