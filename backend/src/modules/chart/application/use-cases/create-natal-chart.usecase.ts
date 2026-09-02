import { randomUUID } from 'node:crypto';

import { AuthenticationError, ValidationError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';
import { GetBirthProfileSnapshotUseCase } from '../../../birth-profile/index.js';
import { ChartBuilder } from '../../domain/engine/chart-builder.js';
import { Chart } from '../../domain/entities/chart.entity.js';
import { IChartRepository } from '../../domain/ports/chart-repository.port.js';
import { HouseSystem, PlanetName, ChartType } from '../../domain/types/chart.types.js';
import { EngineInput, EngineInputBirthData } from '../../domain/value-objects/engine-input.vo.js';

export interface CreateNatalChartCommand {
  requestingUserId: string | null; // null = Guest
  birthProfileId?: string; // XOR with birthData
  birthData?: {
    placeName: string;
    birthDate: Date;
    birthTime: { hour: number; minute: number; second: number } | null;
    isBirthTimeKnown: boolean;
    latitude: number;
    longitude: number;
    timezoneId: string;
  };
  houseSystem: HouseSystem;
  includeOptionalPoints: PlanetName[];
  save: boolean;
}

export class CreateNatalChartUseCase {
  constructor(
    private readonly getBirthProfileSnapshotUseCase: GetBirthProfileSnapshotUseCase,
    private readonly chartBuilder: ChartBuilder,
    private readonly chartRepository: IChartRepository,
  ) {}

  async execute(command: CreateNatalChartCommand): Promise<Chart> {
    // 1. Input-mode invariant (birthProfileId XOR birthData)
    const hasProfileId = !!command.birthProfileId;
    const hasBirthData = !!command.birthData;

    if (hasProfileId === hasBirthData) {
      throw new ValidationError(
        ErrorCode.EXACTLY_ONE_SOURCE_REQUIRED,
        'Exactly one of birthProfileId or birthData must be provided',
      );
    }

    // 2. Guest save=true guard
    if (command.requestingUserId === null && command.save === true) {
      throw new AuthenticationError(
        ErrorCode.UNAUTHORIZED,
        'Guests are not allowed to save charts',
      );
    }

    // 3. Resolve birth data
    let engineInputBirthData: EngineInputBirthData;

    if (command.birthProfileId) {
      const snapshot = await this.getBirthProfileSnapshotUseCase.execute({
        birthProfileId: command.birthProfileId,
        // Using ?? '' here to pass type check.
        // If requestingUserId is null, getBirthProfileSnapshotUseCase will reject inside with AuthorizationError.
        requestingUserId: command.requestingUserId ?? '',
      });

      engineInputBirthData = {
        fullName: snapshot.fullName,
        placeName: snapshot.placeName,
        birthDate: snapshot.birthDate,
        birthTime: snapshot.birthTime,
        isBirthTimeKnown: snapshot.isBirthTimeKnown,
        latitude: snapshot.latitude,
        longitude: snapshot.longitude,
        timezoneId: snapshot.timezoneId,
      };
    } else {
      // Must be command.birthData
      const birthData = command.birthData!;
      engineInputBirthData = {
        fullName: null, // As specified in the implementation plan
        placeName: birthData.placeName,
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        isBirthTimeKnown: birthData.isBirthTimeKnown,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezoneId: birthData.timezoneId,
      };
    }

    // 4. Build EngineInput
    const engineInput = EngineInput.create(engineInputBirthData, {
      houseSystem: command.houseSystem,
      includeOptionalPoints: command.includeOptionalPoints,
      chartType: ChartType.Natal,
    });

    // 5. Invoke ChartBuilder
    const chart = await this.chartBuilder.build({
      id: randomUUID(),
      userId: command.requestingUserId,
      birthProfileId: command.birthProfileId ?? null,
      engineInput,
    });

    // 6. Persistence branch
    if (command.save) {
      await this.chartRepository.save(chart);
    }

    return chart;
  }
}
