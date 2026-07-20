import { Request, Response } from 'express';

import { AppConfig } from '../../../../config/env.config.js';
import {
  clearRefreshCookie,
  setRefreshCookie,
} from '../../../../shared/cookies/refresh-cookie.util.js';
import { BadRequestError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';
import { LoginCommand, LoginUserUseCase } from '../../application/use-cases/login-user.usecase.js';
import {
  LogoutCommand,
  LogoutUserUseCase,
} from '../../application/use-cases/logout-user.usecase.js';
import {
  RefreshCommand,
  RefreshTokenUseCase,
} from '../../application/use-cases/refresh-token.usecase.js';
import {
  RegisterUserUseCase,
  RegisterCommand,
} from '../../application/use-cases/register-user.usecase.js';
import { AuthResponseMapper } from '../mappers/auth-response.mapper.js';
import { RegisterResponseMapper } from '../mappers/register-response.mapper.js';
import { LoginRequest } from '../schemas/login.schema.js';
import { RefreshRequest } from '../schemas/refresh.schema.js';
import { RegisterRequest } from '../schemas/register.schema.js';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase,
    private readonly appConfig: AppConfig,
  ) {}

  registerHandler = async (
    req: Request<unknown, unknown, RegisterRequest>,
    res: Response,
  ): Promise<void> => {
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

  loginHandler = async (
    req: Request<unknown, unknown, LoginRequest>,
    res: Response,
  ): Promise<void> => {
    const command: LoginCommand = {
      email: req.body.email,
      password: req.body.password,
      ipAddress: req.ip,
    };

    const output = await this.loginUserUseCase.execute(command);

    setRefreshCookie(res, output.rawRefreshToken, this.appConfig);

    const response = AuthResponseMapper.toResponse(output);
    res.status(200).json(response);
  };

  refreshHandler = async (
    req: Request<unknown, unknown, RefreshRequest>,
    res: Response,
  ): Promise<void> => {
    // Priority: cookie first, body fallback
    const rawRefreshToken = req.cookies?.refreshToken ?? req.body.refreshToken;

    if (!rawRefreshToken) {
      throw new BadRequestError(ErrorCode.MALFORMED_REQUEST, 'Missing refresh token');
    }

    const command: RefreshCommand = {
      rawRefreshToken,
      ipAddress: req.ip,
    };

    const output = await this.refreshTokenUseCase.execute(command);

    setRefreshCookie(res, output.rawRefreshToken, this.appConfig);

    const response = AuthResponseMapper.toResponse(output);
    res.status(200).json(response);
  };

  logoutHandler = async (req: Request, res: Response): Promise<void> => {
    const rawRefreshToken = req.cookies?.refreshToken;

    const command: LogoutCommand = {
      rawRefreshToken,
    };

    await this.logoutUserUseCase.execute(command);

    clearRefreshCookie(res, this.appConfig);
    res.status(204).send();
  };
}
