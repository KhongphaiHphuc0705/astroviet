import { PrismaClient } from '@prisma/client';

import { User, RefreshToken } from '../../src/modules/identity/domain/entities';

// Using random UUIDs to simulate database values
const generateUuid = () => crypto.randomUUID();

export class PrismaTestFactory {
  constructor(private prisma: PrismaClient) {}

  async createUser(overrides?: Partial<User>): Promise<User> {
    const defaultUser = {
      id: generateUuid(),
      email: `test-${Date.now()}@example.com`,
      password_hash: 'hashed-password-123',
      display_name: 'Test User',
      role: 'user',
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      version: 1,
    };

    const data = {
      ...defaultUser,
      ...this.mapDomainToPersistence(overrides),
    };

    const prismaUser = await this.prisma.user.create({ data });

    // We map manually here to avoid depending heavily on production mappers in test factories,
    // or we can import the production mapper. To keep it simple, we return what was inserted.
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: prismaUser.password_hash,
      displayName: prismaUser.display_name,
      role: prismaUser.role as any,
      emailVerifiedAt: prismaUser.email_verified_at,
      createdAt: prismaUser.created_at,
      updatedAt: prismaUser.updated_at,
      deletedAt: prismaUser.deleted_at,
      version: prismaUser.version,
    };
  }

  async createRefreshToken(
    userId: string,
    overrides?: Partial<RefreshToken>,
  ): Promise<RefreshToken> {
    const defaultToken = {
      id: generateUuid(),
      user_id: userId,
      token_hash: `token-hash-${Date.now()}`,
      issued_at: new Date(),
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      revoked_at: null,
      replaced_by_token_id: null,
      created_by_ip: '127.0.0.1',
    };

    const data = {
      ...defaultToken,
      ...this.mapTokenDomainToPersistence(overrides),
    };

    const prismaToken = await this.prisma.refreshToken.create({ data });

    return {
      id: prismaToken.id,
      userId: prismaToken.user_id,
      tokenHash: prismaToken.token_hash,
      issuedAt: prismaToken.issued_at,
      expiresAt: prismaToken.expires_at,
      revokedAt: prismaToken.revoked_at,
      replacedByTokenId: prismaToken.replaced_by_token_id,
      createdByIp: prismaToken.created_by_ip,
    };
  }

  private mapDomainToPersistence(user?: Partial<User>): any {
    if (!user) return {};
    const mapped: any = {
      id: user.id,
      email: user.email,
      password_hash: user.passwordHash,
      display_name: user.displayName,
      role: user.role,
      email_verified_at: user.emailVerifiedAt,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      deleted_at: user.deletedAt,
      version: user.version,
    };
    // Strip undefined keys to prevent overwriting defaults
    return Object.fromEntries(Object.entries(mapped).filter(([_, v]) => v !== undefined));
  }

  private mapTokenDomainToPersistence(token?: Partial<RefreshToken>): any {
    if (!token) return {};
    const mapped: any = {
      id: token.id,
      user_id: token.userId,
      token_hash: token.tokenHash,
      issued_at: token.issuedAt,
      expires_at: token.expiresAt,
      revoked_at: token.revokedAt,
      replaced_by_token_id: token.replacedByTokenId,
      created_by_ip: token.createdByIp,
    };
    // Strip undefined keys
    return Object.fromEntries(Object.entries(mapped).filter(([_, v]) => v !== undefined));
  }
}
