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
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.rawRefreshToken).toBeDefined();
    
    // Check new cookie
    expect(response.headers['set-cookie']).toBeDefined();
    const newCookie = response.headers['set-cookie'][0];
    expect(newCookie).toContain('refreshToken=');
  });

  it('should return 400 if no refresh token is provided', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send();

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('MALFORMED_REQUEST');
  });
});
