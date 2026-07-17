import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Router, json, urlencoded } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { AppConfig } from './config/env.config.js';
import { PinoLogger } from './shared/logger/pino.logger.js';
import {
  requestIdMiddleware,
  notFoundMiddleware,
  createErrorHandlerMiddleware,
} from './shared/middlewares/index.js';

export const createApp = (config: AppConfig, logger: PinoLogger, routers: Router[]): Express => {
  const app = express();

  // 1. Trust proxy for secure cookies / rate limiting behind load balancers
  app.set('trust proxy', 1);

  // 2. Request ID (Must be first to trace the full lifecycle)
  app.use(requestIdMiddleware);

  // 3. HTTP Logging
  app.use(
    pinoHttp({
      logger: logger.getPinoLogger(),
      genReqId: (req) => req.id, // Use the ID from our middleware
      customProps: (req, _res) => ({
        requestId: req.id,
      }),
      // Redact sensitive headers/body if we were to log them
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      // Only log request start/end as per decision
      autoLogging: true,
    }),
  );

  // 4. Security Headers
  app.use(helmet());

  // 5. CORS
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
    }),
  );

  // 6. Compression
  app.use(
    compression({
      threshold: 1024, // 1kb
    }),
  );

  // 7. Body Parsers
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: true, limit: '100kb' }));
  app.use(cookieParser());

  routers.forEach((router) => {
    app.use('/', router);
  });

  // 8. Catch-all 404
  app.use(notFoundMiddleware);

  // 9. Global Error Handler (Must be last)
  app.use(createErrorHandlerMiddleware(logger));

  return app;
};
