import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const createNatalChartQuerySchema = z
  .object({
    save: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
  })
  .openapi('CreateNatalChartQuery');

export type CreateNatalChartQuery = z.infer<typeof createNatalChartQuerySchema>;
