-- CreateTable
CREATE TABLE "astrology"."house_systems" (
    "name" TEXT NOT NULL,
    "requires_precise_birth_time" BOOLEAN NOT NULL,
    "supports_polar_latitudes" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "house_systems_pkey" PRIMARY KEY ("name")
);

-- Seed Data (Placidus, WholeSign)
INSERT INTO "astrology"."house_systems" ("name", "requires_precise_birth_time", "supports_polar_latitudes", "is_active") VALUES
('Placidus', true, false, true),
('WholeSign', false, true, true);
