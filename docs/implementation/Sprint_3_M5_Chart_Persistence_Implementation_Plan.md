# Sprint 3 — Milestone 5: Chart Persistence

## Executive Summary

M5 implement tầng persistence cho `Chart` Aggregate: 1 migration Prisma tạo `astrology.charts` + 6 bảng con, `PrismaChartRepository` implement đúng `IChartRepository` (M1), và `prisma-chart.mapper.ts` theo đúng pattern `prisma-birth-profile.mapper.ts` đã có. Toàn bộ nghiên cứu dựa trên đọc trực tiếp Database Design Specification, code thật M1–M4 (đã clone `dev`, không suy đoán).

**2 phát hiện quan trọng, đã có quyết định (Confirmation.md), cần 1 corrective task nhỏ trước khi code Mapper** (xem Mục 12, M5-T00):
1. **`fullName`/`placeName`** — CONFIRMED phương án (a): bổ sung additive vào `EngineInputBirthData` (M1) + `BirthDataSnapshot` (M4) — đây là dữ liệu snapshot có thật, chỉ bị bỏ sót khi thiết kế M1/M4, không phải redesign.
2. **`snapshot_interpretation_version`** — CONFIRMED: **không** dùng placeholder tự phát minh (`'unassigned'`). Quyết định đúng là **Database Design reconciliation**: đổi cột này thành **nullable** trong migration mới (lệch có chủ đích, có ghi chú, so với văn bản Database Design Spec hiện tại), vì Interpretation Module chưa tồn tại và chưa có domain-defined version nào — đây là Schema Decision cần ghi nhận công khai, không phải sửa âm thầm.
3. **Prerequisite `house_systems`** — CONFIRMED: tạo bảng + seed 2 hàng (`Placidus`/`WholeSign`) trực tiếp trong `migration.sql` (không qua `seed.ts`, vì CI hiện không chạy seed).

Phần còn lại của M5 (repository, transaction, test) giữ nguyên như phân tích ban đầu — không đổi.

---

## 1. Milestone Overview

Sprint 3 M1 (Domain Foundation), M2 (Adapter), M3 (Calculation Engine), M4 (BirthProfile Integration) đã đóng, verify sạch trên `dev` (commit `a8dfa49`). M5 xây tầng persistence cho `Chart` — thuần Infrastructure layer, không chạm Application/API/Frontend (Sprint 3 Backend Plan, nếu có mục M5 tương tự cấu trúc M1-M4 — **lưu ý:** không tìm thấy section "Milestone 5" chi tiết trong `Sprint_3_Natal_Chart_Module_Implementation_Plan.md` như đã có cho M1-M4; tài liệu này dùng Database Design Specification làm nguồn chính, đúng theo đúng yêu cầu Mục 2 của prompt).

M5 độc lập về code với M1–M4 theo nghĩa không sửa file nào của các milestone đó, nhưng **phụ thuộc chặt vào shape thật của `Chart`/`Planet`/`House`/`Angle`/`Aspect`/`Pattern` Entity** (M1) để viết mapper đúng.

---

## 2. Objectives

1. `astrology.charts` + 6 bảng con tồn tại đúng theo Database Design Specification §5.7–§5.12, có thể migrate trên DB sạch.
2. `PrismaChartRepository` implement đầy đủ, đúng 4 method của `IChartRepository` (M1): `save`, `findById`, `listByUserId`, `softDelete`.
3. `save()` transactional — toàn bộ 7 insert (1 charts + 6 con) trong 1 transaction, rollback hoàn toàn nếu bất kỳ insert nào fail.
4. `findById()` roundtrip 100% giá trị đã lưu, dùng `Chart.reconstitute()` (đã có sẵn ở M1, không tạo mới).
5. Domain/Application không phụ thuộc `PrismaClient`/`Prisma` namespace/generated types.
6. Nhất quán với pattern `BirthProfile` đã có, chỉ khác khi có lý do kỹ thuật rõ ràng (ghi rõ trong Mục 5).

---

## 3. Scope

### 3.1 In Scope

- Cập nhật `schema.prisma`: model `Chart`, `ChartPlanet`, `ChartHouse`, `ChartAngle`, `ChartAspect`, `ChartPattern`, `ChartPatternPlanet`, và **model `HouseSystem`** (prerequisite — xem Executive Summary điểm 2).
- 1 migration mới (raw SQL, theo đúng pattern `20260724000000_init_birth_profile_module`).
- Seed 2 hàng `house_systems` (`Placidus`, `WholeSign`) — thực hiện trực tiếp trong migration SQL (xem Mục 12, lý do tại Mục 7).
- `backend/src/modules/chart/infrastructure/mappers/prisma-chart.mapper.ts` (mới).
- `backend/src/modules/chart/infrastructure/repositories/prisma-chart.repository.ts` (mới).
- Wiring `composition-root.ts`: khởi tạo `PrismaChartRepository`, expose ra `repositories`/tương đương (xem Mục 10 — hiện `composition-root.ts` chưa có `repositories` export riêng cho `chart`, cần thêm theo đúng convention `birthProfileRepository` đã có).
- Integration test: `tests/integration/modules/chart/repositories/prisma-chart.repository.test.ts` (mới), chạy trên Postgres thật qua `docker-compose.test.yml`.
- Unit test cho mapper (nếu tách riêng, theo đúng pattern `prisma-birth-profile.mapper.test.ts`).

### 3.2 Out of Scope

- `CreateChartUseCase`, `GetChartUseCase`, `ListChartsUseCase`, `DeleteChartUseCase` — **M6**.
- HTTP Controller/Route/OpenAPI cho Chart — **M7**.
- Frontend, Chart visualization, Interpretation, AI interpretation.
- Swiss Ephemeris calculation mới, domain rule chiêm tinh mới.
- Sửa `Chart`/`Planet`/`House`/`Angle`/`Aspect`/`Pattern` Entity (M1) — **trừ khi** Open Question #1 (Mục 9) được quyết định theo hướng cần bổ sung field, và ngay cả khi đó, đây là corrective change nhỏ đã được chính prompt cho phép ("Nếu phát hiện bug trong M1–M4 ảnh hưởng trực tiếp đến persistence... chỉ sửa nếu cần thiết").
- `interpretation_contents` table (§5.13) — không thuộc 6 bảng con của Chart, không đụng.
- Redesign Database Design Specification.

---

## 4. Source of Truth & Dependencies

| Tài liệu/Code | Vai trò | Trích dẫn cụ thể |
|---|---|---|
| Database Design Specification | Authoritative cho schema | §5.7–§5.12 (Chart + 6 bảng con), §5.4 (`house_systems`, prerequisite), §6 (Relationships), §7 (Index Strategy), §8 (JSON — `warnings`), §9 (Audit & History — không `updated_at`/`deleted_at` riêng cho bảng con), §12 (Migration Strategy), §15.3/15.4 (Naming Convention) |
| `chart/domain/entities/*.ts` (M1, đã merge) | Authoritative cho shape Domain cần map | `chart.entity.ts` (có sẵn `Chart.reconstitute()` — quan trọng, xem Mục 8), `planet.entity.ts`, `house.entity.ts`, `angle.entity.ts`, `aspect.entity.ts`, `pattern.entity.ts` |
| `chart/domain/ports/chart-repository.port.ts` (M1) | Authoritative cho method signature | `IChartRepository{save, findById, listByUserId, softDelete}`, `ListChartsOptions` |
| `birth-profile/infrastructure/{repositories,mappers}/*.ts` (Sprint 2) | Pattern tham chiếu | Đã đọc trực tiếp — xem Mục 5 |
| `prisma/migrations/20260724000000_init_birth_profile_module/migration.sql` | Pattern DDL tham chiếu | Raw SQL, CHECK constraint viết tay (Prisma bản đang dùng không hỗ trợ CHECK native trong `schema.prisma`) |
| `docker-compose.test.yml`, `.github/workflows/backend-ci.yml` | Môi trường test | Postgres 16-alpine thật, port 5432, `npm run prisma:generate && npm run prisma:deploy` trước khi test |
| `shared/errors/app-error.js` | Error abstraction có sẵn | `InfrastructureError`, tái sử dụng, không tạo taxonomy mới |

**Không tìm thấy** "Sprint 3 Backend Implementation Plan §Milestone 5" chi tiết như M1-M4 đã có — tài liệu `docs/implementation/Sprint_3_Natal_Chart_Module_Implementation_Plan.md` chỉ có milestone breakdown tới đúng những gì đã confirm trước đó cho M1-M4 (đã verify bằng `grep`). Database Design Specification đóng vai trò nguồn chính cho M5, đúng theo cấu trúc prompt yêu cầu.

---

## 5. Current Architecture Context

**BirthProfile pattern reused (đọc trực tiếp `prisma-birth-profile.repository.ts`/`.mapper.ts`):**
- Repository nhận `PrismaClient` qua constructor injection — **không** tự tạo `new PrismaClient()` bên trong.
- Mọi method bọc `try/catch`, ném `InfrastructureError('<message>', {cause: error})` — message mô tả hành động, không lộ chi tiết Prisma.
- `findById()`: fetch bằng `findUnique`, sau đó `if (!record || record.deleted_at !== null) return null` — soft-delete filter **ở tầng Repository code**, không dựa vào Prisma middleware/`@@map` gì đặc biệt.
- Mapper là class với static method `toDomain`/`toPersistence`, dùng type `Prisma.<Model>GetPayload<Record<string, never>>` cho input `toDomain`.
- Domain Entity có `.reconstitute()` static factory riêng cho việc load từ DB (bỏ qua re-validate invariant, khác `.create()` dùng cho khởi tạo mới) — **`Chart` đã có sẵn `.reconstitute()` (M1, xem Mục 8)**, không cần tạo mới.
- `Decimal` (Prisma) → `number` qua `.toNumber()`; `number` → `Decimal` để Prisma tự cast (không cần `new Prisma.Decimal()` thủ công ở input, Prisma nhận `number` trực tiếp cho cột `Decimal` trong `UncheckedCreateInput`).
- Cột `TIME` (Postgres) ↔ field `{hour,minute,second}` qua `Date.UTC(1970,0,1,h,m,s)` / `getUTCHours/Minutes/Seconds()` — **áp dụng y hệt cho `charts.snapshot_birth_time`**.
- `softDelete(id, userId)`: **1 `updateMany` duy nhất** với `where:{id, user_id: userId, deleted_at: null}`, trả `result.count > 0` — ownership + idempotency check gộp làm 1 ở tầng Repository (không tách riêng `assertOwnership()` như Application layer).

**Chart-specific differences:**
- `Chart` có **6 bảng con** cần insert cùng transaction — `BirthProfile` không có bảng con nào, nên **không có pattern transaction đa-bảng để tham chiếu trực tiếp** trong code hiện tại (đây là điểm mới thật sự của M5, xem Mục 8.6).
- `Chart` **immutable sau khi tạo** (không có `update()`/`UpdateUseCase` ở Application layer nào cả, khác `BirthProfile` có `update()`) — `IChartRepository` xác nhận điều này: không có method `update` nào trong port. **Mapper Chart không cần `toUpdatePersistence()`.**
- `Chart.softDelete()` (Entity, M1) đã tồn tại — trả `Chart` mới với `deletedAt` set — nhưng `IChartRepository.softDelete(id, userId)` là method Repository-level riêng (nhận `id`/`userId` trực tiếp, không nhận `Chart` object) — **giống hệt chữ ký `BirthProfile`'s `softDelete(id, userId)`**, không phải gọi `Entity.softDelete()` rồi `save()` lại (không có method `update`/`save-existing` nào trong port cho việc này) — Repository tự thực hiện `UPDATE ... SET deleted_at = now()` trực tiếp qua Prisma, tương tự BirthProfile.
- `findById()` **không nhận `userId`** (khác `softDelete`) — xác nhận rõ: **ownership cho read-path KHÔNG phải trách nhiệm M5/Repository**, đây là Application Layer's việc (M6) — đúng yêu cầu Mục 13.9 của prompt, ghi nhận tường minh ở đây để không bị hiểu nhầm là bỏ sót.

---

## 6. Database Design

### 6.1 Chart Table — `astrology.charts`

Trích đầy đủ Database Design Specification §5.7 (19 cột) — không rút gọn, không tự suy diễn:

| Cột | Kiểu | Nullable | Default | Ghi chú |
|---|---|---|---|---|
| id | UUID | ✘ | `gen_random_uuid()` | PK |
| user_id | UUID | ✘ | — | FK → `identity.users(id)` ON DELETE CASCADE |
| birth_profile_id | UUID | ✔ | NULL | FK → `astrology.birth_profiles(id)` ON DELETE SET NULL |
| chart_type | TEXT | ✘ | `'Natal'` | CHECK `chart_type IN ('Natal')` |
| house_system | TEXT | ✘ | — | FK → `astrology.house_systems(name)` |
| is_house_data_available | BOOLEAN | ✘ | — | — |
| engine_version | TEXT | ✘ | — | — |
| calculated_at | TIMESTAMPTZ | ✘ | `now()` | — |
| warnings | JSONB | ✘ | `'[]'::jsonb` | Mảng `Warning` |
| snapshot_interpretation_version | TEXT | **✔ (CONFIRMED — schema reconciliation)** | NULL | **Lệch có chủ đích so với Database Design Spec §5.7 (vốn ghi NOT NULL)** — Interpretation Module chưa tồn tại, chưa có domain-defined version nào để gán; đổi thành nullable là quyết định đã CONFIRMED, cần đồng bộ lại vào Database Design Specification (Documentation Reconciliation Task, xem Mục 15 OQ-1.2) |
| snapshot_full_name | TEXT | ✔ | NULL | ← `Chart.engineInput.birthData.fullName` (mới, xem M5-T00) |
| snapshot_birth_date | DATE | ✘ | — | ← `Chart.engineInput.birthData.birthDate` |
| snapshot_birth_time | TIME | ✔ | NULL | ← `Chart.engineInput.birthData.birthTime` |
| snapshot_is_birth_time_known | BOOLEAN | ✘ | — | ← `Chart.engineInput.birthData.isBirthTimeKnown` |
| snapshot_place_name | TEXT | ✘ | — | ← `Chart.engineInput.birthData.placeName` (mới, xem M5-T00) |
| snapshot_latitude | NUMERIC(9,6) | ✘ | — | ← `Chart.engineInput.birthData.latitude` |
| snapshot_longitude | NUMERIC(9,6) | ✘ | — | ← `Chart.engineInput.birthData.longitude` |
| snapshot_timezone_id | TEXT | ✘ | — | ← `Chart.engineInput.birthData.timezoneId` |
| created_at | TIMESTAMPTZ | ✘ | `now()` | ← `Chart.createdAt` |
| deleted_at | TIMESTAMPTZ | ✔ | NULL | ← `Chart.deletedAt` |

**CHECK constraints:** `chk_charts_chart_type`, `chk_charts_birth_time_known` (`snapshot_is_birth_time_known = true OR snapshot_birth_time IS NULL`).

### 6.2 Six Child Tables

```text
astrology.charts
├── astrology.chart_planets           (Planet, Domain Spec 5.4)
├── astrology.chart_houses            (House, Domain Spec 5.8)
├── astrology.chart_angles            (Angle, Domain Spec 5.10)
├── astrology.chart_aspects           (Aspect, Domain Spec 5.11)
├── astrology.chart_patterns          (Pattern, Domain Spec 5.12)
└── astrology.chart_pattern_planets   (junction Pattern↔Planet, Domain Spec 5.12)
```

Cấu trúc chi tiết từng bảng — trích nguyên §5.8–§5.12 (không rút gọn):

**`chart_planets`**: `id`(PK), `chart_id`(FK CASCADE), `name`(CHECK 14 giá trị), `category`(CHECK IN `Personal,Social,Outer,Point`), `longitude` NUMERIC(6,3) (CHECK `[0,360)`), `latitude` NUMERIC(6,3) nullable, `speed` NUMERIC(9,5), `is_retrograde` BOOLEAN (CHECK: Sun/Moon → false), `sign` TEXT (CHECK 12 giá trị), `degree_in_sign` NUMERIC(5,2) (CHECK `[0,30)`), `house_number` INTEGER nullable (composite FK → `chart_houses(chart_id, number)`). `UNIQUE(chart_id, name)`.

**`chart_houses`**: `id`(PK), `chart_id`(FK CASCADE), `number` INTEGER (CHECK `[1,12]`), `cusp_degree` NUMERIC(6,3) (CHECK `[0,360)`), `sign_on_cusp` TEXT (CHECK 12 giá trị). `UNIQUE(chart_id, number)` — **bắt buộc** (target của composite FK từ `chart_planets`, không chỉ PK `id`).

**`chart_angles`**: `id`(PK), `chart_id`(FK CASCADE), `type` TEXT (CHECK IN `Ascendant,Midheaven,Descendant,ImumCoeli`), `longitude` NUMERIC(6,3) (CHECK `[0,360)`), `sign` TEXT (CHECK 12 giá trị), `degree_in_sign` NUMERIC(5,2) (CHECK `[0,30)`). `UNIQUE(chart_id, type)`.

**`chart_aspects`**: `id`(PK), `chart_id`(FK CASCADE), `planet_a` TEXT, `planet_b` TEXT (không FK sang `chart_planets` — denormalization có chủ đích, §5.11 Design Rationale), `aspect_type` TEXT (CHECK 5 giá trị), `exact_angle` NUMERIC(6,3), `orb` NUMERIC(5,3), `is_applying` BOOLEAN, `nature` TEXT (CHECK IN `Harmonious,Challenging,Neutral`). `CHECK(planet_a <> planet_b)`, `CHECK(planet_a < planet_b)`, `UNIQUE(chart_id, planet_a, planet_b)`.

**`chart_patterns`**: `id`(PK), `chart_id`(FK CASCADE), `pattern_type` TEXT (**không CHECK cứng** — Open/Closed cho detector tương lai), `created_at` TIMESTAMPTZ.

**`chart_pattern_planets`** (junction): `pattern_id`(composite PK, FK CASCADE → `chart_patterns`), `planet_id`(composite PK, FK CASCADE → `chart_planets`).

**Lưu ý quan trọng — M3 D-14 (Pattern algorithm deferred):** `PatternCalculator` (M3, đã merge) **luôn trả `[]`** — nghĩa là `chart_patterns`/`chart_pattern_planets` sẽ **luôn rỗng** cho mọi Chart thật ở giai đoạn này. M5 vẫn phải tạo đúng 2 bảng này (schema phải sẵn sàng cho khi Pattern algorithm được implement ở milestone sau), nhưng **không có dữ liệu thật nào để test ngoài trường hợp rỗng** — ghi rõ trong Mục 11 Testing Strategy để tránh hiểu nhầm là thiếu test.

### 6.3 Relationships

Trích §6: `Chart→Planet/House/Angle/Aspect/Pattern` = 1–N, `ON DELETE CASCADE` (con "sống chết cùng" cha). `Pattern↔Planet` = N–M qua junction, `ON DELETE CASCADE` cả 2 chiều. `User→Chart` = 1–N CASCADE. `BirthProfile→Chart` = 1–N **lỏng**, `ON DELETE SET NULL` (Quyết định 14.8 — xóa BirthProfile không ảnh hưởng Chart, vì dữ liệu thật nằm ở `snapshot_*`).

### 6.4 Constraints

Đầy đủ ở Mục 6.1/6.2 trên — tổng hợp: 2 CHECK trên `charts`, 5 CHECK trên `chart_planets`, 2 CHECK trên `chart_houses`, 2 CHECK trên `chart_angles`, 3 CHECK+UNIQUE trên `chart_aspects`, 0 CHECK trên `chart_patterns`/`chart_pattern_planets` (chỉ FK).

### 6.5 Indexes

Trích §7: `idx_charts_user_id_calculated_at` (composite, partial `WHERE deleted_at IS NULL`, phục vụ `GET /charts` — dù M7 chưa code, index vẫn tạo ở M5 vì thuộc schema), `idx_charts_birth_profile_id` (partial), `idx_chart_planets_chart_id`, `uq_chart_planets_chart_id_name`, `uq_chart_houses_chart_id_number`, `uq_chart_angles_chart_id_type`, `idx_chart_aspects_chart_id`, `idx_chart_patterns_chart_id`, `idx_chart_pattern_planets_planet_id`.

### 6.6 Soft Delete

**Chỉ `charts.deleted_at` tồn tại** — 6 bảng con **không có cột `deleted_at` riêng** (Database Design Spec §9 xác nhận tường minh: *"riêng chart_planets/chart_houses/... không cần cột riêng, tính 'đã xóa' được suy ra từ charts.deleted_at của cha"*). `findById()` chỉ cần check `charts.deleted_at IS NULL` — nếu Chart cha đã soft-delete, **không cần** filter riêng ở 6 bảng con (chúng vẫn còn nguyên trong DB, chỉ đơn giản là Repository không trả về vì cha đã bị coi là "không tồn tại").

### 6.7 Ownership

`charts.user_id` NOT NULL (khác `birth_profile_id` nullable) — Chart **luôn có chủ sở hữu** vì chỉ Chart có `save=true` mới được persist (Guest/transient không bao giờ vào DB — REST API Spec §4.4, đã trích ở §5.7 Design Rationale). Repository-level ownership enforcement: chỉ `softDelete(id, userId)` (giống BirthProfile). `findById()` không enforce ownership (Mục 5).

---

## 7. Prisma Schema & Migration Plan

**Schema Decision cần ghi nhận công khai — `snapshot_interpretation_version` nullable (CONFIRMED):** Database Design Specification §5.7 hiện ghi cột này là NOT NULL, nhưng vì Interpretation Module chưa tồn tại và không có domain-defined version nào hợp lệ để gán, migration mới **cố ý** khai báo cột này `NULL`-able, kèm comment trong migration.sql trích rõ lý do + tham chiếu Confirmation quyết định này. **Documentation Reconciliation Task** (không thuộc code M5, nhưng cần ghi lại): cập nhật Database Design Specification §5.7 để phản ánh đúng `snapshot_interpretation_version TEXT NULLABLE`, cùng nhóm với các Reconciliation Task khác đã tồn tại trong dự án (PRD FR-02, `EngineInput`/`utcDateTime` ở M3). Mapper sẽ luôn ghi `null` cho cột này ở M5 (Domain chưa có nguồn dữ liệu) — không phải "quên", mà là hệ quả trực tiếp của quyết định schema này.

**Prerequisite bắt buộc — model `HouseSystem` (§5.4):** `schema.prisma` hiện **chưa có** model này, nhưng `Chart.house_system` cần FK tới nó. Không tạo được `charts` table hợp lệ nếu thiếu bảng này trước. Đề xuất thêm model tối giản đúng §5.4 (`name` PK, `requires_precise_birth_time`, `supports_polar_latitudes`, `is_active` default `true`) — **đây là bổ sung nhỏ, không phải mở rộng scope**, vì không có cách nào tạo FK hợp lệ tới bảng không tồn tại.

**Seed 2 hàng `house_systems` ở đâu?** CI hiện tại (`backend-ci.yml`) chỉ chạy `prisma:generate` + `prisma:deploy`, **không chạy** `prisma db seed`. Nếu để 2 hàng `Placidus`/`WholeSign` phụ thuộc seed script riêng, Integration Test (M5) và tương lai M6/M7 sẽ fail ở CI vì FK không thỏa. **Đề xuất:** insert 2 hàng này trực tiếp bằng `INSERT` tại cuối file `migration.sql` mới (không phải qua `seed.ts`) — đảm bảo tồn tại ngay sau `prisma:deploy`, không phụ thuộc bước CI riêng nào khác. Đây là Implementation Detail hợp lý, không phải quyết định domain.

**File thay đổi:**
- `backend/prisma/schema.prisma` — thêm model `HouseSystem`, `Chart`, `ChartPlanet`, `ChartHouse`, `ChartAngle`, `ChartAspect`, `ChartPattern`, `ChartPatternPlanet`.
- Migration mới: `backend/prisma/migrations/<timestamp>_init_chart_module/migration.sql` — raw SQL, theo đúng pattern BirthProfile migration (CHECK viết tay bằng `ALTER TABLE ADD CONSTRAINT`, không dùng cú pháp CHECK native trong `schema.prisma` vì bản Prisma đang dùng không hỗ trợ).

**Thứ tự tạo bảng trong migration (foreign-key dependency, bắt buộc đúng thứ tự):**
```
1. astrology.house_systems         (không phụ thuộc bảng nào trong migration này)
2. astrology.charts                (phụ thuộc: identity.users, astrology.birth_profiles, astrology.house_systems)
3. astrology.chart_houses          (phụ thuộc: charts)
4. astrology.chart_planets         (phụ thuộc: charts, chart_houses — composite FK)
5. astrology.chart_angles          (phụ thuộc: charts)
6. astrology.chart_aspects         (phụ thuộc: charts)
7. astrology.chart_patterns        (phụ thuộc: charts)
8. astrology.chart_pattern_planets (phụ thuộc: chart_patterns, chart_planets)
```
`chart_houses` phải tạo **trước** `chart_planets` vì `chart_planets.house_number` có composite FK trỏ tới `chart_houses(chart_id, number)`.

**Clean DB verification:** `npm run prisma:migrate` (dev) hoặc `npm run prisma:deploy` (CI) chạy trên DB rỗng (`docker-compose.test.yml`) → verify bằng `\dt astrology.*` (8 bảng mới xuất hiện, cộng bảng đã có) + integration test tự động fail nếu bảng/constraint sai.

**Existing DB verification:** Migration mới **không `ALTER`/`DROP`** bất kỳ bảng nào của `identity`/`birth_profiles` đã có — chỉ `CREATE TABLE` mới + 1 `ALTER TABLE ... ADD CONSTRAINT` cho FK tới `identity.users`/`astrology.birth_profiles` (không đổi cấu trúc 2 bảng đó).

**Rollback:** Dự án hiện dùng chính sách "forward-only" (Database Design Spec §12: *"không sửa migration đã chạy... chỉ tạo migration mới để sửa lỗi"*) — **không** tự thêm cơ chế rollback mới nào ngoài quy ước này.

---

## 8. Repository Implementation

### 8.1 `IChartRepository` (đã có, M1 — không đổi)

```typescript
interface IChartRepository {
  save(chart: Chart): Promise<void>;
  findById(id: string): Promise<Chart | null>;
  listByUserId(userId: string, options: ListChartsOptions): Promise<{items: Chart[]; total: number}>;
  softDelete(id: string, userId: string): Promise<boolean>;
}
```

**Lưu ý:** prompt gốc (Mục 21 cấu trúc) chỉ liệt kê `save()`/`findById()`/`delete()` — nhưng `IChartRepository` thật có **4 method**, bao gồm `listByUserId` (không được bỏ qua chỉ vì template không có mục riêng — đúng nguyên tắc "Implementation Plan phải phù hợp với code thực tế"). Plan này thêm `8.3bis listByUserId()` bên dưới.

### 8.2 `PrismaChartRepository`

```typescript
export class PrismaChartRepository implements IChartRepository {
  constructor(private readonly prisma: PrismaClient) {}
  // ...
}
```

Nhận `PrismaClient` qua constructor, giống hệt `PrismaBirthProfileRepository` — không tự tạo instance.

### 8.3 `save()`

```
save(chart: Chart): Promise<void>
  → PrismaChartMapper.toPersistence(chart)  // tách thành 7 object: charts + 6 mảng con
  → prisma.$transaction(async (tx) => {
      await tx.chart.create({ data: chartData });
      if (houses.length) await tx.chartHouse.createMany({ data: houseRows });
      await tx.chartPlanet.createMany({ data: planetRows });   // sau houses — composite FK
      if (angles.length) await tx.chartAngle.createMany({ data: angleRows });
      if (aspects.length) await tx.chartAspect.createMany({ data: aspectRows });
      if (patterns.length) {
        await tx.chartPattern.createMany({ data: patternRows });
        await tx.chartPatternPlanet.createMany({ data: patternPlanetRows });
      }
    })
  → catch → InfrastructureError('Failed to save chart', {cause: error})
```

`createMany` cho mảng rỗng (`houses=[]` khi `isBirthTimeKnown=false`) **phải guard bằng `if (length)`** — `createMany({data: []})` với Prisma có thể throw hoặc no-op tùy version, cần verify thực tế lúc code (không phải quyết định kiến trúc, chỉ 1 dòng kiểm tra phòng thủ).

### 8.4 `findById()`

```
findById(id): Promise<Chart | null>
  → tx/prisma.chart.findUnique({ where: {id}, include: { planets: true, houses: true, angles: true, aspects: true, patterns: { include: { patternPlanets: true } } } })
  → if (!record || record.deleted_at !== null) return null
  → PrismaChartMapper.toDomain(record)  // gọi Chart.reconstitute(), không phải Chart.create()
```

Dùng Prisma `include` để load đủ 6 bảng con trong **1 query** (không N+1) — quan trọng cho performance, và đơn giản hơn 6 query riêng.

### 8.5 `delete()` (= `softDelete`)

```
softDelete(id, userId): Promise<boolean>
  → prisma.chart.updateMany({ where: {id, user_id: userId, deleted_at: null}, data: {deleted_at: new Date()} })
  → return result.count > 0
```

Giống hệt `PrismaBirthProfileRepository.softDelete()` — **không** cần `UPDATE` 6 bảng con (Mục 6.6: soft-delete suy ra từ cha, con giữ nguyên trong DB).

### 8.3bis `listByUserId()`

```
listByUserId(userId, options): Promise<{items, total}>
  → where: {user_id: userId, deleted_at: null, ...(options.birthProfileId && {birth_profile_id: options.birthProfileId})}
  → orderBy: {calculated_at: options.order}   // ListChartsOptions.sortBy chỉ có 'calculatedAt', không cần nhánh switch như BirthProfile's createdAt/fullName
  → Promise.all([findMany({include: đủ 6 bảng con, where, orderBy, skip, take}), count({where})])
  → items = records.map(PrismaChartMapper.toDomain)
```

**Lưu ý hiệu năng (ghi nhận, không chặn M5):** load đủ 6 bảng con cho **mỗi Chart** trong 1 danh sách phân trang có thể nặng nếu `pageSize` lớn — chấp nhận được ở MVP (M7 chưa tồn tại, chưa có real traffic), nhưng nên note thành Known Gap cho M7 cân nhắc lúc build `GET /charts` thật (có thể cần DTO rút gọn không load full aspect/pattern cho list view — quyết định của M7, không phải M5).

### 8.6 Transaction Boundary

- Cơ chế: `this.prisma.$transaction(async (tx) => {...})` (interactive transaction, Prisma Client API) — xác nhận version Prisma đang dùng hỗ trợ cú pháp này (cùng version đã dùng cho `BirthProfile`, dù `BirthProfile` không có multi-insert nên chưa từng dùng `$transaction` — đây là lần đầu dự án dùng transaction thật, cần verify bằng cách chạy Integration Test thật, không chỉ đọc doc Prisma).
- Ordering: `charts` → `chart_houses` → `chart_planets` (phụ thuộc houses) → `chart_angles`/`chart_aspects`/`chart_patterns` (độc lập nhau, thứ tự giữa 3 cái này không quan trọng) → `chart_pattern_planets` (phụ thuộc patterns + planets).
- Rollback: bất kỳ exception nào trong callback `$transaction` → Prisma tự động ROLLBACK toàn bộ, không cần code thủ công.
- Error propagation: catch ở method `save()` bên ngoài `$transaction`, wrap thành `InfrastructureError`.

### 8.7 Error Handling

Tái sử dụng đúng `InfrastructureError` (shared) — không tạo taxonomy mới, đúng pattern BirthProfile. Phân loại theo Mục 16 prompt:

| Category | Xử lý |
|---|---|
| Constraint violation (CHECK/UNIQUE) | `Prisma.PrismaClientKnownRequestError` (`P2002` unique, có thể P2000 khác cho CHECK tùy Postgres driver) → `InfrastructureError` |
| Connectivity failure | Không catch riêng — để bubble tự nhiên qua `InfrastructureError` generic |
| Not found | `findById()` trả `null` (không throw) — đúng contract `Promise<Chart \| null>` |
| Transaction failure | Tự động rollback bởi Prisma, catch ở tầng `save()`, wrap `InfrastructureError` |
| Mapping failure | Không catch riêng ở Repository — nếu Mapper throw (ví dụ dữ liệu DB hỏng không map được Domain), để lỗi đó tự nhiên propagate (không nên xảy ra nếu CHECK constraint DB đã đúng) |

---

## 9. Mapper Implementation

### 9.1 Domain → Prisma (`toPersistence`)

Trả về **7 object riêng biệt** (không phải 1 object lồng nhau — Prisma `create` với nested `include`/`create` cho quan hệ 1-N là khả thi nhưng phức tạp hơn cần thiết khi đã dùng `$transaction` với `createMany` riêng — đơn giản hơn, dễ test hơn):

```typescript
static toPersistence(chart: Chart): {
  chart: Prisma.ChartUncheckedCreateInput;
  planets: Prisma.ChartPlanetUncheckedCreateInput[];
  houses: Prisma.ChartHouseUncheckedCreateInput[];
  angles: Prisma.ChartAngleUncheckedCreateInput[];
  aspects: Prisma.ChartAspectUncheckedCreateInput[];
  patterns: Prisma.ChartPatternUncheckedCreateInput[];
  patternPlanets: Prisma.ChartPatternPlanetUncheckedCreateInput[];
}
```

### 9.2 Prisma → Domain (`toDomain`)

```typescript
static toDomain(record: PrismaChartWithRelations): Chart {
  const planets = record.planets.map(p => Planet.create({...}));  // hoặc Planet.reconstitute() nếu có — xem Open Question OQ-2
  // ... tương tự houses/angles/aspects/patterns
  return Chart.reconstitute({ id: record.id, ..., planets, houses, angles, aspects, patterns, engineInput: EngineInput.create({...}) });
}
```

**Quan trọng — `Chart.reconstitute()` bỏ qua re-validate INV-1/2/4/5/10/15** (đọc trực tiếp code M1: `reconstitute()` không chạy bất kỳ check nào, chỉ copy props) — điều này **đúng đắn** cho việc load từ DB (dữ liệu đã qua CHECK constraint + đã validate lúc `save()`), nhưng có nghĩa là **nếu DB bị corrupt thủ công** (ví dụ ai đó chạy raw SQL sai), `findById()` sẽ **không phát hiện** — chấp nhận được vì đây đúng là mục đích của `reconstitute()` (tin tưởng dữ liệu đã lưu), ghi nhận như 1 giả định rõ ràng, không phải lỗ hổng M5 cần vá.

**Open Question OQ-2 — CONFIRMED, phương án (a):** `Planet`/`House`/`Angle`/`Aspect`/`Pattern` **entity con** chỉ có `.create()` (đã verify — không tìm thấy `.reconstitute()` nào ở các entity con khi grep, chỉ `Chart` có). `toDomain()` dùng `.create()` như hiện có — chấp nhận re-validate invariant mỗi lần `findById()` (vô hại, dữ liệu đã qua CHECK DB). **Không thêm `.reconstitute()` cho 5 entity con** — tránh mở rộng scope vào M1 Entity không cần thiết.

### 9.3 Nested Child Mapping

- `Planet.house` (nullable `number`) ← `chart_planets.house_number` — pass-through trực tiếp.
- `Pattern.involvedPlanets` (mảng `PlanetName`, theo Entity) ← join `chart_pattern_planets.planet_id` → tra `chart_planets.name` tương ứng (cần `planet_id → name` lookup map khi map `toDomain`, vì `chart_pattern_planets` chỉ lưu `planet_id` UUID, không lưu tên trực tiếp).

### 9.4 Nullability

| Field | Nullable ở DB | Nullable ở Domain | Mapping |
|---|---|---|---|
| `birth_profile_id` | ✔ | `Chart.birthProfileId: string \| null` | pass-through |
| `snapshot_birth_time` | ✔ | `EngineInput.birthData.birthTime: {...} \| null` | `null ↔ null`, có giá trị thì convert TIME↔object giống BirthProfile pattern |
| `chart_planets.latitude` | ✔ | `Planet.latitude?: number` (cần verify optional hay luôn có ở Entity — xem code thật lúc implement) | pass-through |
| `chart_planets.house_number` | ✔ | `Planet.house: number \| null` | pass-through |

### 9.5 Precision / Numeric Handling

Mọi cột `NUMERIC(x,y)` (Postgres) map qua Prisma `Decimal` → `.toNumber()` khi đọc, truyền `number` trực tiếp khi ghi (Prisma tự cast) — đúng pattern `Coordinates.create(record.latitude.toNumber(), ...)` đã dùng cho BirthProfile. **Không** làm tròn thêm ở Mapper — độ chính xác đã được định ở tầng cột DB (`NUMERIC(6,3)` cho longitude, v.v., theo Mục 6.1/6.2) và ở tầng Engine (M3, không làm tròn sớm — đã confirm trong M3 review).

### 9.6 Roundtrip Guarantees

Test bắt buộc (Mục 11.5) phải verify **từng field** domain-relevant sống sót qua `save()→findById()`, **trừ đúng `snapshot_interpretation_version`** (luôn `null` do Schema Decision đã CONFIRMED ở Mục 7, không phải thiếu sót) — `fullName`/`placeName` giờ **có nguồn dữ liệu thật** (sau M5-T00) nên **phải** roundtrip chính xác như mọi field khác, không còn ngoại lệ. Roundtrip test đạt equality chính xác (không dùng `toBeCloseTo`/tolerance).

---

## 10. Dependency Injection / Composition Root

Đọc `composition-root.ts` hiện tại: `ephemerisProvider` (chart) đã được khởi tạo và expose qua `providers: {ephemerisProvider}`, nhưng **chưa có `repositories` object riêng** cho bất kỳ module nào (`birthProfileRepository` là biến local, không expose trực tiếp qua object trả về — chỉ các Use Case dùng nó mới được expose). Theo đúng convention này:

```typescript
// Trong buildApp()/composition-root.ts
const chartRepository = new PrismaChartRepository(prisma);
```

Expose `chartRepository` theo đúng cách các dependency khác đang được truyền cho use case tương lai — **M5 chỉ cần đảm bảo instance được tạo và inject được**, chưa cần quyết định "expose qua key nào trong object trả về" vì **chưa có Use Case nào (M6) để tiêu thụ nó** — đề xuất tạm thời thêm vào 1 object `repositories: {..., chartRepository}` mới (pattern rõ ràng hơn so với việc rải biến local), nhưng đây là Implementation Detail có thể điều chỉnh khi M6 bắt đầu nếu cần khác đi.

**Test injection strategy:** Integration test tự tạo `new PrismaClient()` riêng (trỏ `DATABASE_URL` từ `docker-compose.test.yml`) rồi `new PrismaChartRepository(prisma)` trực tiếp — đúng pattern `prisma-birth-profile.repository.test.ts` đã dùng, không qua composition-root đầy đủ.

---

## 11. Testing Strategy

Theo đúng philosophy đã freeze (Coding Standards) — test hành vi/rủi ro, không chạy theo coverage %.

### 11.1 Test Environment
`docker-compose.test.yml` (Postgres 16-alpine thật) + `DATABASE_URL` trỏ tới đó — **không** SQLite/in-memory/mock Prisma/mock Repository, đúng yêu cầu tường minh của prompt.

### 11.2 Migration Test
`npm run prisma:deploy` trên DB sạch (container mới) → verify 8 bảng tồn tại (`house_systems` + `charts` + 6 con), FK/CHECK/UNIQUE/index tồn tại — có thể verify bằng query `information_schema` hoặc đơn giản là để Integration Test khác tự fail nếu schema sai (2 lớp bảo vệ).

### 11.3 Save Test
Tạo `Chart` hợp lệ đầy đủ (dùng `Chart.create()` với fixture tương tự M3 test fixtures) → `repository.save()` → verify trực tiếp qua raw Prisma query: đúng 1 hàng `charts`, đúng N hàng mỗi bảng con, FK đúng, giá trị đúng.

### 11.4 Transaction Rollback Test
Cách inject failure **không làm xấu production code** (đúng yêu cầu prompt Mục 13.3): tạo 1 Chart fixture có 1 planet với `name` hợp lệ ở Domain nhưng **cố tình vi phạm CHECK DB** — ví dụ không khả thi vì Domain đã validate chặt hơn DB. **Cách khả thi hơn:** insert trước 1 hàng `chart_planets` trùng `(chart_id, name)` thủ công (qua raw Prisma, giả lập tình huống retry/race) trước khi gọi `save()` với cùng `chart_id` → `UNIQUE` violation ở 1 trong 6 insert giữa transaction → verify **toàn bộ 7 bảng có 0 hàng liên quan `chart_id` đó** sau khi `save()` reject. Không thêm abstraction test-only vào production code.

### 11.5 Roundtrip Test
`Chart.create()` (fixture đầy đủ: có houses/angles, có aspects, `patterns=[]`, `engineInput.birthData.fullName`/`placeName` có giá trị thật sau M5-T00) → `save()` → `findById()` → so sánh **từng field** domain-relevant (trừ `snapshot_interpretation_version`, luôn `null` theo Schema Decision) bằng deep equality, không tolerance.

### 11.6 Not Found Test
`findById('không-tồn-tại')` → `null` (đúng `IChartRepository` contract, không throw).

### 11.7 Soft Delete Test
`save()` → `softDelete(id, userId)` → `findById(id)` → `null`. Verify riêng bằng raw query: hàng `charts` **vẫn tồn tại** với `deleted_at` set (không hard-delete), và 6 bảng con **vẫn còn nguyên** (Mục 6.6).

### 11.8 CHECK Constraint Test
Insert trực tiếp qua Prisma (bypass Domain validation) 1 hàng `chart_planets` với `longitude = 400` (vi phạm CHECK `[0,360)`) → expect Postgres reject (`PrismaClientKnownRequestError`), không mock.

### 11.9 UNIQUE Constraint Test
Insert 2 hàng `chart_houses` cùng `(chart_id, number)` → expect reject.

### 11.10 Ownership Test
`softDelete(id, otherUserId)` (không phải chủ sở hữu) → `count=0` → trả `false`, **không** xóa. Ghi rõ: `findById()` không test ownership vì không phải trách nhiệm của nó (Mục 5/6.7).

---

## 12. Exact Implementation Tasks

**M5-T00 — Corrective Domain Change: bổ sung `fullName`/`placeName` (CONFIRMED, Decision OQ-1.1)**
- Objective: Thêm 2 field còn thiếu vào chuỗi `EngineInputBirthData` (M1) → `BirthDataSnapshot` (M4), để `Chart` snapshot có đủ nguồn dữ liệu cho `snapshot_full_name`/`snapshot_place_name`.
- Files:
  - `chart/domain/value-objects/engine-input.vo.ts` — thêm `fullName: string | null` (nullable, khớp `BirthProfile.fullName` optional) và `placeName: string` (bắt buộc, khớp `BirthLocation.placeName` NOT NULL) vào `EngineInputBirthData`.
  - `birth-profile/application/use-cases/get-birth-profile-snapshot.usecase.ts` — thêm 2 field tương ứng vào `BirthDataSnapshot`, map từ `profile.fullName` và `profile.birthLocation.placeName` (dữ liệu đã có sẵn ở `BirthProfile` Entity, chỉ chưa được truyền qua trước đây).
- Preconditions: Không (độc lập, additive-only).
- Implementation steps:
  1. Thêm 2 field vào interface `EngineInputBirthData` — **additive**, không đổi field nào đã có.
  2. Thêm 2 field vào interface `BirthDataSnapshot` + cập nhật `GetBirthProfileSnapshotUseCase.execute()` để map đúng 2 giá trị mới.
  3. **Cập nhật ripple test fixtures:** vì `EngineInputBirthData` hiện có thêm 1 field bắt buộc (`placeName: string`, không optional), **mọi fixture hiện có** dựng `EngineInput`/`EngineInputBirthData` ở test suite M3 (calculator tests, `chart-builder.test.ts`, `time-conversion.test.ts`) và test suite M4 (`get-birth-profile-snapshot.usecase.test.ts`) **sẽ compile lỗi hoặc thiếu field** cho tới khi được cập nhật thêm `placeName`/`fullName`. Đây là ripple effect thật cần làm ngay trong task này, không phải để sót.
- Technical details: Đây là additive change thuần túy — chưa có consumer thật nào (M6 chưa build) construct `EngineInput` từ `BirthDataSnapshot`, nên không có runtime behavior nào bị phá, chỉ có type-level ripple ở test fixtures.
- Tests: Chạy lại toàn bộ `tests/unit/modules/chart` (141 test hiện có) + `get-birth-profile-snapshot.usecase.test.ts` (6 test) sau khi cập nhật fixture — phải pass 100%, không skip.
- Expected result: `EngineInputBirthData`/`BirthDataSnapshot` có đủ `fullName`/`placeName`; toàn bộ test cũ vẫn xanh.
- Acceptance criteria: 0 lỗi `tsc --noEmit` ở `chart`/`birth-profile`; 147 test cũ (141+6) pass lại sau cập nhật fixture.
- Dependencies: Không.
- Risk: Trung bình — chạm vào file M1/M3/M4 đã đóng, dù chỉ additive, cần chạy lại toàn bộ test liên quan để chắc chắn không phá gì (đúng tinh thần "corrective change nhỏ, không mở rộng scope" mà prompt M5 cho phép).

**M5-T01 — Prerequisite: `HouseSystem` model + seed data**
- Objective: Tạo bảng tham chiếu bắt buộc trước khi `charts` có thể FK tới nó.
- Files: `schema.prisma` (thêm model), migration SQL (phần đầu).
- Preconditions: Không.
- Steps: Thêm model theo §5.4; viết `INSERT` 2 hàng (`Placidus`, `WholeSign`) trực tiếp trong migration SQL.
- Tests: Phần của M5-T06 (Migration Test).
- Risk: Thấp — bảng độc lập, không phụ thuộc gì.

**M5-T02 — Update Prisma Schema (Chart + 6 bảng con)**
- Objective: Định nghĩa đủ 7 model còn lại trong `schema.prisma`.
- Files: `schema.prisma`.
- Preconditions: M5-T01.
- Dependencies: Đối chiếu chính xác Mục 6.1/6.2.
- Risk: Trung bình — sai tên cột/kiểu sẽ lộ ra ngay ở bước generate/migrate.

**M5-T03 — Create Migration**
- Objective: Viết `migration.sql` raw, theo đúng pattern BirthProfile.
- Files: `prisma/migrations/<timestamp>_init_chart_module/migration.sql`.
- Preconditions: M5-T02.
- Steps: Đúng thứ tự Mục 7 (house_systems → charts → chart_houses → chart_planets → ...).
- Tests: M5-T06.
- Risk: Cao — nhiều CHECK/composite FK, dễ sai thứ tự hoặc cú pháp; phải test thật trên Postgres, không chỉ đọc bằng mắt.

**M5-T04 — Implement `PrismaChartMapper`**
- Objective: `toPersistence`/`toDomain` đầy đủ 7 bảng.
- Files: `chart/infrastructure/mappers/prisma-chart.mapper.ts`.
- Preconditions: M5-T00 (cần `fullName`/`placeName` đã có trên `EngineInputBirthData`), M5-T02 (cần Prisma types generate xong).
- Dependencies: `snapshot_interpretation_version` luôn ghi `null` (Schema Decision, Mục 7) — không đọc từ Domain vì không có nguồn.
- Tests: M5-T09 (Roundtrip), Unit test riêng cho mapper nếu cần (theo pattern `prisma-birth-profile.mapper.test.ts`).
- Risk: Cao — nhiều field, dễ sót/nhầm đơn vị.

**M5-T05 — Implement `PrismaChartRepository`**
- Objective: 4 method đầy đủ, transactional `save()`.
- Files: `chart/infrastructure/repositories/prisma-chart.repository.ts`.
- Preconditions: M5-T04.
- Tests: M5-T06 đến M5-T10 (Integration).
- Risk: Cao — lần đầu dự án dùng `$transaction` multi-insert thật.

**M5-T06 — Wire Dependency Injection**
- Objective: `composition-root.ts` khởi tạo `PrismaChartRepository`.
- Files: `composition-root.ts`.
- Preconditions: M5-T05.
- Risk: Thấp.

**M5-T07 — Integration Tests (Save + Roundtrip + Not Found)**
- Files: `tests/integration/modules/chart/repositories/prisma-chart.repository.test.ts`.
- Preconditions: M5-T05, M5-T06, DB test container chạy.
- Risk: Trung bình.

**M5-T08 — Transaction Failure Test**
- Cùng file M5-T07, scenario riêng (Mục 11.4).
- Risk: Trung bình — cần nghĩ cách inject failure sạch (đã mô tả Mục 11.4).

**M5-T09 — Constraint Tests (CHECK + UNIQUE)**
- Cùng file M5-T07, scenario riêng (Mục 11.8/11.9).
- Risk: Thấp — thẳng, chỉ cần insert sai và expect reject.

**M5-T10 — Soft Delete + Ownership Tests**
- Cùng file M5-T07 (Mục 11.7/11.10).
- Risk: Thấp.

---

## 13. Testing Matrix

| Test | Loại | File | AC liên quan |
|---|---|---|---|
| Migration chạy sạch | Integration | (setup, không phải file test riêng) | AC1 |
| Save tạo đủ 7 bảng | Integration | `prisma-chart.repository.test.ts` | AC2 |
| Transaction rollback | Integration | cùng file | AC2 |
| Roundtrip toàn bộ field | Integration | cùng file | AC3 |
| Not found | Integration | cùng file | — |
| Soft delete + record vẫn tồn tại | Integration | cùng file | AC4 |
| CHECK constraint reject | Integration | cùng file | AC5 |
| UNIQUE constraint reject | Integration | cùng file | AC6 |
| Ownership (softDelete sai user) | Integration | cùng file | — |
| Mapper field-by-field (nếu tách unit test riêng) | Unit | `prisma-chart.mapper.test.ts` (tùy chọn, có thể gộp vào Integration Roundtrip) | AC3 |

---

## 14. Acceptance Criteria

Giữ nguyên đúng 9 AC đã đóng băng ở prompt (AC1–AC9), bổ sung điều kiện rõ ràng cho AC3 do Schema Decision đã CONFIRMED:

- **AC1 Migration**, **AC2 Transactional Save**, **AC4 Soft Delete**, **AC5 CHECK**, **AC6 UNIQUE**, **AC7 Integration Testing**, **AC8 Architecture**, **AC9 Existing Pattern** — giữ nguyên văn, không đổi.
- **AC3 Roundtrip** — "100% giá trị đã lưu" áp dụng cho **toàn bộ field** trên `charts`/6 bảng con, **trừ đúng `snapshot_interpretation_version`** (luôn `null`, theo Schema Decision đã CONFIRMED ở Mục 7 — cột này nullable có chủ đích, không phải Domain thiếu dữ liệu cần roundtrip). `snapshot_full_name`/`snapshot_place_name` **không còn ngoại lệ** sau M5-T00 — phải roundtrip chính xác như mọi field khác.

---

## 15. Open Questions / Decisions — ĐÃ RESOLVED (Confirmation.md)

| ID | Question | Decision | Ghi chú thực thi |
|---|---|---|---|
| OQ-1.1 | `fullName`/`placeName` không có nguồn Domain | **CONFIRMED phương án (a)** — additive domain correction: bổ sung vào `EngineInputBirthData` (M1) + `BirthDataSnapshot` (M4) | Thực hiện ở M5-T00, trước Mapper. Không lấy dữ liệu từ nguồn ngoài Chart snapshot, không hardcode ở mapper. |
| OQ-1.2 | `snapshot_interpretation_version` NOT NULL nhưng không có domain-defined version nào | **CONFIRMED** — Database Design reconciliation: đổi cột thành **nullable**, không dùng placeholder tự phát minh (`'unassigned'` bị từ chối tường minh) | Migration mới khai báo nullable (Mục 7); cần Documentation Reconciliation Task cập nhật lại Database Design Spec §5.7 (việc tài liệu, không thuộc code M5) |
| OQ-2 | `.reconstitute()` cho 5 entity con? | **CONFIRMED phương án (a)** — dùng `.create()`, không thêm `.reconstitute()` | Không đổi gì so với đề xuất ban đầu |
| OQ-3 | Seed `house_systems` ở đâu? | **CONFIRMED phương án (a)** — INSERT trực tiếp trong `migration.sql` | Không đổi gì so với đề xuất ban đầu |

**Không còn Open Question nào chặn M5.** Toàn bộ 4 điểm đã có quyết định chính thức, chỉ cần thực thi đúng theo Mục 7/12.

**Không tạo lại các OQ đã resolve:** `swisseph-wasm` version/license (M2, đã Confirmed), module boundary enforcement (M4, đã Confirmed + verify thật), `GET /charts` (thuộc M7, chỉ ảnh hưởng gián tiếp qua `ListChartsOptions` đã có sẵn ở M1), backend coverage philosophy (Coding Standards, không mở lại).

---

## 16. Risks

| Risk | Impact | Likelihood | Mitigation | Detection |
|---|---|---|---|---|
| Transaction 6 bảng con phức tạp, sai thứ tự insert | Cao | Trung bình | Tuân thủ đúng thứ tự Mục 7/8.6 (houses trước planets) | Integration test M5-T07 chạy thật trên Postgres |
| Mapper làm mất field (đặc biệt nested Pattern↔Planet qua junction) | Cao | Trung bình | Roundtrip test field-by-field, không tolerance | M5-T07 |
| Numeric precision lệch (NUMERIC(6,3) vs domain float64) | Trung bình | Thấp (đã xác nhận M3 không làm tròn sớm, DB cột đã định precision rõ) | Test giá trị biên (ví dụ `359.999`) | Roundtrip test |
| Date/DateTime/TIME conversion sai (giống lỗi UTC đã gặp ở M3) | Cao | Trung bình (đã có 1 tiền lệ thật ở M3 time-conversion.ts) | Tái dùng đúng pattern `Date.UTC(1970,0,1,...)`/`getUTC*()` đã verify đúng ở BirthProfile, **không tự viết lại bằng local getter** | Test cụ thể với giờ sinh có giây khác 0, chạy dưới `TZ` khác UTC (bài học từ M3) |
| Nullable field nhầm lẫn (`birthTime=null` vs `houses=[]`) | Trung bình | Thấp | Test riêng case `isBirthTimeKnown=false` | Roundtrip test |
| Enum conversion sai (TEXT ↔ TS enum) | Trung bình | Thấp | CHECK constraint DB tự chặn giá trị sai; mapper chỉ cast string↔enum trực tiếp | CHECK constraint test |
| Foreign-key ordering sai trong migration | Cao | Trung bình | Đúng thứ tự Mục 7, test migration trên DB sạch | M5-T06 |
| Transaction không thực sự rollback (Prisma version/API khác kỳ vọng) | Cao | Thấp–Trung bình (lần đầu dùng `$transaction` multi-insert trong dự án) | Test rollback thật (M5-T08), không giả định | Integration test |
| CHECK constraint không hoạt động như kỳ vọng (viết tay, dễ sai cú pháp SQL) | Cao | Trung bình | Test constraint thật trên Postgres (M5-T09), không mock | Integration test |
| Soft-delete filtering nhầm (quên check `deleted_at` ở `findById`) | Cao | Thấp | Copy chính xác pattern BirthProfile đã verify đúng | Soft delete test |
| Prisma generated types (`Prisma.ChartUncheckedCreateInput`...) không khớp nếu `prisma generate` chưa chạy trong môi trường dev | Trung bình | Trung bình (đã gặp — sandbox này có giới hạn network, nhưng CI/dev thật không bị) | Không phải vấn đề code, chỉ cần đảm bảo `prisma generate` chạy trước build/test | `tsc --noEmit` |
| Schema drift giữa `schema.prisma` và `migration.sql` viết tay | Trung bình | Trung bình (vì CHECK viết tay, không phải Prisma tự sinh) | Đối chiếu kỹ 2 file trước khi coi task xong; `prisma migrate diff` nếu cần verify | Code review |
| Test database isolation (nhiều test chạy song song ghi cùng bảng) | Trung bình | Thấp (dự án hiện dùng port cố định 5432, không thấy cơ chế parallel test DB riêng) | Mỗi test tự cleanup (`afterEach` xóa dữ liệu test đã tạo) theo đúng pattern `prisma-birth-profile.repository.test.ts` nếu có | Đọc lại pattern cleanup thật của test BirthProfile lúc code |
| Chart snapshot lớn (nhiều planet/aspect) làm chậm `$transaction` | Thấp | Thấp (dữ liệu 1 Chart cố định ~10-14 planet, 12 house, ~10-20 aspect — nhỏ) | Không cần tối ưu đặc biệt ở M5 | — |
| Vô tình mutate `Chart` immutable snapshot trong Mapper | Trung bình | Thấp | `Chart`/child entities đã `Object.freeze()` (M1) — mutation sẽ throw ngay ở runtime nếu cố tình, tự phát hiện | `tsc`/runtime error nếu xảy ra |
| Cross-module ownership dependency (Chart→User, Chart→BirthProfile) | Thấp | Thấp | FK đã định nghĩa rõ ở DB (CASCADE cho User, SET NULL cho BirthProfile) — không cần logic cross-module nào ở M5 | — |

---

## 17. Dependency Graph

```
M5-T00 (Corrective: fullName/placeName vào EngineInputBirthData + BirthDataSnapshot)
      │
      ▼
M5-T01 (HouseSystem prerequisite)
      │
      ▼
M5-T02 (Prisma Schema — Chart + 6 con)
      │
      ▼
M5-T03 (Migration SQL)
      │
      ├──────────────┐
      ▼              │
M5-T04 (Mapper)       │
      │               │
      ▼               │
M5-T05 (Repository) ◄─┘  (cần schema generate xong để có Prisma types)
      │
      ▼
M5-T06 (Composition Root wiring)
      │
      ▼
M5-T07 (Integration: Save/Roundtrip/NotFound)
      │
      ├──▶ M5-T08 (Transaction Failure)
      ├──▶ M5-T09 (Constraints)
      └──▶ M5-T10 (Soft Delete/Ownership)
```

M5-T00 có thể làm song song với M5-T01/T02/T03 (không phụ thuộc lẫn nhau — 1 bên là Domain/Application file, 1 bên là schema/migration) nhưng **phải xong trước M5-T04** (Mapper cần `fullName`/`placeName` đã tồn tại trên `EngineInputBirthData`).

---

## 18. Recommended Implementation Order

1. **M5-T00 trước tiên** (Mục 12) — corrective domain change đã CONFIRMED, cần xong (kèm cập nhật ripple test fixtures M3/M4) trước khi Mapper có thể dùng `fullName`/`placeName`.
2. M5-T01 → M5-T02 → M5-T03 (schema/migration, có thể làm song song M5-T00 vì độc lập — mọi thứ khác phụ thuộc Prisma types generate được).
3. M5-T04 (Mapper) có thể code song song lúc chờ verify migration, nhưng chỉ compile được sau khi `prisma generate` chạy thành công trên schema mới.
4. M5-T05 → M5-T06.
5. M5-T07 đến M5-T10 (Integration test) — nên viết ngay sau từng phần Repository hoàn thành, không dồn hết về cuối (đúng thói quen dự án đã thể hiện xuyên suốt M1-M4).
6. Cuối cùng: `npm run lint`/`typecheck`/`build`/full test suite trên toàn backend (không chỉ scope `chart`) — đúng thói quen M3-T9/M4-T5 đã áp dụng.

---

## 19. Definition of Done

Giữ nguyên đúng checklist đã đóng băng ở prompt (23 mục) — không rút gọn, bổ sung điều kiện cho các mục liên quan Schema Decision:

- [ ] Prisma schema đúng (bao gồm `HouseSystem` prerequisite).
- [ ] `EngineInputBirthData`/`BirthDataSnapshot` đã bổ sung `fullName`/`placeName` (M5-T00), toàn bộ 147 test cũ liên quan vẫn pass.
- [ ] Migration tồn tại, chạy thành công trên DB sạch.
- [ ] Toàn bộ 8 bảng (`house_systems` + `charts` + 6 con) tồn tại.
- [ ] Toàn bộ constraint đã liệt kê ở Mục 6 tồn tại thật (verify bằng test, không chỉ đọc migration.sql), bao gồm `snapshot_interpretation_version` là nullable có chủ đích.
- [ ] `PrismaChartRepository` implement đúng `IChartRepository` (4 method, không thiếu `listByUserId`).
- [ ] `save()` transactional — verify bằng test rollback thật.
- [ ] `findById()` reconstruct đầy đủ Chart snapshot (trừ `snapshot_interpretation_version`, luôn `null` theo Schema Decision).
- [ ] Soft delete hoạt động đúng, verify record không hard-delete.
- [ ] Mapper roundtrip bảo toàn mọi giá trị có nguồn dữ liệu thật (bao gồm `fullName`/`placeName` sau M5-T00).
- [ ] CHECK constraint integration test pass.
- [ ] UNIQUE constraint integration test pass.
- [ ] Transaction rollback test pass.
- [ ] Test chạy trên Postgres thật qua `docker-compose.test.yml`.
- [ ] Pattern BirthProfile được tôn trọng (đã đối chiếu Mục 5).
- [ ] ESLint pass (không vi phạm boundary — Domain/Application không import Prisma).
- [ ] TypeScript/build pass.
- [ ] Test suite liên quan pass.
- [ ] Không vi phạm kiến trúc (Domain/Application không biết `PrismaClient`/`Prisma` namespace).
- [ ] Không implement tính năng ngoài scope (CreateChartUseCase, Controller, v.v.).
- [ ] Documentation/comment chỉ cập nhật nơi cần thiết (ghi chú rõ trong migration.sql lý do `snapshot_interpretation_version` nullable; Documentation Reconciliation Task cho Database Design Spec §5.7 được ghi nhận, dù thực hiện ngoài code M5).

---

## 20. Final Consistency Audit

- **Architecture:** Không vi phạm Clean Architecture — Repository/Mapper nằm hoàn toàn trong `infrastructure/`, Domain/Application (M1-M4) không đổi, không import Prisma.
- **Domain:** Persistence không đổi domain semantics — `Chart.reconstitute()` (đã có sẵn từ M1) dùng đúng mục đích, không tạo semantics mới; M5-T00 là additive domain correction đã CONFIRMED (bổ sung field bị bỏ sót, không phải semantics mới do M5 tự tạo ra).
- **Database:** Schema đối chiếu chính xác Database Design Specification §5.7–§5.12, §5.4 (prerequisite) — 1 lệch có chủ đích, đã ghi nhận công khai (`snapshot_interpretation_version` → nullable, kèm Documentation Reconciliation Task), không phải tự ý đổi âm thầm.
- **Repository:** `PrismaChartRepository` implement đủ 4 method `IChartRepository`, không thêm/bớt method nào so với port.
- **Mapper:** Mọi field có nguồn Domain thật đều roundtrip được (trừ `snapshot_interpretation_version`, luôn `null` theo Schema Decision đã CONFIRMED, ghi rõ lý do cụ thể, không phải "quên").
- **Transaction:** Không thể tồn tại partial snapshot — `$transaction` đảm bảo all-or-nothing, verify bằng test thật (M5-T08), không chỉ tin tưởng API doc.
- **Constraints:** CHECK/UNIQUE enforce ở PostgreSQL thật (migration.sql), không phải chỉ validate ở Domain/Application — test M5-T09 chứng minh bằng cách cố tình bypass Domain (insert thẳng qua Prisma).
- **Testing:** Toàn bộ failure path quan trọng (constraint violation, transaction rollback, not found, soft-delete) test trên Postgres thật qua `docker-compose.test.yml`, không mock.
- **Scope:** Không implement `CreateChartUseCase`/Controller/route nào — đã audit lại Mục 3.2, không có rò rỉ M6/M7.
- **Existing conventions:** Repository/Mapper theo đúng pattern BirthProfile ở mọi điểm không có lý do kỹ thuật để khác (đã liệt kê khác biệt tường minh ở Mục 5).
- **Documentation:** Mọi giả định trong plan này trace được về 1 nguồn cụ thể (Database Design Spec §, code M1-M4 thật) — không có giả định "tự nghĩ ra" nào ngoài 3 Open Question đã flag rõ ràng ở Mục 15.
