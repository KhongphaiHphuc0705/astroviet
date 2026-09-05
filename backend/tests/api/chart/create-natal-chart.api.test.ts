import { Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { bootstrapApplication } from '../../../src/composition-root.js';
import { env } from '../../../src/config/env.config.js';
import { JwtTokenAdapter } from '../../../src/modules/identity/infrastructure/adapters/jwt-token.adapter.js';
import { prisma } from '../../../src/shared/prisma/prisma-client.js';
import { PrismaTestFactory } from '../../fixtures/prisma-test.factory.js';
import { DatabaseTestHelper } from '../../helpers/database.helper.js';

describe('POST /api/v1/charts/natal', () => {
  let app: Express;
  let dbHelper: DatabaseTestHelper;
  let factory: PrismaTestFactory;
  let tokenProvider: JwtTokenAdapter;
  let validUser: { id: string; email: string };
  let accessToken: string;
  let validBirthProfileId: string;

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

    accessToken = tokenProvider.generateAccessToken({
      sub: validUser.id,
      role: 'user',
    });

    const createRes = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        label: 'My Profile',
        birthDate: '1990-01-01',
        birthTime: '14:30:00',
        isBirthTimeKnown: true,
        birthLocation: {
          placeName: 'Hanoi',
          latitude: 21.0285,
          longitude: 105.8542,
          historicalTimezoneId: 'Asia/Ho_Chi_Minh',
        },
      });

    validBirthProfileId = createRes.body.id;
  });

  it('should create and save a chart successfully (User)', async () => {
    const payload = {
      birthProfileId: validBirthProfileId,
      houseSystem: 'Placidus',
      includeOptionalPoints: [],
    };

    const response = await request(app)
      .post('/api/v1/charts/natal?save=true')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.chartType).toBe('Natal');
    expect(response.body.planets.length).toBeGreaterThan(0);
    expect(response.body.houses.length).toBeGreaterThan(0);
    expect(response.body.angles.length).toBeGreaterThan(0);
  });

  it('should create a chart without saving successfully (Guest)', async () => {
    const payload = {
      birthData: {
        birthDate: '1990-01-01',
        birthTime: { hour: 14, minute: 30, second: 0 },
        isBirthTimeKnown: true,
        placeName: 'Hanoi',
        latitude: 21.0285,
        longitude: 105.8542,
        timezoneId: 'Asia/Ho_Chi_Minh',
      },
      houseSystem: 'Placidus',
      includeOptionalPoints: [],
    };

    const response = await request(app).post('/api/v1/charts/natal?save=false').send(payload);

    expect(response.status).toBe(200); // Guest OK if save=false
    expect(response.body.id).toBeDefined(); // Transient UUID
    expect(response.body.planets.length).toBeGreaterThan(0);
  });

  it('should return 401 if Guest attempts to save', async () => {
    const payload = {
      birthData: {
        birthDate: '1990-01-01',
        birthTime: { hour: 14, minute: 30, second: 0 },
        isBirthTimeKnown: true,
        placeName: 'Hanoi',
        latitude: 21.0285,
        longitude: 105.8542,
        timezoneId: 'Asia/Ho_Chi_Minh',
      },
      houseSystem: 'Placidus',
      includeOptionalPoints: [],
    };

    // Guest attempting to explicitly save should get 401
    const response = await request(app).post('/api/v1/charts/natal?save=true').send(payload);

    expect(response.status).toBe(401); // Unauthorized
  });

  it('should default save=false and return 200 when Guest omits save query param', async () => {
    const payload = {
      birthData: {
        birthDate: '1990-01-01',
        birthTime: { hour: 14, minute: 30, second: 0 },
        isBirthTimeKnown: true,
        placeName: 'Hanoi',
        latitude: 21.0285,
        longitude: 105.8542,
        timezoneId: 'Asia/Ho_Chi_Minh',
      },
      houseSystem: 'Placidus',
      includeOptionalPoints: [],
    };

    const response = await request(app).post('/api/v1/charts/natal').send(payload);

    expect(response.status).toBe(200);
    expect(response.body.id).toBeDefined();
  });

  it('should return 422 if both birthProfileId and birthData are missing', async () => {
    const payload = {
      houseSystem: 'Placidus',
      includeOptionalPoints: [],
    };

    const response = await request(app)
      .post('/api/v1/charts/natal')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(response.status).toBe(422); // From Application Layer Check
    expect(response.body.errorCode).toBe('EXACTLY_ONE_SOURCE_REQUIRED');
  });

  it('should return 422 if both birthProfileId and birthData are provided', async () => {
    const payload = {
      birthProfileId: validBirthProfileId,
      birthData: {
        birthDate: '1990-01-01',
        birthTime: { hour: 14, minute: 30, second: 0 },
        isBirthTimeKnown: true,
        placeName: 'Hanoi',
        latitude: 21.0285,
        longitude: 105.8542,
        timezoneId: 'Asia/Ho_Chi_Minh',
      },
      houseSystem: 'Placidus',
      includeOptionalPoints: [],
    };

    const response = await request(app)
      .post('/api/v1/charts/natal')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body.errorCode).toBe('EXACTLY_ONE_SOURCE_REQUIRED');
  });

  it('should return 400 for malformed request body (missing houseSystem)', async () => {
    const payload = {
      birthProfileId: validBirthProfileId,
    };

    const response = await request(app)
      .post('/api/v1/charts/natal')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('MALFORMED_REQUEST');
  });
});
