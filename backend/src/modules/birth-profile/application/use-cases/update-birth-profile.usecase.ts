import { NotFoundError } from '../../../../shared/errors/app-error.js';
import { BirthProfile } from '../../domain/entities/birth-profile.entity.js';
import { IBirthProfileRepository } from '../../domain/ports/birth-profile-repository.port.js';
import { BirthDate } from '../../domain/value-objects/birth-date.vo.js';
import { BirthLocation } from '../../domain/value-objects/birth-location.vo.js';
import { BirthTime } from '../../domain/value-objects/birth-time.vo.js';
import { Coordinates } from '../../domain/value-objects/coordinates.vo.js';
import { Timezone } from '../../domain/value-objects/timezone.vo.js';
import { mapDomainErrorToAppError } from '../errors/map-domain-error.js';
import { assertOwnership } from '../shared/assert-ownership.js';

export interface UpdateBirthProfileCommand {
  id: string;
  userId: string;
  label?: string;
  fullName?: string | null;
  birthDate?: string;
  birthTime?: string | null;
  isBirthTimeKnown?: boolean;
  birthLocation?: {
    city: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
}

export interface UpdateBirthProfileResult {
  profile: BirthProfile;
}

export class UpdateBirthProfileUseCase {
  constructor(private readonly repository: IBirthProfileRepository) {}

  async execute(command: UpdateBirthProfileCommand): Promise<UpdateBirthProfileResult> {
    const profile = await this.repository.findById(command.id);

    if (!profile) {
      throw new NotFoundError('Birth profile not found');
    }

    assertOwnership(profile, command.userId);

    try {
      // Partial construct changes
      const changes: Parameters<BirthProfile['update']>[0] = {};

      if (command.label !== undefined) {
        changes.label = command.label;
      }

      if (command.fullName !== undefined) {
        changes.fullName = command.fullName;
      }

      if (command.isBirthTimeKnown !== undefined) {
        changes.isBirthTimeKnown = command.isBirthTimeKnown;
      }

      if (command.birthDate !== undefined) {
        changes.birthDate = BirthDate.create(command.birthDate);
      }

      if (command.birthTime !== undefined) {
        changes.birthTime = command.birthTime ? BirthTime.create(command.birthTime) : null;
      } else if (command.isBirthTimeKnown === false) {
        // Edge case: isBirthTimeKnown changed to false, but birthTime not provided.
        // We must explicitly set birthTime to null, otherwise Entity will use the old non-null birthTime
        // and throw InvalidBirthTimeStateError.
        changes.birthTime = null;
      }

      if (command.birthLocation !== undefined) {
        changes.birthLocation = BirthLocation.create(
          command.birthLocation.city,
          Coordinates.create(command.birthLocation.latitude, command.birthLocation.longitude),
          Timezone.create(command.birthLocation.timezone),
        );
      }

      const newProfile = profile.update(changes);

      await this.repository.update(newProfile);

      return { profile: newProfile };
    } catch (error) {
      if (error instanceof Error) {
        throw mapDomainErrorToAppError(error);
      }
      throw error;
    }
  }
}
