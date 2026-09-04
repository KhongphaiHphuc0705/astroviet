import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const createNatalChartQuerySchema = z
  .object({
    save: z
      .union([z.string(), z.boolean()])
      .optional()
      .transform((val) => {
        if (typeof val === 'boolean') return val;
        if (val === 'false') return false;
        return true; // Default to true if not provided or anything else
      }),
  })
  .openapi('CreateNatalChartQuery');

export type CreateNatalChartQuery = z.infer<typeof createNatalChartQuerySchema>;
