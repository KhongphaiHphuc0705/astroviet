import { NotFoundError } from '../../../../shared/errors/app-error.js';
import { Chart } from '../../domain/entities/chart.entity.js';
import { IChartRepository } from '../../domain/ports/chart-repository.port.js';
import { assertChartOwnership } from '../shared/assert-chart-ownership.js';

export interface GetChartCommand {
  chartId: string;
  requestingUserId: string;
}

export class GetChartUseCase {
  constructor(private readonly chartRepository: IChartRepository) {}

  async execute(command: GetChartCommand): Promise<Chart> {
    const chart = await this.chartRepository.findById(command.chartId);
    if (!chart) {
      throw new NotFoundError('Chart not found');
    }

    assertChartOwnership(chart, command.requestingUserId);
    return chart;
  }
}
