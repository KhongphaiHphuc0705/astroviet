import { Request, Response, NextFunction } from 'express';

import { AuthenticationError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/error-codes.js';

export const requireAuth = () => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Authentication required'));
      return;
    }
    next();
  };
};
