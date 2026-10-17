# Sprint F4 — M4 Exit Criteria Evidence Matrix

## Chart Wheel Foundation (`FE-S4.4`)

**Vị trí lưu:** `docs/implementation/archive/sprint-f4/Sprint_F4_M4_Exit_Criteria_Evidence_Matrix.md`  
**Milestone:** F4-M4 (`FE-S4.4`: Nền tảng biểu đồ tròn SVG — vành 12 cung, vạch chia độ, vòng nhà & trục góc)  
**Ngày review:** 2026-10-16  
**Commit Head:** `d9997c0`  
**CI Run:** [GitHub Actions Run 38758426445 / Job 116502955207](https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/38758426445/job/116502955207)  
**Nguồn bằng chứng:** `[repo]` đọc mã/diff; `[run]` chạy lệnh thực tế trên môi trường; `[owner]` quyết định phê duyệt.  
**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `ACCEPTED GAP` · `NOT APPLICABLE`.

---

## Kết luận

**`PASS WITH KNOWN GAPS`** — toàn bộ các tiêu chí nghiệm thu của Sprint F4 M4 (`FE-S4.4`) đã hoàn tất và vượt qua 100% các cổng kiểm thử:

1. **Pure Geometry Primitives (F4-M4.1)**:
   - Các hằng số hình học bố cục: `WHEEL_VIEWBOX_SIZE = 600`, `WHEEL_CENTER = 300`, `WHEEL_RADII`.
   - Các hàm toán học thuần hoàn toàn độc lập với React/DOM: `normalizeLongitude`, `toScreenAngle`, `polarToCartesian`, `arcPath`, `sectorMidAngle`, `roundCoord`.
   - Toàn bộ tham số ngoài khoảng hợp lệ hoặc không hữu hạn (`NaN`, `±Infinity`) ném `RangeError`.
   - 14/14 unit tests đạt chuẩn 100% (`geometry.test.ts`, G1–G10).
2. **Build Wheel Geometry (F4-M4.2)**:
   - Kiểu dữ liệu và hợp đồng rõ ràng: `WheelGeometry`, `WheelSignCell`, `WheelTick`, `WheelHouseSpoke`, `WheelAngleMarker`, `WheelGeometryError`.
   - Hàm `buildWheelGeometry(vm: ChartViewModel)` chuyển hóa view model thành dữ liệu hình học phẳng tất định, không chứa khái niệm hay dữ liệu hành tinh/góc chiếu (dành cho S4.5/S4.6).
   - Góc xoay `rotation = vm.flags.ascendantLongitude ?? 0` áp dụng một lần duy nhất tại `toScreenAngle`, đảm bảo trục Ascendant luôn nằm ở $180^\circ$ (bên trái) mà không bị xoay đôi (`anti-double-rotation`).
   - 72 vạch chia độ (mỗi 5°, 12 vạch major tại bội số 30° phân biệt bằng nét và độ dài theo `D-M4-2`).
   - Nan hoa đỉnh nhà và nhãn số nhà tính theo trung điểm góc thật `sectorMidAngle`; an toàn trả về `houses: null` khi `houseDataAvailable === false`.
   - 19/19 unit tests đạt chuẩn 100% (`wheelGeometry.test.ts`, W1–W19).
3. **SVG Foundation Layers (F4-M4.3)**:
   - 4 lớp SVG chuyên biệt, độc lập, chỉ in dữ liệu hình học có sẵn: `ZodiacLayer`, `TickLayer`, `HouseLayer`, `AngleLayer`.
   - Hoàn toàn dùng token CSS class từ Design System (`stroke-strong`, `stroke-subtle`, `fill-primary`, `fill-secondary`, `font-display`, `font-data`, `font-bold`), không hardcode mã màu hex/rgb/hsl.
   - Chứa ký tự Variation Selector `\uFE0E` cho 12 glyph cung hoàng đạo.
   - 12 thẻ `<path d={sign.path} fill="none" />` được giữ lại trong `ZodiacLayer` kèm chú thích kiến trúc rõ ràng, đóng vai trò dự trữ vùng hit-area cho tính năng tương tác chọn cung hoàng đạo ở Sprint F4 S4.8.
   - 11/11 unit tests đạt chuẩn 100% (`ZodiacLayer.test.tsx`, `TickLayer.test.tsx`, `HouseLayer.test.tsx`, `AngleLayer.test.tsx`).
4. **ChartWheel Wrapper & Design System Integration (F4-M4.4)**:
   - Semantic wrapper `<figure data-testid="chart-wheel">` bọc vùng cuộn ngang có thể focus bàn phím (`role="region"`, `tabIndex={0}`, `aria-label`).
   - `tabIndex={0}` trên vùng cuộn `overflow-x-auto` (`role="region"`) được khai báo trực tiếp và tuân thủ phân tích tĩnh thông qua cấu hình quy tắc scoped override cho `jsx-a11y/no-noninteractive-tabindex` (`{ roles: ["tabpanel", "region"] }`) trong `eslint.config.js`.
   - Gốc SVG `viewBox="0 0 600 600"`, `role="img"` theo quyết định `D-M4-5`, liên kết `<title>` và `<desc>` qua `aria-labelledby`/`aria-describedby` (`useId`).
   - Hàm thuần `buildWheelDescription(vm)` tóm tắt trung thực hệ nhà và góc Ascendant (không bịa thông tin hành tinh).
   - `figcaption` nêu rõ phạm vi biểu đồ và hướng dẫn xem vị trí hành tinh tại bảng dữ liệu bên dưới.
   - 16/16 unit & axe tests đạt chuẩn 100% (`ChartWheel.test.tsx`, C1–C16).
5. **Viewer Shell Integration (F4-M4.5)**:
   - Gắn `ChartWheel` vào `ChartViewerShell.tsx` bên trong `<Card variant="raised">`, thay thế placeholder theo đúng quyết định đã được duyệt `D-M4-4`.
   - Tối ưu hóa tính toán với `useMemo(() => buildWheelGeometry(vm), [vm])`.
   - Cập nhật 3 assertion cũ từ `chart-visualization-placeholder` sang `chart-wheel` (`ChartViewerShell.test.tsx` S6; `page.test.tsx` V1, V2). **Lý do cập nhật:** Thay thế placeholder bằng biểu đồ tròn SVG thật sự, tăng cường kiểm thử chặt chẽ cấu trúc `viewBox` và sự hiện diện của biểu đồ, không làm yếu test.
   - Thêm mới 2 test tích hợp: `S-W1` (Shell hiển thị wheel cùng đúng 4 bảng dữ liệu theo tên: Hành tinh, 12 Nhà, Các góc chính, Góc chiếu) và `S-W2` (Shell hiển thị wheel không có vòng nhà khi thiếu giờ sinh, bảo toàn `HouseDataNotice` duy nhất).
   - 38/38 unit & integration tests đạt chuẩn 100% (`ChartViewerShell.test.tsx`, `page.test.tsx`).
6. **Cổng chất lượng tuyệt đối (F4-M4.6)**:
   - CI Run #262 ([GitHub Actions Run 38758426445 / Job 116502955207](https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/38758426445/job/116502955207)) trên commit `d9997c0` đạt xanh toàn bộ.
   - `npm run format:check`: Exit 0 (100% Prettier code style).
   - `npm run lint`: Exit 0 (0 errors, 0 warnings).
   - `npm run typecheck`: Exit 0 (cả `tsconfig.app.json` và `tsconfig.node.json` 0 lỗi).
   - `npm run build`: Exit 0 (Vite production build thành công trong 5.59s).
   - `npm test`: Toàn bộ **118 test files passed, 804 tests passed (100%)**.
   - Grep Gates: 100% sạch — không React/DOM trong model, không `Math.cos/sin/atan2` trong UI, không từ khóa `planets`/`aspects` trong wheel, không hardcode màu, không `aspectGeometry.ts`.

---

## 1. Bằng chứng kỹ thuật theo tiêu chí nghiệm thu (Acceptance Criteria)

| ID | Tiêu chí nghiệm thu | Bằng chứng kiểm chứng | Nguồn | Trạng thái |
|---|---|---|:---:|:---:|
| **AC-G1** | Primitives thuần, tất định, chỉ nhận số hữu hạn | `geometry.ts`, `geometry.test.ts` (G1, G2, G5, G7, G9, G10), Grep Gate 1 | [run] | VERIFIED |
| **AC-G2** | Quy ước toạ độ đúng 4 hướng cardinal (ASC trái, MC đỉnh) | `geometry.ts`, `geometry.test.ts` (G3, G5), `wheelGeometry.test.ts` (W2) | [run] | VERIFIED |
| **AC-G3** | Xử lý vòng $360^\circ / 0^\circ$ chuẩn xác | `geometry.ts`, `geometry.test.ts` (G1, G4, G10) | [run] | VERIFIED |
| **AC-G4** | `arcPath` khớp toạ độ `polarToCartesian` | `geometry.ts`, `geometry.test.ts` (G8, G9) | [run] | VERIFIED |
| **AC-G5** | `buildWheelGeometry` tuân thủ hợp đồng Mục 15 | `wheelGeometry.ts`, `wheelGeometry.test.ts` (W1, W10) | [run] | VERIFIED |
| **AC-G6** | Biên cung và vạch chia độ đúng góc, số lượng (72 vạch, 12 major), khoảng cách | `wheelGeometry.ts`, `wheelGeometry.test.ts` (W3–W5), `TickLayer.test.tsx` | [run] | VERIFIED |
| **AC-G7** | Đỉnh nhà đúng toạ độ; số nhà tại trung điểm thật giữa hai cusp | `wheelGeometry.ts`, `wheelGeometry.test.ts` (W6, W7, W11), `HouseLayer.test.tsx` | [run] | VERIFIED |
| **AC-G8** | Xoay ASC nhất quán, không xoay đôi | `wheelGeometry.ts`, `wheelGeometry.test.ts` (W2, W3, W8, W19) | [run] | VERIFIED |
| **AC-G9** | Marker góc thẳng hàng với cùng hệ toạ độ và xoay | `wheelGeometry.ts`, `wheelGeometry.test.ts` (W8, W12–W14), `AngleLayer.test.tsx` | [run] | VERIFIED |
| **AC-G10** | Tính tất định, không đột biến VM; vi phạm hợp đồng ném lỗi | `wheelGeometry.ts`, `wheelGeometry.test.ts` (W15, W16) | [run] | VERIFIED |
| **AC-S1** | Vành 12 cung hoàng đạo đúng thứ tự Aries…Pisces kèm glyph | `ZodiacLayer.tsx`, `ZodiacLayer.test.tsx`, `ChartWheel.test.tsx` (C2) | [run] | VERIFIED |
| **AC-S2** | 72 vạch chia độ (12 major stroke-strong 1.5px, 60 minor stroke-subtle 1px) | `TickLayer.tsx`, `TickLayer.test.tsx`, `ChartWheel.test.tsx` (C3) | [run] | VERIFIED |
| **AC-S3** | Vòng nhà + 12 nan hoa đỉnh nhà + 12 số nhà khi có dữ liệu | `HouseLayer.tsx`, `HouseLayer.test.tsx`, `ChartWheel.test.tsx` (C4) | [run] | VERIFIED |
| **AC-S4** | Không có vòng/đỉnh/số nhà khi thiếu giờ sinh; wheel vẫn hợp lệ | `HouseLayer.tsx`, `HouseLayer.test.tsx`, `ChartWheel.test.tsx` (C5), `ChartViewerShell.test.tsx` (S-W2) | [run] | VERIFIED |
| **AC-S5** | Marker góc cardinal có mặt, chịu được thiếu hoặc góc lạ | `AngleLayer.tsx`, `AngleLayer.test.tsx`, `ChartWheel.test.tsx` (C6–C8) | [run] | VERIFIED |
| **AC-S6** | Mọi lớp dùng chung hệ toạ độ; sử dụng token Design System thay vì màu cố định | `ChartWheel.tsx`, `ChartWheel.test.tsx` (C9–C11), Grep Gate 5 | [run] | VERIFIED |
| **AC-S7** | `figure` + `svg` đúng ngữ nghĩa, `viewBox="0 0 600 600"` cố định | `ChartWheel.tsx`, `ChartWheel.test.tsx` (C1) | [run] | VERIFIED |
| **AC-S8** | Trợ năng: `role="img"`, `title`/`desc`, vùng cuộn focusable bàn phím, `vitest-axe` sạch | `ChartWheel.tsx`, `ChartWheel.test.tsx` (C1, C13), axe audits | [run] | VERIFIED |
| **AC-S9** | `figcaption`/`desc` trung thực (không nhắc hành tinh, không nêu nguyên nhân thiếu nhà) | `ChartWheel.tsx`, `ChartWheel.test.tsx` (C14, C15) | [run] | VERIFIED |
| **AC-S10** | Co giãn responsive: `w-full`, `min-w-[400px]`, `max-w-[640px]` | `ChartWheel.tsx`, `ChartWheel.test.tsx` (C1) | [run] | VERIFIED |
| **AC-S11** | Không có tương tác/zoom/state nội bộ ở tầng wheel | `ChartWheel.tsx`, `ChartWheel.test.tsx` (C12), Grep Gate 4 | [run] | VERIFIED |
| **AC-I1** | `ChartWheel` hiển thị trong `ChartViewerShell` thay thế placeholder | `ChartViewerShell.tsx`, `ChartViewerShell.test.tsx` (S6, S-W1 với đúng 4 bảng) | [run] | VERIFIED |
| **AC-I2** | 3 bảng dữ liệu và notice thiếu nhà bảo toàn trọn vẹn hành vi | `ChartViewerShell.test.tsx` (S1–S5, S-W1, S-W2) | [run] | VERIFIED |
| **AC-I3** | 3 assertion placeholder cũ được cập nhật chặt chẽ, có ghi chép lý do | `ChartViewerShell.test.tsx` (S6), `page.test.tsx` (V1, V2), ghi chép Mục 2 | [repo] | VERIFIED |
| **AC-Q1** | `typecheck`, `lint`, `format:check`, `build` exit code 0 | Chạy thực tế trên môi trường, exit code 0 toàn bộ | [run] | VERIFIED |
| **AC-Q2** | Toàn bộ test suite (cũ + mới) đạt 100% | `npm test` đạt 118 files, 804 tests (100% passed) | [run] | VERIFIED |
| **AC-Q3** | CI Frontend xanh trên commit cuối | [CI #262 — GitHub Actions Run 38758426445 / Job 116502955207](https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/38758426445/job/116502955207), commit `d9997c0`; toàn bộ static checks (lint, format:check, typecheck, build) và test suite (118 files, 804 tests) đều exit 0 | [run] | VERIFIED |
| **AC-Q4** | Báo cáo kiểm thử trợ năng thủ công | Vượt qua 100% kiểm thử tự động `vitest-axe` (`AC-S8`) và hoàn tất kiểm thử thủ công trực quan & trợ năng trên thiết bị thực tế bởi Phuc Hoang (Windows 11 NVDA 2024.3 + iPhone 11 Pro Max iOS 18.0 Safari VoiceOver) ngày 2026-10-16: Đạt 6/6 hạng mục PASS (12 glyph SVG phẳng đơn sắc, toạ độ ASC $180^\circ$ ngược chiều KĐH, No-House mode, tương phản $\ge 4.5:1$ ở cả 2 theme, cuộn phím mũi tên 320px, VoiceOver đọc đầy đủ). Chi tiết xem Mục 4. | [run] | VERIFIED |

---

## 2. Quyết định kỹ thuật đã thực thi (D-M4-1 … D-M4-12)

| ID | Quyết định theo Plan | Nội dung thực thi | Trạng thái |
|---|---|---|:---:|
| **D-M4-1** | Hệ toạ độ SVG: $viewBox\ 0\ 0\ 600\ 600$, $\theta=180^\circ + (\lambda - rotation)$ ngược chiều kim đồng hồ, ASC ở $180^\circ$ (trái) | Thực thi tại `geometry.ts` (`toScreenAngle`, `polarToCartesian`). Kiểm chứng qua tests G3–G5, W2. | VERIFIED |
| **D-M4-2** | Vạch chia độ mỗi $5^\circ$ (72 vạch; 12 major tại bội số $30^\circ$) | **Đã duyệt (Approved):** Sinh bằng hàm thuần; vạch major dài 14px (`stroke-strong`), vạch minor dài 6px (`stroke-subtle`). Không sinh 360 vạch để tiết kiệm DOM node. | VERIFIED |
| **D-M4-3** | M4 có glyph cung hoàng đạo, số nhà thường (1–12), nhãn góc `ASC/MC/DSC/IC`; không có nhãn hành tinh | Hiển thị glyph cung có `\uFE0E`, số nhà tại bán kính 195, nhãn góc tại bán kính 282. Không vẽ hành tinh. | VERIFIED |
| **D-M4-4** | Tích hợp wheel vào `ChartViewerShell`, thay thế placeholder ngay trong M4 | **Đã duyệt (Approved):** Thay placeholder bằng `<Card variant="raised"><ChartWheel vm={vm} geometry={wheelGeometry} /></Card>`. Sửa chặt chẽ 3 assertions cũ. | VERIFIED |
| **D-M4-5** | `role="img"` cho SVG ở M4; chuyển sang `group` khi bổ sung tương tác ở S4.5/S4.8 | **Đã duyệt có theo dõi (Approved with follow-up):** Dùng `role="img"` kèm `<title>` và `<desc>` liên kết bằng `aria-labelledby`/`aria-describedby` (`useId`). | VERIFIED |
| **D-M4-6** | Bố cục responsive: `viewBox` cố định, `w-full min-w-[400px] max-w-[640px]` trong vùng cuộn ngang có thể focus | Bọc trong `<div role="region" aria-label="..." tabIndex={0} className="overflow-x-auto ...">`. | VERIFIED |
| **D-M4-7** | Vi phạm bất biến ném `WheelGeometryError`/`RangeError`, không nuốt lỗi | Kiểm tra đầu vào hữu hạn trong `geometry.ts` và số lượng nhà trong `wheelGeometry.ts`. | VERIFIED |
| **D-M4-8** | Tách `geometry.ts` (primitives toán học) và `wheelGeometry.ts` (dựng hình từ VM) | Tách thành 2 file riêng biệt để các sprint sau (S4.5/S4.6) có thể import primitives mà không bị kéo phụ thuộc ViewModel. | VERIFIED |
| **D-M4-9** | Sử dụng token Design System (`stroke-strong/subtle`, `fill-primary/secondary`), không dùng màu Element | Không dùng mã màu inline hay hardcode hex/rgb; chuyển theme tự động theo CSS variables. | VERIFIED |
| **D-M4-10** | Làm tròn toạ độ 3 chữ số thập phân, chuẩn hoá $-0 \to 0$ | Hàm `roundCoord` chuẩn hóa toạ độ DOM sạch sẽ và ổn định. | VERIFIED |
| **D-M4-11** | Tập trung hằng số bán kính tại `WHEEL_RADII` | Khai báo tập trung một nơi tại `geometry.ts`. | VERIFIED |
| **D-M4-12** | Chụp một response Whole Sign thật làm fixture CAPTURED; tới khi có dùng DERIVED (nhãn rõ) | Fixture DERIVED được dựng từ `chartFull` theo hợp đồng Backend để kiểm thử Whole Sign (W11); khuyến nghị chụp payload thật từ Backend khi sẵn sàng (xem KG-M4-01). | VERIFIED |

---

## 3. Bằng chứng cổng chất lượng chi tiết

| Cổng kiểm tra | Lệnh thực thi | Kết quả chi tiết | Trạng thái |
|---|---|---|:---:|
| **Format check** | `npm run format:check` | Exit 0 — "All matched files use Prettier code style!" | VERIFIED |
| **Linter** | `npm run lint` | Exit 0 — 0 errors, 0 warnings (kèm quy tắc scoped override cho `jsx-a11y/no-noninteractive-tabindex` với `roles: ["tabpanel", "region"]`) | VERIFIED |
| **Typecheck** | `npm run typecheck` | Exit 0 — `tsc -p tsconfig.app.json` và `tsconfig.node.json` 0 lỗi | VERIFIED |
| **Production Build** | `npm run build` | Exit 0 — Built in 5.59s cleanly | VERIFIED |
| **M4 Test Suites** | `npx vitest run src/features/chart/model/geometry.test.ts src/features/chart/model/wheelGeometry.test.ts src/features/chart/ui/ChartWheel` | Exit 0 — **7 test files passed, 60 tests passed (100%)** | VERIFIED |
| **Full App Test Suite** | `npm test` | Exit 0 — **118 test files passed, 804 tests passed (100%)** | VERIFIED |
| **Grep Gate 1** | Model không import React/DOM | 0 matches — thuần toán học | VERIFIED |
| **Grep Gate 2** | UI không tự tính toạ độ (`Math.cos/sin/atan2`) | 0 matches — toàn bộ toạ độ do model cấp | VERIFIED |
| **Grep Gate 3** | Không chứa từ khóa `planets`/`aspects` trong `wheelGeometry`/`ChartWheel` | 0 matches — phạm vi M4 tách biệt tuyệt đối | VERIFIED |
| **Grep Gate 4** | Không có mẫu cấm (`zustand`, `useState`, `dangerouslySetInnerHTML`, `as unknown as`, `: any`, `eslint-disable`) | 0 matches — đảm bảo chuẩn clean code | VERIFIED |
| **Grep Gate 5** | Không hardcode mã màu (#hex, rgb, hsl) trong `ChartWheel` | 0 matches — 100% tuân thủ token Design System | VERIFIED |
| **Grep Gate 6** | `aspectGeometry.ts` không tồn tại | Tệp chưa tạo (đúng phạm vi, dành cho S4.6) | VERIFIED |
| **Grep Gate 7** | Không thêm thư viện bên ngoài | `package.json` và lockfile giữ nguyên | VERIFIED |

---

## 4. Báo cáo kiểm thử thủ công trực quan & trợ năng (Sprint F4 M4)

> [!NOTE]
> Tiêu chí `AC-Q4` và khoảng trống `KG-M4-07` (kiểm thử thủ công trực quan & trợ năng đa nền tảng) đã được hoàn tất và đóng (**VERIFIED / CLOSED**) bằng báo cáo kiểm thử thực tế trên thiết bị vật lý dưới đây.

### Kết quả kiểm thử thực tế

* **Người kiểm thử:** Phuc Hoang
* **Ngày thực hiện:** 2026-10-16
* **Thiết bị & Môi trường:**
  1. Desktop: Windows 11 — Chrome 129 / Edge 129 — Trình đọc: NVDA 2024.3
  2. Mobile iOS: iPhone 11 Pro Max — iOS 18.0 — Safari — Trình đọc: VoiceOver

| # | Hạng mục kiểm thử | Thiết bị | Kết quả | Ghi chú |
|---|---|---|:---:|---|
| 1 | Hiển thị 12 Glyph cung trong SVG | Win 11, iOS | PASS | Glyph vector phẳng đơn sắc, không biến thành emoji màu |
| 2 | Toạ độ ASC (bên trái, $180^\circ$), ngược chiều KĐH | Win 11 Chrome | PASS | Trục ASC chuẩn góc 9 giờ, 12 cung xoay ngược chiều KĐH |
| 3 | No-House Mode (thiếu giờ sinh) | Win 11, iPhone | PASS | Không có vòng nhà/số nhà, thông báo notice hiển thị đúng |
| 4 | Tương phản Light / Dark Theme | Win 11, iPhone | PASS | Đạt tương phản $\ge 4.5:1$ ở cả 2 theme |
| 5 | Vùng cuộn bàn phím (320px, phím mũi tên) | Win 11 Chrome | PASS | Focus ring rõ nét, phím mũi tên cuộn ngang trơn tru |
| 6 | Trình đọc màn hình (VoiceOver) | VoiceOver | PASS | Đọc đầy đủ tên vùng, tiêu đề Natal và tóm tắt Cung Mọc |

> [!IMPORTANT]
> **Lưu ý về trợ năng nhãn góc (F-4, bàn giao S4.5):** Các thuộc tính `aria-label` trên phần tử SVG `<text>` của nhãn góc nằm trong `<svg role="img">` hiện không được trình đọc màn hình đọc do các phần tử con của `role="img"` được coi là presentational. Hiện tại thông tin góc được truyền đạt đầy đủ qua `<desc>` (Cung Mọc / ASC) và Bảng các góc chính trong `HouseTable`. Khi chuyển sang `role="group"` ở S4.5 (khi bổ sung tương tác theo `D-M4-5`) thì `aria-label` này mới có hiệu lực trực tiếp cho AT.

---

## 5. Known Gaps Registry (M4)

| ID | Vấn đề | Phân loại | Ghi chú & Kế hoạch xử lý |
|---|---|---|---|
| **DOC-M4-01** | UI Spec §12.5 không định nghĩa toạ độ/tick/bán kính/xoay | Documentation Gap | Đã giải quyết kỹ thuật trong M4 bằng cách tuân thủ F4 plan §16–17 và chốt trong Decision Log D-M4-1. Cân nhắc cập nhật UI Spec. |
| **DOC-M4-02** | Tham chiếu "Mục 32" trong prompt gốc | Documentation Note | Tương ứng với F4 plan §32 (Testing & Numerical Verification Matrix). |
| **DOC-M4-03** | F4 plan §17 liệt kê `formatDegreeMinute` làm tròn/nhớ phút | Documentation Gap | Đã được thay thế bằng quy ước cắt xuống phút (truncate) ở Milestone M2. |
| **BE-M4-01** | Domain Spec §15.4 (Whole Sign: nhà 1 bắt đầu đầu cung) $\neq$ §16/`house.calculator.ts` (cusp 1 = ASC) | Backend Contract Issue | Khiến Whole Sign có nhà 1 và 12 hẹp hơn $30^\circ$. M4 giải quyết an toàn bằng cách vẽ theo đúng cusp trả về và định vị số nhà theo `sectorMidAngle` thật. Cần Backend làm rõ trong tương lai. |
| **KG-M4-01** | Chưa có fixture CAPTURED Whole Sign | Known Gap (D-M4-12) | M4 sử dụng fixture DERIVED từ `chartFull` theo hợp đồng Backend để kiểm thử Whole Sign (W11). Khuyến nghị ghi lại một payload Whole Sign thật khi Backend sẵn sàng. |
| **KG-M4-02** | Không tô màu theo nguyên tố cung (Element) | Known Gap — KG-M2-02 | Design System hiện chưa có token màu Element; ViewModel chưa cung cấp metadata nguyên tố. Vành cung hiển thị trung tính và phân tách bằng đường biên. |
| **KG-M4-03** | Số La Mã cho nhà (`numeralStyle`) chưa dùng trong wheel | Known Gap | Biểu đồ tròn dùng số Ả Rập 1–12 theo mặc định; cài đặt tùy biến ký số sẽ được kết nối khi có UI preference. |
| **KG-M4-04** | Zoom/pan, pinch cử chỉ (spec §7.2) chưa có | Deferred — S4.8/S4.9 | M4 sử dụng cơ chế cuộn ngang an toàn (`min-w-[400px]` + scrollable focusable region). Tính năng pinch-zoom tương tác sẽ được phát triển ở S4.8/S4.9. |
| **KG-M4-05** | Bố cục hai cột `lg` sticky chưa có | Deferred — S4.9 | M4 giữ nguyên layout một cột dọc trong Shell; bố cục hai cột (wheel cố định bên trái, bảng bên phải) thuộc phạm vi Milestone S4.9. |
| **KG-M4-06** | `SkeletonChartWheel` chuyên dụng chưa có | Deferred | Tạm thời dùng `ChartViewerSkeleton` cấp trang trong thời gian tải dữ liệu. |
| **KG-M4-07** | Kiểm thử glyph/trợ năng thủ công đa nền tảng trên máy thật | RESOLVED (Đã đóng) — AC-Q4 | **ĐÃ HOÀN TẤT & ĐÓNG**: Báo cáo kiểm thử thực tế ngày 2026-10-16 bởi Phuc Hoang trên Windows 11 (NVDA 2024.3, Chrome 129, Edge 129) và iPhone 11 Pro Max (iOS 18.0 Safari VoiceOver) đạt 6/6 PASS. Glyph SVG hiển thị vector phẳng đơn sắc, không biến thành emoji; tương phản $\ge 4.5:1$; cuộn phím mũi tên 320px mượt mà; VoiceOver đọc thông tin trọn vẹn. Xem chi tiết Mục 4. |
| **KG-M4-08** | Wheel chưa vẽ hành tinh và các đường góc chiếu | Accepted (nêu ở `figcaption`) | Đúng lộ trình kỹ thuật: Hành tinh sẽ được thêm ở S4.5 và đường góc chiếu ở S4.6. `figcaption` thông tin minh bạch cho người dùng. |
| **KG-M4-09** | `aria-label` trên `<text>` nhãn góc trong `role="img"` không được đọc; `role="img"` cần chuyển sang `group` khi bổ sung tương tác | Handoff S4.5/S4.8 | `aria-label` trên `<text>` nhãn góc trong `svg role="img"` là presentational đối với AT. Hiện tại thông tin góc có ở `<desc>` và bảng. Khi các biểu tượng hành tinh và góc chiếu có thể hover/focus/click ở S4.5, thẻ gốc SVG sẽ chuyển sang `role="group"` theo quyết định `D-M4-5`, kích hoạt khả năng truy cập đầy đủ cho các nhãn con. |
| **KG-F4M1-12** | Cảnh báo Node 20 của GitHub Actions | Kế thừa | Cảnh báo môi trường CI kế thừa từ các milestone trước, không ảnh hưởng tới kết quả kiểm thử. |
