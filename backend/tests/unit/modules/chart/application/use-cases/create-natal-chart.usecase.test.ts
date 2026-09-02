import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetBirthProfileSnapshotUseCase } from '../../../../../../src/modules/birth-profile/index.js';
import {
  CreateNatalChartUseCase,
  CreateNatalChartCommand,
} from '../../../../../../src/modules/chart/application/use-cases/create-natal-chart.usecase.js';
import { ChartBuilder } from '../../../../../../src/modules/chart/domain/engine/chart-builder.js';
import { Chart } from '../../../../../../src/modules/chart/domain/entities/chart.entity.js';
import { ChartCalculationFailed } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import { IChartRepository } from '../../../../../../src/modules/chart/domain/ports/chart-repository.port.js';
import {
  ChartType,
  HouseSystem,
  PlanetName,
} from '../../../../../../src/modules/chart/domain/types/chart.types.js';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from '../../../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../../../src/shared/errors/error-codes.js';

describe('CreateNatalChartUseCase', () => {
  let useCase: CreateNatalChartUseCase;
  let mockGetBirthProfileSnapshotUseCase: GetBirthProfileSnapshotUseCase;
  let mockChartBuilder: ChartBuilder;
  let mockChartRepository: IChartRepository;

  const validBirthData = {
    placeName: 'Hanoi',
    birthDate: new Date('1990-01-01T00:00:00Z'),
    birthTime: { hour: 12, minute: 0, second: 0 },
    isBirthTimeKnown: true,
    latitude: 21.0285,
    longitude: 105.8542,
    timezoneId: 'Asia/Ho_Chi_Minh',
  };

  const validSnapshot = {
    fullName: 'John Doe',
    placeName: 'Hanoi',
    birthDate: new Date('1990-01-01T00:00:00Z'),
    birthTime: { hour: 12, minute: 0, second: 0 },
    isBirthTimeKnown: true,
    latitude: 21.0285,
    longitude: 105.8542,
    timezoneId: 'Asia/Ho_Chi_Minh',
  };

  // Dummy chart to return from builder
  const dummyChart = {} as Chart;

  beforeEach(() => {
    mockGetBirthProfileSnapshotUseCase = {
      execute: vi.fn().mockResolvedValue(validSnapshot),
    } as unknown as GetBirthProfileSnapshotUseCase;

    mockChartBuilder = {
      build: vi.fn().mockResolvedValue(dummyChart),
    } as unknown as ChartBuilder;

    mockChartRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      listByUserId: vi.fn(),
      softDelete: vi.fn(),
    };

    useCase = new CreateNatalChartUseCase(
      mockGetBirthProfileSnapshotUseCase,
      mockChartBuilder,
      mockChartRepository,
    );
  });

  describe('Input validation', () => {
    it('should throw ValidationError if both birthProfileId and birthData are provided', async () => {
      const command: CreateNatalChartCommand = {
        requestingUserId: 'user-1',
        birthProfileId: 'profile-1',
        birthData: validBirthData,
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: false,
      };

      await expect(useCase.execute(command)).rejects.toThrowError(ValidationError);
      await expect(useCase.execute(command)).rejects.toMatchObject({
        errorCode: ErrorCode.EXACTLY_ONE_SOURCE_REQUIRED,
      });
    });

    it('should throw ValidationError if neither birthProfileId nor birthData is provided', async () => {
      const command: CreateNatalChartCommand = {
        requestingUserId: 'user-1',
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: false,
      };

      await expect(useCase.execute(command)).rejects.toThrowError(ValidationError);
      await expect(useCase.execute(command)).rejects.toMatchObject({
        errorCode: ErrorCode.EXACTLY_ONE_SOURCE_REQUIRED,
      });
    });

    it('should succeed with birthProfileId only', async () => {
      const command: CreateNatalChartCommand = {
        requestingUserId: 'user-1',
        birthProfileId: 'profile-1',
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: false,
      };

      const result = await useCase.execute(command);
      expect(result).toBe(dummyChart);
      expect(mockGetBirthProfileSnapshotUseCase.execute).toHaveBeenCalledWith({
        birthProfileId: 'profile-1',
        requestingUserId: 'user-1',
      });
    });

    it('should succeed with birthData inline only', async () => {
      const command: CreateNatalChartCommand = {
        requestingUserId: 'user-1',
        birthData: validBirthData,
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: false,
      };

      const result = await useCase.execute(command);
      expect(result).toBe(dummyChart);
      expect(mockGetBirthProfileSnapshotUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('Authentication & Guest Guards', () => {
    it('should allow Guest to create a chart if save is false (birthData inline)', async () => {
      const command: CreateNatalChartCommand = {
        requestingUserId: null,
        birthData: validBirthData,
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: false,
      };

      await expect(useCase.execute(command)).resolves.toBe(dummyChart);
    });

    it('should throw AuthenticationError if Guest attempts to save a chart', async () => {
      const command: CreateNatalChartCommand = {
        requestingUserId: null,
        birthData: validBirthData,
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: true,
      };

      await expect(useCase.execute(command)).rejects.toThrowError(AuthenticationError);
    });

    it('should throw AuthenticationError if Guest provides birthProfileId', async () => {
      const command: CreateNatalChartCommand = {
        requestingUserId: null,
        birthProfileId: 'profile-1',
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: false, // even if save=false, Guest cannot use birthProfileId
      };

      await expect(useCase.execute(command)).rejects.toThrowError(AuthenticationError);
      expect(mockGetBirthProfileSnapshotUseCase.execute).not.toHaveBeenCalled();
    });

    it('should allow Authenticated user to use save=true', async () => {
      const command: CreateNatalChartCommand = {
        requestingUserId: 'user-1',
        birthProfileId: 'profile-1',
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: true,
      };

      await expect(useCase.execute(command)).resolves.toBe(dummyChart);
      expect(mockChartRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('BirthProfile Fetching', () => {
    it('should propagate NotFoundError if GetBirthProfileSnapshotUseCase throws it', async () => {
      vi.mocked(mockGetBirthProfileSnapshotUseCase.execute).mockRejectedValue(
        new NotFoundError('Not found'),
      );

      const command: CreateNatalChartCommand = {
        requestingUserId: 'user-1',
        birthProfileId: 'profile-1',
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: false,
      };

      await expect(useCase.execute(command)).rejects.toThrowError(NotFoundError);
    });

    it('should propagate AuthorizationError if GetBirthProfileSnapshotUseCase throws it (wrong owner)', async () => {
      vi.mocked(mockGetBirthProfileSnapshotUseCase.execute).mockRejectedValue(
        new AuthorizationError(ErrorCode.FORBIDDEN, 'Forbidden'),
      );

      const command: CreateNatalChartCommand = {
        requestingUserId: 'user-1',
        birthProfileId: 'profile-1',
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: false,
      };

      await expect(useCase.execute(command)).rejects.toThrowError(AuthorizationError);
    });
  });

  describe('ChartBuilder Invocation', () => {
    it('should call ChartBuilder.build with correct input (snapshot mapped)', async () => {
      const command: CreateNatalChartCommand = {
        requestingUserId: 'user-1',
        birthProfileId: 'profile-1',
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: ['Chiron' as PlanetName],
        save: false,
      };

      await useCase.execute(command);

      expect(mockChartBuilder.build).toHaveBeenCalledTimes(1);
      const callArg = vi.mocked(mockChartBuilder.build).mock.calls[0][0];

      expect(callArg.userId).toBe('user-1');
      expect(callArg.birthProfileId).toBe('profile-1');
      expect(callArg.id).toBeDefined();

      const engineInput = callArg.engineInput;
      expect(engineInput.chartOptions.houseSystem).toBe(HouseSystem.Placidus);
      expect(engineInput.chartOptions.includeOptionalPoints).toContain('Chiron');
      expect(engineInput.chartOptions.chartType).toBe(ChartType.Natal);

      expect(engineInput.birthData.fullName).toBe(validSnapshot.fullName);
      expect(engineInput.birthData.placeName).toBe(validSnapshot.placeName);
    });

    it('should call ChartBuilder.build with correct input (inline birthData mapped)', async () => {
      const command: CreateNatalChartCommand = {
        requestingUserId: 'user-1',
        birthData: validBirthData,
        houseSystem: HouseSystem.WholeSign,
        includeOptionalPoints: [],
        save: false,
      };

      await useCase.execute(command);

      expect(mockChartBuilder.build).toHaveBeenCalledTimes(1);
      const callArg = vi.mocked(mockChartBuilder.build).mock.calls[0][0];

      expect(callArg.userId).toBe('user-1');
      expect(callArg.birthProfileId).toBeNull();

      const engineInput = callArg.engineInput;
      expect(engineInput.birthData.fullName).toBeNull();
      expect(engineInput.birthData.placeName).toBe(validBirthData.placeName);
      expect(engineInput.chartOptions.houseSystem).toBe(HouseSystem.WholeSign);
    });

    it('should propagate errors from ChartBuilder.build without wrapping', async () => {
      const calcError = new ChartCalculationFailed('Test error');
      vi.mocked(mockChartBuilder.build).mockRejectedValue(calcError);

      const command: CreateNatalChartCommand = {
        requestingUserId: 'user-1',
        birthData: validBirthData,
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: false,
      };

      await expect(useCase.execute(command)).rejects.toThrowError(ChartCalculationFailed);
    });
  });

  describe('Persistence Behavior', () => {
    it('should not call repository.save when save=false', async () => {
      const command: CreateNatalChartCommand = {
        requestingUserId: 'user-1',
        birthData: validBirthData,
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: false,
      };

      const result = await useCase.execute(command);
      expect(result).toBe(dummyChart);
      expect(mockChartRepository.save).not.toHaveBeenCalled();
    });

    it('should call repository.save exactly once when save=true', async () => {
      const command: CreateNatalChartCommand = {
        requestingUserId: 'user-1',
        birthData: validBirthData,
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: true,
      };

      const result = await useCase.execute(command);
      expect(result).toBe(dummyChart);
      expect(mockChartRepository.save).toHaveBeenCalledTimes(1);
      expect(mockChartRepository.save).toHaveBeenCalledWith(dummyChart);
    });

    it('should propagate repository errors when save=true', async () => {
      vi.mocked(mockChartRepository.save).mockRejectedValue(new Error('DB Error'));

      const command: CreateNatalChartCommand = {
        requestingUserId: 'user-1',
        birthData: validBirthData,
        houseSystem: HouseSystem.Placidus,
        includeOptionalPoints: [],
        save: true,
      };

      await expect(useCase.execute(command)).rejects.toThrowError('DB Error');
    });
  });
});
