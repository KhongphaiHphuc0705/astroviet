import { pino, Logger } from 'pino';

import { env, Environment } from '../../config/env.config.js';

import { ILogger } from './logger.interface.js';

export class PinoLogger implements ILogger {
  private logger: Logger;

  constructor(name?: string) {
    const isProd = env.NODE_ENV === Environment.PRODUCTION;
    this.logger = pino({
      name,
      level: env.LOG_LEVEL,
      redact: [
        'password',
        'passwordHash',
        'token',
        'tokenHash',
        'accessToken',
        'refreshToken',
        'rawToken',
      ],
      transport: isProd
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
    });
  }

  getPinoLogger(): Logger {
    return this.logger;
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(context || {}, message);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(context || {}, message);
  }

  error(message: string, context?: Record<string, unknown>, err?: Error): void {
    this.logger.error({ ...context, err }, message);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(context || {}, message);
  }
}

// Application-wide default instance, can be injected where DI is not available
export const defaultLogger = new PinoLogger('AstroViet');
