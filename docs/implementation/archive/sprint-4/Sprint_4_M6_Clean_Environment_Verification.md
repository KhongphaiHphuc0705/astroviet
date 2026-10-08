# Sprint 4 - Clean Environment Verification (Task 3)

## 1. Reset Database & Apply Migrations

```bash
docker compose -f docker-compose.test.yml down -v
docker compose -f docker-compose.test.yml up -d
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/test"
npm run prisma:deploy
```

**Result:**
```
5 migrations found in prisma/migrations
Applying migration 20260715000000_init_identity_module
Applying migration 20260724000000_init_birth_profile_module
Applying migration 20260830120000_init_house_system
Applying migration 20260831120000_init_chart_module
Applying migration 20261004120000_init_interpretation_content_bank
All migrations have been successfully applied.
```

## 2. Seed Content & Verify Database Count

```bash
npm run prisma:seed:content
docker exec backend-postgres-test-1 psql -U postgres -d test -c "SELECT status, count(*) FROM astrology.interpretation_contents GROUP BY status;"
```

**Result:**
```
Validation passed!
Coverage: 252/252
Seeding content to database...
Seed successful! Outcome: inserted, Count: 252

  status   | count 
-----------+-------
 Published |   252
```
All 252 translations were properly populated from `interpretations.vi.json` to the DB.

## 3. Generate OpenAPI Schema

```bash
npm run generate:openapi
```
**Result:**
```
✅ OpenAPI JSON written to D:\Hphucc\Hphuc\astroviet\backend\openapi.json
✅ OpenAPI YAML written to D:\Hphucc\Hphuc\astroviet\backend\openapi.yaml
```

## 4. Run Application & Execute End-to-End Smoke Test

Started the server using `npm run build` and `cross-env DEBUG=prisma:query node dist/server.js`, then executed `npx tsx scripts/run-smoke-test.ts` to hit live endpoints on port 3000:

**Server Query Log (Excerpt for POST /charts/natal):**
```
prisma:query SELECT "identity"."users"."id", ... FROM "identity"."users" WHERE "identity"."users"."id" = $1 LIMIT $2 OFFSET $3
prisma:query SELECT "astrology"."birth_profiles"."id", ... FROM "astrology"."birth_profiles" WHERE ...
prisma:query SELECT "astrology"."interpretation_contents"."version" FROM "astrology"."interpretation_contents" WHERE ...
prisma:query SELECT "astrology"."interpretation_contents"."id", ... FROM "astrology"."interpretation_contents" WHERE ("astrology"."interpretation_contents"."language" = $1 AND "astrology"."interpretation_contents"."version" = $2 AND "astrology"."interpretation_contents"."status" = $3 AND "astrology"."interpretation_contents"."tone" IS NULL AND ("astrology"."interpretation_contents"."subject_type" = $4 AND "astrology"."interpretation_contents"."subject_key" = $5 OR ...))
prisma:query INSERT INTO "astrology"."charts" ...
```
*(Tổng cộng có 5 truy vấn chính cho 1 lượt POST Chart: 1 User, 1 BirthProfile, 1 SELECT DISTINCT version, 1 SELECT nội dung diễn giải (bằng mệnh đề OR), và 1 INSERT chart mới).*

**Script Output:**
```bash
--- Registering User ---
Got Access Token: eyJhbGciOiJIUzI1NiIs...
--- Creating Birth Profile ---
Birth Profile Created: 71a8bc59-2f1d-48cb-a892-db0fc7b63f11
--- Creating Natal Chart (save=true) ---
Chart Created: 9f250b73-0ca8-4389-9a70-8e6d8a39512d
Interpretation Version: 1.0
Interpretations Count: 21
Sample Interpretation: Sun_in_Taurus
Sample Text: Mặt Trời ở Kim Ngưu đại diện cho sự ổn định, kiên ...
--- Getting Natal Chart (GET /charts/:id) ---
GET Chart ID: 9f250b73-0ca8-4389-9a70-8e6d8a39512d
GET Interpretation Version: 1.0
GET Interpretations Count: 21
--- Getting Non-Existent Chart (404) ---
GET 404 handled correctly
--- Creating Natal Chart (Unknown Time, save=false) ---
Unknown Time Chart Houses length: 0
Unknown Time Interpretations length: 10
SUCCESS
```

## Conclusion
The fully integrated stack behaves as intended in a completely clean environment:
- **Migrations & Seeds**: Works without manual intervention.
- **Server Boot**: Successfully binds and connects to PostgreSQL.
- **API Flow**: Auth -> Birth Profile -> Natal Chart Generation runs flawlessly, including GET /charts/:id and 404 handler.
- **Missing Birth Time**: Accurately calculates planets without houses, yielding precisely 10 interpretations.
- **Interpretations**: The actual localized Vietnamese text is correctly mapped and rendered from `astrology.interpretation_contents`.
