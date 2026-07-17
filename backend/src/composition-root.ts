import { Express, Router } from 'express';

import { createApp } from './app.js';
import { env } from './config/env.config.js';
import { createDocsRoutes } from './docs/docs.routes.js';
import { HealthController, HealthService, createHealthRoutes } from './health/index.js';
import { RegisterUserUseCase } from './modules/identity/application/use-cases/register-user.usecase.js';
import { BcryptPasswordHasherAdapter } from './modules/identity/infrastructure/adapters/bcrypt-password-hasher.adapter.js';
import { ConsoleEmailVerificationAdapter } from './modules/identity/infrastructure/adapters/console-email-verification.adapter.js';
import { PrismaUserRepository } from './modules/identity/infrastructure/repositories/prisma-user.repository.js';
import { AuthController } from './modules/identity/presentation/controllers/auth.controller.js';
import { createAuthRoutes } from './modules/identity/presentation/routes/auth.routes.js';
import { defaultLogger } from './shared/logger/pino.logger.js';
import { prisma } from './shared/prisma/prisma-client.js';

export async function bootstrapApplication(): Promise<{ app: Express }> {
  const config = env;
  const logger = defaultLogger;

  // --- Services ---
  const healthService = new HealthService(prisma, config, logger);

  // --- Controllers ---
  const healthController = new HealthController(healthService);

  // --- Identity Module ---
  const userRepository = new PrismaUserRepository(prisma);
  const passwordHasher = new BcryptPasswordHasherAdapter();
  const emailVerificationService = new ConsoleEmailVerificationAdapter(logger);

  const registerUserUseCase = new RegisterUserUseCase(
    userRepository,
    passwordHasher,
    emailVerificationService,
    logger,
  );

  const authController = new AuthController(registerUserUseCase);

  // --- Routers ---
  const routes: Router[] = [
    createHealthRoutes(healthController),
    createAuthRoutes(authController),
    createDocsRoutes(config),
  ];

  // --- App ---
  const app = createApp(config, logger, routes);

  return { app };
}
