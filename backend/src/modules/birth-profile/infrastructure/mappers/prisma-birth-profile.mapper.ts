import { Prisma } from '@prisma/client';

import { BirthProfile } from '../../domain/entities/birth-profile.entity.js';
import { BirthDate } from '../../domain/value-objects/birth-date.vo.js';
import { BirthLocation } from '../../domain/value-objects/birth-location.vo.js';
import { BirthTime } from '../../domain/value-objects/birth-time.vo.js';
import { Coordinates } from '../../domain/value-objects/coordinates.vo.js';
import { Timezone } from '../../domain/value-objects/timezone.vo.js';

type PrismaBirthProfile = Prisma.BirthProfileGetPayload<{}>;

export class PrismaBirthProfileMapper {
  static toDomain(record: PrismaBirthProfile): BirthProfile {
    // birthDate mapping
    const birthDate = BirthDate.reconstitute(record.birth_date);

    // birthTime mapping
    let birthTime: BirthTime | null = null;
    if (record.birth_time) {
      // Prisma returns time as a Date object where the time part represents the value in UTC.
      const hour = record.birth_time.getUTCHours().toString().padStart(2, '0');
      const minute = record.birth_time.getUTCMinutes().toString().padStart(2, '0');
      const second = record.birth_time.getUTCSeconds().toString().padStart(2, '0');
      birthTime = BirthTime.reconstitute(`${hour}:${minute}:${second}`);
    }

    // birthLocation mapping
    const coordinates = Coordinates.reconstitute(
      record.latitude.toNumber(),
      record.longitude.toNumber(),
    );
    const timezone = Timezone.reconstitute(record.historical_timezone_id);
    const birthLocation = BirthLocation.reconstitute(record.place_name, coordinates, timezone);

    return BirthProfile.reconstitute({
      id: record.id,
      userId: record.user_id,
      label: record.label,
      fullName: record.full_name,
      birthDate,
      birthTime,
      isBirthTimeKnown: record.is_birth_time_known,
      birthLocation,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      deletedAt: record.deleted_at,
      version: record.version,
    });
  }

  static toPersistence(profile: BirthProfile): Prisma.BirthProfileUncheckedCreateInput {
    let birthTimeAsDate: Date | null = null;
    if (profile.birthTime) {
      birthTimeAsDate = new Date(
        Date.UTC(
          1970,
          0,
          1,
          profile.birthTime.hour,
          profile.birthTime.minute,
          profile.birthTime.second,
        ),
      );
    }

    return {
      id: profile.id,
      user_id: profile.userId,
      label: profile.label,
      full_name: profile.fullName,
      birth_date: profile.birthDate.value,
      birth_time: birthTimeAsDate,
      is_birth_time_known: profile.isBirthTimeKnown,
      place_name: profile.birthLocation.placeName,
      latitude: profile.birthLocation.coordinates.latitude,
      longitude: profile.birthLocation.coordinates.longitude,
      historical_timezone_id: profile.birthLocation.timezone.value,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
      version: profile.version,
    };
  }

  static toUpdatePersistence(profile: BirthProfile): Prisma.BirthProfileUncheckedUpdateInput {
    let birthTimeAsDate: Date | null = null;
    if (profile.birthTime) {
      birthTimeAsDate = new Date(
        Date.UTC(
          1970,
          0,
          1,
          profile.birthTime.hour,
          profile.birthTime.minute,
          profile.birthTime.second,
        ),
      );
    }

    return {
      label: profile.label,
      full_name: profile.fullName,
      birth_date: profile.birthDate.value,
      birth_time: birthTimeAsDate,
      is_birth_time_known: profile.isBirthTimeKnown,
      place_name: profile.birthLocation.placeName,
      latitude: profile.birthLocation.coordinates.latitude,
      longitude: profile.birthLocation.coordinates.longitude,
      historical_timezone_id: profile.birthLocation.timezone.value,
      // we do not update user_id or created_at or deleted_at here normally
      // version is incremented at the repository level, so we don't set it here
      // updatedAt is handled by DB trigger, so we don't set it here either.
    };
  }
}
