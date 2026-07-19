import { Response } from 'express';

import { AppConfig, Environment } from '../../config/env.config.js';

export const setRefreshCookie = (res: Response, rawToken: string, config: AppConfig): void => {
  res.cookie('refreshToken', rawToken, {
    httpOnly: true,
    secure: config.NODE_ENV === Environment.PRODUCTION,
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: config.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
};
