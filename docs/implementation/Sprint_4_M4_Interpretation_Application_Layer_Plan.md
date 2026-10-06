# Sprint 4 M4 — Interpretation Application Layer

**Vị trí đề xuất:** `docs/implementation/Sprint_4_M4_Interpretation_Application_Layer_Plan.md`
**Phiên bản:** 1.1 — Owner đã xác nhận O-M4-1..5 (Mục 25). Còn 3 điểm nhỏ cần xác nhận trước khi viết code hoặc đóng Task 3 (Mục 25, 34)
**Dựa trên:** audit trực tiếp nhánh `dev` tại `db4a008` (clone mới, 2026-10-05); prompt M4; Sprint 4 Implementation Plan v1.1 §9–§15, §34; plan và Evidence Matrix M1/M2/M3 (gồm phần v2 của M3); DB Design Spec §5.13; Project Architecture Spec §3.3, §12; REST API Spec §5.4, §14.1, §14.9.
**Quy ước nguồn bằng chứng:** `[repo]` đọc từ mã nguồn tại `db4a008`; `[spec]` đọc từ tài liệu; `[evidence]` Evidence Matrix/log/CI đã nhận; `UNVERIFIED` nghĩa là chưa có bằng chứng.
**Yêu cầu bổ sung của owner (ngoài prompt):** gộp các điểm còn tồn đọng của M3 (và KG-M1-03) vào M4 thành task riêng. Việc này **trái** câu "không âm thầm gộp việc của M3 vào M4" trong prompt, nên được ghi tường minh là ngoại lệ có chủ đích (D-M4-14), tách thành Task 3.

---

## 1. Sprint Overview

M1 dựng persistence, M2 dựng domain thuần, M3 dựng provider-với-dữ-liệu-thật và pipeline nội dung (validator, seeder, CLI, 252 mục `Published` v`1.0`). M4 nối chúng vào hai use case có sẵn:

```
CreateNatalChartUseCase / GetChartUseCase
        │
        ▼
InterpretationLookupService  (application/services — MỚI)
        ├─ deriveInterpretationSubjects(chart)        (domain, M2)
        ├─ chọn version (ghim | mới nhất Published)    (compareContentVersion, M2)
        └─ IInterpretationContentProvider              (port, M2/M1)
                 └─ PrismaInterpretationContentProvider (infrastructure, M1; nối ở composition root)
```

M4 là milestone **application**: không đổi API/`ChartResponse`, không đổi engine tính toán, không đổi schema DB. Kết quả diễn giải được tính và trả về từ use case dưới dạng `{ chart, interpretation }`; việc đưa vào response HTTP là M5.

## 2. M1–M3 Prerequisite Verification

**Kết luận: M1, M2, M3 đã triển khai thật. Không kích hoạt `NOT READY`.** Hai điểm lệch nhỏ giữa prompt và thực tế nêu cuối bảng.

| Hạng mục | Kết quả | Nguồn |
|---|---|---|
| M1: `Language`, `InterpretationContent`, `AngleInSign` (CHECK), migration `20261004120000_...`, `vi` bootstrap, `Chart.snapshotInterpretationVersion`, `database.helper.ts`, provider, test tích hợp | Có đủ; provider `PrismaInterpretationContentProvider` (`findPublishedVersions`, `findPublishedContents`, `insertMany`) | [repo], [evidence] M1 v2 |
| M2: subject types, grammar, `deriveInterpretationSubjects`, `enumerateMvpInterpretationSubjects`, `compareContentVersion`, `isValidContentVersion`, port `IInterpretationContentProvider`, test domain | Có đủ trong `chart/domain/{interpretation,types,ports,errors}/` | [repo], [evidence] M2 |
| M3: validator, seeder, CLI `prisma:seed:content`, 252 mục `Published` v`1.0` (`interpretations.vi.json`) | Có; CI backend run #240 Success trên `db4a008` | [repo], [evidence] M3 v2 |
| `InterpretationLookupService` hay service application nào khác | **Không tồn tại.** `chart/application/` chỉ có `errors/`, `shared/`, `use-cases/` | [repo] |
| `InterpretationResult`/`InterpretationItem` | **Không tồn tại** trong code (chỉ có `InterpretationContentRecord`, M1) | [repo] |
| Wiring provider trong `composition-root.ts` | **Chưa có** (đúng quyết định O-M3-4 hoãn sang M4) | [repo] |

Lệch giữa prompt và repo (repo thắng, không mở lại FD):

| Prompt nói | Thực tế | Xử lý |
|---|---|---|
| M3 là "Interpretation Engine" | M3 là Infrastructure & Content Pipeline | Không có "engine/domain service" của M3 để tái dùng; M4 **tạo mới** service chứ không "refine" (D-M4-01) |
| Stack "CommonJS" | ESM (`"type": "module"`, NodeNext, import `.js`) | Theo ESM |
| "Prefer 3 tasks max" | Owner yêu cầu gộp việc tồn đọng M3 | 4 task (Mục 23) |

Gap tồn đọng được xử lý trong M4 (Task 3): KG-M1-03, KG-M3-09, KG-M3-10 (code/tài liệu) và KG-M3-11, KG-M3-12/13/14 (quyết định nội dung của owner). KG-M3-08/KG-M2-04 **không còn là gap** (D-M4-15: plan là blueprint tạm thời, chỉ Evidence Matrix được lưu). Không gap nào chặn Task 1–2.

## 3. Repository Audit

| Chủ đề | Thực tế ([repo] tại `db4a008`) |
|---|---|
| Use case Create | `chart/application/use-cases/create-natal-chart.usecase.ts`. Constructor: `(getBirthProfileSnapshotUseCase, chartBuilder, chartRepository)`. `execute(command): Promise<Chart>`. Luồng: (1) invariant `birthProfileId` XOR `birthData`; (2) Guest + `save=true` → `AuthenticationError`; (2b) Guest + `birthProfileId` → `AuthenticationError`; (3) resolve birth data (snapshot hoặc inline); (4) `EngineInput.create(...)`; (5) `chartBuilder.build({ id: randomUUID(), userId, birthProfileId, engineInput })` trong `try/catch` → `mapChartDomainErrorToAppError`; (6) `if (command.save) await chartRepository.save(chart)`; trả `chart` |
| Use case Get | `get-chart.usecase.ts`. Constructor `(chartRepository)`. `findById` → `NotFoundError('Chart not found')` nếu null → `assertChartOwnership(chart, requestingUserId)` → trả `Chart` |
| `ChartBuilder` | `domain/engine/chart-builder.ts`. `constructor(ephemerisProvider)`. `ChartBuilderInput { id, userId, birthProfileId, engineInput }`. Cuối `build()` gọi `Chart.create({... createdAt: new Date(), deletedAt: null })`; **chưa truyền** `snapshotInterpretationVersion` |
| `Chart` | `ChartProps.snapshotInterpretationVersion?: string \| null` (M1); getter chuẩn hoá về `null`. Entity bất biến |
| Composition root | `src/composition-root.ts`, hàm `bootstrapApplication`: khởi tạo thủ công (`new`) repository → use case → controller; `logger = defaultLogger` (`PinoLogger`, `ILogger`); trả `{ app, useCases, repositories: { chartRepository }, providers: { ephemerisProvider }, shutdown }`. Không có DI container hay service locator |
| Controller | `presentation/controllers/chart.controller.ts`: `const chart = await createNatalChartUseCase.execute(command)` → `ChartResponseMapper.toResponse(chart)` (dòng 43–45); tương tự Get (dòng 51–52) |
| Response mapper | `chart-response.mapper.ts`: `interpretations: []` (D-2, Known Gap G-01) — **không đổi trong M4** |
| Lỗi | `mapChartDomainErrorToAppError` chỉ map các lỗi engine/domain Sprint 3 và **ném lại** lỗi lạ. `InfrastructureError(message, details?, cause?)` kế thừa `AppError` (500) |
| Logger | `ILogger` ở `shared/logger/logger.interface.ts`; tiền lệ inject vào use case (`RegisterUserUseCase`) |
| Tests liên quan | `tests/unit/modules/chart/application/use-cases/create-natal-chart.usecase.test.ts` (17 ca `it`; dùng `vi.fn()` cho builder/repository, `{} as Chart`), `get-chart.usecase.test.ts` (5 ca), `tests/unit/modules/chart/domain/engine/chart-builder.test.ts`; `tests/golden/astrology-engine.golden.test.ts` và `tests/integration/.../prisma-chart.repository.test.ts` gọi `chartBuilder.build({...})` |
| Chưa có test cho composition root | `tests/api/` và E2E khởi tạo app thật qua `bootstrapApplication` (đủ làm bằng chứng wiring) |
| KG-M1-03 | `{ cause: error }` truyền vào tham số `details` (tham số 2) của `InfrastructureError`: `prisma-chart.repository.ts` dòng 45, 72, 123, 142 (đã đọc); `prisma-birth-profile.repository.ts` dòng 23, 27, 43 (đã đọc), dòng 77/105/107/126 cùng dạng nhưng **chưa đọc chi tiết**. `mapErrorToProblemDetails` đưa `details` (trừ `errors`) vào response dưới khoá `metadata`, **không có lọc theo status** (`problem-details.ts`) |
| Tham chiếu sample cũ | `prisma/seed-content.ts:34` và `prisma/README.md:45` còn nhắc `interpretations.vi.sample.json` (file đã xoá) |
| `scripts/generate-interpretations.ts` | Còn trong repo; đọc `scripts/data/*.json` (không có trong repo); ghi `contentSource: 'Hybrid'` trong khi `interpretations.vi.json` ghi `HumanAuthored` |

## 4. Documentation / Specification Audit

| Tài liệu | Điều liên quan M4 |
|---|---|
| Architecture Spec §3.3 | Service lookup ở `chart/application/services/interpretation-lookup.service.ts` (Application layer) → vị trí service (D-M4-01) |
| Architecture Spec §12 | Port `IInterpretationContentProvider` ở `chart/domain/ports/`; ADR-007: luôn JOIN kèm `version` |
| DB Spec §5.13 | `snapshot_interpretation_version` nullable; chỉ `Published` được dùng khi build response; "version mới phải đủ mọi `subject_key`" |
| REST API Spec §5.4/§14.1/§14.9 | Interpretation nhúng trong `ChartResponse`, không endpoint riêng; chart thiếu nhà → không có `PlanetInHouse`/`Angle` |
| Sprint 4 Plan v1.1 §9.2, §11, §15, §16, §34 | **Nguồn quy tắc version** (Mục 13), nội dung thiếu (Mục 14), thứ tự (Mục 15), log (`interpretation.content_missing`, `interpretation.version_unavailable`) |
| M2 Plan §17 | Port không đảm bảo thứ tự; lỗi hạ tầng ném `InfrastructureError`, không biến thành `[]` (R3) |
| Coding Standards, Testing Standards (tài liệu riêng) | `UNVERIFIED — không đọc riêng`; dùng quy ước thực tế từ mã (ESLint `boundaries`, `import/order`, test vitest + `vi.fn()`) |

## 5. Source-of-Truth Hierarchy

1. Mã nguồn `db4a008`.
2. Spec đã đóng băng (DB Spec, Architecture Spec, Natal Chart Domain Spec, REST API Spec).
3. Sprint 4 Plan v1.1 + quyết định owner (R1–R4, A–E, Moon, O-M3-1..4) + plan/matrix M1–M3.
4. Prompt M4 (FD1–FD12).

## 6. Existing Architecture Baseline

- Hướng phụ thuộc (ESLint `boundaries/dependencies`): `application → domain`, `infrastructure → domain`; `application` **không** import `infrastructure`; `domain` không import lớp trên.
- `composition-root.ts` nằm ngoài các lớp nên được phép import cả `application` và `infrastructure`.
- Use case hiện tại nhận phụ thuộc qua constructor (class + `new` thủ công); M4 theo đúng cách đó.
- `ChartBuilder` là class có constructor nhận `IEphemerisProvider`, `build(input)` nhận props object; M4 chỉ thêm một trường tuỳ chọn vào input.

## 7. M4 Objective

1. Tạo `InterpretationLookupService` điều phối: derive subject → chọn version → gọi provider → sắp xếp xác định.
2. `CreateNatalChartUseCase`: chọn version trước khi build (để chart mới được ghim), tra nội dung, trả `{ chart, interpretation }`.
3. `GetChartUseCase`: tra nội dung theo version đã ghim (hoặc mới nhất khi `null`), trả `{ chart, interpretation }`.
4. `ChartBuilder` nhận `snapshotInterpretationVersion` tuỳ chọn và chuyển cho `Chart.create`.
5. Nối provider → service → use case ở composition root.
6. Test unit ở lớp application.
7. (Task 3) Xử lý các gap tồn đọng của M3/M1 theo yêu cầu owner.

## 8. Frozen Decisions

FD1–FD12 của prompt và mọi quyết định M1–M3 giữ nguyên, không mở lại. Ánh xạ:

| FD | Thực hiện |
|---|---|
| FD1 | Service nằm trong module `chart`; không tạo module `interpretation` |
| FD2 | Service/use case chỉ import `ILogger`, port, domain; không Prisma/Express |
| FD3 | Dùng `IInterpretationContentProvider` của M2 nguyên chữ ký (không tạo interface thứ hai) |
| FD4 | Gọi `deriveInterpretationSubjects(chart)`; không ghép key trong use case |
| FD5 | **Không** dùng `enumerateMvpInterpretationSubjects` ở runtime |
| FD6 | Chỉ 3 loại MVP (derive đã quyết định) |
| FD7/FD8 | Không có nhà → `deriveInterpretationSubjects` đã bỏ `PlanetInHouse`; không logic Moon |
| FD9/FD10/FD11 | Quy tắc ở Mục 13 (kế thừa v1.1 §9.2/§11; không backfill) |
| FD12 | Không AI/LLM, không script sinh nội dung. **Hệ quả:** củng cố đề xuất xoá `scripts/generate-interpretations.ts` (Task 3, O-M4-2) |

## 9. Scope

Task 1–2 (kỹ thuật cốt lõi), Task 3 (tồn đọng M3/M1: `InfrastructureError` đúng chữ ký, dọn tham chiếu sample, xử lý script sinh nội dung, lưu trữ tài liệu; kèm các quyết định nội dung của owner), Task 4 (xác minh và tài liệu).

## 10. Out of Scope

Endpoint/`ChartResponse` (mapper vẫn `interpretations: []`, thêm `interpretationVersion` là M5), UI, CMS/CRUD nội dung, AI/LLM/prompt/script sinh nội dung, thêm hay sửa **văn bản** diễn giải (owner tự soạn; M4 chỉ chạy validator), Aspect/Pattern/synthesis, đổi engine/Swiss Ephemeris, auth, Birth Profile (ngoại lệ duy nhất: sửa `InfrastructureError` ở repository Birth Profile, xem C1), module `interpretation` mới, đổi schema/migration, bump version backend (`0.4.0` khi đóng Sprint 4).

## 11. Dependencies

| Hướng | Phụ thuộc |
|---|---|
| Vào | M1–M3 (đã có). Nội dung production `1.0` đã có trong repo nhưng **chưa có log seed vào DB sạch** (EV-M3-06b), không chặn M4 vì M4 test bằng fake provider |
| Ra M5 | `InterpretationResult` và kiểu trả về `{ chart, interpretation }` là hợp đồng để mapper đưa vào `ChartResponse` |
| Ra M6 | Cần seed 252 mục vào DB để nghiệm thu đầu-cuối |

## 12. InterpretationLookupService

**Vị trí:** `backend/src/modules/chart/application/services/interpretation-lookup.service.ts` (Architecture Spec §3.3; thư mục `services/` mới trong `application/`).

**Constructor:** `(contentProvider: IInterpretationContentProvider, logger: ILogger)` (D-M4-13).

**API (D-M4-02):**

| Phương thức | Mục đích |
|---|---|
| `resolveLatestVersion(): Promise<string \| null>` | Version `Published` mới nhất của ngôn ngữ `vi`, hoặc `null` nếu không có |
| `lookup(chart: InterpretationChartView): Promise<InterpretationResult>` | Tra nội dung cho một chart |

- `InterpretationChartView = Pick<Chart, 'id' | 'planets' | 'angles' | 'isHouseDataAvailable' | 'snapshotInterpretationVersion'>` (D-M4-03; cùng cách với `deriveInterpretationSubjects` ở M2; test không cần dựng `Chart` đầy đủ).
- `InterpretationResult = { version: string | null; items: readonly InterpretationContentRecord[] }`, khai báo cùng file service (D-M4-06). `items` tái dùng `InterpretationContentRecord` của M1 (chứa `subjectType`, `subjectKey`, `language`, `tone`, `bodyText`, `version`, `status`, `contentSource`); M5 chọn trường để đưa ra response.
- Hằng cục bộ `INTERPRETATION_LANGUAGE = 'vi'` (FD10 của M3: MVP cố định `vi`; D-M4-04).

Service **không** import `fs`, Prisma, Express; không tạo lỗi mới; không tạo nội dung.

## 13. Version Selection Semantics

Kế thừa nguyên văn Sprint 4 Plan v1.1 §9.2/§11 (không phát minh chính sách mới):

| Trường hợp | Version dùng | `result.version` |
|---|---|---|
| Chart đã ghim (`snapshotInterpretationVersion != null`) | Đúng version đã ghim (không thay bằng "mới nhất") | Version đã ghim |
| Chart cũ (`null`) | Published mới nhất lúc request; **không** backfill, **không** sửa chart (FD11) | Version mới nhất, hoặc `null` nếu không có |
| Chart **mới** (Create) | Use case gọi `resolveLatestVersion()` **trước** `build`, truyền vào builder → chart được ghim; sau đó `lookup` dùng đúng giá trị đó | Version vừa ghim |
| `save=false` (user hoặc Guest) | Cùng luồng Create: chart trong bộ nhớ mang version, **không persist** | Version mới nhất lúc request |
| Không có version Published nào | `snapshot = null`, không gọi `findPublishedContents` | `null`, `items = []` |

**`resolveLatestVersion` (D-M4-05):**
1. `provider.findPublishedVersions('vi')`.
2. Giữ chuỗi qua `isValidContentVersion`; chuỗi sai định dạng bị **bỏ qua kèm `logger.warn`** (nội dung vào DB đi qua validator M3 nên chỉ xảy ra khi sửa tay DB; ném lỗi sẽ làm mọi chart 500).
3. Chọn lớn nhất theo `compareContentVersion`; nếu hai version so sánh bằng nhau (ví dụ `'1'` và `'1.0'`, validator M3 chặn nhưng DB không) chọn chuỗi lớn hơn theo thứ tự từ điển để kết quả xác định.
4. Không còn version hợp lệ → `null`.

Phân biệt "pinned nhưng hết nội dung" với "bank rỗng": nếu chart ghim version V mà provider không trả hàng nào, `items = []`, `version = V` (đúng v1.1 §15), kèm warn `interpretation.version_unavailable`.

## 14. Content Lookup & Error Semantics

Kế thừa v1.1 §15 và hợp đồng port (M2 §17); **không tạo lớp lỗi mới** (D-M4-12).

| Tình huống | Hành vi |
|---|---|
| Có subject nhưng không có hàng nội dung cho subject đó | Bỏ item đó, các item khác giữ nguyên, `logger.warn('interpretation.content_missing', { chartId, version, missingCount, missingKeys: tối đa 20 key })`; **không ném lỗi** |
| Toàn bộ subject không có hàng (version tồn tại, bank thiếu) | `items = []`, warn như trên |
| Bank rỗng (không version Published) | `{ version: null, items: [] }`, không gọi `findPublishedContents`, không warn |
| Chart không có nhà | `deriveInterpretationSubjects` đã bỏ `PlanetInHouse` (và Ascendant nếu không có angle); service chỉ yêu cầu subject đã derive; **không ném lỗi** |
| Lỗi hạ tầng của provider (`InfrastructureError`) | **Truyền lên nguyên vẹn**, không `catch`, không đổi thành `[]` (R3) |
| `deriveInterpretationSubjects` ném `InvalidInterpretationSubjectKeyError` (dữ liệu chart hỏng, ví dụ `house` ngoài 1..12) | Truyền lên nguyên vẹn. Đường này nằm ngoài `try/catch` của `build`, `mapChartDomainErrorToAppError` không được áp dụng, nên error handler bọc thành `InfrastructureError` 500 "An unexpected error occurred". Đây là dữ liệu hỏng, 500 là đúng ngữ nghĩa (D-M4-12) |
| Application không biết HTTP | Không có `statusCode` hay mã HTTP trong service/use case |

Ghi log chỉ chứa `chartId`, version, key (không dữ liệu sinh/tên người).

## 15. Deterministic Result Ordering

Provider **không đảm bảo thứ tự** (M2 §17; M3 D-M3-10 không thêm `orderBy`). Vì vậy service sắp xếp lại (D-M4-11):

1. `subjects = deriveInterpretationSubjects(chart)` — thứ tự canonical: PlanetInSign (Sun…Pluto) → AngleInSign → PlanetInHouse.
2. `records = await provider.findPublishedContents('vi', version, subjects)`.
3. Dựng `Map` theo khoá `subjectType + '\u0000' + subjectKey` (bản ghi đầu tiên thắng nếu trùng; UNIQUE của DB không cho trùng nhưng service không dựa vào đó).
4. Duyệt `subjects` theo thứ tự canonical, lấy bản ghi tương ứng; subject không có bản ghi bị bỏ (Mục 14). Bản ghi provider trả thừa (không thuộc `subjects`) bị bỏ qua.

Kết quả chỉ phụ thuộc `(chart, version)`, không phụ thuộc thứ tự DB hay thứ tự `chart.planets`.

## 16. Create Chart Use Case Changes

**Constructor:** thêm tham số thứ tư `interpretationLookupService` (cuối danh sách, để giữ nguyên thứ tự ba tham số cũ — D-M4-09).
**Kiểu trả về:** `CreateNatalChartResult = { chart: Chart; interpretation: InterpretationResult }` (D-M4-08; kế thừa D-S4-09).

Luồng mới (chỉ thêm bước 5a, 5c và đổi bước 6/trả về; các bước 1–5b không đổi):

```
1–4  (không đổi) invariant, guard Guest, resolve birth data, EngineInput
5a   interpretationVersion = await service.resolveLatestVersion()           ← MỚI
5b   chart = await chartBuilder.build({ id, userId, birthProfileId,
                                        engineInput, snapshotInterpretationVersion }) ← +1 trường
     (try/catch giữ nguyên)
5c   interpretation = await service.lookup(chart)                           ← MỚI
6    if (command.save) await chartRepository.save(chart)                    (không đổi)
7    return { chart, interpretation }
```

**Quyết định thứ tự (D-M4-07):** tra nội dung **trước** persist, để lỗi tra nội dung (500) không để lại chart đã lưu mà người dùng không nhận được (retry sẽ tạo bản trùng). Đánh đổi: nếu `save` lỗi thì phần tra nội dung đã tốn; chấp nhận được.

Đảm bảo: các guard (1, 2, 2b) vẫn chạy trước mọi truy vấn nội dung; tính toán chart không đổi; persist chỉ khi `save`; chart được ghim version chỉ khi `save=true` mới xuống DB (đúng v1.1 §11).

Chi phí: một lần `findPublishedVersions` trước build (kể cả khi build sau đó lỗi đầu vào) và một lần `findPublishedContents`. Chấp nhận ở MVP.

## 17. Get Chart Use Case Changes

**Constructor:** `(chartRepository, interpretationLookupService)`. **Kiểu trả về:** `GetChartResult = { chart: Chart; interpretation: InterpretationResult }`.

```
chart = await chartRepository.findById(id)           (không đổi)
if (!chart) throw NotFoundError                      (không đổi)
assertChartOwnership(chart, requestingUserId)        (không đổi — luôn trước khi tra nội dung)
interpretation = await service.lookup(chart)         ← MỚI: ghim → dùng đúng version; null → mới nhất
return { chart, interpretation }
```

Không ghi lại `snapshotInterpretationVersion` (không recalculation, không backfill). `ListChartsUseCase` và `DeleteChartUseCase` **không đổi**.

## 18. ChartBuilder Changes

Thay đổi tối thiểu (D-M4-10):

- `ChartBuilderInput` thêm `snapshotInterpretationVersion?: string | null`.
- Trong `build()`, truyền `snapshotInterpretationVersion: input.snapshotInterpretationVersion ?? null` vào `Chart.create`.
- Không đổi constructor, không đổi tính toán, không đổi `isHouseDataAvailable`. Gọi cũ (golden test, test tích hợp repository) không truyền trường này nên hành vi giữ nguyên (`null`).

## 19. Composition Root / Dependency Wiring

Trong `bootstrapApplication`, khối `// --- Chart Module ---`, theo đúng kiểu `new` thủ công hiện có:

```
const interpretationContentProvider = new PrismaInterpretationContentProvider(prisma);
const interpretationLookupService  = new InterpretationLookupService(interpretationContentProvider, logger);

new CreateNatalChartUseCase(getBirthProfileSnapshotUseCase, chartBuilder, chartRepository, interpretationLookupService)
new GetChartUseCase(chartRepository, interpretationLookupService)
```

- `PrismaInterpretationContentProvider` chỉ được import ở `composition-root.ts` (lớp được phép); service và use case chỉ thấy port.
- Không service locator, không container.
- Không có test composition root riêng (không có tiền lệ); bằng chứng wiring = `typecheck` + test API/E2E dùng `bootstrapApplication` (chạy trong CI với DB thật; bank rỗng nên `interpretations` vẫn `[]`).
- `controller.chart.controller.ts`: sửa tối thiểu để biên dịch với kiểu trả về mới (`const { chart } = await ...`); response **không đổi** (D-M4-08).
- `index.ts` của module `chart`: thêm export type cho hai `Result`.

## 20. Architecture Boundary Verification

| Kiểm | Cách |
|---|---|
| Application không import infrastructure/Prisma | `grep -rn "infrastructure\|@prisma\|from 'express'" backend/src/modules/chart/application` → kỳ vọng 0; thêm kết quả ESLint `boundaries/dependencies` |
| Domain không đổi hướng | `git diff --stat` chỉ có `chart-builder.ts` trong `domain/` |
| Provider chỉ ở composition root | `grep -rn "PrismaInterpretationContentProvider" backend/src` → chỉ `composition-root.ts` và chính file định nghĩa |
| Không vòng phụ thuộc | `npm run lint` + `typecheck` |
| Không HTTP trong application | `grep -rn "statusCode\|HttpStatus" backend/src/modules/chart/application/services` → 0 |
| Không AI | `grep -rniE "openai\|anthropic" backend/src backend/package.json backend/scripts` → 0 (sau Task 3) |

## 21. Unit Test Strategy

Chỉ unit test, không cần PostgreSQL; provider được thay bằng fake (`vi.fn()`), theo đúng kiểu hiện có. Test dựng entity thật (`Planet`, `Angle`) cho phần service để thu hẹp rủi ro "mock `as any`" (KG-M2-03); chữ ký `Planet.create`/`Angle.create` đọc lại từ code lúc triển khai.

**`tests/unit/modules/chart/application/services/interpretation-lookup.service.test.ts` (mới)**

| Nhóm | Ca |
|---|---|
| Chart đầy đủ | provider được gọi với đúng 21 subject và đúng `language`/`version`; kết quả đầy đủ theo thứ tự canonical |
| Không có nhà | không `PlanetInHouse` trong yêu cầu gửi provider; chỉ PlanetInSign; không ném lỗi |
| Ghim | `snapshot = '1.0'` → provider nhận `'1.0'`; **không** gọi `findPublishedVersions` |
| Ghim nhưng hết nội dung | provider trả `[]` → `{ version: '1.0', items: [] }` + warn `version_unavailable` |
| `null` (chart cũ) | gọi `findPublishedVersions`, chọn mới nhất, tra theo version đó, `result.version` = mới nhất |
| Không có version | `findPublishedVersions` trả `[]` → `{ version: null, items: [] }`, **không** gọi `findPublishedContents` |
| Chọn version | `['1.9', '1.10', '2.0']` → `2.0`; `['1.9', '1.10']` → `1.10`; chuỗi sai (`'v1'`, `''`) bị bỏ + warn; hòa (`'1'`, `'1.0'`) → chọn xác định |
| Thiếu một phần | provider thiếu 3 subject → 18 item, warn `content_missing` với `missingCount = 3` và `missingKeys`; không ném lỗi |
| Thứ tự | provider trả xáo trộn → kết quả vẫn theo thứ tự canonical; bản ghi thừa bị bỏ; bản ghi trùng lấy bản đầu |
| Lỗi hạ tầng | `findPublishedVersions` hoặc `findPublishedContents` ném `InfrastructureError` → promise reject với **chính lỗi đó**, không phải `[]` |
| Dữ liệu chart hỏng | planet có `house = 13` khi có nhà → ném `InvalidInterpretationSubjectKeyError` (không bị nuốt) |
| Không biến đổi đầu vào | chart không bị sửa |

**`create-natal-chart.usecase.test.ts` (sửa, 17 ca có sẵn)** — cập nhật constructor (thêm service mock) và kỳ vọng kiểu trả về; **không sửa kỳ vọng hành vi cũ**. Ca mới (kiểm điều phối, không lặp test service):

| Ca | Ý |
|---|---|
| `resolveLatestVersion` gọi trước `build`; `build` nhận `snapshotInterpretationVersion` đúng | version được ghim |
| `lookup` nhận chart do builder trả về | điều phối |
| Kết quả `{ chart, interpretation }` đúng | |
| `save=true`: `lookup` xảy ra **trước** `save` | D-M4-07 |
| `lookup` ném lỗi → `save` **không** được gọi | |
| `save=false` vẫn gọi `resolveLatestVersion` và `lookup`, không gọi `save` | |
| Guard (XOR, Guest save, Guest + profile) → service **không** được gọi | |
| Lỗi `build` vẫn được map qua `mapChartDomainErrorToAppError` | hành vi cũ |
| Version `null` từ service → `build` nhận `null` | bank rỗng |

**`get-chart.usecase.test.ts` (sửa, 5 ca có sẵn)** — cập nhật constructor/kiểu; ca mới: gọi `lookup` với đúng chart; chart ghim và chart `null` đều được truyền nguyên cho service (service tự quyết); không tìm thấy hoặc sai chủ sở hữu → service **không** được gọi; lỗi từ service truyền lên; chart không bị sửa.

**`chart-builder.test.ts` (sửa tối thiểu)** — ca: `snapshotInterpretationVersion = '1.0'` → `chart.snapshotInterpretationVersion === '1.0'`; bỏ qua trường → `null`; dữ liệu tính toán không đổi.

**Hồi quy:** toàn bộ test golden, tích hợp, API, E2E hiện có phải xanh không sửa kỳ vọng. Test tích hợp "service + provider thật + 252 mục" thuộc M6 (không nằm ở M4 theo prompt).

## 22. File Change Map

**Tạo mới**
- `backend/src/modules/chart/application/services/interpretation-lookup.service.ts`
- `backend/tests/unit/modules/chart/application/services/interpretation-lookup.service.test.ts`
- `docs/implementation/Sprint_4_M4_Exit_Criteria_Evidence_Matrix.md` (khi đóng M4)

**Sửa**
- `backend/src/modules/chart/application/use-cases/create-natal-chart.usecase.ts`
- `backend/src/modules/chart/application/use-cases/get-chart.usecase.ts`
- `backend/src/modules/chart/domain/engine/chart-builder.ts` (một trường input + một dòng `Chart.create`)
- `backend/src/composition-root.ts`
- `backend/src/modules/chart/presentation/controllers/chart.controller.ts` (chỉ destructure, response không đổi)
- `backend/src/modules/chart/index.ts` (export type `CreateNatalChartResult`, `GetChartResult`)
- Task 3: `backend/src/modules/chart/infrastructure/repositories/prisma-chart.repository.ts`, `backend/src/modules/birth-profile/infrastructure/repositories/prisma-birth-profile.repository.ts`, `backend/prisma/seed-content.ts`, `backend/prisma/README.md`; có điều kiện: `backend/scripts/generate-interpretations.ts` (xoá), `backend/prisma/content/interpretations.vi.json` (owner chỉnh), tài liệu trong `docs/implementation/archive/sprint-4/`

**Test sửa**
- `tests/unit/modules/chart/application/use-cases/create-natal-chart.usecase.test.ts`
- `tests/unit/modules/chart/application/use-cases/get-chart.usecase.test.ts`
- `tests/unit/modules/chart/domain/engine/chart-builder.test.ts`
- Task 3: test hiện có của hai repository (nếu có ca kiểm `details`); thêm ca kiểm `cause` không lọt vào `details`

**Không được chạm:** `ChartResponseMapper` và schema OpenAPI, `list-charts.usecase.ts`, `delete-chart.usecase.ts`, `domain/interpretation/**`, `domain/types/**`, `domain/ports/**` (M2 đóng), provider `prisma-interpretation-content.provider.ts`, `infrastructure/content/**` (M3), `prisma/schema.prisma`, `prisma/migrations/**`, `domain/engine/` ngoài `chart-builder.ts`, Swiss Ephemeris, auth.

## 23. Task Breakdown

Owner yêu cầu gộp tồn đọng nên có 4 task (prompt khuyến nghị tối đa 3 cho phần lõi; Task 3 là phần gộp thêm, tách bạch để có thể revert riêng).

**Task 1 — `InterpretationLookupService` (kèm test).** Service, `InterpretationResult`, chọn version, tra nội dung, sắp xếp, log; test `interpretation-lookup.service.test.ts`.

**Task 2 — Use case, ChartBuilder, controller tối thiểu, composition root (kèm test).** Create/Get, `ChartBuilderInput`, wiring, export type; cập nhật ba file test.

**Task 3 — Gộp tồn đọng M3/M1 (kèm test, không chặn Task 1–2).**

| Mã | Việc | Loại | Phụ thuộc quyết định |
|---|---|---|---|
| C1 | **KG-M1-03:** đổi mọi `new InfrastructureError(msg, { cause: error })` thành `new InfrastructureError(msg, undefined, error)` ở hai repository (xác nhận danh sách bằng `grep -rn "{ cause" backend/src`); thêm test kiểm `error.details` không chứa `cause`. Lý do đặt vào M4: R3 làm lỗi tra nội dung thành 500, và chính đường `GET /charts/:id` (`findById`) đang dính lỗi này | Code, mức thấp–trung bình | O-M4-5 (có gồm Birth Profile không) |
| C2 | **KG-M3-09:** sửa thông báo CLI `prisma/seed-content.ts:34` và `prisma/README.md:45` bỏ tham chiếu `interpretations.vi.sample.json` | Code/tài liệu | — |
| C3 | **KG-M3-10:** xử lý `scripts/generate-interpretations.ts` (mặc định **xoá**, FD12) | Code | O-M4-2 |
| C4 | **KG-M3-11:** nhãn `contentSource` của `interpretations.vi.json` (`HumanAuthored` hay `Hybrid`); owner xác nhận và chỉnh header nếu cần | **Nội dung, owner** | O-M4-3 |
| C5 | **KG-M3-12/13/14:** lỗi chính tả (`khát kho` ở `Sun_in_Sagittarius`), cách gọi hành tinh, các đoạn nhạy cảm (`Uranus_in_House_7`, `Saturn_in_House_12`, `Uranus_in_Virgo`, `Jupiter_in_House_2`); owner tự soạn, M4 chỉ chạy `--validate-only` lại và, nếu phát hành `1.1`, kiểm bao phủ | **Nội dung, owner** | O-M4-4 |
| C6 | **EV-M3-06b:** log seed 252 mục vào DB sạch (xem Mục 29) | Bằng chứng, owner | — |
| C7 | **Lưu trữ tài liệu (D-M4-15):** lưu Evidence Matrix của M1–M4 vào `docs/implementation/archive/sprint-4/` (hiện đã có M1, M2; thiếu M3 và M4). **Không** khôi phục plan M1/M2; sau khi M4 đóng, xoá plan M3 và plan M4 khỏi `docs/implementation/` theo quy ước các sprint trước | Tài liệu | — |

Claude **không** soạn hay sửa văn bản diễn giải (FD9 của M3). C4/C5 là việc của owner.

**Task 4 — Xác minh và tài liệu.** Chạy Exit Criteria (Mục 29), xác minh ranh giới (Mục 20), cập nhật tài liệu (Mục 27), điền Evidence Matrix.

## 24. Decision Log

M1–M3 (kể cả R1–R4, A–E, O-M3-1..4) kế thừa, không mở lại. Quyết định mới của M4:

| ID | Quyết định | Lý do / phương án đã loại |
|---|---|---|
| D-M4-01 | `InterpretationLookupService` ở `chart/application/services/` và **tạo mới** | Architecture Spec §3.3; không có service nào tồn tại ([repo]) |
| D-M4-02 | Hai phương thức `resolveLatestVersion()` và `lookup(chart)` | Create cần version **trước** build (chart bất biến); Get chỉ cần `lookup`. Loại phương án một phương thức: không thể ghim version vào chart mới mà không biết version trước |
| D-M4-03 | `lookup` nhận `Pick<Chart, 'id' \| 'planets' \| 'angles' \| 'isHouseDataAvailable' \| 'snapshotInterpretationVersion'>` | Cùng cách M2; test gọn, vẫn nhận `Chart` thật |
| D-M4-04 | Ngôn ngữ cố định `'vi'` bằng hằng cục bộ trong service | FD10 (M3); không thêm cấu hình |
| D-M4-05 | Chọn version: chỉ giữ chuỗi hợp lệ, so bằng `compareContentVersion`, hòa thì chọn chuỗi lớn hơn theo từ điển, bỏ chuỗi sai kèm warn | Bền với DB sửa tay; xác định |
| D-M4-06 | `InterpretationResult` khai báo ở file service, `items` là `InterpretationContentRecord` | Không đụng `domain/types` (M2 đóng); không tạo kiểu thừa |
| D-M4-07 | Create: `resolveLatestVersion` → `build` → `lookup` → `save` | Lỗi tra nội dung không để lại chart đã lưu |
| D-M4-08 | Use case trả `{ chart, interpretation }`; controller sửa tối thiểu, response không đổi | Kế thừa D-S4-09; `ChartResponse` là M5 |
| D-M4-09 | Tham số service thêm **cuối** constructor | Không đổi thứ tự tham số hiện có |
| D-M4-10 | `ChartBuilderInput.snapshotInterpretationVersion?: string \| null` | Thay đổi nhỏ nhất; gọi cũ không vỡ |
| D-M4-11 | Sắp xếp theo thứ tự derive ở lớp application | Port không đảm bảo thứ tự (M2 §17; D-M3-10) |
| D-M4-12 | Không tạo lớp lỗi mới; lỗi provider/derive truyền lên nguyên vẹn | Kế thừa R3; prompt cấm lỗi trùng |
| D-M4-13 | Service nhận `ILogger` | Tiền lệ trong `RegisterUserUseCase`; cần log `content_missing`/`version_unavailable` (v1.1 §16) |
| D-M4-14 | Gộp tồn đọng M3/M1 thành Task 3 theo yêu cầu owner | Ngoại lệ có chủ đích của quy tắc "không gộp việc M3 vào M4" |
| D-M4-15 | Implementation plan của từng milestone là blueprint tạm thời, xoá sau khi milestone đóng; chỉ Evidence Matrix được lưu vào `archive/sprint-4/` | Quy ước của owner (theo các sprint trước). Rút lại nhận định KG-M3-08/KG-M2-04 (việc xoá plan M1/M2 là đúng quy ước, không phải gap) |
| D-M4-16 | Sửa nội dung tại chỗ `1.0` (không phát hành `1.1`) vì `1.0` chưa từng được seed vào DB nào | Owner (O-M4-4). Điều kiện: chỉ **sau khi** chỉnh xong và `--validate-only` 252/252 mới seed lần đầu; từ lúc đó `1.0` bất biến và mọi sửa sau phải bằng version mới |
| D-M4-17 | Task C1 gồm cả `PrismaBirthProfileRepository` (một commit riêng, kèm test) | Owner (O-M4-5) |
| Kế thừa | Thiếu nội dung → bỏ item + warn; bank rỗng → `[]`; chart ghim hết nội dung → `[]` + giữ version | Sprint 4 Plan v1.1 §15 — không có quyết định mới |

## 25. Open Questions

Owner đã chốt O-M4-1, 2, 4, 5. Còn lại: nhãn `contentSource` (O-M4-3) và hai quyết định thiết kế D-M4-07 (tra nội dung trước khi lưu), D-M4-08 (use case trả `{ chart, interpretation }`, controller chỉ destructure). Owner xác nhận chung "mọi đề xuất cho O-M4-1..5", nên hai quyết định này được coi là **chưa xác nhận rõ** cho tới khi có phản hồi.

| ID | Câu hỏi | Vì sao quan trọng | Đề xuất | Chặn? |
|---|---|---|---|---|
| O-M4-1 | Chấp nhận `interpretation` được tính nhưng `ChartResponse` vẫn `interpretations: []` đến M5? | Chi phí truy vấn thừa trên `dev` | **ĐÃ CHỐT (owner): chấp nhận; không phát hành riêng M4** | Không |
| O-M4-2 | Xoá `scripts/generate-interpretations.ts`? | Có thể ghi đè nội dung `Published`; FD12 cấm script sinh nội dung | **ĐÃ CHỐT (owner): xoá**; `interpretations.vi.json` là nguồn sự thật | Không |
| O-M4-3 | Nhãn `contentSource` của `interpretations.vi.json`: `HumanAuthored` hay `Hybrid`? | DB Spec định nghĩa `Hybrid` cho nội dung kết hợp người và máy | **CHƯA CÓ NHÃN CỤ THỂ.** Owner đồng ý đề xuất "xác nhận theo thực tế quy trình" nhưng chưa nói nhãn nào; cần một câu trả lời trước khi đóng C4 (hiện file ghi `HumanAuthored`) | Không chặn Task 1–2; chặn đóng C4 |
| O-M4-4 | Sửa tại chỗ `1.0` hay phát hành `1.1`? | `Published` bất biến sau khi seed | **ĐÃ CHỐT (owner): sửa tại chỗ** vì chưa seed vào DB nào (D-M4-16) | Không |
| O-M4-5 | Task C1 có sửa `PrismaBirthProfileRepository` không? | Cùng lỗi, ngoài module `chart` | **ĐÃ CHỐT (owner): có**, một commit riêng, kèm test (D-M4-17) | Không |

## 26. Risks

| ID | Rủi ro | Mức | Giảm thiểu (dựa trên repo) |
|---|---|---|---|
| R-M4-1 | Version của chart ghim không còn nội dung Published | Thấp | Trả `[]` giữ version đã ghim + warn; test "ghim nhưng hết nội dung" |
| R-M4-2 | Provider trả thứ tự tuỳ ý | Thấp | Service sắp lại theo thứ tự derive; test xáo trộn |
| R-M4-3 | Thiếu nội dung bị coi là lỗi hạ tầng hoặc ngược lại | Trung bình | Hai nhánh tách bạch (Mục 14): thiếu → bỏ + warn; lỗi provider → truyền lên; test cho cả hai |
| R-M4-4 | Composition root kéo Prisma vào application | Thấp | Chỉ `composition-root.ts` import provider; `grep` + ESLint `boundaries` |
| R-M4-5 | Đổi kiểu trả về làm vỡ test và controller | Trung bình | Chỉ hai use case + controller; cập nhật test trong Task 2, không sửa kỳ vọng cũ; chạy toàn bộ hồi quy |
| R-M4-6 | Lặp logic điều phối ở nhiều use case | Thấp | Toàn bộ logic ở service; use case chỉ gọi hai phương thức |
| R-M4-7 | Chart `save=false`/guest mang version nhưng không persist, dễ nhầm với "ghim" | Thấp | Ghi rõ ở Mục 13; chỉ `save=true` ghi `snapshot_interpretation_version` xuống DB |
| R-M4-8 | C1 sửa repository Sprint 2–3 gây hồi quy | Thấp | Thay đổi cơ học; test hiện có và CI; commit riêng, dễ revert |
| R-M4-9 | Truy vấn thừa trước M5 (O-M4-1) | Thấp | Chấp nhận trên `dev` |

## 27. Documentation Changes

- `docs/implementation/archive/sprint-4/`: lưu Evidence Matrix M3 và M4 (M1, M2 đã có); không lưu plan (D-M4-15). Xoá plan M3 và M4 sau khi M4 đóng.
- Architecture Spec §12: ghi chú service `InterpretationLookupService` nay tồn tại (§3.3 đã đúng).
- Sprint 4 Plan v1.1: không sửa lịch sử; Decision Log của plan này trỏ tới D-M4-*.
- `prisma/README.md`: bỏ tham chiếu sample (C2).
- Sprint 4 Known Gaps Registry (chưa tạo, tạo khi đóng sprint): KG-S4-06, KG-S4-08, KG-M1-05, KG-M2-03, KG-M3-01 (nếu còn).
- REST/DB Spec: không đổi (không đổi hợp đồng ở M4).

## 28. Acceptance Criteria

1. `InterpretationLookupService` nằm ở `chart/application/services/`, phụ thuộc `IInterpretationContentProvider` và `ILogger`, không Prisma.
2. Service dùng `deriveInterpretationSubjects`, `isValidContentVersion`, `compareContentVersion`; không có grammar hay danh sách subject thứ hai; không dùng `enumerateMvpInterpretationSubjects`.
3. Chart ghim → dùng đúng version, không gọi `findPublishedVersions`.
4. Chart `null` → Published mới nhất; không backfill, không sửa chart.
5. Chart mới được ghim version trước khi build; `save=false` không persist.
6. Không có nhà → không yêu cầu `PlanetInHouse`, không lỗi.
7. Thiếu nội dung → bỏ item + warn; bank rỗng → `[]`; không lỗi.
8. Lỗi provider truyền lên nguyên vẹn, không biến thành `[]`.
9. Thứ tự kết quả xác định, độc lập thứ tự DB.
10. Create và Get dùng service đúng cách; guard và ownership vẫn chạy trước mọi truy vấn nội dung.
11. `ChartBuilder` chuyển version vào `Chart.create`; gọi cũ không đổi hành vi.
12. Composition root nối provider → service → use case; không service locator.
13. Test application mới và cập nhật đều pass; toàn bộ test cũ (M1–M3, Sprint 1–3, API, E2E, golden) vẫn pass không sửa kỳ vọng.
14. `lint`, `format:check`, `typecheck`, `build` pass; không vi phạm ranh giới; không TODO/FIXME chưa phân loại trong phạm vi M4.
15. Không phụ thuộc hay script AI trong `src/` và `scripts/` (sau C3).
16. C1: không còn `{ cause: ... }` trong tham số `details` của `InfrastructureError`; test kiểm `details` không chứa `cause`.
17. C2: không còn tham chiếu `interpretations.vi.sample.json`.
18. C3/C4/C5/O-M4-3/O-M4-4: có quyết định ghi lại của owner; nếu có chỉnh nội dung, `prisma:seed:content -- --validate-only` vẫn báo 252/252.

## 29. Exit Criteria

Trạng thái chỉ dùng `PASS`, `FAIL`, `PARTIAL`, `UNVERIFIED`, `NOT APPLICABLE`, `DEFERRED`.

**Bằng chứng từ CI:** workflow `backend-ci.yml` chạy, theo thứ tự: `prisma:generate` + `prisma:deploy` trên Postgres sạch, `lint` + `format:check`, `generate:openapi`, `typecheck`, `test:coverage` (toàn bộ test, có DB), `build`. Run Success trên **đúng commit** là bằng chứng chấp nhận được cho các lệnh này (xem trả lời kèm theo về việc chỉ cung cấp link CI). Trang CI không cho thấy số test; nếu cần số liệu thì dùng log.

| Tiêu chí | Lệnh / nguồn | Bằng chứng chấp nhận |
|---|---|---|
| Test application mới | `npx vitest run tests/unit/modules/chart/application` | CI hoặc log |
| Hồi quy toàn bộ | `npm run test:coverage` (CI) / `npm test` | CI |
| Lint / Format | `npm run lint`, `npm run format:check` | CI |
| Typecheck / Build | `npm run typecheck`, `npm run build` | CI |
| OpenAPI không đổi | `npm run generate:openapi` | CI |
| Ranh giới | các `grep` ở Mục 20 | Claude chạy trên repo |
| TODO/FIXME | `grep` trong file M4 | Claude chạy |
| C6: seed 252 mục (CI **không** chạy) | `npm run db:reset` → `npm run prisma:seed:content` (kỳ vọng `inserted`, 252) → chạy lại (kỳ vọng `unchanged`) → `SELECT status, count(*) FROM astrology.interpretation_contents GROUP BY status` (kỳ vọng `Published | 252`) | **Log của owner** |
| `prisma migrate diff` (CI không chạy; tồn đọng KG-M1-05) | `npx prisma migrate diff ...` | Log của owner, tuỳ chọn |
| `prisma/` và `scripts/` | Nằm ngoài `typecheck`/`build` (KG-M3-01); kiểm bằng ESLint và chạy CLI thật | Claude chạy `eslint` và `--validate-only` |

## 30. Definition of Done

1. M1–M3 vẫn an toàn hồi quy.
2. `InterpretationLookupService` hoàn thành, có test.
3. Quy tắc version đúng Mục 13.
4. Create và Get tích hợp đúng.
5. `ChartBuilder` chuyển version đúng.
6. Composition root nối đủ; application không có phụ thuộc DB.
7. Test pass; lint/typecheck/format/build pass (CI Success trên commit cuối).
8. Không TODO/FIXME chưa phân loại.
9. Task 3: C1 (cả hai repository), C2, C3 (xoá script), C7 (lưu matrix, xoá plan M3/M4 sau khi đóng) hoàn thành; C4, C5 có quyết định của owner (C5 sửa tại chỗ `1.0` trước lần seed đầu tiên); C6 có log.
10. Decision Log và Open Questions cập nhật; Evidence Matrix có bằng chứng thật.

## 31. Evidence Matrix

Trạng thái lúc lập plan. Chưa chạy lệnh nào cho M4.

| ID | Tiêu chí | Bằng chứng cần | Trạng thái |
|---|---|---|---|
| EV-M4-00 | M1–M3 tiền đề | Evidence Matrix M1 v2, M2, M3 v2; CI #240 | PASS (tiền đề) |
| EV-M4-01 | Service có test | Test unit | UNVERIFIED |
| EV-M4-02 | Create/Get có test | Test unit | UNVERIFIED |
| EV-M4-03 | `ChartBuilder` nhận version | Test unit | UNVERIFIED |
| EV-M4-04 | Hồi quy toàn bộ | CI | UNVERIFIED |
| EV-M4-05 | Lint | CI | UNVERIFIED |
| EV-M4-06 | Format | CI | UNVERIFIED |
| EV-M4-07 | Typecheck | CI | UNVERIFIED |
| EV-M4-08 | Build | CI | UNVERIFIED |
| EV-M4-09 | Ranh giới kiến trúc | `grep` + ESLint | UNVERIFIED |
| EV-M4-10 | Không AI, không TODO/FIXME | `grep` | UNVERIFIED |
| EV-M4-11 | Wiring | `typecheck` + API/E2E trong CI | UNVERIFIED |
| EV-M4-12 | C1 `InfrastructureError` | Test + `grep` | UNVERIFIED |
| EV-M4-13 | C2, C3, C7 | Diff | UNVERIFIED |
| EV-M4-14 | C4, C5 (quyết định nội dung) | Ghi chú owner; `--validate-only` 252/252 | UNVERIFIED |
| EV-M4-15 | C6 seed 252 mục | Log owner | UNVERIFIED |

## 32. Implementation Sequence

1. Owner xác nhận O-M4-1..5 (các câu O-M4-2..5 chỉ cần trước Task 3).
2. Task 1 → commit (service + test).
3. Task 2 → commit (use case, builder, controller, wiring + test cập nhật).
4. Task 3 — commit riêng: C1 (một commit, gồm Birth Profile), C2/C3/C7 (một commit); C4/C5 là chỉnh nội dung do owner (một commit riêng, nếu có) **trước** khi seed `1.0` lần đầu (C6).
5. Task 4: kiểm ranh giới, CI trên commit cuối, log C6, Evidence Matrix.
6. Một CI xanh cho **commit cuối** là điều kiện đóng.

## 33. Final Architect Review

- M4 gọn: một service mới, hai use case, một trường ở builder, một khối wiring. Phần lớn rủi ro nằm ở việc đổi kiểu trả về của hai use case; đã khoanh vùng (controller + test).
- Logic dùng lại M2/M3 hoàn toàn (derive, version, port, provider); không có grammar, key hay lỗi mới.
- Phát hiện đáng chú ý của audit: use case chưa từng có service nào trước đây, và `ChartBuilder` chưa truyền `snapshotInterpretationVersion` nên chart hiện luôn `null`; M4 là milestone đầu tiên làm chart mới được ghim version.
- Lỗi `{ cause }` ở repository (KG-M1-03) làm `metadata` của response 500 có thể chứa nội dung lỗi Prisma (đã xác minh đường mã: `problem-details.ts` không lọc theo status; nội dung serialize thực tế `UNVERIFIED`). Đưa vào M4 là hợp lý vì R3 làm lỗi nội dung trở thành 500.
- Trạng thái trung gian trước M5 (O-M4-1) là chi phí đã biết, không phải lỗi.
- Không có FD nào bị mở lại; hai điểm lệch prompt/repo đã ghi ở Mục 2.

## 34. Final Recommendation

`CONDITIONALLY READY`

**Điều kiện còn lại (nhỏ):** (1) owner xác nhận rõ D-M4-07 và D-M4-08 trước khi viết code Task 1–2; (2) owner cho biết nhãn `contentSource` (O-M4-3) trước khi đóng C4. Repo và spec đủ bằng chứng để triển khai M4 mà không phải phát minh kiến trúc. Nội dung production `1.0` đã có; chất lượng và nhãn nguồn thuộc quyết định của owner.
