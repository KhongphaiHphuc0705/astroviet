# Swiss Ephemeris Integration Specification

## AstroViet Platform — Backend Sprint 3: Natal Chart Module + Swiss Ephemeris Integration

---

## 1. Document Control

| | |
|---|---|
| **Loại tài liệu** | Technical Specification — Infrastructure Integration Layer (candidate frozen spec cho Sprint 3) |
| **Phiên bản** | 1.0 |
| **Vị trí trong chuỗi tài liệu** | Nằm **dưới** Natal Chart Domain Specification (v1.1, Confirmed) và Astrology Engine Specification (Frozen) — tài liệu này **không định nghĩa lại** domain rule nào (orb, precision, aggregate model, Chart lifecycle...), chỉ đặc tả **cách Infrastructure Layer thực thi** những gì Domain/Engine Spec đã yêu cầu, cụ thể ở ranh giới `SwissEphemerisAdapter` |
| **Quan hệ với Natal Chart Domain Specification** | Kế thừa nguyên trạng toàn bộ Decision Log đã Confirmed/Deferred của tài liệu đó (D-1 đến D-14, Conflict #1/#2 RESOLVED) — liệt kê lại ở Mục 39 dưới dạng "Already Frozen", **không** mở lại bất kỳ mục nào trừ khi phát hiện mâu thuẫn cụ thể mới |
| **Đối tượng đọc** | Developer viết Sprint 3 Implementation Plan và code `SwissEphemerisAdapter` |
| **Trạng thái** | **Phiên bản 1.1 — Confirmed.** Toàn bộ Open Questions gốc (OQ-1 đến OQ-10, Mục 38) đã CONFIRMED, cộng thêm mục mới **Licensing & Compliance** (Mục 37, Production Launch Gate — không chặn Sprint 3 implementation local) |

---

## 2. Purpose

Đặc tả **chính xác** cách AstroViet tích hợp Swiss Ephemeris vào Astrology Engine — trả lời đầy đủ 17 câu hỏi đề bài đặt ra (Mục 4 prompt gốc): Swiss Ephemeris chịu trách nhiệm gì, Engine chịu trách nhiệm gì, domain/application/infrastructure layer chịu trách nhiệm gì, input được biến đổi thế nào, thời gian/tọa độ được chuẩn hóa ra sao, file ephemeris được định vị/khởi tạo thế nào, kết quả thô được map vào domain value ra sao, lỗi/precision/determinism/resource được quản lý thế nào, và tích hợp được test/mở rộng/thay thế thế nào trong tương lai.

Tài liệu **không phải** giáo trình Swiss Ephemeris — chỉ trả lời "phần mềm AstroViet phải tích hợp thư viện này chính xác như thế nào", đúng ranh giới đã có ở Engine Spec §6.2 (Swiss Adapter).

---

## 3. Scope

**Trong phạm vi:** `SwissEphemerisAdapter` (implement `IEphemerisProvider`), toàn bộ input/output contract của Adapter, file ephemeris lifecycle, WASM runtime lifecycle, error translation, celestial body/house system mapping table, calculation flags, precision/determinism tại ranh giới Adapter, testing strategy cho Adapter, module/file structure, DI wiring, configuration.

**Ngoài phạm vi** (chi tiết đầy đủ Mục 40): domain business rule đã có sẵn ở Natal Chart Domain Spec (orb policy, aspect formula, Pattern detection, immutability) — chỉ **tham chiếu**, không lặp lại; REST API DTO shape — chỉ tham chiếu; Synastry/Composite/Transit/Progression/Solar Return implementation thật; Redis; AI Interpretation; Frontend chart rendering.

---

## 4. Project Context

Kế thừa nguyên trạng Mục 1–2 của prompt gốc — không lặp lại. Xác nhận bổ sung qua inspect trực tiếp code thật: **`swisseph-wasm` chưa được cài đặt** trong `backend/package.json` (Sprint 3 chưa bắt đầu code) — không có setup nào tồn tại sẵn để kế thừa, tài liệu này thiết kế từ đầu, không phải review lại code đã có.

---

## 5. Source Documents

Đã inspect trực tiếp toàn bộ nguồn yêu cầu tối thiểu, cộng thêm review lại **Natal Chart Domain Specification v1.1 (Confirmed)** vừa hoàn thành làm nguồn bổ sung bắt buộc (không nằm trong danh sách gốc của prompt này nhưng là tiền đề trực tiếp).

| # | Tài liệu | Mức độ dùng |
|---|---|---|
| 1 | PRD | Trung bình — NFR độ chính xác/hiệu suất (Mục 22) |
| 2 | Astrology Domain Specification | Cao — đối chiếu chéo, không mâu thuẫn phát sinh mới |
| 3 | Astrology Engine Specification | **Cao nhất** — §6.2 (Swiss Adapter), §4 (Pipeline), §12.1 tương đương Architecture Spec |
| 4 | REST API Specification | Trung bình — chỉ tham chiếu DTO, không lặp lại |
| 5 | Database Design Specification | Cao — precision đã đóng băng (`NUMERIC` types), `engine_version` column |
| 6 | Project Architecture Specification | **Cao nhất** — §12.1 (`IEphemerisProvider`), §18 (Deployment), §22 (ADR: WASM, Docker packaging, PM2 single-instance) |
| 7 | Backend Implementation Guide | Cao — §19 có sẵn code mẫu `SwissEphemerisAdapter` (Mục 18 dưới, đã xác nhận cần cập nhật theo D-1 mới) |
| 8 | Coding Standards & Conventions | Cao — naming, logging pattern, `any` exception rule cho thiếu type definition |
| 9 | Sprint 1 Implementation Plan | Thấp — Identity, không liên quan |
| 10 | Sprint 2 Implementation Plan | Trung bình — xác nhận `getSnapshotData()` pattern (đã Confirmed ở Natal Chart Domain Spec Conflict #2) |
| 11 | Sprint 2 closure documentation | Đã inspect — không có nội dung Swiss Ephemeris nào (Sprint 2 là BirthProfile, không chạm Engine) |
| 12 | Existing backend source code | Đã inspect — **`swisseph-wasm` chưa cài**, không có `chart/` module nào tồn tại |
| 13 | Existing Prisma schema | Đã inspect — `birth_profiles` khớp DB Spec; **chưa có** model `Chart` nào |
| 14 | Existing OpenAPI definitions | Đối chiếu qua REST API Spec §13 |
| 15 | Existing tests | Đã inspect cấu trúc test hiện có (Identity/BirthProfile) để xác nhận convention testing chung |
| 16 | Existing configuration | Đã inspect `Dockerfile`, `docker-compose*.yml` — xác nhận **không dùng PM2** trong deploy hiện tại (xem Mục 19, sửa lại khung hiểu của đề bài) |
| 17 | Existing Swiss Ephemeris/swisseph-wasm setup | **Không tồn tại** — xác nhận trực tiếp |
| 18 (bổ sung) | **Natal Chart Domain Specification v1.1 (Confirmed)** | **Cao nhất** — nguồn Decision Log kế thừa trực tiếp (Mục 39) |

---

## 6. Architectural Principles

Đúng yêu cầu Mục 5 prompt gốc — xác nhận hướng phụ thuộc:

```
Domain (chart/domain/) ─── định nghĩa IEphemerisProvider (port, ngôn ngữ nghiệp vụ)
      ▲
Application (chart/application/) ─── gọi qua interface, không biết implementation
      ▲
Infrastructure Adapter (chart/infrastructure/adapters/swiss-ephemeris.adapter.ts) ─── implement interface
      ▲
swisseph-wasm (external package)
```

**Tên interface — đã đóng băng, không tự đặt tên khác:** `IEphemerisProvider` (Architecture Spec §12.1, Engine Spec §6.2). Đề bài gợi ý cân nhắc `AstrologyCalculationPort`/`EphemerisPort`/`PlanetaryCalculationPort` — **không dùng bất kỳ tên nào trong 3 gợi ý này**, vì `IEphemerisProvider` đã tồn tại, đã có chữ ký cụ thể được Confirmed ở Natal Chart Domain Spec D-1, đổi tên sẽ phá vỡ 1 quyết định đã đóng băng không có lý do chính đáng.

**Domain tuyệt đối không import:** `swisseph-wasm`, native binding, WASM-specific API, filesystem-specific ephemeris handling, infrastructure-specific exception (`ExternalServiceError` là exception Infrastructure, Domain chỉ throw `EphemerisProviderError` — xem Mục 18).

**Clean Architecture / Hexagonal / DDD-lite / Ports & Adapters / DI:** đã áp dụng nhất quán toàn dự án (Architecture Spec §2), không có gì mới cần thêm cho riêng module này.

---

## 7. Integration Boundary

### 7.1 Swiss Ephemeris chịu trách nhiệm

**RAW ASTRONOMICAL DATA** — thuần túy thiên văn học, không mang ý nghĩa chiêm tinh:
- Vị trí hành tinh (longitude, latitude ecliptic, distance) tại 1 thời điểm UT + (với House) 1 tọa độ địa lý.
- Tốc độ chuyển động biểu kiến (speed, độ/ngày) — dùng để derive `isRetrograde` (nhưng **không tự** trả `isRetrograde` — đó là interpretation, xem 7.2).
- Cusp của 12 nhà (theo hệ thống nhà được yêu cầu) + Ascendant + Midheaven — tọa độ hoàng đạo thô.

### 7.2 Astrology Engine chịu trách nhiệm (`chart/domain/engine/`, đã đặc tả đầy đủ ở Natal Chart Domain Spec Mục 5.3, 13–19)

**ASTROLOGY DOMAIN INTERPRETATION** — biến raw data thành ý nghĩa chiêm tinh: gán Sign/degreeInSign (Mục 12 Domain Spec), tính `isRetrograde = speed<0` (Mục 14), gán Planet vào House (Mục 7), tính Aspect (Mục 18–19), Pattern (deferred, D-14).

**Ranh giới tuyệt đối (đúng yêu cầu Mục 7 prompt gốc "Do not mix"):** `SwissEphemerisAdapter` **không bao giờ** tự tính `Sign`/`isRetrograde`/`House`/`Aspect` — nó chỉ trả về đúng số thô Swiss Ephemeris SDK trả về, map sang shape `RawEphemerisData`/`RawHouseData` (Mục 8). Trích dẫn nguyên văn Backend Implementation Guide (Mục 18 của tài liệu đó, "Ví dụ đúng"): *"`SwissEphemerisAdapter.calculateNatal()` chỉ trả `RawEphemerisData` thô — không tự gán `Sign`/`House`"*.

### 7.3 Domain/Application/Infrastructure — bảng trách nhiệm đầy đủ

| Layer | Trách nhiệm trong ngữ cảnh Swiss Ephemeris | Vị trí code |
|---|---|---|
| Domain | Định nghĩa `IEphemerisProvider`, `EphemerisRequest`, `HouseCalculationRequest`, `RawEphemerisData`, `RawHouseData` (port + DTO thô, ngôn ngữ nghiệp vụ); Calculators tiêu thụ raw data | `chart/domain/ports/ephemeris-provider.port.ts`, `chart/domain/engine/calculators/` |
| Application | Orchestrate: gọi `IEphemerisProvider.calculateNatal()` + `.calculateHouses()` (nếu `isBirthTimeKnown`) qua `ChartBuilder`, không biết `swisseph-wasm` tồn tại | `chart/application/use-cases/create-natal-chart.usecase.ts` |
| Infrastructure | Implement `IEphemerisProvider` bằng `swisseph-wasm` thật; quản lý WASM lifecycle, file ephemeris, error translation | `chart/infrastructure/adapters/swiss-ephemeris.adapter.ts` |

---

## 8. Input Contract

**Nền tảng đã đóng băng ở Natal Chart Domain Spec Mục 22.1 (D-1 Confirmed), nay được REFINE thêm 1 lần** theo Confirmation mới nhất (không mâu thuẫn D-1 — chỉ làm rõ kiểu trả về của `calculateHouses()` thành discriminated union thay vì để ngỏ cách báo hiệu "không hội tụ" — xem lý do đầy đủ Mục 11.3). Đây là chữ ký **chính thức, cuối cùng** cho Sprint 3:

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

// MỚI — thay thế việc dùng NaN/[]/null làm implicit error signal (Mục 11.3, Confirmed)
export type HouseCalculationResult =
  | { status: 'success'; data: RawHouseData }
  | { status: 'not_convergent' };

export interface IEphemerisProvider {
  calculateNatal(request: EphemerisRequest): Promise<RawEphemerisData>;
  calculateHouses(request: HouseCalculationRequest): Promise<HouseCalculationResult>; // ĐỔI kiểu trả về — xem Mục 11.3
  calculateTransit(request: EphemerisRequest): Promise<RawEphemerisData>; // throw UnsupportedChartTypeError ở MVP
}
```

**Ghi chú tường minh về việc refine chữ ký đã "đóng băng":** D-1 (Natal Chart Domain Spec) xác lập **sự tồn tại** của `calculateHouses()` và shape `RawHouseData` — quyết định đó **không đổi**. Thay đổi duy nhất ở đây là kiểu trả về bọc `RawHouseData` trong `HouseCalculationResult` (discriminated union) thay vì trả thẳng `RawHouseData` với giá trị sentinel ngầm định (`NaN`/mảng rỗng) cho trường hợp không hội tụ. Đây là **refinement hợp lệ trong phạm vi tài liệu Swiss Ephemeris Integration** (tài liệu chi tiết hơn, chuyên trách đúng ranh giới Adapter) — không phải mở lại D-1, không cần quay lại Natal Chart Domain Spec để sửa (tài liệu đó không đủ chi tiết để chỉ định type cụ thể này, đúng đúng lý do tài liệu Integration này tồn tại).

**Quyết định A vs B (UTC only / Local + timezone) — đã đóng băng: Phương án A (UTC only).** Adapter **chỉ** nhận `utcDateTime: Date` đã quy đổi sẵn — **không** nhận local datetime + timezone string. Lý do (đúng yêu cầu "justify based on existing architecture"): Timezone Resolution là bước [3] riêng biệt trong Pipeline (Engine Spec §4, **trước** bước [4] Swiss Ephemeris Adapter) — tách trách nhiệm business-level timezone interpretation (biết IANA tzdb, biết lịch sử DST) ra khỏi Adapter, đúng Single Responsibility. Nếu Adapter nhận local time + timezone, nó sẽ phải tự làm lại việc quy đổi timezone — trùng lặp logic, vi phạm ranh giới đã vẽ ở Engine Spec §4.

**Requested celestial bodies:** Không phải tham số của `EphemerisRequest`/`calculateNatal()` — `calculateNatal()` luôn trả **toàn bộ** tập hợp thiên thể hỗ trợ (10 chuẩn + 4 optional, Mục 12) trong 1 lần gọi; việc **lọc** theo `includeOptionalPoints` của user là trách nhiệm **Application layer** (sau khi nhận `RawEphemerisData` đầy đủ, chỉ giữ lại planet cần) — **không phải** trách nhiệm Adapter/Swiss Ephemeris. Lý do: gọi Swiss Ephemeris theo từng thiên thể riêng lẻ (nhiều lần gọi SDK) tốn hiệu năng hơn 1 lần gọi trả hết rồi lọc ở tầng rẻ hơn (in-memory filter).

**Canonical representation:** đã đóng băng — input **chỉ** gồm `Date` (JS native, luôn ở UTC theo semantics `Date` chuẩn) + `{latitude, longitude}` decimal degree + (với House) `houseSystem` enum string. Không có field nào khác.

---

## 9. Date/Time Normalization

Chuỗi biến đổi **đã đóng băng đầy đủ, không phải quyết định mới của tài liệu này** — trích dẫn nguyên văn Natal Chart Domain Spec Mục 10.1 làm nguồn duy nhất:

```
BirthProfile (birthDate + birthTime + historicalTimezoneId)
  → Local Birth Datetime (wall-clock tại nơi sinh)
  → Timezone Resolution (IANA tzdb, tự chứa lịch sử DST — Engine Spec §3.2, bước [3] Pipeline)
  → UTC Datetime (đầu vào duy nhất Adapter nhận, Mục 8 ở trên)
  → [BÊN TRONG ADAPTER] Julian Day conversion (xem 9.1)
  → Swiss Ephemeris SDK call
```

### 9.1 Julian Day conversion — ranh giới sở hữu (trả lời trực tiếp "Julian Day conversion ownership" — 1 trong các Open Question gợi ý của đề bài, **đã có thể trả lời dứt khoát, không cần để Open Question**)

**Kết luận: Julian Day conversion hoàn toàn nội bộ trong `SwissEphemerisAdapter` (Infrastructure), không lộ ra port.** Suy luận trực tiếp từ chữ ký `IEphemerisProvider` đã đóng băng (Mục 8): `EphemerisRequest.utcDateTime` có kiểu `Date` (JS native), **không phải** `number` (Julian Day là số thực). Do đó domain/application layer **không bao giờ** biết khái niệm Julian Day tồn tại — Adapter tự chuyển `Date` → Julian Day UT ngay trước khi gọi hàm SDK Swiss Ephemeris (SDK Swiss Ephemeris cấp thấp — `swe_calc_ut`/`swe_houses` — nhận Julian Day, không nhận `Date` object, đây là **External Technical Fact** về chính thư viện Swiss Ephemeris, không phải quyết định AstroViet).

### 9.2 DST, historical timezone, invalid datetime, unknown/missing birth time, date-only profile, precision limitations

**Toàn bộ đã đóng băng ở Natal Chart Domain Spec Mục 10, 11** — không lặp lại chi tiết, chỉ tóm tắt điểm liên quan trực tiếp tới Adapter:

| Trường hợp | Hành vi | Ai chịu trách nhiệm |
|---|---|---|
| DST | Tự động qua IANA tzdb | Timezone Resolver (**trước** Adapter, không phải trách nhiệm Adapter) |
| Historical timezone | Dùng `historicalTimezoneId` đã lưu, không dùng offset cố định | Timezone Resolver |
| Invalid datetime | Validate **trước khi** vào Adapter (Validation module, bước [2] Pipeline) | Domain Validation, không phải Adapter |
| **Unknown birth time** (`isBirthTimeKnown=false`) | **Adapter không được gọi `calculateHouses()` — hoàn toàn không gọi**, chỉ gọi `calculateNatal()` (vẫn cần `utcDateTime` — nhưng đây là giờ **thật đã biết ngày, chỉ không biết giờ trong ngày**; xem 9.3 dưới cho trường hợp ngày cũng có thể chỉ biết 1 phần) | Application layer quyết định **có gọi `calculateHouses()` hay không** dựa trên `isBirthTimeKnown` — Adapter không tự biết field này tồn tại, chỉ đơn giản là không bị gọi |
| Date-only birth profile | Không tồn tại trong domain model hiện tại — BirthProfile luôn có `birthDate` (bắt buộc); chỉ `birthTime` mới có thể `null` khi `isBirthTimeKnown=false`. **Không có khái niệm "chỉ biết tháng/năm"** ở MVP | N/A — đã đóng băng ở BirthProfile (Sprint 2) |
| Precision limitations | `birthTime` lưu ở độ chính xác **giây** (Prisma `@db.Time`, Sprint 2 schema) — không có phần nghìn giây | N/A |

### 9.3 Khi `isBirthTimeKnown = false` — `utcDateTime` truyền vào `calculateNatal()` được tính như thế nào?

**Điểm cần làm rõ tường minh (không phải quyết định mới — suy luận trực tiếp từ Domain Spec đã Confirmed, nhưng đề bài yêu cầu chuỗi biến đổi phải "complete", nên nêu rõ ở đây):** Dù không biết giờ trong ngày, **ngày** (`birthDate`) và **địa điểm** vẫn luôn được biết (bắt buộc ở BirthProfile) — Planet vẫn cần 1 `utcDateTime` cụ thể để Swiss Ephemeris tính (không thể tính "vị trí hành tinh trong cả ngày"). Theo đúng nguyên tắc **đã Confirmed** "không gán giờ mặc định" (Natal Chart Domain Spec D-9/Conflict #1 RESOLVED) — nguyên tắc đó áp dụng cho việc **không coi giờ giả định là giờ thật để tính House/Ascendant**, nhưng **không cấm** dùng 1 giờ neo bất kỳ trong ngày để tính vị trí Planet (vốn ít nhạy cảm với sai số giờ, trừ Mặt Trăng — đã ghi nhận Mục 11.1 Domain Spec). Xác nhận: quy trình vẫn cần chọn `utcDateTime` = `birthDate` quy đổi UTC tại 1 giờ neo (ví dụ 00:00 hoặc 12:00 local trước khi quy đổi UTC) — **điểm khác biệt cốt lõi với PRD cũ (đã bác bỏ)** là: giờ neo này **chỉ dùng nội bộ để gọi `calculateNatal()`** (không lộ ra ngoài, không lưu vào snapshot như "giờ sinh"), và **tuyệt đối không dùng để gọi `calculateHouses()`** (Application layer chặn cứng cuộc gọi này khi `isBirthTimeKnown=false`, không phải Adapter tự chặn). Giá trị neo cụ thể (00:00 hay 12:00) là quyết định implementation nhỏ, không ảnh hưởng domain rule — khuyến nghị `12:00 local` (giữa ngày, giảm thiểu sai số trung bình cho Planet chuyển động chậm) nhưng **không phải quyết định bắt buộc phải chốt trước Sprint 3** vì sai số giữa 00:00 và 12:00 cho 9/10 hành tinh chuẩn là không đáng kể trong phạm vi tolerance 0.01° (D-8) — chỉ Mặt Trăng có thể bị ảnh hưởng, và đã chấp nhận rủi ro này ở D-2 (DEFERRED, không thêm cảnh báo riêng).

---

## 10. Geographic Coordinates

| Thuộc tính | Range | Sign convention | Nguồn |
|---|---|---|---|
| `latitude` | `[-90, 90]` | Dương = Bắc bán cầu, âm = Nam bán cầu | Đã đóng băng, DB Spec (`birth_profiles.latitude NUMERIC(9,6)`), kế thừa nguyên trạng vào `EphemerisRequest.coordinates.latitude` |
| `longitude` (địa lý) | `[-180, 180]` | Dương = Đông, âm = Tây | Tương tự, `NUMERIC(9,6)` |
| Precision | 6 chữ số thập phân (từ BirthProfile) | — | DB Spec |
| Định dạng truyền cho Swiss Ephemeris | Decimal degree (không phải DMS — degree/minute/second) | — | **External Technical Fact**: Swiss Ephemeris SDK (`swe_houses`, và geolocation cho topocentric nếu dùng) nhận decimal degree trực tiếp — không cần convert DMS, vì AstroViet đã lưu decimal degree xuyên suốt (không có bước convert nào cần thiết) |

**Timezone + coordinates + location name — có bắt buộc cả 3 không?** `timezone` (qua `historicalTimezoneId`) và `coordinates` (`latitude`/`longitude`) đều **bắt buộc** ở BirthProfile (Sprint 2, `NOT NULL`) — Adapter luôn nhận đủ 2. `location name` (`placeName`) **không** được Adapter dùng — chỉ tồn tại ở tầng BirthProfile/snapshot cho mục đích hiển thị, không phải input tính toán.

**Validation rule:** Đã validate **trước khi** vào Adapter (Domain Validation module, Natal Chart Domain Spec Mục 10.5 — Defense in Depth, validate lại ở Engine boundary dù đã validate ở BirthProfile). Adapter **không tự validate lại lần 3** — tin tưởng input đã qua 2 lớp validate trước đó (Application → Domain Validation → Adapter là lớp trong cùng, không cần lặp lại).

---

## 11. House System Integration

### 11.1 Mapping — domain enum → Swiss Ephemeris house-system code (RESOLVED — OQ-1, OQ-2)

| Domain `HouseSystem` | Swiss Ephemeris house-system code | Ghi chú |
|---|---|---|
| `Placidus` | `'P'` | **External Technical Fact** — mã ký tự chuẩn Swiss Ephemeris cho Placidus (không phải quyết định AstroViet — hằng số cố định của chính thư viện) |
| `WholeSign` | **`'W'`** — **CONFIRMED (OQ-1)** | Swiss Ephemeris hỗ trợ **native Whole Sign calculation** qua mã `'W'` — không cần Domain tự tính lại từ Ascendant như phương án dự phòng đã cân nhắc trước đó |

**Nơi mapping này sống:** `chart/infrastructure/adapters/swiss-ephemeris.adapter.ts` (hoặc 1 file constant riêng `chart/infrastructure/adapters/house-system.mapping.ts` nếu bảng lớn hơn) — **tuyệt đối không** ở Domain (đúng yêu cầu "Do not hard-code Swiss Ephemeris codes in domain entities", Mục 11 prompt gốc). Domain chỉ biết enum `'Placidus' | 'WholeSign'`.

### 11.2 Cách Whole Sign được xử lý — CONFIRMED (OQ-2)

```
Domain HouseSystem.WholeSign
        ↓
Adapter mapping (house-system.mapping.ts)
        ↓
Swiss Ephemeris house code "W"
```

**Quyết định cuối cùng:** Adapter gọi thẳng `swe_houses()` với mã `'W'` khi `houseSystem = 'WholeSign'` — **không** còn phương án dự phòng "Adapter chỉ lấy Ascendant, Domain tự chia 12 Sign" (đã cân nhắc ở draft trước, nay bị thay thế vì Swiss Ephemeris hỗ trợ native). `RawHouseData.cusps` trả về **đã đúng 12 giá trị Whole Sign thật** từ SDK, không phải giá trị Domain tự suy ra.

**Ranh giới kiến trúc vẫn giữ nguyên đúng nguyên tắc Mục 7.2** (đúng lý do Confirmation nêu rõ): **Domain vẫn sở hữu semantics** — `HouseSystem` enum, quyết định "Whole Sign nghĩa là gì về mặt chiêm tinh" vẫn ở Domain (Natal Chart Domain Spec Mục 15.4 vẫn là nguồn định nghĩa domain-level của Whole Sign, không bị thay thế) — **Adapter chỉ dịch (translate)** lựa chọn đó sang khả năng cụ thể mà provider (Swiss Ephemeris) hỗ trợ. Việc Swiss Ephemeris tình cờ **cũng** tính đúng Whole Sign native không có nghĩa Domain "giao quyền" định nghĩa Whole Sign cho Adapter — nếu tương lai đổi provider (ví dụ 1 thư viện ephemeris khác không hỗ trợ Whole Sign native), Domain Spec Mục 15.4 (công thức chia đều 12 Sign từ Ascendant) vẫn là **fallback định nghĩa chuẩn** để implement lại ở Adapter mới, không cần sửa Domain.

### 11.3 Placidus Non-Convergence — Typed Result, không dùng sentinel ngầm định (CONFIRMED — OQ-3, thay thế hoàn toàn cách tiếp cận cũ)

**Quyết định cuối cùng:** **Không dùng** `NaN`, mảng rỗng `[]`, hay `null` làm tín hiệu lỗi ngầm định (implicit error signal) cho trường hợp Placidus không hội tụ ở vĩ độ cực (≥66.5°, Natal Chart Domain Spec Mục 15.3). Thay vào đó, `calculateHouses()` trả về **kiểu discriminated union tường minh** (đã cập nhật vào chữ ký chính thức, Mục 8):

```typescript
type HouseCalculationResult =
  | { status: 'success'; data: RawHouseData }
  | { status: 'not_convergent' };
```

**Luồng xử lý:** Adapter phát hiện tín hiệu không hội tụ từ Swiss Ephemeris SDK (cơ chế phát hiện cụ thể — SDK trả `NaN` nội bộ, throw riêng, hay flag đặc biệt — **vẫn là technical verification item, xem OQ-3 phần "cách phát hiện"** dưới) → Adapter **không** để `NaN`/giá trị bất thường đó lọt ra ngoài port → Adapter tự diễn giải tín hiệu nội bộ đó và trả `{ status: 'not_convergent' }` tường minh. **Application layer** nhận `HouseCalculationResult`, `switch` theo `status`: nếu `'not_convergent'` → set `houses=[]`, `angles=[]`, `isHouseDataAvailable=false`, thêm `Warning.code='HOUSE_SYSTEM_NOT_CONVERGING'` (đã đóng băng ở Natal Chart Domain Spec/Architecture Spec §9.2 — vẫn giữ nguyên là "lỗi mềm", không throw exception) — nếu `'success'` → tiếp tục pipeline bình thường với `data: RawHouseData`.

**Lý do (đúng Confirmation):** tránh để các layer downstream (`HouseCalculator`, Application) phải tự đoán ý nghĩa của `NaN` hay mảng rỗng — 1 mảng rỗng về mặt kỹ thuật **cũng** là giá trị hợp lệ tình cờ trong nhiều ngôn ngữ lập trình (dễ nhầm với "0 phần tử vì lý do khác"), trong khi discriminated union buộc **compiler TypeScript** phải xử lý cả 2 nhánh tường minh — loại bỏ hoàn toàn lớp ambiguity giữa "lỗi" và "dữ liệu hợp lệ nhưng rỗng".

**Phạm vi còn lại của OQ-3 (technical verification, không phải design decision nữa):** cơ chế **nội bộ** mà Adapter dùng để nhận biết SDK đang báo hiệu "không hội tụ" (đọc SDK trả gì cụ thể — exception, NaN, hay flag) — đây **vẫn** cần verify thật khi cài `swisseph-wasm`, nhưng giờ đây chỉ ảnh hưởng **implementation nội bộ của chính Adapter** (cách Adapter tự nhận biết), không còn ảnh hưởng tới **hợp đồng (contract)** giữa Adapter và phần còn lại hệ thống — hợp đồng đã tường minh 100% (Mục 38 cập nhật trạng thái, không còn ảnh hưởng thiết kế Domain/Application).

---

## 12. Celestial Body Mapping

Bảng mapping đầy đủ theo đúng yêu cầu Mục 12 prompt gốc. Cột "Swiss Ephemeris Identifier" dùng **hằng số chuẩn SE_* của thư viện** (External Technical Fact — tên hằng số cố định của chính Swiss Ephemeris SDK, không phải lựa chọn AstroViet):

| Domain `PlanetName` | Swiss Ephemeris Identifier | Calculation method | Expected output | Bắt buộc/Optional |
|---|---|---|---|---|
| `Sun` | `SE_SUN` (0) | `swe_calc_ut()` | longitude, latitude, distance, speed | Bắt buộc |
| `Moon` | `SE_MOON` (1) | `swe_calc_ut()` | như trên | Bắt buộc |
| `Mercury` | `SE_MERCURY` (2) | `swe_calc_ut()` | như trên | Bắt buộc |
| `Venus` | `SE_VENUS` (3) | `swe_calc_ut()` | như trên | Bắt buộc |
| `Mars` | `SE_MARS` (4) | `swe_calc_ut()` | như trên | Bắt buộc |
| `Jupiter` | `SE_JUPITER` (5) | `swe_calc_ut()` | như trên | Bắt buộc |
| `Saturn` | `SE_SATURN` (6) | `swe_calc_ut()` | như trên | Bắt buộc |
| `Uranus` | `SE_URANUS` (7) | `swe_calc_ut()` | như trên | Bắt buộc |
| `Neptune` | `SE_NEPTUNE` (8) | `swe_calc_ut()` | như trên | Bắt buộc |
| `Pluto` | `SE_PLUTO` (9) | `swe_calc_ut()` | như trên | Bắt buộc |
| `Chiron` | `SE_CHIRON` (15) | `swe_calc_ut()` | như trên | Optional (`includeOptionalPoints`) |
| `Lilith` | `SE_MEAN_APOG` (Mean Black Moon Lilith) — **CONFIRMED (OQ-4)** | `swe_calc_ut()` | như trên | Optional |
| `NorthNode` | `SE_MEAN_NODE` (Mean Node) — **CONFIRMED (OQ-5)** | `swe_calc_ut()` | như trên | Optional |
| `SouthNode` | Derived — `SouthNode.longitude = (NorthNode.longitude + 180) mod 360` (luôn đối diện North Node, **không gọi Swiss Ephemeris riêng**) | Tính từ `NorthNode` | longitude only (không có `speed`/`latitude` độc lập — dùng chung dấu hiệu retrograde của North Node) | Optional |

**Lý do 5 hàng đầu (10 hành tinh chuẩn) không có Decision Required:** đây là 10 thiên thể vật lý không mơ hồ, mỗi thiên thể chỉ có 1 mã SE_* trong Swiss Ephemeris SDK — không có lựa chọn thay thế nào cần quyết định.

**Lilith/North Node — đã CONFIRMED, không còn Decision Required:**

- **Lilith = Mean Black Moon Lilith (`SE_MEAN_APOG`)** — không dùng `SE_OSCU_APOG` (Osculating/True). Lý do: convention phổ biến nhất trong phần mềm chiêm tinh thương mại chủ đạo, deterministic hơn (Mean không dao động mạnh như Osculating), phù hợp mức độ ổn định mong muốn cho MVP.
- **Node = Mean Node (`SE_MEAN_NODE`)** — không dùng `SE_TRUE_NODE`. Lý do tương tự: convention ổn định, phù hợp MVP.

**Đã cập nhật vào mapping table chính thức ở trên** — không còn ô nào đánh dấu "Decision Required" trong bảng celestial body.

**Error behavior khi thiên thể không hỗ trợ:** nếu domain gửi `PlanetName` không có trong bảng trên (về mặt lý thuyết không thể xảy ra vì enum `PlanetName` đã đóng kín 14 giá trị ở Domain Spec) → `UnsupportedCelestialBodyError` (Domain error, Mục 18) — đây là lỗi lập trình (bug), không phải input xấu từ user.

---

## 13. Calculation Flags

Đúng yêu cầu Mục 13 prompt gốc — **không bật flag tùy tiện**, mỗi flag phải có lý do.

| Flag | Bật/Tắt | Lý do | Ai quyết định |
|---|---|---|---|
| **High precision** (`SEFLG_SWIEPH` — dùng file `.se1` chính xác cao thay vì thuật toán Moshier xấp xỉ) | **BẬT** | Đây là lý do tồn tại của việc đóng gói file ephemeris `.se1` vào Docker image (Architecture Spec §22.3) — nếu không bật flag này, việc có file `.se1` trở nên vô nghĩa; PRD NFR yêu cầu "độ chính xác thiên văn" đã kiểm chứng | Đã ngầm định qua quyết định đóng gói file — không phải quyết định mới, chỉ làm tường minh |
| **Speed calculation** (`SEFLG_SPEED`) | **BẬT** | Bắt buộc — `RawEphemerisData.planets[].speed` là field bắt buộc trong contract đã đóng băng (Mục 8), dùng để derive `isRetrograde` (Domain Spec Mục 14) | Domain contract đã quyết định gián tiếp qua yêu cầu field `speed` |
| **Apparent position** (mặc định của `swe_calc_ut`, không phải flag riêng cần bật thêm) | **Mặc định — không cần flag đặc biệt** | `swe_calc_ut()` (bản "UT" — dùng Universal Time, không phải Ephemeris Time) trả về **apparent geocentric position** theo mặc định — đúng chuẩn dùng trong chiêm tinh học phương Tây hiện đại (không cần "true"/geometric position, khác biệt rất nhỏ do ánh sáng đi chậm) | **External Technical Fact** — hành vi mặc định của SDK, không phải cấu hình AstroViet chọn |
| **Heliocentric vs Geocentric** | **Geocentric (mặc định)** | Chiêm tinh học phương Tây luôn dùng Geocentric (nhìn từ Trái Đất) — đây là **quy ước chiêm tinh học phổ quát**, không phải điều gì cần "quyết định" ở cấp dự án, tương đương việc không cần hỏi "có nên dùng Tropical hay không dùng Zodiac gì cả" | Đã ngầm định — không cần Open Question |
| **Topocentric vs Geocentric** | **Geocentric** | Topocentric (tính từ vị trí quan sát cụ thể trên bề mặt Trái Đất, có visual parallax) chỉ khác biệt đáng kể cho Mặt Trăng ở độ chính xác cao — chiêm tinh học Natal Chart tiêu chuẩn dùng Geocentric thuần túy (tâm Trái Đất), không dùng Topocentric. **Không có tài liệu nào yêu cầu Topocentric** | Suy luận từ quy ước ngành, **không phải Decision Required** — nhưng nếu người review muốn khác đi, đây là 1 flag đơn giản có thể bật sau, không phá vỡ kiến trúc |
| **True vs Mean Node** | **Chưa đóng băng** | Xem OQ-5 |
| **Sidereal vs Tropical** | **Tropical (đã đóng băng, Domain Spec Mục 12 — Natal Chart Domain Spec Mục 12)** | `SEFLG_SIDEREAL` **không bật** — không cần Ayanamsa | Đã Confirmed ở Natal Chart Domain Spec |
| **Nutation, aberration** | **Mặc định SDK (đã bao gồm trong apparent position)** | Đây là hiệu chỉnh thiên văn học tiêu chuẩn luôn áp dụng cho apparent position — không phải flag rời cần AstroViet tự quyết định bật/tắt riêng | **External Technical Fact** |

**Bảng flag cụ thể truyền cho `swe_calc_ut()`** (tên hằng số chính xác, ví dụ `SEFLG_SWIEPH | SEFLG_SPEED`) **là chi tiết implementation, không phải domain decision** — ghi vào code comment tại Adapter, không cần lặp lại business rule ở đây mỗi khi flag thay đổi.

---

## 14. Zodiac/Reference Frame

**Đã đóng băng — Tropical Zodiac.** Trích dẫn trực tiếp Natal Chart Domain Spec Mục 12 (chính nó trích từ Domain Spec §5.5 gốc) — **không lặp lại chi tiết**, chỉ xác nhận điểm liên quan tới Adapter: `SEFLG_SIDEREAL` không được set trong bất kỳ lời gọi nào tới Swiss Ephemeris SDK. Không có Ayanamsa nào cần cấu hình.

**Longitude normalization, 0°–360°, sign calculation:** đã đóng băng đầy đủ ở Natal Chart Domain Spec Mục 12, 21 — Adapter **không tự normalize** (Swiss Ephemeris SDK vốn đã trả `longitude` trong `[0,360)` theo chuẩn của chính nó — **External Technical Fact**, không cần AstroViet tự modulo lại, nhưng Domain Calculator vẫn nên tự normalize lại 1 lần cho chắc chắn — đúng nguyên tắc Defense in Depth đã áp dụng xuyên suốt, không tin tưởng mù quáng dữ liệu ngoài dù thư viện uy tín).

---

## 15. Precision Policy

**Đã đóng băng hoàn toàn ở tầng persistence** (Natal Chart Domain Spec Mục 20, trích từ DB Design Spec §5.7–5.11) — không lặp lại bảng chi tiết. Bổ sung riêng cho ranh giới Adapter:

| Giai đoạn | Precision | Ai làm tròn |
|---|---|---|
| Swiss Ephemeris SDK trả về | `float64`/`double` (chuẩn C library, WASM cũng giữ `double`) | Không ai — giá trị thô |
| `RawEphemerisData`/`RawHouseData` (Adapter output) | `float64`, **chưa làm tròn** | Adapter **không làm tròn** — chỉ convert kiểu dữ liệu (WASM có thể trả về dạng khác `number` JS thuần, ví dụ `Float64Array` — Adapter chuyển thành `number` JS chuẩn, không đổi độ chính xác) |
| Domain Calculator → Chart Builder | `float64` xuyên suốt, làm tròn **đúng 1 lần** khi ráp Chart cuối cùng | Domain (Chart Builder), **không phải** Adapter |

**"Deterministic serialization"** (đề bài Mục 15 yêu cầu): đảm bảo bằng cách Adapter **không** tự ý format số thành string ở bất kỳ bước nào (ví dụ `toFixed()`) — giữ nguyên kiểu `number` JS xuyên suốt tới khi Chart Builder làm tròn về `NUMERIC` DB. Tránh trường hợp 2 lần convert số→string→số gây sai số tích lũy khác nhau giữa 2 lần chạy.

---

## 16. Retrograde Detection

**Đã đóng băng — Natal Chart Domain Spec Mục 14 (Confirmed, không mở lại):**

```
isRetrograde = (speed < 0)
```

- **Không có threshold** — so sánh dấu thuần túy.
- **Không có "station"/zero-speed state riêng** — D-12 (Deferred, Confirmed) đã xác nhận không thêm trạng thái trung gian này ở Sprint 3.
- **`speed = 0` chính xác tuyệt đối:** về mặt toán học cực hiếm (floating-point gần như không bao giờ ra đúng `0.0`) nhưng nếu xảy ra, theo công thức `speed < 0` (không phải `<=`) → `isRetrograde = false` (giữ nguyên logic nhị phân đơn giản, không cần xử lý đặc biệt — đây là hệ quả tự nhiên của công thức đã Confirmed, không phải quyết định mới).
- **Ai tính:** Adapter **không tính** `isRetrograde` — chỉ trả `speed` thô trong `RawEphemerisData`. `PlanetCalculator` (Domain) áp dụng công thức trên.
- **Bất biến Sun/Moon không bao giờ retrograde** — assertion ở Domain (INV-14, Natal Chart Domain Spec Mục 25), **không phải** trách nhiệm Adapter kiểm tra (Adapter chỉ trả raw data trung thực, kể cả nếu do lỗi SDK trả `speed<0` cho Sun — đó là lúc Domain phát hiện `DataIntegrityError`, không phải Adapter tự "sửa" dữ liệu).

---

## 17. Aspect Calculation Boundary

**Trả lời trực tiếp A/B của đề bài Mục 17: Phương án B** — Aspect **hoàn toàn** tính bởi AstroViet Astrology Engine (Domain layer, `AspectCalculator`) dùng longitude đã có từ `RawEphemerisData`, **không phải** Swiss Ephemeris tự tính Aspect (Swiss Ephemeris SDK về bản chất **không có** khái niệm Aspect — đây là **External Technical Fact**, SDK chỉ tính vị trí thiên thể thô, không có hàm nào tên "aspect calculation").

**Toàn bộ chi tiết (angular separation, normalization, aspect detection, 5 aspect hỗ trợ, orb policy, applying/separating, wraparound) đã đóng băng đầy đủ và Confirmed ở Natal Chart Domain Spec Mục 18–19** — bao gồm cả công thức wrap-aware D-6 vừa Confirmed. **Không lặp lại** ở đây (đúng Rule 4 — không duplicate spec khác không cần thiết) — chỉ xác nhận: `SwissEphemerisAdapter` **hoàn toàn không tham gia** vào bước tính Aspect, kể cả gián tiếp — Aspect Calculator chỉ đọc `Planet[].longitude` đã được `PlanetCalculator` derive từ `RawEphemerisData`, không gọi lại Adapter.

---

## 18. Error Handling

### 18.1 Taxonomy đầy đủ

| Category | Error cụ thể | Tầng throw | Tầng bắt/translate |
|---|---|---|---|
| **Domain errors** | `UnsupportedHouseSystemError`, `UnsupportedCelestialBodyError` (lý thuyết, không có code path thật — Mục 12), `InvalidCoordinateError`, `InvalidDateTimeError` (đã đóng băng, Natal Chart Domain Spec Mục 26) | Domain Validation (trước Adapter) | Error Handler Middleware → RFC7807 |
| **Application errors** | `MissingRequiredFieldError` (nếu request thiếu field bắt buộc trước khi tới Application) | Application layer (Zod validation, trước khi gọi Use Case) | Error Handler Middleware |
| **Infrastructure errors** | `EphemerisInitializationError` (WASM/file load fail lúc khởi động), `EphemerisFileNotFoundError`, `WasmInitializationError`, `EphemerisCalculationFailedError` (SDK throw lỗi runtime lúc tính), `MalformedEphemerisResultError` (SDK trả dữ liệu không đúng shape kỳ vọng — NaN, undefined) | `SwissEphemerisAdapter` | **Translate thành `ExternalServiceError`** (đã đóng băng, Backend Implementation Guide §19) trước khi throw ra khỏi Infrastructure |
| **External/system errors** | Filesystem failure (đọc file `.se1` lỗi ổ đĩa), runtime failure (WASM crash) | OS/Node runtime | Bắt ở cùng `try/catch` như Infrastructure errors, cùng translate thành `ExternalServiceError` |

### 18.2 Translation pattern — đã đóng băng, trích dẫn nguyên văn Backend Implementation Guide §19

```typescript
// infrastructure/adapters/swiss-ephemeris.adapter.ts
export class SwissEphemerisAdapter implements IEphemerisProvider {
  async calculateNatal(request: EphemerisRequest): Promise<RawEphemerisData> {
    try {
      const raw = await swissephWasm.calculate(request.utcDateTime, request.coordinates);
      return mapToRawEphemerisData(raw);
    } catch (err) {
      logger.error({ module: 'chart', err }, 'Ephemeris calculation failed');
      throw new ExternalServiceError('EPHEMERIS_PROVIDER_ERROR', 'Không thể tính toán vị trí thiên thể');
    }
  }
  async calculateTransit(): Promise<RawEphemerisData> { throw new ValidationError('UNSUPPORTED_CHART_TYPE', 'Transit chưa được hỗ trợ'); }
}
```

**⚠️ Lưu ý staleness của ví dụ gốc (không phải mâu thuẫn cần Open Question — chỉ là ví dụ minh họa cần cập nhật khi code hóa):** Ví dụ trên trong Backend Implementation Guide viết **trước khi** D-1 (Mục 8 tài liệu này) được Confirmed — chưa có `calculateHouses()`. Khi code hóa Sprint 3, `calculateHouses()` **phải áp dụng đúng cùng pattern try/catch + log + `ExternalServiceError`** như `calculateNatal()` — không phải case mới cần thiết kế lại, chỉ là ví dụ minh họa gốc chưa cập nhật theo interface mới nhất.

**Swiss Ephemeris-specific error KHÔNG BAO GIỜ lộ ra API** (đúng yêu cầu Mục 18 prompt gốc) — `ExternalServiceError` map sang RFC7807 với `title`/`detail` chung chung tiếng Việt (đã có sẵn ví dụ: *"Không thể tính toán vị trí thiên thể"*), không lộ raw error message/stack trace của `swisseph-wasm` ra response.

### 18.3 Error mềm (không throw) — nhắc lại ranh giới, đã cập nhật theo Typed Result (Mục 11.3)

`HouseSystemNotConvergingError`/`HOUSE_SYSTEM_NOT_CONVERGING` — **đã đóng băng KHÔNG throw** (Natal Chart Domain Spec Mục 26). Khi Adapter phát hiện tín hiệu "không hội tụ" từ Swiss Ephemeris SDK, Adapter trả về `{ status: 'not_convergent' }` — **giá trị thành công về mặt kỹ thuật gọi hàm** (`Promise` resolve, không reject), chỉ khác `status` field — **không throw exception nào**. Application layer `switch` theo `status`, tự quyết định set `Warning.code='HOUSE_SYSTEM_NOT_CONVERGING'` — Adapter không tự quyết định business behavior "không hội tụ nghĩa là gì", chỉ báo cáo trung thực trạng thái tính toán.

---

## 19. Ephemeris File Management

### 19.1 Xác nhận lại các quyết định đã đóng băng (Architecture Spec §22.3, §18.3) — không mở lại

- **`swisseph-wasm` cho MVP** (không phải native binding) — Confirmed, ADR 22.1.
- **File `.se1` COPY trực tiếp vào Docker image** (không dùng Docker volume riêng) — Confirmed, ADR 22.3, lý do gốc: static data, MVP scale, đơn giản hóa deploy. **Cập nhật quan trọng theo Confirmation mới nhất (Mục 19.2 dưới):** ADR 22.3 vẫn đúng tinh thần ("không tải động runtime, không phụ thuộc network lúc chạy") nhưng cách hiện thực hóa cụ thể đã đổi — không phải "COPY từ `backend/ephemeris-data/` do AstroViet tự tạo/tải về", mà là "dữ liệu ephemeris đã có sẵn bên trong chính package `swisseph-wasm`, tự động đi theo khi `npm install`, image build ra vốn đã COPY toàn bộ `node_modules` (bao gồm data bundled) mà không cần thêm bước COPY riêng nào".
- **Deploy: Docker Compose là phương án chính; PM2 là dự phòng khi VPS thiếu tài nguyên — cả 2 đều bắt buộc đúng 1 process/instance** (Quyết định 22.5) — **đính chính khung hiểu của đề bài gốc** (Mục 19 prompt gốc nói "Docker, ephemeris files copied directly into the image, PM2 with one process" như thể PM2 là lựa chọn mặc định duy nhất — thực tế đã đóng băng: Docker Compose **chính**, PM2 chỉ **dự phòng**; cả 2 nhánh đều ràng buộc **1 process** — chi tiết này quan trọng cho Mục 20 WASM Lifecycle: dù chọn nhánh nào, luôn đảm bảo đúng 1 process, không cần thiết kế cho multi-process/cluster).

### 19.2 Directory structure & data source — CONFIRMED (OQ-6, OQ-7, OQ-10), thay thế hoàn toàn đề xuất draft trước

**Phát hiện quan trọng làm thay đổi quyết định:** `swisseph-wasm` (npm package) **đã bundle sẵn ephemeris data bên trong chính package** — đây là **External Technical Fact** về hành vi thật của package (không phải giả định) đã được xác nhận. Điều này vô hiệu hóa lý do tồn tại của đề xuất draft trước (tự tạo `backend/ephemeris-data/`, tự tải/commit file `.se1` riêng).

**Quyết định cuối cùng:**

> MVP **không** runtime-download ephemeris files. Ưu tiên sử dụng **deterministic bundled data của pinned `swisseph-wasm` version** (đi kèm sẵn trong package, nằm trong `node_modules/swisseph-wasm/` sau `npm install`). **Không tạo** thư mục `backend/ephemeris-data/` theo mặc định — chỉ tạo nếu 1 technical spike cụ thể chứng minh MVP cần 1 dataset khác với dataset đã bundle sẵn (ví dụ phạm vi năm không đủ, độ chính xác không đạt).

**Lý do (đúng Confirmation):** tránh duplicate data (bundled data + custom data cùng tồn tại là lãng phí và dễ gây nhầm lẫn "dùng bộ nào"), tránh build phụ thuộc network (không cần `curl`/tải file rời trong lúc build hay lúc chạy), tăng reproducibility (data đã pin cứng theo đúng version `swisseph-wasm` trong lockfile — không có nguồn thứ 2 nào có thể lệch phiên bản).

**Hệ quả cụ thể:**
- **Không** cần thêm dòng `COPY ephemeris-data/` nào vào `Dockerfile` — `COPY package*.json` + `npm ci` (đã có sẵn trong Dockerfile hiện tại) tự động mang theo bundled data qua `node_modules`.
- **Không** cần biến môi trường `EPHEMERIS_DATA_PATH` do AstroViet tự định nghĩa (Mục 33 cập nhật) — Adapter dùng đường dẫn nội bộ mà chính `swisseph-wasm` cung cấp/tự quản lý (package tự biết data của chính nó nằm ở đâu).
- **Startup validation** (vẫn giữ nguyên tinh thần fail-fast) — thay vì "kiểm tra thư mục `EPHEMERIS_DATA_PATH` tồn tại", đổi thành "gọi 1 lần thử `swisseph-wasm` init lúc bootstrap, xác nhận package tự báo cáo sẵn sàng (không lỗi thiếu data nội bộ)" — vẫn fail-fast đúng nguyên tắc cũ, chỉ khác đối tượng kiểm tra.
- **Phạm vi năm hỗ trợ (dataset boundary):** **CONFIRMED (OQ-6)** — MVP nhắm dùng dataset phủ khoảng **1800–2399 CE** (đủ cho phạm vi người dùng thực tế hiện tại, tránh cam kết phạm vi quá rộng không cần thiết) — nhưng **biên chính xác cuối cùng phải verify theo đúng dataset thật mà `swisseph-wasm` phiên bản được pin thực sự bundle** (package có thể bundle phạm vi khác — rộng hơn hoặc hẹp hơn — cần đọc tài liệu/test thật của package trước khi xác nhận số chính xác cuối cùng dùng cho validate `birthDate` range ở tầng Domain, nếu cần bổ sung 1 range check mới — hiện Natal Chart Domain Spec Mục 10.7 chỉ có biên trên `< ngày hiện tại`, chưa có biên dưới cứng; nếu dataset bundled có biên dưới hẹp hơn 1800, đây sẽ là 1 constraint kỹ thuật cần phản ánh ngược lại Domain Validation — xem OQ-6 phần "follow-up" ở Mục 38).

**Nếu technical spike sau này chứng minh cần dataset riêng** (ví dụ cần phạm vi năm rộng hơn dataset bundled, hoặc cần độ chính xác cao hơn) — lúc đó mới quay lại thiết kế `backend/ephemeris-data/` như đề xuất draft cũ (cấu trúc thư mục, COPY vào Docker, biến môi trường `EPHEMERIS_DATA_PATH`) — giữ nguyên toàn bộ thiết kế đó làm **phương án dự phòng đã có sẵn**, không cần thiết kế lại từ đầu nếu tình huống này xảy ra, chỉ là **không áp dụng ngay bây giờ** cho MVP.

---

## 20. WASM Runtime Lifecycle

### 20.1 Initialization timing — Eager, tại composition root

**Khuyến nghị (không phải "chưa biết"):** Khởi tạo WASM runtime **eager, 1 lần duy nhất lúc app bootstrap** (`composition-root.ts`), **không** lazy-init lúc request đầu tiên tới. Lý do: (1) WASM init có chi phí cố định (load `.se1` file, parse binary) — trả chi phí này 1 lần lúc khởi động thay vì làm chậm request đầu tiên của user thật; (2) khớp đúng nguyên tắc "Startup validation" (Mục 19.2) — nếu file ephemeris lỗi, phát hiện ngay lúc `docker compose up`, không phải lúc user đầu tiên gọi API.

### 20.2 Singleton vs per-request — Singleton, đúng 1 instance cho toàn bộ process

**Khuyến nghị:** `SwissEphemerisAdapter` (và WASM module nó bọc) là **singleton trong `composition-root.ts`** — 1 instance dùng chung cho mọi request trong suốt vòng đời process. **Không tạo WASM runtime mới cho mỗi request** (đúng cảnh báo tường minh Mục 20 prompt gốc: *"must not accidentally create a new expensive WASM runtime for every API request"*).

**Cơ sở cho phép singleton an toàn:** Đã xác nhận ở Mục 19.1 — hệ thống **luôn đúng 1 process/instance** (không cluster mode, dù Docker Compose hay PM2) — do đó không có vấn đề "singleton conflict giữa nhiều process" (mỗi process có singleton riêng của chính nó, không cần chia sẻ state qua process — giống hệt lý do `InMemoryCacheAdapter` an toàn ở MVP, Quyết định 22.5).

### 20.3 Concurrency, state isolation, thread safety — CONFIRMED (OQ-8): luôn serialize, không chờ verify

**Quyết định cuối cùng:** MVP **serialize toàn bộ calculation access vào SwissEph instance** — bất kể kết quả verify concurrency-safety thật của `swisseph-wasm` ra sao. Không còn 2 kịch bản rẽ nhánh như draft trước — chỉ 1 kịch bản duy nhất: **luôn** đặt 1 lớp serialize request (hàng đợi đơn giản trong-process, ví dụ `p-queue` hoặc tương đương — **không phải Redis/message queue**, chỉ serialize call trong cùng 1 Node process) trước khi gọi WASM, đảm bảo tại 1 thời điểm chỉ có đúng 1 lời gọi tính toán đang chạy vào instance WASM.

**Lý do (đúng Confirmation):** an toàn hơn khi **chưa chứng minh được** concurrency safety thật của package — thay vì tốn công verify sâu hành vi nội bộ WASM (rủi ro cao, tốn thời gian, kết quả có thể thay đổi giữa các version) rồi mới quyết định có cần serialize hay không, **mặc định serialize luôn** là lựa chọn phòng thủ hợp lý, chi phí thấp (Swiss Ephemeris tính toán vốn đã rất nhanh — mili-giây, Mục 22 — nên serialize không tạo bottleneck đáng kể ở quy mô MVP).

**Hệ quả:** OQ-8 gốc (câu hỏi "có an toàn concurrent không") **không còn là BLOCKING decision** — quyết định kiến trúc đã chốt độc lập với câu trả lời đó. Việc verify concurrency-safety thật của `swisseph-wasm` vẫn có giá trị tham khảo lâu dài (ví dụ để biết có thể **bỏ** lớp serialize trong tương lai nếu cần tối ưu hiệu năng khi tải cao) nhưng không còn chặn thiết kế Sprint 3.

### 20.4 Resource cleanup, failure recovery, test isolation

- **Resource cleanup:** WASM runtime sống suốt vòng đời process — không cần cleanup thủ công giữa các request (khác biệt với việc mở/đóng DB connection per-request). Cleanup chỉ cần khi process shutdown (Node tự giải phóng memory khi process kết thúc — không cần logic đặc biệt).
- **Failure recovery:** Nếu 1 lần gọi tính toán thất bại (ví dụ input biên dị thường gây lỗi runtime WASM), **không** restart toàn bộ WASM instance cho request tiếp theo — chỉ throw lỗi cho request đó (đã translate qua `ExternalServiceError`, Mục 18), instance vẫn tiếp tục phục vụ request khác. Nếu WASM init ban đầu thất bại (Mục 20.1) → toàn bộ app không khởi động được (fail-fast, không phải failure recovery lúc runtime).
- **Test isolation:** Unit/Component test dùng **mock `IEphemerisProvider`** (không khởi tạo WASM thật, xem Mục 26) — không có vấn đề "chia sẻ state WASM giữa các test". Adapter Test (test riêng cho `SwissEphemerisAdapter` thật) có thể dùng chung 1 instance WASM cho cả suite (khởi tạo 1 lần ở `beforeAll`, đúng nguyên tắc singleton — tính toán là pure/deterministic nên không lo trạng thái rò rỉ giữa test cases).

---

## 21. Determinism

Kế thừa định nghĩa đã Confirmed ở Natal Chart Domain Spec Mục 24 — **bổ sung riêng phần thuộc trách nhiệm Adapter/tầng tích hợp** (đề bài Mục 21 yêu cầu xét thêm "ephemeris version, library version, runtime differences" — các khía cạnh này thuộc đúng phạm vi tài liệu này, không phải Domain Spec):

| Yếu tố ảnh hưởng determinism | Kiểm soát bởi | Trạng thái |
|---|---|---|
| Ephemeris dataset/version (file `.se1` cụ thể) | Đóng gói cố định trong Docker image (Mục 19) | Cố định trong 1 lần build image — nếu đổi file `.se1`, phải bump `engineVersion` (đã Confirmed D-7 — `engineVersion` là định danh tổng hợp bao gồm cả phần này) |
| `swisseph-wasm` library version | `package.json` pin version cụ thể (không dùng `^`/`~` cho phép tự động minor/patch upgrade — best practice chung, không phải riêng module này) | **Cần OQ-9 xác nhận version cụ thể** trước khi cài |
| Calculation flags | Hard-code trong `SwissEphemerisAdapter` (Mục 13), không đọc từ config/DB | Cố định theo code, thay đổi = deploy version mới = bump `engineVersion` |
| Timezone normalization | IANA tzdb version (đóng gói theo Node.js runtime/OS — **không phải AstroViet tự quản lý**) | **External Technical Fact** — Node.js `Intl`/hệ điều hành cập nhật tzdb định kỳ; nếu tzdb đổi (ví dụ 1 quốc gia đổi múi giờ lịch sử — hiếm nhưng có tiền lệ), kết quả UTC quy đổi có thể đổi theo cho ngày sinh lịch sử liên quan. Đây là rủi ro **chấp nhận được** ở MVP (không có cơ chế pin tzdb version riêng), ghi nhận là giới hạn đã biết, không phải bug |
| Floating point/runtime differences (WASM chạy trên môi trường khác nhau — dev máy local vs Docker container Linux) | WASM theo thiết kế chạy **cùng 1 cách trên mọi platform** (đây chính là lý do chọn WASM thay vì native binding — native C library có thể có sai số nhỏ khác nhau giữa compiler/OS, WASM thì không) | **External Technical Fact tích cực** — 1 lý do ủng hộ quyết định WASM đã Confirmed (Mục 19.1), không phải rủi ro cần giảm thiểu thêm |
| Rounding | Đã đóng băng — làm tròn đúng 1 lần ở Chart Builder (Mục 15) | Không phải rủi ro của Adapter |

**Kết luận Determinism:** với `engineVersion` cố định (bao gồm cả ephemeris dataset + library version + calculation flags, theo D-7 đã Confirmed), cùng input → cùng output, tại bất kỳ instance nào (đúng đúng Stateless Engine, Engine Spec §2).

---

## 22. Performance

**NFR đã đóng băng ở PRD:** tổng thời gian tính toán + hiển thị `< 5 giây` (PRD NFR — Hiệu suất, đã trích trong Natal Chart Domain Spec Mục 38 Traceability). Đây là NFR cấp **toàn bộ chart calculation flow** (bao gồm cả network/render), không riêng Adapter — Adapter cần đóng góp phần nhỏ, hợp lý trong ngân sách đó (không có con số riêng cho Adapter — **không tự đặt SLA con số cụ thể** không có căn cứ).

| Khía cạnh | Quyết định |
|---|---|
| Initialization cost | Trả 1 lần lúc bootstrap (Mục 20.1) — không tính vào thời gian phục vụ request |
| Calculation cost per request | 2 lời gọi SDK (`calculateNatal` + `calculateHouses` nếu có giờ sinh) — Swiss Ephemeris tính toán thiên văn vốn rất nhanh (mili-giây cho 1 thời điểm, **External Technical Fact** — đặc tính đã biết rộng rãi của thư viện này, không cần benchmark riêng để khẳng định "đủ nhanh" ở mức khái niệm, nhưng vẫn cần đo thật trong Sprint 3, không chỉ giả định) |
| Repeated calculations | Không có cơ chế dedup/cache đặc biệt — mỗi `POST /charts/natal` là 1 lần tính mới (đúng hành vi đã Confirmed ở Natal Chart Domain Spec Mục 27.6 — không idempotency ở MVP) |
| Caching | **Không cache kết quả tính toán** — xem Mục 29 |
| Concurrent requests | Phụ thuộc kết quả OQ-8 (Mục 20.3) — nếu WASM không an toàn concurrent, số request tính toán đồng thời bị giới hạn bởi hàng đợi serialize; nếu an toàn, không giới hạn đặc biệt ngoài giới hạn chung của Node event loop |
| Memory usage | WASM module + file ephemeris load vào memory 1 lần (singleton) — chi phí cố định, không tăng theo số request (không có per-request allocation lớn) |

---

## 23. Security

| Rủi ro | Xử lý |
|---|---|
| Untrusted calculation input | Coordinate/datetime đã validate ở Domain Validation (Mục 10, đã đóng băng) **trước khi** vào Adapter — Adapter không phải lớp validate đầu tiên, nhưng vẫn nên tự vệ tối thiểu (Defense in Depth — ví dụ chặn `NaN`/`Infinity` lọt qua nếu có bug ở tầng trước) |
| Resource exhaustion | Không có input nào cho phép user chỉ định số lần lặp/độ phức tạp tính toán tùy ý (không giống ví dụ regex injection) — Swiss Ephemeris tính toán có chi phí cố định theo 1 thời điểm cụ thể, không có vector "làm chậm hệ thống bằng input đặc biệt" rõ ràng. **Không cần cơ chế phòng thủ đặc biệt** ngoài rate limiting chung đã có ở tầng API (ngoài phạm vi tài liệu này) |
| Malformed input | Zod validation (Application/Presentation layer, trước Adapter) chặn shape sai trước khi tới Domain/Adapter |
| Filesystem access | Adapter chỉ đọc (read-only) file `.se1` đã đóng gói sẵn trong image — không có input nào từ user ảnh hưởng đường dẫn file đọc (không có path traversal vector, vì `EPHEMERIS_DATA_PATH` là config cố định, không phải input động) |
| WASM execution boundary | WASM tự thân có sandbox execution (đặc tính chuẩn của WebAssembly runtime) — **External Technical Fact tích cực**, không cần AstroViet tự thêm lớp cô lập nào khác |

**Không giới thiệu phức tạp bảo mật không cần thiết** (đúng yêu cầu đề bài) — không thêm input sanitization đặc biệt nào ngoài validate đã có, không thêm rate-limit riêng cho endpoint Chart (dùng chung cơ chế Rate Limiter tổng của hệ thống, ngoài phạm vi tài liệu này).

---

## 24. Domain Model Mapping

Pipeline khái niệm đầy đủ (đúng yêu cầu Mục 24 prompt gốc, dùng đúng thuật ngữ dự án đã có thay vì tên gợi ý chung chung của đề bài):

```
BirthProfile (getSnapshotData(), D-10 Confirmed)
    ↓
BirthDataSnapshot (Application)
    ↓ [Timezone Resolution — bước [3] Pipeline, Engine Spec]
EphemerisRequest { utcDateTime, coordinates }  (Domain port DTO)
    ↓
IEphemerisProvider.calculateNatal() / .calculateHouses()   (Domain port, Application gọi qua đây)
    ↓
SwissEphemerisAdapter   (Infrastructure — nơi DUY NHẤT biết swisseph-wasm)
    ↓
RawEphemerisData / RawHouseData   (Domain DTO thô — vẫn thuộc "ngôn ngữ Domain", không phải WASM-specific)
    ↓
PlanetCalculator / HouseCalculator / AngleCalculator   (Domain — interpretation)
    ↓
Planet[] / House[] / Angle[]   (Domain Entity)
    ↓
AspectCalculator / PatternCalculator (deferred, D-14)   (Domain)
    ↓
Aspect[] / Pattern[]=[]   (Domain Entity)
    ↓
ChartBuilder   (Domain Service — ráp toàn bộ, làm tròn 1 lần, Mục 15)
    ↓
Chart   (Domain Aggregate Root)
    ↓
Chart Snapshot (persist qua IChartRepository, Mục 27–28 Natal Chart Domain Spec)
```

**Phân định layer** (đề bài yêu cầu rõ ràng): mọi bước từ `EphemerisRequest` tới `SwissEphemerisAdapter` (bao gồm cả 2 hộp đó) là ranh giới Domain↔Infrastructure qua Port. Mọi bước từ `RawEphemerisData` trở đi là **thuần Domain** — không hộp nào trong chuỗi từ đó về sau biết `swisseph-wasm` tồn tại.

---

## 25. Application Boundary

**Không lặp lại REST API Specification** (đúng Rule 4) — chỉ mô tả đủ để REST API Spec tiêu thụ được (đã tồn tại sẵn, tài liệu này không tạo mới):

| Khái niệm | Đã có ở đâu | Tài liệu này chỉ xác nhận |
|---|---|---|
| Use Case | `create-natal-chart.usecase.ts` (Architecture Spec §3.3.1) | Đây là nơi gọi `IEphemerisProvider`, không phải Presentation layer gọi trực tiếp |
| Input DTO | `CreateNatalChartRequest` (REST API Spec §5.4) | Không đổi — Use Case tự map sang `EphemerisRequest` nội bộ, không phải 1-1 |
| Output DTO | `ChartResponse` (REST API Spec §5.4) | Không đổi |
| Domain result | `Chart` Aggregate (Natal Chart Domain Spec Mục 6) | Không đổi |
| Persistence boundary | `IChartRepository` (Natal Chart Domain Spec Mục 28) | Không đổi — Adapter Swiss Ephemeris **không liên quan** tới persistence, đây là 2 Adapter hoàn toàn độc lập (`SwissEphemerisAdapter` vs `PrismaChartRepository`) |
| Chart snapshot boundary | Mục 27–28 Natal Chart Domain Spec | Không đổi |

---

## 26. Testing Strategy

Đúng đủ 5 loại test theo yêu cầu đề bài, đối chiếu với Architecture Spec §17 (Testing Strategy chung của dự án — không phát minh convention mới):

### 26.1 Unit Tests (Domain — không cần WASM thật)

| Test | Input/Output | Ghi chú |
|---|---|---|
| Coordinate conversion (nếu có bước convert nào ở Domain, ví dụ validate range) | — | Đã có ở BirthProfile (Sprint 2), không lặp lại |
| Timezone normalization | Local + IANA zone → UTC | Test thuần, không cần Adapter |
| Julian Day conversion | UTC `Date` → JD number | **Test nội bộ Adapter** (không phải Domain — JD không lộ ra Domain, Mục 9.1) — coi là 1 phần Adapter Test (26.2), không phải Unit Test Domain |
| Body mapping | `PlanetName` → `SE_*` constant | Test bảng mapping tĩnh (Mục 12) — thuần, không cần WASM |
| House system mapping | `HouseSystem` → SE code/logic | Test bảng mapping tĩnh (Mục 11) |
| Longitude normalization | Giá trị thô → `[0,360)` | Đã có Natal Chart Domain Spec TR-1 |
| Retrograde detection | `speed` → `isRetrograde` | Đã có TR-12, TR-13 |
| Aspect calculations | Longitude pair → Aspect | Đã có TR-8 đến TR-11, TR-18 |
| Precision/rounding | `float64` → `NUMERIC` | Domain (Chart Builder), không phải Adapter |
| Domain mapping | `RawEphemerisData` → `Planet[]` | `PlanetCalculator` test với `RawEphemerisData` **giả lập** (fixture cố định, không cần WASM thật) |

### 26.2 Adapter Tests (dùng WASM thật, chậm hơn Unit Test)

- Swiss Ephemeris initialization thành công với file `.se1` thật.
- Ephemeris initialization — xác nhận `swisseph-wasm` (bundled data) init thành công lúc bootstrap; test riêng trường hợp giả lập package/data lỗi (ví dụ mock module init throw) để xác nhận `EphemerisInitializationError` throw đúng lúc bootstrap, không đợi tới request đầu tiên (Mục 19.2 — không còn test "thư mục custom thiếu file" vì không còn dùng thư mục custom mặc định).
- Planetary calculation — gọi `calculateNatal()` thật với 1 input cố định, xác nhận output shape đúng `RawEphemerisData` (không assert giá trị chính xác ở đây — đó là việc của Golden Test, Mục 27).
- House calculation — tương tự cho `calculateHouses()`.
- Supported/unsupported bodies — xác nhận `calculateNatal()` luôn trả đủ 14 thiên thể (10 chuẩn + Chiron + Lilith + 2 Node).
- Invalid input — coordinate ngoài range biên (dù đã validate trước, Adapter Test vẫn nên xác nhận hành vi khi bị "bypass" validate, đúng Defense in Depth).
- Error translation — mock/force lỗi từ SDK, xác nhận Adapter throw đúng `ExternalServiceError`, không lộ raw error.

### 26.3 Integration Tests

```
BirthProfile (fixture) → CreateNatalChartUseCase → SwissEphemerisAdapter (thật) → Chart result
```

Đúng nguyên tắc đã có sẵn ở Architecture Spec §17 (API Test dùng Supertest, **Swiss Ephemeris có thể giữ thật** vì deterministic và nhanh — trích dẫn nguyên văn, đã đóng băng, không phải quyết định mới của tài liệu này) — Integration Test **không mock** `IEphemerisProvider`, dùng `SwissEphemerisAdapter` thật, khác với Unit Test (Mục 26.1, luôn mock).

### 26.4 Deterministic Golden Tests

Xem Mục 27 (tách riêng đúng yêu cầu đề bài).

### 26.5 Regression Tests

Golden Test (26.4) **chính là** Regression Test cho mục đích "future changes to swisseph-wasm/ephemeris files/calculation flags không âm thầm đổi kết quả" — không cần bộ test riêng biệt khác, chỉ cần chạy lại đúng Golden Test mỗi khi đổi 1 trong 3 yếu tố trên (và bump `engineVersion` nếu kết quả thay đổi có chủ đích).

### 26.6 Mock/Test Double strategy cho `IEphemerisProvider`

Test Application layer/Use Case (không phải Adapter Test) dùng **mock implement `IEphemerisProvider`** — ví dụ `FakeEphemerisProvider` trả `RawEphemerisData`/`RawHouseData` cố định không đổi (không gọi WASM thật) — giúp test Use Case logic (orchestration, ownership check, persistence) độc lập hoàn toàn khỏi tốc độ/tính sẵn có của WASM.

---

## 27. Reference/Golden Dataset

**Kế thừa nguyên trạng, không mở lại quyết định** — Natal Chart Domain Spec Mục 32 đã Confirmed: **CÓ** dùng Golden Chart, tolerance **0.01°** (D-8), nguồn dữ liệu **External Dependency chưa có sẵn** (PRD chỉ gợi ý Astro.com, không có bộ dữ liệu cụ thể trong bất kỳ tài liệu nào).

**Bổ sung riêng cho tài liệu này (đề bài Mục 27 yêu cầu chi tiết hơn về shape fixture):**

Mỗi fixture Golden Chart cần đủ:
```
{
  birthDate, localBirthTime, timezoneId,
  latitude, longitude,
  houseSystem, includeOptionalPoints,
  engineVersion (dùng lúc tạo fixture — để biết fixture này valid với version nào),
  expected: {
    planets: [{ name, longitude, latitude, speed }, ...],   // đủ 14 nếu includeOptionalPoints đủ
    houses: [{ number, cuspDegree }, ...] (12, nếu áp dụng),
    angles: [{ type, longitude }, ...] (4, nếu áp dụng),
  }
}
```

**Số lượng fixture tối thiểu khuyến nghị:** ≥5 — bao gồm ít nhất 1 case ở Bắc bán cầu, 1 case ở Nam bán cầu (kiểm tra sign convention `latitude` âm), 1 case gần vĩ độ cực (kiểm tra Placidus không hội tụ đúng warning), 1 case ngày sinh xa quá khứ (kiểm tra `HISTORICAL_DATE` warning, Natal Chart Domain Spec Mục 10.7), 1 case `isBirthTimeKnown=false` (kiểm tra `houses=[]`).

**KHÔNG dùng số bất kỳ (đúng Rule 9)** — toàn bộ giá trị `expected` trong fixture **phải** lấy từ nguồn uy tín thật (ví dụ tra cứu thủ công Astro.com cho đúng bộ input trên) trước khi viết test — đây là công việc chuẩn bị dữ liệu, đã ghi nhận là Task cần làm ở Natal Chart Domain Spec Mục 37, nhắc lại ở đây vì thuộc phạm vi trực tiếp của tài liệu Swiss Ephemeris Integration.

---

## 28. Observability

Đúng convention Pino đã đóng băng (Coding Standards §19, trích dẫn ví dụ Chart cụ thể đã có sẵn trong chính tài liệu dự án):

**Nên log:**
- `calculation_started` (`debug` level — chi tiết dev-only, không cần thiết ở production log mặc định).
- `calculation_completed` kèm `durationMs` (`info` level, `module: 'chart'`, `action: 'calculate_natal'`).
- Adapter failure (`error` level, `module: 'chart'`, kèm `err` object — đúng mẫu Backend Implementation Guide §19 đã trích Mục 18.2).
- Ephemeris initialization failure lúc bootstrap (`error` level, log 1 lần, sau đó app không khởi động — không lặp log).
- Warning mềm (`HOUSE_SYSTEM_NOT_CONVERGING`) — `warn` level, đúng ví dụ đã có sẵn trong Coding Standards: `logger.warn({ module: 'chart', action: 'create_natal_chart', chartId, warningCode: 'HOUSE_SYSTEM_NOT_CONVERGING' }, 'Chart created with warnings')`.

**KHÔNG log** (đúng yêu cầu đề bài + Backend Implementation Guide §13 đã đóng băng): birthDate/birthTime/coordinates thô (PII), toàn bộ request payload, raw response từ Swiss Ephemeris (không cần thiết, dài dòng, không mang giá trị debug thường xuyên — chỉ log ở `debug` level nếu thật sự cần điều tra sự cố cụ thể).

---

## 29. Caching

**Quyết định: KHÔNG cache kết quả tính toán Swiss Ephemeris/Chart ở Sprint 3 MVP.**

**Lý do (không phải "chưa nghĩ tới" — có căn cứ cụ thể):**
1. `ICacheProvider` (Architecture Spec §12) đã tồn tại làm interface dùng chung — nhưng **danh sách sử dụng đã liệt kê tường minh** (Rate Limit counter, `interpretation_contents`, `house_systems`/`languages` ReferenceData, `locations/search`) **không bao gồm** Chart calculation — xác nhận qua `grep` toàn bộ tài liệu Architecture Spec, không có mục nào gán caching cho Chart.
2. Chart đã persist là **immutable snapshot** (Natal Chart Domain Spec Mục 27) — `GET /charts/{id}` đọc thẳng DB, **không** gọi lại Adapter — đây chính là "cache" tự nhiên theo đúng nghĩa (không cần tính lại) mà không cần thêm `ICacheProvider` layer nào.
3. `POST /charts/natal` gọi lại nhiều lần với cùng input **tạo Chart mới mỗi lần** (đã Confirmed, không dedupe) — nên không có "request-level reuse" nào có ý nghĩa để cache (mỗi lần gọi được coi là 1 yêu cầu tính toán độc lập, hợp lệ).
4. Redis đã deferred (Quyết định 22.2) — không giới thiệu Redis riêng cho Chart caching.

**Không cần in-memory cache thêm** cho riêng module này — nếu sau này đo hiệu năng thực tế cho thấy Swiss Ephemeris calculation là bottleneck thật sự (chưa có bằng chứng ở giai đoạn spec), có thể thêm `ICacheProvider`-based cache theo đúng interface đã có sẵn qua DI, không cần redesign.

---

## 30. Extensibility

Áp dụng đúng bài test đã dùng nhất quán ở Natal Chart Domain Spec Mục 33: *"Is this required to support a currently planned future chart type without making the current Natal implementation unnecessarily complex?"*

| Chart type tương lai | Có cần sửa `IEphemerisProvider`/`SwissEphemerisAdapter` không? |
|---|---|
| Transit | **Không cần sửa interface** — `calculateTransit()` đã có chữ ký sẵn (Mục 8), hiện `throw UnsupportedChartTypeError` — khi implement thật, chỉ cần code phần thân method, không đổi interface |
| Synastry | Chỉ cần gọi `calculateNatal()` **2 lần** (2 bộ input khác nhau, 2 người) rồi so sánh longitude ở Domain layer — **không cần thêm method mới** vào `IEphemerisProvider` |
| Composite | Tương tự Synastry — tính 2 Natal riêng rồi Domain tự tính điểm giữa (midpoint) — không chạm Adapter |
| Progression | Cần 1 `EphemerisRequest` với `utcDateTime` đã dịch chuyển theo công thức progression (ví dụ "1 ngày = 1 năm") — **tính toán dịch chuyển thời gian này thuộc Domain**, Adapter vẫn chỉ nhận `utcDateTime` như bình thường, không cần biết khái niệm "progression" tồn tại |
| Solar Return | Cần tìm `utcDateTime` chính xác khi Sun quay lại đúng longitude sinh (bài toán tìm nghiệm/root-finding) — **đây là phần duy nhất có thể cần thêm khả năng mới cho Adapter/Engine** (gọi lặp `calculateNatal()` nhiều lần với `utcDateTime` khác nhau để hội tụ, hoặc cần 1 method chuyên biệt hơn) — nhưng **không cần thiết kế trước ở Sprint 3** (đúng Rule 7 "Do not prematurely generalize"), chỉ ghi nhận đây là điểm mở rộng tương lai cần xem xét kỹ hơn khi đến lượt |

**Kết luận:** `IEphemerisProvider` hiện tại (2 method thật + 1 chỗ trống `calculateTransit`) **đã đủ tổng quát** cho phần lớn chart type tương lai mà không cần generalize thêm ngay bây giờ — đúng "smallest abstraction that naturally supports future reuse" (đề bài Mục 30).

---

## 31. File/Module Structure

Đúng cấu trúc đã đóng băng ở Architecture Spec §3.3, §5 (Natal Chart Domain Spec đã trích dẫn ở Mục 19 tài liệu đó) — **không phát minh cấu trúc thứ 2**:

```
backend/src/modules/chart/
├── domain/
│   ├── entities/               (Chart, Planet, House, Angle, Aspect, Pattern — Natal Chart Domain Spec Mục 7)
│   ├── value-objects/          (ZodiacPosition, EngineInput, Warning...)
│   ├── ports/
│   │   ├── ephemeris-provider.port.ts     ← IEphemerisProvider, EphemerisRequest, RawEphemerisData,
│   │   │                                     HouseCalculationRequest, RawHouseData, HouseCalculationResult (Mục 8)
│   │   └── chart-repository.port.ts       ← IChartRepository (ngoài phạm vi tài liệu này)
│   └── engine/
│       ├── validation/                     (Validation Module, Engine Spec §6.1)
│       ├── calculators/
│       │   ├── planet.calculator.ts
│       │   ├── house.calculator.ts        ← tiêu thụ HouseCalculationResult (switch theo status)
│       │   ├── angle.calculator.ts        ← tiêu thụ RawHouseData.ascendant/.midheaven (khi status='success')
│       │   ├── aspect.calculator.ts       ← KHÔNG phụ thuộc Ephemeris trực tiếp, chỉ đọc Planet[]
│       │   └── pattern.calculator.ts       (deferred, D-14 — trả [] ở Sprint 3)
│       └── chart-builder.ts
├── application/
│   ├── use-cases/
│   │   ├── create-natal-chart.usecase.ts  ← gọi IEphemerisProvider qua DI
│   │   ├── get-chart.usecase.ts
│   │   ├── list-charts.usecase.ts
│   │   └── delete-chart.usecase.ts
│   └── services/                           (nếu cần service riêng ngoài use case, tùy)
├── infrastructure/
│   ├── adapters/
│   │   ├── swiss-ephemeris.adapter.ts     ← implement IEphemerisProvider — LỚP DUY NHẤT import swisseph-wasm
│   │   └── house-system.mapping.ts        (bảng mapping Mục 11.1, tùy chọn tách file riêng nếu lớn)
│   └── repositories/
│       └── prisma-chart.repository.ts      (ngoài phạm vi tài liệu này)
└── presentation/
    ├── routes/
    ├── controllers/
    └── dto/                                 (Zod schema — ngoài phạm vi, xem REST API Spec)
```

**Allowed imports:** `chart/domain/**` → không import gì từ `chart/infrastructure/**` hay `swisseph-wasm`. `chart/infrastructure/adapters/swiss-ephemeris.adapter.ts` → import `swisseph-wasm` (**duy nhất** file được phép). `chart/application/**` → import `chart/domain/ports/*` (interface), **không** import `chart/infrastructure/**` trực tiếp (chỉ nhận instance đã inject qua constructor, xem Mục 32).

**Forbidden imports:** Bất kỳ file nào ngoài `swiss-ephemeris.adapter.ts` import `swisseph-wasm` → vi phạm kiến trúc (nên enforce bằng `eslint-plugin-boundaries` nếu team quyết định bật, đã ghi nhận là "chờ đủ điều kiện kích hoạt" ở Sprint F1, ngoài phạm vi backend nhưng nguyên tắc tương tự áp dụng được nếu muốn).

---

## 32. Dependency Injection

| Thành phần | Vai trò |
|---|---|
| `IEphemerisProvider` | Interface/port (Domain) |
| `SwissEphemerisAdapter` | Concrete implementation (Infrastructure) |
| `composition-root.ts` | Nơi **duy nhất** biết `SwissEphemerisAdapter` là implementation thật của `IEphemerisProvider` — khởi tạo singleton (Mục 20.2), inject vào `CreateNatalChartUseCase` qua constructor |
| Test double | `FakeEphemerisProvider` (Mục 26.6) — dùng trong test, đăng ký thay thế qua DI container/manual wiring trong file test, không phải `composition-root.ts` thật |

**Application layer chỉ phụ thuộc abstraction** (`IEphemerisProvider`) — không bao giờ `new SwissEphemerisAdapter()` trực tiếp trong Use Case. Đúng pattern đã áp dụng nhất quán cho `ITokenProvider`/`ICacheProvider` (Architecture Spec §22.1, §22.4) — không phát minh cách wiring mới riêng cho module này.

---

## 33. Configuration

| Config | Loại | Giá trị | Nguồn |
|---|---|---|---|
| ~~`EPHEMERIS_DATA_PATH`~~ | ~~Environment variable~~ | **KHÔNG CẦN** — đã loại bỏ theo Mục 19.2 (CONFIRMED, OQ-7/OQ-10) | Bundled data đi theo `swisseph-wasm` qua `node_modules`, không cần biến môi trường path riêng do AstroViet tự quản lý; chỉ khôi phục biến này nếu technical spike sau này chứng minh cần dataset custom (Mục 19.2, phương án dự phòng) |
| Calculation flags (`SEFLG_SWIEPH \| SEFLG_SPEED`...) | Hard-code domain constant, **không phải env variable** | Cố định trong code Adapter | Đúng nguyên tắc "Do not introduce configuration for values that should be immutable domain rules" — flags là quyết định kỹ thuật cố định, không phải thứ vận hành cần đổi theo môi trường (dev/staging/production luôn dùng cùng flags, khác đi sẽ phá vỡ Determinism, Mục 21) |
| House system mapping table (Mục 11.1) | Hard-code constant | Cố định trong code (bao gồm `'W'` cho Whole Sign — Confirmed) | Tương tự — không phải config |
| `swisseph-wasm` package version | `package.json`, pin version cụ thể | Xem OQ-9 | Không phải "configuration" theo nghĩa runtime — là dependency version, quản lý qua lockfile |
| Serialize queue (Mục 20.3) | Hard-code trong Adapter (khởi tạo 1 hàng đợi nội bộ singleton) | Không cấu hình runtime | Luôn bật, không phải tùy chọn |

**Không có config nào khác cần thêm** — không có "ephemeris mode" runtime-switchable (chỉ 1 mode duy nhất, WASM, Confirmed), không có "calculation configuration" runtime-switchable (flags cố định), không có "ephemeris data path" runtime-switchable ở MVP (Mục 19.2).

---

## 34. API/Snapshot Compatibility

**Kế thừa hoàn toàn Natal Chart Domain Spec Mục 23, 27, 28** — không mở lại. Xác nhận riêng phần liên quan trực tiếp Swiss Ephemeris:

| Field cần ghi vào snapshot? | Quyết định |
|---|---|
| Swiss Ephemeris (library) version | **Không tách cột riêng** — gộp vào `engineVersion` (D-7 Confirmed) |
| Ephemeris data version (file `.se1`) | **Không tách cột riêng** — gộp vào `engineVersion` (D-7 Confirmed) |
| `engineVersion` | Có, cột riêng đã đóng băng (`charts.engine_version`) |
| `houseSystem` | Có, cột riêng đã đóng băng (`charts.house_system`) |
| Zodiac system | **Không** — luôn Tropical, không có biến thể nào ở MVP nên không cần lưu (lưu 1 giá trị hằng số vào mỗi row là dư thừa) |
| Calculation flags | **Không** — cố định theo `engineVersion` (nếu flags đổi, `engineVersion` phải bump theo, xem Mục 21) — không cần lưu riêng |

**Nguyên tắc bump `engineVersion` khi nào (làm rõ thêm, không có trong Natal Chart Domain Spec chi tiết đến mức này):** bất kỳ thay đổi nào ảnh hưởng tới **kết quả số** của Chart tính ra (đổi file `.se1`, đổi version `swisseph-wasm`, đổi calculation flags, sửa bug trong Calculator) → **bắt buộc** bump `engineVersion`. Thay đổi **không** ảnh hưởng kết quả số (refactor code không đổi logic, đổi comment, đổi cấu trúc thư mục) → **không cần** bump.

---

## 35. Versioning

Kế thừa Mục 24 (Determinism) + Mục 34 — nguyên tắc **snapshot không bao giờ tự động tính lại**:

```
Chart đã tạo với Engine v1 (ephemeris dataset X, config Y)
   → vẫn giữ nguyên giá trị đã tính, engineVersion="v1", mãi mãi (Chart immutable)

Engine nâng cấp lên v2 (ephemeris dataset Z, config Y — vẫn Y, chỉ đổi dataset)
   → Chart MỚI tạo sau thời điểm này dùng engineVersion="v2"
   → Chart CŨ (v1) không đổi, không tự động tính lại
```

**Không có cơ chế "migrate" Chart cũ sang engineVersion mới** — nếu user muốn kết quả theo Engine mới nhất, phải tạo Chart mới (gọi lại `POST /charts/natal`) — đúng hành vi "recalculate = tạo mới" đã Confirmed (Natal Chart Domain Spec Mục 27.6).

**Phân biệt rõ 2 trục độc lập có thể đổi riêng:**
```
Engine v1 + Ephemeris dataset X + Config Y   ≠   Engine v2 + Ephemeris dataset X + Config Y   (đổi code logic, giữ nguyên data)
Engine v1 + Ephemeris dataset X + Config Y   ≠   Engine v1 + Ephemeris dataset Z + Config Y   (giữ nguyên code, đổi data)
```
Cả 2 trường hợp trên **đều phải bump `engineVersion`** — vì `engineVersion` là định danh **tổng hợp** (Mục 34, D-7 Confirmed), không tách biệt "code version" và "data version" thành 2 trường riêng.

---

## 36. Edge Cases

Ma trận đầy đủ theo đúng yêu cầu tối thiểu của đề bài (18 case) + bổ sung:

| Case | Expected behavior | Layer chịu trách nhiệm | Error type | Test requirement |
|---|---|---|---|---|
| Unknown birth time | `calculateHouses()` không được gọi; `calculateNatal()` vẫn gọi với giờ neo nội bộ (Mục 9.3) | Application (quyết định không gọi), Adapter (không biết lý do, chỉ đơn giản không bị gọi) | Không phải lỗi — hành vi hợp lệ | TR-7 (Natal Chart Domain Spec) |
| Midnight (`birthTime=00:00:00`) | Giá trị hợp lệ bình thường, không xử lý đặc biệt | Domain Validation | — | Test giá trị biên `00:00:00` hợp lệ |
| DST transition | Tự động qua IANA tzdb, không cần AstroViet xử lý riêng | Timezone Resolver (trước Adapter) | — | Test 1 ngày sinh rơi đúng thời điểm chuyển DST |
| Historical timezone | Dùng `historicalTimezoneId` đã lưu, IANA tzdb tự chứa lịch sử | Timezone Resolver | — | Test 1 ngày sinh trước khi 1 quốc gia đổi múi giờ lịch sử |
| Longitude near 0°/360° | `angular_separation()` wrap-aware (Mục 19.1 Natal Chart Domain Spec) | Domain (Aspect Calculator) | — | TR-18 |
| Latitude near poles | Placidus không hội tụ | Adapter trả `{status:'not_convergent'}` (Mục 11.3), Application set warning | Warning mềm, không throw — typed result, không sentinel | TR-6 |
| Unsupported latitude for Placidus | Đồng nhất với case trên | — | — | — |
| Exact sign boundary (ví dụ `longitude=29.9999999°`) | Chấp nhận sai số floating-point tự nhiên, không bù trừ | Domain (normalize) | — | Đã có ở Mục 21 Natal Chart Domain Spec |
| Exact aspect boundary (orb = đúng giá trị tối đa) | Biên đóng `≤`, Aspect **được tạo** | Domain (Aspect Calculator) | — | TR-9 |
| Station/zero speed | Không xử lý đặc biệt — D-12 Deferred, chỉ `speed<0` nhị phân | Domain (Retrograde) | — | Test `speed=0` chính xác → `isRetrograde=false` |
| Missing/corrupt bundled ephemeris data | Fail-fast lúc bootstrap, app không khởi động (Mục 19.2 — kiểm tra qua thử init `swisseph-wasm`, không phải kiểm tra thư mục custom) | Infrastructure (Adapter/composition-root) | `EphemerisInitializationError` → `ExternalServiceError` | Adapter Test — mock package init throw |
| WASM initialization failure | Fail-fast lúc bootstrap | Infrastructure | `WasmInitializationError` → `ExternalServiceError` | Adapter Test |
| Unsupported planet | Không có code path thật (enum đóng kín 14 giá trị) | Domain (lý thuyết) | `UnsupportedCelestialBodyError` | Unit test giả lập input sai (bypass type system) |
| Unsupported house system | Chặn ở Domain Validation, **trước** Adapter | Domain | `UnsupportedHouseSystemError` | TR-17 (Natal Chart Domain Spec) |
| Invalid coordinates | Chặn ở Domain Validation | Domain | `InvalidCoordinateError` | TR-16 |
| Invalid datetime | Chặn ở Domain Validation (trước cả Timezone Resolution) | Domain | `InvalidDateTimeError` | Đã có ở BirthProfile validate (Sprint 2) |
| Concurrent calculations | Luôn serialize qua hàng đợi nội bộ (Mục 20.3, CONFIRMED) — không phụ thuộc kết quả verify thread-safety | Infrastructure (Adapter) | — (không phải error case, serialize luôn bật) | Adapter Test — gọi đồng thời N request, xác nhận không corrupt kết quả và thứ tự xử lý tuần tự |
| Repeated calculations | Mỗi lần tạo Chart mới, không dedupe | Application (đã Confirmed, không idempotency) | — | Integration test — gọi 2 lần cùng input, xác nhận 2 `Chart.id` khác nhau, giá trị số giống hệt (Determinism) |

---

## 37. Licensing & Compliance

**P0 — Bắt buộc trước khi Freeze, Production Launch Gate.** Mục này **không có trong draft ban đầu** — bổ sung theo Confirmation vì AstroViet là **production public web service**, không phải công cụ nội bộ/nghiên cứu — licensing của Swiss Ephemeris không thể hoãn tới sau Sprint 3.

### 37.1 Swiss Ephemeris (thư viện gốc, Astrodienst AG)

**External Technical Fact (cần verify lại trực tiếp trên trang chính thức Astrodienst trước khi ra quyết định cuối, không dựa hoàn toàn vào tài liệu này):** Swiss Ephemeris được Astrodienst phát hành theo mô hình **dual-license**:
- **AGPL (GNU Affero General Public License) v3** — miễn phí, nhưng có điều khoản **Network Use = Distribution** (Section 13 AGPL): nếu phần mềm chạy trên server và người dùng tương tác qua mạng (đúng mô hình AstroViet — web service công khai), điều khoản AGPL **yêu cầu cung cấp mã nguồn đầy đủ** (bao gồm mọi phần code tương tác với Swiss Ephemeris, không chỉ riêng thư viện) cho người dùng cuối theo yêu cầu.
- **Commercial License** (mua từ Astrodienst) — cho phép dùng trong sản phẩm/dịch vụ closed-source, không phải công khai mã nguồn.

### 37.2 `swisseph-wasm` (npm wrapper)

License của chính package npm (thường MIT/tương tự cho phần code wrapper JS/TS) **có thể khác** với license của phần Swiss Ephemeris core đã compile thành WASM bên trong nó — phần lõi tính toán (C source gốc Astrodienst compile sang WASM) **vẫn mang nghĩa vụ AGPL/Commercial gốc**, license của package wrapper không "ghi đè" hay miễn trừ nghĩa vụ đó. **Cần đọc chính xác file LICENSE của package `swisseph-wasm` cụ thể được chọn (sau khi pin version, OQ-9) để xác nhận package tác giả đã tuyên bố rõ ràng license nào áp dụng cho phần WASM bundled.**

### 37.3 Ephemeris data (`.se1` files, bundled trong `swisseph-wasm`)

Dữ liệu ephemeris đi kèm cũng thuộc quyền Astrodienst, thường đi kèm cùng điều khoản sử dụng với chính phần mềm Swiss Ephemeris (dual AGPL/Commercial) — không tự do redistribute tách biệt khỏi ngữ cảnh sử dụng hợp lệ Swiss Ephemeris.

### 37.4 Chính sách áp dụng cho AstroViet — phân biệt Development/Internal vs Production/Public

| Giai đoạn | Nghĩa vụ AGPL kích hoạt? | Hành động cần thiết |
|---|---|---|
| **Sprint 3 implementation, dev local, internal testing** (chưa public) | **Chưa kích hoạt theo nghĩa "network use" thật** — chưa có người dùng bên ngoài tương tác qua mạng với instance đang chạy | **Không chặn** — Sprint 3 có thể code, test, chạy nội bộ bình thường dưới AGPL (điều khoản AGPL cho phép chạy/sửa đổi tự do, chỉ kích hoạt nghĩa vụ công khai source khi "convey"/phục vụ qua mạng cho bên thứ ba) |
| **Production launch — public web service** | **Kích hoạt đầy đủ** — AstroViet phục vụ người dùng thật qua mạng, đúng định nghĩa "network use" của AGPL Section 13 | **Bắt buộc chọn 1 trong 2 trước khi launch công khai:** (A) Công khai toàn bộ mã nguồn AstroViet backend (ít nhất phần liên quan/liên kết trực tiếp tới Swiss Ephemeris — thực tế thường an toàn hơn là công khai toàn bộ repo) theo đúng AGPL; hoặc (B) Mua Commercial License từ Astrodienst để giữ mã nguồn đóng |

**Quyết định cuối cùng (A hay B) — KHÔNG chốt trong tài liệu này**, vì đây là quyết định kinh doanh/pháp lý (chi phí license thương mại vs mở mã nguồn), ngoài thẩm quyền spec kỹ thuật. Ghi nhận là **Production Launch Gate**: Sprint 3 có thể hoàn thành đầy đủ về mặt kỹ thuật, nhưng **AstroViet không được launch công khai production tới khi mục này được giải quyết dứt điểm** (chọn A hoặc B, thực hiện đúng nghĩa vụ tương ứng).

**Khuyến nghị hành động (không phải quyết định thay):** (1) Verify chính xác license hiện hành của `swisseph-wasm` version dự kiến pin (OQ-9); (2) nếu dự định giữ mã nguồn đóng cho production, liên hệ Astrodienst sớm (quy trình mua Commercial License có thể mất thời gian) — không nên để tới sát ngày launch mới bắt đầu; (3) nếu chọn AGPL, xác nhận với đội pháp lý/chủ dự án phạm vi chính xác "phần nào của source phải công khai" trước khi launch.

---

## 38. Open Questions

Toàn bộ 10 Open Question gốc đã được xác nhận. Bảng dưới thay thế hoàn toàn nội dung draft trước (giữ nguyên câu hỏi/lý do gốc để tra cứu, chỉ cập nhật cột quyết định).

| OQ | Câu hỏi gốc | Quyết định cuối cùng | Lý do ngắn |
|---|---|---|---|
| **OQ-1** | Whole Sign có mã house-system riêng trong `swisseph-wasm` không? | ✅ **CONFIRMED** — dùng mã `'W'` | Swiss Ephemeris hỗ trợ native Whole Sign calculation (Mục 11.1) |
| **OQ-2** | Whole Sign cusp tính ở Adapter hay Domain? | ✅ **CONFIRMED** — Domain chọn `HouseSystem`, Adapter map `WholeSign → 'W'` rồi gọi SDK trực tiếp | Giữ đúng architecture boundary: Domain sở hữu semantics, Adapter sở hữu provider mapping (Mục 11.2) |
| **OQ-3** | Cách chính xác `swisseph-wasm` báo hiệu "Placidus không hội tụ" | ✅ **CONFIRMED ở mức hợp đồng (contract)** — `calculateHouses()` trả `HouseCalculationResult` discriminated union tường minh, không dùng `NaN`/`[]`/`null` làm sentinel (Mục 8, 11.3). Cơ chế **nội bộ** Adapter tự nhận biết tín hiệu từ SDK vẫn là technical verification item nhỏ, không còn ảnh hưởng contract | Tránh ambiguity giữa lỗi và dữ liệu hợp lệ cho mọi layer downstream |
| **OQ-4** | Lilith: Mean hay Osculating/True? | ✅ **CONFIRMED — Mean Black Moon Lilith** (`SE_MEAN_APOG`) | Convention phổ biến, deterministic, phù hợp MVP (Mục 12) |
| **OQ-5** | Node: True hay Mean? | ✅ **CONFIRMED — Mean Node** (`SE_MEAN_NODE`) | Convention ổn định, phù hợp MVP (Mục 12) |
| **OQ-6** | Dataset ephemeris cụ thể và phạm vi năm hỗ trợ | ✅ **CONFIRMED — dùng dataset bundled sẵn trong `swisseph-wasm`, phạm vi mục tiêu ~1800–2399 CE**, biên chính xác cuối cùng verify theo đúng package thật (Mục 19.2) | Đủ cho phạm vi người dùng hiện tại, tránh scope dataset quá lớn |
| **OQ-7** | File ephemeris commit vào Git hay tải riêng lúc build? | ✅ **CONFIRMED — không runtime-download, không tự commit file riêng** — ưu tiên bundled ephemeris của pinned `swisseph-wasm` (Mục 19.2) | Build/deployment deterministic, không phụ thuộc network |
| **OQ-8** | `swisseph-wasm` có an toàn concurrent call không? | ✅ **CONFIRMED — MVP luôn serialize calculation access vào SwissEph instance**, bất kể kết quả verify concurrency-safety (Mục 20.3) | An toàn hơn khi chưa chứng minh được concurrency safety |
| **OQ-9** | Version chính xác `swisseph-wasm` | ✅ **CONFIRMED quy trình — pin exact version sau 1 technical spike đầu Sprint 3** (chưa chốt số cụ thể trong tài liệu spec, đúng lý do tránh lỗi thời) | Đảm bảo reproducibility/determinism |
| **OQ-10** | Directory path `backend/ephemeris-data/` có cần tạo mặc định không? | ✅ **CONFIRMED — KHÔNG tạo mặc định** — chỉ thêm nếu 1 technical spike chứng minh cần custom dataset (Mục 19.2) | Package đã có bundled data, tránh duplicate và complexity |

**Không còn Open Question nào ở trạng thái chờ xác nhận.** Duy nhất 1 hạng mục còn "mở" theo đúng bản chất của nó (không phải do thiếu quyết định, mà do bản chất là hành động thực thi, không phải lựa chọn thiết kế): **Licensing & Compliance (Mục 37)** — Production Launch Gate, không chặn Sprint 3 code/test local.

## 39. Decision Log

### Already Frozen (kế thừa nguyên trạng, không mở lại)

| Nguồn quyết định | Nội dung |
|---|---|
| Natal Chart Domain Spec D-1 (Confirmed), **refined bởi tài liệu này** | `IEphemerisProvider` — 3 method, `calculateHouses()` tách riêng, nay trả `HouseCalculationResult` thay vì `RawHouseData` trực tiếp (Mục 8) |
| Natal Chart Domain Spec D-3 (Confirmed) | Không tự động fallback Placidus→WholeSign |
| Natal Chart Domain Spec D-4 (Confirmed) | Domain self-check cho DSC/IC, không DB Trigger |
| Natal Chart Domain Spec D-5 (Confirmed) | Orb: Social (Jupiter, Saturn) → nhóm "ngoài" |
| Natal Chart Domain Spec D-6 (Confirmed) | Công thức `isApplying`/`isSeparating` wrap-aware |
| Natal Chart Domain Spec D-7 (Confirmed) | Không tách cột `ephemeris_version` — gộp vào `engineVersion` |
| Natal Chart Domain Spec D-8 (Confirmed) | Golden Test tolerance `0.01°` |
| Natal Chart Domain Spec D-9/Conflict #1 (RESOLVED) | Unknown birth time — không giờ mặc định, houses/angles rỗng |
| Natal Chart Domain Spec D-10/Conflict #2 (RESOLVED) | Chart đọc BirthProfile qua `getSnapshotData()` |
| Natal Chart Domain Spec D-12 (Deferred) | Không có stationary retrograde state |
| Natal Chart Domain Spec D-14 (Deferred) | Pattern detection deferred toàn bộ, `patterns=[]` |
| Architecture Spec §12.1 / ADR 22.1 | `swisseph-wasm` (WASM) cho MVP, không phải native binding |
| Architecture Spec ADR 22.2 | Redis deferred — `ICacheProvider` + `InMemoryCacheAdapter` cho MVP |
| Architecture Spec ADR 22.3 | File `.se1` đi kèm image qua `node_modules` (bundled trong package) — **cách hiện thực hóa cập nhật theo Mục 19.2**, tinh thần "không tải động runtime" giữ nguyên |
| Architecture Spec ADR 22.5 | Đúng 1 process/instance (dù Docker Compose hay PM2), không cluster mode |
| Architecture Spec §18.3 | Docker Compose là phương án triển khai chính, PM2 là dự phòng |
| Domain Spec / Natal Chart Domain Spec | Tropical Zodiac (không Sidereal), 5 Aspect chính, 2 House System (Placidus/Whole Sign), 14 celestial body enum |
| Backend Implementation Guide §19 | Error translation pattern (`try/catch` → `ExternalServiceError`, log `module`+context) |
| Coding Standards §19, §20, §28 | Logging convention, comment convention, TODO/FIXME format |

### Resolved trong lần Confirmation này (trước đó là "New Decisions Required")

| ID | Quyết định cuối cùng |
|---|---|
| OQ-1, OQ-2 | Whole Sign → mã `'W'` native, Domain sở hữu semantics/Adapter sở hữu mapping (Mục 11.1–11.2) |
| OQ-3 | `HouseCalculationResult` discriminated union thay sentinel `NaN`/`[]`/`null` (Mục 8, 11.3) |
| OQ-4, OQ-5 | Lilith = Mean Black Moon Lilith, Node = Mean Node (Mục 12) |
| OQ-6, OQ-7, OQ-10 | Không tạo `backend/ephemeris-data/` mặc định, dùng bundled data của `swisseph-wasm`, không runtime-download (Mục 19.2) |
| OQ-8 | Luôn serialize calculation access, không chờ verify concurrency-safety (Mục 20.3) |
| OQ-9 | Quy trình pin version xác nhận (technical spike đầu Sprint 3) — số cụ thể vẫn chờ thực thi, không phải "chưa quyết" |

**Không còn "New Decisions Required" nào tồn đọng** — chi tiết đầy đủ từng OQ ở Mục 38.

### Mục mới phát sinh từ Confirmation — không phải Open Question, mà là Gate

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Licensing & Compliance (Mục 37) | **Production Launch Gate** | Không chặn Sprint 3 code/test local — bắt buộc giải quyết (AGPL compliance hoặc Commercial License) trước khi launch production public |

---

## 40. Non-Goals

Đúng danh sách tối thiểu đề bài yêu cầu, xác nhận không tài liệu nào đưa các mục này vào Sprint 3:

Synastry, Composite, Transit (implementation thật — chỉ có chỗ trống interface `calculateTransit()`), Progression, Solar Return, AI Interpretation (implementation thật), Knowledge Base (nội dung diễn giải đầy đủ — chỉ cần cơ chế JOIN hoạt động, không cần content thật), Admin (RBAC nâng cao ngoài "chủ sở hữu" cơ bản đã có), Redis, advanced caching (Mục 29 đã xác nhận không cache), frontend chart rendering.

**Bổ sung riêng cho phạm vi tài liệu này:** Native Swiss Ephemeris binding (thay thế WASM) — không nằm trong Sprint 3, chỉ là hướng mở rộng đã chừa sẵn interface (Mục 6). Multi-process/cluster WASM coordination — không cần thiết kế (Mục 19.1, luôn đúng 1 process).

---

## 41. Acceptance Criteria for This Specification

Tự đánh giá theo đúng 24 tiêu chí đề bài yêu cầu (Mục 40 prompt gốc):

| # | Tiêu chí | Đạt? |
|---|---|---|
| 1 | Swiss Ephemeris responsibility rõ ràng | ✅ Mục 7.1 |
| 2 | Domain/application/infrastructure boundary tường minh | ✅ Mục 6, 7.3, 31 |
| 3 | Input normalization đầy đủ | ✅ Mục 8, 9 |
| 4 | Timezone handling | ✅ Mục 9 (kế thừa, không lặp) |
| 5 | Geographic coordinate handling | ✅ Mục 10 |
| 6 | Celestial bodies định nghĩa | ✅ Mục 12 — 10 bắt buộc rõ ràng, Lilith/Node đã CONFIRMED (Mean Lilith, Mean Node) |
| 7 | House systems định nghĩa | ✅ Mục 11 — cả Placidus lẫn Whole Sign (mã `'W'` native) đã rõ, non-convergence có typed result tường minh |
| 8 | Calculation flags định nghĩa hoặc đánh dấu unresolved | ✅ Mục 13 |
| 9 | Zodiac/reference frame định nghĩa hoặc đánh dấu unresolved | ✅ Mục 14 (đã Frozen, không unresolved) |
| 10 | Precision policy định nghĩa | ✅ Mục 15 |
| 11 | Retrograde policy định nghĩa | ✅ Mục 16 |
| 12 | Aspect calculation boundary định nghĩa | ✅ Mục 17 |
| 13 | Ephemeris file lifecycle định nghĩa | ✅ Mục 19 |
| 14 | WASM lifecycle định nghĩa | ✅ Mục 20 (kèm rõ phần cần technical verification, không giả vờ đã biết) |
| 15 | Error handling định nghĩa | ✅ Mục 18 |
| 16 | Determinism strategy định nghĩa | ✅ Mục 21 |
| 17 | Testing strategy định nghĩa | ✅ Mục 26 |
| 18 | Golden/reference data strategy định nghĩa | ✅ Mục 27 |
| 19 | Snapshot/versioning behavior định nghĩa | ✅ Mục 34, 35 |
| 20 | Future extensibility không over-engineer | ✅ Mục 30 (test rõ ràng cho từng chart type, không tự thêm interface thừa) |
| 21 | Không rò rỉ Swiss Ephemeris implementation vào Domain | ✅ Mục 6, 7.2, 24, 31 (allowed/forbidden imports tường minh) |
| 22 | Không âm thầm đổi quyết định kiến trúc đã đóng băng | ✅ Mục 39 "Already Frozen" tách riêng rõ ràng; 1 điểm đính chính khung hiểu đề bài (PM2, Mục 19.1) đã giải thích rõ lý do, không phải "đổi quyết định" mà là làm đúng theo tài liệu đã có |
| 23 | Toàn bộ unresolved decision liệt kê ở Open Questions | ✅ Mục 38, 10 OQ đầy đủ — toàn bộ đã CONFIRMED |
| 24 | Sprint 3 có thể bắt đầu mà không còn mơ hồ kiến trúc | ✅ — không còn OQ nào ở trạng thái BLOCKING kiến trúc; duy nhất Licensing (Mục 37) là Gate cho **production launch**, không chặn code/test Sprint 3 |
| 25 (bổ sung) | Licensing/compliance của dependency bên thứ 3 (cho production service) không bị bỏ qua | ✅ Mục 37 — P0, Production Launch Gate, đã phân biệt rõ dev/internal vs production/public |

**Kết luận:** Tài liệu đạt đủ 25/25 tiêu chí tự đánh giá (24 gốc + 1 bổ sung Licensing theo Confirmation). Frozen specification (v1.1), sẵn sàng làm nguồn cho Sprint 3 Implementation Plan — với điều kiện Licensing (Mục 37) được giải quyết trước khi launch production public.

---

*Hết tài liệu. Đã thực hiện Final Consistency Audit (đề bài Mục 43) — đối chiếu qua lại Project Architecture ↔ Astrology Engine Specification ↔ tài liệu này ↔ Natal Chart Domain ↔ REST API ↔ Database Snapshot: không phát hiện mâu thuẫn nào không giải thích được. 1 điểm cần đính chính khung hiểu ban đầu của đề bài (PM2/Docker, Mục 19.1) đã xử lý minh bạch bằng cách trích dẫn ADR gốc, không tự ý "sửa" quyết định dự án. 10 Open Question (Mục 38) đều đã CONFIRMED — không có quyết định kiến trúc lớn nào còn bỏ ngỏ. Bổ sung Mục 37 (Licensing & Compliance) theo Confirmation — Production Launch Gate, không chặn Sprint 3 code/test local nhưng bắt buộc giải quyết trước khi public launch. Không tạo Sprint 3 Implementation Plan trong tài liệu này, đúng yêu cầu đề bài.*
