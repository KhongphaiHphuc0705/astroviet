import { z } from 'zod';

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export type RefreshRequest = z.infer<typeof refreshSchema>['body'];
