# Backend Implementation Guide
## AstroViet Platform — Coding Conventions & Implementation Rules

| | |
|---|---|
| **Loại tài liệu** | Backend Implementation Guide |
| **Phiên bản** | 1.1 — đã cập nhật theo phản hồi Product Owner ngày 11/07/2026 (chốt IN-1/IN-2/IN-3, xem cuối tài liệu) |
| **Ngày soạn** | 11/07/2026 (khởi tạo) — cập nhật 11/07/2026 |
| **Tác giả** | Principal Backend Engineer / Tech Lead / Software Architect |
| **Tài liệu nguồn (Single Source of Truth)** | 1. PRD v1.0 · 2. Astrology Domain Specification v1.0 · 3. Astrology Engine Specification v1.0 · 4. REST API Specification v1.1 · 5. Database Design Specification v1.1 · 6. Project Architecture Specification v1.1 |
| **Nguyên tắc kế thừa** | Không thay đổi Business Rules, Domain Model, REST API, Database Schema, Architecture. Mâu thuẫn phát hiện được ghi vào từng mục dưới dạng **"Implementation Note"**, không tự ý sửa |

> **Phạm vi:** Tài liệu này **không giải thích lại kiến trúc** (đã có ở Project Architecture Specification) — chỉ tập trung vào **cách viết code cụ thể**: quy ước, ví dụ đúng/sai, checklist. Đọc song song với Project Architecture Specification khi cần nhắc lại "tại sao".

> **Nguyên tắc quan trọng (áp dụng cho toàn bộ tài liệu):** Mọi package/thư viện cụ thể được nêu trong tài liệu này (`sanitize-html`, `zod-to-openapi`, `bcrypt`, `jsonwebtoken`, `node-cron`, `express-rate-limit`, `pino`, `vitest`, `swisseph-wasm`...) là **default implementation cho MVP**, **không phải ràng buộc kiến trúc**. Chúng có thể được thay thế bằng implementation khác có chức năng tương đương, miễn là: (1) không làm thay đổi Business Rules, (2) không thay đổi REST API Contract, (3) không thay đổi Database Schema, (4) không vi phạm Project Architecture Specification, (5) không ảnh hưởng tới các abstraction (interface/Port) đã được định nghĩa. Nói cách khác: **interface là hợp đồng bắt buộc, implementation cụ thể đứng sau interface là chi tiết có thể thay đổi.**

---


## Mục lục

1. [Module Creation Workflow](#1-module-creation-workflow) · 2. [Folder Creation Rules](#2-folder-creation-rules) · 3. [Layer Responsibilities](#3-layer-responsibilities) · 4. [Dependency Rules](#4-dependency-rules) · 5. [Controller Convention](#5-controller-convention) · 6. [Use Case Convention](#6-use-case-convention) · 7. [Repository Convention](#7-repository-convention) · 8. [Entity Convention](#8-entity-convention) · 9. [DTO Convention](#9-dto-convention) · 10. [Mapper Convention](#10-mapper-convention) · 11. [Validation Convention](#11-validation-convention) · 12. [Error Handling Convention](#12-error-handling-convention) · 13. [Logging Convention](#13-logging-convention) · 14. [Transaction Convention](#14-transaction-convention) · 15. [Prisma Convention](#15-prisma-convention) · 16. [Migration Convention](#16-migration-convention) · 17. [Authentication Implementation](#17-authentication-implementation) · 18. [Authorization Implementation](#18-authorization-implementation) · 19. [External Service Integration](#19-external-service-integration) · 20. [Testing Convention](#20-testing-convention) · 21. [OpenAPI Convention](#21-openapi-convention) · 22. [Environment Variable Convention](#22-environment-variable-convention) · 23. [Configuration Convention](#23-configuration-convention) · 24. [Background Job Convention](#24-background-job-convention) · 25. [Caching Convention](#25-caching-convention) · 26. [Performance Checklist](#26-performance-checklist) · 27. [Security Checklist](#27-security-checklist) · 28. [Pull Request Checklist](#28-pull-request-checklist) · 29. [Module Completion Checklist](#29-module-completion-checklist) · 30. [Common Anti-patterns cần tránh](#30-common-anti-patterns-cần-tránh)

---

## 1. Module Creation Workflow

**Quy tắc:** Tạo module mới (ví dụ tương lai: `notification`) theo đúng thứ tự sau, không nhảy bước:

1. Domain Entity (`domain/entities/`) — dịch trực tiếp từ Domain/DB Spec, chưa có logic I/O.
2. Domain Port (`domain/ports/`) — interface Repository + External Service cần dùng.
3. Domain Error (`domain/errors/`) — các `AppError` subclass đặc thù module.
4. Application Use Case (`application/use-cases/`) — 1 file/1 hành vi, dùng Port (chưa có implementation thật).
5. Infrastructure Repository/Adapter (`infrastructure/`) — implement Port bằng Prisma/thư viện thật.
6. Presentation (`presentation/schemas/` → `controllers/` → `routes/`) — theo đúng REST API Spec.
7. Đăng ký dependency ở `composition-root.ts`.
8. Mount route ở `app.ts`.
9. Viết test song song với bước 1-6 (không để cuối — xem Mục 20).
10. Cập nhật `index.ts` (barrel) — chỉ export đúng Application Service module khác cần.

**Lý do:** Đi từ trong ra ngoài (Domain → Infrastructure → Presentation) đúng hướng phụ thuộc Clean Architecture (Project Architecture Spec Mục 6) — viết Domain trước buộc developer nghĩ về nghiệp vụ trước khi nghĩ về framework/DB.

**Ví dụ đúng:** Viết `chart.entity.ts` xong mới viết `chart-repository.port.ts`, xong mới viết `prisma-chart.repository.ts`.

**Ví dụ sai:** Mở Prisma Studio, tạo bảng, sinh Prisma Client, rồi mới "nghĩ ngược" ra Entity từ cấu trúc bảng — dễ làm Domain Layer rò rỉ khái niệm DB (ví dụ đặt tên field theo snake_case của cột DB thay vì camelCase theo Domain).

**Checklist:**
- [ ] Domain Entity không import gì từ Prisma/Express
- [ ] Port được định nghĩa trước Adapter implement nó
- [ ] Có test cho Use Case trước khi nối Controller thật
- [ ] `index.ts` chỉ export Application Service, không export Entity/Repository nội bộ

---

## 2. Folder Creation Rules

**Quy tắc:** Mọi module bắt buộc đúng khung 4 thư mục (Project Architecture Spec Mục 5), không thêm thư mục cấp cao mới ngoài 4 cái này:

```
modules/<module-name>/
├── domain/           { entities/, ports/, errors/, engine/ (chỉ có ở chart) }
├── application/       { use-cases/, services/ }
├── infrastructure/     { repositories/, adapters/ }
├── presentation/        { controllers/, routes/, schemas/ }
└── index.ts
```

**Lý do:** Cấu trúc đồng nhất giữa mọi module giúp AI Coding Assistant hoặc Developer mới **đoán đúng vị trí file mà không cần hỏi** — đây là mục tiêu cốt lõi của tài liệu này.

**Ví dụ đúng:** `chart/domain/engine/calculators/aspect-calculator.ts` (Engine nằm trong `domain/`, đúng Project Architecture Spec Mục 3.3.1).

**Ví dụ sai:** Tạo `chart/utils/helpers.ts` chứa lẫn lộn cả pure calculation lẫn hàm format response — không rõ thuộc layer nào, vi phạm ranh giới.

**Checklist:**
- [ ] Không có thư mục `utils/`, `helpers/`, `common/` ở cấp module (nếu cần dùng chung → đưa vào `shared/`)
- [ ] Không có file nằm trực tiếp ở gốc module ngoài `index.ts`
- [ ] Tên thư mục con luôn số nhiều (`entities`, `use-cases`, không phải `entity`, `use-case`)

---

## 3. Layer Responsibilities

**Quy tắc (bảng tra nhanh — chi tiết đầy đủ ở Project Architecture Spec Mục 4):**

| Layer | Được viết gì | Cấm viết gì |
|---|---|---|
| Presentation | `req`/`res` handling, Zod parse, gọi 1 Use Case, format response | `if (user.role === 'admin')` business logic phức tạp, gọi Prisma trực tiếp |
| Application | Orchestrate Use Case, mở transaction, gọi Domain + Repository | `res.json(...)`, `req.headers`, biết HTTP status code |
| Domain | Entity, business rule, Engine calculator (pure) | `import { PrismaClient }`, `import express`, bất kỳ `await fetch(...)` nào |
| Infrastructure | Prisma query, gọi external SDK, implement Port | Business rule (ví dụ không tự quyết "warning nào cần thêm" — chỉ trả raw data) |

**Lý do:** Bảng tra nhanh giảm thời gian quyết định "file này nên nằm đâu" khi code — team 1 người/AI Assistant cần tốc độ, không cần đọc lại toàn bộ Architecture Spec mỗi lần.

**Ví dụ đúng:** `SwissEphemerisAdapter.calculateNatal()` chỉ trả `RawEphemerisData` thô — không tự gán `Sign`/`House` (đó là việc của `PlanetCalculator` ở Domain).

**Ví dụ sai:** `PrismaChartRepository.save()` tự thêm logic "nếu house không hội tụ thì thêm warning" — đây là business rule, phải nằm ở Domain/Application, không phải Infrastructure.

**Checklist:**
- [ ] Mỗi file chỉ chứa code thuộc đúng 1 layer
- [ ] Không có business rule nào "lạc" vào Infrastructure
- [ ] Không có Prisma type (`Prisma.ChartGetPayload<...>`) xuất hiện ngoài Infrastructure Layer

---

## 4. Dependency Rules

**Quy tắc:** Hướng import chỉ 1 chiều: `Presentation → Application → Domain ← Infrastructure`. Bắt buộc cấu hình ESLint chặn vi phạm — không dựa vào tự giác.

```js
// .eslintrc — eslint-plugin-boundaries
{
  "boundaries/elements": [
    { "type": "domain", "pattern": "src/modules/*/domain/**" },
    { "type": "application", "pattern": "src/modules/*/application/**" },
    { "type": "infrastructure", "pattern": "src/modules/*/infrastructure/**" },
    { "type": "presentation", "pattern": "src/modules/*/presentation/**" }
  ],
  "rules": {
    "boundaries/element-types": ["error", {
      "rules": [
        { "from": "domain", "disallow": ["application", "infrastructure", "presentation"] },
        { "from": "application", "disallow": ["infrastructure", "presentation"] },
        { "from": "infrastructure", "disallow": ["presentation"] }
      ]
    }]
  }
}
```

**Lý do:** Đây là ứng dụng thực thi (enforceable) của Dependency Inversion (Project Architecture Spec Mục 6) — không có ESLint rule thì quy tắc chỉ là "lời hứa", dễ vỡ khi code gấp gáp.

**Ví dụ đúng:**
```typescript
// application/use-cases/create-natal-chart.usecase.ts
import { IChartRepository } from '../../domain/ports/chart-repository.port'; // OK — Application → Domain
```

**Ví dụ sai:**
```typescript
// domain/engine/chart-builder.ts
import { PrismaClient } from '@prisma/client'; // SAI — Domain → Infrastructure, ESLint phải chặn dòng này
```

**Checklist:**
- [ ] `npm run lint` chạy pass với rule `boundaries/element-types` bật
- [ ] CI pipeline chặn merge nếu vi phạm boundary
- [ ] Không có `// eslint-disable-next-line boundaries/*` nào trong code (nếu có, phải giải thích rõ trong PR — xem Mục 28)

---

## 5. Controller Convention

**Quy tắc:**
- 1 file `*.controller.ts`/module resource, method đặt tên theo hành vi REST (`createNatalChart`, không phải `post`).
- Controller **không chứa `try/catch`** — dùng wrapper `asyncHandler` để lỗi tự động rơi vào Error Handler Middleware (Mục 12).
- Controller chỉ làm 3 việc: lấy input đã validate → gọi đúng 1 Use Case → map kết quả thành Response DTO.

**Lý do:** Controller mỏng giúp business logic 100% test được ở Application/Domain layer mà không cần dựng `req`/`res` giả (Project Architecture Spec Mục 17 — Unit Test rẻ).

**Ví dụ đúng:**
```typescript
// presentation/controllers/chart.controller.ts
export class ChartController {
  constructor(private readonly createNatalChart: CreateNatalChartUseCase) {}

  createNatalChartHandler = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.createNatalChart.execute({
      ...req.body,
      userId: req.user?.id,
      save: req.query.save === 'true',
    });
    res.status(result.saved ? 201 : 200).json(toChartResponseDto(result.chart));
  });
}
```

**Ví dụ sai:**
```typescript
export class ChartController {
  async createNatalChartHandler(req: Request, res: Response) {
    try {
      if (req.body.houseSystem !== 'Placidus' && req.body.houseSystem !== 'WholeSign') { // SAI: business validation trong Controller
        return res.status(422).json({ error: 'invalid house system' });                    // SAI: tự format lỗi thay vì throw AppError
      }
      const chart = await prisma.chart.create({ data: req.body });                          // SAI: gọi thẳng Prisma, bỏ qua Use Case
      res.json(chart);
    } catch (e) { res.status(500).json({ error: e.message }); }                                // SAI: try/catch thủ công, lộ raw error message
  }
}
```

**Checklist:**
- [ ] Không có `try/catch` thủ công trong Controller
- [ ] Không có `if/else` business logic trong Controller
- [ ] Không `import { PrismaClient }` trong Presentation Layer
- [ ] Mọi Controller method dùng `asyncHandler` (hoặc tương đương)

---

## 6. Use Case Convention

**Quy tắc:**
- 1 class `*.usecase.ts` = 1 hành vi nghiệp vụ, có method công khai duy nhất `execute(input): Promise<output>`.
- Constructor nhận **interface** (Port), không nhận implementation cụ thể.
- Use Case không biết `req`/`res`, không biết HTTP status code.
- Input/Output của `execute()` là kiểu TypeScript thuần (không phải Zod schema, không phải Prisma type).

**Lý do:** Ranh giới rõ giữa "1 hành vi = 1 file" (Single Responsibility) giúp mỗi Use Case dễ test độc lập và dễ đọc — khớp REST API Spec Mục 4 (mỗi endpoint = 1 hành vi rõ ràng).

**Ví dụ đúng:**
```typescript
// application/use-cases/create-natal-chart.usecase.ts
export interface CreateNatalChartInput { userId?: string; birthProfileId?: string; birthData?: BirthDataInput; houseSystem: HouseSystemName; save: boolean; }
export interface CreateNatalChartOutput { chart: Chart; saved: boolean; }

export class CreateNatalChartUseCase {
  constructor(
    private readonly chartRepo: IChartRepository,
    private readonly ephemerisProvider: IEphemerisProvider,
    private readonly birthProfileQuery: IBirthProfileQueryService,
    private readonly interpretationLookup: InterpretationLookupService,
  ) {}

  async execute(input: CreateNatalChartInput): Promise<CreateNatalChartOutput> {
    const birthData = input.birthProfileId
      ? await this.birthProfileQuery.getSnapshotData(input.birthProfileId)
      : input.birthData!;
    const chart = await buildChart(birthData, input.houseSystem, this.ephemerisProvider); // Domain
    const withInterpretations = await this.interpretationLookup.attach(chart);
    if (input.save) await this.chartRepo.save(withInterpretations);
    return { chart: withInterpretations, saved: input.save };
  }
}
```

**Ví dụ sai:**
```typescript
export class CreateNatalChartUseCase {
  async execute(req: Request) {                    // SAI: nhận thẳng Express Request
    const chart = await prisma.chart.create({...}); // SAI: gọi Prisma trực tiếp, bỏ qua Repository interface
    return res.json(chart);                          // SAI: Use Case không được biết res
  }
}
```

**Checklist:**
- [ ] Không import `express` trong bất kỳ file `*.usecase.ts` nào
- [ ] Constructor chỉ nhận interface (`I*`), không nhận `PrismaClient` trực tiếp
- [ ] 1 Use Case chỉ có 1 public method (`execute`)
- [ ] Có unit test mock toàn bộ dependency (Mục 20)

---

## 7. Repository Convention

**Quy tắc:**
- Interface (`*-repository.port.ts`) đặt tên method theo **ý định nghiệp vụ**, không phải CRUD chung chung — ví dụ `findActiveByUserId()` thay vì chỉ `find()`.
- Implementation (`prisma-*.repository.ts`) là **nơi duy nhất** import `PrismaClient` cho entity đó.
- Repository trả về **Domain Entity**, không bao giờ trả `Prisma.XxxGetPayload<...>` ra ngoài Infrastructure.
- Repository **không chứa business rule** — chỉ query/persist, mapping do Mapper đảm nhiệm (Mục 10).

**Lý do:** Đặt tên theo ý định giúp Application Layer đọc code như đọc English, không cần đoán "findAll có filter gì bên trong không".

**Ví dụ đúng:**
```typescript
// domain/ports/chart-repository.port.ts
export interface IChartRepository {
  save(chart: Chart): Promise<Chart>;
  findByIdAndUserId(id: string, userId: string): Promise<Chart | null>;
  listByUserId(userId: string, options: { page: number; pageSize: number; birthProfileId?: string }): Promise<{ items: Chart[]; total: number }>;
  softDelete(id: string, userId: string): Promise<void>;
}
```

**Ví dụ sai:**
```typescript
export interface IChartRepository {
  get(params: any): Promise<any>; // SAI: tên mơ hồ, kiểu 'any' — không rõ ý định, không type-safe
}
// và Application Layer gọi thẳng:
const rows = await prisma.chart.findMany({ where: { userId } }); // SAI: bỏ qua Repository interface hoàn toàn
```

**Checklist:**
- [ ] Không có method Repository nào nhận/trả kiểu `any`
- [ ] Không có `PrismaClient` xuất hiện ngoài `infrastructure/repositories/`
- [ ] Tên method mô tả đúng hành vi nghiệp vụ (không phải `get1`, `getAll2`)
- [ ] Soft-delete/version-pinning (DB Spec 14.6/14.2) được implement đúng ở Repository, không ở Use Case

---

## 8. Entity Convention

**Quy tắc:**
- Entity là class/interface TypeScript thuần, field đặt tên **camelCase khớp Domain Spec** (không khớp tên cột DB snake_case).
- Entity có thể chứa method business logic thuần (ví dụ `Chart.hasWarnings(): boolean`), nhưng **không** chứa method I/O.
- Ưu tiên Entity bất biến (`readonly` field) — Chart đặc biệt phải immutable sau khi build (Engine Spec: Deterministic).

**Lý do:** Tách biệt Entity khỏi Prisma Model cho phép Domain Layer không phải sửa lại khi đổi ORM/DB schema tương lai (Project Architecture Spec ADR-004).

**Ví dụ đúng:**
```typescript
// domain/entities/chart.entity.ts
export class Chart {
  constructor(
    public readonly id: string,
    public readonly houseSystem: HouseSystemName,
    public readonly isHouseDataAvailable: boolean,
    public readonly planets: readonly Planet[],
    public readonly warnings: readonly Warning[],
    // ...
  ) {}
  hasWarnings(): boolean { return this.warnings.length > 0; }
}
```

**Ví dụ sai:**
```typescript
import { Chart as PrismaChart } from '@prisma/client'; // SAI: Domain Entity = Prisma type trực tiếp
export type Chart = PrismaChart; // mất khả năng tách biệt Domain khỏi DB schema
```

**Checklist:**
- [ ] Entity không `import` gì từ `@prisma/client`
- [ ] Field name khớp chính xác thuật ngữ Domain Spec (Mục 5), không khớp tên cột DB
- [ ] `Chart` và các entity con không có method `save()`/`update()` tự thân (đó là việc của Repository)

---

## 9. DTO Convention

**Quy tắc:**
- Tên DTO khớp **chính xác 100%** với REST API Spec Mục 5 (`CreateNatalChartRequest`, `ChartResponse`...) — không tự sáng tạo tên khác.
- Request DTO = kiểu suy ra từ Zod schema (`z.infer<typeof schema>`), không viết tay riêng (tránh lệch nhau).
- Response DTO tách biệt hoàn toàn khỏi Domain Entity — có Mapper riêng chuyển đổi (Mục 10).

**Lý do:** DTO là "hợp đồng" với Frontend — sai tên field dù nhỏ (`houseSystem` vs `house_system`) sẽ phá vỡ tích hợp mà không có cảnh báo compile-time nếu không đồng bộ với REST API Spec.

**Ví dụ đúng:**
```typescript
// presentation/schemas/create-natal-chart.schema.ts
export const createNatalChartSchema = z.object({
  birthProfileId: z.string().uuid().optional(),
  birthData: birthDataInputSchema.optional(),
  houseSystem: z.enum(['Placidus', 'WholeSign']),
  includeOptionalPoints: z.array(z.enum(['Chiron','Lilith','NorthNode','SouthNode'])).optional(),
}).refine(d => (!!d.birthProfileId) !== (!!d.birthData), { message: 'EXACTLY_ONE_SOURCE_REQUIRED' });

export type CreateNatalChartRequest = z.infer<typeof createNatalChartSchema>;
```

**Ví dụ sai:**
```typescript
interface CreateChartDto { house: string; profile_id?: string; } // SAI: tên field lệch REST API Spec, viết tay không đồng bộ Zod
```

**Checklist:**
- [ ] Mọi Request/Response DTO có thể tra ngược về đúng bảng ở REST API Spec Mục 5
- [ ] Không có DTO nào viết tay tách rời khỏi Zod schema (`z.infer`)
- [ ] Response DTO không lộ field nội bộ (ví dụ không có `contentSource` — REST API Spec Quyết định 14.1)

---

## 10. Mapper Convention

**Quy tắc:**
- Mapper là **hàm thuần** (không phải class có state), đặt tên `to<Target>()` hoặc `map<Source>To<Target>()`.
- 3 loại mapper cố định: **Prisma Row → Domain Entity** (Infrastructure), **Domain Entity → Response DTO** (Presentation), **Request DTO → Use Case Input** (Presentation/Application boundary).
- Không dùng thư viện auto-mapping (`class-transformer`...) — mapping tường minh dễ debug hơn ở quy mô 1 dev.

**Lý do:** Mapper tường minh là nơi duy nhất "biết" cả 2 phía (VD: Prisma row và Domain Entity) — cô lập rủi ro lệch field vào đúng 1 chỗ, dễ tìm khi debug.

**Ví dụ đúng:**
```typescript
// infrastructure/mappers/chart.mapper.ts
export function toChartEntity(row: PrismaChartRow & { planets: PrismaPlanetRow[] }): Chart {
  return new Chart(row.id, row.houseSystem as HouseSystemName, row.isHouseDataAvailable,
    row.planets.map(toPlanetEntity), row.warnings as Warning[]);
}

// presentation/mappers/chart-response.mapper.ts
export function toChartResponseDto(chart: Chart): ChartResponse {
  return { id: chart.id, houseSystem: chart.houseSystem, isHouseDataAvailable: chart.isHouseDataAvailable,
    planets: chart.planets.map(toPlanetResponseDto), warnings: chart.warnings, /* ... */ };
}
```

**Ví dụ sai:**
```typescript
res.json(chartRowFromPrisma); // SAI: trả thẳng Prisma row ra HTTP response, lộ cột DB nội bộ (vd version, deleted_at)
```

**Checklist:**
- [ ] Không có Controller nào `res.json()` trực tiếp 1 object lấy từ Prisma
- [ ] Mỗi Entity có đúng 1 file mapper tương ứng, dễ tìm theo tên
- [ ] Mapper không chứa business logic (chỉ đổi hình dạng dữ liệu, không tính toán)

---

## 11. Validation Convention

**Quy tắc (nhắc lại nguyên tắc "không trùng lặp" từ Project Architecture Spec Mục 10, cụ thể hóa thành code):**
- Zod schema đặt ở `presentation/schemas/`, chạy qua middleware `validate(schema)` gắn ở route, **trước khi** vào Controller.
- Business validation (cần I/O hoặc cross-field phức tạp) nằm ở Domain/Application — **không** nhồi vào Zod `refine()` nếu cần query DB.
- Không viết lại range check đã có ở Zod tại Use Case.

**Lý do:** Xem Project Architecture Spec Mục 10 — tránh 2 nơi có thể "lệch" quy tắc khi sửa 1 chỗ quên chỗ khác.

**Ví dụ đúng:**
```typescript
// shared/middlewares/validate.middleware.ts
export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return next(new ValidationError('MALFORMED_REQUEST', 'Invalid request body', result.error.flatten()));
  req.body = result.data; next();
};
// route: router.post('/natal', validate(createNatalChartSchema), chartController.createNatalChartHandler);
```

**Ví dụ sai:**
```typescript
// Use Case tự check lại điều Zod đã check
if (input.houseSystem !== 'Placidus' && input.houseSystem !== 'WholeSign') { // SAI: trùng lặp với Zod enum
  throw new ValidationError(...);
}
```

**Checklist:**
- [ ] Mọi route nhận body/query có `validate(schema)` middleware
- [ ] Không có `if` range/format check trùng lặp ở Use Case cho điều Zod đã đảm bảo
- [ ] Business validation cần Engine (vd Placidus not converging) chỉ chạy ở Domain/Application, không cố nhồi vào Zod

---

## 12. Error Handling Convention

**Quy tắc:**
- Mọi lỗi nghiệp vụ **throw** subclass của `AppError` (Project Architecture Spec Mục 9) — không `throw new Error('...')` trần trụi.
- Không `catch` rồi nuốt lỗi im lặng — nếu catch, phải `log` + `rethrow` hoặc chuyển thành `AppError` cụ thể hơn.
- "Lỗi mềm" (Warning — House không hội tụ, Historical Date) **không** dùng cơ chế exception — trả qua field `warnings[]` của kết quả Use Case (Mục 6 ví dụ).

**Lý do:** Error Handler Middleware (đặt 1 nơi duy nhất) chỉ biết xử lý đúng nếu mọi lỗi đều là `AppError` — throw `Error` trần khiến middleware phải đoán mã lỗi/status, dễ sai.

**Ví dụ đúng:**
```typescript
if (existingUser) throw new ConflictError('EMAIL_ALREADY_EXISTS', 'Email đã được sử dụng');
```

**Ví dụ sai:**
```typescript
try {
  await this.geocodingProvider.search(query);
} catch (e) {
  console.log(e); // SAI: nuốt lỗi, không throw lại, Controller vẫn tiếp tục chạy với dữ liệu thiếu
}
```

**Checklist:**
- [ ] Không có `throw new Error(...)` trần (luôn dùng `AppError` subclass)
- [ ] Không có `catch {}` rỗng hoặc chỉ `console.log` rồi bỏ qua
- [ ] Warning không bao giờ được implement bằng `throw`
- [ ] Mọi `AppError` mới thêm có `errorCode` khớp bảng REST API Spec Mục 7

---

## 13. Logging Convention

**Quy tắc:**
- Dùng `logger` (Pino) từ `shared/logger/`, **không bao giờ** `console.log`.
- Log ở Use Case cho sự kiện nghiệp vụ quan trọng (tạo Chart, đăng nhập...), không log ở Domain Layer (giữ Domain pure — không side-effect).
- Không log PII thô (`birthDate`, `password`, token) — chỉ log `id`/metadata.

**Lý do:** Pino structured logging cho phép lọc theo `requestId`/`module` (Project Architecture Spec Mục 14) — `console.log` không có cấu trúc, vô dụng khi debug production.

**Ví dụ đúng:**
```typescript
logger.info({ module: 'chart', action: 'create_natal_chart', userId, chartId: chart.id }, 'Natal chart created');
```

**Ví dụ sai:**
```typescript
console.log('creating chart for', birthData.birthDate, birthData.latitude); // SAI: console.log + lộ PII thô vào log
```

**Checklist:**
- [ ] `grep -r "console.log" src/` trả về rỗng (trừ `shared/logger/` lúc setup)
- [ ] Không có `birthDate`/`birthTime`/`password`/`token` xuất hiện trực tiếp trong log object
- [ ] Mọi log có field `module` để lọc theo module

---

## 14. Transaction Convention

**Quy tắc:**
- **Chỉ Application Layer (Use Case) quyết định** ranh giới transaction cần thiết cho 1 hành vi nghiệp vụ — Repository method **không tự mở transaction ngoài phạm vi được giao**.
- Ghi nhiều bảng liên quan (Chart + Planet + House...) **bắt buộc** `prisma.$transaction()` (Project Architecture Spec Mục 7.2).
- Không transaction lồng transaction (nested) — nếu Use Case A gọi Use Case B, không để cả 2 tự mở transaction riêng.

**Lý do:** Đảm bảo tính nguyên tử cho Aggregate Root nhiều bảng con (DB Design Spec Mục 5.7-5.12) — thiếu transaction ở đây có thể để lại Chart "mồ côi" thiếu Planet nếu crash giữa chừng.

**Ví dụ đúng:** (đã có đầy đủ ở Project Architecture Spec Mục 7.2 — nhắc lại nguyên tắc: `save()` của `PrismaChartRepository` tự bọc `$transaction` bên trong 1 method duy nhất).

**Ví dụ sai:**
```typescript
// Use Case tự ghi rời rạc, không transaction — rủi ro Chart tồn tại mà thiếu Planet nếu lỗi giữa chừng
await chartRepo.saveChartOnly(chart);
await chartRepo.savePlanetsOnly(chart.planets); // nếu dòng trên OK, dòng này lỗi → dữ liệu không nhất quán
```

**Checklist:**
- [ ] Mọi `save()` ghi ≥2 bảng dùng `$transaction`
- [ ] Không có Repository method nào ghi "nửa vời" 1 Aggregate rồi để Use Case tự ghép
- [ ] Test integration xác nhận rollback đúng khi 1 bảng con insert lỗi (Mục 20)

---

## 15. Prisma Convention

**Quy tắc:**
- `schema.prisma` tổ chức theo `@@schema("identity"|"astrology"|"content")` (Prisma multi-schema feature) — khớp 3 schema DB Spec Mục 3.
- Luôn `select` rõ field cần dùng, tránh `select: '*'` ngầm định khi không cần toàn bộ cột (đặc biệt bảng có PII).
- Cấm `$queryRawUnsafe` với input chưa qua Zod; `$queryRaw` (parameterized) chỉ dùng khi Prisma Client không hỗ trợ (ví dụ 1 số partial index đặc thù ở DB Spec Mục 7).

**Lý do:** Multi-schema giữ Prisma schema đồng bộ với ranh giới module đã thiết kế (Project Architecture Spec Mục 3); giới hạn `$queryRawUnsafe` chặn SQL injection ngay từ quy ước code (Mục 27).

**Ví dụ đúng:**
```prisma
model Chart {
  id       String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId   String   @map("user_id") @db.Uuid
  // ...
  @@schema("astrology")
  @@map("charts")
}
```

**Ví dụ sai:**
```typescript
await prisma.$queryRawUnsafe(`SELECT * FROM charts WHERE user_id = '${userId}'`); // SAI: SQL injection risk, và bỏ qua Prisma type-safety hoàn toàn không cần thiết
```

**Checklist:**
- [ ] Không có `$queryRawUnsafe` nào trong codebase với input từ request
- [ ] Mọi model Prisma có `@@schema(...)` đúng 1 trong 3 schema đã định
- [ ] Field DB snake_case luôn có `@map(...)` để Prisma Client trả về camelCase

---

## 16. Migration Convention

**Quy tắc:**
- 1 migration = 1 thay đổi logic (không gộp "thêm bảng X" và "sửa cột Y không liên quan" vào 1 migration).
- Không sửa migration đã chạy ở production — chỉ tạo migration mới (forward-only, Project Architecture Spec Mục 12).
- Seed data (`house_systems`, `languages`) tách file riêng (`prisma/seed.ts`), chạy sau migration, không nhúng trong file migration.

**Lý do:** Forward-only migration đảm bảo lịch sử schema tái lập được ở mọi môi trường (dev/staging/production) — sửa migration cũ có thể làm môi trường đã chạy migration đó và môi trường chưa chạy bị lệch nhau vĩnh viễn.

**Ví dụ đúng:** `npx prisma migrate dev --name add_snapshot_interpretation_version_to_charts`

**Ví dụ sai:** Mở file migration SQL đã merge vào `main` tuần trước, sửa trực tiếp thêm 1 cột — môi trường production đã chạy bản cũ sẽ không bao giờ có cột đó trừ khi chạy tay lại thủ công.

**Checklist:**
- [ ] Tên migration mô tả đúng nội dung thay đổi (không phải `migration1`, `fix`)
- [ ] Không có migration nào bị sửa sau khi đã merge
- [ ] Seed script chạy độc lập, idempotent (chạy lại nhiều lần không tạo trùng dữ liệu — dùng `upsert`)

---

## 17. Authentication Implementation

**Quy tắc:** Implement đúng `ITokenProvider` (Project Architecture Spec Mục 11.1.1) — HS256 cho MVP, refresh token chỉ lưu hash, cookie `HttpOnly + SameSite=Strict`.

```typescript
// infrastructure/adapters/jwt-token.adapter.ts
export class JwtTokenAdapter implements ITokenProvider {
  constructor(private readonly accessSecret: string) {}
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.accessSecret, { algorithm: 'HS256', expiresIn: `${env.JWT_ACCESS_EXPIRY_MINUTES}m` });
  }
  verifyAccessToken(token: string): TokenPayload {
    try { return jwt.verify(token, this.accessSecret) as TokenPayload; }
    catch { throw new AuthenticationError('TOKEN_EXPIRED', 'Access token invalid or expired'); }
  }
}

// shared/middlewares/auth.middleware.ts
export const authenticate = (tokenProvider: ITokenProvider, required = true) =>
  (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      if (required) return next(new AuthenticationError('UNAUTHORIZED', 'Missing token'));
      return next(); // route cho phép Guest (vd POST /charts/natal?save=false)
    }
    req.user = tokenProvider.verifyAccessToken(header.slice(7));
    next();
  };
```

**Ví dụ sai:**
```typescript
const decoded = jwt.decode(token); // SAI: decode() không verify chữ ký — bất kỳ ai cũng tự chế token giả được
req.user = decoded;
```

**Checklist:**
- [ ] Luôn dùng `jwt.verify()`, không bao giờ `jwt.decode()` để xác thực
- [ ] Refresh token raw chỉ tồn tại trong request/response, DB chỉ lưu `token_hash`
- [ ] Cookie set đúng `httpOnly: true, secure: true, sameSite: 'strict'`

---

## 18. Authorization Implementation

**Quy tắc:** Role-check ở middleware (rẻ, sớm); Ownership-check bắt buộc ở Use Case (cần query DB) — không bao giờ chỉ dựa vào Frontend ẩn nút bấm.

```typescript
// shared/middlewares/require-role.middleware.ts
export const requireRole = (...roles: Array<'user'|'admin'>) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new AuthorizationError('FORBIDDEN', 'Insufficient role'));
  next();
};

// application/use-cases/get-chart.usecase.ts
async execute(input: { chartId: string; requestingUserId: string }): Promise<Chart> {
  const chart = await this.chartRepo.findByIdAndUserId(input.chartId, input.requestingUserId);
  if (!chart) throw new NotFoundError('RESOURCE_NOT_FOUND', 'Chart not found'); // 404, không lộ "tồn tại nhưng không phải của bạn"
  return chart;
}
```

**Ví dụ sai:**
```typescript
const chart = await chartRepo.findById(chartId); // SAI: không lọc theo userId — user A đọc được Chart của user B
res.json(chart);
```

**Checklist:**
- [ ] Mọi Repository method `findById` có tham số `userId` đi kèm cho resource sở hữu cá nhân
- [ ] Không có endpoint Admin-only nào thiếu `requireRole('admin')`
- [ ] Trả `404` (không phải `403`) khi resource tồn tại nhưng không thuộc về user — tránh lộ thông tin tồn tại của resource người khác

---

## 19. External Service Integration

**Quy tắc:** Mọi lỗi từ SDK bên ngoài (Swiss Ephemeris, Geocoding) bọc lại thành `ExternalServiceError` — không để raw error (có thể chứa stack trace thư viện ngoài) rò rỉ ra response.

```typescript
// infrastructure/adapters/swiss-ephemeris.adapter.ts
export class SwissEphemerisAdapter implements IEphemerisProvider {
  async calculateNatal(request: EphemerisRequest): Promise<RawEphemerisData> {
    try {
      const raw = await swissephWasm.calculate(request.utcDateTime, request.coordinates);
      return mapToRawEphemerisData(raw);
    } catch (err) {
      logger.error({ module: 'chart', err }, 'Ephemeris calculation failed');
      throw new ExternalServiceError('EPHEMERIS_PROVIDER_ERROR', 'Không thể tính toán vị trí thiên thể');
    }
  }
  async calculateTransit(): Promise<RawEphemerisData> { throw new ValidationError('UNSUPPORTED_CHART_TYPE', 'Transit chưa được hỗ trợ'); }
}
```

**Ví dụ sai:**
```typescript
const raw = await swissephWasm.calculate(...); // SAI: không try/catch — nếu thư viện throw lỗi lạ, Error Handler chỉ biết trả 500 chung chung, mất log context hữu ích
```

**Checklist:**
- [ ] Mọi Adapter có `try/catch` bọc call SDK ngoài, log kèm `module` + context
- [ ] Không expose raw error message của thư viện ngoài ra API response
- [ ] `IEphemerisProvider`/`IGeocodingProvider` là interface duy nhất Application Layer biết — không import SDK trực tiếp ở Application

### 19.1 `IHtmlSanitizer` — abstraction cho `article.body` (Quyết định IN-1)

Cùng nguyên tắc như `IEphemerisProvider`/`ITokenProvider`/`ICacheProvider` (Project Architecture Spec Mục 12) — **`sanitize-html` là default implementation cho MVP**, không phải ràng buộc kiến trúc. `article` module Application Layer chỉ biết interface, không import `sanitize-html` trực tiếp:

```typescript
// modules/article/domain/ports/html-sanitizer.port.ts
export interface IHtmlSanitizer {
  sanitize(rawHtml: string): string;
}

// modules/article/infrastructure/adapters/sanitize-html.adapter.ts
import sanitizeHtml from 'sanitize-html';
export class SanitizeHtmlAdapter implements IHtmlSanitizer {
  sanitize(rawHtml: string): string {
    return sanitizeHtml(rawHtml, { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']), allowedAttributes: { img: ['src', 'alt'] } });
  }
}

// application/use-cases/create-article.usecase.ts
export class CreateArticleUseCase {
  constructor(private readonly articleRepo: IArticleRepository, private readonly htmlSanitizer: IHtmlSanitizer) {}
  async execute(input: CreateArticleInput): Promise<Article> {
    const cleanBody = this.htmlSanitizer.sanitize(input.body); // Use Case không biết "sanitize-html" tồn tại
    return this.articleRepo.save(new Article(/* ... */ cleanBody));
  }
}
```

**Ví dụ sai:**
```typescript
// application/use-cases/create-article.usecase.ts
import sanitizeHtml from 'sanitize-html'; // SAI: Application Layer import thẳng thư viện cụ thể — vi phạm Dependency Inversion, khó thay thư viện khác sau này
```

**Checklist bổ sung:**
- [ ] `create-article.usecase.ts`/`update-article.usecase.ts` chỉ nhận `IHtmlSanitizer` qua constructor, không `import sanitize-html` trực tiếp
- [ ] Thay `sanitize-html` bằng thư viện khác chỉ cần viết `Adapter` mới implement `IHtmlSanitizer`, không sửa Use Case

---

## 20. Testing Convention

**Quy tắc:**
- Unit test (Domain/Use Case) đặt co-located (`*.test.ts` cạnh file nguồn — Project Architecture Spec Mục 17.1).
- Pattern AAA: `// Arrange` → `// Act` → `// Assert`, không viết test dài dòng khó đọc.
- Mock qua interface (Port), không mock Prisma trực tiếp trong Unit Test.
- Integration Test dùng DB thật (Docker Compose test DB), `truncate` giữa các test, không xóa cả DB.

**Ví dụ đúng:**
```typescript
// application/use-cases/create-natal-chart.usecase.test.ts
describe('CreateNatalChartUseCase', () => {
  it('trả về houses rỗng khi isBirthTimeKnown=false', async () => {
    // Arrange
    const fakeEphemeris: IEphemerisProvider = { calculateNatal: vi.fn().mockResolvedValue(fixtureRawEphemeris) };
    const useCase = new CreateNatalChartUseCase(fakeChartRepo, fakeEphemeris, fakeBirthProfileQuery, fakeInterpretationLookup);
    // Act
    const result = await useCase.execute({ birthData: fixtureBirthDataUnknownTime, houseSystem: 'Placidus', save: false });
    // Assert
    expect(result.chart.houses).toEqual([]);
    expect(result.chart.isHouseDataAvailable).toBe(false);
  });
});
```

**Ví dụ sai:**
```typescript
it('works', async () => { // SAI: tên test không mô tả hành vi
  const result = await useCase.execute(realPrismaData); // SAI: unit test chạm DB thật
  expect(result).toBeTruthy(); // SAI: assertion quá lỏng, không kiểm tra đúng field nào
});
```

**Checklist:**
- [ ] Tên test mô tả rõ hành vi (`it('trả về houses rỗng khi...')`, không phải `it('works')`)
- [ ] Unit test không cần Docker/DB chạy mới pass được
- [ ] Coverage đạt mục tiêu đã chốt ở Project Architecture Spec Mục 17 (Domain ≥90%, Application ≥80%) — con số này **kế thừa nguyên trạng**, Guide chỉ nhắc lại để tiện tra cứu, không phải yêu cầu mới (xem IN-3 cuối tài liệu)
- [ ] Có ít nhất 1 Integration Test xác nhận transaction rollback đúng (Mục 14)

---

## 21. OpenAPI Convention

**Quy tắc:** Sinh OpenAPI 3.1 spec **từ chính Zod schema** (nguyên tắc kiến trúc bắt buộc: 1 nguồn duy nhất, không viết tay `openapi.yaml` song song — 2 nguồn dễ lệch nhau). `zod-to-openapi` là **default implementation cho MVP** để hiện thực hóa nguyên tắc này (Quyết định IN-2) — **không phải ràng buộc kiến trúc**; có thể thay bằng công cụ tương thích khác miễn vẫn generate từ Zod schema, không viết tay song song.

```typescript
// presentation/schemas/create-natal-chart.schema.ts
extendZodWithOpenApi(z);
export const createNatalChartSchema = z.object({ /* ... */ }).openapi('CreateNatalChartRequest');
```

**Ví dụ sai:** Viết `docs/openapi.yaml` thủ công, quên cập nhật khi đổi Zod schema — Swagger UI hiển thị sai hợp đồng thực tế.

**Checklist:**
- [ ] `openapi.yaml`/`openapi.json` được generate qua script (`npm run generate:openapi`), không sửa tay
- [ ] Mọi Response DTO có `.openapi('<TênDTOKhớpMục5RESTAPISpec>')`
- [ ] CI có bước kiểm tra OpenAPI spec generate không lỗi (fail nếu Zod schema thiếu `.openapi()`)

---

## 22. Environment Variable Convention

**Quy tắc:** Tên biến SCREAMING_SNAKE_CASE, có file `.env.example` liệt kê đầy đủ (không giá trị thật), mọi biến bắt buộc phải có trong Zod `envSchema` (Project Architecture Spec Mục 13.1) — thiếu biến = app không khởi động được (fail-fast).

**Ví dụ đúng:** `.env.example` luôn đồng bộ khi thêm biến mới trong `env.config.ts`, commit cùng PR.

**Ví dụ sai:** `process.env.SOME_NEW_KEY` dùng trực tiếp ở 1 file nghiệp vụ mà không khai báo trong `envSchema` — app vẫn "chạy được" (giá trị `undefined`) nhưng lỗi xuất hiện muộn, khó truy vết.

**Checklist:**
- [ ] Không có `process.env.*` nào xuất hiện ngoài `config/env.config.ts`
- [ ] `.env.example` khớp 100% danh sách biến trong `envSchema`
- [ ] Biến nhạy cảm (secret, API key) không có giá trị thật trong `.env.example`

---

## 23. Configuration Convention

**Quy tắc:** Toàn bộ code nghiệp vụ import `env` (typed object) từ `config/env.config.ts` — **không bao giờ** đọc `process.env` rải rác nhiều nơi.

**Ví dụ đúng:** `rateLimitMiddleware(env.RATE_LIMIT_USER)`

**Ví dụ sai:** `const limit = process.env.RATE_LIMIT_USER ?? 300;` lặp lại default value ở nhiều file — sửa 1 chỗ quên chỗ khác.

**Checklist:**
- [ ] Default value của config chỉ định nghĩa **đúng 1 lần** trong `envSchema` (Zod `.default(...)`)
- [ ] Không có "magic number" cấu hình rải rác trong code nghiệp vụ

---

## 24. Background Job Convention

**Quy tắc:** Job định kỳ (`node-cron`) đặt ở `shared/jobs/`, đặt tên rõ hành vi, **bắt buộc idempotent** (chạy lại nhiều lần không gây lỗi/trùng lặp). Nhắc lại ràng buộc quan trọng: **chỉ chạy đúng 1 instance** (Project Architecture Spec Quyết định 22.5) — không tự thêm cluster mode mà không cập nhật cơ chế lock.

```typescript
// shared/jobs/cleanup-expired-refresh-tokens.job.ts
cron.schedule('0 3 * * *', async () => {
  const deleted = await refreshTokenRepo.hardDeleteExpired();
  logger.info({ module: 'jobs', job: 'cleanup-expired-refresh-tokens', deleted }, 'Job completed');
});
```

**Ví dụ sai:** Viết job trực tiếp trong `app.ts` lẫn với route setup — khó tìm, khó test riêng, không rõ lịch chạy.

**Checklist:**
- [ ] Mỗi job có file riêng ở `shared/jobs/`, log rõ khi bắt đầu/kết thúc
- [ ] Job chạy lại 2 lần liên tiếp không gây lỗi (idempotent — kiểm tra bằng test)
- [ ] README ghi rõ ràng buộc "chỉ 1 instance" cho người deploy sau này

---

## 25. Caching Convention

**Quy tắc:** Mọi cache đi qua `ICacheProvider` (Project Architecture Spec Mục 12) — không gọi thẳng `Map`/thư viện cache khác trong Use Case. Cache key theo format cố định `<module>:<entity>:<key>` để tránh đụng namespace.

```typescript
// application/services/interpretation-lookup.service.ts
const cacheKey = `chart:interpretation:${subjectType}:${subjectKey}:${language}:${version}`;
const cached = await this.cacheProvider.get(cacheKey);
if (cached) return cached;
const fresh = await this.interpretationRepo.find(subjectType, subjectKey, language, version);
await this.cacheProvider.set(cacheKey, fresh, { ttlSeconds: 3600 });
```

**Ví dụ sai:** `const localCache = new Map();` khai báo module-scope trong 1 file Use Case — không TTL, leak memory dần, không thay được bằng Redis sau này qua DI.

**Checklist:**
- [ ] Không có `Map`/biến cache thủ công nào ngoài `InMemoryCacheAdapter` (đúng 1 implementation)
- [ ] Cache key theo đúng format `<module>:<entity>:<key>`
- [ ] Mọi `set()` có `ttlSeconds` tường minh, không cache vĩnh viễn không rõ lý do

---

## 26. Performance Checklist

- [ ] Mọi endpoint list (`GET /birth-profiles`, `/charts`, `/articles`) áp dụng pagination, không trả toàn bộ bảng
- [ ] `ChartResponse` build Interpretation qua **1 batch query** (`WHERE (subject_type, subject_key) IN (...)`), không N+1 query từng Planet/Aspect riêng lẻ (Project Architecture Spec Mục 11 — cảnh báo hiệu năng)
- [ ] Prisma `select` chỉ định rõ field cần, không kéo hết cột
- [ ] `compression()` middleware bật ở `app.ts`
- [ ] Index đã tạo khớp đúng pattern query thật sự dùng (đối chiếu DB Design Spec Mục 7) — không thêm index "phòng khi cần"
- [ ] Reference data (`house_systems`, `languages`) cache in-memory, không query DB mỗi request

---

## 27. Security Checklist

- [ ] `helmet()` bật toàn cục
- [ ] CORS whitelist đúng domain Frontend, không `origin: '*'` khi có credentials
- [ ] Rate Limiter áp đúng theo Rate Limit Policy (REST API Spec 14.13), route `POST /charts/natal` không bị bỏ sót
- [ ] Không có `$queryRawUnsafe` với input người dùng
- [ ] `article.body` sanitize qua `IHtmlSanitizer` (Mục 19.1) trước khi lưu — không gọi thẳng `sanitize-html` từ Use Case
- [ ] Password hash `bcrypt` cost ≥ 12, không log password/token thô
- [ ] Refresh token chỉ lưu hash, cookie `HttpOnly + SameSite=Strict`
- [ ] Mọi route nhận input có Zod schema validate (Mục 11) — không có route "quên" validate
- [ ] Response lỗi 500 không lộ stack trace/raw error message ra ngoài (Mục 9.3 Error Handler)

---

## 28. Pull Request Checklist

- [ ] `npm run lint` pass (bao gồm ESLint boundary rule — Mục 4)
- [ ] `npm run test` pass, coverage không giảm so với `main`
- [ ] Không có `console.log` sót lại
- [ ] Không có `any` mới thêm mà không có comment giải thích lý do bắt buộc
- [ ] Nếu đổi Prisma schema → có migration kèm theo, đã chạy `prisma migrate dev` local
- [ ] Nếu thêm/đổi endpoint → OpenAPI spec đã regenerate (Mục 21), REST API Spec đã đối chiếu khớp
- [ ] Nếu phát hiện mâu thuẫn với 6 tài liệu nguồn → đã ghi vào Implementation Note tương ứng, không tự sửa tài liệu gốc
- [ ] PR description nêu rõ: Use Case nào thay đổi, có breaking change API không

---

## 29. Module Completion Checklist

*(Definition of Done cho 1 module hoàn chỉnh — ví dụ áp dụng khi hoàn thành module `chart`)*

- [ ] Đủ 4 layer (`domain/application/infrastructure/presentation`) + `index.ts` barrel đúng convention (Mục 2)
- [ ] Mọi endpoint của module trong REST API Spec Mục 4 đã có Controller + Route + Use Case tương ứng
- [ ] Mọi Validation Rule (REST API Spec Mục 6) đã có Zod schema tương ứng
- [ ] Mọi Business Rule liên quan (Domain Spec/Engine Spec) có Unit Test xác nhận đúng hành vi
- [ ] Repository implement đầy đủ method Interface yêu cầu, có Integration Test
- [ ] Error Response khớp đúng bảng REST API Spec Mục 7 (test qua API Test — Mục 20)
- [ ] Không có ESLint boundary violation, không cảnh báo TypeScript `strict` mode
- [ ] OpenAPI spec của module đã generate và review

---

## 30. Common Anti-patterns cần tránh

| # | Anti-pattern | Vì sao sai | Cách đúng |
|---|---|---|---|
| 1 | **Fat Controller** — business logic nằm trong Controller | Không test được mà không dựng `req`/`res`; vi phạm Mục 5 | Chuyển toàn bộ logic vào Use Case |
| 2 | **God Use Case** — 1 Use Case làm quá nhiều việc (vừa tạo Chart vừa gửi email vừa update Preferences) | Vi phạm Single Responsibility, khó test, khó tái sử dụng | Tách thành nhiều Use Case nhỏ, orchestrate ở tầng cao hơn nếu cần |
| 3 | **Domain Layer import Prisma/Express** | Phá vỡ Dependency Inversion, Domain không còn test độc lập được | Định nghĩa Port, implement ở Infrastructure (Mục 4) |
| 4 | **Validate trùng lặp** ở cả Zod và Use Case cho cùng 1 rule | Dễ lệch khi sửa 1 chỗ quên chỗ kia (Mục 11) | Phân định rõ: format/range → Zod; business context → Domain |
| 5 | **Throw `Error` trần thay vì `AppError`** | Error Handler không map đúng status/errorCode (Mục 12) | Luôn dùng `AppError` subclass |
| 6 | **Catch rồi nuốt lỗi im lặng** | Lỗi biến mất, hệ thống tiếp tục chạy với state sai mà không ai biết | Log + rethrow hoặc chuyển `AppError` cụ thể |
| 7 | **N+1 query khi build Interpretation cho Chart** | Với ~10+ Planet/House/Aspect/Pattern mỗi Chart, N+1 gây chậm nghiêm trọng (Mục 26) | Batch query 1 lần theo danh sách `subjectKey` |
| 8 | **Trộn lẫn Snapshot và Live data** — đọc `birthProfile` runtime thay vì dùng `chart.snapshot_*` | Phá vỡ tính bất biến của Chart đã lưu (DB Spec Quyết định 14.8) | Luôn dùng cột `snapshot_*` đã lưu trên `charts`, không JOIN sống tới `birth_profiles` khi hiển thị Chart cũ |
| 9 | **Cross-module deep import** (`import { X } from '../../other-module/domain/...'`) | Phá ranh giới Modular Monolith (Project Architecture Spec Mục 8) | Chỉ import từ `index.ts` (barrel) của module khác |
| 10 | **Quên version pinning khi JOIN Interpretation** — JOIN `interpretation_contents` không kèm điều kiện `version` | Chart cũ vô tình hiển thị nội dung mới nhất thay vì nội dung đã ghim (DB Spec Quyết định 14.2, ADR-007) | Luôn JOIN kèm `version = chart.snapshotInterpretationVersion` |
| 11 | **Hard-code enum thay vì tra `ReferenceData` module** | `houseSystem`/`language` không đồng bộ khi thêm giá trị mới ở DB | Luôn validate qua `HouseSystemService.isSupported()`/`LanguageService.isSupported()` |
| 12 | **Bật PM2 cluster mode (`-i max`) mà không kiểm tra `node-cron`/in-memory cache** | Job chạy trùng lặp, rate limit đếm sai (Project Architecture Spec Quyết định 22.5) | Giữ `-i 1` cho đến khi chuyển sang Redis + scheduler-safe lock |

---

## Implementation Notes (mâu thuẫn/khoảng trống phát hiện khi viết Guide này)

> **Cập nhật 11/07/2026:** Cả 3 mục dưới đây đã được Product Owner review và chốt quyết định. Xem thêm nguyên tắc chung "default implementation, không phải ràng buộc kiến trúc" ở đầu tài liệu — áp dụng cho mọi package cụ thể được nêu trong toàn bộ Guide này, không chỉ 3 mục dưới đây.

| # | Ghi nhận ban đầu | ✅ Quyết định cuối cùng |
|---|---|---|
| IN-1 | REST API Spec và DB Design Spec không quy định rõ thư viện sanitize HTML cụ thể cho `article.body` | **Giữ `sanitize-html` làm default implementation**, nhưng bổ sung `IHtmlSanitizer` abstraction (Mục 19.1) — `article` module Application Layer chỉ biết interface, không phụ thuộc trực tiếp package cụ thể. Đã áp dụng: thêm Mục 19.1 với interface/adapter đầy đủ, cập nhật Mục 27 checklist |
| IN-2 | Chưa tài liệu nào chỉ định cụ thể thư viện sinh OpenAPI từ Zod | Xác nhận `zod-to-openapi` chỉ là **default implementation cho MVP, không phải yêu cầu kiến trúc** — có thể thay bằng công cụ tương thích khác miễn vẫn generate từ Zod schema (không viết tay song song). Đã áp dụng: cập nhật Mục 21 để nói rõ ràng buộc kiến trúc thật sự (1 nguồn sinh spec) tách biệt khỏi lựa chọn công cụ cụ thể |
| IN-3 | Coverage Goal cụ thể (Domain ≥90%, Application ≥80%) | Xác nhận **kế thừa nguyên trạng** từ Project Architecture Spec Mục 17 — Guide chỉ tham chiếu lại để tiện cho lập trình viên, **không tạo yêu cầu mới**. Đã áp dụng: cập nhật ghi chú ở Mục 20 checklist |

**Nguyên tắc tổng quát rút ra (áp dụng ngược lại cho toàn bộ 30 mục ở trên):** Bất kỳ package cụ thể nào được nêu trong tài liệu này (`bcrypt`, `jsonwebtoken`, `node-cron`, `express-rate-limit`, `pino`, `vitest`/`supertest`, `swisseph-wasm`, `sanitize-html`, `zod-to-openapi`...) đều là **lựa chọn implementation mặc định**, không phải điều khoản kiến trúc bất biến — miễn thay thế không phá vỡ Business Rules/REST API Contract/Database Schema/Project Architecture Specification/abstraction đã định nghĩa, việc đổi thư viện cụ thể là quyết định kỹ thuật bình thường, không cần coi là "sửa tài liệu nguồn".
