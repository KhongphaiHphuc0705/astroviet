import { beforeEach, describe, expect, it, vi, Mocked } from 'vitest';

import { RefreshTokenUseCase } from '../../../../src/modules/identity/application/use-cases/refresh-token.usecase.js';
import { User } from '../../../../src/modules/identity/domain/entities/user.entity.js';
import { IRefreshTokenRepository } from '../../../../src/modules/identity/domain/ports/refresh-token-repository.port.js';
import { ITokenProvider } from '../../../../src/modules/identity/domain/ports/token-provider.port.js';
import { IUserRepository } from '../../../../src/modules/identity/domain/ports/user-repository.port.js';
import { ErrorCode } from '../../../../src/shared/errors/error-codes.js';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockUserRepo: Mocked<IUserRepository>;
  let mockTokenProvider: Mocked<ITokenProvider>;
  let mockRefreshTokenRepo: Mocked<IRefreshTokenRepository>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    displayName: 'Test User',
    role: 'user',
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    version: 1,
  };

  const mockTokenEntity = {
    id: 'token-1',
    userId: 'user-1',
    tokenHash: 'hashed-token',
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 100000),
    revokedAt: null,
    replacedByTokenId: null,
    createdByIp: '127.0.0.1',
  };

  beforeEach(() => {
    mockUserRepo = {
      create: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
    } as unknown as Mocked<IUserRepository>;

    mockTokenProvider = {
      generateAccessToken: vi.fn(),
      hashRefreshToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      verifyAccessToken: vi.fn(),
    } as unknown as Mocked<ITokenProvider>;

    mockRefreshTokenRepo = {
      create: vi.fn(),
      findByTokenHash: vi.fn(),
      rotate: vi.fn(),
      revoke: vi.fn(),
      revokeAllByUser: vi.fn(),
      deleteExpired: vi.fn(),
    } as unknown as Mocked<IRefreshTokenRepository>;

    useCase = new RefreshTokenUseCase(
      mockUserRepo,
      mockTokenProvider,
      mockRefreshTokenRepo,
      900,
    );
  });

  it('should successfully refresh a token', async () => {
    mockTokenProvider.hashRefreshToken.mockReturnValue('hashed-token');
    mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(mockTokenEntity);
    mockUserRepo.findById.mockResolvedValue(mockUser);
    
    const newExpiresAt = new Date(Date.now() + 100000);
    mockTokenProvider.generateRefreshToken.mockReturnValue({
      rawToken: 'new-raw-token',
      tokenHash: 'new-hashed-token',
      expiresAt: newExpiresAt,
    });
    
    mockRefreshTokenRepo.rotate.mockResolvedValue({
      id: 'new-token-1',
      userId: 'user-1',
      tokenHash: 'new-hashed-token',
      issuedAt: new Date(),
      expiresAt: newExpiresAt,
      revokedAt: null,
      replacedByTokenId: null,
      createdByIp: '127.0.0.1',
    });
    
    mockTokenProvider.generateAccessToken.mockResolvedValue('new-access-token');

    const result = await useCase.execute({
      rawRefreshToken: 'raw-token',
      ipAddress: '127.0.0.1',
    });

    expect(result.user).toEqual(mockUser);
    expect(result.accessToken).toBe('new-access-token');
    expect(result.rawRefreshToken).toBe('new-raw-token');
    expect(result.expiresIn).toBe(900);
    
    expect(mockRefreshTokenRepo.rotate).toHaveBeenCalledWith('hashed-token', expect.any(Object));
  });

  it('should throw UNAUTHORIZED if token does not exist', async () => {
    mockTokenProvider.hashRefreshToken.mockReturnValue('hashed-token');
    mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(null);

    await expect(
      useCase.execute({ rawRefreshToken: 'raw-token' })
    ).rejects.toMatchObject({
      errorCode: ErrorCode.UNAUTHORIZED,
    });
  });

  it('should throw UNAUTHORIZED if token is revoked', async () => {
    mockTokenProvider.hashRefreshToken.mockReturnValue('hashed-token');
    mockRefreshTokenRepo.findByTokenHash.mockResolvedValue({
      ...mockTokenEntity,
      revokedAt: new Date(),
    });

    await expect(
      useCase.execute({ rawRefreshToken: 'raw-token' })
    ).rejects.toMatchObject({
      errorCode: ErrorCode.UNAUTHORIZED,
    });
  });

  it('should throw TOKEN_EXPIRED if token is expired', async () => {
    mockTokenProvider.hashRefreshToken.mockReturnValue('hashed-token');
    mockRefreshTokenRepo.findByTokenHash.mockResolvedValue({
      ...mockTokenEntity,
      expiresAt: new Date(Date.now() - 10000), // Past
    });

    await expect(
      useCase.execute({ rawRefreshToken: 'raw-token' })
    ).rejects.toMatchObject({
      errorCode: ErrorCode.TOKEN_EXPIRED,
    });
  });

  it('should throw UNAUTHORIZED if race condition detected during rotate', async () => {
    mockTokenProvider.hashRefreshToken.mockReturnValue('hashed-token');
    mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(mockTokenEntity);
    mockUserRepo.findById.mockResolvedValue(mockUser);
    
    mockTokenProvider.generateRefreshToken.mockReturnValue({
      rawToken: 'new-raw-token',
      tokenHash: 'new-hashed-token',
      expiresAt: new Date(Date.now() + 100000),
    });
    
    mockRefreshTokenRepo.rotate.mockResolvedValue(null); // Simulated race loss

    await expect(
      useCase.execute({ rawRefreshToken: 'raw-token' })
    ).rejects.toMatchObject({
      errorCode: ErrorCode.UNAUTHORIZED,
    });
  });
});
