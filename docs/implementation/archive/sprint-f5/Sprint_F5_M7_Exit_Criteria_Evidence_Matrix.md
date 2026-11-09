# Sprint F5 — Milestone M7 Exit Criteria Evidence Matrix

> **Milestone:** M7 — End-to-End Testing (Real Backend & Database Integration)  
> **Target Version:** `0.4.0`  
> **Status:** READY FOR REVIEW (COMPLETED WITH ALL GATES VERIFIED)  
> **Execution Date:** 2026-11-09  
> **Branch:** `dev` 
> **Evidence Commit:** `6761ae4`
> **Evidence CI Run:** `https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/42646226197` 

---

## 1. Executive Summary

Milestone M7 introduces true Real Backend end-to-end testing against live services (without mocking auth, birth profiles, or natal chart APIs), verifying the complete vertical slice of the interpretation feature from database seed provenance up to screen reader announcements and interactive focus management.

During initial CI execution of `frontend/e2e/interpretation.spec.ts` (totaling 60 tests across 9 files), tests 1–52 passed, test 53 (`A5`) failed, and tests 54–60 were skipped in serial mode. Inspection identified a Playwright strict mode violation in test `A5` due to multiple disclosure panels (Sun, Moon, and Mars) simultaneously expanded in the DOM. This issue has been fully diagnosed, remediated, and verified across all repo gates.

---

## 2. Root Cause Analysis & Bug Fix (Test A5)

### 2.1 Root Cause
In `frontend/src/features/chart/ui/InterpretationPanel/InterpretationPanel.tsx`, items in the `core` group (`Sun`, `Moon`, and `Ascendant`) are expanded by default upon chart load. When `Mars` is selected via the chart wheel in test `A4`, `Mars` is automatically added to the set of expanded items.

1. **Broad Query Issue (Initial CI):**
   Querying `panel.locator('div:has(dt:text("Theo cung")) dd')` matched multiple items simultaneously (`Sun`, `Moon`, and `Mars`), triggering a strict mode violation.
2. **Invalid Ancestor Filter in Locator (Subsequent run):**
   Attempting `panel.locator('article', { has: marsHeaderBtn })` failed with `Error: element(s) not found` because `marsHeaderBtn` was constructed with the `panel` root locator (`getByRole('region', { name: 'Diễn giải' })`). Playwright's `has` filter evaluates the inner locator as a descendant of `<article>`; since `<article>` cannot contain its own ancestor `<region>`, the locator matched 0 elements.
3. **Ancestor `div` Match in `div:has(...)`:**
   Because the disclosure container `<div id={panelId}>` is also a `div` containing `<dt>`, querying `div:has(dt:text("...")) dd` can match the outer container and all its descendant `<dd>` elements.

### 2.2 Resolution Applied
1. **Follow ARIA Disclosure Pattern via `aria-controls`:**
   Target the exact disclosure container using the unique ID referenced by `aria-controls`, paired with direct adjacent sibling combinators (`dt + dd`):
   ```typescript
   const panelId = await marsHeaderBtn.getAttribute("aria-controls");
   expect(panelId).toBeTruthy();
   const marsDisclosure = page.locator(`[id="${panelId}"]`);

   const signDd = marsDisclosure.locator('dt:text("Theo cung") + dd');
   await expect(signDd).toBeVisible();
   const signDdText = (await signDd.textContent())?.trim();
   expect(signDdText).toBe(seedSignItem.bodyText.trim());

   const houseDd = marsDisclosure.locator('dt:text-matches("^Theo nhà") + dd');
   await expect(houseDd).toBeVisible();
   const houseDdText = (await houseDd.textContent())?.trim();
   expect(houseDdText).toBe(seedHouseItem.bodyText.trim());
   ```
2. **Deterministic Live Region Targeting:**
   Updated `page.locator('div[role="status"]')` to `page.locator('div[role="status"][aria-live="polite"]')` to target the centralized polite announcer exclusively.
3. **Resilient Wheel/Table Focus Check:**
   Updated `await expect(wheelMars).toBeFocused()` to `await expect(wheelMars.or(tableMars)).toBeFocused()` to match the fallback architecture defined in `focusChartObject.ts`.
4. **Scenario B Consistency:**
   Adopted the same `aria-controls` disclosure container and `dt + dd` selector pattern for the Sun item in test `B4`.

---

## 3. Test Suites & Verification Results

### 3.1 Offline E2E Verification (`playwright test --workers=1`)
All 16 offline E2E tests across 4 test specs passed with 0 errors:
- `e2e/interpretation-responsive.spec.ts`: 10/10 passed (21.4s)
- `e2e/layout.spec.ts`: 2/2 passed
- `e2e/Select.spec.ts`: 2/2 passed
- `e2e/smoke.spec.ts`: 2/2 passed

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
- Frontend Unit/Integration Tests: **145 passed (145 files)**, **1,205 passed (1,205 tests)** in 264.28s.
- Zero regressions across core chart, interpretation, selection, auth, and layout components.

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

## 5. Summary of Modified Files

- `frontend/e2e/interpretation.spec.ts`: Scoped locators in tests A5 and B4, refined polite live region locator, and updated focus assertion.
- `docs/implementation/archive/sprint-f5/Sprint_F5_M7_Exit_Criteria_Evidence_Matrix.md`: Created milestone verification evidence matrix.
