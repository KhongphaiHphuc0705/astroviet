import { PrismaClient } from '@prisma/client';

import { UniqueConstraintError, InfrastructureError } from '../../../../shared/errors/app-error.js';
import { User } from '../../domain/entities/user.entity.js';
import { IUserRepository } from '../../domain/ports/user-repository.port.js';
import { PrismaUserMapper } from '../mappers/prisma-user.mapper.js';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(user: User): Promise<void> {
    try {
      await this.prisma.user.create({
        data: PrismaUserMapper.toPersistence(user),
      });
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === 'P2002') {
        throw new UniqueConstraintError('Email already exists', undefined, error);
      }
      throw new InfrastructureError('Failed to create user', undefined, error);
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const prismaUser = await this.prisma.user.findUnique({
        where: { id },
      });
      return prismaUser ? PrismaUserMapper.toDomain(prismaUser) : null;
    } catch (error) {
      throw new InfrastructureError('Failed to find user by id', undefined, error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const prismaUser = await this.prisma.user.findUnique({
        where: { email },
      });
      // The DB schema uses a partial index WHERE deleted_at IS NULL.
      // We should manually check deleted_at if needed, or assume deleted users don't count?
      // Since findUnique on email might return a soft-deleted user if we didn't use Prisma extensions,
      // we filter it manually here just to be safe.
      if (prismaUser && prismaUser.deleted_at !== null) {
        return null;
      }
      return prismaUser ? PrismaUserMapper.toDomain(prismaUser) : null;
    } catch (error) {
      throw new InfrastructureError('Failed to find user by email', undefined, error);
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { 
          email,
          deleted_at: null,
        },
      });
      return count > 0;
    } catch (error) {
      throw new InfrastructureError('Failed to check user existence', undefined, error);
    }
  }

  async update(user: User): Promise<void> {
    try {
      const data = PrismaUserMapper.toPersistence(user);
      
      // Optimistic locking: update where id and current version match
      const result = await this.prisma.user.updateMany({
        where: {
          id: user.id,
          version: user.version,
        },
        data: {
          ...data,
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new InfrastructureError('User not found or version mismatch during update');
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === 'P2002') {
        throw new UniqueConstraintError('Email already exists', undefined, error);
      }
      if (error instanceof InfrastructureError) {
        throw error;
      }
      throw new InfrastructureError('Failed to update user', undefined, error);
    }
  }
}
