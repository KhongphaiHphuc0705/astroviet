import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { warningSchema } from '../../../../shared/http/warning.schema.js';
import { BirthProfile } from '../../domain/entities/birth-profile.entity.js';

extendZodWithOpenApi(z);

export const birthProfileResponseSchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    label: z.string(),
    fullName: z.string().nullable(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    birthTime: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/)
      .nullable(),
    isBirthTimeKnown: z.boolean(),
    placeName: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    historicalTimezoneId: z.string(),
    warnings: z.array(warningSchema),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('BirthProfileResponse');

export type BirthProfileResponse = z.infer<typeof birthProfileResponseSchema>;

export class BirthProfileResponseMapper {
  static toResponse(profile: BirthProfile): BirthProfileResponse {
    let formattedBirthTime: string | null = null;
    if (profile.birthTime) {
      const hh = profile.birthTime.hour.toString().padStart(2, '0');
      const mm = profile.birthTime.minute.toString().padStart(2, '0');
      const ss = profile.birthTime.second.toString().padStart(2, '0');
      formattedBirthTime = `${hh}:${mm}:${ss}`;
    }

    return {
      id: profile.id,
      userId: profile.userId,
      label: profile.label,
      fullName: profile.fullName,
      birthDate: profile.birthDate.value.toISOString().substring(0, 10),
      birthTime: formattedBirthTime,
      isBirthTimeKnown: profile.isBirthTimeKnown,
      placeName: profile.birthLocation.placeName,
      latitude: profile.birthLocation.coordinates.latitude,
      longitude: profile.birthLocation.coordinates.longitude,
      historicalTimezoneId: profile.birthLocation.timezone.value,
      warnings: [],
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
