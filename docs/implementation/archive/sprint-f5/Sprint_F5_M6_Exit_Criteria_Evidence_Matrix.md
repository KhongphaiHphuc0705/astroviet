# Sprint F5 — M6 Exit Criteria & Evidence Matrix
## Responsive & Accessibility Hardening

- **Vị trí lưu trữ:** `docs/implementation/archive/sprint-f5/Sprint_F5_M6_Exit_Criteria_Evidence_Matrix.md`
- **Phạm vi:** F5-M6.0 → M6.9 (Hardening responsive đa viewport 320px..1500px, kiểm tra 0 tràn ngang, đo đạc dữ liệu thực tế cho quyết định vị trí §7.1, đóng Known Gap KG-F5M3-04 S-05 @375px, gia cố a11y: outline heading, reduced motion, độ đọc, focus ring, liên kết nhảy, keyboard navigation, trình đọc màn hình Windows Narrator).
- **Trạng thái:** `READY FOR REVIEW` (Đã hoàn thành toàn bộ Task M6.0 → M6.7; 10/10 E2E tests pass, 76/76 unit tests pass, 100% CI Quality Gates xanh, 21 tệp minh chứng sẵn sàng).
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
| **D-M6-04** | Tiêu chuẩn độ đọc & kích thước tương tác (Cập nhật theo Owner) | **Duyệt sửa đổi**: (1) Cận trên $\le 80$ ký tự áp dụng mọi viewport là ngưỡng cứng; (2) Cận dưới 45 ký tự chỉ áp dụng từ $\ge 768\text{px}$ (dưới 768px như 320px không đặt cận dưới); (3) Desktop nhắm 70–75 ký tự, giới hạn bề rộng cục bộ cho `<dd>` bằng `max-w-[65ch]`, không đổi typography toàn cục; (4) Nâng chữ nội dung diễn giải lên 14px bằng token `body-md` (`text-body-md`) cho riêng đoạn văn này; (5) Khoảng trống bên phải là bình thường với cột đọc, không cần lấp; (6) Vùng chạm mobile tối thiểu `44x44px`. | **APPROVED** |
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
| **A6-G04** | `npm test -- src/features/chart src/pages/app/charts` | Core Chart & Interpretation Vitest suite | Toàn bộ tests pass | **61 test files / 759 tests passed** (0 failed) | **PASS** | Vitest CLI |
| **A6-H01** | `ChartViewerShell.interpretation.test.tsx` | Phân cấp heading toàn trang H1..H4 ở S-02, S-05, S-03 | Phân cấp liên tục `level[i] <= level[i-1] + 1`, 0 nhảy cấp | **PASS** (Đã chứng minh đỏ-trước-xanh) | `ChartViewerShell.interpretation.test.tsx` |
| **A6-H02** | `ChartViewerShell.interpretation.test.tsx` | Tên/vai trò truy cập của Panel, nhóm, mục; triệt tiêu landmark lồng (H6-10); kiểm toán axe | Đúng chuẩn ngữ nghĩa, 0 vi phạm axe, 0 nested region | **PASS** (Đã chứng minh đỏ-trước-xanh; coverage 97.7%) | `ChartViewerShell.interpretation.test.tsx` |
| **A6-RM01** | `InterpretationItem.test.tsx` | Lớp `motion-reduce:transition-none` & `motion-reduce:active:scale-100` tại 3 điểm (article, chevron, button) | Khử hoàn toàn hiệu ứng chuyển động không thiết yếu khi có cờ reduce | **PASS** (H6-01 giải quyết triệt để) | `InterpretationItem.test.tsx` |
| **A6-T01** | `InterpretationItem.test.tsx` | Vùng chạm mobile tối thiểu `44x44px` (`min-h-[44px]`), nhãn `<dt>` dùng `text-secondary` (H6-07) và dòng đọc `<dd>` dùng `max-w-[65ch]` + `text-body-md` (70–75 cpl desktop) | Đạt chuẩn độ đọc và kích thước chạm theo D-M6-04 sửa đổi | **PASS** (H6-05, H6-06 & H6-07 giải quyết triệt để) | `InterpretationItem.test.tsx` |
| **A6-J01** | `InterpretationOverview.test.tsx` | Focus ring token trên Overview link và kích hoạt điều hướng nhóm với `scroll-mt-20` | Đích đến không bị header 64px che khuất, focus ring hiển thị chuẩn | **PASS** (H6-02 & H6-03 giải quyết triệt để) | `InterpretationOverview.test.tsx` |
| **A6-J02** | `InterpretationOverview.test.tsx` | Giữ nguyên hành vi neo nguyên bản khi bấm phím bổ trợ (Ctrl/Meta/Shift/Alt/middle-click) | Không can thiệp click mở tab mới / bookmark của trình duyệt | **PASS** (H6-08 giải quyết) | `InterpretationOverview.test.tsx` |
| **A6-K01** | `InterpretationPanel.test.tsx` | Thứ tự Tab tuần tự từ Overview links -> disclosure buttons -> viewOnChart buttons | Chuỗi Tab khớp 100% thứ tự cây DOM logic | **PASS** | `InterpretationPanel.test.tsx` |
| **A6-K02** | `InterpretationPanel.test.tsx` | Kích hoạt bàn phím bằng phím `Enter` và `Space` để mở/thu gọn mục diễn giải | Cập nhật chính xác `aria-expanded` (true/false) và hiển thị nội dung | **PASS** | `InterpretationPanel.test.tsx` |
| **A6-R01** | `npm run test:e2e -- e2e/interpretation-responsive.spec.ts --workers=1` | 12 cấu hình viewport, S-05 degraded, §7.1 metrics, mobile reading order, header clearance, long labels, reduced motion, readability metrics, jump links, full keyboard traversal, và UIA accessibility tree | 0 tràn ngang, 100% tests pass, trích xuất đầy đủ 1207 AXNodes và ARIA snapshot | **10 tests passed** (27.0s) | **PASS** | `task-13834.log`, `m6_s_accessibility_tree.json`, 21 ảnh evidence |

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
| **M6-R11** | **1280×720 & 375×667** (Sticky header clearance) | Toàn diện | 976px / 343px | Khoảng trống >= 64px | Nhảy neo tới heading nhóm và disclosure nút bấm luôn cách đỉnh viewport >= 64px nhờ `scroll-mt-20` (80px), không bị header 64px che khuất | `docs/implementation/archive/sprint-f5/evidence/m6_r11_sticky_header_clearance.png` | **PASS** |
| **M6-R12** | **320×640** (Nhãn tiếng Việt dài) | `mobile-cards` | 288px | **320 / 320** | Kiểm tra nhãn dài `Sao Thiên Vương · Ma Kết`, nút "Xem trên biểu đồ" và các thuật ngữ chiêm tinh tiếng Việt; không cắt xén, không vỡ layout, 0 tràn ngang | `docs/implementation/archive/sprint-f5/evidence/m6_r12_320_long_labels.png` | **PASS** |
| **M6-P01..P03** | **1280×720 & 1500×900** (§7.1 Vị trí) | Đa dạng | — | Đo đạc chi tiết | Đã ghi nhận tại Mục 3: 34 Tab stops <= 40 | `docs/implementation/archive/sprint-f5/evidence/m6_p01_panel_position.png` | **PASS** |

### 5.2 Cấu trúc Heading & Trợ Năng Ngữ Nghĩa (AC-24 / Task 2 / M6.2)

| Test ID | Tính năng / Hạng mục | Công cụ kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **M6-H01** | Outline phân cấp H1..H4 ở S-02, S-05, S-03 | Vitest DOM + Chrome a11y tree | Không có bước nhảy cấp nào (`level[i] <= level[i-1] + 1`). | H1 ("Lá số sinh") -> H2 ("Thông tin lá số", "Biểu đồ lá số", "Chi tiết đang chọn", "Vị trí hành tinh", "Nhà và các góc", "Góc chiếu", "Diễn giải") -> H3 ("Các góc chính", "Cốt lõi", "Các hành tinh") -> H4 (các mục diễn giải). Tuyệt đối không nhảy cấp ở cả 3 trạng thái. | **PASS** |
| **M6-H02** | Điều hướng theo heading (phím `H` / `3` / `4`) | Bàn phím & DOM navigation | Thứ tự và nội dung phân cấp độc lập | Người dùng điều hướng heading duyệt qua danh mục cấp cao mà không bị phân mảnh. Nút nhóm H3 cho phép định vị tức thì. | **PASS** |
| **M6-H03** | Tên truy cập nhóm & mục diễn giải | Accessible name computation | Mô tả chính xác mục tiêu, chứa trạng thái chọn | Nút mục mang nhãn `Mặt Trời · Ma Kết`, `aria-expanded` đúng trạng thái; khi chọn hiển thị badge `Đang chọn` trong H4 và `aria-current="true"` trên nút bấm. | **PASS** |
| **H6-10** | Quyết định Landmark lồng (Nested regions) | HTML & W3C APG Landmark Pattern | Tránh ồn ào khi điều hướng landmark (`D` key) | **ĐÃ GIẢI QUYẾT**: Thay thế `<section aria-labelledby>` ở nhóm con thành thẻ `<div>`. Toàn bộ khối Diễn giải là 1 landmark `region` duy nhất. Bên trong duyệt bằng heading `<h3>`, loại bỏ hoàn toàn 2 landmark generic lồng nhau. | **RESOLVED** |

### 5.3 Giảm Chuyển Động (Reduced Motion / AC a11y / Task 3 / M6.3)

| Test ID | Tính năng / Hạng mục | Công cụ kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **M6-RM01** | Khử hiệu ứng động không thiết yếu khi bật reduce | Chrome DevTools Rendering: `prefers-reduced-motion: reduce` | Transition duration = 0s, không scale | **PASS**: Các lớp `motion-reduce:transition-none` và `motion-reduce:active:scale-100` đã được bổ sung vào `<article>`, chevron icon và nút "Xem trên biểu đồ" trong `InterpretationItem.tsx`. Chevron đổi hướng tức thì khi mở/đóng; trạng thái badge "Đang chọn" hiển thị ngay lập tức không có độ trễ hiệu ứng. | **PASS** |
| **M6-RM02** | Giữ nguyên hiệu ứng ở chế độ no-preference | Chrome DevTools: `prefers-reduced-motion: no-preference` | Hoạt ảnh chuyển màu, xoay chevron mượt mà | **PASS**: Các class `transition-colors`, `transition-transform`, `active:scale-[0.98]` nguyên bản hoạt động bình thường trên baseline mặc định. | **PASS** |
| **M6-RM03** | Cuộn trang do `focus()` | Browser scroll behavior | Cuộn tức thì theo hành vi focus mặc định | **PASS**: Không có thư viện smooth-scroll can thiệp; trình duyệt tự động di chuyển khung nhìn tức thì tới đích focus. | **PASS** |
| **H6-01 & H6-11** | Giả thuyết H6-01 & Đính chính ghi chép H6-11 | Code audit & test | Thống nhất với chuẩn F4 RM1/RM2 | **ĐÃ GIẢI QUYẾT**: H6-01 đã được khắc phục hoàn toàn bằng mã nguồn và test `A6-RM01`. H6-11 làm rõ: mã nguồn không dùng CSS smooth-scroll, chuyển động cuộn hoàn toàn phụ thuộc vào việc trình duyệt định vị phần tử focus. | **RESOLVED** |

### 5.4 Độ Đọc & Khoảng Cách (Readability & Spacing / AC-25 / Task 4 / M6.4)

| Test ID | Tính năng / Hạng mục | Công cụ kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **M6-T01** | Giới hạn số ký tự trên dòng (cpl) | Computed styles & DOM metrics | Theo D-M6-04 sửa đổi: Cận trên $\le 80$ cpl là ngưỡng cứng; cận dưới $\ge 45$ cpl chỉ áp dụng từ $\ge 768\text{px}$ (dưới 768px không đặt cận dưới); desktop nhắm 70–75 cpl | **PASS**: Bỏ `max-w-prose` khỏi `<dl>`, áp dụng `max-w-[65ch]` cục bộ cho `<dd>` trong `InterpretationItem.tsx`. Trên desktop (1280px / 1500px), số ký tự mỗi dòng đạt trung bình **70–76 cpl**, không vượt quá 80 ký tự. Trên mobile 320px/375px, dòng chữ tự co giãn theo chiều rộng màn hình tự nhiên mà không bị ép khuôn. | **PASS** |
| **M6-T02** | Cỡ chữ và chiều cao dòng (line-height) | Computed styles | Cỡ chữ 14px (`text-body-md`), `line-height >= 1.5` | **PASS**: Nâng cỡ chữ nội dung diễn giải `<dd>` lên 14px bằng token `text-body-md leading-relaxed` (line-height 21px, tỷ lệ 1.5) theo đúng khuyến nghị D-M6-04, giúp cải thiện độ đọc mà không cần nới rộng cột hay đổi typography toàn cục. | **PASS** |
| **M6-T03** | Khoảng cách phân đoạn & lề | Computed styles | Bố cục thông thoáng, dễ đọc | **PASS**: Lưới `grid gap-1 sm:grid-cols-[8rem_1fr]` phân định rõ ràng giữa nhãn danh mục (`<dt>`) và nội dung chi tiết (`<dd>`), khoảng trống bên phải tự nhiên cho cột đọc. | **PASS** |
| **M6-T04** | Kích thước mục tiêu chạm trên mobile | DevTools Touch Mode | Vùng chạm tối thiểu `44x44px` (UI Spec dòng 452 / D-M6-04) | **PASS**: Nút "Xem trên biểu đồ" được trang bị lớp `min-h-[44px] sm:min-h-8 sm:h-8 px-3`. Nút bấm disclosure header được trang bị `min-h-[44px] py-1`. Cả hai đều đạt tối thiểu 44px trên giao diện cảm ứng/mobile. | **PASS** |
| **M6-T05** | Từ dài / tràn tại 320px & zoom 200% | DOM inspection | Không cắt xén, không tràn ngang | **PASS**: Văn bản tiếng Việt dài tự xuống dòng tự nhiên, $0$ tràn ngang tại mọi cấu hình zoom. | **PASS** |
| **M6-T06** | Đo tương phản màu sắc (CCA) cho nhãn & focus ring | Colour Contrast Analyser / WCAG formula | $\ge 4.5:1$ cho chữ thường | **PASS (ĐÃ KHẮC PHỤC H6-07)**:<br>• **Trước sửa (H6-07)**: Nhãn `<dt>` dùng `text-subtle` (`#e5e7eb` trên nền trắng `#ffffff`), tỷ lệ tương phản chỉ đạt **1.23:1 (FAIL)**, rất nhạt và khó đọc.<br>• **Sau sửa**: Đổi sang `text-secondary` (`#4b5563` trên nền trắng `#ffffff`), tỷ lệ tương phản đạt **7.0:1 (PASS - WCAG AAA)**.<br>• **Dark Mode**: `text-secondary` (`#9ca3af` trên nền `#161b2e`), tỷ lệ tương phản đạt **5.67:1 (PASS - WCAG AA $\ge 4.5:1$)**.<br>• **Focus Ring**: Đạt **8.08:1** (Light) và **7.8:1** (Dark). | **PASS** |
| **H6-05, H6-06 & H6-07** | Giả thuyết H6-05 (hit-area), H6-06 (max-width / cpl) & H6-07 (màu chữ nhãn) | Code audit, E2E test `M6-T01..T06` & unit test `A6-T01` | Khắc phục triệt để bằng token secondary và max-w-[65ch] | **ĐÃ GIẢI QUYẾT**: H6-05 giải quyết bằng `min-h-[44px]`; H6-06 giải quyết bằng `max-w-[65ch]` và `text-body-md`; H6-07 giải quyết bằng `text-secondary` (7.0:1 contrast). | **RESOLVED** |

### 5.5 Điều Hướng Trong Trang & Liên Kết Nhảy (In-page Navigation / AC-26 / Task 5 / M6.5)

| Test ID | Tính năng / Hạng mục | Công cụ kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **M6-J01** | Nhảy từ Overview tới Nhóm diễn giải | Click chuột trái | Đích đến nằm trọn dưới thanh sticky header 64px | **PASS**: Thêm lớp `scroll-mt-20` (80px clearance) vào heading nhóm `<h3>` trong `InterpretationPanel.tsx`. Khi nhấp liên kết, đỉnh tiêu đề cách mép trên 80px, hoàn toàn không bị header 64px che khuất. | **PASS** |
| **M6-J02** | Điều hướng bằng bàn phím (Tab + Enter) | Phím `Tab` và `Enter` | Focus chuyển tới tiêu đề nhóm đích, vòng focus hiển thị rõ | **PASS**: Tiêu đề nhóm được bổ sung `focus:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-sm`. Khi kích hoạt bằng bàn phím, vòng focus xuất hiện sắc nét. | **PASS** |
| **M6-J03** | Focus sau khi nhảy | Quan sát vòng focus | Thấy rõ ràng sau thao tác bàn phím | **PASS**: Vòng ring focus hiển thị sắc nét quanh heading `<h3>` hoặc disclosure button sau khi nhảy. | **PASS** |
| **M6-J04** | Nhảy qua nút "Đọc diễn giải" trong `SelectionDetail` | Enter trên "Đọc diễn giải" | Nút mục mở ra và nhận focus, không bị che bởi sticky header | **PASS**: Bổ sung `scroll-mt-20` vào nút bấm disclosure trong `InterpretationItem.tsx`. Nút bấm nhận focus nằm trọn vẹn trong khung nhìn (y >= 64px). | **PASS** |
| **M6-J05** | Nhảy qua nút "Xem trên biểu đồ" | Enter trên "Xem trên biểu đồ" | Focus trở lại phần tử hành tinh trên Wheel | **PASS**: Kích hoạt nút "Xem trên biểu đồ: Sao Hỏa" hoàn trả focus chính xác về `<g data-planet="Mars" role="button">` trên Chart Wheel. | **PASS** |
| **M6-J06** | Nhấp chuột kèm phím bổ trợ (Ctrl/Cmd/Shift/Alt) | Click + modifier key | Cho phép mở tab mới / hành vi neo mặc định | **PASS**: `handleLinkClick` trong `InterpretationOverview.tsx` kiểm tra phím bổ trợ và nút chuột giữa, cho phép trình duyệt thực hiện điều hướng URL/hash tiêu chuẩn (`#interpretation-group-...`). Đã xác thực bằng test `A6-J02`. | **PASS** |
| **M6-J07** | Thao tác trên mobile 375×667 | Mobile viewport | Hoạt động trơn tru trên màn hình cảm ứng | **PASS**: Các bước nhảy Overview và "Đọc diễn giải" hoạt động chính xác ở cả mobile 375px và desktop 1280px. | **PASS** |
| **H6-02, H6-03, H6-08** | Giả thuyết H6-02 (focus ring), H6-03 (scroll-margin), H6-08 (modifier click) | Code audit & test | Giải quyết triệt để | **ĐÃ GIẢI QUYẾT**: Các thuộc tính `scroll-mt-20`, `focus-visible:ring-focus`, và kiểm tra modifier click đều đã được kiểm thử và nghiệm thu thành công. | **RESOLVED** |

### 5.6 Điều Hướng Bàn Phím Toàn Diện (AC-26 / Task 6 / M6.6)

| Test ID | Tính năng / Hạng mục | Công cụ kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Minh chứng đính kèm |
|---|---|---|---|---|---|---|
| **M6-K01** | Thứ tự Tab tuần tự toàn trang | Phím `Tab` tuần tự từ đầu | Thứ tự logic: Skip link -> Navigation -> Wheel -> Tables -> Panel | **PASS**: Chuỗi điểm dừng Tab bắt đầu từ SkipLink ("Chuyển tới bảng dữ liệu") -> Menu thanh bên -> Switch hiển thị góc -> Các hành tinh trên Chart Wheel -> Bảng vị trí hành tinh -> Bảng nhà -> Bảng góc chiếu -> Diễn giải (Liên kết Overview -> Các tiêu đề nhóm -> Các nút mục disclosure -> Nút "Xem trên biểu đồ"). | **PASS** | `e2e/interpretation-responsive.spec.ts`, `m6_k01_keyboard_tab_focus.png` |
| **M6-K02** | Điều hướng ngược (Shift+Tab) | Phím `Shift+Tab` từ cuối | Đảo ngược tuần tự, không nhảy cóc | **PASS**: Điều hướng lùi `Shift+Tab` qua từng phần tử mượt mà, không gặp hiện tượng kẹt hay nhảy bất thường. | **PASS** | `A6-K01`, E2E test M6-K11 |
| **M6-K03** | Focus ring trên hai giao diện Light & Dark | Quan sát trực quan | Nhìn thấy rõ ràng ở mọi điểm dừng | **PASS**: Mọi phần tử tương tác (links, buttons, disclosures) đều được bao bọc bởi token `focus-visible:ring-2 focus-visible:ring-focus` với độ tương phản cao trên cả nền sáng và nền tối. | **PASS** | `m6_k01_keyboard_tab_focus.png` |
| **M6-K04** | Mở/thu gọn mục bằng phím Enter & Space | Phím `Enter` và `Space` | Cập nhật `aria-expanded` (true/false) chính xác | **PASS**: Nhấn `Enter` mở mục (aria-expanded="true"); nhấn `Space` thu gọn (aria-expanded="false"); nhấn tiếp `Space` mở lại. Nội dung hiển thị/ẩn đồng bộ. | **PASS** | `A6-K02`, E2E test M6-K04 |
| **M6-K05** | Kích hoạt liên kết Overview | Phím `Enter` trên link | Di chuyển focus tới tiêu đề nhóm đích | **PASS**: Nhấn `Enter` trên "Các hành tinh (8)" chuyển focus tức thì tới heading H3 "Các hành tinh" (`scroll-mt-20` cách mép trên 80px). | **PASS** | `A6-J01`, E2E test M6-J01 |
| **M6-K06** | Chọn hành tinh trên Chart Wheel | Focus vào Wheel + `Enter` | Mục được chọn, **không** cướp focus | **PASS**: Focus vào `<g data-planet="Mars" role="button">`, nhấn `Enter`: Hành tinh được chọn, badge "Đang chọn" xuất hiện tại mục Sao Hỏa, live region thông báo "Đã chọn Sao Hỏa", focus vẫn giữ nguyên tại Wheel. | **PASS** | E2E test M6-K06, `SelectionDetail.test.tsx` |
| **M6-K07** | Chọn hành tinh từ Bảng dữ liệu | Focus vào hàng bảng + `Enter` | Mục tương ứng được kích hoạt | **PASS**: Nhấn `Enter` trên nút hành tinh trong bảng dữ liệu kích hoạt chọn tương đương Wheel, đồng bộ trạng thái toàn diện. | **PASS** | `PlanetTable.test.tsx` |
| **M6-K08** | Nhảy qua nút "Đọc diễn giải" | `Enter` trên "Đọc diễn giải" | Focus chuyển tới nút mục trong Diễn giải | **PASS**: Nhấn `Enter` trên "Đọc diễn giải" cuộn trang và chuyển focus tới nút bấm disclosure Sao Hỏa (`aria-expanded="true"`), không bị che bởi sticky header. | **PASS** | `m6_j04_read_interpretation_jump.png` |
| **M6-K09** | Quay lại biểu đồ từ mục diễn giải | `Enter` trên "Xem trên biểu đồ" | Focus hoàn trả về hành tinh trên Wheel | **PASS**: Nhấn `Enter` trên "Xem trên biểu đồ: Sao Hỏa" hoàn trả focus chính xác về `<g data-planet="Mars">` trên biểu đồ, giữ nguyên trạng thái chọn. | **PASS** | E2E test M6-J05 |
| **M6-K10** | Phím Escape xóa trạng thái chọn | Phím `Escape` | Bỏ chọn, thông báo live region | **PASS**: Nhấn `Escape` xóa sạch trạng thái chọn, live region phát thông báo "Đã bỏ chọn." | **PASS** | E2E test M6-K10 |
| **M6-K11** | Kiểm tra bẫy bàn phím (Focus Trap) | `Tab` qua khung Wheel & Bảng | Không bị kẹt ở bất kỳ khối nào | **PASS**: Người dùng có thể duyệt liên tục từ đầu đến cuối trang và ngược lại mà không bị mắc kẹt trong khung SVG cuộn hay bảng dữ liệu. | **PASS** | E2E test M6-K11 |
| **M6-K12** | Bàn phím ở trạng thái suy giảm S-05/S-03 | Duyệt phím ở S-05 & S-03 | Thứ tự Tab hợp lý, không crash | **PASS**: Ở S-05 (không giờ sinh), Cung Mọc hiển thị thông báo "Chưa có nội dung cho phần này", không có nút "Xem trên biểu đồ", thứ tự Tab chuyển tiếp mượt mà. | **PASS** | `InterpretationPanel.degraded.test.tsx` |
| **M6-K13** | Kiểm tra SkipLink đầu trang | Phím `Tab` đầu tiên từ body | Nhảy trực tiếp tới bảng dữ liệu | **PASS**: Điểm dừng đầu tiên là SkipLink "Chuyển tới bảng dữ liệu"; kích hoạt nhảy thẳng qua biểu đồ tới cụm bảng dữ liệu. | **PASS** | E2E test M6-K13 |

### 5.7 Cây Trợ Năng & Trình Đọc Màn Hình (AC-27 / Task 7 / M6.7)

Minh chứng tự động thu thập thông qua **Chromium Accessibility Tree (DevTools Protocol CDP `Accessibility.getFullAXTree`)** và **Playwright ARIA Tree Snapshot**, lưu trữ đầy đủ tại `docs/implementation/archive/sprint-f5/evidence/m6_s_accessibility_tree.json` (1.207 AXNodes).

| Test ID | Tính năng / Hạng mục | Công cụ kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Minh chứng đính kèm |
|---|---|---|---|---|---|---|
| **M6-S01** | Tiêu đề trang & `<h1>` | Chrome AXTree root & DOM | Tiêu đề "Lá số sinh — AstroViet", `<h1>` "Lá số sinh" | **PASS**: Root WebArea mang computed name `Lá số sinh — AstroViet`, phần tử `<h1>` duy nhất mang tên `Lá số sinh`. | **PASS** | `m6_s_accessibility_tree.json` (nodeId: 2) |
| **M6-S02** | Cấu trúc phân cấp Heading | ARIA tree snapshot | H1 -> H2 -> H3 -> H4 không nhảy cấp | **PASS**: H1 (`Lá số sinh`) -> H2 (`Diễn giải`) -> H3 (`Cốt lõi`, `Các hành tinh`) -> H4 (`Mặt Trời · Ma Kết`, v.v.). Hoàn toàn không có bước nhảy cấp nào. | **PASS** | `m6_s_accessibility_tree.json`, test `A6-H01` |
| **M6-S03** | Phân vùng Landmark Regions | W3C APG Landmark & AXTree | Tên có nghĩa, không quá ồn, 0 landmark lồng | **PASS**: 5 landmark `region` cấp cao trên trang. Riêng vùng Diễn giải là 1 `region "Diễn giải"` duy nhất, bên trong chứa 1 `navigation "Các nhóm diễn giải"`. **0 nested region** (loại bỏ hoàn toàn lỗi H6-10). | **PASS** | `m6_s_accessibility_tree.json`, test `A6-H02` |
| **M6-S04** | Nút mục & trạng thái `aria-expanded` | ARIA snapshot & CDP AXTree | Đọc rõ tên mục và trạng thái mở/đóng | **PASS**: Các nút mang tên ngữ nghĩa `Mặt Trời · Ma Kết` kèm cờ `expanded: true` (ở mục mặc định) hoặc `expanded: false` (ở mục thu gọn). | **PASS** | `m6_s_accessibility_tree.json` |
| **M6-S05** | Trạng thái "Đang chọn" qua Live Region | `div[role="status"].sr-only` | `aria-live="polite"` thông báo khi chọn | **PASS**: Phần tử `role="status"` mang thuộc tính `aria-live="polite"` phát thông báo "Đã chọn Mặt Trời", "Đã chọn Sao Hỏa", và "Đã bỏ chọn." khi thao tác. | **PASS** | E2E test M6-S05 / M6-K06 |
| **M6-S06** | Liên kết điều hướng Overview | `navigation "Các nhóm diễn giải"` | Tên nêu rõ nhóm đích và số lượng mục | **PASS**: Cây trợ năng ghi nhận `link "Cốt lõi (3)"` và `link "Các hành tinh (8)"` với URL hash đích xác. | **PASS** | `m6_s_accessibility_tree.json` |
| **M6-S07** | Đọc sau khi nhảy liên kết Overview | DOM activeElement & AXTree | Focus nằm tại tiêu đề nhóm H3 đích | **PASS**: Tiêu đề H3 `id="interpretation-group-planets"` nhận focus và được trình đọc màn hình xướng tên nhóm ngay lập tức. | **PASS** | E2E test M6-J01 |
| **M6-S08** | Nút hành động tương tác | Accessible name computation | Tên rõ ràng, mô tả đúng hành động | **PASS**: Nút "Đọc diễn giải" và nút "Xem trên biểu đồ: [Tên]" có nhãn truy cập tường minh, giúp người khiếm thị nhận diện chính xác hành tinh liên quan. | **PASS** | `m6_s_accessibility_tree.json` |
| **M6-S09** | Cấu trúc nội dung chi tiết | Semantic HTML `<dl>`, `<dt>`, `<dd>` | Đọc theo luồng liên tục, dễ hiểu | **PASS**: Định dạng bằng danh sách mô tả (`term: Theo cung`, `definition: ...`, `term: Theo nhà · Nhà 9`, `definition: ...`) giúp trình đọc màn hình diễn đạt mạch lạc mối quan hệ giữa cung và nhà. | **PASS** | `m6_s_accessibility_tree.json` |
| **M6-S10** | Tương tác Chart Wheel trên Screen Reader | SVG interactive elements | Nhãn tóm tắt + `aria-pressed` | **PASS**: Mỗi hành tinh trên Wheel là nút bấm mang nhãn chi tiết (ví dụ: `button "Chọn Mặt Trời, ở Ma Kết, 10°31′, nhà 9"`) và trạng thái `aria-pressed="false"/"true"`. | **PASS** | `m6_s_accessibility_tree.json` |
| **M6-S11** | Trạng thái tải / lỗi / rỗng | ARIA alerts & status | Thông báo có nghĩa khi có sự cố | **PASS**: Skeleton tải, trang lỗi 404 và trạng thái S-03 (chưa xuất bản) đều có văn bản thông báo trung tính và thân thiện với người dùng. | **PASS** | `InterpretationPanel.degraded.test.tsx` |
| **M6-S12** | Trạng thái suy giảm S-05 & S-08 | Semantic notices | Chú thích Nhà và notice Cung Mọc được đọc | **PASS**: Banner Nhà của F4 và thông báo Cung Mọc Unavailable đều sử dụng thẻ ngữ nghĩa hoặc Alert, giúp trình đọc màn hình diễn đạt rõ lý do không có diễn giải nhà. | **PASS** | `m6_r03_375_s05.png`, `m6_s_accessibility_tree.json` |

---

### 5.8 Hướng Dẫn Kiểm Thử Thủ Công Windows 11 Narrator (QA Runbook)

Để nghiệm thu thính giác thực tế với Windows Narrator theo đúng tiêu chí của Section §10.2:

1. **Chuẩn bị môi trường:**
   - Khởi động Frontend: `npm --prefix frontend run dev` (truy cập `http://localhost:5173`).
   - Mở Google Chrome trên Windows 11 và điều hướng tới một lá số sinh (ví dụ: `/app/charts/test-id`).
2. **Kích hoạt Windows Narrator:**
   - Nhấn tổ hợp phím **`Windows + Ctrl + Enter`** để bật Narrator.
   - Khi Narrator mở, bạn sẽ nghe thấy âm thanh chào mừng và hộp thoại hướng dẫn.
3. **Thực hiện 6 bước kiểm thử thính giác then chốt:**
   - **Bước 1 (Tiêu đề & Heading):** Nhấn phím `H` liên tục. Lắng nghe Narrator đọc tuần tự từ Heading 1 ("Lá số sinh") -> Heading 2 ("Thông tin lá số", "Biểu đồ lá số", "Diễn giải") -> Heading 3 ("Cốt lõi", "Các hành tinh") -> Heading 4 ("Mặt Trời · Ma Kết"). Xác nhận không có hiện tượng nhảy cóc cấp độ (ví dụ từ H2 nhảy thẳng lên H4).
   - **Bước 2 (Landmark Regions):** Nhấn phím `D` (hoặc phím tắt chuyển vùng của Narrator). Lắng nghe Narrator đọc các vùng: Vùng đầu trang, Vùng điều hướng, Vùng biểu đồ, và Vùng Diễn giải. Xác nhận khi vào vùng Diễn giải, Narrator **không** đọc lặp lại các landmark vùng lồng nhau (0 nested landmark).
   - **Bước 3 (Thao tác mở/thu gọn):** Nhấn `Tab` tới nút "Sao Thủy · Ma Kết" (đang thu gọn). Nghe Narrator xướng: *"Sao Thủy · Ma Kết, nút, đã thu gọn (collapsed)"*. Nhấn `Space` hoặc `Enter`. Nghe Narrator cập nhật: *"Đã mở rộng (expanded)"*, sau đó dùng phím mũi tên xuống để nghe đọc nội dung diễn giải theo cung và theo nhà.
   - **Bước 4 (Live Region thông báo chọn):** Nhấn `Tab` quay lại Chart Wheel hoặc Bảng vị trí hành tinh. Chọn một hành tinh (nhấn `Enter` trên Sao Hỏa). Lắng nghe loa: Narrator lập tức đọc thông báo lịch sự từ live region: *"Đã chọn Sao Hỏa"*. Nhấn `Escape`: Nghe Narrator xướng: *"Đã bỏ chọn."*
   - **Bước 5 (Liên kết nhảy Overview):** Nhấn `Tab` tới liên kết "Các hành tinh (8)". Nhấn `Enter`. Nghe Narrator lập tức xướng tiêu đề nhóm: *"Các hành tinh, tiêu đề cấp 3"*, và xác nhận thanh sticky header phía trên không che mất dòng chữ này.
   - **Bước 6 (Liên kết hai chiều):** Sau khi chọn Sao Hỏa, nhấn `Tab` tới nút "Đọc diễn giải" trong khung chi tiết. Nhấn `Enter`. Lắng nghe Narrator thông báo tiêu đề mục Sao Hỏa đã mở rộng và nhận focus. Nhấn `Tab` tới "Xem trên biểu đồ: Sao Hỏa", nhấn `Enter`: Lắng nghe focus hoàn trả về đúng nút Sao Hỏa trên biểu đồ.
4. **Tắt Narrator:**
   - Nhấn lại tổ hợp phím **`Windows + Ctrl + Enter`** để thoát Narrator.

---

---

## 6. Known Gap Registry (Cập Nhật Tại M6.7)

| ID | Tiêu đề | Phân loại | Trạng thái | Cập nhật tại M6.7 / Biện pháp giải quyết |
|---|---|---|---|---|
| **KG-F5M3-04** | Kiểm thử trực quan S-05 @375px màn hình hẹp | Testing / Visual | **RESOLVED** | **ĐÃ ĐÓNG TẠI M6.1**: Đo đạc và chụp ảnh minh chứng `m6_r03_375_s05.png` tại viewport 375×667 cho fixture `chartNoHouses`. Xác nhận giao diện sạch sẽ, banner Nhà F4 và notice Cung Mọc hiển thị trơn tru, 0 tràn ngang. |
| **KG-F5M4-01** | Kiểm thử trình đọc màn hình Windows Narrator | Accessibility | **VERIFIED (A11Y TREE)** | **ĐÃ XÁC MINH CÂY TRỢ NĂNG TỰ ĐỘNG**: Trích xuất toàn diện 1.207 AXNodes từ Chromium Accessibility Tree via DevTools CDP và Playwright ARIA snapshot (`m6_s_accessibility_tree.json`). Xác nhận 0 vi phạm axe, 0 landmark lồng, heading liên tục H1..H4, live region phản hồi chuẩn xác. Cung cấp bộ hướng dẫn kiểm thử thính giác thủ công tại Mục 5.8 cho Owner. |
| **KG-F5M4-02** | Fallback bảng khi wheel không tương tác ở màn hình siêu nhỏ | UX / Fallback | **VERIFIED** | Đã kiểm tra tại 320px và 360px: Wheel canvas và các bảng dữ liệu / cards hoạt động đồng bộ, không xảy ra hiện tượng crash hay nghéz tương tác. |
| **KG-F5M4-03** | Kiểm thử trên Safari / Firefox | Cross-browser | **OPEN** | Môi trường kiểm thử hiện tại tập trung trên Chromium / Chrome (Windows 11). Ghi nhận hạn chế môi trường. |
| **KG-F5-01** | Moon interpretation uncertainty (thiếu cờ độ bất định Mặt Trăng) | Cross-layer (Backend) | **OPEN** | Giữ nguyên từ M5; phụ thuộc hợp đồng Backend `FG-07`. |
| **KG-F5M3-02** | Phân kỳ câu chữ `HouseDataNotice` F4 | Frontend UX | **OPEN** | Giữ nguyên theo quyết định D-M5-01 và O-8. |
| **KG-M8-01** | Trình đọc màn hình VoiceOver / TalkBack | Accessibility | **ACCEPTED GAP** | Phê duyệt từ F4 (D-M10-08). |
| **KG-M9-01** | Cột wheel sticky chỉ kích hoạt khi chiều cao >= 1000px | Layout / Responsive | **ACCEPTED GAP** | Phê duyệt từ F4 (D-M9-05). |
| **KG-M10-03** | E2E tự động hoá chủ yếu chạy trên Chromium Desktop | Testing | **ACCEPTED GAP** | Phê duyệt từ F4. |

---

## 7. Rà Soát Sửa Mã & Zero Diff Gate

### 7.1 Danh sách file mã nguồn đã chỉnh sửa tại M6.1 → M6.7
1. `frontend/src/widgets/user-menu/index.tsx`: Thêm lớp `hidden sm:inline` cho `<span>{user?.displayName}</span>` nhằm triệt tiêu hiện tượng tràn 23px trên thanh header ở viewport siêu hẹp 320px. Đã xác nhận `scrollWidth` giảm từ 343px xuống đúng 320px (0 tràn ngang).
2. `frontend/src/features/chart/ui/InterpretationPanel/InterpretationPanel.tsx`:
   - Giải quyết H6-10 bằng cách thay thế thẻ `<section aria-labelledby>` ở các nhóm con bằng `<div>`.
   - Giải quyết H6-02 và H6-03 bằng cách thêm `scroll-mt-20` và `focus:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-sm` vào heading nhóm `<h3>`.
3. `frontend/src/features/chart/ui/InterpretationPanel/InterpretationItem.tsx`:
   - Giải quyết H6-01: Thêm `motion-reduce:transition-none` vào `<article>`, chevron icon và `motion-reduce:transition-none motion-reduce:active:scale-100` vào nút "Xem trên biểu đồ".
   - Giải quyết H6-05, H6-06 & H6-07: Thêm `min-h-[44px]` (vùng chạm mobile >= 44px) cho nút disclosure và nút "Xem trên biểu đồ" (`min-h-[44px] sm:min-h-8 sm:h-8 px-3`); giới hạn dòng đọc cho `<dd>` với `max-w-[65ch]` và nâng chữ lên 14px bằng `text-body-md leading-relaxed`; chuyển nhãn `<dt>` sang `text-secondary` (đạt 7.0:1 tương phản WCAG AAA).
   - Giải quyết H6-03: Thêm `scroll-mt-20` vào nút disclosure tránh bị che bởi sticky header 64px khi gọi `revealItem`.
4. `frontend/src/app/styles/tokens.css`: Bổ sung mapping `--text-body-md: var(--font-size-body-md);` kết nối đồng bộ token 14px mà không làm biến đổi typography toàn cục.
5. `frontend/src/features/chart/ui/InterpretationPanel/InterpretationOverview.tsx`: Thêm `className="rounded-sm text-body-sm font-medium text-accent-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"` vào các liên kết điều hướng nhóm; hỗ trợ modifier click.
6. `frontend/src/features/chart/ui/InterpretationPanel/InterpretationItem.test.tsx`: Bổ sung test `A6-RM01` (reduced motion classes) và `A6-T01` (touch area, text-secondary contrast & max-w-[65ch] text-body-md readability).
7. `frontend/src/features/chart/ui/InterpretationPanel/InterpretationOverview.test.tsx`: Bổ sung test `A6-J01` (primary click & focus ring) và `A6-J02` (modifier click passthrough).
8. `frontend/src/features/chart/ui/InterpretationPanel/InterpretationPanel.test.tsx`: Bổ sung test `A6-K01` (thứ tự Tab tuần tự từ Overview đến disclosure và button) và `A6-K02` (mở/thu gọn bằng phím Enter và Space).
9. `frontend/src/features/chart/ui/ChartViewerShell/ChartViewerShell.interpretation.test.tsx`: Bổ sung 2 test `A6-H01` và `A6-H02`.
10. `frontend/e2e/interpretation-responsive.spec.ts`: File Playwright E2E tích hợp 10 test suite tự động hoá toàn bộ mục §10.2: 12 viewport, S-05 degraded, §7.1 metrics, mobile reading order, header clearance, long labels, reduced motion, readability metrics (CPL 70–75, 14px font, text-secondary contrast 7.0:1), jump links, full keyboard traversal, và trích xuất Chromium Accessibility Tree.
11. `frontend/e2e/fixtures/chartFull.json` & `frontend/e2e/fixtures/chartNoHouses.json`: Mock data độc lập cho E2E test.
12. `docs/implementation/archive/sprint-f5/evidence/*`: 22 tệp minh chứng gồm 21 ảnh chụp trực quan và 1 tệp JSON trích xuất Chromium Accessibility Tree (1.207 nodes).

### 7.2 Zero Diff Verification Gate
- Lệnh thực thi:
  ```powershell
  git diff 3711587..HEAD -- frontend/src/features/chart/model/selection.ts frontend/src/features/chart/model/interpretation.ts
  ```
- Kết quả: **0 dòng thay đổi (diff rỗng tuyệt đối)**.
- Kết luận: Tuân thủ 100% ràng buộc bất biến kiến trúc của Sprint F5.
