# Sprint 3 Backend — M3 Implementation Plan

## 1. Milestone Overview

**Milestone:** Sprint 3 Backend — Milestone 3: Astrology Calculation Engine.

**Vị trí trong Sprint 3:** M1 (Domain Foundation) và M2 (Swiss Ephemeris Dependency & Adapter Foundation) đã merge và review clean trên `dev` (`dcbac7a` → `f4400a8`, xác nhận qua clone thật + test thật, không chỉ đọc tài liệu). M3 dựng phần "bộ não tính toán" — 5 Calculator + Chart Builder — tiêu thụ `IEphemerisProvider` (M2) và các Entity/VO/Port (M1) đã có sẵn, sản xuất ra `Chart` hoàn chỉnh thuần trong Domain layer, chưa chạm Persistence/Application/API (M4–M7).

**Nguồn xác nhận chính thức cho scope M3** (không suy diễn): *Sprint 3 Backend Implementation Plan* (`docs/implementation/Sprint_3_Natal_Chart_Module_Implementation_Plan.md`) §14, Milestone 3:

> "Objective: Dựng đầy đủ Calculator + Chart Builder — pipeline tính toán hoàn chỉnh (trừ Pattern thuật toán, D-14 Deferred). Scope: `chart/domain/engine/validation/`, `calculators/{planet,house,angle,aspect,pattern}.calculator.ts`, `chart-builder.ts`."

Plan này **triển khai chi tiết** đúng phạm vi đã đóng băng ở trên — không mở rộng, không thu hẹp — và làm rõ tường minh các điểm mà tài liệu cấp Sprint chưa xuống đến mức chi tiết implementation.

**Cập nhật (Confirmation.md):** Toàn bộ 7 Open Question nêu ở bản nháp đầu tiên (OQ-M3-1 đến OQ-M3-7) đã được xác nhận quyết định. Mục 20 dưới đây đã cập nhật thành **Decision Log** (theo đúng convention Decision Log D-1→D-14 đã dùng ở Natal Chart Domain Spec §35) thay vì "Open Question" — không còn mục nào ở trạng thái chờ quyết định trước khi code T3.0.

---

## 2. Objectives

Trích trực tiếp Astrology Engine Specification §1.1 và Prompt Mục 4 (khớp nhau, không mâu thuẫn):

- Chuyển `EngineInput` (đã normalize, local time) thành kết quả tính toán chiêm tinh **deterministic, testable**.
- Engine độc lập với Express/Prisma/HTTP/Auth/Presentation DTO/Frontend.
- Chỉ phụ thuộc `IEphemerisProvider` (M2) làm abstraction duy nhất ra bên ngoài Domain.
- Không đóng cứng vào Natal Chart — giữ nguyên các Extension Point đã thiết kế sẵn ở Engine Spec §9 (không tạo mới, không xóa).

---

## 3. Scope

### 3.1 In Scope

| Hạng mục | Ghi chú |
|---|---|
| `chart/domain/engine/validation/chart-input.validator.ts` | Validation Module (Engine Spec §6.1) — Defense-in-Depth, tái xác nhận rule đã validate ở tầng khác |
| `chart/domain/engine/calculators/planet.calculator.ts` | Planet Calculator (Engine Spec §6.3) |
| `chart/domain/engine/calculators/house.calculator.ts` | House Calculator (Engine Spec §6.4) |
| `chart/domain/engine/calculators/angle.calculator.ts` | Angle Calculator (Engine Spec §6.5) |
| `chart/domain/engine/calculators/aspect.calculator.ts` | Aspect Calculator (Engine Spec §6.6) |
| `chart/domain/engine/calculators/pattern.calculator.ts` | Luôn trả `[]` — **thuật toán KHÔNG implement** (D-14 DEFERRED, chính thức) |
| `chart/domain/engine/chart-builder.ts` | Orchestrator + Aggregate assembler (Engine Spec §6.10) |
| `UnknownBirthTimePolicy`, `OrbPolicy` | Pure function/constant module trong `chart/domain/engine/` (Sprint 3 Plan §7.4) — không phải class có state |
| `chart/domain/engine/time-conversion.ts` | **CONFIRMED (Decision M3-1)** — module mới, local date+time+timezoneId → UTC `Date`; `ChartBuilder` chỉ gọi, không tự implement logic quy đổi |
| `chart/domain/engine/engine-version.constant.ts` (điều kiện — xem Decision M3-6) | Corrective task nếu M2 chưa định nghĩa hằng số `engineVersion` (đã xác nhận: **chưa có**, xem Mục 20 Decision M3-6) |
| Unit test cho toàn bộ trên, dùng fixture giả lập (không cần WASM thật) | Sprint 3 Plan §12.1 |

### 3.2 Out of Scope (trích nguyên văn Prompt Mục 3 + xác nhận chéo với Sprint 3 Plan)

- Chart Persistence, Prisma Repository, Migration → **M5**.
- REST Controller/Route/Schema/OpenAPI → **M7**.
- Authentication/Authorization → không thuộc Chart module tính toán; ownership check → **M6**.
- BirthProfile integration orchestration (`GetBirthProfileSnapshotUseCase`, module-root barrel) → **M4**.
- Frontend.
- Trùng lặp logic `SwissEphemerisAdapter`/mapping đã có ở M2 — M3 chỉ **tiêu thụ** `IEphemerisProvider`, không import `swisseph-wasm`.
- API endpoint.
- Di chuyển persistence concern vào Domain.
- Sinh nội dung diễn giải (Interpretation Engine — Engine Spec §6.11, module riêng ngoài Core Pipeline, không thuộc Sprint 3).
- **Thuật toán Pattern Detection thật** (Grand Trine/T-Square/Grand Cross/Yod) — D-14 DEFERRED chính thức, không phải "chưa kịp làm".
- Golden Reference Test với dữ liệu Astro.com thật → **M8** (Sprint 3 Plan §12.5, Domain Spec §32). M3 chỉ dùng fixture tự tạo, xem Mục 16.

---

## 4. Source-of-Truth Documents

Đã đọc trực tiếp từ `dev` branch (không suy đoán nội dung), trích dẫn theo mục cụ thể xuyên suốt plan này:

1. `docs/architecture/Astrology_Engine_Specification.md` v1.0 — **authoritative cho calculation responsibility & pipeline**.
2. `docs/architecture/Natal_Chart_Domain_Specification.md` v1.1 — **authoritative cho domain concept & calculation contract**, 38 mục, Decision Log (14 D), 21 Testable Rules.
3. `docs/architecture/Swiss_Ephemeris_Integration_Specification.md` v1.1 — ranh giới Adapter/Engine.
4. `docs/architecture/Project_Architecture_Specification.md` — layer/module boundary tổng quát.
5. `docs/development/Coding_Standards_And_Conventions.md` — naming, testing, TS rules.
6. `docs/architecture/Astrology_Domain_Specification.md` v1.0 — domain gốc (Appendix 9.1–9.4: zodiac, house, planet category, orb).
7. `docs/database/Database_Design_Specification.md` — đối chiếu snapshot/precision (đã tổng hợp lại ở Domain Spec §20, §28).
8. `docs/api/REST_API_Specification.md` — đối chiếu ChartResponse shape (đã tổng hợp ở Domain Spec §29).
9. `docs/development/Backend_Implementation_Guide.md`.
10. `docs/implementation/Sprint_3_Natal_Chart_Module_Implementation_Plan.md` — **authoritative cho vị trí M3 trong trình tự Sprint 3, file structure §7.1, AC §14**.
11. Code thật đã merge: `chart/domain/{entities,value-objects,ports,errors}/*.ts` (M1, `dcbac7a`), `chart/infrastructure/adapters/*.ts` (M2, `f4400a8`) — xác nhận qua `git clone` + đọc trực tiếp, không suy đoán.

---

## 5. Architecture & Module Boundaries

### 5.1 Vị trí file — trích nguyên văn Sprint 3 Plan §7.1, bổ sung 2 file mới đã CONFIRMED qua Confirmation.md (Decision M3-1, M3-6)

```
backend/src/modules/chart/domain/engine/
├── validation/
│   └── chart-input.validator.ts
├── calculators/
│   ├── planet.calculator.ts
│   ├── house.calculator.ts
│   ├── angle.calculator.ts
│   ├── aspect.calculator.ts
│   └── pattern.calculator.ts       ← luôn trả [] (D-14)
├── time-conversion.ts              ← MỚI, Decision M3-1 — local time → UTC Date
├── engine-version.constant.ts      ← MỚI, ĐIỀU KIỆN — Decision M3-6 (xem Mục 20; đã xác nhận M2 chưa định nghĩa, cần task này)
└── chart-builder.ts
```

Layout gốc Sprint 3 Plan §7.1 không liệt kê 2 file trên — đây là bổ sung có chủ đích, đã xác nhận qua Confirmation.md, không phải tự ý mở rộng. Không thêm thư mục con nào khác ngoài 2 file phẳng này (không tạo `engine/policies/` riêng — `UnknownBirthTimePolicy`/`OrbPolicy` vẫn là function nội bộ trong `chart-builder.ts`/`aspect.calculator.ts` tương ứng, xem 5.3 dưới).

### 5.2 Responsibility Matrix

| Trách nhiệm | Swiss Ephemeris Adapter (M2) | Astrology Engine (M3) | BirthProfile (M4) | Chart Module Application (M6) |
|---|---|---|---|---|
| Raw astronomical calculation, WASM lifecycle | ✅ | ❌ | ❌ | ❌ |
| Swiss Ephemeris error translation → `ExternalServiceError` | ✅ | ❌ | ❌ | ❌ |
| House/Angle non-convergence detection (ngưỡng 66.5°) | ✅ (pre-check trước khi gọi thư viện) | ❌ (chỉ tiêu thụ `HouseCalculationResult` đã có sẵn discriminant) | ❌ | ❌ |
| Normalization (longitude, sign, degreeInSign) | ❌ | ✅ | ❌ | ❌ |
| Domain validation (coordinate/datetime/houseSystem range) | ❌ | ✅ (Validation Module, Defense-in-Depth) | ❌ | ❌ |
| Retrograde/Aspect/derived calculation | ❌ | ✅ | ❌ | ❌ |
| `isBirthTimeKnown` branching (bỏ House/Angle Calculator) | ❌ | ✅ (Chart Builder quyết định) | ❌ | ❌ |
| Deterministic `Chart` assembly | ❌ | ✅ (Chart Builder) | ❌ | ❌ |
| Birth data ownership, snapshot source | ❌ | ❌ (chỉ **nhận** `EngineInput` đã có sẵn) | ✅ | ❌ |
| Chart persistence, transaction | ❌ | ❌ | ❌ | ✅ (M5/M6) |
| Use-case orchestration, authorization, `id`/`userId` assignment | ❌ | ❌ (xem Decision M3-4, Mục 20) | ❌ | ✅ |

### 5.3 File-by-File

| File | Layer | Cho phép import | Cấm import |
|---|---|---|---|
| `chart-input.validator.ts` | Domain (pure) | `chart/domain/errors`, `chart/domain/types`, `chart/domain/value-objects/engine-input.vo` | `swisseph-wasm`, Express, Prisma, bất kỳ module khác ngoài `chart` |
| `calculators/planet.calculator.ts` | Domain (pure) | `chart/domain/entities/planet.entity`, `chart/domain/value-objects/zodiac-position.vo`, `chart/domain/ports/ephemeris-provider.port` (chỉ dùng **type**, không gọi trực tiếp adapter) | `swisseph-wasm`, `chart/infrastructure/*` |
| `calculators/house.calculator.ts` | Domain (pure) | `chart/domain/entities/house.entity`, `chart/domain/ports/ephemeris-provider.port` (type) | như trên |
| `calculators/angle.calculator.ts` | Domain (pure) | `chart/domain/entities/angle.entity`, `chart/domain/ports/ephemeris-provider.port` (type) | như trên |
| `calculators/aspect.calculator.ts` | Domain (pure) | `chart/domain/entities/{aspect,planet}.entity`, `chart/domain/types/chart.types` | như trên |
| `calculators/pattern.calculator.ts` | Domain (pure) | `chart/domain/entities/pattern.entity` (chỉ để type-check, không tạo instance nào — luôn `[]`) | như trên |
| `time-conversion.ts` | Domain (pure, native-first — Decision M3-1) | `Intl.DateTimeFormat`/native `Date` API, `chart/domain/errors/chart.errors` (cho `UnresolvableTimezoneError`) | `swisseph-wasm`, bất kỳ thư viện timezone ngoài (`luxon`/`date-fns-tz`) trừ khi native được xác nhận không đủ correctness (xem Decision M3-1) |
| `engine-version.constant.ts` (điều kiện) | Domain (pure constant) | Không import gì (literal string constant) | — |
| `chart-builder.ts` | Domain (orchestrator, vẫn "pure" theo nghĩa không I/O trực tiếp — nhận `IEphemerisProvider` qua constructor injection) | toàn bộ entity/VO/error của `chart/domain`, 5 calculator trên, `time-conversion.ts`, `IEphemerisProvider` (type + instance qua DI) | `swisseph-wasm` trực tiếp (chỉ gọi qua interface đã inject), Express, Prisma |

**Xác nhận qua `eslint-plugin-boundaries` thật:** Cấu hình hiện tại (Sprint 3 Plan §14, Milestone 4 mô tả) chỉ enforce 3 rule **nội bộ 1 module** (domain không phụ thuộc application/infrastructure/presentation) — đủ để chặn M3 vô tình import `chart/infrastructure/adapters/swiss-ephemeris.adapter.ts` (đã verify: `domain` bị cấm import `infrastructure` trong cùng module). Rule cross-module (`T-BOUNDARY-VERIFY`) thuộc M4, không ảnh hưởng M3 vì M3 không cần import bất kỳ module nào khác ngoài `chart`.

---

## 6. Domain Model

**Không tạo Entity/VO mới nào** — toàn bộ đã tồn tại từ M1 (`dcbac7a`), đã đọc trực tiếp code thật:

| Entity/VO | Trạng thái | Ghi chú cho M3 |
|---|---|---|
| `Chart` | Đã có, immutable, `create()` validate INV-1/2/4/5/10/15 | M3's `ChartBuilder` là nơi **duy nhất** gọi `Chart.create()` trong phạm vi Domain (Application layer M6 sẽ gọi `ChartBuilder`, không gọi thẳng `Chart.create()`) |
| `Planet` | Đã có, `create()` validate longitude range + **assert Sun/Moon không retrograde** (INV-14, đã code sẵn ở Entity, M3 không cần tự viết lại assertion này — chỉ cần đảm bảo Planet Calculator không tự bắt exception này rồi nuốt mất) | |
| `House` | Đã có, `create()` validate `number ∈[1,12]`, `cuspDegree ∈[0,360)` | |
| `Angle` | Đã có, `create()` validate `longitude ∈[0,360)` | Không tự validate DSC=ASC+180 ở Entity — self-check này là trách nhiệm **Angle Calculator** (Mục 8 dưới), Entity chỉ validate range |
| `Aspect` | Đã có, `create()` validate `planetA≠planetB`, **canonical alphabet ordering** (`planetA < planetB`), `orb≥0` | Aspect Calculator **bắt buộc** sắp xếp planetA/planetB theo alphabet trước khi gọi `Aspect.create()`, nếu không sẽ throw `DataIntegrityError` ngay tại Entity |
| `Pattern` | Đã có, `create()` validate `involvedPlanets.length≥3`, code comment sẵn ghi rõ "D-14... entity tồn tại, không implement thuật toán detect" | Pattern Calculator (M3) **không bao giờ gọi** `Pattern.create()` — luôn trả `[]` |
| `ZodiacPosition` VO | Đã có, `fromLongitude()` normalize an toàn số âm, `sign = ZODIAC_SIGNS[floor(longitude/30)]` | Planet Calculator dùng trực tiếp, không tự viết lại logic normalize |
| `EngineInput` VO | Đã có — **quan trọng, xem Mục 20 Decision M3-1**: lưu **local time** (`birthDate`, `birthTime{hour,minute,second}\|null`, `isBirthTimeKnown`, `timezoneId`), KHÔNG lưu `utcDateTime` sẵn | M3 quy đổi UTC qua `time-conversion.ts` (Decision M3-1) |
| `Warning` VO | Đã có, dùng cho `HOUSE_SYSTEM_NOT_CONVERGING` | House Calculator tạo `Warning` khi nhận `HouseCalculationResult.status === 'not_convergent'` |
| `ChartCalculationMetadata` VO | Đã có, `create({calculatedAt, engineVersion})`, validate `engineVersion` không rỗng | Chart Builder gọi cuối pipeline |

**`PlanetCategory` enum — CONFIRMED giữ nguyên, không sửa (Decision M3-2, phương án B):** enum thật (`chart.types.ts`) chỉ có `Personal | Social | Outer` — không mở rộng thêm `Point` dù Astrology Domain Spec Appendix 9.3 có nhắc tới nhóm "Points (optional)". Quyết định chính thức: **không sửa M1 enum, không mở rộng domain model chỉ để giải quyết 1 calculation policy**. Thay vào đó, Aspect Calculator (Mục 9.1) dùng 1 abstraction **nội bộ, không thuộc Domain Model** gọi là `OrbGroup` (`'Personal' | 'NonPersonal'`) — tách biệt hoàn toàn khỏi `PlanetCategory` của Entity — để tra bảng orb: 4 optional points (Chiron/Lilith/NorthNode/SouthNode) được xử lý như `OrbGroup='NonPersonal'` (cùng nhóm với Social/Outer, đúng tinh thần D-5 đã CONFIRMED — không tạo orb table mới). Xem chi tiết Mục 9.1 và Mục 20, Decision M3-2.

---

## 7. Calculation Contracts

### 7.1 Pipeline order — trích nguyên văn Natal Chart Domain Spec §7 (bắt buộc, đã Confirmed)

```
Chart (rỗng)
  → Planet[]                              (Planet Calculator)
  → House[]        [nếu isBirthTimeKnown]  (House Calculator)
  → Angle[]         [nếu isBirthTimeKnown]  (Angle Calculator)
  → gán Planet.house (sau khi có House[])  ← trách nhiệm CHART BUILDER, không phải Planet Calculator
                                              (Domain Spec §7 xác nhận tường minh: "Domain Spec không nêu rõ...
                                              xác định đây là trách nhiệm của Chart Builder — PlanetCalculator
                                              chạy trước HouseCalculator nên không thể tự biết House nào")
  → Aspect[]                               (Aspect Calculator, dựa trên Planet[])
  → Pattern[] = []                         (Pattern Calculator, D-14 DEFERRED — không gọi thuật toán)
  → Chart hoàn chỉnh                       (Chart Builder ráp, gọi Chart.create())
```

Thứ tự này **bắt buộc** — không được implement song song Aspect/House vì Aspect chỉ phụ thuộc Planet (đã xác nhận Domain Spec §11.1: "Aspect: Tính đầy đủ, bình thường — chỉ phụ thuộc vị trí Planet, không phụ thuộc House/Angle").

### 7.2 `ChartBuilder` — chữ ký CONFIRMED (Decision M3-4, giữ nguyên concept đề xuất ban đầu)

```typescript
interface ChartBuilderInput {
  id: string;                    // UUID — Application layer (M6) generate, ChartBuilder chỉ pass-through
  userId: string | null;         // null nếu save=false (transient, Guest) — Application layer quyết định
  birthProfileId: string | null; // Application layer quyết định (BirthProfile snapshot hay inline)
  engineInput: EngineInput;      // đã có sẵn từ M1
}

class ChartBuilder {
  constructor(private readonly ephemerisProvider: IEphemerisProvider) {}
  async build(input: ChartBuilderInput): Promise<Chart>;
}
```

**Không dùng chữ ký đơn giản hóa `build(birthData, options): Chart`** của Engine Spec §6.10 nguyên văn — chữ ký đó là mô tả *khái niệm* (Engine Spec tự ghi chú cuối tài liệu: tài liệu này "mô tả cách tính, không phải cái gì" ở mức thấp hơn Domain Spec). `Chart.create()` **thật** (M1 code) yêu cầu `id`/`userId`/`birthProfileId` bắt buộc tại constructor (không có setter) — ChartBuilder trả về `Chart` hoàn chỉnh thật sự bắt buộc phải nhận các field này làm input. Đây là Implementation Detail, không ảnh hưởng business rule chiêm tinh nào — đã CONFIRMED, dùng nguyên chữ ký trên cho T3.8.

### 7.3 Input/Output từng bước (bảng đầy đủ)

| Bước | Module | Input | Output | Nguồn |
|---|---|---|---|---|
| 0 | `chart-input.validator.ts` | `EngineInput` thô | `void` (throw exception đầu tiên gặp phải — CONFIRMED, Decision M3-3) | Engine Spec §6.1 |
| 0.5 | `time-conversion.ts` (CONFIRMED, Decision M3-1) | local `birthDate`+`birthTime`+`timezoneId` (từ `EngineInput.birthData`) | `utcDateTime: Date` — nếu `isBirthTimeKnown=false`, dùng anchor `12:00:00` local (Decision M3-5), **chỉ dùng để gọi `calculateNatal()`, không bao giờ dùng cho `calculateHouses()`** | Engine Spec §3.3 bước [3], Domain Spec §10 |
| 1 | `planet.calculator.ts` | `RawEphemerisData` (từ `IEphemerisProvider.calculateNatal()`), `includeOptionalPoints` | `Planet[]` (≥10, ≤14 phần tử) | Engine Spec §6.3 |
| 2 | `house.calculator.ts` | `HouseCalculationResult` (từ `IEphemerisProvider.calculateHouses()`) | `House[]` (12 hoặc rỗng) + `Warning?` | Engine Spec §6.4 |
| 3 | `angle.calculator.ts` | `RawHouseData.ascendant`/`.midheaven` (từ cùng `HouseCalculationResult`) | `Angle[]` (4 hoặc rỗng) | Engine Spec §6.5 |
| 4 | `chart-builder.ts` (gán `Planet.house`) | `Planet[]`, `House[]` | `Planet[]` đã gán `house` | Domain Spec §7 |
| 5 | `aspect.calculator.ts` | `Planet[]` | `Aspect[]` | Engine Spec §6.6 |
| 6 | `pattern.calculator.ts` | *(không dùng — luôn `[]`)* | `[]` | D-14 |
| 7 | `chart-builder.ts` (assembly) | tất cả trên + `id`/`userId`/`birthProfileId` | `Chart` | Engine Spec §6.10 |

---

## 8. Planetary Calculations

**Input:** `RawEphemerisData.planets: Array<{name: PlanetName, longitude, latitude, speed}>` — đã có sẵn từ M2's `SwissEphemerisAdapter.calculateNatal()` (đã verify chạy thật, trả đúng 13 hoặc 14 phần tử tùy `includeOptionalPoints`).

**Phát hiện quan trọng (xác nhận từ code M2 thật, không phải giả định):** `SouthNode` **đã được** `SwissEphemerisAdapter` tính sẵn (công thức `(NorthNode.longitude + 180) % 360`) và đưa vào `RawEphemerisData.planets` — đã verify qua đọc trực tiếp `swiss-ephemeris.adapter.ts` M2 và test thật pass. **Planet Calculator (M3) không cần tự derive SouthNode** — chỉ cần lọc đúng theo `includeOptionalPoints` (nếu `SouthNode` không có trong optional points được yêu cầu, loại nó khỏi kết quả cuối, tương tự Chiron/Lilith/NorthNode).

**Business Rules (Engine Spec §6.3 + Domain Spec §13–14):**

1. `sign`, `degreeInSign` = `ZodiacPosition.fromLongitude(longitude)` — dùng VO có sẵn, không viết lại.
2. `isRetrograde = (speed < 0)` — so sánh dấu thuần túy, không ngưỡng, không "stationary" (D-12 DEFERRED).
3. `category`: Personal (Sun/Moon/Mercury/Venus/Mars), Social (Jupiter/Saturn), Outer (Uranus/Neptune/Pluto). `PlanetCategory` **không mở rộng** thêm giá trị nào (Decision M3-2) — nhưng field này trên `Planet` Entity là bắt buộc (`PlanetProps.category` không optional), nên Planet Calculator vẫn cần gán 1 giá trị hợp lệ cho Chiron/Lilith/NorthNode/SouthNode. **Điểm còn lại nhỏ, chưa nằm trong Confirmation.md (Implementation Detail, đề xuất chứ chưa CONFIRMED):** gán `category='Outer'` cho cả 4 điểm tùy chọn (gần nghĩa nhất với "chuyển động chậm/không phải hành tinh cá nhân") — **chỉ mang tính lưu trữ/hiển thị**, hoàn toàn tách biệt khỏi việc tính Aspect: Aspect Calculator **không đọc** `Planet.category` để tra orb, mà dùng abstraction `OrbGroup` riêng nội bộ (Mục 9, Decision M3-2) — nên đề xuất này dù sai cũng không ảnh hưởng tính đúng đắn thiên văn học, chỉ ảnh hưởng field hiển thị (xem `OrbGroup`, Mục 9.1). Nên xác nhận nhanh cùng lúc code T3.3, không cần chặn.
4. `Planet.create()` (M1) tự throw `DataIntegrityError` nếu Sun/Moon có `isRetrograde=true` — Planet Calculator **không được** tự `try/catch` nuốt lỗi này; để nó propagate lên Chart Builder rồi lên Application layer nguyên trạng (INV-14, TR-13).
5. `house: number | null` — **không gán ở bước này** (Mục 7.1) — Planet Calculator luôn trả `house: null`, Chart Builder gán lại sau.
6. Lọc theo `includeOptionalPoints`: mặc định rỗng → chỉ 10 hành tinh chuẩn (TR-20); nếu có chỉ định → thêm đúng các điểm được yêu cầu (TR-21).

**Test (Unit, fixture, không cần WASM):**

| Test case | Nguồn |
|---|---|
| 10 hành tinh chuẩn, `includeOptionalPoints=[]` → đúng 10 phần tử | TR-20 |
| `includeOptionalPoints=['Chiron']` → 11 phần tử, có Chiron | TR-21 |
| `speed=-0.5` → `isRetrograde=true` | TR-12 |
| Fixture giả lập Sun có `speed=-0.1` → throw `DataIntegrityError` (qua `Planet.create()`) | TR-13, INV-14 |
| `longitude=195.5` → `sign=Libra`, `degreeInSign=15.5` | TR-2 |
| Mọi Planet trả về có `house=null` (chưa gán) | Mục 7.1 |

---

## 9. Zodiac Calculations

**Đã có sẵn 100% ở `ZodiacPosition.fromLongitude()` (M1)** — M3 không viết lại, chỉ **tiêu thụ**. Không có công việc mới ở mục này ngoài việc gọi đúng VO có sẵn trong Planet Calculator.

- Chuẩn: Tropical Zodiac, 12 Sign × 30°, `longitude=0` ⟺ Aries 0° (Vernal Equinox).
- Normalize an toàn số âm: `((value % 360) + 360) % 360` — đã implement đúng ở `fromLongitude()`.
- Test boundary: `longitude=375°` → normalize `=15°` (TR-1); `longitude=29.9999999°` → chấp nhận sai số floating-point tự nhiên gần biên Sign, không cần bù trừ (Domain Spec §21).

### 9.1 Aspect Calculation & `OrbGroup` (CONFIRMED, Decision M3-2 — bổ sung cho `aspect.calculator.ts`)

Công thức xác định Aspect giữ nguyên 100% Domain Spec §19.1 (`angular_separation = min(raw, 360-raw)`, tra bảng orb theo `(aspectType, group)`, canonical alphabet ordering trước khi tạo `Aspect` — Mục 18.5). Điểm bổ sung duy nhất là cách nhóm hành tinh để tra orb:

```typescript
// Nội bộ aspect.calculator.ts / orb-policy — KHÔNG xuất ra ngoài Domain Model,
// KHÔNG phải PlanetCategory của Entity.
type OrbGroup = 'Personal' | 'NonPersonal';

function toOrbGroup(name: PlanetName): OrbGroup {
  const PERSONAL: PlanetName[] = [Sun, Moon, Mercury, Venus, Mars];
  return PERSONAL.includes(name) ? 'Personal' : 'NonPersonal';
}
```

- `NonPersonal` gộp: Jupiter, Saturn (Social, đúng D-5 CONFIRMED) **và** Uranus/Neptune/Pluto (Outer) **và** Chiron/Lilith/NorthNode/SouthNode (optional points) — dùng chung 1 cột orb hẹp hơn đã có sẵn ở Domain Spec §18.2 (Conjunction ±6°, Sextile ±3°, Square/Trine ±5°, Opposition ±6°). **Không tạo cột orb thứ 3, không invent giá trị mới.**
- `OrbGroup` là type nội bộ của `aspect.calculator.ts`, **không** export ra `chart/domain/types/` hay bất kỳ đâu ngoài Aspect Calculator — tránh nhầm lẫn với `PlanetCategory` của Entity (2 khái niệm tách biệt có chủ đích, theo đúng quyết định "không mở rộng domain model chỉ để giải quyết 1 calculation policy").
- Hệ quả: Aspect Calculator dựa trên `toOrbGroup(planet.name)` (tính trực tiếp từ `PlanetName` enum, không đọc `Planet.category` của Entity) để tra orb — độc lập hoàn toàn với việc Planet Calculator gán `category` gì cho optional points (Mục 8).

---

## 10. House Calculations

**Input:** `HouseCalculationResult` từ `IEphemerisProvider.calculateHouses()` — discriminated union `{status:'success', data: RawHouseData} | {status:'not_convergent'}` (đã có sẵn từ M1 port, M2 implement thật).

**Business Rules:**

1. `status==='not_convergent'` → `House[] = []`, Chart Builder tạo `Warning{code:'HOUSE_SYSTEM_NOT_CONVERGING', severity:'warning'}` — **không throw exception** (D-3 CONFIRMED, TR-6). Đây là "lỗi mềm".
2. `status==='success'` → map `data.cusps[0..11]` (đã đúng slice, M2 Adapter đã xử lý off-by-one) → 12 `House.create({number: i+1, cuspDegree: cusps[i], houseSystem})`.
3. **House[1].cuspDegree phải bằng Angle[Ascendant].longitude** (Domain Spec §16) — cả 2 nên lấy từ **cùng 1 giá trị** (`RawHouseData.ascendant`), không gọi tính 2 lần độc lập. House Calculator dùng `data.ascendant` trực tiếp cho `House[1].cuspDegree` thay vì `data.cusps[0]` nếu 2 giá trị này có thể lệch (khuyến nghị: kiểm tra M2 output — theo pseudo-code M2, `cusps[0]` sau slice **chính là** `ascendant` do Swiss Ephemeris trả cùng 1 nguồn, nên về lý thuyết luôn khớp; nếu có sai lệch floating-point cực nhỏ, ưu tiên dùng `data.ascendant` làm nguồn duy nhất cho cả `House[1]` và `Angle[Ascendant]` — Implementation Detail, không phải business rule mới).
4. **Whole Sign house numbering rule (nếu `houseSystem==='WholeSign'`):** House 1 bắt đầu tại `floor(Ascendant.longitude / 30) * 30`, House N = House 1 + (N-1)×30° (mod 360) (Domain Spec §15.4). **Lưu ý quan trọng:** dù tên "Whole Sign", `RawHouseData` từ M2 Adapter (dùng mã `'W'` native của thư viện) đã trả cusps đúng theo quy tắc trên — House Calculator **không cần tự tính lại** công thức này, chỉ cần map `cusps[]` y hệt cách làm với Placidus (M2 đã xác nhận thư viện tính đúng native, không cần AstroViet tự làm lại — tránh trùng lặp trách nhiệm Adapter/Domain).
5. `cuspDegree` **luôn** có giá trị cụ thể kể cả Whole Sign (không để trống) — DB Spec `chart_houses.cusp_degree NOT NULL` (Domain Spec §16, đã xác nhận).

**Test:**

| Test case | Nguồn |
|---|---|
| `latitude=10°` (không cực), Placidus → đúng 12 House, không warning | TR-5 |
| `latitude=70°` (vượt 66.5°), Placidus → `houses=[]`, `warnings` chứa `HOUSE_SYSTEM_NOT_CONVERGING`, không throw | TR-6 |
| `Ascendant.longitude=195.5°` (Libra), Whole Sign → `House[1].cuspDegree=180°`, `House[2].cuspDegree=210°` | TR-4 |
| `houses[].number` là hoán vị đúng `{1..12}`, không trùng | TR-3 |
| `isBirthTimeKnown=false` → House Calculator **không được gọi** (Chart Builder chặn trước khi gọi, xem Mục 12) | TR-7 |

---

## 11. Retrograde

Đã trình bày ở Mục 8 (đây chỉ là phần tổng hợp riêng theo format prompt yêu cầu):

```
isRetrograde = (speed < 0)
```

- Không ngưỡng (không `|speed| > x`), không trạng thái "stationary" (D-12 DEFERRED — không tự thêm).
- Sun/Moon `isRetrograde` **phải luôn `false`** — enforced ở `Planet.create()` (M1, đã code), Planet Calculator không tự enforce lại, chỉ không được nuốt exception nếu nó xảy ra.
- Test: TR-12 (speed âm → retrograde), TR-13 (Sun/Moon speed âm giả lập → `DataIntegrityError`).

---

## 12. Unknown Birth Time

Trích nguyên văn Domain Spec §11.1 (bảng hành vi đã đóng băng) — đây là **business rule của Chart Builder** (module duy nhất biết `isBirthTimeKnown` và quyết định nhánh rẽ):

| Thành phần | `isBirthTimeKnown=false` |
|---|---|
| Chart có tạo không | Có — không fail |
| Planet | Tính đầy đủ (Moon có thể lệch nhẹ — D-2 DEFERRED, không thêm warning riêng) |
| House | `houses=[]` — **House Calculator không được gọi** |
| Angle | `angles=[]` — **Angle Calculator không được gọi** |
| Aspect | Tính đầy đủ bình thường (chỉ phụ thuộc Planet) |
| `isHouseDataAvailable` | `false` |

**`UnknownBirthTimePolicy`** (pure function, `chart/domain/engine/`, theo Sprint 3 Plan §7.4) — đề xuất chữ ký:

```typescript
function shouldCalculateHousesAndAngles(isBirthTimeKnown: boolean): boolean {
  return isBirthTimeKnown;
}
```

Đây là toàn bộ logic policy — cố ý đơn giản (nhị phân, Domain Spec §11.4 xác nhận **không** thêm precision level trung gian). Chart Builder gọi hàm này để quyết định có gọi `house.calculator.ts`/`angle.calculator.ts` hay không — **không được** để House/Angle Calculator tự kiểm tra field này (Engine Spec §6.5: "đây là quyết định của Chart Builder, không phải Angle Calculator tự kiểm tra").

**Không tạo giờ mặc định dưới bất kỳ hình thức nào** (Conflict #1 RESOLVED) — nhưng **vẫn cần 1 `utcDateTime` cụ thể để gọi `calculateNatal()`** (Planet vẫn tính được). **CONFIRMED (Decision M3-5):** anchor time = `12:00:00` local, pin thành named constant (ví dụ `ANCHOR_TIME_FOR_UNKNOWN_BIRTH_TIME = { hour: 12, minute: 0, second: 0 }` trong `time-conversion.ts`, kèm comment trích Swiss Ephemeris Integration Spec §9.3). Giờ neo này **chỉ dùng nội bộ** trong lệnh gọi `calculateNatal()`, không lộ ra `Chart`/snapshot, và **tuyệt đối không** dùng để gọi `calculateHouses()` — `house.calculator.ts`/`angle.calculator.ts` đơn giản là **không được gọi** khi `isBirthTimeKnown=false` (Chart Builder chặn trước, không phải do thiếu `utcDateTime` hợp lệ).

**Test:** TR-7 (đầy đủ, đã trích ở Mục 8/10).

---

## 13. Precision & Determinism

Kế thừa nguyên trạng Domain Spec §20, §24 — không tạo số mới:

- **Không làm tròn trong Engine.** Toàn bộ tính toán nội bộ (Planet Calculator → Aspect Calculator) dùng `float64` nguyên vẹn. Làm tròn về `NUMERIC(x,y)` **chỉ xảy ra ở Chart Builder lúc ráp kết quả cuối** (hoặc thực ra — làm tròn thật sự xảy ra ở tầng Persistence/Prisma M5, không phải ở Chart Builder; Chart Builder chỉ đảm bảo **không chủ động làm tròn sớm hơn**, để giá trị `float64` đầy đủ truyền tới tận M5). Aspect Calculator (Mục 9.1 Domain Spec) **bắt buộc** dùng `longitude` full-precision, không dùng giá trị đã bị làm tròn.
- **Determinism:** Cùng `EngineInput` (cùng `engineVersion`) → luôn cùng `Chart` (TR-15). Cấm: `Math.random()`, `Date.now()`/`new Date()` không tham số (trừ đúng 1 chỗ hợp lệ: `ChartCalculationMetadata.calculatedAt`, vốn **không ảnh hưởng kết quả tính toán**, chỉ là metadata — Domain Spec §23.2 xác nhận tường minh sự khác biệt này).
- **`engineVersion`**: định danh tổng hợp (code + ephemeris data + flags) — theo Sprint 3 Plan §8, hằng số này lẽ ra **định nghĩa ở M2**. **Đã verify trực tiếp bằng `grep -rn "engineVersion\|ENGINE_VERSION"` trên toàn bộ `backend/src/` (Decision M3-6, thực hiện ngay đầu T3.0 theo đúng yêu cầu, không để tới T3.8):** M2 **chưa định nghĩa** hằng số này ở bất kỳ đâu — chỉ có `ChartCalculationMetadata.create()` (M1) validate `engineVersion` không rỗng, không có nguồn giá trị thật nào. **Corrective task cho M3:** tạo `chart/domain/engine/engine-version.constant.ts` — literal string constant (ví dụ `'chart-engine-v1+swisseph-wasm-0.1.0'`, ghép thủ công từ `backend/package.json` version hiện tại `0.2.0` scope code + `swisseph-wasm` version đã pin `0.1.0` ở M2 — bump thủ công khi 1 trong 2 phần thay đổi, không đọc dynamic từ `package.json` lúc runtime để giữ đúng tinh thần "không phụ thuộc trạng thái ẩn" của Determinism). M3 định nghĩa hằng số này và dùng trong `chart-builder.ts` khi gọi `ChartCalculationMetadata.create()`.

**Test:** TR-15 (gọi Engine 2 lần với cùng input → so sánh toàn bộ field số giống hệt nhau, dùng fixture cố định, không cần WASM thật vì Calculator test bằng fixture).

---

## 14. Error Handling

Domain error — **không có HTTP status, không RFC7807** (Engine Spec §1.3, Domain Spec §26 xác nhận tường minh — mapping HTTP là Application/API, M6/M7).

| Domain Error (đã có ở `chart.errors.ts`, M1) | Khi nào trong M3 | Chặn pipeline? |
|---|---|---|
| `InvalidCoordinateError` | Validation Module: `latitude∉[-90,90]` hoặc `longitude∉[-180,180]` | Có |
| `InvalidDateTimeError` | Validation Module: ngày/giờ sinh không hợp lệ | Có |
| `UnsupportedHouseSystemError` | Validation Module: `houseSystem∉{Placidus,WholeSign}` | Có |
| `UnsupportedChartTypeError` | Validation Module: `chartType≠'Natal'` — dừng **trước cả bước tính toán nào khác** | Có |
| `UnsupportedCelestialBodyError` | Nếu `includeOptionalPoints` chứa giá trị ngoài 4 điểm đã đóng băng | Có |
| `DataIntegrityError` | Vi phạm assertion bất biến (Sun/Moon retrograde — ném tại `Planet.create()`, không phải Calculator tự ném) | Có — nghiêm trọng |
| *(không throw)* `HOUSE_SYSTEM_NOT_CONVERGING` | `Warning`, không phải Exception (Mục 10) | **Không** |
| *(không throw)* `patterns=[]` | Kết quả hợp lệ có chủ đích (D-14) | **Không** |

**CONFIRMED (Decision M3-7) — mở rộng `chart.errors.ts` (M1) với đúng 2 class mới, không thêm class thứ 3:**

| Class mới | Dùng khi | Do file nào ném |
|---|---|---|
| `UnresolvableTimezoneError` | `timezoneId` không hợp lệ trong IANA DB (Decision M3-1) | `time-conversion.ts` |
| `ChartCalculationFailed` | Lỗi runtime không lường trước, không rơi vào category cụ thể nào khác (Domain Spec §26) | `chart-builder.ts` — wrap mọi lỗi bất ngờ từ Calculator trước khi propagate lên Application layer |

**Không thêm `MissingRequiredFieldError`** (CONFIRMED) — lý do: `EngineInput` đã là object TypeScript đã type-check ở biên gọi (Application layer/Zod ở M7 đảm bảo field tồn tại trước khi build `EngineInput`), nên "thiếu field" không phải lỗi runtime cần validate lại ở M3 theo kiểu Defense-in-Depth riêng — khác với range/format validation (coordinate/datetime/houseSystem) vẫn cần re-check vì giá trị có thể hợp lệ về mặt type nhưng sai về mặt miền giá trị.

---

## 15. Testing Strategy

Theo đúng Sprint 3 Plan §12.1: **100% Unit test dùng fixture**, không gọi WASM thật (đó là việc của Integration Test M8 và Adapter Test đã xong ở M2).

| Layer | Vị trí | Input |
|---|---|---|
| `chart-input.validator.ts` | `tests/unit/modules/chart/domain/engine/validation/` | `EngineInput` fixture hợp lệ/không hợp lệ |
| Từng Calculator | `tests/unit/modules/chart/domain/engine/calculators/` | `RawEphemerisData`/`HouseCalculationResult` **giả lập tay** (object literal, không qua Adapter thật) |
| `chart-builder.ts` | `tests/unit/modules/chart/domain/engine/` | `IEphemerisProvider` **Fake** (implement interface, trả dữ liệu cố định) — **không dùng WASM thật, không dùng M2 Adapter thật** |
| End-to-end nội bộ Domain (DoD Sprint 3 Plan M3) | Cùng vị trí `chart-builder.test.ts` | Test toàn bộ pipeline qua `ChartBuilder`, verify `Chart` output đúng shape, không qua Application/API |

**Naming convention** (Coding Standards §25): `describe('ChartBuilder', () => { it('trả về houses rỗng khi isBirthTimeKnown=false', ...) })` — mô tả hành vi, không đánh số "test case 1".

---

## 16. Test Fixtures / Golden Cases

**Làm rõ ranh giới quan trọng (tránh nhầm lẫn với M8):** Mục này của M3 **không phải** Golden Reference Test (dữ liệu Astro.com thật) — đó thuộc **M8** (Sprint 3 Plan §12.5, Domain Spec §32, đã xác nhận là External Dependency **chưa thu thập**). M3 chỉ cần **fixture nội bộ tự tạo** — object literal TypeScript giả lập `RawEphemerisData`/`HouseCalculationResult`, được thiết kế để cover đúng 21 TR (Mục 31 Domain Spec), không cần chính xác thiên văn thật.

Ví dụ fixture cần có (không đầy đủ, minh họa nguyên tắc):

- `fixtureRawEphemerisData10Planets` — 10 hành tinh chuẩn, longitude rải rác để test Sign/degreeInSign.
- `fixtureRawEphemerisDataRetrogradeSun` — Sun có `speed=-0.1` (invalid, để test TR-13).
- `fixtureHouseCalculationResultConvergent` — `status:'success'`, 12 cusps cụ thể.
- `fixtureHouseCalculationResultNotConvergent` — `status:'not_convergent'`.
- `fixtureEngineInputUnknownBirthTime` — `isBirthTimeKnown:false`.

**Đặt tên đúng convention Coding Standards §25:** `fixture<TênKháiNiệm>`.

---

## 17. File-by-File Implementation Plan

| # | File | Trách nhiệm | AC riêng |
|---|---|---|---|
| 1 | `chart/domain/engine/validation/chart-input.validator.ts` | Validate `EngineInput` (coordinate, datetime, houseSystem, optionalPoints) | Throw exception đầu tiên gặp phải (Decision M3-3), đúng error class tương ứng cho từng field sai |
| 2 | `chart/domain/engine/calculators/planet.calculator.ts` | `RawEphemerisData` → `Planet[]` (Mục 8) | TR-12, TR-13, TR-20, TR-21 pass |
| 3 | `chart/domain/engine/calculators/house.calculator.ts` | `HouseCalculationResult` → `House[]` (Mục 10) | TR-3, TR-5, TR-6 pass |
| 4 | `chart/domain/engine/calculators/angle.calculator.ts` | `RawHouseData` → `Angle[]`, self-check DSC/IC | TR-19, INV-15 pass |
| 5 | `chart/domain/engine/calculators/aspect.calculator.ts` | `Planet[]` → `Aspect[]`, canonical ordering, orb lookup qua `OrbGroup` | TR-8, TR-9, TR-10, TR-11, TR-18 pass — dùng `OrbGroup` đã CONFIRMED (Decision M3-2) |
| 6 | `chart/domain/engine/calculators/pattern.calculator.ts` | Luôn `[]` | Không có test case "phát hiện pattern" nào — chỉ test `[] === []` |
| 7 | `chart/domain/engine/chart-builder.ts` | Orchestrate toàn bộ, gán `Planet.house`, gọi `Chart.create()` | Toàn bộ TR còn lại (TR-7, TR-14, TR-15) + DoD "end-to-end nội bộ Domain" |
| 8 | `chart/domain/engine/time-conversion.ts` (CONFIRMED, Decision M3-1) | Local time + `timezoneId` → `utcDateTime`; anchor `12:00` khi `isBirthTimeKnown=false` (Decision M3-5); throw `UnresolvableTimezoneError` | Test riêng: DST/lịch sử múi giờ VN, invalid timezoneId, anchor-time case |
| 9 | Mở rộng `chart/domain/errors/chart.errors.ts` (CONFIRMED, Decision M3-7) | Thêm đúng 2 class: `UnresolvableTimezoneError`, `ChartCalculationFailed` | Không sửa 6 class hiện có, không thêm `MissingRequiredFieldError` |
| 10 | `chart/domain/engine/engine-version.constant.ts` (CONFIRMED corrective task, Decision M3-6) | Literal constant `engineVersion`, verify đã xác nhận M2 chưa định nghĩa | Dùng trong `chart-builder.ts` khi gọi `ChartCalculationMetadata.create()` |

---

## 18. Ordered Task Breakdown

| Task | Mô tả | Phụ thuộc |
|---|---|---|
| T3.0 | ~~Resolve Open Questions~~ — **Đã DONE qua Confirmation.md**, còn lại 1 việc kỹ thuật nhỏ: verify M2 code cho `engineVersion` (Decision M3-6) — **đã thực hiện, xác nhận M2 chưa định nghĩa**, corrective task T3.10 dưới đây | Không |
| T3.1 | `chart-input.validator.ts` + test (throw exception đầu tiên — Decision M3-3) | T3.0 |
| T3.2 | `time-conversion.ts` + test (native `Intl.DateTimeFormat` trước, chỉ thêm lib nếu không đủ correctness — Decision M3-1; bao gồm anchor-time case, DST lịch sử VN) | T3.0 |
| T3.3 | `planet.calculator.ts` + test (bao gồm gán `category` cho optional points, xem Mục 8) | T3.0 |
| T3.4 | `house.calculator.ts` + test | Không phụ thuộc T3.3 (độc lập, cùng phụ thuộc `HouseCalculationResult` fixture) |
| T3.5 | `angle.calculator.ts` + test | Không phụ thuộc T3.3/T3.4 |
| T3.6 | `aspect.calculator.ts` + test (dùng `OrbGroup` nội bộ, Mục 9.1 — Decision M3-2) | T3.3 (cần `Planet[]` output) |
| T3.7 | `pattern.calculator.ts` (trivial) + test | Không |
| T3.8 | `chart-builder.ts` (orchestration đầy đủ, gán `Planet.house`, gọi `time-conversion.ts`, gọi `Chart.create()` với `ChartBuilderInput` — Decision M3-4) + test end-to-end nội bộ Domain | T3.1–T3.7, T3.10 |
| T3.9 | Review tổng thể: `npm run lint`/`typecheck`/`test` sạch cho `chart/domain/engine/`; xác nhận không import `swisseph-wasm`/Express/Prisma ở bất kỳ đâu trong `engine/` | T3.8 |
| T3.10 | `engine-version.constant.ts` (corrective task, Decision M3-6) | T3.0 |

---

## 19. Dependency Graph

```
M1 (Entities/VO/Ports — done)
M2 (IEphemerisProvider thật — done, chỉ cần TYPE cho Unit Test M3, không cần INSTANCE thật)
   │
   ▼
T3.0 (Decisions CONFIRMED qua Confirmation.md + verify engineVersion — DONE)
   │
   ├──▶ T3.1 (Validator)
   ├──▶ T3.2 (Time conversion)
   ├──▶ T3.4 (House Calculator)  ─┐
   ├──▶ T3.5 (Angle Calculator)  ─┼──▶ T3.8 (Chart Builder) ──▶ T3.9 (Review)
   ├──▶ T3.3 (Planet Calculator) ─┤
   ├──▶ T3.7 (Pattern, trivial)  ─┤
   └──▶ T3.10 (engine-version.constant.ts) ─┘
             │
             ▼
        T3.6 (Aspect Calculator, cần Planet[] từ T3.3)
```

T3.1/T3.2/T3.3/T3.4/T3.5/T3.7/T3.10 có thể làm **song song** (không phụ thuộc lẫn nhau, chỉ cùng phụ thuộc T3.0). T3.6 phải sau T3.3. T3.8 phải sau tất cả. **M3 không cần chờ Adapter M2 chạy thật** — chỉ cần `IEphemerisProvider` type đã có (M1) để viết Fake trong test.

---

## 20. Decision Log (đã CONFIRMED qua `Confirmation.md`)

7 điểm mơ hồ ban đầu (không tự ý giải quyết thầm lặng) nay đã có quyết định chính thức từ chủ dự án. Giữ nguyên định dạng "phát hiện → quyết định" để truy vết lý do, theo đúng convention Decision Log D-1→D-14 đã dùng ở Natal Chart Domain Spec §35.

### Decision M3-1 — Timezone Resolution: file `time-conversion.ts`, thuộc M3, Domain Engine layer

**Phát hiện (không đổi):** Astrology Engine Specification mô tả "Timezone Resolver" là bước Pipeline riêng thứ [3]; Natal Chart Domain Spec §8 mô tả `EngineInput` có sẵn `utcDateTime`; nhưng code `EngineInput` thật (M1) chỉ lưu local time; Sprint 3 Plan §7.1 không liệt kê file nào cho chức năng này.

**Quyết định:**

| Thành phần | Quyết định |
|---|---|
| Thuộc milestone | M3 |
| Vị trí | Domain Engine (`chart/domain/engine/time-conversion.ts`) |
| `ChartBuilder` | Chỉ gọi module, không tự chứa logic |
| Input | local date + local time + `timezoneId` |
| Output | UTC `Date` |
| Unknown time | anchor `12:00` local (xem Decision M3-5) |
| House/Angle | **Không dùng** anchor time (không gọi House/Angle Calculator khi `isBirthTimeKnown=false`, Mục 12) |
| Dependency | Native-first (`Intl.DateTimeFormat`) — chỉ thêm thư viện (`luxon`/`date-fns-tz`) nếu native không đảm bảo correctness (verify bằng test DST lịch sử VN thật, không giả định) |
| Error | `UnresolvableTimezoneError` (Decision M3-7) |

**Documentation Reconciliation Task (còn treo, không thuộc code M3):** Natal Chart Domain Spec §8 cần cập nhật lại mô tả `EngineInput` cho khớp code thật (local time, không phải `utcDateTime` sẵn có) — cùng nhóm với việc PRD FR-02 đã cần sửa trước đó (Domain Spec §36 Conflict #1). Đây là việc doc, không chặn code M3.

### Decision M3-2 — `PlanetCategory` giữ nguyên, dùng `OrbGroup` nội bộ cho Aspect Calculator (chọn phương án B)

**Phát hiện (không đổi):** Astrology Domain Spec Appendix 9.3 có 4 nhóm (Personal/Social/Outer/Points); code `PlanetCategory` thật chỉ có 3; Orb Policy chỉ có 2 cột.

**Quyết định — chốt phương án B, không phải phương án A đã đề xuất trước đó:**
- ❌ Không thêm `Point` vào `PlanetCategory`.
- ❌ Không sửa M1 enum.
- ❌ Không invent orb table mới (không tạo cột thứ 3).
- ✅ Optional points (Chiron/Lilith/NorthNode/SouthNode) được xử lý như `NonPersonal` trong Orb Policy.
- ✅ `OrbGroup` (`'Personal' | 'NonPersonal'`) là abstraction **nội bộ** của `aspect.calculator.ts`, không thuộc Domain Model, không export.
- ✅ D-5 hiện có (gộp Social vào nhóm "ngoài") được giữ nguyên, không mở lại.
- ✅ Nguyên tắc chung: không mở rộng Domain Model chỉ để giải quyết 1 calculation policy.

Chi tiết implementation: Mục 9.1.

### Decision M3-3 — Validation Module: throw exception đầu tiên

**Quyết định:** `chart-input.validator.ts` ném exception ngay tại lỗi đầu tiên gặp phải — **không** implement `ValidationResult{isValid, errors[]}` kiểu gom hết lỗi như Engine Spec §6.1 mô tả khái niệm. Nhất quán với cách các Entity M1 khác đã làm (`Chart.create()` cũng throw ngay ở invariant đầu tiên vi phạm).

### Decision M3-4 — `ChartBuilderInput` giữ nguyên concept đề xuất ban đầu

```typescript
interface ChartBuilderInput {
  id: string;
  userId: string | null;
  birthProfileId: string | null;
  engineInput: EngineInput;
}
```

Không thay đổi so với đề xuất ở Mục 7.2 — CONFIRMED dùng nguyên cho T3.8, làm điểm nối trực tiếp cho M6.

### Decision M3-5 — Anchor time = `12:00:00` local, pin thành named constant

CONFIRMED — không dùng `00:00`, không để mặc định ngầm của thư viện. Định nghĩa trong `time-conversion.ts`, comment trích rõ Swiss Ephemeris Integration Spec §9.3.

### Decision M3-6 — `engineVersion`: đã verify M2, xác nhận CHƯA tồn tại → corrective task M3

**Quyết định về quy trình:** không tự định nghĩa lại trước khi verify M2 — **đã thực hiện verify ngay đầu T3.0** (không để treo tới T3.8 như bản nháp đầu tiên đề xuất, đúng theo yêu cầu). Đã chạy `grep -rn "engineVersion\|ENGINE_VERSION" backend/src/` trên code thật: chỉ tìm thấy nơi `ChartCalculationMetadata.create()` (M1) validate field không rỗng — **không có nguồn giá trị thật nào được định nghĩa ở M2**. Kết luận: cần corrective task nhỏ T3.10 — tạo `engine-version.constant.ts` (Mục 17, hạng mục 10).

### Decision M3-7 — Error class: thêm đúng 2, không thêm class thứ 3

**Quyết định:**
- ✅ Thêm `UnresolvableTimezoneError` (dùng bởi `time-conversion.ts`).
- ✅ Thêm `ChartCalculationFailed` (dùng bởi `chart-builder.ts`, wrap lỗi runtime không lường trước).
- ❌ Không thêm `MissingRequiredFieldError` — lý do: field presence đã được đảm bảo bởi TypeScript type-checking + upstream construction của `EngineInput`, không cần Defense-in-Depth riêng cho "thiếu field" (khác với range/format validation vẫn cần re-check).

Chi tiết: Mục 14.

### Decision M3-8 — Quy tắc kết hợp Orb khi khác nhóm (Personal + NonPersonal)

**Phát hiện:** Domain Spec §18.1 chỉ ghi "tra bảng orb theo (aspectType, category của planetA/planetB)", không định nghĩa quy tắc chọn cột nếu 2 hành tinh khác category.
**Quyết định:** Khi kiểm tra orb, nếu ít nhất một trong hai hành tinh thuộc nhóm `Personal`, sử dụng cột orb rộng hơn (của nhóm `Personal`). Nguyên tắc "Widest applicable orb" này phù hợp với thông lệ chung trong phần mềm chiêm tinh (hành tinh cá nhân sẽ kéo rộng khoảng ảnh hưởng) và đã được đưa vào implementation của `aspect.calculator.ts` cùng với Unit test tương ứng.

---

## 21. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation | Detection |
|---|---|---|---|---|
| Timezone conversion sai lịch sử (DST/offset cũ Việt Nam) | Cao — sai toàn bộ vị trí hành tinh | Trung bình (nếu tự viết tay thay vì dùng `Intl`) | Dùng `Intl.DateTimeFormat` (đã có sẵn IANA tzdb chuẩn trong Node.js runtime), không tự viết bảng offset | Unit test với ngày sinh trước/sau mốc đổi múi giờ lịch sử VN |
| Off-by-one trong slice `cusps[]` bị lặp lại sai ở House Calculator (dù M2 đã đúng) | Cao — lệch toàn bộ house 1 vị trí | Thấp (M2 đã xử lý đúng, House Calculator chỉ cần map 1-1, không tự slice lại) | Test explicit dùng đúng giá trị tham chiếu Technical Spike (đã có ở M2 test) | Unit test so sánh trực tiếp giá trị cusps kỳ vọng |
| Sign boundary error (0°/360° wraparound) trong Aspect Calculator | Trung bình | Thấp (công thức `min(raw, 360-raw)` đã ghi rõ, dễ code đúng) | Bắt buộc dùng đúng hàm `angular_separation()` chung cho cả tính orb lẫn tính `isApplying` (Mục 18.3 Domain Spec cảnh báo rõ lỗi này) | TR-18 test |
| Retrograde assertion (Sun/Moon) bị Calculator tự `try/catch` nuốt mất | Cao — mất tín hiệu lỗi dữ liệu nghiêm trọng | Thấp nếu code review kỹ | Code review checklist riêng: Planet Calculator không có `try/catch` bao quanh `Planet.create()` | Test TR-13 explicit |
| Swiss Ephemeris ↔ Engine responsibility leakage (ví dụ Engine tự tính lại non-convergence thay vì đọc `HouseCalculationResult`) | Trung bình | Thấp (M2 đã xử lý pre-check đầy đủ) | House Calculator chỉ đọc `status` field, không tự gọi lại logic threshold 66.5° | Code review + kiểm tra `house.calculator.ts` không có literal `66.5` nào |
| Vô tình import `swisseph-wasm` trực tiếp trong Engine | Cao — vi phạm kiến trúc | Thấp | ESLint boundaries rule (nội bộ module, đã có từ Sprint 0) tự chặn `domain` import `infrastructure` | CI lint |
| Aspect Calculator không dùng `OrbGroup` mà lỡ đọc `Planet.category` của Entity | Trung bình | Thấp | Code review: `aspect.calculator.ts` không import `Planet.category` cho mục đích tra orb (chỉ dùng `toOrbGroup(planet.name)` — Decision M3-2, Mục 9.1) | Unit test dùng fixture có `category` "sai" cố ý, verify orb vẫn đúng theo `OrbGroup` |
| Golden test reference data thật sự cần thiết sớm hơn dự kiến (nếu QA muốn verify M3 bằng mắt) | Thấp cho M3 (không phải AC của M3) | Thấp | Nhắc lại rõ ranh giới: M3 chỉ cần fixture tự tạo, Golden thật là M8 | Domain Spec §32/37 đã ghi nhận, không lặp lại công việc |
| `engineVersion` corrective task (T3.10) bị quên, `chart-builder.ts` code trước khi có hằng số | Trung bình | Thấp (đã lên task riêng, thứ tự rõ trong Mục 18/19) | T3.8 khai báo phụ thuộc tường minh vào T3.10 trong Dependency Graph | Code review — `chart-builder.ts` không tự tạo literal string `engineVersion` inline |
| Test brittleness do fixture tay không đại diện đủ input space | Trung bình | Trung bình | Cover đủ 21 TR + biên rõ ràng (66.5° đúng ranh giới, 97°/97.01° đúng biên orb) thay vì test ngẫu nhiên | Review checklist đối chiếu từng TR |

---

## 22. Definition of Done

- 5 Calculator + `chart-builder.ts` + Validation Module + `time-conversion.ts` + `engine-version.constant.ts` (nếu cần) implemented đúng file structure Mục 5.1.
- Toàn bộ 7 Decision (M3-1 đến M3-7, Mục 20) đã ghi lại và code khớp đúng — không còn "TBD" ẩn trong code.
- Engine **không** import `swisseph-wasm` trực tiếp ở bất kỳ đâu trong `chart/domain/engine/` (verify bằng `grep -r "swisseph" chart/domain/engine/` → rỗng).
- Engine tiêu thụ đúng `IEphemerisProvider` (type), không phụ thuộc implementation cụ thể.
- Đủ 10 hành tinh chuẩn + 4 điểm tùy chọn implement đúng theo `includeOptionalPoints`.
- Đủ 2 House System (Placidus, WholeSign) implement đúng.
- `isBirthTimeKnown=false` → `houses=[]`/`angles=[]` đúng D-9, không có giờ mặc định giả nào trong code.
- Error behavior implement đúng bảng Mục 14 — đúng 2 class mới (`UnresolvableTimezoneError`, `ChartCalculationFailed`), không thêm `MissingRequiredFieldError`.
- Determinism verified qua TR-15 (test thật, không chỉ đọc code khẳng định).
- Unit test đầy đủ cho tất cả 21 TR (Mục 31 Domain Spec) + 16 INV liên quan đến M3 (INV-2, 4, 5, 7, 9, 10, 14, 15, 16 — các INV còn lại thuộc M5/M6/DB).
- `npm run lint`/`typecheck`/`test` sạch cho phạm vi `chart/domain/engine/`.
- Không có TODO nào che giấu chức năng bắt buộc chưa xong (TODO cho D-14 Pattern là hợp lệ vì đã DEFERRED chính thức, có ghi chú rõ — không phải "che giấu").
- Pipeline nội bộ Domain chạy end-to-end qua `ChartBuilder` với input/output giả lập, không qua Application/API (khớp đúng DoD Sprint 3 Plan §14 Milestone 3).

---

## 23. Acceptance Criteria

Đối chiếu trực tiếp cả Prompt Mục 27 lẫn Sprint 3 Backend Plan §14 (2 nguồn đồng nhất, không mâu thuẫn):

1. Cho `EngineInput` với `isBirthTimeKnown=true`, `houseSystem='Placidus'`, `latitude=10°` → Engine trả `Chart` có đúng 12 `houses`, 4 `angles`, `isHouseDataAvailable=true`.
2. Cho `EngineInput` với `isBirthTimeKnown=false` → `Chart.houses=[]`, `Chart.angles=[]`, `isHouseDataAvailable=false`, `Chart.planets.length≥10`, `Chart.aspects` có thể non-empty.
3. Cho `latitude=70°` (Placidus) → `Chart.houses=[]`, `Chart.warnings` chứa 1 phần tử `code='HOUSE_SYSTEM_NOT_CONVERGING'`, **không** throw exception nào, hàm `build()` resolve bình thường.
4. `Chart.patterns` **luôn luôn** `=== []` cho mọi input hợp lệ ở M3 (D-14).
5. Fixture giả lập Sun/Moon có `speed<0` → `build()` reject với `DataIntegrityError`.
6. Gọi `build()` 2 lần với cùng `EngineInput` (deep-equal input, fixture cố định) → 2 `Chart` output giống hệt nhau ở mọi field số (trừ `id` nếu do test tự truyền khác nhau — dùng cùng `id` cố định để so sánh chuẩn xác).
7. Import `swisseph-wasm` trực tiếp trong bất kỳ file nào dưới `chart/domain/engine/` là **không thể** — verify bằng static check (grep/ESLint), không chỉ code review bằng mắt.
8. `includeOptionalPoints=[]` (mặc định) → `Chart.planets.length===10`; `includeOptionalPoints=['Chiron','Lilith','NorthNode','SouthNode']` → `Chart.planets.length===14`.
9. Đủ 2 `houseSystem` (`Placidus`, `WholeSign`) đều có test riêng, cả 2 nhánh `success`/`not_convergent` cho Placidus.
10. Toàn bộ 21 TR (Mục 31 Domain Spec) có test case tương ứng 1-1, pass.
11. `Angle[Descendant].longitude` luôn lệch đúng 180° (mod 360) so với `Angle[Ascendant].longitude` khi `isHouseDataAvailable=true` (self-check tự động trong test, không chỉ đọc code).
12. Aspect giữa 1 hành tinh chuẩn (Personal) và 1 optional point (ví dụ Sun–Chiron) dùng đúng orb `NonPersonal` (Decision M3-2) — test explicit so sánh với orb `NonPersonal` đã định nghĩa, không lẫn với orb `Personal`.
13. `timezoneId` không hợp lệ (không có trong IANA DB) → `time-conversion.ts` reject với `UnresolvableTimezoneError`, không throw lỗi runtime chung chung.

---

## 24. Implementation Sequence

1. **Đầu tiên:** T3.0 — verify `engineVersion` ở M2 (Decision M3-6, đã thực hiện, xác nhận chưa có) → tạo corrective task T3.10. Toàn bộ 7 Decision khác (Mục 20) đã CONFIRMED, không còn gì cần giải quyết trước khi code.
2. **Song song sau đó:** `chart-input.validator.ts`, time-conversion module, `house.calculator.ts`, `angle.calculator.ts`, `planet.calculator.ts`, `pattern.calculator.ts` (T3.1–T3.5, T3.7) — độc lập nhau, có thể chia cho nhiều lần code/review riêng biệt (dù dự án 1 developer, vẫn nên tách PR nhỏ theo đúng Rule 13 "small, reviewable tasks").
3. **Phải chờ Planet Calculator xong:** `aspect.calculator.ts` (T3.6).
4. **Phải hoàn tất trước khi viết test:** toàn bộ 5 Calculator + Validator (mỗi Calculator có Unit test riêng ngay sau khi code xong nó, không dồn hết về cuối).
5. **Phải hoàn tất trước M4:** `chart-builder.ts` hoạt động đúng end-to-end nội bộ Domain (M4 không phụ thuộc code M3, nhưng M6 — điểm hội tụ — cần `ChartBuilder` sẵn sàng; đặt M3 trước M4 trong trình tự Sprint chỉ vì lý do logic, không phải dependency code cứng, đúng như Sprint 3 Plan đã ghi "M4 không phụ thuộc M1-M3 về mặt code").
6. **Verify trước khi đóng M3:** chạy `npm run lint`/`typecheck`/`test` thật (không chỉ đọc code), xác nhận zero `swisseph-wasm` import trong `engine/`, xác nhận toàn bộ 21 TR có test pass thật.

---

## 25. Expected M3 Output / Handoff to M4

**M4 (BirthProfile Integration) không phụ thuộc code M3** (Sprint 3 Plan §14 xác nhận tường minh — M4 độc lập, thuộc module `birth-profile`, có thể làm song song). M3 output thực sự phục vụ **M6** (Application Layer):

Sau khi M3 hoàn thành, **M6 có thể giả định:**

> "Sau khi M3 hoàn thành, M6 có thể giả định rằng tồn tại một class `ChartBuilder` với constructor nhận `IEphemerisProvider` (đã có instance thật từ M2's composition-root) và một method `build(input: ChartBuilderInput): Promise<Chart>` (chữ ký CONFIRMED — Decision M3-4, Mục 7.2) trả về `Chart` Entity hoàn chỉnh, đã tự động xử lý đúng: (a) nhánh `isBirthTimeKnown`, (b) non-convergence Placidus như warning mềm, (c) `patterns` luôn rỗng, (d) toàn bộ INV-1 đến INV-16 liên quan đã được enforce ở tầng Entity trong quá trình `build()`. M6's `CreateNatalChartUseCase` chỉ cần: lấy `EngineInput` (từ `getBirthProfileSnapshotUseCase` của M4 hoặc `birthData` inline), sinh `id` (UUID), xác định `userId`/`birthProfileId` từ request đã authenticate, gọi `chartBuilder.build(...)`, rồi tùy `save` flag mà gọi `IChartRepository.save()` (M5) hoặc trả thẳng response — **không cần biết bất kỳ chi tiết tính toán chiêm tinh nào bên trong `ChartBuilder`**."

---

### M3 Summary

- **Sẽ được xây dựng:** 5 Calculator thuần túy (Planet/House/Angle/Aspect/Pattern-stub) + Validation Module + `time-conversion.ts` + `engine-version.constant.ts` (corrective task) + Chart Builder orchestrator — toàn bộ trong `chart/domain/engine/`, không I/O, test bằng fixture.
- **Sẽ KHÔNG được xây dựng:** thuật toán Pattern Detection thật (D-14 deferred), bất kỳ persistence/API/auth nào, Golden Test với dữ liệu thật (M8), `Point` category mới trong `PlanetCategory`.
- **Số lượng implementation task:** 10 task chính (T3.0–T3.10, xem Mục 18) — bổ sung T3.10 (corrective task `engineVersion`) so với bản nháp đầu tiên.
- **Trạng thái Decision:** toàn bộ 7 Decision (M3-1 đến M3-7, Mục 20) đã CONFIRMED qua `Confirmation.md` — không còn điểm nào chặn code.
- **1 việc còn treo, không chặn code M3:** Documentation Reconciliation Task cho Natal Chart Domain Spec §8 (mô tả `EngineInput` cần cập nhật khớp code thật — Decision M3-1).
- **1 Implementation Detail nhỏ chưa CONFIRMED chính thức, không chặn, nên xác nhận cùng lúc code T3.3:** giá trị `category` cụ thể gán cho 4 optional points trên `Planet` Entity (đề xuất `'Outer'`, xem Mục 8) — tách biệt hoàn toàn khỏi `OrbGroup` (đã CONFIRMED) nên không ảnh hưởng tính đúng của Aspect Calculator dù chọn giá trị nào.
- **M4 có thể giả định gì sau M3:** Không gì cả về mặt code (M4 độc lập hoàn toàn, chỉ thuộc `birth-profile` module) — nhưng về mặt lộ trình Sprint, M4 có thể bắt đầu song song ngay khi M3 đang code, không cần chờ.
- **M3 handoff tường minh cho M4:** Không có handoff trực tiếp (2 module độc lập) — handoff thật sự là cho **M6**, xem Mục 25.

---

### M3 → M4 Contract

> Không có hợp đồng code trực tiếp M3 → M4 — 2 milestone độc lập hoàn toàn về mặt kỹ thuật (Sprint 3 Backend Plan §14 xác nhận: *"M4 không phụ thuộc M1–M3 về mặt code... có thể làm song song"*). Trình tự M3 trước M4 trong roadmap chỉ phản ánh **thứ tự ưu tiên logic** (Engine là phần lõi nên làm trước), không phải một dependency bắt buộc. Hợp đồng thật sự quan trọng là **M3 → M6** (xem Mục 25).

---

## Final Quality Check (nội bộ, trước khi coi plan này hoàn tất)

- [x] Mọi M3 requirement bám nguồn tài liệu cụ thể hoặc đánh dấu rõ Decision đã CONFIRMED (Mục 20).
- [x] Không có tính năng M4+ nào lọt vào scope (Mục 3.2 xác nhận rõ).
- [x] Không trùng lặp trách nhiệm Adapter M2 (Mục 5.2 Responsibility Matrix, Mục 8 xác nhận SouthNode đã có sẵn từ M2, không tính lại).
- [x] Engine không phụ thuộc trực tiếp `swisseph-wasm` (Mục 5.3, Mục 22, Mục 23 điểm 7).
- [x] Domain không phụ thuộc infrastructure (Mục 5.3 bảng import).
- [x] Không có API implementation nào trong M3.
- [x] Không có Prisma implementation nào trong M3.
- [x] Unknown Birth Time behavior tường minh (Mục 12, anchor time CONFIRMED 12:00 — Decision M3-5).
- [x] Planet scope khớp đúng frozen spec (10 chuẩn + 4 optional, Mục 8).
- [x] House system scope khớp đúng frozen spec (Placidus, WholeSign — Mục 10).
- [x] Precision/tolerance policy tường minh (Mục 13) — tolerance Golden Test (0.01°) được ghi nhận thuộc M8, không lặp lại nhầm vào M3.
- [x] Error handling theo đúng convention có sẵn (Mục 14, dùng lại 6 class M1 đã có + đúng 2 class mới CONFIRMED — Decision M3-7).
- [x] Test hướng theo hành vi (21 TR), không phải coverage-padding (Mục 15, 16, 23).
- [x] Tôn trọng `eslint-plugin-boundaries` hiện có (Mục 5.3).
- [x] Không mở lại Decision đã Resolved (D-1 đến D-14 — plan này chỉ **tham chiếu**, không tạo lại tranh luận nào trong số đó; D-5 giữ nguyên theo Decision M3-2).
- [x] Không mở lại quyết định AGPL/Open-source (không nhắc tới trong toàn bộ plan).
- [x] Không mở rộng Domain Model (`PlanetCategory`) chỉ để giải quyết 1 calculation policy — `OrbGroup` giữ nội bộ Aspect Calculator (Decision M3-2).
- [x] M3 output đủ để M6 bắt đầu không cần đoán kiến trúc (Mục 25) — toàn bộ 7 Decision ở Mục 20 đã CONFIRMED, sẵn sàng code T3.0 trở đi.
