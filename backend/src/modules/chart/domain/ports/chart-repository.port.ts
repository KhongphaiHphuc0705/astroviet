import { Chart } from '../entities/chart.entity.js';

export interface ListChartsOptions {
  page: number;
  pageSize: number;
  birthProfileId?: string;
  sortBy: 'calculatedAt';
  order: 'asc' | 'desc';
}

export interface IChartRepository {
  save(chart: Chart): Promise<void>;
  findById(id: string): Promise<Chart | null>;
  listByUserId(
    userId: string,
    options: ListChartsOptions,
  ): Promise<{ items: Chart[]; total: number }>;
  softDelete(id: string, userId: string): Promise<boolean>;
}
