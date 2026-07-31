# AstroViet Frontend

This is the frontend application for AstroViet, initialized as part of Sprint F1 (Milestone M1).

## Prerequisites

- Node.js >= 22.18.0
- npm

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

## Scripts

- `npm run dev`: Start the Vite development server.
- `npm run build`: Type-check and build the production bundle.
- `npm run lint`: Run ESLint.
- `npm run format`: Format code using Prettier.
- `npm run test`: Run unit and component tests with Vitest.
- `npm run test:e2e`: Run Playwright end-to-end tests.

## Structure

The project follows a Feature-Sliced Design (FSD) approach:

- `src/app`: Application entry point, global styles, and providers.
- `src/pages`: Route-level components.
- `src/widgets`: Standalone UI blocks used across pages.
- `src/features`: Business logic modules (empty in M1).
- `src/entities`: Business entities (empty in M1).
- `src/shared`: Reusable utilities, UI primitives, config, and API clients.

For detailed architecture rules, refer to the `Frontend Architecture Specification`.
