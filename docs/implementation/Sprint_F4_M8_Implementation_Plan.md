# AstroViet — F4 M8 Implementation Plan

## Interaction & Synchronization

**Phiên bản:** v1.1 (đã cập nhật theo `Confirmation_1.md` của owner) · **Ngày audit:** 2026-10-19 · **Repo:** `KhongphaiHphuc0705/astroviet`, nhánh `dev`, HEAD `d274d1a` (commit code cuối `b0f002f`, CI #276 Success)
**Phạm vi:** chỉ lập kế hoạch. Không sửa file nào trong repo; `node_modules`, `.env`, `dist/` chỉ có trong bản clone sandbox.
**Vị trí đề xuất khi commit:** `docs/implementation/Sprint_F4_M8_Implementation_Plan.md` (blueprint tạm; xoá khi đóng M8, chỉ Evidence Matrix được lưu archive — quy ước M4–M6).
**Ghi chú tên:** tin nhắn yêu cầu ghi "plan cho M6", nhưng file đính kèm và nội dung là **M8 = FE-S4.8** (M6 đã xong). Plan này lập cho **M8**.

**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `BLOCKED` · `NOT APPLICABLE` · `DEFERRED`. **Phê duyệt (decision):** `approved` · `inherited` (đã duyệt trong F4 plan v1.1/milestone trước) · `proposed` · `unresolved`.
**Nguồn:** `[repo]` mã/tài liệu · `[run]` lệnh đã chạy trong sandbox · `[ci]` trang GitHub Actions · `[owner]` xác nhận của owner.

---

## 1. Executive Summary

M8 biến Chart Viewer từ "xem" thành "tương tác": hover/focus/chọn hành tinh và góc chiếu, đồng bộ **Wheel ↔ bảng ↔ SelectionDetail**, bàn phím, Escape, cảm ứng, live region. M8 **không** tính lại chiêm tinh, không đổi Backend, không đưa selection vào URL, không có zoom/pan.

**Kết quả audit quan trọng (đều `[repo]`/`[run]`):**

1. **Tiền đề S4.5–S4.7 đạt**, nhưng có chủ đích **chưa nối**: `PlanetTable`/`AspectTable` đã có `selectedKey` + `onSelect` + `aria-pressed` (D-M7-3), nhưng `ChartViewerShell` **không truyền** chúng nên nút chọn chưa hiện trong app (KG-M7-02). Lớp hành tinh (`PlanetLayer`) là `role="img"` **không tương tác** và `AspectLayer` là `pointer-events-none` — có test khẳng định điều này (PL9, A10) nên M8 phải **cập nhật có chủ đích**, không làm yếu.
2. **`SelectionDetail` chưa tồn tại** (không có trong `ui/`). F4 plan §20 mô tả hợp đồng `selection, vm → onClear`. M8 **tạo mới**.
3. **Không có "bộ lọc loại góc chiếu" nào** trong repo. "Chip lọc" hiện có là `AspectFilterChip` ("Đang lọc: {hành tinh}") — lọc **Aspect Table theo hành tinh**; F4 plan §26 quy định lọc đó **suy ra từ việc chọn hành tinh**. Công tắc `showAspectLines` của M6 là **hiển thị** của wheel, không phải bộ lọc. Plan này **không thêm** bộ lọc mới; đưa `filterPlanetKey` thành **giá trị suy ra từ selection** để không có nguồn sự thật thứ hai.
4. **"AC Synchronization" không phải một khối tiêu chí đánh số**; nhãn xuất hiện ở FE-S4.8 (dòng 614) còn nội dung thực nằm ở §26 và mục "Đồng bộ" của tiêu chí hoàn thành (dòng 846). Plan trích nguyên văn ở Mục 9.
5. **`AspectTable` đã chứa một `aria-live="polite"` riêng** bao quanh chip lọc. Nếu thêm live region trung tâm mà không xử lý, chọn một hành tinh sẽ bị đọc **hai lần** ("Đã chọn…" và "Đang lọc…"). Cần quyết định (Mục 24).
6. **Dữ liệu định danh:** `PlanetVM.key` có thể trùng (`DUPLICATE_ENTITY` giữ cả hai mục); `PlanetTable` chọn theo `planet.key` nên mơ hồ. `AspectVM.key` luôn duy nhất (hậu tố `#n`).
7. **Rủi ro tương tác SVG:** vùng chạm nhãn hành tinh nhỏ (~24 × 12 px ở 400 px), vòng focus trên `<g>` SVG khác nhau giữa trình duyệt, đường aspect mảnh (1–3 đơn vị) cần vùng chạm rộng hơn; jsdom không kiểm chứng được cả ba ⇒ cần kiểm thủ công.
8. **Chuỗi "730px vs 768px"** trong prompt: **không tồn tại giá trị 730px** trong repo (`grep` rỗng). "730" là **số dòng** trong F4 plan (bảng responsive, hàng "Selection"). Mâu thuẫn thật từng có (F4 plan "dưới `md`" vs "dưới `sm`") đã được giải quyết ở M6.0 (hiện nhất quán `md` = 768 ở dòng 418–419) — VERIFIED.
9. **Bằng chứng M6 chỉ trên một nền tảng** (Windows 11, Chrome/Edge 155). Tương phản nét Căng thẳng trên nền sáng chỉ **2,56:1** (KG-M6-08, chấp nhận nhờ kiểu nét). Hệ quả cho M8: trạng thái chọn/nổi **không được dựa vào màu**.
10. **Dọn dẹp tồn đọng:** blueprint `docs/implementation/Sprint_F4_M6_Implementation_Plan.md` vẫn còn sau khi M6 đóng (quy ước: xoá) — xử lý ở M8.0.

**Thiết kế đề xuất (nhỏ nhất đủ yêu cầu):**

- Một nguồn selection: `useReducer` trong `ChartViewerShell` (không Context, không Zustand), reducer thuần ở `model/selection.ts`.
- `Selection = none | planet(key) | aspect(key)` (đã duyệt ở F4 plan §26); thêm trạng thái **tạm thời** `hover` và `focus` tách khỏi selection; "preview" = `focused ?? hovered` (**focus ưu tiên hơn hover** — theo xác nhận của owner).
- Hành tinh trên wheel thành `role="button"` + `aria-pressed` + `tabIndex=0` (đã duyệt F4 plan dòng 425); **đường aspect trên wheel chỉ chọn bằng con trỏ/chạm** (vùng chạm rộng, `aria-hidden`), tương đương bàn phím nằm ở Aspect Table.
- Chọn aspect ⇒ hai hành tinh nổi; chọn hành tinh ⇒ aspect liên quan nổi, phần còn lại mờ; bảng Aspect lọc theo hành tinh (suy ra).
- `Esc` chỉ xoá selection; chọn lại cùng mục ⇒ bỏ chọn; thanh "Bỏ chọn" trong `SelectionDetail` cho cảm ứng.
- Một live region `role="status"` duy nhất ở Shell; **không** thông báo hover/focus.
- Không dependency mới; dùng `vitest-axe` và `@testing-library/user-event` đã có.

**Kết luận (v1.1):** `READY FOR IMPLEMENTATION` — 5 quyết định chặn đã được owner duyệt (D-M8-03, D-M8-08: duyệt có sửa đổi; D-M8-04, D-M8-09: duyệt có làm rõ; D-M8-14: duyệt nguyên văn; Mục 39.2). Điều kiện của D-M8-04 đã được xác minh trong repo. Không có blocker kỹ thuật; bắt đầu từ M8.0 (docs-only).

---

## 2. Objective

Theo F4 plan FE-S4.8 (dòng 609): **hover/focus/chọn; đồng bộ wheel ↔ bảng ↔ detail; bàn phím; live region.** Mục tiêu đo được: người dùng chọn một phần tử ở bất kỳ bề mặt nào (wheel, Planet Table, Aspect Table) và **mọi bề mặt hội tụ về cùng một trạng thái chọn**, truy cập được bằng chuột, bàn phím, cảm ứng và trình đọc màn hình, mà không có trạng thái chọn thứ hai.

## 3. Scope

1. Mô hình selection chuẩn + reducer thuần (`model/selection.ts`).
2. Hover, focus bàn phím, chọn bền vững — ba trạng thái tách biệt, có quy tắc ưu tiên.
3. Đồng bộ hai chiều Wheel ↔ Planet Table; Wheel ↔ Aspect Table.
4. `SelectionDetail` (tạo mới), suy ra từ selection + `ChartViewModel`.
5. Nối controlled props: `PlanetTable`, `AspectTable`, `ChartWheel` (`PlanetLayer`, `AspectLayer`).
6. Chip lọc hành tinh của `AspectTable` suy ra từ selection (`onClearFilter` ⇒ bỏ chọn).
7. Escape, `aria-pressed`, live region, tap-để-chọn + "Bỏ chọn".
8. Test: reducer, đồng bộ hai chiều, bàn phím, lọc, axe, hồi quy.
9. Kiểm thủ công: bàn phím, trình đọc màn hình, cảm ứng, vòng focus SVG.

## 4. Out of Scope

| Hạng mục                                                    | Lý do / nơi xử lý                                                    |
| ----------------------------------------------------------- | -------------------------------------------------------------------- |
| Selection trên URL, query-param, lịch sử trình duyệt        | F4 plan §26: "Selection không vào URL ở F4"                          |
| Zoom/pan nâng cao, pinch tuỳ biến                           | S4.9 / KG-M4-04                                                      |
| Event bus toàn cục, store/Context mới                       | F4 plan §13 #4, #6                                                   |
| Redesign Chart Viewer, bố cục hai cột `lg`, skip link       | S4.9 (KG-M4-05/06)                                                   |
| Tính lại vị trí/nhà/aspect/orb                              | Backend là nguồn sự thật                                             |
| Đổi Backend/`ChartResponse`                                 | ngoài F4                                                             |
| **Bộ lọc loại/tính chất góc chiếu** (không tồn tại hôm nay) | không thêm; chỉ ghi nhận (Mục 20)                                    |
| Chọn **nhà** / góc (ASC, MC…)                               | F4 plan §26 chỉ định hành tinh và aspect; `HouseTable` giữ trình bày |
| Tái hiện S4.5–S4.7, sửa kiểu nét/hình học M6                | chỉ thêm tương tác                                                   |
| E2E Playwright cho tương tác                                | S4.10                                                                |
| Diễn giải (interpretation) nâng cao                         | ngoài F4                                                             |

## 5. Roadmap Context and Frozen Execution Order

Thứ tự đã đóng băng (F4 plan v1.1, O-F4-2 phương án B) — **giữ nguyên**:

```text
S4.1 → S4.2 → S4.3 → S4.11 → S4.7 → S4.4 → S4.5 → S4.6 → S4.8 → S4.9 → S4.10
```

| Mục                                                 | Kết quả                                                                   | Bằng chứng                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| F4 plan v1.1 là tài liệu thẩm quyền                 | VERIFIED                                                                  | `docs/implementation/Sprint_F4_Implementation_Plan.md` dòng 522 `[repo]` |
| O-F4-2 = phương án B (thêm S4.11 Saved Charts List) | VERIFIED                                                                  | F4 plan dòng 17, 55; Evidence Matrix M11 `[repo]`                        |
| M8 ≡ FE-S4.8                                        | VERIFIED                                                                  | F4 plan dòng 608–615                                                     |
| Tiền đề của S4.8                                    | S4.5–S4.7 (F4 plan dòng 610); sơ đồ dòng 653–656: "S4.8 cần cả hai nhánh" | VERIFIED                                                                 |
| Sau M8                                              | S4.9 (hardening/responsive hoàn thiện) → S4.10 (E2E/hồi quy)              | VERIFIED                                                                 |
| "Mn" trong hội thoại = `FE-S4.n`                    | quy ước đã dùng ở M4–M6                                                   | `archive/sprint-f4/`                                                     |

## 6. Current Repository State

| Hạng mục                                                                                                                                                                                         | Trạng thái                 | Bằng chứng                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------- |
| `dev` HEAD `d274d1a` (docs); commit code cuối `b0f002f` "prototype protection, tie-break, tone classes"                                                                                          | VERIFIED                   | `[run]` `git log`                                                                              |
| CI #276 (`frontend-ci.yml`, push `dev`, `b0f002f`): **Success**, 4m26s, 1 cảnh báo Node 20 (actions)                                                                                             | VERIFIED                   | `[ci]` run `39187115450`                                                                       |
| Commit head chỉ đổi `docs/**` (5 ảnh minh chứng + 2 matrix) ⇒ không có CI riêng; evidence commit = `b0f002f`                                                                                     | VERIFIED                   | `[run]` `git diff --stat`                                                                      |
| Các sửa lỗi M6.7 có thật: `Object.hasOwn` ở `aspectGeometry.ts:170`; `aspectStyles.ts` dùng chung; `useId` ở Shell; không còn `localeCompare`                                                    | VERIFIED                   | `[run]` grep                                                                                   |
| Archive có Matrix M1, M2, M3, M4, M5, M6, M7, M11                                                                                                                                                | VERIFIED                   | `[run]` `ls`                                                                                   |
| Chưa có `model/selection.ts`, `SelectionDetail`; không có `hoveredKey`/`selection` trong mã sản phẩm                                                                                             | VERIFIED                   | `[run]` `grep -rn selection src/features/chart` chỉ ra 1 dòng bình luận ở `AspectLayer.tsx:15` |
| Script có thật: `lint`, `format:check`, `typecheck`, `test`, `test:coverage`, `test:e2e`, `build` (không có `test:a11y`)                                                                         | VERIFIED                   | `frontend/package.json`                                                                        |
| Thư viện test: `vitest` 4.1, `@testing-library/react` 16, **`@testing-library/user-event` 14**, `vitest-axe` 0.1 (matcher đăng ký ở `src/test/setup.ts`), `eslint-plugin-jsx-a11y` (recommended) | VERIFIED                   | `package.json`, `setup.ts`, `eslint.config.js`                                                 |
| Phiên này **không** chạy lại toàn bộ `npm test`/`build` trên `b0f002f` (chỉ đối chiếu CI #276 và kết quả M6 của phiên trước: 124 file/921 test)                                                  | UNVERIFIED trong phiên này | —                                                                                              |

## 7. M6 Completion and Relevant Decisions Audit

**M6 hoàn tất:** Matrix M6 `PASS (ACCEPTED BY OWNER)`, evidence commit `c14f72d` (CI #275), sửa lỗi `b0f002f` (CI #276), minh chứng thủ công bổ sung ở `d274d1a` `[repo]`. Phiên trước đã chạy lại độc lập: format/lint/typecheck/build exit 0, 124 file/921 test, coverage `aspectGeometry.ts` 100%/97,87%, Grep Gate G-2…G-12 sạch — VERIFIED. **Giới hạn bằng chứng:** minh chứng thủ công chỉ trên Windows 11 + Chrome/Edge 155; iOS/Android/macOS chưa kiểm (không phải lỗi, nhưng giới hạn cho các giả định cảm ứng của M8).

| Mục audit (theo prompt §13)                             | Trạng thái                                                                             | Bằng chứng                                                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `aspectRing` = 108 + vòng tham chiếu mảnh               | **implemented and accepted**                                                           | `geometry.ts` `WHEEL_RADII.aspectRing`; `AspectLayer.tsx` vòng `stroke-subtle`; Matrix M6 D-M6-02            |
| Độ dày nét 1,5 / 2,5 / 3                                | implemented and accepted                                                               | `aspectGeometry.ts` `ASPECT_LINE_STYLES`; D-M6-05                                                            |
| Dash `1 5`, `8 5`, `16 6`                               | implemented and accepted                                                               | như trên                                                                                                     |
| Mặc định theo `md` 768px                                | implemented and accepted                                                               | `ASPECT_LINES_DEFAULT_QUERY = "(min-width: 768px)"` ở Shell; D-M6-08; F4 plan dòng 418–419 đã đồng bộ ở M6.0 |
| Lựa chọn người dùng được giữ khi resize                 | implemented and accepted                                                               | `userChoice ?? matchesMd`; test SW6/SW7; D-M6-09                                                             |
| `AspectLegend` dựa trên dữ liệu                         | implemented and accepted                                                               | `AspectLegend.tsx`; D-M6-13                                                                                  |
| Copy "Hiện đường góc chiếu", nhóm "Căng thẳng"          | implemented and accepted                                                               | Shell; `labels.ts`; D-M6-21 (nhắc: F4 plan §24 vẫn có thể nói "Thử thách" — copy hiển thị là "Căng thẳng")   |
| "Xung đột 730px vs 768px"                               | **không có 730px**; là số dòng 730 trong F4 plan; mâu thuẫn `sm` vs `md` đã giải quyết | grep; F4 plan dòng 418–419                                                                                   |
| Công tắc nằm trong Shell, state cục bộ                  | implemented and accepted                                                               | `ChartViewerShell.tsx`; D-M6-10                                                                              |
| Tương phản nét Căng thẳng nền sáng 2,56:1               | **accepted gap** (bù bằng kiểu nét)                                                    | KG-M6-08                                                                                                     |
| `AspectLayer` hiện non-interactive, dành riêng cho S4.8 | implemented                                                                            | `AspectLayer.tsx` (không `role`/handler), A10                                                                |

Không có quyết định M6 nào ở trạng thái `unresolved` cản M8. Hai điểm **mang sang M8**: (a) `showAspectLines` phải tiếp tục ở Shell (cùng container với selection); (b) M8 không được ép đổi `userChoice` khi chọn aspect.

## 8. S4.5–S4.7 Prerequisite Audit

| Tiền đề                  | Cung cấp cho M8                                                                                                                                        | Trạng thái                                                                                 | Bằng chứng                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **S4.5**                 | `PlanetLayer` (nhóm `<g data-planet role="img" aria-label>` + `markerInner/Outer`, `trueAngle`, `box`), `PlanetWheelModel` (`id` = `key` hoặc `key#n`) | VERIFIED; **non-interactive có chủ đích** (PL9)                                            | `PlanetLayer.tsx`, `planetGeometry.ts`, matrix M5                           |
| **S4.6**                 | `AspectLayer` (`data-aspect`, `data-type`, `data-nature`, `data-shape` đã gắn), `AspectGeometryResult.lines/skipped/legend`, công tắc, legend          | VERIFIED; non-interactive, `pointer-events-none` (A10)                                     | matrix M6; `aspectGeometry.ts`                                              |
| **S4.7**                 | `PlanetTable`, `HouseTable`, `AspectTable` (bảng + thẻ), `AspectFilterChip`, `selectedKey`/`onSelect(key)`/`aria-pressed`/Enter-Space/vùng chạm ≥ 44px | VERIFIED; nút chọn **chỉ render khi có `onSelect`**; Shell không truyền (D-M7-3, KG-M7-02) | `PlanetTable.tsx:21-22,112-125`, `AspectTable.tsx:21-26,106-125`, matrix M7 |
| Chart Viewer composition | `ChartViewerShell` (Card tổng quan → thông báo thiếu nhà → Card wheel + công tắc + legend → PlanetTable → HouseTable → AspectTable)                    | VERIFIED                                                                                   | `ChartViewerShell.tsx`                                                      |
| Detail                   | **không có** `SelectionDetail`                                                                                                                         | **prerequisite gap có kiểm soát** (S4.8 _Create_, F4 plan dòng 670)                        | `ls ui/`                                                                    |

**Không có blocker.** Hai điểm không khớp tài liệu (không chặn): F4 plan gọi container là `ChartViewer`, repo là `ChartViewerShell` (X2); F4 plan dòng 425 mô tả planets là `role="button"` ngay từ wheel, M5 đã giữ `role="img"` để dành S4.8 (quyết định D-S45-07 — nâng cấp ở M8, nhất quán).

## 9. AC Synchronization — Source and Interpretation

**Không có khối tiêu chí tên "AC Synchronization" đánh số** trong repo. Văn bản thẩm quyền, trích nguyên văn `[repo]` `docs/implementation/Sprint_F4_Implementation_Plan.md`:

- FE-S4.8 dòng 614: _"Acceptance: AC Synchronization; không state trùng."_
- Dòng 846 (tiêu chí hoàn thành F4): _"Đồng bộ: chọn wheel↔bảng hoạt động; chỉ một nguồn `selection`."_
- §26 dòng 396 (quy tắc): _"chọn hành tinh ⇒ hành tinh nổi ở wheel + hàng Planet Table được đánh dấu + Aspect Table lọc theo hành tinh; chọn aspect ⇒ đường aspect nổi + hai hành tinh nổi + hàng aspect đánh dấu; chọn mục mới thay mục cũ (không đa chọn); `Esc` hoặc chọn lại ⇒ `none`. Không có state thứ hai ở wheel hay bảng (đều controlled)."_
- Dòng 848 (A11y): _"phần tử tương tác dùng được bàn phím; thông tin không chỉ bằng màu; kiểm thủ công đã ghi."_
- Dòng 464/761 (test): _"đồng bộ chọn hai chiều, lọc aspect, `Esc`, live region"_; keyboard/live region mức ưu tiên High.

**Diễn giải (proposed):** "AC Synchronization" = hợp của các câu trên. Plan chuyển thành checklist kiểm được (Mục 36, AC-S1…); nhãn "AC Synchronization" được dùng để chỉ **bộ AC-S** này. Phần prompt đưa ra (Mục 23) được coi là bổ sung chi tiết, không thay văn bản trên.

## 10. Current Chart Viewer Architecture

```
ChartDetailPage (key={chartId})
 └─ ChartViewerShell  [vm, wheelGeometry(useMemo), aspectGeometry(useMemo), matchesMd, userChoice]
     ├─ Card: tổng quan lá số (ChartHeader tương đương)  +  HouseDataNotice
     ├─ Card raised: [Switch "Hiện đường góc chiếu" + AspectLegend]  +  ChartWheel
     │       ChartWheel → <svg role="group">  Zodiac → Tick → House → Angle → AspectLayer(nếu bật) → PlanetLayer
     ├─ PlanetTable   (layout table|cards, density)   — chưa có selectedKey/onSelect
     ├─ HouseTable                                       — không chọn
     └─ AspectTable   (+ AspectFilterChip, aria-live riêng) — chưa có selectedKey/onSelect/filter
```

Sự thật hạ tầng: layout bảng/thẻ bằng `useMediaQuery("(min-width: 640px)")` ở Shell; mật độ từ `preferenceStore.densityMode`; wheel `min-w-[400px] max-w-[640px]` trong vùng cuộn có `tabindex="0"` (test C-scroll); không có Context/Zustand cho chart.

## 11. Current Selection and Filter State

| Thành phần         | Selection/filter hiện có                                                                                                                                                                                                        | Bằng chứng                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `PlanetTable`      | `selectedKey?: string\|null`, `onSelect?: (key: PlanetKey)=>void`; nút trong ô đầu, `aria-pressed={isSelected}`; hàng chọn: `bg-surface-raised`; thẻ: `ring-2 ring-accent-primary`                                              | `PlanetTable.tsx`                    |
| `AspectTable`      | `selectedKey`, `onSelect(key: AspectKey)`; nút ở ô hành tinh A, `aria-label="Chọn góc chiếu {loại} giữa {A} và {B}"`, `aria-pressed`; **`filterPlanetKey`, `filterPlanet`, `onClearFilter`** lọc hàng theo hành tinh (A hoặc B) | `AspectTable.tsx`                    |
| `AspectFilterChip` | nút "Đang lọc: {tên}" `aria-label="Xóa bộ lọc theo {tên}"`, hành động **xoá**, không `aria-pressed`; khi không có `onClear` chỉ là nhãn                                                                                         | `AspectFilterChip.tsx`               |
| Live region sẵn có | `aria-live="polite"` quanh chip trong `AspectTable`                                                                                                                                                                             | `AspectTable.tsx:73`                 |
| `HouseTable`       | **không** có props chọn                                                                                                                                                                                                         | `HouseTable.tsx:15-25`               |
| Wheel              | không có hover/focus/chọn; `PlanetLayer` `role="img"`, `AspectLayer` `pointer-events-none`                                                                                                                                      | `PlanetLayer.tsx`, `AspectLayer.tsx` |
| Visibility M6      | `userChoice: boolean\|null` + `matchesMd` trong Shell                                                                                                                                                                           | `ChartViewerShell.tsx`               |
| Kiểu               | `PlanetKey = string`, `AspectKey = string` (`chartViewModel.ts:25-26`)                                                                                                                                                          |                                      |
| Phân biệt          | **bộ lọc hành tinh của bảng** (hiển thị hàng) ≠ **công tắc đường góc chiếu** (hiển thị wheel) ≠ **selection**                                                                                                                   |                                      |

---

## 12. Interaction Requirements

| ID    | Yêu cầu                                                                                           | Nguồn                                    |
| ----- | ------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| IR-1  | Chọn hành tinh/aspect từ wheel **hoặc** bảng; mọi bề mặt hội tụ về một selection                  | F4 §26, dòng 846                         |
| IR-2  | Hover (con trỏ chuột) và focus bàn phím cho **xem trước** (preview) tạm thời, không đổi selection | F4 §16 dòng 315                          |
| IR-3  | Chọn lại cùng mục ⇒ bỏ chọn; chọn mục khác ⇒ thay thế (đơn chọn)                                  | F4 §26                                   |
| IR-4  | `Esc` bỏ chọn; không reset thứ gì khác                                                            | F4 §26; prompt §17                       |
| IR-5  | Bàn phím: Tab tới điều khiển, Enter/Space chọn; thông tin không chỉ bằng màu                      | F4 dòng 848                              |
| IR-6  | Cảm ứng: chạm là chọn; không có nội dung chỉ-hover; có cách bỏ chọn                               | F4 dòng 730 ("tap + panel, nút Bỏ chọn") |
| IR-7  | Live region báo chọn/bỏ chọn, không báo từng chuyển động chuột                                    | F4 §26; prompt §16                       |
| IR-8  | Không state chọn trùng giữa wheel/bảng/detail                                                     | F4 §13 #8                                |
| IR-9  | Không đổi hành vi M6 (công tắc, lựa chọn người dùng)                                              | prompt §13                               |
| IR-10 | Bảng ngữ nghĩa luôn đầy đủ, không phụ thuộc wheel                                                 | F4 §a11y                                 |

## 13. Canonical Selection Model

**File:** `frontend/src/features/chart/model/selection.ts` (+ `selection.test.ts`) — **chưa tồn tại**; đường dẫn khớp F4 plan dòng 212/667 và cấu trúc `model/` hiện có (`geometry`, `labelLayout`, `planetGeometry`, `aspectGeometry` đều thuần TS) `[repo]`. **Create.**

```ts
// Thuần TS: không import React/DOM/API. Chỉ `import type` từ chartViewModel.
export type InteractionTarget =
  { kind: "planet"; key: PlanetKey } | { kind: "aspect"; key: AspectKey };

export type Selection = { kind: "none" } | InteractionTarget; // F4 §26 (đã duyệt)

export interface Announcement {
  seq: number;
  kind: "selected" | "cleared";
}

export interface InteractionState {
  selection: Selection; // bền vững, duy nhất
  hovered: InteractionTarget | null; // tạm thời, chỉ chuột
  focused: InteractionTarget | null; // tạm thời, bàn phím
  announcement: Announcement | null; // sự kiện cuối cần đọc
}
```

Lý do dùng `{ kind: "none" }` thay `null` (ví dụ của prompt): **F4 plan §26 đã duyệt** dạng này (nguồn #2 trong hệ thứ bậc) và `PlanetKey`/`AspectKey` đã tồn tại ở `chartViewModel.ts:25-26`. `hover` được mở rộng cho cả aspect (F4 plan chỉ ghi `hoveredKey: PlanetKey`) vì wheel M8 cho chọn/preview aspect — thay đổi **proposed**, ghi ở D-M8-03.

**Quy tắc đã chốt:**

- **Đơn chọn** (không đa chọn) — inherited.
- **Chọn aspect ⇒ hai hành tinh đầu mút "liên quan"** (nổi, không phải `selected`) — inherited (F4 §26).
- **Chọn hành tinh ⇒ các aspect của nó "liên quan"** trên wheel; Aspect Table lọc theo hành tinh (suy ra) — inherited.
- **Hover/focus không bao giờ đổi selection.**
- **Bỏ chọn:** chọn lại cùng mục, nút "Bỏ chọn", chip lọc ✕, hoặc `Esc`.
- **Mục chọn không còn tồn tại / bị loại:** xem Mục 15 (`resolveSelection`) và Mục 35.
- **Dữ liệu chart đổi:** `ChartViewerShell` được `key={chartId}` ở trang (M6) ⇒ mount lại ⇒ state về mặc định; ngoài ra mục chọn được **xác nhận lại ở mỗi lần render** (suy ra, không effect).

## 14. Selection Identity

| Loại        | Định danh canonical                                                   | Bằng chứng                                                                  | Ghi chú                                                                       |
| ----------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Hành tinh   | `PlanetVM.key` (tên Backend, ví dụ `"Sun"`)                           | `chartViewModel.ts` `PlanetKey`; bảng đã dùng `onSelect(planet.key)`        | **không** dùng nhãn Việt, chỉ số mảng, hay `data-planet` của SVG làm identity |
| Aspect      | `AspectVM.key` = `"{planetA}:{aspectType}:{planetB}"`, trùng thì `#n` | `buildAspects` dòng ~698–712; DTO aspect **không có `id`** (`api/types.ts`) | định danh dựng tất định từ trường Backend; duy nhất trong một chart           |
| Phần tử SVG | `data-planet` (id render) / `data-aspect` (= `AspectVM.key`)          | `PlanetLayer`, `AspectLayer`                                                | chỉ là **đường dẫn tới** identity, không phải identity                        |

**Khoảng trống phát hiện (cần xử lý):** `PlanetRenderItem.id` là `key` hoặc `key#n` (M5) nhưng **không có trường `key` thô** ⇒ wheel không có cách sạch để phát ra `PlanetKey`. **Đề xuất:** thêm trường **cộng thêm** `key: PlanetKey` vào `PlanetRenderItem` (`planetGeometry.ts`), nạp từ `PlanetVM.key`; không parse chuỗi `#n`.

**Hành tinh trùng key (`DUPLICATE_ENTITY`):** VM giữ cả hai mục; bảng gửi cùng `key` cho cả hai hàng. **Quyết định đề xuất (D-M8-02):** coi là dữ liệu bất thường đã có issue; selection theo `key` nên **cả hai** mục cùng sáng; **không** thêm cơ chế phân biệt thứ hai ở M8 (ghi Known Gap KG-M8-03). Phương án khác: vô hiệu hoá chọn khi trùng (giống M6 `ENDPOINT_AMBIGUOUS`) — cần thêm props cho bảng, vượt phạm vi tối thiểu.

## 15. Reducer and State Transitions

**Kết luận:** dùng **reducer thuần** (đúng yêu cầu), vì có ≥ 6 chuyển trạng thái phụ thuộc lẫn nhau (hover/focus/chọn/bỏ/Escape/announce) cần test độc lập với React.

**Trạng thái mặc định:** `{ selection: {kind:"none"}, hovered: null, focused: null, announcement: null }`.

**Hành động (union):**

```ts
export type InteractionAction =
  | { type: "hoverEnter"; target: InteractionTarget }
  | { type: "hoverLeave"; target: InteractionTarget } // chỉ xoá nếu target khớp
  | { type: "focusEnter"; target: InteractionTarget }
  | { type: "focusLeave"; target: InteractionTarget } // chỉ xoá nếu target khớp
  | { type: "select"; target: InteractionTarget } // chọn / chọn lại ⇒ bỏ
  | { type: "clear" } // nút Bỏ chọn, chip ✕
  | { type: "escape" }; // như clear nhưng no-op khi none
```

| Hành động          | Điều kiện            | Chuyển trạng thái                                                      | `announcement`        |
| ------------------ | -------------------- | ---------------------------------------------------------------------- | --------------------- |
| `hoverEnter(t)`    | luôn                 | `hovered = t`                                                          | không đổi             |
| `hoverLeave(t)`    | `hovered` bằng `t`   | `hovered = null`                                                       | không đổi             |
| `hoverLeave(t)`    | `hovered` khác `t`   | **không đổi** (tránh xoá nhầm khi chuột chuyển nhanh giữa hai phần tử) | không đổi             |
| `focusEnter/Leave` | tương tự hover       | `focused`                                                              | không đổi             |
| `select(t)`        | `selection` bằng `t` | `selection = none`                                                     | `{seq+1, "cleared"}`  |
| `select(t)`        | `selection` khác `t` | `selection = t`                                                        | `{seq+1, "selected"}` |
| `clear`            | `selection` ≠ none   | `selection = none`                                                     | `{seq+1, "cleared"}`  |
| `clear`            | `selection` = none   | **trả về state cũ (cùng tham chiếu)**                                  | không đổi             |
| `escape`           | như `clear`          | như `clear`                                                            | như `clear`           |

**Đại lượng suy ra (không lưu):** `effectiveSelection = resolveSelection(selection, availability)`; `preview = focused ?? hovered`; `emphasis = computeEmphasis(effectiveSelection, preview, vm)` → `{ planets, aspects, active }`; `filterPlanetKey` (= khoá hành tinh nếu chọn hành tinh, ngược lại `null`); `detail` (tra từ `vm`); `liveMessage` (từ `announcement` + `effectiveSelection` + `vm`).

**Hàm thuần đi kèm trong `selection.ts`:**

- `resolveSelection(selection, { planetKeys, aspectKeys }): Selection` — nếu khoá không còn trong `vm` ⇒ `{kind:"none"}`. (Đây là **cách hoà giải dữ liệu đổi/mục biến mất**: không effect, không state thừa; `key={chartId}` xử lý đổi chart.)
- `computeEmphasis(selection, preview, vm)` — **chỉ lọc cấu trúc** theo khoá (aspect có `planetA.key`/`planetB.key` bằng hành tinh) — không phải phép tính chiêm tinh.
- `selectionToTarget`, `isSameTarget`.

**Bất biến (kiểm bằng test):** (1) `selection` luôn thuộc union; (2) `hover*/focus*` không đổi `selection`/`announcement`; (3) `select` hai lần cùng mục ⇒ về `none`; (4) `clear`/`escape` khi `none` ⇒ `Object.is(prev, next)`; (5) `announcement.seq` tăng **đúng khi** selection thực sự đổi; (6) tất định, không phụ thuộc DOM/thời gian; (7) `hoverLeave` khác mục không đổi state; (8) không có trường nào lưu dữ liệu suy ra được (tên, nhãn, chỉ số hàng, toạ độ).

**Kiểm thử reducer (đơn vị, mục 36 `U1–U24`):** mỗi dòng bảng trên; hoán vị chuỗi hành động ngẫu nhiên **có hạt giống cố định** (property test) khẳng định bất biến (1)–(8); `resolveSelection` với khoá không tồn tại; `computeEmphasis` cho planet/aspect/preview + tập rỗng.

## 16. State Ownership and Invariants

- **Chủ sở hữu duy nhất:** `ChartViewerShell` giữ `useReducer(interactionReducer, initialState)`. Lý do: Shell **là cha trực tiếp** của wheel và cả ba bảng và đã giữ state UI của chart (M6); F4 plan §13 #4 chọn đúng mô hình "cục bộ trong ChartViewer, không Context/Zustand" (inherited; tên container thực tế là `ChartViewerShell`).
- **Prop drilling:** Shell → `ChartWheel` → `PlanetLayer`/`AspectLayer` (2 tầng) và Shell → bảng (1 tầng): không cần Context.
- **`showAspectLines`/`userChoice` (M6)** tiếp tục ở Shell, **không** nhập vào reducer (khác bản chất: tuỳ chọn hiển thị, không phải selection).
- **Bất biến cấp hệ thống:** (a) chỉ một nơi giữ `selection`; (b) wheel/bảng/detail **không** có `useState` về chọn; (c) hover/focus cục bộ **được phép** chỉ khi phát ra qua callback — nhưng M8 đặt chúng trong reducer để preview chéo bề mặt thống nhất; (d) selection không bao giờ ghi vào URL/localStorage/store.
- Chi tiết ma trận: Mục 31.

## 17. Controlled Component Contracts

Nguyên tắc: **mọi thành phần mới tương tác đều tuỳ chọn (additive)**; không truyền ⇒ hành vi cũ không đổi (bảo vệ test M4–M7).

| Component               | Props mới (controlled)                                                                                        | Callback                                | Ghi chú                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| `ChartViewerShell`      | —                                                                                                             | —                                       | chủ sở hữu reducer; tính `emphasis`, `filterPlanetKey`, `detail`, `liveMessage`      |
| `ChartWheel`            | `interaction?: WheelInteraction`                                                                              | qua `interaction`                       | không có prop ⇒ không tương tác (giữ `role="img"`)                                   |
| `PlanetLayer`           | `interaction?` + (từ model) `key`                                                                             | `onSelect`, `onPreview`                 | có `interaction` ⇒ nhóm hành tinh thành `role="button"`                              |
| `AspectLayer`           | `interaction?`                                                                                                | `onSelect`, `onPreview`                 | có `interaction` ⇒ thêm vùng chạm rộng, bỏ `pointer-events-none` **chỉ** ở vùng chạm |
| `PlanetTable`           | (có sẵn) `selectedKey`, `onSelect`; **mới:** `relatedKeys?: ReadonlySet<PlanetKey>`, `onPreview?`             | `onSelect(key)`, `onPreview(key\|null)` | `relatedKeys` chỉ để tô nổi hàng liên quan (không đổi semantic)                      |
| `AspectTable`           | (có sẵn) `selectedKey`, `onSelect`, `filterPlanetKey`, `filterPlanet`, `onClearFilter`; **mới:** `onPreview?` | như trên                                | `filterPlanetKey` do Shell **suy ra** từ selection                                   |
| `HouseTable`            | không đổi                                                                                                     | —                                       | không tham gia chọn                                                                  |
| `SelectionDetail` (mới) | `selection`, `vm`                                                                                             | `onClear()`                             | thuần trình bày, **không** state                                                     |
| Live region             | `message: string`                                                                                             | —                                       | một phần tử ở Shell                                                                  |

```ts
interface WheelInteraction {
  selection: Selection; // controlled
  emphasis: {
    planets: ReadonlySet<PlanetKey>;
    aspects: ReadonlySet<AspectKey>;
    active: boolean;
  };
  onSelect(target: InteractionTarget): void;
  onPreview(target: InteractionTarget | null, source: "hover" | "focus"): void;
}
```

`onPreview` được `PlanetLayer`/`AspectLayer` gọi từ `onPointerEnter/Leave` (**chỉ khi `pointerType === "mouse"`**, để cảm ứng không để lại hover "dính") và `onFocus/onBlur`.

## 18. Wheel ↔ Table ↔ Detail Synchronization

Mọi luồng đều: **sự kiện → `dispatch(action)` → state mới → Shell suy ra props → cả ba bề mặt render lại từ cùng state**. Không bề mặt nào gọi bề mặt khác.

| Case                      | Sự kiện khởi tạo                                  | Action                                 | Chuyển trạng thái                                  | Bề mặt bị ảnh hưởng                                                                                                                                     | Test       |
| ------------------------- | ------------------------------------------------- | -------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **A** Wheel→bảng          | click/Enter/Space trên nhóm hành tinh             | `select({planet,key})`                 | `selection=planet(key)`                            | hàng Planet Table `aria-pressed=true`; Aspect Table lọc theo hành tinh (chip hiện); aspect liên quan nổi; `SelectionDetail` hành tinh; live "Đã chọn …" | S-A1       |
| **B** Bảng→wheel          | click/Enter/Space trên nút hàng Planet Table      | `select({planet,key})`                 | như A                                              | nhóm hành tinh trên wheel `aria-pressed=true` + halo; detail; live. **Focus giữ nguyên ở nút bảng** (không dời)                                         | S-B1       |
| **C** Aspect(wheel)→bảng  | chạm/click vùng chạm đường aspect                 | `select({aspect,key})`                 | `selection=aspect(key)`                            | đường nổi + 2 hành tinh liên quan; hàng Aspect Table `aria-pressed=true`; Planet Table tô hàng liên quan; detail aspect; live                           | S-C1       |
| **D** Bảng→aspect         | nút hàng Aspect Table                             | `select({aspect,key})`                 | như C                                              | wheel: nếu công tắc bật thì đường nổi; **nếu tắt thì chỉ 2 hành tinh nổi** (xem Mục 20); detail; live                                                   | S-D1, S-D2 |
| **E** Bỏ chọn             | `Esc` / chọn lại / "Bỏ chọn" / chip ✕             | `escape` / `select` cùng mục / `clear` | `selection=none`                                   | mọi bề mặt về mặc định; chip biến mất; detail về gợi ý; live "Đã bỏ chọn"; focus giữ nguyên; hover theo con trỏ                                         | S-E1…E4    |
| **F** Đổi hiển thị/bộ lọc | công tắc M6; chip ✕                               | (công tắc: ngoài reducer) / `clear`    | công tắc **không** đổi selection; chip ✕ ⇒ bỏ chọn | xem Mục 20/35                                                                                                                                           | S-F1…F3    |
| **G** Cảm ứng             | chạm nhóm hành tinh / vùng chạm aspect / nút bảng | `select(...)`                          | như A/C                                            | như A/C; chạm lại ⇒ bỏ; "Bỏ chọn" ở `SelectionDetail`                                                                                                   | S-G1, S-G2 |

Lọc Aspect Table theo hành tinh là **hệ quả hiển thị** của selection (`filterPlanetKey` suy ra) chứ không phải state riêng.

## 19. Hover / Focus / Selection Precedence

**Ba lớp độc lập, không loại trừ nhau:**

| Lớp                                           | Thuộc                          | Biểu hiện                                                                                         |
| --------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Focus ring** (bàn phím)                     | trình duyệt (`:focus-visible`) | luôn hiện trên phần tử đang focus, **không bao giờ bị ghi đè** bởi hover/selection                |
| **Selection** (bền vững)                      | reducer                        | halo mạnh + `aria-pressed=true` ở mục chọn; hàng bảng tô nền + (thẻ) `ring-2 ring-accent-primary` |
| **Preview** (tạm thời) = `focused ?? hovered` | reducer                        | halo nhẹ ở mục xem trước + cùng nhóm liên quan nổi                                                |

Trả lời các câu của prompt (đề xuất, D-M8-03):

1. Hover **không** thay thế highlight của mục đã chọn: cả hai cùng hiện (selection mạnh, preview nhẹ).
2. Focus ring luôn hiện; preview lấy **focus trước, rồi hover** (`focused ?? hovered`) — theo xác nhận của owner: khi con trỏ nằm sẵn trên một phần tử mà người dùng Tab sang phần tử khác, preview phải theo focus để trải nghiệm bàn phím dự đoán được; khi focus rời, preview quay về phần tử đang hover (nếu có).
3. Con trỏ rời **không** xoá selection.
4. `Esc` chỉ xoá selection (Mục 22).
5. Chọn một mục **không** đổi công tắc hiển thị aspect hay bất kỳ tuỳ chọn nào.
6. Chọn aspect ⇒ hai hành tinh đầu mút **liên quan** (halo nhẹ, `aria-pressed=false`).
7. Chọn hành tinh ⇒ các aspect của nó nổi trên wheel (nếu bật), các aspect khác mờ; Aspect Table lọc.
8. Mục chọn không còn khả dụng ⇒ `resolveSelection` trả `none` ngay khi render; không giữ tham chiếu chết.

**Quy tắc theo xác nhận của owner cho D-M8-03 (bắt buộc, kiểm thử được):**

1. `selected` giữ highlight bền vững; hover/focus **không** xoá hoặc che nó.
2. `previewed = focused ?? hovered` (focus ưu tiên).
3. Không có focus ⇒ dùng hover làm preview.
4. Khi có preview có thể làm mờ phần tử không liên quan, **nhưng không làm mờ selection** (selection luôn thuộc `emphasis` nên không bị mờ).
5. Hover một aspect ⇒ nổi aspect đó **và** hai hành tinh đầu mút.
6. Focus rời không xoá selection.
7. Pointer leave **chỉ** xoá `hovered` (không đụng `focused`/`selection`).
8. `focused` trong state chỉ để **đồng bộ preview giữa wheel và bảng**; nguồn sự thật của focus thật là DOM — `focused` chỉ được cập nhật từ sự kiện `onFocus`/`onBlur` thực, **không** dùng state để giả lập hay điều khiển focus. Không lưu thêm dữ liệu suy ra được.
9. (R15) Nếu phần tử đang focus bị tháo khỏi DOM (ví dụ hàng aspect biến mất khi bộ lọc thu hẹp) trình duyệt có thể không phát `blur` ⇒ `focused` cũ. Giảm thiểu: `key` hàng ổn định (Mục 20) + `resolvePreview` bỏ qua `focused` là aspect không còn nằm trong danh sách đang hiển thị; test `U-focus-stale`.

**Mờ phần còn lại (F4 §16):** khi `emphasis.active` (tồn tại selection hoặc preview), phần tử **không** thuộc `emphasis` nhận lớp `opacity-40`(hành tinh)/`opacity-25`(đường). **Không dựa vào màu:** mục được chọn có **halo/độ dày nét** + `aria-pressed` + văn bản ở detail; chi tiết rủi ro tương phản nét Căng thẳng nền sáng 2,56:1 (KG-M6-08) nên trạng thái nổi dùng **độ dày + halo**, không chỉ đổi màu.

## 20. Filter Chips and Aspect Visibility

**Sự thật hiện tại (VERIFIED):** có **hai** cơ chế khác nhau, không cái nào là "lọc loại aspect":

| Cơ chế                                                 | Chủ                               | Ý nghĩa                                                 | M8                                                                                             |
| ------------------------------------------------------ | --------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Công tắc "Hiện đường góc chiếu" (+ `AspectLegend`)     | Shell (`userChoice ?? matchesMd`) | **bật/tắt vẽ** lớp aspect trên wheel; dữ liệu không đổi | **giữ nguyên**; không nhập vào reducer                                                         |
| `AspectFilterChip` ("Đang lọc: X") + `filterPlanetKey` | prop của `AspectTable`            | **lọc hàng** bảng theo hành tinh                        | **suy ra từ selection**; chip ✕ ⇒ `clear`                                                      |
| Lọc theo loại/tính chất aspect                         | —                                 | **không tồn tại**                                       | **không thêm** (ngoài phạm vi); ví dụ "Đã ẩn các góc chiếu căng thẳng" của prompt chỉ minh hoạ |

**Ngữ nghĩa điều khiển / `aria-pressed`:**

- Công tắc: `role="switch"` (đã có) — **không** `aria-pressed` (đã đúng).
- Chip lọc: là **nút hành động "xoá lọc"** — chỉ có thể **tắt** bộ lọc, không bật lại từ chip (bật = chọn hành tinh ở nơi khác). Theo nguyên tắc owner nêu (semantics theo hành vi, không theo tên gọi): `aria-pressed` chỉ dùng cho **toggle bật/tắt**; chip này là hành động dismiss nên **không** `aria-pressed`. Nếu sau này chip trở thành nút bật/tắt một bộ lọc độc lập thì phải thêm `aria-pressed`. Giữ `aria-label="Xóa bộ lọc theo …"` (M7, VERIFIED).
- Legend: không tương tác.

**Hành vi khi mục chọn "bị ẩn":**

- **Công tắc tắt khi đã chọn aspect:** selection **giữ nguyên** (tắt vẽ ≠ bỏ dữ liệu). Wheel: không có đường để nổi; 2 hành tinh vẫn nổi; bảng/detail không đổi.
- **Chọn aspect từ bảng khi công tắc đang tắt:** **không tự bật công tắc** (không đổi tuỳ chọn người dùng, bảo toàn D-M6-09); wheel chỉ nổi 2 hành tinh; `SelectionDetail` đầy đủ. Mặc định mobile (< 768px) là tắt nên đây là đường chính trên điện thoại.
- **Lọc hành tinh làm "ẩn" aspect đã chọn:** không thể xảy ra về cấu trúc — bộ lọc **chỉ tồn tại khi `selection` là hành tinh**, mà đơn chọn nghĩa là khi chọn aspect bộ lọc tự biến mất. **Hệ quả UX cần chấp nhận (ghi D-M8-04):** từ trạng thái "chọn hành tinh → bảng đã lọc", chọn một hàng aspect sẽ **thay** selection ⇒ bộ lọc biến mất, bảng trở về đầy đủ (hàng được chọn vẫn tô, có thể nhảy vị trí).
- Aspect có đầu mút bị bỏ (`skipped`: thiếu/mơ hồ/trùng): vẫn **chọn được từ bảng**; wheel không có đường; hành tinh liên quan chỉ nổi nếu tồn tại.

**Quan hệ legend ↔ rendering:** `AspectLegend` suy từ `aspectGeometry.legend` (đã có); M8 không đổi. Không có nguồn sự thật thứ hai cho hiển thị aspect.

**Quản lý focus và bảng "nhảy" khi lọc đổi (D-M8-04 theo xác nhận; D-M8-19 là chi tiết đề xuất):**

- **Một transition duy nhất:** `select`/`clear` đổi `selection` ⇒ `filterPlanetKey` và `displayedAspects` suy ra **cùng lần render**; không có bước trung gian "chip cũ + selection mới".
- **Lỗi phát hiện cần sửa (`AspectTable.tsx:121,188`):** `key` hàng là `` `${aspect.key}#${index}` `` với `index` là vị trí trong danh sách **đang hiển thị**. Khi bộ lọc biến mất (chọn aspect lúc đang lọc theo hành tinh) vị trí đổi ⇒ `key` đổi ⇒ React **tháo và dựng lại** hàng ⇒ nút vừa bấm **mất focus**. Sửa: `key={aspect.key}` (đã duy nhất nhờ hậu tố `#n` của `buildAspects`). `PlanetTable` không lọc nên không bị ảnh hưởng.
- **Không tự chuyển focus sang hàng khác.** Chỉ chuyển focus khi **phần tử đang focus bị gỡ khỏi DOM**: _chip ✕_ → tiêu đề "Góc chiếu" của `AspectTable` (`<h2>` đã có `id`, thêm `tabIndex={-1}`); _nút "Bỏ chọn" ở `SelectionDetail`_ → tiêu đề "Chi tiết đang chọn" (`tabIndex={-1}`). Mọi thao tác khác (chọn từ bảng/wheel, `Esc`) **không** đổi focus.
- **Bảng rỗng:** giữ mẫu hiện có — `AspectTable` đã có `EmptyState` khi không có aspect và dòng "Không có góc chiếu nào của {tên} trong dữ liệu" khi hành tinh được chọn không có aspect (`AspectTable.tsx:80-87`); **không** giữ dữ liệu cũ.
- Kiểm thử: K9 (sau chip ✕ bằng bàn phím, `activeElement` là tiêu đề, không phải `body`), K10 (chọn hàng aspect khi đang lọc: nút vừa bấm **vẫn là** `activeElement`), K11 (sau "Bỏ chọn" focus ở tiêu đề detail), S-F4 (bảng rỗng không giữ hàng cũ).

## 21. Keyboard Interaction

**Chiến lược (D-M8-11, inherited F4 dòng 425):** mỗi hành tinh trên wheel là **một tab stop** (`tabIndex=0`, ≤ 14), **không roving tabindex, không phím mũi tên**. Lý do: số phần tử nhỏ, mô hình đơn giản, kiểm thử được bằng `user.tab()`; mũi tên cần hợp đồng đầy đủ (thứ tự vòng, wrap, Home/End) mà không có giá trị lớn khi bảng đã cung cấp đường dẫn bàn phím. **Đường aspect trên wheel không là tab stop** (có thể ~40) — chức năng tương đương qua nút hàng Aspect Table (WCAG 2.1.1 đạt nhờ bảng).

| Phím                             | Đích                                                | Chuyển trạng thái                    | Thông báo                                          | Test   |
| -------------------------------- | --------------------------------------------------- | ------------------------------------ | -------------------------------------------------- | ------ |
| `Tab` / `Shift+Tab`              | nhóm hành tinh, nút bảng, công tắc, chip, "Bỏ chọn" | `focusEnter/Leave` (preview)         | tên truy cập của phần tử (native), **không** live  | K1     |
| `Enter` hoặc `Space`             | nhóm hành tinh trên wheel                           | `select` (toggle)                    | live "Đã chọn …"/"Đã bỏ chọn"                      | K2     |
| `Enter` / `Space`                | nút hàng bảng (có sẵn)                              | `select`                             | như trên                                           | K3     |
| `Esc`                            | bất kỳ phần tử focus trong Shell                    | `escape`                             | "Đã bỏ chọn" nếu có selection; không gì nếu `none` | K4, K5 |
| `Space` trên `<g role="button">` |                                                     | `preventDefault()` (chặn cuộn trang) |                                                    | K6     |

**Focus sau thao tác:** **không dời focus** (chọn từ bảng không nhảy sang wheel; chọn từ wheel không nhảy sang detail). Detail cập nhật tại chỗ. **Thứ tự Tab:** công tắc → vùng cuộn wheel → các hành tinh theo thứ tự DOM chính tắc (đã sắp theo `PLANET_ORDER`) → nút "Bỏ chọn" (nếu có selection) → Planet Table → House Table → Aspect Table.

**Ràng buộc lint:** `eslint-plugin-jsx-a11y` recommended đang bật; `<g role="button" tabIndex={0} onClick onKeyDown>` phải thoả `interactive-supports-focus`, `click-events-have-key-events`, `no-static-element-interactions`. `no-noninteractive-tabindex` chỉ cho phép `tabpanel`/`region` (vùng cuộn wheel đã dùng `region`) — nhóm hành tinh có `role="button"` nên **hợp lệ**.

## 22. Escape Behavior

Quy tắc (D-M8-07, một phần inherited): **`Esc` xoá selection bền vững và chỉ thế.**

| Câu hỏi                | Quyết định                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Xoá gì?                | `selection → none`. **Không** xoá hover/focus, **không** đổi công tắc hiển thị, **không** điều hướng, **không** đóng gì khác                    |
| Khi không có selection | **no-op**; không `preventDefault`, không live                                                                                                   |
| Phạm vi                | **handler cấp component**: `onKeyDown` ở phần tử gốc của Shell (`data-testid="chart-viewer-shell"`); chỉ xử lý khi sự kiện nổi bọt từ bên trong |
| Listener toàn cục?     | **Không** (không cần). Không có vòng đời/cleanup đặc biệt                                                                                       |
| Focus                  | giữ nguyên                                                                                                                                      |
| Tooltip/overlay        | **không có** (SelectionDetail là khối inline; không modal)                                                                                      |
| Xung đột               | nếu sau này có Dialog trong Shell, Dialog phải `stopPropagation` Esc của nó (ghi chú cho S4.9)                                                  |

## 23. ARIA and Semantic Controls

| Điều khiển                   | Phần tử/Role                                                                                                                    | Trạng thái                         | `aria-pressed`?                                              | Ghi chú                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hành tinh trên wheel         | `<g role="button" tabIndex=0 aria-label>`                                                                                       | chọn: `aria-pressed`               | **Có**, chỉ phản ánh `selected` (không phản ánh hover/focus) | tên truy cập dạng **"Chọn {tên, cung, độ, nhà}"**, đồng bộ mẫu "Chọn …" của nút trong bảng (ví dụ "Chọn Sao Hỏa, ở Bạch Dương, nhà 7"); Enter/Space chọn; có chỉ báo focus trực quan |
| Đường aspect trên wheel      | nhóm vùng chạm riêng `<g aria-hidden="true">`, **không có phần tử focusable bên trong** (không `tabindex`, `focusable="false"`) | —                                  | **Không**                                                    | chỉ là phần tử con trỏ/chạm; **không phải đường duy nhất** để chọn aspect (điều kiện bên dưới)                                                                                       |
| Nút hàng Planet/Aspect Table | `<button>` (có sẵn)                                                                                                             | `aria-pressed`                     | **Có** (đã implement, D-M7-3)                                | giữ                                                                                                                                                                                  |
| Hàng bảng `<tr>`             | không đổi                                                                                                                       | tô nền khi chọn                    | **Không**                                                    | tránh `aria-selected` trên hàng không thuộc `grid`                                                                                                                                   |
| Chip lọc                     | `<button>`                                                                                                                      | hành động xoá                      | **Không**                                                    |                                                                                                                                                                                      |
| Công tắc M6                  | `role="switch"` (input)                                                                                                         | `checked`                          | **Không**                                                    |                                                                                                                                                                                      |
| `SelectionDetail`            | `<section aria-labelledby>`                                                                                                     | —                                  | **Không**                                                    | không live                                                                                                                                                                           |
| Nút "Bỏ chọn"                | `<button>`                                                                                                                      | hành động                          | **Không**                                                    |                                                                                                                                                                                      |
| Hành tinh "liên quan"        | cùng nút                                                                                                                        | `aria-pressed=false` + tô halo nhẹ | không                                                        | thông tin ở detail + live                                                                                                                                                            |

**Phân biệt:** _selection_ (`aria-pressed`) ≠ _toggle hiển thị_ (`switch`) ≠ _focus_ (native) ≠ _hover_ (không có semantics, chỉ trực quan).
**Chuyển `role` của M5:** `PlanetLayer` hiện `role="img"`; khi có `interaction` ⇒ `role="button"`. Khi **không** có `interaction` (ví dụ test cũ) ⇒ giữ `role="img"` ⇒ PL7/PL9 còn hợp lệ cho chế độ tĩnh; thêm ca mới cho chế độ tương tác (Mục 36).

**Điều kiện cho đường aspect pointer-only (D-M8-08, theo xác nhận của owner):**

1. Đường aspect là phần tử trình bày/con trỏ, **không** là cách duy nhất chọn aspect.
2. `AspectTable` cung cấp thao tác chọn tương đương bằng bàn phím (đã có, M7).
3. Aspect đang chọn nhận biết được qua bảng (`aria-pressed`, hàng tô) và `SelectionDetail`.
4. Chỉ ẩn đường khỏi cây trợ năng **vì** có phương thức thay thế dễ tìm, đầy đủ, đồng bộ. Để dễ tìm: mở rộng câu gợi ý công tắc (M6) thành "Chỉ thay đổi hình vẽ; chọn góc chiếu bằng bàn phím ở bảng góc chiếu bên dưới." _(copy đề xuất; owner xác nhận khi review M8.2)_.
5. Chạm trên đường vẫn hoạt động trên cảm ứng.
6. **`aria-hidden` không được đặt lên container chứa control tương tác mà người dùng cần.** Nhóm nét nhìn của M6 giữ `aria-hidden`; vùng chạm nằm trong nhóm riêng `aria-hidden` **không chứa phần tử focusable**; nhóm hành tinh (`role="button"`) nằm ở `PlanetLayer`, **không** nằm trong nhóm `aria-hidden` nào. Test: axe `aria-hidden-focus` + khẳng định không có `tabindex`/focusable trong nhóm bị ẩn.

**Phát hiện kiểm chứng (probe lint trong sandbox, đã xoá):** `eslint-plugin-jsx-a11y` **không** kiểm phần tử SVG `<g>`/`<path>` — `<path onClick>`, `<g onClick>` không role và `<g role="button" aria-pressed onClick onKeyDown>` **thiếu `tabIndex`** đều **không** bị báo lỗi. Hệ quả: lint **không** bảo vệ a11y của wheel; `tabIndex`, Enter/Space, `aria-pressed`, accessible name phải được **test** (K1, K2, K6, PL-I, AX-W1), không dựa vào lint (R16).

**Dự phòng nếu SVG `role="button"` không ổn định (theo owner):** nếu kiểm thủ công ở M8.4 cho thấy `<g role="button">` không được đọc đúng (tên, trạng thái pressed) hoặc không focus được trên ít nhất một tổ hợp NVDA+Chrome/Firefox hoặc VoiceOver+Safari, chuyển sang **nút HTML phủ lên wheel** (`<button>` đặt tuyệt đối theo toạ độ % từ `PlanetRenderItem`, SVG giữ phần hình). Không dựng trước; cổng quyết định ở M8.4; nếu kích hoạt phải lập lại task M8.3 (R17).

## 24. Live Region

| Mục                                                                                                     | Quyết định (D-M8-09)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vị trí                                                                                                  | **một** phần tử trong `ChartViewerShell` (gốc, ngoài Card): `<div role="status" className="sr-only">`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Role/politeness                                                                                         | `role="status"` (ngầm `aria-live="polite"`, `aria-atomic="true"`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Kích hoạt                                                                                               | **chỉ** khi `announcement.seq` đổi (chọn/bỏ chọn thực sự đổi `selection`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Không** kích hoạt                                                                                     | hover, focus, preview, bật/tắt công tắc (đã có trạng thái native), `Esc` khi không có selection                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Nội dung (tiếng Việt, suy ra từ `announcement` + `effectiveSelection` + `vm`; **ví dụ, không cố định**) | Hành tinh: `Đã chọn {nameVi} ở {cung}[, nhà {n}].` — **bỏ phần nhà** khi `houseNumber = null`; thêm ` Không có góc chiếu liên quan.` nếu hành tinh không có aspect · Aspect: `Đã chọn góc chiếu {loại viết thường} giữa {A} và {B}.` dùng **đúng tên và hành tinh thực tế** của chart (ví dụ "Đã chọn góc chiếu tam hợp giữa Sao Kim và Sao Mộc.") · Bỏ chọn: `Đã bỏ chọn.` · Độ, orb, nghịch hành **không** nằm trong thông báo (có ở `aria-label` và `SelectionDetail`)                                                                                                                                                                                                                                                                                                          |
| Chọn nhanh liên tiếp                                                                                    | mỗi thay đổi đặt lại chuỗi theo state mới nhất; không timer/debounce (`role="status"` tự thay thế nội dung); không xếp hàng                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Trùng lặp với `AspectTable`                                                                             | **Đã kiểm nguồn trước khi xoá:** `AspectTable.tsx:70` là `<div aria-live="polite" className="min-h-[2rem]">` **chỉ bao chip lọc** (không bao thông báo rỗng); nó đọc nhãn chip khi chip xuất hiện (M7 AC-CHIP, kiểm thủ công). Sau M8 chip chỉ xuất hiện do selection ⇒ cùng một hành động bị đọc hai lần. Thông báo "Không có góc chiếu nào của X" **không** nằm trong vùng live hiện tại nên không bị mất. **Quyết định (D-M8-09/16, đã duyệt kèm làm rõ):** bỏ `aria-live` khỏi wrapper (giữ `div` + `min-h` để không dịch bố cục) và đưa thông tin có ích vào thông báo trung tâm (câu hành tinh thêm "Không có góc chiếu liên quan." khi hành tinh không có aspect). Không test hiện có phụ thuộc `polite` (`grep`), nhưng phải chạy lại `AspectTable`/`AspectFilterChip`/axe |
| Không là kênh duy nhất                                                                                  | bảng và `SelectionDetail` luôn hiển thị đầy đủ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Đổi hiển thị aspect                                                                                     | không thông báo riêng (công tắc đã có tên + trạng thái native)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## 25. Touch Interaction

| Câu hỏi                   | Quyết định (D-M8-10, inherited F4 dòng 730/§26)                                                                                                                                                                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chạm lần đầu              | **chọn** (không cần hover)                                                                                                                                                                                                                                                                                                  |
| Chạm lần hai cùng mục     | **bỏ chọn** (khớp "chọn lại ⇒ none")                                                                                                                                                                                                                                                                                        |
| Cách bỏ chọn khác         | nút **"Bỏ chọn"** trong `SelectionDetail` (luôn hiện khi có selection), chip lọc ✕, hoặc chọn mục khác                                                                                                                                                                                                                      |
| Chạm nền wheel để bỏ chọn | **không** (dễ nhầm với cuộn, không có yêu cầu)                                                                                                                                                                                                                                                                              |
| Hiện chi tiết             | `SelectionDetail` inline dưới wheel (không tooltip)                                                                                                                                                                                                                                                                         |
| Hover trên cảm ứng        | `onPointerEnter/Leave` chỉ xử lý khi `pointerType === "mouse"` ⇒ không "hover dính"                                                                                                                                                                                                                                         |
| Mục bị che/chồng          | dùng bảng/thẻ (nút ≥ 44px đã có) là đường chính; wheel không cam kết chọn chính xác trong cụm dày                                                                                                                                                                                                                           |
| Vùng chạm tối thiểu       | nhãn hành tinh ~ 24 × 12 px ở 400px (nhỏ hơn 44px); **đề xuất:** mỗi nhóm có `<rect>` vùng chạm trong suốt tối thiểu **36 × 36 đơn vị** (≈ 24 × 24 CSS px ở 400 px — mức tối thiểu WCAG 2.5.8 AA), vẽ theo thứ tự DOM; vùng chạm chồng trong cụm dày ⇒ phần tử sau đè phần tử trước; chấp nhận, bảng là đường dẫn chính xác |
| Đường aspect              | vùng chạm `<path>` trong suốt `strokeWidth ≈ 14` đơn vị (≈ 9 px ở 400 px), `pointer-events: stroke`; đường chặt (orb nhỏ) vẽ sau ⇒ nằm trên                                                                                                                                                                                 |
| Kiểm chứng                | test mô phỏng chạm chỉ chứng minh logic; **cần kiểm thủ công trên iOS/Android** (M6 mới kiểm Windows)                                                                                                                                                                                                                       |

## 26. SelectionDetail Behavior

**Hợp đồng (F4 dòng 231, 379):** `SelectionDetail({ selection, vm, onClear })`; **tạo mới** `ui/SelectionDetail/SelectionDetail.tsx` (+ test, `index.ts`) theo cấu trúc thư mục từng component của `ui/`. Là **khối inline** trong Card wheel, **dưới** `ChartWheel` (không tooltip, không popover, không modal — F4 dòng 379; hai cột `lg` thuộc S4.9).

| Trạng thái                                       | Nội dung                                                                                                                                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `none`                                           | một dòng gợi ý "Chọn một hành tinh hoặc góc chiếu để xem chi tiết." (giữ `min-h` để tránh nhảy bố cục)                                                                     |
| `planet`                                         | tên + glyph, cung, `degreeLabel`, nhà (bỏ khi `null`), "Nghịch hành" (khi có), "Có N góc chiếu" (đếm `vm.aspects` có hành tinh làm đầu mút — lọc cấu trúc) + nút "Bỏ chọn" |
| `aspect`                                         | loại (`AspectBadge`), nhóm tính chất, hành tinh A và B, `orbLabel`, "Tiến vào/Tách ra" (`applyingLabelVi`) + nút "Bỏ chọn"                                                 |
| Mục chọn không còn trong `vm`                    | hiển thị trạng thái `none` (đã suy ra qua `resolveSelection`)                                                                                                              |
| Aspect bị ẩn trên wheel (công tắc tắt/`skipped`) | **vẫn hiển thị đầy đủ** (detail không phụ thuộc wheel)                                                                                                                     |
| A11y                                             | `<section aria-labelledby>` với tiêu đề "Chi tiết đang chọn"; **không** `aria-live` (live region riêng); nội dung là văn bản thật, không chỉ màu                           |
| Dữ liệu                                          | **tra từ `vm` theo khoá**, không lưu bản sao; không gọi API                                                                                                                |

**Điều kiện đã duyệt cho D-M8-14 (ghi vào hợp đồng):** (1) detail **suy ra** từ canonical selection; (2) không có selection ⇒ gợi ý theo mẫu hiện có (đoạn chữ nghiêng như `AspectTable` khi rỗng); (3) đổi selection cập nhật nội dung inline **không tự ý chuyển focus** (ngoại lệ duy nhất: nút "Bỏ chọn" bị gỡ ⇒ focus về tiêu đề detail, Mục 20); (4) **không** `aria-live` riêng — thông báo do live region ở Shell; (5) **không** tự cuộn trang khi chọn, trừ khi kiểm thử usability cho thấy cần; (6) nếu S4.9 đổi bố cục desktop, chỉ đổi vị trí hiển thị, **không** đổi selection model hay thêm nguồn state.

## 27. Accessibility Strategy

1. **Cấu trúc bảng giữ nguyên** là phương án thay thế đầy đủ (IR-10); wheel là bổ sung.
2. **Native trước:** nút trong bảng/thẻ (đã có), công tắc, chip, "Bỏ chọn" là `<button>`/`input`; chỉ nhóm hành tinh SVG dùng `role="button"` + `tabIndex` + phím.
3. **Không chỉ màu:** halo/độ dày/`aria-pressed`/văn bản detail; kiểu nét M6 giữ nguyên.
4. **Một live region**, thông báo theo sự kiện, không theo hover.
5. **Focus ring SVG:** dùng ring tường minh (`<rect>` viền) hiện bằng `group-focus-visible` của Tailwind trên nhóm `group`; nếu một trình duyệt không vẽ được thì ring là yêu cầu chặn đóng M8 (kiểm thủ công Chrome/Firefox/Safari). jsdom **không** xác minh được ⇒ test chỉ khẳng định có lớp tương ứng.
6. **Axe:** `vitest-axe` (VERIFIED có sẵn) cho Shell ở các trạng thái none/planet/aspect, công tắc bật/tắt, bảng/thẻ; **không** cài thêm. Axe chạy trên jsdom nên không bắt tương phản/vòng focus thật ⇒ thêm bước thủ công.
7. **Thủ công bắt buộc:** bàn phím (Tab/Enter/Space/Esc), NVDA/VoiceOver đọc nhóm hành tinh (tên + trạng thái bấm), live region, cảm ứng iOS/Android, vòng focus SVG đa trình duyệt, tương phản trạng thái chọn ở 2 theme.

---

## 28. Implementation Task Breakdown

> Quy trình đã chốt: **xác nhận quyết định trước khi sinh mã** (Mục 39.1); mỗi task một nhóm commit nhỏ; commit chỉ chạm `docs/**` tách khỏi commit chạm `frontend/**`; Evidence Matrix chỉ ghi lệnh **đã thật sự chạy**. Cần `cp .env.example .env` khi chạy test cục bộ (CI đã làm). Lệnh kiểm chung mỗi task: `cd frontend && npm run lint && npm run typecheck && npm run format:check` + `npx vitest run <phạm vi>`.
> Chia 5 task (không chia nhỏ hơn: tránh chi phí phối hợp). Task M8.1 → M8.4 tuần tự.

### M8.0 — Dọn tiền đề và cổng quyết định (docs-only)

| Mục                | Nội dung                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Objective        | ghi nhận 5 quyết định đã duyệt (`Confirmation_1`); dọn tồn đọng M6; đồng bộ F4 plan với thực tế                                                                 |
| 2 Rationale        | blueprint M6 còn sót; F4 plan gọi `ChartViewer`, `hoveredKey` chỉ cho hành tinh; 5 quyết định đã được owner duyệt, cần ghi vào tài liệu                         |
| 3 Preconditions    | M6 đóng (đã có); owner đã trả lời (Mục 39.2)                                                                                                                    |
| 4 Inspect          | F4 plan §13, §16, §20, §26, §27, dòng 730; matrix M6 (không sửa nội dung)                                                                                       |
| 5 Likely change    | **xoá** `docs/implementation/Sprint_F4_M6_Implementation_Plan.md`; sửa F4 plan: tên `ChartViewerShell`, `hover` mở rộng cho aspect, ghi chú `Selection` đã chốt |
| 6 Steps            | (1) xoá blueprint M6; (2) cập nhật F4 plan; (3) commit docs-only                                                                                                |
| 7 State/transition | không                                                                                                                                                           |
| 8 Contracts        | không                                                                                                                                                           |
| 9 Tests            | không (`git diff --stat` chỉ chạm `docs/**`)                                                                                                                    |
| 10 Verification    | không có CI riêng (workflow chỉ chạy khi đổi `frontend/**`/`backend/**`/workflow)                                                                               |
| 11 Acceptance      | blueprint M6 không còn; F4 plan nhất quán với quyết định đã duyệt                                                                                               |
| 12 Dependencies    | → M8.1                                                                                                                                                          |
| 13 Out of scope    | sửa mã; sửa nội dung Evidence Matrix M1–M7                                                                                                                      |
| 14 Risks           | quyết định chưa được duyệt ⇒ **không** bắt đầu M8.1                                                                                                             |

### M8.1 — Mô hình selection, reducer và định danh render

| Mục                | Nội dung                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Objective        | `model/selection.ts` thuần + reducer + hàm suy ra; trường `key` cho `PlanetRenderItem`                                                                              |
| 2 Rationale        | rủi ro lớn nhất là logic chuyển trạng thái; kiểm được độc lập React; wheel cần phát `PlanetKey` thô                                                                 |
| 3 Preconditions    | M8.0                                                                                                                                                                |
| 4 Inspect          | `model/chartViewModel.ts` (`PlanetKey`, `AspectKey`, `AspectVM`, `PlanetVM`), `model/planetGeometry.ts` (`PlanetRenderItem`), F4 plan §26                           |
| 5 Likely change    | **Create** `model/selection.ts`, `model/selection.test.ts`; **Modify** `model/planetGeometry.ts` (+ `key: PlanetKey`, **cộng thêm**) + `planetGeometry.test.ts`     |
| 6 Steps            | kiểu → trạng thái mặc định → reducer (bảng Mục 15) → `resolveSelection` → `computeEmphasis` → `buildLiveMessage(announcement, selection, vm)` → trường `key` → test |
| 7 State/transition | Mục 15 (bảng chuyển trạng thái, bất biến 1–8)                                                                                                                       |
| 8 Contracts        | `InteractionState/Action/Target`, `Selection`, `Emphasis`; không đổi `ChartViewModel`                                                                               |
| 9 Tests            | `U1–U24` reducer; `resolveSelection`, `computeEmphasis`, `buildLiveMessage` (mỗi hàm ≥ 4 ca); `P-key` (mọi hành tinh có `key` đúng, trùng key vẫn có `id` duy nhất) |
| 10 Verification    | `npx vitest run src/features/chart/model/selection.test.ts src/features/chart/model/planetGeometry.test.ts` + 3 lệnh tĩnh                                           |
| 11 Acceptance      | AC-S1, AC-S10, AC-S11 (Mục 36); coverage `selection.ts` ≥ 95% câu lệnh **và** nhánh; Gate G-1, G-3, G-10 sạch                                                       |
| 12 Dependencies    | M8.0 → M8.2                                                                                                                                                         |
| 13 Out of scope    | React, SVG, bảng                                                                                                                                                    |
| 14 Risks           | thêm `key` làm vỡ `toEqual` cũ của `planetGeometry.test.ts` ⇒ cập nhật có chủ đích, giữ nguyên các khẳng định còn lại                                               |

### M8.2 — Shell, bảng, SelectionDetail, live region, Escape

| Mục                | Nội dung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Objective        | `ChartViewerShell` giữ reducer; nối `PlanetTable`/`AspectTable`; tạo `SelectionDetail`; live region; `Esc`; chip lọc suy ra                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2 Rationale        | đóng các Case B, D, E, F ở phía bảng/detail trước khi đụng SVG                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 3 Preconditions    | M8.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4 Inspect          | `ChartViewerShell.tsx` (+test), `PlanetTable.tsx`, `AspectTable.tsx`, `AspectFilterChip.tsx`, `AspectBadge`, `ui/index` của từng thư mục, `shared/ui/Card`, `shared/ui/Button`                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 5 Likely change    | **Modify** `ChartViewerShell.tsx`(+test), `PlanetTable.tsx`(+test: `relatedKeys`, `onPreview`), `AspectTable.tsx`(+test: `onPreview`, bỏ `aria-live` wrapper); **Create** `ui/SelectionDetail/{SelectionDetail.tsx,SelectionDetail.test.tsx,index.ts}`                                                                                                                                                                                                                                                                                                                                                                                                    |
| 6 Steps            | (1) `useReducer` + dẫn xuất (`resolveSelection`, `emphasis`, `filterPlanetKey`, `detail`, `liveMessage`); (2) truyền `selectedKey/onSelect/onPreview` cho bảng, `filterPlanetKey/onClearFilter(=clear)`; (3) `SelectionDetail` dưới wheel trong Card; (4) `<div role="status" class="sr-only">` ở gốc; (5) `onKeyDown` Esc ở phần tử gốc; (6) bỏ `aria-live` của wrapper chip; (7) đổi `key` hàng `AspectTable` thành `aspect.key` (sửa mất focus khi bộ lọc đổi); (8) quản lý focus khi phần tử focus bị gỡ (chip ✕ → tiêu đề "Góc chiếu" `tabIndex={-1}`; "Bỏ chọn" → tiêu đề detail); (9) `resolvePreview` loại `focused` là aspect không còn hiển thị |
| 7 State/transition | chủ duy nhất = Shell; không `useState` chọn ở bảng/detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 8 Contracts        | Mục 17 (bảng props)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 9 Tests            | S-B1, S-D1, S-D2, S-E1…E4, S-F1…F3, K3–K5, SD1–SD6, PT1–PT3, AT1–AT4, AX-S1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 10 Verification    | `npx vitest run src/features/chart/ui/ChartViewerShell src/features/chart/ui/PlanetTable src/features/chart/ui/AspectTable src/features/chart/ui/SelectionDetail` + 3 lệnh tĩnh                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 11 Acceptance      | AC-S2…S8, S12–S14 (phía bảng); không có state chọn trong con                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 12 Dependencies    | M8.1 → M8.3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 13 Out of scope    | SVG; hit target; focus ring                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 14 Risks           | R5 (đọc trùng live), R8 (truy vấn test trùng "góc chiếu"/tên hành tinh khi có thêm nút)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

### M8.3 — Wheel tương tác

| Mục                | Nội dung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Objective        | hành tinh `role="button"`; vùng chạm aspect; halo/mờ; focus ring; preview                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2 Rationale        | đóng Case A, C, G phía wheel                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 3 Preconditions    | M8.2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 4 Inspect          | `PlanetLayer.tsx`(+test), `AspectLayer.tsx`(+test), `ChartWheel.tsx`(+test), `aspectStyles.ts`, `tailwind.config.ts` (variant `group-focus-visible`, `opacity-*`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 5 Likely change    | **Modify** `PlanetLayer.tsx`, `AspectLayer.tsx`, `ChartWheel.tsx` (+ tests), `aspectStyles.ts`(nếu cần lớp mới)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6 Steps            | (1) `ChartWheel` nhận `interaction?`; (2) `PlanetLayer`: nhóm `role="button"` + `tabIndex` + `aria-pressed` + `onClick/onKeyDown` (Enter/Space, `preventDefault` Space) + `onPointerEnter/Leave` (mouse) + `onFocus/onBlur`; `<rect>` vùng chạm ≥ 36 đơn vị; halo `selected`/`related`; `opacity-40` khi mờ; (3) `AspectLayer`: `<path>` vùng chạm trong suốt `strokeWidth≈14` `pointer-events: stroke`, không tabindex, `aria-hidden`; nét `emphasis` dày hơn; `opacity-25` khi mờ; (4) giữ nguyên chế độ tĩnh khi không có `interaction`; (5) nhóm vùng chạm aspect **riêng**, `aria-hidden`, không focusable; accessible name hành tinh dạng "Chọn …"; ring focus tường minh; (6) preview theo `focused ?? hovered` |
| 7 State/transition | chỉ gọi callback; **không** `useState`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 8 Contracts        | `WheelInteraction` (Mục 17)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 9 Tests            | PL-I1…I10, AL-I1…I6, CW-I1…I4, K1, K2, K6, T1, T2, AX-W1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 10 Verification    | `npx vitest run src/features/chart/ui/ChartWheel` + 3 lệnh tĩnh + `npm run build` + Gate G-9                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 11 Acceptance      | AC-S2…S6, S9, S15 (phía wheel); chế độ tĩnh không đổi (PL7/PL9/A10 còn xanh ở chế độ tĩnh)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 12 Dependencies    | M8.2 → M8.4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 13 Out of scope    | zoom/pan; roving tabindex; phím mũi tên; tooltip                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 14 Risks           | R3 (vòng focus SVG), R4 (vùng chạm chồng), R6 (lớp CSS thiếu ⇒ vô hình)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

### M8.4 — Trợ năng, hồi quy, kiểm thủ công và đóng milestone

| Mục             | Nội dung                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Objective     | axe, hồi quy F4, kiểm thủ công, Evidence Matrix M8                                                                                                                                                                                                                                                                                                                                                                                    |
| 2 Rationale     | axe không bắt được focus/tương phản/cảm ứng thật                                                                                                                                                                                                                                                                                                                                                                                      |
| 3 Preconditions | M8.3                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 4 Inspect       | toàn bộ test nhắc "góc chiếu", tên hành tinh, `getByRole("button")`; `dist/assets/*.css`                                                                                                                                                                                                                                                                                                                                              |
| 5 Likely change | chủ yếu test + tài liệu; mã chỉ sửa khi phát hiện lỗi                                                                                                                                                                                                                                                                                                                                                                                 |
| 6 Steps         | (1) `npm test` đầy đủ + `test:coverage`; (2) `npm run build` + Gate G-1…G-12; (3) axe cho Shell (none/planet/aspect × bảng/thẻ × công tắc bật/tắt); (4) kiểm thủ công Mục 27.7 (bàn phím, NVDA/VoiceOver, iOS/Android, vòng focus Chrome/Firefox/Safari, tương phản 2 theme); (5) tạo `Sprint_F4_M8_Exit_Criteria_Evidence_Matrix.md` (ID quyết định `D-M8-*` của plan này); (6) xoá blueprint ở commit docs-only sau evidence commit |
| 7–8             | không đổi                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 9 Tests         | AX-S1, AX-W1, regression R-1…R-10                                                                                                                                                                                                                                                                                                                                                                                                     |
| 10 Verification | 4 lệnh tĩnh + `npm run build` + `npm run test:coverage` + CI xanh (gồm E2E) trên evidence commit                                                                                                                                                                                                                                                                                                                                      |
| 11 Acceptance   | toàn bộ AC-S; mỗi mục kiểm thủ công có đủ: người kiểm, thiết bị, OS + phiên bản, trình duyệt/AT + phiên bản, commit/URL, lá số, ảnh/bản ghi, ngày — thiếu thì ghi `ACCEPTED GAP`, không `VERIFIED`                                                                                                                                                                                                                                    |
| 12 Dependencies | M8.3 → S4.9                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 13 Out of scope | thêm tính năng; chuẩn bị S4.9 ngoài ghi chú bàn giao                                                                                                                                                                                                                                                                                                                                                                                  |
| 14 Risks        | R9 (thiếu thiết bị), R10 (nợ thủ công M5/M6 còn Windows-only)                                                                                                                                                                                                                                                                                                                                                                         |

## 29. Task Dependencies

```
M8.0 (docs, 5 quyết định đã duyệt)
  └► M8.1 (model + PlanetRenderItem.key)
       └► M8.2 (Shell + bảng + detail + live + Esc)
            └► M8.3 (wheel tương tác)
                 └► M8.4 (axe + hồi quy + thủ công + matrix)
Tiền đề đã xong: S4.5, S4.6, S4.7 (và S4.1–S4.4, S4.11)
Hạ nguồn: M8 → S4.9 (hardening, hai cột lg, zoom/pan nếu cần) → S4.10 (E2E)
```

Thứ tự roadmap đóng băng **không đổi**; M8 giữ vị trí S4.8.

## 30. File Change Map (Matrix E)

| Exact path                                                                                | Action                   | Responsibility                                                                                       | M8 task   | Evidence / rationale                                           |
| ----------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- |
| `docs/implementation/Sprint_F4_M6_Implementation_Plan.md`                                 | Delete (docs)            | dọn blueprint M6                                                                                     | M8.0      | còn trong `docs/implementation/` (`ls`) — **confirmed exists** |
| `docs/implementation/Sprint_F4_Implementation_Plan.md`                                    | Modify (docs)            | đồng bộ tên container, hover mở rộng                                                                 | M8.0      | F4 dòng 228/405/393 — confirmed                                |
| `docs/implementation/Sprint_F4_M8_Implementation_Plan.md`                                 | Create → delete khi đóng | blueprint                                                                                            | M8.0/M8.4 | quy ước M4–M6                                                  |
| `frontend/src/features/chart/model/selection.ts`                                          | **Create**               | kiểu, reducer, `resolveSelection`, `computeEmphasis`, `buildLiveMessage`                             | M8.1      | F4 dòng 212/667; **chưa tồn tại** (`grep`)                     |
| `frontend/src/features/chart/model/selection.test.ts`                                     | **Create** (Test)        | U1–U24 + hàm suy ra                                                                                  | M8.1      |                                                                |
| `frontend/src/features/chart/model/planetGeometry.ts` (+`.test.ts`)                       | Modify / Test            | `PlanetRenderItem.key` (cộng thêm)                                                                   | M8.1      | `PlanetRenderItem` chỉ có `id` — confirmed                     |
| `frontend/src/features/chart/ui/ChartViewerShell/ChartViewerShell.tsx` (+`.test.tsx`)     | Modify / Test            | chủ reducer, live region, Esc, nối bảng, `SelectionDetail`                                           | M8.2      | confirmed                                                      |
| `frontend/src/features/chart/ui/PlanetTable/PlanetTable.tsx` (+`.test.tsx`)               | Modify / Test            | `relatedKeys?`, `onPreview?` (additive)                                                              | M8.2      | confirmed                                                      |
| `frontend/src/features/chart/ui/AspectTable/AspectTable.tsx` (+`.test.tsx`)               | Modify / Test            | `onPreview?`; bỏ `aria-live` wrapper; `key={aspect.key}`; tiêu đề `tabIndex={-1}` + focus khi chip ✕ | M8.2      | confirmed (`:73`)                                              |
| `frontend/src/features/chart/ui/AspectTable/AspectFilterChip.tsx`                         | No change                | giữ nguyên                                                                                           | —         | hành động xoá, không `aria-pressed`                            |
| `frontend/src/features/chart/ui/HouseTable/HouseTable.tsx`                                | No change                | không tham gia chọn                                                                                  | —         | props không có select                                          |
| `frontend/src/features/chart/ui/SelectionDetail/{SelectionDetail.tsx,.test.tsx,index.ts}` | **Create**               | chi tiết suy ra từ selection + `vm`                                                                  | M8.2      | F4 dòng 231, 670; chưa tồn tại                                 |
| `frontend/src/features/chart/ui/ChartWheel/ChartWheel.tsx` (+`.test.tsx`)                 | Modify / Test            | `interaction?`                                                                                       | M8.3      | confirmed                                                      |
| `frontend/src/features/chart/ui/ChartWheel/PlanetLayer.tsx` (+`.test.tsx`)                | Modify / Test            | nhóm tương tác, vùng chạm, halo                                                                      | M8.3      | PL9 cần ca tĩnh + ca tương tác                                 |
| `frontend/src/features/chart/ui/ChartWheel/AspectLayer.tsx` (+`.test.tsx`)                | Modify / Test            | vùng chạm đường, nét nổi/mờ                                                                          | M8.3      | A10 cần ca tĩnh + ca tương tác                                 |
| `frontend/src/features/chart/ui/ChartWheel/aspectStyles.ts`                               | Modify (nếu cần)         | lớp mới cho nổi/mờ                                                                                   | M8.3      | M6.7 đã tạo file                                               |
| `frontend/src/pages/app/charts/detail/page.tsx`                                           | No change                | `key={chartId}` đã có (M6)                                                                           | —         | reset selection khi đổi chart                                  |
| `frontend/src/shared/ui/Switch/*`, `useMediaQuery.ts`                                     | No change                | tái dùng M6                                                                                          | —         |                                                                |
| `frontend/package.json`, lockfile                                                         | No change                | không dependency mới                                                                                 | —         | Gate G-7                                                       |
| `backend/**`                                                                              | No change                | không đổi API                                                                                        | —         |                                                                |
| `docs/implementation/archive/sprint-f4/Sprint_F4_M8_Exit_Criteria_Evidence_Matrix.md`     | **Create**               | bằng chứng                                                                                           | M8.4      |                                                                |

## 31. State Ownership Matrix

| State                                               | Owner                                                   | Bền vững / tạm thời                     | Suy ra hay lưu                                                    | Lý do                                                      |
| --------------------------------------------------- | ------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| Phần tử đang chọn (`selection`)                     | `ChartViewerShell` (`useReducer`)                       | **bền vững** (UI, trong vòng đời Shell) | **lưu** (khoá)                                                    | nguồn duy nhất; F4 §13 #4, #8                              |
| Hover (`hovered`)                                   | `ChartViewerShell` (reducer)                            | tạm thời                                | lưu (khoá hoặc `null`)                                            | preview chéo bề mặt cần một nơi; chỉ chuột (`pointerType`) |
| Focus bàn phím (`focused`)                          | trình duyệt cho **vòng focus**; reducer cho **preview** | tạm thời                                | lưu (khoá hoặc `null`)                                            | vòng focus không thể suy ra từ state; preview cần          |
| Preview (`focused ?? hovered`)                      | Shell                                                   | tạm thời                                | **suy ra**                                                        |                                                            |
| Tuỳ chọn hiển thị aspect (`userChoice`)             | `ChartViewerShell` (`useState`, M6)                     | tuỳ chọn UI                             | lưu                                                               | giữ nguyên M6; **không** nhập vào reducer                  |
| Lọc Aspect Table theo hành tinh (`filterPlanetKey`) | Shell                                                   | —                                       | **suy ra** từ `selection`                                         | tránh nguồn thứ hai                                        |
| Nổi/mờ (`emphasis`)                                 | Shell                                                   | —                                       | **suy ra** (`computeEmphasis`)                                    |                                                            |
| Dữ liệu `SelectionDetail`                           | `SelectionDetail`                                       | —                                       | **suy ra** từ `selection` + `vm`                                  | không sao chép                                             |
| Thông báo live (`liveMessage`)                      | Shell                                                   | tạm thời                                | suy ra từ `announcement` (lưu `{seq, kind}`) + `selection` + `vm` | cần sự kiện "đã bỏ chọn" không suy ra được từ selection    |
| Dữ liệu chart/`ChartViewModel`                      | TanStack Query + `useMemo` ở trang/Shell                | —                                       | không đưa vào store                                               | giữ nguyên                                                 |
| Store toàn cục                                      | **không**                                               | —                                       | —                                                                 | không Zustand/Context (F4 §13 #4, #6)                      |

## 32. Component Contract Matrix (Matrix B)

| Component               | Controlled props                                                                        | Callbacks                                          | State owned locally                           | State derived                                                       | Test coverage         |
| ----------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------- | --------------------- |
| `ChartViewerShell`      | `vm`                                                                                    | —                                                  | reducer `InteractionState`; `userChoice` (M6) | `emphasis`, `filterPlanetKey`, `detail`, `liveMessage`, `matchesMd` | S-A…S-G, K3–K5, AX-S1 |
| `ChartWheel`            | `vm`, `geometry?`, `aspectGeometry?`, `showAspectLines?`, **`interaction?`**            | qua `interaction`                                  | không                                         | planet model (`useMemo`)                                            | CW-I1…I4              |
| `PlanetLayer`           | `model`, `interaction?`                                                                 | `onSelect`, `onPreview`                            | **không**                                     | halo/mờ từ `emphasis`                                               | PL-I1…I10             |
| `AspectLayer`           | `geometry`, `interaction?`                                                              | `onSelect`, `onPreview`                            | **không**                                     | nổi/mờ từ `emphasis`                                                | AL-I1…I6              |
| `PlanetTable`           | `planets`, `selectedKey`, **`relatedKeys?`**, `layout`, `density`, `houseDataAvailable` | `onSelect(key)`, **`onPreview?`**                  | không                                         | `isSelected`, `isRelated`                                           | PT1–PT3 + bộ P cũ     |
| `AspectTable`           | `aspects`, `selectedKey`, `filterPlanetKey`, `filterPlanet`, `layout`, `density`        | `onSelect(key)`, `onClearFilter`, **`onPreview?`** | không                                         | `displayedAspects`                                                  | AT1–AT4 + bộ A cũ     |
| `AspectFilterChip`      | `planet`                                                                                | `onClear`                                          | không                                         | —                                                                   | giữ bộ cũ             |
| `HouseTable`            | không đổi                                                                               | —                                                  | không                                         | —                                                                   | giữ bộ cũ             |
| `SelectionDetail` (mới) | `selection`, `vm`                                                                       | `onClear`                                          | **không**                                     | nội dung chi tiết                                                   | SD1–SD6               |
| Live region             | `message` (chuỗi)                                                                       | —                                                  | không                                         | —                                                                   | S-E3, K-live          |

## 33. Interaction Transition Matrix (Matrix A)

| Trigger                            | Target             | State action                                                   | Wheel effect                               | Table effect                                                       | Detail effect    | Announcement                          | Test         |
| ---------------------------------- | ------------------ | -------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------ | ---------------- | ------------------------------------- | ------------ |
| Hover vào nhãn hành tinh (chuột)   | hành tinh P        | `hoverEnter(P)`                                                | halo nhẹ P + aspect của P nổi, còn lại mờ  | hàng P tô nhẹ; Aspect Table **không** lọc (lọc chỉ theo selection) | không đổi        | không                                 | S-H1         |
| Chuột rời                          | P                  | `hoverLeave(P)`                                                | về trạng thái theo selection/focus         | tương tự                                                           | không đổi        | không                                 | S-H2         |
| Hover chuyển nhanh P→Q             | P, Q               | `hoverLeave(P)` rồi `hoverEnter(Q)`; `leave` sai mục bị bỏ qua | halo Q                                     | tô Q                                                               | —                | không                                 | U-hover-race |
| Hover vào hàng bảng (chuột)        | P/A                | `hoverEnter` qua `onPreview`                                   | cùng hiệu ứng như hover wheel              | tô nhẹ                                                             | —                | không                                 | S-H3         |
| Focus (Tab) tới nhóm hành tinh     | P                  | `focusEnter(P)`                                                | vòng focus + preview nhẹ                   | tô nhẹ hàng P                                                      | —                | tên truy cập (native), **không** live | K1           |
| Focus rời                          | P                  | `focusLeave(P)`                                                | —                                          | —                                                                  | —                | không                                 | K1           |
| Chọn hành tinh (click/Enter/Space) | P                  | `select(P)`                                                    | halo mạnh, aspect P nổi                    | hàng `aria-pressed`, Aspect Table lọc + chip                       | detail hành tinh | "Đã chọn …"                           | S-A1         |
| Chọn lại cùng P                    | P                  | `select(P)` ⇒ `none`                                           | về mặc định                                | bỏ lọc/chọn                                                        | gợi ý            | "Đã bỏ chọn."                         | S-E2         |
| Chọn aspect (wheel hoặc bảng)      | A                  | `select(A)`                                                    | đường nổi (nếu bật), 2 hành tinh liên quan | hàng A `aria-pressed`; hàng hành tinh liên quan tô                 | detail aspect    | "Đã chọn góc chiếu …"                 | S-C1, S-D1   |
| Chọn mục khác khi đã chọn          | X→Y                | `select(Y)`                                                    | thay thế                                   | thay thế                                                           | thay thế         | "Đã chọn …" (mục mới)                 | S-A2         |
| Escape                             | bất kỳ trong Shell | `escape`                                                       | về mặc định                                | về mặc định                                                        | gợi ý            | "Đã bỏ chọn." (nếu có)                | S-E1, K4     |
| Escape khi `none`                  | —                  | `escape` ⇒ cùng tham chiếu                                     | —                                          | —                                                                  | —                | không                                 | K5           |
| Chip ✕                             | chip               | `clear`                                                        | về mặc định                                | bỏ lọc                                                             | gợi ý            | "Đã bỏ chọn."                         | S-F3         |
| "Bỏ chọn"                          | nút detail         | `clear`                                                        | về mặc định                                | về mặc định                                                        | gợi ý            | "Đã bỏ chọn."                         | S-E4         |
| Công tắc đường góc chiếu           | công tắc           | **ngoài reducer** (M6)                                         | lớp aspect mount/unmount                   | không đổi                                                          | không đổi        | native của công tắc                   | S-F1, S-F2   |
| Chạm nhóm hành tinh                | P                  | `select(P)` (không `hover`)                                    | như chọn                                   | như chọn                                                           | như chọn         | như chọn                              | T1           |
| Chạm lại                           | P                  | `select(P)` ⇒ `none`                                           | như bỏ                                     | như bỏ                                                             | như bỏ           | "Đã bỏ chọn."                         | T2           |
| Chạm vùng chạm đường               | A                  | `select(A)`                                                    | như chọn aspect                            | như chọn aspect                                                    | như chọn aspect  | như chọn aspect                       | T3           |

## 34. Keyboard Behavior Matrix

| Key                     | Target                                                                       | Expected transition                          | Expected announcement | Test                      |
| ----------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- | --------------------- | ------------------------- |
| `Tab`                   | công tắc → vùng cuộn wheel → hành tinh (thứ tự chính tắc) → "Bỏ chọn" → bảng | `focusEnter/Leave`                           | tên truy cập (native) | K1                        |
| `Enter`                 | nhóm hành tinh                                                               | `select` (toggle)                            | chọn/bỏ chọn          | K2                        |
| `Space`                 | nhóm hành tinh                                                               | `select` (toggle) + `preventDefault`         | chọn/bỏ chọn          | K2, K6                    |
| `Enter`/`Space`         | nút bảng                                                                     | `select`                                     | chọn/bỏ chọn          | K3                        |
| `Esc`                   | bất kỳ phần tử focus trong Shell                                             | `escape`                                     | "Đã bỏ chọn." nếu có  | K4                        |
| `Esc`                   | không có selection                                                           | no-op                                        | không                 | K5                        |
| Mũi tên                 | —                                                                            | **không xử lý** (không có hợp đồng)          | —                     | K7 (khẳng định không đổi) |
| Đường aspect trên wheel | —                                                                            | **không có tab stop**; dùng nút Aspect Table | —                     | K8 (`tabindex` null)      |

## 35. Filter / Selection Matrix (Matrix C)

| Current selection             | Filter action      | Expected selection                 | Wheel                                     | Table                     | Detail             |
| ----------------------------- | ------------------ | ---------------------------------- | ----------------------------------------- | ------------------------- | ------------------ |
| none                          | bật công tắc       | none                               | lớp aspect hiện                           | không đổi                 | không đổi          |
| none                          | tắt công tắc       | none                               | lớp aspect ẩn                             | không đổi                 | không đổi          |
| planet P                      | tắt công tắc       | **P** (giữ)                        | aspect ẩn; P vẫn nổi                      | bảng vẫn lọc theo P       | không đổi          |
| planet P                      | bật công tắc       | P                                  | aspect của P nổi, còn lại mờ              | không đổi                 | không đổi          |
| aspect A                      | tắt công tắc       | **A** (giữ; "bị ẩn" chỉ là vẽ)     | không còn đường; 2 hành tinh vẫn nổi      | hàng A vẫn chọn           | không đổi (đầy đủ) |
| aspect A                      | bật công tắc       | A                                  | đường A nổi                               | không đổi                 | không đổi          |
| aspect A, công tắc tắt        | chọn A từ bảng     | A (**không** tự bật công tắc)      | 2 hành tinh nổi, không đường              | hàng A chọn               | detail A           |
| planet P                      | chip ✕ (xoá lọc)   | **none** (lọc suy ra từ selection) | về mặc định                               | bỏ lọc                    | gợi ý              |
| planet P                      | chọn hàng aspect A | **A** (thay thế; bộ lọc biến mất)  | aspect A + 2 hành tinh                    | bảng về đầy đủ, hàng A tô | detail A           |
| aspect A có đầu mút `skipped` | chọn từ bảng       | A                                  | không có đường; hành tinh nổi nếu tồn tại | hàng A chọn               | detail A           |
| mục chọn không còn trong `vm` | (dữ liệu đổi)      | **none** (`resolveSelection`)      | mặc định                                  | mặc định                  | gợi ý              |

## 36. Test Matrix (Matrix D) and Acceptance Checklist

**Acceptance (provisional wording, dựa trên Mục 9; nhãn "AC Synchronization" = bộ AC-S dưới đây):**

| ID     | Tiêu chí                                                                 | Nguồn            |
| ------ | ------------------------------------------------------------------------ | ---------------- |
| AC-S1  | Chỉ **một** nguồn `selection` (không state chọn trong wheel/bảng/detail) | F4 dòng 846; §26 |
| AC-S2  | Wheel → bảng → detail đồng bộ cho hành tinh                              | §26              |
| AC-S3  | Bảng → wheel → detail đồng bộ cho hành tinh                              | §26              |
| AC-S4  | Chọn aspect làm nổi đường (khi bật) + 2 hành tinh + hàng aspect          | §26              |
| AC-S5  | Chọn từ Aspect Table đồng bộ ngược lên wheel/detail                      | §26              |
| AC-S6  | Bỏ chọn đưa mọi bề mặt về cùng trạng thái                                | §26              |
| AC-S7  | Lọc/tuỳ chọn hiển thị không để lại selection cũ hoặc mơ hồ               | prompt §23       |
| AC-S8  | Hover, focus, selection có hành vi riêng, được tài liệu hoá              | prompt §23       |
| AC-S9  | Bàn phím chọn/bỏ chọn được; vòng focus nhìn thấy                         | F4 dòng 848      |
| AC-S10 | Escape theo chính sách                                                   | §26              |
| AC-S11 | Không có hành vi chỉ-hover; cảm ứng chọn được                            | dòng 730         |
| AC-S12 | `aria-pressed` chỉ ở điều khiển phù hợp                                  | prompt §15       |
| AC-S13 | Live region hữu ích, không ồn                                            | prompt §16       |
| AC-S14 | Bảng ngữ nghĩa vẫn dùng được độc lập                                     | F4 §a11y         |
| AC-S15 | Không dựa vào màu để biểu thị chọn                                       | F4 dòng 848      |
| AC-S16 | Không dependency/store mới; `package.json` không đổi                     | F4 §13           |
| AC-S17 | Test hiện có xanh; test mới đạt; lint/typecheck/format/build đạt         | prompt §23       |

| Hành vi                                                       | Unit                   | Component      | Integration          | Accessibility | Ưu tiên      |
| ------------------------------------------------------------- | ---------------------- | -------------- | -------------------- | ------------- | ------------ |
| Reducer: select/toggle/clear/escape                           | U1–U12                 | —              | —                    | —             | **Critical** |
| Reducer: hover/focus, race `leave`, bất biến                  | U13–U20                | —              | —                    | —             | High         |
| `resolveSelection`, `computeEmphasis`, `buildLiveMessage`     | U21–U24                | —              | —                    | —             | **Critical** |
| `PlanetRenderItem.key`                                        | P-key                  | —              | —                    | —             | High         |
| Wheel→bảng→detail (hành tinh)                                 | —                      | PL-I           | S-A1, S-A2           | —             | **Critical** |
| Bảng→wheel→detail (hành tinh)                                 | —                      | PT             | S-B1                 | —             | **Critical** |
| Aspect (wheel) → bảng/detail                                  | —                      | AL-I           | S-C1                 | —             | **Critical** |
| Aspect (bảng) → wheel/detail                                  | —                      | AT             | S-D1, S-D2           | —             | **Critical** |
| Bỏ chọn (Esc/chọn lại/nút/chip)                               | U                      | SD             | S-E1…E4              | —             | **Critical** |
| Công tắc/lọc & selection                                      | —                      | —              | S-F1…F3, bảng Mục 35 | —             | High         |
| Bàn phím                                                      | —                      | PL-I           | K1–K8                | AX            | **Critical** |
| Cảm ứng                                                       | —                      | PL-I, AL-I     | T1–T3                | thủ công      | High         |
| `aria-pressed` đúng chỗ                                       | —                      | PL-I, PT, AT   | —                    | AX            | High         |
| Live region                                                   | U (`buildLiveMessage`) | —              | S-E3, K-live         | AX            | High         |
| `SelectionDetail`                                             | —                      | SD1–SD6        | S-A1                 | AX            | High         |
| Axe (Shell/wheel/bảng/detail)                                 | —                      | —              | —                    | AX-S1, AX-W1  | **Critical** |
| Chế độ tĩnh không đổi                                         | —                      | PL7/PL9/A10 cũ | R-1                  | —             | **Critical** |
| Unknown/empty: không có hành tinh, không aspect, unknown type | U22                    | PL15, AL       | S-U1, S-U2           | —             | High         |

**Test bổ sung theo xác nhận của owner:** `U-pref` (preview = `focused ?? hovered`: có focus + hover khác mục ⇒ theo focus), `U-hover-leave` (pointer leave chỉ xoá hover), `U-focus-stale` (aspect không còn hiển thị ⇒ `focused` bị bỏ qua), `AL-I7` (hover aspect nổi aspect + 2 hành tinh), `K9`–`K11` (quản lý focus, Mục 20), `S-F4` (bảng rỗng), `AX-A1` (nhóm vùng chạm aspect: không focusable bên trong, `aria-hidden-focus` sạch), `PL-I11` (accessible name bắt đầu "Chọn"; `aria-pressed` chỉ theo `selected`), `S-E5` (live: hành tinh không có nhà ⇒ bỏ "nhà"; aspect dùng tên thật; `Esc` khi `none` không phát thông báo).

## 37. Regression Matrix

| Khu vực                                                | Rủi ro                                                                   | Kiểm bằng                                                                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Wheel S4.4–S4.6 (cung/nhà/góc/hành tinh/aspect)        | thêm tương tác làm đổi hình học                                          | R-1: chạy **không sửa** `geometry`, `wheelGeometry`, `labelLayout`, `aspectGeometry` tests; toạ độ marker/aspect không đổi khi chọn |
| Chế độ tĩnh của layer                                  | `role="img"`/`pointer-events-none` bị đổi khi **không** có `interaction` | PL7/PL9/A10 giữ nguyên (chế độ tĩnh)                                                                                                |
| Planet/House/Aspect Table                              | thêm props làm đổi DOM mặc định                                          | bộ test bảng cũ chạy không sửa (props mới tuỳ chọn)                                                                                 |
| Công tắc + legend (M6), lựa chọn người dùng khi resize | M8 vô tình đổi `userChoice`                                              | SW1–SW11 (M6) giữ; ca mới "chọn aspect không bật công tắc"                                                                          |
| Loading/error/empty của Viewer                         | Shell đổi cấu trúc                                                       | `page.test.tsx`, `ChartViewerSkeleton`                                                                                              |
| Thiếu giờ sinh                                         | wheel/bảng không nhà                                                     | `chartNoHouses` + ca chọn hành tinh khi không có nhà                                                                                |
| Điều hướng/danh sách                                   | `key={chartId}`                                                          | page test đổi `chartId` ⇒ selection reset                                                                                           |
| `ChartResponse`/interpretation                         | không chạm                                                               | không đổi `api/`, `chartViewModel.ts`                                                                                               |
| Truy vấn test trùng                                    | nút mới/`aria-label` trùng tên hành tinh                                 | rà soát `getByRole/Text`; dùng `within(...)`, **không** làm yếu                                                                     |
| BE API                                                 | không đổi                                                                | `backend/**` không đổi                                                                                                              |

## 38. Quality Gates

Chỉ dùng **script có thật** (`frontend/package.json`): `lint`, `format:check`, `typecheck`, `test`, `test:coverage`, `build`, `test:e2e`. **Không có** `test:a11y`/`coverage`/`test:unit`: axe chạy **trong** vitest (`vitest-axe`, matcher ở `src/test/setup.ts`) nên không cần script riêng (không thiếu — không đề xuất thêm).

| Thời điểm       | Bắt buộc                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mỗi task        | `npm run lint` · `npm run typecheck` · `npm run format:check` · `npx vitest run <phạm vi task>`                                                            |
| Trước đóng M8.3 | thêm `npm test` đầy đủ + `npm run build` + Grep Gates                                                                                                      |
| Đóng M8         | 4 lệnh tĩnh + `npm run build` + `npm run test:coverage` + **CI xanh** (gồm E2E; sandbox không chạy được E2E) trên evidence commit + kiểm thủ công Mục 27.7 |

**Grep Gates (M8):**

| Gate | Nội dung                                                                                                                                        | Kỳ vọng                       |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| G-1  | `model/selection.ts` không import React/DOM/API                                                                                                 | 0                             |
| G-2  | `ui/**` không `Math.cos/sin/atan2`                                                                                                              | 0                             |
| G-3  | không `zustand`, `createContext`, `localStorage`, `sessionStorage` trong file M8                                                                | 0                             |
| G-4  | không `useState` giữ selection/hover/focus trong `PlanetLayer`, `AspectLayer`, `PlanetTable`, `AspectTable`, `SelectionDetail`                  | 0                             |
| G-5  | không `document.addEventListener`/`window.addEventListener` cho phím                                                                            | 0                             |
| G-6  | `aria-pressed` chỉ xuất hiện ở `PlanetLayer`, `PlanetTable`, `AspectTable`                                                                      | đúng                          |
| G-7  | `package.json` và lockfile không đổi                                                                                                            | đúng                          |
| G-8  | không màu hex/rgb/hsl, không `eslint-disable`, `as unknown as`, `: any`                                                                         | 0                             |
| G-9  | CSS build chứa mọi lớp M8 dùng (`opacity-40`, `opacity-25`, các lớp halo/`stroke-*`/`group-focus-visible:*`)                                    | đủ (`grep dist/assets/*.css`) |
| G-10 | `aspectGeometry.ts`, `labelLayout.ts`, `geometry.ts`, `wheelGeometry.ts`, `chartViewModel.ts` không đổi; `planetGeometry.ts` chỉ **thêm** `key` | `git diff --stat`             |
| G-11 | `backend/**`, `api/**` không đổi                                                                                                                | rỗng                          |

---

## 39. Known Gaps and Technical Debt

| ID       | Nội dung                                                                                                                | Trạng thái                       | Ghi chú                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| KG-M8-01 | Bằng chứng thủ công M5/M6 chỉ trên **Windows 11 + Chrome/Edge 155**; iOS, Android, macOS, Firefox, Safari chưa kiểm     | UNVERIFIED (nền tảng khác)       | M8 phụ thuộc cảm ứng và vòng focus SVG ⇒ kiểm ở M8.4                                 |
| KG-M8-02 | Tương phản nét Căng thẳng nền sáng 2,56:1 (KG-M6-08, đã chấp nhận)                                                      | Accepted (M6)                    | M8 không dùng màu làm tín hiệu chọn                                                  |
| KG-M8-03 | Hành tinh **trùng `key`** (`DUPLICATE_ENTITY`): cả hai mục cùng sáng khi chọn theo key                                  | Proposed accepted                | dữ liệu bất thường đã có issue; xử lý triệt để (vô hiệu hoá chọn) cần props bảng mới |
| KG-M8-04 | Đường aspect trên wheel **chỉ chọn bằng con trỏ/chạm** (không tab stop)                                                 | Proposed accepted                | tương đương bàn phím qua nút Aspect Table; không có arrow-key                        |
| KG-M8-05 | Vùng chạm nhãn hành tinh chồng nhau trong cụm dày                                                                       | Proposed accepted                | bảng/thẻ là đường chính xác; kiểm trên máy thật                                      |
| KG-M8-06 | Chọn hàng aspect khi đang lọc theo hành tinh làm bộ lọc biến mất (bảng "nhảy")                                          | Proposed accepted (D-M8-04)      | hệ quả đơn chọn + lọc suy ra                                                         |
| KG-M8-07 | Không có lọc theo loại/tính chất aspect                                                                                 | NOT APPLICABLE (chưa có yêu cầu) | không thêm ở M8                                                                      |
| KG-M8-08 | Hai cột `lg`, skip link, zoom/pan                                                                                       | DEFERRED S4.9 (KG-M4-04/05/06)   |                                                                                      |
| KG-M8-09 | Matrix M3 nhắc `OQ-M8-1/2` (`<title>` động, focus sau điều hướng — KG-M3-04); **chưa xác minh** có thuộc S4.8 hay không | UNVERIFIED                       | khả năng cao thuộc nhóm hardening S4.9; ghi để không bỏ sót                          |
| KG-M8-10 | F4 plan còn gọi container `ChartViewer` và `hoveredKey` chỉ cho hành tinh                                               | Documentation                    | sửa ở M8.0                                                                           |
| KG-M8-11 | CI cảnh báo Node 20 deprecation của `actions/checkout@v4`, `actions/setup-node@v4`                                      | Technical debt                   | không thuộc M8                                                                       |
| KG-M8-12 | Phiên audit này chưa chạy lại toàn bộ `npm test`/`build` trên `b0f002f` (dựa trên CI #276 và kết quả M6)                | UNVERIFIED trong phiên này       | M8.4 chạy đầy đủ                                                                     |

### 39.1 Decision Review

Quy ước phê duyệt: `approved` · `inherited` · `proposed` · `unresolved`. **Chưa quyết định `proposed` nào được coi là đã duyệt.** In đậm = cần owner xác nhận **trước khi viết mã** (5 mục chặn).

| ID          | Quyết định đề xuất                                                                                                                                                                                                                                                                                                              | Bằng chứng                                                                                                    | Phương án khác                                     | Đánh đổi                                                                          | Trạng thái                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------- |
| D-M8-01     | Kiểu selection `none` / `planet(key)` / `aspect(key)` (union phân biệt); identity = `PlanetVM.key`/`AspectVM.key`; thêm `PlanetRenderItem.key` (cộng thêm)                                                                                                                                                                      | F4 §26; `chartViewModel.ts:25-26`; `buildAspects`; DTO aspect không có `id`                                   | `null` thay `{kind:"none"}` (ví dụ prompt); ID SVG | `{kind}` khớp văn bản đã duyệt; thêm 1 trường cho model M5                        | **inherited** (kiểu) + proposed (`key`)             |
| D-M8-02     | Hành tinh trùng `key`: không xử lý riêng, ghi KG-M8-03                                                                                                                                                                                                                                                                          | `DUPLICATE_ENTITY` ở VM; M5 `id key#n`                                                                        | vô hiệu hoá chọn (như M6 `ENDPOINT_AMBIGUOUS`)     | đơn giản vs triệt để                                                              | proposed                                            |
| **D-M8-03** | `hover`/`focus` tách khỏi selection; **preview = `focused ?? hovered`** (focus ưu tiên); hover mở rộng cho **cả aspect**; hover không thay highlight chọn; mờ phần còn lại nhưng không làm mờ selection; `focused` chỉ phản chiếu DOM focus                                                                                     | F4 §16 dòng 315; §26; `Confirmation_1`                                                                        | `hovered ?? focused` (đề xuất ban đầu — bị sửa)    | trải nghiệm bàn phím dự đoán được vs preview không theo con trỏ khi đang dùng Tab | **approved with modification** (owner)              |
| **D-M8-04** | Lọc Aspect Table theo hành tinh là **suy ra** từ selection; chip ✕ = `clear`; chọn aspect khi đang lọc thay selection (bộ lọc biến mất); một transition; focus giữ hợp lý; bảng rỗng có empty state                                                                                                                             | F4 §26 dòng 396, 378 ("chip ✕" bỏ chọn), 571, 612; M7 D-M7-7, KG-M7-02 — **điều kiện đã xác minh** (Mục 39.2) | state lọc riêng; giữ bộ lọc khi chọn aspect        | không trùng state vs bảng "nhảy" (giảm bằng `key` ổn định + quản lý focus)        | **approved with clarification** (owner)             |
| D-M8-05     | Công tắc M6 là tuỳ chọn **vẽ**, không phải lọc dữ liệu: tắt công tắc **không** bỏ selection; chọn aspect từ bảng **không** tự bật công tắc                                                                                                                                                                                      | M6 D-M6-09/14                                                                                                 | tự bật công tắc; bỏ selection khi tắt              | giữ ý định người dùng vs wheel không có đường khi mặc định mobile tắt             | proposed                                            |
| D-M8-06     | Chọn aspect ⇒ hai hành tinh đầu mút "liên quan" (halo nhẹ, `aria-pressed=false`)                                                                                                                                                                                                                                                | F4 §26                                                                                                        | chỉ nổi đường                                      | rõ ràng vs thêm một lớp trạng thái                                                | **inherited**                                       |
| D-M8-07     | `Esc` chỉ xoá selection; handler cấp Shell; no-op khi `none`; không listener toàn cục                                                                                                                                                                                                                                           | F4 §26; prompt §17                                                                                            | clear cả hover/focus/công tắc; listener `document` | dễ dự đoán                                                                        | inherited (hành vi) + proposed (phạm vi handler)    |
| **D-M8-08** | Hành tinh wheel `role="button"` + `tabIndex=0` + `aria-pressed` (chỉ theo `selected`), tên "Chọn …", Enter/Space, focus ring; **đường aspect pointer-only** trong nhóm riêng không focusable, kèm điều kiện 1–6 (Mục 23); chip **không** `aria-pressed` (hành động dismiss); dự phòng nút HTML phủ nếu SVG button không ổn định | F4 dòng 425; M7; probe lint (Mục 23); `Confirmation_1`                                                        | tab stop cho từng đường (~40); `role="img"` giữ    | số tab stop hợp lý vs aspect chỉ-con-trỏ trên wheel (tương đương qua bảng)        | **approved with modification** (owner)              |
| **D-M8-09** | Một `role="status"` sr-only ở Shell; chỉ báo chọn hành tinh/aspect/bỏ chọn; mẫu theo loại phần tử (ví dụ, không cố định; bỏ "nhà" khi không có dữ liệu; aspect dùng tên thật); không báo hover/focus; không live riêng ở detail; bỏ `aria-live` ở wrapper chip **sau khi xác minh nguồn**                                       | F4 §26; `AspectTable.tsx:70`; M7 AC-CHIP; `Confirmation_1`                                                    | giữ live của chip (đọc đôi); `assertive`           | không ồn vs sửa một component S4.3/S4.7                                           | **approved with clarification** (owner)             |
| D-M8-10     | Chạm chọn; chạm lại bỏ; nút "Bỏ chọn" trong `SelectionDetail`; không bỏ chọn bằng chạm nền; hover chỉ `pointerType=mouse`                                                                                                                                                                                                       | F4 dòng 730; §26                                                                                              | chạm nền bỏ chọn; panel nổi                        | không xung đột cuộn                                                               | **inherited** (nền) + proposed (chi tiết)           |
| D-M8-11     | Mỗi hành tinh một tab stop; **không** roving, **không** mũi tên                                                                                                                                                                                                                                                                 | F4 dòng 425; số phần tử ≤ 14                                                                                  | roving + mũi tên                                   | đơn giản/kiểm thử vs ít tab stop hơn                                              | inherited                                           |
| D-M8-12     | Axe dùng `vitest-axe` đã có; không thêm công cụ/script                                                                                                                                                                                                                                                                          | `setup.ts`; nhiều test đã dùng                                                                                | thêm `@axe-core/playwright` (S4.10)                | không phụ thuộc mới                                                               | inherited (tooling)                                 |
| D-M8-13     | Không dependency mới                                                                                                                                                                                                                                                                                                            | `package.json`; user-event có sẵn                                                                             | —                                                  | —                                                                                 | inherited                                           |
| **D-M8-14** | `SelectionDetail` là khối inline dưới wheel trong Card; không tooltip/popover/modal; không `aria-live` riêng; không tự cuộn/chuyển focus; suy ra từ selection; gợi ý khi rỗng                                                                                                                                                   | F4 dòng 231, 379; `Confirmation_1`                                                                            | popover nổi; cột phải ở `lg`                       | không cần quản lý focus overlay vs vị trí chưa tối ưu ở desktop (S4.9)            | **approved** (owner)                                |
| D-M8-15     | Hover chỉ từ chuột (`pointerType==="mouse"`)                                                                                                                                                                                                                                                                                    | hover dính trên cảm ứng                                                                                       | `onMouse*`                                         | đúng thiết bị                                                                     | proposed                                            |
| D-M8-16     | Bỏ `aria-live` ở wrapper chip của `AspectTable` — **nguồn đã kiểm**: chỉ bao chip, đọc nhãn chip (Mục 24)                                                                                                                                                                                                                       | `AspectTable.tsx:70`; M7 AC-CHIP; không test phụ thuộc `polite`                                               | giữ + dedupe                                       | tránh đọc đôi                                                                     | **approved** (thuộc D-M8-09, owner)                 |
| D-M8-17     | `PlanetTable.relatedKeys?` + `onPreview?` (additive)                                                                                                                                                                                                                                                                            | M7 D-M7-3                                                                                                     | CSS-only hover                                     | cần để tô hàng liên quan                                                          | proposed                                            |
| D-M8-18     | Vùng chạm hành tinh ≥ 36 đơn vị (≈ 24 px ở 400px); vùng chạm đường ≈ 14 đơn vị                                                                                                                                                                                                                                                  | WCAG 2.5.8; wheel `min-w-[400px]`                                                                             | 44px (chồng nhiều)                                 | trade-off chồng vùng chạm                                                         | proposed                                            |
| D-M8-19     | Quản lý focus khi phần tử focus bị gỡ: `key` hàng aspect ổn định; chip ✕ → tiêu đề "Góc chiếu"; "Bỏ chọn" → tiêu đề detail; mọi thao tác khác không đổi focus                                                                                                                                                                   | `AspectTable.tsx:121,188` (key theo `index`); yêu cầu owner ở D-M8-04                                         | để focus rơi về `body`                             | nhỏ, kiểm thử được                                                                | proposed (mặc định, owner xác nhận khi review M8.2) |

**5 quyết định chặn — đã được owner duyệt** (D-M8-03 và D-M8-08 có sửa đổi; D-M8-04 và D-M8-09 có làm rõ; D-M8-14 nguyên văn). Chi tiết ở Mục 39.2.

### 39.2 Owner Confirmation (`Confirmation_1.md`) — ghi nhận và hệ quả cho plan

| Quyết định | Phán quyết                     | Thay đổi trong plan                                                                                                                                                                |
| ---------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-M8-03    | **Approve with modification**  | `preview = focused ?? hovered` (đảo so với đề xuất); 7 quy tắc hiển thị; `focused` chỉ phản chiếu DOM focus (Mục 19)                                                               |
| D-M8-04    | **Approve with clarification** | điều kiện đã xác minh (bên dưới); một transition; focus giữ hợp lý; bảng rỗng; **phát hiện `key` theo `index` làm mất focus** (Mục 20)                                             |
| D-M8-08    | **Approve with modification**  | accessible name "Chọn …", `aria-pressed` chỉ theo `selected`; điều kiện cho đường aspect; `aria-hidden` không chứa control cần dùng; dự phòng nút HTML; chip theo hành vi (Mục 23) |
| D-M8-09    | **Approve with clarification** | mẫu theo loại phần tử; đã kiểm nguồn `aria-live` trước khi xoá (Mục 24)                                                                                                            |
| D-M8-14    | **Approve**                    | 6 điều kiện ghi vào hợp đồng `SelectionDetail` (Mục 26)                                                                                                                            |

**Điều kiện của D-M8-04 — kết quả xác minh:** "filter theo hành tinh là hệ quả của selection trong M7/F4" **đúng**. Bằng chứng: F4 plan §26 dòng 396 ("chọn hành tinh ⇒ … Aspect Table lọc theo hành tinh"); dòng 378 liệt kê "chip ✕" là một cách **Bỏ chọn**; dòng 571 ("chip lọc (kết nối ở S4.8)") và 612 (S4.8: "truyền controlled props; chip lọc"); M7 D-M7-7 ("Chip lọc = `AspectFilterChip`; không có chip khác") và KG-M7-02 (chip chưa hiện vì chưa có selection). Không có bộ lọc độc lập nào với mục đích khác trong M7/F4 ⇒ suy ra từ selection không loại bỏ chức năng nào.

**Về `aria-pressed` của chip:** owner nêu nguyên tắc "semantics theo hành vi, không theo tên gọi". Chip hiện là nút **xoá lọc** (dismiss), không phải toggle ⇒ giữ **không** `aria-pressed` (Mục 20). Nếu owner muốn chip là toggle thực sự, cần đổi hành vi, không chỉ thêm thuộc tính.

**Mặc định đề xuất thêm — không thuộc phán quyết, cần xác nhận khi review M8.2 (không chặn bắt đầu):** (a) D-M8-19: đích focus khi chip ✕/"Bỏ chọn"; (b) thông báo hành tinh bỏ độ và nghịch hành, thêm "Không có góc chiếu liên quan." khi không có aspect; (c) câu gợi ý công tắc nhắc chọn góc chiếu bằng bảng; (d) tên truy cập hành tinh dạng "Chọn {tên, cung, độ, nhà}".

## 40. Risks and Mitigations

| ID  | Rủi ro                                                                  | Khả năng/Tác động       | Giảm thiểu                                                                | Kiểm chứng                                               |
| --- | ----------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| R1  | Hai nguồn selection lọt vào (ví dụ state cục bộ trong bảng)             | Trung bình / Cao        | Gate G-4; props controlled; reducer duy nhất                              | G-4, review                                              |
| R2  | Đọc đôi (live trung tâm + `aria-live` của chip)                         | Cao / Trung bình        | D-M8-09/16                                                                | thủ công NVDA/VO; test không có `aria-live` thứ hai      |
| R3  | Vòng focus SVG không hiện ở một trình duyệt                             | Trung bình / Cao        | ring tường minh + `group-focus-visible`; kiểm Chrome/Firefox/Safari       | thủ công; jsdom chỉ kiểm lớp                             |
| R4  | Vùng chạm chồng nhau trong cụm dày                                      | Cao / Trung bình        | bảng là đường chính; thứ tự DOM xác định                                  | thủ công cảm ứng                                         |
| R5  | Hover "dính" trên cảm ứng                                               | Trung bình / Thấp       | `pointerType==="mouse"`                                                   | test `fireEvent.pointerEnter` với `pointerType: "touch"` |
| R6  | Lớp CSS thiếu ⇒ halo/mờ vô hình (bài học M4/M6)                         | Trung bình / Cao        | Gate G-9 sau `build`                                                      | grep `dist/assets/*.css`                                 |
| R7  | Đổi `role` hành tinh vỡ test M5                                         | Chắc chắn / Thấp        | giữ chế độ tĩnh khi không có `interaction`; thêm ca tương tác             | PL7/PL9                                                  |
| R8  | Truy vấn test trùng (nút mới/`aria-label` trùng tên hành tinh)          | Cao / Thấp              | rà soát và dùng `within`, không làm yếu                                   | `npm test` đầy đủ                                        |
| R9  | Không có thiết bị iOS/Android/Safari/Firefox                            | Trung bình / Trung bình | ghi `ACCEPTED GAP`, không điền khống                                      | Matrix M8 §4                                             |
| R10 | Lấn sang S4.9 (hai cột, zoom/pan) hoặc thêm bộ lọc loại                 | Trung bình / Trung bình | Mục 4; review phạm vi                                                     | review                                                   |
| R11 | `useReducer` + 2 tầng props gây re-render thừa                          | Thấp / Thấp             | `useMemo` các đại lượng suy ra; không `React.memo` trước khi đo           | quan sát khi có vấn đề                                   |
| R12 | Đổi `aria-live` của `AspectTable` làm lệch hành vi S4.3/S4.7            | Thấp / Thấp             | giữ `min-h`; chạy lại axe/test bảng                                       | `AspectTable.test.tsx`                                   |
| R13 | Selection cũ giữ lại sau đổi dữ liệu                                    | Thấp / Trung bình       | `resolveSelection` mỗi render + `key={chartId}`                           | U21, test trang                                          |
| R14 | Quyết định `proposed` bị coi là đã duyệt                                | Trung bình / Cao        | M8.0 là cổng; ghi rõ trạng thái                                           | Matrix M8                                                |
| R15 | `focused` cũ khi phần tử focus bị gỡ khỏi DOM (không có `blur`)         | Trung bình / Thấp       | `key` ổn định; `resolvePreview`; chip/"Bỏ chọn" chuyển focus có kiểm soát | `U-focus-stale`, K9–K11                                  |
| R16 | Lint **không** kiểm a11y SVG (đã probe) ⇒ thiếu `tabIndex`/phím lọt qua | Cao / Cao               | test K1, K2, K6, PL-I, AX-W1 bắt buộc; review thủ công                    | test + thủ công                                          |
| R17 | SVG `role="button"` không ổn định trên một tổ hợp AT/trình duyệt        | Thấp–Trung bình / Cao   | cổng M8.4; dự phòng nút HTML phủ                                          | thủ công NVDA/VoiceOver                                  |

## 41. Definition of Done

M8 chỉ đóng khi **tất cả** đúng:

1. AC-S1…S17 (Mục 36) có bằng chứng `VERIFIED`, hoặc là `ACCEPTED GAP` có chữ ký owner.
2. Unit reducer (`U1–U24`) + hàm suy ra; component wheel/bảng/detail; keyboard; touch; filter; axe đều đạt; coverage `selection.ts` ≥ 95% câu lệnh/nhánh.
3. `npm run lint`, `typecheck`, `format:check`, `build`, `test:coverage` đạt; **CI xanh** trên evidence commit.
4. Grep Gates G-1…G-11 sạch; `package.json`/lockfile/`backend/**` không đổi.
5. Chế độ tĩnh của layer và toàn bộ test M4–M7 xanh (chỉ đổi test có chủ đích, có lý do trong matrix).
6. Kiểm thủ công Mục 27.7 có bản ghi đủ trường (người kiểm, thiết bị, OS + phiên bản, trình duyệt/AT + phiên bản, commit/URL, lá số, ảnh/bản ghi, ngày); phần chưa kiểm ghi đúng `UNVERIFIED`/`ACCEPTED GAP`.
7. Evidence Matrix M8 lưu ở `archive/sprint-f4/`; blueprint M8 (và M6) đã xoá.
8. Known Gaps (Mục 39) được cập nhật; bàn giao S4.9 ghi rõ (hai cột `lg`, zoom/pan, `<title>` động/focus sau điều hướng nếu liên quan).

## 42. Final Architect Review

| Hạng mục                                           | Kết quả (mức plan)                                         | Bằng chứng             |
| -------------------------------------------------- | ---------------------------------------------------------- | ---------------------- |
| **Roadmap** — F4 v1.1 phương án B giữ nguyên       | Đạt                                                        | F4 dòng 17, 522; Mục 5 |
| M11 trước S4.7; M8 ở vị trí S4.8                   | Đạt                                                        | dòng 522; Mục 5        |
| Tiền đề S4.5–S4.7 xác minh                         | Đạt (không blocker; nối props có chủ đích chờ M8)          | Mục 8; matrix M5/M6/M7 |
| **State** — một selection canonical                | Đạt (thiết kế): `useReducer` ở Shell                       | Mục 15–16, 31          |
| Chi tiết suy ra, không lưu trùng                   | Đạt                                                        | Mục 15, 26, 31         |
| Hover/focus/selection không bị gộp                 | Đạt                                                        | Mục 19                 |
| Không Zustand/Context                              | Đạt                                                        | Mục 16; D-M8-13        |
| **Interaction** — wheel↔bảng hai chiều             | Đạt (thiết kế): bảng Mục 18, 33                            |                        |
| Detail phản ánh selection; lọc không để state cũ   | Đạt: lọc suy ra; `resolveSelection`                        | Mục 20, 35             |
| Escape/bàn phím/cảm ứng có hợp đồng                | Đạt                                                        | Mục 21, 22, 25, 34     |
| **A11y** — ngữ nghĩa đúng; `aria-pressed` đúng chỗ | Đạt (thiết kế); cần kiểm thủ công                          | Mục 23                 |
| Live region hữu ích, kiểm soát                     | Đạt; nguồn `aria-live` của `AspectTable` đã kiểm (D-M8-16) | Mục 24                 |
| Người dùng bàn phím làm được tác vụ cốt lõi        | Đạt (qua hành tinh + bảng)                                 | Mục 21                 |
| Bảng thay thế còn nguyên                           | Đạt                                                        | IR-10; AC-S14          |
| **Tương thích** — hành vi M6 giữ nguyên            | Đạt: công tắc ngoài reducer; chọn không đổi công tắc       | Mục 7, 20              |
| Không tính chiêm tinh ở frontend                   | Đạt: `computeEmphasis` chỉ lọc theo khoá                   | Mục 15                 |
| Backend/API không đổi                              | Đạt                                                        | Gate G-11              |
| Hành vi F4/FE trước được bảo vệ                    | Đạt (thiết kế)                                             | Mục 37                 |
| **Phạm vi** — URL state, zoom/pan ngoài phạm vi    | Đạt                                                        | Mục 4                  |
| Dependency được biện minh (không có)               | Đạt                                                        | D-M8-13                |
| Rủi ro/quyết định mở rõ ràng                       | Đạt                                                        | Mục 39–40              |
| AC kiểm thử được                                   | Đạt                                                        | Mục 36                 |

**Giới hạn của review:** đây là review **thiết kế** từ mã/tài liệu hiện có; các hành vi sau **chưa thể** xác minh bằng jsdom và đã được đưa vào kiểm thủ công: vòng focus SVG, vùng chạm cảm ứng, tương phản trạng thái chọn, đọc của trình đọc màn hình. Phiên này chưa chạy lại toàn bộ test trên `b0f002f`.

## 43. Final Recommendation

`READY FOR IMPLEMENTATION`

**Cơ sở:** 5 quyết định chặn đã được owner duyệt (Mục 39.2); điều kiện của D-M8-04 đã xác minh trong repo; không có blocker kỹ thuật; ma trận/AC/rủi ro đã cập nhật theo các sửa đổi.

**Thứ tự bắt đầu:** M8.0 (docs-only: xoá blueprint M6, đồng bộ F4 plan) → M8.1 → M8.2 → M8.3 → M8.4.

**Không chặn nhưng cần theo dõi:** (1) KG-M8-01 — bằng chứng thiết bị chỉ Windows, iOS/Android/Safari/Firefox ghi `UNVERIFIED`/`ACCEPTED GAP` nếu chưa có thiết bị; (2) các mặc định đề xuất (a)–(d) ở Mục 39.2 xác nhận khi review M8.2; (3) cổng dự phòng nút HTML phủ (R17) quyết ở M8.4; (4) lint không kiểm a11y SVG (R16) nên test là hàng rào duy nhất.
