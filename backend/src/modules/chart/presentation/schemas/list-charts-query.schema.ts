import { z } from 'zod';
import '@asteasolutions/zod-to-openapi';

export const listChartsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    birthProfileId: z.string().uuid().optional(),
    sortBy: z.enum(['calculatedAt']).default('calculatedAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .openapi('ListChartsQueryRequest');

export type ListChartsQueryRequest = z.infer<typeof listChartsQuerySchema>;
