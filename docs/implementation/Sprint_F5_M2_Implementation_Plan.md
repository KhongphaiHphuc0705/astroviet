# Sprint F5 — M2: Interpretation Model (Pure) — Implementation Plan

| | |
|---|---|
| **Trạng thái** | **APPROVED BY OWNER — IN IMPLEMENTATION** (2026-11-01: Owner đã phê duyệt toàn bộ quyết định J-1…J-15 ở Section J, chốt J-2, J-3, J-5, J-6) |
| **Ngày** | 2026-10-31 |
| **Baseline audit** | `dev` @ `c95e667` ("[docs] modify evidence matrix with proper evidences"); cây làm việc sạch (không thay đổi chưa commit) |
| **Vị trí** | `docs/implementation/Sprint_F5_M2_Implementation_Plan.md` (plan milestone là bản thảo tạm; xoá khi đóng M2, chỉ lưu Evidence Matrix tại `docs/implementation/archive/sprint-f5/`) |
| **Nhãn** | **[Verified]** có bằng chứng trong repo/lệnh đã chạy · **[Proposal]** đề xuất chờ duyệt · **[Open]** chưa thể kết luận từ bằng chứng |

> Đây là kế hoạch, không phải bằng chứng hoàn thành. Mọi số test/coverage ở dưới là **mục tiêu hoặc kỳ vọng**, không phải kết quả đã đo của M2.

---

## Section A — Executive Summary

**Mục tiêu M2 [Proposal].** Một module TypeScript thuần `frontend/src/features/chart/model/interpretation.ts` nhận (1) hai trường diễn giải của `ChartResponse` và (2) `ChartViewModel` đã dựng ở F4, rồi trả một `InterpretationModel` xác định (deterministic): các mục theo thứ tự chuẩn (Cốt lõi: Mặt Trời, Mặt Trăng, Cung Mọc; Các hành tinh: 8 hành tinh còn lại), mỗi mục có phần "theo cung" và "theo nhà" với trạng thái tường minh (`available / missing / ambiguous / unavailable`), cùng danh sách `issues` có mã ổn định để M3–M5 xử lý mà không phải parse chuỗi.

**Ranh giới.** Không React/DOM/hook/style; không đổi Backend, API, nội dung JSON, `ChartViewModel`/`PlanetVM`; không sinh nội dung diễn giải; không diễn giải góc chiếu/tổng hợp; không dependency mới; không UI (M3+).

**Quan hệ với các phần khác.**
- *M1 [Verified]:* đã đóng; xác nhận `Confirmed (DTO runtime + mã resolveSign)` cho `PlanetVM.sign.key`, với điều kiện M2 **chỉ ghép khoá khi `sign.known === true`** và có test dùng fixture thật (Evidence Matrix M1, D-06).
- *F4 [Verified]:* M2 tái dùng `toChartViewModel` (không sửa), `ChartIssue {code, subject}` làm mẫu issue, và fixtures `chartFull`/`chartNoHouses`.
- *Backend Sprint 4 [Verified]:* nguồn sự thật nội dung là `backend/prisma/content/interpretations.vi.json` (252 mục, 252 duy nhất); cách suy subject theo chart ở `derive-interpretation-subjects.ts`.
- *M3–M7 [Proposal]:* M3 render; M4 đồng bộ chọn qua `itemsById`/`getInterpretationItemId`; M5 xử lý copy cho các trạng thái; M7 E2E.

**Quyết định thiết kế chính [Proposal].**
1. **Không thêm `PlanetVM.signKey`** — `PlanetVM.sign.key` đã đủ (Mục B.2, J-1).
2. Đầu vào = `(Pick<ChartResponse,"interpretations"|"interpretationVersion">, ChartViewModel)`; dùng `vm.flags.houseDataAvailable` (cờ *hiệu lực* đã đối soát mâu thuẫn ở F4), không dùng lại cờ thô của DTO.
3. Một pipeline xác định gồm các hàm nội bộ nhỏ; chỉ export các hàm tạo khoá, `buildInterpretationKeySpace`, `buildInterpretationModel`, `getInterpretationItemId` và kiểu.
4. Contract test đọc **trực tiếp** `backend/prisma/content/interpretations.vi.json` bằng `node:fs` (đã thử nghiệm cô lập: typecheck/lint/vitest đều qua; phương án `?raw` bị Vite chặn — Mục B.6), không có danh sách 252 khoá chép tay.
5. Nhãn "21 mục / 10 mục" = số **phần có nội dung (`available`)**, đã đối chiếu với fixtures thật: 21 = 10 + 1 + 10; 10 = 10 PlanetInSign (angles rỗng).

**Blocker.** Không có blocker kỹ thuật. Cần owner duyệt plan và các quyết định ở Section J (không quyết định nào chặn bắt đầu M2.0–M2.2).

---

## Section B — Repository Audit and Evidence

### B.1 Trạng thái repo và M1
| Hạng mục | Bằng chứng | Hệ quả cho M2 |
|---|---|---|
| Nhánh/HEAD [Verified] | `dev` @ `c95e667`; `git status --short` rỗng | Không có thay đổi cũ cần bảo toàn |
| M1 đóng [Verified] | Commit `4b70422` (workflow + `chart.spec.ts`), CI Frontend #301 xanh; `c95e667` sửa Evidence Matrix; plan M1 đã xoá khỏi `docs/implementation/` | Seed CI có nội dung; quy ước "xoá plan milestone khi đóng" đang được tuân thủ |
| Xuất ra của M1 [Verified] | Không có mã ứng dụng mới; chỉ: bước CI seed 252 bản ghi, assertion probe trong S1.3/S2.3, và kết luận D-06 | M2 **không** có helper chuẩn hoá/validate sẵn từ M1 để tái dùng |
| `sign.key` [Verified] | M1 Matrix D-06: `Confirmed (DTO runtime + mã resolveSign)`; CI chứng minh `planets[].sign` ∈ 12 cung tiếng Anh và ghép đúng `subjectKey`; `key === sign` khi `known` suy từ `labels.ts` | Dùng `sign.key` + `known`; **không** cần mapping |
| Baseline CI [Verified, từ M1 Matrix] | 130 file / 1049 case Vitest, 38 E2E (số thu thập; pass 100% trên CI #301) | M2.0 chạy lại `vitest list` để xác nhận không trôi |

### B.2 Hợp đồng API và VM [Verified]
Nguồn: `frontend/src/features/chart/api/types.ts`, `model/chartViewModel.ts`, `model/labels.ts`.

| Mục | Kết quả | Hệ quả |
|---|---|---|
| Mục diễn giải | `ChartInterpretationDto { subjectType: InterpretationSubjectType; subjectKey: string; language: string; bodyText: string; tone?: string \| null }`; `language` là **trên từng mục** | Quy tắc ngôn ngữ áp dụng theo mục; không có trường ngôn ngữ cấp response |
| Loại subject | `KNOWN_INTERPRETATION_SUBJECT_TYPES = ["PlanetInSign","AngleInSign","PlanetInHouse"]` | Danh sách nhóm được hỗ trợ |
| Phiên bản | `ChartResponse.interpretationVersion: string \| null` (cấp response); không có `snapshotInterpretationVersion` | Chỉ chuyển tiếp, không suy luận |
| Hành tinh | `PlanetName` gồm 10 thân + `Chiron, NorthNode, SouthNode, Lilith`; 10 thân đầu là `Sun…Pluto` | Chỉ 10 thân đầu có diễn giải (khớp `MVP_INTERPRETATION_PLANETS` ở Backend) |
| Cung | `KNOWN_ZODIAC_SIGNS` 12 tên tiếng Anh | Khớp tập cung trong JSON (đã đối chiếu, B.4) |
| Nhà | `ChartPlanetDto.house: number \| null`; `PlanetVM.houseNumber: number \| null` (đã được F4 kiểm 1–12 và nulled khi nhà không khả dụng) | Dùng `houseNumber` của VM |
| Góc | `AngleVM { key: angle type, known, sign: GlyphLabel, … }`; Ascendant có `key === "Ascendant"` | Ascendant lấy từ `vm.angles` |
| Danh tính ổn định vs nhãn | Ổn định: `PlanetVM.key` (= `planetName`), `PlanetVM.sign.key` (= chuỗi Backend khi `known`), `AngleVM.key`, `houseNumber`. Nhãn hiển thị: `nameVi`, `sign.labelVi`, `glyph`, `ariaLabel` | **Không** dùng chỉ số mảng hay nhãn làm khoá |
| `GlyphLabel` | `{ key: string; labelVi; glyph: string \| null; known: boolean }` (`labels.ts`); `resolveSign` dùng `Object.hasOwn` ⇒ khi lạ, `key` = chuỗi thô và `known=false` | Chỉ tin `sign.key` khi `known===true` **và** thuộc 12 cung (guard riêng) |
| Cờ nhà | `vm.flags.houseDataAvailable` là cờ *hiệu lực* (đã đối soát `HOUSE_FLAG_CONTRADICTION`) | Dùng cờ này |
| VM giữ mục trùng | `buildPlanets` đẩy `DUPLICATE_ENTITY` nhưng **giữ cả hai** hành tinh trùng tên | M2 phải tự phát hiện hành tinh trùng (J-3) |
| VM không kiểm `interpretations` | `validateStructure` không đụng `interpretations`; `toChartViewModel` bỏ qua nó | M2 phải chịu được `interpretations` không phải mảng |
| Mẫu issue F4 | `ChartIssue { code: ChartIssueCode; subject: string }`, subject dạng `planet:Sun.sign:X` | M2 mở rộng tối thiểu (J-6) |

**Khoảng trống hợp đồng [Open]:** API **không** có trường nào cho "giờ sinh chưa biết" (FG-01) ⇒ M2 **không** phát issue liên quan giờ sinh và không suy từ `isHouseDataAvailable` (khớp D-F5-03 và KG-F5-01).

### B.3 Suy diễn subject ở Backend [Verified]
`backend/src/modules/chart/domain/interpretation/derive-interpretation-subjects.ts`: (1) `PlanetInSign` cho mỗi hành tinh trong `MVP_INTERPRETATION_PLANETS` có mặt; (2) `AngleInSign` cho Ascendant **nếu `angles` có Ascendant** (không phụ thuộc cờ nhà); (3) `PlanetInHouse` chỉ khi `isHouseDataAvailable` và `planet.house !== null`; thứ tự trả: PlanetInSign → AngleInSign → PlanetInHouse. Ngữ pháp khoá: `interpretation-subject-key.ts`. Tra cứu bỏ qua subject không có bản ghi (log warn) — `interpretation-lookup.service.ts`.

### B.4 Nội dung JSON [Verified, đo bằng script]
`backend/prisma/content/interpretations.vi.json` tồn tại, không BOM:

| Mục | Kết quả |
|---|---|
| Cấu trúc | `{ language: "vi", version: "1.0", status: "Published", contentSource: "Hybrid", items: [...] }` |
| Mục | **252**, mỗi mục chỉ có `subjectType`, `subjectKey`, `bodyText` — **không có `language` hay `tone` trên từng mục** (ngôn ngữ ở cấp file; API gắn `language` từng mục khi trả) |
| Tính duy nhất | 252 cặp `(subjectType, subjectKey)` duy nhất |
| Hành tinh | đúng 10: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto |
| Cung / nhà | 12 cung (`PlanetInSign`), nhà 1–12 (`PlanetInHouse`) |
| Ascendant | 12 khoá `Ascendant_in_{Sign}` |
| Mục lạ | không có trường thừa; không có mục sai dạng |
| Trường hợp đặc biệt | không có — khoá chỉ gồm tên chuẩn + `_in_` / `_in_House_` |

**Giới hạn phát hiện trùng:** kho nội dung là **mảng** `items`, nên mục trùng vẫn hiện sau `JSON.parse` (đếm được). Giới hạn "trùng khoá đối tượng" chỉ xảy ra **trong cùng một mục** (hai thuộc tính `"subjectKey"` ⇒ `JSON.parse` lấy giá trị sau, im lặng). Cách phát hiện bằng công cụ sẵn có: đếm số lần xuất hiện của tên thuộc tính trong văn bản thô và so với `items.length` — đã chạy thử: 252 lần `"subjectKey"` = 252 mục `[spike]`. Lưu ý: nếu `bodyText` chứa nguyên văn `"subjectKey":` sẽ cho dương tính giả (hiện không có).

### B.5 Kiến trúc và quy ước test [Verified]
| Mục | Kết quả |
|---|---|
| Vị trí module | `frontend/src/features/chart/model/` chứa các module thuần cùng test cạnh nhau (`chartViewModel.ts`, `labels.ts`, `selection.ts`, `format.ts` … + `*.test.ts`); `features/chart/index.ts` chỉ export `toChartViewModel`, `ChartViewModelError`, `ChartViewModel` từ model |
| Đặt tên test | `X.test.ts` cạnh nguồn; test hợp đồng: `fixtures.contract.test.ts` ⇒ mẫu `*.contract.test.ts` |
| Mẫu test | `describe/it` import tường minh từ `vitest`; helper cục bộ `deepFreeze`, `makeDto(mutator)` dùng `structuredClone(chartFull)`; xáo trộn xác định ở `labelLayout.test.ts` |
| Môi trường test | `vite.config.ts`: `environment: "jsdom"`, `setupFiles: ["./src/test/setup.ts"]` (setup dùng `document`/`window` ⇒ **không** chuyển sang môi trường `node`) |
| Coverage | `provider: "v8"`, reporter `text, html`, **không có ngưỡng**; có thể giới hạn từng file bằng CLI (B.7) |
| Lint | `eslint.config.js`; `boundaries/element-types` đang `off` (nợ F4); không có `no-restricted-imports` |
| TS | `tsconfig.app.json`: `types: ["vite/client"]`, không có `@types/node` toàn cục ⇒ `node:fs` không resolve nếu thiếu tham chiếu (đã xác nhận bằng spike: `TS2307`) |

### B.6 Truy cập JSON Backend từ test frontend [Verified bằng spike cô lập]
Spike chạy trên **bản sao** trong `/tmp` (repo không bị chạm):

| Phương án | Kết quả | Kết luận |
|---|---|---|
| `import raw from ".../interpretations.vi.json?raw"` | `Error: Denied ID …?raw` (file nằm ngoài root Vite) | Cần sửa `server.fs.allow` trong `vite.config.ts` ⇒ **loại** (đổi cấu hình dev-server, rộng hơn nhu cầu) |
| `import { readFileSync } from "node:fs"` không khai báo kiểu | `tsc -p tsconfig.app.json`: `TS2307 Cannot find module 'node:fs'` | Cần khai báo kiểu |
| `/// <reference types="node" />` + `node:fs` + `new URL(…, import.meta.url)` | Vitest lỗi `The URL must be of scheme file` (jsdom thay `URL` toàn cục) | Tránh `new URL` |
| **`/// <reference types="node" />` + `node:fs`/`node:path`/`node:url` + `resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../backend/prisma/content/interpretations.vi.json")`** | Vitest pass; `tsc -p tsconfig.app.json` không lỗi; `eslint` exit 0 | **Chọn** — chỉ file `*.contract.test.ts` dùng kiểu Node; không đổi `tsconfig`/`vite.config` |
Ghi chú CI: `frontend-ci.yml` checkout toàn repo ⇒ file Backend có trong job; workflow chạy khi `backend/**` đổi ⇒ thay đổi nội dung sẽ chạy lại contract test.

### B.7 Coverage theo từng file [Verified bằng spike]
Lệnh đã chạy thành công trên file mẫu (`format.ts`): `npx vitest run --coverage --coverage.include=<file nguồn> --coverage.reporter=text <file test>` — bảng chỉ hiện đúng file, tránh tổng gộp gây hiểu lầm. Không cần đổi cấu hình.

### B.8 Fixtures [Verified, `node --experimental-strip-types` trên `fixtures.ts`]
| Fixture | Hành tinh | Cờ nhà | Angles | Diễn giải | Phân rã | Khớp với khoá suy ra từ chính fixture |
|---|---|---|---|---|---|---|
| `chartFull` | 10 (Sun…Pluto) | `true` | Ascendant, Midheaven, Descendant, ImumCoeli | **21**, version `"1.0"`, mọi `language:"vi"`, `tone:null` | 10 PlanetInSign + 1 AngleInSign + 10 PlanetInHouse | **Có** |
| `chartNoHouses` | 10 | `false` | `[]` | **10**, version `"1.0"` | 10 PlanetInSign | **Có** |
Hệ quả: (a) 21 = 10+1+10 và 10 = 10 PlanetInSign **khớp** hợp đồng thật; (b) không có mâu thuẫn "11" vì Ascendant vắng khi `angles=[]`; (c) fixtures là oracle đủ cho kịch bản đầy đủ/không nhà; các kịch bản suy giảm tạo bằng `structuredClone` + chỉnh sửa trong test (không thêm file fixture mới).

### B.9 Mâu thuẫn/ghi chú khi đối chiếu prompt
1. AC-04…09, 11, 23 được định nghĩa ở **F5 Implementation Plan §17** (mức **hiển thị**, chủ yếu UI M3+). Với M2 chỉ phần **model** thuộc phạm vi — Section C ghi rõ ranh giới.
2. "Language" trong JSON là cấp file; trong API là trên từng mục (B.2, B.4) ⇒ quy tắc ngôn ngữ chỉ áp dụng cho dữ liệu API.
3. Giả định "M1 cung cấp `sign.key`" thực chất là **xác nhận** một thuộc tính đã có ở F4 (`resolveSign`), không phải sản phẩm mã mới của M1.

---

## Section C — Requirements and AC Traceability

Nguồn định nghĩa AC: `docs/implementation/Sprint_F5_Implementation_Plan.md` §17 (bản đã commit) [Verified]. M2 acceptance trong plan F5 §10: "AC-04…09, 11, 23; contract test 252; 21/10; xáo trộn; không React/DOM; coverage ≥ 90% (mục tiêu)".

| AC | Yêu cầu đã xác minh | Phạm vi M2 | Hiện thực (Proposal) | Test | Bằng chứng chấp nhận | Phụ thuộc / ghi chú |
|---|---|---|---|---|---|---|
| **AC-04** | Mục Mặt Trời hiển thị `Sun_in_{Sign}` (+ `Sun_in_House_n` nếu có Nhà) đúng cung/nhà | **Một phần** — M2 cung cấp dữ liệu mục `planet:Sun` | `buildInterpretationModel` → item `planet:Sun`: `bySign.subjectKey = Sun_in_{vm sign.key}`, `byHouse.subjectKey = Sun_in_House_{houseNumber}` | U-04, U-05 | Output test hoàn chỉnh: khoá đúng, `bodyText` nguyên văn | Hiển thị = M3 |
| **AC-05** | Mục Mặt Trăng tương tự; **không** có cảnh báo độ chắc chắn | **Một phần** | `planet:Moon` cùng đường với Sun; model **không** có trường/issue về giờ sinh | U-04, U-05, U-26 | no-house fixture: `issues` đúng `[HOUSE_DATA_UNAVAILABLE]`; không có mã nào về giờ sinh | KG-F5-01 (chờ FG-01) |
| **AC-06** | Mục Cung Mọc hiển thị `Ascendant_in_{Sign}` khi có; không xử lý như hành tinh | **Một phần** | item `angle:Ascendant` (`kind:"angle"`, `byHouse:null`), từ `vm.angles` (`key==="Ascendant"`, `sign.known`); vắng ⇒ `unavailable(ANGLE_ABSENT)` | U-04, U-05, U-23 | Full: available; no-house: `ANGLE_ABSENT` | Copy "chưa khả dụng" = M3/M5 |
| **AC-07** | 8 hành tinh còn lại mỗi hành tinh có "Theo cung" (+ "Theo nhà" khi có) | **Một phần** | group `planets` gồm Mercury…Pluto, mỗi item có `bySign` + `byHouse` | U-04 | `groups[1].itemIds` đúng 8, thứ tự chuẩn | Hiển thị = M3 |
| **AC-08** | Thứ tự hiển thị không phụ thuộc thứ tự mảng `interpretations[]` (test xáo trộn) | **Trong phạm vi** (phần model; mở rộng sang mảng planets/angles) | Thứ tự item cố định theo `INTERPRETATION_PLANETS`; `issues` sắp xếp chuẩn; không dùng chỉ số mảng | U-06 | `toEqual` giữa baseline và ≥ 3 hoán vị cố định | — |
| **AC-09** | Không có nhóm/mục "Nhà" độc lập; `PlanetInHouse` chỉ trong mục hành tinh | **Trong phạm vi** (ở mức model) | `group ∈ {"core","planets"}`; `PlanetInHouse` chỉ là `byHouse` | U-24 | Test: không có group/item mang danh tính nhà | — |
| **AC-11** | Không có nhóm rỗng trong điều hướng | **Một phần** | `groups` chỉ gồm nhóm có ≥ 1 item; `itemIds` luôn khớp `items` | U-19, U-24 | VM không có hành tinh ⇒ nhóm `planets` bị bỏ; mọi nhóm được phát ra đều có ≥ 1 item | Điều hướng = M3; trạng thái "chưa khả dụng" của một item **không** làm rỗng nhóm (khớp plan §7.2) |
| **AC-23** | Nội dung chỉ render dạng text; grep không có `dangerouslySetInnerHTML`; không hardcode văn bản diễn giải trong component | **Một phần** | `bodyText` truyền nguyên văn (không trim/biến đổi); `interpretation.ts` không chứa văn bản tiếng Việt (nguồn chỉ ASCII) và không chứa `dangerouslySetInnerHTML` | U-25, P-01…P-03 | Test nguồn: không ký tự ngoài ASCII; grep 0 | Phần render + grep component = M3 |

**Phân định:** các AC hiển thị ("hiển thị", "trong điều hướng") hoàn tất ở M3+; M2 chứng minh dữ liệu và trạng thái mà UI sẽ dựa vào. Nếu owner muốn AC-04…07 chỉ tính khi có UI, M2 vẫn đáp ứng phần model nêu trên (Section J-9).

---

## Section D — Proposed Model Contract

> Sơ đồ chữ ký dưới đây là **Proposal**; không phải mã triển khai. Mọi kiểu tái dùng từ `api/types.ts` và `chartViewModel.ts` (không định nghĩa lại).

### D.1 Hằng số và hàm tạo khoá
```ts
import type { ChartResponse, InterpretationSubjectType, PlanetName, ZodiacSign } from "../api/types";
import type { ChartViewModel } from "./chartViewModel";

// 10 thân Sun…Pluto theo thứ tự chuẩn. Danh sách này lặp lại MVP_INTERPRETATION_PLANETS của Backend;
// contract test (C-06) khoá nó với tập hành tinh thật trong JSON và với 10 phần tử đầu KNOWN_PLANET_NAMES.
export const INTERPRETATION_PLANETS = [/* "Sun" … "Pluto" */] as const;
export type InterpretationPlanet = (typeof INTERPRETATION_PLANETS)[number];
export const HOUSE_NUMBERS = [/* 1 … 12 */] as const;

// Nhận giá trị thô (unknown) vì dữ liệu đến từ VM/API; trả null nếu không hỗ trợ — không ném lỗi, không đoán.
export function buildPlanetInSignKey(planet: unknown, sign: unknown): string | null;   // "Sun_in_Capricorn"
export function buildPlanetInHouseKey(planet: unknown, house: unknown): string | null; // "Sun_in_House_7"
export function buildAscendantInSignKey(sign: unknown): string | null;                 // "Ascendant_in_Leo"

export interface InterpretationSubjectRef { subjectType: InterpretationSubjectType; subjectKey: string }
export function buildInterpretationKeySpace(): readonly InterpretationSubjectRef[];    // đúng 252, thứ tự xác định
```
**Quy tắc hàm tạo khoá [Proposal]:** khớp **chính xác** (phân biệt hoa/thường, không trim) với tập định danh chuẩn; `planet` ∈ `INTERPRETATION_PLANETS`, `sign` ∈ `KNOWN_ZODIAC_SIGNS`, `house` là số nguyên 1–12; giá trị khác (kể cả `"toString"`, `"__proto__"`, `"7"`, `7.5`, `NaN`) ⇒ `null`. Tra cứu bằng `Set`/so sánh giá trị (không bằng truy cập thuộc tính đối tượng) để an toàn trước khoá nguyên mẫu. Không bao giờ phân tích (parse) chuỗi khoá để lấy danh tính; không dùng nhãn tiếng Việt hay chỉ số mảng.

### D.2 Mô hình đầu ra
```ts
export type InterpretationGroupId = "core" | "planets";
export type InterpretationItemId = `planet:${InterpretationPlanet}` | "angle:Ascendant";

export type InterpretationUnavailableReason =
  | "HOUSE_DATA_UNAVAILABLE"   // cờ nhà hiệu lực = false — trạng thái suy giảm hợp lệ
  | "HOUSE_NUMBER_UNRESOLVED"  // nhà khả dụng nhưng hành tinh không có số nhà hợp lệ
  | "SIGN_UNRESOLVED"          // sign.known=false hoặc không thuộc 12 cung
  | "ANGLE_ABSENT"             // không có góc Ascendant trong VM
  | "CONTENT_NOT_PUBLISHED";   // version=null và không có mục nào

export type InterpretationPart =
  | { state: "available"; subjectKey: string; bodyText: string }
  | { state: "missing"; subjectKey: string }                                  // khoá sinh được nhưng nội dung không có
  | { state: "ambiguous"; reason: "DUPLICATE_ENTRIES" | "DUPLICATE_IDENTIFIER" } // bị trùng; không chọn first/last
  | { state: "unavailable"; reason: InterpretationUnavailableReason };        // không thể/không nên sinh khoá

export interface InterpretationItem {
  id: InterpretationItemId;
  group: InterpretationGroupId;
  kind: "planet" | "angle";
  subject: string;                       // PlanetVM.key hoặc "Ascendant" (định danh, không phải nhãn)
  bySign: InterpretationPart;            // PlanetInSign | AngleInSign
  byHouse: InterpretationPart | null;    // PlanetInHouse; null với kind "angle"
}

export interface InterpretationGroup { id: InterpretationGroupId; itemIds: readonly InterpretationItemId[] }

export type InterpretationStatus = "ready" | "partial" | "unavailable";

export interface InterpretationModel {
  status: InterpretationStatus;
  version: string | null;                // interpretationVersion đã chuẩn hoá (không hiển thị — D-F5-04)
  houseDataAvailable: boolean;           // = vm.flags.houseDataAvailable
  items: readonly InterpretationItem[];  // thứ tự chuẩn
  itemsById: Readonly<Partial<Record<InterpretationItemId, InterpretationItem>>>;
  groups: readonly InterpretationGroup[];// chỉ nhóm có ≥ 1 item
  availableCount: number;                // số part state "available" (21 / 10 ở fixtures)
  issues: readonly InterpretationIssue[];
}
```
Không dùng `Map`/`Set`/`Date`/hàm trong đầu ra ⇒ tuần tự hoá JSON được và so sánh `toEqual` ổn định.

### D.3 Issues
```ts
export type InterpretationIssueCategory = "degraded" | "defect"; // degraded = trạng thái hợp lệ mong đợi (không báo lỗi); defect = dữ liệu bất thường
export type InterpretationIssueCode =
  | "CONTENT_NOT_PUBLISHED"   // degraded  subject "interpretations"
  | "HOUSE_DATA_UNAVAILABLE"  // degraded  subject "houses"
  | "ENTRY_MALFORMED"         // defect    subject "<type>:<key>[.field]" | "entry:unidentified" | "interpretations"
  | "SUBJECT_UNSUPPORTED"     // defect    subject "type:<value>" | "<type>:<key>"
  | "LANGUAGE_NOT_SUPPORTED"  // defect    subject "<type>:<key>"
  | "DUPLICATE_SUBJECT"       // defect    subject "<type>:<key>"      count = số mục trùng
  | "ENTRY_NOT_APPLICABLE"    // defect    subject "<type>:<key>" (hợp lệ nhưng không thuộc chart này)
  | "CONTENT_MISSING"         // defect    subject "<type>:<expected key>"
  | "IDENTIFIER_UNRESOLVED"   // defect    subject "planet:<P>.sign" | "planet:<P>.house" | "angle:Ascendant.sign"
  | "AMBIGUOUS_IDENTIFIER"    // defect    subject "planet:<P>" | "angle:Ascendant"
  | "VERSION_INVALID";        // defect    subject "interpretationVersion"

export interface InterpretationIssue {
  code: InterpretationIssueCode;
  category: InterpretationIssueCategory;   // suy ra xác định từ code (bảng cố định)
  subject: string;                         // chẩn đoán cho dev; cắt tối đa 80 ký tự; KHÔNG hiển thị cho người dùng
  count: number;                           // số lần gộp (≥ 1)
}
```
**Lý do contract nhỏ [Proposal]:** mở rộng `ChartIssue {code, subject}` của F4 thêm `category` (để UI/`reportError` phân biệt hợp lệ-suy-giảm với lỗi dữ liệu mà không bảng tra riêng) và `count` (để các mục không có danh tính, hoặc trùng, gộp thành một issue ⇒ đầu ra **không phụ thuộc thứ tự/ chỉ số mảng**). Không có `message`, không `severity` riêng, không cờ `blocking` (trạng thái chặn đã nằm ở `part.state`/`status`). Không đưa chi tiết ngoại lệ hay `bodyText` vào issue.
**Thứ tự issues:** gộp theo `(code, subject)`, sắp xếp theo thứ tự khai báo của `code` rồi `subject` (so sánh chuỗi ngôn ngữ-trung-lập).

### D.4 Hàm chính và pipeline
```ts
export function buildInterpretationModel(
  dto: Pick<ChartResponse, "interpretations" | "interpretationVersion">,
  vm: Pick<ChartViewModel, "planets" | "angles" | "flags">,
): InterpretationModel;

export function getInterpretationItemId(planetKey: string): InterpretationItemId | null; // cho M4 (chọn → mục)
```
**Một pipeline xác định [Proposal]** (hàm nội bộ nhỏ, không export, không trạng thái toàn cục, không đột biến đầu vào):
1. **Chuẩn hoá phiên bản:** `string | null` giữ nguyên; giá trị khác ⇒ `version=null` + `VERSION_INVALID`.
2. **Chuẩn hoá danh sách:** nếu `interpretations` không phải mảng ⇒ danh sách rỗng + `ENTRY_MALFORMED` (subject `interpretations`) — *không* chuyển lỗi thành "thành công rỗng" im lặng (xuất hiện trong `issues`, `status="unavailable"`).
3. **Phân loại từng mục theo thứ tự ưu tiên cố định** (mục dừng ở quy tắc đầu tiên vi phạm):
   1. *Hình dạng/kiểu:* không phải object; `subjectType`/`subjectKey`/`language`/`bodyText` không phải string; `subjectKey` rỗng; `bodyText` rỗng/chỉ khoảng trắng ⇒ `ENTRY_MALFORMED` (loại).
   2. *Hỗ trợ:* `subjectType` ∉ 3 loại, hoặc `subjectKey` ∉ không gian khoá (252) của đúng loại đó ⇒ `SUBJECT_UNSUPPORTED` (loại). (Khoá hợp lệ nhưng sai loại, vd. `PlanetInSign` + `Sun_in_House_1` ⇒ cũng loại này.)
   3. *Ngôn ngữ:* `language !== "vi"` (so sánh chính xác) ⇒ `LANGUAGE_NOT_SUPPORTED` (loại).
   4. *Trùng:* các mục còn lại nhóm theo `(subjectType, subjectKey)`; nhóm > 1 mục ⇒ **loại tất cả** + `DUPLICATE_SUBJECT` (count = kích thước nhóm); không first/last-wins, kể cả khi nội dung giống nhau.
4. **Suy ra subject mong đợi từ VM:** với từng hành tinh trong `INTERPRETATION_PLANETS` xuất hiện trong `vm.planets` (đếm theo `key`, không theo vị trí): 0 lần ⇒ không có item (không phải lỗi diễn giải; F4 đã có `CORE_BODY_MISSING`); > 1 lần ⇒ item với hai phần `ambiguous(DUPLICATE_IDENTIFIER)` + `AMBIGUOUS_IDENTIFIER`; đúng 1 ⇒ khoá `bySign` từ `sign.key` **chỉ khi `sign.known && thuộc 12 cung`** (ngược lại `unavailable(SIGN_UNRESOLVED)` + `IDENTIFIER_UNRESOLVED`), khoá `byHouse` chỉ khi `vm.flags.houseDataAvailable` và `houseNumber` hợp lệ (cờ `false` ⇒ `unavailable(HOUSE_DATA_UNAVAILABLE)`; cờ `true` mà `houseNumber` rỗng ⇒ `unavailable(HOUSE_NUMBER_UNRESOLVED)` + `IDENTIFIER_UNRESOLVED`). Ascendant: **luôn có item `angle:Ascendant`**; đếm góc có `key==="Ascendant"` trong `vm.angles` — 0 ⇒ `unavailable(ANGLE_ABSENT)`; > 1 ⇒ ambiguous; đúng 1 ⇒ khoá từ `sign.key` với cùng điều kiện như trên. **Không** suy ra Ascendant hay độ bất định giờ sinh từ cờ nhà.
5. **Ghép với nội dung đã chấp nhận:** khoá mong đợi có trong tập chấp nhận ⇒ `available` (nguyên văn `bodyText`); nằm trong nhóm trùng ⇒ `ambiguous(DUPLICATE_ENTRIES)`; không có và đang ở chế độ *chưa phát hành* (`version===null` và danh sách rỗng) ⇒ `unavailable(CONTENT_NOT_PUBLISHED)`; còn lại ⇒ `missing` + `CONTENT_MISSING`.
6. **Mục thừa:** mục đã chấp nhận nhưng không được phần nào tiêu thụ (khoá hợp lệ nhưng không thuộc chart, hoặc nhà-phụ thuộc khi cờ nhà = `false`) ⇒ `ENTRY_NOT_APPLICABLE`, **không** hiển thị. (Khi một hành tinh có danh tính mơ hồ, các mục của nó có thể bị báo `ENTRY_NOT_APPLICABLE` — chỉ xảy ra trong trạng thái đã là lỗi, chấp nhận được.)
7. **Điều kiện suy giảm:** `HOUSE_DATA_UNAVAILABLE` (degraded) khi cờ hiệu lực `false`; `CONTENT_NOT_PUBLISHED` (degraded) ở chế độ chưa phát hành; `VERSION_INVALID` / null-nhưng-có-mục: xem J-13.
8. **Lắp ráp:** items theo thứ tự chuẩn (Cốt lõi: `planet:Sun`, `planet:Moon`, `angle:Ascendant`; Hành tinh: Mercury → Pluto), `groups` chỉ gồm nhóm có item, `availableCount`, `status`:
   - `unavailable` nếu `availableCount === 0`;
   - `partial` nếu có bất kỳ phần `missing`/`ambiguous` hoặc `unavailable` mang lý do lỗi dữ liệu (`SIGN_UNRESOLVED`, `HOUSE_NUMBER_UNRESOLVED`);
   - còn lại `ready` (kể cả khi chỉ có suy giảm hợp lệ như thiếu Nhà).
   Mục bị loại (mơ hồ danh tính, thừa, sai ngôn ngữ…) vẫn xuất hiện trong `issues` kể cả khi `status="ready"`.

### D.5 Phân biệt các trạng thái (bảng tham chiếu cho test)
| Tình huống | Điểm phát hiện | Mã / trạng thái | Mục được... | Tiếp tục? |
|---|---|---|---|---|
| Thiếu nội dung (nhà khả dụng) | bước 5 | `part.missing` + `CONTENT_MISSING` (defect) | giữ làm chẩn đoán (part), không hiển thị nội dung | Có |
| Mục sai hình dạng | bước 3.1 | `ENTRY_MALFORMED` (defect) | loại | Có |
| Ngôn ngữ ≠ `vi` | bước 3.3 | `LANGUAGE_NOT_SUPPORTED` | loại | Có |
| `language` vắng/không phải chuỗi | bước 3.1 | `ENTRY_MALFORMED` | loại | Có |
| Trùng khoá | bước 3.4 | `DUPLICATE_SUBJECT` + `part.ambiguous` | loại cả nhóm | Có |
| Định danh/loại lạ | bước 3.2 | `SUBJECT_UNSUPPORTED` | loại | Có |
| `sign.key` không dùng được | bước 4 | `SIGN_UNRESOLVED` + `IDENTIFIER_UNRESOLVED` | `bySign` unavailable | Có |
| Nhà không khả dụng | bước 4/7 | `unavailable(HOUSE_DATA_UNAVAILABLE)` + issue degraded | `byHouse` unavailable; giữ `bySign` | Có |
| Nhà khả dụng, thiếu diễn giải nhà | bước 5 | `part.missing` + `CONTENT_MISSING` | — | Có |
| Đầu vào nhà sai (số nhà null/ngoài 1–12) | bước 4 | `HOUSE_NUMBER_UNRESOLVED` + `IDENTIFIER_UNRESOLVED` | — | Có |
| Một phần hợp lệ | bước 8 | `status="partial"`, các part còn lại `available` | — | Có |
| Chưa phát hành (null + rỗng) | bước 5/7 | `CONTENT_NOT_PUBLISHED` (degraded), `status="unavailable"` | — | Có |

Lỗi hạ tầng/API (HTTP 500, mạng) **không** đến được hàm này — vẫn do luồng lỗi chart F4 xử lý (khớp D-F5 và AC-22); M2 chỉ phân loại dữ liệu đã nhận.

---

## Section E — File-Level Change Plan

| File | Hành động | Mục đích / thay đổi | Vì sao | Phụ thuộc | Test / bằng chứng | Trạng thái |
|---|---|---|---|---|---|---|
| `frontend/src/features/chart/model/interpretation.ts` | **Tạo** | Module thuần (D.1–D.4). Chỉ import: `../api/types` (giá trị: `KNOWN_ZODIAC_SIGNS`, `KNOWN_INTERPRETATION_SUBJECT_TYPES`; kiểu) và `./chartViewModel` (**chỉ kiểu**) | Yêu cầu M2 | `api/types`, `chartViewModel` (kiểu) | U-xx, C-xx, P-xx, coverage | **Xác nhận** |
| `frontend/src/features/chart/model/interpretation.test.ts` | **Tạo** | Unit test public API (Section G, nhóm U) dùng `chartFull`/`chartNoHouses`, helper cục bộ `makeInput(mutator)`/`deepFreeze` (mẫu F4), hoán vị cố định | Hợp đồng công khai | fixtures hiện có | output vitest | **Xác nhận** |
| `frontend/src/features/chart/model/interpretation.contract.test.ts` | **Tạo** | Contract 252 khoá + kiểm tra thuần khiết nguồn (nhóm C và P); **file duy nhất** dùng `/// <reference types="node" />`, `node:fs/path/url` | Cách đọc JSON Backend đã được thử nghiệm (B.6) | `backend/prisma/content/interpretations.vi.json` | output vitest | **Xác nhận** |
| Fixture mới | **Không tạo** | Kịch bản suy giảm dựng từ `structuredClone(chartFull/chartNoHouses)` + chỉnh trong test | Tránh nhân bản 700+ dòng fixture; oracle đã đủ (B.8) | — | — | Không đổi |
| `frontend/src/features/chart/model/chartViewModel.ts` (`PlanetVM.signKey`) | **Không sửa** | Không cần: `sign.key` đủ (J-1) | Không thêm chỉ vì tiện | — | — | **Có điều kiện** — chỉ nếu owner bác bỏ J-1 |
| `frontend/src/features/chart/index.ts` | **Không sửa ở M2** | Chưa có consumer; M3 quyết định export | Tránh mở rộng bề mặt công khai sớm | — | — | Hoãn (J-14) |
| `frontend/vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `package.json` | **Không sửa** | Không cần cấu hình mới: coverage theo file qua CLI; node types qua tham chiếu trong 1 test; không dependency | Tối thiểu hoá thay đổi | — | — | Không đổi |
| `.github/workflows/frontend-ci.yml` | **Không sửa** | `Test` step (`test:coverage`) tự chạy test mới; checkout đủ file Backend | — | — | CI run | Không đổi |
| `docs/implementation/archive/sprint-f5/Sprint_F5_M2_Exit_Criteria_Evidence_Matrix.md` | **Tạo khi đóng** | Evidence + Known Gaps theo mẫu M1 | Quy ước F4/F5 | CI run, coverage | Section K | **Xác nhận** |
| `docs/implementation/Sprint_F5_M2_Implementation_Plan.md` | Tài liệu này | Xoá khi đóng M2 (quy ước) | — | — | — | Tạm thời |
| `docs/implementation/Sprint_F5_Implementation_Plan.md` | **Cập nhật nhỏ khi đóng** | Đánh dấu M2 xong, ghi quyết định J-x đã chốt (nếu có) | Đồng bộ tài liệu sống | — | diff | Có điều kiện |
| `frontend/CHANGELOG.md`, `package.json` version | **Không ở M2** | Version/CHANGELOG thuộc F5.M8 (D-F5-08) | — | — | — | Không đổi |
| Backend (`backend/**`) | **Không đụng** | Không sửa JSON/seed/API | Ràng buộc | — | — | Không đổi |

---

## Section F — Ordered Implementation Tasks

Thứ tự bảo đảm **hợp đồng M1/API và kho khoá 252 được xác minh trước khi viết pipeline** (M2.2–M2.3 trước M2.4).

| ID | Việc | Mục tiêu | Tiên quyết | Files | Chi tiết | Trường hợp biên | Test | Chấp nhận | Bằng chứng |
|---|---|---|---|---|---|---|---|---|---|
| **M2.0** | Pre-flight | Bắt đầu từ trạng thái sạch | Owner duyệt plan | — | `git switch dev && git pull --ff-only`; `git status --short` (kỳ vọng rỗng); ghi SHA; `cd frontend && npx vitest list --json` ⇒ ghi số file/case (kỳ vọng 130/1049); `CI=1 npx playwright test --list` ⇒ 38 | Cây bẩn ⇒ dừng, hỏi owner | — | SHA + baseline ghi lại | log lệnh |
| **M2.1** | Chốt quyết định | J-1…J-15 có kết luận | M2.0 | plan | Owner xác nhận/đổi các mặc định ở Section J; quyết định nào đổi hợp đồng (J-1, J-2, J-3, J-5, J-6) phải xong **trước** M2.4 | — | — | Bảng J có trạng thái | ghi chú owner |
| **M2.2** | Hằng số + hàm tạo khoá + key space | Danh tính chuẩn và khoá | M2.1 | `interpretation.ts` (phần 1), `interpretation.test.ts` | Triển khai D.1; `buildInterpretationKeySpace` sinh 120+120+12 bằng chính 3 hàm tạo khoá | Giá trị nguyên mẫu (`"toString"`), chữ thường, khoảng trắng, số nhà không nguyên | U-01, U-02, U-03 | Test xanh; không có import ngoài allowlist | output vitest |
| **M2.3** | Contract test 252 khoá + khoá thuần khiết | Chứng minh khoá khớp **JSON thật** | M2.2 | `interpretation.contract.test.ts` | Đọc JSON qua `fs` (B.6); so sánh hai chiều; đếm thuộc tính thô; kiểm tập hành tinh/cung/nhà; khoá P-01…P-03 | JSON thiếu/thừa/trùng khoá ⇒ test **đỏ** (không "sửa JSON để qua" — ràng buộc 13) | C-01…C-08, P-01…P-03 | Cả 8 C xanh với JSON hiện tại (252/252) | output vitest |
| **M2.4** | Phân loại mục (bước 3–4 của D.4) | Loại mục hỏng đúng mã | M2.3 | `interpretation.ts` (phần 2), test | Hàm nội bộ `classifyEntries(raw)` ⇒ `{accepted, ambiguous, issues}` | `null`/mảng/chuỗi là mục; `language` thiếu; `"VI"`/`"vi-VN"`; trùng giống nhau và khác nhau; en+vi cùng khoá | U-10…U-13, U-18, U-22 | Mỗi tình huống đúng `issues` và không làm sập các mục khác | output vitest |
| **M2.5** | Suy subject từ VM + ghép + trạng thái | Items/parts/groups/status | M2.4 | `interpretation.ts` (phần 3), test | `deriveItems(vm, accepted, …)`; lắp ráp, sắp issues | Hành tinh trùng; hành tinh ngoài MVP; `sign.known=false`; nhà `null` khi cờ `true`; góc Ascendant 0/1/2; cờ nhà `false` nhưng có `PlanetInHouse` | U-04…U-09, U-14…U-17, U-19, U-23, U-24, U-26 | Fixtures: 21 / 10 như D.5; AC-04…09, 11 ở mức model | output vitest |
| **M2.6** | Tính chất: xáo trộn, bất biến, xác định | Độc lập thứ tự, không đột biến | M2.5 | test | Hoán vị cố định (đảo ngược, xoay 7, xen kẽ) cho `interpretations`, `planets`, `angles` (DTO → `toChartViewModel` → model); `deepFreeze` đầu vào; so `toEqual`; `JSON.stringify` ổn định | Mục hỏng và mục trùng cũng phải bất biến theo thứ tự | U-06, U-20, U-21, U-25 | Mọi so sánh `toEqual` đúng | output vitest |
| **M2.7** | Cổng chất lượng + coverage từng file | Gate xanh, ≥ 90% dòng hoặc ghi gap | M2.6 | — | Chạy Section H; coverage chỉ cho `interpretation.ts` | Nhánh phòng thủ khó chạm (ghi rõ nếu còn) | toàn bộ | Bảng H đạt; % đo thật | log + bảng coverage |
| **M2.8** | Bằng chứng và đóng | Evidence Matrix, Known Gaps | M2.7 + CI xanh | `archive/sprint-f5/Sprint_F5_M2_…Matrix.md` | Theo Section K; xoá file plan M2 trong commit `[docs]` riêng | — | — | AC-04…09, 11, 23 (phần M2) có bằng chứng | Matrix + run URL |

Quy tắc commit (theo M1): một commit `[feat]` chứa **đúng 3 file** (`interpretation.ts`, hai file test); commit `[docs]` riêng cho Matrix và xoá plan; kiểm `git diff --cached --stat` trước khi commit; không trộn tài liệu vào commit mã.

---

## Section G — Detailed Test Matrix

Tất cả test kiểm **hợp đồng công khai**, không kiểm chi tiết riêng tư. Đầu vào dựng bằng `structuredClone(chartFull|chartNoHouses)` → `toChartViewModel` → `buildInterpretationModel` (trừ khi nêu khác).

| ID | Kịch bản | Đầu vào | Kết quả mong đợi (model) | `issues` mong đợi | AC | Mức |
|---|---|---|---|---|---|---|
| U-01 | Hàm tạo khoá hợp lệ | `("Sun","Capricorn")`, `("Sun",7)`, `("Leo")` | `"Sun_in_Capricorn"`, `"Sun_in_House_7"`, `"Ascendant_in_Leo"` | — | AC-04…06 | unit |
| U-02 | Hàm tạo khoá từ chối giá trị lạ | planet `Chiron`/`sun`/`"toString"`; sign `capricorn`/`"Capricorn "`/`7`; house `0`,`13`,`7.5`,`"7"`,`NaN`,`null` | luôn `null`, không ném lỗi | — | — | unit |
| U-03 | Key space | `buildInterpretationKeySpace()` | đúng 252 mục duy nhất; 120 `PlanetInSign`, 120 `PlanetInHouse`, 12 `AngleInSign` | — | — | unit |
| U-04 | Fixture đầy đủ | `chartFull` | `availableCount=21`; `status="ready"`; `houseDataAvailable=true`; groups `core`=[`planet:Sun`,`planet:Moon`,`angle:Ascendant`], `planets`=[Mercury…Pluto] (8); mỗi item `bySign/byHouse` `available` (Ascendant `byHouse=null`); khoá của mọi part = khoá trong `chartFull.interpretations`; `bodyText` bằng nguyên văn; `version="1.0"` | `[]` | AC-04…07, 11 | unit |
| U-05 | Fixture không nhà | `chartNoHouses` | `availableCount=10`; `status="ready"`; 10 `bySign` available; mọi `byHouse` = `unavailable(HOUSE_DATA_UNAVAILABLE)`; `angle:Ascendant.bySign` = `unavailable(ANGLE_ABSENT)` | đúng `[ {HOUSE_DATA_UNAVAILABLE, degraded, "houses", 1} ]` | AC-04…06 | unit |
| U-06 | Độc lập thứ tự | `chartFull` và `chartNoHouses` + ≥ 3 hoán vị cố định của `interpretations`, `planets`, `angles` | `toEqual(baseline)` gồm cả `items`, `groups`, `issues` | không đổi | AC-08 | unit |
| U-07 | Thiếu diễn giải theo cung | bỏ 1 mục `PlanetInSign` của Mars | Mars `bySign` = `missing{subjectKey}`; 20 available; `status="partial"` | `CONTENT_MISSING` defect, subject `PlanetInSign:Mars_in_<sign>` | AC-07 | unit |
| U-08 | Thiếu diễn giải theo nhà (nhà khả dụng) | bỏ 1 mục `PlanetInHouse` | `byHouse` = `missing`; phân biệt với U-05 (không phải `unavailable`) | `CONTENT_MISSING` | AC-07 | unit |
| U-09 | Chưa phát hành / rỗng | `[]` + version `null`; `[]` + version `"1.0"` | (a) mọi part `unavailable(CONTENT_NOT_PUBLISHED)`, `status="unavailable"`; (b) 21 part `missing`, `status="unavailable"` | (a) `CONTENT_NOT_PUBLISHED` degraded; (b) 21 × `CONTENT_MISSING` | — | unit |
| U-10 | Mục sai hình dạng | `null`, `"x"`, `[]`, thiếu `bodyText`, `bodyText:""`/`"  "`/`42`, `subjectKey:""`/`42`, `subjectType` thiếu | các mục này bị loại; 21 part còn lại giữ nguyên `available` | `ENTRY_MALFORMED` defect; mục không danh tính gộp `entry:unidentified` với `count` đúng; mục có danh tính: `<type>:<key>` | — | unit |
| U-11 | Định danh không hỗ trợ | type `AspectInSign`; `("PlanetInSign","Chiron_in_Aries")`, `("PlanetInSign","Sun_in_aries")`, `("PlanetInHouse","Sun_in_House_13")`, `("PlanetInSign","Sun_in_House_1")` | bị loại; phân biệt với "missing" (không sinh part `missing`) | `SUBJECT_UNSUPPORTED` cho từng cái | — | unit |
| U-12 | Ngôn ngữ | `language:"en"`; thiếu/`42`; `"VI"`; `"vi-VN"`; trộn `vi`+`en` cùng khoá | `en`/`VI`/`vi-VN` loại; thiếu/`42` loại như malformed; bản `vi` của khoá trộn **được giữ** và **không** bị tính trùng | `LANGUAGE_NOT_SUPPORTED` / `ENTRY_MALFORMED` tương ứng | — | unit |
| U-13 | Trùng khoá | hai `Sun_in_Capricorn` (cùng nội dung) và (nội dung khác); thêm hoán vị | cả nhóm bị loại; Sun `bySign` = `ambiguous(DUPLICATE_ENTRIES)`; kết quả giống nhau với mọi thứ tự | `DUPLICATE_SUBJECT` defect `count=2` | — | unit |
| U-14 | Mục không áp dụng | `Moon_in_<sai cung>` hợp lệ; `PlanetInHouse` được giao khi cờ nhà `false` | không hiển thị (không thành part `available`); house-dependent **không** xuất hiện là khả dụng | `ENTRY_NOT_APPLICABLE` (kèm `CONTENT_MISSING` cho part mong đợi khi áp dụng) | AC-09 | unit |
| U-15 | Định danh chưa giải quyết được | VM sửa: `sign={known:false,key:"Foo"}`; cờ nhà `true` + `houseNumber:null` | `bySign=unavailable(SIGN_UNRESOLVED)`; `byHouse=unavailable(HOUSE_NUMBER_UNRESOLVED)`; `status="partial"` | `IDENTIFIER_UNRESOLVED` (`planet:X.sign` / `planet:X.house`) | — | unit |
| U-16 | Hành tinh ngoài MVP | VM thêm `Chiron`/`NorthNode` | không có item; giao kèm `Chiron_in_Aries` ⇒ loại | `SUBJECT_UNSUPPORTED` cho mục giao; không issue cho hành tinh | — | unit |
| U-17 | Hành tinh trùng trong VM | hai `Sun` | `planet:Sun` cả hai part `ambiguous(DUPLICATE_IDENTIFIER)`; item khác nguyên vẹn | `AMBIGUOUS_IDENTIFIER` `planet:Sun` (có thể kèm `ENTRY_NOT_APPLICABLE` cho mục Sun — chấp nhận) | — | unit |
| U-18 | `interpretations` không phải mảng | `undefined`, `null`, `{}`, `"x"` | không ném lỗi; mọi part `missing`/`unavailable`; `status="unavailable"` | `ENTRY_MALFORMED` subject `interpretations` (không im lặng) | — | unit |
| U-19 | VM không hành tinh | `planets: []` | không có nhóm `planets`; mọi nhóm phát ra có ≥ 1 item; Ascendant `unavailable(ANGLE_ABSENT)` nếu không có góc | — | AC-11 | unit |
| U-20 | Bất biến đầu vào | `deepFreeze` DTO fields + VM | không ném lỗi; đầu vào không đổi (so với bản `structuredClone`) | — | — | unit |
| U-21 | Xác định/tuần tự hoá | gọi 2 lần; `JSON.parse(JSON.stringify(m))` | `toEqual` giữa hai lần và giữa bản gốc/bản tuần tự hoá | — | AC-08 | unit |
| U-22 | Phiên bản | `interpretationVersion: 5`; `null` + có mục | `version=null` khi không phải chuỗi; vẫn xử lý mục | `VERSION_INVALID` (defect) theo J-13 | — | unit |
| U-23 | Quy tắc Ascendant | (a) angles có Ascendant + sign hợp lệ; (b) không có; (c) hai Ascendant; (d) sign `known:false`; (e) cờ nhà `false` nhưng vẫn có Ascendant + mục giao | (a) available; (b) `ANGLE_ABSENT`; (c) `ambiguous`; (d) `SIGN_UNRESOLVED`; (e) available (theo J-5, không suy từ cờ) | tương ứng | AC-06 | unit |
| U-24 | Cấu trúc theo AC-09 | mọi fixture | `group ∈ {"core","planets"}`; id item chỉ `planet:*` / `angle:Ascendant`; không có nhóm/mục "nhà" | — | AC-09, AC-11 | unit |
| U-25 | `bodyText` nguyên văn | mục có khoảng trắng đầu/cuối, ký tự đặc biệt, `<b>x</b>` | giá trị trong part bằng **chính xác** chuỗi vào (không trim, không escape, không biến đổi) | — | AC-23 | unit |
| U-26 | Không có suy luận giờ sinh | `chartNoHouses` | không có `code`/`reason` nào liên quan giờ sinh; `issues` chỉ gồm tập mã khai báo | `[HOUSE_DATA_UNAVAILABLE]` | AC-05 | unit |
| C-01 | Hình dạng JSON | đọc `interpretations.vi.json` | `language==="vi"`; `items` là mảng; mỗi mục có đúng `{subjectType,subjectKey,bodyText}`; `subjectType` ∈ 3 loại | — | — | contract |
| C-02 | Trùng thuộc tính trong mục | văn bản thô | số lần `"subjectKey"\s*:` = `"subjectType"` = `"bodyText"` = `items.length` | — | — | contract |
| C-03 | JSON duy nhất | `items` | `Set(type+key).size === items.length === 252` | — | — | contract |
| C-04 | Key space sinh ra | `buildInterpretationKeySpace()` | độ dài 252 và duy nhất (không che bằng so sánh kích thước tập) | — | — | contract |
| C-05 | Khớp chính xác | sinh ra ↔ JSON | `missing = []`, `unexpected = []` (so sánh hai chiều, in danh sách khi lệch); phân rã theo loại 120/120/12 | — | — | contract |
| C-06 | Định danh chuẩn | JSON | tập hành tinh trong JSON = `INTERPRETATION_PLANETS` = 10 phần tử đầu `KNOWN_PLANET_NAMES`; tập cung ⊂ `KNOWN_ZODIAC_SIGNS` (12); nhà 1–12; khớp chính xác hoa/thường | — | — | contract |
| C-07 | Mọi khoá JSON được model chấp nhận | mỗi mục JSON dựng thành mục API (`language:"vi"`) | không mục nào bị `SUBJECT_UNSUPPORTED` | — | — | contract |
| C-08 | Fixture ↔ nguồn | `chartFull`/`chartNoHouses` | mọi `subjectKey` của fixture thuộc kho JSON; model cho 21 / 10 | — | AC-04…07 | contract |
| P-01 | Allowlist import | văn bản nguồn `interpretation.ts` | mọi `import … from` ∈ {`../api/types`, `./chartViewModel` (chỉ `import type`)} | — | — | architecture |
| P-02 | Không phụ thuộc môi trường | văn bản nguồn | không chứa `react`, `document`, `window`, `localStorage`, `fetch`, `Math.random`, `Date`, `console` | — | — | architecture |
| P-03 | Không hardcode văn bản/HTML | văn bản nguồn | không có ký tự ngoài ASCII; không có `dangerouslySetInnerHTML` | — | AC-23 | architecture |

Test phản ví dụ bắt buộc: C-05 phải **đỏ** nếu một khoá bị đổi hoa/thường hoặc bị xoá (xác minh thủ công một lần bằng bản sao tạm trong `/tmp` — không sửa JSON trong repo).

---

## Section H — Quality Gates and Commands

Tất cả chạy tại `frontend/` (workspace Frontend), lệnh lấy từ `package.json` và `frontend-ci.yml`.

| Gate | Lệnh | Mong đợi | Phạm vi |
|---|---|---|---|
| Format | `npm run format:check` | pass | frontend |
| Lint | `npm run lint` | 0 lỗi mới | frontend (gồm file test mới) |
| Typecheck | `npm run typecheck` | exit 0 (gồm `node:fs` qua `/// <reference types="node" />` trong test contract) | frontend |
| Unit + contract | `npx vitest run src/features/chart/model/interpretation.test.ts src/features/chart/model/interpretation.contract.test.ts` | xanh | frontend |
| Toàn bộ test | `npm test` | xanh; số file ≥ 132 (130 + 2), số case ≥ baseline | frontend |
| **Coverage theo file** | `npx vitest run --coverage --coverage.include=src/features/chart/model/interpretation.ts --coverage.reporter=text src/features/chart/model/interpretation.test.ts src/features/chart/model/interpretation.contract.test.ts` | dòng ≥ 90% cho `interpretation.ts`; in cột `Uncovered Line #s` (lệnh đã được chạy thử trên file mẫu) | frontend |
| Coverage tổng hợp | `npm run test:coverage` | xanh (CI) | frontend |
| Build | `npm run build` | exit 0 | frontend |
| E2E | `npm run test:e2e` (CI) / `CI=1 npx playwright test --list` (cục bộ) | 38 test, xanh trên CI; M2 không đổi E2E | frontend/CI |
| Grep an toàn | `grep -rn "dangerouslySetInnerHTML" frontend/src` | 0 | repo |
| Biên kiến trúc | **không có** (`boundaries/element-types` đang `off`); thay bằng P-01…P-03 trong test | pass | frontend |
| Script chưa có | Không có script npm riêng cho coverage từng file; dùng lệnh CLI ở trên (không thêm script/cấu hình) | — | — |

Cổng nào không chạy được cục bộ (E2E, coverage đầy đủ nếu lâu) ghi rõ là bằng chứng CI. **Không** claim ≥ 90% nếu chưa có bảng coverage từng file.

---

## Section I — Acceptance and Definition of Done

- ☐ Hợp đồng mô hình thuần: `interpretation.ts` đúng D.1–D.4, chỉ export các ký hiệu đã nêu.
- ☐ Nhóm hỗ trợ (Ascendant-in-sign, Planet-in-sign, Planet-in-house) với khoá chuẩn; không nhóm khác (góc chiếu/tổng hợp).
- ☐ Phân loại: thiếu, hỏng, `language≠vi`, trùng, định danh lạ, mục thừa — mỗi loại có mã và test (U-07…U-18).
- ☐ `issues` đúng cấu trúc `{code, category, subject, count}`, sắp xếp chuẩn, gộp xác định.
- ☐ Nhà không khả dụng: giữ `bySign`, `byHouse` = `unavailable`; không suy giờ sinh (U-05, U-26).
- ☐ Contract 252 khoá hai chiều với JSON thật xanh (C-01…C-08); không có danh sách khoá chép tay.
- ☐ Fixture đầy đủ ⇒ **21** part available; không nhà ⇒ **10** (Ascendant vắng do `angles=[]`; không ép thành 11).
- ☐ Độc lập thứ tự (U-06) và bất biến (U-20), xác định (U-21).
- ☐ Không import React/DOM (P-01…P-03); `bodyText` nguyên văn (U-25).
- ☐ AC-04…09, 11, 23 (phần M2) có bằng chứng theo Section C.
- ☐ Mọi gate Section H đạt; coverage dòng `interpretation.ts` **≥ 90% đo thật**, hoặc gap được ghi (% đo, dòng/nhánh chưa phủ, lý do, quyết định tiếp theo) — không claim DoD đầy đủ khi thiếu.
- ☐ Không hồi quy F4 (toàn bộ test F4 xanh, 38 E2E xanh trên CI), `chartViewModel.ts` không đổi.
- ☐ Không thay đổi Backend/API/cấu hình/dependency nằm ngoài danh sách Section E.
- ☐ Evidence Matrix + Known Gaps tạo; plan M2 được xoá; owner nghiệm thu.

---

## Section J — Risks and Owner Decisions

**Đã được Owner phê duyệt toàn bộ (2026-11-01):** Các quyết định blocking J-2, J-3, J-5, J-6 đã được chốt chính thức cùng toàn bộ khuyến nghị Section J.

| ID | Mô tả | Bằng chứng | Tác động | Quyết định đã chốt từ Owner | Trạng thái phê duyệt |
|---|---|---|---|---|:---:|
| **J-1** | `PlanetVM.signKey` có cần không? | M1 Matrix D-06 + `labels.ts`: `sign.key` là chuỗi không null, bằng chuỗi Backend khi `known`; type là `string` | Thêm `signKey` = sửa hợp đồng F4 + fixtures/test | **Không thêm.** Model dùng `sign.known && guard 12 cung` để thu hẹp kiểu | **APPROVED** |
| **J-2** | Đầu vào của model | VM đã đối soát cờ nhà, loại mục hỏng, sắp xếp chuẩn | DTO-only sẽ lặp lại logic kiểm tra của F4 | **Chốt theo đề xuất:** nhận phần diễn giải từ DTO (`Pick<ChartResponse, "interpretations" \| "interpretationVersion">`) và `planets`, `angles`, `flags` từ VM (`Pick<ChartViewModel, "planets" \| "angles" \| "flags">`). VM đã chuẩn hóa và đối soát dữ liệu nhà; DTO vẫn là nguồn của `interpretations` và `interpretationVersion`. Tránh lặp logic F4 và không buộc model nhận cả VM nếu chỉ dùng một phần | **APPROVED** |
| **J-3** | VM giữ hành tinh trùng tên | `buildPlanets`: `DUPLICATE_ENTITY` nhưng giữ cả hai | Nếu im lặng chọn một ⇒ first-wins ngầm | **Chốt theo đề xuất:** đánh dấu `ambiguous`, không chọn phần tử đầu/cuối, không sửa `PlanetVM` trong M2. F4 ghi nhận `DUPLICATE_ENTITY` nhưng vẫn giữ các hành tinh trùng. Chọn một mục sẽ tạo quy tắc ngầm và có thể ghép sai nội dung. Phát hiện trùng ngay trong model diễn giải là xử lý cục bộ đúng phạm vi | **APPROVED** |
| **J-4** | Ngữ nghĩa `language` | API: trên từng mục; JSON: cấp file; Backend dùng `languages.code` ("vi") | Chuẩn hoá `"VI"`/`"vi-VN"` có thể che lỗi | So sánh **chính xác** `=== "vi"`; khác ⇒ `LANGUAGE_NOT_SUPPORTED`; thiếu/không phải chuỗi ⇒ `ENTRY_MALFORMED` | **APPROVED** |
| **J-5** | Ascendant khi nhà không khả dụng | Backend derive: Ascendant theo **sự hiện diện góc**, không theo cờ; fixture không nhà có `angles=[]` ⇒ 10 | Hai quy tắc chỉ khác nhau với dữ liệu mâu thuẫn | **Chốt theo đề xuất:** căn cứ vào Ascendant hợp lệ hiện diện trong VM và nội dung khớp; không suy từ cờ nhà. Backend chỉ sinh diễn giải Ascendant khi có góc Ascendant. Nhất quán với quyết định trước về việc không dùng `isHouseDataAvailable=false` để suy ra nguyên nhân. Trường hợp DTO mâu thuẫn vẫn test: có Ascendant hợp lệ thì có thể ghép theo cung; không có thì là `ANGLE_ABSENT` | **APPROVED** |
| **J-6** | Hình dạng issue | F4 `ChartIssue {code, subject}` | Cần phân biệt degraded/defect và gộp mục không danh tính | **Chốt `{code, category, subject, count}` như đề xuất**, với điều kiện quy định bảng `code → category` cố định và mọi issue được gộp/xếp thứ tự xác định. `category` giúp tách suy giảm hợp lệ khỏi dữ liệu lỗi; `count` cho phép gộp trùng mà không dùng chỉ số mảng. Không thêm `message`, severity riêng hay cờ blocking | **APPROVED** |
| **J-7** | Nguồn danh tính chuẩn | `INTERPRETATION_PLANETS` lặp lại `MVP_INTERPRETATION_PLANETS` (Backend); cung từ `KNOWN_ZODIAC_SIGNS` | Có thể trôi lệch | Giữ danh sách cục bộ + C-06 khoá với JSON và `KNOWN_PLANET_NAMES` (không import Backend vào FE) | **APPROVED** |
| **J-8** | Giới hạn phát hiện trùng trong JSON | `items` là mảng (trùng mục thấy được); trùng thuộc tính trong mục không thấy sau `JSON.parse` | Trùng thuộc tính im lặng | C-02 đếm thuộc tính trong văn bản thô; không thêm dependency; dương tính giả nếu `bodyText` chứa nguyên văn `"subjectKey":` (ghi nhận) | **APPROVED** |
| **J-9** | Ngữ nghĩa AC-04…07, 11, 23 | F5 plan §17: mức **hiển thị** | M2 chỉ chứng minh phần model | Ghi rõ phần M2/M3 (Section C) | **APPROVED** |
| **J-10** | Truy cập chéo workspace tới JSON Backend | spike B.6: `?raw` bị chặn; `fs` + tham chiếu kiểu Node chạy được | `?raw` cần đổi `vite.config.ts`; `types` toàn cục rộng hơn | `fs` trong **một** file test contract; không đổi cấu hình; đường dẫn tương đối repo; dùng `fileURLToPath` (không `new URL`, do jsdom) | **APPROVED** |
| **J-11** | Coverage cho một file | không có ngưỡng; CLI `--coverage.include` đã chạy thử | Tổng gộp che khuất | Lệnh theo file (Section H); báo cả % nhánh; không thêm ngưỡng vào cấu hình | **APPROVED** |
| **J-12** | Ý nghĩa "21/10" | fixtures: 21 = 10+1+10, 10 = 10 PlanetInSign (angles rỗng) | Hiểu nhầm thành 11 hoặc đếm số mảng | Đếm `availableCount` (part `available`); test khẳng định phân rã, không chỉ độ dài | **APPROVED** |
| **J-13** | Phiên bản không hợp lệ / null có mục | Backend: `null` chỉ khi rỗng | Dữ liệu mâu thuẫn bị bỏ qua | Giá trị không phải `string\|null` ⇒ `VERSION_INVALID`; `null` + có mục ⇒ vẫn xử lý mục, **không** thêm mã riêng (ghi nhận Known Gap nếu cần) | **APPROVED** |
| **J-14** | Bề mặt export | `features/chart/index.ts` chỉ export VM | Export sớm mở rộng API công khai | Không sửa `index.ts` ở M2; M3 quyết định | **APPROVED** |
| **J-15** | Mục không danh tính trong issues | chỉ số mảng sẽ phá bất biến thứ tự | Issue phụ thuộc thứ tự | Gộp `entry:unidentified` + `count`; subject dùng danh tính khi có | **APPROVED** |
| **R-1** | Tập khoá lệch sau này (Backend đổi nội dung/khoá) | Contract test hai chiều | Đỏ có chủ đích | Test chạy lại khi `backend/**` đổi (trigger workflow) | — |
| **R-2** | Pipeline quá phức tạp | 11 mã issue, 4 trạng thái part | Khó bảo trì | Giữ hàm nội bộ nhỏ; không thêm trường ngoài D.2–D.3 | — |

---

## Section K — Evidence and Closure Package

Bằng chứng lưu ở `docs/implementation/archive/sprint-f5/Sprint_F5_M2_Exit_Criteria_Evidence_Matrix.md` (theo M1); nhãn `VERIFIED / PARTIALLY VERIFIED / UNVERIFIED / ACCEPTED GAP`; số liệu **chỉ** lấy từ lệnh thật/CI.

| # | Bằng chứng | Nguồn / lệnh |
|---|---|---|
| 1 | Output contract 252 khoá (C-01…C-08) | `npx vitest run …interpretation.contract.test.ts` (trích dòng pass) |
| 2 | Output fixture đầy đủ: 21 (U-04) | `npx vitest run …interpretation.test.ts -t "U-04"` hoặc trích từ log đầy đủ |
| 3 | Output fixture không nhà: 10 (U-05, U-26) | tương tự |
| 4 | Output xáo trộn/độc lập thứ tự (U-06, U-21) | tương tự |
| 5 | Output phân loại (U-07…U-19, U-22, U-23) | tương tự |
| 6 | Kết quả lint/typecheck/test/format | log `npm run lint/typecheck/format:check/test` |
| 7 | Bảng coverage riêng `interpretation.ts` (dòng, nhánh, hàm, dòng chưa phủ) | lệnh coverage theo file (Section H) |
| 8 | Xác minh thuần khiết: P-01…P-03 + grep + danh sách import thực của file | output test + `grep -n "^import" interpretation.ts` |
| 9 | Known Gaps / Evidence Matrix cập nhật | file Matrix |
| 10 | Tóm tắt đóng: SHA commit mã, URL run CI (job Frontend CI), số file/case test (so với baseline), trạng thái pass/fail/gap từng AC | Matrix |

Không tạo kết quả test giả trong giai đoạn lập kế hoạch.

---

## Section L — Handoff to Implementation

**Thứ tự đề xuất:** M2.0 → M2.1 → M2.2 → M2.3 → M2.4 → M2.5 → M2.6 → M2.7 → M2.8 (tuần tự; M2.3 phải xanh **trước** khi viết pipeline).

**Phải chốt trước khi viết mã:** owner duyệt plan; J-2, J-3, J-5, J-6 (mặc định ở Section J); xác nhận M2 chỉ tạo 3 file mã/test và không sửa `PlanetVM`, cấu hình hay Backend.

**Có thể để mở mà không chặn:** J-1 (đóng bằng xác nhận), J-4, J-7, J-8, J-9, J-10 (đã có spike), J-11…J-15, danh sách copy ở M3, vị trí khu vực đọc (đo ở M6).

**Checklist triển khai (ngắn):**
1. Pre-flight sạch + baseline 130/1049/38.
2. `interpretation.ts` phần 1: hằng số, 3 hàm tạo khoá, key space (+ U-01…U-03).
3. `interpretation.contract.test.ts`: C-01…C-08, P-01…P-03 trên JSON thật (phải xanh).
4. Phân loại mục (U-10…U-13, U-18, U-22).
5. Suy subject từ VM, ghép, trạng thái, issues (U-04…U-09, U-14…U-17, U-19, U-23, U-24, U-26).
6. Xáo trộn/bất biến/xác định/`bodyText` nguyên văn (U-06, U-20, U-21, U-25).
7. Chạy toàn bộ gate + coverage theo file; ghi % thật.
8. Commit `[feat]` đúng 3 file; chờ CI xanh; Matrix + xoá plan bằng commit `[docs]`.

---

## Phụ lục — Bằng chứng audit

- Repo: `git status`, `git log` (HEAD `c95e667`), diff `60d733d..c95e667` (Matrix M1).
- Đọc: `api/types.ts`, `model/chartViewModel.ts` (VM, `buildPlanets`, `buildHouses`, `resolvePlanetHouseNumbers`, `toChartViewModel`, `validateStructure`), `model/labels.ts` (`resolveSign`, `resolveAngle`), `api/mocks/fixtures.ts`, `fixtures.contract.test.ts`, `chartViewModel.test.ts` (mẫu helper), `vite.config.ts`, `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`, `src/test/setup.ts`, `features/chart/index.ts`, `derive-interpretation-subjects.ts`, `interpretation-subject-key.ts`, `interpretation.types.ts`, `interpretation-lookup.service.ts`, `Sprint_F5_Implementation_Plan.md` §10/§17, Evidence Matrix M1.
- Đã chạy (không biến đổi repo): script phân tích `interpretations.vi.json` (252 mục, 252 duy nhất, 10 hành tinh, 12 cung, nhà 1–12, 12 Ascendant, chỉ 3 trường/mục, `language` cấp file); phân tích fixtures qua `node --experimental-strip-types` (21 / 10, khớp khoá suy ra); spike trong **bản sao `/tmp`** cho 4 cách đọc JSON Backend (kết quả ở B.6) và cho coverage từng file (`format.ts`, 100%); `playwright --list` (38/7, từ M1).
- **Không** chạy: toàn bộ `vitest run` (chậm trong sandbox), E2E, build; baseline test lấy từ M1 Matrix và lần đo `vitest list` trước đó.
- Tác dụng phụ trong sandbox: `/tmp/spike`, `/tmp/fx.mts` (ngoài repo); `node_modules`/`frontend/.env` (git bỏ qua); không có thay đổi theo dõi ngoài file plan này.
- **[Open]/chưa xác minh:** hành vi thật của pipeline khi triển khai; số pass vitest tại `c95e667` (chỉ thay đổi tài liệu/e2e so với baseline); ngưỡng pháp lý của disclaimer (thuộc M3/M5).
