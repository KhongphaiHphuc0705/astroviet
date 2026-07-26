import { Request, Response } from 'express';

import { getCurrentUser } from '../../../../shared/context/current-user.js';
import { CreateBirthProfileUseCase } from '../../application/use-cases/create-birth-profile.usecase.js';
import { DeleteBirthProfileUseCase } from '../../application/use-cases/delete-birth-profile.usecase.js';
import { GetBirthProfileUseCase } from '../../application/use-cases/get-birth-profile.usecase.js';
import { ListBirthProfilesUseCase } from '../../application/use-cases/list-birth-profiles.usecase.js';
import { UpdateBirthProfileUseCase } from '../../application/use-cases/update-birth-profile.usecase.js';
import { BirthProfileResponseMapper } from '../mappers/birth-profile-response.mapper.js';
import { BirthProfileIdParams } from '../schemas/birth-profile-id.schema.js';
import { CreateBirthProfileRequest } from '../schemas/create-birth-profile.schema.js';
import { ListBirthProfilesQueryRequest } from '../schemas/list-birth-profiles-query.schema.js';
import { UpdateBirthProfileRequest } from '../schemas/update-birth-profile.schema.js';

export class BirthProfileController {
  constructor(
    private readonly createBirthProfileUseCase: CreateBirthProfileUseCase,
    private readonly getBirthProfileUseCase: GetBirthProfileUseCase,
    private readonly listBirthProfilesUseCase: ListBirthProfilesUseCase,
    private readonly updateBirthProfileUseCase: UpdateBirthProfileUseCase,
    private readonly deleteBirthProfileUseCase: DeleteBirthProfileUseCase,
  ) {}

  public createHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req);
    const body = req.body as CreateBirthProfileRequest;

    const result = await this.createBirthProfileUseCase.execute({
      userId: user.sub,
      label: body.label,
      fullName: body.fullName || null,
      birthDate: body.birthDate,
      birthTime: body.birthTime || null,
      isBirthTimeKnown: body.isBirthTimeKnown,
      birthLocation: body.birthLocation,
    });

    res.status(201).json(BirthProfileResponseMapper.toResponse(result.profile));
  };

  public getHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req);
    const { id } = req.params as BirthProfileIdParams;

    const result = await this.getBirthProfileUseCase.execute({
      id,
      userId: user.sub,
    });

    res.status(200).json(BirthProfileResponseMapper.toResponse(result.profile));
  };

  public listHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req);
    const query = req.query as unknown as ListBirthProfilesQueryRequest;

    const result = await this.listBirthProfilesUseCase.execute({
      userId: user.sub,
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      order: query.order,
    });

    res.status(200).json({
      items: result.items.map((item) => BirthProfileResponseMapper.toResponse(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  };

  public updateHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req);
    const { id } = req.params as BirthProfileIdParams;
    const body = req.body as UpdateBirthProfileRequest;

    const result = await this.updateBirthProfileUseCase.execute({
      id,
      userId: user.sub,
      label: body.label,
      fullName: body.fullName === undefined ? undefined : body.fullName || null,
      birthDate: body.birthDate,
      birthTime: body.birthTime === undefined ? undefined : body.birthTime || null,
      isBirthTimeKnown: body.isBirthTimeKnown,
      birthLocation: body.birthLocation,
    });

    res.status(200).json(BirthProfileResponseMapper.toResponse(result.profile));
  };

  public deleteHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req);
    const { id } = req.params as BirthProfileIdParams;

    await this.deleteBirthProfileUseCase.execute({
      id,
      userId: user.sub,
    });

    res.status(204).send();
  };
}
