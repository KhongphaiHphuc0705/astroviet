import { z } from 'zod';

import { registry } from '../docs/openapi.js';

export const HealthStatusSchema = z.object({
  status: z.string().openapi({ example: 'OK' }),
});

export const DatabaseStatusSchema = z.object({
  database: z.enum(['up', 'down']).openapi({ example: 'up' }),
});

export const OverallHealthSchema = z.object({
  database: z.enum(['up', 'down']).openapi({ example: 'up' }),
  uptime: z.number().openapi({ example: 123.45 }),
  timestamp: z.string().datetime().openapi({ example: '2026-07-14T09:43:00.000Z' }),
  version: z.string().openapi({ example: '0.1.0' }),
  environment: z.string().openapi({ example: 'development' }),
});

registry.registerPath({
  method: 'get',
  path: '/live',
  tags: ['Health'],
  summary: 'Liveness probe',
  description: 'Checks if the HTTP server is running.',
  responses: {
    200: {
      description: 'Server is alive',
      content: {
        'application/json': {
          schema: HealthStatusSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/ready',
  tags: ['Health'],
  summary: 'Readiness probe',
  description: 'Checks if the application is ready to accept traffic (e.g. database is up).',
  responses: {
    200: {
      description: 'Application is ready',
      content: {
        'application/json': {
          schema: DatabaseStatusSchema,
        },
      },
    },
    500: {
      description: 'Infrastructure Error',
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Overall Health',
  description: 'Returns overall system health status and metadata.',
  responses: {
    200: {
      description: 'Detailed health status',
      content: {
        'application/json': {
          schema: OverallHealthSchema,
        },
      },
    },
  },
});
