# Sprint 4 M2 — Interpretation Domain Foundation

**Vị trí đề xuất:** `docs/implementation/Sprint_4_M2_Interpretation_Domain_Foundation_Plan.md`
**Phiên bản:** 1.1 — Sẵn sàng. Ba câu hỏi O-M2 đã được owner giải quyết (Mục 23).
**Dựa trên:** audit trực tiếp nhánh `dev` tại `d9ff172` (clone sạch, 2026-10-04), prompt M2, Sprint 4 Implementation Plan v1.1, Sprint 4 M1 Plan và Evidence Matrix v2, DB Design Spec §5.13/§7, Project Architecture Spec §12.
**Quy ước nguồn bằng chứng:** `[repo]` đọc từ mã nguồn; `[spec]` đọc từ tài liệu; `[M1-evidence]` log của owner/CI; `UNVERIFIED` nghĩa là chưa có bằng chứng.

---

## 1. Sprint Overview

M1 đã dựng persistence (bảng, migration, provider đọc/ghi, `Chart.snapshotInterpretationVersion`). M2 dựng **lớp domain thuần** mà các milestone sau dùng:

```
Chart (đã có)  →  deriveInterpretationSubjects()  →  danh sách subject có thứ tự (phẳng)
Content version (chuỗi) → compareContentVersion()
Engine (M4) → IInterpretationContentProvider (port, đã có từ M1) → provider Prisma (M1)
```

M2 **không** có I/O, không chạm DB, không đổi API, không đổi hành vi tính toán chart. M2 chỉ thêm code trong `backend/src/modules/chart/domain/` và test unit tương ứng.

## 2. M1 Prerequisite Verification

**Kết luận: M1 ĐÃ ĐƯỢC TRIỂN KHAI THẬT và khớp plan. Không kích hoạt `NOT READY`.**

| Hạng mục (prompt mục 2) | Kết quả kiểm tra | Nguồn |
|---|---|---|
| `Language` | Model `Language` trong `schema.prisma`; bảng `astrology.languages` trong migration `20261004120000_init_interpretation_content_bank` | [repo] |
| `InterpretationContent` | Model + bảng `astrology.interpretation_contents` (11 cột) | [repo] |
| `AngleInSign` + CHECK subject_type | CHECK có đủ 7 giá trị gồm `AngleInSign` | [repo] |
| Persistence nội dung | `PrismaInterpretationContentProvider` (`findPublishedVersions`, `findPublishedContents`, `insertMany` chỉ trên class) | [repo] |
| `Chart.snapshotInterpretationVersion` | `ChartProps` optional, getter chuẩn hoá về `null`; mapper ghi/đọc `snapshot_interpretation_version` | [repo] |
| `IInterpretationContentProvider` | **Đã tồn tại** ở `domain/ports/interpretation-content-provider.port.ts` (M1) → M2 tái sử dụng, không tạo trùng | [repo] |
| Database helper | `database.helper.ts` giữ `languages`, vẫn truncate `interpretation_contents` | [repo] |
| Test M1 | `prisma-interpretation-content.provider.test.ts` (22 case), mở rộng `prisma-chart.repository.test.ts` và `chart.entity.test.ts` | [repo] |
| Migration + seed `vi` | `INSERT ... ON CONFLICT DO NOTHING` ngay trong migration (A1) | [repo] |
| Bằng chứng chạy thật | `npm test` 95 file / 599 test pass; migration áp dụng trên DB dev và DB test; `typecheck` + `build` sạch; backend-ci run #225 Success | [M1-evidence] |

Gap M1 còn mở **không chặn M2** (M2 chỉ là domain thuần): KG-M1-01/02 (hai lỗi nhãn tài liệu, xử lý ở Mục 25), KG-M1-03 (nợ `details`/`cause` có sẵn từ Sprint 2–3, nên xử lý trước M4), KG-M1-05 (`migrate diff`, `prisma:seed` chưa có log).

## 3. Repository Audit

Mọi dòng dưới đây đã được đọc trực tiếp từ mã nguồn tại `d9ff172`.

| Chủ đề | Thực tế |
|---|---|
| Cấu trúc `chart/domain/` | `engine/` (calculators, validation, builder, `time-conversion.ts`), `entities/`, `errors/chart.errors.ts`, `ports/`, `types/`, `value-objects/`. Không có thư mục `interpretation/` |
| Từ vựng cung | `ZODIAC_SIGNS` là `as const` array (Aries → Pisces) và `type ZodiacSign` trong `types/chart.types.ts` |
| Từ vựng hành tinh | `enum PlanetName` có 14 thành viên: `Sun`…`Pluto` (10), `Chiron`, `NorthNode`, `SouthNode`, `Lilith`. Tên trong repo là `NorthNode`/`SouthNode`, **không** phải "North Node" như prompt viết |
| `Planet` | `name`, `zodiacPosition.sign`, `house: number \| null`. `Planet.create` kiểm longitude và Sun/Moon không nghịch hành, **không** kiểm `house` trong 1..12 |
| `House` | `number` (kiểm số nguyên 1..12 trong `House.create`) |
| `Angle` | `type: AngleType = 'Ascendant' \| 'Midheaven' \| 'Descendant' \| 'ImumCoeli'`, chỉ có `longitude`, **không có sign**. Sign suy ra bằng `ZodiacPosition.fromLongitude(longitude).sign` (đã dùng ở mapper) |
| `Chart` getters | `planets: readonly Planet[]`, `angles: readonly Angle[]`, `isHouseDataAvailable: boolean` |
| Invariant của `Chart.create` | INV-2: `planets.length ≥ 10` (không đòi đủ 10 hành tinh MVP, không đòi tên duy nhất). INV-4: có house data ⟺ đúng 12 houses + 4 angles; không có ⟺ 0 houses + 0 angles. INV-15: có đủ ASC/DSC/MC/IC. **Hệ quả:** Ascendant có mặt ⟺ `isHouseDataAvailable` |
| Gán nhà cho hành tinh | `ChartBuilder.assignHousesToPlanets` khởi tạo `null` và chỉ gán khi tìm được cung nhà; vì vậy `planet.house` có thể `null` ngay cả khi `isHouseDataAvailable = true` |
| Hành tinh tuỳ chọn | `EngineInput.chartOptions.includeOptionalPoints: PlanetName[]` → `chart.planets` có thể chứa Chiron/Nodes/Lilith (derive phải bỏ qua) |
| Cờ nhà | `isHouseDataAvailable = houses.length === 12` (`chart-builder.ts`). Trường hợp house system không hội tụ vẫn có 12 nhà kèm warning |
| Mẫu hàm thuần | Có cả hàm export thường (`convertLocalTimeToUtc` trong `engine/time-conversion.ts`, `shared/utils/angle-comparison.util.ts`) và class static (`AngleCalculator`). Hàm export thường là tiền lệ phù hợp |
| Lỗi domain | Tất cả kế thừa `Error`, phẳng trong `errors/chart.errors.ts` (vd `DataIntegrityError`), `this.name` được đặt thủ công |
| Quy ước file | kebab-case + hậu tố loại: `.entity`, `.vo`, `.port`, `.types`; import có đuôi `.js` |
| Công cụ | ESM (`package.json` `"type": "module"`, `tsconfig` `module/moduleResolution: NodeNext`), `strict` + `noUncheckedIndexedAccess`; ESLint `boundaries/dependencies` cấm `domain → application/infrastructure/presentation` và có `import/order` alphabetize |
| Test | `tests/unit/modules/chart/domain/{engine,entities,errors,value-objects}/…`, import tương đối, `vitest` có `globals: true`, không có `include` riêng cho test (mặc định), không có fixture dùng chung cho Chart (chart.entity.test dùng generator cục bộ). **Không tìm thấy** tiền lệ `it.each` trong `tests/unit` |
| M1 types sẵn có | `types/interpretation.types.ts`: `INTERPRETATION_SUBJECT_TYPES` (7 giá trị), `InterpretationSubjectType`, `InterpretationContentStatus`, `InterpretationTone`, `InterpretationContentSource`, `InterpretationContentRecord`, `InterpretationSubjectRef { subjectType, subjectKey }` |
| M1 port | `IInterpretationContentProvider`: `findPublishedVersions(language): Promise<string[]>`, `findPublishedContents(language, version, subjects): Promise<InterpretationContentRecord[]>` |
| Chưa tồn tại | `derive-interpretation-subjects`, key grammar, `compareContentVersion`, lỗi domain liên quan |

## 4. Source-of-Truth Hierarchy

1. Mã nguồn tại `d9ff172` (cho trạng thái hiện tại).
2. Spec đã đóng băng: DB Design Spec (§5.13, §7), Natal Chart Domain Spec, REST API Spec, Project Architecture Spec (§3.3, §12).
3. Sprint 4 Implementation Plan v1.1 (thứ tự derive, grammar version) và quyết định owner R1–R4, A–E.
4. Sprint 4 M1 Plan + Evidence Matrix v2.
5. Prompt M2 (FD1–FD12).

**Mâu thuẫn giữa prompt và repo (repo thắng, không mở lại FD):**

| Prompt nói | Repo thực tế | Xử lý |
|---|---|---|
| Stack "CommonJS" | ESM (`"type": "module"`, NodeNext, import `.js`) | Plan theo ESM, ghi vào Decision Log D-M2-09 |
| Loại trừ "North Node / South Node" | enum `NorthNode`, `SouthNode` | Dùng tên enum trong repo; không ảnh hưởng FD3 |
| Thứ tự liệt kê loại subject: PlanetInSign, PlanetInHouse, AngleInSign | M1 `INTERPRETATION_SUBJECT_TYPES`: PlanetInSign, AngleInSign, PlanetInHouse, … | Hai thứ tự chỉ là liệt kê từ vựng, không phải thứ tự derive. Giữ nguyên mảng của M1 (không churn); thứ tự derive định nghĩa riêng ở Mục 14 |
| Architecture Spec §12 gọi adapter là `HumanAuthoredContentAdapter` | M1 đã tạo `PrismaInterpretationContentProvider` | Không đổi tên (M1 đã đóng, được duyệt). Ghi KG-M2-01 (tài liệu) |

Kiểm tra FD có tự mâu thuẫn không: **không có mâu thuẫn nội bộ**, nên không FD nào bị mở lại.

## 5. Existing Architecture Baseline

- Port nằm ở `chart/domain/ports/` — đúng Architecture Spec §12 (`IInterpretationContentProvider (chart/domain/ports/)`).
- Domain chỉ được import domain và `shared`; ESLint chặn các lớp trên. File M2 mới nằm dưới `src/modules/chart/domain/**` nên tự động thuộc element `domain`.
- Use case và service (M4) nằm ở `application/`; provider Prisma ở `infrastructure/` (M1, không đổi).
- Không có module cross-boundary mới; không đụng `index.ts` của module (không có consumer ngoài).

## 6. M2 Objective

Thiết lập hợp đồng và logic domain thuần cho Interpretation Engine: (1) từ vựng subject, (2) grammar key tập trung, (3) `deriveInterpretationSubjects`, (4) `compareContentVersion`, (5) hợp đồng port đã đủ cho engine, (6) test unit cho tất cả. Kết quả phải xác định (deterministic) và không phụ thuộc Prisma, PostgreSQL, Express, HTTP, frontend, Swiss Ephemeris.

## 7. Frozen Decisions

FD1–FD12 của prompt được giữ nguyên, **không mở lại**. Bảng sau chỉ ánh xạ chúng sang vị trí thực hiện:

| FD | Thực hiện trong M2 |
|---|---|
| FD1 | Mọi file mới nằm trong module `chart`; không tạo module `interpretation` |
| FD2 | Cả 7 loại subject có trong từ vựng (đã có từ M1); logic chỉ cho 3 loại MVP |
| FD3 | Hằng `MVP_INTERPRETATION_PLANETS` = 10 hành tinh Sun…Pluto theo `PlanetName` |
| FD4 | Builder + validator tập trung ở Mục 12 |
| FD5 | `AngleInSign` tách khỏi `PlanetInSign`; Ascendant không phải hành tinh |
| FD6 | Subject là phẳng (`InterpretationSubjectRef`), không `sections[]`/`groups[]`; không thêm trường `order` |
| FD7 | `compareContentVersion` thuần (Mục 16) |
| FD8 | Port dùng lại từ M1, bổ sung hợp đồng (Mục 17) |
| FD9 | Không CMS/API quản trị |
| FD10 | `language` giữ là tham số của port; không có chọn ngôn ngữ runtime |
| FD11 | Xử lý trạng thái suy giảm ở Mục 15 |
| FD12 | KG-S4-06 chỉ ghi nhận, không có logic riêng cho Moon |

## 8. Scope

- Thêm hằng/kiểu MVP vào `types/interpretation.types.ts`.
- Module key grammar (builder + validator).
- Hàm `deriveInterpretationSubjects`.
- Hàm liệt kê đầy đủ 252 subject MVP (xem O-M2-3), đóng vai trò là "canonical subject manifest generator", hoàn toàn không chứa nội dung tiếng Việt.
- `compareContentVersion` + `isValidContentVersion`.
- Hai lỗi domain nhỏ.
- Tinh chỉnh JSDoc hợp đồng của port (không đổi chữ ký).
- Test unit cho toàn bộ logic trên.

## 9. Out of Scope

Engine orchestration/`InterpretationLookupService`, chọn "version mới nhất" (M4), API và mapping `ChartResponse`, thêm `interpretationVersion` vào response, seed hay validator nội dung 252 mục (M3), CMS/API quản trị, UI, Aspect/Pattern/summary, Chiron/Lilith/Nodes, AI, sửa Moon uncertainty, sửa engine/Swiss Ephemeris, module `interpretation` mới, wiring `composition-root.ts`, đổi schema/migration, test tích hợp DB.

## 10. Dependencies

| Hướng | Phụ thuộc |
|---|---|
| Đầu vào | M1 (types, port, provider) và Sprint 3 (entity `Chart`, `Planet`, `Angle`, `ZodiacPosition`, `ZODIAC_SIGNS`, `PlanetName`) — đã có |
| Đầu ra M3 | Validator nội dung dùng `enumerateMvpInterpretationSubjects` (đủ 252 key theo DB Spec §5.13 "Business Constraint: version mới phải đủ mọi `subject_key` đang dùng") và `isValidContentVersion` |
| Đầu ra M4 | Service dùng `deriveInterpretationSubjects`, `compareContentVersion`, `IInterpretationContentProvider` |
| Đầu ra F5 | Grammar `subjectKey` và thứ tự subject (Mục 12, 14) là contract cho frontend |

## 11. Interpretation Subject Model

**Biểu diễn (theo mẫu `ZODIAC_SIGNS` trong repo):** `as const` array + `type` suy ra. M1 đã làm đúng cách này cho 7 loại subject; M2 không đổi mảng đó. Giá trị là chuỗi, ổn định cho DB (CHECK), truy vấn, JSON API và ánh xạ frontend.

| Loại | Trạng thái Sprint 4 |
|---|---|
| `PlanetInSign` | MVP |
| `PlanetInHouse` | MVP |
| `AngleInSign` | MVP (chỉ Ascendant) |
| `Aspect`, `PatternType`, `SignSummary`, `HouseSummary` | Dành riêng (có trong từ vựng và CHECK, **không** có logic derive/grammar) |

**Đối tượng subject:** dùng lại `InterpretationSubjectRef { subjectType, subjectKey }` của M1 (Decision D-M2-02, không tạo abstraction mới). Thứ tự xuất hiện trong mảng chính là thông tin thứ tự (FD6), không thêm trường `order`.

**Hằng mới trong `types/interpretation.types.ts` (tên đề xuất, đã tránh trùng tên có sẵn):**

- `MVP_INTERPRETATION_SUBJECT_TYPES` = `['PlanetInSign', 'AngleInSign', 'PlanetInHouse']` — chính là thứ tự derive.
- `MVP_INTERPRETATION_PLANETS` = 10 thành viên `PlanetName` theo thứ tự canonical **được khai báo tường minh** (không dựa vào thứ tự khai báo của enum).
- `HOUSE_NUMBERS` = `[1..12]` và `type HouseNumber`.
- `type MvpInterpretationPlanet`, `type MvpInterpretationSubjectType`.

## 12. Subject Key Grammar

**Nguồn sự thật duy nhất:** một file `domain/interpretation/interpretation-subject-key.ts`. Không nơi nào khác được ghép chuỗi key.

| Loại | Dạng | Ví dụ |
|---|---|---|
| `PlanetInSign` | `{Planet}_in_{Sign}` | `Sun_in_Leo`, `Moon_in_Aries`, `Venus_in_Virgo` |
| `PlanetInHouse` | `{Planet}_in_House_{n}`, n ∈ 1..12, không số 0 đầu | `Sun_in_House_1`, `Venus_in_House_7`, `Saturn_in_House_10` |
| `AngleInSign` | `Ascendant_in_{Sign}` | `Ascendant_in_Leo`, `Ascendant_in_Aries` |

- `{Planet}` = 10 giá trị `PlanetName` MVP; `{Sign}` = 12 giá trị `ZODIAC_SIGNS`. Token lấy từ hằng, **không gõ tay lặp lại** (validator dựng regex từ các mảng).
- **Builder (có kiểu):** `buildPlanetInSignKey(planet, sign)`, `buildPlanetInHouseKey(planet, house)`, `buildAngleInSignKey('Ascendant', sign)` → trả `string`. Kiểu tham số làm sai đầu vào bị bắt lúc biên dịch (vd không truyền được `Chiron`).
- **Guard lúc chạy:** builder ném `InvalidInterpretationSubjectKeyError` nếu giá trị ngoài miền (hành tinh không thuộc MVP, cung ngoài `ZODIAC_SIGNS`, nhà không phải số nguyên 1..12) — phòng dữ liệu hỏng đi qua ép kiểu.
- **Validator (không ném lỗi):** `isValidInterpretationSubjectKey(subjectType, key): boolean`. Với ba loại MVP kiểm đúng grammar; với 4 loại dành riêng trả `false` vì Sprint 4 không định nghĩa grammar cho chúng (ghi rõ trong JSDoc để M3 không hiểu nhầm).
- Phân biệt loại (FD5): `Ascendant_in_Leo` **hợp lệ** với `AngleInSign` và **không hợp lệ** với `PlanetInSign`; `Sun_in_Leo` ngược lại.
- Phân biệt hoa/thường: grammar phân biệt (`Sun_in_house_7` không hợp lệ).
- Hệ quả tài liệu: DB Spec §5.13 hiện chỉ có ví dụ `Venus_in_Leo` và `Sun_Square_Moon`, chưa nêu grammar nhà/Ascendant — thêm ở Mục 25.

## 13. `deriveInterpretationSubjects`

**Vị trí:** `backend/src/modules/chart/domain/interpretation/derive-interpretation-subjects.ts` (hàm export thường, theo tiền lệ `convertLocalTimeToUtc`).

**Chữ ký đề xuất:** `deriveInterpretationSubjects(chart: Pick<Chart, 'planets' | 'angles' | 'isHouseDataAvailable'>): InterpretationSubjectRef[]`

- **Đầu vào:** chính `Chart` (một `Chart` thật gán được vào kiểu `Pick` này). Dùng `Pick` giữ test gọn: test không cần dựng một `Chart` hợp lệ đầy đủ (engineInput, metadata, aspects…). Không có abstraction mới.
- **Đầu ra:** mảng mới mỗi lần gọi; từng phần tử `Object.freeze` (theo thói quen bất biến của domain); đầu vào không bị sửa.

**Thuật toán (ba bước, theo thứ tự cố định):**

1. **PlanetInSign.** Với từng hành tinh trong `MVP_INTERPRETATION_PLANETS`, tìm trong `chart.planets` hành tinh cùng tên (lần xuất hiện đầu tiên). Nếu có → subject với key từ `planet.zodiacPosition.sign`. Nếu không có → bỏ qua, không ném lỗi. Hành tinh ngoài MVP bị bỏ qua.
2. **AngleInSign.** Nếu `chart.angles` chứa angle `Ascendant` → sign = `ZodiacPosition.fromLongitude(angle.longitude).sign` → subject `AngleInSign`. Dựa vào **dữ liệu angle thực tế**, không dựa vào `isBirthTimeKnown`.
3. **PlanetInHouse.** Chỉ khi `chart.isHouseDataAvailable === true`. Với từng hành tinh MVP (cùng thứ tự canonical): nếu `planet.house` là `null` → bỏ qua hành tinh đó (xem O-M2-2); nếu là số nguyên 1..12 → subject; nếu là giá trị khác → builder ném `InvalidInterpretationSubjectKeyError` (dữ liệu hỏng, không im lặng).

Chart đầy đủ → tối đa 10 + 1 + 10 = **21** subject (khớp prompt mục 9).

## 14. Deterministic Ordering

Thứ tự cố định, mã hoá tập trung bằng hai hằng ở Mục 11, không dựa vào thứ tự mảng đầu vào, thứ tự khai báo enum, thứ tự trả về của DB/Prisma, locale hay thứ tự khoá của object:

1. Tất cả `PlanetInSign`, hành tinh theo `MVP_INTERPRETATION_PLANETS` (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto).
2. `AngleInSign` (Ascendant).
3. Tất cả `PlanetInHouse`, cùng thứ tự hành tinh.

Nguồn: Sprint 4 Plan v1.1 §9.1 và bàn giao F5 (§34); DB/REST/Domain Spec **không** quy định thứ tự này (đã grep), nên không có xung đột. Đảm bảo bằng test: đầu vào xáo trộn → cùng đầu ra; hai lần gọi → bằng nhau.

Hàm liệt kê `enumerateMvpInterpretationSubjects()` dùng cùng thứ tự loại; trong mỗi loại: hành tinh canonical × cung Aries→Pisces (hoặc nhà 1→12). Tổng 120 + 12 + 120 = **252**.

## 15. Unknown Birth Time / No House Data

Theo invariant INV-4 và INV-15 (đã đọc trong `chart.entity.ts`), `isHouseDataAvailable = false` ⟺ 0 houses và 0 angles.

| Trạng thái chart | PlanetInSign | AngleInSign | PlanetInHouse | Lỗi |
|---|---|---|---|---|
| Có house data | 10 | 1 | tới 10 | không |
| `isHouseDataAvailable = false` | 10 | 0 (không có angle) | 0 | **không ném, không trả lỗi** |
| Có house data nhưng 1 hành tinh có `house = null` | 10 | 1 | thiếu hành tinh đó | không |

- Đây là trạng thái suy giảm bình thường; hàm không sửa `Chart` và không biết gì về Swiss Ephemeris.
- Điều kiện ba bước dựa trên cờ và dữ liệu angle, không phải `isBirthTimeKnown`; vì vậy tự phủ cả trường hợp house system không hội tụ (vẫn 12 nhà, có warning ở engine).
- **KG-S4-06 (chỉ ghi nhận):** khi không rõ giờ sinh, engine tính tại 12:00 giờ địa phương (`time-conversion.ts`) và không phát warning; Moon có thể rơi sai cung gần ranh giới và `Moon_in_{Sign}` vẫn được derive. M2 không thêm logic riêng cho Moon; F5 xử lý cảnh báo hiển thị.

## 16. `compareContentVersion`

**Bằng chứng về biểu diễn version:** `interpretation_contents.version` là TEXT, default `'1.0'`; `charts.snapshot_interpretation_version` là TEXT; ví dụ trong test M1 là `'1.0'`/`'2.0'`. Không phải số nguyên → so sánh phải theo **dạng số chấm** (không so chuỗi: `'1.10' < '1.9'` theo từ điển là sai).

**Vị trí:** `backend/src/modules/chart/domain/interpretation/content-version.ts`.

- `isValidContentVersion(value: string): boolean` — khớp `^(0|[1-9]\d*)(\.(0|[1-9]\d*))*$` (một hoặc nhiều đoạn số, không số 0 đầu, không khoảng trắng).
- `compareContentVersion(a: string, b: string): -1 | 0 | 1` — dùng được làm comparator của `Array.prototype.sort`.
- **Cách so:** theo từng đoạn từ trái; mỗi đoạn là số nguyên không âm, so bằng độ dài chuỗi rồi so từ điển (không dùng `Number`, nên không mất độ chính xác với đoạn rất dài); thiếu đoạn cuối được coi là `0` (xem O-M2-1).
- **Đầu vào không hợp lệ:** ném `InvalidContentVersionError` (nêu giá trị sai). Không trả `0` hay "đoán". Việc bỏ qua hay báo lỗi một version sai trong DB là quyết định của M4/M3, không phải của hàm này.
- **Thuần:** không I/O, không Prisma, không đọc `status`.

| Ví dụ | Kết quả |
|---|---|
| `('1.0','2.0')` | `-1` |
| `('1.9','1.10')` | `-1` |
| `('2.0','1.10')` | `1` |
| `('1.0','1.0')` | `0` |
| `('1','1.0')`, `('1.0.0','1.0')` | `0` (theo O-M2-1) |
| `('1.0.1','1.0')` | `1` |

**Tách trách nhiệm (prompt mục 13):** hàm không chọn "mới nhất" và không lọc `Published`. Việc chọn version mới nhất (sắp xếp bằng `compareContentVersion`) và lọc trạng thái thuộc application/provider (M4/M1).

## 17. `IInterpretationContentProvider`

**Hiện trạng:** port đã có từ M1 với hai phương thức; provider Prisma `implements` nó (typecheck bắt sai lệch).

| Nhu cầu của engine (M4) | Phương thức đã có | Đủ chưa |
|---|---|---|
| Biết các version Published của một ngôn ngữ để chọn bản mới nhất | `findPublishedVersions(language)` | Đủ |
| Lấy nội dung cho danh sách subject ở một version cụ thể | `findPublishedContents(language, version, subjects)` | Đủ |

**Quyết định D-M2-05: giữ nguyên chữ ký, không đổi tên, không tách; chỉ bổ sung hợp đồng bằng JSDoc.** Lý do: đủ cho luồng engine ở v1.1 §9.2–9.3; đổi chữ ký sẽ phá M1 đã đóng mà không có bằng chứng cần thiết.

**Hợp đồng được ghi vào JSDoc của port:**

- Lọc `status = 'Published'` và `tone IS NULL` là trách nhiệm của implementation (đã đúng ở provider M1).
- `language` luôn tường minh (MVP: `vi`, FD10); `version` luôn tường minh — chính sách chọn version nằm ngoài port.
- **Không đảm bảo thứ tự trả về**; caller phải sắp xếp lại theo thứ tự derive.
- Không có dòng nào → `[]` (hợp lệ, không phải lỗi). Lỗi hạ tầng → **ném `InfrastructureError`, tuyệt đối không biến thành `[]`** (R3).
- `subjects` rỗng → `[]` không truy vấn.
- `findPublishedVersions` trả chuỗi thô; caller kiểm bằng `isValidContentVersion` trước khi so sánh.
- Port không có phương thức ghi (giữ như M1).

Không thêm test tích hợp cho port ở M2 (thuộc M1/M3); phần "empty vs lỗi" đã được kiểm ở M1. Test hợp đồng bằng fake in-memory để M4.

## 18. Domain / Infrastructure Boundary

- File mới chỉ import từ: `../types/*`, `../entities/*` (chỉ kiểu), `../value-objects/zodiac-position.vo.js`, `../errors/chart.errors.js`, và các file M2 cùng thư mục.
- Cấm: `@prisma/client`, `express`, mã trạng thái HTTP, đường dẫn file nội dung, `application/`, `infrastructure/`, `presentation/`.
- Kiểm chứng: `npm run lint` (ESLint `boundaries/dependencies`) và một lệnh `grep` trên `chart/domain/**` cho `@prisma|express|infrastructure|application`.
- Provider Prisma của M1 giữ nguyên ở `infrastructure/`; M2 không sửa nó.

## 19. Unit Test Strategy

Chỉ unit test, chạy bằng `vitest`, **không** cần PostgreSQL/Docker/Prisma/mạng/Express/nội dung thật. Test đặt tại `backend/tests/unit/modules/chart/domain/interpretation/` (phản chiếu cấu trúc `src`), import tương đối có đuôi `.js` như file hiện có. Dùng `it.each` cho các bảng ca (chưa có tiền lệ trong repo, rủi ro thấp — ghi nhận ở D-M2-08); fixture Chart dựng cục bộ trong file test như `chart.entity.test.ts` đang làm, không tạo helper dùng chung.

**`interpretation-subject-key.test.ts`**

- Hợp lệ: `Sun_in_Leo`, `Moon_in_Aries`, `Venus_in_Virgo`, `Sun_in_House_1`, `Venus_in_House_7`, `Saturn_in_House_10`, `Ascendant_in_Leo`, `Ascendant_in_Aries`.
- Biên: nhà 1 và 12; cung đầu (Aries) và cuối (Pisces); đủ 10 hành tinh × 12 cung.
- Không hợp lệ (đúng các ca prompt nêu, chỉ giữ ca contract thật sự từ chối): `Sun_in_house_7`, `Sun_House_7`, `Ascendant_in_House_1`, `UnknownPlanet_in_Leo`, `Sun_in_UnknownSign`, `Sun_in_House_0`, `Sun_in_House_13`; thêm `Sun_in_House_07`, `Chiron_in_Leo`, `NorthNode_in_Leo`, chuỗi rỗng, khoảng trắng thừa.
- FD5: `Ascendant_in_Leo` không hợp lệ với `PlanetInSign`; `Sun_in_Leo` không hợp lệ với `AngleInSign`.
- Loại dành riêng (`Aspect`, …) → validator trả `false`.
- Builder: đúng key cho đầu vào hợp lệ; ném `InvalidInterpretationSubjectKeyError` khi ép kiểu đưa vào nhà `0`, `13`, `1.5`, hành tinh ngoài MVP, cung lạ.

**`derive-interpretation-subjects.test.ts`**

- Chart đầy đủ: đúng 21 subject và **đúng dãy key** theo thứ tự canonical (so sánh toàn bộ mảng).
- `isHouseDataAvailable = false`, `angles = []`: đúng 10 `PlanetInSign`, không `PlanetInHouse`, không `AngleInSign`; **không ném lỗi**.
- Có cờ nhà nhưng một hành tinh `house = null`: bỏ riêng subject nhà của hành tinh đó, các subject khác đủ.
- Hành tinh tuỳ chọn trong `chart.planets` (Chiron, NorthNode): bị bỏ qua.
- Thiếu một hành tinh MVP: bỏ qua, không ném lỗi.
- Tính xác định: đầu vào xáo trộn thứ tự hành tinh → cùng đầu ra; hai lần gọi → `toEqual`, hai mảng khác tham chiếu; đầu vào không bị sửa.
- Biên Ascendant theo longitude: `0` → Aries; `119.999` → Gemini… (kiểm vài mốc: `120` → Leo, `149.999` → Leo, `150` → Virgo, `359.999` → Pisces).
- Biên nhà: hành tinh ở nhà 1 và nhà 12.
- Một ca dùng `Chart.create` thật để chứng minh `Chart` gán được vào tham số `Pick`.

**`enumerate-mvp-subjects.test.ts`** (canonical subject manifest generator): tổng 252 (10 PlanetInSign × 12 signs + 12 AngleInSign + 10 PlanetInHouse × 12 houses); key duy nhất; mọi key qua validator; phần tử đầu và cuối đúng; thứ tự khớp Mục 14. Hoàn toàn không chứa nội dung tiếng Việt.

**`content-version.test.ts`**

- Bảng so sánh: nhỏ hơn / lớn hơn / bằng (`1.0` vs `2.0`; `1.9` vs `1.10`; `10.0` vs `9.99`; `1.0` vs `1.0.1`; `1` vs `1.0`).
- Đoạn rất dài (`1.9007199254740993` vs `1.9007199254740992`) chứng minh không dùng `Number`.
- Tính phản đối xứng; sắp xếp một danh sách trộn bằng comparator ra thứ tự mong đợi.
- Không hợp lệ (cả hai vị trí): `''`, `' '`, `'v1.0'`, `'1.'`, `'.1'`, `'1..0'`, `'1.0-beta'`, `'01.0'`, `'-1.0'`, `'1.a'`, và `null`/`undefined`/số khi ép kiểu → ném `InvalidContentVersionError`; `isValidContentVersion` trả `false` và không ném.

**Mở rộng test lỗi:** `tests/unit/modules/chart/domain/errors/chart.errors.test.ts` thêm hai lớp lỗi mới (kiểm `name`, kế thừa `Error`).

## 20. File Change Map

**Tạo mới** (đường dẫn dựa trên cấu trúc thật; thư mục `interpretation/` là mới — xem D-M2-01)

- `backend/src/modules/chart/domain/interpretation/interpretation-subject-key.ts`
- `backend/src/modules/chart/domain/interpretation/derive-interpretation-subjects.ts`
- `backend/src/modules/chart/domain/interpretation/enumerate-mvp-subjects.ts` (theo O-M2-3)
- `backend/src/modules/chart/domain/interpretation/content-version.ts`
- `backend/tests/unit/modules/chart/domain/interpretation/interpretation-subject-key.test.ts`
- `backend/tests/unit/modules/chart/domain/interpretation/derive-interpretation-subjects.test.ts`
- `backend/tests/unit/modules/chart/domain/interpretation/enumerate-mvp-subjects.test.ts` (theo O-M2-3)
- `backend/tests/unit/modules/chart/domain/interpretation/content-version.test.ts`

**Sửa**

- `backend/src/modules/chart/domain/types/interpretation.types.ts` — thêm hằng/kiểu MVP (Mục 11); không đổi thành phần M1.
- `backend/src/modules/chart/domain/errors/chart.errors.ts` — thêm `InvalidInterpretationSubjectKeyError`, `InvalidContentVersionError` (cùng kiểu: kế thừa `Error`, đặt `name`).
- `backend/src/modules/chart/domain/ports/interpretation-content-provider.port.ts` — chỉ JSDoc hợp đồng, **không** đổi chữ ký.
- `backend/tests/unit/modules/chart/domain/errors/chart.errors.test.ts` — thêm ca cho hai lỗi mới.
- Tài liệu: xem Mục 25.

**Chỉ đọc (không sửa)**

`domain/entities/{chart,planet,angle,house}.entity.ts`, `domain/types/chart.types.ts`, `domain/value-objects/zodiac-position.vo.ts`, `domain/engine/chart-builder.ts`, `infrastructure/repositories/prisma-interpretation-content.provider.ts`, `backend/.eslintrc.cjs`, `backend/vitest.config.ts`.

**Không được chạm:** `composition-root.ts`, `prisma/**`, `domain/engine/**`, `presentation/**`, mọi use case và response mapper.

## 21. Task Breakdown

**Task 1 — Types, key grammar, subject derivation (kèm test của chúng).**
Thêm hằng/kiểu MVP; `interpretation-subject-key.ts`; `derive-interpretation-subjects.ts`; `enumerate-mvp-subjects.ts`; lỗi `InvalidInterpretationSubjectKeyError`; test ở Mục 19 cho ba file.

**Task 2 — Content version và hợp đồng port (kèm test).**
`content-version.ts`; lỗi `InvalidContentVersionError`; JSDoc hợp đồng port; `content-version.test.ts`; mở rộng `chart.errors.test.ts`.

**Task 3 — Xác minh và tài liệu.**
Chạy toàn bộ Exit Criteria (Mục 27); `grep` ranh giới và TODO/FIXME; hồi quy toàn bộ test; cập nhật tài liệu Mục 25; điền Evidence Matrix.

## 22. Decision Log

Chỉ ghi quyết định **mới** của M2 (FD1–FD12 và R1–R4/A–E không được mở lại).

| ID | Quyết định | Lý do / nguồn |
|---|---|---|
| D-M2-01 | Đặt logic thuần mới trong thư mục mới `chart/domain/interpretation/`; kiểu/hằng vẫn ở `types/` | Không thư mục hiện có phù hợp: `entities/` và `value-objects/` chứa trạng thái, `engine/` chứa pipeline tính toán. Khớp danh sách file đã được duyệt ở Sprint 4 Plan v1.1 §20. Thay thế phẳng (đặt rời trong `types/`) bị loại vì lẫn hàm với kiểu |
| D-M2-02 | Dùng lại `InterpretationSubjectRef` (M1) làm đối tượng subject | Không tạo abstraction thừa; thứ tự mảng là thông tin thứ tự (FD6) |
| D-M2-03 | `deriveInterpretationSubjects` nhận `Pick<Chart,'planets'\|'angles'\|'isHouseDataAvailable'>` | Dùng chính `Chart`, test không phải dựng Chart đầy đủ |
| D-M2-04 | Thứ tự derive: PlanetInSign → AngleInSign → PlanetInHouse; hành tinh Sun…Pluto khai báo tường minh | Sprint 4 Plan v1.1 §9.1/§34; không dựa vào thứ tự enum |
| D-M2-05 | Giữ nguyên chữ ký port của M1, chỉ bổ sung JSDoc hợp đồng | Đủ cho engine; tránh phá M1 đã đóng |
| D-M2-06 | Version là chuỗi số chấm, không số 0 đầu; so từng đoạn không dùng `Number`; version sai → ném lỗi | DB lưu TEXT default `'1.0'`; tránh mất độ chính xác và nhập nhằng `1.01` vs `1.1` |
| D-M2-07 | Hai lỗi domain mới, kế thừa `Error`, đặt trong `chart.errors.ts` | Khớp quy ước hiện có; không dùng `AppError` (lớp hạ tầng/HTTP) trong domain |
| D-M2-08 | Dùng `it.each` cho bảng ca | Chưa có tiền lệ trong `tests/unit`, nhưng là cách diễn đạt gọn nhất theo prompt mục 19 |
| D-M2-09 | Theo ESM của repo thay cho "CommonJS" trong prompt | `"type": "module"`, NodeNext, import `.js` |
| D-M2-10 | Không sửa `Chart`/engine để đảm bảo `planet.house` luôn khác `null` khi có nhà; derive tự bỏ qua `null` | Ngoài phạm vi (không đổi Sprint 3); `assignHousesToPlanets` có thể để `null` |

## 23. Open Questions

Không có câu hỏi nào **chặn** M2. Ba điểm sau quy tắc spec còn im lặng; mỗi điểm có đề xuất để owner xác nhận trước khi viết code.

| ID | Câu hỏi | Vì sao quan trọng | Đề xuất | Chặn M2? |
|---|---|---|---|---|
| O-M2-1 | `compareContentVersion('1','1.0')` có bằng nhau (`0`) không? | Hai version khác chuỗi nhưng so sánh bằng nhau thì "mới nhất" bất định; DB unique index coi `'1'` và `'1.0'` là khác nhau | **RESOLVED**: Chấp nhận '1' và '1.0' là bằng nhau trong bộ so sánh version. | Không |
| O-M2-2 | Hành tinh có `house = null` khi `isHouseDataAvailable = true` → bỏ qua im lặng hay ném lỗi? Và `house` ngoài 1..12 thì sao? | `Planet.create` không kiểm `house`; builder để `null` khi không khớp cung nhà. Ném lỗi sẽ biến trường hợp hiếm thành 500 | **RESOLVED**: `house = null` → Skip PlanetInHouse subject silently (trạng thái suy giảm, không fail cả chart). Số ngoài 1..12 → ném `InvalidInterpretationSubjectKeyError`. | Không |
| O-M2-3 | Có đưa `enumerateMvpInterpretationSubjects` (252 subject) vào M2 không? | Prompt M2 không liệt kê nó, nhưng Sprint 4 Plan v1.1 §19 xếp vào M2 và validator M3 phụ thuộc vào đó | **RESOLVED**: Đưa vào M2 nhưng dưới tư cách "canonical subject manifest generator", chỉ tạo mảng 252 subject (PlanetInSign, PlanetInHouse, AscendantInSign), hoàn toàn không có nội dung tiếng Việt. | Không |

## 24. Risks

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Grammar bị gõ tay ở nơi khác (M3/M4) làm lệch key | Trung bình | Một file duy nhất, validator dựng từ hằng; test grammar; review khi M3/M4 |
| `Chart` có tên hành tinh trùng hoặc thiếu hành tinh MVP (Chart không enforce) | Thấp | Derive dùng lần xuất hiện đầu và bỏ qua thiếu; có test |
| `planet.house = null` khi có nhà | Thấp | O-M2-2; có test |
| Version DB sai định dạng làm M4 ném lỗi | Thấp | `isValidContentVersion` để M4 chọn bỏ qua hoặc báo; M3 validator chặn từ nguồn |
| Thư mục `interpretation/` mới trong domain bị coi là module mới | Thấp | D-M2-01 giải thích; FD1 không bị vi phạm (vẫn trong module `chart`) |
| `it.each` chưa có tiền lệ | Rất thấp | D-M2-08; vitest hỗ trợ sẵn |
| Moon sai cung khi thiếu giờ sinh | Đã biết | KG-S4-06; không xử lý ở M2 |
| Lỗi `details`/`cause` (KG-M1-03) ảnh hưởng M4 khi lỗi lookup thành 500 | Trung bình, ngoài M2 | Xử lý bằng chore trước M4 |

## 25. Documentation Changes

- `docs/database/Database_Design_Specification.md` §5.13: bổ sung ghi chú grammar `subject_key` cho 3 loại MVP (ví dụ nhà, Ascendant) và nêu grammar được định nghĩa ở domain code. **Đồng thời** sửa KG-M1-01 (nhãn "A4" sai thành A1/FD7 ở ghi chú `en`) và KG-M1-02 (dòng Seed Data nói `house_systems` cần seed script, trong khi bảng này được `INSERT` trong migration).
- Project Architecture Spec §12 (dòng bảng Provider): ghi chú adapter hiện tại là `PrismaInterpretationContentProvider` (KG-M2-01, tài liệu, mức thấp).
- Sprint 4 Plan v1.1: không sửa nội dung; các quyết định M2 nằm ở Mục 22 này.
- `CHANGELOG.md`/version: không đổi ở M2 (bump `0.4.0` khi đóng Sprint 4, R4).
- KG-S4-06 giữ trong Known Gaps Registry của Sprint 4 (chưa tạo); M2 chỉ ghi chú ở Mục 15.

## 26. Acceptance Criteria

1. Từ vựng gồm đủ 7 loại subject; logic chỉ có cho 3 loại MVP.
2. Grammar key tập trung ở một file; ví dụ `Sun_in_Leo`, `Sun_in_House_7`, `Ascendant_in_Leo` đúng.
3. `deriveInterpretationSubjects` trả đúng 21 subject cho chart đầy đủ, đúng thứ tự Mục 14.
4. Có house data → `PlanetInHouse` được derive; hành tinh `house = null` bị bỏ qua riêng.
5. Ascendant dựa trên dữ liệu angle thực tế; `isHouseDataAvailable = false` → chỉ 10 `PlanetInSign`, không ném lỗi.
6. Cùng đầu vào (kể cả xáo trộn) → cùng dãy subject.
7. `compareContentVersion` thuần, đúng theo bảng ví dụ, ném `InvalidContentVersionError` cho version sai.
8. `IInterpretationContentProvider` nằm ở `chart/domain/ports/`, không phụ thuộc Prisma, hợp đồng "rỗng vs lỗi" được ghi rõ; chữ ký không đổi.
9. Test unit của M2 pass; `lint`, `typecheck`, `format:check`, `build` pass.
10. Không vi phạm ranh giới kiến trúc; không có module `interpretation` cấp cao; không sửa Prisma/engine/presentation.
11. Toàn bộ test hiện có (kể cả M1 và Sprint 3) vẫn pass, không sửa kỳ vọng cũ.

## 27. Exit Criteria

Chạy trong `backend/` (script đã xác nhận trong `package.json`):

| Tiêu chí | Lệnh |
|---|---|
| Test M2 | `npx vitest run tests/unit/modules/chart/domain/interpretation` (thiết lập `NODE_ENV=test` như script `test`) |
| Test toàn bộ (hồi quy, cần Postgres cho phần tích hợp) | `npm test` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Format | `npm run format:check` |
| Build | `npm run build` |
| Ranh giới | `grep` các chuỗi `@prisma`, `express`, `infrastructure`, `application` trong `src/modules/chart/domain/interpretation/` |
| TODO/FIXME | `grep` trong các file M2 |
| Coverage (chẩn đoán, không ngưỡng %) | `npm run test:coverage` |

Lưu ý môi trường: sandbox của Claude không tải được Prisma engine (đã gặp ở M1), nên `typecheck`/`build` toàn dự án và test tích hợp phải do owner chạy; Evidence Matrix ghi tách "Claude chạy" và "Owner chạy". Test M2 là unit thuần nhưng `chart.entity` import kiểu từ Prisma-free domain, nên dự kiến chạy được trong sandbox — **UNVERIFIED** cho tới khi chạy.

## 28. Definition of Done

1. M1 vẫn an toàn hồi quy (test M1 và Sprint 3 pass).
2. Từ vựng subject và hằng MVP đã có.
3. Grammar key nằm ở một nơi duy nhất.
4. `deriveInterpretationSubjects` xác định, có test.
5. Hành vi không có house data có test.
6. `compareContentVersion` + `isValidContentVersion` có test.
7. Hợp đồng port đã được ghi, chữ ký không đổi.
8. Domain không có phụ thuộc hạ tầng (lint + grep).
9. Test unit pass; lint/typecheck/format/build pass.
10. Không TODO/FIXME chưa phân loại trong phạm vi M2.
11. Tài liệu Mục 25 đã cập nhật.
12. Exit Criteria có bằng chứng thật, ghi rõ nguồn.

## 29. Evidence Matrix

Trạng thái lúc lập plan. Chưa chạy lệnh nào cho M2; không điền số test hay log.

| ID | Tiêu chí | Trạng thái | Bằng chứng cần |
|---|---|---|---|
| EV-M2-00 | M1 tiền đề (đã triển khai, test và CI) | **PASS** | Evidence Matrix M1 v2; kiểm tra file ở Mục 2 |
| EV-M2-01 | Test unit M2 | UNVERIFIED | log `vitest` |
| EV-M2-02 | Hồi quy `npm test` | UNVERIFIED | log owner/CI |
| EV-M2-03 | `lint` | UNVERIFIED | log |
| EV-M2-04 | `typecheck` | UNVERIFIED | log |
| EV-M2-05 | `format:check` | UNVERIFIED | log |
| EV-M2-06 | `build` | UNVERIFIED | log |
| EV-M2-07 | Ranh giới kiến trúc | UNVERIFIED | kết quả lint + grep |
| EV-M2-08 | TODO/FIXME | UNVERIFIED | kết quả grep |
| EV-M2-09 | Tài liệu Mục 25 | UNVERIFIED | diff |
| EV-M2-10 | Không đổi `prisma/**`, engine, presentation | UNVERIFIED | `git diff --stat` |

Trạng thái cho phép: `PASS`, `FAIL`, `PARTIAL`, `UNVERIFIED`, `NOT APPLICABLE`, `DEFERRED`.

## 30. Implementation Sequence

1. Owner xác nhận O-M2-1..3 (Đã hoàn thành).
2. Task 1: hằng/kiểu → key grammar + test → derive + test → enumerate + test.
3. Task 2: lỗi domain → `content-version` + test → JSDoc port → mở rộng test lỗi.
4. Task 3: chạy Exit Criteria → hồi quy → tài liệu → Evidence Matrix.
5. Quyết định đóng M2 chỉ khi có log thật.

## 31. Final Architect Review

- M2 chỉ thêm code thuần trong `chart/domain/` và không chạm hành vi hiện có, nên rủi ro hồi quy rất thấp.
- Điều đáng chú ý nhất phát hiện khi audit là `Chart` **không** đảm bảo 10 hành tinh MVP đều có mặt, tên duy nhất, hay `planet.house` khác `null` khi có nhà; derive được thiết kế để chịu được các trường hợp này mà không ném lỗi, trừ khi dữ liệu thật sự hỏng.
- Ba điểm cần xác nhận đều là lựa chọn thiết kế nhỏ nơi spec im lặng; chúng không đổi phạm vi và dễ đảo ngược.
- Không FD nào bị mở lại; bốn điểm lệch giữa prompt/spec và repo đã được ghi rõ ở Mục 4.

## 32. Final Recommendation

`READY`

**Điều kiện:** Tất cả Open Questions (O-M2-1..3) đã được project owner xác nhận. Sẵn sàng khởi chạy Task 1.
