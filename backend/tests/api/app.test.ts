import { Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';

import { bootstrapApplication } from '../../src/composition-root.js';

describe('Express Bootstrap - Integration Test', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/test';
    const result = await bootstrapApplication();
    app = result.app;
  });

  it('should return 404 Problem Details for unknown routes', async () => {
    const response = await request(app).get('/anything');

    // Status code
    expect(response.status).toBe(404);

    // Content Type
    expect(response.headers['content-type']).toContain('application/problem+json');

    // X-Request-ID Header
    expect(response.headers['x-request-id']).toBeDefined();
    const requestId = response.headers['x-request-id'];

    // Body Validation (RFC7807)
    expect(response.body).toBeDefined();
    expect(response.body.type).toBe('https://api.astroviet.vn/errors/resource-not-found');
    expect(response.body.title).toBe('Resource Not Found');
    expect(response.body.status).toBe(404);
    expect(response.body.detail).toBe('Route GET /anything not found');
    expect(response.body.instance).toBe('/anything');
    expect(response.body.errorCode).toBe('RESOURCE_NOT_FOUND');
    expect(response.body.requestId).toBe(requestId);
    expect(response.body.timestamp).toBeDefined();
  });

  it('should reuse upstream X-Request-ID if provided', async () => {
    const customId = 'custom-upstream-id';
    const response = await request(app).get('/anything').set('X-Request-ID', customId);

    expect(response.headers['x-request-id']).toBe(customId);
    expect(response.body.requestId).toBe(customId);
  });
});
