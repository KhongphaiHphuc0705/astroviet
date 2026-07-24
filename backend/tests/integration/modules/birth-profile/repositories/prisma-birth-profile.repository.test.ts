import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';

import { PrismaBirthProfileMapper } from '../../../../../src/modules/birth-profile/infrastructure/mappers/prisma-birth-profile.mapper.js';
import { PrismaBirthProfileRepository } from '../../../../../src/modules/birth-profile/infrastructure/repositories/prisma-birth-profile.repository.js';
import {
  InfrastructureError,
  OptimisticLockError,
} from '../../../../../src/shared/errors/app-error.js';
import { PrismaTestFactory } from '../../../../fixtures/prisma-test.factory.js';
import { DatabaseTestHelper } from '../../../../helpers/database.helper.js';

describe('PrismaBirthProfileRepository Integration', () => {
  let prisma: PrismaClient;
  let dbHelper: DatabaseTestHelper;
  let factory: PrismaTestFactory;
  let repository: PrismaBirthProfileRepository;

  beforeAll(() => {
    prisma = new PrismaClient();
    dbHelper = new DatabaseTestHelper(prisma);
    factory = new PrismaTestFactory(prisma);
    repository = new PrismaBirthProfileRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
  });

  describe('create()', () => {
    it('should create a new birth profile successfully', async () => {
      const user = await factory.createUser();

      const profileData = {
        id: crypto.randomUUID(),
        user_id: user.id,
        label: 'My Profile',
        full_name: 'John Doe',
        birth_date: new Date('1990-01-01T00:00:00Z'),
        birth_time: new Date('1970-01-01T14:30:00Z'),
        is_birth_time_known: true,
        place_name: 'Ho Chi Minh',
        latitude: 10.8231,
        longitude: 106.6297,
        historical_timezone_id: 'Asia/Ho_Chi_Minh',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        version: 1,
      };

      // Convert to domain entity first to test the repository's create method
      const domainProfile = PrismaBirthProfileMapper.toDomain(profileData as any);

      await repository.create(domainProfile);

      const savedProfile = await prisma.birthProfile.findUnique({
        where: { id: domainProfile.id },
      });
      expect(savedProfile).not.toBeNull();
      expect(savedProfile?.id).toBe(domainProfile.id);
      expect(savedProfile?.user_id).toBe(user.id);
    });

    it('should throw InfrastructureError if user does not exist (FK violation)', async () => {
      const profileData = {
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(), // non-existent user
        label: 'My Profile',
        full_name: 'John Doe',
        birth_date: new Date('1990-01-01T00:00:00Z'),
        birth_time: new Date('1970-01-01T14:30:00Z'),
        is_birth_time_known: true,
        place_name: 'Ho Chi Minh',
        latitude: 10.8231,
        longitude: 106.6297,
        historical_timezone_id: 'Asia/Ho_Chi_Minh',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        version: 1,
      };

      const domainProfile = PrismaBirthProfileMapper.toDomain(profileData as any);

      await expect(repository.create(domainProfile)).rejects.toThrow(InfrastructureError);
    });
  });

  describe('findById()', () => {
    it('should return profile if id exists and not deleted', async () => {
      const user = await factory.createUser();
      const profile = await factory.createBirthProfile(user.id);

      const found = await repository.findById(profile.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(profile.id);
    });

    it('should return null if id does not exist', async () => {
      const found = await repository.findById(crypto.randomUUID());
      expect(found).toBeNull();
    });

    it('should return null if profile is soft deleted', async () => {
      const user = await factory.createUser();
      const profile = await factory.createBirthProfile(user.id, { deleted_at: new Date() });

      const found = await repository.findById(profile.id);
      expect(found).toBeNull();
    });
  });

  describe('listByUserId()', () => {
    it('should return paginated profiles for specific user', async () => {
      const user1 = await factory.createUser();
      const user2 = await factory.createUser();

      // create 3 profiles for user1
      await factory.createBirthProfile(user1.id, {
        label: 'A',
        created_at: new Date('2024-01-01'),
      });
      await factory.createBirthProfile(user1.id, {
        label: 'B',
        created_at: new Date('2024-01-02'),
      });
      await factory.createBirthProfile(user1.id, {
        label: 'C',
        created_at: new Date('2024-01-03'),
      });

      // create 1 for user2
      await factory.createBirthProfile(user2.id, { label: 'D' });

      const result = await repository.listByUserId(user1.id, {
        page: 1,
        pageSize: 2,
        sortBy: 'createdAt',
        order: 'desc',
      });

      expect(result.total).toBe(3);
      expect(result.items.length).toBe(2);
      // descending order by created_at: C then B
      expect(result.items[0]!.label).toBe('C');
      expect(result.items[1]!.label).toBe('B');
    });

    it('should exclude soft deleted profiles', async () => {
      const user = await factory.createUser();
      await factory.createBirthProfile(user.id, { label: 'A' });
      await factory.createBirthProfile(user.id, { label: 'B', deleted_at: new Date() });

      const result = await repository.listByUserId(user.id, {
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        order: 'desc',
      });

      expect(result.total).toBe(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0]!.label).toBe('A');
    });
  });

  describe('update()', () => {
    it('should update profile and increment version', async () => {
      const user = await factory.createUser();
      const createdProfile = await factory.createBirthProfile(user.id);

      const domainProfile = await repository.findById(createdProfile.id);
      expect(domainProfile).not.toBeNull();

      if (domainProfile) {
        domainProfile.update({
          label: 'Updated Label',
        });

        await repository.update(domainProfile);

        const saved = await prisma.birthProfile.findUnique({ where: { id: createdProfile.id } });
        expect(saved?.label).toBe('Updated Label');
        expect(saved?.version).toBe(2);
      }
    });

    it('should throw OptimisticLockError if version conflicts', async () => {
      const user = await factory.createUser();
      const createdProfile = await factory.createBirthProfile(user.id, { version: 1 });

      const domainProfile = await repository.findById(createdProfile.id);
      expect(domainProfile).not.toBeNull();

      if (domainProfile) {
        domainProfile.update({ label: 'Updated Label' });

        // Simulate concurrent update
        await prisma.birthProfile.update({
          where: { id: createdProfile.id },
          data: { version: 2 },
        });

        await expect(repository.update(domainProfile)).rejects.toThrow(OptimisticLockError);
      }
    });

    it('should successfully update a soft-deleted profile (as per OQ-F, Repository does not impose business rules)', async () => {
      const user = await factory.createUser();
      const createdProfile = await factory.createBirthProfile(user.id, { version: 1 });

      const domainProfile = await repository.findById(createdProfile.id);
      expect(domainProfile).not.toBeNull();

      if (domainProfile) {
        domainProfile.update({ label: 'Updated Label' });

        // Simulate soft delete in DB before update
        await prisma.birthProfile.update({
          where: { id: createdProfile.id },
          data: { deleted_at: new Date() },
        });

        // Update should succeed despite being soft-deleted
        await repository.update(domainProfile);

        const saved = await prisma.birthProfile.findUnique({ where: { id: createdProfile.id } });
        expect(saved?.label).toBe('Updated Label');
        expect(saved?.version).toBe(2);
      }
    });
  });

  describe('softDelete()', () => {
    it('should mark profile as deleted if user is owner', async () => {
      const user = await factory.createUser();
      const profile = await factory.createBirthProfile(user.id);

      const success = await repository.softDelete(profile.id, user.id);
      expect(success).toBe(true);

      const found = await repository.findById(profile.id);
      expect(found).toBeNull(); // findById excludes deleted

      const raw = await prisma.birthProfile.findUnique({ where: { id: profile.id } });
      expect(raw?.deleted_at).not.toBeNull();
    });

    it('should return false and not delete if user is not owner', async () => {
      const user1 = await factory.createUser();
      const user2 = await factory.createUser();
      const profile = await factory.createBirthProfile(user1.id);

      const success = await repository.softDelete(profile.id, user2.id); // wrong owner
      expect(success).toBe(false);

      const raw = await prisma.birthProfile.findUnique({ where: { id: profile.id } });
      expect(raw?.deleted_at).toBeNull();
    });
  });
});
