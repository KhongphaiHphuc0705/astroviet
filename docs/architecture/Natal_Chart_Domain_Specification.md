# Natal Chart Domain Specification
## AstroViet Platform — Backend Sprint 3: Natal Chart Module + Swiss Ephemeris Integration

---

## 1. Document Metadata

| | |
|---|---|
| **Loại tài liệu** | Domain Specification (Software Design Document) — cấp độ implementation-ready |
| **Phiên bản** | 1.0 |
| **Phạm vi** | Natal Chart MVP (Backend Sprint 3) |
| **Vị trí trong chuỗi tài liệu** | Kế thừa trực tiếp **Astrology Domain Specification** (domain model tổng quát, đã đóng băng) + **Astrology Engine Specification** (kiến trúc tính toán, đã đóng băng) + **Project Architecture Specification** (module/layer/folder backend, đã đóng băng) + **Database Design Specification** (schema `astrology.charts*`, đã đóng băng) + **REST API Specification** (endpoint/DTO `Chart`, đã đóng băng). Tài liệu này **không định nghĩa lại** bất kỳ entity/rule nào đã có trong 5 tài liệu trên — chỉ **tổng hợp, làm rõ ràng buộc chi tiết, và lấp khoảng trống** còn thiếu để Sprint 3 Implementation Plan có thể được viết mà không cần thêm quyết định domain |
| **Đối tượng đọc** | AI model hoặc developer sẽ viết Sprint 3 Implementation Plan |
| **Trạng thái** | **Phiên bản 1.1 — Confirmed.** Toàn bộ 14 Decision (Mục 35) và 2 Specification Conflict (Mục 36) đã được xác nhận chính thức. Đánh giá cuối: **READY** (Mục 37) — không còn "Decision Required" nào tồn đọng; chỉ còn 4 Task chuẩn bị/tài liệu hóa cần thực hiện trước hoặc song song Sprint 3 |

---

## 2. Purpose

Tài liệu này định nghĩa **đầy đủ, chính xác, và có thể triển khai được** domain model và business rules cho việc sinh ra một Natal Chart trong AstroViet — trả lời trọn vẹn 21 câu hỏi mà đề bài đặt ra (Mục 4 của prompt gốc), không để lại khoảng trống nào buộc developer phải tự phát minh hành vi domain khi code hóa.

Tài liệu **không phải** một cuốn sách giáo khoa chiêm tinh học — mọi mục chỉ trả lời "phần mềm phải đảm bảo hành vi chính xác nào", không trả lời "chiêm tinh học phương Tây có thể tính được những gì về mặt lý thuyết".

---

## 3. Scope

**Trong phạm vi (In Scope):**
- Natal Chart — loại chart duy nhất được tính toán trong Sprint 3.
- Tích hợp Swiss Ephemeris (`swisseph-wasm`) qua `IEphemerisProvider`.
- 10 hành tinh chuẩn + 4 điểm tùy chọn (Chiron, Lilith, North Node, South Node).
- 2 hệ thống nhà: Placidus, Whole Sign.
- 5 loại góc chiếu: Conjunction, Sextile, Square, Trine, Opposition.
- Xử lý "không rõ giờ sinh" (Unknown Birth Time).
- Chart Snapshot bất biến, lưu trữ, truy xuất, xóa mềm.
- Ranh giới Domain/Engine/Application/API cho module `Chart`.

**Ngoài phạm vi (Out of Scope)** — chi tiết đầy đủ ở Mục 34; tóm tắt: Synastry, Composite, Transit, Progression, Solar Return (chỉ định nghĩa extension point, không triển khai); AI Interpretation thật (chỉ định nghĩa boundary); Pattern detection thuật toán chi tiết (Pattern **entity** thuộc domain model kế thừa từ Domain Spec 5.12, nhưng thuật toán phát hiện cụ thể từng loại Pattern — Grand Trine, T-Square... — không nằm trong phạm vi bắt buộc phải hoàn thành ở Sprint 3, xem Quyết định D-14 Mục 35).

---

## 4. Authoritative Sources

Đã inspect trực tiếp toàn bộ 17 nguồn được đề bài yêu cầu tối thiểu. Danh sách đối chiếu:

| # | Tài liệu | Trạng thái | Mức độ dùng trong spec này |
|---|---|---|---|
| 1 | Product Requirements Document | Đã đọc đầy đủ | Cao — Mục 3, 34; phát hiện 1 xung đột (Mục 36 Conflict #1) |
| 2 | Astrology Domain Specification | Đã đọc đầy đủ (830 dòng) | **Cao nhất** — nguồn chính cho Mục 6–19, 24–26 |
| 3 | Astrology Engine Specification | Đã đọc đầy đủ (668 dòng) | **Cao nhất** — nguồn chính cho Mục 9, 22, 23, 33 |
| 4 | Database Design Specification | Đã đọc đầy đủ phần `astrology.charts*` (Mục 5.6–5.13) | Cao — nguồn chính cho Mục 20 (precision đã đóng băng ở schema), Mục 28 |
| 5 | REST API Specification | Đã đọc đầy đủ phần Chart (§4.4, §5.4, §5.8, §14.8–14.12) | Cao — nguồn chính cho Mục 29, xác nhận nhiều Open Question đã "✅ Quyết định cuối cùng" |
| 6 | Project Architecture Specification | Đã đọc đầy đủ (§3.3, §4, §5, §6, §8, §9, §12.1, §17) | Cao — nguồn chính cho Mục 5, 22 (interface `IEphemerisProvider` đã có chữ ký cụ thể), 27 |
| 7 | Backend Implementation Guide | Đã đọc | Trung bình — quy ước code chung, không có nội dung Chart-specific mới |
| 8 | Coding Standards & Conventions | Đã đọc | Trung bình — quy ước test/naming chung |
| 9 | Frontend UI Specification | Đã đọc (từ Sprint F1) | Thấp — không ảnh hưởng domain backend, chỉ xác nhận không có kỳ vọng UI nào mâu thuẫn |
| 10 | Frontend Architecture Specification | Đã đọc (từ Sprint F1) | Thấp — tương tự trên |
| 11 | Sprint 1 Implementation Plan | Đã đọc | Thấp — Identity, không liên quan Chart |
| 12 | Sprint 2 Implementation Plan | Đã đọc đầy đủ (456 dòng) | Cao — xác nhận trạng thái BirthProfile thật đã shipped; phát hiện 1 xung đột (Mục 36 Conflict #2) |
| 13 | Sprint 3 planning material nếu có | **Không tồn tại** — đã tìm kiếm toàn bộ `docs/implementation/`, chỉ thấy nhắc tới Sprint 3 trong Sprint 2 Plan dưới dạng ghi chú chuyển giao, không có kế hoạch riêng | — |
| 14 | Current source code cho BirthProfile | Đã đọc trực tiếp (`backend/src/modules/birth-profile/`) | Cao — xác nhận Entity/Value Object thật khớp 100% Domain Spec |
| 15 | Existing Prisma schema | Đã đọc trực tiếp (`backend/prisma/*.prisma`) | Cao — xác nhận `birth_profiles` đã migrate đúng DB Spec; xác nhận **chưa có** model `Chart` nào (Sprint 3 chưa bắt đầu) |
| 16 | Existing OpenAPI specification | Đối chiếu qua REST API Spec §13 (OpenAPI Mapping) | Trung bình |
| 17 | Existing test conventions | Đã đọc Project Architecture Spec §17 (Testing Strategy) | Trung bình — dùng cho Mục 31, 32 |

**Nguyên tắc áp dụng:** Không quyết định domain nào trong tài liệu này mâu thuẫn với 1 trong 5 tài liệu "Cao nhất"/"Cao" ở trên mà không được khai báo tường minh ở Mục 35/36.

---

## 5. Domain Boundary

Ranh giới đã được **đóng băng sẵn** ở Project Architecture Specification §3.3, §4, §8 — tài liệu này chỉ tổng hợp lại đúng nguyên trạng, không tự vẽ ranh giới mới.

### 5.1 Birth Profile (module `birth-profile`, đã hoàn thành Sprint 2)

Chịu trách nhiệm: `birthDate`, `birthTime`, `isBirthTimeKnown`, `placeName`, `latitude`, `longitude`, `historicalTimezoneId`. Đây là **input** cho Natal Chart, không phải một phần của Chart Domain.

**Điểm truy cập cross-module** (xem Conflict #2, Mục 36): Architecture Spec §3.2/§8 xác nhận điểm truy cập chính thức là `BirthProfileService.getSnapshotData(id): BirthDataSnapshot` — 1 Application Service method được export qua barrel `birth-profile/index.ts`. Chart module **không được** import `IBirthProfileRepository` hay bất kỳ Entity/Port nội bộ nào của `birth-profile/domain/`.

### 5.2 Natal Chart Domain (module `chart`, Sprint 3)

Chịu trách nhiệm: chart identity, chart type, calculation input (đã normalize), planetary positions, houses, angles, aspects, zodiac positions, calculation metadata, snapshot integrity. Sống tại `chart/domain/` (Entity + Value Object + Repository Port) và `chart/domain/engine/` (Astrology Engine — pure calculation, xem 5.3).

### 5.3 Astrology Engine (sống bên trong `chart/domain/engine/` và `chart/infrastructure/adapters/`)

**Không phải 1 module riêng ở cấp backend** — đây là 1 phần của Domain Layer (phần pure-calculation: Validation, Calculators, Chart Builder) + Infrastructure Layer (phần I/O: Swiss Adapter) của module `chart`, theo đúng bảng ánh xạ Architecture Spec §3.3.1:

| Engine Spec Module | Vị trí code | Layer |
|---|---|---|
| Validation | `chart/domain/engine/validation/` | Domain |
| Planet/House/Angle/Aspect/Pattern/Element/Modality Calculator | `chart/domain/engine/calculators/` | Domain (pure function) |
| Chart Builder | `chart/domain/engine/chart-builder.ts` | Domain (orchestrator, vẫn pure — chỉ gọi Calculator khác) |
| Swiss Adapter | `chart/infrastructure/adapters/swiss-ephemeris.adapter.ts` | Infrastructure (I/O thật) |
| Interpretation Engine | `chart/application/services/interpretation-lookup.service.ts` | Application (cần I/O — query DB) |

Chịu trách nhiệm: astronomical calculations, planetary longitude/latitude/speed, house cusps, Julian Day / UTC conversion nội bộ, mọi chi tiết đặc thù Swiss Ephemeris — **hoàn toàn bị che giấu** sau `IEphemerisProvider` (Mục 22).

### 5.4 Application Layer (`chart/application/`)

Chịu trách nhiệm: orchestrate BirthProfile → Chart calculation (`create-natal-chart.usecase.ts`), authorization (ownership check), use case (`get-chart`, `list-charts`, `delete-chart`), persistence (gọi `IChartRepository`), transaction boundary. Đây là nơi **duy nhất** quyết định có gọi House/Angle Calculator hay không dựa trên `isBirthTimeKnown` — không, chính xác hơn: quyết định đó nằm ở Chart Builder (Domain layer, Engine Spec §6.10), Application layer chỉ gọi `ChartBuilder.build()` và nhận kết quả đã đúng nhánh rẽ.

### 5.5 API Layer (`chart/presentation/`)

Chịu trách nhiệm: request validation (Zod, theo REST API Spec §6), response DTO (`ChartResponse` và các DTO con, REST API Spec §5.4), HTTP semantics (201/200/400/401/422), OpenAPI.

**Ràng buộc cứng (đã đóng băng, Architecture Spec §4):** Domain Layer (Entity, Value Object, Astrology Engine) **không được** import Express, Prisma, hay bất kỳ chi tiết `swisseph-wasm` nào. Toàn bộ dependency đi qua interface định nghĩa ở Domain, implement ở Infrastructure.

---

## 6. Aggregate Model

### 6.1 Aggregate Root

**`Chart`** — đã xác nhận nhất quán ở cả 3 tài liệu (Domain Spec §8 Glossary, Engine Spec §7 Design Decisions, Architecture Spec §3.3). Lý do (trích trực tiếp Engine Spec §7): *"Chart là điểm duy nhất mà mọi thành phần khác... có ý nghĩa trong ngữ cảnh của nó... đảm bảo tính toàn vẹn: mọi thao tác đọc/ghi dữ liệu chiêm tinh đều đi qua Chart."*

### 6.2 Entities (có identity riêng, vòng đời phụ thuộc Chart nhưng có `id` bảng riêng)

| Entity | Lý do là Entity (không phải VO) |
|---|---|
| `Planet` | Có `id` riêng (bảng `chart_planets`), cần truy vấn độc lập (ví dụ JOIN để lấy `house_number`), nhưng vòng đời hoàn toàn phụ thuộc `Chart` cha — không tồn tại độc lập ngoài 1 Chart |
| `House` | Tương tự — bảng `chart_houses` riêng, `Planet.house_number` composite-FK tới nó |
| `Angle` | Tương tự — bảng `chart_angles` riêng |
| `Aspect` | Tương tự — bảng `chart_aspects` riêng |
| `Pattern` | Tương tự — bảng `chart_patterns` + junction `chart_pattern_planets` |

**Vì sao không phải Value Object:** DB Design Spec đã xác nhận mỗi khái niệm trên có bảng riêng với `id` UUID riêng (không nhúng phẳng vào bảng `charts` như cách `BirthLocation` được nhúng phẳng vào `birth_profiles`, đối chiếu Sprint 2 Plan dòng 112) — đây là bằng chứng kiến trúc trực tiếp cho quyết định "Entity, không phải VO": có nhu cầu truy vấn/JOIN độc lập trong phạm vi 1 Chart.

### 6.3 Value Objects (không có identity riêng, so sánh bằng giá trị)

| Value Object | Lý do là VO |
|---|---|
| `ZodiacPosition` (tổ hợp `sign` + `degreeInSign`, luôn đi kèm 1 `longitude` tuyệt đối) | Không có `id`, không có bảng riêng — chỉ là 1 cách biểu diễn khác của `longitude` (xem Mục 12, Mục 21 — không cho phép nhiều representation cạnh tranh không lý do). Trong code, đây là 1 **computed value/formatter**, không phải trường lưu trữ độc lập |
| `HouseSystem` | Domain Spec liệt kê `HouseSystem` như Entity riêng (có `id`, bảng `house_systems`) — nhưng đó là ở cấp **ReferenceData module** (dữ liệu tĩnh dùng chung, seed 1 lần). Trong ngữ cảnh **1 Chart cụ thể**, `houseSystem` chỉ là 1 giá trị tham chiếu (string enum `'Placidus' \| 'WholeSign'`) được Chart lưu lại — không phải Entity con của Chart Aggregate |
| `ChartCalculationMetadata` (tổ hợp `calculatedAt`, `engineVersion`) | Không có `id` riêng, không có bảng riêng — là 2 cột phẳng trên chính bảng `charts` (DB Spec §5.7) |
| `Warning` | Không có `id`, không có bảng riêng — lưu dạng JSONB (`charts.warnings`, DB Spec §8) |

### 6.4 Domain Services

| Service | Vai trò |
|---|---|
| `ChartBuilder` | Domain Service điều phối toàn bộ pipeline nội bộ Engine (Engine Spec §6.10) — không phải Entity, không có state, chỉ có hành vi `build()` |
| Từng Calculator (`PlanetCalculator`, `HouseCalculator`, `AngleCalculator`, `AspectCalculator`, `PatternCalculator`, `ElementCalculator`, `ModalityCalculator`) | Domain Service pure-function, mỗi cái 1 trách nhiệm duy nhất (Engine Spec §6) |

### 6.5 Domain Policies

| Policy | Nội dung |
|---|---|
| Unknown Birth Time Policy | Quyết định có gọi House/Angle Calculator hay không (Mục 11) |
| Orb Policy | Bảng orb tối đa theo `aspectType` × loại hành tinh (Mục 18) |
| House System Fallback Policy | **Không tồn tại ở Domain layer** — khi Placidus không hội tụ, Engine trả `houses=[]` kèm warning; việc có tự động fallback sang Whole Sign hay không là quyết định ở tầng trên Domain (xem Mục 26, Decision D-3) |

### 6.6 Invariants

Xem bảng đầy đủ ở Mục 25.

**Không tự động biến mọi khái niệm thành Entity** — đã áp dụng nghiêm ngặt tiêu chí "có identity độc lập cần truy vấn được, có bảng riêng" làm ranh giới quyết định, đúng yêu cầu đề bài.

---

## 7. Domain Entities

Kế thừa nguyên trạng thuộc tính từ Domain Spec §5.3–5.4, §5.8, §5.10–5.12 (không nhắc lại toàn bộ bảng thuộc tính ở đây để tránh trùng lặp — tham chiếu trực tiếp). Bổ sung duy nhất so với Domain Spec: xác nhận rõ **thứ tự** khởi tạo trong 1 giao dịch Chart Builder:

```
Chart (rỗng, chưa gán con)
  → Planet[] (Planet Calculator)
  → House[] (House Calculator, nếu isBirthTimeKnown)
  → Angle[] (Angle Calculator, nếu isBirthTimeKnown)
  → gán Planet.house (sau khi có House[])
  → Aspect[] (Aspect Calculator, dựa trên Planet[])
  → Pattern[] (Pattern Calculator — DEFERRED ở Sprint 3, D-14: luôn trả `[]`, không gọi thuật toán detect thật)
  → Chart hoàn chỉnh (Chart Builder ráp toàn bộ)
```

Đây là thứ tự **bắt buộc** — `Aspect` không thể tính trước `Planet`, `Pattern` không thể tính trước `Aspect` (đã xác nhận Engine Spec §7: "Pattern derived hoàn toàn từ Aspect").

**Xác nhận riêng:** `Planet.house` (gán House nào Planet rơi vào) là bước **sau** khi có `House[]` — Domain Spec không nêu rõ bước này thuộc Calculator nào; xác định đây là trách nhiệm của **Chart Builder** (không phải `PlanetCalculator` — `PlanetCalculator` chạy trước `HouseCalculator` theo đúng thứ tự Pipeline Engine Spec §5, nên không thể tự biết House nào tại thời điểm nó chạy).

---

## 8. Value Objects

| Value Object | Thuộc tính | Ghi chú |
|---|---|---|
| `ZodiacPosition` | `longitude: number (0–360)`, `sign: ZodiacSignName (enum 12 giá trị)`, `degreeInSign: number (0–30)` | Derived hoàn toàn từ `longitude` — `sign`/`degreeInSign` **không bao giờ** được lưu độc lập mà có thể lệch khỏi `longitude` (Mục 21) |
| `EngineInput` (canonical calculation input, Mục 9) | `utcDateTime: Date`, `coordinates: {latitude, longitude}`, `houseSystem`, `includeOptionalPoints[]` | Đây là input **vào Engine**, khác `BirthData` (input **vào Application layer**, còn ở local time) |
| `RawEphemerisData` | `planets: Array<{name, longitude, latitude, speed}>` | Đã đóng băng chữ ký ở Architecture Spec §12.1 — dành riêng cho dữ liệu hành tinh; house/angle data đi qua `RawHouseData` riêng (D-1 CONFIRMED, Mục 22.1) |
| `RawHouseData` (mới, D-1 CONFIRMED) | `cusps: number[12]`, `ascendant: number`, `midheaven: number` | Output của `IEphemerisProvider.calculateHouses()` — nguồn dữ liệu cho House Calculator (12 cusp) và Angle Calculator (Ascendant/Midheaven trực tiếp; Descendant/Imum Coeli tính từ `+180°`, Mục 17, 22.1) |
| `Warning` | `code: string`, `message: string`, `severity: 'info'\|'warning'`, `field?: string`, `details?: object` | Đã đóng băng 100% ở REST API Spec §5.8/§14.12 — dùng chung cho `HOUSE_SYSTEM_NOT_CONVERGING` và `HISTORICAL_DATE` |

---

## 9. Calculation Input

### 9.1 Nguồn dữ liệu

| Giá trị | Nguồn | user-provided / derived |
|---|---|---|
| `birthDate`, `birthTime`, `isBirthTimeKnown` | `BirthProfile.getSnapshotData()` HOẶC `birthData` inline trong request (REST API Spec §5.4 — `birthProfileId` XOR `birthData`) | user-provided |
| `latitude`, `longitude` | như trên | user-provided (đã geocode ở tầng ứng dụng trước đó — Location module) |
| `historicalTimezoneId` | như trên | user-provided (đã resolve ở tầng ứng dụng — Location module, REST API Spec §14.10) |
| `houseSystem` | Request (`CreateNatalChartRequest.houseSystem`) | user-provided, bắt buộc |
| `includeOptionalPoints` | Request | user-provided, optional, mặc định rỗng |
| `utcDateTime` | **Derived** — tính từ `birthDate` + `birthTime` + `historicalTimezoneId` (Mục 10) | derived |
| Vị trí hành tinh thô | **Calculated** — từ Swiss Ephemeris | calculated |
| `sign`, `degreeInSign` | **Derived** — từ `longitude` (Mục 21) | derived |
| `isRetrograde` | **Derived** — từ `speed < 0` (Mục 14) | derived |

### 9.2 Canonical representation truyền vào Engine

Đã đóng băng ở Architecture Spec §12.1 — `EphemerisRequest { utcDateTime: Date; coordinates: { latitude: number; longitude: number } }`. Đây chính là phần "input thô" của `EngineInput` (Engine Spec §4.1) — `EngineInput` đầy đủ hơn, gồm thêm `chartOptions` (`houseSystem`, `includeOptionalPoints`, `chartType`).

**Không trùng lặp dữ liệu:** `EngineInput.birthData` **là chính** `BirthDataSnapshot` lấy từ BirthProfile (hoặc `birthData` inline) — Application layer không tạo bản sao thứ 2 nào khác ngoài việc convert local time → UTC (Mục 10).

---

## 10. Time/Timezone Rules

### 10.1 Chuỗi quy đổi

```
Local Birth Time (birthDate + birthTime, dạng "wall clock" tại nơi sinh)
  → Timezone (historicalTimezoneId — IANA string, ví dụ "Asia/Ho_Chi_Minh")
  → UTC (Universal Time — Timezone Resolver, Engine Spec §6, module Timezone Resolver)
  → astronomical calculation time (chính là UTC, dùng thẳng cho Swiss Ephemeris — không có bước quy đổi thứ 3)
```

Đây là quy trình **đã đóng băng nguyên trạng** ở Engine Spec §3.3 bước [3] và Domain Spec §5.1 Business Rule ("Thời điểm sinh phải được quy đổi về UT trước khi tính toán"). Tài liệu này không phát minh thêm bước nào.

### 10.2 DST (Daylight Saving Time)

**Không cần xử lý đặc biệt ở tầng Chart Domain.** IANA Timezone Database (dùng bởi Timezone Resolver, Engine Spec §3.2) tự chứa đầy đủ lịch sử DST cho mọi múi giờ — quy đổi 1 "wall clock time" + 1 IANA zone ID → UTC là bài toán **đã giải quyết hoàn toàn** ở tầng thư viện (ví dụ `Intl`/`date-fns-tz`/`luxon` — công cụ cụ thể là quyết định Implementation Plan, không phải quyết định domain). Domain chỉ cần đảm bảo: **luôn dùng `historicalTimezoneId` đã lưu tại BirthProfile** (chính xác lịch sử tại thời điểm/địa điểm sinh), không dùng timezone hiện tại của địa danh đó.

### 10.3 Timezone offset

Không lưu offset cố định (ví dụ "+07:00") — đã đóng băng ở Domain Spec §5.1 ("không dùng offset cố định... vì không phản ánh đúng lịch sử thay đổi múi giờ"). Việt Nam đã đổi múi giờ trong lịch sử (ví dụ giai đoạn dùng UTC+8), đây chính là lý do bắt buộc dùng IANA zone ID thay vì offset.

### 10.4 Midnight / date boundaries

Không có xử lý đặc biệt — `birthTime = "00:00:00"` là giá trị hợp lệ bình thường trong khoảng `[00:00:00, 23:59:59]` (Domain Spec §5.1 Validation Rule, đã implement ở `BirthTime` VO thật — xác nhận trực tiếp từ code: `hour ∈ [0,23]`). Quy đổi qua UTC có thể đẩy ngày sang trước/sau — đây là hành vi tự nhiên của phép quy đổi timezone, không cần business rule riêng.

### 10.5 Invalid dates / invalid times

Đã validate **trước khi** vào Chart Domain — ở tầng `BirthProfile`/`BirthDate`/`BirthTime` Value Object (Sprint 2, đã implement, đã xác nhận qua code: `BirthTime.create()` throw `InvalidBirthTimeError` nếu sai format/range). Engine Validation Module (Engine Spec §6.1) **tái xác nhận** cùng rule này ở input boundary của chính nó (không tin tưởng mù quáng dữ liệu từ module khác dù đã validate trước đó — đúng nguyên tắc Defense in Depth đã ngầm định trong Architecture Spec §10 Validation Strategy, dù không nói thẳng cho trường hợp cross-module).

### 10.6 Timezone ambiguity

**Không áp dụng ở MVP** — trường hợp "ambiguous local time" (1 thời điểm wall-clock xảy ra 2 lần do DST fall-back, ví dụ 1:30 AM xảy ra 2 lần) là edge case cực hiếm và không được bất kỳ tài liệu nào trong 5 tài liệu nguồn đề cập. Không phát minh xử lý riêng — nếu thư viện timezone được chọn ở Implementation Plan trả về giá trị mặc định cho trường hợp này (thường là occurrence đầu tiên), chấp nhận hành vi mặc định đó, không cần business rule domain riêng.

### 10.7 Biên dưới `birthDate`

Đã đóng băng ở REST API Spec §14.11: **không có biên dưới cứng**, chỉ cần `birthDate < ngày hiện tại`. Ngày quá xa quá khứ → warning `HISTORICAL_DATE` (severity `info`), không chặn request.

---

## 11. Unknown Birth Time

### 11.1 Hành vi khi `isBirthTimeKnown = false`

Đã đóng băng **thống nhất** ở Domain Spec §6, Engine Spec §4.4/§5, REST API Spec §4.4/§5.4:

| Thành phần | Hành vi |
|---|---|
| Chart có được tạo không? | **Có** — không fail, không throw |
| Planet | Tính đầy đủ, chính xác cho hầu hết hành tinh; **Mặt Trăng** có thể sai lệch nhẹ (di chuyển ~13°/ngày) — **D-2: DEFERRED**, không thêm `code` cảnh báo riêng (`MOON_SIGN_UNCERTAIN` hay tương đương) vào Sprint 3 — Mặt Trăng vẫn tính và trả về bình thường như mọi Planet khác, không có warning kèm theo ở MVP |
| House | **Không tính** — trả `houses = []` |
| Angle (ASC/MC/DSC/IC) | **Không tính** — trả `angles = []` |
| Aspect | Tính đầy đủ, bình thường (chỉ phụ thuộc vị trí Planet, không phụ thuộc House/Angle) |
| `isHouseDataAvailable` | `false` |
| Interpretation cấp Planet-in-House / Angle | Không sinh (Engine Spec §6.11) |
| Interpretation cấp Planet-in-Sign | Vẫn sinh bình thường |

### 11.2 KHÔNG gán giờ mặc định — ĐÃ CHỐT (Conflict #1: RESOLVED theo Document B)

**Đây là nguyên tắc đã đóng băng rõ ràng nhất trong toàn bộ chuỗi tài liệu** (Domain Spec §5.1: *"hệ thống không được tự ý gán giờ mặc định (ví dụ 12:00) rồi tính như thể đó là giờ thật"*; xác nhận lại ở REST API Spec §4.4: *"API không được tự chế dữ liệu House/Angle khi Engine trả rỗng"*; xác nhận lại lần thứ 3 ở Sprint 2 Implementation Plan dòng 168, mô tả hành vi **đã shipped**: *"không gán giờ mặc định (12:00 hay bất kỳ giá trị nào) ở tầng lưu trữ"*).

**Đã xác nhận chính thức:** khi `isBirthTimeKnown = false` → không tạo giờ mặc định → tính Planet → tính Aspect → `houses = []` → `angles = []` → `isHouseDataAvailable = false`. Không thêm giờ "12:00" giả vào snapshot dưới bất kỳ hình thức nào (Mục 36 Conflict #1 — RESOLVED, xem Documentation Reconciliation Task đi kèm).

**Documentation Reconciliation Task (bắt buộc thực hiện song song với Sprint 3, không phải sau):** PRD FR-02 hiện mô tả sai hành vi thật (mặc định 12:00 trưa) — cần cập nhật lại nguyên văn PRD trước hoặc cùng lúc Sprint 3 đóng, tránh để PRD tiếp tục mô tả sai lệch với implementation. Nội dung thay thế đề xuất cho FR-02:

> *"Nếu người dùng không có giờ sinh chính xác: hệ thống vẫn tính vị trí hành tinh (Planet) và góc chiếu (Aspect) như bình thường; hệ thống **không tính** Nhà (Houses) và các Góc trục (Ascendant/Midheaven/Descendant/Imum Coeli) — các trường này trả về rỗng, kèm cờ `isHouseDataAvailable = false` để giao diện hiển thị rõ ràng phần dữ liệu không khả dụng. Hệ thống **không** giả định giờ sinh mặc định (ví dụ 12:00 trưa) dưới bất kỳ hình thức nào."*

Task này thuộc phạm vi tài liệu hóa (cập nhật PRD), không phải code — nhưng phải hoàn thành trước khi Sprint 3 được coi là đóng, để tránh 2 tài liệu tiếp tục mâu thuẫn nhau vĩnh viễn.

### 11.3 Chart trả về đầy đủ hay partial?

**Không phải "partial chart" theo nghĩa lỗi/thiếu** — đây là 1 Chart **hợp lệ hoàn chỉnh** với `isHouseDataAvailable = false` là 1 trạng thái dữ liệu chính đáng, không phải trạng thái lỗi. Validation Rule đã đóng băng (Domain Spec §7): *"Nếu có Houses thì phải đủ 12; nếu có Angles thì phải đủ 4"* — nghĩa là **"có hoặc không có gì cả"**, không có trạng thái "có 1 phần Houses".

### 11.4 Không thêm birth-time-precision level mới

Domain hiện chỉ có `isBirthTimeKnown: boolean` (nhị phân) — **không** thêm các mức độ trung gian như "biết khoảng thời gian (buổi sáng/chiều/tối)" dù Domain Spec §5.1 Business Rule có nhắc tới khả năng này như 1 **quyết định UX tương lai** ("sản phẩm quyết định có cho phép nhập khoảng thời gian ước lượng hay không — đây là quyết định UX, không phải quy luật chiêm tinh"). Đúng yêu cầu đề bài: không tự thêm precision level nào ngoài những gì đã đóng băng trong Domain Spec.

---

## 12. Zodiac Model

Đã đóng băng 100% ở Domain Spec §5.5 + Appendix 9.1. Tóm tắt áp dụng cho Sprint 3:

- **Hệ:** Tropical Zodiac (không phải Sidereal) — cố định cho MVP.
- **12 Sign**, mỗi Sign chiếm đúng 30°, `startDegree` là bội số của 30 (0, 30, 60...330), phủ kín 360° không chồng lấn.
- **0° Aries reference:** `longitude = 0` ⟺ điểm Xuân phân (Vernal Equinox) ⟺ đầu Sign Aries.

**Canonical representation** (trả lời trực tiếp yêu cầu đề bài — "absolute longitude + sign + degree + minute + second"):

> **Quyết định:** Domain **chỉ** lưu `longitude` (absolute, decimal degree, ví dụ `135.42`) + `sign` (derived) + `degreeInSign` (derived, decimal degree trong `[0,30)`, ví dụ `15.42`). **Không** lưu riêng `minute`/`second` như 2 field tách biệt — đây chỉ là cách hiển thị (`15°25'12"`) được tính từ `degreeInSign` dạng decimal ở tầng **Presentation/Frontend**, không phải trường dữ liệu domain riêng. Lý do: giữ đúng nguyên tắc Mục 20/21 (không nhân bản representation không có lý do) và khớp chính xác với `PlanetResponse.degreeInSign: decimal` đã đóng băng ở REST API Spec §5.4 (kiểu `decimal`, không phải object `{degree, minute, second}`).

---

## 13. Planet Model

### 13.1 MVP planetary set — đã đóng băng đầy đủ

| Nhóm | Danh sách | Trạng thái |
|---|---|---|
| 10 hành tinh chuẩn | Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto | Luôn tính, luôn bắt buộc (Domain Spec §5.3 Validation: "Chart phải có tối thiểu 10 hành tinh chuẩn") |
| Điểm tùy chọn | Chiron, Lilith, NorthNode, SouthNode | **Đã đóng băng là optional, không phải "chưa quyết định"** — REST API Spec `CreateNatalChartRequest.includeOptionalPoints` liệt kê rõ cả 4, mặc định rỗng nếu không chỉ định. Không cần Decision Required cho phạm vi 4 điểm này — đã đủ rõ |

**Xác nhận:** Đề bài yêu cầu "đánh giá Lilith/North Node/South Node có tồn tại trong spec hiện có không" — câu trả lời: **Có**, cả 3 đã được liệt kê tường minh trong enum 14 giá trị của `Planet.name` (Domain Spec §5.4) và CHECK constraint DB (`chart_planets.name` — "danh sách 14 giá trị"), cùng nhóm `Points (optional)` với Chiron (Domain Spec Appendix 9.3).

### 13.2 Attributes per Planet — snapshot vs. engine-internal

| Field | Vào snapshot (Chart)? | Nguồn |
|---|---|---|
| `name`, `category` | Có | Domain Spec §5.4 |
| `longitude` | Có | Calculated |
| `latitude` | Có (nullable — "dùng cho tính toán nâng cao") | Domain Spec §5.4 |
| `speed` | Có | Bắt buộc — nguồn của `isRetrograde` |
| `isRetrograde` | Có (derived, lưu lại để không phải tính lại mỗi lần đọc) | Derived |
| `sign`, `degreeInSign` | Có | Derived |
| `house` (số nhà) | Có (nullable) | Derived — chỉ có nếu `isHouseDataAvailable=true` |
| Julian Day nội bộ | **Không** vào snapshot — engine-internal, chỉ tồn tại tạm thời trong quá trình gọi Swiss Adapter |
| Raw ephemeris intermediate values (ví dụ declination, right ascension nếu Swiss Ephemeris trả thêm) | **Không** vào snapshot trừ khi Domain Spec/DB Spec liệt kê tường minh — DB Spec chỉ có `longitude`, `latitude`, `speed` cho `chart_planets` (§5.8), không có cột nào khác |

---

## 14. Retrograde Rules

Đã đóng băng hoàn toàn, đơn giản, không có trạng thái trung gian:

```
isRetrograde = (speed < 0)
```

- **Không có ngưỡng (threshold)** — chỉ là so sánh dấu, không phải `|speed| > x`.
- **Không có trạng thái "stationary"** — Domain Spec/Engine Spec không yêu cầu phân biệt "stationary direct"/"stationary retrograde" ở MVP; đúng nguyên tắc "không over-engineer" của đề bài, **không thêm** trạng thái này.
- **Bất biến bắt buộc:** Sun và Moon **không bao giờ** `isRetrograde = true` (quan sát từ Trái Đất) — Engine Spec §6.3 yêu cầu đây phải là 1 **assertion bắt buộc**, nếu vi phạm thì đây là `DataIntegrityError` (lỗi dữ liệu nghiêm trọng, không phải hành vi thiên văn hợp lệ). DB Design Spec đã enforce thêm 1 lớp CHECK constraint: `CHECK (name NOT IN ('Sun','Moon') OR is_retrograde = false)`.

---

## 15. House Systems

### 15.1 HouseSystem enum

`Placidus`, `WholeSign` — đóng danh sách (closed enum), đã đóng băng ở Domain Spec §5.9 và DB Spec.

### 15.2 12 houses, house numbering, cusp, ASC/MC/IC/DSC

Xem Mục 16 (House Model), Mục 17 (Chart Angles).

### 15.3 Placidus — domain-contract level

**Không tái tạo chi tiết thuật toán Swiss Ephemeris** (đúng yêu cầu đề bài). Domain-contract chỉ cần biết:
- Input: UTC DateTime + coordinates.
- Output: 12 cusp longitude.
- **Ràng buộc đã biết:** không hội tụ ở vĩ độ ≥ 66.5° (Domain Spec §5.9, Engine Spec §8.2) — đây là giới hạn toán học của chính thuật toán Placidus, không phải lỗi implementation.
- Khi không hội tụ: trả **kết quả hợp lệ có cảnh báo** (`houses=[]`, `warning: HOUSE_SYSTEM_NOT_CONVERGING`), **không throw exception chặn toàn bộ request** (đã đóng băng ở Architecture Spec §9.2 — đây là "lỗi mềm", xử lý bằng `warnings[]`, không phải cơ chế exception).
- **D-3: CONFIRMED — NO AUTOMATIC FALLBACK.** Hệ thống **không** tự động chuyển sang Whole Sign khi Placidus không hội tụ — chỉ trả `houses=[]` + warning, để user tự chọn lại `houseSystem` nếu muốn (đúng khuyến nghị ở bản draft, nay đã chốt chính thức).

### 15.4 Whole Sign — derivation rule

Đã đóng băng: mỗi House = trọn 1 Sign. Cụ thể: House 1 bắt đầu tại `floor(Ascendant.longitude / 30) * 30` (điểm bắt đầu của Sign chứa Ascendant), House 2 = Sign kế tiếp, v.v. — 12 House Whole Sign = 12 Sign theo đúng thứ tự bắt đầu từ Sign chứa Ascendant. **Vẫn cần Ascendant** để xác định House nào là House 1 — do đó Whole Sign **vẫn cần giờ sinh chính xác** giống Placidus (không phải "không cần giờ sinh" như đôi khi bị hiểu nhầm trong chiêm tinh phổ thông — xác nhận qua Domain Spec §5.9: `requiresPreciseBirthTime = true` cho **cả 2** hệ thống, chỉ khác ở `supportsPolarLatitudes`).

### 15.5 Khi không rõ giờ sinh

**Cả 2 hệ thống đều không tính được** — vì cả 2 đều cần Ascendant (từ giờ sinh chính xác) làm điểm neo. Đây là lý do Mục 11 quy định House **luôn** rỗng khi `isBirthTimeKnown=false`, không phân biệt theo `houseSystem` đã chọn.

---

## 16. House Model

Kế thừa Domain Spec §5.8. Xác nhận các điểm đề bài yêu cầu làm rõ:

- **House 1 cusp = Ascendant?** Đúng — về mặt toán học, `House[1].cuspDegree === Angle[Ascendant].longitude` cho cả Placidus lẫn Whole Sign. Đây là hệ quả tự nhiên của định nghĩa (House 1 luôn bắt đầu tại Ascendant), **không phải** 2 nguồn dữ liệu độc lập cần đồng bộ thủ công — cả `House[1].cuspDegree` và `Angle[Ascendant].longitude` nên cùng lấy từ **1 giá trị tính toán duy nhất** trong Angle Calculator, House Calculator chỉ tham chiếu lại giá trị đó cho House 1 (tránh 2 nguồn sự thật, đúng nguyên tắc Mục 17).
- **Whole Sign lưu cusp longitude tính toán được, không phải chỉ lưu Sign suông** — đã xác nhận qua DB Spec: `chart_houses.cusp_degree` là `NUMERIC(6,3)` bắt buộc (`NOT NULL`) cho mọi House bất kể `houseSystem` — Whole Sign vẫn phải điền giá trị `cusp_degree` cụ thể (chính là `startDegree` của Sign chứa nó), không để trống/không dùng giá trị đại diện khác.
- **Cusp precision:** normalized theo đúng quy tắc chung (Mục 20) — `NUMERIC(6,3)`, 3 chữ số thập phân.

---

## 17. Chart Angles

Kế thừa Domain Spec §5.10. Xác nhận:

- **Angles là giá trị tính toán độc lập, không phải alias thuần của House cusp** — về ý nghĩa domain, `Angle` (Ascendant/Midheaven/Descendant/ImumCoeli) là 1 khái niệm riêng (4 điểm trục cố định theo chiêm tinh học), trùng giá trị số với `House[1]`/`House[10]` cusp (Placidus) hoặc gần trùng (Whole Sign — MC không nhất thiết trùng House 10 cusp ở Whole Sign, vì Whole Sign House 10 = Sign chứa MC nhưng cusp House 10 = điểm bắt đầu Sign đó, khác giá trị chính xác của MC thật). Do đó **Angle luôn được lưu như 1 bảng riêng** (`chart_angles`), không suy ra runtime từ House.
- **Không trùng lặp nguồn sự thật ở Placidus:** dù `House[1].cuspDegree === Angle[Ascendant].longitude` về mặt giá trị (Mục 16), cả 2 vẫn là 2 hàng dữ liệu vật lý riêng (đã đóng băng ở DB Spec §5.9/§5.10 — 2 bảng riêng) — nhưng **được tính 1 lần duy nhất** (bởi Angle Calculator) rồi House Calculator tham chiếu lại, tránh 2 lần gọi Swiss Ephemeris cho cùng 1 giá trị.
- **Ràng buộc toán học bắt buộc:** `DSC = ASC + 180° (mod 360)`, `IC = MC + 180° (mod 360)` — self-check bắt buộc ở Angle Calculator (Engine Spec §6.5). **D-4: CONFIRMED — Domain self-check only** — không dùng DB CONSTRAINT TRIGGER; Angle Calculator là đường ghi duy nhất vào bảng `chart_angles`, không có insert thủ công nào khác, nên self-check ở Domain là đủ, không cần lớp phòng thủ dư thừa ở DB.

---

## 18. Aspect Model

### 18.1 5 loại góc — đã đóng băng

Conjunction (0°), Sextile (60°), Square (90°), Trine (120°), Opposition (180°).

### 18.2 Orb Policy

**Định dạng đã đóng băng: 2 chiều** (aspect-specific × planet-category-specific), theo Engine Spec §6.6: *"orb phải ≤ giá trị tối đa cho phép theo aspectType và loại hành tinh (cá nhân vs ngoài)"*.

**Giá trị cụ thể — đã có sẵn, khuyến nghị bởi domain expert** (Domain Spec Appendix 9.4, đóng vai trò tham số cấu hình engine, không phải "chưa quyết định"):

| Aspect | Góc lý tưởng | Orb — hành tinh cá nhân | Orb — hành tinh ngoài |
|---|---|---|---|
| Conjunction | 0° | ±8° | ±6° |
| Sextile | 60° | ±4° | ±3° |
| Square | 90° | ±7° | ±5° |
| Trine | 120° | ±7° | ±5° |
| Opposition | 180° | ±8° | ±6° |

**Định nghĩa "hành tinh cá nhân" vs "hành tinh ngoài"** (Domain Spec Appendix 9.3): Personal = Sun, Moon, Mercury, Venus, Mars; Social = Jupiter, Saturn; Outer = Uranus, Neptune, Pluto. **D-5: CONFIRMED** — nhóm `Social` (Jupiter, Saturn) gộp vào cột "ngoài" (dùng orb hẹp hơn: ±6° Conjunction/Opposition, ±3° Sextile, ±5° Square/Trine) — chính thức, không còn là khuyến nghị chờ xác nhận.

**Không configurable theo user ở MVP** (đúng Mục 34 Out of Scope — "configurable user-defined orbs" bị loại trừ tường minh) — nhưng kiến trúc Engine đã chừa sẵn chỗ (`OrbConfiguration` như tham số đầu vào của `AspectCalculator`, Engine Spec §6.6 Future Extension) — với MVP, `OrbConfiguration` được khởi tạo 1 lần từ bảng cố định trên, không đọc từ user input hay DB.

### 18.3 Applying/Separating — ĐÃ CHỐT (D-6: CONFIRMED, công thức wrap-aware)

`isApplying` — dựa trên `speed` của 2 hành tinh (Domain Spec §5.11). Công thức chính thức, deterministic, wrap-aware (bắt buộc dùng đúng cách tính khoảng cách góc có wraparound ở Mục 19.1, không dùng hiệu số thô):

```
separation(t)      = angular_separation(longitude_A(t), longitude_B(t))       // công thức Mục 19.1, luôn ∈ [0°,180°]
longitude_A(t+Δt)  = longitude_A(t) + speed_A · Δt      // Δt nhỏ, cố định (ví dụ 1 giờ, hoặc dùng đạo hàm tức thời tương đương)
longitude_B(t+Δt)  = longitude_B(t) + speed_B · Δt
separation(t+Δt)    = angular_separation(longitude_A(t+Δt), longitude_B(t+Δt))  // dùng lại đúng công thức wrap-aware Mục 19.1

if separation(t+Δt) < separation(t):  isApplying = true    // khoảng cách đang thu hẹp → applying
if separation(t+Δt) > separation(t):  isApplying = false   // khoảng cách đang nới rộng → separating
if separation(t+Δt) == separation(t): isApplying = false    // biên bằng nhau (hiếm, tốc độ bằng nhau) — coi là separating, không applying
```

**Ràng buộc bắt buộc khi implement (đúng yêu cầu xác nhận):** `angular_separation()` dùng trong `separation(t+Δt)` **phải** là hàm wrap-aware giống hệt Mục 19.1 (`min(raw, 360-raw)`) — không được dùng hiệu số thô `longitude_A(t+Δt) - longitude_B(t+Δt)` trực tiếp, nếu không kết quả sẽ sai tại các cặp hành tinh gần ranh giới 0°/360°. Δt là hằng số cố định (không phụ thuộc input), chọn đủ nhỏ để xấp xỉ đạo hàm tức thời chính xác (ví dụ 1 giờ) — giá trị Δt cụ thể là chi tiết implementation, ghi rõ trong Sprint 3 Implementation Plan, không ảnh hưởng tính đúng đắn của công thức miễn Δt đủ nhỏ so với tốc độ hành tinh chậm nhất trong 5 aspect MVP.

### 18.4 Aspect type = enum, không phải Entity riêng cho mỗi instance

`aspectType` là 1 field enum trên `Aspect` entity, không phải bảng riêng — đã đóng băng, không cần làm rõ thêm.

### 18.5 Duplicate prevention & Sun-Moon = Moon-Sun

**Đã đóng băng hoàn toàn ở DB Spec §5.11:**
- `planetA ≠ planetB`.
- **Canonical ordering bắt buộc:** `planetA < planetB` theo thứ tự alphabet (CHECK constraint DB + trách nhiệm Application/Engine phải sắp xếp trước khi insert) — nghĩa là `Aspect(Moon, Sun)` **không được phép tồn tại** như 1 hàng riêng biệt với `Aspect(Sun, Moon)`; Aspect Calculator phải luôn sắp `planetA`/`planetB` theo alphabet trước khi tạo object.
- `UNIQUE(chartId, planetA, planetB)` — kết hợp 2 rule trên đảm bảo không trùng cặp.

### 18.6 0°/360° wraparound

Xem công thức chi tiết Mục 19.

---

## 19. Aspect Calculation

### 19.1 Công thức xác định (đề bài yêu cầu "make the rule deterministic")

```
raw_separation = |longitude_A − longitude_B|
angular_separation = min(raw_separation, 360 − raw_separation)     // luôn ∈ [0°, 180°]

for each aspectType in [Conjunction(0°), Sextile(60°), Square(90°), Trine(120°), Opposition(180°)]:
    idealAngle = giá trị lý tưởng của aspectType
    orb = |angular_separation − idealAngle|
    maxOrbAllowed = tra bảng orb (Mục 18.2) theo (aspectType, category của planetA/planetB)
    if orb ≤ maxOrbAllowed:
        → tồn tại Aspect(planetA, planetB, aspectType, exactAngle=angular_separation, orb)
```

**Xử lý xung đột nhiều aspectType cùng thỏa mãn:** về mặt toán học không thể xảy ra — 5 giá trị lý tưởng (0°, 60°, 90°, 120°, 180°) cách nhau tối thiểu 30°, trong khi orb tối đa lớn nhất là ±8° — không có `angular_separation` nào rơi vào orb hợp lệ của 2 aspectType cùng lúc (khoảng cách giữa 2 idealAngle gần nhau nhất là 30°, lớn hơn tổng 2 orb tối đa 8+8=16°). Không cần rule "ưu tiên aspect nào" — không xảy ra trên thực tế.

**Ví dụ đúng theo đề bài:**
```
separation = 90°, orb = 0° → exact Square (idealAngle=90°, orb=|90-90|=0 ≤ 7°)
separation = 92°, orb = 3° → Square (idealAngle=90°, orb=|92-90|=2 ≤ 7° — ví dụ đề bài ghi "orb=3°" nghĩa là orb cho phép, không phải orb thực tế tính ra; orb thực tế tính ra ở trường hợp này = 2°)
```

**planetA/planetB trong công thức trên** đã là kết quả sau canonical ordering (Mục 18.5) — công thức tính `angular_separation` không phụ thuộc thứ tự (dùng `abs`), nhưng **object `Aspect` tạo ra sau đó** phải gán đúng `planetA`/`planetB` theo alphabet.

### 19.2 Aspect giữa Planet và Angle?

**Không nằm trong MVP** — Domain Spec §5.11 chỉ định nghĩa Aspect giữa 2 Planet (`planetA: Planet, planetB: Planet`), không đề cập Aspect Planet-Angle (ví dụ "Venus trine Ascendant" — 1 khái niệm phổ biến trong chiêm tinh thực hành nhưng **không** có trong domain model đã đóng băng). Không tự thêm — nếu cần trong tương lai, đây là extension point rõ ràng (thêm overload `AspectCalculator` nhận `Angle[]`), không phải sửa lại core.

---

## 20. Precision / Rounding

**Đã đóng băng hoàn toàn ở tầng persistence** (Database Design Specification §5.7–5.11) — tài liệu này không tự quyết định số mới, chỉ tổng hợp lại và xác nhận nguyên tắc "không làm tròn quá sớm" (đề bài yêu cầu) được tôn trọng đúng ở từng tầng.

| Giá trị | Internal (trong Engine, trước khi persist) | Snapshot (DB) | API response | Display (Frontend) |
|---|---|---|---|---|
| `longitude` (Planet/Angle) | `float64` (double precision — chuẩn IEEE-754, không làm tròn trong lúc tính toán nội bộ Engine) | `NUMERIC(6,3)` — 3 chữ số thập phân | `decimal` (JSON number, giữ nguyên giá trị DB) | Frontend tự format (ví dụ `15°25'`) — ngoài phạm vi tài liệu này |
| `degreeInSign` | `float64` | `NUMERIC(5,2)` — 2 chữ số thập phân | `decimal` | như trên |
| `speed` | `float64` | `NUMERIC(9,5)` — 5 chữ số thập phân | `decimal` | — |
| `cuspDegree` (House) | `float64` | `NUMERIC(6,3)` | `decimal` | — |
| `exactAngle`, `orb` (Aspect) | `float64` | `NUMERIC(6,3)` / `NUMERIC(5,3)` | `decimal` | — |
| `latitude`/`longitude` (BirthLocation, không phải Planet) | — | `NUMERIC(9,6)` | `decimal` | — |

**Nguyên tắc "không round quá sớm" áp dụng cụ thể:** Toàn bộ chuỗi tính toán bên trong Engine (từ Swiss Ephemeris raw output → Planet Calculator → Aspect Calculator, tức là bước 19.1 ở trên) dùng **nguyên giá trị `float64` chưa làm tròn** — việc làm tròn về `NUMERIC(x,y)` **chỉ xảy ra đúng 1 lần**, tại thời điểm Chart Builder ráp kết quả cuối cùng để chuẩn bị persist (hoặc trả response nếu `save=false`). Điều này đảm bảo: `orb` tính trong Mục 19.1 luôn dùng `longitude` full-precision, không dùng `longitude` đã bị làm tròn 3 chữ số thập phân trước đó — tránh sai số cộng dồn.

**Không round ở đâu khác:** Application layer/API layer **không** làm tròn thêm lần nữa — DB đã là điểm làm tròn cuối cùng, response API trả nguyên giá trị đã lưu.

---

## 21. Normalization

Kế thừa Domain Spec §7 (Validation Rules) + tổng hợp từ các Mục trên:

| Giá trị | Rule normalization | Xử lý boundary |
|---|---|---|
| `longitude` (mọi loại: Planet/Angle/House cusp) | `∈ [0, 360)` | Nếu phép tính ra âm hoặc ≥360 (ví dụ `DSC = ASC + 180` khi `ASC > 180`) → `((value % 360) + 360) % 360` (modulo an toàn cho số âm) |
| `degreeInSign` | `∈ [0, 30)` | `longitude % 30` — luôn nhất quán vì `sign = floor(longitude / 30)` |
| `latitude` (BirthLocation) | `∈ [-90, 90]` | Không có wraparound — validate chặn ở input, không normalize (giá trị ngoài range là lỗi input, không phải giá trị cần "gói lại") |
| `longitude` (BirthLocation, tọa độ địa lý — **khác** `longitude` hoàng đạo ở trên, cần phân biệt rõ 2 khái niệm cùng tên) | `∈ [-180, 180]` | Tương tự — validate, không normalize |
| Góc `angular_separation` (Mục 19.1) | `∈ [0, 180]` | `min(raw, 360-raw)` |

**Tất cả normalization rule đều deterministic** (đúng yêu cầu đề bài) — không có bước nào phụ thuộc thứ tự tính toán hay trạng thái ẩn.

**Floating-point boundary:** Trường hợp `longitude` tính ra rất gần 360 (ví dụ `359.9999999` do sai số dấu phẩy động) → sau khi normalize vẫn `< 360`, không có rủi ro "vọt lên 360 tròn" vì phép modulo luôn trả về `< 360` theo định nghĩa toán học. Trường hợp ranh giới Sign (ví dụ `longitude = 29.9999999°` rất gần biên 30°) — chấp nhận sai số này là hạn chế vật lý tự nhiên của floating-point, không cần business rule bù trừ (đã đề cập tương tự ở Domain Spec cho trường hợp Mặt Trăng gần ranh giới Sign khi không rõ giờ sinh — bản chất là cùng loại vấn đề, xử lý bằng cảnh báo UX, không phải sửa thuật toán).

---

## 22. Swiss Ephemeris Boundary

### 22.1 Interface — ĐÃ CHỐT (D-1: CONFIRMED)

Phát hiện ở bản draft (khoảng trống giữa Architecture Spec §12.1 và Engine Spec §6.4/§6.5 — `RawEphemerisData` gốc chỉ có `planets[]`, không đủ cho House/Angle Calculator) đã được xác nhận xử lý: **giữ nguyên `RawEphemerisData` cho dữ liệu hành tinh, bổ sung capability riêng cho House** thay vì nhồi chung vào 1 method. Chữ ký chính thức:

```typescript
// chart/domain/ports/ephemeris-provider.port.ts
export interface EphemerisRequest {
  utcDateTime: Date;
  coordinates: { latitude: number; longitude: number };
}

export interface RawEphemerisData {
  planets: Array<{ name: PlanetName; longitude: number; latitude: number; speed: number }>;
}

export interface HouseCalculationRequest {
  utcDateTime: Date;
  coordinates: { latitude: number; longitude: number };
  houseSystem: HouseSystem;
}

export interface RawHouseData {
  cusps: number[];      // 12 giá trị, index 0 = House 1 cusp
  ascendant: number;
  midheaven: number;
}

export interface IEphemerisProvider {
  calculateNatal(request: EphemerisRequest): Promise<RawEphemerisData>;
  calculateHouses(request: HouseCalculationRequest): Promise<RawHouseData>;
  calculateTransit(request: EphemerisRequest): Promise<RawEphemerisData>; // chỗ trống cho tương lai, throw UnsupportedChartTypeError ở MVP
}
```

**Lý do tách `calculateHouses()` riêng thay vì mở rộng `RawEphemerisData`:** House/Angle calculation cần thêm 1 tham số mà `calculateNatal()` không cần (`houseSystem`) — gộp chung sẽ buộc `calculateNatal()` cũng phải nhận `houseSystem` dù không dùng tới, vi phạm nguyên tắc Interface Segregation. Tách riêng giữ `calculateNatal()` đơn giản (chỉ phụ thuộc thời gian + tọa độ) trong khi `calculateHouses()` phụ thuộc thêm `houseSystem` đúng bản chất của nó.

**Hệ quả cho House/Angle Calculator (Mục 15, 17):** `HouseCalculator` gọi `IEphemerisProvider.calculateHouses()` (không phải `calculateNatal()`), nhận về `RawHouseData.cusps[0..11]` để dựng 12 `House`, và `RawHouseData.ascendant`/`.midheaven` để dựng 2 trong 4 `Angle` (Descendant/ImumCoeli tính bằng công thức `+180°` như đã mô tả ở Mục 17, không cần Swiss Ephemeris trả riêng).

### 22.2 Trạng thái: Không còn khoảng trống — giao diện đã đủ cho toàn bộ Engine Pipeline

### 22.3 Domain KHÔNG phụ thuộc trực tiếp

Xác nhận lại (đã đóng băng, không có gì mới): Domain Layer (Calculators, Chart Builder) chỉ biết `IEphemerisProvider` (interface, ngôn ngữ nghiệp vụ) — không import `swisseph-wasm`, không biết WebAssembly là gì. `SwissEphemerisAdapter` (Infrastructure) là **lớp duy nhất** trong toàn bộ codebase import package `swisseph-wasm`.

### 22.4 Trách nhiệm Adapter

- Nhận `EphemerisRequest` (đã ở dạng UTC + coordinates thuần túy).
- Gọi `swisseph-wasm` với input đó.
- Convert output thô của `swisseph-wasm` (có thể ở định dạng/đơn vị khác) sang đúng shape `RawEphemerisData`.
- Nếu `swisseph-wasm` lỗi/timeout → throw `EphemerisProviderError`, **không tự bịa dữ liệu thay thế** (Engine Spec §6.2, §4.4).

---

## 23. Calculation Metadata

### 23.1 Đã đóng băng — lưu 2 field

`calculatedAt: timestamp`, `engineVersion: string (semver)` — cả 2 đã có cột tương ứng ở `charts` table (DB Spec §5.7), không nullable.

### 23.2 Ephemeris-specific metadata riêng (khác `engineVersion`)

**D-7: CONFIRMED — không thêm cột `ephemeris_version` vào DB ở giai đoạn này.** DB schema **không có** cột riêng cho "ephemeris data version" (ví dụ version của file ephemeris data mà `swisseph-wasm` dùng, tách biệt khỏi version code Chart Builder/Calculators của chính AstroViet) — giữ nguyên schema đã đóng băng, không migration mới.

**Khuyến nghị MVP:** Coi `engineVersion` là 1 định danh **tổng hợp** cho toàn bộ "unit tái lập được" — bao gồm cả version code (Calculators, Chart Builder) **và** version/pin cụ thể của `swisseph-wasm` package đang dùng (ví dụ semver của chính package `swisseph-wasm` trong `package.json`, hoặc git tag riêng nếu team tự bump `engineVersion` mỗi khi đổi dependency ephemeris). Điều này tránh phải thêm cột mới vào schema đã đóng băng, đồng thời vẫn đảm bảo tính reproducibility đúng nghĩa (Mục 24) — không cần thiết kế lại nếu team xác nhận cách hiểu này. Không tự ý thêm cột — nếu cần tách biệt 2 khái niệm, đây phải là 1 migration mới của Database Design Spec, ngoài phạm vi tài liệu domain này.

---

## 24. Determinism

**Định nghĩa chính xác** (kế thừa Engine Spec §2, §8.2, §23 của prompt gốc): với cùng bộ 6 yếu tố —

```
same birthData (birthDate + birthTime + isBirthTimeKnown)
+ same location (latitude, longitude)
+ same timezone (historicalTimezoneId)
+ same house system
+ same zodiac system (cố định Tropical — không phải biến số thực tế ở MVP)
+ same ephemeris configuration (= engineVersion, xem Mục 23.2)
```

→ kết quả `Chart` phải **giống hệt nhau trong phạm vi precision đã đóng băng** (Mục 20 — `NUMERIC(6,3)` cho longitude, v.v.) ở **bất kỳ thời điểm gọi nào**, **bất kỳ instance server nào** (Engine Stateless, Engine Spec §2).

**Cách hệ thống bảo toàn tính chất này** (trả lời "explain how"):
1. **Không có nguồn ngẫu nhiên** trong bất kỳ Calculator nào (cấm dùng `Math.random()`, `Date.now()` hiện tại, hoặc bất kỳ input ẩn nào ngoài `EngineInput` — Engine Spec §8.2 nêu rõ đây là "ràng buộc thiết kế cấm").
2. **`calculatedAt` không ảnh hưởng kết quả tính toán** — chỉ là metadata ghi lại thời điểm *gọi* Engine, không phải input của bất kỳ Calculator nào (khác biệt quan trọng với `utcDateTime` — thời điểm *sinh*, là input thật).
3. **`engineVersion` được ghim vào Chart** — khi Engine sửa lỗi/nâng cấp (`engineVersion` tăng), Chart cũ **không tự động tính lại** — nó vẫn giữ nguyên kết quả cũ + `engineVersion` cũ, phản ánh đúng "input + version cụ thể → output cụ thể" (không phải "input hiện tại → output hiện tại luôn đúng với engine mới nhất").
4. **Swiss Ephemeris tự thân là deterministic** (giả định đã đóng băng ở Engine Spec §8.1 — "Swiss Ephemeris luôn trả dữ liệu hợp lệ... cho cùng input").

---

## 25. Domain Invariants

| # | Rule | Reason | Enforcement Layer |
|---|---|---|---|
| INV-1 | `Chart.chartType` luôn là 1 giá trị duy nhất trong tập đóng (`'Natal'` ở MVP) | Tránh chart đa hình không rõ ràng | Zod (Presentation) + DB CHECK |
| INV-2 | `Chart.planets.length ≥ 10` | Domain Spec §7 | Domain (Chart Builder self-check trước khi build xong) |
| INV-3 | `houseSystem ∈ {'Placidus', 'WholeSign'}` | Đóng danh sách hỗ trợ | Zod + DB CHECK |
| INV-4 | Nếu `isHouseDataAvailable=true` → `houses.length === 12` **và** `angles.length === 4`; nếu `false` → cả 2 đều rỗng | Domain Spec §7 — "có hoặc không có gì cả" | Domain (Chart Builder) |
| INV-5 | `House.number` ∈ [1,12], không trùng lặp trong 1 Chart | Domain Spec §7 | DB CHECK + UNIQUE |
| INV-6 | `Planet.name` ∈ 14 giá trị enum đã đóng băng | Domain Spec §5.4 | DB CHECK |
| INV-7 | `Planet.longitude` ∈ [0,360); `degreeInSign` ∈ [0,30) | Domain Spec §7 | DB CHECK + Domain normalize (Mục 21) |
| INV-8 | `Aspect.aspectType` ∈ 5 giá trị đã đóng băng | Domain Spec §5.11 | DB CHECK |
| INV-9 | `Aspect.orb ≤ maxOrbAllowed(aspectType, planetCategory)` | Mục 18.2 | Domain (Aspect Calculator — orb vượt ngưỡng thì **không tạo Aspect**, không phải "tạo Aspect invalid rồi validate sau") |
| INV-10 | Không trùng cặp `(planetA, planetB)` không thứ tự trong 1 Chart | Mục 18.5 | DB UNIQUE + canonical ordering ở Domain |
| INV-11 | Snapshot bất biến — không có `UPDATE` nào trên `charts`/`chart_*` sau khi tạo (chỉ `deleted_at`) | Mục 27 | DB (không có cột `updated_at` trên `charts` — enforce bằng thiết kế schema, không có API/Use Case nào expose khả năng update) |
| INV-12 | `Chart.calculationMetadata` (`calculatedAt`, `engineVersion`) luôn nhất quán — không có Chart nào thiếu 1 trong 2 | Domain Spec §5.3 | DB NOT NULL |
| INV-13 | `Chart.userId` luôn tồn tại nếu Chart được persist (`save=true`) | REST API Spec §4.4 (guest transient không bao giờ persist) | DB NOT NULL + Application (guest không được gọi `save=true`, chặn ở Auth middleware — 401) |
| INV-14 | `Sun.isRetrograde === false` và `Moon.isRetrograde === false` luôn đúng | Mục 14 | Domain (assertion, throw `DataIntegrityError` nếu vi phạm) + DB CHECK |
| INV-15 | `DSC.longitude = (ASC.longitude + 180) mod 360`; `IC.longitude = (MC.longitude + 180) mod 360` | Mục 17 | Domain (self-check ở Angle Calculator) |
| INV-16 | `Pattern.involvedPlanets.length ≥ 3` | Domain Spec §7 | Domain (Pattern Calculator chỉ tạo Pattern khi thỏa điều kiện này) |

---

## 26. Domain Errors

Không dùng HTTP status code ở tầng này (đúng yêu cầu đề bài — mapping HTTP thuộc Application/API layer, đã đóng băng ở Architecture Spec §9).

| Domain Error | Khi nào | Có chặn pipeline không? |
|---|---|---|
| `MissingRequiredFieldError` | `BirthData` thiếu field bắt buộc | Có — dừng ở Validation |
| `InvalidDateTimeError` | Ngày/giờ sinh không hợp lệ | Có — dừng ở Validation |
| `InvalidCoordinateError` | Tọa độ ngoài `[-90,90]`/`[-180,180]` | Có — dừng ở Validation |
| `UnresolvableTimezoneError` | `historicalTimezoneId` không hợp lệ trong IANA DB | Có — dừng ở Timezone Resolution |
| `UnsupportedHouseSystemError` | `houseSystem` ngoài `{Placidus, WholeSign}` | Có — dừng ở Validation |
| `UnsupportedZodiacSystemError` | *(không áp dụng ở MVP — chỉ có Tropical, không có input nào chọn hệ khác)* | — giữ tên error trong danh sách theo yêu cầu đề bài, nhưng **không có code path nào** kích hoạt nó ở MVP vì không có tham số nào cho phép chọn Sidereal |
| `EphemerisProviderError` | Swiss Ephemeris library lỗi/timeout | Có — dừng, propagate lên tầng gọi |
| `UnsupportedChartTypeError` | `chartType` khác `'Natal'` | Có — dừng ngay đầu, không tính toán gì |
| `ChartCalculationFailed` | Lỗi tổng quát không rơi vào category cụ thể nào ở trên (ví dụ lỗi runtime không lường trước trong Calculator) | Có — dừng, log full stack trace, không lộ chi tiết ra ngoài |
| `DataIntegrityError` | Vi phạm assertion bất biến (ví dụ Sun retrograde) | Có — đây là lỗi nghiêm trọng, dừng, cần alert/log đặc biệt (không phải lỗi input người dùng) |
| **`HouseSystemNotConvergingError`** | Placidus không hội tụ ở vĩ độ cực | **KHÔNG** — đây là "lỗi mềm"/Warning (`HOUSE_SYSTEM_NOT_CONVERGING`), **không throw**, Chart Builder tiếp tục hoàn tất pipeline với `houses=[]` + warning đính kèm (đã đóng băng, Architecture Spec §9.2, xác nhận lại lần 2) |
| **`patterns = []` (Pattern Detection deferred, D-14)** | Sprint 3 không implement thuật toán phát hiện Grand Trine/T-Square/Grand Cross/Yod | **KHÔNG** — `patterns = []` là kết quả **hợp lệ, có chủ đích**, tương tự cách `houses=[]` hợp lệ khi không rõ giờ sinh. **Không được coi đây là lỗi tính toán** dưới bất kỳ hình thức nào — không throw, không log warning, không set `Warning` nào — Chart vẫn `201 Created` bình thường, đầy đủ Planet/House/Angle/Aspect, chỉ riêng `patterns` luôn rỗng ở Sprint 3 |

**Phân biệt quan trọng (nhắc lại có chủ đích vì đây là điểm dễ code sai):** `HouseSystemNotConvergingError` xuất hiện trong tên nhưng **không phải là Error/Exception thật trong luồng runtime** — nó là 1 `code` giá trị của `Warning` DTO. Toàn bộ các Error khác trong bảng trên **là** exception thật, được throw và bắt bởi Error Handler Middleware (Architecture Spec §9.3), map sang RFC7807.

---

## 27. Chart Lifecycle

### 27.1 Create

`POST /charts/natal` → Application layer gọi `ChartBuilder.build()` → nếu `save=true`, persist qua `IChartRepository`; nếu `save=false`, trả thẳng response, không persist (REST API Spec §4.4).

### 27.2 Calculate

Đồng nhất với Create ở MVP — không có bước "calculate" tách rời khỏi "create" (khác với các domain khác có thể có draft/calculate riêng biệt). 1 lần gọi API = 1 lần tính toán đầy đủ.

### 27.3 Persist

Chỉ khi `save=true` **và** user đã authenticated (không phải Guest — REST API Spec §4.4 Auth: *"Guest (nếu save=false) hoặc User/Admin (nếu save=true)"*).

### 27.4 Read

`GET /charts/{id}` — chỉ áp dụng cho Chart đã persist. Chart transient (`save=false`) **không thể** GET lại sau đó (đúng nguyên tắc Engine Stateless — "không có gì để tra cứu", REST API Spec §4.4 Notes).

### 27.5 Delete

`DELETE /charts/{id}` — soft delete (`deleted_at`), không hard delete ngay (DB Spec §5.7, đúng pattern đã dùng cho `BirthProfile`).

### 27.6 Chart có thể được recalculate không? Chart có bao giờ bị mutate không?

**Trả lời dứt khoát (đã đóng băng, không mơ hồ):**
- **Chart KHÔNG BAO GIỜ bị mutate** sau khi tạo — xác nhận bằng chứng cứ schema: bảng `charts` **không có cột `updated_at`** (khác `birth_profiles` — có cả `updated_at` và `version` cho optimistic locking). Đây là bằng chứng thiết kế trực tiếp: không có cơ chế nào để "sửa" 1 Chart đã tồn tại.
- **"Recalculate" nghĩa là tạo Chart MỚI** (gọi lại `POST /charts/natal` với cùng input) — không có endpoint `PATCH /charts/{id}` hay `POST /charts/{id}/recalculate` nào trong REST API Spec. Gọi lại nhiều lần với cùng input + `save=true` **có thể tạo nhiều bản ghi Chart trùng nội dung** — đây là hành vi **đã chấp nhận** cho MVP (REST API Spec §4.4 Notes, Quyết định 14.5 — Idempotency Key để dành cho v1.1/v2).
- **BirthProfile thay đổi (sửa `birthDate`/`birthTime`/...) KHÔNG ảnh hưởng Chart đã tồn tại** — vì Chart lưu snapshot độc lập hoàn toàn (Mục 28), không đọc lại BirthProfile runtime.

### 27.7 Định nghĩa chính xác "immutable" ở tầng domain (đề bài yêu cầu định nghĩa rõ)

**Immutable nghĩa là:**
1. Không có Use Case/API nào cho phép sửa bất kỳ field nào của 1 Chart đã tồn tại (kể cả các field snapshot, `warnings`, hay bất kỳ thứ gì) sau khi `Chart Builder` đã ráp xong và (nếu `save=true`) đã persist.
2. Thay đổi duy nhất được phép trên 1 hàng `charts` đã tồn tại là set `deleted_at` (soft delete) — đây **không phải** thay đổi nội dung nghiệp vụ, chỉ là thay đổi trạng thái hiển thị/truy xuất.
3. Không có "Chart version 2 của cùng Chart" — mỗi lần tính toán lại là **1 Chart hoàn toàn mới với `id` mới**, không có khái niệm "revision" trên cùng 1 `id`.
4. Domain Entity `Chart` trong code, một khi được `reconstitute()` từ DB hoặc `create()` mới, không có method nào cho phép đổi giá trị nội bộ (đúng convention Entity immutable đã thấy áp dụng nhất quán ở `BirthProfile` — nhưng khác biệt quan trọng: `BirthProfile.update()` **tồn tại** và trả về instance mới, còn `Chart` **không có** method `update()` nào cả — không chỉ là "trả instance mới" mà là "không có method sửa nào tồn tại").

---

## 28. Persistence Boundary

**Không viết lại Prisma schema** (đúng yêu cầu đề bài) — tài liệu này chỉ xác nhận và tổng hợp lại **Persistence Requirements ở mức khái niệm**, đối chiếu 100% với Database Design Specification §5.6–5.13 (đã đóng băng, đã có đầy đủ cột/kiểu/constraint).

### 28.1 Bảng tổng hợp (không lặp lại toàn bộ DDL — chỉ liệt kê identity/relationship/snapshot ở mức khái niệm)

| Bảng | Identity | Quan hệ | Loại dữ liệu |
|---|---|---|---|
| `charts` | `id` UUID | `user_id` FK bắt buộc; `birth_profile_id` FK nullable (SET NULL khi BirthProfile bị xóa) | Snapshot (9 cột `snapshot_*`) + metadata (`engine_version`, `calculated_at`, `warnings`) + config đã dùng (`house_system`, `is_house_data_available`) |
| `chart_planets` | `id` UUID | `chart_id` FK CASCADE; `house_number` composite-FK tới `chart_houses` | Dữ liệu tính toán thuần |
| `chart_houses` | `id` UUID | `chart_id` FK CASCADE | Dữ liệu tính toán thuần |
| `chart_angles` | `id` UUID | `chart_id` FK CASCADE | Dữ liệu tính toán thuần |
| `chart_aspects` | `id` UUID | `chart_id` FK CASCADE | Dữ liệu tính toán thuần (không FK sang `chart_planets` — denormalization có chủ đích, DB Spec §5.11) |
| `chart_patterns` + `chart_pattern_planets` | `id` UUID + composite | `chart_id` FK CASCADE; junction N-M với `chart_planets` | Dữ liệu tính toán thuần (derived từ Aspect) |

### 28.2 Snapshot fields — vì sao snapshot thay vì FK sống

Đã trích dẫn nguyên văn lý do ở DB Spec §5.7 (Mục 27.6 ở trên cũng đã nhắc) — không lặp lại, chỉ xác nhận: **9 cột `snapshot_*`** trên bảng `charts` (`snapshot_full_name`, `snapshot_birth_date`, `snapshot_birth_time`, `snapshot_is_birth_time_known`, `snapshot_place_name`, `snapshot_latitude`, `snapshot_longitude`, `snapshot_timezone_id`, và `snapshot_interpretation_version`) là **input đã dùng để tính ra Chart này**, độc lập hoàn toàn với `birth_profile_id` (chỉ còn ý nghĩa "liên kết tham chiếu để UI có thể link ngược", không phải nguồn dữ liệu).

### 28.3 Immutable data

Toàn bộ dữ liệu trong `charts` và các bảng con — **không có ngoại lệ** (xem Mục 27.7).

### 28.4 Reconcile với Database Design Spec — không phát sinh mâu thuẫn/trùng lặp mới

Đã đối chiếu từng dòng Mục 6–27 ở trên với DB Spec §5.6–5.13 — không phát hiện mâu thuẫn nào giữa Domain Model (tài liệu này) và Persistence Model đã đóng băng. 1 khoảng trống được phát hiện (D-1, Mục 35 — `RawEphemerisData` thiếu house/angle data) nằm ở tầng **Engine interface**, không phải tầng persistence.

---

## 29. API Contract Boundary

**Không viết lại REST API Spec** — chỉ xác nhận thông tin API layer cần expose đã đóng băng đầy đủ (REST API Spec §5.4), tổng hợp lại đối chiếu Domain Model:

| Thông tin API cần | Đã có DTO tương ứng | Khớp Domain Model? |
|---|---|---|
| Chart identity | `ChartResponse.id`, `.chartType` | Khớp |
| Chart metadata | `.calculatedAt`, `.engineVersion`, `.houseSystem`, `.isHouseDataAvailable` | Khớp |
| Planets | `PlanetResponse[]` | Khớp — đủ field, `house: integer \| null` khớp Mục 13.2 |
| Houses | `HouseResponse[]` | Khớp |
| Angles | `AngleResponse[]` | Khớp |
| Aspects | `AspectResponse[]` | Khớp |
| Calculation metadata | `.calculatedAt`, `.engineVersion` (lặp lại ở trên, đúng vì đây cũng là 1 phần Chart metadata) | Khớp |
| Warnings | `Warning[]` | Khớp |
| Interpretations | `InterpretationResponse[]` nhúng sẵn | Khớp (Engine Spec Interpretation Engine, module riêng ngoài Core Pipeline — Mục 6.11) |

**Domain Model vs Persistence Model vs API DTO — phân biệt rõ 3 tầng** (đề bài yêu cầu):

```
Domain Model (Chart Entity trong code, chart/domain/entities/)
   ≠ Persistence Model (Prisma model / DB row, chart/infrastructure/)
   ≠ API DTO (ChartResponse, chart/presentation/)
```

Ví dụ khác biệt cụ thể: Domain `Chart` Entity không có field `snapshot_full_name` (tên field snapshot chỉ tồn tại ở Persistence — Domain Entity chỉ có `birthData: BirthDataSnapshot` là 1 Value Object gộp, được `PrismaChartMapper` (Infrastructure) tách/gộp giữa 2 tầng). Tương tự, `ChartResponse` không có field `userId` (API không expose ai sở hữu Chart qua chính response của Chart đó — ownership chỉ dùng để authorize truy cập, không phải data trả về).

---

## 30. Ownership

Kế thừa nguyên tắc "Ownership applies to BirthProfile and user-owned resources" — áp dụng trực tiếp cho Chart:

```
User (1) → BirthProfile (N, optional intermediate) → Chart (N)
User (1) ────────────────────────────────────────→ Chart (N)  [trực tiếp — Chart luôn có userId riêng, không suy ra qua BirthProfile]
```

**Xác nhận quan trọng:** `Chart.userId` là **FK trực tiếp tới User**, **không phải suy ra gián tiếp qua `birthProfileId`** — bằng chứng: `birth_profile_id` là **nullable** (Chart có thể tạo từ `birthData` inline, không qua BirthProfile nào) nhưng `user_id` là **NOT NULL bắt buộc** khi `save=true` (INV-13, Mục 25). Điều này khớp đúng thực tế: 1 Chart luôn có 1 chủ sở hữu rõ ràng (nếu đã lưu), bất kể có dùng BirthProfile đã lưu trước đó hay không.

**Admin override:** **Không giới thiệu** — đúng yêu cầu đề bài ("Do not introduce admin override behavior unless already frozen"). REST API Spec §4.4 liệt kê `Auth: User, Admin (chỉ chủ sở hữu)` cho `GET`/`DELETE /charts/{id}` — cách đọc đúng: Admin **cũng phải là chủ sở hữu** mới truy cập được (không có "Admin xem Chart của bất kỳ ai"), giống hệt pattern đã áp dụng cho BirthProfile ở Sprint 2. Không có Decision Required ở đây — đã đủ rõ từ cách viết nhất quán trong REST API Spec.

---

## 31. Testable Business Rules

Định dạng Given/When/Then theo đúng yêu cầu đề bài — không viết test code.

| # | Rule | Given | When | Then |
|---|---|---|---|---|
| TR-1 | Zodiac normalization | `longitude = 375°` (giá trị thô vượt 360°, ví dụ output trung gian trước normalize) | Normalize được gọi | `longitude` trả về `= 15°` |
| TR-2 | Longitude → Sign conversion | `longitude = 195.5°` | Derive `sign` | `sign = Libra`, `degreeInSign = 15.5°` (vì 180–210° = Libra) |
| TR-3 | House numbering | Chart Placidus tính xong 12 House | Đọc `houses[].number` | Có đúng 12 giá trị, là hoán vị của `{1,2,...,12}`, không trùng |
| TR-4 | Whole Sign behavior | `Ascendant.longitude = 195.5°` (Libra) | Tính House theo Whole Sign | `House[1].cuspDegree = 180°` (đầu Sign Libra), `House[2].cuspDegree = 210°` (đầu Sign Scorpio), v.v. |
| TR-5 | Placidus result contract | `latitude = 10°` (không cực) | Tính House theo Placidus | Trả về đúng 12 House, không có warning |
| TR-6 | Placidus không hội tụ | `latitude = 70°` (vượt 66.5°) | Tính House theo Placidus | `houses = []`, `warnings` chứa `HOUSE_SYSTEM_NOT_CONVERGING`, **không throw exception**, request vẫn `200`/`201` |
| TR-7 | Unknown birth time | `isBirthTimeKnown = false` | Tính Chart | `houses = []`, `angles = []`, `isHouseDataAvailable = false`, `planets` vẫn đầy đủ, `aspects` vẫn tính đầy đủ, không có field nào bị gán giá trị mặc định giả (12:00) |
| TR-8 | Aspect detection — exact | 2 Planet có `longitude` chênh lệch đúng `90°` | Tính Aspect | Trả về `Aspect(aspectType=Square, exactAngle=90, orb=0)` |
| TR-9 | Orb boundary — trong ngưỡng | 2 Planet cá nhân chênh lệch `97°` (Square, orb thực = 7°, orb tối đa cho phép = 7°) | Tính Aspect | Aspect **được tạo** (orb = tối đa cho phép, biên đóng `≤`) |
| TR-10 | Orb boundary — ngoài ngưỡng | 2 Planet cá nhân chênh lệch `97.01°` (orb thực > 7°) | Tính Aspect | Aspect **không được tạo** |
| TR-11 | Duplicate aspect prevention | Đã có `Aspect(Moon, Sun, Square)` | Cố tạo `Aspect(Sun, Moon, Square)` (thứ tự ngược) | Bị coi là cùng 1 aspect — không tạo hàng thứ 2 (canonical ordering) |
| TR-12 | Retrograde detection | 1 Planet có `speed = -0.5` | Tính `isRetrograde` | `isRetrograde = true` |
| TR-13 | Retrograde invariant — Sun/Moon | Ephemeris trả (giả định lỗi dữ liệu) `Sun.speed = -0.1` | Planet Calculator xử lý | Throw `DataIntegrityError`, không tạo `Sun.isRetrograde = true` |
| TR-14 | Chart immutability | 1 Chart đã persist với `id = X` | Cố gọi bất kỳ thao tác "update" nào lên Chart `X` | Không có Use Case/method nào tồn tại để thực hiện — về mặt kiến trúc không thể xảy ra (test ở mức "method không tồn tại", không phải "throw error khi gọi") |
| TR-15 | Deterministic calculation | Cùng `EngineInput` gọi Engine 2 lần độc lập | So sánh 2 `Chart` output | Toàn bộ field số (trong phạm vi precision đã persist) giống hệt nhau |
| TR-16 | Invalid input handling — coordinate | `latitude = 95°` (ngoài range) | Validation | Throw `InvalidCoordinateError`, dừng pipeline, không gọi Swiss Ephemeris |
| TR-17 | Invalid input handling — unsupported house system | `houseSystem = "Koch"` (chưa hỗ trợ) | Validation | Throw `UnsupportedHouseSystemError` |
| TR-18 | 0°/360° wraparound trong Aspect | `Planet_A.longitude = 5°`, `Planet_B.longitude = 355°` | Tính `angular_separation` | `= 10°` (không phải `350°`) — dùng `min(raw, 360-raw)` |
| TR-19 | Angle bất biến DSC/ASC | Chart có `isHouseDataAvailable = true` | Đọc `Ascendant.longitude` và `Descendant.longitude` | Chênh lệch đúng `180°` (mod 360) |
| TR-20 | Optional points — mặc định rỗng | Request không có `includeOptionalPoints` | Tính Chart | `planets` chỉ có đúng 10 hành tinh chuẩn, không có Chiron/Lilith/Nodes |
| TR-21 | Optional points — có chỉ định | Request có `includeOptionalPoints = ["Chiron"]` | Tính Chart | `planets` có 11 phần tử, bao gồm `Chiron` |

---

## 32. Reference / Golden Test Strategy

**Quyết định: CÓ nên dùng Golden Chart** — lý do: đây là cách duy nhất verify độ chính xác thiên văn thật (so với việc chỉ test nội bộ logic mà không biết Swiss Ephemeris có tích hợp đúng hay không). PRD Giai đoạn 1 (Mục 4 trong PRD, "Tuần 1–5") đã tự nêu rõ ý định này: *"viết test đối chiếu kết quả với công cụ uy tín (Astro.com) để đảm bảo độ chính xác"* — đây là **quyết định đã có sẵn ở PRD**, không phải tài liệu này tự phát minh.

| Khía cạnh | Nội dung |
|---|---|
| **Mục đích** | Xác nhận `SwissEphemerisAdapter` tích hợp đúng `swisseph-wasm` — không phải test business logic (Calculators đã test bằng Unit Test thuần túy không cần Golden Data, Mục 31) |
| **Input cần** | Tối thiểu 3–5 bộ `BirthData` đã biết trước kết quả chính xác (ngày/giờ/địa điểm cụ thể + kết quả kỳ vọng: vị trí 10 hành tinh, 4 Angle, 12 House cusp cho cả Placidus và Whole Sign) |
| **Expected output** | Vị trí hành tinh/house/angle đã verify từ nguồn uy tín |
| **Tolerance** | **D-8: CONFIRMED** — sai số ≤ `0.01°` cho angular positions (longitude hành tinh, cusp, angle) — chính thức, không còn là khuyến nghị chờ xác nhận |
| **Nguồn dữ liệu tham chiếu** | **⚠️ External Dependency — chưa có trong tài liệu dự án.** Đúng yêu cầu đề bài ("Do not invent astronomical reference values... identify as external dependency if unavailable"): PRD chỉ *gợi ý* dùng Astro.com làm nguồn đối chiếu, nhưng **không có** bộ dữ liệu Golden Chart cụ thể nào (ngày sinh + kết quả kỳ vọng) được đính kèm trong bất kỳ tài liệu nào trong 17 nguồn đã kiểm tra. Sprint 3 Implementation Plan cần **tự thu thập** bộ dữ liệu này (ví dụ tra cứu thủ công trên Astro.com cho vài ngày sinh cố định, ghi lại kết quả làm fixture test) — đây là công việc chuẩn bị dữ liệu, không phải quyết định domain, nhưng phải được lên kế hoạch tường minh trong Sprint 3 Implementation Plan như 1 task riêng (không thể code Golden Test mà thiếu dữ liệu golden) |

---

## 33. Extensibility

Áp dụng nghiêm ngặt bài kiểm tra đề bài yêu cầu cho MỌI abstraction được đề xuất: *"Is this required to support a currently planned future chart type without making the current Natal implementation unnecessarily complex?"*

Đã đóng băng đầy đủ ở Engine Spec §9 — tài liệu này **không thêm** abstraction nào ngoài những gì đã có, chỉ xác nhận Natal Chart hiện tại tương thích với các extension point đã thiết kế sẵn:

| Extension point đã có sẵn | Test "có cần không" | Kết luận |
|---|---|---|
| `IEphemerisProvider.calculateTransit()` (chữ ký đã định nghĩa, chưa implement) | Không đòi hỏi Natal phức tạp hơn — chỉ là 1 method chưa dùng trong interface, `throw UnsupportedChartTypeError` là đủ | **Giữ nguyên** — đã pass test, không cần sửa |
| `chart_type CHECK IN ('Natal')` (đóng, không phải enum mở) | Mở rộng qua migration sau — không cần thiết kế Natal linh hoạt hơn ngay bây giờ | **Giữ nguyên** — đúng YAGNI |
| `chart_patterns.pattern_type` không CHECK cứng (TEXT tự do, validate ở app layer) | Cho phép thêm Pattern type mới không cần migration — nhưng đây là **quyết định đã có sẵn ở DB Spec**, không phải đề xuất mới của tài liệu này | Xác nhận **giữ nguyên**, không đổi |
| `InterChartAspectCalculator`, `MidpointCalculator`, `SolarReturnResolver` (Engine Spec §9.7 — mô tả concept, chưa có interface cụ thể) | Đây là **concept-level**, không phải interface đã đóng băng — Natal Chart hiện tại **không cần** implement bất kỳ phần nào của các module này | **Không tạo** — đúng "Do not implement or formally specify future chart types unless required as architectural extension points"; các module này chỉ cần tồn tại dưới dạng ghi chú kiến trúc (đã có ở Engine Spec §9), không cần interface code thật ở Sprint 3 |

**Không đề xuất abstraction mới nào** trong tài liệu này — mọi extension point cần thiết đã được Engine Spec §9 thiết kế sẵn đầy đủ, đúng nguyên tắc Open/Closed đã áp dụng nhất quán.

---

## 34. Out of Scope

| Hạng mục | Trong scope Sprint 3? | Ghi chú |
|---|---|---|
| Synastry | Không | Extension point đã có ở Engine Spec §9.7; REST API Spec §14.3 xác nhận loại khỏi v1 |
| Composite | Không | Tương tự |
| Transit | Không | Tương tự; PRD xác nhận "nên làm sau khi Natal Chart đã ổn định" |
| Progression | Không | Extension point Engine Spec §9.1 |
| Solar Return | Không | Extension point Engine Spec §9.7 |
| AI Interpretation (thật) | Không | Chỉ định nghĩa boundary (`IInterpretationContentProvider`, Architecture Spec §12) — implementation thật (gọi LLM) không thuộc Sprint 3 |
| Human interpretation content (nội dung viết tay đầy đủ) | Không | Cần content bank đầy đủ (`interpretation_contents` có dữ liệu) — việc **biên soạn** nội dung là công việc content/editorial, không phải domain engineering; Sprint 3 chỉ cần cơ chế JOIN hoạt động đúng, không cần content thật đầy đủ để chart hoạt động về mặt kỹ thuật |
| Predictive astrology | Không | Không có trong bất kỳ tài liệu nào — ngoài phạm vi sản phẩm hiện tại |
| Advanced asteroids (ngoài Chiron) | Không | Domain Spec chỉ liệt kê Chiron trong nhóm Point |
| Fixed stars | Không | Extension point Engine Spec §9.5, chưa implement |
| Arabic Parts | Không | Extension point Engine Spec §9.4, chưa implement |
| Minor aspects (Quincunx, Semisextile...) | Không | Domain Spec chỉ đóng băng 5 aspect chính |
| Configurable user-defined orbs | Không | Domain Spec §5.11: orb là "cấu hình engine", không phải setting người dùng ở MVP |
| Additional house systems (Koch, Equal, Campanus...) | Không | Chỉ Placidus + Whole Sign ở MVP; extension point đã có (Engine Spec §6.4 Future Extension) |
| Additional zodiac systems (Sidereal) | Không | Domain Spec §5.5: chỉ Tropical, Sidereal là "quyết định mở rộng tương lai" |
| Pattern detection algorithm chi tiết (Grand Trine, T-Square, Grand Cross, Yod) | **D-14: DEFERRED — chính thức** | `Pattern` entity, DB table (`chart_patterns`/`chart_pattern_planets`), và API field (`ChartResponse.patterns`) **được giữ nguyên** trong domain model/schema/contract — **không xóa**. Sprint 3 **không implement** thuật toán phát hiện bất kỳ loại Pattern nào (kể cả Grand Trine/T-Square/Grand Cross dù chỉ cần Square/Opposition/Trine đã có sẵn trong 5 aspect MVP) — lý do: Natal Chart core (BirthData, Timezone, Swiss Ephemeris, Planet, House, Angle, Aspect, Snapshot) đã đủ lớn cho 1 Sprint; Pattern là tầng derived calculation thứ 2 (Planet+Aspect→Pattern), tách biệt hợp lý được. `patterns = []` ở mọi Chart Sprint 3 tạo ra — đây **không phải calculation failure** (xem Mục 26), phải ghi rõ trong tài liệu vận hành: "Pattern Detection Engine là deferred feature, không phải bug/thiếu sót" |

---

## 35. Decision Log

Toàn bộ 14 Decision đã được xác nhận. Bảng dưới cập nhật đầy đủ trạng thái cuối cùng — không còn mục nào ở trạng thái "Decision Required".

| ID | Decision | Status | Final Decision |
|---|---|---|---|
| D-1 | Mở rộng `IEphemerisProvider` cho House/Angle | ✅ **CONFIRMED** | Giữ `RawEphemerisData` cho dữ liệu hành tinh, thêm `calculateHouses(HouseCalculationRequest): Promise<RawHouseData>` riêng (Mục 22.1) — không mở rộng chung `RawEphemerisData` |
| D-2 | Cảnh báo `MOON_SIGN_UNCERTAIN` khi không rõ giờ sinh | ✅ **DEFERRED** | Không thêm vào Sprint 3 — Mặt Trăng vẫn tính bình thường, không có `Warning.code` riêng (Mục 11.1) |
| D-3 | Tự động fallback Placidus → Whole Sign khi không hội tụ | ✅ **CONFIRMED — NO AUTOMATIC FALLBACK** | Chỉ trả `houses=[]` + warning, không tự chuyển hệ thống nhà (Mục 15.3) |
| D-4 | Enforce `DSC=ASC+180`/`IC=MC+180` bằng DB Trigger hay Domain self-check | ✅ **CONFIRMED — Domain self-check only** | Không dùng DB Trigger — Angle Calculator là đường ghi duy nhất (Mục 17) |
| D-5 | Nhóm `Social` (Jupiter, Saturn) dùng orb "cá nhân" hay "ngoài" | ✅ **CONFIRMED** | Gộp vào nhóm "ngoài" (Mục 18.2) |
| D-6 | Công thức `isApplying`/`isSeparating` | ✅ **CONFIRMED — có công thức wrap-aware cụ thể** | So sánh `separation(t)` vs `separation(t+Δt)` dùng đúng hàm `angular_separation()` wrap-aware của Mục 19.1, không dùng hiệu số thô (Mục 18.3 — công thức đầy đủ) |
| D-7 | `engineVersion` có cần tách cột `ephemeris_version` riêng | ✅ **CONFIRMED** | Không thêm cột mới ở giai đoạn này (Mục 23.2) |
| D-8 | Tolerance cho Golden Test | ✅ **CONFIRMED** | `0.01°` cho angular positions (Mục 32) |
| D-9 | Unknown Birth Time — mặc định 12:00 (PRD) hay houses/angles rỗng | ✅ **CONFIRMED — theo khuyến nghị Spec** | Xem Conflict #1 (RESOLVED) — không tạo giờ mặc định, houses/angles rỗng (Mục 11.2) |
| D-10 | Chart đọc BirthProfile qua `getSnapshotData()` hay `IBirthProfileRepository` trực tiếp | ✅ **CONFIRMED — theo khuyến nghị Spec** | Xem Conflict #2 (RESOLVED) — qua `getSnapshotData()` (Mục 5.1, 27) |
| D-11 | Aspect giữa Planet và Angle | ✅ **DEFERRED — đồng ý khuyến nghị** | Không thuộc MVP (Mục 19.2) |
| D-12 | Stationary retrograde state | ✅ **DEFERRED — đồng ý khuyến nghị** | Không thêm — chỉ `speed < 0` nhị phân (Mục 14) |
| D-13 | Timezone ambiguity (DST fall-back) | ✅ **DEFERRED — đồng ý khuyến nghị** | Chấp nhận hành vi mặc định thư viện timezone (Mục 10.6) |
| D-14 | Pattern detection algorithm (Grand Trine, T-Square, Grand Cross, Yod) | ✅ **DEFERRED — toàn bộ, chính thức** | Không implement bất kỳ thuật toán Pattern nào ở Sprint 3 — lý do: Natal Chart core đã đủ lớn (BirthData, Timezone, Swiss Ephemeris, Planet, House, Angle, Aspect, Snapshot), Pattern là tầng derived calculation thứ 2 tách biệt hợp lý được; Yod đặc biệt cần Quincunx (ngoài 5 aspect MVP). **Giữ nguyên** `Pattern` entity, DB tables (`chart_patterns`/`chart_pattern_planets`), API field (`ChartResponse.patterns`) — không xóa khỏi domain model/schema/contract. Sprint 3: `patterns = []` cho mọi Chart — **không được coi là calculation failure** (Mục 26, Mục 34) |

**Tổng kết:** 0 "Decision Required" còn tồn đọng. 9 CONFIRMED (D-1, D-3, D-4, D-5, D-6, D-7, D-8, D-9, D-10), 5 DEFERRED có chủ đích (D-2, D-11, D-12, D-13, D-14) — toàn bộ đều đã có quyết định cuối cùng ghi lại bằng chứng rõ ràng, không mục nào bị âm thầm bỏ ngỏ.

---

## 36. Specification Conflicts

Cả 2 Conflict đã RESOLVED — giữ nguyên toàn bộ lý luận gốc (2 phía, impact, khuyến nghị) để tra cứu, bổ sung quyết định chính thức.

### Conflict #1 — Hành vi khi không rõ giờ sinh (Unknown Birth Time) — ✅ RESOLVED

| | |
|---|---|
| **Document A** | Product Requirements Document, FR-02 (Mục 5.1) |
| **Document B** | Astrology Domain Specification §5.1 + §6; Astrology Engine Specification §4.4 + §5; REST API Specification §4.4; Sprint 2 Implementation Plan (dòng 168, mô tả hành vi **đã shipped** trong code thật) |
| **Conflicting statements** | **Document A** (PRD, nguyên văn): *"Nếu người dùng không có giờ sinh, hệ thống mặc định 12:00 trưa và hiển thị cảnh báo rõ ràng rằng vị trí Mặt Trăng, các Nhà (Houses) và Cung Mọc (Ascendant) có thể không chính xác"*. **Document B** (thống nhất ở cả 4 nguồn): không gán giờ mặc định, không tính Houses/Angles |
| **Quyết định cuối cùng** | **RESOLVE THEO DOCUMENT B**: `isBirthTimeKnown=false` → không tạo default time → tính Planet → tính Aspect → `houses=[]` → `angles=[]` → `isHouseDataAvailable=false`. Không thêm giờ "12:00" giả vào snapshot dưới bất kỳ hình thức nào |
| **Documentation Reconciliation Task** | **Bắt buộc** — cập nhật lại PRD FR-02 để khớp đúng hành vi thật (nội dung thay thế đề xuất đã có ở Mục 11.2), tránh 2 tài liệu tiếp tục mâu thuẫn vĩnh viễn. Task này thuộc phạm vi tài liệu hóa, thực hiện song song hoặc trước khi Sprint 3 đóng |
| **Sprint 3 có bị block không?** | Không còn — quyết định đã chốt, có thể code Chart Builder ngay theo đúng nhánh rẽ Document B |

### Conflict #2 — Cách Chart module đọc dữ liệu từ BirthProfile module — ✅ RESOLVED

| | |
|---|---|
| **Document A** | Project Architecture Specification §8 (Module Communication) — cấm truy cập trực tiếp Repository/Entity nội bộ module khác; §3.2 xác nhận điểm truy cập đúng là `BirthProfileService.getSnapshotData(id): BirthDataSnapshot` |
| **Document B** | Sprint 2 Implementation Plan, dòng 225 — nêu Sprint 3 sẽ dùng thẳng `IBirthProfileRepository.findById()` |
| **Quyết định cuối cùng** | **Đồng ý với khuyến nghị trong Spec — theo Document A.** Sprint 3 bổ sung `getSnapshotData(birthProfileId, requestingUserId): Promise<BirthDataSnapshot>` vào `birth-profile/application/services/`, export qua `birth-profile/index.ts`; Chart module **không** import `IBirthProfileRepository` |
| **Sprint 3 có bị block không?** | Không — rủi ro thấp, đã sẵn sàng code theo đúng Document A |

---

## 37. Sprint 3 Readiness Assessment

### Đánh giá: **READY**

Toàn bộ 14 Decision (Mục 35) và 2 Specification Conflict (Mục 36) đã được xác nhận chính thức — không còn "Decision Required" nào tồn đọng. Không còn điểm nào buộc developer viết Sprint 3 Implementation Plan phải tự phát minh hành vi domain.

### Việc cần thực hiện trước/song song khi Sprint 3 bắt đầu (không phải "quyết định còn thiếu" — là Task, đúng bản chất)

| Việc | Loại | Ghi chú |
|---|---|---|
| Cập nhật PRD FR-02 (Documentation Reconciliation Task, Mục 36 Conflict #1) | Documentation | Nội dung thay thế đã có sẵn ở Mục 11.2, chỉ cần áp dụng |
| Bổ sung `getSnapshotData()` vào `birth-profile` module (Mục 36 Conflict #2) | Code (nhỏ, cô lập) | 1 method mới + export qua barrel, không đổi gì khác trong module đã đóng |
| Thu thập bộ dữ liệu Golden Chart tham chiếu (Mục 32) | Chuẩn bị dữ liệu | Vẫn là **External Dependency** thật — không có sẵn trong 17 tài liệu nguồn, cần tra cứu thủ công (ví dụ Astro.com) trước khi viết Golden Test |
| Ghi chú "Pattern Detection Engine là deferred feature" vào tài liệu vận hành (D-14) | Documentation | Tránh `patterns=[]` bị hiểu nhầm là lỗi khi Sprint 3 QA/demo |

**Không còn mục nào ở mức 🔴 Bắt buộc chặn code** — cả 2 điểm chặn thật sự trước đây (Conflict #1, D-1) đã có quyết định + chữ ký interface cụ thể, sẵn sàng dùng ngay.

---

## 38. Traceability Matrix

| Product Requirement (PRD) | Domain Rule | Domain Model | Calculation Rule | Testable Rule | Future Implementation Area |
|---|---|---|---|---|---|
| "Lập & giải mã Lá số cá nhân — đầy đủ hành tinh, nhà, góc chiếu" (PRD §3.1) | Chart phải có ≥10 Planet, đủ 12 House/4 Angle nếu có giờ sinh, Aspect đầy đủ (Domain Spec §5.3, §7) | `Chart` Aggregate + `Planet`/`House`/`Angle`/`Aspect` Entity | Mục 13, 15–19 | TR-3 đến TR-11 | — |
| "Xử lý không rõ giờ sinh, cảnh báo rõ ràng" (PRD FR-02) | Unknown Birth Time Policy (Mục 11) — Conflict #1 RESOLVED | `Chart.isHouseDataAvailable`, `Warning` | Mục 11 | TR-7 | PRD FR-02 cần cập nhật wording (Documentation Reconciliation Task, Mục 36/37) |
| "Sử dụng thư viện ephemeris đã kiểm chứng" (PRD NFR — Độ chính xác thiên văn) | Swiss Ephemeris Boundary (Mục 22) | `IEphemerisProvider` (D-1 CONFIRMED) | Mục 22 | Mục 32 (Golden Test) | Thu thập bộ dữ liệu Golden Chart tham chiếu (External Dependency, Mục 32/37) |
| "Thời gian tính toán + hiển thị < 5 giây" (PRD NFR — Hiệu suất) | Engine Stateless, không I/O dư thừa (Engine Spec §2) | `ChartBuilder` | Mục 24 (Determinism — không có bước ngẫu nhiên/chờ đợi ẩn) | *(Performance test — ngoài phạm vi domain spec, thuộc Implementation Plan)* | — |
| "Kiến trúc cho phép thêm Transit/Composite sau" (PRD NFR — Scalability) | Open/Closed Principle (Engine Spec §2) | Extension points (Mục 33) | Engine Spec §9 | *(Không test được ở Sprint 3 — chỉ verify qua code review kiến trúc)* | Transit/Synastry/Composite/Solar Return/Progression (Mục 34) |
| "Thông tin sinh là dữ liệu nhạy cảm" (PRD NFR — Bảo mật) | Ownership (Mục 30) | `Chart.userId` bắt buộc khi persist | Mục 30 | INV-13 | RBAC nâng cao (nếu có, ngoài phạm vi) |
| "Bảo trì dễ — tách engine khỏi nội dung diễn giải" (PRD NFR — Maintainability) | Separation of Calculation & Interpretation (Domain Spec §2, §4) | `Chart` (Core Pipeline) vs `Interpretation` (module riêng) | Engine Spec §6.11 | — | AI Interpretation (Mục 34) |
| *(không có PRD requirement tương ứng — phát hiện qua Engine/DB Spec)* | Snapshot Immutability | `Chart` không có `update()` | Mục 27.7 | TR-14 | — |
| *(không có PRD requirement tương ứng)* | Determinism | `engineVersion` pinning | Mục 24 | TR-15 | — |

---

*Hết tài liệu. Toàn bộ 38 mục theo đúng cấu trúc yêu cầu. 2 Specification Conflict và 14 Decision Log entry đều đã RESOLVED/CONFIRMED/DEFERRED chính thức (Mục 35, 36) — không còn mục "Decision Required" nào tồn đọng. Đánh giá cuối: **READY** (Mục 37) — Sprint 3 Implementation Plan có thể bắt đầu ngay; chỉ còn 4 Task chuẩn bị (cập nhật PRD FR-02, bổ sung `getSnapshotData()`, thu thập Golden Chart data, ghi chú Pattern Detection deferred) cần thực hiện trước hoặc song song, không phải quyết định domain còn thiếu.*
