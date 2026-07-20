import { Express, Router } from 'express';

import { createApp } from './app.js';
import { env } from './config/env.config.js';
import { createDocsRoutes } from './docs/docs.routes.js';
import { HealthController, HealthService, createHealthRoutes } from './health/index.js';
import { LoginUserUseCase } from './modules/identity/application/use-cases/login-user.usecase.js';
import { LogoutUserUseCase } from './modules/identity/application/use-cases/logout-user.usecase.js';
import { RefreshTokenUseCase } from './modules/identity/application/use-cases/refresh-token.usecase.js';
import { RegisterUserUseCase } from './modules/identity/application/use-cases/register-user.usecase.js';
import { BcryptPasswordHasherAdapter } from './modules/identity/infrastructure/adapters/bcrypt-password-hasher.adapter.js';
import { ConsoleEmailVerificationAdapter } from './modules/identity/infrastructure/adapters/console-email-verification.adapter.js';
import { JwtTokenAdapter } from './modules/identity/infrastructure/adapters/jwt-token.adapter.js';
import { PrismaRefreshTokenRepository } from './modules/identity/infrastructure/repositories/prisma-refresh-token.repository.js';
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
  const refreshTokenRepository = new PrismaRefreshTokenRepository(prisma);
  const passwordHasher = new BcryptPasswordHasherAdapter();
  const emailVerificationService = new ConsoleEmailVerificationAdapter(logger);
  const tokenProvider = new JwtTokenAdapter({
    accessSecret: config.JWT_ACCESS_SECRET,
    refreshSecret: config.JWT_REFRESH_SECRET,
    accessExpiryMinutes: config.JWT_ACCESS_EXPIRY_MINUTES,
    refreshExpiryDays: config.JWT_REFRESH_EXPIRY_DAYS,
  });

  const registerUserUseCase = new RegisterUserUseCase(
    userRepository,
    passwordHasher,
    emailVerificationService,
    logger,
  );

  const loginUserUseCase = new LoginUserUseCase(
    userRepository,
    passwordHasher,
    tokenProvider,
    refreshTokenRepository,
    config.JWT_ACCESS_EXPIRY_MINUTES * 60,
  );

  const refreshTokenUseCase = new RefreshTokenUseCase(
    userRepository,
    tokenProvider,
    refreshTokenRepository,
    config.JWT_ACCESS_EXPIRY_MINUTES * 60,
  );

  const logoutUserUseCase = new LogoutUserUseCase(refreshTokenRepository, tokenProvider);

  const authController = new AuthController(
    registerUserUseCase,
    loginUserUseCase,
    refreshTokenUseCase,
    logoutUserUseCase,
    config,
  );

  // --- Routers ---
  const routes: Router[] = [
    createHealthRoutes(healthController),
    createAuthRoutes(authController, tokenProvider),
    createDocsRoutes(config),
  ];

  // --- App ---
  const app = createApp(config, logger, routes);

  return { app };
}
