import { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

import { BadRequestError } from '../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../src/shared/errors/error-codes.js';
import { validateParams } from '../../../src/shared/middlewares/validate-params.middleware.js';

describe('validateParams middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: ReturnType<typeof vi.fn>;

  const testSchema = z.object({
    id: z.string().uuid(),
  });

  beforeEach(() => {
    req = { params: {} };
    res = {};
    next = vi.fn();
  });

  it('should call next() without error if payload is valid', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    req.params = { id: validUuid };
    const middleware = validateParams(testSchema);

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.params).toEqual({ id: validUuid });
  });

  it('should call next(BadRequestError) with Zod errors if fields are invalid', () => {
    req.params = { id: 'invalid-uuid' };
    const middleware = validateParams(testSchema);

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    const errorArg = next.mock.calls[0][0] as BadRequestError;

    expect(errorArg.errorCode).toBe(ErrorCode.MALFORMED_REQUEST);
    expect(errorArg.details).toBeDefined();

    // Zod's flatten() returns { fieldErrors: { field: [string] }, formErrors: [] }
    const details = errorArg.details as any;
    expect(details.fieldErrors).toHaveProperty('id');
  });

  it('should strip unknown fields according to default zod behavior', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    req.params = { id: validUuid, unknownField: 'hacker' };
    const middleware = validateParams(testSchema);

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.params).not.toHaveProperty('unknownField');
  });
});
