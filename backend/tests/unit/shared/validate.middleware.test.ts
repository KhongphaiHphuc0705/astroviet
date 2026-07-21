import { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

import { BadRequestError } from '../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../src/shared/errors/error-codes.js';
import { validate } from '../../../src/shared/middlewares/validate.middleware.js';

describe('validate middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: ReturnType<typeof vi.fn>;

  const testSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  beforeEach(() => {
    req = { body: {} };
    res = {};
    next = vi.fn();
  });

  it('should call next() without error if payload is valid', () => {
    req.body = { email: 'test@example.com', password: 'ValidPassword123' };
    const middleware = validate(testSchema);

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({ email: 'test@example.com', password: 'ValidPassword123' });
  });

  it('should call next(BadRequestError) with multiple Zod errors if multiple fields are invalid', () => {
    req.body = { email: 'invalid-email', password: 'short' };
    const middleware = validate(testSchema);

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    const errorArg = next.mock.calls[0][0] as BadRequestError;

    expect(errorArg.errorCode).toBe(ErrorCode.MALFORMED_REQUEST);
    expect(errorArg.details).toBeDefined();

    // Zod's flatten() returns { fieldErrors: { field: [string] }, formErrors: [] }
    const details = errorArg.details as any;
    expect(details.fieldErrors).toHaveProperty('email');
    expect(details.fieldErrors).toHaveProperty('password');
  });

  it('should strip unknown fields according to default zod behavior', () => {
    req.body = { email: 'test@example.com', password: 'ValidPassword123', unknownField: 'hacker' };
    const middleware = validate(testSchema);

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).not.toHaveProperty('unknownField');
  });
});
