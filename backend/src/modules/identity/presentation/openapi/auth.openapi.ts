import { registry } from '../../../../docs/openapi.js';
import { authResponseSchema } from '../mappers/auth-response.mapper.js';
import { registerResponseSchema } from '../mappers/register-response.mapper.js';
import { loginSchema } from '../schemas/login.schema.js';
import { refreshSchema } from '../schemas/refresh.schema.js';
import { registerSchema } from '../schemas/register.schema.js';

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  tags: ['Authentication'],
  summary: 'Register a new user',
  description: 'Creates a new user account and triggers an email verification process.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User registered successfully',
      content: {
        'application/json': {
          schema: registerResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request (Validation Error or Malformed Request)',
    },
    409: {
      description: 'Conflict (Email already exists)',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  summary: 'Login user',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User logged in successfully',
      content: {
        'application/json': {
          schema: authResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation Error',
    },
    401: {
      description: 'Invalid Credentials',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh',
  summary: 'Refresh access token',
  tags: ['Authentication'],
  description:
    'Uses a valid refresh token from HTTP-only cookie or request body to issue a new pair of tokens.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: refreshSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Tokens refreshed successfully',
      content: {
        'application/json': {
          schema: authResponseSchema,
        },
      },
    },
    400: {
      description: 'Malformed Request (Missing token)',
    },
    401: {
      description: 'Unauthorized or Token Expired',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  summary: 'Logout user',
  tags: ['Authentication'],
  description:
    'Revokes the current refresh token and clears the cookie. Requires a valid access token in the Authorization header.',
  security: [{ bearerAuth: [] }],
  responses: {
    204: {
      description: 'Logged out successfully, no content',
    },
    401: {
      description: 'Missing or invalid Authorization header',
    },
  },
});
