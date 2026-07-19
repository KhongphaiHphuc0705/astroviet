import { Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { bootstrapApplication } from '../../../src/composition-root.js';
import { IPasswordHasher } from '../../../src/modules/identity/domain/ports/password-hasher.port.js';
import { BcryptPasswordHasherAdapter } from '../../../src/modules/identity/infrastructure/adapters/bcrypt-password-hasher.adapter.js';
import { prisma } from '../../../src/shared/prisma/prisma-client.js';
import { PrismaTestFactory } from '../../fixtures/prisma-test.factory.js';
import { DatabaseTestHelper } from '../../helpers/database.helper.js';

describe('POST /api/v1/auth/login', () => {
  let app: Express;
  let dbHelper: DatabaseTestHelper;
  let factory: PrismaTestFactory;
  let passwordHasher: IPasswordHasher;
  const validEmail = 'valid@example.com';
  const validPassword = 'password123';

  beforeAll(async () => {
    const appModule = await bootstrapApplication();
    app = appModule.app;
    dbHelper = new DatabaseTestHelper(prisma);
    factory = new PrismaTestFactory(prisma);
    passwordHasher = new BcryptPasswordHasherAdapter();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
    const passwordHash = await passwordHasher.hash(validPassword);
    await factory.createUser({
      email: validEmail,
      passwordHash: passwordHash,
      displayName: 'Valid User',
      role: 'user',
    });
  });

  it('should successfully login and return tokens', async () => {
    const payload = {
      email: validEmail,
      password: validPassword,
    };

    const response = await request(app).post('/api/v1/auth/login').send(payload);

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.expiresIn).toBe(900); // 15 mins
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe(validEmail);
    expect(response.body.user.passwordHash).toBeUndefined(); // Should omit passwordHash

    // Check cookie
    const setCookieHeader = response.headers['set-cookie'];
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : (setCookieHeader ? [setCookieHeader] : []);
    const refreshTokenCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
    expect(refreshTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toContain('HttpOnly');
    expect(refreshTokenCookie).toContain('SameSite=Strict');

    // Verify DB has refresh token
    const dbTokens = await prisma.refreshToken.findMany();
    expect(dbTokens).toHaveLength(1);
    const dbToken = dbTokens[0];

    // DB shouldn't store raw token
    expect(dbToken.token_hash).toBeDefined();
    expect(dbToken.token_hash).not.toBe(response.body.refreshToken);
  });

  it('should return 400 Validation Error if email is missing', async () => {
    const payload = {
      password: validPassword,
    };

    const response = await request(app).post('/api/v1/auth/login').send(payload);

    expect(response.status).toBe(400);
    expect(response.body.title).toBe('Validation Error');
  });

  it('should return 401 INVALID_CREDENTIALS for wrong password', async () => {
    const payload = {
      email: validEmail,
      password: 'wrongpassword',
    };

    const response = await request(app).post('/api/v1/auth/login').send(payload);

    expect(response.status).toBe(401);
    expect(response.body.errorCode).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 INVALID_CREDENTIALS for non-existent user and be identical to wrong password', async () => {
    // 1. Wrong password response
    const wrongPasswordRes = await request(app).post('/api/v1/auth/login').send({
      email: validEmail,
      password: 'wrongpassword',
    });

    // 2. Non-existent user response
    const nonExistentRes = await request(app).post('/api/v1/auth/login').send({
      email: 'notfound@example.com',
      password: 'somepassword',
    });

    expect(nonExistentRes.status).toBe(401);
    expect(nonExistentRes.body.errorCode).toBe('INVALID_CREDENTIALS');

    // Both bodies should be essentially the same to prevent enumeration
    // We compare everything except timestamp and requestId which are dynamic
    const normalizeBody = (body: any) => {
      const rest = { ...body };
      delete rest.timestamp;
      delete rest.requestId;
      return rest;
    };

    expect(normalizeBody(nonExistentRes.body)).toEqual(normalizeBody(wrongPasswordRes.body));
  });

  it('should allow multiple logins for the same user without deleting old refresh tokens', async () => {
    const payload = {
      email: validEmail,
      password: validPassword,
    };

    // First login
    await request(app).post('/api/v1/auth/login').send(payload);
    // Second login
    await request(app).post('/api/v1/auth/login').send(payload);
    // Third login
    await request(app).post('/api/v1/auth/login').send(payload);

    const dbTokens = await prisma.refreshToken.findMany();
    // It should have created 3 distinct tokens (no rotation/overwriting)
    expect(dbTokens).toHaveLength(3);
  });
});
