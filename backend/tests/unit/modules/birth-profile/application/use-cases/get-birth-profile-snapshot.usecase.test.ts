import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';

import {
  GetBirthProfileSnapshotUseCase,
  GetBirthProfileSnapshotCommand,
} from '../../../../../../src/modules/birth-profile/application/use-cases/get-birth-profile-snapshot.usecase.js';
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
import { ErrorCode } from '../../../../../../src/shared/errors/error-codes.js';

describe('GetBirthProfileSnapshotUseCase', () => {
  let repository: Mocked<IBirthProfileRepository>;
  let useCase: GetBirthProfileSnapshotUseCase;
  let mockProfileKnownTime: BirthProfile;
  let mockProfileUnknownTime: BirthProfile;
  let now: Date;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      listByUserId: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    useCase = new GetBirthProfileSnapshotUseCase(repository);
    now = new Date();

    mockProfileKnownTime = BirthProfile.create({
      id: 'profile-1',
      userId: 'user-123',
      label: 'Known Time Profile',
      fullName: 'John Doe',
      birthDate: BirthDate.create('1990-01-01'),
      birthTime: BirthTime.create('12:30:45'),
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

    mockProfileUnknownTime = BirthProfile.create({
      id: 'profile-2',
      userId: 'user-123',
      label: 'Unknown Time Profile',
      fullName: 'Jane Doe',
      birthDate: BirthDate.create('1990-01-01'),
      birthTime: null,
      isBirthTimeKnown: false,
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

  it('1. should return mapped BirthDataSnapshot when profile exists and time is known', async () => {
    repository.findById.mockResolvedValue(mockProfileKnownTime);

    const command: GetBirthProfileSnapshotCommand = {
      birthProfileId: 'profile-1',
      requestingUserId: 'user-123',
    };
    const result = await useCase.execute(command);

    expect(result).toStrictEqual({
      birthDate: mockProfileKnownTime.birthDate.value,
      birthTime: { hour: 12, minute: 30, second: 45 },
      isBirthTimeKnown: true,
      latitude: 10.8231,
      longitude: 106.6297,
      timezoneId: 'Asia/Ho_Chi_Minh',
    });
    expect(repository.findById).toHaveBeenCalledWith('profile-1');
  });

  it('2. should return mapped BirthDataSnapshot with null birthTime when time is unknown', async () => {
    repository.findById.mockResolvedValue(mockProfileUnknownTime);

    const command: GetBirthProfileSnapshotCommand = {
      birthProfileId: 'profile-2',
      requestingUserId: 'user-123',
    };
    const result = await useCase.execute(command);

    expect(result).toStrictEqual({
      birthDate: mockProfileUnknownTime.birthDate.value,
      birthTime: null,
      isBirthTimeKnown: false,
      latitude: 10.8231,
      longitude: 106.6297,
      timezoneId: 'Asia/Ho_Chi_Minh',
    });
  });

  it('3. should throw NotFoundError if profile does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const command: GetBirthProfileSnapshotCommand = {
      birthProfileId: 'non-existent',
      requestingUserId: 'user-123',
    };

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundError);
    expect(repository.findById).toHaveBeenCalledWith('non-existent');
  });

  it('4. should throw AuthorizationError if user does not own the profile', async () => {
    repository.findById.mockResolvedValue(mockProfileKnownTime);

    const command: GetBirthProfileSnapshotCommand = {
      birthProfileId: 'profile-1',
      requestingUserId: 'other-user',
    };

    await expect(useCase.execute(command)).rejects.toThrow(AuthorizationError);
    await expect(useCase.execute(command)).rejects.toMatchObject({
      errorCode: ErrorCode.FORBIDDEN,
    });
  });

  it('5. should throw NotFoundError if profile is soft-deleted (repository returns null)', async () => {
    // Note: The repository layer filters out soft-deleted profiles by returning null.
    // The Use Case treats it exactly the same as a non-existent profile.
    repository.findById.mockResolvedValue(null);

    const command: GetBirthProfileSnapshotCommand = {
      birthProfileId: 'deleted-profile',
      requestingUserId: 'user-123',
    };

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundError);
  });

  it('6. should map latitude, longitude, and timezone precisely without altering values', async () => {
    const preciseProfile = BirthProfile.create({
      id: 'profile-3',
      userId: 'user-123',
      label: 'Precise Profile',
      fullName: 'Precise',
      birthDate: BirthDate.create('2000-05-05'),
      birthTime: null,
      isBirthTimeKnown: false,
      birthLocation: BirthLocation.create(
        'Precise Location',
        Coordinates.create(10.1234567, 106.9876543),
        Timezone.create('Europe/London'),
      ),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
    repository.findById.mockResolvedValue(preciseProfile);

    const command: GetBirthProfileSnapshotCommand = {
      birthProfileId: 'profile-3',
      requestingUserId: 'user-123',
    };
    const result = await useCase.execute(command);

    expect(result.latitude).toBe(10.1234567);
    expect(result.longitude).toBe(106.9876543);
    expect(result.timezoneId).toBe('Europe/London');
  });
});
