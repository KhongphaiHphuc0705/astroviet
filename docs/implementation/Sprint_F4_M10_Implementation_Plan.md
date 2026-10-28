# AstroViet — FE F4 M10 Implementation Plan
## Integration / Regression / QA

**Phiên bản:** v1.0 (bản nháp để owner duyệt) · **Ngày audit:** 2026-10-27 · **Repo:** `KhongphaiHphuc0705/astroviet`, nhánh `dev`, HEAD `25f9b6c` (commit code cuối `3827277`, CI #287 Success)
**Phạm vi:** chỉ lập kế hoạch. Không sửa file nào trong repo; `node_modules`, `.env`, `dist/` chỉ có trong bản clone sandbox. Không cài package vào repo.
**Vị trí đề xuất khi commit:** `docs/implementation/Sprint_F4_M10_Implementation_Plan.md` (blueprint tạm; xoá khi đóng M10 — quy ước M4–M9).

**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `BLOCKED` · `NOT APPLICABLE` · `DEFERRED` · `PLANNED` (kiểm chứng đã lên kế hoạch, chưa chạy). **Quyết định:** `inherited` (đã duyệt) · `proposed` · `unresolved`.
**Nguồn bằng chứng:** `[repo]` mã/tài liệu · `[run]` lệnh đã chạy trong sandbox · `[ci]` trang GitHub Actions công khai · `[owner]` xác nhận của owner. Trang log từng bước CI cần đăng nhập nên **không** đọc được; trạng thái `Success` của job được dùng, không suy diễn thêm.

---

## 1. Executive Summary

M10 (= **FE-S4.10**) là milestone cuối của Sprint F4 — **Natal Chart Viewer**: E2E, hồi quy, cổng chất lượng, kiểm chứng tương thích Backend, QA thủ công, rà ranh giới kiến trúc, cập nhật tài liệu, Evidence Matrix, đóng sprint. M10 **không** thêm tính năng, **không** đổi Backend/API, **không** sang F5.

**Phát hiện audit làm thay đổi kế hoạch (đều có bằng chứng):**

1. **Hạ tầng E2E đã chạy với Backend thật.** `frontend-ci.yml` dựng Postgres 16 + Backend (`prisma:deploy`, `node dist/server.js`, `NODE_ENV=test`) rồi chạy `npm run test:e2e` trên Chromium. CI #287 xanh ⇒ có sẵn đường kiểm chứng Backend thật **trong CI**. Sandbox không dựng được Postgres/Backend nên kiểm chứng này chỉ có bằng chứng `[ci]` (mục 7, 10).
2. **`frontend/e2e/chart.spec.ts` chưa tồn tại → tạo mới.** Đã có 6 spec: `smoke`, `auth`, `birth-profile`, `chart-list`, `layout`, `Select`. Riêng `chart-list.spec.ts` (M11) đã phủ hành trình *đăng ký → hồ sơ → tính lá số → danh sách → mở viewer → cô lập hai tài khoản → 404/403 khi truy cập chart người khác*. Vì vậy hai kịch bản chính của M10 phải tập trung vào **nội dung và hành vi của Chart Viewer trên dữ liệu thật** và **đường suy giảm**, **không lặp lại** hành trình đã có.
3. **Mục 49 yêu cầu "E2E hai tài khoản" cho Saved Charts List.** Prompt M10 yêu cầu đúng **hai** kịch bản E2E chính. Hai yêu cầu không mâu thuẫn: tiêu chí hai tài khoản **đã được `chart-list.spec.ts` đáp ứng** và nằm trong bộ hồi quy E2E (không phải kịch bản chính thứ ba). M10 chỉ phải chứng minh nó vẫn xanh trên commit cuối.
4. **Kịch bản suy giảm có thể chạy với Backend thật, không cần mock.** Backend chỉ tính nhà khi `birthData.isBirthTimeKnown` (`chart-builder.ts:73-90`; `isHouseDataAvailable: houses.length === 12`); form hồ sơ có checkbox **"Tôi biết rõ giờ sinh của mình"** (mặc định bật, tắt ⇒ `birthTime=null`). Do đó "hồ sơ không rõ giờ sinh → tính lá số" cho `isHouseDataAvailable=false` **trên đường API thật** (cần xác minh bằng một probe ở M10.2; dự phòng: fixture CAPTURED `fixture_nohouse.json`).
5. **Đối chiếu hợp đồng `ChartResponse`:** 14 trường của schema Backend (`chart-response.mapper.ts`) **khớp từng trường** với `ChartResponse` phía frontend; khác biệt duy nhất đáng ghi: Backend `chartType: z.string()` còn frontend khoá literal `"Natal"` (stricter) — rủi ro thấp (Backend chỉ hỗ trợ Natal), ghi KG-M10-04.
6. **Phiên bản không nhất quán sẵn có:** `frontend/package.json` = `0.2.0` nhưng `frontend/package-lock.json` ghi `0.1.0` (cả `version` gốc và `packages[""]`) `[repo]`. Quy ước đã quan sát: F1&F2 → `0.1.0`, F3 → `0.2.0` (một lần nâng minor mỗi sprint) — nhưng **quy ước chính thức chưa được tài liệu hoá**, nên số phiên bản đóng F4 phải do owner xác nhận (D-M10-04); plan **không** tự đặt số.
7. **Tài liệu route đang sai so với mã (FG-09, FG-08 của F4 plan Mục 47 — "Should fix before closure"):** UI Spec §14 liệt kê `/chart/new`, `/chart/:chartId`, `/app → /app/charts`, `/app/settings`, `/knowledge*`; mã thực tế có `/app/profiles/new`, `/app/profiles/:id/edit`, `/app/charts`, `/app/charts/:chartId` và không có các route kia. UI Spec §12.5 vẫn nói wheel là `role="img"` trong khi mã dùng `role="group"` + nút `role="button"` cho hành tinh. Đây là **việc tài liệu của M10**, không phải lỗi mã.
8. **Chẩn đoán lỗi E2E còn thiếu:** CI chỉ tải lên `backend.log` khi thất bại; **không** tải báo cáo Playwright/trace/video dù cấu hình đã bật (`trace: "on-first-retry"`, `screenshot/video` khi lỗi). Đề xuất nhỏ ở D-M10-07.
9. **Nợ ngoài phạm vi (không mở rộng):** 12 `TODO(Core)` có sẵn (không cái nào trong code chart), drawer mobile thiếu focus trap, `href="/"` ở nav, cảnh báo Node 20 ở CI.

**Thiết kế đề xuất (nhỏ nhất đủ yêu cầu):**
- Tạo **một** file `frontend/e2e/chart.spec.ts` với **hai** kịch bản chính, dùng Backend thật, email tổng hợp duy nhất theo lần chạy, chọn phần tử theo vai trò/tên truy cập, không `sleep`.
- Kịch bản 1 = hành trình thành công tới viewer + nội dung (wheel, ba bảng, đồng bộ chọn) + quay lại danh sách. Kịch bản 2 = hồ sơ **không rõ giờ sinh** (suy giảm hợp lệ).
- Không refactor các spec cũ; helper cục bộ trong `chart.spec.ts`.
- Hồi quy = toàn bộ test hiện có (130 file / 1041 test) + toàn bộ E2E hiện có, không làm yếu test nào.
- Tài liệu: sửa UI Spec §12.5/§13–§14, CHANGELOG, version (theo quyết định), F4 plan Mục 47/45, tạo **Evidence Matrix M10** làm bản đóng sprint.

**Trạng thái kết luận: `CONDITIONALLY READY`** — không có blocker kỹ thuật; cần owner xác nhận 5 quyết định (Mục 20.1) — chủ yếu số phiên bản F4, phạm vi sửa tài liệu, và việc chấp nhận bằng chứng thiết bị hạn chế.

---

## 2. Milestone Objective

**FE F4 M10 — Integration / Regression / QA** (F4 plan dòng 634–641). Mục tiêu (đúng văn bản): *"E2E, hồi quy, cổng chất lượng, tài liệu, Evidence Matrix."*

1. Xác minh E2E hành trình F4 hoàn chỉnh (hai kịch bản chính).
2. Hồi quy toàn bộ milestone đã hoàn thành (S4.1–S4.9, S4.11).
3. Xác minh tương thích Frontend–Backend (fixture/contract **và** Backend thật).
4. Cổng chất lượng (F4 plan Mục 46).
5. QA thủ công.
6. Rà ranh giới kiến trúc.
7. Cập nhật tài liệu (UI Spec §14, CHANGELOG, version).
8. Rà soát Known Gaps.
9. Evidence Matrix.
10. Đóng sprint (đóng milestone ≠ phát hành ≠ đổi version — Mục 19).

Preconditions (F4 plan dòng 641 "Dependencies: tất cả"; prompt: S4.9 hoàn tất): S4.9 hoàn tất **về mã và CI** — VERIFIED (Mục 6); phần thủ công của S4.9 có `ACCEPTED GAP` được ghi (Mục 7).

## 3. Current Repository State

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Nhánh `dev` HEAD `25f9b6c` (2026-10-26, docs); commit code cuối `3827277` ("evidences and audit code after manual test") | VERIFIED | `[run]` `git log` |
| CI #287 (`Frontend CI`, push `dev`, commit `3827277`): **Success**, 4m3s, job `build` 3m58s, 1 cảnh báo (Node 20 deprecated cho `checkout@v4`, `setup-node@v4`) | VERIFIED | `[ci]` run `40256277594` |
| HEAD `25f9b6c` chỉ đổi `docs/**` (xoá plan M9, cập nhật Matrix M9) ⇒ evidence commit = `3827277` theo quy ước D-C3 | VERIFIED | `[run]` `git show --stat` |
| Chạy lại trên HEAD: `format:check`, `lint`, `typecheck`, `build` đều **exit 0**; Vitest **130 file / 1041 test, tất cả qua** (53 file/657 test ở `features/chart`+`pages`; 77 file/384 test còn lại) | VERIFIED | `[run]` |
| **Chưa** chạy trong sandbox: `test:coverage`, `test:e2e`, backend/Postgres | UNVERIFIED trong phiên này | CI #287 đã chạy cả hai (job Success) |
| Cấu trúc: gốc repo; `frontend/` (React 18 + TS + Vite + Tailwind, FSD); `backend/` (Express + Prisma, v0.4.0); `docs/` | VERIFIED | `[run]` `ls` |
| E2E: Playwright (`frontend/e2e/*.spec.ts`, `playwright.config.ts`, chỉ project `chromium` Desktop Chrome, `baseURL http://localhost:5173`, `webServer: npm run dev`, CI `retries: 2`, `workers: 1`) | VERIFIED | `[repo]` |
| Tài liệu: `docs/implementation/` (`Sprint_F4_Implementation_Plan.md`, `archive/sprint-f4/` có Matrix **M1–M9, M11**), `docs/frontend/Frontend_UI_Specification.md`, `frontend/CHANGELOG.md` (Keep a Changelog + SemVer) | VERIFIED | `[run]` `ls` |
| Phiên bản: `frontend/package.json` `0.2.0`; `frontend/package-lock.json` `0.1.0`; `backend/package.json` `0.4.0` | VERIFIED | `[repo]` |
| Không có thay đổi `dependencies`/`devDependencies` của frontend kể từ khi đóng F3 (chỉ `scripts`/`lint-staged`) | VERIFIED | `[run]` `git diff a369019 HEAD -- frontend/package.json` |

## 4. Approved F4 Plan v1.1 and O-F4-2 Option B

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| F4 plan v1.1 là tài liệu thẩm quyền, `READY FOR IMPLEMENTATION` | VERIFIED | `docs/implementation/Sprint_F4_Implementation_Plan.md` dòng 6 |
| Quyết định O-F4-2 = **phương án B** (danh sách chart tối thiểu qua `GET /charts`), milestone **FE-S4.11** | VERIFIED | dòng 12–17, 643; Evidence Matrix M11 |
| **Mục 46 — Quality Gates** tìm thấy | VERIFIED | dòng 791–807 (Mục 15) |
| **Mục 49 — Definition of Done** tìm thấy | VERIFIED | dòng 848–861 (Mục 37) |
| Mục 45 Regression Matrix, Mục 47 Known Gaps (FG-01…14), Mục 48 Risks | VERIFIED | dòng 776, 809, 828 |
| Ghi chú nhất quán: Mục 45 còn baseline cũ "78 file / 391 test"; hiện **130 / 1041** | tài liệu cũ, cập nhật ở M10.6 | `[run]` |

**Mâu thuẫn tài liệu cần ghi nhận (không tự sửa nội dung đã duyệt):**

| # | Nội dung | Tác động | Xử lý nhỏ nhất |
|---|---|---|---|
| X1 | Prompt M10: "đúng hai kịch bản E2E chính"; Mục 49: "E2E hai tài khoản" cho Saved Charts List | có thể bị đọc thành kịch bản thứ ba | giữ hai kịch bản chính; `chart-list.spec.ts` (đã có) là bằng chứng hai tài khoản và phải xanh |
| X2 | F4 plan dòng 638 "Likely change: `e2e/chart.spec.ts`" nhưng file **chưa tồn tại** | không phải xung đột — cần *tạo* | CREATE |
| X3 | F4 plan dòng 638 "ghi chú route trong UI Spec **§14**" nhưng UI Spec §14 sai so với mã (FG-09) | M10 phải sửa tài liệu, không chỉ "ghi chú" | Mục 18 |
| X4 | UI Spec §12.5 (`role="img"`) ≠ mã (`role="group"` + `button`) — FG-08 | tài liệu lạc hậu | Mục 18 |
| X5 | UI Spec §15 coi Zustand cho Global UI State; F4 plan §13 cấm store mới cho chart | không mâu thuẫn: 3 store (`authStore`, `preferenceStore`, `uiStore`) có từ trước F4 | Mục 17 |

## 5. Approved Milestone Execution Order

```text
S4.1 → S4.2 → S4.3 → S4.11 → S4.7 → S4.4 → S4.5 → S4.6 → S4.8 → S4.9 → S4.10
```

Thứ tự khớp văn bản F4 plan (tiêu đề `### FE-S4.x` ở dòng 524, 540, 554, 568, 582, 595, 605, 615, 625, 634, 643). **Không đổi thứ tự, không đánh số lại.** `S4.11` là *Saved Charts List* (không do S4.3 hay S4.9 cung cấp — đã kiểm: `ChartListPage` và `listCharts.ts` thuộc M11, Matrix M11 có bằng chứng riêng). "M*n*" trong hội thoại ≡ `FE-S4.n`; Evidence Matrix đặt tên `Sprint_F4_M{n}_Exit_Criteria_Evidence_Matrix.md`.

## 6. Previous Milestone Verification

> Kiểm tra theo **mã và tài liệu hiện tại**, không chỉ nhãn "complete". Mỗi dòng ghi: phạm vi (F4 plan), bằng chứng, test, tồn đọng, liên quan hồi quy M10, chặn?

| Milestone (thứ tự duyệt) | Phạm vi theo F4 plan | Bằng chứng (repo/CI) | Test hiện có | Tồn đọng đã ghi | Liên quan M10 | Trạng thái |
|---|---|---|---|---|---|---|
| **S4.1** Chart API/DTO/Data Hooks | `createNatalChart/getChart/listCharts`, `types.ts`, fixtures thật | `features/chart/api/*`; Matrix M1 (CI #231…) | `api/*.test`, `fixtures.contract.test.ts` | typecheck từng là no-op (đã sửa M1) | tương thích hợp đồng (Mục 10) | **VERIFIED** |
| **S4.2** ViewModel/Adapter | `chartViewModel.ts`, `labels.ts`, `format.ts` | Matrix M2 (CI #231) | `chartViewModel.test.ts`, `labels.test.ts`, `format.test.ts` | KG-M2-02 (nguyên tố) defer | `ChartResponse`→VM, `isHouseDataAvailable` | **VERIFIED** |
| **S4.3** Calculate Flow & Viewer Shell | nút "Tính lá số", route `/app/charts/:chartId`, trạng thái tải/lỗi/rỗng | Matrix M3 (CI #233); `pages/app/charts/detail/page.tsx` | `page.test.tsx`, E2E `chart-list` bước 3 | `<title>` động/focus sau điều hướng (OQ-M8-1/2) debt | luồng tính lá số, lỗi 403/404 | **VERIFIED** |
| **S4.11** Saved Charts List (v1.1) | `GET /charts`, `/app/charts`, nav, cô lập tài khoản | Matrix M11 (CI #247); `ChartListPage` | component + `chart-list.spec.ts` (hai tài khoản) | FG-02 (xoá/trùng) defer; FG-13/14 cần Backend | **trực tiếp trong E2E/hồi quy** | **VERIFIED** |
| **S4.7** Planet/House/Aspect Tables | ba bảng + thẻ mobile, `AspectFilterChip` | Matrix M7 | test từng bảng | — | bảng ≡ dữ liệu API | **VERIFIED** |
| **S4.4** Chart Wheel Foundation | geometry, 12 cung, nhà, góc | Matrix M4 (CI #263) | `geometry/wheelGeometry` + layer tests | KG-M4-04/05/06 (đã xử lý ở M9) | wheel render | **VERIFIED** |
| **S4.5** Planet Rendering | glyph, ℞, marker, dàn nhãn | Matrix M5 (CI #269) | `labelLayout/planetGeometry/PlanetLayer` | KG-S45-02/06 (glyph/thiết bị) `ACCEPTED GAP` | vị trí hành tinh theo API | **VERIFIED** (+ gap thủ công) |
| **S4.6** Aspect Rendering | `aspectGeometry`, `AspectLayer`, công tắc, legend | Matrix M6 (CI #276) | `aspectGeometry.test` (26), layer tests | KG-M6-08 tương phản nét Căng thẳng nền sáng 2,56:1 | aspect hiện/ẩn | **VERIFIED** (+ gap) |
| **S4.8** Interaction & Sync | `selection.ts`, đồng bộ wheel↔bảng↔detail, live region | Matrix M8 (CI #281) | `selection.test`, Shell, layer tests | KG-M8-01 thiết bị/trình đọc màn hình; KG-M8-04 aspect pointer-only | đồng bộ chọn | **VERIFIED** (+ gap) |
| **S4.9** Responsive + A11y | ba chế độ, zoom, khung, skip link, reduced motion | Matrix M9 (CI #287, evidence `3827277`) trạng thái `PASS (READY FOR OWNER REVIEW / CLOSURE)` | test viewport, zoom, skip link | KG-M9-01 sticky chỉ khi cao ≥ 1000 px; SR/thiết bị `ACCEPTED GAP` | responsive/a11y | **VERIFIED** về mã/CI; đóng thủ công chờ owner |
| **S4.10** | Integration/Regression/QA | — | — | — | **milestone hiện tại** | — |

**Bất thường cần ghi:** (i) Matrix M7 ghi *Commit Head* `e653f61` và CI run không có số thứ tự (khác quy ước evidence-commit về sau) — không phải lỗi, ghi nhận để M10 không dẫn nhầm; (ii) Matrix M9 chưa chuyển sang `ACCEPTED BY OWNER` như M6/M8 — **tiền điều kiện mềm** của M10 (Mục 7).

## 7. Preconditions and Blockers

| # | Tiền điều kiện | Trạng thái | Cách xử lý nếu chưa đạt |
|---|---|---|---|
| P1 | S4.9 hoàn tất mã + CI xanh trên evidence commit | **VERIFIED** (CI #287 / `3827277`) | — |
| P2 | Owner chấp nhận đóng M9 (ghi `ACCEPTED BY OWNER` hoặc tương đương) | **chưa ghi** trong Matrix M9 | owner xác nhận trước M10.2; **không** chặn việc viết E2E nhưng **chặn đóng F4** |
| P3 | Backend sẵn sàng cho E2E (Postgres + `node dist/server.js` trong CI) | **VERIFIED `[ci]`** (workflow + CI #287); **không dựng được trong sandbox** | chạy E2E **trên CI** hoặc máy owner có Postgres; ghi rõ môi trường |
| P4 | Fixture CAPTURED (`fixture_full`, `fixture_nohouse`, `interpretationVersion "1.0"`) | VERIFIED | — |
| P5 | `GEONAMES_USERNAME` | CI dùng placeholder; E2E hiện **mock** `locations/search` (không gọi dịch vụ ngoài) | giữ cách mock đã có |
| P6 | Không có blocker mở ở M1–M9, M11 | VERIFIED (các Known Gap đã phân loại, không có `Blocking`) | nếu phát hiện lỗi: dừng M10, mở sửa lỗi theo quy trình `M*.n` như M5/M6/M8/M9 |

**Quy tắc blocker:** một predecessor có lỗi `P0/P1` (Mục 19) ⇒ **không bắt đầu đóng F4**; sửa ở một task sửa lỗi riêng (đặt tên theo tiền lệ `M9.6`) rồi chạy lại cổng. Một predecessor chỉ thiếu bằng chứng thủ công đã được `ACCEPTED GAP` ⇒ **không chặn**, nhưng phải xuất hiện trong Known Gaps cuối (Mục 20).

## 8. Scope

1. **E2E:** tạo `frontend/e2e/chart.spec.ts` (hai kịch bản chính).
2. **Hồi quy:** chạy toàn bộ test hiện có + toàn bộ E2E hiện có; thêm test chỉ khi có khoảng trống đã chứng minh (Mục 14).
3. **Tương thích Backend:** đối chiếu fixture/contract; bổ sung kiểm tra dung sai trường tuỳ chọn; xác minh bằng Backend thật qua E2E/CI.
4. **Cổng chất lượng** theo Mục 46; grep gate ranh giới.
5. **QA thủ công** + phân loại lỗi; ghi bằng chứng.
6. **Tài liệu:** UI Spec §12.5, §13–§14 (và ghi chú Recharts/Framer Motion nếu cần), `frontend/CHANGELOG.md`, `frontend/package.json` + `package-lock.json` (theo D-M10-04), F4 plan Mục 45/47, Evidence Matrix M10.
7. **Đóng sprint:** checklist Mục 35, khuyến nghị đóng.
8. **Chẩn đoán CI (tuỳ chọn, D-M10-07):** tải lên báo cáo Playwright khi E2E lỗi.

## 9. Out of Scope

| Hạng mục | Lý do / nơi xử lý |
|---|---|
| **F5:** giao diện Interpretation đầy đủ, trang chi tiết diễn giải, AI/tổng hợp nâng cao, CMS/admin diễn giải | F5. `interpretations` trong `ChartResponse` chỉ được kiểm là **không phá render** |
| Synastry, composite, transits, progressed, solar/lunar return, horary | ngoài F4 |
| Xuất PDF/ảnh, chia sẻ xã hội | ngoài F4 |
| Thiết kế lại UI, hình học wheel, đồng bộ chọn | đã đóng ở M4–M9 |
| Đổi Backend / `ChartResponse` / thêm `birthProfileId`, `isBirthTimeKnown`, `chartType` | FG-01/13/14 (**Requires Backend change**) |
| Xoá chart, loại trùng, guest chart (`/chart/new`) | FG-02, FG-03 — defer/separate decision |
| Pinch-to-zoom tuỳ biến | FG-05 |
| Dependency mới, framework E2E mới, visual-regression tooling | cấm (không có bằng chứng cần) |
| Drawer focus trap, `href="/"`, nâng Node 20 CI | nợ có sẵn (FG-10) |
| Refactor không liên quan để "dọn" kết quả audit | cấm |

## 10. Backend Contract and Compatibility Audit

### 10.1 Endpoint thực tế (đã đối chiếu hai phía)

| Chức năng | Backend (`chart.routes.ts`, `router.use('/api/v1/charts', …)`) | Frontend | Auth |
|---|---|---|---|
| Tính lá số | `POST /api/v1/charts/natal` (+ query `save`) · `validateQuery` + `validateBody` | `createNatalChart.ts` → `apiClient.post<ChartResponse>` | Bearer (apiClient + refresh) |
| Chi tiết | `GET /api/v1/charts/:id` (`chartIdSchema`) | `getChart.ts` (+ `isValidChartId.ts`) | Bearer |
| Danh sách | `GET /api/v1/charts` (`listChartsQuerySchema`) | `listCharts.ts` | Bearer; chỉ chart của user |
| Xoá | `DELETE /api/v1/charts/:id` | **không dùng** (FG-02) | — |
| Birth Profile / vị trí | `/api/v1/birth-profiles…`, `/api/v1/locations/search` | `features/birth-profile/api/*` | Bearer (vị trí: E2E mock) |

### 10.2 `ChartResponse` — so khớp trường (14/14)

Backend (`chartResponseSchema`): `id, chartType, houseSystem, isHouseDataAvailable, planets, houses, angles, aspects, patterns, interpretations, interpretationVersion (string|null), warnings, calculatedAt (ISO datetime), engineVersion` — frontend `ChartResponse` có **đúng** các trường đó. `interpretations[]` = `{subjectType, subjectKey, language, bodyText, tone?: string|null}` khớp `ChartInterpretationDto`. **Khác biệt:** `chartType` — Backend `string`, frontend literal `"Natal"` (KG-M10-04). `houses`/`angles` luôn là mảng (rỗng khi không có giờ sinh) — VM xử lý (`isHouseDataAvailable=false`).

### 10.3 Tương thích diễn giải (BE Sprint 4)

- Frontend **không tính** diễn giải và **không đọc** `interpretations` (VM không có tham chiếu `interpretation`; `grep` rỗng ở `chartViewModel.ts`) ⇒ **không là phụ thuộc ẩn của Chart Wheel**.
- Test hiện có: fixture CAPTURED có `interpretationVersion "1.0"`; render bình thường. **Khoảng trống:** chưa có test khẳng định rõ "`interpretations` rỗng / thiếu `tone` / `interpretationVersion: null` không làm vỡ viewer" → thêm 1 test hợp đồng nhỏ ở M10.3.
- Không đổi hợp đồng Backend; nếu phát hiện lệch thật → ghi KG, đề xuất nghị quyết nhỏ nhất.

### 10.4 Hai mức kiểm chứng (phân biệt rõ)

| Mức | Nội dung | Bằng chứng | Không được coi là |
|---|---|---|---|
| **A — Fixture/contract** | `fixture_full/nohouse` CAPTURED + DERIVED; `fixtures.contract.test.ts`; test VM | `[run]` Vitest | bằng chứng Backend thật |
| **B — Backend thật** | E2E Playwright gọi Backend trong CI (đăng ký/đăng nhập/profile/tính lá số/danh sách/chi tiết); Scenario 2 với hồ sơ không rõ giờ | `[ci]` `test:e2e` Success | bằng chứng nếu chỉ dùng `page.route` mock |

Scenario 1 và 2 chạy ở **mức B**. Mock (nếu Scenario 2 phải dự phòng) bị gắn nhãn `FIXTURE-BASED` và **không** được ghi là xác minh Backend.

---

## 11. E2E Strategy

**Hạ tầng (VERIFIED `[repo]`):** Playwright `@playwright/test`; `e2e/*.spec.ts`; một project `chromium` (Desktop Chrome, 1280×720); `webServer` chạy `npm run dev`; `baseURL http://localhost:5173`; CI: `retries: 2`, `workers: 1`; `trace: "on-first-retry"`, ảnh/video khi lỗi. Backend: **thật** (Postgres + Express trong job CI, `NODE_ENV=test`); chỉ **mock** `GET /api/v1/locations/search` bằng `page.route` (tránh gọi GeoNames). Email tổng hợp `@test.local`, duy nhất theo `Date.now()`.

**Nguyên tắc cho `chart.spec.ts`:**

| Nguyên tắc | Quy tắc |
|---|---|
| Dữ liệu | tài khoản + hồ sơ **tạo mới mỗi lần chạy** bằng email duy nhất; không phụ thuộc dữ liệu có sẵn; không xoá (không có UI xoá; DB CI tạm thời) |
| Backend | **thật**; mock duy nhất là tìm kiếm vị trí (đã là chuẩn của các spec hiện có) |
| Chân lý | giá trị ephemeris (độ, cung cụ thể) **không** hard-code; mọi so sánh nội dung lấy từ chính phản hồi `POST /api/v1/charts/natal` bắt bằng `page.waitForResponse` |
| Selector | `getByRole`/`getByLabel`/tên truy cập; không CSS class; `data-testid` chỉ khi đã có (`chart-viewer-shell`) |
| Chờ | `expect(...)` tự retry + `waitForResponse`; **cấm** `waitForTimeout`/`sleep` (hiện 0 chỗ dùng trong 591 dòng E2E — giữ nguyên) |
| Tuần tự | `test.describe.configure({ mode: "serial" })` cho mỗi kịch bản (theo tiền lệ `chart-list.spec.ts`) |
| Quan sát lỗi | gắn `page.on("pageerror")` và theo dõi phản hồi `/api/` có status ≥ 400; **allowlist tường minh**: `POST /api/v1/auth/refresh` → 401 trước khi đăng nhập (hành vi bình thường của khởi tạo phiên). Không allowlist dựa trên văn bản console |
| Bảo mật/riêng tư | email/mật khẩu tổng hợp trong test; không bí mật thật; `trace` chỉ khi retry; artifact lưu 7 ngày (D-M10-07) |
| Ổn định | không phụ thuộc thứ tự test khác; không chia sẻ tài khoản giữa hai kịch bản; viewport mặc định Desktop Chrome (đã đủ cho kiểm chứng nội dung; responsive thủ công — Mục 16) |
| Không trùng lặp | hành trình *đăng ký→hồ sơ→tính→danh sách→cô lập hai tài khoản→404/403* **đã** nằm ở `chart-list.spec.ts`; `chart.spec.ts` không lặp phần cô lập; chỉ lặp phần *tạo dữ liệu* (cần để có chart) |
| Helper | **cục bộ trong `chart.spec.ts`** (sao chép mẫu `registerAndLogin`/`createBirthProfile` từ `chart-list.spec.ts`); **không** refactor/di chuyển spec hiện có; trùng lặp helper giữa các spec ghi KG-M10-05 |
| Giới hạn | chỉ Chromium Desktop: **không** kiểm cảm ứng/mobile tự động; hành vi responsive/zoom/hai cột/sticky = thủ công (đã ghi ở M9) |

**Chẩn đoán thất bại (D-M10-07, proposed):** workflow hiện chỉ upload `backend.log` khi lỗi; đề xuất thêm bước `actions/upload-artifact` (cùng phiên bản đã dùng trong workflow) cho `frontend/playwright-report` và `frontend/test-results` khi `failure()`. Đây là thay đổi **một bước, không đổi hành vi test**; nếu owner không duyệt, M10 vẫn chạy được nhưng chẩn đoán lỗi E2E trên CI sẽ khó.

## 12. Primary E2E Scenario 1 — Successful Natal Chart Journey

**Mục đích:** chứng minh người dùng thật đi từ đăng ký đến **dùng được** Chart Viewer trên dữ liệu Backend thật, và các bề mặt Wheel / bảng / chi tiết nhất quán với phản hồi API.

**Điều kiện:** CI (Postgres + Backend). Tài khoản mới. Viewport Desktop Chrome.

| Bước | Hành động | Khẳng định (quan sát được) |
|---|---|---|
| S1.1 | Đăng ký + đăng nhập (UI) | vào `/app`; không lỗi |
| S1.2 | Tạo hồ sơ sinh **biết giờ sinh** (vị trí mock) | hồ sơ xuất hiện trong danh sách hồ sơ |
| S1.3 | Bấm "Tính lá số" trên thẻ hồ sơ | **bắt phản hồi** `POST /api/v1/charts/natal` thành công; `chartJson` có 14 trường hợp đồng (Mục 10.2) và `isHouseDataAvailable === true`; URL `/app/charts/<uuid>`; focus ở `h1` "Lá số sinh" |
| S1.4 | Quan sát viewer | wheel (`group` có tiêu đề) hiển thị; số nút hành tinh trên wheel = số hành tinh VM hợp lệ (= `chartJson.planets.length` khi dữ liệu hợp lệ); ba bảng có `caption` + số hàng khớp (`planets`, `houses` 12, `aspects`); độ hiển thị dạng `D°MM′` (định dạng, không giá trị cụ thể) |
| S1.5 | **Chọn trên wheel** một hành tinh | nút `aria-pressed="true"`; hàng Planet Table tương ứng `aria-pressed="true"`; `SelectionDetail` nêu tên hành tinh; vùng `status` đọc "Đã chọn …"; Aspect Table có chip "Đang lọc" |
| S1.6 | `Esc` | mọi bề mặt về mặc định; "Đã bỏ chọn" |
| S1.7 | **Chọn từ bảng** (Aspect Table) | hai hành tinh đầu mút nổi (`aria-pressed` hành tinh vẫn `false`, trạng thái chọn nằm ở hàng aspect); detail nêu loại aspect |
| S1.8 | Công tắc "Hiện đường góc chiếu" (mặc định bật ở Desktop) | tắt ⇒ lớp aspect biến mất, **bảng aspect không đổi**; bật lại ⇒ lớp trở lại |
| S1.9 | Điều hướng "Lá số của tôi" (nav) | danh sách có chart vừa tính; mở lại chart ⇒ viewer tải lại đúng dữ liệu; nút Back trình duyệt hoạt động |
| S1.10 | Suốt kịch bản | không `pageerror`; không phản hồi `/api/` ≥ 400 ngoài allowlist (Mục 11) |

**Cách chọn phần tử (đề xuất, xác nhận khi viết):** tên truy cập đã tồn tại — nút hành tinh `Chọn {tên}, ở {cung}…` (M5/M8), chip `Xóa bộ lọc theo …`, công tắc `Hiện đường góc chiếu`, `SelectionDetail` heading "Chi tiết đang chọn", vùng `status`. **Không** hard-code nhãn Việt của hành tinh cụ thể ngoài ví dụ ổn định (Mặt Trời luôn có trong lá số lõi).

**Không kiểm:** giá trị thiên văn chính xác; bố cục hai cột/sticky; zoom (chỉ `< md`); aspect tại mobile; trình đọc màn hình.

**Quan hệ với `chart-list.spec.ts`:** phần S1.1–S1.3 và S1.9 lặp một phần (tạo dữ liệu, điều hướng) **có chủ đích** vì cần để có chart; giá trị mới là S1.4–S1.8 (nội dung viewer + đồng bộ).

## 13. Primary E2E Scenario 2 — Degraded / Unknown Birth Time

**Lựa chọn kịch bản (D-M10-01, proposed):** *hồ sơ không rõ giờ sinh → tính lá số → viewer suy giảm hợp lệ*. Lý do: (i) đây là **đường suy giảm duy nhất có thật** của F4 (Mục 49 "Thiếu giờ sinh"); (ii) đã xác minh qua mã Backend rằng nhà chỉ tính khi `isBirthTimeKnown` (`chart-builder.ts:73-90`) và form có checkbox "Tôi biết rõ giờ sinh của mình"; (iii) chạy được **trên Backend thật**, không cần mock. Phương án khác — lỗi mạng/`500`/`404` — **đã được `chart-list.spec.ts` và test component phủ** (404/403) hoặc là hành vi tải/lỗi chung của S4.3 (test đơn vị), nên không chọn làm kịch bản thứ hai.

**Bước 0 — probe bắt buộc (M10.2):** trước khi viết khẳng định, chạy một lần: đăng ký + tạo hồ sơ với checkbox **bỏ chọn** + `POST /api/v1/charts/natal` (qua UI trên CI/máy có Backend). Quy tắc quyết định:

| Kết quả probe | Hành động |
|---|---|
| `2xx`, `isHouseDataAvailable=false`, `houses=[]`, `angles=[]` | viết Scenario 2 trên **Backend thật** (mức B) |
| `4xx/5xx` hoặc cấu trúc khác dự kiến | **không** đoán; ghi vào Known Gaps Backend; chuyển sang **dự phòng `FIXTURE-BASED`**: `page.route` trả `fixture_nohouse.json` (CAPTURED) cho `GET /api/v1/charts/:id`; gắn nhãn rõ trong Matrix là *không xác minh Backend* |

| Bước | Khẳng định (Backend thật) |
|---|---|
| S2.1 | đăng ký; tạo hồ sơ với "biết rõ giờ sinh" **tắt** ⇒ hồ sơ được lưu |
| S2.2 | "Tính lá số" ⇒ thành công; phản hồi: `isHouseDataAvailable === false`, `houses.length === 0`, `angles.length === 0`; `planets` vẫn có (`house` null) |
| S2.3 | **không** hiện lỗi chung; có thông báo "không có dữ liệu Nhà/góc" (`HouseDataNotice`, văn bản thật) |
| S2.4 | wheel hiển thị 12 cung + hành tinh; **không** vẽ nhà/góc; không `NaN`/`undefined`/`null` trong văn bản trang |
| S2.5 | Planet Table có dữ liệu cung/độ; cột "Nhà" không bịa số; **không** có Planet/House bảng nhà (HouseTable vắng mặt) |
| S2.6 | aspect/chọn hành tinh vẫn hoạt động (S1.5 rút gọn) |
| S2.7 | không `pageerror`; không phản hồi ≥ 400 ngoài allowlist |
| S2.8 | nếu `warnings` có phần tử (liên quan KG-S4-06 Mặt Trăng/thiếu giờ) thì viewer hiển thị chúng đúng (không làm vỡ) |

**Không kiểm:** độ bất định theo thiên thể (FG-07); nội dung diễn giải (F5).

## 14. Regression Strategy

**Nguyên tắc:** hồi quy = **chạy lại** toàn bộ bộ test đã có, không làm yếu/xoá/bỏ qua; thêm test **chỉ** khi audit chỉ ra khoảng trống cụ thể.

| Lớp | Phạm vi | Cách chạy | Baseline (đã chạy `[run]`) |
|---|---|---|---|
| Đơn vị + component | toàn bộ `src/**` (130 file) | `npm test` (hoặc hai nửa khi sandbox giới hạn thời gian) | **130 file / 1041 test qua** |
| Coverage | như trên | `npm run test:coverage` (CI) | chưa chạy trong sandbox (CI #287 Success) |
| E2E hiện có | `smoke`, `auth`, `birth-profile`, `chart-list`, `layout`, `Select` | `npm run test:e2e` (CI, Backend thật) | CI #287 Success |
| E2E mới | `chart.spec.ts` | như trên | chưa tồn tại |
| Ranh giới | grep gate (Mục 17) | lệnh grep | sạch tại HEAD (kiểm bằng `[run]`) |
| Tĩnh | `format:check`, `lint`, `typecheck`, `build` | lệnh npm | exit 0 tại HEAD |

**Khoảng trống đã xác định (thêm test):**

| ID | Khoảng trống | Test dự kiến | Vì sao |
|---|---|---|---|
| G-1 | Chưa có test khẳng định `interpretations: []`, `tone` vắng, `interpretationVersion: null` **không** làm vỡ viewer (Backend Sprint 4 thêm diễn giải; F5 sẽ dùng) | 1–2 test hợp đồng trong `fixtures.contract.test.ts` hoặc `chartViewModel.test.ts` (render VM/Shell với `interpretations` rỗng/thiếu tuỳ chọn) | tương thích hợp đồng (Mục 10.3) |
| G-2 | Chưa có kiểm tra tự động nào đảm bảo E2E dùng **cả hai** nhánh `isHouseDataAvailable` trên Backend thật | Scenario 2 (E2E) | Mục 13 |

**Quy tắc phát hiện hồi quy:** nếu một test M1–M9/M11 đỏ ⇒ dừng đóng, mở sửa lỗi theo mẫu `M*.n` (Mục 7), **không** sửa test để "cho qua" trừ khi test đó sai về hợp đồng và có ghi lý do trong Matrix.

## 15. Quality Gates

**Nguồn:** F4 plan **Mục 46** (dòng 791–807). Mọi script được dùng đều tồn tại trong `frontend/package.json` (VERIFIED); **không** có `test:a11y`/`coverage`/`test:unit` — không thay bằng lệnh tự chế.

| Cổng (Mục 46) | Lệnh | Nơi chạy | Trạng thái tại HEAD |
|---|---|---|---|
| env | `cp .env.example .env` | CI/cục bộ | cần cho test cục bộ (đã làm trong sandbox) |
| Lint | `npm run lint` | cục bộ + CI | exit 0 `[run]` |
| Typecheck | `npm run typecheck` | cục bộ + CI | exit 0 `[run]` |
| Format | `npm run format:check` | cục bộ + CI | exit 0 `[run]` |
| Test | `npm test` | cục bộ + CI | 130 file / 1041 test `[run]` |
| Coverage | `npm run test:coverage` | **CI** | CI #287 Success `[ci]` — con số % chưa đọc được (log cần đăng nhập) |
| Build | `npm run build` | cục bộ + CI | exit 0 `[run]` |
| E2E | `npm run test:e2e` | **CI (Backend thật)** | CI #287 Success `[ci]`; **PLANNED** cho spec mới |
| CI xanh trên commit cuối | workflow `Frontend CI` | GitHub | **PLANNED** — sau commit đóng cuối cùng chứa mã/ test |

**Quy tắc bằng chứng:** chỉ ghi `VERIFIED` cho lệnh **đã chạy** hoặc job CI **đã Success** trên *evidence commit*; commit docs-only sau đó không cần CI riêng nếu `git diff` chỉ chạm `docs/**` (quy ước D-C3, khớp bộ lọc `paths` của `frontend-ci.yml`). Lưu ý: các lần push gộp nhiều commit có thể kích hoạt CI trên commit docs-only cuối (đã xảy ra ở M9).

**Cách chạy E2E ngoài CI (cho owner/dev):** cần Postgres + Backend dựng như bước trong `frontend-ci.yml` (`prisma:deploy`, `build`, `node dist/server.js`, `NODE_ENV=test`), sau đó `cd frontend && npm run test:e2e`. Sandbox của phiên audit **không** dựng Backend nên **không** tái hiện được cục bộ (mức bằng chứng: `[ci]`).

---

## 16. Manual QA

**Môi trường có bằng chứng ở M6/M8/M9:** Windows 11 + Chrome/Edge (màn hình lớn có cảm ứng); các môi trường khác (macOS/iOS/Android, Firefox/Safari, NVDA/VoiceOver) **chưa có** (`ACCEPTED GAP` đã ghi). M10 **không** tuyên bố đã kiểm các môi trường đó; mỗi hạng mục thiếu thiết bị ghi `ACCEPTED GAP` (D-M10-08), không điền khống.

**Quy tắc ghi:** người kiểm · thiết bị · hệ điều hành + phiên bản đọc từ trang About · trình duyệt/AT + phiên bản · commit/URL build · lá số dùng (Backend thật) · bằng chứng (ảnh/video lưu `docs/implementation/archive/sprint-f4/evidence/m10_*.png`) · ngày. Chạy trên **evidence commit cuối** (build `npm run build` + `npm run preview` hoặc môi trường dev có Backend).

| # | Hạng mục | Cách kiểm (người) | Kỳ vọng | Chặn đóng nếu lỗi |
|---|---|---|---|---|
| Q1 | Hành trình đầy đủ trên Backend thật | đăng ký → hồ sơ → tính lá số → xem → danh sách → mở lại | không lỗi, dữ liệu nhất quán | P0/P1 |
| Q2 | Chart Viewer — nội dung | đối chiếu wheel với bảng: 12 cung, hành tinh, nghịch hành (℞), độ, nhà/góc, aspect | khớp, đọc được | P1/P2 |
| Q3 | Thiếu giờ sinh | hồ sơ "không biết giờ sinh" | thông báo rõ, không lỗi, không bịa nhà | P1 |
| Q4 | Bàn phím | Tab xuyên trang; chọn/bỏ bằng Enter/Space/Esc; skip link; liên kết "Chuyển tới bảng dữ liệu"; nút zoom (≤ md) | không bẫy focus; focus nhìn thấy | P1 |
| Q5 | Cảm ứng (nếu có thiết bị) | chạm chọn hành tinh/aspect; "Bỏ chọn"; zoom | chọn được không cần hover | P2 (ACCEPTED GAP nếu không có thiết bị) |
| Q6 | Responsive | 375/768/1024/1280/1440 và zoom trình duyệt 200% | ba chế độ đúng, không tràn trang, wheel đủ khung (M9.6) | P1/P2 |
| Q7 | Trợ năng | trình đọc màn hình (NVDA/VoiceOver): tên hành tinh, live region, nút zoom, bảng | đọc đúng | P2 → `ACCEPTED GAP` nếu không có AT |
| Q8 | Giảm chuyển động | bật `prefers-reduced-motion` | không còn chuyển tiếp ở viewer | P3 |
| Q9 | Tương phản / không chỉ màu | đo cặp màu nét aspect sáng/tối; thang xám/CVD | nhận diện được bằng kiểu nét | P2 (đã biết KG-M6-08 2,56:1) |
| Q10 | Lỗi & trạng thái | chart không tồn tại (404), chart người khác (403), mất mạng khi tải | thông báo tiếng Việt, có đường quay lại | P1/P2 |
| Q11 | Saved Charts List | tính ≥ 2 lần; danh sách hiển thị; nav ở desktop và mobile | mở được từng mục; chỉ chart của mình | P1 |
| Q12 | Điều hướng/Back | Back/Forward sau mở chart, đóng tab mở lại URL | không crash; phiên phục hồi | P2 |

Phân loại lỗi và quyết định chặn/không chặn theo Mục 19 (P0–P3). Lỗi `P0/P1` ⇒ sửa trước khi đóng; `P2/P3` ⇒ sửa nếu rẻ, ngược lại ghi Known Gap có lý do.

## 17. Architecture Boundary Review

> **Công cụ tự động còn thiếu:** ESLint plugin `boundaries` đang **tắt** (F4 plan FG-10) ⇒ rà ranh giới bằng **grep gate + đọc mã**. Kết quả dưới là **pre-audit tại HEAD `25f9b6c`** (`[run]`), phải **chạy lại ở M10.4** trên evidence commit.

| # | Quy tắc | Lệnh kiểm (tóm tắt) | Kết quả pre-audit |
|---|---|---|---|
| B1 | UI/model/ViewModel không gọi API trực tiếp | `grep -rnE "apiClient\|useQuery\|useMutation" src/features/chart/ui src/features/chart/model` (không test) | **0** |
| B2 | Không `fetch/axios` ngoài `shared/api` | `grep -rnE "\bfetch\(\|axios" src` (không test, loại `shared/api`) | **0** |
| B3 | Không store mới cho chart; Zustand chỉ trong `shared/stores` | `grep -rl 'from "zustand"' src` | chỉ `uiStore`, `preferenceStore`, `authStore` (có trước F4) |
| B4 | Không `dangerouslySetInnerHTML` | grep | **0** |
| B5 | Không import Prisma/Backend vào frontend | `grep -rIn prisma src e2e package.json` | **0** |
| B6 | Không dependency mới trong F4 | `git diff a369019 HEAD -- frontend/package.json` (chỉ `scripts`/`lint-staged`) | **không đổi dependency** |
| B7 | Model chart không import React/DOM | grep trong `features/chart/model` | sạch (đã gate ở M5/M6/M8) |
| B8 | Không tính lại chiêm tinh ở frontend | rà `model/**`: chỉ hình học hiển thị (`toScreenAngle`, dàn nhãn, cung aspect) | cho phép, không có phép tính thiên văn |
| B9 | Không `TODO/FIXME/HACK` mới trong code F4 | grep | 12 `TODO(Core)` **có sẵn** (`uiStore`, `Radio`, `Checkbox`, `usePosition`, `App`, `router` ×3, `render`, hai drawer); **không** cái nào trong `features/chart` |
| B10 | Mã mock/fixture không vào sản phẩm | `grep -rn "api/mocks" src --include=*.tsx` ngoài test | rà ở M10.4 (UNVERIFIED trong audit) |
| B11 | Secret/dữ liệu cá nhân không hard-code | rà `.env.example`, `e2e/*.ts` | `.env.example` chỉ `VITE_API_BASE_URL`; E2E dùng email/mật khẩu tổng hợp |
| B12 | Dùng `@shared/ui` thay UI tự chế; token màu | rà thủ công + grep hex | sạch ở các milestone trước |

Vi phạm ⇒ mở sửa lỗi nhỏ nhất; **không** đổi kiến trúc trong M10.

## 18. Documentation Updates

| Tài liệu | Hiện trạng (VERIFIED) | Việc M10 | Mức |
|---|---|---|---|
| `docs/frontend/Frontend_UI_Specification.md` **§12.5** | nói wheel `role="img"`; mã dùng `svg role="group"` + hành tinh `role="button" aria-pressed`, đường aspect pointer-only | cập nhật mô tả khớp mã (FG-08) | **Should fix before closure** |
| **§13–§14** (Page Spec/Routing) | liệt kê `/chart/new`, `/chart/:chartId`, `/app → /app/charts`, `/app/settings`, `/knowledge*`; thực tế khác (bảng dưới) | thay cây route bằng **route thực tế**, đánh dấu các route chưa triển khai là "chưa làm (backlog/F5+)", **không xoá thiết kế gốc** nếu owner muốn giữ làm roadmap (D-M10-05) | **Should fix before closure** (FG-09) |
| UI Spec §909–912, 1109, 1143 (Recharts/Framer Motion) | mô tả thư viện **chưa cài**; F4 không dùng | thêm ghi chú trạng thái "chưa cài/không dùng ở F4" (FG-09); **không** cài | Should fix (tài liệu) |
| `docs/frontend/Frontend_Architecture_Specification.md` | `manualChunks` và code-splitting đã mô tả; nhắc Recharts | kiểm lại nội dung nhắc thư viện; chỉ sửa nếu sai sự thật | rà ở M10.6 |
| `frontend/CHANGELOG.md` | Keep a Changelog + SemVer; có mục `0.2.0` (F3) | thêm mục F4 (Added/Changed/Fixed…) tóm theo milestone; **không** viết cam kết ngoài những gì đã giao | bắt buộc |
| `frontend/package.json` + `package-lock.json` | `0.2.0` vs lockfile `0.1.0` | nâng version đóng F4 **theo D-M10-04**; đồng bộ cả `version` gốc và `packages[""]` trong lockfile bằng `npm install --package-lock-only`-tương đương **chỉ khi owner duyệt**; không đổi dependency | theo quyết định |
| F4 plan Mục 45 (baseline "78/391") | cũ | cập nhật baseline hiện tại (130/1041) | nên làm |
| F4 plan Mục 47 (FG-01…14) | trạng thái từng FG ở thời điểm v1.1 | cập nhật trạng thái: FG-05 giữ defer, FG-08/09 **resolved** (sau sửa), FG-02 đã resolved 1 phần… | bắt buộc |
| `docs/implementation/archive/sprint-f4/Sprint_F4_M10_Exit_Criteria_Evidence_Matrix.md` | chưa có | tạo (Mục 34) | bắt buộc |
| `docs/implementation/Sprint_F4_M10_Implementation_Plan.md` | blueprint | **xoá** ở commit docs-only sau evidence commit | bắt buộc |

**Route thực tế (VERIFIED `[repo]` `router.tsx`) vs tài liệu:**

| Route thực tế | Layout/guard | UI Spec §14 | Hành động |
|---|---|---|---|
| `/` | Marketing, công khai | có | giữ |
| `/login`, `/register` | `GuestRoute` | có | giữ |
| `/app` (index) | `ProtectedRoute` + `AppLayout`; **không** chuyển sang `/app/charts` | ghi "→ /app/charts" | sửa mô tả |
| `/app/profiles`, `/app/profiles/new`, `/app/profiles/:id/edit` | protected | `/app/profiles` có; `new`/`edit` chưa ghi | bổ sung |
| `/app/charts` | protected — `ChartListPage` (M11) | ghi "ChartsDashboardPage" | sửa tên/trạng thái |
| `/app/charts/:chartId` | protected — `ChartDetailPage` | ghi `/chart/:chartId` | sửa |
| `/dev/style-guide` | chỉ khi `import.meta.env.DEV` (`VerifyPage`) | không có | ghi chú dev-only |
| `*` | `NotFoundPage` | có | giữ |
| `/chart/new`, `/chart/:chartId` (khách), `/app/settings`, `/knowledge*` | **chưa tồn tại** | có | đánh dấu "chưa triển khai" (FG-03 là quyết định kiến trúc riêng) |

## 19. Versioning, Severity, and Closure vs Release

### 19.1 Phiên bản (D-M10-04, unresolved)

- **Quan sát (VERIFIED):** CHANGELOG ghi `[0.1.0]` = F1+F2, `[0.2.0]` = F3; `package.json` hiện `0.2.0`; lockfile `0.1.0` (lệch từ F3). Hình mẫu: *một lần nâng minor mỗi sprint frontend*. **Quy ước này chưa được văn bản hoá** ⇒ plan **không** tự đặt số.
- **Đề xuất:** nếu owner áp dụng đúng hình mẫu, số kế tiếp là **`0.3.0`**; owner xác nhận số cuối cùng. Việc nâng version và đồng bộ lockfile là **một commit riêng** chạm `frontend/**` (do đó có CI riêng — nó trở thành *evidence commit* mới của F4).
- **Không bao gồm:** git tag, deploy, release note ngoài CHANGELOG, đổi version Backend.

### 19.2 Phân biệt ba khái niệm

| Khái niệm | Ý nghĩa trong M10 |
|---|---|
| **Đóng milestone (M10)** | Evidence Matrix M10 + AC đạt + CI xanh trên evidence commit |
| **Đóng sprint F4** | mọi milestone S4.1–S4.11 đã đóng + Mục 49 đạt + Known Gaps ghi đủ + tài liệu đồng bộ |
| **Phát hành/triển khai** | **ngoài phạm vi**; chỉ owner quyết định; M10 chỉ ghi "đủ điều kiện đóng sprint", không "đã release" |

### 19.3 Mức nghiêm trọng

| Mức | Định nghĩa | Ánh xạ F4 plan Mục 47 | Chặn đóng? |
|---|---|---|---|
| **P0** | mất dữ liệu/bảo mật/crash không phục hồi; hành trình chính hỏng | — | **Có** |
| **P1** | chức năng cốt lõi hỏng hoặc không truy cập được (bàn phím/lỗi chặn); đối chiếu dữ liệu sai | Must fix | **Có** |
| **P2** | suy giảm trải nghiệm có cách tránh; tương phản/thiết bị chưa kiểm | Should fix / Known Gap | Không nếu ghi lý do + owner chấp nhận |
| **P3** | thẩm mỹ/copy nhỏ | Known Gap — defer | Không |

## 20. Known Gaps and Technical Debt

Nguồn chính: F4 plan **Mục 47** (FG-01…14) + Known Gap từng milestone. M10 **không tạo registry thứ hai**: Evidence Matrix M10 ghi trạng thái cuối của từng mục (trạng thái, phân loại, chủ sở hữu, bằng chứng).

| ID | Mục | Phân loại hiện tại | Trạng thái trước đóng |
|---|---|---|---|
| FG-01 | `ChartResponse` thiếu `birthProfileId`/dữ liệu sinh/`isBirthTimeKnown` | Requires Backend change | giữ, chuyển sprint Backend |
| FG-02 | trùng snapshot; chưa xoá chart | Known Gap — defer | giữ |
| FG-03 | guest chart `/chart/new` | Requires separate architectural decision | giữ |
| FG-04 | `isApplying` boolean | Requires Backend change nếu cần | giữ |
| FG-05 | pinch tuỳ biến | Known Gap — defer | giữ |
| FG-06 | ma trận aspect, element, La Mã, Chiron…, Pattern UI, Tabs | Known Gap — defer | giữ |
| FG-07 | Moon/thiếu giờ sinh — chưa độ bất định theo thiên thể | Requires separate architectural decision | giữ |
| FG-08 | UI Spec §12.5 `role="img"` | **Should fix before closure** | **sửa ở M10.6** |
| FG-09 | UI Spec §13–14, Architecture mention | **Should fix before closure** | **sửa ở M10.6** |
| FG-10 | Debt Core (`<title>`, focus điều hướng, `boundaries` tắt, `href="/"`) | Existing debt — unrelated | giữ |
| FG-11 | Known Gaps F3 | Existing debt — unrelated | giữ |
| FG-12 | glyph Unicode phụ thuộc font | Known Gap — defer | giữ |
| FG-13 | nhãn hồ sơ ghép client `pageSize=100` | Requires Backend change | giữ |
| FG-14 | `ChartSummaryResponse` thiếu `chartType`/`isHouseDataAvailable` | Requires Backend change nếu cần | giữ |
| **KG-M10-01** | `package-lock.json` `0.1.0` ≠ `package.json` `0.2.0` | Should fix (cùng commit version) | sửa theo D-M10-04 |
| **KG-M10-02** | CI không upload Playwright report/trace khi lỗi | Should fix (D-M10-07) | tuỳ owner |
| **KG-M10-03** | E2E chỉ Desktop Chrome; không tự động hoá mobile/cảm ứng | Known Gap — defer | giữ |
| **KG-M10-04** | `chartType` literal `"Natal"` (frontend) vs `string` (Backend) | Known Gap — defer | giữ |
| **KG-M10-05** | helper E2E lặp giữa các spec | Known Gap — defer | giữ |
| Carry-over | KG-M8-01/04 (thiết bị/AT; aspect pointer-only), KG-M9-01 (sticky ≥ 1000 px), KG-M6-08 (2,56:1), CI Node 20 | defer / ACCEPTED GAP | giữ |

### 20.1 Decision Review

| ID | Quyết định | Căn cứ | Phương án khác | Trạng thái (đã phê duyệt) |
|---|---|---|---|---|
| **D-M10-01** | Scenario 2 = hồ sơ **không rõ giờ sinh** trên Backend thật; probe trước, dự phòng `FIXTURE-BASED` | `chart-builder.ts:73-90`; form có checkbox | lỗi 404/500 (đã phủ nơi khác) | **APPROVED** |
| **D-M10-02** | Tạo `chart.spec.ts`, helper cục bộ, không refactor spec cũ | không có file; spec cũ lặp helper | tách `e2e/support/*` (refactor) | **APPROVED** |
| **D-M10-03** | Scenario 1 tập trung nội dung viewer + đồng bộ, không lặp cô lập hai tài khoản | `chart-list.spec.ts` đã phủ | thêm test hai tài khoản trong `chart.spec.ts` | **APPROVED** |
| **D-M10-04** | Version F4: nâng lên `0.3.0` khi đóng F4; sync lockfile cùng commit | CHANGELOG + `package.json`/lockfile | giữ `0.2.0`; số khác | **APPROVED** (nâng lên `0.3.0` ở M10.6b) |
| **D-M10-05** | Sửa UI Spec §12.5/§13–14 + ghi chú Recharts/Framer ở mức tối thiểu "khớp mã", giữ thiết kế chưa làm dưới nhãn backlog | FG-08/09 | viết lại toàn bộ spec | **APPROVED** |
| **D-M10-06** | Registry Known Gaps cuối nằm trong Evidence Matrix M10, ID gốc FG-*/KG-* | không có registry hợp nhất | tạo `KNOWN_GAPS.md` mới | **APPROVED** |
| **D-M10-07** | Thêm bước upload báo cáo Playwright khi lỗi (workflow) + chọn Phương án (A) tắt trace ở CI | CI chỉ upload `backend.log` | không đổi workflow | **APPROVED** (Phương án A: tắt trace ở CI để bảo mật token) |
| **D-M10-08** | Chấp nhận bằng chứng thủ công trên môi trường hiện có; thiết bị/AT còn lại `ACCEPTED GAP` | M6/M8/M9 | chặn đóng tới khi có thiết bị | **APPROVED** (gap chỉ ghi sau phê duyệt cụ thể) |
| **D-M10-09** | Allowlist console/network chỉ `POST /auth/refresh` 401 trước đăng nhập | hành vi khởi tạo phiên | bỏ kiểm console | **APPROVED** |
| **D-M10-10** | Ánh xạ P0–P3 → phân loại Mục 47 | Mục 47 | thang riêng | **APPROVED** |

**Kết quả xác nhận từ owner:** Toàn bộ 10/10 quyết định D-M10-01 … D-M10-10 đã được **phê duyệt (APPROVED)**.

## 21. Risks

| # | Rủi ro | Khả năng | Tác động | Giảm thiểu | Kiểm chứng |
|---|---|---|---|---|---|
| R1 | E2E flaky (retry che lỗi — `retries: 2` ở CI) | TB | TB | chờ theo điều kiện, không sleep, tài khoản mới mỗi lần, đọc báo cáo (D-M10-07) | CI nhiều lần chạy; báo cáo |
| R2 | Phụ thuộc dịch vụ ngoài (GeoNames) | Thấp | Cao | giữ mock `locations/search` | spec |
| R3 | Dữ liệu E2E tích luỹ (chạy lại cục bộ) | Thấp | Thấp | email duy nhất; CI DB tạm thời; ghi trong hướng dẫn | — |
| R4 | Probe Scenario 2 cho kết quả khác dự kiến (Backend từ chối) | Thấp–TB | TB | quy tắc probe + dự phòng `FIXTURE-BASED` có nhãn | M10.2 |
| R5 | Backend/frontend lệch hợp đồng | Thấp | Cao | đối chiếu 14 trường + E2E thật | Mục 10 |
| R6 | Sandbox không dựng được Backend ⇒ bằng chứng E2E chỉ `[ci]` | Cao | Thấp | ghi rõ nguồn bằng chứng; không tuyên bố tái hiện cục bộ | Matrix |
| R7 | Thiết bị/AT thiếu ⇒ khẳng định a11y/mobile quá mức | TB | TB | `ACCEPTED GAP`, không điền khống | Matrix |
| R8 | Sửa tài liệu làm mất thiết kế gốc | Thấp | TB | giữ dưới nhãn backlog; owner duyệt phạm vi | D-M10-05 |
| R9 | Version/lockfile lệch gây lỗi CI (`npm ci`) | Thấp | TB | commit riêng, chạy CI | CI |
| R10 | Mở rộng phạm vi sang F5 (UI diễn giải) hoặc sửa tính năng | TB | Cao | đối chiếu Mục 9; chỉ sửa lỗi | review |

---

## 22. Implementation Task Breakdown

> Quy trình đã chốt (M4–M9): **xác nhận quyết định trước khi sinh mã** (Mục 20.1); mỗi task một nhóm commit nhỏ; Evidence Matrix chỉ ghi lệnh **đã thật sự chạy**; commit chỉ chạm `docs/**` tách riêng khỏi commit chạm `frontend/**`/`.github/**` (commit docs-only không phải chạy CI riêng — nhưng push gộp nhiều commit vẫn có thể kích hoạt CI trên commit docs cuối, như M9). Đường dẫn "Likely change" là **dự đoán**; đường dẫn "Inspect" đã xác minh tồn tại. Chạy test cục bộ cần `cp .env.example .env`.

### M10.1 — Preflight và khoá đường cơ sở

| # | Mục | Nội dung |
|---|---|---|
| 1 | Mục tiêu | chốt quyết định Mục 20.1; xác nhận tiền điều kiện P2 (owner chấp nhận đóng M9); khoá baseline |
| 2 | Cơ sở | Mục 7: M9 chưa ghi `ACCEPTED BY OWNER`; `chart.spec.ts` chưa có; version/lockfile lệch |
| 3 | Preconditions | CI #287 xanh trên `3827277` (VERIFIED) |
| 4 | Inspect | `Sprint_F4_M9_Exit_Criteria_Evidence_Matrix.md`, `.github/workflows/frontend-ci.yml`, `frontend/e2e/chart-list.spec.ts` (mẫu helper), `frontend/CHANGELOG.md` |
| 5 | Likely change | không có mã; (tuỳ) ghi `ACCEPTED BY OWNER` vào Matrix M9 nếu owner yêu cầu (commit docs-only) |
| 6 | Steps | (1) owner trả lời 5 quyết định; (2) chạy lại 4 cổng tĩnh + `npm test` trên HEAD, ghi số; (3) chốt ID quyết định `D-M10-*` dùng trong Matrix |
| 7 | Tests | không mới |
| 8 | Xác minh | `npm run lint && npm run typecheck && npm run format:check && npm run build`; `npm test` |
| 9 | Acceptance | baseline ghi đúng (130 file / 1041 test hoặc số mới có giải thích); quyết định đã chốt |
| 10 | Dependencies | — → M10.2 |
| 11 | Ngoài phạm vi | viết E2E; sửa mã |
| 12 | Rủi ro | owner chưa trả lời ⇒ dừng; không tự suy diễn |
| 13 | Bằng chứng | bản ghi lệnh + số liệu |

### M10.2 — E2E: hai kịch bản chính

| # | Mục | Nội dung |
|---|---|---|
| 1 | Mục tiêu | tạo `frontend/e2e/chart.spec.ts` với **hai** kịch bản (Mục 12–13); (D-M10-07) bước upload báo cáo Playwright khi lỗi |
| 2 | Cơ sở | không có spec viewer; chart-list đã phủ hành trình + cô lập; CI chỉ upload `backend.log` |
| 3 | Preconditions | M10.1; Backend thật có sẵn **trên CI** (hoặc máy có Postgres) để probe |
| 4 | Inspect | `e2e/chart-list.spec.ts`, `e2e/birth-profile.spec.ts` (mẫu `page.route` vị trí, `registerAndLogin`), `playwright.config.ts`, `src/features/birth-profile/ui/BirthProfileForm/BirthProfileForm.tsx` (checkbox giờ sinh), `ChartViewerShell.tsx`, các tên truy cập thực |
| 5 | Likely change | **Create** `frontend/e2e/chart.spec.ts`; Modify `.github/workflows/frontend-ci.yml` (+1 bước upload, nếu D-M10-07 duyệt) |
| 6 | Steps | (0) **probe** unknown-time trên Backend thật (Mục 13) và ghi kết quả; (1) helper cục bộ (đăng ký/đăng nhập, mock vị trí, tạo hồ sơ biết/không biết giờ, tính lá số + bắt phản hồi); (2) Scenario 1 theo S1.1–S1.10; (3) Scenario 2 theo S2.1–S2.8 (hoặc dự phòng có nhãn); (4) observer lỗi trang/mạng với allowlist; (5) chạy trên CI, đọc báo cáo |
| 7 | Tests | E-S1.\*, E-S2.\* (Mục 25) |
| 8 | Xác minh | CI `npm run test:e2e` (Backend thật); cục bộ nếu có Postgres: `cd frontend && npx playwright test e2e/chart.spec.ts` |
| 9 | Acceptance | AC-E1…E7; không `waitForTimeout`; không phụ thuộc thứ tự/dữ liệu có sẵn |
| 10 | Dependencies | M10.1 → M10.3 |
| 11 | Ngoài phạm vi | refactor spec cũ; thêm project Mobile/Firefox/WebKit; visual regression |
| 12 | Rủi ro | R1, R2, R4, R6 |
| 13 | Bằng chứng | link CI + báo cáo; kết quả probe |

### M10.3 — Tương thích và khoảng trống hồi quy

| # | Mục | Nội dung |
|---|---|---|
| 1 | Mục tiêu | xác nhận hợp đồng 14 trường; thêm test dung sai diễn giải (G-1); đối chiếu fixture |
| 2 | Cơ sở | Mục 10: khớp 14/14; chưa có test `interpretations` rỗng/thiếu `tone`/`interpretationVersion:null` |
| 3 | Preconditions | M10.2 (E2E chạy được để lấy phản hồi thật) |
| 4 | Inspect | `features/chart/api/types.ts`, `fixtures.ts`, `fixtures.contract.test.ts`, `chartViewModel.ts`, `backend/.../chart-response.mapper.ts` |
| 5 | Likely change | **Modify** `fixtures.contract.test.ts` và/hoặc `chartViewModel.test.ts` (thêm 1–2 test); **không** đổi `types.ts` trừ khi phát hiện lệch thật (ghi KG trước) |
| 6 | Steps | (1) đối chiếu trường/kiểu bằng script đọc tệp (chỉ đọc); (2) thêm test dung sai; (3) trong E2E Scenario 1, khẳng định `Object.keys(chartJson)` ⊇ 14 trường và kiểu `interpretationVersion`; (4) ghi `KG-M10-04` |
| 7 | Tests | C-1…C-5 (Mục 27) |
| 8 | Xác minh | `npx vitest run src/features/chart/api src/features/chart/model` |
| 9 | Acceptance | AC-C1…C4 |
| 10 | Dependencies | M10.2 → M10.4 |
| 11 | Ngoài phạm vi | sửa Backend; đổi DTO |
| 12 | Rủi ro | R5 |
| 13 | Bằng chứng | bảng đối chiếu + lệnh |

### M10.4 — Cổng chất lượng và rà ranh giới

| # | Mục | Nội dung |
|---|---|---|
| 1 | Mục tiêu | chạy toàn bộ cổng Mục 46 + grep gate B1–B12 trên **evidence commit** |
| 2 | Cơ sở | Mục 15, 17 |
| 3 | Preconditions | M10.2–M10.3 hoàn tất |
| 4 | Inspect | `frontend/package.json` scripts; workflow |
| 5 | Likely change | không có mã (chỉ sửa lỗi nếu cổng đỏ) |
| 6 | Steps | (1) 4 lệnh tĩnh; (2) `npm test` (hai nửa nếu sandbox giới hạn); (3) `npm run test:coverage`; (4) CI xanh gồm E2E; (5) grep gates; (6) ghi số thật |
| 7 | Tests | toàn bộ suite |
| 8 | Xác minh | như Mục 15 |
| 9 | Acceptance | AC-Q1…Q3, AC-R1, AC-R3 |
| 10 | Dependencies | M10.3 → M10.5 |
| 11 | Ngoài phạm vi | thay đổi kiến trúc |
| 12 | Rủi ro | R1, R6, R10 |
| 13 | Bằng chứng | log lệnh, CI run |

### M10.5 — QA thủ công và phân loại lỗi

| # | Mục | Nội dung |
|---|---|---|
| 1 | Mục tiêu | chạy Q1–Q12 (Mục 16) trên build cuối; phân loại P0–P3 |
| 2 | Cơ sở | bằng chứng thủ công hiện chỉ trên một môi trường; AT/thiết bị thiếu |
| 3 | Preconditions | M10.4; Backend thật cho owner |
| 4 | Inspect | Matrix M6/M8/M9 mục thủ công |
| 5 | Likely change | ảnh bằng chứng `docs/implementation/archive/sprint-f4/evidence/m10_*.png` (docs-only); sửa lỗi nếu P0/P1 |
| 6 | Steps | thực hiện Q1–Q12; ghi đủ trường; lỗi P0/P1 ⇒ mở sửa lỗi riêng (`M10.7`) và chạy lại cổng |
| 7 | Tests | thủ công |
| 8 | Xác minh | bản ghi đủ trường; ảnh |
| 9 | Acceptance | AC-Q4; không P0/P1 mở |
| 10 | Dependencies | M10.4 → M10.6 |
| 11 | Ngoài phạm vi | tuyên bố thiết bị chưa có |
| 12 | Rủi ro | R7 |
| 13 | Bằng chứng | bản ghi + ảnh |

### M10.6 — Tài liệu, phiên bản, Matrix và đóng sprint

| # | Mục | Nội dung |
|---|---|---|
| 1 | Mục tiêu | đồng bộ tài liệu, version, Evidence Matrix M10, đóng F4 |
| 2 | Cơ sở | FG-08/09; CHANGELOG/version/lockfile; Mục 45/47 |
| 3 | Preconditions | M10.5 không P0/P1; D-M10-04/05 chốt |
| 4 | Inspect | `Frontend_UI_Specification.md` (§12.5, §13–14, dòng 909–912, 1109, 1143), `Frontend_Architecture_Specification.md`, `frontend/CHANGELOG.md`, `package.json`, `package-lock.json`, F4 plan Mục 45/47, `router.tsx` |
| 5 | Likely change | docs: UI Spec, F4 plan, Matrix M10; **frontend:** `CHANGELOG.md`, `package.json`, `package-lock.json` (theo quyết định); xoá blueprint M10 |
| 6 | Steps | **6a** commit docs (UI Spec, F4 plan Mục 45/47) ⇒ **6b** commit version + CHANGELOG + lockfile (chạm `frontend/**` ⇒ CI ⇒ trở thành evidence commit mới; chạy lại cổng) ⇒ **6c** commit docs-only: Evidence Matrix M10 + xoá blueprint |
| 7 | Tests | `npm ci` sạch với lockfile mới; toàn bộ cổng sau 6b |
| 8 | Xác minh | `npm ci && npm run build && npm test` (cục bộ); CI xanh trên commit 6b |
| 9 | Acceptance | AC-D1…D6, AC-S1…S3 |
| 10 | Dependencies | M10.5 → đóng |
| 11 | Ngoài phạm vi | tag/release/deploy; đổi version Backend |
| 12 | Rủi ro | R8, R9 |
| 13 | Bằng chứng | link CI 6b, diff docs, Matrix |

## 23. Task Dependencies

```text
M10.1 ──► M10.2 ──► M10.3 ──► M10.4 ──► M10.5 ──► M10.6 (đóng)
 ▲ owner: 5 quyết định (Mục 20.1) + chấp nhận đóng M9
Tiền đề (đã xong): S4.1 → S4.2 → S4.3 → S4.11 → S4.7 → S4.4 → S4.5 → S4.6 → S4.8 → S4.9 → [M10]
Hạ nguồn: sprint Backend (FG-01/13/14) · F5 (Interpretation UI)
```

M10.2 và M10.3 có thể song song về kỹ thuật nhưng giữ tuần tự để E2E cung cấp phản hồi thật cho đối chiếu. Phát hiện P0/P1 ở bất kỳ bước nào ⇒ chèn task sửa lỗi (mẫu `M*.n`) rồi chạy lại từ M10.4.

## 24. File Change Map

| File / thư mục | Hành động | Mục đích | Task | Bằng chứng |
|---|---|---|---|---|
| `frontend/e2e/chart.spec.ts` | **Create** | hai kịch bản chính | M10.2 | chưa tồn tại (Predictive) |
| `.github/workflows/frontend-ci.yml` | Modify (+1 bước) | upload báo cáo Playwright khi lỗi (D-M10-07) | M10.2 | Verified tồn tại |
| `frontend/src/features/chart/api/mocks/fixtures.contract.test.ts` và/hoặc `model/chartViewModel.test.ts` | Modify (thêm test) | G-1 dung sai diễn giải | M10.3 | Verified tồn tại |
| `frontend/src/features/chart/api/types.ts` | Inspect only | đối chiếu hợp đồng | M10.3 | Verified |
| `docs/frontend/Frontend_UI_Specification.md` | Modify (docs) | §12.5, §13–14, ghi chú Recharts/Framer | M10.6a | Verified |
| `docs/frontend/Frontend_Architecture_Specification.md` | Inspect → Modify nếu sai sự thật | FG-09 | M10.6a | Verified |
| `docs/implementation/Sprint_F4_Implementation_Plan.md` | Modify (docs) | Mục 45 baseline, Mục 47 trạng thái | M10.6a | Verified |
| `frontend/CHANGELOG.md` | Modify | mục F4 | M10.6b | Verified |
| `frontend/package.json`, `frontend/package-lock.json` | Modify | version F4 + đồng bộ lockfile | M10.6b | Verified (lệch 0.2.0/0.1.0) |
| `docs/implementation/archive/sprint-f4/Sprint_F4_M10_Exit_Criteria_Evidence_Matrix.md` | **Create** | bằng chứng cuối | M10.6c | Predictive |
| `docs/implementation/archive/sprint-f4/evidence/m10_*.png` | **Create** | ảnh QA thủ công | M10.5 | Predictive |
| `docs/implementation/Sprint_F4_M10_Implementation_Plan.md` | Create → **xoá** | blueprint | M10.1/M10.6c | — |
| `backend/**`, `frontend/src/features/**` (mã sản phẩm) | **Không đổi** (trừ sửa lỗi P0/P1 được duyệt riêng) | — | — | Gate |

## 25. E2E Test Matrix

> Tất cả `PLANNED` (chưa viết/chạy). Môi trường: CI Backend thật, Desktop Chrome.

| ID | Scenario/bước | Khẳng định | Nguồn chân lý | Tín hiệu chờ | Rủi ro |
|---|---|---|---|---|---|
| E-S1.1 | 1 / đăng ký+đăng nhập | vào `/app`, không lỗi | UI | `expect(page).toHaveURL` | R1 |
| E-S1.2 | 1 / tạo hồ sơ (biết giờ) | hồ sơ hiển thị | UI + mock vị trí | `expect(...).toBeVisible` | R2 |
| E-S1.3 | 1 / tính lá số | `POST /charts/natal` thành công; 14 trường; `isHouseDataAvailable=true`; URL `/app/charts/<uuid>`; focus `h1` | **phản hồi API** | `waitForResponse` | R5 |
| E-S1.4 | 1 / nội dung viewer | wheel + ba bảng; số hàng khớp API; định dạng độ | API + UI | `expect.poll`/web-first | R1 |
| E-S1.5 | 1 / chọn từ wheel | `aria-pressed`, hàng bảng, detail, status, chip lọc | UI | web-first | R1 |
| E-S1.6 | 1 / Esc | về mặc định | UI | web-first | — |
| E-S1.7 | 1 / chọn từ bảng aspect | detail aspect; trạng thái ở hàng | UI | web-first | — |
| E-S1.8 | 1 / công tắc aspect | lớp biến mất/hiện; bảng không đổi | UI | web-first | — |
| E-S1.9 | 1 / danh sách + mở lại + Back | chart có trong danh sách; viewer tải lại | UI | `waitForResponse`/URL | R1 |
| E-S1.10 | 1 / quan sát lỗi | 0 `pageerror`; 0 phản hồi `/api/` ≥ 400 ngoài allowlist | listener | — | R1 |
| E-S2.0 | 2 / probe | quyết định mức B hay `FIXTURE-BASED` | Backend thật | — | R4 |
| E-S2.1 | 2 / hồ sơ không rõ giờ | lưu được | UI | — | R4 |
| E-S2.2 | 2 / phản hồi | `isHouseDataAvailable=false`, `houses=[]`, `angles=[]`, hành tinh có | **phản hồi API** | `waitForResponse` | R4 |
| E-S2.3 | 2 / thông báo | `HouseDataNotice`; không lỗi chung | UI | web-first | — |
| E-S2.4 | 2 / wheel | 12 cung + hành tinh; không `NaN`/`undefined` | UI | web-first | — |
| E-S2.5 | 2 / bảng | không bảng Nhà; cột Nhà không bịa số | UI | web-first | — |
| E-S2.6 | 2 / chọn hành tinh | hoạt động | UI | web-first | — |
| E-S2.7 | 2 / quan sát lỗi | như E-S1.10 | listener | — | R1 |
| E-S2.8 | 2 / `warnings` | hiển thị đúng nếu có | API + UI | — | — |
| E-REG | hồi quy | `smoke`, `auth`, `birth-profile`, `chart-list`, `layout`, `Select` đều xanh | CI | — | R1 |

## 26. Regression Matrix

| Milestone | Hành vi cần bảo vệ | Test hiện có | Đánh giá |
|---|---|---|---|
| S4.1 | API client + DTO + fixture CAPTURED/DERIVED | `api/*.test`, `fixtures.contract.test` | chạy lại; thêm G-1 |
| S4.2 | VM, nhãn, định dạng; thiếu nhà | `chartViewModel/labels/format.test` | chạy lại |
| S4.3 | tính lá số, trạng thái tải/lỗi/rỗng, 403/404 | `page.test`, E2E chart-list | chạy lại |
| S4.11 | danh sách, nav, cô lập tài khoản | component + `chart-list.spec` | chạy lại (CI) |
| S4.7 | ba bảng + thẻ | test từng bảng | chạy lại |
| S4.4 | wheel, 12 cung, nhà, góc | `geometry/wheelGeometry/*Layer` | chạy lại |
| S4.5 | hành tinh, ℞, dàn nhãn, overflow | `labelLayout/planetGeometry/PlanetLayer` | chạy lại |
| S4.6 | aspect, công tắc, legend | `aspectGeometry/AspectLayer/Legend` | chạy lại |
| S4.8 | đồng bộ chọn, Esc, live region, focus | `selection/SelectionDetail/Shell` | chạy lại; E2E S1.5–S1.7 |
| S4.9 | ba chế độ, zoom, khung, skip link, motion | Shell/zoom/Wheel/layout tests, `layout.spec` | chạy lại |
| Birth Profile | form, validation, CRUD | `birth-profile.spec`, test form | chạy lại |
| Auth/Routing | đăng ký/đăng nhập/guard | `auth.spec`, `router.test` | chạy lại |
| Tính ổn định | không `console.error` bất thường, không crash | E-S1.10 / E-S2.7 | **mới** |

**Kết quả pre-audit `[run]`:** toàn bộ 130 file / 1041 test qua tại HEAD; E2E hiện có Success trên CI #287.

## 27. Compatibility Matrix (Frontend ↔ Backend)

| # | Hạng mục | Backend | Frontend | Fixture | Backend thật (E2E) | Rủi ro |
|---|---|---|---|---|---|---|
| C-1 | 14 trường `ChartResponse` | `chartResponseSchema` | `ChartResponse` | `fixture_full/nohouse` | S1.3/S2.2 (keys ⊇ 14) | thấp |
| C-2 | `interpretations`/`tone`/`interpretationVersion` | `tone` nullable+optional; `interpretationVersion` nullable | `tone?: string\|null`; `string\|null` | `"1.0"` | S1.3 | thấp — thêm test G-1 |
| C-3 | `isHouseDataAvailable` + `houses/angles` | `houses.length===12` | VM: `isHouseDataAvailable` | `fixture_nohouse` | S2.2 | thấp |
| C-4 | `chartType` | `string` | literal `"Natal"` | `"Natal"` | S1.3 | thấp (KG-M10-04) |
| C-5 | endpoint & auth | `/api/v1/charts…` Bearer | `apiClient` + refresh | — | toàn bộ E2E | thấp |
| C-6 | lỗi 404/403 (tiếng Việt) | `RESOURCE_NOT_FOUND`/`FORBIDDEN` | `page.tsx` map | — | chart-list.spec | thấp |
| C-7 | `GET /charts` + phân trang | `listChartsQuerySchema` | `listCharts.ts` | — | chart-list.spec | FG-13/14 (đã biết) |
| C-8 | `birthProfileLabel` | luôn `null` | ghép client `pageSize=100` | — | — | FG-13 (Backend) |

Không có lệch **chặn**. Mọi lệch ghi nhận đều thấp hoặc đã có FG.

## 28. Manual QA Matrix

Ánh xạ Q1–Q12 (Mục 16) tới tiêu chí Mục 49:

| Mục 49 | Q liên quan | Ghi chú bằng chứng |
|---|---|---|
| Birth Profile | Q1 | |
| Calculate Chart | Q1, Q10 | |
| Chart Viewer | Q2, Q1 | đối chiếu wheel↔bảng↔API |
| Bảng | Q2 | |
| Saved Charts List | Q11 | desktop và mobile |
| Đồng bộ | Q1, Q4 | |
| Thiếu giờ sinh | Q3 | |
| A11y | Q4, Q7, Q8, Q9 | AT/thiết bị có thể `ACCEPTED GAP` |
| Responsive | Q5, Q6 | cảm ứng thật có thể `ACCEPTED GAP` |
| Chất lượng | Q10, Q12 | |

## 29. Architecture Boundary Matrix

| Gate | Task chạy | Công cụ | Chặn nếu vi phạm |
|---|---|---|---|
| B1–B2 | M10.4 | grep | có |
| B3 | M10.4 | grep + đọc `shared/stores` | có |
| B4–B5 | M10.4 | grep | có |
| B6 | M10.4 | `git diff` `package.json` | có |
| B7–B8 | M10.4 | grep + đọc mã | có |
| B9 | M10.4 | grep | không (ghi nợ có sẵn) |
| B10–B12 | M10.4 | grep + rà | có (B10, B11) |

## 30. Documentation Matrix

| Tài liệu | Task | Kiểm chứng | Chặn đóng |
|---|---|---|---|
| UI Spec §12.5 | M10.6a | đối chiếu `ChartWheel.tsx`/`PlanetLayer.tsx` | có (FG-08) |
| UI Spec §13–14 | M10.6a | đối chiếu `router.tsx` (bảng Mục 18) | có (FG-09) |
| UI Spec ghi chú Recharts/Framer | M10.6a | `package.json` không có hai thư viện | có (FG-09) |
| Architecture Spec | M10.6a | rà nội dung nhắc thư viện | không |
| CHANGELOG F4 | M10.6b | đối chiếu theo milestone + Matrix | có |
| `package.json`/lockfile | M10.6b | `npm ci` + build | theo D-M10-04 |
| F4 plan Mục 45/47 | M10.6a | số liệu thật | có |
| Evidence Matrix M10 | M10.6c | Mục 34 | có |

## 31. Known Gaps Matrix

Dùng bảng Mục 20 làm nguồn; Evidence Matrix M10 bổ sung các cột: **Trạng thái cuối** (resolved / defer / accepted), **Chủ sở hữu** (Backend sprint / F5 / quyết định kiến trúc), **Bằng chứng**. Quy tắc: không đánh dấu `resolved` khi chưa có bằng chứng; mục "Requires Backend change" chỉ được chuyển giao, không tự sửa.

---

## 32. Acceptance Criteria

> **Mọi tiêu chí hiện `NOT STARTED`.** Chỉ chuyển `VERIFIED` khi có lệnh đã chạy, job CI Success trên evidence commit, hoặc bằng chứng thủ công đủ trường. Tiêu chí thiếu thiết bị ghi `ACCEPTED GAP` có lý do.

| ID | Nhóm | Tiêu chí | Truy vết | Bằng chứng cần có |
|---|---|---|---|---|
| AC-E1 | E2E | tồn tại `frontend/e2e/chart.spec.ts` với **đúng hai** kịch bản chính | prompt; F4 dòng 638 | file + CI |
| AC-E2 | | Scenario 1 xanh trên Backend thật | Mục 12 | CI `test:e2e` |
| AC-E3 | | Scenario 2 xanh (Backend thật; hoặc dự phòng có nhãn `FIXTURE-BASED` kèm lý do probe) | Mục 13 | CI + kết quả probe |
| AC-E4 | | không `waitForTimeout`/sleep; chờ theo điều kiện | Mục 11 | `grep` |
| AC-E5 | | dữ liệu tạo mới, độc lập, không phụ thuộc thứ tự | Mục 11 | đọc mã |
| AC-E6 | | toàn bộ 6 spec E2E hiện có vẫn xanh | Mục 14 | CI |
| AC-E7 | | không `pageerror`/phản hồi `/api/` ≥ 400 ngoài allowlist trong hai kịch bản | D-M10-09 | CI |
| AC-C1 | Tương thích | 14 trường `ChartResponse` khớp Backend (đã đối chiếu) và được khẳng định trong E2E | Mục 10 | bảng + E2E |
| AC-C2 | | test dung sai `interpretations` rỗng/thiếu `tone`/`interpretationVersion:null` | G-1 | `vitest` |
| AC-C3 | | `fixtures.contract.test.ts` và test VM xanh | Mục 26 | `vitest` |
| AC-C4 | | không đổi Backend/DTO; lệch (nếu có) ghi KG | Mục 9 | `git diff` |
| AC-R1 | Hồi quy | toàn bộ test hiện có xanh, **không** xoá/làm yếu test | Mục 14 | `npm test` |
| AC-R2 | | đối chiếu Matrix M1–M9, M11: không blocker mở | Mục 6–7 | bảng |
| AC-R3 | | CI xanh trên evidence commit | Mục 15 | link CI |
| AC-Q1 | Chất lượng | `lint`, `typecheck`, `format:check`, `test`, `test:coverage`, `build` đạt | F4 Mục 46 | lệnh + CI |
| AC-Q2 | | grep gate B1–B12 sạch (B9: chỉ nợ có sẵn) | Mục 17 | grep |
| AC-Q3 | | không dependency mới; không `dangerouslySetInnerHTML` | F4 Mục 49 | `git diff`, grep |
| AC-Q4 | | QA thủ công Q1–Q12 ghi đủ trường; không P0/P1 mở | Mục 16 | Matrix + ảnh |
| AC-D1 | Tài liệu | UI Spec §12.5, §13–14 khớp mã (FG-08/09 đóng) | Mục 18 | diff |
| AC-D2 | | `CHANGELOG.md` có mục F4 trung thực | Mục 18 | diff |
| AC-D3 | | version/lockfile theo D-M10-04 và `npm ci` sạch | Mục 19 | CI |
| AC-D4 | | F4 plan Mục 45/47 cập nhật | Mục 18 | diff |
| AC-D5 | | Evidence Matrix M10 đủ mục, bằng chứng thật | Mục 34 | file |
| AC-D6 | | blueprint M10 đã xoá | quy ước | `ls` |
| AC-S1 | Sprint | mọi mục Mục 49 có bằng chứng ánh xạ (Mục 37) | F4 Mục 49 | bảng |
| AC-S2 | | mọi Known Gap có phân loại + chủ sở hữu | Mục 20, 31 | Matrix |
| AC-S3 | | checklist đóng sprint hoàn tất (Mục 35) | — | Matrix |

## 33. Test Environment and Reproduction Guide

| Môi trường | Khả năng | Ghi chú |
|---|---|---|
| **CI (`Frontend CI`)** | Postgres 16 service + build/migrate/chạy Backend + Playwright Chromium + `npm run test:e2e` + `test:coverage` | môi trường chuẩn cho bằng chứng E2E/Backend thật; chỉ trạng thái job (Success/Failure) xem được công khai, log từng bước cần đăng nhập |
| **Sandbox phiên audit** | Node/npm; `npm ci` frontend; Vitest; build; **không** có Postgres/Backend đang chạy | đã chạy: 4 cổng tĩnh + 130 file/1041 test. **Không** chạy: Backend, `test:e2e`, `test:coverage` |
| **Máy owner/dev** | có thể dựng Postgres + Backend theo các bước trong workflow | dùng cho probe Scenario 2 và QA thủ công; ghi phiên bản hệ điều hành/trình duyệt |

**Chạy cục bộ (khi đủ điều kiện):** (1) Postgres + `.env` Backend theo `backend/.env.example` (không dùng bí mật thật); (2) `prisma:deploy`, build, `node dist/server.js` với `NODE_ENV=test`; (3) `cd frontend && cp .env.example .env && npm ci`; (4) `npx playwright install chromium` (một lần); (5) `npm run test:e2e` hoặc `npx playwright test e2e/chart.spec.ts`. Lỗi thiếu Postgres/Prisma engine trong sandbox **không** được hiểu là lỗi mã.

## 34. Evidence Matrix Plan

**Tên file:** `docs/implementation/archive/sprint-f4/Sprint_F4_M10_Exit_Criteria_Evidence_Matrix.md` (mẫu M1–M9, M11).

| Phần | Nội dung |
|---|---|
| Header | phạm vi (M10.1–M10.6), **Evidence commit** + link CI (quy ước D-C3), danh sách commit docs-only sau đó, ngày, người review, trạng thái ký hiệu |
| Kết luận | `PASS` / `PASS WITH KNOWN GAPS` / `FAIL`, đếm AC `VERIFIED`/`ACCEPTED GAP` |
| 1. Tiêu chí AC-E/C/R/Q/D/S | bảng: ID · tiêu chí · bằng chứng · nguồn (`[repo]/[run]/[ci]/[owner]`) · trạng thái |
| 2. Quyết định `D-M10-*` | từng quyết định, người duyệt, ngày |
| 3. Đối chiếu milestone | S4.1–S4.9, S4.11: trạng thái xác minh lại (không chỉ nhãn) |
| 4. E2E | kết quả hai kịch bản, probe Scenario 2 (kết quả + nhãn `FIXTURE-BASED` nếu có), bộ E2E hiện có |
| 5. Tương thích Backend | bảng Mục 27 + cách xác minh (fixture vs Backend thật) |
| 6. Cổng chất lượng | số thật: file/test, coverage (nếu đọc được), exit code từng lệnh |
| 7. Ranh giới kiến trúc | kết quả grep B1–B12 |
| 8. QA thủ công | Q1–Q12 đủ trường + ảnh; `ACCEPTED GAP` rõ ràng |
| 9. Tài liệu & version | diff tham chiếu, version cuối, lockfile |
| 10. Known Gaps cuối | bảng Mục 31 với trạng thái cuối/chủ sở hữu |
| 11. Mục 49 | ánh xạ Mục 37 |
| 12. Khuyến nghị đóng | một khuyến nghị (Mục 39 mẫu) |

**Quy tắc bằng chứng (nhất quán với M5–M9):** chỉ ghi lệnh/CI **đã thật sự có**; nêu rõ khi không thể kiểm (ví dụ không dựng được Backend trong sandbox); không viết "đạt" cho CSS-only/AT/thiết bị chỉ vì test class; số test/coverage lấy từ lệnh hoặc job, không suy diễn.

## 35. Sprint Closure Checklist

- [ ] Owner đã xác nhận 5 quyết định (D-M10-01/04/05/07/08) và chấp nhận đóng M9
- [ ] `chart.spec.ts` (hai kịch bản) xanh trên CI với Backend thật; bộ E2E cũ xanh
- [ ] Probe Scenario 2 đã chạy; kết quả + nhãn mức bằng chứng được ghi
- [ ] 14 trường hợp đồng đối chiếu; test dung sai diễn giải đã thêm và xanh
- [ ] 4 cổng tĩnh + `npm test` + `test:coverage` + `build` đạt; CI xanh trên evidence commit
- [ ] Grep gate B1–B12 sạch (B9 chỉ nợ có sẵn); không dependency mới
- [ ] QA thủ công Q1–Q12 ghi đủ trường; không P0/P1 mở; `ACCEPTED GAP` nêu rõ
- [ ] UI Spec §12.5, §13–14 (và ghi chú Recharts/Framer) khớp mã; F4 plan Mục 45/47 cập nhật
- [ ] CHANGELOG có mục F4; version + lockfile nhất quán (`npm ci` sạch)
- [ ] Evidence Matrix M10 hoàn chỉnh; Known Gaps ghi đủ phân loại/chủ sở hữu
- [ ] Blueprint M10 đã xoá; **không** tag/release/deploy trừ khi owner quyết định riêng

## 36. Final Architect Review

| Mảng | Câu hỏi | Đánh giá |
|---|---|---|
| Phạm vi | M10 là QA/đóng sprint, không thêm tính năng? | **Có**; mã sản phẩm không đổi (trừ sửa lỗi P0/P1 được duyệt riêng) |
| Thứ tự | giữ thứ tự đóng băng v1.1/phương án B? | **Có** (Mục 5) |
| Tiền nhiệm | thực sự đã đóng (mã + CI), không chỉ nhãn? | **Có** (Mục 6, 3); phần thủ công M9 chờ owner |
| E2E | đúng hai kịch bản chính, không trùng `chart-list.spec`, Backend thật? | **Có** (Mục 11–13); Scenario 2 cần probe |
| Tương thích | 14/14 trường, lệch ghi nhận? | **Có**; `chartType` literal (KG-M10-04) |
| Hồi quy | không làm yếu test, chỉ thêm khi có khoảng trống? | **Có** (G-1) |
| Cổng chất lượng | script có thật, bằng chứng đúng nguồn? | **Có**; `test:coverage`/`test:e2e` bằng chứng `[ci]` |
| Ranh giới | công cụ tự động còn thiếu được bù bằng grep? | **Có** (`boundaries` tắt — FG-10) |
| Tài liệu | FG-08/09 đóng trước khi đóng sprint? | **Có** (M10.6a) |
| Phiên bản | không tự đặt số? | **Có**; D-M10-04 owner |
| Tự thừa nhận | | Backend/E2E chưa chạy trong sandbox; coverage % chưa đọc; thiết bị/AT thiếu; mọi `PLANNED` chưa được kiểm chứng |

## 37. Definition of Done — ánh xạ F4 plan Mục 49

| Mục 49 | Bằng chứng ánh xạ | Nguồn dự kiến |
|---|---|---|
| Birth Profile — truy cập được, validation không đổi, thẻ có "Tính lá số" | E-S1.2/S1.3, `birth-profile.spec`, test form | CI + vitest |
| Calculate Chart — kích hoạt, trạng thái tải, lỗi tiếng Việt, điều hướng `/app/charts/:chartId` | E-S1.3, `page.test`, Q10 | CI + thủ công |
| Chart Viewer — wheel từ dữ liệu Backend (12 cung, nhà, hành tinh, góc, ℞, aspect, độ) | E-S1.4, Q2, test layer | CI + thủ công |
| Bảng — Planet/House/Aspect ngữ nghĩa, hoạt động | E-S1.4, test bảng | CI + vitest |
| Saved Charts List — `GET /charts`, chỉ chart của user (hai tài khoản), nav desktop/mobile | `chart-list.spec` (hai tài khoản), E-S1.9, Q11 | CI + thủ công |
| Đồng bộ — một nguồn `selection` | E-S1.5–S1.7, `selection.test`, Shell | CI + vitest |
| Thiếu giờ sinh — không lỗi, thông báo rõ, hành tinh/cung dùng được | E-S2.\*, Q3 | CI + thủ công |
| A11y — phương án bảng, bàn phím, không chỉ màu, thủ công ghi | axe tests, Q4/Q7–Q9 | vitest + thủ công (`ACCEPTED GAP` nếu thiếu AT) |
| Responsive — desktop/tablet/mobile, cảm ứng | test viewport, Q5–Q6 | vitest + thủ công (`ACCEPTED GAP` nếu thiếu thiết bị) |
| Chất lượng — test xanh, test mới phủ lõi, 4 lệnh pass, CI xanh commit cuối, không `dangerouslySetInnerHTML`, không dependency mới, Matrix thật | Mục 15, 17, 34 | lệnh + CI |

## 38. Handoff and F5 Readiness

| Hạng mục | Chủ sở hữu | Nội dung |
|---|---|---|
| **Backend follow-ups** | sprint Backend sau | FG-01 (`birthProfileId`/`isBirthTimeKnown`), FG-13 (`birthProfileLabel`), FG-14 (`chartType`/`isHouseDataAvailable` trong summary), FG-04 (`isApplying` ba trạng thái) |
| **Quyết định kiến trúc** | owner | FG-03 (guest chart), FG-07 (độ bất định Mặt Trăng/thiếu giờ) |
| **F5 (Interpretation UI)** | F5 | `interpretations`/`interpretationVersion` đã có trong DTO và **được frontend bỏ qua**; viewer không phụ thuộc diễn giải ⇒ F5 gắn thêm không phá viewer; cần UI chọn ngôn ngữ/tone |
| **Nợ cục bộ** | backlog Core | `<title>` động, focus sau điều hướng, drawer focus trap, `href="/"` (FG-10), bật lại ESLint `boundaries`, nâng Node 20 CI |
| **Chất lượng E2E** | backlog | thêm project mobile/cảm ứng, chia sẻ helper E2E (KG-M10-03/05) |
| **Thiết bị/AT** | owner | bổ sung macOS/iOS/Android/NVDA/VoiceOver (`ACCEPTED GAP`) |

## 39. Final Recommendation

**`CONDITIONALLY READY`**

Điều kiện (không có blocker kỹ thuật):

1. Owner xác nhận **D-M10-01, D-M10-04, D-M10-05, D-M10-07, D-M10-08** (Mục 20.1), đặc biệt số phiên bản F4 và phạm vi sửa UI Spec.
2. Owner chấp nhận đóng M9 (Matrix M9 hiện `READY FOR OWNER REVIEW / CLOSURE`).
3. Chạy được Backend thật (CI hoặc máy có Postgres) để thực hiện **probe Scenario 2**; nếu probe thất bại thì dùng dự phòng `FIXTURE-BASED` có nhãn, không tuyên bố đã xác minh Backend.
4. Chấp nhận trước các giới hạn bằng chứng kế thừa (một nền tảng thủ công, chưa có trình đọc màn hình/thiết bị khác) dưới dạng `ACCEPTED GAP`.

---

## Phụ lục A — M10.1 Preflight Record (2026-10-28)

### A.1 Kết quả kiểm tra bước 1–3 (Sự thật môi trường & Baseline)

| Hạng mục | Lệnh / Nguồn | Kết quả thực tế | Môi trường | Nguồn bằng chứng |
|---|---|---|---|---|
| Trạng thái git | `git status`, `git rev-parse HEAD` | Nhánh `dev`, HEAD `25f9b6c299f641fec005ed60b10099c8b56a1568` (`25f9b6c`) | Cục bộ | `[run]` |
| Diff so với evidence commit M9 | `git diff --stat 3827277 HEAD` | Chỉ chạm `docs/**` (2 files, 49 ins, 912 del) | Cục bộ | `[run]` |
| Evidence CI M9 (#287) | `actions/runs/40256277594` | **Success** (4m3s, job `build` 3m58s, 1 warning Node 20 deprecation) trên commit code `3827277` | GitHub Actions | `[ci]` |
| Format check | `npm run format:check` | Exit code 0 (All matched files use Prettier code style!) | Windows Sandbox | `[run]` |
| Lint | `npm run lint` | Exit code 0 (0 errors, 0 warnings) | Windows Sandbox | `[run]` |
| Typecheck | `npm run typecheck` | Exit code 0 (tsc app & node sạch) | Windows Sandbox | `[run]` |
| Build Vite production | `npm run build` | Exit code 0 (thời gian: 20.52s, dist tạo đủ bundle) | Windows Sandbox | `[run]` |
| Vitest (Nửa 1: `chart` + `pages`) | `npm test -- src/features/chart src/pages` | **53 test files passed (53)**, **657 tests passed (657)**, exit code 0 | Windows Sandbox | `[run]` |
| Vitest (Nửa 2: phần còn lại) | `npm test -- src/features/birth-profile src/shared src/widgets src/test src/features/auth src/app` | **77 test files passed (77)**, **384 tests passed (384)**, exit code 0 | Windows Sandbox | `[run]` |
| Vitest tổng hợp toàn bộ | Tổng 2 nửa | **130 test files passed (130)**, **1041 tests passed (1041)**, exit code 0 | Windows Sandbox | `[run]` |
| E2E test & Backend | `npm run test:e2e` | `UNVERIFIED (không dựng được Postgres/Backend trong sandbox phiên này)` | Sandbox | `[repo]`/`[ci]` (CI #287 Success) |
| Upload step hiện có | Đọc `.github/workflows/frontend-ci.yml` | Tên `Upload backend log on failure`, `if: failure()`, `uses: actions/upload-artifact@v4`, `name: backend-log`, `path: backend/backend.log`, không set `retention-days` | `.github/` | `[repo]` |
| Cấu hình Playwright | Đọc `frontend/playwright.config.ts` | `reporter: "html"`, `trace: "on-first-retry"`, `screenshot: "only-on-failure"`, `video: "retain-on-failure"`, `outputDir` mặc định `test-results/` | `frontend/` | `[repo]` |
| Gitignore artifacts | Đọc `frontend/.gitignore` | Chứa `playwright-report` (dòng 28) và `test-results` (dòng 29) | `frontend/` | `[repo]` |
| Recharts / Framer Motion | Grep `frontend/package.json` và `src/**` | 0 dependency trong `package.json`, 0 import trong mã nguồn `src/**` | `frontend/` | `[repo]` |
| Script phụ thuộc version | Grep `.github/` | 0 workflow hay script nào phụ thuộc version string | `.github/` | `[repo]` |
| Mismatch version frontend | Đọc `package.json` và `package-lock.json` | `package.json` ghi `"0.2.0"`; `package-lock.json` ghi `"0.1.0"` (cả root và `packages[""]`) | `frontend/` | `[repo]` |

### A.2 Bảng Làm rõ C1–C5

| ID | Vấn đề phát hiện | Tác động | Trạng thái | Quyết định đã chốt từ Owner |
|---|---|---|:---:|---|
| **C1** | D-M10-04: Phiên bản F4 | Nâng phiên bản và đồng bộ lockfile | **RESOLVED** | **Chấp thuận 0.3.0**: Nâng `package.json` lên `0.3.0` và đồng bộ lockfile ở task M10.6b. |
| **C2** | D-M10-07 ↔ Playwright config: trace có thể chứa token/secret ở CI | Bảo mật token / secret trên CI artifact | **RESOLVED** | **Chấp thuận Phương án (A)**: Tắt trace ở CI (`trace: process.env.CI ? "off" : "on-first-retry"`), giữ screenshot/video on failure và log; thêm bước upload Playwright report vào CI. |
| **C3** | Tiền điều kiện P2: Nghiệm thu đóng M9 | Tiền điều kiện đóng F4 | **RESOLVED** | **Chấp thuận đóng M9**: Matrix M9 đã được chuyển trạng thái sang `PASS (ACCEPTED BY OWNER)`. |
| **C4** | D-M10-08: Phê duyệt từng gap thủ công | Phân định rõ `ACCEPTED GAP` vs `UNVERIFIED` | **RESOLVED** | **Chấp thuận nguyên tắc gap**: Chấp nhận ghi `ACCEPTED GAP` theo D-M10-08 cho các phần thiếu thiết bị chuyên dụng sau khi chạy QA ở M10.5. |
| **C5** | D-M10-02/03/06/09/10: Các đề xuất thiết kế E2E và quy ước | Thiết kế chi tiết M10.2 và Matrix | **RESOLVED** | **Chấp thuận toàn bộ**: Helper cục bộ trong `chart.spec.ts`, Scenario 1 tập trung viewer/đồng bộ, Known Gaps trong Matrix M10, allowlist 401 refresh trước login, ánh xạ P0–P3. |

### A.3 Danh sách ràng buộc ghi nhớ cho M10.2

1. **Probe Scenario 2 phải kiểm cả phía yêu cầu (Request) và phản hồi (Response):**
   - Phía Request: Form tạo hồ sơ gửi đúng `isBirthTimeKnown: false` ⟺ `birthTime: null` (INV-BP1) bắt bằng `page.waitForRequest`.
   - Phía Response: Kiểm tra phản hồi `POST /api/v1/charts/natal`: `isHouseDataAvailable === false`, `houses = []`, `angles = []`, hành tinh có đầy đủ nhưng `house` là `null`.
   - Đối chiếu chặt chẽ với logic Backend tại `chart-builder.ts:73-90` và `chart-response.mapper.ts`.
2. **Hardening CI workflow step (sau khi C2 được chốt):**
   - Điều kiện chạy: `if: failure()`.
   - Tải lên thư mục `frontend/playwright-report` (và `frontend/test-results` nếu có ảnh/video).
   - Thiết lập `if-no-files-found: warn` để lỗi thiếu artifact hiển thị rõ trong action log.
   - Tên artifact gắn run id (ví dụ `playwright-report-${{ github.run_id }}`).
   - Giữ nguyên bước upload `backend-log` hiện có.
3. **Mức bằng chứng:**
   - E2E Backend thật phải có bằng chứng từ `[ci]` (GitHub Actions run) hoặc log chạy cục bộ của owner có Postgres.
   - Không dùng fixture-based fallback để thay thế hay tuyên bố đã xác minh tích hợp Backend thật.
