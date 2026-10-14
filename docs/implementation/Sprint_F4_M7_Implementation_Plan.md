# AstroViet — Sprint F4 M7 Implementation Plan
## Planet / House / Aspect Tables

**Vị trí đề xuất:** `docs/implementation/Sprint_F4_M7_Implementation_Plan.md` (blueprint tạm thời; xoá khi M7 đóng, lưu Evidence Matrix vào `docs/implementation/archive/sprint-f4/`).
**Phiên bản:** 1.1 — **`READY FOR IMPLEMENTATION`** (Mục 34, 37).
**Căn cứ:** audit repo `dev` tại `e5ac774` (2026-10-13), Frontend CI #250 Success; `Sprint_F4_Implementation_Plan.md` v1.1; `docs/frontend/Frontend_UI_Specification.md`; mã `features/chart/**`, `shared/**`.
**Quy ước nguồn:** `[repo]` đọc mã/tài liệu · `[C-run]` Claude chạy lệnh trong sandbox (`npm ci` theo lockfile, Node v22.22.2) · `[CI]` trang GitHub Actions công khai · `[owner]` owner cung cấp.
**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `BLOCKED` · `NOT APPLICABLE` · `DEFERRED`.
**Giới hạn audit:** không chạy Backend và E2E; chưa chạy test M7 (chưa tồn tại). Ở lượt này `typecheck`, `lint`, `format:check` exit 0 [C-run]; lần chạy toàn bộ vitest **quá thời gian giới hạn của sandbox** nên baseline test lấy từ lần chạy trước (`27941bf`: 102 file / 668 test passed [C-run]) và CI #250 Success [CI] cho `e5ac774`.

---

## 1. Executive Summary

M7 (= FE-S4.7, đứng sau FE-S4.11 theo plan v1.1/O-F4-2 B) dựng **ba bảng ngữ nghĩa — Planet, House (kèm các góc), Aspect —, thẻ mobile, bốn badge miền chiêm tinh, chip lọc dạng trình bày và khối giải thích thiếu dữ liệu nhà**, rồi ghép vào `ChartViewerShell`. Chúng là phương án thay thế **bắt buộc** cho wheel và dùng được ngay. M7 **không** có wheel, ma trận aspect, đồng bộ chọn, store mới hay đổi Backend.

**Tiền đề:** FE-S4.2 (`toChartViewModel`, nhãn/glyph), FE-S4.3 (`ChartViewerShell`), FE-S4.11 và các sửa đi kèm đã xong và có test + CI. **Một tiền đề thật sự còn thiếu: `useMediaQuery` chưa tồn tại** (không có trong `shared/hooks`, không nơi nào gọi) ⇒ M7.1 là task tiền đề có phạm vi hẹp.

**Phát hiện quan trọng (đều có bằng chứng) — plan khác kỳ vọng của prompt ở các điểm sau:**

| # | Phát hiện | Hệ quả cho plan |
|---|---|---|
| 1 | **"UI Spec §49 — AC Tables" không tồn tại.** UI Specification chỉ có §1–§25. "§49" là **Mục 49 "Definition of Done" của F4 plan** và "AC Tables" chỉ là **một dòng**: "Bảng: Planet/House (khi có dữ liệu)/Aspect Table ngữ nghĩa, hoạt động" (cộng các dòng liên quan *Thiếu giờ sinh*, *A11y*, *Responsive*, *Chất lượng*). | Mục 30 ánh xạ đúng các dòng đó + yêu cầu chi tiết của UI Spec §12.x + tiêu chí tạm thời của prompt (ghi rõ nguồn). Không bịa nội dung §49. |
| 2 | **"Filter chips" không nằm trong UI Spec §12.8–12.11** (đó là Planet/Sign/House/Aspect Badge). UI chip duy nhất được spec: ở §12.4, khi `filterByPlanet` active hiện `Badge` **"Đang lọc: Sao Kim ✕"** phía trên Aspect Table để xoá bộ lọc. F4 plan (mặc định) cũng chốt "lọc Aspect Table khi chọn hành tinh". | M7 làm chip **trình bày + điều khiển được** (`AspectFilterChip`), bộ lọc là prop do parent cấp; không có đường người dùng bật lọc trước S4.8. |
| 3 | **Không có component `ChartViewer`.** Điểm ghép thực tế là `ChartViewerShell` (M3), nhận `vm: ChartViewModel` từ `ChartDetailPage`. F4 plan §15 giao "sở hữu selection/hover/zoom" cho `ChartViewer` (S4.4+/S4.8). | Tích hợp vào `ChartViewerShell`; selection **không** có chủ sở hữu ở M7 ⇒ nút chọn chỉ render khi parent truyền `onSelect` (D-M7-3). |
| 4 | **`preferenceStore` có `densityMode` (`comfortable`\|`compact`) nhưng không có consumer nào** (grep: chỉ store + test). UI Spec §6.2: `comfortable` = padding ô `space-3`, `compact` = `space-2`. Chưa có UI đổi density (trang Cài đặt chưa có). Không có preference nào cho `numeralStyle` hay `showOptionalBodies`. | Shell đọc `densityMode` bằng selector và truyền xuống bảng (`density` prop). `numeralStyle` mặc định `arabic`; `showOptionalBodies` **NOT APPLICABLE** (D-M7-6). |
| 5 | **`HouseDataNotice` (M3) đã tồn tại và đang render ở đầu Shell.** Prompt yêu cầu "khối giải thích" nằm trong UX bảng nhà mà không tạo nguồn sự thật thứ hai. | Chuyển vị trí: bảng nhà nhận `unavailableContent` (slot) và Shell truyền `HouseDataNotice` vào đó; Shell **không** render lại ở đầu (một instance, một nguồn: `vm.flags.houseDataAvailable`) — D-M7-4. |
| 6 | **VM không có "orb tối đa cho phép"** (UI Spec §12.4 muốn hiện orb thực tế so với orb tối đa). `AspectVM` chỉ có `orb`/`orbLabel`. Backend cũng không trả. | **Contract gap**: chỉ hiện orb thực tế; không suy ra orb tối đa (Mục 34). |
| 7 | **Empty state Aspect Table của spec có "gợi ý mở Cài đặt nới orb"**, nhưng trang Cài đặt và cấu hình orb không tồn tại (mục nav "Cài đặt" là `<a href="/">`). | Dùng câu chính của spec, **bỏ gợi ý Cài đặt** (ghi lệch spec). |
| 8 | **Định dạng độ:** UI Spec §12.2 ghi `15°23'47"`, M2 đã chốt `D°MM′` (không giây, D-M2-1). | Bảng chỉ hiển thị `degreeLabel`/`orbLabel` của VM, không format lại. |
| 9 | **Test mặc định:** `src/test/setup.ts` mock `matchMedia` tĩnh (`matches:false`, listener là `vi.fn()` không phát sự kiện); vitest không bật `restoreMocks/mockReset`. | `(min-width:640px)` = false ⇒ test hiện có của Shell/page sẽ thấy **thẻ** sau M7; cần helper `matchMedia` điều khiển được (task M7.1) mà **không** đổi setup toàn cục. |
| 10 | `vitest-axe` đã cài và được dùng (`shared/ui/*.test.tsx`, `ChartViewerShell.test.tsx` có ca axe). Playwright không chạy axe. | Dùng tooling sẵn có; không thêm dependency. |
| 11 | `shared/ui` không có `Table`/`Tabs`/`Tooltip`/chip; `Badge` **không tương tác** (loại `onClick`/`tabIndex`). | Dùng thẻ `<table>` thuần trong feature; chip là `<button>` riêng (không dùng `Badge`). |
| 12 | `AspectTable` theo spec còn có `layout="grid"` (ma trận) và toggle "Xem dạng danh sách". | **Ngoài phạm vi** (ma trận aspect bị loại): M7 chỉ có dạng danh sách. |

## 2. Sprint and Milestone Context

```text
FE-S4.1 Chart API/DTO ─► FE-S4.2 ViewModel ─► FE-S4.3 Calculate flow + Viewer Shell
                                                   │
                                                   ▼
                                      FE-S4.11 Saved Charts List (M11)
                                                   │
                                                   ▼
                              ► FE-S4.7 Planet / House / Aspect Tables (M7) ◄── mục tiêu của plan này
                                                   │
                                                   ▼
                     FE-S4.4 → S4.5 → S4.6 (Wheel) → S4.8 (đồng bộ chọn) → S4.9 → S4.10 (E2E)
```

Tên "M7"/"M11" trong hội thoại ứng với `FE-S4.7`/`FE-S4.11` trong F4 plan. M7 là milestone kế tiếp sau M11, đúng thứ tự thực thi khuyến nghị ở F4 plan dòng 521.

## 3. Roadmap v1.1 / O-F4-2 Option B Verification

| Hạng mục | Bằng chứng | Trạng thái |
|---|---|---|
| Plan v1.1 | `docs/implementation/Sprint_F4_Implementation_Plan.md` dòng 6: "1.1 — `READY FOR IMPLEMENTATION`" | VERIFIED [repo] |
| O-F4-2 chọn phương án B | dòng 17: "Phương án B: thêm danh sách chart tối thiểu (`GET /charts`)" — "Đã xác minh (Mục 7.1)" | VERIFIED [repo] |
| M11 đứng trước M7 | dòng 521: "S4.1 → S4.2 → S4.3 → **S4.11** → S4.7 → S4.4 …" | VERIFIED |
| M11 hoàn tất | `archive/sprint-f4/Sprint_F4_M11_Exit_Criteria_Evidence_Matrix.md`; Frontend CI **#250 Success** trên `e5ac774` (gồm E2E `chart-list.spec.ts`) | VERIFIED [CI] |
| S4.2 hoàn tất | `features/chart/model/{labels,format,chartViewModel}.ts`, 100% coverage; matrix M2 | VERIFIED |
| S4.3 hoàn tất | `ChartViewerShell`, `CalculateChartDialog`, `ChartDetailPage`; matrix M3 | VERIFIED |
| `useMediaQuery` | chỉ được nhắc ở F4 plan (dòng 219, 420, 680) — **chưa tồn tại** | **VERIFIED vắng mặt** (blocker nhỏ, có task M7.1) |
| Không đổi roadmap | plan này không đổi thứ tự/ID | VERIFIED |

Phân biệt: **đã xác minh** (S4.2, S4.3, M11, đường dữ liệu) · **đã duyệt trước** (O-F4-2 B; bảng không có state; render *một trong hai* bảng/thẻ; `useMediaQuery('(min-width: 640px)')`; mặc định "lọc Aspect Table khi chọn hành tinh") · **còn lại** (hook, badge, ba bảng, chip, ghép Shell) · **giả định cần xác nhận** (D-M7-1…D-M7-8) · **blocker** (không có).

## 4. Current Repository State

| Hạng mục | Thực tế | Trạng thái |
|---|---|---|
| HEAD | `e5ac774`; Frontend CI #250 Success (job `build` gồm format, lint, typecheck, `test:coverage`, build, E2E) | VERIFIED [CI] |
| Scripts | `typecheck` = `tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit`; `lint`; `format:check`; `test` (`vitest run --passWithNoTests`); `test:coverage`; `build`; `test:e2e` | VERIFIED `package.json` |
| Cổng chất lượng local | `typecheck`, `lint`, `format:check` exit 0 | VERIFIED [C-run] |
| Test baseline | 102 file / 668 test (`27941bf`) [C-run]; CI #250 xanh (thêm các test router/B18 của lượt sửa M11) | PARTIALLY VERIFIED (không chạy lại toàn bộ ở HEAD) |
| `features/chart/ui/` | `CalculateChartDialog`, `ChartList`, `ChartViewerShell`, `ChartViewerSkeleton`; **chưa có** `PlanetTable`, `HouseTable`, `AspectTable`, `ChartBadges` | VERIFIED |
| Tailwind screens | `xs 0, sm 640, md 768, lg 1024, xl 1280, 2xl 1536` | VERIFIED |
| Token màu | CSS: `--color-brass-*`, `--color-indigo-*`, `--color-slate-*`; semantic `--color-accent-primary` (brass-500), `--color-accent-secondary` (indigo-600), `--color-text-secondary` (slate-600), `--color-border-subtle` | VERIFIED |
| Phông | `--font-data: "IBM Plex Mono"…` (số liệu đơn cách) | VERIFIED |
| `preferenceStore` | `preference` (theme), `resolvedTheme`, `locale` (`vi\|en`), `densityMode`; persist; **không consumer của `densityMode`** | VERIFIED |
| Glyph | font Display không có font ký hiệu chuyên dụng; render đa nền tảng chưa kiểm (KG-M2-04) | UNVERIFIED |

## 5. Preconditions and Dependency Status

| Tiền đề | Trạng thái | Bằng chứng / hệ quả |
|---|---|---|
| S4.2 ViewModel | VERIFIED | `ChartViewModel`: `planets: PlanetVM[]`, `houses: HouseVM[]`, `angles: AngleVM[]`, `aspects: AspectVM[]`, `flags{houseDataAvailable, hasAngles, partialData, ascendantLongitude}`, `warnings`, `meta`. Thứ tự chính tắc **đã tất định** ở VM (hành tinh theo `KNOWN_PLANET_NAMES`, nhà 1→12, góc ASC→IC, aspect theo `orb` tăng dần + tie-break). |
| S4.3 Viewer Shell | VERIFIED | `ChartViewerShell({vm, className})` có khe tích hợp (sau `Alert partialData`, trước/sau placeholder). `data-testid="chart-visualization-placeholder"` được test dùng (test kiểm testid, không kiểm chữ). |
| M11 | VERIFIED | không có phụ thuộc kỹ thuật của M7; M7 phải giữ nguyên điều hướng danh sách → chi tiết. |
| `useMediaQuery` | **BLOCKED (nhỏ)** | chưa có ⇒ **F4-M7.1** (một hook + một helper test); không tạo hook media-query thứ hai. |
| `preferenceStore` | VERIFIED | dùng `usePreferenceStore(s => s.densityMode)`. |
| `vitest-axe` | VERIFIED | đã cài, matcher đăng ký trong `src/test/setup.ts`. |
| Fixtures | VERIFIED | `chartFull`, `chartNoHouses` (CAPTURED) + `toChartViewModel` cho test M7. |
| Backend | không đổi | VM đủ dữ liệu cho cả 3 bảng (trừ "orb tối đa", Mục 34). |

**Kết luận:** không có blocker chặn *bắt đầu*; M7.1 xử lý tiền đề duy nhất còn thiếu.

## 6. UI Spec Audit

| Mục spec | Yêu cầu | M7 xử lý |
|---|---|---|
| §12.2 Planet Table | cột `PlanetBadge` \| Cung (`SignBadge`) \| Độ (mono, tabular) \| Nhà (`HouseBadge`) \| Retrograde (℞); `<table>` thật, `<caption>` ("Vị trí hành tinh — Natal Chart"), `scope="col"`; card-per-row dưới `sm`; props `densityMode`, `showOptionalBodies`, `onRowClick`; error một phần = `Alert warning` + vẫn hiện hàng hợp lệ | Làm đủ trừ: `showOptionalBodies` (NOT APPLICABLE), `onRowClick` → `onSelect` (S4.8 nối); Alert một phần đã có ở Shell (`partialData`) |
| §12.3 House Table | 12 nhà theo hệ nhà đã chọn (Cung tại cusp + Độ); `houseSystem` dạng `Badge` ở tiêu đề; `angles` ASC/MC/DSC/IC highlight riêng; bảng ngữ nghĩa + card dưới `sm` | Làm đủ; góc là bảng phụ trong cùng section (D-M7-5) |
| §12.4 Aspect Table | cột A \| `AspectBadge` \| B \| Orb (mono, `2°14'`, sắp theo orb tăng dần); state `filtered` + `Badge` "Đang lọc: Sao Kim ✕"; `layout=grid` + toggle; Empty = `EmptyState` "Không tìm thấy góc chiếu nào trong phạm vi orb hiện tại" + gợi ý Cài đặt; **không** dùng màu làm kênh duy nhất | Làm dạng danh sách + chip lọc + empty (bỏ gợi ý Cài đặt); **bỏ** `grid` (ma trận ngoài phạm vi); "orb tối đa" = contract gap |
| §12.8 Planet Badge | glyph + tên; `showLabel`, `retrograde`, `size`; `aria-label` "Sao Diêm Vương, nghịch hành" kể cả khi `showLabel=false`; trạng thái `selected`/`dimmed` (đồng bộ wheel) | `PlanetGlyph`: giữ `showLabel`/`retrograde`/`size`; `selected`/`dimmed` **không** có ở M7 (thuộc S4.8) |
| §12.9 Sign Badge | glyph + tên; dot Element 8px (`showElement`); `aria-label` "Sư Tử, thuộc nguyên tố Lửa" | `SignGlyph`: `showElement` **không** ở M7 (VM/labels chưa có nguyên tố — KG-M2-02); `aria-label` = tên cung |
| §12.10 House Badge | 1–12, `numeralStyle` (`roman`\|`arabic`), `showCategory`; La Mã phải có `aria-label` "Nhà thứ 5" | `HouseBadge`: `numeralStyle` (mặc định `arabic`), **không** `showCategory` (dùng trong Interpretation, không phải bảng) |
| §12.11 Aspect Badge | ☌ ☍ □ △ ⚹; màu theo nhóm (Harmonious indigo / Tense brass đậm / Neutral slate); `aria-label` tiếng Việt | `AspectBadge` từ `type: GlyphLabel` + `nature: NatureLabel` (tone đã ở VM); màu là phụ trợ |
| §6.2 Density | `comfortable` = `space-3`, `compact` = `space-2` cho `PlanetTable`/`AspectTable` | áp cho cả ba bảng nhất quán |
| §7.2 Responsive | dưới `sm` chuyển card-per-row, **không** dùng cuộn ngang làm giải pháp | `useMediaQuery('(min-width: 640px)')` |
| §17/§18/§23 | a11y chung, trạng thái tải/lỗi/rỗng, chiến lược test | tuân thủ; chi tiết ở Mục 18/29 |
| **§49** | **không tồn tại** | báo cáo sai tham chiếu (Phát hiện 1) |

## 7. M7 Goal and Scope

**Mục tiêu:** người dùng đọc được toàn bộ dữ liệu lá số dưới dạng bảng/thẻ dễ truy cập, kể cả khi thiếu dữ liệu nhà.
**Trong phạm vi:** `PlanetGlyph`, `SignGlyph`, `HouseBadge`, `AspectBadge`; `PlanetTable`, `HouseTable` (+ bảng góc), `AspectTable`; thẻ mobile; nút chọn **controlled**; `AspectFilterChip` (trình bày + `onClear`); khối giải thích thiếu nhà; `useMediaQuery`; helper test `matchMedia`; test component + `vitest-axe`; ghép vào `ChartViewerShell`; hồi quy; Evidence Matrix + checklist đọc màn hình thủ công.

## 8. Out of Scope

Chart Wheel và hình học · đường aspect · **ma trận aspect/`layout="grid"`** · đồng bộ hover/chọn wheel↔bảng · S4.8 · store/Context/Zustand/event bus mới · **chủ sở hữu `selection`/`filterPlanetKey`** · sửa Backend/hợp đồng · tính lại vị trí/aspect/orb/retrograde ở frontend · `showOptionalBodies`, `showElement`, `showCategory`, `numeralStyle` từ preference · `selected`/`dimmed` của badge · UI diễn giải (F5) · trang Cài đặt/orb · `SelectionDetail` · skip link "Chuyển tới bảng dữ liệu" (S4.9) · thay đổi thiết kế Viewer ngoài khe tích hợp · E2E mới (S4.10).

## 9. Existing Architecture

- **Phân lớp:** `shared` → `features/chart/{api,hooks,model,ui}` → `pages` → `app`. Feature **không** import feature khác; `ui/` không import `api/` trực tiếp (Architecture Spec §2.2/§8). ESLint `boundaries` đang tắt ⇒ grep ở Mục 32.
- **Luồng dữ liệu:** `ChartDetailPage`: `useChartQuery` → `useMemo(() => toChartViewModel(data))` → `<ChartViewerShell vm={vm} />`. Bảng nhận **VM** (không nhận DTO).
- **Thứ tự & nhãn:** tập trung ở `model/` (M2). Bảng **không sắp xếp lại, không tra nhãn thô**: dùng `PlanetVM.nameVi/glyph/ariaLabel`, `GlyphLabel`, `AngleVM`, `AspectVM.type/nature/orbLabel/applyingLabelVi`.
- **State:** TanStack Query (server), `useState` cục bộ, Zustand sẵn có (`authStore`, `uiStore`, `preferenceStore`). M7 chỉ **đọc** `preferenceStore`.
- **Responsive:** Tailwind `sm 640`; chưa có media-query hook.
- **Test:** Vitest + Testing Library + `vitest-axe`; `matchMedia` mock tĩnh trong `setup.ts`.
- **A11y primitives đã có:** `Alert`, `EmptyState`, `Card`, `Badge` (không tương tác), `SkipLink`.

## 10. View Model / Data Contract

| Dữ liệu | Nguồn VM | Ghi chú |
|---|---|---|
| Hành tinh | `PlanetVM{ key, nameVi, glyph, known, longitude, sign: GlyphLabel, degreeLabel: string\|null, houseNumber: number\|null, isRetrograde, ariaLabel }` | thứ tự đã chính tắc |
| Nhà | `HouseVM{ number, labelVi, ariaLabel, cuspLongitude, sign: GlyphLabel, degreeLabel }`; `[]` khi `!houseDataAvailable` | |
| Góc | `AngleVM{ key, known, shortLabel, labelVi, ariaLabel, longitude, sign, degreeLabel }`; `flags.hasAngles` | độc lập với `houseDataAvailable` |
| Aspect | `AspectVM{ key, planetA, planetB, type: GlyphLabel, nature: NatureLabel{tone}, orb, orbLabel, isApplying, applyingLabelVi }` | sắp theo orb ↑ |
| Cờ | `flags{ houseDataAvailable, hasAngles, partialData }` | **một nguồn** cho thiếu nhà |
| Cảnh báo | `warnings[]` (`HOUSE_SYSTEM_NOT_CONVERGING` → nhãn) | dùng trong notice |
| Hệ nhà | `meta.houseSystem.labelVi` | Badge ở tiêu đề bảng nhà |

**Thiếu so với spec (contract gap):** `maxOrb`/orb cho phép (§12.4); nguyên tố cung (`showElement`); nhóm Angular/Succedent/Cadent (`showCategory`). Không suy ra bằng tính toán (Mục 34).
**Nullable/không có:** `degreeLabel` có thể `null` (hiển thị `—` + chữ ẩn "Không có dữ liệu"); `houseNumber` có thể `null` khi nhà khả dụng nhưng dữ liệu hành tinh lỗi (`VALUE_OUT_OF_RANGE`) — hiển thị `—`; khi `!houseDataAvailable` **bỏ hẳn** cột/trường Nhà. Giá trị lạ (`known:false`) hiển thị nhãn gốc, không glyph.

## 11. Component Architecture

```text
features/chart/ui/
├── ChartBadges/        PlanetGlyph · SignGlyph · HouseBadge · AspectBadge  (thuần, nhận giá trị VM)
├── PlanetTable/        PlanetTable.tsx (table|cards)            — controlled
├── HouseTable/         HouseTable.tsx (bảng nhà + bảng góc + khối thiếu dữ liệu) — controlled
├── AspectTable/        AspectTable.tsx · AspectFilterChip.tsx    — controlled
├── tableStyles.ts      hằng lớp CSS dùng chung (padding theo density, đơn cách, sr-only)
└── ChartViewerShell/   (sửa) ghép ba bảng, đọc density + useMediaQuery, truyền layout
shared/hooks/useMediaQuery.ts   (mới)
src/test/matchMedia.ts          (mới, helper test)
```

**Nguyên tắc:** (1) mỗi bảng là thuần trình bày, **không** gọi hook media/store; Shell quyết định `layout` và `density` (một subscription, bảng dễ test); (2) bảng nhận mảng VM + cờ; (3) selection/filter là **controlled** (prop + callback), không `useState` selection trong bảng; (4) `tableStyles.ts` thay cho việc nhân bản class, **không** tạo `shared/ui/Table` (ngoài phạm vi, là thay đổi design system); (5) badge nhận `GlyphLabel`/`NatureLabel` (VM), không nhận DTO/enum thô.

## 12. ChartBadges Design

Vị trí `features/chart/ui/ChartBadges/`. Nguyên tắc chung: glyph luôn `aria-hidden="true"`; **tên truy cập là chữ thật** (hiển thị hoặc `sr-only`), không phụ thuộc glyph; `glyph: null` ⇒ không vẽ glyph, chữ vẫn có.

| Component | Props | Biểu diễn | Tên truy cập / fallback | Test chính |
|---|---|---|---|---|
| `PlanetGlyph` | `{ planet: GlyphLabel; retrograde?: boolean; showLabel?: boolean (mặc định true); size?: "sm"\|"md"\|"lg"; className? }` | glyph + `planet.labelVi`; `retrograde` thêm `℞` (`aria-hidden`) | `showLabel` ⇒ chữ hiển thị; `!showLabel` ⇒ `role="img" aria-label="{labelVi}{, nghịch hành}"`; lạ ⇒ nhãn gốc, không glyph | tên đúng cho Sun/Pluto/lạ; glyph ẩn khỏi cây trợ năng; `retrograde` có chữ "nghịch hành"; axe |
| `SignGlyph` | `{ sign: GlyphLabel; showLabel?: boolean; size? }` | glyph (đã có `U+FE0E`) + tên cung | như trên (không có nguyên tố — KG-M2-02) | 12 cung; lạ; không emoji (kiểm chuỗi `\uFE0E`) |
| `HouseBadge` | `{ house: number; ariaLabel?: string; numeralStyle?: "arabic"\|"roman" (mặc định arabic); size? }` | số hiển thị (`5`/`V`) `aria-hidden` + `sr-only` "Nhà thứ 5" | luôn "Nhà thứ n" (ưu tiên `HouseVM.ariaLabel`); số ngoài 1–12 ⇒ hiện `—` + "Không rõ nhà" | arabic/roman (bảng 12 giá trị cố định, không thuật toán); aria; ngoài miền |
| `AspectBadge` | `{ type: GlyphLabel; nature: NatureLabel; showLabel?: boolean (mặc định true); size? }` | glyph + `type.labelVi`; **tone** là viền/chấm màu phụ (`data-tone`) | tên = `type.labelVi` (+ `sr-only` tính chất: ", căng thẳng"); tone lạ ⇒ trung tính, không ép sang nhóm khác | 5 loại; 3 tone + `unknown`; màu không phải kênh duy nhất; axe |

- **Màu tone (đề xuất):** `harmonious` → token `accent-secondary` (indigo-600), `tense` → `accent-primary` (brass-500), `neutral`/`unknown` → `text-secondary` (slate-600), chỉ làm **viền/chấm**; chữ giữ `text-primary` (tránh rủi ro tương phản chữ brass trên nền sáng). Độ tương phản cần **kiểm thủ công** (axe jsdom không tính màu).
- **Tái dùng:** chỉ trong `features/chart/ui`; không export sang `shared`. `selected`/`dimmed` thuộc S4.8 (không thêm prop rỗng).

## 13. PlanetTable Design

**Props:** `{ planets: PlanetVM[]; houseDataAvailable: boolean; layout?: "table"\|"cards" (mặc định "table"); density?: "comfortable"\|"compact" (mặc định comfortable); selectedKey?: string \| null; onSelect?: (key: PlanetKey) => void; className? }`.

- **Section:** `<section aria-labelledby>` + `h2` hiển thị "Vị trí hành tinh"; `<table>` với `<caption className="sr-only">Vị trí hành tinh — Natal Chart, {n} hàng</caption>` (mô tả bám spec).
- **Cột (thứ tự):** [nút chọn trong ô đầu] **Hành tinh** (`<th scope="row">`: `PlanetGlyph`) · **Cung** (`SignGlyph`) · **Độ** (`degreeLabel`, `font-data tabular-nums`) · **Nhà** (`HouseBadge`; **chỉ khi** `houseDataAvailable`) · **Nghịch hành** (xem dưới). Mọi `<th scope="col">` trong `<thead>`.
- **Hàng:** đúng thứ tự VM (không sắp lại); `key = planet.key` (có thể trùng trong dữ liệu hỏng ⇒ dùng `${key}#${index}` cho React key nhưng `onSelect` phát `planet.key`).
- **Nghịch hành:** `isRetrograde` ⇒ `℞` (`aria-hidden`) + chữ "Nghịch hành"; `false` ⇒ `—` + `sr-only` "Không nghịch hành". Không tính lại; không dùng chỉ màu/glyph.
- **Thiếu nhà:** cột Nhà **không render**; không điền `—` giả hàng loạt. Khi nhà khả dụng mà `houseNumber === null` ⇒ `—` + `sr-only` "Không có dữ liệu nhà".
- **Chọn:** nếu có `onSelect`, ô đầu chứa `<button type="button" aria-pressed={selectedKey === key} onClick={() => onSelect(key)}>` bao `PlanetGlyph`; tên truy cập "Chọn {nameVi}"; focus ring `focus-visible:ring-2 ring-focus`; hàng chọn có nền + `aria-current`? (**không**; trạng thái đã có `aria-pressed`). Không `useState`. Không có `onSelect` ⇒ **không render nút**.
- **Cards (`layout="cards"`):** `<ul role="list">` với `<li>` card: tiêu đề `PlanetGlyph` (cỡ lớn) + nút chọn (nếu có) + `<dl>` label:value (Cung, Độ, Nhà [nếu khả dụng], Nghịch hành). Không bảng ẩn trong DOM.
- **Density:** `comfortable` ⇒ `px-3 py-3`; `compact` ⇒ `px-2 py-2` (`tableStyles.ts`).
- **Giá trị dài:** `min-w-0 truncate` có `title` cho tên; độ không bao giờ xuống dòng (`whitespace-nowrap`).
- **Rỗng:** `planets=[]` (hợp đồng hỏng) ⇒ `EmptyState`-nhẹ "Không có dữ liệu hành tinh để hiển thị" (không phải "lỗi tính").

## 14. HouseTable Design

**Props:** `{ houses: HouseVM[]; angles: AngleVM[]; houseDataAvailable: boolean; hasAngles: boolean; houseSystemLabel: string; unavailableContent?: ReactNode; layout?; density? }`.

- **Tiêu đề:** `h2` "Nhà và các góc" + `Badge` nhỏ `houseSystemLabel` (spec §12.3: luôn rõ đang xem hệ nào).
- **`houseDataAvailable === true`:** `<table>` `<caption className="sr-only">Nhà theo hệ {houseSystemLabel} — Natal Chart, 12 hàng</caption>`; cột **Nhà** (`<th scope="row">` `HouseBadge`) · **Cusp (độ)** (`degreeLabel`) · **Cung** (`SignGlyph`); đúng thứ tự VM (1→12). Thẻ: `HouseBadge` lớn + `dl` (Cusp, Cung).
- **`houseDataAvailable === false`:** **không** bảng nhà, **không** hàng/giá trị mặc định; hiển thị `unavailableContent` (Shell truyền `HouseDataNotice` — "Dữ liệu Nhà và các góc chưa khả dụng …", kèm câu `HOUSE_SYSTEM_NOT_CONVERGING` nếu Backend báo). Là `Alert info` (không `danger`, không `role=alert` lỗi tính), không `reportError`.
- **Góc (`hasAngles`):** bảng phụ `<table>` "Các góc chính" (caption sr-only) — cột **Góc** (`<th scope="row">`: `shortLabel` + `labelVi`) · **Cung** · **Độ**; đúng thứ tự VM; thẻ tương tự. Không có nút chọn. Hiển thị **độc lập** với `houseDataAvailable` (khi chỉ có góc, vẫn hiện cùng notice).
- **Cả hai vắng:** chỉ còn khối giải thích (một instance).
- **Không** `numeralStyle` từ preference (mặc định arabic). Không suy ra "nhà của góc".

## 15. AspectTable Design

**Props:** `{ aspects: AspectVM[]; layout?; density?; selectedKey?: string \| null; onSelect?: (key: AspectKey) => void; filterPlanetKey?: string \| null; filterPlanet?: GlyphLabel; onClearFilter?: () => void }`.

- **Section:** `h2` "Góc chiếu"; `<caption className="sr-only">Góc chiếu giữa các hành tinh — Natal Chart, {n} hàng, sắp theo orb tăng dần</caption>`.
- **Cột:** [nút chọn] **Hành tinh A** (`<th scope="row">`: `PlanetGlyph`) · **Góc chiếu** (`AspectBadge`) · **Hành tinh B** (`PlanetGlyph`) · **Orb** (`orbLabel`, mono) · **Trạng thái** (`applyingLabelVi`: "Đang tới gần"/"Đang rời xa", chữ thật, không chỉ icon).
- **Thứ tự:** đúng VM (orb tăng dần — VM đã tie-break); **không** sắp lại ở UI. Bộ lọc chỉ **lọc mảng** (giữ thứ tự).
- **Lọc:** `filterPlanetKey` do parent cấp; khi khác `null` ⇒ hiển thị hàng có `planetA.key` hoặc `planetB.key` bằng khoá đó + `AspectFilterChip`. Lọc không còn hàng ⇒ thông báo "Không có góc chiếu nào của {tên} trong dữ liệu" (khác empty gốc).
- **`AspectFilterChip`:** `<button type="button">` "Đang lọc: {labelVi} ✕" (`✕` `aria-hidden`), `aria-label="Xóa bộ lọc theo {labelVi}"`, gọi `onClearFilter`. Nằm trong vùng `aria-live="polite"` luôn mounted (thông báo khi xuất hiện/biến mất). Thiếu `onClearFilter` ⇒ chip hiển thị nhưng không có nút (chữ thuần).
- **Chọn:** như PlanetTable; khoá = `AspectVM.key`.
- **Empty (không có aspect):** `EmptyState` "Không tìm thấy góc chiếu nào trong phạm vi orb hiện tại" (câu của spec; **bỏ** gợi ý Cài đặt). Không phải lỗi.
- **Orb tối đa:** không hiển thị (contract gap).
- **Không** `layout="grid"`/ma trận.

## 16. Filter Chips and Controlled Selection

| Hạng mục | Quyết định |
|---|---|
| Phạm vi chip ở M7 | **`AspectFilterChip`** (UI chip duy nhất do spec định nghĩa, §12.4). Không có chip lọc cho bảng khác. |
| Điều khiển | Parent cấp `filterPlanetKey`/`filterPlanet`; chip phát `onClearFilter`; không store độc lập |
| Ai bật bộ lọc? | **S4.8** (chọn hành tinh ⇒ parent đặt `filterPlanetKey`). Ở M7 Shell truyền `undefined` ⇒ chip **chưa hiện** trong app; được test ở mức component (hiện, xoá, phím, aria) |
| Selection control | `selectedKey` + `onSelect(key)` ở từng bảng; **render nút chỉ khi có `onSelect`** (D-M7-3) |
| Không làm | không `useState` selection trong bảng; không đồng bộ wheel; không Context/Zustand |

**Handoff cho S4.8 (hợp đồng):**
1. `ChartViewer` (container S4.8) sở hữu **một** `selection` (`none \| planet(key) \| aspect(key)`) và `filterPlanetKey` dẫn xuất từ `selection`.
2. Truyền xuống: `PlanetTable selectedKey={selection.kind==="planet"?selection.key:null} onSelect={selectPlanet}`; `AspectTable selectedKey={…aspect…} onSelect={selectAspect} filterPlanetKey={…} filterPlanet={…} onClearFilter={clear}`.
3. Khoá: `PlanetVM.key` (`PlanetKey`) và `AspectVM.key` (`AspectKey`) — định danh ổn định từ M2.
4. Bảng phát `onSelect(key)` cho cả lần bấm lại hàng đang chọn; **parent** quyết định chọn/bỏ chọn.
5. Wheel dùng cùng khoá; `HouseTable` không tham gia selection.

## 17. Responsive Strategy

- **Cơ chế:** `useMediaQuery("(min-width: 640px)")` (= Tailwind `sm`, đúng UI Spec §7.2) gọi **một lần** trong `ChartViewerShell`; `layout = matches ? "table" : "cards"` truyền cho ba bảng. **Chỉ một biểu diễn tồn tại trong DOM** (không ẩn bằng CSS) ⇒ không trùng nội dung cho trình đọc màn hình.
- **`useMediaQuery(query)`** (`shared/hooks/useMediaQuery.ts`, mới): `useSyncExternalStore`; subscribe `matchMedia(query)` `addEventListener("change")` + cleanup; snapshot = `matchMedia(query).matches`; server snapshot `false` (SPA Vite, không SSR); nếu `window.matchMedia` không phải hàm ⇒ `false`. Không phụ thuộc store.

| | Desktop (≥ lg 1024) | Tablet (sm–lg 640–1023) | Mobile (< sm 640) |
|---|---|---|---|
| Biểu diễn | `<table>` | `<table>` | thẻ (`ul/li` + `dl`) |
| Bố cục trang | M7 một cột (hai cột với wheel là S4.4+) | một cột | một cột |
| Chọn | nút ở ô đầu | nút ở ô đầu | nút trong tiêu đề thẻ (đủ vùng chạm ≥ 44px) |
| Độ dài | `truncate` + `title`; số `nowrap` | như desktop | nhãn xuống dòng được; số `nowrap` |
| Cuộn ngang | không cần (≤ 5 cột); `overflow-x-auto` chỉ là lưới an toàn cho `<table>` | như desktop | **không** cuộn ngang |

## 18. Accessibility Strategy

- `<table>` thật, `<caption>` (sr-only, mô tả), `scope="col"` ở `<th>` tiêu đề, `scope="row"` ở ô định danh (hành tinh/nhà/góc/Planet A).
- Glyph luôn `aria-hidden`; mọi định danh có **chữ** (hiển thị hoặc `sr-only`).
- Nút chọn bằng `<button>` thật; `aria-pressed`; Enter/Space; focus ring hiển thị; `type="button"`.
- Không dùng màu làm kênh duy nhất: retrograde = chữ; applying/separating = chữ; aspect type = chữ; **tone** là phụ trợ + chữ `sr-only`.
- Thiếu nhà: `Alert info` đúng vai trò `status`; không `role="alert"` (không phải lỗi).
- Chip lọc: nút + vùng `aria-live="polite"`.
- Thẻ mobile: `ul role="list"`/`li`/`dl` — dữ liệu tương đương bảng.
- **Thủ công (bắt buộc ghi vào Evidence Matrix):** NVDA/Windows + VoiceOver/macOS-iOS (duyệt bảng, đọc ô, đọc thẻ, nút chọn, chip), kiểm tương phản (light/dark), kiểm render glyph trên Windows/macOS/iOS/Android (KG-M2-04), thu phóng 200% và 320px.
- Axe tự động **chỉ** là một phần (không đo tương phản trong jsdom).

## 19. State Ownership

M7 **không** thêm store/Context/event bus. Dữ liệu biểu đồ bất biến đến từ VM (prop). `layout` do Shell dẫn xuất từ `useMediaQuery` (hook thuần, trạng thái bên trong hook). `density` đọc từ `preferenceStore` ở Shell (selector) và truyền xuống. `selectedKey`/`filterPlanetKey` do **parent** (S4.8) cấp; ở M7 không có chủ ⇒ `undefined`. Bảng **không** có `useState`. Xem ma trận Mục 26.

## 20. ChartViewer Integration

- **Điểm ghép:** `features/chart/ui/ChartViewerShell/ChartViewerShell.tsx` (**không** có `ChartViewer`).
- **Thứ tự mới:** metadata `Card` → `Alert partialData` (nếu có) → **placeholder wheel** (giữ `data-testid="chart-visualization-placeholder"`, sửa chữ thành "Biểu đồ tròn sẽ xuất hiện ở đây.") → `PlanetTable` → `HouseTable` → `AspectTable`.
- **Thay đổi hành vi có chủ đích:** `HouseDataNotice` **chuyển** từ đầu Shell vào `HouseTable` (slot `unavailableContent`) ⇒ một instance (D-M7-4). Test M3 V2/V3 (kiểm sự hiện diện/chữ của notice) vẫn đúng vì notice vẫn nằm trong Shell; chỉ có thể thay đổi nếu test kiểm *vị trí*.
- **Đọc store:** `const density = usePreferenceStore((s) => s.densityMode)`; `const isTable = useMediaQuery("(min-width: 640px)")`.
- **Không đổi:** `ChartDetailPage`, mapping `toChartViewModel`, title/focus, lỗi/skeleton, route, M11.
- **Test hiện có bị ảnh hưởng:** `matchMedia` mặc định `false` ⇒ Shell/page test sẽ render **thẻ** (assertion cũ về metadata/placeholder/notice không đổi); ca axe của Shell (`ChartViewerShell.test.tsx`) sẽ bao gồm bảng/thẻ ⇒ phải xanh. Test mới đặt `matchMedia` qua helper.
- **Chống trùng nội dung:** mỗi bảng chỉ render một biểu diễn; không còn hai notice.

---

## 21. Implementation Task Breakdown

Thứ tự: **M7.0 → (M7.1 ∥ M7.2) → (M7.3 ∥ M7.4 ∥ M7.5) → M7.6 → M7.7**.

### F4-M7.0 — Cổng quyết định (không mã)
Owner xác nhận/chấp nhận mặc định D-M7-1…D-M7-8 (Mục 34), đặc biệt D-M7-3, D-M7-4, D-M7-5. **Chặn:** M7.3–M7.6 (hợp đồng prop và bố cục).

### F4-M7.1 — `useMediaQuery` and matchMedia Test Helper (tiền đề)
1. **Objective:** hook dùng chung + helper test điều khiển được. 2. **Rationale:** tiền đề duy nhất còn thiếu; tránh nhân bản. 3. **Preconditions:** M7.0. 5. **Inspect:** `src/test/setup.ts`, `shared/hooks/useDebounce.ts(+test)`, `ThemeProvider.test.tsx`. 6. **Change:** tạo `shared/hooks/useMediaQuery.ts`, `useMediaQuery.test.ts`, `src/test/matchMedia.ts`. 7. **Steps:** (a) hook `useSyncExternalStore`; (b) helper `installMatchMedia(initial)` trả `{ setMatches(query, value), restore() }` — `MediaQueryList` giả có `addEventListener/removeEventListener/addListener/removeListener`, phát `change` thật tới listener đã đăng ký; (c) test hook. 8. **Contract:** `useMediaQuery(query: string): boolean`. 9. **State:** nội bộ hook; không store. 10. **A11y:** không. 11. **Tests:** M7-U1…U6 (Mục 29). 12. **Verify:** `npx vitest run src/shared/hooks/useMediaQuery.test.ts`; `npm run typecheck`; `npm run lint`. 13. **Acceptance:** AC-R1…AC-R3. 14. **Dependencies:** M7.0. 15. **Out of scope:** sửa `setup.ts` toàn cục. 16. **Risks:** hook gọi `matchMedia` mỗi snapshot (chấp nhận, rẻ); helper phải `restore()` trong `afterEach`.

### F4-M7.2 — ChartBadges
1. **Objective:** `PlanetGlyph`, `SignGlyph`, `HouseBadge`, `AspectBadge`. 3. **Preconditions:** M7.0; S4.2. 5. **Inspect:** `model/labels.ts` (`GlyphLabel`, `NatureLabel`), `Badge`, tokens. 6. **Change:** tạo `features/chart/ui/ChartBadges/{PlanetGlyph.tsx,SignGlyph.tsx,HouseBadge.tsx,AspectBadge.tsx,index.ts}` + test mỗi file; `ui/tableStyles.ts` (dùng chung). 7. **Steps:** mục 12; `HouseBadge` roman map 12 giá trị; `size` → lớp. 8. **Contract:** Mục 12. 9. **State:** không. 10. **A11y:** glyph `aria-hidden`; tên bằng chữ; `role="img"` khi `!showLabel`. 11. **Tests:** nhóm B (Mục 29). 12. **Verify:** `npx vitest run src/features/chart/ui/ChartBadges`. 13. **Acceptance:** AC-B1…AC-B6. 14. **Dependencies:** M7.0. 15. **Out of scope:** `selected/dimmed`, `showElement`, `showCategory`, preference `numeralStyle`. 16. **Risks:** glyph tofu (R-3); tương phản tone (R-7).

### F4-M7.3 — PlanetTable
1. **Objective:** bảng + thẻ + nút chọn controlled. 3. **Preconditions:** M7.2. 5. **Inspect:** `PlanetVM`, `fixtures.ts`, UI Spec §12.2/§6.2/§7.2. 6. **Change:** tạo `features/chart/ui/PlanetTable/{PlanetTable.tsx,index.ts,PlanetTable.test.tsx}`. 7. **Steps:** Mục 13. 8. **Contract:** Mục 13. 9. **State:** không (controlled). 10. **A11y:** caption, scope, nút `aria-pressed`. 11. **Tests:** nhóm P. 12. **Verify:** `npx vitest run src/features/chart/ui/PlanetTable`. 13. **Acceptance:** AC-P1…AC-P9. 14. **Dependencies:** M7.2. 15. **Out of scope:** nối selection, `showOptionalBodies`. 16. **Risks:** cột Nhà ẩn khi thiếu nhà (đã định nghĩa).

### F4-M7.4 — HouseTable, Angles and Missing-Data UX
1. **Objective:** bảng nhà + bảng góc + khối giải thích. 3. **Preconditions:** M7.2. 6. **Change:** tạo `features/chart/ui/HouseTable/{HouseTable.tsx,index.ts,HouseTable.test.tsx}`. 7. **Steps:** Mục 14. 11. **Tests:** nhóm H. 12. **Verify:** `npx vitest run src/features/chart/ui/HouseTable`. 13. **Acceptance:** AC-H1…AC-H8. 14. **Dependencies:** M7.2. 15. **Out of scope:** `showCategory`, nhà của góc. 16. **Risks:** trùng notice (D-M7-4); fabricate nhà (test khẳng định không có `<table>` nhà).

### F4-M7.5 — AspectTable and Filter Chip
1. **Objective:** bảng aspect + chip lọc + empty. 3. **Preconditions:** M7.2. 6. **Change:** tạo `features/chart/ui/AspectTable/{AspectTable.tsx,AspectFilterChip.tsx,index.ts,AspectTable.test.tsx,AspectFilterChip.test.tsx}`. 7. **Steps:** Mục 15/16. 11. **Tests:** nhóm A, F. 12. **Verify:** `npx vitest run src/features/chart/ui/AspectTable`. 13. **Acceptance:** AC-A1…AC-A9, AC-F1…AC-F4. 14. **Dependencies:** M7.2. 15. **Out of scope:** ma trận, lọc từ Planet Table, orb tối đa. 16. **Risks:** chip không tới được trong app (ghi rõ).

### F4-M7.6 — ChartViewerShell Integration
1. **Objective:** ghép ba bảng + density + `useMediaQuery`; chuyển notice; sửa chữ placeholder. 3. **Preconditions:** M7.1, M7.3, M7.4, M7.5. 5. **Inspect:** `ChartViewerShell.tsx(+test)`, `ChartDetailPage` tests V1–V9, `preferenceStore`. 6. **Change:** sửa `ChartViewerShell.tsx`; **thêm** test vào `ChartViewerShell.test.tsx` và (nếu cần) `pages/app/charts/detail/page.test.tsx`; sửa chữ placeholder và bất kỳ assertion bị ảnh hưởng (liệt kê trong Evidence Matrix, không xoá kỳ vọng). 7. **Steps:** Mục 20. 9. **State:** không thêm. 11. **Tests:** nhóm S. 12. **Verify:** `npx vitest run src/features/chart/ui/ChartViewerShell src/pages/app/charts`. 13. **Acceptance:** AC-S1…AC-S6. 14. **Dependencies:** M7.1, M7.3–M7.5. 15. **Out of scope:** wheel, layout hai cột, selection. 16. **Risks:** test cũ chuyển sang thẻ (đã phân tích); hồi quy notice.

### F4-M7.7 — Accessibility, Responsive, Regression and Closure
1. **Objective:** axe đại diện, test responsive tích hợp, hồi quy toàn bộ, cổng chất lượng, checklist thủ công, Evidence Matrix. 3. **Preconditions:** M7.6. 6. **Change:** thêm test tích hợp responsive/axe nếu thiếu; Evidence Matrix. 11. **Tests:** nhóm R/S. 12. **Verify:** Mục 32. 13. **Acceptance:** AC-Q1…AC-Q5. 14. **Dependencies:** M7.6. 15. **Out of scope:** E2E mới (S4.10) — **khuyến nghị** thêm assertion bảng vào E2E ở S4.10. 16. **Risks:** suite chậm trong sandbox (ghi nhận).

## 22. Task Dependencies

| Task | Depends On | Parallel? | Blocking Condition |
|---|---|---|---|
| M7.0 | Mục 3–5 đã xác minh | — | owner xác nhận D-M7-3/4/5 (hoặc mặc định) |
| M7.1 | M7.0 | ∥ M7.2 | không |
| M7.2 | M7.0 | ∥ M7.1 | `GlyphLabel/NatureLabel` (VERIFIED) |
| M7.3 | M7.2 | ∥ M7.4, M7.5 | không |
| M7.4 | M7.2 | ∥ M7.3, M7.5 | D-M7-4/5 |
| M7.5 | M7.2 | ∥ M7.3, M7.4 | không |
| M7.6 | M7.1, M7.3, M7.4, M7.5 | — | cả bốn xong |
| M7.7 | M7.6 | — | CI Frontend xanh trên commit cuối |

Tuân thủ chuỗi **S4.2 → S4.3 → M11 → M7** (đã hoàn tất các tiền đề).

## 23. File Change Map

| File / Directory | Status | Planned Action | Task | Evidence |
|---|---|---|---|---|
| `frontend/src/shared/hooks/useMediaQuery.ts` (+ `.test.ts`) | **chưa có** (đề xuất) | Create | M7.1 | F4 plan dòng 219/680; `shared/hooks` không có |
| `frontend/src/test/matchMedia.ts` | chưa có (đề xuất) | Create (helper test) | M7.1 | `setup.ts` mock tĩnh |
| `frontend/src/features/chart/ui/ChartBadges/{PlanetGlyph,SignGlyph,HouseBadge,AspectBadge}.tsx` + `index.ts` + tests | chưa có | Create | M7.2 | F4 plan dòng 144/232 |
| `frontend/src/features/chart/ui/tableStyles.ts` | chưa có | Create | M7.2 | tránh nhân bản class |
| `frontend/src/features/chart/ui/PlanetTable/**` | chưa có | Create | M7.3 | UI Spec §12.2 |
| `frontend/src/features/chart/ui/HouseTable/**` | chưa có | Create | M7.4 | UI Spec §12.3 |
| `frontend/src/features/chart/ui/AspectTable/**` (gồm `AspectFilterChip`) | chưa có | Create | M7.5 | UI Spec §12.4 |
| `frontend/src/features/chart/ui/ChartViewerShell/ChartViewerShell.tsx` | **có** | Modify | M7.6 | đọc ở audit |
| `frontend/src/features/chart/ui/ChartViewerShell/ChartViewerShell.test.tsx` | có | Modify (thêm; sửa assertion chỉ khi bị ảnh hưởng) | M7.6 | 4 test hiện có |
| `frontend/src/pages/app/charts/detail/page.test.tsx` | có | Modify (chỉ khi assertion cũ phụ thuộc DOM đổi) | M7.6 | V1–V9 |
| `frontend/src/features/chart/index.ts` | có | Modify **chỉ khi** S4.8 cần export bảng (M7: không bắt buộc) | — | barrel hiện tại |
| `docs/implementation/archive/sprint-f4/Sprint_F4_M7_Exit_Criteria_Evidence_Matrix.md` | chưa có | Create (cuối) | M7.7 | quy ước |

**Chỉ đọc (không sửa):** `features/chart/model/**`, `api/**`, `hooks/**`, `shared/ui/**`, `shared/stores/**`, `src/test/setup.ts`, `app/router.tsx`, `ChartDetailPage`, `pages/app/charts/page.tsx` (M11), `backend/**`, `package.json`, cấu hình ESLint/TS/Vite/Playwright/CI.

## 24. Component Matrix

| Component | Responsibility | Inputs | Outputs / Callbacks | State Owner | Tests |
|---|---|---|---|---|---|
| `PlanetGlyph` | glyph + tên hành tinh (+ ℞) | `GlyphLabel`, `retrograde`, `showLabel`, `size` | — | không | unit + axe |
| `SignGlyph` | glyph + tên cung | `GlyphLabel`, `showLabel`, `size` | — | không | unit + axe |
| `HouseBadge` | số nhà arabic/La Mã + tên truy cập | `house`, `ariaLabel?`, `numeralStyle` | — | không | unit + axe |
| `AspectBadge` | glyph + tên aspect + tone phụ | `type`, `nature`, `showLabel`, `size` | — | không | unit + axe |
| `PlanetTable` | bảng/thẻ hành tinh | `planets`, `houseDataAvailable`, `layout`, `density`, `selectedKey?` | `onSelect(key)` | **parent** (S4.8) | component + axe |
| `HouseTable` | bảng nhà + bảng góc + khối thiếu dữ liệu | `houses`, `angles`, `houseDataAvailable`, `hasAngles`, `houseSystemLabel`, `unavailableContent`, `layout`, `density` | — | không | component + axe |
| `AspectTable` | bảng/thẻ aspect + lọc + empty | `aspects`, `layout`, `density`, `selectedKey?`, `filterPlanetKey?`, `filterPlanet?` | `onSelect(key)`, `onClearFilter()` | **parent** (S4.8) | component + axe |
| `AspectFilterChip` | chip "Đang lọc: … ✕" | `planet: GlyphLabel`, `onClear?` | `onClear()` | parent | component + axe |
| `useMediaQuery` | trạng thái media query | `query` | `boolean` | trong hook | hook test |
| `ChartViewerShell` (sửa) | ghép bảng, đọc `density`/`layout` | `vm` | — | không (đọc `preferenceStore`) | component + tích hợp |

## 25. Data Contract Matrix

| Data | View Model Source | Formatting | Nullable / Unavailable Behavior | Consumer |
|---|---|---|---|---|
| Planet | `PlanetVM.key/nameVi/glyph/known/ariaLabel` | `PlanetGlyph` | lạ ⇒ nhãn gốc, không glyph | PlanetTable, AspectTable |
| Sign | `PlanetVM.sign`, `HouseVM.sign`, `AngleVM.sign` (`GlyphLabel`) | `SignGlyph` | lạ ⇒ nhãn gốc | 3 bảng |
| Degree | `PlanetVM.degreeLabel`, `AngleVM.degreeLabel` | VM (`D°MM′`) — **không** format lại | `null` ⇒ `—` + chữ ẩn | PlanetTable, HouseTable |
| House (planet) | `PlanetVM.houseNumber` | `HouseBadge` (arabic) | `null` ⇒ `—`; `!houseDataAvailable` ⇒ **bỏ cột** | PlanetTable |
| Cusp | `HouseVM.degreeLabel` | VM | `null` ⇒ `—` | HouseTable |
| House number | `HouseVM.number/ariaLabel` | `HouseBadge` | `houses=[]` ⇒ khối giải thích | HouseTable |
| Angles | `AngleVM.*`, `flags.hasAngles` | `shortLabel` + `labelVi` | `!hasAngles` ⇒ không render bảng góc | HouseTable |
| Aspect | `AspectVM.type` (`GlyphLabel`), `nature` | `AspectBadge` | lạ ⇒ nhãn gốc, tone `unknown` | AspectTable |
| Orb | `AspectVM.orbLabel` (+ `orb` thô để sắp) | VM | `null` ⇒ `—` | AspectTable |
| Applying/Separating | `AspectVM.isApplying`, `applyingLabelVi` | chữ "Đang tới gần"/"Đang rời xa" | luôn có (boolean bắt buộc ở VM) | AspectTable |
| Retrograde | `PlanetVM.isRetrograde` | `℞` + "Nghịch hành"; ngược lại `—` + "Không nghịch hành" | boolean bắt buộc | PlanetTable |
| `isHouseDataAvailable` | `vm.flags.houseDataAvailable` (cờ hiệu lực, không đảo) | — | một nguồn | Shell → PlanetTable (cột Nhà), HouseTable |
| Hệ nhà | `vm.meta.houseSystem.labelVi` | `Badge` | lạ ⇒ nhãn gốc | HouseTable |
| Orb tối đa | **không có** | — | **contract gap** | — |

## 26. State Ownership Matrix

| State / Value | Category | Owner | M7 Behavior | S4.8 Handoff |
|---|---|---|---|---|
| `ChartViewModel` | derived (immutable) | `ChartDetailPage` (`useMemo`) | truyền xuống bằng prop | không đổi |
| `layout` (table/cards) | derived UI | `ChartViewerShell` (từ `useMediaQuery`) | prop xuống bảng | không đổi |
| `density` | user preference | `preferenceStore` (đọc) | selector ở Shell → prop | không đổi |
| `selectedKey` (planet/aspect) | UI selection | **không có chủ ở M7** (`undefined`) | bảng controlled; nút chỉ khi có `onSelect` | `ChartViewer` sở hữu `selection` duy nhất |
| `filterPlanetKey` | UI filter | không có chủ ở M7 | chip chỉ hiện khi parent cấp | dẫn xuất từ `selection` |
| `hoveredKey` | UI | — | **không có** | S4.8 |
| `houseDataAvailable` | derived | `vm.flags` | một nguồn | không đổi |
| Drawer/sidebar | UI | `uiStore` (không đổi) | — | — |

**Xác nhận:** M7 **không** thêm store, Context, Zustand slice hay event bus; không `useState` selection/filter trong bảng; không sao chép giá trị VM/preference vào state.

## 27. Responsive Matrix

| Component | Desktop | Tablet | Mobile |
|---|---|---|---|
| PlanetTable | `<table>` 5 cột (4 khi thiếu nhà) | như desktop | thẻ: tiêu đề `PlanetGlyph` + `dl` |
| HouseTable | bảng nhà + bảng góc | như desktop | thẻ nhà + thẻ góc |
| AspectTable | `<table>` 5 cột | như desktop | thẻ: A–Góc–B trên đầu; Orb, Trạng thái ở `dl` |
| Badges | glyph + chữ | như desktop | glyph + chữ (không ẩn chữ) |
| Chip lọc | trên bảng | như desktop | trên danh sách thẻ, xuống dòng được |
| Notice thiếu nhà | trong HouseTable | như desktop | như desktop |

## 28. Accessibility Matrix

| Component | Semantic Structure | Keyboard | Screen Reader | Automated Test |
|---|---|---|---|---|
| PlanetGlyph/SignGlyph | `span` + glyph `aria-hidden` + chữ | không tương tác | tên + "nghịch hành" | axe + assertion tên |
| HouseBadge | số `aria-hidden` + `sr-only` "Nhà thứ n" | không | "Nhà thứ 5" | axe + assertion |
| AspectBadge | glyph `aria-hidden` + chữ + `sr-only` tính chất | không | "Vuông chiếu, căng thẳng" | axe |
| PlanetTable | `caption`, `th scope col/row` | nút chọn: Tab/Enter/Space; `aria-pressed` | ô theo hàng/cột | axe + role queries |
| HouseTable | `caption`, 2 bảng, `Alert info` | — | notice dạng `status` | axe (cả hai trạng thái) |
| AspectTable | `caption`, `th scope` | nút chọn; chip là `button` | chip trong vùng `aria-live` | axe |
| Thẻ mobile | `ul role=list`/`li`/`dl` | nút chọn | tương đương bảng | axe |
| ChartViewerShell | `h1` (page) → `h2` mỗi section | thứ tự tab: nút chọn theo thứ tự DOM | một biểu diễn/DOM | axe (table + cards) |

Thủ công: NVDA/VoiceOver, tương phản, glyph đa nền tảng (Mục 18) — **không** thay bằng axe.

## 29. Test Matrix

Khung: Vitest + Testing Library + `vitest-axe`; **không thêm dependency**; fixtures `chartFull`/`chartNoHouses` qua `toChartViewModel`; `matchMedia` chỉ qua helper (Shell/hook), bảng dùng prop `layout`.

| Area | Unit | Component | Accessibility | Regression | Priority |
|---|---|---|---|---|---|
| `useMediaQuery` | **U1** true/false ban đầu · **U2** đổi `change` ⇒ cập nhật · **U3** unmount ⇒ `removeEventListener` đúng listener · **U4** đổi `query` ⇒ huỷ + đăng ký lại · **U5** không có `matchMedia` ⇒ `false` · **U6** helper phát sự kiện thật (không chỉ assert nội bộ) | — | — | test dùng `matchMedia` mặc định không đổi | Cao |
| Badges (nhóm B) | B1 tên cho 10 hành tinh · B2 `retrograde` ⇒ có chữ "nghịch hành" · B3 `!showLabel` ⇒ `role=img` + `aria-label` · B4 lạ ⇒ nhãn gốc, không glyph · B5 `SignGlyph` 12 cung, glyph có `\uFE0E` · B6 `HouseBadge` arabic/roman, "Nhà thứ n", ngoài miền · B7 `AspectBadge` 5 loại × tone, tone `unknown` · B8 glyph `aria-hidden` | ✓ | axe cho từng badge | — | Cao |
| PlanetTable (nhóm P) | — | P1 số hàng + **thứ tự** = VM · P2 sign/độ/nhà đúng (`degreeLabel`) · P3 `chartNoHouses` ⇒ **không** cột Nhà · P4 Retrograde: có chữ / "Không nghịch hành" · P5 `caption` + `scope col/row` · P6 nút chọn: tên "Chọn {tên}", `aria-pressed` theo `selectedKey`, phát `onSelect(key)`, phím Enter/Space · P7 không có `onSelect` ⇒ không có nút · P8 `layout="cards"` ⇒ **không** có `<table>`, đủ trường · P9 không nội dung tương tác trùng (một biểu diễn) · P10 `compact` ⇒ lớp padding · P11 `houseNumber=null` ⇒ `—` | axe table + cards + có nút | tên/glyph | Cao |
| HouseTable (nhóm H) | — | H1 12 hàng đúng thứ tự · H2 cusp/sign đúng · H3 caption/scope · H4 `houseDataAvailable=false` ⇒ **không** `<table>` nhà, hiện `unavailableContent`, không giá trị giả · H5 góc: 4 hàng đúng thứ tự khi `hasAngles` · H6 `hasAngles` vắng ⇒ không bảng góc · H7 chỉ góc, không nhà ⇒ bảng góc + notice · H8 cards · H9 Badge hệ nhà | axe có/không dữ liệu | — | Cao |
| AspectTable (nhóm A) | — | A1 số hàng/thứ tự (orb ↑) · A2 A/loại/B/orb/trạng thái đúng · A3 5 loại aspect có `AspectBadge` đúng · A4 "Đang tới gần"/"Đang rời xa" từ `isApplying` · A5 empty (`[]`) = `EmptyState`, không nhắc Cài đặt · A6 nút chọn (như P6) · A7 lọc: chỉ hàng có hành tinh đó, giữ thứ tự · A8 lọc không có hàng ⇒ thông báo riêng · A9 cards | axe + empty + filtered | — | Cao |
| Chip (nhóm F) | — | F1 nhãn "Đang lọc: Sao Kim ✕" · F2 `aria-label` "Xóa bộ lọc theo Sao Kim" · F3 Enter/Space/click ⇒ `onClear` đúng 1 lần · F4 không `onClear` ⇒ chữ thuần · F5 không đổi bảng khác (không đồng bộ) | axe | — | Trung bình |
| Shell (nhóm S) | — | S1 `matchMedia` ≥640 ⇒ 3 `<table>`, không thẻ · S2 <640 ⇒ thẻ, không `<table>` · S3 đổi viewport (`change`) ⇒ chuyển biểu diễn, **không** mất nội dung · S4 `chartNoHouses` ⇒ notice **một lần** trong HouseTable, cột Nhà ẩn, hành tinh còn đủ · S5 `densityMode=compact` (set store) ⇒ padding compact · S6 placeholder wheel còn (`testid`) · S7 chọn không được nối (không có nút) | axe ở cả 2 layout + thiếu nhà | test Shell/page cũ xanh | Cao |
| Regression (nhóm R) | — | R1 `ChartDetailPage` V1–V9 xanh · R2 M11 (danh sách → chi tiết) xanh · R3 `AppLayout`, router xanh · R4 `preferenceStore` test xanh · R5 toàn bộ suite: số test ≥ baseline + mới | — | toàn bộ | Cao |

## 30. Acceptance Criteria Traceability — UI Spec §49

**Giới hạn báo cáo:** "UI Spec §49" **không tồn tại**; nguồn AC thật = **F4 plan Mục 49 "Definition of Done"** (các dòng dưới) + yêu cầu chi tiết UI Spec §12.x. Mọi mục "Nguồn: prompt" là **tiêu chí tạm thời**.

| AC | Nguồn | Task | Kiểm bằng | Điều kiện đạt |
|---|---|---|---|---|
| AC-1 "Bảng: Planet/House (khi có dữ liệu)/Aspect Table ngữ nghĩa, hoạt động" | F4 plan Mục 49 | M7.3–M7.6 | P1–P5, H1–H3, A1–A3, S1 | ba bảng `<table>` thật hiển thị đúng dữ liệu VM |
| AC-P (Planet có Planet, Sign, Degree, House khi có, Rx) | prompt + UI §12.2 | M7.3 | P2–P4 | đủ cột; cột Nhà ẩn khi thiếu |
| AC-H (House có House, Cusp, Sign) | prompt + UI §12.3 | M7.4 | H1–H2 | đủ cột; không giá trị giả |
| AC-A (Aspect có A, Aspect, B, Orb, Applying/Separating) | prompt + UI §12.4 | M7.5 | A2–A4 | đủ cột |
| AC-SEM (caption, `scope`) | UI §12.2 + a11y | M7.3–M7.5 | P5, H3, A1 | `caption` + `scope="col"` + `scope="row"` |
| AC-MOB (thẻ mobile giữ đủ thông tin; không cuộn ngang) | F4 plan Mục 49 "Responsive" + UI §7.2 | M7.3–M7.6 | P8, H8, A9, S2 | cùng tập trường với bảng |
| AC-SEL (nút chọn truy cập + controlled) | prompt + F4 plan S4.7 | M7.3, M7.5 | P6, P7, A6 | `aria-pressed`, bàn phím, không state nội bộ |
| AC-MISS (thiếu nhà: giải thích rõ, không bịa; không phải lỗi tính) | F4 plan Mục 49 "Thiếu giờ sinh" | M7.4, M7.6 | H4, H7, S4 | khối giải thích một lần; hành tinh còn đủ; không `role=alert` |
| AC-CHIP (chip lọc đúng spec, không đồng bộ) | UI §12.4 + F4 plan mặc định | M7.5 | F1–F5 | chip hiển thị/xoá/phím đúng; không đồng bộ |
| AC-RESP (matchMedia test) | prompt | M7.1, M7.6 | U1–U6, S1–S3 | cả hai layout + đổi động |
| AC-AXE (vitest-axe) | prompt + F4 plan "A11y" | M7.2–M7.7 | axe ở Mục 29 | không vi phạm |
| AC-A11Y-MAN "kiểm thủ công đã ghi" | F4 plan Mục 49 "A11y" | M7.7 | checklist Mục 18 trong Evidence Matrix | có bản ghi |
| AC-NOCOLOR "thông tin không chỉ bằng màu" | F4 plan Mục 49 "A11y" | M7.2–M7.5 | B7, P4, A4 | mọi trạng thái có chữ |
| AC-KEY "phần tử tương tác dùng được bàn phím" | F4 plan Mục 49 "A11y" | M7.3, M7.5 | P6, F3 | Tab/Enter/Space |
| AC-RESP-DEV "desktop/tablet/mobile dùng được" | F4 plan Mục 49 "Responsive" | M7.6 | S1–S3 + thủ công | đã ghi |
| AC-INT (Viewer tích hợp, chức năng cũ còn) | prompt | M7.6 | R1–R3 | test cũ xanh |
| AC-Q (lint/typecheck/format/build; CI xanh; không dependency mới; không `dangerouslySetInnerHTML`; Evidence Matrix) | F4 plan Mục 49 "Chất lượng" | M7.7 | Mục 32 + grep | exit 0; CI xanh trên commit cuối |

## 31. Regression Strategy

| Vùng | Rủi ro | Kiểm |
|---|---|---|
| S4.2 ViewModel | không đổi | test `model/**` nguyên vẹn (100%) |
| `ChartViewerShell` | DOM đổi (notice chuyển, thẻ mặc định trong jsdom) | 4 test Shell cũ + thêm S1–S7; liệt kê assertion nào phải chỉnh |
| `ChartDetailPage` | V1–V9, L1–L4, S1–S7 | chạy lại, không xoá/nới |
| M11 danh sách | không đụng | `pages/app/charts/page.test.tsx`, `saved-charts-flow.integration.test.tsx`, E2E `chart-list.spec.ts` (CI) |
| Birth Profile | không đụng | `profiles/page.test.tsx`, `birth-profile.spec.ts` |
| Router/AppLayout | không đụng | router.test, AppLayout.test |
| `preferenceStore` | chỉ đọc | `preferenceStore.test.ts` |
| shared UI | không sửa | test `shared/ui/**` |
| responsive hiện có | `matchMedia` toàn cục | `setup.ts` không đổi; helper chỉ cục bộ + `restore()` |

Nguyên tắc: **không** xoá/nới test cũ; mọi thay đổi assertion cũ phải nêu lý do trong Evidence Matrix.

## 32. Quality Gates

Chỉ dùng lệnh có trong `frontend/package.json`:

| Lệnh | Mục đích | Khi chạy |
|---|---|---|
| `npx vitest run <đường dẫn>` | phản hồi nhanh theo task | mỗi bước |
| `npm run typecheck` | `tsc` app **và** node (gồm `e2e/`) | cuối **mỗi task** |
| `npm run lint` | ESLint | cuối mỗi task |
| `npm run format:check` | Prettier (`npm run format` để sửa) | cuối mỗi task |
| `npm test` | **toàn bộ** suite (`vitest run --passWithNoTests`) | M7.6 và M7.7 (lâu: có thể vượt giới hạn trong môi trường chậm — chạy ở máy owner/CI) |
| `npm run test:coverage` | CI dùng lệnh này | M7.7 |
| `npm run build` | `tsc` + `vite build` | M7.7 |
| `npm run test:e2e` | Playwright (cần Backend + Postgres) | CI; M7 không thêm spec |

Không có lệnh a11y riêng: `vitest-axe` chạy trong `npm test`. Các lệnh trên `npx vitest run <đường dẫn>` chỉ chạy tập con; toàn bộ là `npm test`.

```bash
cd frontend/src
grep -rnE "zustand|createContext|useReducer|create\(" features/chart/ui/{PlanetTable,HouseTable,AspectTable,ChartBadges}   # rỗng: không state toàn cục
grep -rnE "useState" features/chart/ui/{PlanetTable,HouseTable,AspectTable}                                                # rỗng: bảng controlled
grep -rnE "features/birth-profile|@pages|@app" features/chart                                                              # rỗng
grep -rnE "dangerouslySetInnerHTML|as unknown as|: any|eslint-disable" features/chart/ui shared/hooks/useMediaQuery.ts    # rỗng (mã production)
grep -rnE "matchMedia" features shared --include=*.tsx --include=*.ts | grep -v "\.test\."                                  # chỉ useMediaQuery.ts
```

## 33. Risks and Mitigations

| ID | Rủi ro | Bằng chứng | Mức | Tác động | Giảm thiểu | Phân loại / Chặn? |
|---|---|---|---|---|---|---|
| R-1 | `useMediaQuery` chưa có | Mục 3/5 | TB | không chạy bảng/thẻ | task M7.1 | Must resolve during M7 — không chặn khởi động |
| R-2 | Tham chiếu "UI Spec §49" sai | UI Spec chỉ §1–§25 | Thấp | AC mơ hồ | Mục 30 ánh xạ theo nguồn thật | Documentation gap |
| R-3 | Glyph không hiển thị trên mọi nền tảng | font Display không có ký hiệu; KG-M2-04 | TB | ô vuông "tofu" | tên bằng chữ luôn có; `\uFE0E`; kiểm thủ công đa nền tảng | Must resolve during M7 (kiểm thủ công) |
| R-4 | Trùng nội dung cho trình đọc màn hình | cả bảng và thẻ | TB | đọc hai lần | render một biểu diễn; test P9/S1/S2 | Must resolve during M7 |
| R-5 | Notice thiếu nhà bị nhân đôi hoặc nguồn thứ hai | `HouseDataNotice` đã ở Shell | TB | UX/a11y | slot + gỡ khỏi đầu Shell (D-M7-4) | Requires decision |
| R-6 | Nút chọn không nối đâu (inert) | S4.8 chưa có | TB | trải nghiệm đánh lừa | chỉ render khi có `onSelect` (D-M7-3) | Requires decision |
| R-7 | Tương phản tone (brass/indigo) | token CSS có; chưa đo | TB | khó đọc | tone chỉ viền/chấm; chữ `text-primary`; kiểm thủ công 2 theme | Must resolve during M7 |
| R-8 | Test cũ đổi hành vi vì `matchMedia=false` ⇒ thẻ | `setup.ts` | TB | test đỏ/ngầm sai | phân tích Mục 20; helper cục bộ; liệt kê assertion chỉnh | Must resolve during M7 |
| R-9 | `densityMode` chưa có UI đổi | grep consumer | Thấp | tính năng không tới được | vẫn consume (mặc định comfortable); ghi KG | Known Gap — defer |
| R-10 | Orb tối đa không có trong VM/API | §12.4 vs `AspectVM` | Thấp | thiếu thông tin spec | chỉ orb thực tế; ghi contract gap | Known Gap — Backend/Doc |
| R-11 | Empty state spec nhắc Cài đặt không tồn tại | nav "Cài đặt" là `<a href="/">` | Thấp | gợi ý sai | bỏ gợi ý | Documentation gap |
| R-12 | Suite chậm làm vượt timeout công cụ | lượt này | Thấp | thiếu bằng chứng cục bộ | chạy `npm test` ở máy owner/CI | Process |
| R-13 | Lệch phạm vi (wheel, ma trận, selection store) | prompt | TB | phình scope | Out of Scope + grep Mục 32 | Out of scope |
| R-14 | Thẻ mobile + nút chọn thiếu vùng chạm | spec | Thấp | khó bấm | nút ≥ 44px trong tiêu đề thẻ | Must resolve during M7 |
| R-15 | Dữ liệu VM hỏng (trùng key, `degreeLabel=null`) | M2 `issues` | Thấp | React key trùng | key `${key}#${index}`; `—` fallback | Must resolve during M7 |

## 34. Known Gaps / Technical Debt and Decision Record

**Quyết định kỹ thuật (F4-M7.0) — Đã được Owner phê duyệt và chốt phương án:**

| ID | Quyết định | Nội dung thực thi & Rationale | Trạng thái |
|---|---|---|:---:|
| D-M7-1 | Breakpoint bảng/thẻ = `(min-width: 640px)` (Tailwind `sm`); tablet dùng bảng | Áp dụng (F4 plan + UI §7.2) | VERIFIED |
| D-M7-2 | Shell gọi `useMediaQuery` **một lần** và truyền `layout`; bảng không tự gọi hook | Áp dụng (một subscription, bảng thuần presentation) | VERIFIED |
| D-M7-3 | Nút chọn **chỉ render khi có `onSelect`**; Shell M7 không truyền ⇒ chưa có nút trong app | **Đã duyệt (Đồng ý):** Thiết kế controlled component hợp lý. Khi có `onSelect`: render nút chọn kèm accessible name, `aria-pressed`, phím Space/Enter. Khi không có `onSelect`: chỉ hiển thị dữ liệu, không render nút vô tác dụng. Không tạo local selection state giả lập. Test cả 2 trường hợp. | APPROVED |
| D-M7-4 | `HouseDataNotice` chuyển vào `HouseTable` (slot `unavailableContent`), Shell không render ở đầu | **Đã duyệt (Đồng ý):** Thông báo đặt cạnh nội dung bị ảnh hưởng. Khi `houseDataAvailable === false`: ẩn bảng 12 nhà, hiển thị notice trong khu vực HouseTable. Không hiển thị cusp mặc định; không biến thành calculation error. Không giả định mất góc chỉ vì thiếu nhà. | APPROVED |
| D-M7-5 | Bảng góc ASC/MC/DSC/IC nằm trong `HouseTable` (UI §12.3) | **Đã duyệt & Xác minh:** Cấu trúc logic gồm `HouseDataNotice` (khi cần), Bảng nhà (khi có dữ liệu) và Bảng góc (khi `hasAngles`). **Đã xác minh qua API/VM:** 4 góc ASC/MC/DSC/IC do backend trả về ở `data.angles` và VM đưa vào `vm.angles`; hiển thị độc lập khi `hasAngles === true`; FE **không tự suy ra DSC từ ASC hoặc IC từ MC**. | APPROVED |
| D-M7-6 | `densityMode` đọc từ `preferenceStore`; `numeralStyle` mặc định arabic; `showOptionalBodies`/`showElement`/`showCategory` ngoài phạm vi | Áp dụng | VERIFIED |
| D-M7-7 | Chip lọc = `AspectFilterChip` (UI §12.4); không có chip khác | Áp dụng | VERIFIED |
| D-M7-8 | Tone aspect = viền/chấm màu + chữ `sr-only`; chữ giữ `text-primary` | Áp dụng (kiểm thủ công độ tương phản) | VERIFIED |

**Known Gap / Documentation / Backend:**

| ID | Vấn đề | Phân loại |
|---|---|---|
| KG-M7-01 | Không có "orb tối đa" trong VM/Backend (spec §12.4) | Known Gap — Backend/spec |
| KG-M7-02 | Bộ lọc/selection không tới được người dùng trước S4.8; nút chọn và chip chưa hiện trong app | Known Gap — S4.8 |
| KG-M7-03 | `densityMode` không có UI đổi; `locale` chưa dùng | Known Gap — defer |
| KG-M7-04 | Ma trận aspect/`grid` chưa làm | Out of scope |
| KG-M7-05 | Nguyên tố cung (`showElement`) và nhóm nhà (`showCategory`) chưa có | Known Gap — KG-M2-02 |
| KG-M7-06 | Glyph đa nền tảng chưa kiểm (KG-M2-04) | Must resolve during M7 (thủ công) |
| KG-M7-07 | Skip link "Chuyển tới bảng dữ liệu" (F4 plan §29) chưa làm | Known Gap — S4.9 |
| KG-M7-08 | E2E chưa assert bảng (S4.10) | Known Gap — S4.10 |
| KG-M7-09 | `Table` không phải primitive dùng chung (markup nhân ở 3 bảng nhưng dùng `tableStyles.ts`) | Known Gap — defer |
| DOC-M7-01 | "UI Spec §49" không tồn tại; AC Tables = một dòng ở F4 plan Mục 49 | Documentation Gap |
| DOC-M7-02 | UI Spec §12.4 empty state nhắc Cài đặt; §12.2 nêu độ có giây (M2 chốt không giây) | Documentation Gap |

## 35. Definition of Done

```text
M7.0 chốt → M7.1 useMediaQuery + helper ┐
            M7.2 Badges ─► M7.3 Planet ┤
                           M7.4 House  ├─► M7.6 ghép Shell ─► M7.7 axe + responsive + hồi quy
                           M7.5 Aspect ┘
→ mọi cổng xanh, CI Frontend xanh trên commit cuối → checklist đọc màn hình ghi lại
→ Evidence Matrix M7 → xoá blueprint → M7 đóng
```

Đồng thời: `git diff --stat` chỉ gồm file ở Mục 23; **không** dependency mới; không store/Context mới; `setup.ts` không đổi; test cũ không bị xoá/nới; Backend không đổi.

## 36. Final Architect Review

| Hạng mục | Đánh giá |
|---|---|
| Roadmap | Giữ nguyên v1.1/O-F4-2 B và thứ tự S4.2 → S4.3 → M11 → M7; không đổi ID |
| Tiền đề | S4.2, S4.3, M11 VERIFIED; `useMediaQuery` **chưa có** ⇒ M7.1 (bounded) |
| Ngữ nghĩa | `<table>`/`caption`/`scope`; thẻ bằng `ul/li/dl`; một biểu diễn/DOM |
| Responsive | `sm` 640, bảng cho tablet, thẻ cho mobile; không cuộn ngang |
| State | Không store mới; bảng controlled; `density` từ store sẵn có |
| Tương thích S4.8 | khoá `PlanetKey`/`AspectKey`, `selectedKey`/`onSelect`/`filterPlanetKey`/`onClearFilter` định nghĩa rõ; không đồng bộ sớm |
| Thiếu nhà | trung thực: không bịa nhà/cusp; không phải lỗi tính; một nguồn cờ; một khối giải thích |
| Test | badges, ba bảng, chip, Shell, hook; helper `matchMedia` điều khiển được; `vitest-axe` đại diện; thủ công ghi lại |
| Phạm vi | wheel, ma trận, selection store, diễn giải đều bị loại |
| Điểm yếu cần lưu ý | AC thật của "§49" chỉ một dòng (đã ánh xạ sang yêu cầu §12); nút chọn/chip chưa tới được người dùng trước S4.8 |
| **Readiness** | **`READY FOR IMPLEMENTATION`** |

## 37. Final Recommendation

**`READY FOR IMPLEMENTATION`**

Toàn bộ các quyết định kỹ thuật F4-M7.0 (`D-M7-3`, `D-M7-4`, `D-M7-5`) đã được Owner phê duyệt và các điều kiện kỹ thuật đã được xác minh trên mã nguồn:
1. **D-M7-3** — Nút chọn chỉ render khi parent truyền `onSelect` (tránh nút inert trong app ở M7).
2. **D-M7-4** — Chuyển `HouseDataNotice` vào `HouseTable` (slot `unavailableContent`), hiển thị cạnh nội dung bị ảnh hưởng.
3. **D-M7-5** — Bảng góc ASC/MC/DSC/IC thuộc khu vực `HouseTable`, hiển thị khi `hasAngles === true`. Đã xác minh dữ liệu góc đến từ API/VM, FE không tự suy diễn góc đối đỉnh.

Thứ tự thực hiện: **M7.0 (Đã chốt) → M7.1 (`useMediaQuery` + helper) ∥ M7.2 (ChartBadges + styles) → M7.3 (PlanetTable) ∥ M7.4 (HouseTable) ∥ M7.5 (AspectTable) → M7.6 (Ghép Shell) → M7.7 (Quality Gates + Evidence Matrix)**. Mỗi task kết thúc bằng `typecheck` + `lint` + `format:check` + test liên quan và CI sạch trước khi commit.
