import { Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { bootstrapApplication } from '../../../src/composition-root.js';
import { env } from '../../../src/config/env.config.js';
import { JwtTokenAdapter } from '../../../src/modules/identity/infrastructure/adapters/jwt-token.adapter.js';
import { prisma } from '../../../src/shared/prisma/prisma-client.js';
import { PrismaTestFactory } from '../../fixtures/prisma-test.factory.js';
import { DatabaseTestHelper } from '../../helpers/database.helper.js';

describe('GET /api/v1/charts', () => {
  let app: Express;
  let dbHelper: DatabaseTestHelper;
  let factory: PrismaTestFactory;
  let tokenProvider: JwtTokenAdapter;
  let validUser: { id: string; email: string };
  let otherUser: { id: string; email: string };
  let accessToken: string;
  let otherAccessToken: string;

  beforeAll(async () => {
    const appModule = await bootstrapApplication();
    app = appModule.app;
    dbHelper = new DatabaseTestHelper(prisma);
    factory = new PrismaTestFactory(prisma);
    tokenProvider = new JwtTokenAdapter({
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessExpiryMinutes: env.JWT_ACCESS_EXPIRY_MINUTES,
      refreshExpiryDays: env.JWT_REFRESH_EXPIRY_DAYS,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();

    validUser = await factory.createUser({
      email: 'test@example.com',
      passwordHash: 'dummy_hash',
      displayName: 'Test User',
      role: 'user',
    });

    otherUser = await factory.createUser({
      email: 'other@example.com',
      passwordHash: 'dummy_hash',
      displayName: 'Other User',
      role: 'user',
    });

    accessToken = tokenProvider.generateAccessToken({
      sub: validUser.id,
      role: 'user',
    });

    otherAccessToken = tokenProvider.generateAccessToken({
      sub: otherUser.id,
      role: 'user',
    });

    // Create 2 charts for validUser
    await request(app)
      .post('/api/v1/charts/natal?save=true')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        birthData: {
          birthDate: '1990-01-01',
          birthTime: { hour: 12, minute: 0, second: 0 },
          isBirthTimeKnown: true,
          placeName: 'Hanoi',
          latitude: 21.0,
          longitude: 105.0,
          timezoneId: 'Asia/Ho_Chi_Minh',
        },
        houseSystem: 'Placidus',
        includeOptionalPoints: [],
      });

    await request(app)
      .post('/api/v1/charts/natal?save=true')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        birthData: {
          birthDate: '1995-05-05',
          birthTime: { hour: 15, minute: 30, second: 0 },
          isBirthTimeKnown: true,
          placeName: 'HCMC',
          latitude: 10.0,
          longitude: 106.0,
          timezoneId: 'Asia/Ho_Chi_Minh',
        },
        houseSystem: 'WholeSign',
        includeOptionalPoints: [],
      });

    // Create 1 chart for otherUser
    await request(app)
      .post('/api/v1/charts/natal?save=true')
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .send({
        birthData: {
          birthDate: '2000-01-01',
          birthTime: { hour: 0, minute: 0, second: 0 },
          isBirthTimeKnown: true,
          placeName: 'Da Nang',
          latitude: 16.0,
          longitude: 108.0,
          timezoneId: 'Asia/Ho_Chi_Minh',
        },
        houseSystem: 'Placidus',
        includeOptionalPoints: [],
      });
  });

  it('should return a paginated list of chart summaries', async () => {
    const response = await request(app)
      .get('/api/v1/charts?page=1&pageSize=10')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(10);
    expect(response.body.items[0]).toHaveProperty('id');
    expect(response.body.items[0]).toHaveProperty('birthProfileId');
    expect(response.body.items[0]).toHaveProperty('houseSystem');
    expect(response.body.items[0]).not.toHaveProperty('planets'); // Summary DTO shouldn't have planets array directly exposed in summary (actually ChartSummary mapper might expose some basic fields, let's just test it's an array of items)
  });

  it('should only return charts owned by the requesting user (Ownership Isolation)', async () => {
    // otherUser requests their charts
    const responseOther = await request(app)
      .get('/api/v1/charts')
      .set('Authorization', `Bearer ${otherAccessToken}`);

    expect(responseOther.status).toBe(200);
    expect(responseOther.body.total).toBe(1); // Only 1 chart for otherUser

    // validUser requests their charts
    const responseValid = await request(app)
      .get('/api/v1/charts')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(responseValid.status).toBe(200);
    expect(responseValid.body.total).toBe(2); // Only 2 charts for validUser, didn't leak otherUser's chart
  });

  it('should return 401 if the user is not authenticated', async () => {
    const response = await request(app).get('/api/v1/charts');

    expect(response.status).toBe(401);
  });

  it('should return 400 Validation Error if query params are invalid', async () => {
    const response = await request(app)
      .get('/api/v1/charts?pageSize=abc')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('MALFORMED_REQUEST');
  });

  it('should return 400 Validation Error if requested pageSize > 100', async () => {
    const response = await request(app)
      .get('/api/v1/charts?pageSize=999')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('MALFORMED_REQUEST');
  });
});
