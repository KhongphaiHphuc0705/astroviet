import { describe, it, expect } from 'vitest';

import {
  ValidationError,
  NotFoundError,
  InfrastructureError,
  DomainError,
  ErrorCode,
} from '../../../src/shared/errors/index.js';
import { mapErrorToProblemDetails } from '../../../src/shared/http/index.js';

describe('Error Kernel - Problem Details Mapping', () => {
  const context = { instance: '/api/v1/test', requestId: 'req-123' };

  it('should map ValidationError to ProblemDetails correctly', () => {
    const error = new ValidationError(ErrorCode.VALIDATION_ERROR, 'Invalid input', {
      errors: [{ field: 'email', message: 'Invalid email' }],
    });

    const result = mapErrorToProblemDetails(error, context);

    expect(result.type).toBe('https://api.astroviet.vn/errors/validation-error');
    expect(result.title).toBe('Validation Error');
    expect(result.status).toBe(422);
    expect(result.detail).toBe('Invalid input');
    expect(result.instance).toBe(context.instance);
    expect(result.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
    expect(result.requestId).toBe(context.requestId);
    expect(result.errors).toEqual([{ field: 'email', message: 'Invalid email' }]);
    expect(result.metadata).toBeUndefined();
    expect(result.timestamp).toBeDefined();
  });

  it('should map NotFoundError to ProblemDetails correctly', () => {
    const error = new NotFoundError('User not found');
    const result = mapErrorToProblemDetails(error, context);

    expect(result.status).toBe(404);
    expect(result.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    expect(result.type).toBe('https://api.astroviet.vn/errors/resource-not-found');
    expect(result.title).toBe('Resource Not Found');
    expect(result.detail).toBe('User not found');
  });

  it('should map InfrastructureError to ProblemDetails correctly', () => {
    const cause = new Error('DB connection failed');
    const error = new InfrastructureError('Internal Server Error', undefined, cause);
    const result = mapErrorToProblemDetails(error, context);

    expect(result.status).toBe(500);
    expect(result.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    expect(result.type).toBe('https://api.astroviet.vn/errors/internal-server-error');
    expect(result.title).toBe('Internal Server Error');
    expect(result.detail).toBe('Internal Server Error');
  });

  it('should map DomainError to ProblemDetails correctly', () => {
    const error = new DomainError(ErrorCode.DOMAIN_ERROR, 'Does not converge');
    const result = mapErrorToProblemDetails(error, context);

    expect(result.status).toBe(422);
    expect(result.errorCode).toBe(ErrorCode.DOMAIN_ERROR);
  });

  it('should wrap unknown errors in InfrastructureError', () => {
    const unknownError = new Error('Something went completely wrong');
    const result = mapErrorToProblemDetails(unknownError, context);

    expect(result.status).toBe(500);
    expect(result.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    expect(result.title).toBe('Internal Server Error');
    expect(result.detail).toBe('An unexpected error occurred');
    expect(result.instance).toBe(context.instance);
  });

  it('should include metadata if provided', () => {
    const error = new NotFoundError('Not found', { userId: '123' });
    const result = mapErrorToProblemDetails(error, context);

    expect(result.metadata).toEqual({ userId: '123' });
    expect(result.errors).toBeUndefined();
  });
});
