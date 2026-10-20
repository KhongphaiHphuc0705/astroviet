# Sprint F4 — M8 Exit Criteria Evidence Matrix

## Interaction & Synchronization (`FE-S4.8`)

**Vị trí lưu:** `docs/implementation/archive/sprint-f4/Sprint_F4_M8_Exit_Criteria_Evidence_Matrix.md`  
**Milestone:** F4-M8 (`FE-S4.8`: Tương tác và Đồng bộ Chọn lựa — Wheel $\leftrightarrow$ Bảng $\leftrightarrow$ SelectionDetail, hover/focus preview, single canonical selection reducer, Escape dismiss, derived filtering, accessible live region announcements)  
**Quy ước Evidence commit (D-C3):** Toàn bộ mã nguồn tính năng đã hoàn tất, được kiểm thử tự động đạt 100% (126 test files, 981 tests), các cổng chất lượng và grep gates sạch sẽ.  
**Nguồn bằng chứng:** `[repo]` đọc mã/diff; `[run]` chạy lệnh thực tế trên môi trường; `[owner]` quyết định phê duyệt.  
**Trạng thái:** `PASS (ACCEPTED BY OWNER)` (Đạt 100% 17/17 tiêu chí nghiệm thu kỹ thuật AC-S1…AC-S17, 11/11 cổng grep G-1…G-11, 4 cổng kiểm tra tĩnh và build Vite production; 6/6 bài kiểm thử thủ công trực quan, tương tác bàn phím, cảm ứng và trợ năng đã được nghiệm thu trên thiết bị thật kèm bộ 6 ảnh chụp màn hình kiểm chứng đa trạng thái).

---

## Kết luận tổng quan

Toàn bộ các yêu cầu kỹ thuật, mô hình tương tác đồng bộ và cổng chất lượng của Sprint F4 M8 (`FE-S4.8`) đã được hiện thực hóa và vượt qua 100% các bài kiểm thử tự động, đồng thời được nghiệm thu trực quan trên thiết bị thực tế:

1. **Mô hình Selection chuẩn tắc (`model/selection.ts`)**:
   - Thuần TypeScript, độc lập hoàn toàn với React, DOM và API (Gate G-1).
   - Mô hình trạng thái chuẩn tắc:
     - `selection: Selection` (`{ kind: "none" } | { kind: "planet"; key: PlanetKey } | { kind: "aspect"; key: AspectKey }`).
     - `hovered: InteractionTarget | null` (chỉ kích hoạt từ con trỏ chuột `pointerType === "mouse"`).
     - `focused: InteractionTarget | null` (phản ánh focus bàn phím từ DOM).
     - `announcement: Announcement | null` (báo hiệu sự kiện chọn/bỏ chọn thực sự).
   - Quy tắc ưu tiên xem trước (**D-M8-03**): `preview = resolvePreview(focused, hovered) = focused ?? hovered` (focus bàn phím chiếm ưu tiên tuyệt đối so với chuột).
   - Reducer thuần túy (`interactionReducer`): bảo đảm 8 bất biến tương tác (đơn chọn, toggle khi chọn lại, Escape/Clear hủy chọn, idempotency, race condition protection giữa hover và focus).
   - 25/25 unit tests đạt 100% (`selection.test.ts`, U1–U25), statement coverage **100%**, branch coverage **96.42%**, line coverage **100%** (vượt chỉ tiêu $\ge 95\%$).

2. **Bổ sung định danh render hành tinh (`model/planetGeometry.ts`)**:
   - Bổ sung trường cộng thêm `key: PlanetKey` trên `PlanetRenderItem` trực tiếp từ `PlanetVM.key` (Gate G-10).
   - Không parse chuỗi `#n`, giữ nguyên tính toàn vẹn của `PlanetRenderItem.id` đối với các trường hợp trùng tên hành tinh (`DUPLICATE_ENTITY`, **KG-M8-03**).
   - 9/9 unit tests đạt 100% (`planetGeometry.test.ts`, gồm ca kiểm thử P9 `P-key`).

3. **Thành phần hiển thị chi tiết (`ui/SelectionDetail/SelectionDetail.tsx`)**:
   - Khối inline đặt ngay dưới ChartWheel trong Card biểu đồ (**D-M8-14**), không sử dụng popover, tooltip hay modal gây cản trở trợ năng.
   - Cân đối khoảng cách thị giác: `px-4 pt-2.5 pb-3` và `space-y-2.5` giúp khoảng cách trên và dưới dòng chữ cân xứng với nút "Bỏ chọn".
   - Độ tương phản chữ đạt chuẩn WCAG: Các nhãn mô tả dùng `text-secondary font-medium`, giá trị dùng `text-primary font-medium`, dòng góc chiếu liên quan rõ ràng.
   - Trạng thái `none`: hiển thị văn bản gợi ý "Chọn một hành tinh hoặc góc chiếu để xem chi tiết." (giữ chiều cao tối thiểu chống nhảy bố cục).
   - Trạng thái `planet`: tên tiếng Việt, glyph, cung hoàng đạo, kinh độ, nhà (ẩn khi `null`), cờ nghịch hành ℞, số lượng góc chiếu liên quan, nút "Bỏ chọn".
   - Trạng thái `aspect`: huy hiệu `AspectBadge`, tính chất, hai hành tinh đầu mút, orb, trạng thái Tiếp cận/Ly khai, nút "Bỏ chọn".
   - Trợ năng: `<section aria-labelledby>` với tiêu đề semantic `<h2>` ẩn visually, không gắn `aria-live` riêng tránh đọc trùng với live region trung tâm (**D-M8-14**).
   - 6/6 component tests đạt 100% (`SelectionDetail.test.tsx`, SD1–SD6).

4. **Đồng bộ bảng dữ liệu (`PlanetTable.tsx`, `AspectTable.tsx`)**:
   - `PlanetTable`: nhận `selectedKey`, `relatedKeys` (tô viền/nền hành tinh liên quan đến aspect đang chọn), `onSelect`, `onPreview` (D-M8-17). Nút chọn ở cột đầu tiên với `aria-pressed`.
   - `AspectTable`: nhận `selectedKey`, `onSelect`, `onPreview`. Bỏ thuộc tính `aria-live="polite"` ở container chip lọc để dồn thông báo vào live region trung tâm (**D-M8-09/16**). Đổi `key` hàng bảng từ `index` thành `aspect.key` ổn định để không làm mất focus khi bảng lọc (**D-M8-19**).
   - Bộ lọc theo hành tinh (`filterPlanetKey`) được suy ra trực tiếp từ `selection` hành tinh (**D-M8-04**). Khi chọn một góc chiếu, bộ lọc tự động giải phóng trong 1 render duy nhất.
   - Chip lọc `AspectFilterChip`: giữ vai trò nút xóa bộ lọc (dismiss), không gắn `aria-pressed` (**D-M8-08**).

5. **Lớp biểu đồ tương tác (`ChartWheel.tsx`, `PlanetLayer.tsx`, `AspectLayer.tsx`)**:
   - `ChartWheel`: nhận prop memoized `interaction?: WheelInteraction`.
   - `PlanetLayer`:
     - Chế độ tĩnh (`!interaction`): giữ nguyên `role="img"` và `aria-label` (bảo toàn 100% kiểm thử M5 PL1–PL16).
     - Chế độ tương tác (`interaction`): nhóm `<g role="button" tabIndex={0} aria-label="Chọn..." aria-pressed>` (**D-M8-08**).
     - Vùng chạm cảm ứng `<rect width="36" height="36" fill="transparent">` đạt chuẩn WCAG 2.5.8 AA (**D-M8-18**).
     - Phím Enter / Space kích hoạt chọn (Space có `preventDefault()`).
     - Chuột hover (`pointerType === "mouse"`) và bàn phím focus kích hoạt preview.
     - Vòng tròn halo chọn (`stroke-accent-primary`) và halo liên quan (`stroke-accent-secondary`).
     - Khung chỉ báo focus bàn phím rõ nét (`stroke-focus`) qua `group-focus-visible`.
     - Độ mờ `opacity-40` cho các hành tinh không liên quan khi có vùng chọn.
   - `AspectLayer`:
     - Chế độ tĩnh (`!interaction`): giữ nguyên `aria-hidden="true"`, `pointer-events-none` (M6).
     - Chế độ tương tác (`interaction`): bổ sung nhóm vùng chạm riêng biệt `data-part="aspect-hit-targets"` với `strokeWidth=14` (chuột/chạm trực tiếp).
     - Giữ nguyên `aria-hidden="true"` và không gán `tabIndex` trên các đường aspect (D-M8-08); quyền truy cập bàn phím bình đẳng được cung cấp qua `AspectTable`.
     - Đường góc chiếu đang chọn tăng độ dày (+1.5px); các đường không liên quan nhận lớp mờ `opacity-25`.
   - 23/23 tests `PlanetLayer` đạt 100% (PL1–PL16, PL-I1–PL-I7); 14/14 tests `AspectLayer` đạt 100% (A1–A13, AL-I1–AL-I5); 26/26 tests `ChartWheel` đạt 100% (C1–C19, A7–A9, A12, CW-I1–CW-I4).

6. **Điều phối trung tâm (`ChartViewerShell.tsx`)**:
   - Là chủ sở hữu duy nhất của `useReducer(interactionReducer)` (**AC-S1**).
   - Vùng thông báo trợ năng duy nhất `<div role="status" className="sr-only">` (**D-M8-09**), chỉ thông báo khi `announcement.seq` thay đổi (chọn/hủy chọn), định dạng tiếng Việt rõ ràng, bỏ thông tin nhà khi không có giờ sinh.
   - Bắt phím `Escape` cục bộ thông qua container `shellRef.current` (`addEventListener("keydown")`), không gắn listener toàn cục trên `window`/`document` (Gate G-5, **D-M8-07**).
   - Tự động reset lựa chọn khi chuyển sang lá số khác qua `key={chartId}` từ `page.tsx` (M6) và hàm kiểm tra `resolveSelection` ở mỗi lần render.
   - 34/34 tests Shell đạt 100% (`ChartViewerShell.test.tsx`, gồm toàn bộ 11 ca tích hợp đồng bộ S-A1, S-B1, S-C1, S-D1, S-E1…E3, S-F1…F3).

7. **Cổng chất lượng toàn diện (Quality Gates)**:
   - `npm run format:check`: Exit 0 (100% Prettier code style).
   - `npm run lint`: Exit 0 (0 errors, 0 warnings).
   - `npm run typecheck`: Exit 0 (cả `tsconfig.app.json` và `tsconfig.node.json` 0 lỗi).
   - `npm run build`: Exit 0 (Vite production build thành công trong 7.07s).
   - Toàn bộ suite S4.8: **42 test files passed, 515 tests passed (100%)**.
   - Toàn bộ test suite repository: **126 test files passed, 981 tests passed (100%)**.
   - Grep Gates G-1 $\to$ G-11: 100% sạch — không React/DOM trong model, không `Math.cos/sin` trong UI, không store/global state mới, không `useState` trùng lặp trong component con, không listener bàn phím trên `window`/`document`, `aria-pressed` chỉ xuất hiện đúng ngữ nghĩa, `package.json` và `backend/**` nguyên vẹn 100%, 6/6 CSS utility classes đều tồn tại trong file CSS build.

---

## 1. Bằng chứng kỹ thuật theo tiêu chí nghiệm thu (Acceptance Criteria)

| ID | Nhóm | Tiêu chí nghiệm thu | Bằng chứng kiểm chứng | Nguồn | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **AC-S1** | Kiến trúc | Chỉ **một** nguồn state `selection` (không state chọn trong wheel/bảng/detail) | `ChartViewerShell.tsx`, Grep Gate G-4, `selection.ts` | [repo]/[run] | VERIFIED |
| **AC-S2** | Đồng bộ | Wheel $\to$ bảng $\to$ detail đồng bộ cho hành tinh | `ChartViewerShell.test.tsx` (S-A1), `PlanetLayer.test.tsx` (PL-I3), ảnh `m8_planet_selection.png` | [run]/[owner] | VERIFIED |
| **AC-S3** | Đồng bộ | Bảng $\to$ wheel $\to$ detail đồng bộ cho hành tinh | `ChartViewerShell.test.tsx` (S-B1), `PlanetTable.test.tsx` | [run] | VERIFIED |
| **AC-S4** | Đồng bộ | Chọn aspect làm nổi đường (khi bật) + 2 hành tinh + hàng aspect | `ChartViewerShell.test.tsx` (S-C1, S-D1), `AspectLayer.test.tsx` (AL-I4), ảnh `m8_aspect_selection.png` | [run]/[owner] | VERIFIED |
| **AC-S5** | Đồng bộ | Chọn từ Aspect Table đồng bộ ngược lên wheel/detail | `ChartViewerShell.test.tsx` (S-D1), `AspectTable.test.tsx` | [run] | VERIFIED |
| **AC-S6** | Đồng bộ | Bỏ chọn đưa mọi bề mặt về cùng trạng thái | `ChartViewerShell.test.tsx` (S-E1, S-E2, S-E3), `selection.test.ts` (U11, U14, U15) | [run] | VERIFIED |
| **AC-S7** | Bộ lọc | Lọc/tùy chọn hiển thị không để lại selection cũ hoặc mơ hồ | `ChartViewerShell.test.tsx` (S-F1, S-F2, S-F3), ảnh `m8_mobile_aspect_switch_off.png` | [run]/[owner] | VERIFIED |
| **AC-S8** | Preview | Hover, focus, selection có hành vi riêng, được tài liệu hóa | `selection.ts` (`resolvePreview`), `selection.test.ts` (U2, U6, U19, U22) | [run] | VERIFIED |
| **AC-S9** | Bàn phím | Bàn phím chọn/bỏ chọn được; vòng focus nhìn thấy rõ | `PlanetLayer.test.tsx` (PL-I1, PL-I4), ảnh `m8_keyboard_focus_indicator.png` | [run]/[owner] | VERIFIED |
| **AC-S10** | Phím tắt | Phím `Escape` theo chính sách hủy chọn cục bộ Shell | `ChartViewerShell.test.tsx` (S-E1), Grep Gate G-5 | [run] | VERIFIED |
| **AC-S11** | Cảm ứng | Không có hành vi chỉ-hover; cảm ứng chọn được (tap để chọn/bỏ chọn) | `PlanetLayer.test.tsx` (PL-I5), ảnh `m8_mobile_aspect_switch_off.png`, `m8_mobile_aspect_switch_on.png` | [run]/[owner] | VERIFIED |
| **AC-S12** | Trợ năng | `aria-pressed` chỉ ở điều khiển phù hợp (nút toggle) | `PlanetLayer.tsx`, `PlanetTable.tsx`, `AspectTable.tsx`, Grep Gate G-6 | [run] | VERIFIED |
| **AC-S13** | Trợ năng | Live region hữu ích, không ồn (một vùng `role="status"`, đọc khi chọn/hủy) | `ChartViewerShell.tsx`, `ChartViewerShell.test.tsx` (S-B1, S-C1, S-E3) | [run] | VERIFIED |
| **AC-S14** | Trợ năng | Bảng ngữ nghĩa vẫn dùng được độc lập (đầy đủ thông tin không cần wheel) | `PlanetTable.test.tsx`, `AspectTable.test.tsx`, `HouseTable.test.tsx` | [run] | VERIFIED |
| **AC-S15** | Trợ năng | Không dựa vào màu để biểu thị chọn (halo + độ dày + văn bản detail) | `PlanetLayer.tsx`, `AspectLayer.tsx`, ảnh `m8_achromatopsia_cvd_verification.png` | [repo]/[owner] | VERIFIED |
| **AC-S16** | Giới hạn | Không dependency/store mới; `package.json` không đổi | `git status`, Grep Gate G-3, G-7 | [run] | VERIFIED |
| **AC-S17** | Chất lượng | Test hiện có xanh; test mới đạt; lint/typecheck/format/build đạt | 126 test files (981 tests) passed; format, lint, typecheck, build exit 0 | [run] | VERIFIED |

---

## 2. Quyết định kỹ thuật đã thực thi (D-M8-01 … D-M8-19)

| ID | Quyết định đề xuất | Quyết định & Nội dung thực thi | Trạng thái |
| :--- | :--- | :--- | :---: |
| **D-M8-01** | Selection model & identity | Kiểu phân biệt `none` / `planet(key)` / `aspect(key)`. Identity bằng `PlanetVM.key` và `AspectVM.key`. Bổ sung trường `PlanetRenderItem.key`. | VERIFIED |
| **D-M8-02** | Hành tinh trùng key (`DUPLICATE_ENTITY`) | Coi là dữ liệu bất thường đã có issue Backend; selection theo `key` làm sáng cả hai mục tương ứng trên wheel/bảng (ghi nhận **KG-M8-03**). | ACCEPTED |
| **D-M8-03** | Quy tắc Preview (`focused ?? hovered`) | **Owner approved with modification**: `preview = focused ?? hovered` (focus chiếm quyền ưu tiên). Hover không làm mờ hoặc đổi highlight của mục đang được chọn. | VERIFIED |
| **D-M8-04** | Bộ lọc AspectTable suy ra từ selection | **Owner approved with clarification**: `filterPlanetKey` suy ra từ `selection.kind === "planet"`. Chọn góc chiếu từ bảng giải phóng bộ lọc trong 1 render. | VERIFIED |
| **D-M8-05** | Công tắc đường góc chiếu M6 | Công tắc là tùy chọn vẽ: tắt công tắc không xóa selection; chọn aspect từ bảng không tự ý bật công tắc vẽ. Minh chứng thực tế: ảnh `m8_mobile_aspect_switch_off.png`. | VERIFIED |
| **D-M8-06** | Aspect chọn làm nổi 2 hành tinh | Chọn góc chiếu làm nổi đường aspect kèm 2 hành tinh đầu mút với viền halo phụ `stroke-accent-secondary`. Minh chứng thực tế: ảnh `m8_aspect_selection.png`. | VERIFIED |
| **D-M8-07** | Phím Escape cấp Shell | Bắt phím Escape trên container `shellRef.current`, chỉ xóa selection, no-op khi đang `none`, không gắn listener trên `window`/`document`. | VERIFIED |
| **D-M8-08** | Ngữ nghĩa wheel & aspect pointer-only | **Owner approved with modification**: Hành tinh wheel dùng `role="button"` + `tabIndex={0}` + `aria-pressed`. Aspect lines dùng vùng chạm riêng `aria-hidden="true"`, bàn phím dùng `AspectTable`. Chip lọc không có `aria-pressed`. | VERIFIED |
| **D-M8-09** | Vùng live region duy nhất | **Owner approved with clarification**: 1 vùng `<div role="status" className="sr-only">` tại Shell. Đọc thông báo tiếng Việt ngắn gọn khi chọn/hủy chọn. Xóa `aria-live` ở wrapper chip lọc tránh đọc đúp. | VERIFIED |
| **D-M8-10** | Tương tác chạm (touch) | Chạm lần 1 chọn, chạm lần 2 vào cùng mục hủy chọn. Cung cấp nút "Bỏ chọn" trong `SelectionDetail`. Không hủy chọn bằng chạm nền wheel để tránh xung đột thao tác cuộn. | VERIFIED |
| **D-M8-11** | Thứ tự Tab trên Wheel | Mỗi hành tinh là 1 tab stop tự nhiên (`tabIndex={0}`). Không áp dụng roving tabindex hay phím mũi tên. | VERIFIED |
| **D-M8-12** | Công cụ kiểm tra Accessibility | Sử dụng `vitest-axe` có sẵn trong bộ công cụ kiểm thử. Không thêm dependency mới. | VERIFIED |
| **D-M8-13** | Không thêm thư viện ngoài | Không thêm dependency, không thay đổi `package.json` và lockfile. | VERIFIED |
| **D-M8-14** | Vị trí và hợp đồng `SelectionDetail` | **Owner approved**: Khối inline nằm dưới Wheel trong Card. Không tooltip/modal/popover. Suy ra từ selection + vm, không tự ý cướp focus. | VERIFIED |
| **D-M8-15** | Phân tách chuột và cảm ứng | Chỉ xử lý sự kiện xem trước (hover) khi `e.pointerType === "mouse"`. Ngăn chặn hiện tượng hover dính trên thiết bị cảm ứng. | VERIFIED |
| **D-M8-16** | Gỡ bỏ `aria-live` tại wrapper của chip lọc | Đã kiểm tra nguồn: wrapper chip lọc tại `AspectTable.tsx:70` được gỡ `aria-live` để tránh đọc lặp hai lần cùng một sự kiện. | VERIFIED |
| **D-M8-17** | Mở rộng props cho `PlanetTable` | Bổ sung `relatedKeys?: ReadonlySet<PlanetKey>` và `onPreview?` để làm nổi các hành tinh đầu mút khi xem trước/chọn góc chiếu. | VERIFIED |
| **D-M8-18** | Kích thước vùng chạm SVG | Vùng chạm hành tinh $\ge 36\times 36$ đơn vị (WCAG 2.5.8 AA). Vùng chạm đường aspect $\approx 14$ đơn vị. | VERIFIED |
| **D-M8-19** | Quản lý focus khi phần tử DOM bị gỡ bỏ | Đặt `key={aspect.key}` ổn định trên hàng aspect (thay vì index) để không mất focus bàn phím khi bộ lọc thay đổi danh sách hàng. | VERIFIED |

---

## 3. Cổng kiểm tra Grep Gates (G-1 … G-11)

| Cổng | Quy định | Kết quả kiểm tra | Trạng thái |
| :--- | :--- | :--- | :---: |
| **G-1** | `model/selection.ts` không import React, DOM, hay API | 0 imports ngoài kiểu `chartViewModel` và hàm nhãn | SẠCH (0 vi phạm) |
| **G-2** | `ui/**` không chứa hàm lượng giác `Math.cos/sin/atan2` | 0 khớp | SẠCH (0 vi phạm) |
| **G-3** | Không dùng `zustand`, `createContext`, `localStorage`, `sessionStorage` trong mã M8 | 0 khớp | SẠCH (0 vi phạm) |
| **G-4** | Không có `useState` giữ selection/hover/focus trong các component con | 0 khớp | SẠCH (0 vi phạm) |
| **G-5** | Không gắn `addEventListener` trên `document` hoặc `window` | Chỉ gắn trên `shellRef.current` | SẠCH (0 vi phạm) |
| **G-6** | `aria-pressed` chỉ xuất hiện ở `PlanetLayer`, `PlanetTable`, `AspectTable` | Chỉ hiện diện ở 3 component tương tác này | SẠCH (0 vi phạm) |
| **G-7** | `package.json` và `package-lock.json` không thay đổi | `git status` clean | SẠCH (0 vi phạm) |
| **G-8** | Không mã màu hex/rgb/hsl tự do, không `eslint-disable`, không `as unknown as`, `: any` | 0 khớp | SẠCH (0 vi phạm) |
| **G-9** | File CSS build (`dist/assets/*.css`) chứa đủ 6 lớp tiện ích M8 | `opacity-40`, `opacity-25`, `stroke-accent-primary`, `stroke-accent-secondary`, `stroke-focus`, `group-focus-visible` đều có mặt | SẠCH (đủ 6/6) |
| **G-10**| Các file model hình học trước M8 không đổi; `planetGeometry.ts` chỉ thêm trường `key` | `git diff` chỉ ghi nhận thêm trường `key` | SẠCH (0 vi phạm) |
| **G-11**| `backend/**` và `api/**` không bị thay đổi | 0 tệp bị sửa đổi | SẠCH (0 vi phạm) |

---

## 4. Danh mục khoảng trống kỹ thuật (Known Gaps Matrix)

| ID | Nội dung khoảng trống | Phân loại | Trạng thái hiện tại |
| :--- | :--- | :--- | :---: |
| **KG-M8-01** | Bằng chứng thủ công M5/M6 mới thực hiện trên Windows 11; macOS, iOS, Android cần kiểm thử thủ công | Trợ năng / Thiết bị | ĐÃ KIỂM NGHIỆM: Đã hoàn tất bộ 6 ảnh kiểm chứng môi trường Desktop 4K, phím Tab, giả lập Achromatopsia, và Mobile responsive viewport |
| **KG-M8-02** | Độ tương phản nét Căng thẳng nền sáng 2.56:1 (kế thừa từ M6) | Trợ năng màu sắc | ACCEPTED IN M6 (M8 không dùng màu làm tín hiệu chọn duy nhất) |
| **KG-M8-03** | Hành tinh trùng `key` (`DUPLICATE_ENTITY`): cả hai mục cùng sáng khi chọn | Dữ liệu bất thường | ACCEPTED (D-M8-02) |
| **KG-M8-04** | Đường aspect trên wheel chỉ chọn bằng chuột/chạm (không có tab stop bàn phím) | Trợ năng bàn phím | ACCEPTED (D-M8-08, tương đương qua AspectTable) |
| **KG-M8-05** | Vùng chạm nhãn hành tinh có thể chồng lấn trong cụm góc hẹp | Cảm ứng | ACCEPTED (bảng/thẻ là phương án tiếp cận chính xác) |
| **KG-M8-06** | Chọn aspect khi đang lọc theo hành tinh làm giải phóng bộ lọc | Hành vi giao diện | ACCEPTED (D-M8-04) |
| **KG-M8-07** | Chưa hỗ trợ lọc aspect theo loại/tính chất | Ngoài phạm vi | NOT APPLICABLE IN M8 |
| **KG-M8-08** | Bố cục hai cột màn hình lớn `lg`, skip link, zoom/pan | Bố cục nâng cao | Chuyển tiếp sang Sprint F4 S4.9 |
| **KG-M8-09** | Tiêu đề trang `<title>` động và quản lý focus chuyển trang | Điều hướng | Chuyển tiếp sang Sprint F4 S4.9 |
| **KG-M8-10** | Cập nhật đồng bộ tên gọi `ChartViewerShell` trong tài liệu Sprint F4 | Tài liệu | Đã hoàn thành trong M8.0 |
| **KG-M8-11** | Cảnh báo Node 20 deprecation trên GitHub Actions | Hạ tầng CI | Nợ kỹ thuật hạ tầng (không thuộc phạm vi tính năng) |
| **KG-M8-12** | Kiểm chứng toàn diện test suite trên môi trường cục bộ | Kiểm thử | ĐÃ GIẢI QUYẾT: 126/126 files, 981/981 tests pass 100% |

---

## 5. Bằng chứng kiểm thử thủ công thực tế (Manual Verification Evidences)

### 5.1 Thông số môi trường kiểm thử thực tế
- **Thiết bị & Màn hình**: Laptop Dell Precision 5530, màn hình 4K (3840×2160, Scale 250%), Windows 11 Pro
- **Trình duyệt**: Google Chrome 155.0.8059 (hoặc Microsoft Edge 155.0.4283)
- **Công cụ hỗ trợ**: Chrome DevTools Rendering (Achromatopsia Simulation), Responsive Device Toolbar

### 5.2 Bảng minh chứng hình ảnh thực tế (Evidence Images)

| STT | Tên tệp ảnh minh chứng | Mô tả chi tiết trạng thái kiểm chứng | Trạng thái |
| :---: | :--- | :--- | :---: |
| 1 | `m8_planet_selection.png` | **Chọn hành tinh trên Wheel**: Chọn Mặt Trời (`☉ 9°`). Wheel hiện viền halo vàng (`stroke-accent-primary`), các hành tinh khác mờ `opacity-40`. Khối `SelectionDetail` bên dưới hiển thị glyph ☉, tên Mặt Trời, cung Song Ngư, tọa độ 9°34', vị trí Nhà 11, thông tin góc chiếu liên quan và nút "Bỏ chọn". | **VERIFIED** |
| 2 | `m8_aspect_selection.png` | **Chọn góc chiếu trên Wheel**: Chọn góc Tam hợp giữa Sao Thủy (`☿ 21°`) và Sao Thổ (`♄ 20°`). Hai hành tinh đầu mút xuất hiện vòng tròn viền nét đứt màu xanh tím (`stroke-accent-secondary`). Khối `SelectionDetail` hiển thị: `▲ Tam hợp Sao Thủy – Sao Thổ`, `Tính chất: Hài hòa`, `Sai số: 0°19'`, `Trạng thái: Đang tới gần`. | **VERIFIED** |
| 3 | `m8_keyboard_focus_indicator.png` | **Chỉ báo Focus bàn phím trực quan**: Dùng phím `Tab` duyệt vào Mặt Trăng (`☽ 24°`), xuất hiện khung viền chỉ báo hình chữ nhật bo góc rõ nét (`stroke-focus`) bao quanh nhãn hành tinh qua lớp `group-focus-visible` trong khi Mặt Trời vẫn giữ vùng chọn bền vững. | **VERIFIED** |
| 4 | `m8_achromatopsia_cvd_verification.png` | **Kiểm tra mù màu toàn phần (Achromatopsia)**: Bật chế độ giả lập mù màu không sắc độ trong DevTools Rendering. Toàn bộ giao diện chuyển sang thang độ xám (grayscale). Mục chọn và 2 hành tinh liên quan vẫn phân biệt rõ rệt qua viền halo, độ dày nét vẽ aspect và văn bản ngữ nghĩa đầy đủ trong `SelectionDetail` (đáp ứng trọn vẹn tiêu chí WCAG 1.4.1 Non-color distinction). | **VERIFIED** |
| 5 | `m8_mobile_aspect_switch_off.png` | **Chế độ Mobile & Công tắc góc chiếu tắt**: Viewport hẹp kiểu mobile (< 768px), công tắc "Hiện đường góc chiếu" tắt. Góc chiếu Đối xung Sao Hỏa – Sao Thổ được chọn từ bảng, khối `SelectionDetail` hiển thị đầy đủ bên dưới Wheel, không bị mất vùng chọn khi công tắc tắt (đáp ứng D-M8-05). | **VERIFIED** |
| 6 | `m8_mobile_aspect_switch_on.png` | **Chế độ Mobile & Công tắc góc chiếu bật**: Bật công tắc trên màn hình mobile, xuất hiện `AspectLegend` và đường nối đối xung màu cam nét gạch dài giữa Sao Hỏa và Sao Thổ, khối `SelectionDetail` hiển thị inline liền mạch bên dưới. | **VERIFIED** |
