# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
