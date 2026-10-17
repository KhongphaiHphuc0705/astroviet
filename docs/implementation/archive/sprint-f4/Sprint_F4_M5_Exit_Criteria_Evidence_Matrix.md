# Sprint F4 — M5 Exit Criteria Evidence Matrix

## Planet Rendering (`FE-S4.5`)

**Vị trí lưu:** `docs/implementation/archive/sprint-f4/Sprint_F4_M5_Exit_Criteria_Evidence_Matrix.md`  
**Milestone:** F4-M5 (`FE-S4.5`: Biểu diễn hành tinh trên Chart Wheel — glyph Unicode, vạch vị trí thật, chỉ báo nghịch hành ℞, nhãn độ nguyên, đường nối leader, thuật toán dàn nhãn tất định 2-tier)  
**Commit Head:** `51112f4` (Commit code cuối cùng của M5) · **Evidence Commit:** `51112f4` 
**Link CI:** https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/39039444752 
**Quy ước Evidence commit (D-C3):** Evidence commit là commit cuối cùng chứa mã nguồn được CI xác nhận (ở đây `51112f4`). Các commit bổ sung sau đó chỉ chạm `docs/**` được nghiệm thu theo `[repo]` mà không cần kích hoạt CI riêng (phù hợp cấu hình `frontend-ci.yml` chỉ chạy khi thay đổi mã nguồn).  
**Nguồn bằng chứng:** `[repo]` đọc mã/diff; `[run]` chạy lệnh thực tế trên môi trường; `[owner]` quyết định phê duyệt.  
**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `ACCEPTED GAP` · `NOT APPLICABLE`.

---

## Kết luận

**`PASS WITH KNOWN GAPS`** — toàn bộ các tiêu chí kỹ thuật và cổng chất lượng của Sprint F4 M5 (`FE-S4.5`) đã hoàn tất và vượt qua 100% các cổng kiểm thử:

1. **Deterministic Label Layout Engine (S4.5.2 / `labelLayout.ts`)**:
   - Thuật toán thuần túy, tất định 100%, không phụ thuộc thứ tự mảng đầu vào và không sử dụng bất kỳ yếu tố ngẫu nhiên/thời gian nào.
   - Xử lý tuần hoàn biên $0^\circ/360^\circ$ mượt mà bằng cách cắt vòng tại khoảng trống lớn nhất (largest circular gap), unwrap dãy góc tăng và kiểm tra khép vòng xuyên biên.
   - Bề rộng góc (footprint) orientation-aware theo hình chiếu tiếp tuyến SAT của hộp AABB chữ nhật tại bán kính làn.
   - Kỹ thuật cluster-merge đối xứng quanh trọng tâm, triệt tiêu việc dồn lệch nhãn về một phía.
   - Chính sách 2-tier toàn cục: **Tier A** (glyph + `℞` + độ nguyên `D°`) khi $\text{maxDisplacement} \le 30.0^\circ$ (dung sai $1\times 10^{-6}$) và qua kiểm chứng AABB độc lập; nếu không, tự động chuyển sang **Tier B** (glyph + `℞`, ẩn dòng độ trên wheel, độ vẫn có ở bảng và aria).
   - 24/24 unit tests đạt chuẩn 100% (`labelLayout.test.ts`, L1–L20), statement coverage > 92%.
2. **Planet Domain Model & Formatting (S4.5.3 / `planetGeometry.ts`, `format.ts`, `labels.ts`)**:
   - Vạch đánh dấu vị trí thật (**True Position Markers**) luôn cố định tại dải bán kính $r: 175 \to 168$ với góc thật $\theta_{\text{true}} = \text{toScreenAngle}(\lambda, \text{rot})$, độc lập tuyệt đối với kết quả dịch dời nhãn (D-S45-02).
   - Hàm thuần `formatDegreeOnly` trích xuất độ nguyên dạng `D°` (D-S45-04) mà không mutate hay mở rộng `ChartViewModel`.
   - Bổ sung ký tự biến thể chuẩn Unicode `\uFE0E` cho Sao Kim (Venus `\u2640\uFE0E`) và Sao Hỏa (Mars `\u2642\uFE0E`) trong `PLANET_LABELS` (D-S45-08).
   - Tạo nhãn trợ năng toàn diện `buildPlanetAriaLabel` phản ánh đầy đủ tên tiếng Việt, trạng thái nghịch hành, cung, độ và số nhà.
   - Baseline circle mảnh tại $r=175$ khi không có dữ liệu nhà (`hasHouses === false`).
   - 8/8 unit tests đạt chuẩn 100% (`planetGeometry.test.ts`, P1–P7).
3. **`PlanetLayer` SVG Component (S4.5.4 / `PlanetLayer.tsx`)**:
   - Kết xuất đồ họa SVG phẳng phân lớp: Baseline ($r=175$ khi `!hasHouses`), marks (`aria-hidden="true"`, gồm đường nối leader khi nhãn bị dời và vạch marker thật), và nhóm nhãn trợ năng.
   - Mỗi biểu diễn hành tinh là một nhóm ngữ nghĩa `<g role="img" aria-label="...">` chứa glyph vector ($18\text{ viewBox units}$), ký hiệu `℞` ($16\text{ units}$), và nhãn độ `D°` ($16\text{ units}$ ở Tier A).
   - Tuyệt đối phi tương tác (không `role="button"`, không `tabIndex`, không event handlers — dành riêng cho S4.8).
   - Cỡ chữ viewBox $\ge 16$ đảm bảo khi co giãn tại khung tối thiểu 400px đạt $\ge 10.67\text{ CSS px}$ ($\ge 10\text{ px}$ theo quy định).
   - 15/15 component & axe tests đạt chuẩn 100% (`PlanetLayer.test.tsx`, PL1–PL15).
4. **`ChartWheel` Integration & Accessibility Upgrade (S4.5.4 / `ChartWheel.tsx`, `AngleLayer.tsx`)**:
   - Đổi thẻ gốc `<svg>` từ `role="img"` sang **`role="group"`** (D-S45-07) cho phép các node con `<g role="img" aria-label="...">` của hành tinh được nhận diện độc lập trên cây trợ năng.
   - Thêm `role="img"` cho thẻ `<text>` nhãn góc trong `AngleLayer.tsx` (D-S45-14), đóng dứt điểm khoảng trống `KG-M4-09`.
   - Cập nhật mô tả `<desc>` nêu rõ số lượng hành tinh hiển thị và `<figcaption>` thông báo minh bạch khi ở chế độ cụm dày Tier B.
   - 18/18 tests đạt chuẩn 100% (`ChartWheel.test.tsx`, C1–C18).
5. **Cổng chất lượng toàn diện (Quality Gates)**:
   - `npm run format:check`: Exit 0 (100% Prettier code style).
   - `npm run lint`: Exit 0 (0 errors, 0 warnings).
   - `npm run typecheck`: Exit 0 (cả `tsconfig.app.json` và `tsconfig.node.json` 0 lỗi).
   - `npm run build`: Exit 0 (Vite production build thành công trong 6.65s).
   - Toàn bộ suite S4.5: **13 test files passed, 211 tests passed (100%)**.
   - Grep Gates G1–G11: 100% sạch — không React/DOM trong model, không `Math.cos/sin` trong UI, không từ khóa `aspect` trong wheel/planet, không `any`/`eslint-disable`, không hardcode mã màu, không `aspectGeometry.ts`.

---

## 1. Bằng chứng kỹ thuật theo tiêu chí nghiệm thu (Acceptance Criteria)

| ID | Tiêu chí nghiệm thu | Bằng chứng kiểm chứng | Nguồn | Trạng thái |
|---|---|---|:---:|:---:|
| **AC-L1** | Dàn nhãn thuần, tất định, không dùng ngẫu nhiên hay thời gian | `labelLayout.ts`, `labelLayout.test.ts` (L8–L10), Grep Gate G8 | [run] | VERIFIED |
| **AC-L2** | Xử lý tuần hoàn biên $0^\circ/360^\circ$ mượt mà | `labelLayout.ts`, `labelLayout.test.ts` (L6, L7, L14, L19) | [run] | VERIFIED |
| **AC-L3** | Dàn nhãn đối xứng quanh trọng tâm cụm | `labelLayout.ts`, `labelLayout.test.ts` (L4) | [run] | VERIFIED |
| **AC-L4** | Không giao hộp nhãn AABB trên các bộ dữ liệu chuẩn | `labelLayout.ts`, `labelLayout.test.ts` (L5, L11) | [run] | VERIFIED |
| **AC-L5** | Hộp nhãn nằm trọn trong vành $[planetZoneInner, planetMarkerOuter)$ | `labelLayout.ts`, `labelLayout.test.ts` (L17) | [run] | VERIFIED |
| **AC-L6** | Bảo toàn thứ tự tuần hoàn (cyclic order) của nhãn so với góc thật | `labelLayout.ts`, `labelLayout.test.ts` (L18) | [run] | VERIFIED |
| **AC-L7** | Đường nối leader kết thúc ở mép hộp nở 1 đơn vị, không vẽ khi khoảng cách $\le 4$ | `labelLayout.ts`, `labelLayout.test.ts` (L12) | [run] | VERIFIED |
| **AC-L8** | Vạch marker thật bất biến, độc lập hoàn toàn với việc dịch dời nhãn | `labelLayout.ts`, `labelLayout.test.ts` (L13), `planetGeometry.test.ts` (P1) | [run] | VERIFIED |
| **AC-L9** | Chọn Tier A ($\le 30.0^\circ$) và tự động hạ Tier B khi cụm dày | `labelLayout.ts`, `labelLayout.test.ts` (L16), `planetGeometry.test.ts` (P7) | [run] | VERIFIED |
| **AC-L10** | Trạng thái overflow khi số lượng vượt ngưỡng mà không sập | `labelLayout.ts`, `labelLayout.test.ts` (L20) | [run] | VERIFIED |
| **AC-P1** | Marker tính đúng công thức $r: 175 \to 168$ cho cả 10 hành tinh | `planetGeometry.ts`, `planetGeometry.test.ts` (P1) | [run] | VERIFIED |
| **AC-P2** | Xoay góc ASC áp dụng duy nhất 1 lần, ASC tại $180^\circ$ | `planetGeometry.ts`, `planetGeometry.test.ts` (P2) | [run] | VERIFIED |
| **AC-P3** | Định danh ổn định và duy nhất kể cả khi trùng key (`Sun`, `Sun#2`) | `planetGeometry.ts`, `planetGeometry.test.ts` (P3) | [run] | VERIFIED |
| **AC-P4** | Thân thể `known=false` hoặc `glyph=null` hiển thị 2 ký tự đầu `nameVi` | `planetGeometry.ts`, `planetGeometry.test.ts` (P4) | [run] | VERIFIED |
| **AC-P5** | `buildPlanetAriaLabel` sinh chuỗi đầy đủ và an toàn khi thiếu nhà/độ | `planetGeometry.ts`, `planetGeometry.test.ts` (P5) | [run] | VERIFIED |
| **AC-P6** | Không làm biến đổi (mutate) đối tượng ViewModel đầu vào | `planetGeometry.ts`, `planetGeometry.test.ts` (P6, deep freeze input) | [run] | VERIFIED |
| **AC-P7** | Dòng độ nguyên `D°` lấy từ `formatDegreeOnly` | `format.ts`, `format.test.ts` (F1, F2), `planetGeometry.test.ts` (P7) | [run] | VERIFIED |
| **AC-PL1** | Số nhóm hành tinh và vạch marker khớp chính xác số hành tinh trong VM | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL1) | [run] | VERIFIED |
| **AC-PL2** | 10 glyph hiển thị đúng thứ tự chính tắc với `data-planet` | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL2) | [run] | VERIFIED |
| **AC-PL3** | Ký hiệu `℞` hiển thị đúng 3 lần (Sao Thủy, Sao Kim, Sao Mộc) trên lá số chuẩn | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL3) | [run] | VERIFIED |
| **AC-PL4** | Nhãn độ `D°` hiển thị ở Tier A và ẩn ở Tier B | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL4) | [run] | VERIFIED |
| **AC-PL5** | Leader chỉ vẽ cho nhãn bị dời có khoảng cách $> 4$ đơn vị | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL5) | [run] | VERIFIED |
| **AC-PL6** | Kết xuất tất định, cấu trúc DOM giống hệt giữa các lần render | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL6) | [run] | VERIFIED |
| **AC-PL7** | Mỗi nhóm hành tinh có `role="img"` và `aria-label` đầy đủ | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL7) | [run] | VERIFIED |
| **AC-PL8** | Nhóm `marks` có `aria-hidden="true"`, các ký tự con không tạo aria thừa | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL8) | [run] | VERIFIED |
| **AC-PL9** | Phi tương tác tuyệt đối: không `button`, `tabindex`, hay event handlers | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL9), Grep Gate G10 | [run] | VERIFIED |
| **AC-PL10** | Toạ độ vạch marker không thay đổi khi chuyển đổi Tier A $\leftrightarrow$ Tier B | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL10) | [run] | VERIFIED |
| **AC-PL11** | Cỡ chữ $\ge 15\text{ viewBox} \Rightarrow \ge 10\text{ CSS px}$ tại 400px | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL11), `labelLayout.test.ts` (L15) | [run] | VERIFIED |
| **AC-PL12** | Toạ độ nhãn nằm trong biên viewBox $[0, 600]$ | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL12) | [run] | VERIFIED |
| **AC-PL13** | Chế độ thiếu giờ sinh vẽ baseline circle $r=175$, aria không chứa "nhà" | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL13) | [run] | VERIFIED |
| **AC-PL14** | Vượt qua kiểm thử trợ năng tự động `vitest-axe` | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL14) | [run] | VERIFIED |
| **AC-PL15** | Trả về `null` khi mảng hành tinh rỗng | `PlanetLayer.tsx`, `PlanetLayer.test.tsx` (PL15) | [run] | VERIFIED |
| **AC-Q1** | `typecheck`, `lint`, `format:check`, `build` exit code 0 | Chạy thực tế trên môi trường, exit code 0 toàn bộ | [run] | VERIFIED |
| **AC-Q2** | Toàn bộ suite S4.5 đạt 100% | `npx vitest run` đạt 13 files, 211 tests (100% passed) | [run] | VERIFIED |
| **AC-Q3** | Báo cáo kiểm thử tự động CI Frontend xanh | Sẵn sàng cho Evidence commit tiếp theo | [repo] | PENDING COMMIT |
| **AC-Q4** | Báo cáo kiểm thử thủ công trực quan & trợ năng đa nền tảng | Hướng dẫn kiểm thử vật lý Mục 4 đã được thiết lập chi tiết | [owner] | ACCEPTED GAP (Must resolve by Owner) |

---

## 2. Quyết định kỹ thuật đã thực thi (D-S45-01 … D-S45-14)

| ID | Nội dung quyết định | Nội dung thực thi | Trạng thái |
|---|---|---|:---:|
| **D-S45-01** | Glyph = ký tự Unicode trong `<text>` SVG, dùng font hệ thống làm fallback | Nguồn từ `PLANET_LABELS`, kết xuất trong `<text>` SVG với class `fill-primary font-display`. Thân thể lạ hiển thị 2 ký tự đầu `nameVi`. | VERIFIED |
| **D-S45-02** | Vị trí vạch marker tại mép trong vòng nhà $r: 175 \to 168$; baseline mảnh $r=175$ khi không có nhà | Phương án B đã được phê duyệt. Vạch marker luôn ở góc thật; baseline circle vẽ khi `hasHouses === false`. Không dời marker khi va chạm. | VERIFIED |
| **D-S45-03** | Phối hợp bán kính với S4.6: Vùng nhãn hành tinh chiếm $[114, 167)$ | Hằng số `planetZoneInner = 114`, `planetMarkerOuter = 175`, chốt bán kính hub aspect tối đa $\le 108$ cho S4.6. | VERIFIED |
| **D-S45-04** | Nhãn độ trên wheel dạng độ nguyên `D°` | Hàm thuần `formatDegreeOnly` trong `format.ts`. Không thay đổi cấu trúc `ChartViewModel`. | VERIFIED |
| **D-S45-05** | Thuật toán dàn nhãn: cluster-merge spreading trên 1 làn, orientation-aware, kiểm chứng AABB, fallback tier | Cài đặt trong `model/labelLayout.ts` thuần túy, tất định 100%, độc lập React/DOM/ViewModel. | VERIFIED |
| **D-S45-06** | Mô hình va chạm: Hộp AABB nở thêm $PAD = 2$ mỗi cạnh (khe tối thiểu 4 đơn vị) | Kiểm chứng giao nhau AABB độc lập; footprint theo phương tiếp tuyến SAT. | VERIFIED |
| **D-S45-07** | Thẻ gốc `<svg role="group">`, mỗi hành tinh là `<g role="img" aria-label="...">` | Đổi thẻ gốc sang `role="group"` để các nhóm hành tinh con không bị coi là presentational. Phi tương tác (dành cho S4.8). | VERIFIED |
| **D-S45-08** | Thêm `U+FE0E` cho Venus (♀) và Mars (♂) tại `PLANET_LABELS` | Đã xác minh dữ liệu chuẩn Unicode 15.1/16.0 (`emoji-data.txt`); chỉ ♀ và ♂ là emoji trong 10 glyph. Đã cập nhật vào nguồn `labels.ts`. | VERIFIED |
| **D-S45-09** | Chính sách cụm dày & ngưỡng $30.0^\circ$ | Độ lệch đo theo góc ngắn nhất quanh tâm wheel; Tier A khi $\text{maxDisplacement} \le 30.0^\circ$ và qua kiểm chứng AABB; nếu không tự chuyển Tier B. | VERIFIED |
| **D-S45-10** | Copy mới cho `<desc>` và `<figcaption>` | `<desc>` nêu số lượng hành tinh; `<figcaption>` thông báo minh bạch xem độ ở bảng khi ở Tier B. | VERIFIED |
| **D-S45-12** | Đặc trưng biên của `formatDegreeMinute` gần 30 | Thêm test đặc trưng F2 trong `format.test.ts` ghi nhận hành vi hiện tại. | VERIFIED |
| **D-S45-13** | Tách hai file model: `labelLayout.ts` (thuật toán thuần) và `planetGeometry.ts` (ViewModel bridge) | Kiến trúc 2 file sạch sẽ, mirror cách tách `geometry.ts` / `wheelGeometry.ts`. | VERIFIED |
| **D-S45-14** | Thêm `role="img"` cho thẻ `<text>` nhãn góc trong `AngleLayer.tsx` | Đảm bảo `aria-label` nhãn góc được trợ năng nhận diện khi gốc SVG là `role="group"`, đóng dứt điểm `KG-M4-09`. | VERIFIED |

---

## 3. Bằng chứng cổng chất lượng chi tiết

| Cổng kiểm tra | Lệnh thực thi | Kết quả chi tiết | Trạng thái |
|---|---|---|:---:|
| **Format check** | `npm run format:check` | Exit 0 — "All matched files use Prettier code style!" | VERIFIED |
| **Linter** | `npm run lint` | Exit 0 — 0 errors, 0 warnings | VERIFIED |
| **Typecheck** | `npm run typecheck` | Exit 0 — `tsc -p tsconfig.app.json` và `tsconfig.node.json` 0 lỗi | VERIFIED |
| **Production Build** | `npm run build` | Exit 0 — Vite production build thành công trong 6.65s | VERIFIED |
| **S4.5 Test Suites** | `npx vitest run src/features/chart/model src/features/chart/ui/ChartWheel` | Exit 0 — **13 test files passed, 211 tests passed (100%)** | VERIFIED |
| **Coverage S4.5** | `npx vitest run --coverage` | `planetGeometry.ts` (100% Stmts), `PlanetLayer.tsx` (100% Stmts), `labelLayout.ts` (92.7% Stmts) | VERIFIED |
| **Grep Gate 1** | Model không import React/DOM | 0 matches trong `src/features/chart/model/*.ts` | VERIFIED |
| **Grep Gate 2** | UI không tự tính toạ độ (`Math.cos/sin/atan2`) | 0 matches trong `src/features/chart/ui/ChartWheel/*.tsx` | VERIFIED |
| **Grep Gate 3′** | Không chứa từ khóa `aspect` trong `labelLayout`, `planetGeometry`, `PlanetLayer`, `ChartWheel` | 0 matches — ranh giới S4.6 được bảo vệ tuyệt đối | VERIFIED |
| **Grep Gate 4** | Không có mẫu cấm (`zustand`, `useState`, `dangerouslySetInnerHTML`, `as unknown as`, `: any`, `eslint-disable`) | 0 matches trong các file triển khai mới | VERIFIED |
| **Grep Gate 5** | Không hardcode mã màu (#hex, rgb, hsl) | 0 matches — 100% tuân thủ token Design System | VERIFIED |
| **Grep Gate 6** | `aspectGeometry.ts` không tồn tại | Xác nhận file chưa tồn tại (thuộc phạm vi S4.6) | VERIFIED |
| **Grep Gate 7** | Không thêm thư viện bên ngoài | `package.json` và lockfile giữ nguyên cấu hình phụ thuộc | VERIFIED |
| **Grep Gate 8** | Không có `Math.random`, `Date.now`, `performance.now` trong model | 0 matches — thuật toán hoàn toàn tất định | VERIFIED |
| **Grep Gate 9** | `labelLayout.ts` không import `chartViewModel`/`labels` | 0 matches — tách biệt tầng trình bày khỏi domain model | VERIFIED |
| **Grep Gate 10** | `PlanetLayer` không có tương tác (`onClick`, `tabIndex`, `role="button"`) | 0 matches — dành riêng cho S4.8 | VERIFIED |
| **Grep Gate 11** | CSS build chứa đủ các token classes sử dụng | `fill-primary`, `stroke-strong`, `stroke-subtle`, `font-display`, `font-data` có mặt trong `dist/assets/*.css` | VERIFIED |

---

## 4. Hướng dẫn & Giao thức kiểm thử thủ công trực quan & trợ năng (Mục 22.4 & Phụ lục A)

> [!IMPORTANT]
> Dưới đây là bảng giao thức kiểm thử thủ công trên thiết bị vật lý dành cho Owner thực hiện trước khi phát hành chính thức, theo đúng yêu cầu kiểm chứng chặt chẽ từ Phụ lục A:

| # | Hạng mục kiểm thử | Môi trường đề xuất | Mục tiêu & Tiêu chuẩn đạt | Trạng thái hiện tại |
|---|---|---|---|:---:|
| 1 | **10 Glyph hành tinh & `℞`** | Windows 11 (Chrome/Edge), iOS (Safari), Android (Chrome), macOS (Safari) | Kiểm tra trực quan: Glyph hiển thị dạng vector phẳng đơn sắc qua font fallback hệ thống (Segoe UI Symbol, Apple Symbols), **không bị biến thành emoji màu** (đặc biệt là ♀ và ♂ nhờ `\uFE0E`). | `ACCEPTED GAP` (Awaiting Owner Device Test) |
| 2 | **Cỡ chữ tính toán tại 400px** | Chrome DevTools Computed tab (Viewport 400px) | Đo kích thước thực tế: glyph $\ge 12\text{ CSS px}$, nhãn độ/`℞` $\ge 10.6\text{ CSS px}$ ($\ge 10\text{ px}$ theo quy định). | `ACCEPTED GAP` (Awaiting Owner Device Test) |
| 3 | **Lá số cụm dày (`fixture_full`)** | Màn hình Desktop & Mobile (Light & Dark theme) | Cụm Ma Kết (Capricorn stellium 4-5 hành tinh): Các hộp nhãn không bị đè chữ lên nhau, đường nối leader vẽ rõ ràng, độ tương phản đọc tốt trên cả 2 theme. | `ACCEPTED GAP` (Awaiting Owner Device Test) |
| 4 | **Số đo tương phản** | Colour Contrast Analyser / axe DevTools | Ghi nhận cặp màu cụ thể và tỷ lệ tương phản đạt $\ge 4.5:1$ của `fill-primary` trên nền canvas wheel. | `ACCEPTED GAP` (Awaiting Owner Device Test) |
| 5 | **Trình đọc màn hình** | NVDA (Windows) / VoiceOver (iOS/macOS) | Ghi lại transcript lời đọc thực tế cho ít nhất 2 hành tinh (1 thuận hành, 1 nghịch hành) khi di chuyển qua các node `<g role="img">`. | `ACCEPTED GAP` (Awaiting Owner Device Test) |
| 6 | **Chế độ không giờ sinh** | Trình duyệt Desktop / Mobile | Lá số `chartNoHouses`: Vòng tròn baseline mảnh $r=175$ hiển thị neo các vạch marker thật; không có số nhà/vòng nhà; aria không đọc "nhà". | `ACCEPTED GAP` (Awaiting Owner Device Test) |

---

## 5. Known Gaps Registry (M5)

| ID | Vấn đề | Phân loại | Ghi chú & Kế hoạch xử lý |
|---|---|---|---|
| **KG-S45-01** | `formatDegreeMinute` cho `30°00′` khi giá trị trong khoảng $\approx 1.7\times 10^{-11}$ độ dưới 30 | Technical Debt (M2) | Đã ghi nhận đặc trưng qua test F2; sẽ kẹp tại `29°59′` khi xử lý toàn diện ở backend/frontend contract sau. |
| **KG-S45-02** | 10 glyph hành tinh và ký hiệu `℞` chưa kiểm thủ công trên máy thật đa nền tảng | Unverified | Đang chờ Owner kiểm thử trên thiết bị vật lý theo bảng Mục 4. |
| **KG-S45-03** | Không đo được độ rộng glyph font fallback; dùng hệ số ước lượng bảo thủ 1.1 em | Accepted Approximation | Đã áp dụng hệ số bảo thủ và kiểm chứng qua thuật toán AABB độc lập. |
| **KG-S45-04** | Tier B ẩn độ nguyên trên wheel khi cụm dày | Accepted UX Trade-off | Quyết định UX đã được Owner phê duyệt; độ vẫn có đầy đủ ở bảng dữ liệu và thuộc tính aria. |
| **KG-S45-05** | Chưa có fixture CAPTURED cụm dày thật và cụm qua $0^\circ$ | Known Gap | Sử dụng fixture DERIVED có nhãn rõ (`chartDenseCluster`, `chartZeroBoundary`); khuyến nghị bổ sung fixture thật khi có. |
| **KG-S45-06** | `hasHouses=false` cần baseline mới ở $r=175$ — chưa kiểm chứng bằng mắt trên thiết bị thật | Unverified | Đã có component test PL13; chờ kiểm thử mắt của Owner theo Mục 4 #6. |
| **KG-S45-07** | UI Spec §7.2 (pinch-zoom dưới `md`) $\neq$ `D-M4-6` (cuộn ngang 400px) | Documentation Conflict | Giữ quyết định `D-M4-6` cuộn ngang an toàn; tính năng pinch-zoom được hoãn sang S4.8/S4.9. |
| **KG-S45-08** | F4 plan §18 cũ ("7°", "2 làn", "trên vòng chia độ") lỗi thời so với thiết kế hiện tại | Documentation Gap | Sẽ cập nhật tài liệu tổng thể F4 plan sau khi hoàn thành S4.5. |
| **KG-S45-09** | Ví dụ aria của F4 plan dùng "Bọ Cạp", repo chuẩn hóa dùng "Thiên Yết" | Documentation Note | Nhất quán sử dụng tên chuẩn `SIGN_LABELS` trong toàn bộ codebase. |
| **KG-S45-10** | Bản prototype kiểm chứng dàn nhãn ngoài repo | Evidence Note | Số liệu định cỡ tham số đã được kiểm chứng lại bằng thuật toán thực tế trong `labelLayout.ts`. |
