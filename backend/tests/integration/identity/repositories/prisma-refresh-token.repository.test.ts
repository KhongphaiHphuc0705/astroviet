import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';

import { RefreshToken } from '../../../../src/modules/identity/domain/entities/refresh-token.entity.js';
import { PrismaRefreshTokenRepository } from '../../../../src/modules/identity/infrastructure/repositories/prisma-refresh-token.repository.js';
import { PrismaTestFactory } from '../../../fixtures/prisma-test.factory.js';
import { DatabaseTestHelper } from '../../../helpers/database.helper.js';

describe('PrismaRefreshTokenRepository Integration', () => {
  let prisma: PrismaClient;
  let dbHelper: DatabaseTestHelper;
  let factory: PrismaTestFactory;
  let repository: PrismaRefreshTokenRepository;

  beforeAll(() => {
    prisma = new PrismaClient();
    dbHelper = new DatabaseTestHelper(prisma);
    factory = new PrismaTestFactory(prisma);
    repository = new PrismaRefreshTokenRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
  });

  describe('create()', () => {
    it('should create a new refresh token', async () => {
      const user = await factory.createUser();
      const token: RefreshToken = {
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash: 'my-hash',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        replacedByTokenId: null,
        createdByIp: '127.0.0.1',
      };

      await repository.create(token);

      const savedToken = await prisma.refreshToken.findUnique({ where: { token_hash: 'my-hash' } });
      expect(savedToken).not.toBeNull();
      expect(savedToken?.user_id).toBe(user.id);
    });
  });

  describe('revoke()', () => {
    it('should set revokedAt for a specific token', async () => {
      const user = await factory.createUser();
      await factory.createRefreshToken(user.id, { tokenHash: 'revoke-me' });

      const revokeTime = new Date();
      const success = await repository.revoke('revoke-me', revokeTime);

      expect(success).toBe(true);

      const savedToken = await prisma.refreshToken.findUnique({
        where: { token_hash: 'revoke-me' },
      });
      expect(savedToken?.revoked_at).toEqual(revokeTime);
    });

    it('should return false if token does not exist', async () => {
      const success = await repository.revoke('non-existent', new Date());
      expect(success).toBe(false);
    });
  });

  describe('revokeAllByUser()', () => {
    it('should revoke all active tokens for a user', async () => {
      const user = await factory.createUser();
      await factory.createRefreshToken(user.id, { tokenHash: 't1' });
      await factory.createRefreshToken(user.id, { tokenHash: 't2' });
      await factory.createRefreshToken(user.id, { tokenHash: 't3', revokedAt: new Date(1) }); // already revoked

      await repository.revokeAllByUser(user.id);

      const tokens = await prisma.refreshToken.findMany({ where: { user_id: user.id } });
      expect(tokens.every((t) => t.revoked_at !== null)).toBe(true);
    });
  });

  describe('deleteExpired()', () => {
    it('should hard delete tokens expired before the given date', async () => {
      const user = await factory.createUser();
      const now = new Date();
      const past = new Date(now.getTime() - 10000);
      const future = new Date(now.getTime() + 10000);

      await factory.createRefreshToken(user.id, { tokenHash: 'expired1', expiresAt: past });
      await factory.createRefreshToken(user.id, { tokenHash: 'expired2', expiresAt: past });
      await factory.createRefreshToken(user.id, { tokenHash: 'active', expiresAt: future });

      const deletedCount = await repository.deleteExpired(now);

      expect(deletedCount).toBe(2);

      const remainingTokens = await prisma.refreshToken.findMany({ where: { user_id: user.id } });
      expect(remainingTokens.length).toBe(1);
      expect(remainingTokens[0].token_hash).toBe('active');
    });
  });

  describe('rotate()', () => {
    it('should successfully rotate a token and prevent race conditions', async () => {
      const user = await factory.createUser();
      const oldToken = await factory.createRefreshToken(user.id, { tokenHash: 'old-token' });

      const newToken1: RefreshToken = {
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash: 'new-token-1',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        replacedByTokenId: null,
        createdByIp: '127.0.0.1',
      };

      const newToken2: RefreshToken = {
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash: 'new-token-2',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        replacedByTokenId: null,
        createdByIp: '127.0.0.1',
      };

      // Run two rotations concurrently simulating a replay attack / race condition
      const [result1, result2] = await Promise.all([
        repository.rotate('old-token', newToken1),
        repository.rotate('old-token', newToken2),
      ]);

      // Exactly one should succeed, one should return null
      const successCount = [result1, result2].filter((r) => r !== null).length;
      expect(successCount).toBe(1);

      const failedCount = [result1, result2].filter((r) => r === null).length;
      expect(failedCount).toBe(1);

      // Verify DB state
      const dbOldToken = await prisma.refreshToken.findUnique({ where: { id: oldToken.id } });
      expect(dbOldToken?.revoked_at).not.toBeNull();
      expect(dbOldToken?.replaced_by_token_id).not.toBeNull();

      const newTokens = await prisma.refreshToken.findMany({
        where: { user_id: user.id, token_hash: { in: ['new-token-1', 'new-token-2'] } },
      });
      // The transaction that lost might have created the token before rolling back?
      // No, interactive transaction rolls back the whole thing
      expect(newTokens.length).toBe(1);
    });
  });
});
