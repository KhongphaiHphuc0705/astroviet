import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { problemDetailsSchema } from '../../../../shared/http/problem-details.js';
import { birthProfileResponseSchema } from '../mappers/birth-profile-response.mapper.js';
import { birthProfileIdSchema } from '../schemas/birth-profile-id.schema.js';
import { createBirthProfileSchema } from '../schemas/create-birth-profile.schema.js';
import { listBirthProfilesQuerySchema } from '../schemas/list-birth-profiles-query.schema.js';
import { updateBirthProfileSchema } from '../schemas/update-birth-profile.schema.js';

export const birthProfileRegistry = new OpenAPIRegistry();

const bearerAuth: any = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
};

birthProfileRegistry.registerComponent('securitySchemes', 'bearerAuth', bearerAuth);

const security = [{ bearerAuth: [] }];
const tags = ['Birth Profile'];

// GET /api/v1/birth-profiles
birthProfileRegistry.registerPath({
  method: 'get',
  path: '/api/v1/birth-profiles',
  tags,
  security,
  summary: 'List birth profiles',
  description: 'Retrieve a paginated list of birth profiles for the authenticated user.',
  request: {
    query: listBirthProfilesQuerySchema,
  },
  responses: {
    200: {
      description: 'A paginated list of birth profiles.',
      // Paginated schema shouldn't be fully typed in Zod unless we inline it here,
      // but let's provide a generic JSON structure for the doc.
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/BirthProfileResponse',
                },
              },
              total: { type: 'number' },
              page: { type: 'number' },
              pageSize: { type: 'number' },
            },
          },
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
  },
});

// POST /api/v1/birth-profiles
birthProfileRegistry.registerPath({
  method: 'post',
  path: '/api/v1/birth-profiles',
  tags,
  security,
  summary: 'Create a new birth profile',
  description: 'Create a new birth profile for the authenticated user.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createBirthProfileSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'The created birth profile.',
      content: {
        'application/json': {
          schema: birthProfileResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
  },
});

// GET /api/v1/birth-profiles/{id}
birthProfileRegistry.registerPath({
  method: 'get',
  path: '/api/v1/birth-profiles/{id}',
  tags,
  security,
  summary: 'Get a birth profile by ID',
  description: 'Retrieve a specific birth profile by its ID.',
  request: {
    params: birthProfileIdSchema,
  },
  responses: {
    200: {
      description: 'The requested birth profile.',
      content: {
        'application/json': {
          schema: birthProfileResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    404: {
      description: 'Not Found',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
  },
});

// PATCH /api/v1/birth-profiles/{id}
birthProfileRegistry.registerPath({
  method: 'patch',
  path: '/api/v1/birth-profiles/{id}',
  tags,
  security,
  summary: 'Update a birth profile',
  description: 'Update specific fields of an existing birth profile.',
  request: {
    params: birthProfileIdSchema,
    body: {
      content: {
        'application/json': {
          schema: updateBirthProfileSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'The updated birth profile.',
      content: {
        'application/json': {
          schema: birthProfileResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    404: {
      description: 'Not Found',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    409: {
      description: 'Conflict (Optimistic Locking Error)',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
  },
});

// DELETE /api/v1/birth-profiles/{id}
birthProfileRegistry.registerPath({
  method: 'delete',
  path: '/api/v1/birth-profiles/{id}',
  tags,
  security,
  summary: 'Delete a birth profile',
  description: 'Soft delete a specific birth profile.',
  request: {
    params: birthProfileIdSchema,
  },
  responses: {
    204: {
      description: 'Successfully deleted.',
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    404: {
      description: 'Not Found',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
  },
});
