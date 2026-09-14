# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-09-13 (Sprint 3)

### Added

- **Natal Chart Module**: Full natal chart calculation pipeline via Clean Architecture (Domain/Application/Infrastructure/Presentation layers).
- **Swiss Ephemeris Integration**: WebAssembly-based planet/angle/house position calculation via `swisseph-wasm` v0.1.0, wrapped by `SwissEphemerisAdapter` (single infrastructure-layer import point).
- **Chart REST API**: 4 new authenticated endpoints — `POST /api/v1/charts/natal`, `GET /api/v1/charts`, `GET /api/v1/charts/:id`, `DELETE /api/v1/charts/:id`.
- **Chart Engine**: `NatalChartEngine` with 10 planets, 12 houses (Placidus), 4 angles (ASC/DSC/MC/IC), and major aspects (Conjunction, Sextile, Square, Trine, Opposition) with configurable orb/applying detection.
- **Golden Reference Validation**: 25 golden tests against NASA JPL Horizons DE441 reference data (tolerance ≤ 0.01°); 189 unit tests for domain rules.
- **Chart Snapshot Immutability**: Chart records denormalize birth data at creation time (`snapshot_*` columns) — chart data is preserved independently from subsequent BirthProfile edits.
- **Mutex-protected WASM Serialization**: `AsyncMutex` ensures at most 1 concurrent WASM calculation at any time, preventing WebAssembly concurrency issues.
- **Documentation**: OpenAPI specs generated and synchronized for all 4 chart endpoints. License Record (`docs/legal/swisseph-license-record.md`) expanded to 8 required fields. Known Gaps Registry (`docs/implementation/Sprint_3_Known_Gaps_Registry.md`) established.

### Changed

- Bumped `package.json` version from `0.2.0` to `0.3.0` and updated description to reflect Sprint 3.
- Updated `backend/README.md` to document Chart Module, Swiss Ephemeris integration, chart API flows, and correct Sprint 3 roadmap status.
- Corrected `Database_Design_Specification.md` §5.7: `snapshot_interpretation_version` is nullable (`TEXT NULL`), not `TEXT NOT NULL` as previously documented.

### Known Gaps (deferred — see Sprint 3 Known Gaps Registry)

- **G-01**: `ChartResponse.interpretations` always returns `[]` — Interpretation Engine not yet built.
- **G-02**: `ChartSummaryResponse.birthProfileLabel` always `null` — denormalization design pending.
- **G-13**: Pattern Detection (D-14: Grand Trine, T-Square, etc.) intentionally deferred — `chart_patterns` always `[]`.

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
