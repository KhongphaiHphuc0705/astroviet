# Sprint 3 Backend — M1 Implementation Plan

## Domain Foundation

**Phiên bản:** 1.0
**Trạng thái:** Implementation-ready — 0 Open Question mới cần chặn code (đã rà soát toàn bộ quyết định đã Confirmed trước khi tạo mục 15, đúng chính sách "Open Question Policy" của đề bài)
**Vị trí:** Milestone 1/10 của Sprint 3 Backend (Natal Chart Module + Swiss Ephemeris Integration)
**Không mở lại bất kỳ quyết định nào** đã Confirmed ở: Natal Chart Domain Specification v1.1, Swiss Ephemeris Integration Specification v1.1, Sprint 3 Backend Implementation Plan v1.1 — 3 tài liệu này là nguồn quyết định, tài liệu này chỉ **thực thi cụ thể** cho riêng M1.

---

## 1. Milestone Overview

**Tên:** Sprint 3 Backend — Milestone 1: Domain Foundation
**Mục tiêu 1 câu:** Dựng toàn bộ Domain layer thuần túy của module `chart` (Entity, Value Object, Domain Error, Domain Port) — đủ để M2–M10 xây tiếp mà **không cần thêm bất kỳ quyết định kiến trúc mới nào**, đồng thời **không** chứa bất kỳ chi tiết Swiss Ephemeris/Prisma/Express nào.

**Đặc điểm milestone:** Đây là milestone "nền móng" — không có hành vi tính toán thiên văn thật, không có I/O thật, không có API thật. Toàn bộ Deliverable là TypeScript thuần (Entity/VO/Error/Interface) + test thuần.

**Bổ sung ngoài phạm vi Domain thuần túy (đã Confirmed đưa vào M1):** Corrective task sửa vị trí CI backend (`T-CI-FIX`, đã di chuyển từ M10 → M1 theo Sprint 3 Backend Implementation Plan §14 Confirmed) — lý do đặt trong M1: bảo vệ toàn bộ M2–M10 phía sau bằng CI chạy đúng ngay từ đầu Sprint, không phải chờ tới cuối Sprint mới phát hiện CI chưa từng chạy.

---

## 2. Source Documents & Authority

Đúng thứ bậc đề bài quy định (Mục 15) — áp dụng xuyên suốt tài liệu này, không đảo thứ tự:

1. Frozen project decisions / Project Architecture Specification
2. Natal Chart Domain Specification v1.1 (Confirmed)
3. Swiss Ephemeris Integration Specification v1.1 (Confirmed)
4. REST API Specification
5. Database Design Specification
6. Backend Coding Standards & Conventions
7. Sprint 3 Backend Implementation Plan v1.1 (Confirmed)
8. Sprint 0/1/2 Implementation Plan
9. Existing codebase convention (`backend/src/modules/birth-profile/`, `backend/src/modules/identity/`)
10. General engineering knowledge

**Đã inspect trực tiếp trước khi viết** (không giả định): `backend/src/modules/birth-profile/domain/entities/birth-profile.entity.ts`, `.../domain/value-objects/birth-date.vo.ts`, `.../domain/errors/birth-profile.errors.ts`, `.../domain/ports/birth-profile-repository.port.ts`, `backend/src/shared/errors/error-codes.ts`, `backend/.eslintrc.cjs`, `backend/.github/workflows/ci.yml`, `backend/tests/unit/modules/birth-profile/**`, `backend/tsconfig.json`, `backend/package.json`.

**1 phát hiện cần đính chính (đúng Mục 15 — "identify conflict, state which source has authority"):** Prompt gốc mô tả corrective task CI là *"previously identified CI step-order issue"*. Đối chiếu với nguồn có thẩm quyền cao hơn (#7 — Sprint 3 Backend Implementation Plan, chính là tài liệu đã "review" và định nghĩa corrective task này) và đối chiếu trực tiếp `backend/.github/workflows/ci.yml` thật: vấn đề thật của Backend CI **không phải step-order** (thứ tự step hiện tại — Lint→Format→Typecheck→Test→Build — đã hợp lý, không có vấn đề) mà là **2 vấn đề khác**: (a) **vị trí file sai** (`backend/.github/workflows/ci.yml` thay vì root `.github/workflows/`) — đây chính là `T-CI-FIX` đã đặt tên trong Sprint 3 Backend Implementation Plan; (b) **phát hiện mới qua inspect lần này** — `on: push/pull_request: branches: [main]` khiến workflow **không bao giờ trigger trên nhánh `dev`** (nơi toàn bộ Sprint 3 sẽ phát triển, đối chiếu lịch sử `git log` thật của dự án — mọi Sprint trước đều làm việc trên `dev`). Tài liệu này **giữ đúng tên `T-CI-FIX`** (theo yêu cầu "preserve terminology" của đề bài, nguồn #7 có thẩm quyền cao hơn phần mô tả "step-order" không chính xác trong prompt), mở rộng phạm vi Task để sửa cả 2 vấn đề thật đã xác nhận.

---

## 3. Current Project Context

Sprint 0 (Infrastructure), Sprint 1 (Identity), Sprint 2 (Birth Profile) — **COMPLETED**, M1–M10 mỗi Sprint đã đóng (đã tự xác nhận qua nhiều vòng review trước đó trong dự án). Frontend Sprint F1 — **COMPLETED**.

3 tài liệu Sprint 3 cấp cao đã hoàn thành và review: Natal Chart Domain Specification v1.1, Swiss Ephemeris Integration Specification v1.1, Sprint 3 Backend Implementation Plan v1.1 — cả 3 đã Confirmed, không mở lại.

**Trạng thái codebase xác nhận trực tiếp trước khi lập kế hoạch:** `backend/src/modules/chart/` **chưa tồn tại** (module hoàn toàn mới). `backend/src/shared/errors/error-codes.ts` đã có sẵn `EPHEMERIS_PROVIDER_ERROR`/`EXTERNAL_SERVICE_ERROR`/`DOMAIN_ERROR` nhưng **chưa có** block "Chart Domain". `backend/.eslintrc.cjs` đã bật `eslint-plugin-boundaries` từ Sprint 0, đã khai báo `module-root` type (`src/modules/*/index.ts`) nhưng **hiện tại module `birth-profile` chưa có file `index.ts` cấp module** (chỉ có `presentation/index.ts`) — đây là bối cảnh quan trọng cho Mục 7 (M1 chỉ cần đảm bảo `chart/` tương thích cấu trúc, **không** tạo `chart/index.ts` — việc đó thuộc M4, đúng phạm vi cross-module thật đầu tiên).

---

## 4. M1 Objective

Dựng "Natal Chart Domain Foundation" hoàn chỉnh — model + contract ổn định để M2–M10 xây tiếp, tuyệt đối không chứa chi tiết Swiss Ephemeris.

Xác định dứt khoát (đúng 9 câu hỏi đề bài Mục 5, trả lời đầy đủ ở Mục 8, 9, 15):

| Câu hỏi | Trả lời ngắn (chi tiết Mục 8) |
|---|---|
| Entity nào cần? | `Chart`, `Planet`, `House`, `Angle`, `Aspect`, `Pattern` (6 — đúng Natal Chart Domain Spec Mục 6.2) |
| Value Object nào cần? | `ZodiacPosition`, `EngineInput`, `Warning`, `ChartCalculationMetadata` (4 — Mục 6.3) |
| Enum/type nào cần? | `PlanetName`, `HouseSystem`, `AspectType`, `ChartType`, `PlanetCategory` |
| Domain error nào cần? | 6 class mới (Mục 9.4) |
| Domain service/rule nào thuộc M1? | **Không có** — `UnknownBirthTimePolicy`/`OrbPolicy`/Calculator đều thuộc `engine/` (M3), M1 chỉ có invariant enforcement nội bộ Entity |
| Repository/port nào cần ở giai đoạn này? | `IEphemerisProvider` (+ DTO đi kèm), `IChartRepository` — cả 2 chỉ là interface, implementation thuộc M2/M5 |
| Tính toán nào KHÔNG được implement? | Toàn bộ Calculator, Chart Builder, Validation Module (Mục 6) |
| Invariant nào cần enforce? | INV-1 đến INV-16 (Natal Chart Domain Spec Mục 25) — chi tiết ánh xạ Mục 8.4 |
| Domain test nào cần? | Đầy đủ Mục 11 |

---

## 5. Scope

- `chart/domain/entities/` — 6 Entity.
- `chart/domain/value-objects/` — 4 VO.
- `chart/domain/errors/` — 6 Domain Error class mới + mở rộng `ErrorCode` enum (`backend/src/shared/errors/error-codes.ts`).
- `chart/domain/ports/` — `IEphemerisProvider` (+ `EphemerisRequest`, `RawEphemerisData`, `HouseCalculationRequest`, `RawHouseData`, `HouseCalculationResult`), `IChartRepository`.
- `chart/domain/types/` — `PlanetName`, `HouseSystem`, `AspectType`, `ChartType`, `PlanetCategory` (enum TypeScript, đúng convention Coding Standards §7 — ví dụ minh họa gốc chính là `AspectType`).
- Domain test tương ứng 1-1 (`backend/tests/unit/modules/chart/domain/**`).
- `T-CI-FIX`: di chuyển + sửa trigger branch CI backend.

**Không thuộc Scope M1** (dù có thể "chạm" nhẹ, xem Mục 6 để phân định rõ): `chart/domain/engine/` (toàn bộ — Calculator, Chart Builder, Validation Module); bất kỳ implementation nào của `IEphemerisProvider`/`IChartRepository`; `chart/application/`, `chart/infrastructure/`, `chart/presentation/`; `chart/index.ts` (module-root barrel — thuộc M4); mở rộng `.eslintrc.cjs` với rule cross-module mới (thuộc M4, T-BOUNDARY-VERIFY) — M1 chỉ **verify tương thích**, không thêm rule.

---

## 6. Out of Scope

Đúng danh sách gợi ý đề bài Mục 18, đã đối chiếu từng mục với 3 spec thượng nguồn để xác nhận (không chỉ liệt kê theo quán tính):

| Mục | Xác nhận thuộc milestone nào |
|---|---|
| `swisseph-wasm` integration | M2 (Swiss Ephemeris Integration Spec Mục 8, 19–20) |
| Astronomical calculations thật | M3 (Calculators) |
| House calculations | M3 |
| Planetary calculation adapter | M2 (`SwissEphemerisAdapter`) |
| Chart persistence | M5 |
| Prisma Chart repository | M5 (`PrismaChartRepository` implement `IChartRepository` đã định nghĩa ở M1) |
| Chart application use cases | M6 |
| Chart REST controllers | M7 |
| OpenAPI endpoint implementation | M7 |
| Frontend integration | Ngoài phạm vi Sprint 3 Backend hoàn toàn |
| Interpretation engine | Ngoài phạm vi MVP Sprint 3 (Natal Chart Domain Spec Mục 34) |
| **Bổ sung xác nhận qua rà soát riêng** | |
| `chart/domain/engine/validation/` (Validation Module) | M3 — dù có vẻ "domain", đây thuộc Engine Pipeline bước [2] (Engine Spec §4), không phải Entity/VO invariant thuần túy |
| `UnknownBirthTimePolicy`/`OrbPolicy` | M3 (Sprint 3 Backend Implementation Plan Mục 7.4: "pure function/constant module trong `chart/domain/engine/`") |
| `ChartBuilder` | M3 |
| `chart/index.ts` (module-root barrel) + cross-module ESLint rule | M4 (T-BOUNDARY-VERIFY) |
| `birth-profile` module bất kỳ thay đổi nào (`GetBirthProfileSnapshotUseCase`...) | M4 |

---

## 7. Architecture & Dependency Rules

Giữ nguyên hướng phụ thuộc đã đóng băng (Project Architecture Specification, đã áp dụng nhất quán ở `identity`/`birth-profile`):

```
Domain (chart/domain/) ← không phụ thuộc gì (0 import từ layer khác trong toàn bộ backend)
   ▲
Application (M6, chưa tồn tại)
   ▲
Infrastructure (M2/M5, chưa tồn tại)
   ▲
Presentation (M7, chưa tồn tại)
```

**Ràng buộc cứng cho M1 (đúng đề bài Mục 9, 10):**
- `chart/domain/**` **tuyệt đối không** import: `express`, `prisma`/`@prisma/client`, `zod`, `jsonwebtoken`, `pino`, `swisseph-wasm`, bất kỳ type HTTP nào.
- `chart/domain/**` **không** chứa Prisma model, DTO request/response, Express handler, WASM adapter.
- `chart/domain/entities/**` **không** import `chart/domain/ports/**` ngược lại (Entity không biết Port tồn tại — đúng hướng phụ thuộc Domain nội bộ: `errors` ← `value-objects` ← `entities`; `ports` độc lập, chỉ định nghĩa interface, không phụ thuộc Entity cụ thể trừ khi cần kiểu trả về — `IChartRepository` **có** phụ thuộc `Chart` Entity làm kiểu tham số, đây là phụ thuộc hợp lệ 1 chiều Port → Entity, không phải Entity → Port).
- Shared Kernel: không tạo dependency ad-hoc mới — nếu cần type dùng chung nhiều module, kiểm tra `backend/src/shared/` trước (M1 chỉ dùng `backend/src/shared/errors/error-codes.ts`, không tạo shared type mới nào khác).

**Quyết định thiết kế quan trọng cần nêu rõ (không có trong bất kỳ spec nào trước đó ở mức chi tiết này — suy luận trực tiếp từ nguyên tắc Module Boundary đã đóng băng):** `EngineInput.birthData` (Mục 8.3 dưới) **định nghĩa shape cục bộ của riêng `chart` module** (các field: `birthDate`, `birthTime`, `isBirthTimeKnown`, `latitude`, `longitude`, `timezoneId`) — **không** import bất kỳ type nào từ `birth-profile` module. Lý do: (1) `birth-profile` module chưa có `index.ts` module-root (barrel đó là Deliverable của M4, không tồn tại lúc M1 code); (2) đúng nguyên tắc Ports & Adapters — mỗi module tự sở hữu input contract của chính nó, cross-module integration diễn ra ở **Application layer** (M6, qua mapping tường minh), không phải Domain layer share type trực tiếp; (3) giữ `chart` M1 **hoàn toàn độc lập**, biên dịch/test được mà không cần `birth-profile` tồn tại — đúng yêu cầu đề bài Mục 16 "Do NOT create dependencies on M2 [và các milestone khác] that would make M1 impossible".

---

## 8. Domain Model Mapping

Đúng yêu cầu đề bài Mục 6 — với mỗi khái niệm, xác định phân loại + lý do trích dẫn nguồn, **không** mặc định biến mọi thứ thành class.

### 8.1 Entity (6)

| Khái niệm | Lý do là Entity | Nguồn |
|---|---|---|
| `Chart` | Aggregate Root — có `id` UUID riêng, identity độc lập, vòng đời riêng | Natal Chart Domain Spec Mục 6.1 |
| `Planet` | Có `id` riêng (bảng `chart_planets`), cần truy vấn độc lập trong phạm vi 1 Chart (JOIN `house_number`) | Mục 6.2 |
| `House` | Tương tự — bảng riêng | Mục 6.2 |
| `Angle` | Tương tự — bảng riêng | Mục 6.2 |
| `Aspect` | Tương tự — bảng riêng | Mục 6.2 |
| `Pattern` | Entity đầy đủ **nhưng thuật toán detect deferred (D-14)** — M1 chỉ định nghĩa shape, không có logic tạo Pattern nào (đó là M3, và M3 sẽ luôn trả `[]`) | Mục 6.2, D-14 Confirmed |

### 8.2 Value Object (4)

| Khái niệm | Lý do là VO | Nguồn |
|---|---|---|
| `ZodiacPosition` | Không có `id`/bảng riêng — chỉ là cách biểu diễn khác của `longitude` (derived: `sign` + `degreeInSign`) | Mục 6.3 |
| `EngineInput` | Input thuần túy vào Engine (M3 tiêu thụ) — không có identity, so sánh bằng giá trị | Mục 6.3, 8.3 (Sprint 3 Plan/Natal Chart Domain Spec Mục 9.2) |
| `Warning` | Không `id`, lưu JSONB — `code`/`message`/`severity`/`field?`/`details?` | Mục 6.3 |
| `ChartCalculationMetadata` | Không `id`/bảng riêng — 2 cột phẳng trên `charts` (`calculatedAt`, `engineVersion`) | Mục 6.3 |

**Không tạo `BirthDataSnapshot` VO riêng ở M1** — đây là field bên trong `EngineInput` (Mục 8.3), không phải VO độc lập cấp module (tránh nhân bản khái niệm không cần thiết — đúng nguyên tắc "explain reasoning" của đề bài: `BirthDataSnapshot` không có hành vi/invariant riêng ngoài việc *là* input, gộp vào `EngineInput.birthData` là đủ và đơn giản hơn).

### 8.3 Domain Type / Enum (5, TypeScript `enum`, đúng Coding Standards §7 — ví dụ minh họa gốc chính là `AspectType`)

| Type | Giá trị | Nguồn |
|---|---|---|
| `PlanetName` | 14 giá trị (10 chuẩn + Chiron + Lilith + NorthNode + SouthNode) | Domain Spec §5.4, Natal Chart Domain Spec Mục 13.1 |
| `HouseSystem` | `Placidus`, `WholeSign` | Mục 15.1 |
| `AspectType` | `Conjunction`, `Sextile`, `Square`, `Trine`, `Opposition` | Mục 18.1 — khớp chính xác ví dụ Coding Standards §7 |
| `ChartType` | `Natal` (chỉ 1 giá trị ở MVP — vẫn định nghĩa enum, không hard-code string rải rác, để `calculateTransit()` tương lai mở rộng không cần đổi kiểu dữ liệu) | Mục 6.1, Swiss Ephemeris Integration Spec Mục 30 |
| `PlanetCategory` | `Personal`, `Social`, `Outer` (dùng nội bộ cho Orb Policy — **nhưng Orb Policy thuộc M3**; M1 chỉ định nghĩa enum vì `Planet` Entity có thể cần field/getter phân loại — xem 8.4 quyết định KHÔNG thêm field này vào Entity) | Domain Spec Appendix 9.3 |

**Quyết định về `PlanetCategory`:** định nghĩa enum trong M1 (chi phí gần 0, dùng chung sau này) nhưng **không** thêm làm field trên `Planet` Entity — phân loại Personal/Social/Outer chỉ cần thiết cho Orb Policy (M3, Aspect Calculator), tính từ `PlanetName` bằng 1 hàm tra bảng thuần túy khi cần, không phải thuộc tính lưu trữ của từng `Planet` instance (tránh dữ liệu dư thừa/không đồng bộ nếu enum thay đổi).

### 8.4 Ánh xạ Invariant (INV-1 → INV-16, Natal Chart Domain Spec Mục 25) — cái nào M1 enforce được, cái nào không

| Invariant | M1 enforce được? | Vị trí | Lý do nếu KHÔNG |
|---|---|---|---|
| INV-1 (`chartType` đóng) | ✅ | `Chart.create()` | — |
| INV-2 (`planets.length ≥ 10`) | ✅ | `Chart.create()` | — |
| INV-3 (`houseSystem` đóng danh sách) | ✅ | `Chart.create()` (hoặc `HouseSystem` enum tự đóng, TypeScript compiler enforce) | — |
| INV-4 (houses/angles "có hoặc không có gì cả", theo `isHouseDataAvailable`) | ✅ | `Chart.create()` | — |
| INV-5 (`House.number` ∈[1,12], không trùng) | ✅ | `Chart.create()` (xác nhận tập `House[]` truyền vào) | — |
| INV-6 (`Planet.name` ∈ 14 enum) | ✅ (tự động qua TypeScript `PlanetName` enum) | Compile-time | — |
| INV-7 (`longitude`∈[0,360), `degreeInSign`∈[0,30)) | ✅ | `Planet.create()`/`House.create()`/`Angle.create()` | — |
| INV-8 (`aspectType` ∈ 5 giá trị) | ✅ (tự động qua `AspectType` enum) | Compile-time | — |
| INV-9 (`orb ≤ maxOrbAllowed`) | ❌ **Không enforce ở M1** | — | Cần Orb Policy/bảng tra cứu (M3) — `Aspect` Entity ở M1 chỉ lưu `orb` đã tính sẵn, không tự verify lại giá trị tối đa (Calculator, không phải Entity, chịu trách nhiệm không tạo Aspect vượt ngưỡng — Entity chỉ đảm bảo `orb ≥ 0`) |
| INV-10 (không trùng cặp planet trong 1 Chart) | ✅ | `Chart.create()` (xác nhận tập `Aspect[]` truyền vào không trùng cặp) | — |
| INV-11 (Snapshot bất biến) | ✅ (kiến trúc) | Không có method `update()`/setter nào trên `Chart` — chỉ `create()`/`reconstitute()` | — |
| INV-12 (`calculationMetadata` luôn đủ 2 field) | ✅ | `Chart.create()` | — |
| INV-13 (`userId` bắt buộc nếu persist) | ⚠️ **Một phần** | `Chart` Entity **luôn yêu cầu `userId`** trong M1 (đơn giản hóa: coi `userId` bắt buộc ở mọi `Chart` instance, kể cả Chart transient `save=false`) — việc "Guest tạo Chart transient không `userId`" là khác biệt ở **Application layer** (M6, không persist thì không cần gọi `Chart.create()` với `userId` thật, có thể dùng `userId` placeholder hoặc thiết kế `Chart` cho phép `userId: string | null` — xem Decision Required M1-OQ-1, Mục 15) |
| INV-14 (Sun/Moon không bao giờ retrograde) | ✅ | `Planet.create()` | — |
| INV-15 (`DSC=ASC+180`, `IC=MC+180`) | ✅ | `Chart.create()` (xác nhận tập `Angle[]` truyền vào, không phải `Angle.create()` cá nhân vì cần biết cả 4 góc cùng lúc) | — |
| INV-16 (`Pattern.involvedPlanets.length ≥ 3`) | ✅ | `Pattern.create()` | — |

**INV-9 là invariant duy nhất KHÔNG thuộc M1** — ghi nhận rõ, không giả vờ đã xử lý (đúng yêu cầu đề bài "Do NOT invent a decision").

### 8.5 Domain Error (6 class mới)

`UnsupportedHouseSystemError`, `UnsupportedChartTypeError`, `UnsupportedCelestialBodyError`, `InvalidCoordinateError`, `InvalidDateTimeError`, `DataIntegrityError` — đúng Sprint 3 Backend Implementation Plan Mục 7.3, đối chiếu Natal Chart Domain Spec Mục 26.

**`ChartCalculationFailed` — KHÔNG tạo class ở M1** (khác dự kiến ban đầu ở Sprint 3 Plan Mục 7.1 liệt kê trong cùng nhóm) — lý do: đây là lỗi runtime **không lường trước xảy ra trong Calculator** (Natal Chart Domain Spec Mục 26 mô tả: *"lỗi runtime không lường trước trong Calculator"*) — bản chất là 1 wrapper cho exception bất kỳ phát sinh trong **pipeline tính toán** (M3), không phải lỗi Entity/VO tự ném ra khi validate input. Tạo class này ở M1 mà chưa có Calculator nào dùng tới là suy đoán trước 1 chi tiết implementation của M3 (M3 có thể chọn cách khác, ví dụ bọc lỗi ở Application layer thay vì Domain error riêng) — **để M3 tự quyết định và tạo class này khi thực sự cần**, đúng nguyên tắc không đưa quyết định vượt quá phạm vi milestone đang làm.

`HouseSystemNotConvergingError` — **không tạo** (đã xác nhận nhiều lần: đây là `Warning.code`, không phải Exception, Natal Chart Domain Spec Mục 26).

### 8.6 Domain Port (2)

| Port | Vì sao thuộc M1 | Milestone nào tiêu thụ | Layer sở hữu | Implementation ở đâu |
|---|---|---|---|---|
| `IEphemerisProvider` (+ 5 type đi kèm) | Đây là **domain contract** mà M3 (Chart Builder gọi qua interface) và M2 (Adapter implement) đều cần tồn tại **trước** — định nghĩa sớm ở M1 để M2/M3 làm song song không cần chờ nhau, đúng chữ ký đã Confirmed ở Swiss Ephemeris Integration Spec Mục 8 (không tự phát minh lại) | M3 (tiêu thụ qua `ChartBuilder`) | Domain | M2 (`SwissEphemerisAdapter`) |
| `IChartRepository` | Domain contract cho persistence — M6 (Application) cần gọi qua interface, M5 cần biết chữ ký để implement đúng | M6 (tiêu thụ), M5 (implement) | Domain | M5 (`PrismaChartRepository`) |

**Không tạo port nào khác ở M1** — không có `IInterpretationContentProvider` (ngoài phạm vi MVP), không có port riêng cho Pattern (không cần — Pattern chỉ là Entity, không có external dependency).

---

## 9. Detailed Task Breakdown

Thứ tự thực thi theo đúng dependency thật (Error → VO → Entity → Port, khác nhẹ thứ tự gợi ý của đề bài — giải thích lý do ngay dưới mỗi task): TypeScript Entity/VO **import** class Error để `throw`, nên Error phải tồn tại trước; VO được Entity dùng làm field, nên VO phải tồn tại trước Entity.

### M1-T1 — Pre-implementation Verification

**Objective:** Xác nhận trực tiếp toàn bộ convention/cấu trúc thật trước khi viết bất kỳ dòng code nào, tránh sao chép nhầm chi tiết ngẫu nhiên của `birth-profile` không phù hợp với `chart`.

**Why this task exists:** Đúng yêu cầu đề bài Mục 14 — "MUST require the developer/AI to inspect the actual codebase before implementation" + "Do NOT blindly copy Identity/BirthProfile structures if Natal Chart domain has different requirements."

**Prerequisites:** Không.

**Files:** Không tạo/sửa file nào — task thuần đọc/xác nhận.

**Implementation steps:**
1. Đọc `backend/src/modules/birth-profile/domain/entities/birth-profile.entity.ts` — xác nhận pattern `private constructor` + `static create()` (validate invariant, throw Domain Error) + `static reconstitute()` (bỏ qua validate, dùng khi load từ DB) + `update()` (Chart **không có** method này — đúng INV-11, cần lưu ý khác biệt).
2. Đọc `backend/src/modules/birth-profile/domain/value-objects/birth-date.vo.ts` — xác nhận pattern VO: `private constructor` + `static create()` (validate, throw) + `get value()` (trả bản sao nếu mutable type như `Date`) + `equals()`.
3. Đọc `backend/src/modules/birth-profile/domain/errors/birth-profile.errors.ts` — xác nhận pattern: mỗi Error extends `Error` trực tiếp (không có base `DomainError` class chung trong `backend/src/shared/`), set `this.name = 'ClassName'` trong constructor.
4. Đọc `backend/src/modules/birth-profile/domain/ports/birth-profile-repository.port.ts` — xác nhận pattern interface thuần, method trả `Promise<Entity | null>`, có `ListOptions` interface riêng cho phân trang.
5. Đọc `backend/src/shared/errors/error-codes.ts` toàn bộ — xác nhận vị trí chèn block `// Chart Domain` mới (theo đúng comment-block pattern đã có), xác nhận `EPHEMERIS_PROVIDER_ERROR` đã tồn tại sẵn (không tạo trùng).
6. Đọc `backend/tests/unit/modules/birth-profile/domain/**` — xác nhận cấu trúc test mirror 1-1 `src/`, naming `<file>.test.ts`.
7. Đọc `backend/.eslintrc.cjs` — xác nhận `boundaries/elements` đã khai báo `module-root` (`src/modules/*/index.ts`) và 4 layer type (`domain`/`application`/`infrastructure`/`presentation`), xác nhận `boundaries/element-types` hiện tại **chỉ** có rule layer nội bộ (không có rule cross-module) — ghi nhận để M1-T7 verify đúng phần này áp dụng được cho `chart/`.
8. Đọc `backend/tsconfig.json` — xác nhận `"module": "NodeNext"` → mọi import trong file mới phải dùng đuôi `.js` (dù nguồn là `.ts`).
9. Đọc `Coding_Standards_And_Conventions.md` §5 (Class), §6 (Interface), §7 (Enum — đã xác nhận ví dụ mẫu chính là `AspectType`), §11 (DTO), §12 (Entity), §13 (Repository).

**Dependencies:** Không.

**Architectural constraints:** Task này không tạo code, không vi phạm gì.

**Tests required:** Không.

**Acceptance Criteria:** Có 1 ghi chú ngắn (đính kèm PR đầu tiên của M1, không phải tài liệu riêng) xác nhận đã đọc đủ 9 mục trên, liệt kê rõ pattern sẽ áp dụng cho `chart/`.

**Definition of Done:** Ghi chú tồn tại, không có mục nào bị bỏ qua.

**Potential pitfalls:** Bỏ qua bước này rồi copy nguyên `update()` method của `BirthProfile` sang `Chart` — vi phạm trực tiếp INV-11 (Chart bất biến). Đây chính là rủi ro lớn nhất nếu "blindly copy" — nhắc lại tường minh trong Mục 14 self-check.

---

### M1-T2 — CI Corrective Fix (T-CI-FIX)

**Objective:** Di chuyển đúng vị trí + sửa trigger branch của CI backend, chạy xanh **trước khi** các Task code khác của M1 merge.

**Why this task exists:** Sprint 3 Backend Implementation Plan đã Confirmed di chuyển `T-CI-FIX` từ M10 → M1 (bảo vệ toàn bộ M2–M10 phía sau bằng CI ngay từ đầu). Đặt **sớm trong M1** (T2, không phải cuối) vì mọi Task code sau đó (T3 trở đi) cần CI thật để tự động xác nhận `lint`/`typecheck`/`test` — làm sau sẽ mất tác dụng bảo vệ cho chính M1.

**Prerequisites:** M1-T1 (đã xác nhận nội dung `ci.yml` thật).

**Files:**
- Xóa: `backend/.github/workflows/ci.yml`
- Tạo mới: `.github/workflows/backend-ci.yml` (root — nội dung giữ nguyên 100% các step đã có, chỉ sửa đúng 1 chỗ: `on.push.branches`/`on.pull_request.branches` thêm `dev` bên cạnh `main`, hoặc đổi hẳn sang `dev` nếu `dev` là nhánh phát triển chính — xác nhận quy ước nhánh thật của dự án trước khi quyết định thêm hay thay).

**Implementation steps:**
1. Xác nhận quy ước nhánh Git thật của dự án (đối chiếu lịch sử commit — toàn bộ Sprint 0–2 phát triển trên `dev`, merge vào `main` khi đóng Sprint) → quyết định: `branches: [main, dev]` (giữ cả 2, vì cả merge-vào-main lẫn phát triển-trên-dev đều cần CI).
2. `git mv backend/.github/workflows/ci.yml .github/workflows/backend-ci.yml` (giữ lịch sử file qua `git mv`, không xóa-tạo-lại).
3. Sửa đúng 1 khối `on:` trong file đã di chuyển.
4. **Không sửa bất kỳ step nào khác** (Lint/Format/Typecheck/Test/Build giữ nguyên thứ tự và nội dung — đã xác nhận không có vấn đề step-order thật, Mục 2).
5. Push, xác nhận GitHub Actions trigger đúng và chạy xanh trên nhánh `dev` thật.

**Dependencies:** Không phụ thuộc code Chart module nào — có thể làm độc lập, chỉ cần đặt trước các Task code khác trong trình tự merge.

**Architectural constraints:** Không đổi logic pipeline CI, chỉ đổi vị trí + trigger.

**Tests required:** Không phải unit test — bằng chứng là 1 lần chạy CI thật thành công trên GitHub Actions.

**Acceptance Criteria:** File tồn tại đúng `.github/workflows/backend-ci.yml`; `backend/.github/` không còn workflow nào; CI trigger đúng và xanh trên `dev`.

**Definition of Done:** Có link tới 1 lần chạy CI thành công đính kèm PR.

**Potential pitfalls:** Xóa nhầm cả `postgres` service block hoặc `DATABASE_URL` env khi di chuyển (chỉ nên `git mv` + sửa đúng 1 dòng, không viết lại file); quên rằng `frontend-ci.yml` đã có sẵn ở root — đặt tên `backend-ci.yml` để tránh trùng/nhầm lẫn 2 workflow.

---

### M1-T3 — Domain Errors & ErrorCode Extension

**Objective:** Tạo 6 Domain Error class + mở rộng `ErrorCode` enum — phải tồn tại **trước** T4/T5 vì VO/Entity sẽ `throw` các class này.

**Why this task exists:** Đúng đề bài Mục 17 gợi ý "Domain invariants and errors" — đặt sớm hơn thứ tự gợi ý (trước VO/Entity thay vì sau) vì lý do dependency compile-time cụ thể đã giải thích ở đầu Mục 9.

**Prerequisites:** M1-T1.

**Files:**
- Mới: `backend/src/modules/chart/domain/errors/chart.errors.ts`
- Mới: `backend/src/modules/chart/domain/errors/index.ts` (barrel nội bộ Domain layer — không phải module-root, chỉ export cho `chart/domain/**` dùng nội bộ, đúng pattern `birth-profile/domain/errors/` không có `index.ts` riêng thực ra — **xác nhận qua M1-T1**: nếu `birth-profile` không có `errors/index.ts`, `chart` cũng không tạo, giữ đúng convention thật thay vì thêm "cải tiến" không có tiền lệ)
- Sửa: `backend/src/shared/errors/error-codes.ts`

**Implementation steps:**
1. Trong `chart.errors.ts`, tạo đúng 6 class theo pattern M1-T1 xác nhận (`extends Error`, `this.name = '<ClassName>'`):
   - `UnsupportedHouseSystemError`
   - `UnsupportedChartTypeError`
   - `UnsupportedCelestialBodyError`
   - `InvalidCoordinateError`
   - `InvalidDateTimeError`
   - `DataIntegrityError`
2. Trong `error-codes.ts`, thêm block mới (theo đúng vị trí comment-block pattern đã có, sau block `// Birth Profile Domain`):
   ```typescript
   // Chart Domain
   UNSUPPORTED_HOUSE_SYSTEM = 'UNSUPPORTED_HOUSE_SYSTEM',
   UNSUPPORTED_CHART_TYPE = 'UNSUPPORTED_CHART_TYPE',
   UNSUPPORTED_CELESTIAL_BODY = 'UNSUPPORTED_CELESTIAL_BODY',
   INVALID_COORDINATES = 'INVALID_COORDINATES',
   INVALID_DATETIME = 'INVALID_DATETIME',
   DATA_INTEGRITY_ERROR = 'DATA_INTEGRITY_ERROR',
   ```
3. **Không** tạo `map-domain-error.ts` cho Chart ở M1 — file đó thuộc `application/errors/`, là Application layer (M6), không phải Domain — 6 class Error ở M1 chỉ tồn tại để `throw`, việc map sang HTTP status/RFC7807 là công việc M6/M7.

**Dependencies:** M1-T1.

**Architectural constraints:** Domain Error không import gì ngoài `Error` (built-in) — không import `AppError`/`ExternalServiceError` (đó là Infrastructure/Application error kernel, khác tầng).

**Tests required:** `backend/tests/unit/modules/chart/domain/errors/chart.errors.test.ts` — mỗi class: khởi tạo đúng `message`, đúng `name`, là instance của `Error`.

**Acceptance Criteria:** 6 class tồn tại, đúng tên khớp Natal Chart Domain Spec Mục 26; `ErrorCode` có đúng 6 giá trị mới, không trùng giá trị đã có (`INVALID_LATITUDE_RANGE`/`INVALID_LONGITUDE_RANGE` của `birth-profile` **không** bị đổi/xóa).

**Definition of Done:** `npm run typecheck` sạch; test pass.

**Potential pitfalls:** Tái sử dụng nhầm `INVALID_LATITUDE_RANGE`/`INVALID_LONGITUDE_RANGE` đã có (Sprint 3 Backend Implementation Plan Mục 7.3 đã xác nhận rõ **không** tái sử dụng, giữ tách biệt ranh giới module).

---

### M1-T4 — Value Objects

**Objective:** 4 VO — `ZodiacPosition`, `EngineInput`, `Warning`, `ChartCalculationMetadata`.

**Why this task exists:** VO là building block cho Entity (T5) — phải tồn tại trước.

**Prerequisites:** M1-T3 (cần Error class để VO tự validate).

**Files:**
- Mới: `chart/domain/value-objects/zodiac-position.vo.ts`
- Mới: `chart/domain/value-objects/engine-input.vo.ts`
- Mới: `chart/domain/value-objects/warning.vo.ts`
- Mới: `chart/domain/value-objects/calculation-metadata.vo.ts`

**Implementation steps:**
1. `ZodiacPosition`: `private constructor(longitude, sign, degreeInSign)`; `static fromLongitude(longitude: number): ZodiacPosition` — normalize `longitude` về `[0,360)` (Natal Chart Domain Spec Mục 21), derive `sign = ZODIAC_SIGNS[Math.floor(longitude/30)]`, `degreeInSign = longitude % 30`. **Không** nhận `sign`/`degreeInSign` làm tham số đầu vào riêng (chỉ derive từ `longitude`, đúng nguyên tắc "không có 2 nguồn sự thật", Mục 12/21 Natal Chart Domain Spec).
2. `EngineInput`: gói `birthData` (shape cục bộ — `birthDate: Date`, `birthTime: { hour, minute, second } | null`, `isBirthTimeKnown: boolean`, `latitude: number`, `longitude: number`, `timezoneId: string` — **không import type từ `birth-profile`**, đúng quyết định Mục 7), `chartOptions` (`houseSystem: HouseSystem`, `includeOptionalPoints: PlanetName[]`, `chartType: ChartType`). VO thuần dữ liệu, `static create()` chỉ validate shape tối thiểu (không validate business rule sâu — đó là Validation Module, M3).
3. `Warning`: `code: string`, `message: string`, `severity: 'info' | 'warning'`, `field?: string`, `details?: Record<string, unknown>`. `static create()` validate `severity` ∈ 2 giá trị.
4. `ChartCalculationMetadata`: `calculatedAt: Date`, `engineVersion: string`. `static create()` validate `engineVersion` không rỗng.

**Dependencies:** M1-T3.

**Architectural constraints:** Không VO nào import Entity (tránh phụ thuộc vòng).

**Tests required:** 4 file test tương ứng — `zodiac-position.vo.test.ts` (test derive đúng cho biên `longitude=0`, `29.999`, `30`, `359.999`, `375` normalize về `15`); `engine-input.vo.test.ts`; `warning.vo.test.ts`; `calculation-metadata.vo.test.ts`.

**Acceptance Criteria:** `ZodiacPosition.fromLongitude(375)` trả `longitude=15, sign=Aries, degreeInSign=15` (TR-1/TR-2, Natal Chart Domain Spec Mục 31); toàn bộ VO immutable (không có setter).

**Definition of Done:** `npm run typecheck`/`test` sạch cho `value-objects/`.

**Potential pitfalls:** Quên modulo an toàn cho số âm khi normalize `longitude` (Natal Chart Domain Spec Mục 21 đã cảnh báo — dùng `((value % 360) + 360) % 360`, không dùng `value % 360` trần trụi).

---

### M1-T5 — Domain Entities

**Objective:** 6 Entity — `Chart` (Aggregate Root), `Planet`, `House`, `Angle`, `Aspect`, `Pattern`.

**Why this task exists:** Lõi Domain Model.

**Prerequisites:** M1-T3, M1-T4.

**Files:** `chart/domain/entities/{chart,planet,house,angle,aspect,pattern}.entity.ts`

**Implementation steps (theo đúng pattern `BirthProfile` xác nhận ở M1-T1, điều chỉnh cho đúng đặc thù bất biến của Chart):**

1. **`Planet`**: `props: { id, name: PlanetName, category: PlanetCategory, longitude, latitude, speed, isRetrograde, zodiacPosition: ZodiacPosition, house: number | null }`. `static create()`: validate `longitude∈[0,360)` (`InvalidCoordinateError` nếu sai — thực ra đây là lỗi lập trình nội bộ do dữ liệu đã qua Calculator, cân nhắc dùng `DataIntegrityError` thay vì `InvalidCoordinateError` vì nguồn dữ liệu không phải trực tiếp từ user input — quyết định: dùng `DataIntegrityError`, đúng ngữ nghĩa "dữ liệu tính toán ra sai", `InvalidCoordinateError` dành cho **input đầu vào từ user** ở `EngineInput`); enforce **INV-14** (nếu `name∈{Sun,Moon}` và `isRetrograde===true` → throw `DataIntegrityError`). **Không có `update()`.**
2. **`House`**: `props: { id, number: number, cuspDegree: number, houseSystem: HouseSystem }`. `static create()`: validate `number∈[1,12]`.
3. **`Angle`**: `props: { id, type: 'Ascendant'|'Midheaven'|'Descendant'|'ImumCoeli', longitude: number }`.
4. **`Aspect`**: `props: { id, planetA: PlanetName, planetB: PlanetName, aspectType: AspectType, exactAngle: number, orb: number, isApplying: boolean }`. `static create()`: validate `planetA !== planetB`; validate `planetA < planetB` theo alphabet (canonical ordering, Natal Chart Domain Spec Mục 18.5 — throw lỗi lập trình nội bộ nếu vi phạm, dùng `DataIntegrityError` vì đây là lỗi Calculator không tuân thủ hợp đồng, không phải lỗi input); validate `orb ≥ 0`.
5. **`Pattern`**: `props: { id, patternType: string, involvedPlanets: PlanetName[] }`. `static create()`: validate `involvedPlanets.length ≥ 3` (**INV-16**). **Ghi rõ comment trong file:** *"Pattern detection algorithm deferred — Sprint 3 M3 sẽ luôn tạo `patterns=[]`, entity này tồn tại đúng theo D-14 Confirmed (Natal Chart Domain Spec), không implement thuật toán Grand Trine/T-Square/Grand Cross/Yod."*
6. **`Chart`** (Aggregate Root, phức tạp nhất):
   ```typescript
   interface ChartProps {
     id: string;
     userId: string | null;              // xem M1-OQ-1, Mục 15
     chartType: ChartType;
     birthProfileId: string | null;
     engineInput: EngineInput;            // giữ lại input đã dùng — hỗ trợ truy vết, KHÔNG map trực tiếp sang cột snapshot_* (đó là Infrastructure Mapper, M5)
     planets: Planet[];
     houses: House[];
     angles: Angle[];
     aspects: Aspect[];
     patterns: Pattern[];
     houseSystem: HouseSystem;
     isHouseDataAvailable: boolean;
     calculationMetadata: ChartCalculationMetadata;
     warnings: Warning[];
     createdAt: Date;
     deletedAt: Date | null;
   }
   ```
   `static create(props)`: enforce **INV-1** (`chartType==='Natal'`, vì `ChartType` enum hiện chỉ có 1 giá trị nên compiler đã enforce phần lớn, nhưng vẫn validate tường minh cho rõ ràng và phòng enum mở rộng sau); **INV-2** (`planets.length>=10`); **INV-4** (nếu `isHouseDataAvailable` → `houses.length===12 && angles.length===4`; ngược lại → cả 2 rỗng); **INV-5** (số `House.number` là hoán vị `{1..12}`, không trùng); **INV-10** (không trùng cặp `(planetA,planetB)` trong `aspects`); **INV-12** (`calculationMetadata` luôn có giá trị — đã đảm bảo qua TypeScript required field, không nullable); **INV-15** (nếu có `angles`, verify `DSC=(ASC+180) mod 360` và `IC=(MC+180) mod 360` trong dung sai làm tròn rất nhỏ, ví dụ `1e-9`, vì đây là **số đã tính sẵn truyền vào**, không phải Chart tự tính — sai lệch dù nhỏ nghĩa là dữ liệu đầu vào đã sai, throw `DataIntegrityError`).
   `static reconstitute(props)`: bỏ qua toàn bộ validate (dùng khi load từ DB ở M5 — dữ liệu đã qua `create()` 1 lần trước khi persist, không cần validate lại).
   **Tuyệt đối không có `update()`** — đây là khác biệt cố ý so với `BirthProfile` (đúng INV-11, ghi rõ comment giải thích trong code: *"Chart is immutable by design — Natal Chart Domain Spec §27.6/§27.7. No update() method exists intentionally."*).
   Chỉ có 1 method thay đổi trạng thái hợp lệ: `softDelete(): Chart` — trả về **instance mới** với `deletedAt=now()` (không mutate instance cũ, giữ đúng tinh thần immutable — khác `update()` vì đây không phải "sửa nội dung nghiệp vụ", chỉ đổi visibility, đúng phân biệt đã nêu ở Natal Chart Domain Spec Mục 27.7).

**Dependencies:** M1-T3, M1-T4.

**Architectural constraints:** `Chart` là **nơi duy nhất** enforce invariant cấp toàn Chart (INV-4/5/10/15) — `Planet`/`House`/`Angle`/`Aspect` chỉ enforce invariant cấp bản thân nó (INV-6/7/8/9-partial/14/16). Không Entity con nào tự kiểm tra tính nhất quán với Entity con khác (đó là trách nhiệm `Chart.create()`, nhận toàn bộ mảng rồi verify chéo).

**Tests required:** 6 file test — mỗi Entity test đầy đủ nhánh `create()` hợp lệ + từng nhánh invariant vi phạm (throw đúng Error type); `chart.entity.test.ts` là file test lớn nhất, cần test riêng nhánh `isHouseDataAvailable=true` (đủ 12 houses/4 angles) và `isHouseDataAvailable=false` (houses/angles rỗng) — trực tiếp map INV-4 và TR-7 (Natal Chart Domain Spec).

**Acceptance Criteria:** Toàn bộ INV-1 đến INV-16 **trừ INV-9** (Mục 8.4) có test xác nhận pass khi hợp lệ và throw đúng khi vi phạm; `Chart` không có method `update()` (xác nhận bằng chính việc không tồn tại trong code, không cần test riêng — TypeScript sẽ báo lỗi biên dịch nếu ai gọi `chart.update()`).

**Definition of Done:** `npm run typecheck`/`lint`/`test` sạch cho `entities/`.

**Potential pitfalls:** Vô tình cho phép `Chart` Entity nhận `planets`/`houses` không qua kiểm tra tham chiếu (ví dụ mutate mảng `planets` từ bên ngoài sau khi `create()` xong) — cần `Object.freeze()` hoặc trả bản sao mảng qua getter (đúng pattern `BirthDate.value` trả `new Date(...)` để tránh mutation, áp dụng tương tự cho mọi getter trả mảng/object của `Chart`).

---

### M1-T6 — Domain Ports

**Objective:** `IEphemerisProvider` (+ 5 type liên quan) và `IChartRepository`.

**Why this task exists:** Domain contract cho M2/M3 (Ephemeris) và M5/M6 (Repository).

**Prerequisites:** M1-T5 (cần `Chart` Entity làm kiểu tham số của `IChartRepository`; `IEphemerisProvider` không cần Entity, có thể làm song song ngay sau T4, nhưng gộp chung task cho gọn theo đúng gợi ý cấu trúc đề bài "Domain contracts / ports").

**Files:**
- Mới: `chart/domain/ports/ephemeris-provider.port.ts`
- Mới: `chart/domain/ports/chart-repository.port.ts`

**Implementation steps:**
1. `ephemeris-provider.port.ts` — copy **nguyên văn** chữ ký đã Confirmed (Swiss Ephemeris Integration Spec Mục 8, không tự đổi 1 ký tự):
   ```typescript
   export interface EphemerisRequest {
     utcDateTime: Date;
     coordinates: { latitude: number; longitude: number };
   }
   export interface RawEphemerisData {
     planets: Array<{ name: PlanetName; longitude: number; latitude: number; speed: number }>;
   }
   export interface HouseCalculationRequest {
     utcDateTime: Date;
     coordinates: { latitude: number; longitude: number };
     houseSystem: HouseSystem;
   }
   export interface RawHouseData {
     cusps: number[];
     ascendant: number;
     midheaven: number;
   }
   export type HouseCalculationResult =
     | { status: 'success'; data: RawHouseData }
     | { status: 'not_convergent' };
   export interface IEphemerisProvider {
     calculateNatal(request: EphemerisRequest): Promise<RawEphemerisData>;
     calculateHouses(request: HouseCalculationRequest): Promise<HouseCalculationResult>;
     calculateTransit(request: EphemerisRequest): Promise<RawEphemerisData>;
   }
   ```
2. `chart-repository.port.ts` — đúng pattern `IBirthProfileRepository` (M1-T1), điều chỉnh theo đặc thù Chart (immutable, không có `update()`):
   ```typescript
   export interface ListChartsOptions {
     page: number;
     pageSize: number;
     birthProfileId?: string;
     sortBy: 'calculatedAt';
     order: 'asc' | 'desc';
   }
   export interface IChartRepository {
     save(chart: Chart): Promise<void>;
     findById(id: string): Promise<Chart | null>;
     listByUserId(userId: string, options: ListChartsOptions): Promise<{ items: Chart[]; total: number }>;
     softDelete(id: string, userId: string): Promise<boolean>;
   }
   ```
   **Không có `update()`** trên interface (khác `IBirthProfileRepository` có `update()`) — đúng đặc thù Chart immutable; `save()` dùng tên chung (không `create()`) vì ngữ nghĩa gần "persist snapshot" hơn "create mutable record".

**Dependencies:** M1-T5 (cho `chart-repository.port.ts`), M1-T3/T4 (cho `ephemeris-provider.port.ts` — chỉ cần `PlanetName`/`HouseSystem` type).

**Architectural constraints:** Cả 2 file **không** import bất kỳ implementation nào — thuần interface + type. `ephemeris-provider.port.ts` **không** import `Chart`/`Planet` Entity (nó chỉ cần `PlanetName`/`HouseSystem` type, giữ tối giản, đúng nguyên tắc Swiss Ephemeris Integration Spec Mục 8 — `RawEphemerisData` là DTO thô, không phải Entity).

**Tests required:** Không cần test riêng cho file `.port.ts` thuần interface (không có logic runtime để test) — xác nhận gián tiếp qua việc code khác import và dùng đúng type (TypeScript compiler tự verify).

**Acceptance Criteria:** `IEphemerisProvider` khớp 100% ký tự với Swiss Ephemeris Integration Spec Mục 8 (đối chiếu copy-paste, không diễn giải lại); `IChartRepository` không có `update()`.

**Definition of Done:** `npm run typecheck` sạch toàn bộ `chart/domain/`.

**Potential pitfalls:** Tự ý "cải tiến" chữ ký `IEphemerisProvider` (ví dụ đổi tên field, thêm optional param) — **không được phép**, đây là hợp đồng đã Confirmed, sai khác dù nhỏ sẽ phá vỡ giả định của M2/M3.

---

### M1-T7 — Architecture/Boundary Verification

**Objective:** Xác nhận cấu trúc `chart/domain/` mới tương thích với `boundaries/elements` đã khai báo ở `.eslintrc.cjs` — **không** thêm rule cross-module mới (đó là M4/T-BOUNDARY-VERIFY).

**Why this task exists:** Đúng yêu cầu Confirmation Sprint 3 Plan: *"M1 should verify that existing boundary rules remain compatible with the new Chart module structure where practical."*

**Prerequisites:** M1-T2 đến M1-T6 (cần code thật tồn tại để verify).

**Files:** Không tạo/sửa `.eslintrc.cjs` (chỉ verify, không đổi cấu hình ở M1).

**Implementation steps:**
1. Chạy `npx eslint backend/src/modules/chart --ext .ts` — xác nhận `chart/domain/**` **không** bị `boundaries/element-types` báo lỗi (vì hiện tại M1 chưa có `application`/`infrastructure`/`presentation` nào trong `chart/` để layer rule nội bộ có gì phải chặn — nhưng vẫn chạy để xác nhận `type: domain` matcher (`chart/domain/**` khớp đúng pattern `src/modules/*/domain/**` đã khai báo) nhận diện đúng thư mục mới, không bị rơi vào type "unknown"/không khớp).
2. Xác nhận **không có** cảnh báo `no-unknown-files`/`no-unknown-elements` (nếu rule này bật) cho toàn bộ file mới trong `chart/domain/`.
3. Ghi chú kết quả (không sửa cấu hình) — nếu phát hiện `chart/` **không** khớp đúng pattern đã khai báo (ví dụ do đặt sai tên thư mục con), sửa lại tên thư mục cho khớp `boundaries/elements` pattern hiện có (`domain`/`application`/`infrastructure`/`presentation`) — đây là sửa **cấu trúc thư mục Chart** cho khớp, không phải sửa `.eslintrc.cjs`.

**Dependencies:** M1-T2 đến M1-T6.

**Architectural constraints:** Không thêm rule mới, không đổi `boundaries/element-types`.

**Tests required:** Không phải unit test — bằng chứng là output `eslint` sạch.

**Acceptance Criteria:** `npx eslint backend/src/modules/chart` (0 lỗi liên quan `boundaries/*`); cấu trúc thư mục `chart/domain/` khớp đúng pattern `boundaries/elements` đã khai báo từ Sprint 0.

**Definition of Done:** Output ESLint đính kèm PR, 0 lỗi boundaries.

**Potential pitfalls:** Nhầm tưởng cần **thêm** rule cross-module ở M1 (đó là phạm vi M4, không phải M1 — vì `chart/` ở M1 hoàn toàn không import gì từ `birth-profile`, chưa có gì để rule cross-module kiểm tra).

---

### M1-T9 — Review / Integration Verification

**Objective:** Xác nhận toàn bộ backend (không chỉ `chart/`) vẫn sạch sau khi thêm module mới — Sprint 1/2 không bị ảnh hưởng.

**Why this task exists:** Đúng yêu cầu đề bài Mục 19 AC #9 "Existing Sprint 1/Sprint 2 functionality remains green" + Mục 22 self-check.

**Prerequisites:** M1-T1 đến M1-T8.

**Files:** Không tạo mới — chạy lại toàn bộ pipeline.

**Implementation steps:**
1. `npm run lint` (toàn bộ backend, không riêng `chart/`).
2. `npm run format:check`.
3. `npm run typecheck`.
4. `npm run test:coverage` (toàn bộ backend — xác nhận `identity`/`birth-profile` test cũ vẫn 100% pass, không bị ảnh hưởng bởi `ErrorCode` enum mở rộng hay bất kỳ thay đổi nào khác).
5. `npm run build`.
6. Xác nhận CI backend (đã fix ở M1-T2) chạy xanh trên PR cuối cùng của M1.
7. Đối chiếu lại Mục 16 (AC) — tick từng mục có bằng chứng cụ thể, không dựa vào cảm giác "trông ổn".

**Dependencies:** M1-T1 đến M1-T8.

**Architectural constraints:** Không.

**Tests required:** Toàn bộ test suite hiện có (Sprint 1 + Sprint 2 + Chart M1 mới) phải pass 100%.

**Acceptance Criteria:** 5 lệnh ở bước 1–5 đều sạch; CI xanh; 0 test nào của `identity`/`birth-profile` bị fail/skip.

**Definition of Done:** Log đầy đủ 5 lệnh + link CI đính kèm PR cuối M1; sẵn sàng handoff M2 (Mục 19).

**Potential pitfalls:** Chạy test chỉ trong phạm vi `chart/` rồi kết luận "xong" — bỏ sót khả năng `ErrorCode` enum mở rộng hoặc thay đổi khác vô tình phá vỡ test cũ (dù xác suất thấp, vẫn phải chạy full suite theo đúng yêu cầu).

---

**Ghi chú về đánh số Task:** Đề bài gợi ý 9 Task (T1–T9) — tài liệu này dùng đúng 9 Task nhưng đã **gộp "Domain tests" (T6 gợi ý) vào từng Task T3–T6** (mỗi Task tự mang theo test riêng, đúng nguyên tắc TDD-adjacent thực tế hơn là tách 1 Task test cuối cùng phải quay lại từng Entity/VO/Port) và **bỏ T8 riêng "CI corrective task"** (đã gộp thành T2, đặt sớm hơn theo đúng lý do Mục 1) — số lượng Task cuối cùng vẫn là 9 (T1, T2, T3, T4, T5, T6, T7, T9 — đánh số nhảy từ T7 sang T9 để giữ nguyên ký hiệu T9 "Review/integration verification" đúng như đề bài gợi ý cho Task cuối, không có T8 riêng vì đã gộp vào T2).

---

## 10. File-by-File Implementation Plan

| File | Purpose | Layer | Dependencies (import) | Mới/Sửa |
|---|---|---|---|---|
| `.github/workflows/backend-ci.yml` | CI backend đúng vị trí + trigger | DevOps | — | Mới (di chuyển từ `backend/.github/workflows/ci.yml`) |
| `backend/src/shared/errors/error-codes.ts` | Mở rộng `ErrorCode` — 6 giá trị Chart Domain | Shared Kernel | — | Sửa |
| `backend/src/modules/chart/domain/errors/chart.errors.ts` | 6 Domain Error class | Domain | `Error` (built-in) | Mới |
| `backend/src/modules/chart/domain/types/planet-name.type.ts` | Enum `PlanetName` (14 giá trị) | Domain | — | Mới |
| `backend/src/modules/chart/domain/types/house-system.type.ts` | Enum `HouseSystem` | Domain | — | Mới |
| `backend/src/modules/chart/domain/types/aspect-type.type.ts` | Enum `AspectType` | Domain | — | Mới |
| `backend/src/modules/chart/domain/types/chart-type.type.ts` | Enum `ChartType` | Domain | — | Mới |
| `backend/src/modules/chart/domain/types/planet-category.type.ts` | Enum `PlanetCategory` | Domain | — | Mới |
| `backend/src/modules/chart/domain/types/index.ts` | Re-export 5 type trên | Domain | 5 file trên | Mới |
| `backend/src/modules/chart/domain/value-objects/zodiac-position.vo.ts` | `ZodiacPosition` VO | Domain | `types/index.js` | Mới |
| `backend/src/modules/chart/domain/value-objects/engine-input.vo.ts` | `EngineInput` VO | Domain | `types/index.js` | Mới |
| `backend/src/modules/chart/domain/value-objects/warning.vo.ts` | `Warning` VO | Domain | — | Mới |
| `backend/src/modules/chart/domain/value-objects/calculation-metadata.vo.ts` | `ChartCalculationMetadata` VO | Domain | — | Mới |
| `backend/src/modules/chart/domain/entities/planet.entity.ts` | `Planet` Entity | Domain | `types/`, `value-objects/zodiac-position.vo.js`, `errors/chart.errors.js` | Mới |
| `backend/src/modules/chart/domain/entities/house.entity.ts` | `House` Entity | Domain | `types/`, `errors/chart.errors.js` | Mới |
| `backend/src/modules/chart/domain/entities/angle.entity.ts` | `Angle` Entity | Domain | `errors/chart.errors.js` | Mới |
| `backend/src/modules/chart/domain/entities/aspect.entity.ts` | `Aspect` Entity | Domain | `types/`, `errors/chart.errors.js` | Mới |
| `backend/src/modules/chart/domain/entities/pattern.entity.ts` | `Pattern` Entity (shape only, D-14 deferred) | Domain | `types/`, `errors/chart.errors.js` | Mới |
| `backend/src/modules/chart/domain/entities/chart.entity.ts` | `Chart` Aggregate Root | Domain | `types/`, `value-objects/*`, `errors/chart.errors.js`, 5 Entity con | Mới |
| `backend/src/modules/chart/domain/entities/index.ts` | Re-export 6 Entity | Domain | 6 file trên | Mới |
| `backend/src/modules/chart/domain/ports/ephemeris-provider.port.ts` | `IEphemerisProvider` + 5 type | Domain | `types/` | Mới |
| `backend/src/modules/chart/domain/ports/chart-repository.port.ts` | `IChartRepository` | Domain | `entities/chart.entity.js` | Mới |
| `backend/tests/unit/modules/chart/domain/errors/chart.errors.test.ts` | Test 6 Error class | Test | — | Mới |
| `backend/tests/unit/modules/chart/domain/value-objects/zodiac-position.vo.test.ts` | Test `ZodiacPosition` | Test | — | Mới |
| `backend/tests/unit/modules/chart/domain/value-objects/engine-input.vo.test.ts` | Test `EngineInput` | Test | — | Mới |
| `backend/tests/unit/modules/chart/domain/value-objects/warning.vo.test.ts` | Test `Warning` | Test | — | Mới |
| `backend/tests/unit/modules/chart/domain/value-objects/calculation-metadata.vo.test.ts` | Test `ChartCalculationMetadata` | Test | — | Mới |
| `backend/tests/unit/modules/chart/domain/entities/planet.entity.test.ts` | Test `Planet` (bao gồm INV-14) | Test | — | Mới |
| `backend/tests/unit/modules/chart/domain/entities/house.entity.test.ts` | Test `House` | Test | — | Mới |
| `backend/tests/unit/modules/chart/domain/entities/angle.entity.test.ts` | Test `Angle` | Test | — | Mới |
| `backend/tests/unit/modules/chart/domain/entities/aspect.entity.test.ts` | Test `Aspect` (canonical ordering) | Test | — | Mới |
| `backend/tests/unit/modules/chart/domain/entities/pattern.entity.test.ts` | Test `Pattern` (INV-16) | Test | — | Mới |
| `backend/tests/unit/modules/chart/domain/entities/chart.entity.test.ts` | Test `Chart` (INV-1/2/4/5/10/12/15, immutability) | Test | — | Mới |

**Quyết định đặt `types/` thành thư mục riêng (không gộp vào `value-objects/`):** Enum không có hành vi/method như VO thật (không có `create()`/validate runtime) — tách riêng cho rõ ràng, đúng tinh thần "mỗi thư mục 1 loại khái niệm" đã thấy ở cấu trúc `birth-profile` (dù `birth-profile` chưa có `types/` riêng vì không có enum nào tương đương — đây là điểm khác biệt hợp lý giữa 2 module, đúng "reuse conventions, not accidental implementation details" của đề bài Mục 14, không phải sao chép máy móc).

---

## 11. Testing Strategy

Đúng yêu cầu đề bài Mục 12 — với mỗi nhóm test, nêu rõ file/target/scenario/expected/lý do.

| Test file | Target | Scenario | Expected | Vì sao quan trọng |
|---|---|---|---|---|
| `zodiac-position.vo.test.ts` | `ZodiacPosition.fromLongitude` | `longitude=375` | `{longitude:15, sign:'Aries', degreeInSign:15}` | TR-1 (Natal Chart Domain Spec) — normalization đúng là nền tảng cho mọi tính toán sau |
| `zodiac-position.vo.test.ts` | như trên | `longitude=195.5` | `sign='Libra', degreeInSign=15.5` | TR-2 |
| `chart.entity.test.ts` | `Chart.create` | `isHouseDataAvailable=false`, `houses=[]`, `angles=[]` | Tạo thành công, không throw | TR-7 — biểu diễn đúng Unknown Birth Time ở Domain layer (đề bài Mục 7 yêu cầu tường minh) |
| `chart.entity.test.ts` | `Chart.create` | `isHouseDataAvailable=true`, `houses.length=11` (thiếu 1) | Throw lỗi (INV-4 vi phạm) | Invariant "có hoặc không có gì cả" phải chặn được trạng thái lửng lơ |
| `chart.entity.test.ts` | `Chart.create` | `planets.length=9` | Throw (INV-2) | Chặn Chart thiếu hành tinh chuẩn |
| `chart.entity.test.ts` | Không có method `update` | Kiểm tra TypeScript type | Compile lỗi nếu cố gọi `.update()` | INV-11 — snapshot immutability là yêu cầu kiến trúc cốt lõi (đề bài Mục 8) |
| `chart.entity.test.ts` | `chart.softDelete()` | Gọi trên 1 `Chart` hợp lệ | Trả về **instance mới** với `deletedAt` set, instance cũ không đổi | Xác nhận immutable pattern đúng (trả instance mới, không mutate) |
| `planet.entity.test.ts` | `Planet.create` | `name='Sun', isRetrograde=true` | Throw `DataIntegrityError` (INV-14) | Bất biến thiên văn học cơ bản — sai ở đây nghĩa là lỗi dữ liệu nghiêm trọng |
| `aspect.entity.test.ts` | `Aspect.create` | `planetA='Sun', planetB='Moon'` (đúng alphabet) | Tạo thành công | Canonical ordering đúng (Mục 18.5) |
| `aspect.entity.test.ts` | `Aspect.create` | `planetA='Moon', planetB='Sun'` (sai alphabet) | Throw `DataIntegrityError` | Canonical ordering — chặn trùng cặp theo 2 chiều |
| `pattern.entity.test.ts` | `Pattern.create` | `involvedPlanets.length=2` | Throw (INV-16) | Đảm bảo Pattern (dù chưa có thuật toán) vẫn giữ đúng invariant hình dạng dữ liệu |
| `chart.errors.test.ts` | Mỗi trong 6 Error class | `new XError('msg')` | `instanceof Error`, `.name==='XError'`, `.message==='msg'` | Đảm bảo Error Handler Middleware (dùng sau, M6/M7) nhận diện đúng qua `.name` |
| `engine-input.vo.test.ts` | `EngineInput.create` | Input thiếu `latitude` | Throw lỗi shape | Chặn dữ liệu không đủ trước khi vào Engine (M3) |

**Không viết test cho:** `ephemeris-provider.port.ts`/`chart-repository.port.ts` (thuần interface — Mục 9, M1-T6); getter đơn giản không có logic (ví dụ `get id()` trả thẳng field — không cần test riêng, đã gián tiếp verify qua test `create()`).

**Không dùng Swiss Ephemeris trong bất kỳ test nào của M1** (đúng đề bài Mục 12) — toàn bộ test M1 là pure TypeScript, không I/O, chạy trong mili-giây.

---

## 12. CI / Tooling Considerations

- **T-CI-FIX** (M1-T2) là thay đổi tooling duy nhất của M1 — đã chi tiết ở Mục 9.
- **Không thêm dependency npm mới** ở M1 (0 package mới trong `package.json` — toàn bộ M1 chỉ dùng TypeScript/Vitest đã có sẵn).
- **Không sửa `tsconfig.json`/`vitest.config.ts`** — cấu trúc `chart/` khớp đúng pattern include/test glob đã có sẵn cho `birth-profile`/`identity` (đối chiếu M1-T1).
- **`.eslintrc.cjs`**: M1 **không sửa** (chỉ verify, M1-T7) — khác với M4 (T-BOUNDARY-VERIFY) sẽ sửa thật.

---

## 13. Dependency & Sequencing Graph

```
M1-T1 (Pre-implementation Verification)
   │
   ▼
M1-T2 (T-CI-FIX) ──────────────────────────► [bảo vệ toàn bộ Task sau bằng CI]
   │
   ▼
M1-T3 (Domain Errors + ErrorCode)
   │
   ▼
M1-T4 (Value Objects)
   │
   ▼
M1-T5 (Domain Entities)
   │
   ▼
M1-T6 (Domain Ports)
   │
   ▼
M1-T7 (Architecture/Boundary Verification)
   │
   ▼
M1-T9 (Review / Integration Verification)
   │
   ▼
Handoff M2 (Mục 19)
```

**Không có nhánh song song thật sự cần thiết** — dù T3/T4 về lý thuyết có thể tách 2 người làm song song (Error và 1 phần VO không phụ thuộc Error), quy mô M1 đủ nhỏ để làm tuần tự không tốn thời gian đáng kể, và tuần tự giảm rủi ro conflict merge.

**Không phụ thuộc M2** — xác nhận tường minh: T6 (Domain Ports) chỉ **định nghĩa** `IEphemerisProvider`, không cần `swisseph-wasm` cài đặt, không cần biết version cụ thể (đúng yêu cầu đề bài Mục 16 "Do NOT create dependencies on M2 that would make M1 impossible").

---

## 14. Risks & Mitigations

| Risk | Khả năng | Ảnh hưởng | Mitigation |
|---|---|---|---|
| Copy nhầm pattern `update()` từ `BirthProfile` sang `Chart` | Trung bình (nếu bỏ qua M1-T1) | Cao — vi phạm trực tiếp INV-11 | M1-T1 bắt buộc đọc kỹ trước; code review đối chiếu tường minh "Chart không có update()" |
| `EngineInput.birthData` vô tình import type từ `birth-profile` | Thấp (đã thiết kế tránh từ đầu, Mục 7) | Trung bình — tạo dependency ẩn M1→M4 | Thiết kế shape cục bộ ngay từ Mục 7/M1-T4, code review xác nhận `grep` không có `from '../../birth-profile` nào trong `chart/` |
| Enum `PlanetName`/`AspectType` lệch chính tả so với Domain Spec | Thấp | Cao (Coding Standards §7: "single source of truth", lệch gây khó đối chiếu) | Copy-paste chính xác tên từ Natal Chart Domain Spec Mục 12–13, 18; test đối chiếu độ dài enum (14/5) |
| `IEphemerisProvider` bị "cải tiến" nhẹ khi code hóa | Thấp nhưng ảnh hưởng nghiêm trọng nếu xảy ra | Cao — phá vỡ giả định M2/M3 | Copy-paste nguyên văn từ Swiss Ephemeris Integration Spec Mục 8 (M1-T6), không diễn giải lại |
| CI fix (M1-T2) làm mất lịch sử/config cũ | Thấp | Trung bình | Dùng `git mv`, chỉ sửa đúng 1 khối `on:`, không viết lại file |
| Quên enforce INV-15 (DSC/IC) ở `Chart.create()` vì tưởng đó là việc của Angle Calculator (M3) | Trung bình (dễ nhầm lẫn ranh giới) | Trung bình | Mục 8.4 đã phân định rõ: **verify** (M1, Entity tự kiểm tra dữ liệu truyền vào nhất quán) khác **tính toán** (M3, Calculator tự tính ra DSC/IC từ ASC/MC) — 2 việc khác nhau, cả 2 đều cần |
| Test dư thừa/vô nghĩa chỉ để tăng coverage | Thấp (đã có bảng Mục 11 rõ ràng target) | Thấp | Đúng risk-based coverage policy đã Confirmed (Sprint 3 Backend Implementation Plan Mục 12.7) — M9 sẽ review lại, M1 chỉ cần bám đúng bảng Mục 11 |

---

## 15. Open Questions / Decisions

Đã rà soát toàn bộ danh sách "không được mở lại" (đề bài Mục 21) — xác nhận **không** đụng tới: AGPL/Open-source, `GET /charts` scope, `eslint-plugin-boundaries` architecture decision, Unknown Birth Time 2-state, snapshot immutability, modular monolith, Clean Architecture, Swiss Ephemeris isolation.

Chỉ 1 Open Question mới phát sinh thật sự thuộc phạm vi M1, chưa được bất kỳ spec nào (Natal Chart Domain Spec, Swiss Ephemeris Integration Spec, Sprint 3 Backend Implementation Plan) trả lời ở mức đủ chi tiết implementation:

### M1-OQ-1 — `Chart.userId` có nullable ở Domain layer không? (cho trường hợp Guest, `save=false`)

- **Vì sao tồn tại:** Natal Chart Domain Spec INV-13 quy định *"`Chart.userId` luôn tồn tại **nếu Chart được persist**"* — ngụ ý Chart transient (Guest, `save=false`, không persist) **có thể** không có `userId` thật. Nhưng bản thân `Chart` Entity ở M1 là 1 class dùng chung cho cả 2 trường hợp (persist và transient) — chưa có tài liệu nào chỉ định rõ kiểu dữ liệu Domain-level là `userId: string` (bắt buộc luôn có, kể cả giá trị placeholder cho Guest) hay `userId: string | null` (nullable thật, phản ánh đúng ngữ nghĩa "chưa có chủ nếu chưa persist").
- **Affected task:** M1-T5 (`Chart` Entity props).
- **Options:**
  - (A) `userId: string | null` — nullable thật, `null` khi Guest/transient. Đúng ngữ nghĩa hơn, nhưng M6 (Application) phải luôn check null trước khi set `userId` thật lúc `save=true`.
  - (B) `userId: string` bắt buộc luôn có — Application layer (M6) phải gán 1 giá trị (ví dụ UUID placeholder hoặc UUID thật của Guest session nếu có cơ chế đó) ngay cả khi transient. Đơn giản hơn cho Domain, nhưng "giả lập" 1 giá trị không thật là gợn về mặt ngữ nghĩa.
- **Recommendation:** (A) `userId: string | null` — khớp chính xác ngữ nghĩa INV-13 ("luôn tồn tại NẾU persist", ngụ ý không bắt buộc nếu không persist), tránh Application layer (M6) phải tạo giá trị giả. Rủi ro thấp, dễ thực thi (chỉ 1 dòng kiểu dữ liệu).
- **Priority:** **P2** — không chặn M1 (có thể chọn tạm 1 phương án, đổi sau nếu cần chỉ ảnh hưởng 1 dòng type — không phải quyết định kiến trúc lớn), nhưng nên chốt trước M6 (nơi thực sự tạo Chart transient).
- **Decision deadline:** Trước M6 (Application Layer).

**Không có Open Question nào khác** — toàn bộ quyết định còn lại đã đủ rõ từ 3 spec thượng nguồn.

---

## 16. Acceptance Criteria

Đúng 11 tiêu chí đề bài yêu cầu, diễn giải cụ thể cho M1:

1. **Natal Chart domain model tồn tại đúng frozen spec:** 6 Entity + 4 VO + 5 enum khớp 100% Natal Chart Domain Spec Mục 6–9, 12–19.
2. **Domain invariant được enforce:** INV-1 đến INV-16 trừ INV-9 (Mục 8.4) có test xác nhận pass/throw đúng.
3. **Unknown Birth Time semantics đúng:** `Chart.create()` chấp nhận `isHouseDataAvailable=false` + `houses=[]`/`angles=[]` mà không throw (TR-7); **không** có `BirthTimePrecision` level nào ngoài `isBirthTimeKnown: boolean` xuất hiện trong bất kỳ type nào của M1.
4. **Snapshot immutability được hỗ trợ:** `Chart` không có method `update()`; chỉ `create()`/`reconstitute()`/`softDelete()` (trả instance mới).
5. **Domain layer không phụ thuộc infrastructure:** `grep -rn "from 'express'\|from '@prisma\|from 'zod'\|from 'jsonwebtoken'\|from 'pino'\|swisseph" backend/src/modules/chart/domain/` trả về **0 kết quả**.
6. **Domain contract đúng ranh giới kiến trúc:** `IEphemerisProvider` khớp 100% Swiss Ephemeris Integration Spec Mục 8; `IChartRepository` sống ở `domain/ports/`, không import Prisma.
7. **Domain test có ý nghĩa pass:** Toàn bộ test Mục 11 pass — không có test giả (test luôn pass bất kể logic).
8. **Backend architecture/boundary rules vẫn hợp lệ:** `npx eslint backend/src/modules/chart` 0 lỗi `boundaries/*` (M1-T7).
9. **Sprint 1/Sprint 2 vẫn xanh:** Toàn bộ test `identity`/`birth-profile` cũ pass 100% sau khi thêm `chart/` + mở rộng `ErrorCode` (M1-T9).
10. **CI khỏe mạnh:** `.github/workflows/backend-ci.yml` chạy đúng, trigger đúng trên `dev`/`main`, xanh (M1-T2).
11. **Không có M2+ leak vào M1:** `grep -rln "swisseph" backend/src/modules/chart/` trả về **0 kết quả**; không có file nào trong `chart/domain/engine/`, `chart/application/`, `chart/infrastructure/`, `chart/presentation/` tồn tại sau M1.

**Không đặt ngưỡng coverage % nào** (đúng đề bài, đúng Sprint 3 Backend Implementation Plan Mục 12.7 đã Confirmed).

---

## 17. Definition of Done

M1 hoàn thành khi và chỉ khi toàn bộ đồng thời đúng:

- [ ] 9 Task (M1-T1 đến M1-T9, Mục 9) đạt Acceptance Criteria + Definition of Done riêng.
- [ ] 11 M1 Acceptance Criteria (Mục 16) đạt, có bằng chứng cụ thể.
- [ ] `npm run lint`/`format:check`/`typecheck`/`test:coverage`/`build` sạch trên **toàn bộ backend** (không riêng `chart/`).
- [ ] CI backend (`backend-ci.yml`) đã chạy xanh tại vị trí mới, trigger đúng.
- [ ] Không file nào thuộc `chart/domain/engine/`, `chart/application/`, `chart/infrastructure/`, `chart/presentation/`, `chart/index.ts` được tạo (đúng Out of Scope, Mục 6).
- [ ] M1-OQ-1 đã chọn 1 phương án tạm (khuyến nghị A) để code, ghi chú rõ trong PR — không chặn merge nhưng cần xác nhận trước M6.
- [ ] `git status` sạch trừ thay đổi có chủ đích của M1.
- [ ] Không `FIXME` nào trong `chart/`; nếu có `TODO` (ví dụ ghi chú Pattern deferred D-14 trong `pattern.entity.ts`), đúng định dạng Coding Standards §28.

---

## 18. Final M1 File Tree

```
.github/workflows/
  backend-ci.yml                                    [MỚI — di chuyển từ backend/.github/]

backend/
  src/
    shared/
      errors/
        error-codes.ts                              [SỬA — +6 giá trị Chart Domain]
    modules/
      chart/
        domain/
          entities/
            chart.entity.ts                         [MỚI]
            planet.entity.ts                         [MỚI]
            house.entity.ts                          [MỚI]
            angle.entity.ts                          [MỚI]
            aspect.entity.ts                         [MỚI]
            pattern.entity.ts                        [MỚI]
            index.ts                                 [MỚI]
          value-objects/
            zodiac-position.vo.ts                    [MỚI]
            engine-input.vo.ts                       [MỚI]
            warning.vo.ts                             [MỚI]
            calculation-metadata.vo.ts                [MỚI]
          types/
            planet-name.type.ts                       [MỚI]
            house-system.type.ts                      [MỚI]
            aspect-type.type.ts                        [MỚI]
            chart-type.type.ts                          [MỚI]
            planet-category.type.ts                      [MỚI]
            index.ts                                     [MỚI]
          errors/
            chart.errors.ts                              [MỚI]
          ports/
            ephemeris-provider.port.ts                    [MỚI]
            chart-repository.port.ts                       [MỚI]
  tests/
    unit/
      modules/
        chart/
          domain/
            entities/
              chart.entity.test.ts                          [MỚI]
              planet.entity.test.ts                          [MỚI]
              house.entity.test.ts                            [MỚI]
              angle.entity.test.ts                             [MỚI]
              aspect.entity.test.ts                             [MỚI]
              pattern.entity.test.ts                             [MỚI]
            value-objects/
              zodiac-position.vo.test.ts                          [MỚI]
              engine-input.vo.test.ts                              [MỚI]
              warning.vo.test.ts                                    [MỚI]
              calculation-metadata.vo.test.ts                        [MỚI]
            errors/
              chart.errors.test.ts                                    [MỚI]
```

**Không tồn tại sau M1** (xác nhận âm tính, đúng Out of Scope): `chart/domain/engine/`, `chart/application/`, `chart/infrastructure/`, `chart/presentation/`, `chart/index.ts`, `backend/.github/` (đã dọn sạch sau khi di chuyển).

---

## 19. Handoff to M2

**M2 (Swiss Ephemeris Dependency & Adapter) nhận từ M1:**
- `IEphemerisProvider` (+ `EphemerisRequest`, `RawEphemerisData`, `HouseCalculationRequest`, `RawHouseData`, `HouseCalculationResult`) — sẵn sàng để `SwissEphemerisAdapter` implement, không cần đổi chữ ký.
- `PlanetName` enum (14 giá trị) — dùng cho celestial body mapping table (Swiss Ephemeris Integration Spec Mục 12).
- `HouseSystem` enum (`Placidus`/`WholeSign`) — dùng cho house-system mapping table (Mục 11.1).
- 6 Domain Error class — `EphemerisProviderError` tương đương đã có sẵn ở `ExternalServiceError('EPHEMERIS_PROVIDER_ERROR', ...)` (Shared Kernel, không phải Domain error của `chart` — M2 dùng đúng cơ chế này, không tạo Domain error mới cho lỗi Swiss Ephemeris, đúng Sprint 3 Backend Implementation Plan Mục 11).

**M2 KHÔNG nhận từ M1** (vì không tồn tại): bất kỳ implementation nào, bất kỳ giả định nào về version `swisseph-wasm` cụ thể (M2 tự Technical Spike, đúng OQ-B2 Confirmed).

**M3 (Astrology Calculation Engine) nhận từ M1:**
- 6 Entity + 4 VO — dùng làm output type của từng Calculator (`PlanetCalculator` trả `Planet[]`, v.v.).
- `EngineInput` — input chuẩn cho `ChartBuilder`.
- Invariant đã enforce sẵn ở `Chart.create()` — M3 (`ChartBuilder`) chỉ cần ráp đúng dữ liệu rồi gọi `Chart.create()`, không cần tự re-validate những gì Entity đã enforce.

**M4 (BirthProfile Integration) nhận từ M1:**
- Xác nhận `chart/` **chưa có** `index.ts` module-root — M4 sẽ là nơi đầu tiên tạo cả `birth-profile/index.ts` (module-root mới của `birth-profile`) và điểm tiêu thụ nó trong `chart/application/` (M6 thật ra, nhưng M4 chuẩn bị use case).

**M5 (Chart Persistence) nhận từ M1:**
- `IChartRepository` — sẵn sàng để `PrismaChartRepository` implement.
- `Chart.reconstitute()` — dùng khi Mapper load dữ liệu từ Prisma về Domain Entity.

**Trạng thái bàn giao:** M1 đóng với **0 Open Question chặn** (M1-OQ-1 chỉ P2, có khuyến nghị sẵn sàng dùng ngay) — M2 có thể bắt đầu Technical Spike ngay khi M1 merge, không cần chờ xác nhận gì thêm.

---

*Hết tài liệu. M1 Implementation Plan này không mở lại bất kỳ quyết định nào đã Confirmed ở Natal Chart Domain Specification v1.1, Swiss Ephemeris Integration Specification v1.1, và Sprint 3 Backend Implementation Plan v1.1 — toàn bộ nội dung là thực thi cụ thể (9 Task, 31 file, test chi tiết) cho đúng 1 milestone duy nhất. 1 điểm đính chính đã nêu tường minh (Mục 2/3): corrective CI task tên đúng là `T-CI-FIX` (vị trí file + trigger branch), không phải "step-order issue" như mô tả trong đề bài — đã xác nhận qua đọc trực tiếp `backend/.github/workflows/ci.yml` và Sprint 3 Backend Implementation Plan (nguồn thẩm quyền cao hơn). 1 Open Question mới duy nhất (M1-OQ-1, P2, có khuyến nghị) không chặn M1 hoàn thành.*
