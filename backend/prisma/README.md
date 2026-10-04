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
3. `astrology.languages(is_default) WHERE is_default = true` (Partial Unique)
4. `astrology.interpretation_contents(subject_type, subject_key, language, version, COALESCE(tone, ''))` (UNIQUE Expression)
5. `astrology.interpretation_contents(...) WHERE status = 'Published'` (Partial Index)

These were implemented via **hand-written raw SQL** in migrations (e.g. `20260715000000_init_identity_module` and `20261004120000_init_interpretation_content_bank`).

Because `schema.prisma` declares these using basic `@unique` or `@@index` properties, Prisma may detect a "drift" (since the actual database index has a `WHERE` clause or expression).
If you run `npx prisma migrate dev` in the future, Prisma might try to generate a migration that drops our partial/expression indexes and replaces them with basic ones.
**Do NOT let Prisma regenerate or "fix" these indexes.** Always review the generated SQL in `migrations/` before deploying, and manually delete any lines that attempt to drop the partial/expression indexes.

## Scripts

- `npm run prisma:generate` - Generates the Prisma Client.
- `npm run prisma:migrate` - Creates and applies a new migration.
- `npm run prisma:deploy` - Applies pending migrations to the database (for CI/CD).
- `npm run prisma:seed` - Runs `seed.ts` (using Zod configuration from `.env`).
- `npm run prisma:seed:content` - Seeds interpretation content using `seed-content.ts`.
- `npm run prisma:studio` - Opens Prisma Studio UI.

## Interpretation Content Pipeline

Astrology interpretation content (prose) is managed outside the regular Prisma schema workflow.

- **Production Content**: The fully written `interpretations.vi.json` file is a **Content Owner Dependency**. It is NOT checked into the repository due to copyright/size reasons.
- **Sample Content**: Developers can use the checked-in `prisma/content/interpretations.vi.sample.json` which contains a small mock dataset (Draft status) for testing structural validation.
- **Seeding**: The `npm run prisma:seed:content` script validates the JSON file strictly against domain grammar and seeds it into the database via atomic transactions.
  - It handles Conflict errors (e.g. attempting to downgrade a `Published` version to `Draft`).
  - To test validity without seeding: `npm run prisma:seed:content -- --validate-only`
- **Clean Database**: Running `npm run db:reset` will run pending migrations, recreate the admin user, and automatically seed the sample interpretation content if available.
