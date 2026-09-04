import { z } from 'zod';
import '@asteasolutions/zod-to-openapi';

export const chartIdSchema = z.object({
  id: z.string().uuid(),
});

export type ChartIdParams = z.infer<typeof chartIdSchema>;
