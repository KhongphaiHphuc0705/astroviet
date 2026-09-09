# Sprint 3 Backend — Milestone 9 Implementation Plan
## Coverage & Edge-Case Review

---

## 0. Terminology Correction (trước khi vào nội dung)

Đề bài trích 2 nguồn cần làm rõ vì tên gọi không khớp chính xác cấu trúc tài liệu thật (đã verify trực tiếp, không giả định):

- **"Backend Coverage Policy Mục 12.7"** — **không phải 1 tài liệu riêng**. Đây là **§12.7 của `Sprint_3_Natal_Chart_Module_Implementation_Plan.md`** (Sprint 3 Backend Implementation Plan), mục "Coverage Policy (Risk-Based)". Plan này trích dẫn đúng là "Sprint 3 Backend Plan §12.7".
- **"21 Testable Business Rules Mục 12.1"** — vị trí thật là **§31 Natal Chart Domain Specification** ("Testable Business Rules"), không phải "§12.1" (đó là 1 mục khác — Domain Implementation Strategy — của Sprint 3 Backend Plan).
- **"18 Edge Cases"** — xác nhận đúng vị trí **§36 Swiss Ephemeris Integration Specification** ("Edge Cases") — khớp đề bài.

Không mở lại nội dung 2 tài liệu này — chỉ sửa lại cách trích dẫn cho chính xác.

---

## 1. Executive Summary

M1–M8 đã đóng, verify sạch trên `dev` (`d699afe`). M9 là milestone audit thuần túy — **không viết thêm production code cho tính năng mới**, chỉ: (1) đối chiếu từng TR/Edge Case với test thật đã có, (2) bổ sung đúng những gì thật sự thiếu, (3) sửa 1 discrepancy hạ tầng nghiêm trọng phát hiện được trong chính quá trình audit.

**Phát hiện quan trọng nhất — không nằm trong danh sách đề bài liệt kê sẵn:** `vitest.config.ts` có `coverage.thresholds = {statements:80, branches:80, functions:80, lines:80}` (global, hard-fail) — **mâu thuẫn trực tiếp** với chính Sprint 3 Backend Plan §12.7 đã CONFIRMED: *"Không có ngưỡng % toàn cục... coverage % chỉ là chỉ số chẩn đoán, không phải Acceptance Criterion"*. Đây là cấu hình sót lại từ Sprint 0 (comment trong chính file xác nhận: *"Sau này sẽ config overrides cho domain là 90%"* — kế hoạch threshold-based chưa từng được rollback khi Sprint 3 đổi chính sách). CI hiện tại (`npm run test:coverage`, không có `continue-on-error`) sẽ **fail cứng toàn bộ pipeline** nếu bất kỳ 1 trong 4 metric tụt dưới 80% — kể cả khi gap đó là **có chủ đích, đã risk-assessed là chấp nhận được** theo đúng §12.7. Đây là **Implementation Defect** cần sửa ở M9.

Sau khi audit đầy đủ 21 TR + 18 Edge Case + Leap Year bằng cách đọc trực tiếp từng test file (không suy đoán từ tên file), phát hiện: **20/21 TR PASS đầy đủ, 1 TR PARTIAL**; **13/18 Edge Case PASS, 1 PARTIAL, 4 GAP thật**; **Leap Year đã có test nhưng ở sai layer** (BirthProfile input-validation, chưa từng exercise qua pipeline tính toán Chart thật).

**Phát hiện quan trọng thứ hai (đã RESOLVED qua audit, không còn là Open Question):** Swiss Ephemeris Integration Spec §36 (case 11/12) đã đóng băng yêu cầu: *"mọi lỗi initialization/runtime của Swiss Ephemeris phải được translate thành `ExternalServiceError('EPHEMERIS_PROVIDER_ERROR', ...)` tại Infrastructure boundary trước khi lỗi đi ra ngoài adapter"* — đây **không phải quyết định cần chọn**, mà là requirement đã freeze. Đã audit trực tiếp `composition-root.ts`: `await swissEph.initSwissEph();` được gọi **trực tiếp trên `SwissEph` thô**, **trước khi** `SwissEphemerisAdapter` được khởi tạo — nghĩa là lệnh init hiện tại **nằm ngoài Adapter boundary hoàn toàn**, không có try/catch nào bọc nó. Đây là **corrective task thật** (Mục 8, M9-T4), không phải chỉ thiếu test.

---

## 2. Current-State Verification

Đã đọc trực tiếp toàn bộ 92 file test hiện có trong `backend/tests/` (liệt kê bằng `find`, không giả định), chạy `npx vitest run --coverage` thật cho phạm vi không cần Postgres (`chart` + `shared` + `golden`), và chạy `lint`/`typecheck`/`generate:openapi` thật.

| Hạng mục | Trạng thái |
|---|---|
| Tổng số test file | 92 (`identity`: 12, `birth-profile`: 22, `chart`: 30, `shared`: 14, `golden`/`e2e`/API: 14) |
| `npm run test:coverage` (chạy phạm vi không cần DB) | **FAIL** — không phải vì test sai, mà vì global threshold 80% (Mục 1) |
| `npm run lint` | PASS |
| `npm run typecheck` (phạm vi không cần Prisma Client) | PASS |
| `npm run generate:openapi` | PASS |
| Golden Test (M8) | PASS (25 test, Swiss Ephemeris thật) |

**Kết luận:** Không có regression nào từ M1-M8. Vấn đề coverage-threshold là **cấu hình**, không phải chất lượng test kém.

---

## 3. Business Rule Coverage Matrix (21 TR — Natal Chart Domain Spec §31)

| TR | Rule | Test file(s) đã verify | Trạng thái | Ghi chú |
|---|---|---|---|---|
| TR-1 | Zodiac normalization (375°→15°) | `zodiac-position.vo.test.ts` | ✅ PASS | |
| TR-2 | Longitude→Sign (195.5°→Libra) | `zodiac-position.vo.test.ts`, `planet.calculator.test.ts` | ✅ PASS | |
| TR-3 | House numbering — hoán vị {1..12} | `house.calculator.test.ts` | ✅ PASS | |
| TR-4 | Whole Sign behavior | `house.calculator.test.ts` | ✅ PASS | |
| TR-5 | Placidus result contract | `house.calculator.test.ts`, `swiss-ephemeris.adapter.test.ts` | ✅ PASS | |
| TR-6 | Placidus không hội tụ | `high-latitude-policy.test.ts`, `swiss-ephemeris.adapter.test.ts`, `chart-builder.test.ts` | ✅ PASS | |
| TR-7 | Unknown birth time | `chart-builder.test.ts`, `time-conversion.test.ts` | ✅ PASS | |
| TR-8 | Aspect exact | `aspect.calculator.test.ts` | ✅ PASS | |
| TR-9 | Orb boundary trong ngưỡng (≤) | `aspect.calculator.test.ts` | ✅ PASS | |
| TR-10 | Orb boundary ngoài ngưỡng | `aspect.calculator.test.ts` | ✅ PASS | |
| TR-11 | Duplicate aspect prevention | `aspect.calculator.test.ts` | ✅ PASS | |
| TR-12 | Retrograde detection (`speed<0`) | `planet.calculator.test.ts` | ✅ PASS | |
| TR-13 | Sun/Moon retrograde invariant | `planet.entity.test.ts`, `chart-builder.test.ts` | ✅ PASS | |
| TR-14 | Chart immutability | `chart-builder.test.ts`, `chart.entity.test.ts` | ⚠️ PARTIAL | Chưa có assertion tường minh kiểu "method update không tồn tại trên type" — đề bài §31 ghi rõ mức kiểm tra này, hiện chỉ suy luận gián tiếp từ thiết kế |
| TR-15 | Deterministic calculation | `chart-builder.test.ts` | ✅ PASS | Test gọi `build()` 2 lần **cùng `id`** — đủ cho TR-15, nhưng không đủ cho Edge Case #18 (2 mối quan tâm khác nhau) |
| TR-16 | Invalid coordinate | `chart-input.validator.test.ts` | ✅ PASS | |
| TR-17 | Unsupported house system | `chart-input.validator.test.ts` | ✅ PASS | |
| TR-18 | 0°/360° wraparound Aspect | `aspect.calculator.test.ts` | ✅ PASS | |
| TR-19 | Angle DSC/ASC bất biến 180° | `angle.calculator.test.ts` | ✅ PASS | |
| TR-20 | Optional points mặc định rỗng | `planet.calculator.test.ts` | ✅ PASS | |
| TR-21 | Optional points có chỉ định | `planet.calculator.test.ts` | ✅ PASS | |

**Tổng kết:** 20/21 PASS đầy đủ, 1/21 PARTIAL (TR-14 — thiếu 1 assertion cụ thể, không phải thiếu hoàn toàn).

---

## 4. Edge Case Coverage Matrix (18 case — Swiss Ephemeris Integration Spec §36)

| # | Case | Test file(s) đã verify | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 1 | Unknown birth time | `chart-builder.test.ts`, `time-conversion.test.ts` | ✅ PASS | = TR-7 |
| 2 | Midnight `00:00:00` | `time-conversion.test.ts`, `chart-input.validator.test.ts` | ✅ PASS | |
| 3 | DST transition | `time-conversion.test.ts` ("Spring Forward skipped hour") | ✅ PASS | |
| 4 | Historical timezone | `time-conversion.test.ts` (4 case thật: pre-1911 LMT, 1943-1945, 1970 South Vietnam, post-1975) | ✅ PASS | Vượt yêu cầu tối thiểu — dùng đúng lịch sử múi giờ Việt Nam thật |
| 5 | Longitude near 0°/360° | `aspect.calculator.test.ts` | ✅ PASS | = TR-18 |
| 6 | Latitude near poles | `high-latitude-policy.test.ts`, `swiss-ephemeris.adapter.test.ts` | ✅ PASS | = TR-6 |
| 7 | Unsupported latitude for Placidus | Đồng nhất case 6 (chính §36 tự ghi "đồng nhất") | ✅ PASS | Không cần test riêng |
| 8 | Exact sign boundary (29.9999999°) | Không tìm thấy test dùng giá trị gần-biên floating-point cụ thể | ❌ GAP | |
| 9 | Exact aspect boundary | `aspect.calculator.test.ts` | ✅ PASS | = TR-9 |
| 10 | Station/zero speed (`speed=0`) | Không tìm thấy | ❌ GAP | `planet.calculator.test.ts` chỉ test `speed<0`/`speed>0` |
| 11 | Missing/corrupt bundled ephemeris data | Không tìm thấy | ❌ GAP | Chỉ có test "used before init" (khác case) |
| 12 | WASM initialization failure | Không tìm thấy | ❌ GAP | Cùng nhóm nguyên nhân với case 11 |
| 13 | Unsupported planet | `chart-input.validator.test.ts` | ✅ PASS | |
| 14 | Unsupported house system | `chart-input.validator.test.ts` | ✅ PASS | = TR-17 |
| 15 | Invalid coordinates | `chart-input.validator.test.ts` | ✅ PASS | = TR-16 |
| 16 | Invalid datetime | `chart-input.validator.test.ts`, BirthProfile validate | ✅ PASS | |
| 17 | Concurrent calculations | Không tìm thấy | ❌ GAP | `swiss-ephemeris.adapter.test.ts` không test gọi đồng thời |
| 18 | Repeated calculations (khác `id`, không dedupe) | `chart-builder.test.ts` (TR-15) dùng **cùng `id`** cho cả 2 lần | ⚠️ PARTIAL | Chưa chứng minh "khác id vẫn tính lại đầy đủ, không cache" |

**Tổng kết:** 13/18 PASS, 1/18 PARTIAL (case 18), **4/18 GAP thật** (case 8, 10, 11+12, 17).

---

## 5. Leap Year (AC riêng, không thuộc 18 case)

**Đã tìm thấy:** `birth-date.vo.test.ts` (BirthProfile module, Sprint 2) có đúng 2 test: `'2000-02-29'` (hợp lệ) và `'2001-02-29'` (reject đúng) — **thực sự exercise đúng 29/02**, không phải test tổng quát mơ hồ.

**Nhưng:** đây là test ở **tầng input validation của BirthProfile** — **chưa từng có test nào đưa ngày 29/02 đi qua toàn bộ pipeline tính toán Chart thật** (`time-conversion.ts` → Julian Day conversion) để xác nhận Swiss Ephemeris xử lý đúng ngày nhuận trong ngữ cảnh **tính toán thiên văn**, không chỉ ngữ cảnh **validate ngày hợp lệ**.

**Kết luận:** ⚠️ PARTIAL — cần 1 test bổ sung ở tầng Chart pipeline, không phải viết lại từ đầu.

---

## 6. Coverage Analysis

**Không dùng % làm kết luận cuối** (đúng §12.7) — nhưng phải báo cáo phát hiện cấu hình mâu thuẫn chính sách, vì đây là root cause khiến % trở thành blocking dù chính sách nói không nên vậy.

| Discrepancy | Phân loại | Vị trí |
|---|---|---|
| `vitest.config.ts` có `coverage.thresholds` global 80% (4 metric) | **Implementation Defect** (config sót lại từ Sprint 0, chưa reconcile với Sprint 3 §12.7) | `backend/vitest.config.ts` dòng 36-41 |
| Comment nội bộ file tự thừa nhận kế hoạch cũ chưa rollback | Bằng chứng trực tiếp, không suy đoán | cùng vị trí |
| CI (`backend-ci.yml`) chạy `npm run test:coverage` không có `continue-on-error` | Hệ quả — bất kỳ dip nào dưới 80% sẽ fail toàn bộ CI, kể cả khi gap đã risk-assessed chấp nhận được | `.github/workflows/backend-ci.yml` dòng 71-74 |

**Vùng rủi ro thấp không cần thêm test riêng (risk-based §12.7):** getter/setter thuần, DTO/interface type-only, mapping bảng tĩnh đã test đủ representative case.

**Vùng rủi ro cao đã review đầy đủ:** Domain business rule (TR), Adapter/Engine boundary (Edge Case), input validation, ownership/auth.

---

## 7. Gap Analysis (tổng hợp)

| Gap | Nguồn | Mức độ | Việc cần làm |
|---|---|---|---|
| G1 | TR-14 — thiếu assertion "method không tồn tại" | Thấp | Thêm 1 test nhỏ |
| G2 | Edge Case #8 — exact sign boundary floating-point | Thấp | Thêm 1 test |
| G3 | Edge Case #10 — station/zero speed | Trung bình | Thêm 1 test |
| G4 | Edge Case #11+12 — ephemeris/WASM init fail-fast **chưa translate đúng contract đã freeze** | Cao — ảnh hưởng khả năng khởi động app đúng ngữ nghĩa lỗi | Corrective fix (wrap `initSwissEph()` tại boundary) + test verify đúng behavior sau fix |
| G5 | Edge Case #17 — concurrent calculations | Trung bình | Thêm test gọi đồng thời N request |
| G6 | Edge Case #18 — repeated calculations khác `id` | Thấp | Mở rộng test TR-15 hiện có |
| G7 | Leap year — chưa test qua Chart pipeline thật | Trung bình | Thêm 1 test ở `time-conversion.test.ts` |
| G8 | `vitest.config.ts` coverage threshold mâu thuẫn §12.7 | **Cao — ảnh hưởng toàn bộ CI** | Sửa cấu hình |

**Không có gap nào yêu cầu sửa Domain logic/Business rule thật** — 7 gap về test (G1-G7) đều là thiếu test case cho hành vi đã đúng sẵn. G8 là gap hạ tầng.

---

## 8. Test Enhancement Plan

### M9-T1 — TR-14: Chart immutability assertion cụ thể
File: `tests/unit/modules/chart/domain/entities/chart.entity.test.ts`.
```typescript
it('TR-14: Chart entity does not expose any update/mutation method', () => {
  const chart = /* fixture */;
  expect((chart as unknown as Record<string, unknown>).update).toBeUndefined();
});
```

### M9-T2 — Edge Case #8: exact sign boundary floating-point (CONFIRMED — OQ-2 resolved)
File: `tests/unit/modules/chart/domain/value-objects/zodiac-position.vo.test.ts`.
```typescript
it('Edge Case #8: 29.9999999° stays in Aries (floor(longitude/30), no rounding/compensation)', () => {
  const position = ZodiacPosition.fromLongitude(29.9999999);
  expect(position.sign).toBe(ZodiacSign.Aries);
  expect(position.degreeInSign).toBeCloseTo(29.9999999, 6);
});
```
Domain Spec đã đóng băng công thức `sign = floor(longitude / 30)` và yêu cầu chấp nhận floating-point boundary tự nhiên, không thêm rule bù trừ — `29.9999999 / 30 = 0.999...` → `floor = 0` → Aries. Assertion cụ thể, không còn phụ thuộc kết quả chạy thử.

### M9-T3 — Edge Case #10: station/zero speed
File: `tests/unit/modules/chart/domain/engine/calculators/planet.calculator.test.ts`.
```typescript
it('Edge Case #10: speed exactly 0 is not retrograde (D-12 Deferred, binary check only)', () => {
  const raw = { name: PlanetName.Mercury, longitude: 100, latitude: 0, speed: 0 };
  const result = calculatePlanets([raw], []);
  expect(result.find(p => p.name === PlanetName.Mercury)?.isRetrograde).toBe(false);
});
```

### M9-T4 — Edge Case #11+12: ephemeris/WASM init fail-fast (REWRITTEN — CONFIRMED, không test raw SDK)

**Quyết định (CONFIRMED):** Không test trực tiếp `brokenSwe.initSwissEph()` như test chính — test đó chỉ chứng minh SDK gốc có throw, **không chứng minh AstroViet bắt và dịch lỗi đúng contract**. Test phải nhắm vào **boundary thật của AstroViet** (Adapter/bootstrap), không phải raw `swisseph-wasm`.

**Corrective fix trước (bắt buộc, vì Decision 1 — Mục 12 — đã RESOLVED: đây là requirement đã freeze, không phải tính năng mới):** Đã audit `composition-root.ts` — `swissEph.initSwissEph()` hiện gọi trực tiếp, không có try/catch. Bổ sung 1 hàm nhỏ, testable, **không thay đổi lifecycle/thứ tự khởi tạo hiện có** (chỉ bọc lại đúng call site đã có):

```typescript
// composition-root.ts (hoặc file nhỏ riêng nếu cần export để test, ví dụ initialize-ephemeris-provider.ts)
export async function initializeEphemerisProvider(swe: SwissEph): Promise<void> {
  try {
    await swe.initSwissEph();
  } catch (error) {
    throw new ExternalServiceError(
      ErrorCode.EPHEMERIS_PROVIDER_ERROR,
      'Failed to initialize Swiss Ephemeris',
      { cause: error },
    );
  }
}
```
`composition-root.ts` gọi `await initializeEphemerisProvider(swissEph);` thay vì gọi thẳng `swissEph.initSwissEph()` — **không đổi thứ tự, không đổi lifecycle**, chỉ bọc đúng 1 lớp translation tại đúng vị trí đã freeze.

File test: file mới nhỏ cạnh hàm trên (`initialize-ephemeris-provider.test.ts`), vì `composition-root.ts` không có test file hiện có.

```typescript
describe('Ephemeris Provider bootstrap boundary (Edge Case #11, #12)', () => {
  it('translates a raw initSwissEph() failure into ExternalServiceError(EPHEMERIS_PROVIDER_ERROR) — fail-fast', async () => {
    const brokenSwe = { initSwissEph: vi.fn().mockRejectedValue(new Error('corrupt ephemeris data')) } as unknown as SwissEph;

    await expect(initializeEphemerisProvider(brokenSwe)).rejects.toMatchObject({
      constructor: ExternalServiceError,
      errorCode: ErrorCode.EPHEMERIS_PROVIDER_ERROR,
    });
  });
});
```
Assertion nhắm đúng **behavior của boundary AstroViet** (`initializeEphemerisProvider`), không phải hành vi của `swisseph-wasm` tự nó.

### M9-T5 — Edge Case #17: concurrent calculations (REWRITTEN — CONFIRMED, phải chứng minh serialization)
File: `tests/unit/modules/chart/infrastructure/adapters/swiss-ephemeris.adapter.test.ts`.

**Quyết định (CONFIRMED):** `Promise.all()` + kết quả khác nhau **chưa chứng minh** queue/serialization hoạt động — chỉ chứng minh output đúng, có thể đúng "tình cờ". Test phải **track số lượng WASM call đang chạy đồng thời tại một thời điểm**, xác nhận tối đa 1 (đúng cơ chế Mutex/serialize queue đã thiết kế từ M2).

```typescript
it('Edge Case #17: serializes concurrent calculateNatal calls — never more than 1 in-flight at a time', async () => {
  let activeCalls = 0;
  let maxConcurrentCalls = 0;
  const originalCalcUt = mockSwe.calc_ut;
  mockSwe.calc_ut = vi.fn(async (...args) => {
    activeCalls++;
    maxConcurrentCalls = Math.max(maxConcurrentCalls, activeCalls);
    await new Promise((r) => setTimeout(r, 5)); // giả lập độ trễ WASM thật
    activeCalls--;
    return originalCalcUt(...args);
  });

  const results = await Promise.all([reqA, reqB, reqC].map((r) => adapter.calculateNatal(r)));

  expect(maxConcurrentCalls).toBe(1); // chứng minh serialization thật, không chỉ suy luận từ output
  expect(results[0].planets[0].longitude).not.toBeCloseTo(results[1].planets[0].longitude, 1); // đồng thời verify từng request vẫn đúng, không lẫn dữ liệu
});
```

### M9-T6 — Edge Case #18: mở rộng test TR-15 hiện có (REWRITTEN — CONFIRMED, phải chứng minh "no dedupe" thật)
File: `tests/unit/modules/chart/domain/engine/chart-builder.test.ts` (thêm case mới, không tạo file mới).

**Quyết định (CONFIRMED):** `chart1.id !== chart2.id` + giá trị số giống nhau **chỉ chứng minh determinism** (đã có ở TR-15) — **chưa chứng minh** không có cache/dedupe. Test phải spy trực tiếp `calculateNatal()` và xác nhận gọi đúng 2 lần.

```typescript
it('Edge Case #18: repeated calculation with different Chart id calls the ephemeris provider twice — no caching/dedup', async () => {
  const calculateNatalSpy = vi.spyOn(fakeEphemerisProvider, 'calculateNatal');

  const chart1 = await builder.build({ ...baseInput, id: 'chart-id-1' });
  const chart2 = await builder.build({ ...baseInput, id: 'chart-id-2' });

  expect(calculateNatalSpy).toHaveBeenCalledTimes(2); // chứng minh thực sự execute lại, không dedupe
  expect(chart1.id).not.toBe(chart2.id);
  expect(chart1.planets[0].longitude).toEqual(chart2.planets[0].longitude);
});
```

### M9-T7 — Leap year qua Chart pipeline thật
File: `tests/unit/modules/chart/domain/engine/time-conversion.test.ts`.
```typescript
it('correctly converts a leap-year birth date (2000-02-29) to UTC', () => {
  const result = convertLocalTimeToUtc(new Date('2000-02-29'), {hour:12,minute:0,second:0}, 'Asia/Ho_Chi_Minh');
  expect(result.toISOString()).toBe('2000-02-29T05:00:00.000Z');
});
```

---

## 9. Infra/CI Adjustments

**M9-T8 — Sửa `vitest.config.ts` coverage threshold (Implementation Defect, Mục 1/6)**

```diff
     coverage: {
       provider: 'v8',
       reporter: ['text', 'json', 'html'],
       include: ['src/**/*.ts'],
       exclude: [...],
-      thresholds: {
-        statements: 80,
-        branches: 80,
-        functions: 80,
-        lines: 80,
-        // Chú ý: Ở Sprint 0-4, ta áp dụng 80% cho Application (health, etc).
-        // Sau này sẽ config overrides cho 'src/modules/*/domain/**' là 90%.
-      },
+      // Coverage threshold toàn cục đã bị loại bỏ theo Sprint 3 Backend Plan §12.7
+      // (CONFIRMED, risk-based policy — không dùng % làm Acceptance Criterion).
+      // Report vẫn được sinh ra (text/json/html) để làm công cụ chẩn đoán,
+      // nhưng KHÔNG làm fail CI dựa trên %.
     },
```

**Lý do đây là corrective task hợp lệ trong scope M9:** §12.7 đã CONFIRMED từ trước khi Sprint 3 bắt đầu — cấu hình `vitest.config.ts` chưa từng được cập nhật theo quyết định này là 1 defect thật, và M9 ("Coverage & Edge-Case Review") là milestone đúng nghĩa để phát hiện + sửa loại lệch này.

**Không sửa gì trong `backend-ci.yml`** — sau khi bỏ threshold, `npm run test:coverage` sẽ tự nhiên không fail vì %, không cần thêm `continue-on-error`.

---

## 10. Files To Create/Modify

| File | Loại | Lý do |
|---|---|---|
| `composition-root.ts` (hoặc file nhỏ mới `initialize-ephemeris-provider.ts`) | Sửa/thêm (corrective, CONFIRMED — Decision 1) | M9-T4 — bọc `initSwissEph()` bằng translation đã freeze, không đổi lifecycle |
| `tests/unit/modules/chart/domain/entities/chart.entity.test.ts` | Sửa (thêm test) | M9-T1 |
| `tests/unit/modules/chart/domain/value-objects/zodiac-position.vo.test.ts` | Sửa (thêm test) | M9-T2 |
| `tests/unit/modules/chart/domain/engine/calculators/planet.calculator.test.ts` | Sửa (thêm test) | M9-T3 |
| `tests/unit/modules/chart/infrastructure/adapters/swiss-ephemeris.adapter.test.ts` | Sửa (thêm `describe` mới) | M9-T5 |
| (test file mới cho `initializeEphemerisProvider`) | Mới, nhỏ | M9-T4 |
| `tests/unit/modules/chart/domain/engine/chart-builder.test.ts` | Sửa (thêm 1 test) | M9-T6 |
| `tests/unit/modules/chart/domain/engine/time-conversion.test.ts` | Sửa (thêm test) | M9-T7 |
| `backend/vitest.config.ts` | Sửa (xóa `thresholds` block) | M9-T8 |

**Duy nhất 1 file production được sửa** (`composition-root.ts`, corrective fix đã CONFIRMED cần thiết — không phải "mở rộng scope", mà là hiện thực hóa đúng requirement đã freeze mà audit phát hiện chưa implement). Toàn bộ 7 gap test (G1-G7) được vá bằng cách bổ sung vào file test đã có (trừ 1 file test nhỏ mới cho `initializeEphemerisProvider`, vì hàm này chưa từng tồn tại).

---

## 11. Dependency Graph

```
M9-T1, T2, T3, T6, T7 (độc lập nhau, có thể làm song song)
M9-T4 (corrective fix `initializeEphemerisProvider` TRƯỚC, rồi mới viết test tương ứng — không thể đảo ngược thứ tự)
M9-T5 (cùng file adapter test với phần describe của T4 cũ, độc lập về logic, có thể làm song song T4)
M9-T8 (độc lập hoàn toàn — chỉ sửa config)
      │
      ▼ (tất cả xong)
M9 Final Review — chạy lại toàn bộ test + coverage report (không threshold) + lint + typecheck + build
```

---

## 12. Resolved Decisions (trước là Open Questions — cả 2 đã CONFIRMED)

### Decision 1 (trước: OQ-1) — Error translation tại init boundary là bắt buộc, không phải lựa chọn

**Đã RESOLVED:** Swiss Ephemeris Integration Spec đã đóng băng yêu cầu — mọi lỗi initialization/runtime của Swiss Ephemeris phải translate thành `ExternalServiceError('EPHEMERIS_PROVIDER_ERROR', ...)` tại Infrastructure boundary. Đây không còn là quyết định cần chọn.

**Audit hiện tại:** `composition-root.ts` gọi `swissEph.initSwissEph()` trực tiếp, không có translation — vi phạm requirement đã freeze.

**Hành động:** Corrective fix (Mục 8, M9-T4) — bọc call site bằng `initializeEphemerisProvider()`, dịch đúng sang `ExternalServiceError(EPHEMERIS_PROVIDER_ERROR)`. **M9 chỉ audit implementation hiện tại để xác định đúng vị trí boundary, không tự thiết kế lại lifecycle khởi tạo** — thứ tự/cách gọi `initSwissEph()` giữ nguyên, chỉ thêm đúng 1 lớp translation tại đúng vị trí đã có.

### Decision 2 (trước: OQ-2) — `29.9999999°` thuộc Aries

**Đã RESOLVED:** Domain Spec đã đóng băng công thức `sign = floor(longitude / 30)`, yêu cầu chấp nhận floating-point boundary tự nhiên, không thêm rounding/compensation rule → `29.9999999°` → Aries, `degreeInSign ≈ 29.9999999`. Assertion cụ thể đã áp dụng ở M9-T2 (Mục 8), không còn phụ thuộc kết quả chạy thử trước khi viết.

**Không còn Open Question nào trong M9.**

---

## 13. Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| M9-T4 corrective fix chưa đúng vị trí boundary, cần điều chỉnh lại sau review | Trung bình | Thấp (đã audit rõ vị trí — `composition-root.ts`, Mục 12 Decision 1) | Code review kỹ trước khi merge, đối chiếu đúng requirement đã freeze |
| Xóa `coverage.thresholds` làm giảm động lực viết test trong tương lai | Thấp | Thấp | §12.7 đã risk-assessed điều này — review có chủ đích (M9 đang làm) là cơ chế thay thế đã chấp nhận |
| Test concurrent (M9-T5) flaky do timing thật | Thấp | Thấp | Dùng `Promise.all` với input cố định, so sánh giá trị không so sánh thời gian |
| Sign boundary test (M9-T2) không nhất quán giữa môi trường | Rất thấp | Rất thấp | JS `Number` xử lý theo IEEE 754, không phụ thuộc OS/platform |

---

## 14. Acceptance Criteria

1. Ma trận 21 TR đầy đủ, mỗi dòng trỏ đúng test file thật đã đọc.
2. Ma trận 18 Edge Case đầy đủ.
3. Leap year đánh giá riêng, không lẫn vào 18 case.
4. Discrepancy `vitest.config.ts` được báo cáo và sửa, trích dẫn rõ §12.7.
5. Đúng 7 gap test (G1-G7) được vá, cộng 1 corrective fix production (`initializeEphemerisProvider`, Decision 1) — không tạo file test thừa ngoài kế hoạch, không sửa production logic ngoài phạm vi cần thiết.
6. Không mở lại quyết định đã đóng (D-8 tolerance, D-12 station deferred, D-14 Pattern deferred).

---

## 15. Definition of Done

- [ ] 21/21 TR có dòng trong ma trận, đối chiếu test thật.
- [ ] 18/18 Edge Case có dòng trong ma trận, đối chiếu test thật.
- [ ] Leap year đánh giá riêng, gap được vá (M9-T7).
- [ ] `vitest.config.ts` không còn `coverage.thresholds` global, đã ghi chú lý do trong chính file.
- [ ] 7 gap test (G1-G7) được vá bằng cách bổ sung vào file test đã có (hoặc 1 file test nhỏ mới cho `initializeEphemerisProvider`).
- [ ] Corrective fix `initializeEphemerisProvider` (Decision 1) triển khai đúng, không đổi lifecycle khởi tạo hiện có.
- [ ] `npm run lint`/`typecheck`/`build` pass.
- [ ] `npm run test:coverage` chạy xong (có report), không fail vì %.
- [ ] Không sửa Domain Model, REST API contract, DB schema, hay bất kỳ quyết định đã đóng băng nào khác.

---

## 16. Final Recommendation

> **READY FOR IMPLEMENTATION** — không còn Open Question nào (cả 2 đã CONFIRMED thành Resolved Decisions, Mục 12). Phát hiện quan trọng nhất của M9 không nằm trong danh sách 21 TR/18 Edge Case đề bài liệt kê sẵn, mà là **discrepancy hạ tầng CI** (`vitest.config.ts` threshold mâu thuẫn §12.7) — đúng đây mới là giá trị thật của 1 milestone "Coverage & Edge-Case Review" độc lập: không chỉ tick-box từng case đã biết, mà phát hiện được sai lệch hệ thống mà không ai chủ động tìm trước đó. Song song đó, audit cũng phát hiện 1 corrective fix production thật sự cần thiết (`initializeEphemerisProvider`) — không phải chỉ thiếu test, mà thiếu đúng 1 lớp translation đã được đóng băng làm requirement từ trước.
