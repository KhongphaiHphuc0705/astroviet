# Sprint 3 Backend Implementation Plan

## Natal Chart Module — Swiss Ephemeris Integration

**Phiên bản:** 1.1 — Confirmed
**Trạng thái:** Sẵn sàng triển khai; toàn bộ Open Questions gốc (Mục 17) đã RESOLVED hoặc chuyển thành Task cụ thể — **0 mục chờ xác nhận**. Licensing (Mục 13) đã RESOLVED hướng AGPL/open-source, chỉ còn compliance audit ở M10 (không chặn code M1–M9).
**Dựa trên:** toàn bộ 19 tài liệu authoritative đã liệt kê ở prompt gốc — quan trọng nhất: **Natal Chart Domain Specification v1.1 (Confirmed)** và **Swiss Ephemeris Integration Specification v1.1 (Confirmed)** — 2 tài liệu này đã giải quyết dứt điểm toàn bộ quyết định domain/integration, Sprint 3 Plan **không mở lại bất kỳ quyết định nào** trong đó, chỉ biến chúng thành Task thực thi cụ thể
**Đối chiếu trực tiếp với codebase thật:** đã inspect `backend/src/modules/birth-profile/` (toàn bộ file), `backend/src/modules/identity/`, `backend/src/composition-root.ts`, `backend/src/shared/errors/`, `backend/.eslintrc.cjs`, `backend/tests/`, `backend/prisma/`, `backend/package.json`, `backend/.github/workflows/ci.yml`, `backend/Dockerfile` — không giả định cấu trúc, dùng đúng convention đã có

---

## 1. Sprint Overview

**Sprint:** Sprint 3 — Natal Chart Module + Swiss Ephemeris Integration
**Vị trí:** Sprint backend thứ 4 (sau Sprint 0 Infrastructure, Sprint 1 Identity, Sprint 2 Birth Profile — cả 3 đã CLOSED) — Sprint đầu tiên triển khai Astrology Engine thật.

**Không phải** "expose Swiss Ephemeris qua 1 endpoint" — là dựng **Astrology Engine tái sử dụng được**, phục vụ Natal Chart trước, và Synastry/Composite/Transit/Progression/Solar Return sau này mà không cần thiết kế lại ranh giới Domain↔Swiss Ephemeris.

**Đầu vào của Sprint 3:** 2 spec đã Confirmed (Natal Chart Domain Spec v1.1, Swiss Ephemeris Integration Spec v1.1) — đóng vai trò tương đương "Implementation Plan cấp domain/integration" đã có sẵn; Sprint 3 Plan này là **Implementation Plan cấp thực thi** (task, milestone, file, DI, migration cụ thể).

**Sửa 1 điểm framing của tài liệu tham chiếu (Backend Implementation Guide §19, đã nêu ở Swiss Ephemeris Integration Spec Mục 18.2):** ví dụ code minh họa gốc chưa cập nhật theo `calculateHouses()`/`HouseCalculationResult` mới — Sprint 3 áp dụng đúng interface đã Confirmed, không phải ví dụ minh họa cũ.

**Sửa 1 điểm nữa phát hiện qua inspect code thật (không có trong bất kỳ spec nào trước đó):** Prompt liệt kê "CommonJS" là nguyên tắc kiến trúc — nhưng `backend/package.json` (`"type": "module"`) và `backend/tsconfig.json` (`"module": "NodeNext"`) xác nhận dự án thật dùng **ESM**, không phải CommonJS. Toàn bộ import trong Sprint 3 dùng cú pháp ESM chuẩn (`import ... from './x.js'`, đuôi `.js` bắt buộc dù file nguồn là `.ts`, đúng require của `NodeNext` resolution) — đúng "existing source code is final implementation truth" (nguyên tắc IMPORTANT của prompt).

---

## 2. Goals

1. Dựng đầy đủ Natal Chart Domain Model theo đúng Natal Chart Domain Spec v1.1 (Chart Aggregate, 5 Entity, Value Object, Domain Service, Domain Policy).
2. Tích hợp Swiss Ephemeris qua `SwissEphemerisAdapter` theo đúng Swiss Ephemeris Integration Spec v1.1 — Domain hoàn toàn không biết `swisseph-wasm` tồn tại.
3. Astrology Engine tính đúng: Planet (10 bắt buộc + 4 optional), House (Placidus + Whole Sign), Angle, Aspect (5 loại) — Pattern **deferred** (`patterns=[]`, D-14).
4. Chart Snapshot bất biến, persist đúng schema đã đặc tả, truy xuất qua REST API đúng ownership.
5. Bổ sung `getBirthProfileSnapshot` use case vào module `birth-profile` (Conflict #2 RESOLVED) — điểm tích hợp cross-module duy nhất.
6. Golden/Reference Test xác nhận độ chính xác thiên văn thật, không chỉ đúng logic nội bộ.
7. Licensing & Compliance record đầy đủ — Production Launch Gate được xác định tường minh, không chặn Sprint 3 code/test local.
8. Coverage/edge-case review có chủ đích (Milestone 9), Sprint Closure đầy đủ bằng chứng (Milestone 10) — đúng khuôn mẫu đã dùng cho Sprint F1 (Frontend).

---

## 3. Scope

Toàn bộ đã liệt kê chi tiết ở 2 spec thượng nguồn — tóm tắt phạm vi thực thi:

- **Domain:** `Chart`, `Planet`, `House`, `Angle`, `Aspect`, `Pattern` (entity giữ nguyên, thuật toán deferred), `ZodiacPosition`, `EngineInput`, `Warning`, `HouseCalculationResult` VO; toàn bộ Calculator (Planet/House/Angle/Aspect — Pattern trả `[]`); `ChartBuilder`; Domain error taxonomy.
- **Application:** `CreateNatalChartUseCase`, `GetChartUseCase`, `ListChartsUseCase` (bao gồm phân trang/filter/sort — **CONFIRMED chính thức**, không còn tùy chọn), `DeleteChartUseCase`; `GetBirthProfileSnapshotUseCase` (module `birth-profile`, mới).
- **Infrastructure:** `SwissEphemerisAdapter` (implement `IEphemerisProvider`), `PrismaChartRepository`, mapper Prisma↔Domain, house-system/celestial-body mapping table, serialize queue nội bộ (D-8 Swiss Ephemeris Spec Confirmed).
- **Presentation:** routes, controller, Zod schema, response mapper, OpenAPI fragment cho `POST/GET/DELETE /charts/natal` và `GET /charts/{id}` (theo đúng REST API Spec §4.4 — chỉ tham chiếu, không định nghĩa lại).
- **Database:** migration mới cho `charts`, `chart_planets`, `chart_houses`, `chart_angles`, `chart_aspects`, `chart_patterns`, `chart_pattern_planets` (DB Design Spec §5.6–5.13, đã đóng băng).
- **Testing:** Unit (Domain), Adapter Test (Swiss Ephemeris thật), Integration (BirthProfile→Chart→Persist), API Test (Supertest), Golden/Reference Test.
- **Licensing:** verify + license/compliance record (Mục 13).
- **DevOps nhỏ:** sửa vị trí sai của backend CI (`backend/.github/workflows/ci.yml` → root `.github/workflows/backend-ci.yml`) — phát hiện qua inspect trực tiếp, đã tồn tại từ trước Sprint 3 (ghi nhận từ tài liệu tổng kết Sprint F1 Frontend, chưa từng được xử lý cho Backend) — corrective nhỏ, cùng bản chất với các corrective task đã làm ở M10 Frontend.

---

## 4. Out of Scope

Đúng danh sách tối thiểu prompt yêu cầu + xác nhận qua 2 spec thượng nguồn:

Synastry, Composite, Transit (implementation thật — chỉ `calculateTransit()` interface stub, throw `UnsupportedChartTypeError`), Progression, Solar Return, AI interpretation (thật — chỉ boundary `IInterpretationContentProvider` nếu cần dùng, nội dung diễn giải content bank không cần đầy đủ), large-scale caching, Redis (đã Confirmed deferred — Swiss Ephemeris Integration Spec Mục 29), frontend chart visualization, unnecessary admin tooling (Admin chỉ có quyền như "chủ sở hữu", không có override — Natal Chart Domain Spec Mục 30), Pattern detection algorithm (Grand Trine/T-Square/Grand Cross/Yod — D-14 Deferred, giữ nguyên Entity/DB/API field, `patterns=[]`), `MOON_SIGN_UNCERTAIN` warning riêng (D-2 Deferred), `activeModalId`-tương-đương ở backend (không áp dụng, đây là khái niệm Frontend), cài đặt `backend/ephemeris-data/` tùy biến (OQ-6/7/10 Confirmed — dùng bundled data trừ khi technical spike chứng minh cần khác).

---

## 5. Authoritative Documents

Đúng 19 nguồn prompt liệt kê — xác nhận mức độ dùng:

| # | Tài liệu | Vai trò trong Sprint 3 Plan |
|---|---|---|
| 1 | PRD | NFR (< 5s), scope tổng, đã trích đủ ở 2 spec thượng nguồn |
| 2 | Astrology Domain Specification | Nguồn domain gốc — đã hấp thụ đầy đủ vào Natal Chart Domain Spec |
| 3 | Astrology Engine Specification | Nguồn pipeline/kiến trúc Engine gốc — đã hấp thụ đầy đủ |
| 4 | REST API Specification | Nguồn DTO/endpoint — chỉ tham chiếu (Mục 10) |
| 5 | Database Design Specification | Nguồn schema — chỉ tham chiếu (Mục 9), xác nhận qua Prisma schema thật |
| 6 | Project Architecture Specification | Nguồn layer/module/DI/ADR — đối chiếu trực tiếp qua `composition-root.ts` thật |
| 7 | Backend Implementation Guide | Nguồn code pattern/convention minh họa |
| 8 | Coding Standards & Conventions | Naming, logging, TODO/FIXME, testing convention |
| 9 | **Natal Chart Domain Specification v1.1 (Confirmed)** | **Nguồn domain quan trọng nhất** — D-1 đến D-14 đã Confirmed, 2 Conflict RESOLVED |
| 10 | **Swiss Ephemeris Integration Specification v1.1 (Confirmed)** | **Nguồn integration quan trọng nhất** — 10 OQ Confirmed, Licensing Gate xác định |
| 11 | Sprint 0 Implementation Plan | Xác nhận hạ tầng CI/Docker/Prisma đã có |
| 12 | Sprint 1 Implementation Plan | Mẫu style Milestone/Task (đã đọc, cấu trúc ngắn gọn hơn Sprint 2) |
| 13 | Sprint 2 Implementation Plan | **Mẫu style Milestone/Task chính** — Sprint 3 Plan theo đúng cấu trúc bảng/mục này |
| 14 | Sprint 2 implementation results | Xác nhận `birth_profiles` schema/code thật khớp spec, `getSnapshotData()`/tương đương **chưa tồn tại** — xác nhận trực tiếp qua `grep`, Conflict #2 (Natal Chart Domain Spec) vẫn cần Task thực thi |
| 15 | Existing source code | Inspect trực tiếp toàn bộ `birth-profile`/`identity` module — nguồn convention thật (Mục 8 tài liệu này) |
| 16 | Existing tests | Inspect trực tiếp `backend/tests/` — xác nhận cấu trúc `unit/`, `integration/`, `api/` tách biệt (khác Frontend co-located) |
| 17 | Existing Prisma schema | Inspect trực tiếp `backend/prisma/schema.prisma` + `migrations/` — xác nhận chưa có model `Chart` nào, xác nhận naming convention migration |
| 18 | Existing OpenAPI specification | Không có file tĩnh — xác nhận qua `backend/src/docs/openapi.ts` + `scripts/generate-openapi.ts` (generate động từ `*.openapi.ts` fragment mỗi module) |
| 19 | Existing CI configuration | Inspect trực tiếp `backend/.github/workflows/ci.yml` — xác nhận vị trí sai (Mục 3, Risk Mục 18) |

**Không có mâu thuẫn nào cần silently resolve ở cấp Sprint 3 Plan** — 2 Conflict đã phát hiện trước đó (Unknown Birth Time, Cross-module read pattern) đều đã RESOLVED ở Natal Chart Domain Spec, Sprint 3 Plan chỉ thực thi.

---

## 6. Architecture Impact

**Module mới:** `backend/src/modules/chart/` — module thứ 3 trong Modular Monolith (sau `identity`, `birth-profile`).

**Không đổi kiến trúc tổng thể** — đúng "Modular Monolith, Clean Architecture, DDD-lite, Ports & Adapters" đã áp dụng nhất quán cho 2 module trước, Chart module theo đúng layer: `domain/` → `application/` → `infrastructure/` → `presentation/`.

**Điểm mới duy nhất về mặt kiến trúc (không phải pattern mới, chỉ là lần đầu áp dụng):** đây là lần đầu tiên có **cross-module dependency thật** (`chart` → `birth-profile`) — Architecture Spec §8 (Module Communication) lần đầu được thực thi thật, không còn chỉ là nguyên tắc lý thuyết. Xử lý đúng theo Conflict #2 RESOLVED (Natal Chart Domain Spec) — chi tiết Mục 7 dưới.

**Điểm mới thứ 2:** module `chart` là module đầu tiên có **External Adapter tính toán nặng** (`SwissEphemerisAdapter`, khác `identity`/`birth-profile` chỉ có Adapter I/O đơn giản như `GeoTzTimezoneAdapter`) — cần thêm `chart/domain/engine/` (Astrology Engine, pure calculation, sống trong Domain layer theo đúng Architecture Spec §3.3.1 mapping đã có sẵn).

**Không có breaking change** cho `identity`/`birth-profile` — chỉ **thêm** 1 use case mới (`GetBirthProfileSnapshotUseCase`) vào `birth-profile/application/`, không sửa bất kỳ file nào đã đóng của Sprint 2.

---

## 7. Domain Implementation Strategy

### 7.1 Chart Module — cấu trúc file (trích dẫn trực tiếp Swiss Ephemeris Integration Spec Mục 31, xác nhận khớp đúng convention thật đã inspect)

```
backend/src/modules/chart/
├── domain/
│   ├── entities/
│   │   ├── chart.entity.ts
│   │   ├── planet.entity.ts
│   │   ├── house.entity.ts
│   │   ├── angle.entity.ts
│   │   ├── aspect.entity.ts
│   │   ├── pattern.entity.ts          ← entity đầy đủ, không có logic detect (D-14)
│   │   └── index.ts
│   ├── value-objects/
│   │   ├── zodiac-position.vo.ts
│   │   ├── engine-input.vo.ts
│   │   ├── warning.vo.ts
│   │   ├── calculation-metadata.vo.ts
│   │   └── index.ts
│   ├── errors/
│   │   ├── chart.errors.ts            ← UnsupportedHouseSystemError, InvalidCoordinateError,
│   │   │                                 InvalidDateTimeError, UnsupportedCelestialBodyError,
│   │   │                                 UnsupportedChartTypeError, DataIntegrityError, ChartCalculationFailed
│   │   └── index.ts
│   ├── ports/
│   │   ├── ephemeris-provider.port.ts ← IEphemerisProvider, EphemerisRequest, RawEphemerisData,
│   │   │                                 HouseCalculationRequest, RawHouseData, HouseCalculationResult
│   │   ├── chart-repository.port.ts   ← IChartRepository
│   │   └── index.ts
│   └── engine/
│       ├── validation/
│       │   └── chart-input.validator.ts
│       ├── calculators/
│       │   ├── planet.calculator.ts
│       │   ├── house.calculator.ts
│       │   ├── angle.calculator.ts
│       │   ├── aspect.calculator.ts
│       │   └── pattern.calculator.ts   ← luôn trả [] (D-14)
│       └── chart-builder.ts
├── application/
│   ├── use-cases/
│   │   ├── create-natal-chart.usecase.ts
│   │   ├── get-chart.usecase.ts
│   │   ├── list-charts.usecase.ts
│   │   └── delete-chart.usecase.ts
│   ├── errors/
│   │   └── map-domain-error.ts        ← đúng pattern birth-profile đã có
│   └── shared/
│       └── assert-chart-ownership.ts  ← đúng pattern assert-ownership.ts đã có ở birth-profile
├── infrastructure/
│   ├── adapters/
│   │   ├── swiss-ephemeris.adapter.ts ← LỚP DUY NHẤT import swisseph-wasm
│   │   ├── house-system.mapping.ts
│   │   └── celestial-body.mapping.ts
│   ├── mappers/
│   │   └── prisma-chart.mapper.ts
│   └── repositories/
│       └── prisma-chart.repository.ts
└── presentation/
    ├── controllers/
    │   └── chart.controller.ts
    ├── routes/
    │   └── chart.routes.ts
    ├── schemas/
    │   ├── create-natal-chart.schema.ts
    │   └── chart-id.schema.ts
    ├── mappers/
    │   └── chart-response.mapper.ts
    ├── openapi/
    │   └── chart.openapi.ts
    └── index.ts
```

**Xác nhận khớp convention thật:** cấu trúc trên khớp 100% với `birth-profile` module thật đã inspect (`application/errors/map-domain-error.ts`, `application/shared/assert-ownership.ts`, `presentation/{controllers,routes,schemas,mappers,openapi}/`, `presentation/index.ts` làm barrel — chỉ export route/controller, không export Domain/Repository).

### 7.2 Domain Entities/VO — không định nghĩa lại, chỉ trỏ nguồn

Toàn bộ thuộc tính, invariant, quan hệ đã đóng băng ở Natal Chart Domain Spec Mục 6–9, 12–21, 25. Task Breakdown (Mục 15) chỉ tham chiếu mục tương ứng, không nhắc lại nội dung.

### 7.3 Domain Errors — bảng đầy đủ, map sang `ErrorCode` mới cần thêm

Đối chiếu trực tiếp `backend/src/shared/errors/error-codes.ts` thật — đã có sẵn `EPHEMERIS_PROVIDER_ERROR`, `EXTERNAL_SERVICE_ERROR`, `DOMAIN_ERROR` (dùng chung) nhưng **chưa có** code riêng cho Chart domain errors (đúng dự đoán — Chart module chưa tồn tại). Cần bổ sung vào `ErrorCode` enum, theo đúng convention block-comment đã có (`// Birth Profile Domain` → thêm `// Chart Domain`):

```typescript
// Chart Domain
UNSUPPORTED_HOUSE_SYSTEM = 'UNSUPPORTED_HOUSE_SYSTEM',
UNSUPPORTED_CHART_TYPE = 'UNSUPPORTED_CHART_TYPE',
UNSUPPORTED_CELESTIAL_BODY = 'UNSUPPORTED_CELESTIAL_BODY',
INVALID_COORDINATES = 'INVALID_COORDINATES',
INVALID_DATETIME = 'INVALID_DATETIME',
DATA_INTEGRITY_ERROR = 'DATA_INTEGRITY_ERROR',
```

**Không tái sử dụng** `INVALID_LATITUDE_RANGE`/`INVALID_LONGITUDE_RANGE` (đã có, thuộc `birth-profile`) — dù ý nghĩa validate tương tự, đây là lỗi ở **input của Chart calculation** (có thể tới từ `birthData` inline, không nhất thiết qua BirthProfile), giữ tách biệt đúng ranh giới module, tránh Chart module phụ thuộc ngược vào chi tiết lỗi nội bộ của `birth-profile`.

`HouseSystemNotConvergingError`/`HOUSE_SYSTEM_NOT_CONVERGING` — **không phải exception**, là `Warning.code` (Natal Chart Domain Spec Mục 26) — không thêm vào `ErrorCode` enum.

### 7.4 Domain Policy

`UnknownBirthTimePolicy` (Mục 11 Natal Chart Domain Spec) và `OrbPolicy` (Mục 18.2) — implement dưới dạng **pure function/constant module** trong `chart/domain/engine/`, không phải class riêng có state — đúng nguyên tắc Domain Service không mang state (Mục 6.4 Natal Chart Domain Spec).

---

## 8. Swiss Ephemeris Integration Strategy

**Không định nghĩa lại** — thực thi đúng Swiss Ephemeris Integration Spec v1.1 nguyên trạng. Xác nhận điểm thực thi cụ thể:

| Khía cạnh | Quyết định đã Confirmed | Task thực thi |
|---|---|---|
| Interface | `IEphemerisProvider` (3 method, `calculateHouses()` trả `HouseCalculationResult`) | M1 — Domain port, không code Adapter |
| Version pin | Technical spike đầu Sprint 3 (Swiss Ephemeris Integration Spec OQ-9 / đây là OQ-B2 của Sprint 3 Plan) | M2 — Task đầu tiên, output: version cụ thể ghi vào `package.json` + license record (Mục 13) |
| House system mapping | `'P'`/`'W'` (native Whole Sign) | M2 |
| Celestial body mapping | 10 chuẩn + Mean Lilith (`SE_MEAN_APOG`) + Mean Node (`SE_MEAN_NODE`) + South Node derived | M2 |
| Non-convergence | `HouseCalculationResult` discriminated union | M2 (Adapter), M3 (Domain tiêu thụ) |
| Ephemeris data | Bundled trong `swisseph-wasm`, không tạo `backend/ephemeris-data/` mặc định | M2 |
| WASM lifecycle | Eager init tại `composition-root.ts`, singleton, luôn serialize qua hàng đợi nội bộ | M2 |
| Error translation | `try/catch` → `ExternalServiceError('EPHEMERIS_PROVIDER_ERROR', ...)` | M2 |
| Determinism | `engineVersion` = định danh tổng hợp (code + ephemeris data + flags) | M2 (định nghĩa hằng số), M5 (persist) |

**Technical Spike (M2, Task đầu tiên, bắt buộc trước khi code Adapter thật):** xác nhận 3 mục còn lại thuộc diện "technical verification" (không phải quyết định thiết kế) của Swiss Ephemeris Integration Spec: (1) cơ chế SDK báo hiệu non-convergence cụ thể (để map đúng vào `HouseCalculationResult`); (2) phạm vi năm chính xác của dataset bundled (đối chiếu với biên `1800–2399 CE` mục tiêu, Confirmed OQ-6); (3) license file chính xác của package (Mục 13). Output spike: 1 ghi chú ngắn (không phải tài liệu riêng) đính kèm PR đầu tiên của M2, xác nhận 3 mục trên.

---

## 9. Database Strategy

**Không định nghĩa lại schema** — dùng nguyên trạng Database Design Specification §5.6–5.13 (đã đóng băng, đã trích đầy đủ ở Natal Chart Domain Spec Mục 28). Xác nhận qua Prisma schema thật: **chưa có model `Chart` nào** — cần migration mới hoàn toàn.

### 9.1 Migration

Theo đúng convention 2 migration đã có (`20260715000000_init_identity_module`, `20260724000000_init_birth_profile_module`) — migration mới: `<timestamp>_init_chart_module`, tạo:

- `charts` (bao gồm 9 cột `snapshot_*`, `engine_version`, `calculated_at`, `house_system`, `is_house_data_available`, `warnings` JSONB, `user_id` FK NOT NULL, `birth_profile_id` FK nullable SET NULL, `deleted_at`).
- `chart_planets`, `chart_houses`, `chart_angles`, `chart_aspects`, `chart_patterns`, `chart_pattern_planets` — đúng cấu trúc DB Spec §5.8–5.13, FK CASCADE về `charts`.
- CHECK constraints: `chart_type IN ('Natal')`, `house_system IN ('Placidus','WholeSign')`, `chart_planets.name IN (<14 giá trị>)`, `chart_aspects.aspect_type IN (<5 giá trị>)`, `chart_aspects.planet_a < chart_aspects.planet_b` (canonical ordering), `NOT (name IN ('Sun','Moon') AND is_retrograde=true)`.
- UNIQUE: `(chart_id, planet_a, planet_b)` trên `chart_aspects`; `(chart_id, number)` trên `chart_houses`.
- Index: `charts.user_id`, `charts.birth_profile_id`.

**Không CONSTRAINT TRIGGER** cho `DSC=ASC+180`/`IC=MC+180` — Domain self-check only (D-4 Confirmed, Mục 9.2 dưới).

**Transaction boundary:** `PrismaChartRepository.save()` bọc toàn bộ insert (`charts` + 6 bảng con) trong **1 transaction Prisma** (`prisma.$transaction`) — đảm bảo không có Chart "nửa vời" (có `charts` row nhưng thiếu `chart_planets`) nếu lỗi giữa chừng.

### 9.2 Vì sao không cần Trigger (trả lời trực tiếp "If no schema change is required, explicitly state why" — áp dụng ngược cho phần schema KHÔNG cần)

DB Spec đã để ngỏ Trigger cho DSC/IC (Natal Chart Domain Spec D-4: **CONFIRMED — Domain self-check only**) — không tạo Trigger, vì `Angle Calculator` (Domain) là đường ghi duy nhất vào `chart_angles`, không có insert thủ công nào khác trong toàn hệ thống.

### 9.3 Soft deletion, audit fields

`deleted_at` trên `charts` — đúng pattern `birth_profiles` đã dùng. **Không có `updated_at`** trên `charts` (Natal Chart Domain Spec Mục 27.6 — immutable, bằng chứng thiết kế trực tiếp). `chart_*` bảng con **không có** `deleted_at`/`updated_at` riêng — xóa mềm chỉ set ở `charts`, con cascade theo cha khi hard-delete (nếu có), không cần soft-delete riêng từng bảng con.

---

## 10. API Strategy

**Không định nghĩa lại DTO/endpoint** — dùng nguyên trạng REST API Specification §4.4, §5.4, §5.8 (đã đóng băng). Tóm tắt thực thi:

| Endpoint | Method | Auth | Ghi chú |
|---|---|---|---|
| `/charts/natal` | `POST` | Guest (nếu `save=false`) hoặc User/Admin (nếu `save=true`) | `birthProfileId` XOR `birthData` inline |
| `/charts/{id}` | `GET` | User/Admin, chỉ chủ sở hữu | Đọc snapshot DB, không tính lại |
| `/charts/{id}` | `DELETE` | User/Admin, chỉ chủ sở hữu | Soft delete |
| `/charts` | `GET` | User/Admin | **CONFIRMED — chính thức thuộc Sprint 3** (REST API Spec §4.4 đã định nghĩa tường minh, không phải suy diễn). Query: `page`, `pageSize`, `birthProfileId` (filter), `sortBy=calculatedAt`, `order`. Response: `PaginatedResponse<ChartSummaryResponse>` (DTO rút gọn — `id`, `birthProfileId`, `birthProfileLabel` (denormalized, tránh N+1), `houseSystem`... — không kèm `planets`/`aspects` đầy đủ, tối ưu payload) |

**Query schema cho `GET /charts`:** đúng convention `list-birth-profiles-query.schema.ts` đã có — `list-charts-query.schema.ts` với `page`/`pageSize`/`birthProfileId`/`sortBy` (chỉ `'calculatedAt'`, không có lựa chọn khác — khác `birth-profile` có 2 lựa chọn `sortBy`)/`order`.

**Validation:** Zod schema (`create-natal-chart.schema.ts`) đúng convention `birth-profile` — validate shape trước khi vào Application layer, **không** validate lại business rule (coordinate range, house system enum) ở đây (đó là Domain Validation, Mục 7).

**OpenAPI:** `chart.openapi.ts` đăng ký fragment theo đúng pattern `birth-profile.openapi.ts` — không tạo file spec tĩnh riêng, dùng `npm run generate:openapi` (script đã có) để sinh ra từ toàn bộ fragment.

**Serialization:** response mapper (`chart-response.mapper.ts`) map Domain `Chart` → `ChartResponse` DTO — không lộ field Domain-internal (`userId` không xuất hiện trong response, đúng Natal Chart Domain Spec Mục 29).

---

## 11. Error Handling

Kế thừa RFC7807 Error Kernel đã có (`AppError`, `ValidationError`, `ExternalServiceError`...) — không tạo cơ chế mới. Bảng phân loại đầy đủ (đúng yêu cầu prompt §15):

| Loại | Ví dụ | HTTP Status | Xử lý |
|---|---|---|---|
| Validation errors | Zod schema fail | 422 | `ValidationError` |
| Ownership errors | User không phải chủ sở hữu Chart | 403 | Đúng pattern `assert-ownership.ts` đã có, tạo `assert-chart-ownership.ts` tương tự |
| Invalid BirthProfile state | `birthProfileId` không tồn tại/không thuộc user | 404/403 | `GetBirthProfileSnapshotUseCase` throw, Chart Application layer bắt và map lại |
| Unsupported chart configuration | `houseSystem` không hợp lệ | 422 | `UnsupportedHouseSystemError` → `ValidationError` |
| Swiss Ephemeris errors | SDK throw/timeout | 502/503 (`EXTERNAL_SERVICE_ERROR`) | `ExternalServiceError('EPHEMERIS_PROVIDER_ERROR', ...)` — đã có code sẵn |
| Ephemeris data errors | Init thất bại lúc bootstrap | Không phải HTTP — app không khởi động | Fail-fast, log `fatal`, process exit |
| Calculation failures | Lỗi runtime không lường trước trong Calculator | 500 | `ChartCalculationFailed` → `INTERNAL_SERVER_ERROR`, log full stack, không lộ chi tiết |
| Persistence failures | Prisma transaction fail | 500 | Bắt ở Repository, map `INTERNAL_SERVER_ERROR` |
| Unexpected infrastructure failures | — | 500 | Error Handler Middleware fallback đã có sẵn |

**Không throw** cho `HOUSE_SYSTEM_NOT_CONVERGING` — Warning mềm (Mục 7.3).

**Raw library error không lộ:** đúng pattern đã có (`ExternalServiceError` message tiếng Việt chung chung, không chứa message gốc từ `swisseph-wasm`).

---

## 12. Testing Strategy

Đúng cấu trúc `backend/tests/{unit,integration,api}/modules/chart/` đã xác nhận qua inspect (Mục 5, #16).

### 12.1 Unit (`tests/unit/modules/chart/`)

`domain/entities/`, `domain/value-objects/`, `domain/engine/calculators/` — 21 Testable Business Rule (TR-1 đến TR-21, Natal Chart Domain Spec Mục 31) map trực tiếp vào đây, mỗi TR = tối thiểu 1 test case. Domain Calculator test dùng `RawEphemerisData`/`RawHouseData` **giả lập** (fixture cố định), không cần WASM thật.

### 12.2 Adapter Test (`tests/unit/modules/chart/infrastructure/adapters/`, dùng WASM thật — chậm hơn, tách riêng bằng tag/describe nếu cần)

Đúng Swiss Ephemeris Integration Spec Mục 26.2 — initialization, planetary calculation shape, house calculation shape, error translation, non-convergence trả đúng `HouseCalculationResult`.

### 12.3 Integration (`tests/integration/modules/chart/`)

`PrismaChartRepository` — transaction đúng (Mục 9.1), snapshot roundtrip (persist rồi đọc lại khớp 100%).

### 12.4 API Test (`tests/api/chart/`)

Đúng pattern `birth-profile.api.test.ts` — Supertest, Swiss Ephemeris **giữ thật** (Architecture Spec §17, đã trích ở Swiss Ephemeris Integration Spec Mục 26.3 — deterministic và nhanh, không cần mock).

### 12.5 Golden/Reference Test (`tests/integration/modules/chart/golden/` hoặc tương đương)

Đúng Swiss Ephemeris Integration Spec Mục 27 — ≥5 fixture (Bắc bán cầu, Nam bán cầu, gần vĩ độ cực, ngày sinh xa quá khứ, `isBirthTimeKnown=false`), tolerance `0.01°` (D-8 Confirmed). **Giá trị `expected` chưa có sẵn trong bất kỳ tài liệu nào** — xem Mục 15 Task chuẩn bị dữ liệu (bắt buộc trước M8).

### 12.6 Mock/Test double

`FakeEphemerisProvider` (đúng Swiss Ephemeris Integration Spec Mục 26.6) cho Application-layer test — không gọi WASM thật khi test `CreateNatalChartUseCase` logic orchestration.

### 12.7 Backend Coverage Policy — CONFIRMED (OQ-B5, resolved)

**Không có ngưỡng % toàn cục.** M9 dùng **risk-based coverage review**, đúng 4 tiêu chí sau (thay thế hoàn toàn hướng "áp dụng lại triết lý Frontend" đã đề xuất ở draft — nay là chính sách Backend độc lập, chính thức):

1. Toàn bộ business rule đã đóng băng (21 TR, Natal Chart Domain Spec Mục 31) có test.
2. Toàn bộ critical branch có test (ví dụ: `isBirthTimeKnown` true/false, `HouseCalculationResult` success/not_convergent, Guest/User/Admin auth path).
3. Toàn bộ edge case đã liệt kê (Swiss Ephemeris Integration Spec Mục 36, 18 case) có test.
4. Coverage report được review thủ công tìm gap **có ý nghĩa** — % là chỉ số chẩn đoán (diagnostic), không phải Acceptance Criterion.

**Follow-up ngoài Sprint 3 (không chặn, ghi nhận ở M10 Known Gaps):** Backend Coding Standards & Conventions hiện **chưa có** mục tương đương chính sách này bằng văn bản — cần bổ sung 1 mục "Coverage Philosophy" vào tài liệu đó **sau khi Sprint 3/M9 kết thúc** (dùng chính kinh nghiệm M9 làm minh chứng thực tế, đúng cách README Frontend đã hoàn thiện dần qua thực tế thay vì viết trước lý thuyết suông).

---

## 13. Licensing & Compliance

**P0 — Production Compliance Gate** (đúng Swiss Ephemeris Integration Spec Mục 37) — **OQ-B1 RESOLVED**: AstroViet là dự án open-source, dùng Swiss Ephemeris theo hướng **AGPL**. Đây không còn là quyết định "chọn A hay B" — đã chốt hướng đi (A: AGPL/open-source), phần còn lại của Sprint 3 chỉ là **technical compliance verification** (M2 khởi tạo record, M10 audit lại đầy đủ), không phải chờ quyết định kinh doanh nữa.

### 13.1 License/Compliance Record — mẫu bắt buộc điền trong M2 (Technical Spike), audit lại ở M10

| Trường | Giá trị | Trạng thái |
|---|---|---|
| Dependency name | `swisseph-wasm` (tên chính xác cần xác nhận đúng theo npm registry lúc spike) | Chờ M2 |
| Exact version | Pin sau spike (OQ-B2) | Chờ M2 |
| Source repository | URL repo npm package | Chờ M2 |
| Package license (npm) | Đọc `LICENSE`/`package.json.license` của package | Chờ M2 |
| Upstream Swiss Ephemeris license | AGPL v3 (Astrodienst AG) — **hướng đã chốt (RESOLVED)**, verify chi tiết điều khoản hiện hành trên trang chính thức Astrodienst | Chờ M2 verify chi tiết, M10 audit |
| Ephemeris data source | Bundled trong package — xác nhận nguồn gốc data (cùng Astrodienst hay bên thứ 3 khác) | Chờ M2 |
| Applicable notices | Copy nguyên văn notice/copyright header nếu có | Chờ M2 |
| AGPL compliance obligations (thay "Production decision status") | Xác nhận cụ thể: phạm vi mã nguồn AstroViet cần công khai theo AGPL Section 13 (network use) trước khi go-live public — **hướng đã RESOLVED (AGPL)**, cần xác định **phạm vi chính xác** (toàn bộ backend repo hay chỉ phần liên kết trực tiếp Swiss Ephemeris) | Chờ M10 audit đầy đủ |

**Không đưa ra kết luận pháp lý vượt quá những gì license document chính thức nêu** (đúng yêu cầu prompt "Do NOT make legal conclusions beyond what the official license documents establish") — record trên chỉ **ghi nhận sự thật và xác nhận compliance**, không tự diễn giải mở rộng nghĩa vụ AGPL vượt quá văn bản chính thức.

### 13.2 Development vs Production (đúng phân biệt đã Confirmed)

| Giai đoạn | Được phép tiếp tục? |
|---|---|
| Sprint 3 code, test local, CI (không public) | **Có** — không kích hoạt nghĩa vụ AGPL "network use" |
| Production launch công khai | Cho phép **sau khi** M10 Audit (Mục 13.1) xác nhận đầy đủ compliance AGPL (đã biết hướng đi, chỉ còn xác nhận đã tuân thủ đúng — không còn là "chờ quyết định A/B") |

Đây là **duy nhất 1 gate** của toàn bộ Sprint 3 — không chặn bất kỳ Milestone kỹ thuật nào (M1–M9), chỉ chặn **go-live** sau M10, và bản chất gate đã nhẹ hơn draft trước (compliance audit, không phải business decision còn treo).

---

## 14. Milestone Breakdown

Theo đúng flow khuyến nghị của prompt, điều chỉnh nhẹ theo thực tế phụ thuộc kỹ thuật (Technical Spike đặt đầu M2 vì mọi Task sau đều phụ thuộc version pin). **CI Fix đã di chuyển M10 → M1** (Confirmed) — để toàn bộ Sprint 3 có CI bảo vệ ngay từ đầu, không phải chờ tới lúc đóng Sprint mới phát hiện CI chưa từng chạy đúng.

```
M1 Domain Foundation (+ T-CI-FIX ngay đầu Sprint)
   ↓
M2 Swiss Ephemeris Dependency & Adapter Foundation (bao gồm Technical Spike + Licensing record khởi tạo)
   ↓
M3 Astrology Calculation Engine
   ↓
M4 BirthProfile Integration (+ T-BOUNDARY-VERIFY)
   ↓
M5 Chart Persistence
   ↓
M6 Application Layer & Orchestration (bao gồm ListChartsUseCase phân trang/filter/sort — chính thức)
   ↓
M7 API Layer (bao gồm GET /charts — chính thức)
   ↓
M8 Integration & Golden Reference Tests
   ↓
M9 Coverage & Edge-Case Review (risk-based, không ngưỡng %)
   ↓
M10 Final Review / Documentation / Closure (Licensing = Audit compliance, không còn quyết định A/B)
```

### Milestone 1 — Domain Foundation

**Objective:** Dựng toàn bộ Domain layer thuần túy (Entity, VO, Port, Error) — không I/O, không Swiss Ephemeris thật, không DB thật. **Đồng thời sửa vị trí CI backend ngay từ đầu Sprint (T-CI-FIX, đã di chuyển từ M10).**

**Scope:** `chart/domain/entities/`, `chart/domain/value-objects/`, `chart/domain/ports/`, `chart/domain/errors/`. Bổ sung `ErrorCode` enum (Mục 7.3). Di chuyển `backend/.github/workflows/ci.yml` → `.github/workflows/backend-ci.yml` (root).

**Deliverables:** Toàn bộ file domain liệt kê Mục 7.1 (trừ `engine/`), `ErrorCode` mở rộng; CI backend chạy đúng từ root.

**Dependencies:** Không (module hoàn toàn mới, độc lập).

**Acceptance Criteria:** Toàn bộ Entity/VO khớp 100% Natal Chart Domain Spec Mục 6–9; `IEphemerisProvider` khớp 100% Swiss Ephemeris Integration Spec Mục 8; INV-1 đến INV-16 (Natal Chart Domain Spec Mục 25) có test tương ứng; CI backend trigger đúng trên PR/push đầu tiên của Sprint 3 (xác nhận qua 1 lần chạy thật trên GitHub Actions **trước khi** merge bất kỳ code nào khác của M1).

**Testing:** Unit test cho từng Entity/VO — validate invariant, không cần mock gì (thuần TypeScript).

**Definition of Done:** `npm run typecheck`/`lint`/`test` sạch cho riêng phạm vi `domain/`; CI backend đã chạy xanh ít nhất 1 lần từ vị trí mới trước khi M1 đóng (bảo vệ toàn bộ M2–M10 phía sau).

---

### Milestone 2 — Swiss Ephemeris Dependency & Adapter Foundation

**Objective:** Cài đặt, pin, verify license `swisseph-wasm`; dựng `SwissEphemerisAdapter` hoạt động thật.

**Scope:** Technical Spike (Mục 8) → cài `swisseph-wasm` → `swiss-ephemeris.adapter.ts`, `house-system.mapping.ts`, `celestial-body.mapping.ts` → wiring WASM lifecycle (eager init, singleton, serialize queue) vào `composition-root.ts`.

**Deliverables:** `swisseph-wasm` trong `package.json` (version pin cụ thể); 3 file Adapter/mapping; License/Compliance Record khởi tạo đầy đủ (Mục 13.1, 7/8 trường — trừ "AGPL compliance obligations" chờ audit đầy đủ ở M10); bootstrap fail-fast validation.

**Dependencies:** M1 (cần `IEphemerisProvider` port đã tồn tại để implement).

**Acceptance Criteria:** `calculateNatal()` trả đúng shape `RawEphemerisData` cho ≥1 input thật; `calculateHouses()` trả đúng `HouseCalculationResult` (cả nhánh `success` và `not_convergent` — test bằng input gần vĩ độ cực); License record đầy đủ 7/8 trường (trừ "AGPL compliance obligations" — chờ audit đầy đủ M10).

**Testing:** Adapter Test (Mục 12.2) — dùng WASM thật.

**Definition of Done:** Adapter hoạt động độc lập (test riêng, chưa cần Domain Calculator tiêu thụ); Technical Spike note đính kèm PR.

---

### Milestone 3 — Astrology Calculation Engine

**Objective:** Dựng đầy đủ Calculator + Chart Builder — pipeline tính toán hoàn chỉnh (trừ Pattern thuật toán, D-14 Deferred).

**Scope:** `chart/domain/engine/validation/`, `calculators/{planet,house,angle,aspect,pattern}.calculator.ts`, `chart-builder.ts`.

**Deliverables:** 5 Calculator + Chart Builder; `UnknownBirthTimePolicy`/`OrbPolicy` (Mục 7.4).

**Dependencies:** M1 (Domain entities), M2 (Adapter thật để Integration Test dùng — Unit Test của Calculator vẫn dùng fixture giả lập, không phụ thuộc M2 hoàn thành).

**Acceptance Criteria:** 21 TR (Mục 31 Natal Chart Domain Spec) pass; `isBirthTimeKnown=false` → `houses=[]`/`angles=[]` đúng D-9; `patterns=[]` luôn đúng (D-14); retrograde Sun/Moon assertion (INV-14) hoạt động.

**Testing:** Unit (Mục 12.1) — toàn bộ dùng fixture, không cần WASM thật.

**Definition of Done:** Pipeline `RawEphemerisData`/`HouseCalculationResult` (giả lập) → `Chart` hoàn chỉnh chạy đúng qua `ChartBuilder`, có test end-to-end nội bộ Domain (không qua Application/API).

---

### Milestone 4 — BirthProfile Integration

**Objective:** Bổ sung điểm tích hợp cross-module duy nhất (Conflict #2 RESOLVED) + verify ranh giới ESLint thật sự enforce đúng (T-BOUNDARY-VERIFY, thay thế OQ-B3).

**Phát hiện quan trọng qua inspect trực tiếp `backend/.eslintrc.cjs` (không có trong bất kỳ spec nào trước đó, làm rõ đúng thiết kế barrel):** `eslint-plugin-boundaries` **đã được bật từ Sprint 0** (Confirmed) — `boundaries/elements` đã định nghĩa sẵn `{ type: 'module-root', pattern: 'src/modules/*/index.ts' }`, kèm ghi chú gốc trong chính file cấu hình: *"rule vẫn được bật ngay từ bây giờ để mọi module thêm sau tự động bị enforce, không cần nhớ bật lại sau này"*. Điều này xác nhận: barrel cross-module **phải** là `birth-profile/index.ts` (module-root thật sự, đúng type đã khai báo) — **không phải** `birth-profile/application/index.ts` như draft trước đề xuất (draft trước chưa đối chiếu với cấu hình ESLint thật, chỉ suy luận từ nguyên tắc chung Architecture Spec §3.1).

**Phát hiện thứ 2 (quan trọng, chính là lý do cần T-BOUNDARY-VERIFY):** `boundaries/element-types` hiện tại **chỉ có 3 rule enforce quan hệ layer NỘI BỘ 1 module** (`domain` không phụ thuộc `application/infrastructure/presentation`, `application` không phụ thuộc `infrastructure/presentation`, `infrastructure` không phụ thuộc `presentation`) — **không có rule nào** ràng buộc truy cập **CROSS-MODULE** (ví dụ chặn `chart/application` import thẳng `birth-profile/domain`). `module-root` type đã khai báo trong `boundaries/elements` nhưng **chưa từng được tham chiếu** trong `boundaries/element-types` rules — tức là hiện tại **không có gì tự động chặn** nếu Sprint 3 code lỡ import sai. Đây chính xác là điều `T-BOUNDARY-VERIFY` cần xử lý.

**Scope:**
1. `birth-profile/application/use-cases/get-birth-profile-snapshot.usecase.ts` (đúng convention `UseCase` — không dùng tên "Service" chung chung như minh họa gốc Architecture Spec §3.2, codebase thật không có tiền lệ class "Service" ở Application layer).
2. `birth-profile/index.ts` (**module-root barrel, MỚI** — sửa lại so với draft trước) — chỉ export đúng `GetBirthProfileSnapshotUseCase`, không export bất kỳ Use Case/Entity/Repository nào khác của `birth-profile`.
3. **T-BOUNDARY-VERIFY:** thêm rule mới vào `boundaries/element-types` (hoặc cơ chế tương đương tận dụng `module-root` đã khai báo) — chặn mọi element `domain`/`application`/`infrastructure` của 1 module import trực tiếp `domain`/`application`/`infrastructure` của module khác; chỉ cho phép import qua đúng `module-root` (`src/modules/*/index.ts`).

**Deliverables:** 2 file mới ở `birth-profile/` (use-case + module-root barrel); 1 rule ESLint mới (hoặc cấu hình mở rộng) trong `.eslintrc.cjs`.

**Dependencies:** Không phụ thuộc M1–M3 về mặt code (độc lập, thuộc module `birth-profile`) — có thể làm song song, nhưng đặt sau M3 trong trình tự logic vì đây là bước chuẩn bị input cho M6 sắp tới.

**Acceptance Criteria:** Use case trả đúng `BirthDataSnapshot` (khớp Natal Chart Domain Spec Mục 9.1); throw lỗi rõ ràng nếu `birthProfileId` không tồn tại hoặc không thuộc `requestingUserId`; `chart/` chỉ import `birth-profile` qua đúng `birth-profile/index.ts` (module-root); **rule ESLint mới thật sự reject** 1 import thử nghiệm cố ý sai (ví dụ `chart/application` import thẳng `birth-profile/domain/ports/birth-profile-repository.port.ts`) — xác nhận bằng 1 test thử cố ý vi phạm rồi xóa đi, không phải chỉ đọc code bằng mắt.

**Testing:** Unit test use case (mock `IBirthProfileRepository`); test riêng case "not found"/"not owner".

**Definition of Done:** `birth-profile` module có thêm đúng 2 file mới (`use-case` + `index.ts` module-root), không sửa file nào khác của Sprint 2 đã đóng; rule ESLint mới đã verify chặn đúng qua thử nghiệm thật.

---

### Milestone 5 — Chart Persistence

**Objective:** Migration + Repository + Mapper.

**Scope:** Prisma migration (Mục 9.1); `PrismaChartRepository` (implement `IChartRepository`); `prisma-chart.mapper.ts` (Domain ↔ Prisma, đúng pattern `prisma-birth-profile.mapper.ts`).

**Deliverables:** Migration file, Repository, Mapper.

**Dependencies:** M1 (cần `Chart` Entity + `IChartRepository` port).

**Acceptance Criteria:** `save()` insert đúng `charts` + 6 bảng con trong 1 transaction; `findById()` đọc lại đúng 100% giá trị đã lưu (roundtrip); soft delete hoạt động đúng; CHECK constraints/UNIQUE hoạt động đúng khi test insert dữ liệu vi phạm (phải reject).

**Testing:** Integration Test (Mục 12.3) — DB thật (test DB, đúng `docker-compose.test.yml` đã có).

**Definition of Done:** `npm run prisma:migrate` chạy sạch trên DB test sạch; roundtrip test pass.

---

### Milestone 6 — Application Layer & Orchestration

**Objective:** Use Case orchestrate toàn bộ pipeline (BirthProfile → Engine → Persist).

**Scope:** `create-natal-chart.usecase.ts` (gọi `GetBirthProfileSnapshotUseCase` nếu có `birthProfileId`, gọi `ChartBuilder`, gọi `IChartRepository.save()` nếu `save=true`); `get-chart.usecase.ts`, `list-charts.usecase.ts` (**CONFIRMED chính thức** — phân trang/filter/sort đầy đủ theo REST API Spec §4.4, không còn là use case "phụ" tùy chọn), `delete-chart.usecase.ts`; `assert-chart-ownership.ts`.

**Dependencies:** M2, M3, M4, M5 (điểm hội tụ của toàn bộ pipeline).

**Acceptance Criteria:** `CreateNatalChartUseCase` xử lý đúng cả 2 nhánh `save=true`/`save=false`; `birthProfileId` XOR `birthData` inline đúng validate; ownership check đúng cho `GetChartUseCase`/`DeleteChartUseCase`; Guest được phép `save=false`, bị chặn `save=true` (401/403); `ListChartsUseCase` trả đúng `PaginatedResponse<ChartSummaryResponse>`, hỗ trợ đủ `page`/`pageSize`/`birthProfileId` filter/`sortBy=calculatedAt`/`order`, chỉ trả Chart thuộc `requestingUserId`.

**Testing:** Unit (mock toàn bộ dependency qua `FakeEphemerisProvider` + fake repository) — bao gồm test riêng `ListChartsUseCase` với phân trang/filter/sort; Integration (M8 sẽ làm end-to-end thật).

**Definition of Done:** 4 Use Case hoàn chỉnh (bao gồm `ListChartsUseCase` đầy đủ phân trang/filter/sort), test pass với dependency giả lập.

---

### Milestone 7 — API Layer

**Objective:** Route, Controller, Schema, Mapper, OpenAPI.

**Scope:** Toàn bộ `presentation/` (Mục 7.1, bao gồm `list-charts-query.schema.ts` — **mới**, Mục 10); wiring vào `composition-root.ts` (route mounting, đúng pattern `createBirthProfileRoutes`).

**Dependencies:** M6.

**Acceptance Criteria:** `POST /charts/natal`, `GET /charts/{id}`, `GET /charts` (**CONFIRMED chính thức**, có phân trang/filter/sort), `DELETE /charts/{id}` hoạt động đúng end-to-end qua HTTP; response khớp DTO tương ứng (`ChartResponse` cho single, `PaginatedResponse<ChartSummaryResponse>` cho list — REST API Spec §5.4); RFC7807 error response đúng cho mọi error case (Mục 11); OpenAPI generate đúng cho cả 4 endpoint, không lỗi.

**Testing:** API Test (Mục 12.4) — Supertest, Swiss Ephemeris thật; test riêng `GET /charts` với nhiều Chart, xác nhận phân trang/filter/sort đúng và không lộ Chart của user khác.

**Definition of Done:** `npm run generate:openapi` chạy sạch; toàn bộ API Test pass (cả 4 endpoint).

---

### Milestone 8 — Integration & Golden Reference Tests

**Objective:** Xác nhận toàn bộ pipeline thật + độ chính xác thiên văn thật.

**Scope:** Task chuẩn bị dữ liệu Golden Chart (bắt buộc **trước** viết test — xem Mục 15); viết Golden Test (Mục 12.5); Integration Test end-to-end BirthProfile thật → Chart thật → Persist thật.

**Dependencies:** M1–M7 (toàn bộ pipeline phải hoạt động).

**Acceptance Criteria:** ≥5 Golden Chart fixture pass trong tolerance `0.01°`; Integration end-to-end (tạo BirthProfile → tạo Chart từ `birthProfileId` → đọc lại → xóa) pass.

**Testing:** Chính milestone này là Testing.

**Definition of Done:** Golden Test data có nguồn trích dẫn rõ ràng (Mục 15), không phải số tự chế; toàn bộ Integration Test pass.

---

### Milestone 9 — Coverage & Edge-Case Review

**Objective:** (đúng yêu cầu tường minh §24 prompt) — rà soát branch chưa test, edge case số học, high-latitude, timezone boundary, date boundary, leap year, unknown birth time, invalid coordinate/house system, ephemeris failure, calculation failure, aspect edge case, snapshot immutability.

**Scope:** Đối chiếu 18 edge case đã liệt kê ở Swiss Ephemeris Integration Spec Mục 36 — xác nhận từng case đã có test tương ứng qua M1–M8, bổ sung case còn thiếu. Áp dụng **Backend Coverage Policy đã CONFIRMED** (Mục 12.7 — risk-based, không ngưỡng %): chạy `test:coverage`, đối chiếu đúng 4 tiêu chí (business rule/critical branch/edge case/manual gap review).

**Dependencies:** M1–M8 hoàn thành.

**Acceptance Criteria:** 18/18 edge case (Swiss Ephemeris Integration Spec Mục 36) có test xác nhận; leap year (`birthDate=29/02`) có test riêng (bổ sung ở đây); toàn bộ 21 Testable Business Rule (Mục 12.1) đã có test; toàn bộ critical branch (Mục 12.7 tiêu chí #2) đã có test; coverage % chỉ dùng làm tài liệu chẩn đoán trong report, **không** dùng làm điều kiện pass/fail của Milestone này.

**Testing:** Chính milestone này.

**Definition of Done:** Coverage report review xong theo đúng 4 tiêu chí Mục 12.7, ghi chú lại (note trong PR) lý do bất kỳ phần nào **cố ý** không cover 100% (ví dụ nhánh `DataIntegrityError` — lỗi lý thuyết, khó tạo input thật để trigger, chấp nhận test bằng cách giả lập trực tiếp thay vì qua toàn bộ pipeline thật).

---

### Milestone 10 — Final Review / Documentation / Closure

**Objective:** (đúng yêu cầu tường minh §25 prompt) — xác nhận implementation khớp spec, OpenAPI khớp API thật, DB schema khớp design, README chính xác, licensing **audit** đầy đủ, Known Gaps ghi nhận, Sprint Exit Criteria đạt, production compliance gate xác định rõ.

**Scope:**
1. Documentation Audit (đúng phương pháp đã dùng ở M10 Frontend — đối chiếu Spec vs Implementation Plan vs Code thật, không giả định).
2. Cập nhật `backend/README.md` (nếu có, hoặc tạo mới theo đúng mẫu Frontend `README.md` đã làm ở Sprint F1 M10 — kiểm tra trước xem đã tồn tại chưa).
3. **Licensing Audit** (Mục 13.1) — **không còn là quyết định A/B** (đã RESOLVED: AGPL/open-source). M10 chỉ audit compliance: xác nhận 8 trường của License Record đầy đủ, xác nhận phạm vi mã nguồn cần công khai theo AGPL Section 13 đã được xác định rõ (không nhất thiết phải *thực thi* việc công khai ngay trong Sprint 3 — chỉ cần **xác định phạm vi chính xác**, việc thực thi công khai có thể là hành động riêng trước go-live thật).
4. Known Gaps registry — bao gồm ghi nhận tường minh: **Backend Coding Standards & Conventions cần bổ sung mục "Coverage Philosophy"** (Mục 12.7) — follow-up documentation task sau Sprint 3, không chặn Sprint 3 đóng.
5. Verify Sprint Exit Criteria (Mục 21).

**Dependencies:** M1 (CI đã fix từ đầu Sprint, không còn là Task của M10), M1–M9.

**Acceptance Criteria:** Toàn bộ Sprint Exit Criteria (Mục 21) có bằng chứng cụ thể; License record 8/8 trường đầy đủ, audit xác nhận đã tuân thủ đúng hướng AGPL đã chọn (không phải "chờ quyết định").

**Testing:** Chạy lại toàn bộ pipeline (`lint`, `typecheck`, `test:coverage`, `build`) trên máy sạch — đúng phương pháp Clean Environment Verification đã dùng ở Frontend M10.

**Definition of Done:** Sprint 3 sẵn sàng đóng chính thức — Licensing Audit (Mục 13) xác nhận compliance đầy đủ, không còn là quyết định treo; go-live public chỉ còn phụ thuộc việc thực thi phạm vi công khai mã nguồn đã xác định (không phải chờ chọn hướng đi).

---

## 15. Task Breakdown

Chỉ liệt kê Task **không hiển nhiên** từ Milestone Breakdown ở trên (đã đủ chi tiết Deliverables/AC cho từng milestone) — bổ sung 2 Task xuyên-milestone quan trọng:

| Task | Milestone | Objective | Dependencies | Acceptance Criteria |
|---|---|---|---|---|
| **T-GOLDEN-PREP** | Trước M8 (làm song song M1–M7) | Thu thập ≥5 bộ dữ liệu Golden Chart thật (input + expected output) từ nguồn uy tín (ví dụ tra cứu thủ công Astro.com) | Không (độc lập, không cần code) | Đúng shape fixture đã định (Swiss Ephemeris Integration Spec Mục 27); có trích dẫn nguồn rõ ràng cho mỗi fixture; đủ 5 case đa dạng đã liệt kê (Mục 12.5) |
| **T-CI-FIX** | **M1** (đã di chuyển từ M10, Confirmed) | Di chuyển `backend/.github/workflows/ci.yml` → `.github/workflows/backend-ci.yml` (root) | Không | CI backend trigger đúng trên PR/push đầu tiên của Sprint 3 (xác nhận qua 1 lần chạy thật trên GitHub Actions, **trước khi** các Task khác của M1 merge) |
| **T-BOUNDARY-VERIFY** | M4 (thay thế OQ-B3, không còn là Open Question) | `eslint-plugin-boundaries` đã bật từ Sprint 0 (Confirmed, xác nhận qua inspect `.eslintrc.cjs` — `module-root` type đã khai báo nhưng chưa có rule tham chiếu) — verify + bổ sung rule `boundaries/element-types` thật sự chặn cross-module import sai, tận dụng đúng `module-root` đã có sẵn | Không | Đúng AC đã ghi ở Milestone 4 — thử nghiệm import sai bị ESLint reject thật |

**Toàn bộ Task còn lại đã đủ chi tiết trong bảng Milestone (Mục 14)** — không tách thêm bảng Task riêng trùng lặp thông tin, đúng nguyên tắc tránh dư thừa đã áp dụng nhất quán trong toàn bộ chuỗi tài liệu AstroViet.

---

## 16. Dependencies

```
M1 (+ T-CI-FIX, chạy xanh trước khi tiếp tục) ──┬─────────────────────────┐
     │                                            │
     ▼                                            ▼
    M2 ──────► M3 ──────► M6 ◄────── M4 (+ T-BOUNDARY-VERIFY, độc lập, song song M1–M3)
     │          │          │
     │          │          ▼
     │          │         M7 (bao gồm GET /charts)
     │          ▼          │
     └────────► M5 ────────┤
                            ▼
                           M8 (cần T-GOLDEN-PREP hoàn thành trước)
                            │
                            ▼
                           M9 (risk-based coverage, không ngưỡng %)
                            │
                            ▼
                           M10 (Licensing = audit, không còn quyết định A/B)
```

**External dependencies:** `swisseph-wasm` (npm, version pin qua Technical Spike M2); IANA tzdb (đã có qua Node.js runtime, không cài thêm — kế thừa từ Sprint 2); PostgreSQL/Prisma (đã có hạ tầng từ Sprint 0).

**Không có dependency vào Frontend** — Sprint 3 thuần Backend, Frontend Sprint F2 (Authentication UI) độc lập, không chặn nhau.

---

## 17. Open Questions

Toàn bộ 5 Open Question gốc đã được xử lý — 3 mục RESOLVED thành quyết định chính thức (không còn là câu hỏi mở), 2 mục chuyển thành Task cụ thể (không còn dạng OQ). Giữ nguyên câu hỏi/lý do gốc để tra cứu.

### OQ-B1 — Production Licensing Decision — ✅ RESOLVED

- **Quyết định:** AstroViet là dự án open-source, dùng Swiss Ephemeris theo hướng **AGPL**.
- **Status:** RESOLVED — chuyển từ "Open Question chờ quyết định kinh doanh" thành **Production Compliance Gate** (Mục 13) — không còn chờ chọn A/B, chỉ còn xác nhận đã tuân thủ đúng.
- **Còn lại:** Technical compliance verification cụ thể ở M2 (khởi tạo record) và M10 (audit đầy đủ, xác định chính xác phạm vi mã nguồn cần công khai theo AGPL Section 13).
- **Priority:** Không còn P0-chờ-quyết-định — chỉ còn P0-audit (M10), không chặn code M1–M9.

### OQ-B2 — Exact `swisseph-wasm` package/version — ✅ RESOLVED (quy trình)

- **Quyết định:** Resolve trong M2 Technical Spike — cần inspect trực tiếp npm package và API surface thật trước khi pin version, không chốt số trước (tránh lỗi thời).
- **Priority:** **P1 — chặn M2 Adapter implementation**, không chặn M1.

### T-BOUNDARY-VERIFY (thay thế OQ-B3 — không còn là Open Question)

- **Trước đây:** "Có bật `eslint-plugin-boundaries` cho Backend không?"
- **Đã xác nhận qua inspect trực tiếp `.eslintrc.cjs`:** Backend **đã có** `eslint-plugin-boundaries` từ Sprint 0 (quyết định kiến trúc đã có sẵn, không phải câu hỏi mở). Việc còn lại là **Task xác minh + bổ sung rule** (Mục 14 Milestone 4, Mục 15) — Sprint 3 phải verify rule hiện tại thật sự enforce đúng ranh giới cross-module `chart → birth-profile` (phát hiện: hiện tại `module-root` type đã khai báo nhưng chưa có rule tham chiếu — cần bổ sung).
- **Không còn xuất hiện trong danh sách Open Question** — đã là Task cụ thể, có Deliverables/AC riêng ở Milestone 4.

### GET /charts (thay thế OQ-B4 — không còn là Open Question)

- **Trước đây:** "`GET /charts` có thuộc phạm vi bắt buộc Sprint 3 không?"
- **Đã xác nhận:** REST API Specification §4.4 **định nghĩa tường minh** `GET /api/v1/charts` (không phải suy diễn) — endpoint liệt kê Chart đã lưu của user, đầy đủ contract phân trang (`page`/`pageSize`), filter (`birthProfileId`), sort (`sortBy=calculatedAt`/`order`), response `PaginatedResponse<ChartSummaryResponse>`.
- **Quyết định:** **INCLUDED chính thức trong Sprint 3** — đã cập nhật vào Mục 3 (Scope), Mục 10 (API Strategy), Milestone 6/7 (Mục 14).
- **Không còn xuất hiện trong danh sách Open Question.**

### OQ-B5 — Backend Coverage Policy — ✅ RESOLVED

- **Quyết định:** Không có ngưỡng % toàn cục. M9 dùng risk-based coverage review theo đúng 4 tiêu chí (Mục 12.7): toàn bộ business rule đã đóng băng có test; toàn bộ critical branch có test; toàn bộ edge case đã liệt kê có test; coverage report review thủ công tìm gap có ý nghĩa. Coverage % là chỉ số chẩn đoán, không phải Acceptance Criterion.
- **Follow-up (không chặn Sprint 3):** Bổ sung mục "Coverage Philosophy" vào Backend Coding Standards & Conventions **sau khi** Sprint 3/M9 kết thúc — ghi nhận ở Known Gaps (Milestone 10).

**Không còn Open Question nào ở trạng thái chờ xác nhận.** Sprint 3 sẵn sàng thực thi đầy đủ theo đúng phạm vi đã chốt ở Mục 3/14.


## 18. Risks

| Risk | Khả năng | Ảnh hưởng | Mitigation |
|---|---|---|---|
| Swiss Ephemeris API mismatch (chữ ký SDK thật khác giả định trong 2 spec thượng nguồn) | Trung bình (chưa cài package thật) | Cao — có thể cần sửa `SwissEphemerisAdapter` | Technical Spike (M2) làm sớm, cô lập rủi ro vào đúng 1 milestone trước khi các milestone khác phụ thuộc |
| WASM lifecycle problems (init chậm, memory leak) | Thấp–Trung bình | Trung bình | Eager init + singleton (đã thiết kế), đo thời gian init thật ở M2, log rõ ràng |
| Ephemeris data packaging (bundled data không đủ phạm vi năm) | Thấp (đã Confirmed ưu tiên bundled trước) | Trung bình | Technical Spike xác nhận phạm vi năm trước M3; có phương án dự phòng `backend/ephemeris-data/` sẵn sàng nếu cần (Swiss Ephemeris Integration Spec Mục 19.2) |
| Numerical precision (sai số cộng dồn, làm tròn sai vị trí) | Thấp | Cao (ảnh hưởng đúng/sai của cả sản phẩm) | Golden Test (M8) là lưới an toàn chính; nguyên tắc "không round quá sớm" đã thiết kế đúng (Natal Chart Domain Spec Mục 20) |
| Timezone conversion (DST/historical edge case) | Thấp (đã có IANA tzdb từ Sprint 2, đã test) | Trung bình | Kế thừa cơ chế Sprint 2 đã kiểm chứng, không code lại |
| High-latitude house calculations | Trung bình (đặc thù toán học Placidus) | Thấp (đã có Warning mềm, không throw) | `HouseCalculationResult` discriminated union (đã thiết kế đúng), test riêng case vĩ độ cực (M9) |
| Package maintenance risk (`swisseph-wasm` ít người dùng/bảo trì kém) | Trung bình–Cao (thư viện ngách) | Trung bình dài hạn | Pin version cụ thể (không auto-upgrade); License Record ghi rõ nguồn để dễ theo dõi; `IEphemerisProvider` port đã cô lập rủi ro — đổi thư viện sau này chỉ cần viết Adapter mới |
| Dependency licensing (AGPL) | Đã biết, đã RESOLVED hướng đi (không phải rủi ro ẩn) | Trung bình (còn lại: xác định đúng phạm vi công khai mã nguồn) | Mục 13 xử lý tường minh, M10 audit — không chặn code Sprint 3 |
| Snapshot reproducibility (engine đổi mà không bump version) | Thấp nếu tuân thủ quy trình | Cao nếu xảy ra (Chart cũ "đổi" ngầm) | `engineVersion` là định danh tổng hợp bắt buộc bump khi đổi code/data/flags (đã Confirmed, Natal Chart Domain Spec Mục 35 tương đương) — quy tắc này cần ghi vào code comment tại `chart-builder.ts` để nhắc nhở dev tương lai |
| Test reference accuracy (Golden data tự chế thay vì nguồn thật) | Trung bình nếu không cẩn thận | Cao (Golden Test mất giá trị nếu data sai) | T-GOLDEN-PREP tách riêng, bắt buộc trích dẫn nguồn, review thủ công trước khi dùng làm fixture |
| Cross-module boundary không được enforce tự động (phát hiện qua inspect `.eslintrc.cjs` — `module-root` khai báo nhưng chưa có rule tham chiếu) | Đã xác nhận (không phải rủi ro giả định) | Trung bình (M4 là lần đầu có cross-module dependency thật, dễ import sai nếu không có rule chặn) | T-BOUNDARY-VERIFY (Milestone 4) — bổ sung rule trước khi code `GetBirthProfileSnapshotUseCase` integration thật, verify bằng thử nghiệm import sai cố ý |
| CI backend sai vị trí khiến CI không chạy suốt Sprint 3 | Đã xảy ra (đã xác nhận vị trí sai) | Trung bình (không phát hiện lỗi sớm qua CI) | T-CI-FIX **đã di chuyển sang M1** (Confirmed) — CI bảo vệ toàn bộ Sprint 3 ngay từ đầu, không còn là rủi ro treo tới cuối Sprint |

---

## 19. Sprint Acceptance Criteria

Đúng yêu cầu "verifiable, không mơ hồ":

1. **Domain correctness:** 21/21 Testable Business Rule (Natal Chart Domain Spec Mục 31) pass.
2. **Swiss Ephemeris integration:** `SwissEphemerisAdapter` Adapter Test (Mục 12.2) pass 100%; License Record 8/8 trường điền đầy đủ.
3. **Supported planets:** `calculateNatal()` trả đúng 14 celestial body (10 bắt buộc luôn có, Chiron/Lilith/Node theo `includeOptionalPoints`) — test xác nhận từng loại.
4. **Houses:** Placidus + Whole Sign đều trả đúng 12 cusp khi hội tụ; `not_convergent` xử lý đúng khi không hội tụ — test cả 2 nhánh.
5. **Aspects:** 5 loại Aspect tính đúng theo orb table đã Confirmed (D-5); canonical ordering + duplicate prevention hoạt động đúng.
6. **Chart snapshot:** Immutable — không có method/endpoint nào cho phép sửa Chart đã persist; `engineVersion`/`calculatedAt` luôn có giá trị.
7. **API:** 4 endpoint (`POST /charts/natal`, `GET /charts/{id}`, `GET /charts`, `DELETE /charts/{id}`) hoạt động đúng end-to-end, response khớp DTO đã đóng băng — bao gồm phân trang/filter/sort đúng cho `GET /charts`.
8. **Persistence:** Roundtrip test (save → read) khớp 100% giá trị; transaction đúng (không có Chart "nửa vời" khi lỗi giữa chừng).
9. **Authentication:** Guest chặn đúng khi `save=true`; User/Admin xác thực đúng qua middleware đã có từ Sprint 1.
10. **Ownership:** User A không đọc/xóa/liệt kê được Chart của User B — test xác nhận 403 (single) và filter đúng theo `userId` (list).
11. **Error handling:** 9/9 category lỗi (Mục 11) map đúng RFC7807, không lộ raw Swiss Ephemeris error message.
12. **Tests:** `npm run test` pass 100% (Unit + Adapter + Integration + API + Golden); `npm run test:coverage` sinh report, đã review theo đúng risk-based policy (Mục 12.7, M9) — không đặt ngưỡng % làm điều kiện pass.
13. **OpenAPI:** `npm run generate:openapi` chạy sạch, không lỗi; cả 4 endpoint Chart xuất hiện đúng trong spec sinh ra.
14. **Licensing record:** 8/8 trường đầy đủ, hướng AGPL đã RESOLVED, M10 audit xác nhận compliance (không còn "chưa quyết" — chỉ còn xác nhận đã tuân thủ đúng).
15. **Cross-module boundary:** Rule ESLint mới (T-BOUNDARY-VERIFY) thật sự chặn import sai — xác nhận bằng thử nghiệm cố ý vi phạm.
16. **Documentation:** README (nếu áp dụng) cập nhật đúng trạng thái thật sau Sprint 3, đúng phương pháp Clean Environment Verification.

---

## 20. Definition of Done

Sprint 3 hoàn thành khi và chỉ khi toàn bộ đồng thời đúng:

- [ ] Toàn bộ 10 Milestone (M1–M10) đạt Acceptance Criteria riêng.
- [ ] 16 Sprint Acceptance Criteria (Mục 19) đạt, có bằng chứng cụ thể (không phải "trông có vẻ ổn").
- [ ] Không có quyết định domain/integration nào bị tự ý thay đổi so với 2 spec thượng nguồn đã Confirmed — mọi refinement (nếu có phát sinh khi code) được ghi nhận tường minh, có lý do.
- [ ] `npm run lint`/`typecheck`/`format:check`/`test:coverage`/`build` sạch trên toàn bộ backend (không riêng module `chart`).
- [ ] CI backend chạy đúng từ root (T-CI-FIX hoàn thành **từ M1**, đã bảo vệ toàn bộ Sprint 3).
- [ ] Golden Test data có nguồn trích dẫn rõ ràng, không phải số tự chế.
- [ ] License/Compliance Record đầy đủ 8/8 trường, hướng AGPL đã audit xác nhận compliance (M10).
- [ ] Rule ESLint cross-module (T-BOUNDARY-VERIFY) đã verify chặn đúng.
- [ ] `GET /charts` hoạt động đầy đủ phân trang/filter/sort, đúng ownership.
- [ ] Coverage đã review theo đúng risk-based policy (Mục 12.7) — không có ngưỡng % nào được dùng làm điều kiện pass/fail.
- [ ] Không có `FIXME` nào trong `chart/` module; `TODO` (nếu có, ví dụ cho Pattern detection deferred D-14) đúng định dạng Coding Standards.
- [ ] `git status` sạch trừ thay đổi có chủ đích của Sprint 3.
- [ ] Sprint 3 Completion Record (tương đương M10 Completion Record đã làm ở Frontend) hoàn chỉnh.

---

## 21. Sprint Exit Criteria

Đúng mẫu đã dùng cho Sprint F1 Frontend (Exit Criterion / Verification Method / Evidence / Status):

| # | Exit Criterion | Verification Method | Evidence cần có |
|---|---|---|---|
| 1 | Toàn bộ 10 Milestone đạt AC riêng | Đối chiếu từng Milestone Mục 14 | Log/PR tương ứng từng milestone |
| 2 | Domain layer không phụ thuộc Swiss Ephemeris/Prisma/Express | Code review + `grep` xác nhận `import.*swisseph` chỉ xuất hiện đúng 1 file (`swiss-ephemeris.adapter.ts`) | Kết quả `grep` đính kèm |
| 3 | 21 Testable Business Rule pass | `npm run test` output | Test report |
| 4 | Golden Test pass trong tolerance `0.01°` | `npm run test` output (Golden suite) | Test report + nguồn dữ liệu trích dẫn |
| 5 | Migration chạy sạch trên DB sạch | `npm run prisma:migrate` trên DB test mới | Log migration |
| 6 | API hoạt động end-to-end (4 endpoint, bao gồm `GET /charts` phân trang/filter/sort) | API Test (Supertest) | Test report |
| 7 | RFC7807 error đúng cho mọi category lỗi | API Test — test riêng từng error case | Test report |
| 8 | License Record đầy đủ 8/8 trường, M10 audit xác nhận compliance AGPL | Đọc trực tiếp record + ghi chú audit M10 | Record đính kèm |
| 9 | CI backend chạy đúng vị trí từ M1, trigger đúng suốt Sprint | Trigger nhiều lần thật trên GitHub Actions (không chỉ 1 lần cuối Sprint) | Link CI run (M1 và các lần sau) |
| 10 | Cross-module boundary được enforce tự động | Thử nghiệm import sai bị ESLint reject | Log/output ESLint thử nghiệm |
| 11 | Không `FIXME` nào trong `chart/` | `grep -rn FIXME backend/src/modules/chart` | Kết quả grep = 0 |
| 12 | Coverage đã review theo risk-based policy (Mục 12.7), không ngưỡng % giả tạo | Đọc coverage report + ghi chú M9 theo đúng 4 tiêu chí | Report + ghi chú |
| 13 | Known Gaps (D-14 Pattern deferred, Backend Coverage Philosophy follow-up...) ghi nhận đầy đủ | Đọc Known Gaps registry (M10) | Registry |

**Không đánh dấu Exit Criterion nào "Đạt" chỉ dựa trên tài liệu** — mọi mục đều yêu cầu bằng chứng chạy thật, đúng nguyên tắc đã áp dụng nhất quán ở Sprint F1 Frontend M10.

---

## 22. Final Deliverables

- `backend/src/modules/chart/` — toàn bộ module (Domain, Application, Infrastructure, Presentation) đúng cấu trúc Mục 7.1, bao gồm `ListChartsUseCase` + `list-charts-query.schema.ts` (`GET /charts`).
- `backend/src/modules/birth-profile/application/use-cases/get-birth-profile-snapshot.usecase.ts` + `birth-profile/index.ts` (module-root barrel, mới — đúng `boundaries/elements` type đã khai báo sẵn từ Sprint 0).
- `backend/src/shared/errors/error-codes.ts` — mở rộng (Chart Domain block).
- `backend/.eslintrc.cjs` — bổ sung rule `boundaries/element-types` cho cross-module (T-BOUNDARY-VERIFY).
- Prisma migration mới (`charts` + 6 bảng con).
- `backend/src/composition-root.ts` — cập nhật wiring Chart module + `SwissEphemerisAdapter` singleton + serialize queue.
- `.github/workflows/backend-ci.yml` (di chuyển từ `backend/.github/workflows/ci.yml`, **hoàn thành ở M1**).
- Golden Chart fixture data (`T-GOLDEN-PREP`), có trích dẫn nguồn.
- License/Compliance Record (Mục 13.1) — file riêng, ví dụ `docs/legal/swisseph-license-record.md`, phản ánh hướng AGPL đã RESOLVED.
- Known Gaps registry (M10, bao gồm follow-up "bổ sung Coverage Philosophy vào Backend Coding Standards") + Sprint 3 Completion Record.
- OpenAPI spec sinh ra qua `npm run generate:openapi` (không phải file tĩnh commit tay) — 4 endpoint Chart.
- Toàn bộ test (`backend/tests/{unit,integration,api}/**/chart/**`).

---

*Hết tài liệu. Sprint 3 Plan này không mở lại bất kỳ quyết định domain/integration nào đã Confirmed ở Natal Chart Domain Specification v1.1 và Swiss Ephemeris Integration Specification v1.1 — toàn bộ nội dung ở đây là **thực thi cụ thể** (file, migration, task, milestone) của các quyết định đã đóng băng, đối chiếu trực tiếp với codebase thật (`birth-profile`/`identity` module, `composition-root.ts`, `error-codes.ts`, `.eslintrc.cjs`, `tests/`, CI config) để đảm bảo Sprint 3 code đúng convention đã có, không phát minh pattern mới. 2 điểm đính chính khung hiểu quan trọng phát hiện qua inspect code thật: (1) dự án dùng ESM thật, không phải CommonJS như liệt kê trong Project Context; (2) `eslint-plugin-boundaries` đã bật từ Sprint 0 nhưng chưa enforce cross-module (khác giả định "chưa có" ở draft trước). Toàn bộ 5 Open Question gốc (Mục 17) đã xử lý dứt điểm — 3 RESOLVED thành quyết định chính thức, 2 chuyển thành Task cụ thể (T-BOUNDARY-VERIFY, GET /charts) — không còn Open Question nào chờ xác nhận. Licensing (Mục 13) đã RESOLVED hướng AGPL, chỉ còn compliance audit ở M10, không còn là quyết định kinh doanh treo.*
