import { NotFoundError } from '../../../../shared/errors/app-error.js';
import { IBirthProfileRepository } from '../../domain/ports/birth-profile-repository.port.js';
import { assertOwnership } from '../shared/assert-ownership.js';

export interface GetBirthProfileSnapshotCommand {
  birthProfileId: string;
  requestingUserId: string;
}

export interface BirthDataSnapshot {
  fullName: string | null;
  placeName: string;
  birthDate: Date;
  birthTime: { hour: number; minute: number; second: number } | null;
  isBirthTimeKnown: boolean;
  latitude: number;
  longitude: number;
  timezoneId: string;
}

export class GetBirthProfileSnapshotUseCase {
  constructor(private readonly repository: IBirthProfileRepository) {}

  async execute(command: GetBirthProfileSnapshotCommand): Promise<BirthDataSnapshot> {
    const profile = await this.repository.findById(command.birthProfileId);

    if (!profile) {
      throw new NotFoundError('Birth profile not found');
    }

    assertOwnership(profile, command.requestingUserId);

    const birthTime = profile.birthTime;

    return {
      fullName: profile.fullName || null,
      placeName: profile.birthLocation.placeName,
      birthDate: profile.birthDate.value,
      birthTime: birthTime
        ? {
            hour: birthTime.hour,
            minute: birthTime.minute,
            second: birthTime.second,
          }
        : null,
      isBirthTimeKnown: profile.isBirthTimeKnown,
      latitude: profile.birthLocation.coordinates.latitude,
      longitude: profile.birthLocation.coordinates.longitude,
      timezoneId: profile.birthLocation.timezone.value,
    };
  }
}
