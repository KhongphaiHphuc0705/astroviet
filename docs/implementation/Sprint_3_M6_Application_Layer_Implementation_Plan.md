# Sprint 3 — Milestone 6 Implementation Plan
## Application Layer & Orchestration

## Preface — 2 Conflict phát hiện, xử lý minh bạch trước khi vào plan (Critical Rule 20/22)

### Conflict #1 — `ChartResponse.interpretations` (REST API Spec §5.4, bắt buộc) không có nguồn dữ liệu nào

REST API Specification §5.4 (`ChartResponse`) ghi `interpretations: list<InterpretationResponse>` là **required, không nullable**, và Mục 4.4 xác nhận: *"Response luôn kèm `interpretations` nhúng sẵn (Quyết định 14.1/14.9)"*. Nhưng **không có Interpretation Content Bank/Engine nào tồn tại** trong toàn bộ M1–M5 — `Chart` Entity (M1) không có field `interpretations`, không có bảng `interpretation_contents` nào được tạo (M5 chỉ tạo đúng 6 bảng con đã đóng băng, không đụng `interpretation_contents`), và Engine Spec §6.11 tự mô tả Interpretation Engine là **module riêng, ngoài Core Pipeline**, chưa thuộc Sprint 3.

**Đây là gap thật giữa spec đã đóng băng và trạng thái code thật — không phải điều M6 có thể tự giải quyết** (tạo ra 1 subsystem Interpretation hoàn chỉnh rõ ràng vượt xa scope "Application Layer & Orchestration"). **Kết luận:** M6 trả về `Chart` domain entity/aggregate thuần túy (không có `interpretations`) — việc lắp ráp `ChartResponse` DTO (bao gồm cả cách xử lý field `interpretations` còn thiếu) là trách nhiệm của **M7 (Presentation)**, không phải M6. Ghi nhận đây là **Known Gap cần M7 xử lý tường minh** — **không phải quyết định của plan này**, chỉ xác nhận M6 không chịu trách nhiệm.

### Conflict #2 — `ListChartsUseCase` nên trả `ChartSummaryResponse` (theo văn phong prompt) hay domain entities thô (theo đúng convention Sprint 2 đã có)?

Prompt Mục 10 viết: *"Expected response: `PaginatedResponse<ChartSummaryResponse>`... The plan must explicitly map: Chart entity/snapshot ↓ ChartSummaryResponse"* — ngụ ý Application layer tự map sang DTO API.

Nhưng đối chiếu **code thật đã có** (`ListBirthProfilesUseCase`, Sprint 2, đã merge và review clean): Use Case trả về `{items: BirthProfile[], total, page, pageSize}` — **domain entity thô + primitive phân trang**, không tự map sang `BirthProfileResponse`/`PaginatedResponse<T>` API shape. Việc map DTO API là công việc của **Controller/Presentation layer** (Sprint 1/2, không thuộc Application).

**Theo đúng Critical Rule 21** ("Use the actual M1–M5 implementation as source of truth") **và Rule 1** ("Do not redesign frozen architecture") — code thật đã có (convention Sprint 2) có tính authoritative cao hơn văn phong mô tả chung của prompt. **Kết luận: `ListChartsUseCase` trả về `{items: Chart[], total, page, pageSize}`** (domain entities), **không tự map sang `ChartSummaryResponse`**. Đây cũng giải quyết gọn Conflict phụ: `ChartSummaryResponse.birthProfileLabel` ("Denormalized để tránh N+1") **không có nguồn dữ liệu nào trên `Chart` Entity** (không có `snapshot_label`/`birthProfileLabel` ở đâu trong `EngineInputBirthData`/`charts` table, M1–M5 không thêm field này) — nhưng vì M6 không tự map DTO, **gap này thuộc về M7**, không chặn M6. Ghi nhận rõ để M7 không bị bất ngờ.

---

## 1. Milestone Overview

M1 (Domain Foundation), M2 (Adapter), M3 (Calculation Engine), M4 (BirthProfile Integration), M5 (Chart Persistence) đã đóng, verify sạch trên `dev` (`ffab4fe`). M6 là điểm hội tụ đầu tiên — nơi `ChartBuilder` (M3) lần đầu tiên được **wiring thật** trong `composition-root.ts` (đã verify: chưa từng được instantiate ở đâu trước M6) và ráp nối với `GetBirthProfileSnapshotUseCase` (M4) + `IChartRepository` (M5) thành 4 Use Case hoàn chỉnh. M6 **không viết thêm domain logic, không viết thêm calculation logic, không đổi schema** — thuần túy orchestration.

---

## 2. Current Repository State

Đã verify trực tiếp bằng đọc code thật trên `dev` (`ffab4fe`), không suy đoán:

| Thành phần | Trạng thái |
|---|---|
| `ChartBuilder` (`chart/domain/engine/chart-builder.ts`) | Đã có (M3), **chưa từng instantiate** trong `composition-root.ts` |
| `IChartRepository` (`chart/domain/ports/chart-repository.port.ts`) | Đã có 4 method: `save`, `findById`, `listByUserId`, `softDelete` — đủ cho toàn bộ nhu cầu M6, **không cần sửa** |
| `PrismaChartRepository` | Đã implement đầy đủ (M5), đã wiring trong `composition-root.ts` dưới `repositories.chartRepository` |
| `GetBirthProfileSnapshotUseCase` | Đã có (M4), export qua `birth-profile/index.ts`, đã wiring trong `composition-root.ts` dưới `useCases.getBirthProfileSnapshotUseCase` |
| `chart/application/` | **Thư mục chưa tồn tại** — M6 tạo mới hoàn toàn (`use-cases/`, `shared/`) |
| `chart/index.ts` (module-root) | **Chưa tồn tại** — cần tạo (Chart module chưa có consumer cross-module nào trước M6; M7 sẽ là consumer đầu tiên của module-root này) |
| Auth middleware | `authMiddleware` (global, populate `req.user` nếu có Bearer token hợp lệ, **không** reject nếu thiếu) tách biệt khỏi `requireAuth()` (guard riêng, chỉ áp dụng cho route cần bắt buộc auth) — cơ chế "optional auth" đã có sẵn, không cần tạo mới |
| `ErrorCode.EXACTLY_ONE_SOURCE_REQUIRED` | **Chưa tồn tại** trong `error-codes.ts` — REST API Spec §5.4 đã đặt tên chính xác (`422 EXACTLY_ONE_SOURCE_REQUIRED`), cần thêm 1 giá trị enum |
| `assertOwnership` (birth-profile) | Module-internal, **không** export qua `birth-profile/index.ts` — Chart module không thể tái sử dụng trực tiếp (đã verify qua đọc `birth-profile/index.ts`), cần `assertChartOwnership` riêng (đúng yêu cầu prompt Mục 11) |

---

## 3. Source-of-Truth Documents

| Tài liệu | Vai trò trong M6 |
|---|---|
| REST API Specification §3, §4.4, §5.4, §9 | Auth matrix, 4 endpoint contract, DTO shape, rate limit — đã đọc trực tiếp |
| Natal Chart Domain Specification §7, §11, §35 | Pipeline order, Unknown Birth Time D-9, Conflict #2 (đã RESOLVED từ trước — Chart module đọc qua Use Case) |
| Sprint 3 Backend Implementation Plan | Không có section "Milestone 6" chi tiết như M1-M4 (giống tình trạng đã gặp ở M5) — REST API Spec + code thật M1-M5 đóng vai trò nguồn chính |
| Code thật M1–M5 | `ChartBuilder`, `IChartRepository`, `GetBirthProfileSnapshotUseCase`, `composition-root.ts`, `birth-profile` use case pattern (Get/List/Delete) — **authoritative cho implementation reality** |
| Coding Standards & Conventions | Naming, testing convention |

---

## 4. Architectural Context

```
Presentation (M7, chưa tồn tại)
      │  (sẽ import qua chart/index.ts)
      ▼
Application (M6 — file mới hoàn toàn)
      │
      ├──▶ birth-profile/index.ts (module-root, M4) ──▶ GetBirthProfileSnapshotUseCase
      ├──▶ chart/domain/engine/chart-builder.ts (M3) ──▶ ChartBuilder
      └──▶ chart/domain/ports/chart-repository.port.ts (M1) ──▶ IChartRepository (impl: PrismaChartRepository, M5)
```

**Allowed dependencies (Application layer M6):** `chart/domain/*` (entities, VO, ports, errors — cùng module, không qua module-root), `birth-profile/index.ts` (module-root, cross-module), `shared/errors/*`, `shared/logger/*` (nếu cần).

**Forbidden dependencies:** `express` (Request/Response/HTTP status), `@prisma/client`/`PrismaClient`, `swisseph-wasm`, `chart/infrastructure/*` (Adapter/Repository/Mapper — chỉ được truyền vào qua constructor injection dưới dạng interface, không import class cụ thể), `birth-profile/domain/*`/`birth-profile/infrastructure/*`/`birth-profile/application/*` trực tiếp (chỉ qua `birth-profile/index.ts`).

**Dependency direction:** Presentation (M7) → Application (M6) → Domain (M1/M3). Application **không** phụ thuộc ngược lên Infrastructure — Infrastructure implement interface Domain định nghĩa, Application chỉ biết interface.

**Cross-module public API boundary:** `chart/index.ts` (mới, M6 tạo) — export 4 Use Case cho M7 tiêu thụ, theo đúng pattern `birth-profile/index.ts` đã có. ESLint `boundaries/dependencies` (đã verify hoạt động đúng từ M4) tự động enforce ranh giới này — không cần thêm rule mới.

---

## 5. Scope

- `chart/application/use-cases/create-natal-chart.usecase.ts`
- `chart/application/use-cases/get-chart.usecase.ts`
- `chart/application/use-cases/list-charts.usecase.ts`
- `chart/application/use-cases/delete-chart.usecase.ts`
- `chart/application/shared/assert-chart-ownership.ts`
- `chart/index.ts` (module-root, mới)
- Bổ sung `ErrorCode.EXACTLY_ONE_SOURCE_REQUIRED` vào `error-codes.ts` (additive, không sửa giá trị cũ)
- Wiring `composition-root.ts`: instantiate `ChartBuilder` lần đầu, instantiate 4 Use Case, expose qua `useCases`
- Unit test cho toàn bộ 4 Use Case + Ownership helper (fake dependencies, không DB thật, không Swiss Ephemeris thật)

## 6. Out of Scope

- Express Controller/Route/Zod Schema/OpenAPI cho `/charts` — **M7**.
- `ChartResponse`/`ChartSummaryResponse` DTO mapping — **M7** (Conflict #2 đã xác nhận).
- `interpretations` — Known Gap, không thuộc M6 (Conflict #1).
- Integration test thật với Postgres/Swiss Ephemeris — **M8**.
- Bất kỳ sửa đổi nào lên `Chart`/`Planet`/`House`/`Angle`/`Aspect`/`Pattern` Entity, `ChartBuilder`, `IChartRepository`, `PrismaChartRepository`, `GetBirthProfileSnapshotUseCase` — tất cả đã đóng, M6 chỉ **tiêu thụ**.
- Migration mới — không cần (Mục 21).
- Redis/cache/background job.
- Admin override ownership — Sprint 3 giữ nguyên **rejected** (REST API Spec Mục 12 xác nhận tường minh).
- Rate limiting implementation — thuộc hạ tầng chung (Mục 9 REST API Spec), không phải việc của Use Case.

---

## 7. Dependency Graph

```
chart-input.validator.ts (M3) ─┐
time-conversion.ts (M3)        ├──▶ ChartBuilder (M3, đã có)
5 Calculator (M3)              ┘         │
                                          ▼
GetBirthProfileSnapshotUseCase (M4) ──▶ CreateNatalChartUseCase ──▶ IChartRepository.save() (M5)
                                          │
                                          ▼
                                    assertChartOwnership (M6, mới) ◄── GetChartUseCase, DeleteChartUseCase
                                          │
IChartRepository.findById/listByUserId/softDelete (M5, đã có) ◄────┘
```

Không có dependency nào quay ngược (Application không phụ thuộc Infrastructure cụ thể, chỉ Port).

---

## 8. Application Layer Design

4 Use Case + 1 shared helper, đúng pattern `birth-profile/application/` đã có (constructor injection nhận Port/Use Case khác, method `execute(command): Promise<Result>`, không static, không side-effect ngoài dependency đã inject).

**Không có "Application Service" trung gian nào khác** — `CreateNatalChartUseCase` tự orchestrate trực tiếp `GetBirthProfileSnapshotUseCase` + `ChartBuilder` + `IChartRepository`, không qua lớp facade thừa (đúng nguyên tắc dự án: Use Case là đơn vị orchestration nhỏ nhất, không thêm tầng trừu tượng không cần thiết — Critical Rule 14/15).

---

## 9. Use Case Specifications

### 9.1 `CreateNatalChartUseCase`

```typescript
export interface CreateNatalChartCommand {
  requestingUserId: string | null;       // null = Guest
  birthProfileId?: string;               // XOR với birthData
  birthData?: {                          // shape khớp EngineInputBirthData, KHÔNG có fullName/placeName
    birthDate: Date;
    birthTime: { hour: number; minute: number; second: number } | null;
    isBirthTimeKnown: boolean;
    latitude: number;
    longitude: number;
    timezoneId: string;
  };
  houseSystem: HouseSystem;
  includeOptionalPoints: PlanetName[];
  save: boolean;
}

export class CreateNatalChartUseCase {
  constructor(
    private readonly getBirthProfileSnapshotUseCase: GetBirthProfileSnapshotUseCase,
    private readonly chartBuilder: ChartBuilder,
    private readonly chartRepository: IChartRepository,
  ) {}

  async execute(command: CreateNatalChartCommand): Promise<Chart>;
}
```

**Control flow (đúng thứ tự, mỗi bước có lý do cụ thể):**

1. **Input-mode invariant** (`birthProfileId XOR birthData`): kiểm tra `!!command.birthProfileId !== !!command.birthData` — nếu vi phạm (cả 2 hoặc không cái nào) → `throw new ValidationError(ErrorCode.EXACTLY_ONE_SOURCE_REQUIRED, ...)`. **Đặt đầu tiên**, trước mọi side-effect, vì đây là lỗi input thuần túy không cần biết gì về auth/DB.
2. **Guest + `birthProfileId` guard (CONFIRMED, OQ-1):** nếu `command.birthProfileId && command.requestingUserId === null` → `throw new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Guest cannot use a saved BirthProfile; provide birthData inline')`. **Đặt trước khi gọi `GetBirthProfileSnapshotUseCase`** — Guest chỉ được phép tính Chart bằng `birthData` inline; `birthProfileId` luôn đòi hỏi authenticated owner context. Đây là quyết định tường minh (không phải hệ quả ngầm của `assertOwnership` từ chối `''`) — sau bước này, nhánh `birthProfileId` **được đảm bảo** `command.requestingUserId` khác `null`.
3. **Guest + `save=true` guard**: nếu `command.requestingUserId === null && command.save === true` → `throw new AuthenticationError(ErrorCode.UNAUTHORIZED, ...)`. Đặt **trước** khi gọi bất kỳ dependency tốn kém nào (Engine calculation) — fail nhanh.
4. **Resolve birth data:**
   - Nếu `birthProfileId` được cung cấp: gọi `getBirthProfileSnapshotUseCase.execute({birthProfileId: command.birthProfileId, requestingUserId: command.requestingUserId})` — **truyền thẳng, không `?? ''`** (đã đảm bảo non-null từ bước 2, CONFIRMED). Kết quả `BirthDataSnapshot` (đã có `fullName`/`placeName` từ M5-T00) → build `EngineInputBirthData` bằng cách giữ nguyên toàn bộ field.
   - Nếu `birthData` inline được cung cấp: build `EngineInputBirthData` trực tiếp từ input, **`fullName: null`, `placeName` từ input** (bắt buộc, kế thừa validation `CreateBirthProfileRequest` — đã xác nhận ở OQ-2, không còn treo).
   - **Không** tự tạo/lưu `BirthProfile` nào trong nhánh inline (đúng yêu cầu prompt Mục 5.1.6).
5. **Build `EngineInput`**: `EngineInput.create(birthData, {houseSystem: command.houseSystem, includeOptionalPoints: command.includeOptionalPoints, chartType: ChartType.Natal})`.
6. **Invoke `ChartBuilder`**: `chartBuilder.build({id: randomUUID(), userId: command.requestingUserId, birthProfileId: command.birthProfileId ?? null, engineInput})` — **`userId` truyền thẳng `command.requestingUserId`** (có thể `null` cho Guest+save=false, hợp lệ vì `Chart.userId: string | null`, INV cho phép `null` khi `save=false`/transient — đã xác nhận từ M3 Mục 6).
7. Nhận `Chart` đã build (đầy đủ Planet/House/Angle/Aspect/Pattern, đã qua toàn bộ validate của M3).
8. **Persistence branch:**
   - `save === false`: **không gọi** `chartRepository.save()` — trả thẳng `Chart` vừa build.
   - `save === true`: gọi `chartRepository.save(chart)` **đúng 1 lần** → trả `Chart` đã lưu (cùng object, vì `save()` không trả giá trị mới — `Chart` đã immutable từ bước 7, không cần re-fetch).
9. **Error propagation:** lỗi từ `GetBirthProfileSnapshotUseCase` (`NotFoundError`/`AuthorizationError`), từ `ChartBuilder`/`Chart.create()` (`InvalidCoordinateError`, `DataIntegrityError`, v.v. — M3), từ `chartRepository.save()` (`InfrastructureError`) — **đều propagate nguyên trạng**, không catch/wrap lại (đúng bài học đã rút ra ở M3: **không** bọc `try/catch` tổng quát nuốt mất error type cụ thể).


### 9.2 `GetChartUseCase`

```typescript
export interface GetChartCommand {
  chartId: string;
  requestingUserId: string;   // luôn có giá trị — route yêu cầu requireAuth() (M7)
}

export class GetChartUseCase {
  constructor(private readonly chartRepository: IChartRepository) {}
  async execute(command: GetChartCommand): Promise<Chart> {
    const chart = await this.chartRepository.findById(command.chartId);
    if (!chart) throw new NotFoundError('Chart not found');
    assertChartOwnership(chart, command.requestingUserId);
    return chart;
  }
}
```

Đúng 1:1 pattern `GetBirthProfileUseCase`/`get-birth-profile-snapshot.usecase.ts` đã có — không phát minh flow mới.

### 9.3 `ListChartsUseCase`

```typescript
export interface ListChartsCommand {
  requestingUserId: string;
  page?: number;
  pageSize?: number;
  birthProfileId?: string;
  sortBy?: 'calculatedAt';
  order?: 'asc' | 'desc';
}

export interface ListChartsResult {
  items: Chart[];
  total: number;
  page: number;
  pageSize: number;
}

export class ListChartsUseCase {
  constructor(private readonly chartRepository: IChartRepository) {}
  async execute(command: ListChartsCommand): Promise<ListChartsResult>;
}
```

**Đúng pattern `ListBirthProfilesUseCase`** (Mục Preface Conflict #2): clamp `pageSize` tối đa 100 (defense-in-depth, đúng convention Sprint 2 M4), default `page=1`, `pageSize=20`, `sortBy='calculatedAt'` (giá trị duy nhất hợp lệ theo `ListChartsOptions`, M1), `order='desc'`. Gọi `chartRepository.listByUserId(command.requestingUserId, options)` — **`requestingUserId` luôn được truyền, đảm bảo cross-user leakage không thể xảy ra ở tầng repository** (Mục 22 Security Review).

### 9.4 `DeleteChartUseCase`

```typescript
export interface DeleteChartCommand {
  chartId: string;
  requestingUserId: string;
}

export class DeleteChartUseCase {
  constructor(private readonly chartRepository: IChartRepository) {}
  async execute(command: DeleteChartCommand): Promise<void> {
    const chart = await this.chartRepository.findById(command.chartId);
    if (!chart) throw new NotFoundError('Chart not found');
    assertChartOwnership(chart, command.requestingUserId);

    const deleted = await this.chartRepository.softDelete(command.chartId, command.requestingUserId);
    if (!deleted) {
      // Race condition: xóa giữa findById và softDelete — coi như not-found để giữ idempotency
      throw new NotFoundError('Chart not found');
    }
  }
}
```

**Đúng 1:1 pattern `DeleteBirthProfileUseCase`** (đã đọc code thật) — kể cả xử lý race-condition giống hệt.

### 9.5 `assertChartOwnership`

```typescript
// chart/application/shared/assert-chart-ownership.ts
export function assertChartOwnership(chart: Chart, requestingUserId: string): void {
  if (chart.userId !== requestingUserId) {
    throw new AuthorizationError(ErrorCode.FORBIDDEN, 'You do not have access to this chart');
  }
}
```

Module-internal (không export qua `chart/index.ts`, đúng convention `birth-profile`'s `assertOwnership` không export). Dùng bởi `GetChartUseCase`, `DeleteChartUseCase`. **`ListChartsUseCase` không cần dùng hàm này** — ownership đã enforce qua tham số `userId` trong `repository.listByUserId()` (lọc tại nguồn, không phải post-filter). **`CreateNatalChartUseCase` không cần dùng hàm này** — không có "chart đã tồn tại" nào để so sánh ownership tại thời điểm tạo mới; guard `save=true` cho Guest (bước 2, Mục 9.1) là kiểm tra authentication, không phải ownership.

**Admin không bypass** — `assertChartOwnership` không có logic role-check nào, so sánh `userId` thuần túy, đúng REST API Spec Mục 12 ("Admin GET/DELETE another user's chart → rejected in Sprint 3").

---

## 10. Input / Validation Rules

| Rule | Tầng thực hiện | Lý do |
|---|---|---|
| `houseSystem` là string hợp lệ (`Placidus`/`WholeSign`) | Zod (M7) **và** lại được validate ở `ChartInputValidator` (M3, Domain — Defense-in-Depth đã thiết kế sẵn) | Không trùng lặp thật — 2 tầng có mục đích khác nhau (M7: UX lỗi sớm; M3: domain invariant không tin tưởng caller) |
| `birthProfileId` là UUID hợp lệ | Zod (M7) | Format-level, không cần Application tự check lại |
| `birthProfileId XOR birthData` | **Application (M6)**, Mục 9.1 bước 1 | Đây là business invariant liên quan 2 field cùng lúc — Zod schema **có thể** biểu diễn được nhưng REST API Spec đặt tên error code `422 EXACTLY_ONE_SOURCE_REQUIRED` ở tầng response, ngụ ý đây là lỗi nghiệp vụ — Use Case phải tự đứng vững độc lập (có thể được gọi từ nơi khác ngoài HTTP) |
| Coordinate/datetime/houseSystem range (khi `birthData` inline) | `ChartInputValidator` (M3, đã có, không đổi) | M6 không tự validate lại range — để `EngineInput.create()`/`ChartBuilder` tự làm, đúng ranh giới đã chốt ở M3 |
| Guest + `save=true` | **Application (M6)** | Đây không phải input hợp lệ/không hợp lệ về format, mà là authorization rule — thuộc Application |

**Ranh giới transport vs application validation:** Zod (M7) chặn **shape/format** (đúng kiểu, đúng enum literal, UUID hợp lệ) trước khi request chạm Application — giảm tải lỗi rác. Application (M6) chặn **business invariant** (quan hệ giữa nhiều field, quyền truy cập, trạng thái hệ thống) mà Zod không biểu diễn được đầy đủ hoặc không nên biết (ownership cần DB lookup, Zod không có DB access).

---

## 11. Authentication & Authorization

| Endpoint (tương lai M7) | Guest | User (owner) | User (không sở hữu) | Admin |
|---|---|---|---|---|
| Create `save=false` | ✅ | ✅ | — | ✅ |
| Create `save=true` | ❌ `401 UNAUTHORIZED` | ✅ | — | ✅ |
| Get | N/A (Chart transient không GET được) | ✅ | ❌ `403 FORBIDDEN` | ❌ `403 FORBIDDEN` |
| List | ❌ `401` (route yêu cầu `requireAuth()`) | ✅ (chỉ chart của mình) | N/A | ✅ (chỉ chart của mình) |
| Delete | N/A | ✅ | ❌ `403` | ❌ `403` |

**Không có mã lỗi mới ngoài `EXACTLY_ONE_SOURCE_REQUIRED`** — `401`/`403`/`404` dùng đúng `AuthenticationError`/`AuthorizationError`/`NotFoundError` đã có.

**Cơ chế "Guest cho phép, User bắt buộc tùy nhánh"** (route `POST /charts/natal`) — đã xác nhận qua đọc `auth.middleware.ts` thật: `authMiddleware` (áp dụng global hoặc theo route, populate `req.user` nếu có Bearer token hợp lệ, **không** throw nếu thiếu) tách biệt khỏi `requireAuth()` (guard riêng). **M7 sẽ áp dụng `authMiddleware` nhưng KHÔNG áp dụng `requireAuth()`** cho route Create — để `req.user` optional tới tận Controller, rồi Controller truyền `requestingUserId: req.user?.userId ?? null` vào Command. M6 không cần tạo middleware mới, chỉ cần đảm bảo `CreateNatalChartCommand.requestingUserId` chấp nhận `null` (Mục 9.1).

---

## 12. Error Handling

| Nhóm | Class | Nguồn |
|---|---|---|
| Validation (`birthProfileId XOR birthData`) | `ValidationError(ErrorCode.EXACTLY_ONE_SOURCE_REQUIRED)` | **Mới** — thêm 1 giá trị enum, tái dùng class `ValidationError` đã có |
| Authentication (Guest save=true) | `AuthenticationError(ErrorCode.UNAUTHORIZED)` | Tái dùng nguyên |
| Authorization/ownership | `AuthorizationError(ErrorCode.FORBIDDEN)` | Tái dùng nguyên, qua `assertChartOwnership` |
| Not found (Chart, BirthProfile) | `NotFoundError` | Tái dùng nguyên — cả Chart-not-found (M6 tự throw) lẫn BirthProfile-not-found (propagate từ M4's Use Case) |
| Repository/persistence failure | `InfrastructureError` | Propagate nguyên trạng từ `PrismaChartRepository` (M5) |
| ChartBuilder/Engine failure | `InvalidCoordinateError`/`InvalidDateTimeError`/`UnsupportedHouseSystemError`/`DataIntegrityError`/`ChartCalculationFailed`/`UnresolvableTimezoneError` (M3) | Propagate nguyên trạng — **không** bọc lại (đúng bài học M3's Bug #2 đã sửa) |
| BirthProfile retrieval failure | `NotFoundError`/`AuthorizationError` (từ M4's `GetBirthProfileSnapshotUseCase`) | Propagate nguyên trạng |
| Unexpected | Không catch-all nào ở M6 — để lỗi tự nhiên propagate lên Presentation's error-handler middleware (đã có, xử lý theo `instanceof AppError`/generic) |

**Không tạo cơ chế error-handling thứ 2** — toàn bộ dùng chung `shared/errors/app-error.ts` + `error-handler.middleware.ts` đã có từ Sprint 1.

---

## 13. DTO / Mapping Strategy

Theo Conflict #2 đã resolve (Preface): **M6 không có DTO Output riêng** — `CreateNatalChartUseCase`/`GetChartUseCase` trả thẳng `Chart` domain entity; `ListChartsUseCase` trả `{items: Chart[], total, page, pageSize}`; `DeleteChartUseCase` trả `void`. Command interface (Input) của mỗi Use Case đóng vai trò "Application DTO" duy nhất cần thiết — không thêm mapper class riêng nào.

**Không leak gì cần chặn ở M6** vì M6 hoàn toàn không chạm `ChartResponse`/`ChartSummaryResponse`/Prisma model nào — `Chart` domain entity vốn đã immutable, đã tách biệt khỏi Prisma từ M5 (Mapper).

---

## 14. Persistence Semantics

Đúng Mục 17/18 của prompt, xác nhận bằng code thật (Mục 9.1):

```
save=true:  build EngineInput → ChartBuilder.build() → Chart (immutable) → chartRepository.save(chart) [gọi đúng 1 lần] → trả Chart
save=false: build EngineInput → ChartBuilder.build() → Chart (immutable) → trả thẳng, KHÔNG gọi save()
```

`chartRepository.save()` không bao giờ được gọi trong nhánh `save=false` — verify bằng test (Mục 18, "should not persist"). Không cần transaction abstraction mới ở M6 — `PrismaChartRepository.save()` (M5) đã tự transactional nội bộ, Application chỉ gọi 1 lần, không cần biết chi tiết bên trong.

**Snapshot Immutability:** `Chart` sau khi build **không bao giờ** bị mutate hay build lại — `GetChartUseCase` chỉ đọc (`findById`), không có `UpdateChartUseCase` nào tồn tại hoặc được tạo ở M6 (đúng — `IChartRepository` không có method `update`, Chart immutable, không cần lặp lại quyết định này).

---

## 15. Dependency Injection

`composition-root.ts` (sửa, thêm vào block `--- Chart Module ---` đã có):

```typescript
// Sau dòng "const ephemerisProvider = new SwissEphemerisAdapter(swissEph);" đã có
const chartBuilder = new ChartBuilder(ephemerisProvider);

const createNatalChartUseCase = new CreateNatalChartUseCase(
  getBirthProfileSnapshotUseCase,   // đã có sẵn từ block Birth Profile Module
  chartBuilder,
  chartRepository,                   // đã có sẵn từ block Chart Module
);
const getChartUseCase = new GetChartUseCase(chartRepository);
const listChartsUseCase = new ListChartsUseCase(chartRepository);
const deleteChartUseCase = new DeleteChartUseCase(chartRepository);
```

Thêm vào object `useCases` trả về (đã có pattern `getBirthProfileSnapshotUseCase` sẵn trong đó): `createNatalChartUseCase, getChartUseCase, listChartsUseCase, deleteChartUseCase`.

**Không** instantiate `PrismaClient`/`ChartRepository`/`SwissEphemerisAdapter` mới trong bất kỳ Use Case nào — toàn bộ tái dùng instance đã có sẵn trong `composition-root.ts` (đã verify: `chartRepository`, `ephemerisProvider` đã tồn tại trước M6, chỉ `chartBuilder` là mới).

---

## 16. File Structure

```
backend/src/modules/chart/
├── application/                                    ← MỚI hoàn toàn
│   ├── shared/
│   │   └── assert-chart-ownership.ts               ← MỚI
│   └── use-cases/
│       ├── create-natal-chart.usecase.ts           ← MỚI
│       ├── get-chart.usecase.ts                    ← MỚI
│       ├── list-charts.usecase.ts                  ← MỚI
│       └── delete-chart.usecase.ts                 ← MỚI
├── index.ts                                        ← MỚI (module-root)
├── domain/                                          (không đổi, M1/M3)
└── infrastructure/                                  (không đổi, M2/M5)
```

| File | Purpose | Dependencies | Public API | Invariant | Test |
|---|---|---|---|---|---|
| `create-natal-chart.usecase.ts` | Orchestrate toàn bộ pipeline tạo Chart | `GetBirthProfileSnapshotUseCase`, `ChartBuilder`, `IChartRepository` | `CreateNatalChartUseCase`, `CreateNatalChartCommand` | `birthProfileId XOR birthData`; Guest không `save=true`; `save()` gọi đúng 0 hoặc 1 lần | `create-natal-chart.usecase.test.ts` |
| `get-chart.usecase.ts` | Đọc 1 Chart, enforce ownership | `IChartRepository`, `assertChartOwnership` | `GetChartUseCase`, `GetChartCommand` | Không trả Chart của user khác | `get-chart.usecase.test.ts` |
| `list-charts.usecase.ts` | Liệt kê Chart của user | `IChartRepository` | `ListChartsUseCase`, `ListChartsCommand`, `ListChartsResult` | Luôn lọc theo `requestingUserId` tại nguồn | `list-charts.usecase.test.ts` |
| `delete-chart.usecase.ts` | Soft-delete 1 Chart | `IChartRepository`, `assertChartOwnership` | `DeleteChartUseCase`, `DeleteChartCommand` | Idempotent theo not-found | `delete-chart.usecase.test.ts` |
| `assert-chart-ownership.ts` | Helper thuần | `Chart` entity, `AuthorizationError` | `assertChartOwnership` (module-internal) | Không role-check, chỉ so `userId` | Cover gián tiếp qua Get/Delete test |
| `chart/index.ts` | Module-root, entry point cho M7 | 4 Use Case | Export đúng 4 class + Command/Result type liên quan | Không export Entity/Port/Repository | Không cần test riêng (chỉ re-export) |

---

## 17. Detailed Implementation Tasks

**M6-T1 — Application DTO / Contract Verification**
- Objective: Xác nhận lại (không tạo mới) shape `ChartBuilderInput`, `EngineInputBirthData`, `BirthDataSnapshot`, `IChartRepository`, `ListChartsOptions` khớp đúng những gì Use Case cần — phát hiện sớm nếu có lệch trước khi code.
- Files: Không tạo file, chỉ đọc + ghi chú nếu có lệch (không phát hiện lệch nào trong quá trình viết plan này — Mục 2 đã xác nhận).
- Dependencies: Không.
- Tests: Không.

**M6-T2 — Ownership Assertion**
- Objective: `assertChartOwnership` (Mục 9.5).
- Files: `chart/application/shared/assert-chart-ownership.ts`.
- Dependencies: `Chart` entity (M1), `AuthorizationError`/`ErrorCode` (shared).
- Tests: Cover trực tiếp trong test của `GetChartUseCase`/`DeleteChartUseCase` (không cần file test riêng, đúng pattern `birth-profile`'s `assertOwnership` không có test riêng).

**M6-T3 — CreateNatalChartUseCase**
- Objective: Implement đúng Mục 9.1.
- Files: `create-natal-chart.usecase.ts`, thêm `EXACTLY_ONE_SOURCE_REQUIRED` vào `error-codes.ts`.
- Dependencies: M6-T1.
- Tests: Toàn bộ nhóm ở Mục 18.1.

**M6-T4 — GetChartUseCase**
- Files: `get-chart.usecase.ts`.
- Dependencies: M6-T2.
- Tests: Mục 18.2.

**M6-T5 — ListChartsUseCase**
- Files: `list-charts.usecase.ts`.
- Dependencies: M6-T1.
- Tests: Mục 18.3.

**M6-T6 — DeleteChartUseCase**
- Files: `delete-chart.usecase.ts`.
- Dependencies: M6-T2.
- Tests: Mục 18.4.

**M6-T7 — Dependency Injection / Composition Root Wiring + module-root**
- Files: `composition-root.ts` (sửa), `chart/index.ts` (mới).
- Dependencies: M6-T3 đến M6-T6.
- Tests: `tsc --noEmit` + `npm run lint` (boundary rule tự verify `chart/index.ts` export đúng).

**M6-T8 — Unit Test Completion & Review**
- Objective: Chạy toàn bộ test M6 + full backend, lint, typecheck.
- Files: Không tạo mới.
- Dependencies: M6-T1 đến M6-T7.

---

## 18. Unit Testing Plan

Toàn bộ dùng **Fake** (implement interface thật, không mock library) theo đúng convention đã dùng xuyên suốt M3 — `FakeChartRepository implements IChartRepository`, mock `GetBirthProfileSnapshotUseCase`/`ChartBuilder` qua `vi.fn()` (đúng mức độ M3/M4 đã dùng).

### 18.1 `CreateNatalChartUseCase`

| Test case | Nhóm |
|---|---|
| `birthProfileId` only → dùng snapshot | Input |
| `birthData` inline only → dùng trực tiếp | Input |
| Cả 2 → `ValidationError(EXACTLY_ONE_SOURCE_REQUIRED)` | Input |
| Không cái nào → `ValidationError(EXACTLY_ONE_SOURCE_REQUIRED)` | Input |
| Guest + `save=false` → cho phép | Auth |
| Guest + `save=true` → `AuthenticationError` | Auth |
| Guest + `birthProfileId` (bất kể `save`) → `AuthenticationError`, **không gọi `GetBirthProfileSnapshotUseCase`** (verify `toHaveBeenCalledTimes(0)`) | Auth |
| Authenticated + `save=false`/`save=true` → cho phép cả 2 | Auth |
| BirthProfile hợp lệ, đúng chủ | BirthProfile |
| BirthProfile not found → propagate `NotFoundError` | BirthProfile |
| BirthProfile thuộc user khác → propagate `AuthorizationError` | BirthProfile |
| `GetBirthProfileSnapshotUseCase` throw lỗi khác → propagate nguyên trạng | BirthProfile |
| `ChartBuilder.build()` được gọi với input đúng (verify qua spy) | Chart calculation |
| `ChartBuilder.build()` throw → propagate nguyên trạng, không wrap | Chart calculation |
| `save=false` → `chartRepository.save()` **không được gọi** (verify `toHaveBeenCalledTimes(0)`) | Persistence |
| `save=true` → `chartRepository.save()` gọi **đúng 1 lần** | Persistence |
| `chartRepository.save()` throw → propagate `InfrastructureError` | Persistence |
| Trả đúng `Chart` đã build (không `save`) | Result |
| Trả đúng `Chart` đã lưu (có `save`) | Result |
| `isBirthTimeKnown=false` → `Chart.houses=[]`/`angles=[]` (verify hành vi M3 không bị M6 phá) | Unknown Birth Time |

### 18.2 `GetChartUseCase`

Own Chart found; not found → `NotFoundError`; Chart của user khác → `AuthorizationError`; **Admin truy cập Chart user khác → vẫn `AuthorizationError`** (verify tường minh không có bypass); repository failure → propagate; `assertChartOwnership` được gọi đúng.

### 18.3 `DeleteChartUseCase`

Delete own Chart → success; not found → `NotFoundError`; Chart user khác → `AuthorizationError`, **không gọi `softDelete`**; Admin cross-user → `AuthorizationError`; race-condition (`softDelete` trả `false` dù `findById` trước đó thấy) → `NotFoundError`; repository failure → propagate; kết quả thành công trả `void`.

### 18.4 `ListChartsUseCase`

**Pagination:** page 1; page giữa; page cuối; rỗng; page vượt quá total; `pageSize` biên (clamp >100 → 100, giống `ListBirthProfilesUseCase`).
**Filtering:** không filter; filter theo `birthProfileId`; filter không khớp gì → rỗng; **filter không được làm lộ Chart của user khác** (test riêng: Fake Repository chứa Chart của 2 user, verify chỉ đúng `requestingUserId` được trả).
**Sorting:** `calculatedAt` asc/desc.
**Ownership:** Fake Repository chứa Chart nhiều user → verify tuyệt đối không có Chart nào ngoài `requestingUserId` xuất hiện trong `items` (test bắt buộc theo Mục 24 prompt).
**Response shape:** `items`, `total`, `page`, `pageSize` đúng — **không** test `totalPages`/`ChartSummaryResponse` mapping (thuộc M7, Conflict #2).

**Test Philosophy:** theo đúng Coding Standards — ưu tiên business behavior/authorization/branch/edge-case/failure mode, không chạy theo % coverage áp đặt.

---

## 19. Integration Boundary with M8

```
M6 unit test = UseCase + Fake dependencies (không DB thật, không Swiss Ephemeris thật, không HTTP)
M8 integration test (tương lai) = HTTP → M7 Controller → M6 UseCase → M4 BirthProfile → M3 Engine → M2 Swiss Ephemeris thật → M5 Repository → Postgres thật
```

M6 **không** viết integration test nào chạm Postgres/Swiss Ephemeris thật — đúng Critical Rule 18. `FakeEphemerisProvider`-style đã có sẵn từ M3 (`chart-builder.test.ts` đã dùng) — M6 tái sử dụng đúng pattern đó, không phát minh lại.

---

## 20. OpenAPI Impact

> **Không có thay đổi OpenAPI contract ở M6.** M6 implement Application layer đứng sau REST contract đã đóng băng (REST API Specification §4.4, §5.4) — Controller/Route/Zod Schema/OpenAPI generation là **M7**, chưa tồn tại. M6 không tạo, không sửa bất kỳ file OpenAPI/Zod schema nào.

---

## 21. Database Impact

**Không cần migration mới** — đã verify trực tiếp `IChartRepository`/`ListChartsOptions` (M1, M5): đủ 4 method + đủ field filter/sort/pagination mà M6 cần (`page`, `pageSize`, `birthProfileId`, `sortBy: 'calculatedAt'`, `order`). M6 chỉ **gọi** các method đã có, không cần method mới, không cần cột mới, không cần bảng mới.

**Lưu ý riêng (không phải migration cần cho M6, chỉ ghi nhận):** Conflict #2 (Preface) đã xác nhận `ChartSummaryResponse.birthProfileLabel` không có cột lưu trữ nào — nếu M7 sau này quyết định cần "denormalize" thật sự (thay vì live-lookup), đó sẽ là 1 migration bổ sung thuộc **M7's scope**, không phải M6.

---

## 22. Security Review

| Hạng mục | Đánh giá |
|---|---|
| Authentication | Guest được phép `save=false`; `save=true` bắt buộc `requestingUserId≠null`, enforce ở Application (không tin route middleware một mình) |
| Authorization | `assertChartOwnership` so sánh `userId` thuần túy, không role-check → Admin **không** bypass (đúng REST API Spec Mục 12) |
| Ownership | `GetChartUseCase`/`DeleteChartUseCase` luôn `findById` rồi `assertChartOwnership` — không có đường tắt nào bỏ qua bước này |
| IDOR prevention | `chartId` là UUID (không tuần tự đoán được), + ownership check chặn truy cập chéo dù đoán đúng UUID |
| Guest save restriction | Verify bằng test tường minh (Mục 18.1) |
| Cross-user list leakage | `listByUserId(requestingUserId, ...)` lọc tại nguồn DB (M5 `WHERE user_id = ...`), không phải post-filter ở Application — **an toàn theo thiết kế**, test riêng xác nhận (Mục 18.4) |
| Repository filtering | Đã enforce ở M5, M6 chỉ truyền đúng `requestingUserId`, không tự ý bỏ qua |
| Error information leakage | `403` (không phải `404`) khi Chart tồn tại nhưng sai chủ — **đúng chủ đích theo REST API Spec Mục 4.4** (liệt kê cả `403` lẫn `404` riêng biệt cho `GET/DELETE /charts/{id}`), xem OQ-3 |

**`GET /charts` không bao giờ trả Chart của user khác** — đã verify thiết kế (lọc tại Repository, không phải Application post-filter) + có test bắt buộc chứng minh bằng Fake Repository đa-user (Mục 18.4).

---

## 23. Performance Considerations

- **Duplicate BirthProfile lookup:** không xảy ra — `CreateNatalChartUseCase` gọi `GetBirthProfileSnapshotUseCase` đúng 1 lần khi `birthProfileId` được cung cấp.
- **Unnecessary Chart recalculation:** không xảy ra — `GetChartUseCase` chỉ đọc từ `IChartRepository`, không bao giờ gọi lại `ChartBuilder`.
- **List query pagination:** đã có sẵn ở M5 (`skip`/`take`), M6 chỉ truyền tham số đúng, không tự làm lại.
- **Count query efficiency:** `listByUserId` đã dùng `Promise.all([findMany, count])` song song (M5, đã verify) — M6 không cần tối ưu thêm.
- **Unnecessary persistence calls:** `save()` gọi đúng 0 hoặc 1 lần, verify bằng test (Mục 18.1).
- **Không** giới thiệu Redis/cache/background job (Critical Rule 19).

---

## 24. Observability

Theo Pino/logging convention đã có (`defaultLogger`, đã thấy dùng ở `composition-root.ts` cho `swissEph.init` log). M6 chỉ log **sự kiện có ý nghĩa nghiệp vụ**, không log tại mọi bước:

- Log khi `CreateNatalChartUseCase` hoàn tất persist thành công (`save=true`) — mức `info`, chỉ gồm `chartId`, `userId` (không log `birthData`/tọa độ/ngày sinh thật — dữ liệu cá nhân nhạy cảm).
- Log khi ownership check reject (`assertChartOwnership` throw) — mức `warn`, phục vụ phát hiện IDOR attempt, chỉ gồm `chartId`, `requestingUserId` (không log gì khác).
- **Không** log passwords/tokens (không liên quan M6), **không** log toàn bộ `birthData`/`EngineInput` (dữ liệu sinh nhạy cảm — chỉ log ID tham chiếu).
- **Không** thêm log ở mọi bước trong control flow (Critical constraint của prompt Mục 33).

---

## 25. Known Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| `CreateNatalChartCommand.requestingUserId: string \| null` là type mới chưa từng xuất hiện ở bất kỳ Use Case nào trước đây (toàn bộ `birth-profile` Use Case đều bắt buộc `userId: string`) | Trung bình | Thấp | Test tường minh cả 2 nhánh (`null`/có giá trị), code review kỹ điểm này vì dễ quên check `null` |
| Quên guard "Guest + `birthProfileId`" khiến Guest vô tình gọi `GetBirthProfileSnapshotUseCase` với `requestingUserId` không hợp lệ | Trung bình | Thấp (đã có bước riêng, thứ tự rõ — Mục 9.1 bước 2, CONFIRMED) | Test `should throw AuthenticationError for Guest + birthProfileId` bắt buộc, verify `GetBirthProfileSnapshotUseCase` không được gọi |
| Quên guard "Guest + save=true" khiến Chart được lưu với `userId=null` | Cao | Thấp (đã có bước riêng, thứ tự rõ — Mục 9.1 bước 3) | Test `should throw AuthenticationError for Guest + save=true` là bắt buộc, không được bỏ qua |
| `EngineInputBirthData` cho nhánh inline thiếu `placeName` hợp lệ khi `save=true` | ~~Cao~~ Đã mitigated | Rất thấp | Zod (M7) kế thừa validation `CreateBirthProfileRequest` — đã xác nhận `placeName` bắt buộc từ gốc (OQ-2, resolved) |
| Nhầm lẫn `ListChartsUseCase` trả domain entity thô (theo Conflict #2) khiến ai đó ở M7 giả định nhầm nó đã là `ChartSummaryResponse` | Trung bình | Thấp (đã ghi rất rõ ở Preface + Mục 13) | Comment rõ trong code + Mục 14/Preface handoff cho M7 |
| Test dùng Fake không phản ánh đúng hành vi thật của `ChartBuilder`/`GetBirthProfileSnapshotUseCase` (Fake quá đơn giản, che giấu bug thật) | Trung bình | Thấp | Fake implement đúng interface, trả dữ liệu đủ thực tế, tham khảo Fake đã dùng ở `chart-builder.test.ts` (M3) |
| `chart/index.ts` export thiếu hoặc thừa, vi phạm boundary khi M7 bắt đầu | Thấp | Thấp | ESLint `boundaries` đã verify hoạt động đúng từ M4, tự động chặn nếu export sai |

---

## 26. Open Questions

### OQ-1 — `GetBirthProfileSnapshotUseCase` yêu cầu `requestingUserId: string`, nhưng Guest có `requestingUserId=null` — ✅ RESOLVED (Confirmation.md)

**Quyết định CONFIRMED:** Guest **chỉ được phép** tính Chart bằng `birthData` inline. `birthProfileId` **luôn đòi hỏi authenticated owner context** — không có ngoại lệ. **Không** truyền `''`/giá trị giả để thỏa type — M6 **phải reject Guest tường minh trước khi gọi `GetBirthProfileSnapshotUseCase`**, không dựa vào `assertOwnership` (M4) tự nhiên từ chối một chuỗi rỗng.

**Thực thi:** Guard riêng, đặt ngay sau XOR check (Mục 9.1 bước 2, CONFIRMED): `if (command.birthProfileId && command.requestingUserId === null) throw new AuthenticationError(ErrorCode.UNAUTHORIZED, 'Guest cannot use a saved BirthProfile; provide birthData inline')`. Sau bước này, nhánh gọi `GetBirthProfileSnapshotUseCase` được đảm bảo `requestingUserId` khác `null`, truyền thẳng không cần `?? ''`.

**Không còn Open Question nào treo ở M6.**

### OQ-2 — Nhánh `birthData` inline: `snapshot_place_name` NOT NULL — đã xác nhận `placeName` bắt buộc ở nguồn gốc Sprint 2

**Đã verify trực tiếp** `BirthLocation.create()` (Sprint 2, `birth-profile/domain/value-objects/birth-location.vo.ts`): `placeName` là tham số bắt buộc, reject rỗng/whitespace (`InvalidBirthLocationError`). Vì `CreateNatalChartRequest.birthData` được REST API Spec §5.4 mô tả là *"`CreateBirthProfileRequest`-like"* — cùng validation gốc, nên `placeName` **đã có nguồn bắt buộc từ tầng Zod (M7)** kế thừa đúng schema `CreateBirthProfileRequest` (§5.2) đã có sẵn.

**Kết luận: không còn Open Question** — `CreateNatalChartUseCase` (M6) không cần tự thêm validation nào cho `placeName` ở nhánh inline; nếu thiếu, Zod (M7) sẽ chặn trước khi tới Application, đúng đúng ranh giới đã mô tả ở Mục 10. Rủi ro NOT NULL violation ở `chartRepository.save()` chỉ có thể xảy ra nếu M7 viết sai Zod schema (không đúng kế thừa `CreateBirthProfileRequest`) — đây là rủi ro của M7, ghi nhận ở Mục 25 Risk table, không cần Application-level guard trùng lặp ở M6 (đúng nguyên tắc "không trùng lặp validation" Mục 10).

**Priority:** Đã resolve, không còn treo.

### OQ-3 — `GetChartUseCase`/`DeleteChartUseCase` trả `403` hay `404` khi Chart tồn tại nhưng thuộc user khác? (đã tự resolve, chỉ xác nhận)

**Question:** Thiết kế Mục 9.2/9.4 trả `403` khi Chart tồn tại nhưng sai chủ (không đồng nhất về `404` như 1 số best-practice OWASP khuyến nghị).

**Why it matters:** REST API Spec Mục 4.4 liệt kê rõ cả `403` lẫn `404` riêng biệt cho `GET/DELETE /charts/{id}` — ngụ ý spec đã chủ đích chọn `403` cho case sai chủ, không phải oversight.

**Recommendation:** Giữ nguyên thiết kế hiện tại — đúng theo REST API Spec đã đóng băng, không phải lỗ hổng cần vá.

**Priority:** Rất thấp — chỉ xác nhận.

**Decision deadline:** Không cần — đã resolve trong chính mục này.

---

## 27. Acceptance Criteria

Giữ nguyên đúng 8 AC đã đóng băng ở prompt Mục 38, xác nhận từng cái đã được thiết kế đáp ứng ở đâu trong plan này:

1. `CreateNatalChartUseCase` xử lý đúng `save=true`/`save=false` — Mục 9.1 bước 7, test Mục 18.1.
2. `birthProfileId XOR birthData` — Mục 9.1 bước 1, test Mục 18.1.
3. `GetChartUseCase`/`DeleteChartUseCase` enforce ownership — Mục 9.2/9.4, `assertChartOwnership` Mục 9.5.
4. Guest `save=false` allowed / `save=true` rejected, đúng 401/403 semantics có sẵn — Mục 9.1 bước 2, Mục 11.
5. `ListChartsUseCase` — **đã điều chỉnh theo Conflict #2**: trả `{items: Chart[], total, page, pageSize}` thay vì `PaginatedResponse<ChartSummaryResponse>` trực tiếp (DTO mapping thuộc M7) — hỗ trợ đầy đủ `page`/`pageSize`/`birthProfileId`/`sortBy=calculatedAt`/`order` ở tầng Command/Repository.
6. `ListChartsUseCase` chỉ trả Chart của `requestingUserId` — Mục 9.3, test Mục 18.4.
7. Toàn bộ unit test M6 dùng fake/mock — Mục 18, 19.
8. Không cần Swiss Ephemeris integration test thật ở M6 (thuộc M8) — Mục 19.

---

## 28. Definition of Done

Giữ nguyên checklist đã đóng băng ở prompt Mục 37, đối chiếu plan này:

### Application
- [ ] `CreateNatalChartUseCase`, `GetChartUseCase`, `ListChartsUseCase`, `DeleteChartUseCase` hoàn chỉnh.
- [ ] `assertChartOwnership` hoàn chỉnh, dùng nhất quán ở Get/Delete.
- [ ] Toàn bộ dependency injected qua constructor, không tự khởi tạo bên trong Use Case.
- [ ] Không import `chart/infrastructure/*` cụ thể hay `birth-profile/domain|application|infrastructure/*` trực tiếp trong bất kỳ Use Case nào (chỉ qua `birth-profile/index.ts`).

### Create
- [ ] `birthProfileId XOR birthData` enforce đúng.
- [ ] BirthProfile snapshot path hoạt động (dùng `GetBirthProfileSnapshotUseCase` nguyên trạng).
- [ ] Inline `birthData` path hoạt động, không tự tạo/lưu BirthProfile.
- [ ] `save=false`/`save=true` hoạt động đúng.
- [ ] Guest save restriction hoạt động.
- [ ] Unknown Birth Time semantics giữ nguyên (không đổi gì ở M3, chỉ truyền qua).
- [ ] Không có persistence side-effect nào khi `save=false` (test verify `toHaveBeenCalledTimes(0)`).

### Read/Delete
- [ ] Ownership enforce đúng cả 2 Use Case.
- [ ] Admin không bypass (test tường minh).
- [ ] Not-found behavior đúng (`404` khi thực sự không tồn tại).
- [ ] Soft-delete semantics giữ nguyên từ M5, không đổi.

### List
- [ ] Pagination/`page`/`pageSize`/`birthProfileId`/`sortBy=calculatedAt`/`order` hoạt động đúng.
- [ ] `total` đúng.
- [ ] Cross-user data không rò rỉ (test đa-user bắt buộc).
- [ ] **Không** có `ChartSummaryResponse` mapping ở M6 (theo Conflict #2 — khác văn phong gốc của DoD checklist prompt, đã điều chỉnh có căn cứ).

### Tests
- [ ] Toàn bộ unit test Mục 18 pass.
- [ ] Critical branch (auth, ownership, persistence side-effect) đều có test.
- [ ] Fake dependencies, không DB/Swiss Ephemeris thật.

### Infrastructure
- [ ] `npm run lint` pass (boundary rule không bị vi phạm).
- [ ] `tsc --noEmit` pass.
- [ ] CI hiện có pass.
- [ ] Không có migration mới (Mục 21).

---

## 29. Execution Order

1. **OQ-1, OQ-2, OQ-3 đều đã resolve** (Mục 26) — không còn bước xác nhận riêng nào cần làm trước khi code.
2. M6-T2 (Ownership helper) — độc lập, làm trước để M6-T4/T6 có sẵn dùng.
3. M6-T3 (CreateNatalChartUseCase) — phức tạp nhất, nên làm sớm để phát hiện vấn đề tích hợp thật (ChartBuilder/GetBirthProfileSnapshotUseCase) sớm nhất.
4. M6-T4, M6-T5, M6-T6 — có thể song song (độc lập nhau, đều chỉ phụ thuộc `IChartRepository` + M6-T2).
5. M6-T7 (DI wiring + module-root) — sau khi cả 4 Use Case tồn tại.
6. M6-T8 (Review tổng thể) — cuối cùng, đúng thói quen dự án (M3-T9/M4-T5/M5 review pattern) — `lint`/`typecheck`/`test`/`build` toàn backend, không chỉ scope `chart`.

---

## 30. Final Implementation Checklist

- [x] Không redesign kiến trúc đã đóng băng (Preface Conflict #1/#2 đều **báo cáo**, không tự sửa spec).
- [x] Không redesign Chart domain model — 0 file `chart/domain/` bị đổi.
- [x] Không redesign Swiss Ephemeris integration — 0 file `chart/infrastructure/adapters/` bị đổi.
- [x] Không bypass `ChartBuilder`/Engine — `CreateNatalChartUseCase` luôn gọi qua `ChartBuilder.build()`.
- [x] Không truy cập Prisma trực tiếp trong Application — chỉ qua `IChartRepository`.
- [x] Không truy cập Swiss Ephemeris trực tiếp — chỉ qua `ChartBuilder` (đã đóng gói `IEphemerisProvider`).
- [x] Không có HTTP concern trong Application layer — 0 import `express` ở bất kỳ file M6 nào.
- [x] Không làm yếu ownership cho Admin — `assertChartOwnership` không role-check.
- [x] `GET /charts` không optional — `ListChartsUseCase` là 1 trong 4 Use Case bắt buộc của M6.
- [x] Không bỏ pagination/filter/sort khỏi `ListChartsUseCase`.
- [x] Không persist khi `save=false` — test bắt buộc verify.
- [x] Không cho Guest `save=true`.
- [x] Không rò rỉ Chart của user khác — lọc tại Repository + test đa-user.
- [x] Mọi pattern mới (`requestingUserId: string | null`) đã gọi tên tường minh là điểm mới, không âm thầm (Mục 25 Risk).
- [x] Không tạo interface trùng lặp — tái dùng nguyên `IChartRepository`/`GetBirthProfileSnapshotUseCase`/`ChartBuilder`.
- [x] Không trùng lặp validation không cần thiết (Mục 10 giải thích rõ ranh giới Zod vs Application).
- [x] Không dùng % coverage làm tiêu chí duy nhất (Mục 18 Test Philosophy).
- [x] Không đẩy trách nhiệm M8 vào M6 (Mục 19).
- [x] Không giới thiệu Redis/cache/background job.
- [x] Không âm thầm giải quyết discrepancy — 2 Conflict + 3 Open Question đều trình bày tường minh, có lý do, có recommendation.
- [x] Dùng đúng file path/tên/interface/DI convention thật của M1–M5 (Mục 2, 16 đối chiếu trực tiếp code).
