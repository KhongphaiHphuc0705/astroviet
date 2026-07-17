import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '../../../../config/env.config.js';
import { AuthenticationError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';
import { ITokenProvider, TokenPayload } from '../../domain/ports/token-provider.port.js';

const TokenPayloadSchema = z.object({
  sub: z.string(),
  role: z.enum(['user', 'admin']),
});

export class JwtTokenAdapter implements ITokenProvider {
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: `${env.JWT_ACCESS_EXPIRY_MINUTES}m`,
      algorithm: 'HS256',
    });
  }

  generateRefreshToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (env.JWT_REFRESH_EXPIRY_DAYS ?? 30));

    return { rawToken, tokenHash, expiresAt };
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        algorithms: ['HS256'],
      });

      const parsed = TokenPayloadSchema.safeParse(decoded);
      if (!parsed.success) {
        throw new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Invalid token payload structure');
      }

      return parsed.data;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError(ErrorCode.TOKEN_EXPIRED, 'Access token expired');
      }
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Invalid access token');
    }
  }
}
