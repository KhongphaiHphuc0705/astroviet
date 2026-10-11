# AstroViet — FE Sprint 4 Implementation Plan

## Natal Chart Viewer

**Vị trí đề xuất:** `docs/implementation/Sprint_F4_Implementation_Plan.md` (blueprint tạm thời; theo quy ước, xoá sau khi sprint đóng, chỉ lưu Evidence Matrix/Known Gaps vào `archive/sprint-f4/`)
**Phiên bản:** 1.1 — `READY FOR IMPLEMENTATION` (owner đã phê duyệt O-F4-1/2/3; hợp đồng Backend cho điều kiện của O-F4-3 và cho phương án B của O-F4-2 đã được xác minh, xem Mục 0 và 7.1)
**Căn cứ:** audit trực tiếp nhánh `dev` tại `9f0ff70` (clone mới, 2026-10-08): `frontend/**`, `backend/src/modules/chart/**`, `docs/frontend/*` (UI Spec, Architecture Spec, Design System, Coding Standards), `docs/api/REST_API_Specification.md`, tài liệu Sprint 4 Backend (đã đóng) và F3.
**Quy ước trạng thái bằng chứng:** `VERIFIED` (đọc mã/chạy lệnh thật), `PARTIALLY VERIFIED`, `UNVERIFIED`, `BLOCKED`, `NOT APPLICABLE`, `DEFERRED`. Nguồn: `[repo]` đọc mã/tài liệu; `[C-run]` Claude chạy trong sandbox khi lập plan (baseline, không phải bằng chứng đóng sprint). Plan phân biệt rõ **Current State** (hiện có), **Target State** (đích), **Planned Work** (việc cần làm).

---

## 0. Cập nhật v1.1 — Quyết định đã được owner phê duyệt

| Mã | Quyết định (frozen) | Xác minh hợp đồng Backend (`[repo]`) | Tác động lên plan |
|---|---|---|---|
| O-F4-1 | Route `/app/charts/:chartId`; tính bằng `POST /charts/natal?save=true`; mỗi lần tính tạo một chart snapshot đã lưu | `POST /api/v1/charts/natal` nhận `?save=true` → 201 + `ChartResponse` có `id`; `GET /charts/:id` yêu cầu đăng nhập | Giữ nguyên Mục 11, 14 |
| O-F4-2 | **Phương án B:** thêm danh sách chart tối thiểu (`GET /charts`) | Đã xác minh (Mục 7.1): có endpoint, có phân trang, sắp xếp mới nhất trước, chỉ trả chart của người dùng (`requireAuth` + `listByUserId`), loại chart đã xoá mềm | Thêm **FE-S4.11** (Saved Charts List), route `/app/charts`, mục nav "Lá số của tôi"; gỡ FG-02; cập nhật Mục 3, 4, 7, 10, 11, 13, 14, 30, 32, 37–51 |
| O-F4-3 | `includeOptionalPoints: []` (10 hành tinh, không Chiron mặc định); dialog chỉ chọn hệ nhà (Placidus mặc định / Whole Sign) — **kèm điều kiện xác minh contract** | **Đã xác minh:** `createNatalChartSchema`: `houseSystem` = `z.enum(['Placidus','WholeSign'])` (bắt buộc); `includeOptionalPoints` = mảng enum `Chiron|Lilith|NorthNode|SouthNode`, `.optional().default([])` ⇒ gửi `[]` hợp lệ và Chiron/nút/Lilith **không** xuất hiện nếu không yêu cầu | Điều kiện đã đáp ứng; giữ Mục 10 |
| Mặc định | Các khuyến nghị còn lại giữ nguyên (nút zoom thay pinch; `role="group"`; không visual regression; lọc Aspect Table khi chọn hành tinh; `useMediaQuery`) | — | Không đổi |

Thay đổi cấu trúc so với v1.0: số task từ 10 lên **11** (FE-S4.11). Không thêm dependency mới.

## 1. Executive Summary

Sprint F4 xây **Natal Chart Viewer**: người dùng đã đăng nhập chọn một Birth Profile, bấm tính lá số, nhận `ChartResponse` từ Backend (đã lưu, có `id`) và xem lá số qua **Chart Wheel (SVG)** cùng **Planet / House / Aspect Table** ngữ nghĩa, đồng bộ chọn hai chiều, responsive và có phương án thay thế dạng bảng cho người dùng bàn phím/screen reader.

Phát hiện quan trọng của audit (đều `VERIFIED`):

1. **Chưa có gì về chart ở frontend.** Không có code, route, type hay fixture liên quan chart. `features/` mới có `auth` và `birth-profile`; `pages/app/page.tsx` vẫn là placeholder "Dashboard" ([repo]).
2. **Hạ tầng dữ liệu đã đủ, không cần thư viện mới.** TanStack Query v5, axios (`apiClient` có interceptor token/refresh, `ApiError{status,errorCode,…}`), MSW v2, Vitest + Testing Library + `vitest-axe`, Playwright, Zustand (3 store) đều đã có ([repo]). Không cần thêm React Query/Axios/Zustand/chart library.
3. **Hợp đồng Backend đã chốt và ổn định** (Sprint 4 Backend đóng, CI #260). `ChartResponse` có planets/houses/angles/aspects/patterns/interpretations/`interpretationVersion`/warnings. **Không** có `birthProfileId` hay dữ liệu sinh; **không** cam kết thứ tự mảng; `isApplying` chỉ là boolean.
4. **UI Spec mâu thuẫn với router thực tế** (spec: `/chart/new`, `/chart/:chartId`, `/app/charts`; thực tế mọi trang người dùng nằm dưới `/app/*` và Backend `GET /charts/:id` yêu cầu đăng nhập). Plan chọn `/app/charts/:chartId` (Mục 11).
5. **Chart Guest không xem lại được** (`save=false` không có `id` truy xuất), nên luồng Guest nằm ngoài F4 (Mục 4).
6. **Baseline frontend xanh:** [C-run] `typecheck`, `lint`, `format:check`, `build` exit 0; Vitest 78 file / 391 test pass (cần `VITE_API_BASE_URL`, nếu thiếu thì `env.ts` ném ZodError ở khâu nạp module).

Kiến trúc đề xuất (đơn giản nhất thoả yêu cầu): feature `chart` mới theo cấu trúc `api/ hooks/ model/ ui/`; **SVG tự vẽ** với tầng hình học thuần (không React); **state chọn/hover cục bộ trong `ChartViewer`** (không Zustand, không Context); server state ở TanStack Query với `staleTime: Infinity`; tính lá số dùng `POST /api/v1/charts/natal?save=true` rồi điều hướng tới `/app/charts/:chartId`. Diễn giải (`interpretations`) được type/chấp nhận nhưng **không hiển thị** ở F4 (Interpretation UI là sprint F5).

## 2. Sprint Goal

> Hiển thị Natal Chart do Backend tính toán, đúng dữ liệu, truy cập được bằng bàn phím và screen reader, dùng được trên desktop/tablet/mobile, và không bao giờ coi "chưa có dữ liệu Nhà" là lỗi tính toán.

Luồng đích:

```text
Birth Profile list  →  "Tính lá số" (dialog chọn hệ nhà)  →  POST /charts/natal?save=true
   →  loading  →  ChartResponse (có id)  →  /app/charts/:chartId  →  Chart Viewer
   (Wheel + Planet/House/Aspect Table + trạng thái giờ sinh chưa rõ)
```

## 3. Scope

| Hạng mục | Nội dung |
|---|---|
| Luồng | Từ danh sách Birth Profile (`/app/profiles`) → tính lá số → xem lá số; tải lại trang/ truy cập trực tiếp `/app/charts/:chartId` vẫn xem được (dữ liệu từ `GET /charts/:id`) |
| Danh sách lá số đã lưu (v1.1) | `/app/charts`: liệt kê chart của người dùng (mới nhất trước, phân trang Trước/Sau), mỗi mục có liên kết mở `/app/charts/:chartId`; loading/error/empty; mục nav "Lá số của tôi" |
| Chart Wheel | SVG: vòng 12 cung, vòng 12 nhà (khi có), góc ASC/MC/DSC/IC (khi có), hành tinh + nghịch hành, đường aspect, chia độ |
| Bảng | Planet Table, House Table, Aspect Table (bảng ngữ nghĩa + dạng thẻ dưới `sm`) |
| Tương tác | Hover/focus/chọn hành tinh và aspect; đồng bộ Wheel ↔ bảng; bàn phím; cảm ứng |
| Trạng thái | Loading (Skeleton), lỗi tính/lỗi tải, không tìm thấy, thiếu dữ liệu, giờ sinh chưa rõ (suy giảm, không phải lỗi) |
| Responsive/A11y | 3 nhóm breakpoint, thay thế dạng bảng, live region, skip link, reduced motion |
| Tích hợp | Từ vựng tiếng Việt cho thuật ngữ chiêm tinh, từ điển lỗi, MSW + fixture chart, test unit/component/integration/E2E |
| Tương thích BE Sprint 4 | Type chấp nhận `interpretations`/`interpretationVersion`; render lá số độc lập hoàn toàn với nội dung diễn giải |

## 4. Out of Scope

Interpretation UI (F5), Guest/anonymous chart flow, xoá lá số, lọc/sắp xếp/tìm kiếm trong danh sách chart (chỉ Trước/Sau, mới nhất trước), tạo Birth Profile mới ngay trong dialog tính lá số (dùng luồng Birth Profile hiện có), Transit/Synastry/Composite/Progression/Solar Return, Pattern UI (Backend trả `patterns: []`, G-13 stub), ma trận aspect (`grid` layout), element colour coding (`SignBadge showElement`), export/chia sẻ/PDF/ảnh, thay đổi Backend, tính toán chiêm tinh phía frontend, thiết lập `<title>`/focus toàn cục (nợ OQ-M8-1/2 của Core), thay đổi ESLint `boundaries` toàn repo, thiết kế lại shared UI.

Các phần này được ghi ở Mục 47 (Known Gaps) thay vì lặng lẽ kéo vào sprint.

## 5. Current Repository State

| Hạng mục | Thực tế | Trạng thái |
|---|---|---|
| Frontend | `frontend/` v`0.2.0`, React 18.3, TypeScript 5.6 (strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` + `erasableSyntaxOnly` ⇒ **không dùng `enum`**), Vite 6, Tailwind 3.4, `"type": "module"` | VERIFIED |
| Cấu trúc | `src/{app,assets,entities,features,pages,shared,test,widgets}` (FSD cải biên); 187 file; alias `@app @pages @widgets @features @entities @shared @test` | VERIFIED |
| Scripts | `dev`, `build` (`tsc --noEmit && vite build`), `typecheck`, `lint`, `format:check`, `test` (`vitest run --passWithNoTests`), `test:coverage`, `test:e2e` (`playwright test`) | VERIFIED |
| Thư viện sẵn có | `@tanstack/react-query`, `axios`, `react-router-dom` 7, `zustand`, `react-hook-form` + `zod` 4, `lucide-react`, `clsx`, `tailwind-merge`; dev: `msw`, `vitest-axe`, `@playwright/test`, `eslint-plugin-jsx-a11y` | VERIFIED |
| **Không có** | Recharts, Framer Motion, Storybook, jest-axe/Playwright visual, OpenAPI codegen, thư viện chart | VERIFIED |
| Baseline | [C-run] typecheck/lint/format/build exit 0; Vitest 78 file / 391 test pass (`VITE_API_BASE_URL=http://localhost:3000`); bundle chính 453 kB (144 kB gzip) | VERIFIED |
| CI frontend | `frontend-ci.yml`: format → lint → typecheck → `test:coverage` → build → dựng backend thật (Postgres, `prisma:deploy`, `node dist/server.js`) → `npx playwright install` → `npm run test:e2e` | VERIFIED |
| Chart code hiện có | **Không có** (không type, route, hook, component, fixture) | VERIFIED |
| Tooling ranh giới | `boundaries/element-types` đang **tắt** (TODO) → ranh giới feature chỉ được bảo đảm bằng review/grep | VERIFIED |
| Debt liên quan | Router có TODO: `<title>` động (OQ-M8-1), focus sau điều hướng (OQ-M8-2), ánh xạ route Phase 1/2/3 | VERIFIED |

## 6. Previous Sprint Dependencies

| Phụ thuộc | Nguồn | Trạng thái |
|---|---|---|
| Auth (login/refresh, `ProtectedRoute`, `apiClient` interceptor) | F2 | VERIFIED, dùng lại nguyên |
| Birth Profile CRUD + danh sách + `BirthProfile` type (`isBirthTimeKnown`, `birthTime`) | F3 (đóng, CI xanh) | VERIFIED |
| Từ điển lỗi `getErrorMessage(errorCode)` (không bao giờ hiển thị `.message` thô của backend) | F3 bài học | VERIFIED |
| Shared UI: Alert, Badge, Button, Card, Checkbox, Container (`wide`), Divider, EmptyState, Grid, Input, Label, Modal, Radio, Section, Select, Skeleton, SkipLink, Spinner, Stack, Switch, Textarea | F1–F3 | VERIFIED |
| Backend `POST /charts/natal`, `GET /charts/:id`, Sprint 4 Interpretation (đóng, v0.4.0) | Backend | VERIFIED (CI #260) |
| Việc F3 chuyển sang F4: cảnh báo Ascendant/House khi thiếu giờ sinh (F3 OQ-1 đã quyết định thuộc Chart) | F3 | VERIFIED trong tóm tắt F3 |

## 7. Backend `ChartResponse` Audit

Nguồn sự thật: `backend/src/modules/chart/presentation/mappers/chart-response.mapper.ts` (Zod) + REST Spec §5.4/§5.5/§14.9; `[repo]` + OpenAPI sinh được ([C-run] ở Sprint 4).

| Trường | Kiểu | Nullable | Ghi chú đã xác minh |
|---|---|---|---|
| `id` | uuid string | không | Có với chart đã lưu (`save=true`) |
| `chartType` | string | không | Hiện chỉ `Natal` |
| `houseSystem` | string | không | `Placidus` \| `WholeSign` |
| `isHouseDataAvailable` | boolean | không | `false` = trạng thái suy giảm **bình thường** (thiếu giờ sinh); khi `false` thì `houses=[]`, `angles=[]` (INV-4 của entity Chart) |
| `planets[]` | `{name, category, longitude, speed, isRetrograde, sign, degreeInSign, house}` | `house: number \| null` | `longitude` tuyệt đối (độ thập phân); `degreeInSign` thập phân trong cung; `sign` tên tiếng Anh; `name` thuộc 14 giá trị `PlanetName` (10 hành tinh + Chiron, NorthNode, SouthNode, Lilith); Chiron/nút/Lilith chỉ có khi request `includeOptionalPoints` |
| `houses[]` | `{number, cuspDegree, signOnCusp}` | không | `cuspDegree` là **kinh độ tuyệt đối** của đỉnh nhà (không phải độ trong cung); có đủ 12 phần tử khi có dữ liệu nhà |
| `angles[]` | `{type, longitude, sign, degreeInSign}` | không | `type`: `Ascendant`, `Midheaven`, `Descendant`, `ImumCoeli`; đủ 4 hoặc rỗng |
| `aspects[]` | `{aspectType, planetA, planetB, exactAngle, orb, isApplying, nature}` | không | 5 loại: Conjunction/Sextile/Square/Trine/Opposition; `nature`: `Harmonious`\|`Challenging`\|`Neutral`; `orb` thập phân; **`isApplying` chỉ boolean** (không có trạng thái thứ ba "exact") |
| `patterns[]` | `{patternType, involvedPlanets[]}` | không | Luôn `[]` hiện nay (G-13 stub) |
| `interpretations[]` | `{subjectType, subjectKey, language, bodyText, tone?}` | `tone` nullable | Mảng phẳng, luôn có, có thể `[]`; không có `contentSource/status/version` |
| `interpretationVersion` | string | **nullable** | Luôn có khoá |
| `warnings[]` | `{code, message, severity, field?, details?}` | — | Hiện chỉ cảnh báo engine (vd house system không hội tụ); `message` là tiếng Anh |
| `calculatedAt`, `engineVersion` | ISO datetime / string | không | Metadata |

Thứ tự mảng: **Backend không cam kết** (aspect.calculator chỉ chuẩn hoá cặp hành tinh theo thứ tự chữ cái); frontend phải tự sắp xếp hiển thị bằng thứ tự chính tắc (Mục 15). Interpretation có thứ tự cố định nhưng F4 không dùng.

**Không có trong response:** `birthProfileId`, dữ liệu/ nhãn hồ sơ sinh, ngày giờ nơi sinh, `isBirthTimeKnown`. Hệ quả: trang chart **không thể tự hiển thị tên hồ sơ** nếu chỉ có `chartId`; và "giờ sinh chưa rõ" chỉ suy ra được qua `isHouseDataAvailable === false`. Đây là gap hợp đồng (Mục 47, loại *Requires Backend change*), **không** được vá ở frontend bằng suy đoán.

### 7.1 Hợp đồng bổ sung đã xác minh (v1.1) — `GET /charts` và `POST /charts/natal`

| Hạng mục | Thực tế (`[repo]`, backend `chart/presentation/**`, `chart/application/use-cases/list-charts.usecase.ts`) |
|---|---|
| Endpoint | `GET /api/v1/charts` — `requireAuth()`; `GET /charts/:id` cũng `requireAuth()` |
| Query | `page` (≥1, mặc định 1), `pageSize` (1–100, mặc định 20), `birthProfileId?` (uuid), `sortBy` (`calculatedAt`), `order` (`asc`\|`desc`, mặc định `desc`) |
| Response | `{ items: ChartSummaryResponse[], total, page, pageSize }` (cùng dạng envelope như danh sách Birth Profile) |
| `ChartSummaryResponse` | `{ id, birthProfileId: string\|null, birthProfileLabel: string\|null, houseSystem, calculatedAt }` — **không** có `chartType`, `isHouseDataAvailable`, hay dữ liệu sinh |
| `birthProfileLabel` | **Luôn `null`** (Known Gap G-02/D-3 của Backend: chưa export label xuyên module) |
| `birthProfileId` | Nullable; FK `onDelete: SetNull` ⇒ **hồ sơ bị xoá thì chart còn nhưng `birthProfileId = null`** |
| Phân quyền | `listByUserId(requestingUserId)` — chỉ chart của người dùng đăng nhập; lọc `deleted_at = null` |
| Sắp xếp mặc định | `calculatedAt` giảm dần |
| Tạo chart | `houseSystem`: `Placidus`\|`WholeSign` (bắt buộc); `includeOptionalPoints`: tập con của `Chiron, Lilith, NorthNode, SouthNode`, mặc định `[]`; `birthProfileId` **hoặc** `birthData` (không cả hai) |

Hệ quả cho thiết kế danh sách: mục chỉ có `houseSystem` + `calculatedAt` + `birthProfileId`. Để hiển thị tên hồ sơ, frontend **ghép phía client** `birthProfileId` với danh sách hồ sơ (`useBirthProfilesQuery({ page: 1, pageSize: 100 })`, giới hạn Backend 100) thành một `Map`; chart có `birthProfileId = null` hoặc không tìm thấy hồ sơ hiển thị "Hồ sơ đã xoá hoặc không còn". Giới hạn: tài khoản có hơn 100 hồ sơ sẽ có chart hiển thị "không còn" sai (Known Gap FG-13; sửa thật cần Backend đưa `birthProfileLabel`).

Phân loại các sai khác tài liệu ↔ hợp đồng (Mục 60 prompt): UI Spec §12.4 gọi nhóm aspect là "Tense", Backend trả `Challenging` → *documentation issue* (frontend dùng giá trị Backend, hiển thị tiếng Việt do frontend đặt); UI Spec mong có Chiron trong Planet Table mặc định → *intentional compatibility behavior* (Backend coi Chiron là optional point).

## 8. Current Frontend Architecture

- **Phân lớp:** `shared` (api, config, hooks, lib, stores, ui) → `features/<name>/{api,hooks,model?,ui}` → `pages/<area>/<route>/page.tsx` → `widgets` (layout) → `app` (router, providers). Mỗi feature có `index.ts`/README quy ước ([repo]).
- **Quy ước file:** page ở `pages/app/profiles/{page,new/page,edit/page}.tsx` (thư mục theo đoạn route, không dùng `[id]`); hook bọc TanStack Query ở `features/*/hooks`; hàm API thuần ở `features/*/api`; MSW handler ở `features/*/api/mocks/handlers.ts`.
- **UI:** Tailwind với token (`text-primary`, `text-muted`, `border-subtle`, `bg-surface`, `accent-primary`…), font ba họ (`display`, `ui`, `data`), `densityMode` trong `preferenceStore`.
- **Công cụ:** ESLint `jsx-a11y/recommended`, `react-hooks/exhaustive-deps` lỗi, `import/order` alphabetize; Prettier + plugin Tailwind.
- **Thiếu so với UI Spec (VERIFIED không có):** `Tabs`, `Tooltip`, `Popover`, `Toast`, `Table`, `Typography`, `ErrorState`, `PlanetBadge/SignBadge/HouseBadge/AspectBadge`, `SkeletonChartWheel/SkeletonPlanetTable`. Plan tái dùng primitive sẵn có và xây badge/skeleton miền chiêm tinh **trong feature `chart`** (Mục 13, 36).

## 9. Existing Birth Profile Flow

| Thành phần | Thực tế |
|---|---|
| Danh sách | `pages/app/profiles/page.tsx`: `useBirthProfilesQuery({page, pageSize: 10})`, lưới `Card`; mỗi thẻ có `Sửa` (`Link` → `/app/profiles/:id/edit`) và `Xoá` (Modal xác nhận); Loading = 6 `Skeleton`; lỗi = `EmptyState variant="danger"` + "Thử lại"; rỗng = `EmptyState` + "Tạo hồ sơ mới" |
| Tạo/sửa | `/app/profiles/new`, `/app/profiles/:id/edit` dùng `BirthProfileForm`; sau lưu điều hướng về danh sách |
| Dữ liệu | `BirthProfile{id, label, fullName\|null, birthDate, birthTime\|null, isBirthTimeKnown, placeName, latitude, longitude, historicalTimezoneId, warnings, …}` |
| Chưa có | Trang chi tiết hồ sơ; hành động "Tính lá số"; liên kết tới chart |

F4 **thêm một hành động "Tính lá số"** vào thẻ hồ sơ hiện có (không tạo trang/luồng mới). Quy tắc F3 giữ nguyên: validation của form không đổi; không thêm cảnh báo Ascendant/House vào Birth Form (đã quyết ở F3, chuyển sang chart).

## 10. Existing API/Data Layer

| Câu hỏi (prompt Mục 26) | Câu trả lời |
|---|---|
| Typed API client / fetch wrapper | `shared/api/client.ts`: axios instance + interceptor gắn `Authorization` từ `authStore`; refresh qua `coordinateRefresh` khi 401; chuẩn hoá lỗi thành `ApiError{status, errorCode, title, detail, fieldErrors}` — dùng lại |
| React Query | Có; `createQueryClient()` mặc định `queries.retry: false`; `mutations.onError` báo lỗi nếu không phải lỗi nghiệp vụ đã biết (`isKnownBusinessError`) |
| Hook mẫu | `features/birth-profile/hooks/query-keys.ts` (`birthProfileKeys`), `useBirthProfileQuery` (`enabled: Boolean(id)`), `use*Mutation` |
| Error normalization | `getErrorMessage(errorCode)` — tiếng Việt; mã chưa ánh xạ → `reportError` + thông báo chung |
| Generated OpenAPI types | **Không có** → DTO khai báo tay (cùng cách F3) |
| MSW | `src/test/msw-server.ts` (`onUnhandledRequest: "error"`); handler dạng `mockXxx(resolver)` + factory `mockBirthProfile(overrides)` |

**Endpoint F4 dùng:**

| Endpoint | Method | Request | Response | Auth | Caching/invalidation |
|---|---|---|---|---|---|
| `/api/v1/charts/natal?save=true` | POST | `{ birthProfileId, houseSystem: 'Placidus'\|'WholeSign', includeOptionalPoints: [] }` | `ChartResponse` (201) | Bắt buộc (profile thuộc người dùng) | Mutation; thành công → `setQueryData(chartKeys.detail(id), data)` + `invalidateQueries(chartKeys.lists())` rồi điều hướng |
| `/api/v1/charts/:id` | GET | — | `ChartResponse` (200) | Bắt buộc (403 nếu chart người khác, 404 nếu không có) | `staleTime: Infinity`, không refetch khi focus/reconnect; `gcTime` mặc định |
| `/api/v1/charts` | GET | `?page&pageSize=12` (mặc định `order=desc`) | `{ items: ChartSummary[], total, page, pageSize }` (200) | Bắt buộc; chỉ chart của chính người dùng | Query `chartKeys.list({page,pageSize})`, `placeholderData` giữ trang cũ khi đổi trang (cùng mẫu danh sách hồ sơ); mutation tạo chart thành công → `invalidateQueries(chartKeys.lists())` |

Lỗi dự kiến: 401 (interceptor xử lý), 403/404/422 (`FORBIDDEN`, `RESOURCE_NOT_FOUND`, `VALIDATION_ERROR` — đã có trong từ điển), 500 (`CHART_CALCULATION_FAILED`, `EPHEMERIS_PROVIDER_ERROR`; mã nào thực sự tới client là `UNVERIFIED` — đọc `map-domain-error.ts` ở FE-S4.1), 422 `UNSUPPORTED_HOUSE_SYSTEM` (không thể xảy ra nếu UI chỉ cho hai giá trị).

## 11. Existing Routing

`src/app/router.tsx` dùng `createBrowserRouter` với `routesConfig`: `/` (Marketing), `login|register` (GuestRoute), `/app` (`ProtectedRoute` → `AppLayout` → `Suspense`): `index`, `profiles`, `profiles/new`, `profiles/:id/edit`; trang lazy (`lazy(() => import(...))`).

| Route | Quyết định | Lý do |
|---|---|---|
| Birth Profile list | Giữ `/app/profiles` | Đã có |
| Birth Profile detail | **Không thêm** | Chưa có và không cần cho luồng |
| Calculate Chart | **Không có route riêng**; dialog trên `/app/profiles` | Tránh route trùng; hành động gắn với hồ sơ |
| Chart List (v1.1) | **`/app/charts`** (trong nhánh `/app`, dưới `AppLayout`); mục nav "Lá số của tôi" (sidebar + drawer) | Cần lối vào lại lá số đã lưu (O-F4-2 phương án B) |
| Chart Viewer | **`/app/charts/:chartId`** (trong nhánh `/app`, dưới `AppLayout`) | Khớp quy ước `/app/*`; Backend `GET /charts/:id` yêu cầu đăng nhập; UI Spec `/chart/:chartId` giả định chart công khai/guest, hiện không khả thi (Mục 7) |

Mâu thuẫn UI Spec §13–14 (`/chart/new`, `/chart/:chartId`, `/app/charts` dashboard) được ghi nhận; không tạo `/chart/new` (Birth Form đã nằm ở `/app/profiles/new`). Page viewer đặt tại `src/pages/app/charts/detail/page.tsx` (theo quy ước `profiles/edit`); page danh sách tại `src/pages/app/charts/page.tsx` (theo quy ước `profiles/page.tsx`). Nav hiện được khai báo **hai lần** trong `widgets/app-layout/index.tsx` (sidebar và drawer — debt F3, không refactor ở F4), nên thêm mục mới ở cả hai chỗ. `chartId` không phải UUID → hiển thị "không tìm thấy" mà không gọi API (kiểm bằng Zod `uuid()`).

## 12. Existing State Architecture

| Loại | Công cụ hiện có | Ghi chú |
|---|---|---|
| Server state | TanStack Query (profile, list…) | Auth session **không** dùng `useQuery` |
| Global client state | 3 Zustand store: `authStore`, `uiStore` (sidebar/drawer), `preferenceStore` (theme, locale, `densityMode`) | Architecture Spec §7.3: **không thêm store thứ 4 nếu không có lý do**; spec còn viết rõ `chart-viewer` "không có Global UI State thực sự" |
| Form state | React Hook Form + Zod | Không dùng ở viewer |
| URL state | `react-router` params/search | `chartId` |

Kết luận audit: **không có lý do để thêm store hay Context cho viewer** (Mục 27). Tái dùng `preferenceStore.densityMode` cho mật độ hàng bảng (đã có, không thêm trạng thái).

## 13. Sprint 4 Architecture Proposal

Cấu trúc đề xuất (bám quy ước thực tế `api/ hooks/ model/ ui/`):

```text
src/features/chart/
  api/        types.ts · createNatalChart.ts · getChart.ts · listCharts.ts · mocks/{handlers,fixtures}.ts
  hooks/      query-keys.ts · useChartQuery.ts · useChartsQuery.ts · useCreateNatalChartMutation.ts
  model/      labels.ts · format.ts · chartViewModel.ts · geometry.ts · labelLayout.ts
              aspectGeometry.ts · selection.ts          (thuần TS, không React)
  ui/         ChartViewer/ · ChartWheel/ · PlanetTable/ · HouseTable/ · AspectTable/
              ChartHeader · UnknownTimeNotice · SelectionDetail · ChartBadges/ ·
              CalculateChartDialog/ · ChartViewerSkeleton · ChartList/ (ChartListItem)
  index.ts    API công khai của feature
src/pages/app/charts/page.tsx            (danh sách, v1.1)
src/pages/app/charts/detail/page.tsx     (viewer)
src/shared/hooks/useMediaQuery.ts      (hook dùng chung nhỏ, mới)
```

Hướng phụ thuộc: `api` → `hooks` → `model` (adapter, hình học) → `ui` → `pages`. `model/geometry*` không import React; `ui` không gọi API; `pages` lắp ráp hook + component.

**Thành phần (trách nhiệm / vào / ra / state / phụ thuộc / test):**

| Thành phần | Trách nhiệm | Input | Output/sự kiện | State | Phụ thuộc | Test |
|---|---|---|---|---|---|---|
| `ChartViewer` | Container: ghép header, notice, wheel, bảng, detail; **sở hữu selection/hover/zoom** | `vm: ChartViewModel` | — | `selection`, `hoveredKey`, `showAspectLines`, `zoom` (cục bộ) | model, các ui con | component + tích hợp |
| `ChartWheel` | Vẽ SVG từ `WheelGeometry` | `geometry`, `selection`, `hoveredKey`, `showAspectLines` | `onSelect`, `onHover`, `onClear` | không (controlled) | `model/geometry*`, `ChartBadges` glyph | component + axe |
| `PlanetTable` / `HouseTable` / `AspectTable` | Bảng ngữ nghĩa + thẻ mobile; đánh dấu hàng đã chọn | rows VM, `selection`, `densityMode` | `onSelect`, `onHover` | không | badges | component + axe |
| `SelectionDetail` | Hiển thị chi tiết mục đang chọn (thay tooltip, dùng được trên touch) | `selection`, `vm` | `onClear` | không | — | component |
| `UnknownTimeNotice` | Thông báo suy giảm khi `!isHouseDataAvailable` | `vm.flags` | — | không | `Alert` | component |
| `ChartHeader` | Metadata (hệ nhà, ngày tính, engine) | `vm.meta` | — | không | `Badge` | component |
| `ChartBadges` | `PlanetGlyph`, `SignGlyph`, `HouseBadge`, `AspectBadge` (glyph + `aria-label` tiếng Việt) | enum key | — | không | `model/labels` | unit + axe |
| `CalculateChartDialog` | Chọn hệ nhà, cảnh báo giờ sinh chưa rõ, gọi mutation, điều hướng | `profile`, `open`, `onClose` | điều hướng | trạng thái form cục bộ | `useCreateNatalChartMutation`, `Modal`, `Radio` | component + tích hợp |
| `ChartViewerSkeleton` | Skeleton wheel + bảng | — | — | không | `Skeleton` | component |
| `ChartList` / `ChartListItem` (v1.1) | Danh sách thẻ chart đã lưu (ngày tính, hệ nhà, tên hồ sơ ghép client) + liên kết `/app/charts/:id` | `items`, `profileLabelById: Map` | — | không (trang giữ `page`) | `Card`, `Button as={Link}`, `Badge` | component + axe |

**Quyết định thiết kế bắt buộc (prompt Mục 63):**

| # | Quyết định | Bằng chứng | Phương án đã xét | Lý do loại | Hệ quả |
|---|---|---|---|---|---|
| 1 | **SVG tự vẽ** (không Canvas, không thư viện) | UI Spec §12.5 bắt buộc SVG; repo không có thư viện chart; ~200–300 node | Canvas; thư viện (Recharts/d3/`astrochart`) | Canvas mất `<title>`/focus; Recharts không phù hợp bánh xe; thư viện thêm phụ thuộc và khó kiểm soát a11y | Tự quản hình học, bù bằng unit test thuần |
| 2 | Kiến trúc: `ChartViewer` + wheel/bảng nhỏ, hình học thuần ở `model/` | Architecture Spec §9 (Composite/Presentational), prompt Mục 44 | Một file lớn `ChartViewer.tsx` | Khó test, vi phạm ranh giới | Nhiều file nhỏ, mỗi file một trách nhiệm |
| 3 | **DTO ≠ ViewModel**: adapter ở `model/chartViewModel.ts` | Backend không cam kết thứ tự; DTO dùng chuỗi tiếng Anh | Dùng DTO trực tiếp trong component | Rải giả định Backend khắp UI | Một điểm sửa khi hợp đồng đổi |
| 4 | State chọn/hover **cục bộ** trong `ChartViewer` | Chỉ cha–con gần cần chia sẻ (Architecture Spec §7.2) | Context; Zustand | Không cần: các con đều là con trực tiếp của `ChartViewer` | Không có store mới |
| 5 | **Không Context** | Như trên; chỉ prop drilling 1 cấp | `ChartContext` | Thêm ngầm định không cần thiết | Props rõ ràng, test dễ |
| 6 | **Không Zustand** | Spec: `chart-viewer` không có Global UI State; ESLint boundaries tắt nên càng nên tránh store mới | Store thứ 4 | Không có state cần sống qua unmount hay giữa cây không liên quan | Không đổi 3 store |
| 7 | Mô hình tương tác: hover = làm nổi; **chọn = click/Enter/Space/tap** | UI Spec §12.5 | Chỉ hover | Không dùng được trên touch/bàn phím | Chi tiết ở panel, không tooltip |
| 8 | Đồng bộ: **một nguồn `selection`** trong `ChartViewer` (discriminated union) | Prompt Mục 40 (tránh state trùng) | Hai state riêng cho wheel và bảng | Dễ lệch | Một reducer thuần dễ test |
| 9 | Responsive: wheel trong khung vuông; bảng→thẻ dưới `sm`; hai cột ở `lg` | UI Spec §7.2 | Scale cả wheel theo chiều rộng | Chữ < 10px | Chi tiết Mục 28 |
| 10 | A11y: wheel là `group` có nhãn tóm tắt + nút tiêu điểm; **bảng là nguồn thông tin đầy đủ** | UI Spec §12.5 | `role="img"` như spec | `role=img` làm con thành presentational, mâu thuẫn với phần tử focusable | Lệch spec có chủ đích (Mục 29) |
| 11 | UX thiếu giờ sinh: banner `info` + wheel không có vòng nhà + bảng nhà thay bằng giải thích | Prompt Mục 7, F3 OQ-1 | Báo lỗi chung | Sai ngữ nghĩa | Mục 31 |
| 12 | Loading/error/empty: Skeleton, `EmptyState` (danger/default), không trang trắng | Pattern F3 | Spinner toàn trang | Kém trực quan | Mục 30 |
| 13 | Aspect: chord giữa vị trí thật; **kiểu nét + màu** mã hoá loại; conjunction = cung ngắn | UI Spec §12.5, prompt Mục 32 | Chỉ màu | Không đạt WCAG 1.4.1 | Mục 21 |
| 14 | Va chạm nhãn: **dàn góc hiển thị tất định + đường nối về vị trí thật** | Prompt Mục 31 | Chỉ lane bán kính | Không đủ khi stellium | Mục 18 |
| 15 | Định dạng độ: `D°MM′` (làm tròn phút, xử lý nhớ), mono/tabular | UI Spec §12.2 (`15°23'47"`) | Hiện cả giây | Backend chỉ có số thập phân; giây là độ chính xác giả | Mục 17 |
| 16 | Touch: tap = chọn, tap lại/nút "Bỏ chọn" = bỏ; panel chi tiết | Prompt Mục 42 | Tooltip hover | Không có hover | Mục 25 |
| 17 | Test: Vitest + RTL + `vitest-axe` + MSW; E2E Playwright | Repo | Storybook, snapshot ảnh | Không có tooling | Mục 32 |
| 18 | **Không** visual regression ảnh | Repo không có; SVG brittle theo font/OS | Playwright screenshot | Phụ thuộc OS/font; chi phí bảo trì | Kiểm hình học bằng unit test số; QA thị giác thủ công (Mục 32) |
| 20 (v1.1) | **Danh sách chart tối thiểu** ở `/app/charts`, phân trang Trước/Sau, mới nhất trước, `pageSize = 12` | Owner chọn O-F4-2 B; Backend đã có endpoint (Mục 7.1); mẫu danh sách hồ sơ F3 | Trang chi tiết hồ sơ liệt kê chart; lọc/tìm kiếm | Mở rộng phạm vi; Backend chưa có `birthProfileLabel` | 1 task mới (FE-S4.11) |
| 21 (v1.1) | Tên hồ sơ trên mục chart **ghép phía client** từ `useBirthProfilesQuery({pageSize:100})`; `null`/không thấy → "Hồ sơ đã xoá hoặc không còn" | `birthProfileLabel` luôn `null`; `SetNull` khi xoá hồ sơ | N request `GET /birth-profiles/:id` | N+1 | Giới hạn 100 hồ sơ (FG-13) |
| 19 | **Không thêm dependency** | Mục 36 | Chart lib, Framer Motion, `jest-axe` | Không cần | Chỉ thêm 1 hook dùng chung nhỏ (`useMediaQuery`) |

## 14. Data Flow

Luồng danh sách (v1.1): `Nav "Lá số của tôi"` → `/app/charts` → `useChartsQuery({page, pageSize:12})` (+ `useBirthProfilesQuery({page:1,pageSize:100})` để dựng `Map id→nhãn`) → `ChartList` → liên kết `/app/charts/:chartId` → viewer (dữ liệu từ `GET /charts/:id`).

```text
/app/profiles ── BirthProfile (useBirthProfilesQuery, đã có)
      │  bấm "Tính lá số"
      ▼
CalculateChartDialog ── chọn hệ nhà ── useCreateNatalChartMutation
      │  POST /api/v1/charts/natal?save=true  { birthProfileId, houseSystem, includeOptionalPoints: [] }
      ▼
apiClient (token + refresh) ──► ChartResponse (201, có id) ──► setQueryData(chartKeys.detail(id))
      │  navigate("/app/charts/:id")
      ▼
ChartPage ── useChartQuery(chartId)  (GET /charts/:id nếu cache chưa có; staleTime ∞)
      │ loading → ChartViewerSkeleton   error → EmptyState   ok ↓
      ▼
toChartViewModel(dto)   ← adapter thuần (sắp xếp chính tắc, nhãn, định dạng, cờ suy giảm)
      ▼
ChartViewer (state: selection · hoveredKey · showAspectLines · zoom)
      ├─ ChartHeader / UnknownTimeNotice
      ├─ ChartWheel  ← buildWheelGeometry(vm)  (hình học thuần)
      ├─ PlanetTable / HouseTable / AspectTable
      └─ SelectionDetail  (+ live region thông báo chọn)
```

## 15. API / DTO / View Model Design

**DTO** (`features/chart/api/types.ts`): phản chiếu §5.4, dùng union chuỗi (không `enum` vì `erasableSyntaxOnly`): `PlanetName`, `ZodiacSign`, `AspectType`, `AspectNature`, `AngleType`, `HouseSystem`; trường không biết → kiểu `string` với nhánh dự phòng trong adapter (không ném lỗi khi Backend thêm giá trị mới). `interpretations`/`interpretationVersion` được khai báo để type khớp nhưng **adapter bỏ qua**.

**ViewModel** (`ChartViewModel`, tạo bởi `toChartViewModel`):

| Nhóm | Nội dung |
|---|---|
| `meta` | `id`, nhãn hệ nhà (`Placidus`/`Whole Sign`), `calculatedAt` định dạng `vi-VN`, `engineVersion` |
| `flags` | `houseDataAvailable`, `hasAngles`, `partialData` (thiếu hành tinh cốt lõi), `ascendantLongitude: number \| null` |
| `planets[]` | `key`, `nameVi`, `glyph`, `longitude`, `signKey`, `signVi`, `degreeLabel` (`15°23′`), `houseNumber \| null`, `isRetrograde`, thứ tự chính tắc |
| `houses[]` | `number`, `cuspLongitude`, `signKey`, `signVi`, `degreeLabel` (từ `cuspDegree`, xem chú thích) |
| `angles[]` | `type`, `labelVi`, `longitude`, `signVi`, `degreeLabel` |
| `aspects[]` | `key`, hai `planetKey`, `typeKey`, `symbol`, `labelVi`, `natureKey`, `orbLabel` (`2°14′`), `applying: boolean` + nhãn |
| `warnings[]` | chỉ `code` + nhãn tiếng Việt ánh xạ (không hiển thị `message` của Backend) |

**Thứ tự hiển thị tất định (sắp ở adapter, không phụ thuộc Backend):** hành tinh theo `Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, NorthNode, SouthNode, Lilith` (giá trị lạ xếp cuối theo tên); nhà theo `number`; góc theo `Ascendant, Midheaven, Descendant, ImumCoeli`; aspect theo `orb` tăng dần rồi theo (thứ tự `planetA`, `planetB`, loại) để ổn định.

**Ranh giới tính toán** (prompt Mục 30): *được phép (hình học trình bày)*: đổi kinh độ → toạ độ SVG, bán kính, vị trí chữ, dàn nhãn tránh chồng, đầu mút đường aspect, đổi độ thập phân → `D°MM′` kèm xử lý nhớ phút. *Không được*: tính lại vị trí, đỉnh nhà, aspect, orb, applying/separating. Hai điều cần ghi rõ: (a) độ-trong-cung của đỉnh nhà được suy ra bằng `cuspDegree mod 30` — thuần định dạng từ kinh độ do Backend cung cấp; test kiểm `floor(cuspDegree/30)` khớp `signOnCusp` trên fixture để phát hiện lệch hợp đồng; (b) sign của góc/hành tinh lấy từ Backend, **không** tính lại từ kinh độ.

## 16. Chart Wheel Architecture

`ChartWheel` là component thuần "controlled" gồm các lớp SVG (nhóm `<g>`), mỗi lớp là component nhỏ dưới `ChartWheel/` (vòng cung, vòng nhà, vạch chia độ, góc, hành tinh, aspect), nhận dữ liệu đã dựng sẵn từ `buildWheelGeometry(vm)` (hàm thuần, trả về toạ độ/đường dẫn/nhãn). `viewBox` cố định `0 0 600 600` (đơn vị logic), phóng to bằng CSS. Thứ tự vẽ (dưới lên): nền → vòng cung hoàng đạo → vạch chia độ → vòng nhà → đường aspect → đường nối nhãn → hành tinh → góc/nhãn. Lớp `aspects` và `planets` nằm trong vùng có `aria`; lớp trang trí `aria-hidden`.

Trạng thái hiển thị: `default`, `hover` (làm nổi hành tinh + aspect liên quan, mờ phần còn lại), `selected` (giữ vòng nổi, đồng bộ bảng). Không hoạt ảnh bắt buộc; nếu có chuyển tiếp thì `motion-reduce` tắt.

## 17. Chart Geometry Strategy

Mô-đun thuần `model/geometry.ts` (không React/DOM), kiểm thử số học.

| Hàm | Mục đích |
|---|---|
| `normalizeLongitude(λ)` | đưa về `[0, 360)` |
| `rotationFor(vm)` | `λ_asc` nếu có góc Ascendant, ngược lại `0` (Aries 0° ở bên trái) |
| `toScreenAngle(λ, rotation)` | `θ = 180° + (λ − rotation)` (độ), tăng kinh độ đi **ngược chiều kim đồng hồ** |
| `polarToCartesian(cx, cy, r, θ)` | `x = cx + r·cos θ`, `y = cy − r·sin θ` (SVG trục y hướng xuống) |
| `arcPath(r1, r2, θ1, θ2)` | đường dẫn một cung/vành (cho 12 cung và 12 nhà) |
| `sectorMidAngle(λ1, λ2)` | góc giữa một cung có xử lý vòng qua 360° (đặt số nhà) |
| `formatDegreeMinute(d)` | `D°MM′`, làm tròn tới phút; `29°59.6′` → `0°00′` của cung kế tiếp được xử lý nhớ ở lớp gọi |

Kiểm chứng định hướng: `λ = rotation` ⇒ điểm bên trái; `λ = rotation + 90°` ⇒ đáy; nhà 1 nằm ngay **dưới** đường chân trời bên trái. Bán kính (đơn vị viewBox): vành cung ngoài `[260, 225]`, vạch chia độ `225–215`, vòng nhà `[215, 175]`, vòng hành tinh `~150`, vòng aspect `110`. Con số chốt khi dựng; thay đổi chỉ ảnh hưởng một hằng số.

## 18. Planet Rendering

- Mỗi hành tinh = nhóm `<g>`: glyph (Unicode, thêm `U+FE0E` để buộc kiểu chữ trên nền tảng hiển thị emoji), nhãn độ nhỏ, đánh dấu nghịch hành `℞` (glyph miền, không icon Lucide — Design System §2), vạch nhỏ tại **vị trí thật** trên vòng chia độ, đường nối ngắn tới glyph khi glyph bị dời.
- **Va chạm nhãn** (`model/labelLayout.ts`, thuần, tất định): sắp theo kinh độ (hoà thì theo thứ tự chính tắc); duyệt tuần tự, đảm bảo khoảng cách góc tối thiểu giữa tâm glyph `minSepDeg` (khoảng 7° ở bán kính vòng hành tinh, tính từ kích thước glyph); nếu thiếu, **dàn đều** cụm lân cận đối xứng quanh trọng tâm cụm, rồi dùng tối đa 2 làn bán kính cho cụm quá dày; xử lý vòng qua 0°/360°. Kết quả: `displayAngle` mỗi hành tinh; vị trí thật không đổi.
- Giới hạn: tối đa 14 vật thể; phép dàn O(n²) với n ≤ 14 là chấp nhận được.
- Nhãn có kích thước chữ SVG ≥ 16 đơn vị với khung tối thiểu 400px ⇒ ≥ 10px hiển thị (UI Spec §7.2).

## 19. House Rendering

Chỉ vẽ khi `houseDataAvailable`. 12 đường đỉnh nhà tại `cuspDegree` từ vòng nhà tới vành cung; số nhà đặt tại góc giữa hai đỉnh liên tiếp (số thường; số La Mã là tuỳ chọn sau — `HouseBadge` hỗ trợ `numeralStyle` nhưng F4 dùng số thường). Hệ nhà hiển thị trong header (Badge). Khi **không** có nhà: không vòng nhà, không số nhà, không đường đỉnh; vành cung hoàng đạo vẫn đầy đủ.

## 20. Angle Rendering

4 góc (ASC/DSC/MC/IC) vẽ bằng nét đậm hơn đỉnh nhà thường, nhãn `ASC`, `DSC`, `MC`, `IC` kèm `aria-label` tiếng Việt đầy đủ ("Cung Mọc (Ascendant)"…). Chỉ vẽ khi `angles.length > 0`. `ASC` quyết định xoay bánh xe (Mục 17). Khi MC/IC gần một đỉnh nhà, nhãn góc ưu tiên, số nhà tránh chồng bằng dịch nhẹ theo bán kính.

## 21. Aspect Rendering

| Loại | Nature (Backend) | Hình thức đường | Lý do |
|---|---|---|---|
| Trine | Harmonious | nét liền mảnh | |
| Sextile | Harmonious | nét chấm mảnh | phân biệt với Trine mà không cần màu |
| Square | Challenging | nét đứt dày | |
| Opposition | Challenging | nét gạch dài dày | phân biệt với Square |
| Conjunction | Neutral | **cung ngắn** dọc vòng aspect giữa hai điểm (không vẽ chord vì hai điểm trùng nhau) | |

Màu theo nature dùng token hiện có (Harmonious → `accent-secondary` chàm, Challenging → màu thau/`brass` nếu có token, Neutral → xám) và **không dùng đỏ/xanh lá** (UI Spec §12.5, tránh nhầm màu ngữ nghĩa); **không bao giờ chỉ dựa vào màu** (kiểu nét + ký hiệu ở bảng). Đầu mút = vị trí **thật** của hai hành tinh trên vòng aspect (dùng `longitude`, không dùng góc đã dàn nhãn). Aspect trùng vị trí chồng nhau: thứ tự vẽ ổn định theo orb giảm dần (aspect chặt vẽ sau, nổi trên). Có công tắc `showAspectLines` (`Switch` sẵn có), mặc định bật ở ≥ `md` và **tắt** dưới `md` để giảm rối; bảng aspect luôn có. Chọn một hành tinh/aspect → đường liên quan nổi, phần còn lại mờ (`opacity`), không ẩn hẳn. Hover/focus trên đường aspect là tuỳ chọn phụ; luồng chính chọn qua bảng hoặc hành tinh.

## 22. Planet Table

`<table>` ngữ nghĩa với `<caption>` ("Vị trí hành tinh — lá số sinh"), `<th scope="col">`, cột: Hành tinh (`PlanetBadge` + tên), Cung (`SignBadge`), Độ (mono `15°23′`), Nhà (`HouseBadge` hoặc "Chưa có"), Nghịch hành (`℞` kèm chữ ẩn "Nghịch hành"). Hàng có `aria-selected`/kiểu "đang chọn" (không chỉ màu: viền trái + nền + chữ ẩn). Hàng là điểm chọn: nút trong ô đầu (`<button>`) để tránh gắn `onClick` lên `<tr>` (đáp ứng `jsx-a11y`). Dưới `sm`: thẻ mỗi hành tinh (cùng dữ liệu, `dl`). Mật độ theo `densityMode`.

## 23. House Table

12 hàng: Nhà, Cung tại đỉnh (`SignBadge`), Độ, và đánh dấu các góc (ASC ở nhà 1, MC ở nhà 10…) bằng `Badge` dựa trên `angles` (không suy luận ngoài dữ liệu: chỉ gắn nhãn khi có góc tương ứng trong `angles`; không so sánh kinh độ để đoán). Tiêu đề kèm `Badge` hệ nhà. Khi `!houseDataAvailable`: **không** hiện bảng rỗng — thay bằng khối giải thích (Mục 31). Dưới `sm` dùng thẻ.

## 24. Aspect Table

Danh sách (list layout bắt buộc, ma trận `grid` hoãn): cột Hành tinh A | Loại (`AspectBadge`: ký hiệu + tên Việt) | Hành tinh B | Orb (`2°14′`) | Tiến/Tách (`isApplying` → "Tiến gần"/"Tách xa") | Tính chất (Hài hoà/Thử thách/Trung tính). Sắp theo orb tăng dần. Lọc: khi đang chọn một hành tinh, hiện chip `Đang lọc: Sao Kim ✕` và chỉ liệt kê aspect liên quan; bỏ chọn/chip ✕ khôi phục toàn bộ. Rỗng (không aspect): `EmptyState` trung tính "Không có góc chiếu nào trong phạm vi orb". Ghi chú giới hạn: nhãn "Tách xa" áp cho mọi `isApplying=false`; Backend không phân biệt trường hợp chính xác (xem Mục 47).

## 25. Interaction Model

| Hành vi | Chuột | Bàn phím | Cảm ứng |
|---|---|---|---|
| Làm nổi tạm | hover hành tinh/hàng | focus | — (không có hover) |
| Chọn | click | `Enter`/`Space` trên nút hành tinh | tap |
| Bỏ chọn | click lại / chip ✕ / nút "Bỏ chọn" | `Esc`, `Enter` lần hai | tap lại / nút "Bỏ chọn" |
| Chi tiết | `SelectionDetail` cố định cạnh/dưới wheel (không tooltip nổi) | cùng | cùng |
| Bật/tắt aspect | `Switch` | có | có |
| Zoom (dưới `md`) | nút `+`/`−`/Đặt lại (1×–3×) | có | nút; pinch gốc của trình duyệt được phép (`touch-action: pan-x pan-y pinch-zoom`) |

Wheel không chặn cuộn trang trên mobile (không bắt sự kiện kéo). Pinch tuỳ biến bằng Pointer Events **hoãn** (lệch UI Spec §7.2 có chủ đích, Mục 47).

## 26. Selection Synchronization

Một nguồn sự thật trong `ChartViewer`, mô hình hoá bằng union phân biệt và reducer thuần (`model/selection.ts`):

```text
Selection = { kind: "none" }
          | { kind: "planet"; key: PlanetKey }
          | { kind: "aspect"; key: AspectKey }
hover: hoveredKey: PlanetKey | null      (ephemeral, không ghi vào Selection)
```

Quy tắc: chọn hành tinh ⇒ hành tinh nổi ở wheel + hàng Planet Table được đánh dấu + Aspect Table lọc theo hành tinh; chọn aspect ⇒ đường aspect nổi + hai hành tinh nổi + hàng aspect đánh dấu; chọn mục mới thay mục cũ (không đa chọn); `Esc` hoặc chọn lại ⇒ `none`. Không có state thứ hai ở wheel hay bảng (đều controlled). Live region (`aria-live="polite"`) thông báo "Đã chọn Mặt Trời tại Sư Tử, nhà 5" / "Đã bỏ chọn". Selection **không** vào URL ở F4 (không có yêu cầu chia sẻ liên kết).

## 27. State Ownership

| State | Loại | Chủ sở hữu | Lý do |
|---|---|---|---|
| `ChartResponse` | Server | TanStack Query (`chartKeys.detail`) | Dữ liệu Backend; không đưa vào Zustand |
| `ChartViewModel` | Derived | `useMemo` trong page/`ChartViewer` | Tính từ DTO; thuần |
| `selection`, `hoveredKey` | UI | `useReducer`/`useState` trong `ChartViewer` | Chỉ cha–con gần dùng |
| `showAspectLines`, `zoom` | UI | `ChartViewer` (`useState`) | Cục bộ, mặc định theo breakpoint |
| `houseSystem` trong dialog | Form cục bộ | `CalculateChartDialog` | Chỉ dialog dùng; mặc định `Placidus` |
| `densityMode` | Preference (đã có) | `preferenceStore` | Tái dùng, không thêm |
| `chartId` | URL | Router params | Chia sẻ qua đường dẫn |
| Trang danh sách chart (`page`) | UI | `useState` trong `pages/app/charts/page.tsx` | Cùng mẫu `profiles/page.tsx`; không đưa vào URL ở F4 |

Không đề xuất state toàn cục mới. **Zustand: không được biện minh** (Mục 13 #6).

## 28. Responsive Strategy

Breakpoint theo Tailwind (`sm` 640, `md` 768, `lg` 1024): container `Container size="wide"` (đã có `wide`; giá trị `max-w-container-wide` `UNVERIFIED` cho đúng 1440 như spec).

- **≥ `lg`:** hai cột — wheel (cố định, `sticky`) | cột phải: Planet Table, House Table, Aspect Table xếp dọc; `SelectionDetail` dưới wheel.
- **`md`–`lg` (tablet):** một cột, wheel trước, bảng sau; bảng vẫn dạng `<table>`.
- **< `sm`:** wheel trong khung vuông tối thiểu 400px (cuộn ngang nếu màn nhỏ hơn) với nút zoom; bảng chuyển **thẻ mỗi hàng**; aspect lines tắt mặc định.
- Chuyển layout bảng↔thẻ bằng `useMediaQuery('(min-width: 640px)')` (một hook dùng chung nhỏ; **render một trong hai**, tránh trùng nội dung cho screen reader). Trong test jsdom, `matchMedia` mặc định `matches:false` (đã mock ở `setup.ts`) ⇒ cần mock theo ca.

## 29. Accessibility Strategy

- **Phương án thay thế thật:** ba bảng ngữ nghĩa luôn có trong DOM và chứa **toàn bộ** dữ liệu của wheel; skip link "Chuyển tới bảng dữ liệu" dùng `SkipLink` sẵn có (hoặc mở rộng).
- Wheel: `<figure>` + `<figcaption>`; `<svg role="group" aria-label="Lá số sinh … (tóm tắt)" aria-describedby=…>`; mỗi hành tinh là `role="button"` `tabindex="0"` `aria-pressed` với `aria-label` đầy đủ ("Sao Diêm Vương, nghịch hành, ở Bọ Cạp, nhà 8"); phần trang trí `aria-hidden="true"`; chữ SVG thuần trang trí không đọc trùng.
- **Lệch UI Spec có chủ đích:** spec yêu cầu `role="img"` cho wheel đồng thời các hành tinh focusable; theo ARIA, `role="img"` coi con là *presentational* nên các nút bên trong mất nghĩa. Dùng `group` giữ nhãn tóm tắt và vẫn cho phép tương tác; phương án thay thế vẫn là bảng.
- Bàn phím: Tab đi qua các nút hành tinh theo thứ tự chính tắc (tối đa 14), `Enter/Space` chọn, `Esc` bỏ chọn; focus ring có sẵn (`ring-focus`); hàng bảng chọn qua nút.
- Màu không phải kênh duy nhất: kiểu nét aspect, ký hiệu, chữ ẩn "đang chọn", viền hàng.
- `prefers-reduced-motion`: không dùng hoạt ảnh bắt buộc; mọi `transition` kèm `motion-reduce:transition-none`.
- Glyph: `aria-hidden` kèm tên chữ; `U+FE0E` cho kiểu chữ; ngăn xếp font dự phòng cho ký hiệu.
- Tiêu đề trang: `h1` trong page; đặt `document.title` cục bộ và chuyển focus tới `h1` sau khi tải xong (xử lý **cục bộ** trong trang chart; nợ toàn cục OQ-M8-1/2 không sửa).
- Kiểm tự động: `vitest-axe` cho từng component; **không** tuyên bố "đạt a11y đầy đủ" chỉ nhờ công cụ tự động (jsdom không kiểm tương phản/ngữ cảnh đọc); checklist thủ công ở Mục 32.

## 30. Loading / Error / Empty States

| Tình huống | Hiển thị |
|---|---|
| Đang tính (mutation pending) | Nút/Dialog có trạng thái tải, khoá thao tác, `aria-busy`; văn bản "Đang tính toán vị trí hành tinh…" |
| Đang tải chart (`GET`) | `ChartViewerSkeleton` (Skeleton vuông + hàng bảng); không flash trắng |
| Lỗi tính (409/422/500…) | Alert `danger` trong dialog với `getErrorMessage(errorCode)` + nút thử lại; không hiển thị `message` thô |
| `404`/`403`/chartId không hợp lệ | `EmptyState` "Không tìm thấy lá số" + nút về `/app/profiles` |
| Lỗi mạng/500 khi tải | `EmptyState variant="danger"` + "Thử lại" (`refetch`) |
| Dữ liệu không đủ (ví dụ `planets` rỗng) | `EmptyState` "Dữ liệu lá số chưa đầy đủ"; **không** vẽ wheel rỗng/méo (UI Spec §12.5) |
| Thiếu giờ sinh | **Không** nằm trong bảng này: là trạng thái hợp lệ (Mục 31) |
| Danh sách chart đang tải | 6 `Skeleton` thẻ (mẫu hồ sơ) |
| Danh sách chart lỗi | `EmptyState variant="danger"` + "Thử lại" |
| Danh sách chart rỗng | `EmptyState` "Bạn chưa có lá số nào" + nút tới `/app/profiles` ("Chọn hồ sơ để tính lá số") |
| Tên hồ sơ chưa tải xong / lỗi | Thẻ vẫn hiển thị (ngày + hệ nhà); tên hồ sơ rơi về "Hồ sơ không xác định" mà không chặn danh sách |

## 31. Unknown Birth Time UX

Tín hiệu duy nhất: `isHouseDataAvailable === false` (response không có `isBirthTimeKnown`).

- **Trước khi tính:** nếu hồ sơ được chọn có `isBirthTimeKnown=false`, dialog hiện Alert `info`: "Hồ sơ này chưa có giờ sinh nên lá số sẽ không có Nhà và các góc (Cung Mọc, MC…). Vị trí hành tinh vẫn được tính." Không chặn tính.
- **Trong viewer:** `UnknownTimeNotice` (Alert `info`, không `danger`): nêu thiếu **Nhà và các góc**; **Mặt Trăng** (và các điểm di chuyển nhanh) có thể lệch vài độ nếu giờ sinh không rõ (KG-S4-06; engine tính tại 12:00 địa phương, không cảnh báo). Vì frontend không biết lý do chính xác, câu chữ dùng "thường do chưa biết giờ sinh".
- Wheel: vành cung + hành tinh + aspect; không vòng nhà/số nhà/góc; Aries 0° ở bên trái.
- Planet Table: cột Nhà hiện "Chưa có" (`aria-label` rõ), không để trống; House Table: khối giải thích thay vì bảng rỗng; Header có `Badge` "Chưa có Nhà".
- Không `EmptyState` lỗi, không `reportError`.

## 32. Testing Strategy

**Unit (thuần TS):** `toChartViewModel` (sắp xếp chính tắc, nhãn tiếng Việt, giá trị lạ, flag suy giảm, bỏ qua interpretation); `formatDegreeMinute` (làm tròn, nhớ phút `29°59.7′`, 0°, biên); `normalizeLongitude`; `toScreenAngle`/`polarToCartesian` (ASC bên trái, +90° đáy, đối xứng, vòng 360°); `sectorMidAngle` (vòng qua 0°); `resolveLabelAngles` (hai hành tinh trùng, stellium 4, vòng 0°/360°, tính tất định: xáo thứ tự đầu vào → cùng đầu ra); `aspectGeometry` (đầu mút bằng vị trí thật; conjunction → cung); `selection` reducer; kiểm hợp đồng fixture (`floor(cuspDegree/30)` ↔ `signOnCusp`).

**Component (Testing Library + MSW):** `ChartWheel` (số nút hành tinh, `aria-label`, không vòng nhà khi thiếu dữ liệu, nghịch hành), ba bảng (caption, `scope`, thứ tự hàng, hàng chọn, thẻ mobile bằng mock `matchMedia`), `ChartViewer` (đồng bộ chọn hai chiều, lọc aspect, `Esc`, live region), `UnknownTimeNotice`, skeleton/empty/error, `CalculateChartDialog` (mặc định `Placidus`, cảnh báo giờ sinh, lỗi từ điển), `useChartQuery`/mutation (cache seed, `enabled`), `vitest-axe` cho từng component chính.

**Tích hợp (MemoryRouter + MSW):** `/app/profiles` → bấm "Tính lá số" → dialog → `POST` mock 201 → điều hướng `/app/charts/:id` → viewer hiển thị wheel + bảng; đường lỗi (500 `CHART_CALCULATION_FAILED`); tải trực tiếp `/app/charts/:id` → `GET`; 404.

**Danh sách chart (v1.1):** component `ChartList` (thẻ, liên kết đúng `/app/charts/:id`, nhãn hồ sơ ghép, fallback "đã xoá"), trang (loading/error/empty/phân trang Trước/Sau khi `total > pageSize`), hook `useChartsQuery`, `invalidate` sau khi tạo chart; **phân quyền**: unit/tích hợp xác nhận frontend chỉ gọi `GET /charts` (không truyền userId), và E2E dùng hai tài khoản để xác nhận người dùng B thấy danh sách rỗng dù A đã có chart (Backend thực thi, frontend kiểm đúng hành vi).

**E2E (Playwright, backend thật, theo mẫu `birth-profile.spec.ts`):** `chart.spec.ts` (mở rộng v1.1: sau khi tính, vào "Lá số của tôi" thấy mục vừa tạo và mở lại được): đăng ký/đăng nhập → tạo hồ sơ có giờ sinh → "Tính lá số" → thấy wheel (SVG), 3 bảng, đủ số hành tinh, nhà 1–12; kịch bản hồ sơ **chưa biết giờ sinh** → banner, không có bảng nhà, không có lỗi; tải lại trang vẫn xem được; điều hướng bằng bàn phím tới một hành tinh và chọn.

**Fixture:** xem Mục 33 (dùng chung unit/component/integration).

**Thủ công (có checklist, ghi kết quả vào Evidence Matrix):** Tab/Enter/Esc, trình đọc màn hình (NVDA hoặc VoiceOver) đọc bảng và nhãn wheel, zoom 200%, thu nhỏ 320px, hiển thị glyph trên Windows/macOS/iOS/Android (kiểu chữ chứ không emoji), `prefers-reduced-motion`.

**Visual regression (khuyến nghị):** *không* thêm; thay bằng assertion số học về toạ độ + QA thị giác thủ công. Có thể chụp ảnh Playwright **không so sánh** làm tư liệu cho Evidence Matrix.

## 33. Regression Strategy

| Cam kết | Cách bảo vệ |
|---|---|
| Toàn bộ test hiện có xanh, **không** sửa/xoá để qua | Baseline 78 file / 391 test (VERIFIED [C-run]); chạy toàn bộ `npm test` sau mỗi task; CI `test:coverage` |
| Birth Profile page/test giữ nguyên hành vi | Thêm nút mới không đổi nút `Sửa/Xoá`; cập nhật `page.test.tsx` chỉ **thêm** ca |
| Router test | `router.test.tsx` được mở rộng thêm route mới, không đổi kỳ vọng cũ |
| Từ điển lỗi | `error-messages.test.ts` thêm ca cho mã mới |
| API client/refresh | Không sửa `shared/api/**` |
| Tương thích BE Sprint 4 | Fixture chứa `interpretations` (không rỗng) và `interpretationVersion`; test khẳng định viewer render y hệt khi `interpretations = []`, khi `interpretationVersion = null`, và khi trường thiếu/lạ |

**Fixture chuẩn (`features/chart/api/mocks/fixtures.ts`)** — lấy hình dạng từ một phản hồi thật của Backend (chạy backend cục bộ một lần, sao chép JSON đã rút gọn; vì đó là bằng chứng hợp đồng) và kiểm bằng test hợp đồng:

| Fixture | Nội dung |
|---|---|
| `chartFull` | 10 hành tinh (có ≥ 1 nghịch hành), 12 nhà, 4 góc, ~20–25 aspect (đủ 5 loại, cả `isApplying` true/false), `isHouseDataAvailable=true`, `interpretations` mẫu 21 mục, `interpretationVersion: "1.0"` |
| `chartNoHouses` | 10 hành tinh, `houses=[]`, `angles=[]`, `house: null`, `isHouseDataAvailable=false`, `interpretations` 10 mục `PlanetInSign` |
| `chartCluster` | 4 hành tinh trong ≤ 8° (kiểm va chạm) |
| `chartWrap` | hành tinh gần 359° và gần 1° (kiểm vòng 0°) |
| `chartNoAspects` | `aspects=[]` |

## 34. Performance Considerations

Ước lượng: 12 cung × (vành + glyph) + 12 nhà × (đường + số) + ≤ 14 hành tinh × ~4 node + ≤ ~40 đường aspect ≈ **200–300 node SVG** — nằm trong khả năng React thường, **không** cần tối ưu sớm. Quy tắc: `buildWheelGeometry` và `toChartViewModel` bọc `useMemo` theo DTO; hover/selection chỉ thay props lớp hành tinh/aspect; **không** thêm `React.memo`, ảnh hưởng đo đạc, Zustand, ảo hoá, uỷ quyền sự kiện cho tới khi đo (React Profiler) cho thấy hover > ~16ms. Mã chart nằm trong chunk lazy của route (`lazy(() => import(...))`) nên bundle khởi tạo (hiện 144 kB gzip, ngân sách spec < 180 kB) không tăng. Không có thư viện mới ⇒ không thêm vào bundle.

## 35. Security Considerations

| Hạng mục | Quy tắc |
|---|---|
| XSS | React tự thoát chuỗi; **cấm** `dangerouslySetInnerHTML`; không dựng chuỗi SVG bằng nối chuỗi từ dữ liệu Backend |
| Dữ liệu SVG | Thuộc tính số (toạ độ, bán kính) được tính từ số đã ép kiểu `Number.isFinite`; chuỗi hiển thị lấy từ **từ điển cục bộ** theo khoá; khoá lạ rơi vào nhãn dự phòng là chuỗi thô được React thoát |
| Interpretation | Không render ở F4; ở F5 là văn bản thuần (không HTML) theo hợp đồng Backend |
| `warnings[].message` | Không hiển thị (tiếng Anh, nội bộ); chỉ ánh xạ theo `code` |
| URL | `chartId` kiểm UUID trước khi gọi API; đường dẫn dựng qua `encodeURIComponent`; không `target=_blank` mới |
| Xác thực | Route trong `ProtectedRoute`; token do interceptor xử lý; viewer không tự đọc token; 403/404 xử lý như "không tìm thấy" |
| Dữ liệu cá nhân | Không log DTO/ngày sinh; `reportError` chỉ cho lỗi bất thường (đã có cơ chế) |

## 36. Dependency Review

**Không thêm dependency.** Đã cân nhắc và loại: Recharts (spec nhắc `vendor-charts` nhưng không phù hợp bánh xe tròn, hiện chưa cài), d3 (nặng, chỉ cần vài hàm lượng giác), thư viện chiêm tinh dựng sẵn (hạn chế kiểm soát a11y/hình học, rủi ro giấy phép/bảo trì), Framer Motion (spec chỉ dùng cho hoạt ảnh vẽ aspect — không bắt buộc), `jest-axe` (đã có `vitest-axe`), Storybook/visual regression (không có, không cần). **Thêm mã dùng chung:** `shared/hooks/useMediaQuery.ts` (≈ 15 dòng + test) — là mã nội bộ, không phải gói; được biện minh vì cần render **một** trong hai bố cục bảng/thẻ.

## 37. Implementation Task Breakdown

Thứ tự thực thi khuyến nghị (các ID giữ theo prompt; **S4.7 đặt trước S4.4–S4.6** để có phương án bảng dùng được sớm): S4.1 → S4.2 → S4.3 → **S4.11** → S4.7 → S4.4 → S4.5 → S4.6 → S4.8 → S4.9 → S4.10. (v1.1: S4.11 đặt ngay sau S4.3 để hoàn tất vòng đời tối thiểu "tính → xem → tìm lại" sớm.)

### FE-S4.1 — Chart API / DTO / Data Hooks
- **Objective:** kiểu DTO, hàm API, hook query/mutation, từ điển lỗi, MSW + fixture.
- **Why:** nền cho mọi task; theo đúng mẫu F3.
- **Preconditions:** Backend sẵn (VERIFIED); `.env` có `VITE_API_BASE_URL`.
- **Inspect:** `features/birth-profile/{api,hooks}/**`, `shared/lib/error-messages.ts`, `backend/.../map-domain-error.ts` (xác minh mã lỗi chart tới client).
- **Likely change:** `features/chart/api/{types,createNatalChart,getChart,listCharts}.ts`, `.../mocks/{handlers,fixtures}.ts`, `hooks/{query-keys,useChartQuery,useChartsQuery,useCreateNatalChartMutation}.ts`, `error-messages.ts` (+mã chart đã xác minh).
- **Steps:** (1) DTO + union; (2) `getChart`/`createNatalChart(profileId, houseSystem)` (body `{birthProfileId, houseSystem, includeOptionalPoints: []}`) và `listCharts({page, pageSize})` (kiểu `ChartSummary`, envelope `{items,total,page,pageSize}`); (3) `chartKeys` (`detail`, `lists`, `list(params)`); (4) `useChartQuery` (`enabled`, `staleTime: Infinity`, `refetchOnWindowFocus: false`); (5) mutation `onSuccess` → `setQueryData` + `invalidateQueries(chartKeys.lists())` + trả `id`; `useChartsQuery` (`placeholderData` giữ trang cũ); (6) xác minh và thêm mã lỗi; (7) handler MSW + fixture từ phản hồi thật.
- **State ownership:** server state ở Query.
- **API dependencies:** Mục 10.
- **Tests:** unit hàm API (URL, query `save=true`, body), hook (query/mutation), `error-messages`, kiểm hợp đồng fixture.
- **Commands:** `npm test`, `npm run typecheck`, `npm run lint`.
- **Acceptance:** hook trả DTO đúng; lỗi ánh xạ tiếng Việt; fixture parse được; không mở request ngoài MSW.
- **Dependencies:** không.
- **Out of scope:** UI, route, Zod runtime parse (không dùng, nhất quán F3).

### FE-S4.2 — Chart ViewModel / Data Adapter
- **Objective:** `toChartViewModel`, nhãn tiếng Việt, glyph, định dạng độ, thứ tự chính tắc, cờ suy giảm.
- **Why:** tách DTO khỏi UI; mọi giả định hợp đồng ở một nơi.
- **Preconditions:** S4.1.
- **Inspect:** `docs/frontend/Design_System_Specification.md` §5 (glyph), UI Spec §12.8–12.11.
- **Likely change:** `features/chart/model/{labels,format,chartViewModel,selection}.ts`.
- **Steps:** bảng nhãn Việt cho 14 vật thể/12 cung/5 aspect/4 góc/2 hệ nhà/3 nature; `formatDegreeMinute`; sắp xếp; cờ `houseDataAvailable`/`partialData`; bỏ qua interpretation; hành vi giá trị lạ.
- **State:** không (thuần).
- **Tests:** unit đầy đủ Mục 32.
- **Acceptance:** thứ tự tất định; nhãn đủ; không phụ thuộc React.
- **Dependencies:** S4.1.
- **Out of scope:** hình học.

### FE-S4.3 — Calculate Flow & Chart Viewer Shell
- **Objective:** nút "Tính lá số", `CalculateChartDialog`, route `/app/charts/:chartId`, page với loading/error/empty.
- **Why:** hoàn thành luồng Birth Profile → Chart.
- **Preconditions:** S4.1, S4.2.
- **Inspect:** `pages/app/profiles/page.tsx(+test)`, `app/router.tsx(+test)`, `shared/ui/{Modal,Radio,Alert,EmptyState,Skeleton}`, `widgets/app-layout`.
- **Likely change:** `pages/app/profiles/page.tsx`, `app/router.tsx`, `features/chart/ui/CalculateChartDialog/**`, `ChartViewerSkeleton`, `pages/app/charts/detail/page.tsx`, `features/chart/index.ts`.
- **Steps:** thêm hành động trên thẻ hồ sơ; dialog (Placidus mặc định, WholeSign tuỳ chọn, cảnh báo giờ sinh chưa rõ, trạng thái tải/lỗi); điều hướng; lazy route; page xử lý `useChartQuery` (UUID guard, 404/403/lỗi/loading); `document.title` + focus `h1`; viewer tạm hiển thị tiêu đề/metadata.
- **State:** `houseSystem` cục bộ trong dialog.
- **Tests:** component dialog, trang chart (các trạng thái), tích hợp profiles → dialog → chart (MSW), cập nhật `router.test`/`profiles/page.test` (chỉ thêm).
- **Acceptance:** AC Calculate Chart (Mục 49); mọi test cũ vẫn xanh.
- **Dependencies:** S4.1–S4.2.
- **Out of scope:** wheel, bảng, danh sách chart.

### FE-S4.7 — Planet / House / Aspect Tables
- **Objective:** ba bảng ngữ nghĩa + thẻ mobile + badge.
- **Why:** phương án thay thế bắt buộc; có giá trị sớm.
- **Preconditions:** S4.2, S4.3, `useMediaQuery`.
- **Inspect:** UI Spec §12.2–12.4, 12.8–12.11; `preferenceStore`.
- **Likely change:** `features/chart/ui/{PlanetTable,HouseTable,AspectTable,ChartBadges}/**`, `shared/hooks/useMediaQuery.ts`, `ChartViewer` (ghép).
- **Steps:** badges (`PlanetGlyph`, `SignGlyph`, `HouseBadge`, `AspectBadge`); bảng với `caption`/`scope`; thẻ mobile; nút chọn trong ô đầu (chưa nối sync); khối giải thích thiếu nhà; chip lọc (kết nối ở S4.8).
- **State:** không (controlled).
- **Tests:** component + `vitest-axe`; mock `matchMedia`.
- **Acceptance:** AC Tables (Mục 49).
- **Dependencies:** S4.2, S4.3.
- **Out of scope:** wheel; ma trận aspect.

### FE-S4.4 — Chart Wheel Foundation
- **Objective:** hình học thuần + SVG: vành cung, vạch chia độ, vòng nhà, góc, xoay theo ASC.
- **Why:** nền của wheel.
- **Preconditions:** S4.2.
- **Inspect:** UI Spec §12.5; Design System (glyph/token màu).
- **Likely change:** `model/{geometry,aspectGeometry?}.ts` (phần hình học), `ui/ChartWheel/**` (lớp nền).
- **Steps:** hàm thuần + test số; `buildWheelGeometry`; component lớp cung/nhà/góc; wrapper `figure`/`svg group`; chế độ không có nhà; token màu.
- **Tests:** Mục 32 (hình học), component (lớp nền).
- **Acceptance:** zodiac/nhà/góc hiển thị đúng; không nhà → không vòng nhà.
- **Dependencies:** S4.2.
- **Out of scope:** hành tinh, aspect, tương tác.

### FE-S4.5 — Planet Rendering
- **Objective:** glyph hành tinh, nghịch hành, vạch vị trí thật, dàn nhãn tránh va chạm.
- **Preconditions:** S4.4.
- **Likely change:** `model/labelLayout.ts`, `ui/ChartWheel/PlanetLayer`.
- **Steps:** thuật toán dàn nhãn tất định; đường nối; xử lý vòng 0°; nhãn độ; kích thước chữ ≥ 10px hiển thị.
- **Tests:** unit `labelLayout`; component số nút/nhãn aria.
- **Acceptance:** AC Chart Viewer (hành tinh, nghịch hành, độ); cụm hành tinh không chồng.
- **Dependencies:** S4.4. **Out of scope:** chọn/hover.

### FE-S4.6 — Aspect Rendering
- **Objective:** đường aspect theo kiểu nét; nhóm nature; công tắc bật/tắt.
- **Preconditions:** S4.4, S4.5.
- **Likely change:** `model/aspectGeometry.ts`, `ui/ChartWheel/AspectLayer`.
- **Steps:** chord/arc từ vị trí thật; thứ tự vẽ; kiểu nét; `Switch`; mặc định theo breakpoint.
- **Tests:** unit đầu mút; component kiểu nét & số đường.
- **Acceptance:** AC aspects; không chỉ màu.
- **Dependencies:** S4.4–S4.5. **Out of scope:** pattern, ma trận.

### FE-S4.8 — Interaction & Synchronization
- **Objective:** hover/focus/chọn; đồng bộ wheel ↔ bảng ↔ detail; bàn phím; live region.
- **Preconditions:** S4.5–S4.7.
- **Likely change:** `model/selection.ts`, `ChartViewer`, `SelectionDetail`, lớp hành tinh/aspect, bảng (kết nối).
- **Steps:** reducer; truyền controlled props; chip lọc; `Esc`; `aria-pressed`; live region; tap-để-chọn.
- **Tests:** component đồng bộ hai chiều, bàn phím, lọc; axe.
- **Acceptance:** AC Synchronization; không state trùng.
- **Dependencies:** S4.5–S4.7. **Out of scope:** URL state, zoom/pan nâng cao.

### FE-S4.9 — Responsive + Accessibility Hardening
- **Objective:** bố cục 3 breakpoint, zoom nút dưới `md`, thẻ mobile, skip link, reduced motion, rà a11y.
- **Preconditions:** S4.8.
- **Steps:** layout `lg` hai cột sticky; khung vuông + zoom; aspect mặc định tắt dưới `md`; skip link; kiểm `motion-reduce`; checklist thủ công; sửa lỗi axe.
- **Tests:** component theo breakpoint (mock `matchMedia`), axe, thủ công.
- **Acceptance:** AC Responsive & Accessibility.
- **Dependencies:** S4.8. **Out of scope:** pinch tuỳ biến.

### FE-S4.10 — Integration / Regression / QA
- **Objective:** E2E, hồi quy, cổng chất lượng, tài liệu, Evidence Matrix.
- **Preconditions:** S4.9.
- **Likely change:** `e2e/chart.spec.ts`, `frontend/CHANGELOG.md`, `package.json` version (đóng sprint), ghi chú route trong `docs/frontend/Frontend_UI_Specification.md` §14, Known Gaps/Evidence Matrix.
- **Steps:** E2E hai kịch bản; chạy toàn bộ cổng (Mục 46); kiểm tương thích BE (fixture + chạy thật); QA thủ công; rà ranh giới (grep); cập nhật tài liệu.
- **Acceptance:** Mục 49.
- **Dependencies:** tất cả. **Out of scope:** F5.

### FE-S4.11 — Saved Charts List (v1.1, phương án B của O-F4-2)
- **Objective:** trang `/app/charts` liệt kê chart đã lưu, mỗi mục mở lại `/app/charts/:chartId`; mục nav "Lá số của tôi".
- **Why:** mỗi lần "Tính lá số" tạo một snapshot đã lưu; không có danh sách thì người dùng mất đường vào lại lá số (đã phê duyệt thêm ở F4).
- **Preconditions:** FE-S4.1 (`listCharts`, `useChartsQuery`, `chartKeys`), FE-S4.3 (route `/app/charts/:chartId`, mutation invalidation).
- **Inspect:** `pages/app/profiles/page.tsx` (mẫu lưới + phân trang Trước/Sau + skeleton/empty/error), `widgets/app-layout/{index.tsx,AppLayout.test.tsx}` (nav ở hai chỗ), `features/birth-profile/hooks/useBirthProfilesQuery`.
- **Likely change:** `pages/app/charts/page.tsx` (+test), `features/chart/ui/ChartList/**`, `app/router.tsx` (+`router.test.tsx`), `widgets/app-layout/index.tsx` (+`AppLayout.test.tsx`), `features/chart/index.ts`.
- **Steps:** (1) page: `useState(page)`, `useChartsQuery({page, pageSize: 12})`, `useBirthProfilesQuery({page: 1, pageSize: 100})` → `Map id→nhãn` (`fullName ?? label`); (2) thẻ mỗi chart: ngày tính (`vi-VN`), `Badge` hệ nhà (Placidus/Whole Sign), tên hồ sơ (hoặc "Hồ sơ đã xoá hoặc không còn" khi `birthProfileId` là `null` hoặc không có trong `Map`), nút/liên kết "Xem lá số" (`Button as={Link} to=...`, `aria-label` có ngày + hồ sơ); (3) loading (6 Skeleton), error (+Thử lại), empty (dẫn tới `/app/profiles`); (4) phân trang Trước/Sau khi `total > pageSize`; (5) thêm route `/app/charts` (lazy) **trước** `/app/charts/:chartId`; (6) thêm mục nav "Lá số của tôi" ở sidebar và drawer (đóng drawer khi bấm, giống mục hiện có), đánh dấu active khi ở `/app/charts*`; (7) bảo đảm sau khi tính chart mới thì danh sách được làm mới (invalidate ở S4.1/S4.3).
- **State ownership:** `page` cục bộ; dữ liệu ở TanStack Query; không store mới.
- **API dependencies:** `GET /api/v1/charts` (Mục 7.1); `GET /api/v1/birth-profiles` (đã có); chỉ gửi `page`, `pageSize` (không gửi user id — Backend suy ra từ token).
- **Tests:** component `ChartList` (liên kết đúng, nhãn ghép, fallback đã xoá, axe); page (loading/error/empty/có dữ liệu/phân trang Trước-Sau, lỗi tên hồ sơ không chặn danh sách); hook `useChartsQuery`; tích hợp (tính chart → quay lại danh sách thấy mục mới nhờ invalidate); `AppLayout.test` **thêm** ca cho mục nav mới ở desktop và mobile (không sửa kỳ vọng cũ); `router.test` thêm route; E2E hai tài khoản (người dùng B thấy danh sách rỗng).
- **Commands:** `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run test:e2e`.
- **Acceptance:** AC Saved Charts List (Mục 49): có `GET /charts` qua API client hiện có; hiển thị thông tin cơ bản mà API thật cung cấp; mỗi mục mở `/app/charts/:chartId`; có loading/error/empty; chỉ chart của người dùng (kiểm bằng E2E hai tài khoản); test cũ vẫn xanh.
- **Dependencies:** S4.1, S4.3. **Out of scope:** xoá chart, lọc theo hồ sơ/sắp xếp/tìm kiếm, hiển thị `chartType`/`isHouseDataAvailable` (không có trong summary), sửa Backend để trả `birthProfileLabel`.

## 38. Task Dependencies

```text
S4.1 → S4.2 → S4.3 ─┬→ S4.11 ───────────────────────┐
                     ├→ S4.7 ─┐                      │
                     └→ S4.4 → S4.5 → S4.6 ─┤         │
                                             ├→ S4.8 → S4.9 → S4.10
```

S4.7 độc lập với S4.4–S4.6 sau S4.3 (có thể song song); S4.8 cần cả hai nhánh. S4.11 (danh sách chart) chỉ cần S4.1 và S4.3, không phụ thuộc wheel/bảng; S4.10 (E2E, hồi quy) cần tất cả.

## 39. File Change Map

| File / Directory | Action | Purpose | Task |
|---|---|---|---|
| `frontend/src/features/chart/api/types.ts` | Create | DTO + union | FE-S4.1 |
| `frontend/src/features/chart/api/{createNatalChart,getChart}.ts` (+ test) | Create | Hàm API | FE-S4.1 |
| `frontend/src/features/chart/api/mocks/{handlers,fixtures}.ts` | Create | MSW + fixture | FE-S4.1 |
| `frontend/src/features/chart/hooks/{query-keys,useChartQuery,useCreateNatalChartMutation}.ts` (+ test) | Create | Query/mutation | FE-S4.1 |
| `frontend/src/shared/lib/error-messages.ts` (+ test) | Modify | Mã lỗi chart | FE-S4.1 |
| `frontend/src/features/chart/model/{labels,format,chartViewModel,selection}.ts` (+ test) | Create | Adapter, nhãn, selection | FE-S4.2, S4.8 |
| `frontend/src/features/chart/model/{geometry,labelLayout,aspectGeometry}.ts` (+ test) | Create | Hình học thuần | FE-S4.4–S4.6 |
| `frontend/src/features/chart/ui/CalculateChartDialog/**` | Create | Dialog tính lá số | FE-S4.3 |
| `frontend/src/features/chart/ui/ChartViewer/**`, `ChartHeader`, `UnknownTimeNotice`, `SelectionDetail`, `ChartViewerSkeleton` | Create | Viewer | FE-S4.3, S4.8–S4.9 |
| `frontend/src/features/chart/ui/ChartWheel/**` | Create | SVG wheel | FE-S4.4–S4.6 |
| `frontend/src/features/chart/ui/{PlanetTable,HouseTable,AspectTable,ChartBadges}/**` | Create | Bảng + badge | FE-S4.7 |
| `frontend/src/features/chart/api/listCharts.ts`, `hooks/useChartsQuery.ts` (+ test) | Create | Gọi và cache `GET /charts` | FE-S4.1 |
| `frontend/src/features/chart/ui/ChartList/**` (+ test) | Create | Danh sách thẻ chart | FE-S4.11 |
| `frontend/src/pages/app/charts/page.tsx` (+ test) | Create | Trang danh sách chart | FE-S4.11 |
| `frontend/src/widgets/app-layout/index.tsx` (+ `AppLayout.test.tsx`) | Modify | Thêm mục nav "Lá số của tôi" (sidebar + drawer) | FE-S4.11 |
| `frontend/src/features/chart/index.ts` | Create | API công khai feature | FE-S4.3 |
| `frontend/src/pages/app/charts/detail/page.tsx` (+ test) | Create | Trang viewer | FE-S4.3 |
| `frontend/src/pages/app/profiles/page.tsx` (+ test) | Modify | Thêm "Tính lá số" | FE-S4.3 |
| `frontend/src/app/router.tsx` (+ `router.test.tsx`) | Modify | Route `/app/charts/:chartId` | FE-S4.3 |
| `frontend/src/shared/hooks/useMediaQuery.ts` (+ test) | Create | Chọn bố cục bảng/thẻ | FE-S4.7 |
| `frontend/e2e/chart.spec.ts` | Create | E2E | FE-S4.10 |
| `frontend/CHANGELOG.md`, `frontend/package.json` (version) | Modify | Đóng sprint | FE-S4.10 |
| `docs/frontend/Frontend_UI_Specification.md` (§14) | Modify | Ghi chú lệch route | FE-S4.10 |
| `docs/implementation/archive/sprint-f4/*` | Create | Evidence Matrix, Known Gaps | FE-S4.10 |

**Không được chạm:** `frontend/src/shared/api/**`, các store, `features/auth/**`, `features/birth-profile/**` (ngoài trang profiles), `backend/**`, ESLint config, `vite.config.ts` (trừ khi phát hiện lỗi chặn).

## 40. API Contract Matrix

| Data | Backend source | Frontend type | UI consumer | Nullable? |
|---|---|---|---|---|
| Chart id/type/system | `id`, `chartType`, `houseSystem` | `ChartDto` → `meta` | Header, route | không |
| Planet position | `planets[].longitude/sign/degreeInSign` | `PlanetVM.longitude/degreeLabel/signKey` | Wheel, Planet Table | không |
| Retrograde | `planets[].isRetrograde` | `PlanetVM.isRetrograde` | Wheel (℞), Planet Table | không |
| Planet house | `planets[].house` | `PlanetVM.houseNumber` | Planet Table, SelectionDetail | **có** (`null` khi thiếu nhà) |
| House | `houses[].number/cuspDegree/signOnCusp` | `HouseVM` | Wheel, House Table | mảng có thể rỗng |
| Angle | `angles[].type/longitude/sign/degreeInSign` | `AngleVM` | Wheel, House Table | mảng có thể rỗng |
| Aspect | `aspects[].…/orb/isApplying/nature` | `AspectVM` | Wheel, Aspect Table | mảng có thể rỗng |
| House data availability | `isHouseDataAvailable` | `flags.houseDataAvailable` | Wheel, tables, notice | không |
| Patterns | `patterns[]` (luôn rỗng) | không dùng | — | — |
| Interpretation | `interpretations[]`, `interpretationVersion` | giữ trong DTO, **không vào VM** | (F5) | `interpretationVersion` nullable, `tone` nullable |
| Warnings | `warnings[]` | chỉ `code` | Header/notice (nếu mã đã biết) | — |
| Chart summary (v1.1) | `GET /charts` → `items[].{id, birthProfileId, birthProfileLabel, houseSystem, calculatedAt}` | `ChartSummary` | `ChartListItem` | `birthProfileId` nullable; `birthProfileLabel` luôn `null` (không dùng) |
| List pagination (v1.1) | `total, page, pageSize` | `Paginated<ChartSummary>` | Nút Trước/Sau | không |

## 41. State Ownership Matrix

| State | Type | Owner | Reason |
|---|---|---|---|
| ChartResponse | Server | TanStack Query | Dữ liệu Backend, bất biến |
| ChartViewModel | Derived | `useMemo` | Thuần, không lưu |
| Selected Planet | UI | `ChartViewer` (`selection`) | Cha của wheel/bảng |
| Selected Aspect | UI | `ChartViewer` (`selection`) | Cùng nguồn với planet (union) |
| Hovered Element | UI | `ChartViewer` | Ephemeral |
| Show aspect lines | UI | `ChartViewer` | Cục bộ |
| Zoom | UI | `ChartViewer` | Cục bộ, chỉ dưới `md` |
| House system (dialog) | Form | `CalculateChartDialog` | Cục bộ |
| Density mode | Preference | `preferenceStore` (đã có) | Tái dùng |

## 42. Responsive Matrix

| Feature | Desktop (≥ lg) | Tablet (md–lg) | Mobile (< sm / sm–md) |
|---|---|---|---|
| Chart Wheel | Sticky, cột trái | Rộng toàn cột, trên bảng | Khung vuông ≥ 400px, nút zoom, cuộn ngang nếu hẹp |
| Planet Table | `<table>` cột phải | `<table>` | Thẻ mỗi hành tinh |
| House Table | `<table>` | `<table>` | Thẻ |
| Aspect Table | `<table>` (list) | `<table>` | Thẻ |
| Tooltip | Không dùng (panel chi tiết) | Panel | Panel dưới wheel |
| Selection | click/focus + panel | tap + panel | tap + panel, nút "Bỏ chọn" |
| Aspect lines | Bật | Bật | Tắt mặc định (công tắc) |
| Chart List (v1.1) | Lưới 3 cột | Lưới 2 cột | 1 cột (cùng mẫu danh sách hồ sơ) |

## 43. Accessibility Matrix

| UI Element | Keyboard | Screen Reader | Touch | Alternative |
|---|---|---|---|---|
| Chart Wheel | Tab vào nút hành tinh | `group` + nhãn tóm tắt | tap nút hành tinh | 3 bảng |
| Planet | Tab, Enter/Space chọn, Esc bỏ | "Sao Diêm Vương, nghịch hành, ở Bọ Cạp, nhà 8" | tap | Planet Table |
| Aspect | Chọn qua hàng bảng (nút), Esc | "Mặt Trời — Vuông chiếu — Sao Hoả, orb 2°14′" | tap hàng | Aspect Table |
| House | Không tương tác | Số nhà + cung ở bảng | — | House Table |
| Angle | Không tương tác | Nhãn đầy đủ | — | House Table |
| Zoom controls | Tab, Enter | Nút có nhãn | tap | Zoom trình duyệt |
| Notice thiếu giờ sinh | — | `role="status"` (Alert info) | — | Văn bản |
| Chart List (v1.1) | Tab tới từng liên kết "Xem lá số" | Tên liên kết có ngày + hồ sơ ("Xem lá số tính ngày 08/10/2026, hồ sơ Phuc") | tap thẻ/nút | Danh sách ngữ nghĩa (`ul`/`li` hoặc `Grid` với `h3`) |

## 44. Test Matrix

| Area | Unit | Component | Integration | E2E | Priority |
|---|---|---|---|---|---|
| Chart adapter / labels / format | ✓ | | | | High |
| Geometry / label layout / aspect geometry | ✓ | | | | High |
| Selection reducer | ✓ | ✓ | ✓ | | High |
| Chart Wheel | | ✓ (+axe) | | ✓ | High |
| Planet/House/Aspect Table | | ✓ (+axe) | | ✓ | High |
| Calculate dialog + navigation | | ✓ | ✓ | ✓ | High |
| Loading/error/empty | | ✓ | ✓ | ✓ | High |
| Unknown birth time | ✓ | ✓ | ✓ | ✓ | High |
| BE Sprint 4 compatibility (interpretation fields) | ✓ | ✓ | | | High |
| Responsive (cards vs table) | | ✓ | | | Medium |
| Keyboard / live region | | ✓ | | ✓ | High |
| Error dictionary | ✓ | | | | Medium |
| Visual / glyph rendering | | | | thủ công | Medium |

## 45. Regression Matrix

| Existing Feature | Regression Risk | Verification |
|---|---|---|
| Authentication | Route mới trong `ProtectedRoute` ảnh hưởng redirect | `ProtectedRoute.test`, `router.test`, E2E đăng nhập |
| Birth Profile | Thêm nút trên thẻ hồ sơ làm lệch layout/test | `profiles/page.test` (chỉ thêm ca), E2E `birth-profile.spec` |
| API client | Mutation mới dùng `apiClient` | Không sửa `shared/api`; `client.test` xanh |
| Routing | Route lazy mới, thứ tự khớp | `router.test` |
| Shared UI | Dùng Modal/Alert/Radio/Skeleton | Test shared UI không đổi |
| Existing tests | Số lượng/độ xanh | 78 file / 391 test baseline; CI `test:coverage` |
| BE Sprint 4 | `ChartResponse` mới có `interpretations`/`interpretationVersion` | Fixture thật + test độc lập với diễn giải; E2E với backend thật |
| Dictionary errors | Mã mới | `error-messages.test` |
| App layout / nav (v1.1) | Thêm mục nav ở hai nơi làm lệch thứ tự/test hiện có | `AppLayout.test` (chỉ **thêm** ca), E2E điều hướng |
| Route order (v1.1) | `/app/charts` và `/app/charts/:chartId` khớp nhầm | `router.test` (hai route độc lập) |

## 46. Quality Gates

Lệnh lấy từ `package.json` (`VERIFIED`); **không** có lệnh nào được bịa:

```bash
cd frontend
cp .env.example .env                 # cần VITE_API_BASE_URL (thiếu ⇒ env.ts ném ZodError)
npm run lint
npm run typecheck
npm run format:check
npm test                             # vitest run --passWithNoTests
npm run test:coverage                # CI chạy lệnh này
npm run build                        # tsc --noEmit && vite build
npm run test:e2e                     # Playwright, cần backend thật (CI frontend dựng sẵn)
```

Bằng chứng chấp nhận: CI `frontend-ci.yml` xanh trên **đúng commit cuối** (format, lint, typecheck, `test:coverage`, build, E2E). Log chỉ cần cho phần thủ công (a11y/glyph/QA thị giác) và việc CI không chạy.

## 47. Known Gaps / Technical Debt

| ID | Vấn đề | Phân loại |
|---|---|---|
| FG-01 | `ChartResponse` không có `birthProfileId`/dữ liệu sinh/`isBirthTimeKnown` ⇒ header không hiện tên hồ sơ/ngày sinh; "giờ sinh chưa rõ" chỉ suy ra từ `isHouseDataAvailable` | **Requires Backend change** (đề xuất cho sprint Backend sau) |
| FG-02 | ~~Không có danh sách chart~~ **Đã giải quyết ở v1.1** bằng FE-S4.11 (phương án B). Còn lại: mỗi lần "Tính lá số" tạo thêm một chart (`save=true`) nên danh sách có thể có nhiều snapshot trùng dữ liệu; chưa có xoá chart (Backend đã có `DELETE /charts/:id`) | **Known Gap — defer** (xoá chart, loại trùng) |
| FG-03 | Guest/anonymous chart (`/chart/new`, `save=false`) không có route/ID xem lại | **Requires separate architectural decision** |
| FG-04 | `isApplying` boolean ⇒ "Tách xa" cho mọi `false`; không có trạng thái chính xác | **Requires Backend change** nếu cần phân biệt |
| FG-05 | Pinch-to-zoom tuỳ biến (UI Spec §7.2) chưa làm; dùng nút zoom + pinch gốc | **Known Gap — defer** |
| FG-06 | Ma trận aspect (`grid`), element colour (`SignBadge showElement`), số La Mã nhà, Chiron/Lilith/Nút mặc định, Pattern UI, Tabs | **Known Gap — defer** |
| FG-07 | Moon/thiếu giờ sinh (KG-S4-06): chỉ có lời nhắc, chưa có độ bất định theo từng thiên thể | **Requires separate architectural decision** |
| FG-08 | UI Spec §12.5 `role="img"` ⇒ plan dùng `group` (xem Mục 29); spec cần cập nhật | **Should fix before closure** (tài liệu) |
| FG-09 | UI Spec §13–14 route (`/chart/*`, `/app/charts`) khác thực tế; Architecture Spec nhắc Recharts/Framer Motion chưa cài | **Should fix before closure** (tài liệu) |
| FG-10 | Debt Core: `<title>` động, focus sau điều hướng (OQ-M8-1/2), ESLint `boundaries` đang tắt, 2 link nav cũ dùng `<a href>` (F3 G-F3-04…) | **Existing debt — unrelated** (chỉ xử lý cục bộ trên trang chart) |
| FG-11 | Giữ nguyên: `INVALID_BIRTH_TIME`… không liên quan; các Known Gaps F3 | **Existing debt — unrelated** |
| FG-12 | Hiển thị glyph Unicode phụ thuộc font nền tảng; chưa có font subset | **Known Gap — defer** (rủi ro Mục 48) |
| FG-13 | Danh sách chart hiển thị tên hồ sơ bằng cách ghép client (`pageSize=100`); `birthProfileLabel` Backend luôn `null`; tài khoản > 100 hồ sơ có thể hiện nhãn "không còn" sai | **Requires Backend change** (đưa `birthProfileLabel` vào summary — Known Gap G-02 của Backend) |
| FG-14 | `ChartSummaryResponse` không có `chartType`/`isHouseDataAvailable`; danh sách không thể báo "chưa có Nhà" trước khi mở | **Requires Backend change** nếu cần |

## 48. Risks and Mitigations

| ID | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| R1 | Glyph chiêm tinh hiển thị thành emoji/ô vuông trên một số nền tảng | Trung bình | `U+FE0E`, font dự phòng, QA thủ công 4 nền tảng, nhãn chữ luôn có |
| R2 | Hình học sai định hướng/vòng 0° | Cao | Unit test số học với điểm biết trước, fixture `chartWrap` |
| R3 | Chồng nhãn trong stellium | Trung bình | Thuật toán dàn + 2 làn; fixture `chartCluster`; bảng luôn đủ dữ liệu |
| R4 | Lệch hợp đồng DTO (không có codegen) | Trung bình | Fixture lấy từ phản hồi thật; adapter chịu giá trị lạ; E2E backend thật |
| R5 | A11y wheel khó dùng | Cao | Bảng là nguồn đầy đủ; `group` + nút; kiểm thủ công bằng screen reader |
| R6 | Mobile chật | Trung bình | Khung vuông + zoom + thẻ; aspect mặc định tắt |
| R7 | Người dùng không tìm lại được lá số | Thấp (v1.1) | Đã giải quyết bằng FE-S4.11; kiểm bằng E2E mở lại lá số từ danh sách |
| R8 | Hồi quy test cũ khi thêm nút/route | Trung bình | Chỉ **thêm** ca; chạy toàn bộ sau mỗi task |
| R9 | Tạo quá nhiều chart do bấm lặp | Thấp | Khoá nút khi pending; chấp nhận mỗi lần tính là một snapshot (FG-02) |
| R10 | Sai ngữ nghĩa applying/separating | Thấp | Nhãn trung tính + ghi chú FG-04 |
| R11 | Test cần `VITE_API_BASE_URL` (thiếu ⇒ cả bộ test lỗi khi nạp) | Thấp | Ghi vào Mục 46; CI đã `cp .env.example .env` |
| R12 | `role="group"` lệch UI Spec bị hiểu nhầm | Thấp | FG-08, ghi chú tài liệu |
| R13 | Ghép tên hồ sơ sai khi > 100 hồ sơ hoặc khi tải lỗi | Thấp | Fallback rõ ràng không chặn danh sách; ghi FG-13 |
| R14 | Thêm mục nav làm vỡ `AppLayout.test`/layout (nav khai báo hai nơi) | Thấp | Chỉ thêm ca test; sửa đồng thời cả hai nơi; E2E điều hướng |
| R15 | Danh sách phình do nhiều snapshot trùng (mỗi lần tính = một chart) | Thấp | Khoá nút khi pending; phân trang; FG-02 (xoá/loại trùng hoãn) |

## 49. Definition of Done

Sprint F4 hoàn thành khi: luồng Birth Profile → Tính lá số → Chart API → Chart Viewer → Wheel → ba bảng → đồng bộ chọn → responsive → phương án thay thế dạng bảng → loading/error/empty → test hồi quy → cổng chất lượng đều đạt, và các tiêu chí sau thoả:

**Birth Profile:** hồ sơ hiện có truy cập được, validation không đổi, thẻ có hành động "Tính lá số".
**Calculate Chart:** kích hoạt được; trạng thái tải rõ; lỗi API hiện thông báo tiếng Việt từ từ điển; thành công điều hướng tới `/app/charts/:chartId`.
**Chart Viewer:** wheel dựng từ dữ liệu Backend; hiện 12 cung, nhà (khi có), hành tinh, góc (khi có), nghịch hành, aspect, độ.
**Bảng:** Planet/House (khi có dữ liệu)/Aspect Table ngữ nghĩa, hoạt động.
**Saved Charts List (v1.1):** `GET /charts` được gọi qua API client hiện có; hiển thị thông tin cơ bản mà API thật cung cấp (ngày tính, hệ nhà, tên hồ sơ ghép client); mỗi mục mở được `/app/charts/:chartId`; có loading/error/empty; chỉ chart của người dùng hiện tại (E2E hai tài khoản); mục nav mới hoạt động ở desktop và mobile; chart vừa tính xuất hiện trong danh sách.
**Đồng bộ:** chọn wheel↔bảng hoạt động; chỉ một nguồn `selection`.
**Thiếu giờ sinh:** không hiện lỗi; thông báo rõ phần Nhà/góc không có; dữ liệu hành tinh/cung dùng được.
**A11y:** có phương án bảng; bảng ngữ nghĩa; phần tử tương tác dùng được bàn phím; thông tin không chỉ bằng màu; kiểm thủ công đã ghi.
**Responsive:** desktop/tablet/mobile dùng được; cảm ứng chọn được.
**Chất lượng:** test hiện có xanh; test mới phủ hành vi cốt lõi; `lint`, `typecheck`, `format:check`, `build` pass; CI xanh trên commit cuối; không `dangerouslySetInnerHTML`; không dependency mới; Evidence Matrix có bằng chứng thật.

## 50. Final Architect Review

| Câu hỏi | Đánh giá |
|---|---|
| Architecture | Nhất quán với `features/*/{api,hooks,model,ui}`; hình học thuần tách khỏi React; lệch spec được ghi (route, `role`, zoom). Rủi ro: ESLint `boundaries` tắt ⇒ cần review/grep thủ công |
| Backend compatibility | Dùng đúng hợp đồng đã xác minh; chấp nhận `interpretations`/`interpretationVersion`; render độc lập diễn giải; thứ tự tự sắp, không giả định Backend |
| State | Không Zustand/Context; một `selection`; server state ở Query |
| Visualization | Hình học tất định, test số học; wheel không là nguồn duy nhất |
| Accessibility | Có phương án bảng thật; `group` + nút; kiểm tự động chỉ là một phần, có thủ công |
| Responsive | Khả thi trên mobile (khung vuông + zoom + thẻ); pinch tuỳ biến hoãn |
| Testing | Rủi ro cao nhất được phủ: hình học, va chạm nhãn, thiếu giờ sinh, đồng bộ, E2E backend thật |
| Scope | Không kéo F5, Guest; danh sách chart tối thiểu được owner phê duyệt (một task phụ, FE-S4.11); các phần còn lại ghi ở Known Gaps |
| Dependencies | Không thêm gói; chỉ một hook nội bộ |
| Risks | Glyph đa nền tảng; thiếu `birthProfileId`/dữ liệu sinh trong `ChartResponse` (FG-01) và `birthProfileLabel` (FG-13) |

## 51. Final Recommendation

`READY FOR IMPLEMENTATION`

**Các điều kiện của v1.0 đã đáp ứng:** O-F4-1 (route `/app/charts/:chartId`, `save=true`), O-F4-2 (phương án B — thêm FE-S4.11), O-F4-3 (đã xác minh hợp đồng: `houseSystem` ∈ {`Placidus`, `WholeSign`}; `includeOptionalPoints` mặc định `[]` hợp lệ, không có Chiron nếu không yêu cầu) đều được owner phê duyệt, và hợp đồng Backend liên quan (`GET /charts`, `POST /charts/natal`) đã được xác minh ở Mục 7.1. Các khuyến nghị mặc định còn lại được giữ nguyên.

**Không còn blocker.** Việc tiếp theo: bắt đầu FE-S4.1 (API/DTO/hooks, kèm `listCharts`/`useChartsQuery`) và FE-S4.2 (ViewModel). Điểm cần theo dõi khi triển khai: (1) xác minh mã lỗi chart thực sự tới client (đọc `map-domain-error.ts`) khi làm từ điển lỗi; (2) tạo fixture từ phản hồi thật của Backend; (3) hai khai báo nav trong `widgets/app-layout/index.tsx` phải sửa đồng bộ.
