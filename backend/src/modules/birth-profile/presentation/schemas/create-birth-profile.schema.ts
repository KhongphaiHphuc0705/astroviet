import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const createBirthProfileSchema = z
  .object({
    label: z.string().min(1),
    fullName: z.string().nullable().optional(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    birthTime: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (HH:mm:ss)')
      .nullable()
      .optional(),
    isBirthTimeKnown: z.boolean(),
    birthLocation: z.object({
      placeName: z.string().min(1),
      latitude: z.number(),
      longitude: z.number(),
      historicalTimezoneId: z.string().min(1),
    }),
  })
  .openapi('CreateBirthProfileRequest');

export type CreateBirthProfileRequest = z.infer<typeof createBirthProfileSchema>;
