import { Express, Router } from 'express';

import { createApp } from './app.js';
import { env } from './config/env.config.js';
import { createDocsRoutes } from './docs/docs.routes.js';
import { HealthController, HealthService, createHealthRoutes } from './health/index.js';
import { defaultLogger } from './shared/logger/pino.logger.js';
import { prisma } from './shared/prisma/prisma-client.js';

export async function bootstrapApplication(): Promise<{ app: Express }> {
  const config = env;
  const logger = defaultLogger;

  // --- Services ---
  const healthService = new HealthService(prisma, config, logger);

  // --- Controllers ---
  const healthController = new HealthController(healthService);

  // --- Routers ---
  const routes: Router[] = [createHealthRoutes(healthController), createDocsRoutes(config)];

  // --- App ---
  const app = createApp(config, logger, routes);

  return { app };
}
