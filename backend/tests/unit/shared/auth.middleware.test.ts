import { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';

import { ITokenProvider } from '../../../src/modules/identity/domain/ports/token-provider.port.js';
import { AuthenticationError } from '../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../src/shared/errors/error-codes.js';
import { authMiddleware } from '../../../src/shared/middlewares/auth.middleware.js';

describe('authMiddleware', () => {
  let mockTokenProvider: Mocked<ITokenProvider>;
  let req: Partial<Request> & { user?: any };
  let res: Partial<Response>;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTokenProvider = {
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      hashRefreshToken: vi.fn(),
      verifyAccessToken: vi.fn(),
    };
    req = { headers: {} };
    res = {};
    next = vi.fn();
  });

  it('should call next() without error if Authorization header is missing', () => {
    const middleware = authMiddleware(mockTokenProvider);
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
    expect(mockTokenProvider.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('should call next() without error if Authorization header does not start with Bearer', () => {
    req.headers = { authorization: 'Basic some-token' };
    const middleware = authMiddleware(mockTokenProvider);
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeUndefined();
    expect(mockTokenProvider.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('should verify token and set req.user if Bearer token is valid', () => {
    req.headers = { authorization: 'Bearer valid-token' };
    const mockPayload = { sub: 'user-1', role: 'user' as const };
    mockTokenProvider.verifyAccessToken.mockReturnValue(mockPayload);

    const middleware = authMiddleware(mockTokenProvider);
    middleware(req as Request, res as Response, next);

    expect(mockTokenProvider.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual(mockPayload);
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next(error) if token verification throws TOKEN_EXPIRED', () => {
    req.headers = { authorization: 'Bearer expired-token' };
    const error = new AuthenticationError(ErrorCode.TOKEN_EXPIRED, 'Token expired');
    mockTokenProvider.verifyAccessToken.mockImplementation(() => {
      throw error;
    });

    const middleware = authMiddleware(mockTokenProvider);
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should call next(error) if token verification throws UNAUTHORIZED', () => {
    req.headers = { authorization: 'Bearer malformed-token' };
    const error = new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Invalid token');
    mockTokenProvider.verifyAccessToken.mockImplementation(() => {
      throw error;
    });

    const middleware = authMiddleware(mockTokenProvider);
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
