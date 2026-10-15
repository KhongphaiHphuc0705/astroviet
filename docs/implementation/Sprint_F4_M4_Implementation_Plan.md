# AstroViet — FE Sprint 4 M4 Implementation Plan
## Chart Wheel Foundation

**Vị trí đề xuất:** `docs/implementation/Sprint_F4_M4_Implementation_Plan.md` (blueprint tạm thời; xoá khi M4 đóng, lưu Evidence Matrix vào `docs/implementation/archive/sprint-f4/`).
**Phiên bản:** 1.1 — **`READY FOR IMPLEMENTATION`** (Mục 38; D-M4-2, D-M4-4, D-M4-5 đã được Owner phê duyệt).
**Căn cứ:** audit repo `dev` tại `efa624b` (2026-10-15), Frontend CI #257 Success; `Sprint_F4_Implementation_Plan.md` v1.1; `docs/frontend/{Frontend_UI_Specification,Design_System_Specification}.md`; `docs/architecture/Natal_Chart_Domain_Specification.md`; mã `frontend/src/features/chart/**`, `backend/src/modules/chart/**`.
**Quy ước nguồn:** `[repo]` đọc mã/tài liệu · `[C-run]` Claude chạy lệnh trong sandbox (`npm ci` theo lockfile, Node v22.22.2) · `[CI]` trang GitHub Actions công khai · `[owner]` owner cung cấp.
**Trạng thái:** `Verified` · `Partially verified` · `Unverified` · `Blocked` · `Deferred` (cùng nghĩa mục 30 của prompt).
**Giới hạn audit:** không chạy Backend và E2E; chưa có test M4 (chưa tồn tại). Ở lượt này `typecheck`, `lint`, `format:check` exit 0 trên `efa624b` [C-run]; số test baseline lấy từ lượt chạy trước (111 file đều passed trên `e653f61`, [C-run]) và CI #257 Success cho `efa624b` [CI]; **không** chạy lại toàn bộ vitest ở lượt này.

---

## 1. Executive Summary

M4 (= FE-S4.4) dựng **nền toán học và SVG** của Chart Wheel: hàm hình học thuần, `buildWheelGeometry`, ba lớp nền (vành cung hoàng đạo + vạch chia độ, vòng nhà + đỉnh nhà, các góc), xoay theo Ascendant, chế độ không có nhà, và bọc trong `figure`/`svg`. **Không** có hành tinh, aspect, tương tác, zoom/pan, store hay thay đổi Backend.

**Tiền đề S4.2 đủ:** `ChartViewModel` cung cấp đúng thứ cần thiết (Mục 7) — `flags.ascendantLongitude`, `flags.houseDataAvailable`, `HouseVM.cuspLongitude`, `AngleVM.longitude/shortLabel/ariaLabel`, nhãn/glyph cung qua `resolveSign` và `KNOWN_ZODIAC_SIGNS`. M1, M2, M3, M7, M11 đều có bằng chứng hoàn tất và test; không cần làm lại.

**Phát hiện quan trọng (đều có bằng chứng) — plan khác kỳ vọng ở các điểm sau:**

| # | Phát hiện | Hệ quả cho plan |
|---|---|---|
| 1 | **UI Spec §12.5 không định nghĩa hệ toạ độ, hướng góc 0°, tick, bán kính hay xoay theo ASC.** Spec chỉ mô tả cấu trúc (vòng ngoài 12 cung có glyph; vòng giữa 12 nhà; vòng trong hành tinh; tâm aspect), `role="img"`, SVG bắt buộc. Quy ước toạ độ/bán kính nằm ở **F4 plan §16–17** (`viewBox 0 0 600 600`, `θ = 180° + (λ − rotation)`, ngược chiều kim đồng hồ, vành cung `[260,225]`, tick `225–215`, nhà `[215,175]`). | Nguồn thẩm quyền cho toạ độ = F4 plan v1.1 §17 (spec im lặng); ghi rõ, không bịa thêm. Khoảng cách tick **không** được định nghĩa ở đâu ⇒ quyết định mở D-M4-2. |
| 2 | **"Mục 32" = F4 plan §32 "Testing Strategy"** (không phải mục của UI Spec). Yêu cầu hình học: `normalizeLongitude`, `toScreenAngle`/`polarToCartesian` (ASC bên trái, +90° đáy, đối xứng, vòng 360°), `sectorMidAngle` (vòng qua 0°); component: không vòng nhà khi thiếu dữ liệu; không visual regression ảnh (quyết định #18). | Ma trận test Mục 25–26 bám đúng danh sách này. |
| 3 | **Chưa tồn tại** `model/geometry.ts`, `model/aspectGeometry.ts`, `ui/ChartWheel/**`, `SkeletonChartWheel`. | Tất cả là file mới; `aspectGeometry.ts` **không** động tới (S4.6). |
| 4 | **Backend/Domain mâu thuẫn về Whole Sign:** Domain Spec §15.4 nói nhà 1 bắt đầu tại `floor(ASC/30)·30`, còn §16 và `house.calculator.ts` (dòng 30–32: `houseNumber === 1 ? ascendant : cusps[i]`) cho **cusp nhà 1 = kinh độ ASC thật**, các nhà 2–12 là cusp Swiss (đầu cung). Hệ quả: với Whole Sign nhà 1 và nhà 12 **không** rộng 30°. | Hình học phải vẽ **đúng theo `cuspLongitude` Backend trả**, đặt số nhà ở trung điểm *hai cusp liên tiếp* (không giả định 30°). Chưa có fixture CAPTURED Whole Sign ⇒ cần chụp thật (D-M4-12) hoặc dùng fixture DERIVED có nhãn. |
| 5 | **Vị trí glyph trong SVG là lần đầu glyph chiêm tinh được vẽ trong `<text>`** (font Display `Newsreader, Georgia` không có ký hiệu chuyên dụng; KG-M2-04 chưa được kiểm thật; kiểm thủ công trợ năng của M7 vẫn chưa có bằng chứng). | Rủi ro render glyph (R-9); bắt buộc kiểm thủ công đa nền tảng ở M4.6, không dùng ảnh chụp làm test. |
| 6 | **Quyết định a11y mâu thuẫn:** UI Spec §12.5 yêu cầu `role="img"` + `aria-label`; F4 plan quyết định #10 chọn `group` + nút hành tinh focusable (vì `role="img"` biến con thành presentational). | M4 không có phần tử focusable ⇒ dùng `figure` + `svg role="img"` (đúng spec); chuyển sang `group` được **ghi là việc bắt buộc của S4.5/S4.8** (D-M4-5). |
| 7 | **Không có token màu Element** (UI Spec §3.5 mô tả bảng màu Lửa/Đất/Khí/Nước nhưng `tokens.css` không có) và VM chưa có nguyên tố cung (KG-M2-02). | Vành cung dùng màu trung tính (`border-subtle/strong`, `text-primary/secondary`); không tô màu theo nguyên tố (D-M4-9). |
| 8 | **Vùng chạm/kích thước:** F4 plan §28: dưới `sm` wheel trong khung vuông **tối thiểu 400px, cuộn ngang** + nút zoom; UI Spec §7.2: chữ glyph không nhỏ hơn 10px. Zoom/pan nằm ngoài M4. | M4: khung `min-w-[400px]` + `overflow-x-auto` (vùng cuộn có thể focus); **không** nút zoom. |
| 9 | **`formatDegreeMinute` đã tồn tại (M2) và F4 plan §17 vẫn liệt kê nó trong `geometry.ts`** (mô tả "làm tròn", đã bị D-M2-2 thay bằng cắt xuống phút). | Không tạo lại; không ghi vào `geometry.ts`. |
| 10 | `ChartViewerShell` hiện có `placeholder` wheel (`data-testid="chart-visualization-placeholder"`) và **3 chỗ test** tham chiếu nó (`ChartViewerShell.test.tsx` S6, `detail/page.test.tsx` V1 và V2). | Gắn wheel vào Shell sẽ **thay** placeholder và buộc sửa 3 assertion — cần owner duyệt (D-M4-4). |

## 2. Objective and Rationale

**Mục tiêu:** hiển thị vành 12 cung với vạch chia độ, 12 đỉnh nhà (khi có) và các góc (ASC/MC/DSC/IC) trên cùng một hệ toạ độ SVG, xoay theo Ascendant, hoàn toàn từ dữ liệu Backend qua `ChartViewModel`.
**Lý do:** S4.5 (hành tinh), S4.6 (aspect) và S4.8 (tương tác) đều dựa trên cùng hệ toạ độ và hàm chuyển đổi; sai ở đây sẽ nhân lên ở các milestone sau. Hình học thuần giúp kiểm thử số học mà không cần render.

## 3. Scope

1. Hàm thuần `normalizeLongitude`, `toScreenAngle`, `polarToCartesian`, `arcPath`, `sectorMidAngle` + hằng bố cục (`model/geometry.ts`).
2. `buildWheelGeometry(vm)` (`model/wheelGeometry.ts`).
3. Ba lớp SVG: **vành cung** (12 ô cung + đường biên + glyph), **vạch chia độ**, **vòng nhà** (đỉnh + số nhà) và **các góc** (đường + nhãn `ASC/MC/DSC/IC`).
4. Xoay theo ASC (một lần, ở hình học); không có nhà ⇒ không vòng nhà.
5. `figure` + `svg` (`viewBox` cố định, tiêu đề/mô tả trợ năng), token màu, kích thước responsive.
6. Gắn vào `ChartViewerShell` (cần duyệt D-M4-4).
7. Test số học + test component + `vitest-axe`; kiểm thủ công glyph/hiển thị.

## 4. Out of Scope

Hành tinh, nhãn hành tinh, `℞`, `labelLayout.ts` (S4.5) · đường/hình học aspect và **mọi thay đổi `aspectGeometry.ts`** (S4.6; file chưa tồn tại) · hover/chọn/focus hành tinh, đồng bộ bảng↔wheel, tooltip, live region, `selection` (S4.8) · zoom/pan, nút zoom, pinch (S4.8/S4.9) · `SkeletonChartWheel` (không bắt buộc cho nền; loading hiện do `ChartViewerSkeleton` của M3) · store/Context/Zustand · sửa Backend/hợp đồng · danh sách chart, bảng, diễn giải · bố cục hai cột `lg` sticky (S4.9) · tô màu theo nguyên tố · refactor không liên quan.

## 5. Current Repository State

| Hạng mục | Thực tế | Trạng thái |
|---|---|---|
| HEAD | `efa624b` "[refactor] resolve defects & m7 closure"; Frontend CI #257 Success (4m 24s; job `build` gồm format, lint, typecheck, `test:coverage`, build, E2E) | Verified [CI] |
| Cổng chất lượng local | `typecheck` (`tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit`), `lint`, `format:check` exit 0 | Verified [C-run] |
| Scripts | `lint`, `typecheck`, `format:check`, `test` (`vitest run --passWithNoTests`), `test:coverage`, `build`, `test:e2e` | Verified `package.json` |
| Test | vitest + jsdom + Testing Library + `vitest-axe`; `matchMedia` mock tĩnh trong `src/test/setup.ts`, helper `installMatchMedia` ở `src/test/matchMedia.ts` | Verified |
| `features/chart/model/` | `chartViewModel.ts`, `labels.ts`, `format.ts` (+ test). **Không có** `geometry.ts`, `aspectGeometry.ts`, `labelLayout.ts`, `selection.ts` | Verified |
| `features/chart/ui/` | `AspectTable`, `CalculateChartDialog`, `ChartBadges`, `ChartList`, `ChartViewerShell`, `ChartViewerSkeleton`, `HouseTable`, `PlanetTable`, `tableStyles.ts`. **Không có** `ChartWheel` | Verified |
| `ChartViewerShell` | 87 dòng; metadata → `Alert partialData` → placeholder wheel → 3 bảng; đọc `densityMode` và `useMediaQuery` | Verified |
| TypeScript | target `es2023`; `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`; **không** `resolveJsonModule` | Verified |
| Tailwind | `^3.4.19`; screens `xs 0, sm 640, md 768, lg 1024, xl 1280`; màu qua CSS variables (`stroke-*`/`fill-*` dùng được trên SVG) | Verified |
| Dependency hình học/SVG | không có (`d3`, `visx`, v.v.) | Verified — **không thêm** |

## 6. Milestone Progress and Dependencies

| Milestone | Current Status | Dependency on M4 | Required Evidence | Action |
|---|---|---|---|---|
| S4.2 (M2) | **Hoàn tất** — `toChartViewModel`, nhãn/glyph, `formatDegreeMinute`; coverage model 100% | **Bắt buộc** (tiền đề) | `model/chartViewModel.ts`, test 60+25+15; matrix M2 | Dùng nguyên; không sửa |
| M1 | Hoàn tất | Gián tiếp (`ChartResponse`, `KNOWN_ZODIAC_SIGNS`, fixture CAPTURED) | matrix M1 | Dùng fixture |
| M3 | Hoàn tất | Host: `ChartViewerShell`, `ChartDetailPage` | matrix M3; CI | Chỉ sửa Shell + 3 assertion nếu D-M4-4 duyệt |
| M7 | Hoàn tất (mã + test + CI); **kiểm thủ công trợ năng/glyph chưa có bằng chứng** | Không phụ thuộc; chia sẻ `useMediaQuery`, `tableStyles`, Shell | matrix M7; CI #257 | Giữ nguyên; xem R-9 |
| M11 | Hoàn tất | Không | matrix M11 | Giữ nguyên |
| **M4** | Chưa bắt đầu | — | — | Plan này |
| S4.5/S4.6/S4.8 | Chưa bắt đầu | Phụ thuộc M4 (hệ toạ độ, `buildWheelGeometry`, vai trò a11y) | — | Không làm trong M4 |

## 7. S4.2 Contract Audit

Nguồn: `frontend/src/features/chart/model/chartViewModel.ts`, `labels.ts`; fixture `features/chart/api/mocks/fixtures.ts` (`chartFull`, `chartNoHouses`).

| Nhu cầu của wheel | Trường VM / API | Đảm bảo | Trạng thái |
|---|---|---|---|
| Kinh độ ASC để xoay | `flags.ascendantLongitude: number \| null` = `AngleVM.longitude` của góc `Ascendant` hợp lệ (số hữu hạn `[0,360)`) | VM bỏ góc hỏng; `null` khi không có | Verified |
| Có nhà? | `flags.houseDataAvailable` (cờ **hiệu lực**: Backend `isHouseDataAvailable` **và** đủ 12 nhà hợp lệ, số 1–12 duy nhất); `houses = []` khi `false` | không suy từ độ dài mảng | Verified |
| Đỉnh nhà | `HouseVM{ number 1–12, cuspLongitude [0,360), sign: GlyphLabel, degreeLabel }` sắp 1→12 | VM bỏ nhà hỏng; cờ mâu thuẫn ⇒ `houses=[]` | Verified |
| Góc | `AngleVM{ key, known, shortLabel, labelVi, ariaLabel, longitude [0,360), sign, degreeLabel }` sắp `Ascendant, Midheaven, Descendant, ImumCoeli`; `flags.hasAngles` | VM bỏ góc hỏng; góc lạ có `known:false` | Verified |
| Cung (12) | `KNOWN_ZODIAC_SIGNS` (Aries→Pisces, thứ tự ghim bằng test) + `resolveSign(key)` ⇒ `{key, labelVi, glyph (kèm U+FE0E), known}` | glyph/nhãn từ nguồn duy nhất | Verified |
| Hệ nhà | `meta.houseSystem.labelVi` | | Verified |
| Cảnh báo | `warnings[]` (`HOUSE_SYSTEM_NOT_CONVERGING`) | dùng ở notice, không ở wheel | Verified |

**Không có trong VM (và không cần):** `HouseVM.sign`/`degreeLabel`/`AngleVM.degreeLabel` dùng cho bảng; wheel chỉ cần kinh độ + nhãn ngắn. Hành tinh (`PlanetVM`) và aspect (`AspectVM`) **không** được `buildWheelGeometry` đọc ở M4.

**Phân biệt DTO / presentation:** `buildWheelGeometry` nhận **`ChartViewModel`** (không nhận `ChartResponse`). Mọi giá trị đầu vào đã được M2 chuẩn hoá/validate; hình học chỉ phòng thủ các bất biến mà VM cam kết (Mục 23).

**Kết luận:** S4.2 **đủ** làm tiền đề M4; không cần sửa M2.

## 8. UI Spec §12.5 Audit

Nguồn: `docs/frontend/Frontend_UI_Specification.md` §12.5 (dòng ~840–852), §1.3, §3.5, §7.2.

| Nội dung spec | Spec nói | M4 xử lý |
|---|---|---|
| Cấu trúc | vòng ngoài = 12 cung (glyph, mục 5.1); vòng giữa = 12 nhà (số La Mã nhỏ **hoặc** số thường tuỳ Locale); vòng trong = hành tinh; tâm = aspect | M4 làm vòng ngoài + vòng giữa (+ các góc); số **thường** (F4 plan §19; Locale `numeralStyle` không tồn tại) |
| Render | SVG (không Canvas) | SVG |
| a11y | `role="img"` + `aria-label` tóm tắt; mọi dữ liệu có song song ở bảng | `svg role="img"` (D-M4-5); bảng M7 là nguồn đầy đủ |
| States | `default`, `hover-planet`, `selected-planet` | chỉ `default` (hover/selected = S4.8) |
| Loading/Error | `SkeletonChartWheel`; lỗi tính ⇒ `EmptyState`, không vẽ wheel méo | lỗi do M3 xử lý (trang chi tiết); M4 không thêm |
| Responsive | dưới `md`: pinch-to-zoom trong khung vuông; chữ glyph ≥ 10px | F4 plan: khung ≥ 400px, cuộn ngang; zoom hoãn |
| **Không có trong spec** | hệ toạ độ, hướng 0°, hướng tăng góc, xoay theo ASC, bán kính, khoảng tick, vị trí số nhà/nhãn góc, màu từng lớp | lấy từ **F4 plan §16–17/19–20** hoặc ghi **quyết định mở** (Mục 34) |
| Props `chartData`, `size`, `houseSystem`, `showAspectLines`, `interactive`, `secondaryChartData` | | M4 chỉ cần `geometry` + nhãn; không `size` px (dùng `viewBox`), không `interactive`, không overlay |

Lưu ý: "The Ring" (§1.3, tick mỗi 5°) là **chi tiết thương hiệu**, không phải đặc tả tick của wheel. Dùng làm cơ sở **gợi ý** cho D-M4-2, không phải ràng buộc.

## 9. Design System Audit

| Hạng mục | Thực tế | Dùng ở M4 |
|---|---|---|
| Màu semantic (CSS var → Tailwind) | `primary`, `secondary`, `muted`, `subtle` (viền nhạt), `strong` (viền đậm), `surface`, `surface-raised`, `accent-primary` (brass), `accent-secondary` (indigo), `focus`; tự đổi theo dark mode | Đủ cho mọi lớp nền |
| Tailwind cho SVG | v3.4 cung cấp `stroke-{màu}`, `fill-{màu}`, `stroke-{n}` trên màu theme | `stroke-subtle`, `stroke-strong`, `fill-primary`… |
| Element colors (§3.5) | mô tả trong spec, **không có** token trong `tokens.css` | **Không dùng** (D-M4-9) |
| Phông | `font-display` (Newsreader→Georgia→serif), `font-data` (IBM Plex Mono) | glyph dùng `font-display` như badge M7; nhãn ASC/số nhà dùng `font-data` |
| Glyph | Unicode thuần từ `labels.ts` (12 cung đã có `U+FE0E`); **không** icon/font ký hiệu | dùng `GlyphLabel.glyph`, không bảng ánh xạ mới |
| Quy tắc glyph (§ UI 4) | glyph mặc định `color-text-primary`, chỉ đổi màu trong `ElementChart`/`SignBadge` | `fill-primary` |
| Focus | `color-focus-ring` | dùng cho vùng cuộn có thể focus |
| Kích thước chữ | glyph ≥ 10px hiển thị (spec §7.2) | chữ SVG ≥ 16 đơn vị trong `viewBox 600` với khung ≥ 400px (⇒ ≥ 10,7px) |
| Màu không là kênh duy nhất | WCAG 1.4.1 | góc phân biệt bằng **độ dày nét + nhãn chữ**, không chỉ màu |

## 10. Existing Chart Wheel Architecture

**Chưa có wheel.** Điểm tích hợp thực tế là `ChartViewerShell` (không có `ChartViewer` — container selection thuộc S4.8). F4 plan §16: `ChartWheel` là component "controlled" gồm các lớp `<g>` nhỏ dưới `ChartWheel/`, nhận dữ liệu dựng sẵn từ `buildWheelGeometry`; **thứ tự vẽ (dưới lên):** nền → vành cung → vạch chia độ → vòng nhà → *aspect* → *đường nối nhãn* → *hành tinh* → góc/nhãn. M4 giữ nguyên thứ tự này và chừa chỗ (không tạo layer rỗng) cho các lớp S4.5/S4.6 (Mục 19).

---

## 11. Geometry Architecture

```text
Backend ChartResponse
   └─ useChartQuery → toChartViewModel(dto)        (M1, M2)
        └─ ChartViewModel (vm)
             └─ buildWheelGeometry(vm)             model/wheelGeometry.ts  (thuần)
                  ├─ dùng primitives                model/geometry.ts       (thuần, không import VM)
                  └─ dùng nhãn cung                  model/labels.ts         (thuần)
                       └─ WheelGeometry (dữ liệu toạ độ/đường dẫn nhỏ)
                            └─ <ChartWheel geometry …>  ui/ChartWheel/**    (SVG, không tính toán)
                                 ├─ ZodiacLayer · TickLayer · HouseLayer · AngleLayer
                                 └─ bọc <figure><svg role="img">…
```

**Ranh giới:** `geometry.ts` và `wheelGeometry.ts` **không** import React, DOM, `window`, API client hay `shared/*` runtime; chỉ import kiểu/hàm thuần của `model/` và `api/types` (kiểu + `KNOWN_*`). `ui/ChartWheel/**` **không** gọi `Math.cos/sin` hay tự tính toạ độ (chỉ in số từ `WheelGeometry`) và không tính dữ liệu chiêm tinh. Khớp quy tắc F4 plan §15 ("được phép: hình học trình bày; không được: tính lại vị trí, đỉnh nhà, aspect") và Architecture Spec §2.2.

**Không thêm** domain layer, store hay framework hình học tổng quát. Hai file `model/`:

| File | Vì sao tách |
|---|---|
| `geometry.ts` — primitives thuần số học | S4.5 (`labelLayout.ts`) và S4.6 (`aspectGeometry.ts`) cần import primitives **mà không** kéo theo `ChartViewModel`/`labels` |
| `wheelGeometry.ts` — `buildWheelGeometry` + kiểu `WheelGeometry` | phụ thuộc VM + nhãn; đổi theo nhu cầu lớp nền; F4 plan chỉ liệt kê `geometry.ts` ⇒ **lệch có chủ đích** (D-M4-8) |

## 12. Coordinate System and Angle Convention

**Quy ước (F4 plan §17; spec im lặng — D-M4-1):**

| Mục | Quy ước |
|---|---|
| Hệ toạ độ SVG | gốc trên-trái, `x` sang phải, `y` hướng **xuống** |
| `viewBox` | `0 0 600 600`, tâm `(300, 300)` (`WHEEL_VIEWBOX_SIZE = 600`, `WHEEL_CENTER = 300`) |
| Kinh độ `λ` | độ **tuyệt đối hoàng đạo**, `[0,360)`, tăng theo thứ tự cung (Aries 0° = 0). **Không** dùng độ-trong-cung |
| Góc màn hình `θ` | độ, đo **ngược chiều kim đồng hồ** từ trục `+x` (quy ước toán học); `θ ∈ [0,360)` |
| Chuyển kinh độ → góc | `θ = normalize(180° + (λ − rotation))` |
| Chuyển cực → Descartes | `x = cx + r·cosθ`, `y = cy − r·sinθ` (đảo dấu `sin` vì `y` hướng xuống) |
| Hướng tăng | `λ` tăng ⇒ `θ` tăng ⇒ **ngược chiều kim đồng hồ trên màn hình** |
| Xoay | `rotation = flags.ascendantLongitude` nếu có, ngược lại `0` |

**Kiểm chứng đại số (đã tự kiểm):**

| λ | θ | Điểm trên đường tròn bán kính r | Ý nghĩa |
|---|---|---|---|
| `rotation` | 180° | `(cx − r, cy)` | **bên trái** (ASC) |
| `rotation + 90°` | 270° | `(cx, cy + r)` | **đáy** |
| `rotation + 180°` | 0° (≡ 360°) | `(cx + r, cy)` | bên phải (DSC) |
| `rotation + 270°` | 90° | `(cx, cy − r)` | **đỉnh** |

Khi `rotation = 0` (không có ASC): Aries 0° ở bên trái (`θ = 180°`), các cung đi ngược chiều kim đồng hồ — đúng F4 plan. Đây là bố cục bánh xe cổ điển (ASC trái, MC gần đỉnh, nhà 1 ngay dưới đường chân trời bên trái).

**Quy ước góc:** mọi hàm nhận/trả **độ** (không radian); chỉ `polarToCartesian` đổi sang radian nội bộ. Số học sai số dấu phẩy động xử lý bằng dung sai trong test và làm tròn đầu ra 3 chữ số (D-M4-11).

## 13. Ascendant Rotation Strategy

- **Một nơi duy nhất áp dụng xoay:** tham số `rotation` của `toScreenAngle(λ, rotation)`. `buildWheelGeometry` tính `rotation` **một lần** và truyền cùng giá trị cho mọi lớp (cung, tick, nhà, góc).
- **Không** dùng `<g transform="rotate(…)">` quanh cả wheel: sẽ xoay cả glyph/chữ (không còn thẳng đứng) và dễ bị áp dụng hai lần. Mọi vị trí tính sẵn trong hệ toạ độ đã xoay.
- **Marker ASC** dùng đúng công thức chung: `θ_ASC = normalize(180° + (λ_ASC − rotation)) = 180°` (vì `rotation = λ_ASC`) — **không** có bước xoay thêm riêng cho ASC. Test chống xoay đôi: `θ(ASC) = 180°` và `θ(cusp1) − 180° = cusp1 − ASC` (bằng 0 ở Placidus).
- **Không suy ASC từ cusp nhà 1** khi VM không có góc `Ascendant` (đó là suy ra dữ liệu chiêm tinh): `rotation = 0`.
- **Whole Sign:** theo Backend `cusp1 = ASC` (Domain §16, `house.calculator.ts` 30–32) còn cusp 2–12 là đầu cung ⇒ spoke nhà 1 ở `θ = 180°`, nhưng các spoke khác **không** cách đều 30°; hình học vẽ đúng theo giá trị trả về (Phát hiện 4).
- **Sign vs longitude:** ô cung và biên cung xác định bằng `λ = 30·k` (hình học tĩnh của hoàng đạo), **không** tính từ `HouseVM.sign` hay `AngleVM.sign`; nhãn cung lấy từ `KNOWN_ZODIAC_SIGNS[k]`.

---

## 14. Pure Geometry Functions

Tất cả ở `frontend/src/features/chart/model/geometry.ts`; không import React/DOM; xuất hằng bố cục (xem cuối mục).

| Hàm | Trách nhiệm | Đầu vào → đầu ra | Quy ước / giả định | Biên | Dữ liệu sai | Chiến lược test |
|---|---|---|---|---|---|---|
| `normalizeLongitude(deg)` | đưa góc về `[0,360)` | `number → number` | `((x % 360) + 360) % 360` | `0→0`, `360→0`, `-0.0001→359.9999`, `720.5→0.5`, `359.999…` giữ nguyên | **ném `RangeError`** nếu không hữu hạn (`NaN`, `±Infinity`) — lỗi lập trình, VM đảm bảo hữu hạn | bảng giá trị, `toBeCloseTo`, không bao giờ trả `360` |
| `toScreenAngle(lambda, rotation)` | `θ = normalize(180 + (λ − rotation))` | `(number, number) → number` | `rotation` do caller cấp một lần | `λ=rotation→180`; `+90→270`; `+180→0`; `+270→90`; vòng `λ=0, rotation=350→190` | chuyển tiếp `RangeError` | 4 hướng cardinal + wrap + dung sai 1e-9 |
| `polarToCartesian(cx, cy, r, theta)` | điểm trên đường tròn | `→ { x, y }` | `x = cx + r·cos`, `y = cy − r·sin` (độ→rad nội bộ) | `θ=0/90/180/270` ra đúng 4 điểm cardinal; `r=0 → (cx,cy)` | `r < 0` hoặc không hữu hạn ⇒ `RangeError` | cardinal, đối xứng (`θ` và `θ+180` đối xứng qua tâm), `toBeCloseTo(…, 9)` |
| `arcPath(cx, cy, rOuter, rInner, startAngle, spanDeg)` | đường dẫn vành khuyên (ô cung/ô nhà) | `→ string` | từ `startAngle` đi **ngược chiều kim đồng hồ** `spanDeg ∈ (0,360)`; `large-arc = spanDeg > 180`; cung ngoài `sweep=0`, cung trong `sweep=1` | `span=30` (cung), `span` nhỏ (nhà hẹp), span `>180` | `rOuter ≤ rInner`, `span ∉ (0,360)` ⇒ `RangeError` | parse `d`, so điểm đầu/cuối với `polarToCartesian`, kiểm cờ sweep/large-arc |
| `sectorMidAngle(lambdaStart, lambdaEnd)` | trung điểm đi từ `start` tới `end` theo chiều tăng | `→ number` (kinh độ) | `span = normalize(end − start)`; `mid = normalize(start + span/2)` | vòng qua 0°: `350→20 = 5°`; `0→30 = 15°`; `span=0` ⇒ `start` | không hữu hạn ⇒ `RangeError` | wrap 0°/360°, nhà hẹp, nhà rộng |
| `roundCoord(n)` *(nội bộ)* | làm tròn 3 chữ số, chuẩn hoá `-0` | `number → number` | `Math.round(n·1000)/1000 + 0` | | | dùng gián tiếp |

**Hằng bố cục (xuất, một nơi):** `WHEEL_VIEWBOX_SIZE=600`, `WHEEL_CENTER=300`, `WHEEL_RADII = { signOuter: 260, signInner: 225, tickOuter: 225, tickInner: 215, houseOuter: 215, houseInner: 175, angleLabel: 282 }` (F4 plan §17; "chốt khi dựng, đổi chỉ ảnh hưởng một hằng số"; bán kính hành tinh/aspect `~150/110` **không** khai báo ở M4).

**Tái dùng:** không có tiện ích hình học nào đã tồn tại (grep `*geometry*`, `*wheel*` = rỗng) ⇒ tạo mới. `formatDegreeMinute` (`model/format.ts`) đã có — **không** nhân bản.

## 15. `buildWheelGeometry` Contract

`frontend/src/features/chart/model/wheelGeometry.ts`

```ts
export function buildWheelGeometry(vm: ChartViewModel): WheelGeometry;

export interface WheelGeometry {
  rotation: number;                       // kinh độ dùng làm "trái": ASC hoặc 0
  hasHouses: boolean;                     // = vm.flags.houseDataAvailable
  signs: WheelSignCell[];                 // luôn 12, theo KNOWN_ZODIAC_SIGNS
  ticks: WheelTick[];                     // luôn 72 (mỗi 5°), xem D-M4-2
  houses: WheelHouseSpoke[] | null;       // null khi !hasHouses; ngược lại 12
  angles: WheelAngleMarker[];             // 0–4, theo thứ tự VM, chỉ góc đã biết
}
export interface WheelSignCell {
  key: string; labelVi: string; glyph: string | null;     // từ resolveSign
  startLongitude: number;                                  // 30·k
  path: string;                                            // arcPath vành cung
  boundary: { x1: number; y1: number; x2: number; y2: number }; // biên tại startLongitude
  glyphPoint: { x: number; y: number };                    // giữa vành, tại λ = 30k + 15
}
export interface WheelTick { longitude: number; kind: "major" | "minor"; x1: number; y1: number; x2: number; y2: number; }
export interface WheelHouseSpoke {
  number: number;
  cusp: { x1: number; y1: number; x2: number; y2: number };   // từ houseInner tới signInner? (xem Mục 17)
  labelPoint: { x: number; y: number };                       // trung điểm hai cusp liên tiếp
}
export interface WheelAngleMarker {
  key: "Ascendant" | "Midheaven" | "Descendant" | "ImumCoeli";
  shortLabel: string; ariaLabel: string;
  line: { x1: number; y1: number; x2: number; y2: number };
  labelPoint: { x: number; y: number };
}
```

| Câu hỏi | Quyết định |
|---|---|
| Đầu vào | **`ChartViewModel`** (không DTO, không cấu hình tuỳ ý ở M4: bán kính là hằng) |
| Dữ liệu đọc | `flags.{ascendantLongitude, houseDataAvailable}`, `houses[].{number, cuspLongitude}`, `angles[].{key, known, shortLabel, ariaLabel, longitude}`; `KNOWN_ZODIAC_SIGNS` + `resolveSign` |
| Dữ liệu **không** đọc | `planets`, `aspects`, `warnings`, `issues`, `interpretations`, `meta`, `degreeLabel` |
| Có nhà | `hasHouses=true`, `houses` đủ 12 theo `number` tăng; vị trí nhãn = `sectorMidAngle(cusp_i, cusp_{i+1})` (nhà 12 kết thúc ở cusp 1) |
| Không có nhà | `hasHouses=false`, `houses=null`; **không** sinh đỉnh/số nhà/vòng nhà mặc định |
| Góc | chỉ vẽ góc có `known` thuộc 4 giá trị đã hỗ trợ; góc lạ **bỏ qua** (không lỗi); 0–4 marker; **không** suy góc thiếu (kể cả `Descendant`/`ImumCoeli` từ ASC/MC) |
| Xoay | `rotation = flags.ascendantLongitude ?? 0` (một lần) |
| Tất định | thuần; cùng VM ⇒ `toStrictEqual`; không đọc thời gian/ngẫu nhiên; không đột biến `vm` |
| Làm tròn | mọi toạ độ qua `roundCoord` (3 chữ số) |
| Không nhân bản VM | chỉ giữ số toạ độ, khoá, nhãn ngắn cần vẽ |
| Hợp đồng sai | `hasHouses` nhưng `houses.length !== 12` hoặc `number` không phải hoán vị 1–12 ⇒ **ném `WheelGeometryError`** (`extends Error`, `code="INVALID_WHEEL_INPUT"`, `path`); VM đã loại trường hợp này (cờ hiệu lực) nên **không với tới** trong luồng thật |
| Tính mở rộng | S4.5/S4.6 thêm hàm dựng riêng (`buildPlanetLayout`, `buildAspectLines`) hoặc mở rộng `WheelGeometry`; M4 **không** thêm trường `planets`/`aspects` |

## 16. Zodiac Ring and Degree Divisions

**Vành cung (`ZodiacLayer`):** 12 ô, ô `k` bao `λ ∈ [30k, 30(k+1))`, `k = 0..11` theo `KNOWN_ZODIAC_SIGNS`; vành bán kính `[260, 225]`.
- **Biên cung:** đường xuyên tâm tại `λ = 30k` từ `225` đến `260` (12 đường, không trùng, không thiếu).
- **Glyph cung:** `<text>` tại `λ = 30k + 15`, bán kính giữa vành `242.5`, cỡ chữ **18** (≥ 16), `text-anchor="middle"`, `dominant-baseline="central"`, `fill-primary`, `font-display`, `aria-hidden` (đã mô tả ở `<title>`/bảng). Glyph từ `resolveSign(key).glyph` (có `U+FE0E`); `glyph=null` ⇒ không `<text>`.
- Không tô theo nguyên tố; hai ô liền kề phân biệt bằng **đường biên**, không bằng màu.

**Vạch chia độ (`TickLayer`):** 72 vạch tại `λ = 5·j` (`j = 0..71`) từ bán kính `225` vào `215`:
- **major** tại bội của 30° (12 vạch, trùng biên cung): `225 → 211`, `stroke-strong`, nét 1.5;
- **minor** còn lại (60 vạch): `225 → 219`, `stroke-subtle`, nét 1.
- **Khoảng 5°: đề xuất, cần duyệt (D-M4-2)** vì **không tài liệu nào quy định**: gợi ý từ "The Ring" (UI §1.3, tick mỗi 5°) và giữ số nút DOM nhỏ (72 thay vì 360). Phương án thay thế: 1° (360 nút, thêm mức trung gian mỗi 5°/10°) — chi phí hiển thị cao hơn, dùng khi S4.5 cần đọc độ chính xác bằng vạch.
- **Xác minh:** đủ 12 ô; thứ tự `Aries→Pisces` theo `θ` tăng ngược chiều kim đồng hồ; biên tại đúng `θ = toScreenAngle(30k, rotation)`; 72 vạch, khoảng cách góc = 5°, không trùng; xoay đúng (Mục 25).

## 17. House Ring and Cusps

**Chỉ vẽ khi `hasHouses`** (`HouseLayer`): vòng nhà bán kính `[215, 175]` (hai đường tròn mảnh `stroke-subtle`) + 12 đỉnh nhà + 12 số nhà.
- **Đỉnh nhà:** đoạn xuyên tâm tại `λ = cuspLongitude` từ `175` đến `225` (vượt vòng nhà ra tới vành cung để đọc được vị trí; nét `stroke-subtle`, 1) — **không** chuẩn hoá hay sắp xếp lại: theo `HouseVM.number` tăng.
- **Số nhà:** `<text>` số thường tại bán kính `195`, góc `sectorMidAngle(cusp_i, cusp_{i+1})`, cỡ 16, `font-data`, `fill-secondary`; `aria-hidden`.
- **Nhà hẹp/rộng:** trung điểm tính theo khoảng thật giữa hai cusp (Placidus không đều; Whole Sign của Backend: nhà 1 và 12 hẹp — Phát hiện 4). Không giả định 30°.
- **Dữ liệu hợp lệ đầy đủ:** 12 đỉnh + 12 số. **Không có nhà:** Mục 22.
- **Cusp nhà 1 trùng ASC (Placidus):** đỉnh nhà 1 nằm ngay dưới marker ASC; marker ASC vẽ **sau** (trên) và đậm hơn (Mục 18).

## 18. Angle Markers

**M4 vẽ:** các góc **có trong `vm.angles` và `known`** thuộc `{Ascendant, Midheaven, Descendant, ImumCoeli}` (`AngleLayer`). Đầy đủ 4 hoặc rỗng theo hợp đồng; code **chịu được** 0–4 (không giả định đủ 4).

- **Vị trí:** `θ = toScreenAngle(angle.longitude, rotation)` (cùng công thức/giá trị `rotation` với mọi lớp). ASC ⇒ `θ = 180°` theo cấu trúc; **không** xoay thêm.
- **Hình dạng:** đoạn xuyên tâm từ `175` đến `260` (xuyên vòng nhà và vành cung) **nét đậm hơn** đỉnh nhà (`stroke-width 2.5`, `stroke-strong`) — phân biệt bằng độ dày + nhãn, không bằng màu.
- **Nhãn:** `<text>` `shortLabel` (`ASC`, `MC`, `DSC`, `IC` từ `AngleVM.shortLabel`) tại bán kính `282` (ngoài vành cung, trong `viewBox`), cỡ 16, `font-data`, `fill-primary`; `aria-label` = `AngleVM.ariaLabel` ("Cung Mọc (Ascendant)"…). Nhãn **là chữ trong SVG**; chữ đầy đủ cũng có ở bảng góc (M7).
- **Trùng/gần nhau:** ASC≈cusp 1 (đã nêu); MC/IC gần một đỉnh nhà: nhãn góc ở **ngoài** vành, số nhà ở **trong** vòng nhà ⇒ không chồng; ASC với DSC/MC/IC cách ≥ 90° nên không chồng nhãn. Không có xử lý chồng nhãn phức tạp (thuộc S4.5 với hành tinh).
- **Góc thiếu/lạ:** bỏ qua, không lỗi, không suy ra. Góc lạ (`known:false`) không có marker.
- **Quan hệ:** góc vẽ trên cùng hệ toạ độ và cùng `rotation` với vành cung và nhà.

## 19. SVG Layer Architecture

```text
ChartWheel (figure + svg)
 └─ <g data-layer="zodiac-ring">   ZodiacLayer   vành 12 ô + biên + glyph        (decorative, aria-hidden)
 └─ <g data-layer="degree-ticks">  TickLayer     72 vạch                          (decorative, aria-hidden)
 └─ <g data-layer="house-ring">    HouseLayer    vòng + 12 đỉnh + 12 số           (chỉ khi hasHouses; aria-hidden)
 └─ <g data-layer="angle-markers"> AngleLayer    0–4 đường + nhãn                 (trên cùng; nhãn có aria-label)
 // chừa cho S4.6: <g data-layer="aspect-lines">, S4.5: <g data-layer="planets">  — KHÔNG tạo ở M4
```

| Lớp | Sở hữu phần tử | Props | Ghi chú |
|---|---|---|---|
| `ZodiacLayer` | 12 `path` ô, 12 biên, 12 glyph, 2 vòng ngoài | `signs`, `center`, `radii` | không tính toạ độ |
| `TickLayer` | 72 `line` | `ticks` | `major`/`minor` qua lớp nét |
| `HouseLayer` | 2 vòng, 12 `line`, 12 `text` | `houses: WheelHouseSpoke[]` | **không render** khi `houses` là `null` (cha quyết định) |
| `AngleLayer` | ≤4 `line` + ≤4 `text` | `angles` | vẽ sau nhà |

- **Căn chỉnh:** mọi lớp nhận số từ **cùng một `WheelGeometry`**; không lớp nào gọi hàm hình học. Test căn chỉnh đo lại góc từ toạ độ đầu ra (Mục 25).
- **Không tạo component cho từng primitive** (vòng, vạch, glyph là phần tử SVG trong lớp). Bốn lớp có nhóm trách nhiệm và test riêng.
- **Mở rộng sau:** S4.5/S4.6 thêm `PlanetLayer`/`AspectLayer` giữa/sau các lớp trên và chèn vào `ChartWheel` — chỉ thêm, không đổi các lớp M4. Thứ tự vẽ: vành → tick → nhà → *(aspect)* → *(hành tinh)* → góc.
- **Thuộc tính kiểm thử:** `data-layer`, `data-sign`, `data-house`, `data-angle` (khoá miền), chấp nhận làm hợp đồng test (không dựa thứ tự node).

## 20. `figure` / SVG Wrapper

`frontend/src/features/chart/ui/ChartWheel/ChartWheel.tsx`:

```tsx
<figure data-testid="chart-wheel" className="…">
  <div role="region" aria-label="Biểu đồ tròn, có thể cuộn ngang trên màn hình hẹp" tabIndex={0} className="overflow-x-auto …">
    <svg viewBox="0 0 600 600" role="img" aria-labelledby={titleId} aria-describedby={descId} className="mx-auto h-auto w-full min-w-[400px] max-w-[640px]">
      <title id={titleId}>Biểu đồ Natal</title>
      <desc id={descId}>{tóm tắt}</desc>
      …các lớp…
    </svg>
  </div>
  <figcaption className="…">Hiển thị vòng 12 cung, nhà và các góc. Vị trí hành tinh xem ở các bảng bên dưới.</figcaption>
</figure>
```

| Mục | Quyết định |
|---|---|
| `figure` | bọc ngữ nghĩa + `figcaption` (nêu rõ phạm vi hiện tại; honest về việc chưa có hành tinh) |
| SVG root | `role="img"` (spec §12.5; D-M4-5), `<title>` + `<desc>` liên kết bằng `aria-labelledby/describedby` (`useId`) |
| Tóm tắt (`desc`) | từ VM: hệ nhà (`meta.houseSystem.labelVi`), "có/không có nhà", và góc ASC nếu có ("Cung Mọc tại {sign.labelVi} {degreeLabel}") — **không** nêu hành tinh (chưa vẽ); hàm nội bộ `buildWheelDescription(vm)` thuần, có test |
| `viewBox` | cố định `0 0 600 600`; **không** `width/height` pixel; co giãn bằng CSS |
| Tỉ lệ | vuông (`viewBox`); `h-auto w-full` |
| Cỡ | `max-w-[640px]` căn giữa; `min-w-[400px]` bảo đảm glyph ≥ 10px (F4 plan §28) |
| Tràn | vùng cuộn ngang **chỉ khi** khung hẹp hơn 400px; vùng có `tabIndex=0` + `role="region"` + nhãn để bàn phím cuộn được (axe `scrollable-region-focusable`) |
| Tương lai | lớp mới thêm vào cùng `svg` và `viewBox`; khi có phần tử focusable, đổi `role="img"` → `group` (D-M4-5) |
| Không làm | zoom, pan, pointer events, `onClick`, `tabIndex` trên phần tử SVG |

## 21. Design System Integration

| Phần tử | Token/lớp (Tailwind → CSS var) | Ghi chú |
|---|---|---|
| Nền wheel | không tô (kế thừa `bg-surface` của Card/trang); có thể bọc `Card variant="raised"` (UI §Card: dùng cho Chart Wheel) | không thêm nền mới |
| Vòng ngoài/trong vành cung | `stroke-strong` (1.5) | đủ tương phản cả hai theme |
| Biên cung | `stroke-subtle` (1) | |
| Tick major / minor | `stroke-strong` (1.5) / `stroke-subtle` (1) | phân biệt bằng độ dài + độ dày |
| Vòng nhà | `stroke-subtle` (1) | |
| Đỉnh nhà | `stroke-subtle` (1) | |
| Marker góc | `stroke-strong` (2.5) | **đậm hơn** đỉnh nhà (không chỉ màu) |
| Glyph cung | `fill-primary`, `font-display`, size 18 | quy tắc glyph spec (text-primary) |
| Số nhà | `fill-secondary`, `font-data`, size 16 | |
| Nhãn góc | `fill-primary`, `font-data`, size 16, đậm | |
| Vùng cuộn focus | `focus-visible:ring-2 ring-focus` | không `outline-none` trần |
| Brass/indigo | **không dùng ở M4** | dành cho aspect (S4.6) theo spec §12.5/§12.11 |

Không hard-code mã màu (chỉ class token); không thêm palette/glyph package/dependency. Dark mode đi theo CSS variables. Tương phản cần **kiểm thủ công** ở hai theme (jsdom không đo màu).

## 22. No-House Mode

| Điều kiện | `buildWheelGeometry` | `ChartWheel` |
|---|---|---|
| `houseDataAvailable=true`, 12 nhà hợp lệ | `hasHouses=true`, `houses` 12 | vẽ `house-ring` |
| `houseDataAvailable=false` (hợp lệ: chưa biết giờ sinh hoặc Placidus không hội tụ) | `hasHouses=false`, `houses=null`, `rotation` theo ASC nếu có góc, ngược lại `0` | **không** `data-layer="house-ring"`, không đỉnh/số nhà, không vòng nhà; vành cung + tick + (góc nếu có) vẫn đầy đủ; `figcaption`/`desc` nêu "không có dữ liệu nhà" |
| Không có nhà **và** không có ASC (`chartNoHouses`) | `rotation=0`, `angles=[]` | Aries 0° ở bên trái; wheel vẫn là chart hợp lệ |
| Không có nhà nhưng có góc (hiếm) | `angles` có marker, `houses=null` | góc vẫn vẽ |
| Mâu thuẫn (cờ true, ≠12 nhà) | ném `WheelGeometryError` (không với tới: VM đã dọn) | — |

Không bịa đỉnh nhà mặc định; không coi là lỗi tính; không `reportError`; thông điệp nguyên nhân do `HouseDataNotice` (M7/HouseTable) đảm nhiệm — wheel **không** nêu nguyên nhân (Confirmation #5 của M3).

## 23. Error and Invalid-Data Handling

| Trường hợp | Nguồn | Hành vi M4 |
|---|---|---|
| 1. Chart hợp lệ, có nhà | VM `houseDataAvailable=true` | vẽ đủ |
| 2. Chart hợp lệ, không có nhà | VM `false` | không vòng nhà (Mục 22); **không** ném |
| 3. Một số góc vắng | `vm.angles` ít hơn 4 | chỉ vẽ góc có mặt; không ném |
| 4. VM vi phạm bất biến (cờ nhà true nhưng ≠12 nhà; `NaN`/ngoài `[0,360)` lọt tới hình học) | lỗi lập trình ở tầng trước | `buildWheelGeometry`/primitives **ném** `WheelGeometryError`/`RangeError` — **không** vẽ wheel sai, **không** nuốt lỗi; trong `ChartDetailPage` tới `RootErrorBoundary` theo chính sách đã chốt ở M3 (lỗi không dự kiến); **không** tạo boundary mới |
| 5. Lỗi tải/API | M3 (`ApiError`, `ChartViewModelError`) | ngoài M4 |

Góc lạ (`known:false`) là **dữ liệu hợp lệ nhưng không hỗ trợ** ⇒ bỏ qua có chủ đích (không phải lỗi). `issues` của VM không được wheel đọc, không báo cáo (Confirmation #3 M3).

---

## 24. Testing Strategy

Khung (đã có): Vitest (`vitest run`) + jsdom + Testing Library + `vitest-axe`; **không thêm dependency**, **không** visual regression (F4 plan quyết định #18: SVG phụ thuộc font/OS; repo không có tooling). Hình học kiểm bằng **số học có dung sai**, không snapshot ảnh/object lớn.

| Lớp | Vị trí test mới (cạnh nguồn) | Lệnh |
|---|---|---|
| Primitives | `frontend/src/features/chart/model/geometry.test.ts` | `npx vitest run src/features/chart/model/geometry.test.ts` |
| `buildWheelGeometry` | `frontend/src/features/chart/model/wheelGeometry.test.ts` | `npx vitest run src/features/chart/model/wheelGeometry.test.ts` |
| Lớp + `ChartWheel` | `frontend/src/features/chart/ui/ChartWheel/*.test.tsx` | `npx vitest run src/features/chart/ui/ChartWheel` |
| Shell + trang (hồi quy) | `ChartViewerShell.test.tsx`, `pages/app/charts/detail/page.test.tsx` (sửa 3 assertion nếu D-M4-4) | `npx vitest run src/features/chart/ui/ChartViewerShell src/pages/app/charts` |
| Toàn bộ | — | `npm test` / `npm run test:coverage` |

**Dung sai:** so sánh toạ độ bằng `toBeCloseTo(value, 6)` cho primitives (chưa làm tròn) và `toBeCloseTo(value, 2)` cho đầu ra đã `roundCoord`; góc đo lại bằng `atan2` rồi chuẩn hoá. **Fixture:** `chartFull`, `chartNoHouses` (CAPTURED) qua `toChartViewModel`; fixture **DERIVED** cho Whole Sign (dựng từ `chartFull` theo hợp đồng Backend: `cusp1 = ASC`, cusp 2–12 = đầu cung) **có nhãn rõ**; khuyến nghị chụp một response Whole Sign thật (D-M4-12). Tính tất định kiểm bằng `toStrictEqual` hai lần gọi và `Object.freeze` sâu VM.

## 25. Numerical Test Matrix

(Bám F4 plan §32: ASC bên trái, +90° đáy, đối xứng, vòng 360°, `sectorMidAngle` vòng qua 0°, hợp đồng fixture.)

| ID | Hàm | Đầu vào | Kỳ vọng | Dung sai |
|---|---|---|---|---|
| G1 | `normalizeLongitude` | `0`, `360`, `-0.0001`, `720.5`, `359.9999999`, `-360` | `0`, `0`, `359.9999`, `0.5`, giữ nguyên, `0`; **không** bao giờ `=360` | 1e-9 |
| G2 | `normalizeLongitude` | `NaN`, `Infinity`, `-Infinity` | ném `RangeError` | — |
| G3 | `toScreenAngle` | `λ = rot, rot+90, rot+180, rot+270` | `180, 270, 0, 90` | 1e-9 |
| G4 | `toScreenAngle` | `λ=0, rot=350` | `190` (vòng 0°) | 1e-9 |
| G5 | `polarToCartesian` | `θ = 0, 90, 180, 270`, tâm `(300,300)`, `r=100` | `(400,300)`, `(300,200)`, `(200,300)`, `(300,400)` | 1e-9 |
| G6 | `polarToCartesian` | `θ` và `θ+180` | đối xứng qua tâm | 1e-9 |
| G7 | `polarToCartesian` | `r=0`; `r<0`/không hữu hạn | tâm; ném `RangeError` | — |
| G8 | `arcPath` | `span=30`, `start=165`, `r` 260/225 | điểm đầu/cuối của `d` = `polarToCartesian`; cờ `large-arc=0`; sweep ngoài `0`, trong `1` | 1e-3 |
| G9 | `arcPath` | `span=200` | `large-arc=1`; `span ∉ (0,360)`/`rOuter ≤ rInner` ⇒ `RangeError` | — |
| G10 | `sectorMidAngle` | `(350,20)`, `(0,30)`, `(14.89,30)`, `(20,20)` | `5`, `15`, `22.445`, `20` | 1e-9 |
| W1 | `buildWheelGeometry(chartFull)` | — | `rotation = ASC.longitude`; `hasHouses`; 12 sign cell; 72 tick; 12 house spoke; 4 angle marker | — |
| W2 | idem | θ(ASC) | đo `atan2` từ `line` ASC = `180°` (chống xoay đôi) | 1e-2 |
| W3 | idem | biên Aries (`λ=0`) | góc đo = `180 − ASC` (mod 360) | 1e-2 |
| W4 | idem | 12 biên cung | chênh góc liên tiếp = `30°`, đủ 12, không trùng | 1e-2 |
| W5 | idem | 72 vạch | chênh góc liên tiếp = `5°`; 12 major tại bội 30° | 1e-2 |
| W6 | idem | cusp nhà 1 (Placidus) | cùng góc với ASC (`cusp1 = ASC`) ⇒ θ=180° | 1e-2 |
| W7 | idem | số nhà `i` | góc = `sectorMidAngle(cusp_i, cusp_{i+1})` (nhà 12 → cusp 1) | 1e-2 |
| W8 | idem | **căn chỉnh lớp**: với mỗi `λ` ∈ {biên cung, cusp, góc}, góc đo từ toạ độ = `toScreenAngle(λ, rotation)` | khớp ở **cả ba lớp** | 1e-2 |
| W9 | `buildWheelGeometry(chartNoHouses)` | — | `hasHouses=false`, `houses=null`, `angles=[]`, `rotation=0`; biên Aries ở `θ=180°` | 1e-2 |
| W10 | idem | kết quả không chứa trường `planets`/`aspects` | đúng hình dạng M4 | — |
| W11 | DERIVED Whole Sign | cusp1 = ASC, cusp 2–12 = đầu cung | nhà 1 và 12 hẹp (<30°); số nhà ở trung điểm thật; spoke nhà 1 ở `θ=180°`, các spoke khác không đều | 1e-2 |
| W12 | góc thiếu | VM chỉ có `Ascendant`; VM chỉ có `Midheaven`; rỗng | đúng số marker; `rotation` đúng; không ném | — |
| W13 | góc lạ | `angles` chứa `known:false` | bị bỏ qua, không ném | — |
| W14 | không ASC nhưng có nhà | `ascendantLongitude=null`, `houses` đủ | `rotation=0` (**không** suy từ cusp 1) | — |
| W15 | tất định | gọi hai lần; VM `Object.freeze` sâu | `toStrictEqual`; không đột biến | — |
| W16 | hợp đồng sai | `houseDataAvailable=true` với 11 nhà | ném `WheelGeometryError` (`code`) | — |
| W17 | làm tròn | mọi toạ độ có ≤ 3 chữ số thập phân; không `-0` | đúng | — |
| W18 | hợp đồng fixture | `floor(cuspDegree/30)` ↔ `signOnCusp` (đã ở M1) | **không lặp lại**; chỉ ghi nhận | — |
| W19 | ranh giới | `ascendantLongitude=0`, `=359.9999`, `=29.9999` | xoay đúng, không NaN | 1e-2 |

## 26. Component Test Matrix

Truy vấn dựa vào vai trò/nhãn khi có thể; với phần tử SVG dùng `data-layer`/`data-sign`/`data-house`/`data-angle` (hợp đồng ổn định). Không phụ thuộc thứ tự nút trừ khi thứ tự là hợp đồng (thứ tự vẽ giữa lớp được kiểm bằng vị trí tương đối của `data-layer`).

| ID | Kịch bản | Kỳ vọng |
|---|---|---|
| C1 | render `chartFull` | `figure[data-testid=chart-wheel]`, `svg[viewBox="0 0 600 600"]`, `role="img"` có tên (từ `<title>`) và mô tả (`<desc>`) |
| C2 | vành cung | `[data-layer="zodiac-ring"]` có 12 `[data-sign]`, đúng thứ tự `Aries…Pisces`; glyph là chuỗi từ `labels` (kiểm bằng code point, có `\uFE0E`) |
| C3 | vạch chia độ | `[data-layer="degree-ticks"]` đúng 72 `line`; 12 `major` |
| C4 | có nhà | `[data-layer="house-ring"]` có 12 `[data-house]` 1–12 và số nhà hiển thị |
| C5 | không nhà (`chartNoHouses`) | **không** `[data-layer="house-ring"]`; vành + tick vẫn có; không số nhà; không lỗi |
| C6 | góc | `chartFull` ⇒ 4 `[data-angle]` có nhãn `ASC/MC/DSC/IC` và `aria-label` đầy đủ |
| C7 | góc vắng | VM chỉ `Ascendant`; VM `angles=[]` ⇒ chỉ đúng số marker, **không** ném |
| C8 | góc lạ | `known:false` ⇒ không marker, không ném |
| C9 | thứ tự lớp | `angle-markers` sau `house-ring` trong DOM (vẽ trên cùng) |
| C10 | hệ toạ độ | mọi `x/y` nằm trong `[0,600]`; nhãn góc ngoài vành nhưng trong `viewBox` |
| C11 | token | lớp chứa `stroke-strong`/`stroke-subtle`/`fill-primary`… (không mã màu cố định); không `style` màu inline |
| C12 | sửa an toàn | không `dangerouslySetInnerHTML`, không `onClick`/`tabIndex` trên phần tử SVG |
| C13 | trợ năng | `vitest-axe` sạch: có nhà, không nhà, chỉ ASC; vùng cuộn `role=region` có nhãn và `tabIndex=0` |
| C14 | `figcaption` | nêu rõ phạm vi (không có hành tinh); không nêu nguyên nhân thiếu nhà |
| C15 | `desc` | có "Cung Mọc tại …" khi có ASC; "không có dữ liệu nhà" khi `hasHouses=false`; **không** nhắc hành tinh |
| C16 | tất định | render hai lần cho cùng VM ⇒ cùng DOM (so `innerHTML`) |
| S-W1 | Shell (nếu D-M4-4 duyệt) | `ChartViewerShell` chứa `chart-wheel` thay cho placeholder; 3 bảng vẫn hiện (cả hai `layout`) |
| S-W2 | Shell, không nhà | wheel không có vòng nhà **và** `HouseDataNotice` vẫn xuất hiện đúng một lần ở `HouseTable` |
| S-W3 | hồi quy | test cũ của Shell/page xanh sau khi sửa 3 assertion placeholder (nêu lý do trong Evidence Matrix) |

---

## 27. Implementation Task Breakdown

Thứ tự: **M4.0 → M4.1 → M4.2 → M4.3 → M4.4 → M4.5 → M4.6**. M4.1 có thể làm trước khi chốt D-M4-2/4/5 (không phụ thuộc quyết định hiển thị).

### F4-M4.0 — Cổng quyết định (không mã)
Owner xác nhận/chấp nhận mặc định D-M4-1…D-M4-12 (Mục 31); **cần duyệt thật:** D-M4-2, D-M4-4, D-M4-5. Kết quả: Decision Log cập nhật.

### F4-M4.1 — Pure Geometry Primitives
1. **Objective:** `normalizeLongitude`, `toScreenAngle`, `polarToCartesian`, `arcPath`, `sectorMidAngle`, hằng bố cục. 2. **Rationale:** nền toán học dùng chung cho M4–S4.6. 3. **Preconditions:** M4.0 (D-M4-1); S4.2 (không cần ở bước này). 4. **Inspect:** F4 plan §17; `model/format.ts` (mẫu hàm thuần + test); `tsconfig.app.json`. 5. **Create:** `model/geometry.ts`, `model/geometry.test.ts`. 6. **Steps:** (a) hằng; (b) 5 hàm theo Mục 14, kiểm đầu vào hữu hạn; (c) test G1–G10. 7. **Interfaces:** hàm xuất (chưa public ra barrel). 8. **Tests:** G1–G10. 9. **Verify:** `npx vitest run src/features/chart/model/geometry.test.ts`; `npm run typecheck`; `npm run lint`; `npm run format:check`. 10. **Acceptance:** AC-G1…AC-G4. 11. **Dependencies:** M4.0. 12. **Out of scope:** `buildWheelGeometry`, label layout, aspect geometry.

### F4-M4.2 — `buildWheelGeometry`
1. **Objective:** hàm dựng `WheelGeometry` từ VM. 3. **Preconditions:** M4.1; S4.2. 4. **Inspect:** `chartViewModel.ts` (kiểu), `labels.ts` (`resolveSign`), `api/types.ts` (`KNOWN_ZODIAC_SIGNS`), `fixtures.ts`. 5. **Create:** `model/wheelGeometry.ts`, `model/wheelGeometry.test.ts` (+ helper dựng fixture Whole Sign DERIVED trong file test). 6. **Steps:** theo Mục 15–18, 22–23; kiểm bất biến → `WheelGeometryError`. 7. **Interfaces:** `buildWheelGeometry`, `WheelGeometry` và các kiểu con, `WheelGeometryError`. 8. **Tests:** W1–W19. 9. **Verify:** `npx vitest run src/features/chart/model/wheelGeometry.test.ts` + 4 lệnh chung. 10. **Acceptance:** AC-G5…AC-G10. 11. **Dependencies:** M4.1. 12. **Out of scope:** hành tinh/aspect trong output.

### F4-M4.3 — SVG Foundation Layers
1. **Objective:** `ZodiacLayer`, `TickLayer`, `HouseLayer`, `AngleLayer`. 3. **Preconditions:** M4.2 (kiểu `WheelGeometry`). 4. **Inspect:** `ChartBadges` (mẫu glyph/`aria-hidden`), `tableStyles.ts`, Tailwind config. 5. **Create:** `ui/ChartWheel/{ZodiacLayer,TickLayer,HouseLayer,AngleLayer}.tsx` + test từng lớp (nhóm C2–C9, C11–C12). 6. **Steps:** mỗi lớp chỉ in số từ `geometry`; thuộc tính `data-*`; token class. 7. **Interfaces:** props từng lớp (Mục 19). 8. **Tests:** C2–C9, C11–C12 ở mức lớp. 9. **Verify:** `npx vitest run src/features/chart/ui/ChartWheel`. 10. **Acceptance:** AC-S1…AC-S6. 11. **Dependencies:** M4.2. 12. **Out of scope:** wrapper, Shell.

### F4-M4.4 — ChartWheel Wrapper and Design System Integration
1. **Objective:** `figure`/`svg`, `title`/`desc`, kích thước, vùng cuộn, token. 3. **Preconditions:** M4.3. 4. **Inspect:** `Card`, UI §7.2, F4 plan §28. 5. **Create:** `ui/ChartWheel/{ChartWheel.tsx,index.ts,ChartWheel.test.tsx}`; hàm `buildWheelDescription(vm)` (nội bộ file). 6. **Steps:** Mục 20–21. 7. **Interfaces:** `ChartWheel({ vm, className })` *(nhận `vm` để dựng `desc`/`geometry` một lần bên trong bằng `useMemo`; hoặc nhận `geometry` + `description` — chọn khi triển khai, ưu tiên `geometry` + `description` để Shell sở hữu một lần `buildWheelGeometry`)*. 8. **Tests:** C1, C10, C13–C16. 9. **Verify:** `npx vitest run src/features/chart/ui/ChartWheel` + 4 lệnh chung. 10. **Acceptance:** AC-S7…AC-S11. 11. **Dependencies:** M4.3. 12. **Out of scope:** zoom/pan, tương tác.

### F4-M4.5 — Viewer Shell Integration (cần D-M4-4)
1. **Objective:** thay placeholder bằng `ChartWheel`. 3. **Preconditions:** M4.4; D-M4-4 duyệt. 4. **Inspect:** `ChartViewerShell.tsx(+test)`, `detail/page.test.tsx` V1/V2, `features/chart/index.ts`. 5. **Modify:** `ChartViewerShell.tsx` (gọi `useMemo(() => buildWheelGeometry(vm), [vm])`, render `<ChartWheel>` ở vị trí placeholder); **sửa tối thiểu** 3 assertion (`ChartViewerShell.test.tsx` S6; `page.test.tsx` V1, V2) từ `chart-visualization-placeholder` sang `chart-wheel`, **nêu lý do trong Evidence Matrix**; **thêm** S-W1, S-W2. 6. **Steps:** tích hợp; cập nhật test; kiểm layout 1 cột (hai cột `lg` thuộc S4.9). 7. **Interfaces:** không đổi public (Shell vẫn `{vm, className}`). 8. **Tests:** S-W1…S-W3. 9. **Verify:** `npx vitest run src/features/chart/ui/ChartViewerShell src/pages/app/charts`. 10. **Acceptance:** AC-I1…AC-I3. 11. **Dependencies:** M4.4. 12. **Out of scope:** layout hai cột, selection, hành tinh. *Nếu D-M4-4 không được duyệt:* bỏ M4.5, giữ `ChartWheel` chưa gắn và test độc lập (Mục 34, phương án B).

### F4-M4.6 — Regression, Manual Visual QA and Closure
1. **Objective:** hồi quy, cổng chất lượng, kiểm thủ công glyph/hình học, Evidence Matrix. 3. **Preconditions:** M4.5 (hoặc M4.4 nếu phương án B). 4. **Inspect:** toàn bộ diff; matrix M7. 5. **Change:** chỉ sửa lỗi phát hiện + Evidence Matrix. 6. **Steps:** (a) chạy `npm test` toàn bộ + `typecheck/lint/format:check/build`; (b) grep gate Mục 33; (c) **kiểm thủ công có bản ghi thật** (thiết bị, trình duyệt, phiên bản, ngày): glyph 12 cung hiển thị đúng (không emoji/tofu) trên Windows/macOS/iOS/Android; ASC bên trái; thứ tự cung ngược chiều kim đồng hồ; không-nhà; hai theme; 320px (vùng cuộn) và 200% zoom; (d) Evidence Matrix (CAPTURED vs DERIVED, quyết định, Known Gaps). 7. **Tests:** nhóm hồi quy toàn bộ. 8. **Verify:** Mục 33. 9. **Acceptance:** AC-Q1…AC-Q4. 10. **Dependencies:** M4.5. 11. **Out of scope:** E2E (S4.10), tối ưu hiệu năng.

## 28. Task Dependencies

```text
M4.0 ─► M4.1 ─► M4.2 ─► M4.3 ─► M4.4 ─► M4.5 ─► M4.6
```
Chuỗi tuyến tính (mỗi bước dùng kiểu/hàm của bước trước). M4.1 có thể bắt đầu ngay sau D-M4-1; M4.5 chỉ chạy sau D-M4-4.

## 29. File Change Map

| File / Directory | Action | Responsibility | Task | Evidence / Rationale |
|---|---|---|---|---|
| `frontend/src/features/chart/model/geometry.ts` | **Create** | primitives hình học thuần | M4.1 | F4 plan §17, dòng 211; file **chưa tồn tại** (grep `*geometry*` rỗng) |
| `frontend/src/features/chart/model/geometry.test.ts` | Create | G1–G10 | M4.1 | quy ước test cạnh nguồn |
| `frontend/src/features/chart/model/wheelGeometry.ts` | **Create** | `buildWheelGeometry` + kiểu + `WheelGeometryError` | M4.2 | tách để S4.5/S4.6 import primitives không kéo VM (D-M4-8); không thể gộp vào `chartViewModel.ts` (sai trách nhiệm, file đã 860+ dòng) |
| `frontend/src/features/chart/model/wheelGeometry.test.ts` | Create | W1–W19 | M4.2 | — |
| `frontend/src/features/chart/ui/ChartWheel/{ZodiacLayer,TickLayer,HouseLayer,AngleLayer}.tsx` (+ test) | Create | bốn lớp SVG | M4.3 | F4 plan §16 "mỗi lớp là component nhỏ"; không tái dùng được component nào có sẵn (chưa có SVG layer) |
| `frontend/src/features/chart/ui/ChartWheel/{ChartWheel.tsx,index.ts,ChartWheel.test.tsx}` | Create | `figure`/`svg` + trợ năng + kích thước | M4.4 | UI §12.5 |
| `frontend/src/features/chart/ui/ChartViewerShell/ChartViewerShell.tsx` | **Modify** | thay placeholder bằng wheel; `useMemo(buildWheelGeometry)` | M4.5 | điểm tích hợp duy nhất; chỉ khi D-M4-4 duyệt |
| `frontend/src/features/chart/ui/ChartViewerShell/ChartViewerShell.test.tsx` | **Modify** | sửa S6 + thêm S-W1/S-W2 | M4.5 | test cũ tham chiếu placeholder |
| `frontend/src/pages/app/charts/detail/page.test.tsx` | **Modify** | sửa V1, V2 (placeholder → wheel) | M4.5 | cùng lý do; ghi vào Evidence Matrix |
| `frontend/src/features/chart/index.ts` | Không đổi (M4) | — | — | wheel chỉ dùng trong Shell cùng feature; export khi cần |
| `frontend/src/features/chart/model/aspectGeometry.ts` | **Không tạo / không sửa** | — | — | file chưa tồn tại; thuộc S4.6 |
| `docs/implementation/archive/sprint-f4/Sprint_F4_M4_Exit_Criteria_Evidence_Matrix.md` | Create (cuối) | hồ sơ đóng | M4.6 | quy ước |

**Chỉ đọc:** `model/{chartViewModel,labels,format}.ts`, `api/**`, `hooks/**`, `ui/{PlanetTable,HouseTable,AspectTable,ChartBadges,ChartList,CalculateChartDialog}`, `shared/**`, `src/test/**`, `app/router.tsx`, `backend/**`, `package.json`, cấu hình ESLint/TS/Vite/Playwright/CI.

## 30. Milestone Dependency Matrix

| Milestone | Current Status | Dependency on M4 | Required Evidence | Action |
|---|---|---|---|---|
| M1 | Hoàn tất | Dữ liệu (`ChartResponse`, `KNOWN_ZODIAC_SIGNS`, fixture) | matrix M1; test contract fixture | không đổi |
| M2 (S4.2) | Hoàn tất; coverage `model` 100% | **Tiền đề trực tiếp** | `chartViewModel.ts`, `labels.ts`; 100 test; CI | không đổi |
| M3 | Hoàn tất | Host (`ChartViewerShell`, `ChartDetailPage`, chính sách lỗi) | matrix M3 | chỉ sửa Shell + 3 assertion (D-M4-4) |
| M7 | Hoàn tất (mã/test/CI); kiểm thủ công chưa có bằng chứng | Chia sẻ Shell/`useMediaQuery`/`HouseDataNotice`; không phụ thuộc | matrix M7; CI #257 | giữ nguyên; xem R-9 |
| M11 | Hoàn tất | Không | matrix M11 | không đổi |
| **M4** | **Sẵn sàng có điều kiện** | — | plan này | thực hiện |
| S4.5 / S4.6 / S4.8 | Chưa bắt đầu | Phụ thuộc M4 | — | ngoài phạm vi |

## 31. Design Decision Log

| # | Quyết định (khuyến nghị) | Bằng chứng | Phương án khác | Lý do loại | Hệ quả | Cần owner duyệt? |
|---|---|---|---|---|---|---|
| 1 / D-M4-1 | **Toạ độ:** `viewBox 0 0 600 600`, `θ=180°+(λ−rotation)`, ngược chiều kim đồng hồ, `x=cx+r·cosθ`, `y=cy−r·sinθ` | F4 plan §16–17 (UI Spec §12.5 im lặng) | ASC ở đỉnh; chiều kim đồng hồ | trái F4 plan; không phải bố cục cổ điển | ASC trái; MC gần đỉnh | Không (đã duyệt trong plan v1.1) — ghi rõ spec im lặng |
| 2 / D-M4-1 | **Xoay:** `rotation=ascendantLongitude ?? 0`, áp dụng **một lần** trong `toScreenAngle`; không `transform=rotate` | F4 plan §17; yêu cầu tránh xoay đôi | xoay `<g>` | xoay glyph + dễ xoay đôi | text thẳng đứng; ASC θ=180° theo cấu trúc | Không |
| 3 | **Ranh giới hàm:** 5 primitives thuần ở `geometry.ts`; composition ở `wheelGeometry.ts` | F4 plan §17 (+ tách file D-M4-8) | một file lớn | S4.5/S4.6 phải import VM | thêm 1 file | Không |
| 4 | **`buildWheelGeometry(vm)`**: nhận VM, trả `WheelGeometry` tối thiểu (cung, tick, nhà|null, góc), không hành tinh/aspect | F4 plan §16; prompt Mục 9 | nhận DTO / cấu hình tuỳ ý | lặp VM | hợp đồng nhỏ, tất định | Không |
| 5 | **Lớp SVG:** `ZodiacLayer`, `TickLayer`, `HouseLayer`, `AngleLayer` trong `ChartWheel` (`<figure><svg>`) | F4 plan §16 | một component lớn / component cho từng primitive | khó test / thừa | 4 file nhỏ | Không |
| 6 | **Không nhà ⇒ không `house-ring`**, không bịa, không lỗi | prompt Mục 12; Domain Spec D-3 | vẽ nhà mặc định | bịa dữ liệu | wheel vẫn hợp lệ | Không |
| 7 | **Góc tuỳ chọn:** vẽ 0–4 theo VM; bỏ góc lạ; không suy góc | prompt Mục 13 | luôn vẽ 4 | trái hợp đồng | tolerant | Không |
| 8 / D-M4-9 | **Token:** `stroke-strong/subtle`, `fill-primary/secondary`, không màu Element, không brass/indigo | Design System §3; `tokens.css` không có token Element | tô theo nguyên tố | không có token + không đủ kênh | wheel trung tính | Không |
| 9 / D-M4-6 | **Responsive:** `viewBox` cố định, `w-full`, `max-w 640`, `min-w 400` + vùng cuộn có thể focus; zoom hoãn | F4 plan §28; UI §7.2 | co theo container | glyph <10px | cuộn ngang trên màn hẹp | Không |
| 10 | **Test số học có dung sai**, theo Mục 32 | F4 plan §32 | snapshot | brittle | — | Không |
| 11 | **Test component** bằng `data-layer/*`, đếm phần tử, `axe`; không snapshot ảnh | F4 plan #18 | visual regression | không có tooling; phụ thuộc OS/font | QA thủ công glyph | Không |
| 12 | **`aspectGeometry.ts`: không đổi** (chưa tồn tại) | prompt Mục 9; F4 plan S4.6 | tạo sớm | phình scope | — | Không |
| 13 | **Không dependency mới** | không có thư viện hình học | `d3`/`visx` | thừa cho 5 hàm | — | Không |
| D-M4-2 | **Tick mỗi 5°** (72 vạch; major tại 30°) | **Đã duyệt (Approve):** 360°/5° = 72 vạch chia toàn vòng; 360°/30° = 12 vạch major. Major phân biệt bằng chiều dài/độ dày theo Design System; không tạo vạch 1° ở M4. | 1° (360 nút) | Nặng DOM, chưa có bằng chứng cải thiện UX ở kích thước dự kiến | Sinh bằng vòng lặp/hàm hình học thuần; xoay theo ASC nhất quán; vạch major tại 30° xác định từ góc zodiac; mật độ cấu hình qua hằng số | **Đã duyệt** |
| D-M4-3 | M4 **có** glyph cung, số nhà (số thường) và nhãn `ASC/MC/DSC/IC`; **không** nhãn hành tinh | UI §12.5; F4 plan §19–20 | chỉ đường kẻ | wheel khó đọc | thêm `<text>` | Không (theo F4 plan) |
| D-M4-4 | **Gắn wheel vào Shell, thay placeholder ngay M4** | **Đã duyệt (Approve):** Tích hợp vào Shell hiện có; hiển thị zodiac ring, degree ticks, house ring/cusps, angle markers; giữ nguyên route/data fetching/ownership của Shell; `figcaption` trung thực | Giữ placeholder đến S4.5 | Giảm khả năng kiểm thử tích hợp, dễ lọt lỗi sang milestone sau | Sửa chặt chẽ 3 assertion cũ + bổ sung test không có house data; figcaption mô tả đúng hiện trạng | **Đã duyệt** |
| D-M4-5 | **`svg role="img"` ở M4, chuyển `group` khi tương tác** | **Đã duyệt có theo dõi (Approve with follow-up):** Dùng `role="img"` cho SVG tĩnh nền M4 kèm `<title>/<desc>`; đánh giá lại và chuyển sang `group` ở S4.5/S4.8 khi thêm phần tử tương tác/focusable | `group` ngay từ M4 | M4 chưa có phần tử con focusable | Ghi nhận mâu thuẫn tài liệu giữa UI Spec §12.5 và F4 plan #10; chuyển đổi mô hình accessible khi có tương tác | **Đã duyệt (Follow-up)** |
| D-M4-7 | Hợp đồng sai ⇒ `WheelGeometryError`/`RangeError`; không nuốt lỗi | prompt Mục 20; chính sách M3 | bỏ qua/vẽ rỗng | che lỗi | tới `RootErrorBoundary` (không với tới) | Không |
| D-M4-8 | Thêm `wheelGeometry.ts` ngoài danh sách F4 plan | Mục 11 | gộp `geometry.ts` | kéo VM vào primitives | +1 file | Không (nêu rõ) |
| D-M4-10 | Làm tròn toạ độ 3 chữ số, chuẩn hoá `-0` | ổn định test/DOM | không làm tròn | DOM nhiễu | sai số ≤ 5e-4 | Không |
| D-M4-11 | Hằng bán kính theo F4 plan §17, đổi tại một nơi | F4 plan §17 | tham số hoá | thừa | — | Không |
| D-M4-12 | Chụp **một response Whole Sign thật** làm fixture CAPTURED; tới khi có dùng DERIVED (nhãn rõ) | Phát hiện 4; chỉ có fixture Placidus | chỉ DERIVED | có thể lệch Backend | tăng độ tin cậy | Khuyến nghị (không chặn) |

## 32. Risk Assessment

| ID | Rủi ro | Likelihood | Impact | Mitigation | Verification |
|---|---|---|---|---|---|
| R-1 | Mơ hồ hệ toạ độ (spec im lặng) | Trung bình | Cao | chốt một công thức (D-M4-1) + bảng kiểm 4 hướng | G3–G5, W2–W3 |
| R-2 | Xoay ASC sai | Trung bình | Cao | một điểm áp dụng; test θ(ASC)=180° | W2, W3 |
| R-3 | **Xoay đôi marker ASC** | Thấp | Cao | marker dùng đúng công thức chung | W2, W8 |
| R-4 | Xử lý không nhà sai (vẽ nhà mặc định/ném lỗi) | Thấp | Cao | `hasHouses=false` ⇒ `houses=null`; không ném | W9, C5 |
| R-5 | Lệch căn chỉnh giữa lớp | Trung bình | Cao | mọi lớp dùng cùng `WheelGeometry`/`rotation`; đo lại từ toạ độ | W8 |
| R-6 | Hard-code màu / nhân bản glyph | Trung bình | Thấp | chỉ class token; glyph từ `resolveSign` | C2, C11, grep |
| R-7 | Trừu tượng hoá hình học quá mức | Thấp | TB | 5 hàm + 1 builder; không framework | review |
| R-8 | Test dấu phẩy động brittle | Trung bình | TB | `toBeCloseTo`; không so `===` | review Mục 24 |
| R-9 | **Glyph không hiển thị đúng trong SVG `<text>`** (font Display không có ký hiệu; KG-M2-04; kiểm thủ công M7 chưa có) | **Cao** | TB | `U+FE0E` (đã có), `font-display` fallback hệ thống; **kiểm thủ công bắt buộc** M4.6 có bản ghi | checklist thiết bị thật |
| R-10 | Whole Sign: nhà không đều (Backend/Domain mâu thuẫn) | **Cao** (đã thấy) | TB | vẽ theo cusp trả về; trung điểm thật; fixture Whole Sign | W7, W11, D-M4-12 |
| R-11 | Đổi `aspectGeometry.ts` không cần thiết | Thấp | TB | không tạo/sửa | grep + diff |
| R-12 | Lặp trách nhiệm S4.2 (cờ nhà, sắp xếp) | Thấp | TB | chỉ đọc VM; không sắp lại | review |
| R-13 | Phình scope sang hành tinh/aspect/tương tác/zoom | Trung bình | TB | Out of Scope + grep Mục 33 | diff |
| R-14 | Sửa assertion cũ làm yếu test (placeholder → wheel) | TB | TB | thay bằng kiểm chặt hơn; liệt kê trong Evidence Matrix | review |
| R-15 | Wheel không có hành tinh gây hiểu nhầm | TB | Thấp | `figcaption` nêu rõ; bảng M7 là nguồn đầy đủ | C14 |
| R-16 | Vùng cuộn ngang khó dùng bằng bàn phím/AT | Thấp | TB | `role=region` + `tabIndex=0` + nhãn | C13 + thủ công |
| R-17 | Tương phản stroke/glyph ở dark mode | Thấp | TB | token tự đổi theo theme; kiểm thủ công | checklist |

## 33. Quality Gates

Chỉ dùng lệnh có trong `frontend/package.json`:

| Mục đích | Lệnh |
|---|---|
| Test hình học (tập trung) | `npx vitest run src/features/chart/model/geometry.test.ts src/features/chart/model/wheelGeometry.test.ts` |
| Test component wheel | `npx vitest run src/features/chart/ui/ChartWheel` |
| Hồi quy liên quan | `npx vitest run src/features/chart src/pages/app/charts` |
| Toàn bộ | `npm test` (`vitest run --passWithNoTests`); coverage: `npm run test:coverage` |
| Lint / Format / Kiểu / Build | `npm run lint` · `npm run format:check` (sửa: `npm run format`) · `npm run typecheck` (gồm `tsconfig.node.json`) · `npm run build` |
| E2E | `npm run test:e2e` (cần Backend + Postgres; **chỉ CI**; M4 không thêm spec) |

Không có lệnh visual regression/Storybook (không tồn tại ⇒ không đề xuất). Bằng chứng đóng M4: CI Frontend xanh **trên đúng commit cuối** (một job `build` gồm cả E2E) + log các lệnh trên + bản ghi kiểm thủ công.

```bash
cd frontend/src
grep -rnE "from \"react|from \"react-dom|window\.|document\.|import\.meta" features/chart/model/geometry.ts features/chart/model/wheelGeometry.ts   # rỗng: thuần
grep -rnE "Math\.(cos|sin|atan2)" features/chart/ui                                                                                          # rỗng: UI không tự tính toạ độ
grep -rnE "planets|aspects|PlanetVM|AspectVM" features/chart/model/wheelGeometry.ts features/chart/ui/ChartWheel                              # rỗng: ngoài phạm vi
grep -rnE "zustand|createContext|useReducer|useState|dangerouslySetInnerHTML|as unknown as|: any|eslint-disable" features/chart/model/geometry.ts features/chart/model/wheelGeometry.ts features/chart/ui/ChartWheel  # rỗng
grep -rnE "#[0-9a-fA-F]{3,6}|rgb\(|hsl\(" features/chart/ui/ChartWheel                                                                     # rỗng: không hard-code màu
test ! -e features/chart/model/aspectGeometry.ts && echo "aspectGeometry.ts không tồn tại (đúng)"
git diff --stat -- ../package.json ../package-lock.json                                                                                       # rỗng: không dependency mới
```

Mình **chưa chạy** bất kỳ test M4 (chưa tồn tại); các lệnh trên là yêu cầu xác minh cho giai đoạn thực thi.

## 34. Known Gaps and Open Questions

**Quyết định đã được Owner phê duyệt (M4.0 Resolved):**

| ID | Quyết định | Nội dung phê duyệt | Trạng thái |
|---|---|---|:---:|
| **D-M4-2** | Khoảng cách tick | **Approve 5°:** 72 vạch (12 major tại 30° phân biệt bằng chiều dài/độ dày); sinh bằng hàm thuần; vạch major xác định từ góc zodiac; mật độ cấu hình qua hằng số | APPROVED |
| **D-M4-4** | Gắn wheel vào Shell, thay placeholder | **Approve:** Tích hợp ngay trong M4 vào Shell; hiển thị zodiac ring, ticks, house ring/cusps, angle markers; `figcaption` trung thực; sửa 3 assertion không nới | APPROVED |
| **D-M4-5** | `role="img"` ở M4, chuyển `group` khi có tương tác | **Approve with follow-up:** Dùng `role="img"` cho SVG tĩnh nền M4 kèm `<title>/<desc>`; đánh giá lại và chuyển sang `group` ở S4.5/S4.8 khi thêm phần tử tương tác | APPROVED |

**Known Gap / Documentation / Backend:**

| ID | Vấn đề | Phân loại |
|---|---|---|
| DOC-M4-01 | UI Spec §12.5 không định nghĩa toạ độ/tick/bán kính/xoay; lấy từ F4 plan §16–17 | Documentation Gap (cân nhắc bổ sung spec) |
| DOC-M4-02 | "Mục 32" trong prompt = F4 plan §32 | Documentation note |
| DOC-M4-03 | F4 plan §17 vẫn liệt kê `formatDegreeMinute` "làm tròn/nhớ phút" (đã thay bằng cắt xuống phút ở M2) | Documentation Gap |
| **BE-M4-01** | **Domain Spec §15.4 (Whole Sign: nhà 1 bắt đầu đầu cung) ≠ §16/`house.calculator.ts` (cusp 1 = ASC)** ⇒ Whole Sign có nhà 1 và 12 hẹp | Backend Contract Issue / Requires Backend clarification |
| KG-M4-01 | Chưa có fixture CAPTURED Whole Sign | Known Gap (D-M4-12) |
| KG-M4-02 | Không tô nguyên tố (không có token Element, VM chưa có nguyên tố) | Known Gap — KG-M2-02 |
| KG-M4-03 | Số La Mã cho nhà (`numeralStyle`) chưa dùng (không có preference) | Known Gap |
| KG-M4-04 | Zoom/pan, nút zoom, pinch (spec §7.2) chưa có; wheel < 400px phải cuộn ngang | Deferred — S4.8/S4.9 |
| KG-M4-05 | Bố cục hai cột `lg` sticky chưa có | Deferred — S4.9 |
| KG-M4-06 | `SkeletonChartWheel` chưa có (loading dùng `ChartViewerSkeleton`) | Deferred |
| KG-M4-07 | Kiểm thủ công glyph/trợ năng đa nền tảng chưa có (M7 chưa có bằng chứng; KG-M2-04) | **Must resolve during M4** (M4.6) |
| KG-M4-08 | Wheel không có hành tinh cho tới S4.5 (chỉ có bảng) | Accepted (nêu ở `figcaption`) |
| KG-M4-09 | `role="img"` phải đổi `group` khi có phần tử focusable | Handoff S4.5/S4.8 |
| KG-F4M1-12 | cảnh báo Node 20 của action | Kế thừa |

## 35. Acceptance Criteria

| ID | Tiêu chí | Kiểm bằng |
|---|---|---|
| AC-G1 | primitives thuần, tất định, hữu hạn-chỉ | G1–G10; grep Mục 33 |
| AC-G2 | quy ước toạ độ đúng bốn hướng | G3, G5 |
| AC-G3 | vòng 360°/0° đúng | G1, G4, G10 |
| AC-G4 | `arcPath` khớp `polarToCartesian` | G8, G9 |
| AC-G5 | `buildWheelGeometry` theo hợp đồng Mục 15 | W1, W10 |
| AC-G6 | biên cung và vạch chia độ đúng góc/số lượng/khoảng cách | W3–W5 |
| AC-G7 | đỉnh nhà đúng toạ độ; số nhà ở trung điểm thật | W6, W7, W11 |
| AC-G8 | xoay ASC nhất quán, không xoay đôi | W2, W3, W8, W19 |
| AC-G9 | marker góc thẳng hàng với cùng hệ toạ độ | W8, W12–W14 |
| AC-G10 | tất định, không đột biến, hợp đồng sai ném lỗi | W15, W16 |
| AC-S1 | vành 12 cung đúng thứ tự | C2 |
| AC-S2 | 72 vạch (12 major) | C3 |
| AC-S3 | vòng nhà + 12 đỉnh + 12 số khi có nhà | C4 |
| AC-S4 | **không** vòng nhà/đỉnh/số khi không có nhà; wheel vẫn hợp lệ | C5, S-W2 |
| AC-S5 | marker góc có mặt, chịu được thiếu/lạ | C6–C8 |
| AC-S6 | mọi lớp dùng chung hệ toạ độ; token thay vì màu cố định | C9–C11 |
| AC-S7 | `figure` + `svg` đúng, `viewBox` cố định | C1 |
| AC-S8 | trợ năng: `role=img`, `title/desc`, vùng cuộn có thể focus, `axe` sạch | C1, C13 |
| AC-S9 | `figcaption`/`desc` trung thực (không hành tinh, không nêu nguyên nhân thiếu nhà) | C14, C15 |
| AC-S10 | co giãn: `w-full`, `min 400`, `max 640` | C1, thủ công |
| AC-S11 | không tương tác/zoom/state | C12; grep |
| AC-I1 | wheel hiển thị trong Shell (nếu D-M4-4) | S-W1 |
| AC-I2 | 3 bảng M7 và notice thiếu nhà không đổi hành vi | S-W2, S-W3 |
| AC-I3 | 3 assertion placeholder sửa có lý do, không nới | review Evidence Matrix |
| AC-Q1 | `typecheck`, `lint`, `format:check`, `build` exit 0 | Mục 33 |
| AC-Q2 | toàn bộ test (cũ + mới) xanh | `npm test` |
| AC-Q3 | CI Frontend xanh trên commit cuối | CI |
| AC-Q4 | kiểm thủ công glyph/hình học có bản ghi thật; Evidence Matrix | M4.6 |

## 36. Definition of Done

```text
M4.0 chốt D-M4-2/4/5 → M4.1 primitives + test số → M4.2 buildWheelGeometry + test hợp đồng
→ M4.3 4 lớp SVG → M4.4 wrapper figure/svg + trợ năng/kích thước/token
→ M4.5 gắn Shell (nếu duyệt) → M4.6 hồi quy + kiểm thủ công + Evidence Matrix
→ mọi cổng xanh, CI xanh trên commit cuối → xoá blueprint → M4 đóng
```

Đồng thời: `git diff --stat` chỉ gồm file ở Mục 29; không dependency mới; không store; hành tinh/aspect/tương tác/zoom **không** xuất hiện; `aspectGeometry.ts` không tồn tại; Backend không đổi; test cũ không bị xoá/nới (3 assertion placeholder được thay bằng kiểm chặt hơn và nêu lý do).

## 37. Final Architect Review

| Câu hỏi | Kết luận |
|---|---|
| S4.2 có thực sự đủ làm tiền đề? | **Có** — VM cung cấp `ascendantLongitude`, `houseDataAvailable` (cờ hiệu lực), `cuspLongitude`, `AngleVM`, nhãn cung (Mục 7) |
| Hình học khớp UI Spec §12.5? | Khớp phần spec nêu (cấu trúc vòng, SVG, a11y); các phần spec im lặng lấy từ F4 plan hoặc là quyết định mở |
| Quy ước toạ độ tường minh? | Có, kèm bảng kiểm bốn hướng (Mục 12) |
| Xoay ASC nhất quán về toán học? | Có — một công thức, một điểm áp dụng, test chống xoay đôi |
| Vành cung/nhà/góc thẳng hàng? | Có — cùng `WheelGeometry`/`rotation`; test đo lại góc ở ba lớp (W8) |
| Hành vi thiếu nhà đúng? | Có — không `house-ring`, không bịa, không lỗi (Mục 22) |
| Hàm hình học thuần? | Có — không React/DOM; grep gate |
| `buildWheelGeometry` đủ nhỏ, test được? | Có — nhận VM, trả 4 nhóm dữ liệu; không hành tinh/aspect |
| SVG nhất quán kiến trúc? | Có — `ui/ChartWheel/**`, lớp nhỏ, không tính toán |
| Tái dùng design system? | Có — class token, glyph từ `labels`; không palette/package mới |
| Test số có ý nghĩa, không brittle? | Có — dung sai, đo lại góc, không snapshot |
| M1/M2/M3/M7/M11 nguyên vẹn? | Có — chỉ sửa Shell + 3 assertion (nếu duyệt) |
| Hành tinh/aspect/tương tác còn ngoài phạm vi? | Có — grep gate + Out of Scope |
| File/lệnh được kiểm với repo? | Có — mọi đường dẫn thật hoặc ghi "chưa tồn tại"; lệnh lấy từ `package.json` |
| Quyết định chặn đã rõ? | D-M4-2, D-M4-4, D-M4-5 (không chặn bắt đầu M4.1) |

## 38. Final Recommendation

**`READY FOR IMPLEMENTATION`**

Toàn bộ 3 quyết định kỹ thuật mở (**D-M4-2, D-M4-4, D-M4-5**) đã được Owner phê duyệt chính thức:
1. **D-M4-2 (Approve 5°):** 72 vạch chia độ (12 major tại 30°), sinh bằng vòng lặp/hàm thuần, xoay theo ASC nhất quán, vạch major tại 30° xác định từ góc zodiac, mật độ cấu hình qua hằng số.
2. **D-M4-4 (Approve integrate Shell):** Tích hợp vào Shell hiện có thay placeholder ngay M4; hiển thị zodiac ring, ticks, house ring/cusps, angle markers; `figcaption` trung thực; sửa 3 assertion không nới lỏng.
3. **D-M4-5 (Approve with follow-up role="img"):** Dùng `role="img"` cho SVG tĩnh nền M4 kèm `<title>/<desc>`; đánh giá lại và chuyển sang `group` ở S4.5/S4.8 khi thêm phần tử tương tác; ghi nhận mâu thuẫn spec/plan.

Không còn blocker kỹ thuật: tiền đề S4.2 đủ, M1/M2/M3/M7/M11 đã hoàn tất và có CI xanh.

Thứ tự thực hiện: **M4.0 (hoàn tất) → M4.1 → M4.2 → M4.3 → M4.4 → M4.5 → M4.6**; mỗi task kết thúc bằng `typecheck` + `lint` + `format:check` + test liên quan, và CI xanh trước khi đóng M4.
