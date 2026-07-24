-- Migration: init_birth_profile_module
-- Sprint 2 / Milestone 1 — Prisma Foundation
-- Does NOT touch any `identity` schema object (Sprint 1 stays untouched).

CREATE TABLE "astrology"."birth_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "full_name" TEXT,
    "birth_date" DATE NOT NULL,
    "birth_time" TIME,
    "is_birth_time_known" BOOLEAN NOT NULL DEFAULT true,
    "place_name" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "historical_timezone_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "deleted_at" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "birth_profiles_pkey" PRIMARY KEY ("id")
);

-- Foreign key (references identity.users — does not modify it)
ALTER TABLE "astrology"."birth_profiles"
    ADD CONSTRAINT "fk_birth_profiles_users"
    FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Check constraints (manual — schema.prisma has no native CHECK syntax,
-- same pattern used in Sprint 1 identity migration)
ALTER TABLE "astrology"."birth_profiles"
    ADD CONSTRAINT "chk_birth_profiles_time_known"
    CHECK ("is_birth_time_known" = true OR "birth_time" IS NULL);

ALTER TABLE "astrology"."birth_profiles"
    ADD CONSTRAINT "chk_birth_profiles_label_length"
    CHECK (length("label") BETWEEN 1 AND 100);

ALTER TABLE "astrology"."birth_profiles"
    ADD CONSTRAINT "chk_birth_profiles_latitude"
    CHECK ("latitude" BETWEEN -90 AND 90);

ALTER TABLE "astrology"."birth_profiles"
    ADD CONSTRAINT "chk_birth_profiles_longitude"
    CHECK ("longitude" BETWEEN -180 AND 180);

-- Partial index — manual WHERE clause (Prisma @@index cannot express this,
-- same pattern used for Sprint 1's users_email_key)
CREATE INDEX "idx_birth_profiles_user_id"
    ON "astrology"."birth_profiles" ("user_id")
    WHERE "deleted_at" IS NULL;

-- updated_at trigger — OQ1 CONFIRMED: shared infrastructure-level function
-- in `public` schema, independent of any bounded context (identity/astrology).
-- Sprint 1's identity.update_updated_at_column() is left untouched.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- OQ2 CONFIRMED: trigger name follows written Specification §15.3
-- (trg_<table>_<action>), not Sprint 1's deviated naming.
CREATE TRIGGER trg_birth_profiles_updated_at
    BEFORE UPDATE ON "astrology"."birth_profiles"
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
