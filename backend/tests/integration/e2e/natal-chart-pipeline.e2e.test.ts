import { Express } from 'express';
import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';

import { bootstrapApplication } from '../../../src/composition-root.js';
import { env } from '../../../src/config/env.config.js';
import { JwtTokenAdapter } from '../../../src/modules/identity/infrastructure/adapters/jwt-token.adapter.js';
import { prisma } from '../../../src/shared/prisma/prisma-client.js';
import { PrismaTestFactory } from '../../fixtures/prisma-test.factory.js';
import { DatabaseTestHelper } from '../../helpers/database.helper.js';

describe('E2E Natal Chart Pipeline', () => {
  let app: Express;
  let dbHelper: DatabaseTestHelper;
  let factory: PrismaTestFactory;
  let tokenProvider: JwtTokenAdapter;
  let appModule: Awaited<ReturnType<typeof bootstrapApplication>>;

  beforeAll(async () => {
    appModule = await bootstrapApplication();
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
    await appModule.shutdown();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
    vi.restoreAllMocks();
  });

  it('completes the full natal chart pipeline: BirthProfile → Chart → Persist → Read → Delete', async () => {
    // 1. Authenticated user
    const user = await factory.createUser();
    const accessToken = tokenProvider.generateAccessToken({ sub: user.id, role: 'user' });

    // 2. Create BirthProfile (via factory as test setup)
    const birthProfile = await factory.createBirthProfile(user.id, {
      label: 'E2E Test Profile',
      is_birth_time_known: true,
    });

    // 3. POST /charts/natal?save=true using birthProfileId (VIA REAL HTTP)
    const createRes = await request(app)
      .post('/api/v1/charts/natal?save=true')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        birthProfileId: birthProfile.id,
        houseSystem: 'Placidus',
        includeOptionalPoints: [],
      });

    expect(createRes.status).toBe(201);
    const chartId = createRes.body.id;
    expect(chartId).toBeDefined();

    // 4. Verify persisted directly via Postgres (bypass Repository layer)
    const rawChart = await prisma.chart.findUnique({
      where: { id: chartId },
      include: { planets: true, houses: true },
    });

    expect(rawChart).not.toBeNull();
    expect(rawChart!.user_id).toBe(user.id);
    expect(rawChart!.birth_profile_id).toBe(birthProfile.id);
    expect(rawChart!.planets.length).toBeGreaterThanOrEqual(10);
    expect(rawChart!.houses.length).toBe(12);

    // 5. Verify it appears in GET /charts (list endpoint coverage in E2E flow)
    const listRes = await request(app)
      .get('/api/v1/charts')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.items)).toBe(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const foundInList = listRes.body.items.find((c: any) => c.id === chartId);
    expect(foundInList).toBeDefined();
    expect(foundInList.birthProfileId).toBe(birthProfile.id);

    // 6. GET /charts/{id} — verify reading snapshot does NOT recalculate via Swiss Ephemeris
    const ephemerisSpy = vi.spyOn(appModule.providers.ephemerisProvider, 'calculateNatal');

    const getRes = await request(app)
      .get(`/api/v1/charts/${chartId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(chartId);
    expect(getRes.body.planets.length).toBeGreaterThanOrEqual(10);
    expect(ephemerisSpy).not.toHaveBeenCalled();

    // 7. DELETE /charts/{id}
    const deleteRes = await request(app)
      .delete(`/api/v1/charts/${chartId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(deleteRes.status).toBe(204);

    // 8. Verify soft-delete respects Database Design Spec §9 (deleted_at set, child records kept)
    const afterDeleteChart = await prisma.chart.findUnique({
      where: { id: chartId },
    });
    expect(afterDeleteChart).not.toBeNull();
    expect(afterDeleteChart!.deleted_at).not.toBeNull(); // Soft deleted

    const remainingPlanets = await prisma.chartPlanet.count({
      where: { chart_id: chartId },
    });
    expect(remainingPlanets).toBe(rawChart!.planets.length); // Not hard-deleted

    const remainingHouses = await prisma.chartHouse.count({
      where: { chart_id: chartId },
    });
    expect(remainingHouses).toBe(rawChart!.houses.length); // Not hard-deleted

    // 9. GET after delete -> 404
    const getDeletedRes = await request(app)
      .get(`/api/v1/charts/${chartId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getDeletedRes.status).toBe(404);
  });
});
