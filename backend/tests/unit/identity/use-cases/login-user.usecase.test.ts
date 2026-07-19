import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';

import {
  LoginUserUseCase,
  LoginCommand,
} from '../../../../src/modules/identity/application/use-cases/login-user.usecase.js';
import { User } from '../../../../src/modules/identity/domain/entities/user.entity.js';
import { IPasswordHasher } from '../../../../src/modules/identity/domain/ports/password-hasher.port.js';
import { IRefreshTokenRepository } from '../../../../src/modules/identity/domain/ports/refresh-token-repository.port.js';
import { ITokenProvider } from '../../../../src/modules/identity/domain/ports/token-provider.port.js';
import { IUserRepository } from '../../../../src/modules/identity/domain/ports/user-repository.port.js';
import { AuthenticationError } from '../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../src/shared/errors/error-codes.js';

describe('LoginUserUseCase', () => {
  let userRepo: Mocked<IUserRepository>;
  let passwordHasher: Mocked<IPasswordHasher>;
  let tokenProvider: Mocked<ITokenProvider>;
  let refreshTokenRepo: Mocked<IRefreshTokenRepository>;
  let useCase: LoginUserUseCase;

  const mockUser: User = {
    id: 'user-id-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    displayName: 'Test User',
    role: 'user',
    emailVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    version: 1,
  };

  const command: LoginCommand = {
    email: 'test@example.com',
    password: 'password123',
    ipAddress: '127.0.0.1',
  };

  beforeEach(() => {
    userRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      existsByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    } as any;

    passwordHasher = {
      hash: vi.fn(),
      verify: vi.fn(),
    };

    tokenProvider = {
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      verifyAccessToken: vi.fn(),
      hashRefreshToken: vi.fn(),
    };

    refreshTokenRepo = {
      create: vi.fn(),
      findByTokenHash: vi.fn(),
      rotate: vi.fn(),
      revoke: vi.fn(),
      revokeAllByUser: vi.fn(),
      deleteExpired: vi.fn(),
    };

    useCase = new LoginUserUseCase(
      userRepo,
      passwordHasher,
      tokenProvider,
      refreshTokenRepo,
      900, // 15 minutes in seconds
    );
  });

  it('should successfully login and issue tokens', async () => {
    userRepo.findByEmail.mockResolvedValue(mockUser);
    passwordHasher.verify.mockResolvedValue(true);
    tokenProvider.generateAccessToken.mockResolvedValue('access-token');
    tokenProvider.generateRefreshToken.mockResolvedValue({
      rawToken: 'raw-refresh-token',
      tokenHash: 'hashed-refresh-token',
      expiresAt: new Date(Date.now() + 100000),
    });

    const result = await useCase.execute(command);

    expect(result.user).toEqual(mockUser);
    expect(result.accessToken).toBe('access-token');
    expect(result.rawRefreshToken).toBe('raw-refresh-token');
    expect(result.expiresIn).toBe(900);

    expect(tokenProvider.generateAccessToken).toHaveBeenCalledWith({
      sub: mockUser.id,
      role: mockUser.role,
    });

    expect(refreshTokenRepo.create).toHaveBeenCalledOnce();
    const createdToken = refreshTokenRepo.create.mock.calls[0][0];
    expect(createdToken).toMatchObject({
      userId: mockUser.id,
      tokenHash: 'hashed-refresh-token',
      revokedAt: null,
      replacedByTokenId: null,
      createdByIp: '127.0.0.1',
    });
    expect(createdToken.id).toBeDefined();
    expect(createdToken.issuedAt).toBeDefined();
  });

  it('should throw AuthenticationError and STILL call passwordHasher when user not found (timing attack mitigation)', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    passwordHasher.verify.mockResolvedValue(false);

    try {
      await useCase.execute(command);
      expect.fail('Should have thrown AuthenticationError');
    } catch (error) {
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error).toMatchObject({
        errorCode: ErrorCode.INVALID_CREDENTIALS,
      });
    }

    // Crucial: Must be called exactly once even if user is null
    expect(passwordHasher.verify).toHaveBeenCalledOnce();
    // It should verify against the DUMMY_HASH
    expect(passwordHasher.verify).toHaveBeenCalledWith(
      command.password,
      expect.stringContaining('$2b$12$'),
    );
    expect(tokenProvider.generateAccessToken).not.toHaveBeenCalled();
    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
  });

  it('should throw AuthenticationError when password is wrong', async () => {
    userRepo.findByEmail.mockResolvedValue(mockUser);
    passwordHasher.verify.mockResolvedValue(false); // Wrong password

    try {
      await useCase.execute(command);
      expect.fail('Should have thrown AuthenticationError');
    } catch (error) {
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error).toMatchObject({
        errorCode: ErrorCode.INVALID_CREDENTIALS,
      });
    }

    expect(passwordHasher.verify).toHaveBeenCalledWith(command.password, mockUser.passwordHash);
    expect(tokenProvider.generateAccessToken).not.toHaveBeenCalled();
    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
  });
});
