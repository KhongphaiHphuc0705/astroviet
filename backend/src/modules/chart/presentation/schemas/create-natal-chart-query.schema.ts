import { z } from 'zod';
import '@asteasolutions/zod-to-openapi';

export const createNatalChartQuerySchema = z
  .object({
    save: z.coerce.boolean().default(false),
  })
  .openapi('CreateNatalChartQuery');

export type CreateNatalChartQuery = z.infer<typeof createNatalChartQuerySchema>;
