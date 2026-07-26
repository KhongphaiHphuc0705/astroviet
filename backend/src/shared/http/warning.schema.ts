import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const warningSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    severity: z.string(),
    field: z.string().optional(),
    details: z.record(z.any()).optional(),
  })
  .openapi('Warning');

export type Warning = z.infer<typeof warningSchema>;
