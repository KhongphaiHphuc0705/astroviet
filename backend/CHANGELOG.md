# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-07-28 (Sprint 2)

### Added

- **Birth Profile Module**: Full CRUD operations for managing birth profiles (`POST`, `GET`, `GET :id`, `PATCH`, `DELETE /api/v1/birth-profiles`).
- **Location Search**: External integration with GeoNames to search for birth locations and coordinates (`GET /api/v1/locations/search`).
- **Timezone Resolution**: Automated historical timezone resolution using GeoTz based on coordinates.
- **Documentation**: Swagger OpenAPI specs generated and synchronized for the new endpoints.

### Changed

- Refactored `Identity` module to update `validate` middleware to `validateBody` without breaking API compatibility.

## [0.1.0] - 2026-07-01 (Sprint 1)

### Added

- **Identity Module**: User registration, login, logout, and token refresh capabilities (`POST /api/v1/auth/*`).
- **Shared Kernel**: Centralized error handling, standardized API responses, mapping and generic middleware.
- **Infrastructure**: Initialized Prisma ORM, PostgreSQL database connection, and Pino logger.
- **Health Checks**: Implemented basic health check endpoints (`GET /api/v1/health`, `GET /api/v1/health/db`).
- **Project Structure**: Setup Clean Architecture layers (Domain, Application, Infrastructure, Presentation).
