# Sprint F5 — M7–M8: Real Backend E2E, Regression, Documentation & Sprint Closure — Implementation Plan

## 1. Document Metadata

| | |
|---|---|
| **Dự án** | AstroViet — Frontend Sprint F5 (Interpretation UI) |
| **Milestone** | F5.M7 (Real Backend E2E & F4 Regression) + F5.M8 (Documentation, Versioning & Sprint Closure) — thực hiện đồng thời theo quyết định của Owner |
| **Trạng thái tài liệu** | **APPROVED BY OWNER — ĐANG TRIỂN KHAI.** Task 0 (M7.0 Baseline & Entry Gate) hoàn tất; các blocking decisions D-M7-01, D-F5-08, D-M8-01/02, D-M8-05/06, D-M8-10/12 đã được Owner phê duyệt và cập nhật |
| **Repo / nhánh đã audit** | `KhongphaiHphuc0705/astroviet`, nhánh `dev`, HEAD `b6daa47` ("[docs] update m6 evidence matrix", 2026-11-08); CI #327 xanh trên `930a161` |
| **Ngày lập** | 2026-11-08 |
| **Tên & vị trí đề xuất** | `docs/implementation/Sprint_F5_M7_M8_Implementation_Plan.md` — khớp quy ước `Sprint_F5_M6_Implementation_Plan.md` (plan tạm ở `docs/implementation/`, xoá sau khi đóng milestone). **Không** dùng tên gợi ý `FE_Sprint_F5_M7_M8_…` của prompt vì không khớp quy ước repo |

**Nhãn độ tin cậy**

| Nhãn | Nghĩa |
|---|---|
| **[VF]** | Verified — đọc trực tiếp trong mã/tài liệu/CI của repo, hoặc tôi tự chạy (kèm nguồn) |
| **[AD]** | Approved decision — Owner đã ghi nhận duyệt trong tài liệu repo |
| **[REC]** | Đề xuất của plan này, **chưa** được duyệt |
| **[UNK]** | Unknown / Not Verified |
| **[PLAN]** | Hoạt động/kết quả dự kiến — chưa thực hiện, **không** phải kết quả |

> **Giới hạn của lần audit này.** Tôi không chạy được Backend + Postgres + Playwright browser trong môi trường làm việc, nên **chưa có kết quả chạy E2E nào**. Những gì tôi tự chạy: `playwright test --list`, `npm version` trên **bản sao tạm** ngoài repo, các lệnh `grep`/đọc file. Repo sạch (`git status` rỗng). Mọi lệnh E2E/CI trong plan là **"Proposed — verify before execution"** trừ khi ghi [VF].

---

## 2. Executive Summary

### 2.1 Mục tiêu
- **M7:** chứng minh Interpretation UI hoạt động với dữ liệu do **Backend thật** resolve từ seed thật (Scenario A — Mars; Scenario B — không rõ giờ sinh), và F4 không hồi quy.
- **M8:** đồng bộ tài liệu với as-built (UI Spec §12.6/§13, đính chính A-2), CHANGELOG, version **có điều kiện** (D-F5-08), Known Gaps registry, Evidence Matrix toàn sprint, báo cáo đóng F5.

### 2.2 Phát hiện quan trọng (chi tiết ở Mục 4)
| # | Phát hiện | Hệ quả |
|---|---|---|
| F1 | `e2e/interpretation-responsive.spec.ts:182` chứa `page.waitForTimeout(300)` (M6) — **trái AC-29** ("không `skip/only/waitForTimeout`") [VF grep] | Audit M7.4 sẽ fail nếu quét toàn `e2e/`; cần quyết định xử lý (D-M7-01) |
| F2 | `playwright --list` = **48 test / 8 file** [VF]. Baseline F4 = **38** (7 file: 2+3+4+8+17+2+2) + **10** của M6 (mock) | "38 E2E F4" vẫn đúng cho 7 file cũ, nhưng **tổng không còn là 38**; sau M7 = **48 + N** (N = số test của spec mới, đo bằng `--list`) |
| F3 | 10 test M6 dùng `page.route` mock cả auth + chart (fixture `e2e/fixtures/*.json`) → **không phải Real Backend** | Không được tính vào bằng chứng AC-28/29 Real Backend |
| F4 | `chart.spec.ts` đã có **Probe A/B thật** (S1.3: `interpretationVersion==="1.0"`, 21 mục, key đúng; S2.3: 10 `PlanetInSign`) và đã ghi `GITHUB_STEP_SUMMARY` [VF] — nhưng **chưa có test Real Backend nào kiểm UI Diễn giải** | Khoảng trống thật của M7 là mức **UI**, không phải mức hợp đồng API |
| F5 | CI **đã** có Postgres 16, migrate, **seed nội dung** (`prisma:seed:content`), build + chạy Backend, chạy `test:e2e`; spec mới tự được nhặt (`testDir: ./e2e`) [VF] | **Không cần đổi kiến trúc CI** |
| F6 | CI chỉ upload artifact **khi fail**; reporter chỉ `html`; `trace: off` trong CI; workflow có `paths` filter (`frontend/**`, `backend/**`) → commit chỉ-docs **không** kích hoạt CI [VF] | Bằng chứng pass = run URL + `GITHUB_STEP_SUMMARY` + log cục bộ; cần quyết định D-M7-03 |
| F7 | **D-F5-08 chưa có bằng chứng Owner duyệt trong repo**; F5 plan ghi "Conditional" và coi D-F5-01…09 là đề xuất [VF] | **Pending Owner Approval — D-F5-08**; không động version/lockfile/tag |
| F8 | A-2 = F5 plan dòng 90 vs UI Spec §12.6 (dòng 853–862) + các tham chiếu lan toả (Spec dòng 78, 689, 696, 868, 1007; Architecture Spec dòng 170, 557, 632, 721; Design System dòng 532) [VF] | Source of truth xác định được (hợp đồng thật); phạm vi sửa cần Owner chốt (D-M8-02) |
| F9 | Matrix M1–M3 **không ghi ID AC** (chỉ M2 nhắc AC-09/11); AC-01…12 không có truy vết trực tiếp [VF grep] | M8.6 phải dựng truy vết AC-01…30 từ test ID; không được ghi Pass nếu không truy ra |
| F10 | Tiền lệ đóng sprint: BE Sprint 3/4 có `Final_Review_Report`; F3 có `Known_Gaps_Registry` riêng; **F4 đóng bằng matrix M10/M11 + commit "finalize sprint f4 closure & complete gaps registry" + tag `v0.3.0`** [VF] — **không có** báo cáo đóng FE riêng | Tên/vị trí báo cáo F5 và registry F5 cần Owner chốt (D-M8-05/06) |
| F11 | Tài liệu lỗi thời: `frontend/README.md` nói E2E bị skip trong CI "do chưa có hạ tầng Backend/Postgres" (sai so với workflow); F5 plan metadata còn "Draft", dòng A-1 còn nói CI không seed; `docs/implementation/Sprint_F5_M6_Implementation_Plan.md` vẫn còn trong repo | Ghi vào M8.5/D-M8-08 |

### 2.3 Cấu trúc thực hiện kết hợp
Hai cổng: **Gate-M7** (E2E Real Backend + hồi quy + CI + anti-pattern xanh/có kết luận) → **Gate-M8** (tài liệu, Known Gaps, Matrix, báo cáo; version chỉ khi Owner duyệt). Việc soạn thảo tài liệu M8 độc lập với kết quả M7 có thể chạy song song; **tuyên bố** (status, closure) chỉ viết sau Gate-M7.

---

## 3. Project Context

- **Stack đóng băng** (React + TS + Vite + Tailwind; Express + Prisma + PostgreSQL; swisseph-wasm; Modular Monolith/Clean Architecture/DDD-lite; JWT HS256). Plan này **không** thêm dependency, service hay thay đổi kiến trúc.
- **Ranh giới:** Backend tính chiêm tinh và resolve nội dung; FE chỉ render và hình học biểu đồ; FE không tạo diễn giải. **Không** dùng fixture FE rồi gọi là Real Backend E2E.
- **Hợp đồng đã xác minh** [VF `frontend/src/features/chart/api/types.ts`, `chart.spec.ts` S1.3/S2.3]: `ChartResponse` có `isHouseDataAvailable: boolean`, `houses[]`, `angles[]`, `interpretations[]` (`subjectType`, `subjectKey`, `language`, `bodyText`, `tone?`), `interpretationVersion: string | null`. Key: `PlanetInSign` = `{Planet}_in_{Sign}`, `PlanetInHouse` = `{Planet}_in_House_{n}`, `AngleInSign` = `Ascendant_in_{Sign}`. Không có trường `source`, không có `isBirthTimeKnown` trên `ChartResponse` (nằm ở payload tạo hồ sơ).
- **Nội dung seed** [VF `backend/prisma/content/interpretations.vi.json`]: `{language:"vi", version:"1.0", status:"Published", contentSource:"Hybrid", items[252]}` = 120 `PlanetInSign` + 120 `PlanetInHouse` + 12 `AngleInSign`; **Mars có 24 mục** (12 cung + 12 nhà). Đây vẫn là nguồn hiện hành (`seed-content.ts` mặc định đọc `prisma/content/interpretations.vi.json`).

---

## 4. Current State and Repository Audit

### 4.1 Cấu trúc repo [VF]
| Hạng mục | Thực tế |
|---|---|
| Gốc | monorepo `frontend/`, `backend/`, `docs/`; **không** có `package.json` ở gốc làm việc (mỗi package có `package-lock.json` riêng); package manager **npm 10.9.9**, Node 22 trong CI |
| E2E | `frontend/e2e/` — 8 spec + `fixtures/{chartFull,chartNoHouses}.json`; `testDir: ./e2e` |
| Playwright | `frontend/playwright.config.ts`: 1 project `chromium` (Desktop Chrome), `fullyParallel`, `forbidOnly: !!CI`, `retries: CI?2:0`, `workers: CI?1:undefined`, `reporter: "html"`, `trace: CI?"off":"on-first-retry"`, `screenshot: only-on-failure`, `video: retain-on-failure`, `webServer: npm run dev` @5173 |
| CI | `.github/workflows/frontend-ci.yml` (1 job `build`, ubuntu-24.04, Postgres 16-alpine service `astroviet_e2e`) |
| Docs | `docs/implementation/` (plan tạm) + `archive/{sprint-3,sprint-4,sprint-f2,sprint-f3,sprint-f4,sprint-f5}/` (matrix, registry, evidence ảnh) |
| CHANGELOG | `frontend/CHANGELOG.md` (Keep a Changelog; mục mới nhất `[0.3.0] - 2026-10-28`; chỉ dùng `### Added`/`### Changed`; **không** có Fixed/Testing/Documentation; không có `[Unreleased]`) |
| Version | `frontend/package.json` = `0.3.0`; `frontend/package-lock.json` root `version` và `packages[""].version` = `0.3.0`; Backend `0.4.0` (độc lập); tag git `v0.3.0` → commit `cfd4247` (2026-10-30, "finalize sprint f4 closure & complete gaps registry") |
| Known Gaps | F3: `archive/sprint-f3/Sprint_F3_Known_Gaps_Registry.md`; Sprint 3/4: `…_Known_Gaps_Registry.md`; F4: trong matrix M10/M11; **F5: chưa có registry riêng** — gap rải ở bảng F5 plan §15.3 và các matrix M3–M6 |
| Evidence Matrix F5 | `archive/sprint-f5/Sprint_F5_M{1..6}_Exit_Criteria_Evidence_Matrix.md` (đã có M1–M6); ảnh ở `archive/sprint-f5/evidence/` |
| Closure template | BE: `Sprint_{3,4}_Final_Review_Report.md`; FE: không có báo cáo riêng (F4 đóng bằng matrix + commit + tag) |

### 4.2 Hạ tầng E2E & CI [VF]
| Mục | Thực tế |
|---|---|
| Số test | `CI=1 npx playwright test --list` → **48 tests / 8 files**: Select 2, auth 3, birth-profile 4, chart-list 8, chart 17, interpretation-responsive 10, layout 2, smoke 2 |
| Backend startup | CI: `npm ci` → ghi `backend/.env` → `prisma:generate` + `prisma:deploy` → **`prisma:seed:content`** → `npm run build` → `node dist/server.js` (cố ý **không** dùng `npm run start` vì ép `NODE_ENV=production` làm cookie `secure`), chờ `curl -sf http://localhost:3000/live` tối đa 30×2s |
| DB | service `postgres:16-alpine`, DB `astroviet_e2e`, user/pass `postgres`; mỗi run là DB mới (không cần teardown) |
| Biến môi trường CI | `NODE_ENV=test`, `PORT=3000`, `CORS_ORIGIN=http://localhost:5173`, `DATABASE_URL`, `LOG_LEVEL=warn`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY_MINUTES=15`, `JWT_REFRESH_EXPIRY_DAYS=30`, `GEONAMES_USERNAME=ci-e2e-placeholder`; FE: `cp .env.example .env` |
| Auth trong E2E | không có storage-state: mỗi describe tự **đăng ký + đăng nhập qua UI** với email `…-${Date.now()}@test.local` (cô lập dữ liệu) |
| Tạo dữ liệu | qua UI (Birth Profile 2 bước, "Tính lá số"); **chỉ** mock `**/api/v1/locations/search**` (dịch vụ ngoài GeoNames) |
| Mock | `chart.spec.ts`, `chart-list.spec.ts`, `birth-profile.spec.ts`: chỉ mock locations. `interpretation-responsive.spec.ts`: mock auth + chart (không Backend) |
| Artifact | upload **chỉ khi `failure()`**: `backend-log`, `playwright-report-${run_id}` (`playwright-report`, `test-results`); không có artifact khi pass; retention: mặc định của GitHub ([UNK] chưa xác minh chính sách org) |
| Retry/timeout | CI `retries: 2` (có thể che flake); không `timeout` toàn cục tuỳ chỉnh; spec M6 đặt `test.setTimeout(60000)` |
| Tag/skip | `forbidOnly` bật khi CI; grep baseline (Mục 13) chỉ có 2 hit, cả hai ở spec M6 |

### 4.3 Hợp đồng & nội dung diễn giải [VF]
- Probe thường trực đã có ở `chart.spec.ts` (M1): S1.3 xác nhận version `"1.0"`, 21 diễn giải (10 `PlanetInSign` + 1 `AngleInSign` + 10 `PlanetInHouse`), key khớp `planets[]`/`angles[]`; S2.3 (không rõ giờ sinh) xác nhận `isHouseDataAvailable=false`, `houses=[]`, `angles=[]`, 10 diễn giải đều `PlanetInSign`, version `"1.0"`.
- **Mục 8.2 của F5 plan** = "Đặc tả tương tác Mars (acceptance)" (dòng 238–246, 8 bước: chọn Mars → halo/hàng bảng đánh dấu → `SelectionDetail` + "Đọc diễn giải" → mục Sao Hỏa "Đang chọn", mở, không cuộn/không dời focus → live region F4 không đọc diễn giải → "Đọc diễn giải" focus tiêu đề mục → "Xem trên biểu đồ" → Escape). Seed **chứng minh Mars luôn có entry cho mọi cung/nhà**, nên entry Mars của một chart luôn tồn tại nếu seed đã nạp.
- Móc ổn định ở UI: wheel `data-testid="chart-wheel"` + phần tử `[data-planet="Mars"]` (`role=button`, `aria-pressed`); mục diễn giải `id="planet:Mars"`, nút disclosure `aria-expanded`/`aria-controls`, `aria-current="true"` khi được chọn; Ascendant `id="angle:Ascendant"`; Panel `section[aria-labelledby=interpretation-panel-title]`.

### 4.4 Tài liệu [VF]
- **A-2:** F5 plan dòng 90: Spec §12.6 mô tả `source: human|ai` (badge AI), `content` rich text, accordion "kỹ thuật", lỗi interpretation **tách API** ↔ hợp đồng thật: không có `source`, nội dung text thuần, diễn giải **nằm trong** `ChartResponse` (lỗi DB → cả request chart lỗi). Plan ghi: *"Hợp đồng thật thắng; sửa spec ở F5.M8 (as-built, tối thiểu)"*.
- **Spec §13** (dòng 925–945) là bảng 15 route; hàng 11 `/app/charts/:chartId` ghi "`ChartViewerShell`: Wheel + 3 Tables + Selection — Đã triển khai (F4 lõi)" — chưa phản ánh Panel Diễn giải (F5).

### 4.5 Trạng thái M1–M6 (đối chiếu repo, không dựa vào bàn giao)
| Milestone | Kỳ vọng | Bằng chứng trong repo | Ý nghĩa cho kế hoạch |
|---|---|---|---|
| M1 | Completed | Matrix M1 (commit `4b70422`, CI #41155563064): seed trong CI, Probe A/B, baseline | Tiền đề M7 — có |
| M2 | Verify | Matrix M2 (CI #41277768026): model thuần, 252 khoá | Phụ thuộc — có hồ sơ |
| M3 | Verify | Matrix M3 (kết luận nghiệm thu có Known Gaps KG-F5M3-02/04) | Phụ thuộc — có hồ sơ; KG-F5M3-04 đã đóng ở M6 |
| M4 | Completed | Matrix M4 (`PASS WITH GAPS`; KG-F5M4-01…05) | Tiền đề M7 — có |
| M5 | Completed | Matrix M5 `COMPLETED`; 18 test D5-* | Tiền đề M7 — có |
| M6 | Completed | Matrix M6 `COMPLETED WITH ACCEPTED GAPS`; CI #327 xanh trên `930a161`; token toàn cục đã hoàn tác [VF diff] | Điểm xuất phát; AC-27 `PARTIAL`; 10 E2E **mock** |
| M7, M8 | Planned | Chưa có `interpretation.spec.ts`, matrix M7/M8, registry, báo cáo | Phạm vi hiện tại |

Chưa xác minh được: nội dung PR đang mở (trang GitHub hiển thị "Pull requests 1") — [UNK]; CI cho các commit chỉ-docs (không có do `paths` filter).

---

## 5. Prerequisites and Evidence

| Điều kiện | Trạng thái | Xử lý nếu thiếu |
|---|---|---|
| M1 hoàn tất (seed CI + probe) | **Đủ** (Matrix M1 + workflow có step seed) | — |
| M4 hoàn tất | **Đủ** (`PASS WITH GAPS`) | — |
| M5 hoàn tất | **Đủ** (`COMPLETED`) | — |
| M6 làm nền | **Đủ**, có Known Gap chấp nhận | AC-27 `PARTIAL` chuyển tiếp sang Matrix M8 |
| Backend chạy được cục bộ cho phiên chạy E2E của Owner | [UNK] | Dùng Docker như CI (Mục 13); nếu không, chỉ dựa vào CI và ghi rõ |
| M1–M7 có evidence trước khi đóng M8 | Sẽ kiểm ở Gate-M8 | — |

Không có prerequisite nào được đánh dấu "Completed" mà không có hồ sơ.

---

## 6. Scope and Non-goals

**In scope:** `e2e/interpretation.spec.ts` (2 scenario Real Backend); chạy lại toàn bộ E2E; audit anti-pattern; xử lý `waitForTimeout` của M6 (nếu Owner duyệt); bằng chứng CI; UI Spec §12.6/§13 as-built + đính chính A-2; CHANGELOG; version **có điều kiện**; Known Gaps registry; Evidence Matrix M7 + M8 (AC-01…30, DoD §18); báo cáo đóng F5.

**Out of scope** (theo prompt §13, không tự thêm): interpretation type mới; thay đổi Backend/engine/hợp đồng API; tính toán chiêm tinh ở FE; nội dung góc chiếu/tổng hợp; tính năng UI mới; refactor ngoài mức cần cho E2E; thay đổi kiến trúc/state; dependency mới (kể cả `eslint-plugin-playwright`); diễn giải sinh bằng AI lúc chạy; **bump version/lockfile/tag khi chưa có Owner approval**. Phát hiện cần thay đổi ngoài phạm vi ⇒ ghi change request/blocker, không tự đưa vào.

---

## 7. M7 — Detailed Implementation Plan (Real Backend E2E & F4 Regression)

**Mapping ID task:** prompt đặt M7.1 = Scenario A, M7.2 = Scenario B, M7.3 = F4 regression, M7.4 = anti-pattern audit, M7.5 = CI. Giữ nguyên; thêm **M7.0** (cổng vào/baseline) như M5.0/M6.0 để chốt số đo "trước".

### 7.0 Quy ước thiết kế chung của spec mới (áp dụng M7.1/M7.2)
| Hạng mục | Quyết định thiết kế [REC] | Lý do |
|---|---|---|
| Vị trí | `frontend/e2e/interpretation.spec.ts` (mới) | `testDir: ./e2e`; đúng tên trong F5 plan §10/AC-28 |
| Định nghĩa "Real Backend" | **Cấm** `page.route`/mock với `**/api/v1/auth/**`, `**/charts/**`, `**/birth-profiles/**`. **Chỉ** được mock `**/api/v1/locations/search**` (dịch vụ ngoài GeoNames, đúng như `chart.spec.ts`/`chart-list.spec.ts`) và phải ghi rõ trong Matrix. Gate tự động: `grep -n "page.route" e2e/interpretation.spec.ts` chỉ cho phép đúng pattern `locations/search` | Ngăn nhầm fixture với Real Backend |
| Helper | **Sao chép** helper tối thiểu (`registerAndLogin`, `createBirthProfile`, `attachErrorObservers`) vào spec mới, như `chart-list.spec.ts` đã sao chép; **không** trích xuất `e2e/helpers.ts` | Trích xuất sẽ sửa các spec F4 đang xanh (rủi ro hồi quy, ngoài phạm vi). D-M7-02 |
| Cô lập dữ liệu | email `e2e-interp-{a\|b}-${Date.now()}@test.local`, `describe.configure({mode:"serial"})`; không cần teardown | Giống `chart.spec.ts`; DB CI là mới mỗi run |
| Chờ | chỉ auto-waiting/`expect(...)`/`waitForResponse`/`waitForURL`; cấm `waitForTimeout`, `test.skip/only/fixme`, `catch` nuốt lỗi | AC-29, Task M7.3 prompt |
| Quan sát lỗi | `page.on("pageerror")` + `page.on("response")` (≥400 trừ `/auth/refresh` 400/401 bootstrap) + `page.on("console")` bắt `"[reportError]"` (UI gọi `reportError` ⇒ `console.error`); cuối mỗi scenario assert **0** cái | Chứng minh dữ liệu Backend thật **không** sinh issue `defect` ở model |
| Ghi bằng chứng CI | `GITHUB_STEP_SUMMARY` bằng `fs.appendFileSync` (cơ chế đã dùng ở Probe A/B) | Không cần thêm artifact/CI step |
| Đọc seed | `node:fs` đọc `backend/prisma/content/interpretations.vi.json` theo đường dẫn tương đối từ `frontend/e2e` (ví dụ `new URL("../../backend/prisma/content/interpretations.vi.json", import.meta.url)` — **Proposed, verify** kiểu module của Playwright transform) | CI checkout đủ monorepo |

### 7.0.1 Chiến lược giá trị kỳ vọng (độc lập, có provenance)
| Đại lượng | Nguồn kỳ vọng | Nguồn quan sát | Ghi chú giới hạn |
|---|---|---|---|
| Version | `seed.version` từ file JSON (`"1.0"`) — **không** lấy từ response | `response.interpretationVersion` | assert `typeof === "string"`, `!== null`, `=== seed.version` |
| Entry tồn tại | `seed.items` có `{subjectType, subjectKey}` | `response.interpretations[]` | assert seed **có** entry (chống pass rỗng do đọc nhầm file) |
| Khoá Mars | `Mars_in_${planets[Mars].sign}`, `Mars_in_House_${planets[Mars].house}` — định danh ổn định từ hợp đồng (không dùng nhãn tiếng Việt, không dùng chỉ số mảng) | `response.planets[]` | **Giới hạn:** nếu Backend tính sai cung/nhà thì test không phát hiện (đúng đắn thiên văn thuộc test Backend) |
| Nội dung | `seed.items[key].bodyText` | (i) `response.interpretations[key].bodyText` (kiểm tính toàn vẹn seed→DB→API); (ii) văn bản trong DOM (kiểm API→UI) | so sánh bằng nhau sau chuẩn hoá khoảng trắng; **không** dùng response làm kỳ vọng duy nhất |
| Provenance | file seed là **cùng** file CI nạp vào DB ⇒ test chứng minh *toàn vẹn pipeline*, không chứng minh *đúng nội dung* | — | ghi rõ trong Matrix để tránh diễn giải quá |

### M7.0 — Cổng vào & baseline (S) — [HOÀN TẤT]
- **Mục tiêu:** chốt số đo "trước" và tiền đề; giải quyết D-M7-01 và ghi nhận baseline.
- **Files inspect:** `playwright.config.ts`, `.github/workflows/frontend-ci.yml`, `e2e/*.spec.ts`, `package.json`, matrix M1/M4/M5/M6.
- **Kết quả Baseline đo đạc thực tế (2026-11-09):**
  - **Commit nền:** `b6daa47` (nhánh `dev`).
  - **Playwright test suite:** 48 tests across 8 files (`auth.spec.ts`: 3, `birth-profile.spec.ts`: 4, `chart-list.spec.ts`: 8, `chart.spec.ts`: 17, `interpretation-responsive.spec.ts`: 10, `layout.spec.ts`: 2, `Select.spec.ts`: 2, `smoke.spec.ts`: 2).
  - **Sửa D-M7-01:** Đã thay thế `waitForTimeout(300)` tại `interpretation-responsive.spec.ts:182` bằng `waitForFunction` + `requestAnimationFrame`. Chạy lại 10/10 test PASS trong 19.6s.
  - **Anti-pattern audit (`waitForTimeout`, `test.skip`, `test.only`, `describe.skip`, `describe.only`, `test.fixme`, `test.fail`):** **0** kết quả trên toàn thư mục `frontend/e2e`.
  - **Swallowed errors audit (`.catch(() =>`, `catch {}`):** **0** kết quả trên toàn thư mục `frontend/e2e`.
  - **Quality Gates:** `format:check` PASS, `lint` PASS (0 errors, 0 warnings), `typecheck` PASS (exit 0).
  - **Version bumped (D-F5-08):** `0.4.0` đồng bộ ở `package.json`, `package-lock.json`, và `CHANGELOG.md`.
- **Đầu ra:** Baseline được chốt sạch sẽ, cổng Gate-M7 mở để triển khai Task 1 (M7.1 Scenario A).

### M7.1 — Scenario A: Mars với seed thật (M)
- **Mục tiêu:** AC-28 — chứng minh UI hiển thị diễn giải Mars do Backend thật resolve từ seed thật, với `interpretationVersion !== null`.
- **Scope:** Backend thật + Postgres + seed CI; tạo dữ liệu qua UI; không mock ngoài locations.
- **Files tạo:** `frontend/e2e/interpretation.spec.ts` (phần A). **Files đọc:** `chart.spec.ts` (S1.x), `types.ts`, seed JSON, `InterpretationItem.tsx`, `ChartWheel` selectors.
- **Phụ thuộc:** M7.0; M1 (seed CI), M4 (đồng bộ chọn), M5 (model sạch với dữ liệu thật).
- **Các test (serial) và bước chính:**
  1. **A1** đăng ký + đăng nhập user cô lập.
  2. **A2** tạo hồ sơ **biết giờ sinh** (`1995-10-25 08:30`, Da Nang — dữ liệu đã dùng ở S1.2, tái dùng để deterministic).
  3. **A3** "Tính lá số": chờ `POST /api/v1/charts/natal` (`waitForResponse`), parse JSON; assert: `isHouseDataAvailable === true`; **`interpretationVersion` là string, `!== null`, `=== seed.version`**; `interpretations.length > 0`; tồn tại entry `PlanetInSign` key `Mars_in_{sign}` và `PlanetInHouse` key `Mars_in_House_{house}`; `bodyText` của hai entry **bằng** seed; ghi `GITHUB_STEP_SUMMARY`.
  4. **A4** Viewer tải (`chart-viewer-shell`, h1 "Lá số sinh"); chọn Mars trên wheel bằng `[data-planet="Mars"]`; assert `aria-pressed="true"`; Planet Table: nút/hàng Mars `aria-pressed`/đánh dấu (tên accessible chính xác của nút bảng — **verify khi triển khai**); live region F4 chứa "Đã chọn" và **không** chứa văn bản diễn giải (Mục 8.2 bước 5).
  5. **A5** Mục `[id="planet:Mars"]`: `aria-current="true"`, có nhãn "Đang chọn", nút disclosure `aria-expanded="true"`; trong mục: phần "Theo cung" có văn bản **bằng** `seed[Mars_in_{sign}].bodyText`, phần "Theo nhà" bằng `seed[Mars_in_House_{house}].bodyText`; **không** tự cuộn/không dời focus (Mục 8.2 bước 4); kích hoạt "Đọc diễn giải" → focus ở nút disclosure Mars (bước 6); "Xem trên biểu đồ" → focus về Mars, selection không đổi (bước 7); Escape → hết đánh dấu, mục vẫn mở (bước 8).
  6. **A6** `page.reload()` + chờ `GET /api/v1/charts/{id}` (chứng minh đường đọc, không phụ thuộc cache seeding): `interpretationVersion` vẫn không null; UI Mars lặp lại đúng; **0** `pageerror`, **0** API ≥400 ngoài allowlist, **0** `[reportError]`.
- **Lệnh xác minh:** Mục 13 (targeted, full, CI-equivalent).
- **Đầu ra mong đợi:** A1–A6 xanh trên Backend thật; step-summary có dòng Scenario A.
- **Acceptance:** AC-28. **Evidence:** CI run URL, log `--reporter=list`, step-summary, bản ghi anti-pattern/mock-guard.
- **Rủi ro:** (a) Mars sign/house đổi theo dữ liệu Backend ⇒ không hard-code (đọc từ response); (b) tên accessible của nút bảng; (c) đường dẫn seed ESM; (d) flake do retry — đo bằng JSON stats. **Độ phức tạp:** M.

### M7.2 — Scenario B: không rõ giờ sinh / dữ liệu Nhà suy giảm (M)
- **Mục tiêu:** AC-29 (phần Scenario B) — UI Diễn giải ở trạng thái degraded hợp lệ với Backend thật.
- **Files tạo:** `frontend/e2e/interpretation.spec.ts` (phần B). **Đọc:** `chart.spec.ts` S2.x, `HouseDataNotice.tsx`, `interpretationCopy.ts`.
- **Các test (serial):**
  1. **B1** đăng ký + đăng nhập user cô lập.
  2. **B2** tạo hồ sơ **không rõ giờ sinh** bằng UI (bỏ chọn "Tôi biết rõ giờ sinh của mình"); **quan sát** (không sửa) payload `POST` hồ sơ và assert `isBirthTimeKnown === false` (đúng như S2.2).
  3. **B3** "Tính lá số": chờ POST natal; assert từ **response thật**: `isHouseDataAvailable === false`, `houses` rỗng, `angles` rỗng (hợp đồng suy giảm), `interpretationVersion` string `!== null` `=== seed.version`, **mọi** diễn giải là `PlanetInSign` (10), **không** có `PlanetInHouse`/`AngleInSign`; mỗi `PlanetInSign` key `{planet}_in_{sign}` có `bodyText` **bằng** seed. Không giả định cung Mặt Trăng; không suy luận "không rõ giờ sinh" từ `isHouseDataAvailable` (chỉ dùng payload hồ sơ đã quan sát ở B2).
  4. **B4** UI Diễn giải: Panel hiển thị (không error/alert); 10 hành tinh có "Theo cung" với văn bản đúng seed; **không** có phần "Theo nhà" nào trong Panel; chú thích Nhà trung tính hiển thị **đúng một lần** trong Panel; mục Cung Mọc kiểm bằng **định danh** `[id="angle:Ascendant"]` (tồn tại, không có nội dung diễn giải, không có nút "Xem trên biểu đồ") và bằng hợp đồng (`angles` rỗng + không `AngleInSign`) — **không** dựa vào văn bản Cung Mọc.
  5. **B5** Thành phần F4 còn hoạt động ở mức dữ liệu cho phép: wheel + Planet Table hiển thị, HouseTable vắng, `HouseDataNotice` (F4) hiển thị, chọn một hành tinh vẫn đánh dấu mục tương ứng; không `role="alert"` do dữ liệu degraded hợp lệ.
  6. **B6** 0 `pageerror`, 0 API ≥400 ngoài allowlist, 0 `[reportError]`; ghi step-summary.
- **Acceptance:** AC-29 (Scenario B). **Evidence:** như M7.1.
- **Blocker rule:** nếu Backend không tạo được chart không-giờ-sinh theo hợp đồng hiện tại ⇒ **dừng, ghi blocker kèm bằng chứng** (response, log), **không** thay bằng mock. (Bằng chứng hiện có cho thấy S2.3 đã tạo được ⇒ rủi ro thấp.)
- **Rủi ro:** cùng M7.1; thêm: `HouseDataNotice` (F4) và chú thích Panel cùng hiển thị (KG-F5M3-02) — assert đúng phạm vi vùng, không đếm toàn trang. **Độ phức tạp:** M.

### M7.3 — Hồi quy E2E F4 (S)
- **Mục tiêu:** AC-29 (phần 38 F4) — 38 test F4 hiện có tiếp tục pass; không test bị bỏ qua.
- **Số liệu [VF]:** 7 file F4 = **38** (Select 2, auth 3, birth-profile 4, chart-list 8, chart 17, layout 2, smoke 2) + M6 `interpretation-responsive` **10** (mock) = **48** hiện được liệt kê. Sau M7 tổng = **48 + N**, với N = số test của `interpretation.spec.ts` (phụ thuộc cách chia test A1–A6/B1–B6, ước ~12). **Plan không ấn định tổng**; chỉ ấn định *"38 F4 + 10 M6 = 48 không đổi, cộng N test mới"* và N/tổng phải đo bằng `--list`.
- **Bước:** (1) trước khi thêm spec: baseline `--list` (48) và baseline thực thi (M7.0); (2) sau khi thêm: `--list` ⇒ `48 + N` (N = số test của spec mới, ghi lại); (3) chạy toàn bộ với JSON reporter để lấy `stats` (`expected`, `unexpected`, `flaky`, `skipped`); (4) phân biệt **test count** (`--list`), **test case thực thi**, **retry attempts** (CI `retries:2`): chấp nhận chỉ khi `unexpected=0`, `skipped=0`, và **`flaky=0`** (flaky = pass sau retry ⇒ ghi là rủi ro, không ghi pass sạch).
- **Nếu số F4 ≠ 38:** không sửa test cho khớp; ghi discrepancy, đối chiếu matrix F4 M10 và `--list` theo file.
- **Acceptance:** AC-29. **Evidence:** log list, JSON stats, CI run. **Độ phức tạp:** S.

### M7.4 — Audit anti-pattern & chất lượng test (S)
- **Mục tiêu:** chứng minh tuân thủ AC-29 và Task M7.3 của prompt.
- **Phạm vi quét:** **toàn bộ `frontend/e2e/`** (không chỉ file mới) — vì AC-29 phát biểu chung.
- **Bước/lệnh (xem Mục 13):** (a) grep `waitForTimeout|test.skip|test.only|\.only\(|describe.skip|describe.only|test.fixme|test.fail`; **baseline hiện có 1 vi phạm thật: `interpretation-responsive.spec.ts:182 waitForTimeout(300)`**; (b) grep nuốt lỗi (`.catch(() => …)`, `catch {}` rỗng) — baseline: 0; (c) mock-guard cho spec mới; (d) rà thủ công assertion yếu (`toBeTruthy`, chỉ kiểm container/heading); (e) `forbidOnly` đã bật khi `CI` (đã [VF]).
- **Xử lý vi phạm M6 (D-M7-01):** **[REC]** thay `waitForTimeout(300)` bằng chờ xác định (ví dụ hai lần `requestAnimationFrame` qua `page.evaluate`, hoặc `expect.poll` trên `window.innerWidth` rồi đo) rồi **chạy lại spec M6 (10/10)** để chứng minh số đo không đổi. Đây là thay đổi một dòng ở file M6, **cần Owner cho phép** vì chạm phạm vi M6 đã đóng.
- **Acceptance:** AC-29. **Evidence:** log grep (kỳ vọng 0), diff dòng đổi, kết quả chạy lại. **Độ phức tạp:** S.

### M7.5 — Tích hợp CI & thu bằng chứng (S–M)
- **Mục tiêu:** hai scenario chạy trong CI hiện có; bằng chứng đủ để nghiệm thu.
- **Kết luận thiết kế [VF]:** workflow **không cần sửa** để chạy spec mới: Postgres + migrate + seed + Backend + `npm run test:e2e` đã đủ; thứ tự file theo chữ cái (`interpretation-responsive.spec.ts` trước `interpretation.spec.ts`, do `-` < `.`), mỗi file độc lập nhờ user riêng.
- **Bằng chứng khi PASS (hiện không có artifact):** (1) URL run + job; (2) dòng `GITHUB_STEP_SUMMARY` của spec (version, key Mars, kết quả so khớp seed); (3) log `--reporter=list` do Owner chạy cục bộ (CI chỉ có reporter `html`, log không liệt kê từng test).
- **Tuỳ chọn cần Owner (D-M7-03):** (a) giữ nguyên; (b) thêm reporter `list` cho CI (sửa `playwright.config.ts`); (c) upload report cả khi pass (sửa workflow, `if: always()`); (d) `trace: "retain-on-failure"` cho CI. Mặc định đề xuất: **(a) + log cục bộ**, (b) nếu muốn log CI đọc được; không đổi kiến trúc CI.
- **Phân loại lỗi CI:** theo bước thất bại — `Migrate database`/`Seed interpretation content` ⇒ lỗi DB/seed; `Start backend server` ⇒ lỗi Backend (artifact `backend-log` + `cat backend.log`); `Build`/`Test` ⇒ FE; `Run E2E Tests` ⇒ đọc `playwright-report`/`test-results` (screenshot + video khi fail) để tách "assertion thất bại" khỏi "setup" (lỗi ở `registerAndLogin`/`createBirthProfile` = setup; lỗi sau `POST natal` = Backend/assertion).
- **Dọn dẹp:** không cần (DB CI mới mỗi run; email duy nhất). **Xử lý fail:** không `retry` để che lỗi; flaky ≥1 ⇒ điều tra, không ghi pass sạch.
- **Lưu ý `paths` filter:** commit chỉ-docs (`docs/**`) **không** chạy CI; CI chỉ chạy khi chạm `frontend/**`, `backend/**` hoặc workflow ⇒ **CI evidence của M7 phải là commit có chạm `frontend/**`** (spec mới). **Độ phức tạp:** S–M.

### 7.9 M7 — Definition of Done
Scenario A và B xanh với Backend thật + seed thật; `interpretationVersion` string không null (`=== seed.version`) trong cả hai; nội dung Mars khớp seed; không hiển thị diễn giải Nhà/Cung Mọc không hợp lệ; chú thích hiển thị; không error state do dữ liệu degraded hợp lệ; 38 F4 + 10 M6 vẫn pass, `skipped=0`, `flaky=0` (hoặc flaky được ghi rủi ro); grep anti-pattern = 0 trên toàn `e2e/`; mock-guard đạt; CI run + log/step-summary ghi lại.

---

## 8. M8 — Detailed Implementation Plan (Documentation, Versioning & Sprint Closure)

Quy tắc chung: chỉ sửa tối thiểu; không thêm tính năng chưa triển khai; không biến proposal thành as-built; mọi mệnh đề as-built phải trỏ được tới mã hoặc evidence. Việc **soạn** M8.1–M8.3 có thể song song với M7; việc **tuyên bố** trạng thái chỉ sau Gate-M7.

### M8.1 — UI Specification as-built (§12.6, §13) (M)
- **File:** `docs/frontend/Frontend_UI_Specification.md`.
- **§12.6 (dòng 853–862):** thay mô tả "Interpretation Card" (proposal cũ) bằng mô tả **as-built F5**: `InterpretationPanel` + `InterpretationOverview` + `InterpretationItem`; dữ liệu từ `ChartResponse.interpretations[]` (không API riêng); ba loại `PlanetInSign`/`PlanetInHouse`/`AngleInSign`; nhóm "Cốt lõi" (Mặt Trời, Mặt Trăng, Cung Mọc) mở sẵn + "Các hành tinh"; nội dung **chỉ text thuần**; không hiển thị `tone`/`contentSource`/version; đồng bộ chọn với wheel/bảng; nút "Đọc diễn giải"/"Xem trên biểu đồ"; trạng thái degraded (thiếu Nhà, chưa phát hành, thiếu mục, entry hỏng, không khả dụng); lỗi interpretation đi cùng lỗi chart (F4); a11y (heading h2/h3/h4, liên kết nhảy `scroll-mt`, ring focus, `motion-reduce`, vùng chạm ≥44px mobile, `max-w-[65ch]`). **Không** mô tả: aspect/pattern/tổng hợp, badge AI, accordion kỹ thuật (ghi "Chưa triển khai — ngoài phạm vi F5" nếu cần giữ chỗ).
- **§13 (dòng 925–945):** chỉ sửa **hàng 11** (`/app/charts/:chartId`): thành phần "`ChartViewerShell`: Wheel + 3 Tables + Selection + **Interpretation Panel**", trạng thái "Đã triển khai (F4 lõi + F5 Interpretation UI)". Không đụng hàng 5 (`/chart/:chartId` Backlog) và các hàng khác.
- **Kiểm chứng:** (1) mỗi mệnh đề mới có nguồn (đường dẫn mã/test/matrix) ghi vào Matrix M8; (2) `git diff --stat` chỉ chạm file này (+ tham chiếu lan toả nếu D-M8-02 duyệt); (3) rà soát tài liệu (Mục 13).
- **Evidence:** diff, bảng "mệnh đề → nguồn". **Độ phức tạp:** M.

### M8.2 — Đính chính mâu thuẫn A-2 (S–M)
| Hạng mục | Nội dung [VF] |
|---|---|
| Vị trí | F5 plan dòng 90 (bảng giả định/mâu thuẫn) và `Frontend_UI_Specification.md` §12.6 (dòng 853–862) |
| Hai nội dung xung đột | **Spec §12.6:** `source: human|ai` (badge AI `aria-label="Nội dung do AI tạo"`), `content` rich text, `technicalDetail` trong Accordion, lỗi interpretation **tách API** với nút "Thử lại", `subject` có thể là aspect/"summary". **Hợp đồng thật:** không có trường `source`; `bodyText` text thuần; diễn giải **nằm trong** `ChartResponse` (lỗi DB ⇒ cả request chart lỗi); chỉ 3 subject type |
| Source of truth được chọn | Hợp đồng Backend thật (`types.ts` `ChartInterpretationDto`, `chart-response.mapper`, `interpretation-lookup.service`) + implementation F5; **đã được F5 plan ghi sẵn** ("Hợp đồng thật thắng; sửa spec ở F5.M8") — Owner xác nhận plan-level default tại D-M8-01 |
| Nội dung cần đính chính | §12.6 như M8.1; bỏ/đánh dấu lỗi thời: `source`/badge AI, rich text, `technicalDetail`/Accordion, "API interpretation lỗi riêng" |
| Mục khác bị ảnh hưởng | **Spec:** dòng 78 (persona: "ẩn thuật ngữ kỹ thuật… Xem chi tiết kỹ thuật"), 689 & 696 (ví dụ Accordion dùng `InterpretationCard`), 868 (Pattern Card nhắc Interpretation Card), 1007 (query key `['chart', chartId, 'interpretation']` — thực tế diễn giải nằm trong query chart). **Architecture Spec:** dòng 170, 557, 632, 721. **Design System:** dòng 532 |
| Phạm vi đề xuất | **[REC]** sửa §12.6 + §13 (đúng yêu cầu M8) và ghi các tham chiếu lan toả còn lại thành **docs-debt Known Gap** (không sửa), trừ khi Owner duyệt sửa tối thiểu (D-M8-02) |
| Cách xác minh | grep (sau sửa) `source`, `human\|ai`, `Nội dung do AI tạo`, `technicalDetail`, `InterpretationCard` trong Spec ⇒ mọi kết quả còn lại hoặc nằm ở phạm vi đã ghi Known Gap hoặc được đánh dấu rõ "chưa triển khai"; đối chiếu từng mệnh đề §12.6 với mã/test |
Nếu Owner không xác nhận source of truth ⇒ **Owner Decision Required**, không tự suy đoán.

### M8.3 — CHANGELOG (S)
- **File:** `frontend/CHANGELOG.md` (convention [VF]: Keep a Changelog; mỗi release một mục; sprint là bullet đậm dưới `### Added`; chỉ `Added`/`Changed`).
- **Heading:** nếu D-F5-08 **được duyệt** ⇒ `## [0.4.0] - <ngày Owner chốt>`; nếu **chưa** ⇒ `## [Unreleased]` (chuẩn Keep a Changelog; file hiện chưa có mục này) — D-M8-03. **Không** điền ngày/phiên bản khi chưa có quyết định.
- **Nội dung (chỉ đã hoàn tất + có evidence):** Added — seed nội dung diễn giải trong CI & probe hợp đồng (M1); model diễn giải thuần (M2); Panel Diễn giải (Overview, nhóm, mục, copy, disclaimer) (M3); đồng bộ chọn Wheel ⇄ Planet Table ⇄ Panel, "Đọc diễn giải"/"Xem trên biểu đồ", focus/Escape (M4); trạng thái degraded + cô lập lỗi dựng model + `reportError` (M5); hardening responsive/a11y (heading, landmark, `motion-reduce`, độ đọc, liên kết nhảy `scroll-mt`, vùng chạm) và 10 E2E responsive (mock) (M6); E2E Real Backend Scenario A/B (M7 — **chỉ sau khi xanh**). Changed — nếu có thay đổi hành vi ngoài thêm mới (ví dụ ẩn tên người dùng ở header <640px, `user-menu`). Known limitations (nằm trong mô tả, không phải mục riêng): không cảnh báo độ bất định Mặt Trăng (KG-F5-01); chưa có diễn giải góc chiếu/Nhà độc lập/tổng hợp; Narrator âm thanh chưa kiểm (ACCEPTED GAP KG-F5M4-01); Safari/Firefox chưa kiểm.
- **Không đưa vào:** thay đổi Backend, tính năng chưa xong, nội dung chưa xác minh, các test mock được mô tả như Real Backend.
- **Kiểm chứng:** mỗi bullet ↔ matrix/commit; không bullet nào nhắc điều không có trong mã. **Lưu ý:** sửa `frontend/CHANGELOG.md` **kích hoạt CI** (nằm trong `frontend/**`).

### M8.4 — Nâng version `0.4.0` (CÓ ĐIỀU KIỆN — D-F5-08) (S)
- **Trạng thái hiện tại:** **`Pending Owner Approval — D-F5-08`**. Bằng chứng duyệt trong repo: **không có** (grep toàn `docs/` chỉ thấy F5 plan "Conditional" và plan M6 nhắc lại); `Confirmation.md` (nguồn D-F5-01…09) không nằm trong repo và F5 plan dòng 434 coi đó là đề xuất.
- **Xác minh trước (đã làm):** `frontend/package.json` = `0.3.0`; `package-lock.json` root `version` và `packages[""].version` = `0.3.0`; chính sách: F5 plan §16/§18 "`0.4.0` chỉ khi owner xác nhận"; Backend `0.4.0` độc lập, **không** đụng; tag `v0.3.0` tồn tại ở commit đóng F4.
- **Chỉ khi Owner duyệt bằng văn bản (tham chiếu có ngày):**
  1. Sửa **ba** giá trị: `frontend/package.json:version`, `frontend/package-lock.json:version`, `frontend/package-lock.json:packages[""].version`.
  2. Cách đồng bộ lockfile — **Verified trong bản sao tạm ngoài repo** (npm 10.9.9): `cd frontend && npm version 0.4.0 --no-git-tag-version --ignore-scripts` chỉ đổi đúng ba giá trị trên, không đổi gì khác (`husky prepare` không chạy do `--ignore-scripts`).
  3. Kiểm nhất quán: so `node -p "require('./package.json').version"` với hai giá trị lockfile; tiêu đề CHANGELOG `[0.4.0]`; `git diff --stat` chỉ gồm 2 file (+CHANGELOG); `backend/`/gốc không đổi.
  4. Chạy CI (commit chạm `frontend/**` ⇒ có CI).
  5. **Tag/Release `v0.4.0`** là quyết định tách (D-M8-09) — tiền lệ F4: tag tại commit đóng sprint; **không** tự tạo.
- **Nếu chưa duyệt:** **không** sửa `package.json`/lockfile, **không** tạo tag, **không** tuyên bố `0.4.0` đã phát hành; CHANGELOG dùng `[Unreleased]`; ghi `Pending Owner Approval — D-F5-08` trong Matrix và báo cáo; M8 vẫn hoàn thành các task tài liệu khác nhưng **task versioning không được tuyên bố hoàn tất**.
- **Độ phức tạp:** S.

### M8.5 — Known Gaps registry (M)
- **Vị trí [REC]:** `docs/implementation/archive/sprint-f5/Sprint_F5_Known_Gaps_Registry.md` (**mới**, theo tiền lệ F3/Sprint 3–4; hiện F5 chưa có registry; F5 plan §15.3 nói "ghi vào registry ở M8"). D-M8-05.
- **Schema [REC] (kế thừa F3/Sprint 3 + trường Owner/Status theo M6):** `ID | Nhóm | Mô tả | Milestone/AC | Evidence | Severity | Status | Owner | Next action | Tham chiếu phê duyệt Owner`.
- **Cách đối chiếu (không xoá chỉ vì có thay đổi mã):** lấy danh sách nguồn → với mỗi gap xác định trạng thái **bằng evidence** → ghi.
  | Nguồn | Gap | Hành động đề xuất |
  |---|---|---|
  | F5 plan §15.3 | KG-F5-01 (Moon uncertainty), -02 (không có diễn giải aspect/Nhà/tổng hợp), -03 (chỉ 10 hành tinh + Asc), -04 (`tone` null, `contentSource` ẩn), -05 (Asc không chọn được), -06 (README `main` lệch), -07 (QA thiết bị/AT ngoài Windows) | giữ `OPEN`/`Deferred`; KG-F5-01 dẫn Matrix M5 |
  | Matrix M3 | KG-F5M3-02 (banner F4 vs chú thích Panel) — OPEN; KG-F5M3-04 — **đã đóng ở M6** (có ảnh) | giữ / đóng với evidence |
  | Matrix M4 | KG-F5M4-01 (Narrator, ACCEPTED GAP — xin Owner xác nhận tham chiếu phê duyệt), -02 (UNVERIFIED), -03 (Safari/Firefox), -04/-05 | giữ nguyên trạng theo Matrix M4/M6 |
  | Matrix M6 | KG-F5M6-01 (flake `router.test.tsx`), KG-F5M6-02 (khả năng tìm thấy Diễn giải trước khi chọn; §7.1 Owner override) | giữ `OPEN` |
  | F4 | FG-01, FG-07, FG-10 (title động/focus điều hướng), KG-M8-01, KG-M9-01, KG-M10-03, KG-CI-NODE20 | chuyển tiếp nếu còn |
  | Phát sinh M7/M8 (**chỉ ghi nếu có evidence**) | ví dụ: Real Backend E2E vẫn mock GeoNames; 10 E2E responsive M6 dùng mock; CI không giữ artifact khi pass; docs-debt tham chiếu `InterpretationCard` ngoài §12.6/§13; `frontend/README.md` lỗi thời (E2E "skip" trong CI) | ghi nếu xác nhận |
- **Danh sách "xem xét" của prompt** (Backend limits, giờ sinh/Nhà, Moon, type không hỗ trợ, a11y, responsive/thiết bị, CI/môi trường, chỗ chưa có test tự động) chỉ ghi khi còn tồn tại và có evidence.
- **Chính sách:** `ACCEPTED GAP` chỉ khi Owner duyệt **riêng** từng ID (tham chiếu thật); release-blocking gap phải có disposition rõ.
- **Độ phức tạp:** M.

### M8.6 — Evidence Matrix (M)
- **Vị trí & tên (theo quy ước F4/F5: một matrix mỗi milestone, trong `archive/sprint-f5/`):** `Sprint_F5_M7_Exit_Criteria_Evidence_Matrix.md` (bằng chứng M7) và `Sprint_F5_M8_Exit_Criteria_Evidence_Matrix.md` (**toàn sprint**: AC-01…30 + §18 DoD + tham chiếu M1–M7). Không tạo thêm file thừa; M7 không sao chép nội dung vào M8 mà **tham chiếu** (D-M8-07).
- **Cột bắt buộc:** Acceptance Criteria · Requirement/Exit Criterion · Milestone · Implementation Evidence · Test Evidence · CI Evidence · Manual QA Evidence · Status (Pass/Fail/Partial/Pending/N/A) · Known Gap · Owner Decision · Notes.
- **Nguyên tắc:** không Pass nếu thiếu artifact; fixture/mock không là bằng chứng Real Backend; CI pass không thay thế QA thủ công a11y/thiết bị; AC-01…12 **truy vết bằng test ID** (matrix M1–M3 không ghi AC) — nếu không truy được ⇒ `Pending`, không `Pass`.
- **Độ phức tạp:** M–L (phần AC-01…12).

### M8.7 — Báo cáo đóng F5 (M)
- **Tên/vị trí [REC]:** `docs/implementation/archive/sprint-f5/Sprint_F5_Final_Review_Report.md` (mô phỏng `Sprint_{3,4}_Final_Review_Report.md`; FE chưa có báo cáo riêng ⇒ D-M8-06).
- **Nội dung:** đủ 18 mục của prompt §6.3 (overview, scope cam kết, trạng thái M1–M8, AC, implementation, Real Backend E2E, hồi quy F4, CI evidence, tài liệu, versioning + D-F5-08, Known Gaps, tham chiếu Matrix, Owner decisions, deferred, rủi ro dư, đánh giá DoD, trạng thái cuối, bước tiếp theo).
- **Từ vựng trạng thái bắt buộc:** Completed · Completed with accepted limitations · Pending Owner Approval · Blocked · Deferred. **Không** tuyên bố F5 hoàn tất khi thiếu điều kiện §18; "owner chính thức nghiệm thu" là điều kiện riêng của Owner.
- **Quy ước đóng (tiền lệ F4):** commit đóng sprint dạng "[docs] finalize sprint f5 closure & complete gaps registry"; sau đó xoá plan tạm (`Sprint_F5_M6_Implementation_Plan.md` và plan này) theo quy ước — hành động của Owner. **Độ phức tạp:** M.

---

## 9. Acceptance Criteria Mapping

**Nguồn:** `docs/implementation/Sprint_F5_Implementation_Plan.md` — §17 "Acceptance Criteria" (dòng 477–510); **"Mục 18" = §18 "Definition of Done"** (dòng 514–516).

| AC / Exit Criterion | Source of Truth (nguyên văn rút gọn) | Task | Verification | Evidence dự kiến | Status |
|---|---|---|---|---|---|
| **AC-28** | dòng 508: "E2E Backend thật: Scenario A xanh với `interpretationVersion ≠ null` và nội dung diễn giải Mars hiển thị" | M7.1 (+M7.4, M7.5) | Targeted + full E2E trên Backend thật; assert version `!== null` và nội dung = seed | CI run URL; step-summary; log `list`; Matrix M7 | **Pending** (chưa thực hiện) |
| **AC-29** | dòng 509: "E2E Scenario B xanh; 38 E2E F4 xanh; không `skip/only/waitForTimeout`" | M7.2, M7.3, M7.4 | Scenario B; `--list` + JSON stats; grep toàn `e2e/` = 0 | như trên + log grep | **Pending**; ⚠ hiện có 1 vi phạm `waitForTimeout` ở spec M6 (D-M7-01) |
| **AC-30** | dòng 510: "Tài liệu (Spec, CHANGELOG, Gaps, Matrix, báo cáo) cập nhật; không đổi Backend/API; số test ≥ baseline" | M8.1–M8.7 | Rà soát tài liệu; `git diff --stat` không chạm `backend/`; số test Vitest/E2E ≥ baseline đã ghi | Matrix M8; diff; số test | **Pending** |
| **Mục 18 (DoD)** | dòng 516: scope hoàn tất; gate Mục 12 xanh; **AC-01…30 có bằng chứng**; hồi quy F4; QA a11y/responsive ghi riêng, phần chưa kiểm = Known Gap; không đổi Backend/API/kiến trúc; Gaps+Matrix+CHANGELOG+Spec cập nhật; version `0.4.0` **chỉ khi owner xác nhận**; **owner chính thức nghiệm thu** | M8.6, M8.7 + Gate | checklist Mục 20/21 | Matrix M8 + báo cáo | **Pending**; "Owner nghiệm thu" ngoài quyền của plan |
| AC-01…AC-12 | dòng 481–492 (Overview, nhóm, Mặt Trời/Mặt Trăng/Cung Mọc/8 hành tinh, thứ tự, không Nhà độc lập, không placeholder, mở/đóng) | M8.6 (truy vết) | truy vết bằng test ID từ M2/M3 (`U-*`, `OV-*`, `PN-*`, `IT-*`); matrix M1–M3 **không ghi ID AC** (M2 chỉ nhắc AC-09/11) | Test + matrix M2/M3 | **Pending verification** — không ghi Pass trước khi truy được |
| AC-13…AC-16 | dòng 493–496 (đồng bộ chọn, "Đọc diễn giải"/"Xem trên biểu đồ", không dời focus) | M8.6 | Matrix M4 + test | Matrix M4; M7.1 bổ sung ở mức Real Backend (bước A4–A5) | Evidence có (M4); xác nhận lại ở M8 |
| AC-17…AC-22 | dòng 497–502 (degraded, chưa phát hành, thiếu mục, entry hỏng, lỗi API) | M8.6 | Matrix M5 + test D5-*; M7.2 bổ sung Real Backend cho AC-17 | Matrix M5 | Evidence có (M5); AC-18 gắn KG-F5-01 (OPEN) |
| AC-23 | dòng 503 (text-only, grep không `dangerouslySetInnerHTML`, không văn bản hardcode) | M8.6 | grep an toàn (gate §12) + test | log grep | Pending verification |
| AC-24…AC-27 | dòng 504–507 (heading, responsive, bàn phím, QA thủ công) | M8.6 | Matrix M6 | Matrix M6 | AC-24/25/26 có evidence **một phần tự động**; **AC-27 `PARTIAL` — ACCEPTED GAP Narrator**; số đo M6 dùng fixture mock ⇒ ghi rõ giới hạn |

**Sai khác so với mapping dự kiến của prompt:** nguồn gốc khớp (AC-28↔Scenario A, AC-29↔Scenario B + 38 F4 + anti-pattern). Điểm cần ghi: AC-29 còn bao gồm **"38 E2E F4 xanh"** — hiện tổng test là 48 (38 F4 + 10 M6), nên Matrix phải ghi rõ *38 = 7 file F4* chứ không phải tổng; **Mục 18** là *Definition of Done* (không phải "Exit Criteria" tách riêng).

---

## 10. Task-level File Impact Matrix

| Task | File | Action | Reason | Dependency | Evidence |
|---|---|---|---|---|---|
| M7.1/M7.2 | `frontend/e2e/interpretation.spec.ts` | **Create** | 2 scenario Real Backend (AC-28/29) | M7.0 | [VF] `testDir: ./e2e`; F5 plan §10 |
| M7.4 | `frontend/e2e/interpretation-responsive.spec.ts` | **Update (1 dòng, cần D-M7-01)** | gỡ `waitForTimeout(300)` (dòng 182) | D-M7-01 | [VF] grep baseline |
| M7.5 | `frontend/playwright.config.ts` | **Update (tuỳ chọn, D-M7-03)** | reporter `list`/`trace` cho CI | D-M7-03 | [VF] config hiện tại |
| M7.5 | `.github/workflows/frontend-ci.yml` | **Update (tuỳ chọn, D-M7-03)** | upload report khi pass | D-M7-03 | [VF] chỉ upload `failure()` |
| M7.1/7.2 | `backend/prisma/content/interpretations.vi.json` | **Read-only** | nguồn kỳ vọng độc lập | — | [VF] 252 mục, Mars 24 |
| M7 | `frontend/e2e/chart.spec.ts`, `chart-list.spec.ts` | **Read-only** | mẫu helper/selector, baseline | — | [VF] |
| M7 | `docs/implementation/archive/sprint-f5/Sprint_F5_M7_Exit_Criteria_Evidence_Matrix.md` | **Create** | bằng chứng M7 | M7.1–M7.5 | quy ước matrix |
| M7 | `docs/implementation/archive/sprint-f5/evidence/m7_*` | **Create (nếu có)** | log `list`/JSON stats/ảnh | M7.3/M7.5 | thư mục tồn tại [VF] |
| M8.1/M8.2 | `docs/frontend/Frontend_UI_Specification.md` | **Update** | §12.6, §13 hàng 11; (tham chiếu lan toả nếu D-M8-02) | M8.2 quyết định | [VF] dòng 853–862, 939, 78, 689, 696, 868, 1007 |
| M8.2 | `docs/frontend/Frontend_Architecture_Specification.md`, `Design_System_Specification.md` | **Chỉ ghi docs-debt (mặc định)** | tham chiếu `InterpretationCard` | D-M8-02 | [VF] dòng 170/557/632/721; 532 |
| M8.3 | `frontend/CHANGELOG.md` | **Update** | mục `[Unreleased]` hoặc `[0.4.0]` | D-M8-03/D-F5-08 | [VF] |
| M8.4 | `frontend/package.json`, `frontend/package-lock.json` | **Update — CHỈ nếu D-F5-08 duyệt** | version `0.4.0` (3 giá trị) | **D-F5-08** | [VF] hiện `0.3.0`; lệnh đã kiểm trên bản sao tạm |
| M8.5 | `docs/implementation/archive/sprint-f5/Sprint_F5_Known_Gaps_Registry.md` | **Create** | registry F5 | D-M8-05 | tiền lệ F3/S3/S4 |
| M8.6 | `…/Sprint_F5_M8_Exit_Criteria_Evidence_Matrix.md` | **Create** | AC-01…30 + §18 | M7 evidence | quy ước |
| M8.7 | `…/Sprint_F5_Final_Review_Report.md` | **Create** | báo cáo đóng | D-M8-06 | tiền lệ S3/S4 |
| M8 | `docs/implementation/Sprint_F5_Implementation_Plan.md` | **Update** | trạng thái M6–M8, bỏ "Draft" lỗi thời, dòng A-1 lỗi thời | D-M8-08 | [VF] metadata dòng 1–12; dòng 89 |
| M8 | `frontend/README.md` | **Update (tuỳ chọn, D-M8-08)** | câu "E2E bị skip trong CI" lỗi thời | D-M8-08 | [VF] dòng 69 |
| Đóng | `docs/implementation/Sprint_F5_M6_Implementation_Plan.md`, plan này | **Delete (hành động Owner sau nghiệm thu)** | quy ước xoá plan tạm | Owner ký | [VF] M6 plan còn trong repo |
| — | `backend/**`, `frontend/src/**`, `selection.ts`, `interpretation.ts` | **Không đổi** (ngoại lệ có chủ đích: 1 dòng `id={id}` trong `InterpretationItem.tsx` và assertion trong `InterpretationItem.test.tsx`) | ràng buộc phạm vi | — | prompt §13 |

---

## 11. Dependency Graph

```
M1 ─┬─> M4 ─┐
    │       ├─> M6 (nền) ─┐
    └─> M5 ─┘             │
Seed CI (M1) + contract   ├─> M7.0 ─┬─> M7.1 (Scenario A) ─┐
(seed JSON, types.ts) ────┘         ├─> M7.2 (Scenario B) ─┼─> M7.3 (hồi quy 38 F4 + 10 M6)
                                    │                      ├─> M7.4 (anti-pattern; D-M7-01)
                                    │                      └─> M7.5 (CI + evidence) ──> [Gate-M7]
D-F5-08 (Owner) ─────────────────────────────────────────────────┐
                                                                 │
M8.1 (Spec as-built) ─┬─ M8.2 (A-2) ─┐                           │
M8.3 (CHANGELOG)  ────┤              ├─> M8.5 (Gaps) ─> M8.6 (Matrix M7+M8) ─> M8.7 (Báo cáo) ─> [Gate-M8]
M8.4 (version, có điều kiện) <───────┘<─ cần D-F5-08 duyệt; nếu không: bỏ qua, ghi Pending
Gate-M7 ─────────────────────────────────> M8.6/M8.7 (tuyên bố trạng thái)
```
- **Song song được:** M7.1 ∥ M7.2 (cùng file, viết độc lập); M8.1 ∥ M8.2 ∥ M8.3 (soạn thảo, độc lập với kết quả M7); M7.4 (grep) có thể chạy sớm.
- **Bắt buộc tuần tự:** M7.0 → M7.1/M7.2 → M7.3 → M7.5; M8.5 → M8.6 → M8.7; M8.4 phụ thuộc quyết định D-F5-08; M8.6/M8.7 phụ thuộc Gate-M7.

---

## 12. Execution Sequence (đối chiếu 18 bước của prompt)

| # | Bước | Task | Ghi chú / lý do thay đổi thứ tự |
|---|---|---|---|
| 1 | Xác minh tiền đề | M7.0 | Đã làm ở audit; lặp lại trên commit nền |
| 2 | Audit seed + hợp đồng | M7.0 | Đã làm (Mục 4.3); xác nhận `prisma:seed:content --validate-only` (Proposed) |
| 3 | Thiết kế setup E2E xác định | M7.0 / 7.0.1 | Chốt D-M7-02 (helper), Real-Backend guard, chiến lược kỳ vọng |
| 4 | Viết Scenario A | M7.1 | |
| 5 | Viết Scenario B | M7.2 | |
| 6 | Chạy targeted E2E | M7.1/7.2 | Owner chạy Backend cục bộ |
| 7 | Chạy hồi quy toàn bộ E2E | M7.3 | `--reporter=list` + JSON stats |
| 8 | Audit anti-pattern | M7.4 | Có thể chạy trước bước 4 để lấy baseline; xử lý D-M7-01 |
| 9 | Kiểm tương đương CI cục bộ | M7.5 | Docker Postgres + bước như workflow |
| 10 | Thu CI report/artifact | M7.5 | **Commit phải chạm `frontend/**`** để CI chạy |
| — | **Gate-M7** | | Xanh hoặc blocker có kết luận |
| 11 | Spec as-built | M8.1 | **Có thể soạn từ bước 1** (độc lập M7) |
| 12 | Giải A-2 | M8.2 | như trên |
| 13 | CHANGELOG | M8.3 | soạn trước; chỉ chốt heading sau D-M8-03 |
| 14 | Giải D-F5-08 | M8.4 | **Hỏi Owner ngay từ M7.0** (quyết định chặn không thể muộn) |
| 15 | Version + lockfile (có điều kiện) | M8.4 | chỉ khi duyệt |
| 16 | Known Gaps | M8.5 | sau khi có evidence M7 |
| 17 | Evidence Matrix | M8.6 | |
| 18 | Báo cáo đóng | M8.7 | sau Gate-M7 và Owner decisions |

---

## 13. Commands and Verification Strategy

Nhãn: **[VF]** = đã xác minh từ `package.json`/workflow/hoặc tôi đã chạy; **Proposed** = *verify before execution*. **Không lệnh nào ở đây được ghi PASS.**

### 13.1 Chạy E2E
| Mục đích | Lệnh (từ `frontend/`) | Nhãn |
|---|---|---|
| Cài đặt | `npm ci` | [VF `package.json`/workflow] |
| Liệt kê/đếm test | `CI=1 npx playwright test --list` (tôi đã chạy: 48 tests / 8 files) | [VF] |
| Đếm theo file | `CI=1 npx playwright test --list \| grep -oE "\[chromium\] › [A-Za-z0-9.-]+\.spec\.ts" \| sort \| uniq -c` | [VF đã chạy] |
| Riêng `interpretation.spec.ts` | `npx playwright test e2e/interpretation.spec.ts --reporter=list` | Proposed (cú pháp Playwright chuẩn) |
| Toàn bộ suite | `npm run test:e2e` (= `playwright test`); log đọc được: `npx playwright test --reporter=list` | [VF script]/Proposed |
| Thống kê (expected/unexpected/flaky/skipped) | `npx playwright test --reporter=json > /tmp/pw.json` rồi đọc `stats` | Proposed |
| Mô phỏng CI (retries 2, workers 1, forbidOnly) | thêm `CI=1` vào các lệnh trên | [VF `playwright.config.ts`] |

### 13.2 Real Backend + seed (mô phỏng workflow)
| Bước | Lệnh | Nhãn |
|---|---|---|
| Postgres 16 | `docker run -d --name astroviet-e2e-pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=astroviet_e2e -p 5432:5432 postgres:16-alpine` (hoặc `backend/docker-compose.test.yml` — chưa đọc) | Proposed |
| Backend `.env` | nội dung như bước "Setup backend environment" của workflow (`NODE_ENV=test`, `DATABASE_URL=…/astroviet_e2e`, JWT secrets ≥32 ký tự, …) | [VF workflow] |
| Migrate | `cd backend && npm ci && npm run prisma:generate && npm run prisma:deploy` | [VF workflow] |
| Seed thật | `npm run prisma:seed:content` | [VF workflow/`package.json`] |
| Kiểm nội dung trước seed | `npx tsx prisma/seed-content.ts --validate-only` | Proposed (cờ `validate-only` có trong `seed-content.ts`) |
| Build + chạy | `npm run build && node dist/server.js` (không dùng `npm run start`) | [VF workflow] |
| Health | `curl -sf http://localhost:3000/live` | [VF workflow] |
| FE env | `cd frontend && cp .env.example .env` | [VF workflow] |

### 13.3 Anti-pattern & chất lượng (M7.4)
| Kiểm | Lệnh (từ gốc repo) | Kỳ vọng |
|---|---|---|
| Từ khoá cấm | `grep -rnE "waitForTimeout\|test\.skip\|test\.only\|\.only\(\|describe\.skip\|describe\.only\|test\.fixme\|test\.fail" frontend/e2e` | **0**. **Baseline [VF]: 1 vi phạm** — `interpretation-responsive.spec.ts:182` (`waitForTimeout(300)`); dòng 76 `test.setTimeout(60000)` là cấu hình timeout, không phải sleep |
| Nuốt lỗi | `grep -rnE "\.catch\(\s*\(\)\s*=>\|catch\s*\{\s*\}\|catch\s*\(\w*\)\s*\{\s*\}" frontend/e2e` | 0 (baseline [VF]: 0) |
| Mock-guard spec mới | `grep -nE "page\.route\|context\.route" frontend/e2e/interpretation.spec.ts` | chỉ pattern `locations/search` |
| `.only` bị chặn ở CI | cấu hình `forbidOnly: !!process.env.CI` | [VF] |
| Skip ngầm | JSON `stats.skipped` | 0 |
| Assertion yếu | rà thủ công: không `toBeTruthy()` thay cho giá trị cụ thể; không chỉ kiểm container/heading | checklist |

### 13.4 Quality gates FE (từ `frontend/`, [VF scripts])
`npm run format:check` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run test:coverage` · `npm run build`. Số test Vitest phải **≥ baseline** đã ghi ở M7.0 (AC-30). Tôi đã chạy lại trên `HEAD` M6: format/typecheck/lint exit 0; Vitest nhóm chart+pages+shared 84 file/891 test pass (không phải toàn bộ suite).

### 13.5 Xác minh M8
| Mục | Cách kiểm |
|---|---|
| Nhất quán tài liệu | grep Spec sau sửa: `source`, `human|ai`, `Nội dung do AI tạo`, `technicalDetail`, `InterpretationCard`; đối chiếu từng mệnh đề §12.6/§13 với mã |
| A-2 | bảng "mệnh đề → nguồn" trong Matrix M8 |
| CHANGELOG | mỗi bullet ↔ matrix/commit; heading đúng D-M8-03 |
| Version (chỉ nếu duyệt) | `node -p "require('./frontend/package.json').version"` ; đọc `package-lock.json` (`version`, `packages[""].version`) bằng script; kỳ vọng cả ba = `0.4.0`; `git diff --stat` chỉ `package.json`, `package-lock.json`, CHANGELOG |
| Không đổi Backend/API | `git diff --stat <base>..HEAD -- backend` rỗng; `git diff --stat <base>..HEAD -- frontend/src` rỗng (ngoại lệ có chủ đích: 1 dòng `id={id}` trong `InterpretationItem.tsx` và assertion trong `InterpretationItem.test.tsx`) |
| Registry đầy đủ | mọi KG trong F5 plan §15.3 + matrix M3–M6 xuất hiện với trạng thái có evidence |
| Matrix đầy đủ | script: mỗi `AC-01`…`AC-30` xuất hiện trong Matrix M8 (Proposed) |
| AC-30/§18 | checklist Mục 20–21 |

---

## 14. Test and QA Strategy

| Lớp | Công cụ | Phạm vi M7–M8 | Giới hạn trung thực |
|---|---|---|---|
| E2E Real Backend | Playwright + Backend + Postgres + seed | `interpretation.spec.ts` (A, B) + 38 F4 | chỉ **Chromium Desktop** (một project); GeoNames bị mock; đúng đắn thiên văn thuộc Backend |
| E2E mock | Playwright `page.route` | 10 test M6 (responsive) | **không** là bằng chứng Real Backend |
| Unit/component | Vitest | giữ nguyên; không thêm | số test ≥ baseline |
| Thủ công | — | **không phát sinh QA thiết bị/AT mới trong M7–M8** | AC-25/26/27 giữ nguyên mức Partial/ACCEPTED GAP đã ghi ở M6; CI xanh **không** thay thế QA thủ công |
| Tĩnh | grep, `forbidOnly` | M7.4 | không có `eslint-plugin-playwright` (không thêm) |

---

## 15. Evidence Deliverables

| # | Evidence (prompt §5.5) | Cách thu theo hạ tầng hiện có |
|---|---|---|
| 1 | `e2e/interpretation.spec.ts` | commit trong repo |
| 2 | Playwright report | CI chỉ upload khi fail ⇒ pass: log `list` cục bộ + (nếu D-M7-03) cấu hình mới; **ghi rõ** nếu không có |
| 3 | CI run URL | URL run + job trên commit chạm `frontend/**` |
| 4 | Kết quả toàn bộ suite | log `list` + JSON `stats` |
| 5 | Test count thực tế | `--list` (tổng, theo file) và số thực thi/retry phân biệt |
| 6, 7 | Kết quả Scenario A / B | log + step-summary |
| 8 | `interpretationVersion !== null` | assertion trong spec + dòng step-summary (giá trị `"1.0"`) |
| 9 | Real seed content | assertion `bodyText === seed` + step-summary (key Mars, so khớp) |
| 10 | 38 F4 regression | `--list` theo 7 file + stats (`unexpected=0`) |
| 11 | Anti-pattern audit | log grep (Mục 13.3) |
| 12 | Failure/trace artifact | chỉ khi CI fail (`playwright-report-${run_id}`, `backend-log`) |
Lưu ở `docs/implementation/archive/sprint-f5/evidence/m7_*` và tham chiếu từ Matrix M7; Matrix M8 **chỉ tham chiếu** M7.

---

## 16. Documentation and Versioning Strategy

- **Thứ tự sửa tài liệu:** Spec §12.6/§13 (+A-2) → CHANGELOG → (điều kiện) version → registry → Matrix → báo cáo; mỗi bước có bảng "mệnh đề → nguồn".
- **Version:** quy trình ở M8.4; mặc định **không** thay đổi. **Release/tag** tách (D-M8-09).
- **CI & tài liệu:** thay đổi chỉ trong `docs/**` không chạy CI; thay đổi `frontend/CHANGELOG.md`/`package.json`/`e2e/**` thì có. Kế hoạch commit: tách commit "code/e2e" (có CI) và các commit "docs" (không CI); CI evidence = commit có `frontend/**`.
- **Không** dùng `Confirmation.md` làm bằng chứng phê duyệt nếu không có trong repo; yêu cầu Owner ghi quyết định (ngày + ID) vào Matrix M8.

---

## 17. Known Gaps Strategy

1. Dựng registry F5 (M8.5) từ nguồn đã liệt kê; mỗi gap có milestone/AC/evidence/severity/status/owner/next action.
2. **Đóng gap chỉ với evidence** (ví dụ KG-F5M3-04 đóng bằng ảnh M6); **giữ** gap còn lại (Moon, aspect/Nhà/tổng hợp, Narrator âm thanh, Safari/Firefox, `router.test.tsx` flaky, khả năng tìm thấy Diễn giải trước khi chọn).
3. `ACCEPTED GAP` yêu cầu Owner duyệt riêng từng ID; **KG-F5M4-01** hiện mang nhãn này nhưng tôi chưa thấy tham chiếu phê duyệt trong repo ⇒ đề nghị Owner ghi rõ ở Matrix M8.
4. Gap mới chỉ ghi khi có evidence (mock GeoNames, E2E M6 mock, artifact CI chỉ khi fail, docs-debt `InterpretationCard`, README lỗi thời).
5. Mỗi release-blocking gap có disposition: *Resolved / Accepted (Owner) / Deferred (sprint cụ thể) / Blocking*.

---

## 18. Risk Register

| ID | Rủi ro | Xác suất | Tác động | Mức | Phát hiện | Giảm thiểu | Owner/Quyết định | Rủi ro dư |
|---|---|---|---|---|---|---|---|---|
| R1 | Seed không có Mars phù hợp | Thấp (seed có 24 mục Mars) | Cao | TB | assert seed có entry; `--validate-only` | Dừng + blocker, không mock | — | Thấp |
| R2 | `interpretationVersion` null mà UI vẫn render | Thấp | Cao | TB | assert `!== null` & `=== seed.version`; step-summary | assertion cứng; không chỉ kiểm UI | — | Thấp |
| R3 | Test pass với `interpretations` rỗng | Thấp | Cao | TB | assert entry Mars tồn tại + `bodyText === seed` | nguồn kỳ vọng độc lập (7.0.1) | — | Thấp |
| R4 | Không tạo được Scenario B bằng Backend thật | Thấp (S2.3 đã tạo được) | Cao | TB | chạy S2.x/B3 | blocker có evidence, không mock | Owner nếu xảy ra | Thấp |
| R5 | DB/seed không deterministic | Thấp (DB CI mới) | TB | Thấp | log seed; unique email | không phụ thuộc dữ liệu cũ | — | Thấp |
| R6 | CI thiếu env/service | Thấp (đã đủ) | Cao | TB | step log | không đổi CI trừ D-M7-03 | — | Thấp |
| R7 | F4 hồi quy do F5 đổi selection | Thấp | Cao | TB | 38 F4 + 10 M6 pass | chạy toàn suite | — | Thấp |
| R8 | Playwright flake | TB | TB | TB | JSON `flaky`; chạy `retries=0` cục bộ | chờ xác định; flaky≥1 ⇒ điều tra | — | TB |
| R9 | Số test ≠ 38 | **Đã xảy ra** (48 hiện tại) | Thấp | Thấp | `--list` theo file | ghi "38 = 7 file F4"; không sửa test cho khớp | Owner xác nhận cách đọc AC-29 (D-M8-07) | Thấp |
| R10 | Test cũ có anti-pattern | **Đã xảy ra** (1 hit M6) | TB | TB | grep M7.4 | gỡ bằng chờ xác định (D-M7-01) | Owner | Thấp sau sửa |
| R11 | A-2 thiếu source of truth rõ | Thấp | TB | Thấp | đọc F5 plan dòng 90 | source of truth = hợp đồng thật; Owner xác nhận | D-M8-01 | Thấp |
| R12 | CHANGELOG lệch implementation | TB | TB | TB | bảng bullet ↔ evidence | chỉ ghi điều đã xác minh | — | Thấp |
| R13 | Owner chưa duyệt D-F5-08 | **Hiện tại: chưa có bằng chứng duyệt** | TB | TB | grep repo | không bump; `[Unreleased]`; ghi Pending | **D-F5-08** | Không chặn đóng, chặn tuyên bố version |
| R14 | Version/lockfile lệch | Thấp | TB | Thấp | script kiểm 3 giá trị | dùng `npm version --no-git-tag-version` (đã kiểm trên bản sao) | — | Thấp |
| R15 | Đóng Known Gap nhầm | TB | Cao | TB | rà evidence từng gap | không xoá nếu thiếu evidence | Owner | Thấp |
| R16 | Matrix ghi Pass không có artifact | TB | Cao | Cao | script/AC checklist | quy tắc "Pending nếu thiếu"; AC-01…12 truy vết ID | — | Thấp |
| R17 | Báo cáo đóng tuyên bố sớm | TB | Cao | Cao | review độc lập | dùng từ vựng trạng thái; Owner nghiệm thu | Owner | Thấp |
| R18 | Commit chỉ-docs không chạy CI (paths filter) | Chắc chắn | TB | TB | xem workflow | evidence CI từ commit chạm `frontend/**` | — | Thấp |
| R19 | CI `retries: 2` che flake | TB | TB | TB | JSON `flaky` | báo `flaky` riêng, không ghi pass sạch | — | TB |
| R20 | Tài liệu lỗi thời gây hiểu nhầm (README E2E, Draft, A-1) | Chắc chắn | Thấp | Thấp | đọc | ghi gap/sửa theo D-M8-08 | Owner | Thấp |
| R21 | Sửa file M6 (`waitForTimeout`) làm đổi số đo M6 | Thấp | TB | Thấp | chạy lại 10/10 | thay bằng chờ xác định tương đương | D-M7-01 | Thấp |

---

## 19. Owner Decisions

### 19.1 D-F5-08 — Version `0.4.0`
| Trường | Nội dung |
|---|---|
| Trạng thái hiện tại | **APPROVED BY OWNER (2026-11-09)** |
| Bằng chứng duyệt | Quyết định trực tiếp của Owner trong phiên làm việc 2026-11-09 duyệt bump version lên 0.4.0 |
| Thẩm quyền | Owner của dự án (người nghiệm thu F5) |
| Tác động thực hiện | Đã sửa 3 giá trị version (`frontend/package.json` = `0.4.0`, 2 vị trí trong `frontend/package-lock.json` = `0.4.0`) qua `npm version 0.4.0 --no-git-tag-version --ignore-scripts` + cập nhật `frontend/CHANGELOG.md` mục `## [0.4.0] - 2026-11-09` |
| Có chặn đóng M8 không | **ĐÃ GIẢI TỎA (UNBLOCKED)** |

### 19.2 Trạng thái phê duyệt các quyết định (Owner approved 2026-11-09)
| ID | Nội dung câu hỏi | Phương án được chọn | Trạng thái | Ghi chú thực thi / Kết quả |
|---|---|---|---|---|
| **D-M7-01** | `waitForTimeout(300)` ở spec M6 (vi phạm AC-29 literal) | **(a) Thay bằng chờ xác định** | **APPROVED & RESOLVED** | Đã thay bằng `waitForFunction` + `requestAnimationFrame`. Grep anti-pattern = 0. Chạy lại 10/10 test M6 PASS trong 19.6s. Unblocked Gate-M7 |
| **D-M7-02** | Helper E2E cho spec mới | **(a) Sao chép helper tối thiểu** | **APPROVED** | Giữ an toàn, không sửa spec F4 |
| **D-M7-03** | Cấu hình reporter CI | **(a) Giữ nguyên** | **APPROVED** | Mặc định HTML reporter |
| **D-M7-04** | Mock GeoNames trong Real Backend | **(a) Chấp nhận mock GeoNames** | **APPROVED** | Đúng tiền lệ F4; ghi rõ trong Evidence Matrix |
| **D-M7-05** | Chiến lược chạy Real Backend E2E | **Owner / CI** | **APPROVED** | Chạy CI và kiểm tra cục bộ khi có Backend |
| **D-M8-01** | Xác nhận A-2: hợp đồng thật là source of truth | **Hợp đồng thật là source of truth** | **APPROVED** | Unblocked M8.2 |
| **D-M8-02** | Sửa tham chiếu lan toả `InterpretationCard` | **(b) Sửa tối thiểu cả tham chiếu lan toả** | **APPROVED** | Loại bỏ card cũ ở Spec §12.6/§13, Design System, Architecture |
| **D-M8-03** | Heading CHANGELOG | **`## [0.4.0] - 2026-11-09`** | **APPROVED & RESOLVED** | Đã cập nhật mục `[0.4.0]` trong `frontend/CHANGELOG.md` |
| **D-M8-05** | Vị trí Known Gaps Registry F5 | **(a) File riêng** | **APPROVED** | Đặt tại `docs/implementation/archive/sprint-f5/Sprint_F5_Known_Gaps_Registry.md` |
| **D-M8-06** | Tên & vị trí báo cáo đóng Sprint | **Như đề xuất** | **APPROVED** | Đặt tại `docs/implementation/archive/sprint-f5/Sprint_F5_Final_Review_Report.md` |
| **D-M8-07** | Cách đọc AC-29 "38 E2E F4" | **38 = 7 file F4; M6 10 test tính riêng** | **APPROVED** | Tổng hiện tại: 48 (38 F4 + 10 M6) |
| **D-M8-08** | Sửa tài liệu lỗi thời (README, Draft, A-1) | **Sửa tối thiểu** | **APPROVED** | Cập nhật chính xác |
| **D-M8-09** | Tag/Release `v0.4.0`, merge `dev`→`main` | **Tách khỏi M8** | **APPROVED** | Quyết định độc lập của Owner sau sprint closure |
| **D-M8-10** | Cách thức đóng Sprint F5 | **"Completed with accepted limitations"** | **APPROVED** | Đóng sprint kèm accepted limitations & versioning 0.4.0 |
| **D-M8-11** | Xác nhận phê duyệt KG-F5M4-01 (ACCEPTED GAP) | **Đã duyệt** | **APPROVED** | Đã ghi nhận trong Matrix & Registry |
| **D-M8-12** | Tiêu chí nghiệm thu chính thức F5 | **Owner ký nghiệm thu** | **APPROVED** | Thực hiện khi đủ bằng chứng M7-M8 |

---

## 20. Definition of Done

**M7 DoD** — (1) Scenario A xanh với Backend thật + seed thật; (2) `interpretationVersion` string `!== null` (`=== seed.version`); (3) nội dung Mars khớp seed (cung + nhà); (4) Scenario B xanh với Backend thật; (5) không có diễn giải Nhà/Cung Mọc không hợp lệ; (6) chú thích hiển thị; (7) không error state do degraded hợp lệ; (8) 38 F4 + 10 M6 pass, `skipped=0`, `flaky` ghi rõ; (9) grep anti-pattern = 0 trên toàn `e2e/` (kể cả xử lý D-M7-01); (10) CI run + log/step-summary có evidence; (11) spec mới không mock ngoài `locations/search`.

**M8 DoD** — (1) Spec §12.6/§13 as-built, chỉ sửa tối thiểu; (2) A-2 giải quyết có căn cứ; (3) CHANGELOG cập nhật đúng chuẩn; (4) D-F5-08 xử lý đúng quy trình; (5) version + lockfile đồng bộ **nếu** được duyệt (nếu không: trạng thái Pending, không đổi file); (6) registry cập nhật; (7) Matrix M7 + M8 hoàn chỉnh (AC-01…30 + §18); (8) AC-30 và §18 xác minh; (9) báo cáo đóng dựa trên evidence, dùng đúng từ vựng trạng thái. Nếu versioning Pending: ghi rõ và áp dụng quyết định D-M8-10.

---

## 21. Sprint Exit Criteria (= §18 Definition of Done của F5 plan, kiểm theo checklist)

| # | Điều kiện §18 | Bằng chứng cần có | Cần Owner approval? |
|---|---|---|---|
| 1 | Scope đã duyệt hoàn tất (hoặc thay đổi được Owner duyệt) | Matrix M1–M7 + báo cáo | Có (nghiệm thu) |
| 2 | Gate Mục 12 xanh (CI cho phần không chạy cục bộ) | log gates + CI run URL | Không |
| 3 | AC-01…30 có bằng chứng | Matrix M8 (không Pass nếu thiếu) | Không (nhưng Partial cần ghi) |
| 4 | Hồi quy F4 đã kiểm | M7.3 | Không |
| 5 | QA a11y/responsive ghi riêng; phần chưa kiểm = Known Gap | Matrix M6 + registry | Có (ACCEPTED GAP) |
| 6 | Không đổi Backend/API/kiến trúc ngoài phạm vi | `git diff --stat` | Không |
| 7 | Known Gaps + Matrix + CHANGELOG + Spec cập nhật | M8.1–M8.6 | Không |
| 8 | Version `0.4.0` chỉ khi Owner xác nhận | D-F5-08 | **Có** |
| 9 | Owner chính thức nghiệm thu | chữ ký/ghi nhận của Owner | **Có** |

---

## 22. Rollback / Recovery Strategy

- **Spec E2E mới:** thay đổi cộng thêm; nếu gây flake/CI đỏ ⇒ sửa hoặc `git revert` commit spec (**không** `test.skip`); nếu Scenario B không tạo được ⇒ ghi blocker, không mock.
- **Sửa `waitForTimeout` (D-M7-01):** `git revert` một dòng nếu số đo M6 đổi; chạy lại 10/10.
- **Cấu hình CI/Playwright (D-M7-03):** revert commit cấu hình; không ảnh hưởng mã ứng dụng.
- **Tài liệu:** `git revert` từng commit docs; Matrix/báo cáo là file mới ⇒ xoá được.
- **Version:** nếu đã bump nhầm ⇒ revert commit 3 giá trị; **không** tạo tag trước khi Owner xác nhận; nếu đã tạo tag nhầm ⇒ quyết định Owner (không tự xoá).
- **Trạng thái dở dang:** nếu M7 xanh nhưng M8 chưa xong ⇒ ghi M7 `COMPLETED`, M8 `IN PROGRESS`; **không** tuyên bố F5 hoàn tất.

---

## 23. Estimated Effort and Sequencing

Không có số liệu vận tốc đáng tin trong repo ngoài ngày commit của từng milestone (M5 ≈ 1 ngày, M6 ≈ 2–3 ngày) ⇒ chỉ đưa **độ phức tạp** và ước lượng thô (**[REC], độ tin cậy thấp**):

| Task | Độ phức tạp | Ghi chú |
|---|---|---|
| M7.0 | S | baseline + hỏi Owner |
| M7.1 | M | selector nút bảng, đường dẫn seed ESM |
| M7.2 | M | assertion degraded |
| M7.3 | S | chạy + thống kê |
| M7.4 | S | grep + 1 dòng M6 |
| M7.5 | S–M | tuỳ D-M7-03 |
| M8.1/M8.2 | M | viết as-built có nguồn |
| M8.3 | S | |
| M8.4 | S | chỉ nếu duyệt |
| M8.5 | M | đối chiếu nhiều nguồn |
| M8.6 | M–L | truy vết AC-01…12 |
| M8.7 | M | |
Tổng quan: M7 ≈ 1–2 phiên làm việc, M8 ≈ 2 phiên; **thứ tự:** hỏi D-F5-08/D-M7-01 sớm → M7.0 → (M7.1∥M7.2 ∥ soạn M8.1–M8.3) → M7.3 → M7.4 → M7.5 → Gate-M7 → M8.4(đk) → M8.5 → M8.6 → M8.7 → Owner nghiệm thu.

---

## 24. Open Questions and Assumptions

**Giả định (cần xác nhận khi thực thi):** (A1) tên accessible của nút Planet Table cho Mars — verify khi viết A4; (A2) cách resolve đường dẫn seed trong ESM của Playwright — verify; (A3) `backend/docker-compose.test.yml` có dùng được cho Postgres E2E cục bộ — chưa đọc; (A4) Backend CI không giới hạn tốc độ đăng ký đủ để 2 user mới gây lỗi — [UNK], rủi ro thấp (đã có 4 user ở các spec F4).

**Câu hỏi mở:** (Q1) PR đang mở (GitHub hiển thị 1) là PR nào và chiến lược merge `dev`→`main` sau M8? (Q2) Owner có chạy được Backend + Docker cục bộ để thu log `list`/JSON? (Q3) Chính sách retention artifact của repo/org? (Q4) Có muốn đóng F5 khi D-F5-08 chưa duyệt (D-M8-10)? (Q5) Có muốn gỡ plan M6 và plan này theo quy ước ngay sau nghiệm thu?

**Không xác minh được trong lần audit này:** kết quả chạy E2E (Backend/Playwright không chạy được); nội dung PR mở; log chi tiết từng bước CI; độ chính xác thiên văn của Backend (ngoài phạm vi).

---

## 25. Audit Evidence and Source References

**Đã đọc/chạy trên `dev` @ `b6daa47`** (clone nhánh `dev`):
- Prompt: `Sprint_F5_M7-8_Implementation_Plan_Prompt.md`.
- Plan/AC: `docs/implementation/Sprint_F5_Implementation_Plan.md` (dòng 12, 89–90, 141–142, 278–279, 339–345, 378–392, 432–434, 445–473, 477–516, 520–553).
- Matrix: `archive/sprint-f5/Sprint_F5_M{1..6}_Exit_Criteria_Evidence_Matrix.md` (tiêu đề/trạng thái, AC được nhắc, KG-F5M6-01/02); `archive/sprint-f4/Sprint_F4_M11_Exit_Criteria_Evidence_Matrix.md` (cấu trúc, mục "Known Gaps Registry"); `archive/sprint-f3/Sprint_F3_Known_Gaps_Registry.md`; `archive/sprint-4/Sprint_4_Final_Review_Report.md` (cấu trúc).
- Spec: `docs/frontend/Frontend_UI_Specification.md` (dòng 78, 689, 696, 853–868, 925–945, 1007); tham chiếu `InterpretationCard` ở Architecture/Design System Spec.
- E2E/CI: `frontend/e2e/*.spec.ts` (cấu trúc, grep anti-pattern, đếm), `frontend/playwright.config.ts`, `.github/workflows/frontend-ci.yml`, `frontend/package.json`, `backend/package.json`, `backend/prisma/seed-content.ts`, `backend/prisma/content/interpretations.vi.json` (252 mục; Mars 24), `frontend/README.md` (dòng 52–69).
- Mã UI: `InterpretationItem.tsx`, `InterpretationPanel.tsx`, `interpretationCopy.ts`, `model/interpretation.ts` (`getInterpretationItemId`).
- Version: `frontend/package.json`, `frontend/package-lock.json`, `frontend/CHANGELOG.md`; `git tag -l` ⇒ `v0.3.0` @ `37b556f` → `cfd4247`.
- CI: run #327 (`930a161`) Success 5m10s [đã mở trang tóm tắt, không xem được log].
- **Lệnh tôi đã chạy:** `git fetch/pull`, `CI=1 npx playwright test --list` (48/8), grep anti-pattern, `npm version 0.4.0 --no-git-tag-version --ignore-scripts` **trên bản sao tạm `/tmp`** (chỉ đổi 3 giá trị), các lệnh đọc file. Không sửa repo.
- **Chưa xác minh:** mọi kết quả E2E; trang PR; retention artifact.

**Xác nhận:** tài liệu này **không** sửa mã ứng dụng, test, workflow, CHANGELOG, version, lockfile hay tài liệu as-built; **chưa được Owner duyệt**.
