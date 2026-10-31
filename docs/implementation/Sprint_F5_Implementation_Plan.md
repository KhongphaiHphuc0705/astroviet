# Sprint F5 — Interpretation UI: Implementation Plan

## 1. Document Metadata

| | |
|---|---|
| **Tiêu đề** | FE Sprint F5 — Interpretation UI — Implementation Plan |
| **Sprint** | F5 (sau F4 *Natal Chart Viewer*; Backend Sprint 4 *Interpretation Engine* là nguồn dữ liệu) |
| **Trạng thái** | **Draft — Pending Owner Approval** (chưa được duyệt; không milestone nào được bắt đầu trước khi owner duyệt) |
| **Ngày** | 2026-10-30 |
| **Nhánh / HEAD đã audit** | `dev` @ `cfd4247` ("finalize sprint f4 closure & complete gaps registry") |
| **Phiên bản xác minh** | `frontend/package.json` = `0.3.0`; `backend/package.json` = `0.4.0` |
| **Tác giả** | Claude (vai trò: Senior Frontend Architect / QA / Technical Planner) |
| **Tài liệu liên quan** | `docs/implementation/Sprint_F4_Implementation_Plan.md` (v1.1, `SPRINT F4 CLOSED`), `docs/implementation/archive/sprint-f4/Sprint_F4_M10_Exit_Criteria_Evidence_Matrix.md`, `docs/frontend/Frontend_UI_Specification.md`, `docs/product/PRD.md` (FR-07), `docs/implementation/Sprint_4_Interpretation_Engine_Implementation_Plan.md`, `Confirmation.md` (D-F5-01…09 là đề xuất; xem trạng thái và điều kiện trong tài liệu nguồn) |

**Lịch sử sửa đổi**

| Phiên bản | Ngày | Nội dung |
|---|---|---|
| 0.1 | 2026-10-30 | Bản nháp đầu, dựa trên audit repo `dev` @ `cfd4247` và các quyết định owner ngày 2026-10-30 |

**Khuyến nghị triển khai đã đối chiếu trong lần review này** — chưa thay thế phê duyệt chính thức của Owner:

1. Dùng D-F5-01…09 trong `Confirmation.md` là quyết định chính thức.
2. Thêm bước seed nội dung diễn giải vào CI để E2E Backend thật kiểm tra dữ liệu Published.
3. Ghi cảnh báo Mặt Trăng (KG-S4-06) thành Known Gap; FG-01 giúp nhận biết giờ sinh nhưng chưa đủ để kết luận uncertainty của Moon nếu chưa có quyết định/hợp đồng cho FG-07. F5 dùng chú thích Nhà/góc trung tính, không có mini-sprint Backend.
4. Dùng disclosure đơn giản (nút `aria-expanded`) và liên kết nhảy trong trang, không dùng ARIA tabs.

---

## 2. Executive Summary

**F5 giao gì.** Một khu vực đọc "Diễn giải" nằm trong Chart Viewer, trình bày đúng những diễn giải Backend đã trả về trong `ChartResponse.interpretations[]`: Hành tinh-trong-Cung, Hành tinh-trong-Nhà và Cung Mọc (Ascendant)-trong-Cung. Khu vực này đồng bộ một chiều-có-kiểm-soát với Chart Wheel và Planet Table qua **cùng một state selection** đã có ở F4 (`selection.ts`), có tổng quan, nhóm "Cốt lõi" (Sun/Moon/Ascendant), nhóm hành tinh, nội dung mở rộng được, và trạng thái suy giảm trung thực.

**Vì sao sau F4.** F4 đã có lá số, wheel, ba bảng, selection thuần và layout responsive; hiện Frontend **bỏ qua hoàn toàn** `interpretations` (VM không tham chiếu). F5 thêm lớp đọc mà không phá viewer.

**Dùng BE Sprint 4 thế nào.** Không thêm endpoint, không đổi `ChartResponse`, không đổi Backend `0.4.0`. Frontend chỉ tra cứu theo `subjectType + subjectKey`; **không** tự chọn hay suy diễn nội dung.

**Kết quả người dùng.** Chọn Mars trên wheel → Mars nổi bật ở wheel và bảng, mục "Sao Hỏa" trong khu vực Diễn giải được làm nổi bật và mở ra; người dùng đọc, rồi quay về biểu đồ mà không mất ngữ cảnh.

**Phụ thuộc & rủi ro chính.** (1) CI hiện **không nạp** nội dung diễn giải (đã xử lý bằng F5.M1). (2) Không có diễn giải cho góc chiếu, Nhà độc lập, tổng hợp — UI phải nói thật. (3) Không có trường đáng tin về giờ sinh → không có cảnh báo Mặt Trăng (Known Gap). (4) Bố cục F4 vừa được siết ở M9 → thêm khu vực đọc cần đo trước khi chốt.

---

## 3. Current-State Audit

Mọi mục dưới đây là **sự kiện đã xác minh trên bản clone `dev` @ `cfd4247`** trừ khi gắn nhãn *(giả định)*.

### 3.1 Tình trạng F4 và baseline

| Hạng mục | Kết quả | Nguồn |
|---|---|---|
| F4 | `SPRINT F4 CLOSED — OFFICIALLY ACCEPTED BY OWNER` (2026-10-30), 11/11 milestone | `docs/implementation/Sprint_F4_Implementation_Plan.md` đầu file + dòng ~880 |
| Registry Known Gaps F4 | Đã đủ: FG-01…14, KG-M6-08, KG-M10-03, KG-M10-05, KG-CI-NODE20 | `…/archive/sprint-f4/Sprint_F4_M10_Exit_Criteria_Evidence_Matrix.md` (~dòng 238–360) |
| Baseline số liệu | 130 file / 1049 test Vitest, 38 E2E / 7 spec — **theo tài liệu F4**; trong audit này mình **chỉ** chạy lại được `npm run typecheck` (exit 0) và `npm run format:check` (pass). Lần chạy `vitest run` trong sandbox không kết thúc trong giới hạn thời gian ⇒ **số test baseline chưa được tái xác minh ở đây; phải tái xác minh tại F5.M1 (CI)** | `frontend/package.json` scripts; lần chạy audit |
| Tag/release `0.3.0`, PR đang mở | Chưa quyết định (handoff A4) | handoff F4 |

### 3.2 Hợp đồng dữ liệu (xem chi tiết Mục 6)

- `ChartInterpretationDto = { subjectType, subjectKey, language, bodyText, tone?: string | null }` — `frontend/src/features/chart/api/types.ts` (~dòng 119).
- `ChartResponse.interpretations: ChartInterpretationDto[]`, `interpretationVersion: string | null` (~dòng 145–146).
- `KNOWN_INTERPRETATION_SUBJECT_TYPES = ["PlanetInSign","AngleInSign","PlanetInHouse"]` (~dòng 57).
- Nội dung nguồn: `backend/prisma/content/interpretations.vi.json` — `language: vi`, `version: 1.0`, `status: Published`, `contentSource: Hybrid`, **252 mục** = 120 `PlanetInSign` (10×12) + 120 `PlanetInHouse` (10×12) + 12 `AngleInSign`. `bodyText` dài 238–426 ký tự, **không có xuống dòng, không có markdown, không có `tone`** (đã đo bằng script).

### 3.3 Frontend hiện có (tái sử dụng được)

| Thành phần | Đường dẫn | Ghi chú |
|---|---|---|
| Selection thuần | `frontend/src/features/chart/model/selection.ts` | `Selection = none | planet | aspect`; reducer + `resolveSelection`, `computeEmphasis`, `buildLiveMessage` (một live region duy nhất) |
| Nơi giữ state | `…/ui/ChartViewerShell/ChartViewerShell.tsx` | `useReducer(interactionReducer)`; **không** có Context/Zustand mới; `useState` cho zoom |
| VM | `…/model/chartViewModel.ts` | `PlanetVM.key = planetName` (vd. `Sun`), `sign: GlyphLabel`, `houseNumber`, `AngleVM.key` (vd. `Ascendant`); **không** có `interpretations` |
| Chi tiết chọn | `…/ui/SelectionDetail/SelectionDetail.tsx` | tóm tắt ngắn; có `sectionRef` + focus management |
| Thông báo thiếu Nhà | `…/ui/ChartViewerShell/HouseDataNotice.tsx` | đang nói "cần giờ sinh" |
| Layout F4 | `ChartViewerShell.tsx` | container query `[@container(min-width:1010px)]` 2 cột (wheel trái, bảng phải `#chart-data-tables`), skip link, sticky chỉ khi cao ≥ 1000px |
| Dữ liệu | `src/pages/app/charts/detail/page.tsx` | `useChartQuery` → `toChartViewModel(query.data)` → `ChartViewerShell` |
| Fixtures | `…/api/mocks/fixtures.ts` + `fixtures.contract.test.ts` | cả hai fixture có `interpretations` + `interpretationVersion: "1.0"`; có test hợp đồng khoá |
| Primitive UI | `src/shared/ui/*` | Alert, Badge, Button, Card, EmptyState, Skeleton, SkipLink, Stack, Section… — **không có Tabs/Accordion** |
| Hook | `src/shared/hooks/useMediaQuery.ts` | dùng cho layout |
| Báo lỗi | `src/shared/lib/report-error.ts`, `error-messages.ts` | dùng cho dữ liệu hỏng, không dùng `.message` thô |

### 3.4 Quality gates hiện có (đã đọc)

`frontend/package.json`: `lint` (`eslint .`), `format:check`, `typecheck` (`tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit`), `test` (`vitest run --passWithNoTests`), `test:coverage`, `build` (`tsc -p tsconfig.app.json --noEmit && vite build`), `test:e2e` (`playwright test`). CI: `.github/workflows/frontend-ci.yml` (Postgres service, `prisma:generate`, `prisma:deploy`, build backend, `node dist/server.js`, `npx playwright install`, `npm run test:e2e`, upload `backend.log` và Playwright report khi lỗi).

### 3.5 Mâu thuẫn / khoảng trống phát hiện (ảnh hưởng F5)

| ID | Phát hiện | Hệ quả | Xử lý trong plan |
|---|---|---|---|
| A-1 | `frontend-ci.yml` chỉ chạy `prisma:deploy`; nội dung diễn giải nạp bằng script riêng `prisma:seed:content` (`backend/package.json`, `backend/prisma/seed-content.ts`), CI **không** gọi. Lookup trả `{version:null, items:[]}` nếu chưa có bản Published (`interpretation-lookup.service.ts`) | E2E "Mars" sẽ **không có dữ liệu**, hoặc pass rỗng | **F5.M1** thêm bước seed + khẳng định `interpretationVersion` khác `null` |
| A-2 | `Frontend_UI_Specification.md` §12.6 "Interpretation Card" mô tả `source: human|ai` (badge AI), `content` rich text, accordion "kỹ thuật", và lỗi interpretation **tách API** | Mâu thuẫn hợp đồng thật: không có trường `source`, nội dung là text thuần, diễn giải **nằm trong** `ChartResponse` (lỗi DB → cả request chart lỗi, R3) | Hợp đồng thật thắng; sửa spec ở F5.M8 (as-built, tối thiểu) |
| A-3 | `Selection` không có kind `angle`/`house`; góc (Ascendant) hiện chỉ hiển thị, không chọn được | F5-04/F5-10 muốn Ascendant có điểm vào | Quyết định P-02 (Mục 15): Ascendant có điểm vào trong khu vực Diễn giải, **không** thêm selection trên wheel ở F5 |
| A-4 | PRD FR-07: "vị trí hành tinh/nhà/góc chiếu" ghép với diễn giải; Backend MVP **không** có diễn giải góc chiếu, Nhà độc lập, tổng hợp | Phạm vi PRD rộng hơn dữ liệu | D-F5-01: chỉ giao cái có; phần còn lại vào backlog (Mục 4, 14) |
| A-5 | Backend bỏ qua (log warn) subject không có record → trả mảng **thiếu** mục nhưng vẫn 200 | UI không thể phân biệt "chưa soạn" với "lỗi dữ liệu" ngoài heuristic | Mục 6.4: quy tắc phân loại + `reportError` cho trường hợp bất thường |
| A-6 | `HouseDataNotice` nói "cần giờ sinh"; Backend còn thiếu Nhà do **vĩ độ cao** (`high-latitude-policy.ts`, ngưỡng 66.5°) hoặc hệ nhà không hội tụ | Không được suy ra "người dùng không biết giờ sinh" từ `isHouseDataAvailable=false` | Sửa copy `HouseDataNotice` và chú thích F5 theo hướng trung tính, không quy nguyên nhân nếu API không xác định |
| A-7 | README trên `main` ghi giấy phép MIT, "Frontend (Planned)", module `interpretation` riêng — trái quyết định AGPL-3.0 và "code ở module `chart`". Chưa so với `dev` | Ngoài phạm vi F5 | Ghi vào Known Gaps (KG-F5-06), không sửa trong F5 |
| A-8 | Handoff F4 liệt kê A1–A3 là việc còn lại; `cfd4247` đã hoàn tất | Plan dùng trạng thái repo, không dùng handoff | — |

**Đã xác minh thêm:** `fixtures.ts` có 21 mục (fixture đầy đủ) và 10 mục (fixture không Nhà); `GlyphLabel` (`model/labels.ts`) có trường `key`, nên `PlanetVM.sign.key` rất có thể là định danh cung. *(Giả định còn lại)*: giá trị `sign.key` trùng enum cung dùng trong khoá Backend (`Aries`…) — **xác nhận ở F5.M2** bằng test; nếu không trùng, thêm ánh xạ/`signKey` là thay đổi nhỏ có kiểm soát (ghi nhận là sửa file F4).

---

## 4. Goals and Non-Goals

### 4.1 Mục tiêu đo được

| ID | Mục tiêu | Cách đo |
|---|---|---|
| G1 | Hiển thị 100% mục diễn giải hợp lệ có trong `ChartResponse` cho chart đầy đủ (fixture đầy đủ: 21 mục — đã xác minh) | test contract + component |
| G2 | Selection hành tinh ở wheel/bảng làm nổi bật & mở đúng mục diễn giải, không thêm state selection thứ hai | test reducer/shell + E2E |
| G3 | Chart thiếu Nhà vẫn hiển thị `PlanetInSign`, không hiển thị `PlanetInHouse`, kèm chú thích trung tính | test + E2E degraded |
| G4 | 0 hồi quy F4 (toàn bộ test F4 xanh, 38 E2E xanh) | CI |
| G5 | E2E Backend thật chứng minh dữ liệu diễn giải thật được hiển thị | `e2e/interpretation.spec.ts` |
| G6 | A11y: đọc/điều hướng bằng bàn phím, không phụ thuộc màu | test + QA thủ công có ghi bằng chứng |

### 4.2 Non-goals (đã khoá)

Không tính toán chiêm tinh ở FE; không tái hiện logic chọn diễn giải; không đổi Backend/API/DB/nội dung; không thêm dependency; không Knowledge Base; không admin/authoring; không AI runtime; không diễn giải góc chiếu / Nhà độc lập / cusp / pattern / tổng hợp "đọc toàn bộ lá số"; không Chiron/Lilith/Nodes; không đa ngôn ngữ; không hiển thị `tone`, `interpretationVersion`, `contentSource`; không hardcode văn bản diễn giải trong component; không sửa `README` `main`.

---

## 5. Requirements Traceability Matrix

Phân loại: **MH** Must Have · **SH** Should Have · **DEF** Deferred · **DEP** Backend/Content Dependency · **OD** Owner Decision.

| ID | Yêu cầu | Giá trị | Hiện trạng | Triển khai đề xuất | Phụ thuộc | Bằng chứng | Phân loại |
|---|---|---|---|---|---|---|---|
| F5-01 | Overview | Người dùng thấy ngay có gì để đọc | Chưa có | `InterpretationOverview`: số mục theo nhóm, liên kết nhảy, disclaimer ngắn, ghi chú "chưa có": góc chiếu; **không** tổng hợp tính cách | F5.M2–M3 | AC-01…03 | MH |
| F5-02 | Sun | Điểm vào nổi bật | Dữ liệu có (`Sun_in_{Sign}`, `Sun_in_House_n`) | Mục "Mặt Trời" trong nhóm Cốt lõi | M2–M3 | AC-04 | MH |
| F5-03 | Moon | Điểm vào riêng | Dữ liệu có; **độ bất định theo giờ sinh không có trong API** | Mục "Mặt Trăng"; không cảnh báo độ chắc chắn; ghi KG-F5-01 | FG-01 + quyết định/hợp đồng FG-07 nếu cần cảnh báo | AC-05, AC-18 | MH (nội dung) · DEP (cảnh báo) |
| F5-04 | Ascendant | Điểm vào cung mọc | `Ascendant_in_{Sign}` (12 mục); chỉ có khi có Nhà | Mục "Cung Mọc" trong Cốt lõi; không coi là hành tinh; thiếu Nhà → trạng thái "chưa khả dụng" | M2–M3, M5 | AC-06, AC-17 | MH |
| F5-05 | Hành tinh | Đọc sign + house từng hành tinh | Dữ liệu có cho 10 thân | Nhóm "Các hành tinh" (Mercury…Pluto) mỗi mục gồm đoạn Cung + đoạn Nhà | M2–M4 | AC-07, AC-08 | MH |
| F5-06 | House | — | Chỉ `PlanetInHouse`; **không** diễn giải Nhà độc lập/cusp | Hiển thị `PlanetInHouse` trong từng hành tinh; không tạo nhóm "Nhà" | DEP (content) | AC-09 | MH (phần có) · DEP (phần chưa có) |
| F5-07 | Aspect | — | Có dữ liệu góc chiếu (F4), **không** có diễn giải | Không nhóm/nav; một dòng ghi chú ở Overview; không placeholder trong điều hướng | DEP (BE/content) | AC-10 | DEP · DEF |
| F5-08 | Categorized sections | Tìm nhanh | — | Nhóm UI: Tổng quan · Cốt lõi · Các hành tinh; **không** nhóm rỗng | M3 | AC-11 | MH |
| F5-09 | Expandable | Đọc có kiểm soát | Chưa có primitive | `InterpretationItem` = nút `aria-expanded` + vùng nội dung (không dependency) | M3 | AC-12, AC-24 | MH |
| F5-10 | Chart↔Interpretation navigation | Giữ ngữ cảnh | Selection có; chưa nối | Selection → mục nổi bật + mở (không cướp focus); liên kết "Đọc diễn giải" và "Về biểu đồ" | M4 | AC-13…16 | MH |
| F5-11 | UI states | Trung thực | HouseDataNotice có | Loading/empty/partial/unavailable/error (Mục 7.6) | M5 | AC-17…22 | MH |
| F5-12 | Rendering/ngôn ngữ | An toàn | Text thuần `vi` | Render text node trong `<p>`; không HTML/markdown; entry `language ≠ "vi"` bị loại + ghi nhận | M2–M3 | AC-23 | MH |
| NF-1 | Responsive | — | F4 có 3 chế độ | Khu vực đọc theo luồng dọc; đo lại ngưỡng 2 cột | M6 | AC-25 | MH |
| NF-2 | A11y | — | mẫu M8–M9 | Tái dùng + bổ sung | M6 | AC-24…27 | MH |
| NF-3 | E2E thật | — | 38 E2E, không cover diễn giải | Spec mới + seed CI | M1, M7 | AC-28 | MH |
| NF-4 | Docs/closure | — | — | Spec §12.6, CHANGELOG, Gaps, Matrix | M8 | AC-30 | MH |
| X-1 | Đọc toàn bộ lá số (synthesis) | — | Không có content | Backlog | BE/content | — | DEF |
| X-2 | Wheel-select Ascendant/House | — | Selection chỉ planet/aspect | Backlog sau F5 | — | — | DEF (P-02) |
| X-3 | Cảnh báo Mặt Trăng | — | Thiếu trường giờ sinh và uncertainty đáng tin cậy trên ChartResponse | KG-F5-01 | FG-01 + FG-07/contract decision | — | DEP |

---

## 6. API and Data Contract Analysis

### 6.1 Cấu trúc thực tế
`ChartResponse` (14 trường, đã khoá bởi `fixtures.contract.test.ts` và `e2e/chart.spec.ts`) chứa `interpretations[]` và `interpretationVersion`. Mỗi mục: `subjectType` (rời rạc 3 giá trị), `subjectKey`, `language`, `bodyText`, `tone?`.

### 6.2 Ngữ pháp khoá (R1, Backend) — đã đối chiếu với JSON nguồn
- `PlanetInSign`: `{Planet}_in_{Sign}` (vd. `Sun_in_Aries`, ví dụ trong fixture: `Sun_in_Capricorn`)
- `PlanetInHouse`: `{Planet}_in_House_{n}` (n = 1…12)
- `AngleInSign`: `Ascendant_in_{Sign}` (12 mục trong JSON)

**Quy tắc FE:** ghép khoá từ định danh ổn định (`PlanetVM.key`, định danh cung, `houseNumber`) **trong một hàm duy nhất**, rồi tra `Map` dựng từ DTO; **không** parse chuỗi `subjectKey`, **không** phụ thuộc thứ tự mảng, **không** dùng nhãn tiếng Việt làm khoá (D-F5-06). Hàm ghép khoá có contract test với toàn bộ 252 khoá trong JSON.

### 6.3 Phiên bản
`interpretationVersion` ở cấp `ChartResponse` (chuỗi hoặc `null`); khác `snapshotInterpretationVersion` (không có trong DTO FE). Chart đã lưu "ghim" phiên bản; `save=false`/chưa ghim dùng bản Published mới nhất (`interpretation-lookup.service.ts`). **FE không hiển thị** và không suy luận từ phiên bản (D-F5-04).

### 6.4 Hành vi suy giảm và lỗi
| Tình huống | Backend | UI F5 |
|---|---|---|
| Không có bản Published | `version:null, items:[]`, 200 | Trạng thái **"Nội dung diễn giải chưa được phát hành"** (info, không phải lỗi chart). Trong E2E CI phải **không** xảy ra (AC-28) |
| Thiếu Nhà (`isHouseDataAvailable=false`) | Bỏ `PlanetInHouse` + `AngleInSign` (fixture không-nhà: 10 mục — đã xác minh trong `fixtures.ts`) | Hiển thị `PlanetInSign`; một chú thích trung tính; **không** log lỗi |
| Hành tinh có trong chart, thiếu `PlanetInSign` khi `version ≠ null` | Backend skip + warn, vẫn 200 | Mục hiện "Chưa có nội dung cho mục này"; `reportError` một lần (dữ liệu bất thường, không bình thường hoá) |
| `PlanetInHouse` thiếu khi Nhà có sẵn | tương tự | Như trên, cho phần Nhà của mục đó |
| Entry sai: `subjectType` lạ, `bodyText` rỗng/không phải string, `language ≠ vi`, khoá trùng | — | Loại khỏi model; ghi `issues` nội bộ + `reportError`; **không** crash, **không** render |
| Lỗi hạ tầng khi tra nội dung (R3) | HTTP 500 cho **cả** request chart | Xử lý bởi luồng lỗi chart F4 hiện có (`getErrorMessage`); không có lỗi diễn giải riêng |
| Selection tham chiếu khoá không còn | — | `resolveSelection` đã đưa về `none` (F4) |

### 6.5 Thay đổi hợp đồng
**Không đề xuất** thay đổi Backend/API. Thay đổi FE nhỏ có thể cần: thêm `signKey` vào `PlanetVM` nếu giả định ở 3.5 sai (xem F5.M2). Mọi đề xuất Backend (FG-01 `isBirthTimeKnown`, nội dung aspect/house/synthesis, `tone`) nằm ở Mục 14–15, **không** là việc F5.

---

## 7. UX and Information Architecture

> Toàn bộ bố cục dưới đây là **đề xuất chưa được xác thực trên UI thật**; F5.M6 đo lại trước khi chốt.

### 7.1 Vị trí
Thêm một `<section id="chart-interpretation">` **toàn chiều rộng, nằm sau lưới hai cột của F4** (sau cột bảng), không chen vào cột wheel/bảng, không đổi container query, sticky hay `Container size="wide"` của F4. Lý do: giữ nguyên các quyết định đã đo ở M9 (D-M9-04/05/06); `bodyText` ngắn (≤ 426 ký tự) nên khu vực đọc không cần cột riêng. Nếu F5.M6 cho thấy người dùng phải cuộn quá xa, phương án thay thế (đặt trong cột phải trước các bảng) là thay đổi có đo đạc, không phải mặc định.

### 7.2 Phân cấp thông tin (taxonomy UI ≠ domain id)
```
h2 Diễn giải
 ├─ Tổng quan (không phải mục điều hướng; luôn ở đầu)
 │    disclaimer ngắn · "Có N diễn giải cho lá số này" · liên kết nhảy tới nhóm/mục
 │    ghi chú: diễn giải góc chiếu / tổng hợp chưa có nội dung
 ├─ h3 Cốt lõi:   Mặt Trời · Mặt Trăng · Cung Mọc
 └─ h3 Các hành tinh: Thủy · Kim · Hỏa · Mộc · Thổ · Thiên Vương · Hải Vương · Diêm Vương
      (mỗi mục h4 = nút disclosure; bên trong: "Theo cung" + "Theo nhà")
```
- **Không** tạo nhóm "Nhà" hay "Góc chiếu" (không có nội dung ⇒ không có mục điều hướng rỗng).
- Nhóm không có mục nào được hiển thị (vd. Cung Mọc khi thiếu Nhà) thì **mục đó** hiện trạng thái "chưa khả dụng", còn **nhóm** vẫn giữ nếu còn mục khác.

### 7.3 Sun / Moon / Ascendant
Ba mục Cốt lõi, mở sẵn (default expanded). Mặt Trời/Mặt Trăng: đoạn "Theo cung" (`PlanetInSign`) + đoạn "Theo nhà" (`PlanetInHouse`, nếu Nhà có). Cung Mọc: một đoạn (`AngleInSign`); khi không có dữ liệu góc: "Dữ liệu Cung Mọc chưa khả dụng cho lá số này." (copy trung tính, câu chữ chốt ở M3). **Không** có cảnh báo độ chắc chắn Mặt Trăng (KG-F5-01).

### 7.4 Hành tinh khác
Mỗi mục là disclosure, **mặc định đóng**, cho phép mở nhiều mục cùng lúc; mục đang được chọn luôn hiển thị mở.

### 7.5 Nội dung (F5-12)
Mỗi `bodyText` là một `<p>` (React text node; F4 đã kiểm bằng grep là không có `dangerouslySetInnerHTML` — F5 giữ gate này bằng grep ở Mục 12). Không markdown, không rich text, không Badge nguồn/AI, không `tone`. Giọng văn là trách nhiệm nội dung (D-F5-04), FE không sửa.

### 7.6 Ma trận trạng thái
| Trạng thái | Hiển thị |
|---|---|
| Loading chart | Skeleton F4 hiện có (không thêm request) |
| Có đầy đủ | Overview + 2 nhóm |
| `version = null` / mảng rỗng | Một `Alert` info "Nội dung diễn giải chưa được phát hành"; viewer vẫn dùng bình thường |
| Một phần (thiếu mục) | Mục thiếu có dòng "Chưa có nội dung cho mục này"; các mục khác bình thường |
| Thiếu Nhà | Chú thích trung tính (một lần, ở Overview) + "Theo nhà" ẩn; Cung Mọc "chưa khả dụng" |
| Entry hỏng | Loại bỏ + `reportError`; không thông báo kỹ thuật cho người dùng |
| Lỗi API | Luồng lỗi chart F4 (không có lỗi diễn giải riêng) |

Copy đề xuất, chưa được ghi nhận là Owner duyệt: chú thích Nhà "Dữ liệu Nhà và một số góc trong lá số này chưa khả dụng. Bạn vẫn có thể xem các diễn giải theo cung."; disclaimer "Chiêm tinh là một góc nhìn để bạn khám phá và suy ngẫm về bản thân, không phải kết luận tuyệt đối về con người hay tương lai. Hãy đón nhận những nội dung phù hợp với trải nghiệm của chính bạn." — chỉ ở Overview, một lần. Không tìm thấy yêu cầu pháp lý/disclaimer bắt buộc trong `docs/product/` (PRD còn Draft); xác thực copy sản phẩm trước release.

### 7.7 Responsive (đề xuất)
Mọi viewport: luồng dọc một cột (không tab). Dưới `md`: Overview có liên kết nhảy; `SelectionDetail` có liên kết "Đọc diễn giải". Kiểm các ngưỡng F4 (`<768 / 768–1023 / ≥1024`).

---

## 8. Interaction and State Model

### 8.1 Mô hình chọn
**Giữ nguyên một nguồn sự thật**: `interactionState.selection` trong `ChartViewerShell` (reducer `selection.ts`). F5 **không** thêm state chọn thứ hai, Context hay store. Khu vực Diễn giải nhận `selection` (đã `resolveSelection`) và `onSelectPlanet` qua props.

State cục bộ mới (chỉ UI, trong `InterpretationPanel`): `expandedKeys: Set<ItemId>` do người dùng mở/đóng. `ItemId` là định danh UI ổn định (`planet:Sun`, `angle:Ascendant`), **không** phải `subjectKey`.

**Hiển thị mở** = `userExpanded ∪ defaultExpanded(Cốt lõi) ∪ {mục của selection}`. Chọn khác ⇒ mục cũ không bị ép mở nữa nhưng nếu người dùng đã mở thì giữ; "Bỏ chọn" không đóng mục nào. Selection không được lưu qua route (như F4: reset khi đổi chart, `key={chartId}`).

Không cần reducer mới cho F5 (Escape/clear đã có).

### 8.2 Đặc tả tương tác Mars (acceptance)
1. Người dùng chọn Mars (click/Enter/Space ở wheel hoặc ở hàng Planet Table) → `dispatch(select planet Mars)` (đường F4).
2. Wheel: Mars có halo/viền (F4); Planet Table: hàng Mars `aria-pressed`/được đánh dấu (F4).
3. `SelectionDetail` hiện chi tiết ngắn + liên kết **"Đọc diễn giải"** (mới).
4. Khu vực Diễn giải: mục **Sao Hỏa** được đánh dấu (viền + nhãn văn bản "Đang chọn", `aria-current="true"`; không chỉ màu) và **mở**; **không** cuộn tự động, **không** dời focus.
5. Live region F4 vẫn đọc "Đã chọn Sao Hỏa ở …" — **không** đọc nội dung diễn giải.
6. Kích hoạt "Đọc diễn giải" → cuộn tới và focus vào tiêu đề mục Sao Hỏa (nút disclosure).
7. Mục Sao Hỏa có nút **"Xem trên biểu đồ"**; kích hoạt → focus về phần tử wheel của Mars (hoặc hàng bảng nếu wheel không focus được) mà không đổi selection.
8. Escape (F4) hoặc "Bỏ chọn" → mục hết đánh dấu; nội dung người dùng đã mở vẫn mở.

### 8.3 Các tương tác khác
- Chọn từ Planet Table / từ chính Diễn giải: nhấn nút "Chọn trên biểu đồ" **không** cần thiết ở F5; chỉ có hướng chọn → hiển thị và hướng "Xem trên biểu đồ" (không đổi selection). *(Nếu owner muốn bấm tiêu đề mục để chọn hành tinh, là thay đổi nhỏ ở M4, ghi ở Mục 15 P-04.)*
- Mục không có diễn giải: vẫn đánh dấu được khi chọn, hiển thị "Chưa có nội dung".
- Chọn góc chiếu (kind `aspect`): khu vực Diễn giải không có mục tương ứng ⇒ không đánh dấu gì (Overview đã nêu chưa có diễn giải góc chiếu).
- Ascendant: không chọn được trên wheel (X-2); điểm vào là mục trong Diễn giải + liên kết nhảy từ Overview.

### 8.4 Focus & bàn phím
Disclosure: `<button aria-expanded aria-controls>` trong heading; Enter/Space; thứ tự Tab theo DOM; focus ring dùng token hiện có; không bẫy focus. Liên kết nhảy là `<a href="#…">` + focus có chủ đích vào phần tử đích (`tabIndex={-1}`), theo mẫu "Chuyển tới bảng dữ liệu" của F4.

---

## 9. Frontend Architecture and File-Level Plan

Đường dẫn dưới đây thuộc `frontend/src/features/chart/` trừ khi ghi khác. **[verified]** = đường dẫn/ký hiệu đã kiểm; **[candidate]** = tên đề xuất.

| Đường dẫn | Mới/Sửa | Trách nhiệm | Thay đổi | Test liên quan |
|---|---|---|---|---|
| `model/interpretation.ts` [candidate] | Mới | Thuần TS (không React/DOM/API): `buildInterpretationModel(dto.interpretations, dto.interpretationVersion, vm)` → `{status, groups, itemsById, issues}`; hàm ghép khoá duy nhất; phân loại thiếu/hỏng | Mới | `model/interpretation.test.ts` + contract với `backend/prisma/content/interpretations.vi.json` |
| `ui/InterpretationPanel/InterpretationPanel.tsx` [candidate] | Mới | Khung `section#chart-interpretation`, giữ `expandedKeys`, nhận `model`, `selection` | props: `model`, `selection`, `onViewOnChart(key)` | `…test.tsx` |
| `ui/InterpretationPanel/InterpretationOverview.tsx` [candidate] | Mới | Overview, disclaimer, liên kết nhảy, ghi chú "chưa có" | — | test |
| `ui/InterpretationPanel/InterpretationItem.tsx` [candidate] | Mới | Disclosure một mục (cung + nhà), đánh dấu "Đang chọn" | `aria-expanded`, `aria-current` | test |
| `ui/InterpretationPanel/index.ts` [candidate] | Mới | export | — | — |
| `ui/ChartViewerShell/ChartViewerShell.tsx` [verified] | Sửa | Nhận `interpretation` (model) qua prop tuỳ chọn; render Panel sau lưới; truyền `selection`; handler "Xem trên biểu đồ" | Thay đổi nhỏ, additive; không đổi reducer | `ChartViewerShell` tests hiện có + mới |
| `ui/SelectionDetail/SelectionDetail.tsx` [verified] | Sửa | Thêm liên kết "Đọc diễn giải" khi `kind="planet"` và có mục | additive | `SelectionDetail.test.tsx` |
| `ui/ChartViewerShell/HouseDataNotice.tsx` [verified] | Sửa | Copy trung tính, không gán thiếu Nhà/góc cho việc không rõ giờ sinh | additive | `HouseDataNotice.test.tsx` |
| `src/pages/app/charts/detail/page.tsx` [verified] | Sửa | Dựng `interpretation` model từ `query.data` (cùng `useMemo` với VM), truyền xuống Shell | additive | `page.test.tsx` |
| `model/chartViewModel.ts` [verified] | **Chỉ nếu** giả định 3.5 sai: thêm `PlanetVM.signKey` | additive | `chartViewModel.test.ts` |
| `index.ts` của feature [candidate] | Sửa | export model/Panel nếu cần | — | — |
| `e2e/interpretation.spec.ts` [candidate] | Mới | E2E Backend thật (Mục 11) | — | — |
| `.github/workflows/frontend-ci.yml` [verified] | Sửa | Thêm bước seed nội dung sau `prisma:deploy` | Mục F5.M1 | CI |
| `docs/frontend/Frontend_UI_Specification.md` [verified] | Sửa | §12.6, §13 as-built tối thiểu | F5.M8 | — |
| `frontend/CHANGELOG.md`, `frontend/package.json`, lockfile [verified] | Sửa | `0.4.0` nếu owner xác nhận ở M8 | F5.M8 | — |

**Không đụng:** `selection.ts` (theo khuyến nghị P-02/P-04), wheel/table geometry, shared/ui primitives (không thêm Accordion/Tabs), Backend.

**Component contracts (tóm tắt):** `InterpretationPanel(props: {model; selection; onViewOnChart(planetKey)})` — state: `expandedKeys`; không gọi API; không import từ `pages/`. `InterpretationItem(props: {item; expanded; selected; onToggle})` — state: không. Phụ thuộc một chiều: `ui → model`; `model/interpretation.ts` chỉ import kiểu từ `api/types` và `chartViewModel`.

**Kiến trúc dữ liệu:** không hook/adapter mới — `useChartQuery` đã trả `ChartResponse` đầy đủ; một request, không thêm. Mapper thuần `buildInterpretationModel` đủ (không tạo lớp trừu tượng khác).

---

## 10. Milestones and Execution Order

Quy ước: mỗi milestone có commit riêng, CI xanh trên commit chứa mã; plan milestone là bản thảo tạm, chỉ Evidence Matrix được lưu `docs/implementation/archive/sprint-f5/` (theo quy ước đã dùng ở F4). **Evidence ≠ self-certification**: lệnh nào không chạy được trong sandbox (E2E, coverage, Backend/Postgres) ghi là bằng chứng CI.

### F5.M1 — CI Seed & Contract Baseline [DONE — 2026-10-31]
- **Trạng thái:** **COMPLETED** (Commit `4b70422`, CI Run #41155563064 Passed; Evidence Matrix tại `docs/implementation/archive/sprint-f5/Sprint_F5_M1_Exit_Criteria_Evidence_Matrix.md`).
- **Mục tiêu:** E2E Backend thật có nội dung diễn giải; chốt baseline.
- **Tasks:** (1) đọc `backend/prisma/seed-content.ts` (tham số `--file`, `--validate-only`, tính idempotent, yêu cầu `DATABASE_URL`/`tsx`); (2) thêm bước `npm run prisma:seed:content` (working-directory `backend`) vào `frontend-ci.yml` ngay sau `prisma:deploy`, trước khi khởi động backend; (3) tái xác minh baseline (130 file/1049 test, 38 E2E) trên CI; (4) probe tạm thời trong E2E hiện có hoặc spec mới: chart tạo qua `POST /charts/natal?save=true` có `interpretationVersion = "1.0"` và 21 mục (chart đủ Nhà), 10 mục (chart không rõ giờ sinh); (5) xác nhận ở runtime `PlanetVM.sign` có định danh cung (giả định 3.5).
- **Files:** `.github/workflows/frontend-ci.yml`; không đụng mã ứng dụng.
- **Tiên quyết:** owner duyệt plan. **Phụ thuộc:** không.
- **Acceptance:** CI log hiển thị seed thành công (252 mục) và toàn bộ job xanh; probe xác nhận số mục kỳ vọng **hoặc** ghi lại số thực tế khác kèm giải thích.
- **Gates:** toàn bộ Mục 12. **Evidence:** run CI + trích log seed + kết quả probe. **DoD:** workflow commit, baseline được ghi, giả định `sign.key` đã chốt.
- **Rủi ro:** seed yêu cầu bản dựng/`tsx` backend trong job (kiểm tra); đổi workflow không được làm yếu gate nào.

### F5.M2 — Interpretation Model (thuần)
- **Mục tiêu:** model + hàm ghép khoá + phân loại trạng thái, có contract test.
- **Tasks:** `model/interpretation.ts`; các nhóm Cốt lõi/Hành tinh; phân loại thiếu/hỏng/`language≠vi`/trùng khoá; `issues`; (nếu cần) `PlanetVM.signKey`.
- **Tiên quyết:** M1 (giả định `sign.key`). **Acceptance:** AC-04…09, 11, 23; contract test: sinh khoá cho 10 hành tinh × 12 cung, × 12 nhà, 12 Ascendant, **khớp tập 252 khoá** của JSON; fixture đầy đủ → 21 mục, không-nhà → 10; không phụ thuộc thứ tự mảng (test xáo trộn); không import React/DOM.
- **Gates:** lint/typecheck/test/format. **Evidence:** output test + coverage của file mới. **DoD:** coverage dòng ≥ 90% cho `interpretation.ts` (mục tiêu F5, thấp hơn thì ghi gap).

### F5.M3 — Panel tĩnh (chưa đồng bộ chọn)
- **Tasks:** `InterpretationPanel`, `Overview`, `Item` (disclosure); wire qua `page.tsx` + Shell; các trạng thái Mục 7.6; không đổi selection.
- **Prerequisite:** M2. **Acceptance:** AC-01…03, 11, 12, 17…23; F4 test không đổi vẫn xanh.
- **Evidence:** test component + ảnh chụp màn hình các trạng thái (lưu `evidence/`). **DoD:** không có HTML thô; mọi chuỗi nội dung đến từ props.

### F5.M4 — Đồng bộ chọn & điều hướng
- **Tasks:** selection → đánh dấu + mở mục; "Đọc diễn giải" ở `SelectionDetail`; "Xem trên biểu đồ"; focus; kiểm không thêm live region.
- **Prerequisite:** M3. **Acceptance:** AC-13…16, 24…26 (phần bàn phím/focus).
- **Tests:** Shell integration (chọn qua wheel và qua Planet Table); không focus bị cướp; Escape; stale selection.
- **DoD:** reducer `selection.ts` không đổi hoặc đổi có chủ đích được ghi.

### F5.M5 — Trạng thái suy giảm & copy
- **Tasks:** chú thích Nhà trung tính (Overview và `HouseDataNotice`), Cung Mọc "chưa khả dụng", `version=null`, một phần, entry hỏng + `reportError`; ghi KG-F5-01 (Mặt Trăng).
- **Prerequisite:** M3 (có thể song song M4). **Acceptance:** AC-17…22.
- **Tests:** fixture-driven (có/không Nhà, thiếu mục, `version=null`, entry hỏng).

### F5.M6 — Responsive & A11y hardening
- **Tasks:** đo layout trên `dev`, xác nhận hoặc đổi vị trí 7.1; heading hierarchy; reduced motion (nếu có chuyển động); độ dài dòng/khoảng cách; liên kết nhảy; QA thủ công (bàn phím, trình đọc màn hình sẵn có — Windows Narrator như F4), ghi những gì chưa kiểm là Known Gap.
- **Prerequisite:** M4, M5. **Acceptance:** AC-24…27.
- **Evidence:** bảng QA riêng khỏi kết quả tự động; `ACCEPTED GAP` chỉ khi owner chấp thuận từng mục.

### F5.M7 — E2E Backend thật & hồi quy F4
- **Tasks:** `e2e/interpretation.spec.ts`: Scenario A (Mars, Mục 8.2, nội dung seed thật; kiểm `interpretationVersion` khác `null` để tránh pass rỗng), Scenario B (không rõ giờ sinh: `PlanetInSign` có, nhà/Ascendant không, chú thích hiện, không lỗi); chạy lại 38 E2E hiện có; không `waitForTimeout`/`skip`/`only`.
- **Prerequisite:** M1, M4, M5. **Acceptance:** AC-28, 29. **Evidence:** CI run + báo cáo.

### F5.M8 — Tài liệu, phiên bản, đóng sprint
- **Tasks:** UI Spec §12.6/§13 as-built (đính chính mâu thuẫn A-2, tối thiểu, không viết lại); CHANGELOG; version `0.4.0` **chỉ sau xác nhận owner** (D-F5-08) kèm lockfile; Known Gaps registry; Evidence Matrix `Sprint_F5_M*_Exit_Criteria_Evidence_Matrix.md`; báo cáo đóng F5.
- **Prerequisite:** M1–M7. **Acceptance:** AC-30, Mục 18.

### 10.1 Đồ thị phụ thuộc
```
M1 ─┬─> M2 ─> M3 ─┬─> M4 ─┬─> M6 ─┐
    │             └─> M5 ─┤       ├─> M7 ─> M8
    └─────────────────────┴───────┘
(M1 cũng là tiên quyết trực tiếp của M7; M2 có thể bắt đầu song song M1 phần thuần.)
```
**Đường găng:** M1 → M2 → M3 → M4 → M6 → M7 → M8. **Song song được:** M2 ∥ M1 (phần không cần CI); M4 ∥ M5.

---

## 11. Testing Strategy

Công cụ: Vitest + Testing Library + MSW tập trung (đúng quy ước G-06 của F3/F4), Playwright trên Backend thật. Fixture phục vụ các ca khó tạo ổn định; **không** thay bằng chứng tích hợp thật.

| Lớp | Phạm vi | Công cụ |
|---|---|---|
| Unit (model) | ghép khoá; phân loại; thứ tự không ảnh hưởng; `language≠vi`; trùng; rỗng | Vitest |
| Contract | 252 khoá JSON ↔ hàm ghép khoá; fixture ↔ model (21/10) | Vitest (đọc `backend/prisma/content/interpretations.vi.json` bằng fs, đường dẫn tương đối repo [candidate]) |
| Component | Overview, Item (expand/collapse, `aria-expanded`, `aria-current`), các trạng thái 7.6 | Vitest + RTL |
| Integration | Shell: chọn qua wheel và qua bảng ⇒ mục nổi bật/mở; Escape; stale; không cướp focus; liên kết hai chiều | Vitest + RTL |
| Regression F4 | Toàn bộ test F4 hiện có không sửa kỳ vọng | Vitest |
| E2E thật | Scenario A (Mars), B (không rõ giờ sinh) | Playwright |
| A11y | Test vai trò/tên truy cập/heading; QA thủ công bàn phím + trình đọc màn hình | RTL + thủ công |
| Responsive | Kiểm 320–375, 768, ≥1024, container ≥1010 | Playwright viewport (chỉ nếu đã có mẫu) + thủ công |
| Bảo mật | grep: không `dangerouslySetInnerHTML`, không `fetch/axios` ngoài `shared/api` | gate script/grep |

Ca bắt buộc: chart đầy đủ; thiếu mục; một phần; `isHouseDataAvailable=false`; không rõ giờ sinh (thật, Scenario B); `version=null`; entry hỏng; chọn từ wheel; chọn từ bảng; Diễn giải→biểu đồ; mở/đóng; góc chiếu/Nhà độc lập không bị trình bày như có nội dung; lỗi/loading chart (F4); bàn phím; responsive.

---

## 12. Quality Gates

| Gate | Lệnh (đã xác minh trong `package.json`/CI) | Bắt buộc | Tiêu chí | Bằng chứng |
|---|---|---|---|---|
| Lint | `cd frontend && npm run lint` | Có | exit 0, 0 error mới | log |
| Typecheck | `npm run typecheck` | Có | exit 0 (đã exit 0 ở baseline audit) | log |
| Format | `npm run format:check` | Có | pass (đã pass ở baseline audit) | log |
| Unit/Component/Integration | `npm test` | Có | toàn bộ xanh; số test ≥ baseline F4 | log |
| Coverage | `npm run test:coverage` | Có (CI/máy owner; không chạy được trong sandbox) | file mới ≥ 90% dòng; không giảm coverage F4 | báo cáo |
| Build | `npm run build` | Có | exit 0 | log |
| E2E | `npm run test:e2e` | Có (CI Backend thật) | 38 hiện có + spec mới xanh | CI run |
| CI | `frontend-ci.yml` | Có | xanh trên commit chứa mã | run URL |
| Grep an toàn | `grep -rn "dangerouslySetInnerHTML" frontend/src` ; `grep -rnE "fetch\(|axios" frontend/src --include=*.ts* \| grep -v shared/api` | Có | 0 kết quả mới | log |
| Boundary lint (`eslint-plugin-boundaries`) | **absent** (đang tắt theo debt F4) | — | không thêm ở F5 | — |

Không nới lỏng gate nào. Evidence commit: commit chứa mã được CI xác nhận; commit chỉ chạm `docs/**` không cần CI riêng.

---

## 13. Security, Accessibility, and Performance

- **Rendering an toàn:** text node, không HTML/markdown/rich text; không thêm thư viện. Dữ liệu hỏng bị loại trước khi render.
- **Semantic:** `h2 Diễn giải` → `h3` nhóm → `h4` mục (không nhảy cấp); `section` có `aria-labelledby`; disclosure bằng `button[aria-expanded][aria-controls]`.
- **Không dựa vào màu:** mục đang chọn có viền + nhãn chữ "Đang chọn" + `aria-current`.
- **Live region:** dùng lại live region duy nhất của F4; **không** đọc nội dung dài; không thêm `aria-live` mới.
- **Focus:** không cướp focus khi chọn; focus chỉ dời khi người dùng kích hoạt liên kết/nút; trả focus rõ ràng ("Xem trên biểu đồ").
- **Reduced motion:** F5 không thêm chuyển động; nếu M6 thêm cuộn mượt/animate mở, dùng `motion-reduce:` như mẫu F4.
- **Hiệu năng:** model dựng bằng `useMemo` trong `page.tsx` theo `query.data`; ≤ 252 mục tối đa, ≤ 21 mục hiển thị mỗi chart ⇒ không cần ảo hoá; không request mới; `expandedKeys` cục bộ tránh render lại wheel (kiểm bằng test không đổi props của `ChartWheel`).
- **Kế thừa:** mẫu M8–M9 (một live region, skip link, `aria-pressed`, `useMediaQuery`).

---

## 14. Risks, Dependencies, and Technical Debt

| ID | Rủi ro | Xác suất | Tác động | Giảm thiểu | Chủ/hành động | Chặn F5? |
|---|---|---|---|---|---|---|
| R-01 | CI không có nội dung → E2E pass rỗng/fail | Cao (đã xảy ra theo audit) | Cao | F5.M1 + khẳng định `interpretationVersion ≠ null` | Dev | Chặn M7 nếu chưa xong M1 |
| R-02 | Bước seed CI lỗi (tsx/DB/thứ tự) | TB | TB | đọc seed script trước; chạy thử; không làm yếu gate | Dev | Không |
| R-03 | Không có diễn giải Nhà độc lập/góc chiếu | Chắc chắn | Trung bình (kỳ vọng PRD) | UI nói thật; backlog BE/content | Owner | Không |
| R-04 | Thiếu giờ sinh/Nhà: Mặt Trăng không chắc chắn nhưng không cảnh báo | Chắc chắn | TB | Known Gap KG-F5-01; FG-01 xác định trạng thái giờ sinh, nhưng cần quyết định/hợp đồng uncertainty phù hợp (FG-07) trước khi có cảnh báo chính xác | Owner/BE | Không |
| R-05 | Lệch type FE↔Backend | Thấp | Cao | contract tests (fixture + JSON 252 khoá) | Dev | Không |
| R-06 | Hồi quy F4 (layout/selection) | TB | Cao | additive-only; test F4 không sửa kỳ vọng; đo ở M6 | Dev | Có nếu xảy ra |
| R-07 | Phức tạp đồng bộ chọn | TB | TB | một nguồn selection; không state thứ hai | Dev | Không |
| R-08 | A11y đọc dài/disclosure | TB | TB | mẫu M8–M9 + QA thủ công; gap ghi rõ | Dev/Owner | Không |
| R-09 | Rendering/bảo mật nội dung | Thấp | Cao | text-only + grep gate | Dev | Không |
| R-10 | Spec §12.6 mâu thuẫn hợp đồng gây hiểu nhầm | Cao | Thấp | M8 đính chính | Dev | Không |
| R-11 | Phụ thuộc hành vi chưa tài liệu hoá (số mục kỳ vọng 21/10, `signKey`) | TB | TB | probe ở M1; ghi số thực tế | Dev | Không |
| R-12 | Vị trí khu vực đọc ở cuối trang gây khó tìm | TB | TB | liên kết nhảy + "Đọc diễn giải"; đo ở M6 | Dev | Không |

**Nợ kỹ thuật liên quan (không chặn):** FG-01 (`isBirthTimeKnown`), FG-07 (độ bất định Mặt Trăng), FG-13/14/04 (danh sách chart/`isApplying`; không liên quan trực tiếp F5), KG-M6-08, KG-M10-03 (E2E chỉ Chrome Desktop), drawer mobile thiếu focus trap, Node 20 CI warning.

---

## 15. Known Gaps and Owner Decisions

### 15.1 Trạng thái quyết định
D-F5-01…09 trong `Confirmation.md` là đề xuất, không mặc định xem là đã Owner phê duyệt. Các khuyến nghị triển khai ở Mục 1 và quyết định P dưới đây là kết quả review kỹ thuật để dùng làm mặc định trong plan; trạng thái Draft vẫn yêu cầu Owner duyệt toàn bộ plan/scope trước khi bắt đầu milestone. **D-F5-08 (version `0.4.0`) vẫn Conditional** — chỉ áp dụng ở F5.M8 khi Owner xác nhận và kiểm tra `package.json`, lockfile, CHANGELOG, workflow.

### 15.2 Review quyết định plan-level

| ID | Quyết định được review | Kết luận khuyến nghị | Lý do / điều kiện |
|---|---|---|---|
| P-01 | Vị trí khu vực đọc | **Chọn (a): toàn chiều rộng sau lưới** | Giữ nguyên lưới F4 đã được đo ở M9, không làm cột bảng chật. M6 đo lại khả năng tìm thấy/nội dung cuộn; chỉ đổi sang (b) nếu evidence cho thấy có lợi rõ ràng. |
| P-02 | Ascendant có chọn được trên wheel không | **Chọn (a): không thêm `Selection.kind="angle"` trong F5** | Giữ reducer, interaction model và kiểm thử F4 ổn định. Ascendant vẫn có mục riêng trong Diễn giải khi Backend trả `AngleInSign`; điều hướng ngược tới wheel không được giả vờ rằng angle là planet selection. |
| P-03 | Mục đang chọn có tự cuộn/focus không | **Chọn (a): chỉ đánh dấu và mở** | Tránh cuộn/cướp focus bất ngờ khi chọn từ wheel hoặc bảng. Chỉ cuộn và chuyển focus sau thao tác có chủ ý như liên kết “Đọc diễn giải”; có liên kết “Xem trên biểu đồ” để quay lại. |
| P-04 | Bấm tiêu đề mục có chọn hành tinh trên wheel không | **Chọn (a): không; tiêu đề chỉ điều khiển disclosure** | Tách thao tác mở/đóng nội dung khỏi thay đổi selection. Dùng hành động riêng “Xem trên biểu đồ”; giữ một nguồn selection và không làm phát sinh vòng đồng bộ mới. |
| P-05 | Copy trạng thái | **Duyệt hướng copy; chốt câu chữ chính xác ở M3** | “Cung Mọc chưa khả dụng”, “Chưa có nội dung cho mục này” và “Nội dung diễn giải chưa được phát hành” phù hợp nếu gắn đúng trạng thái. Chú thích Nhà phải trung tính, không suy ra thiếu giờ sinh/vĩ độ; dùng bản đề xuất ở §7.6 và xem lại với Owner ở M3. Disclaimer chỉ dùng theo duyệt sản phẩm, vì PRD còn Draft. |
| P-06 | Mục mở sẵn mặc định | **Chọn (a): Cốt lõi mở, các hành tinh khác đóng** | Ba mục cốt lõi tạo điểm bắt đầu hữu ích; đóng các mục còn lại giảm chiều dài ban đầu. Cho phép mở nhiều mục và không tự đóng mục người dùng đã mở. |

### 15.3 Known Gaps dự kiến (ghi vào registry ở M8)

| ID | Gap | Loại |
|---|---|---|
| KG-F5-01 | Không có cảnh báo độ bất định Mặt Trăng khi thiếu giờ sinh (KG-S4-06). `isHouseDataAvailable=false` không xác định nguyên nhân; FG-01 có thể xác nhận giờ sinh nhưng chưa đủ để mô tả uncertainty của Moon nếu chưa có quyết định/hợp đồng FG-07 | Requires Backend / Owner |
| KG-F5-02 | Không có diễn giải góc chiếu, Nhà độc lập, cusp, pattern, tổng hợp "đọc toàn bộ lá số" | Backend/Content backlog |
| KG-F5-03 | Chỉ 10 hành tinh + Ascendant (không Chiron/Lilith/Nodes/MC) | Content scope |
| KG-F5-04 | `tone` luôn `null`, `contentSource: Hybrid` không hiển thị | Product decision (D-F5-04) |
| KG-F5-05 | Ascendant không chọn được trên wheel (P-02) | Deferred |
| KG-F5-06 | README `main` lệch (MIT vs AGPL-3.0, "Frontend Planned", module `interpretation`) | Docs debt (ngoài F5) |
| KG-F5-07 | QA trình đọc màn hình/thiết bị ngoài Windows | Unverified (kế thừa KG-M10-03) |

---

## 16. Documentation and Release Management

| Tài liệu | Cập nhật ở F5? |
|---|---|
| `Frontend_UI_Specification.md` | Có — §12.6 (bỏ `source`/AI badge/rich text/lỗi API riêng, ghi as-built text thuần + nhúng trong `ChartResponse`; thứ tự mục chỉ gồm loại thực có), §13/§14 nếu có thay đổi route/trang (không có route mới dự kiến) |
| `frontend/CHANGELOG.md` | Có — mục `0.4.0` (nếu được duyệt) |
| `package.json` + lockfile | Chỉ khi owner xác nhận `0.4.0`; **không** động vào Backend/root |
| API/architecture docs | Không (không đổi hợp đồng) |
| Known Gaps registry | Có (Mục 15.3) |
| Evidence Matrix | Có, mỗi milestone `archive/sprint-f5/Sprint_F5_M{n}_Exit_Criteria_Evidence_Matrix.md` |
| E2E docs | Có (spec mới, quy ước seed CI) |
| Báo cáo đóng F5 | Có (M8) |
| Release/tag `0.3.0`/`0.4.0`, PR đang mở | Quyết định owner (handoff A4), không tự làm |

---

## 17. Acceptance Criteria

| ID | Tiêu chí (kiểm chứng được) |
|---|---|
| AC-01 | Chart có diễn giải: Overview hiện số mục đúng bằng số mục hợp lệ của model |
| AC-02 | Overview có liên kết nhảy tới từng nhóm; mỗi liên kết đưa focus đúng đích |
| AC-03 | Overview ghi rõ chưa có diễn giải góc chiếu/tổng hợp, **không** có nội dung tổng hợp tính cách |
| AC-04 | Mục Mặt Trời hiển thị `Sun_in_{Sign}` (và `Sun_in_House_n` nếu có Nhà) đúng cung/nhà của chart |
| AC-05 | Mục Mặt Trăng tương tự; **không** có cảnh báo độ chắc chắn |
| AC-06 | Mục Cung Mọc hiển thị `Ascendant_in_{Sign}` khi có; không xử lý như hành tinh |
| AC-07 | 8 hành tinh còn lại mỗi hành tinh hiển thị "Theo cung" (và "Theo nhà" khi có) |
| AC-08 | Thứ tự hiển thị không phụ thuộc thứ tự mảng `interpretations[]` (test xáo trộn) |
| AC-09 | Không có nhóm/mục "Nhà" độc lập; `PlanetInHouse` chỉ xuất hiện trong mục hành tinh |
| AC-10 | Không có mục điều hướng/placeholder giả cho góc chiếu |
| AC-11 | Không có nhóm rỗng trong điều hướng |
| AC-12 | Mục mở/đóng bằng chuột và bàn phím; `aria-expanded` phản ánh đúng; cho phép mở nhiều mục |
| AC-13 | Chọn Mars ở wheel ⇒ mục Sao Hỏa được đánh dấu (không chỉ màu) và mở |
| AC-14 | Chọn Mars ở Planet Table cho kết quả tương đương AC-13 |
| AC-15 | "Đọc diễn giải" đưa focus tới mục Mars; "Xem trên biểu đồ" trả focus về phần tử Mars; selection không đổi |
| AC-16 | Chọn không dời focus/không cuộn; Escape/Bỏ chọn bỏ đánh dấu; không có state selection thứ hai (review mã + test) |
| AC-17 | `isHouseDataAvailable=false`: có `PlanetInSign`, không có `PlanetInHouse`, Cung Mọc "chưa khả dụng", một chú thích trung tính, chart không lỗi |
| AC-18 | Không hiển thị bất kỳ suy luận nào về giờ sinh/độ chắc chắn Mặt Trăng; KG-F5-01 ghi trong registry |
| AC-19 | `interpretations=[]`/`version=null` ⇒ thông báo "chưa phát hành", viewer F4 nguyên vẹn |
| AC-20 | Thiếu một mục ⇒ "Chưa có nội dung cho mục này" + `reportError` đúng một lần; mục khác bình thường |
| AC-21 | Entry hỏng/`language≠vi`/trùng khoá bị loại, không crash, không render |
| AC-22 | Lỗi API chart đi qua luồng lỗi F4 (không bị nuốt thành "rỗng thành công") |
| AC-23 | Nội dung chỉ render dạng text; grep không có `dangerouslySetInnerHTML`; không có văn bản diễn giải hardcode trong component (grep fixture-free) |
| AC-24 | Heading không nhảy cấp; vai trò/tên truy cập đúng (test) |
| AC-25 | Không cuộn ngang trang ở 320–375/768/≥1024; khu vực đọc dùng được ở cả ba chế độ F4 |
| AC-26 | Tab theo thứ tự hợp lý, focus ring nhìn thấy được |
| AC-27 | QA thủ công (bàn phím + một trình đọc màn hình) được ghi riêng; phần chưa kiểm là Known Gap |
| AC-28 | E2E Backend thật: Scenario A xanh với `interpretationVersion ≠ null` và nội dung diễn giải Mars hiển thị |
| AC-29 | E2E Scenario B xanh; 38 E2E F4 xanh; không `skip/only/waitForTimeout` |
| AC-30 | Tài liệu (Spec, CHANGELOG, Gaps, Matrix, báo cáo) cập nhật; không đổi Backend/API; số test ≥ baseline |

---

## 18. Definition of Done

F5 đóng khi: scope đã duyệt hoàn tất (hoặc thay đổi được owner duyệt); toàn bộ gate Mục 12 xanh (CI cho phần không chạy được cục bộ); AC-01…30 có bằng chứng; hồi quy F4 đã kiểm; QA a11y/responsive ghi riêng, phần chưa kiểm ghi Known Gap; không đổi Backend/API/kiến trúc ngoài phạm vi; Known Gaps + Evidence Matrix + CHANGELOG + Spec cập nhật; version `0.4.0` chỉ khi owner xác nhận; **owner chính thức nghiệm thu** (không tự tuyên bố).

---

## 19. Execution Checklist

**Trước khi triển khai:** ☐ Owner duyệt plan/scope (áp dụng mặc định P-01…P-06 ở Mục 15.2, trừ khi Owner điều chỉnh) ☐ đọc `seed-content.ts` ☐ tạo nhánh/commit theo quy ước ☐ xác nhận baseline trên CI.
**Mỗi milestone:** ☐ plan milestone tạm ☐ code additive ☐ test song hành ☐ `lint`/`typecheck`/`format:check`/`test`/`build` ☐ push, CI xanh ☐ Evidence Matrix ☐ review độc lập trước khi đóng.
**Tích hợp/hồi quy:** ☐ chạy lại toàn bộ F4 test ☐ 38 E2E ☐ grep an toàn ☐ đo layout 320/375/768/1024/≥1010.
**Nghiệm thu & phát hành:** ☐ registry Known Gaps ☐ Spec/CHANGELOG ☐ owner xác nhận version ☐ lockfile đồng bộ ☐ owner ký đóng ☐ (tuỳ owner) tag/release.

---

## 20. Audit Evidence and References

Đã đọc/chạy trên `dev` @ `cfd4247` (clone `git clone --branch dev`):

- `docs/implementation/Sprint_F4_Implementation_Plan.md` (v1.1; mục 0, 46–51; dòng ~6, ~880)
- `docs/implementation/archive/sprint-f4/Sprint_F4_M10_Exit_Criteria_Evidence_Matrix.md` (FG-01/04/07/11/13/14, KG-M6-08, KG-M10-03/05, KG-CI-NODE20, Q9)
- `docs/frontend/Frontend_UI_Specification.md` §12.5–12.6, §13–14
- `docs/product/PRD.md` FR-07 (dòng 154)
- `backend/src/modules/chart/application/services/interpretation-lookup.service.ts` (`resolveLatestVersion`, `lookup`)
- `backend/prisma/content/interpretations.vi.json` (252 mục; số liệu đo bằng script)
- `backend/prisma/seed-content.ts`; `backend/package.json` (`prisma:seed:content`, `prisma:deploy`)
- `backend/src/modules/chart/infrastructure/adapters/high-latitude-policy.ts` (tồn tại; ngưỡng theo README)
- `.github/workflows/frontend-ci.yml` (bước migrate/build/start/E2E/upload)
- `frontend/package.json` (scripts, version `0.3.0`); `frontend/CHANGELOG.md`
- `frontend/src/features/chart/api/types.ts` (`ChartInterpretationDto`, `KNOWN_INTERPRETATION_SUBJECT_TYPES`, `ChartResponse`)
- `…/model/selection.ts`, `…/model/chartViewModel.ts` (`PlanetVM`, `AngleVM`, `toChartViewModel`)
- `…/ui/ChartViewerShell/ChartViewerShell.tsx`, `HouseDataNotice.tsx`; `…/ui/SelectionDetail/SelectionDetail.tsx`
- `…/api/mocks/fixtures.ts`, `fixtures.contract.test.ts`
- `frontend/src/pages/app/charts/detail/page.tsx`; `frontend/src/app/router.tsx` (route `charts/:chartId`)
- `frontend/src/shared/ui/*` (không có Tabs/Accordion); `frontend/e2e/*` (7 spec, `chart.spec.ts` S1.x/S2.x)
- Lệnh đã chạy: `npm ci`, `npm run typecheck` (exit 0), `npm run format:check` (pass). `vitest run` **không hoàn tất** trong giới hạn sandbox nên số test chưa được tái xác minh ở đây.

**Chưa xác minh (giả định):** `PlanetVM.sign` có định danh cung; số mục 21/10 của **Backend thật** (fixture đã xác minh); hành vi seed trong CI; ngưỡng vĩ độ cao trong mã (chỉ theo README); nội dung README trên `dev`; mọi E2E/coverage.

**Xác nhận:** tài liệu này không sửa mã ứng dụng, test, dependency, version, hợp đồng API, DB hay nội dung diễn giải; **chưa được owner duyệt**.
