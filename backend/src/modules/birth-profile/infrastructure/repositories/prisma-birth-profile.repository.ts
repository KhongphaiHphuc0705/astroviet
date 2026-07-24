import { PrismaClient, Prisma } from '@prisma/client';

import { InfrastructureError, OptimisticLockError } from '../../../../shared/errors/app-error.js';
import { BirthProfile } from '../../domain/entities/birth-profile.entity.js';
import {
  IBirthProfileRepository,
  ListOptions,
} from '../../domain/ports/birth-profile-repository.port.js';
import { PrismaBirthProfileMapper } from '../mappers/prisma-birth-profile.mapper.js';

export class PrismaBirthProfileRepository implements IBirthProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(profile: BirthProfile): Promise<void> {
    try {
      const data = PrismaBirthProfileMapper.toPersistence(profile);
      await this.prisma.birthProfile.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          // Foreign key constraint failed
          throw new InfrastructureError('Foreign key constraint failed: User does not exist.', {
            cause: error,
          });
        }
      }
      throw new InfrastructureError('Failed to create birth profile', { cause: error });
    }
  }

  async findById(id: string): Promise<BirthProfile | null> {
    try {
      const record = await this.prisma.birthProfile.findUnique({
        where: { id },
      });

      if (!record || record.deleted_at !== null) {
        return null;
      }

      return PrismaBirthProfileMapper.toDomain(record);
    } catch (error) {
      throw new InfrastructureError('Failed to find birth profile by id', { cause: error });
    }
  }

  async listByUserId(
    userId: string,
    options: ListOptions,
  ): Promise<{ items: BirthProfile[]; total: number }> {
    try {
      const skip = (options.page - 1) * options.pageSize;
      const take = options.pageSize;
      const orderBy =
        options.sortBy === 'createdAt'
          ? { created_at: options.order }
          : { full_name: options.order };

      const where = {
        user_id: userId,
        deleted_at: null,
      };

      const [records, total] = await Promise.all([
        this.prisma.birthProfile.findMany({
          where,
          orderBy,
          skip,
          take,
        }),
        this.prisma.birthProfile.count({ where }),
      ]);

      const items = records.map(PrismaBirthProfileMapper.toDomain);
      return { items, total };
    } catch (error) {
      throw new InfrastructureError('Failed to list birth profiles by user id', { cause: error });
    }
  }

  async update(profile: BirthProfile): Promise<void> {
    try {
      const data = {
        ...PrismaBirthProfileMapper.toUpdatePersistence(profile),
        version: { increment: 1 },
      };

      const result = await this.prisma.birthProfile.updateMany({
        where: {
          id: profile.id,
          version: profile.version,
          deleted_at: null, // As per OQ-F: Do not update if soft deleted
        },
        data,
      });

      if (result.count === 0) {
        throw new OptimisticLockError('Optimistic lock conflict or profile not found/deleted');
      }
    } catch (error) {
      if (error instanceof OptimisticLockError) {
        throw error;
      }
      // If constraint violation happens
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2010') {
        throw new InfrastructureError('Database constraint violation', { cause: error });
      }
      throw new InfrastructureError('Failed to update birth profile', { cause: error });
    }
  }

  async softDelete(id: string, userId: string): Promise<boolean> {
    try {
      const result = await this.prisma.birthProfile.updateMany({
        where: {
          id,
          user_id: userId,
          deleted_at: null,
        },
        data: {
          deleted_at: new Date(),
        },
      });

      return result.count > 0;
    } catch (error) {
      throw new InfrastructureError('Failed to soft delete birth profile', { cause: error });
    }
  }
}
