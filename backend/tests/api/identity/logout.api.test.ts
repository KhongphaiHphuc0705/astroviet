import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bootstrapApplication } from '../../../src/composition-root.js';
import { DatabaseTestHelper } from '../../helpers/database.helper.js';

describe('POST /api/v1/auth/logout', () => {
  let app: any;
  let prisma: PrismaClient;
  let dbHelper: DatabaseTestHelper;
  let accessToken: string;
  let cookie: string[];

  beforeAll(async () => {
    const bootstrap = await bootstrapApplication();
    app = bootstrap.app;
    prisma = new PrismaClient();
    dbHelper = new DatabaseTestHelper(prisma);
    await dbHelper.clearDatabase();

    await request(app).post('/api/v1/auth/register').send({
      email: 'logout@example.com',
      password: 'StrongPassword123!',
      displayName: 'Logout User',
    });

    const resLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'logout@example.com',
      password: 'StrongPassword123!',
    });

    accessToken = resLogin.body.accessToken;
    cookie = (resLogin.headers['set-cookie'] as unknown as string[]) || [];
  });

  afterAll(async () => {
    await dbHelper.clearDatabase();
    await prisma.$disconnect();
  });

  it('should return 401 if access token is missing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .send();

    expect(response.status).toBe(401);
  });

  it('should successfully logout with access token and clear cookie', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookie)
      .send();

    expect(response.status).toBe(204);
    
    // Cookie should be cleared
    expect(response.headers['set-cookie']).toBeDefined();
    const clearCookie = response.headers['set-cookie'][0];
    expect(clearCookie).toContain('refreshToken=;');
  });

  it('should be idempotent on second logout attempt', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      // No cookie this time since it was cleared
      .send();

    expect(response.status).toBe(204);
  });
});
