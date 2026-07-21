import { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthenticationError } from '../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../src/shared/errors/error-codes.js';
import { requireAuth } from '../../../src/shared/middlewares/require-auth.middleware.js';

describe('requireAuth middleware', () => {
  let req: Partial<Request> & { user?: any };
  let res: Partial<Response>;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    req = {};
    res = {};
    next = vi.fn();
  });

  it('should call next() without error if req.user exists', () => {
    req.user = { sub: 'user-1', role: 'user' };
    const middleware = requireAuth();
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should call next(AuthenticationError) if req.user is undefined', () => {
    const middleware = requireAuth();
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    const errorArg = next.mock.calls[0][0] as AuthenticationError;
    expect(errorArg.errorCode).toBe(ErrorCode.UNAUTHORIZED);
  });
});
