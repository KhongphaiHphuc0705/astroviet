import { describe, it, expect } from 'vitest';

import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  ConfigurationError,
  ExternalServiceError,
  ErrorCode,
} from '../../../src/shared/errors/index.js';

describe('App Errors', () => {
  it('AuthenticationError should have correct defaults', () => {
    const error = new AuthenticationError();
    expect(error.statusCode).toBe(401);
    expect(error.errorCode).toBe(ErrorCode.UNAUTHORIZED);
    expect(error.message).toBe('Unauthorized');
  });

  it('AuthorizationError should have correct defaults', () => {
    const error = new AuthorizationError();
    expect(error.statusCode).toBe(403);
    expect(error.errorCode).toBe(ErrorCode.FORBIDDEN);
    expect(error.message).toBe('Forbidden');
  });

  it('ConflictError should set errorCode and message correctly', () => {
    const error = new ConflictError('TEST_CONFLICT', 'Conflict occurred');
    expect(error.statusCode).toBe(409);
    expect(error.errorCode).toBe('TEST_CONFLICT');
    expect(error.message).toBe('Conflict occurred');
  });

  it('ConfigurationError should have correct defaults and cause', () => {
    const cause = new Error('Config missing');
    const error = new ConfigurationError('Invalid config', { missingEnv: 'PORT' }, cause);
    expect(error.statusCode).toBe(500);
    expect(error.errorCode).toBe(ErrorCode.CONFIGURATION_ERROR);
    expect(error.message).toBe('Invalid config');
    expect(error.details).toEqual({ missingEnv: 'PORT' });
    expect(error.cause).toBe(cause);
  });

  it('ExternalServiceError should have correct defaults', () => {
    const error = new ExternalServiceError();
    expect(error.statusCode).toBe(500);
    expect(error.errorCode).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
    expect(error.message).toBe('External Service Error');
  });

  it('ExternalServiceError should accept custom values', () => {
    const cause = new Error('Timeout');
    const error = new ExternalServiceError(
      'API_TIMEOUT',
      'Service timed out',
      { url: '/api' },
      cause,
    );
    expect(error.errorCode).toBe('API_TIMEOUT');
    expect(error.message).toBe('Service timed out');
    expect(error.details).toEqual({ url: '/api' });
    expect(error.cause).toBe(cause);
  });
});
