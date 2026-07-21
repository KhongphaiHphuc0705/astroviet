import { Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { bootstrapApplication } from '../../../src/composition-root.js';
import { prisma } from '../../../src/shared/prisma/prisma-client.js';
import { PrismaTestFactory } from '../../fixtures/prisma-test.factory.js';
import { DatabaseTestHelper } from '../../helpers/database.helper.js';

const ENDPOINT = '/api/v1/auth/register';

describe('POST /api/v1/auth/register API', () => {
  let app: Express;
  let dbHelper: DatabaseTestHelper;
  let factory: PrismaTestFactory;

  beforeAll(async () => {
    const result = await bootstrapApplication();
    app = result.app;
    dbHelper = new DatabaseTestHelper(prisma);
    factory = new PrismaTestFactory(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
  });

  it('should successfully register a new user and return 201', async () => {
    const payload = {
      email: 'newuser@example.com',
      password: 'StrongPassword1',
      displayName: 'New User',
    };

    const response = await request(app).post(ENDPOINT).send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');

    const user = response.body.user;
    expect(user).toHaveProperty('id');
    expect(user.email).toBe('newuser@example.com');
    expect(user.displayName).toBe('New User');
    expect(user.role).toBe('user');
    expect(user).not.toHaveProperty('passwordHash');

    // Verify in DB
    const dbUser = await prisma.user.findUnique({ where: { email: 'newuser@example.com' } });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.id).toBe(user.id);
    expect(dbUser?.password_hash).toBeDefined();
    expect(dbUser?.password_hash).not.toBe(payload.password);
    expect(dbUser?.password_hash.startsWith('$2b$')).toBe(true);
  });

  it('should trim and lowercase email before registering', async () => {
    const payload = {
      email: '  UPPERCASE@Example.com  ',
      password: 'StrongPassword1',
    };

    const response = await request(app).post(ENDPOINT).send(payload);

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('uppercase@example.com');
  });

  it('should return 400 Bad Request if validation fails (invalid email)', async () => {
    const payload = {
      email: 'invalid-email',
      password: 'StrongPassword1',
    };

    const response = await request(app).post(ENDPOINT).send(payload);

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('MALFORMED_REQUEST');
  });

  it('should return 400 Bad Request if validation fails (weak password)', async () => {
    const payload = {
      email: 'weakpass@example.com',
      password: 'weak', // min 8 chars, 1 digit
    };

    const response = await request(app).post(ENDPOINT).send(payload);

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('MALFORMED_REQUEST');
  });

  it('should return 409 Conflict if email is already in use', async () => {
    // Arrange: Create existing user
    await factory.createUser({ email: 'duplicate@example.com' });

    const payload = {
      email: 'duplicate@example.com',
      password: 'AnotherPassword2',
    };

    const response = await request(app).post(ENDPOINT).send(payload);

    expect(response.status).toBe(409);
    expect(response.body.errorCode).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('should ignore role field in payload and create user with default role (Privilege Escalation)', async () => {
    const payload = {
      email: 'hacker@example.com',
      password: 'StrongPassword1',
      displayName: 'Hacker',
      role: 'admin', // Attempt privilege escalation
    };

    const response = await request(app).post(ENDPOINT).send(payload);

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('user');

    // Verify in DB
    const dbUser = await prisma.user.findUnique({ where: { email: 'hacker@example.com' } });
    expect(dbUser?.role).toBe('user');
  });
});
