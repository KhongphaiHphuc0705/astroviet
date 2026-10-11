# AstroViet — FE Sprint 4 M2 Implementation Plan
## Chart ViewModel / Data Adapter

**Vị trí đề xuất:** `docs/implementation/Sprint_F4_M2_Implementation_Plan.md` (blueprint tạm thời; xoá khi M2 đóng, lưu Evidence Matrix vào `docs/implementation/archive/sprint-f4/`).
**Phiên bản:** 1.1 — **`READY FOR IMPLEMENTATION`** (Mục 34; đã chốt D-M2-1…D-M2-4 ngày 2026-10-11).
**Căn cứ:** audit tĩnh + chạy lệnh trên nhánh `dev` tại `7ff48cf` (2026-10-11); `docs/frontend/{Frontend_UI_Specification,Design_System_Specification,Frontend_Architecture_Specification,Frontend_Coding_Standards}.md`; `docs/implementation/Sprint_F4_Implementation_Plan.md`; `docs/architecture/Natal_Chart_Domain_Specification.md`; `docs/product/PRD.md`; mã Backend `backend/src/modules/chart/**`; fixture CAPTURED của M1.
**Quy ước nguồn:** `[repo]` đọc mã/tài liệu · `[C-run]` Claude chạy lệnh trong sandbox (`npm ci` theo lockfile, Node v22.22.2) · `[owner]` owner cung cấp.
**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `BLOCKED` · `DEFERRED` · `NOT APPLICABLE`.
**Phạm vi audit:** chưa chạy Backend (sandbox không có Postgres); kết luận về Backend là đọc mã, đối chiếu với hai response CAPTURED.

---

## 1. Executive Summary

M2 dựng **ranh giới dữ liệu trình bày** giữa `ChartResponse` (DTO của M1) và các component Chart Viewer: một lớp hàm thuần `toChartViewModel` cùng bảng nhãn/glyph tiếng Việt, `formatDegreeMinute` và thứ tự chính tắc tất định. Không React, không state, không geometry, không diễn giải.

**M1 đã hoàn tất về kỹ thuật** (Mục 4): HEAD `7ff48cf` — format/lint/**typecheck thật**/build exit 0; 87 file, **458 test** passed; fixture CAPTURED khớp byte với response gốc. Điều kiện hình thức còn lại: liên kết Frontend CI của `7ff48cf` (liên kết đã gửi là Backend CI #269).

**Phát hiện quan trọng (đều có bằng chứng) — plan khác prompt/tài liệu ở các điểm sau:**

| # | Phát hiện | Hệ quả |
|---|---|---|
| 1 | **Design System §5 là "Spacing System", không phải glyph.** Glyph nằm ở **UI Spec §5.1** (Iconography); DS §9.1 chỉ nhắc khung. Prompt M2 và dòng "Inspect" của FE-S4.2 trong F4 plan trỏ sai. | Nguồn glyph chuẩn = UI Spec §5.1 + §12.8–12.11. |
| 2 | **Spec chỉ định nghĩa một phần glyph/nhãn**: 10 glyph hành tinh (đủ), 3/12 glyph cung (`♈ ♉ ♊...`), 5 glyph aspect (đủ), `℞`; **không** có glyph Chiron/Lilith/Nút, không có nhãn tiếng Việt cho 4 aspect (chỉ "Vuông chiếu"), 3 góc, 3 nature, hệ nhà. | Một bảng **đề xuất** cần owner duyệt (D-M2-3); không tự chọn trong component. |
| 3 | **Định dạng độ mâu thuẫn:** UI Spec §12.2 và Architecture Spec ghi `15°23'47"` (có giây, ký tự ASCII); F4 plan ghi `D°MM′` (không giây, U+2032) và "làm tròn tới phút". | Quyết định D-M2-1/D-M2-2 (có số liệu fixture minh hoạ). |
| 4 | **Nhãn nature lệch định danh:** Backend `Harmonious/Challenging/Neutral`, UI Spec §12.11 `Harmonious/Tense/Neutral`. | Backend là nguồn chuẩn cho `key`; ánh xạ sang nhóm hiển thị `tense` (D-M2-4). |
| 5 | **Nhà không có ≠ chưa biết giờ sinh.** Backend đặt `isHouseDataAvailable = houses.length === 12`; `houses=[]` xảy ra khi (a) chưa biết giờ sinh (**không** có warning) hoặc (b) Placidus không hội tụ (**có** warning `HOUSE_SYSTEM_NOT_CONVERGING`). | `UnknownTimeNotice` không được khẳng định nguyên nhân; VM chuyển tiếp `warnings` (Mục 14). |
| 6 | **`partialData` với Backend hiện tại luôn là `false` cho response hợp lệ:** engine all-or-nothing (lỗi tính ⇒ `422 CHART_CALCULATION_FAILED`, không có chart "thiếu một hành tinh"). | Giữ làm cờ phòng thủ trước drift hợp đồng, định nghĩa chặt (Mục 14). |
| 7 | F4 plan §15 yêu cầu `meta.calculatedAt` "định dạng `vi-VN`": phụ thuộc locale/múi giờ chạy ⇒ vi phạm tính thuần/tất định. | VM giữ ISO thô; định dạng ngày đẩy sang UI (D-M2-6). |
| 8 | Architecture Spec §8.4: hook "trả Model đã map"; F3/M1: hook trả DTO; F4 plan: VM qua `useMemo`. | Giữ DTO ở hook (đã đóng băng ở M1); `useMemo` ở consumer (Mục 7). |
| 9 | Không có mã trùng lặp nào cần dọn: `src` chưa có `formatDegree`, glyph, bảng nhãn, hay `Selection`. | Nhiệm vụ "xoá trùng lặp" = `NOT APPLICABLE`. |
| 10 | Glyph hiển thị phụ thuộc font hệ thống: Display = `Newsreader, Georgia, serif`, không có font ký hiệu chuyên dụng. | Rủi ro render (R-3); kiểm thủ công ở S4.4/S4.7, không ở M2. |

## 2. Sprint Context and Objective

```text
Birth Profile → Calculate/Retrieve → ChartResponse (M1, DTO)
        → toChartViewModel (M2) → ChartViewModel
        → Wheel / Planet · House · Aspect Tables / Selection (S4.3+)
```

**Mục tiêu M2:** mọi giả định về hợp đồng Backend (enum tiếng Anh, thứ tự, đơn vị độ, nullable, cờ suy giảm) nằm ở **một** nơi; component chỉ đọc `ChartViewModel`. **Không** tính vị trí, đỉnh nhà, aspect, orb; **không** vẽ.

**Ranh giới trách nhiệm:**

| Tầng | Sở hữu |
|---|---|
| Tính toán chiêm tinh | Backend |
| Chuẩn hoá DTO + định dạng trình bày + thứ tự | **F4 M2** |
| Hình học/vẽ (SVG, toạ độ, dàn nhãn) | S4.4–S4.6 |
| Selection/hover | S4.8 |

## 3. Current Repository State

| Hạng mục | Thực tế | Trạng thái |
|---|---|---|
| HEAD | `7ff48cf` (`dev`); chuỗi `f3bdb61 → 4a1bd10 → 7ff48cf` | VERIFIED [repo] |
| `features/chart/` | chỉ có `api/` và `hooks/` (M1). **Không có `model/`, `ui/`, `index.ts`** | VERIFIED [repo] |
| Tiền lệ `model/` | `features/auth/model/` tồn tại; `features/birth-profile` không có | VERIFIED [repo] |
| Mã trùng lặp | `grep` `formatDegree|degreeLabel|°|′|″`, glyph (`☉ ☽ ♈ ℞ ☌`), nhãn (`Bạch Dương|Sao Hỏa|Mặt Trăng|Ma Kết`), `PlanetKey|AspectKey|Selection` trong `src` (trừ fixture) = **0** | VERIFIED [C-run] |
| Scripts | `lint`=`eslint .`; **`typecheck`=`tsc -p tsconfig.app.json --noEmit` (đã sửa ở `7ff48cf`)**; `build`=`tsc -p tsconfig.app.json --noEmit && vite build`; `test`=`vitest run --passWithNoTests`; `test:coverage`; `format:check`=`prettier --check .` | VERIFIED [repo] |
| TS flags | `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly` (**không `enum`**), `noUnusedLocals/Parameters`; TypeScript `^5.6.3` (có `satisfies`) | VERIFIED [repo] |
| Gate chất lượng tại HEAD | format ✓ · lint ✓ · typecheck exit 0 ✓ · build exit 0 ✓ · 87 file / 458 test ✓ · coverage 92.38% stmts | VERIFIED [C-run] |
| Font | `--font-display: "Newsreader", Georgia, "Times New Roman", serif` (`tokens.css`); `base.css` có `@font-face` Newsreader | VERIFIED [repo]; độ phủ glyph chiêm tinh UNVERIFIED |
| Coverage thresholds | không cấu hình ngưỡng trong `vite.config.ts` | VERIFIED [repo] |

## 4. M1 Prerequisite Verification

| Hạng mục M2 cần | Bằng chứng | Trạng thái |
|---|---|---|
| `ChartResponse` + `KNOWN_*` + union (`types.ts`) | file có mặt; `fixtures.contract.test.ts` (20 test) khoá key-set, enum, bất biến nhà | VERIFIED |
| Fixture CAPTURED `chartFull` (21 diễn giải), `chartNoHouses` (10) | deep-equal với JSON gốc ở `docs/implementation/archive/sprint-f4/evidence/` = true [C-run] | VERIFIED |
| Hooks (`useChartQuery`…) trả DTO, đã có test | 7+2+5 test | VERIFIED |
| Cổng kiểm kiểu thật | `npm run typecheck` exit 0 | VERIFIED |
| CI | Backend CI #269 Success trên `7ff48cf`; Frontend CI #225 Success trên `f3bdb61`; **Frontend CI trên `7ff48cf` chưa có liên kết** | PARTIALLY VERIFIED — điều kiện hình thức, không chặn viết mã |
| Hồ sơ M1 | Evidence Matrix M1 đã lập (file kèm theo); blueprint M1 còn trong `docs/implementation/` | PARTIALLY VERIFIED |

**Kết luận:** M1 đủ làm tiền đề; không có blocker kỹ thuật. M2 **không** nhân bản kiểu API: `import type { ChartResponse, … } from "../api/types"` và dùng lại `KNOWN_*`.

## 5. Specification Audit

| Tài liệu / mục | Kết quả | Dùng cho |
|---|---|---|
| **Design System §5** | "Spacing System" — **không liên quan glyph** (prompt sai tham chiếu) | — |
| Design System §9.1, §9.3 | Glyph Unicode là nguồn **duy nhất** cho biểu tượng domain; cấm trộn Lucide cho cùng khái niệm; **`℞` là glyph domain** (không phải icon Lucide) | Quy tắc glyph |
| Design System §4.5 | `tabular-nums` bắt buộc cho số liệu domain (độ, orb) | Lưu ý cho component, không cho formatter |
| **UI Spec §5.1/§5.3** (Iconography) | Glyph chuẩn Unicode `☉ ☽ ☿ ♀ ♂ ♃ ♄ ♅ ♆ ♇, ♈ ♉ ♊...` render bằng font Display, đặt trong `PlanetBadge`/`SignBadge`; glyph mặc định `color-text-primary` | Nguồn glyph |
| **UI Spec §12.8** Planet Badge | enum 14 giá trị `Sun…Chiron, Lilith, NorthNode, SouthNode`; `aria-label` "Sao Diêm Vương, nghịch hành" | 14 vật thể, a11y |
| **§12.9** Sign Badge | enum 12 cung; `aria-label` có nguyên tố ("Sư Tử, thuộc nguyên tố Lửa"); dot màu Element | Nguyên tố: DEFERRED (Mục 30) |
| **§12.10** House Badge | số 1–12, `roman|arabic` là **tuỳ chọn UI**; `aria-label` "Nhà thứ 5" | VM chỉ giữ số |
| **§12.11** Aspect Badge | ☌ ☍ □ △ ⚹; nhóm **Harmonious** (Trine, Sextile) / **Tense** (Square, Opposition) / **Neutral** (Conjunction); `aria-label` "Vuông chiếu" | Glyph aspect, nature |
| §12.2 Planet Table | cột Độ `15°23'47"`; 10 hành tinh + Chiron + tuỳ chọn Lilith/Nodes; lỗi một phần ⇒ Alert + vẫn hiện hàng hợp lệ | Xung đột D-M2-1; hợp đồng suy giảm |
| §12.3/12.4 | House Table: `ASC/MC/DSC/IC`; Aspect Table: Orb `2°14'`, sắp theo orb tăng dần | Thứ tự aspect; nhãn góc |
| F4 plan §15, §17, §20, §22, §26, FE-S4.2 | thiết kế VM, thứ tự, `D°MM′`, `selection.ts` thuộc S4.8 | Quyết định đã duyệt (nguồn #1) |
| Architecture Spec §8.4, dòng 182/222 | mapper DTO→Model; `shared/lib/formatDegree(decimal): "15°23'47″"` | Xung đột C-7, D-M2-11 |
| Natal Chart Domain Spec (D-3, "House System Fallback Policy") | không tự fallback Whole Sign; khi Placidus không hội tụ ⇒ `houses=[]` + warning | Ngữ nghĩa `houseDataAvailable` |
| PRD FR-02/FR-03 | chưa biết giờ sinh ⇒ 12:00 + cảnh báo; 10 thiên thể | Ngữ cảnh |

### 5.1 Xung đột nguồn

| ID | Xung đột | Tác động | Đề xuất | Triển khai được? |
|---|---|---|---|---|
| X-1 | Tham chiếu glyph sai (DS §5 vs UI §5.1) | nhầm nguồn | dùng UI §5.1 | Có |
| X-2 | Độ: `D°M′S″` (UI §12.2, Arch) vs `D°MM′` (F4 plan) | định dạng bảng | D-M2-1 | Sau khi owner chốt |
| X-3 | Làm tròn vs cắt (F4 plan "làm tròn" + "nhớ ở lớp gọi") | `29°59.7′`⇒`30°00′` lệch cung | D-M2-2 | Sau khi owner chốt |
| X-4 | `Challenging` (Backend) vs `Tense` (UI) | định danh | D-M2-4 | Có |
| X-5 | Thứ tự điểm tuỳ chọn: UI §12.8 `Chiron, Lilith, NorthNode, SouthNode`; Backend/F4 plan `Chiron, NorthNode, SouthNode, Lilith` | **nằm im** (Backend chỉ trả 10 điểm khi `includeOptionalPoints: []`) | D-M2-5 (theo F4 plan) | Có |
| X-6 | UI §12.2 liệt kê Chiron mặc định vs F4 O-F4-3 không gửi điểm tuỳ chọn | bảng chỉ 10 hàng | giữ O-F4-3; VM hỗ trợ đủ 14 | Có |
| X-7 | Arch §8.4 (hook trả Model) vs hook trả DTO | vị trí gọi adapter | DTO ở hook, `useMemo` ở consumer | Có |
| X-8 | F4 plan `meta.calculatedAt` định dạng `vi-VN` vs tính thuần | tất định | D-M2-6 | Có |
| X-9 | Chính tả: Backend "Hỏa/Thủy/Tọa", thông báo M1 "Toạ" | nhất quán | D-M2-9 | Có |

## 6. Backend DTO / ChartResponse Audit

Nguồn: `chart-response.mapper.ts`, `chart-builder.ts`, calculators, hai fixture CAPTURED.

| Thuộc tính | Phát hiện | Trạng thái |
|---|---|---|
| Đơn vị | `longitude`, `cuspDegree`, `angles[].longitude` là **kinh độ tuyệt đối thập phân** `[0,360)`; `degreeInSign` là **thập phân trong cung** `[0,30)`; `orb`, `exactAngle` là độ thập phân. Không có field phút/giây | VERIFIED [repo]+[C-run] |
| Nhà | `houses` có `number 1..12` và `cuspDegree` tuyệt đối; **không có `degreeInSign` cho nhà** (F4 plan: dùng `cuspDegree mod 30`; fixture khớp `signOnCusp` ở cả 12 nhà) | VERIFIED |
| `isHouseDataAvailable` | `= houses.length === 12`; `houses=[]` khi `!isBirthTimeKnown` (không warning) hoặc khi Placidus `not_convergent` (có warning `HOUSE_SYSTEM_NOT_CONVERGING`, severity `warning`) | VERIFIED [repo] |
| `planets[].house` | `number|null`; `null` khi không có nhà | VERIFIED |
| Warning duy nhất Backend phát | `HOUSE_SYSTEM_NOT_CONVERGING`; fixture có/không giờ sinh đều `warnings: []` | VERIFIED |
| Thứ tự trả về | planets: Sun→Pluto (theo `KNOWN_PLANET_NAMES`); houses 1..12; angles `Ascendant, Midheaven, Descendant, ImumCoeli`; aspects theo vòng lặp cặp (`i<j` theo thứ tự hành tinh) **không phải** theo orb. **Không có cam kết thành văn** | VERIFIED chỉ ở fixture |
| Aspect | `planetA/planetB` được chuẩn hoá theo thứ tự chữ cái (quan sát 9/9, không phải hợp đồng); `nature` do Backend cấp: `Conjunction→Neutral`, `Opposition→Challenging`, `Trine/Sextile→Harmonious` (Square chưa có trong fixture) | VERIFIED một phần |
| Vật thể | Enum Backend: 14 (`10 + Chiron, NorthNode, SouthNode, Lilith`); mặc định trả 10 | VERIFIED |
| `patterns` | luôn `[]` (stub, G-13) | VERIFIED |
| `interpretations`, `interpretationVersion` | có trong DTO; M2 **bỏ qua** | VERIFIED |
| `tone` | luôn `null` ở fixture | VERIFIED |

Rút ra: (1) không thể suy `partialData` từ Backend (Mục 14); (2) không được suy "chưa biết giờ sinh" từ `isHouseDataAvailable`; (3) không dựa vào thứ tự Backend.

## 7. Current Frontend Data Flow

M1 (đã đóng băng): `useChartQuery(id)`/`useCreateNatalChartMutation` trả `ChartResponse`; cache TanStack giữ **DTO** (mutation `setQueryData` bằng DTO). Chưa có consumer.

Dòng mục tiêu: `const vm = useMemo(() => (data ? toChartViewModel(data) : null), [data])` tại page/`ChartViewer` (S4.3). `toChartViewModel` có thể ném `ChartViewModelError` (Mục 15) ⇒ route error boundary/`reportError`. **M2 không thêm hook.** Phương án thay thế (hook M1 dùng `select: toChartViewModel`) được ghi ở Mục 30 để S4.3 quyết định; M2 không bị ảnh hưởng.

## 8. Architecture and Dependency Boundaries

```text
features/chart/api/types.ts (M1)  ──type + KNOWN_*──►  features/chart/model/*  ──► (S4.3+) ui/**
```

- `model/**` chỉ được import: `../api/types` và file anh em trong `model/`. **Cấm:** `react`, `react-dom`, `@tanstack/*`, `@shared/*` (runtime), `window/document`, `Date`/`Intl`/`toLocale*`/`localeCompare`, `Math.random`.
- ESLint `boundaries` đang tắt ⇒ bảo đảm bằng **grep gate** (Mục 28) ở M2.4, không sửa cấu hình ESLint.
- `ui/**` (sau này) **không** import `../api/types` để đọc enum; chỉ đọc `ChartViewModel`.

## 9. ViewModel Design

**Nguyên tắc:** nhỏ nhất có thể; giữ số liệu thô khi hình học cần; không đổi tên field chỉ để đổi tên.

```ts
// labels.ts
export interface GlyphLabel { readonly key: string; readonly labelVi: string; readonly glyph: string | null; readonly known: boolean; }
export interface AngleLabel { readonly key: string; readonly shortLabel: string | null; readonly labelVi: string; readonly ariaLabel: string; readonly known: boolean; }
export type NatureTone = "harmonious" | "tense" | "neutral" | "unknown";
export interface NatureLabel { readonly key: string; readonly labelVi: string; readonly tone: NatureTone; readonly known: boolean; }

// chartViewModel.ts
export type PlanetKey = string;   // Backend name, định danh ổn định (dùng cho Selection ở S4.8)
export type AspectKey = string;   // `${planetA}:${type}:${planetB}` (+ `#n` nếu trùng)

export interface PlanetVM { key: PlanetKey; nameVi: string; glyph: string | null; known: boolean;
  longitude: number; sign: GlyphLabel; degreeLabel: string | null; houseNumber: number | null;
  isRetrograde: boolean; ariaLabel: string; }
export interface HouseVM { number: number; labelVi: string; ariaLabel: string; cuspLongitude: number;
  sign: GlyphLabel; degreeLabel: string | null; }
export interface AngleVM { key: string; known: boolean; shortLabel: string | null; labelVi: string; ariaLabel: string;
  longitude: number; sign: GlyphLabel; degreeLabel: string | null; }
export interface AspectVM { key: AspectKey; planetA: GlyphLabel; planetB: GlyphLabel; type: GlyphLabel;
  nature: NatureLabel; orb: number; orbLabel: string | null; isApplying: boolean; applyingLabelVi: string; }
export interface ChartWarningVM { code: string; severity: "info" | "warning"; labelVi: string | null; }
export type ChartIssueCode = "UNKNOWN_VALUE" | "VALUE_OUT_OF_RANGE" | "ENTRY_DROPPED" | "CORE_BODY_MISSING"
  | "HOUSE_FLAG_CONTRADICTION" | "DUPLICATE_ENTITY" | "ASPECT_ENDPOINT_MISSING";
export interface ChartIssue { code: ChartIssueCode; subject: string; }   // ví dụ "planet:Vesta"
export interface ChartViewModel {
  meta: { id: string; houseSystem: GlyphLabel; calculatedAt: string; engineVersion: string };
  flags: { houseDataAvailable: boolean; hasAngles: boolean; partialData: boolean; ascendantLongitude: number | null };
  planets: PlanetVM[]; houses: HouseVM[]; angles: AngleVM[]; aspects: AspectVM[];
  warnings: ChartWarningVM[]; issues: ChartIssue[];
}
```

| Câu hỏi của prompt | Quyết định |
|---|---|
| Mỗi DTO lồng cần ViewModel riêng? | Có 4 (`PlanetVM`, `HouseVM`, `AngleVM`, `AspectVM`) vì mỗi loại có trường trình bày khác nhau; **không** tạo VM cho cung/nhãn: dùng chung `GlyphLabel` |
| Trường được giữ thô | `longitude`, `cuspLongitude`, `angle.longitude`, `orb` (hình học và sắp xếp); `calculatedAt`, `engineVersion` |
| Trường trình bày sẵn | `nameVi`, `glyph`, `sign.labelVi`, `degreeLabel`, `orbLabel`, `ariaLabel`, `applyingLabelVi`, `tone` |
| Trường **không** vào VM | `speed`, `category`, `exactAngle`, `degreeInSign` (đã có nhãn), `chartType`, `patterns`, `interpretations`, `interpretationVersion`, `warnings[].message/field/details` |
| `issues` có thừa? | Không: làm `partialData` kiểm chứng được và thay thế mất dữ liệu im lặng. Phương án thay thế (chỉ boolean) ghi ở D-M2-7 |
| `ascendantLongitude` | Giữ đúng F4 plan (truyền thẳng, không tính); wheel dùng để xoay |
| `selection.ts` | DEFERRED (Mục 17); M2 chỉ xuất `PlanetKey`/`AspectKey` |

**Quy tắc phân tách ba khái niệm:** `labelVi` = nhãn ngữ nghĩa; `glyph` = ký hiệu thị giác (có thể `null`); `ariaLabel` = văn bản hỗ trợ tiếp cận (hành tinh: "Sao Diêm Vương, nghịch hành"; nhà: "Nhà thứ 5"; góc: "Cung Mọc (Ascendant)"). Aspect/sign dùng `labelVi` làm a11y text (đúng ví dụ §12.9/§12.11), không thêm trường dư.

## 10. `toChartViewModel` Contract

`toChartViewModel(dto: ChartResponse): ChartViewModel` — thuần, đồng bộ, không mutate `dto`, không phụ thuộc thời gian/locale/DOM.

**Pipeline (thứ tự cố định, quyết định thứ tự `issues`):**

1. **Kiểm cấu trúc** (Mục 15, lớp "cấu trúc"): `dto` là object; `id` là chuỗi; `isHouseDataAvailable` là boolean; `planets`, `houses`, `angles`, `aspects`, `warnings` là mảng. Sai ⇒ ném `ChartViewModelError`.
2. **Planets:** với mỗi phần tử (theo chỉ số đầu vào) kiểm trường bắt buộc (bảng bên dưới); hợp lệ ⇒ `PlanetVM`; sai ⇒ bỏ + `ENTRY_DROPPED`. Giá trị lạ ⇒ `known:false` + `UNKNOWN_VALUE`. Trùng `key` ⇒ giữ cả hai + `DUPLICATE_ENTITY`. Sắp xếp (Mục 13). So với 10 vật thể cốt lõi ⇒ `CORE_BODY_MISSING` cho từng thiếu.
3. **Houses:** hợp lệ khi `number` nguyên 1..12 và `cuspDegree` hữu hạn `[0,360)`. Tính `houseDataAvailable` hiệu lực (Mục 14). Chỉ phát `houses` khi hiệu lực `true`.
4. **Angles**, 5. **Aspects**, 6. **Warnings** (giữ thứ tự Backend), 7. **flags**, 8. **`partialData` = `issues` có mã thuộc tập partial**.

**Trường bắt buộc theo thực thể** (sai kiểu/miền ⇒ bỏ thực thể + `ENTRY_DROPPED`, `partialData=true`):

| Thực thể | Bắt buộc |
|---|---|
| Planet | `name` chuỗi không rỗng; `longitude` số hữu hạn `[0,360)`; `sign` chuỗi; `isRetrograde` boolean |
| House | `number` nguyên 1..12; `cuspDegree` số hữu hạn `[0,360)`; `signOnCusp` chuỗi |
| Angle | `type` chuỗi; `longitude` số hữu hạn `[0,360)`; `sign` chuỗi |
| Aspect | `planetA`, `planetB`, `aspectType` chuỗi; `orb` số hữu hạn `≥ 0` (khoá sắp xếp); `isApplying` boolean |

Trường **chỉ để hiển thị** sai miền (`degreeInSign` ngoài `[0,30)`, `planets[].house` không phải nguyên 1..12) ⇒ giữ thực thể, nhãn/giá trị `null`, ghi `VALUE_OUT_OF_RANGE` (không partial). Không tính lại cung từ kinh độ; không "đoán" nhà.

**Bất biến đầu ra:** cùng đầu vào ⇒ đầu ra bằng nhau từng phần tử (`toStrictEqual`) qua các lần gọi; kết quả không tham chiếu vào mảng/đối tượng của DTO (không alias).

## 11. Vietnamese Labels and Glyph Registry

**Biểu diễn:** `labels.ts` xuất các hằng `as const satisfies Record<UnionKey, …>` — **thiếu khoá là lỗi biên dịch** (nay typecheck là cổng thật) — cộng hàm tra cứu `resolveX(key: unknown): GlyphLabel` (dùng `Object.hasOwn`, không dùng `in`/truy cập trực tiếp để tránh khoá nguyên mẫu như `"constructor"`). Danh sách khoá đi theo `KNOWN_*` của M1 (không nhân bản).

**Hành vi giá trị lạ (một quy tắc):** `{ key: String(raw), labelVi: raw, glyph: null, known: false }`; `raw` không phải chuỗi/rỗng ⇒ `labelVi = "Không rõ"`. **Không** ánh xạ sang giá trị biết trước khác.

### 11.1 Bảng đề xuất (nguồn từng ô)

Ký hiệu nguồn: **S** = có trong spec đã duyệt; **B** = đối chiếu nội dung Backend (seed `interpretations.vi.json` + fixture); **P** = *đề xuất mới, cần owner duyệt (D-M2-3)*.

**Vật thể (14)**

| Key | `labelVi` | Glyph (code point) | Nguồn nhãn / glyph |
|---|---|---|---|
| Sun | Mặt Trời | ☉ U+2609 | S,B / S |
| Moon | Mặt Trăng | ☽ U+263D | B / S |
| Mercury | Sao Thủy | ☿ U+263F | B / S |
| Venus | Sao Kim | ♀ U+2640 | S,B / S |
| Mars | Sao Hỏa | ♂ U+2642 | B / S |
| Jupiter | Sao Mộc | ♃ U+2643 | B / S |
| Saturn | Sao Thổ | ♄ U+2644 | B / S |
| Uranus | Sao Thiên Vương | ♅ U+2645 | B / S |
| Neptune | Sao Hải Vương | ♆ U+2646 | B / S |
| Pluto | Sao Diêm Vương | ♇ U+2647 | S,B / S |
| Chiron | Chiron | ⚷ U+26B7 | P / P |
| Lilith | Lilith | ⚸ U+26B8 | P / P |
| NorthNode | Nút Bắc | ☊ U+260A | P / P |
| SouthNode | Nút Nam | ☋ U+260B | P / P |

**Cung (12)** — nhãn **B** (trích từ 120 mục `PlanetInSign`: mỗi cung xuất hiện nhất quán 9–10/10 lần): Aries Bạch Dương · Taurus Kim Ngưu · Gemini Song Tử · Cancer Cự Giải · Leo Sư Tử · Virgo Xử Nữ · Libra Thiên Bình · Scorpio Thiên Yết · Sagittarius Nhân Mã · Capricorn Ma Kết · Aquarius Bảo Bình · Pisces Song Ngư. Glyph ♈ U+2648 … ♓ U+2653 (theo thứ tự trên): **S** cho `♈ ♉ ♊`, **P** (Unicode chuẩn) cho 9 cung còn lại; thêm `U+FE0E` (VS15) sau mỗi glyph cung để buộc kiểu chữ (F4 plan §18).

**Aspect (5)**

| Key | `labelVi` | Glyph | Nguồn |
|---|---|---|---|
| Conjunction | Hợp | ☌ U+260C | P / S |
| Sextile | Lục hợp | ⚹ U+26B9 | P / S |
| Square | Vuông chiếu | □ U+25A1 | S / S |
| Trine | Tam hợp | △ U+25B3 | P / S |
| Opposition | Đối xung | ☍ U+260D | P / S |

**Góc (4)** — `shortLabel` theo UI §12.3/F4 plan §20; `labelVi`/`ariaLabel`:

| Key | `shortLabel` | `labelVi` | `ariaLabel` | Nguồn nhãn |
|---|---|---|---|---|
| Ascendant | ASC | Cung Mọc | Cung Mọc (Ascendant) | S (F4 plan §20) |
| Midheaven | MC | Thiên Đỉnh | Thiên Đỉnh (Midheaven) | P |
| Descendant | DSC | Cung Lặn | Cung Lặn (Descendant) | P |
| ImumCoeli | IC | Thiên Để | Thiên Để (Imum Coeli) | P |

**Hệ nhà (2):** Placidus → "Placidus"; WholeSign → "Whole Sign" (UI §12.3/§12.4, F4 plan; **không** có bản dịch được duyệt ⇒ giữ tên riêng). Không glyph.

**Nature (3):** Harmonious → "Hài hòa", tone `harmonious`; Challenging → "Căng thẳng", tone `tense`; Neutral → "Trung tính", tone `neutral` (**P** cho nhãn; ánh xạ tone **S** — §12.11). Màu (`indigo`/`brass`/`slate`) là token của component, **không** vào VM.

**Khác:** `RETROGRADE_GLYPH = "\u211E"` (℞, DS §9.3), `RETROGRADE_LABEL_VI = "Nghịch hành"` (S). `applyingLabelVi`: "Đang tới gần" / "Đang rời xa" (**P**). Warning `HOUSE_SYSTEM_NOT_CONVERGING` → "Không tính được chính xác hệ nhà tại vị trí này." (**P**); mã warning lạ ⇒ `labelVi: null`. Nhà: `labelVi` "Nhà 5", `ariaLabel` "Nhà thứ 5" (S).

**Chính tả (D-M2-9):** dùng kiểu mới thống nhất với nội dung Backend (Hỏa, Thủy, Tọa); lệch "Toạ" ở thông báo M1 ghi KG-F4M1-14.

### 11.2 Glyph — các điểm cần chú ý

| Vấn đề | Quyết định/kiểm tra |
|---|---|
| Biểu diễn | Chuỗi Unicode thuần (UI §5.1); **không** icon component, không SVG path |
| Kiểu chữ/emoji | Cung zodiac U+2648–2653 thường hiển thị kiểu emoji trên nhiều nền tảng ⇒ thêm `U+FE0E` (F4 plan §18). Kết quả thực tế iOS/Android/Windows **UNVERIFIED** (kiểm thủ công ở S4.4/S4.7) |
| Font | Display không có font ký hiệu chuyên dụng ⇒ phụ thuộc font hệ thống; component dùng `aria-hidden="true"` cho glyph và đọc `labelVi`/`ariaLabel` |
| Fallback | `glyph: null` ⇒ component hiển thị chữ viết tắt/`labelVi` (không dùng ký hiệu khác) |
| Nhất quán wheel–bảng | Cả hai chỉ đọc `glyph` từ VM ⇒ một nguồn |
| Test | Khẳng định bằng **chuỗi escape code point** (`"\u2609"`), không dán ký tự trực tiếp |

## 12. `formatDegreeMinute` Contract

Vị trí: `features/chart/model/format.ts` (D-M2-11: domain-chiêm-tinh, chỉ chart dùng; Architecture Spec nêu `shared/lib/formatDegree` ⇒ thăng cấp khi có consumer thứ hai).

**Chữ ký:** `formatDegreeMinute(value: number | null | undefined): string | null`

| Hạng mục | Quyết định |
|---|---|
| Đơn vị đầu vào | **độ thập phân** (bất kỳ giá trị trong `[0,360)`); hàm **không** biết đó là in-sign, kinh độ hay orb và **không** chuẩn hoá `mod 30/360` |
| Miền hợp lệ | số hữu hạn, `0 ≤ v < 360`; ngoài miền, `NaN`, `±Infinity`, âm, `null`, `undefined` ⇒ trả `null` (không ném lỗi) |
| Phút | `total = Math.floor(v * 60 + 1e-9)`; `độ = floor(total/60)`, `phút = total % 60`; phút luôn 2 chữ số |
| Giây | **không hiển thị** (D-M2-1) |
| Làm tròn | **cắt xuống phút (floor)** — khuyến nghị (D-M2-2): không bao giờ ra `30°00′` cho vị trí trong cung, không cần "nhớ" sang cung kế; phương án B (làm tròn gần nhất + nhớ phút) ghi bên dưới |
| Dung sai | `1e-9` phút chỉ để triệt nhiễu dấu phẩy động của giá trị chính xác (`15+23/60 ⇒ 15°23′`); hệ quả: giá trị cách mốc `30°00′` < ~1,7e-11° được coi là đã tới mốc (không xảy ra với dữ liệu thật; ghi KG-M2-01) |
| Ký hiệu | độ `°` (U+00B0), phút `′` (U+2032), **không dấu cách**, chữ số ASCII, không phân tách hàng nghìn |
| Không mutate / không phụ thuộc | thuần số học; không `Intl`, không locale |

**Bảng hợp đồng (số liệu lấy từ fixture CAPTURED, tính bằng script [C-run]):**

| Input | Output (floor) | Output nếu làm tròn gần nhất | Ghi chú |
|---|---|---|---|
| `0` | `0°00′` | `0°00′` | biên dưới |
| Sun `10.516911069942353` | `10°31′` | `10°31′` | |
| Moon `29.347306392035534` | `29°20′` | `29°21′` | **khác nhau** |
| Mars `9.794845786909718` | `9°47′` | `9°48′` | **khác nhau** |
| Neptune `12.027048547453887` | `12°01′` | `12°02′` | **khác nhau** |
| Orb Jupiter–Sun `5.328870761158669` | `5°19′` | `5°20′` | **khác nhau** |
| Orb Jupiter–Uranus `0.5798951497815779` | `0°34′` | `0°35′` | |
| Cusp H1 `14.89132122052622 % 30` | `14°53′` | `14°53′` | cusp in-sign |
| `15 + 23/60` | `15°23′` | `15°23′` | chống nhiễu float |
| `29.9999999` | `29°59′` | `30°00′` | biên cung |
| `359.99` | `359°59′` | `0°00′`/`360°00′` ⚠ | biên miền |
| `360`, `400`, `-0.1`, `NaN`, `Infinity`, `null`, `undefined` | `null` | `null` | không hợp lệ |

Trong 10 hành tinh của fixture, floor và làm tròn khác nhau ở **3/10** giá trị; ở 9 orb khác nhau ở 6/9 — nên đây là quyết định hiển thị có thật, không phải chi tiết kỹ thuật.

**Quyết định cần owner chốt:**
- **D-M2-1:** dùng `D°MM′` (F4 plan + tên hàm) thay cho `D°M′S″` của UI §12.2/Architecture §222. *Khuyến nghị:* giữ `D°MM′`, ghi lệch spec vào Decision Log; nếu muốn giây thì thêm `formatDegreeMinuteSecond` riêng (ngoài M2).
- **D-M2-2:** floor (khuyến nghị) hay làm tròn gần nhất + nhớ phút. Đổi giữa hai phương án chỉ là một dòng trong hàm và bảng kỳ vọng của test.

## 13. Canonical Ordering

Nguồn thứ tự = **các mảng `KNOWN_*` của M1** (không nhân bản), được ghim bằng một test (Mục 27) để đổi thứ tự mảng phải sửa test có chủ đích. So sánh chuỗi bằng toán tử `<` (đơn vị mã), **không** `localeCompare`.

| Tập | Thứ tự chính tắc | Nguồn thẩm quyền | Tie-break | Thiếu | Giá trị lạ |
|---|---|---|---|---|---|
| Planets | `Sun…Pluto, Chiron, NorthNode, SouthNode, Lilith` | F4 plan §15 (= `KNOWN_PLANET_NAMES`) | chỉ số đầu vào | không bịa; 10 vật thể cốt lõi thiếu ⇒ `CORE_BODY_MISSING` | xếp **sau** các vật thể biết, theo `key` tăng dần (`<`), rồi chỉ số đầu vào; giữ nhãn gốc |
| Houses | `number` 1→12 | UI §12.3, Backend | chỉ số đầu vào (trùng số ⇒ cả hai giữ + `DUPLICATE_ENTITY`; khi `houseDataAvailable` hiệu lực sẽ sai ⇒ mất hiệu lực) | không bịa nhà thiếu | n/a (số không hợp lệ ⇒ bỏ) |
| Angles | `Ascendant, Midheaven, Descendant, ImumCoeli` | F4 plan §15 (= `KNOWN_ANGLE_TYPES`) | chỉ số đầu vào | không bịa | như planets |
| Aspects | `orb` tăng dần → chỉ số `planetA` → chỉ số `planetB` → chỉ số loại (`KNOWN_ASPECT_TYPES`) → chỉ số đầu vào | UI §12.4 ("sắp xếp theo orb tăng dần") + F4 plan §15 | như dòng trước; so `orb` bằng `<` số học | n/a | chỉ số của vật thể/loại lạ = `+∞`, rồi so `key` bằng `<` |
| Warnings | thứ tự Backend (ổn định) | Backend | — | — | giữ, `labelVi: null` |
| Issues | thứ tự xử lý của pipeline (Mục 10) | M2 | chỉ số thực thể | — | — |

- Không khử trùng lặp vì nhãn giống nhau; `AspectKey` trùng ⇒ hậu tố `#2`, `#3` theo thứ tự đầu vào (tất định).
- Hoán vị bất kỳ của mảng đầu vào cho **cùng** đầu ra khi không có phần tử trùng khoá hoàn toàn; khi có trùng hoàn toàn, thứ tự đầu vào quyết định (ổn định).

## 14. Degraded-Data Semantics

### 14.1 `houseDataAvailable`

`houseDataAvailable = dto.isHouseDataAvailable === true && houses hợp lệ gồm đúng số 1..12, mỗi số một lần`.

| Tình huống | Kết quả |
|---|---|
| Flag `true` + đủ 12 nhà hợp lệ | `true`; phát `houses`, `planets[].houseNumber` giữ |
| Flag `false` + `houses=[]` | `false`; `houses=[]`; `houseNumber=null` hết; **không** lỗi |
| Flag `true` nhưng nhà thiếu/trùng/sai số | `false` + `HOUSE_FLAG_CONTRADICTION` (**partial**); `houses=[]`, `houseNumber=null` |
| Flag `false` nhưng `houses` không rỗng | `false` + `HOUSE_FLAG_CONTRADICTION` (**partial**); bỏ `houses` |

Không bịa cusp, không gán nhà mặc định, không coi là lỗi tính. Hành tinh/cung/aspect hợp lệ **luôn** được giữ. `hasAngles = angles.length > 0` (độc lập với `houseDataAvailable`; `ascendantLongitude` = kinh độ góc `Ascendant` nếu có).

### 14.2 `partialData`

**Định nghĩa:** `true` ⇔ chart **dùng được** nhưng adapter **không thể trình bày đầy đủ dữ liệu mà hợp đồng bảo đảm**, tức `issues` chứa ít nhất một mã trong tập **{ `ENTRY_DROPPED`, `CORE_BODY_MISSING`, `HOUSE_FLAG_CONTRADICTION` }`.

**Không** làm `partialData=true`: `houseDataAvailable=false` hợp lệ; thiếu giờ sinh; mảng tuỳ chọn rỗng (`aspects`, `patterns`, `interpretations`, `warnings`); thiếu điểm tuỳ chọn (Chiron…); giá trị lạ hiển thị được (`UNKNOWN_VALUE`); `VALUE_OUT_OF_RANGE`; `DUPLICATE_ENTITY`; `ASPECT_ENDPOINT_MISSING`.

**Khả năng suy ra:** `PARTIALLY VERIFIED` — suy ra tin cậy được từ DTO (Mục 10), nhưng Backend hiện **không** phát chart một phần, nên với response hợp lệ `partialData` luôn `false` (kiểm bằng cả hai fixture). Đây là cờ phòng thủ, đồng thời đáp ứng kịch bản "lỗi một phần" của UI §12.2 nếu hợp đồng đổi. Không bịa warning/lỗi Backend.

### 14.3 Phân biệt các trạng thái (hợp đồng cho UI sau này)

| Trạng thái | Nơi biểu diễn |
|---|---|
| Trường tuỳ chọn vắng mặt bình thường | `null` trong VM, không issue |
| Không có nhà | `houseDataAvailable=false` (+ `warnings` cho nguyên nhân nếu có) |
| Chart hợp lệ nhưng thiếu cho một số hiển thị | `partialData=true` + `issues` |
| Dữ liệu hỏng/mâu thuẫn cấu trúc | `ChartViewModelError` (không có VM) |
| Request thất bại | lớp API/`ApiError` (ngoài M2) |

UI **không** được khẳng định "do chưa biết giờ sinh" khi `!houseDataAvailable`; dùng `warnings` (ví dụ `HOUSE_SYSTEM_NOT_CONVERGING`) để chọn thông điệp, mặc định dùng câu "thường do chưa biết giờ sinh" như F4 plan §31.

## 15. Unknown / Malformed Value Handling

**Một chiến lược duy nhất, không thêm abstraction mới:** hàm *tổng* đối với DTO đúng cấu trúc; lỗi giá trị ⇒ suy giảm có ghi nhận; hỏng cấu trúc ⇒ ném lỗi có kiểu. `ChartViewModelError extends Error` (cùng kiểu với `ApiError` đã có trong `shared/api/client`), mang `code: "MALFORMED_CHART_RESPONSE"` và `path` (ví dụ `"planets"`). Không bắt mọi ngoại lệ, không trả VM rỗng.

| Lớp (prompt Mục 14) | Ví dụ | Hành vi | Ghi nhận | `partialData` |
|---|---|---|---|---|
| 1. Biết và hợp lệ | `Sun`, `Aries`, `Trine` | ánh xạ bình thường | — | — |
| 2. Lạ nhưng hiển thị được | hành tinh `Vesta`, cung `Ophiuchus`, aspect `Quintile`, nature `Mixed`, hệ nhà `Koch`, severity lạ | giữ khoá gốc, `known:false`, `labelVi = khoá gốc`, `glyph=null`; nature lạ ⇒ `tone:"unknown"`; severity lạ ⇒ `"warning"` | `UNKNOWN_VALUE` | không |
| 3. Tuỳ chọn không có | `house: null`, `tone`, mảng rỗng | `null`/`[]` | — | không |
| 4. Hỏng/mâu thuẫn | thực thể thiếu trường bắt buộc, kinh độ `NaN`/`≥360`, `orb<0`, cờ nhà mâu thuẫn, trùng khoá | bỏ thực thể (nếu thiếu trường bắt buộc) hoặc giữ (trùng); bỏ nhà khi mâu thuẫn | `ENTRY_DROPPED` / `HOUSE_FLAG_CONTRADICTION` / `DUPLICATE_ENTITY` | có / có / không |
| 4b. Hỏng cấu trúc | `planets` không phải mảng; `dto` không phải object; `isHouseDataAvailable` không phải boolean; thiếu `id` | **ném `ChartViewModelError`** | — | — |
| 5. Không hỗ trợ cho một tính năng UI | aspect nối với vật thể vắng trong `planets` | giữ aspect cho bảng; `ASPECT_ENDPOINT_MISSING` để wheel bỏ vẽ đường | `ASPECT_ENDPOINT_MISSING` | không |

- **Vị trí kiểm tra:** *bên trong adapter, phòng thủ, chỉ ở mức kiểu/miền cần cho an toàn trình bày.* Không nhân bản schema runtime đầy đủ; không thêm Zod (nhất quán F3/M1; `ChartResponse` đã được Backend xác thực bằng Zod trước khi gửi). TypeScript union **không** bảo vệ runtime — vì vậy `resolveX` luôn nhận `unknown`.
- Người dùng cuối chỉ thấy lỗi qua error boundary của S4.3 (thông báo chung + `reportError`); `issues` do consumer quyết định có `reportError` hay không (M2 không gọi).
- `issues` là **dữ liệu**, không phải log; adapter không gọi `console`/`reportError`.

## 16. Interpretation Data Boundary

`interpretations` và `interpretationVersion` **không bao giờ được đọc** (`toChartViewModel` không truy cập hai trường này). Hệ quả kiểm chứng được:

1. VM của `chartFull` bằng VM của bản sao có `interpretations: []`, `interpretationVersion: null`, hoặc nội dung rác/rất lớn/malformed (mảng chứa `null`) — `toStrictEqual`.
2. Không ảnh hưởng thứ tự hành tinh, `houseDataAvailable`, `partialData`, `issues`.
3. VM không có khoá liên quan diễn giải. Lưu `interpretationVersion` làm metadata: **không cần** (F4 plan Mục 40: "giữ trong DTO, không vào VM"; F5 đọc từ DTO).

## 17. State Architecture

M2 không thêm React state, Zustand, Redux, Context, hook, store, subscription hay event bus. `ChartViewModel` là dữ liệu dẫn xuất (Mục 7).

**`selection.ts` — quyết định: DEFER sang S4.8.** F4 plan §26 và FE-S4.8 giao reducer `Selection` (`none | planet | aspect`) cho tác vụ tương tác, cùng quy tắc Esc/lọc aspect; hợp đồng M2 trong prompt chỉ yêu cầu selection "nếu spec hiện hành bắt buộc". M2 chỉ xuất `PlanetKey`/`AspectKey` (định danh ổn định, thuần kiểu) để S4.8 dùng mà không phải đổi VM. Không tạo `selection.ts` rỗng.

## 18. Proposed File Structure

```text
frontend/src/features/chart/model/
├── labels.ts                 # registry nhãn/glyph + resolveX + RETROGRADE_* (F4-M2.1)
├── labels.test.ts
├── format.ts                 # formatDegreeMinute (F4-M2.2)
├── format.test.ts
├── chartViewModel.ts         # kiểu VM + ChartViewModelError + toChartViewModel (F4-M2.3)
└── chartViewModel.test.ts
```

| Ứng viên | Quyết định |
|---|---|
| `labels.ts` | **Create** |
| `format.ts` | **Create** |
| `chartViewModel.ts` | **Create** (kiểu VM đặt cùng file; tách `types.ts` khi vượt ~300 dòng) |
| `selection.ts` | **Defer → S4.8** |
| `model/index.ts` / `features/chart/index.ts` | **Không tạo** ở M2 (F3 không có; thuộc S4.3) |
| `shared/lib/formatDegree` | **Không tạo** (D-M2-11) |

Test đặt cạnh nguồn (`*.test.ts`), giống M1. **Không sửa** `api/types.ts`, hooks, `shared/**`, `src/test/**`, cấu hình, `package.json`.

## 19. Implementation Task Breakdown

Thứ tự: **F4-M2.0 (cổng quyết định)** → **M2.1 ∥ M2.2** → **M2.3** → **M2.4**.

### F4-M2.0 — Cổng quyết định (không mã) — **ĐÃ HOÀN TẤT**
Owner đã xác nhận và đồng thuận với toàn bộ D-M2-1…D-M2-4 và bảng đề xuất Mục 11.1 (ô **P**) ngày 2026-10-11. Quyết định đã ghi vào Decision Log. Cổng M2.0 đã mở cho M2.1 và M2.2.

### F4-M2.1 — Labels and Glyph Registry
1. **Objective:** `labels.ts` + test. 2. **Why:** một nguồn nhãn/glyph cho wheel và bảng. 3. **Preconditions:** M2.0; `api/types.ts`. 4. **Inspect:** `types.ts`, UI §5.1/§12.8–12.11, Mục 11. 5. **Change:** tạo `model/labels.ts`, `model/labels.test.ts`. 6. **Steps:** (a) khai báo `PLANET_LABELS`…`NATURE_LABELS` bằng `as const satisfies Record<…>`; (b) `resolvePlanet/Sign/AspectType/Angle/HouseSystem/AspectNature/WarningCode(key: unknown)` với `Object.hasOwn`; (c) hằng `RETROGRADE_*`, `UNKNOWN_LABEL_VI`; (d) test. 7. **I/O:** `unknown → GlyphLabel/AngleLabel/NatureLabel`. 8. **Giá trị lạ:** Mục 11. 9. **Tests:** Mục 27 nhóm B. 10. **Verify:** `npx vitest run src/features/chart/model/labels.test.ts`; `npm run typecheck`. 11. **Acceptance:** đủ 14/12/5/4/2/3; glyph đúng code point; lạ ⇒ fallback; khoá nguyên mẫu (`constructor`, `__proto__`) ⇒ lạ. 12. **Dependencies:** M2.0. 13. **Out of scope:** React, màu, nguyên tố cung.

### F4-M2.2 — Formatting Utilities
1. **Objective:** `formatDegreeMinute`. 3. **Preconditions:** M2.0 (D-M2-1/2). 5. **Change:** `model/format.ts`, `format.test.ts`. 6. **Steps:** theo Mục 12; hằng `DEGREE_SIGN`, `MINUTE_SIGN`, `EPS_MINUTES`. 7. **I/O:** `number|null|undefined → string|null`. 8. **Lạ/invalid:** `null`. 9. **Tests:** nhóm C. 10. **Verify:** `npx vitest run …/format.test.ts`. 11. **Acceptance:** bảng Mục 12 đúng từng dòng; không mutate/không phụ thuộc môi trường. 12. **Dependencies:** M2.0. 13. **Out of scope:** `normalizeLongitude` và mọi hàm hình học (S4.4).

### F4-M2.3 — Chart ViewModel and Canonical Ordering
1. **Objective:** kiểu VM + `ChartViewModelError` + `toChartViewModel`. 3. **Preconditions:** M2.1, M2.2. 5. **Change:** `model/chartViewModel.ts`, `chartViewModel.test.ts`. 6. **Steps:** (a) kiểu; (b) kiểm cấu trúc ⇒ lỗi; (c) planets (kiểm, nhãn, sắp xếp, cốt lõi); (d) houses + cờ hiệu lực; (e) angles + `ascendantLongitude`; (f) aspects (key, sắp xếp, endpoint); (g) warnings; (h) `flags`/`partialData`; (i) test với `chartFull`, `chartNoHouses` và biến thể dựng bằng `structuredClone`. 7. **I/O:** `ChartResponse → ChartViewModel` (hoặc ném `ChartViewModelError`). 8. **Hành vi lạ/hỏng:** Mục 15. 9. **Tests:** nhóm A, D, E, F. 10. **Verify:** `npx vitest run src/features/chart/model`. 11. **Acceptance:** Mục 31. 12. **Dependencies:** M2.1, M2.2. 13. **Out of scope:** geometry, selection, diễn giải, hook, định dạng ngày.

### F4-M2.4 — Integration and Regression Verification
1. **Objective:** kiểm tích hợp với M1 và cổng chất lượng. 5. **Change:** không đổi mã (trừ sửa lỗi phát hiện). 6. **Steps:** (a) test tích hợp dùng `chartFull`/`chartNoHouses` từ M1 mocks (không mạng); (b) grep gate thuần/ranh giới (Mục 28); (c) kiểm `git diff --stat` chỉ trong `features/chart/model/**`; (d) chạy toàn bộ cổng; (e) lập Evidence Matrix M2. 7. **Tests:** nhóm A.10/A.11; không test cũ nào bị sửa. 11. **Acceptance:** Mục 31 hoàn tất. 12. **Dependencies:** M2.3. 13. **Out of scope:** "gỡ ánh xạ trùng lặp" = `NOT APPLICABLE` (không có mã trùng, Mục 3).

## 20. Task Dependency Graph

```text
M2.0 ─┬─► M2.1 ─┐
      └─► M2.2 ─┴─► M2.3 ─► M2.4
```

## 21. File Change Map

| File / Directory | Action | Responsibility | Task | Evidence |
|---|---|---|---|---|
| `frontend/src/features/chart/model/labels.ts` | Create | registry nhãn/glyph, `resolveX` | F4-M2.1 | `features/auth/model/` là tiền lệ; Arch §8.4 |
| `frontend/src/features/chart/model/labels.test.ts` | Test | coverage đủ 14/12/5/4/2/3, glyph, lạ | F4-M2.1 | conventions test cạnh nguồn |
| `frontend/src/features/chart/model/format.ts` | Create | `formatDegreeMinute` | F4-M2.2 | F4 plan §17/§15 |
| `frontend/src/features/chart/model/format.test.ts` | Test | biên, làm tròn, invalid | F4-M2.2 | — |
| `frontend/src/features/chart/model/chartViewModel.ts` | Create | kiểu VM, `ChartViewModelError`, `toChartViewModel` | F4-M2.3 | F4 plan §15 |
| `frontend/src/features/chart/model/chartViewModel.test.ts` | Test | nhóm A, D, E, F | F4-M2.3 | — |
| `docs/implementation/archive/sprint-f4/Sprint_F4_M2_Exit_Criteria_Evidence_Matrix.md` | Create (cuối M2) | hồ sơ đóng | F4-M2.4 | quy ước đã thống nhất |

**Không chạm:** `features/chart/api/**`, `hooks/**`, `shared/**`, `src/test/**`, `package.json`, cấu hình ESLint/TS/Vite, `features/{auth,birth-profile}/**`, `backend/**`.

## 22. Data Contract Matrix

| Data Category | Backend DTO Source | ViewModel Field | Mapping Rule | Nullable/Optional | Unknown-Value Behavior |
|---|---|---|---|---|---|
| Chart identity | `id` | `meta.id` | chuỗi bắt buộc | không | thiếu ⇒ `ChartViewModelError` |
| Metadata | `calculatedAt`, `engineVersion` | `meta.calculatedAt`, `meta.engineVersion` | giữ thô (không định dạng ngày) | không | không phải chuỗi ⇒ `""`... **không**: giữ thô nếu chuỗi; khác ⇒ `ChartViewModelError` |
| House system | `houseSystem` | `meta.houseSystem` | `resolveHouseSystem` | không | lạ ⇒ `known:false`, `UNKNOWN_VALUE` |
| Planets | `planets[]` | `planets[]` | Mục 10; sắp xếp Mục 13 | mảng có thể rỗng (⇒ `CORE_BODY_MISSING`) | `known:false` + `UNKNOWN_VALUE` |
| Sign (planet/house/angle) | `sign` / `signOnCusp` | `sign: GlyphLabel` | `resolveSign` (không tính lại từ kinh độ) | không | `known:false` |
| Degree (planet/angle) | `degreeInSign` | `degreeLabel` | `formatDegreeMinute` nếu `[0,30)` | `string|null` | ngoài miền ⇒ `null` + `VALUE_OUT_OF_RANGE` |
| Houses | `houses[]` | `houses[]` | chỉ khi `houseDataAvailable` hiệu lực | mảng có thể rỗng | số lạ ⇒ bỏ |
| House cusp | `cuspDegree` | `cuspLongitude` (thô) + `degreeLabel` | `formatDegreeMinute(cuspDegree % 30)` | `degreeLabel` có thể `null` | — |
| Angles | `angles[]` | `angles[]`, `flags.hasAngles`, `flags.ascendantLongitude` | `resolveAngle`; sắp xếp Mục 13 | mảng có thể rỗng | `known:false` |
| Aspects | `aspects[]` | `aspects[]` | Mục 10/13 | mảng có thể rỗng | loại/nature lạ ⇒ `known:false` |
| Retrograde | `planets[].isRetrograde` | `PlanetVM.isRetrograde` + `ariaLabel` | boolean bắt buộc | không | không phải boolean ⇒ bỏ thực thể |
| Planet house | `planets[].house` | `houseNumber` | nguyên 1..12 khi `houseDataAvailable` | `number|null` | ngoài miền ⇒ `null` + `VALUE_OUT_OF_RANGE` |
| House availability | `isHouseDataAvailable` | `flags.houseDataAvailable` | Mục 14.1 (không đảo cờ) | không | không phải boolean ⇒ `ChartViewModelError` |
| Partial-data status | (dẫn xuất từ `issues`) | `flags.partialData` | Mục 14.2 | không | — |
| Warnings | `warnings[]` | `warnings[]` (`code`, `severity`, `labelVi`) | bỏ `message/field/details` | mảng có thể rỗng | mã lạ ⇒ `labelVi:null`; severity lạ ⇒ `"warning"` + `UNKNOWN_VALUE` |
| Interpretation metadata | `interpretations`, `interpretationVersion` | **không có** | không đọc | — | — |
| Patterns | `patterns` | **không có** | không đọc | — | — |

> Dòng "Metadata" ở cột cuối: `calculatedAt`/`engineVersion` không phải chuỗi ⇒ `ChartViewModelError` (cấu trúc), không tự điền chuỗi rỗng.

## 23. Label and Glyph Coverage Matrix

| Category | Expected | Actual Contract Values | Vietnamese Label Source | Glyph Source | Test Strategy |
|---|---:|---|---|---|---|
| Chart objects | 14 | `KNOWN_PLANET_NAMES` (14) = Backend `PlanetName` = UI §12.8 enum = Sprint 3 plan ("10 bắt buộc + 4 optional"); Backend mặc định trả 10 | 10: seed Backend + UI Spec; 4: **P** | 10: UI §5.1; 4: **P** | lặp `KNOWN_PLANET_NAMES` ⇒ có nhãn & glyph; so code point |
| Zodiac signs | 12 | `KNOWN_ZODIAC_SIGNS` (12) | seed Backend (12/12) | 3: UI §5.1; 9: **P** | lặp `KNOWN_ZODIAC_SIGNS`; mọi glyph kết thúc `U+FE0E` |
| Aspect types | 5 | `Conjunction, Sextile, Square, Trine, Opposition` | 1: UI §12.11; 4: **P** | UI §12.11 (5/5) | lặp `KNOWN_ASPECT_TYPES` |
| Angles | 4 | `Ascendant, Midheaven, Descendant, ImumCoeli` | 1: F4 plan; 3: **P**; short: UI §12.3 | không có glyph (nhãn chữ) | lặp `KNOWN_ANGLE_TYPES` |
| House systems | 2 | `Placidus, WholeSign` | UI §12.3/12.4, F4 plan | không (UI §5.1: icon tuỳ chọn, ngoài M2) | lặp `KNOWN_HOUSE_SYSTEMS` |
| Aspect natures | 3 | `Harmonious, Challenging, Neutral` (Backend) | **P** (tone: UI §12.11) | không (màu thuộc component) | lặp `KNOWN_ASPECT_NATURES`; Challenging⇒`tense` |

Không có chênh lệch số lượng giữa spec và Backend; chỉ có chênh lệch **tập trả về** (10/14) và **định danh nature** (X-4). Không rút gọn phạm vi hay bịa định danh.

## 24. Formatting Contract

| Input | Output | Precision | Boundary Behavior | Invalid-Value Behavior | Specification Source |
|---|---|---|---|---|---|
| độ thập phân `[0,360)` (in-sign, cusp-in-sign, kinh độ, orb) | `D°MM′` | tới phút; cắt xuống (D-M2-2); không giây | `v*60+1e-9` rồi `floor`; phút `00–59`; không bao giờ `60′`; không bao giờ `30°00′` từ giá trị `<30` thật | `null` cho `null/undefined/NaN/±Inf/<0/≥360` | F4 plan §17 (`D°MM′`); UI §12.2/§12.4 (lệch giây — D-M2-1); DS §4.5 (`tabular-nums` do component) |
| Ví dụ `29.347306392035534` | `29°20′` | — | — | — | script [C-run] |
| Ví dụ `5.328870761158669` (orb) | `5°19′` | — | — | — | script [C-run] |

Chưa được spec chốt (đánh dấu rõ, **không** tự phát minh): giây (D-M2-1), cắt vs làm tròn (D-M2-2), ký tự dấu (`′` U+2032 theo F4 plan; UI Spec dùng `'` ASCII).

## 25. Determinism Matrix

| Collection | Canonical Order | Tie-Breaker | Unknown Item Behavior | Test |
|---|---|---|---|---|
| Planets | `KNOWN_PLANET_NAMES` | chỉ số đầu vào | sau cùng, theo `key` (`<`) rồi chỉ số đầu vào | hoán vị đầu vào ⇒ cùng đầu ra |
| Houses | `number` 1→12 | chỉ số đầu vào | n/a | đầu vào đảo ngược ⇒ 1..12 |
| Angles | `KNOWN_ANGLE_TYPES` | chỉ số đầu vào | sau cùng như planets | hoán vị |
| Aspects | `orb` ↑, `planetA`, `planetB`, loại, chỉ số đầu vào | như trên | chỉ số `+∞` | hai aspect cùng `orb` ⇒ theo planetA/planetB/loại |
| Warnings | Backend | — | `labelVi:null` | giữ thứ tự |
| Issues | thứ tự pipeline | chỉ số thực thể | — | cùng đầu vào ⇒ cùng `issues` |

## 26. Degraded-Data Matrix

| Input Condition | `houseDataAvailable` | `partialData` | Data Preserved | Expected UI Implication (hợp đồng cho S4.x) |
|---|---|---|---|---|
| Chart đầy đủ (`chartFull`) | `true` | `false` | tất cả | hiện wheel đủ lớp, 3 bảng |
| Chưa biết giờ sinh / `houses=[]` (`chartNoHouses`, không warning) | `false` | `false` | planets/signs/aspects; `houses=[]`, `angles=[]`, `houseNumber=null` | `UnknownTimeNotice`; không vòng nhà; House Table thay bằng khối giải thích |
| Placidus không hội tụ (`houses=[]` + warning `HOUSE_SYSTEM_NOT_CONVERGING`) | `false` | `false` | như trên + `warnings` | thông điệp theo warning, không nói "chưa biết giờ sinh" |
| Trường tuỳ chọn vắng (`tone`, `house:null`) | theo chart | `false` | tất cả | hiển thị "—"/"Chưa có" |
| Mảng tuỳ chọn rỗng (`aspects: []`, `patterns: []`) | theo chart | `false` | còn lại | Aspect Table `EmptyState` (UI §12.4) |
| Thực thể lạ nhưng hiển thị được (hành tinh `Vesta`) | theo chart | `false` | giữ, `known:false` | hiển thị nhãn gốc, không glyph |
| Thiếu hành tinh cốt lõi (vd. thiếu `Pluto`) | theo chart | **`true`** | phần còn lại; `CORE_BODY_MISSING` | Alert warning "Một số dữ liệu không thể tính toán" (UI §12.2) |
| Thực thể hỏng (kinh độ `NaN`) | theo chart | **`true`** | phần còn lại; `ENTRY_DROPPED` | như trên |
| Cờ mâu thuẫn (`true` nhưng 11 nhà) | `false` | **`true`** | planets…; `houses=[]` | như "không có nhà" + Alert |
| Hỏng cấu trúc (`planets` không phải mảng) | — (không có VM) | — | — | `ChartViewModelError` ⇒ error state S4.3 |

## 27. Unit Test Plan

Khung: Vitest (`vitest run`), đặt cạnh nguồn. Dữ liệu: `chartFull`, `chartNoHouses` từ `../api/mocks/fixtures`. **Biến thể hỏng:** một helper nội bộ trong file test `makeDto(mutate)` dùng `structuredClone` + một lần ép kiểu duy nhất (`as unknown as ChartResponse`) có chú thích — đây là "test seam" tối thiểu; không nới kiểu của hàm production.

### Bắt buộc (mapping → task)

| Nhóm | Test | Edge case | Expected | Ưu tiên | Task |
|---|---|---|---|---|---|
| **A** `toChartViewModel` | A1 chart đầy đủ | — | 10 planets, 12 houses, 4 angles, 9 aspects; `houseDataAvailable=true`, `partialData=false`, `issues=[]` | Cao | M2.3 |
| | A2 không nhà | `chartNoHouses` | `houses=[]`, `angles=[]`, `houseNumber=null` hết, `hasAngles=false`, `ascendantLongitude=null` | Cao | M2.3 |
| | A3 planets còn nguyên khi không nhà | so sánh với A1 (trừ `houseNumber`) | `key/longitude/sign/degreeLabel` bằng nhau | Cao | M2.3 |
| | A4 trường tuỳ chọn null | `house:null`; `degreeInSign` ngoài miền | `houseNumber=null`; `degreeLabel=null` + `VALUE_OUT_OF_RANGE`, **không** partial | Cao | M2.3 |
| | A5 mảng tuỳ chọn rỗng | `aspects: []`, `warnings: []` | VM rỗng tương ứng, `partialData=false` | Trung bình | M2.3 |
| | A6 có diễn giải | `chartFull` | VM không đổi | Cao | M2.4 |
| | A7 không có diễn giải/`null`/rác | `[]`, `null`, mảng chứa `null`, `interpretationVersion` bất kỳ | VM `toStrictEqual` A1; không ném | Cao | M2.4 |
| | A8 không mutate | `deepFreeze(dto)` rồi gọi; so với `structuredClone` trước đó | không ném, DTO nguyên vẹn | Cao | M2.3 |
| | A9 lặp gọi | hai lần cùng đầu vào | `toStrictEqual`; hai VM không chia sẻ tham chiếu mảng với DTO | Cao | M2.3 |
| | A10 `ascendantLongitude` | có Ascendant / không | số thô / `null` | Trung bình | M2.3 |
| | A11 `warnings` | `HOUSE_SYSTEM_NOT_CONVERGING`, mã lạ, severity lạ | nhãn VI / `null` / `"warning"`+`UNKNOWN_VALUE`; bỏ `message` | Trung bình | M2.3 |
| **B** Labels | B1 14 vật thể | lặp `KNOWN_PLANET_NAMES` | nhãn không rỗng, glyph đúng code point | Cao | M2.1 |
| | B2 12 cung | lặp `KNOWN_ZODIAC_SIGNS` | nhãn VI đúng bảng; glyph `U+2648…U+2653` + `U+FE0E` | Cao | M2.1 |
| | B3 5 aspect | — | nhãn/glyph đúng (Square = "Vuông chiếu") | Cao | M2.1 |
| | B4 4 góc | — | `shortLabel` ASC/MC/DSC/IC; `ariaLabel` có tên Anh | Cao | M2.1 |
| | B5 2 hệ nhà | — | "Placidus"/"Whole Sign" | Cao | M2.1 |
| | B6 3 nature | — | tone: Harmonious→harmonious, Challenging→tense, Neutral→neutral | Cao | M2.1 |
| | B7 ghim thứ tự `KNOWN_*` | `expect([...KNOWN_PLANET_NAMES]).toEqual([...])` (và góc, aspect, cung) | đổi thứ tự phải sửa test | Cao | M2.1 |
| | B8 lạ | `"Vesta"`, `""`, `null`, `42`, `"constructor"`, `"__proto__"` | `known:false`, glyph `null`, **không** trả nhãn của khoá khác | Cao | M2.1 |
| | B9 glyph nằm trong cùng nguồn | wheel/bảng dùng chung `resolveX` | (kiểm bằng grep M2.4) | Trung bình | M2.4 |
| **C** `formatDegreeMinute` | C1 giá trị thường | Sun, Venus, Pluto | bảng Mục 12 | Cao | M2.2 |
| | C2 `0` và gần 0 | `0`, `0.0166`, `1/60` | `0°00′`, `0°00′`, `0°01′` | Cao | M2.2 |
| | C3 biên trên | `29.9999999`, `359.99` | `29°59′`, `359°59′` | Cao | M2.2 |
| | C4 chống nhiễu float | `15+23/60`, `2+14/60` | `15°23′`, `2°14′` | Cao | M2.2 |
| | C5 cắt vs làm tròn | Moon `29°20′`, Mars `9°47′`, orb `5°19′` | khớp phương án chọn | Cao | M2.2 |
| | C6 invalid | `null`, `undefined`, `NaN`, `±Infinity`, `-0.1`, `360`, `400` | `null` | Cao | M2.2 |
| | C7 định dạng | phút 2 chữ số; ký tự `\u00B0`, `\u2032`; không dấu cách; không `″` | khớp chuỗi escape | Cao | M2.2 |
| | C8 thuần | gọi lặp, giá trị không đổi | cùng kết quả | Trung bình | M2.2 |
| **D** Ordering | D1 đầu vào xáo trộn | đảo ngược, xoay vòng (hoán vị cố định, không `Math.random`) | cùng đầu ra | Cao | M2.3 |
| | D2 thiếu vật thể | bỏ `Moon`, `Pluto` | thứ tự còn lại đúng; `CORE_BODY_MISSING`×2; `partialData=true` | Cao | M2.3 |
| | D3 vật thể lạ | thêm `Vesta`, `Ceres` | sau cùng theo `key`; `known:false` | Cao | M2.3 |
| | D4 tie-break aspect | hai aspect cùng `orb`; cùng `orb` và cặp, khác loại | theo planetA→planetB→loại→chỉ số | Cao | M2.3 |
| | D5 trùng thực thể | hai `Sun` | cả hai giữ, `DUPLICATE_ENTITY`, thứ tự đầu vào; aspect trùng ⇒ `#2` | Trung bình | M2.3 |
| | D6 nhà & góc | đảo thứ tự | `1..12`; `Ascendant…ImumCoeli` | Cao | M2.3 |
| | D7 aspect theo orb | `chartFull` | đúng thứ tự `Jupiter–Uranus, Pluto–Saturn, Neptune–Sun, …` | Cao | M2.3 |
| **E** Cờ suy giảm | E1 `houseDataAvailable=true` | `chartFull` | `true`, `partialData=false` | Cao | M2.3 |
| | E2 `false` | `chartNoHouses` | `false`, `partialData=false` | Cao | M2.3 |
| | E3 mâu thuẫn A | flag `true`, bỏ 1 nhà | `false`, `HOUSE_FLAG_CONTRADICTION`, `partialData=true`, `houses=[]` | Cao | M2.3 |
| | E4 mâu thuẫn B | flag `false` nhưng `houses` đủ | như E3 | Cao | M2.3 |
| | E5 `partialData` không bị kích bởi | không nhà, mảng rỗng, điểm tuỳ chọn thiếu, giá trị lạ | `false` | Cao | M2.3 |
| | E6 warning không hội tụ | `houses=[]` + warning | `houseDataAvailable=false`, `warnings` có mã, `partialData=false` | Trung bình | M2.3 |
| **F** Lạ/hỏng | F1 enum lạ | cung/aspect/nature/hệ nhà/severity lạ | `known:false`, không ép sang giá trị biết | Cao | M2.3 |
| | F2 thiếu trường bắt buộc | planet thiếu `longitude`; aspect `orb` âm | bỏ + `ENTRY_DROPPED` + `partialData=true`; các thực thể khác còn | Cao | M2.3 |
| | F3 số bất thường | `longitude` `NaN`, `-1`, `360` | như F2 | Cao | M2.3 |
| | F4 hỏng cấu trúc | `planets: null`, `dto: null`, thiếu `id`, `isHouseDataAvailable: "yes"` | `toThrow(ChartViewModelError)`, `code`, `path` đúng | Cao | M2.3 |
| | F5 lồng nhau null | `signOnCusp: null` | nhà bị bỏ ⇒ cờ mâu thuẫn | Trung bình | M2.3 |
| | F6 không nuốt lỗi | không có `try/catch` rộng: lỗi cấu trúc **không** thành VM rỗng | (F4 khẳng định) | Cao | M2.3 |
| | F7 aspect với vật thể vắng | `planetA` không có trong `planets` | giữ aspect; `ASPECT_ENDPOINT_MISSING`; `partialData=false` | Trung bình | M2.3 |

### Tuỳ chọn (tương lai)
Property-based (fast-check) cho sắp xếp — **không** thêm dependency ở M2; snapshot toàn bộ VM; kiểm render glyph thực tế trên thiết bị (thuộc S4.4/S4.7).

## 28. Quality Gates

Chỉ liệt kê lệnh thật (`frontend/package.json`):

| Mục đích | Lệnh |
|---|---|
| Test tập trung | `npx vitest run src/features/chart/model` |
| Toàn bộ test | `npm test` |
| Coverage (CI chạy lệnh này) | `npm run test:coverage` |
| Lint | `npm run lint` |
| Typecheck (**đã là cổng thật**) | `npm run typecheck` |
| Format | `npm run format:check` (sửa: `npm run format`) |
| Build | `npm run build` |

**Grep gate thuần/ranh giới** (bash; PowerShell dùng `Select-String` tương đương) — kỳ vọng **không in gì**:

```bash
cd frontend/src/features/chart/model
grep -nE "from \"(react|react-dom|@tanstack|@shared)|window\.|document\.|new Date|Date\.now|Math\.random|localeCompare|toLocale|Intl\.|fetch\(" *.ts | grep -v "\.test\.ts"
grep -nE "from \"zod\"|\bany\b|as unknown as" labels.ts format.ts chartViewModel.ts
```

Bằng chứng chấp nhận: CI Frontend xanh **trên đúng commit cuối** + log lệnh grep. Mục tiêu coverage cho `model/`: 100% statements/lines (ngang M1), không ngưỡng mới.

## 29. Risks and Mitigations

| ID | Rủi ro | Mức | Khả năng | Tác động | Giảm thiểu | Chặn? |
|---|---|---|---|---|---|---|
| R-1 | Drift DTO/spec | TB | TB | VM lệch Backend | `KNOWN_*` + contract test M1; fixture CAPTURED | Không |
| R-2 | Spec thiếu glyph/nhãn (Mục 5) | TB | Cao | thẩm mỹ/đúng thuật ngữ | bảng đề xuất có nguồn; **owner duyệt (M2.0)** | **Có (M2.1)** |
| R-3 | Glyph không hiển thị trên mọi nền tảng | TB | TB | ô vuông "tofu" | `U+FE0E`, `aria-hidden`, kiểm thủ công S4.4/S4.7; fallback chữ | Không |
| R-4 | Đơn vị độ mơ hồ | Cao | Thấp | hiển thị sai | hợp đồng hàm không biết ngữ nghĩa; mỗi trường gọi đúng nguồn (`degreeInSign`/`cuspDegree%30`/`orb`) + test theo fixture | Không |
| R-5 | Cắt vs làm tròn/giây (X-2/X-3) | TB | Cao | bảng khác kỳ vọng spec | **D-M2-1/2** | **Có (M2.2)** |
| R-6 | Thiếu nhãn khi Backend thêm giá trị | TB | TB | giá trị lạ hiển thị thô | fallback + `UNKNOWN_VALUE` + test B8/F1 | Không |
| R-7 | Thứ tự không ổn định | Cao | Thấp | wheel/bảng lệch | thứ tự tường minh, tie-break đầy đủ, test hoán vị | Không |
| R-8 | `partialData` mơ hồ | TB | TB | UI sai thông điệp | định nghĩa chặt + `issues` + test E5 | Không |
| R-9 | Lẫn React/DOM vào model | TB | Thấp | mất tính thuần | grep gate (Mục 28) | Không |
| R-10 | Trượt sang geometry | TB | TB | adapter phình | ranh giới Mục 2; không `normalizeLongitude`, không toạ độ | Không |
| R-11 | Nhân bản formatter ở UI | TB | TB | lệch định dạng | `grep` ở M2.4 + quy ước review S4.7+ | Không |
| R-12 | Phình scope `selection.ts` | Thấp | TB | sớm trừu tượng | DEFER S4.8 | Không |
| R-13 | Ép kiểu trong test hỏng làm yếu kiểu production | Thấp | TB | che lỗi | một helper duy nhất, không đổi chữ ký production | Không |

## 30. Known Gaps / Decision Log

**Đã giải quyết (Owner phê duyệt 2026-10-11):**

| ID | Quyết định | Nội dung đã chốt | Trạng thái |
|---|---|---|---|
| **D-M2-1** | `D°MM′` (không giây, `′` U+2032) thay `D°M′S″` | Giữ `D°MM′`; ghi lệch UI §12.2/Arch §222 | **APPROVED** |
| **D-M2-2** | Cắt xuống phút vs làm tròn gần nhất | **Cắt xuống (floor)** (không ra `30°00′`) | **APPROVED** |
| **D-M2-3** | Duyệt các ô **P** ở Mục 11.1 (4 glyph điểm tuỳ chọn, 9 glyph cung, 4 nhãn aspect, 3 nhãn góc, 3 nhãn nature, nhãn `applying`, câu warning) | Toàn bộ đề xuất ô **P** tại Mục 11.1 được phê duyệt | **APPROVED** |
| **D-M2-4** | `Challenging` (Backend) ⇒ `tone:"tense"` (UI §12.11) | Ánh xạ Backend `Challenging` sang UI `tone: "tense"` | **APPROVED** |

**Mặc định áp dụng nếu owner không phản hồi (đã nêu lý do ở nơi dùng):**

| ID | Quyết định |
|---|---|
| D-M2-5 | Thứ tự điểm tuỳ chọn theo F4 plan/`KNOWN_PLANET_NAMES`; ghim bằng test |
| D-M2-6 | `meta.calculatedAt` giữ ISO thô; định dạng ngày thuộc UI |
| D-M2-7 | `partialData` = có `ENTRY_DROPPED`/`CORE_BODY_MISSING`/`HOUSE_FLAG_CONTRADICTION`; có mảng `issues` (phương án thay thế: chỉ boolean) |
| D-M2-8 | `selection.ts` hoãn S4.8; M2 xuất `PlanetKey`/`AspectKey` |
| D-M2-9 | Chính tả kiểu mới (Hỏa, Thủy, Tọa) |
| D-M2-10 | VM hỗ trợ đủ 14 vật thể dù chỉ nhận 10 |
| D-M2-11 | `formatDegreeMinute` đặt ở `features/chart/model/format.ts`; chuyển lên `shared/lib` khi có consumer thứ hai |
| D-M2-12 | UI không khẳng định nguyên nhân thiếu nhà; dùng `warnings` |

**Known Gap — defer:**

| ID | Vấn đề | Phân loại |
|---|---|---|
| KG-M2-01 | Dung sai `1e-9′` có thể làm `29.99999999999° ⇒ 30°00′` (không xảy ra với dữ liệu thật) | Known Gap — defer |
| KG-M2-02 | Nguyên tố (Lửa/Đất/Khí/Nước) cho `SignBadge`/a11y (UI §12.9) chưa có trong VM; F4 không hiển thị chấm nguyên tố | Known Gap — defer (nếu S4.7 cần, thêm bảng tĩnh vào `labels.ts`) |
| KG-M2-03 | Số La Mã cho nhà (`numeralStyle`) thuộc UI | Out of scope |
| KG-M2-04 | Kiểm tra render glyph (iOS/Android/Windows, Newsreader→fallback) | Known Gap — S4.4/S4.7 |
| KG-M2-05 | Hook M1 trả DTO vs Arch §8.4; có thể dùng `select` ở S4.3 | Decision — S4.3 |
| KG-M2-06 | Lệch spec: UI §12.2 giây/ASCII; REST Spec `Angle`/`422`; DS §5 vs UI §5.1 trong F4 plan | Requires UI/Design Specification clarification (ghi, không sửa spec) |
| KG-F4M1-14 | Chính tả "Toạ" (M1) | Known Gap — sửa nhẹ khi tiện |
| — | Backend: aspects theo thứ tự vòng lặp, `planetA/planetB` theo bảng chữ cái, không có cam kết thành văn | Requires Backend clarification (không chặn: M2 tự sắp xếp) |
| — | Backend: không phát warning khi chưa biết giờ sinh; Moon sai khi thiếu giờ (KG-S4-06) | Known Gap (Backend) |

## 31. Acceptance Criteria

1. `toChartViewModel` chuyển đúng `ChartResponse` thật của M1 (cả `chartFull`, `chartNoHouses`).
2. Kiểu DTO (`api/types.ts`) và kiểu VM tách biệt; VM không import enum thô cho UI.
3. 14/12/5/4/2/3 nhãn đầy đủ, khớp bảng Mục 11.1 đã duyệt.
4. Glyph theo UI Spec §5.1/§12.11 (ô S) và ô P đã duyệt; kiểm bằng code point.
5. `formatDegreeMinute` có hợp đồng tường minh và test theo đúng bảng Mục 12.
6. Thứ tự chính tắc tất định (test hoán vị).
7. `houseDataAvailable` phản ánh Backend, có xử lý mâu thuẫn, **không** đảo cờ.
8. `partialData` đúng định nghĩa Mục 14.2 (kiểm bằng E5, D2, F2).
9. Giá trị lạ không bị ép sang giá trị biết (B8, F1).
10. Không mất dữ liệu hợp lệ khi thiếu nhà (A3).
11. Diễn giải không ảnh hưởng VM (A6, A7).
12. Không tính toán chiêm tinh; không tính lại cung/nhà/aspect/orb.
13. Không geometry (không toạ độ, không `normalizeLongitude`).
14. `model/**` không import React/DOM (grep gate).
15. DTO không bị mutate (A8).
16. Mọi test mới và cũ pass (cả 87 file/458 test hiện có không đổi).
17. `lint`, `typecheck`, `format:check`, `build` exit 0; CI Frontend xanh trên commit cuối.
18. Không dependency, state toàn cục, hook, hay file ngoài Mục 21.

## 32. Definition of Done

```text
M1 đã xác minh → Decision Log M2.0 chốt → labels/format tập trung
→ toChartViewModel thuần → thứ tự tất định → cờ suy giảm tường minh
→ hành vi giá trị lạ có tài liệu + test → toàn bộ test/lint/typecheck/format/build xanh
→ Evidence Matrix M2 → F4 M2 hoàn tất
```

Đồng thời: `git diff --stat` chỉ gồm 6 file `model/**` (+ Evidence Matrix khi đóng); blueprint M2 được xoá khi đóng.

## 33. Final Architect Review

| Hạng mục (prompt Mục 35) | Kết quả |
|---|---|
| Kiểm toán DTO M1 | Đã làm (Mục 4, 6) |
| Design System §5 | Đã kiểm tra: là Spacing; glyph ở UI Spec §5.1 (Mục 5) |
| UI Spec §12.8–12.11 | Đã đọc đầy đủ; kèm §5, §12.2–12.5 |
| Sáu nhóm nhãn | Đủ (Mục 11, 23) |
| 14 vật thể | Xác minh bằng Backend enum, UI §12.8, Sprint 3 plan; Backend mặc định trả 10 |
| Đơn vị độ & định dạng | Gắn với hợp đồng (Mục 6, 12); hai quyết định mở được nêu rõ |
| Thứ tự | Tường minh, tất định (Mục 13) |
| `houseDataAvailable`/`partialData` | Ngữ nghĩa chặt (Mục 14); phát hiện nguyên nhân kép của `houses=[]` |
| Giá trị lạ | Chiến lược một lớp, có test (Mục 15, 27) |
| Diễn giải | Không đọc (Mục 16) |
| Thuần/không React | Có grep gate |
| Geometry | Ngoài phạm vi |
| State toàn cục | Không |
| Test bắt buộc | Nhóm A–F, mọi dòng gắn task |
| Đường dẫn/lệnh | Phản ánh repo thật; `typecheck` đã là cổng thật |

## 34. Final Recommendation

**`READY FOR IMPLEMENTATION`**

**Trạng thái điều kiện:**
1. **F4-M2.0** — **ĐÃ ĐẠT**: Owner đã xác nhận đồng thuận với toàn bộ **D-M2-1, D-M2-2, D-M2-3, D-M2-4** (2026-10-11).
2. **Hồ sơ M1** — **ĐÃ ĐÓNG**: Liên kết Frontend CI đã được kiểm chứng (Run #38102309318), Evidence Matrix M1 đã chuyển `PASS`. Blueprint M1 đã được dọn sạch.

Thứ tự thực hiện: **M2.1 ∥ M2.2 → M2.3 → M2.4**.
