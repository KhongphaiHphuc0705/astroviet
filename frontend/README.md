# AstroViet Frontend

This is the frontend application for AstroViet.

## Current Status

**Sprint F1 — Milestone M8 (Routing Foundation): Complete**

- Full feature-sliced routing structure implemented.
- Guard components (`ProtectedRoute`, `GuestRoute`) with Zustand-based Auth Store integration.
- Standardized `SuspenseFallback` with Spinner for all lazy-loaded routes.
- Robust Error Boundary at root level.
- Code-splitting verified for production.

## Prerequisites

- Node.js >= 22.18.0
- npm

## Quick Start

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Scripts

- `npm run dev`: Start the Vite development server.
- `npm run build`: Type-check and build the production bundle.
- `npm run preview`: Serve the production bundle locally.
- `npm run lint`: Run ESLint.
- `npm run format`: Format code using Prettier.
- `npm run test`: Run unit and component tests with Vitest.
- `npm run test:e2e`: Run Playwright end-to-end tests.

## Structure

The project follows a Feature-Sliced Design (FSD) approach:

- `src/app`: Application entry point, router configuration, global styles, and providers.
- `src/pages`: Route-level components.
- `src/widgets`: Standalone UI blocks used across pages.
- `src/features`: Business logic modules (chưa có module nào tính đến M8).
- `src/entities`: Business entities (chưa có module nào tính đến M8).
- `src/shared`: Reusable utilities, UI primitives, config, and API clients.

For detailed architecture rules, refer to the `Frontend Architecture Specification`.

## Backlog / Known Tech Debt

- **Marketing Layout**: Replace mobile menu with a real `Drawer` component featuring a focus trap.
- **Radio Component**: Refine `card` variant styles with proper icons/layout.
- **Providers**: Add `QueryClientProvider` and `I18nextProvider` around the app.
