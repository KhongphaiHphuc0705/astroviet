import { PrismaClient, Prisma } from '@prisma/client';

import { InfrastructureError } from '../../../../shared/errors/app-error.js';
import { Chart } from '../../domain/entities/chart.entity.js';
import { IChartRepository, ListChartsOptions } from '../../domain/ports/chart-repository.port.js';
import { PrismaChartMapper } from '../mappers/prisma-chart.mapper.js';

export class PrismaChartRepository implements IChartRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(chart: Chart): Promise<void> {
    try {
      const data = PrismaChartMapper.toPersistence(chart);

      // We map directly into Prisma.ChartUncheckedCreateInput with nested creates,
      // so we can issue a single create to handle the atomic nested-write.
      await this.prisma.chart.create({ data });
    } catch (error) {
      throw new InfrastructureError('Failed to save chart', { cause: error });
    }
  }

  async findById(id: string): Promise<Chart | null> {
    try {
      const record = await this.prisma.chart.findUnique({
        where: { id },
        include: {
          planets: true,
          houses: true,
          angles: true,
          aspects: true,
          patterns: {
            include: {
              pattern_planets: true,
            },
          },
        },
      });

      if (!record || record.deleted_at !== null) {
        return null;
      }

      return PrismaChartMapper.toDomain(record);
    } catch (error) {
      throw new InfrastructureError(`Failed to find chart by ID: ${id}`, { cause: error });
    }
  }

  async listByUserId(
    userId: string,
    options: ListChartsOptions,
  ): Promise<{ items: Chart[]; total: number }> {
    try {
      const where: Prisma.ChartWhereInput = {
        user_id: userId,
        deleted_at: null,
      };

      if (options.birthProfileId) {
        where.birth_profile_id = options.birthProfileId;
      }

      const orderBy: Prisma.ChartOrderByWithRelationInput = {
        calculated_at: options.order,
      };

      const skip = (options.page - 1) * options.pageSize;
      const take = options.pageSize;

      const [records, total] = await Promise.all([
        this.prisma.chart.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            planets: true,
            houses: true,
            angles: true,
            aspects: true,
            patterns: {
              include: {
                pattern_planets: true,
              },
            },
          },
        }),
        this.prisma.chart.count({ where }),
      ]);

      return {
        items: records.map((record) => PrismaChartMapper.toDomain(record)),
        total,
      };
    } catch (error) {
      throw new InfrastructureError('Failed to list charts', { cause: error });
    }
  }

  async softDelete(id: string, userId: string): Promise<boolean> {
    try {
      const result = await this.prisma.chart.updateMany({
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
      throw new InfrastructureError(`Failed to soft delete chart: ${id}`, { cause: error });
    }
  }
}
