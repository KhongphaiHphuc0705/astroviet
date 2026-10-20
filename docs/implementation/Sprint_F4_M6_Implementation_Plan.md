# AstroViet — F4 M6 Implementation Plan
## Aspect Rendering

**Phiên bản:** v1.0 (bản nháp để owner duyệt) · **Ngày audit:** 2026-10-18 · **Repo:** `KhongphaiHphuc0705/astroviet`, nhánh `dev`, HEAD `9ea8f3e` (commit code cuối `bd3b619`)
**Phạm vi tài liệu:** chỉ lập kế hoạch. Không file nào trong repo bị sửa. Việc cài dependency, tạo `.env`, `dist/` chỉ xảy ra trong bản clone sandbox, không thuộc repo.
**Vị trí đề xuất khi commit:** `docs/implementation/Sprint_F4_M6_Implementation_Plan.md` (blueprint tạm thời; xoá khi M6 đóng, chỉ Evidence Matrix được lưu archive — đúng quy ước đã dùng cho M4/M5).

**Trạng thái dùng trong tài liệu:** `VERIFIED` (đã đọc mã/chạy lệnh) · `PARTIALLY VERIFIED` · `UNVERIFIED` · `CONFIRMED` / `RECOMMENDED` / `UNRESOLVED` / `BLOCKED` / `DEFERRED` (cho decision log).
**Nguồn bằng chứng:** `[repo]` đọc mã/tài liệu · `[run]` chạy lệnh thực tế trong sandbox · `[ci]` trang GitHub Actions · `[owner]` xác nhận của owner.

---

## 1. Executive Summary

M6 vẽ **đường góc chiếu (aspect)** lên Chart Wheel, phân biệt bản chất bằng **kiểu nét** (không chỉ màu), có **công tắc bật/tắt** với mặc định theo breakpoint. Toàn bộ dữ liệu aspect đã nằm trong `ChartViewModel` (`AspectVM`, do Backend cung cấp); M6 **không** tính lại aspect, orb hay applying/separating.

**Tiền đề:** S4.4 và S4.5 hoàn tất về mã và CI (CI #269, Success, trên `bd3b619`); các cổng tĩnh và suite chart đã được chạy lại độc lập (Mục 5–6). **Chưa hoàn tất:** kiểm thủ công trên thiết bị thật của M5 (`AC-Q4`, 6 hạng mục) — không chặn viết mã M6 nhưng chặn nghiệm thu thị giác.

**Thiết kế đề xuất (tóm tắt):**
1. `model/aspectGeometry.ts` thuần: nhận `AspectVM[]` + `PlanetVM[]` + `rotation`, trả danh sách đường SVG-ready và danh sách **bị bỏ qua có lý do** (không bịa đầu mút, không `NaN`).
2. Đầu mút = **vị trí thật** của hai hành tinh (`toScreenAngle(longitude, rotation)`) trên **vòng aspect `r = 108`** (khớp quyết định D-S45-03 "≤ 108"), không dùng góc đã dàn nhãn.
3. Hình học: **chord** cho Sextile/Square/Trine/Opposition; **cung ngắn dọc vòng** cho Conjunction (đã được F4 plan §21 phê duyệt); suy biến (hai điểm trùng) → **chấm**.
4. Kiểu nét theo **loại** (5 loại, mỗi loại một kiểu riêng: liền / chấm / đứt / gạch dài…) + độ dày theo nhóm; màu theo `nature` chỉ là tín hiệu phụ (token sẵn có, khớp `AspectBadge`).
5. Lớp `AspectLayer` đặt **dưới** lớp hành tinh, `aria-hidden`, `pointer-events-none`; **unmount** khi tắt.
6. Công tắc dùng `Switch` sẵn có, state **cục bộ** trong `ChartViewerShell` (không Zustand, không lưu trữ): `userChoice ?? mặc-định-theo-breakpoint`.
7. Chú giải (legend) dựa trên dữ liệu thực tế của lá số để kiểu nét có nghĩa mà không cần màu.

**Quyết định kỹ thuật đã được Owner phê duyệt (chi tiết Mục 34):**
- **D-M6-02 (Bán kính vòng aspect):** Chốt `aspectRing = 108` và vẽ vòng tham chiếu mảnh `stroke-subtle` không tương tác, tạo khe 6 đơn vị với `planetZoneInner = 114`.
- **D-M6-05 (Giá trị kiểu nét):** Chốt bộ thông số Mục 16: width 1.5 (Trine/Sextile), 2.5 (Square/Opposition), 3 (Conjunction); dash `1 5`, `8 5`, `16 6`; round cap cho dot/Conjunction; không bật `vector-effect="non-scaling-stroke"` mặc định.
- **D-M6-08 (Mặc định responsive):** Bật từ `md` (768px), tắt dưới `md`. Breakpoint chỉ xác định giá trị khởi tạo; sau khi người dùng tự thao tác Switch, resize không ghi đè lựa chọn. Giữ nguyên breakpoint bố cục bảng/thẻ `sm` (640px).
- **D-M6-13 (Aspect Legend):** Chốt tạo component `AspectLegend` data-driven, đồng bộ cấu hình mapping kiểu nét với `AspectLayer`.
- **D-M6-21 (Copy tiếng Việt):** Switch `"Hiện đường góc chiếu"`; Gợi ý: `"Bật hoặc tắt các đường nối góc chiếu giữa các hành tinh trên biểu đồ."`; Nhóm: `"Căng thẳng"`; Figcaption: `"Các đường nối thể hiện góc chiếu giữa các hành tinh. Kiểu nét giúp phân biệt nhóm góc chiếu; xem chú giải để biết ý nghĩa từng kiểu."` (khi bật aspect).

**Trạng thái kết luận: `READY FOR IMPLEMENTATION`** — toàn bộ 5 quyết định mở đã được Owner phê duyệt; M6.0 đã đóng tiền đề tài liệu; sẵn sàng triển khai mã Task M6.1–M6.6.

---

## 2. Sprint and Milestone Context

| Mục | Nội dung | Bằng chứng |
|---|---|---|
| Sprint | Frontend Sprint F4 — **Natal Chart Viewer** | F4 plan v1.1 dòng 6, 25 `[repo]` |
| Milestone | **F4 M6 = FE-S4.6 — Aspect Rendering** | F4 plan dòng 598–605 `[repo]` |
| Objective | đường aspect theo kiểu nét; nhóm nature; công tắc bật/tắt | như trên |
| Preconditions / Dependencies | S4.4, S4.5 | như trên |
| Likely change | `model/aspectGeometry.ts`, `ui/ChartWheel/AspectLayer` | như trên |
| Out of scope | pattern, ma trận aspect | như trên |
| Thứ tự duyệt | S4.1 → S4.2 → S4.3 → S4.11 → S4.7 → S4.4 → S4.5 → **S4.6** → S4.8 → S4.9 → S4.10 | F4 plan dòng 521 `[repo]` — **giữ nguyên, không đổi thứ tự** |
| Ánh xạ tên | "Mn" trong hội thoại = `FE-S4.n`; Evidence Matrix đặt tên `Sprint_F4_M{n}_Exit_Criteria_Evidence_Matrix.md` | `archive/sprint-f4/` `[repo]` |

---

## 3. Current Repository State

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Nhánh `dev`, HEAD `9ea8f3e` (docs: dọn plan M5, cập nhật matrix); commit code cuối `bd3b619` ("Tier B-safe, marker isolation, accessibility fallbacks") | VERIFIED | `[run]` `git log` |
| `docs/implementation/`: không còn blueprint M5 (đã xoá ở `9ea8f3e`); archive có Evidence Matrix **M1, M2, M3, M4, M5, M7, M11** | VERIFIED | `[run]` `ls` |
| Chưa có `model/aspectGeometry.ts`, `ui/ChartWheel/AspectLayer*`; không có `showAspectLines` ở bất kỳ file nào | VERIFIED | `[run]` `grep -rn showAspect src` rỗng |
| Stack: React 18 + TypeScript + Vite + Tailwind (3.4); `createRoot` (SPA, không SSR/hydration) | VERIFIED | `main.tsx`, `tailwind.config.ts` `[repo]` |
| Script thật (`frontend/package.json`): `lint`, `format:check`, `typecheck`, `test`, `test:coverage`, `test:e2e`, `build` | VERIFIED | audit M5 + `[run]` |
| Chạy lại sau `bd3b619` (sandbox, có `.env` như CI): `format:check`, `lint`, `typecheck` đều exit 0; suite `model/` + `ui/ChartWheel/`: **13 file, 219 test đạt**; `labelLayout.ts` coverage 98,26% câu lệnh / 91,52% nhánh | VERIFIED | `[run]` |
| **Chưa** chạy lại toàn bộ `npm test`, `build`, `test:e2e` trên `bd3b619` trong phiên này (CI #269 đã xanh) | UNVERIFIED trong phiên này | — |
| CI #269 (`frontend-ci.yml`, push `dev`, commit `bd3b619`): **Success**, 4m22s, 1 cảnh báo (Node.js 20 deprecation của `actions/checkout@v4`, `setup-node@v4`) | VERIFIED | `[ci]` run `39082565856` |
| Commit head `9ea8f3e` chỉ đổi `docs/**` ⇒ theo cấu hình `frontend-ci.yml` không kích hoạt CI riêng; **Evidence commit** = `bd3b619` | VERIFIED | `[repo]` quy ước D-C3 ở matrix M4/M5 |

---

## 4. F4 Plan v1.1 and O-F4-2 Option B Verification

| Hạng mục | Kết quả |
|---|---|
| F4 plan v1.1 | Có: `docs/implementation/Sprint_F4_Implementation_Plan.md`, `READY FOR IMPLEMENTATION`, owner đã phê duyệt O-F4-1/2/3 (dòng 6, 12–17) — VERIFIED |
| **O-F4-2 = Phương án B** | Đúng: thêm danh sách chart (`GET /charts`), milestone **FE-S4.11** (route `/app/charts`) — VERIFIED (dòng 17, 55) |
| Hiện thực O-F4-2 | Evidence Matrix M11 tồn tại (CI Run #247, commit `f4ef205`, ngày 2026-10-13) — VERIFIED `[repo]`; không phụ thuộc wheel/bảng nên **không liên quan trực tiếp** tới M6 |
| Thứ tự thực thi | Khớp prompt M6 (Mục 2 bảng trên) — VERIFIED |
| Điều chỉnh đã có từ M4/M5 ảnh hưởng M6 | D-S45-03: vùng nhãn hành tinh `[114, 168)`, **bán kính tối đa của vòng aspect ≤ 108** (đã duyệt, cần mang sang M6); bán kính "≈110" ở F4 plan §17 bị thay thế |

**Mâu thuẫn trong chính F4 plan v1.1 (không tự "sửa" — ghi nhận):**

| # | Nội dung | Vị trí |
|---|---|---|
| X1 | Mặc định tắt aspect: **dưới `md`** (§21, dòng 619 S4.9) · **dưới `sm`** (§28, dòng 419) · bảng 730 coi "Tablet: Bật, Mobile: Tắt" (tablet = `md`) ⇒ nghiêng về `md` | dòng 358, 419, 619, 730 |
| X2 | Container state tên `ChartViewer`; repo thực tế là `ChartViewerShell` | dòng 228, 405 vs `ui/ChartViewerShell/` |
| X3 | Tên nhóm `Challenging`: F4 plan §24 hiển thị "Thử thách"; `labels.ts` dùng "**Căng thẳng**"; UI Spec §12.4/12.11 gọi "Tense" | `labels.ts:129`, F4 plan dòng 370 |
| X4 | F4 plan dòng 493: `chartFull` có "đủ 5 loại aspect"; fixture thật chỉ có Opposition ×2, Conjunction ×4, Trine ×1, Sextile ×2 (**không có Square**) | `[run]` thống kê fixture |
| X5 | F4 plan dòng 497 liệt kê `chartNoAspects`; **không tồn tại** trong `fixtures.ts` | `[repo]` |
| X6 | UI Spec §12.11: màu aspect "giữ nguyên hex giữa Light/Dark"; hiện thực `AspectBadge` dùng token theo theme (`accent-primary` = brass-500 sáng / brass-400 tối) | UI Spec dòng 1031 vs `AspectBadge.tsx` |
| X7 | UI Spec §7.2 (pinch-zoom dưới `md`) ≠ D-M4-6 (cuộn ngang, khung ≥ 400px) — đã ghi KG-S45-07, giữ D-M4-6 | đã biết |

---

## 5. Current Milestone Status and M5 Evidence

| Tiêu chí M5 | Trạng thái độc lập | Ghi chú |
|---|---|---|
| Mã S4.5 (`labelLayout`, `planetGeometry`, `PlanetLayer`, tích hợp `ChartWheel`, `role="group"`) | VERIFIED `[repo][run]` | |
| Lỗi review đợt trước (Tier B-safe, vành nhãn `[114,168]`, aria khi `overflow`, fixture dày được dùng trong test, seeded test) | VERIFIED sửa trong `bd3b619` | `labelLayout.ts:238–240` dùng `planetMarkerInner`; có test `chartDenseCluster`, `chartZeroBoundary`, seeded pseudo-random |
| CI xanh trên evidence commit | VERIFIED — #269 `[ci]` | |
| Coverage `labelLayout.ts` ≥ 95% | **Đạt về câu lệnh (98,26%)**, nhánh 91,52% — plan M5 ghi "câu lệnh/nhánh" nên nhánh dưới ngưỡng 95%; ghi nhận, không chặn | `[run]` |
| `AC-Q3` trong matrix M5 | **Dòng còn dẫn CI #268** trong khi header đã là #269/`bd3b619` ⇒ dòng cũ, cần sửa (docs-only) | `[repo]` |
| `AC-Q4` kiểm thủ công 6 hạng mục (glyph + ℞ trên Win/iOS/Android/macOS; cỡ chữ 400 px; tương phản; trình đọc màn hình; chế độ không giờ sinh) | **`ACCEPTED GAP` — chờ owner** | Matrix M5 §4 |

**Kết luận:** M5 **hoàn tất về mã/CI**; **chưa hoàn tất nghiệm thu thủ công**. Điều này được ghi là điều kiện (không phải blocker) cho M6: các kiểm tra thị giác của M6 (Mục 24.4) nên làm **cùng đợt** kiểm thiết bị của M5.

---

## 6. S4.4 / S4.5 Preconditions and Evidence

### 6.1 Đầu ra S4.4 mà M6 dùng (đều VERIFIED `[repo]`)

| Đầu ra | Vị trí | Dùng cho M6 |
|---|---|---|
| `WHEEL_VIEWBOX_SIZE = 600`, `WHEEL_CENTER = 300`, `WHEEL_RADII` (as const, cộng thêm được) | `model/geometry.ts` | thêm `aspectRing` |
| `normalizeLongitude`, `toScreenAngle(λ, rotation)` (`θ = norm(180 + λ − rotation)`, ngược chiều kim đồng hồ, ASC bên trái) | `geometry.ts` | **duy nhất** quy ước góc |
| `polarToCartesian`, `roundCoord` (3 chữ số), kiểu `Point` | `geometry.ts` | toạ độ đầu mút/cung |
| `WheelGeometry.rotation`, `hasHouses` | `wheelGeometry.ts` | M6 nhận `rotation` từ đây (`ChartWheel` đã dùng) |
| Mẫu layer: `<g data-layer="…">`, props `center`/`radii`, class token, không hex | Zodiac/Tick/House/AngleLayer | AspectLayer theo cùng mẫu |
| `svg viewBox 0 0 600 600`, `min-w-[400px] max-w-[640px]`, `role="group"` (M5) | `ChartWheel.tsx` | không đổi |

### 6.2 Đầu ra S4.5 mà M6 dùng

| Đầu ra | Dùng cho M6 | Ghi chú |
|---|---|---|
| `PlanetVM.key` ổn định, `longitude ∈ [0,360)` hữu hạn (VM đã lọc) | khoá nối đầu mút | M6 **không** cần `PlanetWheelModel` |
| `PlanetRenderItem.trueAngle = toScreenAngle(longitude, rotation)` | bất biến chéo: góc đầu mút aspect **bằng** `trueAngle` của marker | dùng làm test ràng buộc, không import vào geometry |
| `WHEEL_RADII.planetZoneInner = 114` (ranh giới trong của nhãn) | `aspectRing ≤ 108` giữ ≥ 6 đơn vị khe | D-S45-03 |
| Lớp hành tinh vẽ **sau** | M6 chèn trước `PlanetLayer` | Mục 15 |

### 6.3 Chấp nhận phụ thuộc

| Câu hỏi | Trả lời |
|---|---|
| S4.4 đủ cho M6? | **Có** — mọi tiện ích hình học cần thiết đã có |
| S4.5 đủ cho M6? | **Có** — danh tính hành tinh, kinh độ thật, ranh giới vành nhãn |
| M6 tiến hành được không cần sửa tiền đề? | **Có** |
| Lỗi tiền đề cần xử lý trước? | Không. Chỉ **dọn tài liệu**: sửa dòng `AC-Q3` của matrix M5; cập nhật F4 plan §17/§18/§21 (KG-S45-08 đã hẹn) — làm ở M6.0 (docs-only) |
| Hạn chế còn lại | `AC-Q4` thủ công M5 chưa có; M6 thêm vào cùng đợt |

---

## 7. Objective and Scope

**Trong phạm vi:**
1. Hình học đường aspect thuần (`aspectGeometry.ts`) từ vị trí thật của hai hành tinh.
2. `AspectLayer` (SVG) với kiểu nét theo loại, màu phụ theo nature.
3. Công tắc `showAspectLines` (`Switch` sẵn có), mặc định theo breakpoint, state cục bộ.
4. Chú giải kiểu nét (legend) dữ liệu-driven; ẩn công tắc khi không có đường nào để vẽ.
5. Tích hợp `ChartWheel` / `ChartViewerShell`; cập nhật `figcaption`.
6. Fixture DERIVED nhất quán, test geometry/component/switch, hồi quy S4.4–S4.5.
7. Docs-only chore M6.0 (matrix M5 `AC-Q3`, F4 plan §17/§18/§21).

## 8. Out of Scope

| Hạng mục | Thuộc về |
|---|---|
| Pattern aspect, ma trận aspect (`grid`), trang ma trận | FG-06 — Known Gap defer (F4 plan dòng 806) |
| hover/chọn aspect hoặc hành tinh, làm nổi/mờ đường liên quan, đồng bộ bảng ↔ wheel, `role="button"`, `tabIndex` | **S4.8** |
| Nút zoom/pan, bố cục hai cột, skip link | S4.9 / hoãn (KG-M4-04/05/06) |
| Tính lại aspect/orb/applying; phân loại lại nature; interpretation | không bao giờ ở frontend / F5 |
| Sửa Backend, `ChartResponse`, lưu trữ chart | ngoài F4 |
| Zustand, localStorage, thư viện mới, Canvas/virtualization | cấm / không có bằng chứng |
| Thay đổi `ChartViewModel`/`AspectVM` | không cần (Mục 10) |
| Sửa S4.4/S4.5 ngoài lỗi tiền đề được duyệt riêng | không có lỗi nào được phát hiện |

---

## 9. Existing Chart Wheel Architecture

```
ChartViewerShell (useMemo wheelGeometry; useMediaQuery 640px → table|cards)
  └─ Card ─ ChartWheel(vm, geometry)         // controlled, useMemo planetModel
        <svg role="group" viewBox 600>
          ZodiacLayer → TickLayer → HouseLayer → AngleLayer → PlanetLayer
        </svg>
        <figcaption>…</figcaption>
```

| Thành phần | Sự thật hiện có `[repo]` |
|---|---|
| Bán kính | `signOuter 260 · signInner/tickOuter 225 · tickInner/houseOuter 215 · houseInner 175 · planetMarkerOuter 175 · planetMarkerInner 168 · planetZoneInner 114 · planetLaneA 141 · planetLaneB 146 · angleLabel 282` |
| Vùng `r < 114` | **trống** — chỗ của vòng aspect |
| Quy ước lớp | mỗi lớp `<g data-layer>`; lớp trang trí `aria-hidden="true"`; lớp hành tinh **không** `aria-hidden` (nhóm `role="img"` từng hành tinh) |
| Test | `ChartWheel.test.tsx` (19 ca), `PlanetLayer.test.tsx`, selector `[data-layer="…"]` |
| Container trạng thái | `ChartViewerShell` (chưa có selection/aspect state) |
| Hook responsive | `shared/hooks/useMediaQuery.ts` (`useSyncExternalStore`, đồng bộ lần đọc đầu trên client) + mock `src/test/matchMedia.ts` (`installMatchMedia`, `setMatches`) |
| Breakpoint | `tailwind.config.ts`: `xs 0 · sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`; mã hiện chỉ dùng `(min-width: 640px)` |
| Primitive công tắc | `shared/ui/Switch/index.tsx` — `<input type="checkbox" role="switch">`, `label` gắn qua `htmlFor`, vùng chạm `h-hit-area w-hit-area` (44 px), Space gốc + Enter xử lý riêng, vòng focus `peer-focus-visible:ring-focus`; **`description` KHÔNG được nối `aria-describedby`** |
| Thuật ngữ tiếng Việt | "**Góc chiếu**" (heading Aspect Table), "Hợp / Lục hợp / Vuông chiếu / Tam hợp / Đối xung", nhóm "Hài hòa / Căng thẳng / Trung tính" |

---

## 10. Existing Aspect Data Contract

**Nguồn:** `AspectVM` và `buildAspects()` trong `model/chartViewModel.ts` (dòng 61–71, 603–770) `[repo]` — VERIFIED; DTO ở `api/types.ts` (`aspectType`, `nature`).

| Trường `AspectVM` | Kiểu | Đảm bảo | Cần cho vẽ? |
|---|---|---|---|
| `key` | `string` | `"{planetA}:{aspectType}:{planetB}"`, trùng thì hậu tố `#2`… ⇒ **duy nhất** (mọi mục đều giữ, trùng gắn `DUPLICATE_ENTITY`) | **Có** — React key, `data-aspect` |
| `planetA`, `planetB` | `GlyphLabel` (`key`, `labelVi`, `glyph`, `known`) | `key` = tên Backend, không rỗng | **Có** — `key` để nối đầu mút |
| `type` | `GlyphLabel` | `key` không rỗng; `known=false` nếu ngoài 5 loại | **Có** — chọn kiểu nét |
| `nature` | `NatureLabel` (`key`, `labelVi`, `tone: harmonious\|tense\|neutral\|unknown`, `known`) | luôn có; giá trị lạ → `tone "unknown"` | **Có** — màu phụ + nhóm legend |
| `orb` | `number` | hữu hạn, `≥ 0` (mục sai bị loại `ENTRY_DROPPED`) | chỉ thứ tự vẽ |
| `orbLabel`, `isApplying`, `applyingLabelVi` | | | **Không** (bảng dùng) |
| *(không có)* `exactAngle` | DTO có, VM **bỏ** | | không cần; frontend **không** dùng để suy loại/orb |

**Ràng buộc và sự kiện quan trọng:**
- Mục thiếu `planetA/planetB/aspectType/orb/isApplying` hợp lệ → **bị loại khỏi VM** (có issue). Mục **còn lại có thể trỏ tới hành tinh không tồn tại** (hành tinh bị loại hoặc không có): VM chỉ ghi `ASPECT_ENDPOINT_MISSING`, **vẫn giữ** mục ⇒ geometry **phải** tự xử lý, không giả định.
- Thứ tự mảng VM: `orb ↑` → hạng `planetA` → hạng `planetB` → hạng loại → `inputIndex` (tất định; Backend không cam kết thứ tự).
- Số lượng: Backend không nêu trần; fixture thật 9 aspect; F4 plan ước ≤ ~40 (dòng 501). Với ≤ 14 thân thể và 5 loại, tối đa lý thuyết `C(14,2)×5 = 455` — M6 **không** giả định trần.
- Planet key trùng (`DUPLICATE_ENTITY` ở hành tinh) → đầu mút mơ hồ ⇒ xử lý ở Mục 23.

**Kết luận:** đủ dữ liệu để vẽ **mà không cần sửa VM**. Frontend không tìm lại aspect từ kinh độ.

---

## 11. Aspect Nature Classification

| Câu hỏi | Bằng chứng | Kết luận |
|---|---|---|
| Phân loại do ai quyết định? | Backend trả `nature` ∈ {`Harmonious`, `Challenging`, `Neutral`} cho **từng aspect** (F4 plan §5.4 dòng 109 `[repo]`) | **CONFIRMED** — frontend dùng giá trị Backend |
| Ánh xạ sang hiển thị | `labels.ts`: `Harmonious → "Hài hòa"/harmonious`, `Challenging → "Căng thẳng"/tense`, `Neutral → "Trung tính"/neutral`; giá trị lạ → `unknown` | **CONFIRMED** (đã dùng ở `AspectBadge`, `AspectTable`) |
| Phân nhóm loại ↔ nhóm | F4 plan §21: Trine & Sextile = Harmonious; Square & Opposition = Challenging; Conjunction = Neutral. UI Spec §12.11 cùng nội dung (gọi "Tense") | **CONFIRMED** (tài liệu); thực tế fixture thật khớp |
| Frontend có tự phân loại không? | Không. Nature **không** suy từ loại, **không** suy từ màu. Loại → **kiểu nét** (bảng tĩnh vì `AspectType` là danh tính Backend); nature → **màu phụ + nhóm legend** từ dữ liệu từng aspect | **RECOMMENDED** |
| Loại và nature mâu thuẫn (vd Trine nhưng `Challenging`) | Không xảy ra trong dữ liệu hiện có; nếu xảy ra: kiểu nét theo loại, màu theo `nature` Backend, **không** sửa | **RECOMMENDED** + contract test trên fixture |
| Nhãn nhóm tiếng Việt | `labels.ts` "Căng thẳng" vs F4 plan "Thử thách" vs UI Spec "Tense" | **CONFIRMED (D-M6-21)** — chốt dùng "Căng thẳng" đồng bộ với `labels.ts` |

Không có quyết định phân loại thiên văn nào được tạo ra trong M6.

---

## 12. Geometry Design

### 12.1 Hệ toạ độ và đầu mút

- **Một** quy ước góc: `θ = toScreenAngle(longitude, rotation)`; điểm = `polarToCartesian(WHEEL_CENTER, WHEEL_CENTER, R, θ)`; làm tròn bằng `roundCoord`. Không có công thức góc thứ hai (`rotation` áp **đúng một lần** bên trong `toScreenAngle`).
- **Bán kính vòng aspect `R = WHEEL_RADII.aspectRing = 108`** (thêm mới), đi kèm vòng tròn tham chiếu mảnh `stroke-subtle` làm điểm tựa. Cơ sở: D-S45-03 (đã duyệt) đặt trần ≤ 108 và vùng nhãn bắt đầu 114 ⇒ khe 6 đơn vị. **CONFIRMED (D-M6-02)** (thay "≈110" của F4 plan §17). Vòng tròn tham chiếu là phi tương tác và không mang ý nghĩa chiêm tinh độc lập.
- **Đầu mút = kinh độ thật** của hai hành tinh (F4 plan §21, CONFIRMED), **không** là góc nhãn đã dàn (nhãn có thể bị dời > 30°). Hệ quả chấp nhận: người xem nối đường với hành tinh qua **cùng hướng xuyên tâm** với vạch marker `r 168→175`; vòng aspect mảnh (Mục 14) đóng vai điểm tựa. Đây là rủi ro thị giác (R4) cần kiểm thủ công.

### 12.2 Chord hay cung?

| Loại | Hình | Lý do |
|---|---|---|
| Sextile, Square, Trine, Opposition | **chord** thẳng giữa hai đầu mút | mặc định ưu tiên của prompt; Opposition đi qua tâm vòng |
| **Conjunction** | **cung ngắn dọc vòng aspect** nối hai đầu mút (cung có `|Δθ| ≤ 180°`) | F4 plan §21 đã phê duyệt: **CONFIRMED** |
| Conjunction suy biến (`separation < ε`) | **chấm** tại điểm đó (`shape "dot"`) | cung có hai đầu mút trùng bị SVG bỏ qua hoàn toàn (đặc tả `A`), nên không vẽ gì |

**Nhận xét trung thực:** với orb Conjunction thực tế ≤ ~10°, cung dọc vòng `R=108` lệch khỏi chord không quá `R(1−cos(Δ/2))` = **0,14** đơn vị ở 5,8° (giá trị lớn nhất trong fixture) và **0,41** ở 10° — **không phân biệt được bằng mắt**. Cung chỉ có giá trị *ngữ nghĩa* (dọc vòng) và nhất quán với F4 plan; nó **không** giải quyết vấn đề thật của Conjunction: đoạn rất ngắn (chord 5,8° ≈ 10,9 đơn vị ≈ 7 px ở 400 px; 0° = 0). Vì vậy Conjunction dùng nét **dày + đầu tròn** (Mục 16). Nếu owner muốn đơn giản hoá: vẽ Conjunction cũng bằng chord (một kiểu path, bỏ tính cờ `sweep`) — phương án thay thế hợp lệ, không đổi thị giác. **Decision D-M6-01.**

### 12.3 Cung SVG — định nghĩa

Path `M x₁ y₁ A R R 0 0 s x₂ y₂`. `large-arc = 0` (cung ngắn). Cờ `sweep` suy từ `d = ((θ₂ − θ₁ + 540) mod 360) − 180` (độ lệch có dấu ngắn nhất): vì góc màn hình là **ngược chiều kim đồng hồ** còn trục y SVG hướng xuống, `d > 0 ⇒ sweep = 0`, `d < 0 ⇒ sweep = 1`. **Không tin vào suy luận này khi viết mã**: test phải kiểm bằng định lý tâm cung (đặc tả SVG F.6.5) rằng với cờ đã chọn, tâm cung tính ngược từ hai đầu mút **= (300, 300)** và điểm giữa cung nằm đúng góc `θ₁ + d/2` trên vòng (Mục 29).

### 12.4 Bất biến kiểm thử được

| # | Bất biến |
|---|---|
| I1 | mỗi đường hợp lệ có đúng hai đầu mút (`start`, `end`) hữu hạn; dot có một tâm |
| I2 | `start` = điểm của `planetA`, `end` = điểm của `planetB` (thứ tự = thứ tự `AspectVM`; **không** hoán đổi) |
| I3 | `∠(start) = trueAngle(planetA)` và `∠(end) = trueAngle(planetB)` (so với `toScreenAngle` và với `PlanetRenderItem.trueAngle` của M5, dung sai `toBeCloseTo(…, 3)`) |
| I4 | `hypot(start − tâm) = hypot(end − tâm) = 108 ± 1e-3` |
| I5 | tất định: cùng đầu vào ⇒ `toEqual` (kể cả chuỗi `d`) |
| I6 | không `NaN`/`Infinity` trong bất kỳ trường số hay chuỗi `d` nào, với mọi đầu vào (kể cả xấu) |
| I7 | mọi điểm của mọi đường nằm trong đĩa `r ≤ 108 + ε` (⇒ không giao vùng nhãn `r ≥ 114`) |
| I8 | đảo thứ tự mảng đầu vào không đổi **tập** đường và thứ tự vẽ (sắp theo `orb ↓`, `key ↑`) |
| I9 | chord Opposition đi qua tâm (`|khoảng cách từ tâm đến đường| < 1e-3`) khi hai góc lệch đúng 180° |

---

## 13. `model/aspectGeometry.ts` Design

**Đường dẫn thực tế:** `frontend/src/features/chart/model/aspectGeometry.ts` (+ `.test.ts`) — chưa tồn tại, **Create**. Không có mô-đun tương đương hiện có (`grep aspectGeometry` rỗng).

```ts
// Thuần: không import React/DOM/chartViewModel (chỉ `import type`), không Math.random/Date.
export type AspectShape = "chord" | "arc" | "dot";
export interface AspectLineStyleSpec {      // dữ liệu thuần, KHÔNG chứa class CSS
  shape: "chord" | "arc";
  dasharray: string | null;                 // đơn vị viewBox
  width: number;
  linecap: "butt" | "round";
  patternLabelVi: string;                   // "Nét liền, mảnh" … dùng cho legend/aria
}
export const ASPECT_LINE_STYLES: Record<AspectTypeKey, AspectLineStyleSpec>;

export interface AspectLineGeometry {
  key: string; typeKey: string; natureTone: NatureTone; natureKey: string;
  shape: AspectShape;
  start: Point; end: Point;                 // dot: start = end = tâm
  d: string | null;                         // chord/arc: path; dot: null
  separationDeg: number;                    // |Δθ| giữa hai đầu mút (chỉ hình học)
  style: AspectLineStyleSpec;
}
export type AspectSkipReason =
  | "ENDPOINT_MISSING" | "ENDPOINT_AMBIGUOUS" | "NON_FINITE"
  | "SELF_REFERENCE" | "UNSUPPORTED_TYPE" | "DUPLICATE";
export interface SkippedAspect { key: string; reason: AspectSkipReason; }
export interface AspectLegendEntry { typeKey: string; typeLabelVi: string; natureKey: string; natureLabelVi: string; natureTone: NatureTone; style: AspectLineStyleSpec; }
export interface AspectGeometryResult { lines: AspectLineGeometry[]; skipped: SkippedAspect[]; legend: AspectLegendEntry[]; ringRadius: number; }

export function buildAspectGeometry(
  aspects: readonly AspectVM[], planets: readonly PlanetVM[], rotation: number,
): AspectGeometryResult;
```

**Thuật toán:** (1) kiểm `rotation` hữu hạn, nếu không → `RangeError` (cùng quy ước `geometry.ts`; `polarToCartesian` cũng ném `RangeError` với tham số không hữu hạn nên geometry phải **chặn trước** bằng `NON_FINITE` để không ném vì một aspect xấu). (2) Lập bảng `planetKey → PlanetVM` **một lần**; key xuất hiện > 1 lần đánh dấu *mơ hồ*. (3) Với mỗi aspect theo thứ tự VM: bỏ nếu A = B (`SELF_REFERENCE`), loại không có kiểu nét (`UNSUPPORTED_TYPE`), thiếu đầu mút (`ENDPOINT_MISSING`), đầu mút mơ hồ (`ENDPOINT_AMBIGUOUS`), kinh độ không hữu hạn (`NON_FINITE`), trùng (loại, cặp không thứ tự) đã có (`DUPLICATE`, giữ mục đầu theo thứ tự VM). (4) Tính điểm bằng `toScreenAngle` + `polarToCartesian` + `roundCoord`; chọn `shape`/`d`. (5) Sắp xếp để vẽ: `orb ↓`, `key ↑` (F4 plan §21: aspect chặt vẽ sau, nổi trên). (6) Dựng `legend` từ các cặp (loại, nature) **thực sự được vẽ**, theo thứ tự chính tắc loại (Conjunction, Sextile, Square, Trine, Opposition — đúng thứ tự `KNOWN_ASPECT_TYPES` trong `api/types.ts`; `ASPECT_TYPE_ORDER_MAP` của VM là biến nội bộ không export nên M6 dựng lại từ `KNOWN_ASPECT_TYPES`).

**Không** tái định nghĩa: `normalizeLongitude`, `toScreenAngle`, `polarToCartesian`, `roundCoord`, `Point`. Hàm "độ lệch có dấu ngắn nhất" đã có bản nội bộ trong `labelLayout.ts` (`circularDistance`, không có dấu) — M6 cần bản **có dấu**; khai báo trong `aspectGeometry.ts` và **ghi nhận** khả năng gom về `geometry.ts` (không refactor M5 trong M6).

**Xử lý lỗi:** không ném cho dữ liệu aspect xấu; trả `skipped` có lý do. Việc **ghi log** (reportError) không nằm trong model thuần: `ChartWheel`/Shell **không** cần log thêm vì VM đã ghi `issues`; chỉ test khẳng định `skipped` đúng. Nếu owner muốn log tập trung, thêm ở bước tích hợp (R7).

---

## 14. `ui/ChartWheel/AspectLayer` Design

**Đường dẫn:** `frontend/src/features/chart/ui/ChartWheel/AspectLayer.tsx` (+ `.test.tsx`) — file phẳng như các layer khác; export thêm vào `index.ts`. **Create.**

```tsx
interface AspectLayerProps { geometry: AspectGeometryResult; center?: number; }
// không gọi API, không tính chiêm tinh, không useState/useEffect
<g data-layer="aspects" aria-hidden="true" className="pointer-events-none">
  <circle data-part="aspect-ring" r={geometry.ringRadius} fill="none" className="stroke-subtle" strokeWidth={1}/>
  {geometry.lines.map(l =>
    l.shape === "dot"
      ? <circle key={l.key} data-aspect={l.key} data-type data-nature data-shape="dot" cx cy r className="{fill-class}"/>
      : <path   key={l.key} data-aspect={l.key} … d={l.d} fill="none" className="{stroke-class}"
                strokeWidth={l.style.width} strokeDasharray={l.style.dasharray ?? undefined} strokeLinecap={l.style.linecap}/>)}
</g>
```

| Mục | Quyết định |
|---|---|
| Trả `null` khi? | `lines.length === 0` (không vẽ cả vòng aspect) |
| Class màu | bảng **literal** theo `tone` (Tailwind JIT cần chuỗi đầy đủ, như `AspectBadge`): `harmonious → stroke-accent-secondary / fill-accent-secondary`, `tense → stroke-accent-primary / fill-accent-primary`, `neutral → stroke-secondary / fill-secondary`, `unknown → stroke-muted / fill-muted` |
| Kiểu nét | `strokeDasharray`, `strokeWidth`, `strokeLinecap` là **thuộc tính trình bày SVG** (Tailwind 3.4 không có utility dasharray); giá trị lấy từ `ASPECT_LINE_STYLES`, không chuỗi rải rác |
| Định danh | `data-aspect` (key duy nhất), `data-type`, `data-nature`, `data-shape` — S4.8 dùng lại, M6 **không** thêm `role/tabIndex/handler` |
| Tránh | `Math.cos/sin/atan2` (Gate G2), hex/rgb, `eslint-disable`, `as unknown as` |
| Không tạo | `AspectLine` con (không giải quyết vấn đề cụ thể); legend là một component riêng ngoài SVG (Mục 17) |

**Khoá lớp phụ thuộc đã kiểm:** M5 đã thêm `fill-primary`, `stroke-strong`, `stroke-subtle`, `font-*` vào CSS build; các lớp `stroke/fill-accent-primary`, `-accent-secondary`, `-secondary`, `-muted` **chưa** chắc có — jsdom không phát hiện (bài học M4) ⇒ Grep Gate G11 (Mục 32) bắt buộc.

---

## 15. SVG Drawing Order

```
<svg role="group">
  ZodiacLayer → TickLayer → HouseLayer → AngleLayer
  → AspectLayer        ← MỚI (chỉ mount khi bật)
  → PlanetLayer
</svg>
```

| Lý do | Chi tiết |
|---|---|
| Aspect **dưới** hành tinh | nhãn/marker/glyph luôn đọc được; bảo vệ KG của M5 |
| Không chồng thực tế | mọi nét aspect nằm trong đĩa `r ≤ 108`; vùng nhãn hành tinh `r ≥ 114`, marker `168–175` ⇒ **không giao theo cấu trúc** (bất biến I7 + test chéo lớp) |
| Thứ tự trong lớp | vòng aspect → các đường theo `orb ↓` rồi `key ↑`; aspect chặt nằm trên |
| Sự kiện chuột | `pointer-events-none` trên `<g>`: không chặn sự kiện dành cho hành tinh (S4.8) |
| Clipping | không dùng `clipPath`; mọi toạ độ nằm trong `viewBox` (I7) |
| Chồng nhau dày đặc | chấp nhận (aspect đi qua tâm vốn chồng); tương phản và kiểu nét giúp tách; làm mờ/nổi theo chọn lọc là S4.8 |

Chồng lớp aspect với **lớp nhà/góc**: đường nhà vẽ `175→225` (và `AngleLayer` tới 282): không giao `r ≤ 108`. Với lá số **không** có nhà, vòng baseline `r=175` của M5 vẫn độc lập.

---

## 16. Aspect Nature and Line-Style Mapping

**Nguyên tắc:** *kiểu nét theo loại là tín hiệu chính; độ dày theo nhóm là tín hiệu thứ hai; màu theo nature chỉ phụ.*

| Loại (Backend) | Nature (Backend) | Hình | `dasharray` | Độ dày | Cap | Màu phụ (token) |
|---|---|---|---|---|---|---|
| Trine | Harmonious | chord | liền | 1,5 | butt | `accent-secondary` |
| Sextile | Harmonious | chord | `1 5` (chấm) | 1,5 | **round** | `accent-secondary` |
| Square | Challenging | chord | `8 5` (đứt) | 2,5 | butt | `accent-primary` |
| Opposition | Challenging | chord | `16 6` (gạch dài) | 2,5 | butt | `accent-primary` |
| Conjunction | Neutral | cung / chấm | liền | 3 | **round** | `secondary` |
| *loại lạ* | bất kỳ | **không vẽ** (`UNSUPPORTED_TYPE`) | — | — | — | — |
| *nature lạ + loại biết* | `unknown` | theo loại | theo loại | theo loại | | `muted` |

(Kiểu nét/độ dày bảng trên đã được **CONFIRMED (D-M6-05)**: Stroke width cấp 1 (1.5), cấp 2 (2.5), cấp 3 (3); Dash pattern A (`1 5`), B (`8 5`), C (`16 6`); Line cap cho nét chấm là `round`. Không bật `vector-effect="non-scaling-stroke"` mặc định. Kiểm tra tính rõ ràng ở các tỷ lệ SVG trên thiết bị thực tế.)

| Yêu cầu prompt | Đáp ứng |
|---|---|
| (1) ánh xạ loại→kiểu | bảng trên, hằng `ASPECT_LINE_STYLES` |
| (2) có loại nào dùng chung kiểu? | **không** — 5 loại, 5 kiểu; nature chia 2 nhóm dày/mảnh |
| (3) tất định | bảng tĩnh, không phụ thuộc dữ liệu/thứ tự |
| (4) sáng/tối | màu là token theo theme (`accent-primary` brass-500/400, `accent-secondary` indigo-600/400); kiểu nét **không đổi**; **tương phản đồ hoạ ≥ 3:1 (WCAG 1.4.11) UNVERIFIED — đo thủ công ở Mục 24.4** (X6: UI Spec nói hex cố định, repo dùng token theo theme) |
| (5) mobile | wheel ≥ 400 px ⇒ hệ số 0,667: mảnh ≈ 1 px, dày ≈ 1,7 px, đứt ≈ 5,3/3,3 px, gạch dài ≈ 10,7/4 px, chấm chu kỳ 4 px; **UNVERIFIED trên thiết bị** (R3). Không dùng `vector-effect: non-scaling-stroke` (chưa có tiền lệ ở S4.4/S4.5; giữ đơn vị viewBox) |
| (6) cần legend? | **Có** — kiểu nét vô nghĩa nếu không có chú giải; WCAG 1.4.1 đã được bảo đảm bởi Aspect Table, legend phục vụ người xem hình |
| (7) mù màu | phân biệt nhờ kiểu nét + độ dày + legend chữ; không cặp đỏ/xanh lá (UI Spec §12.5) |

**Legend (CONFIRMED, D-M6-13):** `ui/ChartWheel/AspectLegend.tsx` — ngoài SVG, dưới công tắc, **dữ liệu-driven** từ `geometry.legend` (chỉ loại thực sự được vẽ). Trình bày mẫu nét thực tế, tên nhóm nature (lấy từ nguồn label dùng chung), và màu bổ trợ. Dùng chung cấu hình mapping kiểu nét với `AspectLayer` để đảm bảo tính nhất quán tuyệt đối. Là `<ul>` thật, có `aria-label`; chỉ hiện khi bật. Không phát hiện pattern, không tạo matrix aspect, không nhân đôi dữ liệu.

---

## 17. Visibility Switch

| Mục | Quyết định |
|---|---|
| Component | **`@shared/ui/Switch` sẵn có** (`role="switch"` trên `<input type="checkbox">`) — VERIFIED; **không** tạo primitive mới |
| Chế độ | **controlled**: `checked={visible}`, `onChange` đặt `userChoice` |
| Nhãn | `label="Hiện đường góc chiếu"` (**CONFIRMED, D-M6-21**) — thuật ngữ chuẩn hóa khớp heading bảng "Góc chiếu" |
| Mô tả | Gợi ý bật/tắt (**CONFIRMED, D-M6-21**): "Bật hoặc tắt các đường nối góc chiếu giữa các hành tinh trên biểu đồ." Do `Switch.description` chưa nối `aria-describedby` (Mục 9), dùng một phần tử gợi ý riêng có `id` và truyền `aria-describedby` qua props (`{...props}` được spread vào `<input>`). |
| Kích thước | `size="md"` (vùng chạm vô hình 44 × 44 qua `h-hit-area w-hit-area`) — đáp ứng chạm |
| Vị trí | thanh công cụ **phía trên wheel, trong cùng `Card`** (F4 plan dòng 380: công tắc là tương tác của wheel); legend ngay dưới công tắc; thứ tự Tab: công tắc → vùng cuộn wheel. **RECOMMENDED**, D-M6-07 |
| Không có gì để bật | khi `geometry.lines.length === 0` (zero aspect, hoặc tất cả bị bỏ qua) → **không render** công tắc và legend (không điều khiển vô nghĩa); nếu bị bỏ qua do dữ liệu xấu, bảng vẫn hiển thị |
| Khi **tắt** | `AspectLayer` **unmount** (không `opacity`/`display:none`), legend ẩn; hành tinh, nhà, góc, cung, nhãn **không đổi**; dữ liệu VM/aspect **không đổi**; bảng aspect **không đổi** |
| Khi **bật lại** | `AspectLayer` mount lại từ `geometry` đã memo — **không tính lại hình học** |
| Focus | giữ trên công tắc; không di chuyển focus |
| Unmount vs ẩn | **Unmount** (D-M6-11): lớp là trang trí `aria-hidden` nên không ảnh hưởng AT; giảm node DOM; hình học tính **ngoài** lớp nên không tốn thêm khi bật lại |

## 18. Responsive Default Policy

| Câu hỏi | Bằng chứng | Kết luận |
|---|---|---|
| Breakpoint thẩm quyền | `tailwind.config.ts` `screens`: `sm 640 · md 768 · lg 1024` `[repo]` | dùng đúng các giá trị này; **không** phát minh breakpoint |
| Hook sẵn có | `useMediaQuery(query)` (`useSyncExternalStore`) + mock `installMatchMedia` | dùng lại; **không** thêm thư viện responsive |
| Mặc định được duyệt | F4 plan: **bật ở ≥ md (768px), tắt dưới md** (§21, S4.9, bảng 730) | **CONFIRMED (D-M6-08)** — chốt `md` (768px) cho aspect visibility; giữ nguyên breakpoint bố cục chart |
| Thời điểm tính | SPA (`createRoot`, không hydration) ⇒ `useMediaQuery` cho giá trị **đúng ngay lần render đầu** trên client | không có nhấp nháy/hydration mismatch |
| Chính sách đề xuất | `visible = userChoice ?? matchesMd`, với `userChoice: boolean \| null` khởi tạo `null` | **CONFIRMED (D-M6-08/09)** |

**Ý nghĩa của chính sách:** trước khi người dùng chạm công tắc, hiển thị **theo viewport** (xoay màn hình/đổi kích thước cập nhật mặc định); **sau lần chạm đầu tiên**, lựa chọn của người dùng được **giữ bất kể** viewport đổi (không bị ghi đè). Phương án thay thế: "chỉ khởi tạo một lần" (`useState(() => matchesMd)`) — đơn giản hơn nhưng không theo xoay màn hình; hoặc "luôn theo viewport" — **bị loại** vì ghi đè ý định người dùng. Ngưỡng là hằng `ASPECT_LINES_DEFAULT_QUERY = "(min-width: 768px)"` đặt cạnh Shell (một nơi), không rải chuỗi.

## 19. State Ownership

| State | Loại | Chủ sở hữu | Mặc định | Vòng đời | Lưu trữ | Ai đọc |
|---|---|---|---|---|---|---|
| `userChoice` (`boolean\|null`) | UI cục bộ | `ChartViewerShell` (`useState`) | `null` | theo vòng đời Shell | **không** (không localStorage/profile/Zustand) | Shell → `ChartWheel` (prop), legend; S4.8 sẽ đọc cùng nguồn |
| `visible` | dẫn xuất | Shell: `userChoice ?? matchesMd` | theo breakpoint | | | `ChartWheel.showAspectLines` |
| `AspectGeometryResult` | dẫn xuất | `useMemo` trong **`ChartViewerShell`** (khoá `vm.aspects`, `vm.planets`, `wheelGeometry.rotation`); truyền xuống `ChartWheel` qua prop `aspectGeometry?` (nếu không truyền, `ChartWheel` tự dựng — cùng mẫu `geometry?`/`planetModel?` của S4.4/S4.5) | | tính **không phụ thuộc** `visible` | | `AspectLayer`, công tắc (ẩn khi `lines=[]`), legend |

- **Reset khi đổi chart:** `ChartDetailPage` render `<ChartViewerShell vm={…}/>` **không có `key`**; khi `chartId` đổi giữa hai chart đã có trong cache, `query.data` có ngay ⇒ cùng instance Shell được tái dùng ⇒ `userChoice` sẽ **rò** sang chart sau. Đề xuất `key={chartId}` ở trang (một dòng, **RECOMMENDED**, D-M6-15). Đây là sửa nhỏ ngoài `ChartWheel`, kèm test trang.
- **Không** Zustand: không có bằng chứng cần chia sẻ giữa các view độc lập hay lưu bền (F4 plan §27: "Zustand: không được biện minh").
- `ChartWheel` giữ **controlled**: prop `showAspectLines?: boolean` mặc định `false` (các nơi dùng cũ/test M4–M5 không đổi hành vi).

## 20. Accessibility

| Yêu cầu | Thiết kế |
|---|---|
| Tên truy cập công tắc | `label` thật qua `htmlFor` ("Hiện đường góc chiếu"); `role="switch"` + `checked` ⇒ trạng thái được trình đọc màn hình đọc; không dùng `aria-live` cho việc bật/tắt (hành vi gốc đã đủ) |
| Bàn phím | Tab tới công tắc; Space (gốc) và Enter (đã xử lý trong `Switch`) đổi trạng thái; **không** bẫy focus |
| Focus nhìn thấy | `peer-focus-visible:ring-2 ring-focus` đã có trong `Switch`; thử bằng test class + kiểm thủ công |
| Vùng chạm | 44 × 44 (`h-hit-area w-hit-area`); khối `label` cũng nhấp được |
| Lớp aspect | `aria-hidden="true"`, `pointer-events-none`, **không** `tabIndex`/`role="img"` từng đường ⇒ **không** thêm hàng chục điểm dừng/đọc cho trình đọc màn hình |
| Thông tin tương đương | **Aspect Table luôn render** (không phụ thuộc công tắc) với loại, hành tinh A/B, orb, tiến/tách, tính chất; wheel không bao giờ là nguồn thông tin duy nhất (Architecture Spec dòng 664) |
| Không chỉ màu | kiểu nét + độ dày + legend chữ; bảng có `AspectBadge` (ký hiệu + tên) |
| Legend | `<ul aria-label="Chú giải kiểu đường góc chiếu">`; mẫu nét `aria-hidden`; mỗi mục là chữ ("Tam hợp — nét liền, mảnh — Hài hòa") |
| `<desc>`/`figcaption` | `figcaption` thêm "…và các đường góc chiếu" **chỉ khi** đang vẽ; `<desc>` giữ nguyên số hành tinh (không đọc từng aspect) |
| Chuyển động | M6 không thêm animation ⇒ `prefers-reduced-motion`: không áp dụng (animation của `Switch` đã dùng `duration-fast` có sẵn) |
| `axe` | thêm ca `vitest-axe` cho Shell (công tắc bật/tắt, có/không aspect) |

## 21. Responsive and Mobile Behavior

| Viewport | Mặc định | Ghi chú |
|---|---|---|
| `< 768` (mobile) | **tắt** (nếu `md` được duyệt) | wheel vẫn ≥ 400 px (cuộn ngang, D-M4-6); công tắc luôn có để bật; bảng ở chế độ thẻ khi `< 640` |
| `≥ 768` | **bật** | |
| Đổi qua ngưỡng | trước khi chạm: theo viewport; sau khi chạm: giữ lựa chọn (Mục 18) | |
| Legend | `flex-wrap`, không tràn ngang trang | |
| Nét trên mobile | xem R3; kiểm thủ công ở 400 px (mục 24.4) | |
| Zoom/pan | **không** (hoãn S4.9) | |

---

## 22. Performance

- **Số node:** mỗi aspect = 1 `<path>`/`<circle>`; + 1 vòng; fixture thật 9 aspect; ước F4 plan ≤ ~40; trần lý thuyết 455. Ngay cả trường hợp xấu nhất (≈ 450 node) vẫn trong khả năng React thường; không cần virtualization/Canvas (không có yêu cầu thực).
- **Tính toán:** `buildAspectGeometry` O(a + p) (bảng băm hành tinh + một lần sắp xếp O(a log a)); memo bằng `useMemo` (trong Shell, hoặc trong `ChartWheel` khi không truyền prop) với khoá `[vm.aspects, vm.planets, rotation]` — **không** phụ thuộc `visible`, nên bật/tắt chỉ mount/unmount lớp, không tính lại.
- **Re-render:** `AspectLayer` nhận `geometry` ổn định (cùng tham chiếu); khoá React = `AspectVM.key` (duy nhất).
- **Không** `React.memo` thêm trước khi có số đo (đã nêu cùng nguyên tắc ở M5). **Không** cache hình học ngoài `useMemo`.
- Chart không có aspect: `lines = []` ⇒ layer `null`, công tắc ẩn, chi phí bằng 0.

## 23. Error and Edge Cases

| Ca | Hành vi định nghĩa | Kiểm bằng |
|---|---|---|
| 0 aspect | `lines=[]`, `skipped=[]`; **không** lỗi; công tắc/legend ẩn | G9, A8, SW9 |
| 1 aspect | một đường, legend 1 mục | G10 |
| Nhiều aspect chồng nhau | vẽ theo `orb ↓`; không thuật toán chống chồng (chấp nhận) | G11 |
| Thiếu hành tinh đầu mút | `skipped: ENDPOINT_MISSING`; **không** thay hành tinh khác, **không** bịa toạ độ | G7 |
| Hai hành tinh trùng `key` | `ENDPOINT_AMBIGUOUS` → bỏ qua (không chọn bừa) | G12 |
| A = B (tự tham chiếu) | `SELF_REFERENCE` → bỏ qua | G13 |
| Aspect trùng (cùng loại, cùng cặp không thứ tự) | giữ mục đầu theo thứ tự VM; còn lại `DUPLICATE` (bảng vẫn liệt kê cả hai) | G14 |
| Loại không hỗ trợ | `UNSUPPORTED_TYPE` → **không vẽ** (vẫn ở bảng; VM đã ghi `UNKNOWN_VALUE`) | G15 |
| Nature lạ / `null` | vẽ theo loại, màu `muted`; legend ghi nhóm "Chưa rõ" (từ `NatureLabel.labelVi`) | G16 |
| Trường tuỳ chọn `null` (`orbLabel`) | không dùng | — |
| Toạ độ không hữu hạn | `NON_FINITE` → bỏ qua; **không** ném, **không** `NaN` trong `d` | G6 |
| `rotation` không hữu hạn | `RangeError` (cùng quy ước `geometry.ts`) | G17 |
| Giờ sinh chưa có (không nhà) | **không** là lỗi: vẫn vẽ aspect (vị trí hành tinh có sẵn); baseline `r=175` của M5 độc lập | A9, I-no-house |
| Conjunction trùng vị trí | `shape "dot"` | G4 |
| Chuyển viewport quanh ngưỡng | Mục 18 | SW5–SW7 |
| Aspect trong `skipped` | **không** báo lỗi cho người dùng; ghi nhận ở test; log tập trung do VM `issues` (Mục 13) | |

**Phân biệt:** "chart hợp lệ nhưng không có aspect" ≠ "dữ liệu aspect xấu": cả hai ra `lines=[]`, nhưng `skipped.length` phân biệt được (0 vs > 0) — Shell có thể dùng sau này; M6 không hiển thị thông báo (tránh mở rộng phạm vi).

---

## 24. Testing Strategy

Dùng **Vitest + jsdom + Testing Library + `vitest-axe`**; **không** framework mới. Quy ước đặt tên: `G*` (geometry), `A*` (AspectLayer), `L*` (legend), `SW*` (switch/responsive), `R*` (hồi quy). Tiện ích `installMatchMedia` (`src/test/matchMedia.ts`) cho test breakpoint.

### 24.1 Fixture (dựa trên bằng chứng X4/X5)
Thêm vào `api/mocks/fixtures.ts`, **nhãn DERIVED**, bất biến kiểm trong `fixtures.contract.test.ts`:
- `chartNoAspects` — `chartFull` với `aspects: []`.
- `chartAllAspects` — hành tinh của `chartFull`; danh sách aspect **tính nhất quán bằng tay** từ kinh độ thật (đủ 5 loại, **có Square**, có cả Conjunction orb ≈ 0 và ≈ 5,8, có aspect Challenging đi qua tâm) — chỉ để kiểm hình học, ghi rõ không phải tính toán Backend.
- Không dùng `chartDenseCluster`/`chartZeroBoundary` để chứng minh hình học aspect (aspect của chúng **không khớp** vị trí đã dời — Mục 4/X).
- Test hình học khác dùng mảng `PlanetVM`/`AspectVM` dựng tay (hàm tiện ích test).

### 24.2 Unit — `aspectGeometry.test.ts` (Mục 29) · Component — `AspectLayer.test.tsx`, `AspectLegend.test.tsx`, `ChartWheel.test.tsx`, `ChartViewerShell.test.tsx` (Mục 30)

### 24.3 Lệnh
`npx vitest run src/features/chart/model/aspectGeometry.test.ts` · `… ui/ChartWheel` · `… ui/ChartViewerShell` · `… src/pages/app/charts` · toàn bộ `npm test`.

### 24.4 Kiểm thủ công (gộp với `AC-Q4` của M5, ghi theo mẫu §4 matrix M4/M5: người kiểm, thiết bị, hệ điều hành + **phiên bản đọc từ trang About**, trình duyệt/AT + phiên bản, commit/URL build, lá số dùng, bằng chứng đính kèm, ngày)
1. Năm kiểu nét phân biệt được **ở 400 px** trên màn thật (không chỉ DevTools).
2. Số đo tương phản nét aspect với nền wheel, sáng & tối (≥ 3:1): ghi cặp màu + tỉ lệ + công cụ.
3. Giả lập thiếu sắc (CVD) / thang xám: vẫn phân biệt 5 loại.
4. Đầu mút khớp hướng xuyên tâm của vạch marker (R4) — chụp ảnh `fixture_full`.
5. Công tắc: bàn phím, VoiceOver/NVDA đọc tên + trạng thái; thao tác chạm trên điện thoại.
6. Qua ngưỡng 768 px (đổi cỡ cửa sổ/xoay máy) trước và sau khi chạm công tắc.

## 25. Regression Strategy

**Giữ nguyên, không sửa:** `geometry.test.ts` G1–G10, `wheelGeometry.test.ts` W1–W19, `labelLayout.test.ts`, `planetGeometry.test.ts`, các test Zodiac/Tick/House/Angle/Planet layer.

**Có thể cần cập nhật *có chủ đích* (không làm yếu; ghi lý do trong matrix):**

| Test | Lý do | Cách |
|---|---|---|
| `ChartWheel.test.tsx` — ca đếm lớp/figcaption | thêm `showAspectLines`, lớp aspect và câu figcaption | thêm ca; ca cũ chạy với prop mặc định `false` ⇒ **không đổi** |
| `ChartViewerShell.test.tsx` S1–S7, S-W1/S-W2 | Shell thêm công tắc; `getByRole("switch")` mới | giữ nguyên số bảng (4); thêm ca |
| Test dùng `getByText(/góc chiếu/i)` ở nơi nào đó | nhãn công tắc "Hiện đường **góc chiếu**" có thể trùng khớp | rà soát toàn `src` trước; phạm vi lại truy vấn (`getByRole("heading", {name})`), **không** làm yếu |
| `page.test.tsx` (trang detail) | thêm `key={chartId}` | thêm ca đổi `chartId` ⇒ `userChoice` được reset |
| `fixtures.contract.test.ts` | thêm 2 fixture DERIVED | bổ sung, không sửa fixture CAPTURED |
| Gate M5 | G3′ cấm từ "aspect" trong `labelLayout/planetGeometry/PlanetLayer/ChartWheel` | **định nghĩa lại** cho M6: cấm `aspect` chỉ trong `labelLayout`, `planetGeometry`, `PlanetLayer`; cho phép trong `ChartWheel`, `AspectLayer`, `aspectGeometry` (Mục 32) |

**Hồi quy S4.4–S4.5 bắt buộc đạt:** toạ độ cung/vạch/nhà/góc không đổi; marker `r 175→168` và `trueAngle` không đổi khi bật/tắt aspect (test "bật aspect không dịch hành tinh"); vành nhãn `[114,168]`.

---

## 26. Implementation Task Breakdown

> Quy trình đã chốt từ M4/M5: **xác nhận quyết định trước khi sinh mã** (Mục 34); mỗi task một nhóm commit nhỏ; Evidence Matrix chỉ ghi lệnh **đã thật sự chạy**; commit chỉ chạm `docs/**` tách riêng khỏi commit chạm `frontend/**`.
> Lệnh kiểm chung mỗi task: `cd frontend && npm run lint && npm run typecheck && npm run format:check` + `npx vitest run <phạm vi>`. Cần `cp .env.example .env` khi chạy test cục bộ (CI đã làm).

### M6.0 — Đóng tiền đề tài liệu và cổng quyết định

| Mục | Nội dung |
|---|---|
| Objective | dọn nợ tài liệu từ M5; chốt 5 quyết định chặn (Mục 34) |
| Rationale | tránh mang mâu thuẫn X1–X7 vào mã; `AC-Q3` của matrix M5 đang trỏ CI #268 trong khi evidence commit là `bd3b619` (#269) |
| Preconditions | M5 code/CI xanh (đã xác minh); owner trả lời D-M6-02/05/08/13/21 |
| Inspect | matrix M5 (`AC-Q3`, header), F4 plan §17, §18, §21, §28, dòng 358/419/619/730 |
| Likely change | `docs/**` **duy nhất** (commit docs-only ⇒ không kích hoạt CI) |
| Steps | (1) sửa dòng `AC-Q3` M5 → CI #269 (`39082565856`) / `bd3b619`; (2) cập nhật F4 plan: bán kính vòng aspect ≤ 108, vùng nhãn `[114,168)`, bỏ "7°/2 làn/trên vòng chia độ", thống nhất ngưỡng breakpoint theo quyết định D-M6-08, tên `ChartViewerShell`, xoá giả định `chartFull` có Square |
| State / API | không |
| Tests | không (docs) · kiểm `git diff --stat` chỉ chạm `docs/**` |
| Acceptance | matrix M5 không còn tham chiếu sai; F4 plan nhất quán nội bộ về breakpoint và bán kính |
| Dependencies | — → M6.1 |
| Out of scope | sửa mã; thay thế các test thủ công của M5 |

### M6.1 — Hằng số và fixture

| Mục | Nội dung |
|---|---|
| Objective | thêm `aspectRing`; thêm fixture DERIVED nhất quán |
| Rationale | không có fixture Square; chưa có `chartNoAspects`; fixture DERIVED cũ có aspect không khớp vị trí (X4/X5) |
| Preconditions | M6.0 |
| Inspect | `model/geometry.ts`, `api/mocks/fixtures.ts`, `fixtures.contract.test.ts`, `api/types.ts` (`KNOWN_ASPECT_TYPES`) |
| Likely change | `geometry.ts` (+ `aspectRing: 108` trong `WHEEL_RADII`, **giá trị cũ không đổi**); `geometry.test.ts` (thêm ca hằng số `aspectRing ≤ planetZoneInner − 6`; **không sửa** G1–G10); `fixtures.ts` (+ `chartNoAspects`, `chartAllAspects`); `fixtures.contract.test.ts` |
| Steps | (1) thêm hằng số; (2) dựng `chartNoAspects` từ `chartFull`; (3) dựng `chartAllAspects` với aspect khớp kinh độ thật (tính bằng tay, ghi chú nguồn) đủ 5 loại; (4) mở rộng contract test: mọi planet key của aspect tồn tại; loại ∈ 5 loại; nature khớp bảng tài liệu; cờ DERIVED rõ ràng |
| State / API | không |
| Tests | `npx vitest run src/features/chart/model/geometry.test.ts src/features/chart/api/mocks` |
| Acceptance | `WHEEL_RADII` cũ không đổi giá trị; fixture mới qua contract test; fixture CAPTURED không đổi |
| Dependencies | M6.0 → M6.2 |
| Out of scope | sửa `fixture_*.json` CAPTURED; thêm fixture ngoài hai cái trên |

### M6.2 — Hình học aspect thuần

| Mục | Nội dung |
|---|---|
| Objective | `buildAspectGeometry`, `ASPECT_LINE_STYLES`, legend dữ liệu |
| Rationale | tách hình học khỏi SVG để kiểm số học |
| Preconditions | M6.1; D-M6-01/02/05 đã chốt |
| Inspect | `geometry.ts` (`toScreenAngle`, `polarToCartesian`, `roundCoord`), `labelLayout.ts` (`circularDistance`), `chartViewModel.ts` (`AspectVM`, `PlanetVM`), `labels.ts` (`NatureTone`) |
| Likely change | **Create** `model/aspectGeometry.ts`, `model/aspectGeometry.test.ts` |
| Steps | (1) kiểu + hằng kiểu nét; (2) bảng hành tinh + đánh dấu mơ hồ; (3) vòng lặp aspect với các lý do bỏ qua; (4) điểm bằng hàm chung; (5) chord/cung/chấm + cờ `sweep` (kiểm bằng tâm cung); (6) sắp xếp vẽ; (7) legend; (8) test số học (Mục 29) |
| State / API | không; chỉ `import type` từ VM |
| Tests | `npx vitest run src/features/chart/model/aspectGeometry.test.ts` (G1–G25) |
| Acceptance | I1–I9 được test; coverage `aspectGeometry.ts` ≥ 95% câu lệnh **và** nhánh (đặt ngưỡng cao hơn M5 để tránh lặp nợ nhánh); Gate G-1, G-6, G-8 sạch |
| Dependencies | M6.1 → M6.3 |
| Out of scope | React/SVG; log; sửa `geometry.ts` ngoài `aspectRing`; refactor `circularDistance` của M5 |

### M6.3 — `AspectLayer` và tích hợp wheel

| Mục | Nội dung |
|---|---|
| Objective | vẽ lớp aspect; `ChartWheel` nhận `showAspectLines`, `aspectGeometry?` |
| Rationale | tách trình bày khỏi hình học; giữ wheel controlled |
| Preconditions | M6.2 |
| Inspect | `ChartWheel.tsx`, `ChartWheel.test.tsx`, các layer hiện có, `AspectBadge.tsx` (bảng tone→class) |
| Likely change | **Create** `AspectLayer.tsx`(+test); Modify `ChartWheel.tsx`(+test), `index.ts` |
| Steps | (1) `AspectLayer` theo Mục 14, bảng class **literal**; (2) chèn **trước** `PlanetLayer`; (3) `showAspectLines` mặc định `false`; (4) memo hình học khi không có prop; (5) `figcaption` thêm "…và các đường góc chiếu" chỉ khi đang vẽ; (6) test A1–A13 |
| State / API | không state; nhận prop |
| Tests | `npx vitest run src/features/chart/ui/ChartWheel` |
| Acceptance | ca cũ không đổi; lớp `aria-hidden` + `pointer-events-none`; không `tabIndex`/handler; lớp aspect ở **trước** lớp hành tinh trong DOM |
| Dependencies | M6.2 → M6.4 |
| Out of scope | công tắc; legend; hover/nổi/mờ; `role` trên đường |

### M6.4 — Công tắc, mặc định responsive, legend, state

| Mục | Nội dung |
|---|---|
| Objective | `userChoice`, công tắc, legend, reset theo chart |
| Rationale | đáp ứng yêu cầu bật/tắt và mặc định theo breakpoint |
| Preconditions | M6.3; D-M6-08/09/13/15/21 đã chốt |
| Inspect | `ChartViewerShell.tsx`(+test), `shared/ui/Switch`, `shared/hooks/useMediaQuery.ts`, `src/test/matchMedia.ts`, `pages/app/charts/detail/page.tsx`(+test) |
| Likely change | Modify `ChartViewerShell.tsx`(+test), `page.tsx`(+test); **Create** `AspectLegend.tsx`(+test) *(nếu D-M6-13 = có)* |
| Steps | (1) `useMemo` hình học aspect trong Shell; (2) `useMediaQuery(ASPECT_LINES_DEFAULT_QUERY)`; (3) `useState<boolean\|null>(null)`; (4) toolbar: `Switch` (+ gợi ý có `id` + `aria-describedby`) và legend; ẩn khi `lines=[]`; (5) truyền `showAspectLines` + `aspectGeometry` vào wheel; (6) `key={chartId}` ở trang; (7) test SW1–SW11, L1–L4 |
| State / API | state cục bộ như Mục 19; không API |
| Tests | `npx vitest run src/features/chart/ui/ChartViewerShell src/features/chart/ui/ChartWheel src/pages/app/charts` |
| Acceptance | mặc định đúng breakpoint; lựa chọn người dùng được giữ khi đổi viewport; bật/tắt không đổi `vm`; zero-aspect ẩn công tắc |
| Dependencies | M6.3 → M6.5 |
| Out of scope | lưu trữ; Context; Zustand; sửa `Switch` dùng chung |

### M6.5 — Trợ năng, hồi quy, kiểm thủ công

| Mục | Nội dung |
|---|---|
| Objective | `vitest-axe`, hồi quy S4.4–S4.5, danh sách kiểm thủ công |
| Rationale | tránh lặp lại lỗi "lớp CSS không tồn tại ⇒ vô hình" và nợ kiểm thủ công |
| Preconditions | M6.4 |
| Inspect | toàn bộ test hiện có nhắc "góc chiếu"; `dist/assets/*.css` sau `npm run build` |
| Likely change | chủ yếu test và tài liệu; mã chỉ sửa khi phát hiện lỗi |
| Steps | (1) `npm test` đầy đủ; (2) `npm run build` + Gate G-11 (lớp CSS tồn tại); (3) axe cho Shell (bật/tắt, có/không aspect); (4) rà soát truy vấn trùng nhãn "góc chiếu" (R8); (5) chạy kiểm thủ công Mục 24.4 (cùng đợt `AC-Q4` M5); ghi bằng chứng |
| Tests | `npm test`, `npm run test:coverage` |
| Acceptance | không hạng mục thủ công nào ghi `VERIFIED` khi thiếu người kiểm/thiết bị/phiên bản/ngày |
| Dependencies | M6.4 → M6.6 |
| Out of scope | sửa test cũ để "cho qua" |

### M6.6 — Tích hợp và đóng milestone

| Mục | Nội dung |
|---|---|
| Objective | cổng cuối, Evidence Matrix M6, dọn blueprint |
| Steps | chạy Mục 32; tạo `Sprint_F4_M6_Exit_Criteria_Evidence_Matrix.md` (ID quyết định `D-M6-*` **của plan này**); Known Gaps; xoá blueprint ở commit docs-only sau evidence commit; link CI xanh |
| Acceptance | CI xanh trên evidence commit; matrix đủ mục (header, AC, quyết định, cổng, thủ công, KG) |
| Out of scope | chuẩn bị S4.8 ngoài ghi chú bàn giao (Mục 36) |

## 27. Task Dependencies

```
M6.0 (docs) ──► M6.1 ──► M6.2 ──► M6.3 ──► M6.4 ──► M6.5 ──► M6.6
   ▲ cần owner xác nhận D-M6-02/05/08/13/21
Tiền đề (đã xong): S4.4 ──► S4.5 ──► [M6]
Hạ nguồn: M6 → S4.8 (gắn selection/hover lên data-aspect, data-planet) → S4.9 → S4.10
```
M6 **không** vượt S4.4/S4.5 trong thứ tự; không phụ thuộc S4.8.

## 28. File Change Map

| File / Directory | Action | Responsibility | Task | Evidence / Rationale |
|---|---|---|---|---|
| `docs/implementation/archive/sprint-f4/Sprint_F4_M5_Exit_Criteria_Evidence_Matrix.md` | Modify (docs) | sửa dòng `AC-Q3` | M6.0 | còn dẫn CI #268 |
| `docs/implementation/Sprint_F4_Implementation_Plan.md` | Modify (docs) | đồng bộ bán kính/breakpoint/tên | M6.0 | X1, X2, X4 |
| `docs/implementation/Sprint_F4_M6_Implementation_Plan.md` | Create → delete khi đóng | blueprint | M6.0/M6.6 | quy ước M4/M5 |
| `frontend/src/features/chart/model/geometry.ts` (+`geometry.test.ts`) | Modify / Test | `aspectRing: 108` | M6.1 | D-S45-03 |
| `frontend/src/features/chart/api/mocks/fixtures.ts` (+`fixtures.contract.test.ts`) | Modify / Test | `chartNoAspects`, `chartAllAspects` | M6.1 | X4, X5 |
| `frontend/src/features/chart/model/aspectGeometry.ts` (+test) | **Create** | hình học thuần | M6.2 | chưa tồn tại (`grep` rỗng) |
| `frontend/src/features/chart/ui/ChartWheel/AspectLayer.tsx` (+test) | **Create** | lớp SVG | M6.3 | chưa tồn tại |
| `frontend/src/features/chart/ui/ChartWheel/AspectLegend.tsx` (+test) | **Create** (nếu D-M6-13) | chú giải | M6.4 | WCAG 1.4.1 hỗ trợ |
| `frontend/src/features/chart/ui/ChartWheel/ChartWheel.tsx` (+test) | Modify / Test | props, thứ tự lớp, figcaption | M6.3 | điểm tích hợp |
| `frontend/src/features/chart/ui/ChartWheel/index.ts` | Modify | export | M6.3 | |
| `frontend/src/features/chart/ui/ChartViewerShell/ChartViewerShell.tsx` (+test) | Modify / Test | state, công tắc, legend, hình học | M6.4 | container hiện có |
| `frontend/src/pages/app/charts/detail/page.tsx` (+`page.test.tsx`) | Modify / Test | `key={chartId}` | M6.4 | Mục 19 |
| `frontend/src/shared/ui/Switch/*` | Inspect only | tái dùng | M6.4 | `description` chưa nối aria |
| `frontend/src/shared/hooks/useMediaQuery.ts`, `src/test/matchMedia.ts` | Inspect only | tái dùng | M6.4 | |
| `frontend/tailwind.config.ts`, `src/app/styles/tokens.css` | Inspect only | breakpoint, token | M6.2–M6.5 | |
| `frontend/src/features/chart/model/{chartViewModel,labels}.ts`, `api/types.ts` | Inspect only | hợp đồng aspect | M6.2 | không đổi |
| `…/model/{labelLayout,planetGeometry}.ts`, `ui/ChartWheel/PlanetLayer.tsx` | Inspect only | **không đổi** (M5) | — | hồi quy |
| `frontend/package.json`, lockfile | Inspect only | không đổi | — | G-7 |
| `backend/**` | Inspect only | không đổi | — | |
| `docs/implementation/archive/sprint-f4/Sprint_F4_M6_Exit_Criteria_Evidence_Matrix.md` | **Create** | bằng chứng | M6.6 | |

---

## 29. Geometry Test Matrix (`aspectGeometry.test.ts`)

Dùng `rotation = 0` cho số học dễ kiểm: `λ=0→θ=180→(192,300)`; `λ=90→θ=270→(300,408)`; `λ=180→θ=0→(408,300)`; `λ=270→θ=90→(300,192)` (với `R=108`, tâm `(300,300)`).

| # | Ca | Khẳng định |
|---|---|---|
| G1 | đầu mút A | Sun@0° ⇒ `start == (192, 300)` |
| G2 | đầu mút B | Mars@90° ⇒ `end == (300, 408)` |
| G3 | thứ tự đầu mút | A có kinh độ **lớn hơn** B vẫn `start = A`, `end = B` |
| G4 | Conjunction trùng vị trí | cùng kinh độ ⇒ `shape "dot"`, `d == null`, không `NaN` |
| G5 | dùng hệ toạ độ chung | với `rotation` bất kỳ: `∠start == toScreenAngle(λA, rot)`; **và** bằng `PlanetRenderItem.trueAngle` của `buildPlanetWheelModel` (hồi quy chéo M5) |
| G6 | kinh độ không hữu hạn | `skipped: NON_FINITE`; không có `NaN` trong bất kỳ chuỗi/số |
| G7 | thiếu hành tinh đầu mút | `ENDPOINT_MISSING`; **không** thay thế |
| G8 | cung Conjunction | `d` có `A 108 108 0 0 s`; tâm cung suy ngược (F.6.5) `== (300,300)`; điểm giữa ở góc `θ₁ + d/2`; **bao gồm** hướng cả `d>0` và `d<0` |
| G9 | 0 aspect | `lines=[]`, `skipped=[]`, `legend=[]` |
| G10 | 1 aspect | 1 đường, legend 1 mục |
| G11 | thứ tự vẽ | `orb ↓`, hoà theo `key ↑`; đảo mảng đầu vào ⇒ cùng thứ tự (I8) |
| G12 | hành tinh trùng key | `ENDPOINT_AMBIGUOUS` |
| G13 | A = B | `SELF_REFERENCE` |
| G14 | aspect trùng | giữ mục đầu, còn lại `DUPLICATE` |
| G15 | loại lạ | `UNSUPPORTED_TYPE`, không vẽ |
| G16 | nature lạ | vẽ; `natureTone "unknown"` |
| G17 | `rotation` không hữu hạn | `RangeError` |
| G18 | tất định | gọi 50 lần ⇒ `toEqual` |
| G19 | qua 0° | Conjunction 359,5°/0,5° ⇒ cung **ngắn** qua 0° (`|Δθ| = 1°`), không cung dài |
| G20 | Opposition | `0°↔180°` ⇒ chord `(192,300)→(408,300)`, qua tâm (I9) |
| G21 | trong đĩa | mọi điểm `hypot ≤ 108 + 1e-3` (I7) |
| G22 | legend | chỉ chứa (loại, nature) được vẽ, thứ tự `KNOWN_ASPECT_TYPES` |
| G23 | không mutate | đầu vào bị `deepFreeze` vẫn chạy được |
| G24 | kiểu nét độc lập màu | với mọi loại: kiểu nét (`dasharray`,`width`) **không** đổi khi `nature` đổi |
| G25 | 5 kiểu khác nhau | tập `(dasharray, width, shape)` của 5 loại có 5 phần tử khác nhau |

## 30. Component Test Matrix

| # | Thành phần | Ca | Khẳng định |
|---|---|---|---|
| A1 | `AspectLayer` | `chartAllAspects` | số `[data-aspect]` = `lines.length` |
| A2 | | thuộc tính theo loại | `strokeDasharray`/`stroke-width`/`stroke-linecap` đúng bảng Mục 16 cho cả 5 loại |
| A3 | | không chỉ màu | đổi `tone` không đổi dash; tập dash ≥ 4 giá trị khác nhau |
| A4 | | màu phụ | class literal theo tone (`stroke-accent-secondary`, …) |
| A5 | | `showAspectLines=false` | không có `[data-layer="aspects"]` trong DOM |
| A6 | | bật lại | DOM của lớp **bằng** DOM lần bật đầu |
| A7 | `ChartWheel` | các lớp khác | số phần tử Zodiac/Tick/House/Angle/Planet **không đổi** khi bật/tắt; toạ độ marker hành tinh không đổi |
| A8 | | 0 aspect | không lớp, không lỗi (`chartNoAspects`) |
| A9 | | không nhà | `chartNoHouses`: vẽ aspect + baseline `r=175` của M5 |
| A10 | | trợ năng/tương tác | `aria-hidden="true"`, `pointer-events-none`, không `role`/`tabindex`/handler trên đường |
| A11 | | khoá/thuộc tính | `data-aspect` duy nhất; không cảnh báo React key |
| A12 | | thứ tự lớp | `AspectLayer` đứng **trước** `PlanetLayer` trong DOM |
| A13 | | toạ độ | mọi `d`/`cx`/`cy` nằm trong `viewBox` 0–600 |
| L1 | `AspectLegend` | mục | đúng số loại được vẽ; có chữ loại + nhóm |
| L2 | | trợ năng | `<ul>` có tên; mẫu nét `aria-hidden` |
| L3 | | không vẽ | 0 đường ⇒ không render |
| L4 | | axe | không vi phạm |
| SW1 | Shell | mặc định ≥ md | `installMatchMedia`: `(min-width: 768px)` = true ⇒ công tắc **checked**, lớp có |
| SW2 | | mặc định < md | false ⇒ unchecked, lớp không có |
| SW3 | | bật/tắt | click đổi trạng thái; lớp mount/unmount |
| SW4 | | bàn phím | focus + `Space` và `Enter` đổi trạng thái |
| SW5 | | vai trò & tên | `getByRole("switch", {name: "Hiện đường góc chiếu"})`; có `aria-describedby` trỏ phần tử tồn tại |
| SW6 | | đổi viewport **trước** khi chạm | mặc định đổi theo viewport |
| SW7 | | đổi viewport **sau** khi chạm | giữ lựa chọn người dùng |
| SW8 | | không đổi dữ liệu | `vm` bị đóng băng; không gọi lại `toChartViewModel`; hình học cùng tham chiếu khi bật/tắt |
| SW9 | | zero aspect | không có công tắc/legend |
| SW10 | `page.test.tsx` | đổi `chartId` | `userChoice` được reset (qua `key`) |
| SW11 | | axe | Shell: bật/tắt, có/không aspect |
| R1–R6 | hồi quy | S4.4/S4.5 | `geometry`, `wheelGeometry`, `labelLayout`, `planetGeometry`, các layer cũ, Shell S1–S7/S-W1/S-W2 chạy **không sửa** (trừ ca bổ sung đã nêu Mục 25) |

---

## 31. Acceptance Criteria

> **Chưa mục nào được đánh dấu đạt.** Trạng thái hiện tại của mọi tiêu chí: `NOT STARTED`. Chỉ chuyển sang `VERIFIED` khi có lệnh đã chạy hoặc bằng chứng thủ công đầy đủ.

| ID | Nhóm | Tiêu chí | Bằng chứng cần có |
|---|---|---|---|
| AC-G1 | Geometry | mỗi aspect hiển thị nối **đúng hai vị trí thật** | G1–G3, G5 |
| AC-G2 | | đầu mút dùng hệ toạ độ chung (`toScreenAngle`, `polarToCartesian`) | G5, review mã |
| AC-G3 | | tất định | G11, G18 |
| AC-G4 | | không có phép tính chiêm tinh ở frontend | grep + review |
| AC-G5 | | đầu vào xấu không tạo toạ độ không hợp lệ | G6, G7, G12–G17 |
| AC-R1 | Rendering | đường vẽ đúng | A1, A13 |
| AC-R2 | | thứ tự vẽ giữ hành tinh/nhãn đọc được | A12, G21, kiểm thủ công |
| AC-R3 | | số phần tử = số đầu vào vẽ được | A1, G22 |
| AC-R4 | | zero aspect không lỗi | G9, A8 |
| AC-R5 | | wheel/hành tinh hiện có nguyên vẹn | A7, R1–R6 |
| AC-N1 | Nature | loại/nature thể hiện bằng ánh xạ được duyệt | A2, A4 |
| AC-N2 | | **không chỉ màu** | A3, G24, G25 |
| AC-N3 | | ánh xạ nhất quán, test được | G25 |
| AC-V1 | Visibility | công tắc có tên truy cập | SW5 |
| AC-V2 | | tắt không ẩn phần tử khác | A7 |
| AC-V3 | | bật lại khôi phục | A6, SW3 |
| AC-V4 | | không đổi dữ liệu | SW8 |
| AC-D1 | Responsive | mặc định đúng chính sách đã duyệt | SW1, SW2 |
| AC-D2 | | dùng đúng breakpoint dự án | review mã (`768px` = `md`) |
| AC-D3 | | resize không ghi đè lựa chọn người dùng | SW6, SW7 |
| AC-Q1 | Quality | unit hình học | `aspectGeometry.test.ts` |
| AC-Q2 | | component kiểu nét + số đường | A1–A4 |
| AC-Q3 | | công tắc + breakpoint | SW1–SW10 |
| AC-Q4 | | hồi quy S4.4/S4.5 đạt | R1–R6 |
| AC-Q5 | | `typecheck`, `lint`, `format:check`, `build` | lệnh đã chạy + CI |
| AC-Q6 | | kiểm thủ công Mục 24.4 | bản ghi đủ trường |

## 32. Quality Gates

Chỉ dùng **script có thật**: `lint`, `format:check`, `typecheck`, `test`, `test:coverage`, `build`, `test:e2e` (không có `test:a11y`, `coverage`, `test:unit`).

| Thời điểm | Bắt buộc |
|---|---|
| Mỗi task | `npm run lint` · `npm run typecheck` · `npm run format:check` · `npx vitest run <phạm vi task>` |
| Trước đóng M6.4 | thêm `npm test` đầy đủ + `npm run build` + Grep Gates |
| Đóng M6 | cả 4 lệnh tĩnh + `npm run build` + `npm run test:coverage` + **CI xanh** (gồm E2E; sandbox không chạy được E2E) trên evidence commit |

**Grep Gates (định nghĩa lại cho M6):**

| Gate | Nội dung | Kỳ vọng |
|---|---|---|
| G-1 | `model/aspectGeometry.ts` không import React/DOM | 0 |
| G-2 | `ui/**` không `Math.cos/sin/atan2` | 0 |
| G-3 | từ khoá `aspect` **không** xuất hiện trong `labelLayout.ts`, `planetGeometry.ts`, `PlanetLayer.tsx` (ranh giới M5 giữ nguyên); được phép ở `ChartWheel`, `AspectLayer`, `aspectGeometry`, Shell | 0 |
| G-4 | không `zustand`, `localStorage`, `sessionStorage`, `dangerouslySetInnerHTML`, `as unknown as`, `: any`, `eslint-disable` trong file M6 | 0 |
| G-5 | không màu hex/rgb/hsl | 0 |
| G-6 | `labelLayout.ts`, `planetGeometry.ts` **không** import `aspectGeometry` (không phụ thuộc ngược) | 0 |
| G-7 | `package.json` và lockfile không đổi | đúng |
| G-8 | không `Math.random`, `Date.now`, `performance.now` trong `model/` | 0 |
| G-9 | `AspectLayer.tsx` không `onClick|onMouse|onFocus|onKey|tabIndex|role=` | 0 |
| G-10 | không `recalc` aspect: không import `KNOWN_ASPECT_*` để tìm aspect từ kinh độ; không so sánh kinh độ để suy loại | 0 |
| G-11 | CSS build có đủ mọi lớp M6 dùng: `stroke-accent-primary`, `stroke-accent-secondary`, `stroke-secondary`, `stroke-muted`, `fill-accent-primary`, `fill-accent-secondary`, `fill-secondary`, `fill-muted`, `stroke-subtle`, `pointer-events-none` | đủ (grep `dist/assets/*.css`) |
| G-12 | `PlanetLayer.tsx`, `labelLayout.ts`, `planetGeometry.ts` **không đổi** so với `bd3b619` | `git diff --stat` rỗng |

---

## 33. Risks and Mitigations

| ID | Rủi ro | Khả năng | Tác động | Giảm thiểu | Kiểm chứng |
|---|---|---|---|---|---|
| R1 | Ngưỡng breakpoint của mặc định mơ hồ (`md` vs `sm`, X1) → triển khai sai chính sách | Cao | Trung bình | chốt D-M6-08 ở M6.0; hằng `ASPECT_LINES_DEFAULT_QUERY` một nơi | SW1, SW2, AC-D2 |
| R2 | Fixture hiện có không dùng được cho hình học (không Square; aspect không khớp vị trí đã dời) | Cao | Cao | fixture DERIVED nhất quán + contract test (M6.1) | G-series, contract test |
| R3 | Kiểu nét (đứt/chấm/gạch dài) không phân biệt được ở 400 px | Trung bình | Cao | giá trị số là đề xuất; kiểm thiết bị thật; chỉnh `ASPECT_LINE_STYLES` tại một chỗ | Mục 24.4 #1 |
| R4 | Đầu mút ở kinh độ thật trong khi nhãn hành tinh bị dời → khó nối đường với hành tinh | Trung bình | Trung bình | vòng aspect mảnh làm điểm tựa; legend; marker cùng hướng xuyên tâm; đánh giá trực quan | Mục 24.4 #4 |
| R5 | Lớp CSS `stroke/fill-accent-*` thiếu trong bản build ⇒ đường vô hình (jsdom không phát hiện) | Trung bình | Cao | Gate G-11 bắt buộc sau `npm run build` | G-11 |
| R6 | Sai cờ `sweep` của cung Conjunction | Trung bình | Thấp (cung ≈ chord) nhưng vẫn là lỗi hình học | kiểm bằng tâm cung (F.6.5), cả hai hướng | G8, G19 |
| R7 | Dữ liệu aspect xấu bị bỏ qua lặng lẽ, không log tập trung | Thấp | Thấp | VM đã ghi `issues`; `skipped` có lý do được test; owner quyết định có log thêm hay không | G6–G17 |
| R8 | Nhãn công tắc "góc chiếu" làm vỡ truy vấn `getByText(/góc chiếu/i)` trong test cũ | Trung bình | Thấp | rà soát trước; thu hẹp truy vấn, **không** làm yếu | M6.5 bước 4 |
| R9 | Màu brass-500 (sáng) không đạt tương phản đồ hoạ 3:1 trên nền wheel | Trung bình | Trung bình | đo thủ công; nếu thiếu, tăng độ dày/đổi token (cần duyệt) | Mục 24.4 #2 |
| R10 | `userChoice` rò sang chart khác (Shell tái dùng) | Thấp | Thấp | `key={chartId}` | SW10 |
| R11 | Phình phạm vi sang S4.8 (nổi/mờ, chọn, `role=button`) | Trung bình | Trung bình | G-9, mục Out of Scope, review | G-9 |
| R12 | `Switch.description` không nối `aria-describedby` → mô tả không được đọc | Cao (đã xác nhận) | Thấp | phần tử gợi ý riêng + `aria-describedby` qua props; ghi KG-M6-03 | SW5 |
| R13 | Bằng chứng thủ công M5 (`AC-Q4`) vẫn thiếu, kéo theo thiếu bằng chứng thị giác M6 | Cao | Trung bình | gộp đợt kiểm thiết bị M5+M6 | M6.5 |
| R14 | Aspect trùng/mơ hồ bị bỏ khỏi wheel nhưng vẫn ở bảng → lệch giữa hình và bảng | Thấp | Thấp | ghi `skipped`; test; thông báo ở Known Gaps | G12, G14 |
| R15 | Phiên bản Node 20 của `actions/checkout@v4`, `setup-node@v4` bị cảnh báo deprecated trong CI | Thấp | Thấp (chưa chặn) | ngoài M6; ghi nhận | `[ci]` annotation |

## 34. Known Gaps and Unresolved Decisions

### 34.1 Decision Log

| Decision | Existing Evidence | Recommendation | Alternatives | Status |
|---|---|---|---|---|
| **D-M6-01** Chord vs arc | F4 plan §21: Conjunction = cung ngắn, còn lại chord; prompt ưu tiên chord | chord cho 4 loại, **cung** cho Conjunction, **chấm** khi suy biến | chord cho cả Conjunction (đơn giản, thị giác giống nhau: lệch 0,14–0,41 đơn vị) | **CONFIRMED** |
| **D-M6-02** Bán kính vòng aspect & vẽ vòng | D-S45-03 (≤ 108, đã duyệt); `planetZoneInner=114`; F4 plan §17 "≈110" | `aspectRing = 108` + vòng `stroke-subtle` mảnh làm điểm tựa | 104 (khe rộng hơn); không vẽ vòng | **CONFIRMED (Owner)** — chọn 108; vẽ vòng tham chiếu mảnh phi tương tác, tạo khe 6 đơn vị với `planetZoneInner` |
| **D-M6-03** Đầu mút ở kinh độ thật | F4 plan §21 | dùng `toScreenAngle(longitude)`, không dùng góc nhãn | neo vào marker hay nhãn | **CONFIRMED** |
| **D-M6-04** Phân loại nature | F4 plan §5.4/§21, `labels.ts` (`tone`), UI Spec §12.11 | dùng `nature` của Backend; kiểu nét theo loại; không tự phân loại | suy nature từ loại | **CONFIRMED** (nguồn Backend); nhãn "Căng thẳng" theo `labels.ts` |
| **D-M6-05** Ánh xạ kiểu nét (giá trị số) | F4 plan §21 (tên kiểu); chưa có số | bộ thông số Mục 16: width 1.5 (cấp 1), 2.5 (cấp 2), 3 (cấp 3); dash `1 5`, `8 5`, `16 6`; round cap cho dot/Conjunction; không bật `non-scaling-stroke` mặc định | độ dày/dash khác | **CONFIRMED (Owner)** — chuẩn hoá thông số, kiểm tra độ rõ trên thiết bị thực tế |
| **D-M6-06** Thứ tự vẽ SVG | cấu trúc layer M4/M5 | … → Angle → **Aspect** → Planet; trong lớp `orb ↓` | aspect trên hành tinh | **CONFIRMED** |
| **D-M6-07** Vị trí công tắc | F4 plan dòng 380; Shell hiện tại | thanh công cụ trên wheel, trong cùng `Card`; legend dưới | trong header Shell; dưới wheel | **CONFIRMED** |
| **D-M6-08** Mặc định theo breakpoint | F4 plan §21/S4.9/bảng 730 ⇒ `md`; §28 ⇒ `sm`; code dùng `sm` cho bảng/thẻ | bật từ `md` (768px), tắt dưới `md`. Breakpoint chỉ xác định giá trị khởi tạo; resize không ghi đè lựa chọn người dùng | ngưỡng `sm` (640); luôn bật; luôn tắt | **CONFIRMED (Owner)** — phân biệt breakpoint visibility (`md` 768px) với breakpoint bố cục chart (`sm` 640px). Test 639/640px, 729/730px, 767/768px |
| **D-M6-09** Hành vi khi đổi viewport | prompt: không ghi đè lựa chọn người dùng | `userChoice ?? matchesMd` | chỉ khởi tạo một lần; luôn theo viewport (loại) | **CONFIRMED** |
| **D-M6-10** State cục bộ vs Context | F4 plan §27: cục bộ, "Zustand không biện minh" | `useState` trong `ChartViewerShell` | Context; Zustand (loại) | **CONFIRMED** (cục bộ); tên container thực tế là Shell |
| **D-M6-11** Unmount vs ẩn | lớp trang trí `aria-hidden` | **unmount** | `display:none`/`opacity` | **CONFIRMED** |
| **D-M6-12** Dữ liệu aspect xấu | VM đã lọc & ghi issue; `ASPECT_ENDPOINT_MISSING` vẫn giữ mục | không ném; trả `skipped` có lý do; không bịa đầu mút | ném lỗi; thay thế hành tinh | **CONFIRMED** |
| **D-M6-13** Legend | WCAG 1.4.1 (bảng đã đủ); kiểu nét cần chú giải | `AspectLegend` data-driven (mẫu nét thực tế, tên nhóm nature, màu bổ trợ), dùng chung cấu hình mapping với `AspectLayer` | không legend, chỉ dựa vào bảng | **CONFIRMED (Owner)** |
| **D-M6-14** Zero line | prompt: không lỗi khi 0 aspect | ẩn công tắc + legend | hiện công tắc vô hiệu hoá | **CONFIRMED** |
| **D-M6-15** Reset khi đổi chart | `page.tsx` không có `key` | `key={chartId}` | `useEffect` đặt lại | **CONFIRMED** |
| **D-M6-16** Loại không hỗ trợ | VM giữ + `UNKNOWN_VALUE` | **không vẽ** (vẫn ở bảng) | vẽ kiểu fallback | **CONFIRMED** |
| **D-M6-17** Trùng/mơ hồ | VM giữ mục trùng | bỏ qua mục trùng sau; đầu mút mơ hồ bỏ qua | vẽ tất cả | **CONFIRMED** |
| **D-M6-18** Nơi tính hình học | mẫu `geometry?`/`planetModel?` | tính trong Shell, truyền prop; `ChartWheel` dự phòng | chỉ trong `ChartWheel` | **CONFIRMED** |
| **D-M6-19** Fixture | X4, X5, fixture DERIVED sai khớp | `chartNoAspects`, `chartAllAspects` (DERIVED) | dựng tay trong test | **CONFIRMED** |
| **D-M6-20** Chọn/hover/làm nổi | F4 plan S4.8 | không làm trong M6; chỉ để `data-aspect` | — | **DEFERRED** (S4.8) |
| **D-M6-21** Copy (nhãn công tắc, gợi ý, figcaption, nhãn nhóm) | UI dùng "Góc chiếu"; `labels.ts` "Căng thẳng" | Switch: "Hiện đường góc chiếu"; Gợi ý: "Bật hoặc tắt các đường nối góc chiếu giữa các hành tinh trên biểu đồ."; Nhóm: "Căng thẳng"; Figcaption: "Các đường nối thể hiện góc chiếu giữa các hành tinh. Kiểu nét giúp phân biệt nhóm góc chiếu; xem chú giải để biết ý nghĩa từng kiểu." | "Thử thách" (F4 plan §24) | **CONFIRMED (Owner)** — dùng "Góc chiếu" và "Căng thẳng", nguồn label dùng chung |

**Toàn bộ 21 quyết định kỹ thuật đã được phê duyệt.** Không còn câu hỏi mở nào chặn việc viết mã.

### 34.2 Known Gaps

| ID | Nội dung | Xử lý |
|---|---|---|
| KG-M6-01 | `AC-Q4` thủ công M5 chưa có bằng chứng | gộp với kiểm thủ công M6 (Mục 24.4) |
| KG-M6-02 | F4 plan v1.1 còn mâu thuẫn X1–X7 | sửa ở M6.0 (docs-only) |
| KG-M6-03 | `Switch.description` không nối `aria-describedby` | né bằng phần tử riêng; không sửa component dùng chung trong M6; đề xuất backlog |
| KG-M6-04 | Coverage nhánh `labelLayout.ts` 91,52% (< 95% nếu hiểu "câu lệnh/nhánh") | ghi nhận, không chặn |
| KG-M6-05 | Loại aspect Backend mới (ngoài 5 loại) không được vẽ trên wheel | vẫn ở bảng; có test; theo dõi hợp đồng Backend |
| KG-M6-06 | Đường aspect chưa có tương tác (nổi/mờ/chọn) | S4.8 |
| KG-M6-07 | Không log tập trung khi bỏ qua aspect | owner quyết định ở tích hợp (R7) |
| KG-M6-08 | Tương phản đồ hoạ 3:1 và độ đọc kiểu nét chưa đo | Mục 24.4 |
| KG-M6-09 | Bản có dấu của "độ lệch ngắn nhất" nằm trong `aspectGeometry.ts` thay vì `geometry.ts` | cân nhắc gom ở dọn dẹp sau |
| KG-M6-10 | Cảnh báo Node 20 deprecation của GitHub Actions | ngoài M6 |

## 35. Definition of Done

M6 chỉ được coi là xong khi **tất cả** đều đúng, mỗi mục kèm bằng chứng đã chạy:
1. M6.0–M6.6 hoàn tất theo thứ tự; commit docs-only tách khỏi commit `frontend/**`.
2. Năm quyết định chặn (Mục 34.1) đã có phản hồi của owner và được ghi trong Evidence Matrix.
3. `aspectGeometry.test.ts` (G1–G25), `AspectLayer`/`AspectLegend`/`ChartWheel`/Shell/page tests (A, L, SW) đạt; coverage `aspectGeometry.ts` ≥ 95% câu lệnh và nhánh.
4. Hồi quy S4.4/S4.5 đạt; không test cũ bị xoá hoặc làm yếu; mọi thay đổi test cũ được liệt kê kèm lý do.
5. Grep Gates G-1…G-12 sạch; `package.json`/lockfile không đổi; `labelLayout.ts`, `planetGeometry.ts`, `PlanetLayer.tsx` không đổi.
6. `lint`, `format:check`, `typecheck`, `build`, `test`, `test:coverage` đạt (đã chạy); **CI xanh** trên evidence commit kèm link.
7. Kiểm thủ công Mục 24.4 có bản ghi đủ trường, hoặc từng mục thiếu được ghi `ACCEPTED GAP` có chủ sở hữu.
8. `Sprint_F4_M6_Exit_Criteria_Evidence_Matrix.md` nằm trong `archive/sprint-f4/`; blueprint này được xoá; Known Gaps cập nhật.
9. Không có phép tính chiêm tinh mới ở frontend; không Zustand/localStorage; không dependency mới.

## 36. Final Architect Review

| Hạng mục | Đánh giá |
|---|---|
| **Roadmap compliance** | F4 plan v1.1 giữ nguyên; O-F4-2 = Phương án B được xác minh (milestone FE-S4.11, matrix M11); thứ tự S4.4 → S4.5 → **S4.6** → S4.8 không đổi. Ghi nhận mâu thuẫn bên trong F4 plan (X1–X7) thay vì "chọn lặng lẽ". |
| **Prerequisites** | S4.4 và S4.5 **đủ** cho M6: hạ tầng toạ độ, `trueAngle`, ranh giới vành nhãn, `rotation`. Mã và CI #269 xanh; các cổng tĩnh và suite chart được chạy lại độc lập. **Chưa đủ:** bằng chứng thủ công M5 (`AC-Q4`) — không chặn mã, chặn nghiệm thu thị giác. |
| **Geometry correctness** | Đầu mút dùng cùng `toScreenAngle`/`polarToCartesian` với marker hành tinh, trên vòng `r=108` tại kinh độ thật; bất biến I1–I9 và G1–G25 kiểm bằng số; cung Conjunction kiểm bằng tâm cung. Giới hạn trung thực: cung ≈ chord (lệch ≤ 0,41 đơn vị); hình dạng quyết định thị giác thật là độ dày và đầu tròn. |
| **Visual distinction** | 5 loại ⇒ 5 kiểu nét riêng + độ dày theo nhóm; màu chỉ phụ; legend chữ; test G24/G25/A3 chứng minh không phụ thuộc màu. **Chưa kiểm** trên thiết bị (R3, R9). |
| **State architecture** | `useState` cục bộ trong Shell, không lưu trữ, không Zustand/Context; hình học tính ngoài lớp nên bật/tắt rẻ; reset theo chart qua `key`. |
| **Responsive defaults** | Breakpoint lấy từ `tailwind.config.ts`, hook sẵn có; chính sách `userChoice ?? matchesMd` không ghi đè lựa chọn; **ngưỡng `md` (768px) đã được Owner phê duyệt (D-M6-08)**, phân biệt rõ với breakpoint bố cục chart. |
| **Accessibility** | Công tắc: `role="switch"`, tên thật, Space/Enter, vùng chạm 44 px, focus ring có sẵn; lớp aspect `aria-hidden`, không điểm dừng focus thừa; Aspect Table luôn đầy đủ. Hạn chế đã biết: `Switch.description` không nối aria ⇒ dùng phần tử riêng. |
| **Testing** | Hình học số học, kiểu nét, số đường, hiển thị, công tắc, breakpoint, hồi quy, axe đều có ca cụ thể; fixture nhất quán được thêm vì fixture cũ không đủ. Lớp CSS thiếu được bắt bằng Gate G-11 (bài học M4). |
| **Scope** | Pattern aspect, ma trận aspect, tương tác, zoom, tính lại aspect, Zustand, lưu trữ: **loại trừ rõ**. Hai tuỳ chọn mở rộng nhỏ (legend, `key={chartId}`) được đánh dấu để owner duyệt, không lặng lẽ thêm. |
| **Bàn giao cho S4.8** | `data-aspect`/`data-type`/`data-nature` trên đường, `data-planet` trên hành tinh (M5), `userChoice` ở Shell; lớp aspect đã `pointer-events-none` nên S4.8 chọn cách bật tương tác có chủ đích. |

## 37. Final Recommendation

**`READY FOR IMPLEMENTATION`**

Không có blocker kỹ thuật: S4.4/S4.5 đủ, dữ liệu aspect đủ, mọi công cụ cần thiết đã có trong repo, không cần dependency mới.

**Trạng thái phê duyệt:**
1. **Toàn bộ 5 quyết định mở đã được Owner phê duyệt:** D-M6-02 (bán kính 108 + vòng tựa mảnh), D-M6-05 (bộ thông số kiểu nét chuẩn hóa), D-M6-08 (ngưỡng `md` 768px cho aspect visibility), D-M6-13 (AspectLegend data-driven), D-M6-21 (copy chuẩn hóa tiếng Việt).
2. **Task M6.0 docs-only đã hoàn thành:** sửa dòng `AC-Q3` của matrix M5 (trỏ CI #269) và đồng bộ F4 plan v1.1.
3. **Kiểm thủ công `AC-Q4` của M5** gộp chung đợt với kiểm thủ công M6 (Mục 24.4).

**Hành động tiếp theo:** Bắt đầu triển khai **Task M6.1 — Hằng số và Fixture** và **Task M6.2 — Hình học aspect thuần**.
