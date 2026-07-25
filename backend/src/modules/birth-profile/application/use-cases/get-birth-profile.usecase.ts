import { NotFoundError } from '../../../../shared/errors/app-error.js';
import { BirthProfile } from '../../domain/entities/birth-profile.entity.js';
import { IBirthProfileRepository } from '../../domain/ports/birth-profile-repository.port.js';
import { assertOwnership } from '../shared/assert-ownership.js';

export interface GetBirthProfileCommand {
  id: string;
  userId: string;
}

export interface GetBirthProfileResult {
  profile: BirthProfile;
}

export class GetBirthProfileUseCase {
  constructor(private readonly repository: IBirthProfileRepository) {}

  async execute(command: GetBirthProfileCommand): Promise<GetBirthProfileResult> {
    const profile = await this.repository.findById(command.id);

    if (!profile) {
      throw new NotFoundError('Birth profile not found');
    }

    assertOwnership(profile, command.userId);

    return { profile };
  }
}
