import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

import { BadRequestError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/error-codes.js';

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errorDetails = result.error.flatten();
      return next(
        new BadRequestError(ErrorCode.MALFORMED_REQUEST, 'Invalid request query', errorDetails),
      );
    }

    req.query = result.data;
    next();
  };
};
