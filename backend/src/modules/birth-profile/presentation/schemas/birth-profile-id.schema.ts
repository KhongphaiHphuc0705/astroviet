import { z } from 'zod';

export const birthProfileIdSchema = z.object({
  id: z.string().uuid('ID không hợp lệ'),
});

export type BirthProfileIdParams = z.infer<typeof birthProfileIdSchema>;
