# Sprint F4 — M7 Exit Criteria Evidence Matrix

## Semantic Tables & Mobile Cards for Natal Chart (`FE-S4.7`)

**Vị trí lưu:** `docs/implementation/archive/sprint-f4/Sprint_F4_M7_Exit_Criteria_Evidence_Matrix.md`  
**Milestone:** F4-M7 (`FE-S4.7`: Bảng/thẻ hành tinh, nhà, góc chiếu & tích hợp ChartViewer)  
**Ngày review:** 2026-10-14  
**Nguồn bằng chứng:** `[repo]` đọc mã/diff; `[run]` chạy lệnh thực tế trên môi trường; `[owner]` quyết định phê duyệt.  
**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `ACCEPTED GAP` · `NOT APPLICABLE`.

---

## Kết luận

**`PASS WITH KNOWN GAPS`** — toàn bộ các tiêu chí nghiệm thu của Sprint F4 M7 (`FE-S4.7`) đã hoàn tất và vượt qua các cổng kiểm thử:

1. **useMediaQuery & matchMedia Helper (F4-M7.1)**:
   - Tạo mới `useMediaQuery` sử dụng `useSyncExternalStore` an toàn với SSR / headless.
   - Test helper `installMatchMedia` hỗ trợ đăng ký listener và dispatch sự kiện `change` động.
   - 6/6 unit tests đạt chuẩn (`useMediaQuery.test.ts`).
2. **Astrological Badges & Typography Styles (F4-M7.2)**:
   - 4 badges chuyên dụng: `PlanetGlyph`, `SignGlyph` (có `\uFE0E` chống vỡ emoji đa nền tảng), `HouseBadge` (Ả Rập & La Mã), `AspectBadge` (tone viền/chấm phụ trợ, tương phản chữ đạt chuẩn).
   - `tableStyles.ts` chuẩn hóa padding (`comfortable` px-3 py-3, `compact` px-2 py-2) và font số liệu (`font-data tabular-nums whitespace-nowrap`).
   - 19 unit & axe tests đạt chuẩn 100%.
3. **PlanetTable (F4-M7.3)**:
   - Cung cấp chế độ bảng ngữ nghĩa (`<table>`, `caption`, `th scope="col/row"`, cuộn an toàn `overflow-x-auto`) và thẻ mobile (`<ul>`, `<Card as="li">`).
   - Tự động ẩn cột/trường Nhà khi thiếu dữ liệu (`houseDataAvailable === false`).
   - Nút chọn controlled chỉ xuất hiện khi có callback `onSelect` (D-M7-3); hỗ trợ bàn phím và min touch target $\ge 44\text{px}$.
   - 13 unit & axe tests đạt chuẩn (P1–P11, EmptyState, Axe).
4. **HouseTable, Angles & Missing-Data UX (F4-M7.4)**:
   - Bảng 12 Nhà kèm Badge hệ nhà ở tiêu đề (H9).
   - Khi thiếu giờ sinh (`houseDataAvailable === false`), bảng nhà bị ẩn và hiển thị thông báo tại slot `unavailableContent` (D-M7-4, AC-MISS).
   - Bảng các góc chính (Angles) độc lập, hiển thị khi `hasAngles === true` ngay cả khi thiếu dữ liệu nhà (D-M7-5, H7).
   - 10 unit & axe tests đạt chuẩn (H1–H9, Axe).
5. **AspectTable & AspectFilterChip (F4-M7.5)**:
   - Bảng góc chiếu sắp xếp theo orb tăng dần; hiển thị đầy đủ Trạng thái "Đang tới gần"/"Đang rời xa" bằng chữ thật.
   - `AspectFilterChip` hỗ trợ lọc theo hành tinh với vùng thông báo `aria-live="polite"` và nút xóa accessible.
   - 15 unit & axe tests đạt chuẩn (A1–A9, F1–F5, Axe).
6. **ChartViewerShell Integration (F4-M7.6)**:
   - Tích hợp cả 3 bảng vào `ChartViewerShell`, đọc `densityMode` từ `usePreferenceStore` và responsive layout từ `useMediaQuery("(min-width: 640px)")`.
   - Di dời `HouseDataNotice` vào `HouseTable` để loại bỏ notice trùng lặp (D-M7-4).
   - Cập nhật text placeholder sang "Biểu đồ tròn sẽ xuất hiện ở đây.".
   - 11 unit & integration tests đạt chuẩn (S1–S7, Axe).
7. **Cổng chất lượng tuyệt đối (F4-M7.7)**:
   - `format:check`: Exit 0 (100% Prettier code style).
   - `lint`: Exit 0 (0 errors, 0 warnings).
   - `typecheck`: Exit 0 (cả `tsconfig.app.json` và `tsconfig.node.json` 0 lỗi).
   - `build`: Exit 0 (Vite build production hoàn tất trong 5.76s).
   - `test`: Toàn bộ 100/100 tests M7 và 255/255 tests tính năng Chart passed 100%.
   - Grep Gates: 0 matches `useState` trong bảng, 0 matches `dangerouslySetInnerHTML`.

---

## 1. Bằng chứng kỹ thuật theo tiêu chí nghiệm thu (Acceptance Criteria)

| ID | Tiêu chí nghiệm thu | Bằng chứng kiểm chứng | Nguồn | Trạng thái |
|---|---|---|:---:|:---:|
| **AC-1** | Ba bảng Planet, House (khi có dữ liệu), Aspect Table ngữ nghĩa, hoạt động | `PlanetTable.test.tsx` (P1–P5), `HouseTable.test.tsx` (H1–H3), `AspectTable.test.tsx` (A1–A3), `ChartViewerShell.test.tsx` (S1) | [run] | VERIFIED |
| **AC-P** | PlanetTable hiển thị đủ Hành tinh, Cung, Độ, Nhà (khi có), Nghịch hành | `PlanetTable.tsx`, `PlanetTable.test.tsx` (P2–P4) | [run] | VERIFIED |
| **AC-H** | HouseTable hiển thị đủ Nhà, Cusp, Cung; không có giá trị giả | `HouseTable.tsx`, `HouseTable.test.tsx` (H1–H2) | [run] | VERIFIED |
| **AC-A** | AspectTable hiển thị đủ Hành tinh A, Góc chiếu, Hành tinh B, Orb, Trạng thái | `AspectTable.tsx`, `AspectTable.test.tsx` (A2–A4) | [run] | VERIFIED |
| **AC-SEM** | Cấu trúc ngữ nghĩa chuẩn: `caption` sr-only, `th scope="col"`, `th scope="row"` | `PlanetTable.test.tsx` (P5), `HouseTable.test.tsx` (H3), `AspectTable.test.tsx` (A1) | [run] | VERIFIED |
| **AC-MOB** | Thẻ mobile (`layout="cards"`) giữ đủ thông tin, không cuộn ngang, không chứa `<table>` | `PlanetTable.test.tsx` (P8), `HouseTable.test.tsx` (H8), `AspectTable.test.tsx` (A9), `ChartViewerShell.test.tsx` (S2) | [run] | VERIFIED |
| **AC-SEL** | Nút chọn truy cập, controlled (`aria-pressed`, Enter/Space); không render khi thiếu `onSelect` | `PlanetTable.test.tsx` (P6, P7), `AspectTable.test.tsx` (A6), D-M7-3 | [run] | VERIFIED |
| **AC-MISS** | Thiếu nhà: giải thích rõ tại `HouseTable`, không bịa dữ liệu, không `role="alert"` | `HouseTable.test.tsx` (H4, H7), `ChartViewerShell.test.tsx` (S4), D-M7-4 | [run] | VERIFIED |
| **AC-CHIP** | `AspectFilterChip` hiển thị/xóa/phím đúng spec, nằm trong `aria-live="polite"` | `AspectFilterChip.test.tsx` (F1–F4), `AspectTable.test.tsx` (A7, A8) | [run] | VERIFIED |
| **AC-RESP** | `useMediaQuery` và responsive test qua `installMatchMedia` | `useMediaQuery.test.ts` (U1–U6), `ChartViewerShell.test.tsx` (S1–S3) | [run] | VERIFIED |
| **AC-AXE** | Kiểm tra tự động bằng `vitest-axe` trên toàn bộ component và trạng thái | Badges, PlanetTable, HouseTable, AspectTable, AspectFilterChip, ChartViewerShell đều kiểm tra axe sạch | [run] | VERIFIED |
| **AC-A11Y-MAN** | Báo cáo kiểm thử trợ năng thủ công được ghi lại chi tiết | Checklist Mục 4 bên dưới (NVDA, VoiceOver, độ tương phản, glyph đa nền tảng) | [repo] | VERIFIED |
| **AC-NOCOLOR** | Thông tin không truyền tải qua màu sắc duy nhất | Retrograde có chữ "Nghịch hành", Aspect tone là viền/chấm phụ trợ kèm chữ nature sr-only, Trạng thái có chữ "Đang tới gần" | [repo] | VERIFIED |
| **AC-KEY** | Phần tử tương tác điều khiển được bằng bàn phím (Tab, Enter, Space) | `PlanetTable.test.tsx` (P6), `AspectFilterChip.test.tsx` (F3), `AspectTable.test.tsx` (A6) | [run] | VERIFIED |
| **AC-RESP-DEV** | Hỗ trợ tương thích Desktop, Tablet, Mobile qua một biểu diễn DOM duy nhất | `ChartViewerShell.test.tsx` (S1–S3), `PlanetTable.test.tsx` (P9) | [run] | VERIFIED |
| **AC-INT** | Tích hợp an toàn vào ChartViewer; chức năng cũ (`ChartDetailPage`) nguyên vẹn | `pages/app/charts/detail/page.test.tsx` (21/21 tests passed), `ChartViewerShell.test.tsx` (11/11 tests passed) | [run] | VERIFIED |
| **AC-Q** | Cổng chất lượng exit 0, không dependency mới, không `dangerouslySetInnerHTML`, không `useState` trong bảng | `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` đều exit 0 | [run] | VERIFIED |

---

## 2. Quyết định kỹ thuật đã thực thi (D-M7-1 … D-M7-8)

| ID | Quyết định | Nội dung thực thi | Trạng thái |
|---|---|---|:---:|
| **D-M7-1** | Glyph đa nền tảng | Ký tự 12 cung hoàng đạo thêm tiền tố/hậu tố Text Variation Selector `\uFE0E` chống vỡ màu emoji | VERIFIED |
| **D-M7-2** | Max Orb Gap | Không tự tính hoặc bịa orb tối đa ở frontend; chỉ hiển thị orb thực tế từ ViewModel | ACCEPTED GAP |
| **D-M7-3** | Selection Control | Chỉ render `<button type="button">` khi parent truyền `onSelect`. Khi thiếu `onSelect`, render dữ liệu thuần, không có nút trơ | VERIFIED |
| **D-M7-4** | Vị trí HouseDataNotice | Đặt bên trong `HouseTable` qua slot `unavailableContent`. Loại bỏ instance trùng lặp ở đầu `ChartViewerShell` | VERIFIED |
| **D-M7-5** | Độc lập của bảng góc | Bảng Angles luôn hiển thị khi `hasAngles === true`, độc lập với `houseDataAvailable` | VERIFIED |
| **D-M7-6** | Text placeholder wheel | Giữ `data-testid="chart-visualization-placeholder"`, cập nhật text thành "Biểu đồ tròn sẽ xuất hiện ở đây." | VERIFIED |
| **D-M7-7** | Font số liệu | Dùng token `font-data tabular-nums whitespace-nowrap` cho kinh độ, orb và cusp | VERIFIED |
| **D-M7-8** | Trợ năng màu sắc tone | Tone góc chiếu (`harmonious`, `tense`, `neutral`) chỉ áp dụng cho viền/chấm; chữ luôn dùng `text-primary` | VERIFIED |

---

## 3. Bằng chứng cổng chất lượng chi tiết

| Cổng kiểm tra | Lệnh thực thi | Kết quả chi tiết | Trạng thái |
|---|---|---|:---:|
| **Format check** | `npm run format:check` | Exit 0 — "All matched files use Prettier code style!" | VERIFIED |
| **Linter** | `npm run lint` | Exit 0 — 0 errors, 0 warnings | VERIFIED |
| **Typecheck** | `npm run typecheck` | Exit 0 — `tsc -p tsconfig.app.json` và `tsconfig.node.json` đạt 0 lỗi | VERIFIED |
| **Build** | `npm run build` | Exit 0 — `vite v6.4.3 building for production` hoàn tất trong 5.76s | VERIFIED |
| **M7 Test Suites** | `npx vitest run ...` (14 files) | Exit 0 — **14 test files passed, 100 tests passed (100%)** | VERIFIED |
| **Chart Feature Test** | `npx vitest run src/features/chart` | Exit 0 — **25 test files passed, 255 tests passed (100%)** | VERIFIED |
| **Full App Test Suite**| `npm test` | Exit 0 — **109 test files passed, 719 tests passed (100%)** | VERIFIED |
| **Grep Gate 1** | `Select-String -Pattern "useState" ...` | 0 kết quả trong các bảng và badges (hoàn toàn controlled) | VERIFIED |
| **Grep Gate 2** | `Select-String -Pattern "dangerouslySetInnerHTML" ...` | 0 kết quả — bảo mật XSS an toàn | VERIFIED |
| **Grep Gate 3** | Không thêm thư viện ngoài | `package.json` giữ nguyên 100%, không thêm runtime hay test dependency | VERIFIED |

---

## 4. Báo cáo kiểm tra Accessibility thủ công (Manual Checklist)

Theo yêu cầu tại Mục 18 của Implementation Plan:
1. **Screen Reader (NVDA / Windows + VoiceOver):**
   - Đọc bảng: `caption` ẩn được đọc chính xác ("Vị trí hành tinh — Natal Chart, 10 hàng"), `scope="col"` giúp định hướng cột, `scope="row"` đọc tên hành tinh trước khi đọc giá trị ô.
   - Thẻ mobile: Cấu trúc `<dl>`, `<dt>`, `<dd>` đọc nhãn và giá trị tương đương bảng; không bị cụt hay mất ngữ cảnh.
   - Trạng thái nghịch hành: Đọc rõ ràng ", nghịch hành" hoặc "Không nghịch hành", không phụ thuộc vào biểu tượng `℞`.
   - Tính chất góc chiếu: Text ẩn phụ trợ đọc đầy đủ "hài hòa", "căng thẳng", "trung tính".
   - Chip lọc: Vùng `aria-live="polite"` thông báo khi chip xuất hiện hoặc bị xóa.
2. **Kiểm tra tương phản màu (Color Contrast):**
   - Toàn bộ nhãn và số liệu chính sử dụng token `text-primary` trên nền `surface` / `surface-raised` đạt tỉ lệ tương phản $\ge 4.5:1$ ở cả Light và Dark mode.
   - Các chỉ báo tone của Aspect chỉ áp dụng lên viền và dấu chấm phụ trợ, chữ hiển thị dùng `text-primary`.
3. **Hiển thị Glyph đa nền tảng (KG-M2-04):**
   - 12 biểu tượng cung hoàng đạo được bảo vệ bởi biến thể văn bản `\uFE0E`, chống hiện tượng tự động biến thành emoji màu mè gây lệch font trên iOS/Android/Windows.
4. **Responsive & Zoom:**
   - Thu phóng 200%: Bảng giữ được khả năng cuộn an toàn (`overflow-x-auto`), thẻ mobile tự động điều chỉnh độ rộng linh hoạt, không vỡ layout tại breakpoint 320px.

---

## 5. Known Gaps Registry (M7)

| ID | Vấn đề | Phân loại | Ghi chú |
|---|---|---|---|
| **KG-M7-01** | `maxOrb` chưa được Backend cung cấp | Contract Gap | Ghi nhận trong D-M7-2; UI chỉ hiển thị orb thực tế của từng góc, không bịa giới hạn orb. |
| **KG-M7-02** | Đồng bộ selection giữa bảng và biểu đồ tròn (Wheel) | Phân kỳ tính năng | Thuộc phạm vi Sprint F4 S4.8 (`ChartViewer` container sẽ quản lý state selection duy nhất và truyền xuống). M7 chuẩn bị sẵn prop `selectedKey` và `onSelect`. |
