import { Router } from 'express';
import SwissEph from 'swisseph-wasm';

import { createApp } from './app.js';
import { env } from './config/env.config.js';
import { createDocsRoutes } from './docs/docs.routes.js';
import { HealthController, HealthService, createHealthRoutes } from './health/index.js';
import { CreateBirthProfileUseCase } from './modules/birth-profile/application/use-cases/create-birth-profile.usecase.js';
import { DeleteBirthProfileUseCase } from './modules/birth-profile/application/use-cases/delete-birth-profile.usecase.js';
import { GetBirthProfileUseCase } from './modules/birth-profile/application/use-cases/get-birth-profile.usecase.js';
import { ListBirthProfilesUseCase } from './modules/birth-profile/application/use-cases/list-birth-profiles.usecase.js';
import { SearchBirthLocationsUseCase } from './modules/birth-profile/application/use-cases/search-birth-locations.usecase.js';
import { UpdateBirthProfileUseCase } from './modules/birth-profile/application/use-cases/update-birth-profile.usecase.js';
import { ILocationSearchProvider } from './modules/birth-profile/domain/ports/location-search-provider.port.js';
import { GetBirthProfileSnapshotUseCase } from './modules/birth-profile/index.js';
import { GeoTzTimezoneAdapter } from './modules/birth-profile/infrastructure/adapters/geo-tz-timezone.adapter.js';
import { GeoNamesLocationSearchAdapter } from './modules/birth-profile/infrastructure/adapters/geonames-location-search.adapter.js';
import { PrismaBirthProfileRepository } from './modules/birth-profile/infrastructure/repositories/prisma-birth-profile.repository.js';
import {
  BirthProfileController,
  LocationSearchController,
  createBirthProfileRoutes,
  createLocationRoutes,
} from './modules/birth-profile/presentation/index.js';
import { SwissEphemerisAdapter } from './modules/chart/infrastructure/adapters/swiss-ephemeris.adapter.js';
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

export interface AppOverrides {
  locationSearchProvider?: ILocationSearchProvider;
}

export async function bootstrapApplication(overrides?: AppOverrides) {
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

  // --- Birth Profile Module ---
  const birthProfileRepository = new PrismaBirthProfileRepository(prisma);
  const createBirthProfileUseCase = new CreateBirthProfileUseCase(birthProfileRepository);
  const getBirthProfileUseCase = new GetBirthProfileUseCase(birthProfileRepository);
  const updateBirthProfileUseCase = new UpdateBirthProfileUseCase(birthProfileRepository);
  const deleteBirthProfileUseCase = new DeleteBirthProfileUseCase(birthProfileRepository);
  const listBirthProfilesUseCase = new ListBirthProfilesUseCase(birthProfileRepository);
  const getBirthProfileSnapshotUseCase = new GetBirthProfileSnapshotUseCase(birthProfileRepository);

  const birthProfileController = new BirthProfileController(
    createBirthProfileUseCase,
    getBirthProfileUseCase,
    listBirthProfilesUseCase,
    updateBirthProfileUseCase,
    deleteBirthProfileUseCase,
  );

  const geoTzTimezoneAdapter = new GeoTzTimezoneAdapter();
  const locationSearchProvider =
    overrides?.locationSearchProvider ??
    new GeoNamesLocationSearchAdapter({ username: config.GEONAMES_USERNAME }, geoTzTimezoneAdapter);

  const searchBirthLocationsUseCase = new SearchBirthLocationsUseCase(locationSearchProvider);
  const locationSearchController = new LocationSearchController(searchBirthLocationsUseCase);

  // --- Chart Module (Ephemeris) ---
  const swissEph = new SwissEph();
  await swissEph.initSwissEph();
  logger.info('Ephemeris Provider (Swiss Ephemeris WASM) initialized successfully', {
    module: 'chart',
  });
  const ephemerisProvider = new SwissEphemerisAdapter(swissEph);

  // --- Routers ---
  const routes: Router[] = [
    createHealthRoutes(healthController),
    createAuthRoutes(authController, tokenProvider),
    createBirthProfileRoutes(birthProfileController, tokenProvider),
    createLocationRoutes(locationSearchController),
    createDocsRoutes(config),
  ];

  // --- App ---
  const app = createApp(config, logger, routes);

  return {
    app,
    useCases: {
      createBirthProfileUseCase,
      getBirthProfileUseCase,
      updateBirthProfileUseCase,
      deleteBirthProfileUseCase,
      listBirthProfilesUseCase,
      searchBirthLocationsUseCase,
      getBirthProfileSnapshotUseCase,
    },
    providers: {
      ephemerisProvider,
    },
    shutdown: async () => {
      swissEph.close();
    },
  };
}
