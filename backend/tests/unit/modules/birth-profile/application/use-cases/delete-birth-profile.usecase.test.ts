import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';

import {
  DeleteBirthProfileUseCase,
  DeleteBirthProfileCommand,
} from '../../../../../../src/modules/birth-profile/application/use-cases/delete-birth-profile.usecase.js';
import { BirthProfile } from '../../../../../../src/modules/birth-profile/domain/entities/birth-profile.entity.js';
import { IBirthProfileRepository } from '../../../../../../src/modules/birth-profile/domain/ports/birth-profile-repository.port.js';
import { BirthDate } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-date.vo.js';
import { BirthLocation } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-location.vo.js';
import { BirthTime } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-time.vo.js';
import { Coordinates } from '../../../../../../src/modules/birth-profile/domain/value-objects/coordinates.vo.js';
import { Timezone } from '../../../../../../src/modules/birth-profile/domain/value-objects/timezone.vo.js';
import {
  AuthorizationError,
  InfrastructureError,
  NotFoundError,
} from '../../../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../../../src/shared/errors/error-codes.js';

describe('DeleteBirthProfileUseCase', () => {
  let repository: Mocked<IBirthProfileRepository>;
  let useCase: DeleteBirthProfileUseCase;
  let mockProfile: BirthProfile;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      listByUserId: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    useCase = new DeleteBirthProfileUseCase(repository);

    const now = new Date();
    mockProfile = BirthProfile.create({
      id: 'profile-123',
      userId: 'user-123',
      label: 'My Profile',
      fullName: 'John Doe',
      birthDate: BirthDate.create('1990-01-01'),
      birthTime: BirthTime.create('12:00:00'),
      isBirthTimeKnown: true,
      birthLocation: BirthLocation.create(
        'Ho Chi Minh',
        Coordinates.create(10.8231, 106.6297),
        Timezone.create('Asia/Ho_Chi_Minh'),
      ),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  });

  it('1. should delete profile successfully if found and authorized (Happy Path)', async () => {
    repository.findById.mockResolvedValue(mockProfile);
    repository.softDelete.mockResolvedValue(true);

    const command: DeleteBirthProfileCommand = { id: 'profile-123', userId: 'user-123' };
    await expect(useCase.execute(command)).resolves.toBeUndefined();

    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.findById).toHaveBeenCalledWith('profile-123');
    expect(repository.softDelete).toHaveBeenCalledTimes(1);
    expect(repository.softDelete).toHaveBeenCalledWith('profile-123', 'user-123');
  });

  it('2. should throw NotFoundError if profile does not exist (Not Found)', async () => {
    repository.findById.mockResolvedValue(null);

    const command: DeleteBirthProfileCommand = { id: 'non-existent', userId: 'user-123' };

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundError);
    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('3. should throw AuthorizationError if user does not own the profile (Ownership Failure)', async () => {
    repository.findById.mockResolvedValue(mockProfile);

    const command: DeleteBirthProfileCommand = { id: 'profile-123', userId: 'other-user' };

    await expect(useCase.execute(command)).rejects.toThrow(AuthorizationError);
    await expect(useCase.execute(command)).rejects.toMatchObject({
      errorCode: ErrorCode.FORBIDDEN,
    });

    expect(repository.findById).toHaveBeenCalledTimes(2); // due to 2 expects
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('4. should throw NotFoundError if softDelete returns false (Race condition)', async () => {
    repository.findById.mockResolvedValue(mockProfile);
    repository.softDelete.mockResolvedValue(false);

    const command: DeleteBirthProfileCommand = { id: 'profile-123', userId: 'user-123' };

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundError);
    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.softDelete).toHaveBeenCalledTimes(1);
  });

  it('5. should not catch InfrastructureError from repository', async () => {
    repository.findById.mockResolvedValue(mockProfile);
    const error = new InfrastructureError('DB error');
    repository.softDelete.mockRejectedValue(error);

    const command: DeleteBirthProfileCommand = { id: 'profile-123', userId: 'user-123' };

    await expect(useCase.execute(command)).rejects.toThrow(InfrastructureError);
    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.softDelete).toHaveBeenCalledTimes(1);
  });
});
