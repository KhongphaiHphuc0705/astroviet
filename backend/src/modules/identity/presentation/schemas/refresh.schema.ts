import { z } from 'zod';

export const refreshSchema = z
  .object({
    refreshToken: z.string().optional(),
  })
  .openapi('RefreshRequest');

export type RefreshRequest = z.infer<typeof refreshSchema>;
