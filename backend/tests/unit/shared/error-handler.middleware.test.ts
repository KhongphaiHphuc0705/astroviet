import { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthenticationError } from '../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../src/shared/errors/error-codes.js';
import { createErrorHandlerMiddleware } from '../../../src/shared/middlewares/error-handler.middleware.js';

describe('error-handler middleware', () => {
  let mockLogger: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };
  let req: Partial<Request> & { id?: string };
  let res: Partial<Response>;
  let next: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockJson: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };
    req = { id: 'test-request-id', originalUrl: '/test-route' };

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    res = {
      setHeader: vi.fn(),
      status: mockStatus,
    };
    next = vi.fn();
  });

  it('should log as warn for 4xx AppErrors', () => {
    const error = new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Invalid token');
    const middleware = createErrorHandlerMiddleware(mockLogger as any);

    middleware(error, req as Request, res as Response, next);

    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).not.toHaveBeenCalled();

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/problem+json');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 401,
        errorCode: ErrorCode.UNAUTHORIZED,
        requestId: 'test-request-id',
      }),
    );
  });

  it('should log as error for 500 Infrastructure Errors and hide the original message', () => {
    const error = new Error(
      'Database connection failed with sensitive DB credentials: user=root pw=secret',
    );
    const middleware = createErrorHandlerMiddleware(mockLogger as any);

    middleware(error, req as Request, res as Response, next);

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).not.toHaveBeenCalled();

    // It should map generic Errors to 500
    expect(res.status).toHaveBeenCalledWith(500);

    // The response must NOT contain the sensitive original error message
    const responseBody = mockJson.mock.calls[0][0];
    expect(responseBody.detail).toBe('An unexpected error occurred');
    expect(responseBody.detail).not.toContain('sensitive DB credentials');
  });

  it('should include the original error in the log context for 5xx', () => {
    const error = new Error('Unknown crash');
    const middleware = createErrorHandlerMiddleware(mockLogger as any);

    middleware(error, req as Request, res as Response, next);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('[INTERNAL_SERVER_ERROR]'),
      expect.objectContaining({
        err: error,
        requestId: 'test-request-id',
        errorCode: 'INTERNAL_SERVER_ERROR',
      }),
    );
  });
});
