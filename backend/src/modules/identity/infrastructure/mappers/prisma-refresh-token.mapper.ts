import { RefreshToken as PrismaRefreshToken, Prisma } from '@prisma/client';

import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';

export class PrismaRefreshTokenMapper {
  static toDomain(prismaToken: PrismaRefreshToken): RefreshToken {
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

  static toPersistence(token: RefreshToken): Prisma.RefreshTokenUncheckedCreateInput {
    return {
      id: token.id,
      user_id: token.userId,
      token_hash: token.tokenHash,
      issued_at: token.issuedAt,
      expires_at: token.expiresAt,
      revoked_at: token.revokedAt,
      replaced_by_token_id: token.replacedByTokenId,
      created_by_ip: token.createdByIp,
    };
  }
}
