import { BirthProfile } from '../../domain/entities/birth-profile.entity.js';
import { IBirthProfileRepository } from '../../domain/ports/birth-profile-repository.port.js';
import { BirthDate } from '../../domain/value-objects/birth-date.vo.js';
import { BirthLocation } from '../../domain/value-objects/birth-location.vo.js';
import { BirthTime } from '../../domain/value-objects/birth-time.vo.js';
import { Coordinates } from '../../domain/value-objects/coordinates.vo.js';
import { Timezone } from '../../domain/value-objects/timezone.vo.js';
import { mapDomainErrorToAppError } from '../errors/map-domain-error.js';

export interface CreateBirthProfileCommand {
  userId: string;
  label: string;
  fullName: string | null;
  birthDate: string;
  birthTime: string | null;
  isBirthTimeKnown: boolean;
  birthLocation: {
    placeName: string;
    latitude: number;
    longitude: number;
    historicalTimezoneId: string;
  };
}

export interface CreateBirthProfileResult {
  profile: BirthProfile;
  warnings: unknown[]; // To be typed properly later if needed, but [] for now
}

export class CreateBirthProfileUseCase {
  constructor(private readonly repository: IBirthProfileRepository) {}

  async execute(command: CreateBirthProfileCommand): Promise<CreateBirthProfileResult> {
    const id = crypto.randomUUID();

    let profile: BirthProfile;
    try {
      const birthDate = BirthDate.create(command.birthDate);
      const birthTime =
        command.isBirthTimeKnown && command.birthTime ? BirthTime.create(command.birthTime) : null;

      const coordinates = Coordinates.create(
        command.birthLocation.latitude,
        command.birthLocation.longitude,
      );

      const timezone = Timezone.create(command.birthLocation.historicalTimezoneId);

      const birthLocation = BirthLocation.create(
        command.birthLocation.placeName,
        coordinates,
        timezone,
      );

      const now = new Date();

      profile = BirthProfile.create({
        id,
        userId: command.userId,
        label: command.label,
        fullName: command.fullName,
        birthDate,
        birthTime,
        isBirthTimeKnown: command.isBirthTimeKnown,
        birthLocation,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        version: 1,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw mapDomainErrorToAppError(error);
      }
      throw error;
    }

    await this.repository.create(profile);

    return {
      profile,
      warnings: [],
    };
  }
}
