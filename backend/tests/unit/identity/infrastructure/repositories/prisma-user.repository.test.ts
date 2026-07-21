import { PrismaClient } from '@prisma/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { User } from '../../../../../src/modules/identity/domain/entities/user.entity.js';
import { PrismaUserRepository } from '../../../../../src/modules/identity/infrastructure/repositories/prisma-user.repository.js';
import { InfrastructureError, UniqueConstraintError, OptimisticLockError } from '../../../../../src/shared/errors/app-error.js';

describe('PrismaUserRepository', () => {
  let mockPrisma: any;
  let repository: PrismaUserRepository;

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

  beforeEach(() => {
    mockPrisma = {
      user: {
        create: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        updateMany: vi.fn(),
      }
    };
    repository = new PrismaUserRepository(mockPrisma as PrismaClient);
  });

  describe('create', () => {
    it('should throw UniqueConstraintError when Prisma throws P2002', async () => {
      const error = new Error('Prisma Error');
      (error as any).code = 'P2002';
      
      mockPrisma.user.create.mockRejectedValue(error);

      await expect(repository.create(mockUser)).rejects.toThrow(UniqueConstraintError);
    });

    it('should throw InfrastructureError when Prisma throws generic error', async () => {
      const error = new Error('Generic DB Error');
      (error as any).code = 'P5000';
      
      mockPrisma.user.create.mockRejectedValue(error);

      await expect(repository.create(mockUser)).rejects.toThrow(InfrastructureError);
    });
  });

  describe('findById', () => {
    it('should throw InfrastructureError when Prisma throws generic error', async () => {
      const error = new Error('Generic DB Error');
      mockPrisma.user.findUnique.mockRejectedValue(error);

      await expect(repository.findById('some-id')).rejects.toThrow(InfrastructureError);
    });
  });

  describe('findByEmail', () => {
    it('should throw InfrastructureError when Prisma throws generic error', async () => {
      const error = new Error('Generic DB Error');
      mockPrisma.user.findUnique.mockRejectedValue(error);

      await expect(repository.findByEmail('test@example.com')).rejects.toThrow(InfrastructureError);
    });
  });

  describe('existsByEmail', () => {
    it('should throw InfrastructureError when Prisma throws generic error', async () => {
      const error = new Error('Generic DB Error');
      mockPrisma.user.count.mockRejectedValue(error);

      await expect(repository.existsByEmail('test@example.com')).rejects.toThrow(InfrastructureError);
    });
  });

  describe('update', () => {
    it('should throw UniqueConstraintError when Prisma throws P2002', async () => {
      const error = new Error('Prisma Error');
      (error as any).code = 'P2002';
      
      mockPrisma.user.updateMany.mockRejectedValue(error);

      await expect(repository.update(mockUser)).rejects.toThrow(UniqueConstraintError);
    });

    it('should throw OptimisticLockError if count is 0', async () => {
      mockPrisma.user.updateMany.mockResolvedValue({ count: 0 });

      await expect(repository.update(mockUser)).rejects.toThrow(OptimisticLockError);
    });

    it('should throw InfrastructureError when Prisma throws generic error', async () => {
      const error = new Error('Generic DB Error');
      mockPrisma.user.updateMany.mockRejectedValue(error);

      await expect(repository.update(mockUser)).rejects.toThrow(InfrastructureError);
    });
  });
});
