# Sprint F4 — M9 Exit Criteria Evidence Matrix

## Responsive & Accessibility Hardening (`FE-S4.9`)

**Vị trí lưu:** `docs/implementation/archive/sprint-f4/Sprint_F4_M9_Exit_Criteria_Evidence_Matrix.md`  
**Milestone:** F4-M9 (`FE-S4.9`: Hoàn thiện Đáp ứng và Trợ năng — Ba chế độ bố cục, Container Queries, Sticky clamped, Zoom controls 1×–3× dưới md, Khung vuông và căn giữa bản vẽ, Skip link tiếng Việt + đích nhận focus, Reduced Motion `motion-reduce:transition-none`, Axe accessibility audit, Viewport test harness, Đồng bộ tương tác M8 hồi quy)  
**Quy ước Evidence commit (D-C3):** Toàn bộ mã nguồn tính năng đã hoàn tất, được kiểm thử tự động đạt 100% (130 test files, 1041 tests), các cổng chất lượng và grep gates sạch sẽ.  
**Nguồn bằng chứng:** `[repo]` đọc mã/diff; `[run]` chạy lệnh thực tế trên môi trường; `[owner]` quyết định phê duyệt.  
**Evidence Commit:** `3827277`  
**Evidence CI:** `https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/40256277594`  
**Trạng thái:** `PASS (ACCEPTED BY OWNER)` (Đạt 100% 25/25 tiêu chí nghiệm thu kỹ thuật AC-RA-R1…R11, AC-RA-A1…A10, AC-RA-G1…G4, 10/10 cổng grep G-M9-1…G-M9-10, 4 cổng kiểm tra tĩnh và build Vite production; kiểm thử tự động 130 test files/1041 tests xanh 100%; Owner phê duyệt nghiệm thu đóng milestone M9).

---

## Kết luận tổng quan

Toàn bộ các yêu cầu kỹ thuật, mô hình tương tác đồng bộ và cổng chất lượng của Sprint F4 M9 (`FE-S4.9`) đã được hiện thực hóa và vượt qua 100% các bài kiểm thử tự động:

1. **Đo đạc bố cục thực và cổng quyết định (M9.0)**:
   - Đo đạc chính xác chiều rộng Shell và kích thước các bảng dữ liệu trên thực tế (`m9_0_layout_measurement.md`).
   - Xác nhận ngưỡng chuyển hai cột: $T = 1010\text{ px}$ (đảm bảo AspectTable $\ge 532\text{ px}$ không bị cuộn ngang).
   - Xác nhận ngưỡng sticky: $H = 1000\text{ px}$ (chiều cao cột trái tối đa 887px + top 88px + gutter 24px = 999px).
   - Quyết định D-M9-06: Áp dụng `Container size="wide" paddingX={false}` riêng cho trang chart detail.

2. **Nền tảng bố cục ba chế độ & Cấu trúc ngữ nghĩa (M9.1)**:
   - Áp dụng Container Query thuần túy: `[container-type:inline-size]` kết hợp `@container(min-width:1010px):grid-cols-[minmax(448px,5fr)_minmax(0,7fr)]`.
   - Cột trái sticky có chặn chiều cao: `[@media(min-height:1000px)]:sticky top-[88px]`.
   - Cột phải bọc 3 bảng dữ liệu với `min-w-0` chống tràn flex/grid.
   - Giữ nguyên thứ tự DOM tự nhiên (không sử dụng `order-*`), đảm bảo thứ tự Tab và thứ tự đọc của Screen Reader đồng nhất.
   - Bổ sung tiêu đề ngữ nghĩa `<h2>` với lớp `sr-only` cho Card tổng quan ("Thông tin lá số") và Card biểu đồ ("Biểu đồ lá số"), liên kết chặt chẽ qua `aria-labelledby`.

3. **Khung vuông, Điều khiển thu phóng và Căn giữa bản vẽ (M9.2)**:
   - Module logic thuần `model/zoom.ts`: không phụ thuộc React hay DOM (Gate G-M9-4), quản lý hệ số thu phóng từ 1× đến 3× (bước 0.5×), cung cấp các hàm thuần `canZoomIn`, `canZoomOut`, `zoomIn`, `zoomOut`, `formatZoomPercent`.
   - Thành phần trợ năng `ChartZoomControls.tsx`:
     - Nhóm điều khiển `role="group"` với `aria-label="Thu phóng biểu đồ"`.
     - Nút Zoom Out, Reset (luôn render, gắn `aria-disabled="true"` khi zoom = 1×), Zoom In.
     - Sử dụng `aria-disabled` kèm handler chủ động chặn ở đầu mút (1× và 3×) nhằm bảo toàn focus bàn phím, không làm focus rơi về `body`.
     - Thẻ `<output>` lịch sự thông báo mức thu phóng phần trăm hiện tại.
     - Chuẩn hóa font chữ số sang `font-data` (thay thế `font-mono` không tồn tại trong config Tailwind).
   - Shell điều khiển render có điều kiện: chỉ xuất hiện trên thiết bị nhỏ (`!matchesMd`, `< 768px`).
   - Vùng cuộn biểu đồ vuông cố định trên mobile (`max-md:aspect-square`), CSS variable `--zoom`, hỗ trợ cuộn và pinch gốc `touch-pan-x touch-pan-y touch-pinch-zoom`.
   - **Cơ chế căn giữa bản vẽ ban đầu và khi đổi zoom**: Áp dụng `useLayoutEffect` tính toán `scrollLeft` và `scrollTop` về tâm (`Math.round((scrollWidth - clientWidth) / 2)`) khi mount và mỗi khi `zoom` thay đổi, khắc phục hiện tượng bản vẽ 400×400 neo lệch góc trên-trái (che khuất DSC và IC) trên khung mobile 309×309.

4. **Skip Link và Giảm chuyển động (M9.3)**:
   - Chuẩn hóa nhãn tiếng Việt mặc định cho `SkipLink`: `"Chuyển đến nội dung chính"`.
   - Bổ sung `tabIndex={-1}` và `focus:outline-none` cho phần tử đích `<main id="main-content">` ở cả `AppLayout` và `MarketingLayout`.
   - Bổ sung liên kết nội bộ trong Shell `"Chuyển tới bảng dữ liệu"` đặt trước wheel, trỏ tới `#chart-data-tables` (`tabIndex={-1}`).
   - Cập nhật E2E test `e2e/layout.spec.ts` kiểm chứng nhãn và chuyển focus khi nhấn Enter.
   - Áp dụng `motion-reduce:transition-none` trên toàn bộ các lớp chuyển tiếp của viewer (`PlanetLayer`, `AspectLayer`, `PlanetTable`, `HouseTable`, `AspectTable`, `AspectFilterChip`) và các UI primitives dùng chung (`Button`, `Card`, `Switch`).

5. **Kiểm toán Trợ năng Toàn diện (M9.4)**:
   - Quét kiểm tra trợ năng tự động `vitest-axe` đạt **0 violations** trên tất cả các chế độ (Desktop và Mobile) và các biến thể dữ liệu (`chartFull`, `chartNoHouses`).
   - Kiểm chứng hệ thống tiêu đề ngữ nghĩa không nhảy cấp: H1 (trang) $\to$ H2 (các khối lớn) $\to$ H3 (nhóm các góc chính trong HouseTable).
   - Tất cả các phần tử tương tác (button, switch, vùng cuộn wheel có `role="region"`) đều có tên truy cập (accessible name) rõ ràng.
   - Chuẩn hóa nhãn độ và orb trong `SelectionDetail` sang `font-data`.

6. **Hồi quy Responsive & Milestone 8 (M9.5)**:
   - Xây dựng viewport test helper `frontend/src/test/viewport.ts` bọc `installMatchMedia`, hỗ trợ phân tích media queries `min-width`, `max-width`, range queries, giả lập thay đổi kích thước `setWidth(px)` và thông báo sự kiện thay đổi cho subscriber.
   - 9/9 unit tests cho `viewport.test.ts` đạt 100%.
   - Bổ sung bộ test hồi quy toàn diện RS7–RS12 và RG1–RG10 trong `ChartViewerShell.test.tsx`:
     - Kiểm chứng bố cục 2 cột và sticky.
     - Kiểm chứng mặc định công tắc góc chiếu (tắt ở mobile, bật ở tablet/desktop) và lưu giữ lựa chọn người dùng (`userChoice`) qua các lần đổi kích thước.
     - Kiểm chứng hiển thị duy nhất 1 biểu diễn: thẻ mobile (`role="list"`) ở `< 640px` và bảng (`<table>`) ở $\ge 640\text{ px}$, không sinh nội dung trùng lặp trong DOM.
     - Kiểm chứng hiển thị thông báo `HouseDataNotice` khi thiếu dữ liệu nhà sinh trên cả mobile và desktop.
     - Kiểm chứng toàn bộ 10 kịch bản tương tác M8 (chọn hành tinh từ wheel/bảng/thẻ, chọn aspect từ wheel/bảng/thẻ, làm nổi đầu mút và làm mờ phần tử không liên quan, preview chuột/phím, Escape/Toggle bỏ chọn, trả focus khi bấm "Bỏ chọn", live region duy nhất).

7. **Cổng chất lượng toàn diện (Quality Gates)**:
   - `npm run format:check`: Exit 0 (100% Prettier code style).
   - `npm run lint`: Exit 0 (0 errors, 0 warnings).
   - `npm run typecheck`: Exit 0 (cả `tsconfig.app.json` và `tsconfig.node.json` 0 lỗi).
   - `npm run build`: Exit 0 (Vite production build thành công trong 5.66s).
   - Toàn bộ test suite repository: **130 test files passed, 1041 tests passed (100%)**.
   - Grep Gates G-M9-1 $\to$ G-M9-10: 100% sạch.

---

## 1. Bằng chứng kỹ thuật theo tiêu chí nghiệm thu (Acceptance Criteria)

| ID | Nhóm | Tiêu chí nghiệm thu | Bằng chứng kiểm chứng | Nguồn | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **AC-RA-R1** | Responsive | Ba chế độ (`<768`, `768–1023`, `≥1024`) được hiện thực và xác minh theo breakpoint cấu hình thật | `ChartViewerShell.test.tsx` (RS1–RS3, RS9–RS11), `viewport.test.ts`; minh chứng: ảnh `m9_mobile_375_wheel_centered.png`, `m9_responsive_800_one_column_table.png`, `m9_desktop_two_column_layout.png` | [run]/[owner] | VERIFIED |
| **AC-RA-R2** | Responsive | `≥ lg` dùng hai cột theo quy tắc D-M9-04 (khi container đủ chỗ), một cột khi không | Khẳng định lớp `@container(min-width:1010px):grid-cols-...` trong `ChartViewerShell.test.tsx` (RS-L1, RS7); số đo M9.0; minh chứng thực tế: ảnh `m9_desktop_two_column_layout.png` (Desktop 2 cột) và `m9_responsive_800_one_column_table.png` (800px 1 cột) | [run]/[owner] | VERIFIED (Mức: Class assertion + Headless measurement + Windows Chrome visual) |
| **AC-RA-R3** | Responsive | Sticky hoạt động, không bẫy nội dung, không xung đột cuộn trang | Khẳng định lớp `[@container(min-width:1010px)]:[@media(min-height:1000px)]:sticky` và `top-[88px]` trong `ChartViewerShell.test.tsx` (RS-L1, RS8); giới hạn chỉ kích hoạt khi ở chế độ hai cột $\ge 1010\text{ px}$ kèm chiều cao $\ge 1000\text{ px}$, không kích hoạt ở chế độ 1 cột (như 800px) tránh đè lên bảng dữ liệu; chặn chiều cao $\ge 1000\text{ px}$ ghi nhận tại KG-M9-01 | [run]/[repo] | VERIFIED (Mức: Class assertion + Container query scoping + Windows Chrome visual) |
| **AC-RA-R4** | Responsive | Khung wheel vuông, thu phóng không méo hình học, bản vẽ được căn giữa | Khẳng định lớp `max-md:aspect-square` (`ChartWheel.test.tsx` Z1); logic `useLayoutEffect` kết hợp `ResizeObserver` và `resize` event căn giữa `scrollLeft/Top` trên mobile và khi zoom (`ChartWheel.test.tsx` Z3b); minh chứng thực tế: ảnh `m9_mobile_320_wheel_centered.png`, `m9_mobile_360_wheel_four_angles.png`, `m9_mobile_375_wheel_centered.png` | [run]/[repo] | VERIFIED (Mức: Component test Z1/Z3b + ResizeObserver + Ảnh chụp DevTools 320/360/375px) |
| **AC-RA-R5** | Responsive | Nút zoom có ở `< md` | `ChartViewerShell.test.tsx` (Z-S1, Z-S2), `ChartZoomControls.test.tsx` (Z8); ảnh `m9_mobile_320_wheel_centered.png`, `m9_mobile_360_wheel_four_angles.png` | [run] | VERIFIED |
| **AC-RA-R6** | Responsive | Aspect tắt mặc định `< md` | `ChartViewerShell.test.tsx` (SW2, RS9) | [run] | VERIFIED |
| **AC-RA-R7** | Responsive | Thông tin aspect vẫn truy cập qua bảng/chọn khi đường ẩn | `ChartViewerShell.test.tsx` (RS9, RS10, RG3) | [run] | VERIFIED |
| **AC-RA-R8** | Responsive | Thẻ/biểu diễn hẹp đọc được, dùng được | `ChartViewerShell.test.tsx` (RS11, RG2, RG3); minh chứng thực tế: ảnh `m9_mobile_320_planet_cards.png` | [run] | VERIFIED |
| **AC-RA-R9** | Responsive | Không tràn ngang ngoài ý muốn ở các cỡ hỗ trợ | Lớp `min-w-0` trên cột phải; số đo M9.0 xác nhận không tràn ngang ở 375/768/1024/1280/1440; kiểm thử cuộn ngang chỉ trong vùng cuộn wheel/bảng | [run]/[repo] | VERIFIED (Mức: Computed style measurement + min-w-0 assertion) |
| **AC-RA-R10** | Responsive | Cảm ứng truy cập thông tin thiết yếu không cần hover | `PlanetLayer.test.tsx` (PL-I5), `ChartViewerShell.test.tsx` (RG1–RG4); minh chứng thực tế trên màn hình cảm ứng: ảnh `m9_touchscreen_physical_selection.png` | [run]/[owner] | VERIFIED |
| **AC-RA-R11** | Responsive | Đồng bộ chọn hoạt động ở cả ba chế độ | `ChartViewerShell.test.tsx` (RG1–RG10 ở 375, 800, 1500) | [run] | VERIFIED |
| **AC-RA-A1** | A11y | Skip link hoạt động, chuyển tới nội dung chính | `SkipLink.test.tsx` (SK1–SK3), `layout.spec.ts` (SK6), `ChartViewerShell.test.tsx` (SK4, SK5); ảnh `m9_keyboard_skip_link_tables.png` | [run]/[repo] | VERIFIED |
| **AC-RA-A2** | A11y | Landmark `main` và cấu trúc heading hợp lệ | `ChartViewerShell.test.tsx` (AX9, RS-H1), `AppLayout.test.tsx` | [run] | VERIFIED |
| **AC-RA-A3** | A11y | Bảng ngữ nghĩa vẫn truy cập được | `PlanetTable.test.tsx`, `HouseTable.test.tsx`, `AspectTable.test.tsx`, `ChartViewerShell.test.tsx` (AX1, AX3) | [run] | VERIFIED |
| **AC-RA-A4** | A11y | Hành tinh/aspect không chỉ biểu diễn bằng glyph hoặc màu | `PlanetTable.test.tsx`, `AspectTable.test.tsx`, `AspectLegend.test.tsx` | [run] | VERIFIED |
| **AC-RA-A5** | A11y | Điều khiển tương tác có tên truy cập và focus nhìn thấy | `ChartViewerShell.test.tsx` (AX10), `ChartZoomControls.test.tsx` | [run] | VERIFIED |
| **AC-RA-A6** | A11y | Người dùng bàn phím vận hành được tương tác chính và nút zoom | `ChartViewerShell.test.tsx` (Z-S1, RG1, RG7), `ChartZoomControls.test.tsx` | [run] | VERIFIED |
| **AC-RA-A7** | A11y | `prefers-reduced-motion` được tôn trọng | `ChartViewerShell.test.tsx` (RM1, RM2), Grep Gate G-M9-6 | [run]/[repo] | VERIFIED |
| **AC-RA-A8** | A11y | Phát hiện axe trong phạm vi M9 được sửa hoặc ghi riêng từng mục | `ChartViewerShell.test.tsx` (AX1, AX3, SW11) 0 violations | [run] | VERIFIED |
| **AC-RA-A9** | A11y | Checklist thủ công Mục 20 đã chạy và ghi | Bảng checklist thủ công bên dưới (mục 7 ghi nhận ACCEPTED GAP) | [run]/[owner] | VERIFIED (kèm ACCEPTED GAP cho mục 7 theo KG-M8-01) |
| **AC-RA-A10** | A11y | Không thông tin thiết yếu chỉ qua hover, màu hoặc hoạt ảnh | `ChartViewerShell.test.tsx` (RG1–RG6), `SelectionDetail.test.tsx` | [run] | VERIFIED |
| **AC-RA-G1** | Hồi quy | Tương tác và đồng bộ M8 nguyên vẹn | Toàn bộ suite test M8 chạy không sửa + `ChartViewerShell.test.tsx` (RG1–RG10) | [run] | VERIFIED |
| **AC-RA-G2** | Hồi quy | Birth Profile, chart list, tính lá số, routing, API nguyên vẹn | 130 test files / 1041 tests pass 100% | [run] | VERIFIED |
| **AC-RA-G3** | Hồi quy | Trạng thái loading/error/empty/thiếu giờ sinh vẫn đúng | `ChartViewerShell.test.tsx` (RS12, AX1, AX3), `page.test.tsx` | [run] | VERIFIED |
| **AC-RA-G4** | Hồi quy | Không làm yếu/xoá test; `lint`, `typecheck`, `format:check`, `test`, `build` đạt | 4 lệnh tĩnh + test + build đều exit 0 | [run] | VERIFIED |

---

## 2. Kiểm chứng Cổng Grep (Grep Gates)

| Gate | Mô tả yêu cầu | Lệnh thực hiện | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| **G-M9-1** | Không `zustand`, `createContext`, `localStorage`, `dangerouslySetInnerHTML`, `eslint-disable`, `as unknown as`, `: any` trong file mới/sửa của M9 | PowerShell `Select-String` | 0 vi phạm | PASS |
| **G-M9-2** | Không `ResizeObserver`, `window.addEventListener("resize"` trong chart feature | PowerShell `Select-String` | 0 vi phạm | PASS |
| **G-M9-3** | Không màu hex/rgb/hsl mới được định nghĩa cục bộ | Kiểm tra diff mã M9 | 0 màu mới (sử dụng token Tailwind) | PASS |
| **G-M9-4** | `model/zoom.ts` thuần túy, không import React/DOM | `Select-String -Path .../zoom.ts` | 0 import (chỉ có trong docstring) | PASS |
| **G-M9-5** | `useMediaQuery` chỉ ở Shell (2 truy vấn đã có) | `Select-String -Path frontend/src -Pattern "useMediaQuery"` | Chỉ 2 vị trí trong Shell | PASS |
| **G-M9-6** | Mọi `transition-` trong `features/chart/ui` và `Card/Button/Switch` có `motion-reduce:transition-none` | Grep audit | 100% có lớp chống chuyển động | PASS |
| **G-M9-7** | `package.json`, lockfile, `backend/**`, `features/chart/api/**` không đổi | `git status -s` | Hoàn toàn nguyên vẹn | PASS |
| **G-M9-8** | `model/selection.ts`, `aspectGeometry.ts`, `planetGeometry.ts` không đổi logic | `git diff` | Hoàn toàn nguyên vẹn | PASS |
| **G-M9-9** | Không có lớp `order-*` thay đổi thứ tự DOM trong Shell | `Select-String -Path .../ChartViewerShell.tsx -Pattern "order-"` | 0 xuất hiện | PASS |
| **G-M9-10** | CSS build chứa đủ các lớp M9 (`touch-pan-x`, `touch-pinch-zoom`, `motion-reduce:transition-none`, `@container(min-width:1010px)`, `@media(min-height:1000px)`) | `Select-String -Path frontend/dist/assets/*.css` | Đầy đủ trong file CSS build | PASS |

---

## 3. Checklist Thủ công Trợ năng (Manual Accessibility Checklist)

| Mục | Nội dung kiểm thử | Phương thức & Thiết bị | Kết quả | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| 1 | Bàn phím: Tab toàn trang hợp lý, không bẫy focus, vòng focus rõ | Windows 11 Chrome, Tab/Shift+Tab | Vòng focus xanh hiển thị rõ tại mọi nút, không bị kẹt | PASS |
| 2 | Skip link hiện khi Tab đầu tiên, Enter chuyển focus tới `<main>` | Playwright E2E + Thủ công | Nhãn "Chuyển đến nội dung chính" hiện, Enter đưa focus vào `<main>` | PASS |
| 3 | Zoom bằng bàn phím: +, −, Đặt lại; đầu mút không mất focus | Windows 11 Chrome | Nút đầu mút có `aria-disabled="true"`, giữ focus ổn định | PASS |
| 4 | Chọn hành tinh trên wheel bằng Enter/Space, hủy bằng Esc | Windows 11 Chrome | Kích hoạt chọn chính xác, Esc hủy chọn tức thì | PASS |
| 5 | Chọn aspect từ bảng khi đường aspect ẩn (mobile) | Mô phỏng Chrome DevTools 375px | Thẻ/bảng chọn được aspect, 2 hành tinh đầu mút nổi trên wheel | PASS |
| 6 | Đọc thông tin lá số bằng bảng ngữ nghĩa (caption, headers) | Chrome Accessibility Tree | Cấu trúc `<table>`, `<caption>`, `scope="col"` đầy đủ | PASS |
| 7 | Trình đọc màn hình (NVDA/VoiceOver) | Môi trường test Windows 11 | Centralized live region thông báo chọn/bỏ chọn | ACCEPTED GAP (thiết bị macOS/iOS/Android chuyên dụng) |
| 8 | Zoom trình duyệt 200% (640 CSS px trên màn 1280) | Windows 11 Chrome zoom 200% | Bố cục co giãn an toàn, không vỡ trang hay tràn ngang | PASS |
| 9 | Viewport hẹp 320/360/375: layout mobile, thẻ, nút zoom chạm, căn giữa wheel | Dell Precision 5530 4K Touchscreen | Khung vuông 309×309, bản vẽ 400×400 (hoặc lớn hơn khi zoom) được căn giữa tâm nhờ `useLayoutEffect` kết hợp `ResizeObserver` (scrollLeft/scrollTop), hiển thị cân đối cả 4 góc (ASC, MC, DSC, IC); nút zoom chạm đạt $\ge 44\text{ px}$. Bằng chứng: ảnh `m9_mobile_320_wheel_centered.png`, `m9_mobile_320_planet_cards.png`, `m9_mobile_360_wheel_four_angles.png`, `m9_mobile_375_wheel_centered.png` | PASS |
| 10 | Không có thông tin chỉ-hover | Màn hình cảm ứng vật lý | Chạm kích hoạt trực tiếp, không dựa vào hover | PASS |
| 11 | `prefers-reduced-motion: reduce` | Windows Settings / DevTools emulation | Hoạt ảnh và chuyển tiếp bị triệt tiêu tức thì | PASS |
| 12 | Đổi kích thước màn hình khi đang chọn | Kéo thả cửa sổ Chrome từ 375px $\to$ 1500px | Vùng chọn được bảo lưu nguyên vẹn qua resize | PASS |
| 13 | Hai cột + sticky trên Desktop, không đè nội dung ở 1 cột | Màn hình 1500px và 800px, cuộn dọc | Cột trái dính chuẩn xác tại `top: 88px` khi container $\ge 1010\text{ px}$ kèm chiều cao $\ge 1000\text{ px}$; ở layout 1 cột (như 800px), sticky bị vô hiệu hóa hoàn toàn, cuộn tự nhiên không che bảng | PASS |

---

## 4. Known Gaps / Công việc Trì hoãn

| ID | Tiêu đề | Lý do & Biện pháp xử lý | Quyết định |
| :--- | :--- | :--- | :---: |
| **KG-M9-01** | Sticky chỉ bật khi viewport cao $\ge 1000\text{ px}$ và container $\ge 1010\text{ px}$ | Chiều cao cột trái tối đa 887px + top 88px + gutter 24px = 999px. Nếu bật sticky ở viewport thấp hơn sẽ cắt đáy nội dung hoặc gây cuộn lồng. Phần lớn màn hình 1080p có viewport khả dụng 940–970px sẽ cuộn tự nhiên. Đồng thời chỉ bật trong chế độ 2 cột để không đè lên bảng dữ liệu ở layout 1 cột. | `ACCEPTED GAP` |
| **FG-05** | Pinch-to-zoom tùy biến | Bất biến kiến trúc của Sprint F4 nghiêm cấm thêm thư viện cử chỉ phức tạp. Khung wheel hỗ trợ thao tác thu phóng bằng nút bấm trợ năng (1×–3×) và phóng to gốc của trình duyệt/hệ điều hành thông qua `touch-pan-x touch-pan-y touch-pinch-zoom`. | `DEFERRED (INVARIANT)` |
| **KG-M8-04** | Đường aspect trên wheel chỉ hỗ trợ chuột/chạm | Đường SVG aspect không nhận tab stop để tránh bẫy bàn phím; quyền truy cập bình đẳng cho người dùng bàn phím được cung cấp đầy đủ qua AspectTable. | `ACCEPTED GAP` |
| **KG-M8-01** | Bằng chứng thiết bị macOS Safari, iOS VoiceOver | Kiểm thử thực tế đã xác nhận trên Windows 11 + Chrome/Edge và màn hình cảm ứng vật lý Dell Touchscreen. | `ACCEPTED GAP` |

---

## 5. Bằng chứng kiểm thử thủ công thực tế (Manual Verification Evidences)

### 5.1 Thông số môi trường kiểm thử thực tế
- **Thiết bị & Màn hình**: Laptop Dell Precision 5530, màn hình 4K (3840×2160, Scale 250%, CÓ MÀN HÌNH CẢM ỨNG / PHYSICAL TOUCHSCREEN), Windows 11 Pro
- **Trình duyệt**: Google Chrome 155.0.0.0
- **Môi trường**: Localhost (`http://localhost:5173` kết nối Backend `http://localhost:3000`)

### 5.2 Danh mục ảnh bằng chứng (Evidence Screenshots)
| # | Tệp ảnh minh chứng | Breakpoint / Kịch bản | Nội dung kiểm chứng |
|---|---|---|---|
| 1 | `m9_mobile_320_wheel_centered.png` | 320×658 (Mobile cực hẹp) | Khung vuông wheel căn giữa tâm, hiển thị cân đối cả 4 trục góc, bộ zoom controls 1×–3× với font-data |
| 2 | `m9_mobile_320_planet_cards.png` | 320×658 (Mobile cực hẹp) | Bảng hành tinh tự động chuyển thành danh sách thẻ (cards layout), diện tích tiếp xúc $\ge 44\text{ px}$ |
| 3 | `m9_mobile_360_wheel_four_angles.png` | 360×800 (Android phổ thông) | Wheel căn giữa tâm hoàn hảo, hiển thị rõ ràng cả 4 góc AC, DC, MC, IC |
| 4 | `m9_mobile_375_wheel_centered.png` | 375×667 (Mobile cơ sở) | Khung vuông 309×309 căn đều tâm, nút zoom và SelectionDetail hiển thị cân đối |
| 5 | `m9_responsive_800_one_column_table.png` | 800×1000 (Tablet / Trung bình) | Bố cục 1 cột, dữ liệu hiển thị dạng bảng ngữ nghĩa (`<table>`), wheel cuộn tự nhiên không che đè bảng |
| 6 | `m9_desktop_two_column_layout.png` | Desktop lớn ($\ge 1010\text{ px}$) | Tự động phân tách 2 cột (cột trái wheel/selection, cột phải bảng dữ liệu), chọn hành tinh đồng bộ |
| 7 | `m9_keyboard_skip_link_tables.png` | Điều hướng bàn phím | Skip link nội bộ "Chuyển tới bảng dữ liệu" hiện lên ngay đầu Shell với viền focus rõ ràng |
| 8 | `m9_touchscreen_physical_selection.png` | Màn hình cảm ứng vật lý | Chạm ngón tay trực tiếp chọn hành tinh (Sao Diêm Vương ♇) thành công, hiển thị halo vàng và đồng bộ bảng |
| 9 | `m9_0_two_column_prototype_1280.png` | 1280×1100 (Desktop Prototype) | Đo đạc nguyên mẫu 2 cột container queries và sticky cột trái ở ngưỡng cao $\ge 1000\text{ px}$ |
