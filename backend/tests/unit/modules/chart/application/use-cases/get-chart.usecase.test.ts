import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  GetChartUseCase,
  GetChartCommand,
} from '../../../../../../src/modules/chart/application/use-cases/get-chart.usecase.js';
import { Chart } from '../../../../../../src/modules/chart/domain/entities/chart.entity.js';
import { IChartRepository } from '../../../../../../src/modules/chart/domain/ports/chart-repository.port.js';
import {
  AuthorizationError,
  NotFoundError,
} from '../../../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../../../src/shared/errors/error-codes.js';

describe('GetChartUseCase', () => {
  let useCase: GetChartUseCase;
  let mockChartRepository: IChartRepository;

  const validChartId = 'chart-123';
  const validUserId = 'user-1';

  // Dummy chart with valid owner
  const ownChart = {
    id: validChartId,
    userId: validUserId,
  } as Chart;

  // Dummy chart with different owner
  const otherUserChart = {
    id: validChartId,
    userId: 'user-2',
  } as Chart;

  beforeEach(() => {
    mockChartRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      listByUserId: vi.fn(),
      softDelete: vi.fn(),
    };

    useCase = new GetChartUseCase(mockChartRepository);
  });

  it('should return the chart if it exists and belongs to the requesting user', async () => {
    vi.mocked(mockChartRepository.findById).mockResolvedValue(ownChart);

    const command: GetChartCommand = {
      chartId: validChartId,
      requestingUserId: validUserId,
    };

    const result = await useCase.execute(command);
    expect(result).toBe(ownChart);
    expect(mockChartRepository.findById).toHaveBeenCalledWith(validChartId);
    expect(mockChartRepository.findById).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundError if the chart does not exist', async () => {
    vi.mocked(mockChartRepository.findById).mockResolvedValue(null);

    const command: GetChartCommand = {
      chartId: 'non-existent-chart',
      requestingUserId: validUserId,
    };

    await expect(useCase.execute(command)).rejects.toThrowError(NotFoundError);
    await expect(useCase.execute(command)).rejects.toMatchObject({
      message: 'Chart not found',
    });
  });

  it('should throw AuthorizationError if the chart belongs to a different user', async () => {
    vi.mocked(mockChartRepository.findById).mockResolvedValue(otherUserChart);

    const command: GetChartCommand = {
      chartId: validChartId,
      requestingUserId: validUserId,
    };

    await expect(useCase.execute(command)).rejects.toThrowError(AuthorizationError);
    await expect(useCase.execute(command)).rejects.toMatchObject({
      errorCode: ErrorCode.FORBIDDEN,
      message: 'You do not have access to this chart',
    });
  });

  it('should throw AuthorizationError even if the requesting user is an admin accessing another users chart', async () => {
    vi.mocked(mockChartRepository.findById).mockResolvedValue(otherUserChart);

    // M6 Design: Admin does not bypass ownership checks here
    const command: GetChartCommand = {
      chartId: validChartId,
      requestingUserId: 'admin-user-id',
    };

    await expect(useCase.execute(command)).rejects.toThrowError(AuthorizationError);
    await expect(useCase.execute(command)).rejects.toMatchObject({
      errorCode: ErrorCode.FORBIDDEN,
    });
  });

  it('should propagate errors from the repository', async () => {
    const dbError = new Error('Database connection failed');
    vi.mocked(mockChartRepository.findById).mockRejectedValue(dbError);

    const command: GetChartCommand = {
      chartId: validChartId,
      requestingUserId: validUserId,
    };

    await expect(useCase.execute(command)).rejects.toThrowError(dbError);
  });
});
