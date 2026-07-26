import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const birthProfileIdSchema = z
  .object({
    id: z.string().uuid('ID không hợp lệ'),
  })
  .openapi('BirthProfileIdParams');

export type BirthProfileIdParams = z.infer<typeof birthProfileIdSchema>;
