# Sprint 4 M1 — Interpretation Persistence Foundation

**Phiên bản:** 1.1 — Confirmed. A1–A4 đã được project owner xác nhận (Mục 22). Sẵn sàng triển khai.
**Vị trí đề xuất:** `docs/implementation/Sprint_4_M1_Interpretation_Persistence_Foundation_Plan.md`
**Căn cứ:** audit trực tiếp nhánh `dev` (commit `a369019`) và Sprint 4 Implementation Plan v1.1. Mọi đường dẫn bên dưới đã được tìm thấy trong repo, trừ các file ghi rõ "tạo mới".
**Ghi chú về bằng chứng:** plan này chưa chạy lệnh nào (không migration, không test). Mọi mục thực thi đều là `UNVERIFIED` cho tới khi có log thật (Mục 26, 28).

---

## 1. Sprint Overview

M1 dựng nền persistence cho Interpretation Engine: hai bảng `languages`, `interpretation_contents`, dòng ngôn ngữ `vi`, và đường đọc/ghi `charts.snapshot_interpretation_version`. M1 **không** có rule engine, không có API, không đổi `ChartResponse`.

## 2. Current Repository Audit

| Hạng mục | Phát hiện (đã verify) |
|---|---|
| Module | ESM: `package.json` có `"type": "module"`, `tsconfig` dùng `module/moduleResolution: NodeNext`; import nội bộ phải có đuôi `.js`. **Không phải CommonJS** như prompt M1 ghi |
| Prisma | `@prisma/client ^5.20.0`; multiSchema (`identity`, `astrology`, `content`); field đặt tên snake_case + `@@map` + `@@schema` |
| Migrations hiện có | `20260715000000_init_identity_module`, `20260724000000_init_birth_profile_module`, `20260830120000_init_house_system`, `20260831120000_init_chart_module` |
| **Cột Chart** | `charts.snapshot_interpretation_version TEXT` (nullable) **đã tồn tại** trong `20260831120000_init_chart_module/migration.sql` dòng 13 và `schema.prisma` (`snapshot_interpretation_version String?`, dòng 96) |
| Mapper | `prisma-chart.mapper.ts` dòng 210: `snapshot_interpretation_version: null, // As specified in M5-T04: always null for now`; `toDomain` (dòng 164, `Chart.reconstitute`) không đọc field này |
| Entity | `ChartProps` (`chart.entity.ts`) **không có** `snapshotInterpretationVersion`; `Chart.create`/`reconstitute` nhận `ChartProps` |
| Callers của `Chart.create/reconstitute` | `chart-builder.ts:109`, `prisma-chart.mapper.ts:164`, và nhiều test: `prisma-chart.repository.test.ts`, `chart.entity.test.ts`, `chart-response.mapper.test.ts`, `chart-summary-response.mapper.test.ts` |
| Repository | `PrismaChartRepository`: `save` (transaction), `findById` (include relations, trả `null` nếu `deleted_at`), `listByUserId`; lỗi Prisma được bọc `InfrastructureError` |
| Reference data | `house_systems` được `INSERT` thẳng trong `20260830120000_init_house_system/migration.sql` (dòng 12). `prisma/seed.ts` **chỉ** seed admin user (idempotent bằng `findUnique`) |
| CI | `backend-ci.yml` chạy `prisma:generate` → `prisma:deploy` → `test:coverage`; **không** chạy `prisma:seed`. `frontend-ci.yml` cũng chỉ `prisma:deploy` |
| Test | Vitest, `fileParallelism: false`, DB `postgresql://postgres:postgres@localhost:5432/test`, không có coverage threshold |
| `database.helper.ts` | `clearDatabase()` truncate `CASCADE` mọi bảng trong schema `identity`/`astrology`/`content`, **ngoại trừ** `_prisma_migrations` và `house_systems` (dòng 26) |
| Test repository | `tests/integration/modules/chart/repositories/prisma-chart.repository.test.ts`: `new PrismaClient()`, `beforeEach(clearDatabase)`, `describe('save()' / 'findById()' / 'softDelete()' / 'Constraints Check')`, assert `InfrastructureError` khi vi phạm constraint |
| Chưa có | model `Language`, `InterpretationContent`; port `IInterpretationContentProvider`; `interpretation.types.ts` |
| Chưa mở trong audit M1 | Backend README (quy ước scope theo sprint), nội dung `CHANGELOG.md`, coding/testing standards trong `docs/development`, Sprint 3 Evidence Matrix — `UNVERIFIED — not found during repository audit` cho nội dung của chúng |

## 3. Source-of-Truth Hierarchy

1. Code và migration trong repo (`dev`) — nguồn sự thật về trạng thái hiện tại.
2. DB Design Specification §5.5 (`languages`), §5.13 (`interpretation_contents`), §5.7 (`charts`), §7 (index) — nguồn sự thật về thiết kế.
3. Sprint 4 Implementation Plan v1.1 và 12 Frozen Decisions của prompt M1 — nguồn sự thật về quyết định đã chốt.
4. `prisma/README.md` — quy trình xử lý index/constraint mà Prisma không biểu diễn được.
5. Lời tuyên bố "đã xong" của sprint trước **không** phải bằng chứng.

Khi spec và code lệch nhau, plan này ghi vào Decision Log (Mục 21), không tự sửa spec im lặng.

## 4. Existing Architecture Baseline

`chart` module có 4 lớp: `domain/` (entities, types, ports, value-objects, engine), `application/`, `infrastructure/` (repositories, mappers), `presentation/`. `domain/ports/chart-repository.port.ts` là tiền lệ cho port; `infrastructure/repositories/prisma-chart.repository.ts` là tiền lệ cho implementation. Dependency: infrastructure → domain; domain không import Prisma/Express. DI tập trung ở `src/composition-root.ts`.

## 5. M1 Objective

Sau M1: DB có `languages` (seed `vi`) và `interpretation_contents` với đủ CHECK/FK/UNIQUE/INDEX theo spec (cộng `AngleInSign`); `Chart` entity mang và lưu `snapshotInterpretationVersion`; có provider đọc/ghi nội dung đã được test với Postgres thật.

## 6. Frozen Decisions

FD1–FD12 của prompt M1 được giữ nguyên, không mở lại. Các điểm repo-grounded làm rõ cách áp dụng, không thay đổi quyết định: FD7 (chỉ `vi`) — xem D-M1-04; FD9 (cột đã tồn tại) — xem D-M1-01; FD12 (không nuốt lỗi DB) — xem Mục 17/18.

## 7. Scope

1. Prisma model `Language`, `InterpretationContent`.
2. Migration SQL: 2 bảng, CHECK, FK, UNIQUE expression index, partial indexes, `INSERT vi`.
3. `ChartProps.snapshotInterpretationVersion` (optional) + getter + đọc/ghi qua mapper.
4. Types và port tối thiểu cho content provider; `PrismaInterpretationContentProvider`.
5. Sửa `database.helper.ts` (giữ `languages`).
6. Integration test + test constraint + test roundtrip version.
7. Cập nhật tài liệu tối thiểu (Mục 24).

## 8. Out of Scope

Rule engine, derive subjects, key builders, `compareContentVersion`, lookup service, đổi use case, `ChartResponse`/OpenAPI, seed file JSON và `seed-content.ts` (M3), wiring trong `composition-root.ts` (M4), backfill chart cũ, CMS/admin API, caching, thêm ngôn ngữ ngoài `vi`, bump version `0.4.0` (làm ở M7/đóng sprint), `users.preferred_language` (xem Mục 22).

## 9. Dependencies

Không phụ thuộc milestone nào trước trong Sprint 4. Phụ thuộc: migration Sprint 3 đã tồn tại (cột `snapshot_interpretation_version`, bảng `charts`, mẫu `house_systems`). M2–M5 phụ thuộc M1 (`InterpretationSubjectType`, port, provider).

## 10. Database Schema Design

**`Language`** → `astrology.languages` (DB Spec §5.5):

| Prisma field | Column | Type | Ghi chú |
|---|---|---|---|
| `code` | `code` | `String @id` (TEXT) | PK, ví dụ `vi` |
| `display_name` | `display_name` | `String` | `Tiếng Việt` |
| `is_default` | `is_default` | `Boolean @default(false)` | |

Không có timestamp vì spec không có. Relation ngược: `interpretation_contents InterpretationContent[]`.

**`InterpretationContent`** → `astrology.interpretation_contents` (DB Spec §5.13):

| Prisma field | Column | Type | Default |
|---|---|---|---|
| `id` | `id` | `String @id @db.Uuid` | `dbgenerated("gen_random_uuid()")` (cùng mẫu `Chart`) |
| `subject_type` | `subject_type` | `String` | — |
| `subject_key` | `subject_key` | `String` | — |
| `language` | `language` | `String` | FK → `languages(code)` |
| `content_source` | `content_source` | `String` | `"HumanAuthored"` |
| `tone` | `tone` | `String?` | `NULL` |
| `body_text` | `body_text` | `String` | — |
| `status` | `status` | `String` | `"Published"` |
| `version` | `version` | `String` | `"1.0"` |
| `created_at` | `created_at` | `DateTime @db.Timestamptz` | `now()` |
| `updated_at` | `updated_at` | `DateTime @db.Timestamptz` | `now()` |

Relation field: `language_ref Language @relation(fields: [language], references: [code], onDelete: Restrict)`. `updated_at` theo quy ước hiện có (`@default(now())`, không `@updatedAt`; xem `schema.prisma` dòng 20, 63). `@@map("interpretation_contents")`, `@@schema("astrology")`.

**`Chart`:** không đổi schema và không đổi migration. Cột `snapshot_interpretation_version` đã có, nullable, không default (xem D-M1-01).

## 11. Constraints & Indexes

Tên được đặt tường minh theo mẫu hiện có (`<table>_<col>_fkey`, `_pkey`, `_key`, `_idx`; mọi tên ≤ 63 ký tự):

| Đối tượng | Tên | Định nghĩa |
|---|---|---|
| PK | `languages_pkey`, `interpretation_contents_pkey` | |
| FK | `interpretation_contents_language_fkey` | `language → languages(code) ON DELETE RESTRICT ON UPDATE CASCADE` (cùng kiểu `charts_house_system_fkey`) |
| CHECK | `interpretation_contents_subject_type_check` | `subject_type IN ('PlanetInSign','PlanetInHouse','AngleInSign','Aspect','PatternType','SignSummary','HouseSummary')` — thêm `AngleInSign`, giữ đủ 6 giá trị của spec (FD5) |
| CHECK | `interpretation_contents_content_source_check` | `IN ('HumanAuthored','AIGenerated','Hybrid')` |
| CHECK | `interpretation_contents_tone_check` | `tone IS NULL OR tone IN ('Neutral','Encouraging','Direct')` |
| CHECK | `interpretation_contents_status_check` | `IN ('Draft','Published','Archived')` |
| UNIQUE expression index | `interpretation_contents_subject_language_version_tone_key` | `(subject_type, subject_key, language, version, COALESCE(tone, ''))` — spec §7 |
| Partial index | `interpretation_contents_published_lookup_idx` | `(subject_type, subject_key, language, version) WHERE status = 'Published'` — spec §7 |
| Partial unique | `languages_single_default_key` | `UNIQUE (is_default) WHERE is_default = true` — spec §5.5/§7 |

**Phân tích index (không thêm index suy đoán):**

- *UNIQUE expression:* chặn trùng nội dung theo `(type,key,language,version,tone)`, `COALESCE` làm hai dòng `tone = NULL` cùng khoá vẫn bị coi là trùng. Prisma không biểu diễn được → viết tay trong SQL.
- *Partial lookup:* phục vụ truy vấn của M4 `WHERE language = $1 AND version = $2 AND status = 'Published' AND (subject_type, subject_key) IN (...)`. Nó là tiền tố của index UNIQUE ở trên (cùng 4 cột đầu) nên về mặt đọc **gần như trùng lặp**; giữ lại vì spec §7 yêu cầu và bảng nhỏ (hàng trăm đến vài nghìn dòng) nên chi phí không đáng kể. Không bỏ nếu chưa có quyết định đổi spec.
- *`languages` partial unique:* chỉ bảo đảm một ngôn ngữ mặc định.
- *Truy vấn "các version Published của một ngôn ngữ"* (`WHERE language = $1 AND status = 'Published'`) không có index riêng: bảng nhỏ, quét tuần tự chấp nhận được. Không thêm index.

**Schema Prisma và drift:** khai báo `@@index([subject_type, subject_key, language, version], map: "interpretation_contents_published_lookup_idx")` trong `schema.prisma` (cùng cách `charts` khai báo index thường còn SQL thêm `WHERE`). Bắt buộc có `map:` vì tên mặc định của Prisma dài 67 ký tự, vượt giới hạn 63 của PostgreSQL. UNIQUE expression, CHECK và partial unique của `languages` không khai báo trong Prisma. Theo `prisma/README.md`, **không để Prisma tự tạo migration "sửa" các index này**.

## 12. Chart Version Persistence

Đường đi, theo code thật:

```
Chart (domain)                 chart.entity.ts       + snapshotInterpretationVersion?: string | null (ChartProps), getter trả null khi thiếu
   ↓
ChartBuilder                   chart-builder.ts      KHÔNG đổi ở M1 (prop optional; M4 sẽ truyền version)
   ↓
PrismaChartMapper.toPersistence prisma-chart.mapper.ts  dòng 210: thay `null` bằng `chart.snapshotInterpretationVersion`, bỏ comment "M5-T04"
PrismaChartMapper.toDomain      prisma-chart.mapper.ts  dòng ~164: truyền `record.snapshot_interpretation_version`
   ↓
PrismaChartRepository          prisma-chart.repository.ts  KHÔNG đổi (save dùng toPersistence, findById/listByUserId dùng toDomain)
   ↓
PostgreSQL                     charts.snapshot_interpretation_version TEXT NULL (đã có)
```

- **Tên:** entity `snapshotInterpretationVersion`; Prisma/DB `snapshot_interpretation_version` (TEXT, nullable, không default).
- **Optional:** làm `snapshotInterpretationVersion?` (không bắt buộc) để không phải sửa các test hiện có tạo `ChartProps` (xem D-M1-02). Constructor lưu bằng `?? null`.
- **Immutable:** `Chart` đóng băng; không thêm setter. Version chỉ được đặt lúc tạo/reconstitute (M4 sẽ truyền vào builder).
- **Chart cũ:** cột đã nullable, không có thay đổi DB nên chart cũ đọc ra `null` và hợp lệ. Không backfill.
- `listByUserId` cũng dùng `toDomain` nên tự nhận field mới; `ChartSummaryResponse` không đổi.

## 13. Interpretation Content Persistence

Tạo `domain/types/interpretation.types.ts` (tối thiểu cho M1, M2 sẽ mở rộng):

- `INTERPRETATION_SUBJECT_TYPES` (7 giá trị như CHECK) và type `InterpretationSubjectType`.
- `InterpretationContentStatus = 'Draft' | 'Published' | 'Archived'`; `InterpretationTone = 'Neutral' | 'Encouraging' | 'Direct'`; `InterpretationContentSource`.
- `InterpretationContentRecord { subjectType, subjectKey, language, tone: InterpretationTone | null, bodyText, version, status, contentSource }`.
- `InterpretationSubjectRef { subjectType, subjectKey }` — dùng cho tham số lookup.

Không có key builder, không có `derive` (M2).

**Latest Published version:** DB cột `version` là TEXT nên `ORDER BY version` sai (`'1.10' < '1.9'`). Provider M1 chỉ trả **danh sách version Published phân biệt** của một ngôn ngữ; M2 sẽ có `compareContentVersion` để chọn bản mới nhất. Một version được coi là "Published" nếu có ít nhất một dòng `status = 'Published'`; tính đầy đủ của bộ nội dung do validator của M3 bảo đảm (đúng với "Business Constraint" ở DB Spec §5.13 vốn enforce ở tầng ứng dụng).

## 14. Seed Strategy

`vi` được seed **trong migration** bằng `INSERT … ON CONFLICT ("code") DO NOTHING`:

```
INSERT INTO "astrology"."languages" ("code","display_name","is_default") VALUES ('vi','Tiếng Việt',true) ON CONFLICT ("code") DO NOTHING;
```

Lý do (xem D-M1-04): `house_systems` đã dùng đúng cách này; CI và test chỉ chạy `prisma:deploy`, **không chạy** `prisma:seed`, nên nếu `vi` chỉ nằm ở `seed.ts` thì FK của mọi test nội dung sẽ lỗi. `prisma/seed.ts` giữ nguyên (chỉ seed admin), không tạo hệ thống seed thứ hai.

Idempotency: migration chạy một lần; `ON CONFLICT DO NOTHING` + PK `code` bảo đảm chạy lại tay không tạo dòng thừa; test kiểm tra điều này bằng cách chạy lại đúng câu INSERT và đếm dòng.

Pipeline seed nội dung (file JSON, validator 252 key) **không thuộc M1** (thuộc M3).

## 15. Database Helper Changes

- **File:** `backend/tests/helpers/database.helper.ts`.
- **Hành vi hiện tại:** dòng 26 bỏ qua `_prisma_migrations` và `house_systems`; mọi bảng khác bị `TRUNCATE ... CASCADE`.
- **Vấn đề cụ thể:** `languages` sẽ chứa `vi` do migration. Nếu `clearDatabase()` truncate bảng này (và `CASCADE` kéo theo `interpretation_contents`) thì sau lần gọi đầu tiên `vi` biến mất và mọi insert nội dung sau đó fail FK. Hành vi này ảnh hưởng toàn bộ test suite vì `clearDatabase()` được dùng chung.
- **Thay đổi:** thêm `languages` vào danh sách bảng reference được giữ lại (khuyến nghị gom thành một hằng số `PRESERVED_TABLES`), **không** loại `interpretation_contents` (phải truncate giữa các test để cô lập).
- **Tác động test:** không test hiện có nào phụ thuộc việc `languages` bị xoá (bảng chưa tồn tại). Test mới kiểm tra `vi` còn sau `clearDatabase()`.

## 16. Migration Strategy

- **Tên:** `20261004120000_init_interpretation_content_bank` (tên **mới**, timestamp sau migration cuối `20260831120000`); đường dẫn `backend/prisma/migrations/20261004120000_init_interpretation_content_bank/migration.sql`.
- **Thứ tự SQL:** (1) `CREATE TABLE astrology.languages`; (2) `CREATE UNIQUE INDEX languages_single_default_key … WHERE is_default = true`; (3) `INSERT vi`; (4) `CREATE TABLE astrology.interpretation_contents` kèm 4 CHECK; (5) FK `interpretation_contents_language_fkey`; (6) UNIQUE expression index; (7) partial index.
- **An toàn với dữ liệu hiện có:** migration thuần additive, **không** `ALTER`/`UPDATE` bảng `charts` hay bảng khác; không giả định DB rỗng.
- **Cách tạo file:** Prisma không sinh được CHECK/expression/partial index, nên quy trình là cập nhật `schema.prisma`, sinh migration bằng `npm run prisma:migrate` (hoặc `--create-only` qua CLI), rồi **chỉnh tay SQL** theo bảng Mục 11 và xoá mọi dòng cố "sửa" index theo cảnh báo trong `prisma/README.md`. Không sửa migration đã có.
- **Rollback:** Prisma không có down-migration; migration additive nên rollback ở dev là `npm run db:reset`, ở môi trường có dữ liệu là forward-fix (tạo migration mới). Chưa có dữ liệu production phụ thuộc bảng mới.

**Kiểm chứng migration (lệnh thật):** `npm run prisma:generate`, `npx prisma validate` (Prisma CLI, không phải script npm), `npm run prisma:deploy` trên DB sạch; `npm run db:reset` (huỷ dữ liệu, chỉ dev) để dựng lại từ đầu. Với "chart cũ vẫn hợp lệ": chạy `prisma:deploy` trên DB dev có sẵn chart và đối chiếu số dòng `astrology.charts` trước/sau (`psql` có sẵn hay không là `UNVERIFIED`). Đồng bộ schema: chạy `npx prisma migrate diff` giữa migrations và `schema.prisma`; kết quả mong đợi chỉ gồm các drift đã được tài liệu hoá trong `prisma/README.md` (hành vi chính xác với expression index là `UNVERIFIED` cho tới khi chạy).

## 17. Repository Design

**Port (domain):** `backend/src/modules/chart/domain/ports/interpretation-content-provider.port.ts` — tên `IInterpretationContentProvider` theo Architecture Spec. **Chỉ có hàm đọc:**

- `findPublishedVersions(language: string): Promise<string[]>` — các version phân biệt có ít nhất một dòng `Published`; không có thì `[]`.
- `findPublishedContents(language: string, version: string, subjects: readonly InterpretationSubjectRef[]): Promise<InterpretationContentRecord[]>` — lọc `language`, `version`, `status = 'Published'`, `tone IS NULL`, và tập `(subject_type, subject_key)`; không khớp thì `[]`; `subjects` rỗng thì trả `[]` mà không truy vấn.

**Implementation (infrastructure):** `backend/src/modules/chart/infrastructure/repositories/prisma-interpretation-content.provider.ts` — `PrismaInterpretationContentProvider implements IInterpretationContentProvider`, constructor nhận `PrismaClient` (cùng mẫu `PrismaChartRepository`). Thêm `insertMany(records)` **chỉ trên class cụ thể, không đưa vào port**: nó phục vụ test và seed của M3, và việc không đưa vào port bảo đảm tầng application không có đường ghi nội dung. Dùng `createMany` (không `skipDuplicates`, để trùng lặp bị DB từ chối), một câu lệnh nên nguyên tử.

**Lỗi (FD12):** mọi lỗi Prisma được bọc `InfrastructureError` với `cause`, đúng mẫu `PrismaChartRepository`. Không có `catch` nào trả `[]`. Phân biệt: không có dòng → `[]`; lỗi DB → ném `InfrastructureError`.

**Không wiring trong M1:** không sửa `composition-root.ts` (provider chưa có consumer; wiring ở M4). Dùng Prisma API có tham số, không raw SQL trong provider.

## 18. Integration Test Strategy

Theo quy ước test hiện có (`new PrismaClient()`, `clearDatabase` ở `beforeEach`, `InfrastructureError` khi vi phạm). Fixture cố định: `Sun_in_Leo` (`PlanetInSign`), `Sun_in_House_7` (`PlanetInHouse`), `Ascendant_in_Leo` (`AngleInSign`), `bodyText` ngắn, version `'1.0'`/`'2.0'`.

**File mới:** `backend/tests/integration/modules/chart/repositories/prisma-interpretation-content.provider.test.ts`

| Nhóm | Case |
|---|---|
| Language | `vi` có sau migration; vẫn còn sau `clearDatabase()`; chạy lại câu INSERT không tạo dòng thứ hai; chèn thêm `is_default = true` thứ hai bị từ chối; PK trùng bị từ chối |
| Persist & đọc | `insertMany` ba fixture, `findPublishedContents` đọc đúng; quan hệ `language` hoạt động; lọc đúng `version`, loại `Draft`/`Archived`, loại dòng có `tone`; hai version cùng subject cùng tồn tại |
| Version | `findPublishedVersions('vi')` trả phân biệt, chỉ từ dòng Published; không có dữ liệu → `[]` |
| Failure semantics | không dòng → `[]`; với `PrismaClient` giả (stub `interpretationContent.findMany` reject, ép kiểu `as unknown as PrismaClient`) → `rejects.toThrow(InfrastructureError)`, **không** trả `[]` |
| Constraints (qua `insertMany`/`prisma` trực tiếp) | `subject_type` sai bị từ chối; `AngleInSign` được chấp nhận; `content_source`/`tone`/`status` sai bị từ chối; `language` không tồn tại bị từ chối (FK); trùng `(type,key,language,version)` với `tone = NULL` bị từ chối (chứng minh `COALESCE`); cùng khoá nhưng `tone` khác được chấp nhận |
| Tên đối tượng | truy vấn `pg_constraint`/`pg_indexes` xác nhận các tên ở Mục 11 tồn tại |

**Mở rộng test hiện có:**
- `prisma-chart.repository.test.ts`: chart không truyền version → `findById` trả `null`; chart có `'1.0'` → roundtrip đúng và các field khác không đổi; `save` hai chart (null và có version).
- `chart.entity.test.ts`: getter trả `null` khi thiếu prop, trả đúng giá trị khi có; `Chart.create` với version vẫn pass các invariant.

**Không** seed 252 mục. Regression: toàn bộ test chart và identity/birth-profile phải xanh, không sửa kỳ vọng của test cũ.

## 19. File Change Map

**Create**
- `backend/prisma/migrations/20261004120000_init_interpretation_content_bank/migration.sql`
- `backend/src/modules/chart/domain/types/interpretation.types.ts`
- `backend/src/modules/chart/domain/ports/interpretation-content-provider.port.ts`
- `backend/src/modules/chart/infrastructure/repositories/prisma-interpretation-content.provider.ts`
- `backend/tests/integration/modules/chart/repositories/prisma-interpretation-content.provider.test.ts`

**Modify**
- `backend/prisma/schema.prisma` (thêm 2 model; `Chart` không đổi)
- `backend/src/modules/chart/domain/entities/chart.entity.ts` (prop optional + getter)
- `backend/src/modules/chart/infrastructure/mappers/prisma-chart.mapper.ts` (dòng ~164 và ~210)
- `backend/tests/helpers/database.helper.ts`
- `backend/tests/integration/modules/chart/repositories/prisma-chart.repository.test.ts`
- `backend/tests/unit/modules/chart/domain/entities/chart.entity.test.ts`
- `docs/database/Database_Design_Specification.md` (§5.13, §5.5 — Mục 24)
- `backend/prisma/README.md` (Mục 24)

**Inspect only**
- `backend/src/modules/chart/domain/engine/chart-builder.ts`, `domain/ports/chart-repository.port.ts`, `infrastructure/repositories/prisma-chart.repository.ts`
- `backend/src/shared/errors/app-error.ts`, `backend/src/composition-root.ts`
- `backend/prisma/seed.ts`, `backend/prisma/migrations/20260830120000_init_house_system/migration.sql`, `20260831120000_init_chart_module/migration.sql`
- `backend/tests/fixtures/prisma-test.factory.ts`, `backend/vitest.config.ts`, `.github/workflows/backend-ci.yml`, `.github/workflows/frontend-ci.yml`
- `backend/tests/unit/modules/chart/presentation/mappers/chart-response.mapper.test.ts`, `chart-summary-response.mapper.test.ts` (phải vẫn pass nhờ prop optional)

## 20. Task Breakdown

### Task 1 — Schema, Migration & Seed
- **Mục tiêu:** hai bảng, constraint, index, `vi` có trong DB sạch.
- **Files:** `schema.prisma`, migration mới (Mục 16).
- **Chi tiết:** model theo Mục 10; SQL theo Mục 11/14/16; chỉnh tay SQL, bỏ các dòng drop index.
- **Phụ thuộc:** không.
- **Test:** `prisma:generate`, `prisma validate`, `prisma:deploy` trên DB sạch; chạy lại trên DB có dữ liệu.
- **Acceptance:** AC1–AC7 (Mục 25).

### Task 2 — Repository Persistence & Test Infrastructure
- **Mục tiêu:** đường đọc/ghi version của Chart, provider nội dung, helper, test.
- **Files:** `chart.entity.ts`, `prisma-chart.mapper.ts`, 3 file mới ở `domain/` và `infrastructure/`, `database.helper.ts`, 3 file test.
- **Chi tiết:** Mục 12, 13, 15, 17, 18.
- **Phụ thuộc:** Task 1 (cần client đã generate và migration đã deploy).
- **Test:** toàn bộ Mục 18.
- **Acceptance:** AC8–AC14.

## 21. Decision Log

| ID | Quyết định | Lý do/Nguồn |
|---|---|---|
| D-M1-01 | **Không thêm/alter cột `charts.snapshot_interpretation_version`**; công việc Chart chỉ nằm ở entity + mapper | Cột đã có trong migration `20260831120000` và `schema.prisma` dòng 96. Prompt M1 (mục 16 bước 5, mục 10) giả định cần thêm; thực tế không |
| D-M1-02 (A2 approved) | `ChartProps.snapshotInterpretationVersion` là **optional** | Bốn nhóm test hiện có tạo `ChartProps` bằng spread; prop bắt buộc sẽ làm vỡ typecheck test và buộc sửa hàng loạt. Getter chuẩn hoá về `null` |
| D-M1-03 | Tên field: entity camelCase, Prisma/DB snake_case | Quy ước hiện có của repo (prompt dùng camelCase cho Prisma, không đúng thực tế) |
| D-M1-04 (A1 approved with documented deviation) | `vi` seed bằng `INSERT … ON CONFLICT DO NOTHING` **trong migration**, không thêm vào `prisma/seed.ts` | Tiền lệ `house_systems`; CI/test không chạy `prisma:seed`. **Lệch DB Spec** (mục Seed Data trong phần Migration, dòng 683: "seed script riêng, `vi`/`en`") — cần ghi nhận; FD7 giữ `vi` duy nhất nên `en` không seed |
| D-M1-05 | Tên constraint/index tường minh (Mục 11); partial index dùng `map:` | Tên mặc định của Prisma dài 67 ký tự > 63 |
| D-M1-06 | Port chỉ đọc; `insertMany` chỉ ở class Prisma | Không để tầng application có đường ghi nội dung (Mục 23 prompt); seed M3 là infrastructure |
| D-M1-07 | Provider trả danh sách version, không tự chọn "mới nhất" | `version` là TEXT; so sánh theo số cần `compareContentVersion` (M2) |
| D-M1-08 | `updated_at` giữ `@default(now())`, không `@updatedAt` | Quy ước hiện có |
| D-M1-09 | Không wiring `composition-root.ts` và không sửa `ChartBuilder` ở M1 | Chưa có consumer; tránh thay đổi hành vi |
| D-M1-10 | Không thêm CHANGELOG/bump `0.4.0` ở M1 | Bump thực hiện khi đóng Sprint 4 (R4); nội dung CHANGELOG hiện tại chưa mở trong audit |
| D-M1-11 (A3 approved) | Giữ partial index lookup dù trùng tiền tố với UNIQUE index | Spec §7 yêu cầu; bảng nhỏ; không đổi spec khi chưa có quyết định |
| D-M1-12 | Failure test dùng PrismaClient stub, không "ép hỏng" DB thật | Phù hợp kiến trúc test hiện có; yêu cầu "nếu khả thi" của prompt |

Frozen decisions FD1–FD12 không bị đổi.

## 22. Open Questions

Không còn câu hỏi nào chặn M1. Các xác nhận của project owner:

| ID | Quyết định | Ghi chú triển khai |
|---|---|---|
| A1 | **Approve with documented deviation** | `vi` được bootstrap trong migration thay vì seed script riêng (precedent `house_systems`, CI hiện chỉ chạy `prisma:deploy`). `en` không seed (FD7). **DB Spec phải được cập nhật/ghi chú để phản ánh deviation này** (Mục 24, bắt buộc, không tuỳ chọn) |
| A2 | **Approve** | `ChartProps.snapshotInterpretationVersion` optional; getter/domain state chuẩn hoá về `string \| null`; không backfill; không đổi DB column |
| A3 | **Approve** | Giữ partial index Published dù trùng tiền tố với UNIQUE expression index (khác semantics: phục vụ Published lookup; DB Spec §7 yêu cầu) |
| A4 | **DEFERRED** | `users.preferred_language` không thuộc M1. Ghi Known Gap / spec-code discrepancy; xem lại khi multi-language hoặc user preference thực sự vào scope |

**Ghi nhận cho đóng sprint:** DB Spec (dòng 230, bảng `users`) mô tả `users.preferred_language` với FK tới `languages(code)`, nhưng `schema.prisma` và migration hiện tại không có cột này. Mục này phải xuất hiện trong Sprint 4 Known Gaps Registry (mã dự kiến `KG-S4-08`, loại: spec-code discrepancy / deferred).

## 23. Risks

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Quên sửa `database.helper.ts` → `vi` bị xoá sau lần `clearDatabase()` đầu, FK fail dây chuyền | Cao | Task 2 sửa helper; test "vi còn sau clearDatabase" |
| Prisma `migrate dev` sinh SQL drop index viết tay | Trung bình | Quy trình `prisma/README.md`; review SQL; chạy `migrate diff` |
| Tên index dài > 63 ký tự bị cắt | Trung bình | `map:` tường minh, kiểm tra bằng `pg_indexes` |
| Lỗi unique của expression index không được Prisma ánh xạ thành `P2002` | Thấp | Test chỉ khẳng định `InfrastructureError`/ném lỗi, không khẳng định mã Prisma (hành vi chính xác: `UNVERIFIED`) |
| Typecheck test vỡ do prop mới | Thấp | Prop optional (D-M1-02) |
| Import thiếu đuôi `.js` (ESM NodeNext) | Thấp | Theo mẫu file hiện có; `npm run typecheck`/`build` bắt lỗi |
| Client Prisma chưa generate trên máy local | Thấp | `npm run prisma:generate` là bước đầu của Task 1 (CI đã có) |
| Sandbox của Claude không chạy được Postgres | Trung bình | Log migration/test phải do owner chạy; Evidence Matrix ghi tách nguồn |

## 24. Documentation Changes

Chỉ những gì M1 cần:

- `docs/database/Database_Design_Specification.md` §5.13: thêm `AngleInSign` vào CHECK `subject_type` (FD5); §5.5 và mục Seed Data (dòng 683): ghi rõ **deviation đã được duyệt (A1)**: MVP bootstrap `vi` trong migration, không dùng seed script riêng, `en` không seed (FD7). Bắt buộc, thuộc Definition of Done.
- `docs/database/Database_Design_Specification.md` bảng `users` (dòng 230): ghi chú `preferred_language` hiện chưa được triển khai trong code (A4, deferred); không thêm cột.
- `backend/prisma/README.md`: nêu hai bảng mới nằm ở schema `astrology` và hai index viết tay mới (mục cảnh báo drift).
- Sprint 4 Implementation Plan: không sửa nội dung; chỉ tham chiếu file này nếu muốn.
- `CHANGELOG.md`, README gốc/backend: **không đổi ở M1** (D-M1-10; quy ước README theo sprint chưa được kiểm tra: `UNVERIFIED`).

Mọi lệch spec được ghi ở Decision Log: D-M1-01, D-M1-04, và `AngleInSign`.

## 25. Acceptance Criteria

1. Bảng `astrology.languages` tồn tại đúng spec §5.5 (3 cột).
2. Bảng `astrology.interpretation_contents` tồn tại đúng spec §5.13 (11 cột).
3. Sau `prisma:deploy` trên DB sạch, `languages` có đúng một dòng `vi`.
4. CHECK `subject_type` chấp nhận `AngleInSign` và 6 giá trị của spec, từ chối giá trị khác.
5. Có đủ các index/constraint đúng tên ở Mục 11.
6. FK `language → languages(code)` và UNIQUE expression index hoạt động (test từ chối dữ liệu sai/trùng).
7. `prisma:deploy` trên DB có sẵn chart không làm thay đổi `astrology.charts`; chart cũ đọc ra `snapshotInterpretationVersion = null`.
8. `charts.snapshot_interpretation_version` nullable (đã có); `Chart` ghi và đọc lại đúng `'1.0'` không đổi.
9. Chart tạo không truyền version được lưu và đọc là `null`; các field khác không mất.
10. `PrismaInterpretationContentProvider` ghi và đọc được fixture; lọc đúng theo `language`, `version`, `status`, `tone`.
11. Không có dòng → `[]`; lỗi DB → `InfrastructureError`, không bao giờ `[]`.
12. `database.helper.ts` giữ `languages` và vẫn truncate `interpretation_contents`.
13. Test mới và toàn bộ test hiện có đều pass.
14. Không vi phạm ranh giới: không import `@prisma`/`express` trong `chart/domain/**`; không có raw SQL trong provider; không tạo module `interpretation`; không có API ghi nội dung.

## 26. Exit Criteria

Chạy trong `backend/`. Chưa lệnh nào được chạy ở giai đoạn plan.

| Tiêu chí | Lệnh |
|---|---|
| Prisma client | `npm run prisma:generate` |
| Prisma validate | `npx prisma validate` |
| Migration (DB sạch) | `npm run prisma:deploy`; dựng lại bằng `npm run db:reset` (chỉ dev) |
| Migration (DB có dữ liệu) | `npm run prisma:deploy` trên DB dev có chart, đối chiếu số dòng `charts` trước/sau |
| Đồng bộ schema | `npx prisma migrate diff` (drift chỉ gồm các mục đã tài liệu) |
| Trạng thái DB (bảng, index, constraint, `vi`) | test introspection + truy vấn thủ công (công cụ `psql`: `UNVERIFIED`) |
| Seed | không có seed script mới; `vi` có sau `prisma:deploy`; `npm run prisma:seed` vẫn chạy được (admin) |
| Integration test mới | `npm test` (lọc theo file `prisma-interpretation-content.provider.test.ts`) |
| Regression chart/identity/birth-profile | `npm test` toàn bộ |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Format | `npm run format:check` |
| Build | `npm run build` |
| Coverage (chẩn đoán, không ngưỡng %) | `npm run test:coverage` |

Thiếu bằng chứng = `UNVERIFIED`. Không tự điền số test, log hay hash.

## 27. Definition of Done

1. Schema và migration đã triển khai, áp dụng thành công trên DB sạch và DB có dữ liệu.
2. `vi` có sau migration, chạy lại không tạo dòng thừa.
3. Provider đọc/ghi hoạt động; lỗi DB không bị nuốt.
4. Persistence version của Chart hoạt động (null và có giá trị).
5. `database.helper.ts` đã cập nhật đúng lý do.
6. Test mới pass, test cũ không bị sửa kỳ vọng.
7. Không còn TODO/FIXME chưa phân loại trong phạm vi M1.
8. Tài liệu ở Mục 24 đã cập nhật.
9. Exit Criteria có log chạy thật kèm nguồn (Claude hay owner chạy).

## 28. Evidence Matrix

Trạng thái tại thời điểm plan: **toàn bộ UNVERIFIED** (chưa chạy gì). Trạng thái cho phép: `PASS`, `FAIL`, `PARTIAL`, `UNVERIFIED`, `NOT APPLICABLE`, `DEFERRED`.

| ID | Tiêu chí | Trạng thái | Bằng chứng cần |
|---|---|---|---|
| EV-01 | `prisma validate` | UNVERIFIED | log |
| EV-02 | `prisma:deploy` DB sạch | UNVERIFIED | log |
| EV-03 | `prisma:deploy` DB có dữ liệu, `charts` không đổi | UNVERIFIED | số dòng trước/sau |
| EV-04 | Index/constraint đúng tên, `vi` tồn tại | UNVERIFIED | test introspection |
| EV-05 | `migrate diff` chỉ drift đã tài liệu | UNVERIFIED | log |
| EV-06 | Integration test provider | UNVERIFIED | log |
| EV-07 | Roundtrip version Chart | UNVERIFIED | log |
| EV-08 | Regression toàn bộ test | UNVERIFIED | log |
| EV-09 | `lint`, `typecheck`, `format:check`, `build` | UNVERIFIED | log từng lệnh |
| EV-10 | `prisma:seed` vẫn chạy | UNVERIFIED | log |
| EV-11 | Ranh giới kiến trúc (grep import) | UNVERIFIED | kết quả grep |
| EV-12 | Cập nhật tài liệu Mục 24 | UNVERIFIED | diff |

## 29. Implementation Sequence

1. `schema.prisma` + `npm run prisma:generate` + sinh/chỉnh migration (Task 1).
2. Áp dụng migration trên DB sạch; kiểm tra bảng, index, `vi`.
3. `database.helper.ts` (làm sớm để các test sau không mất `vi`).
4. `interpretation.types.ts`, port, provider (`insertMany`, hai hàm đọc).
5. `chart.entity.ts` + `prisma-chart.mapper.ts`.
6. Test mới + mở rộng test hiện có.
7. Chạy toàn bộ Exit Criteria; ghi Evidence Matrix.
8. Cập nhật tài liệu Mục 24.

## 30. Final Architect Review

- **Mâu thuẫn prompt vs repo đã xử lý:** (1) repo là ESM, không phải CommonJS; (2) cột Chart đã có sẵn nên không có thay đổi DB cho Chart; (3) Prisma dùng snake_case; (4) CI không chạy seed nên `vi` phải ở migration.
- **Không mở lại FD1–FD12;** FD7 và FD9 chỉ được làm rõ cách áp dụng.
- **Phạm vi:** chặt; nhiều hạng mục của prompt (seed JSON, version compare, wiring) được đẩy đúng sang M2–M4.
- **Điểm chưa chắc:** hành vi `prisma migrate dev`/`migrate diff` với expression index, công cụ `psql` trong môi trường của bạn, và việc quy ước README/CHANGELOG theo sprint (chưa mở). Tất cả được ghi là `UNVERIFIED`.
- **Không chặn:** `users.preferred_language` thiếu trong code (ngoài phạm vi).

## 31. Final Recommendation

`READY`

A1–A4 đã được project owner xác nhận (Mục 22). Không còn quyết định nào chặn việc triển khai; M1 bắt đầu theo Mục 29 khi có lệnh triển khai.
