import { NotFoundError } from '../../../../shared/errors/app-error.js';
import { IChartRepository } from '../../domain/ports/chart-repository.port.js';
import { assertChartOwnership } from '../shared/assert-chart-ownership.js';

export interface DeleteChartCommand {
  chartId: string;
  requestingUserId: string;
}

export class DeleteChartUseCase {
  constructor(private readonly chartRepository: IChartRepository) {}

  async execute(command: DeleteChartCommand): Promise<void> {
    const chart = await this.chartRepository.findById(command.chartId);
    if (!chart) {
      throw new NotFoundError('Chart not found');
    }

    assertChartOwnership(chart, command.requestingUserId);

    const deleted = await this.chartRepository.softDelete(chart.id, command.requestingUserId);
    if (!deleted) {
      throw new NotFoundError('Chart not found');
    }
  }
}
