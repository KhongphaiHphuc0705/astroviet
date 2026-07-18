import { registry } from '../../../../docs/openapi.js';
import { registerResponseSchema } from '../mappers/register-response.mapper.js';
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
