# Sprint 3 Backend — Milestone 7 Implementation Plan

## Presentation Layer

---

## Specification/Implementation Discrepancies (đọc trước, quyết định ảnh hưởng toàn bộ plan)

Theo đúng Rule 19 (Source-of-Truth Priority) — 3 discrepancy thật đã phát hiện qua đối chiếu trực tiếp code M1–M6 với REST API Specification. Không silently resolve — trình bày rõ, phân loại, và quyết định phạm vi M7.

### D-1 — [BLOCKING DEFECT, phát hiện từ M6] Chart Domain errors không có tầng dịch sang `AppError`

**Phát hiện:** `mapErrorToProblemDetails` (shared, `problem-details.ts`) chỉ nhận diện lỗi qua `error instanceof AppError` — nếu không phải, wrap generic thành `InfrastructureError` → **500** bất kể bản chất thật của lỗi. `birth-profile` module đã có `application/errors/map-domain-error.ts` (`mapDomainErrorToAppError()`), được gọi **bên trong Use Case** (`CreateBirthProfileUseCase`/`UpdateBirthProfileUseCase`, đã verify code thật) để dịch Domain error (`Error` thuần) → `DomainError` (`AppError`, statusCode `422`) **trước khi** propagate lên Presentation.

**Chart module (M1–M6) không có file tương đương.** `CreateNatalChartUseCase` (M6) cố ý propagate Domain error "nguyên trạng" (`InvalidCoordinateError`, `InvalidDateTimeError`, `UnsupportedHouseSystemError`, `UnsupportedChartTypeError`, `UnsupportedCelestialBodyError`, `DataIntegrityError`, `ChartCalculationFailed`, `UnresolvableTimezoneError` — tất cả là `Error` thuần, `chart.errors.ts`, không extends `AppError`) — quyết định này **đúng** ở mức "không collapse nhiều loại lỗi thành 1 loại chung" (bài học M3), nhưng **chưa đủ** vì các lỗi này vẫn cần được dịch sang `AppError` tương ứng ở đâu đó trước khi tới Controller, nếu không toàn bộ sẽ thành `500` sai ngữ nghĩa khi REST API Spec kỳ vọng `422`.

**Ảnh hưởng tới M7:** Không thể hoàn thành yêu cầu Mục 8 ("Application/domain/infrastructure errors → controller/presentation boundary → existing error normalization/mapping → RFC7807 response") một cách trung thực nếu thiếu tầng dịch này — dù đây là gap phát sinh từ M6, không phải lỗi M7 gây ra.

**Phân loại:** Blocking defect (chặn đúng nghĩa AC Mục 8/13 của M7, không chặn các phần khác của M7).

**Quyết định phạm vi (CONFIRMED):** M7 bổ sung `chart/application/errors/map-domain-error.ts` (file mới, mirror 100% cấu trúc `birth-profile`'s) + sửa **đúng nơi cần thiết** trong Use Case (M6) để gọi hàm này khi catch lỗi từ `ChartBuilder`. Trước khi code, đã đối chiếu trực tiếp `shared/errors/error-codes.ts` (canonical registry): 6/8 mã lỗi đã có sẵn, **2 mã còn thiếu** (`UNRESOLVABLE_TIMEZONE`, `CHART_CALCULATION_FAILED`) được bổ sung **vào đúng canonical registry**, không tự đặt riêng trong `chart/application/errors/` (tránh phá vỡ shared error vocabulary). Đây là **corrective task nhỏ, có căn cứ rõ ràng** trên code M6 đã đóng (không phải "redesign kiến trúc" — tái sử dụng đúng pattern đã có ở `birth-profile`, không phát minh cơ chế mới) — chi tiết đầy đủ + bảng exhaustive mapping ở Task M7-T0 (Mục 8).

### D-2 — [KNOWN GAP, kế thừa từ M6 Conflict #1] `ChartResponse.interpretations` bắt buộc nhưng không có Interpretation subsystem

**Đã xác nhận lại ở M7:** Không có gì thay đổi từ M6 — Interpretation Content Bank/Engine vẫn chưa tồn tại. `ChartResponse.interpretations: list<InterpretationResponse>` là **required, không nullable** (REST API Spec §5.4).

**Quyết định phạm vi (M7 phải quyết định, vì M7 là nơi DTO thật sự được lắp ráp lần đầu):** `ChartResponseMapper` trả `interpretations: []` (mảng rỗng) cho **mọi** Chart — không fabricate nội dung giả. `interpretations` **vẫn giữ đúng kiểu required** theo shape thật `list<InterpretationResponse>` — đã đối chiếu trực tiếp REST API Spec §5.5, `InterpretationResponse` **có định nghĩa cụ thể** (`subjectType`, `subjectKey`, `language`, `bodyText`, `tone?`), nên schema Zod dùng đúng `z.array(interpretationResponseSchema)`, **không** dùng `z.array(z.unknown())` (vì contract đã đủ thông tin, dùng `unknown()` sẽ làm sai lệch OpenAPI contract dù runtime luôn rỗng). Đây **không phải** vi phạm "invent alternative response shapes" (Mục 6 prompt) vì shape đúng 100% theo spec đã có, chỉ là **luôn rỗng** cho tới khi Interpretation module tồn tại. Comment code rõ ràng trích dẫn chính discrepancy này. **Không** chặn M7 — chỉ là 1 dòng code + 1 comment + 1 schema con nhỏ.

**Phân loại:** Known Gap, không blocking, cần future improvement (Interpretation milestone, ngoài Sprint 3).

### D-3 — [BLOCKING nếu muốn đúng 100% spec, nhưng có resolution không-blocking] `ChartSummaryResponse.birthProfileLabel` không có nguồn dữ liệu nào cross-module truy cập được

**Phát hiện sâu hơn M6 đã ghi nhận:** Không chỉ `Chart` Entity thiếu field này (đã biết từ M6) — **`birth-profile/index.ts` (module-root) cũng không export bất kỳ Use Case nào trả về `label`**. Đã verify trực tiếp: `birth-profile/index.ts` chỉ export `GetBirthProfileSnapshotUseCase` (trả `BirthDataSnapshot`, không có `label`) — `GetBirthProfileUseCase` (Sprint 2, trả `BirthProfile` đầy đủ có `label`) **không được export qua module-root**, nên Chart module (kể cả M7) **không có cách nào hợp lệ** (theo đúng ranh giới cross-module đã enforce bằng ESLint) để lấy `label` của 1 BirthProfile.

**3 hướng giải quyết (không tự chọn thay, trình bày rõ):**
- (a) Bổ sung `label` vào snapshot chain (`EngineInputBirthData`→`BirthDataSnapshot`→`charts.snapshot_label`) — đúng pattern M5-T00 đã làm cho `fullName`/`placeName`, nhưng đòi hỏi sửa M1 (VO)/M4 (Use Case)/M5 (migration mới) — **vượt xa scope "Presentation Layer"**, vi phạm tường minh Mục 17 ("Do NOT redesign repositories", "Do not redesign Chart Domain").
- (b) `birth-profile` module export thêm 1 Use Case/hàm nhẹ trả `label` theo `birthProfileId` (ví dụ mở rộng `birth-profile/index.ts`) — vẫn là sửa đổi module đã đóng (M4), dù nhỏ hơn (a) nhiều.
- (c) M7 bỏ qua `birthProfileLabel` cho Sprint 3 — trả `null` trong `ChartSummaryResponse`, ghi rõ Known Gap, không block phần còn lại của M7.

**Quyết định phạm vi:** Chọn **(c)** — đúng tinh thần Mục 17 ("Do NOT redesign... Do not silently modify completed milestone architecture") và Mục 21 nguyên tắc ưu tiên "Frozen REST API Spec" đứng sau "Explicit frozen architecture decisions" (ranh giới module-root đã enforce bằng ESLint từ M4 **là** 1 architecture decision đã đóng băng, đứng cao hơn 1 field DTO). `ChartSummaryResponseMapper` trả `birthProfileLabel: null` (không fabricate). Ghi rõ TODO trích dẫn D-3 trong code.

**CONFIRMED — đây là contract deviation có chủ đích cho Sprint 3, không phải giải pháp cuối cùng.** Milestone tương lai sẽ chọn dứt điểm giữa 3 hướng: (a) cross-module read contract mới (`birth-profile` export thêm), (b) snapshot/denormalization thật (mirror M5-T00), hoặc (c) redesign lại API contract nếu cần — **M7 không giải quyết dứt điểm**, chỉ ghi nhận và trả `null` tạm thời.

**Phân loại:** Known Gap (không phải blocking defect — có resolution rõ ràng, không chặn code M7), future improvement thuộc (a)/(b)/(c) ở milestone sau.

---

## 1. Milestone Overview

M1–M6 đã đóng, verify sạch trên `dev` (`404df6b`). M7 implement toàn bộ `chart/presentation/` — routes, controller, Zod schemas, response mapper, OpenAPI registration — kết nối 4 Use Case đã có (M6) với HTTP, theo đúng pattern `birth-profile/presentation/` đã có (Sprint 2). M7 **không** viết business logic mới — mọi quyết định nghiệp vụ đã nằm ở M1–M6, M7 chỉ orchestrate HTTP ↔ Application.

---

## 2. Objectives

1. 4 endpoint (`POST /charts/natal`, `GET /charts/{id}`, `GET /charts`, `DELETE /charts/{id}`) hoạt động end-to-end qua HTTP thật.
2. Request/Response khớp chính xác REST API Specification §4.4/§5.4 (trừ 2 Known Gap D-2/D-3 đã ghi nhận).
3. Error handling đi qua đúng pipeline RFC7807 đã có, không tạo cơ chế thứ 2 (yêu cầu vá D-1 trước).
4. `npm run generate:openapi` chạy sạch, đủ 4 endpoint.
5. API test dùng Supertest + Swiss Ephemeris thật (không mock) cho luồng tính toán.

---

## 3. Scope / Non-Scope

### In Scope
- `chart/presentation/{controllers,routes,schemas,mappers,openapi}/*` — toàn bộ mới.
- `chart/application/errors/map-domain-error.ts` (mới) + sửa Use Case liên quan (M6) để gọi nó — **corrective task D-1**.
- Wiring `composition-root.ts`: `ChartController`, `createChartRoutes`.
- `scripts/generate-openapi.ts`: thêm import side-effect cho `chart.openapi.ts`.
- API test (Supertest) cho 4 endpoint.

### Non-Scope
- Interpretation subsystem (D-2).
- `birthProfileLabel` denormalization thật (D-3, option a/b).
- Bất kỳ sửa đổi nào lên `chart/domain/`, `chart/infrastructure/` (M1-M3, M5), `IChartRepository`, `ChartBuilder`.
- Sửa `birth-profile/index.ts` để export thêm gì (D-3 quyết định không làm).
- CQRS, GraphQL, service layer trong Presentation, DI mechanism mới, validation/API framework mới.
- Rate limiting implementation (hạ tầng chung, không riêng Chart).

---

## 4. Current Dependencies

| Thành phần | Trạng thái | Vai trò với M7 |
|---|---|---|
| 4 Use Case (`CreateNatalChartUseCase`, `GetChartUseCase`, `ListChartsUseCase`, `DeleteChartUseCase`) | Đã có (M6), qua `chart/index.ts` | M7 tiêu thụ trực tiếp, không đụng logic (trừ D-1) |
| `chart/index.ts` | Đã có, chỉ export 4 Use Case + Command/Result type (đã dọn sạch ở M6 review cuối) | Controller import qua đây |
| `authMiddleware`, `requireAuth()` | Đã có (Sprint 1) | Tái dùng nguyên — `authMiddleware` optional-populate, `requireAuth()` bắt buộc |
| `getCurrentUser(req)` | Đã có, throw nếu `req.user` thiếu | **Không dùng được cho `POST /charts/natal`** (Guest hợp lệ) — cần đọc `req.user?.sub ?? null` trực tiếp |
| `validateBody`/`validateParams`/`validateQuery` middleware | Đã có (Sprint 1/2) | Tái dùng nguyên |
| `mapErrorToProblemDetails`, `createErrorHandlerMiddleware` | Đã có, global, cuối pipeline | Tái dùng nguyên — **nhưng phụ thuộc D-1 được vá để hoạt động đúng cho Chart** |
| `paginatedResponseSchema<T>()` | Đã có (`shared/http/paginated-response.mapper.ts`) | Tái dùng cho `GET /charts` |
| `problemDetailsSchema` | Đã có | Tái dùng cho mọi response lỗi trong OpenAPI |
| `registry` (`docs/openapi.ts`) | Đã có, `OpenAPIRegistry` singleton | `chart.openapi.ts` import và gọi `registry.registerPath()` |
| `createApp(config, logger, routers: Router[])` | Đã có | `createChartRoutes(...)` thêm vào mảng `routers` ở `composition-root.ts` |
| `bootstrapApplication()` | Đã có (composition-root.ts) | Dùng trong API test (đúng pattern `login.api.test.ts`) |
| `PrismaTestFactory`, `DatabaseTestHelper` | Đã có | Cần kiểm tra có `createChart`/`createBirthProfile` factory method — xem M7-T7 |
| `ErrorCode.EXACTLY_ONE_SOURCE_REQUIRED` | Đã có (M6) | Tái dùng, ánh xạ `422` |

---

## 5. Architecture Context

```
HTTP Request
   │
   ▼
authMiddleware (populate req.user nếu có Bearer hợp lệ, không throw nếu thiếu)
   │
   ▼
[requireAuth() — CHỈ áp dụng cho Get/List/Delete, KHÔNG áp dụng cho Create]
   │
   ▼
validateBody/validateParams/validateQuery (Zod, 400 nếu sai format)
   │
   ▼
asyncHandler(controller.xHandler) ──▶ Use Case (M6) ──▶ Domain/Application error nếu có
   │                                                            │
   ▼                                                            ▼
res.json(Mapper.toResponse(result))              [D-1 vá] map-domain-error.ts (trong Use Case)
                                                                 │
                                                                 ▼
                                                    AppError propagate → error-handler.middleware.ts
                                                                 │
                                                                 ▼
                                                    mapErrorToProblemDetails → RFC7807 response
```

**Dependency direction:** Presentation → Application (qua `chart/index.ts`) → Domain. Presentation **không** import `chart/domain/*`/`chart/infrastructure/*` trực tiếp — chỉ Command/Result type từ `chart/index.ts` và `Chart`/child Entity type (cần thiết để viết Mapper — xem dưới, đây là điểm cần làm rõ vì `chart/index.ts` không export Entity).

**Vấn đề kỹ thuật cần xử lý (không phải Open Question — có giải pháp rõ):** `ChartResponseMapper.toResponse(chart: Chart)` cần type `Chart`/`Planet`/`House`/... để viết đúng — nhưng `chart/index.ts` (module-root) không export các Entity này (đúng thiết kế). Vì Mapper nằm **trong chính module `chart`** (`chart/presentation/mappers/`), nó được phép import trực tiếp `chart/domain/entities/*.ts` (cùng module, không qua module-root) — quy tắc "chỉ qua module-root" chỉ áp dụng **cross-module**, không áp dụng nội bộ. Không vi phạm boundary.

---

## 6. Target Directory/File Structure

```
backend/src/modules/chart/
├── application/
│   └── errors/
│       └── map-domain-error.ts                        ← MỚI (D-1)
└── presentation/                                        ← MỚI hoàn toàn
    ├── controllers/
    │   └── chart.controller.ts
    ├── routes/
    │   └── chart.routes.ts
    ├── schemas/
    │   ├── chart-id.schema.ts
    │   ├── create-natal-chart.schema.ts
    │   ├── create-natal-chart-query.schema.ts          ← riêng, vì `save` là query param
    │   └── list-charts-query.schema.ts
    ├── mappers/
    │   ├── chart-response.mapper.ts
    │   └── chart-summary-response.mapper.ts
    └── openapi/
        └── chart.openapi.ts

backend/tests/api/chart/
├── create-natal-chart.api.test.ts
├── get-chart.api.test.ts
├── list-charts.api.test.ts
└── delete-chart.api.test.ts
```

---

## 7. Task Breakdown

| Task | Objective | Phụ thuộc |
|---|---|---|
| M7-T0 | Vá D-1 — `map-domain-error.ts` + sửa Use Case | Không |
| M7-T1 | Zod Schemas (4 file) | Không |
| M7-T2 | `ChartResponseMapper` + `ChartSummaryResponseMapper` | M7-T1 |
| M7-T3 | `ChartController` | M7-T1, M7-T2 |
| M7-T4 | `chart.routes.ts` | M7-T3 |
| M7-T5 | `chart.openapi.ts` + wire vào `generate-openapi.ts` | M7-T1, M7-T2 |
| M7-T6 | Composition-root wiring | M7-T3, M7-T4 |
| M7-T7 | API Test (4 file, Supertest + Swiss Ephemeris thật) | M7-T0 đến M7-T6 |
| M7-T8 | Review tổng thể (lint/typecheck/test/build/OpenAPI generate, full backend) | M7-T0 đến M7-T7 |

---

## 8. Detailed Implementation Steps

### M7-T0 — Vá D-1: `map-domain-error.ts`

**Bước 0, bắt buộc trước khi viết code (CONFIRMED — không được tự phát minh ErrorCode):** Đã đối chiếu trực tiếp `shared/errors/error-codes.ts` (canonical registry). Xác nhận **6/8 loại lỗi đã có sẵn mã tương ứng**, đúng 1:1 tên:

| Domain Error (`chart.errors.ts`) | ErrorCode canonical | Đã tồn tại? |
|---|---|---|
| `InvalidCoordinateError` | `INVALID_COORDINATES` | ✅ Có sẵn |
| `InvalidDateTimeError` | `INVALID_DATETIME` | ✅ Có sẵn |
| `UnsupportedHouseSystemError` | `UNSUPPORTED_HOUSE_SYSTEM` | ✅ Có sẵn |
| `UnsupportedChartTypeError` | `UNSUPPORTED_CHART_TYPE` | ✅ Có sẵn |
| `UnsupportedCelestialBodyError` | `UNSUPPORTED_CELESTIAL_BODY` | ✅ Có sẵn |
| `DataIntegrityError` | `DATA_INTEGRITY_ERROR` | ✅ Có sẵn |
| `UnresolvableTimezoneError` | — | ❌ **Chưa có**, cần bổ sung |
| `ChartCalculationFailed` | — | ❌ **Chưa có**, cần bổ sung |

**Cho 2 mã còn thiếu:** bổ sung **vào đúng canonical registry** `shared/errors/error-codes.ts` (mục "Chart Domain" đã có sẵn, chỉ thêm 2 dòng), **không** đặt ErrorCode mới trong `chart/application/errors/` (đúng yêu cầu tường minh — tránh phá vỡ shared error vocabulary):
```typescript
// Chart Domain
UNSUPPORTED_HOUSE_SYSTEM = 'UNSUPPORTED_HOUSE_SYSTEM',
UNSUPPORTED_CHART_TYPE = 'UNSUPPORTED_CHART_TYPE',
UNSUPPORTED_CELESTIAL_BODY = 'UNSUPPORTED_CELESTIAL_BODY',
INVALID_COORDINATES = 'INVALID_COORDINATES',
INVALID_DATETIME = 'INVALID_DATETIME',
DATA_INTEGRITY_ERROR = 'DATA_INTEGRITY_ERROR',
UNRESOLVABLE_TIMEZONE = 'UNRESOLVABLE_TIMEZONE',        // MỚI
CHART_CALCULATION_FAILED = 'CHART_CALCULATION_FAILED',  // MỚI
```

**Files mới:** `chart/application/errors/map-domain-error.ts` — mirror cấu trúc `birth-profile`'s, dùng đúng 8 mã đã xác nhận ở bảng trên (không giả định, không hard-code mã chưa kiểm tra):

```typescript
export function mapChartDomainErrorToAppError(error: Error): DomainError {
  if (error instanceof InvalidCoordinateError) return new DomainError(ErrorCode.INVALID_COORDINATES, error.message);
  if (error instanceof InvalidDateTimeError) return new DomainError(ErrorCode.INVALID_DATETIME, error.message);
  if (error instanceof UnsupportedHouseSystemError) return new DomainError(ErrorCode.UNSUPPORTED_HOUSE_SYSTEM, error.message);
  if (error instanceof UnsupportedChartTypeError) return new DomainError(ErrorCode.UNSUPPORTED_CHART_TYPE, error.message);
  if (error instanceof UnsupportedCelestialBodyError) return new DomainError(ErrorCode.UNSUPPORTED_CELESTIAL_BODY, error.message);
  if (error instanceof DataIntegrityError) return new DomainError(ErrorCode.DATA_INTEGRITY_ERROR, error.message);
  if (error instanceof UnresolvableTimezoneError) return new DomainError(ErrorCode.UNRESOLVABLE_TIMEZONE, error.message);
  if (error instanceof ChartCalculationFailed) return new DomainError(ErrorCode.CHART_CALCULATION_FAILED, error.message);
  throw error; // Unknown Error — propagate nguyên trạng, mapper KHÔNG được nuốt lỗi lạ
}
```

**Files sửa:** `create-natal-chart.usecase.ts` (M6) — **chỉ** file này thực sự cần bọc (là nơi duy nhất gọi `ChartBuilder`/`EngineInput.create()`, nguồn phát sinh cả 8 loại lỗi trên). `GetChartUseCase`/`ListChartsUseCase`/`DeleteChartUseCase` chỉ dùng `IChartRepository` — lỗi của chúng đã là `NotFoundError`/`AuthorizationError`/`InfrastructureError` (đều `AppError` sẵn), **không cần sửa**.

**Cách bọc trong `CreateNatalChartUseCase`:** Bọc đúng đoạn gọi `chartBuilder.build(...)` bằng `try/catch`, catch chỉ 1 lớp mỏng ở **chính xác điểm phát sinh** (không bọc toàn bộ `execute()` — tránh lặp lại bug M3 đã sửa):
```typescript
let chart: Chart;
try {
  chart = await this.chartBuilder.build(builderInput);
} catch (error) {
  if (error instanceof Error) throw mapChartDomainErrorToAppError(error);
  throw error;
}
```
Lỗi từ `GetBirthProfileSnapshotUseCase`/`chartRepository.save()` **vẫn propagate nguyên trạng, không đụng** (đã là `AppError` sẵn).

**Testing — bắt buộc dạng exhaustive matrix (CONFIRMED, không chỉ "test bất kỳ loại nào"):**

| Domain error | AppError | ErrorCode | HTTP |
|---|---|---|---|
| `InvalidCoordinateError` | `DomainError` | `INVALID_COORDINATES` | 422 |
| `InvalidDateTimeError` | `DomainError` | `INVALID_DATETIME` | 422 |
| `UnsupportedHouseSystemError` | `DomainError` | `UNSUPPORTED_HOUSE_SYSTEM` | 422 |
| `UnsupportedChartTypeError` | `DomainError` | `UNSUPPORTED_CHART_TYPE` | 422 |
| `UnsupportedCelestialBodyError` | `DomainError` | `UNSUPPORTED_CELESTIAL_BODY` | 422 |
| `DataIntegrityError` | `DomainError` | `DATA_INTEGRITY_ERROR` | 422 |
| `UnresolvableTimezoneError` | `DomainError` | `UNRESOLVABLE_TIMEZONE` | 422 |
| `ChartCalculationFailed` | `DomainError` | `CHART_CALCULATION_FAILED` | 422 |
| Lỗi lạ không nằm trong 8 loại trên (ví dụ `TypeError` bất ngờ) | **Không map** | — | propagate nguyên trạng (verify mapper không nuốt) |

8 test case đầu verify đủ `instanceof DomainError` + đúng `errorCode` + `statusCode===422` từng loại riêng biệt — không gộp chung 1 test "bất kỳ loại nào cũng ra DomainError". Test case cuối verify `mapChartDomainErrorToAppError` **throw lại nguyên lỗi gốc** (không phải `DomainError`) khi gặp lỗi không nhận diện được.

Cập nhật lại 2 test case hiện có trong `create-natal-chart.usecase.test.ts` (M6) kỳ vọng `ChartBuilder.build()` throw → giờ phải assert `instanceof DomainError` + đúng `errorCode` cụ thể (không chỉ `instanceof DomainError` chung chung) — **đây là thay đổi hành vi có chủ đích**, cần cập nhật test cũ, không phải regression.

**Acceptance:** Đủ 9 dòng trong bảng exhaustive trên có test tương ứng, pass.

### M7-T1 — Zod Schemas

**`chart-id.schema.ts`** — mirror `birth-profile-id.schema.ts` 1:1.

**`create-natal-chart.schema.ts`** (request BODY, không gồm `save`):
```typescript
const engineInputBirthDataSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.object({hour: z.number().int().min(0).max(23), minute: z.number().int().min(0).max(59), second: z.number().int().min(0).max(59)}).nullable(),
  isBirthTimeKnown: z.boolean(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezoneId: z.string().min(1),
  placeName: z.string().min(1),   // bắt buộc — xem OQ-1
});

export const createNatalChartSchema = z.object({
  birthProfileId: z.string().uuid().optional(),
  birthData: engineInputBirthDataSchema.optional(),
  houseSystem: z.enum(['Placidus', 'WholeSign']),
  includeOptionalPoints: z.array(z.enum(['Chiron', 'Lilith', 'NorthNode', 'SouthNode'])).optional().default([]),
}).refine(
  (data) => !!data.birthProfileId !== !!data.birthData,
  { message: 'Exactly one of birthProfileId or birthData is required' },
).openapi('CreateNatalChartRequest');
```
**Lưu ý quan trọng:** `.refine()` ở Zod chỉ tạo lỗi `400` (format-level, message generic) — **không** thay thế Application's `422 EXACTLY_ONE_SOURCE_REQUIRED` (M6 đã enforce lại ở Use Case, đúng thiết kế 2 tầng đã có ở M6 plan). Zod refine ở đây chỉ là UX phụ (fail sớm hơn), Application vẫn là nguồn thật của `422`.

**`create-natal-chart-query.schema.ts`** (mới, vì `save` là **query param**, đã xác nhận trực tiếp — REST API Spec Mục 4.4: *"Query Params: `save` (boolean, default `false`)"*):
```typescript
export const createNatalChartQuerySchema = z.object({
  save: z.coerce.boolean().default(false),
}).openapi('CreateNatalChartQuery');
```

**`list-charts-query.schema.ts`**:
```typescript
export const listChartsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  birthProfileId: z.string().uuid().optional(),
  sortBy: z.enum(['calculatedAt']).default('calculatedAt'),   // chỉ 1 giá trị hợp lệ — ListChartsOptions (M1) không hỗ trợ field khác
  order: z.enum(['asc', 'desc']).default('desc'),
}).openapi('ListChartsQueryRequest');
```
Đúng 1:1 pattern `listBirthProfilesQuerySchema`, chỉ khác `sortBy` là enum 1 giá trị (khớp `ListChartsOptions.sortBy: 'calculatedAt'` đã đóng băng từ M1) thay vì 2 giá trị như BirthProfile.

**Testing:** Không cần unit test schema riêng (không tìm thấy tiền lệ này ở `birth-profile`), cover qua API test (M7-T7).

### M7-T2 — Mappers

**`chart-response.mapper.ts`**:
```typescript
const interpretationResponseSchema = z.object({
  subjectType: z.string(),
  subjectKey: z.string(),
  language: z.string(),
  bodyText: z.string(),
  tone: z.string().nullable().optional(),
}).openapi('InterpretationResponse');   // đúng REST API Spec §5.5, dù runtime luôn rỗng (D-2)

export const chartResponseSchema = z.object({
  id: z.string().uuid(),
  chartType: z.string(),
  houseSystem: z.string(),
  isHouseDataAvailable: z.boolean(),
  planets: z.array(planetResponseSchema),
  houses: z.array(houseResponseSchema),
  angles: z.array(angleResponseSchema),
  aspects: z.array(aspectResponseSchema),
  patterns: z.array(patternResponseSchema),
  interpretations: z.array(interpretationResponseSchema),   // D-2 — luôn rỗng runtime, schema vẫn đúng contract
  warnings: z.array(warningSchema),          // tái dùng shared warning schema nếu đã có
  calculatedAt: z.string().datetime(),
  engineVersion: z.string(),
}).openapi('ChartResponse');

export class ChartResponseMapper {
  static toResponse(chart: Chart): z.infer<typeof chartResponseSchema> {
    return {
      id: chart.id,
      chartType: chart.chartType,
      houseSystem: chart.houseSystem,
      isHouseDataAvailable: chart.isHouseDataAvailable,
      planets: chart.planets.map(mapPlanet),
      houses: chart.houses.map(mapHouse),
      angles: chart.angles.map(mapAngle),
      aspects: chart.aspects.map(mapAspect),
      patterns: chart.patterns.map(mapPattern),
      interpretations: [], // D-2: Known Gap — Interpretation module chưa tồn tại (Sprint 3)
      warnings: chart.warnings.map(mapWarning),
      calculatedAt: chart.calculationMetadata.calculatedAt.toISOString(),
      engineVersion: chart.calculationMetadata.engineVersion,
    };
  }
}
```
**Không** map `userId`/`birthProfileId` vào `ChartResponse` — đã xác nhận trực tiếp REST API Spec §5.4 **không có** 2 field này trong `ChartResponse` (chỉ có trong `ChartSummaryResponse`) — loại trừ có chủ đích, không phải thiếu sót.

**`chart-summary-response.mapper.ts`** (file riêng vì input là `ListChartsResult`, không phải `Chart` đơn lẻ):
```typescript
export const chartSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  birthProfileId: z.string().uuid().nullable(),
  birthProfileLabel: z.string().nullable(),   // D-3 — luôn null, xem comment
  houseSystem: z.string(),
  calculatedAt: z.string().datetime(),
}).openapi('ChartSummaryResponse');

export class ChartSummaryResponseMapper {
  static toResponse(chart: Chart): z.infer<typeof chartSummaryResponseSchema> {
    return {
      id: chart.id,
      birthProfileId: chart.birthProfileId,
      birthProfileLabel: null, // D-3: Known Gap — birth-profile/index.ts không export label cross-module
      houseSystem: chart.houseSystem,
      calculatedAt: chart.calculationMetadata.calculatedAt.toISOString(),
    };
  }
}
```
**Lưu ý:** `birthProfileLabel` schema đổi từ `string` (REST API Spec) thành `string | null` — lệch có chủ đích (D-3, phương án c) — không phải lỗi, ghi ở Known Gaps.

**Testing:** Unit test mapper — input `Chart` fixture đầy đủ (planet/house/angle/aspect, cả 2 case `isHouseDataAvailable` true/false) → verify output field-by-field khớp schema, đặc biệt `interpretations=[]` luôn đúng và `houses=[]`/`angles=[]` khi `isHouseDataAvailable=false` không bị Mapper tự ý thêm gì.

### M7-T3 — `ChartController`

```typescript
export class ChartController {
  constructor(
    private readonly createNatalChartUseCase: CreateNatalChartUseCase,
    private readonly getChartUseCase: GetChartUseCase,
    private readonly listChartsUseCase: ListChartsUseCase,
    private readonly deleteChartUseCase: DeleteChartUseCase,
  ) {}

  public createHandler = async (req: Request, res: Response): Promise<void> => {
    const requestingUserId = req.user?.sub ?? null;   // KHÔNG dùng getCurrentUser() — Guest hợp lệ
    const body = req.body as CreateNatalChartRequest;
    const { save } = req.query as unknown as CreateNatalChartQuery;

    const chart = await this.createNatalChartUseCase.execute({
      requestingUserId,
      birthProfileId: body.birthProfileId,
      birthData: body.birthData ? { ...body.birthData, birthDate: new Date(body.birthData.birthDate) } : undefined,
      houseSystem: body.houseSystem as HouseSystem,
      includeOptionalPoints: body.includeOptionalPoints as PlanetName[],
      save,
    });

    res.status(save ? 201 : 200).json(ChartResponseMapper.toResponse(chart));
  };

  public getHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req);   // bắt buộc auth — route đã áp requireAuth()
    const { id } = req.params as ChartIdParams;
    const chart = await this.getChartUseCase.execute({ chartId: id, requestingUserId: user.sub });
    res.status(200).json(ChartResponseMapper.toResponse(chart));
  };

  public listHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req);
    const query = req.query as unknown as ListChartsQueryRequest;
    const result = await this.listChartsUseCase.execute({
      requestingUserId: user.sub,
      page: query.page,
      pageSize: query.pageSize,
      birthProfileId: query.birthProfileId,
      sortBy: query.sortBy,
      order: query.order,
    });
    res.status(200).json({
      items: result.items.map((chart) => ChartSummaryResponseMapper.toResponse(chart)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  };

  public deleteHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req);
    const { id } = req.params as ChartIdParams;
    await this.deleteChartUseCase.execute({ chartId: id, requestingUserId: user.sub });
    res.status(204).send();
  };
}
```

**Điểm khác biệt quan trọng so với `BirthProfileController`:** `createHandler` **không** dùng `getCurrentUser(req)` (sẽ throw sai cho Guest) — đọc `req.user?.sub ?? null` trực tiếp, đúng thiết kế `requestingUserId: string | null` đã chốt ở M6.

**Không map lỗi gì trong Controller** — mọi lỗi (Domain đã dịch ở M7-T0, Application, Infrastructure) đều propagate tự nhiên qua `asyncHandler` → `next(error)` → error-handler middleware toàn cục.

**Testing:** Cover qua API test (M7-T7), không cần unit test Controller riêng (đúng — không tìm thấy unit test riêng cho `BirthProfileController`, chỉ có API test).

### M7-T4 — Route Factory

```typescript
export const createChartRoutes = (
  controller: ChartController,
  tokenProvider: Parameters<typeof authMiddleware>[0],
): Router => {
  const router = Router();
  const chartRouter = Router();

  // authMiddleware áp dụng TOÀN BỘ (populate req.user nếu có token, không throw) — khác birth-profile
  chartRouter.use(authMiddleware(tokenProvider));

  chartRouter.post(
    '/natal',
    validateQuery(createNatalChartQuerySchema),
    validateBody(createNatalChartSchema),
    asyncHandler(controller.createHandler),
    // KHÔNG requireAuth() — Guest hợp lệ cho save=false
  );

  chartRouter.get(
    '/',
    requireAuth(),
    validateQuery(listChartsQuerySchema),
    asyncHandler(controller.listHandler),
  );

  chartRouter.get(
    '/:id',
    requireAuth(),
    validateParams(chartIdSchema),
    asyncHandler(controller.getHandler),
  );

  chartRouter.delete(
    '/:id',
    requireAuth(),
    validateParams(chartIdSchema),
    asyncHandler(controller.deleteHandler),
  );

  router.use('/api/v1/charts', chartRouter);
  return router;
};
```

**Thứ tự middleware:** `requireAuth()` đặt **trước** `validate*` ở Get/List/Delete (401 ưu tiên hơn 400 khi cả 2 đều sai) — xem OQ-2.

**Testing:** Cover qua API test — verify đúng route nào áp dụng `requireAuth()`, route nào không (M7-T7).

### M7-T5 — OpenAPI Registration

`chart.openapi.ts` — 4 `registry.registerPath()` calls, đúng pattern `birth-profile.openapi.ts`:
- `POST /api/v1/charts/natal`: `security: [{bearerAuth: []}, {}]` (optional bearer — CONFIRMED OQ-3), kèm `description` rõ ràng nêu Guest chỉ dùng được cho tính toán không lưu, `request.query: createNatalChartQuerySchema`, `request.body: createNatalChartSchema`, `responses: {200, 201, 400, 401, 422}`.
- `GET /api/v1/charts/{id}`: `security: [{bearerAuth: []}]`, `request.params: chartIdSchema`, `responses: {200, 401, 403, 404}`.
- `GET /api/v1/charts`: `security: [{bearerAuth: []}]`, `request.query: listChartsQuerySchema`, `responses: {200: paginatedResponseSchema(chartSummaryResponseSchema), 400, 401}`.
- `DELETE /api/v1/charts/{id}`: `security: [{bearerAuth: []}]`, `request.params: chartIdSchema`, `responses: {204, 401, 403, 404}`.

**File sửa:** `backend/scripts/generate-openapi.ts` — thêm `import '../src/modules/chart/presentation/openapi/chart.openapi.js';`. **Đây là bước dễ quên** — Sprint 2 M8 từng có bug thật vì thiếu đúng dòng import này cho `location-search.openapi.ts` — M7 phải tự kiểm tra bằng cách chạy `npm run generate:openapi` thật và grep output, không chỉ tin code đã viết đúng.

**Testing:** Chạy `npm run generate:openapi` → verify `openapi.json` chứa đủ 4 path Chart (M7-T8).

### M7-T6 — Composition Root Wiring

```typescript
const chartController = new ChartController(
  createNatalChartUseCase, getChartUseCase, listChartsUseCase, deleteChartUseCase,
);
const routes: Router[] = [
  ...,
  createBirthProfileRoutes(birthProfileController, tokenProvider),
  createChartRoutes(chartController, tokenProvider),
];
```
Tái dùng đúng `tokenProvider` instance đã có (dùng chung cho mọi module, không tạo mới).

### M7-T7 — API Tests

Xem chi tiết Mục 16. Setup theo đúng pattern `login.api.test.ts`: `bootstrapApplication()`, `DatabaseTestHelper.clearDatabase()` mỗi `beforeEach`, `PrismaTestFactory` cho fixture. **Cần kiểm tra `PrismaTestFactory` đã có `createChart()`/`createBirthProfile()` chưa** — nếu M5's integration test đã tự tạo helper riêng thay vì dùng `PrismaTestFactory`, M7 cần bổ sung method còn thiếu (không phải viết lại factory, chỉ thêm method nếu chưa có — kiểm tra thật lúc code, không giả định).

**Swiss Ephemeris thật:** test dùng `bootstrapApplication()` → composition-root khởi tạo `SwissEphemerisAdapter` thật (đã verify M2: `swisseph-wasm` cài thật, không mock ở tầng composition-root) — đúng yêu cầu "real Swiss Ephemeris integration" của prompt, tự động thỏa mãn vì dùng chung `bootstrapApplication()`.

### M7-T8 — Review Tổng Thể

`npm run lint`/`tsc --noEmit`/`npm run generate:openapi`/full test suite (không chỉ `chart`) — đúng thói quen đã áp dụng nhất quán từ M3 tới M6.

---

## 9. Route/Controller Design

Đã trình bày đầy đủ ở Mục 8 (M7-T3, M7-T4). Tổng kết bảng route→middleware:

| Route | Middleware order | Ghi chú |
|---|---|---|
| `POST /charts/natal` | `authMiddleware` → `validateQuery` → `validateBody` → handler | **Không** `requireAuth()` |
| `GET /charts/{id}` | `authMiddleware` → `requireAuth()` → `validateParams` → handler | |
| `GET /charts` | `authMiddleware` → `requireAuth()` → `validateQuery` → handler | |
| `DELETE /charts/{id}` | `authMiddleware` → `requireAuth()` → `validateParams` → handler | |

`authMiddleware` áp dụng **1 lần duy nhất** ở đầu `chartRouter` (qua `chartRouter.use(...)`) — áp dụng cho cả 4 route, khác `birth-profile.routes.ts` (áp dụng `authMiddleware` **và** `requireAuth()` cùng lúc ở `bpRouter.use()`) vì Chart's Create endpoint cần auth **optional**, không thể gộp `requireAuth()` vào `.use()` toàn cục.

---

## 10. Validation Schema Design

Đã trình bày đầy đủ ở M7-T1. Tổng kết ranh giới validate:

| Constraint | Nguồn | Frozen hay Implementation Decision |
|---|---|---|
| `houseSystem` ∈ {Placidus, WholeSign} | REST API Spec §5.4 | Frozen |
| `includeOptionalPoints` ∈ 4 giá trị | REST API Spec §5.4 | Frozen |
| `birthProfileId`/`birthData` XOR | REST API Spec §5.4 (`422 EXACTLY_ONE_SOURCE_REQUIRED`) | Frozen — Zod chỉ hỗ trợ UX sớm, `422` thật vẫn ở Application (M6) |
| `save` là query param, không phải body | REST API Spec §4.4 ("Query Params: `save`") | Frozen — đã verify trực tiếp, dễ nhầm lẫn nếu không đọc kỹ |
| `page`/`pageSize`/`sortBy`/`order` cho `GET /charts` | REST API Spec §4.4 | Frozen |
| `pageSize` max 100 | Không ghi rõ trong REST API Spec cho Chart — đã áp dụng ở `ListChartsUseCase` (M6) | Implementation decision kế thừa Application layer, giữ nhất quán 2 tầng |
| `birthData.placeName` bắt buộc, không rỗng | Suy ra từ `BirthLocation.create()` (Sprint 2) — REST API Spec không liệt kê field cụ thể cho `birthData` inline | **Implementation Decision kế thừa từ M6/domain invariant** (không phải Frozen REST Contract — CONFIRMED OQ-1) |
| `birthTime.{hour,minute,second}` range | Suy ra từ miền giá trị tự nhiên | Implementation decision hợp lý |

---

## 11. DTO/Mapper Design

Đã trình bày đầy đủ ở M7-T2. Nguyên tắc chốt: **schema Zod đóng vai trò DTO type** (đúng pattern `birth-profile-response.mapper.ts` — 1 file gồm cả `z.object(...).openapi(...)` lẫn class Mapper thuần static). Không tạo interface DTO riêng tách khỏi Zod schema (tránh 2 nguồn định nghĩa shape trùng lặp).

**Không expose Prisma/Repository record** — Mapper luôn nhận `Chart` Domain Entity (đã map ở M5), không bao giờ chạm `Prisma.Chart...` type nào.

---

## 12. Authentication & Authorization Flow

| Endpoint | Guest | User (owner) | User (khác) | Admin |
|---|---|---|---|---|
| `POST /charts/natal?save=false` | ✅ 200 | ✅ 200 | — | ✅ 200 |
| `POST /charts/natal?save=true` | ❌ 401 | ✅ 201 | — | ✅ 201 |
| `GET /charts/{id}` | ❌ 401 | ✅ 200 (chỉ sở hữu) | ❌ 403 | ❌ 403 (không sở hữu) |
| `GET /charts` | ❌ 401 | ✅ 200 (chỉ chart của mình) | N/A | ✅ 200 (chỉ chart của mình) |
| `DELETE /charts/{id}` | ❌ 401 | ✅ 204 | ❌ 403 | ❌ 403 (không sở hữu) |

Đúng khớp 100% REST API Spec Mục 3 (Auth Matrix, đã đọc trực tiếp) và M6 plan (Security Review) — không có gì mới cần quyết định, M7 chỉ implement đúng qua route/middleware (Mục 9) + Use Case đã enforce sẵn ownership (M6).

**Ownership KHÔNG được implement lại ở Controller** — `GetChartUseCase`/`DeleteChartUseCase` (M6) đã tự `assertChartOwnership`; Controller chỉ truyền `requestingUserId`, không tự query/filter gì thêm.

---

## 13. Error Handling

| Error | Nguồn | HTTP Status | ErrorCode |
|---|---|---|---|
| `ValidationError` (Zod parse fail) | `validateBody`/`validateQuery`/`validateParams` middleware | `400` | `VALIDATION_ERROR` (hoặc tương đương đã có) |
| `ValidationError(EXACTLY_ONE_SOURCE_REQUIRED)` | `CreateNatalChartUseCase` (M6) | `422` | `EXACTLY_ONE_SOURCE_REQUIRED` |
| `AuthenticationError(UNAUTHORIZED)` | `requireAuth()` (thiếu token) hoặc `CreateNatalChartUseCase` (Guest+save=true / Guest+birthProfileId) | `401` | `UNAUTHORIZED` |
| `AuthorizationError(FORBIDDEN)` | `assertChartOwnership` (M6) | `403` | `FORBIDDEN` |
| `NotFoundError` | `GetChartUseCase`/`DeleteChartUseCase` (chart không tồn tại), hoặc propagate từ `GetBirthProfileSnapshotUseCase` (M4, birthProfileId không tồn tại) | `404` | `NOT_FOUND` |
| `DomainError` (sau khi vá D-1) | `ChartBuilder`/`EngineInput.create()` lỗi (coordinate/datetime/houseSystem/etc.) | `422` | Tùy loại cụ thể (Mục 8 M7-T0) |
| `InfrastructureError` | `chartRepository.save()` thất bại (DB) | `500` | `INFRASTRUCTURE_ERROR` |

Toàn bộ đi qua **1 pipeline duy nhất đã có** (`error-handler.middleware.ts` → `mapErrorToProblemDetails`) — Controller **không** có `try/catch` nào (dựa vào `asyncHandler` tự động `next(error)`), đúng yêu cầu "Do not create a second error-handling mechanism".

---

## 14. OpenAPI Integration

Đã trình bày M7-T5. Checklist verify cụ thể (chạy `npm run generate:openapi` thật rồi kiểm tra `openapi.json`):
- 4 path (`/api/v1/charts/natal`, `/api/v1/charts/{id}` ×2 method, `/api/v1/charts`) xuất hiện.
- `POST /charts/natal`: có `security: [{bearerAuth: []}, {}]` (optional bearer), có `parameters` cho `save` (query), có `requestBody`.
- `GET /charts`: `responses.200.content['application/json'].schema` đúng `paginatedResponseSchema(chartSummaryResponseSchema)`.
- Toàn bộ response lỗi (`400`/`401`/`403`/`404`/`422`) dùng `problemDetailsSchema`.
- `nullable`/`required` khớp đúng bảng M7-T2 (đặc biệt `birthProfileLabel` giờ là `nullable: true`, lệch có ghi chú so với REST API Spec gốc — D-3).

---

## 15. Testing Strategy

API-level (Supertest), dùng `bootstrapApplication()` thật + Postgres thật (`docker-compose.test.yml`) + Swiss Ephemeris thật (`swisseph-wasm`, không mock). Không unit test Controller/Route riêng (theo đúng convention `birth-profile` không có). Có unit test cho Mapper (M7-T2) và cho `map-domain-error.ts` (M7-T0).

---

## 16. Test Case Matrix

### `POST /charts/natal`
| Case | Expect |
|---|---|
| Guest, `save=false`, `birthData` inline hợp lệ | `200`, `ChartResponse` đầy đủ, `interpretations=[]` |
| Guest, `save=true` | `401` |
| User, `save=true`, `birthProfileId` hợp lệ, đúng chủ | `201`, Chart thật tồn tại trong DB |
| User, `save=true`, `birthProfileId` không tồn tại | `404` |
| User, `save=true`, `birthProfileId` của user khác | `403` |
| Guest, `birthProfileId` (bất kỳ) | `401` (M6 guard) |
| Cả `birthProfileId` lẫn `birthData` | `422 EXACTLY_ONE_SOURCE_REQUIRED` |
| Không field nào | `422 EXACTLY_ONE_SOURCE_REQUIRED` |
| `houseSystem` không hợp lệ (`"Koch"`) | `400` (Zod) |
| `houseSystem` thiếu | `400` (Zod, `required`) |
| Coordinate ngoài range (`latitude=200`) | `400` (Zod — cùng range M3, xem OQ-4) |
| `isBirthTimeKnown=false` | `200`/`201`, `houses=[]`, `angles=[]`, `isHouseDataAvailable=false` |
| `includeOptionalPoints=["Chiron"]` | Response có 11 planet |
| Vĩ độ cực + Placidus (house non-convergent) | Vẫn `200`/`201` (warning mềm), `warnings` chứa `HOUSE_SYSTEM_NOT_CONVERGING` — không phải lỗi |
| DB down giả lập (nếu test infra cho phép) | `500`, RFC7807 shape đúng |

### `GET /charts/{id}`
Own chart found (`200`); not found (`404`); chart của user khác (`403`); invalid UUID (`400`); no token (`401`); RFC7807 shape đúng cho mọi lỗi.

### `GET /charts`
Nhiều Chart, phân trang đúng (`page`/`pageSize`); filter `birthProfileId` đúng; sort `asc`/`desc` đúng; rỗng (`items=[]`, `total=0`); query sai (`pageSize=0` → `400`); **User A không thấy Chart của User B** (test 2 user, 2 token, verify tuyệt đối không lẫn); RFC7807 cho `401`. Assert **cấu trúc thật** (`items[].birthProfileLabel === null`, không chỉ check `status===200`).

### `DELETE /charts/{id}`
Authenticated success (`204`, verify DB `deleted_at` set); not found (`404`); ownership violation (`403`); invalid ID (`400`); race-condition (đã cover ở M6 unit test, có thể bỏ qua ở API-level); RFC7807 đúng.

---

## 17. Integration/Regression Strategy

Toàn bộ Sprint 0–M6 test (`identity`, `birth-profile`, `chart` unit+integration đã có) phải **tiếp tục pass** sau M7 — đặc biệt `create-natal-chart.usecase.test.ts` (M6) cần cập nhật 2 case theo D-1 (Mục 8 M7-T0), đây là thay đổi **có chủ đích**, không phải regression. Chạy full `npm run test` (không chỉ `chart`) ở M7-T8.

---

## 18. Definition of Done

Giữ nguyên checklist đã đóng băng ở prompt — không rút gọn. Bổ sung 1 điều kiện: D-1 (map-domain-error) phải hoàn thành trước khi "Error mapping follows the existing architecture" được coi là true.

---

## 19. Acceptance Criteria

1. 4 endpoint hoạt động end-to-end qua HTTP thật (Supertest) — Mục 16.
2. `GET /charts` đầy đủ pagination/filter/sort — Mục 16.
3. Ownership isolation — test 2-user tường minh (Mục 16 GET /charts, GET/DELETE /{id}).
4. `npm run generate:openapi` sạch, đủ 4 path — Mục 14.
5. RFC7807 đúng cho mọi lỗi, không có response `{"error": "..."}` ad-hoc nào — Mục 13.
6. D-1 vá xong, verify bằng test cụ thể (M7-T0) — không còn lỗi Domain nào bị wrap thành `500` sai.
7. D-2/D-3 xử lý đúng theo quyết định đã ghi (Mục Discrepancies) — không fabricate dữ liệu.
8. Toàn bộ test Sprint 0–M6 vẫn pass.

---

## 20. Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| D-1 không vá kỹ — bỏ sót 1 trong 8 loại Domain error | Cao | Trung bình | Test riêng từng loại lỗi ở M7-T0, đối chiếu đủ danh sách `chart.errors.ts` |
| `save` bị nhầm là body field | Cao nếu xảy ra | Trung bình | Ghi rõ ràng ở M7-T1, tách file schema riêng để không thể nhầm |
| Quên thêm import side-effect vào `generate-openapi.ts` (đúng bug đã từng xảy ra ở Sprint 2 M8) | Trung bình | Trung bình (tiền lệ đã có) | M7-T8 bắt buộc chạy `npm run generate:openapi` thật, grep output |
| Zod range coordinate không khớp Domain range (M3) | Thấp | Thấp | Xem OQ-4, đã đề xuất khớp sẵn trong schema mẫu |
| `PrismaTestFactory` thiếu method tạo Chart/BirthProfile fixture | Trung bình | Trung bình | Kiểm tra thật ở đầu M7-T7, bổ sung method nếu thiếu |
| Test dùng Swiss Ephemeris thật chậm/flaky trong CI | Thấp | Thấp | Đã là pattern chấp nhận được từ M2 |
| `requireAuth()` trước `validate*` có thể khác UX so với module khác | Thấp | Thấp | Ghi rõ quyết định, nhất quán trong Chart module |

---

## 21. Known Gaps

- **D-2:** `ChartResponse.interpretations` luôn rỗng — chờ Interpretation milestone.
- **D-3:** `ChartSummaryResponse.birthProfileLabel` luôn `null` — chờ milestone bổ sung snapshot field hoặc cross-module contract mới.
- **Rate limiting** (REST API Spec §9) — không implement ở M7, thuộc hạ tầng chung chưa có milestone riêng.
- **Idempotency key** (REST API Spec, nhắc tới cho `POST /charts/natal`) — không có tiền lệ implement ở bất kỳ module nào khác — **không implement ở M7**, ghi nhận future improvement.

---

## 22. Open Questions

### OQ-1 — `birthData.placeName` (inline) — RESOLVED (CONFIRMED, sửa terminology)

**Question:** REST API Spec chỉ mô tả `birthData` là `"CreateBirthProfileRequest-like"`, không liệt kê field cụ thể.
**Quyết định (CONFIRMED):** Giữ `placeName: z.string().min(1)` **bắt buộc** — nhưng **terminology sửa lại chính xác**: đây là **Implementation Decision kế thừa từ M6/domain invariant** (`BirthLocation.create()`, Sprint 2), **không phải "Frozen REST Contract"** — vì chính REST API Spec thừa nhận chưa liệt kê (enumerate) field này tường minh. Ghi đúng bản chất để tránh hiểu nhầm đây là spec đã đóng băng.
**Priority:** Thấp. **Blocks M7:** Không.

### OQ-2 — Thứ tự `requireAuth()` trước hay sau `validate*` middleware — RESOLVED (CONFIRMED)

**Quyết định (CONFIRMED):** `authMiddleware → requireAuth() → validate* → controller` cho mọi protected route. Với Chart, 3 route được xác nhận là protected: `GET /charts`, `GET /charts/:id`, `DELETE /charts/:id` — cả 3 đều áp dụng đúng thứ tự này (đã khớp sẵn với thiết kế M7-T4, không cần sửa code mẫu).
**Priority:** Đã resolve. **Blocks M7:** Không.

### OQ-3 — Biểu diễn OpenAPI cho "optional bearer auth" (`POST /charts/natal`) — RESOLVED (CONFIRMED, đổi recommendation)

**Quyết định (CONFIRMED — thay đổi so với đề xuất ban đầu):** Dùng OpenAPI security alternatives (2 lựa chọn hợp lệ, client chọn 1):
```yaml
security:
  - bearerAuth: []
  - {}
```
Kèm `description` rõ ràng: *"Authentication is optional. When a valid Bearer token is provided, the request is associated with that user; guest requests are allowed only for non-persistent chart calculation."*
**Priority:** Đã resolve. **Blocks M7:** Không.

### OQ-4 — Zod coordinate range có cần khớp chính xác `ChartInputValidator` (M3) hay không — RESOLVED (CONFIRMED)

**Quyết định (CONFIRMED):** Đồng ý hoàn toàn với plan hiện tại — Zod dùng đúng cùng range M3 đã có (`[-90,90]`/`[-180,180]`), đã đưa vào schema mẫu M7-T1.
**Priority:** Đã resolve. **Blocks M7:** Không.

**Không có Open Question nào blocking M7 — cả 4 đã CONFIRMED.**

---

## 23. Recommended Implementation Order

1. M7-T0 (vá D-1) — làm trước tiên vì ảnh hưởng cả `CreateNatalChartUseCase` (M6) lẫn mọi API test sau này.
2. M7-T1 (Schemas) — độc lập, có thể song song T0.
3. M7-T2 (Mappers) — sau T1.
4. M7-T3 (Controller) — sau T1, T2.
5. M7-T4 (Routes) — sau T3.
6. M7-T5 (OpenAPI) — sau T1, T2 (song song được với T3/T4).
7. M7-T6 (Composition root wiring) — sau T3, T4.
8. M7-T7 (API tests) — sau tất cả, cần app chạy được end-to-end.
9. M7-T8 (Review tổng thể) — cuối cùng.

---

## Final Validation

- **Architecture consistency:** PASS — Presentation chỉ gọi Application qua `chart/index.ts`, không đụng Domain/Infrastructure trực tiếp (trừ Mapper đọc Entity nội bộ cùng module, hợp lệ).
- **API contract consistency:** PASS, với 2 ngoại lệ đã ghi rõ (D-2 `interpretations=[]`, D-3 `birthProfileLabel=null`) — không phải FAIL vì đã báo cáo tường minh, có lý do, không phải sai sót.
- **Domain consistency:** PASS — không sửa bất kỳ Domain logic nào (D-1 chỉ thêm tầng dịch lỗi ở Application, không đổi Domain error class).
- **Database consistency:** PASS — không có migration nào ở M7.
- **Authentication consistency:** PASS — tái dùng nguyên `authMiddleware`/`requireAuth()`, đúng Auth Matrix REST API Spec.
- **Error handling consistency:** **FAIL trước khi vá D-1** → **PASS sau M7-T0** — discrepancy đã ghi rõ, hành động cụ thể đã định nghĩa.
- **OpenAPI consistency:** PASS — tái dùng `registry`/`paginatedResponseSchema`/`problemDetailsSchema` có sẵn, không tạo cơ chế mới.
- **Testing consistency:** PASS — Supertest + Swiss Ephemeris thật, đúng pattern `login.api.test.ts`.
- **Module boundary consistency:** PASS — Presentation chỉ import `chart/index.ts` (Application) + `chart/domain/entities/*` (cùng module, cho Mapper) — không import `birth-profile/*` trực tiếp nào ngoài những gì Application (M6) đã tiêu thụ sẵn.
