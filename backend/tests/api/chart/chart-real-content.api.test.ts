import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { bootstrapApplication } from '../../../src/composition-root.js';
import { env } from '../../../src/config/env.config.js';
import { seedInterpretationContent } from '../../../src/modules/chart/infrastructure/content/interpretation-content.seeder.js';
import { JwtTokenAdapter } from '../../../src/modules/identity/infrastructure/adapters/jwt-token.adapter.js';
import { prisma } from '../../../src/shared/prisma/prisma-client.js';
import { PrismaTestFactory } from '../../fixtures/prisma-test.factory.js';
import { DatabaseTestHelper } from '../../helpers/database.helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Chart Interpretation API with Real Content (O-M6-2)', () => {
  let app: Express;
  let dbHelper: DatabaseTestHelper;
  let factory: PrismaTestFactory;
  let tokenProvider: JwtTokenAdapter;
  let accessToken: string;
  let validBirthProfileId: string;

  beforeAll(async () => {
    const { app: expressApp } = await bootstrapApplication();
    app = expressApp;

    dbHelper = new DatabaseTestHelper(prisma);
    factory = new PrismaTestFactory(prisma);
    tokenProvider = new JwtTokenAdapter({
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessExpiryMinutes: env.JWT_ACCESS_EXPIRY_MINUTES,
      refreshExpiryDays: env.JWT_REFRESH_EXPIRY_DAYS,
    });
    await dbHelper.clearDatabase();

    // Ensure 'vi' language exists
    await prisma.language.upsert({
      where: { code: 'vi' },
      update: {},
      create: { code: 'vi', display_name: 'Vietnamese', is_default: true },
    });

    const validUser = await factory.createUser({
      email: 'test@example.com',
      passwordHash: 'dummy_hash',
      displayName: 'Test User',
      role: 'user',
    });

    accessToken = tokenProvider.generateAccessToken({
      sub: validUser.id,
      role: 'user',
    });

    // Seed real content
    const contentPath = path.resolve(__dirname, '../../../prisma/content/interpretations.vi.json');
    const rawData = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
    await seedInterpretationContent(prisma, rawData);

    // Create a birth profile
    const createRes = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        label: 'Test Profile',
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

  afterAll(async () => {
    await dbHelper.clearDatabase();
    await prisma.$disconnect();
  });

  it('should return real interpretations without placeholders', async () => {
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

    const body = response.body;
    expect(body.interpretationVersion).toBe('1.0');
    expect(body.interpretations.length).toBe(21);

    for (const item of body.interpretations) {
      expect(item.bodyText).toBeDefined();
      expect(item.bodyText.trim().length).toBeGreaterThan(0);
      expect(item.bodyText).not.toContain('fixture:');
      expect(item.bodyText).not.toContain('[OWNER_CONTENT_REQUIRED]');
    }
  });
});
