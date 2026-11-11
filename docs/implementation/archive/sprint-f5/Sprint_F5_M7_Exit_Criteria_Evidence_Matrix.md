# Sprint F5 — Milestone M7 Exit Criteria Evidence Matrix

> **Milestone:** M7 — End-to-End Testing (Real Backend & Database Integration)  
> **Target Version:** `0.4.0`  
> **Status:** READY FOR REVIEW (ALL AUTOMATED GATES VERIFIED — REAL BACKEND VERIFIED ON CI)  
> **Execution Date:** 2026-11-09 / 2026-11-10  
> **Branch:** `dev`  
> **Evidence Commits:** Baseline `1e9f4c2`, Scenarios A/B `e4a6401` / `9700488`, Fixes `ea74b3c`  
> **CI Runs:**  
> - Initial Red Run (A5 Playwright strict mode failure): `https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/42590096850`  
> - B5 Heading Assertion Red Run (58 passed, 1 failed, 1 did not run): `https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/42615773763`  
> - Target Green Evidence Run: `https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/42739936570`

---

## 1. Acceptance Criteria Mapping (AC-28 & AC-29)

| Acceptance Criteria | Description | Verification Method | Status | Evidence Reference |
|---|---|---|---|---|
| **AC-28** | Real Backend Natal Chart Interpretation Journey (Scenario A: Mars with Real Seed Provenance) | Automated E2E test `interpretation.spec.ts` (A1..A6) on CI with live PostgreSQL + Node.js/Express backend + Seed pipeline | **VERIFIED (CI)** | - Test A1..A6 PASS in serial mode<br>- Step Summary line: `Scenario A (A3)`<br>- Total tests on CI runner: 60 passed |
| **AC-29** | Real Backend Degraded State Journey (Scenario B: Unknown Birth Time) + 38 F4 & 10 M6 Regression | Automated E2E test `interpretation.spec.ts` (B1..B6) on CI + full regression suite (38 F4 tests across 7 files + 10 M6 responsive tests) | **VERIFIED (CI for Real Backend; Local for 16 offline tests)** | - Test B1..B6 PASS in serial mode<br>- Step Summary line: `Scenario B (B3)`<br>- 16 offline tests (10 M6 responsive + 6 F4) verified locally with `workers: 1`<br>- 32 F4 Real Backend tests + 12 M7 tests verified on CI runner (60 passed total) |

### 1.1 GitHub Step Summary Evidence (from CI Execution)

```markdown
- **Scenario A (A3):** interpretationVersion=1.0, count=21 (PlanetInSign=10, PlanetInHouse=10, AngleInSign=1), seedMatch=true, marsSignKey=Mars_in_Leo, marsHouseKey=Mars_in_House_10
- **Scenario B (B3):** interpretationVersion=1.0, count=10 (PlanetInSign=10, degraded/no-birth-time), seedMatch=true
```

### 1.2 Playwright Test Execution Summary (CI Final Run)

```text
Nguồn: GitHub Actions CI runner (`Run E2E Tests` step với workers: 1)
Running 60 tests using 1 worker
...
  60 passed (1.4m)
```

Ghi chú phân bổ test suite:
- **12 tests M7** (`interpretation.spec.ts`): Scenario A (A1..A6) và Scenario B (B1..B6) chạy tuần tự với live Backend & Postgres.
- **38 tests F4** (across 7 files): 32 tests Real Backend + 6 tests offline.
- **10 tests M6** (`interpretation-responsive.spec.ts`): Offline tests với `page.route` mock.

---

## 2. Technical Audit & Refinements (Task M7.1 – M7.4)

### 2.1 Test A5 Locator Refinement (A5 Strict Mode Violation)
In `frontend/src/features/chart/ui/InterpretationPanel/InterpretationPanel.tsx`, items in the `core` group (`Sun`, `Moon`, and `Ascendant`) are expanded by default upon chart load. When `Mars` is selected via the chart wheel in test `A4`, `Mars` is automatically added to the set of expanded items.
- **Issue:** Querying `panel.locator('div:has(dt:text("Theo cung")) dd')` matched multiple items simultaneously (`Sun`, `Moon`, and `Mars`), triggering a strict mode violation.
- **Resolution:** Targeted the exact disclosure container using the unique ID referenced by `aria-controls` (`page.locator('[id="${panelId}"]')`), paired with direct adjacent combinators (`dt:text("Theo cung") + dd`).

### 2.2 Live Region & Focused Element Checks
1. **Deterministic Live Region Targeting:**
   Updated `page.locator('div[role="status"]')` to `page.locator('div[role="status"][aria-live="polite"]')` to target the centralized polite announcer exclusively.
2. **Focused Element Check on Wheel (Mars Selection):**
   Updated to `await expect(wheelMars).toBeFocused()`. In Playwright, `expect(locator).toBeFocused()` enforces strict mode; targeting `wheelMars` directly guarantees an exact 1-to-1 match without ambiguity (Mã thực tế chặt chẽ, không dùng `.or(tableMars)`).
3. **Scroll & Focus Stability Assertion (A4):**
   Added assertions verifying `window.scrollY` remains stable (drift ≤ 5px) and focus stays on `wheelMars` upon wheel selection, conforming to Mục 8.2 bước 4 của plan.
4. **Post-Reload Text Seed Assertion (A6):**
   Added full text comparison with `seedSignItem.bodyText` and `seedHouseItem.bodyText` after `page.reload()` to verify cache persistence over `GET /api/v1/charts/:id`.

### 2.3 Scenario B Degraded State Hardening (B4 & B5)
1. **Ascendant Identification via Stable Identifier (B4):**
   Conformed Ascendant check to use `[id="angle:Ascendant"]` on `<article>`, verifying presence and absence of "Xem trên biểu đồ" button without depending on copy text. Added `id={id}` to `<article>` in `InterpretationItem.tsx`.
2. **Comprehensive DOM Seed Check for All 10 Planets (B4):**
   Enhanced B4 to loop over all 10 planets in `chartResponseJsonB.planets`, asserting that every `[id="planet:<Name>"]` card in the DOM contains "Theo cung" text matching `seedMap` exactly via `textContent()`.
3. **Degraded State Table Assertion Alignment (B5):**
   Aligned house table absence check with F4 reference benchmark (`chart.spec.ts:686-688`). Replaced `not.toBeVisible()` with `toHaveCount(0)` on both `columnheader "Nhà"` and `columnheader "Cusp (độ)"`.

---

## 3. Test Suites & Verification Results

### 3.1 Offline E2E Verification (`playwright test --workers=1`)
All 16 offline E2E tests across 4 test specs passed with 0 errors:
- `e2e/interpretation-responsive.spec.ts`: 10/10 passed (21.4s)
- `e2e/layout.spec.ts`: 2/2 passed
- `e2e/Select.spec.ts`: 2/2 passed
- `e2e/smoke.spec.ts`: 2/2 passed

*Ghi chú:* Các file ảnh bằng chứng M6 (`m6_r01_320.png`, `m6_r05_768.png`, `m6_r07_1280.png`, `m6_r08_1500.png`) và cây trợ năng `m6_s_accessibility_tree.json` được chụp/ghi lại sau khi áp dụng quyết định **D-M7-01** (thay `waitForTimeout(300)` bằng `waitForFunction` + `requestAnimationFrame`).

### 3.2 Real Backend Interpretation Test List (`e2e/interpretation.spec.ts`)
Total: 12 tests in 1 file (serial execution):
1. `A1: Register and login isolated user`
2. `A2: Create birth profile with known birth time`
3. `A3: Calculate natal chart and intercept Real Backend contract with seed provenance`
4. `A4: Select Mars on wheel, verify selection sync with Planet Table and live region`
5. `A5: Verify Mars disclosure, text matching seed, 'Đọc diễn giải', 'Xem trên biểu đồ', and Escape recovery`
6. `A6: Page reload persistence on GET /charts/:id and clean error observers`
7. `B1: Register and login as new isolated user`
8. `B2: Create birth profile with unknown birth time and probe request`
9. `B3: Calculate chart and verify degraded Real Backend response with seed provenance`
10. `B4: Verify degraded Interpretation Panel UI, no House sections, and neutral notice`
11. `B5: Verify F4 degraded state interoperability and clean UI state`
12. `B6: Verify 0 unhandled errors throughout Scenario B`

### 3.3 Vitest Unit & Integration Suites
- Frontend Unit/Integration Tests: **145 test files**, **1,205 tests total**.
- Interpretation Component & Model Tests: **8 test files, 76 passed (100%)**.
- Zero regressions across core chart, interpretation, selection, auth, and layout components.
- **KG-F5M6-01 (Flake router.test.tsx):** Tiếp tục giữ trạng thái **OPEN** để theo dõi thống kê dài hạn trên các lần chạy CI tiếp theo.

---

## 4. Quality Gates Checklist

| Gate | Requirement | Status | Evidence / Note |
|---|---|---|---|
| **Zero Diff Gate** | Core model files (`selection.ts`, `interpretation.ts`) have 0 diff against `3711587` | **PASS** | `git diff 3711587 -- ...` output is empty. |
| **Real Backend Gate** | No mocks for `/api/v1/auth`, `/api/v1/charts`, `/api/v1/birth-profiles` in `interpretation.spec.ts` | **PASS** | Only 2 instances of `page.route` targeting `/api/v1/locations/search` (GeoNames external API, permitted under D-M7-04). |
| **Anti-pattern Gate** | 0 `waitForTimeout`, 0 `test.skip`, 0 `test.only`, 0 `test.fixme`, 0 `test.fail` | **PASS** | `git grep -nE "waitForTimeout|..." frontend/e2e` returned 0 matches. |
| **Code Style Gate** | `prettier --check` passes cleanly across the entire frontend | **PASS** | `npm run format:check` returned code 0 ("All matched files use Prettier code style!"). |
| **Linting Gate** | `eslint .` passes with 0 warnings and 0 errors | **PASS** | `npm run lint` returned code 0. |
| **Typecheck Gate** | `tsc --noEmit` on app and node tsconfigs passes | **PASS** | `npm run typecheck` returned code 0. |

---

## 5. Summary of Modified Files in Milestone M7

| File Path | Type | Description |
|---|---|---|
| `frontend/package.json` | Modified | Version bumped to `0.4.0` under approved decision D-F5-08. |
| `frontend/package-lock.json` | Modified | Lockfile synchronized with `frontend@0.4.0`. |
| `frontend/CHANGELOG.md` | Modified | Added release notes for `0.4.0` with known limitations (KG-F5-01, Narrator audio, scope). |
| `frontend/e2e/interpretation-responsive.spec.ts` | Modified | Resolved D-M7-01: replaced `waitForTimeout(300)` with deterministic `waitForFunction`. |
| `frontend/e2e/interpretation.spec.ts` | Created | Added 12 Real Backend E2E tests for Scenario A and Scenario B with seed provenance verification. |
| `frontend/src/features/chart/ui/InterpretationPanel/InterpretationItem.tsx` | Modified | Added `id={id}` to `<article>` to support stable UI hooks (`[id="angle:Ascendant"]`, `[id="planet:<Name>"]`). |
| `frontend/src/features/chart/ui/InterpretationPanel/InterpretationItem.test.tsx` | Modified | Added 1 assertion in IT-01 verifying article id attribute (`id="planet:Sun"`). |
| `docs/implementation/archive/sprint-f5/Sprint_F5_M7_Exit_Criteria_Evidence_Matrix.md` | Created | Evidence matrix capturing AC-28/AC-29, test lists, and quality gate results. |
| `docs/implementation/archive/sprint-f5/evidence/m6_r01_320.png` | Updated | Re-captured M6 responsive screenshot after D-M7-01 fix. |
| `docs/implementation/archive/sprint-f5/evidence/m6_r05_768.png` | Updated | Re-captured M6 responsive screenshot after D-M7-01 fix. |
| `docs/implementation/archive/sprint-f5/evidence/m6_r07_1280.png` | Updated | Re-captured M6 responsive screenshot after D-M7-01 fix. |
| `docs/implementation/archive/sprint-f5/evidence/m6_r08_1500.png` | Updated | Re-captured M6 responsive screenshot after D-M7-01 fix. |
| `docs/implementation/archive/sprint-f5/evidence/m6_s_accessibility_tree.json` | Updated | Re-recorded Chromium accessibility tree snapshot after D-M7-01 fix. |
| `docs/implementation/archive/sprint-f5/Sprint_F5_M6_Implementation_Plan.md` | Archived/Deleted | Removed temporary working plan file after milestone closure. |

---

## 6. Record of Key Architectural Decisions

### D-F5-08 — Version 0.4.0 (Owner Approved 2026-11-09)

| Trường | Nội dung |
|---|---|
| Trạng thái phê duyệt | **APPROVED BY OWNER (2026-11-09)** |
| Quyết định nguyên văn | Quyết định trực tiếp của Product Owner trong phiên làm việc 2026-11-09: *"D-F5-08: bump version lên 0.4.0"* |
| Tác động thực hiện | Đồng bộ version `0.4.0` tại `frontend/package.json` và `frontend/package-lock.json` qua `npm version 0.4.0 --no-git-tag-version --ignore-scripts` + cập nhật `frontend/CHANGELOG.md` |
| Trạng thái Gate | **ĐÃ GIẢI TỎA (UNBLOCKED)** |

### D-M7-01 — Deterministic Waiting (Owner Approved 2026-11-09)
- **Nội dung:** Loại bỏ hoàn toàn `waitForTimeout(300)` trong spec responsive M6, thay bằng `requestAnimationFrame` và `waitForFunction`.

### D-M7-04 — GeoNames Search Mock Boundary (Owner Approved 2026-11-09)
- **Nội dung:** Cho phép mock duy nhất endpoint ngoại vi `/api/v1/locations/search` trong spec E2E để tránh phụ thuộc mạng bên thứ ba, bảo đảm 100% API nội bộ (auth, profile, chart, interpretation) chạy qua backend thật.

### Ngoại lệ phạm vi có chủ đích (Deliberate Scope Exception: InterpretationItem.tsx)
- **Nội dung:** Bổ sung 1 dòng `id={id}` trên thẻ `<article>` trong `frontend/src/features/chart/ui/InterpretationPanel/InterpretationItem.tsx` và 1 assertion trong `frontend/src/features/chart/ui/InterpretationPanel/InterpretationItem.test.tsx`.
- **Mục đích:** Cung cấp định danh DOM ổn định (`[id="angle:Ascendant"]`, `[id="planet:<Name>"]`) theo đúng thiết kế Plan M7-8 mục 4.3 (vốn ghi nhãn [VF] giả định có sẵn từ trước) mà không gây trùng lặp ID hay ảnh hưởng tới cấu trúc HTML/CSS/A11y khác.
- **Ràng buộc M8:** Đây là ngoại lệ có chủ đích duy nhất được ghi nhận đối với gate *"git diff frontend/src rỗng"* của Milestone M8.
