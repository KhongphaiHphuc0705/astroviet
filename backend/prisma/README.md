# Prisma Configuration & Scripts

This directory contains the Prisma ORM configuration for the AstroViet Platform.

## Multi-Schema Support

We use Prisma's `multiSchema` preview feature to support Clean Architecture domain boundaries at the database level:

- `identity`: Authentication, users, and tokens.
- `astrology`: Core astrological engine data (charts, birth profiles).
- `content`: CMS data (articles, interpretations).

## ⚠️ Important Warning: Schema Drift & Partial Indexes

Prisma Schema language currently does NOT fully support **Partial Indexes** (e.g. `WHERE deleted_at IS NULL`) natively.

In `astroviet`, according to our Database Design Specification, we explicitly use Partial Indexes for:

1. `identity.users(email) WHERE deleted_at IS NULL`
2. `identity.refresh_tokens(expires_at) WHERE revoked_at IS NULL`

These were implemented via **hand-written raw SQL** in `prisma/migrations/20260715000000_init_identity_module/migration.sql`.

Because `schema.prisma` declares `email` as simply `@unique`, Prisma may detect a "drift" (since the actual database index has a `WHERE` clause).
If you run `npx prisma migrate dev` in the future, Prisma might try to generate a migration that drops our partial index and replaces it with a full unique index.
**Do NOT let Prisma regenerate or "fix" these indexes.** Always review the generated SQL in `migrations/` before deploying, and manually delete any lines that attempt to drop the partial indexes on `email` or `expires_at`.

## Scripts

- `npm run prisma:generate` - Generates the Prisma Client.
- `npm run prisma:migrate` - Creates and applies a new migration.
- `npm run prisma:deploy` - Applies pending migrations to the database (for CI/CD).
- `npm run prisma:seed` - Runs `seed.ts` (using Zod configuration from `.env`).
- `npm run prisma:studio` - Opens Prisma Studio UI.
