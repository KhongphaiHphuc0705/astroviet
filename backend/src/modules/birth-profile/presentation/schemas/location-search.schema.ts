import { z } from 'zod';

export const searchLocationsQuerySchema = z
  .object({
    q: z
      .string()
      .min(2, 'Query must be at least 2 characters long')
      .max(100, 'Query must not exceed 100 characters'),
  })
  .openapi('SearchLocationsQuery');

export type SearchLocationsQuery = z.infer<typeof searchLocationsQuerySchema>;
