import { CookieOptions, Response } from 'express';

import { AppConfig, Environment } from '../../config/env.config.js';

const refreshCookieOptions = (config: AppConfig): CookieOptions => ({
  httpOnly: true,
  secure: config.NODE_ENV === Environment.PRODUCTION,
  sameSite: 'strict',
  path: '/api/v1/auth',
});

export const setRefreshCookie = (res: Response, rawToken: string, config: AppConfig): void => {
  res.cookie('refreshToken', rawToken, {
    ...refreshCookieOptions(config),
    maxAge: config.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshCookie = (res: Response, config: AppConfig): void => {
  res.clearCookie('refreshToken', refreshCookieOptions(config));
};
