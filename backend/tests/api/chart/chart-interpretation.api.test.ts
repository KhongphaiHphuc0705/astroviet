import { Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { bootstrapApplication } from '../../../src/composition-root.js';
import { env } from '../../../src/config/env.config.js';
import { chartResponseSchema } from '../../../src/modules/chart/presentation/mappers/chart-response.mapper.js';
import { JwtTokenAdapter } from '../../../src/modules/identity/infrastructure/adapters/jwt-token.adapter.js';
import { prisma } from '../../../src/shared/prisma/prisma-client.js';
import { PrismaTestFactory } from '../../fixtures/prisma-test.factory.js';
import { DatabaseTestHelper } from '../../helpers/database.helper.js';

describe('Chart Interpretation API', () => {
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

  it('A/B/J: should create chart with interpretation data and strict schema validation', async () => {
    await factory.createInterpretationContents({ version: '1.0', status: 'Published' });

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

    // Strict schema check
    const parseResult = chartResponseSchema.strict().safeParse(response.body);
    expect(parseResult.success).toBe(true);

    const body = response.body;
    expect(body.interpretationVersion).toBe('1.0');
    expect(body.interpretations.length).toBe(21); // 10 PlanetInSign + 1 AngleInSign + 10 PlanetInHouse

    const planetsOrder = [
      'Sun',
      'Moon',
      'Mercury',
      'Venus',
      'Mars',
      'Jupiter',
      'Saturn',
      'Uranus',
      'Neptune',
      'Pluto',
    ];

    // Check order and types
    for (let i = 0; i < 10; i++) {
      expect(body.interpretations[i].subjectType).toBe('PlanetInSign');
      expect(body.interpretations[i].subjectKey).toContain(planetsOrder[i]);
    }
    expect(body.interpretations[10].subjectType).toBe('AngleInSign');
    expect(body.interpretations[10].subjectKey).toContain('Ascendant');
    for (let i = 11; i < 21; i++) {
      expect(body.interpretations[i].subjectType).toBe('PlanetInHouse');
      expect(body.interpretations[i].subjectKey).toContain(planetsOrder[i - 11]);
    }

    // Check keys and values for all items
    for (const item of body.interpretations) {
      expect(Object.keys(item).sort()).toEqual([
        'bodyText',
        'language',
        'subjectKey',
        'subjectType',
        'tone',
      ]);
      expect(item.bodyText).toContain('fixture:1.0:');
      expect(item.tone).toBeNull();
    }

    // Check DB to ensure the version was correctly pinned
    const chartInDb = await prisma.chart.findUnique({ where: { id: body.id } });
    expect(chartInDb?.snapshot_interpretation_version).toBe('1.0');
  });

  it('C: should handle missing birth time (no houses/angles)', async () => {
    await factory.createInterpretationContents({ version: '1.0', status: 'Published' });

    const payload = {
      birthData: {
        birthDate: '1990-01-01',
        birthTime: null,
        isBirthTimeKnown: false,
        placeName: 'Hanoi',
        latitude: 21.0285,
        longitude: 105.8542,
        timezoneId: 'Asia/Ho_Chi_Minh',
      },
      houseSystem: 'Placidus',
      includeOptionalPoints: [],
    };

    const response = await request(app).post('/api/v1/charts/natal?save=false').send(payload);

    expect(response.status).toBe(200);
    const body = response.body;

    expect(body.isHouseDataAvailable).toBe(false);
    expect(body.houses).toEqual([]);
    expect(body.angles).toEqual([]);
    expect(body.interpretationVersion).toBe('1.0');
    expect(body.interpretations.length).toBe(10); // Only PlanetInSign

    const planetsOrder = [
      'Sun',
      'Moon',
      'Mercury',
      'Venus',
      'Mars',
      'Jupiter',
      'Saturn',
      'Uranus',
      'Neptune',
      'Pluto',
    ];
    for (let i = 0; i < 10; i++) {
      const item = body.interpretations[i];
      expect(item.subjectType).toBe('PlanetInSign');
      expect(item.subjectKey).toContain(planetsOrder[i]);
      expect(item.subjectKey).toContain('_in_');
    }
  });

  it('D: should return empty interpretations when bank is empty', async () => {
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
    expect(response.body.interpretations).toEqual([]);
    expect(response.body.interpretationVersion).toBeNull();
  });

  it('E: should return pinned interpretation version for saved charts', async () => {
    await factory.createInterpretationContents({ version: '1.0', status: 'Published' });

    const createRes = await request(app)
      .post('/api/v1/charts/natal?save=true')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        birthProfileId: validBirthProfileId,
        houseSystem: 'Placidus',
        includeOptionalPoints: [],
      });

    expect(createRes.status).toBe(201);
    const chartId = createRes.body.id;

    // Simulate adding version 2.0
    await factory.createInterpretationContents({ version: '2.0', status: 'Published' });

    const getRes = await request(app)
      .get(`/api/v1/charts/${chartId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.interpretationVersion).toBe('1.0'); // still 1.0
    expect(getRes.body.interpretations[0].bodyText).toContain('fixture:1.0:');
  });

  it('F: should fetch latest version if chart is unpinned (snapshot_interpretation_version = null)', async () => {
    await factory.createInterpretationContents({ version: '1.0', status: 'Published' });

    const createRes = await request(app)
      .post('/api/v1/charts/natal?save=true')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        birthProfileId: validBirthProfileId,
        houseSystem: 'Placidus',
        includeOptionalPoints: [],
      });

    const chartId = createRes.body.id;

    // Force unpin
    await prisma.chart.update({
      where: { id: chartId },
      data: { snapshot_interpretation_version: null },
    });

    await factory.createInterpretationContents({ version: '2.0', status: 'Published' });

    const getRes = await request(app)
      .get(`/api/v1/charts/${chartId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.interpretationVersion).toBe('2.0');
    expect(getRes.body.interpretations[0].bodyText).toContain('fixture:2.0:');

    // Check DB to ensure it was not backfilled (still null)
    const chartInDb = await prisma.chart.findUnique({ where: { id: chartId } });
    expect(chartInDb?.snapshot_interpretation_version).toBeNull();
  });

  it('G: should return pinned version with empty array if content is removed', async () => {
    await factory.createInterpretationContents({ version: '1.0', status: 'Published' });

    const createRes = await request(app)
      .post('/api/v1/charts/natal?save=true')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        birthProfileId: validBirthProfileId,
        houseSystem: 'Placidus',
        includeOptionalPoints: [],
      });

    const chartId = createRes.body.id;

    // Delete content for 1.0
    await prisma.interpretationContent.deleteMany({ where: { version: '1.0' } });

    const getRes = await request(app)
      .get(`/api/v1/charts/${chartId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.interpretationVersion).toBe('1.0');
    expect(getRes.body.interpretations).toEqual([]);
  });

  it('H: should return interpretations for guest without saving', async () => {
    await factory.createInterpretationContents({ version: '1.0', status: 'Published' });

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

    expect(response.status).toBe(200);
    expect(response.body.interpretationVersion).toBe('1.0');
    expect(response.body.interpretations.length).toBeGreaterThan(0);

    // Check it is not saved
    const chartsCount = await prisma.chart.count();
    expect(chartsCount).toBe(0);
  });

  it('I: should return correct errors (401, 403, 404) without exposing interpretations', async () => {
    // 401 GET without token
    const res401 = await request(app).get('/api/v1/charts/some-id');
    expect(res401.status).toBe(401);
    expect(res401.body.interpretations).toBeUndefined();

    // 404 Not Found
    const res404 = await request(app)
      .get('/api/v1/charts/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res404.status).toBe(404);
    expect(res404.body.interpretations).toBeUndefined();

    // 403 Forbidden (other user chart)
    const otherUser = await factory.createUser();
    const otherUserToken = tokenProvider.generateAccessToken({
      sub: otherUser.id,
      role: 'user',
    });

    const createRes = await request(app)
      .post('/api/v1/charts/natal?save=true')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        birthProfileId: validBirthProfileId,
        houseSystem: 'Placidus',
        includeOptionalPoints: [],
      });
    const chartId = createRes.body.id;

    const res403 = await request(app)
      .get(`/api/v1/charts/${chartId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(res403.status).toBe(403);
    expect(res403.body.interpretations).toBeUndefined();
  });
});
