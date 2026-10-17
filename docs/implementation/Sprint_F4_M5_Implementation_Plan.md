# AstroViet — F4 S4.5 Implementation Plan
## Planet Rendering

**Phiên bản:** v1.0 (bản nháp để owner duyệt) · **Ngày audit:** 2026-10-17 · **Repo:** `KhongphaiHphuc0705/astroviet`, nhánh `dev`, HEAD `398d68b`
**Phạm vi tài liệu:** chỉ lập kế hoạch. Không có file nào trong repo bị sửa; không cài dependency vào repo.
**Vị trí đề xuất khi commit:** `docs/implementation/Sprint_F4_S4_M5_Implementation_Plan.md` (blueprint tạm thời, xoá khi S4.5 đóng — theo quy ước đã chốt; chỉ Evidence Matrix được lưu archive).

**Quy ước trạng thái:** `VERIFIED` (đã đọc mã/chạy lệnh trong audit) · `PARTIALLY VERIFIED` · `UNVERIFIED` · `BLOCKED` · `DEFERRED` · `NOT APPLICABLE`.
**Nguồn bằng chứng:** `[repo]` đọc mã/tài liệu · `[run]` chạy lệnh thực tế trong sandbox · `[proto]` prototype tạm ngoài repo (không phải kết quả nghiệm thu) · `[owner]` quyết định của owner.

---

## 1. Executive Summary

S4.5 vẽ **hành tinh** lên Chart Wheel đã có từ S4.4: glyph, ký hiệu nghịch hành `℞`, vạch đánh dấu **vị trí thật**, nhãn độ, đường nối khi nhãn bị dời, và thuật toán dàn nhãn thuần – tất định – xử lý vòng 0°/360°.

Kết quả audit có **bốn phát hiện làm thay đổi thiết kế** so với F4 plan v1.1 §18:

1. **Ngân sách bán kính rất hẹp.** Vòng nhà kết thúc ở `r = 175`; F4 plan §17 dành `r ≈ 110` cho vòng aspect (S4.6). Vùng nhãn hành tinh chỉ còn ≈ **50 đơn vị** chiều sâu. Nhãn xếp chồng "glyph + `D°MM′`" (rộng 57,6 × cao 36) **không thể** dàn hết cho lá số thật của repo (`fixture_full`: Uranus 275,8° · Sun 280,5° · Neptune 282,0° · Saturn 285,6° · Mercury 295,8°ʀ · Venus 306,3°ʀ) `[proto]`.
2. **Không font tự host nào chứa glyph hành tinh, `℞` hay `U+FE0E`.** Đã đọc bảng `cmap` của cả 7 file `.woff2` `[run]`. Mọi glyph chiêm tinh dựa vào font hệ điều hành. Ngoài ra `PLANET_LABELS` **không có** `U+FE0E` (chỉ `SIGN_LABELS` có), trong khi F4 plan §18 yêu cầu có.
3. **Mâu thuẫn trợ năng đã hẹn từ M4.** `D-M4-5`/`KG-M4-09` hẹn đổi `svg role="img"` → `role="group"` "ở S4.5/S4.8"; F4 plan §a11y (dòng 425) mô tả `role="button"` — nhưng prompt S4.5 cấm ngữ nghĩa tương tác. Cần chốt: S4.5 đổi sang `group` + từng hành tinh `role="img"` (không tương tác); `button` để S4.8.
4. **Vị trí vạch đánh dấu:** F4 plan §18 ghi "vạch nhỏ trên vòng chia độ" (`r 215–225`). Đường nối từ đó vào vùng nhãn sẽ **cắt vòng nhà** (số nhà ở `r=195`, 12 đường đỉnh nhà). Đề xuất đặt vạch ở **mép trong vòng nhà** (`r 175→168`).

**Thiết kế đề xuất (tóm tắt):** thuật toán *cluster-merge spreading* theo từng "tier": **Tier A** (glyph + `℞` + độ nguyên `D°`, một làn) nếu mọi nhãn dời $\le 30.0^\circ$ (tính theo độ lệch cực đại quanh tâm); nếu không, **Tier B** (chỉ glyph + `℞`, một làn, không giới hạn dời, độ vẫn có ở aria/bảng). Chữ luôn $\ge 16$ đơn vị viewBox $\Rightarrow \ge 10.67\text{ CSS px}$ tại khung tối thiểu 400px. Mọi tier chọn theo **toàn biểu đồ** (không trộn), tất định, không ngẫu nhiên, không thư viện mới.

**Trạng thái kết luận: `APPROVED & READY`** — Toàn bộ 6 quyết định bắt buộc (D-S45-02, 03, 04, 07, 08, 09) và các nguyên tắc triển khai đã được Owner chính thức phê duyệt; Task S4.5.0 đã hoàn tất; sẵn sàng triển khai mã nguồn từ S4.5.1.

---

## 2. Sprint Context and Approved Execution Order

| Mục | Nội dung | Trạng thái |
|---|---|---|
| Sprint | **Frontend Sprint F4 — Natal Chart Viewer** (không phải "Interpretation Engine"; đó là Backend Sprint 4, đã đóng `v0.4.0`) | `[owner]` xác nhận |
| Plan | F4 plan v1.1, O-F4-2 phương án B (đã có S4.11 Saved Charts List) | `[repo]` VERIFIED |
| Thứ tự | S4.1 → S4.2 → S4.3 → S4.11 → S4.7 → **S4.4** → **S4.5** → S4.6 → S4.8 → S4.9 → S4.10 | giữ nguyên |
| Đã xong | S4.1, S4.2, S4.3, S4.11, S4.7, S4.4 (HEAD `398d68b`, Frontend CI #263 Success theo báo cáo owner) | `[repo]` Evidence Matrix M1–M4, M7, M11 có trong `archive/sprint-f4/` |
| Đang lập plan | **S4.5** (tên trong hội thoại: M5) | — |
| Sau S4.5 | S4.6 aspect → S4.8 tương tác → S4.9 hardening → S4.10 E2E | không đổi |

**Ghi chú ánh xạ tên:** "M5" trong hội thoại = `FE-S4.5`. Evidence Matrix sẽ đặt tên `Sprint_F4_M5_Exit_Criteria_Evidence_Matrix.md`.

---

## 3. Objective and Scope

**Mục tiêu:** vẽ hành tinh lên wheel với vị trí chính xác và nhãn dễ đọc, không chồng, tất định.

**Trong phạm vi:**
1. Glyph hành tinh (10 hành tinh lõi; thể hiện an toàn cho thân thể `known=false`).
2. Chỉ báo nghịch hành `℞` từ `PlanetVM.isRetrograde`.
3. Vạch vị trí thật (marker).
4. Thuật toán dàn nhãn tất định (`model/labelLayout.ts`).
5. Đường nối (leader) marker → nhãn bị dời.
6. Xử lý biên 0°/360°.
7. Nhãn độ trên wheel.
8. Chữ ≥ 10 CSS px tại kích thước hiển thị tối thiểu được hỗ trợ.
9. Unit test thuật toán + component test SVG/aria.
10. **Chore S4.5.0** (do owner bàn giao từ review M4): xem Mục 26.

### 3.1 Ràng buộc thực thi bắt buộc (Implementation Constraints)

1. **Bảo toàn vị trí thật (True Positions):** Toạ độ vạch marker luôn ở vị trí góc thật của hành tinh (`r = 175 → 168`); chỉ có vị trí hộp nhãn mới được phép dịch dời để chống va chạm. Không bao giờ dời marker để xử lý va chạm nhãn.
2. **Dàn nhãn tất định (Deterministic Layout):** Thuật toán dàn nhãn phải thuần túy, tất định 100%, không phụ thuộc thứ tự mảng đầu vào và không sử dụng bất kỳ yếu tố ngẫu nhiên/thời gian nào.
3. **Xử lý biên $0^\circ/360^\circ$ tuần hoàn (Circular Adjacency):** Xử lý $0^\circ$ và $360^\circ$ như các vị trí kề cận trên một vòng tròn đóng.
4. **Cỡ chữ hiển thị $\ge 10\text{ CSS px}$:** Tuyệt đối không thu nhỏ cỡ chữ dưới 10 CSS px tại kích thước biểu đồ tối thiểu được hỗ trợ (400px).
5. **Không cài đặt hành vi tương tác:** Tuyệt đối không gắn `role="button"`, `tabIndex`, hover, click, hay chọn hành tinh trong S4.5 (phạm vi riêng của S4.8).
6. **Bảo toàn ranh giới S4.6 & bán kính hub:** Giữ việc vẽ đường góc chiếu ở S4.6 và áp dụng ràng buộc bán kính hub aspect tối đa $\le 108$ (vùng nhãn hành tinh chiếm `[114, 167)`).
7. **Bất biến hợp đồng dữ liệu:** Không thay đổi hay mở rộng View Model (`ChartViewModel`) và hợp đồng tính toán Backend để phục vụ các quyết định này.

---

## 4. Out of Scope

| Hạng mục | Thuộc về |
|---|---|
| hover, click, chọn hành tinh/aspect, đồng bộ bảng ↔ wheel, `role="button"`, `tabIndex` trên hành tinh | **S4.8** |
| đường aspect, vòng aspect, lọc aspect | **S4.6** |
| zoom/pan, bố cục hai cột `lg`, skip link, `SkeletonChartWheel` | S4.9 / hoãn (KG-M4-04/05/06) |
| thay đổi Backend, `ChartResponse`, tính toán thiên văn | ngoài F4 |
| Zustand/store mới, thư viện hình học/biểu đồ mới | cấm |
| diễn giải (interpretation) | ngoài F4 |
| nguyên tố cung (Element) | KG-M2-02/KG-M4-02 |
| thân thể tuỳ chọn (Chiron, Lilith, Nút) *ở mức yêu cầu sản phẩm* | mặc định `includeOptionalPoints: []`; layer vẫn phải chịu được (Mục 7) |

---

## 5. Repository Audit

| Hạng mục | Bằng chứng | Trạng thái |
|---|---|---|
| Clone `dev`, HEAD `398d68b` (2026-10-16), working tree sạch | `[run]` `git log`, `git status` | VERIFIED |
| `frontend/package.json` `0.2.0`; scripts: `lint`, `format:check`, `typecheck` (`tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit`), `test`, `test:coverage`, `test:e2e`, `build` | `[repo]` | VERIFIED |
| Không có script `coverage`/`test:unit` riêng; không có script `test:a11y` | `[repo]` | VERIFIED (ghi nhận, không thay thế bằng lệnh tự chế) |
| Vitest + jsdom + `vitest-axe`; `setupFiles ./src/test/setup.ts`; E2E loại khỏi vitest | `vite.config.ts` | VERIFIED |
| `model/`: `chartViewModel.ts` (864 dòng), `format.ts`, `geometry.ts`, `labels.ts`, `wheelGeometry.ts` (+ test). **Chưa có `labelLayout.ts`** | `[repo]` | VERIFIED |
| `ui/ChartWheel/`: `ChartWheel`, `ZodiacLayer`, `TickLayer`, `HouseLayer`, `AngleLayer` (+ test), `index.ts` barrel. **Chưa có `PlanetLayer`** | `[repo]` | VERIFIED |
| `ui/ChartBadges/PlanetGlyph.tsx` (HTML, dùng ở bảng) đã dùng `RETROGRADE_GLYPH` và `sr-only ", nghịch hành"` | `[repo]` | VERIFIED |
| Fixture: `api/mocks/fixtures.ts` (`chartFull`, `chartNoHouses`); bản CAPTURED ở `archive/sprint-f4/evidence/fixture_{full,nohouse}.json` | `[repo]` | VERIFIED |
| Chưa chạy lại `lint`/`typecheck`/`build`/`vitest` trong audit này; con số 118 file / 804 test lấy từ Evidence Matrix M4 và summary | — | **UNVERIFIED trong phiên này** |

**Cài đặt trong sandbox (ngoài repo):** `fonttools`, `brotli` (pip) chỉ để đọc `cmap`/`hmtx` của font; prototype ở `/home/claude/scratch`. Không có thay đổi trong repo.

---

## 6. S4.4 Preconditions and Verified Deliverables

| Deliverable S4.4 | S4.5 dùng lại thế nào | Trạng thái |
|---|---|---|
| `geometry.ts`: `WHEEL_VIEWBOX_SIZE=600`, `WHEEL_CENTER=300`, `WHEEL_RADII` | thêm hằng số bán kính hành tinh vào **cùng** `WHEEL_RADII` (D-M4-11) | VERIFIED |
| `normalizeLongitude`, `toScreenAngle(λ, rotation)`, `polarToCartesian`, `roundCoord`, `sectorMidAngle` | **tái dùng toàn bộ**; không thêm helper chuẩn hoá góc cạnh tranh | VERIFIED |
| Quy ước: `θ = normalize(180 + (λ − rotation))`, ngược chiều kim đồng hồ, ASC ở 180° (trái); `rotation = vm.flags.ascendantLongitude ?? 0` | marker/nhãn dùng đúng `toScreenAngle`; **xoay áp đúng một lần** (không `transform=rotate`) | VERIFIED |
| `WheelGeometry.rotation` | PlanetLayer nhận `rotation` từ đây, không tự tính lại | VERIFIED |
| Mẫu layer: `<g data-layer="…" aria-hidden="true">`, props `center`/`radii`, class token `fill-primary`/`stroke-strong`/`font-display`/`font-data`, không hex | PlanetLayer theo cùng mẫu (nhưng **không** `aria-hidden` ở gốc) | VERIFIED |
| `ChartWheel`: nhận `vm`, `geometry?`; `useMemo`; `svg role="img"`, `viewBox 0 0 600 600`, `min-w-[400px] max-w-[640px]` | điểm tích hợp | VERIFIED |
| Grep gates M4 (model không React/DOM; UI không `Math.cos/sin/atan2`; không `planets` trong wheel; không `zustand`/`useState`…) | **Gate 3 phải được định nghĩa lại** cho S4.5 (Mục 23) | VERIFIED |

**Prerequisite gap / blocker:** không có blocker. Hai điểm cần xử lý *trong* S4.5 vì S4.4 để lại: (a) `KG-M4-09` (aria-label của `<text>` góc không được đọc dưới `role="img"`), (b) `figcaption` + `buildWheelDescription` + test `C14`/`C15` đang khẳng định "chưa có hành tinh" — phải cập nhật có chủ đích.

---

## 7. Existing Planet Data Contract

Nguồn: `PlanetVM` (`chartViewModel.ts`) `[repo]` VERIFIED; `buildPlanets` ở dòng ≈ 255–372.

| Trường `PlanetVM` | Kiểu | Đảm bảo | Dùng cho S4.5 |
|---|---|---|---|
| `key` | `string` | không rỗng; **không đảm bảo duy nhất** (`DUPLICATE_ENTITY` chỉ ghi issue, vẫn giữ cả hai) | id ổn định; cần hậu tố khi trùng |
| `nameVi` | `string` | luôn có (fallback nếu lạ) | aria |
| `glyph` | `string \| null` | `null` khi `known=false` | glyph; fallback khi null |
| `known` | `boolean` | | quyết định fallback glyph |
| `longitude` | `number` | **hữu hạn, `[0, 360)`** (entry sai bị loại với `ENTRY_DROPPED`) | vị trí thật |
| `sign` | `GlyphLabel` | | aria |
| `degreeLabel` | `string \| null` | `D°MM′`, **cắt xuống phút**; `null` nếu `degreeInSign` ngoài `[0,30)` | nhãn độ (Option 1) |
| `houseNumber` | `number \| null` | `null` khi không có nhà | aria (bỏ khi null) |
| `isRetrograde` | `boolean` | **bắt buộc boolean** — entry thiếu/không phải boolean bị loại (`hasValidRetrograde`) | `℞` |
| `ariaLabel` | `string` | `"{tên}"` hoặc `"{tên}, nghịch hành"` (không có cung/độ/nhà) | nền cho aria wheel |

**Kết luận hợp đồng:**
- **Nghịch hành không bao giờ `null`/thiếu** tới được layer ⇒ không có nhánh "thiếu dữ liệu ≠ false". Thiếu → hành tinh bị loại khỏi VM (đã có issue). Không suy luận từ chuyển động. VERIFIED.
- Thứ tự `vm.planets` đã chính tắc (`PLANET_ORDER_MAP`), nhưng layout **không được phụ thuộc** vào thứ tự mảng (Mục 13).
- **`PlanetVM` không có số `degreeInSign`**, chỉ có chuỗi `degreeLabel`. Hiển thị `D°` (Phương án 2, Mục 16) suy ra từ chính `degreeLabel` bằng hàm thuần, **không** cần sửa VM; chỉ Phương án 3 mới thêm trường `degreeInSign` — xem D-S45-04.
- Đã có: `RETROGRADE_GLYPH = "℞"` (U+211E), `RETROGRADE_LABEL_VI = "Nghịch hành"` `[repo]`.
- Fixture thật `fixture_full`: 10 hành tinh, ASC 14,891°, **3** hành tinh nghịch (Mercury, Venus, Jupiter), **không có hành tinh gần 0°** (cần fixture tổng hợp cho biên). `[run]` đọc JSON.

---

## 8. Current Chart Wheel Architecture

```
ChartViewerShell ──useMemo(buildWheelGeometry(vm))──► <ChartWheel vm geometry/>
                                                        ├─ <svg role="img" viewBox 600 aria-labelledby/-describedby>
                                                        │    ZodiacLayer → TickLayer → HouseLayer → AngleLayer
                                                        └─ <figcaption> "…Vị trí hành tinh xem ở các bảng bên dưới."
```

Bán kính hiện có (`WHEEL_RADII`): `signOuter 260`, `signInner 225`, `tickOuter 225`, `tickInner 215`, `houseOuter 215`, `houseInner 175`, `angleLabel 282`. Số nhà ở `r=195`; đường đỉnh nhà vẽ `175→225`; vòng tròn `r=175` **chỉ vẽ khi có nhà** (`HouseLayer` trả `null` khi không có nhà). Vùng `r < 175` hiện **trống**.

Cỡ chữ hiện có (đơn vị viewBox): glyph cung 18, số nhà 16, nhãn góc 16 ⇒ nhất quán với chính sách ≥ 16.

---

## 9. Target Rendering Architecture

```
ChartViewModel.planets (PlanetVM[])            // không bị sửa
      │  buildPlanetWheelModel(vm.planets, rotation, tierPolicy)   [model/planetGeometry.ts]
      │      ├─ chuẩn bị PlanetLabelInput[] (id, longitude, hasRx, degreeText, glyphText)
      │      └─ layoutPlanetLabels(inputs, config)                 [model/labelLayout.ts — thuần]
      ▼
PlanetWheelModel { tier, planets: PlanetRenderItem[] }
      ▼
<PlanetLayer model={…} />                       [ui/ChartWheel/PlanetLayer.tsx — chỉ render]
      ├─ <g aria-hidden> connectors + markers </g>
      └─ <g> <g role="img" aria-label> glyph · ℞ · độ </g> × N </g>
```

**Hai file model (đề xuất, khác F4 plan chỉ liệt kê `labelLayout.ts`):**
- `labelLayout.ts` — thuật toán thuần trên **dữ liệu trình bày** (id, kinh độ, kích thước ước lượng); *không* import `ChartViewModel`.
- `planetGeometry.ts` — cầu nối `PlanetVM → input`, tính toạ độ marker/leader, chuỗi aria; mirror cách tách `geometry.ts`/`wheelGeometry.ts` (D-M4-8). Lý do: giữ thuật toán độc lập VM, test không cần dựng VM. Nếu owner muốn đúng một file, có thể gộp (Mục 32, D-S45-13).

Thứ tự vẽ SVG: `Zodiac → Tick → House → Angle → Planet` (hành tinh ở trên cùng; không chồng vì vùng hành tinh `r < 168`). Trong `PlanetLayer`: connectors/markers trước, nhãn sau (nhãn che đường nối).

---

## 10. Planet Glyph Strategy

**Quyết định D-S45-01 — Glyph = ký tự Unicode trong `<text>` SVG, dùng font hệ thống làm fallback.**

| Khía cạnh | Quyết định |
|---|---|
| Nguồn | `PlanetVM.glyph` (từ `PLANET_LABELS`), đúng UI Spec §5.1 và Design System §2 (glyph Unicode là nguồn duy nhất cho biểu tượng domain; cấm trộn Lucide) |
| Định danh ổn định | `data-planet={id}` (id = `key`, hậu tố `#2`… khi trùng) |
| Kết xuất | `<text textAnchor="middle" dominantBaseline="central" fontSize={18} className="fill-primary font-display" aria-hidden>`; **cùng mẫu** `ZodiacLayer` |
| `U+FE0E` | thêm vào **nguồn** `PLANET_LABELS` cho **Venus (♀ U+2640) và Mars (♂ U+2642)** — **ĐÃ XÁC MINH UNICODE**: Dữ liệu Unicode `emoji-data.txt` (2024-05-01) liệt kê U+2640 và U+2642 là Emoji (E4.0) có chuỗi Variation Sequence `\uFE0E` chuẩn. Kiểm chứng bằng Python `emoji 2.16.0` xác nhận trong 10 glyph hành tinh, **chỉ ♀ và ♂ là emoji**, còn `℞` và 8 glyph khác thì không. Sửa ở nguồn để bảng và wheel nhất quán. Kiểm thử trực quan trên trình duyệt thật vẫn là bước bắt buộc (22.4 #1) |
| Fallback khi `glyph === null` | hiển thị 2 ký tự đầu của `nameVi` (font UI), vẫn có aria đầy đủ; test có ca `known=false` |
| Kích thước | glyph 18 đơn vị (≥ 12 px tại 400 px); hộp ước lượng `w = 1,1 × 18 = 19,8`, `h = 18` (hệ số 1,1 bảo thủ vì font fallback không đo được) |
| Tương phản | token `fill-primary` (M4 đã đo tương phản ≥ 4,5:1 cho cùng token ở cả 2 theme — nhưng **chưa có số đo cụ thể**, xem Mục 22.4 và Phụ lục A) |
| Phương án đã loại | SVG path tự vẽ cho 10 glyph (thêm tài sản, chi phí duy trì; UI Spec §5.1 cấm minh hoạ riêng); `lucide-react` (cấm bởi Design System §2); web-font glyph chiêm tinh (thêm dependency/giấy phép/dung lượng) |

**Rủi ro font (bằng chứng `[run]`):** cả 7 `.woff2` (Newsreader ×2, Inter ×4, IBM Plex Mono ×1) **thiếu** U+2609, 263D, 263F, 2640, 2642–2647, 211E, 2648 và U+FE0E; chỉ có `°` (U+00B0) và `′` (U+2032). ⇒ glyph/`℞` **luôn** đi qua font fallback của OS (Segoe UI Symbol, Apple Symbols…); hình dạng và độ rộng khác nhau theo nền tảng. M4 chỉ kiểm thủ công **12 glyph cung**, **chưa** kiểm 10 glyph hành tinh và `℞` (Mục 22.4).

---

## 11. True Position Marker Strategy

**Phân biệt bốn khái niệm (bắt buộc):**

| Khái niệm | Định nghĩa trong S4.5 | Được phép thay đổi? |
|---|---|---|
| Vị trí chiêm tinh | `PlanetVM.longitude ∈ [0,360)` | **không** — không mutate VM |
| **Marker** | vạch ngắn tại `θ_true = toScreenAngle(longitude, rotation)`, `r: 175 → 168` | **không** — luôn ở góc thật |
| Nhãn | hộp (glyph + `℞` + độ) tại `(r_lane, θ_label)` | **có** — chỉ nhãn bị dời |
| Leader | đoạn thẳng marker → mép nhãn | sinh ra từ hai thứ trên |

**Quyết định D-S45-02 (ĐÃ DUYỆT / APPROVED) — Vị trí marker:**
Duyệt Phương án B: Đặt vạch đánh dấu vị trí hành tinh thật (true planet marker) tại mép trong vòng nhà theo quy ước toạ độ S4.4 và dải bán kính `r = 175 → 168`.
- **Làm rõ quan trọng về baseline**: Trong repo hiện **chưa có bất kỳ baseline nào**. Đây là một vòng tròn mảnh mới (`stroke-subtle`) tại `r = 175`, **chỉ vẽ khi không có dữ liệu nhà** (`hasHouses === false`), đóng vai trò neo các vạch marker thật không bị lơ lửng. Chi tiết này là một sự chủ ý sai khác so với câu chữ của F4 plan §18 ("trên vòng chia độ"), và hiện chưa được kiểm chứng trực quan bằng mắt trên thiết bị thật (UNVERIFIED).
- **Ràng buộc bất biến**: Tuyệt đối không dời các vạch marker thật để giải quyết va chạm nhãn. Chỉ có hộp nhãn mới được phép dời vị trí.

**Hằng số mới (thêm vào `WHEEL_RADII`, cộng thêm, không đổi giá trị cũ):** `planetMarkerOuter: 175`, `planetMarkerInner: 168`, `planetLaneA: 141`, `planetLaneB: 146` (khởi điểm — hiệu chỉnh bằng test chứa góc ở Mục 18), `planetZoneInner: 114`.

**Test bắt buộc:** với mọi tier và mọi cấu hình, `marker.x/y` bằng `polarToCartesian(C, C, 175/168, toScreenAngle(lon, rot))` — *độc lập* với kết quả layout (test "dời nhãn không đổi marker").

---

## 12. Label Layout Algorithm

**Quyết định D-S45-05 — thuật toán: *cluster-merge spreading* trên một làn, orientation-aware, có kiểm chứng AABB và fallback theo tier.**

### 12.1 Đầu vào / đầu ra (kiểu khái niệm; tên cuối cùng chốt khi cài đặt)

```ts
// model/labelLayout.ts — thuần; không import React, DOM, ChartViewModel, SVG
interface LabelLayoutItem {
  id: string;            // ổn định, duy nhất (key hoặc key#n khi trùng)
  longitude: number;     // kinh độ thật; được chuẩn hoá bằng normalizeLongitude
  rank: number;          // thứ tự chính tắc (index trong KNOWN_PLANET_NAMES; lạ = Infinity)
  hasRetrograde: boolean;
  degreeText: string | null;  // null ⇒ không có dòng độ
  inputIndex: number;    // tie-break cuối
}
interface LabelLayoutConfig { rotation: number; tier: "A" | "B"; /* metrics, lane radius, pad, … */ }
interface LabelLayoutResult { status: "ok" | "overflow"; items: PlacedLabel[]; }
interface PlacedLabel {
  id: string;
  trueAngle: number;       // toScreenAngle(longitude, rotation)  — KHÔNG đổi
  labelAngle: number;      // góc tâm hộp nhãn
  center: Point;           // polarToCartesian(lane, labelAngle)
  box: { x0; y0; x1; y1 }; // hộp (chưa đệm) để vẽ/kiểm thử
  displaced: boolean;      // |labelAngle − trueAngle| > ε
}
```

Marker và leader **không** nằm trong đầu ra của thuật toán dàn nhãn; `planetGeometry.ts` suy ra từ `trueAngle` + `box` (tránh trạng thái dư thừa, và làm cho "dời nhãn không đổi marker" đúng *theo cấu trúc*).

### 12.2 Các bước

1. **Hợp lệ hoá:** `longitude` không hữu hạn → `RangeError` (cùng quy ước `geometry.ts`). Giá trị hữu hạn ngoài `[0,360)` → `normalizeLongitude` (VM đã lọc nên chỉ là phòng thủ).
2. **Thứ tự chính tắc:** sắp theo `(longitude chuẩn hoá ↑, rank ↑, id ↑, inputIndex ↑)`. Kết quả **không phụ thuộc thứ tự mảng đầu vào** (trừ khi hai mục *giống hệt* mọi trường — khi đó đổi chỗ không quan sát được).
3. **Góc thật:** `θᵢ = toScreenAngle(longitudeᵢ, rotation)` (tái dùng S4.4; không công thức mới).
4. **Bề rộng góc (footprint)** của từng hộp tại làn bán kính `r`:
   `fᵢ = (wᵢ·|sin θᵢ| + hᵢ·|cos θᵢ| + 2·PAD) / r × 180/π`
   (hình chiếu hộp AABB lên phương tiếp tuyến — theo định lý trục phân tách, hai hộp có hình chiếu rời nhau trên *bất kỳ* trục nào thì không chồng; nhờ vậy ở hai bên trái/phải wheel — nơi chiều ngang của hộp nằm theo hướng bán kính — footprint nhỏ hơn bounding-circle).
5. **Cắt vòng tại khoảng trống lớn nhất** giữa hai `θ` liền kề (hoà → chỉ số nhỏ hơn); *unwrap* thành dãy tăng. Đây là chỗ xử lý 0°/360° (Mục 14).
6. **Hợp cụm (merge):** mỗi mục là một cụm; cụm đặt các mục cách nhau đúng `sₖ = (fₖ + fₖ₊₁)/2`, **tâm cụm** chọn để cực tiểu `Σ(qⱼ − pⱼ)²` ⇒ dịch **đối xứng** quanh trọng tâm (không dồn một phía). Nếu hai cụm kề chồng nhau → gộp và tính lại. Lặp tới khi ổn định (≤ n−1 lần gộp). Kiểm tra khép vòng (cụm cuối ↔ cụm đầu `+360°`); nếu chồng, gộp xuyên biên và chạy lại; nếu tổng `Σ s ≥ 360° − ε` → `overflow`.
7. **Chuyển về góc màn hình:** `labelAngle = normalizeLongitude(q)`; `center = polarToCartesian(C, C, r, labelAngle)`.
8. **Kiểm chứng độc lập:** (a) không cặp hộp (đã đệm `PAD`) nào giao nhau theo kiểm AABB chính xác; (b) cả 4 góc mọi hộp nằm trong vành `[planetZoneInner, planetMarkerOuter)`; (c) thứ tự cyclic của `labelAngle` bằng thứ tự cyclic của `trueAngle` (⇒ các leader của một làn không cắt nhau). Vi phạm → coi tier đó **thất bại**.

### 12.3 Tier (chọn theo *toàn biểu đồ*, không trộn) — Quyết định D-S45-09 (ĐÃ DUYỆT / APPROVED)

**Quy tắc đo ngưỡng $30.0^\circ$ chuẩn xác:**
- Độ lệch ($\text{displacement}_i$) của một nhãn hành tinh là góc ngắn nhất giữa góc tâm hộp nhãn ($\theta_{\text{label}, i}$) và góc thật ($\theta_{\text{true}, i}$), tính theo độ quanh tâm wheel trên kết quả đã đặt xong:
  $$\text{displacement}_i = \min\left( | \theta_{\text{label}, i} - \theta_{\text{true}, i} |, 360^\circ - | \theta_{\text{label}, i} - \theta_{\text{true}, i} | \right)$$
- Sử dụng giá trị lớn nhất trên mọi nhãn:
  $$\text{maxDisplacement} = \max_i (\text{displacement}_i)$$
- **Tier A** được chọn khi $\text{maxDisplacement} \le 30.0^\circ$ (dung sai so sánh $1\times 10^{-6}$) VÀ vượt qua toàn bộ bước kiểm chứng độc lập (bước 8: AABB không giao nhau, nằm trọn trong vành, bảo toàn thứ tự cyclic). Nếu không, biểu đồ tự động chuyển sang **Tier B**.
- **Tính bất biến tỷ lệ (Scale-invariance):** Ngưỡng là góc hình học nên không đổi theo cỡ hiển thị; tại làn bán kính $r \approx 141$, góc $30^\circ$ tương đương cung tròn khoảng $49\text{ px}$ ở khung hiển thị 400px ($141 \times \frac{\pi}{6} \times \frac{400}{600}$) và khoảng $79\text{ px}$ ở khung hiển thị 640px ($141 \times \frac{\pi}{6} \times \frac{640}{600}$).
- **Kiểm thử bắt buộc:** Ca $29.9^\circ$ (Tier A) so với $30.1^\circ$ (Tier B), cụm dày (stellium), và cụm vắt qua $0^\circ$. Đo kích thước tối thiểu bằng hằng số toán học kết hợp kiểm thủ công (DevTools Computed Style), do jsdom không đo được layout.

| Tier | Đơn vị nhãn | Làn | Điều kiện chấp nhận |
|---|---|---|---|
| **A** | glyph + `℞` (nếu có) + độ nguyên `D°` (xếp dọc) | `planetLaneA` | bước 8 đạt **và** $\text{maxDisplacement} \le 30.0^\circ$ |
| **B** | glyph + `℞`; **bỏ dòng độ trên wheel** (độ vẫn có trong aria và bảng) | `planetLaneB` | bước 8 đạt; **không giới hạn dời** — luôn khả thi khi `Σ footprint < 360°` (14 thân thể ≈ 220°) |
| **Cuối** | `overflow`: chỉ vẽ marker + aria, không vẽ chữ nhãn | — | chỉ khi Tier B vẫn thất bại (không xảy ra với ≤ 14 thân thể); ghi chú trong `figcaption` |

Lý do chọn tier toàn cục: tránh một lá số có nhãn độ ở vài hành tinh và không có ở vài hành tinh khác (khó đọc, khó kiểm thử). Đánh đổi UX này đã được Owner chính thức phê duyệt.

### 12.4 Độ phức tạp và tính tất định

`O(n log n)` sắp xếp + `O(n²)` gộp/kiểm chứng; `n ≤ 14` (F4 plan §18) ⇒ ≤ vài trăm phép so sánh. Không có `Math.random`, `Date`, `Map`/`Set` có thứ tự phụ thuộc chèn ở nhánh quyết định, không phụ thuộc thứ tự render React. Toạ độ đầu ra qua `roundCoord` (D-M4-10).

### 12.5 Chiến lược đã đánh giá

| Phương án | Kết quả | Lý do loại / chọn |
|---|---|---|
| Greedy với dời `±k·bước` trên một làn | **loại** | dồn lệch một phía; prototype: dời tới 51° với `D°` stacked `[proto]` |
| Relaxation lặp (đẩy cặp chồng) | loại | hội tụ không đảm bảo; cần ngưỡng lặp tuỳ ý |
| Bounding-circle + khoảng cách góc cố định `7°` (F4 plan §18) | loại | "7°" không đảm bảo hộp không chồng ở mọi bán kính (prompt §12 yêu cầu); hộp `D°MM′` rộng 57,6 ≈ 23° tại `r=142` |
| **Cluster-merge, đối xứng, footprint theo hướng** | **chọn** | đảm bảo chấm dứt, đối xứng, có chứng minh không chồng theo SAT, đơn giản để test |
| 2 làn bán kính (F4 plan §18 "tối đa 2 làn") | **hoãn** | độ sâu vùng nhãn ≈ 50 đơn vị; hai làn của đơn vị cao 18 cần ≥ 40 + đệm ⇒ chạm vòng aspect (`r=110`); không có ích cho Tier A (cao 36) |

### 12.6 Bằng chứng thăm dò (prototype tạm, **không** phải nghiệm thu) `[proto]`

Chạy trên `fixture_full` (ASC 14,891°) và 3 bộ tổng hợp; relaxation thô (không phải thuật toán cuối). Số liệu để định cỡ tham số, **phải tính lại** bằng cài đặt thật ở S4.5.2:

| Cấu hình | `fixture_full` | stellium 6 (100–108°) | stellium 10 (200–209°) | qua 0° (358…3°) |
|---|---|---|---|---|
| Đầy đủ `D°MM′`, 1 làn | **không xếp được** (còn 6 cặp chồng; dời 44,7°) | xếp được, dời 58,8° | không xếp được | 38,0° |
| `D°` xếp dọc, 1 làn | xếp được, dời **22,5°** | 32,8° | không xếp được | 35,5° |
| Chỉ glyph + `℞`, 1 làn | **11,8°** | 24,3° | 41,0° (xếp được) | 16,3° |

Kết luận cho thiết kế: `D°MM′` trên wheel gần như luôn rơi xuống fallback ⇒ chọn `D°` (D-S45-04); stellium cực đoan luôn cần Tier B.

---

## 13. Collision Model and Deterministic Ordering

**Định nghĩa va chạm (D-S45-06):** hai nhãn *va chạm* khi hộp AABB của chúng, mỗi hộp nở thêm `PAD = 2` đơn vị mỗi cạnh (khe tối thiểu 4 đơn vị giữa hai hộp), giao nhau. Kiểm chứng cuối dùng AABB chính xác; bước dàn dùng footprint theo hướng (bảo thủ, suy ra từ cùng hộp).

**Ước lượng kích thước (model không có DOM để đo):**

| Thành phần | Công thức | Bằng chứng |
|---|---|---|
| Dòng độ (`font-data` = IBM Plex Mono, 16) | `chars × 0,6 × 16` (vd `10°` = 28,8; `5°` = 19,2) | `hmtx` của Plex Mono: advance `'0'`, `°`, `′` đều **600/1000 em** `[run]` ⇒ chính xác |
| Glyph hành tinh (font fallback OS, 18) | `1,1 × 18 = 19,8` | **ước lượng bảo thủ**; không đo được; sai khác nền tảng ghi ở rủi ro R6 |
| `℞` (fallback OS, 16) | `1,0 × 16 = 16` + khe 2 | ước lượng |
| Chiều cao | Tier A: `18 + 2 + 16 = 36`; Tier B: `18` | |

Hằng số nằm trong một object `LABEL_METRICS` xuất từ `labelLayout.ts` (một nơi — giống D-M4-11) để test và hiệu chỉnh.

**Thứ tự tất định:** `(longitude ↑, rank ↑, id ↑, inputIndex ↑)` — `rank` lấy từ `KNOWN_PLANET_NAMES` (đã có trong `api/types`, VM đã dùng cùng nguồn). Khi hai hành tinh có cùng kinh độ: thứ tự chính tắc quyết định ai ở "trước" trên vòng; kết quả không đổi khi đảo mảng đầu vào.

**Khoá trùng:** VM giữ cả hai mục khi `DUPLICATE_ENTITY`; `planetGeometry` đặt `id = key` cho mục đầu và `key#2`… cho các mục sau theo `inputIndex` ⇒ `data-planet`/React key luôn duy nhất.

---

## 14. 0°/360° Boundary Handling

| Nội dung | Quyết định |
|---|---|
| Chuẩn hoá góc | **chỉ** `normalizeLongitude` có sẵn (`[0,360)`); không thêm helper cạnh tranh |
| Khoảng cách vòng | hiệu góc có dấu ngắn nhất `((a − b + 540) mod 360) − 180` — viết **một** hàm nội bộ trong `labelLayout.ts` vì `geometry.ts` chưa có (ghi nhận: nếu S4.6 cần, chuyển sang `geometry.ts`) |
| Gom cụm | thuật toán cắt vòng ở khoảng trống lớn nhất, unwrap, rồi kiểm khép vòng (bước 6) ⇒ 359,9° và 0,1° là láng giềng |
| Cụm vắt qua 0° | unwrap sao cho chuỗi tăng; góc cuối `normalizeLongitude` ⇒ nhãn có thể ở phía bên kia 0° so với kinh độ thật |
| Ánh xạ sang S4.4 | không tạo quy ước mới: chỉ `toScreenAngle`/`polarToCartesian` |
| Leader gần biên | leader tính bằng toạ độ Descartes (marker → mép hộp) ⇒ **không** có nhánh đặc biệt cho biên |

**Test biên bắt buộc (unit):** (1) 359,9° & 0,1° cạnh nhau, (2) ba–năm hành tinh vắt qua 0°, (3) đúng 0°, (4) 359,999…°, (5) giá trị ngoài miền (`-10`, `370`) được chuẩn hoá, (6) `NaN`/`±Infinity` ném `RangeError`, (7) `rotation` bất kỳ làm cụm vắt qua *góc màn hình* 0°/360°, (8) cụm đúng đối xứng qua 0°.
Dung sai: so sánh góc `toBeCloseTo(x, 3)` (khớp `roundCoord` 3 chữ số).

---

## 15. Leader-Line Strategy

| Nội dung | Quyết định |
|---|---|
| Điểm đầu | **mép trong marker**, `M = polarToCartesian(C, C, 168, trueAngle)` |
| Điểm cuối | **giao điểm** của đoạn `M → tâm hộp` với **mép hộp đã nở 1 đơn vị** (kẹp AABB thuần) — đường nối kết thúc ở *mép* nhãn, không xuyên vào chữ |
| Định tuyến | đoạn thẳng (không đường cong/gấp khúc) |
| Khi nào vẽ | chỉ khi `M` nằm cách hộp (đã nở) **> `LEADER_MIN_GAP = 4`** đơn vị; nhãn gần như ở đúng chỗ thì không vẽ (prompt §14) |
| Cắt nhãn khác | trong **một làn**, thứ tự cyclic bảo toàn ⇒ các leader không cắt nhau; leader **có thể** đi sát hộp láng giềng khi dời lớn — kiểm tra bằng test "leader không đi qua hộp khác" trên 4 bộ dữ liệu chuẩn; không cam kết tổng quát (rủi ro R7) |
| Nhóm SVG | `<g data-part="connectors" aria-hidden="true">` chứa `<line data-planet={id}>`; vẽ **trước** nhãn |
| Trợ năng | trang trí ⇒ `aria-hidden`; không tạo đọc trùng |
| Kiểu | token có sẵn `stroke-subtle`, `strokeWidth 1`; không màu mới |

---

## 16. Degree Label Formatting

**Hợp đồng đã kiểm:** wheel và bảng đều đọc `PlanetVM.degreeLabel` ⇐ `formatDegreeMinute(degreeInSign)`: `D°MM′`, **cắt xuống phút** (D-M2-1/2), không làm tròn ⇒ **không có "nhớ" qua biên cung**; `29°59′59″` hiển thị `29°59′`, không bao giờ `30°00′` (trừ lỗi biên dưới đây).

**Quyết định D-S45-04 (ĐÃ DUYỆT / APPROVED) — Định dạng nhãn độ trên wheel:**
Hiển thị nhãn độ dạng `D°`, được suy ra từ chuỗi `degreeLabel` có sẵn qua hàm thuần `formatDegreeOnly`. Tuyệt đối không thay đổi hay mở rộng View Model. Giữ định dạng nhất quán với Bảng Hành tinh (Planet Table) và bảo toàn đầy đủ biểu diễn trợ năng (accessible representation) khi nhãn độ trên wheel bị ẩn đi ở Tier B.

| Phương án | Mô tả | Tác động |
|---|---|---|
| 1 | `D°MM′` đầy đủ (dùng nguyên `degreeLabel`) | không đổi VM; **gần như luôn rơi xuống Tier B** với lá số có cụm (xem 12.6) |
| **2 (ĐÃ CHỌN)** | **độ nguyên `D°`**, suy ra từ `degreeLabel` bằng hàm thuần `formatDegreeOnly()` trong `format.ts` (cắt phần trước `°`) | **không sửa VM**; cùng nguồn chuỗi với bảng ⇒ nhất quán *theo cấu trúc* (độ trên wheel = phần độ của bảng); nhiều lá số đạt Tier A |
| 3 | thêm `PlanetVM.degreeInSign: number` | sửa hợp đồng VM, có thể làm vỡ `toEqual` của test VM; không cần thiết |

Quy tắc: không lặp glyph cung trên nhãn (glyph cung đã ở vành ngoài; aria có tên cung). Dòng độ đặt **dưới** glyph, căn giữa; `℞` ở **trên-phải** glyph ⇒ không chạm dòng độ. Khi nhãn bị dời, dòng độ đi theo nhãn (cùng hộp). Dữ liệu thiên văn không bị đổi: chỉ cắt chuỗi.

**Known Gap phát hiện (KG-S45-01, mức thấp):** `formatDegreeMinute` cộng `EPS_MINUTES = 1e-9` nên giá trị trong khoảng ≈ 1,7·10⁻¹¹ độ dưới mốc 30 cho kết quả `30°00′` (thử trực tiếp bằng bản sao logic hàm: `29.99999999999 → 30°00′`, `29.9999999999999 → 30°00′`; `29.9999999 → 29°59′`). VM chấp nhận `degreeInSign < 30` nên giá trị này lọt qua. Xác suất thực tế cực thấp (hành tinh nằm đúng mốc cung), nhưng chính là ca "carry ở biên cung" mà prompt yêu cầu kiểm thử. **Đề xuất:** thêm test đặc trưng ở S4.5.3; sửa (kẹp tại `29°59′` khi miền là độ-trong-cung) là quyết định của owner (D-S45-12) vì thuộc hợp đồng M2.

---

## 17. Retrograde Indicator

| Nội dung | Quyết định |
|---|---|
| Nguồn | `PlanetVM.isRetrograde` (boolean bắt buộc; VM đã loại mục thiếu) — **VERIFIED** |
| Ký hiệu | `RETROGRADE_GLYPH` `℞` (Design System §2: không dùng icon Lucide) |
| Vị trí | trên-phải glyph, cách 2 đơn vị; `fontSize 16`; không chồng dòng độ (dòng độ ở hàng dưới) |
| Màu | token CSS có sẵn; **UNVERIFIED:** `PlanetGlyph` dùng `text-accent-primary` (HTML); cần chứng minh bằng CSS đã build rằng lớp `fill-*` tương ứng tồn tại — bài học M4: jsdom **không** phát hiện lớp SVG thiếu, chữ sẽ vô hình. Không dùng màu *một mình* để truyền nghĩa |
| Hành tinh không nghịch | **không** render `℞` (test đếm) |
| Trợ năng | không đọc riêng (`aria-hidden`); nghĩa nằm trong `aria-label` của nhóm: "…, nghịch hành" |
| Di động | cùng tier/cỡ chữ; Tier B vẫn giữ `℞` (thông tin quan trọng nhất sau glyph) |

---

## 18. Minimum Text Size and Dense-Cluster Fallback

**Phần tử chịu ràng buộc:** glyph hành tinh (18), `℞` (16), nhãn độ (16), và (kế thừa) glyph cung 18, số nhà 16, nhãn góc 16.

**Quy tắc đo:** `fontSize_viewBox × (WHEEL_MIN_DISPLAY_PX / WHEEL_VIEWBOX_SIZE) ≥ 10`. Khung hiển thị tối thiểu **400 px** (D-M4-6: `min-w-[400px]` + vùng cuộn ngang) ⇒ hệ số `400/600 = 0,667` ⇒ cỡ chữ viewBox tối thiểu `15`; chọn **16 / 18** (≥ 10,67 / 12 px). Wheel không bao giờ thu nhỏ dưới 400 px (cuộn ngang) và lớn nhất 640 px (≥ 17 px).

**Không đạt bằng cách "đặt `font-size=10`".** Thay vào đó:
1. Xuất `WHEEL_MIN_DISPLAY_PX = 400` từ `geometry.ts`; xuất các cỡ chữ từ một object hằng số (`PLANET_TEXT_SIZES`).
2. Unit test thuần: `∀ size ∈ PLANET_TEXT_SIZES: size × MIN/VIEWBOX ≥ 10`.
3. Component test: lớp `min-w-[400px]` còn trên `<svg>` (jsdom không đo được layout — ghi rõ giới hạn) và `fontSize` render ≥ ngưỡng.
4. Kiểm thủ công ở S4.5.5: DevTools → computed font-size tại khung 400 px (Mục 22.4).

**Fallback cụm dày:** Tier A → Tier B → `overflow` (Mục 12.3). **Không bao giờ** thu nhỏ chữ để vừa. Đánh đổi (ghi cho quyết định UX tương lai): trên lá số nhiều cụm, độ của từng hành tinh chỉ xem ở bảng/aria; một ghi chú văn bản trong `figcaption` báo tier B.

**Xung đột tài liệu (ghi nhận):** UI Spec §7.2 (dưới `md`: pinch-to-zoom trong khung vuông cố định) ≠ F4 plan #9 / `D-M4-6` (scale theo chiều rộng, cuộn ngang). S4.5 **giữ D-M4-6**; zoom/pan đã hoãn (KG-M4-04, S4.8/S4.9). Nếu S4.9 chuyển sang pinch-zoom, ngưỡng 10 px phải đo lại.

---

## 19. `PlanetLayer` Component Design

**Đường dẫn:** `frontend/src/features/chart/ui/ChartWheel/PlanetLayer.tsx` (+ `.test.tsx`), export thêm vào `index.ts`. *(F4 plan ghi "`ui/ChartWheel/PlanetLayer`"; repo dùng file phẳng cho các layer ⇒ file, không thư mục.)*

```tsx
interface PlanetLayerProps {
  model: PlanetWheelModel;       // từ planetGeometry.ts — layer KHÔNG tự tính toạ độ
  center?: number;               // mẫu theo các layer M4
  radii?: typeof WHEEL_RADII;
}
```

**Cấu trúc SVG**

```
<g data-layer="planets" data-label-tier="A|B|overflow">
  <circle data-part="baseline" …/>                 // chỉ khi !hasHouses (D-S45-02)
  <g data-part="marks" aria-hidden="true">          // marker + leader, vẽ trước
    <line data-part="leader" data-planet="Sun"/>    // chỉ khi displaced & xa
    <line data-part="marker" data-planet="Sun"/>
  </g>
  <g data-part="labels">
    <g data-planet="Sun" role="img" aria-label="Mặt Trời, ở Ma Kết, 10°31′, nhà 9">
      <text data-part="glyph">☉</text>
      <text data-part="retrograde">℞</text>         // chỉ khi nghịch hành
      <text data-part="degree">10°</text>           // chỉ Tier A
    </g>
  </g>
</g>
```

| Mục | Quyết định |
|---|---|
| Props / dữ liệu | chỉ nhận model đã dựng; không fetch, không router, không tính chiêm tinh |
| Khoá React | `key={item.id}` |
| Định danh | `data-planet={id}` (không dùng DOM `id` để tránh va chạm `useId`); S4.8 có thể thêm `role/tabIndex` lên đúng nhóm này |
| Style | token có sẵn: `fill-primary`, `font-display` (glyph), `font-data` (độ), `stroke-strong`/`stroke-subtle`; không hex |
| `aria-hidden` | `marks`, `baseline`; **không** đặt ở gốc layer |
| Fallback | `glyph=null` → 2 ký tự đầu `nameVi`; `overflow` → chỉ `marks`; model rỗng → `null` |
| Tránh | `useState`, `useEffect`, `Math.cos/sin/atan2`, `eslint-disable`, `as unknown as` (giữ Grep Gate 4 và 2) |

**Tích hợp `ChartWheel`:** `const planetModel = useMemo(() => planetModelProp ?? buildPlanetWheelModel(vm.planets, wheelGeometry.rotation, { hasHouses }), [...])`; thêm `<PlanetLayer>` cuối cùng; thêm prop tuỳ chọn `planetModel?` (đối xứng prop `geometry?` để test). `ChartViewerShell` **không cần sửa mã** (chỉ test).

---

## 20. Accessibility

**Quyết định D-S45-07 (ĐÃ DUYỆT & XÁC NHẬN / APPROVED) — Ngữ nghĩa trợ năng SVG:**
Đổi thẻ gốc `<svg role="img">` sang **`role="group"`** (giữ nguyên `aria-labelledby`/`aria-describedby`), và mỗi biểu diễn hành tinh không tương tác là `<g role="img" aria-label="…">`.
- **Xác nhận làm rõ cốt lõi**: Khái niệm *"planet SVG group"* trong quyết định được thống nhất bắt buộc phải hiểu là **thẻ gốc `<svg>` đổi sang `role="group"`**. Nếu chỉ đổi nhóm `<g>` hành tinh bên trong thành `role="group"` trong khi thẻ gốc `<svg>` bên ngoài vẫn giữ `role="img"`, thì theo quy chuẩn accessibility W3C/ARIA, toàn bộ cây con của một `role="img"` đều bị xem là presentational và tên/aria của từng hành tinh vẫn **hoàn toàn không được trình đọc màn hình đọc**. Việc đổi gốc `<svg>` sang `role="group"` cho phép các nhóm con `<g role="img" aria-label="...">` được công nhận là các node trợ năng độc lập.
- **Ràng buộc tương tác**: Tuyệt đối **không** thêm `role="button"`, `tabIndex`, `onClick` hay bất kỳ hành vi hover/select nào tại S4.5 (các tính năng tương tác được dành riêng cho S4.8).

| Yêu cầu | Thiết kế |
|---|---|
| Tên hành tinh | `"{nameVi}[, nghịch hành], ở {sign.labelVi}[, {degreeLabel}][, nhà {n}]"` dựng bởi hàm thuần trong `planetGeometry.ts` từ `PlanetVM` (**không** sửa `PlanetVM.ariaLabel`, vì bảng đang dùng) |
| Độ dạng văn bản | luôn có trong aria (kể cả Tier B, nơi bỏ dòng độ trên màn hình) |
| Nghịch hành | từ "nghịch hành" trong aria; `℞` hiển thị `aria-hidden` ⇒ không đọc trùng |
| Trang trí | `marks`, `baseline`, glyph/độ con của nhóm (nhóm `role="img"` coi con là presentational) |
| Không chỉ màu | `℞` là ký tự; leader là đường |
| Nhãn góc (`KG-M4-09`) | sau khi đổi sang `group`, `aria-label` trên `<text>` góc là thuộc tính trên phần tử không có vai trò ⇒ **đề xuất** thêm `role="img"` cho `<text>` góc (thay đổi 1 dòng trong `AngleLayer`), kèm test; nếu owner không muốn chạm M4 thì ghi lại là Known Gap |
| `<desc>` / `figcaption` | cập nhật: nêu số hành tinh hiển thị; figcaption bỏ câu "Vị trí hành tinh xem ở các bảng…" thành câu mới (copy cần owner xác nhận); khi tier B thêm câu "Độ của từng hành tinh xem ở bảng" |
| Đọc trùng với bảng | chấp nhận (bảng là nguồn đầy đủ; wheel là biểu diễn trực quan). Nếu kiểm thủ công cho thấy quá ồn, S4.9 cân nhắc `aria-hidden` có điều kiện |
| `vitest-axe` | thêm ca axe cho wheel có hành tinh (không vi phạm `aria-allowed-role`, `svg-img-alt`) |

---

## 21. State and Data Ownership

| Dữ liệu | Chủ sở hữu | Ghi chú |
|---|---|---|
| Server state (`ChartResponse`) | TanStack Query (đã có, S4.1/S4.3) | không đổi |
| `ChartViewModel` | `useMemo(toChartViewModel)` ở trang | không bị mutate |
| `WheelGeometry` | `useMemo` ở `ChartViewerShell` (đã có) | không đổi |
| `PlanetWheelModel` | `useMemo` **trong `ChartWheel`**, khoá `[vm.planets, rotation, hasHouses]` | tính một lần mỗi lá số; render lại do cha không tính lại layout |
| Chọn/hover | **không có** trong S4.5 | S4.8 sở hữu một nơi duy nhất |
| Store | **không thêm** (không Zustand) | |

Memoization cần thiết vừa phải: thuật toán rất rẻ (n ≤ 14) nhưng tạo object mới mỗi render sẽ làm đổi tham chiếu props xuống layer; `useMemo` ngăn điều đó. Không cần `React.memo` cho layer ở thời điểm này (đo trước khi thêm).

---

## 22. Testing Strategy

Dùng đúng stack hiện có: **Vitest + jsdom + Testing Library + `vitest-axe`**; không framework mới. Đặt tên theo quy ước repo (`W1…W19`, `C1…C16`): `L1…` cho `labelLayout`, `P1…` cho `planetGeometry`, `F1…` cho `format`, `PL1…` cho `PlanetLayer`.

### 22.1 Unit — `labelLayout.test.ts`

| # | Ca | Khẳng định chính |
|---|---|---|
| L1 | đầu vào rỗng | `items = []`, `status ok` |
| L2 | một hành tinh | `labelAngle == trueAngle`, `displaced=false` |
| L3 | nhiều hành tinh cách xa | không ai dời; không leader |
| L4 | hai hành tinh gần như cùng kinh độ | không giao hộp; dời **đối xứng** quanh trọng tâm (`\|d₁\| ≈ \|d₂\|`, ngược dấu) |
| L5 | cụm dày (≥ 5, kiểu `fixture_full` 275–296°) | không cặp hộp nào giao nhau (kiểm AABB độc lập với code sản xuất) |
| L6 | cụm vắt qua 0°/360° | 359,9° và 0,1° là láng giềng; không giao hộp; thứ tự cyclic bảo toàn |
| L7 | đúng 0° | được xếp, `trueAngle = toScreenAngle(0, rot)` |
| L8 | hai hành tinh **cùng** kinh độ | thứ tự theo `rank` rồi `id`; ổn định qua 100 lần chạy |
| L9 | độc lập thứ tự đầu vào | hoán vị ngẫu nhiên **có hạt giống cố định** của mảng ⇒ kết quả theo `id` giống hệt |
| L10 | lặp lại | gọi 50 lần ⇒ `toEqual` (kể cả toạ độ) |
| L11 | không giao hộp | cho 4 bộ chuẩn (thật, stellium 6, stellium 10, qua 0°) ở cả Tier A/B |
| L12 | hình học leader | điểm cuối nằm **trên mép** hộp nở 1; không vẽ khi khe ≤ 4 |
| L13 | **marker bất biến** | `trueAngle` không đổi khi ép nhãn dời (so với layout một mình từng hành tinh) |
| L14 | đầu vào lỗi | `NaN`, `±Infinity` → `RangeError`; `-10`, `370` được chuẩn hoá |
| L15 | ràng buộc cỡ chữ/cấu hình | `PLANET_TEXT_SIZES × 400/600 ≥ 10` |
| L16 | chọn tier | lá số thưa ⇒ A; stellium ⇒ B; không bao giờ trộn |
| L17 | chứa trong vành | 4 góc mọi hộp trong `[planetZoneInner, planetMarkerOuter)` |
| L18 | bảo toàn thứ tự cyclic | `labelAngle` cùng thứ tự cyclic với `trueAngle` (⇒ leader không cắt nhau) |
| L19 | `rotation` bất kỳ | 12 giá trị `rotation` (gồm 0, 14,891, 359,99) ⇒ L11/L18 vẫn đúng |
| L20 | `overflow` | `n` giả lập lớn (vd 40 mục) ⇒ `status "overflow"`, không ném lỗi, không `NaN` |

Không dùng snapshot làm khẳng định chính.

### 22.2 Unit — `planetGeometry.test.ts`, `format.test.ts`, `labels.test.ts`

| # | Ca |
|---|---|
| P1 | marker = `polarToCartesian(C, C, 175/168, toScreenAngle(lon, rot))` cho cả 10 hành tinh `fixture_full` — **độc lập layout** |
| P2 | xoay áp đúng **một lần** (hành tinh tại `lon = ASC` ở đúng 180°) |
| P3 | id duy nhất khi `DUPLICATE_ENTITY` (`Sun`, `Sun#2`) |
| P4 | `known=false` / `glyph=null` → fallback chữ; vẫn có aria |
| P5 | chuỗi aria đầy đủ/rút gọn: bỏ `nhà` khi `houseNumber=null`; bỏ độ khi `degreeLabel=null` |
| P6 | **không mutate** `vm` (đóng băng sâu đầu vào, gọi hàm, không ném) |
| P7 | `degreeText` Tier A = `formatDegreeOnly(degreeLabel)`; Tier B = `null` |
| F1 | `formatDegreeOnly("10°31′") = "10°"`, `"0°00′" → "0°"`, `"29°59′" → "29°"`, `null → null`, chuỗi sai dạng → `null` |
| F2 | **đặc trưng biên** `formatDegreeMinute(29.99999999999)` (ghi nhận hành vi hiện tại `30°00′` hoặc, nếu owner duyệt D-S45-12, hành vi đã sửa) |
| LB | `PLANET_LABELS.Venus/Mars` chứa `U+FE0E` (nếu D-S45-08 được duyệt); 8 hành tinh còn lại **không** đổi |

### 22.3 Component — `PlanetLayer.test.tsx` + `ChartWheel.test.tsx`

| # | Ca |
|---|---|
| PL1 | số nhóm hành tinh = số hành tinh trong VM (10 với `chartFull`); số marker = 10 |
| PL2 | số glyph = 10; mỗi `data-planet` đúng thứ tự chính tắc |
| PL3 | `℞` xuất hiện **đúng** 3 lần (Mercury, Venus, Jupiter) và **không** ở hành tinh khác |
| PL4 | nhãn độ hiển thị dạng `D°` ở Tier A; **vắng** ở Tier B |
| PL5 | leader chỉ cho nhãn bị dời; số leader = số `displaced && gap > 4` |
| PL6 | khoá/định danh ổn định giữa hai lần render cùng props |
| PL7 | `role="img"` + `aria-label` chứa tên, "nghịch hành" (khi có), cung, độ, nhà; `no-house` bỏ "nhà" |
| PL8 | `marks` có `aria-hidden="true"`; không phần tử trang trí nào có `aria-label` |
| PL9 | không có `button`, `tabindex`, handler (`getAllByRole("button")` rỗng trong wheel) |
| PL10 | toạ độ marker trong DOM **không đổi** khi đổi tier (render Tier A vs B cùng VM) |
| PL11 | mọi `fontSize` ≥ 15 và nhân hệ số 400/600 ≥ 10 |
| PL12 | hộp nhãn trong biên `viewBox` 0–600 |
| PL13 | VM `chartNoHouses` → có `baseline` (D-S45-02), không `house-ring`; hành tinh vẫn render, aria không có "nhà" |
| PL14 | `vitest-axe` không vi phạm |
| PL15 | dữ liệu tối thiểu: VM không hành tinh → layer `null`, wheel vẫn hợp lệ |
| C17+ | `svg role="group"`; `<desc>` nêu số hành tinh; `figcaption` mới; `data-label-tier` đúng |

Kiểm thử hướng **hợp đồng** (số lượng, thuộc tính `data-*`, tên truy cập, vị trí marker), không đối chiếu từng thuộc tính `d`/`x`/`y` của SVG trừ marker (đó là hợp đồng chính).

### 22.4 Kiểm thủ công bắt buộc để đóng S4.5 (ghi theo mẫu Phụ lục A → `Evidence Matrix §4`)

Mỗi dòng cần: người kiểm · thiết bị · hệ điều hành + **phiên bản đọc từ trang About/`chrome://version`** · trình duyệt/AT + phiên bản · commit/URL build · lá số dùng (fixture hay Backend thật) · bằng chứng (ảnh chụp/video trong `evidence/`) · ngày.

| # | Hạng mục | Vì sao |
|---|---|---|
| 1 | **10 glyph hành tinh** + `℞` hiển thị dạng chữ phẳng (không emoji màu) trên Windows, macOS/iOS, Android | M4 chỉ kiểm glyph **cung**; Venus/Mars có biến thể emoji |
| 2 | Cỡ chữ tính toán tại khung **400 px** (DevTools → *Computed*): glyph ≥ 12, độ/`℞` ≥ 10,6 px | chính sách ≥ 10 px |
| 3 | Lá số `fixture_full` (cụm Capricorn) — nhãn không chồng, leader đọc được ở light & dark | chấp nhận trực quan |
| 4 | Số đo tương phản `fill-primary`/`fill-accent…` trên nền wheel: ghi **cặp màu + tỉ lệ + công cụ** | thay "≥ 4,5:1" không có số |
| 5 | Trình đọc màn hình: bản ghi lời đọc cho 2 hành tinh (một nghịch hành) | xác nhận nhóm `role="img"` |
| 6 | Chế độ không giờ sinh: baseline + hành tinh | D-S45-02 |

---

## 23. Regression Strategy

**Test hiện có buộc phải cập nhật *có chủ đích* (không làm yếu):** ghi lý do trong Evidence Matrix như M4 đã làm cho placeholder.

| Test | Hiện khẳng định | Việc cần làm |
|---|---|---|
| `ChartWheel.test.tsx` **C14** | `figcaption` = "…Vị trí hành tinh xem ở các bảng bên dưới." | thay bằng khẳng định câu `figcaption` mới (cùng độ chặt) + ca Tier B |
| `ChartWheel.test.tsx` **C15** | `buildWheelDescription` **không** chứa "hành tinh" | đổi thành: chứa số hành tinh hiển thị; vẫn **không** chứa "góc chiếu" |
| các ca kiểm `svg role="img"` (C1–C3) | vai trò `img` | đổi sang `group`; giữ nguyên `aria-labelledby/-describedby` |
| `ChartViewerShell.test.tsx` **S6/S-W1/S-W2** | wheel hiện diện, 4 bảng | giữ; thêm khẳng định có hành tinh; **không** đổi số bảng |
| `page.test.tsx` **V1/V2** | `chart-wheel` có mặt | giữ nguyên |
| `fixtures.contract.test.ts` | bất biến fixture | thêm fixture **DERIVED** (nhãn rõ) cho cụm dày/biên; không sửa fixture CAPTURED |

**Bảo vệ S4.4:** chạy lại toàn bộ `geometry.test.ts` (G1–G10), `wheelGeometry.test.ts` (W1–W19), các test layer (Zodiac/Tick/House/Angle) **không sửa**; thêm test hồi quy "toạ độ vòng cung/vạch/nhà không đổi" (so với giá trị M4 đã kiểm: ASC 180,00°, MC 85,63°, biên Aries 165,11°) trong `ChartWheel.test.tsx`.

**Grep gates — định nghĩa lại cho S4.5 (Gate 3 cũ cấm "planets" trong wheel):**

| Gate | Nội dung | Kỳ vọng |
|---|---|---|
| G1 | `model/*.ts` không import React/DOM | 0 |
| G2 | UI không `Math.cos/sin/atan2` | 0 |
| G3′ | `aspect`/`aspects` không xuất hiện trong `labelLayout`, `planetGeometry`, `PlanetLayer`, `ChartWheel` | 0 |
| G4 | không `zustand`, `useState`, `dangerouslySetInnerHTML`, `as unknown as`, `: any`, `eslint-disable` trong file S4.5 | 0 |
| G5 | không màu hex/rgb/hsl | 0 |
| G6 | `aspectGeometry.ts` chưa tồn tại | đúng |
| G7 | `package.json` và lockfile không đổi | đúng |
| G8 | không `Math.random`, `Date.now`, `performance.now` trong `model/` | 0 |
| G9 | `labelLayout.ts` không import `chartViewModel`/`labels` | 0 |
| G10 | `PlanetLayer` không `onClick|onMouse|onFocus|onKey|tabIndex|role="button"` | 0 |
| G11 | CSS build chứa mọi lớp `fill-*`/`stroke-*` mà S4.5 dùng (grep `dist/assets/*.css`) | đủ |

---

## 24. Performance

- `n ≤ 14`; ≤ vài trăm phép so sánh mỗi lần dàn ⇒ không cần tối ưu thêm.
- Tính **một lần mỗi (vm.planets, rotation, hasHouses)** bằng `useMemo` trong `ChartWheel`; đổi chủ đề/viewport (`useMediaQuery` ở Shell) **không** làm tính lại vì khoá không đổi.
- Số DOM thêm: ≈ 10 × (1 marker + ≤ 1 leader + 1 nhóm + ≤ 3 text) ≈ 60 nút ⇒ không đáng kể (khác 360 vạch độ mà M4 đã chủ ý tránh).
- Không `React.memo`, không worker.

## 25. Dependency Review

**Không cần dependency mới.** Không Zustand, không d3/popmotion/bất kỳ thư viện hình học hay dàn nhãn nào: toán học cần thiết (cực→Descartes, chuẩn hoá góc, AABB) đã có hoặc là vài chục dòng thuần. `fonttools`/`brotli` chỉ dùng trong sandbox để audit, **không** vào repo. `package.json` và lockfile phải giữ nguyên (G7).

---

## 26. Implementation Task Breakdown

> Mọi task theo quy trình đã chốt: **xác nhận quyết định trước khi sinh mã** (Mục 32), mỗi task một nhóm commit nhỏ, Evidence Matrix chỉ ghi lệnh đã *thật sự chạy*.

### S4.5.0 — Chore bàn giao từ review M4 (trước các task chính)

| Mục | Nội dung |
|---|---|
| **Objective** | đóng các mục "còn mở" của summary M4 + sửa nợ `typecheck` còn sót, **không** lẫn với code S4.5 |
| **Preconditions** | HEAD `398d68b`; owner cung cấp URL CI #263 |
| **Files to inspect** | `docs/implementation/archive/sprint-f4/Sprint_F4_M4_Exit_Criteria_Evidence_Matrix.md`; `frontend/index.html`; `frontend/package.json` (khối `lint-staged`, script `typecheck`); `frontend/.husky/*` hoặc `.husky/pre-commit` (gốc repo); `frontend/README.md` (dòng 85 và mọi chỗ nhắc `tsc --noEmit`); `README.md` gốc; `ChartViewerShell.test.tsx` (dòng 91, 103, 113, 121) |
| **Commit 0a — docs-only** | **Matrix M4:** (i) thêm dòng *Evidence commit* `398d68b` + link CI #263 (owner cấp URL), giữ dòng `d9997c0`/#262 như lịch sử; (ii) thêm quy ước bên dưới; (iii) bổ sung Mục 4 theo **Phụ lục A** ở cuối tài liệu này; (iv) sửa `KG-M4-09` thành "xử lý ở S4.5.4" |
| **Commit 0b — frontend** | (1) `index.html`: `lang="vi"` (kiểm test/E2E nào phụ thuộc `lang`); (2) `lint-staged`: bỏ `bash -c "tsc --noEmit"` (root `tsconfig.json` có `"files": []` ⇒ **kiểm 0 file** — VERIFIED) bằng phương án đã chốt ở D-C1; (3) `frontend/README.md` dòng 85: mô tả đúng script `build` (`tsc -p tsconfig.app.json --noEmit && vite build`) và `typecheck`; (4) siết 4 assertion `toBeGreaterThanOrEqual(3)` thành **số chính xác** lấy từ mã (bảng: 4 ở ≥ 640 px; số danh sách thẻ: xác định bằng cách chạy thật, **không đoán**) |
| **Tests** | `npx vitest run src/features/chart/ui/ChartViewerShell`; `npm run lint`; `npm run typecheck`; `npm run format:check`; `npm run build` |
| **Acceptance** | CI xanh cho commit 0b; commit 0a chỉ chạm `docs/` ; hook pre-commit chạy thật typecheck (chứng minh bằng cố ý thêm lỗi kiểu trên nhánh thử, ghi kết quả) và thời gian đo được |
| **Out of scope** | đổi giấy phép, sửa README gốc ngoài mục dưới nếu owner chưa quyết (D-C2) |
| **Risks** | typecheck toàn dự án làm chậm hook (README AC6: < 10 s) → đo `time`; nếu > 10 s chuyển sang `pre-push` |

**Quy ước bằng chứng CI (D-C3) — trả lời vòng lặp "link CI ↔ HEAD mới":** đồng ý với owner: không thể gắn link CI của chính commit chứa link. Quy ước đề xuất: Evidence Matrix ghi **"Evidence commit" = commit *cuối cùng chứa mã* được CI xác nhận** (ở đây `398d68b`, CI #263). Các commit sau đó được chấp nhận **không cần CI riêng** nếu `git diff <evidence-commit>..HEAD --stat` chỉ chạm `docs/**`. Điều này khớp cấu hình thật: `frontend-ci.yml` chỉ kích hoạt khi đổi `frontend/**`, `backend/**` hoặc chính workflow `[repo]` — **commit chỉ sửa `docs/` không tạo run mới**. Vì vậy commit 0a phải **tách riêng** khỏi commit 0b (0b chạm `frontend/**` sẽ có CI riêng, và mới là "evidence commit" tiếp theo).

### S4.5.1 — Quyết định, hằng số và fixture

| Mục | Nội dung |
|---|---|
| **Objective** | chốt quyết định Mục 32; thêm hằng số + fixture DERIVED; chưa có logic |
| **Preconditions** | S4.5.0 xong; owner xác nhận D-S45-02/03/04/07/08/09 |
| **Files to inspect** | `model/geometry.ts`, `api/mocks/fixtures.ts`, `fixtures.contract.test.ts`, `api/types.ts` (`KNOWN_PLANET_NAMES`) |
| **Likely change** | `geometry.ts` (+ `planetMarkerOuter/Inner`, `planetLaneA/B`, `planetZoneInner`; xuất `WHEEL_MIN_DISPLAY_PX`); `fixtures.ts` (+ `chartDenseCluster`, `chartZeroBoundary` — **DERIVED**, nhãn rõ); `geometry.test.ts` (thêm ca hằng số, **không sửa** G1–G10) |
| **Steps** | thêm hằng số (cộng thêm, không đổi giá trị cũ) → dựng fixture từ `chartFull` bằng bản sao + thay `longitude/sign/degreeInSign` nhất quán → mở rộng contract test cho DERIVED |
| **Tests** | `geometry.test.ts`, `fixtures.contract.test.ts` |
| **Acceptance** | giá trị cũ của `WHEEL_RADII` không đổi; fixture DERIVED qua bất biến (sign/degree khớp longitude) |
| **Dependencies** | trước S4.5.2 |
| **Out of scope** | thuật toán, UI |
| **Risks** | fixture DERIVED sai bất biến → test dàn nhãn vô nghĩa (mitigation: contract test) |

### S4.5.2 — Mô hình dàn nhãn (`labelLayout.ts`)

| Mục | Nội dung |
|---|---|
| **Objective** | triển khai Mục 12–15 thuần, tất định |
| **Preconditions** | S4.5.1 |
| **Files to inspect** | `geometry.ts`, `api/types.ts` |
| **Likely change** | **tạo** `model/labelLayout.ts`, `model/labelLayout.test.ts` |
| **Steps** | (1) kiểu + `LABEL_METRICS` → (2) hợp lệ hoá + thứ tự chính tắc → (3) footprint + cắt vòng + unwrap → (4) cluster-merge + khép vòng → (5) kiểm chứng AABB + chứa trong vành + thứ tự cyclic → (6) chọn tier + `overflow` → (7) hình học leader → (8) **hiệu chỉnh** `MAX_DISPLACEMENT_A_DEG`, `planetLaneA/B` bằng 4 bộ dữ liệu chuẩn, ghi số đo vào Matrix |
| **Tests** | `npx vitest run src/features/chart/model/labelLayout.test.ts` (L1–L20) |
| **Acceptance** | L1–L20 xanh; coverage `labelLayout.ts` ≥ 95% câu lệnh/nhánh (cùng ngưỡng M3/M7 đã đạt cho model); G1, G8, G9 sạch |
| **Dependencies** | S4.5.1 → S4.5.3 |
| **Out of scope** | VM, React, SVG |
| **Risks** | thuật toán không hội tụ ở ca lạ → có `overflow`; tham số hiệu chỉnh lệ thuộc font → ghi rõ ước lượng |

### S4.5.3 — Mô hình hành tinh (`planetGeometry.ts`), định dạng, nhãn

| Mục | Nội dung |
|---|---|
| **Objective** | `PlanetVM[] → PlanetWheelModel` (marker, leader, aria, id) |
| **Preconditions** | S4.5.2; D-S45-04, 08 đã duyệt |
| **Files to inspect** | `chartViewModel.ts` (`PlanetVM`), `labels.ts`, `format.ts` |
| **Likely change** | **tạo** `model/planetGeometry.ts` (+ test); sửa `format.ts` (+ `formatDegreeOnly`, + test); sửa `labels.ts` (`U+FE0E` cho Venus/Mars) và `labels.test.ts` **nếu D-S45-08** |
| **Steps** | id duy nhất → input layout → chọn tier → marker `r 175→168` bằng `toScreenAngle`/`polarToCartesian` → leader → chuỗi aria → baseline khi `!hasHouses` |
| **Tests** | P1–P7, F1–F2, LB |
| **Acceptance** | P1 chứng minh marker độc lập layout; không mutate `vm` (P6) |
| **Dependencies** | S4.5.2 → S4.5.4 |
| **Out of scope** | sửa `PlanetVM`/`ariaLabel`; sửa `formatDegreeMinute` trừ khi D-S45-12 |
| **Risks** | đổi `labels.ts` làm vỡ test glyph ở bảng → chỉnh test có chủ đích |

### S4.5.4 — `PlanetLayer` và tích hợp `ChartWheel`

| Mục | Nội dung |
|---|---|
| **Objective** | vẽ lớp hành tinh, đổi ngữ nghĩa trợ năng, cập nhật mô tả |
| **Preconditions** | S4.5.3; D-S45-07 đã duyệt |
| **Files to inspect** | `ui/ChartWheel/*`, `ChartViewerShell.tsx`, `ChartWheel.test.tsx` |
| **Likely change** | **tạo** `PlanetLayer.tsx` (+ test); sửa `ChartWheel.tsx` (layer cuối, `useMemo`, `role="group"`, `buildWheelDescription`, `figcaption`), `AngleLayer.tsx` (+ `role="img"` trên `<text>` — D-S45-14), `index.ts`; cập nhật C14/C15/C1–C3 theo Mục 23 |
| **Steps** | render theo Mục 19 → tích hợp → cập nhật test hồi quy → thêm axe |
| **Tests** | PL1–PL15, C17+, `ChartViewerShell.test.tsx`, `page.test.tsx` |
| **Acceptance** | G2, G3′, G4, G5, G10 sạch; **không** có `button`/`tabindex` trong wheel; test M4 chỉ đổi đúng 3 nhóm đã liệt kê |
| **Dependencies** | S4.5.3 → S4.5.5 |
| **Out of scope** | hover/chọn; sửa `ChartViewerShell` ngoài test |
| **Risks** | đổi `role` làm các truy vấn `getByRole('img')` khác bị trùng → chạy toàn bộ suite, chỉnh phạm vi truy vấn (không làm yếu) |

### S4.5.5 — Khả đọc, fallback và kiểm thủ công

| Mục | Nội dung |
|---|---|
| **Objective** | chứng minh ≥ 10 px, tier B/overflow, lớp CSS tồn tại, nền tảng |
| **Likely change** | chủ yếu test + tài liệu; sửa mã chỉ khi phát hiện lỗi |
| **Steps** | `npm run build` → grep CSS (G11) → test PL11/L15 → chạy kiểm thủ công Mục 22.4 (owner) → ghi Matrix §4 |
| **Acceptance** | 22.4 có bản ghi đủ trường; không hạng mục nào ghi `VERIFIED` khi chưa có người kiểm/thiết bị/ngày |
| **Dependencies** | S4.5.4 → S4.5.6 |
| **Risks** | không có thiết bị Android/macOS → ghi `UNVERIFIED`/`ACCEPTED GAP`, không điền khống |

### S4.5.6 — Hồi quy, bằng chứng và đóng milestone

| Mục | Nội dung |
|---|---|
| **Objective** | chạy toàn bộ cổng; lập `Sprint_F4_M5_Exit_Criteria_Evidence_Matrix.md` trong `archive/sprint-f4/`; xoá blueprint này |
| **Steps** | cổng Mục 30 → ma trận (dùng ID quyết định **của plan này**, `D-S45-*`, để tránh lệch ID như M4/M7/M11) → Known Gaps → hồi quy G1–G11 |
| **Acceptance** | CI xanh trên *Evidence commit* mới; Known Gaps liệt kê đủ (Mục 32) |

---

## 27. Task Dependencies

```
S4.5.0 (chore) ──► S4.5.1 ──► S4.5.2 ──► S4.5.3 ──► S4.5.4 ──► S4.5.5 ──► S4.5.6
 docs 0a ┐                                                         ▲
 code 0b ┘                                owner xác nhận Mục 32 ───┘ (trước 4.5.1)
Hạ nguồn: S4.6 (dùng hằng số bán kính + planet model để neo đầu mút aspect) → S4.8 (gắn role/tabIndex lên data-planet) → S4.9 → S4.10
```

S4.5 **không** phụ thuộc S4.8. Nó chỉ để lại `data-planet`, nhóm `role="img"` và `data-label-tier` mà S4.6/S4.8 dùng lại.

---

## 28. File Change Map

| File / thư mục | Hành động | Mục đích | Task |
|---|---|---|---|
| `docs/implementation/archive/sprint-f4/Sprint_F4_M4_Exit_Criteria_Evidence_Matrix.md` | Modify (docs-only) | link CI #263, quy ước evidence commit, bổ sung Mục 4 | S4.5.0a |
| `frontend/index.html` | Modify | `lang="vi"` | S4.5.0b |
| `frontend/package.json` (khối `lint-staged` ) | Modify | hook typecheck thật | S4.5.0b |
| `frontend/README.md` | Modify | sửa mô tả `build`/`typecheck` | S4.5.0b |
| `frontend/src/features/chart/ui/ChartViewerShell/ChartViewerShell.test.tsx` | Modify (test) | siết 4 assertion | S4.5.0b |
| `frontend/src/features/chart/model/geometry.ts` (+ test) | Modify | hằng số bán kính hành tinh, `WHEEL_MIN_DISPLAY_PX` | S4.5.1 |
| `frontend/src/features/chart/api/mocks/fixtures.ts` (+ contract test) | Modify | fixture DERIVED cụm dày/biên | S4.5.1 |
| `frontend/src/features/chart/model/labelLayout.ts` (+ test) | **Create** | thuật toán dàn nhãn thuần | S4.5.2 |
| `frontend/src/features/chart/model/planetGeometry.ts` (+ test) | **Create** | VM → model hành tinh | S4.5.3 |
| `frontend/src/features/chart/model/format.ts` (+ test) | Modify | `formatDegreeOnly` | S4.5.3 |
| `frontend/src/features/chart/model/labels.ts` (+ test) | Modify (có điều kiện D-S45-08) | `U+FE0E` Venus/Mars | S4.5.3 |
| `frontend/src/features/chart/ui/ChartWheel/PlanetLayer.tsx` (+ test) | **Create** | render lớp hành tinh | S4.5.4 |
| `frontend/src/features/chart/ui/ChartWheel/ChartWheel.tsx` (+ test) | Modify | tích hợp, `role="group"`, mô tả | S4.5.4 |
| `frontend/src/features/chart/ui/ChartWheel/AngleLayer.tsx` (+ test) | Modify (có điều kiện D-S45-14) | `role="img"` cho nhãn góc | S4.5.4 |
| `frontend/src/features/chart/ui/ChartWheel/index.ts` | Modify | export | S4.5.4 |
| `docs/implementation/archive/sprint-f4/Sprint_F4_M5_Exit_Criteria_Evidence_Matrix.md` | **Create** | bằng chứng S4.5 | S4.5.6 |

**Không** đụng: `chartViewModel.ts`, `wheelGeometry.ts`, `ChartViewerShell.tsx` (ngoài test), Backend, `package.json` ngoài `lint-staged`, lockfile.

---

## 29. Test Matrix

| Yêu cầu | Unit | Component | Regression | Ưu tiên |
|---|---|---|---|---|
| Vị trí marker thật | L13, P1, P2 | PL10 | có (G-tọa độ M4) | **Critical** |
| Dàn nhãn tất định | L8–L10 | PL6 | không | **Critical** |
| Cụm dày | L4, L5, L11, L16 | PL5, PL12 | không | **Critical** |
| Biên 0°/360° | L6, L7, L14, L19 | tuỳ chọn | không | **Critical** |
| Nghịch hành | — | PL3, PL7 | không | High |
| Nhãn độ | F1, F2, P7 | PL4 | không | High |
| Leader | L12, L18 | PL5, PL8 | không | High |
| Cỡ chữ tối thiểu | L15 | PL11 | không | **Critical** |
| Tên truy cập | P5 | PL7–PL9, PL14 | có (C1–C3, axe) | High |
| Chứa trong vành/biên | L17 | PL12 | không | High |
| Hồi quy S4.4 | — | C-hồi quy | **có** | **Critical** |
| `overflow` / fallback | L20 | PL4, C17+ | không | Medium |

---

## 30. Quality Gates

Chỉ dùng script **có thật** (`frontend/package.json`): `lint`, `format:check`, `typecheck`, `test`, `test:coverage`, `build`, `test:e2e`. **Không có** script `coverage`, `test:a11y`, `test:unit` — ghi nhận, không thay bằng lệnh tự chế.

| Thời điểm | Bắt buộc |
|---|---|
| Mỗi task | `npm run lint` · `npm run typecheck` · `npm run format:check` · `npx vitest run <file/thư mục của task>` |
| Trước đóng S4.5.4 | thêm `npm test` (toàn bộ) + `npm run build` + Grep Gates G1–G11 |
| Đóng S4.5 (S4.5.6) | cả 4 lệnh tĩnh + `npm run build` + `npm run test:coverage` + `npm run test:e2e` **trên CI** (sandbox không chạy được E2E: không có Postgres/Prisma — giới hạn đã biết) + link CI xanh trên Evidence commit |

**Không** ghi "PASS" cho bất kỳ cổng nào chỉ vì nó được liệt kê ở đây. Số 118 file / 804 test là *đường cơ sở* theo Matrix M4, **chưa** được chạy lại trong phiên audit này.

---

## 31. Risks and Mitigations

| ID | Rủi ro | Khả năng | Tác động | Giảm thiểu | Cách kiểm chứng |
|---|---|---|---|---|---|
| R1 | Cụm dày vẫn chật | Cao (lá số thật đã có cụm 4–5 hành tinh) | Trung bình | Tier A→B tự động; không thu nhỏ chữ | L5, L11, L16, PL4; kiểm thủ công 22.4 #3 |
| R2 | Xử lý vòng 0°/360° sai | Thấp–TB | Cao | cắt vòng ở khoảng trống lớn nhất; chỉ dùng `normalizeLongitude` | L6, L7, L14, L19 |
| R3 | Dời nhãn làm đổi vị trí marker | Thấp | **Rất cao** (sai sự thật chiêm tinh) | marker suy ra từ `trueAngle` độc lập layout; layout không xuất marker | L13, P1, PL10 |
| R4 | Dòng độ chạm `℞` | Thấp | Thấp | `℞` hàng trên-phải, độ hàng dưới, khe 2 | PL4; kiểm trực quan |
| R5 | Chữ < 10 CSS px khi scale | TB | Cao | cỡ chữ ≥ 16/18 với khung tối thiểu 400 px; hằng số đo được | L15, PL11, 22.4 #2 |
| R6 | Glyph/`℞` khác nhau theo nền tảng (không font tự host nào chứa — `[run]`) | **Cao** | TB | `U+FE0E` cho Venus/Mars; hộp ước lượng bảo thủ 1,1 em; fallback chữ khi `glyph=null` | 22.4 #1 trên Windows/iOS/Android/macOS |
| R7 | Leader đi sát/xuyên nhãn khác | TB | Thấp–TB | một làn bảo toàn thứ tự; leader vẽ dưới nhãn; test trên 4 bộ chuẩn | L18, test "leader không qua hộp khác" |
| R8 | Test gắn chặt vào markup SVG | TB | TB | kiểm hợp đồng (`data-*`, tên truy cập, vị trí marker), không so từng thuộc tính | review test |
| R9 | Giả định hình học S4.4 sai | Thấp | Cao | chỉ dùng hàm S4.4; test hồi quy toạ độ đã kiểm | P2, C-hồi quy |
| R10 | Lấn sang S4.8 | TB | TB | Gate G10; PL9 | G10, PL9 |
| R11 | Lấn sang S4.6/thiết kế lại wheel | TB | TB | G3′, G6; chỉ thêm hằng số | G3′, G6 |
| R12 | Lớp `fill-*`/`stroke-*` không tồn tại → chữ vô hình (jsdom không phát hiện) | TB | Cao | chỉ dùng token đã có; grep CSS build | G11, 22.4 #3 |
| R13 | Vùng nhãn đụng vòng aspect `r=110` của S4.6 | TB | TB | `planetZoneInner=114`; D-S45-03 yêu cầu S4.6 giữ hub ≤ 108 | L17; rà soát đầu S4.6 |
| R14 | Đọc trùng giữa wheel và bảng | TB | Thấp | chấp nhận; S4.9 cân nhắc | 22.4 #5 |
| R15 | Đổi `role` làm hỏng truy vấn test khác | TB | Thấp | chạy toàn suite; thu hẹp phạm vi truy vấn | `npm test` |
| R16 | Prototype đánh giá quá lạc quan/bi quan | TB | TB | chỉ để định cỡ; hiệu chỉnh lại ở S4.5.2 | số đo ghi trong Matrix |

---

## 32. Known Gaps / Decisions Required

### 32.1 Quyết định kỹ thuật (Đã được Owner chính thức phê duyệt)

| ID | Nội dung | Quyết định đã chốt | Trạng thái phê duyệt |
|---|---|---|:---:|
| **D-S45-02** | Vị trí marker hành tinh | **Phương án B:** Đặt tại mép trong vòng nhà `r 175→168` theo toạ độ thật; vẽ baseline mảnh tại `r=175` khi `!hasHouses` (repo chưa có baseline nào); không dời marker khi va chạm | **ĐÃ DUYỆT (APPROVED)** |
| **D-S45-03** | Phối hợp bán kính với S4.6 | Vùng nhãn hành tinh `[114, 167)` và chốt bán kính hub aspect tối đa $\le 108$ (chủ ý thay thế con số 110 ở plan cũ) | **ĐÃ DUYỆT (APPROVED)** |
| **D-S45-04** | Nhãn độ trên wheel | **Độ nguyên `D°`**, suy ra từ `degreeLabel` có sẵn qua hàm thuần `formatDegreeOnly`; tuyệt đối không sửa hay mở rộng ViewModel | **ĐÃ DUYỆT (APPROVED)** |
| **D-S45-07** | Ngữ nghĩa trợ năng SVG | **Thẻ gốc `<svg role="group">`** và mỗi biểu diễn hành tinh là `<g role="img" aria-label="...">` (xác nhận: bắt buộc đổi gốc `<svg>` sang `group` để con không bị presentational); không có `button`/`tabIndex` | **ĐÃ DUYỆT (APPROVED)** |
| **D-S45-08** | Thêm `U+FE0E` cho Venus/Mars ở `PLANET_LABELS` | Thêm `\uFE0E` cho Venus (♀) và Mars (♂). **Đã xác minh qua Unicode emoji-data.txt và Python emoji 2.16.0**: chỉ ♀ và ♂ là emoji trong 10 glyph | **ĐÃ DUYỆT (APPROVED)** |
| **D-S45-09** | Chính sách cụm dày & ngưỡng $30.0^\circ$ | **Duyệt Tier B**: Ẩn nhãn độ trên wheel khi cụm dày; độ lệch đo theo góc ngắn nhất giữa tâm hộp nhãn và góc thật quanh tâm wheel, Tier A khi $\text{maxDisplacement} \le 30.0^\circ$ | **ĐÃ DUYỆT (APPROVED)** |
| **D-S45-10** | Copy mới của `figcaption`/`<desc>` | Soạn trong S4.5.4 theo tiêu chuẩn trợ năng | Chờ duyệt ở S4.5.4 |
| **D-S45-12** | Sửa biên `formatDegreeMinute` (`29.99999999999 → 30°00′`) | Test đặc trưng ở S4.5.3; kẹp tại `29°59′` cho miền độ-trong-cung | Khuyến nghị duyệt |
| **D-S45-13** | Một file (`labelLayout.ts`) hay hai (`+ planetGeometry.ts`) | **Hai file** (mirror D-M4-8: tách thuật toán dàn nhãn thuần khỏi mô hình ViewModel) | **ĐÃ CHỌN** |
| **D-S45-14** | `role="img"` cho `<text>` nhãn góc (đóng KG-M4-09) | Thêm `role="img"` cho thẻ `<text>` trong `AngleLayer.tsx` khi gốc SVG là `role="group"` | **ĐÃ CHỌN** |
| **D-C1** | `lint-staged`/typecheck | Chạy typecheck thật qua `node -e` trong `lint-staged` | **ĐÃ THỰC THI (S4.5.0b)** |
| **D-C2** | Giấy phép | Owner quyết định giấy phép thực tế khi release | Ngoài scope S4.5 |
| **D-C3** | Quy ước *Evidence commit* | `398d68b` là commit code có CI #263; commit chỉ chạm `docs/` không cần CI riêng | **ĐÃ THỰC THI (S4.5.0a)** |

### 32.2 Known Gaps ghi nhận

| ID | Vấn đề | Phân loại | Xử lý |
|---|---|---|---|
| KG-S45-01 | `formatDegreeMinute` cho `30°00′` khi giá trị trong ≈ 1,7·10⁻¹¹ độ dưới 30 | Technical debt (M2) | test đặc trưng ở S4.5.3; sửa theo D-S45-12 |
| KG-S45-02 | Glyph hành tinh/`℞` chưa kiểm thủ công trên máy thật (M4 chỉ kiểm glyph cung) | Unverified | 22.4 #1 |
| KG-S45-03 | Không đo được độ rộng glyph font fallback; dùng hệ số 1,1 em | Accepted approximation | hộp bảo thủ; kiểm thủ công |
| KG-S45-04 | Tier B ẩn độ trên wheel khi cụm dày | Accepted trade-off (UX) | ghi cho quyết định UX; độ vẫn ở aria + bảng |
| KG-S45-05 | Chưa có fixture CAPTURED cụm dày/qua 0° | Known Gap (như KG-M4-01) | dùng fixture DERIVED nhãn rõ; chụp thật khi có |
| KG-S45-06 | `hasHouses=false` cần baseline mới — chưa kiểm bằng mắt | Unverified | 22.4 #6 |
| KG-S45-07 | UI Spec §7.2 (pinch-zoom dưới `md`) ≠ `D-M4-6` (cuộn ngang) | Documentation conflict | giữ D-M4-6; S4.9 |
| KG-S45-08 | F4 plan §18 ("7°", "2 làn", "trên vòng chia độ", `displayAngle`) lỗi thời so với thiết kế này | Documentation gap | cập nhật F4 plan §18 sau khi đóng S4.5 |
| KG-S45-09 | Ví dụ aria của F4 plan dùng "Bọ Cạp", repo dùng "Thiên Yết" | Documentation note | theo `SIGN_LABELS` |
| KG-S45-10 | Bản prototype ở `/home/claude/scratch` không thuộc repo | Evidence note | số liệu 12.6 chỉ để định cỡ |

---

## 33. Definition of Done

S4.5 đóng khi **tất cả** đúng:

1. Mọi quyết định "Có" ở 32.1 đã được owner xác nhận bằng văn bản.
2. Hành tinh trong VM đều được vẽ; glyph, `℞`, độ (Tier A) hoặc fallback Tier B đúng chính sách.
3. Marker luôn ở góc thật (P1, L13, PL10 xanh).
4. Không cặp nhãn nào chồng trên `fixture_full`, các bộ DERIVED và biên 0°/360° (L5, L6, L11).
5. Tất định (L8–L10) và độc lập thứ tự đầu vào (L9).
6. Mọi chữ ≥ 10 CSS px tại 400 px (L15, PL11 + đo thủ công có bằng chứng).
7. `svg role="group"`, từng hành tinh `role="img"` có tên đầy đủ; không phần tử tương tác (PL7–PL9, axe).
8. Test M4 chỉ thay đổi đúng các nhóm nêu ở Mục 23; G1–G11 sạch; `package.json`/lockfile không đổi (trừ khối `lint-staged` ở S4.5.0b).
9. `npm run lint`, `typecheck`, `format:check`, `build`, `test:coverage` xanh và CI (gồm E2E) xanh trên **Evidence commit** có link trong Matrix.
10. Evidence Matrix `M5` và Known Gaps được lập; mục kiểm thủ công 22.4 có đủ trường hoặc ghi rõ `UNVERIFIED`.
11. Blueprint này bị xoá khỏi `docs/implementation/` sau khi đóng.

---

## 34. Final Architect Review

| Tiêu chí | Đánh giá | Trạng thái |
|---|---|---|
| Tương thích F4 plan v1.1 / O-F4-2 B | giữ phạm vi và thứ tự; lệch có ghi nhận ở chi tiết §18 (marker, làn, `minSepDeg`) | CONDITIONAL (D-S45-02, 03) |
| Thứ tự thực thi | S4.4 → **S4.5** → S4.6 → S4.8…; chore S4.5.0 không đổi thứ tự | OK |
| Tái dùng S4.4 | chỉ dùng `toScreenAngle`, `polarToCartesian`, `normalizeLongitude`, `WHEEL_RADII`, mẫu layer | OK |
| Bảo toàn vị trí thật | marker suy ra độc lập khỏi layout; có test cấu trúc | OK |
| Dàn nhãn tất định, không chồng | cluster-merge + kiểm AABB + tier; **chưa kiểm bằng cài đặt thật** (chỉ prototype) | PARTIALLY VERIFIED |
| 0°/360° | cắt vòng + unwrap, test biên | OK (trên giấy) |
| Định dạng độ | `D°` cùng nguồn chuỗi với bảng; phát hiện KG-S45-01 | CONDITIONAL (D-S45-04) |
| Nghịch hành | từ VM boolean bắt buộc; không suy luận | OK |
| ≥ 10 CSS px | công thức + hằng số + test; kiểm thủ công cần có | PARTIALLY VERIFIED |
| Trợ năng | `group` + `img` tên đầy đủ, trang trí ẩn, không tương tác | CONDITIONAL (D-S45-07) |
| Độ phủ test | L1–L20, P1–P7, PL1–PL15, hồi quy | OK |
| Kiểm soát phạm vi | G3′, G6, G10 chặn S4.6/S4.8 | OK |
| Dependency | không cần mới | OK |
| Rủi ro lớn nhất | font fallback theo nền tảng (R6) và độ chật vùng nhãn (R1, R13) | ghi nhận |

---

## 35. Final Recommendation

**`APPROVED & READY`**

**Tiền đề đã hoàn tất 100%:**
1. Owner đã chính thức phê duyệt toàn bộ **D-S45-02, 03, 04, 07, 08, 09** (Mục 32.1) cùng các quy tắc đo đạc và ràng buộc thực thi.
2. Owner đã cung cấp URL CI #263 và xác nhận quy ước *Evidence commit* (D-C3); Task **S4.5.0** (cả docs 0a và code 0b) đã hoàn thành.

Không có blocker kỹ thuật: mọi tiền đề S4.4 có đủ và đã kiểm. Sẵn sàng bắt đầu triển khai từ Task S4.5.1.

---

## Phụ lục A — Bổ sung đề xuất cho Matrix M4 §4 (kiểm thủ công)

Báo cáo hiện có 6 dòng PASS nhưng thiếu dữ kiện để người khác kiểm lại. Bổ sung:

1. **Build được kiểm:** commit SHA + cách chạy (`npm run dev`/`preview`) + URL. Báo cáo ghi ngày 2026-10-16 nhưng header Matrix dùng `d9997c0`; commit `398d68b` đổi mã (tabIndex/ESLint) — cần nói rõ kiểm trên commit nào.
2. **Dữ liệu:** lá số nào (fixture hay Backend thật), `chartFull` hay `chartNoHouses`.
3. **Phiên bản đọc từ máy:** Chrome/Edge 129, NVDA 2024.3, iOS 18.0 là phiên bản năm 2024 trong khi ngày kiểm là 2026-10-16. Nếu đúng là máy thật thì giữ nguyên, nhưng cần ảnh chụp trang About/`chrome://version` để người đọc phân biệt với ghi nhầm.
4. **Bằng chứng theo dòng:** ảnh chụp hoặc video lưu trong `archive/sprint-f4/evidence/` (đã có thư mục), tham chiếu từ từng dòng.
5. **Dòng 4 (tương phản):** thay "≥ 4,5:1" bằng **cặp màu cụ thể + tỉ lệ đo được + công cụ** (axe DevTools / Colour Contrast Analyser), cho cả light và dark.
6. **Dòng 6 (trình đọc):** ghi **lời đọc thực tế** (transcript). Liệt kê NVDA ở môi trường nhưng không có dòng NVDA đọc SVG; nêu rõ NVDA có được dùng cho dòng 6 hay không.
7. **Dòng 1 (glyph):** ghi font fallback thực tế mỗi nền tảng (Segoe UI Symbol, Apple Symbols…) hoặc ít nhất ảnh chụp; ghi rõ chỉ 12 glyph **cung**, chưa có glyph hành tinh/`℞`.
8. **Độ phủ nền tảng:** chỉ Windows 11 + iPhone. Ghi rõ **chưa kiểm** macOS Safari, Firefox, Android (nếu summary từng kỳ vọng các nền tảng này) dưới dạng `UNVERIFIED`/`ACCEPTED GAP`, không để người đọc suy ra đã phủ.
9. **Người kiểm:** người kiểm trùng người phát triển/owner — ghi "tự xác nhận" để minh bạch.
10. **Dòng 5 (cuộn bàn phím):** ghi kích thước thật (320 px viewport) và cách đo (DevTools device mode hay màn hình thật).
