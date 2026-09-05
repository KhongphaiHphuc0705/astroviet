import { Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { bootstrapApplication } from '../../../src/composition-root.js';
import { env } from '../../../src/config/env.config.js';
import { JwtTokenAdapter } from '../../../src/modules/identity/infrastructure/adapters/jwt-token.adapter.js';
import { prisma } from '../../../src/shared/prisma/prisma-client.js';
import { PrismaTestFactory } from '../../fixtures/prisma-test.factory.js';
import { DatabaseTestHelper } from '../../helpers/database.helper.js';

describe('GET /api/v1/charts/:id', () => {
  let app: Express;
  let dbHelper: DatabaseTestHelper;
  let factory: PrismaTestFactory;
  let tokenProvider: JwtTokenAdapter;
  let validUser: { id: string; email: string };
  let otherUser: { id: string; email: string };
  let accessToken: string;
  let otherAccessToken: string;
  let chartId: string;

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

    // Create a chart for validUser
    const createRes = await request(app)
      .post('/api/v1/charts/natal?save=true')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        birthData: {
          birthDate: '1990-01-01',
          birthTime: { hour: 12, minute: 0, second: 0 },
          isBirthTimeKnown: true,
          placeName: 'Hanoi',
          latitude: 21.0285,
          longitude: 105.8542,
          timezoneId: 'Asia/Ho_Chi_Minh',
        },
        houseSystem: 'Placidus',
        includeOptionalPoints: [],
      });

    chartId = createRes.body.id;
  });

  it('should return 200 and the chart if the user is the owner', async () => {
    const response = await request(app)
      .get(`/api/v1/charts/${chartId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(chartId);
    expect(response.body.chartType).toBe('Natal');
  });

  it('should return 401 if the user is not authenticated', async () => {
    const response = await request(app).get(`/api/v1/charts/${chartId}`);

    expect(response.status).toBe(401);
  });

  it('should return 403 if the user is not the owner', async () => {
    const response = await request(app)
      .get(`/api/v1/charts/${chartId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`);

    expect(response.status).toBe(403);
  });

  it('should return 404 if the chart does not exist', async () => {
    const fakeId = '123e4567-e89b-12d3-a456-426614174000';
    const response = await request(app)
      .get(`/api/v1/charts/${fakeId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it('should return 400 if the chart ID is not a valid UUID', async () => {
    const response = await request(app)
      .get(`/api/v1/charts/not-a-uuid`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('MALFORMED_REQUEST');
  });
});
