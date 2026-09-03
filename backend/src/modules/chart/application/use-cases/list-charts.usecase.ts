import { Chart } from '../../domain/entities/chart.entity.js';
import { IChartRepository } from '../../domain/ports/chart-repository.port.js';

export interface ListChartsCommand {
  requestingUserId: string;
  page?: number;
  pageSize?: number;
  birthProfileId?: string;
  sortBy?: 'calculatedAt';
  order?: 'asc' | 'desc';
}

export interface ListChartsResult {
  items: Chart[];
  total: number;
  page: number;
  pageSize: number;
}

export class ListChartsUseCase {
  constructor(private readonly chartRepository: IChartRepository) {}

  async execute(command: ListChartsCommand): Promise<ListChartsResult> {
    const page = Math.max(1, command.page ?? 1);

    // Clamp pageSize to a maximum of 100
    let pageSize = command.pageSize ?? 20;
    if (pageSize < 1) pageSize = 20;
    if (pageSize > 100) pageSize = 100;

    const sortBy = command.sortBy ?? 'calculatedAt';
    const order = command.order ?? 'desc';

    const { items, total } = await this.chartRepository.listByUserId(command.requestingUserId, {
      page,
      pageSize,
      birthProfileId: command.birthProfileId,
      sortBy,
      order,
    });

    return {
      items,
      total,
      page,
      pageSize,
    };
  }
}
