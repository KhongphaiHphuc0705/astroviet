import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';

import {
  UpdateBirthProfileUseCase,
  UpdateBirthProfileCommand,
} from '../../../../../../src/modules/birth-profile/application/use-cases/update-birth-profile.usecase.js';
import { BirthProfile } from '../../../../../../src/modules/birth-profile/domain/entities/birth-profile.entity.js';
import { IBirthProfileRepository } from '../../../../../../src/modules/birth-profile/domain/ports/birth-profile-repository.port.js';
import { BirthDate } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-date.vo.js';
import { BirthLocation } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-location.vo.js';
import { BirthTime } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-time.vo.js';
import { Coordinates } from '../../../../../../src/modules/birth-profile/domain/value-objects/coordinates.vo.js';
import { Timezone } from '../../../../../../src/modules/birth-profile/domain/value-objects/timezone.vo.js';
import {
  DomainError,
  InfrastructureError,
  NotFoundError,
  OptimisticLockError,
} from '../../../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../../../src/shared/errors/error-codes.js';

describe('UpdateBirthProfileUseCase', () => {
  let repository: Mocked<IBirthProfileRepository>;
  let useCase: UpdateBirthProfileUseCase;
  let mockProfile: BirthProfile;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      listByUserId: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    useCase = new UpdateBirthProfileUseCase(repository);

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

  it('1. should successfully update partial fields (Happy Path)', async () => {
    repository.findById.mockResolvedValue(mockProfile);

    const command: UpdateBirthProfileCommand = {
      id: 'profile-123',
      userId: 'user-123',
      label: 'New Label',
      birthDate: '1995-05-05',
    };

    const result = await useCase.execute(command);

    expect(result.profile.label).toBe('New Label');
    expect(result.profile.birthDate.value.toISOString().substring(0, 10)).toBe('1995-05-05');
    // Unchanged fields should remain the same
    expect(result.profile.fullName).toBe('John Doe');

    expect(repository.findById).toHaveBeenCalledWith('profile-123');
    expect(repository.update).toHaveBeenCalledTimes(1);
    expect(repository.update).toHaveBeenCalledWith(result.profile);
  });

  it('2. should throw AuthorizationError if user does not own profile (Ownership Failure)', async () => {
    repository.findById.mockResolvedValue(mockProfile);

    const command: UpdateBirthProfileCommand = {
      id: 'profile-123',
      userId: 'other-user',
      label: 'New Label',
    };

    await expect(useCase.execute(command)).rejects.toMatchObject({
      errorCode: ErrorCode.FORBIDDEN,
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('3. should pass InfrastructureError thrown by repository update (Repository Failure)', async () => {
    repository.findById.mockResolvedValue(mockProfile);
    repository.update.mockRejectedValue(new InfrastructureError('DB error'));

    const command: UpdateBirthProfileCommand = {
      id: 'profile-123',
      userId: 'user-123',
      label: 'New Label',
    };

    await expect(useCase.execute(command)).rejects.toThrow(InfrastructureError);
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('4. should map domain errors to AppError (Validation Failure)', async () => {
    repository.findById.mockResolvedValue(mockProfile);

    const command: UpdateBirthProfileCommand = {
      id: 'profile-123',
      userId: 'user-123',
      birthDate: '3000-01-01', // Future date
    };

    await expect(useCase.execute(command)).rejects.toThrow(DomainError);
    await expect(useCase.execute(command)).rejects.toMatchObject({
      errorCode: ErrorCode.INVALID_BIRTH_DATE,
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('5. should pass OptimisticLockError straight up (Optimistic Lock Conflict)', async () => {
    repository.findById.mockResolvedValue(mockProfile);
    repository.update.mockRejectedValue(new OptimisticLockError('Conflict'));

    const command: UpdateBirthProfileCommand = {
      id: 'profile-123',
      userId: 'user-123',
      label: 'New Label',
    };

    await expect(useCase.execute(command)).rejects.toThrow(OptimisticLockError);
  });

  it('6. should throw NotFoundError if profile not found (Edge Case - Not Found)', async () => {
    repository.findById.mockResolvedValue(null);

    const command: UpdateBirthProfileCommand = {
      id: 'non-existent',
      userId: 'user-123',
      label: 'New Label',
    };

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('7. should process partial update with only fullName without building VOs (Edge Case)', async () => {
    repository.findById.mockResolvedValue(mockProfile);

    const command: UpdateBirthProfileCommand = {
      id: 'profile-123',
      userId: 'user-123',
      fullName: 'Jane Doe',
    };

    const result = await useCase.execute(command);
    expect(result.profile.fullName).toBe('Jane Doe');
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('8. should set birthTime to null when isBirthTimeKnown is changed to false implicitly (Edge Case)', async () => {
    repository.findById.mockResolvedValue(mockProfile);

    // Profile has isBirthTimeKnown=true and birthTime="12:00:00"
    // Client sends only isBirthTimeKnown=false
    const command: UpdateBirthProfileCommand = {
      id: 'profile-123',
      userId: 'user-123',
      isBirthTimeKnown: false,
    };

    const result = await useCase.execute(command);
    expect(result.profile.isBirthTimeKnown).toBe(false);
    expect(result.profile.birthTime).toBeNull();
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('9. should throw error if isBirthTimeKnown changed to true without providing birthTime', async () => {
    // Create a mock profile where birth time is unknown
    const now = new Date();
    const unknownTimeProfile = BirthProfile.create({
      id: 'profile-456',
      userId: 'user-123',
      label: 'Unknown Time Profile',
      fullName: null,
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

    repository.findById.mockResolvedValue(unknownTimeProfile);

    // Client sends isBirthTimeKnown=true but no birthTime
    const command: UpdateBirthProfileCommand = {
      id: 'profile-456',
      userId: 'user-123',
      isBirthTimeKnown: true,
    };

    await expect(useCase.execute(command)).rejects.toMatchObject({
      errorCode: ErrorCode.INVALID_BIRTH_TIME_STATE,
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('10. should successfully update birthLocation', async () => {
    repository.findById.mockResolvedValue(mockProfile);

    const command: UpdateBirthProfileCommand = {
      id: 'profile-123',
      userId: 'user-123',
      birthLocation: {
        placeName: 'Hanoi',
        latitude: 21.0285,
        longitude: 105.8542,
        historicalTimezoneId: 'Asia/Ho_Chi_Minh',
      },
    };

    const result = await useCase.execute(command);
    
    expect(result.profile.birthLocation.placeName).toBe('Hanoi');
    expect(result.profile.birthLocation.coordinates.latitude).toBe(21.0285);
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('11. should allow explicitly setting birthTime to null when isBirthTimeKnown is false', async () => {
    repository.findById.mockResolvedValue(mockProfile);

    const command: UpdateBirthProfileCommand = {
      id: 'profile-123',
      userId: 'user-123',
      isBirthTimeKnown: false,
      birthTime: null,
    };

    const result = await useCase.execute(command);
    
    expect(result.profile.isBirthTimeKnown).toBe(false);
    expect(result.profile.birthTime).toBeNull();
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('12. should pass non-Error objects straight through catch block', async () => {
    repository.findById.mockResolvedValue(mockProfile);
    
    // Using vi.spyOn to force the domain entity to throw a non-Error primitive
    vi.spyOn(mockProfile, 'update').mockImplementationOnce(() => {
      throw 'A primitive string error';
    });

    const command: UpdateBirthProfileCommand = {
      id: 'profile-123',
      userId: 'user-123',
      label: 'New Label',
    };

    await expect(useCase.execute(command)).rejects.toThrow('A primitive string error');
  });
});
