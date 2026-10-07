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

Started the server using `npm run build` and `node dist/server.js`, then executed `run-smoke-test.js` to hit live endpoints:

```bash
--- Registering User ---
Got Access Token: eyJhbGciOiJIUzI1NiIs...
--- Creating Birth Profile ---
Birth Profile Created: c8366fd2-5ecf-4ed7-ac64-37cc7d61d8af
--- Creating Natal Chart (save=true) ---
Chart Created: 3f049e28-bab9-43b4-9ee6-c5a9576911c2
Interpretation Version: 1.0
Interpretations Count: 21
Sample Interpretation: Sun_in_Taurus
Sample Text: Mặt Trời ở Kim Ngưu đại diện cho sự ổn định, kiên ...
SUCCESS
```

## Conclusion
The fully integrated stack behaves as intended in a completely clean environment:
- **Migrations & Seeds**: Works without manual intervention.
- **Server Boot**: Successfully binds and connects to PostgreSQL.
- **API Flow**: Auth -> Birth Profile -> Natal Chart Generation runs flawlessly.
- **Interpretations**: The actual localized Vietnamese text is correctly mapped and rendered without the `[OWNER_CONTENT_REQUIRED]` placeholders or `fixture:` strings.
