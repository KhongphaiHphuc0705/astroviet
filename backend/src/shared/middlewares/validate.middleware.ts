import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

import { BadRequestError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/error-codes.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errorDetails = result.error.flatten();
      return next(
        new BadRequestError(ErrorCode.MALFORMED_REQUEST, 'Invalid request body', errorDetails),
      );
    }

    req.body = result.data;
    next();
  };
};
