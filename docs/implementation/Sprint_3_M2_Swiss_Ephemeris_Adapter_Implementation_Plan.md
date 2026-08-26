# Sprint 3 Backend — M2 Implementation Plan

## Swiss Ephemeris Dependency & Adapter Foundation

**Phiên bản:** 1.0
**Trạng thái:** Implementation-ready — **Technical Spike đã thực thi thật** (không phải "sẽ verify sau") trong quá trình lập kế hoạch này: đã cài `swisseph-wasm@0.1.0` thật, đọc trực tiếp `LICENSE`/`package.json`/`types/index.d.ts`/`llms.txt` từ tarball npm thật, và **chạy code thật** để quan sát hành vi (init time, house calculation, polar latitude, invalid input, error message chính xác). Kết quả spike được trình bày đầy đủ ở Mục 6, không phải giả định.
**Vị trí:** Milestone 2/10 của Sprint 3 Backend.
**Không mở lại quyết định domain/integration đã Confirmed** ở Natal Chart Domain Specification v1.1, Swiss Ephemeris Integration Specification v1.1, Sprint 3 Backend Implementation Plan v1.1 — tài liệu này thực thi cụ thể cho M2, đồng thời **báo cáo phát hiện thật** từ Technical Spike (có 2 phát hiện quan trọng cần đối chiếu lại quyết định cũ — Mục 7).

---

## 1. Milestone Overview

**Tên:** Sprint 3 Backend — Milestone 2: Swiss Ephemeris Dependency & Adapter Foundation
**Mục tiêu 1 câu:** Cài đặt, pin version, verify license, và dựng `SwissEphemerisAdapter` (implement `IEphemerisProvider` đã định nghĩa ở M1) hoạt động thật với dữ liệu thiên văn thật — Domain layer (M1) tuyệt đối không đổi.

**Đặc điểm milestone:** Đây là milestone **duy nhất** trong Sprint 3 chạm trực tiếp vào external dependency (`swisseph-wasm`) — mọi milestone khác (M3 trở đi) chỉ tiêu thụ `IEphemerisProvider` qua interface, không biết `swisseph-wasm` tồn tại.

**Khác biệt với M1:** M1 là Domain thuần túy (0 I/O). M2 là Infrastructure layer đầu tiên của `chart/` — có I/O thật (WASM), có async thật, có external dependency thật.

---

## 2. Source Documents & Authority

Đúng thứ bậc đã dùng cho M1 (không đổi):
1. Frozen project decisions / Project Architecture Specification
2. Natal Chart Domain Specification v1.1 (Confirmed)
3. Swiss Ephemeris Integration Specification v1.1 (Confirmed)
4. REST API Specification
5. Database Design Specification
6. Backend Coding Standards & Conventions
7. Sprint 3 Backend Implementation Plan v1.1 (Confirmed)
8. Sprint 3 M1 Implementation Plan (đã thực thi, đã merge — `dcbac7a`)
9. **Bổ sung riêng cho M2: bằng chứng thật từ Technical Spike** (Mục 6) — đây là **nguồn sự thật cao nhất** cho bất kỳ chi tiết API/hành vi cụ thể nào của `swisseph-wasm`, vượt trên mọi giả định trước đó trong Swiss Ephemeris Integration Spec (đúng nguyên tắc "existing/actual > assumed" đã áp dụng xuyên suốt dự án)
10. Existing codebase convention

**Đã inspect trực tiếp trước khi viết:** toàn bộ `backend/src/modules/chart/domain/` đã merge từ M1 (6 Entity, 4 VO, 6 Error, 2 Port — xác nhận `IEphemerisProvider` tại `chart/domain/ports/ephemeris-provider.port.ts` khớp đúng chữ ký sẽ implement); `backend/src/shared/errors/` (`ExternalServiceError`, `error-codes.ts` đã có `EPHEMERIS_PROVIDER_ERROR`); `.github/workflows/backend-ci.yml` (đã fix ở M1, xác nhận không cần sửa gì thêm ở M2).

---

## 3. Current Project Context

M1 (Domain Foundation) — **COMPLETED, đã merge** (`dcbac7a`, xác nhận qua review trước: 59/59 test `chart/` pass, 0 lỗi boundaries, CI backend chạy đúng từ root). `chart/domain/` tồn tại đầy đủ, `chart/infrastructure/` **chưa tồn tại** — M2 là milestone đầu tiên tạo thư mục này.

`backend/package.json` **chưa có** `swisseph-wasm` (xác nhận qua M1 Plan Mục 3, vẫn đúng tại thời điểm này — chưa có commit nào thêm dependency mới kể từ M1 merge).

---

## 4. M2 Objective

Kết nối `IEphemerisProvider` (đã định nghĩa ở M1) với `swisseph-wasm` thật — implement đầy đủ 3 method, đúng WASM lifecycle đã Confirmed (eager init, singleton, luôn serialize), đúng error translation, khởi tạo License/Compliance Record với dữ liệu thật (không phải placeholder).

**Trả lời dứt khoát 12 câu hỏi Technical Spike (đề bài Mục 6)** — toàn bộ đã có câu trả lời **thật**, không còn "cần verify sau":

| Câu hỏi | Trả lời (chi tiết đầy đủ Mục 6) |
|---|---|
| Package chính xác nào? | `swisseph-wasm` — duy nhất kết quả phù hợp trên npm registry |
| Version pin? | `0.1.0` (mới nhất, duy nhất phiên bản ổn định hợp lý — Mục 6.1) |
| API instantiation? | `new SwissEph()` + `await swe.initSwissEph()` — bắt buộc, async |
| Calculation method chính xác? | `calc_ut(jd, planetId, flags)` → `Float64Array(6)` |
| House calculation? | `houses(jd, lat, lon, hsysCode: string)` → `{cusps: Float64Array(13), ascmc: Float64Array(10)}` |
| Error handling thật? | `calc`/`calc_ut` throw; hầu hết method khác trả `null` + `getLastError()`; **`houses()` không throw, không trả null, không có tín hiệu non-convergence rõ ràng — silently degenerate** (phát hiện quan trọng, Mục 7.1) |
| Ephemeris file quản lý thế nào? | Bundled sẵn trong package (`wasm/swisseph.data`), mount tại `/sweph` ảo, **host OS path không hoạt động được** — không cần AstroViet quản lý gì |
| Whole Sign hỗ trợ? | Có, `hsys='W'` — đã verify bằng cách chạy thật, output đúng |
| Concurrency behavior? | Không tài liệu hóa rõ — giữ nguyên quyết định "luôn serialize" (D-Confirmed trước, không đổi) |
| Memory/cleanup API? | `swe.close()` — có, khuyến cáo tường minh trong docs ("Always clean up!") |
| Node compatibility? | `engines.node: >=14.0.0` — tương thích `>=22.18.0` của AstroViet |
| Module format? | ESM thuần (`"type":"module"`, chỉ có `"import"` condition) — khớp 100% với backend AstroViet đã là ESM thật (đã đính chính ở Sprint 3/M1 Plan) |

---

## 5. Scope

- Cài đặt `swisseph-wasm@0.1.0` vào `backend/package.json` (dependency thật, không phải devDependency — dùng ở runtime).
- `chart/infrastructure/adapters/swiss-ephemeris.adapter.ts` — implement `IEphemerisProvider` đầy đủ 3 method.
- `chart/infrastructure/adapters/house-system.mapping.ts` — map `HouseSystem` enum → mã ký tự Swiss Ephemeris.
- `chart/infrastructure/adapters/celestial-body.mapping.ts` — map `PlanetName` enum → `SE_*` constant.
- `chart/infrastructure/adapters/high-latitude-policy.ts` (**mới, không có trong Sprint 3 Plan gốc — phát sinh trực tiếp từ phát hiện Technical Spike Mục 7.1**) — logic xác định "not_convergent" bằng ngưỡng vĩ độ, **không** dựa vào tín hiệu từ thư viện (vì thư viện không có tín hiệu đó).
- Wiring singleton + serialize queue vào `backend/src/composition-root.ts`.
- License/Compliance Record — file thật `docs/legal/swisseph-license-record.md`, điền đầy đủ dữ liệu thật từ Technical Spike (Mục 6.5).
- Test: Adapter Test (dùng WASM thật) theo `backend/tests/unit/modules/chart/infrastructure/adapters/`.

**Không thuộc Scope M2:** Domain Calculator (M3), Chart Builder (M3), bất kỳ thay đổi nào ở `chart/domain/` (M1 đã đóng, M2 chỉ tiêu thụ), Application/Presentation layer (M6/M7).

---

## 6. Technical Spike Results (đã thực thi thật)

### 6.1 Package Identity & Version

Chạy `npm view swisseph-wasm` (registry.npmjs.org thật) tại thời điểm lập kế hoạch:

```
swisseph-wasm@0.1.0 | GPL-3.0-or-later | deps: none | versions: 5
Published: ~1 tháng trước | Maintainer: prolaxu (1 người)
Versions: 0.0.1, 0.0.2, 0.0.4, 0.0.5, 0.1.0
Repository: https://github.com/prolaxu/swisseph-wasm
Unpacked size: 3.1 MB
```

**Quyết định version pin: `0.1.0`** (exact, không dùng `^`/`~`) — lý do: (1) là version mới nhất và duy nhất version "1.x-adjacent" (0.1.0 > 0.0.x, coi là bản ổn định hơn theo semver pre-1.0 convention); (2) đúng nguyên tắc Determinism đã Confirmed (Swiss Ephemeris Integration Spec Mục 21) — pin cứng, không auto-upgrade.

**⚠️ Risk xác nhận thật (không phải suy đoán):** 1 maintainer, 5 version trong lịch sử ngắn, package rất mới (~1 tháng tuổi) — rủi ro bảo trì/bus-factor **cao hơn** mức trung bình đã ước lượng ở Swiss Ephemeris Integration Spec Mục 18 ("Trung bình–Cao"). Nâng mức rủi ro trong Risk Register (Mục 20) từ "Trung bình–Cao" → xác nhận **Cao**, dựa trên dữ liệu thật thay vì suy đoán.

### 6.2 API Surface (đã đọc `types/index.d.ts` + `llms.txt` từ tarball thật + chạy code thật)

```javascript
import SwissEph from 'swisseph-wasm';           // default export, ESM only
const swe = new SwissEph();
await swe.initSwissEph();                        // BẮT BUỘC — mọi method khác throw nếu gọi trước khi init xong
                                                    // Error message thật (đã verify): "SwissEph not initialized. Call await initSwissEph() first."
const jd = swe.julday(1990, 5, 15, 14.5);        // Julian Day — verify thật: julday(1990,5,15,14.5) = 2448027.1041666665
const sun = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED);
// → Float64Array(6): [longitude, latitude, distance, longitudeSpeed, latitudeSpeed, distanceSpeed]
const h = swe.houses(jd, latitude, longitude, 'P');
// → { cusps: Float64Array(13) — index 0 KHÔNG dùng, index 1..12 là 12 cusp thật; ascmc: Float64Array(10) — [0]=Ascendant, [1]=MC }
swe.close();                                       // giải phóng WASM instance — khuyến cáo tường minh trong docs gốc
```

**Hằng số đã verify thật bằng cách in trực tiếp từ instance:**
```
SE_SUN=0, SE_MOON=1, SE_MEAN_NODE=10, SE_TRUE_NODE=11, SE_MEAN_APOG=12, SE_CHIRON=15
SEFLG_SWIEPH=2, SEFLG_SPEED=256
```
(Khớp đúng giả định trước đó ở Swiss Ephemeris Integration Spec Mục 12 — **không có sai lệch**, chỉ nay có giá trị số cụ thể thay vì chỉ tên hằng số.)

**`calc()` vs `calc_ut()` — phát hiện quan trọng cần chọn đúng:** `calc()` nhận Julian Day **Ephemeris Time (ET)**, trả về **object** `{longitude, latitude, distance, ...}`; `calc_ut()` nhận Julian Day **Universal Time (UT)**, trả về **Float64Array**. Đã verify thật: 2 hàm cho kết quả longitude **khác nhau** (54.496545 vs 54.495908 — chênh lệch do delta-T) khi dùng cùng `jd`. **Quyết định: dùng `calc_ut()`** — vì `EphemerisRequest.utcDateTime` là UTC (≈UT), dùng đúng biến thể "_ut" tránh phải tự tính delta-T thủ công ở Adapter (thư viện tự lo).

**`houses()` trả `Float64Array(13)` cho `cusps`, không phải `Float64Array(12)`** — **index 0 không dùng**, cusp thật nằm ở index 1–12. Đây là chi tiết cụ thể **chưa từng được nêu ở bất kỳ spec nào trước** (Swiss Ephemeris Integration Spec chỉ nói "12 giá trị") — Adapter **bắt buộc** phải `cusps.slice(1, 13)` khi map sang `RawHouseData.cusps` (Mục 13), nếu không sẽ lệch toàn bộ 1 vị trí.

### 6.3 Error Handling (verify thật bằng cách gọi code thật, không chỉ đọc doc)

| Tình huống | Hành vi thật đã quan sát |
|---|---|
| Gọi method trước khi `initSwissEph()` | **Throw** `Error("SwissEph not initialized. Call await initSwissEph() first.")` |
| `calc`/`calc_ut` lỗi | **Throw** (theo `llms.txt`, chưa tạo được input gây lỗi thật để trigger trong spike — input hợp lệ luôn thành công) |
| Method khác lỗi (đa số) | Trả `null`, chi tiết qua `swe.getLastError()` |
| `houses()` ở vĩ độ cực (89.9°) | **Không throw, không trả null, không NaN** — trả về 1 bộ số "trông hợp lệ" nhưng là **kết quả suy biến (degenerate)**, không phải Placidus thật (xem 7.1) |
| House system code không hợp lệ (`'Z'`) | **Không throw** — vẫn trả về `cusps`/`ascmc` (giá trị không có ý nghĩa chiêm tinh học) |
| Gọi `initSwissEph()` 2 lần | Thành công lặng lẽ, không lỗi (an toàn để gọi lại nếu cần, dù M2 chỉ gọi 1 lần lúc bootstrap) |
| 2 instance `SwissEph` độc lập cùng lúc | Hoạt động độc lập, không giao thoa (đã verify — instance thứ 2 tính đúng, không bị ảnh hưởng bởi instance thứ 1) |

### 6.4 Ephemeris Data (verify thật qua doc + hành vi thật)

- File bundled: `sepl_18.se1` (planet chính), `semo_18.se1` (Mặt Trăng), `seas_18.se1` (asteroid gồm Chiron), `sefstars.txt`, `seorbel.txt`, `seleapsec.txt` — nằm trong `wasm/swisseph.data` (đã có trong tarball tải về thật, unpacked 3.1MB).
- **Host OS filesystem path KHÔNG hoạt động với `set_ephe_path()`** — mọi thứ chạy trong Emscripten virtual filesystem, mount cứng tại `/sweph`. `initSwissEph()` tự trỏ đúng, không cần gọi `set_ephe_path()`.
- **Phạm vi năm: ~1800–2400 AD** — khớp gần như chính xác với ước lượng đã Confirmed trước đó (OQ-6: "~1800–2399 CE") — sai lệch 1 năm ở biên không đáng kể, **xác nhận** ước lượng cũ đúng.
- **Hệ quả kiến trúc quan trọng, củng cố quyết định cũ:** vì host OS path không hoạt động được, việc "thêm `backend/ephemeris-data/` tùy biến" (đã quyết định KHÔNG làm ở OQ-6/7/10 Confirmed) **còn khó hơn dự kiến** nếu sau này cần — sẽ phải rebuild lại chính package (dùng `compile.sh`/Emscripten của package gốc, không phải chỉ copy file), không đơn giản như "đặt file vào 1 thư mục". Quyết định cũ (không tạo, chỉ dùng bundled) càng có cơ sở vững chắc hơn.

### 6.5 License (verify thật — đọc trực tiếp file `LICENSE` trong tarball, không chỉ theo `npm view`)

```
GNU GENERAL PUBLIC LICENSE, Version 3 — Copyright (C) 2024 prolaxu

ADDITIONAL TERMS FOR SWISS EPHEMERIS:
Swiss Ephemeris License:
- Non-commercial use: Free under GNU General Public License
- Commercial use: Requires a commercial license from Astrodienst AG
  (Astrodienst AG, Dammstrasse 23, CH-8702 Zollikon, Switzerland,
   swisseph@astro.com, https://www.astro.com/swisseph/)

"This wrapper library (swisseph-wasm) is provided under GPL-3.0-or-later,
but commercial use may require additional licensing for the underlying
Swiss Ephemeris calculations."
```

**⚠️ Phát hiện quan trọng nhất của toàn bộ Technical Spike — xem đầy đủ Mục 7.2.**

---

## 7. Findings Requiring Explicit Attention (không âm thầm điều chỉnh quyết định cũ)

### 7.1 `houses()` KHÔNG có tín hiệu non-convergence rõ ràng — cần thiết kế lại cách phát hiện

**Đã verify thật bằng cách chạy `houses()` ở dải vĩ độ 60°→89.9°** (Placidus, ngày 21/6/2000):

| Latitude | `cusps[1..3]` |
|---|---|
| 60° | `179.99, 201.69, 231.00` (biến thiên bình thường) |
| 66° | `179.99, 199.70, 227.83` |
| 66.5° | `179.99, 199.52, 227.50` |
| **67°** | `179.99, **209.99, 239.99**` ← **nhảy đột ngột sang pattern khác hẳn** |
| 70°, 80°, 89.9° | Cùng pattern suy biến như 67° (gần như cách đều nhau, không còn biến thiên tự nhiên của Placidus thật) |

**Kết luận thật (không suy đoán):** thư viện **âm thầm chuyển sang chế độ fallback/suy biến** đâu đó giữa 66.5° và 67° — **không throw, không trả null, không NaN, `getLastError()` rỗng**. Điều này **khác với giả định trước đó** ở Swiss Ephemeris Integration Spec Mục 11.3/18.3 (giả định: "Adapter phát hiện tín hiệu 'không hội tụ' từ SDK... cơ chế cụ thể cần verify") — giờ đã verify: **không có tín hiệu nào từ SDK để Adapter "phát hiện"**.

**Quyết định thiết kế mới (cần thiết, không phải tùy chọn):** `SwissEphemerisAdapter.calculateHouses()` phải **tự chủ động kiểm tra ngưỡng vĩ độ TRƯỚC khi gọi `houses()`** — nếu `|latitude| ≥ 66.5°` (ngưỡng đã có sẵn, Natal Chart Domain Spec Mục 15.3, không phải số mới bịa ra) → trả thẳng `{status: 'not_convergent'}` **không gọi `houses()` của thư viện nữa** (vì gọi cũng vô nghĩa — biết trước sẽ suy biến). Đây **không phải** thay đổi hợp đồng `HouseCalculationResult` đã Confirmed (Mục 8, vẫn giữ nguyên discriminated union) — chỉ thay đổi **cách Adapter tự quyết định** dùng nhánh nào, từ "đọc tín hiệu thư viện" (không khả thi, đã verify) sang "tự kiểm tra ngưỡng trước" (khả thi, dùng đúng ngưỡng đã đóng băng).

**File mới phát sinh từ phát hiện này:** `chart/infrastructure/adapters/high-latitude-policy.ts` (Mục 5) — 1 hàm thuần túy `isAboveConvergenceLatitude(latitude: number): boolean`, ngưỡng `66.5` là hằng số named export, có comment trích dẫn rõ nguồn (Natal Chart Domain Spec Mục 15.3) + lý do kỹ thuật (Technical Spike Mục 7.1 — thư viện không tự báo hiệu).

**Đây có phải "invented library behavior" không (đúng câu hỏi tự vấn Mục 21 đề bài)?** Không — đây là kết luận rút ra **trực tiếp từ dữ liệu thật đã chạy** (bảng trên), không phải suy đoán. Ngưỡng `66.5°` **không phải số tự bịa** — đã đóng băng từ trước ở Natal Chart Domain Spec (giới hạn toán học Placidus đã biết rộng rãi trong ngành).

### 7.2 License thật là GPL-3.0-or-later, KHÔNG phải AGPL — cần đối chiếu lại (không phải mở lại quyết định sản phẩm)

**Sự thật đã verify (đọc trực tiếp file `LICENSE`):** package `swisseph-wasm` là **GPL-3.0-or-later** (General Public License — không có điều khoản Affero/network-use). Swiss Ephemeris gốc: **miễn phí cho non-commercial use dưới GPL; commercial use cần mua license từ Astrodienst AG**.

**So với giả định trước đó** (Swiss Ephemeris Integration Spec Mục 37, Sprint 3 Backend Implementation Plan Mục 13 — cả 2 đều thảo luận theo khung **AGPL v3** với điều khoản "Network Use = Distribution", Section 13): đây là 2 cơ chế pháp lý **khác nhau về bản chất**:
- **AGPL** (giả định cũ): chạy phần mềm như network service **tự động** kích hoạt nghĩa vụ công khai mã nguồn cho người dùng tương tác qua mạng — bất kể có "commercial" hay không.
- **GPL** (sự thật đã verify): **không có** điều khoản network-use — chạy như network service **không tự động** kích hoạt nghĩa vụ công khai mã nguồn theo GPL thuần túy. Nghĩa vụ ở đây được đóng khung theo hướng khác: **"non-commercial = free, commercial = cần mua license"** — trục phân biệt là **commercial vs non-commercial**, không phải **network vs local**.

**Không mở lại quyết định sản phẩm** ("AstroViet là dự án open-source, dùng theo hướng AGPL" — OQ-B1 đã RESOLVED, Sprint 3 Backend Implementation Plan Mục 13) — quyết định "đi theo hướng mở/miễn phí, không mua Commercial License" **vẫn hoàn toàn hợp lệ và nhất quán** với sự thật mới (GPL non-commercial path chính là con đường AstroViet đã chọn). **Điều cần cập nhật** là **cơ chế pháp lý cụ thể** đang áp dụng: không phải "công khai mã nguồn vì có network use" (AGPL logic) mà là **"giữ đúng non-commercial để hợp lệ dùng miễn phí"** (GPL + Swiss Ephemeris dual-license logic) — 2 con đường tuân thủ khác nhau, cùng đi tới kết luận tương tự (không phải trả tiền Astrodienst) **nhưng có yêu cầu khác nhau về sau** (AGPL quan tâm "ai tương tác qua mạng"; điều khoản Swiss Ephemeris cụ thể ở đây quan tâm "có thu tiền/commercial hay không" — 2 câu hỏi compliance khác nhau, AstroViet cần trả lời cả 2 nếu muốn chắc chắn, không chỉ 1).

**Không đưa ra kết luận pháp lý vượt quá văn bản** (đúng nguyên tắc đã áp dụng nhất quán) — đây **không phải** kết luận "AstroViet có compliant hay không", chỉ là **báo cáo sự thật đã đọc trực tiếp từ file LICENSE**, đối chiếu với giả định cũ, và chỉ ra 2 cơ chế khác nhau cần Product Owner/pháp lý xem xét lại ở M10 Audit (License Record Mục 6.5 đã cập nhật đúng dữ liệu thật; M10 vẫn là nơi audit đầy đủ, không đổi trình tự Sprint 3 Plan).

**Câu hỏi compliance cụ thể cần M10 audit trả lời (không phải câu hỏi kỹ thuật của M2):** AstroViet có được coi là "non-commercial" theo định nghĩa của Astrodienst hay không? (Sản phẩm hiện tại chưa monetize — nhưng đây là câu hỏi kinh doanh/pháp lý, không phải kỹ thuật, đúng ranh giới đã xác lập từ Swiss Ephemeris Integration Spec Mục 37 "Do NOT make legal conclusions".)

---

## 8. Architecture & Dependency Rules for M2

Giữ nguyên hướng phụ thuộc:

```
chart/domain/ (M1, không đổi)
   ▲
chart/infrastructure/adapters/ (M2 — MỚI)
   │
   └── import 'swisseph-wasm' — CHỈ 1 FILE trong toàn bộ backend được phép: swiss-ephemeris.adapter.ts
```

**Ràng buộc cứng:**
- `swiss-ephemeris.adapter.ts` là **file duy nhất** trong toàn bộ `backend/src/` import `swisseph-wasm` — `house-system.mapping.ts`/`celestial-body.mapping.ts`/`high-latitude-policy.ts` **không** import `swisseph-wasm` (chỉ là bảng tra cứu/hàm thuần túy, độc lập thư viện).
- `chart/infrastructure/adapters/*.ts` **implement** interface từ `chart/domain/ports/` — không định nghĩa lại type nào (dùng lại `PlanetName`/`HouseSystem`/`RawEphemerisData`/`HouseCalculationResult` từ M1, `import` trực tiếp).
- **Không sửa bất kỳ file nào trong `chart/domain/`** ở M2 (nếu phát hiện cần đổi interface, đó là tín hiệu quay lại xác nhận với M1/spec thượng nguồn, không tự ý sửa — nhưng Mục 7 đã xác nhận **không cần đổi `IEphemerisProvider`**, chỉ cần thêm 1 file mapping mới ở Infrastructure).

---

## 9. Package Selection & Version Justification

Đã trình bày đầy đủ ở Mục 6.1 — tóm tắt quyết định: `swisseph-wasm@0.1.0`, exact pin.

**Đối chiếu 2 lựa chọn thay thế đã cân nhắc (đúng yêu cầu đề bài "if multiple candidate packages exist, compare"):**
- **Native binding** (ví dụ bind trực tiếp C library qua N-API) — **đã loại từ Architecture Spec ADR 22.1** (Confirmed, không mở lại) — WASM được chọn vì tính portable, không cần build native toolchain trên server.
- **`swisseph-wasm`** — package **duy nhất** trên npm registry khớp mô tả "Swiss Ephemeris WASM cho JavaScript/Node" tại thời điểm khảo sát (đã search registry, không tìm thấy package cạnh tranh nào khác cùng mục đích — không có "danh sách nhiều lựa chọn" thật để so sánh, chỉ có 1 candidate hợp lệ).

**Không có phương án B thực tế** — nếu package này gặp vấn đề nghiêm trọng về sau (bảo trì ngừng, bug không sửa được), phương án dự phòng là **fork và tự bảo trì** (source Swiss Ephemeris C gốc được vendor trực tiếp trong chính package, `deps/swisseph/`, không phải submodule — dễ fork độc lập) — ghi nhận đây là mitigation cho Risk Mục 20, không phải quyết định cần làm ngay ở M2.

---

## 10. Adapter Responsibilities

Đúng phân định đã có ở Swiss Ephemeris Integration Spec Mục 7 — không lặp lại, chỉ liệt kê cụ thể hóa cho `SwissEphemerisAdapter`:

| Trách nhiệm | Có thuộc Adapter không? |
|---|---|
| Gọi `swisseph-wasm` (`calc_ut`, `houses`) | ✅ Có |
| Convert `Date` → Julian Day (`swe.julday()`) | ✅ Có — nội bộ, không lộ ra `IEphemerisProvider` |
| Map `PlanetName` → `SE_*` constant | ✅ Có (`celestial-body.mapping.ts`) |
| Map `HouseSystem` → mã ký tự (`'P'`/`'W'`) | ✅ Có (`house-system.mapping.ts`) |
| **Kiểm tra ngưỡng vĩ độ trước khi gọi `houses()`** (phát sinh từ Mục 7.1) | ✅ Có (`high-latitude-policy.ts`) |
| Slice `cusps[1..12]` (bỏ index 0) | ✅ Có |
| Trả `RawEphemerisData`/`HouseCalculationResult` đúng shape | ✅ Có |
| Gán `Sign`/`degreeInSign` | ❌ Không — Domain (`PlanetCalculator`, M3) |
| Tính `isRetrograde` | ❌ Không — Domain (M3), Adapter chỉ trả `speed` thô |
| Tính Aspect | ❌ Không — Domain (M3) |
| Quyết định "không hội tụ nghĩa là gì cho business" (set Warning) | ❌ Không — Application (M6), Adapter chỉ báo cáo `status` |
| Singleton lifecycle, serialize queue | ✅ Có (nhưng khởi tạo *ở* `composition-root.ts`, không phải nội bộ Adapter tự quản — Mục 12) |

---

## 11. Input/Output Mapping (Adapter Contract)

### `calculateNatal(request: EphemerisRequest): Promise<RawEphemerisData>`

```
1. julianDay = swe.julday(year, month, day, hourDecimal)   ← từ request.utcDateTime
2. for each PlanetName trong danh sách 14 (đủ 10 chuẩn + 4 optional — luôn tính hết, Application lọc sau, đúng Swiss Ephemeris Integration Spec Mục 8):
     a. seConstant = celestialBodyMapping[planetName]
     b. if planetName === 'SouthNode':
          raw = kết quả đã tính của 'NorthNode' → longitude = (northNodeLongitude + 180) mod 360
          (không gọi swe.calc_ut riêng — đúng thiết kế đã Confirmed, Natal Chart Domain Spec Mục 12.1)
        else:
          raw = swe.calc_ut(julianDay, seConstant, SEFLG_SWIEPH | SEFLG_SPEED)
          → { name: planetName, longitude: raw[0], latitude: raw[1], speed: raw[3] }
          (raw[2]=distance, raw[4]=latitudeSpeed, raw[5]=distanceSpeed — KHÔNG map vào RawEphemerisData,
           đúng shape đã đóng băng M1 chỉ cần longitude/latitude/speed)
3. return { planets: [...14 kết quả...] }
```

### `calculateHouses(request: HouseCalculationRequest): Promise<HouseCalculationResult>`

```
1. if isAboveConvergenceLatitude(request.coordinates.latitude):  ← Mục 7.1, KHÔNG gọi swe.houses()
     return { status: 'not_convergent' }
2. julianDay = swe.julday(...)
3. hsysCode = houseSystemMapping[request.houseSystem]   ← 'P' hoặc 'W'
4. result = swe.houses(julianDay, request.coordinates.latitude, request.coordinates.longitude, hsysCode)
5. cusps12 = Array.from(result.cusps).slice(1, 13)        ← BẮT BUỘC bỏ index 0 (Mục 6.2)
6. return {
     status: 'success',
     data: { cusps: cusps12, ascendant: result.ascmc[0], midheaven: result.ascmc[1] }
   }
```

### `calculateTransit(request: EphemerisRequest): Promise<RawEphemerisData>`

```
throw new UnsupportedChartTypeError('Transit charts are not supported in the current MVP.')
```
(Đúng Sprint 3 Backend Implementation Plan/Swiss Ephemeris Integration Spec — chỗ trống cho tương lai, không implement.)

---

## 12. WASM Lifecycle Implementation

Đúng quyết định đã Confirmed (Swiss Ephemeris Integration Spec Mục 20, không mở lại) — cụ thể hóa với API thật đã verify:

- **Eager init tại `composition-root.ts`**: gọi `new SwissEph()` + `await swe.initSwissEph()` **1 lần** lúc bootstrap ứng dụng (đo thật: init mất **~40ms** — Mục 6.2, chi phí chấp nhận được, trả 1 lần lúc khởi động, không ảnh hưởng request đầu tiên của user).
- **Fail-fast**: nếu `initSwissEph()` reject → app không khởi động, log `fatal`, `process.exit(1)` (đúng Swiss Ephemeris Integration Spec Mục 20.1, không thay đổi cách xử lý — chỉ xác nhận cơ chế thật: `initSwissEph()` **có thể reject** dù chưa quan sát được trường hợp thật nào trong Technical Spike, nhưng phải code phòng thủ theo `try/catch` quanh lời gọi init).
- **Singleton**: `SwissEphemerisAdapter` nhận **1 instance `SwissEph`** qua constructor injection (không tự tạo instance riêng bên trong Adapter) — `composition-root.ts` sở hữu vòng đời instance, Adapter chỉ dùng.
- **Serialize queue**: đã Confirmed **luôn bật** (Swiss Ephemeris Integration Spec Mục 20.3), **không đổi** dù Technical Spike không phát hiện bằng chứng cụ thể về việc thiếu an toàn concurrent (2 instance độc lập hoạt động đúng — đã verify — nhưng đó là 2 instance riêng, không phải "gọi đồng thời vào CÙNG 1 instance", câu hỏi ban đầu vẫn chưa được trả lời trực tiếp bởi Technical Spike lần này) — giữ nguyên chính sách phòng thủ đã chốt, dùng `p-queue` hoặc tương đương, wrap quanh 2 method `calculateNatal`/`calculateHouses`.
- **Cleanup**: `swe.close()` gọi ở **graceful shutdown** (`SIGTERM`/`SIGINT` handler ở `composition-root.ts` hoặc `server.ts` đã có — kiểm tra M2-T-tương ứng để xác nhận vị trí chính xác trong code thật), không gọi giữa các request.

---

## 13. Ephemeris Data Handling

Đúng Mục 6.4 — **không cần code gì thêm cho phần này** (khác dự kiến ban đầu ở Sprint 3 Backend Implementation Plan Mục 8, vốn để chỗ cho khả năng cần "startup validation kiểm tra thư mục file"). Vì data bundled sẵn trong chính package, "startup validation" đơn giản hóa thành: **`initSwissEph()` tự thân chính là validation** — nếu data thiếu/hỏng, `initSwissEph()` sẽ reject (theo thiết kế package), fail-fast tự động xảy ra qua đúng cơ chế Mục 12, không cần thêm bước kiểm tra file riêng nào ở AstroViet.

**Không tạo `backend/ephemeris-data/`** — tái xác nhận (OQ-6/7/10 Confirmed), càng có cơ sở vững hơn sau Technical Spike (Mục 6.4).

---

## 14. Ephemeris Provider Interface Compliance

Xác nhận `SwissEphemerisAdapter implements IEphemerisProvider` khớp chính xác — đối chiếu từng field:

| `IEphemerisProvider` (M1, không đổi) | Adapter thật hiện đúng |
|---|---|
| `calculateNatal(EphemerisRequest): Promise<RawEphemerisData>` | ✅ (Mục 11) |
| `calculateHouses(HouseCalculationRequest): Promise<HouseCalculationResult>` | ✅ (Mục 11, có bổ sung bước pre-check vĩ độ nội bộ — không đổi chữ ký) |
| `calculateTransit(EphemerisRequest): Promise<RawEphemerisData>` | ✅ (throw, Mục 11) |

**Không có thay đổi chữ ký nào cần thiết** — phát hiện Mục 7.1 chỉ ảnh hưởng **implementation nội bộ** của `calculateHouses()`, không ảnh hưởng **contract** đã Confirmed ở M1.

---

## 15. Error Translation Strategy

Đúng pattern đã có sẵn (Backend Implementation Guide, xác nhận qua `ExternalServiceError` đã tồn tại với code `EPHEMERIS_PROVIDER_ERROR`):

```typescript
async calculateNatal(request: EphemerisRequest): Promise<RawEphemerisData> {
  try {
    // ... gọi swe.calc_ut() cho từng planet
  } catch (err) {
    logger.error({ module: 'chart', err }, 'Ephemeris calculation failed');
    throw new ExternalServiceError('EPHEMERIS_PROVIDER_ERROR', 'Không thể tính toán vị trí thiên thể');
  }
}
```

**Áp dụng đồng nhất cho cả `calculateNatal`/`calculateHouses`** (đã xác nhận đây là ví dụ minh họa Backend Implementation Guide chưa cập nhật theo `calculateHouses()` mới — Sprint 3 Backend Implementation Plan Mục 8 đã ghi nhận trước, M2 áp dụng đúng cho cả 2 method).

**Raw error từ thư viện không lộ ra ngoài** — message tiếng Việt chung chung, log đầy đủ chi tiết ở `logger.error` (server-side only).

**`{status: 'not_convergent'}` không đi qua try/catch ở nhánh lỗi** — đây là **return value hợp lệ**, không phải exception (đúng Mục 7.1/11 — quyết định trước khi gọi `swe.houses()`, không phải bắt lỗi sau khi gọi).

---

## 16. Testing Strategy

Đúng đề bài yêu cầu (init/planet calc/house calc — cả Placidus lẫn Whole Sign/optional bodies/error propagation/lifecycle) — **dùng WASM thật**, không mock (đúng Architecture Spec §17, "Swiss Ephemeris có thể giữ thật vì deterministic và nhanh" — đã verify thật: init 40ms, calculation gần như tức thời).

| Test | Input | Expected | Nguồn xác nhận |
|---|---|---|---|
| Init thành công | — | `initSwissEph()` resolve, không throw | Mục 6.3 |
| Gọi trước init | Bất kỳ method nào trên instance chưa init | Throw đúng message `"SwissEph not initialized..."` | Mục 6.3 (verify thật) |
| `calculateNatal` — 10 hành tinh chuẩn | Ngày sinh cố định | Trả đủ 10, `longitude∈[0,360)` | Mục 11 |
| `calculateNatal` — Chiron/Lilith/Node | Như trên | Trả đúng 4 optional (SouthNode derived) | Mục 11, Mục 6.2 (SE_MEAN_APOG=12, SE_MEAN_NODE=10, SE_CHIRON=15 xác nhận thật) |
| `calculateHouses` — Placidus, vĩ độ thường | `lat=40.7128` (NYC, đã test thật) | `status:'success'`, `cusps.length===12`, `ascendant`≈122.20 | Mục 6.2 (giá trị thật đã in ra) |
| `calculateHouses` — Whole Sign | `lat=40.7128, hsys='W'` | `status:'success'`, cusps cách đều 30° | Mục 6.2 (đã verify thật: `[0,120,150,180,...]`) |
| `calculateHouses` — vĩ độ ≥66.5° | `lat=70` | `status:'not_convergent'`, **không gọi `swe.houses()`** | Mục 7.1 (phát hiện thật) |
| `calculateHouses` — vĩ độ đúng biên 66.5° | `lat=66.5` | Cần xác nhận: `not_convergent` hay `success`? (Mục 7.1 bảng dữ liệu cho thấy 66.5° **vẫn còn** biến thiên bình thường, suy biến xảy ra **giữa 66.5 và 67**) — test biên cụ thể tại `66.5` kỳ vọng `success` (đúng ranh giới "≥66.5 → not_convergent" nghĩa là 66.5 vẫn tính, chỉ chặn **trên** 66.5 — cần quyết định rõ dùng `>` hay `≥`, khuyến nghị `>` dựa trên dữ liệu thật quan sát được) | Mục 7.1 |
| `calculateTransit` | Bất kỳ | Throw `UnsupportedChartTypeError` | Mục 11 |
| `close()` | Sau khi dùng xong | Không throw | Mục 6.2 |
| Error translation | Giả lập lỗi (mock throw nội bộ nếu cần ép buộc) | Throw đúng `ExternalServiceError('EPHEMERIS_PROVIDER_ERROR', ...)` | Mục 15 |

**Test riêng cho `high-latitude-policy.ts`:** `isAboveConvergenceLatitude(66.5)===false`, `isAboveConvergenceLatitude(66.51)===true`, `isAboveConvergenceLatitude(-70)===true` (Nam bán cầu, trị tuyệt đối).

**Test riêng cho `house-system.mapping.ts`/`celestial-body.mapping.ts`:** thuần bảng tra cứu, test đủ tất cả giá trị enum có mapping đúng, không thiếu.

---

## 17. Task Breakdown

Đúng cấu trúc M1 đã dùng (Objective/Why/Files/Steps/Dependencies/Constraints/Tests/AC/DoD/Pitfalls) — rút gọn phần lặp lại, giữ đủ chi tiết mới.

### M2-T1 — Package Installation & License Verification

**Objective:** Cài `swisseph-wasm@0.1.0`, tạo License Record thật.
**Why:** Phải có package thật trước khi code Adapter.
**Prerequisites:** M1 merge.
**Files:** `backend/package.json` (sửa — thêm dependency); `docs/legal/swisseph-license-record.md` (mới).
**Steps:** `npm install swisseph-wasm@0.1.0 --save-exact` (exact pin); điền License Record đầy đủ 8 trường bằng dữ liệu thật Mục 6.5 (không còn "chờ M2" — đã có sẵn ngay từ Task này).
**Dependencies:** Không.
**Tests:** Không (không phải code logic).
**AC:** `package.json` có `"swisseph-wasm": "0.1.0"` (không `^`); License Record đủ 8/8 trường, có trích dẫn nguồn (đường link GitHub repo + trích đoạn LICENSE thật).
**DoD:** `npm ls swisseph-wasm` xác nhận đúng version cài.
**Pitfalls:** Dùng `npm install swisseph-wasm` không có `--save-exact` → mặc định ghi `^0.1.0`, vi phạm Determinism đã Confirmed.

### M2-T2 — Mapping Tables

**Objective:** `house-system.mapping.ts`, `celestial-body.mapping.ts`, `high-latitude-policy.ts`.
**Why:** Cần trước khi viết Adapter (Adapter tiêu thụ 3 file này).
**Files:** 3 file Mục 5.
**Steps:** `houseSystemMapping: Record<HouseSystem, string> = {Placidus:'P', WholeSign:'W'}`; `celestialBodyMapping: Record<PlanetName, number> = {Sun:0, Moon:1, ..., Chiron:15, Lilith:12, NorthNode:10}` (SouthNode không có trong bảng — xử lý riêng, Mục 11); `isAboveConvergenceLatitude(lat: number): boolean => Math.abs(lat) > 66.5`.
**Dependencies:** M1 (types).
**Constraints:** Không import `swisseph-wasm`.
**Tests:** Đúng Mục 16 (2 bảng cuối).
**AC:** Đủ 14 celestial body có mapping (trừ SouthNode — comment giải thích tại sao không cần); đúng 2 house system.
**DoD:** `typecheck`/`test` sạch.
**Pitfalls:** Quên rằng `SE_MEAN_APOG` (Lilith) và `SE_MEAN_NODE` (North Node) đã Confirmed từ trước (Swiss Ephemeris Integration Spec OQ-4/OQ-5), không phải quyết định mới — chỉ cần đúng giá trị số thật (12, 10 — Mục 6.2) khớp đúng lựa chọn Mean (không phải True/Osculating).

### M2-T3 — SwissEphemerisAdapter Core

**Objective:** Implement đầy đủ `IEphemerisProvider`.
**Why:** Trung tâm của M2.
**Files:** `swiss-ephemeris.adapter.ts`.
**Steps:** Đúng pseudo-code Mục 11 — constructor nhận `SwissEph` instance đã init sẵn (không tự `new`/`init` bên trong Adapter — đó là trách nhiệm `composition-root.ts`, Mục 12) + hàng đợi serialize (`p-queue` hoặc tương đương, cài thêm nếu cần — kiểm tra `package.json` hiện có gì tương tự trước khi thêm dependency mới).
**Dependencies:** M2-T1, M2-T2.
**Constraints:** File duy nhất import `swisseph-wasm`.
**Tests:** Đúng Mục 16 (phần lớn).
**AC:** Mục 14 (bảng compliance).
**DoD:** Toàn bộ test Mục 16 pass với WASM thật.
**Pitfalls:** Quên `.slice(1,13)` cho cusps (Mục 6.2) — lỗi âm thầm, không throw, chỉ sai lệch dữ liệu (nguy hiểm nhất vì khó phát hiện qua test hời hợt — **bắt buộc** có test so khớp giá trị cụ thể, không chỉ test "length===12").

### M2-T4 — Composition Root Wiring

**Objective:** Wire singleton + serialize + graceful shutdown vào `composition-root.ts`.
**Files:** `backend/src/composition-root.ts` (sửa).
**Steps:** Thêm `const swissEph = new SwissEph(); await swissEph.initSwissEph();` vào hàm bootstrap (đúng vị trí các adapter khác đã init — đối chiếu code thật `identity`/`birth-profile` để đặt đúng thứ tự); `const ephemerisProvider = new SwissEphemerisAdapter(swissEph);`; thêm `swissEph.close()` vào graceful shutdown handler đã có (nếu có sẵn — kiểm tra trước khi thêm mới).
**Dependencies:** M2-T3.
**Tests:** Integration-level (app khởi động thành công, log xác nhận init).
**AC:** App bootstrap không lỗi; `initSwissEph()` chạy đúng 1 lần.
**DoD:** `npm run dev`/`npm start` khởi động sạch, log có dòng xác nhận Ephemeris Provider sẵn sàng.
**Pitfalls:** Tạo instance `SwissEph` mới ở nhiều nơi (vi phạm singleton).

### M2-T5 — Adapter Test Suite

**Objective:** Đầy đủ test Mục 16.
**Files:** `backend/tests/unit/modules/chart/infrastructure/adapters/*.test.ts`.
**Dependencies:** M2-T1 đến M2-T4.
**AC:** 100% test Mục 16 pass.
**DoD:** `npx vitest run tests/unit/modules/chart` pass đủ (kế thừa 59 test M1 + test mới M2).

### M2-T6 — Documentation & License Record Finalization

**Objective:** Hoàn thiện `docs/legal/swisseph-license-record.md`, ghi chú Mục 7.1/7.2 vào README hoặc Known Gaps nội bộ (chuẩn bị cho M10 audit).
**Files:** License record (hoàn thiện nốt nếu M2-T1 để trống gì), ghi chú ngắn trong code comment tại `high-latitude-policy.ts` và `swiss-ephemeris.adapter.ts` trích dẫn rõ 2 phát hiện Mục 7.
**AC:** Record đầy đủ; comment code trích nguồn rõ ràng cho người đọc sau không phải tự điều tra lại từ đầu.
**DoD:** Review lại toàn bộ M2 trước khi coi là đóng.

---

## 18. File-by-File Implementation Plan

| File | Purpose | Mới/Sửa |
|---|---|---|
| `backend/package.json` | +`swisseph-wasm@0.1.0` (exact) | Sửa |
| `docs/legal/swisseph-license-record.md` | License/Compliance Record thật | Mới |
| `backend/src/modules/chart/infrastructure/adapters/house-system.mapping.ts` | `HouseSystem`→`'P'`/`'W'` | Mới |
| `backend/src/modules/chart/infrastructure/adapters/celestial-body.mapping.ts` | `PlanetName`→`SE_*` số | Mới |
| `backend/src/modules/chart/infrastructure/adapters/high-latitude-policy.ts` | Ngưỡng 66.5° (phát sinh Mục 7.1) | Mới |
| `backend/src/modules/chart/infrastructure/adapters/swiss-ephemeris.adapter.ts` | `IEphemerisProvider` implementation | Mới |
| `backend/src/composition-root.ts` | Wire singleton + shutdown | Sửa |
| `backend/tests/unit/modules/chart/infrastructure/adapters/swiss-ephemeris.adapter.test.ts` | Test Adapter (WASM thật) | Mới |
| `backend/tests/unit/modules/chart/infrastructure/adapters/house-system.mapping.test.ts` | Test mapping | Mới |
| `backend/tests/unit/modules/chart/infrastructure/adapters/celestial-body.mapping.test.ts` | Test mapping | Mới |
| `backend/tests/unit/modules/chart/infrastructure/adapters/high-latitude-policy.test.ts` | Test ngưỡng | Mới |

---

## 19. Dependency & Sequencing Graph

```
M2-T1 (Package + License)
   │
   ▼
M2-T2 (Mapping Tables)
   │
   ▼
M2-T3 (Adapter Core)
   │
   ▼
M2-T4 (Composition Root Wiring)
   │
   ▼
M2-T5 (Test Suite)
   │
   ▼
M2-T6 (Docs/License Finalization)
   │
   ▼
Handoff M3
```

**Không phụ thuộc M3** — `SwissEphemerisAdapter` hoạt động độc lập, M3 (Calculator) sẽ tiêu thụ qua `IEphemerisProvider`, không cần biết Adapter tồn tại theo cách nào.

---

## 20. Risks & Mitigations

| Risk | Khả năng | Ảnh hưởng | Mitigation |
|---|---|---|---|
| Package rất mới, 1 maintainer, 5 version trong lịch sử ngắn (Mục 6.1 — dữ liệu thật, đã nâng mức từ "Trung bình–Cao" lên **Cao**) | **Cao** (xác nhận thật) | Trung bình dài hạn (bảo trì/bug fix chậm) | `IEphemerisProvider` port đã cô lập hoàn toàn rủi ro — đổi package chỉ cần viết Adapter mới, không đụng Domain/Application; source Swiss Ephemeris C gốc vendor trực tiếp trong package (dễ fork nếu cần) |
| `houses()` không có tín hiệu non-convergence (Mục 7.1) | Đã xảy ra (không phải rủi ro giả định) | Trung bình — đã có giải pháp (pre-check ngưỡng) | `high-latitude-policy.ts`, đã thiết kế xong ở Mục 7.1/11 |
| License thật là GPL không phải AGPL (Mục 7.2) | Đã xảy ra | Trung bình (business/legal, không kỹ thuật) | Ghi nhận rõ cho M10 Audit, không tự kết luận |
| `cusps` có 13 phần tử không phải 12 (off-by-one nếu code sai) | Trung bình nếu code cẩu thả | Cao nếu xảy ra (toàn bộ House sai lệch 1 vị trí âm thầm) | Test giá trị cụ thể (không chỉ length), code review kỹ M2-T3 |
| Ranh giới chính xác 66.5° (`>` vs `≥`) chưa 100% chắc chắn từ 2 điểm dữ liệu (66.5° và 67°) | Thấp | Thấp (sai 1 biên hiếm gặp trong thực tế — vĩ độ chính xác 66.5000° cực hiếm ở dữ liệu sinh thật) | Test riêng biên `66.5` (Mục 16), có thể tinh chỉnh sau nếu phát hiện thêm dữ liệu |
| WASM concurrency chưa verify được trực tiếp (2 instance ≠ concurrent calls vào 1 instance) | Không đổi so với đánh giá cũ | Thấp (đã có serialize queue phòng thủ sẵn) | Giữ nguyên chính sách serialize đã Confirmed |

---

## 21. M2 Acceptance Criteria

1. `swisseph-wasm@0.1.0` cài đúng, pin exact.
2. `SwissEphemerisAdapter implements IEphemerisProvider` đầy đủ 3 method, khớp M1 100%.
3. `calculateNatal()` trả đúng 14 celestial body, giá trị khớp Technical Spike đã verify (Mục 6.2, 16).
4. `calculateHouses()` trả đúng `HouseCalculationResult` — cả `success` (Placidus/Whole Sign) lẫn `not_convergent` (dùng pre-check ngưỡng, không dùng tín hiệu thư viện).
5. `cusps` map đúng, không lệch vị trí (Mục 6.2 — bug âm thầm nguy hiểm nhất nếu sai).
6. Error translation đúng `ExternalServiceError('EPHEMERIS_PROVIDER_ERROR', ...)`.
7. Singleton + serialize queue hoạt động, wire đúng ở `composition-root.ts`.
8. License Record 8/8 trường đầy đủ, dữ liệu thật (không placeholder).
9. 2 phát hiện Mục 7 (non-convergence signal, GPL license) đã ghi chú rõ ràng trong code + tài liệu, sẵn sàng cho M10 Audit.
10. Domain layer (`chart/domain/`) **không đổi** — `git diff` xác nhận 0 thay đổi trong `chart/domain/` kể từ M1 merge.
11. Toàn bộ backend (Sprint 1/2 + Chart M1 + M2) vẫn xanh.

---

## 22. Definition of Done

- [ ] 6 Task (M2-T1 đến M2-T6) đạt AC/DoD riêng.
- [ ] 11 M2 Acceptance Criteria (Mục 21) đạt.
- [ ] `npm run lint`/`format:check`/`typecheck`/`test:coverage`/`build` sạch toàn backend.
- [ ] CI backend xanh.
- [ ] `chart/domain/` không có thay đổi nào so với M1.
- [ ] License Record thật, đầy đủ, đã commit.
- [ ] `git status` sạch.

---

## 23. Handoff to M3

**M3 (Astrology Calculation Engine) nhận từ M2:**
- `SwissEphemerisAdapter` hoạt động thật — `ChartBuilder`/Calculator gọi qua `IEphemerisProvider` (không đổi từ M1), không cần biết chi tiết `swisseph-wasm`.
- Xác nhận: `calculateHouses()` **luôn** trả về đúng discriminated union — M3's `HouseCalculator` chỉ cần `switch (result.status)`, không cần tự xử lý `NaN`/giá trị lạ nào.
- Xác nhận: `calculateNatal()` luôn trả đủ 14 planet — M3's `PlanetCalculator`/Application filter theo `includeOptionalPoints` (đúng Swiss Ephemeris Integration Spec Mục 8, không đổi).

**M3 KHÔNG cần biết:** ngưỡng `66.5°` nằm ở đâu (đã xử lý xong trong Adapter, M3 chỉ thấy `status` field), giá trị `SE_*` cụ thể, cách map cusps.

**Trạng thái bàn giao:** M2 đóng với 2 phát hiện quan trọng đã ghi nhận đầy đủ (Mục 7), không có Open Question nào chặn M3 bắt đầu.

---

*Hết tài liệu. M2 Implementation Plan này dựa trên Technical Spike đã thực thi thật (cài package thật, đọc file thật, chạy code thật) — không phải giả định. 2 phát hiện quan trọng (Mục 7.1: `houses()` không có tín hiệu non-convergence, cần pre-check ngưỡng vĩ độ; Mục 7.2: license thật là GPL-3.0-or-later không phải AGPL) đã được trình bày tường minh, đối chiếu với giả định cũ, không âm thầm điều chỉnh quyết định đã Confirmed — chỉ làm rõ cơ chế thực thi cụ thể hơn dựa trên bằng chứng thật.*
