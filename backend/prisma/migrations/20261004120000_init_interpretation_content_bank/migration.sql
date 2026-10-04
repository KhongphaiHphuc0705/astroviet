-- CreateTable
CREATE TABLE "astrology"."languages" (
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("code")
);

-- Create Partial Unique Index for languages
CREATE UNIQUE INDEX "languages_single_default_key" ON "astrology"."languages"("is_default") WHERE "is_default" = true;

-- Insert Seed Data for 'vi'
INSERT INTO "astrology"."languages" ("code","display_name","is_default") VALUES ('vi','Tiếng Việt',true) ON CONFLICT ("code") DO NOTHING;

-- CreateTable
CREATE TABLE "astrology"."interpretation_contents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subject_type" TEXT NOT NULL,
    "subject_key" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "content_source" TEXT NOT NULL DEFAULT 'HumanAuthored',
    "tone" TEXT,
    "body_text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Published',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interpretation_contents_pkey" PRIMARY KEY ("id")
);

-- Create constraints for interpretation_contents
ALTER TABLE "astrology"."interpretation_contents" ADD CONSTRAINT "interpretation_contents_subject_type_check" CHECK ("subject_type" IN ('PlanetInSign','PlanetInHouse','AngleInSign','Aspect','PatternType','SignSummary','HouseSummary'));
ALTER TABLE "astrology"."interpretation_contents" ADD CONSTRAINT "interpretation_contents_content_source_check" CHECK ("content_source" IN ('HumanAuthored','AIGenerated','Hybrid'));
ALTER TABLE "astrology"."interpretation_contents" ADD CONSTRAINT "interpretation_contents_tone_check" CHECK ("tone" IS NULL OR "tone" IN ('Neutral','Encouraging','Direct'));
ALTER TABLE "astrology"."interpretation_contents" ADD CONSTRAINT "interpretation_contents_status_check" CHECK ("status" IN ('Draft','Published','Archived'));

-- AddForeignKey
ALTER TABLE "astrology"."interpretation_contents" ADD CONSTRAINT "interpretation_contents_language_fkey" FOREIGN KEY ("language") REFERENCES "astrology"."languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create UNIQUE expression index
CREATE UNIQUE INDEX "interpretation_contents_subject_language_version_tone_key" ON "astrology"."interpretation_contents"("subject_type", "subject_key", "language", "version", COALESCE("tone", ''));

-- Create partial index (declared in Prisma but Prisma generated it natively if we use map, we can manually add it here to ensure correct placement)
CREATE INDEX "interpretation_contents_published_lookup_idx" ON "astrology"."interpretation_contents"("subject_type", "subject_key", "language", "version") WHERE "status" = 'Published';
