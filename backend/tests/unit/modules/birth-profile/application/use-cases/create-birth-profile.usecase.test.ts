import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';

import {
  CreateBirthProfileUseCase,
  CreateBirthProfileCommand,
} from '../../../../../../src/modules/birth-profile/application/use-cases/create-birth-profile.usecase.js';
import { IBirthProfileRepository } from '../../../../../../src/modules/birth-profile/domain/ports/birth-profile-repository.port.js';
import { DomainError, InfrastructureError } from '../../../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../../../src/shared/errors/error-codes.js';

describe('CreateBirthProfileUseCase', () => {
  let repository: Mocked<IBirthProfileRepository>;
  let useCase: CreateBirthProfileUseCase;
  let validCommand: CreateBirthProfileCommand;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      listByUserId: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    useCase = new CreateBirthProfileUseCase(repository);

    validCommand = {
      userId: 'user-123',
      label: 'My Profile',
      fullName: 'John Doe',
      birthDate: '1990-01-01',
      birthTime: '12:00:00',
      isBirthTimeKnown: true,
      birthLocation: {
        placeName: 'Ho Chi Minh',
        latitude: 10.8231,
        longitude: 106.6297,
        historicalTimezoneId: 'Asia/Ho_Chi_Minh',
      },
    };
  });

  it('1. should create birth profile successfully', async () => {
    repository.create.mockResolvedValue(undefined);

    const result = await useCase.execute(validCommand);

    expect(result.warnings).toEqual([]);
    expect(result.profile.userId).toBe(validCommand.userId);
    expect(result.profile.label).toBe(validCommand.label);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(result.profile);
  });

  it('2. should not catch InfrastructureError from repository', async () => {
    const error = new InfrastructureError('DB error');
    repository.create.mockRejectedValue(error);

    await expect(useCase.execute(validCommand)).rejects.toThrow(InfrastructureError);
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  describe('3. should map DomainErrors correctly', () => {
    it('3.1 should throw INVALID_BIRTH_DATE', async () => {
      const command = { ...validCommand, birthDate: 'invalid-date' };
      await expect(useCase.execute(command)).rejects.toThrow(DomainError);
      await expect(useCase.execute(command)).rejects.toHaveProperty(
        'errorCode',
        ErrorCode.INVALID_BIRTH_DATE,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('3.2 should throw INVALID_BIRTH_TIME', async () => {
      const command = { ...validCommand, birthTime: 'invalid-time' };
      await expect(useCase.execute(command)).rejects.toThrow(DomainError);
      await expect(useCase.execute(command)).rejects.toHaveProperty(
        'errorCode',
        ErrorCode.INVALID_BIRTH_TIME,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('3.3 should throw INVALID_LATITUDE_RANGE', async () => {
      const command = {
        ...validCommand,
        birthLocation: { ...validCommand.birthLocation, latitude: 100 },
      };
      await expect(useCase.execute(command)).rejects.toThrow(DomainError);
      await expect(useCase.execute(command)).rejects.toHaveProperty(
        'errorCode',
        ErrorCode.INVALID_LATITUDE_RANGE,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('3.4 should throw INVALID_LONGITUDE_RANGE', async () => {
      const command = {
        ...validCommand,
        birthLocation: { ...validCommand.birthLocation, longitude: 200 },
      };
      await expect(useCase.execute(command)).rejects.toThrow(DomainError);
      await expect(useCase.execute(command)).rejects.toHaveProperty(
        'errorCode',
        ErrorCode.INVALID_LONGITUDE_RANGE,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('3.5 should throw INVALID_TIMEZONE', async () => {
      const command = {
        ...validCommand,
        birthLocation: { ...validCommand.birthLocation, historicalTimezoneId: 'Invalid/Zone' },
      };
      await expect(useCase.execute(command)).rejects.toThrow(DomainError);
      await expect(useCase.execute(command)).rejects.toHaveProperty(
        'errorCode',
        ErrorCode.INVALID_TIMEZONE,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('3.6 should throw INVALID_BIRTH_LOCATION', async () => {
      const command = {
        ...validCommand,
        birthLocation: { ...validCommand.birthLocation, placeName: '   ' },
      };
      await expect(useCase.execute(command)).rejects.toThrow(DomainError);
      await expect(useCase.execute(command)).rejects.toHaveProperty(
        'errorCode',
        ErrorCode.INVALID_BIRTH_LOCATION,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('3.7 should throw INVALID_BIRTH_TIME_STATE', async () => {
      // isBirthTimeKnown is false but birthTime is provided -> Entity validation should fail?
      // Wait, in CreateBirthProfileUseCase we do:
      // const birthTime = command.isBirthTimeKnown && command.birthTime ? BirthTime.create(...) : null;
      // Wait, if isBirthTimeKnown is false, birthTime will be null, which is valid.
      // But if isBirthTimeKnown is true and birthTime is missing, the Entity will throw INVALID_BIRTH_TIME_STATE.
      // So we test that.
      const command = { ...validCommand, isBirthTimeKnown: true, birthTime: null };
      await expect(useCase.execute(command)).rejects.toThrow(DomainError);
      await expect(useCase.execute(command)).rejects.toHaveProperty(
        'errorCode',
        ErrorCode.INVALID_BIRTH_TIME_STATE,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('3.8 should throw VALIDATION_ERROR for empty label', async () => {
      const command = { ...validCommand, label: '' };
      await expect(useCase.execute(command)).rejects.toThrow(DomainError);
      await expect(useCase.execute(command)).rejects.toHaveProperty(
        'errorCode',
        ErrorCode.VALIDATION_ERROR,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  it('4. should not map unexpected errors', async () => {
    // We can simulate this by mocking crypto.randomUUID to throw
    vi.stubGlobal('crypto', {
      randomUUID: () => {
        throw new Error('Unexpected');
      },
    });

    await expect(useCase.execute(validCommand)).rejects.toThrow('Unexpected');
    expect(repository.create).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
