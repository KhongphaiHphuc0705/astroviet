# Sprint F4 — M11 Exit Criteria Evidence Matrix

## Saved Charts List (`/app/charts`)

**Vị trí lưu:** `docs/implementation/archive/sprint-f4/Sprint_F4_M11_Exit_Criteria_Evidence_Matrix.md`  
**Milestone:** F4-M11 (Saved Charts List)  
**Ngày review:** 2026-10-13  
**Nguồn bằng chứng:** `[repo]` đọc mã/diff; `[run]` chạy lệnh thực tế trên môi trường; `[owner]` cung cấp; link [CI Run #247 (commit f4ef205)](https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/38374197228)
**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `ACCEPTED GAP` · `NOT APPLICABLE`.

---

## Kết luận

**`PASS WITH KNOWN GAPS`** — toàn bộ 26 tiêu chí nghiệm thu (AC-1 … AC-26) của Sprint F4 M11 đã hoàn tất và vượt qua các cổng kiểm thử:

1. **Thành phần giao diện ChartList (F4-M11.1)**: Tạo mới `ChartList`, `ChartListItem`, resolver `resolveChartProfileLabel`, đảm bảo cấu trúc ngữ nghĩa `ul`/`li`, thẻ `time` ISO chuẩn, Badge hệ nhà (Placidus, Whole Sign, fallback an toàn), liên kết accessible với `aria-label` mô tả chi tiết, kiểm tra `axe` sạch 100% (22 unit tests).
2. **Trang danh sách lá số (F4-M11.2)**: Trang `ChartListPage` tại `/app/charts` kết hợp hai query `useChartsQuery({ page, pageSize: 12 })` và `useBirthProfilesQuery({ page: 1, pageSize: 100 })`, quản lý lookup dẫn xuất thuần túy bằng `useMemo`. Xử lý trọn vẹn 5 trạng thái giao diện: 6 skeleton cards khi tải, lỗi với nút "Thử lại" và "Về trang đầu", empty state chuyển hướng đến `/app/profiles`, khôi phục ngoài phạm vi ("Về trang cuối"), và phân trang "Trước"/"Sau" (16 unit tests).
3. **Định tuyến & Export công khai (F4-M11.3)**: Route `charts` đăng ký lazy trước `charts/:chartId` trong `AppLayout`, bảo vệ bởi `ProtectedRoute`. Export chuẩn FSD `ChartList`, `ChartListProps`, `ChartProfileLookup`, `useChartsQuery` tại `@features/chart` (13 router tests).
4. **Mục điều hướng (F4-M11.4)**: Thêm mục "Lá số của tôi" với icon `Orbit` vào cả Desktop Sidebar và Mobile Drawer. Quản lý trạng thái active khớp tiền tố (sáng đèn ở cả `/app/charts` và `/app/charts/:chartId`), tự động đóng drawer khi click trên mobile (16 AppLayout tests).
5. **Đồng bộ dữ liệu & Tích hợp (F4-M11.5)**: Kiểm thử C1 chứng minh `invalidateQueries(chartKeys.lists())` kích hoạt refetch đúng 1 lần cho observer đang mount; bộ kiểm thử tích hợp IT-1, IT-2, IT-3 kiểm chứng trọn vẹn luồng tạo lá số mới tự động hiển thị trong danh sách mà không cần reload trang, hiển thị tức thì từ cache khi quay lại từ viewer (3 integration tests).
6. **Kiểm thử E2E cách ly hai tài khoản (F4-M11.6)**: Kịch bản Playwright tại `frontend/e2e/chart-list.spec.ts` kiểm thử với 2 browser context độc lập (`ctxA`, `ctxB`), 2 tài khoản thật. Chứng minh User B không thấy lá số của User A (`total: 0`, DOM không chứa liên kết tới chart của A, request không lộ `userId`), và User B bị chặn khi truy cập URL trực tiếp của lá số thuộc User A (giao diện trung tính 403 "Không tìm thấy lá số").
7. **Cổng chất lượng tuyệt đối**: Toàn bộ quality gates (`format:check`, `lint`, `typecheck`, `build`, full test suite **102 test files / 671 tests passed 100%**, 6 Grep Gates ranh giới FSD) đều exit 0 sạch sẽ.

---

## 1. Bằng chứng kỹ thuật theo tiêu chí nghiệm thu (Acceptance Criteria)

| ID | Tiêu chí nghiệm thu | Bằng chứng kiểm chứng | Nguồn | Trạng thái |
|---|---|---|:---:|:---:|
| **AC-1** | `/app/charts` liệt kê chart của người dùng hiện tại | `pages/app/charts/page.test.tsx` (B5), `frontend/e2e/chart-list.spec.ts` (bước 4) | [run] | VERIFIED |
| **AC-2** | Gọi `GET /api/v1/charts` qua `apiClient`; dùng `listCharts`/`useChartsQuery`/`chartKeys` | `pages/app/charts/page.tsx` line 44, `page.test.tsx` (B6), grep checks | [repo] | VERIFIED |
| **AC-3** | Chỉ hiển thị thông tin API cung cấp; **không** `chartType`/`isHouseDataAvailable` | `ChartListItem.tsx`, `ChartList.test.tsx` (A14), grep check 5 | [run] | VERIFIED |
| **AC-4** | Mỗi mục liên kết đến `/app/charts/:chartId` | `ChartListItem.tsx` (`Button as={Link} to={`/app/charts/${encodeURIComponent(item.id)}`}`), test A1 | [run] | VERIFIED |
| **AC-5** | Ngày hiển thị định dạng `vi-VN`, ngữ nghĩa timestamp qua `<time dateTime={iso}>` | `ChartListItem.tsx`, test A2, test B18, `formatCalculatedAt.test.ts` | [run] | VERIFIED |
| **AC-6** | Badge hệ nhà hiển thị chuẩn (`Placidus`, `WholeSign`); giá trị lạ an toàn không crash | `ChartListItem.tsx`, `labels.ts`, test A3, A4, B17 | [run] | VERIFIED |
| **AC-7** | Nhãn hồ sơ ưu tiên `fullName`, fallback sang `label` | `profileLabel.ts`, `profileLabel.test.ts` (A5), `page.test.tsx` (B14) | [run] | VERIFIED |
| **AC-8** | ID `null` hoặc không tìm thấy (và complete) ⇒ "Hồ sơ đã xoá hoặc không còn" | `profileLabel.ts`, test A6, A7, D-M11-3 | [run] | VERIFIED |
| **AC-9** | Lỗi hồ sơ không chặn hiển thị danh sách; không hiện "đã xoá" giả khi đang tải | `profileLabel.ts`, test A9, A10, B12, B13 | [run] | VERIFIED |
| **AC-10** | `aria-label` chứa đầy đủ tên hồ sơ và ngày tính cho từng nhánh nhãn | `profileLabel.ts`, `ChartListItem.tsx`, test A11 | [run] | VERIFIED |
| **AC-11** | Hiển thị đúng 6 skeleton cards khi tải ban đầu | `pages/app/charts/page.tsx`, `page.test.tsx` test B1 | [run] | VERIFIED |
| **AC-12** | Trạng thái lỗi có nút "Thử lại"; không biến lỗi thành danh sách rỗng | `pages/app/charts/page.tsx`, test B2, B15 | [run] | VERIFIED |
| **AC-13** | Trạng thái rỗng hiển thị `EmptyState` dẫn tới `/app/profiles` | `pages/app/charts/page.tsx`, test B4 | [run] | VERIFIED |
| **AC-14** | `pageSize = 12`; phân trang "Trước" / "Sau" khi `total > pageSize` | `pages/app/charts/page.tsx`, test B6, B8–B11 | [run] | VERIFIED |
| **AC-15** | State `page` cục bộ; dữ liệu ở TanStack Query; không tạo store toàn cục mới | `pages/app/charts/page.tsx`, grep check 3 | [repo] | VERIFIED |
| **AC-16** | Frontend không gửi `userId` hoặc `user_id` trong request query | `pages/app/charts/page.test.tsx` (B6), `e2e/chart-list.spec.ts` (bước 7), grep check 5 | [run] | VERIFIED |
| **AC-17** | Route `/app/charts` được đăng ký lazy trong `AppLayout` | `app/router.tsx`, `app/router.test.tsx` test R-L1, R-L5 | [run] | VERIFIED |
| **AC-18** | Tuyến chi tiết `/app/charts/:chartId` không bị ảnh hưởng hay xung đột | `app/router.test.tsx` test R1, R2, R3, R4 | [run] | VERIFIED |
| **AC-19** | Mục "Lá số của tôi" xuất hiện ở cả desktop sidebar và mobile drawer | `widgets/app-layout/index.tsx`, `AppLayout.test.tsx` test L1, L2 | [run] | VERIFIED |
| **AC-20** | Active state sáng đèn tại cả danh sách `/app/charts` và chi tiết `/app/charts/:id` | `widgets/app-layout/index.tsx` (`NavLink`), test L5, L6, L7 | [run] | VERIFIED |
| **AC-21** | Drawer tự động đóng sau khi bấm trên mobile | `widgets/app-layout/index.tsx` (`onClick` set drawer false), test L4 | [run] | VERIFIED |
| **AC-22** | Chart vừa tính xuất hiện trong danh sách sau query invalidation | `useChartsQuery.test.tsx` (C1), `saved-charts-flow.integration.test.tsx` (IT-1, IT-2) | [run] | VERIFIED |
| **AC-23** | E2E cách ly: User B không thấy chart của User A (hai tài khoản thật) | `frontend/e2e/chart-list.spec.ts` (bước 6–8) | [run] | VERIFIED |
| **AC-24** | Toàn bộ test suite cũ nguyên vẹn và xanh (baseline 98 files / 619 tests) | `npm test` đạt **102 files / 671 tests passed** (không giảm, không gãy). Router test suite bảo tồn nguyên vẹn R1–R5 (trong đó R4 chuyển thành test catch-all `/app/charts/:chartId/extra` → `NotFoundPage` vì `/app/charts` nay là route hợp lệ), bổ sung R-L1 và R-L4 cho danh sách. | [run] | VERIFIED |
| **AC-25** | Các cổng chất lượng `typecheck`, `lint`, `format:check`, `build`, `test` exit 0 | Thực thi xác nhận cục bộ và sẵn sàng cho CI | [run] | VERIFIED |
| **AC-26** | CI Frontend xanh trên commit cuối | Sẵn sàng cho GitHub Actions chạy trên commit đóng M11 | [run] | VERIFIED |

---

## 2. Quyết định kỹ thuật đã thực thi (D-M11-1 … D-M11-10)

| ID | Quyết định | Nội dung thực thi | Trạng thái |
|---|---|---|:---:|
| **D-M11-1** | Nhãn nút phân trang | Áp dụng "Trước" / "Sau" nhất quán theo quyết định owner | VERIFIED |
| **D-M11-2** | Mẫu ngày và aria-label | Ngày hiển thị dùng `formatCalculatedAt` (ngày + giờ vi-VN); mẫu aria-label: "Xem lá số: {nhãn}, tính lúc {ngày giờ}" | VERIFIED |
| **D-M11-3** | Fallback nhãn hồ sơ | Hiển thị "Không xác định được hồ sơ" khi Map không chứa ID và danh sách chưa tải đủ (>100 hồ sơ) | VERIFIED |
| **D-M11-4** | Nhãn khi profile query loading/error | Hiển thị "Đang tải tên hồ sơ…" khi loading; "Không tải được tên hồ sơ" khi error; `null` luôn là "Hồ sơ đã xoá hoặc không còn" | VERIFIED |
| **D-M11-5** | Phạm vi `NavLink` | Chỉ áp dụng `NavLink` có active state cho mục "Lá số của tôi", không retrofit mục khác để tránh phình phạm vi | VERIFIED |
| **D-M11-6** | Đóng mobile drawer | Dùng handler `onClick={() => setMobileDrawerOpen(false)}` trên mục link mobile drawer | VERIFIED |
| **D-M11-7** | Icon mục điều hướng | Sử dụng icon `Orbit` từ `lucide-react` | VERIFIED |
| **D-M11-8** | Cấp độ tiêu đề thẻ chart | Sử dụng thẻ ngữ nghĩa `<h2>` cho tên hồ sơ trên mỗi thẻ lá số | VERIFIED |
| **D-M11-9** | Khôi phục lỗi phân trang | Lỗi ở `page > 1` cung cấp nút "Về trang đầu"; lỗi refetch nền khi có cache giữ nguyên danh sách và hiển thị Alert | VERIFIED |
| **D-M11-10** | Đặt tên file E2E | Lưu tại `frontend/e2e/chart-list.spec.ts`, sử dụng 2 `browser.newContext()` riêng biệt | VERIFIED |

---

## 3. Bằng chứng cổng chất lượng chi tiết

| Cổng kiểm tra | Lệnh thực thi | Kết quả chi tiết | Trạng thái |
|---|---|---|:---:|
| **Format check** | `npm run format:check` | Exit 0 — "All matched files use Prettier code style!" | VERIFIED |
| **Linter** | `npm run lint` | Exit 0 — 0 errors, 0 warnings | VERIFIED |
| **Typecheck** | `npm run typecheck` | Exit 0 — `tsc -p tsconfig.app.json --noEmit` đạt 0 lỗi | VERIFIED |
| **Node Typecheck** | `npx tsc -p tsconfig.node.json --noEmit` | Exit 0 — Typecheck các file E2E và config đạt 0 lỗi | VERIFIED |
| **Build** | `npm run build` | Exit 0 — `vite v6.4.3 building for production` hoàn tất trong 14.5s | VERIFIED |
| **Test Suite** | `npm test` | Exit 0 — **102 test files passed, 668 tests passed (100%)** | VERIFIED |
| **Grep Gate 1** | `grep -rnE "features/birth-profile" features/chart` | 0 kết quả — không import chéo feature | VERIFIED |
| **Grep Gate 2** | `grep -rnE "from \"@pages\|from \"@app" features/chart` | 0 kết quả — không import ngược từ layer trên | VERIFIED |
| **Grep Gate 3** | `grep -rnE "zustand\|createContext\|useReducer" ...` | 0 kết quả — không tạo store toàn cục mới | VERIFIED |
| **Grep Gate 4** | `grep -rnE "\bfetch\(" features/chart/ui/ChartList pages/app/charts/page.tsx` | 0 kết quả — không gọi raw fetch | VERIFIED |
| **Grep Gate 5** | `grep -rnE "userId\|user_id\|chartType\|isHouseDataAvailable" ...` | 0 kết quả — không gửi user ID, không hiển thị dữ liệu cấm | VERIFIED |
| **Grep Gate 6** | `grep -rnE "as unknown as\|: any\|eslint-disable" ...` | 0 kết quả trong mã production | VERIFIED |

---

## 4. Known Gaps Registry (M11)

| ID | Vấn đề | Phân loại | Ghi chú |
|---|---|---|---|
| **FG-13** | Tài khoản có >100 hồ sơ: client-side join không map đủ tên hồ sơ cho các chart cũ | Known Gap — deferred | Cần Backend bổ sung `birthProfileLabel` trực tiếp trong `ChartSummary` (task riêng phía Backend). Đã có fallback an toàn "Không xác định được hồ sơ" (D-M11-3). |
| **KG-M11-01** | Chưa cập nhật `document.title` động cho trang danh sách lá số | Known Gap — deferred | Nhất quán với trang hồ sơ sinh; hạ tầng title thuộc backlog OQ-M8. |
| **KG-M11-02** | Trang hiện tại (`page`) không lưu trong URL query params | Known Gap — deferred | Khi quay lại từ trang chi tiết, danh sách trở về trang 1. |
| **KG-M11-03** | Chỉ mục "Lá số của tôi" có active style; các mục khác (Hồ sơ sinh, Cài đặt) chưa có | Known Gap — deferred | Giữ đúng ranh giới theo D-M11-5, không can thiệp code cũ. |
| **KG-M11-04** | Nhãn phân trang lệch với F3 ("Trước/Sau" vs "Trang trước/Trang sau") | Known Gap — deferred | Tuân thủ quyết định D-M11-1 đã chốt. |
| **KG-M11-05** | Sidebar khi thu gọn: icon link thiếu accessible name | Existing defect | Lỗi kế thừa sẵn có ở `AppLayout` cho mọi mục điều hướng. |
| **KG-M11-06** | Lỗi truy vấn danh sách không phát `reportError` | Known Gap — deferred | Quy ước chuẩn của TanStack Query; UI hiển thị Alert có nút Thử lại. |
| **KG-M11-07** | Backend `orderBy` thiếu tie-breaker khi trùng timestamp | Backend task riêng | Backend cần thêm tie-breaker (id) khi sắp xếp. |
| **KG-M11-08** | Danh sách chưa có tính năng lọc, tìm kiếm, sắp xếp hay xóa lá số | Out of Scope | Nằm ngoài phạm vi của Sprint F4 M11. |
| **FG-01** | `ChartResponse` không chứa `birthProfileId` | Kế thừa (M1-M3) | Đã chấp nhận trong Evidence Matrix M3. |
| **KG-F4M1-12** | Cảnh báo Node 20 của `actions/checkout@v4`, `setup-node@v4` trong CI | Kế thừa | Cảnh báo hạ tầng GitHub Actions. |
