# Sprint F4 — M10 Exit Criteria Evidence Matrix

## Final Integration, E2E Verification & Sprint Closure (`FE-S4.10`)

**Vị trí lưu:** `docs/implementation/archive/sprint-f4/Sprint_F4_M10_Exit_Criteria_Evidence_Matrix.md`  
**Milestone:** F4-M10 (`FE-S4.10`: Kiểm thử Tích hợp, E2E Backend Thật, Cổng Kiến trúc và Đóng Sprint F4)  
**Quy ước Evidence commit (D-C3):** Toàn bộ mã nguồn tính năng, kiểm thử tự động, tài liệu và cấu hình phiên bản đã hoàn tất, đạt 100% (130 test files, 1049 tests), các cổng chất lượng và ranh giới kiến trúc sạch sẽ.  
**Nguồn bằng chứng:** `[repo]` đọc mã/diff; `[run]` chạy lệnh thực tế trên môi trường; `[ci]` kết quả workflow Frontend CI; `[owner]` xác nhận và phê duyệt từ owner.  
**Evidence Commit:** `5762233` (+ các commit tài liệu và cấu hình `0.3.0`)  
**Evidence CI Run:** `https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/40850309135`  
**Trạng thái:** `PASS (OFFICIALLY ACCEPTED BY OWNER) WITH ACCEPTED GAPS` (Đạt 100% 23/23 tiêu chí kỹ thuật AC-E1…E4, AC-C1…C3, AC-R1…R3, AC-Q1…Q4, AC-D1…D6, AC-S1…S3; 12/12 ranh giới kiến trúc B1…B12 sạch; kiểm thử tự động 130 test files / 1049 tests đạt 100%; 12/12 tiêu chí QA thủ công Q1…Q12 đạt PASS trên môi trường máy thật; các khoảng trống kỹ thuật và giới hạn phần cứng ngoài môi trường Windows được ghi nhận có chủ quyền theo đúng 7 điều kiện quy định).

---

## Kết luận tổng quan

Sprint F4 (`FE-S4.1` đến `FE-S4.11`) đại diện cho bước chuyển mình quan trọng nhất của AstroViet: xây dựng hoàn chỉnh hệ thống tính toán, hiển thị và tương tác bản đồ sao chiêm tinh (Natal Chart Viewer) theo tiêu chuẩn công cụ chính xác (instrument-grade):

1. **Tích hợp API tính toán & Data Hooks (`FE-S4.1`)**:
   - Tích hợp các hàm API client `createNatalChart`, `getChart`, `listCharts` với Backend Swiss Ephemeris (`POST /api/v1/charts/natal`).
   - Hooks React Query (`useChartQuery`, `useChartsQuery`, `useCreateNatalChartMutation`) tự động nạp sẵn cache (cache seeding) và làm tươi danh sách lá số sau khi tạo thành công.
2. **Mô hình hiển thị độc lập (`FE-S4.2`)**:
   - `chartViewModel.ts` xử lý toàn bộ logic hình học (vòng 0° Bạch Dương, ngược chiều kim đồng hồ, format tọa độ, nhãn hiển thị).
   - Đóng băng bất biến (`deepFreeze`), hoàn toàn độc lập với React/DOM, dung nạp cấu trúc mở rộng diễn giải Backend (`interpretations: []`, `tone`, `interpretationVersion: null`).
3. **Khung hiển thị và đối thoại tính lá số (`FE-S4.3`)**:
   - Đối thoại modal `CalculateChartDialog` từ nút "Tính lá số" trên thẻ hồ sơ sinh.
   - Tuyến đường `/app/charts/:chartId` hỗ trợ khung tải Skeleton (`ChartViewerSkeleton`), xử lý lỗi mạng/404 với thông báo tiếng Việt thân thiện và cơ chế thử lại.
   - Suy thoái hợp lệ (`HouseDataNotice`) khi người dùng không rõ giờ sinh (`isHouseDataAvailable=false`).
4. **Nền tảng bánh xe SVG toán học (`FE-S4.4`)**:
   - Động cơ vẽ vector thuần túy SVG với độ chính xác cao: 12 cung hoàng đạo (`ZodiacLayer`), 12 nhà (`HouseLayer`), 4 góc chính ASC/DSC/MC/IC (`AngleLayer`).
5. **Dàn nhãn hành tinh & Lớp góc chiếu (`FE-S4.5` & `FE-S4.6`)**:
   - Đặt hành tinh (`PlanetLayer`) với thuật toán dàn nhãn một làn kết hợp 2 tầng bán kính Tier A / Tier B (`labelLayout.ts`) giải quyết triệt để vấn đề cụm hành tinh (stellium).
   - Vẽ 5 loại góc chiếu (`AspectLayer`) với đường nét hài hòa (Harmonious) và căng thẳng (Tense).
   - Ngữ nghĩa trợ năng: SVG container `role="group"`, nút hành tinh tương tác `role="button"` với `aria-pressed`.
6. **Bảng dữ liệu & Đồng bộ tương tác hai chiều (`FE-S4.7` & `FE-S4.8`)**:
   - 3 bảng ngữ nghĩa chuẩn HTML: Hành tinh (`PlanetTable`), Nhà (`HouseTable`), Góc chiếu (`AspectTable`).
   - Cơ chế đồng bộ lựa chọn thống nhất qua `selection.ts`: chọn từ Wheel, từ bảng, hoặc từ thẻ mobile đều đồng bộ trạng thái, làm nổi các đầu mút liên quan, lọc góc chiếu kèm chip hủy lọc (`AspectFilterChip`), hiển thị chi tiết trong `SelectionDetail`.
7. **Bố cục đáp ứng & Trợ năng chuyên sâu (`FE-S4.9`)**:
   - Bố cục 3 chế độ theo viewport: Mobile thẻ xếp chồng, Tablet một cột, Desktop hai cột sử dụng Container Queries (`@container (min-width: 1010px)`) kèm cột trái sticky có chặn chiều cao (`@media (min-height: 1000px)`).
   - Vùng cuộn bánh xe vuông và cơ chế căn giữa bản vẽ ban đầu (`useLayoutEffect`), cụm nút thu phóng 1×–3× (`ChartZoomControls`) hỗ trợ thêm pinch gốc trình duyệt.
   - Trợ năng toàn diện: Skip link tiếng Việt, landmark H1 $\to$ H2 $\to$ H3 không nhảy cấp, live region `role="status"` thông báo trạng thái, hỗ trợ `motion-reduce:transition-none`. Đạt 0 lỗi `vitest-axe`.
8. **Quản lý danh sách lá số đã lưu (`FE-S4.11`)**:
   - Tuyến đường `/app/charts` hiển thị các lá số đã tính, phân trang Trước/Sau (`pageSize = 12`), liên kết tên hồ sơ sinh người dùng.
9. **Kiểm thử E2E & Nghiệm thu chất lượng (`FE-S4.10`)**:
   - Bộ E2E Playwright mới (`chart.spec.ts`) bao phủ cả 2 kịch bản chính: Tính lá số thành công đầy đủ (Scenario 1) và Suy thoái khi không rõ giờ sinh (Scenario 2) trên Backend Postgres thật. Toàn bộ 38/38 tests E2E xanh 100%.
   - 12 tiêu chí QA thủ công được kiểm chứng thực tế và có ảnh minh chứng lưu trữ đầy đủ trong repo.

---

## 1. Bằng chứng kỹ thuật theo tiêu chí nghiệm thu (Acceptance Criteria)

| ID | Nhóm | Tiêu chí nghiệm thu | Bằng chứng kiểm chứng | Nguồn | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **AC-E1** | E2E | Scenario 1 (Hành trình đầy đủ tính lá số) xanh trên Backend thật | `frontend/e2e/chart.spec.ts` (S1.1–S1.10) gọi Backend thật, kiểm tra 14 trường DTO, đồng bộ chọn, toggle aspect, nav | [ci]/[repo] | VERIFIED |
| **AC-E2** | E2E | Scenario 2 (Suy thoái khi không rõ giờ sinh) xanh trên Backend thật | `frontend/e2e/chart.spec.ts` (S2.1–S2.7) tạo hồ sơ không rõ giờ, kiểm tra `isHouseDataAvailable=false`, `HouseDataNotice`, cột "Nhà" và "Cusp (độ)" vắng mặt hoàn toàn, không `NaN` | [ci]/[repo] | VERIFIED |
| **AC-E3** | E2E | Toàn bộ các spec E2E cũ tiếp tục xanh, không hồi quy | `auth.spec.ts`, `birth-profile.spec.ts`, `chart-list.spec.ts`, `layout.spec.ts`, `Select.spec.ts`, `smoke.spec.ts` (Tổng 38/38 tests) | [ci] | VERIFIED |
| **AC-E4** | E2E | Chẩn đoán lỗi E2E được tăng cường trên CI | Bổ sung `actions/upload-artifact` tải `playwright-report` khi thất bại trong `.github/workflows/frontend-ci.yml` (D-M10-07) | [repo] | VERIFIED |
| **AC-C1** | Hợp đồng | 14/14 trường của `ChartResponse` khớp hoàn toàn giữa BE và FE | `frontend/src/features/chart/api/mocks/fixtures.contract.test.ts` kiểm chứng từng trường theo `EXPECTED_TOP_LEVEL_KEYS` | [run]/[repo] | VERIFIED |
| **AC-C2** | Hợp đồng | Dung sai cấu trúc diễn giải Backend Sprint 4 | Test kiểm chứng viewer không vỡ khi `interpretations: []`, `tone` null/vắng, `interpretationVersion: null` (`chartViewModel.test.ts`, `fixtures.contract.test.ts`) | [run]/[repo] | VERIFIED |
| **AC-C3** | Hợp đồng | Các sai lệch hợp đồng thực tế được lập hồ sơ rõ ràng | Ghi nhận KG-M10-04 (`chartType` string vs literal `"Natal"`), FG-01, FG-13, FG-14 | [repo] | VERIFIED |
| **AC-R1** | Hồi quy | Toàn bộ test suite unit/component tiếp tục đạt 100% | Chạy `npm test` trên toàn bộ 130 test files: **1049 tests passed (100%)** | [run] | VERIFIED |
| **AC-R2** | Hồi quy | Không làm suy yếu, bỏ qua (`skip`) hoặc xóa bất kỳ test nào | Kiểm tra `git diff` toàn bộ repo: không có test nào bị xóa hay skip | [repo] | VERIFIED |
| **AC-R3** | Hồi quy | Bổ sung test kiểm thử tích hợp cho các khoảng trống đã xác định | Bổ sung 5 tests mới trong M10.3 (`fixtures.contract.test.ts`, `chartViewModel.test.ts` Group I) và 1 test chống chớp nút resolving trong `MarketingLayout.test.tsx` | [run]/[repo] | VERIFIED |
| **AC-Q1** | Cổng | 4 lệnh kiểm tra tĩnh và build đạt exit code 0 | `format:check` (0), `lint` (0), `typecheck` (0), `build` (0) | [run] | VERIFIED |
| **AC-Q2** | Cổng | 12/12 Grep Gates kiến trúc B1–B12 đạt 0 vi phạm | Chạy rà soát grep tự động trên toàn codebase (Mục 7) | [run] | VERIFIED |
| **AC-Q3** | Cổng | Không có dependency mới; không `dangerouslySetInnerHTML` | `package.json` giữ nguyên dependencies; grep `dangerouslySetInnerHTML` = 0 | [repo] | VERIFIED |
| **AC-Q4** | Cổng | QA thủ công Q1–Q12 ghi đủ trường; không có lỗi P0/P1 mở | Bảng kiểm toán Mục 8; 12/12 tiêu chí đạt PASS trên máy thật (kể cả trợ năng đọc màn hình qua Windows Narrator); 0 lỗi P0/P1 mở | [owner] | VERIFIED |
| **AC-D1** | Tài liệu | UI Spec §12.5, §13–14 khớp mã nguồn thực tế (FG-08/09 đóng) | Cập nhật `Frontend_UI_Specification.md`: `role="group"`, điều khiển zoom 1×–3× thay vì pinch gesture, cây route thực tế, ghi chú Recharts/Framer | [repo] | VERIFIED |
| **AC-D2** | Tài liệu | `CHANGELOG.md` ghi nhận đầy đủ Sprint F4 | Cập nhật `frontend/CHANGELOG.md` mục `0.3.0` theo chuẩn Keep a Changelog (mục Added và Changed) | [repo] | VERIFIED |
| **AC-D3** | Tài liệu | Phiên bản frontend và lockfile được nâng lên `0.3.0` | Cập nhật `package.json` và `package-lock.json` lên `0.3.0` theo D-M10-04 | [repo] | VERIFIED |
| **AC-D4** | Tài liệu | F4 Plan Mục 45 & 47 cập nhật số liệu thực tế | Cập nhật baseline 130 files / 1049 tests, trạng thái FG-08/09 RESOLVED trong F4 Plan | [repo] | VERIFIED |
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
| **D-M10-08** | Phân định phạm vi thiết bị trợ năng chuyên dụng ngoài môi trường Windows | Giới hạn miễn trừ C4 chỉ áp dụng cho thiết bị chuyên dụng (VoiceOver trên macOS/iOS, TalkBack trên Android). Trên môi trường máy trạm thử nghiệm (Windows 11), kiểm thử thực tế bằng Windows 11 Narrator có sẵn đã đạt PASS cho Q7. D-M10-08 cấm lấy việc thiếu thiết bị để bỏ qua kiểm tra khả thi trên môi trường hiện có | Owner | **APPROVED** |
| **D-M10-09** | Mở rộng Allowlist lỗi mạng cho E2E Chart Spec (`POST /api/v1/auth/refresh -> 400 và 401`) | Backend trả về HTTP 400 khi chưa có cookie phiên tại thời điểm bootstrap ứng dụng ban đầu (`Missing refresh token`) và HTTP 401 khi phiên hết hạn; cả hai đều là hành vi bootstrap bình thường của phiên làm việc chưa đăng nhập, không phải lỗi ứng dụng hay lỗi mạng bất thường | Owner | **APPROVED** |
| **D-M10-10** | Bổ sung điều hướng Đăng nhập / Đăng ký / Vào app vào header MarketingLayout | Xuất phát từ nguyên nhân do Owner nêu ra: *Trang chủ trước đó chứa header không bao gồm nút định hướng đến trang Login/Register, khiến mỗi lần cần đăng nhập hoặc đăng kí phải gõ /login trên thanh tìm kiếm*. Phân loại: `UX / Product Navigation`. Sửa chớp nút bằng cách chỉ hiển thị nút khi `status === "unauthenticated"` hoặc `status === "authenticated"` (ẩn hoàn toàn khi `status === "resolving"`), đã bổ sung unit test tự động bảo vệ | Owner | **APPROVED** |

---

## 3. Đối chiếu Milestone Tiền nhiệm

| Milestone | Tên module | Trạng thái kiểm chứng lại tại M10 |
|---|---|:---:|
| **FE-S4.1** | Chart API Client & Mutation Hook | **VERIFIED** — API client `createNatalChart`, `getChart`, `listCharts`, hooks React Query |
| **FE-S4.2** | Chart View Model & Domain Logic | **VERIFIED** — `chartViewModel.ts`, mapping DTO sang immutable VM bằng `deepFreeze`, format, labels, tolerance cho diễn giải Backend |
| **FE-S4.3** | Calculate Flow & Chart Viewer Shell | **VERIFIED** — Nút "Tính lá số" trên profile card, modal `CalculateChartDialog`, trang `/app/charts/:id`, loading skeleton, error handling, `HouseDataNotice` |
| **FE-S4.4** | Chart Wheel Foundation (SVG Engine) | **VERIFIED** — Vẽ SVG toán học: 12 cung hoàng đạo `ZodiacLayer`, 12 nhà `HouseLayer`, 4 góc ASC/DSC/MC/IC `AngleLayer` |
| **FE-S4.5** | Planet Rendering Engine | **VERIFIED** — Lớp hành tinh `PlanetLayer`, glyphs, thuật toán dàn nhãn một làn với 2 tầng bán kính Tier A / Tier B (`labelLayout.ts`) chống chồng lấn |
| **FE-S4.6** | Aspect Rendering Engine | **VERIFIED** — Lớp góc chiếu `AspectLayer`, vẽ 5 loại aspect với nét vẽ hài hòa / căng thẳng |
| **FE-S4.7** | Planet, House & Aspect Data Tables | **VERIFIED** — 3 bảng dữ liệu ngữ nghĩa (`PlanetTable`, `HouseTable`, `AspectTable`), thẻ mobile, nhãn độ $D^\circ M'$ |
| **FE-S4.8** | Synchronized Inspection & Selection | **VERIFIED** — Đồng bộ 2 chiều Wheel ↔ Tables ↔ SelectionDetail qua `selection.ts`, bộ lọc aspect kèm chip hủy lọc `AspectFilterChip` |
| **FE-S4.9** | Responsive & Accessibility Hardening | **VERIFIED** — Bố cục 3 chế độ theo viewport, `@container (min-width: 1010px)`, zoom 1×–3×, căn giữa bản vẽ, 0 lỗi axe |
| **FE-S4.10** | Integration Testing, Real Backend E2E & Sprint Closure | **VERIFIED** — 38/38 Playwright E2E tests xanh trên Backend thật, bump version 0.3.0, đóng sprint |
| **FE-S4.11** | Saved Charts Management | **VERIFIED** — Danh sách lá số `/app/charts`, phân trang `pageSize = 12`, liên kết hồ sơ người dùng |

---

## 4. Kiểm thử Tự động E2E (`chart.spec.ts`)

- **Hạ tầng E2E:** Playwright `@playwright/test`, dự án `chromium` (Desktop Chrome 1280×720). Backend thật: Express + PostgreSQL + Prisma. Mock duy nhất: `GET /api/v1/locations/search` (tránh phụ thuộc GeoNames ngoài).
- **Nguyên tắc:** Dữ liệu tài khoản và hồ sơ sinh sinh ngẫu nhiên theo `Date.now()`. So khớp giá trị thiên văn lấy trực tiếp từ phản hồi API bắt được qua `page.waitForResponse` thay vì hard-code. Tuyệt đối không dùng `waitForTimeout`/`sleep`.
- **Tổng số tests trong `chart.spec.ts`:** 17 tests (chạy tuần tự theo từng kịch bản).
- **Kết quả:**
  - **Scenario 1 (Tính lá số thành công đầy đủ):** Đăng ký $\to$ Tạo hồ sơ $\to$ Tính lá số $\to$ Viewer hiển thị Wheel và 3 Bảng khớp API $\to$ Chọn hành tinh đồng bộ $\to$ Escape bỏ chọn $\to$ Chọn từ Aspect Table $\to$ Toggle công tắc góc chiếu $\to$ Mở lại từ danh sách lá số $\to$ Kiểm tra không có `pageerror` và không có phản hồi API $\ge 400$ bất ngờ ngoài allowlist đã công bố (cho phép `POST /api/v1/auth/refresh -> 400 và 401` theo D-M10-09 vì là phản hồi bootstrap phiên thông thường khi chưa có cookie phiên hoặc phiên hết hạn).
  - **Scenario 2 (Suy thoái khi không rõ giờ sinh):** Đăng ký $\to$ Tạo hồ sơ bỏ tick "biết rõ giờ sinh" $\to$ Tính lá số $\to$ API trả `isHouseDataAvailable=false`, `houses=[]`, `angles=[]` $\to$ Viewer hiển thị thông báo `HouseDataNotice` $\to$ Cột "Nhà" trong Bảng Hành tinh tự động bị lược bỏ hoàn toàn (E2E khẳng định `columnheader "Nhà"` và `columnheader "Cusp (độ)"` vắng mặt, không hiển thị số giả hay dấu gạch nối bịa đặt) $\to$ Wheel ẩn vạch chia nhà và trục góc (kiểm chứng bằng Vitest component test C5; trong E2E kiểm chứng qua `HouseDataNotice` và absence của house columnheaders) $\to$ Không có `NaN`/`undefined` trên trang.

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
| **Unit/Component Test** | `npm test` | **130 test files passed, 1049 tests passed (100%)** | **PASS** |
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

### 8.1 Siêu dữ liệu Môi trường Thử nghiệm (Audit Environment Metadata)
- **Người thực hiện:** Owner trực tiếp thao tác, thẩm định và phê duyệt
- **Hệ điều hành:** Windows 11 Pro 23H2 (OS Build 22631.4317, 64-bit)
- **Trình duyệt:** Google Chrome 155.0.8059 (hoặc Microsoft Edge 155.0.4283, 64-bit) trên Laptop Dell Precision 5530 4K Touchscreen
- **Công cụ Trợ năng & Phân tích:** Windows 11 Narrator (`Win + Ctrl + Enter`), Chrome Accessibility Tree, Chrome DevTools Rendering & Device Mode, Colour Contrast Analyser (CCA)
- **Thiết bị vật lý:** Laptop Dell Precision 5530, màn hình 4K (3840×2160, Scale 250%, có màn hình cảm ứng điện dung vật lý Physical Touchscreen)
- **Ngày thực hiện:** 2026-10-28 – 2026-10-29
- **Commit SHA / Phiên bản Build:** `5762233` (sau khi refactor header navigation & MarketingLayout) và `c29a5b5` / Frontend Version `0.3.0` (Bản build phát hành cuối cùng của Sprint F4)
- **URL kiểm thử chuẩn:** `http://localhost:5173/app/charts/:chartId` (Kết nối Backend PostgreSQL thật `http://localhost:3000`)
- **Ghi chú về nguồn bằng chứng & Smoke test:** Toàn bộ 12 tiêu chí kiểm thử thủ công đã được kiểm chứng trực tiếp trên bản build cuối `0.3.0` (`c29a5b5` và `5762233`) bởi Owner. Các tệp ảnh `evidence/m10_*.png` được trích xuất trực tiếp từ bản build cuối này. Đối với các tiêu chí chuyên sâu đã đo đạc kỹ lưỡng ở các milestone trước trên cùng laptop Dell Precision 5530 4K Touchscreen (như đo đạc kích thước viewport 320/360/375px ở M9, cảm ứng vật lý ở M9, kiểm tra thang xám mù màu ở M6/M8), chúng được đối chiếu và xác nhận tính ổn định liên tục trên bản build cuối `0.3.0`, tham chiếu song song cùng các ảnh hành trình đầy đủ `evidence/m10_full_journey_natal_chart_*.png`. Đồng thời, đã smoke test lại trang chủ `/` trên commit `5762233`: nút Đăng nhập / Đăng ký hiển thị ổn định khi chưa đăng nhập, nút Vào ứng dụng hiển thị khi đã đăng nhập, và không chớp nút khi `status === "resolving"`.

### 8.2 Bảng Kiểm toán Chi tiết

| # | Tiêu chí | Môi trường, URL & Thao tác kiểm thử từng bước | Bằng chứng lưu trữ | Kết quả |
|---|---|---|---|:---:|
| **Q1** | **Hành trình đầy đủ trên Backend thật** | **Môi trường & URL:** Windows 11 Pro · Chrome 155 · `5762233` / `c29a5b5` · `http://localhost:5173/app/charts/:id`<br>**Các bước:** Đăng ký tài khoản mới $\to$ Tạo 2 hồ sơ sinh $\to$ Bấm nút "Tính lá số" trên thẻ hồ sơ $\to$ Hộp thoại `CalculateChartDialog` hiển thị và xử lý mutation $\to$ Lưu lá số thành công $\to$ Tự động điều hướng đến trang Viewer `/app/charts/:chartId` $\to$ Nạp đầy đủ thông tin biểu đồ sao và dữ liệu chiêm tinh từ Backend thật. | [`evidence/m10_full_journey_natal_chart_1.png`](evidence/m10_full_journey_natal_chart_1.png)<br>[`evidence/m10_full_journey_natal_chart_2.png`](evidence/m10_full_journey_natal_chart_2.png)<br>[`evidence/m10_full_journey_natal_chart_3.png`](evidence/m10_full_journey_natal_chart_3.png) | **PASS** |
| **Q2** | **Nội dung Chart Viewer** | **Môi trường & URL:** Windows 11 Pro · Chrome 155 · `5762233` / `c29a5b5` · `http://localhost:5173/app/charts/:id`<br>**Các bước:** Đối chiếu trực quan toàn bộ thông tin giữa bánh xe Wheel SVG và 3 bảng dữ liệu (`PlanetTable`, `HouseTable`, `AspectTable`): 12 cung hoàng đạo, 10 thiên thể chính, định dạng tọa độ độ phút $D^\circ M'$, ký hiệu nghịch hành ℞ (`\uFE0E`), 4 góc ASC/DSC/MC/IC, 5 loại góc chiếu và đường aspect tương ứng. | [`evidence/m10_full_journey_natal_chart_1.png`](evidence/m10_full_journey_natal_chart_1.png)<br>[`evidence/m8_planet_selection.png`](evidence/m8_planet_selection.png) | **PASS** |
| **Q3** | **Thiếu giờ sinh (Degraded State)** | **Môi trường & URL:** Windows 11 Pro · Chrome 155 · `5762233` / `c29a5b5` · `http://localhost:5173/app/charts/:id`<br>**Các bước:** Tạo hồ sơ sinh bỏ tick ô "Tôi biết rõ giờ sinh" $\to$ Bấm "Tính lá số" $\to$ Trang viewer nạp dữ liệu suy thoái (`isHouseDataAvailable=false`, `houses=[]`, `angles=[]`) $\to$ Hiển thị rõ banner cảnh báo `HouseDataNotice` ở đầu trang $\to$ Bảng Hành tinh (`PlanetTable`) tự động lược bỏ hoàn toàn cột "Nhà" (không render `columnheader "Nhà"`, không bịa đặt số nhà hay dấu `-`) $\to$ Bảng Nhà (`HouseTable`) không hiển thị cấu trúc nhà mà thay bằng thông báo suy thoái $\to$ Bánh xe Wheel ẩn toàn bộ vạch chia nhà và 4 trục góc (xác nhận qua component test C5) $\to$ Khẳng định không có `NaN` hay `undefined` trên toàn giao diện. | [`evidence/m10_unknown_birth_time_degraded.png`](evidence/m10_unknown_birth_time_degraded.png)<br>[`evidence/m10_unknown_birth_time_warning.png`](evidence/m10_unknown_birth_time_warning.png) | **PASS** |
| **Q4** | **Điều hướng Bàn phím** | **Môi trường & URL:** Windows 11 Pro · Chrome 155 · `5762233` / `c29a5b5` · `http://localhost:5173/app/charts/:id`<br>**Các bước:** Nhấn phím `Tab`/`Shift+Tab` xuyên suốt trang: Skip link "Chuyển tới bảng dữ liệu" xuất hiện ở đầu trang khi nhận focus $\to$ Nhấn Enter chuyển focus trực tiếp tới `<main>` / bảng dữ liệu $\to$ Focus vòng tròn xanh hiển thị rõ tại từng hành tinh trên Wheel (`role="button"`) $\to$ Nhấn Enter/Space chọn hành tinh, nhấn phím `Esc` hủy chọn tức thì $\to$ Focus vào cụm nút zoom 1×–3×, bấm Space/Enter thu phóng, khi đạt min/max nút có `aria-disabled="true"` và không làm mất focus bàn phím. | [`evidence/m8_keyboard_focus_indicator.png`](evidence/m8_keyboard_focus_indicator.png)<br>[`evidence/m9_keyboard_skip_link_tables.png`](evidence/m9_keyboard_skip_link_tables.png)<br>[`evidence/m10_full_journey_natal_chart_1.png`](evidence/m10_full_journey_natal_chart_1.png) | **PASS** |
| **Q5** | **Cảm ứng vật lý (Touchscreen)** | **Môi trường & URL:** Windows 11 Pro · Chrome 155 · Dell Precision 5530 4K Touchscreen · `5762233` / `c29a5b5` · `http://localhost:5173/app/charts/:id`<br>**Các bước:** Dùng ngón tay chạm trực tiếp trên màn hình cảm ứng: Chạm vào glyph hành tinh trên Wheel SVG để chọn $\to$ Chạm dòng trong bảng hoặc thẻ mobile để đồng bộ $\to$ Chạm chip hủy lọc `AspectFilterChip` để bỏ chọn $\to$ Chạm các nút zoom 1×–3× với kích thước phím bấm cảm ứng $\ge 44\text{ px}$. Tuyệt đối không có hành vi chỉ kích hoạt khi rê chuột (hover-only). | [`evidence/m9_touchscreen_physical_selection.png`](evidence/m9_touchscreen_physical_selection.png)<br>[`evidence/m10_full_journey_natal_chart_2.png`](evidence/m10_full_journey_natal_chart_2.png) | **PASS** |
| **Q6** | **Responsive & Zoom trình duyệt** | **Môi trường & URL:** Windows 11 Pro · Chrome 155 · `5762233` / `c29a5b5` · `http://localhost:5173/app/charts/:id`<br>**Các bước:** Kiểm thử các breakpoint 320px, 360px, 375px, 800px, 1500px và Zoom trình duyệt 200%:<br>- Ở Mobile (< 768px): Thẻ mobile thay thế bảng rộng, bánh xe tự động căn giữa tâm bản vẽ (`useLayoutEffect`), nhìn rõ cả 4 góc ASC/MC/DSC/IC.<br>- Ở Tablet (768px–1009px): Bố cục 1 cột dọc mượt mà, sticky vô hiệu hóa để không che đè bảng dữ liệu.<br>- Ở Desktop (container $\ge 1010\text{ px}$): Bố cục 2 cột chia đôi cân đối, cột trái sticky khi viewport cao $\ge 1000\text{ px}$.<br>- Khi zoom 200%: Không phát sinh cuộn ngang toàn trang ngoài ý muốn. | [`evidence/m9_mobile_320_wheel_centered.png`](evidence/m9_mobile_320_wheel_centered.png)<br>[`evidence/m9_mobile_320_planet_cards.png`](evidence/m9_mobile_320_planet_cards.png)<br>[`evidence/m9_mobile_360_wheel_four_angles.png`](evidence/m9_mobile_360_wheel_four_angles.png)<br>[`evidence/m9_mobile_375_wheel_centered.png`](evidence/m9_mobile_375_wheel_centered.png)<br>[`evidence/m9_responsive_800_one_column_table.png`](evidence/m9_responsive_800_one_column_table.png)<br>[`evidence/m9_desktop_two_column_layout.png`](evidence/m9_desktop_two_column_layout.png)<br>[`evidence/m10_full_journey_natal_chart_1.png`](evidence/m10_full_journey_natal_chart_1.png) | **PASS** |
| **Q7** | **Trợ năng Trình đọc màn hình** | **Môi trường & URL:** Windows 11 Pro · Chrome 155 · Windows 11 Narrator (`Win+Ctrl+Enter`) · `5762233` / `c29a5b5` · `http://localhost:5173/app/charts/:id`<br>**Các bước:** Khởi chạy Windows 11 Narrator, điều hướng qua trang lá số và lắng nghe phản hồi âm thanh:<br>1. Wheel SVG: Narrator đọc `role="group"` với nhãn tóm tắt lá số `aria-label="Bản đồ sao chiêm tinh [Tên hồ sơ]..."`.<br>2. Nút hành tinh: Từng nút hành tinh (`role="button"`) được đọc đầy đủ thông số (tên thiên thể, cung, độ phút, nhà); trạng thái chọn/bỏ chọn phản ánh chính xác qua `aria-pressed="true"/"false"`.<br>3. Live Region: Vùng `role="status"` (`aria-live="polite"`, `aria-atomic="true"`) thông báo tự động mỗi khi người dùng chọn hoặc hủy chọn hành tinh/góc chiếu.<br>4. Bảng dữ liệu: Cấu trúc HTML semantic chuẩn (`<table>`, `<caption>`, `<thead>`, `<th> scope="col"`, `<td>`) cho phép Narrator đọc rành mạch tiêu đề cột khi di chuyển giữa các ô. | Cây trợ năng Chrome Accessibility Tree & Windows Narrator run logs trên build `0.3.0`<br>[`evidence/m8_keyboard_focus_indicator.png`](evidence/m8_keyboard_focus_indicator.png)<br>[`evidence/m10_full_journey_natal_chart_1.png`](evidence/m10_full_journey_natal_chart_1.png) | **PASS** |
| **Q8** | **Giảm chuyển động (Reduced Motion)** | **Môi trường & URL:** Windows 11 Pro · Chrome 155 DevTools Rendering (`prefers-reduced-motion: reduce`) · `5762233` / `c29a5b5` · `http://localhost:5173/app/charts/:id`<br>**Các bước:** Bật cờ `prefers-reduced-motion: reduce` trong Chrome DevTools Rendering $\to$ Tương tác chọn hành tinh, chuyển đổi tab và thu phóng $\to$ Toàn bộ hoạt ảnh chuyển tiếp CSS bị triệt tiêu tức thì nhờ lớp `motion-reduce:transition-none`, bảo vệ người dùng nhạy cảm tiền đình. | [`evidence/m10_reduced_motion.png`](evidence/m10_reduced_motion.png) | **PASS** |
| **Q9** | **Tương phản & Thang xám CVD** | **Môi trường & URL:** Windows 11 Pro · Chrome 155 DevTools Emulate vision deficiencies: Achromatopsia · Colour Contrast Analyser (CCA) · `5762233` / `c29a5b5` · `http://localhost:5173/app/charts/:id`<br>**Các bước & Số đo kiểm thử chi tiết:**<br>1. Đo tương phản định lượng bằng Colour Contrast Analyser (CCA) trên cả 2 theme:<br>- **Dark Theme (nền `#1D2338`):**<br>  • Nét Hài hòa (`#798DCF`): **4.83:1** ($\ge 3:1$ PASS WCAG 1.4.11 UI component)<br>  • Nét Căng thẳng (`#D4A05E`): **6.66:1** ($\ge 3:1$ PASS)<br>  • Nét Trung tính (`#8F95A0`): **5.17:1** ($\ge 3:1$ PASS)<br>- **Light Theme (nền `#ECECEC`):**<br>  • Nét Hài hòa (`#40518E`): **6.38:1** ($\ge 3:1$ PASS)<br>  • Nét Căng thẳng (`#C08A3E`): **2.56:1** (nhẹ dưới 3:1, bù trừ hoàn toàn bởi nét đứt `8 5` bản 2.5px không phụ thuộc màu sắc theo WCAG 1.4.1; chấp nhận qua Accepted Gap `KG-M6-08`)<br>  • Nét Trung tính (`#4B5563`): **6.40:1** ($\ge 3:1$ PASS)<br>2. Giả lập mù màu hoàn toàn (Achromatopsia / thang xám 100%) trong DevTools:<br>Cả 5 loại góc chiếu nhận diện và phân biệt rõ ràng bằng mắt thường nhờ kiểu nét vẽ độc lập (Hợp: cung liền dày; Lục hợp: nét chấm `1 5`; Vuông chiếu: nét đứt vừa `8 5`; Tam hợp: nét liền mảnh; Đối xung: nét gạch dài vừa `16 6`) và bảng chú giải `AspectLegend`; độ tương phản văn bản chữ/nền đạt chuẩn WCAG AA ($\ge 4.5:1$). | [`evidence/m6_achromatopsia_cvd_verification.png`](evidence/m6_achromatopsia_cvd_verification.png)<br>[`evidence/m8_achromatopsia_cvd_verification.png`](evidence/m8_achromatopsia_cvd_verification.png)<br>[`evidence/m10_full_journey_natal_chart_1.png`](evidence/m10_full_journey_natal_chart_1.png) | **PASS** |
| **Q10** | **Xử lý trạng thái lỗi (404 Not Found)** | **Môi trường & URL:** Windows 11 Pro · Chrome 155 · `5762233` / `c29a5b5` · `http://localhost:5173/app/charts/00000000-0000-0000-0000-000000000000`<br>**Các bước:** Truy cập trực tiếp UUID lá số không tồn tại trong cơ sở dữ liệu $\to$ Trang hiển thị thông báo lỗi tiếng Việt thân thiện "Không tìm thấy lá số" kèm nút hành động điều hướng quay về danh sách lá số hoặc danh sách hồ sơ sinh, không để lộ mã lỗi kỹ thuật chưa xử lý. | [`evidence/m10_error_404_state.png`](evidence/m10_error_404_state.png) | **PASS** |
| **Q11** | **Quản lý danh sách lá số đã lưu** | **Môi trường & URL:** Windows 11 Pro · Chrome 155 · `5762233` / `c29a5b5` · `http://localhost:5173/app/charts`<br>**Các bước:** Đăng nhập tài khoản đã có dữ liệu $\to$ Truy cập tuyến đường `/app/charts` qua menu điều hướng $\to$ Kiểm tra danh sách hiển thị đầy đủ các lá số đã tạo (bao gồm tên hồ sơ sinh được ghép ở client, ngày giờ tính, nút mở xem) $\to$ Thử nghiệm phân trang Trước/Sau (`pageSize = 12`) $\to$ Bấm vào lá số mở lại chính xác trang viewer tương ứng. | [`evidence/m10_saved_charts_list.png`](evidence/m10_saved_charts_list.png) | **PASS** |
| **Q12** | **Điều hướng trình duyệt & Phục hồi** | **Môi trường & URL:** Windows 11 Pro · Chrome 155 · `5762233` / `c29a5b5` · `http://localhost:5173/app/charts/:id`<br>**Các bước:** Từ trang xem lá số `/app/charts/:id`, bấm nút quay lại trình duyệt Back (←) $\to$ Trở về `/app/charts` $\to$ Bấm nút tiến Forward (→) $\to$ Quay lại đúng lá số $\to$ Nhấn phím F5 / Ctrl+R làm tươi trang $\to$ Phiên làm việc được giữ nguyên vẹn (session bootstrap mượt mà), dữ liệu lá số được nạp lại tức thì từ cache hoặc fetch lại mà không xảy ra lỗi trắng trang, không văng đăng xuất. | [`evidence/m10_full_journey_natal_chart_4.png`](evidence/m10_full_journey_natal_chart_4.png) | **PASS** |

---

## 9. Cập nhật Tài liệu & Cấu hình Phiên bản

1. **`Frontend_UI_Specification.md`**:
   - §12.5 (Chart Wheel Accessibility): Cập nhật mô tả sang `role="group"` + `role="button"` (`aria-pressed`) khớp với hiện thực mã nguồn (giải quyết dứt điểm FG-08).
   - §12.5 (Dòng 848) & §7.2 (Dòng 309): Cập nhật cơ chế điều khiển thu phóng sang cụm nút 1×–3×/Đặt lại chuyên dụng kèm hỗ trợ pinch-to-zoom gốc của trình duyệt/hệ điều hành, loại bỏ mô tả gesture pinch tùy biến phức tạp.
   - §13–§14 (Page Spec & Routing): Cập nhật bảng route và sơ đồ cây route khớp thực tế mã nguồn (`router.tsx`), đánh dấu các route chưa làm (`/chart/new`, `/chart/:chartId` guest, `/app/settings`, `/knowledge*`) thuộc backlog lộ trình tương lai (giải quyết FG-09).
   - Dòng 909–912, 1109, 1143: Bổ sung ghi chú rõ ràng về việc Recharts và Framer Motion chưa cài đặt trong Sprint F4 theo quy định chất lượng.
2. **`Frontend_Architecture_Specification.md`**:
   - Thêm ghi chú định hướng cho cấu hình `manualChunks` tách vendor Recharts/Framer Motion.
3. **`Sprint_F4_Implementation_Plan.md`**:
   - Cập nhật số liệu baseline kiểm thử từ "78 file / 391 test" lên "130 file / 1049 test".
   - Cập nhật trạng thái FG-08 và FG-09 sang `RESOLVED`, FG-02 sang `Partially resolved / Known Gap — defer`.
4. **`frontend/CHANGELOG.md`**:
   - Bổ sung toàn diện mục `[0.3.0] - 2026-10-28` tổng kết toàn bộ thành quả của Sprint F4.
   - Bổ sung mục `### Changed` ghi nhận bổ sung điều hướng Đăng nhập / Đăng ký / Vào app vào header `MarketingLayout` theo yêu cầu từ Owner kèm giải pháp chống chớp nút khi `status === "resolving"` và unit test tự động.
5. **`package.json` & `package-lock.json`**:
   - Nâng phiên bản `version` lên `0.3.0` đồng bộ ở cả `package.json` và `package-lock.json` (root và `packages[""]`) theo đúng phê duyệt D-M10-04.

---

## 10. Bảng Tổng hợp Known Gaps Cuối cùng (Final Known Gaps)

### 10.1 Bảng Danh mục Phân loại Tổng thể

| ID | Vấn đề | Phân loại | Hướng xử lý / Chủ sở hữu |
|---|---|---|---|
| **FG-01** | `ChartResponse` chưa có `birthProfileId`/dữ liệu sinh/`isBirthTimeKnown` | **Requires Backend change** | Sprint Backend sau |
| **FG-02** | Mỗi lần tính tạo 1 snapshot mới (`save=true`); chưa có UI xóa chart | **Known Gap — defer** | Xem chi tiết 7 điều kiện bên dưới |
| **FG-03** | Guest chart (`/chart/new`, `save=false`) chưa có route xem lại | **Architectural decision** | Owner xem xét ở phase sau |
| **FG-04** | `isApplying` kiểu boolean ⇒ "Tách xa" cho mọi `false` | **Requires Backend change** | Sprint Backend sau nếu cần trạng thái chính xác |
| **FG-05** | Pinch-to-zoom tùy biến bằng gesture phức tạp | **Known Gap — defer** | Xem chi tiết 7 điều kiện bên dưới |
| **FG-06** | Ma trận aspect grid, element color, số La Mã nhà, Pattern UI | **Known Gap — defer** | Backlog Phase tiếp theo |
| **FG-07** | Mặt Trăng khi thiếu giờ sinh: chưa có độ bất định riêng từng thiên thể | **Architectural decision** | Owner xem xét |
| **FG-08** | UI Spec §12.5 `role="img"` | **RESOLVED** | Đã giải quyết ở M10.6a |
| **FG-09** | UI Spec §13–14 route & ghi chú Recharts/Framer Motion | **RESOLVED** | Đã giải quyết ở M10.6a |
| **FG-10** | Debt Core: `<title>` động, focus sau điều hướng, drawer focus trap | **Existing debt — unrelated** | Backlog Core |
| **FG-11** | Nợ domain/lỗi cũ kế thừa từ Sprint F3 (`INVALID_BIRTH_TIME`... không liên quan F4) | **Existing debt — unrelated** | Xem chi tiết 7 điều kiện bên dưới |
| **FG-12** | Hiển thị glyph Unicode phụ thuộc font nền tảng | **Known Gap — defer** | Xem chi tiết 7 điều kiện bên dưới |
| **FG-13** | Danh sách chart ghép tên hồ sơ sinh ở client (`pageSize=100`) | **Requires Backend change** | Backend đưa `birthProfileLabel` vào summary |
| **FG-14** | `ChartSummaryResponse` chưa có `isHouseDataAvailable` | **Requires Backend change** | Backend bổ sung cờ vào summary DTO |
| **KG-M6-08** | Tương phản đồ họa 3:1 của nét Căng thẳng trên Light theme (`#C08A3E` trên nền `#ECECEC` là 2.56:1, bù bằng nét đứt `8 5` 2.5px) | **Accepted UX/Design Gap** | Xem chi tiết 7 điều kiện bên dưới |
| **KG-M8-01** | Kiểm thử trình đọc màn hình trên thiết bị chuyên dụng ngoài Windows | **ACCEPTED GAP** | Xem chi tiết 7 điều kiện bên dưới |
| **KG-M8-04** | Đường aspect trên wheel chỉ hỗ trợ chuột/chạm | **ACCEPTED GAP** | Xem chi tiết 7 điều kiện bên dưới |
| **KG-M9-01** | Cột trái sticky chỉ kích hoạt khi chiều cao màn hình $\ge 1000\text{ px}$ | **ACCEPTED GAP** | Xem chi tiết 7 điều kiện bên dưới |
| **KG-M10-03** | E2E suite chỉ chạy Chromium Desktop Chrome; mobile viewport & cảm ứng kiểm thử thủ công | **Known Gap — defer** | Xem chi tiết 7 điều kiện bên dưới |
| **KG-M10-04** | Kiểu `chartType` Backend `string` vs Frontend literal `"Natal"` | **ACCEPTED GAP** | Xem chi tiết 7 điều kiện bên dưới |
| **KG-M10-05** | Helper E2E (`registerAndLogin`, `createBirthProfile`) lặp lại cục bộ giữa các file spec | **Known Gap — defer** | Xem chi tiết 7 điều kiện bên dưới |
| **KG-CI-NODE20** | Cảnh báo deprecation của Node 20 trên GitHub Actions workflows (`actions/checkout@v4`, `actions/setup-node@v4`) | **CI Warning** | Xem chi tiết 7 điều kiện bên dưới |

---

### 10.2 Hồ sơ Chi tiết 7 Điều kiện Quy định cho Từng Khoảng trống (Accepted Gaps)

#### 1. `KG-M8-01`: Kiểm thử Trình đọc Màn hình Chuyên dụng Ngoài Môi trường Windows
1. **Mô tả khoảng trống (Gap Description):** Đã kiểm thử thành công bằng Windows 11 Narrator và Chrome Accessibility Tree (đạt PASS cho Q7), nhưng chưa thực hiện kiểm thử trên các thiết bị và hệ điều hành chuyên dụng khác như Apple VoiceOver (macOS / iOS / iPadOS) hoặc Android TalkBack.
2. **Phạm vi & Mức độ nghiêm trọng (Scope & Severity):** Mức độ Thấp. Giao diện tuân thủ đầy đủ ngữ nghĩa WAI-ARIA (`role="group"`, `role="button"`, `aria-pressed`, `role="status"` live region, các thẻ ngữ nghĩa bảng chuẩn HTML).
3. **Lý do chấp nhận (Rationale / Justification):** Theo quyết định D-M10-08, môi trường làm việc của dự án hiện tại là trạm máy tính Windows 11 Pro; không sở hữu thiết bị Apple phần cứng thật hoặc thiết bị Android kiểm thử chuyên biệt.
4. **Phương án thay thế / Giảm thiểu (Mitigation / Fallback):** Kiểm chứng toàn diện 100% ngữ nghĩa cây trợ năng thông qua `vitest-axe` (0 lỗi), kiểm thử trực tiếp trên Windows Narrator đạt chuẩn, và người dùng bàn phím có thể tra cứu toàn bộ thông tin qua 3 bảng ngữ nghĩa độc lập.
5. **Kế hoạch xử lý (Resolution Plan / Backlog ticket):** Đưa vào kế hoạch QA đa nền tảng (Cross-platform Device Lab QA) trước khi phát hành phiên bản Mobile App Native hoặc mở rộng Beta thương mại.
6. **Tiêu chí đóng gap (Exit Criteria):** Chạy và ghi nhận biên bản kiểm thử thực tế trên ít nhất 1 thiết bị iOS có VoiceOver và 1 thiết bị Android có TalkBack.
7. **Chủ sở hữu & Phê duyệt (Owner & Approval):** Owner chính thức phê duyệt theo D-M10-08.

#### 2. `KG-M9-01`: Cột Trái Sticky Chỉ Bật Khi Chiều Cao Màn Hình $\ge 1000\text{ px}$ và Container $\ge 1010\text{ px}$
1. **Mô tả khoảng trống (Gap Description):** Trong chế độ xem 2 cột Desktop, cột trái chứa Wheel chỉ áp dụng vị trí `sticky` khi chiều cao viewport đạt $\ge 1000\text{ px}$ (`@media (min-height: 1000px)`). Trên các màn hình 1080p thông thường có chiều cao khả dụng 900–960px, cột trái sẽ cuộn tự nhiên theo trang.
2. **Phạm vi & Mức độ nghiêm trọng (Scope & Severity):** Mức độ Thấp. Không gây lỗi hiển thị, chỉ ảnh hưởng đến trải nghiệm ghim vị trí bánh xe khi cuộn danh sách bảng dữ liệu dài.
3. **Lý do chấp nhận (Rationale / Justification):** Tổng chiều cao của cột trái (Header thông tin + Bánh xe 400px + Điều khiển zoom + Chi tiết chọn) là 887px cộng thêm margin và top offset 88px = 999px. Nếu ép `sticky` trên viewport < 1000px sẽ làm chân cột trái bị cắt khuất hoặc gây cuộn lồng khó chịu.
4. **Phương án thay thế / Giảm thiểu (Mitigation / Fallback):** Cột trái cuộn tự nhiên đồng bộ với cột phải. Khi người dùng muốn xem lại biểu đồ, họ có thể cuộn nhẹ chuột hoặc dùng phím tắt/skip link điều hướng.
5. **Kế hoạch xử lý (Resolution Plan / Backlog ticket):** Nghiên cứu giải pháp thu nhỏ kích thước Wheel động (Dynamic SVG scale) hoặc xếp chồng accordion chi tiết chọn trong Sprint sau.
6. **Tiêu chí đóng gap (Exit Criteria):** Chiều cao cột trái được co giãn tối ưu để có thể sticky an toàn ở viewport từ 768px chiều cao trở lên.
7. **Chủ sở hữu & Phê duyệt (Owner & Approval):** Owner chính thức phê duyệt kiến trúc layout M9.

#### 3. `KG-M10-04`: Lệch Kiểu Dữ liệu `chartType` Backend (`string`) vs Frontend (`"Natal"`)
1. **Mô tả khoảng trống (Gap Description):** DTO Backend định nghĩa `chartType: string`, trong khi Frontend định nghĩa kiểu literal `chartType: "Natal"` (dành riêng cho biểu đồ ngày sinh).
2. **Phạm vi & Mức độ nghiêm trọng (Scope & Severity):** Mức độ Thấp. Khi Backend trả về chuỗi `"Natal"`, kiểu dữ liệu hoàn toàn tương thích và không phát sinh lỗi runtime.
3. **Lý do chấp nhận (Rationale / Justification):** Giữ nguyên kiểu literal ở Frontend giúp kiểm soát chặt chẽ kiểu hiển thị dành riêng cho Natal Chart của Sprint F4, tránh làm phình to mã xử lý đa biểu đồ chưa cần thiết.
4. **Phương án thay thế / Giảm thiểu (Mitigation / Fallback):** `chartViewModel.ts` kiểm tra và dung nạp an toàn; contract test `fixtures.contract.test.ts` giám sát tính tương thích.
5. **Kế hoạch xử lý (Resolution Plan / Backlog ticket):** Khi Backend triển khai Synastry hoặc Transit (Sprint F6+), Frontend sẽ mở rộng union type `ChartType = "Natal" | "Synastry" | "Transit"`.
6. **Tiêu chí đóng gap (Exit Criteria):** Hợp đồng DTO giữa hai phía được chuẩn hóa thành enum dùng chung qua OpenApi / JSON Schema.
7. **Chủ sở hữu & Phê duyệt (Owner & Approval):** Technical Lead & Owner chính thức phê duyệt.

#### 4. `KG-M8-04`: Đường Kẻ Aspect Trên Wheel SVG Chỉ Hỗ Trợ Chuột và Cảm Ứng
1. **Mô tả khoảng trống (Gap Description):** Các đường kẻ góc chiếu (aspect lines) trong SVG wheel không nhận phím Tab trực tiếp như một nút bấm bàn phím độc lập.
2. **Phạm vi & Mức độ nghiêm trọng (Scope & Severity):** Mức độ Thấp. Không làm mất tính tiếp cận của người dùng bàn phím.
3. **Lý do chấp nhận (Rationale / Justification):** Một lá số chiêm tinh có thể có từ 20 đến 40 đường góc chiếu chằng chịt ở tâm bánh xe. Nếu mỗi đường kẻ đều là một tab stop sẽ tạo ra "bẫy bàn phím" (keyboard trap) cực kỳ mệt mỏi cho người dùng khi phải nhấn Tab hàng chục lần để vượt qua.
4. **Phương án thay thế / Giảm thiểu (Mitigation / Fallback):** Toàn bộ dữ liệu góc chiếu được liệt kê song song đầy đủ trong Bảng Góc Chiếu (`AspectTable`). Người dùng bàn phím có thể Tab vào từng hàng của bảng để kích hoạt chọn góc chiếu và làm sáng 2 hành tinh đầu mút trên wheel.
5. **Kế hoạch xử lý (Resolution Plan / Backlog ticket):** Giữ nguyên thiết kế này như một quy chuẩn tiếp cận công thái học lâu dài.
6. **Tiêu chí đóng gap (Exit Criteria):** Duy trì tính đối xứng 100% giữa Wheel và AspectTable; tiếp tục đạt 0 vi phạm accessibility.
7. **Chủ sở hữu & Phê duyệt (Owner & Approval):** Owner chính thức phê duyệt thiết kế tương tác M8.

#### 5. `FG-02`: Mỗi Lần Tính Tạo Snapshot Mới (`save=true`); Chưa Có UI Xóa Lá Số Đã Lưu
1. **Mô tả khoảng trống (Gap Description):** Mỗi khi người dùng bấm "Tính lá số" trên hồ sơ sinh, Backend tạo ra một bản ghi lá số mới (`save=true`). Hiện tại giao diện chưa cung cấp tính năng xóa hoặc quản lý các bản ghi lá số trùng lặp.
2. **Phạm vi & Mức độ nghiêm trọng (Scope & Severity):** Mức độ Trung bình. Không gây lỗi hỏng dữ liệu, nhưng có thể sinh nhiều lá số trùng thông tin trong danh sách `/app/charts`.
3. **Lý do chấp nhận (Rationale / Justification):** Phạm vi của Sprint F4 tập trung vào tính toán thiên văn chính xác, biểu diễn trực quan đồ họa và điều hướng dữ liệu. Quản lý vòng đời dữ liệu lá số (CRUD charts) thuộc phạm vi quản trị dữ liệu người dùng.
4. **Phương án thay thế / Giảm thiểu (Mitigation / Fallback):** Danh sách `/app/charts` có phân trang (`pageSize = 12`) giúp hiển thị gọn gàng; người dùng có thể mở bất kỳ bản ghi nào để xem lại.
5. **Kế hoạch xử lý (Resolution Plan / Backlog ticket):** Đưa tính năng "Xóa lá số đã lưu" và "Tái sử dụng lá số hiện có thay vì tính lại" vào Sprint F5 hoặc Backlog Quản lý dữ liệu cá nhân.
6. **Tiêu chí đóng gap (Exit Criteria):** Bổ sung endpoint `DELETE /api/v1/charts/:id` ở Backend và nút xóa có modal xác nhận ở Frontend.
7. **Chủ sở hữu & Phê duyệt (Owner & Approval):** Product Owner chính thức phê duyệt lùi sang Backlog.

#### 6. `FG-05`: Cử chỉ Thu phóng Cảm ứng Đa điểm (Pinch-to-zoom) Tùy biến Bằng Gesture Phức tạp
1. **Mô tả khoảng trống (Gap Description):** Chưa xây dựng bộ xử lý cử chỉ chụm 2 ngón tay (custom touch gesture recognizer) bằng mã nguồn tự viết để thu phóng bánh xe SVG.
2. **Phạm vi & Mức độ nghiêm trọng (Scope & Severity):** Mức độ Thấp.
3. **Lý do chấp nhận (Rationale / Justification):** Bất biến kiến trúc của Sprint F4 nghiêm cấm đưa thêm các thư viện xử lý cử chỉ nặng bên thứ ba (như Framer Motion, Hammer.js, react-use-gesture). Tự viết bộ nhận diện gesture phức tạp tiềm ẩn nguy cơ xung đột với thao tác cuộn trang tự nhiên của thiết bị di động.
4. **Phương án thay thế / Giảm thiểu (Mitigation / Fallback):** Khung wheel hỗ trợ cụm nút thu phóng chuyên dụng 1×–3× (`ChartZoomControls`) với kích thước cảm ứng chuẩn $\ge 44\text{ px}$, kết hợp với các thuộc tính CSS `touch-pan-x touch-pan-y touch-pinch-zoom` cho phép người dùng sử dụng thao tác pinch gốc mượt mà của trình duyệt/hệ điều hành.
5. **Kế hoạch xử lý (Resolution Plan / Backlog ticket):** Xem xét triển khai gesture Engine chuyên dụng khi xây dựng ứng dụng di động hoàn chỉnh.
6. **Tiêu chí đóng gap (Exit Criteria):** Người dùng có thể phóng to thu nhỏ chính xác bằng cả nút bấm và thao tác chạm gốc, không gây rung lắc giao diện.
7. **Chủ sở hữu & Phê duyệt (Owner & Approval):** Owner chính thức phê duyệt bất biến kiến trúc M9.

#### 7. `KG-M6-08`: Tương Phản Đồ Họa Của Nét Căng Thẳng Trên Light Theme (2.56:1 Bù Đắp Bằng Nét Đứt)
1. **Mô tả khoảng trống (Gap Description):** Trên Light Theme (nền `#ECECEC`), nét vẽ góc chiếu Căng thẳng (`#C08A3E`) có tỉ lệ tương phản màu sắc là 2.56:1, thấp hơn nhẹ so với ngưỡng lý tưởng 3:1 của WCAG 2.1 SC 1.4.11 (Non-text Contrast).
2. **Phạm vi & Mức độ nghiêm trọng (Scope & Severity):** Mức độ Thấp. Hoàn toàn không ảnh hưởng trên Dark Theme (đạt 6.66:1) và người dùng vẫn phân biệt được góc chiếu không cần dựa vào màu.
3. **Lý do chấp nhận (Rationale / Justification):** Màu sắc được thiết kế đồng bộ với hệ thống token thiết kế chiêm tinh cổ điển. Quan trọng nhất, sự thiếu hụt màu sắc được bù đắp hoàn toàn bởi thuộc tính hình học: nét Căng thẳng sử dụng nét đứt chuẩn `8 5` với độ dày `2.5px`, tuân thủ tuyệt đối quy định WCAG 1.4.1 (Không sử dụng màu sắc làm phương tiện duy nhất để truyền tải thông tin).
4. **Phương án thay thế / Giảm thiểu (Mitigation / Fallback):** Bảng Góc Chiếu (`AspectTable`) ngữ nghĩa liệt kê đầy đủ bản chất góc chiếu ("Căng thẳng") bằng chữ viết có độ tương phản cao ($\ge 4.5:1$).
5. **Kế hoạch xử lý (Resolution Plan / Backlog ticket):** Đưa vào backlog tinh chỉnh Design System token cho Light Theme ở giai đoạn làm đẹp giao diện sau F5.
6. **Tiêu chí đóng gap (Exit Criteria):** Điều chỉnh nhẹ giá trị độ sáng token màu nét Căng thẳng trên Light theme để đạt $\ge 3:1$ mà không làm mất tính thẩm mỹ cổ điển.
7. **Chủ sở hữu & Phê duyệt (Owner & Approval):** Owner chính thức phê duyệt theo thiết kế đồ họa M6.

#### 8. `KG-M10-03`: Bộ E2E Tự Động Hóa Chỉ Bao Phủ Chromium Desktop Chrome
1. **Mô tả khoảng trống (Gap Description):** Bộ kiểm thử tự động hóa Playwright E2E (`chart.spec.ts`) hiện chỉ cấu hình chạy trên dự án `chromium` với kích thước màn hình Desktop (1280×720); chưa có project Playwright riêng cho Mobile Viewport (Mobile Chrome / Mobile Safari).
2. **Phạm vi & Mức độ nghiêm trọng (Scope & Severity):** Mức độ Thấp. 
3. **Lý do chấp nhận (Rationale / Justification):** Các hành vi responsive đặc thù, bố cục thẻ mobile, cảm ứng chạm vật lý và căn giữa tâm wheel ở 320/360/375px đã được đo đạc và kiểm chứng thủ công thực tế 100% trên thiết bị thật Dell Touchscreen bởi Owner (Q5, Q6). Giữ E2E CI tập trung vào tính toàn vẹn dữ liệu Backend thật giúp tối ưu thời gian chạy pipeline.
4. **Phương án thay thế / Giảm thiểu (Mitigation / Fallback):** Kiểm thử Vitest component (`ChartViewerShell.test.tsx`, `viewport.test.ts`) kiểm tra liên tục các class Tailwind, Container Queries và logic responsive dưới mọi giả lập kích thước màn hình.
5. **Kế hoạch xử lý (Resolution Plan / Backlog ticket):** Thêm dự án Playwright `Mobile Chrome` (Pixel 5) vào cấu hình CI trong sprint tối ưu hóa test sau.
6. **Tiêu chí đóng gap (Exit Criteria):** Bổ sung ít nhất 1 spec E2E chạy độc lập trên `devices['Pixel 5']` trên CI pipeline.
7. **Chủ sở hữu & Phê duyệt (Owner & Approval):** Technical Lead & Owner chính thức phê duyệt.

#### 9. `KG-M10-05`: Helper E2E Lặp Lại Cục Bộ Giữa Các Spec (`chart.spec.ts` & `chart-list.spec.ts`)
1. **Mô tả khoảng trống (Gap Description):** Các hàm helper tạo tài khoản ngẫu nhiên và đăng nhập (`registerAndLogin`, `createBirthProfile`) đang được định nghĩa cục bộ trong từng tệp spec thay vì tái sử dụng từ một thư mục fixture/helper dùng chung.
2. **Phạm vi & Mức độ nghiêm trọng (Scope & Severity):** Mức độ Rất Thấp (Code hygiene / Test duplication). Hoàn toàn không ảnh hưởng tới người dùng cuối hay chất lượng test.
3. **Lý do chấp nhận (Rationale / Justification):** Theo nguyên tắc cô lập test của Playwright và ràng buộc D-M10-06: Không sửa đổi hoặc xáo trộn các spec E2E cũ đã ổn định nhằm triệt tiêu tối đa rủi ro hồi quy trong giai đoạn đóng Sprint F4.
4. **Phương án thay thế / Giảm thiểu (Mitigation / Fallback):** Các helper cục bộ được tự chủ hoàn toàn, sửa đổi ở một spec không gây ảnh hưởng chéo tới spec khác.
5. **Kế hoạch xử lý (Resolution Plan / Backlog ticket):** Gom nhóm các test utilities vào `frontend/e2e/helpers/` trong đợt bảo trì mã nguồn chung.
6. **Tiêu chí đóng gap (Exit Criteria):** Trích xuất helper dùng chung và chia sẻ an toàn qua custom Playwright fixtures.
7. **Chủ sở hữu & Phê duyệt (Owner & Approval):** Technical Lead & Owner chính thức phê duyệt.

#### 10. `FG-11`: Kế Thừa Nợ Domain / Lỗi Cũ Kế Thừa Từ Sprint F3
1. **Mô tả khoảng trống (Gap Description):** Một số mã lỗi nghiệp vụ cũ như `INVALID_BIRTH_TIME` hoặc nợ giao diện hồ sơ sinh từ F3 chưa được tái cấu trúc hoàn toàn.
2. **Phạm vi & Mức độ nghiêm trọng (Scope & Severity):** Mức độ Thấp. Không nằm trong phạm vi Natal Chart Viewer của Sprint F4.
3. **Lý do chấp nhận (Rationale / Justification):** Giữ nguyên vẹn mã nguồn F3 hoạt động ổn định, không mở rộng scope ngoài tầm kiểm soát của Sprint F4.
4. **Phương án thay thế / Giảm thiểu (Mitigation / Fallback):** Các lỗi này đã có từ điển thông báo lỗi tiếng Việt tương ứng trong `error-messages.ts`.
5. **Kế hoạch xử lý (Resolution Plan / Backlog ticket):** Xử lý trong backlog hoàn thiện tính năng hồ sơ người dùng.
6. **Tiêu chí đóng gap (Exit Criteria):** Rà soát và chuẩn hóa toàn bộ mã lỗi hồ sơ sinh khi mở rộng tính năng profile.
7. **Chủ sở hữu & Phê duyệt (Owner & Approval):** Owner chính thức phê duyệt.

#### 11. `KG-CI-NODE20`: Cảnh Báo Deprecation Của Node 20 Trên GitHub Actions Workflows
1. **Mô tả khoảng trống (Gap Description):** Khi chạy workflow CI trên GitHub Actions, xuất hiện cảnh báo môi trường thực thi Node 20 từ các action chính thức (`actions/checkout@v4`, `actions/setup-node@v4`).
2. **Phạm vi & Mức độ nghiêm trọng (Scope & Severity):** Mức độ Rất Thấp. Đây là cảnh báo hạ tầng của nền tảng GitHub, hoàn toàn không gây lỗi hay ảnh hưởng tới quá trình build và chạy test.
3. **Lý do chấp nhận (Rationale / Justification):** Toàn bộ pipeline CI vẫn kết thúc với trạng thái Success (mã thoát 0). Phiên bản LTS Node 20 vẫn là phiên bản ổn định được hỗ trợ chính thức.
4. **Phương án thay thế / Giảm thiểu (Mitigation / Fallback):** Giữ nguyên cấu hình workflow hiện tại; không tự ý chỉnh sửa hạ tầng runner khi chưa có yêu cầu đồng bộ toàn dự án.
5. **Kế hoạch xử lý (Resolution Plan / Backlog ticket):** Nâng cấp phiên bản các actions khi GitHub công bố bản nâng cấp hỗ trợ Node 22/24.
6. **Tiêu chí đóng gap (Exit Criteria):** Workflow CI sạch hoàn toàn cảnh báo hạ tầng runner.
7. **Chủ sở hữu & Phê duyệt (Owner & Approval):** Technical Lead & DevOps phê duyệt.

#### 12. `FG-12`: Glyph Chiêm Tinh Unicode Phụ Thuộc Font Hệ Thống Nền Tảng
1. **Mô tả khoảng trống (Gap Description):** Ký hiệu các cung hoàng đạo và hành tinh đang sử dụng các ký tự Unicode tiêu chuẩn kết hợp với biến thể hiển thị `\uFE0E` (chống biến thành emoji). Trên một số hệ điều hành hoặc thiết bị cũ thiếu font chiêm tinh chuẩn, ký tự có thể hiển thị dạng ô vuông hoặc font dự phòng của hệ thống.
2. **Phạm vi & Mức độ nghiêm trọng (Scope & Severity):** Mức độ Thấp.
3. **Lý do chấp nhận (Rationale / Justification):** Đã kiểm thử thành công trên Windows 11 Chrome/Edge: các ký tự glyph chiêm tinh hiển thị sắc nét, chuẩn dạng text vector, không bị biến thành emoji màu. Người dùng luôn có nhãn chữ tiếng Việt đi kèm trong bảng và thẻ để nhận biết.
4. **Phương án thay thế / Giảm thiểu (Mitigation / Fallback):** Ký tự có tiền tố/hậu tố `\uFE0E`; font-family fallback khai báo an toàn; nhãn tên tiếng Việt ("Bạch Dương", "Mặt Trời"...) luôn hiển thị song song.
5. **Kế hoạch xử lý (Resolution Plan / Backlog ticket):** Nhúng font webfont chuyên dụng (ví dụ Astra / AstroDot font subset woff2) trong sprint tối ưu hóa typography.
6. **Tiêu chí đóng gap (Exit Criteria):** Nhúng font glyph cục bộ tự host, đảm bảo đồng nhất 100% hiển thị trên mọi hệ điều hành.
7. **Chủ sở hữu & Phê duyệt (Owner & Approval):** Product Owner chính thức phê duyệt lùi sang backlog.

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
| **Thiếu giờ sinh** | Xử lý mượt mà khi `isHouseDataAvailable=false`, banner `HouseDataNotice`, bảng Planet lược bỏ hoàn toàn cột Nhà (không bịa số hay gạch nối), không `NaN` | **ĐẠT** |
| **Trợ năng (A11y)** | Bảng ngữ nghĩa, điều hướng bàn phím đầy đủ, skip link, live region, không chỉ dùng màu, 0 axe error | **ĐẠT** |
| **Responsive** | Bố cục 3 chế độ `@container`, căn giữa bản vẽ mobile, nút thu phóng 1×–3×, cảm ứng vật lý | **ĐẠT** |
| **Chất lượng** | 130 test files / 1049 tests xanh 100%, 4 lệnh kiểm tra tĩnh đạt, 12 grep gates sạch, 38/38 E2E xanh | **ĐẠT** |

---

## 12. Phê duyệt & Khuyến nghị Đóng Sprint F4

### **`PASS (OFFICIALLY ACCEPTED BY OWNER) — SPRINT F4 CLOSED`**

**Quyết định phê duyệt chính thức từ Owner:**
- **Ngày phê duyệt:** 2026-10-30
- **Người phê duyệt:** Owner
- **Trạng thái:** Toàn bộ kết quả Sprint F4 và 12 tiêu chí QA thủ công được nghiệm thu chính thức; toàn bộ các Known Gaps và Accepted Gaps trong Mục 10 được phê duyệt có chủ quyền theo đúng 7 điều kiện quy định.
- **Sprint F4 chính thức hoàn thành và đóng lại.**

**Căn cứ phê duyệt đóng:**
1. **Kiểm thử tự động hoàn hảo:** 130 test files với 1049 tests đạt 100% tỷ lệ pass. 12/12 ranh giới kiến trúc và 4 cổng chất lượng tĩnh đều sạch.
2. **E2E toàn diện trên Backend thật:** 38/38 test E2E xanh 100% (bao phủ cả 2 luồng Scenario 1 tính lá số đầy đủ và Scenario 2 suy thoái khi thiếu giờ sinh trên commit `5762233`, CI run #40850309135).
3. **QA thủ công đầy đủ:** 12/12 tiêu chí Q1–Q12 đã được Owner trực tiếp kiểm tra trên máy thật có màn hình cảm ứng (kể cả trợ năng đọc màn hình qua Windows Narrator), có bằng chứng ảnh minh họa cụ thể lưu trữ trong repo, 0 lỗi P0/P1 phát sinh; smoke test trang chủ `/` ổn định, không chớp nút.
4. **Tài liệu & Phiên bản đồng bộ:** UI Spec, Architecture Spec, F4 Plan, CHANGELOG và `package.json`/`package-lock.json` (`0.3.0`) đã được chuẩn hóa đồng nhất.
5. **Sẵn sàng cho Sprint F5:** Nền tảng hiển thị và hợp đồng dữ liệu đã dung nạp sẵn sàng để tiếp nhận module Diễn giải chiêm tinh (Interpretation UI) ở Sprint F5 mà không gây xáo trộn kiến trúc.

**Sprint F4 chính thức hoàn thành và đóng lại. Sẵn sàng khởi động Sprint F5.**
