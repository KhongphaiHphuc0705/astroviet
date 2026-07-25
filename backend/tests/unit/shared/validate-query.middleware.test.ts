import { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

import { BadRequestError } from '../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../src/shared/errors/error-codes.js';
import { validateQuery } from '../../../src/shared/middlewares/validate-query.middleware.js';

describe('validateQuery middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: ReturnType<typeof vi.fn>;

  const testSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    search: z.string().optional(),
  });

  beforeEach(() => {
    req = { query: {} };
    res = {};
    next = vi.fn();
  });

  it('should call next() without error if payload is valid', () => {
    req.query = { page: '2', search: 'test' };
    const middleware = validateQuery(testSchema);

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.query).toEqual({ page: 2, search: 'test' });
  });

  it('should call next(BadRequestError) with Zod errors if fields are invalid', () => {
    req.query = { page: 'not-a-number' };
    const middleware = validateQuery(testSchema);

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    const errorArg = next.mock.calls[0][0] as BadRequestError;

    expect(errorArg.errorCode).toBe(ErrorCode.MALFORMED_REQUEST);
    expect(errorArg.details).toBeDefined();

    const details = errorArg.details as any;
    expect(details.fieldErrors).toHaveProperty('page');
  });

  it('should assign default values and strip unknown fields', () => {
    req.query = { unknownField: 'hacker' };
    const middleware = validateQuery(testSchema);

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.query).not.toHaveProperty('unknownField');
    expect(req.query).toHaveProperty('page', 1);
  });
});
