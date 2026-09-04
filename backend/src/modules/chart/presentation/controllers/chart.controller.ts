import { Request, Response } from 'express';

import { getCurrentUser } from '../../../../shared/context/current-user.js';
import {
  CreateNatalChartCommand,
  CreateNatalChartUseCase,
} from '../../application/use-cases/create-natal-chart.usecase.js';
import { DeleteChartUseCase } from '../../application/use-cases/delete-chart.usecase.js';
import { GetChartUseCase } from '../../application/use-cases/get-chart.usecase.js';
import { ListChartsUseCase } from '../../application/use-cases/list-charts.usecase.js';
import { HouseSystem, PlanetName } from '../../domain/types/chart.types.js';
import { ChartResponseMapper } from '../mappers/chart-response.mapper.js';
import { ChartSummaryResponseMapper } from '../mappers/chart-summary-response.mapper.js';
import { ChartIdParams } from '../schemas/chart-id.schema.js';
import { CreateNatalChartQuery } from '../schemas/create-natal-chart-query.schema.js';
import { CreateNatalChartRequest } from '../schemas/create-natal-chart.schema.js';
import { ListChartsQueryRequest } from '../schemas/list-charts-query.schema.js';

export class ChartController {
  constructor(
    private readonly createNatalChartUseCase: CreateNatalChartUseCase,
    private readonly getChartUseCase: GetChartUseCase,
    private readonly listChartsUseCase: ListChartsUseCase,
    private readonly deleteChartUseCase: DeleteChartUseCase,
  ) {}

  public createHandler = async (req: Request, res: Response): Promise<void> => {
    const requestingUserId = req.user?.sub ?? null; // KHÔNG dùng getCurrentUser() — Guest hợp lệ
    const body = req.body as CreateNatalChartRequest;
    const { save } = req.query as unknown as CreateNatalChartQuery;

    const command: CreateNatalChartCommand = {
      requestingUserId,
      birthProfileId: body.birthProfileId,
      birthData: body.birthData
        ? { ...body.birthData, birthDate: new Date(body.birthData.birthDate) }
        : undefined,
      houseSystem: body.houseSystem as HouseSystem,
      includeOptionalPoints: body.includeOptionalPoints as PlanetName[],
      save,
    };

    const chart = await this.createNatalChartUseCase.execute(command);

    res.status(save ? 201 : 200).json(ChartResponseMapper.toResponse(chart));
  };

  public getHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req); // bắt buộc auth — route đã áp requireAuth()
    const { id } = req.params as unknown as ChartIdParams;
    const chart = await this.getChartUseCase.execute({ chartId: id, requestingUserId: user.sub });
    res.status(200).json(ChartResponseMapper.toResponse(chart));
  };

  public listHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req);
    const query = req.query as unknown as ListChartsQueryRequest;
    const result = await this.listChartsUseCase.execute({
      requestingUserId: user.sub,
      page: query.page,
      pageSize: query.pageSize,
      birthProfileId: query.birthProfileId,
      sortBy: query.sortBy,
      order: query.order,
    });
    res.status(200).json({
      items: result.items.map((chart) => ChartSummaryResponseMapper.toResponse(chart)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  };

  public deleteHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req);
    const { id } = req.params as unknown as ChartIdParams;
    await this.deleteChartUseCase.execute({ chartId: id, requestingUserId: user.sub });
    res.status(204).send();
  };
}
