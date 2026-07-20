import { Request, Response, NextFunction } from 'express';

import { ITokenProvider } from '../../modules/identity/domain/ports/token-provider.port.js';
import { AuthenticationError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/error-codes.js';

export const authenticate = (tokenProvider: ITokenProvider, required: boolean = true) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (required) {
        next(
          new AuthenticationError(
            ErrorCode.UNAUTHORIZED,
            'Missing or invalid Authorization header',
          ),
        );
      } else {
        next();
      }
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      if (required) {
        next(
          new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Invalid Authorization header format'),
        );
      } else {
        next();
      }
      return;
    }

    try {
      const payload = tokenProvider.verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (error) {
      if (required) {
        next(error);
      } else {
        next();
      }
    }
  };
};
