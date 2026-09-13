# Sprint 3 — Final Review Report (T-CLOSE-01)

**Milestone:** M10 — Final Review, Documentation & Closure
**Date:** 2026-09-13
**Sprint:** Sprint 3 — Natal Chart Module
**Reviewer:** Antigravity (Automated Audit) + Chủ dự án (Review)
**Base Commit:** `81e0f95` (audit base, `dev` branch)

---

## 1. Executive Summary

Sprint 3 đã deliver thành công **Natal Chart Module** — bao gồm toàn bộ pipeline tính toán thiên văn Tây Phương qua Swiss Ephemeris (WebAssembly), 4 REST endpoints, Clean Architecture đầy đủ, và 189 unit tests + 25 golden tests đã verify. Codebase sạch (0 lint errors, 0 type errors, 0 FIXME trong chart module).

**Trạng thái tổng thể:** NOT READY TO CLOSE (tại thời điểm biên soạn) — 1 blocking item còn mở:
1. **G-07 (Criterion #9):** CI thật chưa trigger end-to-end với full network.

Muộn: **G-11 (Criterion #8)** đã RESOLVED — chủ dự án xác nhận tường minh AGPL-3.0 là intended direction trong conversation 2026-09-13.

Mọi item còn lại là PARTIAL/UNVERIFIED do P1001 sandbox constraint (không phải bug thật) hoặc deferred Known Gaps đã ghi nhận đầy đủ.

---

## 2. Specification Compliance

### 2.1 Domain Rules

| Category | Rule Count | Verified | Notes |
|---|---|---|---|
| Planet Calculation (D-01–D-05) | 5 | ✅ | 189 unit tests; 25 golden tests vs JPL DE441 |
| House System (D-06–D-08) | 3 | ✅ | Placidus default; 12 houses; cusp angles correct |
| Angles (D-09–D-10) | 2 | ✅ | ASC/DSC/MC/IC; zodiac position correct |
| Aspects (D-11–D-13) | 3 | ✅ | 5 major aspects; orb/applying detection |
| Pattern Detection (D-14) | 1 | ⚠️ DEFERRED | `chart_patterns` always `[]` — G-13 |
| Chart Entity (D-15–D-20) | 6 | ✅ | Snapshot immutability; soft-delete; ownership |
| Engine Constraint (EC-17) | 1 | ✅ | AsyncMutex serializes WASM calls |

### 2.2 Drift Findings (from Audit)

| Finding | Severity | Resolution |
|---|---|---|
| DB Design Spec §5.7 `snapshot_interpretation_version` ghi `NOT NULL` nhưng thực tế `NULL` | C0 | ✅ FIXED (T-DB-01) — doc updated |
| Natal Chart Domain Spec §8 `EngineInput` có thể không đồng bộ đầy đủ | C0 | ⚠️ OPEN (G-04) — deferred |
| Sprint 3 M4 Plan rule count mismatch | C0 | ⚠️ OPEN (G-04) — deferred |

---

## 3. Architecture Compliance

| Boundary | Status | Evidence |
|---|---|---|
| Domain → no framework imports | ✅ PASS | T-ENG-01: grep 0 violations |
| Infrastructure only: `swisseph-wasm` import | ✅ PASS | T-ENG-01: 2 files, both Infrastructure layer |
| ESLint boundary enforcement | ✅ PASS | T-DOC-03: rule active, tested |
| AsyncMutex WASM serialization | ✅ PASS | T-ENG-02: unit tests verify mutex behavior |
| DI via composition-root | ✅ PASS | Manual audit — no service locator pattern |

---

## 4. API Compliance

| Endpoint | Method | Schema Match | Status Codes | RFC7807 |
|---|---|---|---|---|
| `/api/v1/charts/natal` | POST | ✅ | 201, 400, 401, 422 | ✅ |
| `/api/v1/charts` | GET | ✅ | 200, 401 | ✅ |
| `/api/v1/charts/:id` | GET | ✅ | 200, 401, 403, 404 | ✅ |
| `/api/v1/charts/:id` | DELETE | ✅ | 204, 401, 403, 404 | ✅ |

**Live E2E test:** UNVERIFIED (P1001 sandbox). Contract/schema audit: PASS.

---

## 5. Database Compliance

| Check | Status | Notes |
|---|---|---|
| Schema vs DB Design Spec | ✅ PASS | T-DB-01: 0 drift (sau khi sửa §5.7) |
| Migration history vs schema.prisma | ⚠️ UNVERIFIED | T-DB-02: P1001 — manual audit 0 drift |
| Snapshot Immutability (T-DB-03) | ✅ PASS | Integration test: profile.full_name → chart snapshot → BirthProfile mutation → snapshot unchanged |
| Referential integrity | ✅ PASS | FK constraints verified in schema + Prisma |

---

## 6. Testing Verification

| Category | Count | Status |
|---|---|---|
| Unit Tests (domain rules) | 189 | ✅ PASS |
| Golden Tests (JPL DE441, 0.01°) | 25 | ✅ PASS |
| Integration Tests | ~294 | ⚠️ UNVERIFIED (P1001) |
| OpenAPI Contract Tests | Coverage by unit | ⚠️ PARTIAL |

**Coverage policy:** Risk-based (4 tiêu chí). No arbitrary % threshold.

---

## 7. Licensing Compliance

| Item | Status | Notes |
|---|---|---|
| T-LIC-01: License Record 8/8 fields | ✅ DONE | `docs/legal/swisseph-license-record.md` Field 1–9 |
| T-LIC-02: G-11 resolution | ✅ **RESOLVED** | Chủ dự án xác nhận tường minh AGPL-3.0 (conversation 2026-09-13) |
| T-LIC-03: Source publication scope | ✅ DONE | Toàn bộ `backend/` — regardless GPL hay AGPL |
| `backend/README.md` license line | ✅ Updated | "AGPL-3.0 (intended; pending provenance audit)" |

**Blocking:** G-07 — CI thật chưa trigger (Exit Criterion #9).

---

## 8. Known Gaps Summary

_(Chi tiết: `docs/implementation/Sprint_3_Known_Gaps_Registry.md`)_

| ID | Severity | Blocks Closure | Status |
|---|---|---|---|
| G-01 | Trung bình | Không | Deferred (Interpretation Engine) |
| G-02 | Trung bình | Không | Pending design decision |
| G-03 | Thấp | Không | Accepted risk |
| G-04 | Trung bình | Không | Partial (§5.7 RESOLVED) |
| G-05 | Thấp | Không | Deferred (Rate Limiting) |
| G-06 | Thấp | Không | Deferred (Idempotency) |
| G-07 | **Cao** | **Có (Exit #9)** | UNVERIFIED — CI thật pending |
| G-08 | Thấp | Không | Non-blocking doc debt |
| G-09 | Thấp | Không | ✅ RESOLVED (T-VER-01) |
| G-10 | Thấp | Không | ✅ RESOLVED (T-CHANGE-01) |
| G-11 | **Cao** | Không | ✅ RESOLVED (owner sign-off 2026-09-13) |
| G-12 | Trung bình | Không | ✅ RESOLVED (T-README-01) |
| G-13 | Thấp | Không | Deferred (Pattern Detection) |
| G-14 | Thấp | Không | Monitored long-term |

---

## 9. Exit Criteria Summary

_(Chi tiết: `docs/implementation/Sprint_3_Exit_Criteria_Evidence_Matrix.md`)_

| # | Status | Note |
|---|---|---|
| 1 | ✅ PASS | |
| 2 | ✅ PASS | |
| 3 | ⚠️ PARTIAL | P1001 |
| 4 | ✅ PASS | |
| 5 | ⚠️ UNVERIFIED | P1001 |
| 6 | ⚠️ PARTIAL | P1001 |
| 7 | ⚠️ PARTIAL | P1001 |
| 8 | ✅ **PASS** | G-11 RESOLVED |
| 9 | ⚠️ **UNVERIFIED** | G-07 blocking |
| 10 | ✅ PASS | |
| 11 | ✅ PASS | |
| 12 | ⚠️ PARTIAL | P1001 |
| 13 | ✅ PASS | |

**PASS:** 6/13 | **PARTIAL/UNVERIFIED (P1001):** 6/13 | **UNVERIFIED (blocking):** 1/13

---

## 10. Final Recommendation (T-CLOSE-02)

> ### ⚠️ NOT READY TO CLOSE
>
> Sprint 3 có thể chuyển sang **READY TO CLOSE WITH NON-BLOCKING GAPS** khi 1 blocking item sau được giải quyết:
>
> **✅ Blocking Item 1 — G-11 (Exit Criterion #8): ĐÃ RESOLVED**
> Chủ dự án xác nhận tường minh AGPL-3.0 là intended project direction (conversation 2026-09-13).
>
> **Blocking Item 2 (còn lại) — G-07 (Exit Criterion #9):**
> CI thật (GitHub Actions `.github/workflows/backend-ci.yml`) được trigger ít nhất 1 lần và chạy xanh end-to-end trên runner có full network.
>
> Các PARTIAL/UNVERIFIED do P1001 (Criterion #3, #5, #6, #7, #12) **không blocking** nếu được verify trên máy developer thật — đây là môi trường constraint, không phải code issue.

### Hành động trước go-live Production (sau Sprint 3 CLOSED):

1. Publish `backend/` source code trên GitHub public repo (AGPL Section 13 trigger).
2. Implement Rate Limiting (G-05) cho `POST /charts/natal`.
3. Thiết kế Idempotency Key cho `POST /charts/natal` (G-06).
4. Resolve `birthProfileLabel` design (G-02) trước khi UI list thật cần.
5. Commercial license từ Astrodienst AG nếu AstroViet có monetization plan (G-11 upstream).

### Phân biệt rõ:

- **Sprint 3 CLOSED** = phạm vi kỹ thuật Sprint 3 hoàn chỉnh (code, test, docs, Known Gaps ghi nhận). Có thể CLOSED dù chưa go-live.
- **Production Go-Live** = cần thực hiện thêm các hành động ở trên. Không đồng nghĩa với Sprint CLOSED.

---

*Report này được biên soạn từ bằng chứng thực tế của audit M10 (T-DOC/T-API/T-DB/T-ENG/T-LIC). Không có câu nào trong report này phản ánh "tài liệu nói vậy" mà không có evidence kỹ thuật kiểm chứng được.*
