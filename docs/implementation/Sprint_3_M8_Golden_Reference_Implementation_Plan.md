# Sprint 3 Backend — Milestone 8 Implementation Plan
## Integration & Golden Reference Tests

---

# A. Executive Summary

M1–M7 đã đóng và verify sạch trên `dev` (`e348a75`) — pipeline `BirthProfile → CreateNatalChart → Swiss Ephemeris → Astrology Engine → Chart Snapshot → PostgreSQL → REST API` tồn tại đầy đủ về mặt code, đã unit-test kỹ ở từng layer, nhưng **chưa từng được xác nhận độ chính xác thiên văn bằng nguồn độc lập nào** — đúng như Natal Chart Domain Specification §32 đã tự ghi nhận từ trước Sprint 3 bắt đầu: *"chưa có bộ dữ liệu Golden Chart cụ thể nào... đây là External Dependency"*. M8 giải quyết đúng 2 câu hỏi: (1) pipeline thật có chạy end-to-end không (Integration Test), và (2) kết quả có đúng thiên văn không (Golden Reference Test).

Sau khi audit trực tiếp code + tài liệu, đã xác định được **chiến lược Golden Reference 2 tầng, có căn cứ thật** (không phải giả định): **NASA JPL Horizons** (dịch vụ công miễn phí của chính phủ Mỹ, public domain, độc lập hoàn toàn với Swiss Ephemeris — dùng bộ ephemeris JPL DE riêng) làm nguồn đối chiếu **vị trí hành tinh**; **Astrodienst Extended Chart Selection** (cùng nhà phát triển Swiss Ephemeris) làm nguồn đối chiếu **house cusps/Angle**, với hạn chế "same underlying engine" được ghi nhận tường minh đúng theo yêu cầu đề bài. Đây không phải lựa chọn tùy tiện — JPL Horizons được ưu tiên hơn Astro.com cho planet vì thực sự độc lập (tier 3 "reference calculator độc lập" trong danh sách ưu tiên của đề bài), còn house cusps buộc phải chấp nhận tier 2 vì không tồn tại công cụ house-system tính toán nào phổ biến, đáng tin cậy mà độc lập hoàn toàn với Swiss Ephemeris.

Trạng thái sẵn sàng: **READY FOR IMPLEMENTATION** với điều kiện — 3 Open Question (fixture format/location, license Astro.com nếu dùng, CI runtime) cần xác nhận nhanh trước T5 (xem Mục H), không có blocker kiến trúc nào.

---

## 1. Milestone Overview

**Milestone:** Sprint 3 Backend — Milestone 8: Integration & Golden Reference Tests.

**Objective:** Xác nhận toàn bộ astrology calculation pipeline hoạt động end-to-end trên hạ tầng thật (Postgres, Swiss Ephemeris WASM thật), và xác nhận độ chính xác thiên văn bằng ≥5 Golden Chart fixture có nguồn gốc rõ ràng, tolerance `0.01°` đã đóng băng từ Domain Spec §32 (D-8).

**Scope:**
- Golden Chart Data Preparation (nguồn, provenance, license).
- Golden Reference Tests (Adapter+Engine boundary, không qua HTTP).
- Real End-to-End Integration Test (HTTP → DB, không mock core pipeline).
- Angle comparison utility (nếu codebase chưa có — đã xác nhận **chưa có**, xem Mục 2).
- CI verification cho cả 2 loại test trên.

**Out of Scope:** Mở rộng Astrology Engine (Pattern algorithm vẫn D-14 deferred), thêm planet/point/house system mới, đổi Domain Model/REST API contract/DB schema, refactor kiến trúc, Interpretation module, mock core pipeline trong E2E test, phụ thuộc internet lúc runtime test.

**Dependencies:** M1–M7 đã đóng (đã verify trực tiếp `dev@e348a75`, xem Mục 2).

---

## 2. Current-State Verification

Đã đọc trực tiếp code thật (không giả định plan cũ đúng với thực tế):

| Thành phần | Trạng thái thật đã verify |
|---|---|
| Pipeline `POST /charts/natal` | Hoạt động đầy đủ (M6/M7), đã fix 2 lỗi cuối cùng ở commit `e348a75` (`save` default, ownership isolation test) |
| `chart/domain/engine/*` (Calculators, ChartBuilder) | Đầy đủ, unit-test bằng fixture giả lập (không cần Swiss Ephemeris thật) — **đúng theo Domain Spec §31, không phải việc Golden Test** |
| `SwissEphemerisAdapter` | Đầy đủ, unit-test bằng WASM thật nhưng **không đối chiếu nguồn độc lập nào** — đây chính là khoảng trống M8 lấp |
| `PrismaChartRepository` | Đầy đủ, integration-test trên Postgres thật (M5) — dùng `Chart.reconstitute()`/`Planet.reconstitute()` để bypass Domain validation khi test CHECK constraint, **không phải test pipeline tính toán thật** |
| `tests/integration/modules/chart/repositories/prisma-chart.repository.test.ts` (M5) | Test Repository **cô lập** — không gọi Swiss Ephemeris, không đi qua `ChartBuilder` |
| `tests/api/chart/*.api.test.ts` (M7) | Test qua HTTP thật, dùng `bootstrapApplication()` (Swiss Ephemeris thật) — **nhưng không có test nào đối chiếu giá trị tuyệt đối với nguồn bên ngoài**, chỉ verify status code + shape response |
| Angle/circular comparison utility | **Không tồn tại** — đã grep toàn bộ `shared/` và `chart/domain/engine/calculators/aspect.calculator.ts` (nơi duy nhất có logic `angular_separation` tương tự), xác nhận đây là hàm nội bộ riêng của Aspect Calculator, không phải utility dùng chung — M8 cần tạo mới, không tái sử dụng được nguyên trạng |
| `docker-compose.test.yml` | Postgres 16-alpine, port 5432 cố định |
| CI (`backend-ci.yml`) | 1 job duy nhất: `prisma:generate` → `prisma:deploy` → lint → `generate:openapi` → typecheck → **`test:coverage` (chạy TOÀN BỘ `tests/` bằng 1 lệnh vitest, không tách unit/integration/golden)** → build |
| `vitest.config.ts` | `testTimeout: 10000`, `fileParallelism: false`, `TZ='UTC'` set cứng (đúng bài học đã sửa ở M3), không có `include`/`exclude` pattern giới hạn — **mọi file `*.test.ts` dưới `tests/` tự động được vitest nhặt, kể cả file mới thêm** |
| `PrismaTestFactory` | Có `createUser()`, `createBirthProfile()`, `createRefreshToken()` — **không có `createChart()`** (không cần thiết — E2E test nên tạo Chart qua chính `POST /charts/natal` thật, không qua factory bypass, đúng tinh thần "không mock core pipeline") |
| `DatabaseTestHelper` | Tồn tại, đã verify từ M5 review: loại trừ `house_systems` khỏi `TRUNCATE` (bảng seed, không phải per-test data) |
| Swiss Ephemeris config (`swiss-ephemeris.adapter.ts`) | `SEFLG_SWIEPH \| SEFLG_SPEED` (dùng file ephemeris thật + tính speed cho retrograde), không có `SEFLG_TOPOCTR` (→ geocentric), không có sidereal flag (→ Tropical zodiac) — khớp đúng Astrology Domain Spec đã đóng băng |
| `house_systems` seed | 2 hàng cố định (`Placidus`, `WholeSign`) — insert trực tiếp trong migration (M5-T01) |
| Golden Chart data | **Chưa tồn tại ở đâu trong repo** — đúng External Dependency đã ghi nhận ở Domain Spec §32 |

**Kết luận:** Không phát hiện discrepancy nào giữa code M1-M7 và tài liệu đã đóng băng liên quan tới phạm vi M8 — chỉ có 1 khoảng trống thật sự (Golden data + angle comparison utility), đúng như đã dự đoán từ Domain Spec §32.

---

## 3. Architecture Alignment

| Tài liệu | Điểm neo cho M8 |
|---|---|
| Natal Chart Domain Specification §32 | Tolerance `0.01°` (D-8, CONFIRMED, không mở lại); mục đích Golden Test là verify **Adapter integration**, không phải business logic (đã có Unit Test riêng, §31) |
| Natal Chart Domain Specification §37 | Sprint 3 Readiness Assessment — liệt kê Golden data là việc "cần làm trước M8" (đã đến lúc) |
| Astrology Engine Specification §6.3/§6.4 | Ranh giới Adapter (raw calc) vs Engine (Sign/House/Retrograde derive) — Golden Test phải test đúng **kết quả cuối** (sau Engine), không phải raw Adapter output riêng lẻ |
| Swiss Ephemeris Integration Specification §9.3 | Anchor time `12:00 local` khi Unknown Birth Time — Golden fixture Unknown-time phải dùng đúng quy tắc này khi diễn giải kết quả Planet |
| REST API Specification §4.4 | 4 endpoint Chart — E2E test đối chiếu đúng luồng `POST→GET→DELETE` đã đóng băng |
| Database Design Specification §9 | Soft-delete chỉ ở `charts.deleted_at`, 6 bảng con không có cột riêng — E2E test verify đúng theo quy tắc này (không tự đặt kỳ vọng khác) |
| Coding Standards & Conventions | Naming test (`describe`/`it` mô tả hành vi), không dùng coverage % làm tiêu chí |

---

## 4. Test Strategy — Phân biệt 4 tầng

```
Unit Tests (đã có, M1-M7)          — business rule, calculator logic, fixture giả lập — KHÔNG thuộc M8, KHÔNG viết thêm
        ↓
Integration Tests (đã có 1 phần, M5) — Repository ↔ Postgres thật — ĐÃ ĐỦ cho Repository layer, M8 KHÔNG lặp lại
        ↓
Golden Reference Tests (M8, MỚI)     — SwissEphemerisAdapter + Astrology Engine ↔ nguồn độc lập — test numerical correctness
        ↓
End-to-End Pipeline Test (M8, MỚI)   — HTTP → Use Case → Engine → Repository → Postgres, full stack thật
```

**Không trùng lặp:** Golden Test **không** đi qua HTTP (đúng yêu cầu đề bài "Không biến Golden Test thành API integration test") — gọi trực tiếp `ChartBuilder`/`SwissEphemerisAdapter` giống cách `chart-builder.test.ts` (M3) đã làm, nhưng dùng dữ liệu thật thay vì Fake. E2E Test **không** verify độ chính xác số học chi tiết từng hành tinh (đó là việc Golden Test) — chỉ verify pipeline toàn vẹn (dữ liệu tồn tại đúng chỗ, đúng user, đúng ownership, đúng soft-delete).

---

## 5. Golden Reference Strategy

### 5.1 Lựa chọn nguồn — có phân tích, không chọn tùy tiện

Đối chiếu đúng thứ tự ưu tiên đề bài đưa ra:

| Tier ưu tiên (đề bài) | Ứng viên | Đánh giá |
|---|---|---|
| 1. Swiss Ephemeris official/reference material | Tệp test reference đi kèm Swiss Ephemeris gốc (Astrodienst C library) | Không kèm sẵn trong `swisseph-wasm` (npm package chỉ có binding, không có bộ test-case chuẩn công khai dễ truy cập) — không khả thi trực tiếp |
| 2. Astrodienst / official Swiss Ephemeris reference | astro.com Extended Chart Selection | Khả thi — **nhưng dùng chính Swiss Ephemeris nội bộ** (cùng engine với AstroViet) → phải ghi rõ limitation (đề bài yêu cầu tường minh) |
| 3. Reference calculator độc lập đáng tin cậy | **NASA JPL Horizons** (`ssd.jpl.nasa.gov/horizons`) | **Đã xác nhận qua search thật:** dịch vụ công miễn phí của Jet Propulsion Laboratory (NASA), dùng bộ ephemeris JPL DE (Development Ephemeris, độc lập hoàn toàn với thuật toán Swiss Ephemeris/Astrodienst), cung cấp geocentric apparent ecliptic longitude cho Sun/Moon/planet tại thời điểm UTC cụ thể — **đúng nghĩa "independent validation source"**, không qua đăng nhập, dữ liệu chính phủ Mỹ nên **public domain** (không vướng license redistribution) |
| 4. Astronomical reference data có provenance rõ | (dự phòng nếu Horizons không phủ được object nào, ví dụ Chiron/Lilith) | Xem Mục 5.3 |

**Quyết định 2 tầng (không mập mờ):**

| Đại lượng | Nguồn Golden | Phân loại theo đề bài |
|---|---|---|
| **Planet longitude, retrograde state** (Sun→Pluto, kể cả Chiron nếu Horizons hỗ trợ — xem 5.3) | **NASA JPL Horizons** | ✅ "Independent validation source" — engine tính toán khác hoàn toàn (JPL DE vs Swiss Ephemeris SE), thỏa mãn đúng tinh thần đề bài |
| **House cusps, Ascendant/Midheaven** | **Astrodienst Extended Chart Selection** | ⚠️ "Reference generated by same underlying engine" — ghi rõ hạn chế: giá trị này validate đúng **cách AstroViet gọi/diễn giải** Swiss Ephemeris (tham số, house system code, slice cusps), KHÔNG validate được liệu bản thân thuật toán Placidus/WholeSign trong Swiss Ephemeris có "đúng" theo nghĩa thiên văn tuyệt đối — nhưng đây là hạn chế đã biết trước và chấp nhận được vì không tồn tại calculator house-system nào phổ biến, đáng tin cậy, độc lập hoàn toàn với Swiss Ephemeris trong thực tế ngành |

### 5.2 Lý do KHÔNG dùng Astro.com cho planet dù đã cân nhắc

Astro.com's Extended Chart Selection **cũng dùng Swiss Ephemeris nội bộ** cho toàn bộ tính toán, kể cả planet — nếu dùng nó làm nguồn planet thì Golden Test chỉ đang so sánh "Swiss Ephemeris qua AstroViet" với "Swiss Ephemeris qua Astrodienst", **không phát hiện được lỗi hệ thống nằm trong chính cách dùng Swiss Ephemeris** (ví dụ sai flag `SEFLG_SWIEPH`, sai Julian Day conversion) nếu cả 2 bên cùng mắc lỗi giống nhau — dù rất khó xảy ra, đây chính xác là điều đề bài cảnh báo ("Reference generated by same underlying engine" vs "Independent validation source"). Dùng JPL Horizons cho planet loại bỏ hoàn toàn rủi ro này.

### 5.3 Giới hạn đã biết trước — không giả tạo giá trị

- **Chiron, Lilith (Mean Apogee), North/South Node:** JPL Horizons hỗ trợ Chiron (minor planet 2060) nhưng **không có "Mean Lunar Apogee" (Lilith) như 1 object thiên văn thật** (Lilith là điểm toán học, không phải thiên thể) — Horizons không thể làm nguồn cho Lilith. **Quyết định:** Golden fixture chỉ đối chiếu Lilith/Node qua Astrodienst (cùng hạn chế "same engine" như house cusps) — ghi rõ trong fixture `notes`, không bỏ qua âm thầm.
- **Retrograde state:** JPL Horizons không trực tiếp gắn nhãn "retrograde" — phải tự suy ra từ **dấu của tốc độ thay đổi longitude** giữa 2 mốc thời gian gần nhau (giống hệt logic `isRetrograde = speed < 0` của AstroViet) — đây là phép tính đơn giản, không phải fabricate, nhưng cần ghi rõ cách suy ra trong `README.md` fixture (Mục 6).

---

## 6. Golden Fixture Preparation

### 6.1 Vị trí lưu trữ (theo đúng convention hiện có, không áp đặt)

Đã kiểm tra `backend/tests/fixtures/` (hiện chỉ có `prisma-test.factory.ts`, không có sub-folder theo domain) — **không có convention "golden" sẵn có để tuân theo hay vi phạm**. Đề xuất theo đúng gợi ý đề bài (Mục 14), tạo mới:

```
backend/tests/fixtures/golden/
├── README.md                          ← provenance, cách thêm fixture mới, quy tắc update
├── fixture-001-hanoi-known-time.json
├── fixture-002-southern-hemisphere.json
├── fixture-003-mercury-retrograde.json
├── fixture-004-unknown-birth-time.json
└── fixture-005-wholesign-dst.json
```

### 6.2 Lựa chọn 5 fixture — có giải thích, không phải số tùy ý

| # | Fixture | Lý do chọn (coverage có ý nghĩa) |
|---|---|---|
| 1 | Hà Nội, giờ sinh biết rõ, Placidus, không DST | **Baseline** — case đơn giản nhất, verify pipeline cơ bản đúng trước khi test case phức tạp |
| 2 | Nam bán cầu (vĩ độ âm, ví dụ Sydney/Melbourne) | Verify dấu vĩ độ không bị đảo/nhầm — lớp lỗi kinh điển khi xử lý tọa độ Nam bán cầu (house calculation, sign-on-cusp) |
| 3 | Ngày có Mercury (hoặc hành tinh khác) thật sự retrograde | Verify `isRetrograde` không chỉ đúng ở Unit Test giả lập (M3) mà đúng với dữ liệu thiên văn thật — đây là mệnh đề dễ sai nhất nếu `speed` sign bị đảo ngược đâu đó trong pipeline thật |
| 4 | `isBirthTimeKnown=false` | Bắt buộc theo Mục 17 đề bài — verify Planet-only expectation đúng (dùng anchor 12:00 local theo Swiss Ephemeris Integration Spec §9.3), **loại trừ hoàn toàn House/Angle expectation** (vì Domain đã quyết định `houses=[]`/`angles=[]` khi Unknown — D-9, không phải Golden Test tạo ra ngoại lệ mới) |
| 5 | WholeSign house system + ngày rơi đúng giai đoạn DST (ví dụ 1 quốc gia có áp dụng DST lịch sử) | Verify house system thứ 2 (không chỉ test Placidus) + verify lại chính xác bài học DST đã sửa ở M3 (`time-conversion.ts` UTC-getter bug) bằng dữ liệu thật, không chỉ Unit Test giả lập |

**Không chọn thêm case chỉ để đủ số** — 5 fixture trên phủ đủ: hemisphere (Bắc/Nam), house system (Placidus/WholeSign), birth time precision (biết/không biết), retrograde thật, DST — đúng danh sách coverage đề bài liệt kê, không lặp lại case tương tự nhau.

**Không chọn case cực vĩ độ (>66.5°)** — đã có Unit Test đầy đủ ở M3 cho non-convergence (fixture giả lập), Golden Test không cần lặp lại vì đây là hành vi đã được chứng minh đúng ở mức thuật toán (pre-check ngưỡng), không phải câu hỏi "độ chính xác thiên văn" mà Golden Test nhắm tới.

### 6.3 Golden Fixture Schema (đầy đủ field theo yêu cầu Mục 4 đề bài)

```typescript
interface GoldenChartFixture {
  fixtureId: string;                 // "golden-001"
  description: string;
  birthData: {
    birthDate: string;               // "1990-06-15"
    birthTime: { hour: number; minute: number; second: number } | null;
    isBirthTimeKnown: boolean;
    timezoneId: string;
    latitude: number;
    longitude: number;
  };
  houseSystem: 'Placidus' | 'WholeSign';
  includeOptionalPoints: string[];
  reference: {
    planetSource: 'NASA JPL Horizons';
    planetSourceUrl: string;         // URL truy vấn cụ thể đã dùng
    planetSourceRetrievedAt: string; // ISO date đã tra cứu
    houseSource: 'Astrodienst Extended Chart Selection' | null;   // null nếu fixture Unknown-time (không có house)
    houseSourceUrl: string | null;
    houseSourceRetrievedAt: string | null;
    houseSourceLimitation: string | null; // bắt buộc nếu houseSource khác null — ghi rõ "same underlying engine"
  };
  expectedPlanets: Array<{
    name: string;
    longitude: number;               // độ, đã normalize [0,360)
    isRetrograde: boolean;
  }>;
  expectedHouses: Array<{ number: number; cuspDegree: number }> | null; // null nếu Unknown birth time
  expectedAngles: Array<{ type: string; longitude: number }> | null;
  tolerance: 0.01;                   // độ — luôn 0.01, không override per-fixture (D-8 đã đóng băng)
  notes: string;                     // giới hạn/giả định riêng của fixture này (ví dụ Lilith dùng nguồn nào)
}
```

### 6.4 Cách thu thập (Task-level, thực hiện bởi developer/AI coding agent lúc code, không phải lúc lập plan)

1. Chốt `birthData` cụ thể cho từng fixture (ngày/giờ/địa điểm) theo đúng tiêu chí Mục 6.2.
2. Với mỗi fixture: gọi JPL Horizons (batch API hoặc web form tại `ssd.jpl.nasa.gov/horizons/app.html`), site = geocentric, target = từng thiên thể, thời điểm = đúng UTC đã quy đổi từ `birthData`, lấy "apparent geocentric ecliptic longitude" (không phải RA/Dec — cần chọn đúng output quantity, hoặc tự convert RA/Dec→ecliptic longitude bằng công thức chuẩn nếu Horizons không xuất trực tiếp ecliptic longitude ở mode đã chọn — ghi rõ cách nào được dùng trong `notes`).
3. Với house cusps: dùng astro.com Extended Chart Selection, nhập đúng `birthData`, chọn house system tương ứng, ghi lại 12 cusp + 4 Angle.
4. Ghi toàn bộ vào fixture JSON theo schema Mục 6.3, kèm URL + thời điểm tra cứu cụ thể (không chỉ ghi "đã tra cứu trên astro.com" mà không có bằng chứng truy vết được).
5. `README.md` tổng hợp cách làm, ngày thực hiện, giới hạn đã biết (Mục 5.3).

---

## 7. Golden Test Implementation

**Vị trí:** `backend/tests/golden/astrology-engine.golden.test.ts` (thư mục mới `tests/golden/`, tách khỏi `tests/unit`/`tests/integration` để rõ mục đích — không lẫn với Unit Test đã có).

**Thiết kế (đúng đề bài Mục 8 — test đúng boundary Adapter+Engine, không phải API):**

```typescript
describe.each(loadGoldenFixtures())('Golden Reference: $fixtureId', (fixture) => {
  it('matches reference planet longitudes within tolerance', async () => {
    const chart = await chartBuilder.build({
      id: 'golden-test', userId: null, birthProfileId: null,
      engineInput: EngineInput.create(fixture.birthData, { houseSystem: fixture.houseSystem, ... }),
    });
    for (const expected of fixture.expectedPlanets) {
      const actual = chart.planets.find(p => p.name === expected.name);
      expect(actual).toBeDefined();
      assertAngleWithinTolerance(actual.longitude, expected.longitude, fixture.tolerance, {
        fixtureId: fixture.fixtureId, field: `planet.${expected.name}.longitude`,
      });
      expect(actual.isRetrograde).toBe(expected.isRetrograde);
    }
  });

  it('matches reference house cusps within tolerance (nếu fixture có houseSource)', () => {
    if (!fixture.expectedHouses) return; // Unknown birth time — không có house để test, đúng D-9
    // ... assertAngleWithinTolerance cho từng cusp
  });
});
```

Gọi **trực tiếp `ChartBuilder`** (giống `chart-builder.test.ts`, M3) với `SwissEphemerisAdapter` **thật** (không Fake) — đúng ranh giới "Adapter + Engine" đề bài yêu cầu, không qua HTTP/Repository.

### 7.1 Angle Comparison Utility (mới — đã xác nhận chưa tồn tại, Mục 2)

**File mới:** `backend/src/shared/utils/angle-comparison.util.ts` (production code, không phải test-only, vì đây là utility toán học thuần túy có thể tái dùng — đặt ở `shared/utils/` đúng vị trí `type.utils.ts` đã có).

```typescript
export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function circularDelta(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(diff, 360 - diff); // xử lý đúng case 359.999° vs 0.001° → delta ≈ 0.002°, không phải 359.998°
}

export function isWithinAngleTolerance(actual: number, expected: number, toleranceDegrees: number): boolean {
  return circularDelta(actual, expected) <= toleranceDegrees;
}
```

**Test helper riêng** (không phải production code — đặt trong `tests/golden/helpers/`):
```typescript
export function assertAngleWithinTolerance(
  actual: number, expected: number, tolerance: number,
  context: { fixtureId: string; field: string },
): void {
  const delta = circularDelta(actual, expected);
  if (delta > tolerance) {
    throw new Error(
      `Fixture: ${context.fixtureId}\nField: ${context.field}\n` +
      `Expected: ${expected.toFixed(5)}°\nActual:   ${actual.toFixed(5)}°\n` +
      `Delta:    ${delta.toFixed(5)}°\nTolerance: ${tolerance.toFixed(5)}°`,
    );
  }
}
```
Đúng format failure message đề bài yêu cầu ở Mục 18 (Fixture/Planet/Expected/Actual/Delta/Tolerance) — không dùng `expect(a).toBeCloseTo(b)` mặc định của Vitest (message quá chung chung, không đúng yêu cầu debug-ability).

**Lý do đặt `normalizeAngle`/`circularDelta` ở `shared/utils/` thay vì chỉ trong test:** Đây là utility toán học thuần túy, không phụ thuộc test framework — đặt ở `shared` cho phép Domain code (ví dụ `aspect.calculator.ts`, hiện đang tự viết lại logic tương tự nội bộ) tái sử dụng trong tương lai nếu cần refactor — **nhưng M8 không tự ý refactor `aspect.calculator.ts` để dùng utility mới này** (đúng nguyên tắc "không refactor lớn ngoài scope", Mục 21 đề bài) — chỉ tạo utility mới, để riêng.

---

## 8. End-to-End Integration Test

**Vị trí:** `backend/tests/integration/e2e/natal-chart-pipeline.e2e.test.ts` (thư mục mới `tests/integration/e2e/`, phân biệt với `tests/integration/modules/*/repositories/` đã có).

**Luồng thật, không mock (đúng đề bài Mục 9/10):**

```typescript
it('completes the full natal chart pipeline: BirthProfile → Chart → Persist → Read → Delete', async () => {
  // 1. Authenticated user (JWT thật qua tokenProvider, giống pattern login.api.test.ts)
  const user = await factory.createUser({...});
  const accessToken = tokenProvider.generateAccessToken({ sub: user.id, role: 'user' });

  // 2. Create BirthProfile (qua factory — hợp lệ vì đây là setup, không phải đối tượng đang test)
  const birthProfile = await factory.createBirthProfile(user.id, {...});

  // 3. POST /charts/natal?save=true dùng birthProfileId — QUA HTTP THẬT
  const createRes = await request(app)
    .post('/api/v1/charts/natal?save=true')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ birthProfileId: birthProfile.id, houseSystem: 'Placidus', includeOptionalPoints: [] });
  expect(createRes.status).toBe(201);
  const chartId = createRes.body.id;

  // 4. Verify persisted trực tiếp qua Postgres (không qua Repository code, để không "tự kiểm tra bằng chính công cụ đang test")
  const rawChart = await prisma.chart.findUnique({ where: { id: chartId }, include: { planets: true, houses: true } });
  expect(rawChart).not.toBeNull();
  expect(rawChart.user_id).toBe(user.id);
  expect(rawChart.birth_profile_id).toBe(birthProfile.id);
  expect(rawChart.planets.length).toBeGreaterThanOrEqual(10);

  // 5. GET /charts/{id} — verify đọc lại KHÔNG cần gọi Swiss Ephemeris lần 2
  const ephemerisSpy = vi.spyOn(swissEphAdapterInstance, 'calculateNatal'); // spy, KHÔNG mock giá trị trả về
  const getRes = await request(app).get(`/api/v1/charts/${chartId}`).set('Authorization', `Bearer ${accessToken}`);
  expect(getRes.status).toBe(200);
  expect(ephemerisSpy).not.toHaveBeenCalled(); // đúng yêu cầu Mục 10: đọc snapshot không cần recalculate

  // 6. DELETE /charts/{id}
  const deleteRes = await request(app).delete(`/api/v1/charts/${chartId}`).set('Authorization', `Bearer ${accessToken}`);
  expect(deleteRes.status).toBe(204);

  // 7. Verify soft-delete đúng Database Design Spec §9: charts.deleted_at set, 6 bảng con VẪN CÒN
  const afterDelete = await prisma.chart.findUnique({ where: { id: chartId } });
  expect(afterDelete.deleted_at).not.toBeNull();
  const remainingPlanets = await prisma.chartPlanet.count({ where: { chart_id: chartId } });
  expect(remainingPlanets).toBeGreaterThan(0); // không hard-delete, đúng M5 đã thiết kế

  // 8. GET lại sau khi xóa → 404
  const getAfterDelete = await request(app).get(`/api/v1/charts/${chartId}`).set('Authorization', `Bearer ${accessToken}`);
  expect(getAfterDelete.status).toBe(404);
});
```

**Không mock:** `BirthProfile`/`Chart` repository, Swiss Ephemeris adapter, Astrology Engine, Prisma — toàn bộ dùng instance thật từ `bootstrapApplication()` (đúng pattern `login.api.test.ts` đã có). `vi.spyOn` (không thay đổi return value) chấp nhận được để verify "không gọi lại" — khác với mock (thay hành vi).

**`GET /charts` (đề bài Mục 12 — không phải optional):** Đã xác nhận M7 đã có `list-charts.api.test.ts` đầy đủ pagination/filter/sort/ownership isolation (verify lại ở Mục 2 + review M7 trước đó) — **M8 không lặp lại toàn bộ**, chỉ cần **1 representative case bổ sung trong chính E2E test này** (ví dụ sau bước 3, gọi `GET /charts` verify Chart vừa tạo xuất hiện đúng trong danh sách) để xác nhận `GET /charts` nằm trong luồng pipeline thật, không phải vì M7 chưa đủ.

---

## 9. Test Infrastructure

Đã xác nhận (Mục 2) hạ tầng hiện có **đủ dùng**, không cần tạo mới ngoài 2 việc nhỏ:
1. Thư mục `tests/golden/` và `tests/integration/e2e/` (mới, chỉ là tổ chức file, không phải hạ tầng mới).
2. `tests/fixtures/golden/` + loader function `loadGoldenFixtures()` (đọc toàn bộ `.json` trong thư mục, parse theo schema Mục 6.3) — file nhỏ, không phải framework mới.

**Không tạo Docker Compose riêng cho Golden Test** — dùng chung `docker-compose.test.yml`/CI Postgres service đã có (Golden Test không cần Postgres — chỉ Engine+Adapter — nhưng chạy trong cùng `npm run test:coverage` nên không có lý do tách môi trường).

---

## 10. CI Verification

Đã đọc trực tiếp `backend-ci.yml`: **1 lệnh `npm run test:coverage` duy nhất chạy toàn bộ `tests/`** — Golden Test và E2E Test đặt dưới `tests/golden/`/`tests/integration/e2e/` sẽ **tự động được CI chạy** mà không cần sửa CI config gì thêm (đúng yêu cầu đề bài "Không để Golden Test chỉ chạy local" — thỏa mãn tự nhiên nhờ cấu trúc CI hiện có, không cần corrective task).

**Xác nhận không cần tách riêng:** Golden Test không phụ thuộc internet lúc runtime (dữ liệu đã "đóng băng" trong fixture JSON, JPL Horizons/Astrodienst chỉ dùng **lúc chuẩn bị dữ liệu**, không phải lúc chạy test — đúng yêu cầu Mục 15 "Reproducibility"). Swiss Ephemeris WASM đã chạy được trong CI từ M2 (đã verify nhiều lần xuyên suốt M2-M7) — không có rủi ro "ephemeris data không available trong CI".

**Runtime:** Ước tính 5 fixture × 2 test (planet+house) × thời gian tính 1 chart (~vài chục ms theo quan sát M3) ≈ không đáng kể so với tổng thời gian CI hiện tại — không cần optimize hay tách job riêng.

---

## 11. Licensing / Data Provenance

Không mở lại quyết định licensing cấp project (Open-source + Swiss Ephemeris GPL/AGPL path đã đóng ở M2 — `docs/legal/swisseph-license-record.md`). M8 chỉ xử lý provenance của **Golden Reference Data**, tách biệt hoàn toàn:

| Khía cạnh | Software License (đã đóng, không đụng) | Data License (M8 xử lý) |
|---|---|---|
| Swiss Ephemeris/`swisseph-wasm` | GPL-3.0-or-later (đã ghi ở M2) | Không liên quan tới data provenance |
| **NASA JPL Horizons output** | — | **Public domain** (US government work, xác nhận qua search — NASA/JPL là cơ quan liên bang Mỹ) — **được phép commit trực tiếp** giá trị số vào fixture JSON, không cần lưu metadata thay vì raw data |
| **Astrodienst (astro.com) output** | — | Terms of Use đã đọc trực tiếp: cho phép trích dẫn ngắn/không thường xuyên, nhưng **không rõ ràng cho phép redistribute số liệu tính toán hàng loạt** — **thận trọng:** chỉ commit **giá trị số đã trích xuất** (cusp degree, longitude — dữ liệu tính toán thô, không phải bản sao "chart drawing"/nội dung diễn giải có bản quyền), kèm ghi rõ nguồn+URL+ngày truy cập trong fixture, **không** commit ảnh chụp màn hình hay HTML gốc |

**Quyết định:** Được phép commit fixture JSON (chỉ chứa số liệu + metadata nguồn), không commit bất kỳ nội dung trình bày/hình ảnh nào từ astro.com. Ghi rõ attribution trong `golden/README.md`.

---

## 12. Files To Create

| File | Purpose | Responsibility | Dependencies |
|---|---|---|---|
| `backend/src/shared/utils/angle-comparison.util.ts` | `normalizeAngle`/`circularDelta`/`isWithinAngleTolerance` | Production utility, xử lý wrap-around 0°/360° | Không |
| `backend/tests/fixtures/golden/README.md` | Provenance, quy trình thêm fixture | Documentation | Mục 6.4 |
| `backend/tests/fixtures/golden/fixture-00{1..5}-*.json` | 5 Golden Chart fixture | Dữ liệu test, đúng schema Mục 6.3 | JPL Horizons + Astrodienst (thu thập thủ công) |
| `backend/tests/golden/helpers/load-golden-fixtures.ts` | Đọc + parse toàn bộ fixture JSON | Test helper | Fixture files |
| `backend/tests/golden/helpers/assert-angle-tolerance.ts` | Assertion với error message chi tiết (Mục 7.1) | Test helper | `angle-comparison.util.ts` |
| `backend/tests/golden/astrology-engine.golden.test.ts` | Golden Reference Test chính | Test | `ChartBuilder`, `SwissEphemerisAdapter` thật, fixtures |
| `backend/tests/integration/e2e/natal-chart-pipeline.e2e.test.ts` | E2E Integration Test | Test | `bootstrapApplication()`, `PrismaTestFactory` |
| `backend/tests/unit/shared/utils/angle-comparison.util.test.ts` | Unit test cho utility mới (case 359.999 vs 0.001, v.v.) | Test | `angle-comparison.util.ts` |

## 13. Files To Modify

**Không có file production nào cần sửa** — đã xác nhận M1-M7 đủ năng lực cho M8 tiêu thụ nguyên trạng (Mục 2). Nếu Golden Test phát hiện lỗi thật trong Adapter/Engine, sẽ phát sinh corrective task **riêng, ngoài phạm vi task list ban đầu** (đúng quy trình Mục 25 đề bài: FAIL → Investigate → Classify → Fix root cause → Re-run — không phải task đã biết trước).

## 14. Files NOT To Modify

`chart/domain/**`, `chart/infrastructure/**`, `chart/application/**`, `chart/presentation/**`, `birth-profile/**`, Prisma schema/migrations, REST API contract (`*.openapi.ts`), `docker-compose.test.yml`, `backend-ci.yml` (không cần sửa, đã xác nhận Mục 10).

---

## 15. Task Breakdown

**M8-T1 — Verify Test Infrastructure**
- Objective: Xác nhận Mục 2/9 đúng thật (không giả định), phát hiện sớm nếu thiếu gì.
- Files: Không tạo.
- Implementation: Đọc `vitest.config.ts`, `docker-compose.test.yml`, `backend-ci.yml`, `PrismaTestFactory`, `DatabaseTestHelper` — đối chiếu đúng Mục 2 bảng đã liệt kê.
- Dependencies: Không.
- Acceptance: Xác nhận bằng văn bản (comment/PR description) rằng hạ tầng đủ dùng, không cần thêm gì ngoài 2 thư mục mới.
- Testing: N/A (bước verify).
- Risk: Thấp.

**M8-T2 — Chuẩn bị Golden Chart Data**
- Objective: Thu thập 5 fixture theo Mục 6.
- Files: `tests/fixtures/golden/*.json`, `tests/fixtures/golden/README.md`.
- Implementation: Theo đúng quy trình Mục 6.4 — tra cứu JPL Horizons + Astrodienst thật, ghi provenance đầy đủ.
- Dependencies: M8-T1.
- Acceptance: Đủ 5 fixture, mỗi fixture có đủ field theo schema Mục 6.3, có URL+ngày truy cập cụ thể, không có giá trị nào thiếu nguồn.
- Testing: Review thủ công (peer review) từng fixture trước khi dùng để code test — **không tự động hóa được bước này** (đúng bản chất "provenance" cần con người xác nhận).
- Risk: Cao — sai sót ở bước này (nhập nhầm số liệu tra cứu) sẽ lan ra toàn bộ Golden Test.

**M8-T3 — Angle Comparison Utility**
- Objective: `angle-comparison.util.ts` + unit test.
- Files: Mục 12 (2 file đầu).
- Implementation: Mục 7.1.
- Dependencies: Không (độc lập, có thể làm song song M8-T2).
- Acceptance: `circularDelta(359.999, 0.001)` ≈ `0.002`, không phải `359.998`; `circularDelta(10, 350)` = `20`.
- Testing: Unit test đủ case biên (wrap-around cả 2 chiều, giá trị âm, giá trị >360).
- Risk: Thấp — thuật toán đơn giản, nhưng critical cho toàn bộ Golden Test nên cần test kỹ.

**M8-T4 — Golden Test Implementation**
- Objective: Viết `astrology-engine.golden.test.ts` + 2 helper.
- Files: Mục 12.
- Implementation: Mục 7.
- Dependencies: M8-T2, M8-T3.
- Acceptance: Cả 5 fixture chạy, assertion dùng `assertAngleWithinTolerance`, message lỗi đúng format Mục 18 đề bài khi cố tình cho fail (test thử).
- Testing: Chính là Golden Test — tự nó là bài test cuối.
- Risk: Trung bình — nếu fail thật, cần phân loại đúng theo quy trình Mục 25 đề bài trước khi kết luận là lỗi code hay lỗi fixture.

**M8-T5 — E2E Integration Test**
- Objective: `natal-chart-pipeline.e2e.test.ts`.
- Files: Mục 12.
- Implementation: Mục 8.
- Dependencies: M8-T1 (hạ tầng), độc lập với T2-T4.
- Acceptance: Toàn bộ 8 bước Mục 8 pass, `ephemerisSpy` xác nhận không gọi lại lúc `GET`.
- Testing: Chính nó là integration test.
- Risk: Trung bình — nhiều bước liên tiếp, dễ vỡ nếu 1 bước giữa chừng sai (ví dụ token hết hạn, race condition Postgres).

**M8-T6 — CI Verification**
- Objective: Xác nhận Mục 10 đúng thật bằng cách chạy CI thật (hoặc mô phỏng local sát nhất có thể) sau khi có đủ M8-T2 đến M8-T5.
- Files: Không sửa (đã xác nhận không cần).
- Dependencies: M8-T2 đến M8-T5.
- Acceptance: `npm run test:coverage` local (hoặc CI thật) chạy đủ Golden+E2E, pass, thời gian chấp nhận được.
- Testing: N/A (bước verify CI).
- Risk: Thấp.

**M8-T7 — Final M8 Review**
- Objective: Tổng duyệt toàn bộ, đối chiếu Acceptance Criteria (Mục 17) + Definition of Done (Mục 18).
- Files: Không.
- Dependencies: M8-T1 đến M8-T6.
- Acceptance: Checklist Mục G (Acceptance Criteria Checklist) đầy đủ.
- Testing: `npm run lint`/`typecheck`/`test:coverage`/`build` toàn backend.
- Risk: Thấp.

---

## 16. Execution Order

```
M8-T1 (Verify Infrastructure)
      │
      ├──────────────┬──────────────┐
      ▼              ▼              ▼
M8-T2 (Golden Data) M8-T3 (Angle Util) M8-T5 (E2E Test, độc lập với Golden)
      │              │
      └──────┬───────┘
             ▼
      M8-T4 (Golden Test)
             │
             ▼ (chờ cả T4 và T5 xong)
      M8-T6 (CI Verification)
             │
             ▼
      M8-T7 (Final Review)
```

M8-T2 (chuẩn bị data, cần con người tra cứu) và M8-T3 (utility thuần code) có thể làm song song. M8-T5 (E2E) hoàn toàn độc lập với nhánh Golden, có thể làm song song từ đầu.

---

## 17. Acceptance Criteria

1. ≥5 Golden Chart fixture, mỗi fixture có đủ provenance (nguồn, URL, ngày truy cập) — không giá trị nào không truy nguyên được.
2. Tolerance `0.01°` áp dụng nhất quán, dùng `circularDelta` (không bug 359.999 vs 0.001).
3. Toàn bộ Golden Test pass với dữ liệu thật (không sửa tolerance để pass nếu fail — phải fix root cause).
4. E2E test đầy đủ 8 bước (Mục 8), không mock core pipeline.
5. `GET /charts` có ít nhất 1 case trong luồng E2E (đề bài Mục 12), không cần lặp lại toàn bộ M7 test.
6. CI chạy đủ Golden+E2E trong `npm run test:coverage` hiện có, không cần job riêng.
7. Không có migration/domain/API contract nào bị đổi.

---

## 18. Definition of Done

- [ ] 5 Golden fixture có nguồn thật, không tự tính rồi dùng chính output làm expected.
- [ ] `golden/README.md` đầy đủ provenance, quy trình thêm fixture mới, ai có quyền update expected value.
- [ ] Golden Test pass thật (không phải giảm tolerance để pass).
- [ ] E2E test pass, verify đủ: BirthProfile tồn tại, Chart đúng user/birthProfileId, snapshot đọc lại không cần recalculate, soft-delete đúng (6 bảng con không mất), FK/integrity đúng.
- [ ] `angle-comparison.util.ts` có unit test riêng, cover đúng case wrap-around.
- [ ] CI pass đầy đủ (lint, typecheck, generate:openapi, test:coverage, build).
- [ ] Không vi phạm architecture boundary (Golden/E2E test không import chéo layer sai).
- [ ] Không mở rộng scope ngoài đề bài (không thêm Pattern algorithm, không thêm planet mới, v.v.).
- [ ] Data license Astrodienst được xử lý đúng (chỉ commit số liệu, không commit nội dung trình bày).

---

## 19. Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| JPL Horizons và Swiss Ephemeris lệch nhau > 0.01° do khác mô hình lý thuyết (ví dụ nutation/aberration handling khác nhau nhẹ) dù cả 2 đều "đúng" theo chuẩn riêng | Cao nếu xảy ra — có thể tạo false negative | Trung bình | Nếu fail nhẹ (<0.05°) và nhất quán trên nhiều fixture, phân loại là "reference source mismatch" (không phải bug AstroViet) — đối chiếu thêm Astro.com cho planet đó để xác nhận trước khi kết luận, ghi nhận rõ trong `notes` fixture, **không** tự ý nâng tolerance |
| Timezone/DST nhập sai lúc tra cứu Horizons/Astrodienst (con người tự quy đổi UTC thủ công) | Cao | Trung bình | Luôn tra cứu bằng UTC time đã tự quy đổi sẵn (không để công cụ bên ngoài tự quy đổi hộ, tránh double-conversion) — ghi rõ UTC timestamp dùng để query trong fixture |
| Ephemeris version mismatch (JPL DE version khác, Swiss Ephemeris file version khác) | Trung bình | Thấp | Ghi rõ ngày truy cập — đủ để truy vết lại nếu có nghi ngờ sau này |
| Floating-point precision (M3 đã đảm bảo không làm tròn sớm) | Thấp | Thấp | Đã verify từ M3 review, không phải rủi ro mới |
| House cusp lệch do 2 house-system code khác nhau map sai (ví dụ nhầm Placidus code) | Trung bình | Thấp | Đã verify M2 mapping đúng — Golden Test là lớp double-check cuối, không phải lần đầu |
| Data redistribution/license (Astrodienst) | Trung bình | Thấp | Đã xử lý ở Mục 11 — chỉ commit số liệu |
| CI environment khác local (timezone, node version) | Thấp | Thấp | `TZ=UTC` đã set cứng ở `vitest.config.ts`, không phụ thuộc machine — đã verify từ M3 |

---

## H. Open Questions

Đã đối chiếu tài liệu đã đóng băng trước khi giữ lại — chỉ 2 câu hỏi thật sự cần xác nhận (2 câu còn lại trong đề bài đã tự resolve được):

### OQ-1 — Exact Golden Reference Source: RESOLVED trong chính plan này

Đề bài yêu cầu xác nhận nguồn cụ thể — đã resolve dứt điểm ở Mục 5: NASA JPL Horizons (planet) + Astrodienst Extended Chart Selection (house/angle), có phân tích rõ vì sao, không còn mở.

### OQ-2 — Fixture format/location: RESOLVED trong chính plan này

Đã resolve ở Mục 6.1/6.3 — `tests/fixtures/golden/*.json` + schema TypeScript cụ thể, dựa trên việc xác nhận repo chưa có convention nào xung đột.

### OQ-3 — External reference data có được commit hợp pháp không: RESOLVED trong chính plan này

Đã resolve ở Mục 11 — JPL Horizons (public domain, commit tự do), Astrodienst (thận trọng, chỉ commit số liệu trích xuất kèm attribution, không commit nội dung trình bày).

### OQ-4 — `GET /charts` đã đủ coverage từ M7 chưa: RESOLVED — CÓ, đã đủ

Đã verify trực tiếp `list-charts.api.test.ts` (M7, cập nhật ở `e348a75`): pagination, filter, sort, auth, **và ownership isolation** (bổ sung ở chính commit vừa review) đều đã có test đầy đủ. M8 chỉ cần 1 representative case trong luồng E2E (Mục 8), không cần viết thêm bất kỳ test `GET /charts` riêng biệt nào.

**Không còn Open Question nào thực sự chưa resolve — cả 4 câu đề bài liệt kê đều đã giải quyết dứt điểm ngay trong plan này**, đúng đúng yêu cầu "Nếu có thể resolve từ existing frozen documents/code, resolve thay vì để mở".

---

## I. Risks & Mitigations

Xem Mục 19 (đầy đủ).

---

## J. Final Recommendation

> **READY FOR IMPLEMENTATION.**

Không có blocker kiến trúc, không có Open Question nào thực sự chưa resolve, hạ tầng test hiện có (CI, Postgres, Swiss Ephemeris WASM, Vitest config) đã đủ dùng cho toàn bộ M8 mà không cần thay đổi gì. Rủi ro lớn nhất nằm ở **chất lượng thu thập dữ liệu Golden** (M8-T2, công việc con người, không phải công việc kiến trúc) — đây là lý do M8-T2 được đánh giá "Risk: Cao" duy nhất trong toàn bộ task breakdown, cần review kỹ trước khi dùng để code Golden Test.

---

# B–G. (Đã tích hợp vào từng mục tương ứng ở trên)

Theo cấu trúc đề bài yêu cầu, các mục B (Implementation Plan chi tiết), C (File Change Matrix), D (Dependency Graph), E (Golden Fixture Specification), F (Test Matrix), G (Acceptance Criteria Checklist) đã được trình bày đầy đủ lần lượt ở Mục 15 (Task Breakdown), Mục 12–14 (Files), Mục 16 (Execution Order), Mục 6.3 (Fixture Schema), bảng dưới đây (Test Matrix), và Mục 17–18 (AC/DoD) — không lặp lại để tránh trùng lặp nội dung.

### F. Test Matrix (tổng hợp)

| Fixture/Test | Layer | Source | Tolerance | Expected behavior |
|---|---|---|---|---|
| golden-001 (Hanoi, known time, Placidus) | Golden | JPL Horizons + Astrodienst | 0.01° | Planet + House + Angle đúng |
| golden-002 (Southern hemisphere) | Golden | JPL Horizons + Astrodienst | 0.01° | Vĩ độ âm xử lý đúng |
| golden-003 (Mercury retrograde thật) | Golden | JPL Horizons | 0.01° | `isRetrograde=true` đúng thiên văn thật |
| golden-004 (Unknown birth time) | Golden | JPL Horizons only | 0.01° | Chỉ Planet, không House/Angle (D-9) |
| golden-005 (WholeSign + DST) | Golden | JPL Horizons + Astrodienst | 0.01° | House system 2 + DST đúng (bài học M3) |
| E2E pipeline | End-to-End | N/A (behavior test, không phải giá trị số) | N/A | 8 bước Mục 8 pass |
| `GET /charts` trong E2E | End-to-End | N/A | N/A | 1 representative case, không lặp lại M7 |

---

## G. Acceptance Criteria Checklist (dùng để review PR)

- [ ] 5 Golden fixture, mỗi cái đủ 15 field theo schema Mục 6.3.
- [ ] Không giá trị Golden nào tự tính bằng AstroViet rồi dùng làm expected.
- [ ] `angle-comparison.util.ts` xử lý đúng wrap-around 359.999/0.001.
- [ ] Golden Test message lỗi đúng format (Fixture/Field/Expected/Actual/Delta/Tolerance).
- [ ] E2E test không mock BirthProfile/Chart repository, Swiss Ephemeris, Prisma.
- [ ] E2E test verify đọc lại Chart không gọi lại Swiss Ephemeris.
- [ ] E2E test verify soft-delete đúng Database Design Spec §9.
- [ ] CI chạy Golden+E2E tự động, không cần thay đổi CI config.
- [ ] Data provenance: JPL Horizons (public domain) commit tự do; Astrodienst chỉ commit số liệu, có attribution.
- [ ] Không sửa Domain/API/DB schema nào ngoài kế hoạch.
