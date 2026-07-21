import { Request, Response, NextFunction } from 'express';

import { ITokenProvider } from '../../modules/identity/domain/ports/token-provider.port.js';

export const authMiddleware = (tokenProvider: ITokenProvider) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      next();
      return;
    }

    try {
      const payload = tokenProvider.verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (error) {
      // Fail closed if token is present but invalid (expired/malformed)
      next(error);
    }
  };
};
