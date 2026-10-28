# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-10-28

### Added

- **Sprint F4 Completion — Core Natal Chart Calculation, Visualization & Viewer Experience (`FE-S4.1`–`FE-S4.11`)**
- **Chart Calculation Integration (`FE-S4.1` & `FE-S4.2`)**:
  - Modal dialog `CalculateChartDialog` to trigger natal chart calculation from any Birth Profile card.
  - Integration with Backend Swiss Ephemeris calculation API (`POST /api/v1/charts/natal`).
  - Cache seeding and automatic invalidation on chart creation.
- **Chart Viewer Foundation & Error Handling (`FE-S4.3`)**:
  - Route `/app/charts/:chartId` with comprehensive loading skeleton (`ChartViewerSkeleton`).
  - Graceful degradation with `HouseDataNotice` for charts with unknown birth time (`isHouseDataAvailable=false`).
  - Vietnamese error mapping and retry actions for network and not-found (404) states.
- **Pure Astrology Domain ViewModel (`FE-S4.4`)**:
  - `chartViewModel.ts`: strictly decoupled, immutably frozen view model mapping backend `ChartResponse` to render geometry.
  - Tolerance for future interpretation enhancements (`interpretations: []`, optional `tone`, null `interpretationVersion`).
- **SVG Chart Wheel Engine (`FE-S4.5` & `FE-S4.6`)**:
  - Pure SVG vector rendering with mathematical precision: 12 zodiac ring (`ZodiacLayer`), house division ring (`HouseLayer`), and 4 angle markers (`AngleLayer`).
  - Dynamic aspect line drawing (`AspectLayer`) supporting 5 standard aspect types (Conjunction, Opposition, Trine, Square, Sextile) with harmonious/tense stroke patterns.
  - Interactive planet placement (`PlanetLayer`) with radial/tangential label collision resolution (`labelLayout.ts`).
  - Accessible semantics: SVG container `role="group"`, planet buttons (`role="button"`, `aria-pressed`).
- **Data Tables & Synchronized Inspection (`FE-S4.7` & `FE-S4.8`)**:
  - Semantic tables for Planets (`PlanetTable`), Houses (`HouseTable`), and Aspects (`AspectTable`).
  - Unified two-way selection sync across Wheel, Tables, and `SelectionDetail` panel.
  - Aspect filtering by selected planet with dismissal chip (`AspectFilterChip`).
  - Mobile responsive card views (`role="list"`) replacing wide tables on small viewports.
- **Responsive Layout & Accessibility Hardening (`FE-S4.9`)**:
  - Pure Container Queries `@container` responsive three-tier layout (Mobile stacked, Tablet one-column, Desktop two-column with sticky wheel).
  - Centered mobile wheel viewport with touch controls and zoom capability (1×–3×).
  - Internal skip link ("Chuyển tới bảng dữ liệu") and keyboard-accessible interaction flows.
  - System-wide `motion-reduce:transition-none` honoring `prefers-reduced-motion`.
  - Zero `vitest-axe` accessibility violations across desktop and mobile modes.
- **Saved Charts Management (`FE-S4.11`)**:
  - Dashboard route `/app/charts` listing saved charts with pagination, sorting, and user profile name correlation.
  - Navigation links added to desktop header and mobile drawer.
- **Integration & E2E Testing (`FE-S4.10`)**:
  - Comprehensive Playwright E2E suite (`chart.spec.ts`) covering full user calculation journey (Scenario 1) and degraded unknown birth time (Scenario 2) against real Backend.
  - 130 test files with 1046 tests passing (100% automated test pass rate).

## [0.2.0] - 2026-10-03

### Added

- **Sprint F3 Completion**
- Birth Profile CRUD Flow: fully functional interface for listing, creating, editing, and deleting birth profiles.
- Intuitive 2-step Birth Form following UI Spec §12.1.
- Location Search field with debouncing, integrated with Swiss Ephemeris timezone resolution.
- Playwright E2E tests for the Birth Profile CRUD flow.
- Added comprehensive unit and component tests ensuring >90% coverage for the new module.

## [0.1.0] - 2026-09-21

### Added

- **Sprint F1 & F2 Completion**
- Initial scaffold with Feature-Sliced Design (FSD) architecture.
- Frontend Design System and core UI components (TailwindCSS, React Hook Form, Zod).
- Full Authentication flow integration with local Backend:
  - User Registration UI & logic
  - User Login UI & logic
  - Session Bootstrap & Refresh Token Coordinator
  - Logout flow
- Vitest configuration with comprehensive component and unit tests (Coverage > 90%).
- Playwright E2E configuration and authentication end-to-end tests.
