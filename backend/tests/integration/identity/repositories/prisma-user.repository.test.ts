import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';

import { User } from '../../../../src/modules/identity/domain/entities/user.entity.js';
import { PrismaUserRepository } from '../../../../src/modules/identity/infrastructure/repositories/prisma-user.repository.js';
import {
  UniqueConstraintError,
  OptimisticLockError,
} from '../../../../src/shared/errors/app-error.js';
import { PrismaTestFactory } from '../../../fixtures/prisma-test.factory.js';
import { DatabaseTestHelper } from '../../../helpers/database.helper.js';

describe('PrismaUserRepository Integration', () => {
  let prisma: PrismaClient;
  let dbHelper: DatabaseTestHelper;
  let factory: PrismaTestFactory;
  let repository: PrismaUserRepository;

  beforeAll(() => {
    prisma = new PrismaClient();
    dbHelper = new DatabaseTestHelper(prisma);
    factory = new PrismaTestFactory(prisma);
    repository = new PrismaUserRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
  });

  describe('create()', () => {
    it('should create a new user successfully', async () => {
      const user: User = {
        id: crypto.randomUUID(),
        email: 'test@example.com',
        passwordHash: 'hash',
        displayName: 'Test',
        role: 'user',
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        version: 1,
      };

      await repository.create(user);

      const savedUser = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
      expect(savedUser).not.toBeNull();
      expect(savedUser?.id).toBe(user.id);
    });

    it('should throw UniqueConstraintError if email already exists', async () => {
      const existingUser = await factory.createUser({ email: 'duplicate@example.com' });

      const user: User = {
        id: crypto.randomUUID(),
        email: existingUser.email,
        passwordHash: 'hash',
        displayName: 'Test2',
        role: 'user',
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        version: 1,
      };

      await expect(repository.create(user)).rejects.toThrow(UniqueConstraintError);
    });
  });

  describe('findByEmail()', () => {
    it('should return user if email exists', async () => {
      const createdUser = await factory.createUser({ email: 'findme@example.com' });
      const user = await repository.findByEmail('findme@example.com');

      expect(user).not.toBeNull();
      expect(user?.id).toBe(createdUser.id);
    });

    it('should return null if email does not exist', async () => {
      const user = await repository.findByEmail('notfound@example.com');
      expect(user).toBeNull();
    });

    it('should return null if user is soft deleted', async () => {
      await factory.createUser({ email: 'deleted@example.com', deletedAt: new Date() });
      const user = await repository.findByEmail('deleted@example.com');
      expect(user).toBeNull();
    });
  });

  describe('existsByEmail()', () => {
    it('should return true if email exists and not deleted', async () => {
      await factory.createUser({ email: 'exists@example.com' });
      const exists = await repository.existsByEmail('exists@example.com');
      expect(exists).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      const exists = await repository.existsByEmail('notexists@example.com');
      expect(exists).toBe(false);
    });

    it('should return false if email exists but soft deleted', async () => {
      await factory.createUser({ email: 'exists-deleted@example.com', deletedAt: new Date() });
      const exists = await repository.existsByEmail('exists-deleted@example.com');
      expect(exists).toBe(false);
    });
  });

  describe('update()', () => {
    it('should update user and increment version optimistically', async () => {
      const createdUser = await factory.createUser();
      const domainUser = await repository.findById(createdUser.id);

      expect(domainUser).not.toBeNull();

      if (domainUser) {
        domainUser.displayName = 'Updated Name';

        await repository.update(domainUser);

        const savedUser = await prisma.user.findUnique({ where: { id: createdUser.id } });
        expect(savedUser?.display_name).toBe('Updated Name');
        expect(savedUser?.version).toBe(2);
      }
    });

    it('should throw OptimisticLockError on optimistic lock failure', async () => {
      const createdUser = await factory.createUser({ version: 1 });
      const domainUser = await repository.findById(createdUser.id);

      if (domainUser) {
        domainUser.displayName = 'Updated Name';
        // Simulate someone else updating the version in the meantime
        domainUser.version = 999;

        await expect(repository.update(domainUser)).rejects.toThrow(OptimisticLockError);
      }
    });
  });
});
