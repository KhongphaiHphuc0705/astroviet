import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DeleteChartUseCase,
  DeleteChartCommand,
} from '../../../../../../src/modules/chart/application/use-cases/delete-chart.usecase.js';
import { Chart } from '../../../../../../src/modules/chart/domain/entities/chart.entity.js';
import { IChartRepository } from '../../../../../../src/modules/chart/domain/ports/chart-repository.port.js';
import {
  AuthorizationError,
  NotFoundError,
} from '../../../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../../../src/shared/errors/error-codes.js';

describe('DeleteChartUseCase', () => {
  let useCase: DeleteChartUseCase;
  let mockChartRepository: IChartRepository;

  const validChartId = 'chart-123';
  const validUserId = 'user-1';

  const ownChart = {
    id: validChartId,
    userId: validUserId,
  } as Chart;

  const otherUserChart = {
    id: validChartId,
    userId: 'user-2',
  } as Chart;

  beforeEach(() => {
    mockChartRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      listByUserId: vi.fn(),
      softDelete: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new DeleteChartUseCase(mockChartRepository);
  });

  it('should successfully softDelete the chart if it exists and belongs to the requesting user', async () => {
    vi.mocked(mockChartRepository.findById).mockResolvedValue(ownChart);

    const command: DeleteChartCommand = {
      chartId: validChartId,
      requestingUserId: validUserId,
    };

    await expect(useCase.execute(command)).resolves.toBeUndefined();
    expect(mockChartRepository.findById).toHaveBeenCalledWith(validChartId);
    expect(mockChartRepository.softDelete).toHaveBeenCalledWith(validChartId, validUserId);
    expect(mockChartRepository.softDelete).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundError if the chart does not exist', async () => {
    vi.mocked(mockChartRepository.findById).mockResolvedValue(null);

    const command: DeleteChartCommand = {
      chartId: 'non-existent-chart',
      requestingUserId: validUserId,
    };

    await expect(useCase.execute(command)).rejects.toThrowError(NotFoundError);
    await expect(useCase.execute(command)).rejects.toMatchObject({
      message: 'Chart not found',
    });
    expect(mockChartRepository.softDelete).not.toHaveBeenCalled();
  });

  it('should throw AuthorizationError if the chart belongs to a different user', async () => {
    vi.mocked(mockChartRepository.findById).mockResolvedValue(otherUserChart);

    const command: DeleteChartCommand = {
      chartId: validChartId,
      requestingUserId: validUserId,
    };

    await expect(useCase.execute(command)).rejects.toThrowError(AuthorizationError);
    await expect(useCase.execute(command)).rejects.toMatchObject({
      errorCode: ErrorCode.FORBIDDEN,
      message: 'You do not have access to this chart',
    });
    expect(mockChartRepository.softDelete).not.toHaveBeenCalled();
  });

  it('should propagate errors from the repository findById', async () => {
    const dbError = new Error('Database connection failed');
    vi.mocked(mockChartRepository.findById).mockRejectedValue(dbError);

    const command: DeleteChartCommand = {
      chartId: validChartId,
      requestingUserId: validUserId,
    };

    await expect(useCase.execute(command)).rejects.toThrowError(dbError);
    expect(mockChartRepository.softDelete).not.toHaveBeenCalled();
  });

  it('should propagate errors from the repository softDelete', async () => {
    vi.mocked(mockChartRepository.findById).mockResolvedValue(ownChart);
    const dbError = new Error('Database connection failed on delete');
    vi.mocked(mockChartRepository.softDelete).mockRejectedValue(dbError);

    const command: DeleteChartCommand = {
      chartId: validChartId,
      requestingUserId: validUserId,
    };

    await expect(useCase.execute(command)).rejects.toThrowError(dbError);
  });
});
