import { Request } from 'express';
import { describe, it, expect } from 'vitest';

import { getCurrentUser } from '../../../src/shared/context/current-user.js';
import { AuthenticationError } from '../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../src/shared/errors/error-codes.js';

describe('getCurrentUser context helper', () => {
  it('should return req.user if it exists', () => {
    const mockUser = { sub: 'user-1', role: 'user' as const };
    const req = { user: mockUser } as unknown as Request;

    const result = getCurrentUser(req);
    expect(result).toEqual(mockUser);
  });

  it('should throw AuthenticationError if req.user is undefined', () => {
    const req = {} as unknown as Request;

    expect(() => getCurrentUser(req)).toThrowError(AuthenticationError);
    try {
      getCurrentUser(req);
    } catch (error: any) {
      expect(error.errorCode).toBe(ErrorCode.UNAUTHORIZED);
    }
  });
});
