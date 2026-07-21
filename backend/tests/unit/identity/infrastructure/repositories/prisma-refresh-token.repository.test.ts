import { PrismaClient } from '@prisma/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RefreshToken } from '../../../../../src/modules/identity/domain/entities/refresh-token.entity.js';
import { PrismaRefreshTokenRepository } from '../../../../../src/modules/identity/infrastructure/repositories/prisma-refresh-token.repository.js';
import {
  InfrastructureError,
  UniqueConstraintError,
} from '../../../../../src/shared/errors/app-error.js';

describe('PrismaRefreshTokenRepository', () => {
  let mockPrisma: any;
  let repository: PrismaRefreshTokenRepository;

  const mockToken: RefreshToken = {
    id: 'token-123',
    userId: 'user-123',
    tokenHash: 'hash',
    issuedAt: new Date(),
    expiresAt: new Date(),
    revokedAt: null,
    replacedByTokenId: null,
    createdByIp: '127.0.0.1',
  };

  beforeEach(() => {
    mockPrisma = {
      refreshToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    repository = new PrismaRefreshTokenRepository(mockPrisma as PrismaClient);
  });

  describe('create', () => {
    it('should throw UniqueConstraintError when Prisma throws P2002', async () => {
      const error = new Error('Prisma Error');
      (error as any).code = 'P2002';

      mockPrisma.refreshToken.create.mockRejectedValue(error);

      await expect(repository.create(mockToken)).rejects.toThrow(UniqueConstraintError);
    });

    it('should throw InfrastructureError when Prisma throws P2003 (Foreign Key Violation)', async () => {
      const error = new Error('Prisma Error');
      (error as any).code = 'P2003';
      
      mockPrisma.refreshToken.create.mockRejectedValue(error);

      await expect(repository.create(mockToken)).rejects.toThrow(InfrastructureError);
    });

    it('should throw InfrastructureError when Prisma throws generic error', async () => {
      const error = new Error('Generic DB Error');
      mockPrisma.refreshToken.create.mockRejectedValue(error);

      await expect(repository.create(mockToken)).rejects.toThrow(InfrastructureError);
    });
  });

  describe('findByTokenHash', () => {
    it('should throw InfrastructureError when Prisma throws generic error', async () => {
      const error = new Error('Generic DB Error');
      mockPrisma.refreshToken.findUnique.mockRejectedValue(error);

      await expect(repository.findByTokenHash('hash')).rejects.toThrow(InfrastructureError);
    });
  });

  describe('rotate', () => {
    it('should throw InfrastructureError when transaction throws generic error', async () => {
      const error = new Error('Generic DB Error');
      mockPrisma.$transaction.mockRejectedValue(error);

      await expect(repository.rotate('old-hash', mockToken)).rejects.toThrow(InfrastructureError);
    });
  });

  describe('revoke', () => {
    it('should return false when Prisma throws P2025 (Record not found)', async () => {
      const error = new Error('Prisma Error');
      (error as any).code = 'P2025';

      mockPrisma.refreshToken.update.mockRejectedValue(error);

      const result = await repository.revoke('hash', new Date());
      expect(result).toBe(false);
    });

    it('should throw InfrastructureError when Prisma throws generic error', async () => {
      const error = new Error('Generic DB Error');
      mockPrisma.refreshToken.update.mockRejectedValue(error);

      await expect(repository.revoke('hash', new Date())).rejects.toThrow(InfrastructureError);
    });
  });

  describe('revokeAllByUser', () => {
    it('should throw InfrastructureError when Prisma throws generic error', async () => {
      const error = new Error('Generic DB Error');
      mockPrisma.refreshToken.updateMany.mockRejectedValue(error);

      await expect(repository.revokeAllByUser('user-id')).rejects.toThrow(InfrastructureError);
    });
  });

  describe('deleteExpired', () => {
    it('should throw InfrastructureError when Prisma throws generic error', async () => {
      const error = new Error('Generic DB Error');
      mockPrisma.refreshToken.deleteMany.mockRejectedValue(error);

      await expect(repository.deleteExpired(new Date())).rejects.toThrow(InfrastructureError);
    });
  });
});
