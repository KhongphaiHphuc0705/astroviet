# Sprint F5 — M3: Static Interpretation Panel — Implementation Plan

| | |
|---|---|
| **Trạng thái** | **M3.0–M3.1 PREPARED FOR OWNER REVIEW** — baseline đã kiểm tra; component UI M3.2+ chưa triển khai |
| **Ngày** | 2026-11-01 |
| **Baseline audit** | `dev` @ `c6b422e` ("[docs] update m2 evidence matrix"); cây làm việc sạch; M2 fix `d4961a6` đã vào, Frontend CI #304 (`41277768026`) **success** |
| **Vị trí** | `docs/implementation/Sprint_F5_M3_Implementation_Plan.md` (theo quy ước M1/M2: plan milestone là bản thảo tạm, xoá khi đóng; chỉ lưu Evidence Matrix) |
| **Nhãn** | **[Verified]** có bằng chứng repo/lệnh · **[Proposal]** đề xuất chờ duyệt · **[Owner]** cần owner quyết · **[Open]** chưa xác minh được |

> Kế hoạch, không phải bằng chứng hoàn thành. Không có ảnh chụp, test hay số liệu M3 nào tồn tại ở thời điểm này; mọi tên file ảnh/test bên dưới là **kế hoạch**.

---

## 1. Executive Summary

**M3 giao gì [Proposal].** Một khu vực "Diễn giải" **tĩnh** trong Chart Viewer, gồm ba component trình bày thuần (`InterpretationPanel`, `InterpretationOverview`, `InterpretationItem`) nhận `InterpretationModel` đã dựng ở M2 cùng nhãn hiển thị từ `ChartViewModel`, hiển thị các trạng thái trong **F5 Implementation Plan §7.6** và đáp ứng AC-01…03, 11, 12, 17…23 — **không** động tới selection.

**Đường tích hợp nhỏ nhất [Verified từ mã].**
`useChartQuery` → `page.tsx` (memo `mapping` đã có `toChartViewModel`) → thêm `buildInterpretationModel(query.data, vm)` vào cùng memo → prop **tuỳ chọn** `interpretation` của `ChartViewerShell` → `<InterpretationPanel>` render **sau** lưới hai cột F4 (toàn chiều rộng, quyết định P-01). Prop tuỳ chọn khiến `ChartViewerShell.test.tsx` (F4) không bị ảnh hưởng.

**Bằng chứng rủi ro hồi quy F4 [Verified bằng thử nghiệm cô lập].** Trên bản sao `/tmp` tôi nối một panel *giả* (h2 + h3 + nút `aria-expanded` có tên hành tinh, đoạn văn, `role="status"`) vào Shell và `page.tsx`: **9 file / 127 test** (Shell, trang chi tiết, hai integration flow, router) vẫn **xanh**. Đây là bằng chứng về *hình dạng DOM an toàn*, không thay cho việc chạy lại bộ F4 sau triển khai thật.

**Blocker.** Không có blocker kỹ thuật cho việc duyệt plan. Review M3.1 đã chốt C-01…C-07 và C-09…C-13; chỉ C-08 disclaimer còn pending Owner vì PRD vẫn Draft, và sẽ không được đưa vào giao diện trước khi duyệt. Phát hiện cần lưu ý: **§7.6 không định nghĩa trạng thái "tất cả nội dung thiếu do lỗi dữ liệu"** mà M2 có thể sinh ra (S-08, Mục 6, O-3).

**Phạm vi file [Proposal].** Tạo 5 file mã trong `ui/InterpretationPanel/` + 6 file test; sửa 3 file (`ChartViewerShell.tsx`, `page.tsx`, `features/chart/index.ts`); không đụng `selection.ts`, `chartViewModel.ts`, các bảng F4, Backend, cấu hình, dependency, version.

---

## 2. Verified Current-State Audit

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Git | `dev` @ `c6b422e`, sạch, đồng bộ `origin/dev` | `git status -sb`, `git log` |
| Lịch sử gần | M2: `5a87433`, `76d85c3`, `9282ed6`, `8dba74f`; fix `d4961a6`; matrix `c6b422e` | `git log c95e667..HEAD` |
| CI | #303 (M2, `9282ed6`) và **#304 (fix `d4961a6`)** success, 1 cảnh báo Node 20 (KG-CI-NODE20); log từng bước cần đăng nhập nên không đọc được | trang run (đăng xuất) |
| Hướng dẫn dự án | không có `AGENTS.md`/`CLAUDE.md` tìm thấy trong repo; quy ước nằm ở `docs/implementation/*` | tìm trong cây repo |
| Stack test | Vitest 4.1.10 + RTL + `vitest-axe` (`setup.ts` mở rộng matcher; dùng ở `Switch.test.tsx`, `Label.test.tsx`) + MSW + Playwright 38 E2E | `package.json`, `setup.ts`, grep |
| Scripts | `lint`, `format:check`, `typecheck`, `test`, `test:coverage`, `build`, `test:e2e` | `frontend/package.json`, `frontend-ci.yml` |
| Quality gates CI | `format:check → lint → typecheck → test:coverage → build →` (backend) `→ test:e2e`; không có bước kiến trúc/a11y riêng; `boundaries/element-types` đang `off` (nợ F4) | `frontend-ci.yml`, `eslint.config.js` |
| Baseline test | M2 Matrix: 132 file / 1086 case / 38 E2E; sau fix `d4961a6` M2 có **38** test trong 2 file (đã chạy lại: 38 pass, coverage `interpretation.ts` 100% dòng/hàm, 95.12% nhánh) ⇒ baseline kỳ vọng **132 file / 1087 case** `[C-run một phần; đo lại ở M3.0]` | M2 Matrix; lệnh vitest |
| Pages/Shell | `ChartDetailPage` render `ChartViewerShell key={chartId} vm={…}`; Shell nhận `{vm, className}` | `page.tsx`, `ChartViewerShell.tsx` |
| Thư mục bằng chứng | **`docs/implementation/archive/sprint-f4/evidence/`** (35 file phẳng: `m6_*.png`, `m8_*.png`, `m10_*.png`, `fixture_full.json`, `fixture_nohouse.json`); sprint-f5 **chưa có** thư mục `evidence/` (M1/M2 không cần ảnh) | `ls` |
| Cách chụp ảnh F4 | **Thủ công bởi owner** (Windows 11, Chrome 155, bản build thật) — không có script chụp trong repo; Playwright chỉ `screenshot: "only-on-failure"`; không có MSW service worker cho trình duyệt | Matrix F4 M10 (Q1–Q12), `playwright.config.ts`, `grep` |

### 2.1 "Section 7.6" và các AC — nguồn thẩm quyền [Verified]
- **Section 7.6 = `docs/implementation/Sprint_F5_Implementation_Plan.md` §7.6 "Ma trận trạng thái"** (7 hàng). *Không* phải `Frontend_UI_Specification.md` §7 (đó là "Responsive Breakpoints"; §12.6 "Interpretation Card" của spec mâu thuẫn hợp đồng thật và sẽ được đính chính ở M8 — F5 plan A-2).
- AC-01…03, 11, 12, 17…23: **F5 plan §17** (đã trích nguyên văn ở Mục 5). AC-13…16 (đồng bộ chọn) thuộc M4, **không** nằm trong M3.
- Copy chú thích Nhà/disclaimer: F5 plan §7.6 (đoạn "Copy đề xuất, **chưa được ghi nhận là Owner duyệt**"); PRD còn Draft.
- Quyết định đã chốt áp dụng: D-F5-01…09, P-01…P-06 (F5 plan §15), J-1…J-15 của M2.

### 2.2 Mâu thuẫn / khoảng trống phát hiện khi audit

| ID | Phát hiện | Xử lý trong plan |
|---|---|---|
| X-1 | Prompt gọi thư mục ảnh `evidence/f5-m3/…`; repo dùng `docs/implementation/archive/sprint-f{N}/evidence/` **phẳng** với tên `m{N}_*.png` | Dùng quy ước repo: `docs/implementation/archive/sprint-f5/evidence/m3_*.png` (O-5) |
| X-2 | Prompt dùng tên `Overview`/`Item`; F5 plan §9 dùng `InterpretationOverview`/`InterpretationItem` | Dùng tên F5 plan (tiền tố `Interpretation` tránh va chạm tên) |
| X-3 | F5 plan §7.6 không có hàng cho *"không có phần nào khả dụng do dữ liệu lỗi"*, trong khi M2 trả `status:"unavailable"` cả cho `[]`+version hợp lệ lẫn danh sách không phải mảng | Thêm S-08 (tối thiểu) — O-3 |
| X-4 | AC-20/AC-21 yêu cầu `reportError`, nhưng Panel là presentational | `reportError` đặt ở `page.tsx` (một effect gộp), Mục 9–10 |
| X-5 | F4 `HouseDataNotice` (trong `HouseTable`) ghi "điều này cần giờ sinh" — suy luận giờ sinh từ `isHouseDataAvailable=false` | Ngoài phạm vi M3 (không đổi F4); panel **không** lặp lại; ghi Known Gap (O-8) |
| X-6 | Khi thiếu Nhà, trang sẽ có hai thông báo (F4 Alert ở HouseTable + chú thích của panel) | Chấp nhận, nội dung khác nhau và đặt ở hai khu vực khác nhau (O-10) |
| X-7 | `page.tsx` import từ barrel `@features/chart`; M2 cố ý chưa export `buildInterpretationModel` (J-14) | Thêm export vào `features/chart/index.ts` (J-14 → quyết định ở đây) |

---

## 3. M2 Completion and Dependency Assessment

M2 **đã hoàn tất và được xác minh** (CI #303 và #304 xanh; tôi chạy lại: 38 test pass, coverage dòng 100%, `typecheck` exit 0 sau fix). Không cần làm lại việc M2.

| Artifact / quyết định M2 | Trạng thái xác minh | Phụ thuộc của M3 | Hành động | Bằng chứng |
|---|---|---|---|---|
| `buildInterpretationModel(dto, vm)` | tồn tại, tổng quát (không ném lỗi với dữ liệu rác — U-10/U-18/U-22) | `page.tsx` gọi một lần cho mỗi `query.data` | Gọi trong memo `mapping` | `model/interpretation.ts`, U-18 |
| `InterpretationModel` (`status`, `items`, `groups`, `itemsById`, `availableCount`, `houseDataAvailable`, `issues`, `version`) | đóng băng (`Object.freeze`), JSON-serializable | Props của Panel | Dùng nguyên, không sao chép state | `interpretation.ts` |
| `groups` (`core`: Sun, Moon, Ascendant; `planets`: Mercury…Pluto), chỉ nhóm có ≥ 1 item | Verified (U-04, U-19) | Điều hướng Overview; AC-11 | Dựng nav từ `model.groups`, không tự suy | `interpretation.test.ts` |
| `InterpretationPart` (`available/missing/ambiguous/unavailable` + lý do) | Verified | Quy tắc hiển thị Item (Mục 7.3) | Ánh xạ mỗi trạng thái → UI, không bịa nội dung | D.2 |
| `issues` `{code, category: degraded|defect, subject, count}` | Verified; `subject` chỉ để chẩn đoán | `reportError` (defect) và quyết định hiển thị (`CONTENT_NOT_PUBLISHED`, `HOUSE_DATA_UNAVAILABLE`) | `category` quyết định có báo lỗi không; **không** render `subject` | U-26, M2 plan D.3 |
| Sau fix `d4961a6`: "chưa phát hành" chỉ khi `interpretationVersion===null` **và** là mảng rỗng; `undefined`/kiểu sai ⇒ `VERSION_INVALID` | Verified (diff + 38 test pass) | S-03 chỉ được hiển thị cho trường hợp đúng | Panel phân biệt S-03 / S-08 bằng `issues` | commit `d4961a6` |
| Không có issue về giờ sinh (U-26) | Verified | AC-18 | Giữ; thêm test copy | U-26 |
| `bodyText` nguyên văn (U-25) | Verified | AC-23 | Render bằng text node | U-25 |
| `getInterpretationItemId(planetKey)` (map cả `"Ascendant"`) | tồn tại | **Chưa dùng ở M3** (M4) | Không dùng | `interpretation.ts` |
| KG-F5M2-01 (version null + có mục) | mở, mô tả đúng | Không chặn | Giữ nguyên | M2 Matrix |
| Contract test 252 khoá + purity | xanh | Không đổi | Không đụng | `interpretation.contract.test.ts` |

**Kết luận phụ thuộc:** M3 chỉ *tiêu thụ* M2; không cần sửa `interpretation.ts`. Nếu phát hiện thiếu trường lúc triển khai, dừng và báo owner (không tự sửa M2).

---

## 4. Scope and Explicit Out-of-Scope

**Trong phạm vi.** `InterpretationPanel`, `InterpretationOverview`, `InterpretationItem` (disclosure có kiểm soát); kết nối qua `page.tsx` + `ChartViewerShell` + `features/chart/index.ts`; các trạng thái S-01…S-08; module copy tĩnh; `reportError` gộp cho dữ liệu lỗi; test component/tích hợp; ảnh minh chứng; Evidence Matrix M3.

**Ngoài phạm vi (giữ nguyên prompt + F5 plan).** Đồng bộ chọn (AC-13…16, M4); lọc/chuyển diễn giải theo chọn; **không** state chọn mới; nút "Xem trên biểu đồ", liên kết "Đọc diễn giải" ở `SelectionDetail` (M4); chú thích độ bất định giờ sinh/Mặt Trăng (KG-F5-01); diễn giải góc chiếu/Nhà độc lập/tổng hợp; sửa Backend/API/nội dung/dependency; sửa `HouseDataNotice` của F4; sửa UI Specification §12.6, CHANGELOG, version (M8); mở rộng E2E (M7); responsive/a11y hardening sâu (M6 — M3 chỉ làm nền và xác minh tối thiểu).

---

## 5. Acceptance Criteria Traceability

Nguyên văn AC lấy từ F5 plan §17 [Verified]. "Phần M3" = phần hoàn tất ở M3; "còn lại" = milestone khác.

| AC | Yêu cầu (nguyên văn tóm lược) | Phần M3 | Vị trí cài đặt | Cách xác minh | Bằng chứng kỳ vọng | Phụ thuộc / còn lại |
|---|---|---|---|---|---|---|
| **AC-01** | Chart có diễn giải: Overview hiện số mục **đúng bằng** số mục hợp lệ của model | **Đầy đủ** | `InterpretationOverview` nhận `availableCount={model.availableCount}` | OV-01 (21 với `chartFull`, 10 với `chartNoHouses`, bằng đúng `availableCount`); PN-01 | test + `m3_s02_full_desktop_1500.png` | M2 `availableCount` |
| **AC-02** | Overview có liên kết nhảy tới từng nhóm; mỗi liên kết đưa **focus** đúng đích | **Đầy đủ** (không dính selection) | Overview `<nav>`+`<a href="#…">`; Panel xử lý `onClick` → `preventDefault` + `focus()` tiêu đề nhóm (`tabIndex={-1}`) | OV-03, PN-05 (jsdom không tự focus khi đổi hash ⇒ test kiểm `document.activeElement`); thủ công bàn phím | test + `m3_overview_link_focus.png` | P-03: chỉ cuộn/focus khi người dùng bấm liên kết |
| **AC-03** | Overview ghi rõ chưa có diễn giải góc chiếu/tổng hợp; **không** có nội dung tổng hợp tính cách | **Đầy đủ** | câu tĩnh C-07 trong Overview | OV-04 (có câu; không có thêm đoạn nào ngoài danh sách đã định) | test + ảnh S-02 | copy O-1 |
| **AC-11** | Không có nhóm rỗng trong điều hướng | **Đầy đủ** | nav dựng từ `model.groups` | OV-05, PN-04 (VM không hành tinh ⇒ chỉ nhóm `core` có Ascendant, không có link nhóm `planets`) | test | M2 AC-11 |
| **AC-12** | Mục mở/đóng bằng chuột **và bàn phím**; `aria-expanded` phản ánh đúng; **cho phép mở nhiều mục** | **Đầy đủ** | `InterpretationItem` (button), state `expandedIds` ở Panel | IT-01…IT-06, PN-03 | test + `m3_item_collapsed.png`/`m3_item_expanded.png` | disclosure có kiểm soát để M4 ép mở mục được chọn |
| **AC-17** | `isHouseDataAvailable=false`: có `PlanetInSign`, không `PlanetInHouse`, Cung Mọc "chưa khả dụng", **một** chú thích trung tính, chart không lỗi | **Đầy đủ ở mức UI/test**; xác nhận trên Backend thật là M7 | Panel/Overview/Item (S-05) | PN-07, IT-08, OV-06; thủ công với hồ sơ không giờ sinh thật | test + `m3_s05_no_house.png` | E2E real: M7 |
| **AC-18** | Không có suy luận giờ sinh/độ chắc chắn Mặt Trăng; KG-F5-01 ghi registry | **Đầy đủ** (panel) ; registry khi đóng | copy trung tính; không đọc `isBirthTimeKnown` | PN-08 (regex `/giờ sinh|birth/i` không khớp trong mọi trạng thái); Known Gap KG-F5-01 trong Matrix | test + Matrix | F4 `HouseDataNotice` nằm ngoài (X-5) |
| **AC-19** | `interpretations=[]`/`version=null` ⇒ "chưa phát hành", viewer F4 nguyên vẹn | **Đầy đủ** | Panel: `status==="unavailable"` + issue `CONTENT_NOT_PUBLISHED` ⇒ `Alert` info (S-03) | PN-06; SH-02 (viewer vẫn có đủ bảng) | test + `m3_s03_unpublished.png` | sau fix M2 chỉ đúng case |
| **AC-20** | Thiếu một mục ⇒ "Chưa có nội dung cho mục này" + `reportError` **đúng một lần** | **Đầy đủ** | Item (dòng C-10); `page.tsx` effect gộp | IT-07, PG-03 (một lần cho cả lô issue; không lặp khi re-render) | test + `m3_s04_partial_missing.png` | quy ước "một lần" = một lần mỗi lần tải dữ liệu (O-4) |
| **AC-21** | Entry hỏng/`language≠vi`/trùng khoá bị loại, không crash, **không render** | **Đầy đủ** | model (M2) loại; UI không có đường render | PN-09, PG-04 (V5-kiểu: `interpretations:null`, mục hỏng) | test + `m3_s06_malformed_clean_ui.png` + `m3_s06_console_report.png` | — |
| **AC-22** | Lỗi API chart đi qua luồng lỗi F4 (không bị nuốt thành "rỗng thành công") | **Đầy đủ ở mức trang** | `page.tsx` không đổi luồng lỗi; Panel chỉ render khi `viewKind==="ready"` | PG-05 (500/404/connection: không có panel, không có "chưa phát hành"); test F4 hiện có giữ nguyên | test + `m3_s07_api_error.png` | E2E thật M7 |
| **AC-23** | Nội dung chỉ render dạng text; grep không có `dangerouslySetInnerHTML`; **không** văn bản diễn giải hardcode trong component | **Đầy đủ** | text node; 3 file component **chỉ ASCII** (mọi chuỗi tiếng Việt ở `interpretationCopy.ts`) | AR-01…AR-04 (đọc nguồn bằng `fs`, mẫu M2), IT-10 (`<b>x</b>` hiển thị nguyên văn) | test + grep | copy được owner duyệt (O-1) |

**Không xung đột với "không đồng bộ chọn":** không AC nào trong danh sách M3 yêu cầu selection. AC-02 là điều hướng trong panel (focus), không phải selection. **Không** đổi AC nào.

---

## 6. Section 7.6 State Inventory and Traceability

Nguồn: F5 plan §7.6 (7 hàng) + một hàng bổ sung có lý do (S-08). "Chủ" = nơi quyết định trạng thái.

| ID | Trạng thái | Yêu cầu §7.6 (nguyên văn tóm lược) | Điều kiện kích hoạt | Hành vi UI | Dữ liệu/props | Chủ | Test | Ảnh (kế hoạch) |
|---|---|---|---|---|---|---|---|---|
| **S-01** | Loading chart | "Skeleton F4 hiện có (không thêm request)" | `query.isLoading` | `ChartViewerSkeleton` như F4; **không** có panel | — | `page.tsx` (F4, **không đổi**) | PG-06 (loading: không có panel/`status`; test F4 skeleton giữ nguyên) | dùng ảnh F4 `m10_*` nếu cần (không chụp mới) |
| **S-02** | Có đầy đủ | "Overview + 2 nhóm" | `status==="ready"`, nhà khả dụng | `h2` Diễn giải → Overview → nhóm Cốt lõi (3 mục, mở sẵn) → nhóm Các hành tinh (8 mục, đóng) | `model`, `vm.planets/angles` | `InterpretationPanel` | PN-01, PN-02 | `m3_s02_full_desktop_1500.png`, `m3_s02_full_tablet_768.png`, `m3_s02_full_mobile_375.png`, `m3_s02_reflow_320.png`, `m3_theme_light.png` |
| **S-03** | `version=null` / mảng rỗng | "Một `Alert` info 'Nội dung diễn giải chưa được phát hành'; viewer vẫn dùng bình thường" | `status==="unavailable"` **và** issue `CONTENT_NOT_PUBLISHED` | `h2` + `Alert variant="info"` (role `status`); **không** Overview/nhóm/mục | `model.issues` | Panel | PN-06, SH-02 | `m3_s03_unpublished.png` |
| **S-04** | Một phần (thiếu mục) | "Mục thiếu có dòng 'Chưa có nội dung cho mục này'; các mục khác bình thường" | có `part.state` `missing`/`ambiguous` | dòng C-10 trong khối tương ứng của Item; mục khác bình thường | `part` | `InterpretationItem` | IT-07, PN-07b | `m3_s04_partial_missing.png` |
| **S-05** | Thiếu Nhà | "Chú thích trung tính (một lần, ở Overview) + 'Theo nhà' ẩn; Cung Mọc 'chưa khả dụng'" | `model.houseDataAvailable===false` | chú thích C-06 **một lần** ở Overview; khối "Theo nhà" **không render**; Ascendant: C-11 | `model.houseDataAvailable`, `part.reason` | Overview (chú thích), Item (ẩn/C-11) | OV-06, IT-08, PN-07 | `m3_s05_no_house.png` (Backend thật, hồ sơ bỏ chọn giờ sinh) |
| **S-06** | Entry hỏng | "Loại bỏ + `reportError`; không thông báo kỹ thuật cho người dùng" | issues `defect` (malformed/unsupported/language/duplicate/not-applicable…) | **không có UI**; một lần `reportError` gộp | `model.issues` | `page.tsx` (effect) | PG-03, PG-04, PN-09 | `m3_s06_malformed_clean_ui.png` + `m3_s06_console_report.png` |
| **S-07** | Lỗi API | "Luồng lỗi chart F4 (không có lỗi diễn giải riêng)" | `viewKind` ≠ `ready` | EmptyState F4; không panel | — | `page.tsx` (F4, **không đổi**) | PG-05; test F4 hiện có | `m3_s07_api_error.png` |
| **S-08** *(bổ sung, cần O-3)* | Không phần nào khả dụng do **lỗi dữ liệu** (không phải "chưa phát hành") | **Không có trong §7.6** | `status==="unavailable"` và **không** có `CONTENT_NOT_PUBLISHED` (vd. version `"1.0"` + `[]`, `interpretations` không phải mảng, mọi mục bị loại) | `h2` + `Alert variant="info"` trung tính (C-12), không Overview/mục, **không** dùng câu "chưa phát hành"; `reportError` vẫn chạy (defect) | `model.status`, `model.issues` | Panel | PN-06b | `m3_s08_unavailable_generic.png` |

**Lý do cần S-08:** M2 (đã duyệt) có thể trả `status="unavailable"` khi *dữ liệu lỗi*; gộp vào S-03 sẽ nói sai ("chưa phát hành") — vi phạm P-05 ("chưa phát hành" chỉ dùng đúng trường hợp). Nếu owner không muốn thêm trạng thái, phương án thay thế: hiển thị các mục ở dạng C-10 (không Alert) — nhưng sẽ hiện 11 mục rỗng. Khuyến nghị: S-08.

**Ranh giới trạng thái:** loading/lỗi API/dữ liệu VM không hợp lệ do `page.tsx` (F4) quyết định và **panel không được render**; panel chỉ quyết định S-02…S-05, S-08 từ `model`; S-06 là hiệu ứng phụ (báo lỗi) ở `page.tsx`. Không trạng thái nào được xử lý ở hai tầng.

---

## 7. Component Contracts and Responsibilities

Quy ước áp dụng [Verified: `Frontend_Coding_Standards.md` §3–§5, §11, §13; UI Spec §23.3]: function component + `interface XProps`; destructure ở tham số; **props phẳng** (không truyền nguyên object rồi đào sâu, trừ object miền đã định nghĩa như `InterpretationModel`); mỗi file 1 export chính, < 200 dòng (tín hiệu tách); token Tailwind (không màu/spacing tự do); `getByRole` ưu tiên; tên test `should … when …`; mỗi component mới trong `ui/` phải có **≥ 1 Component Test + 1 Accessibility Test (`vitest-axe`)**.

Thư mục [Proposal, đường dẫn mới]: `frontend/src/features/chart/ui/InterpretationPanel/` (theo mẫu `ui/<Component>/{Component.tsx, Component.test.tsx, index.ts}` đang dùng ở F4).

### 7.1 `InterpretationPanel` (`InterpretationPanel.tsx`)
**Trách nhiệm:** dựng khu vực đọc từ `model`: khung `<section>` có tên, tiêu đề `h2`, chọn nhánh hiển thị theo `model.status`/`issues` (S-02…S-05, S-03, S-08), dựng danh sách link điều hướng từ `model.groups`, **sở hữu state mở/đóng** (`expandedIds`) và xử lý focus khi bấm link nhóm.
**Không làm:** không gọi API, không tính chiêm tinh, không sinh/viết lại nội dung, không đọc/ghi selection, không `reportError`, không biết `ChartResponse`, không render `issues.subject`.

```ts
export interface InterpretationPanelProps {
  model: InterpretationModel;          // M2 — nguồn duy nhất của nội dung & trạng thái
  planets: readonly PlanetVM[];        // chỉ để lấy nhãn: nameVi, glyph, sign (known/labelVi), houseNumber, key
  angles: readonly AngleVM[];          // chỉ để lấy nhãn Cung Mọc (key === "Ascendant"): labelVi, sign
  className?: string;
}
```
- **State nội bộ:** `expandedIds: ReadonlySet<InterpretationItemId>` khởi tạo lười = các item của nhóm `core` (P-06); `toggle(id)` thêm/bớt, **cho phép nhiều mục mở**; refs tới tiêu đề nhóm. Không `useEffect` đồng bộ từ props (không reset khi `model` đổi cùng chart; Shell đã `key={chartId}`).
- **Nhãn hiển thị** dựng bằng một hàm nội bộ thuần (`resolveItemDisplay`) — tra `planets`/`angles` theo `item.subject`; hành tinh/góc không tìm thấy ⇒ bỏ item (không ném lỗi). Nếu file vượt ~200 dòng thì tách hàm này ra file riêng cùng thư mục (không tạo `utils/`).
- **Layout:** một cột; `Card` mặc định; `space-y-4`; nhóm cách nhau bằng `space-y-6`; không `position: sticky`, không container query mới (P-01).
- **A11y:** `section[aria-labelledby=titleId]` (landmark vùng có tên) → `h2`; mỗi nhóm `h3` (`id`, `tabIndex={-1}`) → danh sách `ul>li` các `InterpretationItem` (`h4` bên trong Item). Alert (S-03/S-08) dùng `Alert` có sẵn (`role="status"`).

### 7.2 `InterpretationOverview` (`InterpretationOverview.tsx`)
**Mục đích (theo AC-01…03, 11, §7.2/§7.6 — không thiết kế thêm):** (1) nêu số diễn giải khả dụng; (2) điều hướng tới từng nhóm; (3) chú thích một lần khi thiếu Nhà; (4) câu nêu rõ chưa có diễn giải góc chiếu/tổng hợp; (5) disclaimer. **Không** là bản tổng hợp tính cách, không chứa văn bản do FE suy ra.

```ts
export interface InterpretationOverviewGroupLink { id: InterpretationGroupId; label: string; href: string }
export interface InterpretationOverviewProps {
  availableCount: number;                       // model.availableCount (AC-01)
  houseDataAvailable: boolean;                  // model.houseDataAvailable (S-05)
  groups: readonly InterpretationOverviewGroupLink[]; // từ model.groups (AC-02, AC-11)
  onGroupLinkClick: (groupId: InterpretationGroupId) => void;
  className?: string;
}
```
- Rỗng/một phần: `groups` rỗng ⇒ **không** render `<nav>`; `availableCount` luôn hiển thị (kể cả 10).
- Chú thích Nhà (C-06) chỉ khi `houseDataAvailable===false`, là `<p>` thường (**không** `role=status`) để không bị đọc lại như thông báo.
- `<nav aria-label=C-03>` → `ul>li>a[href="#<headingId>"]`; `onClick`: `preventDefault()` rồi gọi `onGroupLinkClick(id)` (Panel focus tiêu đề nhóm). `href` giữ để link hoạt động như liên kết thật (chuột phải/mở tab/không JS).

### 7.3 `InterpretationItem` (`InterpretationItem.tsx`)
**Hiển thị:** một hành tinh (hoặc Cung Mọc) dạng **disclosure có kiểm soát**: nút tiêu đề `h4>button[aria-expanded][aria-controls]` + vùng nội dung `hidden` khi đóng.

```ts
export interface InterpretationItemProps {
  id: InterpretationItemId;
  title: string;                         // PlanetVM.nameVi | AngleVM.labelVi | nhãn tĩnh fallback
  glyph: string | null;                  // trang trí, aria-hidden
  signLabel: string | null;              // PlanetVM.sign.labelVi khi sign.known
  houseLabel: string | null;             // "Nhà N" từ houseNumber (nhãn tĩnh + số)
  bySign: InterpretationPart;            // M2
  byHouse: InterpretationPart | null;    // M2; null với Cung Mọc
  expanded: boolean;                     // điều khiển bởi Panel
  onToggle: (id: InterpretationItemId) => void;
}
```
- **Controlled** (không state riêng) — để M4 có thể ép mở mục được chọn mà không đổi Item.
- Tên truy cập của nút = văn bản hiển thị `"{title} · {signLabel}"` (bỏ `· …` khi `signLabel===null`); glyph `aria-hidden`; **không bắt đầu bằng "Chọn "** (F4/E2E dùng regex `/^Chọn /`).
- Phím: nút gốc ⇒ Enter/Space hoạt động sẵn (chuẩn §11.1–11.2, không cần `onKeyDown`); `type="button"`; vòng focus dùng token đã có (`ring-focus focus-visible:ring-2`, theo `h1` ở `page.tsx`).
- Vùng nội dung: `<dl>`; mục "Theo cung · {signLabel}" và (nếu `byHouse` hiển thị được) "Theo nhà · {houseLabel}"; `dd` là text node, class `break-words whitespace-pre-line`; chiều rộng đọc giới hạn bằng token có sẵn (kiểm lại ở M6).
- Bảng ánh xạ `InterpretationPart` → UI:

| Trạng thái part | Hiển thị |
|---|---|
| `available` | `bodyText` nguyên văn |
| `missing` / `ambiguous` | C-10 (không nêu lý do kỹ thuật) |
| `unavailable: SIGN_UNRESOLVED`, `HOUSE_NUMBER_UNRESOLVED` | C-10 |
| `unavailable: ANGLE_ABSENT` | C-11 (Cung Mọc) |
| `unavailable: HOUSE_DATA_UNAVAILABLE` | **không render** khối "Theo nhà" (S-05) |
| `unavailable: CONTENT_NOT_PUBLISHED` | không xảy ra ở Item (Panel đã hiển thị S-03 thay vì item) |
- Thiếu/`null` các nhãn tuỳ chọn ⇒ không in dấu phân cách thừa, không ném lỗi.

---

## 8. Props and Content-Source Design

### 8.1 Phân loại chuỗi hiển thị (theo prompt §5.1)

| Loại | Ví dụ | Nguồn bắt buộc | Kiểm soát |
|---|---|---|---|
| **Nội dung diễn giải** | `bodyText` của từng part | **props** (`InterpretationModel`) — không bao giờ nằm trong component | IT-10, PN-10, AR-03 |
| **Nhãn dữ liệu của chart** | tên hành tinh, tên cung, `glyph`, "Nhà N" (số) | **props** (`PlanetVM.nameVi`, `sign.labelVi`, `AngleVM.labelVi`, `houseNumber`) | PN-01 |
| **Nhãn UI tĩnh** | tiêu đề panel/nhóm, "Theo cung", "Theo nhà", `aria-label` nav, câu Overview | **`interpretationCopy.ts`** (một module, đã được owner duyệt) | AR-03, AR-05 |
| **Thông điệp trạng thái / sản phẩm** | C-06 chú thích Nhà, C-07 phạm vi, C-08 disclaimer, C-09…C-12 | **`interpretationCopy.ts`**, owner duyệt từng câu (O-1) | OV-04, PN-06, PN-08 |
| **Chẩn đoán kỹ thuật** | `issues.code/subject/count` | chỉ vào `reportError`; **không** render | PN-09, PG-03 |

### 8.2 Vì sao module copy riêng [Proposal, O-2]
- F4 hiện hardcode tiếng Việt trực tiếp trong JSX (vd. `HouseDataNotice`, `SkipLink`); `Architecture Spec §15.3` mô tả `i18next` + `locales/vi/*.json` nhưng **repo thực tế không có `i18next`, `useTranslation` hay thư mục `locales`** [Verified: `package.json`, grep `src/`] ⇒ **không có "cơ chế localization chung đã được duyệt"** trong code để dùng.
- AC-23 yêu cầu kiểm tra được "không hardcode văn bản trong component". Gom mọi chuỗi mới vào **một file** cho phép gate tự động: 3 file component phải **chỉ ASCII** (AR-03), còn `interpretationCopy.ts` do owner rà từng dòng. Khi sau này triển khai i18n, đây là điểm duy nhất cần chuyển sang `locales/vi/interpretation.json`.
- Đây là điều chỉnh nhỏ so với quy ước JSX-inline của F4; không tạo abstraction mới (chỉ một hằng số đối tượng + hai hàm định dạng).

### 8.3 Bảng copy (đã review M3.1; C-08 pending Owner)

| ID | Vị trí | Nội dung đề xuất | Nguồn |
|---|---|---|---|
| C-01 | `h2` panel | "Diễn giải" | F5 plan §7.2 |
| C-02 | Overview — số lượng | `Có {n} diễn giải cho lá số này` (n = `availableCount`) | AC-01 |
| C-03 | `aria-label` của `<nav>` | "Các nhóm diễn giải" | mới (nhãn kỹ thuật a11y) |
| C-04 | Tên nhóm | "Cốt lõi" · "Các hành tinh" | F5 plan §7.2 |
| C-05 | Nhãn khối | "Theo cung" · "Theo nhà" | F5 plan §7.2/7.3 |
| C-06 | Chú thích Nhà (S-05) | "Dữ liệu Nhà và một số góc trong lá số này chưa khả dụng. Bạn vẫn có thể xem các diễn giải theo cung." | F5 plan §7.6 (đề xuất, chưa Owner duyệt) |
| C-07 | Phạm vi (AC-03) | "Diễn giải góc chiếu và nhận định tổng hợp toàn lá số hiện chưa có nội dung." | **mới** — cần owner |
| C-08 | Disclaimer | "Chiêm tinh là một góc nhìn để bạn khám phá và suy ngẫm về bản thân, không phải kết luận tuyệt đối về con người hay tương lai. Hãy đón nhận những nội dung phù hợp với trải nghiệm của chính bạn." | F5 plan §7.6; PRD Draft ⇒ cần duyệt sản phẩm |
| C-09 | S-03 tiêu đề `Alert` | "Nội dung diễn giải chưa được phát hành" | §7.6 |
| C-10 | Part thiếu (S-04) | "Chưa có nội dung cho mục này" | §7.6 |
| C-11 | Cung Mọc khi vắng góc | "Cung Mọc chưa khả dụng cho lá số này." | F5 plan §7.3 |
| C-12 | S-08 `Alert` | "Hiện chưa thể hiển thị diễn giải cho lá số này." | **mới** — O-3 |
| C-13 | Nhãn fallback Cung Mọc / "Nhà N" | "Cung Mọc" · `Nhà {n}` | nhãn tĩnh |

**Ràng buộc copy [Verified từ test/E2E hiện có]:** (1) không câu nào nhắc "giờ sinh/birth" (AC-18); (2) tiêu đề `h2/h3/h4` của panel không chứa các chuỗi con mà Playwright dùng làm `getByRole("heading", { name })` (khớp chuỗi con, không phân biệt hoa/thường): "Vị trí hành tinh", "Nhà và các góc", "Góc chiếu", "Chi tiết đang chọn", "Lá số sinh", "Lá số của tôi" — tên nút disclosure không bắt đầu bằng "Chọn " hoặc "Xóa bộ lọc theo"; (3) không trùng *nguyên văn* các chuỗi mà test Vitest F4 dùng `getByText` đầy đủ (vd. "Dữ liệu Nhà và các góc chưa khả dụng", "Dữ liệu chưa đầy đủ", "Hệ nhà", "Tính lúc"). AR-05 kiểm các ràng buộc (1)–(3).

### 8.4 Dữ liệu không được hiển thị
`tone`, `interpretationVersion`, `contentSource` (D-F5-04), `issues.subject`, bất kỳ khoá `subjectKey` thô nào — không xuất hiện trong DOM.

---

## 9. `page.tsx` and Shell Integration Design

### 9.1 Cấu trúc hiện có [Verified]
`ChartDetailPage` → `useChartQuery(chartId)` → `useMemo(mapping)` (`toChartViewModel`, bắt `ChartViewModelError`) → `viewKind` (`loading|not-found|forbidden|connection|server|invalid-data|ready`) → khi `ready`: `<ChartViewerShell key={chartId} vm={mapping.vm} />`. `ChartViewerShell` giữ toàn bộ state tương tác F4 (`useReducer(interactionReducer)`, zoom, aspect lines) và layout: thẻ thông tin → cảnh báo `partialData` → wrapper `[container-type:inline-size]` (hai cột ≥ 1010px) → (kết thúc `space-y-6`).

### 9.2 Thay đổi đề xuất (tối thiểu, cộng thêm)

| File | Thay đổi |
|---|---|
| `pages/app/charts/detail/page.tsx` | (1) trong `useMemo(mapping)`, nhánh `ok` trả thêm `interpretation: buildInterpretationModel(query.data, vm)` (hàm không ném lỗi — U-10/18/22); (2) truyền `interpretation={mapping.interpretation}` cho Shell; (3) thêm **một** `useEffect` theo `mapping` gom issue `category==="defect"` thành **một** `reportError(new Error(\`Interpretation data issues: …\`), "interpretation-model")` (mẫu giống effect `chart-view-model` có sẵn); thông điệp gộp theo `code`: `CODE×tổng count`, thứ tự do M2 đã sắp xếp; không đưa `bodyText` hay dữ liệu cá nhân |
| `features/chart/ui/ChartViewerShell/ChartViewerShell.tsx` | thêm prop **tuỳ chọn** `interpretation?: InterpretationModel`; khi có, render `<InterpretationPanel model={interpretation} planets={vm.planets} angles={vm.angles} />` **ngay sau** wrapper container-query (cuối `space-y-6`), toàn chiều rộng (P-01). Không đụng reducer, wheel, bảng, skip link |
| `features/chart/index.ts` | thêm `export { buildInterpretationModel } from "./model/interpretation"` và `export type { InterpretationModel } from "./model/interpretation"` (một dòng mỗi export — Coding Standards §4.2; page chỉ import qua barrel — §14.3) |

**Vì sao đủ nhỏ:** không tạo layout mới, không context/store, không prop drilling thêm (Shell đã có `vm`). Panel là **anh em** của lưới F4 chứ không nằm trong cột nào ⇒ sticky/zoom/skip link F4 không đổi.

### 9.3 Chủ sở hữu trạng thái
| Quyết định | Chủ |
|---|---|
| loading, lỗi API (404/403/connection/server), dữ liệu VM không hợp lệ | `page.tsx` (F4, không đổi) — **panel không được render** |
| có hay không `interpretation` truyền xuống | `page.tsx` (luôn có khi `ready`) |
| S-02, S-03, S-04, S-05, S-08 | `InterpretationPanel`/Item/Overview, từ `model` |
| báo lỗi dữ liệu (S-06) | `page.tsx` (effect) — một nơi duy nhất |
| mở/đóng mục | `InterpretationPanel` (UI-only) |
| selection | `ChartViewerShell` (F4) — **M3 không đọc, không ghi** |

### 9.4 Bảo đảm "không đổi selection"
Panel không nhận `selection`, `onSelect*`, `dispatch`; Item không có handler nào ngoài `onToggle` (mở/đóng nội bộ); không import `../../model/selection`; Shell không truyền bất cứ thứ gì từ `interactionState` vào Panel. Kiểm bằng AR-02 (nguồn), SH-03/SH-04 (hành vi), và F4 test nguyên vẹn.

### 9.5 Bằng chứng sơ bộ về tương thích [Verified, thử nghiệm cô lập]
Trên bản sao `/tmp` (không chạm repo): (a) panel giả + prop `interpretation` ở Shell + tính model ở `page.tsx`: 9 file/127 test F4 liên quan **xanh**; (b) thêm cả effect `reportError` gộp: 5 file/46 test (trang chi tiết + hai integration flow) **xanh**; trong đó hai test F4 hiện có (`V5` với `interpretations:null`, `V7` bỏ Pluto) sẽ **phát sinh log `[reportError] (interpretation-model)`** nhưng không assert về console ⇒ vẫn xanh (V6, test duy nhất `expect(console.error).not.toHaveBeenCalled()`, dùng dữ liệu diễn giải sạch ⇒ không bị ảnh hưởng). Lưu ý thêm: test F4 **V9** (`page.test.tsx`: "passes axe accessibility check in ready state") chạy `vitest-axe` trên **toàn trang**, nên từ M3 nó cũng kiểm DOM của panel (bản giả đã qua; panel thật phải giữ xanh); test **V2** khẳng định trang không nêu nguyên nhân giờ sinh — khớp AC-18. Hai điểm cần giữ khi cài đặt thật: thông điệp báo lỗi **gộp theo code** (bản thử dài vì chưa gộp), và nút disclosure không trùng tên truy cập với nút F4.

---

## 10. Data Flow and State Ownership

```
GET /api/v1/charts/:id  ──►  useChartQuery (TanStack Query, không đổi)
                               │ query.data: ChartResponse (14 trường; interpretations[], interpretationVersion)
                               ▼
page.tsx  useMemo(mapping):  toChartViewModel(data) ──► vm            (F4)
                             buildInterpretationModel(data, vm) ──► interpretation   (M2, thuần)
   ├─ useEffect: defect issues ──► reportError(..., "interpretation-model")   (một lần / lần tải dữ liệu)
   └─ viewKind==="ready" ──►  <ChartViewerShell key vm interpretation />
                                 ├─ (F4) Wheel · SelectionDetail · PlanetTable · HouseTable · AspectTable   [selection state ở đây]
                                 └─ <InterpretationPanel model planets angles />
                                       ├─ <InterpretationOverview availableCount houseDataAvailable groups onGroupLinkClick/>
                                       └─ groups → <InterpretationItem … expanded onToggle/>   [expandedIds ở Panel]
```
- **Nguồn dữ liệu:** `ChartResponse` đã có; **không** thêm request, không đổi hợp đồng API.
- **Ranh giới biến đổi:** `buildInterpretationModel` (M2) — thêm nhãn hiển thị bằng tra `vm.planets/angles` ở Panel (thuần, không lưu bản sao).
- **Không có state toàn cục mới, không duplicate chart/interpretation state, không prop drilling thêm.**
- **Selection:** do `ChartViewerShell` sở hữu; M3 không chạm (Mục 9.4).
- **Báo lỗi:** `reportError` (đã có) → `console.error` hiện tại; không dịch vụ ngoài.
- **Tuân thủ kiến trúc:** presentational ở `ui/`; logic miền ở `model/` (M2); `page` chỉ lắp ghép; import một chiều `ui → model/api types` (type-only), không import `selection`.

---

## 11. File-Level Change Plan

Tất cả đường dẫn tính từ `frontend/` (trừ docs). **[confirmed]** = tồn tại hôm nay; **[proposed]** = tạo mới.

| File | Hành động | Trách nhiệm | Phụ thuộc | AC / state | Test / bằng chứng | Rủi ro |
|---|---|---|---|---|---|---|
| `src/features/chart/ui/InterpretationPanel/InterpretationPanel.tsx` [proposed] | Create | Panel (7.1) | M2 types, `PlanetVM/AngleVM` (type), `Card`, `Alert`, copy | AC-01…03,11,12,17…21,23; S-02…05, S-08 | PN-*, SH-*, ảnh S-02…S-08 | Vượt 200 dòng ⇒ tách `resolveItemDisplay` |
| `…/InterpretationOverview.tsx` [proposed] | Create | Overview (7.2) | copy | AC-01,02,03,11,17 | OV-* | — |
| `…/InterpretationItem.tsx` [proposed] | Create | Disclosure (7.3) | `lucide-react` (đã có), copy | AC-12,20,23; S-04, S-05 | IT-* | trùng tên truy cập F4 |
| `…/interpretationCopy.ts` [proposed] | Create | Hằng số copy + `formatCount`/`formatHouseLabel` | — | AC-18, AC-23 | AR-03/05, OV-04 | copy chưa duyệt |
| `…/index.ts` [proposed] | Create | `export { InterpretationPanel } from "./InterpretationPanel"` (+ type props) | — | — | — | — |
| `…/InterpretationItem.test.tsx`, `InterpretationOverview.test.tsx`, `InterpretationPanel.test.tsx` [proposed] | Test | Mục 13 | fixtures `chartFull`/`chartNoHouses`, M2 | như Mục 5/6 | output vitest | — |
| `…/InterpretationPanel.purity.test.ts` [proposed] | Test (tĩnh) | AR-01…AR-05 đọc nguồn bằng `fs` (mẫu M2: `/// <reference types="node" />`, `fileURLToPath`, không `new URL`) | — | AC-23 | output vitest | chỉ file này dùng kiểu Node |
| `src/features/chart/ui/ChartViewerShell/ChartViewerShell.tsx` [confirmed] | Modify | prop tuỳ chọn + render panel (9.2) | Panel, `InterpretationModel` (type) | tích hợp | SH-* | đổi layout (kiểm F4) |
| `…/ChartViewerShell.interpretation.test.tsx` [proposed] | Test | SH-01…SH-05 (**file mới**, không sửa `ChartViewerShell.test.tsx`) | — | — | — | — |
| `src/pages/app/charts/detail/page.tsx` [confirmed] | Modify | memo + prop + effect (9.2) | barrel | AC-19…22; S-06 | PG-* | `reportError` ồn log ở 2 test F4 (xanh) |
| `src/pages/app/charts/detail/page.interpretation.test.tsx` [proposed] | Test | PG-01…PG-06 (mẫu tách file có sẵn: `page.unexpected-error.test.tsx`) | MSW handlers có sẵn | — | — | — |
| `src/features/chart/index.ts` [confirmed] | Modify | export builder + type | — | — | typecheck | mở rộng API công khai (có chủ đích) |
| `docs/implementation/archive/sprint-f5/Sprint_F5_M3_Exit_Criteria_Evidence_Matrix.md` [proposed] | Docs | Evidence + Known Gaps | — | tất cả | — | — |
| `docs/implementation/archive/sprint-f5/evidence/m3_*.png`, `m3_fixture_*.json` [proposed] | Evidence | Mục 14 | — | tất cả trạng thái | ảnh thật do owner chụp | không tái lập được nếu thiếu fixture |
| `docs/implementation/Sprint_F5_Implementation_Plan.md` [confirmed] | Docs | đánh dấu M3 xong + quyết định đã chốt | — | — | diff | — |
| `docs/implementation/Sprint_F5_M3_Implementation_Plan.md` [tài liệu này] | Docs | **xoá khi đóng M3** (quy ước) | — | — | — | — |
| `selection.ts`, `chartViewModel.ts`, `SelectionDetail`, `PlanetTable`, `HouseTable`, `AspectTable`, `HouseDataNotice`, `ChartWheel/*`, `shared/ui/*` [confirmed] | **No change** | giữ F4 nguyên | — | — | — | — |
| `src/features/chart/model/interpretation.ts` (+ tests) [confirmed] | **No change** | M2 đóng | — | — | — | — |
| `frontend/package.json`, lockfile, `CHANGELOG.md`, `Frontend_UI_Specification.md`, workflows, `vite.config.ts`, `tsconfig*`, `eslint.config.js`, Backend | **No change** | version/CHANGELOG/Spec ở M8; không cần cấu hình | — | — | — | — |

Ngân sách thay đổi: 3 file mã sửa, 5 file mã tạo (+ `index.ts`), 6 file test tạo; không sửa/xoá test F4.

---

## 12. Implementation Sequence and Milestones

Tuần tự (M3 độc lập kiểm thử được; không gói việc M4).

| ID | Mục tiêu | Files | Việc chính | Tiên quyết | Xác minh | Bằng chứng | Điều kiện thoát |
|---|---|---|---|---|---|---|---|
| **M3.0** | Pre-flight | — | `git pull --ff-only`; cây sạch; ghi SHA; `vitest list` (kỳ vọng 132/1087), `playwright --list` (38); chạy `ChartViewerShell` + page + 2 integration test (kỳ vọng xanh: baseline F4 trước khi sửa) | owner duyệt plan | lệnh | log | baseline có số thật |
| **M3.1** | Chốt copy & quyết định | `interpretationCopy.ts` (nháp), plan | Owner duyệt C-01…C-13, O-2…O-5, S-08 | M3.0 | review | ghi chú owner | copy được duyệt (hoặc ghi rõ phần chưa duyệt = "pending", **không** merge disclaimer chưa duyệt) |
| **M3.2** | Item | `InterpretationItem.tsx`, test | button/`aria-expanded`/`hidden`, ánh xạ part (7.3) | M3.1 | IT-01…IT-10, IT-A | output vitest | IT xanh; không import ngoài allowlist |
| **M3.3** | Overview | `InterpretationOverview.tsx`, test | count, nav, ghi chú, scope, disclaimer | M3.1 | OV-01…OV-06, OV-A | output | OV xanh |
| **M3.4** | Panel | `InterpretationPanel.tsx`, `index.ts`, test | state mở/đóng, focus link nhóm, S-02…S-05/S-08 | M3.2, M3.3 | PN-01…PN-12, PN-A | output | PN xanh |
| **M3.5** | Tích hợp | `ChartViewerShell.tsx`, `page.tsx`, `features/chart/index.ts`, 2 test file mới | prop + render + effect báo lỗi | M3.4 | SH-01…SH-05, PG-01…PG-06 + **F4 suite nguyên vẹn** | output | tất cả xanh; test F4 không bị sửa (`git diff` trên các file test F4 rỗng) |
| **M3.6** | Kiểm tĩnh | `…purity.test.ts` | AR-01…AR-05; grep an toàn | M3.5 | AR | output | xanh |
| **M3.7** | Cổng chất lượng + coverage từng file | — | Mục 16 | M3.6 | lệnh | log + bảng coverage | gate xanh (CI cho phần không chạy cục bộ) |
| **M3.8** | Ảnh bằng chứng (owner) | `evidence/` | Mục 14 | M3.7 + build chạy được | thủ công | ảnh thật + fixture | đủ ảnh theo bảng, đối chiếu đúng trạng thái |
| **M3.9** | Đóng | Matrix, F5 plan, xoá plan M3 | Evidence Matrix + Known Gaps | M3.8 + CI xanh | review | Matrix | owner nghiệm thu |

**Commit (theo M1/M2):** mã: `[feat]` (có thể nhiều commit theo task, mỗi commit chỉ file thuộc task); docs: `[docs]` riêng; không trộn tài liệu vào commit mã; trước commit `git diff --cached --stat`. CI #: ghi URL run của commit mã cuối vào Matrix.

---

## 13. Test Plan

Quy ước [Verified: Coding Standards §13; UI Spec §23.3]: Vitest + RTL + MSW (không `vi.mock` hàm API); ưu tiên `getByRole` → `getByLabelText` → `getByText`; mỗi `it()` một hành vi, tên `should … when …` (ID ghi ở comment dòng đầu để truy vết); test cạnh nguồn; **không sửa test F4 hiện có**. Fixtures: `chartFull` (21 diễn giải), `chartNoHouses` (10) — đã xác minh khớp khoá (M2 plan B.8); các biến thể (thiếu mục, hỏng, rỗng) dựng bằng `structuredClone` + chỉnh trong test; model dựng bằng `toChartViewModel` + `buildInterpretationModel` thật (không mock M2).

### 13.1 `InterpretationItem.test.tsx` (component + a11y)
| ID | Hành vi cần chứng minh | Arrange → Assert | AC |
|---|---|---|---|
| IT-01 | Mặc định đóng | `expanded=false` → button `aria-expanded="false"`; nội dung `hidden`/không `toBeVisible` | AC-12 |
| IT-02 | Mở | `expanded=true` → `aria-expanded="true"`; `bodyText` hiển thị | AC-12 |
| IT-03 | Bấm gọi `onToggle(id)` đúng một lần (chuột) | `userEvent.click` → spy gọi với `id` | AC-12 |
| IT-04 | Bàn phím | focus nút, `Enter` và `Space` → `onToggle` mỗi lần một lần | AC-12 |
| IT-05 | Tên truy cập & liên kết vùng | `getByRole("button",{name:"Mặt Trời · Ma Kết"})`; `aria-controls` = id của vùng nội dung; tên **không** bắt đầu "Chọn " | AC-12 |
| IT-06 | Controlled | đổi prop `expanded` → UI đổi, không có state riêng (render lại không lật trạng thái) | AC-12 |
| IT-07 | Part thiếu | `missing`/`ambiguous`/`SIGN_UNRESOLVED` → hiển thị C-10; part khác vẫn hiển thị `bodyText` | AC-20 |
| IT-08 | Nhà không khả dụng / Cung Mọc vắng | `byHouse: unavailable(HOUSE_DATA_UNAVAILABLE)` → **không** có khối "Theo nhà"; `ANGLE_ABSENT` → C-11 | AC-17 |
| IT-09 | Nhãn tuỳ chọn `null` | `glyph/signLabel/houseLabel = null` → không dấu "·" thừa, không lỗi | — |
| IT-10 | Chỉ text | `bodyText="<b>x</b> & <script>"` → hiển thị nguyên văn; `container.querySelector("b,script")` là `null` | AC-23 |
| IT-A | `vitest-axe` không vi phạm (đóng + mở) | `axe(container)` → `toHaveNoViolations` | UI Spec §23.3 |

### 13.2 `InterpretationOverview.test.tsx`
| ID | Hành vi | Assert | AC |
|---|---|---|---|
| OV-01 | Số lượng bằng `availableCount` | 21 (từ `chartFull`) và 10 (từ `chartNoHouses`) hiển thị bằng đúng số của model, không tính lại | AC-01 |
| OV-02 | Định dạng số qua copy | `formatCount(n)` → "Có n diễn giải cho lá số này" | AC-01 |
| OV-03 | Link nhóm | mỗi link có `href="#<id>"`; bấm → `preventDefault` + `onGroupLinkClick(groupId)`; Enter kích hoạt | AC-02 |
| OV-04 | Phạm vi & disclaimer | có C-07 và C-08 **đúng một lần**; không có đoạn nào ngoài danh sách đã định (không nội dung tổng hợp) | AC-03 |
| OV-05 | Không nhóm rỗng | `groups=[]` → không `<nav>`; `availableCount` vẫn hiển thị | AC-11 |
| OV-06 | Chú thích Nhà | `houseDataAvailable=false` → C-06 đúng một lần, **không** `role="status"`; `true` → không có | AC-17 |
| OV-A | axe | không vi phạm | §23.3 |

### 13.3 `InterpretationPanel.test.tsx`
| ID | Hành vi | Assert | AC / State |
|---|---|---|---|
| PN-01 | Đầy đủ | `chartFull` → `h2` "Diễn giải"; 2 nhóm `h3` (Cốt lõi: 3 mục; Các hành tinh: 8 mục); Overview hiện 21; `bodyText` mỗi part khớp fixture | AC-01; S-02 |
| PN-02 | Mở mặc định | 3 nút nhóm Cốt lõi `aria-expanded=true`; 8 nút còn lại `false` | AC-12; P-06 |
| PN-03 | Nhiều mục mở | mở thêm 2 hành tinh → cả hai + Cốt lõi cùng mở; đóng một không ảnh hưởng mục khác | AC-12 |
| PN-04 | Không nhóm rỗng | VM không hành tinh (chỉ có Ascendant hoặc không) → chỉ `core`, không link/heading `planets` | AC-11 |
| PN-05 | Điều hướng focus | bấm link "Các hành tinh" → `document.activeElement` là `h3` của nhóm (`tabIndex=-1`); `location.hash` không đổi | AC-02 |
| PN-06 | Chưa phát hành | `[]` + `interpretationVersion:null` → `Alert` C-09 (`role=status`), **không** Overview/nhóm/mục | AC-19; S-03 |
| PN-06b | Không khả dụng do lỗi dữ liệu | `[]` + `"1.0"`; và `interpretations:null` → C-12, **không** chứa câu C-09 | S-08 (O-3) |
| PN-07 | Thiếu Nhà | `chartNoHouses` → 10 `bodyText` theo cung; **không** có "Theo nhà"; Cung Mọc C-11; C-06 đúng một lần | AC-17; S-05 |
| PN-07b | Một phần | bỏ 1 `PlanetInHouse` → đúng một dòng C-10 ở mục đó; 20 `bodyText` còn lại bình thường | AC-20; S-04 |
| PN-08 | Không suy luận giờ sinh | `textContent` của panel ở **mọi** trạng thái (S-02…S-08) không khớp `/giờ sinh|birth/i` | AC-18 |
| PN-09 | Dữ liệu hỏng không lộ ra | thêm mục `language:"en"`, trùng khoá, thiếu `bodyText`, loại lạ → DOM **bằng** DOM của dữ liệu sạch (trừ phần hậu quả của trùng khoá nếu có); không crash | AC-21; S-06 |
| PN-10 | Props-driven | model tuỳ biến với `bodyText` khác fixture → hiển thị đúng chuỗi đó (chứng minh không đọc fixture/hardcode) | AC-23 |
| PN-11 | Không dính selection | panel không có `aria-current`, `aria-pressed`, handler chọn; render không gọi callback nào | M3 ≠ M4 |
| PN-12 | Ổn định | re-render cùng props **không** reset mở/đóng đã chọn | AC-12 |
| PN-A | axe | S-02 và S-05 không vi phạm | §23.3 |

### 13.4 `ChartViewerShell.interpretation.test.tsx` (file mới)
| ID | Hành vi | Assert |
|---|---|---|
| SH-01 | Không có prop `interpretation` ⇒ không có panel (tương đương F4) | không có region "Diễn giải" |
| SH-02 | Có prop ⇒ panel xuất hiện **sau** các bảng, các bảng/`SelectionDetail`/wheel còn nguyên; trạng thái "chưa phát hành" **không** làm mất bảng | `compareDocumentPosition`; headings F4 vẫn có |
| SH-03 | Chọn hành tinh (qua hàng bảng) **không** đổi DOM của panel và không đổi `aria-expanded` | tuần tự hoá panel trước/sau bằng nhau; live region đúng bản F4 |
| SH-04 | Mở/đóng mục diễn giải **không** đổi selection | `SelectionDetail` vẫn "chưa chọn"; không có thông báo live region mới |
| SH-05 | Bố cục F4 giữ nguyên | wrapper container-query và `#chart-data-tables` còn đó; panel không nằm trong wrapper |

### 13.5 `page.interpretation.test.tsx` (file mới, MSW như `page.test.tsx`)
| ID | Hành vi | Assert | AC |
|---|---|---|---|
| PG-01 | Nội dung chạm tới panel qua trang thật | `chartFull` từ MSW → panel có `bodyText` mục `Sun_in_Capricorn` của fixture | AC-01 |
| PG-02 | Không nhà qua MSW | `chartNoHouses` → 10 mục, C-06 | AC-17 |
| PG-03 | **Báo lỗi gộp một lần** | dữ liệu lỗi (`interpretations:null`, hoặc thiếu 1 mục) → `reportError` đúng **1** lần, context `"interpretation-model"`, `Error` có `CODE×n` gộp; dữ liệu sạch, không nhà, chưa phát hành → **0** lần | AC-20 |
| PG-04 | Mục hỏng bị loại | thêm `language:"en"` + trùng khoá → không hiển thị; 1 lần báo lỗi | AC-21 |
| PG-05 | Lỗi API | 404/403/500/mất kết nối → EmptyState F4; **không** có panel/"chưa phát hành"; `reportError` không được gọi với context `interpretation-model` | AC-22; S-07 |
| PG-06 | Đang tải | skeleton F4; không panel | S-01 |

### 13.6 `InterpretationPanel.purity.test.ts` (tĩnh, mẫu M2)
| ID | Kiểm tra | Cách |
|---|---|---|
| AR-01 | Không `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML` ở bất kỳ file panel (kể cả copy) | regex trên nguồn đọc bằng `fs` |
| AR-02 | Không import/dùng `selection`, `useReducer`, `fetch`, `axios`, `localStorage`, `window.location`; không prop `onSelect*`/`dispatch` | regex |
| AR-03 | **3 file component chỉ ASCII** (mọi chuỗi tiếng Việt nằm ở `interpretationCopy.ts`); không chuỗi dạng khoá `_in_`/`subjectKey` | `/[^\x00-\x7F]/` + regex |
| AR-04 | Allowlist import: `react`, `lucide-react`, `@shared/*`, `@features/chart/…` kiểu (`import type`), tương đối trong thư mục; cấm `import(`/`require(` và import chỉ-tác-dụng-phụ | regex (siết như M2 `d4961a6`) |
| AR-05 | Ràng buộc copy: không "giờ sinh/birth"; tiêu đề không chứa chuỗi con cấm (Mục 8.3 #2); không trùng nguyên văn chuỗi `getByText` của F4 (#3) | so sánh với danh sách hằng trong test |

### 13.7 Hồi quy F4 / E2E
- **R-1** Không sửa/xoá/bỏ qua bất kỳ test F4; chạy lại toàn bộ file liên quan Shell/page/integration (đã có 9 file/127 test làm mốc) và `npm test` toàn bộ; `git diff` trên các `*.test.tsx` F4 phải rỗng.
- **R-2** E2E: **không đổi** `e2e/*.ts` ở M3. Rủi ro locator của Playwright (khớp chuỗi con, strict mode) được giảm bằng ràng buộc copy AR-05; xác nhận cuối bằng job CI (`test:e2e`, 38 test) — không chạy được cục bộ (cần Backend).
- **R-3** `playwright test --list` vẫn 38/7.

---

## 14. Visual Evidence and Screenshot Plan

**Hiện trạng:** chưa có ảnh nào; ảnh F4 do owner chụp thủ công trên bản build thật (Windows 11, Chrome 155) và lưu phẳng ở `docs/implementation/archive/sprint-f4/evidence/m{N}_*.png` cùng `fixture_full.json`, `fixture_nohouse.json`. Sandbox của tôi không có Backend/trình duyệt đầy đủ ⇒ **owner chụp**; ảnh chỉ được tính khi **tên file, trạng thái, viewport và nội dung thấy được** khớp bảng dưới (đối chiếu từng ảnh trong Matrix; ảnh sai trạng thái = không tính).

**Vị trí/đặt tên [Proposal, O-5]:** `docs/implementation/archive/sprint-f5/evidence/m3_<state>_<viewport>.png` (phẳng, theo F4) — thay cho `evidence/f5-m3/…` trong prompt (repo không có thư mục đó).

**Dữ liệu & cách tái lập:**
- S-02, S-05, S-07: **Backend thật** (đã seed nội dung, như CI M1). S-05: hồ sơ **bỏ chọn "Tôi biết rõ giờ sinh"** (cách F4 M10 Q3). S-07: chặn request `GET /charts/:id` (DevTools → Network request blocking / offline).
- S-03, S-04, S-06, S-08: ghi đè *response* của `GET /api/v1/charts/{id}` bằng **DevTools → Sources → Overrides** (Chrome) hoặc một script Playwright `page.route` chạy tại máy (không commit). Các biến thể JSON sinh từ `fixture_full.json` (F4), lưu cùng thư mục ảnh:
  - `m3_fixture_unpublished.json`: `interpretations: []`, `interpretationVersion: null`
  - `m3_fixture_partial.json`: bỏ đúng một mục `PlanetInHouse` (vd. của Mars)
  - `m3_fixture_malformed.json`: thêm một mục `language:"en"`, một mục trùng `subjectKey`, một mục thiếu `bodyText`
  - `m3_fixture_all_missing.json`: `interpretations: []`, `interpretationVersion: "1.0"`
  Đây là *bản sao đã chỉnh sửa của phản hồi hiện có* để tái lập trạng thái, **không** phải nội dung diễn giải mới.

| # | File ảnh (kế hoạch) | State | Viewport / theme | Dữ liệu | Phải thấy được | Kiểm tra |
|---|---|---|---|---|---|---|
| 1 | `m3_s02_full_desktop_1500.png` | S-02 | 1500, sáng | Backend thật | panel sau lưới; Overview số 21; nhóm Cốt lõi mở | AC-01, 03, 12 |
| 2 | `m3_s02_full_tablet_768.png` | S-02 | 768 | thật | một cột, không cuộn ngang | NF-1 |
| 3 | `m3_s02_full_mobile_375.png` | S-02 | 375 | thật | xếp dọc, chữ đọc được | NF-1 |
| 4 | `m3_s02_reflow_320.png` | S-02 | 320 (và zoom 200%) | thật | không cuộn ngang trang | reflow |
| 5 | `m3_theme_light.png` / (và tối nếu theme có) | S-02 | 1500 | thật | nhất quán token theme | tương phản |
| 6 | `m3_item_collapsed.png`, `m3_item_expanded.png` | mục đóng/mở | 1500 | thật | `aria-expanded` thể hiện qua icon + trạng thái hiển thị | AC-12 |
| 7 | `m3_item_focus_ring.png` | focus bàn phím | 1500 | thật | vòng focus thấy rõ trên nút mục | focus |
| 8 | `m3_overview_link_focus.png` | sau khi bấm link nhóm | 1500 | thật | focus ở `h3` nhóm, trang cuộn tới | AC-02 |
| 9 | `m3_s03_unpublished.png` | S-03 | 1500 | `m3_fixture_unpublished.json` | chỉ `Alert` C-09; bảng F4 còn nguyên | AC-19 |
| 10 | `m3_s04_partial_missing.png` | S-04 | 1500 | `m3_fixture_partial.json` | đúng một dòng C-10 ở mục tương ứng | AC-20 |
| 11 | `m3_s05_no_house.png` | S-05 | 1500 + 375 | **thật, hồ sơ không giờ sinh** | C-06 một lần; không "Theo nhà"; Cung Mọc C-11; (F4 Alert vẫn ở HouseTable) | AC-17, 18 |
| 12 | `m3_s06_malformed_clean_ui.png` + `m3_s06_console_report.png` | S-06 | 1500 | `m3_fixture_malformed.json` | UI sạch (không mục lạ); console có **một** dòng `[reportError] (interpretation-model)` | AC-21, 20 |
| 13 | `m3_s07_api_error.png` | S-07 | 1500 | request bị chặn | EmptyState F4, không panel, không "chưa phát hành" | AC-22 |
| 14 | `m3_s08_unavailable_generic.png` | S-08 | 1500 | `m3_fixture_all_missing.json` | `Alert` C-12; không câu "chưa phát hành" | O-3 |

Quy tắc ảnh: không chứa email/token/dữ liệu cá nhân ngoài dữ liệu thử; ghi kèm trong Matrix: commit build, trình duyệt, viewport, theme, nguồn dữ liệu. Ảnh nào không thể chụp ⇒ ghi `UNVERIFIED` + lý do, **không** thay bằng ảnh state khác.

---

## 15. Accessibility, Responsive, Performance and Security Plan

### 15.1 Accessibility (nền cho M6; M3 chỉ xác minh những gì M3 tạo ra)
- **Cấu trúc [Verified mẫu]:** `section[aria-labelledby]` → `h2` (hiển thị, cùng kiểu tiêu đề bảng F4: `text-heading-sm font-semibold text-primary`) → `h3` nhóm → `h4` mục; không nhảy cấp (trang: `h1` "Lá số sinh" → các `h2` bảng → `h2` Diễn giải).
- **Disclosure theo WAI-ARIA Accordion (APG):** `h4>button[aria-expanded][aria-controls]`; vùng nội dung bằng thuộc tính `hidden` (không CSS ẩn) ⇒ không vào thứ tự Tab/cây a11y khi đóng; **không** thêm `role` thừa lên `<button>` (Coding Standards §11.4); không `tabIndex` dương; không tabs.
- **Không phụ thuộc màu:** trạng thái mở/đóng = `aria-expanded` + biểu tượng mũi tên xoay/đổi + vùng nội dung xuất hiện (không chỉ màu).
- **Live region:** không thêm `aria-live` mới. `Alert` S-03/S-08 mang `role="status"` sẵn có (một câu ngắn). Chú thích Nhà là `<p>` thường. Không đọc `bodyText` qua live region.
- **Focus:** link nhóm chủ động focus `h3` (`tabIndex={-1}`) vì `preventDefault`; focus ring dùng token có sẵn; M3 **không** di chuyển focus ở bất kỳ tình huống nào khác (P-03).
- **Reduced motion:** M3 không thêm chuyển động (không `transition`, không cuộn mượt; `scrollIntoView` gọi khi có & `block:"start"` không `behavior:"smooth"`); nếu M6 thêm hiệu ứng phải dùng `motion-reduce:`.
- **Công cụ:** `vitest-axe` trong jsdom **không** kiểm được tương phản màu/độ phản ứng bố cục ⇒ tương phản và Narrator là **kiểm tay** (như F4 Q7/Q9, KG-M10-03): M3 ghi rõ phần "chưa kiểm" thành Known Gap, không tuyên bố đạt.

### 15.2 Responsive (breakpoint tokens: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536; Chart Detail dùng `container-wide` 1440 — UI Spec §7–8)
- Một cột ở mọi viewport; panel full-width sau lưới; padding bằng token (`p-4 sm:p-6`), khoảng cách `space-y-*`; `break-words` cho `dd`/tiêu đề dài; link nhóm `flex-wrap`; không `overflow-x`; mục tiêu: không cuộn ngang ở 320–375/768/≥1024 và khi zoom 200%.
- Không dùng giá trị tuỳ ý của Tailwind (checklist §15). Không thêm container query/sticky mới. Đo/chốt vị trí cuối ở **M6** (P-01).

### 15.3 Performance
- ≤ 11 item, ≤ 21 đoạn văn: không ảo hoá/lazy. Model dựng một lần trong `useMemo(mapping)` theo `query.data`; `expandedIds` cục bộ ở Panel ⇒ đổi mở/đóng **không** render lại wheel/bảng (kiểm: Panel là anh em, Shell không giữ state này).
- Không request mới; không `useEffect` tải dữ liệu; effect `reportError` chỉ chạy khi `mapping` đổi.

### 15.4 Security / Privacy
- `bodyText` chỉ là text node React; không HTML/markdown/rich text; không `dangerouslySetInnerHTML` (AR-01); không `href`/`src` từ dữ liệu.
- `reportError` chỉ chứa mã lỗi và số lượng gộp (cắt `subject` ≤ 80 ký tự đã làm ở M2); **không** `bodyText`, không dữ liệu sinh, không token.
- Không lưu `localStorage` (state mở/đóng chỉ trong bộ nhớ; không "nhớ" giữa các lần xem).
- Ảnh bằng chứng và fixture biến thể không chứa PII (dữ liệu thử đã dùng ở F4).

---

## 16. Quality Gates and Verification Commands

Chạy tại `frontend/` (lấy từ `package.json`/`frontend-ci.yml` đã đọc). Phần không chạy được cục bộ ghi rõ là bằng chứng CI.

| Gate | Lệnh | Mong đợi | Ghi chú |
|---|---|---|---|
| Format | `npm run format:check` | pass | gồm file mới |
| Lint | `npm run lint` | 0 lỗi mới (`import/order`, `react-hooks/exhaustive-deps`, `no-console`) | |
| Typecheck | `npm run typecheck` | exit 0 | `purity.test.ts` cần `/// <reference types="node" />` |
| Unit/Component | `npx vitest run src/features/chart/ui/InterpretationPanel src/features/chart/ui/ChartViewerShell src/pages/app/charts` | xanh | |
| Toàn bộ | `npm test` | xanh; file ≥ 132 + 6 mới = 138; case ≥ 1087 + số test mới | số thật ghi ở Matrix |
| Hồi quy F4 (bắt buộc) | `npx vitest run src/features/chart/ui/ChartViewerShell src/pages/app/charts src/app/chart-flow.integration.test.tsx src/app/saved-charts-flow.integration.test.tsx src/app/router.test.tsx` | xanh, **test F4 không bị sửa** | mốc: 9 file/127 test |
| **Coverage từng file** | `npx vitest run --coverage --coverage.include=<file> --coverage.reporter=text <test files>` cho từng component + Panel | báo dòng/nhánh/hàm + dòng chưa phủ; mục tiêu nội bộ ≥ 90% dòng (UI Spec §23.3 **không** đặt ngưỡng % cứng; thiếu ⇒ ghi gap, không claim) | lệnh đã chạy thử ở M2 |
| Coverage tổng | `npm run test:coverage` | xanh (CI) | |
| Build | `npm run build` | exit 0 | |
| E2E | `npm run test:e2e` (CI) / `CI=1 npx playwright test --list` | 38 test xanh trên CI; M3 không đổi E2E | |
| Grep an toàn | `grep -rn "dangerouslySetInnerHTML" src` ; `grep -rnE "fetch\(|axios" src --include=*.ts* \| grep -v shared/api` | 0 mới | AR-01/02 phủ phần panel |
| Biên kiến trúc | không có công cụ (`boundaries/element-types` = `off`) ⇒ AR-02/AR-04 | pass | nợ F4, không bật ở M3 |
| CI | `frontend-ci.yml` job `build` trên commit mã cuối | xanh | URL run ghi vào Matrix |
| Checklist Coding Standards §15 | rà tay | mọi mục đạt hoặc ghi lý do | |

Không nới gate, không `skip/only`, không tắt rule lint. Gate không chạy được trong sandbox (vitest toàn bộ chậm, E2E, build đầy đủ) ⇒ ghi bằng chứng CI/máy owner, không tuyên bố đã chạy.

---

## 17. Risks and Owner Decisions

### 17.1 Quyết định cần owner (mặc định đề xuất; **không** mục nào chặn việc duyệt plan; O-1 chặn *merge* copy chưa duyệt)

| ID | Câu hỏi | Lựa chọn | Đề xuất | Chặn? |
|---|---|---|---|---|
| **O-1** | Duyệt copy tĩnh C-01…C-13, đặc biệt **C-07** (mới) và **C-08 disclaimer** (PRD còn Draft) | duyệt nguyên văn / sửa / hoãn disclaimer | duyệt ở M3.1; nếu disclaimer chưa duyệt, **không** đưa vào bản merge (ghi "pending") | Chặn M3.2+ cho phần copy tương ứng |
| **O-2** | Vị trí chuỗi tĩnh | (a) `interpretationCopy.ts`; (b) inline JSX như F4 | (a) — cho phép gate AR-03 và rà soát copy tập trung; khi có i18n thật sẽ chuyển một chỗ | Không |
| **O-3** | Thêm trạng thái **S-08** (lỗi dữ liệu → "không thể hiển thị", khác "chưa phát hành") | (a) thêm; (b) hiển thị 11 mục C-10; (c) coi như S-03 | (a) — tránh nói sai "chưa phát hành" (P-05) | Không |
| **O-4** | Ngữ nghĩa "`reportError` đúng một lần" (AC-20) | (a) một lần mỗi lần tải dữ liệu, gộp theo `code`; (b) mỗi issue một lần | (a) — ít nhiễu; AC-20 vẫn đúng với một mục thiếu | Không |
| **O-5** | Nơi lưu ảnh | (a) `archive/sprint-f5/evidence/m3_*.png` (phẳng như F4); (b) `evidence/f5-m3/` như prompt | (a) | Không |
| **O-6** | Link Overview | (a) chỉ nhóm (AC-02 nguyên văn); (b) cả mục (§7.2 sơ đồ ghi "nhóm/mục") | (a) | Không |
| **O-7** | Cách chụp ảnh trạng thái đặc biệt | (a) DevTools Overrides; (b) script Playwright `page.route` tại máy | (a) hoặc (b) tuỳ owner; cả hai dùng chung JSON biến thể | Không |
| **O-8** | Câu của **F4 `HouseDataNotice`** ("điều này cần giờ sinh") đứng cạnh panel | (a) ghi Known Gap, không đổi F4; (b) sửa ở sprint khác | (a) — ngoài phạm vi, không suy luận lại trong panel | Không |
| **O-9** | Export barrel `buildInterpretationModel`/`InterpretationModel` (J-14) | thêm ở M3 | thêm | Không |
| **O-10** | Chấp nhận hai thông báo Nhà trên trang (F4 Alert + chú thích panel) | chấp nhận / gộp | chấp nhận (khác nội dung, khác vùng) | Không |
| **O-11** | `reportError` chạy ở `page.tsx` thay vì Panel | xác nhận | xác nhận (Panel thuần) | Không |

### 17.1.1 Kết quả review và quyết định M3.1 (2026-11-02)

Theo yêu cầu review plan và triển khai M3.0–M3.1, các mặc định O-1…O-8 được rà soát và chọn như sau. Đây là quyết định phạm vi/copy cho F5; không thay đổi hợp đồng Backend hay các quyết định release.

| ID | Kết quả | Điều kiện / ghi chú |
|---|---|---|
| **O-1** | Chấp nhận C-01…C-07 và C-09…C-13 theo nguyên văn đề xuất; **C-08 disclaimer để pending**, không đưa vào giao diện cho tới khi Owner duyệt riêng | C-06 giữ câu trung tính, không suy ra giờ sinh hay nguyên nhân thiếu Nhà. `interpretationCopy.ts` hiện chỉ chứa các câu đã chọn; disclaimer được lược khỏi mã. |
| **O-2** | Chọn (a): tập trung copy trong `interpretationCopy.ts` | Thực tế chưa có i18n trong Frontend; đáp ứng AC-23 và tránh chuỗi tiếng Việt rải trong component. |
| **O-3** | Chọn (a): bổ sung S-08 cho lỗi dữ liệu, phân biệt với nội dung chưa phát hành | Tránh trình bày lỗi contract/dữ liệu như trạng thái xuất bản bình thường. |
| **O-4** | Chọn (a): `reportError` một lần mỗi lần tải dữ liệu, gộp issue theo `code` | Giảm log trùng; test phải bảo đảm không lặp do re-render. |
| **O-5** | Chọn (a): `docs/implementation/archive/sprint-f5/evidence/m3_*.png` | Theo cấu trúc evidence phẳng đã dùng ở F4. |
| **O-6** | Chọn (a): link Overview chỉ tới từng nhóm | Khớp AC-02; điều hướng tới mục riêng không nằm trong yêu cầu M3. |
| **O-7** | Chọn (b): dùng `page.route` của Playwright với JSON biến thể dùng chung | Tái lập trạng thái đặc biệt bằng fixture, dễ chạy lại và ít phụ thuộc thao tác DevTools thủ công. Ảnh vẫn cần được chụp và lưu theo quy trình evidence của sprint. |
| **O-8** | Chọn (a): ghi Known Gap, không sửa `HouseDataNotice` trong M3 | Panel dùng copy trung tính; không kết luận `isHouseDataAvailable=false` đồng nghĩa thiếu giờ sinh. Sửa copy F4 cần scope riêng. |

**M3.0 baseline và xác minh sau M3.1:** HEAD `c6b422e` khớp `origin/dev`; working tree ban đầu chỉ có plan M3 chưa tracked. Playwright liệt kê 38 E2E. Bốn suite hồi quy F4 trọng yếu (ChartViewerShell, chart detail page, chart-flow integration, saved-charts-flow integration) đạt 91/91 test; sau khi chuẩn bị M3.1, toàn bộ Frontend suite đạt **132 file / 1087 test**. Các lần chạy thành công dùng Vitest `--pool=threads --maxWorkers=1`. Vitest mặc định gặp `EPERM` khi worker đổi tên cache tạm trên Windows; chạy đủ với một worker thì pass. `vitest list` không hoàn tất trong môi trường này. Không chạy `git pull`: branch `dev` đã ở cùng SHA với `origin/dev` tại pre-flight.

**M3.1 artifact:** tạo `frontend/src/features/chart/ui/InterpretationPanel/interpretationCopy.ts` làm bản copy đã chọn, chưa được component tiêu thụ ở milestone này. C-08 chưa được duyệt nên không có trong module.

### 17.2 Rủi ro

| ID | Rủi ro | Khả năng | Tác động | Phát hiện | Giảm thiểu | Chặn? |
|---|---|---|---|---|---|---|
| R-01 | Hồi quy test/E2E F4 do text/role trùng | Thấp (đã thử: 127 + 46 test xanh) | Cao | R-1, CI E2E | ràng buộc copy + AR-05; prop tuỳ chọn; không sửa test F4 | Có nếu xảy ra |
| R-02 | Strict-mode Playwright / khớp chuỗi con với tiêu đề mới | Thấp | Trung bình | CI `test:e2e` | AR-05 (tiêu đề không chứa chuỗi cấm) | Không |
| R-03 | Nhầm "chưa phát hành" với lỗi dữ liệu | Trung bình (M2 từng mắc, đã fix) | Trung bình | PN-06/06b | S-03 ≠ S-08; test tách | Không |
| R-04 | Copy/disclaimer chưa được duyệt | Cao | Trung bình | O-1 | cổng M3.1; "pending" không merge | Chặn phần copy |
| R-05 | Ảnh không tái lập được (không script) | Trung bình | Thấp | review Matrix | JSON biến thể + quy trình ghi rõ; owner thực hiện | Không |
| R-06 | Phụ thuộc chéo F4 (`HouseDataNotice` lặp ý, suy giờ sinh) | Chắc chắn | Thấp | review | O-8 Known Gap | Không |
| R-07 | Nhầm phạm vi sang M4 (thêm "Xem trên biểu đồ", highlight) | Trung bình | Trung bình | review diff, AR-02, PN-11 | Mục 4 + test không-chọn | Có nếu xảy ra |
| R-08 | jsdom không kiểm tương phản/reflow thật | Chắc chắn | Trung bình | — | Known Gap + kiểm tay M6/F4-Q9 | Không |
| R-09 | `page.tsx`/Shell phình (>200 dòng) | Thấp | Thấp | review | tách `resolveItemDisplay`; `page.tsx` chỉ thêm ~12 dòng | Không |
| R-10 | `reportError` nhiễu log ở 2 test F4 | Chắc chắn | Rất thấp | log | chấp nhận (không assert console); gộp theo code | Không |
| R-11 | Kỳ vọng "một lần" sai dưới React StrictMode dev (effect chạy 2 lần) | Thấp | Thấp | PG-03 (không StrictMode) | tuỳ chọn guard bằng `useRef` theo `mapping`; quyết định khi cài đặt | Không |
| R-12 | Docs lệch: Architecture Spec §15.3 nói đã có `i18next` nhưng repo không có | Chắc chắn | Thấp | — | ghi Known Gap/doc debt; không sửa ở M3 | Không |

---

## 18. Documentation and Release Impact

| Hạng mục | M3? | Ghi chú |
|---|---|---|
| Evidence Matrix `archive/sprint-f5/Sprint_F5_M3_Exit_Criteria_Evidence_Matrix.md` | Có | theo mẫu M1/M2 + ảnh/fixture ở `evidence/` |
| Known Gaps (đề xuất ID) | Có | **KG-F5M3-01** F4 `HouseDataNotice` suy luận giờ sinh (O-8); **KG-F5M3-02** kiểm tương phản/Narrator/reflow thực chưa làm ở M3 (chuyển M6); **KG-F5M3-03** (nếu O-3 duyệt) S-08 là trạng thái bổ sung ngoài §7.6; **KG-F5M3-04** doc debt Architecture Spec §15.3 vs repo (không có i18next); tham chiếu **KG-F5-01** (cảnh báo Mặt Trăng chờ FG-01) |
| F5 Implementation Plan | Cập nhật nhỏ | đánh dấu M3 xong; chốt copy; không đổi AC |
| Plan M3 này | Xoá khi đóng | quy ước |
| UI Specification §12.6/§13 | **Không** (M8) | |
| CHANGELOG / version / lockfile | **Không** (M8, D-F5-08 còn điều kiện) | |
| CI/workflow | Không đổi | test mới chạy trong bước `Test` |
| Barrel `features/chart/index.ts` | Có | bề mặt công khai tăng 2 export (O-9) |
| Tag/release | Không | |

---

## 19. Definition of Done

M3 đóng khi **tất cả** đúng:
- ☐ Owner đã duyệt plan và copy (O-1; disclaimer duyệt hoặc ghi pending không merge).
- ☐ 3 component + copy + `index.ts` đúng Mục 7–8; chỉ props, không state chọn, không đọc `selection`, không API, không HTML thô.
- ☐ Tích hợp qua `page.tsx`/Shell/barrel đúng Mục 9; luồng loading/lỗi F4 không đổi.
- ☐ S-01…S-07 (+ S-08 nếu duyệt) có hành vi, test và ảnh thật tương ứng.
- ☐ AC-01…03, 11, 12, 17…23 có bằng chứng theo Mục 5 (phần chưa đủ ở môi trường nào thì ghi `PARTIALLY VERIFIED` + lý do).
- ☐ Test mới xanh (IT/OV/PN/SH/PG/AR + axe cho mỗi component); coverage từng file đã đo, báo cáo trung thực.
- ☐ Toàn bộ test F4 **không bị sửa** và xanh; `playwright --list` vẫn 38; CI xanh trên commit mã cuối.
- ☐ Mọi gate Mục 16 đạt (hoặc ghi rõ là bằng chứng CI).
- ☐ Ảnh/fixture ở `archive/sprint-f5/evidence/`, đối chiếu từng ảnh trong Matrix.
- ☐ Không đổi Backend/API/nội dung/dependency/version/CHANGELOG/Spec; không scope M4.
- ☐ Evidence Matrix + Known Gaps hoàn tất; plan M3 đã xoá; owner nghiệm thu.

---

## 20. Evidence Package and Handoff

**Gói bằng chứng (đóng M3):** (1) SHA commit mã + URL run Frontend CI; (2) output vitest cho từng nhóm (IT/OV/PN/SH/PG/AR) và toàn bộ; (3) bảng coverage từng file; (4) log format/lint/typecheck/build; (5) kết quả `playwright --list` (38) và kết quả E2E từ CI; (6) bộ ảnh Mục 14 + JSON biến thể; (7) bảng AC→bằng chứng; (8) Known Gaps; (9) xác nhận `git diff` rỗng trên test F4 và trên `interpretation.ts`.

**Bàn giao cho M4 (đồng bộ chọn):** Panel đã có `expandedIds` ở Panel và Item **controlled** ⇒ M4 chỉ cần tính tập "ép mở" từ `selection` và truyền xuống; ID item ổn định `planet:<key>`/`angle:Ascendant`; `getInterpretationItemId(planetKey)` (M2) đã sẵn; nút "Xem trên biểu đồ" và liên kết "Đọc diễn giải" ở `SelectionDetail` thuộc M4; M3 không cần thêm ref/`data-*` cho mục: M4 chỉ truyền `expanded`. **Bàn giao cho M6:** vị trí khu vực đọc, đo layout 320–≥1024, tương phản, Narrator, zoom.

---

## 21. Audit Evidence Appendix

**Đã đọc:** `Sprint_F5_M3_Implementation_Plan_Prompt.md`; `Sprint_F5_Implementation_Plan.md` §7, §9, §10 M3, §15–§17; Evidence Matrix M2 (+ diff `c6b422e`); commit `d4961a6` (diff `interpretation.ts`, tests); `interpretation.ts` (M2); `page.tsx`, `ChartViewerShell.tsx`, `HouseDataNotice.tsx`, `SkipLink`, `Alert`, `Section`, `PlanetTable` (tiêu đề), `features/chart/index.ts`; `ChartViewerShell.test.tsx`, `page.test.tsx` (V5, V6), `page.unexpected-error.test.tsx`, `chart-flow.integration.test.tsx`; `frontend/e2e/chart.spec.ts` (locator), `playwright.config.ts`; `package.json`, `vite.config.ts`, `src/test/setup.ts`; `Frontend_Coding_Standards.md` §3–§5, §11, §13, §14, §15; `Frontend_Architecture_Specification.md` §15.3; `Frontend_UI_Specification.md` §7, §8, §12.6, §23.3; `docs/implementation/archive/sprint-f4/evidence/` (liệt kê) và Matrix F4 M10 (cách chụp); `docs/legal/` (chỉ license record, không có yêu cầu disclaimer).
**Đã chạy (không biến đổi repo):** `git status/log/diff`; M2 tests lại sau fix (`vitest run` 2 file: 38 pass; coverage `interpretation.ts` 100% dòng/hàm, 95.12% nhánh); `typecheck` (exit 0); thử nghiệm **trong `/tmp`**: (a) panel giả + prop + model ở `page.tsx` ⇒ 9 file/127 test xanh; (b) thêm effect `reportError` gộp ⇒ 5 file/46 test xanh (log báo lỗi xuất hiện ở V5, V7).
**Quan sát trang CI:** run #304 success trên `d4961a6` (đăng xuất, không đọc log từng bước).
**Không chạy:** `npm run build`, toàn bộ `vitest run`, E2E, lint toàn dự án sau fix; mọi test M3 (chưa tồn tại); không chụp ảnh nào (không có trình duyệt/Backend phù hợp trong sandbox).
**Tác dụng phụ:** `/tmp/spike` (ngoài repo), `node_modules` và `frontend/.env` (git bỏ qua); plan M2 stale trong clone của tôi đã xoá.
**[Open]/chưa xác minh:** Owner duyệt hoặc hoãn C-08 disclaimer; hành vi thật của focus/hash trên trình duyệt (jsdom không mô phỏng); QA thủ công responsive/accessibility ở M6. Số liệu Vitest đã xác minh sau M3.1 là 132 file / 1087 test; `vitest list` không hoàn tất trong môi trường Windows hiện tại.
