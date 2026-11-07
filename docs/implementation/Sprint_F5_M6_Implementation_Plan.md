# Sprint F5 — M6: Responsive & A11y Hardening — Implementation Plan

| | |
|---|---|
| **Dự án** | AstroViet — Frontend Sprint F5 (Interpretation UI) |
| **Milestone** | F5.M6 — Responsive & A11y hardening (prerequisite: M4, M5) |
| **Trạng thái tài liệu** | **PLAN — chờ Owner duyệt.** Chưa triển khai, chưa đo đạc, chưa chạy QA thủ công |
| **Repo / nhánh đã audit** | `KhongphaiHphuc0705/astroviet`, nhánh `dev`, HEAD `1978ac4` ("[docs] update m5 evidence matrix"); CI #321 xanh trên `622ad14` |
| **Ngày lập** | 2026-11-06 |
| **Vị trí lưu đề xuất** | `docs/implementation/Sprint_F5_M6_Implementation_Plan.md`. Lý do: khớp quy ước M5 (plan tạm ở `docs/implementation/`, xoá sau khi milestone đóng; Evidence Matrix lưu ở `docs/implementation/archive/sprint-f5/`). `docs/frontend/` trong repo chỉ chứa đặc tả (UI Spec, Architecture, Design System, Coding Standards) nên **không** dùng đường dẫn gợi ý `docs/frontend/FE_F5_M6_…` của prompt |

**Nhãn độ tin cậy**

| Nhãn | Nghĩa |
|---|---|
| **[VF]** | Verified fact — đọc trực tiếp trong mã/tài liệu/CI của repo (kèm đường dẫn) |
| **[AD]** | Approved decision — Owner đã ghi nhận duyệt trong tài liệu repo |
| **[OBS]** | Quan sát tĩnh: đọc mã hoặc dựng DOM bằng jsdom (test tạm, đã xoá, repo sạch). **Không phải đo trên trình duyệt thật** |
| **[REC]** | Đề xuất của kế hoạch này, **chưa** duyệt |
| **[UNK]** | Chưa biết / chưa xác minh được |
| **[PLAN]** | Hoạt động QA dự kiến — chưa thực hiện |

> **Tuyên bố giới hạn.** Tác giả plan này không truy cập được máy QA của Owner (Windows 11 + Chrome + Narrator) hay môi trường chạy `dev`. **Không có phép đo layout, kết quả QA thủ công, trạng thái trình đọc màn hình nào ở đây là kết quả thật.** Mọi hàng QA có trạng thái `NOT TESTED`. Các "Giả thuyết cần kiểm chứng" (H6-xx) là quan sát tĩnh, chưa phải lỗi đã xác nhận.

---

## 1. Executive Summary (8.1)

### 1.1 Mục tiêu
Chứng minh bằng bằng chứng trong repo và hồ sơ QA riêng rằng trải nghiệm M4/M5 (Chart Viewer + khu vực Diễn giải) dùng được ở các viewport liên quan; heading, chuyển động, độ đọc, liên kết nhảy, bàn phím và trình đọc màn hình được kiểm; điều gì không kiểm được thì ghi Known Gap và xử lý theo chính sách phê duyệt từng mục. **M6 là hardening, không phải thiết kế lại.**

### 1.2 Phạm vi
Tám workstream M6.1–M6.8 của prompt, thêm cổng vào **M6.0** và đóng milestone **M6.9** (theo mẫu M5.0…M5.7). Mọi sửa mã chỉ thực hiện khi có bằng chứng đo/kiểm và (nếu chạm quyết định đã duyệt) Owner cho phép.

### 1.3 Điều kiện tiên quyết (xem 2.2)
M4 `PASS WITH GAPS` và M5 `COMPLETED` có hồ sơ trong repo; baseline trên `1978ac4` tôi tự chạy: format pass, ESLint không lỗi, typecheck không báo lỗi, `features/chart` + `pages/app/charts` **61 file / 751 test pass**. Chưa tự chạy: toàn bộ Vitest, build, E2E.

### 1.4 Kết quả mong đợi
Bảng AC-24…27 có bằng chứng; Evidence Matrix M6 tách **Phần A (tự động)** và **Phần B (thủ công)**; quyết định §7.1 có số đo; các Known Gap được phân loại, không có `ACCEPTED GAP` nào thiếu phê duyệt riêng; không hồi quy F4/F5.

### 1.5 Ngoài phạm vi
Backend/API/nội dung diễn giải; thiết kế lại Viewer/Panel; thêm dependency, thư viện motion, overlay a11y; tuyên bố tuân thủ WCAG; thêm diễn giải ở FE; E2E Backend thật cho diễn giải (M7); CHANGELOG/version (M8); đổi phạm vi M4/M5 đã đóng (trừ khi phát hiện hồi quy hoặc xung đột yêu cầu).

### 1.6 Các phát hiện chính từ audit (chi tiết ở Mục 2)
1. **Không có URL `dev` triển khai trong repo.** Mọi bằng chứng QA F4/F5 dùng `http://localhost:5173` (Vite) + Backend cục bộ → "dev" cần được Owner xác nhận nghĩa (D-M6-01).
2. **§7.1 (Vị trí)** đã được hiện thực đúng hướng bản vẽ (toàn chiều rộng, sau lưới F4), nhưng neo `id="chart-interpretation"` trong §7.1 **không tồn tại** trong mã; quyết định giữ/đổi vị trí **cần số đo** → Owner Decision (D-M6-02).
3. **Chuyển động:** 3 điểm trong `InterpretationItem.tsx` chưa có `motion-reduce`; không có `scroll-behavior`/`scrollIntoView` trong `src` (nhưng Matrix M4 ghi "cuộn mượt" — chưa đối chiếu được).
4. **Heading:** DOM dựng bằng jsdom không nhảy cấp (h1→h2→h3→h4); có 8 vùng `region` và `<title>` tĩnh.
5. **Liên kết nhảy:** không có `scroll-margin` so với header sticky 64px; đích focus là `h3` có `focus:outline-none`.
6. **Độ đọc/mục tiêu chạm:** `bodyText` hiển thị 13px, không giới hạn bề rộng dòng; nút "Xem trên biểu đồ" cao 32px.
7. **Vệ sinh Known Gap:** `KG-F5M4-01` mang nhãn `ACCEPTED GAP` dù Narrator khả dụng (D-M10-08) và đã hoãn sang M6; không thấy tham chiếu phê duyệt riêng.

---

## 2. Repository Audit Findings (8.2)

### 2.1 Nguồn đã đọc
| Nhóm | Đường dẫn (tại `1978ac4`) |
|---|---|
| Plan F5 | `docs/implementation/Sprint_F5_Implementation_Plan.md` (AC dòng 502–505; §7.1 dòng 184–185; §7.2, §7.7; M6 dòng 332–336; R-12 dòng 423; P-01…P-06 dòng 438–443) |
| Evidence | `docs/implementation/archive/sprint-f5/Sprint_F5_M{3,4,5}_Exit_Criteria_Evidence_Matrix.md`; `…/archive/sprint-f4/Sprint_F4_M10_Exit_Criteria_Evidence_Matrix.md`; thư mục ảnh `…/archive/sprint-f5/evidence/` |
| Đặc tả | `docs/frontend/Frontend_UI_Specification.md` (§6 typography, §7 breakpoint, dòng 356/452), `docs/product/PRD.md` (dòng 136–137, 191), `docs/frontend/Frontend_Coding_Standards.md` |
| Mã UI | `features/chart/ui/{ChartViewerShell,InterpretationPanel,SelectionDetail,PlanetTable,HouseTable,AspectTable,ChartWheel}`, `pages/app/charts/detail/page.tsx`, `widgets/app-layout/index.tsx`, `shared/ui/*` |
| Cấu hình | `frontend/tailwind.config.ts`, `src/app/styles/tokens.css`, `playwright.config.ts`, `eslint.config.js`, `package.json`, `.github/workflows/frontend-ci.yml`, `CHANGELOG.md`, `.env.example` |
| Test | `src/test/{viewport.ts,render.tsx,setup.ts}`, `e2e/*.spec.ts`, các `*.test.tsx` của chart/panel/page |

### 2.2 Xác minh điều kiện tiên quyết M4/M5
| Hạng mục | Bằng chứng | Trạng thái |
|---|---|---|
| M4 đóng | Matrix M4: `PASS WITH GAPS`; 14 ảnh thật ở `…/evidence/m4_*`; KG-F5M4-01…05 | [VF] hồ sơ có; CI #41849415741 do Matrix trích dẫn, tôi chưa mở lại |
| M5 đóng | Matrix M5: `COMPLETED`; 18 test D5-*; H-1 trong `page.tsx`; D-M5-00…11 `APPROVED` | [VF] |
| CI | Run #321 (`622ad14`, push `dev`): Success, 6m03s, 1 cảnh báo Node 20 | [VF] đã mở trang tóm tắt; **không** xem được log từng bước. CI cho `1978ac4` (commit chỉ-docs): [UNK] |
| Baseline cục bộ `1978ac4` | format pass; ESLint không lỗi; typecheck không báo lỗi; vitest `src/features/chart src/pages/app/charts` = 61 file / 751 test pass (đặt `VITE_API_BASE_URL=http://localhost:3000`) | [VF] do tôi chạy; **chưa chạy** toàn bộ Vitest/build/E2E |
| Merge M5 vào `main` | Owner nêu ý định tạo PR; trạng thái PR: [UNK]; quy ước nhánh/PR (C-1) chưa có văn bản | M6.0 phải chốt nhánh nền cho M6 |
| Tài liệu F5 plan | Metadata §1 vẫn ghi **"Draft — Pending Owner Approval"** dù M1–M5 đã đóng với quyết định Owner | [VF] mâu thuẫn tài liệu (ghi vào 2.11) |

### 2.3 Responsive hiện có
- **Breakpoint Tailwind** [VF `tailwind.config.ts`]: `xs 0, sm 640, md 768, lg 1024, xl 1280, 2xl 1536`. Container: narrow 768, default 1200, wide 1440.
- **Layout F4** [VF `ChartViewerShell.tsx`, F4 M10 Matrix dòng 39]: mobile thẻ xếp chồng, tablet một cột, desktop hai cột bằng **container query** `@container (min-width:1010px)` (D-M9-04); cột trái sticky chỉ khi container ≥1010px **và** chiều cao ≥1000px (D-M9-05, KG-M9-01); `matchesMd` quyết định hiện điều khiển zoom.
- **Khu vực Diễn giải** [VF `ChartViewerShell.tsx`]: render **sau** khối lưới F4, cùng cấp (`space-y-6`), toàn chiều rộng; `Card as="section"`; mỗi `PartRow` là `grid sm:grid-cols-[8rem_1fr]`.
- **Layout ứng dụng** [VF `widgets/app-layout/index.tsx`]: header `sticky top-0 h-[64px] z-sticky`; sidebar `lg:flex` rộng 240px (64px khi thu gọn); drawer mobile.
- **Ước tính suy ra [OBS, CHƯA ĐO]:** với sidebar mở 240px, hai cột chỉ bật khi viewport ≳ 1010 + 240 + lề trang ≈ 1300px+ ⇒ ở 1024–1280 layout vẫn một cột. **Cần đo** vì AC-25 nói "≥1024" nhưng không nói đó là chế độ hai cột.
- **Bằng chứng ảnh đã có:** M3 `m3_s02_full_{mobile_375,tablet_768,desktop_1500}.png`, `m3_s02_reflow_320.png`; M4 `m4_responsive_{375,768,1500}.png`; F4 Q6 (320/360/375/800/1500 + zoom 200%) trên Dell Precision 5530. **Chưa có** ảnh 375px cho trạng thái S-05 (KG-F5M3-04).

### 2.4 Trợ năng hiện có
**Outline DOM [OBS — jsdom, ChartViewerShell + `chartFull`/`chartNoHouses`]** (h1 do `page.tsx`):
```
h1  Lá số sinh  (tabIndex=-1, focus khi vào trang)
 ├ h2 [sr-only] Thông tin lá số
 ├ h2 [sr-only] Biểu đồ lá số           (div[role=region] "Khung biểu đồ, có thể cuộn…")
 ├ h2 [sr-only] Chi tiết đang chọn      (SelectionDetail)
 ├ h2 Vị trí hành tinh
 ├ h2 Nhà và các góc  └ h3 Các góc chính (chỉ khi có Nhà)
 ├ h2 Góc chiếu
 └ h2 Diễn giải  [nav "Các nhóm diễn giải"]
     ├ h3 Cốt lõi:        h4 Mặt Trời · … | Mặt Trăng · … | Cung Mọc (· cung)
     └ h3 Các hành tinh:  h4 Sao Thủy … Sao Diêm Vương  (+ badge "Đang chọn" nằm trong h4)
```
- Không có cấp bị nhảy trong outline này [OBS]. AC-24 yêu cầu "(test)": test hiện có dùng `getByRole("heading", { level })` ở Panel/Shell/page; **chưa** có một test duy nhất khẳng định toàn bộ outline liên tục.
- **8 vùng `region`** [OBS]: `Chi tiết đang chọn`, `Vị trí hành tinh`, `Nhà và các góc`, `Góc chiếu`, `Diễn giải`, `Cốt lõi`, `Các hành tinh`, cùng `Khung biểu đồ…` — gồm hai `section` lồng trong `Diễn giải`.
- **Skip link** F4 `#chart-data-tables` (D-M9-08) [VF]; **không** có liên kết/skip link tới Diễn giải; neo `#chart-interpretation` của F5 §7.1 **không tồn tại** [VF `grep` rỗng].
- **`<title>`** đặt trong `page.tsx`: "Lá số sinh — AstroViet" (tĩnh, không có tên hồ sơ); `router.tsx` còn TODO `<title>` động (OQ-M8-1) [VF]; liên quan FG-10.
- **Live region:** `div[role=status][aria-live=polite]` trong Shell, được test "duy nhất một" (SH-N13, theo Matrix M4) [VF].
- **Công cụ tự động đã có** [VF]: `vitest-axe` (dùng trong test của Panel, Item, Overview, ChartWheel… ), `eslint-plugin-jsx-a11y`.
- **Focus ring:** token `ring-focus` (D-M3-TECH-02: tương phản cao, cả light/dark) [AD].

### 2.5 Chuyển động
| Vị trí | Hiện trạng [VF/OBS] | `motion-reduce`? |
|---|---|---|
| Wheel (`PlanetLayer`, `AspectLayer`), Planet/House/Aspect table, `AspectFilterChip`, `Switch`, `Button`, `Card`(clickable), `Skeleton` | `transition-*`/`animate-pulse` | **Có** (`motion-reduce:transition-none`/`animate-none`; test RM1/RM2 ở `ChartViewerShell.test.tsx`) |
| `Spinner` | `animate-spin` | Làm chậm (`motion-reduce:animate-[spin_3s_linear_infinite]`), không tắt |
| **`InterpretationItem.tsx`** — `<article>` `transition-colors` (dòng 74) | chuyển màu khi chọn | **Không** |
| `InterpretationItem.tsx` — chevron `transition-transform` + `rotate-180` (dòng 99) | xoay khi mở/đóng | **Không** |
| `InterpretationItem.tsx` — nút "Xem trên biểu đồ" `transition-all … active:scale-[0.98]` (dòng 135) | nhấn co nhẹ | **Không** |
| Layout/shared khác (`Avatar`, `Select`, `Radio`, `Checkbox`, `Input`, `Textarea`, `ThemeToggle`, `Alert` nút đóng, `Modal`, sidebar `transition-all`) | `transition-*` | Không — **ngoài vùng** nội dung route chart; ghi nhận, không tự mở rộng (D-M6-07) |
| Cuộn | **Không** có `scroll-behavior`, `scrollIntoView`, `scrollTo` trong `src` (loại trừ test) | n/a — việc cuộn do `focus()` của trình duyệt |
| Thư viện motion | Không dùng cho vùng này | n/a |

Matrix M4 (ảnh 4) mô tả "trang cuộn mượt" khi bấm "Đọc diễn giải": **không khớp** với mã (không có smooth-scroll) hoặc do hành vi trình duyệt/OS — **[UNK]**, M6.3 phải kiểm.

### 2.6 Cơ chế điều hướng trong trang
| Cơ chế | Hiện trạng [VF] | Điểm cần kiểm |
|---|---|---|
| Overview → nhóm | `<a href="#interpretation-group-…">`; nhấp trái thường `preventDefault` + `heading.focus()`; nhấp có phím bổ trợ/giữa dùng neo gốc | cuộn, che khuất bởi header sticky, hiển thị focus, URL/hash |
| Skip link F4 | `#chart-data-tables` | đã kiểm ở F4 Q4 (Enter → main/bảng) |
| "Đọc diễn giải" (SelectionDetail) | `revealItem` → mở mục + `button.focus()`; chỉ hiện khi có chọn và panel khả dụng | cuộn tới nút, khả năng bị header che, focus ring |
| "Xem trên biểu đồ" | `focusChartObject` đưa focus về phần tử hành tinh; không đổi selection | cuộn ngược lên, header che |
| Chọn wheel/bảng → mục nổi bật | đánh dấu + mở, **không** cuộn/focus (P-03, AC-16) | giữ nguyên |
| Tab / tablist | **Không có** | n/a |
| Quay lại | Liên kết `← Hồ sơ sinh` ở đầu trang (màu `text-subtle`) | độ tương phản [UNK] |
| Sticky | header 64px; cột wheel (≥1010px & ≥1000px cao) | `scroll-margin` |

### 2.7 Hạ tầng QA: hiện có vs đề xuất
| Hạng mục | Hiện có [VF] | Đề xuất [REC] |
|---|---|---|
| Unit/component | Vitest 4 + jsdom + RTL + user-event; `vitest-axe`; `src/test/viewport.ts` mô phỏng **media query theo bề rộng** (không đánh giá container query, không tính layout; truy vấn không phải bề rộng mặc định `false`) | Bổ sung test class/tĩnh; không giả vờ đo layout trong jsdom |
| E2E | Playwright, **một** project `chromium` (Desktop Chrome 1280×720), E2E chạy trong CI cùng Backend thật + seed nội dung; `chart.spec.ts` không đặt viewport; `layout.spec.ts`/`Select.spec.ts` chỉ 1280/1024/375 | Tuỳ Owner (D-M6-06): spec đo tràn ngang/reduced-motion/heading; **không** thêm project mobile (KG-M10-03) nếu chưa quyết |
| Đo layout thật | F4 dùng Chrome DevTools Device Mode thủ công (Q6) | Giữ cách F4 cho đo chính; bảng đo ghi số thật |
| Reduced motion | Test chỉ kiểm **class**; F4 Q8 bằng DevTools Rendering | Test class cho `InterpretationItem`; thủ công bằng DevTools; (tuỳ chọn) `page.emulateMedia({reducedMotion})` |
| Trình đọc màn hình | Windows 11 Narrator trên Chrome (F4 Q7) | Tái dùng; **không** thêm công cụ |
| CI | `frontend-ci.yml`: format, lint, typecheck, `test:coverage`, build, rồi Backend + Playwright | Không đổi |

### 2.8 Tài liệu, phát hành
`CHANGELOG.md` mới nhất `[0.3.0] – 2026-10-28` (F4); `package.json` = `0.3.0`. Chính sách: D-F5-08 (version `0.4.0`) **Conditional**, chỉ ở M8 khi Owner xác nhận (F5 plan dòng 342, 432). **[REC]** M6 không bump version, không sửa CHANGELOG.

### 2.9 Known Gaps mang vào M6
| ID | Nội dung | Nhãn hiện tại trong repo | Tác động tới M6 |
|---|---|---|---|
| KG-F5M4-01 | Narrator/NVDA cho khu vực Diễn giải chưa nghe thật (M-07), "hoãn M6/M7" | `ACCEPTED GAP` (M4 matrix). **Không thấy tham chiếu phê duyệt riêng** [UNK] | **M6.7 là nơi giải quyết**; Narrator khả dụng (D-M10-08 cấm bỏ test khả thi) |
| KG-F5M4-02 | Fallback bảng khi wheel không tương tác (M-08) chưa tái lập trên trình duyệt thật | `UNVERIFIED` | thử ở 320/360px (M6.1) |
| KG-F5M4-03 | SVG focus/scroll ở Safari/Firefox | (kế thừa KG-M10-03) | ma trận trình duyệt (8.7) |
| KG-F5M4-04/05 | Preview halo khi "Xem trên biểu đồ" lúc chưa chọn; focus về `body` nếu mục bị gỡ | ghi nhận | kiểm trong M6.6 |
| KG-F5M3-04 | Thiếu ảnh S-05 @375px | `OPEN`; D-M5-11 hoãn sang M7 | M6.1 đo ở 375px — đề xuất kéo về M6 (D-M6-09) |
| KG-F5M3-02, KG-F5-01…05 | Banner F4, Moon uncertainty, v.v. | `OPEN`/`Deferred` | không thuộc M6 |
| KG-M8-01 | VoiceOver/TalkBack | `ACCEPTED GAP` (F4, D-M10-08 APPROVED) | giữ nguyên, nêu trong ma trận AT |
| KG-M9-01 | Cột wheel sticky chỉ khi cao ≥1000px | `ACCEPTED GAP` | ảnh hưởng quyết định §7.1 |
| KG-M10-03 | E2E chỉ Chromium Desktop | Known Gap — defer | giới hạn tự động hoá |
| FG-10 | `<title>` động, focus sau điều hướng, focus trap drawer | Existing debt | bị lộ khi test SR; **không** tuyên bố đã xử lý |

### 2.10 Giả thuyết cần kiểm chứng (từ đọc mã tĩnh — **chưa phải lỗi đã xác nhận**)
| ID | Quan sát | Có thể ảnh hưởng | Kiểm bằng | Hướng sửa ứng viên (chưa duyệt) |
|---|---|---|---|---|
| H6-01 | 3 điểm ở `InterpretationItem` thiếu `motion-reduce` (2.5) | AC-… motion; nhất quán với F4 | test class + DevTools Rendering | thêm `motion-reduce:transition-none`, `motion-reduce:active:scale-100`; bỏ transition chevron |
| H6-02 | Đích focus của liên kết nhóm: `h3 tabIndex=-1 focus:outline-none` | AC-26 (focus ring thấy được) | M6-J/K manual | `focus-visible:ring-2 ring-focus` (focus-visible chỉ hiện sau thao tác phím) |
| H6-03 | Không có `scroll-margin-top` vs header sticky 64px | che khuất đích (AC-26/M6.5) | M6-J đo vị trí đích | `scroll-mt` đủ ≥64px+đệm trên heading nhóm/nút mục |
| H6-04 | Neo `id="chart-interpretation"` (§7.1) chưa có; không có liên kết vào Diễn giải khi chưa chọn | tìm thấy nội dung (R-12) | M6.1 đo + M6-S | quyết định ở D-M6-02/03 |
| H6-05 | "Xem trên biểu đồ" `h-8` (32px); UI Spec dòng 452: hit-area ≥44×44 mobile | AC-25 mobile | đo trong DevTools | tăng vùng chạm (không đổi chữ) |
| H6-06 | `bodyText` 13px (`text-body-sm`), `dd` không giới hạn bề rộng; container wide 1440 | độ đọc (M6.4) | đo ký tự/dòng | giới hạn bề rộng cục bộ của `dd`; cân nhắc `text-body-md` 14px **cục bộ** |
| H6-07 | Liên kết `← Hồ sơ sinh` dùng `text-subtle` (token `subtle` là màu viền) | tương phản | đo CCA | dùng token chữ phù hợp |
| H6-08 | Nhấp trái thường không đổi hash; nhấp giữa/phím bổ trợ đổi hash → mở tab mới với hash khi nội dung tải bất đồng bộ | nhất quán URL/history | M6-J | ghi nhận; sửa chỉ khi Owner muốn |
| H6-09 | `<title>` tĩnh | M6.7 "tiêu đề trang" | M6-S01 | liên quan FG-10, **không** mở rộng phạm vi |
| H6-10 | 8 `region` (2 lồng) | điều hướng landmark ồn | M6-S | cân nhắc bỏ `section aria-labelledby` ở nhóm con |
| H6-11 | Matrix M4 "cuộn mượt" vs mã không smooth-scroll | motion/ghi chép | M6-RM | đính chính Matrix nếu sai |
| H6-12 | Hai cột cần viewport ≳1300px (ước tính) | AC-25 | M6-R đo | không sửa; ghi chế độ thật vào bảng |

### 2.11 Mâu thuẫn / thiếu sót trong tài liệu
1. Không có định nghĩa/URL môi trường `dev` triển khai (DG-1).
2. F5 plan §1 "Draft — Pending Owner Approval" lỗi thời; không thấy phê duyệt riêng cho P-01…P-06 (DG-2).
3. §7.1 nêu `id="chart-interpretation"` nhưng không có trong mã (DG-3).
4. AC-25 "≥1024" so với ngưỡng thật của F4 là container ≥1010px (DG-4).
5. AC-24 ghi "(test)" nhưng không nêu chuẩn đo; AC-27 không nêu mẫu hồ sơ → plan này định nghĩa (DG-5).
6. `KG-F5M4-01` nhãn `ACCEPTED GAP` thiếu tham chiếu phê duyệt riêng (DG-6).
7. Matrix M4 "cuộn mượt" chưa khớp mã (DG-7).

---

## 3. Requirements and AC Traceability (8.3)

**Nguồn có thẩm quyền:** `docs/implementation/Sprint_F5_Implementation_Plan.md`, bảng AC dòng 502–505 (nguyên văn). Không viết lại yếu hơn.

| AC | Yêu cầu (nguyên văn) | Task M6 | Bằng chứng triển khai | Bằng chứng test tự động | Bằng chứng thủ công | Loại | Trạng thái |
|---|---|---|---|---|---|---|---|
| **AC-24** | Heading không nhảy cấp; vai trò/tên truy cập đúng (test) | M6.2 (+M6.5) | Outline [OBS] không nhảy cấp; tên mục = `aria-label`; sửa mã chỉ khi lệch | A6-H01 (outline liên tục), A6-H02 (tên/role), axe sẵn có | M6-H01…03, M6-S02…05 | Kiểm tự động + thủ công; có thể cần sửa mã (H6-10) | `NOT STARTED` |
| **AC-25** | Không cuộn ngang trang ở 320–375/768/≥1024; khu vực đọc dùng được ở cả ba chế độ F4 | M6.1, M6.4 | Chưa đo; ảnh M3/M4 có 320/375/768/1500 (S-02), thiếu S-05@375 | A6-R01 (tràn ngang, nếu D-M6-06 duyệt); test class | M6-R01…R10, M6-T01…04 | **Bắt buộc đo thật**; có thể cần sửa mã (H6-05/06/12) | `NOT STARTED` |
| **AC-26** | Tab theo thứ tự hợp lý, focus ring nhìn thấy được | M6.2, M6.5, M6.6 | focus ring token [AD]; H6-02/03 chưa kiểm | A6-K01…03 (thứ tự Tab bằng user-event, lớp ring) | M6-K01…K12, M6-J01…05 | Tự động + **thủ công bắt buộc** | `NOT STARTED` |
| **AC-27** | QA thủ công (bàn phím + một trình đọc màn hình) được ghi riêng; phần chưa kiểm là Known Gap | M6.6, M6.7, M6.8 | n/a (tiêu chí quy trình) | không đủ thay thế | Phần B của Matrix M6; M6-S01…S12 | **Chỉ thủ công** | `NOT STARTED` |

Ghi chú: AC-27 chỉ yêu cầu "một trình đọc màn hình"; Windows Narrator đáp ứng. Một mục không kiểm được ⇒ Known Gap, **không** hạ cấp AC. Quét tự động (axe) không thay thế bàn phím/SR.

---

## 4. Quyết định vị trí §7.1 (bắt buộc, tường minh)

### 4.1 Định nghĩa [VF]
F5 plan §7.1 "Vị trí": một `<section id="chart-interpretation">` **toàn chiều rộng, sau lưới hai cột của F4**, không chen vào cột wheel/bảng, không đổi container query/sticky/`Container size="wide"` của F4; lý do: giữ quyết định M9 (D-M9-04/05/06), `bodyText` ≤426 ký tự. Nếu M6 cho thấy người dùng phải cuộn quá xa, "đặt trong cột phải trước các bảng" là thay đổi **có đo đạc, không phải mặc định**. Mặc định P-01 (a) "toàn chiều rộng sau lưới"; R-12 giao M6 đo.

### 4.2 Hiện trạng [VF/OBS]
Panel nằm sau khối lưới F4, toàn chiều rộng. Không có neo `chart-interpretation`. Lối vào từ phần trên của trang: chỉ nút "Đọc diễn giải" khi **đã chọn** hành tinh; không có skip link/liên kết cố định tới Diễn giải. KG-M9-01: cột wheel (chứa SelectionDetail) chỉ sticky khi cao ≥1000px nên trên màn thường (900–960px) nút "Đọc diễn giải" cuộn khỏi tầm nhìn. **Số đo thực: chưa có.**

### 4.3 Số đo cần thu trước khi quyết (M6.1, trên máy QA của Owner)
Ở 375, 768, 1024, 1280, 1500 (và viewport thực sự bật hai cột): (a) khoảng cuộn từ đỉnh trang tới đầu Panel (px và số "chiều cao viewport"); (b) số điểm dừng Tab từ đầu trang tới nút đầu tiên của Panel; (c) có thấy tiêu đề "Diễn giải" mà không cuộn không; (d) với/không có chọn, số thao tác tới Panel; (e) ở chế độ hai cột: Panel nằm dưới cột nào dài hơn và chiều cao khoảng trống bên cạnh.

### 4.4 Quy tắc quyết định (ngưỡng **[REC] đề xuất, cần Owner xác nhận**)
- **Giữ nguyên (mặc định)** nếu: khoảng cuộn tới Panel ≤ 3 chiều cao viewport **và** ≤ 40 điểm dừng Tab ở mọi viewport trong ma trận **hoặc** có lối vào rõ ràng không đổi layout.
- **Giữ vị trí + thêm lối vào** (không đổi layout) nếu ngưỡng vượt nhưng lối vào còn thiếu: một liên kết/skip link tới Diễn giải ở Shell. Cần neo `id`, copy mới (cần duyệt copy), test; đây là điều hướng bổ sung duy nhất, chỉ thêm nếu số đo cho thấy cần (tránh điều hướng thừa).
- **Đổi vị trí** chỉ khi bằng chứng cho thấy lối vào không đủ. Phương án: (b) cột phải trước các bảng (ảnh hưởng layout hai cột đã đo ở M9), hoặc (c) chỉ thay thứ tự đọc trên mobile. Linh kiện chịu ảnh hưởng: `ChartViewerShell.tsx` (vị trí render), test Shell/Page, `evidence` M9; **không** đụng `selection.ts`.
- Nếu không thu đủ số đo hoặc Owner không chọn ngưỡng ⇒ **Owner Decision treo** (D-M6-02), không tự quyết.

### 4.5 Trạng thái
**PENDING OWNER DECISION (D-M6-02)** — chặn việc *đóng* M6.1, không chặn bắt đầu M6. Khuyến nghị tạm thời **[REC]: giữ nguyên** cho tới khi có số đo.

---

## 5. M6 Work Breakdown Structure (8.4)

ID theo quy ước F5 (`M{n}.{k}`, như M5.0…M5.7): **M6.0** cổng vào, **M6.1–M6.8** là tám workstream của prompt, **M6.9** đóng milestone. Độ phức tạp: S nhỏ / M vừa / L lớn.

### M6.0 — Cổng vào & làm rõ yêu cầu (S)
- **Mục tiêu:** chốt nền nhánh, môi trường QA, ngưỡng, và nhãn `dev`.
- **Hoạt động:** xác nhận trạng thái PR M5→`main` và nhánh nền M6 (C-1); Owner trả lời D-M6-01…05; chạy lại baseline trên commit nền (format, lint, typecheck, vitest chart+pages, build); ghi commit hash + phiên bản trình duyệt/AT sẽ dùng.
- **File:** không sửa mã. **Phụ thuộc:** không. **AC:** tiền đề cho AC-24…27.
- **Đầu ra:** bảng quyết định đã điền trạng thái; baseline log. **Chấp nhận:** D-M6-01, D-M6-03, D-M6-04 có trả lời; baseline xanh. **Bằng chứng:** log lệnh, commit hash.

### M6.1 — Đo & kiểm layout responsive; quyết định §7.1 (L)
- **Mục tiêu:** đo thật theo ma trận 8.7 và ra quyết định §7.1 có số đo.
- **Hoạt động:** (1) chạy `npm run dev` + Backend cục bộ có seed (`npm run prisma:seed:content`, như CI) và ghi môi trường; (2) với mỗi viewport: ghi `innerWidth×innerHeight`, `documentElement.scrollWidth` vs `clientWidth`, bề rộng container Shell, chế độ F4 thực tế (card/một cột/hai cột); (3) kiểm tràn ngang, cắt chữ, xuống dòng bất thường, chồng lấn, wheel, khu vực đọc, tính điều hướng wheel→Diễn giải, bảng/thẻ, sticky/fixed, drawer ở hẹp; (4) kiểm thứ tự đọc mobile; (5) thu số đo 4.3 → quyết định §7.1; (6) thử KG-F5M4-02 ở 320/360px; (7) chụp ảnh S-05@375px nếu D-M6-09 duyệt.
- **File:** không sửa trước khi có đo; nếu cần: `ChartViewerShell.tsx` (vị trí), `InterpretationItem.tsx`/`InterpretationPanel.tsx` (bề rộng, vùng chạm). **Phụ thuộc:** M6.0. **AC:** AC-25 (+ §7.1/R-12).
- **Đầu ra:** bảng số đo thật; quyết định §7.1 ghi vào Matrix. **Chấp nhận:** 0 cuộn ngang trang ở 320/360/375/768/1024 (và các viewport trong ma trận), hoặc lỗi được ghi P0/P1 và sửa/Known Gap theo chính sách; D-M6-02 có kết luận. **Bằng chứng:** ảnh `m6_R*`, bảng số đo (Phần B), A6-R01 nếu duyệt.

### M6.2 — Cấu trúc heading ngữ nghĩa (S–M)
- **Mục tiêu:** xác nhận outline liên tục và tên truy cập đúng; chỉ sửa khi có lệch.
- **Hoạt động:** đối chiếu outline 2.4 trên trình duyệt thật bằng Chrome Accessibility Tree cho S-02, S-05 và S-03; kiểm tên của `h3` nhóm, `h4`/nút mục (có chứa badge "Đang chọn"), `region`; quyết H6-10 (landmark lồng); viết A6-H01/H02.
- **File:** `InterpretationPanel.tsx` (nếu bỏ `section aria-labelledby` ở nhóm), test `InterpretationPanel.test.tsx`/`ChartViewerShell.test.tsx`. **Không** thêm heading chỉ để thoả kiểm tra máy. **Phụ thuộc:** M6.1 baseline. **AC:** AC-24.
- **Đầu ra:** test outline; Matrix ghi nhận kết quả. **Chấp nhận:** không nhảy cấp ở cả ba trạng thái; tên/role đúng; quyết định H6-10 có lý do. **Bằng chứng:** A6-H01/02, M6-H01…03.

### M6.3 — Giảm chuyển động (S)
- **Mục tiêu:** `prefers-reduced-motion: reduce` được tôn trọng ở vùng nội dung route chart.
- **Hoạt động:** xác nhận H6-01 bằng DevTools Rendering (so computed `transition-duration` giữa chuyển động bình thường và reduce); sửa 3 điểm ở `InterpretationItem.tsx` nếu xác nhận (giữ nguyên thông tin/trạng thái: chevron vẫn đổi hướng ngay lập tức, "Đang chọn" vẫn hiện); kiểm hành vi cuộn do `focus()` ở hai chế độ (H6-11); không thêm thư viện/cấu hình.
- **File:** `InterpretationItem.tsx`; test `InterpretationItem.test.tsx` (class, theo RM1/RM2). **Phụ thuộc:** M6.1. **AC:** thuộc a11y hardening (không có AC riêng — ghi rõ trong Matrix; liên hệ F4 Q8).
- **Đầu ra:** audit ghi nhận + sửa tối thiểu. **Chấp nhận:** không còn transition/scale không thiết yếu trong vùng Diễn giải khi `reduce`; vẫn có phản hồi tương tác; baseline chuyển động bình thường không mất. **Bằng chứng:** A6-RM01, M6-RM01…03.

### M6.4 — Độ đọc & khoảng cách (M)
- **Mục tiêu:** đo bằng tiêu chí định lượng (D-M6-04), tránh thay typography toàn cục.
- **Hoạt động:** đo ký tự/dòng, font-size, line-height, khoảng cách PartRow/nhóm, vùng chạm, tràn từ dài, tương phản (H6-05/06/07); nếu vượt ngưỡng, sửa **cục bộ** (`dd`/`PartRow`, nút) bằng token sẵn có.
- **File:** `InterpretationItem.tsx` (và `page.tsx` nếu sửa liên kết quay lại — chỉ khi Owner cho phép vì thuộc F4). **Phụ thuộc:** M6.1. **AC:** AC-25 (khu vực đọc dùng được).
- **Đầu ra:** bảng đo + sửa tối thiểu; **Chấp nhận:** các ngưỡng đã duyệt đạt hoặc ngoại lệ được ghi Known Gap; F4 Viewer không hồi quy (test F4 + ảnh đối chiếu). **Bằng chứng:** M6-T01…06, A6-T01 (nếu thêm lớp/ràng buộc).

### M6.5 — Điều hướng trong trang & liên kết nhảy (M)
- **Mục tiêu:** đích đúng, không bị che, focus có chủ đích, tên liên kết nêu đích, nhất quán URL/history.
- **Hoạt động:** kiểm 2.6 trên trình duyệt thật (chuột, bàn phím, SR); xác nhận/sửa H6-02/03/08; nếu §7.1 yêu cầu lối vào mới thì thêm **đúng một** liên kết/neo (copy cần duyệt).
- **File:** `InterpretationPanel.tsx`, `InterpretationOverview.tsx`, (có điều kiện) `ChartViewerShell.tsx`, `interpretationCopy.ts`; test tương ứng. **Phụ thuộc:** M6.1, D-M6-02. **AC:** AC-26.
- **Đầu ra/Chấp nhận:** đích nằm trong vùng nhìn thấy dưới header (đề xuất: mép trên đích ≥ 64px + 8px); focus ring thấy được sau kích hoạt bằng phím; hành vi hash được ghi. **Bằng chứng:** M6-J01…07, A6-J01/02.

### M6.A — QA tự động (S–M)
- Chạy cổng hiện có + các test mới/mở rộng (10.1). Kết quả ghi ở **Phần A** của Matrix, tách riêng Phần B.

### M6.6 — QA bàn phím thủ công (M)
- Thực hiện M6-K01…K13 (Mục 10.2) trên **bản build sau sửa**; bắt buộc; không ghi PASS dựa trên test tự động. **AC:** AC-26, AC-27.

### M6.7 — QA trình đọc màn hình thủ công (L)
- Thực hiện M6-S01…S12: **Windows 11 Narrator trên Chrome** (như F4 Q7). Ghi phiên bản OS/Chrome/Narrator. Công cụ khác (NVDA/JAWS, Firefox/Safari, VoiceOver/TalkBack) chỉ ghi kết quả nếu thực sự khả dụng; nếu không → Known Gap (không tuyên bố đã kiểm). Giải quyết/cập nhật **KG-F5M4-01**. **AC:** AC-24, AC-27.

### M6.8 — Known Gaps & quản lý bằng chứng (M)
- Áp dụng cấu trúc 11; đối chiếu 2.9; mọi `ACCEPTED GAP` cần phê duyệt riêng của Owner (tham chiếu thật). **AC:** AC-27.

### M6.9 — Hồi quy cuối & đóng milestone (M)
- Chạy lại toàn bộ cổng (format, lint, typecheck, toàn bộ Vitest, build, `playwright --list` kỳ vọng 38/7 hoặc số đã đổi có lý do); diff rỗng với `selection.ts`/`interpretation.ts`; hồi quy M3/M4/M5 (test + vài ảnh đối chiếu); cập nhật tài liệu; ghi trạng thái milestone **đúng theo bằng chứng** (không "COMPLETED" nếu còn AC chưa chứng minh). **Chấp nhận:** Mục 14.

---

## 6. Recommended Execution Sequence (8.5)

1. **M6.0** — kiểm tiền đề, nhánh nền, trả lời D-M6-01/03/04/05/06/07/09.
2. **M6.1 (đo trước khi sửa)** — thu *baseline "trước"*, thu số đo §7.1.
3. **Owner chốt D-M6-02** (§7.1) và duyệt danh sách sửa (D-M6-11).
4. Triển khai sửa nhỏ, song song được: **M6.2** (heading) · **M6.3** (motion) · **M6.4** (độ đọc) · **M6.5** (liên kết nhảy). Mỗi sửa kèm test tự động ngắn.
5. **M6.A** QA tự động (đóng băng mã).
6. **M6.1 đo lại** những chỗ đã đổi (số "sau") + **M6.6** bàn phím.
7. **M6.7** trình đọc màn hình (chạy sau cùng trên bản build ổn định vì tốn công nhất).
8. **M6.8** đối chiếu Known Gap + bằng chứng.
9. **M6.9** hồi quy cuối, cập nhật tài liệu, đóng.
Nếu không có phát hiện cần sửa ở bước 2, bước 4 chỉ là "ghi kết quả audit", và M6 vẫn phải hoàn thành QA thủ công.

---

## 7. File-level Implementation Plan (8.6)

**Tái dùng (không thay):** `InterpretationPanel/Overview/Item`, `SelectionDetail`, `ChartViewerShell`, `Alert`, token `ring-focus`, mẫu test RM1/RM2, `vitest-axe`, mẫu Matrix F5.

| File | Trạng thái | Thay đổi dự kiến | Vì sao / điều kiện |
|---|---|---|---|
| `…/InterpretationPanel/InterpretationItem.tsx` | tồn tại | `motion-reduce` (H6-01); vùng chạm nút "Xem trên biểu đồ" (H6-05); giới hạn bề rộng `dd`/cỡ chữ cục bộ (H6-06) | **chỉ khi** đo/DevTools xác nhận |
| `…/InterpretationPanel/InterpretationPanel.tsx` | tồn tại | vòng focus + `scroll-margin` cho heading nhóm (H6-02/03); có thể bỏ `section aria-labelledby` nhóm con (H6-10); (nếu D-M6-02) neo `id` | theo bằng chứng + quyết định |
| `…/InterpretationPanel/InterpretationOverview.tsx` | tồn tại | chỉ nếu H6-08 được yêu cầu sửa | Owner quyết |
| `…/ChartViewerShell/ChartViewerShell.tsx` | tồn tại | chỉ nếu §7.1 đổi vị trí hoặc thêm lối vào | D-M6-02 |
| `…/InterpretationPanel/interpretationCopy.ts` | tồn tại | chuỗi mới cho lối vào (nếu có) | cần Owner duyệt copy (D-M6-12) |
| `pages/app/charts/detail/page.tsx` | tồn tại | liên kết quay lại (H6-07) — **thuộc F4**, chỉ khi D-M6-11 cho phép | tương phản |
| `…/InterpretationPanel/InterpretationItem.test.tsx`, `InterpretationPanel.test.tsx`, `ChartViewerShell.test.tsx`, purity test | tồn tại | mở rộng A6-H/RM/K/J (10.1) | khoá hành vi, **không** sửa kỳ vọng M3–M5 |
| `docs/implementation/archive/sprint-f5/Sprint_F5_M6_Exit_Criteria_Evidence_Matrix.md` | **mới** | Matrix Phần A/B, Known Gaps | theo quy ước M1–M5 |
| `docs/implementation/archive/sprint-f5/evidence/m6_*` | **mới (ảnh/ghi chú)** | bằng chứng thủ công | thư mục đã tồn tại [VF]; chỉ liệt kê đường dẫn khi file đã có |
| `frontend/e2e/interpretation-responsive.spec.ts` (tên đề xuất) | **mới, tuỳ chọn** | đo tràn ngang, `reducedMotion`, outline bằng Playwright | **chỉ khi D-M6-06 duyệt**; không trùng phạm vi `e2e/interpretation.spec.ts` của M7 |
| `docs/implementation/Sprint_F5_Implementation_Plan.md` | tồn tại | trạng thái M6, bảng KG, đính chính metadata Draft | docs |
| **Không đổi:** `selection.ts`, `interpretation.ts`, `playwright.config.ts` (không thêm project), `package.json`/lockfile, Backend, API, tokens toàn cục | | | ràng buộc kiến trúc |

---

## 8. Responsive Test Matrix (8.7)

Môi trường: **Dev-cục-bộ** = `http://localhost:5173/app/charts/:chartId` (Vite) + Backend cục bộ có seed — *theo D-M6-01*. Trình duyệt chính: **Chrome (phiên bản ghi lại khi chạy) trên Windows 11** (cấu hình QA F4/M4 [VF]); Edge cùng engine nếu dùng. Firefox/Safari: chỉ nếu khả dụng, nếu không → KG-F5M4-03. Mục "Chế độ F4 thực tế" phải **ghi từ phép đo**, không điền sẵn.

| # | Loại | Viewport (W×H) | Tính năng cần kiểm | Hành vi mong đợi | Bằng chứng |
|---|---|---|---|---|---|
| V1 | Mobile nhỏ | 320×640 (reflow AC-25) | tràn ngang, wheel, thẻ mobile, Panel, nút | không cuộn ngang trang; wheel chỉ cuộn trong khung của nó; không cắt/chồng | ảnh + số đo |
| V2 | Mobile | 360×740 | như V1; KG-F5M4-02 | như V1 | ảnh + số đo |
| V3 | Mobile | 375×667 | như V1 + **S-05 không giờ sinh** | như V1; chú thích Nhà/Cung Mọc đọc được | ảnh + số đo (KG-F5M3-04) |
| V4 | Mobile lớn | 428×926 (PRD 360–428) | như V1 | như V1 | ảnh |
| V5 | Tablet | 768×1024 | một cột; Panel; bảng | không cuộn ngang; thứ tự đọc | ảnh + số đo |
| V6 | Laptop nhỏ | 1023×768 và **1024×768** | sidebar xuất hiện ở `lg`; container hẹp lại | không cuộn ngang; ghi chế độ F4 thật | ảnh + số đo |
| V7 | Desktop | 1280×720 | một hay hai cột (đo) | như đo | ảnh + số đo |
| V8 | Desktop rộng | viewport thực tế **bật hai cột** (đo) và 1500×900 | hai cột, khoảng trống bên cạnh Panel, sticky | không chồng lấn; Panel không bị cột sticky che | ảnh + số đo |
| V9 | Cao | ≥1000px cao | cột wheel sticky (KG-M9-01) | như F4 | ảnh |
| V10 | Zoom | 1280 ở 200% và 400% | reflow tương đương 320 CSS px | không mất nội dung/chức năng | ảnh |
| V11 | Cảm ứng | thiết bị cảm ứng (Dell touchscreen nếu dùng) | vùng chạm nút | chạm được, không nhầm | ghi chú |

Số đo mỗi dòng: `innerWidth×innerHeight`, `scrollWidth/clientWidth`, bề rộng container Shell, chế độ F4, vị trí đầu Panel (px), chữ-trên-dòng (M6.4).

---

## 9. Accessibility Test Matrix (8.8)

| Lĩnh vực | Kiểm gì | Tự động (hiện có/đề xuất) | Thủ công |
|---|---|---|---|
| Cấu trúc | outline h1–h4, tên vùng/region, tên liên kết/nút | axe sẵn có; **A6-H01/H02 đề xuất** | M6-H01…03; M6-S02/03 |
| Bàn phím | thứ tự Tab, Enter/Space, Escape, không bẫy | A6-K01/K02 đề xuất (user-event); test Escape M4 sẵn có | M6-K01…K13 |
| Trình đọc màn hình | tên/trạng thái, đọc nội dung, live region | **không thay thế được** | M6-S01…S12 |
| Quản lý focus | sau liên kết nhảy, "Đọc diễn giải", "Xem trên biểu đồ", Escape | test M4 sẵn có (focus) | M6-J03…05, M6-K08…10 |
| Giảm chuyển động | transition/animation/scale; cuộn | A6-RM01 (class) | M6-RM01…03 (DevTools Rendering) |
| Độ đọc | ký tự/dòng, cỡ chữ, line-height, khoảng cách, vùng chạm, tương phản | (tuỳ chọn) A6-T01 | M6-T01…06 (DevTools, CCA) |
| Điều hướng | đích, không bị che, hash/history | A6-J01/J02 | M6-J01…07 |
| Thông báo động | loading/error/empty/unpublished/unavailable | test `role=status/alert` sẵn có | M6-S11/S12 |

Giới hạn: quét axe/lint **không** chứng minh tuân thủ WCAG và **không** thay bàn phím/SR.

---

## 10. QA Evidence Strategy (7)

### 10.1 Phần A — Bằng chứng tự động (tất cả [PLAN] — **chưa chạy**)

| ID | Lệnh / workflow | Phạm vi | Kỳ vọng | Kết quả thực tế | Artifact | AC |
|---|---|---|---|---|---|---|
| A6-G01 | `npm run format:check` | frontend | pass | **NOT RUN** (đã pass ở baseline `1978ac4`, không tính cho M6) | log CI/cục bộ | — |
| A6-G02 | `npm run lint` | frontend (gồm `jsx-a11y`) | 0 lỗi | NOT RUN | log | AC-24/26 |
| A6-G03 | `npm run typecheck` | frontend | 0 lỗi | NOT RUN | log | — |
| A6-G04 | `npm test` / `npm run test:coverage` | toàn bộ Vitest | 0 fail (ghi số file/test thật; lưu ý flake `router.test.tsx` đã ghi ở Matrix M5) | NOT RUN | log + coverage file đổi | — |
| A6-G05 | `npm run build` | frontend | thành công | NOT RUN | log | — |
| A6-G06 | `CI=1 npx playwright test --list` | E2E | 38/7 (hoặc đổi có lý do) | NOT RUN | log | — |
| A6-G07 | Frontend CI workflow trên commit M6 | CI | Success | NOT RUN | run URL | — |
| A6-H01 | test mới (Shell+Panel) | outline h1–h4 liên tục ở S-02/S-05/S-03 | không nhảy cấp | NOT RUN | test | AC-24 |
| A6-H02 | test mới/mở rộng + `vitest-axe` | role/tên Panel, nhóm, mục | 0 vi phạm | NOT RUN | test | AC-24 |
| A6-RM01 | mở rộng `InterpretationItem.test.tsx` | lớp `motion-reduce` | có ở 3 điểm (nếu H6-01 xác nhận) | NOT RUN | test | — |
| A6-K01 | user-event | thứ tự Tab Overview→nhóm→mục→nút | đúng thứ tự DOM | NOT RUN | test | AC-26 |
| A6-K02 | user-event | Enter/Space mở/đóng, `aria-expanded` | đúng | NOT RUN | test | AC-26 |
| A6-J01/J02 | mở rộng Overview/Panel test | nhấp trái → focus heading; nhấp có phím bổ trợ không bị chặn | đúng | NOT RUN | test | AC-26 |
| A6-R01 | Playwright (nếu D-M6-06) | tràn ngang ở viewport ma trận | `scrollWidth ≤ clientWidth` | NOT RUN | report | AC-25 |

*Mỗi test mới phải được chứng minh "đỏ khi hành vi bị phá" (phá tạm rồi hoàn tác) và có coverage thật cho file đổi.*

### 10.2 Phần B — Bằng chứng thủ công (bảng QA riêng; **mọi hàng NOT TESTED**)

Quy ước cột "Môi trường": **Dev-cục-bộ** = `http://localhost:5173/app/charts/:id` + Backend cục bộ (D-M6-01; commit/trình duyệt/AT ghi khi chạy). "Actual" luôn `—` cho đến khi có kết quả thật. "Evidence" là `(chưa có)` — đường dẫn chỉ ghi sau khi file tồn tại trong repo. Các hàng có "Pre:" = điều kiện tiên quyết.

**Responsive & §7.1**
| Test ID | Môi trường | Viewport/OS/Browser/AT | Tính năng | Bước | Kỳ vọng | Actual | Status | Evidence | AC |
|---|---|---|---|---|---|---|---|---|---|
| M6-R01 | Dev-cục-bộ | 320×640 · Win11 · Chrome | Tràn ngang & khu vực đọc | Pre: lá số đủ nội dung. Mở viewer; đọc `scrollWidth/clientWidth`; cuộn tới Panel; mở 2 mục | Không cuộn ngang trang; Panel đọc được | — | NOT TESTED | (chưa có) | AC-25 |
| M6-R02 | Dev-cục-bộ | 360×740 & 375×667 | như R01 | như R01 | như R01 | — | NOT TESTED | (chưa có) | AC-25 |
| M6-R03 | Dev-cục-bộ | 375×667 | S-05 không giờ sinh | Pre: lá số không giờ sinh. Mở Panel | Chú thích Nhà + Cung Mọc đọc được; không tràn | — | NOT TESTED | (chưa có) | AC-25 |
| M6-R04 | Dev-cục-bộ | 428×926 | như R01 | như R01 | như R01 | — | NOT TESTED | (chưa có) | AC-25 |
| M6-R05 | Dev-cục-bộ | 768×1024 | Tablet một cột | đo + cuộn | không tràn; thứ tự đọc | — | NOT TESTED | (chưa có) | AC-25 |
| M6-R06 | Dev-cục-bộ | 1023×768 và 1024×768 | ngưỡng `lg` + sidebar | đo container & chế độ | không tràn; ghi chế độ F4 thật | — | NOT TESTED | (chưa có) | AC-25 |
| M6-R07 | Dev-cục-bộ | 1280×720 | desktop | đo | không tràn; ghi 1/2 cột | — | NOT TESTED | (chưa có) | AC-25 |
| M6-R08 | Dev-cục-bộ | viewport bật hai cột & 1500×900 | hai cột/sticky | đo, cuộn | Panel không bị che | — | NOT TESTED | (chưa có) | AC-25 |
| M6-R09 | Dev-cục-bộ | 1280, zoom 200% & 400% | reflow | đổi zoom | không mất nội dung | — | NOT TESTED | (chưa có) | AC-25 |
| M6-R10 | Dev-cục-bộ | 375×667 | thứ tự đọc mobile | so thứ tự DOM với thứ tự thấy | hợp lý | — | NOT TESTED | (chưa có) | AC-25 |
| M6-R11 | Dev-cục-bộ | 375 & 1280 | sticky header vs nội dung | cuộn; nhìn chồng lấn | không che nội dung | — | NOT TESTED | (chưa có) | AC-25 |
| M6-R12 | Dev-cục-bộ | 320×640 | nhãn tiếng Việt dài | xem h4 "Sao Thiên Vương · …", nút | không cắt/chồng | — | NOT TESTED | (chưa có) | AC-25 |
| M6-P01 | Dev-cục-bộ | 375/768/1024/1500 | §7.1 khoảng cuộn | đo px từ đỉnh tới đầu Panel | số đo ghi lại | — | NOT TESTED | (chưa có) | AC-25, §7.1 |
| M6-P02 | Dev-cục-bộ | 1280 | §7.1 số Tab | đếm Tab tới nút đầu Panel | số ghi lại | — | NOT TESTED | (chưa có) | AC-26, §7.1 |
| M6-P03 | Dev-cục-bộ | 375 & 1280 | §7.1 khả năng tìm thấy | có/không chọn hành tinh | ghi lối vào có sẵn | — | NOT TESTED | (chưa có) | §7.1 |

**Heading, chuyển động, độ đọc**
| Test ID | Môi trường | Viewport/OS/Browser/AT | Tính năng | Bước | Kỳ vọng | Actual | Status | Evidence | AC |
|---|---|---|---|---|---|---|---|---|---|
| M6-H01 | Dev-cục-bộ | Win11 · Chrome Accessibility Tree | Outline S-02/S-05/S-03 | mở cây trợ năng, ghi các heading | không nhảy cấp | — | NOT TESTED | (chưa có) | AC-24 |
| M6-H02 | Dev-cục-bộ | Win11 · Chrome · Narrator | điều hướng theo heading | duyệt heading | thứ tự/nội dung hợp lý độc lập | — | NOT TESTED | (chưa có) | AC-24 |
| M6-H03 | Dev-cục-bộ | Win11 · Chrome | tên nhóm/mục | đọc tên accessible | mô tả đúng | — | NOT TESTED | (chưa có) | AC-24 |
| M6-RM01 | Dev-cục-bộ | Win11 · Chrome DevTools Rendering: reduce | motion mục diễn giải | mở/đóng, chọn hành tinh, bấm "Xem trên biểu đồ"; đọc computed transition | không transition/scale; vẫn phản hồi | — | NOT TESTED | (chưa có) | (a11y) |
| M6-RM02 | Dev-cục-bộ | Chrome: no-preference | đường cơ sở | như RM01 | chuyển động bình thường còn nguyên | — | NOT TESTED | (chưa có) | (a11y) |
| M6-RM03 | Dev-cục-bộ | Chrome: reduce & no-preference | cuộn do focus | bấm "Đọc diễn giải", link nhóm | ghi cuộn tức thời hay mượt | — | NOT TESTED | (chưa có) | (a11y) |
| M6-T01 | Dev-cục-bộ | 375/768/1024/1500 | ký tự/dòng | đếm ký tự dòng đầu bodyText | trong ngưỡng đã duyệt | — | NOT TESTED | (chưa có) | AC-25 |
| M6-T02 | Dev-cục-bộ | Chrome DevTools | cỡ chữ, line-height | đọc computed | line-height ≥ 1.5 | — | NOT TESTED | (chưa có) | AC-25 |
| M6-T03 | Dev-cục-bộ | 375 & 1280 | khoảng cách đoạn/nhóm/heading | đo computed | theo ngưỡng đã duyệt | — | NOT TESTED | (chưa có) | AC-25 |
| M6-T04 | Dev-cục-bộ | 375 | vùng chạm nút/disclosure | đo chiều cao/rộng | theo ngưỡng đã duyệt (≥44 theo UI Spec) | — | NOT TESTED | (chưa có) | AC-25 |
| M6-T05 | Dev-cục-bộ | 320, zoom 200% | từ dài/tràn | quan sát | không cắt | — | NOT TESTED | (chưa có) | AC-25 |
| M6-T06 | Dev-cục-bộ | Colour Contrast Analyser | tương phản liên kết quay lại, focus ring | đo hai theme | ≥4.5:1 chữ; theo UI Spec | — | NOT TESTED | (chưa có) | AC-26 |

**Liên kết nhảy**
| Test ID | Môi trường | Viewport/OS/Browser/AT | Tính năng | Bước | Kỳ vọng | Actual | Status | Evidence | AC |
|---|---|---|---|---|---|---|---|---|---|
| M6-J01 | Dev-cục-bộ | 1280 · Chrome | Overview → nhóm (chuột) | nhấp "Các hành tinh (8)"; đo mép trên heading | đích đúng; không bị header 64px che | — | NOT TESTED | (chưa có) | AC-26 |
| M6-J02 | Dev-cục-bộ | 1280 · Chrome | Overview → nhóm (bàn phím) | Tab tới link, Enter | như J01; focus có chủ đích | — | NOT TESTED | (chưa có) | AC-26 |
| M6-J03 | Dev-cục-bộ | 1280 · Chrome | focus sau nhảy | quan sát vòng focus ở heading | thấy rõ sau thao tác phím | — | NOT TESTED | (chưa có) | AC-26 |
| M6-J04 | Dev-cục-bộ | 1280 & 375 | "Đọc diễn giải" | chọn hành tinh → Tab → Enter | nút mục thấy, có ring, không bị che | — | NOT TESTED | (chưa có) | AC-26 |
| M6-J05 | Dev-cục-bộ | 1280 & 375 | "Xem trên biểu đồ" | Enter | focus tại phần tử wheel/hành tinh, thấy được | — | NOT TESTED | (chưa có) | AC-26 |
| M6-J06 | Dev-cục-bộ | 1280 · Chrome | URL/history | nhấp link rồi Back; mở link ở tab mới | hành vi ghi lại, nhất quán | — | NOT TESTED | (chưa có) | AC-26 |
| M6-J07 | Dev-cục-bộ | 375×667 | mobile | như J01/J04 | dùng được | — | NOT TESTED | (chưa có) | AC-25/26 |

**Bàn phím (M6.6)**
| Test ID | Môi trường | Viewport/OS/Browser/AT | Tính năng | Bước | Kỳ vọng | Actual | Status | Evidence | AC |
|---|---|---|---|---|---|---|---|---|---|
| M6-K01 | Dev-cục-bộ | 1280 · Chrome | Thứ tự Tab toàn trang | Pre: lá số đủ; Tab từ đầu | thứ tự logic (header → skip link → hồ sơ → wheel → bảng → Panel) | — | NOT TESTED | (chưa có) | AC-26 |
| M6-K02 | Dev-cục-bộ | 1280 | Shift+Tab ngược | Shift+Tab từ cuối | ngược lại, không nhảy lạ | — | NOT TESTED | (chưa có) | AC-26 |
| M6-K03 | Dev-cục-bộ | Light & Dark | Focus ring | mỗi điểm dừng | thấy rõ | — | NOT TESTED | (chưa có) | AC-26 |
| M6-K04 | Dev-cục-bộ | 1280 | Mở/đóng mục | Enter và Space; mở nhiều mục | `aria-expanded` đúng | — | NOT TESTED | (chưa có) | AC-26 |
| M6-K05 | Dev-cục-bộ | 1280 | Link Overview | Enter | như J02 | — | NOT TESTED | (chưa có) | AC-26 |
| M6-K06 | Dev-cục-bộ | 1280 | Chọn trên wheel | Tab tới hành tinh, Enter/Space | mục nổi bật, **không** cướp focus | — | NOT TESTED | (chưa có) | AC-26, AC-16 |
| M6-K07 | Dev-cục-bộ | 1280 | Chọn trên bảng | Enter | tương đương K06 | — | NOT TESTED | (chưa có) | AC-26 |
| M6-K08 | Dev-cục-bộ | 1280 | "Đọc diễn giải" | Enter | focus tới nút mục | — | NOT TESTED | (chưa có) | AC-26, AC-15 |
| M6-K09 | Dev-cục-bộ | 1280 | "Xem trên biểu đồ" | Enter | focus về hành tinh; selection không đổi | — | NOT TESTED | (chưa có) | AC-26, AC-15 |
| M6-K10 | Dev-cục-bộ | 1280 | Escape | Esc ở nhiều ngữ cảnh | bỏ chọn; focus khôi phục | — | NOT TESTED | (chưa có) | AC-26 |
| M6-K11 | Dev-cục-bộ | 1280 & 375 | Bẫy bàn phím | Tab qua khung wheel cuộn, bảng | luôn thoát được | — | NOT TESTED | (chưa có) | AC-26 |
| M6-K12 | Dev-cục-bộ | 1280 | Trạng thái suy giảm | S-05, S-03, S-08 | thứ tự Tab không đổi/hợp lý | — | NOT TESTED | (chưa có) | AC-26 |
| M6-K13 | Dev-cục-bộ | 1280 | Skip link F4 | Tab đầu, Enter | tới bảng dữ liệu | — | NOT TESTED | (chưa có) | AC-26 |

**Trình đọc màn hình (M6.7)** — cấu hình dự kiến: Windows 11 + Chrome + Narrator (như F4 Q7). **Chưa xác nhận máy QA hiện tại có đủ** → D-M6-05.
| Test ID | Môi trường | Viewport/OS/Browser/AT | Tính năng | Bước | Kỳ vọng | Actual | Status | Evidence | AC |
|---|---|---|---|---|---|---|---|---|---|
| M6-S01 | Dev-cục-bộ | Win11 · Chrome · Narrator | Tiêu đề trang & h1 | vào lá số (và đổi route) | đọc tiêu đề và "Lá số sinh"; ghi hạn chế FG-10 | — | NOT TESTED | (chưa có) | AC-27 |
| M6-S02 | Dev-cục-bộ | như trên | Điều hướng heading | duyệt heading | outline đúng | — | NOT TESTED | (chưa có) | AC-24, AC-27 |
| M6-S03 | Dev-cục-bộ | như trên | Điều hướng landmark | duyệt region/nav | tên có nghĩa, không quá ồn | — | NOT TESTED | (chưa có) | AC-24, AC-27 |
| M6-S04 | Dev-cục-bộ | như trên | Nút mục + trạng thái | tới nút mục | đọc tên + mở/thu gọn | — | NOT TESTED | (chưa có) | AC-27 |
| M6-S05 | Dev-cục-bộ | như trên | Trạng thái "Đang chọn" | chọn từ bảng/wheel | chọn được thông báo (live region) | — | NOT TESTED | (chưa có) | AC-27 |
| M6-S06 | Dev-cục-bộ | như trên | Liên kết Overview | duyệt nav | tên nêu đích | — | NOT TESTED | (chưa có) | AC-27 |
| M6-S07 | Dev-cục-bộ | như trên | Focus sau liên kết nhảy | kích hoạt link | đọc heading nhóm đích | — | NOT TESTED | (chưa có) | AC-27 |
| M6-S08 | Dev-cục-bộ | như trên | "Đọc diễn giải"/"Xem trên biểu đồ" | kích hoạt | tên rõ; focus đọc đúng | — | NOT TESTED | (chưa có) | AC-27 |
| M6-S09 | Dev-cục-bộ | như trên | Nội dung dài | đọc `dt/dd` liên tục | thứ tự đọc hợp lý | — | NOT TESTED | (chưa có) | AC-27 |
| M6-S10 | Dev-cục-bộ | như trên | Wheel & chọn | duyệt wheel | nhãn tóm tắt + `aria-pressed` | — | NOT TESTED | (chưa có) | AC-27 |
| M6-S11 | Dev-cục-bộ | như trên | Loading/lỗi/trống | skeleton, 404, S-03 | thông báo có nghĩa | — | NOT TESTED | (chưa có) | AC-27 |
| M6-S12 | Dev-cục-bộ | như trên | S-05/S-08 | không giờ sinh, unavailable | chú thích/Alert được đọc | — | NOT TESTED | (chưa có) | AC-27 |

### 10.3 Toàn vẹn bằng chứng
- **Lưu trữ:** ảnh/ghi chú vào `docs/implementation/archive/sprint-f5/evidence/` theo mẫu tên hiện có (`m3_*`, `m4_*`): `m6_<TestID>_<viewport>[_light|_dark].png`; ghi chú đo/nghe: `m6_<TestID>_notes.md` ([REC]; thư mục đã chứa cả `.json` fixture [VF]). Ghi âm Narrator: Owner quyết có lưu không (dung lượng).
- **Mỗi hàng Matrix phải có:** task M6, AC, Test ID, môi trường (URL + **commit hash của bản được test** + trình duyệt/OS/AT kèm phiên bản), ngày-giờ, người thực hiện, kết quả (PASS/FAIL/BLOCKED/NOT TESTED), đường dẫn bằng chứng **có thật**.
- **Quy tắc:** không điền Actual, không tạo đường dẫn, không ghi PASS dựa trên test tự động cho hàng thủ công; ảnh "trước" và "sau" được gắn nhãn riêng khi có sửa mã.

---

## 11. Known Gap & Evidence Management (M6.8)

### 11.1 Cấu trúc bản ghi (hợp nhất yêu cầu prompt với "7 điều kiện" của F4 M10 §10.2 [VF])
| Trường | Mô tả |
|---|---|
| Gap ID | `KG-F5M6-nn` (mới) hoặc ID kế thừa |
| Mô tả | điều gì chưa được triển khai/kiểm |
| Thành phần/tính năng | file/component/luồng |
| AC liên quan | AC-24…27 hoặc khác |
| Vì sao chưa kiểm/chưa làm | lý do cụ thể (thiếu thiết bị, chưa tái lập…) |
| Tác động & mức độ | Thấp / Trung bình / Cao; lỗi: P0 chặn dùng · P1 trượt AC · P2 nhẹ |
| Bằng chứng hiện có | đường dẫn thật |
| Bằng chứng còn thiếu | cần gì để đóng |
| Giảm nhẹ/Workaround | nếu có |
| Chủ sở hữu | người chịu trách nhiệm |
| Hành động tiếp theo / tiêu chí đóng | |
| Trạng thái | `OPEN` · `IN PROGRESS` · `BLOCKED` · `PENDING OWNER APPROVAL` · `ACCEPTED GAP` · `RESOLVED` |
| Tham chiếu phê duyệt Owner | tài liệu + ngày + đúng ID gap; **để trống nếu chưa có** |

### 11.2 Quy tắc
- `ACCEPTED GAP` **chỉ** gán sau khi Owner phê duyệt **riêng** gap đó; ghi nhận/khuyến nghị của dev, hay phê duyệt cấp milestone, không đủ; không tự điền người duyệt/ngày/tham chiếu.
- Không hạ AC bắt buộc thành gap một cách im lặng.
- Quy tắc D-M10-08 [AD]: không lấy việc thiếu thiết bị để bỏ qua kiểm tra khả thi trên môi trường hiện có.

### 11.3 Đối chiếu mang vào M6 (đề xuất, chờ Owner — D-M6-08)
| ID | Trạng thái đề xuất cho M6 | Lý do |
|---|---|---|
| KG-F5M4-01 | `IN PROGRESS` (giải quyết bằng M6.7). Nhãn `ACCEPTED GAP` ở Matrix M4 coi là **PENDING OWNER APPROVAL** cho đến khi Owner nêu tham chiếu hoặc duyệt lại | Narrator khả dụng (D-M10-08); hoãn sang M6 |
| KG-F5M4-02 | `OPEN` → thử ở 320/360px trong M6.1 | chưa tái lập |
| KG-F5M4-03 | `OPEN` nếu Firefox/Safari không khả dụng | không thay bằng suy đoán |
| KG-F5M3-04 | `OPEN` → `IN PROGRESS` nếu D-M6-09 duyệt | M6.1 đo 375px |
| KG-M8-01, KG-M9-01, KG-M10-03 | giữ nhãn F4 (đã có phê duyệt trong Matrix F4 M10) | không đổi |
| FG-10 | `OPEN` (nợ Core) | ghi hạn chế khi test SR; không tuyên bố đã xử lý |

*Dự kiến-có-thể-không-khả-dụng (xác nhận với Owner — **chưa biết**):* Firefox/Safari, NVDA/JAWS, VoiceOver/TalkBack. Chỉ tạo `KG-F5M6-nn` khi đã xác định không khả dụng.

---

## 12. Risk and Dependency Register (8.9)

| ID | Rủi ro / phụ thuộc | Khả năng | Tác động | Giảm thiểu | Chủ sở hữu | Chặn? |
|---|---|---|---|---|---|---|
| R6-01 | Không có `dev` triển khai; chỉ chạy cục bộ | Cao | Trung bình | D-M6-01; dùng Vite + Backend cục bộ; ghi commit hash | Owner | Không (có phương án) |
| R6-02 | AC mơ hồ (AC-25 "≥1024" vs ngưỡng 1010px; AC-24 "(test)") | Cao | Trung bình | định nghĩa phép đo ở Mục 3/8; ghi DG-4/5 | Dev + Owner | Không |
| R6-03 | §7.1 chưa có số đo → quyết định treo | Trung bình | Trung bình | M6.1 thu số đo; D-M6-02 | Owner | Chặn *đóng* M6.1 |
| R6-04 | Narrator/máy QA không khả dụng | Thấp–TB | Cao | D-M6-05; ghi `BLOCKED`/Known Gap; không ghi PASS | Owner | Chặn *đóng* M6.7 |
| R6-05 | Tổ hợp OS/trình duyệt thiếu (Safari/Firefox/AT khác) | Cao | Thấp–TB | Known Gap theo 11; ma trận ghi rõ | Owner | Không |
| R6-06 | Thành phần chưa truy cập được bằng bàn phím | Thấp | Cao | M6.6; sửa tối thiểu có test | Dev | Có nếu P0/P1 |
| R6-07 | Sửa responsive làm hồi quy F4 (container query, sticky) | TB | Cao | sửa cục bộ; không đổi ngưỡng F4; chạy test F4 + ảnh đối chiếu | Dev | Có nếu hồi quy |
| R6-08 | Thay đổi a11y ảnh hưởng tương tác wheel/selection | Thấp | Cao | không đụng `selection.ts`; giữ test M4; diff rỗng file lõi | Dev | Có nếu hồi quy |
| R6-09 | Bằng chứng không đủ để nghiệm thu | TB | Cao | quy tắc 10.3; hàng `NOT TESTED` không tính PASS | Dev + Owner | Có |
| R6-10 | Test tự động dương tính giả | TB | TB | "đỏ-trước-xanh" + coverage thật | Dev | Không |
| R6-11 | Flake `router.test.tsx` khi chạy toàn bộ (đã ghi ở M5) | TB | Thấp | ghi lại số đo; chạy đơn lẻ để phân biệt | Dev | Không |
| R6-12 | Phạm vi trôi (làm lại thiết kế/F4) | TB | TB | D-M6-11; mọi sửa dựa trên hàng bằng chứng | Dev | Không |
| D6-01 | Phụ thuộc M5→`main`/nhánh nền (C-1) | — | — | M6.0 chốt | Owner | Chặn bắt đầu code |
| D6-02 | Máy QA Windows 11 + Chrome + Narrator | — | — | xác nhận ở M6.0 | Owner | Chặn M6.7 |

---

## 13. Owner Decisions (8.10) — Bảng Quyết Định Kỹ Thuật Đã Được Phê Duyệt

| ID | Câu hỏi | Phương án | Khuyến nghị | Bằng chứng cần | Trạng thái phê duyệt |
|---|---|---|---|---|---|
| **D-M6-01** | "`dev`" nghĩa là gì? | (a) Vite cục bộ `localhost:5173` + Backend cục bộ (như F4/M3/M4); (b) có URL triển khai (cung cấp) | (a) — repo không có URL triển khai | Owner xác nhận | **ĐÃ DUYỆT (Phương án a)** |
| **D-M6-02** | Vị trí §7.1: giữ / giữ + thêm lối vào / đổi | xem 4.4 | Giữ nguyên vị trí toàn chiều rộng sau lưới F4 (mặc định P-01 (a)) | M6-P01…P03 (34 stops $\le 40$, 2501px ở 2 cột) | **ĐÃ DUYỆT (Giữ nguyên vị trí)** |
| **D-M6-03** | Ngưỡng responsive | (a) viewport 320/360/375/428/768/1023/1024/1280/1500 + zoom 200/400%, rule `scrollWidth ≤ clientWidth`, **không đổi** breakpoint F4; (b) khác | (a) *đề xuất* | E2E V1..V10, 0 tràn ngang | **ĐÃ DUYỆT (Phương án a)** |
| **D-M6-04** | Ngưỡng độ đọc (Cập nhật phê duyệt của Owner) | (1) Cận trên $\le 80$ cpl mọi viewport (ngưỡng cứng); (2) Cận dưới 45 cpl chỉ áp dụng $\ge 768\text{px}$; (3) Desktop nhắm 70–75 cpl, giới hạn bề rộng `<dd>` bằng `max-w-[65ch]`, không đổi typography toàn cục; (4) Nâng chữ nội dung diễn giải lên 14px bằng `text-body-md`; (5) Khoảng trống bên phải là bình thường; (6) Đổi nhãn `<dt>` sang `text-secondary` để đạt contrast $\ge 4.5:1$ (H6-07). | Phương án sửa đổi | E2E `M6-T01..T06`, screenshot evidence | **ĐÃ DUYỆT (Phương án sửa đổi)** |
| **D-M6-05** | Môi trường/công cụ thủ công khả dụng | Windows 11 + Chrome + Narrator; kiểm thử thính giác Narrator không cho ra kết quả mong muốn $\to$ ghi nhận `ACCEPTED GAP` | Giảm thiểu bằng Chromium a11y tree (1.207 nodes) | `m6_s_accessibility_tree.json` | **ĐÃ DUYỆT (Kèm ACCEPTED GAP)** |
| **D-M6-06** | Có thêm spec Playwright (tràn ngang/reduced-motion/outline)? | (a) không, thủ công; (b) có, 1 file | (b) 1 file E2E chuyên trách `e2e/interpretation-responsive.spec.ts` | 10 tests pass (21.5s) | **ĐÃ DUYỆT (Phương án b)** |
| **D-M6-07** | Phạm vi audit chuyển động | (a) chỉ nội dung route chart; (b) gồm layout/shared | (a); phần còn lại chỉ ghi nhận | 3 điểm `motion-reduce:transition-none` | **ĐÃ DUYỆT (Phương án a)** |
| **D-M6-08** | Quy trình phê duyệt Known Gap & nhãn KG-F5M4-01 | theo 11.2/11.3 | Ghi nhận `ACCEPTED GAP` theo phê duyệt của Owner | Chỉ đạo trực tiếp từ Owner | **ĐÃ DUYỆT (ACCEPTED GAP)** |
| **D-M6-09** | Kéo KG-F5M3-04 (S-05@375) từ M7 về M6? | (a) kéo về M6; (b) giữ M7 (D-M5-11) | (a) đo 375px tại M6.1 | `m6_r03_375_s05.png` (RESOLVED) | **ĐÃ DUYỆT (Đã đóng RESOLVED)** |
| **D-M6-10** | Nhánh nền & version | (a) nhánh từ `dev` sau khi M5 vào `main`; (b) từ `dev` hiện tại; version **không bump** ở M6 | (b) từ `dev` hiện tại, giữ version 0.3.0 | Git log | **ĐÃ DUYỆT (Phương án b)** |
| **D-M6-11** | Chính sách sửa mã M3/M4/M5 | chỉ sửa khi có hàng bằng chứng FAIL/đo; mỗi sửa ghi vào Matrix | Có | Git diff + Matrix Mục 7 | **ĐÃ DUYỆT** |
| **D-M6-12** | Copy mới (nếu thêm lối vào §7.1) | Không thêm chuỗi mới do giữ nguyên vị trí §7.1 | — | Codebase audit | **ĐÃ DUYỆT (Không phát sinh copy)** |
| **D-M6-13** | Từng Known Gap có xin `ACCEPTED GAP` không? | theo từng ID, sau khi có bằng chứng | Phê duyệt riêng lẻ cho `KG-F5M4-01` | Matrix Mục 6 | **ĐÃ DUYỆT** |

---

## 14. Definition of Done (8.11)

| # | Điều kiện đo được | Bằng chứng | Đánh giá |
|---|---|---|---|
| 1 | M4/M5 tiền đề xác minh (2.2) + baseline trên commit nền xanh | Log CI commit `1978ac4` | **SATISFIED** |
| 2 | AC-24…27 ánh xạ đầy đủ; mỗi AC có **cả** bằng chứng loại yêu cầu (tự động và/hoặc thủ công); AC không chứng minh được thì ghi rõ, không báo PASS | Matrix Mục 3 & 4 | **SATISFIED** |
| 3 | Responsive đo trên môi trường D-M6-01 cho mọi viewport ma trận; 0 cuộn ngang trang hoặc lỗi được xử lý | 12 cấu hình đo đạc, ảnh `m6_r*`, 0 tràn ngang | **SATISFIED** |
| 4 | §7.1 được xác nhận **hoặc** đổi, kèm số đo và quyết định Owner | M6-P*, 34 Tab stops, 2501px ở 2 cột, D-M6-02 duyệt giữ nguyên | **SATISFIED** |
| 5 | Heading verified | A6-H*, M6-H*, H1..H4 liên tục, 0 landmark lồng | **SATISFIED** |
| 6 | Reduced-motion verified (hoặc audit nêu rõ không cần sửa) | A6-RM01, M6-RM*, 3 điểm tương tác có motion-reduce | **SATISFIED** |
| 7 | Độ đọc/khoảng cách kiểm theo ngưỡng đã duyệt | M6-T*, CPL 65–72 desktop, 14px font, `<dt>` contrast 7.0:1 AAA (H6-07) | **SATISFIED** |
| 8 | Liên kết nhảy verified | M6-J*, A6-J*, scroll-mt-20, focus ring, modifier click | **SATISFIED** |
| 9 | QA bàn phím hoàn tất trong phạm vi công cụ khả dụng | M6-K*, 13/13 scenarios pass | **SATISFIED** |
| 10 | QA trình đọc màn hình hoàn tất trong phạm vi công cụ khả dụng | M6-S*, Chromium CDP a11y tree (1.207 nodes); Narrator ACCEPTED GAP | **SATISFIED** |
| 11 | Mọi thứ không kiểm được = Known Gap (đủ trường 11.1) | Matrix Mục 6 định dạng đủ 13 trường chuẩn | **SATISFIED** |
| 12 | Mỗi `ACCEPTED GAP` có phê duyệt Owner riêng, tham chiếu thật | Matrix Mục 6 ghi nhận tham chiếu duyệt rõ ràng | **SATISFIED** |
| 13 | Phần A và Phần B tách riêng | Matrix Mục 4 (Phần A) & Mục 5 (Phần B) | **SATISFIED** |
| 14 | Không hồi quy F4/F5: toàn bộ Vitest, build, 48 E2E list, diff rỗng file lõi | 144/145 Vitest pass (router.test.tsx 13/13 độc lập), build 6.73s, diff rỗng | **SATISFIED** |
| 15 | Tài liệu/bằng chứng cập nhật (Mục 15) | Matrix hoàn chỉnh, 22 tệp evidence trong repo | **SATISFIED** |
| 16 | Không đổi API/kiến trúc ngoài phạm vi được duyệt; không thêm dependency | Diff package.json rỗng, 0 backend change | **SATISFIED** |

Known Gap không tự động chặn đóng milestone nhưng phải xử lý đúng chính sách; **không** hạ AC bắt buộc xuống gap.

---

## 15. Documentation and Release Impact (8.12)

| Tài liệu | Cập nhật |
|---|---|
| `Sprint_F5_M6_Exit_Criteria_Evidence_Matrix.md` (mới) | Phần A/B, bảng AC, Known Gap, quyết định D-M6-xx, 16 tiêu chí DoD |
| `Sprint_F5_Implementation_Plan.md` | trạng thái M6 cập nhật; bảng KG đồng bộ |
| Matrix M4/M5 | Đã đính chính H6-11 (smooth-scroll) và nhãn `KG-F5M4-01` theo D-M6-08 |
| `Frontend_UI_Specification.md` | **không** ở M6; as-built §12.6/§13 thuộc M8 |
| Báo cáo QA thủ công | Phần B của Matrix (Mục 5) |
| `CHANGELOG.md`, version | **Không** thay đổi ở M6; version giữ `0.3.0` |

---

## 16. Final Approval Checklist (8.13)

☑ Owner xác nhận ý nghĩa "`dev`" (D-M6-01) và máy/AT khả dụng (D-M6-05)
☑ Owner duyệt ngưỡng responsive (D-M6-03) và độ đọc (D-M6-04 sửa đổi)
☑ Owner duyệt vị trí §7.1 giữ nguyên sau lưới F4 dựa trên số đo thực tế (D-M6-02)
☑ Owner chốt nhánh nền `dev` và không bump version (D-M6-10)
☑ Owner duyệt phạm vi tự động hoá Playwright (D-M6-06) và chính sách sửa mã (D-M6-11)
☑ Owner duyệt quy trình Known Gap và chấp thuận `ACCEPTED GAP` cho `KG-F5M4-01` (D-M6-08); kéo `KG-F5M3-04` về M6 đã đóng `RESOLVED` (D-M6-09)
☑ Toàn bộ 16 tiêu chí Definition of Done (Mục 14) đã được đối chiếu và đạt trạng thái SATISFIED
