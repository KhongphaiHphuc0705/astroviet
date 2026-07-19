import { RefreshToken } from '../entities/refresh-token.entity.js';

export interface IRefreshTokenRepository {
  create(token: RefreshToken): Promise<void>;
  findByTokenHash(hash: string): Promise<RefreshToken | null>;
  rotate(oldTokenHash: string, newToken: RefreshToken): Promise<RefreshToken | null>;
  revoke(hash: string, revokedAt: Date): Promise<boolean>;
  revokeAllByUser(userId: string): Promise<void>;
  deleteExpired(before: Date): Promise<number>;
}
