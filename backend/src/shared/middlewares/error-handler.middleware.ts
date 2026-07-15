import { Request, Response, NextFunction } from 'express';

import { mapErrorToProblemDetails } from '../http/index.js';
import { ILogger } from '../logger/logger.interface.js';

/**
 * Creates the global error handler middleware.
 * Needs the logger injected so it can log 5xx errors appropriately.
 */
export const createErrorHandlerMiddleware = (logger: ILogger) => {
  return (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    // We already have req.id populated by request-id.middleware
    const requestId = req.id as string;
    const context = {
      instance: req.originalUrl,
      requestId,
    };

    const problemDetails = mapErrorToProblemDetails(err, context);

    // Logging logic as per decision:
    // "Chỉ nên logger.error khi error code là 5xx, không log 400, 401, 403, 404, 422 ở mức error. Thay vào đó có thể debug hoặc warn"
    const logCtx = { err, requestId: req.id, errorCode: problemDetails.errorCode };

    if (problemDetails.status >= 500) {
      logger.error(
        `[${problemDetails.errorCode}] ${problemDetails.title}: ${problemDetails.detail}`,
        logCtx,
      );
    } else {
      logger.warn(
        `[${problemDetails.errorCode}] ${problemDetails.title}: ${problemDetails.detail}`,
        logCtx,
      );
    }

    // Set standard Content-Type for Problem Details
    res.setHeader('Content-Type', 'application/problem+json');
    res.status(problemDetails.status).json(problemDetails);
  };
};
