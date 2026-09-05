import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const chartIdSchema = z
  .object({
    id: z.string().uuid(),
  })
  .openapi('ChartIdParams');

export type ChartIdParams = z.infer<typeof chartIdSchema>;
