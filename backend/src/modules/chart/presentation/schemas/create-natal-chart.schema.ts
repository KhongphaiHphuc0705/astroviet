import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const engineInputBirthDataSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z
    .object({
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59),
      second: z.number().int().min(0).max(59),
    })
    .nullable(),
  isBirthTimeKnown: z.boolean(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezoneId: z.string().min(1),
  placeName: z.string().min(1),
});

export const createNatalChartSchema = z
  .object({
    birthProfileId: z.string().uuid().optional(),
    birthData: engineInputBirthDataSchema.optional(),
    houseSystem: z.enum(['Placidus', 'WholeSign']),
    includeOptionalPoints: z
      .array(z.enum(['Chiron', 'Lilith', 'NorthNode', 'SouthNode']))
      .optional()
      .default([]),
  })
  .openapi('CreateNatalChartRequest');

export type CreateNatalChartRequest = z.infer<typeof createNatalChartSchema>;
