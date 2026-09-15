# AstroViet — Sprint 3 Backend, Milestone 10: Final Review / Documentation / Closure
## Implementation Plan

**Repo:** `KhongphaiHphuc0705/astroviet`, nhánh `dev`
**HEAD tại thời điểm lập plan:** `81e0f95` (đã verify bằng `git log`, không có commit mới hơn)
**Trạng thái:** Plan-only — chưa thực thi. Grounded trên Pre-Plan Repository Audit thật (không giả định).
**Nguyên tắc bao trùm:** Spec → Plan → Actual Code → Documentation → Release Readiness. Mọi khác biệt phải được nêu tường minh, không tự ý "sửa" spec/plan/code, không giấu Known Gap để Exit Criteria trông xanh giả tạo.

---

## 1. Milestone Overview

M10 là milestone cuối của Sprint 3 (Natal Chart Module + Swiss Ephemeris Integration). Đây **không phải** milestone phát triển tính năng — là milestone Review/Audit/Documentation/Closure. M1–M9 đã hoàn thành và đã được review độc lập (xem `AstroViet_Sprint3_Backend_Summary.md`, verify lại bằng clone thật ngày 2026-09-13, HEAD `81e0f95`).

Mục tiêu cốt lõi: xác nhận bằng chứng thật rằng implementation khớp spec đã đóng băng, OpenAPI khớp API thật, DB schema khớp Database Design Spec, `backend/README.md` phản ánh đúng thực tế, licensing đã audit đầy đủ, Known Gaps được ghi nhận tường minh (không giấu), Sprint Exit Criteria (Mục 21 của Sprint 3 Plan) có bằng chứng cụ thể, và Sprint 3 sẵn sàng đóng chính thức — phân biệt rõ với "Production go-live".

## 2. Objectives

1. Đối chiếu thật Spec ↔ Plan ↔ Code ↔ Test ↔ OpenAPI ↔ DB Schema ↔ README cho toàn bộ phạm vi Sprint 3.
2. Audit OpenAPI sinh ra khớp với 4 endpoint Chart thật (`POST /charts/natal`, `GET /charts/:id`, `GET /charts`, `DELETE /charts/:id`) theo đúng REST API Spec.
3. Audit Prisma schema/migrations khớp Database Design Spec, bao gồm xử lý dứt điểm gap `snapshot_interpretation_version` (nullable trong code, NOT NULL trong doc — đã phát hiện trước M10).
4. Audit kiến trúc Swiss Ephemeris Integration: xác nhận boundary Domain → Port → Adapter → `swisseph-wasm` không bị vi phạm.
5. Audit licensing compliance dưới hướng open-source đã RESOLVED — xử lý tường minh mâu thuẫn AGPL (Plan) vs GPL-3.0-or-later (License Record thật).
6. Biên soạn Known Gaps Registry đầy đủ, không giấu gap để Exit Criteria "xanh" giả tạo.
7. Cập nhật/viết lại `backend/README.md` phản ánh đúng thực tế Sprint 1–3.
8. Chạy Clean Environment Verification thật, mô phỏng một developer mới.
9. Verify từng dòng trong Sprint Exit Criteria (Mục 21, Sprint 3 Plan) bằng bằng chứng thật.
10. Cập nhật `CHANGELOG.md` theo đúng convention đã có (Keep a Changelog).
11. Đưa ra Final Recommendation (READY TO CLOSE / READY TO CLOSE WITH NON-BLOCKING GAPS / NOT READY TO CLOSE) có căn cứ.

## 3. Scope

- Documentation Audit (7 tài liệu spec + Sprint 3 Plan + M1-M9 implementation + README + CHANGELOG hiện có).
- OpenAPI Audit (4 endpoint Chart).
- Database Audit (Prisma schema, 4 migration, đặc biệt migration `20260831120000_init_chart_module`).
- Swiss Ephemeris / Astrology Engine Audit (boundary + hành vi tính toán).
- Licensing Audit (8 trường License Record + xử lý mâu thuẫn AGPL/GPL-3.0).
- Known Gaps Registry đầy đủ.
- `backend/README.md` update.
- Clean Environment Verification.
- Sprint Exit Criteria Verification (13 tiêu chí, Mục 21 Sprint 3 Plan).
- CHANGELOG update.
- Corrective changes chỉ ở mức C0/C1 (xem Mục 19).
- Final Review Report + Sprint Closure Procedure.

## 4. Out of Scope

- Bất kỳ chart type mới nào (Synastry, Composite, Transit, Progression, Solar Return).
- House system mới, planet/point mới, aspect mới.
- Interpretation Engine/Content Bank (D-2, D-14 vẫn là Known Gap, không giải quyết ở M10).
- Frontend.
- Rate Limiting, Idempotency Key implementation thật (chỉ ghi nhận Known Gap, đã có trong Sprint 3 Summary mục 2.5/2.6).
- Thực thi việc công khai mã nguồn theo nghĩa vụ AGPL/GPL (chỉ **xác định phạm vi**, không **thực thi** publish).
- Mở lại quyết định A/B (open-source vs commercial license) — quyết định này giữ nguyên là open-source.
- Refactor không liên quan (T-DOC/T-DB/T-ENG chỉ audit, không refactor trừ khi phân loại C1 rõ ràng).

## 5. Dependencies

- Sprint 3 M1–M9 đã hoàn thành (đã verify độc lập, xem Sprint 3 Backend Summary + verification note 2026-09-13).
- CI fix đã hoàn thành ở M1 (`.github/workflows/backend-ci.yml` ở root) — **không liệt kê lại như Task M10**.
- Natal Chart Domain Specification, Swiss Ephemeris Integration Specification, REST API Specification, Database Design Specification, Project Architecture Specification, Backend Implementation Guide, Coding Standards & Conventions.
- Sprint 3 Natal Chart Module Implementation Plan (nguồn duy nhất cho Exit Criteria, Mục 21 — không phát minh bộ tiêu chí mới).
- Source code thật trên `dev` (HEAD `81e0f95` tại thời điểm audit — phải re-verify HEAD ngay đầu M10 vì có thể có commit mới).
- Test suite thật, Prisma schema/migrations thật, OpenAPI sinh thật, License Record thật.

## 6. Source-of-Truth Hierarchy

```
1. Frozen Specifications (Domain/Engine/API/DB/Architecture/Coding Standards)
        ↓ (được thực thi bởi)
2. Sprint 3 Implementation Plan (Mục 21 = Exit Criteria authoritative)
        ↓ (được hiện thực bởi)
3. Actual Code trên `dev` (nguồn sự thật cao nhất cho "cái gì đang chạy thật")
        ↓ (được xác nhận bởi)
4. Actual Tests + Actual OpenAPI (sinh từ code) + Actual Prisma schema/migrations
        ↓ (được mô tả lại bởi)
5. README / CHANGELOG / License Record (phải phản ánh đúng #3–4, không phải ngược lại)
```

Quy tắc: khi có mâu thuẫn giữa 2 tầng, **tầng thấp hơn số (gần Spec hơn) không tự động đúng** — nhưng cũng không tự động sai. Mọi mâu thuẫn phải ghi nhận là DRIFT có phân loại, không tự ý chọn bên nào "thắng" nếu ảnh hưởng đến quyết định đã đóng băng (đặc biệt licensing).

## 7. Audit Strategy

1. Không tin bản tóm tắt cũ (kể cả `AstroViet_Sprint3_Backend_Summary.md` đã verify trước) — mọi kết luận M10 phải re-derive từ `git clone` tươi + đọc code thật tại thời điểm thực thi M10.
2. Mỗi Exit Criterion (Mục 21) verify bằng lệnh chạy thật, không chấp nhận "Plan nói vậy nên chắc đúng".
3. Với mọi phát hiện lệch, phân loại MATCH / MINOR DRIFT / DOCUMENTATION DRIFT / IMPLEMENTATION DRIFT / SPECIFICATION DRIFT / UNVERIFIED, có nguồn trích dẫn 2 phía.
4. Licensing: chỉ audit compliance kỹ thuật, không đưa kết luận pháp lý vượt quá văn bản license chính thức.
5. Corrective action phân loại C0/C1/C2 **trước khi** thực hiện bất kỳ thay đổi nào — C2 luôn dừng lại thành Known Gap, không code.
6. Coverage % không bao giờ là bằng chứng độc lập — chỉ là chỉ số chẩn đoán kèm theo review thủ công theo đúng §12.7.

## 8. Task Breakdown

| Task ID | Nhóm | Tên |
|---|---|---|
| T-PRE-01 | Setup | Re-verify HEAD & clean clone |
| T-DOC-01 | Documentation Audit | Natal Chart Domain Spec vs Code |
| T-DOC-02 | Documentation Audit | Swiss Ephemeris Integration Spec vs Code |
| T-DOC-03 | Documentation Audit | Project Architecture Spec vs Code |
| T-DOC-04 | Documentation Audit | Backend Implementation Guide & Coding Standards vs Code |
| T-DOC-05 | Documentation Audit | Sprint 3 Plan M1–M9 vs Actual Delivered Code |
| T-API-01 | OpenAPI Audit | Sinh OpenAPI thật + diff với REST API Spec |
| T-API-02 | OpenAPI Audit | Auth/Ownership/Validation/Pagination behavior thật |
| T-DB-01 | Database Audit | Prisma schema vs Database Design Spec |
| T-DB-02 | Database Audit | Migration history vs schema.prisma (drift check) |
| T-DB-03 | Database Audit | Chart Snapshot Immutability end-to-end |
| T-ENG-01 | Engine Audit | Boundary Domain→Port→Adapter→swisseph-wasm |
| T-ENG-02 | Engine Audit | Hành vi tính toán vs Golden/Edge-case tests |
| T-LIC-01 | Licensing Audit | 8-field License Record completeness |
| T-LIC-02 | Licensing Audit | AGPL vs GPL-3.0-or-later discrepancy resolution |
| T-LIC-03 | Licensing Audit | Source-publication scope identification |
| T-GAP-01 | Known Gaps | Biên soạn Known Gaps Registry đầy đủ |
| T-README-01 | Documentation | Viết lại `backend/README.md` |
| T-CHANGE-01 | Documentation | Cập nhật `CHANGELOG.md` |
| T-VER-01 | Documentation | Version bump `package.json` (C1) |
| T-CLEAN-01 | Verification | Clean Environment Verification |
| T-EXIT-01 | Verification | Sprint Exit Criteria Evidence Matrix |
| T-CLOSE-01 | Closure | Final Review Report |
| T-CLOSE-02 | Closure | Final Recommendation + Sprint Closure Procedure |

## 9. Task Dependencies

```
T-PRE-01
  ├─→ T-DOC-01..05 (song song được, đều cần code thật)
  ├─→ T-API-01 → T-API-02
  ├─→ T-DB-01 → T-DB-02 → T-DB-03
  ├─→ T-ENG-01 → T-ENG-02
  └─→ T-LIC-01 → T-LIC-02 → T-LIC-03

T-DOC-01..05, T-API-02, T-DB-03, T-ENG-02, T-LIC-03
  → T-GAP-01 (tổng hợp mọi finding thành Known Gaps)

T-GAP-01 + T-LIC-02
  → T-README-01 (README chỉ viết sau khi biết licensing framing cuối cùng)
  → T-VER-01
  → T-CHANGE-01 (CHANGELOG cần biết version mới từ T-VER-01)

T-README-01 + T-CHANGE-01 + T-VER-01
  → T-CLEAN-01 (verify môi trường sạch với README/CHANGELOG đã cập nhật)

T-CLEAN-01 + tất cả Audit tasks
  → T-EXIT-01 (Evidence Matrix cần toàn bộ bằng chứng trên)

T-EXIT-01 + T-GAP-01
  → T-CLOSE-01 → T-CLOSE-02
```

## 10. Documentation Audit

### T-DOC-01 — Natal Chart Domain Spec vs Code

- **Objective:** Xác nhận 21 Testable Business Rule (Mục 31, Domain Spec) và toàn bộ Entity/VO/Error đã đóng băng khớp code thật trong `backend/src/modules/chart/domain/`.
- **Preconditions:** T-PRE-01 hoàn thành.
- **Files:** `docs/architecture/Natal_Chart_Domain_Specification.md`; `backend/src/modules/chart/domain/**`; `backend/tests/unit/modules/chart/domain/**`.
- **Steps:**
  1. Trích toàn bộ 21 TR từ Domain Spec §31 thành danh sách có ID.
  2. Với mỗi TR, tìm test case tương ứng bằng `grep -rn "TR-" backend/tests` (hoặc tên rule) — xác nhận tồn tại, không chỉ tồn tại tên mà còn assert đúng hành vi.
  3. Đối chiếu Entity/VO field-by-field giữa Domain Spec §5.3 và `chart.entity.ts`, `angle.entity.ts`, v.v.
  4. Đối chiếu Domain Spec §8 (`EngineInput`/`utcDateTime`) với `engine-input.vo.ts` — đây là gap đã biết từ Sprint 3 Summary (mục 2.4, dòng "Natal Chart Domain Spec §8 chưa cập nhật") — xác nhận còn tồn tại hay đã vá.
- **Expected result:** Bảng 21 TR × trạng thái test, danh sách field mismatch (nếu có).
- **Verification method:** `npm run test -- tests/unit/modules/chart/domain` output thật + code review song song.
- **Acceptance criteria:** Mỗi TR có ít nhất 1 test pass thật; mọi field mismatch được phân loại DRIFT.
- **Dependencies:** T-PRE-01.
- **Risk:** Thấp — đây là audit đọc, không sửa code.
- **Classification:** C0.
- **Blocks Sprint closure:** Có, nếu phát hiện TR nào không có test (blocking).

### T-DOC-02 — Swiss Ephemeris Integration Spec vs Code

- **Objective:** Đối chiếu toàn bộ hành vi tích hợp (house system, planet mapping, high-latitude policy, warning taxonomy) với `infrastructure/adapters/**`.
- **Preconditions:** T-PRE-01.
- **Files:** `docs/architecture/Swiss_Ephemeris_Integration_Specification.md`; `backend/src/modules/chart/infrastructure/adapters/**`.
- **Steps:**
  1. Đối chiếu `warning.vo.ts` và mã warning thật (`HOUSE_SYSTEM_NOT_CONVERGING` — đã sửa từ `NON_CONVERGENT_HOUSE_SYSTEM` theo M2) với bảng warning taxonomy trong Spec.
  2. Đối chiếu `house-system.mapping.ts`, `celestial-body.mapping.ts` với danh sách house system/celestial body đã đóng băng.
  3. Đối chiếu `high-latitude-policy.ts` với chính sách high-latitude đã Confirmed.
  4. Xác nhận Edge Case Mục 36 (18 case) — đối chiếu với M9's 18 edge case đã liệt kê trong Sprint 3 Summary.
- **Expected result:** Bảng đối chiếu warning/mapping/policy, danh sách gap nếu có.
- **Verification method:** Code review + `npm run test -- tests/unit/modules/chart/infrastructure/adapters`.
- **Acceptance criteria:** Không còn warning code cũ (`NON_CONVERGENT_HOUSE_SYSTEM`) sót lại ở bất kỳ đâu trong code/test/doc.
- **Dependencies:** T-PRE-01.
- **Risk:** Thấp.
- **Classification:** C0.
- **Blocks Sprint closure:** Có, nếu tìm thấy warning code cũ còn sót.

### T-DOC-03 — Project Architecture Spec vs Code

- **Objective:** Xác nhận module boundary (`identity`/`birth-profile`/`chart`/`interpretation`) và Clean Architecture layer rule được enforce đúng thật, không chỉ trên giấy.
- **Files:** `docs/architecture/Project_Architecture_Specification.md`; `backend/.eslintrc.cjs`; `backend/src/modules/**/index.ts`.
- **Steps:**
  1. Xác nhận `.eslintrc.cjs` dùng `boundaries/dependencies` (không phải `boundaries/entry-point`, đã deprecated) — đã verify sơ bộ, cần re-confirm tại thời điểm M10.
  2. Thử nghiệm thật: tạo 1 import trái phép tạm thời (ví dụ import trực tiếp `chart/domain` từ `identity` module) → chạy `npm run lint` → xác nhận bị reject → revert ngay.
  3. Xác nhận `chart/index.ts` chỉ export 4 Use Case (không lộ `ChartBuilder`/`IChartRepository` — đã verify, cần re-confirm).
- **Expected result:** Log ESLint reject thật (Exit Criterion #10).
- **Verification method:** Chạy lệnh thật, không suy luận từ code tĩnh.
- **Acceptance criteria:** Import trái phép bị ESLint chặn với message rõ ràng; revert sạch, không để lại thay đổi.
- **Dependencies:** T-PRE-01.
- **Risk:** Trung bình — phải revert thử nghiệm cẩn thận, không để lẫn vào commit thật.
- **Classification:** C0 (chỉ verify, không đổi kiến trúc).
- **Blocks Sprint closure:** Có.

### T-DOC-04 — Backend Implementation Guide & Coding Standards vs Code

- **Objective:** Xác nhận coding convention thật khớp Coding Standards, và ghi nhận rõ Coverage Philosophy (§12.7) hiện **chưa tồn tại** trong Coding Standards như một Known Gap (đã biết trước, không phải phát hiện mới).
- **Files:** `docs/development/Coding_Standards_And_Conventions.md`; `docs/development/Backend_Implementation_Guide.md`.
- **Steps:**
  1. `grep -n "12.7\|Coverage Philosophy" docs/development/Coding_Standards_And_Conventions.md` — xác nhận mục này chưa tồn tại (đúng như Sprint 3 Plan §12.7 đã tự ghi nhận là follow-up).
  2. Không viết thêm mục 12.7 trong M10 — đây là **documentation follow-up ngoài Sprint 3**, chỉ ghi vào Known Gaps Registry (T-GAP-01), không tự ý thêm vào tài liệu đã đóng băng.
- **Expected result:** Xác nhận mục 12.7 chưa tồn tại → đưa vào Known Gaps với trạng thái "documentation follow-up, non-blocking".
- **Verification method:** `grep` thật.
- **Acceptance criteria:** Gap được ghi nhận đúng, không bị biến thành task code trong M10.
- **Dependencies:** T-PRE-01.
- **Risk:** Thấp.
- **Classification:** C0.
- **Blocks Sprint closure:** Không (đã xác định trước là non-blocking trong Sprint 3 Plan chính nó).

### T-DOC-05 — Sprint 3 Plan M1–M9 vs Actual Delivered Code

- **Objective:** Re-verify (không tin lại) các claim trong `AstroViet_Sprint3_Backend_Summary.md` bằng code thật tại thời điểm M10 (có thể đã có commit mới từ lúc verify 2026-09-13).
- **Files:** Toàn bộ `backend/src/modules/chart/**`, `backend/tests/**/chart/**`.
- **Steps:**
  1. `git log --oneline` — xác nhận HEAD hiện tại, so với `81e0f95`.
  2. Nếu có commit mới, review diff commit mới trước khi tiếp tục audit khác.
  3. Re-run toàn bộ test suite, so khớp số liệu (469/508 pass tại lần verify trước, trừ các fail do Prisma client chưa generate trong sandbox — môi trường M10 thật cần **generate Prisma Client thành công**, không chấp nhận lại lý do "network egress bị chặn").
- **Expected result:** Xác nhận không có regression từ `81e0f95` tới HEAD thật của M10.
- **Verification method:** `git log`, `npm test` output đầy đủ (không bị chặn Prisma).
- **Acceptance criteria:** 508/508 test pass (không còn ngoại lệ do môi trường) hoặc lý do fail mới được ghi nhận rõ.
- **Dependencies:** T-PRE-01.
- **Risk:** Trung bình — nếu môi trường M10 vẫn bị chặn Prisma binary, đây sẽ tái diễn thành UNVERIFIED cho Exit Criterion #3/#4.
- **Classification:** C0.
- **Blocks Sprint closure:** Có — Exit Criterion #3 (21 TR pass) và #4 (Golden test pass) cần bằng chứng test thật đầy đủ, không phải suy luận từ lần audit trước.

## 11. OpenAPI Audit

### T-API-01 — Sinh OpenAPI thật + diff với REST API Spec

- **Objective:** Chạy `npm run generate:openapi` thật, đối chiếu 4 endpoint Chart với REST API Spec (path, method, auth, request/response schema, status code, RFC7807 error).
- **Preconditions:** Prisma Client generate thành công (môi trường M10 phải có network đầy đủ).
- **Files:** `backend/scripts/generate-openapi.ts`; `backend/src/modules/chart/presentation/openapi/chart.openapi.ts`; `docs/api/REST_API_Specification.md`.
- **Steps:**
  1. `npm run generate:openapi` → lấy `openapi.json` thật.
  2. Với từng endpoint (`POST /charts/natal`, `GET /charts/:id`, `GET /charts`, `DELETE /charts/:id`): đối chiếu path/method/tags/security/requestBody schema/response schema/status codes với REST API Spec Mục 5.
  3. Đối chiếu error response (RFC7807 Problem Details) — xác nhận đủ 8 lỗi + 2 `ErrorCode` mới đã thêm ở M7 (theo Sprint 3 Summary) thật sự xuất hiện trong OpenAPI `responses` object, không chỉ trong code.
  4. Đối chiếu `save` query param — mặc định `false` (đã verify code, cần verify nó cũng đúng trong OpenAPI generated schema, không chỉ Zod schema).
- **Expected result:** Bảng đối chiếu 4 endpoint × từng khía cạnh (path/method/auth/schema/status/error).
- **Verification method:** So sánh file `openapi.json` sinh thật với bảng REST API Spec — trích dẫn 2 phía cho mọi mismatch.
- **Acceptance criteria:** 0 mismatch không giải thích được; mọi mismatch phân loại DRIFT có nguồn.
- **Dependencies:** T-PRE-01, Prisma Client generate thành công.
- **Risk:** Trung bình — phụ thuộc môi trường generate Prisma thành công.
- **Classification:** C0 (audit); nếu phát hiện lệch thật do code sai (không phải do doc), phân loại lại C1 theo Mục 19.
- **Blocks Sprint closure:** Có — Exit Criterion #6, #7.

### T-API-02 — Auth/Ownership/Validation/Pagination behavior thật

- **Objective:** Xác nhận hành vi thật (không chỉ OpenAPI mô tả) qua API test thật.
- **Files:** `backend/tests/api/chart/**` (hoặc tương đương theo cấu trúc thật).
- **Steps:**
  1. Chạy toàn bộ API test suite cho `chart` module.
  2. Xác nhận `GET /charts` hỗ trợ đúng phân trang/filter/sort như REST API Spec + Exit Criterion #6 yêu cầu.
  3. Xác nhận ownership: user A không thể `GET`/`DELETE` chart của user B (403/404 theo đúng policy đã áp dụng ở `birth-profile`).
- **Expected result:** Test report đầy đủ pass, có log riêng cho ownership case.
- **Verification method:** `npm run test -- tests/api/chart` output thật.
- **Acceptance criteria:** 100% case trong REST API Spec Mục 5 cho 4 endpoint có test tương ứng và pass.
- **Dependencies:** T-API-01.
- **Risk:** Thấp.
- **Classification:** C0.
- **Blocks Sprint closure:** Có.

## 12. Database Audit

### T-DB-01 — Prisma schema vs Database Design Spec

- **Objective:** Đối chiếu field-by-field `astrology.charts` + 6 bảng con với Database Design Spec §5.7 trở đi.
- **Files:** `backend/prisma/schema.prisma`; `docs/database/Database_Design_Specification.md`.
- **Steps:**
  1. Đối chiếu từng cột (nullable/default/FK/index) — **đã biết trước 1 mismatch**: `snapshot_interpretation_version` là `String?` (nullable) trong `schema.prisma` nhưng Database Design Spec §5.7 vẫn ghi `✘` (NOT NULL). Xác nhận lại mismatch này còn tồn tại tại thời điểm M10.
  2. Nếu còn tồn tại: đây là DOCUMENTATION DRIFT (code đúng theo M5 Schema Decision đã Confirmed, doc chưa cập nhật) — phân loại C0, sửa doc để khớp code, **không sửa code**.
  3. Kiểm tra toàn bộ index/FK/cascade theo Mục 6 của prompt gốc: `birth_profile_id` FK `ON DELETE SET NULL`, `user_id` FK `ON DELETE CASCADE`, composite FK `chart_planets → chart_houses` (đã sửa bug ở M5 bằng `$transaction` tường minh — xác nhận còn đúng).
- **Expected result:** Bảng đối chiếu đầy đủ + xác nhận sửa doc §5.7.
- **Verification method:** Đọc trực tiếp `schema.prisma` + Database Design Spec song song, dòng theo dòng.
- **Acceptance criteria:** Mọi cột khớp; §5.7 đã cập nhật đúng thực tế nullable.
- **Dependencies:** T-PRE-01.
- **Risk:** Thấp.
- **Classification:** C0 (audit) → C0 (sửa doc, không phải code).
- **Blocks Sprint closure:** Không tự nó blocking (đã biết rõ là doc lag), nhưng phải được sửa trước khi Sprint 3 đóng — coi là "documentation follow-up bắt buộc trong M10" (khác với §12.7 vốn được phép để ngoài Sprint).

### T-DB-02 — Migration history vs schema.prisma (drift check)

- **Objective:** Xác nhận không có drift giữa migration đã apply và `schema.prisma` hiện tại.
- **Files:** `backend/prisma/migrations/**`; `backend/prisma/schema.prisma`.
- **Steps:**
  1. Trên DB test sạch: `npx prisma migrate deploy` rồi `npx prisma migrate status` — xác nhận "up to date", không có "drift detected".
  2. Nếu Prisma CLI network bị chặn (như trong sandbox review trước) — đây phải được list là **UNVERIFIED** với hướng dẫn verify rõ ràng (chạy trên máy có network đầy đủ), không được suy luận "chắc là ổn".
- **Expected result:** Log `prisma migrate status` thật.
- **Verification method:** Lệnh thật trên DB test sạch.
- **Acceptance criteria:** "No drift" xác nhận bằng log thật; nếu không chạy được, đánh dấu UNVERIFIED tường minh trong Exit Criteria Matrix (không đánh PASS).
- **Dependencies:** T-DB-01.
- **Risk:** Trung bình (phụ thuộc network môi trường thật).
- **Classification:** C0.
- **Blocks Sprint closure:** Có — Exit Criterion #5, trừ khi đánh dấu UNVERIFIED có kế hoạch verify cụ thể (không tự động block vô thời hạn, nhưng không được PASS giả).

### T-DB-03 — Chart Snapshot Immutability end-to-end

- **Objective:** Xác nhận thiết kế Immutable Chart Snapshot (Domain Spec + DB Design) hoạt động đúng thật — sửa `BirthProfile` gốc không làm sai lệch Chart đã lưu.
- **Files:** `backend/tests/integration/modules/chart/**`.
- **Steps:**
  1. Tìm hoặc bổ sung 1 integration test: tạo Chart từ BirthProfile → sửa BirthProfile (đổi giờ sinh) → xác nhận Chart cũ vẫn giữ nguyên `snapshot_*` cũ.
  2. Nếu test này chưa tồn tại — đây là gap thật cần bổ sung (C1, nhỏ, không đổi kiến trúc, test-only).
- **Expected result:** Test pass xác nhận tính bất biến.
- **Verification method:** `npm run test` output cho test case cụ thể này.
- **Acceptance criteria:** Test tồn tại và pass.
- **Dependencies:** T-DB-01, T-DB-02.
- **Risk:** Thấp.
- **Classification:** C1 nếu phải viết test mới (nhỏ, test-only, không đổi kiến trúc/API).
- **Blocks Sprint closure:** Có — đây là bằng chứng cốt lõi của "Confirm that actual schema is compatible with the immutable Chart Snapshot design" (Mục 6 của yêu cầu M10).

## 13. Swiss Ephemeris & Licensing Audit

### T-ENG-01 — Boundary Domain→Port→Adapter→swisseph-wasm

- **Objective:** Xác nhận `import.*swisseph` chỉ xuất hiện trong tầng Infrastructure.
- **Files:** Toàn bộ `backend/src/modules/chart/**`.
- **Steps:**
  1. `grep -rln "swisseph" backend/src/modules/chart --include="*.ts"` — tại lần audit trước (2026-09-13), kết quả là 3 file: `initialize-ephemeris-provider.ts`, `swiss-ephemeris.adapter.ts` (đều Infrastructure, hợp lệ), và `engine-version.constant.ts` (Domain, nhưng chỉ chứa **chuỗi ký tự** `'chart-engine-v0.2.0+swisseph-wasm-0.1.0'`, không có `import` thật).
  2. Xác nhận rõ: `engine-version.constant.ts` **không vi phạm** Exit Criterion #2 ("Domain layer không phụ thuộc Swiss Ephemeris") vì đây là literal string versioning, không phải dependency thật — nhưng cần `grep -n "^import"` riêng để xác nhận dứt điểm, tránh false positive/negative.
  3. Nếu tại thời điểm M10 thật có thêm `import` thật trong Domain — đây là IMPLEMENTATION DRIFT nghiêm trọng, blocking.
- **Expected result:** Bằng chứng grep rõ ràng, phân biệt "chứa chữ swisseph trong string" vs "import thật".
- **Verification method:** `grep -rn "^import" | grep swisseph` trong toàn bộ `domain/`.
- **Acceptance criteria:** 0 `import` thật ngoài `infrastructure/adapters/`.
- **Dependencies:** T-PRE-01.
- **Risk:** Thấp.
- **Classification:** C0.
- **Blocks Sprint closure:** Có — Exit Criterion #2.

### T-ENG-02 — Hành vi tính toán vs Golden/Edge-case tests

- **Objective:** Xác nhận planet/house/sign/longitude normalization/retrograde/unknown-birth-time/house system/aspect/precision khớp Spec, dựa trên Golden Test (5 fixture, tolerance 0.01°) và 18 edge case đã có ở M9.
- **Files:** `backend/tests/fixtures/golden/**`; `backend/tests/integration/modules/chart/golden/**` (hoặc tương đương).
- **Steps:**
  1. Chạy Golden Test suite, xác nhận tolerance `0.01°` (Exit Criterion #4) — dùng nguồn NASA JPL Horizons cho planet (độc lập thật), Astrodienst cho house (Known Gap đã chấp nhận — không giải quyết lại ở M10).
  2. Xác nhận House/Angle Known Gap (không có nguồn độc lập thật) vẫn được ghi nhận đúng trong Known Gaps Registry (T-GAP-01), không bị "quên" qua Sprint 3.
- **Expected result:** Test report Golden suite pass trong tolerance.
- **Verification method:** `npm run test` output riêng cho Golden suite.
- **Acceptance criteria:** 5/5 fixture pass trong tolerance; Known Gap House/Angle ghi nhận rõ, không đóng giả.
- **Dependencies:** T-ENG-01.
- **Risk:** Thấp — đã risk-assessed từ M8.
- **Classification:** C0.
- **Blocks Sprint closure:** Có — Exit Criterion #4.

### T-LIC-01 — 8-field License Record completeness

- **Objective:** Xác nhận `docs/legal/swisseph-license-record.md` đủ 8 trường theo yêu cầu Mục 8 của prompt gốc (package name, version, package license, upstream Swiss Ephemeris license, WASM/core provenance, ephemeris data provenance, notices/attributions, production licensing strategy/status).
- **Files:** `docs/legal/swisseph-license-record.md`.
- **Steps:**
  1. Đối chiếu trực tiếp: file hiện có 5 mục lớn (Package Identity, Source & Ownership, License Type, License Extract, Compliance Implications) — cần map từng mục sang đúng 8 trường yêu cầu, xác định trường nào **chưa** có mục riêng tường minh (ví dụ "WASM/core provenance" và "ephemeris data provenance" hiện chỉ ngụ ý qua "Source & Ownership", chưa tách riêng).
  2. Nếu thiếu trường tường minh — bổ sung (C0, chỉ format lại thông tin đã có, không cần điều tra pháp lý mới) hoặc điều tra thêm nếu thông tin thật sự chưa tồn tại (C1, nhỏ).
- **Expected result:** Bảng map 8 trường × trạng thái (đầy đủ / cần bổ sung format / cần điều tra thêm).
- **Verification method:** Đọc trực tiếp file + đối chiếu `package.json`/`npm view swisseph-wasm` (nếu network cho phép).
- **Acceptance criteria:** 8/8 trường có thông tin tường minh, không suy luận.
- **Dependencies:** T-PRE-01.
- **Risk:** Thấp.
- **Classification:** C0/C1 tùy trường.
- **Blocks Sprint closure:** Có — Exit Criterion #8, Acceptance Criteria #7 của M10 (yêu cầu prompt gốc).

### T-LIC-02 — AGPL vs GPL-3.0-or-later discrepancy resolution

- **Objective:** Xử lý tường minh mâu thuẫn đã phát hiện: Sprint 3 Implementation Plan §13 ghi hướng RESOLVED là **AGPL**; nhưng License Record thật (kết quả M2) kết luận wrapper `swisseph-wasm` là **`GPL-3.0-or-later`, không có điều khoản Affero (network-use clause)**. `backend/README.md` hiện lại ghi "Proprietary — Internal project", mâu thuẫn với cả hai.
- **Preconditions:** T-LIC-01 hoàn thành.
- **Files:** `docs/implementation/Sprint_3_Natal_Chart_Module_Implementation_Plan.md` (Mục 13, **chỉ đọc, không tự sửa** — đây là frozen spec/plan); `docs/legal/swisseph-license-record.md`; `backend/README.md`.
- **Steps:**
  1. Ghi nhận rõ 3 nguồn đang nói 3 điều khác nhau: (a) Plan nói AGPL, (b) License Record nói GPL-3.0-or-later không có Affero clause, (c) README nói Proprietary.
  2. **Không tự ý chọn bên nào đúng.** Đây không phải việc "sửa lỗi chính tả" — nghĩa vụ pháp lý giữa GPL-3.0 thường (không network-use trigger) và AGPL (có network-use trigger) khác nhau thật sự. Quyết định A/B ban đầu (open-source vs commercial) **giữ nguyên là open-source** — không mở lại — nhưng **loại giấy phép mã nguồn mở cụ thể nào đang thực sự áp dụng** là một câu hỏi kỹ thuật/pháp lý riêng, phát sinh từ chính bằng chứng M2 thu thập được, chưa từng được đối chiếu ngược lại với câu chữ "AGPL" trong Plan.
  3. Trình bày phát hiện này cho người quyết định dự án (chủ dự án) xác nhận rõ: License Record (bằng chứng kỹ thuật thật) hay câu chữ "AGPL" trong Plan (giả định ban đầu trước khi có License Record) là căn cứ đúng để mô tả trong tài liệu công khai (README, giấy phép dự án).
  4. Sau khi có xác nhận, cập nhật `backend/README.md` (T-README-01) và phần "AGPL compliance obligations" trong License Record cho khớp — đây là C0 (chỉ đồng bộ hóa ngôn từ theo bằng chứng đã xác nhận, không phải quyết định kinh doanh mới).
  5. Không tự đưa ra kết luận pháp lý vượt quá văn bản license chính thức (đúng rule #9 của prompt gốc).
- **Expected result:** Một quyết định tường minh, có xác nhận, về loại giấy phép mã nguồn mở chính xác áp dụng cho `swisseph-wasm` trong AstroViet, được phản ánh nhất quán ở Plan-note/License Record/README.
- **Verification method:** Đối chiếu văn bản license gốc (`LICENSE` trong tarball `swisseph-wasm`) — đã trích trong License Record Mục 4 — với định nghĩa GPL-3.0 vs AGPL-3.0 chính thức (FSF).
- **Acceptance criteria:** 3 nguồn (Plan-note bổ sung, License Record, README) nhất quán; không còn nói "AGPL" ở nơi nào nếu bằng chứng xác nhận là GPL-3.0-or-later, hoặc ngược lại nếu có bằng chứng khác chứng minh AGPL đúng.
- **Dependencies:** T-LIC-01.
- **Risk:** **Cao** — đây là gap có khả năng ảnh hưởng go-live compliance thật, không phải gap kỹ thuật thông thường. Không được tự ý resolve mà không có xác nhận từ người có thẩm quyền quyết định của dự án.
- **Classification:** C0 (đồng bộ tài liệu) — nhưng **yêu cầu quyết định của người dùng trước khi thực thi**, không tự động.
- **Blocks Sprint closure:** **Có, blocking** cho tới khi có xác nhận rõ ràng — không được đánh Exit Criterion #8 là PASS nếu mâu thuẫn này chưa giải quyết.

### T-LIC-03 — Source-publication scope identification

- **Objective:** Xác định (không thực thi) phạm vi mã nguồn cần công khai theo giấy phép mã nguồn mở đã xác nhận ở T-LIC-02 (toàn bộ backend repo hay chỉ phần liên kết trực tiếp Swiss Ephemeris).
- **Files:** `docs/legal/swisseph-license-record.md`.
- **Steps:**
  1. Dựa trên kết quả T-LIC-02, xác định phạm vi theo đúng điều khoản license đã xác nhận (GPL-3.0 "derivative work" scope khác AGPL "network use" scope).
  2. Ghi nhận rõ: đây chỉ là **xác định phạm vi**, không phải hành động publish thật — publish là hành động riêng, thực hiện trước khi go-live public, không phải điều kiện đóng Sprint 3.
- **Expected result:** Đoạn văn bản rõ ràng trong License Record mô tả phạm vi.
- **Verification method:** Đối chiếu văn bản license.
- **Acceptance criteria:** Phạm vi được ghi rõ, không mơ hồ ("toàn bộ backend" hoặc "chỉ adapter + interface liên quan" — chọn 1, có lý do).
- **Dependencies:** T-LIC-02.
- **Risk:** Trung bình.
- **Classification:** C0.
- **Blocks Sprint closure:** Không (Sprint 3 có thể đóng với phạm vi đã *xác định* nhưng chưa *thực thi* publish — đúng phân biệt Sprint Closure vs Production Go-Live, Mục 22).

## 14. Known Gaps Review

### T-GAP-01 — Biên soạn Known Gaps Registry đầy đủ

- **Objective:** Tổng hợp toàn bộ gap đã biết (từ Sprint 3 Summary + audit M10 mới) thành 1 registry duy nhất, phân loại đúng taxonomy, không giấu gap nào.
- **Files:** File mới `docs/implementation/Sprint_3_Known_Gaps_Registry.md` (hoặc phụ lục trong Final Review Report — quyết định tại lúc thực thi).
- **Steps:** Tổng hợp tối thiểu các gap sau (đã có bằng chứng, không phát minh mới):

| ID | Mô tả | Nguồn | Impact | Severity | Blocks Sprint 3 closure? | Blocks Production launch? |
|---|---|---|---|---|---|---|
| G-01 | `ChartResponse.interpretations` luôn rỗng (Interpretation Engine chưa tồn tại) | Sprint 3 Summary mục 2.1 (M7/M8) | Trung bình | Trung bình | Không | Có (khi cần hiển thị nội dung) |
| G-02 | `ChartSummaryResponse.birthProfileLabel` luôn `null`, chưa chọn hướng giải quyết | Sprint 3 Summary mục 2.2 (M7) | Trung bình (UX list) | Trung bình | Không | Nên giải quyết trước khi UX list thật cần dùng |
| G-03 | House/Angle Golden Reference không có nguồn độc lập thật (chỉ Astrodienst, "cùng họ engine") | Sprint 3 Summary mục 2.3 (M8) | Validation gap | Thấp (đã risk-assessed) | Không | Theo dõi |
| G-04 | Documentation Reconciliation treo: DB Design Spec §5.7 (nullable), Natal Chart Domain Spec §8 (`EngineInput`), Sprint 3 M4 Plan (rule count) | Sprint 3 Summary mục 2.4 (M3/M4/M5) | Nợ tài liệu | Trung bình | **§5.7 nên giải quyết ngay trong M10 (T-DB-01)**; 2 mục còn lại có thể để follow-up nếu không ảnh hưởng closure | Không |
| G-05 | Rate Limiting (REST API Spec §9) chưa implement | Sprint 3 Summary mục 2.5 (M7) | Production readiness | Thấp cho Sprint 3 | Không | **Có, trước production** |
| G-06 | Idempotency Key cho `POST /charts/natal` chưa thiết kế | Sprint 3 Summary mục 2.6 (M7) | Production readiness | Thấp | Không | Có, trước production |
| G-07 | CI thật (GitHub Actions) chưa từng verify chạy xanh end-to-end với network đầy đủ trong suốt quá trình review M1-M9 | Sprint 3 Summary mục 2.7 | Verification gap | **Cao** | **Có — nên chạy CI thật 1 lần trong M10 (T-CLEAN-01 nên bao gồm hoặc bổ trợ bằng 1 lần trigger CI thật)** | Không trực tiếp, nhưng rủi ro nếu bỏ qua |
| G-08 | Backend Coding Standards thiếu mục "Coverage Philosophy" (§12.7) bằng văn bản | Sprint 3 Plan §12.7 tự ghi nhận | Nợ tài liệu | Thấp | Không (đã xác định trước là non-blocking) | Không |
| G-09 | `backend/package.json` version/description vẫn là `0.2.0`/"Sprint 2" | Phát hiện độc lập khi verify 2026-09-13 | Nợ metadata | Thấp | Nên sửa trong M10 (T-VER-01) | Không |
| G-10 | `CHANGELOG.md` chưa có entry Sprint 3 | Phát hiện độc lập khi verify 2026-09-13 | Nợ tài liệu | Thấp | Nên sửa trong M10 (T-CHANGE-01) | Không |
| G-11 | Mâu thuẫn AGPL (Plan) vs GPL-3.0-or-later (License Record) vs Proprietary (README) | Phát hiện độc lập trong Pre-Plan Audit M10 (T-LIC-02) | Compliance | **Cao** | **Có — blocking cho tới khi resolve (T-LIC-02)** | Có, trực tiếp |
| G-12 | `backend/README.md` mô tả Sprint 3 là "Sắp tới", không có chart module | Phát hiện độc lập trong Pre-Plan Audit M10 | Documentation drift nghiêm trọng | Trung bình | Nên sửa trong M10 (T-README-01) | Không trực tiếp |
| G-13 | D-14 Pattern Detection algorithm thật chưa implement (`chart_patterns` luôn rỗng) | Sprint 3 Summary mục 3.3 | Future feature | Thấp | Không | Không |
| G-14 | Rủi ro bảo trì `swisseph-wasm` (package non trẻ, ít maintainer) | Sprint 3 Summary mục 3.3 (ghi nhận từ M2) | Technical debt | Thấp | Không | Theo dõi dài hạn |

- **Expected result:** Registry hoàn chỉnh 14 gap tối thiểu, mỗi gap có đủ 9 trường theo yêu cầu Mục 9 (ID/description/source/impact/severity/status/owner/follow-up milestone/blocks closure/blocks production).
- **Verification method:** Đối chiếu chéo với toàn bộ audit task (T-DOC/T-API/T-DB/T-ENG/T-LIC) — không được có finding nào từ các task đó mà không xuất hiện ở đây.
- **Acceptance criteria:** Registry không thiếu gap nào đã biết; G-07 và G-11 được đánh dấu đúng mức độ nghiêm trọng (Cao/blocking).
- **Dependencies:** T-DOC-01..05, T-API-02, T-DB-03, T-ENG-02, T-LIC-03.
- **Risk:** Thấp (tổng hợp), nhưng risk cao nếu bỏ sót gap để Exit Criteria "xanh" giả.
- **Classification:** C0.
- **Blocks Sprint closure:** Bản thân task này không block, nhưng nó xác định gap nào khác block.

## 15. README Update

### T-README-01 — Viết lại `backend/README.md`

- **Objective:** Cập nhật `backend/README.md` phản ánh đúng thực tế Sprint 1–3 (không phải chỉ Sprint 1–2 như hiện tại).
- **Preconditions:** T-LIC-02 đã có kết luận về licensing framing (README phụ thuộc kết quả này cho dòng cuối "License").
- **Files:** `backend/README.md`.
- **Steps:**
  1. Cập nhật dòng trạng thái đầu file: bỏ "Sprint 3: Natal Chart Module (Sắp tới) 🔜" → mô tả đúng: Sprint 3 hoàn thành, có Natal Chart Module + Swiss Ephemeris Integration.
  2. Bổ sung `chart` (và `interpretation` nếu đã scaffold) vào sơ đồ Folder Structure.
  3. Bổ sung phần mô tả Chart flow tương tự phần "Birth Profile Flow" đã có: tạo chart (`save=true/false`), lấy chart, list chart (phân trang/filter/sort), xóa chart, cơ chế Swiss Ephemeris qua `IEphemerisProvider`.
  4. Bổ sung biến môi trường mới nếu Sprint 3 có thêm (ví dụ liên quan `swisseph-wasm` init nếu có) — kiểm tra `.env.example` thật trước khi viết.
  5. Cập nhật dòng cuối "License" theo đúng kết luận T-LIC-02 — **không để "Proprietary"** nếu kết luận cuối là open-source (GPL-3.0-or-later hoặc AGPL, tùy T-LIC-02).
  6. Cập nhật "Project Roadmap": Sprint 3 chuyển từ "Sắp tới 🔜" sang "Hoàn thành ✅".
  7. Không mô tả tính năng chưa tồn tại thật (ví dụ không viết "Interpretation content đầy đủ" vì G-01 vẫn rỗng).
- **Expected result:** `backend/README.md` mới, đúng chuẩn chất lượng đã thiết lập ở Frontend README (Sprint F1 M10).
- **Verification method:** Đọc lại README sau khi viết, đối chiếu từng câu với code thật — không để câu nào mô tả tính năng chưa có.
- **Acceptance criteria:** Một developer mới đọc README có thể hiểu đúng trạng thái thật của backend tại cuối Sprint 3.
- **Dependencies:** T-LIC-02, T-GAP-01 (để biết chính xác cái gì chưa có, tránh viết quá tay).
- **Risk:** Thấp.
- **Classification:** C0.
- **Blocks Sprint closure:** Có — Acceptance Criteria #5 của M10.

## 16. Clean Environment Verification

### T-CLEAN-01 — Full clean-environment run

- **Objective:** Mô phỏng developer mới, verify toàn bộ pipeline từ `git clone` tới API hoạt động, dùng đúng lệnh thật trong README (không phát minh lệnh).
- **Files:** N/A (thực thi trên máy/sandbox sạch).
- **Steps (đúng thứ tự README `backend/README.md` sau khi T-README-01 cập nhật):**
  1. `git clone` repo, checkout `dev` tại HEAD thật của M10.
  2. `npm ci` (không `npm install`, đúng chuẩn CI).
  3. `cp .env.example .env`, điền biến bắt buộc theo bảng README.
  4. `docker compose up -d` (Postgres dev) hoặc `docker-compose.test.yml` cho test DB.
  5. `npm run prisma:generate` — **phải thành công thật**, không chấp nhận lại lý do network egress như trong sandbox review trước.
  6. `npm run prisma:migrate` (hoặc `prisma:deploy` nếu môi trường CI-like).
  7. `npm run lint`.
  8. `npm run typecheck`.
  9. `npm run test:coverage`.
  10. `npm run build`.
  11. `npm start` (hoặc `npm run dev`) — verify server khởi động không lỗi.
  12. `curl http://localhost:3000/api/v1/health` — verify health endpoint.
  13. `curl http://localhost:3000/docs` — verify Swagger UI khả dụng.
  14. Gọi thử `POST /charts/natal` với payload hợp lệ (kèm `Authorization` token thật từ luồng login) — verify response thật khớp OpenAPI.
- **Expected result:** Bảng lệnh × kết quả mong đợi × kết quả thật × PASS/FAIL cho toàn bộ 14 bước.
- **Verification method:** Chạy thật từng lệnh, ghi log đầy đủ (không tóm tắt).
- **Acceptance criteria:** Toàn bộ 14 bước PASS trên môi trường có network đầy đủ; nếu bước nào FAIL do hạn chế sandbox (không phải bug thật), ghi rõ UNVERIFIED + điều kiện cần để verify.
- **Dependencies:** T-README-01 (lệnh phải khớp README mới), T-VER-01, T-CHANGE-01.
- **Risk:** Trung bình — phụ thuộc network/môi trường thật đầy đủ (khác sandbox review đã dùng trước đây).
- **Classification:** C0.
- **Blocks Sprint closure:** Có — đây là bằng chứng cốt lõi cho câu hỏi "developer mới có tự chạy được không".

## 17. Sprint Exit Criteria Verification

### T-EXIT-01 — Evidence Matrix cho 13 tiêu chí (Mục 21, Sprint 3 Plan)

Dùng nguyên văn 13 tiêu chí đã đóng băng — **không phát minh tiêu chí mới**:

| # | Exit Criterion | Evidence Required | Actual Evidence (điền khi thực thi M10) | Status |
|---|---|---|---|---|
| 1 | 10 Milestone đạt AC riêng | Log/PR từng milestone | — | UNVERIFIED (chờ thực thi) |
| 2 | Domain không phụ thuộc Swiss Ephemeris/Prisma/Express | `grep` output | Đã có bằng chứng sơ bộ 2026-09-13 (T-ENG-01) | PARTIAL (cần re-confirm tại HEAD M10 thật) |
| 3 | 21 TR pass | `npm run test` output | 469/508 pass tại 2026-09-13 (39 fail/skip do Prisma binary sandbox) | PARTIAL — cần chạy lại với Prisma generate thành công (T-DOC-05) |
| 4 | Golden Test pass tolerance 0.01° | Test report + nguồn | Cần chạy lại (T-ENG-02) | UNVERIFIED |
| 5 | Migration sạch trên DB sạch | Log migration | Cần chạy lại (T-DB-02) | UNVERIFIED |
| 6 | API end-to-end 4 endpoint | API test report | Cần chạy lại (T-API-02) | UNVERIFIED |
| 7 | RFC7807 đúng mọi category | API test report | Cần chạy lại (T-API-01/02) | UNVERIFIED |
| 8 | License Record 8/8 trường, audit compliance | Record + audit note | **Mâu thuẫn AGPL/GPL-3.0/Proprietary chưa resolve** (G-11) | **FAIL cho tới khi T-LIC-02 hoàn thành** |
| 9 | CI backend đúng vị trí, trigger đúng suốt Sprint | Link CI run thật (nhiều lần) | Chưa có bằng chứng CI thật chạy xanh end-to-end (G-07) | **UNVERIFIED — cần trigger CI thật trong M10** |
| 10 | Cross-module boundary enforce tự động | Log ESLint reject | Cần thực thi thử nghiệm thật (T-DOC-03) | UNVERIFIED |
| 11 | Không FIXME trong `chart/` | `grep` = 0 | Đã xác nhận 0 tại 2026-09-13 | PASS (cần re-confirm) |
| 12 | Coverage review theo risk-based policy | Report + ghi chú 4 tiêu chí | Đã có từ M9, cần đối chiếu lại tại M10 | PARTIAL |
| 13 | Known Gaps ghi nhận đầy đủ | Registry | Sẽ có sau T-GAP-01 | UNVERIFIED (chờ T-GAP-01) |

- **Objective:** Không đánh PASS bất kỳ tiêu chí nào chỉ vì "tài liệu nói vậy" — mọi PASS phải có evidence thật điền vào cột "Actual Evidence" tại thời điểm thực thi M10 thật.
- **Verification method:** Chạy lại toàn bộ audit task tương ứng, không copy nguyên bảng trên (bảng trên chỉ là khung + trạng thái sơ bộ dựa trên bằng chứng đã có tại 2026-09-13).
- **Acceptance criteria:** Không còn dòng nào "UNVERIFIED" mà không có kế hoạch verify cụ thể đính kèm.
- **Dependencies:** Toàn bộ Mục 10–14.
- **Risk:** Cao nếu bị rút gọn thành "đọc lại Sprint 3 Summary rồi copy" — **không được làm vậy**, đúng nguyên tắc `#1: Do not assume the code matches the plan`.
- **Classification:** C0.
- **Blocks Sprint closure:** Có — đây chính là cổng chính của D6.

## 18. CHANGELOG

### T-CHANGE-01 — Cập nhật `CHANGELOG.md`

- **Objective:** Thêm entry Sprint 3 theo đúng convention Keep a Changelog đã có sẵn (2 entry `[0.2.0]`, `[0.1.0]`).
- **Preconditions:** T-VER-01 (biết version mới) và T-GAP-01 (biết chính xác cái gì thật sự "Added", tránh liệt kê tính năng chưa hoàn chỉnh như đã hoàn chỉnh — ví dụ không ghi "Interpretation" vì G-01 vẫn rỗng).
- **Files:** `backend/CHANGELOG.md`.
- **Steps:**
  1. Đọc lại format 2 entry cũ trước khi viết (đã làm — dùng đúng heading `## [x.y.z] - YYYY-MM-DD (Sprint N)`, mục `### Added`/`### Changed`).
  2. Viết entry `## [0.3.0] - <ngày M10 hoàn thành> (Sprint 3)` mô tả **chức năng thật đã giao** (Natal Chart calculation, 4 endpoint REST, Swiss Ephemeris integration, Golden Reference validation), không mô tả ý định của Implementation Plan.
  3. Không tạo convention mới — chỉ nối tiếp đúng format sẵn có.
- **Expected result:** `CHANGELOG.md` có 3 entry, nhất quán format.
- **Verification method:** Đọc lại, so sánh format với 2 entry cũ.
- **Acceptance criteria:** Entry mới chỉ liệt kê tính năng đã verify thật ở Mục 10–17, không liệt kê Known Gap như đã xong.
- **Dependencies:** T-VER-01, T-GAP-01.
- **Risk:** Thấp.
- **Classification:** C0.
- **Blocks Sprint closure:** Không bắt buộc cứng theo Mục 15 prompt gốc ("chỉ update nếu convention có yêu cầu") — nhưng convention **đã có sẵn** trong repo này, nên **nên làm** để nhất quán, không blocking nếu bỏ qua.

### T-VER-01 — Version bump `package.json`

- **Objective:** Sửa `backend/package.json`: `"version": "0.2.0"` → `"0.3.0"`, mô tả `"Sprint 2: Birth Profile Module"` → mô tả đúng Sprint 3.
- **Files:** `backend/package.json`.
- **Steps:** Bump MINOR version (đúng SemVer, Sprint 3 là additive, không breaking change đã biết) theo đúng tiền lệ Sprint 2 (`0.1.0 → 0.2.0` MINOR).
- **Expected result:** Version/description khớp thực tế.
- **Verification method:** Đọc lại `package.json`.
- **Acceptance criteria:** Version đúng SemVer, mô tả đúng Sprint 3.
- **Dependencies:** T-GAP-01 (để chắc chắn mô tả không phóng đại tính năng chưa xong).
- **Risk:** Thấp.
- **Classification:** C1 (thay đổi nhỏ, không đổi hành vi runtime, chỉ metadata).
- **Blocks Sprint closure:** Không, nhưng nên làm cùng đợt với T-CHANGE-01.

## 19. Corrective Change Policy

Áp dụng đúng 3 mức đã định nghĩa trong prompt gốc, không tự sáng tác thêm mức:

- **C0 — Documentation-only:** T-DOC-04 (ghi nhận gap, không sửa Coding Standards), T-DB-01 (sửa DB Design Spec §5.7), T-README-01, T-CHANGE-01, T-LIC-01 (bổ sung format License Record), T-LIC-02 (đồng bộ ngôn từ sau khi có xác nhận), T-LIC-03.
- **C1 — Small corrective implementation:** T-DB-03 (test mới cho Chart Snapshot Immutability nếu chưa có), T-VER-01 (version bump).
- **C2 — Scope expansion:** **Không có task nào trong M10 được phân loại C2.** Nếu trong quá trình audit phát hiện gap cần C2 (ví dụ: phải redesign API cho `birthProfileLabel` — G-02), task đó **dừng lại ngay**, ghi vào Known Gaps Registry (đã có sẵn ở G-02) làm follow-up Sprint tương lai, không code trong M10.

Nguyên tắc cứng: **không có ngoại lệ nào cho phép C2 "chỉ lần này thôi" trong M10.**

## 20. Deliverables

- **D1 — Final Review Report:** Xem Mục 22 (T-CLOSE-01).
- **D2 — `backend/README.md`:** Kết quả T-README-01.
- **D3 — Documentation Corrections:** Danh sách tài liệu đã sửa + lý do — tối thiểu: Database Design Spec §5.7 (T-DB-01), License Record (T-LIC-02/03), có thể cả Natal Chart Domain Spec §8 và Sprint 3 M4 Plan nếu quyết định giải quyết trong M10 thay vì để follow-up (quyết định tại lúc thực thi, dựa trên mức ưu tiên đã ghi ở Sprint 3 Summary mục 2.4).
- **D4 — Licensing Audit Record:** License Record đã cập nhật đủ 8 trường + đã resolve mâu thuẫn AGPL/GPL-3.0 (T-LIC-01/02/03).
- **D5 — Known Gaps Registry:** Kết quả T-GAP-01, **bắt buộc bao gồm** dòng G-08 (Backend Coding Standards §12.7 — Coverage Philosophy, đúng yêu cầu tường minh của prompt gốc Mục 18/D5).
- **D6 — Sprint Exit Criteria Evidence Matrix:** Kết quả T-EXIT-01, 13/13 dòng có evidence thật.
- **D7 — Clean Environment Verification Result:** Kết quả T-CLEAN-01, bảng 14 bước.
- **D8 — CHANGELOG Update:** Kết quả T-CHANGE-01 (thực hiện vì convention đã tồn tại sẵn trong repo).

## 21. Acceptance Criteria

M10 chỉ hoàn thành khi toàn bộ 17 điều kiện sau đều đạt (nguyên văn theo prompt gốc Mục 19, không rút gọn):

1. Mọi Sprint 3 Exit Criterion (Mục 21 Sprint 3 Plan) có evidence cụ thể (T-EXIT-01).
2. Implementation thật đã được audit đối chiếu spec đã đóng băng (Mục 10–13).
3. OpenAPI khớp hành vi API thật (T-API-01/02).
4. Database schema/migration khớp frozen design (T-DB-01/02).
5. `backend/README.md` mô tả đúng repo thật (T-README-01).
6. Licensing audit hoàn chỉnh (T-LIC-01/02/03).
7. License Record đủ 8/8 trường (T-LIC-01).
8. Chiến lược AGPL/open-source được ghi nhận tường minh là RESOLVED — **với điều kiện mâu thuẫn G-11 đã được xử lý dứt điểm ở T-LIC-02**, không chỉ lặp lại câu chữ cũ.
9. Phạm vi công khai mã nguồn cần thiết đã được xác định (T-LIC-03).
10. Không còn quyết định A/B licensing nào bị bỏ ngỏ (giữ nguyên open-source, chỉ làm rõ loại giấy phép cụ thể).
11. Known Gaps được ghi nhận tường minh (T-GAP-01).
12. Backend Coverage Philosophy follow-up (G-08) được ghi nhận là non-blocking.
13. Toàn bộ pipeline lint/typecheck/test:coverage/build pass (T-CLEAN-01, T-DOC-05).
14. Clean-environment verification pass (T-CLEAN-01).
15. Không còn blocking issue nào chưa được ghi nhận tài liệu.
16. Không có C2 scope expansion nào bị lặng lẽ đưa vào M10 (Mục 19).
17. Sprint 3 có thể chính thức đánh dấu CLOSED.

## 22. Definition of Done

> Repo đã được review đối chiếu với implementation thật, toàn bộ Sprint 3 Exit Criteria có evidence, documentation phản ánh đúng thực tế, OpenAPI và database contract đã verify, licensing compliance đã audit dưới chiến lược AGPL/open-source đã RESOLVED (bao gồm xử lý dứt điểm mâu thuẫn G-11), Known Gaps được ghi nhận tường minh, clean-environment verification thành công, và Sprint sẵn sàng đóng chính thức.

**Phân biệt bắt buộc, không được nhầm lẫn:**

- **Sprint Closure** = phạm vi kỹ thuật Sprint 3 đã hoàn chỉnh (code, test, docs nội bộ đã đối chiếu, Known Gaps đã ghi nhận).
- **Production Go-Live** = có thể vẫn cần thực thi hành động đã xác định riêng (ví dụ: publish mã nguồn theo phạm vi đã xác định ở T-LIC-03; giải quyết G-05/G-06 rate limiting/idempotency; giải quyết G-01/G-02 nếu UI/API thật cần dùng).

Sprint 3 có thể CLOSED mà chưa go-live public — đây là trạng thái hợp lệ, không phải mâu thuẫn.

## 23. Risk Management

| Rủi ro | Xác suất | Impact | Biện pháp giảm thiểu |
|---|---|---|---|
| Môi trường M10 thật vẫn bị chặn `binaries.prisma.sh` như sandbox review trước, khiến T-DB-02/T-CLEAN-01 không chạy được | Trung bình | Cao (không thể PASS Exit Criterion #5, #13, #14 thật) | Chạy M10 trên máy có network đầy đủ (không phải sandbox review), hoặc dùng `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` chỉ để verify cục bộ, ghi rõ đây là workaround không phải trạng thái CI thật |
| Mâu thuẫn G-11 (AGPL/GPL-3.0/Proprietary) không được người có thẩm quyền dự án xác nhận kịp thời | Trung bình | Cao — blocking Exit Criterion #8 | Escalate ngay khi bắt đầu M10, không để tới cuối milestone mới phát hiện (đã phát hiện từ Pre-Plan Audit, nêu ngay) |
| G-07 (CI thật chưa từng chạy xanh end-to-end) tiếp tục bị hoãn "để sau" | Trung bình | Cao | Bắt buộc trigger CI thật ít nhất 1 lần trong phạm vi T-CLEAN-01/T-EXIT-01, không chấp nhận suy luận từ workflow YAML tĩnh |
| Task audit phát hiện gap C2 thật (ví dụ cần redesign `birthProfileLabel`) và có áp lực "tiện thể sửa luôn" | Thấp-Trung bình | Cao nếu xảy ra (biến M10 thành M11 trá hình) | Áp dụng cứng Mục 19 — mọi C2 dừng lại thành Known Gap, không ngoại lệ |
| Sửa Database Design Spec §5.7 (T-DB-01) bị hiểu nhầm là "mở lại" toàn bộ Schema Decision M5 | Thấp | Trung bình | Ghi rõ trong D3 rằng đây chỉ là đồng bộ hóa tài liệu theo quyết định đã Confirmed ở M5, không phải quyết định mới |

## 24. Rollback / Recovery Strategy

- Mọi thay đổi C0 (doc-only) và C1 (nhỏ) trong M10 thực hiện trên nhánh riêng (ví dụ `sprint3/m10-closure`), không commit thẳng vào `dev`.
- T-DOC-03 (thử nghiệm import trái phép để verify ESLint) **bắt buộc revert ngay trong cùng session**, không được để lẫn vào commit thật — nếu vô tình commit nhầm, `git revert` ngay lập tức trước khi tiếp tục.
- Nếu T-LIC-02 phát hiện licensing thật sự cần thay đổi lớn hơn dự kiến (ví dụ phải gỡ bỏ `swisseph-wasm` hoàn toàn) — đây tự động trở thành C2, dừng M10, escalate thành quyết định Sprint riêng, không rollback "âm thầm" mà phải ghi nhận công khai trong Final Review Report.
- Nếu Clean Environment Verification (T-CLEAN-01) fail ở bước nào, không "sửa cho qua" ngay tại chỗ — ghi nhận FAIL trước, phân tích nguyên nhân (môi trường vs code thật), rồi mới quyết định corrective action theo đúng phân loại Mục 19.

## 25. Final Sprint Closure Procedure

1. Hoàn thành toàn bộ Task Mục 8 theo đúng dependency ở Mục 9.
2. Biên soạn Final Review Report (T-CLOSE-01) theo đúng cấu trúc Mục 14 của prompt gốc (Executive Summary, Specification Compliance, Architecture Compliance, API Compliance, Database Compliance, Testing Verification, Licensing Compliance, Known Gaps, Exit Criteria, Final Recommendation).
3. Đưa ra Final Recommendation — chỉ 1 trong 3 giá trị, có căn cứ trực tiếp từ T-EXIT-01:
   - **READY TO CLOSE** — chỉ khi toàn bộ 13 Exit Criterion PASS thật, không còn UNVERIFIED nào chưa có kế hoạch, và G-11 đã resolve.
   - **READY TO CLOSE WITH NON-BLOCKING GAPS** — nếu mọi Exit Criterion blocking đã PASS, nhưng vẫn còn gap non-blocking đã ghi nhận rõ (G-01, G-02, G-03, G-05, G-06, G-08, G-13, G-14).
   - **NOT READY TO CLOSE** — nếu bất kỳ Exit Criterion blocking nào (đặc biệt #8 do G-11, hoặc #3/#4/#5/#9 nếu môi trường không verify được) còn FAIL/UNVERIFIED không có kế hoạch cụ thể.
4. Không được dùng "READY TO CLOSE" nếu G-11 (licensing) chưa có xác nhận từ người có thẩm quyền dự án — đây là điều kiện cứng, không thương lượng.
5. Sau khi có Final Recommendation, cập nhật CHANGELOG (T-CHANGE-01) và version (T-VER-01), merge nhánh `sprint3/m10-closure` vào `dev`, gắn tag `v0.3.0-sprint3` (theo đúng tiền lệ `v0.2.0-sprint2` đã đề xuất ở Sprint 2 M10).
6. Ghi nhận rõ trong Final Review Report: Sprint 3 CLOSED (nếu đạt) **không đồng nghĩa** Production Go-Live đã sẵn sàng — liệt kê rõ các hành động còn lại trước go-live (G-05, G-06, T-LIC-03 thực thi publish nếu cần, G-01/G-02 nếu UI thật cần).

---

*Hết Implementation Plan. Tài liệu này không mở lại bất kỳ quyết định domain/integration/licensing A-vs-B nào đã Confirmed — toàn bộ nội dung là kế hoạch **audit và đóng gói bằng chứng** cho Sprint 3, dựa trên Pre-Plan Repository Audit thật thực hiện ngày 2026-09-13 (clone `dev`, HEAD `81e0f95`). Phát hiện quan trọng nhất cần xử lý ngay đầu M10 thật: (1) mâu thuẫn AGPL/GPL-3.0-or-later/Proprietary (G-11, T-LIC-02) — blocking, cần xác nhận từ chủ dự án; (2) CI thật chưa từng verify chạy xanh end-to-end với network đầy đủ (G-07) — cần trigger thật, không suy luận từ YAML tĩnh; (3) `backend/README.md` stale nghiêm trọng, mô tả Sprint 3 là "sắp tới" dù đã code xong (G-12). Prompt gốc tạo M10 này tự nó cũng lặp lại 1 lỗi đã từng được đính chính trong Sprint 3 Plan (liệt kê "CommonJS" trong stack, trong khi dự án dùng ESM thật) — đã giữ nguyên sự thật đã xác nhận trước đó (ESM) trong toàn bộ Plan này, không lặng lẽ theo prompt sai.*
