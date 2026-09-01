-- CreateTable
CREATE TABLE "astrology"."charts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "birth_profile_id" UUID,
    "chart_type" TEXT NOT NULL,
    "house_system" TEXT NOT NULL,
    "is_house_data_available" BOOLEAN NOT NULL,
    "engine_version" TEXT NOT NULL,
    "calculated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    -- Nullable (OQ-1.2): Cho phép null tạm thời trước khi Content Bank được tích hợp, tránh sinh placeholder tự phát minh.
    "snapshot_interpretation_version" TEXT,
    "snapshot_full_name" TEXT,
    "snapshot_birth_date" DATE NOT NULL,
    "snapshot_birth_time" TIME,
    "snapshot_is_birth_time_known" BOOLEAN NOT NULL,
    "snapshot_place_name" TEXT NOT NULL,
    "snapshot_latitude" DECIMAL(9,6) NOT NULL,
    "snapshot_longitude" DECIMAL(9,6) NOT NULL,
    "snapshot_timezone_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "charts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "astrology"."chart_planets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chart_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "longitude" DECIMAL(6,3) NOT NULL,
    "latitude" DECIMAL(6,3),
    "speed" DECIMAL(9,5) NOT NULL,
    "is_retrograde" BOOLEAN NOT NULL,
    "sign" TEXT NOT NULL,
    "degree_in_sign" DECIMAL(5,2) NOT NULL,
    "house_number" INTEGER,

    CONSTRAINT "chart_planets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "astrology"."chart_houses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chart_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "cusp_degree" DECIMAL(6,3) NOT NULL,
    "sign_on_cusp" TEXT NOT NULL,

    CONSTRAINT "chart_houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "astrology"."chart_angles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chart_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "longitude" DECIMAL(6,3) NOT NULL,
    "sign" TEXT NOT NULL,
    "degree_in_sign" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "chart_angles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "astrology"."chart_aspects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chart_id" UUID NOT NULL,
    "planet_a" TEXT NOT NULL,
    "planet_b" TEXT NOT NULL,
    "aspect_type" TEXT NOT NULL,
    "exact_angle" DECIMAL(6,3) NOT NULL,
    "orb" DECIMAL(5,3) NOT NULL,
    "is_applying" BOOLEAN NOT NULL,
    "nature" TEXT NOT NULL,

    CONSTRAINT "chart_aspects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "astrology"."chart_patterns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chart_id" UUID NOT NULL,
    "pattern_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chart_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "astrology"."chart_pattern_planets" (
    "pattern_id" UUID NOT NULL,
    "planet_id" UUID NOT NULL,

    CONSTRAINT "chart_pattern_planets_pkey" PRIMARY KEY ("pattern_id","planet_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chart_planets_chart_id_name_key" ON "astrology"."chart_planets"("chart_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "chart_houses_chart_id_number_key" ON "astrology"."chart_houses"("chart_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "chart_angles_chart_id_type_key" ON "astrology"."chart_angles"("chart_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "chart_aspects_chart_id_planet_a_planet_b_key" ON "astrology"."chart_aspects"("chart_id", "planet_a", "planet_b");

-- CreateIndex (Partial index requested by spec)
CREATE INDEX "charts_user_id_calculated_at_idx" ON "astrology"."charts"("user_id", "calculated_at" DESC) WHERE "deleted_at" IS NULL;

-- CreateIndex (Partial index requested by spec)
CREATE INDEX "charts_birth_profile_id_idx" ON "astrology"."charts"("birth_profile_id") WHERE "deleted_at" IS NULL;

-- CreateIndex
CREATE INDEX "chart_patterns_chart_id_idx" ON "astrology"."chart_patterns"("chart_id");

-- CreateIndex
CREATE INDEX "chart_pattern_planets_planet_id_idx" ON "astrology"."chart_pattern_planets"("planet_id");

-- AddForeignKey
ALTER TABLE "astrology"."charts" ADD CONSTRAINT "charts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "astrology"."charts" ADD CONSTRAINT "charts_birth_profile_id_fkey" FOREIGN KEY ("birth_profile_id") REFERENCES "astrology"."birth_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "astrology"."charts" ADD CONSTRAINT "charts_house_system_fkey" FOREIGN KEY ("house_system") REFERENCES "astrology"."house_systems"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "astrology"."chart_planets" ADD CONSTRAINT "chart_planets_chart_id_fkey" FOREIGN KEY ("chart_id") REFERENCES "astrology"."charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "astrology"."chart_houses" ADD CONSTRAINT "chart_houses_chart_id_fkey" FOREIGN KEY ("chart_id") REFERENCES "astrology"."charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (Composite FK for chart_planets to chart_houses)
ALTER TABLE "astrology"."chart_planets" ADD CONSTRAINT "chart_planets_chart_id_house_number_fkey" FOREIGN KEY ("chart_id", "house_number") REFERENCES "astrology"."chart_houses"("chart_id", "number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "astrology"."chart_angles" ADD CONSTRAINT "chart_angles_chart_id_fkey" FOREIGN KEY ("chart_id") REFERENCES "astrology"."charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "astrology"."chart_aspects" ADD CONSTRAINT "chart_aspects_chart_id_fkey" FOREIGN KEY ("chart_id") REFERENCES "astrology"."charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "astrology"."chart_patterns" ADD CONSTRAINT "chart_patterns_chart_id_fkey" FOREIGN KEY ("chart_id") REFERENCES "astrology"."charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "astrology"."chart_pattern_planets" ADD CONSTRAINT "chart_pattern_planets_pattern_id_fkey" FOREIGN KEY ("pattern_id") REFERENCES "astrology"."chart_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "astrology"."chart_pattern_planets" ADD CONSTRAINT "chart_pattern_planets_planet_id_fkey" FOREIGN KEY ("planet_id") REFERENCES "astrology"."chart_planets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraints
ALTER TABLE "astrology"."charts" ADD CONSTRAINT "charts_chart_type_check" CHECK (chart_type IN ('Natal'));
ALTER TABLE "astrology"."charts" ADD CONSTRAINT "charts_snapshot_is_birth_time_known_check" CHECK (snapshot_is_birth_time_known = true OR snapshot_birth_time IS NULL);

ALTER TABLE "astrology"."chart_planets" ADD CONSTRAINT "chart_planets_category_check" CHECK (category IN ('Personal','Social','Outer','Point'));
ALTER TABLE "astrology"."chart_planets" ADD CONSTRAINT "chart_planets_longitude_check" CHECK (longitude >= 0 AND longitude < 360);
ALTER TABLE "astrology"."chart_planets" ADD CONSTRAINT "chart_planets_degree_in_sign_check" CHECK (degree_in_sign >= 0 AND degree_in_sign < 30);
ALTER TABLE "astrology"."chart_planets" ADD CONSTRAINT "chart_planets_is_retrograde_check" CHECK (NOT (name IN ('Sun', 'Moon') AND is_retrograde = true));
ALTER TABLE "astrology"."chart_planets" ADD CONSTRAINT "chart_planets_sign_check" CHECK (sign IN ('Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'));

ALTER TABLE "astrology"."chart_houses" ADD CONSTRAINT "chart_houses_number_check" CHECK (number BETWEEN 1 AND 12);
ALTER TABLE "astrology"."chart_houses" ADD CONSTRAINT "chart_houses_cusp_degree_check" CHECK (cusp_degree >= 0 AND cusp_degree < 360);
ALTER TABLE "astrology"."chart_houses" ADD CONSTRAINT "chart_houses_sign_on_cusp_check" CHECK (sign_on_cusp IN ('Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'));

ALTER TABLE "astrology"."chart_angles" ADD CONSTRAINT "chart_angles_type_check" CHECK (type IN ('Ascendant','Midheaven','Descendant','ImumCoeli'));
ALTER TABLE "astrology"."chart_angles" ADD CONSTRAINT "chart_angles_longitude_check" CHECK (longitude >= 0 AND longitude < 360);
ALTER TABLE "astrology"."chart_angles" ADD CONSTRAINT "chart_angles_degree_in_sign_check" CHECK (degree_in_sign >= 0 AND degree_in_sign < 30);
ALTER TABLE "astrology"."chart_angles" ADD CONSTRAINT "chart_angles_sign_check" CHECK (sign IN ('Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'));

ALTER TABLE "astrology"."chart_aspects" ADD CONSTRAINT "chart_aspects_aspect_type_check" CHECK (aspect_type IN ('Conjunction','Sextile','Square','Trine','Opposition'));
ALTER TABLE "astrology"."chart_aspects" ADD CONSTRAINT "chart_aspects_nature_check" CHECK (nature IN ('Harmonious','Challenging','Neutral'));
ALTER TABLE "astrology"."chart_aspects" ADD CONSTRAINT "chart_aspects_planet_order_check" CHECK (planet_a < planet_b);
