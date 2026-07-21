import { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthenticationError, AuthorizationError } from '../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../src/shared/errors/error-codes.js';
import { requireRole } from '../../../src/shared/middlewares/require-role.middleware.js';

describe('requireRole middleware', () => {
  let req: Partial<Request> & { user?: any };
  let res: Partial<Response>;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    req = {};
    res = {};
    next = vi.fn();
  });

  it('should call next() if user role matches the required single role', () => {
    req.user = { sub: 'user-1', role: 'admin' };
    const middleware = requireRole('admin');
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should call next() if user role is included in allowed roles', () => {
    req.user = { sub: 'user-1', role: 'user' };
    const middleware = requireRole('user', 'admin');
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should call next(AuthorizationError) if user role does not match', () => {
    req.user = { sub: 'user-1', role: 'user' };
    const middleware = requireRole('admin');
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
    const errorArg = next.mock.calls[0][0] as AuthorizationError;
    expect(errorArg.errorCode).toBe(ErrorCode.FORBIDDEN);
  });

  it('should call next(AuthenticationError) if req.user is undefined', () => {
    const middleware = requireRole('admin');
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    const errorArg = next.mock.calls[0][0] as AuthenticationError;
    expect(errorArg.errorCode).toBe(ErrorCode.UNAUTHORIZED);
  });
});
