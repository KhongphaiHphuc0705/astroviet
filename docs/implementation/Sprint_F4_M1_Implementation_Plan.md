# AstroViet — FE Sprint F4 M1 Implementation Plan
## Chart API / DTO / Data Hooks

**Vị trí đề xuất:** `docs/implementation/Sprint_F4_M1_Implementation_Plan.md` (blueprint tạm thời; theo quy ước, xoá khi M1 đóng, chỉ lưu Evidence Matrix vào `docs/implementation/archive/sprint-f4/`)
**Phiên bản:** 1.1 — **`READY FOR IMPLEMENTATION`** (xem Mục 29–30). *Thay đổi so với 1.0: C-1 đã giải quyết (2 fixture CAPTURED đầy đủ, có diễn giải thật, đã kiểm bất biến bằng script); C-3 đã có baseline (14 lỗi kiểu có sẵn ở 11 file) kèm đề xuất xử lý; owner xác nhận D-1…D-9.*
**Căn cứ:** audit tĩnh nhánh `dev` tại `9f0ff70` (clone mới, 2026-10-10): `frontend/**`, `backend/src/modules/chart/**`, `backend/src/shared/{errors,http,middlewares}/**`, `docs/api/REST_API_Specification.md`; hai response thật do owner cung cấp (`backend_chart_responses.md`); Sprint F4 Implementation Plan v1.1 (owner cung cấp, **chưa commit** vào repo).
**Quy ước nguồn bằng chứng:** `[repo]` = đọc mã/tài liệu; `[owner]` = owner cung cấp, chưa tự kiểm; `[C-run]` = Claude chạy lệnh thật trong sandbox. Trạng thái: `VERIFIED`, `PARTIALLY VERIFIED`, `UNVERIFIED`, `BLOCKED`, `DEFERRED`, `NOT APPLICABLE`.
**Giới hạn của audit này:** không chạy Backend (sandbox không có Postgres/Prisma engine), **không chạy `npm test`/lint/build** của frontend. Mọi kết luận về Backend là **đọc mã tĩnh**; chưa có kết luận nào dựa trên việc gọi API thật, trừ hai response `[owner]`.

---

## 1. Executive Summary

M1 dựng nền dữ liệu cho feature `chart`: DTO, 3 hàm API, query keys, 3 hook, từ điển lỗi, MSW + fixture, test. **Không có UI, route, store hay dependency mới.** Cấu trúc bám sát F3 (`features/birth-profile/{api,hooks}`), dùng `apiClient` sẵn có.

**Hợp đồng Backend đã xác minh bằng đọc mã** (Mục 8, 19): `POST /api/v1/charts/natal?save=true` (201), `GET /api/v1/charts/:id`, `GET /api/v1/charts` với envelope `{items,total,page,pageSize}` — khớp kỳ vọng của prompt.

**Phát hiện quan trọng (đều có bằng chứng):**

| # | Phát hiện | Tác động |
|---|---|---|
| 1 | **`npm run typecheck` không kiểm tra file nguồn nào.** `tsconfig.json` có `"files": []` + `references`, script là `tsc --noEmit` (không `-b`). [C-run] `tsc --noEmit --listFilesOnly` ở root liệt kê **0** file `src`; `tsc -p tsconfig.app.json` liệt kê **178** file `src`. `build` (`tsc --noEmit && vite build`) cũng không type-check. Vitest không type-check. | Toàn bộ cam kết "fixture gán kiểu `ChartResponse`, không ép kiểu" **không được CI thực thi** nếu chỉ chạy script hiện có. M1 phải dùng lệnh kiểm kiểu thật (Mục 25). Các lần "typecheck exit 0" trước đây (F3/F4 master plan) không có giá trị kiểm kiểu. **Kết quả C-3 (owner chạy `tsc -p tsconfig.app.json --noEmit`): exit 1, 14 lỗi có sẵn ở 11 file, không file nào thuộc chart (Mục 27).** |
| 2 | **Mã lỗi trong F4 master plan Mục 10 sai.** Validation request lỗi là `400 MALFORMED_REQUEST` (`validate-*.middleware.ts`), không phải `422 VALIDATION_ERROR`. `CHART_CALCULATION_FAILED` là **422** (`DomainError`), không phải 500. `EPHEMERIS_PROVIDER_ERROR` bị `chart-builder.ts` bọc thành `CHART_CALCULATION_FAILED` ⇒ gần như không bao giờ tới client qua `POST /charts/natal` (Mục 16). `UNSUPPORTED_HOUSE_SYSTEM` không tới được từ FE vì Zod enum chặn trước (400). | Từ điển lỗi M1 khác kỳ vọng ban đầu; có quyết định về telemetry (D-5). |
| 3 | ~~Response thật có `interpretations: []`~~ — **Đã giải quyết (C-1):** owner đã seed nội dung và chụp lại; `fixture_full.json` (21 diễn giải) và `fixture_nohouse.json` (10 diễn giải), `interpretationVersion: "1.0"`. Cả hai là response **CAPTURED đầy đủ**; không còn cần fixture DERIVED. | Mục 17 cập nhật. |
| 4 | `birthProfileLabel` luôn `null` và `birthProfileId` **nullable** ở `GET /charts` (khác REST Spec §5.4 ghi "UUID/denormalized"). Mã Backend là nguồn chuẩn. | Type dùng `string \| null`; ghi `DOCUMENTATION GAP`. |
| 5 | **"Mục 10" = Mục 10 của Sprint F4 Implementation Plan v1.1** ("Existing API/Data Layer"); REST Spec §10 là "API Lifecycle" (không liên quan). File plan F4 **không có trong repo** tại `9f0ff70`. | Nguồn `[owner]`; mọi giá trị trong Mục 10 đã được kiểm lại với mã Backend ở Mục 19. |
| 6 | F3 **không** dùng `placeholderData`; trang `profiles` dựa vào `isLoading` (đổi trang ⇒ key mới ⇒ skeleton lại). Plan F4 viết "cùng mẫu danh sách hồ sơ" là chưa chính xác. | `useChartsQuery` đưa vào mẫu mới `placeholderData: keepPreviousData` (TanStack v5). |

**Quyết định của owner (2026-10-10):** giữ nguyên `ChartResponse` và Backend `0.4.0` trong F4; việc `ChartResponse` không có `birthProfileId` là **Known Gap**, không chặn M1.

## 2. Sprint Goal

> Cung cấp lớp truy cập dữ liệu chart có kiểu, có cache đúng ngữ nghĩa snapshot, có thông báo lỗi tiếng Việt cho các mã lỗi **thực sự tới được client**, và có MSW/fixture dựa trên response thật — để các milestone sau (ViewModel, Dialog, Viewer, danh sách) dùng mà không phải chạm lại tầng API.

## 3. Scope

DTO + union; `getChart`, `createNatalChart(profileId, houseSystem)`, `listCharts({page,pageSize,…})`; `chartKeys`; `useChartQuery`, `useChartsQuery`, `useCreateNatalChartMutation`; helper `isValidChartId`; mã lỗi đã xác minh trong `error-messages.ts`; MSW handlers + fixtures; test API/hook/lỗi/fixture-contract; ghi nhận Known Gaps.

## 4. Out of Scope

Chart Viewer/Wheel/bảng; route, nav, dialog; interaction state; Zustand/Context; **Zod runtime parsing**; sửa Backend (kể cả thêm `birthProfileId` vào `ChartResponse`); `birthData` inline và luồng Guest (`save=false`); `DELETE /charts/:id`; ViewModel/adapter (M2); hiển thị diễn giải (F5); cài dependency; sửa F3; sửa script `typecheck` (chỉ **khuyến nghị**, Mục 27).

## 5. Current Repository State

| Hạng mục | Thực tế | Trạng thái |
|---|---|---|
| HEAD `dev` | `9f0ff70`; frontend `0.2.0` | VERIFIED [repo] |
| `features/` | chỉ `auth`, `birth-profile`; **không có file chart** | VERIFIED [repo] |
| TanStack Query | `package.json`: `^5.102.8`; lockfile `frontend/package-lock.json` → `5.102.8` | VERIFIED [repo] |
| Axios / MSW / Vitest | `axios ^1.19.0`, `msw ^2.15.0`, `vitest ^4.1.10` + jsdom | VERIFIED [repo] |
| TS flags | `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly` (⇒ **không `enum`**), `noUnusedLocals/Parameters`; **không** `resolveJsonModule` (⇒ không import JSON làm fixture) | VERIFIED [repo] |
| Scripts | `lint` = `eslint .`; `typecheck` = `tsc --noEmit` (**vacuous**, Phát hiện 1); `test` = `vitest run --passWithNoTests`; `test:coverage`; `format:check`; `test:e2e` | VERIFIED [repo]+[C-run] |
| `VITE_API_BASE_URL` | `shared/config/env.ts` parse bằng Zod (`z.string().url()`) lúc nạp module; `.env.example` có `VITE_API_BASE_URL=http://localhost:3000`; `apiClient` dùng `env.VITE_API_BASE_URL` làm `baseURL`; CI chạy `cp .env.example .env` | VERIFIED [repo] |
| `.env` cục bộ của owner | Owner nói đã có | **Owner-provided, chưa tự kiểm** (không in giá trị) |
| MSW | `src/test/msw-server.ts` (`setupServer()` rỗng); `src/test/setup.ts`: `server.listen({ onUnhandledRequest: "error" })`, `resetHandlers()` sau mỗi test; handler đăng ký **theo từng test** bằng `server.use(...)` | VERIFIED [repo] |
| Backend sẵn sàng | Owner nói đã sẵn sàng; hai response `[owner]` chụp 2026-10-10 từ `engine chart-engine-v0.2.0+swisseph-wasm-0.1.0` | Owner-provided; **PARTIALLY VERIFIED** (đọc mã khớp response về hình dạng) |
| Baseline test FE | F4 master plan ghi `[C-run]` 78 file/391 test (2026-10-08) | **Không chạy lại trong audit này** |
| ESLint `boundaries/element-types` | `"off"` (TODO Core) | VERIFIED [repo] ⇒ ranh giới feature chỉ bảo đảm bằng review/grep |

## 6. FE Sprint F3 Pattern Audit

| Chủ đề | F3 (thực tế) | M1 áp dụng |
|---|---|---|
| DTO | `features/birth-profile/api/types.ts`: `interface` tay, `ListBirthProfilesParams`/`ListBirthProfilesResponse` **cục bộ feature**; không có kiểu phân trang dùng chung | Giữ nguyên: `ListChartsParams`/`ListChartsResponse` cục bộ. *(Lệch plan F4 v1.1 vốn viết `Paginated<ChartSummary>` — type đó không tồn tại.)* |
| API fn | `export async function x(...)`: `apiClient.<verb><T>(url, ...)` → `response.data`; URL cứng `"/api/v1/..."`; list truyền `{ params }` | Giống hệt |
| ID trong URL | `` `/api/v1/birth-profiles/${id}` `` — **không** `encodeURIComponent` | **Lệch có chủ đích (D-8):** chart dùng `encodeURIComponent(id)` + `isValidChartId` |
| Query keys | `birthProfileKeys = { lists: ()=>["profiles"], list: p=>["profiles",p], detail: id=>["profile",id] }` — hai namespace độc lập, **không** có `all()`/`details()` | **Lệch có chủ đích (D-1):** phân cấp `["charts", …]` vì prompt yêu cầu `all()`/`details()` |
| Query hook | `useQuery({queryKey, queryFn, enabled: Boolean(id)})`, không generic, không `staleTime` | Thêm generic `<ChartResponse, ApiError>`, `staleTime: Infinity`, `refetchOnWindowFocus: false`, `enabled` bằng `isValidChartId` |
| Mutation | `useMutation<Dto, ApiError, Input>`; `onSuccess` chỉ `invalidateQueries({queryKey: keys.lists()})`; **không điều hướng**, không `onError` riêng (lỗi do `createQueryClient().mutations.onError` báo cáo toàn cục) | Giống + `setQueryData` detail |
| Lỗi | `ApiError{status,errorCode,title,detail,fieldErrors}`; UI dùng `getErrorMessage(errorCode)` | Giống |
| MSW | `api/mocks/handlers.ts`: `mockXxx(resolver)` (chỉ khai báo route `*/api/v1/...`), `xxxSuccess()`, `xxxNotFound(mockFn)`…, factory `mockBirthProfile(overrides)`, helper `problemDetails()` (ghi chú "duplicated intentionally") | Giống; `problemDetails` nhân bản lần nữa (D-7) |
| Test | đặt cạnh nguồn (`*.test.ts`/`*.test.tsx`); API test dùng `server.use(...)` + `rejects.toMatchObject({errorCode,status})`; hook test dùng `renderHook` + `createQueryClient()` + `QueryClientProvider` | Giống |
| Import | alias `@shared/*`, `@test/*`; thứ tự import do ESLint `import/order` | Giống |
| Index | `birth-profile` **không** có `index.ts` | Không tạo `features/chart/index.ts` ở M1 (để S4.3) |

## 7. Backend API Dependency Audit — Mục 10

| Ứng viên | Nội dung | Kết luận |
|---|---|---|
| **F4 Implementation Plan v1.1, Mục 10 "Existing API/Data Layer"** (bảng "Endpoint F4 dùng": `POST /charts/natal?save=true`, `GET /charts/:id`, `GET /charts`) | Khớp đúng phạm vi M1 | **Được chọn** — nguồn `[owner]`, file chưa nằm trong repo |
| `docs/api/REST_API_Specification.md` §10 | "API Lifecycle" | Không liên quan |
| REST Spec §4.4/§5.4 | Mô tả chart endpoints | Dùng làm tham chiếu phụ; **khác mã** ở vài điểm (Mục 8.4) |

Kiểm tra lại từng dòng Mục 10 với mã: endpoint, method, query `save`, body, envelope, auth — đều khớp (Mục 19). Hai chỗ **không** khớp: danh sách mã lỗi (Mục 20) và mô tả "cùng mẫu danh sách hồ sơ" (Mục 13).

## 8. Chart API Contract

### 8.1 Endpoint (đọc `chart.routes.ts`, `chart.controller.ts`, schemas)

- Router gắn `authMiddleware(tokenProvider)` toàn bộ (điền `req.user` nếu có token, không ném lỗi). `POST /natal` **không** có `requireAuth()` (Guest hợp lệ với `save=false`); `GET /`, `GET /:id`, `DELETE /:id` có `requireAuth()`.
- `POST /natal`: query `save` = `z.preprocess(v => v === 'true' || v === true, z.boolean().default(false))` → chuỗi **`"true"`** bật lưu. Trả **201** nếu `save`, **200** nếu không.
- Use case: `birthProfileId` XOR `birthData` (không thì `422 EXACTLY_ONE_SOURCE_REQUIRED`); Guest + `save=true` ⇒ `401 UNAUTHORIZED`; Guest + `birthProfileId` ⇒ `401`; hồ sơ không tồn tại/đã xoá ⇒ `404 RESOURCE_NOT_FOUND` (`GetBirthProfileSnapshotUseCase`).
- Body (`createNatalChartSchema`): `birthProfileId?` uuid, `birthData?`, `houseSystem` ∈ {`Placidus`,`WholeSign`} (bắt buộc), `includeOptionalPoints` ⊂ {`Chiron`,`Lilith`,`NorthNode`,`SouthNode`}, `.optional().default([])`.
- `GET /:id`: `chartIdSchema` (uuid) ⇒ sai định dạng `400 MALFORMED_REQUEST`; không thấy ⇒ `404`; không sở hữu ⇒ **`403 FORBIDDEN`** (`assertChartOwnership`).
- `GET /`: `listChartsQuerySchema`: `page` ≥1 (mặc định 1), `pageSize` 1–**100** (mặc định 20), `birthProfileId?`, `sortBy` = `calculatedAt`, `order` ∈ `asc|desc` (mặc định `desc`); trả `{items, total, page, pageSize}`.
- **Diễn giải được tra lại ở mỗi `GET /charts/:id`** (`interpretationLookupService.lookup(chart)`), không lưu cùng chart. Chart `save=true` được ghim version lúc tạo ⇒ nội dung ổn định theo version đã ghim; chart cũ `null` dùng Published mới nhất lúc request (Sprint 4 Summary §1.1).

### 8.2 Hình dạng `ChartResponse` (`chart-response.mapper.ts`, Zod; hầu hết trường là `z.string()`)

`id` uuid · `chartType` · `houseSystem` · `isHouseDataAvailable` · `planets[{name,category,longitude,speed,isRetrograde,sign,degreeInSign,house:number|null}]` · `houses[{number,cuspDegree,signOnCusp}]` · `angles[{type,longitude,sign,degreeInSign}]` · `aspects[{aspectType,planetA,planetB,exactAngle,orb,isApplying:boolean,nature}]` · `patterns[{patternType,involvedPlanets[]}]` · `interpretations[{subjectType,subjectKey,language,bodyText,tone?:string|null}]` · `interpretationVersion: string|null` · `warnings[{code,message,severity,field?,details?}]` · `calculatedAt` · `engineVersion`.

**Không có trong response công khai:** `snapshotInterpretationVersion`, `birthProfileId`, `birthProfileLabel`, dữ liệu sinh, `isBirthTimeKnown`. ⇒ **DTO không khai báo** các trường này (prompt: "không lộ trường chỉ-persistence").

### 8.3 `ChartSummaryResponse` (`chart-summary-response.mapper.ts`)

`{ id: uuid, birthProfileId: uuid|null, birthProfileLabel: string|null (luôn null — D-3/G-02), houseSystem: string, calculatedAt: ISO datetime }`. Không có `chartType`/`isHouseDataAvailable`.

### 8.4 Sai khác giữa tài liệu và Backend (nguồn chuẩn = mã Backend)

| Nguồn | Tài liệu nói | Mã thật | Phân loại |
|---|---|---|---|
| REST Spec §5.4 | `ChartSummaryResponse.birthProfileId: UUID`, `birthProfileLabel` "denormalized" | `birthProfileId` nullable (FK `SetNull`); label luôn `null` | `DOCUMENTATION GAP` / Known Gap G-02 (Backend) |
| REST Spec §4.4 | `422` cho `houseSystem` không hỗ trợ | Zod enum ⇒ `400 MALFORMED_REQUEST` | `DOCUMENTATION GAP` |
| REST Spec §4.4 | Lỗi `400` "thiếu field" | Đúng (`MALFORMED_REQUEST`) | — |
| F4 plan v1.1 Mục 10 | `VALIDATION_ERROR` 422; `CHART_CALCULATION_FAILED` 500 | `MALFORMED_REQUEST` 400; `CHART_CALCULATION_FAILED` 422 | Sai trong plan — sửa bằng Mục 20 |
| REST Spec §5.5/§4.4 note | loại diễn giải `Angle` | nội dung thật dùng `AngleInSign` (seed file: 120 `PlanetInSign`, 120 `PlanetInHouse`, 12 `AngleInSign`) | `DOCUMENTATION GAP` |

## 9. Chart DTO and Type Design

`features/chart/api/types.ts` — `interface`/`type` thuần, **không** `enum`, **không** Zod. TypeScript chỉ là hợp đồng biên dịch, **không xác thực** dữ liệu runtime.

```ts
// Giá trị đã xác minh từ backend/src/modules/chart/domain (chart.types.ts, angle.entity.ts, warning.vo.ts)
export const KNOWN_HOUSE_SYSTEMS = ["Placidus", "WholeSign"] as const;
export const KNOWN_OPTIONAL_POINTS = ["Chiron", "Lilith", "NorthNode", "SouthNode"] as const;
export const KNOWN_PLANET_NAMES = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto",
  "Chiron","NorthNode","SouthNode","Lilith"] as const;
export const KNOWN_ZODIAC_SIGNS = [ /* 12 cung tiếng Anh */ ] as const;
export const KNOWN_ASPECT_TYPES = ["Conjunction","Sextile","Square","Trine","Opposition"] as const;
export const KNOWN_ANGLE_TYPES = ["Ascendant","Midheaven","Descendant","ImumCoeli"] as const;
// + KNOWN_PLANET_CATEGORIES (Personal|Social|Outer), KNOWN_ASPECT_NATURES (Harmonious|Challenging|Neutral),
//   KNOWN_INTERPRETATION_SUBJECT_TYPES (PlanetInSign|AngleInSign|PlanetInHouse)

export type HouseSystem = (typeof KNOWN_HOUSE_SYSTEMS)[number];
export type OptionalPointName = (typeof KNOWN_OPTIONAL_POINTS)[number];
// PlanetName, ZodiacSign, AspectType, AngleType, PlanetCategory, AspectNature, InterpretationSubjectType: tương tự.

export interface CreateNatalChartRequest {       // body — FE chỉ dùng nhánh birthProfileId
  birthProfileId: string;
  houseSystem: HouseSystem;
  includeOptionalPoints: OptionalPointName[];
}
export interface ChartPlanetDto { name: PlanetName; category: PlanetCategory; longitude: number; speed: number;
  isRetrograde: boolean; sign: ZodiacSign; degreeInSign: number; house: number | null; }
export interface ChartHouseDto { number: number; cuspDegree: number; signOnCusp: ZodiacSign; }   // cuspDegree = kinh độ tuyệt đối
export interface ChartAngleDto { type: AngleType; longitude: number; sign: ZodiacSign; degreeInSign: number; }
export interface ChartAspectDto { aspectType: AspectType; planetA: PlanetName; planetB: PlanetName; exactAngle: number;
  orb: number; isApplying: boolean; nature: AspectNature; }
export interface ChartPatternDto { patternType: string; involvedPlanets: PlanetName[]; }
export interface ChartInterpretationDto { subjectType: InterpretationSubjectType; subjectKey: string;
  language: string; bodyText: string; tone?: string | null; }
export interface ChartWarningDto { code: string; message: string; severity: "info" | "warning";
  field?: string; details?: Record<string, unknown>; }
export interface ChartResponse { id: string; chartType: "Natal"; houseSystem: HouseSystem; isHouseDataAvailable: boolean;
  planets: ChartPlanetDto[]; houses: ChartHouseDto[]; angles: ChartAngleDto[]; aspects: ChartAspectDto[];
  patterns: ChartPatternDto[]; interpretations: ChartInterpretationDto[]; interpretationVersion: string | null;
  warnings: ChartWarningDto[]; calculatedAt: string; engineVersion: string; }
export interface ChartSummary { id: string; birthProfileId: string | null; birthProfileLabel: string | null;
  houseSystem: HouseSystem; calculatedAt: string; }
export interface ListChartsParams { page?: number; pageSize?: number; birthProfileId?: string;
  sortBy?: "calculatedAt"; order?: "asc" | "desc"; }
export interface ListChartsResponse { items: ChartSummary[]; total: number; page: number; pageSize: number; }
```

Ghi chú thiết kế:

- **Union đóng cho response (D-3).** Wire thật là `z.string()`; union là **tuyên bố biên dịch dựa trên enum domain Backend**, không phải bảo đảm runtime. Vì vậy export thêm mảng `KNOWN_*` để M2 viết type-guard phòng thủ (`(KNOWN_PLANET_NAMES as readonly string[]).includes(v)`) và adapter xử lý giá trị lạ mà không ném lỗi. Phương án thay thế: để `string` — mất kiểm tra biên dịch ở UI.
- `ChartInterpretationDto.tone` khai báo `optional + nullable` đúng schema Backend (`.nullable().optional()`); **M1 không hiển thị** diễn giải.
- `ChartWarningDto` định nghĩa riêng trong feature `chart` (không import `Warning` từ `birth-profile`: tránh phụ thuộc chéo feature; `severity` ở đây hẹp hơn).
- `ListChartsParams`: ngoài `page/pageSize` (M1 dùng), giữ ba tham số **đã xác minh** của Backend (D-2). Bỏ nếu owner muốn tối thiểu.
- `isValidChartId(id: string | undefined): boolean` (`features/chart/api/isValidChartId.ts`): regex UUID 8-4-4-4-12 hex (khớp phạm vi `z.string().uuid()` của `chartIdSchema`), thuần, không dùng Zod.

## 10. API Function Design

| Hàm | Chữ ký | HTTP | Chi tiết |
|---|---|---|---|
| `getChart` | `(id: string) => Promise<ChartResponse>` | `GET /api/v1/charts/${encodeURIComponent(id)}` | trả `response.data` |
| `createNatalChart` | `(profileId: string, houseSystem: HouseSystem) => Promise<ChartResponse>` | `POST /api/v1/charts/natal` | `apiClient.post<ChartResponse>(url, { birthProfileId: profileId, houseSystem, includeOptionalPoints: [] }, { params: { save: true } })` ⇒ axios serialize `?save=true`; `save=true` là **hằng số nội bộ** (quyết định O-F4-1: mỗi lần tính = một snapshot đã lưu), không phải tham số của hàm |
| `listCharts` | `(params?: ListChartsParams) => Promise<ListChartsResponse>` | `GET /api/v1/charts` | `{ params }` (axios bỏ qua giá trị `undefined`) |

- Auth, JSON header, refresh 401, chuẩn hoá lỗi: do `apiClient` lo (`shared/api/client.ts`) — M1 **không** viết `fetch` hay interceptor mới, **không sửa `shared/api/**`**.
- `includeOptionalPoints: []` là literal cố định (MVP: 10 hành tinh, không Chiron/Lilith/Nút); không phơi tham số này ở M1.
- Kết quả 201 và 200 đều có `data` là `ChartResponse` — `createNatalChart` không phân nhánh theo status.

## 11. Query Key Design

```ts
export const chartKeys = {
  all:     () => ["charts"] as const,
  lists:   () => ["charts", "list"] as const,
  list:    (params: ListChartsParams) => ["charts", "list", params] as const,
  details: () => ["charts", "detail"] as const,
  detail:  (id: string) => ["charts", "detail", id] as const,
};
```

- **Phân cấp (D-1)** — lệch F3 (`["profiles"]` / `["profile", id]` độc lập). Lý do: prompt yêu cầu `all()`/`details()`; với cây phân cấp, `invalidateQueries({queryKey: chartKeys.lists()})` khớp **mọi** `["charts","list",…]` nhưng **không** khớp `["charts","detail",…]` (hai nhánh anh em) ⇒ làm mới danh sách mà không đánh dấu stale các snapshot chi tiết. Test khoá hành vi này.
- Tham số phân trang là **object** nằm trong key; TanStack băm key theo cấu trúc (thứ tự thuộc tính không ảnh hưởng; thuộc tính `undefined` bị bỏ), nên `{page:1,pageSize:12}` ổn định giữa các lần render. `list` **bắt buộc** nhận `params` (khác F3 cho phép `undefined`) để tránh hai key tương đương (`["charts","list",undefined]` vs `{}`).
- Mọi component/hook chỉ dùng `chartKeys.*`; cấm literal `["charts", …]` ngoài `query-keys.ts` (kiểm bằng grep ở M1.7).

## 12. `useChartQuery` Design

```ts
useQuery<ChartResponse, ApiError>({
  queryKey: chartKeys.detail(id ?? ""),
  queryFn: () => getChart(id as string),     // an toàn: enabled đảm bảo id hợp lệ
  enabled: isValidChartId(id),
  staleTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,                 // mở rộng so với prompt (D-6); khớp F4 plan Mục 10
});
```

- **Vì sao khác list:** chart `save=true` là snapshot bất biến (REST Spec 14.8: sửa Birth Profile không đổi Chart cũ) và diễn giải được ghim version ⇒ không cần refetch nền. **Khác** `BirthProfile` (có thể sửa ⇒ F3 có `invalidate(detail)` sau update). Không áp `Infinity` cho list.
- Tham số `id: string | undefined`. `enabled=false` khi thiếu hoặc không phải UUID ⇒ **không có request** (test đếm số request).
- **Ngoại lệ ngữ nghĩa cần biết:** chart cũ chưa ghim version (`null`) có thể đổi diễn giải khi Backend phát hành version mới; với `staleTime: Infinity` thay đổi này chỉ hiện sau khi cache bị loại (`gcTime` mặc định 5 phút khi không còn observer). F4 không hiển thị diễn giải ⇒ chấp nhận; **ghi Known Gap cho F5** (KG-F4M1-03).
- Lỗi: `error` là `ApiError` (generic), `retry` theo mặc định toàn cục `false` (`createQueryClient`).

## 13. `useChartsQuery` Design

```ts
import { keepPreviousData, useQuery } from "@tanstack/react-query";
useQuery<ListChartsResponse, ApiError>({
  queryKey: chartKeys.list(params),
  queryFn: () => listCharts(params),
  placeholderData: keepPreviousData,        // API v5 (không dùng keepPreviousData: true của v4)
});
```

- Phiên bản đã xác định từ `package.json` (`^5.102.8`) và lockfile (`5.102.8`) ⇒ dùng `placeholderData: keepPreviousData` (hàm identity được export từ `@tanstack/react-query`). **Không** dùng `keepPreviousData: true` (v4).
- Khi đổi trang: `data` giữ trang cũ, `isPlaceholderData === true`, `isFetching === true`, `isLoading === false` (status vẫn `success`). Trang (S4.11) dùng `isPlaceholderData` để khoá nút Trước/Sau thay vì hiện lại skeleton.
- **Lệch F3 (D-9, ghi nhận):** `useBirthProfilesQuery` không có `placeholderData`. M1 **không** sửa F3.
- Không đặt `staleTime` riêng (mặc định 0): danh sách có thể thay đổi từ nơi khác (tạo/xoá chart); mutation cũng invalidate rõ ràng.

## 14. `useCreateNatalChartMutation` Design

```ts
interface CreateNatalChartVariables { profileId: string; houseSystem: HouseSystem; }
useMutation<ChartResponse, ApiError, CreateNatalChartVariables>({
  mutationFn: ({ profileId, houseSystem }) => createNatalChart(profileId, houseSystem),
  onSuccess: (chart) => {
    queryClient.setQueryData(chartKeys.detail(chart.id), chart);
    queryClient.invalidateQueries({ queryKey: chartKeys.lists() });   // không await
  },
});
```

| Nội dung | Quyết định |
|---|---|
| Biến / kiểu trả / kiểu lỗi | `{profileId, houseSystem}` / `ChartResponse` / `ApiError` |
| **Trả `chartId` cho caller (D-4)** | `mutateAsync`/`onSuccess` call-site nhận `ChartResponse` ⇒ `chart.id` (UUID, có khi `save=true` — 201). Không bọc thêm object `{chartId}` để khỏi làm mất DTO (giống F3: mutation trả DTO). |
| Cache | `setQueryData(detail)` ngay ⇒ viewer mở `/app/charts/:id` không phát `GET` (nhờ `staleTime: Infinity`); danh sách invalidate. **Không** invalidate `details()`/`all()`. |
| Không await invalidate | giữ giống F3, để điều hướng của consumer không bị chặn bởi refetch danh sách. Test phải `waitFor`. |
| Lỗi | không `onError` trong hook: lỗi tới caller qua `error`/`mutateAsync` reject; báo cáo bất thường do `createQueryClient().mutations.onError` (chỉ báo khi `errorCode` **chưa** nằm trong từ điển) ⇒ không báo cáo trùng. |
| Điều hướng/UI | **không** có trong hook. Consumer (S4.3) điều hướng bằng `mutate(vars, { onSuccess })`/`mutateAsync`; hook-level `onSuccess` chạy trước, callback call-site chạy sau, không ghi cache hai lần. |
| Trùng request | Hook không tự retry (mutation mặc định không retry); khoá nút khi `isPending` thuộc S4.3. |

## 15. State Ownership

`ChartResponse`, `ChartSummary`/danh sách, trạng thái loading/error/fetching: **TanStack Query** (`useQuery`/`useMutation`). Không `useState` sao chép dữ liệu API; không Zustand/Redux/Context mới; không global UI state. Interaction state của viewer thuộc M3+.

## 16. Error Mapping Audit

Đường đi (đã lần theo mã): `Domain/Application error` → `mapChartDomainErrorToAppError` (`chart/application/errors/map-domain-error.ts`, chỉ gọi trong `create-natal-chart.usecase.ts` quanh `chartBuilder.build`) → `AppError` → `error-handler.middleware.ts` → `mapErrorToProblemDetails` (RFC 7807: `status`, `errorCode`, `title = formatTitle(errorCode)`, `detail`) → `apiClient` interceptor đọc `data.errorCode`/`data.title`/`data.detail` (giữ nguyên `errorCode`; thiếu ⇒ `UNKNOWN_ERROR`) → `getErrorMessage(errorCode)`.

Kết luận audit:

1. **`errorCode` sống sót qua mọi tầng** với `AppError`; lỗi không phải `AppError` bị bọc thành `InfrastructureError` ⇒ `500 INTERNAL_SERVER_ERROR`. Lỗi mạng (không có response) ⇒ `status 500`, `errorCode UNKNOWN_ERROR` (`client.ts`).
2. `chart-builder.ts` (try bắt đầu ~dòng 40; `calculateNatal` ~66; `calculateHouses` ~74): chỉ **7** lỗi domain được ném lại nguyên; **mọi lỗi khác** (kể cả `ExternalServiceError(EPHEMERIS_PROVIDER_ERROR)` từ `swiss-ephemeris.adapter.ts`) bị bọc `ChartCalculationFailed` (dòng ~143/145) ⇒ client thấy **`422 CHART_CALCULATION_FAILED`**, không phải `EPHEMERIS_PROVIDER_ERROR`. *(Đọc tĩnh, chưa chạy — `PARTIALLY VERIFIED`.)*
3. Hai lỗi không đi qua mapper chart (lookup diễn giải, đọc/hydrate repository) ⇒ `INTERNAL_SERVER_ERROR` 500 (suy luận từ `mapErrorToProblemDetails`; `INFERRED`).
4. `RATE_LIMIT_EXCEEDED` chỉ tồn tại trong `error-codes.ts`, **không có middleware** ⇒ không tới client hiện tại (`NOT APPLICABLE`).
5. **Vấn đề telemetry (D-5):** `createQueryClient().mutations.onError` **bỏ qua** báo cáo khi `isKnownBusinessError(errorCode)`; `getErrorMessage` gọi `reportError` khi mã chưa ánh xạ. ⇒ ánh xạ một mã **lỗi nội bộ** (`CHART_CALCULATION_FAILED`, `DATA_INTEGRITY_ERROR`) sẽ **tắt** cảnh báo cho lỗi engine/invariant. Chỉ ánh xạ mã mà **người dùng tự sửa được**.

Mã sẽ thêm vào `ERROR_MESSAGES` (xem ma trận Mục 20): `INVALID_DATETIME`, `UNRESOLVABLE_TIMEZONE`, `INVALID_COORDINATES`. Giữ nguyên fallback cho mọi mã còn lại. Mã đã có và dùng lại: `UNAUTHORIZED`, `MALFORMED_REQUEST`, `RESOURCE_NOT_FOUND`, `FORBIDDEN`.

**Thông điệp đề xuất** (cần owner duyệt ngữ điệu, cùng phong cách F3):

- `INVALID_DATETIME`: "Ngày hoặc giờ sinh của hồ sơ này không thể dùng để tính lá số (ví dụ giờ sinh không tồn tại do đổi múi giờ). Vui lòng kiểm tra lại hồ sơ."
- `UNRESOLVABLE_TIMEZONE`: "Không xác định được múi giờ của nơi sinh. Vui lòng chọn lại nơi sinh trong hồ sơ."
- `INVALID_COORDINATES`: "Toạ độ nơi sinh không hợp lệ. Vui lòng chọn lại nơi sinh trong hồ sơ."

## 17. MSW and Fixture Design

**Handlers** (`features/chart/api/mocks/handlers.ts`, mẫu F3): `mockCreateNatalChart` (`http.post("*/api/v1/charts/natal")`), `mockGetChart` (`http.get("*/api/v1/charts/:id")`), `mockListCharts` (`http.get("*/api/v1/charts")`); helper thành công `createNatalChartSuccess(chart?)` (201), `getChartSuccess(chart?)`, `listChartsSuccess(items?, overrides?)` (envelope đủ 4 trường); lỗi `chartNotFound`, `chartForbidden`, `chartMalformedRequest`, `chartDomainError(mockFn, errorCode)` (422 `application/problem+json`, dùng `problemDetails` nhân bản — D-7); factory `mockChartSummary(overrides)`. Host dùng wildcard `*` ⇒ không phụ thuộc giá trị `VITE_API_BASE_URL`. Không đăng ký trong `msw-server.ts` (giữ quy ước `server.use()` theo test). Không nới `onUnhandledRequest`.

**Fixtures** (`features/chart/api/mocks/fixtures.ts`):

| Fixture | Nguồn | Nhãn |
|---|---|---|
| `chartFull` | `fixture_full.json` (id `a9d7dcb2-…`, `isHouseDataAvailable: true`, 10 hành tinh, 12 nhà, 4 góc, 9 aspects, 21 diễn giải, `interpretationVersion: "1.0"`, `calculatedAt 2026-10-10T09:56:45.941Z`) | **CAPTURED** |
| `chartNoHouses` | `fixture_nohouse.json` (id `99e08453-…`, `isHouseDataAvailable: false`, `houses: []`, `angles: []`, `planets[].house: null`, 9 aspects, 10 diễn giải `PlanetInSign`, `"1.0"`) | **CAPTURED** |
| `chartSummaryFixtures` | dựng theo `ChartSummaryResponseMapper` (thật: `birthProfileLabel: null`; một mục `birthProfileId: null`) | **DERIVED từ mã** |

Quy tắc: fixture là **literal TS gán kiểu** (`export const chartFull: ChartResponse = {…}`), **không** import JSON (không có `resolveJsonModule`) và **không** `as`/`as unknown as`; đầu file ghi provenance (ngày chụp, commit `9f0ff70`, `engineVersion`, lệnh chụp). Fixture không dùng ngoài test/MSW (không import từ code runtime).

**Chuyển JSON → TS:** sinh một lần bằng script (in `export const chartFull: ChartResponse = <JSON>;` rồi `prettier --write`), không giữ file JSON trong repo (không có `resolveJsonModule`). Header ghi provenance: ngày chụp 2026-10-10, commit `9f0ff70`, `engineVersion` `chart-engine-v0.2.0+swisseph-wasm-0.1.0`. **Đã kiểm trong audit [C-run] bằng script:** cả hai fixture đúng key-set mapper; mọi enum thuộc `KNOWN_*`; `longitude mod 30 ≈ degreeInSign` và cung đúng; `isRetrograde ⇔ speed < 0`; `orb = |exactAngle − góc chuẩn|` cho cả 9 aspect; `signOnCusp` khớp cusp; `Ascendant` = cusp nhà 1; nhà gán cho 10 hành tinh khớp tính từ cusp (0 sai lệch); `subjectKey` diễn giải khớp đúng planets/angles của chính fixture, đúng thứ tự (10 `PlanetInSign` → `Ascendant_in_Aries` → 10 `PlanetInHouse`). Lưu ý: **planets (trừ `house`) và aspects của hai fixture trùng nhau** (cùng ngày/nơi sinh) — test không được giả định chúng khác nhau.

> **`snapshotInterpretationVersion`:** không xuất hiện trong response ⇒ không có trong DTO/fixture.

## 18. Test Strategy

Tất cả test đặt cạnh nguồn, dùng `server.use(...)` + `createQueryClient()` như F3. Dùng **UUID thật** (không dùng `"123"` như F3 vì `enabled` yêu cầu UUID).

**`isValidChartId.test.ts`:** UUID hợp lệ ✓; `undefined`, `""`, `"123"`, thiếu gạch, ký tự lạ ✗.

**`getChart.test.ts`:** gửi `GET` đúng path (ghi nhận `url.pathname === /api/v1/charts/<uuid>`); id có ký tự đặc biệt được mã hoá (`encodeURIComponent`); trả đúng `data`; 404 → `ApiError{errorCode:"RESOURCE_NOT_FOUND",status:404}`; 403 → `FORBIDDEN`; 400 → `MALFORMED_REQUEST`; 422 → `errorCode` giữ nguyên.

**`createNatalChart.test.ts`:** method `POST`, path `/api/v1/charts/natal`; **`url.searchParams.get("save") === "true"`** và không có tham số `save` nào khác; body bằng `toStrictEqual({ birthProfileId, houseSystem: "Placidus", includeOptionalPoints: [] })` (xác nhận `[]`, không thiếu trường); `WholeSign` được chuyển nguyên; trả `ChartResponse` (201); `Content-Type` JSON; lỗi 401/404/422 truyền `ApiError`. **Ghi nhận:** `save=true` thuộc `POST /charts/natal` (xác minh `create-natal-chart-query.schema.ts`) — không thêm `save` vào `getChart`/`listCharts`.

**`listCharts.test.ts`:** `{page:2,pageSize:12}` → `?page=2&pageSize=12`; không truyền params → không có query string; `order`/`sortBy`/`birthProfileId` được serialize khi có; envelope `{items,total,page,pageSize}`; danh sách rỗng (`items: []`, `total: 0`); 400 → `MALFORMED_REQUEST`; 401 → `ApiError`.

**`query-keys.test.ts`:** `all()`, `lists()`, `list(p)`, `details()`, `detail(id)` đúng giá trị; hai `params` khác nhau ⇒ key khác; cùng nội dung khác thứ tự thuộc tính ⇒ `hashKey` bằng nhau; **`lists()` là tiền tố của `list(p)` nhưng KHÔNG là tiền tố của `detail(id)`** (dùng `queryClient.invalidateQueries` thực tế hoặc `partialMatchKey` để kiểm).

**`useChartQuery.test.tsx`:** (1) `enabled` + UUID hợp lệ ⇒ fetch, `data` đúng kiểu; (2) `undefined` / `"abc"` ⇒ **0 request** (đếm trong handler), `fetchStatus === "idle"`; (3) dùng đúng key (`queryClient.getQueryData(chartKeys.detail(id))`); (4) `staleTime: Infinity`: sau thành công `getQueryCache().find(...).isStale() === false`; (5) `focusManager.setFocused(true)` và `onlineManager` không gây request thứ hai (đếm = 1); (6) mount hook thứ hai cùng id ⇒ không request thêm; (7) 404/403 ⇒ `isError`, `error instanceof ApiError`, đúng `errorCode`; (8) seed cache bằng `setQueryData` ⇒ không gọi mạng.

**`useChartsQuery.test.tsx`:** key = `chartKeys.list(params)`; gửi đúng `page/pageSize`; loading → success; lỗi `ApiError`; **giữ dữ liệu trang trước**: render `page:1` → đợi success → `rerender` `page:2` với handler trễ có kiểm soát ⇒ trong lúc chờ `data.page === 1`, `isPlaceholderData === true`; sau khi xong `data.page === 2`, `isPlaceholderData === false`; danh sách rỗng.

**`useCreateNatalChartMutation.test.tsx`:** gửi đúng request (đếm + bắt body/`save`); `mutateAsync` resolve `ChartResponse` với `id`; `getQueryData(chartKeys.detail(id))` bằng chart trả về; **danh sách đang mount được refetch** (render cùng `useChartsQuery`: số request list 1 → 2) trong khi **detail không bị đánh dấu invalidated** (`getQueryState(detail).isInvalidated === false`); lỗi `422 INVALID_DATETIME` ⇒ `error` là `ApiError`, **cache detail không đổi**, danh sách **không** refetch; mã chưa ánh xạ (`CHART_CALCULATION_FAILED`) ⇒ `reportError` được gọi 1 lần (spy), mã đã ánh xạ (`INVALID_DATETIME`) ⇒ không gọi (xác nhận không báo cáo trùng/đúng telemetry); gọi hai lần liên tiếp ⇒ hai request, hai entry detail (mỗi lần là một snapshot — FG-02).

**`error-messages.test.ts` (thêm ca vào file có sẵn):** bảng 3 mã mới → đúng message, không rỗng, `isKnownBusinessError === true`, `reportError` **không** gọi; mã không ánh xạ có chủ đích (`CHART_CALCULATION_FAILED`, `EPHEMERIS_PROVIDER_ERROR`, `DATA_INTEGRITY_ERROR`, `EXACTLY_ONE_SOURCE_REQUIRED`) ⇒ fallback "Đã có lỗi xảy ra, vui lòng thử lại." + `reportError` có gọi; 4 mã dùng lại (`UNAUTHORIZED`, `MALFORMED_REQUEST`, `RESOURCE_NOT_FOUND`, `FORBIDDEN`) vẫn đúng. **Kiểm tra trước khi sửa:** test "mã lạ → fallback" hiện có dùng mã nào; nếu trùng mã mới thì đổi mã mẫu (không đổi kỳ vọng).

**`fixtures.contract.test.ts` (không dùng Zod):** (a) key-set của `chartFull`/`chartNoHouses` và từng phần tử mỗi mảng **bằng chính xác** danh sách trường trong `chart-response.mapper.ts` (hằng số khai báo trong test, ghi nguồn); (b) mọi giá trị chuỗi thuộc union `KNOWN_*`; (c) bất biến `isHouseDataAvailable`: `true ⇒ houses.length===12 && angles.length===4 && mọi planet.house ∈ 1..12`; `false ⇒ houses=[] && angles=[] && mọi planet.house===null`; (d) `Math.floor(cuspDegree/30)` ↔ `signOnCusp`; `longitude mod 30 ≈ degreeInSign` (dung sai 1e-6); `isRetrograde ⇔ speed<0`; `orb ≈ |exactAngle − góc chuẩn của aspectType|`; (e) `chartFull`: `interpretationVersion === "1.0"`, đúng 21 mục theo thứ tự cố định (10 `PlanetInSign` Sun→Pluto, 1 `AngleInSign`, 10 `PlanetInHouse`) và **danh sách `subjectKey` suy ra từ chính planets/angles của fixture** (`{name}_in_{sign}`, `Ascendant_in_{sign}`, `{name}_in_House_{house}`) trùng khớp; `chartNoHouses`: đúng 10 `PlanetInSign`, **không** có `AngleInSign`/`PlanetInHouse` (Business Rule REST Spec §4.4); mọi mục có `language: "vi"`, khoá `tone` luôn có mặt và bằng `null`, `bodyText` không rỗng; `warnings: []`, `patterns: []` đúng như đã chụp; (f) `calculatedAt` parse được ISO; (g) fixture danh sách có đúng 4 khoá envelope; không fixture `ChartResponse` nào chứa `snapshotInterpretationVersion`/`birthProfileId`. **Không** khẳng định `planetA < planetB` theo bảng chữ cái (quan sát được ở cả 9 aspect nhưng không phải hợp đồng được tài liệu hoá).
**Kiểm tra kiểu của fixture** (gán `: ChartResponse`) chỉ có hiệu lực khi chạy `tsc -p tsconfig.app.json` (Mục 25), **không** do `npm run typecheck`.

**MSW isolation:** `setup.ts` giữ `onUnhandledRequest:"error"`; kiểm bằng `npm test -- src/features/chart` (mọi request phải có handler); thêm một lần thử thủ công (không commit): chạy một test đã bỏ `server.use` và xác nhận nó thất bại thấy được; grep `fetch(`/`axios.create`/`XMLHttpRequest` trong `features/chart` = 0.

## 19. API Contract Matrix

| Operation | Backend endpoint | Method | Request | Response | Auth | Evidence |
|---|---|---|---|---|---|---|
| Get chart | `/api/v1/charts/:id` | GET | path `id` UUID | `200 ChartResponse` | `requireAuth` (Bearer qua interceptor); chỉ chủ sở hữu | `chart.routes.ts`, `chart.controller.ts#getHandler`, `chart-id.schema.ts`, `get-chart.usecase.ts`, `assert-chart-ownership.ts` — VERIFIED [repo] (tĩnh) |
| Create Natal Chart | `/api/v1/charts/natal` | POST | query `save=true`; body `{birthProfileId, houseSystem, includeOptionalPoints:[]}` | `201 ChartResponse` (`save=true`); `200` nếu `save=false` | route **không** `requireAuth`, nhưng use case ném `401` khi Guest + `save=true` hoặc Guest + `birthProfileId` | `chart.routes.ts`, `create-natal-chart-query.schema.ts`, `create-natal-chart.schema.ts`, `create-natal-chart.usecase.ts` (dòng ~53/60/68), `chart.controller.ts#createHandler`; hình dạng response khớp 2 mẫu `[owner]` — VERIFIED [repo] + PARTIALLY VERIFIED (mẫu bị rút gọn) |
| List charts | `/api/v1/charts` | GET | query `page`,`pageSize`(≤100),`birthProfileId?`,`sortBy`,`order` | `200 {items: ChartSummary[], total, page, pageSize}` | `requireAuth`; chỉ chart của user (`listByUserId`) | `list-charts-query.schema.ts`, `chart.controller.ts#listHandler`, `chart-summary-response.mapper.ts` — VERIFIED [repo] (tĩnh) |
| (Delete chart) | `/api/v1/charts/:id` | DELETE | — | `204` | `requireAuth` | Ngoài phạm vi M1 |

Không có OpenAPI sinh sẵn trong repo (spec do `chart.openapi.ts` sinh khi chạy) ⇒ **không dùng generated types**, DTO viết tay như F3. Quy tắc nguồn chuẩn áp dụng: mã Backend > response thật > REST Spec.

## 20. Error Contract Matrix

| Backend error | Origin | HTTP | Client-visible `errorCode` | Vietnamese message | Evidence | Status |
|---|---|---|---|---|---|---|
| Thiếu/hết hạn token | `requireAuth` / use case guest guard | 401 | `UNAUTHORIZED` | đã có: "Bạn cần đăng nhập để tiếp tục." | `require-auth.middleware.ts`, `create-natal-chart.usecase.ts` | VERIFIED; đã ánh xạ — không đổi |
| Body/query/params sai (gồm `houseSystem` ngoài enum, `chartId` không phải UUID) | `validate-{body,query,params}.middleware.ts` | 400 | `MALFORMED_REQUEST` | đã có: "Dữ liệu gửi lên không hợp lệ." | 3 middleware | VERIFIED; đã ánh xạ |
| Hồ sơ sinh không tồn tại/đã xoá; chart không tồn tại | `GetBirthProfileSnapshotUseCase`; `GetChartUseCase` | 404 | `RESOURCE_NOT_FOUND` | đã có | `get-birth-profile-snapshot.usecase.ts:28`, `get-chart.usecase.ts:29` | VERIFIED; đã ánh xạ |
| Chart của người khác | `assertChartOwnership` | 403 | `FORBIDDEN` | đã có | `assert-chart-ownership.ts:12` | VERIFIED; đã ánh xạ |
| `InvalidDateTimeError` (ngày/giờ không hợp lệ; giờ rơi vào DST gap) | `chart-input.validator.ts`, `time-conversion.ts:~106` → `mapChartDomainErrorToAppError` → `DomainError` | 422 | `INVALID_DATETIME` | **thêm** (Mục 16) | `map-domain-error.ts` | VERIFIED mã+ánh xạ; mức dễ xảy ra với hồ sơ hợp lệ: thấp–trung (DST gap) |
| `UnresolvableTimezoneError` | `time-conversion.ts:~46` | 422 | `UNRESOLVABLE_TIMEZONE` | **thêm** | idem | VERIFIED; hiếm |
| `InvalidCoordinateError` | `chart-input.validator.ts` | 422 | `INVALID_COORDINATES` | **thêm** | idem | VERIFIED; hiếm (hồ sơ đã validate lat/long khi lưu) — phòng thủ |
| `ChartCalculationFailed` (gồm lỗi ephemeris bị bọc) | `chart-builder.ts:~143/145` | 422 | `CHART_CALCULATION_FAILED` | **không ánh xạ** (D-5): fallback chung + `reportError` | `map-domain-error.ts`, `chart-builder.ts` | VERIFIED mã; **quyết định chủ đích** |
| `DataIntegrityError` (invariant engine) | entities/calculators | 422 | `DATA_INTEGRITY_ERROR` | **không ánh xạ** (nội bộ) | idem | VERIFIED mã; chủ đích |
| `ExternalServiceError(EPHEMERIS_PROVIDER_ERROR)` | `swiss-ephemeris.adapter.ts` | (bị bọc ⇒ 422 `CHART_CALCULATION_FAILED`) | `EPHEMERIS_PROVIDER_ERROR` **không** tới client qua create | — | `chart-builder.ts` bọc mọi lỗi ngoài 7 loại | PARTIALLY VERIFIED (đọc tĩnh); không ánh xạ |
| `UNSUPPORTED_HOUSE_SYSTEM` / `_CHART_TYPE` / `_CELESTIAL_BODY` | validator | 422 | — | — | Zod enum + FE hằng số chặn trước | Không tới từ request FE ⇒ không ánh xạ |
| `EXACTLY_ONE_SOURCE_REQUIRED` | use case | 422 | — | — | FE luôn gửi đúng `birthProfileId` | Không tới từ FE ⇒ không ánh xạ |
| Lỗi hạ tầng/lookup diễn giải/hydrate chart | repository, `InterpretationLookupService` | 500 | `INTERNAL_SERVER_ERROR` | **không ánh xạ**: fallback + `reportError` | `problem-details.ts` | INFERRED |
| Mất kết nối | axios, không response | — | `UNKNOWN_ERROR` (status 500) | fallback | `client.ts` | VERIFIED |
| Rate limit | không có middleware | — | — | — | `error-codes.ts` only | NOT APPLICABLE |

## 21. Implementation Task Breakdown

Thứ tự thực thi: **M1.1 → M1.6 → M1.2 → M1.3 → M1.4**; M1.5 song song sau M1.1; M1.7 cuối. Mỗi task tự kiểm bằng `npx vitest run <đường dẫn>` + cổng kiểm kiểu của Mục 25.

### F4-M1.1 — API Contract Audit and Chart DTOs
1. **Mục tiêu:** `api/types.ts`, `isValidChartId`. 2. **Vì sao:** nền kiểu cho mọi task. 3. **Tiền đề:** Mục 8–9; quyết định D-2/D-3. 4. **Xem:** `chart-response.mapper.ts`, `chart.types.ts`, `birth-profile/api/types.ts`. 5. **Sửa:** tạo `api/types.ts`, `api/isValidChartId.ts` (+test). 6. **Bước:** hằng số `KNOWN_*` → union → interface → helper → test helper. 7. **API:** n/a. 8. **State:** không. 9. **Test:** `isValidChartId.test.ts`. 10. **Lệnh:** `npx vitest run src/features/chart/api/isValidChartId.test.ts`; `tsc -p tsconfig.app.json`. 11. **Chấp nhận:** DTO không có trường persistence-only; không `enum`/Zod/`any`; `tone` và `house`/`birthProfileId`/`interpretationVersion` nullable đúng. 12. **Phụ thuộc:** không. 13. **Ngoài phạm vi:** adapter/ViewModel. 14. **Rủi ro:** union đóng vs giá trị mới ở Backend → mảng `KNOWN_*` + guard ở M2.

### F4-M1.2 — Chart API Functions
Tạo `getChart.ts`, `createNatalChart.ts`, `listCharts.ts` (+ test mỗi file). Tiền đề: M1.1 **và M1.6** (handler + fixture CAPTURED đã có). Bước: viết hàm theo Mục 10 → test như Mục 18. Chấp nhận: URL/method/body/`save=true` đúng; mọi lỗi giữ `errorCode`; chỉ dùng `apiClient`. Phụ thuộc: M1.1, M1.6. Ngoài phạm vi: `DELETE`, `birthData`. Rủi ro: quên `save` ⇒ `200`/`401` → test khoá.

### F4-M1.3 — Query Keys and Query Hooks
`hooks/query-keys.ts`, `useChartQuery.ts`, `useChartsQuery.ts` (+ test). Chấp nhận: Mục 11–13; **0 request** khi disabled; `staleTime`/focus kiểm bằng hành vi; `keepPreviousData` v5. Phụ thuộc: M1.2. Rủi ro: dùng cú pháp v4 ⇒ test `isPlaceholderData`.

### F4-M1.4 — Create Mutation and Cache Behavior
`hooks/useCreateNatalChartMutation.ts` (+ test). Chấp nhận: Mục 14; cache detail đúng; list invalidate, detail không; trả `ChartResponse` có `id`; không điều hướng. Phụ thuộc: M1.3. Rủi ro: ghi cache trùng nếu consumer cũng `setQueryData` ⇒ ghi quy ước trong tài liệu hook.

### F4-M1.5 — Error Mapping
Sửa `shared/lib/error-messages.ts` + `error-messages.test.ts`. Bước: đọc test hiện có → thêm 3 mã → thêm ca theo Mục 18 → cập nhật chú thích nguồn (`Chart — Sprint F4 M1`). Chấp nhận: Mục 20; mã còn lại giữ fallback. Phụ thuộc: M1.1 (độc lập về mã). Rủi ro: ánh xạ nhầm mã nội bộ ⇒ tắt telemetry (D-5) — test khoá.

### F4-M1.6 — MSW Handlers and Fixtures
`api/mocks/handlers.ts`, `api/mocks/fixtures.ts`, `fixtures.contract.test.ts`. **Tiền đề:** M1.1 (kiểu). C-1 đã xong — dùng `fixture_full.json`/`fixture_nohouse.json`. **Thực hiện trước M1.2** để test API/hook dùng fixture thật ngay, không tạo fixture tạm. Chấp nhận: Mục 17–18 (a)–(g); fixture có nhãn CAPTURED/DERIVED; không ép kiểu. Rủi ro: sửa tay fixture — cấm; nếu Backend đổi hình dạng thì chụp lại.

### F4-M1.7 — Integration Verification and Regression
Chạy toàn bộ cổng Mục 25; `git diff --stat` xác nhận chỉ chạm file trong Mục 23; grep kiểm tra ranh giới (không `fetch`, không `["charts"` ngoài `query-keys.ts`, không import `features/chart` từ `shared`, không `zod` trong `features/chart`); so sánh số test trước/sau (không test cũ nào bị sửa/xoá). Chấp nhận: Mục 24. Rủi ro: lỗi kiểu tiềm ẩn ở 178 file khi bật typecheck thật (Mục 27, C-3).

## 22. Task Dependencies

```text
M1.1 ──► M1.6 ──► M1.2 ──► M1.3 ──► M1.4 ──┐
  │                                          ├─► M1.7
  └──► M1.5 ────────────────────────────────┘
```

## 23. File Change Map

| Path (trong `frontend/src/`) | Action | Purpose | Task | Evidence |
|---|---|---|---|---|
| `features/chart/api/types.ts` | Create | DTO + `KNOWN_*` | M1.1 | mẫu `birth-profile/api/types.ts` |
| `features/chart/api/isValidChartId.ts` (+`.test.ts`) | Create | guard UUID cho `enabled`/page | M1.1 | `chart-id.schema.ts` |
| `features/chart/api/getChart.ts` (+test) | Create | GET detail | M1.2 | `getBirthProfile.ts` |
| `features/chart/api/createNatalChart.ts` (+test) | Create | POST natal `save=true` | M1.2 | `createBirthProfile.ts` |
| `features/chart/api/listCharts.ts` (+test) | Create | GET list | M1.2 | `listBirthProfiles.ts` |
| `features/chart/hooks/query-keys.ts` (+test) | Create | `chartKeys` | M1.3 | `birth-profile/hooks/query-keys.ts` |
| `features/chart/hooks/useChartQuery.ts` (+`.test.tsx`) | Create | detail query | M1.3 | `useBirthProfileQuery.ts` |
| `features/chart/hooks/useChartsQuery.ts` (+`.test.tsx`) | Create | list query | M1.3 | `useBirthProfilesQuery.ts` |
| `features/chart/hooks/useCreateNatalChartMutation.ts` (+`.test.tsx`) | Create | create mutation | M1.4 | `useCreateBirthProfileMutation.ts` |
| `shared/lib/error-messages.ts` (+`.test.ts`) | **Modify** | 3 mã lỗi chart | M1.5 | file hiện có (tái dùng, không tạo từ điển mới) |
| `features/chart/api/mocks/handlers.ts` | Create | MSW | M1.6 | `birth-profile/api/mocks/handlers.ts` |
| `features/chart/api/mocks/fixtures.ts` | Create | fixture CAPTURED/DERIVED | M1.6 | 2 response CAPTURED (`fixture_full.json`, `fixture_nohouse.json`) |
| `features/chart/api/mocks/fixtures.contract.test.ts` | Create | kiểm hợp đồng fixture | M1.6 | mapper Backend |

**Không chạm:** `shared/api/**`, `src/test/{setup,msw-server}.ts`, `features/auth/**`, `features/birth-profile/**`, `backend/**`, `eslint.config.js`, `tsconfig*`, `package.json` (kể cả script `typecheck` — chỉ khuyến nghị), `features/chart/index.ts` (để S4.3).

## 24. Acceptance Criteria

**API & DTO:** 3 hàm khớp ma trận Mục 19; `save=true` chỉ ở `createNatalChart`; DTO khớp mapper (nullable/optional đúng); không trường/endpoint suy đoán; `ChartResponse` chấp nhận `interpretations`/`interpretationVersion` mà không đổi hành vi.
**Hooks & cache:** `useChartQuery` trả DTO có kiểu, 0 request khi disabled, `staleTime: Infinity` + không refetch focus/reconnect; `useChartsQuery` giữ trang trước (`isPlaceholderData`); mutation ghi detail, invalidate **chỉ** list, trả `ChartResponse` (có `id`).
**Lỗi:** 3 mã mới có message tiếng Việt, test riêng; mã nội bộ vẫn fallback + `reportError`; không mã bịa.
**MSW & fixture:** handler khớp path/method/envelope; fixture có nhãn nguồn; contract test xanh; không request thật.
**Chất lượng:** test mới xanh; test cũ không đổi và xanh; `npm test`, `npm run lint`, `npm run format:check` exit 0; `npm run typecheck` exit 0 (không được coi là bằng chứng kiểm kiểu); **cổng `typecheck-no-regression` đạt** — `tsc -p tsconfig.app.json --noEmit` vẫn exit 1 do 14 lỗi có sẵn, nhưng 0 lỗi mới và 0 lỗi trong `src/features/chart/**` + `error-messages*`.

## 25. Quality Gates

| Lệnh | Kiểm gì | Chạy test M1? | Ghi chú |
|---|---|---|---|
| `npm test` (`vitest run --passWithNoTests`) | toàn bộ Vitest | Có | cần `.env` có `VITE_API_BASE_URL` (thiếu ⇒ `env.ts` ném ZodError khi nạp module) |
| `npx vitest run src/features/chart src/shared/lib/error-messages.test.ts` | chỉ M1 | Có | dùng khi phát triển |
| `npm run lint` (`eslint .`) | ESLint (a11y, hooks, import/order) | — | `boundaries/element-types` đang tắt |
| `npm run format:check` | Prettier | — | CI có bước này; owner liệt kê 3 lệnh nhưng nên chạy cả bước này |
| `npm run typecheck` (`tsc --noEmit`) | **0 file nguồn** (Phát hiện 1) | Không | không đủ làm bằng chứng |
| **`npx tsc -p tsconfig.app.json --noEmit`** | type-check 178 file `src` (gồm test) | Có (kiểm kiểu) | **cổng kiểm kiểu thật cho M1** |
| `npm run test:coverage` | CI chạy lệnh này | Có | báo cáo, không đặt ngưỡng mới |
| `npm run test:e2e` | Playwright | Không (M1 không có UI) | không cần cho M1 |

**Baseline kiểu (kết quả C-3, owner chạy `npx tsc -p tsconfig.app.json --noEmit` trên `dev`):** exit 1, **14 lỗi / 11 file**, đều có sẵn từ trước M1: 6× `TS6133` import `React` thừa (`Container.test`, `Grid.test`, `Section.test`, `SkipLink/index`, `Stack.test`, `AuthLayout.test`); 2× `TS2345` trong `shared/api/queryClient.test.ts` (truyền `{errorCode}` vào tham số `Error`); 6× liên quan generic React-Hook-Form/Zod 4 (`shared/hooks/useZodForm.ts` ×2, `BirthProfileForm.tsx`, `pages/auth/login/page.tsx`, `pages/verify/FormFoundationDemo.tsx` ×2). **Cổng M1 (`typecheck-no-regression`):** (1) **0 lỗi** trong `src/features/chart/**` và `src/shared/lib/error-messages*`; (2) tổng số lỗi **không tăng** (vẫn 14, cùng 11 file). Lệnh PowerShell: `npx tsc -p tsconfig.app.json --noEmit | Select-String "src/features/chart|error-messages"` (kỳ vọng không in gì) và `(npx tsc -p tsconfig.app.json --noEmit | Select-String "error TS").Count` (kỳ vọng 14). bash: `npx tsc -p tsconfig.app.json --noEmit | grep -E "src/features/chart|error-messages"` và `... | grep -c "error TS"`.

Bằng chứng chấp nhận: CI `frontend-ci.yml` xanh **trên đúng commit cuối** (format, lint, typecheck, `test:coverage`, build, E2E). Vì CI không chạy kiểm kiểu thật, cần thêm **log `tsc -p tsconfig.app.json --noEmit` của owner** cho M1 (hoặc sửa script — Mục 27).

## 26. Risk Register

| ID | Rủi ro | Mức/Khả năng | Phát hiện | Giảm thiểu |
|---|---|---|---|---|
| R1 | DTO lệch hợp đồng Backend | Cao/TB | contract test (key-set), review với mapper | key-set cứng theo mapper; fixture CAPTURED |
| R2 | Bỏ sót `interpretations`/`interpretationVersion` | TB/Thấp | contract test (e) | khai báo trong DTO + fixture derived |
| R3 | Coi trường nullable là luôn có (`house`, `interpretationVersion`, `birthProfileId`, `tone`) | Cao/TB | type + test `chartNoHouses` | khai báo `\| null`, test fixture không nhà |
| R4 | `save=true` sai/thiếu | Cao/Thấp | test `searchParams` | hằng số nội bộ + test |
| R5 | Envelope phân trang sai | TB/Thấp | test list | khớp `chart.controller.ts#listHandler` |
| R6 | `errorCode` mất ở client | TB/Thấp | test `rejects.toMatchObject` | dùng `apiClient` sẵn có |
| R7 | Mẫu TanStack v4 trong codebase v5 | TB/Thấp | test `isPlaceholderData` | `keepPreviousData` (v5) |
| R8 | Invalidate sai key (làm stale cả detail hoặc không làm mới list) | TB/TB | test key & cache | cây key phân cấp + test tiền tố |
| R9 | Cache detail stale sau mutation | Thấp | test `setQueryData` | ghi cache ngay `onSuccess` |
| R10 | Fixture bịa/lỗi thời | Cao/TB | provenance + nhãn CAPTURED/DERIVED | dùng 2 response CAPTURED đầy đủ (C-1 đã xong); cấm sửa tay fixture |
| R11 | MSW không chặn một request | TB/Thấp | `onUnhandledRequest:"error"` | giữ chính sách; grep `fetch`/`axios.create` |
| R12 | Phá quy ước F3 | Thấp | review diff | bảng Mục 6, ghi rõ 4 lệch có chủ đích |
| R13 | Dependency thừa | Thấp | `git diff package.json` rỗng | không cài gói |
| R14 | Mở rộng sang Backend | TB/Thấp | `git diff --stat` | FG-01 là Known Gap theo quyết định owner |
| R15 | **Cổng `typecheck` hiện không kiểm gì** — lỗi kiểu lọt qua CI | Cao/Cao | [C-run] 0 vs 178 file; baseline 14 lỗi | cổng `typecheck-no-regression` của M1 (Mục 25) + chore riêng bật typecheck thật trước M2 (Mục 27, C-3) |
| R16 | Ánh xạ mã lỗi nội bộ tắt telemetry | TB/TB | test `reportError` | D-5 |
| R17 | Bật typecheck thật làm CI đỏ vì 14 lỗi có sẵn | TB/Cao nếu đổi script ngay | baseline C-3 | **không** đổi script trong M1; sửa 14 lỗi trong chore riêng rồi mới đổi |

## 27. Known Gaps and Technical Debt

| ID | Vấn đề | Phân loại |
|---|---|---|
| **C-1** | ~~JSON đầy đủ của hai response~~ | **ĐÃ GIẢI QUYẾT** — `fixture_full.json`, `fixture_nohouse.json` (có diễn giải thật, `"1.0"`), đã kiểm bất biến |
| **C-3** | `npm run typecheck` không kiểm file nguồn; baseline thật = **14 lỗi / 11 file** (Mục 25). **Đề xuất (chờ owner xác nhận):** (1) **giữ nguyên script `typecheck` trong M1**, dùng cổng `typecheck-no-regression`; (2) mở chore riêng **"F4-M0 Typecheck Enablement"** ngay sau khi M1 đóng, **trước M2**: sửa 14 lỗi → đổi `typecheck` thành `tsc -p tsconfig.app.json --noEmit` (và để `build` gọi cùng lệnh) trong cùng PR | Quyết định cổng kiểm kiểu: `SHOULD RESOLVE BEFORE M1 CLOSURE`; chore: `KNOWN GAP — DEFER` có hạn (trước M2) |
| KG-F4M1-01 | `ChartResponse` không có `birthProfileId`/dữ liệu sinh (FG-01); Backend giữ `0.4.0` | `KNOWN GAP — DEFER` (quyết định owner 2026-10-10) |
| KG-F4M1-02 | ~~Fixture diễn giải là DERIVED~~ — đã nâng thành CAPTURED nhờ seed nội dung và chụp lại | **ĐÃ ĐÓNG** |
| KG-F4M1-03 | `staleTime: Infinity` + chart cũ `null` ghim version ⇒ diễn giải có thể đổi sau khi cache bị loại; F4 không hiển thị diễn giải | `KNOWN GAP — DEFER` (xử lý ở F5) |
| KG-F4M1-04 | `birthProfileLabel` luôn `null`; `birthProfileId` nullable (REST Spec §5.4 lệch) | `BACKEND CONTRACT ISSUE` (G-02) + `DOCUMENTATION GAP` |
| KG-F4M1-05 | REST Spec: `422` cho `houseSystem`, loại diễn giải `Angle`; plan F4 Mục 10: mã lỗi/status sai | `DOCUMENTATION GAP` |
| KG-F4M1-06 | `problemDetails` helper nhân bản lần hai (F3 + chart) | `KNOWN GAP — DEFER` (gom về `@test/` sau) |
| KG-F4M1-07 | F3 `useBirthProfilesQuery` chưa có `placeholderData` (đổi trang hiện skeleton lại) | `KNOWN GAP — DEFER` (F3, ngoài phạm vi) |
| KG-F4M1-08 | `EPHEMERIS_PROVIDER_ERROR` bị bọc thành `CHART_CALCULATION_FAILED` (mất phân biệt nguyên nhân) | `BACKEND CONTRACT ISSUE` (chỉ ghi nhận) |
| KG-F4M1-09 | File plan F4 chưa nằm trong `docs/implementation/` | `DOCUMENTATION GAP` |
| — | Baseline FE test chưa chạy lại trong audit này | `UNVERIFIED` — M1.7 chạy trước/sau |
| — | `.env` cục bộ / Backend sẵn sàng | Owner-provided, chưa tự kiểm |

## 28. Definition of Done

M1 xong khi: toàn bộ file Mục 23 có mặt; mọi tiêu chí Mục 24 thoả; `npm test`, `lint`, `format:check` exit 0 ở commit cuối và cổng `typecheck-no-regression` (Mục 25: 0 lỗi trong `src/features/chart/**` + `error-messages*`, tổng vẫn 14) đạt; CI xanh trên đúng commit đó; không file nằm ngoài danh sách được sửa; `git diff package.json package-lock.json` rỗng; Evidence Matrix lưu bằng chứng thật (lệnh + kết quả quan sát), phân biệt rõ CAPTURED/DERIVED; Known Gaps Mục 27 được ghi lại.

## 29. Final Architect Review

| Hạng mục | Đánh giá |
|---|---|
| Tương thích F3 | Cao; bốn lệch có chủ đích (key phân cấp, `encodeURIComponent`/guard UUID, `placeholderData`, generic hook) đều có lý do và test |
| Tương thích Backend | Hợp đồng 3 endpoint khớp mã (tĩnh); sai khác tài liệu đã liệt kê; chưa gọi API thật |
| DTO | Nullable/optional đúng mapper; không lộ trường persistence; union đóng là tuyên bố biên dịch, không phải xác thực runtime |
| TanStack v5 | `5.102.8` xác định từ lockfile; dùng `keepPreviousData` kiểu v5 |
| Nhất quán mutation | `setQueryData` + invalidate `lists()` đúng nhánh; không invalidate detail |
| Mã lỗi | Chỉ thêm mã đã lần theo tới `ApiError.errorCode` và người dùng tự sửa được; sửa 3 sai lệch của plan F4 |
| Fixture | 2 CAPTURED đầy đủ (có diễn giải thật, đã kiểm bất biến bằng script); chỉ `chartSummaryFixtures` là DERIVED từ mã |
| Cô lập MSW | Giữ `onUnhandledRequest:"error"`; host wildcard |
| Chất lượng TS | Rủi ro lớn nhất: cổng `typecheck` không kiểm gì; baseline thật 14 lỗi có sẵn, M1 dùng cổng không-hồi-quy và chore riêng trước M2 |
| Kỷ luật phạm vi | Không UI/route/store/dependency/Backend; `index.ts` để S4.3 |

## 30. Final Recommendation

**`READY FOR IMPLEMENTATION`**

Không còn điều kiện chặn. Hai điều kiện của v1.0 đã được xử lý:

- **C-1** — đã giải quyết: hai fixture CAPTURED đầy đủ (Mục 17).
- **C-3** — đã có baseline thật (14 lỗi / 11 file có sẵn). M1 không bị chặn vì cổng `typecheck-no-regression` (Mục 25) được định nghĩa độc lập với việc sửa script. Quyết định về script (đề xuất ở Mục 27) có thể chốt song song; mặc định áp dụng đề xuất nếu owner không đổi.

**D-1…D-9 đã được owner xác nhận (2026-10-10):** D-1 key phân cấp · D-2 `ListChartsParams` đủ tham số đã xác minh · D-3 union đóng + `KNOWN_*` · D-4 mutation trả `ChartResponse` · D-5 chỉ ánh xạ `INVALID_DATETIME`/`UNRESOLVABLE_TIMEZONE`/`INVALID_COORDINATES` · D-6 `refetchOnReconnect: false` · D-7 nhân bản `problemDetails` · D-8 `encodeURIComponent` + `isValidChartId` · D-9 `placeholderData: keepPreviousData`.

Thứ tự thực thi: **M1.1 → M1.6 → M1.2 → M1.3 → M1.4**, M1.5 song song, M1.7 cuối.

---

## Phụ lục A — Chụp response đầy đủ (C-1 đã hoàn tất; giữ để chụp lại khi Backend đổi hình dạng)

Mục tiêu: lưu **nguyên văn** hai response (không rút gọn) vào hai file JSON để làm fixture. Response không chứa dữ liệu cá nhân (không có tên/ngày sinh), nhưng hãy ghi lại *hồ sơ nào đã dùng* (có/không có giờ sinh). Các lệnh dưới đây **chưa được Claude chạy thử** — kiểm tra lại tên trường trước khi chạy (đường dẫn login lấy từ `features/auth/api/login.ts`; body `LoginRequest{email,password}`; `AuthResponse.accessToken`).

**PowerShell (Windows):**
```powershell
$base = "http://localhost:3000"
$login = Invoke-RestMethod -Method Post -Uri "$base/api/v1/auth/login" -ContentType "application/json" `
  -Body (@{ email = "<email>"; password = "<password>" } | ConvertTo-Json)
$h = @{ Authorization = "Bearer $($login.accessToken)" }
# Liệt kê hồ sơ để lấy id (có giờ sinh / chưa biết giờ sinh)
(Invoke-RestMethod -Uri "$base/api/v1/birth-profiles?pageSize=100" -Headers $h).items | Select id,label,isBirthTimeKnown
# Chụp NGUYÊN VĂN (không dùng ConvertTo-Json: mặc định Depth=2 sẽ cắt mảng lồng nhau)
$body = '{"birthProfileId":"<PROFILE_ID>","houseSystem":"Placidus","includeOptionalPoints":[]}'
(Invoke-WebRequest -Method Post -Uri "$base/api/v1/charts/natal?save=true" -Headers $h `
  -ContentType "application/json" -Body $body).Content | Out-File chart-full.json -Encoding utf8
# Lặp lại với hồ sơ chưa biết giờ sinh → chart-no-houses.json
```

**bash:**
```bash
BASE=http://localhost:3000
TOKEN=$(curl -s -X POST "$BASE/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"<email>","password":"<password>"}' | jq -r .accessToken)
curl -s -X POST "$BASE/api/v1/charts/natal?save=true" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"birthProfileId":"<PROFILE_ID>","houseSystem":"Placidus","includeOptionalPoints":[]}' > chart-full.json
```

**Tuỳ chọn (KG-F4M1-02):** để có response CAPTURED với diễn giải thật, chạy `npm run prisma:seed:content` trong `backend/` (script có trong `backend/package.json`; xem README/Sprint 4 Summary M3 về cách dùng) trên DB dev, rồi chụp lại `chart-full.json`; kỳ vọng `interpretationVersion: "1.0"` và 10 mục `PlanetInSign` + 10 `PlanetInHouse` + 1 `AngleInSign` (Sprint 4 Summary §1.1). Con số này chưa được xác minh bằng chạy thật.
