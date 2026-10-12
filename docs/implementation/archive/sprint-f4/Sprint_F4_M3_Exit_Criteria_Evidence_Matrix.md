# Sprint F4 — M3 Exit Criteria Evidence Matrix

## Calculate Flow & Chart Viewer Shell

**Vị trí lưu:** `docs/implementation/archive/sprint-f4/Sprint_F4_M3_Exit_Criteria_Evidence_Matrix.md`  
**Phạm vi:** F4-M3.0 → M3.5 (Tasks 1–5: `CalculateChartDialog`, Profile card action, Chart detail route/states, `ChartViewerShell` + ViewModel integration, Integration & Quality gates).  
**Commit được đánh giá:** HEAD `dev`. Ngày review: 2026-10-12.  
**Nguồn bằng chứng:** `[repo]` đọc mã/diff; `[run]` chạy lệnh thực tế trên môi trường; `[owner]` owner cung cấp.  
**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `ACCEPTED GAP` · `NOT APPLICABLE`.

## Kết luận

**`PASS WITH KNOWN GAPS`** — toàn bộ các tiêu chí nghiệm thu của Sprint F4 M3 đã hoàn thành và đạt chất lượng:

1. **Luồng người dùng hoàn chỉnh**: Hồ sơ sinh (`/app/profiles`) → bấm "Tính lá số" → `CalculateChartDialog` (chọn hệ nhà, notice giờ sinh, guard chống đóng khi pending) → điều hướng bằng response ID → Viewer Shell (`/app/charts/:chartId`).
2. **Trang chi tiết & Quản lý trạng thái**: Route lazy `/app/charts/:chartId` trong `AppLayout`, `ChartViewerSkeleton` khi loading, phân loại lỗi chuẩn (404/403 trung tính, lỗi mạng, 500, và `ChartViewModelError` hiển thị trạng thái hỏng dữ liệu riêng biệt không bị nuốt).
3. **Hiển thị trung thực & A11y**: `ChartViewerShell` render metadata chuẩn từ ViewModel, `HouseDataNotice` trung thực theo hợp đồng Backend (không suy diễn nguyên nhân, tuân thủ D-M3-6/8), focus quản lý chủ động vào `h1`, `<title>` đồng bộ, kiểm tra axe không có vi phạm.
4. **Cổng chất lượng repo tuyệt đối**: Toàn bộ 5 quality gates đều exit 0 (`format:check`, `lint`, `typecheck`, `build` và full test suite **98 test files, 619 tests passed** 100%).
5. **Ranh giới kiến trúc & Bảo toàn ranh giới**: 0 vi phạm (0 raw `fetch`/`axios.create`, 0 import chéo giữa `chart` và `birth-profile`, 0 circular dependency, 0 new global state, 0 `any` hay `as unknown as` trong mã production).

---

## 1. Bằng chứng kỹ thuật theo tiêu chí (Acceptance Criteria)

| ID       | Tiêu chí nghiệm thu                                                                                        | Bằng chứng kiểm chứng                                                                                           | Nguồn | Trạng thái |
| -------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----- | ---------- |
| EV-M3-01 | Nút "Tính lá số" trên từng thẻ hồ sơ sinh                                                                  | `profiles/page.tsx`, `profiles/page.test.tsx` test P1 (`aria-label="Tính lá số cho hồ sơ {tên}"`)               | [run] | VERIFIED   |
| EV-M3-02 | Các thao tác hiện có "Sửa" và "Xóa" hồ sơ giữ nguyên hoạt động                                             | `profiles/page.test.tsx` test P4, các test suite cũ của `profiles/page.test.tsx` nguyên vẹn                     | [run] | VERIFIED   |
| EV-M3-03 | Dialog nhận đúng snapshot thông tin hồ sơ qua contract `CalculateChartTarget`                              | `CalculateChartDialog.tsx`, `CalculateChartDialog.test.tsx` test D1, D14; `profiles/page.test.tsx` test P2      | [run] | VERIFIED   |
| EV-M3-04 | Placidus là hệ nhà mặc định; lựa chọn được lưu cục bộ trong dialog                                         | `CalculateChartDialog.tsx` (`useState<HouseSystem>("Placidus")`), test D1, D2, D14, P5                          | [run] | VERIFIED   |
| EV-M3-05 | Cho phép chọn Whole Sign; gửi đúng enum `WholeSign` lên API Backend                                        | `CalculateChartDialog.test.tsx` test D2, D4 (body `houseSystem: "WholeSign"`, `save: true`)                     | [run] | VERIFIED   |
| EV-M3-06 | Notice giờ sinh trong dialog khi `isBirthTimeKnown: false` dùng từ ngữ "có thể"                            | `CalculateChartDialog.test.tsx` test D7, `profiles/page.test.tsx` test P3                                       | [run] | VERIFIED   |
| EV-M3-07 | Trạng thái đang tính: nút có `aria-busy`, status "Đang tính…", chặn click kép                              | `CalculateChartDialog.test.tsx` test D5 (`requestCount === 1`, submit disabled, cancel disabled)                | [run] | VERIFIED   |
| EV-M3-08 | Guard chặn đóng dialog khi mutation đang pending (Esc, nút X, overlay click)                               | `CalculateChartDialog.tsx` (`handleClose` no-op khi pending), test D6                                           | [run] | VERIFIED   |
| EV-M3-09 | Xử lý lỗi tính: 422 `INVALID_DATETIME`, 500, và mạng hiển thị `Alert`, hỗ trợ "Thử lại"                    | `CalculateChartDialog.test.tsx` test D8, D9, D10; `chart-flow.integration.test.tsx` test I2                     | [run] | VERIFIED   |
| EV-M3-10 | Điều hướng sau tính toán bằng ID phản hồi; seed cache detail không phát `GET`                              | `CalculateChartDialog.test.tsx` test D11; `chart-flow.integration.test.tsx` test I1                             | [run] | VERIFIED   |
| EV-M3-11 | Route `/app/charts/:chartId` được đăng ký, bảo vệ bởi `ProtectedRoute`                                     | `router.tsx`, `router.test.tsx` test R1 (`AppLayout`), test R2 (chuyển hướng `/login` khi unauthenticated)      | [run] | VERIFIED   |
| EV-M3-12 | Route chart được code split lazy và hiển thị `SuspenseFallback`                                            | `router.tsx` (`lazy()`), `router.test.tsx` test R5 (`SuspenseFallback`)                                         | [run] | VERIFIED   |
| EV-M3-13 | UUID guard: chartId không hợp lệ chuyển sang trạng thái not-found không phát `GET`                         | `page.tsx` (`isValidChartId`), `page.test.tsx` test S2, `router.test.tsx` test R3                               | [run] | VERIFIED   |
| EV-M3-14 | Phân loại trạng thái trang chi tiết chuẩn xác (loading skeleton, 404/403, mạng, 500)                       | `page.test.tsx` test S1, S3, S4, S5, S6 (404/403 chung giao diện trung tính "Không tìm thấy lá số" theo D-M3-2) | [run] | VERIFIED   |
| EV-M3-15 | `toChartViewModel` qua `useMemo`; `ChartViewModelError` hiển thị lỗi hỏng dữ liệu, lỗi lạ nổi lên boundary | `page.tsx`, `page.test.tsx` test V4 (`reportError` 1 lần), `page.unexpected-error.test.tsx` test U1             | [run] | VERIFIED   |
| EV-M3-16 | Shell hiển thị metadata trung thực, `HouseDataNotice` trung thực, FG-01 giữ nguyên                         | `ChartViewerShell.test.tsx`, `HouseDataNotice.test.tsx`, `page.test.tsx` test V1, V2, V3, V8                    | [run] | VERIFIED   |
| EV-M3-17 | A11y & Lifecycle: `document.title`, focus `h1`, không cướp focus khi refetch nền, axe check sạch           | `page.test.tsx` test L1, L2, L3, L4, V9; `CalculateChartDialog.test.tsx` test D15; `ChartViewerShell.test.tsx`  | [run] | VERIFIED   |
| EV-M3-18 | Toàn bộ cổng chất lượng repo exit 0; tích hợp I1–I3 đạt 100%                                               | `format:check` ✓, `lint` ✓, `typecheck` ✓, `build` ✓, `test` (98 files / 619 tests pass) ✓, 5 Grep Gates ✓      | [run] | VERIFIED   |

---

## 2. Quyết định kỹ thuật đã thực thi (D-M3-1 … D-M3-13)

| Quyết định | Nội dung thực thi                                                                                                     | Trạng thái |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | ---------- |
| D-M3-1     | `houseSystem` là state cục bộ trong `CalculateChartDialog`, reset tự nhiên theo lần mở                                | VERIFIED   |
| D-M3-2     | 404 và 403 dùng chung giao diện trung tính "Không tìm thấy lá số" chống lộ thông tin                                  | VERIFIED   |
| D-M3-3     | Dialog mount theo lần mở (`{target && <CalculateChartDialog />}`), không dùng prop `open`                             | VERIFIED   |
| D-M3-4     | Không thêm Error Boundary mới; `ChartViewModelError` xử lý tại page; lỗi không dự kiến nổi lên `RootErrorBoundary`    | VERIFIED   |
| D-M3-5     | `ChartViewModelError` và response ID không hợp lệ ghi nhận bằng `reportError` một lần; `issues` không tự động báo cáo | VERIFIED   |
| D-M3-6     | Notice trong viewer chỉ nêu sự kiện hợp đồng; bỏ suy diễn nguyên nhân và câu về Mặt Trăng                             | VERIFIED   |
| D-M3-7     | Copy tiếng Việt cho dialog, notice, hệ nhà là chuẩn ngữ nghĩa đã được Owner phê duyệt                                 | VERIFIED   |
| D-M3-8     | Đổi tên `UnknownTimeNotice` → `HouseDataNotice` đảm bảo tính trung thực với hợp đồng                                  | VERIFIED   |
| D-M3-9     | `toChartViewModel` gọi qua `useMemo` ở page với deps `[query.data]`; giữ nguyên hook DTO                              | VERIFIED   |
| D-M3-10    | `document.title` và focus quản lý cục bộ tại trang chi tiết chart, không tạo hook toàn cục                            | VERIFIED   |
| D-M3-11    | Dialog nhận `CalculateChartTarget` cục bộ; không import chéo `BirthProfile` từ feature khác                           | VERIFIED   |
| D-M3-12    | FG-01 giữ nguyên: viewer không hiển thị tên hồ sơ vì `ChartResponse` không chứa `birthProfileId`                      | VERIFIED   |
| D-M3-13    | Không global state mới; không bảng/danh sách/wheel (giữ đúng ranh giới Sprint F4 M3)                                  | VERIFIED   |

---

## 3. Cổng chất lượng chi tiết

| Cổng kiểm tra | Lệnh thực thi                                                   | Kết quả                                                                                                   | Trạng thái                                      |
| ------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Format check  | `npm run format:check`                                          | Exit 0 — "All matched files use Prettier code style!"                                                     | VERIFIED                                        |
| Linter        | `npm run lint`                                                  | Exit 0 — 0 errors, 0 warnings                                                                             | VERIFIED                                        |
| Typecheck     | `npm run typecheck` (`tsc -p tsconfig.app.json --noEmit`)       | Exit 0 — 0 type errors                                                                                    | VERIFIED                                        |
| Build         | `npm run build`                                                 | Exit 0 — "built in 5.67s" (2105 modules transformed)                                                      | VERIFIED                                        |
| Test suite    | `npm test -- --run`                                             | Exit 0 — **98 test files passed, 619 tests passed (100%)**                                                | VERIFIED                                        |
| Coverage      | `npm run test:coverage`                                         | Exit 0 — `chart/model`: 100% lines/branch; `chart/ui`: 100% lines; `pages/app/charts/detail`: 94.6% lines | VERIFIED                                        |
| Grep Gate 1   | `grep -rnE "fetch\(                                             | axios\.create" features/chart/ui pages/app/charts`                                                        | 0 kết quả (chỉ có `query.refetch()`)            | VERIFIED                             |
| Grep Gate 2   | `grep -rnE "features/birth-profile" features/chart` & ngược lại | 0 kết quả (không import chéo feature)                                                                     | VERIFIED                                        |
| Grep Gate 3   | `npx madge --circular --extensions ts,tsx src/`                 | "√ No circular dependency found!" (223 files)                                                             | VERIFIED                                        |
| Grep Gate 4   | `grep -rnE "zustand                                             | createContext                                                                                             | useReducer" features/chart/ui pages/app/charts` | 0 kết quả (không state toàn cục mới) | VERIFIED |
| Grep Gate 5   | `grep -rnE "as unknown as                                       | : any                                                                                                     | as any" (production code)`                      | 0 kết quả trong mã production        | VERIFIED |

---

## 4. Known Gaps Registry (M3)

| ID        | Vấn đề                                                                                        | Phân loại                                             |
| --------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **FG-01** | Viewer không hiển thị tên hồ sơ (`ChartResponse` không có `birthProfileId`)                   | **Accepted Known Gap** — không giải quyết trong F4 M3 |
| KG-M3-01  | `UnknownTimeNotice` (F4 plan) đổi tên thành `HouseDataNotice` theo D-M3-8                     | Đã giải quyết (D-M3-8)                                |
| KG-M3-02  | Chỉ có `RootErrorBoundary` cấp root (mất AppLayout); không có boundary riêng theo feature     | Deferred (Core)                                       |
| KG-M3-03  | `Modal` thiếu chế độ không-thể-đóng; M3 dùng guard phía consumer trong `CalculateChartDialog` | Accepted — guard consumer                             |
| KG-M3-04  | Thiếu hạ tầng `<title>` động và focus sau điều hướng (OQ-M8-1/2); M3 xử lý cục bộ             | Deferred (Core)                                       |
| KG-M3-05  | `getErrorMessage` có side-effect `reportError` khi render khi mã lỗi lạ                       | Accepted (F3 convention)                              |
| KG-M3-06  | `ApiError` không tách biệt mất mạng và 5xx không body (`UNKNOWN_ERROR`)                       | Accepted — gộp thành trạng thái kết nối               |
| KG-M3-07  | Dialog mất hoạt ảnh đóng do mount theo lần mở (`{target && <Dialog />}`)                      | Accepted (D-M3-3)                                     |
| KG-M3-08  | `index.html` còn `<html lang="en">` trong khi giao diện tiếng Việt                            | Deferred (S4.9 a11y)                                  |
| KG-M3-09  | Sidebar/drawer chưa có mục danh sách lá số; `/app/charts` (không ID) rơi vào `NotFoundPage`   | Deferred (S4.11)                                      |
| KG-M3-10  | Định dạng ngày hiển thị `formatCalculatedAt` phụ thuộc múi giờ người dùng                     | Accepted                                              |

---

## 5. Việc đóng hồ sơ M3

1. [x] Hoàn tất triển khai Task 1: `CalculateChartDialog` + tests (commit `1b45202`).
2. [x] Hoàn tất triển khai Task 2: Profile Card "Tính lá số" action + tests (commit `67037ca`).
3. [x] Hoàn tất triển khai Task 3: Chart Detail Route & Page States + tests (commit `3c0e112`).
4. [x] Hoàn tất triển khai Task 4: View Model Integration, `ChartViewerShell`, `HouseDataNotice`, title/focus lifecycle + tests (commit `d17efa6`).
5. [x] Hoàn tất triển khai Task 5: Router regression tests (R1–R5), integration tests (I1–I3), Grep gates, full quality gates exit 0.
6. [x] Lập và lưu trữ Evidence Matrix tại `docs/implementation/archive/sprint-f4/Sprint_F4_M3_Exit_Criteria_Evidence_Matrix.md`.
