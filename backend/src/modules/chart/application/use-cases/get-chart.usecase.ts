import { NotFoundError } from '../../../../shared/errors/app-error.js';
import { Chart } from '../../domain/entities/chart.entity.js';
import { IChartRepository } from '../../domain/ports/chart-repository.port.js';
import {
  InterpretationLookupService,
  InterpretationResult,
} from '../services/interpretation-lookup.service.js';
import { assertChartOwnership } from '../shared/assert-chart-ownership.js';

export interface GetChartCommand {
  chartId: string;
  requestingUserId: string;
}

export interface GetChartResult {
  chart: Chart;
  interpretation: InterpretationResult;
}

export class GetChartUseCase {
  constructor(
    private readonly chartRepository: IChartRepository,
    private readonly interpretationLookupService: InterpretationLookupService,
  ) {}

  async execute(command: GetChartCommand): Promise<GetChartResult> {
    const chart = await this.chartRepository.findById(command.chartId);
    if (!chart) {
      throw new NotFoundError('Chart not found');
    }

    assertChartOwnership(chart, command.requestingUserId);

    const interpretation = await this.interpretationLookupService.lookup(chart);

    return { chart, interpretation };
  }
}
