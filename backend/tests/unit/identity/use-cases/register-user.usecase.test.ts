import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';

import { RegisterUserUseCase } from '../../../../src/modules/identity/application/use-cases/register-user.usecase.js';
import { IEmailVerificationService } from '../../../../src/modules/identity/domain/ports/email-verification.port.js';
import { IPasswordHasher } from '../../../../src/modules/identity/domain/ports/password-hasher.port.js';
import { IUserRepository } from '../../../../src/modules/identity/domain/ports/user-repository.port.js';
import { ConflictError, UniqueConstraintError } from '../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../src/shared/errors/error-codes.js';
import { ILogger } from '../../../../src/shared/logger/logger.interface.js';

describe('RegisterUserUseCase', () => {
  let userRepo: Mocked<IUserRepository>;
  let passwordHasher: Mocked<IPasswordHasher>;
  let emailVerificationService: Mocked<IEmailVerificationService>;
  let logger: Mocked<ILogger>;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      existsByEmail: vi.fn(),
      update: vi.fn(),
    } as any;

    passwordHasher = {
      hash: vi.fn(),
      verify: vi.fn(),
    };

    emailVerificationService = {
      sendVerification: vi.fn(),
    };

    logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    useCase = new RegisterUserUseCase(userRepo, passwordHasher, emailVerificationService, logger);
  });

  it('should successfully register a new user', async () => {
    userRepo.existsByEmail.mockResolvedValue(false);
    passwordHasher.hash.mockResolvedValue('hashedPassword');
    emailVerificationService.sendVerification.mockResolvedValue(undefined);

    const command = {
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    };

    const result = await useCase.execute(command);

    expect(userRepo.existsByEmail).toHaveBeenCalledWith('test@example.com');
    expect(passwordHasher.hash).toHaveBeenCalledWith('password123');
    expect(userRepo.create).toHaveBeenCalledOnce();

    const createdUser = userRepo.create.mock.calls[0][0];
    expect(createdUser.email).toBe('test@example.com');
    expect(createdUser.passwordHash).toBe('hashedPassword');
    expect(createdUser.displayName).toBe('Test User');
    expect(createdUser.role).toBe('user');
    expect(createdUser.emailVerifiedAt).toBeNull();

    expect(emailVerificationService.sendVerification).toHaveBeenCalledWith(createdUser);
    expect(result.user).toEqual(createdUser);
  });

  it('should throw ConflictError if email already exists (pre-check)', async () => {
    userRepo.existsByEmail.mockResolvedValue(true);

    const command = {
      email: 'duplicate@example.com',
      password: 'password123',
    };

    try {
      await useCase.execute(command);
      expect.fail('Should have thrown ConflictError');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictError);
      expect(error).toMatchObject({
        errorCode: ErrorCode.EMAIL_ALREADY_EXISTS,
      });
    }

    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictError if UniqueConstraintError is thrown during create', async () => {
    userRepo.existsByEmail.mockResolvedValue(false);
    passwordHasher.hash.mockResolvedValue('hashedPassword');
    userRepo.create.mockRejectedValue(new UniqueConstraintError('Email already exists'));

    const command = {
      email: 'race@example.com',
      password: 'password123',
    };

    try {
      await useCase.execute(command);
      expect.fail('Should have thrown ConflictError');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictError);
      expect(error).toMatchObject({
        errorCode: ErrorCode.EMAIL_ALREADY_EXISTS,
      });
    }
  });

  it('should continue and log warning if email verification fails', async () => {
    userRepo.existsByEmail.mockResolvedValue(false);
    passwordHasher.hash.mockResolvedValue('hashedPassword');
    userRepo.create.mockResolvedValue(undefined);

    const emailError = new Error('SMTP Error');
    emailVerificationService.sendVerification.mockRejectedValue(emailError);

    const command = {
      email: 'test@example.com',
      password: 'password123',
    };

    const result = await useCase.execute(command);

    expect(result.user.email).toBe('test@example.com');
    expect(logger.warn).toHaveBeenCalledWith(
      'Failed to send email verification placeholder',
      expect.objectContaining({
        userId: result.user.id,
        error: 'SMTP Error',
      }),
    );
  });
});
