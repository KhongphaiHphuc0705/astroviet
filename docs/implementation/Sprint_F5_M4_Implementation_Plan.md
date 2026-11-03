# AstroViet FE Sprint F5 M4 — Selection Synchronization & Navigation Implementation Plan

## 1. Document Metadata

|                     |                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tiêu đề**         | AstroViet FE Sprint F5 M4 — Selection Synchronization & Navigation Implementation Plan                                                                                                                       |
| **Trạng thái**      | **Draft / In Progress — M4.0–M4.1 hoàn tất; tạm dừng chờ Owner review trước M4.2**                                                                                                                           |
| **Ngày**            | 2026-11-03                                                                                                                                                                                                   |
| **Tiên quyết**      | **F5 M3 hoàn tất**: Matrix `ACCEPT WITH KNOWN GAPS`, CI #311 (`2b12485`) và #312 (`1c33436`, `41425503160`) thành công; HEAD audit `dev` @ `01dc8dd` ("[docs] update m3 evidence matrix"), cây làm việc sạch |
| **Vị trí tài liệu** | `docs/implementation/Sprint_F5_M4_Implementation_Plan.md` (quy ước M1–M3: plan milestone là bản thảo tạm, xoá khi đóng; chỉ lưu Evidence Matrix ở `docs/implementation/archive/sprint-f5/`)                  |
| **Nhãn**            | **[V]** đã xác minh (mã/lệnh/tài liệu) · **[P]** đề xuất chờ duyệt · **[O]** cần owner quyết · **[?]** chưa xác minh được                                                                                    |

**Phạm vi.** Đồng bộ chọn Chart Wheel ⇄ Planet Table ⇄ khu vực Diễn giải; hành động **"Đọc diễn giải"** (ở `SelectionDetail`) và **"Xem trên biểu đồ"** (ở mục diễn giải); chính sách focus/cuộn/Escape; xử lý chọn lỗi thời; không thêm live region.

**Kết quả review M3/M4.0–M4.1 (2026-11-03).** M3 được nghiệm thu `PASS WITH GAPS`; KG-F5M3-01 là đúng phạm vi M4. Đối chiếu ma trận M3 với F5 plan phát hiện sai khác tài liệu cần giữ làm ghi chú cho lần cập nhật Evidence Matrix: ma trận M3 ghi 42 test mới trong phần kết luận nhưng 34 test trong closure report; coverage dòng ghi 98% ở kết luận nhưng 96.66% ở closure report; mô tả 14 ảnh nhưng bảng liệt kê 18 mục ảnh. Không sửa hồi tố ma trận đã nghiệm thu. HEAD pre-flight là `01dc8dddfae349f9c735f17e4b6c3b2a35db3044`; blob `selection.ts` là `85691e97ccb09e1edee30195e327b13795954a8c`, blob `interpretation.ts` là `111ccb6cae45d8c7bd0d986391b6fd49a3582c81`; Playwright liệt kê 38 test/7 file. Workspace có plan M4 mới chưa được commit, vì vậy không chạy `git pull`/không yêu cầu cây sạch để tránh đụng tài liệu người dùng vừa thêm. Lần regression đầu lỗi `EPERM` trong thư mục Temp của sandbox; lần chạy lại trong Temp thuộc workspace hoàn tất 30/33 file, 396/404 test pass, 8 test fail và 25 lỗi timeout khởi chạy worker. Lệnh đang ghi trong M4.0 mở rộng thành 33 file/404 test, không phải 20 file/233 test như phần baseline nêu; cần chốt danh sách file regression chính xác trước khi lặp ở M4.7. `npm run test -- --maxWorkers=2` đã khởi chạy nhưng không thu được tổng kết trước khi phiên chạy kết thúc; không xem là pass. `npm run lint` pass; `prettier --check` pass cho Frontend và plan M4. Không có test hay mã ứng dụng nào được thêm ở M4.0–M4.1.

**Ngoại trừ (explicit).** Không sửa `selection.ts`, `interpretation.ts`, API/Backend/nội dung; không dependency/store/event-bus mới; không chọn **góc** (Ascendant) trên wheel (P-02 đã duyệt); không đọc tổng hợp/diễn giải góc chiếu; không E2E mới (thuộc M7); không responsive/a11y hardening sâu (M6); không CHANGELOG/version (M8); không sửa test F4/M3 hiện có ngoài những điều chỉnh có chủ đích được ghi ở Mục 9.

**Tài liệu liên quan [V].** `docs/implementation/Sprint_F5_Implementation_Plan.md` (§7–§8, §10 M4, §15, §17); `archive/sprint-f5/Sprint_F5_M3_Exit_Criteria_Evidence_Matrix.md` (KG-F5M3-01…04); `archive/sprint-f4/Sprint_F4_M8_Exit_Criteria_Evidence_Matrix.md` (D-M8-03/07/09); `docs/frontend/Frontend_Coding_Standards.md`, `Frontend_UI_Specification.md` §7, §23.3.

---

## 2. Executive Summary

**Mục tiêu.** Cho phép người dùng đi qua lại giữa một hành tinh trên biểu đồ/bảng và đoạn diễn giải của nó **mà không mất ngữ cảnh và không bị dời focus bất ngờ**.

**Hành vi người dùng (tóm tắt).**

1. _Chọn_ Mars ở wheel hoặc Planet Table → (như F4) Mars được đánh dấu ở cả hai nơi; **mới**: mục "Sao Hỏa" trong khu vực Diễn giải được đánh dấu "Đang chọn" và **mở ra**; **không** cuộn, **không** dời focus.
2. **"Đọc diễn giải"** (nút mới trong `SelectionDetail`) → mở mục (nếu đang đóng) và **chuyển focus tới nút tiêu đề của mục Mars** (trình duyệt tự cuộn tới đó).
3. **"Xem trên biểu đồ"** (nút mới trong mục diễn giải) → **chuyển focus tới phần tử Mars trên wheel** (hoặc nút Mars ở Planet Table nếu wheel không có phần tử tương tác); **không đổi lựa chọn**.
4. Escape / "Bỏ chọn" → bỏ đánh dấu (như F4); các mục người dùng đã mở vẫn mở.

**Cách tiếp cận [P].** _Không đổi reducer._ `ChartViewerShell` vẫn là chủ duy nhất của `selection`; chỉ **dẫn xuất** `selectedPlanetKey` (biến `filterPlanetKey` đã có) truyền xuống Panel. Điều hướng/focus là **hành động đồng bộ trong event handler** (không effect, không timer): Panel mở `forwardRef` với một phương thức `revealItem`, Shell tìm phần tử biểu đồ bằng thuộc tính dữ liệu định danh (`data-planet`) rồi gọi `.focus()` (cuộn đi kèm). Không có thao tác bất đồng bộ ⇒ không có yêu cầu "lỗi thời" nào có thể hoàn tất muộn.

**Rủi ro chính.** (1) _Focus bị mất_ khi nút trong `SelectionDetail` biến mất lúc Escape (đã tồn tại ở F4 với "Bỏ chọn", M4 thêm một nút nữa). (2) _Escape toàn Shell_ (listener ở gốc Shell) cũng chạy khi focus ở khu vực Diễn giải. (3) `PlanetTable` không có thuộc tính định danh trên nút ⇒ không có đích dự phòng an toàn nếu wheel không tương tác. (4) Chính sách "mở mục khi chọn" trong F5 plan §8.1 viết dưới dạng _hợp_ (không cho thu gọn mục đang chọn) — cần chốt. (5) jsdom không chứng minh được cuộn/focus thật ⇒ cần QA thủ công.

**Căn cứ.** Plan này dựa trên mã và tài liệu đã đọc tại `dev` @ `01dc8dd` (Mục 3, 17); các điểm chưa xác minh được ghi `[?]`; không có mã/test M4 nào tồn tại.

---

## 3. Current-State Audit

### 3.1 Kiến trúc chọn hiện có [V]

| Hạng mục                | Kết quả                                                                                                                                                                                                                                          | Nguồn                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Reducer**             | `interactionReducer(state, action)`; `InteractionState { selection, hovered, focused, announcement }`; `Selection = {kind:"none"} \| {kind:"planet",key} \| {kind:"aspect",key}`; **không có** kind `angle`/`house`                              | `frontend/src/features/chart/model/selection.ts:15–31` (`InteractionTarget` :15, `Selection` :18, `InteractionState` :25) |
| **Hành động**           | `hoverEnter/Leave`, `focusEnter/Leave`, `select`, `clear`, `escape`                                                                                                                                                                              | `selection.ts:32–40` (`InteractionAction`)                                                                                |
| **Bất biến đáng chú ý** | `select` trùng đích **bật/tắt** (chọn Mars lần nữa ⇒ bỏ chọn); `clear`/`escape` khi đã `none` trả về **cùng tham chiếu**; hover/focus không đổi `selection`; `announcement.seq` tăng khi chọn/bỏ chọn                                            | `selection.ts:76–168` (`select` :121, `clear` :144)                                                                       |
| **Chọn lỗi thời**       | `resolveSelection(selection, {planetKeys, aspectKeys})` đưa về `none` nếu khoá không còn                                                                                                                                                         | `selection.ts:180` (`resolveSelection`)                                                                                   |
| **Xem trước**           | `resolvePreview(focused, hovered) = hovered ?? focused` (hover chuột thắng, focus bàn phím là dự phòng — khớp mã; F4 M8 Matrix dòng 25 ghi chiều ngược lại, là lệch tài liệu cũ sau commit `4c7e19f`); `computeEmphasis` thuần theo khoá         | `selection.ts:170, :224`                                                                                                  |
| **Thông báo**           | `buildLiveMessage` ⇒ "Đã chọn {hành tinh} ở {cung}…" / "Đã bỏ chọn." — **một** nguồn                                                                                                                                                             | `selection.ts:276` (`buildLiveMessage`)                                                                                   |
| **Chủ sở hữu state**    | `ChartViewerShell` (`useReducer`); dẫn xuất `effectiveSelection`, `preview`, `emphasis`, `filterPlanetKey`                                                                                                                                       | `ChartViewerShell.tsx:84–112` (`useReducer` :84, `effectiveSelection` :97, `filterPlanetKey` :112)                        |
| **Nguồn chọn**          | wheel `PlanetLayer` (`<g role="button" tabIndex=0 data-planet aria-pressed>` — click/Enter/Space → `onSelect`); `PlanetTable` (`<button aria-pressed aria-label="Chọn {nameVi}">` ở cả bảng và thẻ); `AspectTable`; chip lọc/"Bỏ chọn" → `clear` | `PlanetLayer.tsx:190–195` (`data-planet`, `role="button"`), `PlanetTable.tsx:126, :235` (`aria-pressed`)                  |
| **Đồng bộ hiện có**     | Chọn từ wheel hoặc bảng cùng `dispatch({type:"select"})` ⇒ cả hai hiển thị `aria-pressed`, halo/làm mờ, lọc bảng góc chiếu; `SelectionDetail` hiển thị chi tiết                                                                                  | `ChartViewerShell.tsx:168` (`handleSelectPlanet`); test S-A1, S-B1                                                        |
| **Quyết định gốc**      | D-M8-01 (union & identity), D-M8-03 (hover/focus/selected độc lập), D-M8-04 (lọc dẫn xuất), **D-M8-07 (Escape chỉ reset selection, listener cục bộ ở `shellRef`)**, **D-M8-09 (một live region polite duy nhất)**                                | header `selection.ts`; F4 M8 Matrix dòng 25–71                                                                            |

**Kết luận:** F4 **đã** đồng bộ wheel ⇄ bảng ⇄ chi tiết ⇄ lọc. **Thứ chưa có** là _Panel Diễn giải không biết `selection`_ (M3 cố ý cắt; **KG-F5M3-01**: "chưa đồng bộ selection giữa Biểu đồ/Bảng và Panel Diễn giải").

### 3.2 Kiến trúc Diễn giải (M3) [V]

| Hạng mục          | Kết quả                                                                                                                                                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vị trí            | `frontend/src/features/chart/ui/InterpretationPanel/{InterpretationPanel,InterpretationItem,InterpretationOverview}.tsx`, `interpretationCopy.ts`, `index.ts` (xuất `InterpretationPanel`, `InterpretationPanelProps`)                                                                                            |
| Panel             | `InterpretationPanel({vm, model})` — hàm thường (không `forwardRef`), `expandedIds: ReadonlySet<string>` khởi tạo = nhóm `core`; `toggleItem`; `focusGroup(id)` dùng `headings.current[id]?.focus()` (đồng bộ, trong handler)                                                                                     |
| Item              | `InterpretationItem` — `<article><h4><button aria-expanded aria-controls aria-label=…>…</button></h4><div id hidden>…</div></article>`; **button luôn được render** (chỉ nội dung `hidden` khi đóng); props `id: string`, `expanded`, `onToggle`; **chưa có** `ref`, `selected`, `aria-current`, nhãn "Đang chọn" |
| Mô hình M2        | `InterpretationModel.itemsById`, `groups`, `status`, `issues`; `getInterpretationItemId(planetKey)` → `planet:<Key>` hoặc `angle:Ascendant` hoặc `null` (đã có, **chưa dùng** ở UI)                                                                                                                               |
| Tích hợp          | `ChartViewerShell` render `<InterpretationPanel vm={vm} model={interpretation}/>` **sau** lưới F4 (toàn chiều rộng, P-01); `page.tsx` tính `interpretation` trong memo `mapping`; `reportError` gộp                                                                                                               |
| Điều hướng nội bộ | Link nhóm của Overview: `<a href>` + `preventDefault` + `focus()` tiêu đề nhóm (`tabIndex={-1}`) — _tiền lệ_ cho focus có chủ đích                                                                                                                                                                                |
| Trạng thái        | S-03 (`Alert info`, `role=status`), S-08 (`Alert warning`, `role=alert` — owner đã chấp nhận ở Matrix M3), S-02/S-04/S-05                                                                                                                                                                                         |
| Ràng buộc đã khoá | Test tĩnh `InterpretationPanel.purity.test.ts`: component files **chỉ ASCII**, **cấm chuỗi `selection`**, `onSelect`, `dispatch(`, `useReducer`, import ngoài allowlist; `interpretationCopy.ts` không chứa "giờ sinh"/tiêu đề cấm                                                                                |

### 3.3 `SelectionDetail` [V]

`ui/SelectionDetail/SelectionDetail.tsx` (250 dòng): props `{selection, vm, onClear, className}`; **luôn render một `<section ref tabIndex={-1}>`** ở mọi nhánh (planet/aspect/none) nên `sectionRef` ổn định; nhánh planet có hàng "tên + nút `Bỏ chọn`" và dòng Cung/Độ/Nhà/Góc chiếu; `handleClear` gọi `onClear()` rồi `sectionRef.current?.focus()` — **tiền lệ khôi phục focus** (test S-G3). **Chưa có** nút "Đọc diễn giải". Nó nằm trong thẻ wheel (cột trái, sau `ChartWheel`).

### 3.4 Focus, cuộn, Escape, live region [V]

| Chủ đề                     | Hiện trạng                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tiện ích focus             | `useFocusTrap` (modal); **không** có tiện ích điều hướng chung. Tiền lệ trong chart: `headings.current[id]?.focus()` (M3), `sectionRef.current?.focus()` (F4); `setTimeout(...,0)` chỉ ở `Select`/`LocationSearchField` (không phải mẫu cho M4)                                                                                                                                                                                  |
| Cuộn                       | Không có `scrollIntoView` trong `src` (jsdom cũng **không** có `scrollIntoView` — đã thử); không có CSS `scroll-behavior` ⇒ `focus()` cuộn **tức thời** theo trình duyệt                                                                                                                                                                                                                                                         |
| **Escape**                 | `ChartViewerShell.tsx:194–209` (`shellRef` :194, listener :200): một `keydown` **gốc** gắn vào `shellRef` (div gốc của Shell) ⇒ `dispatch({type:"escape"})` cho **mọi** Escape có đích nằm trong Shell — **gồm cả khu vực Diễn giải** (vì Panel nằm trong div gốc). Escape xoá `selection` (nếu có), không đổi focus. Test: S-E1 (`fireEvent.keyDown(shell,{key:"Escape"})`)                                                     |
| Khu vực Diễn giải & Escape | Disclosure **không** đóng bằng Escape (mẫu APG accordion không có); không có popover/dialog trong khu vực này ⇒ **không có UI "dismissible" nào cần Escape** ngoài việc xoá selection                                                                                                                                                                                                                                            |
| **Live region trước M4**   | Duy nhất `<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">` ở Shell (D-M8-09); `Alert` trong Panel (S-03 `status`, S-08 `alert`) chỉ hiện ở các trạng thái không-sẵn-sàng; các nơi khác ngoài chart (Spinner, Skeleton, Textarea, dialog) không liên quan. Test F4 dùng `screen.getByRole("status")` **số ít** ở trạng thái sẵn sàng ⇒ thêm một `role=status` thứ hai khi có chọn sẽ **làm vỡ test F4** |
| Chọn & focus               | Wheel/bảng: `onFocus` → `focusEnter` (xem trước), `onBlur` → `focusLeave`; chọn **không** dời focus (test S-A1/S-B1 gián tiếp)                                                                                                                                                                                                                                                                                                   |

### 3.5 Hợp đồng/danh tính [V]

- Danh tính chọn: `PlanetKey` (chuỗi, `PlanetVM.key = planetName`, vd. `"Mars"`); wheel `data-planet = item.id` = `planet.key`, hoặc `"{key}#{n}"` cho bản trùng (`planetGeometry.ts:123`); bảng: nút **không** có thuộc tính khoá, `<tr key="{key}#{index}">`.
- Danh tính diễn giải: `InterpretationItemId = "planet:<PlanetName>" | "angle:Ascendant"` (M2); ánh xạ **một chiều** `getInterpretationItemId(planetKey)` kiểm tập 10 hành tinh MVP; khoá lạ ⇒ `null` (không ném lỗi). Không dùng nhãn hiển thị hay chỉ số mảng.
- `isHouseDataAvailable=false`: M2 sinh item hợp lệ nhưng `byHouse` = `unavailable(HOUSE_DATA_UNAVAILABLE)`; Ascendant `unavailable(ANGLE_ABSENT)` — **không** đổi việc đồng bộ hành tinh.
- **Không cần thay đổi API.**

### 3.6 Test hiện có liên quan [V] (chạy lại: **20 file / 233 test pass**)

`selection.test.ts` (25 `it`), `ChartViewerShell.test.tsx` (nhóm S-M8: S-A1, S-B1, S-C1, S-D1, S-E1…S-E3, S-F*, S-G1…S-G3), `SelectionDetail.test.tsx` (7), `PlanetLayer/ChartWheel/PlanetTable` tests, M3: `InterpretationPanel*.test.tsx`, `ChartViewerShell.interpretation.test.tsx` (2 test: panel có/không, thứ tự DOM). Mẫu focus: `S-G3`. Vitest 4.1.10 + RTL + `user-event` + `vitest-axe`; jsdom 29.

### 3.7 Known Gaps liên quan [V]

**KG-F5M3-01** (chính là phạm vi M4); KG-F5M3-02 (câu F4 `HouseDataNotice` — M5); KG-F5M3-03 (spec i18n); KG-F5M3-04 (ảnh 375px S-05); KG-F5-01 (cảnh báo Mặt Trăng, chờ FG-01); F4 KG-M10-03 (E2E chỉ Chrome Desktop; Narrator/thiết bị thật chưa kiểm).

---

## 4. Acceptance Criteria Mapping

**Nguồn thẩm quyền [V]:** `docs/implementation/Sprint_F5_Implementation_Plan.md` §17 "Acceptance Criteria", dòng 487–501 (tài liệu đã commit; được owner xác nhận ở M1–M3). Tiêu chí M4 theo §10: _"AC-13…16, 24…26 (phần bàn phím/focus)"_. Đặc tả hành vi: §8 (đặc biệt §8.2 bước 4–8), quyết định P-02/P-03/P-04/P-06 (§15).

Trích **nguyên văn** (không diễn đạt lại):

| AC        | Nguyên văn                                                                                                         | Nhiệm vụ M4             | Lớp/thành phần                                                                                                                        | Test tự động                                                                              | Thủ công             | Trạng thái / câu hỏi                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **AC-13** | "Chọn Mars ở wheel ⇒ mục Sao Hỏa được đánh dấu (không chỉ màu) và mở"                                              | T1                      | `ChartViewerShell` (dẫn xuất `selectedPlanetKey`) → `InterpretationPanel`/`InterpretationItem` (`aria-current`, nhãn "Đang chọn", mở) | SH-N1, PS-01, IS-01                                                                       | M-01                 | **Rõ**; "mở" xem O-2                                                                                                                        |
| **AC-14** | "Chọn Mars ở Planet Table cho kết quả tương đương AC-13"                                                           | T1                      | cùng đường `select`                                                                                                                   | SH-N2 (điểm vào khác SH-N1)                                                               | M-01                 | Rõ                                                                                                                                          |
| **AC-15** | "\"Đọc diễn giải\" đưa focus tới mục Mars; \"Xem trên biểu đồ\" trả focus về phần tử Mars; selection không đổi"    | T2, T3, T4              | `SelectionDetail` (nút), `InterpretationPanel.revealItem`, `focusChartObject`, `InterpretationItem` (nút)                             | SH-N5, SH-N6, PS-08, FC-01, SD-02                                                         | M-02, M-03           | "phần tử Mars" = phần tử tương tác Mars trên wheel (xem §8.2 bước 7; dự phòng bảng — O-4). "Selection không đổi" = **không dispatch** (O-3) |
| **AC-16** | "Chọn không dời focus/không cuộn; Escape/Bỏ chọn bỏ đánh dấu; không có state selection thứ hai (review mã + test)" | T1, T4, T5, T6, T8      | Shell (một reducer), Panel (không state chọn), Escape listener hiện có                                                                | SH-N1/N2 (`activeElement` không đổi), SH-N8, SH-N9, AR-06, regression `selection.test.ts` | M-04                 | Rõ; Escape: giữ hành vi D-M8-07 (O-5)                                                                                                       |
| **AC-24** | "Heading không nhảy cấp; vai trò/tên truy cập đúng (test)"                                                         | T2/T3 (phần M4)         | nút mới có tên/role đúng; không thêm heading                                                                                          | IS-03, SD-01, IS-A (axe)                                                                  | M-05                 | M3 đã bao phần heading; M4 chỉ thêm tên nút (O-7)                                                                                           |
| **AC-25** | "Không cuộn ngang trang ở 320–375/768/≥1024; khu vực đọc dùng được ở cả ba chế độ F4"                              | T3 (phần M4: dùng được) | layout F4/M3 **không đổi**; "Xem trên biểu đồ" dùng được ở 1 cột                                                                      | không (jsdom không đo bố cục)                                                             | M-06 (375/768/≥1024) | **Một phần**: đo/hardening đầy đủ ở M6; M4 chỉ chứng minh hai nút hoạt động ở mọi chế độ                                                    |
| **AC-26** | "Tab theo thứ tự hợp lý, focus ring nhìn thấy được"                                                                | T4, T6                  | thứ tự DOM giữ nguyên; nút mới dùng pattern `ring-focus`                                                                              | SH-N10 (thứ tự Tab sau điều hướng), IS-A                                                  | M-04, M-05           | Rõ                                                                                                                                          |

**Khoảng trống/mơ hồ cần làm rõ [O]:** (a) AC-13 "mở" và F5 plan §8.1 ("Hiển thị mở = userExpanded ∪ defaultExpanded ∪ {mục của selection}") có thể đọc là _ép mở_ (không cho thu gọn khi đang chọn) hoặc _mở khi đổi chọn_ — O-2; (b) AC-15 "selection không đổi" vs prompt T3 "How the existing chart selection is synchronized" — plan chọn "không dispatch" (O-3); (c) AC-25 một phần thuộc M6 (đã nêu). **Không** thay thế/viết lại bất kỳ AC nào.

**Ngoài danh sách M4 nhưng liên quan:** AC-27 (QA thủ công ghi riêng) — M4 ghi bằng chứng thủ công riêng khỏi bằng chứng tự động; phần chưa kiểm thành Known Gap.

---

## 5. Selection Synchronization Model (T1, T7)

### 5.1 Nguồn sự thật và dòng dữ liệu [P]

- **Một nguồn duy nhất:** `interactionState.selection` trong `ChartViewerShell` (reducer F4). **Không** thêm state chọn, Context, store, event bus; **không** sửa `selection.ts` (blob `85691e97…`, thay đổi cuối ở F4 `4c7e19f`; M4 hoàn tất khi `git diff <SHA gốc> HEAD -- …/selection.ts` rỗng).
- **Dẫn xuất, không sao chép:** Shell đã có `filterPlanetKey` (= khoá hành tinh khi `effectiveSelection.kind==="planet"`, ngược lại `null`). Truyền xuống Panel dưới tên `selectedPlanetKey`. `effectiveSelection` đã qua `resolveSelection` ⇒ chọn lỗi thời tự về `none` **trước** khi tới Panel.
- **Panel dẫn xuất mục được chọn:** `selectedItemId = selectedPlanetKey ? getInterpretationItemId(selectedPlanetKey) : null` (M2); chỉ coi là hợp lệ nếu `model.itemsById[selectedItemId]` tồn tại. Panel **không** import `selection.ts` và **không** nhận `Selection` (giữ ràng buộc purity: không có chuỗi `selection`, `onSelect`, `dispatch(`).
- **Hướng đồng bộ:** _chọn ⇒ Panel_ (một chiều, dẫn xuất). Panel **không** phát sinh chọn (P-04: tiêu đề mục chỉ mở/đóng). Hai hành động mới (`Đọc diễn giải`, `Xem trên biểu đồ`) **không** dispatch `select`/`clear`/`escape`.

### 5.2 Ma trận hành vi theo trạng thái chọn [P]

| #   | Trạng thái chọn                                          | Mục diễn giải                                    | Dấu hiệu ở Panel                                    | "Đọc diễn giải" | Focus/cuộn do việc chọn | Live region                             |
| --- | -------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------- | --------------- | ----------------------- | --------------------------------------- |
| a   | Không chọn (hoặc chọn lỗi thời đã về `none`)             | —                                                | không đánh dấu                                      | ẩn              | không                   | "Đã bỏ chọn." (F4, chỉ khi vừa bỏ chọn) |
| b   | Hành tinh MVP, mục đủ nội dung                           | `planet:<Key>` có                                | nhãn "Đang chọn" + `aria-current="true"` + mở       | hiện            | **không**               | "Đã chọn …" (F4, duy nhất)              |
| c   | Hành tinh MVP, một/mọi phần thiếu hoặc mơ hồ             | có                                               | như b (mục hiện dòng "Chưa có nội dung…" của M3)    | hiện            | không                   | như b                                   |
| d   | Hành tinh MVP, Nhà không khả dụng                        | có                                               | như b; khối "Theo nhà" vẫn ẩn (M3)                  | hiện            | không                   | như b                                   |
| e   | Hành tinh **ngoài** 10 thân (Chiron/Node/Lilith/khoá lạ) | **không** (`getInterpretationItemId` → `null`)   | không đánh dấu, **không ném lỗi**                   | ẩn              | không                   | như b                                   |
| f   | Hành tinh MVP bị trùng tên trong VM (ví dụ hai `Sun`)    | có (hai part `ambiguous`)                        | như c                                               | hiện            | không                   | như b                                   |
| g   | Chọn **góc chiếu**                                       | —                                                | **bỏ** dấu hiệu cũ (nếu có); không đánh dấu mục nào | ẩn              | không                   | "Đã chọn góc chiếu…" (F4)               |
| h   | Panel ở S-03/S-08 (`status==="unavailable"`)             | không có mục                                     | không                                               | ẩn              | không                   | như b                                   |
| i   | `interpretation` không được truyền (Panel không render)  | —                                                | —                                                   | ẩn              | không                   | như b                                   |
| j   | Chọn Ascendant                                           | **không khả thi** (P-02: không có selection góc) | —                                                   | —               | —                       | —                                       |

**Ghi chú:** "Đọc diễn giải" hiển thị khi và chỉ khi Shell xác định có đích: `interpretation` tồn tại **và** `status !== "unavailable"` **và** `itemsById[getInterpretationItemId(key)]` tồn tại. Không dùng nút _vô hiệu hoá có giải thích_ (O-9, khuyến nghị: ẩn, tránh thêm tab-stop không tác dụng).

### 5.3 Ngữ nghĩa "mở khi chọn" [O-2]

F5 plan §8.1 viết: "Hiển thị mở = userExpanded ∪ defaultExpanded(Cốt lõi) ∪ {mục của selection}" và §8.2 bước 4: "được đánh dấu … và **mở**"; §8.2 bước 8: "bỏ đánh dấu; nội dung người dùng đã mở vẫn mở".

| Phương án                          | Hành vi                                                                                                                                       | Ưu                                                                                                        | Nhược                                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **A (đề xuất): mở khi _đổi_ chọn** | Khi `selectedItemId` đổi sang mục X (khác lần trước) ⇒ thêm X vào `expandedIds` **một lần**; sau đó người dùng vẫn thu gọn/mở lại bình thường | Không "bẫy" người dùng (nút mở/đóng của mục đang chọn vẫn hoạt động); đồng nhất với "mở nhiều mục" (P-06) | Không đúng theo nghĩa đen của phép hợp "luôn mở khi đang chọn"                                                  |
| B: ép mở                           | Mục đang chọn luôn hiển thị mở bất kể `expandedIds`                                                                                           | Đúng nghĩa đen của phép hợp                                                                               | Nút mở/đóng của mục đang chọn **không tác dụng** (aria-expanded không đổi khi bấm) ⇒ hành vi khó hiểu, a11y kém |

**Cách cài A [P]:** mẫu React "điều chỉnh state khi props đổi" ngay trong render (không `useEffect`):

```tsx
const [syncedId, setSyncedId] = useState<string | null>(null);
if (selectedItemId !== syncedId) {
  // chỉ khi giá trị dẫn xuất đổi
  setSyncedId(selectedItemId);
  if (selectedItemId) setExpandedIds((cur) => new Set(cur).add(selectedItemId));
}
```

Không effect, không flash đóng→mở, idempotent, không phụ thuộc timer. Bỏ chọn (`selectedItemId` → `null`) chỉ đổi `syncedId`, **không** đóng mục nào.

### 5.4 Dấu hiệu "đang chọn" [P]

- Nút tiêu đề mục: `aria-current="true"` (không dùng `aria-pressed`/`aria-selected` — mục không phải toggle chọn).
- Văn bản hiển thị "Đang chọn" (nhãn `<span>` trong `<h4>`, ngoài `<button>` để tên truy cập của nút không đổi) + viền/nền của `<article>` bằng token — **không chỉ màu**.
- Không có `aria-live`; không thông báo thêm (Mục 6.6).

### 5.5 Phạm vi tương tác ngoài tầm [V]

Không đồng bộ hover/preview từ Panel sang wheel; không đồng bộ mở/đóng ngược lên wheel/bảng; không lưu trạng thái mở/đóng (không `localStorage`, không URL); không chọn từ Panel (P-04).

---

## 6. Navigation and Focus Design (T2–T7)

### 6.1 Nguyên tắc [P]

1. **Chỉ do người dùng kích hoạt** hai nút; chọn một hành tinh **không** dời focus, **không** cuộn (AC-16, P-03).
2. **Đồng bộ trong event handler**: không `useEffect`, `setTimeout`, `requestAnimationFrame`, `queueMicrotask`. Mọi đích điều hướng (nút tiêu đề mục; phần tử wheel/bảng) **đã được mount sẵn** khi nút được bấm (nút tiêu đề luôn render, chỉ nội dung `hidden`), nên `.focus()` có hiệu lực ngay.
3. `.focus()` mặc định **đã cuộn** phần tử vào khung nhìn (instant; repo không đặt `scroll-behavior`) ⇒ không cần `scrollIntoView` (jsdom còn không có hàm này).
4. Thất bại êm: không có đích ⇒ không làm gì, focus giữ nguyên, không ném lỗi, không dispatch.

### 6.2 "Đọc diễn giải" [P]

| Mục                                                                   | Thiết kế                                                                                                                                                                                             |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vị trí                                                                | `SelectionDetail`, nhánh `planet`, cùng hàng tiêu đề với "Bỏ chọn"; thứ tự DOM: **Đọc diễn giải → Bỏ chọn**                                                                                          |
| Điều khiển                                                            | `Button` (shared) `type="button"`, `size="sm"`, `variant="secondary"` (O-1: action, không phải điều hướng URL); nhãn "Đọc diễn giải" (C-16)                                                          |
| Điều kiện                                                             | prop `onReadInterpretation` chỉ được Shell truyền khi có đích (Mục 5.2)                                                                                                                              |
| Handler                                                               | Shell: `handleReadInterpretation = () => { panelRef.current?.revealItem(filterPlanetKey) }`                                                                                                          |
| `revealItem(planetKey)` (Panel, `forwardRef` + `useImperativeHandle`) | `id = getInterpretationItemId(key)`; `node = itemButtons.current[id]`; nếu thiếu `id`/`node`/`!node.isConnected` ⇒ `return false`; ngược lại `setExpandedIds(add id)`; `node.focus()`; `return true` |
| Kết quả                                                               | Focus ở **nút tiêu đề** mục Mars (`aria-expanded="true"`); nội dung mở; selection không đổi                                                                                                          |
| Lặp nhanh                                                             | Idempotent: lần 2 chỉ focus lại cùng nút                                                                                                                                                             |

### 6.3 "Xem trên biểu đồ" [P]

| Mục                                          | Thiết kế                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vị trí                                       | Trong nội dung mở của `InterpretationItem` loại hành tinh (dưới danh sách `dl`); **không** có ở Cung Mọc (không có đích: P-02)                                                                                                                                                                                                                                                                                                     |
| Điều khiển                                   | `Button`/`<button>` nhỏ, nhãn nhìn thấy "Xem trên biểu đồ" (C-15); tên truy cập `Xem trên biểu đồ: {title}` (bắt đầu bằng nhãn nhìn thấy — WCAG 2.5.3; phân biệt 10 nút cùng nhãn — O-7)                                                                                                                                                                                                                                           |
| Chuỗi gọi                                    | Item `onViewOnChart(id)` → Panel `onViewOnChart(item.subject)` → Shell `handleViewOnChart(key)` → `focusChartObject(shellRef.current, key)`                                                                                                                                                                                                                                                                                        |
| `focusChartObject(root, planetKey): boolean` | **(1)** trong `[data-testid="chart-wheel"]` duyệt các phần tử `[role="button"][data-planet]` và chọn phần tử có `dataset.planet === planetKey` (so sánh bằng, không nội suy vào selector, không dùng nhãn); **(2)** nếu không có: nút `button[data-planet-key]` có `dataset.planetKey === planetKey` ở Planet Table/thẻ (cần O-4); **(3)** nếu không có: `false`. Gọi `el.focus()`; trả `true` khi `document.activeElement === el` |
| Làm nổi bật trên biểu đồ                     | Phần tử wheel/bảng nhận focus ⇒ `onFocus` hiện có phát `focusEnter` ⇒ `preview` ⇒ halo/làm mờ (`computeEmphasis`) **mà không** thay đổi `selection`                                                                                                                                                                                                                                                                                |
| Selection                                    | **Không đổi** (AC-15). Lưu ý: `select` trùng đích sẽ **bỏ chọn** (bật/tắt), nên **không** được dùng `select` để "đưa về biểu đồ" (O-3)                                                                                                                                                                                                                                                                                             |
| Thất bại                                     | Không có phần tử đích ⇒ không làm gì; focus ở lại nút "Xem trên biểu đồ"                                                                                                                                                                                                                                                                                                                                                           |

**Vì sao tra DOM bằng thuộc tính dữ liệu:** wheel đã xuất `data-planet` (danh tính ổn định); thêm một _registry ref_ vào `PlanetLayer` (F4, SVG tối ưu) hoặc truyền ref xuyên ba lớp là xâm lấn hơn nhiều so với một phép duyệt DOM chỉ-đọc, đặt trong một hàm thuần có test. Hàm thuần này **không** phụ thuộc chuỗi hiển thị.

### 6.4 Focus, Escape và khôi phục focus (T4, T6) [P]

| Tình huống (focus đang ở…)                                                  | Hành vi khi nhấn Escape (listener F4 ở `shellRef`, giữ nguyên) | Focus sau đó                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phần tử wheel / nút bảng                                                    | `escape` ⇒ xoá chọn (nếu có)                                   | giữ nguyên (phần tử vẫn mount)                                                                                                                                                                                                                              |
| Nút tiêu đề mục Diễn giải / "Xem trên biểu đồ" / link Overview              | xoá chọn (nếu có); mục người dùng mở **vẫn mở**                | giữ nguyên                                                                                                                                                                                                                                                  |
| **"Đọc diễn giải" / "Bỏ chọn"** (nút sẽ biến mất khi `selection` về `none`) | xoá chọn ⇒ nút unmount                                         | **Hiện tại (F4): rơi về `body`**. **Đề xuất M4:** `SelectionDetail` bắt `keydown` Escape trên `<section>` và gọi `sectionRef.current?.focus()` (section luôn mount) ⇒ focus **không** mất; hiệu lực bất kể thứ tự listener (section tồn tại ở cả hai nhánh) |
| Ngoài Shell                                                                 | không liên quan (listener cục bộ)                              | —                                                                                                                                                                                                                                                           |

- **Escape không thể thoát/đóng gì khác trong khu vực Diễn giải** (disclosure không đóng bằng Escape; không dialog/popover) ⇒ không có xung đột "Escape đóng UI" với "Escape xoá chọn".
- **[O-5]** F5 plan §8.2 bước 8 và AC-16 đã quy định Escape xoá chọn; D-M8-07 giữ listener cục bộ ở Shell. Đề xuất **giữ nguyên** (không thu hẹp phạm vi Escape), chỉ **thêm khôi phục focus**. Phương án thay thế (thu hẹp Escape chỉ cho widget biểu đồ) bị loại vì đổi hành vi F4 đã nghiệm thu.
- Sau "Bỏ chọn" bằng chuột: `handleClear` (F4) đã focus section — giữ nguyên.

### 6.5 Chọn lỗi thời và thao tác "muộn" (T7) [P]

| Nguy cơ                                           | Xử lý / bằng chứng                                                                                                                                                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Đổi `chartId`                                     | `page.tsx` đã `key={chartId}` ⇒ Shell/Panel remount: state chọn, `expandedIds`, ref đều reset                                                                                                                                                                                  |
| Refetch cùng chart, hành tinh biến mất            | `resolveSelection` ⇒ `none` trước khi tới Panel ⇒ dấu hiệu biến mất; nút "Đọc diễn giải" biến mất (điều kiện Mục 5.2); `SH-N11`                                                                                                                                                |
| `interpretation` đổi/biến mất khi đang chọn       | `selectedItemId` dẫn xuất lại; mục không còn ⇒ không đánh dấu; nút ẩn; không ném lỗi (`SH-N12`). _Giới hạn đã biết:_ nếu focus đang ở mục vừa bị gỡ khỏi DOM thì rơi về `body` — hiếm (chỉ khi dữ liệu thay đổi lúc đang đọc); **không** tự động "ăn cắp" focus; ghi Known Gap |
| Phần tử đích đã unmount                           | `revealItem` kiểm `node.isConnected`; `focusChartObject` kiểm `isConnected` trước khi gọi `focus()`; trả `false`                                                                                                                                                               |
| Thao tác bất đồng bộ cũ hoàn tất sau thao tác mới | **Không tồn tại**: không có hàng đợi/timer; toàn bộ đồng bộ trong một handler. Chứng minh: `SH-N10` (`vi.useFakeTimers()` ⇒ `vi.getTimerCount()===0` sau khi kích hoạt) + `AR-07` (nguồn M4 không có `setTimeout`/`requestAnimationFrame`/`queueMicrotask`/`useEffect`)        |
| Nhấn lặp/nhanh liên tiếp                          | idempotent (mở thêm cùng id, focus lại cùng nút) — `SH-N10`                                                                                                                                                                                                                    |
| Chọn đổi trong lúc "đang điều hướng"              | không thể xen vào vì không có khoảng chờ; nếu sau này cần bất đồng bộ (ví dụ chờ bố cục ở M6) phải dùng token yêu cầu và huỷ khi có yêu cầu mới (ghi vào bàn giao)                                                                                                             |

### 6.6 Live region và thông báo (T5) [P]

- **Không thêm** `aria-live`/`role=status`/`role=alert` mới. Thông báo duy nhất vẫn là live region của Shell ("Đã chọn {…}"/"Đã bỏ chọn."). Việc đánh dấu Panel dùng `aria-current` + chữ nhìn thấy (tĩnh); hai nút mới chỉ dời focus — trình đọc màn hình đọc tên nút đích (không phát thêm nội dung dài).
- **Không** đọc `bodyText` qua live region; không thông báo khi chọn nếu Panel đang ở trạng thái đóng.
- Cơ sở (trước M4): trong trạng thái sẵn sàng có **đúng một** phần tử live trong cây Shell; `Alert` của Panel (S-03 `status`, S-08 `alert`) chỉ xuất hiện ở trạng thái `unavailable` (không có mục để đồng bộ) ⇒ không cộng dồn với thông báo chọn.
- Kiểm: `SH-N13` đếm `[aria-live],[role="status"],[role="alert"]` = 1 trước/sau chọn, "Đọc diễn giải", "Xem trên biểu đồ", Escape; `AR-06` đối chiếu số lần xuất hiện các token live trong file M4 với đường cơ sở (Panel: 1 `<Alert`).

### 6.7 Bàn phím và thứ tự Tab [P]

Thứ tự DOM hiện hữu được giữ nguyên: _wheel (các nút hành tinh) → SelectionDetail (Đọc diễn giải, Bỏ chọn) → các bảng → khu vực Diễn giải (link nhóm, nút mục, "Xem trên biểu đồ" khi mở)_. Không roving tabindex mới, không phím tắt mới, không bắt `keydown` ngoài Escape của SelectionDetail. Hai nút mới là `<button>` gốc ⇒ Enter/Space hoạt động sẵn; vòng focus theo mẫu `focus-visible:ring-2 ring-focus` (sau fix M3).

---

## 7. Component and File-Level Plan

### 7.1 Hợp đồng [P] (chữ ký; không phải mã triển khai)

```ts
// InterpretationPanel.tsx  — forwardRef (React 18.3)
export interface InterpretationPanelHandle { revealItem(planetKey: string): boolean }
export interface InterpretationPanelProps {
  vm: ChartViewModel;
  model: InterpretationModel;
  selectedPlanetKey?: PlanetKey | null;                // dẫn xuất từ Shell
  onViewOnChart?: (planetKey: PlanetKey) => void;
}
// InterpretationItem.tsx — thêm (đều tuỳ chọn)
selected?: boolean; onViewOnChart?: (id: string) => void;
buttonRef?: (node: HTMLButtonElement | null) => void;   // Panel dùng để đăng ký nút tiêu đề
// SelectionDetail.tsx — thêm
onReadInterpretation?: () => void;
```

Props phẳng (Standards §5.2); **không** truyền `Selection`/`dispatch`.

### 7.2 Danh sách file

| File                                                                                                                                                        | Hành động        | Thay đổi / trách nhiệm                                                                                                                                                                                                       | Phụ thuộc                             | AC            | Test                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------- | -------------------------------------------------------------- |
| `src/features/chart/ui/ChartViewerShell/focusChartObject.ts`                                                                                                | **Tạo** [P]      | Hàm thuần `focusChartObject(root, planetKey)` (Mục 6.3), ≤ ~40 dòng                                                                                                                                                          | DOM, `data-planet`, `data-planet-key` | AC-15         | FC-01…FC-07 (`focusChartObject.test.ts`)                       |
| `…/ChartViewerShell/ChartViewerShell.tsx`                                                                                                                   | Sửa              | `panelRef`; `handleReadInterpretation`; `handleViewOnChart`; tính `canReadInterpretation`; truyền `selectedPlanetKey={filterPlanetKey}`, `onViewOnChart`, `ref` cho Panel; truyền `onReadInterpretation` cho SelectionDetail | Panel, helper                         | AC-13…16      | SH-N*                                                          |
| `…/SelectionDetail/SelectionDetail.tsx`                                                                                                                     | Sửa              | nút "Đọc diễn giải" (nhánh planet, có điều kiện); `onKeyDown` Escape → `sectionRef.focus()`                                                                                                                                  | —                                     | AC-15, 16, 24 | SD-* (`SelectionDetail.interpretation.test.tsx`, **file mới**) |
| `…/InterpretationPanel/InterpretationPanel.tsx`                                                                                                             | Sửa              | `forwardRef` + `useImperativeHandle(revealItem)`; registry `itemButtons`; đồng bộ mở khi đổi chọn (Mục 5.3); truyền `selected`, `onViewOnChart` (chỉ item hành tinh)                                                         | M2 `getInterpretationItemId`          | AC-13…15      | PS-* (`InterpretationPanel.selection.test.tsx`)                |
| `…/InterpretationPanel/InterpretationItem.tsx`                                                                                                              | Sửa              | `selected` ⇒ `aria-current` + nhãn "Đang chọn" + viền; nút "Xem trên biểu đồ" trong nội dung mở; `buttonRef`                                                                                                                 | copy                                  | AC-13, 24     | IS-* (`InterpretationItem.selection.test.tsx`)                 |
| `…/InterpretationPanel/interpretationCopy.ts`                                                                                                               | Sửa              | thêm `selectedBadge` (C-14), `viewOnChart` (C-15) + hàm tên truy cập                                                                                                                                                         | —                                     | AC-23/24      | AR-05 mở rộng                                                  |
| `…/InterpretationPanel/index.ts`                                                                                                                            | Sửa              | export thêm `InterpretationPanelHandle`                                                                                                                                                                                      | —                                     | —             | typecheck                                                      |
| `…/PlanetTable/PlanetTable.tsx`                                                                                                                             | Sửa (nhỏ) [O-4]  | thêm `data-planet-key={planet.key}` lên **hai** nút chọn (bảng và thẻ); không đổi hành vi                                                                                                                                    | —                                     | AC-15         | FC-03/FC-04, SH-N7                                             |
| `…/InterpretationPanel/InterpretationPanel.purity.test.ts`                                                                                                  | Sửa có chủ đích  | thêm AR-06/AR-07/AR-08 (Mục 8); **giữ** mọi cấm cũ (`selection`, `onSelect`, `dispatch(`…)                                                                                                                                   | —                                     | AC-16, 23     | chính nó                                                       |
| `…/ChartViewerShell/ChartViewerShell.navigation.test.tsx`                                                                                                   | **Tạo**          | SH-N1…SH-N13                                                                                                                                                                                                                 | fixtures, MSW không cần               | AC-13…16, 26  | —                                                              |
| `selection.ts`, `interpretation.ts`, `chartViewModel.ts`, `ChartWheel/*`, `AspectTable`, `page.tsx`                                                         | **Không đổi**    | `page.tsx` đã truyền `interpretation` (M3)                                                                                                                                                                                   | —                                     | —             | `git diff` rỗng                                                |
| `shared/ui/*`, `vite.config.ts`, `tsconfig*`, `eslint.config.js`, `package.json`, lockfile, workflows, Backend, `CHANGELOG`, `Frontend_UI_Specification.md` | **Không đổi**    |                                                                                                                                                                                                                              |                                       |               |                                                                |
| `docs/implementation/archive/sprint-f5/Sprint_F5_M4_Exit_Criteria_Evidence_Matrix.md` (+ `evidence/m4_*.png`)                                               | **Tạo khi đóng** | bằng chứng, Known Gaps                                                                                                                                                                                                       |                                       |               |                                                                |
| `docs/implementation/Sprint_F5_M4_Implementation_Plan.md`                                                                                                   | Xoá khi đóng     | quy ước                                                                                                                                                                                                                      |                                       |               |                                                                |

**Không** cần thay đổi bất kỳ **type** công khai nào của model F4/M2. Nếu trong lúc cài đặt thấy cần sửa `selection.ts`/`interpretation.ts` ⇒ **dừng, báo owner** (blocker), không tự sửa.

### 7.3 Ràng buộc đã khoá phải tiếp tục đúng

- 3 file component M3 vẫn **chỉ ASCII**; mọi chuỗi tiếng Việt mới nằm ở `interpretationCopy.ts` (C-14, C-15). Chuỗi "Đọc diễn giải" (C-16) nằm trong `SelectionDetail.tsx` (file F4, quy ước JSX-inline) — hoặc truyền qua prop; xem O-8.
- Không từ `selection`/`onSelect*`/`dispatch(` trong 3 file component M3 (đặt tên: `selectedPlanetKey`, `selected`, `onViewOnChart`).
- Allowlist import (AR-04) đã cho phép `forwardRef`/`useImperativeHandle` (từ `react`) và `../../model/*` (kể cả import giá trị `getInterpretationItemId`) — **không** cần nới allowlist.
- Copy không va chạm F4/E2E: C-14 "Đang chọn", C-15 "Xem trên biểu đồ", C-16 "Đọc diễn giải" **không** chứa "Chi tiết đang chọn"/"Bỏ chọn"/"Chọn …" bắt đầu nút; (đã grep: chưa chuỗi nào trong `src`/`e2e` dùng ba cụm này ngoài `Chi tiết đang chọn`).

---

## 8. Test Plan

Quy ước [V]: Vitest + RTL + `user-event` + `vitest-axe`; `getByRole` ưu tiên; tên `should … when …`; **không** sửa test F4/M3 hiện có (trừ điểm ở Mục 9); fixtures `chartFull`/`chartNoHouses`; model dựng bằng `toChartViewModel` + `buildInterpretationModel` thật; một test = một hành vi. jsdom: `SVGElement.focus()` **hoạt động** (đã thử), `scrollIntoView` **không có** (không dùng).

### 8.1 `focusChartObject.test.ts`

| ID    | Hành vi                       | Assert                                                                                                                    |
| ----- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| FC-01 | Đích wheel                    | DOM có `[data-testid=chart-wheel] [role=button][data-planet="Mars"]` ⇒ trả `true`, `document.activeElement` là phần tử đó |
| FC-02 | Chỉ khớp bằng danh tính       | có hai phần tử `data-planet="Mars"`, `"Mars#2"` ⇒ focus phần tử `"Mars"`; nhãn `aria-label` không được dùng               |
| FC-03 | Dự phòng bảng                 | không có phần tử wheel; có `button[data-planet-key="Mars"]` ⇒ focus nút đó                                                |
| FC-04 | Dự phòng thẻ (<640px)         | tương tự với layout thẻ                                                                                                   |
| FC-05 | Không có đích                 | cả hai vắng ⇒ `false`, `activeElement` **không đổi**, không ném lỗi                                                       |
| FC-06 | Khoá "lạ" / có ký tự đặc biệt | `"x\"]"`, `""` ⇒ `false` (không lỗi selector — vì so sánh `dataset`)                                                      |
| FC-07 | Phần tử đã tách khỏi DOM      | `isConnected=false` ⇒ `false`                                                                                             |

### 8.2 `InterpretationItem.selection.test.tsx`

| ID    | Hành vi                                                                                                                                             | AC        |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| IS-01 | `selected` ⇒ nút có `aria-current="true"`; nhãn chữ "Đang chọn" hiển thị; tên truy cập của nút **không** đổi                                        | AC-13     |
| IS-02 | không `selected` ⇒ không `aria-current`, không nhãn                                                                                                 | AC-13     |
| IS-03 | Nút "Xem trên biểu đồ" chỉ khi có `onViewOnChart` và mục **mở**; tên `Xem trên biểu đồ: {title}`; bấm/Enter/Space gọi handler đúng một lần với `id` | AC-15, 24 |
| IS-04 | Mục đóng ⇒ nút "Xem trên biểu đồ" không truy cập được (`hidden`)                                                                                    | AC-12     |
| IS-05 | `buttonRef` nhận đúng nút tiêu đề; trả `null` khi unmount                                                                                           | AC-15     |
| IS-A  | axe: `selected` + mở, `selected` + đóng                                                                                                             | §23.3     |

### 8.3 `InterpretationPanel.selection.test.tsx`

| ID    | Hành vi                                                                                                            | AC    |
| ----- | ------------------------------------------------------------------------------------------------------------------ | ----- |
| PS-01 | Đổi `selectedPlanetKey` sang `"Mars"` ⇒ mục Sao Hỏa có dấu hiệu và **mở** (trước đó đóng)                          | AC-13 |
| PS-02 | **[O-2/A]** người dùng thu gọn mục đang chọn ⇒ **vẫn đóng**; chọn lại (đổi rồi quay lại) ⇒ mở lại                  | AC-13 |
| PS-03 | Chọn Sun rồi Mars ⇒ dấu hiệu chuyển sang Mars; Sun **vẫn mở** (cộng dồn)                                           | AC-13 |
| PS-04 | `selectedPlanetKey=null` ⇒ dấu hiệu biến mất; mọi mục đã mở **vẫn mở**                                             | AC-16 |
| PS-05 | Khoá ngoài 10 thân (`"Chiron"`) hoặc không có trong model ⇒ không đánh dấu, không ném lỗi, `expandedIds` không đổi | AC-13 |
| PS-06 | `status==="unavailable"` (S-03 và S-08) ⇒ không đánh dấu, không ném lỗi                                            | AC-13 |
| PS-07 | Mục có part thiếu/mơ hồ vẫn được đánh dấu và mở                                                                    | AC-13 |
| PS-08 | `ref.current.revealItem("Mars")` ⇒ `true`; nút tiêu đề Mars là `activeElement`; mục mở (kể cả khi đang đóng)       | AC-15 |
| PS-09 | `revealItem("Chiron")`, `revealItem("")` ⇒ `false`; focus không đổi                                                | AC-15 |
| PS-10 | Sau `rerender` với model không còn mục ⇒ `revealItem` ⇒ `false`, không ném lỗi                                     | AC-15 |
| PS-11 | `onViewOnChart` chỉ được truyền cho mục hành tinh (Cung Mọc **không** có nút)                                      | P-02  |
| PS-12 | Không có timer/raf treo sau `revealItem` (`vi.getTimerCount()===0`)                                                | AC-16 |
| PS-A  | axe: có chọn/không chọn                                                                                            | §23.3 |

### 8.4 `SelectionDetail.interpretation.test.tsx` (file mới; `SelectionDetail.test.tsx` giữ nguyên)

| ID    | Hành vi                                                                                                                      | AC         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | ---------- |
| SD-01 | Nút "Đọc diễn giải" chỉ khi `selection.kind==="planet"` **và** có `onReadInterpretation`; không có ở aspect/none             | AC-15      |
| SD-02 | Bấm/Enter/Space ⇒ handler đúng một lần; **không** gọi `onClear`                                                              | AC-15      |
| SD-03 | Thứ tự DOM: "Đọc diễn giải" trước "Bỏ chọn"                                                                                  | AC-26      |
| SD-04 | Escape khi focus ở "Đọc diễn giải" hoặc "Bỏ chọn" ⇒ `activeElement` là `<section>` (mô phỏng cả trường hợp nút bị gỡ sau đó) | AC-16      |
| SD-05 | Không có prop mới ⇒ DOM tương đương hiện tại (không nút mới)                                                                 | regression |
| SD-A  | axe                                                                                                                          | §23.3      |

### 8.5 `ChartViewerShell.navigation.test.tsx` (tích hợp)

| ID     | Hành vi                                                                                                                                                                                                                                                                                         | AC         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| SH-N1  | **Chọn từ wheel** (Mars) ⇒ bảng `aria-pressed`, panel đánh dấu + mở Mars; `document.activeElement` **vẫn là phần tử wheel**; `window.scrollTo`/`Element.prototype.focus` không được gọi trên phần tử Panel (spy)                                                                                | AC-13, 16  |
| SH-N2  | **Chọn từ Planet Table** ⇒ kết quả tương đương SH-N1; focus ở nút bảng                                                                                                                                                                                                                          | AC-14, 16  |
| SH-N3  | Chọn hành tinh ngoài 10 thân (fixture bổ sung Chiron) và chọn **góc chiếu** ⇒ Panel không đánh dấu, không đổi mở/đóng                                                                                                                                                                           | AC-13      |
| SH-N4  | Chọn Mars hai lần (bật/tắt) ⇒ dấu hiệu bật rồi tắt; mục vẫn mở                                                                                                                                                                                                                                  | AC-16      |
| SH-N5  | **Đọc diễn giải**: có Mars được chọn, mục Mars **đang đóng** (người dùng thu gọn) ⇒ bấm ⇒ nút tiêu đề Mars là `activeElement`, mục mở, `aria-pressed` ở wheel/bảng **vẫn `true`**, live region **không đổi**                                                                                    | AC-15      |
| SH-N6  | **Xem trên biểu đồ**: từ mục Mars ⇒ `activeElement` là phần tử wheel `data-planet="Mars"`; `selection` không đổi (`aria-pressed` giữ nguyên, kể cả khi Mars **chưa** được chọn ⇒ vẫn chưa); halo/emphasis do focus (preview)                                                                    | AC-15      |
| SH-N7  | Dự phòng bảng: chart có wheel không tương tác (mô phỏng `labelStatus: overflow` hoặc gỡ phần tử wheel) ⇒ focus nút bảng Mars                                                                                                                                                                    | AC-15      |
| SH-N8  | **Escape khi focus ở Panel** (nút tiêu đề) ⇒ chọn bị xoá, dấu hiệu biến mất, mục đã mở vẫn mở, **focus không đổi**; live region "Đã bỏ chọn."                                                                                                                                                   | AC-16      |
| SH-N9  | **Escape khi focus ở "Đọc diễn giải"** ⇒ chọn xoá, nút biến mất, `activeElement` là `<section>` của SelectionDetail (không phải `body`)                                                                                                                                                         | AC-16      |
| SH-N10 | **Lặp nhanh/đa đích**: chọn Mars (wheel) → Sun (bảng) → "Đọc diễn giải" ⇒ focus ở mục **Sun**; dùng `vi.useFakeTimers()` ⇒ `vi.getTimerCount()===0`; bấm "Đọc diễn giải" hai lần liên tiếp ⇒ trạng thái như một lần; thứ tự Tab kế tiếp từ nút mục Sun là nút của mục kế tiếp (userEvent `tab`) | AC-15, 26  |
| SH-N11 | **Chọn lỗi thời**: chọn Mars rồi `rerender` với `vm` không còn Mars ⇒ không ném lỗi, dấu hiệu biến mất, "Đọc diễn giải" biến mất                                                                                                                                                                | AC-16      |
| SH-N12 | `interpretation` đổi sang `status:"unavailable"`/bị bỏ ⇒ nút "Đọc diễn giải" ẩn, không ném lỗi, selection không đổi                                                                                                                                                                             | AC-16      |
| SH-N13 | **Không thêm live region**: đếm `[aria-live],[role="status"],[role="alert"]` trong Shell = 1 ở trạng thái sẵn sàng, không đổi sau chọn/Đọc/Xem/Escape; nội dung live không chứa `bodyText`                                                                                                      | AC-16      |
| SH-N14 | Không có `interpretation` ⇒ không nút "Đọc diễn giải" (tương đương F4)                                                                                                                                                                                                                          | regression |

### 8.6 Kiểm tĩnh (mở rộng `InterpretationPanel.purity.test.ts`)

| ID                | Kiểm tra                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AR-06             | Trong file Panel/Item/Overview/copy: số token `aria-live\|role="status"\|role="alert"\|aria-atomic` bằng đường cơ sở M3 (Panel: đúng 1 `<Alert`; không `aria-live`) |
| AR-07             | Trong file component M3 **và** `focusChartObject.ts`: không `setTimeout\|setInterval\|requestAnimationFrame\|queueMicrotask\|useEffect\|useLayoutEffect`            |
| AR-08             | `interpretationCopy.ts` giữ ràng buộc M3 và **thêm**: C-14/C-15 không chứa "Chi tiết đang chọn", "Bỏ chọn", không bắt đầu bằng "Chọn "; không chứa "giờ sinh"       |
| (giữ) AR-01…AR-05 | không đổi; **không** `selection`/`onSelect`/`dispatch(`                                                                                                             |

### 8.7 Kiểm tra bằng chứng không phải test tự động

- `git diff <SHA gốc> HEAD -- frontend/src/features/chart/model/selection.ts frontend/src/features/chart/model/interpretation.ts` **rỗng** (AC-16 "không state selection thứ hai", review mã).
- grep: `grep -rn "useReducer" frontend/src/features/chart/ui/InterpretationPanel` = 0; không `createContext` mới.

### 8.8 Ghi chú phạm vi test

- **Không** thêm E2E ở M4 (O-6): F5 plan §10 đặt "Scenario A (Mars)" ở M7. Lý do: E2E cần Backend thật; hành vi focus/cuộn trong trình duyệt thật được chứng minh bằng QA thủ công có bằng chứng (Mục 10) và sẽ được E2E hoá ở M7.
- Tên test ngắn gọn bằng tiếng Anh `should … when …`, ID ở comment dòng đầu.

---

## 9. Regression Strategy and Intentional Test Changes

| Nhóm                                                                    | Rủi ro                                                                  | Biện pháp                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test F4 Shell** (`ChartViewerShell.test.tsx`: S-M8, S-E*, S-G*, Z-S*) | thêm nút/ phần tử làm trùng `getByRole("button")`/`getByRole("status")` | Shell F4 test **không truyền `interpretation`** ⇒ không có Panel/nút mới (SH-N14 khoá điều này); `getByRole("status")` số ít vẫn đúng (không thêm live)                                                                            |
| `SelectionDetail.test.tsx` (7)                                          | thêm nút                                                                | nút chỉ có khi truyền `onReadInterpretation`; test hiện có không truyền                                                                                                                                                            |
| `PlanetTable.test.tsx`                                                  | thuộc tính mới                                                          | thêm `data-planet-key` không đổi role/tên/`aria-pressed`; test hiện có giữ nguyên                                                                                                                                                  |
| `page.test.tsx` V9 (axe toàn trang)                                     | nút/nhãn mới ảnh hưởng axe                                              | nút mới có tên rõ, không trùng id; chạy lại V9                                                                                                                                                                                     |
| E2E Playwright (38)                                                     | khớp **chuỗi con** không phân biệt hoa/thường                           | tên nút mới không bắt đầu bằng "Chọn "/"Xóa bộ lọc theo"; không chứa "Chi tiết đang chọn"; không thêm heading; (đã kiểm: locator hiện tại dùng `/^Chọn /`, "Bỏ chọn", heading "Chi tiết đang chọn"); xác nhận cuối ở CI `test:e2e` |
| Test M3 (Panel/Item/Overview/purity/Shell.interpretation)               | `forwardRef`, prop tuỳ chọn                                             | giữ nguyên kỳ vọng; thêm test mới ở file mới                                                                                                                                                                                       |
| `selection.test.ts` (25)                                                | —                                                                       | **không đổi**; chạy lại; blob `selection.ts` không đổi                                                                                                                                                                             |

**Thay đổi test có chủ đích (được ghi vào Matrix):** chỉ `InterpretationPanel.purity.test.ts` (thêm AR-06…AR-08; không nới bất kỳ cấm nào). Không sửa/xoá/`skip` test F4 hoặc M3 nào khác; `git diff` trên các `*.test.tsx` F4 phải rỗng.

---

## 10. Manual QA and Evidence Plan

jsdom **không** chứng minh được: cuộn thực tế, vòng focus nhìn thấy, bố cục 320–≥1024, hành vi SVG focus giữa các trình duyệt, trình đọc màn hình. Phần này do **owner** thực hiện trên bản build thật (như F4/M3: Windows 11 + Chrome 155 + Backend thật đã seed), ghi **riêng** khỏi bằng chứng tự động. Ảnh lưu phẳng ở `docs/implementation/archive/sprint-f5/evidence/m4_*.png` (O-11); ghi trong Matrix: commit build, trình duyệt, viewport, theme, hành động. Mục không thực hiện ⇒ `UNVERIFIED` + lý do (không thay bằng ảnh khác).

| ID   | Kịch bản                                              | Các bước chính                                                                            | Phải quan sát                                                                                                                              | AC               | Ảnh (kế hoạch)                                                                     |
| ---- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------- |
| M-01 | Chọn không dời focus/không cuộn                       | Cuộn trang tới giữa; chọn Mars bằng click ở wheel; lặp lại bằng nút ở Planet Table        | Panel (ở cuối trang) đánh dấu "Đang chọn" + mở mục Mars; vị trí cuộn **không đổi**; focus ring vẫn ở phần tử vừa bấm                       | AC-13, 14, 16    | `m4_select_from_wheel.png`, `m4_select_from_table.png` (ghi vị trí cuộn trước/sau) |
| M-02 | "Đọc diễn giải" bằng bàn phím                         | Tab tới "Đọc diễn giải" → Enter                                                           | Trang cuộn tới mục Mars; **vòng focus nằm ở nút tiêu đề mục Mars**; mục mở; Mars vẫn được chọn ở wheel/bảng                                | AC-15, 26        | `m4_read_interpretation_focus.png`                                                 |
| M-03 | "Xem trên biểu đồ"                                    | Mở mục Mars (đã đang chọn) → Tab/Enter "Xem trên biểu đồ"; lặp lại khi Mars **chưa** chọn | Focus ring ở nút Mars trên wheel + halo xem trước; `aria-pressed` không đổi; trang cuộn tới wheel                                          | AC-15            | `m4_view_on_chart_selected.png`, `m4_view_on_chart_unselected.png`                 |
| M-04 | Escape & thứ tự Tab                                   | Escape khi focus ở: wheel, nút mục diễn giải, "Đọc diễn giải"; sau đó Tab                 | Selection xoá, dấu hiệu bỏ; mục đã mở vẫn mở; focus **không** rơi về đầu trang (kể cả khi nút "Đọc diễn giải" biến mất); thứ tự Tab hợp lý | AC-16, 26        | `m4_escape_from_read_button.png` (ghi phần tử đang focus)                          |
| M-05 | Focus ring nút mới (sáng/tối)                         | Tab tới "Đọc diễn giải", tiêu đề mục, "Xem trên biểu đồ" ở cả hai theme                   | Vòng focus nhìn thấy; **ghi nhận** độ tương phản theme sáng (Known Gap hiện có, KG-F5M3)                                                   | AC-26            | `m4_focus_ring_dark.png`, `m4_focus_ring_light.png`                                |
| M-06 | Responsive                                            | Lặp M-02/M-03 ở 375, 768, ≥1024 và zoom 200%                                              | Cả hai nút dùng được; không cuộn ngang trang; đích hiện trong khung nhìn                                                                   | AC-25 (một phần) | `m4_responsive_375.png`, `m4_responsive_768.png`, `m4_responsive_1500.png`         |
| M-07 | Trình đọc màn hình (Narrator/NVDA)                    | Chọn Mars; "Đọc diễn giải"; "Xem trên biểu đồ"                                            | Chỉ nghe thông báo "Đã chọn …" **một lần**; khi dời focus nghe tên nút đích; không đọc dài nội dung                                        | AC-16, 24        | ghi chú văn bản (không ảnh)                                                        |
| M-08 | Dự phòng khi wheel không tương tác (nếu tái lập được) | Viewport rất hẹp/nhãn tràn khiến wheel không có nút                                       | "Xem trên biểu đồ" đưa focus tới nút Mars ở bảng; nếu không tái lập được ⇒ `UNVERIFIED` + dựa vào FC-03/FC-04/SH-N7                        | AC-15            | `m4_fallback_table.png` hoặc ghi chú                                               |

Phạm vi trình duyệt: Chrome Desktop (như F4 KG-M10-03); Firefox/Safari/thiết bị thật **không** nằm trong M4 — ghi Known Gap.

---

## 11. Quality Gates and Verification Commands

Chạy tại `frontend/` (lệnh lấy từ `package.json`/`frontend-ci.yml`). Phần không chạy được trong sandbox/cục bộ ghi là bằng chứng CI/owner. **Baseline đo tại `01dc8dd`: 139 file / 1129 test case Vitest (`vitest list`), 38 E2E / 7 file (`playwright --list`).** Nhóm test liên quan đã chạy: 20 file / 233 test pass.

| Gate               | Lệnh                                                                                                                                                                                                 | Mong đợi                                                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format             | `npm run format:check`                                                                                                                                                                               | pass                                                                                                                                                                                     |
| Lint               | `npm run lint`                                                                                                                                                                                       | 0 lỗi mới (gồm `react-hooks/exhaustive-deps` cho `useImperativeHandle`/`forwardRef`, `import/order`, `jsx-a11y`)                                                                         |
| Typecheck          | `npm run typecheck`                                                                                                                                                                                  | exit 0                                                                                                                                                                                   |
| Test mới           | `npx vitest run src/features/chart/ui/ChartViewerShell src/features/chart/ui/SelectionDetail src/features/chart/ui/InterpretationPanel src/features/chart/ui/PlanetTable`                            | xanh                                                                                                                                                                                     |
| Hồi quy F4/M3      | `npx vitest run src/features/chart src/pages/app/charts src/app/chart-flow.integration.test.tsx src/app/saved-charts-flow.integration.test.tsx src/app/router.test.tsx`                              | xanh, **không sửa test F4/M3** (trừ purity có chủ đích)                                                                                                                                  |
| Reducer            | `npx vitest run src/features/chart/model/selection.test.ts` + `git diff <SHA gốc> HEAD --` `selection.ts`, `interpretation.ts`                                                                       | 25 test xanh; diff **rỗng**                                                                                                                                                              |
| Toàn bộ            | `npm test`                                                                                                                                                                                           | xanh; kỳ vọng **144 file** (139 + 5 file mới) và 1129 + số test mới; số thật ghi ở Matrix                                                                                                |
| Coverage từng file | `npx vitest run --coverage --coverage.include=<file> --coverage.reporter=text <các file test>` cho `focusChartObject.ts`, `InterpretationPanel.tsx`, `InterpretationItem.tsx`, `SelectionDetail.tsx` | báo dòng/nhánh/hàm + dòng chưa phủ; mục tiêu nội bộ ≥ 90% dòng cho file **mới** (UI Spec §23.3 không đặt % cứng); gap nào ≥ 1 phải được giải thích đúng (hành vi thật ≠ nhánh phòng thủ) |
| Build              | `npm run build`                                                                                                                                                                                      | exit 0                                                                                                                                                                                   |
| E2E                | `npm run test:e2e` (CI) / `CI=1 npx playwright test --list`                                                                                                                                          | 38 test xanh trên CI; **không đổi** `e2e/*`                                                                                                                                              |
| Grep an toàn       | `grep -rn "dangerouslySetInnerHTML" src`; `grep -rn "useReducer" src/features/chart/ui/InterpretationPanel`; `grep -rnE "setTimeout                                                                  | requestAnimationFrame                                                                                                                                                                    | queueMicrotask" src/features/chart/ui/InterpretationPanel src/features/chart/ui/ChartViewerShell/focusChartObject.ts` | 0   |
| CI                 | `frontend-ci.yml` job `build` trên commit mã cuối                                                                                                                                                    | xanh (URL run vào Matrix)                                                                                                                                                                |
| Biên kiến trúc     | không có công cụ (`boundaries/element-types` = `off`) ⇒ AR-02/AR-04/AR-06/AR-07                                                                                                                      | pass                                                                                                                                                                                     |

Không nới gate, không `skip/only`, không tắt rule lint.

---

## 12. Risks and Dependencies

| ID   | Rủi ro                                                                                                           | Khả năng               | Tác động          | Phát hiện                       | Giảm thiểu                                                                                             | Chặn?                      |
| ---- | ---------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------- |
| R-01 | **Mất focus khi Escape lúc focus ở nút trong `SelectionDetail`** (đã tồn tại với "Bỏ chọn"; M4 thêm nút thứ hai) | Cao                    | Trung bình (a11y) | SD-04, SH-N9, M-04              | `onKeyDown` Escape → focus `<section>` (Mục 6.4)                                                       | Không                      |
| R-02 | Escape ở khu vực Diễn giải xoá chọn (listener ở gốc Shell) gây bất ngờ                                           | Trung bình             | Thấp–Trung bình   | SH-N8, M-04                     | Giữ hành vi F4/AC-16; ghi rõ; không đổi focus; mục đã mở vẫn mở (O-5)                                  | Không (nhưng O-5 cần chốt) |
| R-03 | Không có đích dự phòng an toàn (nút bảng không có khoá định danh)                                                | Trung bình             | Thấp              | FC-03/04, SH-N7                 | thêm `data-planet-key` (O-4); không có thì chỉ dùng wheel, không đoán theo nhãn                        | Không                      |
| R-04 | Hồi quy test F4 (`getByRole("status")` số ít, tên nút, `getByText`)                                              | Thấp                   | Cao               | regression, V9, CI E2E          | Shell F4 test không truyền `interpretation`; không thêm live region; tên nút mới không va chạm (Mục 9) | Có nếu xảy ra              |
| R-05 | Ngữ nghĩa "mở" (ép mở vs mở khi đổi) hiểu sai AC-13                                                              | Trung bình             | Trung bình        | PS-02                           | chốt O-2 trước M4.3                                                                                    | Có (cho M4.3)              |
| R-06 | `select` trùng đích bật/tắt ⇒ nếu "Xem trên biểu đồ" dispatch `select` sẽ **vô tình bỏ chọn**                    | Trung bình nếu cài sai | Cao               | SH-N6 (aria-pressed giữ nguyên) | cấm dispatch trong hai nút (AR-02 + SH-N6)                                                             | Có nếu xảy ra              |
| R-07 | jsdom không chứng minh cuộn/focus thấy được                                                                      | Chắc chắn              | Trung bình        | —                               | M-01…M-06 có ảnh; phần thiếu ⇒ `UNVERIFIED`/Known Gap                                                  | Không                      |
| R-08 | Khác biệt SVG focus giữa trình duyệt (Safari/Firefox)                                                            | Thấp                   | Trung bình        | —                               | giới hạn Chrome Desktop (KG-M10-03); ghi Known Gap                                                     | Không                      |
| R-09 | Người dùng thấy halo (preview) nhưng không thấy "đã chọn" sau "Xem trên biểu đồ" khi mục chưa được chọn          | Trung bình             | Thấp              | M-03                            | ghi rõ trong tài liệu hành vi; đánh giá lại ở M6 nếu gây nhầm                                          | Không                      |
| R-10 | Dữ liệu diễn giải đổi khi đang đọc ⇒ focus ở mục bị gỡ rơi về `body`                                             | Rất thấp               | Thấp              | SH-N12                          | không "ăn cắp" focus; Known Gap                                                                        | Không                      |
| R-11 | Trượt phạm vi sang M5 (trạng thái/copy) hoặc M6 (responsive/a11y sâu)                                            | Trung bình             | Trung bình        | review diff                     | Mục 1 + Mục 7 (danh sách file)                                                                         | Có nếu xảy ra              |
| R-12 | `forwardRef`/`useImperativeHandle` sai deps hoặc lộ ref nhạy cảm                                                 | Thấp                   | Thấp              | lint, PS-08/09/10               | chỉ lộ `revealItem`; deps rõ; không lộ DOM                                                             | Không                      |
| R-13 | Test purity bị kích hoạt bởi từ `selection` trong comment/tên                                                    | Trung bình             | Thấp              | purity test                     | đặt tên `selectedPlanetKey`/`selected`; không dùng từ trong comment ở 3 file                           | Không                      |
| R-14 | Focus ring theme sáng ≈ 2:1 (Known Gap hiện có) khiến bằng chứng M-05 "nhìn thấy" bị tranh cãi                   | Chắc chắn              | Thấp–Trung bình   | M-05                            | ghi nhận trung thực; xử lý token ở M6/quyết định owner                                                 | Không                      |
| R-15 | Bản trùng hành tinh (`data-planet="Sun#2"`)                                                                      | Rất thấp               | Thấp              | FC-02                           | so sánh bằng khoá; bản đầu tiên là `"Sun"`                                                             | Không                      |

**Phụ thuộc:** M2 (`getInterpretationItemId`, `itemsById`), M3 (Panel/Item), F4 (`selection.ts`, wheel `data-planet`, Escape listener) — **đều đã hoàn tất**; không phụ thuộc Backend/API mới.

---

## 13. Owner Decisions

Theo yêu cầu review/triển khai ngày **2026-11-03**, áp dụng mặc định đề xuất ở các quyết định dưới đây. O-2/O-3/O-5 được giải quyết trước M4.3; O-4 được chốt trước M4.2. Đây là quyết định triển khai trong phạm vi F5 M4, không thay đổi AC hay hợp đồng API.

| ID       | Quyết định                                                                        | Lựa chọn                                                                                                                                  | Đề xuất                                                                                                                                                                                                                                    | Chặn?              |
| -------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| **O-1**  | Loại điều khiển của "Đọc diễn giải"/"Xem trên biểu đồ"                            | (a) `<button>` (hành động); (b) `<a href>` như link nhóm Overview                                                                         | **ĐÃ CHỐT (a)** — đây là hành động không có URL đích; giữ URL/lịch sử và hỗ trợ Enter/Space tự nhiên                                                                                                                                       | Không              |
| **O-2**  | Ngữ nghĩa "mở khi chọn"                                                           | (A) mở khi _đổi_ chọn, người dùng vẫn thu gọn được; (B) ép mở                                                                             | **ĐÃ CHỐT (A)** — thêm mục được chọn vào tập mở một lần khi selection đổi; thao tác thu gọn của người dùng được tôn trọng cho tới lần selection đổi tiếp theo. Đã cập nhật F5 plan §8.1                                                    | **Đã giải quyết**  |
| **O-3**  | "Xem trên biểu đồ" và selection                                                   | (a) **không dispatch**, chỉ dời focus (halo do preview); (b) `select` nếu chưa chọn                                                       | **ĐÃ CHỐT (a)** — tuân AC-15; gọi `select` cùng đích có thể bật/tắt và vô tình bỏ chọn                                                                                                                                                     | **Đã giải quyết**  |
| **O-4**  | Thêm `data-planet-key` vào nút chọn của `PlanetTable` (F4) làm đích dự phòng      | (a) thêm (2 chỗ, chỉ thuộc tính); (b) không, chỉ dùng wheel                                                                               | **ĐÃ CHỐT (a)** — thuộc tính định danh thuần, tạo fallback khi wheel không có đích tương tác mà không đổi hành vi chọn                                                                                                                     | Đã chốt trước M4.2 |
| **O-5**  | Escape trong khu vực Diễn giải                                                    | (a) giữ hành vi F4 (xoá chọn) + **khôi phục focus về `SelectionDetail` section** khi nút bị gỡ; (b) thu hẹp Escape chỉ cho widget biểu đồ | **ĐÃ CHỐT (a)** — giữ D-M8-07/AC-16; section luôn mount nên làm đích focus ổn định sau khi nút kích hoạt bị gỡ                                                                                                                             | **Đã giải quyết**  |
| **O-6**  | E2E                                                                               | (a) hoãn tới M7; M4 = jsdom + QA thủ công; (b) thêm spec ở M4                                                                             | **ĐÃ CHỐT (a)** — theo phân chia milestone của F5 plan; không nhân đôi E2E ngoài thứ tự phụ thuộc                                                                                                                                          | Không              |
| **O-7**  | Tên truy cập nút "Xem trên biểu đồ"                                               | (a) `Xem trên biểu đồ: {tên}` (chứa nhãn nhìn thấy); (b) chỉ nhãn trơn                                                                    | **ĐÃ CHỐT (a)** — phân biệt các nút cùng nhãn và tên truy cập bắt đầu bằng nội dung nhìn thấy                                                                                                                                              | Không              |
| **O-8**  | Copy C-14 "Đang chọn", C-15 "Xem trên biểu đồ", C-16 "Đọc diễn giải"; vị trí C-16 | duyệt nguyên văn; C-16 inline hoặc trong copy module                                                                                      | **ĐÃ CHỐT:** C-14 = **"Đang chọn"**, C-15 = **"Xem trên biểu đồ"**, C-16 = **"Đọc diễn giải"**. C-14/C-15 ở `interpretationCopy.ts`; C-16 inline trong `SelectionDetail.tsx` theo quy ước F4. Không đưa nội dung mới khác vào component M3 | Không              |
| **O-9**  | "Đọc diễn giải" khi không có đích                                                 | (a) ẩn; (b) vô hiệu hoá + giải thích                                                                                                      | **ĐÃ CHỐT (a)** — không tạo thêm tab stop không có hành động                                                                                                                                                                               | Không              |
| **O-10** | Phương thức điều hướng Shell→Panel                                                | (a) `forwardRef` + `revealItem` (đồng bộ); (b) prop "yêu cầu điều hướng" + effect                                                         | **ĐÃ CHỐT (a)** — khớp hành vi đồng bộ, không thêm effect/timer hoặc state yêu cầu treo                                                                                                                                                    | Không              |
| **O-11** | Nơi lưu ảnh M4                                                                    | `archive/sprint-f5/evidence/m4_*.png` (phẳng như F4/M3)                                                                                   | **ĐÃ CHỐT** — dùng thư mục evidence chung, tên file có tiền tố M4; chỉ lưu bằng chứng thực tế                                                                                                                                              | Không              |

---

## 14. Implementation Sequence

Tuần tự; mỗi bước có tiêu chí thoát. Commit: mã `[feat]` (mỗi bước một commit hoặc gộp hợp lý, chỉ file thuộc bước); `[docs]` riêng cho Matrix/xoá plan; trước commit `git diff --cached --stat`.

| ID       | Mục tiêu                                  | Files                                                                                                | Việc chính                                                                                                                                                                                                                         | Tiên quyết                              | Xác minh                                        | Tiêu chí thoát                                                |
| -------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| **M4.0** | Pre-flight                                | —                                                                                                    | Ghi SHA gốc/blob; xác minh `playwright --list` (38); thử regression; giữ file plan mới của workspace (không pull/không đòi cây sạch). Vitest `list` phát hiện tập rộng hơn dự tính; regression command cần được thu hẹp trước M4.7 | hoàn tất một phần; baseline rõ giới hạn | lệnh                                            | ghi nhận tại Kết quả review đầu tài liệu; test run không pass |
| **M4.1** | Chốt quyết định + copy                    | plan                                                                                                 | O-1…O-11; cập nhật F5 plan §8.1 theo O-2(A); duyệt C-14…C-16                                                                                                                                                                       | M4.0                                    | review                                          | O-2/O-3/O-5 đã chốt; copy đã chốt, chưa thêm mã               |
| **M4.2** | Đích điều hướng biểu đồ                   | `focusChartObject.ts`, `PlanetTable.tsx` (+thuộc tính), `focusChartObject.test.ts`                   | hàm thuần + `data-planet-key`                                                                                                                                                                                                      | M4.1                                    | FC-01…FC-07 + `PlanetTable.test.tsx` giữ nguyên | xanh                                                          |
| **M4.3** | Item/Panel: chọn → đánh dấu + mở + reveal | `InterpretationItem.tsx`, `InterpretationPanel.tsx`, `interpretationCopy.ts`, `index.ts`, 2 test mới | `selected`/`aria-current`/nhãn; adjust-state khi đổi chọn; registry nút; `forwardRef`+`revealItem`; nút "Xem trên biểu đồ"                                                                                                         | M4.1                                    | IS-_, PS-_ + test M3 không đổi                  | xanh, purity còn xanh                                         |
| **M4.4** | SelectionDetail                           | `SelectionDetail.tsx`, test mới                                                                      | nút "Đọc diễn giải" (có điều kiện); Escape → focus section                                                                                                                                                                         | M4.1                                    | SD-* + `SelectionDetail.test.tsx` giữ nguyên    | xanh                                                          |
| **M4.5** | Tích hợp Shell                            | `ChartViewerShell.tsx`, `ChartViewerShell.navigation.test.tsx`                                       | `panelRef`, handlers, truyền props; điều kiện `canReadInterpretation`                                                                                                                                                              | M4.2–M4.4                               | SH-N1…SH-N14 + toàn bộ test F4 Shell            | xanh; không sửa test F4                                       |
| **M4.6** | Tính chất & kiểm tĩnh                     | `InterpretationPanel.purity.test.ts`                                                                 | AR-06/07/08 (+SH-N10/N13 đã ở M4.5)                                                                                                                                                                                                | M4.5                                    | purity                                          | xanh                                                          |
| **M4.7** | Cổng chất lượng + coverage                | —                                                                                                    | Mục 11                                                                                                                                                                                                                             | M4.6                                    | lệnh                                            | gate xanh (CI cho phần không chạy được)                       |
| **M4.8** | QA thủ công (owner)                       | `evidence/`                                                                                          | M-01…M-08                                                                                                                                                                                                                          | M4.7 + build chạy được                  | thủ công                                        | ảnh/ghi chú đủ hoặc `UNVERIFIED`                              |
| **M4.9** | Đóng                                      | Matrix, F5 plan, xoá plan M4                                                                         | Evidence Matrix + Known Gaps (đóng KG-F5M3-01)                                                                                                                                                                                     | M4.8 + CI xanh                          | review                                          | owner nghiệm thu                                              |

**Điểm dừng bắt buộc:** nếu cần sửa `selection.ts`, `interpretation.ts`, API, `ChartWheel/*`, hoặc test F4 ngoài phạm vi Mục 9 ⇒ dừng, báo owner.

---

## 15. Definition of Done

- ☐ O-2, O-3, O-5 đã được owner chốt (O-1, O-4, O-6…O-11 xác nhận hoặc có mặc định ghi nhận).
- ☐ **Không** có state chọn thứ hai; `selection.ts`, `interpretation.ts` **không đổi** (`git diff` rỗng); không dependency/store/event-bus mới.
- ☐ AC-13…16, 24…26: mỗi AC có bằng chứng tự động và/hoặc thủ công theo Mục 4; AC-25 ghi rõ phần M6.
- ☐ Chọn không dời focus/không cuộn (SH-N1/N2, M-01); "Đọc diễn giải" và "Xem trên biểu đồ" đưa focus đúng đích, không đổi selection (SH-N5/N6, M-02/M-03).
- ☐ Escape giữ hành vi F4; focus không mất khi nút `SelectionDetail` biến mất (SD-04, SH-N9, M-04).
- ☐ Không thao tác bất đồng bộ treo (SH-N10, AR-07); chọn lỗi thời xử lý êm (SH-N11/N12).
- ☐ Không thêm live region (SH-N13, AR-06).
- ☐ Toàn bộ test F4/M3 hiện có xanh và **không bị sửa** (ngoại lệ có chủ đích: purity); `playwright --list` = 38; CI xanh trên commit mã cuối.
- ☐ Mọi gate Mục 11 đạt (hoặc ghi rõ là bằng chứng CI); coverage từng file được đo và báo trung thực (gap có giải thích).
- ☐ QA thủ công M-01…M-08 có ảnh/ghi chú hoặc `UNVERIFIED` + Known Gap; thiếu Firefox/Safari/thiết bị thật được ghi.
- ☐ Evidence Matrix + Known Gaps hoàn tất (KG-F5M3-01 đóng); plan M4 đã xoá; owner nghiệm thu.

---

## 16. Documentation, Release Impact and Handoff

| Hạng mục                                                                                                | M4?                     | Ghi chú                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence Matrix `archive/sprint-f5/Sprint_F5_M4_Exit_Criteria_Evidence_Matrix.md` + `evidence/m4_*.png` | Có                      | theo mẫu M1–M3; phần thủ công riêng                                                                                                                                       |
| F5 Implementation Plan                                                                                  | Cập nhật nhỏ            | đánh dấu M4 xong; chốt O-2 (sửa §8.1 nếu chọn A); ghi quyết định O-x                                                                                                      |
| Known Gaps                                                                                              | Có                      | **đóng KG-F5M3-01**; thêm: giới hạn trình duyệt (Chrome Desktop), focus rơi khi mục bị gỡ lúc đọc (R-10), focus ring theme sáng (nếu chưa xử lý), halo-vs-selected (R-09) |
| `CHANGELOG`, version, lockfile                                                                          | **Không** (M8, D-F5-08) |                                                                                                                                                                           |
| `Frontend_UI_Specification.md`                                                                          | **Không** (M8)          |                                                                                                                                                                           |
| Workflow/CI, Backend, API                                                                               | **Không**               |                                                                                                                                                                           |
| Tag/release                                                                                             | Không                   |                                                                                                                                                                           |

**Bàn giao:**

- **M5 (trạng thái suy giảm & copy):** không đổi `HouseDataNotice` ở M4; trạng thái S-08/`unavailable` của Panel không có đồng bộ chọn (không mục) — M5 chỉ xử lý copy/Overview.
- **M6 (responsive & a11y):** đo bố cục 320–≥1024; focus ring tương phản (nhất là theme sáng); tên truy cập 10 nút "Xem trên biểu đồ"; nếu cần thao tác bất đồng bộ (ví dụ chờ bố cục) phải dùng token yêu cầu và huỷ khi có yêu cầu mới (M4 cố ý không có).
- **M7 (E2E thật):** Scenario A (Mars) nên dùng hai nút mới; locator an toàn: `getByRole("button", { name: /^Đọc diễn giải$/ })`, `getByRole("button", { name: /^Xem trên biểu đồ: / })` (tránh chuỗi con trùng "Chọn "/"Bỏ chọn"); xác nhận focus bằng `toBeFocused`.
- **M8:** đồng bộ F5 plan §8 với hành vi cuối; không có thay đổi version ở M4.

---

## 17. Audit Evidence Appendix

**Đã đọc:** `Sprint_F5_M4_Implementation_Plan_Prompt.md`; `Sprint_F5_Implementation_Plan.md` §7–§10, §15, §17 (AC-13…16, 24…26, §8.1–§8.4); Evidence Matrix M3 (+ commit `1c33436`/`01dc8dd`); F4 M8 Evidence Matrix (D-M8-03/07/09); `selection.ts` (toàn bộ), `ChartViewerShell.tsx` (toàn bộ), `SelectionDetail.tsx` (toàn bộ), `InterpretationPanel.tsx`, `InterpretationItem.tsx`, `interpretationCopy.ts`, `InterpretationPanel.purity.test.ts`, `PlanetLayer.tsx` (phần tương tác), `PlanetTable.tsx` (nút chọn), `planetGeometry.ts` (`id`), `ChartWheel.tsx`, `ChartViewerShell.test.tsx` (danh sách test S-M8/S-E/S-G), `package.json`, `eslint.config.js`, `Frontend_Coding_Standards.md`, `Frontend_UI_Specification.md` §7.

**Đã chạy (không biến đổi repo):** `git pull --ff-only`, `git log/diff`; `git hash-object selection.ts` (`85691e97ccb09e1edee30195e327b13795954a8c`); nhóm test liên quan (selection, Shell, SelectionDetail, InterpretationPanel, PlanetTable, ChartWheel): **20 file / 233 test pass**; `vitest list` (**139 file / 1129 case**) và `playwright --list` (**38 / 7**) tại `01dc8dd`; thử nghiệm trong **bản sao `/tmp`**: jsdom cho phép `.focus()` trên `<g role=button tabIndex=0>` của SVG, `CSS.escape` có, **`scrollIntoView` không có**.
**CI đã xem:** run #312 (`41425503160`, `1c33436`) thành công (đăng xuất, không đọc log từng bước).

**Không chạy:** `build`, toàn bộ `vitest run`, E2E; chưa có mã/test M4; chưa chụp ảnh.
**Tác dụng phụ:** `/tmp/spike` (ngoài repo), `node_modules`/`frontend/.env` (git bỏ qua); không có thay đổi theo dõi nào trong repo ngoài file plan này.

**[?] Chưa xác minh:** hành vi thật của cuộn/focus SVG trong Chrome/Firefox/Safari; Narrator/NVDA; việc wheel "overflow" có thực sự sinh ra không có nút tương tác trong layout thực (SH-N7/M-08 sẽ xác nhận); `react-hooks` v7 có cảnh báo mẫu "điều chỉnh state khi render" hay không (cấu hình chỉ bật `exhaustive-deps`, sẽ xác nhận bằng lint ở M4.3).

**Lệch tài liệu ghi nhận:** F4 M8 Matrix dòng 25 viết `resolvePreview = focused ?? hovered`, còn mã hiện tại (sau `4c7e19f`) là `hovered ?? focused` — M4 theo **mã**.
