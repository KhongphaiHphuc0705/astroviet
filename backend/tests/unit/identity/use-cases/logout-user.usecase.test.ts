import { beforeEach, describe, expect, it, vi, Mocked } from 'vitest';

import { LogoutUserUseCase } from '../../../../src/modules/identity/application/use-cases/logout-user.usecase.js';
import { IRefreshTokenRepository } from '../../../../src/modules/identity/domain/ports/refresh-token-repository.port.js';
import { ITokenProvider } from '../../../../src/modules/identity/domain/ports/token-provider.port.js';

describe('LogoutUserUseCase', () => {
  let useCase: LogoutUserUseCase;
  let mockTokenProvider: Mocked<ITokenProvider>;
  let mockRefreshTokenRepo: Mocked<IRefreshTokenRepository>;

  beforeEach(() => {
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

    useCase = new LogoutUserUseCase(mockRefreshTokenRepo, mockTokenProvider);
  });

  it('should successfully revoke token', async () => {
    mockTokenProvider.hashRefreshToken.mockReturnValue('hashed-token');
    mockRefreshTokenRepo.revoke.mockResolvedValue(true);

    await useCase.execute({
      rawRefreshToken: 'raw-token',
    });

    expect(mockTokenProvider.hashRefreshToken).toHaveBeenCalledWith('raw-token');
    expect(mockRefreshTokenRepo.revoke).toHaveBeenCalledWith('hashed-token', expect.any(Date));
  });

  it('should be idempotent and do nothing if no token provided', async () => {
    await useCase.execute({});

    expect(mockTokenProvider.hashRefreshToken).not.toHaveBeenCalled();
    expect(mockRefreshTokenRepo.revoke).not.toHaveBeenCalled();
  });

  it('should be idempotent and not throw if token does not exist in DB', async () => {
    mockTokenProvider.hashRefreshToken.mockReturnValue('hashed-token');
    mockRefreshTokenRepo.revoke.mockResolvedValue(false); // DB says token not found

    await expect(
      useCase.execute({ rawRefreshToken: 'raw-token' })
    ).resolves.not.toThrow();

    expect(mockTokenProvider.hashRefreshToken).toHaveBeenCalledWith('raw-token');
    expect(mockRefreshTokenRepo.revoke).toHaveBeenCalledWith('hashed-token', expect.any(Date));
  });
});
