# AstroViet — F4 M9 Implementation Plan
## Responsive + Accessibility Hardening

**Phiên bản:** v1.2 (xác nhận owner 2026-10-22/23 — Mục 33.2; **kết quả đo M9.0 ngày 2026-10-23 — Mục 33.3**; Mục 33.2–33.3 **ghi đè** các đoạn tương ứng ở Mục 12–14, 18, 24) · **Ngày audit:** 2026-10-22 · **Repo:** `KhongphaiHphuc0705/astroviet`, nhánh `dev`, HEAD `84fc4b2` (commit code cuối `4c7e19f`, CI #281 Success)
**Phạm vi:** chỉ lập kế hoạch. Không sửa file nào trong repo; `node_modules`, `.env`, `dist/` chỉ có trong bản clone sandbox. Không cài package, không đổi API.
**Vị trí đề xuất khi commit:** `docs/implementation/Sprint_F4_M9_Implementation_Plan.md` (blueprint tạm; xoá khi đóng M9 — quy ước M4–M8).

**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `BLOCKED`. **Quyết định:** `inherited` (đã duyệt ở F4 plan v1.1/milestone trước) · `proposed` · `unresolved`.
**Nguồn:** `[repo]` mã/tài liệu · `[run]` lệnh đã chạy trong sandbox · `[ci]` trang GitHub Actions · `[calc]` tính từ giá trị lớp CSS trong mã (**không đo trên trình duyệt**) · `[owner]` xác nhận của owner.

---

## 1. Executive Summary

M9 làm cho Chart Viewer dùng được trên mobile/tablet/desktop và đạt trợ năng cơ bản sau khi M8 (tương tác + đồng bộ) đã đóng. M9 **không** thiết kế lại viewer, không đụng Backend, không làm pinch-to-zoom tuỳ biến.

**Phát hiện audit làm thay đổi kế hoạch (đều có bằng chứng):**

1. **Zoom chưa tồn tại.** `grep -ri zoom src` (ngoài test) trả về rỗng `[run]`. F4 plan §13/§28 quy định `zoom` là state cục bộ của container, 1×–3×, nút `+/−/Đặt lại`, chỉ dưới `md`, pinch gốc của trình duyệt được giữ. M8 **không** cung cấp zoom ⇒ M9 **tạo mới** (nhỏ nhất, không phải "tái dùng") — đúng phạm vi FE-S4.9, không phải hạng mục bị thiếu của M8.
2. **Hai cột ở `lg` không khả thi nếu chỉ dựa vào viewport** `[calc]`. Chrome ứng dụng chiếm chiều ngang: sidebar `w-[240px]` (mở) + `main` có `px-8` + `Container` của trang cũng `px-8` (**padding lồng nhau**) + `Card` `p-6`. Tại viewport 1024 px, vùng nội dung của trang chỉ ≈ **656 px**; trừ lề Card, cột trái (wheel ≥ 400 px) chiếm ≈ 448 px ⇒ cột phải còn ≈ **184 px**. Hai cột chỉ thoải mái từ ≈ 1440 px (sidebar mở) hoặc ≈ 1280 px (sidebar thu gọn). Đây là xung đột với yêu cầu đóng băng "hai cột từ `lg`"; plan ghi lại và đề xuất cách giải quyết nhỏ nhất (Mục 12, D-M9-04).
3. **Skip link đã có sẵn ở cấp ứng dụng** (`SkipLink` → `#main-content` trên `AppLayout` và `MarketingLayout`), nên **không** tạo skip link thứ hai trùng chức năng. Nhưng: nhãn đang là **tiếng Anh** ("Skip to content") trong ứng dụng tiếng Việt, E2E `layout.spec.ts` phụ thuộc đúng chuỗi đó, và `<main id="main-content">` **không có `tabIndex={-1}`** nên việc chuyển focus phụ thuộc trình duyệt.
4. **Reduced motion chưa được áp dụng cho viewer.** Chỉ `Skeleton` và `Spinner` có biến thể `motion-reduce:`; mọi `transition-*` ở `PlanetLayer`, `AspectLayer`, ba bảng, `AspectFilterChip`, và các primitive `Card`/`Button`/`Switch` mà viewer dùng **thiếu** `motion-reduce:transition-none`, trái F4 plan dòng 429.
5. **Cấu trúc heading chưa có mốc cho wheel**: `h1` "Lá số sinh" → heading đầu tiên là h2 ẩn "Chi tiết đang chọn" (SelectionDetail) → h2 "Hành tinh"…; Card tổng quan và Card wheel không có heading riêng.
6. **Nền tảng đã sẵn có tốt:** chỉ render **một** biểu diễn bảng/thẻ bằng `useMediaQuery("(min-width: 640px)")` (không trùng nội dung cho trình đọc màn hình); aspect mặc định tắt dưới `md` (M6, D-M6-08) kèm công tắc; `vitest-axe` đã nối sẵn; mock `matchMedia` trong `src/test/matchMedia.ts` hỗ trợ `addEventListener`/`addListener`/`dispatchEvent`/`restore` theo từng truy vấn.
7. **Nợ có sẵn ngoài phạm vi viewer (không mở rộng M9):** drawer mobile của `AppLayout` ghi chú `TODO ... focus trap (Backlog M4)`; hai liên kết nav `href="/"` là thẻ `<a>` tải lại trang.

**Thiết kế đề xuất (nhỏ nhất đủ yêu cầu):**
- **Ba chế độ** theo `screens` của repo (VERIFIED): Mobile `< 768`, Tablet `768–1023`, Desktop `≥ 1024`; thêm quy tắc con trong Mobile: thẻ thay bảng `< 640` (đã có).
- **Khung vuông:** khung ngoài bọc vùng cuộn hiện có; bản vẽ SVG luôn vuông nhờ `viewBox`; giữ chính sách chữ ≥ 10 px của M5 (`min 400 px`) và cuộn trong khung khi màn hẹp.
- **Zoom:** `zoom` cục bộ trong `ChartViewerShell`, điều khiển `md:hidden`, độ rộng bản vẽ qua biến CSS `--zoom` (không JS đo kích thước, không resize observer).
- **Skip link:** dùng lại `SkipLink` hiện có (đổi nhãn tiếng Việt + `tabIndex={-1}` cho `<main>`); thêm **một** liên kết trong viewer "Chuyển tới bảng dữ liệu" *chỉ vì* có nhu cầu riêng (nhảy qua ≈ 15–17 điểm Tab của wheel) — cần owner xác nhận (D-M9-08).
- **Hai cột:** CSS-native bằng container query tuỳ ý của Tailwind (không dependency), kích hoạt khi **chiều rộng thực** đủ, bên trong chế độ Desktop; sticky có chặn theo chiều cao viewport.
- **Reduced motion:** thêm `motion-reduce:transition-none` theo lớp ở chart + primitive dùng chung viewer; không dùng quy tắc CSS toàn cục.
- **axe:** tái dùng `vitest-axe`; quét ở ba chế độ với hai fixture (có nhà / không nhà).
- Không Zustand, không Context mới, không dependency mới.

**Trạng thái kết luận: `CONDITIONALLY READY`** — không có blocker kỹ thuật; 6 quyết định chặn đã được owner xác nhận (Mục 33.2, kèm 2 điều chỉnh cần chốt nốt); còn lại một bước **đo thực tế bố cục** (M9.0 sơ bộ, khoá ngưỡng cuối ở M9.1 sau khi xử lý padding).

---

## 2. Sprint and Milestone Context

| Mục | Nội dung | Bằng chứng |
|---|---|---|
| Sprint | Frontend Sprint F4 — **Natal Chart Viewer** | F4 plan v1.1 |
| Milestone | **F4 M9 = FE-S4.9 — Responsive + Accessibility Hardening** | F4 plan dòng 625–631 `[repo]` |
| Objective (F4) | bố cục 3 breakpoint, zoom nút dưới `md`, thẻ mobile, skip link, reduced motion, rà a11y | dòng 627 |
| Preconditions / Dependencies | S4.8 (và S4.5–S4.7 qua S4.8) | dòng 664 |
| Tests (F4) | component theo breakpoint (mock `matchMedia`), axe, thủ công | dòng 630 |
| Acceptance (F4) | "AC Responsive & Accessibility" (không phải khối đánh số; xem Mục 34) | dòng 631 |
| Ánh xạ tên | "Mn" trong hội thoại = `FE-S4.n`; Evidence Matrix `Sprint_F4_M{n}_Exit_Criteria_Evidence_Matrix.md` | `archive/sprint-f4/` |

## 3. Frozen Roadmap and Execution Order

```text
S4.1 → S4.2 → S4.3 → S4.11 → S4.7 → S4.4 → S4.5 → S4.6 → S4.8 → S4.9 → S4.10
```

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| F4 plan v1.1, O-F4-2 phương án B | Đúng; thứ tự khớp | F4 plan dòng 17, 522 |
| S4.11 (danh sách chart) là milestone **đã thêm** | Đã hoàn tất và tích hợp | Evidence Matrix M11 trong `archive/` |
| M9 đứng sau M8, trước M10 (= S4.10) | Đúng | dòng 522, 664 |
| Có hấp thụ trách nhiệm S4.10 (E2E/hồi quy toàn diện) không? | **Không.** M9 không thêm spec Playwright mới cho viewer (S4.10 sở hữu); chỉ cập nhật spec hiện có bị ảnh hưởng (skip link) | Mục 21, 24 |
| Khác biệt tên | Không có; "M9" ≡ "S4.9" | — |

## 4. M9 Objective

Làm cho viewer **dùng được và truy cập được** trên ba nhóm thiết bị, giữ nguyên hành vi M8:

1. Ba chế độ bố cục (Mobile/Tablet/Desktop) theo breakpoint cấu hình thật.
2. Hai cột ở Desktop khi khả thi; sticky an toàn.
3. Khung wheel vuông, thu phóng bằng nút dưới `md`.
4. Aspect line tắt mặc định dưới `md` mà không mất dữ liệu aspect.
5. Thẻ mobile (đã có) được xác minh và bảo vệ bằng test.
6. Skip link hoạt động; reduced motion được tôn trọng.
7. Audit trợ năng có cấu trúc: axe + thủ công; sửa lỗi xác nhận.
8. Bảo toàn: M8, Birth Profile, chart list, tính lá số, routing, API.

## 5. Scope

- Bố cục ba chế độ; hai cột + sticky (có chặn an toàn); `Container` rộng và xử lý padding lồng cho trang chart.
- Khung vuông + zoom (state, điều khiển, biến CSS, nhãn, ranh giới, đặt lại).
- Xác minh + test "aspect tắt mặc định dưới `md`"; thông tin aspect luôn ở bảng.
- Xác minh + test thẻ/bảng; đảm bảo không trùng nội dung.
- Skip link (nhãn, đích focus được, kiểm thử) + liên kết nội bộ tới bảng (nếu duyệt).
- Reduced motion theo lớp.
- Cấu trúc heading/landmark cho viewer.
- Audit axe + checklist thủ công; sửa lỗi đã xác nhận.
- Helper test viewport (cộng thêm) cho `matchMedia`.
- Bảo vệ hồi quy M8.

## 6. Out of Scope

| Hạng mục | Lý do / nơi xử lý |
|---|---|
| **Pinch-to-zoom tuỳ biến**, thư viện cử chỉ, state zoom phức tạp | FG-05 — Known Gap defer (bất biến) |
| Thiết kế lại hình học wheel; tính lại hành tinh/aspect | không bao giờ ở frontend |
| Viết lại đồng bộ chọn (M8) | M8 đã đóng |
| Chart mới; thay đổi Backend/`ChartResponse`; Interpretation Engine | ngoài F4 |
| Thiết kế lại chart list / Birth Profile | ngoài M9 |
| Zustand/Context mới cho responsive | F4 §13 |
| Framework a11y mới, dependency mới | không có bằng chứng cần |
| E2E Playwright cho viewer, visual regression | **S4.10** |
| Drawer mobile có focus trap, sửa `href="/"` thành `Link`, nâng Node 20 CI | nợ có sẵn (Mục 33) |
| Tái cấu trúc không liên quan, thiết kế lại thị giác | cấm |

## 7. Repository Audit

| Hạng mục audit | Đường dẫn thật đã kiểm | Kết quả |
|---|---|---|
| Script | `frontend/package.json` | `lint` (`eslint .`), `format:check` (`prettier --check .`), `typecheck` (`tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit`), `test` (`vitest run --passWithNoTests`), `test:coverage`, `build` (`tsc … && vite build`), `test:e2e` (`playwright test`) — VERIFIED; **không có** `test:a11y` |
| Breakpoint | `frontend/tailwind.config.ts:117-125` | `xs 0 · sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536` — **VERIFIED, là mặc định Tailwind**; `maxWidth`: `container-narrow 768`, `container-default 1200`, `container-wide 1440` |
| Layout ứng dụng | `src/widgets/app-layout/index.tsx` | header `sticky top-0 h-[64px] z-sticky`; sidebar `lg:flex`, `sticky top-[64px] h-[calc(100vh-64px)]`, `w-[240px]`/`w-[64px]`; drawer `lg:hidden`; `<Container as="main" id="main-content" className="max-w-full flex-1 px-4 py-8 md:px-8">` |
| Trang chart | `src/pages/app/charts/detail/page.tsx` | `<Container className="space-y-6 py-8">` (size mặc định, **không** `wide`, **có** `px-4 md:px-8` ⇒ lồng với `main`); `h1` `tabIndex={-1}` được focus khi tải xong; `document.title = "Lá số sinh — AstroViet"`; `ChartViewerShell key={chartId}` |
| Shell | `src/features/chart/ui/ChartViewerShell/ChartViewerShell.tsx` | một cột; chỉ hai lớp responsive Tailwind (`sm:grid-cols-3`, `p-4 sm:p-6`); `useMediaQuery("(min-width: 640px)")` chọn bảng/thẻ; `useMediaQuery("(min-width: 768px)")` cho mặc định aspect |
| Wheel | `…/ChartWheel/ChartWheel.tsx:151-178` | `<figure>` › `<div role="region" aria-label="Biểu đồ tròn, có thể cuộn ngang trên màn hình hẹp" tabIndex={0} className="overflow-x-auto …">` › `<svg viewBox="0 0 600 600" role="group" className="mx-auto h-auto w-full min-w-[400px] max-w-[640px]">` |
| Bảng/thẻ | `PlanetTable`, `HouseTable`, `AspectTable` | mỗi bảng có `<section aria-labelledby>`, `<h2>`, `<caption class="sr-only">`, `overflow-x-auto`; thẻ ≥ 44 px |
| Skip link | `src/shared/ui/SkipLink/index.tsx`; `widgets/app-layout`, `widgets/marketing-layout` | một liên kết dùng chung → `#main-content`, chữ "Skip to content" |
| Test responsive/axe | `src/test/matchMedia.ts`; `src/test/setup.ts` (đăng ký `vitest-axe/matchers`) | 30+ file test dùng `axe`, gồm `ChartViewerShell`, `ChartWheel`, ba bảng, `ChartList`, `pages/app/charts/detail/page.test.tsx` |
| E2E | `frontend/e2e/*.spec.ts`, `playwright.config.ts` | chỉ **Desktop Chrome**; có `layout.spec.ts` (sidebar mobile, SkipLink); **không** có spec cho chart viewer |
| Baseline chạy lại | sandbox | `format:check`, `lint`, `typecheck`, `build` exit 0; `vitest`: **126 file / 988 test, đều qua** (51 file/616 test ở `features/chart`+`pages`; 75 file/372 test còn lại) — VERIFIED `[run]` |
| Chưa chạy | `npm run test:coverage`, `npm run test:e2e` (cần Backend/Prisma) | UNVERIFIED trong phiên này; CI #281 xanh |

## 8. M8 Completion and Preconditions

**M8 đóng đã được đối chiếu với mã, không chỉ tài liệu.**

| Tiền đề (prompt §4) | Trạng thái | Bằng chứng |
|---|---|---|
| Đồng bộ chọn hành tinh/aspect bảng ↔ wheel | **VERIFIED** | `model/selection.ts` (reducer thuần), `ChartViewerShell.tsx` (`useReducer`), `PlanetLayer`/`AspectLayer` `interaction`; test `selection.test.ts`, `ChartViewerShell.test.tsx` |
| Hover/focus/chọn được tài liệu | VERIFIED | Evidence Matrix M8 (D-M8-03 sau M8.5: `preview = hovered ?? focused`) |
| Lỗi M8 đã sửa | **VERIFIED** | commit `4c7e19f`: API `onPreview(target, source, phase)`, hover bảng lọc `pointerType === "mouse"`, trả focus (`SelectionDetail`/`AspectTable` heading `tabIndex={-1}` + `.focus()`) |
| Zoom (nếu có) | **KHÔNG có** | Mục 14 |
| Aspect rendering + hiển thị | VERIFIED | M6: `AspectLayer`, `showAspectLines`, `userChoice ?? matchesMd` |
| Ba bảng | VERIFIED | M7 |
| Wheel | VERIFIED | M4–M5 |
| S4.11 chart list | VERIFIED | M11 |
| Test/fixture | VERIFIED | `fixtures.ts`: `chartFull` (có nhà), `chartNoHouses` (hợp lệ, không nhà), `chartDenseCluster`, `chartZeroBoundary`, `chartAllAspects`, `chartNoAspects` |
| CI | CI #281 `4c7e19f` **Success**, 4m5s (cảnh báo Node 20 ở `checkout@v4`, `setup-node@v4`); commit head `84fc4b2` chỉ đổi `docs/**` ⇒ evidence commit = `4c7e19f` | `[ci]` |

**Giới hạn đã chấp nhận của M8 (ảnh hưởng M9):** bằng chứng thủ công chỉ trên Windows 11 + Chrome/Edge (KG-M8-01); chưa có trình đọc màn hình, iOS/Android/macOS, Firefox/Safari; đường aspect trên wheel chỉ chọn bằng chuột/chạm (KG-M8-04). M9 phải kế thừa các giới hạn này và **không** tuyên bố đã giải quyết khi chưa có thiết bị.

**Điều M9 không được làm:** triển khai lại tính năng M8 thiếu. Không có tính năng M8 nào bị thiếu; thiếu duy nhất liên quan là **zoom**, vốn thuộc S4.9 theo F4 plan.

## 9. Current Responsive Implementation

| Khía cạnh | Hiện trạng | Bằng chứng |
|---|---|---|
| Số cột | **một cột** ở mọi viewport | `ChartViewerShell.tsx` |
| Bảng↔thẻ | JS: `isTable = useMediaQuery("(min-width: 640px)")`; **render một** biểu diễn | Shell dòng 51 |
| Aspect | `matchesMd` (768 px) quyết định mặc định; `userChoice` giữ lựa chọn; công tắc luôn có | Shell; M6 |
| Wheel | `min-w-[400px] max-w-[640px]` trong vùng `overflow-x-auto` (D-M4-6); không `aspect-square` nhưng bản vẽ vuông nhờ `viewBox` | `ChartWheel.tsx` |
| Chữ | glyph 18 / nhãn 16 đơn vị ⇒ ≥ 10,67 px tại 400 px (M5) | `PLANET_TEXT_SIZES` |
| Padding trang | `main px-4 md:px-8` **và** `Container px-4 md:px-8` | `app-layout`, `page.tsx`, `Container` |
| Chiều rộng nội dung `[calc]` | viewport 360 → 296 px; 375 → 311; 768 → 640; 1023 → 895; **1024 (sidebar mở) → 656**; 1280 (mở) → 912; 1440 (mở) → 1072 | `sidebar w-[240px]`, hai lớp `px-8` |
| Sticky hiện có | header `sticky top-0` (64 px); sidebar `sticky top-[64px]` ở `lg+` | `app-layout` |
| Zoom | không có | `grep` rỗng |
| Chồng lớp/overflow tổ tiên | `Stack` gốc `min-h-screen`, `Container`/`main` **không** có `overflow-*` ⇒ sticky khả dụng; **`main` là flex item không có `min-w-0`** (rủi ro tràn ngang khi nội dung rộng) | `app-layout` `[calc]`, UNVERIFIED bằng trình duyệt |

## 10. Current Accessibility Implementation

| Mảng | Hiện trạng | Bằng chứng | Đánh giá |
|---|---|---|---|
| Skip link | có, toàn cục, → `#main-content`; "Skip to content" (tiếng Anh) | `SkipLink/index.tsx` | dùng lại; nhãn + đích cần chỉnh |
| Landmark | `header`, `aside > nav aria-label="Điều hướng chính"`, drawer `nav aria-label="Điều hướng chính (Mobile)"`, một `<main>` | `app-layout` | hợp lệ; drawer đóng = `hidden` |
| Heading | `h1` → (Shell) h2 ẩn "Chi tiết đang chọn" → h2 "Hành tinh"/"Nhà"/"Góc chiếu" | `page.tsx`, `SelectionDetail`, bảng | **thiếu mốc h2 cho wheel và Card tổng quan** |
| Focus khi tải | `h1` nhận focus khi trạng thái ≠ loading | `page.tsx` | tốt; tương tác với skip link ghi ở Mục 17 |
| Bảng | `<caption class="sr-only">`, `scope="col"`, `aria-pressed` ở nút chọn, vùng chạm ≥ 44 px | ba bảng | tốt |
| Wheel | `svg role="group"` + `<title>`/`<desc>` + hành tinh `role="button"` + `aria-pressed`; đường aspect pointer-only | M5/M8 | tốt; giới hạn đã chấp nhận |
| Vùng cuộn | `role="region"` + `tabIndex=0` + nhãn | `ChartWheel.tsx` | đạt `scrollable-region-focusable` |
| Focus ring | `focus-visible:ring-focus` trên nút/bảng; `group-focus-visible` trên nhóm SVG | M8 | trình duyệt khác Chrome chưa kiểm |
| Reduced motion | chỉ `Skeleton`, `Spinner`; **viewer chưa** | grep `motion-reduce` | khoảng trống (Mục 18) |
| axe | `vitest-axe` + matcher ở `setup.ts`; dùng ở Shell, Wheel, ba bảng, trang detail | grep | tái dùng; jsdom không kiểm tương phản/bố cục |
| Drawer mobile | `TODO … focus trap (Backlog M4)` | `app-layout` | nợ có sẵn |
| Tiêu đề trang | `document.title` cục bộ ở trang chart | `page.tsx` | tốt |

---

## 11. Breakpoint and Layout Strategy

**Breakpoint thẩm quyền:** `tailwind.config.ts` `screens` — `sm 640 · md 768 · lg 1024` (**mặc định Tailwind, VERIFIED, không bị ghi đè**). Ba chế độ (đúng yêu cầu "chính xác ba"):

| Chế độ | Khoảng | Cấu trúc | Quy tắc con đã có/đề xuất |
|---|---|---|---|
| **Mobile** | `< 768` | một cột dọc; wheel trong khung có zoom; aspect **tắt mặc định** | `< 640`: **thẻ** thay bảng (đã có, M7); `640–767`: bảng cuộn ngang trong thẻ bọc |
| **Tablet** | `768–1023` | một cột; wheel căn giữa tối đa 640 px rồi tới bảng; aspect **bật mặc định**; **không** zoom | không có sidebar (drawer); bảng dạng `<table>` |
| **Desktop** | `≥ 1024` | sidebar + nội dung; **hai cột khi đủ chỗ**, ngược lại một cột như Tablet | quy tắc "đủ chỗ" ở Mục 12; không zoom |

Không có chế độ thứ tư: "dưới `sm`" chỉ là quy tắc trình bày trong Mobile (F4 plan §28). Không gán giá trị breakpoint nào ngoài `640/768/1024`; ngưỡng "đủ chỗ" của Desktop (Mục 12) là **chiều rộng container**, không phải breakpoint viewport.

**Nguyên tắc triển khai:** CSS thuần (media/container query) cho mọi thứ chỉ là trình bày; JavaScript (`useMediaQuery`) **chỉ** ở hai chỗ đã có vì cần biết lúc chạy — chọn bảng/thẻ (để **không mount hai biểu diễn**) và mặc định bật aspect (vì là *giá trị khởi tạo* của state người dùng có thể đổi).

## 12. Desktop Two-Column / Sticky Layout

### 12.1 Bằng chứng khả thi — `[calc]` **đã được đo xác nhận ở M9.0** (Mục 33.3: chiều rộng Shell khớp từng điểm)

Công thức: `nội dung = viewport − sidebar(240 mở | 64 thu gọn | 0 dưới lg) − 2×32 (main px-8) − 2×32 (Container px-8)`; Card `p-6` ⇒ cột trái cần ≥ `400 + 48 = 448`; khe `24`.

| Viewport | Sidebar | Nội dung | Cột phải nếu hai cột `[448 | 24 | còn lại]` | Kết luận |
|---|---|---|---|---|
| 1024 | mở | 656 | **184** | không khả thi |
| 1024 | thu gọn | 832 | 360 | chật (bảng cuộn) |
| 1280 | mở | 912 | 440 | chật |
| 1280 | thu gọn | 1088 | 616 | **khả thi** |
| 1440 | mở | 1072 | 600 | **khả thi** |
| 1440 | thu gọn | 1248 | 776 | thoải mái |

Nếu bỏ padding lồng của trang chart (D-M9-06) mọi dòng cộng thêm 64 px.

### 12.2 Xung đột với yêu cầu đóng băng và cách giải quyết nhỏ nhất

Yêu cầu: "từ `lg` trở lên dùng hai cột". Theo `[calc]`, áp dụng theo viewport ở 1024–1279 sẽ cho cột phải 184–440 px (bảng 5 cột không đọc được). **Quyết định đề xuất D-M9-04 (unresolved, cần owner):** giữ **Desktop = viewport ≥ lg**, nhưng **hai cột chỉ bật khi chiều rộng container thực ≥ ngưỡng đo (tạm 1010 px, khoá ở M9.1)**; dưới ngưỡng đó Desktop dùng bố cục một cột như Tablet. Hiện thực không dependency:

- **Cú pháp `[@container(...)]:` và `[@media(min-height:…)]:` của Tailwind 3.4 chưa được dự án dùng — phải xác minh bằng `npm run build` + grep CSS (G-M9-10) ở M9.0 trước khi dựa vào.**
- bọc phần thân Shell bằng phần tử `div` có `[container-type:inline-size]` (thuộc tính tuỳ ý của Tailwind 3.4);
- lưới: `[@container(min-width:1010px)]:grid [@container(min-width:1010px)]:grid-cols-[minmax(448px,5fr)_minmax(0,7fr)] … gap-6 items-start` (biến thể tuỳ ý dạng at-rule của Tailwind 3.x);
- ngưỡng **`1010` là giá trị tạm đã đo ở M9.0** (448 + 24 + 532 = 1004 ⇒ 1010; Mục 33.3); **bước M9.0 phải đo** ở 1024/1100/1280/1440 với sidebar mở/thu gọn trước khi khoá.

| Phương án | Ưu | Nhược | Trạng thái |
|---|---|---|---|
| **A — viewport `lg` + container ≥ 1010 (đề xuất, đã đo)** | đúng ý "desktop" mà không ép bố cục vỡ; không JS, không dependency | container query chưa được dự án dùng; tương tác với `sticky` **chưa kiểm** (Mục 12.3) | proposed |
| B — chỉ viewport `lg`, bảng ép sang thẻ ở cột hẹp | khớp chữ F4 plan | cột phải 184 px vẫn quá hẹp; thêm quy tắc bảng/thẻ thứ hai | không đề xuất |
| C — chuyển hai cột lên `xl` | đơn giản | **đổi roadmap đóng băng** | không đề xuất (cần quyết định riêng) |

Phương án A **không** đổi roadmap: Desktop vẫn là `≥ lg`; chỉ *cách trình bày bên trong* Desktop phụ thuộc chỗ trống.

### 12.3 Cột nào dính (sticky) và an toàn

- **Cột trái (Card wheel: công tắc + legend + wheel + chi tiết đang chọn)** là cột dính; cột phải (ba bảng) cuộn tự do. Lý do: bảng dài (≥ 10 hàng × 3 bảng) còn wheel + chi tiết là thứ người dùng muốn thấy khi chọn từ bảng — chính là mục tiêu đồng bộ của M8.
- **Độ lệch dính:** `top-[88px]` = header `64` + khe `24` (header `sticky top-0 h-[64px] z-sticky`; sidebar không ảnh hưởng vì ở cột riêng).
- **Chiều cao cột trái `[calc]`:** wheel 512–640 + công tắc/legend ≈ 100–130 + figcaption ≈ 40 + `SelectionDetail` ≥ 64 + Card padding 48 ⇒ **≈ 780–930 px**. Cộng độ lệch 88 ⇒ cần viewport cao ≥ ≈ 870–1020 px. Màn 768–900 px cao sẽ **cắt đáy** cột dính (không cuộn được nội dung bị cắt).
- **Biện pháp an toàn:** chỉ bật `sticky` khi đủ cao: biến thể tuỳ ý `[@media(min-height:1000px)]:sticky` (**ngưỡng tạm đã đo ở M9.0**: cột trái cao tối đa 887 + 88 + 24 = 999); thấp hơn ⇒ không dính (cột trái cuộn cùng trang) — fallback an toàn, không cuộn lồng.
- **Tổ tiên:** đã kiểm chuỗi `Stack(min-h-screen) → Stack(flex) → main → Container`: **không** có `overflow-*` (aside có `overflow-y-auto` nhưng là phần tử anh em) ⇒ sticky khả dụng. `main` là flex item **không có `min-w-0`** ⇒ thêm `min-w-0` cho thân Shell/`Container` của trang nếu đo thấy tràn ngang.
- **Container query + sticky:** `container-type: inline-size` áp dụng containment lên phần tử chứa; **chưa xác minh** nó không phá sticky của con. Đặt phần tử `container-type` **ngoài** lưới (lưới là containing block của cột dính) và **xác minh bằng trình duyệt** ở M9.0; nếu hỏng ⇒ dùng phương án B' (bỏ container query, hai cột ở `xl`) với ghi nhận quyết định.
- Cột phải: `min-w-0` để bảng dùng `overflow-x-auto` của chính nó, không đẩy lưới.

### 12.4 Padding lồng và `Container` (D-M9-06, unresolved)

Trang chart dùng `Container` mặc định (`max-w-container-default` 1200, `px-8`) bên trong `main px-8`. F4 plan §28 nêu `Container size="wide"` (1440). Đề xuất **chỉ cho trang chart**: `size="wide"` và `paddingX={false}` (bỏ lớp padding thứ hai: +32 px mỗi bên ở mobile `[calc]`, vùng nội dung 296→328 ở viewport 360). Tác dụng phụ: lề thẳng hàng khác các trang anh em (danh sách chart, hồ sơ) vốn vẫn double-padding ⇒ **cần owner xem trực quan**; không sửa `Container`/`AppLayout` dùng chung.

## 13. Square Chart Wheel Frame

**Phân biệt ba lớp:**

| Lớp | Phần tử | Quy tắc |
|---|---|---|
| (1) Khung vuông ngoài | `div role="region" tabIndex=0` hiện có (vùng cuộn, **chỉ chứa SVG**) | `w-full max-w-[640px] mx-auto overflow-auto`; **v1.1 (A3, chờ xác nhận):** `max-md:aspect-square` **chỉ trên vùng cuộn này** (không phải wrapper tổng chứa nhãn/điều khiển) để zoom không đổi chiều cao khung ⇒ không layout shift; bản vẽ cuộn 2 chiều bên trong. Không dùng `max-h` tăng dần |
| (2) Bề mặt vẽ | `svg viewBox="0 0 600 600"` | **luôn vuông** nhờ `viewBox` + `h-auto`; ở `≥ md`: `w-full max-w-[640px] min-w-[400px]`; ở `< md`: `max-w-none` và `width: max(400px, calc(var(--zoom) * 100%))` |
| (3) Ngoài khung | `figcaption`, công tắc, legend, nút zoom, `SelectionDetail` | nằm **ngoài** vùng cuộn ⇒ không bị cắt; **không có tooltip/popover** (chi tiết là khối nội tuyến) |

- **Cách thu phóng không méo:** chỉ đổi `width`; chiều cao suy ra từ `viewBox` ⇒ tỉ lệ 1:1 luôn giữ.
- **Kích thước:** tối thiểu bề mặt vẽ **400 px** (giữ chính sách chữ ≥ 10 px của M5: 16 đơn vị × 400/600 = 10,67 px; **không** hạ xuống < 400 để vừa màn); tối đa 640 px (≥ md) hoặc `zoom × khung` (< md, tối đa 3×).
- **Khi chỗ trống < 400** (viewport < ≈ 430 sau padding): khung hẹp hơn bản vẽ ⇒ cuộn **hai chiều** trong khung (khung cao theo bản vẽ; `max-h` chặn khi phóng). Không có hiệu ứng thu nhỏ chữ.
- **Vì sao không `aspect-square` cứng cho khung:** nếu khung vuông *và* hẹp hơn 400 thì bản vẽ 400 px bị cắt cả đáy; để khung theo bản vẽ giữ toàn bộ nội dung cuộn được. "Khung vuông" được đảm bảo ở mọi chiều rộng ≥ 400 (khung = bản vẽ); ở < 400 bản vẽ vẫn vuông và khung là cửa sổ cuộn. **D-M9-03 (proposed).**
- **Không cắt nhãn:** mọi nhãn (cung, nhà, góc, hành tinh, vòng focus) nằm trong `viewBox 600` (đã kiểm ở M4/M5; `angleLabel r=282`); `focus` ring ở nhóm hành tinh nằm trong vành `[114, 168]`. Không thêm phần tử nào ra ngoài `viewBox`.
- **Căn giữa khi mở/đổi zoom:** một `useLayoutEffect` đặt `scrollLeft/Top` về tâm sau mỗi lần `zoom` đổi và khi mount — **không** resize observer, **không** lắng nghe resize. Đây là JS trình bày tối thiểu (D-M9-02).
- **`touch-action`:** `touch-pan-x touch-pan-y touch-pinch-zoom` (khớp F4: "pinch gốc của trình duyệt được phép") — **không** handler cảm ứng tuỳ chỉnh.

## 14. Zoom Controls

| Câu hỏi | Quyết định | Căn cứ |
|---|---|---|
| Zoom đã có? | **Không** (`grep zoom` rỗng) ⇒ M9 tạo mới, **không** là "state thứ hai" | `[run]` |
| Chủ sở hữu state | `ChartViewerShell`: `useState(1)` (cục bộ, reset theo `key={chartId}`) | F4 §13/§27 (inherited) |
| Khoảng | `1×` đến `3×`, bước `0,5×` (5 mức) | F4 dòng 381 (1×–3×); bước **proposed** |
| Hiển thị điều khiển | **chỉ render khi `< md`** bằng `matchesMd` sẵn có ở Shell (A2, theo xác nhận owner); không còn `md:hidden` | F4 dòng 381/728; owner 2026-10-22 |
| Tablet/Desktop | không có điều khiển; `--zoom` không có tác dụng (lớp `max-md:`) ⇒ state còn lại không gây hiệu ứng khi đổi breakpoint | CSS-only gating |
| Căn giữa | **không mặc định `useLayoutEffect`**; thử CSS trước (A1) | owner 2026-10-22 |
| Hàm thuần | `model/zoom.ts`: `ZOOM_MIN/MAX/STEP`, `zoomIn`, `zoomOut`, `canZoomIn/Out` (test được, không React) | — |
| Component | `ui/ChartWheel/ChartZoomControls.tsx` (nhỏ, có test riêng) — **justify:** điều khiển tương tác độc lập có a11y và trạng thái ranh giới riêng | kiến trúc §23 |
| Nút | "Thu nhỏ biểu đồ", "Phóng to biểu đồ", "Đặt lại thu phóng" (dùng `@shared/ui/Button`) | tiếng Việt; tên có đối tượng |
| Ranh giới | tại 3×/1× dùng **`aria-disabled="true"` + bỏ qua thao tác** (giữ focusable) thay vì `disabled` để **không mất focus** khi bấm đến đầu mút; "Đặt lại" `aria-disabled` ở 1× | tránh lỗi mất focus M8 |
| Trạng thái đọc được | `<output aria-label="Mức thu phóng">150%</output>` (ngầm `role=status`, lịch sự) — **tách** khỏi live region chọn của Shell, không đọc khi hover | không ồn |
| Nhóm | `role="group"` + `aria-label="Thu phóng biểu đồ"` | |
| Bàn phím | Tab/Enter/Space trên nút; cuộn khung bằng phím mũi tên (khung `tabIndex=0` đã có) | native |
| Cảm ứng | nút ≥ 44 px; pinch gốc trình duyệt; **không** cử chỉ tuỳ chỉnh | out-of-scope bất biến |
| Reduced motion | đổi `width` tức thì, **không** transition/scroll mượt (`scroll-behavior` không đặt — VERIFIED grep CSS) | |
| Vị trí | thanh công cụ trên wheel, dòng riêng dưới công tắc (mobile) | |

## 15. Aspect Visibility Below `md`

Đã hiện thực ở M6 (VERIFIED); M9 **xác minh và bảo vệ bằng test**, không đổi thiết kế.

| Câu hỏi (prompt §10) | Trả lời | Bằng chứng |
|---|---|---|
| Nguồn quyết định | `useMediaQuery("(min-width: 768px)")` = `ASPECT_LINES_DEFAULT_QUERY` trong Shell; mặc định `visible = userChoice ?? matchesMd` | `ChartViewerShell.tsx`; D-M6-08/09 |
| Vì sao JS | là **giá trị khởi tạo** của lựa chọn người dùng, CSS không biểu diễn được | — |
| Lớp vẽ nhận quyết định | prop `showAspectLines` → `ChartWheel` (unmount lớp khi tắt) | `ChartWheel.tsx` |
| Dữ liệu aspect | **vẫn tải, vẫn tính hình học** (`aspectGeometry` memo độc lập với hiển thị); `AspectTable` luôn render | M6/M7 |
| Chọn aspect khi đường ẩn | được; hai hành tinh nổi, `SelectionDetail` đầy đủ; **không** tự bật công tắc (D-M8-05) | M8 |
| Lựa chọn người dùng ghi đè | có; được giữ khi đổi viewport (SW7) | M6 |
| Thông báo "đường đang ẩn" | **không thêm** — công tắc có tên + trạng thái; bảng ngay bên dưới | tránh thừa |
| Việc của M9 | test ở ba chế độ (mặc định đúng, bật tay vẫn giữ khi qua ngưỡng, bảng luôn có, chọn aspect khi ẩn) | Mục 29–30 |

## 16. Mobile Supporting Cards

| Nội dung | Mobile `< 640` | Mobile `640–767` / Tablet / Desktop | Chia sẻ dữ liệu/chọn |
|---|---|---|---|
| Planet | thẻ mỗi hàng | `<table>` | cùng `vm.planets`, cùng `selectedKey/onSelect/onPreview/relatedKeys` |
| House + Angles | thẻ | `<table>` (2 bảng) | cùng `vm.houses/angles`; không chọn |
| Aspect | thẻ | `<table>` + chip lọc | cùng `vm.aspects`, cùng props chọn |

- **Một biểu diễn tại một thời điểm** (`isTable` ⇒ mount một), nên **không** trùng nội dung cho trình đọc màn hình, không trùng ID (`useId`), không xử lý sự kiện kép.
- **Thẻ không phải biểu diễn "cao cấp" thứ hai:** thẻ là cách trình bày cùng dữ liệu; các bảng vẫn là cấu trúc ngữ nghĩa chuẩn ở ≥ 640.
- **Thiếu dữ liệu nhà:** `HouseDataNotice` (nội dung văn bản, không phải lỗi) thay `HouseTable`; thẻ hành tinh bỏ `houseNumber` khi `null` (không placeholder); aria của hành tinh bỏ cụm "nhà n" (M5/M7).
- **Nhãn dài/độ:** thẻ dùng văn bản ngắt dòng; kiểm ở 320 px (thủ công).
- **Việc của M9:** xác minh + test; sửa chỉ khi tìm thấy lỗi (chưa phát hiện lỗi nào trong audit).

## 17. Skip Link

| Câu hỏi (prompt §12) | Quyết định |
|---|---|
| Đã có? | **Có** — `shared/ui/SkipLink` dùng ở `AppLayout` và `MarketingLayout` ⇒ **không tạo skip link toàn cục thứ hai** |
| Đích | `<main id="main-content">` (VERIFIED duy nhất, `Container as="main"`) |
| Đích nhận focus? | **Chưa chắc**: `<main>` thiếu `tabIndex`. **Thêm `tabIndex={-1}`** (+ `focus:outline-none`) cho `<main>` ở `AppLayout` **và** `MarketingLayout` (thay đổi dùng chung, nhỏ, cộng thêm) |
| Nhãn | đổi "Skip to content" → **"Chuyển đến nội dung chính"** (ứng dụng tiếng Việt). **Ảnh hưởng:** `e2e/layout.spec.ts` (tìm `text=Skip to content`) phải cập nhật cùng commit; các test unit không phụ thuộc chuỗi (đã `grep`) |
| Khi nào hiện | khi focus (có sẵn: `sr-only focus:not-sr-only`, `ring-focus`, `z-toast`) |
| Focus sau kích hoạt | trình duyệt đặt focus/điểm bắt đầu điều hướng tại `<main>`; URL thêm `#main-content` (liên kết hash thuần, **không** qua React Router) — chấp nhận |
| Tương tác với `h1` | trang chart đã focus `h1` sau khi tải (`headingRef`); skip link hoạt động ở lần Tab đầu tiên sau mỗi lần tải/đổi route vì nằm trong layout bền vững |
| Nội dung đổi | `id` là hằng, `main` luôn có mặt trong layout ⇒ không phụ thuộc trạng thái trang |
| **Liên kết trong viewer (D-M9-08, unresolved)** | **Đề xuất thêm một** liên kết "Chuyển tới bảng dữ liệu" (F4 §29 đã dự kiến) đặt đầu Shell, đích `id="chart-data-tables"` (khối bọc ba bảng, `tabIndex={-1}`), cùng kiểu hiển thị khi focus. **Nhu cầu riêng:** nhảy qua ≈ 15–17 điểm Tab của wheel (vùng cuộn, công tắc, ≤ 14 hành tinh, "Bỏ chọn", zoom) — **khác** mục đích của skip link toàn cục (bỏ nav). Nếu owner không duyệt ⇒ bỏ mục này khỏi M9.3, không ảnh hưởng AC nào ngoài bản thay thế bảng |

## 18. Reduced Motion

**Kiểm kê chuyển động (đã `grep`):** viewer **không** có animation drawing; có `transition-*` sau:

| Vị trí | Chuyển tiếp | Hành động M9 |
|---|---|---|
| `PlanetLayer` (3), `AspectLayer` (2) | `transition-opacity` (làm mờ khi nổi) | thêm `motion-reduce:transition-none` |
| `PlanetTable` (4), `AspectTable` (4), `HouseTable` (2), `AspectFilterChip` (1) | `transition-colors` | thêm `motion-reduce:transition-none` |
| `shared/ui/Button` | `transition-all` + `active:scale-[0.98]` | thêm `motion-reduce:transition-none motion-reduce:active:scale-100` (giữ phản hồi trạng thái, bỏ hiệu ứng co) |
| `shared/ui/Card` | `transition-colors` (biến thể có thể bấm) | thêm `motion-reduce:transition-none` |
| `shared/ui/Switch` | track `transition-colors`, thumb `transition-transform` | thêm `motion-reduce:transition-none` ở cả hai (thumb nhảy tức thì, trạng thái bật/tắt vẫn rõ) |
| Tooltip/popover | **không tồn tại** trong viewer (audit) | không có gì để sửa |
| `Skeleton`, `Spinner` | đã có `motion-reduce:` | giữ (Spinner vẫn quay chậm để còn dấu hiệu tải) |
| Zoom/recenter | không có transition, không cuộn mượt | không cần |
| `Select`, `Radio`, `Textarea`, `Avatar`, `Modal`, `Alert` | `transition-*` | **ngoài viewer ⇒ Known Gap (defer)** — F4 plan nói "mọi transition" cho viewer; không mở rộng sang primitive không dùng ở viewer |

- **Cách làm:** theo quy ước Tailwind sẵn có (`motion-reduce:` như `Skeleton`/`Spinner`); **không** dùng quy tắc CSS toàn cục (`*{transition:none!important}` sẽ phá cơ chế "quay chậm" của `Spinner` và không tách được thông tin trạng thái khỏi hoạt ảnh).
- Khi bật giảm chuyển động: trạng thái chọn/nổi chuyển **tức thì**, giữ nguyên thông tin; không ẩn nội dung.
- **Kiểm chứng:** jsdom không đánh giá media query ⇒ test khẳng định **lớp `motion-reduce:transition-none` có mặt**; grep gate G-RM; kiểm thủ công bằng mô phỏng `prefers-reduced-motion: reduce` ở DevTools/hệ điều hành.

## 19. Accessibility Audit and axe

### 19.1 Phát hiện audit (từ mã, có phân loại)

| ID | Mảng | Phát hiện | Phân loại |
|---|---|---|---|
| F-A1 | Heading | không có h2 cho wheel và Card tổng quan; h2 đầu tiên là "Chi tiết đang chọn" | **Must fix** — thêm h2 `sr-only` ("Biểu đồ lá số", "Thông tin lá số") |
| F-A2 | Skip link | nhãn tiếng Anh; `<main>` không `tabIndex={-1}` | **Must fix** |
| F-A3 | Reduced motion | `transition-*` thiếu `motion-reduce` | **Must fix** |
| F-A4 | Vùng cuộn wheel | nhãn "có thể cuộn ngang…" sai khi cuộn 2 chiều/phóng | **Must fix** — đổi sang "Khung biểu đồ, có thể cuộn khi phóng to hoặc màn hình hẹp" |
| F-A5 | Zoom | điều khiển mới | thiết kế sẵn trợ năng (Mục 14); **Required before closure**: test + thủ công |
| F-A6 | Đường aspect trên wheel | chỉ chuột/chạm (không tab stop) | **Known Gap — defer** (KG-M8-04; bảng là tương đương) |
| F-A7 | Tương phản nét "Căng thẳng" nền sáng 2,56:1 | bù bằng kiểu nét | **Requires separate decision** (KG-M6-08); M9 **đo lại** bằng công cụ, không sửa màu |
| F-A8 | Vòng focus SVG | chỉ Chrome (M8) | **Required before closure** (thủ công Firefox/Safari nếu có) |
| F-A9 | Trình đọc màn hình | chưa có lần chạy nào | **Required before closure** (NVDA hoặc VoiceOver) hoặc `ACCEPTED GAP` có ghi rõ |
| F-A10 | Drawer mobile | không focus trap | **Existing technical debt — defer** (`TODO … Backlog M4`) |
| F-A11 | Nav `<a href="/">` tải lại trang | nợ có sẵn | **Existing technical debt — defer** |
| F-A12 | Chiều rộng thân | `main` không `min-w-0` | **Required before closure** nếu đo thấy tràn ngang |

### 19.2 axe — hạ tầng và phạm vi

- **Điểm vào:** `import { axe } from "vitest-axe"`; `expect(await axe(container)).toHaveNoViolations()`; matcher đã đăng ký ở `src/test/setup.ts` (VERIFIED). **Không** cài thêm package.
- **Quét:** (1) `ChartViewerShell` × {`chartFull`, `chartNoHouses`} × {Mobile 375, Tablet 800, Desktop 1500}; (2) `ChartWheel` có/không `interaction`, zoom 1× và 2×; (3) `ChartZoomControls` mọi trạng thái (1×, giữa, 3×); (4) thẻ (< 640) và bảng (≥ 640) của ba thành phần; (5) skip link + `<main>` ở `AppLayout`; (6) trang `ChartDetailPage` (đã có axe) ở ba chế độ.
- **Phân loại vi phạm:** `critical`/`serious` ⇒ phải sửa trong M9; `moderate`/`minor` ⇒ sửa nếu thuộc phạm vi M9, ngược lại **ghi riêng từng mục** (bằng chứng, lý do, quyết định).
- **Không** tắt rule hoặc loại nội dung khỏi test để qua. Giới hạn đã biết của jsdom: không kiểm `color-contrast`, bố cục thật, thứ tự đọc, focus visual, sticky ⇒ chuyển sang kiểm thủ công (Mục 20).
- **Fixture:** `chartFull` (có nhà), `chartNoHouses` (hợp lệ, `isHouseDataAvailable=false`), thêm `chartAllAspects`/`chartNoAspects` cho aspect; **không** dựng fixture mới trừ khi cần.

## 20. Manual Accessibility Checklist

> **Chỉ con người** làm được và **không** thay bằng axe: các mục đánh dấu 👤. Ghi theo mẫu Evidence Matrix: người kiểm, thiết bị, hệ điều hành + phiên bản đọc từ trang About, trình duyệt/AT + phiên bản, commit/URL build, lá số dùng, bằng chứng (ảnh/video), ngày. Môi trường đã có bằng chứng ở M6/M8: Windows 11 + Chrome/Edge; mục thuộc môi trường khác ghi `ACCEPTED GAP` nếu chưa có thiết bị.

- [ ] 👤 Chỉ dùng bàn phím: Tab qua toàn trang theo thứ tự hợp lý; không bẫy focus; mọi điều khiển có vòng focus rõ
- [ ] 👤 Skip link hiện khi Tab đầu tiên, Enter chuyển focus tới nội dung chính; (nếu duyệt) liên kết "tới bảng dữ liệu" bỏ qua wheel
- [ ] 👤 Zoom bằng bàn phím: `+`, `−`, `Đặt lại` theo Tab/Enter/Space; đầu mút 1×/3× không mất focus; đọc được mức thu phóng
- [ ] 👤 Chọn hành tinh trên wheel không dùng chuột (Enter/Space), bỏ chọn bằng Esc
- [ ] 👤 Chọn aspect từ bảng khi đường aspect đang ẩn (mobile): hai hành tinh nổi, chi tiết đầy đủ
- [ ] 👤 Đọc thông tin lá số chỉ bằng bảng ngữ nghĩa (caption, tiêu đề cột, nhà/không có nhà)
- [ ] 👤 Trình đọc màn hình (NVDA hoặc VoiceOver nếu có): tên hành tinh, nghịch hành, cung, độ, nhà, nhóm hành tinh `role="button"`, live region chọn/bỏ chọn, nút zoom, tóm tắt wheel
- [ ] 👤 Zoom trình duyệt 200% (≈ 640 CSS px ở màn 1280): không cuộn ngang trang ngoài vùng cuộn có chủ đích; không cắt nội dung
- [ ] 👤 Viewport hẹp 320/360/375: bố cục Mobile, thẻ, không tràn ngang trang, nút zoom dùng được bằng chạm
- [ ] 👤 Không có thông tin chỉ-hover: dùng cảm ứng/giả lập chạm để chọn
- [ ] 👤 `prefers-reduced-motion: reduce` bật: không có chuyển tiếp ở viewer; thông tin không mất
- [ ] 👤 Tương phản và high-contrast/forced-colors (Windows High Contrast nếu có): focus, trạng thái chọn, đường aspect còn nhìn thấy; **đo** tương phản nét aspect (ghi cặp màu + tỉ lệ + công cụ)
- [ ] 👤 Đổi kích thước/xoay màn hình khi đang chọn: selection và focus không mất; zoom/aspect giữ đúng quy tắc
- [ ] 👤 Hai cột + sticky (Desktop): cuộn trang, cột trái dính đúng khi đủ cao, không bị cắt khi thấp; đo ở 1024/1100/1280/1440

## 21. Responsive Testing Strategy

**Hạ tầng đã có (VERIFIED):** `installMatchMedia(initial?)` trong `src/test/matchMedia.ts` — trạng thái **theo từng truy vấn**, hỗ trợ `addEventListener/removeEventListener`, `addListener/removeListener`, `dispatchEvent`, `setMatches(query, matches)` phát sự kiện thật cho subscriber, `restore()`; `useMediaQuery` dùng `useSyncExternalStore` + `addEventListener`.

**Bổ sung nhỏ (cộng thêm, không đổi helper cũ):** `src/test/viewport.ts` — `installViewport(widthPx)` bọc `installMatchMedia` với bộ phân giải theo chiều rộng: phân tích `(min-width: Npx)`/`(max-width: Npx)`, ghi nhớ mọi truy vấn đã gặp; `setWidth(px)` gọi `setMatches` cho mọi truy vấn có đổi (⇒ subscriber được thông báo); `restore()`. Mỗi test tự cài đặt trong `beforeEach` và gỡ trong `afterEach` (chống rò giữa breakpoint). Có test riêng cho helper (khởi tạo, đổi chiều rộng, thông báo listener, dọn dẹp).

| Hành vi | Quan sát được trong jsdom? | Cách kiểm |
|---|---|---|
| Bảng ↔ thẻ (< 640) | **Có** (JS) | `installViewport(375/700/1500)`; khẳng định `table` vs danh sách thẻ, không có cả hai |
| Aspect mặc định tắt `< 768` | **Có** (JS) | công tắc `checked` theo chiều rộng; đổi chiều rộng giữ lựa chọn người dùng |
| Nút zoom `< md` | **Có** (render có điều kiện theo `matchesMd` sẵn có) | `installViewport(375)` ⇒ có nhóm "Thu phóng biểu đồ"; `installViewport(800/1500)` ⇒ **không có**; hành vi tăng/giảm/đặt lại/ranh giới kiểm đầy đủ |
| Hai cột/sticky | **Không** (CSS thuần) | khẳng định lớp; xác minh thật = thủ công + đo M9.0 (E2E tự động thuộc S4.10) |
| Skip link | Hợp đồng DOM | `href="#main-content"`, `main#main-content[tabindex="-1"]`, thứ tự Tab đầu; kích hoạt thật = E2E `layout.spec.ts` (cập nhật spec hiện có) |
| Reduced motion | **Không** (media CSS) | khẳng định lớp `motion-reduce:transition-none` + grep gate; hành vi = thủ công |
| Đồng bộ chọn qua ba chế độ | **Có** | chạy lại kịch bản M8 (S-A/B/C/D/E) ở 375/800/1500 |

Không thêm JS chỉ để dễ kiểm thử CSS. Không dùng snapshot làm bằng chứng trợ năng.

## 22. State and Interaction Preservation

| State | Chủ | M9 |
|---|---|---|
| `selection`, `hovered`, `focused`, `announcement` | `useReducer(interactionReducer)` ở Shell | **không đổi** |
| `userChoice` (aspect) + `matchesMd` | Shell | **không đổi** |
| `isTable` (640) | Shell | không đổi |
| **`zoom`** | Shell `useState(1)` | **mới**, cục bộ, không vào reducer (không phải selection) |
| Hình học (`wheelGeometry`, `aspectGeometry`) | `useMemo` ở Shell | không đổi; **zoom không tính lại hình học** (chỉ đổi `width` CSS) |

Quy tắc bảo vệ: **một** `selection`; thẻ và bảng cùng gọi `dispatch` qua cùng callback; không có biểu diễn thứ hai bị mount; thay đổi CSS không được gỡ `onClick`/`onKeyDown`/`tabIndex`/`aria-pressed` khỏi phần tử; test hồi quy ở Mục 30.

## 23. Architecture Boundaries

```text
ChartDetailPage (route, Container, h1)               ← chỉ đổi lớp bố cục
  └─ ChartViewerShell (state: M8 reducer, userChoice, zoom)   ← thêm lưới/zoom/skip link/heading
       ├─ ChartWheel (+ ChartZoomControls)            ← thêm prop zoom, CSS var, nhãn vùng cuộn
       ├─ SelectionDetail                             ← không đổi
       └─ PlanetTable / HouseTable / AspectTable      ← chỉ thêm motion-reduce
model/zoom.ts  (thuần, không React)                    ← mới, nhỏ
```

- Thành phần trình bày **không** gọi API; **không** tính lại chiêm tinh; hình học thuần không import React (giữ).
- **Không** Zustand/Context/global event bus; **không** dependency; **không** `dangerouslySetInnerHTML` (grep gate); nhãn trợ năng dựng từ `ChartViewModel` (chuỗi), không HTML.
- Hai thành phần mới duy nhất: `ChartZoomControls` (+ `model/zoom.ts`) — còn lại là chỉnh sửa tại chỗ. Không trừu tượng hoá riêng cho M9 (không `ResponsiveChartLayout`).
- Bảo mật: thay đổi breakpoint không chạm auth/route; hash `#main-content`/`#chart-data-tables` là hằng, không lấy từ dữ liệu.

---

## 24. Implementation Task Breakdown

> Quy trình đã chốt (M4–M8): **xác nhận quyết định trước khi sinh mã** (Mục 33.1); mỗi task một nhóm commit nhỏ; Evidence Matrix chỉ ghi lệnh **đã thật sự chạy**; commit chỉ chạm `docs/**` tách riêng khỏi commit chạm `frontend/**` (commit docs-only không kích hoạt CI — `frontend-ci.yml` lọc `frontend/**`). Chạy test cục bộ cần `cp .env.example .env`. Đường dẫn "Likely change" là **dự đoán**, đường dẫn "Inspect" là **đã xác minh tồn tại**.
> Gộp so với gợi ý của prompt: "M9.3 aspect/thẻ di động" **không** thành task riêng vì cả hai đã được hiện thực ở M6/M7 (VERIFIED) — chỉ cần test ở M9.5; tránh task giả "tái hiện thực" milestone đã xong.

### M9.0 — Đo bố cục và cổng quyết định (docs + đo) — **ĐÃ CHẠY 2026-10-23, kết quả ở Mục 33.3**

| # | Mục | Nội dung |
|---|---|---|
| 1 | ID/Tiêu đề | M9.0 — Đo bố cục thực và chốt quyết định |
| 2 | Objective | khoá các tham số còn `[calc]`; chốt D-M9-02/03/04/06/08/09; dọn tài liệu |
| 3 | Bằng chứng hiện trạng | bảng khả thi Mục 12.1 chưa đo; container query + sticky chưa kiểm; F4 plan còn "ChartViewer" (22 chỗ) và §28 mô tả thẻ `< sm` |
| 4 | Vì sao thuộc M9 | quyết định bố cục là nền của M9.1–M9.2; tránh khoá tham số sai |
| 5 | Preconditions | M8 đóng (VERIFIED); owner có thể chạy `npm run dev` + backend/mock để mở `/app/charts/:id` |
| 6 | Inspect | `widgets/app-layout/index.tsx`, `pages/app/charts/detail/page.tsx`, `ChartViewerShell.tsx`, `ChartWheel.tsx`, `tailwind.config.ts` |
| 7 | Likely change | `docs/implementation/Sprint_F4_Implementation_Plan.md` (đồng bộ §28 với quyết định hai cột, zoom, tên `ChartViewerShell`); bản ghi đo trong Evidence Matrix |
| 8 | Steps | (1) đo **sơ bộ** chiều rộng nội dung và chiều cao cột trái ở 1024/1100/1280/1440 × sidebar mở/thu gọn × viewport cao 768/900/1080; (2) thử nguyên mẫu `container-type` + `sticky` (Chrome + Firefox nếu có); (3) **kiểm tra trực quan lớp nào tạo padding dư** trước khi bỏ (không xoá máy móc; giữ gutter mobile); (4) ghi ngưỡng/`min-height` **tạm thời**; (5) cập nhật F4 plan. **Ngưỡng cuối được khoá ở M9.1 sau khi áp `size="wide"` + `paddingX={false}`** (D-M9-06) |
| 9 | Responsive | định nghĩa thông số ba chế độ |
| 10 | A11y | không |
| 11 | State | không |
| 12 | Tests | không (đo + tài liệu) |
| 13 | Verification | `git diff --stat` chỉ `docs/**` |
| 14 | Acceptance | bảng đo sơ bộ có số thật; phương án D-M9-04 xác nhận bằng nguyên mẫu; F4 plan nhất quán; **ngưỡng cuối chưa khoá** (thuộc M9.1) |
| 15 | Dependencies | — → M9.1 |
| 16 | Out of scope | sửa mã |
| 17 | Rủi ro | không có trình duyệt Firefox/Safari ⇒ ghi `UNVERIFIED` cho phần đó |
| 18 | Bằng chứng | bảng đo (thiết bị, trình duyệt+phiên bản, viewport, số đo), ảnh chụp |

### M9.1 — Nền tảng bố cục ba chế độ + heading

| # | Mục | Nội dung |
|---|---|---|
| 1 | ID/Tiêu đề | M9.1 — Responsive Layout Foundation |
| 2 | Objective | ba chế độ; hai cột khi đủ chỗ; sticky có chặn; heading viewer; xử lý padding trang chart |
| 3 | Bằng chứng | Shell một cột; padding lồng; không `min-w-0`; thiếu h2 wheel/overview (Mục 9–10) |
| 4 | Vì sao thuộc M9 | yêu cầu 1–2 của F4-S4.9 |
| 5 | Preconditions | M9.0 xong |
| 6 | Inspect | `ChartViewerShell.tsx` (+test), `pages/app/charts/detail/page.tsx` (+test), `shared/ui/Container/index.tsx`, `shared/ui/Card/index.tsx` |
| 7 | Likely change | `ChartViewerShell.tsx` (bọc lưới + container + cột dính + `min-w-0` + h2 `sr-only`), `pages/app/charts/detail/page.tsx` (`Container size="wide"`, padding theo D-M9-06), test tương ứng |
| 8 | Steps | (0) áp `Container size="wide" paddingX={false}` ở **trang chart**, rồi **đo lại** container; (1) khối bọc `[container-type:inline-size]`; (2) lưới `[@container(min-width:1010px)]:grid-cols-[minmax(448px,5fr)_minmax(0,7fr)]` (**1010 tạm**, khoá cuối ở bước này sau khi áp padding); (3) cột trái dính `[@media(min-height:1000px)]:sticky top-[88px]` (**1000 tạm**); (4) cột phải `min-w-0` bọc ba bảng (`id="chart-data-tables"` nếu D-M9-08); (5) h2 `sr-only` "Thông tin lá số", "Biểu đồ lá số"; (6) page: `Container` theo quyết định |
| 9 | Responsive | Mobile/Tablet: **thứ tự DOM = thứ tự trực quan** (một cột); Desktop đủ chỗ: hai cột; không đổi thứ tự DOM giữa các chế độ (không dùng `order-*`) để Tab = thứ tự đọc |
| 10 | A11y | thứ tự Tab = thứ tự đọc; heading hợp lệ; không `display:none` lên nội dung thiết yếu |
| 11 | State | không đổi |
| 12 | Tests | RS1–RS6 (Mục 29); cập nhật test Shell/page chỉ khi truy vấn bị ảnh hưởng bởi h2 mới |
| 13 | Verification | `npm run lint && npm run typecheck && npm run format:check`; `npx vitest run src/features/chart/ui/ChartViewerShell src/pages/app/charts` |
| 14 | Acceptance | AC-RA-R1–R3; không đổi thứ tự DOM; không `order-*`; test M8 xanh; **ngưỡng hai cột có bằng chứng từ kiểm tra giao diện sau xử lý padding**; không có hai cột khi cột phải quá hẹp; chuyển một↔hai cột không mất nội dung |
| 15 | Dependencies | M9.0 → M9.2 |
| 16 | Out of scope | zoom; đổi `AppLayout`/`Container` dùng chung (trừ khi D-M9-06 duyệt rõ) |
| 17 | Rủi ro | container query làm hỏng sticky (R12); cột phải hẹp; padding khác trang anh em (R11) |
| 18 | Bằng chứng | số đo M9.0, ảnh ở 4 viewport, kết quả cuộn sticky |

### M9.2 — Khung vuông và zoom

| # | Mục | Nội dung |
|---|---|---|
| 1 | ID/Tiêu đề | M9.2 — Square Wheel Frame and Zoom Controls |
| 2 | Objective | khung/bề mặt vẽ theo Mục 13; zoom 1–3× bằng nút dưới `md` |
| 3 | Bằng chứng | wheel `min-w-[400px] max-w-[640px]` trong vùng `overflow-x-auto`; zoom chưa có |
| 4 | Vì sao thuộc M9 | yêu cầu 3 của F4-S4.9; zoom do F4 §13/§27 giao cho container |
| 5 | Preconditions | M9.1 (bố cục), D-M9-02/03 chốt |
| 6 | Inspect | `ChartWheel.tsx` (+test), `ChartViewerShell.tsx`, `shared/ui/Button/index.tsx`, `ui/ChartWheel/index.ts` |
| 7 | Likely change | **Create** `model/zoom.ts` (+test), `ui/ChartWheel/ChartZoomControls.tsx` (+test); Modify `ChartWheel.tsx` (prop `zoom`, `--zoom`, lớp khung/svg, nhãn vùng cuộn, `useLayoutEffect` căn giữa), `ChartViewerShell.tsx` (`useState(1)`, thanh công cụ), `ui/ChartWheel/index.ts` |
| 8 | Steps | (1) `model/zoom.ts` thuần; (2) `ChartZoomControls`; (3) `ChartWheel` nhận `zoom?: number` (mặc định 1, không đổi hành vi cũ); (4) lớp `max-md:` cho độ rộng + `touch-pan-x touch-pan-y touch-pinch-zoom`; (5) **thử căn giữa bằng CSS trước; chỉ thêm `useLayoutEffect` nếu quan sát thực tế cho thấy cần** (Mục 33.2, A1); (6) nối vào Shell, **render nút zoom chỉ khi `!matchesMd`** (dùng giá trị `matchesMd` sẵn có, không thêm hook); (7) test Z1–Z12 |
| 9 | Responsive | điều khiển **chỉ render dưới `md`** (A2); zoom vô hiệu `≥ md` bằng lớp `max-md:` (state vẫn ở Shell); khung cuộn vuông cố định ở `< md` (A3, chờ xác nhận) |
| 10 | A11y | nhãn nút; `aria-disabled` ở đầu mút; `<output>` lịch sự; nhãn vùng cuộn mới; phím mũi tên cuộn |
| 11 | State | `zoom` ở Shell; không vào reducer; không tính lại hình học |
| 12 | Tests | Z1–Z12 + axe cho điều khiển và wheel ở 1×/2× |
| 13 | Verification | lệnh tĩnh + `npx vitest run src/features/chart/model/zoom.test.ts src/features/chart/ui/ChartWheel src/features/chart/ui/ChartViewerShell` |
| 14 | Acceptance | AC-RA-R4–R6, AC-RA-A6; không custom pinch; hình học không đổi khi zoom |
| 15 | Dependencies | M9.1 → M9.3 |
| 16 | Out of scope | pinch tuỳ biến, pan bằng cử chỉ, thư viện zoom, hoạt ảnh |
| 17 | Rủi ro | bẫy cuộn trên mobile (R15); mất focus ở đầu mút (R9) |
| 18 | Bằng chứng | ảnh 375 ở 1×/2×/3×; thử bàn phím; kiểm cảm ứng thật nếu có |

### M9.3 — Skip link và reduced motion

| # | Mục | Nội dung |
|---|---|---|
| 1 | ID/Tiêu đề | M9.3 — Skip Link and Reduced Motion |
| 2 | Objective | skip link dùng được, đích focus được; `motion-reduce` cho viewer |
| 3 | Bằng chứng | "Skip to content" tiếng Anh; `main` thiếu `tabIndex`; `e2e/layout.spec.ts` phụ thuộc chuỗi; `transition-*` thiếu `motion-reduce` |
| 4 | Vì sao thuộc M9 | yêu cầu 6–7 của F4-S4.9 |
| 5 | Preconditions | D-M9-07/08/09 chốt |
| 6 | Inspect | `shared/ui/SkipLink/index.tsx`, `widgets/app-layout/index.tsx`, `widgets/marketing-layout/index.tsx` (+test), `e2e/layout.spec.ts`, các file `transition-*` ở Mục 18 |
| 7 | Likely change | `SkipLink` (nhãn), `AppLayout` + `MarketingLayout` (`tabIndex={-1}` cho `main`), `e2e/layout.spec.ts` (nhãn + kiểm focus), `ChartViewerShell.tsx` (liên kết bảng dữ liệu nếu duyệt), các file chart/shared ở Mục 18 (chỉ thêm lớp), test |
| 8 | Steps | (1) nhãn tiếng Việt + cập nhật E2E cùng commit; (2) `tabIndex={-1}` + `focus:outline-none` cho `main`; (3) liên kết nội bộ + đích bọc bảng (nếu duyệt); (4) thêm `motion-reduce:transition-none` theo bảng kiểm kê; (5) test SK1–SK6, RM1–RM4; (6) grep gate G-RM |
| 9 | Responsive | skip link không phụ thuộc breakpoint |
| 10 | A11y | skip link hiện khi focus; đích nhận focus; không thông tin mất khi giảm chuyển động |
| 11 | State | không |
| 12 | Tests | SK1–SK6, RM1–RM4; E2E `layout.spec.ts` cập nhật |
| 13 | Verification | lệnh tĩnh + `npx vitest run src/widgets src/shared/ui src/features/chart` + (CI) `npm run test:e2e` |
| 14 | Acceptance | AC-RA-A1, A7 |
| 15 | Dependencies | M9.2 → M9.4 |
| 16 | Out of scope | skip link toàn cục thứ hai; `transition` của primitive ngoài viewer; thay `href="/"` |
| 17 | Rủi ro | đổi nhãn làm vỡ E2E (R14); chỉnh primitive dùng chung (R13) |
| 18 | Bằng chứng | kết quả E2E CI; ảnh skip link hiện; mô phỏng reduced-motion |

### M9.4 — Audit trợ năng và khắc phục

| # | Mục | Nội dung |
|---|---|---|
| 1 | ID/Tiêu đề | M9.4 — Accessibility Audit and Remediation |
| 2 | Objective | chạy axe theo Mục 19.2; sửa lỗi xác nhận; chạy checklist thủ công |
| 3 | Bằng chứng | phát hiện F-A1…F-A12 (Mục 19.1); chưa có AT/Firefox/Safari |
| 4 | Vì sao thuộc M9 | yêu cầu 8 của F4-S4.9 |
| 5 | Preconditions | M9.1–M9.3 |
| 6 | Inspect | toàn bộ `features/chart/ui/**`, `src/test/setup.ts` |
| 7 | Likely change | tuỳ phát hiện (dự đoán: nhãn vùng cuộn, heading, tên truy cập); test axe mới trong file test hiện có |
| 8 | Steps | (1) viết test axe ba chế độ × hai fixture; (2) phân loại kết quả; (3) sửa `critical/serious`; (4) ghi riêng từng mục còn lại; (5) chạy Mục 20; (6) ghi Matrix |
| 9 | Responsive | quét ở ba chế độ |
| 10 | A11y | trọng tâm |
| 11 | State | không |
| 12 | Tests | AX1–AX10 |
| 13 | Verification | lệnh tĩnh + `npx vitest run src/features/chart src/pages src/widgets` |
| 14 | Acceptance | AC-RA-A2–A5, A8–A10 |
| 15 | Dependencies | M9.3 → M9.5 |
| 16 | Out of scope | tắt rule axe; sửa nợ drawer/`href="/"`; đổi màu aspect |
| 17 | Rủi ro | axe xanh nhưng bàn phím/AT còn lỗi (R10) |
| 18 | Bằng chứng | báo cáo axe theo mục, bản ghi thủ công đủ trường |

### M9.5 — Hồi quy responsive/M8 và đóng milestone

| # | Mục | Nội dung |
|---|---|---|
| 1 | ID/Tiêu đề | M9.5 — Responsive and Accessibility Regression, Closure |
| 2 | Objective | test ba chế độ (aspect, bảng/thẻ, đồng bộ), hồi quy M8, cổng cuối, Evidence Matrix M9 |
| 3 | Bằng chứng | helper `installMatchMedia` đủ; chưa có `installViewport` |
| 4 | Vì sao thuộc M9 | tiêu chí hồi quy của F4-S4.9 |
| 5 | Preconditions | M9.4 |
| 6 | Inspect | `src/test/matchMedia.ts`, `ChartViewerShell.test.tsx`, `selection.test.ts`, test các bảng/lớp |
| 7 | Likely change | **Create** `src/test/viewport.ts` (+test); test Shell/page/tables ở ba chế độ |
| 8 | Steps | (1) helper viewport; (2) test RS7–RS12 (aspect/bảng-thẻ/đồng bộ ở ba chế độ); (3) rà toàn bộ test M8 chạy **không sửa**; (4) cổng Mục 31; (5) Evidence Matrix `Sprint_F4_M9_Exit_Criteria_Evidence_Matrix.md`; (6) xoá blueprint ở commit docs-only |
| 9 | Responsive | ba chế độ |
| 10 | A11y | tái chạy axe |
| 11 | State | không |
| 12 | Tests | RS7–RS12, RG1–RG10 |
| 13 | Verification | `npm run lint && npm run typecheck && npm run format:check && npm run test:coverage && npm run build`; CI xanh gồm E2E |
| 14 | Acceptance | AC-RA-G1–G4 |
| 15 | Dependencies | M9.4 → đóng |
| 16 | Out of scope | spec Playwright mới cho viewer, visual regression (S4.10) |
| 17 | Rủi ro | rò mock `matchMedia` (R5) |
| 18 | Bằng chứng | số test, coverage, link CI, ma trận |

## 25. Task Dependencies

```text
M9.0 (đo + quyết định) ──► M9.1 ──► M9.2 ──► M9.3 ──► M9.4 ──► M9.5 (đóng)
   ▲ owner xác nhận Mục 33.1 (D-M9-02/03/04/06/08/09)
Tiền đề (đã xong): S4.4 → S4.5 → S4.6 → S4.8 → [M9]   Hạ nguồn: S4.10 (E2E/hồi quy toàn diện)
```

M9.3 độc lập về kỹ thuật với M9.1–M9.2 nhưng đặt sau để E2E `layout.spec.ts` chạy một lần trên mã ổn định. M9 **không** phụ thuộc S4.10.

## 26. File Change Map

| File / Directory | Action | Purpose | Task | Evidence |
|---|---|---|---|---|
| `docs/implementation/Sprint_F4_Implementation_Plan.md` | Modify (docs) | đồng bộ quyết định bố cục/zoom/tên container | M9.0 | Verified (tồn tại) |
| `frontend/src/features/chart/ui/ChartViewerShell/ChartViewerShell.tsx` (+test) | Modify / Test | lưới hai cột, `zoom`, heading, skip link nội bộ | M9.1–M9.3 | Verified |
| `frontend/src/pages/app/charts/detail/page.tsx` (+test) | Modify / Test | `Container size="wide"`, padding | M9.1 | Verified |
| `frontend/src/features/chart/ui/ChartWheel/ChartWheel.tsx` (+test) | Modify / Test | prop `zoom`, CSS var, khung, nhãn vùng cuộn | M9.2 | Verified |
| `frontend/src/features/chart/ui/ChartWheel/ChartZoomControls.tsx` (+test) | **Create** | nút zoom có trợ năng | M9.2 | Predictive |
| `frontend/src/features/chart/model/zoom.ts` (+test) | **Create** | hằng/hàm thuần zoom | M9.2 | Predictive |
| `frontend/src/features/chart/ui/ChartWheel/index.ts` | Modify | export | M9.2 | Verified |
| `frontend/src/features/chart/ui/ChartWheel/{PlanetLayer,AspectLayer}.tsx` | Modify | `motion-reduce` | M9.3 | Verified |
| `frontend/src/features/chart/ui/{PlanetTable,HouseTable,AspectTable}/*.tsx`, `AspectTable/AspectFilterChip.tsx` | Modify | `motion-reduce` | M9.3 | Verified |
| `frontend/src/shared/ui/{Card,Button,Switch}/index.tsx` | Modify (**dùng chung**) | `motion-reduce:transition-none` (chỉ thêm lớp) | M9.3 | Verified |
| `frontend/src/shared/ui/SkipLink/index.tsx` | Modify (**dùng chung**) | nhãn tiếng Việt | M9.3 | Verified |
| `frontend/src/widgets/app-layout/index.tsx`, `widgets/marketing-layout/index.tsx` (+test) | Modify (**dùng chung**) | `main tabIndex={-1}` | M9.3 | Verified |
| `frontend/e2e/layout.spec.ts` | Modify | nhãn skip link + kiểm focus | M9.3 | Verified |
| `frontend/src/test/viewport.ts` (+test) | **Create** | helper chiều rộng viewport trên `installMatchMedia` | M9.5 | Predictive |
| `frontend/src/test/matchMedia.ts` | Inspect only | tái dùng (không sửa) | M9.5 | Verified |
| `docs/implementation/archive/sprint-f4/Sprint_F4_M9_Exit_Criteria_Evidence_Matrix.md` | **Create** | bằng chứng | M9.5 | Predictive |
| `docs/implementation/Sprint_F4_M9_Implementation_Plan.md` | Create → delete khi đóng | blueprint | M9.0/M9.5 | — |
| `frontend/package.json`, lockfile, `backend/**`, `frontend/src/features/chart/api/**` | **Không đổi** | — | — | Gate G-M9-7 |
| `model/selection.ts`, `SelectionDetail`, `PlanetLayer` logic tương tác, `aspectGeometry.ts` | **Không đổi logic** | bảo toàn M8/M6 | — | Gate |

**Thay đổi dùng chung** (`SkipLink`, `AppLayout`, `MarketingLayout`, `Card`, `Button`, `Switch`): chỉ thêm lớp/thuộc tính và nhãn; ảnh hưởng mọi trang dùng chúng ⇒ chạy toàn bộ `npm test` và E2E trước khi đóng.

## 27. Responsive Behavior Matrix

| Khía cạnh | Mobile `< 768` | Tablet `768–1023` | Desktop `≥ 1024` |
|---|---|---|---|
| Cấu trúc | một cột | một cột | sidebar + (hai cột nếu container ≥ ngưỡng đo, ngược lại một cột) |
| Điều hướng | drawer (`lg:hidden`) | drawer | sidebar cố định `lg+` |
| Wheel | khung cuộn; bản vẽ `max(400px, zoom×khung)` | `w-full max-w-[640px]` căn giữa | `w-full max-w-[640px]`; trong cột trái khi hai cột |
| Zoom | **có** (nút) 1×–3× | không | không |
| Aspect lines | tắt mặc định; công tắc | bật mặc định; công tắc | bật mặc định; công tắc |
| Bảng/thẻ | `< 640` thẻ; `640–767` bảng | bảng | bảng (cột phải khi hai cột) |
| Sticky | không | không | cột trái dính nếu đủ cao + hai cột |
| Tràn ngang | chỉ trong vùng cuộn wheel/bảng | chỉ trong bảng khi hẹp | chỉ trong bảng khi hẹp |
| Bàn phím/chạm | Tab; chạm; nút ≥ 44 px; pinch gốc | Tab/chạm | Tab/chuột |
| Chọn đồng bộ | một `selection` | như nhau | như nhau |

## 28. Accessibility Matrix

| Yêu cầu | Cách đáp ứng | Mức tự động | Mức thủ công |
|---|---|---|---|
| Skip link | `SkipLink` + `main tabIndex=-1` (+ liên kết bảng) | SK1–SK5 | 👤 SK6 |
| Landmark/heading | `header/nav/main`; h1 → h2 wheel/overview/chi tiết/bảng | AX, RS | 👤 duyệt heading bằng trình đọc |
| Bảng ngữ nghĩa | caption, `scope`, thẻ ↔ bảng | AX | 👤 |
| Thông tin không chỉ glyph/màu | tên chữ trong aria; kiểu nét aspect; `aria-pressed` + halo | A, AX | 👤 tương phản + CVD |
| Tên truy cập + focus | nút zoom, hành tinh, bảng | AX | 👤 vòng focus đa trình duyệt |
| Bàn phím | Tab/Enter/Space/Esc; zoom | tương tác (M8) + Z | 👤 |
| Reduced motion | `motion-reduce:transition-none` | RM (lớp) | 👤 mô phỏng |
| Không hover-only | chọn bằng chạm/phím; `pointerType` | M8 | 👤 |
| Đáp ứng | không tràn trang | một phần | 👤 320/200% |
| Không trùng nội dung SR | một biểu diễn bảng/thẻ | RS (đếm) | 👤 |
| Thiếu giờ sinh | `HouseDataNotice`, không placeholder | AX, RS | 👤 |

## 29. Test Matrix

> Mức: Unit · Component (jsdom + Testing Library + `user-event`) · axe (`vitest-axe`) · E2E/Manual. **Không** đánh dấu "đạt" trước khi chạy.

| Khu vực | Unit | Component | axe | E2E / Manual | Ưu tiên | Test ID |
|---|---|---|---|---|---|---|
| Ba chế độ | helper viewport | **Có** (aspect/bảng-thẻ) | — | Có | High | RS1–RS6 |
| Hai cột `≥ lg` | — | lớp (CSS) | — | **Có (đo)** | High | RS7 + thủ công |
| Cột dính | — | lớp | — | **Có** | High | RS8 + thủ công |
| Khung vuông | — | lớp + thuộc tính | — | Có | High | Z1–Z3 |
| Zoom `< md` | `zoom.ts` | **Có** (tăng/giảm/reset/ranh giới/nhãn) | **Có** | Có | High | Z4–Z12, AX |
| Aspect ẩn `< md` | — | **Có** | — | Có | High | RS9, RS10 |
| Thẻ mobile | — | **Có** | **Có** | Có | High | RS11, RS12, AX |
| Skip link | — | hợp đồng DOM | **Có** | **Có** (E2E) | High | SK1–SK6 |
| Reduced motion | — | lớp | — | **Có** | High | RM1–RM4 |
| Bàn phím | — | tương tác | — | **Có** | High | M8 + Z |
| Phương án thay thế bảng | — | **Có** | Có | Có | High | RS11 |
| Đồng bộ M8 qua 3 chế độ | selection (M8) | **Có** | — | Có | High | RG1–RG10 |
| Thiếu giờ sinh | — | **Có** | **Có** | Có | High | AX, RS |
| Tràn ngang | — | khó (CSS) | — | **Có** | High | thủ công |
| Hash/heading/landmark | — | Có | **Có** | Có | High | AX, SK |

**ID chi tiết (định nghĩa, không phải kết quả):** RS1–RS3 = bảng/thẻ ở 375/700/1500; RS4–RS6 = công tắc aspect mặc định/giữ lựa chọn khi qua ngưỡng; RS7–RS8 = lớp lưới/sticky; RS9–RS10 = chọn aspect khi đường ẩn, bảng aspect vẫn đầy đủ; RS11–RS12 = nội dung thẻ không trùng + thiếu nhà; Z1–Z3 = khung/lớp/`--zoom`; Z4–Z12 = `zoom.ts` + điều khiển (đầu mút, `aria-disabled`, `<output>`, tên nút, reset, `md:hidden`, không hình học đổi); SK1–SK6 = nhãn, `href`, `main#main-content[tabindex=-1]`, thứ tự Tab, (liên kết bảng), E2E focus; RM1–RM4 = lớp ở Layer/bảng/primitive; AX1–AX10 = quét axe theo Mục 19.2.

## 30. M8 Regression Matrix

Tất cả test M8 hiện có chạy lại **không sửa**; thêm kiểm ở ba chế độ cho các hành vi dưới đây.

| Hành vi M8 (đã VERIFIED) | Test hiện có | Kiểm thêm ở M9 |
|---|---|---|
| Chọn hành tinh từ wheel (click/Enter/Space) | `ChartViewerShell.test.tsx`, `PlanetLayer.test.tsx` | RG1 ở 375/800/1500 |
| Chọn từ Planet Table / thẻ | `PlanetTable.test.tsx`, Shell | RG2 (thẻ `< 640`, bảng `≥ 640`) |
| Chọn aspect từ bảng/thẻ | `AspectTable.test.tsx`, Shell | RG3 + khi đường ẩn |
| Chọn aspect bằng đường (chuột/chạm) | `AspectLayer.test.tsx` | RG4 (khi bật tay ở mobile) |
| Hai hành tinh đầu mút nổi; aspect liên quan nổi; mờ phần còn lại | Shell, layer tests | RG5 |
| Hover/focus preview (`hovered ?? focused`), không kẹt | `selection.test.ts`, Shell | RG6 |
| `Esc` bỏ chọn; chọn lại bỏ chọn | `selection.test.ts`, Shell | RG7 |
| "Bỏ chọn"/chip ✕ trả focus (không rơi về `body`) | `SelectionDetail.test.tsx`, `AspectTable.test.tsx` | RG8 |
| Live region `role="status"` duy nhất | Shell | RG9 |
| Công tắc aspect, legend, `userChoice` giữ khi đổi viewport | Shell (SW*) | RG10 |
| Chip lọc suy ra từ selection | `AspectTable.test.tsx` | RG3 |
| `SelectionDetail` các trạng thái | `SelectionDetail.test.tsx` | RG1–RG3 |

**Bất biến cần bảo vệ:** zoom **không** reset/đổi selection; đổi chế độ **không** xoá selection; thẻ/bảng không giữ state chọn riêng; thay đổi CSS không gỡ handler/`tabIndex`/`aria-pressed`.

## 31. Quality Gates

Chỉ dùng **script có thật**: `lint`, `format:check`, `typecheck`, `test`, `test:coverage`, `build`, `test:e2e` (**không có** `test:a11y`, `coverage`, `test:unit`).

| Thời điểm | Bắt buộc |
|---|---|
| Mỗi task | `npm run lint` · `npm run typecheck` · `npm run format:check` · `npx vitest run <phạm vi>` |
| Trước đóng M9.3 | + `npm test` đầy đủ (primitive dùng chung đổi) + `npm run build` |
| Đóng M9 | 4 lệnh tĩnh + `npm run build` + `npm run test:coverage` + **CI xanh** (gồm `test:e2e`, sandbox không chạy được) trên evidence commit |

Baseline đã chạy trong phiên audit: `format:check`, `lint`, `typecheck`, `build` exit 0; `vitest` 126 file/988 test đều qua. **Chưa** chạy `test:coverage`, `test:e2e`.

**Grep Gates M9:**

| Gate | Nội dung | Kỳ vọng |
|---|---|---|
| G-M9-1 | không `zustand`, `createContext`, `localStorage`, `dangerouslySetInnerHTML`, `eslint-disable`, `as unknown as`, `: any` trong file M9 | 0 |
| G-M9-2 | không `ResizeObserver`, `window.addEventListener("resize"`, thư viện zoom/gesture | 0 |
| G-M9-3 | không màu hex/rgb/hsl mới | 0 |
| G-M9-4 | `model/zoom.ts` không import React/DOM | 0 |
| G-M9-5 | `useMediaQuery` chỉ ở Shell (hai truy vấn đã có); không thêm truy vấn mới trừ khi có lý do ghi nhận | đúng |
| G-M9-6 | mọi `transition-` trong `features/chart/ui` và `Card/Button/Switch` có `motion-reduce:transition-none` | đủ |
| G-M9-7 | `package.json`, lockfile, `backend/**`, `features/chart/api/**` không đổi | rỗng |
| G-M9-8 | `model/selection.ts`, `aspectGeometry.ts`, `planetGeometry.ts` không đổi logic | `git diff` rỗng |
| G-M9-9 | không `order-*` đổi thứ tự DOM trong Shell | 0 |
| G-M9-10 | CSS build chứa mọi lớp M9 dùng (`touch-pan-x`, `touch-pan-y`, `touch-pinch-zoom`, `max-md:…`, `motion-reduce:transition-none`, biến thể `@container`/`@media(min-height)`) — grep `dist/assets/*.css` | đủ |

## 32. Risk Register

> Mức: thấp / trung bình / cao (thang định tính của F4 plan §48; **không** có điểm số).

| # | Rủi ro | Khả năng | Tác động | Bằng chứng | Giảm thiểu | Kiểm chứng |
|---|---|---|---|---|---|---|
| R1 | Sticky hỏng do tổ tiên `overflow`/containing block | Thấp | Trung bình | chuỗi tổ tiên không `overflow` (Mục 12.3); container-type chưa kiểm | container ngoài lưới; đo M9.0; fallback không-dính | đo thủ công + ảnh |
| R2 | Khung vuông cắt nhãn/tooltip | Thấp | Trung bình | mọi nhãn trong `viewBox 600`; không có tooltip | không thêm phần tử ngoài `viewBox`; công tắc/chi tiết ở ngoài vùng cuộn | thủ công 320/375 |
| R3 | CSS ẩn mất thông tin aspect | Thấp | Cao | chỉ unmount **lớp vẽ**; bảng luôn render | RS9–RS10, RG3 | test |
| R4 | Thẻ + bảng trùng nội dung SR | Thấp | Trung bình | `isTable` mount một biểu diễn | không mount hai; RS11 đếm | test + SR |
| R5 | Mock `matchMedia` không thông báo subscriber | Trung bình | Trung bình | helper hiện có đã phát `change`; helper mới là phần cộng thêm | test helper; `restore()` mỗi test | test |
| R6 | Reduced motion bỏ sót | Trung bình | Thấp–TB | chỉ 2 primitive có `motion-reduce` | bảng kiểm kê + G-M9-6 | grep + thủ công |
| R7 | Responsive phá đồng bộ M8 | Thấp | Cao | selection cùng reducer | RG1–RG10 chạy 3 chế độ | test |
| R8 | ID trùng/focus khi đổi chế độ | Thấp | Trung bình | một biểu diễn + `useId`; id hash cố định, một Shell/trang | không mount kép; kiểm focus khi đổi cỡ | test + thủ công |
| R9 | Zoom không truy cập/dễ gây hiểu nhầm | Trung bình | Trung bình | điều khiển mới | `aria-disabled`, `<output>`, nhãn; không `disabled` mất focus | Z + thủ công |
| R10 | axe xanh nhưng bàn phím/SR còn lỗi | Trung bình | Cao | jsdom không kiểm thị giác/SR | checklist 👤 Mục 20; không tuyên bố "đạt a11y" chỉ nhờ axe | Evidence Matrix |
| R11 | Hai cột `lg` không khả thi (cột phải ≈ 184 px) | **Cao nếu áp theo viewport** | Cao | `[calc]` Mục 12.1 | D-M9-04 phương án A; đo M9.0 | đo thủ công |
| R12 | Container query + sticky xung đột / hỗ trợ trình duyệt | Trung bình | Trung bình | chưa xác minh | thử nguyên mẫu; fallback B' (`xl`) | thủ công |
| R13 | Chỉnh primitive dùng chung gây tác dụng phụ | Thấp | Thấp–TB | chỉ thêm lớp | chạy toàn bộ `npm test` + E2E | CI |
| R14 | Đổi nhãn skip link làm vỡ E2E | Trung bình | Thấp | `layout.spec.ts` dùng `text=Skip to content` | cập nhật cùng commit | CI |
| R15 | Bẫy cuộn khung wheel trên mobile (cuộn trang bị giữ) | Trung bình | Trung bình | khung cuộn 2 chiều | `max-h` + không `overscroll-behavior: contain` (cho cuộn trang tiếp nối) | thủ công cảm ứng |

---

## 33. Known Gaps / Deferred Work

| Phân loại | Mục | Ghi chú |
|---|---|---|
| **Must fix in M9** | F-A1 heading wheel/overview · F-A2 skip link (nhãn + `main tabIndex`) · F-A3 `motion-reduce` · F-A4 nhãn vùng cuộn · tạo zoom · ba chế độ bố cục | Mục 19.1 |
| **Required before M9 closure** | M9.0 đo thực tế (hai cột/sticky/padding) · F-A5 test+thủ công zoom · F-A8 vòng focus SVG đa trình duyệt (nếu có Firefox/Safari, ngược lại `ACCEPTED GAP` ghi rõ) · F-A9 trình đọc màn hình (hoặc `ACCEPTED GAP`) · F-A12 tràn ngang (nếu đo thấy) · cập nhật `layout.spec.ts` | không điền khống bằng chứng |
| **Known Gap — defer** | **KG-M9-01 sticky chỉ bật khi viewport ≥ 1000 px (đo M9.0)** · **FG-05 pinch-to-zoom tuỳ biến (bất biến)** · F-A6 đường aspect trên wheel chỉ chuột/chạm (KG-M8-04) · bằng chứng thiết bị macOS/iOS/Android (KG-M8-01) · `motion-reduce` cho `Select/Radio/Textarea/Avatar/Modal/Alert` (ngoài viewer) · cảnh báo Node 20 ở CI | |
| **Existing unrelated technical debt** | drawer mobile thiếu focus trap (`TODO … Backlog M4`) · hai liên kết nav `href="/"` tải lại trang · padding lồng ở các trang anh em | không mở rộng M9 |
| **Requires separate decision** | D-M9-04 (xung đột chữ "hai cột từ `lg`" với chỗ trống thực) · F-A7 tương phản nét Căng thẳng nền sáng 2,56:1 (KG-M6-08) · D-M9-06 padding trang chart | Mục 33.1 |
| **Blocked by an earlier milestone** | không có | M8 đóng; zoom thuộc S4.9 |

### 33.1 Decision Review

| ID | Quyết định | Bằng chứng | Phương án khác | Trạng thái |
|---|---|---|---|---|
| D-M9-01 | Ba chế độ theo `screens` thật (`768`/`1024`); thẻ `< 640` là quy tắc con của Mobile | `tailwind.config.ts`; F4 §28; Shell | — | **inherited, VERIFIED** |
| **D-M9-02** | Zoom **tạo mới** (chưa có): `useState(1)` ở Shell, 1×–3× bước 0,5×, điều khiển `md:hidden`, `--zoom` CSS, căn giữa bằng `useLayoutEffect`, `aria-disabled` ở đầu mút, `<output>` | `grep` rỗng; F4 §13/§27/dòng 381 | zoom bằng `scale()` hoặc resize observer (phức tạp hơn) | **proposed** (state/khoảng inherited) — cần owner |
| **D-M9-03** | "Khung vuông" = bề mặt SVG luôn vuông; khung ngoài theo bản vẽ (không `aspect-square` cứng) để không cắt bản vẽ 400 px | Mục 13 | `aspect-square` cứng (cắt/2D pan ở < 400) | **proposed** — cần owner |
| **D-M9-04** | Desktop = viewport `≥ lg`; hai cột chỉ khi container ≥ ngưỡng đo (tạm 1010, M9.0) bằng container query tuỳ ý; fallback một cột | `[calc]` Mục 12.1 (cột phải 184 px ở 1024) | B' hai cột ở `xl` (đổi chữ roadmap); B ép thẻ ở cột hẹp | **unresolved** — cần owner (+ M9.0) |
| D-M9-05 | Cột trái dính khi đủ cao: `[@media(min-height:…)]:sticky top-[88px]`; thấp hơn không dính | Mục 12.3 | dính luôn (cắt đáy); cuộn lồng (xấu) | proposed (ngưỡng đo ở M9.0) |
| **D-M9-06** | Trang chart: `Container size="wide"` + bỏ padding lớp thứ hai (chỉ trang này) | double `px-8` | giữ nguyên; sửa `Container`/`AppLayout` (ảnh hưởng toàn app) | **unresolved** — cần owner xem trực quan |
| D-M9-07 | Dùng lại `SkipLink` toàn cục; nhãn tiếng Việt; `main tabIndex={-1}`; cập nhật E2E | `SkipLink`, `app-layout`, `layout.spec.ts` | skip link thứ hai trùng (bị cấm) | proposed |
| **D-M9-08** | Thêm **một** liên kết nội bộ "Chuyển tới bảng dữ liệu" (≈ 15–17 điểm Tab của wheel) | F4 §29 dòng 424 | bỏ liên kết (chỉ dùng skip link toàn cục) | **unresolved** — cần owner |
| **D-M9-09** | Reduced motion theo lớp ở chart + `Card/Button/Switch` (chỉnh primitive dùng chung, chỉ thêm lớp); không quy tắc CSS toàn cục | grep `motion-reduce`; F4 dòng 429 | quy tắc toàn cục (phá `Spinner`); chỉ chỉnh chart (Card/Button/Switch vẫn có chuyển tiếp) | **proposed** — cần owner xác nhận chỉnh primitive dùng chung |
| D-M9-10 | Thêm h2 `sr-only` cho Card tổng quan và Card wheel | Mục 10 | không thêm | proposed |
| D-M9-11 | axe: tái dùng `vitest-axe`; **không** package mới | `setup.ts`; 30+ file test | `jest-axe`/`axe-core` trực tiếp | **inherited, VERIFIED** |
| D-M9-12 | Helper test `installViewport` cộng thêm trên `installMatchMedia` | `matchMedia.ts` | sửa helper cũ; nhiều `installMatchMedia` rời rạc | proposed |
| D-M9-13 | Không thêm spec Playwright mới cho viewer (S4.10); chỉ cập nhật `layout.spec.ts` | F4 §S4.10; roadmap | thêm E2E ở M9 (hấp thụ S4.10) | **inherited** |
| D-M9-14 | Không thêm thông báo "đường aspect đang ẩn" ngoài công tắc | M6: công tắc có tên + trạng thái | dòng gợi ý | proposed |

**Đã được owner xác nhận (2026-10-22):** D-M9-02, D-M9-03, D-M9-04, D-M9-06, D-M9-08, D-M9-09 — chi tiết và các điều chỉnh ở Mục 33.2. Các quyết định còn lại (D-M9-05, 07, 10, 12, 14) **đã được owner chấp thuận ngày 2026-10-23** (`approved`; D-M9-05 áp dụng số đo ở Mục 33.3).

### 33.2 Xác nhận của owner (2026-10-22) và điều chỉnh v1.1

Nguồn: `Confirmation_2ed615.md` `[owner]`. Sáu quyết định chặn **được chấp thuận**; các điều dưới đây là **điều chỉnh có hiệu lực** và ghi đè nội dung tương ứng ở Mục 12–14, 18, 24.

| ID | Trạng thái | Nội dung đã chốt | Ghi đè so với v1.0 |
|---|---|---|---|
| D-M9-02 | **approved** | `useState(1)` ở Shell; 1×–3×, bước 0,5× (1, 1.5, 2, 2.5, 3); nút Zoom in/out/Reset; `aria-disabled` ở đầu mút **kèm handler chủ động chặn**; `<output>` hiển thị mức (ví dụ 150%); zoom truyền xuống wheel qua props, không state thứ hai; **chỉ render nút dưới `md`** (state vẫn ở Shell); không pinch/pan tuỳ biến/`ResizeObserver` | (A1) căn giữa: **thử CSS trước, chỉ dùng `useLayoutEffect` nếu thực tế cần**; (A2) nút **render có điều kiện**, bỏ `md:hidden` |
| D-M9-03 | **approved** (kèm A3 chờ chốt) | chỉ **bề mặt SVG** vuông 1:1 (có `viewBox`); khung ngoài không ép vuông; không `aspect-square` cho wrapper tổng chứa nhãn/phần tử có thể vượt SVG; phần hỗ trợ (zoom, legend) nằm ngoài vùng có thể bị clip; **không layout shift đáng kể khi zoom** | (A3) xem dưới |
| D-M9-04 | **approved** (nguyên tắc); ngưỡng **chưa chốt** | viewport `≥ lg` là desktop; hai cột chỉ khi container đủ rộng, ngược lại một cột; `960` chỉ là khởi điểm cần đo; **không** chuyển sang `xl`; không thêm dependency | (A4) ngưỡng cuối **khoá ở M9.1** sau khi xử lý padding, kèm bằng chứng giao diện |
| D-M9-06 | **approved** | **chỉ trang chart**: `Container size="wide"` và bỏ lớp padding thứ hai; không sửa `Container`/`AppLayout`; kiểm tra trực quan trước; giữ gutter mobile; đo ngưỡng D-M9-04 **sau** khi xử lý padding | (A5) `Container` đã có prop `paddingX` (VERIFIED) ⇒ chỉ cần `paddingX={false}` ở trang chart |
| D-M9-08 | **approved** | đúng **một** liên kết "Chuyển tới bảng dữ liệu" **trước wheel**, bổ sung (không thay) skip link toàn cục; đích là `id` ổn định của khu vực bảng (container/heading chung), có thể nhận focus; có focus indicator; hoạt động desktop + mobile; không phá thứ tự Tab | (A7) acceptance: id duy nhất, đích tồn tại, không tạo skip link thứ hai cùng chức năng |
| D-M9-09 | **approved** | reduced motion ở viewer + lớp `motion-reduce` cho `Card`, `Button`, `Switch`; **không** CSS toàn cục; Spinner/loading giữ nguyên; chỉ audit thêm primitive khác nếu có motion thật; hành vi mặc định (không bật reduced-motion) không đổi | (A6) chi tiết lớp theo audit thực tế |

**Điều chỉnh A1–A7 (kết quả đối chiếu xác nhận với mã/kiểm chứng):**

| # | Điều chỉnh | Căn cứ |
|---|---|---|
| **A1** | Cách thu phóng giữ **đổi `width` bản vẽ trong vùng cuộn** (không `transform: scale`, không cắt `viewBox`). Lý do: `scale()` với `transform-origin: center` **không** làm vùng cuộn dài ra và phần tràn về trái/trên **không cuộn tới được**; cắt `viewBox` buộc có pan tuỳ chỉnh (bị cấm) và chỉ thấy phần giữa bản vẽ — vi phạm "không cắt mất thành phần quan trọng". **Chưa mặc định `useLayoutEffect`**: M9.2 làm bản không có effect trước, kiểm trên trình duyệt thật; chỉ thêm effect căn giữa khi bản vẽ phóng to lệch/ở góc trái-trên gây khó dùng (ghi quyết định + bằng chứng). *Đây là nhận định kỹ thuật, cần thí nghiệm xác nhận ở M9.2* | owner: "chỉ dùng `useLayoutEffect` nếu thực tế cần" |
| **A2** | Nút zoom **render có điều kiện** theo `matchesMd` **đã có ở Shell** (không thêm hook, không thêm truy vấn mới) ⇒ quan sát được trong jsdom; gating `max-md:` trên bản vẽ giữ zoom vô hiệu khi `≥ md` dù state còn lại | owner: "chỉ render nút dưới md" |
| **A3** *(**approved** 2026-10-23)* | Để thoả "zoom không gây layout shift đáng kể", **vùng cuộn** (chỉ chứa SVG, **không** chứa nhãn/điều khiển) dùng `max-md:aspect-square` — chiều cao khung cố định theo chiều rộng, bản vẽ cuộn 2 chiều bên trong; thay cho `max-h` tăng dần của v1.0 (chiều cao khung đổi theo zoom ⇒ nội dung phía dưới nhảy). Điều này **không** vi phạm "không `aspect-square` cho wrapper tổng" vì vùng cuộn không bao gồm nhãn/phần hỗ trợ; khi container < 400 px thì cuộn 2 chiều trong khung vuông | owner D-M9-03 acceptance |
| **A4** | Ngưỡng hai cột: M9.0 đo **sơ bộ**; **khoá cuối ở M9.1** sau `size="wide"` + `paddingX={false}`. **Xác minh hỗ trợ cú pháp (đã chạy):** `tailwindcss` **3.4.19**, `plugins: []`, **không** có `@tailwindcss/container-queries`; CLI Tailwind (bản clone, file tạm đã xoá) sinh đúng `@container(min-width:1010px){…}` và `@media(min-height:1000px){…}` cho biến thể tuỳ ý + `[container-type:inline-size]`, `touch-pan-x/y`, `touch-pinch-zoom`, `max-md:aspect-square`, `max-md:w-[max(400px,calc(var(--zoom)*100%))]`, `motion-reduce:transition-none`, `motion-reduce:active:scale-100` ⇒ **không cần dependency**. **Chưa xác minh:** hành vi `container-type` + `sticky` và hiển thị thật trên trình duyệt | owner: "kiểm tra Tailwind trước" |
| **A5** | `Container` hiện có `size?: "default"\|"wide"\|"narrow"\|"full"` và `paddingX?: boolean` (mặc định `true` ⇒ `px-4 md:px-8`) | `shared/ui/Container/index.tsx` |
| **A6** | Audit chuyển động thực tế: `Button` = `transition-all` + `active:scale-[0.98]` ⇒ thêm `motion-reduce:transition-none motion-reduce:active:scale-100`; `Card` = `transition-colors` (biến thể bấm được); `Switch` = track `transition-colors` + thumb `transition-transform`; **không có tooltip/popover** trong viewer ⇒ không có gì để sửa; zoom/recenter không có transition | `grep` |
| **A7** | Acceptance bổ sung theo xác nhận (đã gộp vào AC-RA): zoom không méo; không cắt thành phần quan trọng; Reset → 1×; không vượt giới hạn; bàn phím + trình đọc màn hình dùng được nút; **selection/đồng bộ M8 không đổi khi zoom**; SVG luôn 1:1; không layout shift đáng kể; không hai cột khi cột phải quá hẹp; Sticky hoạt động trong container thực; liên kết bảng dữ liệu có id duy nhất; mobile còn gutter; trang khác giữ nguyên spacing; spinner/loading còn hoạt động | `Confirmation_2ed615.md` |

**Không còn mục chờ owner.** A3 (vùng cuộn vuông cố định ở `< md`) đã được chấp thuận ngày 2026-10-23.

### 33.3 Kết quả M9.0 — đo bố cục thực (2026-10-23)

Chi tiết số liệu, môi trường và giới hạn: `m9_0_layout_measurement.md` (đặt ở `docs/implementation/archive/sprint-f4/evidence/`), ảnh `m9_0_*.png`, script `m9_0_measurement_scripts.zip`. **Môi trường:** HeadlessChrome 153 (Linux, sandbox), mock API với `fixture_full.json`, nguyên mẫu hai cột bằng thao tác DOM tạm — **không** phải Windows Chrome/Firefox/Safari và **không** phải mã React cuối.

| # | Phát hiện (đo thật) | Hệ quả |
|---|---|---|
| 1 | Chiều rộng Shell đo được **khớp** `[calc]` ở mọi điểm (375→311, 768→640, 1024 mở→656, 1280 mở→912, 1440 mở→1072…); padding lồng xác nhận bằng computed style (16/16 ở 375, 32/32 từ 768); không tràn ngang trang ở bất kỳ viewport | D-M9-06 có cơ sở; `[calc]` Mục 12.1 được xác nhận |
| 2 | **Aspect Table cần ≥ 532 px**, Planet Table ≥ 436 px để không cuộn ngang; ở T=960 (cột phải 504) Aspect Table vẫn bị cắt | ngưỡng **960 không đủ** ⇒ **1010 px** (448 + 24 + 532 = 1004) |
| 3 | Cột trái cao **813** (chưa chọn) / **869** (chọn hành tinh) / **887** (chọn aspect) ở bề rộng 448 | chặn sticky `min-height` = 887 + 88 + 24 ⇒ **1000 px** (thay 960) |
| 4 | `container-type: inline-size` + `position: sticky` **hoạt động** trong Chromium 153: `top = 88` sau cuộn ở mọi cấu hình; không tổ tiên nào có `overflow` | R1/R12 hạ cho Chromium; Firefox/Safari vẫn **UNVERIFIED** |
| 5 | Với padding đã bỏ và T=1010: hai cột từ viewport ≈ **1314 (sidebar mở)** / **1138 (thu gọn)**; **1366 (mở): 998 → một cột nếu giữ padding, 1062 → hai cột nếu bỏ** | D-M9-04 hoạt động đúng ý; D-M9-06 là điều kiện cần cho hai cột trên laptop 1366 |
| 6 | **Sticky chỉ bật khi viewport cao ≥ 1000 px** (1440p/4K); phần lớn màn 1080p (≈ 940–970) không dính | an toàn nhưng giá trị thực tế thấp ⇒ **KG-M9-01**; rút gọn cột trái (≈ −130 px ⇒ ngưỡng ≈ 870) là quyết định thiết kế riêng, **không** áp dụng ở M9 trừ khi owner yêu cầu |
| 7 | Mobile 375 ở 1×: thấy ≈ 311/400 px bề rộng bản vẽ, cuộn bắt đầu từ trái ⇒ DSC bị che | ủng hộ **căn giữa ban đầu** (A1) — quyết định thí nghiệm ở M9.2 |
| 8 | Lỗi trình tự harness đợt đầu (padding rò sang biến thể sau) đã sửa; số liệu trên là lần chạy sạch (trang mới mỗi biến thể) | — |

**Giá trị tạm chuyển cho M9.1:** `T = 1010 px`, `H = 1000 px`, `Container size="wide" paddingX={false}` (chỉ trang chart). **Khoá cuối ở M9.1** trên mã thật.

---

## 34. Acceptance Criteria — AC Responsive & Accessibility

**Truy vết tiêu chí chính tắc.** F4 plan không có khối "AC Responsive & Accessibility" đánh số; văn bản thẩm quyền (dòng 631, 859–860, Definition of Done) gồm:
- *Responsive:* "desktop/tablet/mobile dùng được; cảm ứng chọn được."
- *A11y:* "có phương án bảng; bảng ngữ nghĩa; phần tử tương tác dùng được bàn phím; thông tin không chỉ bằng màu; kiểm thủ công đã ghi."

Plan chuyển hai câu này và checklist của prompt thành bộ **AC-RA-*** để kiểm được; **không** thay thế văn bản chính tắc. **Mọi tiêu chí hiện `NOT STARTED`**; chỉ chuyển `VERIFIED` khi có lệnh đã chạy hoặc bằng chứng thủ công đủ trường.

| ID | Tiêu chí | Truy vết | Bằng chứng cần có |
|---|---|---|---|
| AC-RA-R1 | Ba chế độ (`<768`, `768–1023`, `≥1024`) được hiện thực và xác minh theo breakpoint cấu hình thật | Responsive (DoD) | RS1–RS6 + thủ công |
| AC-RA-R2 | `≥ lg` dùng hai cột **theo quy tắc D-M9-04** (khi đủ chỗ), một cột khi không | prompt §3.2; F4 dòng 417 | RS7 + bảng đo M9.0 |
| AC-RA-R3 | Sticky hoạt động, không bẫy nội dung, không xung đột cuộn trang | prompt | RS8 + thủ công |
| AC-RA-R4 | Khung wheel vuông, thu phóng không méo hình học | prompt | Z1–Z3, thủ công |
| AC-RA-R5 | Nút zoom có ở `< md` | F4 dòng 381 | Z4–Z12 |
| AC-RA-R6 | Aspect tắt mặc định `< md` | D-M6-08 | RS4–RS6 |
| AC-RA-R7 | Thông tin aspect vẫn truy cập qua bảng/chọn khi đường ẩn | prompt | RS9–RS10, RG3 |
| AC-RA-R8 | Thẻ/biểu diễn hẹp đọc được, dùng được | prompt | RS11–RS12, thủ công |
| AC-RA-R9 | Không tràn ngang ngoài ý muốn ở các cỡ hỗ trợ | prompt | thủ công 320–1440 |
| AC-RA-R10 | Cảm ứng truy cập thông tin thiết yếu không cần hover | Responsive (DoD) | M8 + thủ công |
| AC-RA-R11 | Đồng bộ chọn hoạt động ở cả ba chế độ | prompt; F4 §26 | RG1–RG10 |
| AC-RA-A1 | Skip link hoạt động, chuyển tới nội dung chính | prompt | SK1–SK6 + E2E |
| AC-RA-A2 | Landmark `main` và cấu trúc heading hợp lệ | prompt | AX + thủ công |
| AC-RA-A3 | Bảng ngữ nghĩa vẫn truy cập được | A11y (DoD) | AX, RS |
| AC-RA-A4 | Hành tinh/aspect không chỉ biểu diễn bằng glyph hoặc màu | A11y (DoD) | AX, thủ công |
| AC-RA-A5 | Điều khiển tương tác có tên truy cập và focus nhìn thấy | prompt | AX + thủ công |
| AC-RA-A6 | Người dùng bàn phím vận hành được tương tác chính và nút zoom | A11y (DoD) | Z, M8, thủ công |
| AC-RA-A7 | `prefers-reduced-motion` được tôn trọng | F4 dòng 429 | RM1–RM4 + thủ công |
| AC-RA-A8 | Phát hiện axe trong phạm vi M9 được sửa hoặc ghi riêng từng mục (bằng chứng, lý do, quyết định) | prompt | báo cáo AX |
| AC-RA-A9 | Checklist thủ công Mục 20 đã chạy và ghi (hạng mục thiếu thiết bị ghi `ACCEPTED GAP`) | A11y (DoD) | Evidence Matrix |
| AC-RA-A10 | Không thông tin thiết yếu chỉ qua hover, màu hoặc hoạt ảnh | prompt | AX + thủ công |
| AC-RA-G1 | Tương tác và đồng bộ M8 nguyên vẹn | prompt | RG1–RG10 + test M8 không sửa |
| AC-RA-G2 | Birth Profile, chart list, tính lá số, routing, API nguyên vẹn | prompt | `npm test` đầy đủ + E2E CI |
| AC-RA-G3 | Trạng thái loading/error/empty/thiếu giờ sinh vẫn đúng | prompt | RS12, AX |
| AC-RA-G4 | Không làm yếu/xoá test; `lint`, `typecheck`, `format:check`, `test`, `build` đạt | Chất lượng (DoD) | lệnh đã chạy + CI |

## 35. Definition of Done

M9 xong khi **tất cả** đúng:

1. Mọi AC-RA-* ở Mục 34 đã `VERIFIED` hoặc ghi `ACCEPTED GAP`/`DEFERRED` **có lý do và bằng chứng**; không mục nào đánh dấu đạt khi chưa chạy.
2. Quyết định Mục 33.1 đã chốt, ghi vào Evidence Matrix bằng ID `D-M9-*` của plan này.
3. Cổng Mục 31 đạt: 4 lệnh tĩnh + `build` + `test:coverage`, Grep Gates G-M9-1…10 sạch, **CI xanh** (gồm E2E) trên evidence commit.
4. Test M8 chạy **không sửa**; test mới chỉ thêm; không xoá/làm yếu test.
5. Không dependency mới, không đổi Backend/API, không Zustand/Context mới, không `dangerouslySetInnerHTML`, không pinch tuỳ biến.
6. Evidence Matrix M9 có bằng chứng thật (lệnh, CI, thủ công đủ trường) và Known Gaps đầy đủ.
7. Blueprint M9 đã xoá ở commit docs-only sau evidence commit; F4 plan đồng bộ.

## 36. Final Architect Review

| Mảng | Câu hỏi | Đánh giá |
|---|---|---|
| Roadmap | giữ thứ tự đóng băng v1.1/phương án B? | **Có** (Mục 3); M11 là milestone đã thêm và đã đóng; M9 sau M8, trước S4.10 |
| Scope | thật sự là hardening? tránh viết lại M8? | **Có**; tái dùng reducer/layer/bảng; thành phần mới duy nhất là zoom (thiếu thật, thuộc S4.9); pinch tuỳ biến **ngoài phạm vi** |
| Responsive | đủ ba chế độ? `lg` hai cột/sticky khả thi? wheel vuông không cắt? zoom `< md`? aspect ẩn mà vẫn còn thông tin? | ba chế độ **đủ**; hai cột/sticky **khả thi có điều kiện** (xung đột chỗ trống `[calc]` — D-M9-04, bắt buộc đo M9.0); wheel vuông không cắt (nhãn trong `viewBox`, phần phụ ngoài khung); zoom `< md` **có**; aspect ẩn mặc định, dữ liệu/bảng nguyên vẹn |
| Accessibility | skip link? reduced motion? phương án phi thị giác? axe + thủ công? giới hạn bàn phím/SR được ghi? | skip link dùng lại + sửa; reduced motion theo lớp; bảng luôn đủ; axe **và** checklist thủ công; giới hạn (đường aspect pointer-only, chưa có SR/thiết bị) ghi ở Mục 33 |
| Architecture | tái dùng thành phần/state? Zustand/dependency không biện minh? xử lý responsive ở presentation? giữ ngữ nghĩa Backend? | tái dùng; **không** Zustand/dependency; CSS-first, JS chỉ hai chỗ đã có + `zoom` cục bộ; không đổi dữ liệu/ngữ nghĩa Backend (`isHouseDataAvailable=false` vẫn hợp lệ) |
| Testing | breakpoint test tin cậy? mock phù hợp? M8 được bảo vệ? thủ công rõ? | mock hiện có đủ (per-query, listener, restore) + helper cộng thêm; hành vi CSS-only nói rõ là thủ công; M8 chạy không sửa + RG ở ba chế độ; checklist 👤 |
| Giới hạn tự thừa nhận | | các số bố cục là `[calc]` chưa đo; container query + sticky chưa kiểm trình duyệt; chưa chạy `test:coverage`/`test:e2e` trong phiên audit |

## 37. Final Recommendation

**`CONDITIONALLY READY`**

Điều kiện (không có blocker kỹ thuật):

1. ~~Owner xác nhận D-M9-02/03/04/06/08/09~~ — **đã xác nhận (Mục 33.2)**; A3 cũng đã được chấp thuận (2026-10-23) — **không còn quyết định chờ owner**.
2. ~~M9.0~~ **đã chạy 2026-10-23** (Mục 33.3, Chromium 153); còn **khoá ngưỡng cuối ở M9.1** trên mã React thật sau khi xử lý padding (giá trị tạm: 1010 px / 1000 px) và, nếu có thiết bị, kiểm Firefox/Safari cho container query + sticky.
3. Chấp nhận trước các giới hạn bằng chứng kế thừa từ M8 (một nền tảng, chưa có trình đọc màn hình/thiết bị cảm ứng khác) — ghi `ACCEPTED GAP`, không tuyên bố đã xác minh.
