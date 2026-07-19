import crypto from 'node:crypto';

import { AuthenticationError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { User } from '../../domain/entities/user.entity.js';
import { IRefreshTokenRepository } from '../../domain/ports/refresh-token-repository.port.js';
import { ITokenProvider } from '../../domain/ports/token-provider.port.js';
import { IUserRepository } from '../../domain/ports/user-repository.port.js';

export interface RefreshCommand {
  rawRefreshToken: string;
  ipAddress?: string;
}

export interface RefreshUserOutput {
  user: User;
  accessToken: string;
  rawRefreshToken: string;
  expiresIn: number;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenProvider: ITokenProvider,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly accessTokenTtlSeconds: number,
  ) {}

  async execute(command: RefreshCommand): Promise<RefreshUserOutput> {
    const { rawRefreshToken } = command;

    const tokenHash = this.tokenProvider.hashRefreshToken(rawRefreshToken);
    const oldTokenEntity = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!oldTokenEntity) {
      throw new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Invalid refresh token');
    }

    if (oldTokenEntity.revokedAt !== null) {
      throw new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Refresh token has been revoked');
    }

    if (oldTokenEntity.expiresAt < new Date()) {
      throw new AuthenticationError(ErrorCode.TOKEN_EXPIRED, 'Refresh token has expired');
    }

    const user = await this.userRepo.findById(oldTokenEntity.userId);
    if (!user) {
      throw new AuthenticationError(ErrorCode.UNAUTHORIZED, 'User no longer exists');
    }

    const refreshTokenData = this.tokenProvider.generateRefreshToken();
    const newTokenEntity: RefreshToken = {
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash: refreshTokenData.tokenHash,
      issuedAt: new Date(),
      expiresAt: refreshTokenData.expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
      createdByIp: command.ipAddress ?? null,
    };

    const rotatedToken = await this.refreshTokenRepo.rotate(tokenHash, newTokenEntity);
    if (!rotatedToken) {
      throw new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Race condition detected or token already revoked');
    }

    const accessToken = this.tokenProvider.generateAccessToken({
      sub: user.id,
      role: user.role, // Always fresh from DB
    });

    return {
      user,
      accessToken,
      rawRefreshToken: refreshTokenData.rawToken,
      expiresIn: this.accessTokenTtlSeconds,
    };
  }
}
