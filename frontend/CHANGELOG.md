# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-11-09

Initial release of the Natal Chart Interpretation Experience (Sprint F5: `FE-S5.1`–`FE-S5.7`).

**Known Limitations:**

- **KG-F5-01 (Moon boundary precision):** In charts with unknown birth time, Backend provides no uncertainty signal for the Moon, so Frontend does not render a separate Moon-specific boundary warning.
- **KG-F5M4-01 / AC-27 (Screen reader audio):** Windows Narrator live-region announcement audio is an Accepted Gap; semantic live-region structure is verified via Chromium accessibility tree.
- **Cross-browser scope:** Automated E2E test suite currently runs on Chromium desktop; not yet tested on Safari/Firefox.
- **Interpretation domain scope:** Release 1.0 focuses on `PlanetInSign`, `PlanetInHouse`, and `AngleInSign` (Ascendant); standalone aspect and house cusp interpretations are not included in this release.

### Added

- **Natal Chart Interpretation Experience (`FE-S5.1`–`FE-S5.7`)**:
  - **CI Seed Content & Contract Probe Integration (`FE-S5.1` / M1)**:
    - Integration of CI seed pipeline for Vietnamese interpretation texts (`interpretations.vi.json`, 252 items).
    - Contract validation probe asserting `interpretationVersion === "1.0"` and 21 standard natal items.
  - **Pure Interpretation Domain ViewModel & Parsing (`FE-S5.2` / M2)**:
    - `interpretation.ts`: strictly decoupled domain parser mapping backend `ChartResponse.interpretations` into typed view models (`PlanetInSign`, `PlanetInHouse`, `AngleInSign`).
    - Deterministic item key generation, sorting (Sun, Moon, Ascendant first, then inner and outer planets), and frozen configuration structures (`Object.freeze` on `INTERPRETATION_GROUP_SPECS`).
  - **Interpretation Panel & Collapsible UI (`FE-S5.3` / M3)**:
    - Accessible collapsible panel (`InterpretationPanel`) with jump navigation overview (`InterpretationOverview`), category grouping ("Cốt lõi" pre-expanded, "Các hành tinh"), individual item cards (`InterpretationItem`), and disclaimer note within overview.
  - **Cross-Component Selection Synchronization (`FE-S5.4` / M4)**:
    - Unified bidirectional selection between SVG Wheel, Data Tables, and Interpretation Panel.
    - Contextual jump links ("Đọc diễn giải" on selected objects, "Xem trên biểu đồ" inside interpretation cards) preserving focus recovery to source elements.
  - **Degraded States & Error Resilience (`FE-S5.5` / M5)**:
    - Graceful degradation for charts with unknown birth time (`isHouseDataAvailable=false`): suppresses house interpretations with explanatory note while keeping sign interpretations intact.
    - Fault-tolerant parsing with unmapped item isolation, non-blocking fallback views, and silent client error reporting (`reportError`).
  - **Responsive Layout & Accessibility Hardening (`FE-S5.6` / M6)**:
    - Responsive adaptation across mobile cards, tablet single-column, and desktop two-column layouts.
    - Plain-text readability typography: local `max-w-[65ch]` width constraint on `<dd>`, 14px body text, target 45–80 chars/line on desktop viewports.
    - Semantic accessibility tree verification (`role="region"`, `<ul>` list structure, `aria-expanded`, `aria-controls`), focus rings, and color contrast verification.
    - `prefers-reduced-motion` support for chart route and interpretation disclosures (D-M6-07 a).
  - **End-to-End Testing & Regression Suite (`FE-S5.7` / M7)**:
    - Real Backend E2E test suite (`interpretation.spec.ts`, 12 tests) covering standard calculation with seed verification (Scenario A) and degraded state with unknown birth time (Scenario B), accompanied by full suite regression verification (60 tests total across the project).

### Changed

- Refined responsive header and user menu layout for small mobile screens (<640px).

## [0.3.0] - 2026-10-28

### Added

- **Sprint F4 Completion — Core Natal Chart Calculation, Visualization & Viewer Experience (`FE-S4.1`–`FE-S4.11`)**
- **Chart API Integration & Query Hooks (`FE-S4.1`)**:
  - API client methods for calculating (`createNatalChart`), retrieving (`getChart`), and listing charts (`listCharts`).
  - React Query hooks (`useChartQuery`, `useChartsQuery`, `useCreateNatalChartMutation`) with cache seeding and automatic invalidation.
- **Pure Astrology Domain ViewModel (`FE-S4.2`)**:
  - `chartViewModel.ts`: strictly decoupled, immutably frozen (`deepFreeze`) view model mapping backend `ChartResponse` to render geometry.
  - Tolerance for future interpretation enhancements (`interpretations: []`, optional `tone`, null `interpretationVersion`).
- **Calculate Flow & Chart Viewer Shell (`FE-S4.3`)**:
  - Modal dialog `CalculateChartDialog` to trigger natal chart calculation directly from any Birth Profile card ("Tính lá số" button).
  - Route `/app/charts/:chartId` with comprehensive loading skeleton (`ChartViewerSkeleton`).
  - Graceful degradation with `HouseDataNotice` for charts with unknown birth time (`isHouseDataAvailable=false`).
  - Vietnamese error mapping and retry actions for network and not-found (404) states.
- **SVG Chart Wheel Foundation (`FE-S4.4`)**:
  - Pure SVG vector rendering with mathematical precision: 12 zodiac ring (`ZodiacLayer`), house division ring (`HouseLayer`), and 4 angle markers ASC/DSC/MC/IC (`AngleLayer`).
  - Coordinate system anchored at 0° Aries, counterclockwise rotation.
- **Planet & Aspect Rendering Engine (`FE-S4.5` & `FE-S4.6`)**:
  - Dynamic aspect line drawing (`AspectLayer`) supporting 5 standard aspect types (Conjunction, Opposition, Trine, Square, Sextile) with harmonious/tense stroke patterns.
  - Interactive planet placement (`PlanetLayer`) with single-lane two-tier radius (`Tier A` / `Tier B`) label collision resolution (`labelLayout.ts`).
  - Accessible semantics: SVG container `role="group"`, planet buttons (`role="button"`, `aria-pressed`).
- **Data Tables & Synchronized Inspection (`FE-S4.7` & `FE-S4.8`)**:
  - Semantic tables for Planets (`PlanetTable`), Houses (`HouseTable`), and Aspects (`AspectTable`).
  - Unified two-way selection sync across Wheel, Tables, and `SelectionDetail` panel via `selection.ts`.
  - Aspect filtering by selected planet with dismissal chip (`AspectFilterChip`).
  - Mobile responsive card views (`role="list"`) replacing wide tables on small viewports.
- **Responsive Layout & Accessibility Hardening (`FE-S4.9`)**:
  - Three-tier layout based on viewport: Mobile stacked cards, Tablet single-column, Desktop two-column using `@container (min-width: 1010px)` with sticky left column gated by `@media (min-height: 1000px)`.
  - Centered mobile wheel viewport (`useLayoutEffect`) with touch controls and zoom capability (1×–3× via `ChartZoomControls`), supporting native browser pinch-to-zoom.
  - Internal skip link ("Chuyển tới bảng dữ liệu") and keyboard-accessible interaction flows.
  - System-wide `motion-reduce:transition-none` honoring `prefers-reduced-motion`.
  - Zero `vitest-axe` accessibility violations across desktop and mobile modes.
- **Saved Charts Management (`FE-S4.11`)**:
  - Dashboard route `/app/charts` listing saved charts with pagination (`pageSize = 12`) and user profile name correlation.
  - Navigation links added to desktop header and mobile drawer.
- **Integration & E2E Testing (`FE-S4.10`)**:
  - Comprehensive Playwright E2E suite (`chart.spec.ts`) covering full user calculation journey (Scenario 1) and degraded unknown birth time (Scenario 2) against real Backend.
  - 130 test files with 1049 tests passing (100% automated test pass rate).

### Changed

- **Marketing Layout Header Navigation & Anti-Flicker (`UX / Product Navigation`)**:
  - Added dedicated navigation buttons to public `MarketingLayout` header and mobile drawer: "Đăng nhập" (ghost button -> `/login`) and "Đăng ký" (primary button -> `/register`) when unauthenticated, and "Vào ứng dụng" (primary button -> `/app`) when authenticated.
  - Origin: Owner requested direct header navigation to eliminate having to manually type `/login` in the browser URL bar.
  - Anti-flicker hardening: Buttons strictly render when `status === "unauthenticated"` or `status === "authenticated"`, avoiding flashing during initial `status === "resolving"` session bootstrap. Verified by dedicated unit test.

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
