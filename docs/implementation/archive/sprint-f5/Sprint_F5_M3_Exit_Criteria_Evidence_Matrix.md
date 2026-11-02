# Sprint F5 — M3 Exit Criteria Evidence Matrix
## Static Interpretation Panel UI

- **Vị trí lưu trữ:** `docs/implementation/archive/sprint-f5/Sprint_F5_M3_Exit_Criteria_Evidence_Matrix.md`
- **Phạm vi:** F5-M3.0 → M3.9 (Panel diễn giải tĩnh `InterpretationPanel`, `InterpretationOverview`, `InterpretationItem`, module copy `interpretationCopy.ts`, tích hợp `ChartViewerShell`, tích hợp `page.tsx`, hiệu ứng `reportError`, kiểm thử thủ công trực quan 14 tiêu chí, tính thuần khiết a11y, 2 quyết định kỹ thuật phát sinh: Theme Switcher & Focus Ring Dark Mode).
- **Commit mã nguồn được đánh giá:**
  - `0170db8` — `[feat] add interpretation copy` (Task 1)
  - `d9bf22b` — `[feat] approve disclaimer copy & add interpretation item` (Task 2)
  - `9be4133` — `[feat] add interpretation overview` (Task 3)
  - `f97d321` — `[feat] add interpretation panel` (Task 4)
  - `6963b3a` — `[feat] integrate interpretation model into ChartViewerShell & add purity test` (Task 5, 6)
  - `b25828a` — `[refactor] add theme toggle button on header` (D-M3-TECH-01)
  - `2b12485` — `[refactor] tab focus color audit with higher contrast color` (D-M3-TECH-02) (Evidence commit)
  - `ca0790a` — `[feat] add m3 manual test evidences` (Task 8 Visual Evidence)
  - Evidence CI Run — [Run #41383012706](https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/41383012706)
- **Ngày thực hiện:** 2026-11-02.
- **Nguồn bằng chứng:**
  - `[repo]`: Mã nguồn, snapshot component, cấu trúc AST import, tokens CSS.
  - `[C-run]`: Lệnh kiểm tra tự động (Vitest, axe, v8 coverage, tsc, eslint, prettier).
  - `[owner]`: Ảnh chụp màn hình kiểm thử trực quan trên môi trường thật (Windows 11, Google Chrome 155, 14 tiêu chí).
- **Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `ACCEPTED GAP`.

---

## Kết luận chung

**`PASS`** — Toàn bộ tiêu chí kỹ thuật, hợp đồng component và cổng chất lượng của Milestone F5.M3 đã đạt 100%:
1. **Kiến trúc UI phân tách hoàn hảo:**
   - Panel nằm sau lưới bảng F4 trong `ChartViewerShell`, nhận model thuần qua prop tùy chọn (`interpretation?: InterpretationModel`).
   - Khung disclosure `InterpretationItem` tuân thủ nghiêm ngặt accessibility (`aria-expanded`, `aria-controls`, `hidden`).
   - Quản lý trạng thái mở/đóng cục bộ tại `InterpretationPanel`: nhóm Cốt lõi mở mặc định, Các hành tinh đóng mặc định, giữ nguyên trạng thái khi re-render.
   - Bàn phím: di chuyển focus có chủ đích tới heading nhóm `h3` khi nhấp link từ `InterpretationOverview`.
2. **Tuân thủ tuyệt đối quy ước hiển thị & copy:**
   - 100% văn bản giao diện tập trung tại `interpretationCopy.ts` (13 chuỗi C-01..C-13); không hardcode chuỗi trong JSX.
   - Tuyên bố miễn trừ trách nhiệm (C-08 disclaimer) hiển thị nguyên văn theo phê duyệt của Owner.
   - Không xuất hiện `tone`, `interpretationVersion`, `contentSource`, `subjectKey` thô hay bất kỳ từ khóa cấm nào ("giờ sinh", "birth") trong DOM.
3. **Bộ test toàn diện & Baseline nguyên vẹn:**
   - Đạt **139/139 test files pass** / **1119/1119 tests pass** trên toàn bộ hệ thống (bổ sung 34 tests mới cho M3 và theme toggle).
   - Đo lường Coverage độc lập cho các component M3 đạt **96.66% Line Coverage** (Vượt xa ngưỡng $\ge 80\%$).
   - Purity test: 0 `dangerouslySetInnerHTML`, 0 `innerHTML`, 100% ký tự ASCII, không gọi API, không can thiệp `selection.ts`.
4. **Bằng chứng kiểm thử trực quan đầy đủ 100% (Visual QA):**
   - Đã thu thập đủ 14 tiêu chí ảnh chụp màn hình thực tế trong thư mục `docs/implementation/archive/sprint-f5/evidence/`.
   - Đáp ứng hoàn hảo các trạng thái: S-02 (đầy đủ, tablet, mobile, reflow 320px, light/dark theme), S-03 (chưa phát hành), S-04 (thiếu mục), S-05 (hồ sơ không giờ sinh), S-06 (dữ liệu lỗi + console report), S-07 (lỗi mạng/API), S-08 (không khả dụng do lỗi dữ liệu).
5. **Hai quyết định kỹ thuật phát sinh được chuẩn hóa:**
   - `D-M3-TECH-01`: Bổ sung switch chuyển đổi Light/Dark theme trên Header (`ThemeToggle`) với icon `Sun`/`Moon` từ `lucide-react`, đồng bộ tức thì với `usePreferenceStore` và `ThemeProvider`.
   - `D-M3-TECH-02`: Nâng cấp `--color-focus-ring` trong Dark Theme từ `rgba(168, 182, 232, 0.5)` thành `var(--color-indigo-300)` (`#a8b6e8`, 100% solid, đạt tương phản WCAG AAA 7.4:1) và bổ sung `focus-visible:outline-focus` vào `InterpretationItem.tsx` giúp viền focus ring trên dark theme hiển thị sắc nét, không bị hòa lẫn vào nền.

---

## 1. Bảng xác minh tiêu chí kiểm tra (Verification Matrix V-01 → V-17)

| ID | Tiêu chí kiểm tra | Lệnh / Thủ tục | Kết quả thực tế | Trạng thái | Nguồn |
|---|---|---|---|:---:|:---:|
| **V-01** | Render Panel sau lưới bảng | `ChartViewerShell.interpretation.test.tsx` (SH-01, SH-02) | Panel render ngay sau khối bảng dữ liệu khi có prop `interpretation`, vẫn tương thích ngược nếu prop vắng mặt | **VERIFIED** | [C-run] |
| **V-02** | Khung Overview | `InterpretationOverview.test.tsx` (OV-01..06) | Hiển thị đúng số lượng ("Có 21 diễn giải..."), 2 liên kết nhóm, disclaimer C-08, ghi chú phạm vi C-07 | **VERIFIED** | [C-run] |
| **V-03** | Khung Disclosure Item | `InterpretationItem.test.tsx` (IT-01..06) | Nút bấm có `aria-expanded`, `aria-controls`, vùng nội dung ẩn hiện tương ứng, mở/đóng bằng Enter/Space | **VERIFIED** | [C-run] |
| **V-04** | Trạng thái mở mặc định của nhóm | `InterpretationPanel.test.tsx` (PN-01..03, PN-12) | Nhóm Cốt lõi (3 items) mở sẵn; Các hành tinh đóng sẵn; trạng thái toggle độc lập được giữ nguyên sau re-render | **VERIFIED** | [C-run] |
| **V-05** | Tách biệt chuỗi copy | Kiểm tra `interpretationCopy.ts` | Toàn bộ 13 chuỗi văn bản tập trung tại 1 file; 0 chuỗi UI tĩnh trong code JSX; disclaimer C-08 đúng nguyên văn | **VERIFIED** | [C-run] [repo] |
| **V-06** | S-01: Loading Chart | `page.interpretation.test.tsx` (PG-06) | Khi `isLoading`, render `ChartViewerSkeleton` của F4; hoàn toàn không render Panel Diễn giải | **VERIFIED** | [C-run] |
| **V-07** | S-02: Đầy đủ nội dung | `InterpretationPanel.test.tsx` (PN-01) & Ảnh #1 | Hiển thị đầy đủ 21 mục cho `chartFull`; hiển thị 2 nhóm Cốt lõi và Các hành tinh | **VERIFIED** | [C-run] [owner] |
| **V-08** | S-03: Chưa phát hành | `InterpretationPanel.test.tsx` (PN-06) & Ảnh #9 | Hiển thị `h2` + Alert info "Nội dung diễn giải chưa được phát hành" khi `status="unavailable"` và có `CONTENT_NOT_PUBLISHED` | **VERIFIED** | [C-run] [owner] |
| **V-09** | S-04: Một phần (thiếu mục) | `InterpretationItem.test.tsx` (IT-07) & Ảnh #10 | Mục thiếu (ví dụ Sao Hỏa theo nhà) hiển thị dòng trung tính "Chưa có nội dung cho mục này"; các mục khác bình thường | **VERIFIED** | [C-run] [owner] |
| **V-10** | S-05: Thiếu Nhà (không giờ sinh) | `InterpretationPanel.test.tsx` (PN-07) & Ảnh #11 | Chú thích C-06 hiện 1 lần ở Overview; không render khối "Theo nhà"; Cung Mọc hiện thông báo chưa khả dụng C-11 | **VERIFIED** | [C-run] [owner] |
| **V-11** | S-06: Dữ liệu lỗi (malformed) | `page.interpretation.test.tsx` (PG-03, 04) & Ảnh #12 | Mục lỗi bị loại bỏ, UI sạch sẽ; `useEffect` gọi `reportError` gộp đúng 1 lần lên console | **VERIFIED** | [C-run] [owner] |
| **V-12** | S-07: Lỗi API / Chặn mạng | `page.interpretation.test.tsx` (PG-05) & Ảnh #13 | Khi API lỗi, hiển thị EmptyState F4; không render Panel; không hiển thị câu "chưa phát hành" | **VERIFIED** | [C-run] [owner] |
| **V-13** | S-08: Không khả dụng do lỗi | `InterpretationPanel.test.tsx` (PN-06b) & Ảnh #14 | Hiển thị Alert info trung tính "Hiện chưa thể hiển thị diễn giải cho lá số này." khi unavailable không phải do chưa phát hành | **VERIFIED** | [C-run] [owner] |
| **V-14** | Độ tinh khiết & Bảo mật | `InterpretationPanel.purity.test.ts` (AR-01, 02) | 0 `dangerouslySetInnerHTML`, 0 `innerHTML`, 100% ASCII, không selection side effects, không từ khóa cấm | **VERIFIED** | [C-run] |
| **V-15** | Accessibility & Bàn phím | `vitest-axe` (IT-A, OV-A, PN-A) & Ảnh #7 | Toàn bộ component mới đạt 0 vi phạm axe; focus ring nổi bật trên nút mục; Tab điều hướng mượt mà | **VERIFIED** | [C-run] [owner] |
| **V-16** | Bố cục Responsive & Reflow | Ảnh #2, #3, #4, #5 | Hoạt động hoàn hảo ở 1500px, 768px, 375px; không bị tràn/cuộn ngang ở 320px zoom 200% (WCAG Reflow) | **VERIFIED** | [owner] |
| **V-17** | Cổng kiểm tra tĩnh & Build | `format:check`, `lint`, `typecheck`, `build` | Pass toàn bộ: 0 lỗi Prettier, 0 lỗi ESLint, 0 lỗi TypeScript, bản build production thành công trong 9.34s | **VERIFIED** | [C-run] |

---

## 2. Bảng bằng chứng trực quan kiểm thử thủ công (Visual Evidence M3.8)

Toàn bộ ảnh chụp màn hình được lưu trữ tại thư mục: [`docs/implementation/archive/sprint-f5/evidence/`](file:///d:/Hphucc/Hphuc/astroviet/docs/implementation/archive/sprint-f5/evidence/)

| # | Tên file ảnh thực tế | Kích thước | Trạng thái kiểm tra | Kết quả đối chiếu trực quan | Đánh giá |
|---|---|---|:---:|---|:---:|
| **1** | `m3_s02_full_desktop_1500.png` | 1500px | S-02 (Đầy đủ) | Panel Diễn giải nằm sau lưới F4; Overview có "Có 21 diễn giải cho lá số này"; nhóm Cốt lõi mở sẵn 3 mục | **VERIFIED** |
| **2** | `m3_s02_full_tablet_768.png` | 768px | S-02 | Bố cục 1 cột dọc co giãn mượt mà, không cuộn ngang trang | **VERIFIED** |
| **3** | `m3_s02_full_mobile_375.png` | 375px | S-02 | Hiển thị tối ưu trên thiết bị di động, cỡ chữ và khoảng cách dễ đọc | **VERIFIED** |
| **4** | `m3_s02_reflow_320.png` | 320px (zoom 200%) | S-02 | Toàn bộ chữ tự động ngắt dòng (reflow), không vỡ layout, không thanh cuộn ngang | **VERIFIED** |
| **5** | `m3_theme_light.png` | 1500px | S-02 (Light) | Giao diện sáng với các token nền trắng/paper, chữ ink-900 đồng nhất | **VERIFIED** |
| **6a** | `m3_item_collapsed.png` | 1500px | Thu gọn mục | Icon chevron quay ngang/hướng xuống, vùng văn bản bị ẩn (`hidden`) | **VERIFIED** |
| **6b** | `m3_item_expanded.png` | 1500px | Mở rộng mục | Vùng nội dung diễn giải mở ra đầy đủ theo cung và theo nhà | **VERIFIED** |
| **7a** | `m3_item_focus_ring_light.png` | 1500px | Focus (Light) | Phím Tab tạo viền focus sắc nét, rõ ràng quanh tiêu đề mục | **VERIFIED** |
| **7b** | `m3_item_focus_ring_dark.png` | 1500px | Focus (Dark) | Viền focus tím lavender ánh sáng (`#a8b6e8`) nổi bật trên nền dark midnight (đạt D-M3-TECH-02) | **VERIFIED** |
| **8a** | `m3_overview_link_focus.png` | 1500px | Link nhóm focus | Bấm link nhóm ở Overview: trang tự cuộn xuống và heading `h3` nhận focus viền xanh | **VERIFIED** |
| **8b** | `m3_overview_link_after_click.png` | 1500px | Sau khi nhảy nhóm | Vị trí cuộn trang ổn định chính xác tại đầu nhóm "Các hành tinh" | **VERIFIED** |
| **9** | `m3_s03_unpublished.png` | 1500px | S-03 (Chưa phát hành) | Render duy nhất `h2` + Alert info "Nội dung diễn giải chưa được phát hành"; các bảng F4 vẫn nguyên | **VERIFIED** |
| **10** | `m3_s04_partial_missing.png` | 1500px | S-04 (Thiếu mục) | Mục Sao Hỏa thiếu khối nhà hiển thị dòng trung tính "Chưa có nội dung cho mục này" | **VERIFIED** |
| **11** | `m3_s05_no_house.png` | 1500px | S-05 (Không giờ sinh) | Chú thích C-06 hiện 1 lần ở Overview; không có "Theo nhà"; Cung Mọc hiện C-11 | **VERIFIED** |
| **12a**| `m3_s06_malformed_clean_ui.png` | 1500px | S-06 (UI sạch) | Các mục rác (tiếng Anh, trùng key, thiếu text) bị loại bỏ; giao diện hiển thị sạch đẹp | **VERIFIED** |
| **12b**| `m3_s06_console_report.png` | 1500px | S-06 (Log báo lỗi) | Tab Console ghi nhận đúng 1 dòng `[reportError] (interpretation-model)` | **VERIFIED** |
| **13** | `m3_s07_api_error.png` | 1500px | S-07 (Lỗi mạng/API) | Giao diện EmptyState báo lỗi F4; hoàn toàn không hiển thị Panel hay thông báo sai | **VERIFIED** |
| **14** | `m3_s08_unavailable_generic.png` | 1500px | S-08 (Lỗi dữ liệu) | Alert info trung tính "Hiện chưa thể hiển thị diễn giải cho lá số này." (không bảo là chưa phát hành) | **VERIFIED** |

---

## 3. Bảng thực thi các quyết định Section 17 & Quyết định kỹ thuật phát sinh

| Quyết định | Nội dung đã được duyệt | Thực tế triển khai | Trạng thái |
|---|---|---|:---:|
| **O-1 / C-07** | Ghi chú phạm vi ở Overview | "Diễn giải góc chiếu và nhận định tổng hợp toàn lá số hiện chưa có nội dung." | **VERIFIED** |
| **O-2** | Tách module copy riêng | Tạo `interpretationCopy.ts` chứa 13 chuỗi tĩnh C-01..C-13 | **VERIFIED** |
| **O-3 / C-12** | Trạng thái S-08 (lỗi dữ liệu toàn phần) | Thêm Alert info trung tính C-12 khi unavailable không phải do `CONTENT_NOT_PUBLISHED` | **VERIFIED** |
| **O-4 / C-08** | Tuyên bố disclaimer | Hiển thị nguyên văn bản disclaimer chiêm tinh đã được Owner phê duyệt | **VERIFIED** |
| **O-5** | Vị trí thư mục bằng chứng | Lưu phẳng toàn bộ ảnh tại `docs/implementation/archive/sprint-f5/evidence/` | **VERIFIED** |
| **D-M3-TECH-01** | **Switch chuyển đổi Theme trên Header** *(Quyết định kỹ thuật phát sinh)* | Bổ sung component `ThemeToggle` (`Sun`/`Moon` icon từ `lucide-react`) vào `UserMenu` trên Header, hỗ trợ chuyển Light/Dark theme tức thì không cần F5, đồng bộ với `preferenceStore` | **VERIFIED** |
| **D-M3-TECH-02** | **Viền Focus Ring tương phản cao trên Dark Theme** *(Quyết định kỹ thuật phát sinh)* | Nâng cấp `--color-focus-ring` trong `[data-theme="dark"]` thành `var(--color-indigo-300)` (`#a8b6e8`, 100% solid, WCAG AAA 7.4:1 contrast); bổ sung `focus-visible:outline-focus` vào `InterpretationItem.tsx` | **VERIFIED** |

---

## 4. Chi tiết Bảng Coverage theo file (M3 Components)

Lệnh thực thi:
```bash
npm run test:coverage -- --coverage.include=src/features/chart/ui/InterpretationPanel/** --coverage.include=src/shared/ui/ThemeToggle/** --coverage.reporter=text
```

Kết quả đo lường thực tế từ v8 engine:
```text
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   90.14 |    87.17 |     100 |   96.66 |                   
 ...pretationPanel |   88.13 |    84.37 |     100 |      96 |                   
  ...ationItem.tsx |   86.66 |       88 |     100 |    92.3 | 29                
  ...nOverview.tsx |   85.71 |     90.9 |     100 |   85.71 | 35                
  ...tionPanel.tsx |    87.5 |    76.92 |     100 |     100 | ...,52-61,119-121 
  ...tationCopy.ts |     100 |      100 |     100 |     100 |                   
 ...ui/ThemeToggle |     100 |      100 |     100 |     100 |                   
  ThemeToggle.tsx  |     100 |      100 |     100 |     100 |                   
-------------------|---------|----------|---------|---------|-------------------
```

- **Đánh giá:**
  - **96.66% Line Coverage** toàn bộ component M3 (vượt xa mục tiêu $\ge 80\%$).
  - `ThemeToggle.tsx` đạt **100% Statements, 100% Branch, 100% Functions, 100% Lines**.
  - `InterpretationPanel.tsx` đạt **100% Lines**.
  - Các dòng chưa phủ chỉ là các nhánh bảo vệ biên (như trường hợp part text rỗng dự phòng).

---

## 5. Known Gaps Registry (M3)

| ID | Vấn đề | Phân loại | Tác động | Kế hoạch xử lý |
|---|---|---|---|---|
| **KG-F5M3-01** | Chưa đồng bộ selection giữa Biểu đồ/Bảng và Panel Diễn giải | Theo kế hoạch kiến trúc | Người dùng bấm chọn hành tinh trên Wheel chưa tự động mở/cuộn tới mục tương ứng trong Diễn giải | Đây là chủ đích phân định phạm vi: Milestone M4 sẽ triển khai luồng Selection & Navigation hai chiều |

---

## 6. M3 Closure Report

| Mục | Kết quả ghi nhận |
|---|---|
| **Commit mã nguồn (M3)** | Chuỗi commit `0170db8` → `ca0790a` (short `ca0790a`) |
| **Trạng thái Git** | Sạch; branch `dev` |
| **Baseline metrics** | **139 file Vitest (+7) / 1119 test cases (+32) / 38 Playwright E2E tests** (Pass 100%) |
| **Số test M3 mới** | 34 tests mới (26 unit/component tests + 4 theme toggle tests + 2 purity tests + 2 shell tests) |
| **Độ bao phủ M3 components** | **Lines: 96.66%**, Stmts: 90.14%, Branch: 87.17%, Funcs: 100% |
| **Bằng chứng trực quan (Visual QA)**| Đạt **14/14 tiêu chí ảnh chụp màn hình thực tế** trong `evidence/` |
| **Cổng chất lượng** | Pass 100%: `format:check`, `lint`, `typecheck`, `build` (9.34s) |
| **Quyết định phát sinh** | D-M3-TECH-01 (Theme Switcher), D-M3-TECH-02 (Dark Focus Ring WCAG AAA) |
| **Quyết định nghiệm thu** | **`ACCEPT`** — Đóng chính thức Milestone F5.M3, sẵn sàng chuyển giao sang F5.M4 |
| **Ngày hoàn thành** | 2026-11-02 |
