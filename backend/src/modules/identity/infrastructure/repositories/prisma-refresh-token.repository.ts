import { Prisma, PrismaClient } from '@prisma/client';

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

  async rotate(oldTokenHash: string, newToken: RefreshToken): Promise<RefreshToken | null> {
    try {
      return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Step 1: Create new token first
        const newRecord = await tx.refreshToken.create({
          data: PrismaRefreshTokenMapper.toPersistence(newToken),
        });

        // Step 2: Revoke old token and point it to the new one
        const updateResult = await tx.refreshToken.updateMany({
          where: { token_hash: oldTokenHash, revoked_at: null },
          data: {
            revoked_at: new Date(),
            replaced_by_token_id: newRecord.id,
          },
        });

        // Step 3: Check race condition (if count === 0, it was already revoked or not found)
        if (updateResult.count === 0) {
          throw new Error('RACE_LOST_SIGNAL');
        }

        return PrismaRefreshTokenMapper.toDomain(newRecord);
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'RACE_LOST_SIGNAL') {
        return null;
      }
      throw new InfrastructureError('Failed to rotate refresh token', undefined, error);
    }
  }

  async revoke(hash: string, revokedAt: Date): Promise<boolean> {
    try {
      await this.prisma.refreshToken.update({
        where: { token_hash: hash },
        data: { revoked_at: revokedAt },
      });
      return true;
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === 'P2025') {
        // Record not found
        return false;
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
