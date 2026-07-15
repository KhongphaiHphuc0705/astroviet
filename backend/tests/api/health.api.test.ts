import { Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, vi } from 'vitest';

import { bootstrapApplication } from '../../src/composition-root.js';
import { env } from '../../src/config/env.config.js';
import { prisma } from '../../src/shared/prisma/prisma-client.js';

vi.mock('../../src/shared/prisma/prisma-client.js', () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
  },
}));

const ENDPOINTS = {
  HEALTH: '/health',
  LIVE: '/live',
  READY: '/ready',
} as const;

const HTTP_STATUS = {
  OK: 200,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const HEADERS = {
  CONTENT_TYPE: 'content-type',
  X_REQUEST_ID: 'x-request-id',
} as const;

describe('Health API - Integration Test', () => {
  let app: Express;

  beforeAll(async () => {
    // Arrange: Setup Application
    const result = await bootstrapApplication();
    app = result.app;
  });

  describe(`GET ${ENDPOINTS.HEALTH}`, () => {
    it('should return 200 OK with correct schema, headers, and request ID', async () => {
      // Arrange
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValueOnce([{ '?column?': 1 }]);

      // Act
      const response = await request(app).get(ENDPOINTS.HEALTH);

      // Assert - Status & Headers
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.headers[HEADERS.CONTENT_TYPE]).toContain('application/json');
      expect(response.headers[HEADERS.X_REQUEST_ID]).toBeDefined();

      // Assert - Schema & Fields
      const body = response.body as Record<string, unknown>;
      expect(body).toHaveProperty('database', 'up');
      expect(body).toHaveProperty('environment', env.NODE_ENV);
      expect(body).toHaveProperty('version');

      // Assert - Time fields
      expect(body).toHaveProperty('timestamp');
      expect(typeof body.timestamp).toBe('string');
      expect(Number.isNaN(Date.parse(body.timestamp as string))).toBe(false);

      expect(body).toHaveProperty('uptime');
      expect(typeof body.uptime).toBe('number');
      expect(body.uptime as number).toBeGreaterThan(0);
    });
  });

  describe(`GET ${ENDPOINTS.LIVE}`, () => {
    it('should return 200 OK', async () => {
      // Arrange (Empty)

      // Act
      const response = await request(app).get(ENDPOINTS.LIVE);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body).toEqual({ status: 'OK' });
    });
  });

  describe(`GET ${ENDPOINTS.READY}`, () => {
    it('should return 200 when DB is up', async () => {
      // Arrange
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValueOnce([{ '?column?': 1 }]);

      // Act
      const response = await request(app).get(ENDPOINTS.READY);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body).toEqual({ database: 'up' });
    });

    it('should return 500 Problem Details when DB is down', async () => {
      // Arrange
      vi.mocked(prisma.$queryRawUnsafe).mockRejectedValueOnce(new Error('Connection Failed'));

      // Act
      const response = await request(app).get(ENDPOINTS.READY);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(response.headers[HEADERS.CONTENT_TYPE]).toContain('application/problem+json');
      expect(response.body.errorCode).toBe('INTERNAL_SERVER_ERROR');
      expect(response.body.detail).toBe('Database is not ready');
    });
  });
});
