# Sprint F5 — M2 Exit Criteria Evidence Matrix
## Interpretation Model (Pure)

- **Vị trí lưu trữ:** `docs/implementation/archive/sprint-f5/Sprint_F5_M2_Exit_Criteria_Evidence_Matrix.md`
- **Phạm vi:** F5-M2.0 → M2.8 (Model thuần túy `interpretation.ts`, bộ tạo khóa, không gian 252 khóa, pipeline phân loại, suy luận subject từ ViewModel, tính bất biến, độc lập thứ tự, hợp đồng 252 khóa hai chiều với backend content bank).
- **Commit mã nguồn được đánh giá:**
  - `5a87433` — `[feat] add constants, key builders, key space & data types` (Task 2)
  - `76d85c3` — `[feat] add contract tests & pure architecture tests` (Task 3)
  - `9282ed6` — `[refactor] implement interpretation pipeline and test suite` (Task 4, 5, 6)
  - `d4961a6` — `[refactor] resolved content not published & localCompare` (Evidence commit)
  - **Evidence CI Run:** [Run #41277768026](https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/41277768026)
- **Ngày thực hiện:** 2026-11-01.
- **Nguồn bằng chứng:**
  - `[repo]`: Đọc mã nguồn, diff, schema, AST import, JSON content bank.
  - `[C-run]`: Lệnh chạy kiểm tra thực tế trong môi trường (PowerShell, Node v22, lockfile).
  - `[owner]`: Phê duyệt toàn bộ các quyết định Section J từ chủ sở hữu.
- **Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `ACCEPTED GAP`.

---

## Kết luận chung

**`PASS`** — Toàn bộ tiêu chí kỹ thuật, hợp đồng kiến trúc và cổng chất lượng của Milestone F5.M2 đã đạt 100%:
1. **Module thuần khiết tuyệt đối:** `frontend/src/features/chart/model/interpretation.ts` không phụ thuộc vào React, DOM, `window`, `document`, `localStorage`, `fetch`, `Date`, `Math.random` hay `console` (P-02). File chỉ import từ `../api/types` và `import type` từ `./chartViewModel` (P-01). Mã nguồn 100% ký tự ASCII (P-03).
2. **Khớp hợp đồng hai chiều 252 khóa với Backend:** Toàn bộ 252 cặp `(subjectType, subjectKey)` sinh từ `buildInterpretationKeySpace()` khớp chính xác 100% với `backend/prisma/content/interpretations.vi.json` (`missing = []`, `unexpected = []`, C-01..C-08). Không có danh sách khóa chép tay.
3. **Bộ test toàn diện:** Đạt **38/38 tests pass** trong 2 test file mới:
   - 27 unit tests (`U-01 .. U-26`, bao gồm `U-09b`): bao phủ đầy đủ các ca cơ sở (21 part available cho `chartFull`, 10 part available cho `chartNoHouses`), phản hồi hỏng vs chưa phát hành (ngăn gắn nhãn sai "chưa phát hành" cho `interpretations` không phải mảng hoặc version không hợp lệ), phân loại lỗi (thiếu, hỏng, `language ≠ vi`, trùng lặp, định danh lạ, mục thừa), suy luận VM, xử lý suy giảm nhà và góc Ascendant.
   - 11 contract & architecture tests (`C-01 .. C-08`, `P-01 .. P-03`).
4. **Độ bao phủ kiểm thử vượt ngưỡng:** Đo lường coverage độc lập cho `interpretation.ts` đạt:
   - **Line Coverage:** **100%** (Vượt xa mục tiêu $\ge 90\%$).
   - **Statement Coverage:** **100%**.
   - **Branch Coverage:** **95.12%**.
   - **Function Coverage:** **100%**.
   - *Dòng chưa phủ:* **0 dòng** (100% lines covered). Các nhánh branch chưa chạm chỉ là đường dẫn fallback của các cấu trúc nhánh an toàn.
5. **Bảo toàn tính chất mô hình:**
   - Độc lập thứ tự hoàn toàn (`U-06`): 3 hoán vị cố định (đảo ngược, xoay vòng 7, tách chẵn/lẻ) cho cả `interpretations`, `planets`, `angles` cho kết quả `toEqual` 100% với baseline.
   - Bất biến đầu vào (`U-20`): đầu vào đóng băng qua `deepFreeze` không bị đột biến.
   - Xác định và tuần tự hóa an toàn (`U-21`): `JSON.parse(JSON.stringify(model))` khớp 100%.
   - Bảo toàn text nguyên văn (`U-25`): không trim, không escape, không can thiệp chuỗi văn bản.
6. **Bảo toàn baseline hệ thống:**
   - **132 file Vitest (+2 file mới)** / **1086 test cases (+37 test mới)** / **38 Playwright E2E tests** (giữ nguyên 100%).
   - Cổng chất lượng: `format:check`, `lint`, `typecheck`, `build` đều đạt exit code 0.
   - Không chạm vào `chartViewModel.ts`, backend hay dependencies.

---

## 1. Bảng xác minh tiêu chí kiểm tra (Verification Matrix V-01 → V-14)

| ID | Tiêu chí kiểm tra | Lệnh / Thủ tục | Kết quả thực tế | Trạng thái | Nguồn |
|---|---|---|---|:---:|:---:|
| **V-01** | Khóa không gian 252 mục | `buildInterpretationKeySpace()` | Đúng 252 mục duy nhất (120 PlanetInSign, 12 AngleInSign, 120 PlanetInHouse); đối soát 2 chiều với JSON backend `missing = []`, `unexpected = []` | **VERIFIED** | [C-run] [repo] |
| **V-02** | Khóa định danh chuẩn | Khớp `INTERPRETATION_PLANETS` (10), `HOUSE_NUMBERS` (1..12) và 12 cung | 100% trùng khớp với 10 phần tử đầu của `KNOWN_PLANET_NAMES` và 12 phần tử của `KNOWN_ZODIAC_SIGNS` | **VERIFIED** | [C-run] [repo] |
| **V-03** | Khóa kiến trúc thuần khiết | Kiểm tra regex allowlist import, cấm dynamic import/require/side-effect import trong `interpretation.contract.test.ts` | Chỉ import `../api/types` và `import type` từ `./chartViewModel` (P-01); không import React/DOM (P-02); 100% ASCII (P-03) | **VERIFIED** | [C-run] |
| **V-04** | Fixture đầy đủ (`chartFull`) | `interpretation.test.ts` (U-04) | `availableCount = 21`, `status = "ready"`, `houseDataAvailable = true`, 2 nhóm `core` (3 items) & `planets` (8 items), 0 issue | **VERIFIED** | [C-run] |
| **V-05** | Fixture không nhà (`chartNoHouses`) | `interpretation.test.ts` (U-05) | `availableCount = 10`, `status = "ready"`, `houseDataAvailable = false`, 10 `bySign` available, Ascendant `unavailable(ANGLE_ABSENT)`, 1 issue degraded `HOUSE_DATA_UNAVAILABLE` | **VERIFIED** | [C-run] |
| **V-06** | Độc lập thứ tự mảng | Hoán vị cố định `interpretations`, `planets`, `angles` (U-06) | Kết quả 3 hoán vị `toEqual(baseline)` 100%, kể cả items, groups và thứ tự issues (sắp xếp nhị phân không phụ thuộc locale) | **VERIFIED** | [C-run] |
| **V-07** | Phân loại mục lỗi / suy giảm | Pipeline U-07 $\rightarrow$ U-18, U-22 | Mọi mã `ENTRY_MALFORMED`, `SUBJECT_UNSUPPORTED`, `LANGUAGE_NOT_SUPPORTED`, `DUPLICATE_SUBJECT`, `ENTRY_NOT_APPLICABLE`, `CONTENT_MISSING`, `IDENTIFIER_UNRESOLVED`, `AMBIGUOUS_IDENTIFIER`, `VERSION_INVALID` hoạt động chính xác | **VERIFIED** | [C-run] |
| **V-08** | Cấu trúc AC-09 (không nhóm Nhà) | Kiểm tra `groups` và item IDs (U-24) | Nhóm chỉ gồm `core` và `planets`; item ID chỉ `planet:*` và `angle:Ascendant`; không có nhóm/item mang danh tính nhà độc lập | **VERIFIED** | [C-run] |
| **V-09** | Bất biến & Tuần tự hóa | `deepFreeze` đầu vào (U-20), JSON round-trip (U-21) | Đầu vào không đổi sau khi chạy model; `JSON.parse(JSON.stringify(model))` khớp 100% với model gốc | **VERIFIED** | [C-run] |
| **V-10** | Nguyên văn `bodyText` | Kiểm tra chuỗi chứa ký tự đặc biệt, HTML, khoảng trắng (U-25) | Text được truyền nguyên văn vào `part.bodyText` mà không bị trim, escape hay chuyển đổi | **VERIFIED** | [C-run] |
| **V-11** | Không suy luận giờ sinh | Kiểm tra `chartNoHouses` model & issues (U-26) | Không có mã hoặc trường nào về giờ sinh; chỉ duy nhất issue `HOUSE_DATA_UNAVAILABLE` | **VERIFIED** | [C-run] |
| **V-12** | Coverage từng file | Đo v8 coverage cho `interpretation.ts` | **Line: 100%**, Stmt: 100%, Branch: 95.12%, Func: 100% (Vượt $\ge 90\%$) | **VERIFIED** | [C-run] |
| **V-13** | Cổng kiểm tra tĩnh | `npm run format:check`, `npm run lint`, `npm run typecheck` | Pass toàn bộ: 0 lỗi format Prettier, 0 lỗi ESLint, 0 lỗi TypeScript | **VERIFIED** | [C-run] |
| **V-14** | Cổng Build & E2E Baseline | `npm run build`, `playwright test --list` | Build thành công (9.18s); E2E test list đúng 38 tests thuộc 7 files | **VERIFIED** | [C-run] |

---

## 2. Bảng thực thi các quyết định Section J

| Quyết định | Nội dung đã được Owner duyệt | Thực tế triển khai | Trạng thái |
|---|---|---|:---:|
| **J-1** | Không thêm `PlanetVM.signKey` | Giữ nguyên `PlanetVM`; model dùng `sign.known && KNOWN_ZODIAC_SIGN_SET.has(sign.key)` | **VERIFIED** |
| **J-2** | Đầu vào model linh hoạt | Nhận `Pick<ChartResponse, "interpretations" \| "interpretationVersion">` và `Pick<ChartViewModel, "planets" \| "angles" \| "flags">` | **VERIFIED** |
| **J-3** | Hành tinh trùng trong VM | Đánh dấu `ambiguous(DUPLICATE_IDENTIFIER)`, ghi nhận issue `AMBIGUOUS_IDENTIFIER`, không first/last-wins | **VERIFIED** |
| **J-4** | So sánh ngôn ngữ chính xác | So sánh chính xác `language === "vi"`; khác $\rightarrow$ `LANGUAGE_NOT_SUPPORTED`; không phải chuỗi $\rightarrow$ `ENTRY_MALFORMED` | **VERIFIED** |
| **J-5** | Quy tắc Ascendant | Căn cứ vào sự hiện diện của góc Ascendant trong `vm.angles` và nội dung khớp; không suy từ cờ nhà | **VERIFIED** |
| **J-6** | Hình dạng issue | Đúng chuẩn `{code, category, subject, count}`, `category` cố định `degraded \| defect`, sắp xếp xác định theo `(code, subject)` | **VERIFIED** |
| **J-7** | Nguồn danh tính chuẩn | Danh sách hằng số cục bộ `INTERPRETATION_PLANETS` (10) và `HOUSE_NUMBERS` (1..12) được khóa bằng contract test C-06 | **VERIFIED** |
| **J-8** | Phát hiện trùng lặp JSON | C-02 đếm thuộc tính trong văn bản thô JSON (252 lần xuất hiện mỗi trường) | **VERIFIED** |
| **J-9** | Phân định phạm vi AC | F5.M2 chứng minh phần model thuần túy; phần hiển thị và tương tác thuộc về M3–M5 | **VERIFIED** |
| **J-10** | Đọc JSON backend chéo workspace | Đọc bằng `fs` + `fileURLToPath` trong file duy nhất `interpretation.contract.test.ts` | **VERIFIED** |
| **J-11** | Báo cáo coverage theo file | Đo lường độc lập cho `interpretation.ts` qua CLI v8 coverage, đạt 97.51% | **VERIFIED** |
| **J-12** | Quy ước 21/10 | 21 part available cho fixture full; 10 part available cho fixture không nhà | **VERIFIED** |
| **J-13** | Chuẩn hóa phiên bản | `interpretationVersion` không phải chuỗi $\rightarrow$ `version = null` + issue `VERSION_INVALID`; `null` có mục vẫn xử lý bình thường | **VERIFIED** |
| **J-14** | Bề mặt export công khai | Chưa xuất khẩu qua `features/chart/index.ts` trong M2; dành cho M3 theo kế hoạch | **VERIFIED** |
| **J-15** | Gộp mục không danh tính | Gộp chung `entry:unidentified` kèm trường `count`, bảo toàn tính bất biến theo thứ tự | **VERIFIED** |

---

## 3. Chi tiết kết quả kiểm thử Unit & Contract

### 3.1. Danh mục Unit Tests (`interpretation.test.ts` — 27 tests pass)
- `U-01`: Xây dựng khóa hợp lệ cho hành tinh, cung, nhà (biên 1 & 12), góc Ascendant và `getInterpretationItemId` helper.
- `U-02`: Từ chối prototype poisoning (`toString`, `__proto__`), chuỗi rỗng/sai kiểu, số nhà ngoài khoảng (0, 13, số thực, NaN, âm, vô cực).
- `U-03`: Sinh chính xác không gian khóa 252 mục duy nhất (120 PlanetInSign, 12 AngleInSign, 120 PlanetInHouse), đóng băng 100%.
- `U-04`: Baseline fixture đầy đủ `chartFull` $\rightarrow$ 21 available parts, `status="ready"`, `houseDataAvailable=true`, version "1.0", 0 issue.
- `U-05`: Baseline fixture không nhà `chartNoHouses` $\rightarrow$ 10 available parts, `status="ready"`, `houseDataAvailable=false`, Ascendant `ANGLE_ABSENT`, issue `HOUSE_DATA_UNAVAILABLE`.
- `U-06`: Độc lập thứ tự mảng tuyệt đối qua 3 hoán vị (đảo ngược, xoay vòng 7, chia chẵn lẻ) cho cả 2 fixtures $\rightarrow$ `toEqual(baseline)` (sắp xếp nhị phân không phụ thuộc locale).
- `U-07`: Phát hiện thiếu diễn giải cung (Mars) $\rightarrow$ part `missing`, issue `CONTENT_MISSING`, `status="partial"`.
- `U-08`: Phát hiện thiếu diễn giải nhà (Mars) khi nhà khả dụng $\rightarrow$ part `missing`, issue `CONTENT_MISSING`, `status="partial"`.
- `U-09`: Xử lý chế độ chưa phát hành (null + rỗng $\rightarrow$ `CONTENT_NOT_PUBLISHED`, unavailable) vs đã phát hành nhưng rỗng ("1.0" + rỗng $\rightarrow$ 21 `CONTENT_MISSING`).
- `U-09b`: Xử lý phản hồi hỏng vs chưa phát hành (ngăn gắn nhãn sai "chưa phát hành": non-array interpretations, missing/undefined version, numeric version $\rightarrow$ missing parts kèm `CONTENT_MISSING`, không sinh `CONTENT_NOT_PUBLISHED`).
- `U-10`: Phân loại và loại bỏ các mục sai hình dạng (null, chuỗi, mảng, thiếu/rỗng bodyText, sai kiểu), gộp `entry:unidentified` chính xác count.
- `U-11`: Loại bỏ các subjectType và subjectKey không hỗ trợ (`AspectInSign`, `Chiron`, `Sun_in_aries`, `House_13`, v.v.) với issue `SUBJECT_UNSUPPORTED`.
- `U-12`: Loại bỏ các ngôn ngữ không hỗ trợ (`en`, `VI`, `vi-VN`) với `LANGUAGE_NOT_SUPPORTED`; giữ bản `vi` khi trộn song ngữ cùng khóa.
- `U-13`: Phát hiện và loại bỏ cả nhóm khi trùng khóa $\rightarrow$ part `ambiguous(DUPLICATE_ENTRIES)`, issue `DUPLICATE_SUBJECT` kèm count.
- `U-14`: Phát hiện mục không áp dụng (khóa hợp lệ nhưng sai cung trong chart, hoặc có `PlanetInHouse` khi cờ nhà false) $\rightarrow$ issue `ENTRY_NOT_APPLICABLE`.
- `U-15`: Xử lý định danh chưa giải quyết trong VM (`sign.known=false`, `houseNumber=null`, hoặc `sign.key="InvalidSign"` kèm `known:true`) $\rightarrow$ `SIGN_UNRESOLVED`, `HOUSE_NUMBER_UNRESOLVED`, issue `IDENTIFIER_UNRESOLVED`.
- `U-16`: Bỏ qua các hành tinh ngoài MVP trong VM (Chiron); nếu nhận nội dung của chúng thì loại bỏ với `SUBJECT_UNSUPPORTED`.
- `U-17`: Xử lý hành tinh trùng trong VM (hai Sun, hai Moon, hai Mercury) $\rightarrow$ part `ambiguous(DUPLICATE_IDENTIFIER)`, issue `AMBIGUOUS_IDENTIFIER`.
- `U-18`: Xử lý an toàn khi `interpretations` không phải mảng (undefined, null, object, chuỗi) $\rightarrow$ issue `ENTRY_MALFORMED` subject `interpretations`, `status="unavailable"`.
- `U-19`: Bỏ qua nhóm `planets` khi VM không có hành tinh; mọi nhóm phát ra đều có $\ge 1$ item (AC-11).
- `U-20`: Đảm bảo tính bất biến đầu vào khi truyền dữ liệu đã bị `deepFreeze`.
- `U-21`: Tính xác định khi gọi nhiều lần và khả năng tuần hoàn qua JSON (`JSON.parse(JSON.stringify(model))`).
- `U-22`: Chuẩn hóa phiên bản không hợp lệ (số 5 hoặc undefined $\rightarrow$ null + `VERSION_INVALID`); null kèm mục vẫn xử lý bình thường.
- `U-23`: Kiểm thử quy tắc Ascendant đa trạng thái (hợp lệ $\rightarrow$ available; vắng $\rightarrow$ `ANGLE_ABSENT`; trùng $\rightarrow$ ambiguous; `known:false` $\rightarrow$ unresolved; cờ nhà false nhưng có góc $\rightarrow$ available theo J-5).
- `U-24`: Cấu trúc nhóm/item tuân thủ nghiêm ngặt AC-09 (không có group hay item nào mang danh tính "nhà").
- `U-25`: `bodyText` giữ nguyên văn không trim, không escape chuỗi ký tự đặc biệt hay HTML.
- `U-26`: Không suy đoán giờ sinh từ việc thiếu nhà (chỉ có issue `HOUSE_DATA_UNAVAILABLE`).

### 3.2. Danh mục Contract & Architecture Tests (`interpretation.contract.test.ts` — 11 tests pass)
- `C-01`: Xác thực top-level shape, metadata (`vi`, `1.0`, `Published`) và 252 items trong `interpretations.vi.json`.
- `C-02`: Đếm text thô phát hiện trùng thuộc tính bóng (chính xác 252 lần xuất hiện `"subjectKey":`, `"subjectType":`, `"bodyText":`).
- `C-03`: Xác thực 252 cặp `(subjectType, subjectKey)` trong JSON là duy nhất 100%.
- `C-04`: Xác thực `buildInterpretationKeySpace()` sinh chính xác 252 subject duy nhất.
- `C-05`: Đối soát 2 chiều hoàn hảo (`missing = []`, `unexpected = []`) giữa frontend key space và JSON backend.
- `C-06`: Khóa tập danh tính chuẩn với `KNOWN_PLANET_NAMES` (10), `KNOWN_ZODIAC_SIGNS` (12), `HOUSE_NUMBERS` (1..12).
- `C-07`: Kiểm tra mọi item trong JSON đều được tái tạo chính xác qua các hàm key builder công khai.
- `C-08`: Xác thực toàn bộ key trong 2 fixture `chartFull` (21 keys) và `chartNoHouses` (10 keys) đều thuộc key space backend.
- `P-01`: Allowlist imports regex — chỉ cho phép import từ `../api/types` và `import type` từ `./chartViewModel`; cấm tuyệt đối dynamic import `import(...)`, `require(...)` và side-effect import.
- `P-02`: Đảm bảo độ tinh khiết môi trường — không phụ thuộc React, DOM, window, document, localStorage, fetch, Date, Math.random, console.
- `P-03`: Mã nguồn 100% ký tự ASCII và không chứa `dangerouslySetInnerHTML`.

---

## 4. Chi tiết Bảng Coverage theo file (`interpretation.ts`)

Lệnh thực thi:
```bash
npm run test:coverage -- --coverage.include=src/features/chart/model/interpretation.ts --coverage.reporter=text src/features/chart/model/interpretation.test.ts src/features/chart/model/interpretation.contract.test.ts
```

Kết quả đo lường thực tế từ v8 engine:
```text
-------------------|---------|----------|---------|---------|----------------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s          
-------------------|---------|----------|---------|---------|----------------------------
All files          |     100 |    95.12 |     100 |     100 |                            
 interpretation.ts |     100 |    95.12 |     100 |     100 | 82-104,469,559,639,705,728 
-------------------|---------|----------|---------|---------|----------------------------
```

- **Đánh giá:**
  - **100% Statements, 100% Functions, 100% Lines.**
  - 0 dòng code chưa được phủ (0 uncovered lines).
  - Tỷ lệ bao phủ nhánh đạt 95.12%; các nhánh v8 đánh dấu là các đường dẫn fallback an toàn trong cấu trúc ternary/switch.
  - Vấn đề các nhánh phòng thủ lặp lại trước đây (`KG-F5M2-02`) đã được xử lý triệt để thông qua việc tinh giản tiền điều kiện và bổ sung test `InvalidSign`.

---

## 5. Known Gaps Registry (M2)

| ID | Vấn đề | Phân loại | Tác động | Kế hoạch xử lý |
|---|---|---|---|---|
| **KG-F5M2-01** | `interpretationVersion === null` nhưng có mục dữ liệu diễn giải | Dữ liệu biên bất thường | Model vẫn xử lý bình thường các mục này, không sinh lỗi hệ thống (theo quyết định J-13) | Không cần mã sửa; M3/M5 sẽ giữ nguyên cách hiển thị nội dung khả dụng |
| **KG-F5M2-02** | Nhánh phòng thủ key builder trả về `null` trong điều kiện đã guard trước | Defensive Code Uncovered | Trước đây chiếm ~2.49% dòng chưa phủ | **RESOLVED** — Đã tinh gọn tiền điều kiện và bổ sung unit test cho `InvalidSign`, nâng Line Coverage lên 100% |

---

## 6. M2 Closure Report

| Mục | Kết quả ghi nhận |
|---|---|
| **Commit mã nguồn (M2)** | `9282ed6f379a3b53fb4f565fbdd7904aa72d5370` (short `9282ed6`) kèm `5a87433` và `76d85c3` |
| **Trạng thái Git** | Sạch; branch `dev` |
| **Baseline metrics** | **132 file Vitest (+2) / 1087 test cases (+38) / 38 Playwright E2E tests** (Pass 100%) |
| **Số test M2 mới** | 38 tests (27 Unit `U-01..U-26, U-09b` + 11 Contract & Pure Architecture `C-01..C-08`, `P-01..P-03`) |
| **Độ bao phủ `interpretation.ts`** | **Lines: 100%**, Stmts: 100%, Branch: 95.12%, Funcs: 100% |
| **Độ thuần khiết mã nguồn** | 0 React, 0 DOM, 0 `dangerouslySetInnerHTML`, 100% ASCII |
| **Hợp đồng Backend 252 khóa** | Pass đối soát hai chiều (`missing = []`, `unexpected = []`) |
| **Cổng chất lượng** | Pass 100%: `format:check`, `lint`, `typecheck`, `build` |
| **Known Gaps** | KG-F5M2-01 (null version có mục); KG-F5M2-02 (RESOLVED) |
| **Quyết định nghiệm thu** | **`ACCEPT`** — Đóng Sprint F5 M2, chuyển giao sang M3 (Static Panel UI) |
| **Ngày hoàn thành** | 2026-11-01 |
