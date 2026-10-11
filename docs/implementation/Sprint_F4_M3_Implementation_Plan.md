# AstroViet — FE Sprint 4 M3 Implementation Plan
## Calculate Flow & Chart Viewer Shell

**Vị trí đề xuất:** `docs/implementation/Sprint_F4_M3_Implementation_Plan.md` (blueprint tạm thời; xoá khi M3 đóng, lưu Evidence Matrix vào `docs/implementation/archive/sprint-f4/`).
**Phiên bản:** 1.1 — **`READY FOR IMPLEMENTATION`** (Mục 48 — Đã thông qua toàn bộ quyết định D-M3-1..D-M3-13 tại F4-M3.0).
**Căn cứ:** audit repo `dev` tại `53e3d52` (2026-10-11); `Confirmation.md` (5 quyết định M2 do owner chốt); `Sprint_F4_Implementation_Plan.md` (FE-S4.3); `docs/frontend/*`; mã Backend `backend/src/modules/chart/**`.
**Quy ước nguồn:** `[repo]` đọc mã/tài liệu · `[C-run]` Claude chạy lệnh trong sandbox (`npm ci` theo lockfile, Node v22.22.2) · `[CI]` trang GitHub Actions công khai · `[owner]` owner cung cấp.
**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `BLOCKED` · `NOT APPLICABLE` · `DEFERRED`.
**Giới hạn audit:** không chạy Backend (sandbox không có Postgres) và không chạy E2E Playwright. Mọi kết luận về Backend là đọc mã tĩnh, đối chiếu với hai response CAPTURED của M1.

---

## 1. Executive Summary

M3 hoàn thiện **luồng người dùng** `Hồ sơ sinh → Tính lá số → Chart Viewer`, chưa phải trực quan hoá: nút "Tính lá số" trên thẻ hồ sơ, `CalculateChartDialog`, route lazy `/app/charts/:chartId`, trang chi tiết dùng `useChartQuery` + `toChartViewModel` (qua `useMemo`), các trạng thái tải/lỗi, `document.title`, focus vào `h1`, và một **Viewer Shell** tạm.

**Điều kiện tiên quyết đã xác minh:** S4.1 (M1), S4.2 (M2) và M2 cleanup đều đóng. Tại HEAD `53e3d52`: `typecheck` (cổng thật), `lint`, `format:check`, `build` exit 0 [C-run]; **90 file / 558 test passed**; coverage `features/chart/model` **100%** [C-run]; Frontend CI #232 **Success** (2m 32s) [CI].

**Phát hiện quan trọng (đều có bằng chứng) — plan khác kỳ vọng ban đầu ở các điểm sau:**

| # | Phát hiện | Hệ quả cho plan |
|---|---|---|
| 1 | **Không có tiện ích `document.title` hoặc focus-sau-điều-hướng.** `router.tsx` còn `TODO(Core)` OQ-M8-1/2; grep `document.title`, `usePageTitle`, `.focus(` ngoài Modal/Select không có gì. Prompt yêu cầu "tái dùng tiện ích sẵn có" — không có để tái dùng. | Xử lý **cục bộ trong trang chart** (đúng F4 plan §29); không tạo hook dùng chung để khỏi lấn OQ-M8. |
| 2 | **`reportError` đã tồn tại** (`shared/lib/report-error.ts`, chỉ `console.error`, chưa có Sentry) và đang được dùng ngầm: `getErrorMessage` gọi nó khi mã lỗi chưa ánh xạ; `queryClient.mutations.onError` gọi nó cho mutation lỗi chưa ánh xạ. **Query lỗi không có báo cáo toàn cục.** | "Không thêm reportError mới" = dùng lại hàm sẵn có theo convention; `issues` không báo cáo (đúng quyết định #3). |
| 3 | **Chỉ có `errorElement` cấp gốc** (`RootErrorBoundary` trong `router.tsx`, không export, thay **toàn màn hình** và mất AppLayout). Không có ErrorBoundary component nào khác. | "Error boundary gần nhất của feature" **không tồn tại**; lỗi không dự kiến sẽ tới `RootErrorBoundary`. Không tạo boundary mới (D-M3-4). |
| 4 | **F4 plan §31 mâu thuẫn Confirmation #5.** F4 plan: notice trong viewer nói "thường do chưa biết giờ sinh" và nêu Mặt Trăng; Confirmation #5: không suy diễn nguyên nhân. | Theo thứ bậc nguồn, **Confirmation thắng**: viewer chỉ nêu sự kiện hợp đồng (D-M3-6). |
| 5 | **`houses=[]` có hai nguyên nhân** (chưa biết giờ sinh — không warning; Placidus không hội tụ — warning `HOUSE_SYSTEM_NOT_CONVERGING`), và `BirthProfile.warnings` luôn `[]` ở Backend. | Notice trong dialog dựa vào `isBirthTimeKnown` (sự kiện của hồ sơ); notice trong viewer chỉ dựa vào `flags.houseDataAvailable` + `warnings`. |
| 6 | **`useCreateNatalChartMutation` đã `setQueryData(detail)` khi thành công** và `useChartQuery` có `staleTime: Infinity` ⇒ sau khi điều hướng, trang chart **không phát `GET`**. | Test tích hợp xác nhận 0 `GET` (khác mô tả "chart query succeeds" trong prompt: query "thành công" từ cache). |
| 7 | **`Modal` không có chế độ không-thể-đóng**: Esc, nút X và overlay luôn gọi `onClose` (chỉ `closeOnOverlayClick` tắt được overlay). | Chặn đóng khi đang tính bằng **guard phía consumer** (`onClose` no-op khi pending); không sửa `shared/ui/Modal`. |
| 8 | **`ApiError` không phân biệt "mất mạng" và "5xx không có body"**: cả hai là `errorCode = "UNKNOWN_ERROR"` (`client.ts` dòng ~60–63; `status = error.response?.status \|\| 500`). | Phân loại bằng `errorCode`, không bằng `status` (Mục 31). |
| 9 | **Kiến trúc cấm feature import chéo** (Architecture Spec §2.2) nhưng `CalculateChartDialog` cần thông tin hồ sơ. `features/chart` chưa có `ui/` và `index.ts`. | Dialog nhận kiểu **cục bộ** `CalculateChartTarget` (page ánh xạ từ `BirthProfile`). |
| 10 | **Không có hook/utility sai lệch cần dọn.** `isValidChartId` (M1) đã là UUID guard dùng được; không tạo bản trùng. | Dùng lại `isValidChartId`. |
| 11 | E2E `birth-profile.spec.ts` dùng `getByRole("link"/"button", { name: "Sửa"/"Xóa" })`; nút mới có tên "Tính lá số cho hồ sơ …" không chứa các chuỗi đó. | Rủi ro hồi quy E2E thấp (Mục 44). |
| 12 | `index.html` có `<html lang="en">` trong khi giao diện tiếng Việt; không thuộc M3. | Ghi nhận Known Gap (Mục 43). |

**Quyết định của owner (Confirmation.md) đã được áp dụng nguyên văn:** `useMemo` ở page; `ChartViewModelError` xử lý ở page/boundary hiện có; `issues` không tự động báo cáo; FG-01 giữ nguyên; notice không khẳng định nguyên nhân.

## 2. Sprint Goal

> Người dùng bấm "Tính lá số" trên một hồ sơ sinh, chọn hệ nhà, và đến được trang `/app/charts/:chartId` hiển thị một Viewer Shell trung thực với dữ liệu Backend (kể cả khi thiếu dữ liệu nhà), với mọi trạng thái tải/lỗi có thể phục hồi — không tính toán chiêm tinh phía frontend và không mở rộng sang wheel/bảng.

## 3. Scope

Nút "Tính lá số" ở thẻ hồ sơ · `CalculateChartDialog` (chọn hệ nhà cục bộ, notice giờ sinh, loading/error, điều hướng) · route lazy `charts/:chartId` · trang chi tiết (`useChartQuery`, UUID guard, các trạng thái) · `ChartViewerSkeleton` · Viewer Shell + notice dữ liệu nhà · `document.title` + focus `h1` (cục bộ) · `features/chart/index.ts` · test component/trang/router/tích hợp · hồi quy.

## 4. Out of Scope

Chart Wheel · bảng hành tinh/nhà/aspect · tương tác/đồng bộ · danh sách/lịch sử/xoá/so sánh chart · UI diễn giải · mọi thay đổi Backend · global state/Zustand/Context mới · hệ thống telemetry mới · **giải quyết FG-01** · tạo hồ sơ ngay trong dialog · sửa `shared/ui/Modal` · sửa hook M1/model M2 · sửa OQ-M8-1/2 ở cấp ứng dụng · thêm E2E (thuộc S4.10).

## 5. Current Repository State

| Hạng mục | Thực tế | Trạng thái |
|---|---|---|
| HEAD | `53e3d52` "[refactor] add tests & m2 cleanup"; Frontend CI #232 Success | VERIFIED [CI] |
| Cổng chất lượng | `npm run typecheck` (= `tsc -p tsconfig.app.json --noEmit`), `lint`, `format:check`, `build` exit 0; vitest 90 file / 558 test passed; coverage 94.21% stmts, `chart/model` 100% | VERIFIED [C-run] |
| `features/chart/` | `api/`, `hooks/`, `model/`; **không có `ui/`, `index.ts`** | VERIFIED [repo] |
| Tiền lệ feature | `features/auth/index.ts` (barrel); `features/birth-profile` không barrel, `ui/BirthProfileForm/{Component.tsx, index.ts, tests}` | VERIFIED [repo] |
| Alias | `@app @pages @widgets @features @shared @test` (`tsconfig.app.json`) | VERIFIED |
| TS/React | target `es2023`; React `^18.3.1`; `react-router-dom ^7.18.2`; `StrictMode` bật ở `main.tsx` (effect chạy hai lần ở dev) | VERIFIED |
| Scripts | `lint`, `typecheck`, `format:check`, `test`, `test:coverage`, `build`, `test:e2e` | VERIFIED `package.json` |
| Trang hồ sơ | `pages/app/profiles/page.tsx`: thẻ hồ sơ **inline** (không có component `BirthProfileCard`); state `deletingProfile`; `Modal` xoá luôn render với `isOpen` | VERIFIED |
| Router | `app/router.tsx`: `lazy()` + `<Suspense>` trong layout; `app` → `ProtectedRoute` → `AppLayout`; `*` → `NotFoundPage` | VERIFIED |
| Test infra | `src/test/setup.ts` (`onUnhandledRequest: "error"`, `#modal-root`, `matchMedia`), `renderWithProviders` (MemoryRouter + QueryClient mới), `msw-server`, `vitest-axe` | VERIFIED |

## 6. S4.1 Prerequisite Audit (Chart API / DTO)

| Yêu cầu | Bằng chứng | Trạng thái | M3 phụ thuộc an toàn? |
|---|---|---|---|
| Hàm tính | `features/chart/api/createNatalChart.ts` (`POST /api/v1/charts/natal`, `params: { save: true }`, body `{birthProfileId, houseSystem, includeOptionalPoints: []}`) | VERIFIED | Có |
| Hàm lấy chart | `getChart.ts` (`GET /api/v1/charts/${encodeURIComponent(id)}`) | VERIFIED | Có |
| Kiểu | `api/types.ts`: `ChartResponse`, `HouseSystem = "Placidus" \| "WholeSign"`, `KNOWN_HOUSE_SYSTEMS` | VERIFIED | Có |
| Lỗi chuẩn hoá | `shared/api/client.ts`: `ApiError{status, errorCode, …}` | VERIFIED | Có |
| Auth | token gắn bởi interceptor; `POST /natal` không `requireAuth` ở route nhưng use case ném 401 khi Guest + `save=true` | VERIFIED [repo] (tĩnh) | Có |
| Query key | `hooks/query-keys.ts` (`chartKeys` phân cấp) | VERIFIED | Có |
| Hook | `useChartQuery(id)` (`enabled: isValidChartId(id)`, `staleTime: Infinity`, không refetch focus/reconnect); `useCreateNatalChartMutation` (`setQueryData(detail)` + `invalidate(lists())`, trả `ChartResponse`) | VERIFIED | Có |
| Mã lỗi | `error-messages.ts` có `INVALID_DATETIME`, `UNRESOLVABLE_TIMEZONE`, `INVALID_COORDINATES` (+ `FORBIDDEN`, `RESOURCE_NOT_FOUND`, `MALFORMED_REQUEST`, `UNAUTHORIZED`); **không** ánh xạ `CHART_CALCULATION_FAILED`, `DATA_INTEGRITY_ERROR`, `INTERNAL_SERVER_ERROR` (chủ đích D-5 của M1) | VERIFIED | Có |
| MSW/fixture | `api/mocks/handlers.ts` (`mockCreateNatalChart`, `mockGetChart`, `createNatalChartSuccess`, `chartNotFound`, `chartForbidden`, `chartDomainError`…), `fixtures.ts` (`chartFull`, `chartNoHouses` CAPTURED) | VERIFIED | Có |
| Hợp đồng Backend | `POST` trả `201` khi `save=true`, body là `ChartResponse` có `id` (`z.string().uuid()`); `GET /:id`: `400 MALFORMED_REQUEST` (id sai định dạng), `404 RESOURCE_NOT_FOUND`, `403 FORBIDDEN` (`assertChartOwnership`) | VERIFIED [repo] (tĩnh) | Có |

**Còn thiếu cho M3:** không có gì chặn; không cần sửa M1.

## 7. S4.2 Prerequisite Audit (ViewModel / Adapter)

| Yêu cầu | Bằng chứng (`features/chart/model/`) | Trạng thái |
|---|---|---|
| `ChartViewModel` | `chartViewModel.ts`: `meta{id, houseSystem: GlyphLabel, calculatedAt, engineVersion}`, `flags{houseDataAvailable, hasAngles, partialData, ascendantLongitude}`, `planets/houses/angles/aspects/warnings/issues` | VERIFIED |
| `toChartViewModel(dto)` | thuần, đồng bộ; đã tách `validateStructure/buildPlanets/buildHouses/buildAngles/buildAspects/buildWarnings` (file 864 dòng) | VERIFIED |
| `ChartViewModelError` | `extends Error`, `readonly code = "MALFORMED_CHART_RESPONSE"`, `path?`; ném **chỉ** cho hỏng cấu trúc (`dto` không phải object, `id`/`calculatedAt`/`engineVersion` rỗng, `isHouseDataAvailable` không phải boolean, `planets/houses/angles/aspects/warnings` không phải mảng). Phân biệt được bằng `instanceof` (target ES2023) hoặc `error.code` | VERIFIED |
| `issues` | `ChartIssue{code, subject}` với 7 mã: `UNKNOWN_VALUE, VALUE_OUT_OF_RANGE, ENTRY_DROPPED, CORE_BODY_MISSING, HOUSE_FLAG_CONTRADICTION, DUPLICATE_ENTITY, ASPECT_ENDPOINT_MISSING`. **Là dữ liệu chẩn đoán, không phải exception/telemetry.** Chỉ 3 mã làm `partialData=true` (`ENTRY_DROPPED`, `CORE_BODY_MISSING`, `HOUSE_FLAG_CONTRADICTION`). Với Backend hiện tại mọi response hợp lệ cho `partialData=false` | VERIFIED |
| Nhà không có | `flags.houseDataAvailable = isHouseDataAvailable && đủ 12 nhà hợp lệ`; không bịa nhà; `houseNumber=null` hết khi không có | VERIFIED |
| Nhãn/định dạng | `labels.ts` (`resolveHouseSystem`, `resolveWarningCode`…), `format.ts` (`formatDegreeMinute`) | VERIFIED |
| Cô lập diễn giải | VM không đọc `interpretations`/`interpretationVersion` (test A6/A7) | VERIFIED |
| Test | `chartViewModel.test.ts` **60 test**, `labels.test.ts` 25, `format.test.ts` 15; model 100% [C-run] | VERIFIED |
| Cleanup M2 (R-1…R-5) | `warnings[]` hỏng ⇒ `ENTRY_DROPPED`; `planets[].house` sai kiểu ⇒ `VALUE_OUT_OF_RANGE`; "Tọa độ" đã sửa | VERIFIED [C-run] (script probe) |

**M3 có thể phụ thuộc an toàn.** Ghi chú: nhà sai khi cờ mâu thuẫn sinh nhiều `VALUE_OUT_OF_RANGE` cho `planet.house` (ồn nhưng vô hại; `issues` không hiển thị trong M3).

## 8. Existing Birth Profile Flow

- **Trang:** `pages/app/profiles/page.tsx` (default export `BirthProfilesPage`): `useBirthProfilesQuery({page, pageSize: 10})`; trạng thái loading (6 `Skeleton`), lỗi (`EmptyState danger` + "Thử lại"), rỗng, danh sách `Grid` 1/2/3 cột.
- **Thẻ hồ sơ (inline `Card`):** tên (`fullName ?? label`), ngày sinh (+ giờ nếu `isBirthTimeKnown && birthTime`), nơi sinh; hàng hành động `Stack horizontal justify-end` với `Button as={Link}` "Sửa" (`aria-label="Sửa hồ sơ {tên}"`) và `Button variant="danger"` "Xóa" (`aria-label="Xóa hồ sơ {tên}"`, đặt `deletingProfile`).
- **Modal xoá:** `Modal isOpen={!!deletingProfile}` luôn render; nút có `isLoading`/`disabled`; lỗi bằng `Alert danger`.
- **`BirthProfile` (kiểu):** `id: string` (UUID ở Backend; test dùng `"1"`), `fullName: string|null`, `label`, `isBirthTimeKnown: boolean`, `birthTime: string|null`, `warnings: Warning[]` (**Backend luôn `[]`**).
- **Test hiện có:** `page.test.tsx` 11 test (loading, lỗi, rỗng, phân trang, xoá/hủy/lỗi xoá, lùi trang, retry, điều hướng tạo mới); dùng `renderWithProviders`, `mockListBirthProfiles`, `mockBirthProfile`.
- **Không có tính năng "chọn hồ sơ"** ngoài hai hành động trên; mọi hồ sơ đều đủ điều kiện tính (không có tiêu chí loại trừ trong hợp đồng) — **không gate phía client**.

## 9. Existing API / Mutation Layer

- `useCreateNatalChartMutation()` → `useMutation<ChartResponse, ApiError, {profileId, houseSystem}>`; hook-level `onSuccess` seed cache; **không** `onError` riêng. `createQueryClient().mutations.onError` báo cáo lỗi chưa ánh xạ (`reportError(error, "TanStack Query Mutation")`) và bỏ qua mã đã ánh xạ.
- Nhánh `mutate(vars, { onSuccess })` ở call-site chạy **sau** hook-level `onSuccess`; callback call-site **không** chạy nếu component đã unmount — chấp nhận được vì cache đã được seed.
- Không dùng `fetch` trực tiếp; mọi request qua `apiClient`.

## 10. Existing Chart Query Layer

`useChartQuery(id: string | undefined)` → `useQuery<ChartResponse, ApiError>`: `enabled: isValidChartId(id)` (id sai ⇒ **không request**, `isLoading=false`, `fetchStatus="idle"`), `retry: false` (mặc định `createQueryClient`), `staleTime: Infinity`, không refetch khi focus/reconnect. Dữ liệu cache từ mutation được dùng ngay (không `GET`). `isError` có thể đồng thời có `data` (refetch thất bại) — page ưu tiên `data` (Mục 31).

## 11. Existing Router and Layout

- **Đăng ký lazy:** `const X = lazy(() => import("@pages/…/page"))`; layout bọc `<Suspense fallback={<SuspenseFallback/>}>` quanh `<Outlet/>` (spinner "Đang tải trang…").
- **Bảo vệ:** `ProtectedRoute` (store `resolving` ⇒ spinner; `unauthenticated` ⇒ `Navigate` tới login với `redirect` an toàn qua `createSafeRedirectUrl`); `GuestRoute` cho login/register.
- **Route `app`:** `index`, `profiles`, `profiles/new`, `profiles/:id/edit`. Chưa có `charts/*`. `/app/charts` (không id) sẽ rơi vào catch-all `*` ⇒ `NotFoundPage` (toàn trang, `h-screen`, **không** AppLayout) — chấp nhận ở M3 (route danh sách là S4.11).
- **Layout:** `AppLayout` có `<Container as="main" id="main-content">` (đích `SkipLink`), **không** có `h1`; không `tabIndex` trên `main`. Sidebar/drawer chỉ có "Hồ sơ sinh" (không có mục lá số).
- **Test router:** `app/router.test.tsx` dùng `createMemoryRouter(routesConfig)` + `useAuthStore.setState`; có cả ca `RootErrorBoundary` (route giả `test-error`).

## 12. Existing Error Handling

| Cơ chế | Thực tế |
|---|---|
| Chuẩn hoá | `ApiError`; mạng/không body ⇒ `status = error.response?.status \|\| 500`, `errorCode = "UNKNOWN_ERROR"` |
| Từ điển | `getErrorMessage(code)`: mã lạ ⇒ `reportError` + "Đã có lỗi xảy ra, vui lòng thử lại." (**side-effect khi render**; F3 gọi trực tiếp trong JSX) |
| Báo cáo | `reportError(error, context)` = `console.error`; chưa tích hợp dịch vụ ngoài |
| Trang F3 | `edit/page.tsx`: `isError \|\| !profile` ⇒ **một** `EmptyState danger` "Hồ sơ không tồn tại hoặc bạn không có quyền truy cập" (gộp 403/404/khác) |
| Boundary | chỉ `RootErrorBoundary` (router `errorElement`, `console.error` + màn hình lỗi toàn trang) |

## 13. Existing Shared UI

| Component | Kết quả audit | Dùng ở M3 |
|---|---|---|
| `Modal` (`shared/ui/Modal/index.tsx`) | props `isOpen,onClose,title,description,footer,size,closeOnOverlayClick`; portal vào `#modal-root`; `role="dialog" aria-modal`; focus trap (`useFocusTrap`, khôi phục focus khi cleanup/unmount); animation đóng 320ms chỉ khi `isOpen` chuyển `false` khi còn mounted; Esc/X luôn gọi `onClose`; `max-sm` toàn màn hình | Có (D-M3-3) |
| `RadioGroup` (`shared/ui/Radio/index.tsx`) | `options[{value,label,description}]`, `value`/`onChange(value: string)` (controlled), `label`, `role="radiogroup"` | Có |
| `Alert` | `variant info/success/warning/danger`; `role="alert"` (danger/warning) / `"status"` (info/success) | Có |
| `Button` | `isLoading` ⇒ `aria-busy`, `aria-disabled`, **chặn click**; `as={Link}`; `size sm` | Có |
| `EmptyState` | `title` (render `h3`), `description`, `action`, `variant default/danger` (`role` status/alert) | Có (cho lỗi/không tìm thấy) |
| `Skeleton` | `aria-hidden="true"` (không tự cung cấp trạng thái trợ năng) | Có + bọc `role="status"` |
| `Container`, `Card`, `Stack`, `Spinner`, `Grid` | sẵn có | Có |

---

## 14. Architecture Proposal

```text
pages/app/profiles/page.tsx           (composition: sở hữu state dialog mở/đóng + hồ sơ được chọn)
   └─ features/chart  ← CalculateChartDialog (state cục bộ: houseSystem, mutation)
pages/app/charts/detail/page.tsx      (composition: route param → query → useMemo(VM) → trạng thái)
   └─ features/chart  ← ChartViewerSkeleton · ChartViewerShell · HouseDataNotice
features/chart/index.ts               (Public API duy nhất mà pages dùng)
```

Nguyên tắc: (1) hook dữ liệu **không** biết trình bày; (2) page là lớp ghép (mapping `ChartResponse → ChartViewModel`); (3) component trình bày chỉ nhận `ChartViewModel`/props đơn giản; (4) feature `chart` **không** import `birth-profile`; (5) không state toàn cục mới.

## 15. Calculate Chart Action

- **Vị trí:** thẻ hồ sơ inline trong `profiles/page.tsx` (không tạo `BirthProfileCard` — ngoài phạm vi; sẽ trùng lặp/tái cấu trúc F3). Thêm `Button variant="primary" size="sm"` "Tính lá số", **đặt đầu** hàng hành động (hành động chính), trước "Sửa"/"Xóa".
- **Nhãn trợ năng:** `aria-label={`Tính lá số cho hồ sơ ${tên}`}` (cùng mẫu "Sửa hồ sơ …"). Không chứa chuỗi "Sửa"/"Xóa" (E2E).
- **Sự kiện:** thẻ `Card` không tương tác (`interactive` mặc định tắt) ⇒ không cần `stopPropagation`.
- **State (page):** `const [calculateTarget, setCalculateTarget] = useState<CalculateChartTarget | null>(null)`; mở: `setCalculateTarget({ id: profile.id, displayName: profile.fullName ?? profile.label, isBirthTimeKnown: profile.isBirthTimeKnown })`; `null` = đóng.
- **Trùng lặp logic:** page **không** gọi mutation; toàn bộ logic tính nằm trong dialog.
- **Chống bấm đúp:** chỉ một dialog tại một thời điểm (modal) và nút bị chặn khi `isPending` (Mục 19).
- **Di động:** thẻ 1 cột có tới 3 nút trong `Stack horizontal`; thêm `flex-wrap` nếu hẹp (kiểm thủ công ở 320px; R-10).

## 16. CalculateChartDialog

**Vị trí:** `features/chart/ui/CalculateChartDialog/{CalculateChartDialog.tsx, index.ts, CalculateChartDialog.test.tsx}` (mẫu `BirthProfileForm`).

```ts
export interface CalculateChartTarget { id: string; displayName: string; isBirthTimeKnown: boolean }
export interface CalculateChartDialogProps { target: CalculateChartTarget; onClose: () => void }
```

- **Gắn kết theo lần mở (D-M3-3):** page chỉ render dialog khi `calculateTarget !== null`: `{calculateTarget && <CalculateChartDialog target={…} onClose={() => setCalculateTarget(null)} />}`. Dialog render `<Modal isOpen …>` (luôn mở khi mounted). Hệ quả có chủ đích: (a) **state cục bộ tự reset mỗi lần mở** (houseSystem, lỗi mutation) mà không cần effect/`key`; (b) không có hoạt ảnh đóng 320ms (chấp nhận; `Modal` xoá hồ sơ vẫn giữ hoạt ảnh); (c) focus được khôi phục về nút kích hoạt bởi `useFocusTrap` khi unmount.
- **Nội dung:** `Modal title="Tính lá số"`, `description`: `Chọn hệ nhà để tính lá số cho hồ sơ “{displayName}”.`; thân: [notice giờ sinh nếu cần] · `RadioGroup` "Hệ nhà" · [Alert lỗi] · [dòng trạng thái đang tính]; `footer`: "Hủy" (ghost) + nút chính.
- **Hệ nhà:** tuỳ chọn tạo từ `KNOWN_HOUSE_SYSTEMS` (**không** hard-code lại danh sách), nhãn từ `resolveHouseSystem(key).labelVi` (`"Placidus"`, `"Whole Sign"`); giá trị gửi API là enum (`"Placidus" | "WholeSign"`), **không** dùng nhãn hiển thị. Mô tả ngắn mỗi lựa chọn (đề xuất — D-M3-7): Placidus "Phổ biến; chia nhà theo thời gian sinh."; Whole Sign "Mỗi cung hoàng đạo tương ứng một nhà."
- **Chuyển `string → HouseSystem`:** `RadioGroup.onChange` trả `string`; dùng type guard cục bộ dựa trên `KNOWN_HOUSE_SYSTEMS` (không `as`).
- **Điều hướng/đóng:** xem Mục 20. **Công khai:** export `CalculateChartDialog` và kiểu `CalculateChartTarget` từ `features/chart/index.ts`.

## 17. House System State

| Mục | Quyết định |
|---|---|
| Sở hữu | `useState<HouseSystem>("Placidus")` **bên trong** `CalculateChartDialog`; không Context/Zustand/prop-drilling |
| Giá trị đầu | `"Placidus"` |
| Chọn | `RadioGroup` controlled (`value`, `onChange`) |
| Gửi | `mutate({ profileId: target.id, houseSystem })` |
| Reset | tự động khi dialog unmount (mỗi lần mở là một lần mount mới); đổi sang hồ sơ khác cũng là mount mới ⇒ không rò rỉ giữa hồ sơ |
| Khi đang tính | `RadioGroup disabled`; dialog **mở** |
| Khi lỗi | giữ nguyên lựa chọn hiện tại (để thử lại) |
| Khi thành công | bỏ cùng dialog (unmount do điều hướng) |
| Lưu bền | không (không localStorage) |

## 18. UnknownTimeNotice

Có **hai** thông báo khác nhau, kèm điều kiện và bằng chứng riêng.

**(a) Trong dialog — dựa trên sự kiện của hồ sơ.**
- Điều kiện: `target.isBirthTimeKnown === false` (kiểu `BirthProfile.isBirthTimeKnown`, `features/birth-profile/api/types.ts`).
- Bằng chứng hợp đồng: Backend chỉ tính nhà khi `isBirthTimeKnown` (`chart-builder.ts` dòng ~57/73) và tính vị trí tại 12:00 địa phương khi thiếu giờ (`time-conversion.ts` ~dòng 52; Sprint 4 Summary KG-S4-06). Chiều **hồ sơ → kết quả** được bảo đảm; chiều ngược lại **không**.
- Hình thức: `Alert variant="info"`, nằm trên `RadioGroup`, không chặn tính.
- Copy (đề xuất, D-M3-7): tiêu đề "Hồ sơ này chưa có giờ sinh"; mô tả "Lá số vẫn được tính, nhưng Nhà và các góc (Cung Mọc, MC…) có thể không khả dụng, và vị trí của Mặt Trăng cùng một số điểm di chuyển nhanh có thể kém chắc chắn." (dùng "có thể"; không khẳng định kết quả cụ thể).

**(b) Trong viewer — dựa trên dữ liệu trả về, không suy diễn nguyên nhân (Confirmation #5).**
- Component: `HouseDataNotice` (đề xuất **đổi tên** từ `UnknownTimeNotice` vì tên cũ ngụ ý nguyên nhân — D-M3-8; owner có thể giữ tên cũ).
- Điều kiện: `vm.flags.houseDataAvailable === false` (trạng thái hợp lệ, **không** phải lỗi).
- Nội dung (đề xuất): tiêu đề "Dữ liệu Nhà và các góc chưa khả dụng"; mô tả "Lá số này hiển thị không có Nhà và các góc (Cung Mọc, MC, DSC, IC). Dữ liệu này chỉ có khi hệ thống tính được hệ nhà, điều này cần giờ sinh và không phải lúc nào cũng thực hiện được." (nêu **điều kiện cần**, không nêu nguyên nhân của lá số cụ thể).
- Nếu `vm.warnings` có `HOUSE_SYSTEM_NOT_CONVERGING`: thêm đúng câu `labelVi` từ VM ("Không tính được chính xác hệ nhà tại vị trí này.") — đây là nguyên nhân do **Backend** báo, được phép nêu.
- **Không** nhắc Mặt Trăng trong viewer (khác F4 plan §31) vì viewer không biết giờ sinh (FG-01).
- `Alert variant="info"` (không `danger`); không `EmptyState`, không `reportError`; không bịa nhà/góc.
- Vị trí: ngay dưới khối metadata, trên placeholder.

## 19. Calculation Loading and Error Handling

**Loading** (`mutation.isPending`):
- Nút chính `isLoading` (⇒ `aria-busy`, chặn click) và đổi nhãn không đổi (giữ "Tính lá số").
- Dòng `<p role="status">Đang tính toán vị trí hành tinh…</p>` hiển thị trong thân (vùng live).
- Khoá: `RadioGroup disabled`, "Hủy" `disabled`.
- **Chặn đóng ngoài ý muốn** (`Modal` không có chế độ này): truyền `onClose={() => { if (!isPending) onClose(); }}` và `closeOnOverlayClick={!isPending}`; Esc/X trở thành no-op khi đang tính. Ghi Known Gap: `Modal` thiếu prop `dismissible` (KG-M3-03).
- Handler còn guard `if (isPending) return;` để chặn kích hoạt bằng phím trước khi `isLoading` cập nhật.

**Lỗi** (`mutation.isError`):
- `Alert variant="danger" title="Không thể tính lá số" description={message}` đặt trong thân; dialog **vẫn mở**, ngữ cảnh hồ sơ và lựa chọn hệ nhà được giữ.
- `message = getErrorMessage(error.errorCode)` tính **một lần** bằng `useMemo` theo `error` (giảm gọi `reportError` lặp khi render lại). `message` thô của Backend **không** hiển thị.
- Mã đã ánh xạ thực sự tới được dialog: `INVALID_DATETIME`, `UNRESOLVABLE_TIMEZONE`, `INVALID_COORDINATES` (422), `RESOURCE_NOT_FOUND` (404: hồ sơ vừa bị xoá), `UNAUTHORIZED`, `MALFORMED_REQUEST`. Mã nội bộ (`CHART_CALCULATION_FAILED` 422, `INTERNAL_SERVER_ERROR` 500, `UNKNOWN_ERROR`) ⇒ câu fallback chung. `EPHEMERIS_PROVIDER_ERROR`/`DATA_INTEGRITY_ERROR` không tới client qua đường này (M1 §16).
- **Thử lại:** nút chính đổi nhãn thành "Thử lại" khi `isError`; cùng một handler; `mutate` mới tự xoá trạng thái lỗi cũ (không cần `reset()`).
- **Telemetry:** **không** gọi `reportError` trong dialog; mutation lỗi chưa ánh xạ đã được `queryClient.mutations.onError` báo một lần. Ghi nhận: `getErrorMessage` tự gọi `reportError` cho mã chưa ánh xạ ⇒ báo thêm một lần khi render (hành vi convention hiện tại của F3; KG-M3-05).
- Lỗi 401: interceptor làm mới token hoặc đăng xuất ⇒ `ProtectedRoute` xử lý; dialog không tự xử lý riêng.

## 20. Navigation After Success

1. `mutate({ profileId, houseSystem }, { onSuccess: (chart) => … })`.
2. **Kiểm tra id dùng được:** `isValidChartId(chart.id)` (Backend bảo đảm UUID; kiểm phòng thủ vì ranh giới tin cậy).
3. Hợp lệ ⇒ `navigate(\`/app/charts/${chart.id}\`)` (**push**, để Back về danh sách hồ sơ). Id lấy **từ response**, không dựng từ id hồ sơ (hợp đồng không nói chúng bằng nhau; chart có UUID riêng).
4. Không hợp lệ ⇒ **không điều hướng**; hiển thị `Alert danger` với câu fallback chung và gọi `reportError(new Error("Invalid chart id in calculate response"), "calculate-chart")` một lần (vi phạm hợp đồng thật sự; dùng hàm có sẵn).
5. Đóng/reset: điều hướng làm `BirthProfilesPage` unmount ⇒ dialog unmount; không cần `onClose` thủ công.
6. Cache đã được seed bởi hook M1 ⇒ trang chart có dữ liệu ngay, **không `GET`** (Mục 1 #6).
7. Nếu người dùng rời trang khi đang tính: `onSuccess` call-site không chạy; chart vẫn được lưu và cache vẫn được seed; chấp nhận.

## 21. Chart Detail Route

- **Đăng ký:** thêm `const ChartDetailPage = lazy(() => import("@pages/app/charts/detail/page"));` cạnh các trang `app`, và con của route `app` (cùng nhóm `AppLayout` > `Suspense` > `Outlet`): `{ path: "charts/:chartId", element: <ChartDetailPage /> }` ⇒ URL `/app/charts/:chartId` chính xác.
- **Bảo vệ:** thừa hưởng `ProtectedRoute` của `app`; không guard bổ sung.
- **Xung đột:** không có route `charts` nào khác; `/app/charts` (không id) ⇒ catch-all `NotFoundPage` (đã nêu, chấp nhận).
- **Lazy:** trang chỉ import `@features/chart` (barrel nhẹ: model/ui thuần), **không** có phụ thuộc trực quan hoá nặng (không thư viện chart). Thêm `TODO` hiện có vẫn giữ nguyên cho các route khác.
- **Export:** page là `export default function ChartDetailPage()` (khớp mẫu).

## 22. UUID Guard

- Dùng lại `isValidChartId` (`features/chart/api/isValidChartId.ts`; regex UUID 8-4-4-4-12, có test) — **không** tạo bản trùng, **không** Zod.
- `useChartQuery(chartId)` đã tự `enabled: false` khi id sai ⇒ **0 request**; page vẫn phải kiểm `isValidChartId(chartId)` **trước** để chọn trạng thái "không tìm thấy" (vì `isLoading=false`, `data=undefined`, `isError=false` ở trạng thái idle).
- Id sai ⇒ trạng thái **không tìm thấy** (cùng giao diện 404), **không** coi là lỗi mạng, **không** `reportError`.
- Gọi hook vô điều kiện (quy tắc hooks) rồi mới rẽ nhánh.

## 23. Chart Detail Page

`pages/app/charts/detail/page.tsx` (default export `ChartDetailPage`), cấu trúc:

```text
<Container className="py-8">
  <Link to="/app/profiles">← Hồ sơ sinh</Link>
  <h1 ref tabIndex={-1}>Lá số sinh</h1>      ← luôn hiển thị (mọi trạng thái)
  {body theo trạng thái}
</Container>
```

- **`h1`:** "Lá số sinh" cố định (không tên hồ sơ — FG-01). `tabIndex={-1}` và lớp `outline-none focus-visible:ring-2 ring-focus` để focus lập trình.
- **Thứ tự quyết định:** (1) id sai ⇒ NotFound; (2) `query.data` có ⇒ ánh xạ VM (dữ liệu **ưu tiên** hơn `isError` của một lần refetch nền); (3) `query.isLoading` ⇒ Skeleton; (4) `query.isError` ⇒ phân loại lỗi; (5) mặc định ⇒ Skeleton.
- **Không `fetch` trực tiếp**; không đọc token.
- **Phân loại lỗi** (hàm cục bộ, thuần, trong file page): `status === 404 \|\| errorCode === "RESOURCE_NOT_FOUND"` ⇒ `not-found`; `status === 403 \|\| errorCode === "FORBIDDEN"` ⇒ `forbidden`; `errorCode === "MALFORMED_REQUEST"` ⇒ `not-found` (id sai định dạng tới được server — không xảy ra khi guard hoạt động); `errorCode === "UNKNOWN_ERROR"` ⇒ `connection`; còn lại ⇒ `server`.
- `not-found` và `forbidden` **hiển thị chung** một giao diện (D-M3-2) nhưng giữ **khác nhau trong mã và test**.

## 24. ChartViewerSkeleton

- `features/chart/ui/ChartViewerSkeleton/{ChartViewerSkeleton.tsx, index.ts, test}`.
- Bọc: `<div role="status" aria-busy="true">` + `<span className="sr-only">Đang tải lá số…</span>`; các `Skeleton` (vốn `aria-hidden`) bên trong: dải metadata (3 dòng ngắn), khối vuông `aspect-square max-w-xl` (chỗ của wheel), 4–5 hàng bảng. Mục tiêu: giữ bố cục gần giống Shell ⇒ giảm layout shift.
- **Không** hiển thị lỗi khi tải; **không** chứa `h1` (page giữ `h1`).
- `motion-reduce` đã được `Skeleton` xử lý.

## 25. `useChartQuery` Integration

`const query = useChartQuery(chartId);` — giữ nguyên hợp đồng M1; page chỉ đọc `data`, `isLoading`, `isError`, `error`, `isFetching`, `refetch`. Nút "Thử lại" gọi `query.refetch()` với `isLoading={query.isFetching}`. Không thêm tuỳ chọn query mới; không chuyển mapping vào hook.

## 26. `toChartViewModel` and `useMemo`

```ts
const mapping = useMemo(() => {
  if (!query.data) return null;
  try { return { ok: true as const, vm: toChartViewModel(query.data) }; }
  catch (error) {
    if (error instanceof ChartViewModelError) return { ok: false as const, error };
    throw error;   // lỗi không dự kiến → nearest boundary (RootErrorBoundary)
  }
}, [query.data]);
```

| Mục | Quyết định |
|---|---|
| Phụ thuộc | `[query.data]` — tham chiếu ổn định (structural sharing); đổi khi dữ liệu thật sự đổi |
| Trước khi có dữ liệu | `null` ⇒ nhánh loading/idle |
| Chi phí | mapping rẻ (≤14 hành tinh); `useMemo` giữ **ổn định tham chiếu** `vm` cho các component con tương lai (Wheel/bảng/selection), không phải tối ưu hoá hiệu năng |
| Gọi hook | trước mọi `return` sớm; không gọi mapping trong JSX nhiều lần |
| Trùng lặp | duy nhất một chỗ gọi `toChartViewModel` (page); Shell/Notice nhận `vm` |
| Throw trong `useMemo` | được bắt **chỉ** cho `ChartViewModelError`; lỗi khác ném lại trong render ⇒ boundary |
| Test | thành công; `ChartViewModelError` (vd. `planets: null`); lỗi không dự kiến (mock) tới boundary |

## 27. `ChartViewModelError` Handling

| Câu hỏi | Quyết định (Confirmation #2) |
|---|---|
| Phân biệt được? | **Có**: `instanceof ChartViewModelError` (class thuần ES2023; `code === "MALFORMED_CHART_RESPONSE"` làm chứng cứ phụ) |
| Nguyên nhân | response vi phạm hợp đồng cấu trúc (lỗi Backend/hợp đồng), **không** phải HTTP 4xx/5xx |
| Phân loại | **lỗi mapping dự kiến** ⇒ trạng thái trang `invalid-data`; **không** gán nhãn 404/403 |
| UI | `EmptyState variant="danger"` "Dữ liệu lá số không hợp lệ" + mô tả "Lá số được tải về nhưng không thể hiển thị. Vui lòng thử lại sau." + nút "Thử lại" (`refetch`) và liên kết về hồ sơ |
| Telemetry | báo **một lần** bằng `reportError(error, "chart-view-model")` trong `useEffect([error])` — dùng hàm sẵn có (D-M3-5, cần owner xác nhận); không phải `issues` |
| Lỗi không dự kiến | không bắt; tới `RootErrorBoundary`; **không** tạo boundary mới; không để trang trắng |
| Hệ quả đã biết | `RootErrorBoundary` thay toàn màn hình (mất AppLayout) — chấp nhận (KG-M3-02) |

## 28. `issues` / `reportError` Decision

**`issues` thực chất là gì (S4.2):** danh sách chẩn đoán *dữ liệu*, tách thành bốn lớp:

| Lớp (prompt Mục 13) | Ví dụ trong S4.2 | Xử lý ở M3 |
|---|---|---|
| 1. Vấn đề validation/mapping | `UNKNOWN_VALUE`, `VALUE_OUT_OF_RANGE`, `DUPLICATE_ENTITY`, `ASPECT_ENDPOINT_MISSING` | **Bỏ qua** trong Shell (không hiển thị, không báo cáo); đi tiếp cho tầng sau (Wheel/bảng) |
| 2. Giới hạn dữ liệu có thể phục hồi | `houseDataAvailable=false`; `partialData` | Hiển thị bằng Alert (nhà: `HouseDataNotice`; `partialData`: Alert `warning` "Một số dữ liệu của lá số chưa thể hiển thị đầy đủ.") |
| 3. Exception thực sự | `ChartViewModelError` | Trạng thái lỗi trang + `reportError` một lần (Mục 27) |
| 4. Lỗi ứng dụng không dự kiến | lỗi render/lập trình | Boundary hiện có |

- **Không** thêm abstraction/phụ thuộc giám sát. **Không** `reportError` cho `issues` (Confirmation #3).
- `reportError` hiện có: `shared/lib/report-error.ts` (chỉ `console.error`); không tích hợp dịch vụ ngoài (quyết định tương lai).
- `partialData` luôn `false` với Backend hiện tại ⇒ Alert này là phòng thủ; có test bằng fixture biến đổi.

## 29. FG-01 Decision

`FG-01` giữ nguyên: Viewer **không** hiển thị tên hồ sơ; **không** thêm request tra hồ sơ; **không** chặn M3. Trang vẫn tự giải thích nhờ `h1` "Lá số sinh" và metadata riêng của chart (hệ nhà, thời điểm tính, phiên bản engine) cùng liên kết về `/app/profiles`. Backend `0.4.0` không đổi. Ghi trong Known Gaps (Mục 43).

## 30. `document.title` and Focus Management

**Không có tiện ích sẵn có** (Mục 1 #1) ⇒ xử lý **cục bộ trong `ChartDetailPage`**:

| Mục | Thiết kế |
|---|---|
| Title | `useEffect(() => { const previous = document.title; document.title = "Lá số sinh — AstroViet"; return () => { document.title = previous; }; }, [])` — hằng số cho mọi trạng thái; khôi phục khi rời trang (không có hạ tầng title toàn cục nên tránh rò rỉ); an toàn với `StrictMode` |
| Focus | `h1` có `ref` + `tabIndex={-1}`; `useEffect` chạy khi **`viewKind` hoặc `chartId` đổi** và `viewKind !== "loading"`: `headingRef.current?.focus()`. `viewKind ∈ {loading, ready, invalid-data, not-found, forbidden, connection, server}` |
| Không cướp focus khi refetch nền | refetch không đổi `viewKind` ⇒ effect không chạy |
| Sau "Thử lại" | `error → loading → ready` đổi `viewKind` ⇒ focus lại `h1` (nút Thử lại đã bị gỡ) |
| Đổi `chartId` cùng trang | `chartId` trong deps ⇒ focus lại sau khi tải |
| Hiển thị focus | `focus-visible:ring-2 ring-focus`; không `outline-none` đơn thuần |
| Trùng lặp | không tạo hook dùng chung; khi OQ-M8-1/2 được làm ở cấp ứng dụng, xoá hai effect này (KG-M3-04) |

**Test:** (T1) `document.title` đặt đúng và **khôi phục** khi unmount; (T2) `h1` có focus sau khi dữ liệu sẵn sàng; (T3) focus **không** đổi khi `refetch()` nền (đặt focus lên liên kết "← Hồ sơ sinh", gọi refetch, kiểm focus vẫn ở liên kết); (T4) focus `h1` ở trạng thái lỗi; (T5) focus lại sau retry thành công.

## 31. Loading / Error / Empty States

| Trạng thái | Giao diện | Ghi chú |
|---|---|---|
| `loading` | `ChartViewerSkeleton` | không flash lỗi |
| `not-found` (id sai / 404 / 400) | `EmptyState` (mặc định) "Không tìm thấy lá số" — "Lá số này không tồn tại hoặc bạn không có quyền xem." + nút `Button as={Link} to="/app/profiles"` "Về danh sách hồ sơ" | không retry |
| `forbidden` (403) | **cùng giao diện** `not-found` | cùng copy trung tính (D-M3-2); khác nhau ở mã/test |
| `connection` (`UNKNOWN_ERROR`) | `EmptyState danger` "Không thể kết nối" — "Không thể tải lá số. Vui lòng kiểm tra kết nối mạng và thử lại." + "Thử lại" | gồm cả 502/504 không body (không phân biệt được) |
| `server` (5xx khác, mã lạ) | `EmptyState danger` "Không thể tải lá số" — `getErrorMessage(errorCode)` + "Thử lại" | `getErrorMessage` có thể gọi `reportError` (convention) |
| `invalid-data` | `EmptyState danger` (Mục 27) | + "Thử lại" |
| `ready` | Viewer Shell (+ `HouseDataNotice` khi cần; + Alert `partialData`) | |
| **Empty (không có chart)** | **NOT APPLICABLE** | route luôn có `chartId`; hợp đồng không có "chart rỗng hợp lệ": chart hợp lệ luôn có 10 hành tinh; `planets=[]` là vi phạm hợp đồng ⇒ `partialData` + (nếu không có `ChartViewModelError`) Shell hiển thị bình thường kèm Alert `partialData`; **không** diễn giải trường tuỳ chọn thiếu là "chart rỗng" |

**Viewer Shell (`ready`)** — `features/chart/ui/ChartViewerShell/ChartViewerShell.tsx`, props `{ vm: ChartViewModel }`:
- Khối metadata `<dl>` trong `Card`: **Hệ nhà** (`vm.meta.houseSystem.labelVi`), **Tính lúc** (`<time dateTime={vm.meta.calculatedAt}>` + chuỗi định dạng `vi-VN` theo múi giờ người dùng — định dạng ở UI, vì model không được dùng `Intl`; helper nội bộ `formatCalculatedAt(iso)`), **Phiên bản engine** (`vm.meta.engineVersion`, chữ nhỏ mờ).
- `HouseDataNotice` (khi `!vm.flags.houseDataAvailable`), Alert `partialData` (khi `vm.flags.partialData`).
- **Placeholder** (`Card` nét đứt, `data-testid="chart-visualization-placeholder"`): "Biểu đồ tròn và các bảng hành tinh, nhà, góc chiếu sẽ xuất hiện ở đây." — không có wheel/bảng, không import phụ thuộc trực quan hoá.
- Không hiển thị `interpretations`, `issues`, `patterns`.

## 32. Data Flow Diagram

```text
Birth Profile Card ("Tính lá số")                     [pages/app/profiles/page.tsx]
      │ setCalculateTarget({id, displayName, isBirthTimeKnown})
      ▼
CalculateChartDialog  (mount-per-open; Modal)         [features/chart/ui]
      │ houseSystem: useState("Placidus")  ◄─ RadioGroup
      │ [isBirthTimeKnown=false ⇒ Alert info]
      ▼ submit (guard: !isPending)
useCreateNatalChartMutation → createNatalChart → POST /api/v1/charts/natal?save=true
      │                                   │
      │ pending: nút isLoading + role=status; Esc/X/overlay vô hiệu
      │ error  : Alert danger (getErrorMessage) · dialog mở · "Thử lại"
      ▼ 201 ChartResponse (id UUID)  →  hook: setQueryData(detail) · invalidate(lists)
      │ isValidChartId(id)? ── không ─► Alert danger + reportError (không điều hướng)
      ▼ có
navigate(`/app/charts/${id}`)   (push; dialog unmount cùng trang)
      ▼
ChartDetailPage  [lazy · ProtectedRoute · AppLayout]
      │ isValidChartId(param)? ── không ─► NotFound (0 request)
      ▼ có
useChartQuery(chartId)  ── cache đã seed ⇒ không GET │ cache rỗng ⇒ GET /api/v1/charts/:id
      │ loading ► ChartViewerSkeleton
      │ error   ► 404/403 NotFound(chung) · UNKNOWN_ERROR Connection · khác Server   (retry: refetch)
      ▼ data: ChartResponse
useMemo(() => toChartViewModel(data), [data])
      │ ChartViewModelError ► invalid-data (+ reportError 1 lần) · lỗi khác ► RootErrorBoundary
      ▼ ChartViewModel
ChartViewerShell (meta · HouseDataNotice · Alert partialData · placeholder)
      effects: document.title · focus h1 (theo viewKind/chartId)
```

## 33. State Ownership Matrix

| State | Loại | Chủ sở hữu | Vòng đời | Lý do |
|---|---|---|---|---|
| Dialog mở / hồ sơ được chọn | UI | `BirthProfilesPage` (`calculateTarget`) | khi trang còn mounted | mẫu `deletingProfile` sẵn có; một nguồn duy nhất |
| `houseSystem` | UI | `CalculateChartDialog` (`useState`) | một lần mở dialog | yêu cầu: cục bộ |
| Pending/lỗi tính | server state (mutation) | `useCreateNatalChartMutation` trong dialog | một lần mở dialog | tái dùng tầng dữ liệu; reset tự nhiên khi unmount |
| Chart response | server state | `useChartQuery` (TanStack cache) | vòng đời query | tái dùng tầng dữ liệu |
| `ChartViewModel` / `ChartViewModelError` | derived | `ChartDetailPage` (`useMemo`) | vòng render | ranh giới mapping |
| `viewKind` | derived | `ChartDetailPage` (biến thường) | vòng render | điều khiển nhánh UI + focus |
| Focus `h1`, `document.title` | side-effect cục bộ | `ChartDetailPage` (`useRef`/`useEffect`) | vòng đời trang | không hạ tầng toàn cục |
| Selected planet/aspect | — | **không có** ở M3 | — | S4.8 |
| Global/Zustand/Context mới | — | **không** | — | ngoài phạm vi |

## 34. Error-State Matrix

| Điều kiện | Nguồn phát hiện | Trạng thái UI | Retry | API call |
|---|---|---|---|---|
| UUID sai | `isValidChartId(chartId)` | `not-found` | Không | **Tránh** (`enabled:false`) |
| Đang tải | `query.isLoading` | Skeleton | — | Đang chạy |
| 404 | `ApiError.status 404` / `RESOURCE_NOT_FOUND` | `not-found` | Không | Hoàn tất |
| 400 `MALFORMED_REQUEST` | `ApiError.errorCode` | `not-found` | Không | Hoàn tất |
| 403 | `ApiError.status 403` / `FORBIDDEN` | `forbidden` (giao diện giống `not-found`) | Không | Hoàn tất |
| Mất mạng / 5xx không body | `errorCode === "UNKNOWN_ERROR"` | `connection` | Có | Thất bại |
| 5xx có body / mã lạ | `ApiError` còn lại | `server` | Có | Thất bại |
| 401 | interceptor `apiClient` | `ProtectedRoute` chuyển login (trang không xử lý) | — | Interceptor |
| `ChartViewModelError` | `useMemo` bắt `instanceof` | `invalid-data` | Có (refetch) | Thành công (dữ liệu hỏng) |
| Lỗi không dự kiến trong render | ném lại | `RootErrorBoundary` | Không | — |
| `isHouseDataAvailable=false` | `vm.flags.houseDataAvailable` | Shell + `HouseDataNotice` | — | Thành công |
| `partialData=true` | `vm.flags.partialData` | Shell + Alert `warning` | — | Thành công |
| Có `data` nhưng refetch nền lỗi | `data` ưu tiên | Shell (không hiện lỗi) | — | — |
| Không có chart | **NOT APPLICABLE** | — | — | — |
| **Dialog:** 422 `INVALID_DATETIME`… | `ApiError.errorCode` | Alert danger (mã đã ánh xạ) | Có | Hoàn tất |
| **Dialog:** 404 hồ sơ | `RESOURCE_NOT_FOUND` | Alert danger (câu chung "Không tìm thấy nội dung…") | Không có ích | Hoàn tất |
| **Dialog:** 500/`UNKNOWN_ERROR` | `ApiError` | Alert danger (fallback) | Có | Thất bại |
| **Dialog:** id phản hồi không hợp lệ | `isValidChartId` | Alert danger + `reportError` | Có | Thành công |

## 35. Component / Module Boundaries

**`features/chart/index.ts` (mới, Public API):**

```ts
export { CalculateChartDialog } from "./ui/CalculateChartDialog";
export type { CalculateChartTarget } from "./ui/CalculateChartDialog";
export { ChartViewerShell } from "./ui/ChartViewerShell";
export { ChartViewerSkeleton } from "./ui/ChartViewerSkeleton";
export { useChartQuery } from "./hooks/useChartQuery";
export { isValidChartId } from "./api/isValidChartId";
export { toChartViewModel, ChartViewModelError } from "./model/chartViewModel";
export type { ChartViewModel } from "./model/chartViewModel";
```

**Giữ nội bộ (không export):** `HouseDataNotice`, `formatCalculatedAt`, `chartKeys`, `useCreateNatalChartMutation` (chỉ dialog dùng), `labels`/`format`, hàm API, mock/fixture. Nếu S4.11 cần `useChartsQuery`/`chartKeys` thì export khi đó.

**Quy tắc:** pages import `@features/chart` (barrel) cho code mới; code F3 giữ import sâu như cũ (không sửa). Không `features/chart → pages` (không vòng); không `features/chart → features/birth-profile`. ESLint `boundaries` đang tắt ⇒ bảo đảm bằng grep ở M3.5.

---

## 36. Implementation Task Breakdown

Thứ tự: **M3.0 → (M3.1 → M3.2) ∥ (M3.3 → M3.4) → M3.5**.

### F4-M3.0 — Cổng xác nhận (không mã)
Owner xác nhận (hoặc chấp nhận mặc định) D-M3-5…D-M3-8 (Mục 40). Chặn: copy/tên component trong M3.1, M3.4.

### F4-M3.1 — CalculateChartDialog
1. **Objective:** dialog + kiểu `CalculateChartTarget` + barrel khởi tạo. 2. **Rationale:** gom toàn bộ logic tính vào một chỗ. 3. **Preconditions:** M3.0; S4.1/S4.2 đã xác minh. 4. **Inspect:** `Modal`, `Radio`, `Alert`, `Button`, `useCreateNatalChartMutation`, `BirthProfileForm/index.ts`, `error-messages.ts`. 5. **Change:** tạo `features/chart/ui/CalculateChartDialog/{CalculateChartDialog.tsx,index.ts,CalculateChartDialog.test.tsx}`, `features/chart/index.ts` (chỉ export dialog + kiểu). 6. **Steps:** (a) props; (b) `useState("Placidus")` + type guard; (c) options từ `KNOWN_HOUSE_SYSTEMS` + `resolveHouseSystem`; (d) notice giờ sinh; (e) handler submit (guard pending) + `mutate(…, {onSuccess})`; (f) kiểm `isValidChartId` + `navigate`; (g) pending/lỗi (Mục 19); (h) guard `onClose`/`closeOnOverlayClick`; (i) test. 7. **State:** cục bộ (Mục 17). 8. **API:** `POST /api/v1/charts/natal?save=true`. 9. **Tests:** Mục 38 nhóm D. 10. **Verify:** `npx vitest run src/features/chart/ui/CalculateChartDialog`; `npm run typecheck`; `npm run lint`. 11. **Acceptance:** Mục 44 (Dialog). 12. **Dependencies:** M3.0. 13. **Out of scope:** nút trên thẻ (M3.2), tạo hồ sơ trong dialog, `Modal` dismissible.

### F4-M3.2 — Profile Card Action Integration
1. **Objective:** nút "Tính lá số" + sở hữu state dialog ở trang hồ sơ. 3. **Preconditions:** M3.1. 4. **Inspect:** `profiles/page.tsx`, `page.test.tsx`, `Card`, `Stack`. 5. **Change:** sửa `pages/app/profiles/page.tsx`; **thêm** test vào `page.test.tsx` (không sửa test cũ). 6. **Steps:** (a) state `calculateTarget`; (b) nút primary `sm` đầu hàng hành động với `aria-label`; (c) ánh xạ `BirthProfile → CalculateChartTarget`; (d) render `{calculateTarget && <CalculateChartDialog …/>}`; (e) `flex-wrap` nếu cần; (f) test. 7. **State:** `calculateTarget` (page). 8. **API:** không thêm. 9. **Tests:** nhóm P (Mục 38). 10. **Verify:** `npx vitest run src/pages/app/profiles`. 11. **Acceptance:** nút hiện trên mỗi thẻ; hành động cũ còn; dialog nhận đúng hồ sơ. 12. **Dependencies:** M3.1. 13. **Out of scope:** tách `BirthProfileCard`, sửa form/xoá.

### F4-M3.3 — Chart Detail Route and Page States
1. **Objective:** route lazy + trang với guard/loading/lỗi (chưa có VM). 2. **Rationale:** hoàn thành khung điều hướng. 3. **Preconditions:** S4.1. 4. **Inspect:** `router.tsx`, `router.test.tsx`, `edit/page.tsx`, `EmptyState`, `Skeleton`. 5. **Change:** tạo `ChartViewerSkeleton/**`, `pages/app/charts/detail/page.tsx` (+ `page.test.tsx`), cập nhật `app/router.tsx`, `features/chart/index.ts`. 6. **Steps:** (a) skeleton + test; (b) trang: `useParams`, `isValidChartId`, `useChartQuery`; (c) phân loại lỗi; (d) các `EmptyState` + CTA; (e) `h1` + liên kết quay lại; (f) đăng ký route; (g) test. 7. **State:** không (dẫn xuất từ query). 8. **API:** `GET /api/v1/charts/:id`. 9. **Tests:** nhóm S, G (Mục 38). 10. **Verify:** `npx vitest run src/pages/app/charts src/features/chart/ui/ChartViewerSkeleton src/app/router.test.tsx`. 11. **Acceptance:** UUID sai không request; 404/403/mạng/5xx phân biệt được; route đúng. 12. **Dependencies:** S4.1 (đã xong). 13. **Out of scope:** VM, Shell, title/focus.

### F4-M3.4 — View Model Integration, Shell and Page Lifecycle
1. **Objective:** `useMemo(toChartViewModel)`, Shell, notice, title, focus. 3. **Preconditions:** M3.3, S4.2, M3.0. 4. **Inspect:** `chartViewModel.ts`, `labels.ts` (`WARNING_LABELS`), `Alert`. 5. **Change:** tạo `ChartViewerShell/**` (+ `HouseDataNotice`, `formatCalculatedAt`, tests); mở rộng `page.tsx`; cập nhật barrel. 6. **Steps:** (a) `useMemo` + bắt `ChartViewModelError`; (b) trạng thái `invalid-data` + `reportError` một lần; (c) Shell (`dl`, notice, `partialData`, placeholder); (d) title effect; (e) focus effect theo `viewKind`/`chartId`; (f) test. 7. **State:** derived. 8. **API:** không thêm. 9. **Tests:** nhóm V, L (Mục 38). 10. **Verify:** `npx vitest run src/pages/app/charts src/features/chart/ui`. 11. **Acceptance:** Mục 44 (Chart detail, Data semantics). 12. **Dependencies:** M3.3. 13. **Out of scope:** wheel, bảng, hiển thị `issues`/diễn giải/tên hồ sơ.

### F4-M3.5 — Integration, Regression and Quality Gates
1. **Objective:** kiểm tích hợp end-to-end bằng MSW + router; hồi quy; cổng chất lượng; Evidence Matrix. 3. **Preconditions:** M3.2, M3.4. 5. **Change:** tạo `src/app/chart-flow.integration.test.tsx`; thêm ca vào `app/router.test.tsx`; không đổi mã production (trừ sửa lỗi phát hiện). 6. **Steps:** (a) IT1 happy path qua `routesConfig` + store `authenticated`; (b) IT2 đường lỗi + retry; (c) IT3 deep link có `GET`; (d) test router; (e) grep ranh giới; (f) chạy toàn bộ cổng; (g) Evidence Matrix. 9. **Tests:** nhóm R, I. 10. **Verify:** Mục 42. 11. **Acceptance:** Mục 44 (Regression). 12. **Dependencies:** M3.2, M3.4. 13. **Out of scope:** E2E Playwright mới (S4.10).

## 37. Task Dependencies

```text
M3.0 ─┬─► M3.1 ─► M3.2 ─┐
      └─► M3.3 ─► M3.4 ─┴─► M3.5
```
M3.1–M3.2 và M3.3–M3.4 độc lập; hợp nhất ở M3.5. M3.3 chỉ cần S4.1.

## 38. Test Strategy

Khung hiện có: Vitest + Testing Library + MSW + `vitest-axe`; **không** thêm framework/dependency. Dữ liệu: `chartFull`, `chartNoHouses` (M1, CAPTURED); `mockBirthProfile`, `mockListBirthProfiles`. Dùng UUID thật cho `chartId`/`profile.id` ở test mới. Request counter bằng biến đếm trong resolver MSW. Không khẳng định chi tiết triển khai (số lần `useMemo`, tên class CSS).

**Kỹ thuật:** (i) trang chart: `renderWithProviders(<Routes><Route path="/app/charts/:chartId" element={<ChartDetailPage/>}/></Routes>, { initialEntries })` (mẫu `profiles/page.test.tsx`); (ii) refetch nền / focus: tự dựng `QueryClientProvider` với client lộ ra (như `router.test.tsx`); (iii) lỗi không dự kiến: file riêng `page.unexpected-error.test.tsx` dùng `vi.mock` cho `toChartViewModel` + `createMemoryRouter` có `errorElement`; (iv) mạng: `HttpResponse.error()`; (v) hợp đồng body: bắt `request` trong resolver, `url.searchParams.get("save") === "true"`.

## 39. Test Matrix

**Nhóm D — `CalculateChartDialog.test.tsx` (≈14)**

| ID | Kịch bản | Kỳ vọng |
|---|---|---|
| D1 | mở dialog | tiêu đề, tên hồ sơ trong mô tả, radio "Placidus" **checked** mặc định |
| D2 | chọn "Whole Sign" | Whole Sign checked, Placidus unchecked |
| D3 | submit mặc định | `POST` đúng: `save=true`, body `{birthProfileId, houseSystem:"Placidus", includeOptionalPoints:[]}` |
| D4 | chọn Whole Sign rồi submit | body `houseSystem:"WholeSign"` (enum, không phải nhãn) |
| D5 | đang chờ (resolver trì hoãn) | nút `aria-busy`, có `role=status` "Đang tính…", click lần hai **không** phát request thứ hai (đếm = 1), "Hủy" disabled |
| D6 | đang chờ + Esc / click overlay / nút X | `onClose` **không** được gọi |
| D7 | `isBirthTimeKnown=false` | có notice; `true` ⇒ không có notice; copy dùng "có thể" (không khẳng định chắc chắn) |
| D8 | 422 `INVALID_DATETIME` | `Alert` danger có câu đã ánh xạ; dialog vẫn mở; lựa chọn Whole Sign giữ nguyên; nút đổi thành "Thử lại" |
| D9 | thử lại thành công sau lỗi | điều hướng tới `/app/charts/{id}` |
| D10 | 500 `INTERNAL_SERVER_ERROR` | câu fallback chung, **không** hiển thị `message` thô |
| D11 | thành công | điều hướng bằng **id trong response** (≠ id hồ sơ) |
| D12 | response có id không hợp lệ | không điều hướng; Alert danger; `reportError` (console.error) được gọi |
| D13 | "Hủy" khi rảnh | `onClose` được gọi |
| D14 | mount lại với hồ sơ khác sau lỗi/Whole Sign | trở về Placidus, không còn lỗi, tên hồ sơ mới |
| D15 | `axe` trên dialog | không vi phạm |

**Nhóm P — `profiles/page.test.tsx` (thêm ≈5, không sửa cũ)**

| ID | Kịch bản | Kỳ vọng |
|---|---|---|
| P1 | mỗi thẻ có nút "Tính lá số cho hồ sơ {tên}" | đủ số thẻ |
| P2 | bấm nút | dialog hiện với đúng tên hồ sơ |
| P3 | hồ sơ `isBirthTimeKnown:false` | notice trong dialog |
| P4 | "Sửa"/"Xóa" vẫn hoạt động | các test cũ nguyên vẹn + thêm 1 xác nhận |
| P5 | "Hủy" đóng dialog; mở lại ⇒ Placidus | reset |

**Nhóm S/G/V/L — `pages/app/charts/detail/page.test.tsx` (≈20)**

| ID | Kịch bản | Kỳ vọng |
|---|---|---|
| S1 | đang tải | skeleton (`role=status`), chưa có lỗi, `h1` có mặt |
| S2 | `/app/charts/not-a-uuid` | trạng thái not-found; **0 request** |
| S3 | 404 | "Không tìm thấy lá số" + liên kết `/app/profiles`; không có "Thử lại" |
| S4 | 403 | **cùng** giao diện S3 (khẳng định văn bản); không retry |
| S5 | mạng (`HttpResponse.error()`) | trạng thái connection + "Thử lại"; bấm retry ⇒ request lần hai thành công ⇒ Shell |
| S6 | 500 `INTERNAL_SERVER_ERROR` | trạng thái server + "Thử lại" |
| S7 | `data` có + refetch nền lỗi | vẫn hiện Shell |
| V1 | thành công `chartFull` | `h1` "Lá số sinh"; "Placidus"; `<time dateTime=…>`; engine version; placeholder; **không** có notice nhà |
| V2 | `chartNoHouses` | `HouseDataNotice` có mặt; **không** `role=alert` lỗi; câu chữ **không** chứa "giờ sinh" như nguyên nhân khẳng định; vẫn có placeholder |
| V3 | `houses=[]` + warning `HOUSE_SYSTEM_NOT_CONVERGING` | thêm câu nguyên nhân từ Backend |
| V4 | `planets: null` | trạng thái invalid-data (không phải 404/403); `reportError` đúng 1 lần; "Thử lại" gọi lại GET |
| V5 | diễn giải rác/`null` | Shell hiển thị bình thường |
| V6 | hành tinh lạ (issue `UNKNOWN_VALUE`) | Shell bình thường; **không** Alert phụ; `console.error` **không** được gọi (issues không báo cáo) |
| V7 | bỏ một hành tinh (`partialData`) | Alert warning "Một số dữ liệu…" |
| V8 | không hiển thị tên hồ sơ | không có text tên (FG-01) |
| V9 | `axe` trên Shell | không vi phạm |
| L1 | `document.title` | đặt đúng; khôi phục khi unmount |
| L2 | focus `h1` sau khi tải | `toHaveFocus` |
| L3 | refetch nền | focus không bị cướp (đặt focus lên liên kết, `refetch`, vẫn ở liên kết) |
| L4 | focus `h1` ở trạng thái lỗi và sau retry thành công | đúng |
| U1 | `page.unexpected-error.test.tsx`: mock `toChartViewModel` ném `TypeError` | tới `errorElement` giả (không trang trắng, không bị nuốt) |

**Nhóm R — `app/router.test.tsx` (thêm ≈5)**

| ID | Kịch bản | Kỳ vọng |
|---|---|---|
| R1 | `authenticated` + `/app/charts/<uuid>` (MSW GET) | `h1` "Lá số sinh" **trong** `AppLayout` (có nav "Điều hướng chính") |
| R2 | `unauthenticated` + `/app/charts/<uuid>` | chuyển tới đăng nhập |
| R3 | `/app/charts/abc` | not-found trong trang, 0 `GET` |
| R4 | `/app/charts` | `NotFoundPage` |
| R5 | Suspense fallback xuất hiện trước khi trang lazy tải | `status` "Đang tải trang…" rồi nội dung |

**Nhóm I — `src/app/chart-flow.integration.test.tsx` (3)**

| ID | Kịch bản | Kỳ vọng |
|---|---|---|
| I1 | `routesConfig` + `authenticated`: `/app/profiles` → bấm "Tính lá số cho hồ sơ …" → chọn "Whole Sign" → "Tính lá số" → MSW `201` (`{ ...chartFull, houseSystem: "WholeSign" }`) → điều hướng → Shell hiện "Whole Sign" | **không** có `GET` (handler `GET` không đăng ký; `onUnhandledRequest:"error"` sẽ làm test hỏng nếu có) |
| I2 | đường lỗi: `POST` 422 `INVALID_DATETIME` → Alert; vẫn ở trang hồ sơ; retry `201` → Shell | |
| I3 | deep link `/app/charts/<uuid>` (cache rỗng) → MSW `GET` → Shell | `GET` đúng một lần |

## 40. Required Decision Records

| ID | Quyết định | Bằng chứng | Phương án khác | Hệ quả | Triển khai được ngay? |
|---|---|---|---|---|---|
| D-M3-1 | `houseSystem` là **state cục bộ** trong `CalculateChartDialog` | F4 plan §26; không store chart nào | Context/Zustand | reset tự nhiên theo lần mở | **Đã duyệt (APPROVED)** |
| D-M3-2 | 404 và 403 **cùng giao diện trung tính**, tách biệt trong mã/test | F3 `edit/page.tsx` gộp; F4 plan §30/§512; Backend trả 403 riêng (`assertChartOwnership`) | UX khác nhau (rò rỉ tồn tại) | thông điệp "không tồn tại hoặc không có quyền" | **Đã duyệt (APPROVED)** |
| D-M3-3 | Dialog **mount theo lần mở** (`{target && <Dialog/>}`), không có prop `open` | `Modal` không có chế độ dismissible; reset state tự nhiên; tránh effect/`key` | luôn mount + `isOpen`; snapshot hồ sơ | mất hoạt ảnh đóng; đơn giản và không rò state | **Đã duyệt (APPROVED)** |
| D-M3-4 | **Không** thêm Error Boundary mới; `ChartViewModelError` ⇒ trạng thái trang; lỗi khác ⇒ `RootErrorBoundary` | `router.tsx` chỉ có `errorElement` gốc; Confirmation #2; prompt §12 | `errorElement` cho route chart | lỗi không dự kiến mất layout (KG-M3-02) | **Đã duyệt (APPROVED)** |
| D-M3-5 | `ChartViewModelError` và id phản hồi sai ⇒ `reportError` **một lần** bằng hàm sẵn có; `issues` **không** báo cáo | `report-error.ts` đã tồn tại; Confirmation #3 ("chỉ báo nếu đã có convention và thực sự cần") | không báo cáo gì | tín hiệu cho lỗi hợp đồng thật | **Đã duyệt (APPROVED)** |
| D-M3-6 | Notice viewer chỉ nêu sự kiện hợp đồng; **bỏ** câu về Mặt Trăng và "thường do chưa biết giờ sinh" của F4 plan §31 | Confirmation #5; FG-01; builder (`houses=[]` có hai nguyên nhân) | giữ F4 plan §31 | viewer ít thông tin hơn nhưng trung thực | **Đã duyệt (APPROVED)** |
| D-M3-7 | Copy dialog/notice/mô tả hệ nhà (Mục 16, 18, 31) là **chuẩn ngữ nghĩa** | Duyệt copy thống nhất | chỉnh câu chữ | hằng chuỗi đã chốt | **Đã duyệt (APPROVED)** |
| D-M3-8 | Đổi tên `UnknownTimeNotice` → `HouseDataNotice` | tên cũ ngụ ý nguyên nhân (trái Confirmation #5) | giữ tên cũ | đặt tên trung thực với hợp đồng | **Đã duyệt (APPROVED)** |
| D-M3-9 | `toChartViewModel` gọi bằng `useMemo` ở page, deps `[query.data]`; hook không đổi | Confirmation #1; Arch Spec §8.4 lệch có chủ đích (KG-M2-05) | `select` trong hook | giữ DTO trong cache | **Đã duyệt (APPROVED)** |
| D-M3-10 | `title`/focus **cục bộ**; không tạo hook dùng chung | OQ-M8-1/2 còn mở; không có tiện ích | `useDocumentTitle` dùng chung | sẽ gỡ khi Core xử lý (KG-M3-04) | **Đã duyệt (APPROVED)** |
| D-M3-11 | Dialog nhận `CalculateChartTarget` cục bộ | Architecture Spec §2.2 (không import chéo feature) | import `BirthProfile` | page ánh xạ 3 trường | **Đã duyệt (APPROVED)** |
| D-M3-12 | FG-01 giữ nguyên; không tra tên hồ sơ | prompt §14; Confirmation #4 | thêm request | header chỉ `Lá số sinh` | **Đã duyệt (APPROVED)** |
| D-M3-13 | Không global state; Zustand ngoài phạm vi; chỉ placeholder cho visualization; không bảng/danh sách | prompt §21 | — | — | **Đã duyệt (APPROVED)** |

## 41. File Change Map

**A. File hiện có sẽ được sửa (xác nhận tồn tại)**

| File | Hành động | Mục đích | Task | Độ tin cậy |
|---|---|---|---|---|
| `frontend/src/pages/app/profiles/page.tsx` | Modify | nút "Tính lá số", state `calculateTarget`, render dialog | M3.2 | Cao |
| `frontend/src/pages/app/profiles/page.test.tsx` | Modify (chỉ **thêm**) | test P1–P5 | M3.2 | Cao |
| `frontend/src/app/router.tsx` | Modify | `lazy` + route `charts/:chartId` | M3.3 | Cao |
| `frontend/src/app/router.test.tsx` | Modify (chỉ **thêm**) | test R1–R5 | M3.5 | Cao |

**B. File mới (dự kiến tạo)**

| File | Mục đích | Task | Độ tin cậy |
|---|---|---|---|
| `frontend/src/features/chart/index.ts` | Public API | M3.1 (mở rộng M3.3/M3.4) | Cao |
| `frontend/src/features/chart/ui/CalculateChartDialog/{CalculateChartDialog.tsx,index.ts,CalculateChartDialog.test.tsx}` | Dialog | M3.1 | Cao |
| `frontend/src/features/chart/ui/ChartViewerSkeleton/{ChartViewerSkeleton.tsx,index.ts,ChartViewerSkeleton.test.tsx}` | Skeleton | M3.3 | Cao |
| `frontend/src/features/chart/ui/ChartViewerShell/{ChartViewerShell.tsx,HouseDataNotice.tsx,formatCalculatedAt.ts,index.ts,*.test.tsx/ts}` | Shell + notice + định dạng ngày | M3.4 | Trung bình (tên theo D-M3-8) |
| `frontend/src/pages/app/charts/detail/page.tsx` | Trang chi tiết | M3.3–M3.4 | Cao |
| `frontend/src/pages/app/charts/detail/page.test.tsx` | Test trang (S/G/V/L) | M3.3–M3.4 | Cao |
| `frontend/src/pages/app/charts/detail/page.unexpected-error.test.tsx` | Test lỗi không dự kiến (mock riêng) | M3.4 | Trung bình |
| `frontend/src/app/chart-flow.integration.test.tsx` | Tích hợp I1–I3 | M3.5 | Cao |
| `docs/implementation/archive/sprint-f4/Sprint_F4_M3_Exit_Criteria_Evidence_Matrix.md` | Hồ sơ đóng | M3.5 | Cao |

**C. File có thể thay đổi tuỳ phát hiện khi triển khai**

| File | Điều kiện |
|---|---|
| `features/chart/api/mocks/handlers.ts` | chỉ khi thiếu helper (vd. phản hồi `HttpResponse.error()` đã có sẵn trong MSW, nên có thể không cần) |
| `shared/lib/error-messages.ts` | chỉ nếu phát hiện mã lỗi tới được client mà chưa có câu |
| `docs/implementation/Sprint_F4_Implementation_Plan.md` | ghi chú lệch §31 (không bắt buộc) |

**Không chạm:** `features/chart/api|hooks|model`, `shared/ui/**` (kể cả `Modal`), `shared/api/**`, `src/test/{setup,render,msw-server}.ts`, `features/auth|birth-profile/**`, `backend/**`, `package.json`, cấu hình ESLint/TS/Vite/CI, `AppLayout`.

## 42. Quality Gates

Chỉ dùng lệnh có trong `frontend/package.json`:

| Lệnh | Mục đích | Khi chạy | Bằng chứng | Release gate |
|---|---|---|---|---|
| `npx vitest run <đường dẫn>` | phản hồi nhanh theo task | mỗi bước | exit 0 | Không |
| `npm run typecheck` (`tsc -p tsconfig.app.json --noEmit`) | kiểm kiểu **thật** (gồm test) | cuối mỗi task | exit 0 | **Có** |
| `npm run lint` | ESLint (hooks, a11y, import order) | cuối mỗi task | exit 0, 0 cảnh báo | **Có** |
| `npm run format:check` | Prettier | cuối mỗi task (`npm run format` để sửa) | exit 0 | **Có** |
| `npm test` | toàn bộ test | cuối task; bắt buộc ở M3.5 | exit 0; không giảm số test cũ (baseline 90 file / 558 test) | **Có** |
| `npm run test:coverage` | CI chạy lệnh này | M3.5 | exit 0; báo cáo | **Có** (không ngưỡng mới; mục tiêu mã mới ≥ 90% dòng) |
| `npm run build` | `tsc` + `vite build` | M3.5 | exit 0 | **Có** |
| `npm run test:e2e` | Playwright (cần Backend + Postgres) | **chỉ CI** | `birth-profile.spec.ts` vẫn xanh (selector "Sửa"/"Xóa" không đổi) | Có (CI) |
| Grep ranh giới | giữ kiến trúc | M3.5 | 0 kết quả | **Có** |

```bash
cd frontend/src
grep -rnE "fetch\(|axios\.create" features/chart/ui pages/app/charts          # kỳ vọng rỗng
grep -rnE "features/birth-profile" features/chart                               # kỳ vọng rỗng (import chéo)
grep -rnE "from \"@pages|from \"@app" features/chart                            # kỳ vọng rỗng (vòng)
grep -rnE "zustand|createContext|useReducer" features/chart/ui pages/app/charts # kỳ vọng rỗng (state toàn cục)
grep -rnE "as unknown as|: any|eslint-disable" features/chart/ui pages/app/charts
```

Bằng chứng chấp nhận: Frontend CI xanh **trên đúng commit cuối** + log các lệnh trên (CI không chạy grep). Mình **chưa chạy** bất kỳ test M3 nào (chưa tồn tại); các số liệu ở Mục 1/5 là baseline trước M3.

## 43. Known Gaps / Technical Debt

| ID | Vấn đề | Phân loại |
|---|---|---|
| **FG-01** | Viewer không hiển thị tên hồ sơ (`ChartResponse` không có `birthProfileId`) | **Accepted Known Gap** — M3 không giải quyết; tương lai cần task riêng đã duyệt |
| KG-M3-01 | `UnknownTimeNotice` (F4 plan) đổi tên/nội dung (D-M3-6/8); F4 plan §31 lỗi thời ở điểm Mặt Trăng | Requires a separate decision (D-M3-8) + Accepted |
| KG-M3-02 | Chỉ có `RootErrorBoundary` (mất AppLayout); không có boundary theo route/feature | Deferred (Core) |
| KG-M3-03 | `Modal` thiếu chế độ không-thể-đóng; M3 dùng guard phía consumer (X/Esc thành no-op khi đang tính) | Accepted — cải tiến `shared/ui` để sau |
| KG-M3-04 | Thiếu hạ tầng `<title>` động/focus sau điều hướng (OQ-M8-1/2); M3 làm cục bộ | Deferred (Core) — gỡ effect cục bộ khi có hạ tầng |
| KG-M3-05 | `getErrorMessage` có side-effect `reportError` khi render ⇒ có thể báo lặp (cả với mutation lỗi chưa ánh xạ) | Accepted (convention F3); ngoài phạm vi |
| KG-M3-06 | `ApiError` không phân biệt mất mạng và 5xx không body (`UNKNOWN_ERROR`) | Accepted — gộp thành `connection` |
| KG-M3-07 | Dialog mất hoạt ảnh đóng do mount-theo-lần-mở (D-M3-3) | Accepted |
| KG-M3-08 | `index.html` `<html lang="en">` cho giao diện tiếng Việt | Deferred — responsive/accessibility hardening (S4.9) |
| KG-M3-09 | Sidebar/drawer chưa có mục lá số; `/app/charts` (không id) rơi vào `NotFoundPage` | Deferred — S4.11 |
| KG-M3-10 | Chính tả/định dạng ngày hiển thị phụ thuộc locale/múi giờ người dùng (`formatCalculatedAt`) — test chỉ khẳng định `dateTime` attribute | Accepted |
| KG-F4M1-03/12/14 | diễn giải đổi theo version (F5); cảnh báo Node 20 của action; chính tả | Kế thừa, không đụng |
| Kế thừa | KG-S4-06 (Moon khi thiếu giờ), G-02 `birthProfileLabel=null`, G-13 patterns stub | Kế thừa, không đụng |

## 44. Risks and Mitigations

| ID | Rủi ro | Khả năng | Tác động | Giảm thiểu | Chặn M3? |
|---|---|---|---|---|---|
| R-1 | Phản hồi tính thiếu/ sai `id` | Thấp (Zod uuid ở Backend) | Cao | `isValidChartId` + Alert + `reportError` (D12) | Không |
| R-2 | Notice dùng sai nhân quả | TB | Cao (mất tin cậy) | hai notice tách bạch; copy dùng "có thể"; test khẳng định văn bản không khẳng định chắc chắn | Không |
| R-3 | Lỗi mapping bị coi là 404/403 hoặc bị nuốt | TB | TB | `instanceof` + trạng thái riêng + test V4/U1 | Không |
| R-4 | Dialog rò state giữa hồ sơ | Thấp | TB | mount theo lần mở + test D14 | Không |
| R-5 | `ApiError` không tách 403/404/mạng chính xác | TB | Thấp | phân loại theo `status` + `errorCode` + gộp UX | Không |
| R-6 | Focus cướp khi refetch nền | TB | TB | phụ thuộc `viewKind`/`chartId`, không phụ thuộc đối tượng dữ liệu; test L3 | Không |
| R-7 | `getErrorMessage` báo lặp trong render (`StrictMode` ×2 ở dev) | Cao | Thấp | `useMemo` theo `error`; ghi KG-M3-05 | Không |
| R-8 | Route lazy xung đột với guard | Thấp | TB | cùng nhóm `app`; test R1–R3, R5 | Không |
| R-9 | MSW/fixture lệch Backend | Thấp | TB | dùng fixture CAPTURED M1; body `POST` kiểm đúng | Không |
| R-10 | Thẻ hồ sơ chật trên 320px (3 nút) | TB | Thấp | `flex-wrap`; kiểm thủ công | Không |
| R-11 | Hồi quy test trang hồ sơ (truy vấn theo tên/role) | Thấp | TB | `aria-label` riêng; chỉ thêm test; chạy full suite | Không |
| R-12 | E2E `birth-profile.spec.ts` hỏng vì nút mới | Thấp | TB | tên nút không chứa "Sửa"/"Xóa" (tên hồ sơ E2E có "Đã sửa" nhưng role `button` khác role `link` của "Sửa") — chạy lại trên CI | Không |
| R-13 | `Modal` đóng bằng Esc khi đang tính | Cao nếu không guard | TB | guard `onClose` + test D6 | Không |
| R-14 | Phình scope sang wheel/bảng/tên hồ sơ | TB | TB | Out of Scope rõ; review diff | Không |
| R-15 | Phụ thuộc M1/M2 sai lệch | Thấp | Cao | đã xác minh [C-run] | Không |

## 45. Acceptance Criteria

**Hành động tính:** mỗi thẻ hồ sơ có "Tính lá số" · "Sửa/Xóa" vẫn hoạt động · dialog nhận đúng hồ sơ · không gửi trùng khi đang tính (D5).
**Dialog:** Placidus mặc định (D1) · chọn được Whole Sign (D2) · `houseSystem` chỉ là state trong dialog (grep Mục 42) · body/`save=true` đúng, enum không phải nhãn (D3/D4) · notice dùng từ "có thể" (D7) · loading/lỗi có `role` và `aria-busy` (D5/D8) · điều hướng bằng id trong response (D11).
**Route:** `/app/charts/:chartId` đăng ký (R1) · lazy + `Suspense` (R5) · `ProtectedRoute` giữ nguyên (R2).
**Trang chart:** id sai không request (S2) · dùng `useChartQuery` · loading/404/403/mạng/5xx phân biệt (S1–S6) · `ChartViewModelError` ⇒ trạng thái riêng, không bị coi là 404/403 (V4) · `document.title` + `h1` (L1/V1) · focus không bị cướp khi refetch (L3) · Shell hiển thị metadata (V1) · FG-01 giữ nguyên (V8).
**Ngữ nghĩa dữ liệu:** thiếu nhà không phải lỗi tính (V2) · không bịa nhà/góc · viewer không nêu nguyên nhân không có căn cứ (V2/V3) · diễn giải không làm hỏng trang (V5) · `issues` không báo cáo (V6) · không tính toán chiêm tinh ở frontend.
**Hồi quy:** test cũ của router/hồ sơ nguyên vẹn (chỉ thêm) · toàn bộ test pass (≥ 558 + mới) · I1–I3 pass · `typecheck`, `lint`, `format:check`, `build` exit 0 · CI Frontend xanh trên commit cuối.

## 46. Definition of Done

```text
M3.0 chốt copy/tên/báo cáo → M3.1 dialog → M3.2 nút trên thẻ
                         → M3.3 route + trạng thái → M3.4 VM + Shell + title/focus
→ M3.5 tích hợp MSW + router + hồi quy → mọi cổng xanh → Evidence Matrix M3 → M3 hoàn tất
```

Đồng thời: `git diff --stat` chỉ gồm file ở Mục 41 (A/B) + Evidence Matrix; không dependency mới; không state toàn cục; FG-01 còn nguyên; blueprint M3 được xoá khi đóng.

## 47. Final Architect Review

| Hạng mục | Đánh giá |
|---|---|
| S4.1/S4.2 sẵn sàng | Xác minh bằng mã + chạy lệnh: sẵn sàng, không chặn |
| Tương thích hợp đồng API | `POST` 201 có `id` UUID; `GET` 403/404/400 khớp mã Backend (tĩnh); chưa chạy Backend |
| Vòng đời tính | pending/lỗi/thành công/id sai đều có hành vi và test; cache seed ⇒ không `GET` sau điều hướng |
| Route & lazy | cùng nhóm `app`; không phụ thuộc nặng |
| Đúng trạng thái lỗi | phân loại bằng `status`+`errorCode`; hạn chế `UNKNOWN_ERROR` được nêu |
| Sở hữu mapping VM | một chỗ (`useMemo` ở page); hook không biết trình bày |
| `issues`/báo cáo | tách bốn lớp; dùng `reportError` sẵn có cho lỗi hợp đồng thật; `issues` không báo cáo |
| FG-01 | giữ nguyên |
| Notice | tách notice hồ sơ (sự kiện) và notice viewer (không suy diễn); mâu thuẫn F4 plan §31 được giải theo Confirmation |
| Đơn giản state | không store; một `useState` ở page, một ở dialog |
| Test | ≈55 test mới + tích hợp; không đổi test cũ |
| Kiểm soát phạm vi | wheel/bảng/danh sách/tên hồ sơ ngoài phạm vi |
| Blocker | **Không có** |

## 48. Final Recommendation

**`READY FOR IMPLEMENTATION`**

Không có điều kiện chặn: S4.1, S4.2 và M2 đã được xác minh; toàn bộ các quyết định D-M3-1..D-M3-13 đã được Owner phê duyệt chính thức (F4-M3.0 đã hoàn tất).

**Kết quả phê duyệt F4-M3.0 (Owner approved):**
1. **D-M3-5:** Ghi nhận lỗi `ChartViewModelError` và ID phản hồi sai bằng `reportError` một lần; `issues` không gọi `reportError`.
2. **D-M3-6 / D-M3-8:** Bỏ câu về Mặt Trăng và nguyên nhân khỏi notice trong viewer; đổi tên thành `HouseDataNotice` trung thực với hợp đồng.
3. **D-M3-2:** 404 và 403 hiển thị chung một giao diện trung tính "Không tìm thấy lá số".
4. **D-M3-7:** Duyệt câu chữ tiếng Việt cho dialog, notices và mô tả hệ nhà (Placidus / Whole Sign).

Thứ tự thực thi: **M3.0 (DONE) → (M3.1 → M3.2) ∥ (M3.3 → M3.4) → M3.5**; mỗi task kết thúc bằng `typecheck` + `lint` + `format:check` + test liên quan, dừng lại để owner review trước khi chuyển task tiếp theo, và CI xanh trước khi đóng M3.
