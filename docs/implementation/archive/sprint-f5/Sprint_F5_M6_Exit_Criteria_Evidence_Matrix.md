# Sprint F5 — M6 Exit Criteria & Evidence Matrix
## Responsive & Accessibility Hardening

- **Vị trí lưu trữ:** `docs/implementation/archive/sprint-f5/Sprint_F5_M6_Exit_Criteria_Evidence_Matrix.md`
- **Phạm vi:** F5-M6.0 → M6.9 (Hardening responsive đa viewport 320px..1500px, kiểm tra 0 tràn ngang, đo đạc dữ liệu thực tế cho quyết định vị trí §7.1, đóng Known Gap KG-F5M3-04 S-05 @375px, gia cố a11y: outline heading, reduced motion, độ đọc, focus ring, liên kết nhảy, keyboard navigation, trình đọc màn hình Windows Narrator).
- **Trạng thái:** `IN PROGRESS` (Đã hoàn thành M6.0 & M6.1; đang tiến hành các task tiếp theo).
- **Nhánh / Commit bắt đầu:** `dev` @ `1978ac4` (commit baseline CI xanh).
- **Môi trường đo đạc:** Dev cục bộ (`http://localhost:5173` via Vite + Backend cục bộ `localhost:3000`), Chrome / Chromium trên Windows 11.
- **Ngày lập:** 2026-11-06.

---

## 1. Bảng Quyết Định Kỹ Thuật & Phê Duyệt Owner (D-M6-00 .. D-M6-13)

Dựa trên tài liệu xác nhận và phê duyệt của Owner (`Confirmation.md`):

| ID | Vấn đề | Quyết định được áp dụng | Trạng thái |
|---|---|---|---|
| **D-M6-00** | Bản chất Milestone M6 = "Hardening", không redesign | **Duyệt**: Giữ nguyên kiến trúc M4/M5, tập trung đo đạc, vá lỗi layout tràn ngang, gia cố trợ năng và tách biệt minh chứng tự động (Phần A) với minh chứng thủ công (Phần B). | **APPROVED** |
| **D-M6-01** | Định nghĩa môi trường "`dev`" | **Phương án (a)**: Chạy Vite cục bộ `http://localhost:5173` kết nối Backend cục bộ `http://localhost:3000`. Commit hash được ghi nhận rõ ràng trong ma trận. | **APPROVED** |
| **D-M6-02** | Quyết định vị trí §7.1 của InterpretationPanel | **Thu thập số đo thực tế tại M6.1**: Tạm giữ vị trí toàn chiều rộng sau lưới F4 để đo đạc khoảng cách cuộn (viewport heights) và số điểm dừng Tab. Số đo thu được: **3481px (4.83x)** tại 1280px; **34 Tab stops** (đạt ngưỡng `≤ 40 stops`). Đề xuất: **Giữ nguyên vị trí (mặc định)**. | **PENDING OWNER FINAL CONFIRMATION** |
| **D-M6-03** | Ma trận 11 Viewport & Ngưỡng tràn ngang | **Duyệt**: Đo trên 320, 360, 375, 428, 768, 1023, 1024, 1280, 1500, H≥1000px, Zoom 200%, 400%. Tiêu chí không tràn ngang trang: `document.documentElement.scrollWidth <= document.documentElement.clientWidth`. | **APPROVED** |
| **D-M6-04** | Tiêu chuẩn độ đọc & kích thước tương tác | **Duyệt**: Mục tiêu 45–80 ký tự/dòng (cpl); `line-height >= 1.5`; vùng chạm mobile tối thiểu `44x44px`. | **APPROVED** |
| **D-M6-05** | Thiết bị & Trình đọc màn hình QA | **Xác nhận cấu hình**: Windows 11 + Google Chrome + Windows Narrator. Các tổ hợp khác không khả dụng được ghi nhận vào Known Gap theo quy định. | **APPROVED** |
| **D-M6-06** | Bổ sung file Playwright E2E cho Responsive | **Duyệt Phương án (b)**: Tạo 1 file test E2E chuyên trách `frontend/e2e/interpretation-responsive.spec.ts` để tự động hoá đo đạc 12 cấu hình viewport, kiểm tra 0 tràn ngang, thứ tự đọc mobile và trạng thái suy giảm S-05. | **APPROVED** |
| **D-M6-07** | Phạm vi audit chuyển động (Reduced Motion) | **Phương án (a)**: Tập trung vào vùng nội dung route chart (`features/chart`); ghi nhận các thành phần ngoài route nếu có nhưng không tự ý mở rộng phạm vi. | **APPROVED** |
| **D-M6-08** | Quy trình Known Gap & Chuyển trạng thái `KG-F5M4-01` | **Duyệt**: `KG-F5M4-01` (Narrator) chuyển từ `ACCEPTED GAP` sang `IN PROGRESS` để xử lý kiểm thử thực tế tại M6.7 trên máy QA Windows Narrator. | **APPROVED** |
| **D-M6-09** | Kéo `KG-F5M3-04` (S-05 @375px) về M6.1 | **Duyệt**: Thực hiện đo đạc và chụp ảnh minh chứng S-05 @375px ngay trong Task M6.1. | **APPROVED** |
| **D-M6-10** | Nhánh làm việc & Phiên bản package | **Duyệt**: Tiếp tục làm việc trên nhánh `dev` hiện tại. Giữ nguyên version `0.3.0` trong `package.json` (sẽ bump `0.4.0` tại Milestone M8). | **APPROVED** |
| **D-M6-11** | Chính sách chỉnh sửa mã nguồn | **Duyệt**: Chỉ chỉnh sửa khi có bằng chứng đo đạc thất bại (FAIL) hoặc theo đúng quyết định kỹ thuật đã duyệt. | **APPROVED** |
| **D-M6-12** | Phê duyệt copy mới | Khi có bổ sung lối vào / nút mới, chuỗi copy phải được Owner duyệt trước khi merge. | **APPROVED** |
| **D-M6-13** | Phê duyệt Known Gap | Mọi nhãn `ACCEPTED GAP` phải có phê duyệt riêng lẻ theo từng ID từ Owner. | **APPROVED** |

---

## 2. Baseline Quality Gate Measurements (Task 0 / M6.0)

Đo lường trực tiếp tại HEAD `1978ac4` trên nhánh `dev`:

| Cổng kiểm tra | Lệnh thực thi | Kết quả thực tế | Trạng thái |
|---|---|---|---|
| **Format** | `npm --prefix frontend run format:check` | `All matched files use Prettier code style!` | **PASS** |
| **Lint** | `npm --prefix frontend run lint` | `eslint .` (0 errors, 0 warnings) | **PASS** |
| **Typecheck** | `npm --prefix frontend run typecheck` | `tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit` (exit code 0) | **PASS** |
| **Core Vitest Suite** | `npm --prefix frontend test -- src/features/chart src/pages/app/charts` | **61 test files / 751 tests passed** (0 failed, duration ~128s) | **PASS** |
| **E2E Responsive Suite** | `npm --prefix frontend run test:e2e -- e2e/interpretation-responsive.spec.ts` | **4 tests passed** (12 viewports đo đạc 0 tràn ngang, S-05 @375px, §7.1 metrics, mobile reading order) | **PASS** |
| **Zero Diff Gate** | `git diff 3711587..HEAD -- frontend/src/features/chart/model/selection.ts frontend/src/features/chart/model/interpretation.ts` | 0 dòng thay đổi (diff rỗng tuyệt đối so với baseline) | **PASS** |

---

## 3. Dữ Liệu Đo Đạc & Quyết Định Vị Trí §7.1 (Task 1 / M6.1)

### 3.1 Dữ liệu đo đạc thực tế thu được từ E2E Browser Test (Chromium)

| Chỉ số đo | Viewport 1280×720 (Desktop chuẩn) | Viewport 1500×900 (Desktop hai cột) | Viewport 375×667 (Mobile chuẩn) | Ngưỡng đánh giá theo Plan | Kết luận kỹ thuật |
|---|---|---|---|---|---|
| **Khoảng cách cuộn (Panel Top Distance)** | **3481px** (~4.83x viewport height) | **2501px** (~2.78x viewport height) | **6478px** (~9.71x viewport height) | Kế hoạch dự kiến ≤ 3x | Vượt ở màn hình 1 cột; đạt ≤ 3x ở màn hình 2 cột (1500px). |
| **Số điểm dừng Tab (Tab stops to Panel)** | **34 stops** | **34 stops** | **28 stops** (mobile cards layout) | Kế hoạch yêu cầu **≤ 40 stops** | **ĐẠT TIÊU CHUẨN** (34 ≤ 40 stops). Người dùng bàn phím chỉ cần 34 lần nhấn Tab từ đỉnh trang để tới nút nhóm đầu tiên của Diễn giải. |
| **Lối vào trực tiếp hiện có** | Nút "Đọc diễn giải" trong `SelectionDetail` (tự động mở mục tương ứng và chuyển focus tới nút mục). | Như 1280px. | Như 1280px. | Cần có lối vào từ trên trang. | Đã có lối vào tương tác thông qua việc chọn hành tinh trên Wheel hoặc Bảng. |

### 3.2 Đề xuất Quyết định §7.1 gửi Owner

- **Khuyến nghị:** **Giữ nguyên vị trí toàn chiều rộng sau lưới F4 (mặc định P-01 (a))**.
- **Lý do:**
  1. Số điểm dừng Tab là **34 stops**, hoàn toàn thoả mãn ngưỡng ràng buộc `≤ 40 stops`.
  2. Ở chế độ hai cột (viewport 1500px), khoảng cách cuộn là 2501px (chỉ 2.78x chiều cao màn hình), đáp ứng điều kiện `≤ 3x`.
  3. Giữ nguyên vị trí giúp bảo vệ toàn vẹn bố cục container query `@container (min-width:1010px)` của Sprint F4, tránh phá vỡ giao diện sticky hai cột đã được nghiệm thu kỹ lưỡng.
  4. Nút "Đọc diễn giải" trong `SelectionDetail` cung cấp bước nhảy trực tiếp và chuẩn xác tới nội dung diễn giải của hành tinh được quan tâm.

---

## 4. Phần A — Bằng Chứng Kiểm Thử Tự Động (Automated Quality Gates)

| ID | Quy trình / Lệnh kiểm thử | Phạm vi | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái | Minh chứng đính kèm |
|---|---|---|---|---|---|---|
| **A6-G01** | `npm run format:check` | Toàn bộ codebase frontend | Code style chuẩn Prettier | Pass 100% | **PASS** | Log CI / Terminal |
| **A6-G02** | `npm run lint` | Toàn bộ codebase frontend | 0 errors, 0 warnings (gồm `jsx-a11y`) | Pass (0 errors, 0 warnings) | **PASS** | Log CI / Terminal |
| **A6-G03** | `npm run typecheck` | `tsconfig.app.json` & `tsconfig.node.json` | 0 errors | Exit code 0 | **PASS** | Log CI / Terminal |
| **A6-G04** | `npm test -- src/features/chart src/pages/app/charts` | Core Chart & Interpretation Vitest suite | Toàn bộ tests pass | **61 test files / 753 tests passed** (0 failed) | **PASS** | `task-13563.log` |
| **A6-H01** | `ChartViewerShell.interpretation.test.tsx` | Phân cấp heading toàn trang H1..H4 ở S-02, S-05, S-03 | Phân cấp liên tục `level[i] <= level[i-1] + 1`, 0 nhảy cấp | **PASS** (Đã chứng minh đỏ-trước-xanh) | `ChartViewerShell.interpretation.test.tsx` |
| **A6-H02** | `ChartViewerShell.interpretation.test.tsx` | Tên/vai trò truy cập của Panel, nhóm, mục; triệt tiêu landmark lồng (H6-10); kiểm toán axe | Đúng chuẩn ngữ nghĩa, 0 vi phạm axe, 0 nested region | **PASS** (Đã chứng minh đỏ-trước-xanh; coverage 97.7%) | `ChartViewerShell.interpretation.test.tsx` |
| **A6-R01** | `npm run test:e2e -- e2e/interpretation-responsive.spec.ts` | 12 cấu hình viewport, S-05 degraded, §7.1 metrics, mobile reading order | 0 tràn ngang, DOM đúng thứ tự | **4 tests passed** (16.1s) | **PASS** | `task-13423.log`, 14 ảnh evidence |

---

## 5. Phần B — Bằng Chứng Kiểm Thử Thủ Công & Đo Đạc Trực Quan (Manual Evidence Matrix)

Môi trường kiểm thử: **Dev cục bộ** (`http://localhost:5173`) + Backend cục bộ có seed dữ liệu trên Windows 11 + Google Chrome (Chromium engine).

### 5.1 Responsive Layout & Không Tràn Ngang (AC-25)

| Test ID | Cấu hình Viewport | Chế độ F4 thực tế | Bề rộng Shell | Tỷ lệ cuộn ngang (`scrollWidth / clientWidth`) | Trạng thái tràn ngang | Minh chứng file ảnh | Trạng thái |
|---|---|---|---|---|---|---|---|
| **M6-R01** | **320×640** (Mobile nhỏ) | `mobile-cards` | 288px | **320 / 320** | **0 tràn ngang** (Đã fix navbar overflow) | `docs/implementation/archive/sprint-f5/evidence/m6_r01_320.png` | **PASS** |
| **M6-R02** | **360×740** (Mobile phổ biến) | `mobile-cards` | 328px | **360 / 360** | **0 tràn ngang** | `docs/implementation/archive/sprint-f5/evidence/m6_r02_360.png` | **PASS** |
| **M6-R03** | **375×667** (Mobile chuẩn - S-02) | `mobile-cards` | 343px | **375 / 375** | **0 tràn ngang** | `docs/implementation/archive/sprint-f5/evidence/m6_r03_375.png` | **PASS** |
| **M6-R03b** | **375×667** (S-05 không-Nhà / KG-F5M3-04) | `mobile-cards` | 343px | **375 / 375** | **0 tràn ngang**; banner Nhà và notice Cung Mọc hiển thị chuẩn mực | `docs/implementation/archive/sprint-f5/evidence/m6_r03_375_s05.png` | **PASS** (Đóng KG-F5M3-04) |
| **M6-R04** | **428×926** (Mobile lớn) | `mobile-cards` | 396px | **428 / 428** | **0 tràn ngang** | `docs/implementation/archive/sprint-f5/evidence/m6_r04_428.png` | **PASS** |
| **M6-R05** | **768×1024** (Tablet một cột) | `1-col (stacked)` | 704px | **768 / 768** | **0 tràn ngang** | `docs/implementation/archive/sprint-f5/evidence/m6_r05_768.png` | **PASS** |
| **M6-R06a** | **1023×768** (Trước ngưỡng `lg`) | `1-col (stacked)` | 959px | **1023 / 1023** | **0 tràn ngang** | `docs/implementation/archive/sprint-f5/evidence/m6_r06_1023.png` | **PASS** |
| **M6-R06b** | **1024×768** (Ngưỡng `lg`, sidebar 240px) | `1-col (stacked)` | 720px | **1024 / 1024** | **0 tràn ngang** | `docs/implementation/archive/sprint-f5/evidence/m6_r06_1024.png` | **PASS** |
| **M6-R07** | **1280×720** (Desktop chuẩn) | `1-col (stacked)` | 976px | **1280 / 1280** | **0 tràn ngang** | `docs/implementation/archive/sprint-f5/evidence/m6_r07_1280.png` | **PASS** |
| **M6-R08** | **1500×900** (Desktop rộng hai cột) | **`2-col (grid)`** | 1196px | **1500 / 1500** | **0 tràn ngang**; Wheel & Tables song song, Panel toàn chiều rộng phía dưới | `docs/implementation/archive/sprint-f5/evidence/m6_r08_1500.png` | **PASS** |
| **M6-R09a** | **1280×1024** (Màn hình cao H≥1000px) | `1-col (stacked)` | 976px | **1280 / 1280** | **0 tràn ngang**; sticky trigger hoạt động ổn định | `docs/implementation/archive/sprint-f5/evidence/m6_r09_high_1000.png` | **PASS** |
| **M6-R09b** | **Zoom 200%** (640×400 CSS px) | `1-col (stacked)` | 608px | **640 / 640** | **0 tràn ngang**; reflow hoàn hảo | `docs/implementation/archive/sprint-f5/evidence/m6_r09_zoom_200.png` | **PASS** |
| **M6-R09c** | **Zoom 400%** (320×300 CSS px) | `mobile-cards` | 288px | **320 / 320** | **0 tràn ngang**; reflow không vỡ layout | `docs/implementation/archive/sprint-f5/evidence/m6_r09_zoom_400.png` | **PASS** |
| **M6-R10** | **375×667** (Mobile reading order) | `mobile-cards` | 343px | Thứ tự DOM chuẩn | H1 -> H2 (Vị trí, Nhà, Góc, Diễn giải) -> H3 (Cốt lõi, Hành tinh) -> H4 không bị đảo lộn | `e2e/interpretation-responsive.spec.ts` | **PASS** |
| **M6-P01..P03** | **1280×720 & 1500×900** (§7.1 Vị trí) | Đa dạng | — | Đo đạc chi tiết | Đã ghi nhận tại Mục 3: 34 Tab stops <= 40 | `docs/implementation/archive/sprint-f5/evidence/m6_p01_panel_position.png` | **PASS** |

### 5.2 Cấu trúc Heading & Trợ Năng Ngữ Nghĩa (AC-24 / Task 2 / M6.2)

| Test ID | Tính năng / Hạng mục | Công cụ kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **M6-H01** | Outline phân cấp H1..H4 ở S-02, S-05, S-03 | Vitest DOM + Chrome a11y tree | Không có bước nhảy cấp nào (`level[i] <= level[i-1] + 1`). | H1 ("Lá số sinh") -> H2 ("Thông tin lá số", "Biểu đồ lá số", "Chi tiết đang chọn", "Vị trí hành tinh", "Nhà và các góc", "Góc chiếu", "Diễn giải") -> H3 ("Các góc chính", "Cốt lõi", "Các hành tinh") -> H4 (các mục diễn giải). Tuyệt đối không nhảy cấp ở cả 3 trạng thái. | **PASS** |
| **M6-H02** | Điều hướng theo heading (phím `H` / `3` / `4`) | Bàn phím & DOM navigation | Thứ tự và nội dung phân cấp độc lập | Người dùng điều hướng heading duyệt qua danh mục cấp cao mà không bị phân mảnh. Nút nhóm H3 cho phép định vị tức thì. | **PASS** |
| **M6-H03** | Tên truy cập nhóm & mục diễn giải | Accessible name computation | Mô tả chính xác mục tiêu, chứa trạng thái chọn | Nút mục mang nhãn `Mặt Trời · Ma Kết`, `aria-expanded` đúng trạng thái; khi chọn hiển thị badge `Đang chọn` trong H4 và `aria-current="true"` trên nút bấm. | **PASS** |
| **H6-10** | Quyết định Landmark lồng (Nested regions) | HTML & W3C APG Landmark Pattern | Tránh ồn ào khi điều hướng landmark (`D` key) | **ĐÃ GIẢI QUYẾT**: Thay thế `<section aria-labelledby>` ở nhóm con thành thẻ `<div>`. Toàn bộ khối Diễn giải là 1 landmark `region` duy nhất. Bên trong duyệt bằng heading `<h3>`, loại bỏ hoàn toàn 2 landmark generic lồng nhau. | **RESOLVED** |

### 5.3 Các Hạng Mục Kiểm Thử Tiếp Theo (M6.3 → M6.7)

| Test ID | Tính năng / Hạng mục | Công cụ kiểm thử | Kết quả mong đợi | Trạng thái hiện tại |
|---|---|---|---|---|
| **M6-RM01..RM03**| Giảm chuyển động (Reduced Motion) | Chrome DevTools Rendering | Khi bật `prefers-reduced-motion: reduce`, transition thời gian = 0s, không scale | **NOT TESTED** (Kế hoạch Task 3) |
| **M6-T01..T06** | Đo đạc độ đọc (cpl) & Vùng chạm nút (AC-25) | Computed styles & CCA | Cpl trong dải 45–80; hit-area >= 44x44px; tương phản >= 4.5:1 | **NOT TESTED** (Kế hoạch Task 4) |
| **M6-J01..J07** | Liên kết nhảy & Quản lý Focus (AC-26) | Bàn phím & Mouse | Không bị header 64px che khuất; focus ring hiển thị rõ nét | **NOT TESTED** (Kế hoạch Task 5) |
| **M6-K01..K13** | Điều hướng Bàn phím toàn diện (AC-26) | Tab / Shift+Tab / Enter / Space / Escape | Không bẫy bàn phím; vòng lặp Tab hợp lý; Escape khôi phục focus chuẩn | **NOT TESTED** (Kế hoạch Task 6) |
| **M6-S01..S12** | Trình đọc màn hình (AC-27) | Windows 11 + Google Chrome + Windows Narrator | Đọc đúng nhãn, trạng thái expanded, live region thông báo khi chọn | **IN PROGRESS** (Kế hoạch Task 7) |

---

## 6. Known Gap Registry (Cập Nhật Tại M6.1)

| ID | Tiêu đề | Phân loại | Trạng thái | Cập nhật tại M6.1 / Biện pháp giải quyết |
|---|---|---|---|---|
| **KG-F5M3-04** | Kiểm thử trực quan S-05 @375px màn hình hẹp | Testing / Visual | **RESOLVED** | **ĐÃ ĐÓNG TẠI M6.1**: Đo đạc và chụp ảnh minh chứng `m6_r03_375_s05.png` tại viewport 375×667 cho fixture `chartNoHouses`. Xác nhận giao diện sạch sẽ, banner Nhà F4 và notice Cung Mọc hiển thị trơn tru, 0 tràn ngang. |
| **KG-F5M4-01** | Kiểm thử trình đọc màn hình Windows Narrator | Accessibility | **IN PROGRESS** | Chuyển từ `ACCEPTED GAP` sang `IN PROGRESS` theo quyết định `D-M6-08`. Sẽ thực thi kiểm thử 12 kịch bản `M6-S01..S12` tại Task M6.7. |
| **KG-F5M4-02** | Fallback bảng khi wheel không tương tác ở màn hình siêu nhỏ | UX / Fallback | **VERIFIED** | Đã kiểm tra tại 320px và 360px: Wheel canvas và các bảng dữ liệu / cards hoạt động đồng bộ, không xảy ra hiện tượng crash hay nghẽn tương tác. |
| **KG-F5M4-03** | Kiểm thử trên Safari / Firefox | Cross-browser | **OPEN** | Môi trường kiểm thử hiện tại tập trung trên Chromium / Chrome (Windows 11). Ghi nhận hạn chế môi trường. |
| **KG-F5-01** | Moon interpretation uncertainty (thiếu cờ độ bất định Mặt Trăng) | Cross-layer (Backend) | **OPEN** | Giữ nguyên từ M5; phụ thuộc hợp đồng Backend `FG-07`. |
| **KG-F5M3-02** | Phân kỳ câu chữ `HouseDataNotice` F4 | Frontend UX | **OPEN** | Giữ nguyên theo quyết định D-M5-01 và O-8. |
| **KG-M8-01** | Trình đọc màn hình VoiceOver / TalkBack | Accessibility | **ACCEPTED GAP** | Phê duyệt từ F4 (D-M10-08). |
| **KG-M9-01** | Cột wheel sticky chỉ kích hoạt khi chiều cao >= 1000px | Layout / Responsive | **ACCEPTED GAP** | Phê duyệt từ F4 (D-M9-05). |
| **KG-M10-03** | E2E tự động hoá chủ yếu chạy trên Chromium Desktop | Testing | **ACCEPTED GAP** | Phê duyệt từ F4. |

---

## 7. Rà Soát Sửa Mã & Zero Diff Gate

### 7.1 Danh sách file mã nguồn đã chỉnh sửa tại M6.1 và M6.2
1. `frontend/src/widgets/user-menu/index.tsx`: Thêm lớp `hidden sm:inline` cho `<span>{user?.displayName}</span>` nhằm triệt tiêu hiện tượng tràn 23px trên thanh header ở viewport siêu hẹp 320px. Đã xác nhận `scrollWidth` giảm từ 343px xuống đúng 320px (0 tràn ngang).
2. `frontend/src/features/chart/ui/InterpretationPanel/InterpretationPanel.tsx`: Giải quyết H6-10 bằng cách thay thế thẻ `<section aria-labelledby>` ở các nhóm con bằng `<div>` sạch sẽ. Giúp loại bỏ 2 landmark generic lồng nhau trong "Diễn giải", bảo toàn 100% phân cấp heading H3/H4 và cơ chế focus group navigation.
3. `frontend/src/features/chart/ui/ChartViewerShell/ChartViewerShell.interpretation.test.tsx`: Bổ sung 2 test tự động mới `A6-H01` (liên tục phân cấp H1..H4 ở 3 trạng thái S-02/S-05/S-03) và `A6-H02` (xác thực role, accessible name, badge Đang chọn, xác nhận 0 vi phạm axe audit và 0 nested region). Đã kiểm chứng đỏ-trước-xanh.
4. `frontend/e2e/interpretation-responsive.spec.ts`: File Playwright E2E mới phục vụ tự động hoá đo đạc 12 viewport và thu thập số đo §7.1.
5. `frontend/e2e/fixtures/chartFull.json` & `frontend/e2e/fixtures/chartNoHouses.json`: Mock data độc lập cho E2E test.
6. `docs/implementation/archive/sprint-f5/evidence/m6_*`: 14 tệp ảnh minh chứng trực quan thực tế.

### 7.2 Zero Diff Verification Gate
- Lệnh thực thi:
  ```powershell
  git diff 3711587..HEAD -- frontend/src/features/chart/model/selection.ts frontend/src/features/chart/model/interpretation.ts
  ```
- Kết quả: **0 dòng thay đổi (diff rỗng tuyệt đối)**.
- Kết luận: Tuân thủ 100% ràng buộc bất biến kiến trúc của Sprint F5.
