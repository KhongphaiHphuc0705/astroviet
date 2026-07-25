import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';

import {
  GetBirthProfileUseCase,
  GetBirthProfileCommand,
} from '../../../../../../src/modules/birth-profile/application/use-cases/get-birth-profile.usecase.js';
import { BirthProfile } from '../../../../../../src/modules/birth-profile/domain/entities/birth-profile.entity.js';
import { IBirthProfileRepository } from '../../../../../../src/modules/birth-profile/domain/ports/birth-profile-repository.port.js';
import { BirthDate } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-date.vo.js';
import { BirthLocation } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-location.vo.js';
import { BirthTime } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-time.vo.js';
import { Coordinates } from '../../../../../../src/modules/birth-profile/domain/value-objects/coordinates.vo.js';
import { Timezone } from '../../../../../../src/modules/birth-profile/domain/value-objects/timezone.vo.js';
import {
  AuthorizationError,
  NotFoundError,
} from '../../../../../../src/shared/errors/app-error.js';

describe('GetBirthProfileUseCase', () => {
  let repository: Mocked<IBirthProfileRepository>;
  let useCase: GetBirthProfileUseCase;
  let mockProfile: BirthProfile;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      listByUserId: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    useCase = new GetBirthProfileUseCase(repository);

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

  it('1. should return profile successfully if found and authorized', async () => {
    repository.findById.mockResolvedValue(mockProfile);

    const command: GetBirthProfileCommand = { id: 'profile-123', userId: 'user-123' };
    const result = await useCase.execute(command);

    expect(result.profile).toBe(mockProfile);
    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.findById).toHaveBeenCalledWith('profile-123');
  });

  it('2. should throw NotFoundError if profile does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const command: GetBirthProfileCommand = { id: 'non-existent', userId: 'user-123' };

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundError);
    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.findById).toHaveBeenCalledWith('non-existent');
  });

  it('3. should throw AuthorizationError if user does not own the profile', async () => {
    repository.findById.mockResolvedValue(mockProfile);

    const command: GetBirthProfileCommand = { id: 'profile-123', userId: 'other-user' };

    await expect(useCase.execute(command)).rejects.toThrow(AuthorizationError);
    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.findById).toHaveBeenCalledWith('profile-123');
  });
});
