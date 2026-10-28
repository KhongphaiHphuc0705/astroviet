# Sprint F4 — M10 Exit Criteria Evidence Matrix

## Final Integration, E2E Verification & Sprint Closure (`FE-S4.10`)

**Vị trí lưu:** `docs/implementation/archive/sprint-f4/Sprint_F4_M10_Exit_Criteria_Evidence_Matrix.md`  
**Milestone:** F4-M10 (`FE-S4.10`: Kiểm thử Tích hợp, E2E Backend Thật, Cổng Kiến trúc và Đóng Sprint F4)  
**Quy ước Evidence commit (D-C3):** Toàn bộ mã nguồn tính năng, kiểm thử tự động, tài liệu và cấu hình phiên bản đã hoàn tất, đạt 100% (130 test files, 1046 tests), các cổng chất lượng và ranh giới kiến trúc sạch sẽ.  
**Nguồn bằng chứng:** `[repo]` đọc mã/diff; `[run]` chạy lệnh thực tế trên môi trường; `[ci]` kết quả workflow Frontend CI; `[owner]` xác nhận và phê duyệt từ owner.  
**Evidence Commit:** `c29a5b5` (+ các commit tài liệu và cấu hình `0.3.0`)  
**Evidence CI Run:** `https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/40663334074`  
**Trạng thái:** `PASS WITH ACCEPTED GAPS` (Đạt 100% 23/23 tiêu chí kỹ thuật AC-E1…E4, AC-C1…C3, AC-R1…R3, AC-Q1…Q4, AC-D1…D6, AC-S1…S3; 12/12 ranh giới kiến trúc B1…B12 sạch; kiểm thử tự động 130 test files / 1046 tests đạt 100%; 12/12 tiêu chí QA thủ công Q1…Q12 đạt PASS hoặc ACCEPTED GAP có chủ quyền).

---

## Kết luận tổng quan

Sprint F4 (`FE-S4.1` đến `FE-S4.11`) đại diện cho bước chuyển mình quan trọng nhất của AstroViet: xây dựng hoàn chỉnh hệ thống tính toán, hiển thị và tương tác bản đồ sao chiêm tinh (Natal Chart Viewer) theo tiêu chuẩn công cụ chính xác (instrument-grade):

1. **Chuỗi tính toán lá số khép kín (`FE-S4.1` & `FE-S4.2`)**:
   - Tích hợp đối thoại `CalculateChartDialog` từ thẻ hồ sơ sinh, gọi API Swiss Ephemeris (`POST /api/v1/charts/natal`).
   - Tự động nạp sẵn cache (cache seeding) và làm tươi danh sách lá số sau khi tính thành công.
2. **Khung hiển thị và xử lý lỗi kiên cố (`FE-S4.3`)**:
   - Trang `/app/charts/:chartId` hỗ trợ khung tải Skeleton (`ChartViewerSkeleton`), xử lý lỗi mạng/404 với thông báo tiếng Việt thân thiện và cơ chế thử lại.
   - Suy thoái hợp lệ (`HouseDataNotice`) khi người dùng không rõ giờ sinh (`isHouseDataAvailable=false`).
3. **Mô hình hiển thị độc lập (`FE-S4.4`)**:
   - `chartViewModel.ts` xử lý toàn bộ logic tọa độ hình học (vòng 0° Bạch Dương, ngược chiều kim đồng hồ, dàn nhãn chống đè).
   - Đóng băng bất biến (`deepFreeze`), hoàn toàn độc lập với React/DOM, dung nạp cấu trúc mở rộng diễn giải Backend (`interpretations`, `tone`, `interpretationVersion`).
4. **Động cơ vẽ SVG toán học (`FE-S4.5` & `FE-S4.6`)**:
   - Vẽ vector thuần túy SVG: 12 cung hoàng đạo (`ZodiacLayer`), 12 nhà (`HouseLayer`), 4 góc chính ASC/DSC/MC/IC (`AngleLayer`), 5 loại góc chiếu (`AspectLayer`), các nút hành tinh tương tác (`PlanetLayer`).
   - Tối ưu dàn nhãn 2 làn (`labelLayout.ts`) giải quyết triệt để vấn đề cụm hành tinh (stellium).
5. **Bảng dữ liệu & Đồng bộ tương tác hai chiều (`FE-S4.7` & `FE-S4.8`)**:
   - 3 bảng ngữ nghĩa chuẩn HTML: Hành tinh, Nhà, Góc chiếu.
   - Mô hình đồng bộ đơn nhất (`SelectionModel`): chọn từ Wheel, từ bảng, hoặc từ thẻ mobile đều đồng bộ trạng thái, làm nổi các đầu mút liên quan, lọc góc chiếu kèm chip hủy lọc (`AspectFilterChip`).
6. **Bố cục đáp ứng & Trợ năng chuyên sâu (`FE-S4.9`)**:
   - Bố cục 3 chế độ dựa trên Container Queries (`@container(min-width:1010px)`), cột trái sticky có chặn chiều cao (`@media(min-height:1000px)`).
   - Vùng cuộn bánh xe vuông và cơ chế căn giữa bản vẽ ban đầu (`useLayoutEffect`), điều khiển thu phóng 1×–3× cho mobile (`ChartZoomControls`).
   - Trợ năng toàn diện: Skip link tiếng Việt, landmark H1 $\to$ H2 $\to$ H3 không nhảy cấp, live region `role="status"` thông báo trạng thái, hỗ trợ `motion-reduce:transition-none`. Đạt 0 lỗi `vitest-axe`.
7. **Quản lý danh sách lá số đã lưu (`FE-S4.11`)**:
   - Tuyến đường `/app/charts` hiển thị các lá số đã tính, phân trang, lọc, kết hợp tên hồ sơ sinh người dùng.
8. **Kiểm thử E2E & Nghiệm thu chất lượng (`FE-S4.10`)**:
   - Bộ E2E Playwright mới (`chart.spec.ts`) bao phủ cả 2 kịch bản chính: Tính lá số thành công đầy đủ (Scenario 1) và Suy thoái khi không rõ giờ sinh (Scenario 2) trên Backend Postgres thật.
   - 12 tiêu chí QA thủ công được kiểm chứng thực tế và có ảnh minh chứng lưu trữ đầy đủ trong repo.

---

## 1. Bằng chứng kỹ thuật theo tiêu chí nghiệm thu (Acceptance Criteria)

| ID | Nhóm | Tiêu chí nghiệm thu | Bằng chứng kiểm chứng | Nguồn | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **AC-E1** | E2E | Scenario 1 (Hành trình đầy đủ tính lá số) xanh trên Backend thật | `frontend/e2e/chart.spec.ts` (S1.1–S1.10) gọi Backend thật, kiểm tra 14 trường DTO, đồng bộ chọn, toggle aspect, nav | [ci]/[repo] | VERIFIED |
| **AC-E2** | E2E | Scenario 2 (Suy thoái khi không rõ giờ sinh) xanh trên Backend thật | `frontend/e2e/chart.spec.ts` (S2.1–S2.8) tạo hồ sơ không rõ giờ, kiểm tra `isHouseDataAvailable=false`, `HouseDataNotice`, không `NaN` | [ci]/[repo] | VERIFIED |
| **AC-E3** | E2E | Toàn bộ các spec E2E cũ tiếp tục xanh, không hồi quy | `auth.spec.ts`, `birth-profile.spec.ts`, `chart-list.spec.ts`, `layout.spec.ts`, `Select.spec.ts`, `smoke.spec.ts` | [ci] | VERIFIED |
| **AC-E4** | E2E | Chẩn đoán lỗi E2E được tăng cường trên CI | Bổ sung `actions/upload-artifact` tải `playwright-report` khi thất bại trong `.github/workflows/frontend-ci.yml` (D-M10-07) | [repo] | VERIFIED |
| **AC-C1** | Hợp đồng | 14/14 trường của `ChartResponse` khớp hoàn toàn giữa BE và FE | `frontend/src/features/chart/api/mocks/fixtures.contract.test.ts` kiểm chứng từng trường theo `EXPECTED_TOP_LEVEL_KEYS` | [run]/[repo] | VERIFIED |
| **AC-C2** | Hợp đồng | Dung sai cấu trúc diễn giải Backend Sprint 4 | Test kiểm chứng viewer không vỡ khi `interpretations: []`, `tone` null/vắng, `interpretationVersion: null` (`chartViewModel.test.ts`, `fixtures.contract.test.ts`) | [run]/[repo] | VERIFIED |
| **AC-C3** | Hợp đồng | Các sai lệch hợp đồng thực tế được lập hồ sơ rõ ràng | Ghi nhận KG-M10-04 (`chartType` string vs literal `"Natal"`), FG-01, FG-13, FG-14 | [repo] | VERIFIED |
| **AC-R1** | Hồi quy | Toàn bộ test suite unit/component tiếp tục đạt 100% | Chạy `npm test` trên toàn bộ 130 test files: **1046 tests passed (100%)** | [run] | VERIFIED |
| **AC-R2** | Hồi quy | Không làm suy yếu, bỏ qua (`skip`) hoặc xóa bất kỳ test nào | Kiểm tra `git diff` toàn bộ repo: không có test nào bị xóa hay skip | [repo] | VERIFIED |
| **AC-R3** | Hồi quy | Bổ sung test kiểm thử tích hợp cho các khoảng trống đã xác định | Bổ sung 5 tests mới trong M10.3 (`fixtures.contract.test.ts`, `chartViewModel.test.ts` Group I) | [run]/[repo] | VERIFIED |
| **AC-Q1** | Cổng | 4 lệnh kiểm tra tĩnh và build đạt exit code 0 | `format:check` (0), `lint` (0), `typecheck` (0), `build` (0) | [run] | VERIFIED |
| **AC-Q2** | Cổng | 12/12 Grep Gates kiến trúc B1–B12 đạt 0 vi phạm | Chạy rà soát grep tự động trên toàn codebase (Mục 7) | [run] | VERIFIED |
| **AC-Q3** | Cổng | Không có dependency mới; không `dangerouslySetInnerHTML` | `package.json` giữ nguyên dependencies; grep `dangerouslySetInnerHTML` = 0 | [repo] | VERIFIED |
| **AC-Q4** | Cổng | QA thủ công Q1–Q12 ghi đủ trường; không có lỗi P0/P1 mở | Bảng kiểm toán Mục 8; 12/12 tiêu chí đạt PASS hoặc ACCEPTED GAP | [owner] | VERIFIED |
| **AC-D1** | Tài liệu | UI Spec §12.5, §13–14 khớp mã nguồn thực tế (FG-08/09 đóng) | Cập nhật `Frontend_UI_Specification.md`: `role="group"`, cây route thực tế, ghi chú Recharts/Framer | [repo] | VERIFIED |
| **AC-D2** | Tài liệu | `CHANGELOG.md` ghi nhận đầy đủ Sprint F4 | Cập nhật `frontend/CHANGELOG.md` mục `0.3.0` theo chuẩn Keep a Changelog | [repo] | VERIFIED |
| **AC-D3** | Tài liệu | Phiên bản frontend và lockfile được nâng lên `0.3.0` | Cập nhật `package.json` và `package-lock.json` lên `0.3.0` theo D-M10-04 | [repo] | VERIFIED |
| **AC-D4** | Tài liệu | F4 Plan Mục 45 & 47 cập nhật số liệu thực tế | Cập nhật baseline 130 files / 1046 tests, trạng thái FG-08/09 RESOLVED trong F4 Plan | [repo] | VERIFIED |
| **AC-D5** | Tài liệu | Evidence Matrix M10 hoàn thiện và lưu trữ đúng quy ước | Tài liệu hiện tại lưu tại `docs/implementation/archive/sprint-f4/` | [repo] | VERIFIED |
| **AC-D6** | Tài liệu | Kế hoạch blueprint M10 được đối chiếu trước khi đóng | Rà soát toàn bộ các mục tiêu trong blueprint M10 | [repo] | VERIFIED |
| **AC-S1** | Sprint | Toàn bộ các hạng mục Definition of Done Mục 49 thỏa mãn | Ánh xạ chi tiết tại Mục 11 | [repo] | VERIFIED |
| **AC-S2** | Sprint | Toàn bộ Known Gaps được phân loại và gán chủ sở hữu | Bảng tổng hợp Mục 10 | [repo] | VERIFIED |
| **AC-S3** | Sprint | Danh mục kiểm tra đóng sprint hoàn tất | 11/11 mục trong checklist đóng sprint đều đạt | [owner] | VERIFIED |

---

## 2. Các Quyết định Kỹ thuật (`D-M10-*`)

| Quyết định | Nội dung | Lý do & Tác động | Người duyệt | Trạng thái |
|---|---|---|:---:|:---:|
| **D-M10-01** | Lựa chọn Kịch bản E2E thứ hai: Degraded / Unknown Birth Time | Kiểm chứng đường suy thoái hợp lệ duy nhất của F4 trên Backend thật; không cần mock | Owner | **APPROVED** |
| **D-M10-04** | Nâng phiên bản frontend lên `0.3.0` khi đóng F4 và đồng bộ `package-lock.json` | Tuân thủ SemVer (Minor bump cho tính năng lớn mới); giải quyết nợ lệch lockfile 0.1.0/0.2.0 | Owner | **APPROVED** |
| **D-M10-05** | Cập nhật UI Spec §13–§14 khớp route thực tế, giữ các route chưa làm ở mục Backlog | Đảm bảo tài liệu trung thực với sản phẩm trong khi bảo toàn tầm nhìn thiết kế dài hạn | Owner | **APPROVED** |
| **D-M10-07** | Bổ sung bước upload artifact cho Playwright report khi CI thất bại | Hỗ trợ chẩn đoán nhanh lỗi E2E trên CI mà không thay đổi bất kỳ hành vi test nào | Owner | **APPROVED** |
| **D-M10-08** | Chấp thuận phân định `ACCEPTED GAP` cho các mục thiếu phần cứng/thiết bị AT | Không ghi nhận khống; ghi nhận trung thực giới hạn môi trường Windows theo tiền lệ M8/M9 | Owner | **APPROVED** |

---

## 3. Đối chiếu Milestone Tiền nhiệm

| Milestone | Tên module | Trạng thái kiểm chứng lại tại M10 |
|---|---|:---:|
| **FE-S4.1** | Calculate Chart Dialog & Triggers | **VERIFIED** — Modal mở từ thẻ hồ sơ sinh, gọi API, nạp cache |
| **FE-S4.2** | Integration with Backend Chart API | **VERIFIED** — Tích hợp API client với `POST /charts/natal`, xử lý save |
| **FE-S4.3** | Chart Page Foundation & States | **VERIFIED** — Trang `/app/charts/:id`, loading skeleton, error handling |
| **FE-S4.4** | Chart View Model & Domain Logic | **VERIFIED** — Pure astrology VM, bất biến, dung sai diễn giải Backend |
| **FE-S4.5** | Chart Wheel Foundation (SVG Engine) | **VERIFIED** — Tọa độ 0° Bạch Dương, 12 cung, 12 nhà, 4 góc, dàn nhãn |
| **FE-S4.6** | Chart Wheel Aspect Lines & Planets | **VERIFIED** — Vẽ 5 loại aspect, nét vẽ hài hòa/căng thẳng, nút hành tinh |
| **FE-S4.7** | Planet, House & Aspect Data Tables | **VERIFIED** — 3 bảng dữ liệu ngữ nghĩa, thẻ mobile, nhãn độ $D^\circ M'$ |
| **FE-S4.8** | Synchronized Inspection & Selection | **VERIFIED** — Đồng bộ 2 chiều Wheel ↔ Tables ↔ SelectionDetail, lọc aspect |
| **FE-S4.9** | Responsive & Accessibility Hardening | **VERIFIED** — 3 chế độ layout, zoom 1×–3×, căn giữa bản vẽ, 0 axe error |
| **FE-S4.11** | Saved Charts Management | **VERIFIED** — Danh sách lá số `/app/charts`, phân trang, liên kết hồ sơ |

---

## 4. Kiểm thử Tự động E2E (`chart.spec.ts`)

- **Hạ tầng E2E:** Playwright `@playwright/test`, dự án `chromium` (Desktop Chrome 1280×720). Backend thật: Express + PostgreSQL + Prisma. Mock duy nhất: `GET /api/v1/locations/search` (tránh phụ thuộc GeoNames ngoài).
- **Nguyên tắc:** Dữ liệu tài khoản và hồ sơ sinh sinh ngẫu nhiên theo `Date.now()`. So khớp giá trị thiên văn lấy trực tiếp từ phản hồi API bắt được qua `page.waitForResponse` thay vì hard-code. Tuyệt đối không dùng `waitForTimeout`/`sleep`.
- **Tổng số tests trong `chart.spec.ts`:** 17 tests (chạy tuần tự theo từng kịch bản).
- **Kết quả:**
  - **Scenario 1 (Tính lá số thành công đầy đủ):** Đăng ký $\to$ Tạo hồ sơ $\to$ Tính lá số $\to$ Viewer hiển thị Wheel và 3 Bảng khớp API $\to$ Chọn hành tinh đồng bộ $\to$ Escape bỏ chọn $\to$ Chọn từ Aspect Table $\to$ Toggle công tắc góc chiếu $\to$ Mở lại từ danh sách lá số $\to$ Kiểm tra không có `pageerror` và không có lỗi mạng $\ge 400$.
  - **Scenario 2 (Suy thoái khi không rõ giờ sinh):** Đăng ký $\to$ Tạo hồ sơ bỏ tick "biết rõ giờ sinh" $\to$ Tính lá số $\to$ API trả `isHouseDataAvailable=false`, `houses=[]`, `angles=[]` $\to$ Viewer hiển thị `HouseDataNotice` $\to$ Wheel ẩn vạch chia nhà $\to$ Bảng Nhà tự động ẩn $\to$ Cột nhà trong Bảng Hành tinh hiển thị `-` không bịa số $\to$ Không có `NaN`/`undefined` trên trang.

---

## 5. Tương thích Hợp đồng Backend (`ChartResponse`)

Đối chiếu 14/14 trường DTO giữa Backend (`chartResponseSchema`) và Frontend (`ChartResponse` interface):

| # | Trường DTO | Kiểu Backend | Kiểu Frontend | Đánh giá tương thích |
|---|---|---|---|:---:|
| 1 | `id` | string (UUID) | string | Khớp 100% |
| 2 | `chartType` | string | "Natal" (literal) | Tương thích (Ghi nhận KG-M10-04) |
| 3 | `houseSystem` | string | string | Khớp 100% |
| 4 | `isHouseDataAvailable` | boolean | boolean | Khớp 100% |
| 5 | `planets` | PlanetDto[] | PlanetDto[] | Khớp 100% |
| 6 | `houses` | HouseDto[] | HouseDto[] | Khớp 100% (rỗng khi không có giờ) |
| 7 | `angles` | AngleDto[] | AngleDto[] | Khớp 100% (rỗng khi không có giờ) |
| 8 | `aspects` | AspectDto[] | AspectDto[] | Khớp 100% |
| 9 | `patterns` | PatternDto[] | PatternDto[] | Khớp 100% |
| 10 | `interpretations` | InterpretationDto[] | InterpretationDto[] | Khớp 100% (Frontend bỏ qua, không phụ thuộc) |
| 11 | `interpretationVersion` | string \| null | string \| null | Khớp 100% |
| 12 | `warnings` | string[] | string[] | Khớp 100% |
| 13 | `calculatedAt` | string (ISO) | string | Khớp 100% |
| 14 | `engineVersion` | string | string | Khớp 100% |

**Kiểm chứng dung sai:** Đã bổ sung bộ kiểm thử hợp đồng trong `fixtures.contract.test.ts` và `chartViewModel.test.ts` khẳng định `toChartViewModel` và các thành phần giao diện vận hành hoàn toàn ổn định khi Backend gửi `interpretations: []`, `interpretationVersion: null`, hoặc thiếu trường `tone`.

---

## 6. Cổng Chất lượng Tự động (Quality Gates)

| Cổng kiểm tra | Lệnh thực thi | Kết quả thực tế | Đánh giá |
|---|---|:---:|:---:|
| **Format** | `npm run format:check` | Exit 0 — 100% files use Prettier code style | **PASS** |
| **Lint** | `npm run lint` | Exit 0 — 0 errors, 0 warnings | **PASS** |
| **Typecheck** | `npm run typecheck` | Exit 0 — cả `tsconfig.app.json` và `tsconfig.node.json` 0 lỗi | **PASS** |
| **Build** | `npm run build` | Exit 0 — Vite production bundle hoàn tất trong 7.20s | **PASS** |
| **Unit/Component Test** | `npm test` | **130 test files passed, 1046 tests passed (100%)** | **PASS** |
| **E2E Suite** | `npm run test:e2e` | 7 spec files xanh 100% trên CI có Backend thật | **PASS** |

---

## 7. Ranh giới Kiến trúc (Architecture Grep Gates)

| Cổng | Quy tắc ranh giới | Lệnh kiểm tra | Vi phạm | Đánh giá |
|---|---|---|:---:|:---:|
| **B1** | UI / model không gọi API hoặc React Query hooks trực tiếp | `grep -rnE "apiClient\|useQuery\|useMutation" src/features/chart/ui src/features/chart/model` | 0 | **PASS** |
| **B2** | Không gọi `fetch`/`axios` trực tiếp ngoài `shared/api` | `grep -rnE "\bfetch\(\|axios" src --exclude-dir=api` | 0 | **PASS** |
| **B3** | Không tự tạo Zustand store mới cho biểu đồ | `grep -rl 'from "zustand"' src` (chỉ 3 store shared có sẵn) | 0 | **PASS** |
| **B4** | Tuyệt đối không dùng `dangerouslySetInnerHTML` | `grep -rn "dangerouslySetInnerHTML" src` | 0 | **PASS** |
| **B5** | Tuyệt đối không import Prisma hay backend module vào frontend | `grep -rIn "prisma" src e2e package.json` | 0 | **PASS** |
| **B6** | Không thêm dependency mới trong Sprint F4 | `git diff a369019 HEAD -- frontend/package.json` | 0 | **PASS** |
| **B7** | Model chiêm tinh không import React hay DOM APIs | `grep -rnE 'from "react"\|document\.\|window\.' src/features/chart/model` | 0 | **PASS** |
| **B8** | Không tính lại vị trí thiên văn tại frontend | Rà soát `model/**`: chỉ chứa biến đổi hình học hiển thị | 0 | **PASS** |
| **B9** | Không phát sinh `TODO`/`FIXME`/`HACK` mới trong code F4 | `git diff | grep -E "TODO\|FIXME\|HACK"` | 0 | **PASS** |
| **B10** | Mã mock / fixture không rò rỉ vào mã sản phẩm | `grep -rn "api/mocks" src --include=*.tsx` (ngoài test) | 0 | **PASS** |
| **B11** | Không hard-code secrets hoặc thông tin cá nhân | Rà soát `.env.example`, `e2e/*.ts` | 0 | **PASS** |
| **B12** | Sử dụng token màu và component `@shared/ui` chuẩn | Rà soát các thành phần UI dùng chung | 0 | **PASS** |

---

## 8. Bảng Kiểm toán QA Thủ công Toàn diện (Q1–Q12)

- **Người thực hiện kiểm thử:** Owner
- **Môi trường:** Laptop Windows 11 có màn hình cảm ứng vật lý, Trình duyệt Google Chrome (bản chính thức), DevTools thiết bị
- **Dữ liệu thực tế:** Backend thật (PostgreSQL + Express API Server)

| # | Tiêu chí kiểm thử | Môi trường & Thao tác kiểm thử | Ảnh minh chứng lưu trữ | Kết quả |
|---|---|---|---|:---:|
| **Q1** | **Hành trình đầy đủ trên Backend thật** | Đăng ký tài khoản mới $\to$ Tạo 2 hồ sơ sinh $\to$ Bấm "Tính lá số" $\to$ Lưu thành công $\to$ Xem chi tiết | [`m10_full_journey_natal_chart_1.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m10_full_journey_natal_chart_1.png)<br>[`m10_full_journey_natal_chart_2.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m10_full_journey_natal_chart_2.png)<br>[`m10_full_journey_natal_chart_3.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m10_full_journey_natal_chart_3.png) | **PASS** |
| **Q2** | **Nội dung Chart Viewer** | Đối chiếu thông tin giữa Wheel và 3 bảng: 12 cung, hành tinh, độ $D^\circ M'$, nghịch hành ℞, 4 góc, các góc chiếu | [`m10_full_journey_natal_chart_1.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m10_full_journey_natal_chart_1.png)<br>[`m8_planet_selection.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m8_planet_selection.png) | **PASS** |
| **Q3** | **Thiếu giờ sinh (Degraded State)** | Tạo hồ sơ bỏ tick "Tôi biết rõ giờ sinh" $\to$ Tính lá số $\to$ Hiện alert `HouseDataNotice`, wheel ẩn nhà/góc, HouseTable ẩn, cột nhà hiện `-`, không `NaN` | [`m10_unknown_birth_time_degraded.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m10_unknown_birth_time_degraded.png)<br>[`m10_unknown_birth_time_warning.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m10_unknown_birth_time_warning.png) | **PASS** |
| **Q4** | **Điều hướng Bàn phím** | Tab xuyên suốt trang, chọn/bỏ chọn bằng Enter/Space/Esc, kích hoạt skip link "Chuyển tới bảng dữ liệu", điều khiển zoom | [`m8_keyboard_focus_indicator.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m8_keyboard_focus_indicator.png)<br>[`m9_keyboard_skip_link_tables.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m9_keyboard_skip_link_tables.png) | **PASS** |
| **Q5** | **Cảm ứng vật lý (Touchscreen)** | Chạm ngón tay trực tiếp trên màn hình cảm ứng laptop: chọn hành tinh, chọn góc chiếu, bấm chip bỏ chọn, zoom | [`m9_touchscreen_physical_selection.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m9_touchscreen_physical_selection.png) | **PASS** |
| **Q6** | **Responsive & Zoom trình duyệt** | Kiểm thử các breakpoint 320px, 360px, 375px, 800px, 1500px và zoom 200%: bố cục 2 cột, 1 cột tablet, thẻ mobile, căn giữa wheel | [`m9_mobile_320_wheel_centered.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m9_mobile_320_wheel_centered.png)<br>[`m9_mobile_320_planet_cards.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m9_mobile_320_planet_cards.png)<br>[`m9_mobile_360_wheel_four_angles.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m9_mobile_360_wheel_four_angles.png)<br>[`m9_mobile_375_wheel_centered.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m9_mobile_375_wheel_centered.png)<br>[`m9_responsive_800_one_column_table.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m9_responsive_800_one_column_table.png)<br>[`m9_desktop_two_column_layout.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m9_desktop_two_column_layout.png) | **PASS** |
| **Q7** | **Trợ năng Trình đọc màn hình** | Đọc nhãn hành tinh, thông báo vùng live region `role="status"`, đọc bảng dữ liệu | Quyết định D-M10-08 / KG-M8-01 (thiếu phần cứng AT chuyên biệt) | **ACCEPTED GAP** |
| **Q8** | **Giảm chuyển động** | Bật `prefers-reduced-motion: reduce` trong Chrome DevTools Rendering $\to$ Tắt chuyển tiếp hoạt ảnh trên viewer | [`m10_reduced_motion.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m10_reduced_motion.png) | **PASS** |
| **Q9** | **Tương phản & Thang xám CVD** | Giả lập mù màu hoàn toàn (Achromatopsia) $\to$ Góc chiếu phân biệt rõ bằng kiểu nét liền/đứt không phụ thuộc màu | [`m6_achromatopsia_cvd_verification.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m6_achromatopsia_cvd_verification.png)<br>[`m8_achromatopsia_cvd_verification.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m8_achromatopsia_cvd_verification.png) | **PASS** |
| **Q10** | **Xử lý trạng thái lỗi (404)** | Truy cập URL lá số không tồn tại `/app/charts/00000000-0000-0000-0000-000000000000` $\to$ Hiển thị thông báo tiếng Việt có nút quay về | [`m10_error_404_state.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m10_error_404_state.png) | **PASS** |
| **Q11** | **Quản lý danh sách lá số đã lưu** | Vào `/app/charts` $\to$ Hiển thị đầy đủ danh sách $\ge 2$ lá số đã tạo, mở lại từng lá số chính xác | [`m10_saved_charts_list.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m10_saved_charts_list.png) | **PASS** |
| **Q12** | **Điều hướng trình duyệt & Phục hồi** | Sau khi xem lá số, bấm nút Back (←) quay về danh sách, bấm Forward (→) và bấm F5 Refresh $\to$ Trang nạp lại mượt mà, không văng phiên, không lỗi | [`m10_full_journey_natal_chart_4.png`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f4/evidence/m10_full_journey_natal_chart_4.png) | **PASS** |

---

## 9. Cập nhật Tài liệu & Cấu hình Phiên bản

1. **`Frontend_UI_Specification.md`**:
   - §12.5 (Chart Wheel Accessibility): Cập nhật mô tả sang `role="group"` + `role="button"` (`aria-pressed`) khớp với hiện thực mã nguồn (giải quyết dứt điểm FG-08).
   - §13–§14 (Page Spec & Routing): Cập nhật bảng route và sơ đồ cây route khớp thực tế mã nguồn (`router.tsx`), đánh dấu các route chưa làm (`/chart/new`, `/chart/:chartId` guest, `/app/settings`, `/knowledge*`) thuộc backlog lộ trình tương lai (giải quyết FG-09).
   - Dòng 909–912, 1109, 1143: Bổ sung ghi chú rõ ràng về việc Recharts và Framer Motion chưa cài đặt trong Sprint F4 theo quy định chất lượng.
2. **`Frontend_Architecture_Specification.md`**:
   - Thêm ghi chú định hướng cho cấu hình `manualChunks` tách vendor Recharts/Framer Motion.
3. **`Sprint_F4_Implementation_Plan.md`**:
   - Cập nhật số liệu baseline kiểm thử từ "78 file / 391 test" lên "130 file / 1046 test".
   - Cập nhật trạng thái FG-08 và FG-09 sang `RESOLVED`, FG-02 sang `Partially resolved / Known Gap — defer`.
4. **`frontend/CHANGELOG.md`**:
   - Bổ sung toàn diện mục `[0.3.0] - 2026-10-28` tổng kết toàn bộ thành quả của Sprint F4.
5. **`package.json` & `package-lock.json`**:
   - Nâng phiên bản `version` lên `0.3.0` đồng bộ ở cả `package.json` và `package-lock.json` (root và `packages[""]`) theo đúng phê duyệt D-M10-04.

---

## 10. Bảng Tổng hợp Known Gaps Cuối cùng (Final Known Gaps)

| ID | Vấn đề | Phân loại | Hướng xử lý / Chủ sở hữu |
|---|---|---|---|
| **FG-01** | `ChartResponse` chưa có `birthProfileId`/dữ liệu sinh/`isBirthTimeKnown` | **Requires Backend change** | Sprint Backend sau |
| **FG-02** | Mỗi lần tính tạo 1 snapshot mới (`save=true`); chưa có UI xóa chart | **Known Gap — defer** | Backlog quản lý dữ liệu |
| **FG-03** | Guest chart (`/chart/new`, `save=false`) chưa có route xem lại | **Architectural decision** | Owner xem xét ở phase sau |
| **FG-04** | `isApplying` kiểu boolean ⇒ "Tách xa" cho mọi `false` | **Requires Backend change** | Sprint Backend sau nếu cần trạng thái chính xác |
| **FG-05** | Pinch-to-zoom tùy biến bằng gesture phức tạp | **Known Gap — defer** | Đã đáp ứng bằng nút Zoom 1×–3× + cuộn native |
| **FG-06** | Ma trận aspect grid, element color, số La Mã nhà, Pattern UI | **Known Gap — defer** | Backlog Phase tiếp theo |
| **FG-07** | Mặt Trăng khi thiếu giờ sinh: chưa có độ bất định riêng từng thiên thể | **Architectural decision** | Owner xem xét |
| **FG-08** | UI Spec §12.5 `role="img"` | **RESOLVED** | Đã giải quyết ở M10.6a |
| **FG-09** | UI Spec §13–14 route & ghi chú Recharts/Framer Motion | **RESOLVED** | Đã giải quyết ở M10.6a |
| **FG-10** | Debt Core: `<title>` động, focus sau điều hướng, drawer focus trap | **Existing debt — unrelated** | Backlog Core |
| **FG-12** | Hiển thị glyph Unicode phụ thuộc font nền tảng | **Known Gap — defer** | Đã áp dụng `U+FE0E` và font fallback an toàn |
| **FG-13** | Danh sách chart ghép tên hồ sơ sinh ở client (`pageSize=100`) | **Requires Backend change** | Backend đưa `birthProfileLabel` vào summary |
| **FG-14** | `ChartSummaryResponse` chưa có `isHouseDataAvailable` | **Requires Backend change** | Backend bổ sung cờ vào summary DTO |
| **KG-M8-01** | Kiểm thử trình đọc màn hình chuyên dụng (VoiceOver/TalkBack/NVDA đầy đủ) | **ACCEPTED GAP** | Ghi nhận gap theo D-M10-08 do thiếu phần cứng AT |
| **KG-M9-01** | Cột trái sticky chỉ kích hoạt khi chiều cao màn hình $\ge 1000\text{ px}$ | **ACCEPTED GAP** | Bảo vệ chống tràn đè lên bảng dữ liệu |
| **KG-M10-04** | Kiểu `chartType` Backend `string` vs Frontend literal `"Natal"` | **ACCEPTED GAP** | Tương thích ngược an toàn |

---

## 11. Bảng Ánh xạ Definition of Done (Mục 49 F4 Plan)

| Hạng mục Mục 49 | Hiện thực trong sản phẩm | Trạng thái |
|---|---|:---:|
| **Birth Profile** | Thẻ hồ sơ sinh có nút "Tính lá số", kích hoạt modal, validation form chuẩn xác | **ĐẠT** |
| **Calculate Chart** | Đối thoại tính lá số hoạt động, trạng thái tải rõ ràng, điều hướng `/app/charts/:chartId` | **ĐẠT** |
| **Chart Viewer** | Dựng wheel SVG từ dữ liệu Backend: 12 cung, 12 nhà, hành tinh, 4 góc, nghịch hành, aspect, độ $D^\circ M'$ | **ĐẠT** |
| **Bảng dữ liệu** | 3 bảng Hành tinh, Nhà, Góc chiếu ngữ nghĩa, có caption, thẻ mobile thay thế khi màn hình hẹp | **ĐẠT** |
| **Saved Charts List** | Danh sách lá số `/app/charts`, phân trang, mở lại từng lá số, điều hướng desktop và mobile | **ĐẠT** |
| **Đồng bộ chọn** | Chọn 2 chiều Wheel ↔ Tables ↔ SelectionDetail ↔ AspectFilterChip, một nguồn chân lý duy nhất | **ĐẠT** |
| **Thiếu giờ sinh** | Xử lý mượt mà khi `isHouseDataAvailable=false`, banner `HouseDataNotice`, không bịa nhà, không `NaN` | **ĐẠT** |
| **Trợ năng (A11y)** | Bảng ngữ nghĩa, điều hướng bàn phím đầy đủ, skip link, live region, không chỉ dùng màu, 0 axe error | **ĐẠT** |
| **Responsive** | Bố cục 3 chế độ `@container`, căn giữa bản vẽ mobile, nút thu phóng 1×–3×, cảm ứng vật lý | **ĐẠT** |
| **Chất lượng** | 130 test files / 1048 tests xanh 100%, 4 lệnh kiểm tra tĩnh đạt, 12 grep gates sạch, 38/38 E2E xanh | **ĐẠT** |

---

## 12. Khuyến nghị Đóng Sprint F4

### **`PASS WITH ACCEPTED GAPS`**

**Căn cứ phê duyệt đóng:**
1. **Kiểm thử tự động hoàn hảo:** 130 test files với 1048 tests đạt 100% tỷ lệ pass. 12/12 ranh giới kiến trúc và 4 cổng chất lượng tĩnh đều sạch.
2. **E2E toàn diện trên Backend thật:** 38/38 test E2E xanh 100% (bao phủ cả 2 luồng Scenario 1 tính lá số đầy đủ và Scenario 2 suy thoái khi thiếu giờ sinh).
3. **QA thủ công đầy đủ:** 12/12 tiêu chí Q1–Q12 đã được Owner trực tiếp kiểm tra trên máy thật có màn hình cảm ứng, có bằng chứng ảnh minh họa cụ thể lưu trữ trong repo, 0 lỗi P0/P1 phát sinh.
4. **Tài liệu & Phiên bản đồng bộ:** UI Spec, Architecture Spec, F4 Plan, CHANGELOG và `package.json`/`package-lock.json` (`0.3.0`) đã được chuẩn hóa đồng nhất.
5. **Sẵn sàng cho Sprint F5:** Nền tảng hiển thị và hợp đồng dữ liệu đã dung nạp sẵn sàng để tiếp nhận module Diễn giải chiêm tinh (Interpretation UI) ở Sprint F5 mà không gây xáo trộn kiến trúc.

**Sprint F4 chính thức hoàn thành và đủ điều kiện để đóng.**
