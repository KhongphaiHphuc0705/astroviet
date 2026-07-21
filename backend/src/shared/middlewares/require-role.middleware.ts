import { Request, Response, NextFunction } from 'express';

import { AuthenticationError, AuthorizationError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/error-codes.js';

export const requireRole = (...allowedRoles: Array<'user' | 'admin'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Not authenticated'));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(new AuthorizationError(ErrorCode.FORBIDDEN, 'Insufficient role'));
      return;
    }
    next();
  };
};
