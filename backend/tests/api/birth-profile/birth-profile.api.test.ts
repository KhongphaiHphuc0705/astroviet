import { Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { bootstrapApplication } from '../../../src/composition-root.js';
import { env } from '../../../src/config/env.config.js';
import { generateOpenApiDocument } from '../../../src/docs/openapi.js';
import { JwtTokenAdapter } from '../../../src/modules/identity/infrastructure/adapters/jwt-token.adapter.js';
import { prisma } from '../../../src/shared/prisma/prisma-client.js';
import { PrismaTestFactory } from '../../fixtures/prisma-test.factory.js';
import { DatabaseTestHelper } from '../../helpers/database.helper.js';

describe('Birth Profile API Endpoints', () => {
  let app: Express;
  let dbHelper: DatabaseTestHelper;
  let factory: PrismaTestFactory;
  let tokenProvider: JwtTokenAdapter;
  let validUser: { id: string; email: string };
  let accessToken: string;

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

    // Create a valid user and token
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
  });

  describe('POST /api/v1/birth-profiles', () => {
    it('should create a new birth profile successfully', async () => {
      const payload = {
        label: 'My Profile',
        fullName: 'Nguyen Van A',
        birthDate: '1990-01-01',
        birthTime: '14:30:00',
        isBirthTimeKnown: true,
        birthLocation: {
          placeName: 'Hanoi',
          latitude: 21.0285,
          longitude: 105.8542,
          historicalTimezoneId: 'Asia/Ho_Chi_Minh',
        },
      };

      const response = await request(app)
        .post('/api/v1/birth-profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.userId).toBe(validUser.id);
      expect(response.body.label).toBe(payload.label);
      expect(response.body.fullName).toBe(payload.fullName);
      expect(response.body.birthDate).toBe(payload.birthDate);
      expect(response.body.birthTime).toBe(payload.birthTime);
      expect(response.body.isBirthTimeKnown).toBe(true);
      expect(response.body.placeName).toBe('Hanoi');
    });

    it('should return 400 for missing required fields', async () => {
      const payload = {
        label: 'My Profile',
        // missing birthDate, birthLocation
      };

      const response = await request(app)
        .post('/api/v1/birth-profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe('MALFORMED_REQUEST');
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app).post('/api/v1/birth-profiles').send({});
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/birth-profiles', () => {
    it('should return a paginated list of birth profiles', async () => {
      // Create some profiles directly using API to test listing
      await request(app)
        .post('/api/v1/birth-profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          label: 'Profile 1',
          birthDate: '1990-01-01',
          isBirthTimeKnown: false,
          birthLocation: {
            placeName: 'Hanoi',
            latitude: 21.0285,
            longitude: 105.8542,
            historicalTimezoneId: 'Asia/Ho_Chi_Minh',
          },
        });

      await request(app)
        .post('/api/v1/birth-profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          label: 'Profile 2',
          birthDate: '1991-02-02',
          isBirthTimeKnown: false,
          birthLocation: {
            placeName: 'HCMC',
            latitude: 10.8231,
            longitude: 106.6297,
            historicalTimezoneId: 'Asia/Ho_Chi_Minh',
          },
        });

      const response = await request(app)
        .get('/api/v1/birth-profiles?page=1&pageSize=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.page).toBe(1);
    });

    it('should return 400 Validation Error if query params are invalid', async () => {
      const response = await request(app)
        .get('/api/v1/birth-profiles?pageSize=abc')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe('MALFORMED_REQUEST');
    });

    it('should return 400 Validation Error if requested pageSize > 100', async () => {
      const response = await request(app)
        .get('/api/v1/birth-profiles?pageSize=999')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe('MALFORMED_REQUEST');
    });
  });

  describe('GET /api/v1/birth-profiles/:id', () => {
    it('should return 404 for non-existent profile', async () => {
      const randomUuid = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/v1/birth-profiles/${randomUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 Validation Error if path param :id is not a valid UUID', async () => {
      const response = await request(app)
        .get('/api/v1/birth-profiles/not-a-uuid')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe('MALFORMED_REQUEST');
    });

    it('should return the correct profile when it exists', async () => {
      const createRes = await request(app)
        .post('/api/v1/birth-profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          label: 'My Profile',
          birthDate: '1990-01-01',
          isBirthTimeKnown: false,
          birthLocation: {
            placeName: 'Hanoi',
            latitude: 21.0285,
            longitude: 105.8542,
            historicalTimezoneId: 'Asia/Ho_Chi_Minh',
          },
        });

      const profileId = createRes.body.id;

      const getRes = await request(app)
        .get(`/api/v1/birth-profiles/${profileId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.id).toBe(profileId);
      expect(getRes.body.label).toBe('My Profile');
    });

    it('should return 403 when accessing someone else profile', async () => {
      // Create profile with user 1
      const createRes = await request(app)
        .post('/api/v1/birth-profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          label: 'My Profile',
          birthDate: '1990-01-01',
          isBirthTimeKnown: false,
          birthLocation: {
            placeName: 'Hanoi',
            latitude: 21.0,
            longitude: 105.0,
            historicalTimezoneId: 'Asia/Ho_Chi_Minh',
          },
        });

      const profileId = createRes.body.id;

      // User 2
      const user2 = await factory.createUser({
        email: 'other@example.com',
        passwordHash: 'dummy',
        displayName: 'Other',
        role: 'user',
      });
      const token2 = tokenProvider.generateAccessToken({ sub: user2.id, role: 'user' });

      const getRes = await request(app)
        .get(`/api/v1/birth-profiles/${profileId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(getRes.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/birth-profiles/:id', () => {
    it('should successfully update a profile', async () => {
      const createRes = await request(app)
        .post('/api/v1/birth-profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          label: 'Old Label',
          birthDate: '1990-01-01',
          isBirthTimeKnown: false,
          birthLocation: {
            placeName: 'Hanoi',
            latitude: 21.0285,
            longitude: 105.8542,
            historicalTimezoneId: 'Asia/Ho_Chi_Minh',
          },
        });

      const profileId = createRes.body.id;

      const updateRes = await request(app)
        .patch(`/api/v1/birth-profiles/${profileId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          label: 'New Label',
          isBirthTimeKnown: true,
          birthTime: '15:00:00',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.label).toBe('New Label');
      expect(updateRes.body.isBirthTimeKnown).toBe(true);
      expect(updateRes.body.birthTime).toBe('15:00:00');
      // Verify other fields remain intact
      expect(updateRes.body.birthDate).toBe('1990-01-01');
    });

    it('should return 422 for invalid updates (e.g. invalid time state)', async () => {
      const createRes = await request(app)
        .post('/api/v1/birth-profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          label: 'Old Label',
          birthDate: '1990-01-01',
          isBirthTimeKnown: false,
          birthLocation: {
            placeName: 'Hanoi',
            latitude: 21.0,
            longitude: 105.0,
            historicalTimezoneId: 'Asia/Ho_Chi_Minh',
          },
        });

      const profileId = createRes.body.id;

      const updateRes = await request(app)
        .patch(`/api/v1/birth-profiles/${profileId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          isBirthTimeKnown: false,
          birthTime: '15:00:00', // invalid state: false + time provided
        });

      expect(updateRes.status).toBe(422); // Because it throws domain InvalidBirthTimeStateError
    });
  });

  describe('DELETE /api/v1/birth-profiles/:id', () => {
    it('should successfully soft-delete a profile', async () => {
      const createRes = await request(app)
        .post('/api/v1/birth-profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          label: 'To be deleted',
          birthDate: '1990-01-01',
          isBirthTimeKnown: false,
          birthLocation: {
            placeName: 'Hanoi',
            latitude: 21.0,
            longitude: 105.0,
            historicalTimezoneId: 'Asia/Ho_Chi_Minh',
          },
        });

      const profileId = createRes.body.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/birth-profiles/${profileId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteRes.status).toBe(204);

      // Verify it's actually deleted (cannot be fetched)
      const getRes = await request(app)
        .get(`/api/v1/birth-profiles/${profileId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getRes.status).toBe(404);
    });
  });
  describe('OpenAPI Generation', () => {
    it('should include birth-profile endpoints in the generated OpenAPI document', () => {
      const document = generateOpenApiDocument();

      const paths = document.paths;
      expect(paths).toBeDefined();
      expect(paths?.['/api/v1/birth-profiles']).toBeDefined();
      expect(paths?.['/api/v1/birth-profiles/{id}']).toBeDefined();

      const listEndpoint = paths?.['/api/v1/birth-profiles']?.get;
      expect(listEndpoint).toBeDefined();
      expect(listEndpoint?.tags).toContain('Birth Profile');
    });
  });
});
