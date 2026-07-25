import { NotFoundError } from '../../../../shared/errors/app-error.js';
import { IBirthProfileRepository } from '../../domain/ports/birth-profile-repository.port.js';
import { assertOwnership } from '../shared/assert-ownership.js';

export interface DeleteBirthProfileCommand {
  id: string;
  userId: string;
}

export class DeleteBirthProfileUseCase {
  constructor(private readonly repository: IBirthProfileRepository) {}

  async execute(command: DeleteBirthProfileCommand): Promise<void> {
    const profile = await this.repository.findById(command.id);

    if (!profile) {
      throw new NotFoundError('Birth profile not found');
    }

    assertOwnership(profile, command.userId);

    const deleted = await this.repository.softDelete(command.id, command.userId);

    if (!deleted) {
      // Race condition where it was deleted between findById and softDelete.
      // In this case, we treat it as if it's already not found to keep idempotency.
      throw new NotFoundError('Birth profile not found');
    }
  }
}
