import { pino, Logger, DestinationStream, LoggerOptions } from 'pino';

import { env, Environment } from '../../config/env.config.js';

import { ILogger } from './logger.interface.js';

export const REDACT_PATHS = [
  'password',
  '*.password',
  '*.*.password',
  'passwordHash',
  '*.passwordHash',
  '*.*.passwordHash',
  'token',
  '*.token',
  '*.*.token',
  'tokenHash',
  '*.tokenHash',
  '*.*.tokenHash',
  'accessToken',
  '*.accessToken',
  '*.*.accessToken',
  'refreshToken',
  '*.refreshToken',
  '*.*.refreshToken',
  'rawToken',
  '*.rawToken',
  '*.*.rawToken',
];

export class PinoLogger implements ILogger {
  private logger: Logger;

  constructor(name?: string, customStream?: DestinationStream) {
    const isProd = env.NODE_ENV === Environment.PRODUCTION;
    const options: LoggerOptions = {
      name,
      level: env.LOG_LEVEL,
      redact: REDACT_PATHS,
      transport:
        isProd || customStream
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            },
    };

    if (customStream) {
      this.logger = pino(options, customStream);
    } else {
      this.logger = pino(options);
    }
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
