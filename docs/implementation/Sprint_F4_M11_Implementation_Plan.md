# AstroViet — Sprint F4 M11 Implementation Plan
## Saved Charts List

**Vị trí đề xuất:** `docs/implementation/Sprint_F4_M11_Implementation_Plan.md` (blueprint tạm thời; xoá khi M11 đóng, lưu Evidence Matrix vào `docs/implementation/archive/sprint-f4/`).
**Phiên bản:** 1.0 — **`READY FOR IMPLEMENTATION`** (Mục 36).
**Căn cứ:** audit repo `dev` tại `25bc8c9` (2026-10-12), Frontend CI #240 Success; `Sprint_F4_Implementation_Plan.md` v1.1 (FE-S4.11, Mục 7.1, AC Mục 49); mã Backend `backend/src/modules/chart/**`; prompt M11.
**Quy ước nguồn:** `[repo]` đọc mã/tài liệu · `[C-run]` Claude chạy lệnh trong sandbox (`npm ci` theo lockfile, Node v22.22.2) · `[CI]` trang GitHub Actions công khai · `[owner]` owner cung cấp.
**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `BLOCKED` · `NOT APPLICABLE` · `DEFERRED`.
**Giới hạn audit:** không chạy Backend (sandbox không có Postgres) và không chạy E2E Playwright. Kết luận về Backend là đọc mã tĩnh, đối chiếu với response CAPTURED của M1.

---

## 1. Executive Summary

M11 (= FE-S4.11 trong plan v1.1, phương án B của O-F4-2) thêm **trang `/app/charts` "Lá số của tôi"**: danh sách chart đã lưu của người dùng, mỗi mục có "Xem lá số" mở lại `/app/charts/:chartId`, kèm mục điều hướng ở sidebar và drawer. M11 **tái dùng** `listCharts`, `useChartsQuery`, `chartKeys` và cơ chế invalidation đã có; không đổi Backend, không thêm store.

**Tiền đề đã xác minh:** FE-S4.1 và FE-S4.3 hoàn tất. Tại HEAD `25bc8c9`: `typecheck` (cổng thật), `lint`, `format:check` exit 0; **98 file / 619 test passed** [C-run]; Frontend CI #240 **Success** (2m 44s) [CI]. Các sửa F-1/F-2 của M3 đã vào (memo `getErrorMessage`, token `text-primary`).

**Đính chính:** ở lượt review M3 mình nói E2E có thể là job riêng. Thực tế `frontend-ci.yml` chỉ có **một job `build`** gồm cả `npm run test:e2e` ⇒ CI xanh nghĩa là E2E `birth-profile.spec.ts` cũng đã pass trên các commit M3.

**Phát hiện quan trọng (đều có bằng chứng) — plan khác kỳ vọng ở các điểm sau:**

| # | Phát hiện | Hệ quả cho plan |
|---|---|---|
| 1 | **`AppLayout` hoàn toàn không có khái niệm "active route":** các mục nav là JSX cứng (không có mảng cấu hình, không `NavLink`, không `aria-current`, không style active) ở **hai** nơi (sidebar và drawer). Prompt yêu cầu "dùng mẫu hiện có" — không có mẫu. | Active state là **chức năng mới**; dùng `NavLink` (so khớp tiền tố mặc định ⇒ active ở cả `/app/charts` và `/app/charts/:id`) **chỉ cho mục mới**; không retrofit mục khác (D-M11-5). |
| 2 | **Đóng drawer không được tập trung:** mỗi `Link` trong drawer tự gọi `setMobileDrawerOpen(false)`; các `<a href="/">` không đóng. Trạng thái drawer nằm ở **Zustand `useUiStore` có sẵn** (`mobileDrawerOpen`). | Mục mới làm đúng như "Hồ sơ sinh": `onClick={() => setMobileDrawerOpen(false)}`; không tạo cơ chế mới và không tạo store mới. |
| 3 | **Nhãn phân trang lệch tài liệu:** plan v1.1/prompt ghi "Trước/Sau", nhưng `profiles/page.tsx` thực tế dùng **"Trang trước"/"Trang sau"**. | Theo thứ bậc nguồn dùng **"Trước"/"Sau"** (plan v1.1); ghi lệch với F3 (D-M11-1). |
| 4 | **Giới hạn 100 hồ sơ có thể làm sai nhãn "đã xoá":** Backend `pageSize` tối đa 100 (clamp trong `list-charts.usecase.ts`/schema) và `birthProfileLabel` luôn `null`. Tài khoản >100 hồ sơ ⇒ chart bị gán nhầm "Hồ sơ đã xoá hoặc không còn". | Giữ `page:1,pageSize:100`; dùng `total` của response hồ sơ để phát hiện tra cứu **chưa đủ** và hiển thị nhãn trung tính thay vì "đã xoá" (đề xuất cần duyệt — D-M11-3). |
| 5 | **Ba trạng thái nhãn cần phân biệt, không chỉ "có/không":** `birthProfileId = null` (chắc chắn "đã xoá"), tra cứu đang tải, tra cứu lỗi. `useBirthProfilesQuery` không có `placeholderData`. | Resolver thuần `resolveChartProfileLabel` (Mục 13) tránh nhãn sai trong lúc tải. |
| 6 | **`calculatedAt` là ISO timestamp đầy đủ (UTC), không phải date-only** (`z.string().datetime()`). Đã có `formatCalculatedAt` (`vi-VN`, giờ địa phương). Rủi ro "lệch ngày do parse date-only" **không áp dụng**. | Tái dùng `formatCalculatedAt`; hiển thị ngày + giờ; test không ghim chuỗi cứng phụ thuộc múi giờ. |
| 7 | **`Button` có `as={Link}` + `to`** (`shared/ui/Button`); `Grid`/`Card` có `as`; `Badge` không tương tác; `Alert` có `actions`. | Không cần phương án thay thế; dùng đúng như prompt. |
| 8 | **Invalidation đã đúng:** `useCreateNatalChartMutation.onSuccess` gọi `invalidateQueries({ queryKey: chartKeys.lists() })` (không await) và seed `detail`. `useChartsQuery` không đặt `staleTime` ⇒ refetch khi mount. | Không đổi mutation; M11 chỉ thêm test tích hợp (Mục 18). |
| 9 | **Backend sắp xếp theo `calculated_at` không có tie-breaker** (`orderBy: { calculated_at: order }`); `include` nặng cho danh sách. | Rủi ro thứ tự không ổn định giữa trang khi trùng timestamp (R-14); ghi nhận, không sửa. |
| 10 | **E2E đã có mẫu** (`birth-profile.spec.ts`: đăng ký/đăng nhập bằng UI, mock `/locations/search`, Backend thật trong CI); chưa có spec tính lá số. `browser.newContext()` tạo danh tính cô lập. | E2E hai tài khoản bằng hai context riêng (Mục 29); đây sẽ là **lần đầu** CI frontend gọi engine tính chart thật (R-12). |
| 11 | `vitest-axe` đã được cài và đăng ký matcher (`src/test/setup.ts`), được dùng ở `shared/ui/*.test.tsx`. | Test axe dùng tooling sẵn có; **không thêm dependency**. |
| 12 | Collapsed sidebar chỉ còn icon và không có tên truy cập (đã tồn tại với mọi mục). | Existing defect — báo cáo, không sửa ở M11 (KG-M11-05). |

## 2. Milestone Objective and Rationale

**Mục tiêu:** người dùng đã đăng nhập mở được `/app/charts`, thấy các lá số đã lưu (mới nhất trước, 12 mục/trang, Trước/Sau), và mở lại từng lá số tại `/app/charts/:chartId`.
**Lý do:** mỗi lần "Tính lá số" tạo một snapshot đã lưu (O-F4-1); sau M3 người dùng chỉ vào lại được lá số ngay sau khi tính; reload hoặc quay lại sau đó không còn đường vào.
**Không phải:** quản lý chart (xoá/lọc/sắp xếp/tìm kiếm), hiển thị `chartType`/`isHouseDataAvailable`, thay đổi Backend.

## 3. Current Repository State

| Hạng mục | Thực tế | Trạng thái |
|---|---|---|
| HEAD | `25bc8c9`; Frontend CI #240 Success (job `build` gồm format, lint, typecheck, `test:coverage`, build, E2E) | VERIFIED [CI] |
| Cổng chất lượng | `npm run typecheck` (= `tsc -p tsconfig.app.json --noEmit`), `lint`, `format:check` exit 0; vitest 98 file / 619 test | VERIFIED [C-run] |
| Scripts | `test`=`vitest run --passWithNoTests`, `test:coverage`, `lint`, `typecheck`, `format:check`, `build`, `test:e2e`=`playwright test` | VERIFIED `package.json` |
| `features/chart/` | `api/`, `hooks/`, `model/`, `ui/{CalculateChartDialog,ChartViewerSkeleton,ChartViewerShell}`, `index.ts`; **chưa có `ChartList`** | VERIFIED |
| Public API chart | `index.ts` export: `CalculateChartDialog`, `ChartViewerShell`, `ChartViewerSkeleton`, `useChartQuery`, `isValidChartId`, `toChartViewModel`, `ChartViewModelError` + kiểu | VERIFIED |
| Trang chart | `pages/app/charts/detail/page.tsx` (default `ChartDetailPage`); **chưa có `pages/app/charts/page.tsx`** | VERIFIED |
| Router | `app/router.tsx`: `lazy()`; `app` → `ProtectedRoute` → `AppLayout`; con: `index`, `profiles`, `profiles/new`, `profiles/:id/edit`, `charts/:chartId`; `*` → `NotFoundPage` | VERIFIED |
| Layout | `widgets/app-layout/index.tsx`: nav cứng ở sidebar (`aria-label="Điều hướng chính"`) và drawer (`"Điều hướng chính (Mobile)"`); mục: Bảng điều khiển (`<a href="/">`), Hồ sơ sinh (`Link`), Cài đặt (`<a href="/">`) | VERIFIED |
| Test layout | `AppLayout.test.tsx` 9 test; `renderWithRoute` chỉ khai báo `/app/profiles`; kiểm drawer qua `useUiStore.getState().mobileDrawerOpen` | VERIFIED |
| Icon | `lucide-react ^1.28.0`; `Orbit`, `Sparkles`, `Star`, `ScrollText`, `ChartPie`, `MoonStar` đều có trong bản cài | VERIFIED [repo] |

## 4. Roadmap and O-F4-2 Option B Traceability

| Nguồn | Nội dung | Truy vết |
|---|---|---|
| `Sprint_F4_Implementation_Plan.md` dòng 6, 16–21 | v1.1 `READY FOR IMPLEMENTATION`; O-F4-2 chọn **phương án B**; thêm FE-S4.11 (task 10 → 11) | M11 = FE-S4.11 |
| Mục 7.1 | Hợp đồng `GET /charts` đã xác minh; ghép nhãn phía client bằng `useBirthProfilesQuery({page:1,pageSize:100})`; giới hạn >100 hồ sơ là Known Gap **FG-13** | Mục 6, 13 |
| FE-S4.11 (dòng 632–644) | Objective/Steps/Tests/Acceptance cho danh sách | Mục 23, 26, 33 |
| Mục 49 | AC "Saved Charts List (v1.1)" (dòng 844) | Mục 33 |
| Thứ tự thực thi (dòng 521) | S4.1 → S4.2 → S4.3 → **S4.11** → S4.7 → … | M11 là milestone tiếp theo sau M3 |
| Mục 29/31/60 | FG-01: viewer không có tên hồ sơ; danh sách dùng ghép client | Mục 13 |

**Lệch/giải quyết:** (1) "Trước/Sau" vs "Trang trước/Trang sau" (Mục 15). (2) Prompt gọi `useChartsQuery({ page, pageSize: 12 })` — hook thật nhận `ListChartsParams` (`page?`, `pageSize?`, `birthProfileId?`, `sortBy?`, `order?`), khớp. (3) F4 plan dòng 237 liệt kê `ChartList` nhận `items`, `profileLabelById: Map`; plan này mở rộng thêm trạng thái tra cứu (Mục 13) để tránh nhãn sai. Không có xung đột với quyết định đã đóng băng.

## 5. Preconditions and Dependency Audit

| Tiền đề | Bằng chứng | Trạng thái | Chặn M11? |
|---|---|---|---|
| **FE-S4.1** `listCharts` | `features/chart/api/listCharts.ts`: `GET /api/v1/charts`, `{ params }`; test 4 ca | VERIFIED | Không |
| `useChartsQuery` | `hooks/useChartsQuery.ts`: `useQuery<ListChartsResponse, ApiError>`, `queryKey: chartKeys.list(params)`, `placeholderData: keepPreviousData`; **không** `staleTime`; test 2 ca (giữ dữ liệu trang trước + params; lỗi `ApiError`) | VERIFIED | Không |
| `chartKeys` | `hooks/query-keys.ts`: `all`, `lists` (`["charts","list"]`), `list(params)`, `details`, `detail` | VERIFIED | Không |
| Kiểu | `api/types.ts`: `ChartSummary{id, birthProfileId: string\|null, birthProfileLabel: string\|null, houseSystem: HouseSystem, calculatedAt: string}`; `ListChartsResponse{items,total,page,pageSize}` | VERIFIED | Không |
| MSW/fixture | `mocks/handlers.ts`: `mockListCharts`, `listChartsSuccess(overrides)` (mặc định `pageSize: 20` — test M11 phải truyền `pageSize: 12`), `chartSummaryFixtures` (một mục `birthProfileId` UUID, một mục `null`) | VERIFIED | Không |
| **FE-S4.3** route chi tiết | `app/router.tsx` đăng ký `charts/:chartId` (lazy) trong nhóm `app`; test R1–R5 của M3 | VERIFIED | Không |
| Invalidation khi tạo chart | `useCreateNatalChartMutation.onSuccess`: `setQueryData(chartKeys.detail(chart.id), chart)` + `invalidateQueries({ queryKey: chartKeys.lists() })` (không await) | VERIFIED | Không |
| Tích hợp tính → viewer | `src/app/chart-flow.integration.test.tsx` (I1–I3) | VERIFIED | Không |
| `useBirthProfilesQuery` | nhận `params?: ListBirthProfilesParams`; `queryKey = birthProfileKeys.list(params)`; **không** `staleTime`/`placeholderData`; invalidate bởi mutation hồ sơ qua `birthProfileKeys.lists()` | VERIFIED | Không |
| `features/chart` public API | có `index.ts`; chưa export thành phần danh sách | VERIFIED | Cần mở rộng (M11.3) |

**Kết luận:** không có tiền đề thiếu; **không có blocker**. Không cần sửa FE-S4.1/S4.3.

## 6. Backend API Contract Audit

Nguồn: `chart.routes.ts`, `chart.controller.ts#listHandler`, `list-charts-query.schema.ts`, `list-charts.usecase.ts`, `chart-summary-response.mapper.ts`, `prisma-chart.repository.ts#listByUserId`, `birth-profile` list endpoint [repo] (đọc tĩnh; chưa gọi API thật).

| Hạng mục | Thực tế | Trạng thái |
|---|---|---|
| Endpoint & auth | `GET /api/v1/charts`, `requireAuth()`; user lấy từ token (`getCurrentUser(req).sub`) — **client không gửi user id** | VERIFIED |
| Query | `page` ≥1 (mặc định 1), `pageSize` 1–100 (mặc định 20; use case clamp), `birthProfileId?`, `sortBy` (`calculatedAt`), `order` (`asc|desc`, mặc định `desc`) | VERIFIED |
| Response | `{ items, total, page, pageSize }`; `page/pageSize` là giá trị **đã chuẩn hoá** server | VERIFIED |
| `ChartSummaryResponse` | `{ id (uuid), birthProfileId (uuid\|null), birthProfileLabel (luôn null — G-02), houseSystem (string), calculatedAt (ISO datetime) }`; không có `chartType`/`isHouseDataAvailable` | VERIFIED |
| `birthProfileId` | nullable; FK `onDelete: SetNull` ⇒ hồ sơ xoá thì chart còn, `birthProfileId = null` | VERIFIED |
| Cô lập | repository `where: { user_id: userId, deleted_at: null }` | VERIFIED [repo]; chưa có bằng chứng chạy thật ⇒ **E2E (Mục 29)** |
| Thứ tự | `orderBy: { calculated_at: order }` **không tie-breaker** | VERIFIED (R-14) |
| `houseSystem` giá trị | `Placidus`, `WholeSign` (kiểu `HouseSystem`); wire là chuỗi tự do ⇒ kiểu TS **không** bảo vệ runtime | VERIFIED |
| Hồ sơ | `GET /api/v1/birth-profiles` trả `{items,total,page,pageSize}`; `pageSize` tối đa 100 | VERIFIED [repo] |

## 7. Existing Frontend Architecture

- **Phân lớp:** `shared` → `features/<n>/{api,hooks,model?,ui}` → `pages/<area>/<route>/page.tsx` → `widgets` → `app`. Quy tắc: feature **không** import feature khác; pages ghép các feature (Architecture Spec §2.2); component UI không import `features/*/api` trực tiếp.
- **Barrel:** `features/chart/index.ts` là Public API (M3). Code mới ở `pages/` import `@features/chart`; `features/birth-profile` không có barrel, F3 import sâu (`@features/birth-profile/hooks/...`) — M11 theo mẫu này cho phía hồ sơ.
- **Lazy routes:** `lazy(() => import("@pages/..."))` + `<Suspense>` trong layout.
- **Ranh giới đang tắt lint** (`boundaries/element-types: off`) ⇒ bảo đảm bằng grep ở Mục 30.

## 8. Existing Birth Profile and Chart Flows

- **Trang hồ sơ** (`pages/app/profiles/page.tsx`): `useState(page)`; `useBirthProfilesQuery({ page, pageSize: 10 })`; loading = 6 `Skeleton` `h-40`; lỗi = `EmptyState danger` + "Thử lại" (`refetch`); rỗng = `EmptyState` + hành động; danh sách = `Grid` (1/2/3 cột) của `Card`; phân trang khi `data.total > PAGE_SIZE` bằng hai `Button variant="secondary"` ("Trang trước"/"Trang sau") + "Trang {n}", `disabled` theo `page === 1` / `page * PAGE_SIZE >= data.total`. Nhãn hồ sơ: `profile.fullName ?? profile.label`.
- **Luồng tính:** nút "Tính lá số" → `CalculateChartDialog` → `POST /charts/natal?save=true` → hook seed `detail` + invalidate `lists()` → `navigate("/app/charts/:id")` → `ChartDetailPage`.
- **`BirthProfile`:** `id: string`, `fullName: string|null`, `label: string`.
- **Lưu ý test:** test hồ sơ dùng `id: "1"` (không UUID); `ChartSummary.birthProfileId` trong fixture là UUID — không ảnh hưởng vì Map khoá bằng chuỗi.

## 9. Existing Query and Cache Architecture

| Hạng mục | Hành vi |
|---|---|
| `chartKeys.list(params)` | `["charts","list",{page,pageSize}]`; mỗi trang một khoá riêng |
| `useChartsQuery` | `keepPreviousData` ⇒ đổi trang: `data` giữ trang cũ, `isPlaceholderData=true`, `isLoading=false`; không `staleTime` ⇒ **luôn stale**, refetch khi mount/focus/reconnect |
| Quay lại từ chi tiết | list đã có cache ⇒ hiện **ngay** dữ liệu cũ (`isFetching=true`, `isLoading=false`) rồi cập nhật — không skeleton |
| Sau khi tính chart | mutation `invalidateQueries(chartKeys.lists())`: (a) nếu list đang mount ⇒ refetch ngay; (b) nếu **không** mount (người dùng đang ở `/app/profiles`) ⇒ đánh dấu invalid + dữ liệu cũ còn trong cache (`gcTime` 5 phút); lúc mount lại ⇒ hiện cache rồi refetch ⇒ chart mới xuất hiện sau một nhịp; (c) cache đã bị GC ⇒ tải mới (skeleton) |
| Lỗi truy vấn | `retry: false` (mặc định `createQueryClient`); **không** báo cáo toàn cục cho query |
| `useBirthProfilesQuery` | không `staleTime`; khoá `["profiles",{page:1,pageSize:100}]` khác khoá của trang hồ sơ (`pageSize:10`) ⇒ cache riêng; mutation hồ sơ invalidate theo tiền tố |

## 10. Proposed Architecture

```text
pages/app/charts/page.tsx  (ChartListPage — composition)
   ├─ useState(page)                         ← state cục bộ duy nhất
   ├─ useChartsQuery({ page, pageSize: 12 }) ← server state (TanStack Query)
   ├─ useBirthProfilesQuery({ page:1, pageSize:100 })  ← server state (hook của birth-profile)
   ├─ useMemo → ChartProfileLookup {status, labelsById, isComplete}   ← dữ liệu dẫn xuất
   └─ <ChartList items lookup />             ← features/chart/ui/ChartList (thuần trình bày)
          └─ ChartListItem × n → <Button as={Link} to="/app/charts/:id" aria-label=…>Xem lá số</Button>
widgets/app-layout/index.tsx ← mục nav "Lá số của tôi" (NavLink) ở sidebar + drawer
app/router.tsx               ← lazy route `charts` (trước `charts/:chartId`)
```

| Quyết định | Bằng chứng | Phương án khác | Hệ quả |
|---|---|---|---|
| `ChartList` **không** import `birth-profile`; nhận `lookup` dạng dữ liệu thuần | Architecture Spec §2.2 | import `BirthProfile` | page dựng `lookup` từ kiểu cấu trúc `{id, fullName, label}` |
| Resolver nhãn thuần `resolveChartProfileLabel` trong `ChartList/` | cần test mọi nhánh, tránh logic trong JSX | nhúng vào component | file nhỏ, dễ test |
| Tái dùng `formatCalculatedAt` (sibling `ChartViewerShell/`) | đã tồn tại, đã test | viết formatter mới | import cùng feature (hợp lệ); không di chuyển file |
| Tái dùng `resolveHouseSystem` (`model/labels`) cho Badge | đã có fallback `known:false` | bảng nhãn mới trong `ChartList` | một nguồn nhãn hệ nhà |
| `NavLink` cho mục mới | RR hỗ trợ `aria-current` + so khớp tiền tố | helper "isActive" tự viết | bỏ qua mục khác (D-M11-5) |
| Không chuyển trang vào URL | F4 plan Mục 38 dòng 409; mẫu hồ sơ | `?page=` | quay lại từ chi tiết luôn về trang 1 (KG-M11-02) |

## 11. Data Flow

```text
Tính lá số (dialog) ─► POST /charts/natal?save=true ─► 201 ChartResponse
        │  hook: setQueryData(detail) + invalidateQueries(chartKeys.lists())
        ▼
Người dùng bấm nav "Lá số của tôi" (sidebar/drawer — drawer tự đóng)
        ▼  /app/charts  (ProtectedRoute → AppLayout → lazy ChartListPage)
useState(page = 1)
   ├─► useChartsQuery({page, pageSize: 12}) ─► GET /api/v1/charts?page=1&pageSize=12
   │        cache sẵn (stale) ⇒ hiện ngay + refetch ngầm │ chưa có cache ⇒ 6 Skeleton
   └─► useBirthProfilesQuery({page:1, pageSize:100}) ─► GET /api/v1/birth-profiles?page=1&pageSize=100
                 │
                 ▼ useMemo ⇒ ChartProfileLookup { status: loading|error|ready, labelsById: Map(id → fullName ?? label), isComplete: total ≤ items.length }
ChartList: mỗi mục = ngày tính (formatCalculatedAt) · Badge hệ nhà · nhãn hồ sơ (resolver) · "Xem lá số"
        ▼ click
/app/charts/:chartId  (ChartDetailPage; cache `detail` còn ⇒ không GET)
        ▼ Back / nav
/app/charts  (cache list ⇒ hiện ngay, refetch ngầm; trang quay về = 1)
```

---

## 12. Page and ChartList UI Design

**Trang** `pages/app/charts/page.tsx` — `export default function ChartListPage()`:

```text
<Container className="py-8">
  <h1 className="text-display-sm font-semibold">Lá số của tôi</h1>
  {nội dung theo trạng thái (Mục 14)}
</Container>
```

- Không `document.title`/focus effect (nhất quán trang hồ sơ; hạ tầng title thuộc OQ-M8).
- Hằng `PAGE_SIZE = 12` (local), `PROFILE_LOOKUP_PAGE_SIZE = 100`.

**`ChartList`** — `features/chart/ui/ChartList/{ChartList.tsx, ChartListItem.tsx, profileLabel.ts, index.ts, *.test.ts(x)}`:

```ts
export interface ChartProfileLookup {
  status: "loading" | "error" | "ready";
  labelsById: ReadonlyMap<string, string>;
  isComplete: boolean;            // true khi tổng hồ sơ ≤ số hồ sơ đã tải
}
export interface ChartListProps { items: ChartSummary[]; lookup: ChartProfileLookup; className?: string }
```

**Mỗi mục (`Card as="li"` trong `Grid as="ul" role="list"`; cột 1/2/3 như trang hồ sơ):**

| # | Thành phần | Quy tắc |
|---|---|---|
| 1 | Nhãn hồ sơ (`h2`, `truncate`, `title`) | `resolveChartProfileLabel` (Mục 13) |
| 2 | Ngày tính | icon `Calendar` (lucide, như thẻ hồ sơ) + `<time dateTime={calculatedAt}>{formatCalculatedAt(calculatedAt)}</time>` — `vi-VN`, giờ địa phương; ngày **và** giờ để phân biệt nhiều snapshot cùng ngày |
| 3 | Badge hệ nhà | `<Badge variant="outline">` + `resolveHouseSystem(item.houseSystem).labelVi` ("Placidus"/"Whole Sign"); giá trị lạ ⇒ chính chuỗi gốc (không đổi thành hệ nhà khác); không phải chuỗi/rỗng ⇒ "Không rõ" |
| 4 | Hành động | `<Button as={Link} to={`/app/charts/${encodeURIComponent(id)}`} variant="secondary" size="sm" aria-label={template}>Xem lá số</Button>` |

- **Mẫu nhãn truy cập (D-M11-2):** `Xem lá số: {nhãn hồ sơ}, tính lúc {ngày giờ}` — bao gồm cả nhãn fallback nguyên văn (ví dụ `Xem lá số: Hồ sơ đã xoá hoặc không còn, tính lúc 10/10/2026 …`). Tránh "hồ sơ hồ sơ" khi nhãn là "Hồ sơ đã xoá…".
- **Không hiển thị** `chartType`, `isHouseDataAvailable`, `birthProfileLabel` của API (luôn `null`), engine, id.
- **Ngữ nghĩa:** `h2` cho mục (h1 → h2; khác trang hồ sơ dùng h3 — D-M11-8); không nút lồng nút; không `Card interactive` (chỉ nút "Xem lá số" tương tác).
- **Export:** `ChartList` và `ChartListProps`, `ChartProfileLookup` từ `features/chart/index.ts`; **không** export `ChartListItem`/`profileLabel`.

## 13. Profile Label Mapping

**Dựng lookup (page, `useMemo`, deps `[profiles.status, profiles.data]`):**

| `useBirthProfilesQuery` | `ChartProfileLookup` |
|---|---|
| `isLoading` (chưa có dữ liệu) | `{ status: "loading", labelsById: ∅, isComplete: false }` |
| `isError` **và không có `data`** | `{ status: "error", … }` |
| có `data` (kể cả refetch ngầm lỗi) | `{ status: "ready", labelsById: Map(p.id → p.fullName ?? p.label), isComplete: data.total <= data.items.length }` |

`fullName ?? label` đúng quy tắc đã duyệt (ghi chú: `fullName = ""` là falsy nhưng không nullish ⇒ sẽ hiện chuỗi rỗng; không đổi quy tắc đã duyệt — nếu Backend cho phép chuỗi rỗng thì ghi KG, hiện F3 dùng cùng biểu thức).

**`resolveChartProfileLabel(birthProfileId, lookup)` → `{ kind, text }`** (thuần, có test):

| Điều kiện | `kind` | Văn bản hiển thị |
|---|---|---|
| `birthProfileId === null` (hoặc không phải chuỗi) | `deleted` | **Hồ sơ đã xoá hoặc không còn** *(chắc chắn, không cần tra cứu — hiển thị ngay cả khi lookup đang tải)* |
| lookup `loading` | `loading` | Skeleton chữ + chữ ẩn "Đang tải tên hồ sơ…" (không dùng nhãn "đã xoá") |
| lookup `error` | `unavailable` | **Không tải được tên hồ sơ** (đường vào lá số vẫn dùng được) |
| `ready` và có trong Map | `resolved` | nhãn hồ sơ |
| `ready`, **không** có trong Map, `isComplete` | `deleted` | **Hồ sơ đã xoá hoặc không còn** |
| `ready`, **không** có trong Map, `!isComplete` | `unknown` | **Không xác định được hồ sơ** *(đề xuất D-M11-3: tránh gán nhầm "đã xoá" khi có >100 hồ sơ)* |

- **Không** bịa id, không ghép chart với hồ sơ khác; ghép **chỉ** theo `birthProfileId` đúng.
- **Phương án thay thế cho dòng cuối:** nếu owner **không** duyệt D-M11-3 ⇒ hiển thị "Hồ sơ đã xoá hoặc không còn" (đúng nguyên văn yêu cầu) và giữ Known Gap FG-13 đã có. Plan, test (ca A8) và Evidence Matrix ghi rõ phương án nào được chọn.
- **Cách giải quyết nhỏ nhất khác cho FG-13** (nếu muốn đúng tuyệt đối) cần Backend trả `birthProfileLabel` hoặc tra hồ sơ theo id — **ngoài phạm vi M11**, cần quyết định riêng.

## 14. Loading / Error / Empty States

| Trạng thái | Điều kiện | Giao diện |
|---|---|---|
| Loading ban đầu | `charts.isLoading` | `<div role="status" aria-busy="true">` + chữ ẩn "Đang tải danh sách lá số…" + **6** `Skeleton className="h-40 w-full rounded-lg"` trong grid 1/2/3 cột (đúng mẫu hồ sơ) |
| Refetch ngầm (có dữ liệu) | `charts.isFetching && charts.data && !isPlaceholderData` | **giữ nguyên danh sách**, không skeleton (không cờ UI riêng) |
| Đổi trang | `charts.isPlaceholderData` | giữ danh sách trang cũ; `aria-busy="true"` trên vùng danh sách; nút Trước/Sau **disabled** |
| Lỗi tải ban đầu / đổi trang | `charts.isError && !charts.data` | `EmptyState variant="danger"` "Không thể tải danh sách lá số" + mô tả như trang hồ sơ + nút **"Thử lại"** (`charts.refetch()`, `isLoading={charts.isFetching}`); nếu `page > 1` thêm nút "Về trang đầu" (`setPage(1)`) |
| Lỗi refetch khi **đã có** dữ liệu | `charts.isError && charts.data` | giữ danh sách + `Alert variant="warning"` "Không thể cập nhật danh sách" kèm `actions` nút "Thử lại" (không biến lỗi thành danh sách rỗng) |
| Rỗng | `data.total === 0` (và `items=[]`) | `EmptyState` "Bạn chưa có lá số nào" — "Tính lá số từ một hồ sơ sinh để lưu và xem lại tại đây." + `Button as={Link} to="/app/profiles"` "Đến hồ sơ sinh" |
| Trang ngoài phạm vi | `items.length === 0 && data.total > 0 && page > 1` | `EmptyState` "Không còn lá số ở trang này" + nút "Về trang cuối" (`setPage(lastPage)`) — chỉ để nhất quán khi dữ liệu co lại |
| Có dữ liệu | còn lại | `ChartList` + phân trang |
| Hồ sơ lỗi | `profiles` lỗi | **không** chặn danh sách; nhãn từng mục "Không tải được tên hồ sơ" (Mục 13); tuỳ chọn một `Alert warning` có `actions` "Thử lại tên hồ sơ" → `profiles.refetch()` |

Không có `reportError` trong trang (nhất quán trang hồ sơ); lỗi truy vấn không có báo cáo toàn cục (KG-M11-06).

## 15. Pagination

| Mục | Quyết định |
|---|---|
| Trang đầu | `useState(1)` |
| Nhãn | **"Trước"** / **"Sau"** (plan v1.1) — lệch "Trang trước/Trang sau" của F3 (D-M11-1); chỉ số: "Trang {page} / {totalPages}" |
| Hiển thị | `data.total > data.pageSize` (metadata của API, không suy từ số mục) |
| `totalPages` | `Math.max(1, Math.ceil(data.total / data.pageSize))` |
| Trước disabled | `page === 1 \|\| charts.isPlaceholderData` |
| Sau disabled | `page >= totalPages \|\| charts.isPlaceholderData` |
| Trang cuối | Sau disabled; Trước hoạt động |
| Trong khi fetch | **vẫn hiển thị**, bị vô hiệu khi `isPlaceholderData` (chặn bấm liên tiếp) |
| Dữ liệu co lại | trang ngoài phạm vi ⇒ ca "Về trang cuối" (Mục 14) |
| Bọc | `<nav aria-label="Phân trang danh sách lá số">`; tên nút = chữ hiển thị |
| Sau lỗi | muốn đổi trang cần có dữ liệu ⇒ ở trạng thái lỗi chỉ có "Thử lại" (+ "Về trang đầu" khi `page>1`) |
| Cuộn | không xử lý cuộn (ngoài phạm vi) |

## 16. Routing

- **Bằng chứng:** React Router v7 (`react-router-dom ^7.18.2`) xếp hạng route theo độ đặc hiệu, không theo thứ tự khai báo; `charts` (một đoạn tĩnh) và `charts/:chartId` (hai đoạn) không xung đột. **Vẫn khai báo `charts` trước `charts/:chartId`** (yêu cầu bắt buộc và dễ đọc); đúng thứ tự được bảo vệ bằng test, không bằng thứ tự mảng.
- **Thay đổi `app/router.tsx`:** thêm `const ChartListPage = lazy(() => import("@pages/app/charts/page"));` và con của route `app` **ngay trước** `charts/:chartId`: `{ path: "charts", element: <ChartListPage /> }`.
- **Không đổi:** route chi tiết, `ProtectedRoute`, `*`, các route khác.
- **Router test (thêm):** (R-L1) authenticated `/app/charts` ⇒ `h1` "Lá số của tôi" trong `AppLayout`; (R-L2) `/app/charts/<uuid>` vẫn là trang chi tiết (`h1` "Lá số sinh"); (R-L3) `/app/charts/abc` vẫn vào trang chi tiết (not-found trong trang), **không** vào trang danh sách; (R-L4) unauthenticated `/app/charts` ⇒ chuyển tới đăng nhập với `redirect` đúng; (R-L5) Suspense fallback trước khi trang lazy tải.

## 17. Navigation

**Mục mới:** "Lá số của tôi" → `/app/charts`, đặt **sau "Hồ sơ sinh"**, trước "Cài đặt"; icon `Orbit` (lucide-react; đề xuất D-M11-7).

| Hạng mục | Thiết kế |
|---|---|
| Thành phần | `NavLink` (react-router-dom) thay vì `Link` — chỉ cho mục mới |
| Active | `NavLink` so khớp tiền tố mặc định (`end=false`) ⇒ active ở `/app/charts` **và** `/app/charts/:chartId`, không active ở `/app/profiles`; tự đặt `aria-current="page"`; `className` dạng hàm: `isActive` thêm `bg-surface-raised font-medium` (token có sẵn) |
| Sidebar | trong `<nav aria-label="Điều hướng chính">`, nhãn ẩn khi `sidebarCollapsed` như mục khác (khuyết tật tên truy cập khi thu gọn có sẵn — KG-M11-05) |
| Drawer | trong `<nav aria-label="Điều hướng chính (Mobile)">`; `onClick={() => setMobileDrawerOpen(false)}` (đúng mẫu "Hồ sơ sinh"; `useUiStore` có sẵn) |
| Không làm | không retrofit active state cho mục khác; không refactor sang mảng cấu hình; không đổi `<a href="/">` |

**AppLayout test (chỉ thêm, không sửa kỳ vọng cũ):** (L1) sidebar có link "Lá số của tôi" `href="/app/charts"`; (L2) drawer có link tương tự; (L3) click sidebar ⇒ chuyển tới route `/app/charts`; (L4) click drawer ⇒ chuyển **và** `useUiStore.getState().mobileDrawerOpen === false`; (L5) tại `/app/charts` link có `aria-current="page"`; (L6) tại `/app/charts/<uuid>` cũng `aria-current="page"`; (L7) tại `/app/profiles` link "Lá số của tôi" **không** active; (L8) mục "Hồ sơ sinh" cũ vẫn đúng. Helper `renderWithRoute` được **mở rộng thêm** một `Route path="/app/charts"` (thêm, không đổi hành vi cũ) hoặc dùng helper riêng.

## 18. Query Invalidation

**Kết luận audit: đã đúng, không cần sửa FE-S4.1/S4.3.** `useCreateNatalChartMutation.onSuccess` seed `detail` rồi `invalidateQueries({ queryKey: chartKeys.lists() })` — đúng phạm vi (chỉ họ `["charts","list"]`, không đụng `detail`, không `all()`, không `birthProfileKeys`).

| Tình huống | Kết quả mong đợi | Bằng chứng |
|---|---|---|
| Danh sách từng mở, giờ ở `/app/profiles`, tính chart, vào lại danh sách | hiện cache cũ **ngay**, refetch ngầm (stale + invalidated), mục mới xuất hiện không cần reload | test IT-1 |
| Danh sách chưa từng mở | tải mới (skeleton) có chart mới | test IT-2 |
| Quay lại từ chi tiết | cache hiện ngay + refetch ngầm; không skeleton | test IT-3 |
| Danh sách đang mở khi tạo chart (hiếm) | refetch ngay do invalidation | test hook (Mục 26) |
| Trang >1 đang giữ cache | mọi trang `["charts","list",…]` bị invalidate cùng lúc | test hook |

M11 **không** thêm cơ chế invalidation nào, không `refetchOnMount: "always"`, không `staleTime` mới. Nếu test IT-1/IT-2 phát hiện lỗi thật ⇒ chỉnh **trong** `useCreateNatalChartMutation` (thuộc S4.1/S4.3) và ghi vào Evidence Matrix như "Existing defect fixed within bounded scope".

## 19. State Ownership

| State / Data | Chủ sở hữu | Lý do |
|---|---|---|
| Trang hiện tại | `useState` trong `ChartListPage` | điều hướng cục bộ của trang |
| Danh sách chart | TanStack Query (`useChartsQuery`) | server state + cache |
| Hồ sơ sinh | TanStack Query (`useBirthProfilesQuery`) | server state + cache |
| Lookup nhãn | **dẫn xuất** (`useMemo`) | ánh xạ từ kết quả query; không sao chép vào state |
| Loading/error | trạng thái query | tránh trùng lặp |
| Drawer mở/đóng | **`useUiStore` (Zustand) sẵn có** trong `AppLayout` | tái dùng; **không** thêm store (đính chính bảng mẫu: không phải `useState` của AppLayout) |
| Sidebar thu gọn | `useUiStore` sẵn có | không đổi |
| Active nav | dẫn xuất từ URL (`NavLink`) | không state |

Không Zustand/Redux/Context mới; không event bus; không sao chép dữ liệu query vào state.

## 20. API Contract Matrix

| Concern | API / Hook | Request / Field | Consumer | Risk |
|---|---|---|---|---|
| Danh sách chart | `listCharts` → `GET /api/v1/charts` | **chỉ** `page`, `pageSize` (không user id, không `birthProfileId/sortBy/order`) | `ChartListPage` | metadata phân trang sai ⇒ test; thứ tự không tie-breaker (R-14) |
| Phản hồi | `ListChartsResponse` | `items[]{id, birthProfileId|null, birthProfileLabel(null), houseSystem, calculatedAt}`, `total`, `page`, `pageSize` | `ChartList`, phân trang | `houseSystem` chuỗi tự do ⇒ fallback |
| Cache chart | `chartKeys.lists()`, `list({page,pageSize})` | `["charts","list",{page,pageSize}]` | mutation (invalidate), `useChartsQuery` | invalidate sai phạm vi ⇒ test |
| Hồ sơ | `useBirthProfilesQuery` → `GET /api/v1/birth-profiles` | `page=1`, `pageSize=100` | lookup nhãn | >100 hồ sơ (R-3); lỗi (R-4) |
| DTO hồ sơ | `BirthProfile` | `id`, `fullName|null`, `label` | `Map(id → fullName ?? label)` | `fullName` rỗng ≠ nullish |
| Chi tiết chart | route/API hiện có | `/app/charts/:chartId` (`GET /api/v1/charts/:id`) | nút "Xem lá số" | id luôn UUID từ Backend; `encodeURIComponent` |
| Auth | `apiClient` interceptor | Bearer + refresh 401 | cả hai query | 401 ⇒ `ProtectedRoute` |
| Tạo chart (tiền đề) | `useCreateNatalChartMutation` | `POST /charts/natal?save=true` | dialog (không đổi) | invalidate đã đúng |

## 21. UI State Matrix

| Scenario | Chart Query | Profile Query | Expected UI |
|---|---|---|---|
| Initial load | Loading | Loading | 6 Skeleton (`role=status`); chưa có lỗi |
| Chart error (khởi tạo) | Error, không data | Any | `EmptyState danger` + "Thử lại" (+ "Về trang đầu" nếu `page>1`) |
| Empty | Success, `total=0` | Any | Empty + liên kết `/app/profiles` (không chờ hồ sơ) |
| Populated | Success, data | Success (đủ) | Danh sách + nhãn hồ sơ |
| Populated, hồ sơ đang tải | Success, data | Loading | Danh sách; nhãn mục có `birthProfileId` = chữ tải; mục `null` = "đã xoá" |
| Profile lookup failure | Success, data | Error | Danh sách dùng được; nhãn "Không tải được tên hồ sơ" |
| Missing profile | Success, data | Success (đủ), id không có | "Hồ sơ đã xoá hoặc không còn" |
| Missing profile, lookup chưa đủ | Success, data | Success, `total > items.length` | "Không xác định được hồ sơ" (D-M11-3) |
| Null `birthProfileId` | Success, data | Any | "Hồ sơ đã xoá hoặc không còn" |
| Đổi trang | Fetching (`isPlaceholderData`) | Any | giữ trang cũ; Trước/Sau disabled |
| Refetch ngầm | Fetching, có cache | Any | giữ danh sách; không skeleton |
| Refetch lỗi, có cache | Error, có data | Any | giữ danh sách + Alert warning "Thử lại" |
| Trang ngoài phạm vi | Success, `items=[]`, `total>0` | Any | "Về trang cuối" |
| `houseSystem` lạ | Success | Any | Badge hiện chuỗi gốc, không đổi thành hệ nhà khác |

## 22. Route / Navigation Matrix

| Mục | Điều kiện | Kết quả |
|---|---|---|
| Route danh sách | `/app/charts` | `ChartListPage` (lazy) trong `AppLayout` sau `ProtectedRoute` |
| Route chi tiết | `/app/charts/:chartId` | `ChartDetailPage` (không đổi) |
| `/app/charts/abc` | id sai | vẫn là trang chi tiết (not-found trong trang), không phải danh sách |
| Chưa đăng nhập | `/app/charts` | chuyển tới đăng nhập (`redirect` an toàn) |
| Nav desktop | sidebar | "Lá số của tôi" → `/app/charts` |
| Nav mobile | drawer | như trên + đóng drawer khi bấm |
| Active | `/app/charts`, `/app/charts/:id` | `aria-current="page"` + style active |
| Không active | `/app/profiles`, `/app` | không |
| Drawer | mở/đóng bằng `useUiStore` | mục mới đóng drawer; overlay/nút X như cũ |
| Mục cũ | Hồ sơ sinh, Bảng điều khiển, Cài đặt | không đổi |

---

## 23. Implementation Task Breakdown

Thứ tự: **M11.0 → M11.1 → M11.2 → M11.3 → (M11.4 ∥ từ M11.1) → M11.5 → M11.6**.

### F4-M11.0 — Cổng xác nhận (không mã)
Owner xác nhận (hoặc chấp nhận mặc định) D-M11-1…D-M11-3, D-M11-7, D-M11-10 (Mục 31). Chặn: copy trong M11.1/M11.2, tên spec E2E.

### F4-M11.1 — ChartList Feature
1. **Objective:** `ChartList`/`ChartListItem` + `resolveChartProfileLabel`. 2. **Why:** trình bày thuần, tái dùng được, test được tách khỏi trang. 3. **Preconditions:** M11.0; S4.1/S4.3 (đã xác minh). 4. **Inspect:** `profiles/page.tsx` (Card/Grid), `Badge`, `Button`, `model/labels.ts`, `ChartViewerShell/formatCalculatedAt.ts`, `types.ts`. 5. **Change:** tạo `features/chart/ui/ChartList/{ChartList.tsx,ChartListItem.tsx,profileLabel.ts,index.ts,ChartList.test.tsx,profileLabel.test.ts}`. 6. **Steps:** (a) kiểu `ChartProfileLookup`; (b) resolver + test; (c) `ChartListItem` (nhãn, `time`, `Badge`, `Button as={Link}`, `aria-label` theo mẫu); (d) `ChartList` (`Grid as="ul"`, `Card as="li"`); (e) test. 7. **State:** không (thuần). 8. **API:** không. 9. **Tests:** nhóm A (Mục 27). 10. **Verify:** `npx vitest run src/features/chart/ui/ChartList`; `npm run typecheck`; `npm run lint`. 11. **Acceptance:** AC-1…AC-8 (Mục 33). 12. **Dependencies:** M11.0. 13. **Out of scope:** trang, phân trang, route, nav.

### F4-M11.2 — Saved Charts Page
1. **Objective:** `ChartListPage` với state, hai query, lookup, các trạng thái, phân trang. 3. **Preconditions:** M11.1. 4. **Inspect:** `profiles/page.tsx`, `useChartsQuery`, `useBirthProfilesQuery`, `EmptyState`, `Alert`, `Skeleton`, mocks. 5. **Change:** tạo `pages/app/charts/page.tsx`, `page.test.tsx`. 6. **Steps:** (a) `useState(page)`; (b) `useChartsQuery({page,pageSize:12})`; (c) `useBirthProfilesQuery({page:1,pageSize:100})`; (d) `useMemo` lookup; (e) nhánh trạng thái (Mục 14, thứ tự: loading → lỗi không data → rỗng → ngoài phạm vi → danh sách); (f) phân trang (Mục 15); (g) test. 7. **State:** `page` cục bộ; còn lại dẫn xuất. 8. **API:** `GET /charts`, `GET /birth-profiles`. 9. **Tests:** nhóm B. 10. **Verify:** `npx vitest run src/pages/app/charts/page.test.tsx`. 11. **Acceptance:** AC-1…AC-16. 12. **Dependencies:** M11.1. 13. **Out of scope:** route/nav/E2E; filter/sort/search/xoá.

### F4-M11.3 — Routing and Public Exports
1. **Objective:** đăng ký route lazy và export `ChartList`. 3. **Preconditions:** M11.2. 4. **Inspect:** `app/router.tsx`, `router.test.tsx`, `features/chart/index.ts`. 5. **Change:** sửa `app/router.tsx`; **thêm** test vào `app/router.test.tsx`; sửa `features/chart/index.ts` (thêm `ChartList`, `ChartListProps`, `ChartProfileLookup`). 6. **Steps:** (a) `lazy` import; (b) route `charts` trước `charts/:chartId`; (c) export; (d) test R-L1…R-L5. 7. **State:** không. 8. **API:** MSW cho `GET /charts` trong test. 9. **Tests:** nhóm F. 10. **Verify:** `npx vitest run src/app/router.test.tsx`. 11. **Acceptance:** AC-17, AC-18. 12. **Dependencies:** M11.2. 13. **Out of scope:** sửa route khác.

### F4-M11.4 — Navigation Item
1. **Objective:** "Lá số của tôi" ở sidebar + drawer, active, đóng drawer. 3. **Preconditions:** chỉ cần đường dẫn `/app/charts` (có thể làm song song với M11.1–M11.3; test điều hướng đầy đủ cần route ở M11.3 nên kiểm bằng helper riêng). 4. **Inspect:** `widgets/app-layout/{index.tsx,AppLayout.test.tsx}`, `useUiStore`, `Link`/`NavLink`. 5. **Change:** sửa `widgets/app-layout/index.tsx`; **thêm** test vào `AppLayout.test.tsx`. 6. **Steps:** (a) import `NavLink`, `Orbit`; (b) mục sidebar; (c) mục drawer + `onClick` đóng; (d) style active qua `className` hàm; (e) test L1…L8. 7. **State:** `useUiStore` sẵn có. 8. **API:** không. 9. **Tests:** nhóm E. 10. **Verify:** `npx vitest run src/widgets/app-layout`. 11. **Acceptance:** AC-19…AC-21. 12. **Dependencies:** M11.0 (D-M11-5/7). 13. **Out of scope:** retrofit active cho mục khác, refactor mảng cấu hình, sửa tên truy cập khi thu gọn.

### F4-M11.5 — Query Invalidation and Integration
1. **Objective:** chứng minh chart mới xuất hiện trong danh sách; không đổi mutation (trừ khi test phát hiện lỗi). 3. **Preconditions:** M11.2, M11.3, M11.4. 4. **Inspect:** `useCreateNatalChartMutation`, `chart-flow.integration.test.tsx` (mẫu), `routesConfig`. 5. **Change:** tạo `src/app/saved-charts-flow.integration.test.tsx`; thêm một test vào `hooks/useChartsQuery.test.tsx`. 6. **Steps:** (a) store MSW có trạng thái cho `GET /charts` (mảng + `POST` đẩy mục mới); (b) IT-1/IT-2/IT-3; (c) test hook về invalidation. 7. **State:** không. 8. **API:** MSW `GET/POST`. 9. **Tests:** nhóm C, D. 10. **Verify:** `npx vitest run src/app/saved-charts-flow.integration.test.tsx src/features/chart/hooks`. 11. **Acceptance:** AC-22. 12. **Dependencies:** M11.2–M11.4. 13. **Out of scope:** sửa tầng dữ liệu nếu không có lỗi.

### F4-M11.6 — E2E Two-Account Isolation, Regression, Quality Gates
1. **Objective:** E2E hai tài khoản + hồi quy + cổng chất lượng + Evidence Matrix. 3. **Preconditions:** M11.5. 4. **Inspect:** `e2e/birth-profile.spec.ts`, `playwright.config.ts`, `frontend-ci.yml`. 5. **Change:** tạo `frontend/e2e/chart-list.spec.ts`; Evidence Matrix khi đóng. 6. **Steps:** Mục 29. 9. **Tests:** nhóm G. 10. **Verify:** Mục 30. 11. **Acceptance:** AC-23…AC-26. 12. **Dependencies:** M11.5. 13. **Out of scope:** sửa Backend (nếu lộ lỗi cô lập ⇒ **blocker/Backend task riêng**).

## 24. Task Dependencies

```text
M11.0 ─► M11.1 ─► M11.2 ─► M11.3 ─┐
   └────────────► M11.4 ───────────┼─► M11.5 ─► M11.6
```
Không có phụ thuộc vòng. M11.4 độc lập với M11.1–M11.3 (chỉ dùng đường dẫn).

## 25. File Change Map

| File / Directory | Action | Purpose | Task | Confidence |
|---|---|---|---|---|
| `frontend/src/pages/app/charts/page.tsx` | **Create** (xác nhận **chưa tồn tại**; `pages/app/charts/detail/` đã có) | `ChartListPage` | M11.2 | Cao |
| `frontend/src/pages/app/charts/page.test.tsx` | Create | test trang (nhóm B) | M11.2 | Cao |
| `frontend/src/features/chart/ui/ChartList/{ChartList.tsx,ChartListItem.tsx,profileLabel.ts,index.ts}` | Create | UI danh sách + resolver nhãn | M11.1 | Cao |
| `frontend/src/features/chart/ui/ChartList/{ChartList.test.tsx,profileLabel.test.ts}` | Create | nhóm A | M11.1 | Cao |
| `frontend/src/features/chart/index.ts` | Modify (có sẵn) | export `ChartList` + 2 kiểu | M11.3 | Cao |
| `frontend/src/app/router.tsx` | Modify (có sẵn) | lazy route `charts` trước `charts/:chartId` | M11.3 | Cao |
| `frontend/src/app/router.test.tsx` | Modify (có sẵn; chỉ **thêm**) | R-L1…R-L5 | M11.3 | Cao |
| `frontend/src/widgets/app-layout/index.tsx` | Modify (có sẵn) | mục nav ở sidebar + drawer | M11.4 | Cao |
| `frontend/src/widgets/app-layout/AppLayout.test.tsx` | Modify (có sẵn; chỉ **thêm**) | L1…L8 | M11.4 | Cao |
| `frontend/src/features/chart/hooks/useChartsQuery.test.tsx` | Modify (có sẵn; thêm 1 test) | tương thích invalidation | M11.5 | Cao |
| `frontend/src/app/saved-charts-flow.integration.test.tsx` | Create | IT-1…IT-3 | M11.5 | Cao |
| `frontend/e2e/chart-list.spec.ts` | Create | E2E hai tài khoản | M11.6 | Trung bình (phụ thuộc engine trong CI — R-12) |
| `docs/implementation/archive/sprint-f4/Sprint_F4_M11_Exit_Criteria_Evidence_Matrix.md` | Create (cuối) | hồ sơ đóng | M11.6 | Cao |

**Chỉ đọc (không sửa):** `features/chart/api/*` (gồm `listCharts`, mocks), `hooks/useChartsQuery.ts`, `hooks/useCreateNatalChartMutation.ts`, `hooks/query-keys.ts`, `model/**`, `ChartViewerShell/formatCalculatedAt.ts`, `features/birth-profile/**`, `shared/ui/**`, `shared/stores/uiStore.ts`, `shared/api/**`, `src/test/**`, `backend/**`, `package.json`, cấu hình ESLint/TS/Vite/CI/Playwright.

---

## 26. Test Strategy

Khung hiện có: Vitest + Testing Library + MSW (`onUnhandledRequest:"error"`) + `vitest-axe` (đã cài; matcher đăng ký ở `src/test/setup.ts`) + Playwright. **Không thêm dependency.** Dùng `renderWithProviders`, `mockListCharts`/`listChartsSuccess` (nhớ `pageSize: 12`), `mockListBirthProfiles`/`mockBirthProfile`, `chartSummaryFixtures`.

- **Ngày giờ:** không hard-code chuỗi ngày (phụ thuộc múi giờ/ICU); khẳng định bằng `formatCalculatedAt(iso)` (kỳ vọng tính bằng hàm đã được test riêng) **và** `<time dateTime={iso}>` (xác định). Dùng timestamp giữa ngày UTC.
- **Phân trang:** `listChartsSuccess({ total: 13, pageSize: 12 })` để vượt ngưỡng; kiểm request bằng bộ đếm trong resolver MSW (`url.searchParams`), khẳng định tập khoá **đúng** `{page, pageSize}`.
- **Cô lập frontend:** unit/tích hợp chỉ chứng minh *frontend không gửi user id*; cô lập thật chứng minh bằng E2E.
- **Test cũ:** không sửa/xoá; chỉ thêm. Chạy toàn bộ suite trước/sau (baseline 98 file / 619 test).

## 27. Test Matrix

**A. `ChartList.test.tsx` + `profileLabel.test.ts`**

| ID | Kịch bản | Kỳ vọng |
|---|---|---|
| A1 | mỗi mục | link "Xem lá số" có `href="/app/charts/{id}"` |
| A2 | ngày tính | `<time dateTime>` đúng ISO; chữ = `formatCalculatedAt(iso)` |
| A3 | `Placidus`, `WholeSign` | Badge "Placidus" / "Whole Sign" |
| A4 | `houseSystem` lạ (`"Koch"`) / rỗng | chữ gốc `Koch` / "Không rõ"; **không** thành Placidus |
| A5 | resolver: `fullName` có / null | `fullName` ưu tiên; `fullName=null` ⇒ `label` |
| A6 | `birthProfileId=null` | "Hồ sơ đã xoá hoặc không còn" (cả khi lookup `loading`) |
| A7 | id không có trong Map, `isComplete` | "Hồ sơ đã xoá hoặc không còn" |
| A8 | id không có, `!isComplete` | "Không xác định được hồ sơ" *(hoặc "đã xoá" nếu D-M11-3 không được duyệt)* |
| A9 | lookup `loading` + id không null | chữ tải, **không** có "đã xoá" |
| A10 | lookup `error` | "Không tải được tên hồ sơ"; link vẫn dùng được |
| A11 | `aria-label` | = `Xem lá số: {nhãn}, tính lúc {ngày giờ}` cho từng nhánh nhãn (kể cả fallback) |
| A12 | cấu trúc | `list`/`listitem`, `h2` mỗi mục, link role `link`, không nút lồng nhau |
| A13 | `axe` | không vi phạm |
| A14 | nội dung cấm | không hiện `chartType`/`isHouseDataAvailable`/id/engine |
| A15 | danh sách rỗng (component) | không render item |

**B. `pages/app/charts/page.test.tsx`**

| ID | Kịch bản | Kỳ vọng |
|---|---|---|
| B1 | đang tải | đúng **6** skeleton, `role=status` |
| B2 | lỗi ban đầu | "Không thể tải danh sách lá số" + "Thử lại"; bấm ⇒ gọi lại và hiển thị danh sách |
| B3 | lỗi ở `page>1` | có "Về trang đầu" ⇒ quay về trang 1 |
| B4 | rỗng (`total=0`) | EmptyState + link `/app/profiles`; không chờ hồ sơ |
| B5 | có dữ liệu | đủ mục, thứ tự theo API, `h1` "Lá số của tôi" |
| B6 | request chart | tập khoá `{page,pageSize}` = `{1,12}`; **không** user id/`birthProfileId`/`sortBy` |
| B7 | request hồ sơ | `page=1`, `pageSize=100` |
| B8 | `total=12` / `total=13` | không có / có phân trang |
| B9 | bấm "Sau" | request `page=2`; "Trang 2 / 2"; "Sau" disabled; "Trước" enabled |
| B10 | đang đổi trang | danh sách trang cũ còn; hai nút disabled |
| B11 | trang đầu | "Trước" disabled |
| B12 | hồ sơ lỗi (500) | danh sách vẫn hiện, nhãn "Không tải được tên hồ sơ"; liên kết dùng được |
| B13 | hồ sơ đang tải (trì hoãn) | **không** hiện "đã xoá" cho mục có id; mục `null` vẫn "đã xoá" |
| B14 | hồ sơ có `fullName`/chỉ `label` | nhãn đúng quy tắc |
| B15 | refetch lỗi khi có cache | giữ danh sách + Alert warning "Thử lại" |
| B16 | trang ngoài phạm vi (`items=[]`, `total>0`, `page=2`) | "Về trang cuối" |
| B17 | `houseSystem` lạ | Badge chữ gốc, trang không lỗi |
| B18 | ngày | `formatCalculatedAt` ổn định qua render lặp |

**C. Hook (`useChartsQuery.test.tsx`, thêm 1 test):** (C1) `invalidateQueries(chartKeys.lists())` làm observer đang mount với `{page:1,pageSize:12}` refetch đúng một lần và nhận dữ liệu mới. *(Các ca params/key/lỗi đã có: 2 test hiện tại — không nhân bản.)*

**D. `saved-charts-flow.integration.test.tsx` (`routesConfig`, store `authenticated`, MSW có trạng thái)**

| ID | Kịch bản | Kỳ vọng |
|---|---|---|
| IT-1 | mở `/app/charts` (1 mục) → nav "Hồ sơ sinh" → "Tính lá số" → submit (`POST` 201, đẩy mục mới vào store) → viewer → nav "Lá số của tôi" | danh sách hiện **2** mục, mục mới trước; không reload; có refetch |
| IT-2 | bắt đầu ở `/app/profiles` (chưa từng mở danh sách) → tính → nav "Lá số của tôi" | có chart mới (tải mới) |
| IT-3 | từ danh sách → "Xem lá số" → viewer → Back | danh sách hiện ngay từ cache (không skeleton), refetch ngầm |

**E. `AppLayout.test.tsx`:** L1…L8 (Mục 17). **F. `router.test.tsx`:** R-L1…R-L5 (Mục 16). **G. E2E:** Mục 29.

## 28. Regression Matrix

| Vùng | Rủi ro | Kiểm bằng |
|---|---|---|
| Trang hồ sơ | không đổi | `profiles/page.test.tsx` (11 + 5 test M3) nguyên vẹn |
| Route chi tiết chart | route mới làm lệch khớp | R-L2, R-L3 + test M3 R1–R5 |
| Luồng Calculate Chart | không đổi | `chart-flow.integration.test.tsx` I1–I3, dialog D1–D15 |
| Invalidation hiện có | không đổi | test mutation M1 (5 test) + IT-1/IT-2 |
| Navigation hiện có | thêm mục có thể làm hỏng tìm kiếm theo vai trò | 9 test `AppLayout` cũ **nguyên vẹn**; test mới chỉ thêm |
| Protected routes | route mới nằm trong nhóm `app` | R-L4 + test router cũ |
| Test cũ | | toàn bộ suite: ≥ 619 + mới, 0 thất bại |
| E2E cũ | nút/mục nav mới | `birth-profile.spec.ts`: selector `link "Sửa"`, `button "Xóa"`; nav mới là `link` tên "Lá số của tôi" (không chứa "Sửa") — chạy trên CI |
| Cô lập chéo tài khoản | rò dữ liệu | E2E mục 29 |
| Typecheck/lint/format/build | | cổng Mục 30 |

## 29. E2E Two-Account Isolation

**Tệp:** `frontend/e2e/chart-list.spec.ts` (không dùng tên `chart.spec.ts` để chừa cho FE-S4.10; D-M11-10). Mẫu: `birth-profile.spec.ts` (`describe.configure({ mode: "serial" })`, đăng ký/đăng nhập bằng UI, mock `/api/v1/locations/search`). Backend thật + Postgres trong CI (đã có).

**Danh tính tách biệt (bằng chứng không "đổi mock"):** hai `browser.newContext()` riêng (`ctxA`, `ctxB`) ⇒ không chung `localStorage`/cookie; **hai email duy nhất** (`e2e-cl-a-${Date.now()}@test.local`, `…-b-…`); mỗi người dùng đăng ký và đăng nhập **riêng** qua giao diện. Test khẳng định thêm: `GET /api/v1/charts` của A trả `total = 1` và `items[0].id = chartId`, còn của B trả `total = 0`, `items = []` (đọc từ phản hồi mạng bằng `page.waitForResponse`, không chỉ từ DOM) ⇒ lọc diễn ra ở **Backend**.

| Bước | Hành động | Khẳng định |
|---|---|---|
| 1 | A đăng ký + đăng nhập (`ctxA`) | URL `**/app` |
| 2 | A tạo hồ sơ (`Hồ sơ A`, có giờ sinh; mock location) | thẻ hiện trong danh sách hồ sơ |
| 3 | A bấm "Tính lá số" → dialog → "Tính lá số" | điều hướng `**/app/charts/{uuid}`; lưu `chartId` từ URL |
| 4 | A bấm nav "Lá số của tôi" | URL `**/app/charts`; mục có nhãn `Hồ sơ A`, Badge "Placidus", link `Xem lá số` tới `chartId`; phản hồi mạng `total=1` |
| 5 | A bấm "Xem lá số" | URL `…/app/charts/{chartId}` |
| 6 | B đăng ký + đăng nhập (`ctxB`) | URL `**/app` |
| 7 | B mở `/app/charts` | EmptyState "Bạn chưa có lá số nào"; **không** có link tới `chartId` của A; phản hồi mạng `total=0`, `items=[]`; request **không** chứa user id |
| 8 | *(tăng cường)* B mở trực tiếp `/app/charts/{chartId của A}` | trang "Không tìm thấy lá số" (Backend `403`), không hiển thị dữ liệu của A |
| 9 | dọn dẹp | đóng hai context |

- **Không đổi Backend.** Nếu bước 7/8 lộ rò rỉ ⇒ **blocker/Backend task riêng**, không sửa trong M11.
- **Phụ thuộc môi trường:** E2E gọi engine tính chart thật trong CI frontend (chưa có tiền lệ ở `e2e/`) — nếu thất bại do môi trường (ephemeris/timezone) ⇒ báo cáo, không đoán mò (R-12). Chạy cục bộ: `npx playwright test e2e/chart-list.spec.ts` (hoặc `npm run test:e2e`).

## 30. Quality Gates

Lệnh có trong `frontend/package.json` (đã xác nhận):

| Lệnh | Mục đích | Khi chạy |
|---|---|---|
| `npx vitest run <đường dẫn>` | phản hồi nhanh | mỗi bước/task |
| `npm run typecheck` (`tsc -p tsconfig.app.json --noEmit`) | cổng kiểm kiểu thật | cuối **mỗi task** |
| `npm run lint` | ESLint | cuối mỗi task |
| `npm run format:check` | Prettier (`npm run format` để sửa) | cuối mỗi task |
| `npm test` | toàn bộ test (`--passWithNoTests`) | cuối M11.5 và M11.6 |
| `npm run test:coverage` | CI chạy lệnh này | M11.6 |
| `npm run build` | `tsc` + `vite build` | M11.6 |
| `npm run test:e2e` (`playwright test`) | E2E (cần Backend + Postgres) | **CI** + cục bộ khi đã chạy Backend |

**Trước khi hoàn tất tích hợp (M11.5):** `typecheck`, `lint`, `format:check`, `npm test` exit 0, không giảm số test cũ (baseline 98 file / 619 test).
**Trước khi đóng M11 (M11.6):** thêm `test:coverage`, `build`, E2E xanh trong CI **trên đúng commit cuối** (một job `build` của Frontend CI chạy cả E2E), cùng các grep:

```bash
cd frontend/src
grep -rnE "features/birth-profile" features/chart                         # rỗng: không import chéo
grep -rnE "from \"@pages|from \"@app" features/chart                      # rỗng
grep -rnE "zustand|createContext|useReducer" features/chart/ui/ChartList pages/app/charts/page.tsx   # rỗng
grep -rnE "fetch\(|axios\.create" features/chart/ui/ChartList pages/app/charts/page.tsx              # rỗng
grep -rnE "userId|user_id|chartType|isHouseDataAvailable" features/chart/ui/ChartList pages/app/charts/page.tsx  # rỗng
grep -rnE "as unknown as|: any|eslint-disable" features/chart/ui/ChartList pages/app/charts/page.tsx # rỗng (code production)
```

Mình **chưa chạy** bất kỳ test M11 nào (chưa tồn tại); các số liệu ở Mục 1/3 là baseline.

## 31. Risks and Mitigations

| ID | Rủi ro | Khả năng | Tác động | Giảm thiểu | Chặn? |
|---|---|---|---|---|---|
| R-1 | FE-S4.1/S4.3 chưa đủ | Rất thấp | Cao | **Đã xác minh** (Mục 5) | Không |
| R-2 | Metadata phân trang khác giả định | Thấp | TB | dùng `total/pageSize` của response; test B8–B11 | Không |
| R-3 | >100 hồ sơ ⇒ nhãn "đã xoá" sai | TB (tài khoản lớn) | TB | `isComplete` + nhãn trung tính (D-M11-3); FG-13 | Không (cần duyệt) |
| R-4 | Hồ sơ lỗi trong khi chart OK | TB | Thấp | nhãn "Không tải được tên hồ sơ"; danh sách không bị chặn; B12 | Không |
| R-5 | Danh sách cache không cập nhật sau khi tính | Thấp | Cao | invalidation đã đúng; IT-1/IT-2/C1 | Không |
| R-6 | Xung đột thứ tự route | Rất thấp | TB | RR xếp hạng theo độ đặc hiệu; R-L2/R-L3 | Không |
| R-7 | Active không đúng ở `/app/charts/:id` | Thấp | Thấp | `NavLink` tiền tố; L5–L7 | Không |
| R-8 | Drawer không đóng | Thấp | TB | `onClick` đóng; L4 | Không |
| R-9 | Lệch ngày do múi giờ | Thấp | Thấp | `calculatedAt` là timestamp đầy đủ (không date-only); test không ghim chuỗi | Không |
| R-10 | `Button as={Link}` không hỗ trợ | **Đã loại trừ** | — | `as?: ElementType`, `to` có sẵn | Không |
| R-11 | Test cũ gắn chặt danh sách nav | Thấp | TB | 9 test cũ truy vấn `a[href="/app/profiles"]` theo landmark; chỉ thêm test | Không |
| R-12 | E2E gọi engine tính chart lần đầu trong CI frontend; cô lập danh tính sai | TB / Thấp | Cao | hai `newContext`, hai email, khẳng định từ phản hồi mạng; nếu hỏng do môi trường ⇒ báo cáo | Không (theo dõi) |
| R-13 | `useBirthProfilesQuery` thêm một request mỗi lần vào trang | Cao | Thấp | chấp nhận (cache khoá riêng, refetch khi mount) | Không |
| R-14 | Backend không có tie-breaker ⇒ thứ tự không ổn định giữa trang khi trùng `calculated_at` | Thấp | Thấp | ghi nhận KG-M11-07; không sửa Backend | Không |
| R-15 | Khuyết tật tên truy cập khi sidebar thu gọn | Có sẵn | Thấp | báo cáo, không sửa | Không |
| R-16 | Phình phạm vi (lọc/sắp xếp/xoá/hiển thị `chartType`) | TB | TB | Out of Scope rõ; grep Mục 30 | Không |
| R-17 | `fullName` rỗng ⇒ nhãn trống | Thấp | Thấp | giữ quy tắc đã duyệt; ghi chú | Không |

**Quyết định (D-M11):**

| ID | Quyết định | Trạng thái |
|---|---|---|
| D-M11-1 | Nhãn phân trang "Trước"/"Sau" (plan v1.1) thay "Trang trước/Trang sau" của F3 | Mặc định áp dụng |
| D-M11-2 | Ngày hiển thị = `formatCalculatedAt` (ngày + giờ); mẫu `aria-label`: `Xem lá số: {nhãn}, tính lúc {ngày giờ}` | Mặc định áp dụng |
| D-M11-3 | `!isComplete` + id thiếu ⇒ "Không xác định được hồ sơ" thay vì "đã xoá" | **Cần owner duyệt** (đổi so với yêu cầu gốc); mặc định nếu không phản hồi: **giữ yêu cầu gốc** + FG-13 |
| D-M11-4 | Nhãn khi lookup loading/error: chữ tải / "Không tải được tên hồ sơ"; `null` luôn "đã xoá" | Mặc định áp dụng |
| D-M11-5 | `NavLink` chỉ cho mục mới; không retrofit mục khác | Mặc định áp dụng |
| D-M11-6 | Đóng drawer bằng `onClick` từng mục (mẫu hiện có) | Mặc định áp dụng |
| D-M11-7 | Icon `Orbit` (lucide) | Đề xuất — owner chọn |
| D-M11-8 | `h2` cho nhãn mục | Mặc định áp dụng |
| D-M11-9 | Lỗi ở `page>1` có "Về trang đầu"; lỗi refetch có cache ⇒ Alert, không thay danh sách | Mặc định áp dụng |
| D-M11-10 | E2E ở `chart-list.spec.ts`, hai `newContext` | Mặc định áp dụng |

## 32. Known Gaps / Technical Debt

| ID | Vấn đề | Phân loại |
|---|---|---|
| FG-13 | Tài khoản >100 hồ sơ: ghép nhãn client không đủ; sửa đúng cần Backend trả `birthProfileLabel` | Known Gap — defer / **Separate Backend task** |
| KG-M11-01 | Không có `document.title` riêng cho trang danh sách (nhất quán trang hồ sơ; hạ tầng title thuộc OQ-M8) | Known Gap — defer |
| KG-M11-02 | Trang hiện tại không nằm trong URL ⇒ quay lại từ chi tiết về trang 1 | Known Gap — defer |
| KG-M11-03 | Chỉ mục nav mới có active state; "Hồ sơ sinh" và mục khác chưa có | Known Gap — defer (quyết định riêng nếu muốn đồng bộ) |
| KG-M11-04 | Lệch nhãn phân trang với F3 ("Trước/Sau" vs "Trang trước/Trang sau") | Known Gap — defer |
| KG-M11-05 | Sidebar thu gọn: link chỉ có icon, không có tên truy cập (tồn tại cho mọi mục) | **Existing defect to report** |
| KG-M11-06 | Lỗi truy vấn danh sách không được báo cáo (không có `onError` toàn cục cho query) | Known Gap — defer (convention) |
| KG-M11-07 | Backend `orderBy` không tie-breaker; `include` nặng cho danh sách | Separate Backend task |
| KG-M11-08 | Danh sách không có điều khiển lọc/sắp xếp/tìm kiếm/xoá | Out of scope (theo yêu cầu) |
| FG-01 | `ChartResponse` không có `birthProfileId` (viewer không có tên hồ sơ) | Kế thừa — accepted |
| KG-F4M1-12 | cảnh báo Node 20 của `actions/checkout@v4`, `setup-node@v4` | Kế thừa |

## 33. Acceptance Criteria

Căn cứ: **AC Saved Charts List (Mục 49, dòng 844 của F4 plan)** + yêu cầu M11.

| ID | Tiêu chí | Kiểm bằng |
|---|---|---|
| AC-1 | `/app/charts` liệt kê chart của người dùng hiện tại | B5, E2E bước 4 |
| AC-2 | gọi `GET /api/v1/charts` qua `apiClient`; dùng `listCharts`/`useChartsQuery`/`chartKeys` (không nhân bản) | B6, grep |
| AC-3 | chỉ hiển thị thông tin API cung cấp; **không** `chartType`/`isHouseDataAvailable` | A14, grep |
| AC-4 | mỗi mục link `/app/charts/:chartId` | A1 |
| AC-5 | ngày `vi-VN`, đúng ngữ nghĩa timestamp | A2, B18 |
| AC-6 | Badge hệ nhà đúng; giá trị lạ an toàn | A3, A4, B17 |
| AC-7 | nhãn hồ sơ `fullName ?? label` | A5, B14 |
| AC-8 | `null`/thiếu ⇒ "Hồ sơ đã xoá hoặc không còn" (theo D-M11-3 đã chọn) | A6–A8 |
| AC-9 | lỗi hồ sơ không chặn danh sách; không hiện "đã xoá" giả khi đang tải | A9, A10, B12, B13 |
| AC-10 | `aria-label` chứa ngày + nhãn (kể cả fallback) | A11 |
| AC-11 | 6 skeleton khi tải ban đầu | B1 |
| AC-12 | lỗi có "Thử lại"; không biến lỗi thành rỗng | B2, B15 |
| AC-13 | rỗng dẫn tới `/app/profiles` | B4 |
| AC-14 | `pageSize = 12`; "Trước"/"Sau" khi `total > pageSize` | B6, B8–B11 |
| AC-15 | page cục bộ; dữ liệu ở TanStack Query; không store mới | grep, đọc mã |
| AC-16 | không gửi user id | B6, E2E bước 7 |
| AC-17 | route `/app/charts` đăng ký (lazy) | R-L1, R-L5 |
| AC-18 | `/app/charts/:chartId` không bị ảnh hưởng | R-L2, R-L3 |
| AC-19 | "Lá số của tôi" ở sidebar và drawer | L1, L2 |
| AC-20 | active ở danh sách **và** chi tiết | L5, L6, L7 |
| AC-21 | drawer đóng sau khi bấm | L4 |
| AC-22 | chart vừa tính xuất hiện sau invalidate/refetch | IT-1, IT-2, C1 |
| AC-23 | E2E: User B không thấy chart của User A (hai tài khoản thật) | E2E bước 4–8 |
| AC-24 | test cũ nguyên vẹn và xanh | toàn bộ suite |
| AC-25 | `typecheck`, `lint`, `format:check`, `test`, `build` exit 0 | Mục 30 |
| AC-26 | CI Frontend xanh trên đúng commit cuối (gồm E2E) | CI |

## 34. Definition of Done

```text
M11.0 chốt → M11.1 ChartList → M11.2 trang → M11.3 route + export
           └→ M11.4 nav ─────────────────────┘
→ M11.5 tích hợp + invalidation → M11.6 E2E hai tài khoản + hồi quy
→ mọi cổng xanh (CI trên commit cuối) → Evidence Matrix M11 → xoá blueprint → M11 đóng
```

Đồng thời: `git diff --stat` chỉ gồm file ở Mục 25; không dependency mới; không store mới; Backend không đổi; mọi mục ngoài phạm vi còn nguyên; E2E không bị bỏ qua (`test.skip`/`fixme`).

## 35. Final Architect Review

| Hạng mục | Đánh giá |
|---|---|
| Tuân thủ plan v1.1 / O-F4-2 B | Có; truy vết ở Mục 4; không đổi yêu cầu đã duyệt trừ **một đề xuất cần duyệt** (D-M11-3) |
| Phạm vi | chỉ truy cập lá số đã lưu; không quản lý chart |
| FE-S4.1/S4.3 | **được audit**, không giả định |
| Tái dùng | `listCharts`, `useChartsQuery`, `chartKeys`, invalidation, `formatCalculatedAt`, `resolveHouseSystem`, `Button as`, `useUiStore` |
| State | `page` cục bộ; server state ở TanStack Query; lookup dẫn xuất; không store mới |
| Lookup hồ sơ | không chặn danh sách; phân biệt loading/lỗi/thiếu/đã xoá/chưa đủ |
| Route & nav | thứ tự đúng và được test; active mới (không có sẵn) giới hạn ở mục mới; drawer đóng đúng mẫu |
| Ranh giới | `ChartList` không import `birth-profile`; Public API chỉ thêm 3 export |
| Test | 15 + 18 + 1 + 3 + 8 + 5 test mới + E2E; test cũ giữ nguyên |
| Backend | không đổi; rò rỉ cô lập (nếu có) = blocker riêng |
| Rủi ro lớn nhất | E2E gọi engine thật lần đầu trong CI frontend (R-12) |
| Blocker | **Không có** |

## 36. Final Recommendation

**`READY FOR IMPLEMENTATION`**

Không có điều kiện chặn: FE-S4.1 và FE-S4.3 đã được xác minh bằng mã, test và CI #240; không cần đổi Backend hay tầng dữ liệu.

**Xác nhận không chặn (F4-M11.0) — mặc định áp dụng nếu không phản hồi:**
1. **D-M11-3** (đổi nhãn khi tra cứu hồ sơ chưa đủ >100): mặc định **giữ yêu cầu gốc** ("Hồ sơ đã xoá hoặc không còn") và ghi FG-13; nếu duyệt đề xuất thì dùng "Không xác định được hồ sơ".
2. **D-M11-1:** "Trước"/"Sau" (lệch F3).
3. **D-M11-7:** icon `Orbit` cho mục nav.
4. **D-M11-5:** active state chỉ cho mục mới.

Thứ tự thực thi: **M11.0 → M11.1 → M11.2 → M11.3 (∥ M11.4 từ sau M11.0) → M11.5 → M11.6**; mỗi task kết thúc bằng `typecheck` + `lint` + `format:check` + test liên quan, và CI xanh trước khi đóng M11.
