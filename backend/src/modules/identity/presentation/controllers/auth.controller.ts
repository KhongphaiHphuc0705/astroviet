import { Request, Response } from 'express';

import {
  RegisterUserUseCase,
  RegisterCommand,
} from '../../application/use-cases/register-user.usecase.js';
import { RegisterResponseMapper } from '../mappers/register-response.mapper.js';
import { RegisterRequest } from '../schemas/register.schema.js';

export class AuthController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  registerHandler = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as RegisterRequest;

    const command: RegisterCommand = {
      email: body.email,
      password: body.password,
      displayName: body.displayName,
    };

    const result = await this.registerUserUseCase.execute(command);
    const response = RegisterResponseMapper.toResponse(result.user);

    res.status(201).json(response);
  };
}
