import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bootstrapApplication } from '../../../src/composition-root.js';
import { DatabaseTestHelper } from '../../helpers/database.helper.js';

describe('POST /api/v1/auth/refresh', () => {
  let app: any;
  let prisma: PrismaClient;
  let dbHelper: DatabaseTestHelper;
  let cookie: string[];

  beforeAll(async () => {
    const bootstrap = await bootstrapApplication();
    app = bootstrap.app;
    prisma = new PrismaClient();
    dbHelper = new DatabaseTestHelper(prisma);
    await dbHelper.clearDatabase();

    // Setup initial user and login to get refresh token
    await request(app).post('/api/v1/auth/register').send({
      email: 'refresh@example.com',
      password: 'StrongPassword123!',
      displayName: 'Refresh User',
    });

    const resLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'refresh@example.com',
      password: 'StrongPassword123!',
    });

    cookie = (resLogin.headers['set-cookie'] as unknown as string[]) || [];
  });

  afterAll(async () => {
    await dbHelper.clearDatabase();
    await prisma.$disconnect();
  });

  it('should successfully refresh token using cookie', async () => {
    const response = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie).send();

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    // Check new cookie
    expect(response.headers['set-cookie']).toBeDefined();
    const newCookie = response.headers['set-cookie'][0];
    expect(newCookie).toContain('refreshToken=');

    // DB verify
    const dbTokens = await prisma.refreshToken.findMany();
    // 1 from login, 1 from this refresh
    expect(dbTokens).toHaveLength(2);
    const oldToken = dbTokens.find((t) => t.revoked_at !== null);
    const newToken = dbTokens.find((t) => t.revoked_at === null);

    expect(oldToken?.replaced_by_token_id).toBe(newToken?.id);
  });

  it('should successfully refresh token using body fallback', async () => {
    // We need the raw string from the cookie to send in body
    const cookieString = cookie[0];
    const match = cookieString.match(/refreshToken=([^;]+)/);
    const rawToken = match ? match[1] : '';

    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rawToken });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it('should return 400 if no refresh token is provided', async () => {
    const response = await request(app).post('/api/v1/auth/refresh').send();

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('MALFORMED_REQUEST');
  });

  it('should return 401 if refresh token does not exist', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'non-existent-token' });

    expect(response.status).toBe(401);
    expect(response.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('should return 401 TOKEN_EXPIRED if token is expired', async () => {
    // Manually insert an expired token for our test user
    const user = await prisma.user.findUnique({ where: { email: 'refresh@example.com' } });

    // We need tokenProvider to generate hash, but we can just use a dummy hash
    // and dummy raw token if we don't have access to tokenProvider here.
    // Instead, let's just insert a record directly
    const crypto = await import('node:crypto');
    const dummyRaw = 'expired-raw-token';
    const dummyHash = crypto.createHash('sha256').update(dummyRaw).digest('hex');

    await prisma.refreshToken.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user!.id,
        token_hash: dummyHash,
        issued_at: new Date(),
        expires_at: new Date(Date.now() - 10000), // Past
        created_by_ip: '127.0.0.1',
      },
    });

    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: dummyRaw });

    expect(response.status).toBe(401);
    expect(response.body.errorCode).toBe('TOKEN_EXPIRED');
  });

  it('should return 401 if token is already revoked (replay attack)', async () => {
    // We already refreshed once in the first test, so the original cookie has a revoked token
    const response = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie).send();

    expect(response.status).toBe(401);
    expect(response.body.errorCode).toBe('UNAUTHORIZED');
  });
});
