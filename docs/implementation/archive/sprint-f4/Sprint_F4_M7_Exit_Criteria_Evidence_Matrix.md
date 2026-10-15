# Sprint F4 — M7 Exit Criteria Evidence Matrix

## Semantic Tables & Mobile Cards for Natal Chart (`FE-S4.7`)

**Vị trí lưu:** `docs/implementation/archive/sprint-f4/Sprint_F4_M7_Exit_Criteria_Evidence_Matrix.md`  
**Milestone:** F4-M7 (`FE-S4.7`: Bảng/thẻ hành tinh, nhà, góc chiếu & tích hợp ChartViewer)  
**Ngày review:** 2026-10-15  
**Commit Head:** `e653f61d7c36b00dbf0cf2ca0324a73c16d207c5`  
**CI Run:** [GitHub Actions Run 38559202548 / Job 115835792619](https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/38559202548/job/115835792619)  
**Nguồn bằng chứng:** `[repo]` đọc mã/diff; `[run]` chạy lệnh thực tế trên môi trường; `[owner]` quyết định phê duyệt.  
**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `ACCEPTED GAP` · `NOT APPLICABLE`.

---

## Kết luận

**`PASS WITH KNOWN GAPS`** — toàn bộ các tiêu chí nghiệm thu của Sprint F4 M7 (`FE-S4.7`) đã hoàn tất và vượt qua các cổng kiểm thử:

1. **useMediaQuery & matchMedia Helper (F4-M7.1)**:
   - Tạo mới `useMediaQuery` sử dụng `useSyncExternalStore` an toàn với SSR / headless.
   - Bỏ nhánh fallback cũ `addListener` với `as unknown as` (tuân thủ Grep Gate: không có type assertion trong hook).
   - Test helper `installMatchMedia` hỗ trợ đăng ký listener và dispatch sự kiện `change` động.
   - 6/6 unit tests đạt chuẩn (`useMediaQuery.test.ts`).
2. **Astrological Badges & Typography Styles (F4-M7.2)**:
   - 4 badges chuyên dụng: `PlanetGlyph`, `SignGlyph` (hiển thị ký tự cung đã kèm Text Variation Selector `\uFE0E` từ M2 `labels.ts` chống vỡ màu emoji), `HouseBadge` (Ả Rập & La Mã), `AspectBadge` (tone viền/chấm phụ trợ, tương phản chữ đạt chuẩn).
   - `tableStyles.ts` chuẩn hóa padding (`comfortable` px-3 py-3, `compact` px-2 py-2) và font số liệu (`font-data tabular-nums whitespace-nowrap`).
   - 19 unit & axe tests đạt chuẩn 100%.
3. **PlanetTable (F4-M7.3)**:
   - Cung cấp chế độ bảng ngữ nghĩa (`<table>`, `caption`, `th scope="col/row"`, cuộn an toàn `overflow-x-auto`) và thẻ mobile (`<ul role="list">`, `<Card as="li">`).
   - Tự động ẩn cột/trường Nhà khi thiếu dữ liệu (`houseDataAvailable === false`).
   - Nút chọn controlled chỉ xuất hiện khi có callback `onSelect` (D-M7-3); hỗ trợ bàn phím và min touch target $\ge 44\text{px}$.
   - 13 unit & axe tests đạt chuẩn (P1–P11, EmptyState, Axe).
4. **HouseTable, Angles & Missing-Data UX (F4-M7.4)**:
   - Bảng 12 Nhà kèm Badge hệ nhà ở tiêu đề (H9). Thẻ mobile dùng `<ul role="list">` cho cả bảng nhà và bảng góc.
   - Khi thiếu giờ sinh (`houseDataAvailable === false`), bảng nhà bị ẩn và hiển thị thông báo tại slot `unavailableContent` (D-M7-4, AC-MISS).
   - Bảng các góc chính (Angles) độc lập, hiển thị khi `hasAngles === true` ngay cả khi thiếu dữ liệu nhà (D-M7-5, H7).
   - 10 unit & axe tests đạt chuẩn (H1–H9, Axe).
5. **AspectTable & AspectFilterChip (F4-M7.5)**:
   - Bảng góc chiếu sắp xếp theo orb tăng dần; hiển thị đầy đủ Trạng thái "Đang tới gần"/"Đang rời xa" bằng chữ thật. Thẻ mobile dùng `<ul role="list">`.
   - `AspectFilterChip` hỗ trợ lọc theo hành tinh với vùng thông báo `aria-live="polite"` và nút xóa accessible đạt min touch target $\ge 44\text{px}$.
   - Xử lý fallback cho `filterPlanetKey` khi thiếu `filterPlanet` để luôn hiển thị chip, tránh lọc âm thầm.
   - 16 unit & axe tests đạt chuẩn (A1–A10, F1–F5, Axe).
6. **ChartViewerShell Integration (F4-M7.6)**:
   - Tích hợp cả 3 bảng vào `ChartViewerShell`, đọc `densityMode` từ `usePreferenceStore` và responsive layout từ `useMediaQuery("(min-width: 640px)")` (D-M7-1, D-M7-2).
   - Di dời `HouseDataNotice` vào `HouseTable` để loại bỏ notice trùng lặp (D-M7-4).
   - Cập nhật text placeholder sang "Biểu đồ tròn sẽ xuất hiện ở đây.".
   - 11 unit & integration tests đạt chuẩn (S1–S7, Axe).
   - **Lưu ý về assertion đếm số lần xuất hiện tên hệ nhà:** Các test `page.test.tsx` (V1), `chart-flow.integration.test.tsx` (I1, I3), và `ChartViewerShell.test.tsx` kiểm tra chính xác `toHaveLength(2)` cho `"Placidus"` và `"Whole Sign"`. Lý do: tên hệ nhà xuất hiện ở đúng 2 vị trí ngữ nghĩa có chủ đích trong DOM: (1) thẻ `<dd>` trong khối metadata tóm tắt của `ChartViewerShell`, và (2) `<Badge>` trong thanh tiêu đề của `HouseTable`.
7. **Cổng chất lượng tuyệt đối (F4-M7.7)**:
   - `format:check`: Exit 0 (100% Prettier code style).
   - `lint`: Exit 0 (0 errors, 0 warnings).
   - `typecheck`: Exit 0 (cả `tsconfig.app.json` và `tsconfig.node.json` 0 lỗi).
   - `test`: Toàn bộ 111 test files passed, 742 tests passed (100%).
   - Grep Gates: 0 matches `useState` trong bảng, 0 matches `dangerouslySetInnerHTML`, 0 matches `as unknown as` trong `useMediaQuery.ts`.

---

## 1. Bằng chứng kỹ thuật theo tiêu chí nghiệm thu (Acceptance Criteria)

| ID | Tiêu chí nghiệm thu | Bằng chứng kiểm chứng | Nguồn | Trạng thái |
|---|---|---|:---:|:---:|
| **AC-1** | Ba bảng Planet, House (khi có dữ liệu), Aspect Table ngữ nghĩa, hoạt động | `PlanetTable.test.tsx` (P1–P5), `HouseTable.test.tsx` (H1–H3), `AspectTable.test.tsx` (A1–A3), `ChartViewerShell.test.tsx` (S1) | [run] | VERIFIED |
| **AC-P** | PlanetTable hiển thị đủ Hành tinh, Cung, Độ, Nhà (khi có), Nghịch hành | `PlanetTable.tsx`, `PlanetTable.test.tsx` (P2–P4) | [run] | VERIFIED |
| **AC-H** | HouseTable hiển thị đủ Nhà, Cusp, Cung; không có giá trị giả | `HouseTable.tsx`, `HouseTable.test.tsx` (H1–H2) | [run] | VERIFIED |
| **AC-A** | AspectTable hiển thị đủ Hành tinh A, Góc chiếu, Hành tinh B, Orb, Trạng thái | `AspectTable.tsx`, `AspectTable.test.tsx` (A2–A4) | [run] | VERIFIED |
| **AC-SEM** | Cấu trúc ngữ nghĩa chuẩn: `caption` sr-only, `th scope="col"`, `th scope="row"`, thẻ mobile có `role="list"` | `PlanetTable.test.tsx` (P5), `HouseTable.test.tsx` (H3), `AspectTable.test.tsx` (A1, A9) | [run] | VERIFIED |
| **AC-MOB** | Thẻ mobile (`layout="cards"`) giữ đủ thông tin, không cuộn ngang, không chứa `<table>` | `PlanetTable.test.tsx` (P8), `HouseTable.test.tsx` (H8), `AspectTable.test.tsx` (A9), `ChartViewerShell.test.tsx` (S2) | [run] | VERIFIED |
| **AC-SEL** | Nút chọn truy cập, controlled (`aria-pressed`, Enter/Space); không render khi thiếu `onSelect` | `PlanetTable.test.tsx` (P6, P7), `AspectTable.test.tsx` (A6), D-M7-3 | [run] | VERIFIED |
| **AC-MISS** | Thiếu nhà: giải thích rõ tại `HouseTable`, không bịa dữ liệu, không `role="alert"` | `HouseTable.test.tsx` (H4, H7), `ChartViewerShell.test.tsx` (S4), D-M7-4 | [run] | VERIFIED |
| **AC-CHIP** | `AspectFilterChip` hiển thị/xóa/phím đúng spec, nằm trong `aria-live="polite"`, min touch target $\ge 44\text{px}$ | `AspectFilterChip.test.tsx` (F1–F4), `AspectTable.test.tsx` (A7, A8, A10) | [run] | VERIFIED |
| **AC-RESP** | `useMediaQuery` và responsive test qua `installMatchMedia` | `useMediaQuery.test.ts` (U1–U6), `ChartViewerShell.test.tsx` (S1–S3) | [run] | VERIFIED |
| **AC-AXE** | Kiểm tra tự động bằng `vitest-axe` trên toàn bộ component và trạng thái | Badges, PlanetTable, HouseTable, AspectTable, AspectFilterChip, ChartViewerShell đều kiểm tra axe sạch | [run] | VERIFIED |
| **AC-A11Y-MAN** | Báo cáo kiểm thử trợ năng thủ công | Tự động hóa qua `vitest-axe` đạt 100% (`AC-AXE`). Kiểm thử thủ công bằng giọng đọc NVDA/VoiceOver trên thiết bị vật lý thực tế được ghi nhận là Accepted Gap do môi trường CI/headless agent (xem Mục 4 & KG-M7-06) | [repo] | ACCEPTED GAP |
| **AC-NOCOLOR** | Thông tin không truyền tải qua màu sắc duy nhất | Retrograde có chữ "Nghịch hành", Aspect tone là viền/chấm phụ trợ kèm chữ nature sr-only, Trạng thái có chữ "Đang tới gần" | [repo] | VERIFIED |
| **AC-KEY** | Phần tử tương tác điều khiển được bằng bàn phím (Tab, Enter, Space) | `PlanetTable.test.tsx` (P6), `AspectFilterChip.test.tsx` (F3), `AspectTable.test.tsx` (A6) | [run] | VERIFIED |
| **AC-RESP-DEV** | Hỗ trợ tương thích Desktop, Tablet, Mobile qua một biểu diễn DOM duy nhất | `ChartViewerShell.test.tsx` (S1–S3), `PlanetTable.test.tsx` (P9) | [run] | VERIFIED |
| **AC-INT** | Tích hợp an toàn vào ChartViewer; chức năng cũ (`ChartDetailPage`) nguyên vẹn | `pages/app/charts/detail/page.test.tsx` (21/21 tests passed), `ChartViewerShell.test.tsx` (11/11 tests passed) | [run] | VERIFIED |
| **AC-Q** | Cổng chất lượng exit 0, không dependency mới, không `dangerouslySetInnerHTML`, không `useState` trong bảng | `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` (111 files, 742 tests) đều exit 0 | [run] | VERIFIED |

---

## 2. Quyết định kỹ thuật đã thực thi (D-M7-1 … D-M7-8)

| ID | Quyết định theo Plan | Nội dung thực thi | Trạng thái |
|---|---|---|:---:|
| **D-M7-1** | Breakpoint bảng/thẻ = `(min-width: 640px)` (Tailwind `sm`); tablet dùng bảng | Thực thi qua hook `useMediaQuery("(min-width: 640px)")` tại `ChartViewerShell`; layout tablet ($\ge 640\text{px}$) hiển thị bảng | VERIFIED |
| **D-M7-2** | Shell gọi `useMediaQuery` **một lần** và truyền `layout`; bảng không tự gọi hook | `ChartViewerShell` tính toán `layout` (`table` hoặc `cards`) và truyền xuống `PlanetTable`, `HouseTable`, `AspectTable` dưới dạng pure presentation props | VERIFIED |
| **D-M7-3** | Nút chọn **chỉ render khi có `onSelect`**; Shell M7 không truyền ⇒ chưa có nút trong app | Khi `onSelect` được truyền, render `<button>` có `aria-pressed`, phím Space/Enter. Khi thiếu `onSelect`, chỉ hiển thị dữ liệu tĩnh, không tạo nút inert | VERIFIED |
| **D-M7-4** | `HouseDataNotice` chuyển vào `HouseTable` (slot `unavailableContent`), Shell không render ở đầu | Di dời `HouseDataNotice` vào `HouseTable` tại slot `unavailableContent`, hiển thị cạnh nội dung bị ảnh hưởng khi `houseDataAvailable === false`; gỡ bỏ instance trùng lặp ở đầu `ChartViewerShell` | VERIFIED |
| **D-M7-5** | Bảng góc ASC/MC/DSC/IC nằm trong `HouseTable` (UI §12.3) | Cấu trúc `HouseTable` gồm Bảng nhà (khi có dữ liệu) và Bảng góc (khi `hasAngles === true`); dữ liệu góc lấy trực tiếp từ API/VM, không tự suy diễn | VERIFIED |
| **D-M7-6** | `densityMode` đọc từ `preferenceStore`; `numeralStyle` mặc định arabic; `showOptionalBodies`/`showElement`/`showCategory` ngoài phạm vi | Đọc `densityMode` từ `usePreferenceStore` tại `ChartViewerShell`; `HouseBadge` hỗ trợ Ả Rập (mặc định) và La Mã; các toggle mở rộng được hoãn | VERIFIED |
| **D-M7-7** | Chip lọc = `AspectFilterChip` (UI §12.4); không có chip khác | Thực thi component `AspectFilterChip` độc lập, hỗ trợ accessible name, nút xóa accessible và touch target $\ge 44\text{px}$ | VERIFIED |
| **D-M7-8** | Tone aspect = viền/chấm màu + chữ `sr-only`; chữ giữ `text-primary` | Màu sắc tone góc chiếu chỉ áp dụng cho viền/chấm phụ trợ; chữ nhãn hiển thị dùng token `text-primary` đảm bảo độ tương phản $\ge 4.5:1$ | VERIFIED |

---

## 3. Bằng chứng cổng chất lượng chi tiết

| Cổng kiểm tra | Lệnh thực thi | Kết quả chi tiết | Trạng thái |
|---|---|---|:---:|
| **Format check** | `npm run format:check` | Exit 0 — "All matched files use Prettier code style!" | VERIFIED |
| **Linter** | `npm run lint` | Exit 0 — 0 errors, 0 warnings | VERIFIED |
| **Typecheck** | `npm run typecheck` | Exit 0 — `tsc -p tsconfig.app.json` và `tsconfig.node.json` đạt 0 lỗi | VERIFIED |
| **M7 Test Suites** | `npx vitest run ...` (14 files) | Exit 0 — **14 test files passed, 101 tests passed (100%)** | VERIFIED |
| **Full App Test Suite**| `npm test` | Exit 0 — **111 test files passed, 742 tests passed (100%)** | VERIFIED |
| **Grep Gate 1** | `Select-String -Pattern "useState" ...` | 0 kết quả trong các bảng và badges (hoàn toàn controlled components) | VERIFIED |
| **Grep Gate 2** | `Select-String -Pattern "dangerouslySetInnerHTML" ...` | 0 kết quả — bảo mật XSS an toàn | VERIFIED |
| **Grep Gate 3** | `Select-String -Pattern "as unknown as" frontend/src/shared/hooks/useMediaQuery.ts` | 0 kết quả — không còn type assertion trong hook | VERIFIED |
| **Grep Gate 4** | Không thêm thư viện ngoài | `package.json` giữ nguyên 100%, không thêm runtime hay test dependency | VERIFIED |

---

## 4. Hướng dẫn & Checklist kiểm tra Accessibility thủ công (Manual Checklist)

Do môi trường thực thi CI/Agent là headless container không có thiết bị vật lý (máy tính Windows cài NVDA, iPhone cài VoiceOver, điện thoại Android cài TalkBack), tiêu chí `AC-A11Y-MAN` được phân loại là **ACCEPTED GAP (KG-M7-06)**. Developer / QA cần thực hiện kiểm tra thủ công trên máy thật theo checklist chuẩn hóa dưới đây trước khi phát hành production:

### Checklist kiểm tra thủ công trên thiết bị thật:

1. **Trình đọc màn hình (Screen Readers):**
   - **Windows + NVDA (hoặc JAWS):**
     - Mở trang chi tiết lá số `/app/charts/:id`.
     - Nhấn phím `T` để chuyển giữa các bảng (`<table>`). Kiểm tra NVDA đọc `caption` ("Vị trí hành tinh — Natal Chart, 10 hàng").
     - Dùng tổ hợp `Ctrl + Alt + Mũi tên` để duyệt ô. Kiểm tra NVDA đọc header cột (`th scope="col"`) và header hàng (`th scope="row"`).
     - Với hành tinh nghịch hành, lắng nghe xem có đọc rõ "nghịch hành" thay vì ký tự unicode thô.
   - **macOS / iOS + VoiceOver:**
     - Kích hoạt VoiceOver (`Cmd + F5` trên Mac hoặc 3 lần nút nguồn trên iPhone).
     - Trên iPhone Safari (viewport mobile), vuốt sang phải qua từng thẻ mobile.
     - Xác nhận VoiceOver thông báo "Danh sách, X mục" (nhờ `role="list"` trên thẻ `<ul>`).
     - Với `AspectFilterChip`, xác nhận nút xóa đọc đúng "Xóa bộ lọc theo [Tên hành tinh]".
     - Kiểm tra vùng `aria-live="polite"` đọc thông báo khi áp dụng hoặc xóa bộ lọc.

2. **Kiểm tra độ tương phản màu (Color Contrast):**
   - Dùng công cụ **Colour Contrast Analyser (CCA)** hoặc tab Accessibility trong Chrome/Edge DevTools:
     - Kiểm tra chữ `text-primary` trên nền `surface` / `surface-raised` ở cả **Light Theme** và **Dark Theme**: Đảm bảo tỉ lệ tương phản $\ge 4.5:1$ cho body text và $\ge 3:1$ cho large text.
     - Kiểm tra các Badge góc chiếu: Xác nhận viền/chấm màu sắc có kèm nhãn chữ `text-primary` hoặc text ẩn `sr-only`, không dùng màu đơn lẻ để truyền đạt ý nghĩa.

3. **Hiển thị Glyph đa nền tảng (KG-M2-04):**
   - Mở ứng dụng trên:
     - **Windows 11 (Segoe UI / font hệ thống)**
     - **iOS Safari (Apple Color Emoji vs Text)**
     - **Android Chrome (Noto Color Emoji)**
   - Quan sát 12 ký tự cung hoàng đạo: Nhờ ký tự `\uFE0E` (Text Variation Selector) được cấu hình từ `labels.ts`, các ký tự phải hiển thị dưới dạng glyph đơn sắc nét, không bị hệ điều hành tự động thay thế bằng icon emoji màu mè gây xô lệch dòng.

4. **Thu phóng (Zoom) & Kích thước vùng chạm (Touch Target):**
   - Thu phóng trình duyệt lên **200%**: Kiểm tra bảng dữ liệu có thanh cuộn ngang cục bộ (`overflow-x-auto`), không làm tràn thanh cuộn toàn trang.
   - Giảm chiều rộng viewport xuống **320px**: Kiểm tra layout tự động chuyển sang thẻ mobile (`cards`), các hàng không bị mất nội dung.
   - Kiểm tra nút chọn và `AspectFilterChip`: Đảm bảo chiều cao vùng tương tác tối thiểu đạt **$44\text{px}$** (`min-h-[44px]`) trên mobile.

---

## 5. Known Gaps Registry (M7)

| ID | Vấn đề | Phân loại | Ghi chú & Kế hoạch xử lý |
|---|---|---|---|
| **KG-M7-01** | Không có "orb tối đa" trong VM/Backend (spec §12.4) | Contract Gap | Ghi nhận trong D-M7-2; UI chỉ hiển thị orb thực tế của từng góc chiếu từ ViewModel, không tự tính toán hay bịa orb tối đa ở frontend. |
| **KG-M7-02** | Bộ lọc/selection không tới được người dùng trước S4.8; nút chọn và chip chưa hiện trong app | Phân kỳ tính năng | D-M7-3 quy định nút chọn chỉ render khi parent truyền `onSelect`. `ChartViewerShell` ở M7 chưa truyền prop này. State selection và tương tác hai chiều sẽ được nối vào container ở Sprint F4 S4.8. |
| **KG-M7-03** | `densityMode` không có UI đổi; `locale` chưa dùng | Hoãn (Defer) | State `densityMode` đã đọc chuẩn từ `usePreferenceStore`. Giao diện cài đặt chuyển đổi mật độ hiển thị sẽ được phát triển ở sprint sau. |
| **KG-M7-04** | Ma trận aspect / `grid` chưa làm | Ngoài phạm vi (Out of scope) | M7 tập trung hoàn thiện danh sách góc chiếu ngữ nghĩa dạng bảng và thẻ mobile; ma trận dạng lưới tam giác nằm ngoài phạm vi milestone này. |
| **KG-M7-05** | Nguyên tố cung (`showElement`) và nhóm nhà (`showCategory`) chưa có | Known Gap — KG-M2-02 | ViewModel và từ điển `labels.ts` chưa cung cấp dữ liệu nguyên tố cho cung hoàng đạo hoặc phân loại góc nhà. Hoãn đến khi bổ sung metadata. |
| **KG-M7-06** | Glyph đa nền tảng và kiểm thử trợ năng thủ công chưa kiểm chứng trên thiết bị vật lý thực tế | ACCEPTED GAP — KG-M2-04 / AC-A11Y-MAN | Ký tự cung đã có tiền tố/hậu tố `\uFE0E` từ M2 để chống biến thành emoji. Kiểm thử thủ công bằng NVDA/VoiceOver trên máy tính và điện thoại thật được ghi nhận là Accepted Gap với checklist chi tiết tại Mục 4. |
| **KG-M7-07** | Skip link "Chuyển tới bảng dữ liệu" (F4 plan §29) chưa làm | Known Gap — S4.9 | Sẽ được tích hợp trong milestone hoàn thiện cấu trúc trang tổng thể và phím tắt điều hướng ở Sprint F4 S4.9. |
| **KG-M7-08** | E2E chưa assert bảng dữ liệu (S4.10) | Known Gap — S4.10 | Milestone M7 đã bổ sung integration test đầy đủ. Bộ test Playwright E2E toàn diện cho bảng dữ liệu sẽ được cập nhật tại Sprint F4 S4.10. |
| **KG-M7-09** | `Table` không phải primitive dùng chung (markup nhân ở 3 bảng nhưng dùng `tableStyles.ts`) | Hoãn (Defer) | Markup bảng được chuẩn hóa qua `tableStyles.ts` (`getTableCellPadding`, `TABLE_NUMERIC_FONT`). Việc trừu tượng hóa thành `<Table>` primitive dùng chung cho toàn dự án được hoãn để tránh over-engineering sớm. |
