import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { env } from '../../../src/config/env.config.js';
import { JwtTokenAdapter } from '../../../src/modules/identity/infrastructure/adapters/jwt-token.adapter.js';
import { AuthenticationError } from '../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../src/shared/errors/error-codes.js';

describe('JwtTokenAdapter', () => {
  const adapter = new JwtTokenAdapter();
  const validPayload = { sub: 'user-123', role: 'user' as const };

  describe('generateAccessToken()', () => {
    it('should generate a decodeable token with correct sub and role', () => {
      const token = adapter.generateAccessToken(validPayload);
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      
      expect(decoded?.sub).toBe('user-123');
      expect(decoded?.role).toBe('user');
      expect(decoded?.exp).toBeDefined();
      expect(decoded?.iat).toBeDefined();
    });
  });

  describe('verifyAccessToken()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return payload for a valid token', () => {
      const token = adapter.generateAccessToken(validPayload);
      const payload = adapter.verifyAccessToken(token);
      
      expect(payload.sub).toBe(validPayload.sub);
      expect(payload.role).toBe(validPayload.role);
    });

    it('should throw AuthenticationError (TOKEN_EXPIRED) if token is expired', () => {
      const token = adapter.generateAccessToken(validPayload);
      
      // Fast forward past expiration
      vi.advanceTimersByTime((env.JWT_ACCESS_EXPIRY_MINUTES! + 1) * 60 * 1000);
      
      try {
        adapter.verifyAccessToken(token);
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AuthenticationError);
        expect(err.errorCode).toBe(ErrorCode.TOKEN_EXPIRED);
      }
    });

    it('should throw AuthenticationError (UNAUTHORIZED) for invalid signature', () => {
      const token = jwt.sign(validPayload, 'wrong-secret', { algorithm: 'HS256' });
      
      try {
        adapter.verifyAccessToken(token);
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AuthenticationError);
        expect(err.errorCode).toBe(ErrorCode.UNAUTHORIZED);
      }
    });

    it('should throw AuthenticationError (UNAUTHORIZED) for malformed token', () => {
      try {
        adapter.verifyAccessToken('malformed.token.string');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AuthenticationError);
        expect(err.errorCode).toBe(ErrorCode.UNAUTHORIZED);
      }
    });

    it('should throw AuthenticationError (UNAUTHORIZED) if payload schema is invalid', () => {
      const invalidPayloadToken = jwt.sign({ sub: 'user-123', role: 'invalid_role' }, env.JWT_ACCESS_SECRET, { algorithm: 'HS256' });
      
      try {
        adapter.verifyAccessToken(invalidPayloadToken);
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AuthenticationError);
        expect(err.errorCode).toBe(ErrorCode.UNAUTHORIZED);
        expect(err.message).toContain('Invalid token payload structure');
      }
    });
  });

  describe('generateRefreshToken()', () => {
    it('should return rawToken, tokenHash, and expiresAt', () => {
      const result = adapter.generateRefreshToken();
      
      expect(result.rawToken).toBeDefined();
      expect(result.tokenHash).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
      
      expect(result.rawToken).not.toBe(result.tokenHash);
    });

    it('should generate a tokenHash that is the SHA-256 of rawToken', () => {
      const result = adapter.generateRefreshToken();
      
      const expectedHash = crypto.createHash('sha256').update(result.rawToken).digest('hex');
      expect(result.tokenHash).toBe(expectedHash);
    });

    it('should generate different tokens on subsequent calls', () => {
      const result1 = adapter.generateRefreshToken();
      const result2 = adapter.generateRefreshToken();
      
      expect(result1.rawToken).not.toBe(result2.rawToken);
    });
  });
});
