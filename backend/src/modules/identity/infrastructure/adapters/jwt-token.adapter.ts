import crypto from 'node:crypto';

import { sign, verify, TokenExpiredError } from 'jsonwebtoken';
import { z } from 'zod';


import { AuthenticationError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';
import { ITokenProvider, TokenPayload } from '../../domain/ports/token-provider.port.js';

const TokenPayloadSchema = z.object({
  sub: z.string(),
  role: z.enum(['user', 'admin']),
});

export interface JwtTokenAdapterConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiryMinutes: number;
  refreshExpiryDays: number;
}

export class JwtTokenAdapter implements ITokenProvider {
  constructor(private readonly config: JwtTokenAdapterConfig) {}

  generateAccessToken(payload: TokenPayload): string {
    return sign(payload, this.config.accessSecret, {
      expiresIn: `${this.config.accessExpiryMinutes}m`,
      algorithm: 'HS256',
    });
  }

  generateRefreshToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.config.refreshExpiryDays);

    return { rawToken, tokenHash, expiresAt };
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = verify(token, this.config.accessSecret, {
        algorithms: ['HS256'],
      });

      const parsed = TokenPayloadSchema.safeParse(decoded);
      if (!parsed.success) {
        throw new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Invalid token payload structure');
      }

      return parsed.data;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new AuthenticationError(ErrorCode.TOKEN_EXPIRED, 'Access token expired');
      }
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Invalid access token');
    }
  }
}
