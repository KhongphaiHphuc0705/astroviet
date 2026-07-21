import { Request } from 'express';

import { TokenPayload } from '../../modules/identity/domain/ports/token-provider.port.js';
import { AuthenticationError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/error-codes.js';

export const getCurrentUser = (req: Request): TokenPayload => {
  if (!req.user) {
    throw new AuthenticationError(ErrorCode.UNAUTHORIZED, 'No authenticated user in request context');
  }
  return req.user;
};
