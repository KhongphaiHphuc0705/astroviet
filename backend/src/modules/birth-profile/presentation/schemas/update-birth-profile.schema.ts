import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const updateBirthProfileSchema = z
  .object({
    label: z.string().min(1).optional(),
    fullName: z.string().nullable().optional(),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
      .optional(),
    birthTime: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (HH:mm:ss)')
      .nullable()
      .optional(),
    isBirthTimeKnown: z.boolean().optional(),
    birthLocation: z
      .object({
        placeName: z.string().min(1),
        latitude: z.number(),
        longitude: z.number(),
        historicalTimezoneId: z.string().min(1),
      })
      .optional(),
  })
  .openapi('UpdateBirthProfileRequest');

export type UpdateBirthProfileRequest = z.infer<typeof updateBirthProfileSchema>;
