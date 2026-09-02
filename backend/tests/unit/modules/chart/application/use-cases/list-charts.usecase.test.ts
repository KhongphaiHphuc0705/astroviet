import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ListChartsUseCase,
  ListChartsCommand,
} from '../../../../../../src/modules/chart/application/use-cases/list-charts.usecase.js';
import { Chart } from '../../../../../../src/modules/chart/domain/entities/chart.entity.js';
import {
  IChartRepository,
  ListChartsOptions,
} from '../../../../../../src/modules/chart/domain/ports/chart-repository.port.js';

describe('ListChartsUseCase', () => {
  let useCase: ListChartsUseCase;
  let mockChartRepository: IChartRepository;

  const validUserId = 'user-1';

  beforeEach(() => {
    mockChartRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      listByUserId: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      softDelete: vi.fn(),
    };

    useCase = new ListChartsUseCase(mockChartRepository);
  });

  describe('Pagination & Defaults', () => {
    it('should use default pagination and sorting if not provided', async () => {
      const command: ListChartsCommand = {
        requestingUserId: validUserId,
      };

      await useCase.execute(command);

      expect(mockChartRepository.listByUserId).toHaveBeenCalledWith(validUserId, {
        page: 1,
        pageSize: 20,
        birthProfileId: undefined,
        sortBy: 'calculatedAt',
        order: 'desc',
      });
    });

    it('should pass custom pagination and sorting to repository', async () => {
      const command: ListChartsCommand = {
        requestingUserId: validUserId,
        page: 3,
        pageSize: 15,
        sortBy: 'calculatedAt',
        order: 'asc',
      };

      await useCase.execute(command);

      expect(mockChartRepository.listByUserId).toHaveBeenCalledWith(validUserId, {
        page: 3,
        pageSize: 15,
        birthProfileId: undefined,
        sortBy: 'calculatedAt',
        order: 'asc',
      });
    });

    it('should clamp pageSize to a maximum of 100', async () => {
      const command: ListChartsCommand = {
        requestingUserId: validUserId,
        pageSize: 150,
      };

      await useCase.execute(command);

      expect(mockChartRepository.listByUserId).toHaveBeenCalledWith(
        validUserId,
        expect.objectContaining({
          pageSize: 100,
        }),
      );
    });

    it('should clamp page to a minimum of 1 and pageSize to a minimum of 1', async () => {
      const command: ListChartsCommand = {
        requestingUserId: validUserId,
        page: 0,
        pageSize: -5,
      };

      await useCase.execute(command);

      expect(mockChartRepository.listByUserId).toHaveBeenCalledWith(
        validUserId,
        expect.objectContaining({
          page: 1,
          pageSize: 20, // default if invalid
        }),
      );
    });
  });

  describe('Filtering', () => {
    it('should pass birthProfileId to repository if provided', async () => {
      const command: ListChartsCommand = {
        requestingUserId: validUserId,
        birthProfileId: 'profile-1',
      };

      await useCase.execute(command);

      expect(mockChartRepository.listByUserId).toHaveBeenCalledWith(
        validUserId,
        expect.objectContaining({
          birthProfileId: 'profile-1',
        }),
      );
    });
  });

  describe('Result Mapping & Ownership', () => {
    it('should return exactly what the repository returns along with pagination meta', async () => {
      const dummyCharts = [{ id: '1' } as Chart, { id: '2' } as Chart];
      vi.mocked(mockChartRepository.listByUserId).mockResolvedValue({
        items: dummyCharts,
        total: 2,
      });

      const command: ListChartsCommand = {
        requestingUserId: validUserId,
        page: 2,
        pageSize: 10,
      };

      const result = await useCase.execute(command);

      expect(result).toEqual({
        items: dummyCharts,
        total: 2,
        page: 2,
        pageSize: 10,
      });
    });

    it('should strictly enforce cross-user isolation via repository input', async () => {
      // Create a fake repository implementation for listByUserId
      // that proves only the correct user's charts are returned.
      const allCharts = [
        { id: '1', userId: 'user-1' } as Chart,
        { id: '2', userId: 'user-2' } as Chart,
        { id: '3', userId: 'user-1' } as Chart,
      ];

      vi.mocked(mockChartRepository.listByUserId).mockImplementation(
        async (userId: string, _options: ListChartsOptions) => {
          const filtered = allCharts.filter((c) => c.userId === userId);
          return { items: filtered, total: filtered.length };
        },
      );

      const command: ListChartsCommand = {
        requestingUserId: 'user-2',
      };

      const result = await useCase.execute(command);

      // Verify that NO charts from user-1 leaked into user-2's request
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.userId).toBe('user-2');
      expect(result.total).toBe(1);
    });
  });
});
