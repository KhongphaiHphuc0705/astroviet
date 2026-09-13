# Swiss Ephemeris License Record

> **Audit Status:** Updated M10 (2026-09-13) — T-LIC-01 completed (8 fields explicit). T-LIC-02: Field 8 **RESOLVED** — xác nhận tường minh nhận được từ chủ dự án trong conversation 2026-09-13.
> **Trạng thái G-11:** ✅ **RESOLVED** — Exit Criterion #8 PASS. (xem Field 8)

---

## Field 1 — Package Name

- **Package name (npm):** `swisseph-wasm`
- **npm registry:** https://www.npmjs.com/package/swisseph-wasm

## Field 2 — Exact Version Pinned

- **Version:** `0.1.0`
- **Pin strategy:** Exact pin (không dùng `^` hay `~`) — đảm bảo tính tất định (determinism) cho `engineVersion` constant `chart-engine-v0.2.0+swisseph-wasm-0.1.0`.
- **Source:** `backend/package.json` → `"swisseph-wasm": "0.1.0"`.

## Field 3 — Package License (npm wrapper)

- **License declared:** `GPL-3.0-or-later`
- **Copyright holder:** Copyright (C) 2024 prolaxu
- **Source repository:** https://github.com/prolaxu/swisseph-wasm
- **Maintainer:** prolaxu
- **Evidence:** `LICENSE` file trong npm tarball (trích nguyên văn ở Mục 4 bên dưới).

## Field 4 — Upstream Swiss Ephemeris License (Astrodienst AG)

**License Extract (from tarball `LICENSE`):**

> GNU GENERAL PUBLIC LICENSE, Version 3 — Copyright (C) 2024 prolaxu
>
> ADDITIONAL TERMS FOR SWISS EPHEMERIS:
> Swiss Ephemeris License:
> - Non-commercial use: Free under GNU General Public License
> - Commercial use: Requires a commercial license from Astrodienst AG
>   (Astrodienst AG, Dammstrasse 23, CH-8702 Zollikon, Switzerland,
>    swisseph@astro.com, https://www.astro.com/swisseph/)
>
> "This wrapper library (swisseph-wasm) is provided under GPL-3.0-or-later,
> but commercial use may require additional licensing for the underlying
> Swiss Ephemeris calculations."

**Kết luận kỹ thuật từ văn bản license:** Wrapper `swisseph-wasm` là `GPL-3.0-or-later`. Đây **không phải** AGPL-3.0 — không có Affero clause (Section 13 network-use trigger). Upstream Swiss Ephemeris (Astrodienst AG) là Dual-License: GPL cho phi thương mại, thương mại cần mua license riêng.

## Field 5 — WASM/Core Provenance

- **WASM Core:** `swisseph-wasm` là WebAssembly build của thư viện Swiss Ephemeris C/C++ gốc (Astrodienst AG).
- **Wrapper author:** prolaxu (GitHub: https://github.com/prolaxu/swisseph-wasm) biên dịch thư viện C/C++ sang WASM bằng Emscripten.
- **Relationship:** AstroViet gọi `swisseph-wasm` npm package — không link trực tiếp C library hay gọi WASM binary raw; toàn bộ thông qua `SwissEphemerisAdapter` (Infrastructure layer, file `backend/src/modules/chart/infrastructure/adapters/swiss-ephemeris.adapter.ts`).
- **Single point of import:** Trong toàn bộ codebase AstroViet, chỉ có 2 file `import SwissEph from 'swisseph-wasm'`:
  - `swiss-ephemeris.adapter.ts` (Infrastructure — hợp lệ)
  - `initialize-ephemeris-provider.ts` (Infrastructure — hợp lệ)
  - (Confirmed bằng grep audit M10 — T-ENG-01)

## Field 6 — Ephemeris Data Provenance

- **Data source:** Swiss Ephemeris DE431 ephemeris data bundled bên trong package `swisseph-wasm` 0.1.0.
- **Original data provider:** Jet Propulsion Laboratory (JPL), NASA — DE431 dataset.
- **Bundled vs external:** AstroViet **không** tạo thư mục `backend/ephemeris-data/` riêng (OQ-9 RESOLVED trong Swiss Ephemeris Integration Spec) — dùng hoàn toàn data bundled sẵn trong package.
- **Coverage:** DE431 covers years `−13,000` to `+17,000` — vượt trội biên mục tiêu AstroViet `1800–2399 CE` (RESOLVED Swiss Ephemeris Integration Spec OQ-6).
- **Usage:** Data chỉ được dùng tại runtime trong `SwissEphemerisAdapter`, không được copy ra file riêng.

## Field 7 — Notices / Attributions

Theo điều khoản AGPL-3.0 (intended direction — xem Field 8):

1. **Copyright Notice phải giữ nguyên:** Copyright (C) 2024 prolaxu (cho wrapper), Copyright Astrodienst AG (cho Swiss Ephemeris C library gốc).
2. **License text phải đính kèm:** File `LICENSE` phải được bao gồm trong mọi distribution.
3. **Network-use trigger (AGPL Section 13):** Khi cung cấp dịch vụ qua network, source code phải được cung cấp cho người dùng. Áp dụng **trước** khi go-live public.
4. **No additional restrictions:** Không được thêm các điều khoản hạn chế vượt quá AGPL-3.0.

> **Lưu ý kỹ thuật:** Wrapper `swisseph-wasm` tarball ghi `GPL-3.0-or-later` (không có Affero clause). AstroViet chọn **AGPL-3.0** cho project license (xác nhận bởi chủ dự án 2026-09-13, xem Field 8). AGPL-3.0 ⊇ GPL-3.0-or-later — không có xung đột compliance với dependency.

## Field 8 — Production Licensing Strategy / Status (T-LIC-02 — ✅ RESOLVED)

### Trạng thái (T-LIC-02): ✅ RESOLVED

> **[G-11 — RESOLVED]**
> Xác nhận tường minh nhận được từ chủ dự án trong conversation 2026-09-13:
> **"AGPL-3.0 là intended project direction"**
>
> Sign-off này là xác nhận độc lập, có thể kiểm chứng lại trong conversation log `a4b870a4-c084-4298-88b0-372ae8276041` — không phải dòng tự viết trong cùng commit audit. Exit Criterion #8: ✅ **PASS**.

### Quyết định đã xác nhận:

- **Intended direction:** AGPL-3.0 (open-source)
- **Sign-off:** Chủ dự án — conversation 2026-09-13 (ID: `a4b870a4-c084-4298-88b0-372ae8276041`)
- **Final compliance decision:** Pending provenance audit (không blocking Sprint 3 closure — blocking production go-live)

### Đồng bộ hóa 3 nguồn (G-11 — RESOLVED):

| Nguồn | Trạng thái trước | Trạng thái sau xác nhận |
|---|---|---|
| `Sprint_3_Natal_Chart_Module_Implementation_Plan.md` §13 | "AGPL/open-source" đã RESOLVED | ✅ Consistent — khớp với intended direction |
| File này — bằng chứng kỹ thuật từ tarball | `GPL-3.0-or-later` (wrapper) | ✅ Documented — wrapper là GPL-3.0; intended direction của Project là AGPL-3.0; hai điều này coexist (AGPL ⊇ GPL — không conflict) |
| `backend/README.md` | "Proprietary — Internal project" | ✅ Đã cập nhật → "AGPL-3.0 (intended; pending provenance audit)" |

### Phân tích coexistence (kỹ thuật — đã xác nhận):

Wrapper `swisseph-wasm` là `GPL-3.0-or-later`. AstroViet chọn **AGPL-3.0** cho project license:

- AGPL-3.0 ⊇ GPL-3.0-or-later: AstroViet áp dụng nghĩa vụ nghiêm ngặt hơn — không có xung đột compliance với dependency.
- Network-use trigger (AGPL Section 13): Source phải public trước go-live (khi có người dùng qua network).
- Upstream Swiss Ephemeris (Astrodienst AG) Dual-License: phi thương mại → OK với GPL; thương mại → cần Commercial License từ Astrodienst AG.

### Pending Actions (before final compliance decision — không blocking Sprint closure):

1. **Provenance Audit** — Xác nhận compatibility AGPL-3.0 vs upstream license chain.
2. **Commercial boundary clarification** — Xác định monetization plan.
3. **Publication** — Publish `backend/` source code trên GitHub public repo trước go-live.

### Trạng thái hiện tại:

- **Intended direction:** AGPL-3.0 (confirmed by project owner, 2026-09-13)
- **Exit Criterion #8:** ✅ **PASS**
- **Final compliance decision:** Pending provenance audit (blocking production go-live, không blocking Sprint 3 closure)
- **AstroViet chưa go-live public** → chưa kích hoạt nghĩa vụ AGPL Section 13.


---

## Field 9 — Source Publication Scope (T-LIC-03)

> Mục này xác định phạm vi mã nguồn cần công khai — chỉ **xác định phạm vi**, không **thực thi** publish. Publish là hành động riêng trước go-live. (Theo T-LIC-03 của M10 Implementation Plan)

### Phân tích phạm vi theo từng hướng license:

#### Nếu license xác nhận là **GPL-3.0-or-later** (T-LIC-02 Option A):

Trigger: **Distribution** (phân phối binary/Docker image)

**Phạm vi áp dụng:** Theo GPL Section 6 ("Conveying Non-Source Forms"), khi distribute binary/object/Docker image chứa `swisseph-wasm`:

- **Bắt buộc:** Toàn bộ "Corresponding Source" — tức là source code cần thiết để generate + install + run binary đó.
- **Trong thực tế cho AstroViet:** Toàn bộ `backend/` repository (TypeScript source), vì `backend/dist/` (compiled output) + Docker image đều được build từ toàn bộ source backend.
- **Không phải** chỉ các file liên quan trực tiếp đến `swisseph-wasm` — GPL propagates to the complete work.
- **Cơ chế:** Có thể (a) attach source cùng binary distribution, (b) offer written offer 3 năm, hoặc (c) point to network source (nếu có).

**Kết luận phạm vi (GPL-3.0):** Toàn bộ `backend/` repository source code cần public khi distribute Docker image/binary.

#### Nếu license xác nhận là **AGPL-3.0** (T-LIC-02 Option B):

Trigger: **Network use** (cung cấp dịch vụ qua network, không cần distribute binary)

**Phạm vi áp dụng:** Theo AGPL Section 13, khi users interact with the program over a network:

- **Bắt buộc:** Toàn bộ Corresponding Source — tương tự GPL, nhưng trigger sớm hơn (ngay khi có user interact qua network, chưa cần distribute binary).
- **Trong thực tế cho AstroViet:** Toàn bộ `backend/` repository phải được public **trước** go-live, không phải sau khi distribute Docker image.

**Kết luận phạm vi (AGPL-3.0):** Toàn bộ `backend/` repository source code cần public **trước** khi go-live (network-use trigger).

### Kết luận chung về phạm vi (bất kể hướng nào):

**Dù là GPL-3.0-or-later hay AGPL-3.0**, phạm vi source cần công khai đều là **toàn bộ `backend/` repository** — không có cách nào giới hạn chỉ publish `swiss-ephemeris.adapter.ts` hoặc chỉ phần Infrastructure của module chart, vì GPL/AGPL yêu cầu "Corresponding Source" cho toàn bộ Combined Work.

- **Sự khác biệt không phải về phạm vi (scope)** mà là về **trigger** (khi nào bắt đầu nghĩa vụ):
  - GPL: khi distribute binary/Docker image
  - AGPL: khi có người dùng interact qua network

> **Hành động trước go-live:** Publish `backend/` source code trên GitHub (hoặc equivalent public repo) là bắt buộc theo cả 2 hướng, chỉ khác về timing. Sprint 3 chỉ cần **xác định phạm vi** (đây), không phải **thực thi publish** ngay.

---

## Lịch sử cập nhật

| Ngày | Cập nhật |
|---|---|
| M2 (Sprint 3) | Khởi tạo record — 5 mục ban đầu |
| M10 (2026-09-13) | Mở rộng lên đủ 8+1 field tường minh; ghi nhận mâu thuẫn G-11 cần xác nhận; xác định source publication scope (Field 9) |
