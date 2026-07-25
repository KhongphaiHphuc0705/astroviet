import { z } from 'zod';

export const listBirthProfilesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'fullName']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type ListBirthProfilesQueryRequest = z.infer<typeof listBirthProfilesQuerySchema>;
