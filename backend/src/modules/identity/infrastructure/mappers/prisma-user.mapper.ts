import { User as PrismaUser, Prisma } from '@prisma/client';

import { InfrastructureError } from '../../../../shared/errors/app-error.js';
import { User, Role } from '../../domain/entities/user.entity.js';

export class PrismaUserMapper {
  static toDomain(prismaUser: PrismaUser): User {
    if (prismaUser.role !== 'user' && prismaUser.role !== 'admin') {
      throw new InfrastructureError(`Invalid role in database: ${prismaUser.role}`);
    }

    return {
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: prismaUser.password_hash,
      displayName: prismaUser.display_name,
      role: prismaUser.role as Role,
      emailVerifiedAt: prismaUser.email_verified_at,
      createdAt: prismaUser.created_at,
      updatedAt: prismaUser.updated_at,
      deletedAt: prismaUser.deleted_at,
      version: prismaUser.version,
    };
  }

  static toPersistence(user: User): Prisma.UserCreateInput {
    return {
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
  }
}
