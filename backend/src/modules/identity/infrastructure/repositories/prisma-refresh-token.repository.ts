import { PrismaClient } from '@prisma/client';

import { UniqueConstraintError, InfrastructureError } from '../../../../shared/errors/app-error.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { IRefreshTokenRepository } from '../../domain/ports/refresh-token-repository.port.js';
import { PrismaRefreshTokenMapper } from '../mappers/prisma-refresh-token.mapper.js';

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(token: RefreshToken): Promise<void> {
    try {
      await this.prisma.refreshToken.create({
        data: PrismaRefreshTokenMapper.toPersistence(token),
      });
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === 'P2002') {
        throw new UniqueConstraintError('Token hash already exists', undefined, error);
      }
      throw new InfrastructureError('Failed to create refresh token', undefined, error);
    }
  }

  async findByTokenHash(hash: string): Promise<RefreshToken | null> {
    try {
      const prismaToken = await this.prisma.refreshToken.findUnique({
        where: { token_hash: hash },
      });
      return prismaToken ? PrismaRefreshTokenMapper.toDomain(prismaToken) : null;
    } catch (error) {
      throw new InfrastructureError('Failed to find refresh token', undefined, error);
    }
  }

  async revoke(hash: string, revokedAt: Date): Promise<void> {
    try {
      await this.prisma.refreshToken.update({
        where: { token_hash: hash },
        data: { revoked_at: revokedAt },
      });
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === 'P2025') {
        // Record not found
        return; 
      }
      throw new InfrastructureError('Failed to revoke token', undefined, error);
    }
  }

  async revokeAllByUser(userId: string): Promise<void> {
    try {
      await this.prisma.refreshToken.updateMany({
        where: { 
          user_id: userId,
          revoked_at: null,
        },
        data: { revoked_at: new Date() },
      });
    } catch (error) {
      throw new InfrastructureError('Failed to revoke all tokens for user', undefined, error);
    }
  }

  async deleteExpired(before: Date): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: { expires_at: { lt: before } },
      });
      return result.count;
    } catch (error) {
      throw new InfrastructureError('Failed to delete expired tokens', undefined, error);
    }
  }
}
