# Sprint F2 — M8 Implementation Plan
## Testing Consolidation & E2E

---

## ⚠️ 3 phát hiện quan trọng, đọc trước khi vào plan (evidence từ repo thật, HEAD `50c065d`)

### Phát hiện 1 — CI hiện tại sẽ FAIL ngay khi thêm `auth.spec.ts` thật, vì không có backend/DB trong CI

Đọc trực tiếp `.github/workflows/frontend-ci.yml`: **đã chạy `npm run test:e2e`** (kể cả `npx playwright install --with-deps`) — nhưng **không có service Postgres/backend nào** trong workflow. 3 spec E2E hiện có (`smoke.spec.ts`, `layout.spec.ts`, `Select.spec.ts`) đều không cần backend (chỉ test static page/style-guide) nên CI "tình cờ" pass từ trước tới nay. Ngay khi `auth.spec.ts` (cần Register/Login thật qua backend) được thêm vào `e2e/`, **CI sẽ fail** vì không có backend nào chạy.

**Đây đúng là tình huống §30 (CI Considerations) yêu cầu phân biệt tường minh** — không được âm thầm hạ thấp Exit Criteria. Xử lý: `auth.spec.ts` **skip tường minh trong CI** (`test.skip(!!process.env.CI, "Yêu cầu backend thật + Postgres — CI chưa có hạ tầng này (out of scope M8)")`), 3 spec cũ tiếp tục chạy trong CI như hiện tại. `npm run test:e2e` trở thành: **Local Acceptance Requirement** (Exit Criteria đầy đủ, chạy với backend thật) khác với **CI Requirement** (chỉ 3 spec cũ, `auth.spec.ts` skip có lý do rõ ràng). Thêm CI service Postgres+backend đầy đủ là công việc hạ tầng CI/DevOps riêng, vượt phạm vi "Testing Consolidation" của M8 (Rule 11) — không thực hiện ở đây.

### Phát hiện 2 — Coding Standards §13.3 yêu cầu MSW handlers tập trung ở `features/*/api/mocks/handlers.ts`, nhưng M1-M7 đều đặt handler inline trong từng test

Đọc trực tiếp `docs/frontend/Frontend_Coding_Standards.md` §13.3: *"Toàn bộ mock network qua MSW, đặt trong `features/*/api/mocks/handlers.ts`"*. Đọc trực tiếp toàn bộ test M1-M7 (`client.test.ts`, `useLoginMutation.test.tsx`, `useRegisterMutation.test.tsx`, `useLogoutMutation.test.tsx`, `useSessionBootstrap.integration.test.tsx`, `page.test.tsx` Login/Register, `UserMenu.test.tsx`) xác nhận: **100% dùng `server.use()` inline trong từng file**, không file nào có `features/auth/api/mocks/handlers.ts`.

**Đây là mâu thuẫn thật giữa tài liệu và thực tế** (§13.3 vs code M1-M7) — theo đúng Rule 14, không tự ý chọn 1 bên và giấu đi. **Không retrofit M1-M7** (Rule 11/12: M8 không phải sprint refactor, các test hiện có đã "adequate"). **Nhưng file M8 mới** (`auth-flow.integration.test.tsx`) cần mock nhiều endpoint trong 1 luồng dài — đây là cơ hội hợp lý đầu tiên để tuân đúng §13.3: tạo `features/auth/api/mocks/handlers.ts` cho riêng M8 dùng, ghi rõ trong plan rằng M1-M7's inline pattern là **known deviation, ghi nhận nhưng không sửa lại**.

### Phát hiện 3 — Không có "protected resource" thật nào để trigger 401 giữa phiên (Frontend chưa có tính năng nào ngoài Auth)

§27 yêu cầu: *"If the application requires a specific protected API request to trigger the 401, use that existing request. Do not create fake production APIs solely for testing unless absolutely necessary."* Đọc `pages/app/page.tsx`: placeholder tĩnh, **không gọi API nào**. Không có Birth Profile/Chart UI nào tồn tại ở Frontend (F3+ chưa bắt đầu). Không có request "protected resource" thật nào để tái sử dụng.

**Đã có tiền lệ xử lý chính xác tình huống này** — đọc `useSessionBootstrap.integration.test.tsx` (M4): dùng `apiClient.get("/api/v1/mock-protected-1")`/`-2` (gọi trực tiếp qua `apiClient` instance thật trong test, **không** thêm production API route nào) để mô phỏng "request bình thường nhận 401". M8 **tái dùng đúng pattern này** (đặt tên `mock-protected-resource`), không phát minh cách làm mới, không thêm route production nào.

---

## 1. Milestone Overview

**Objective:** Rà soát coverage hiện có, thêm full-flow integration test (MSW), thêm Playwright E2E cho luồng chính (backend thật).

**Current status:** F2 M1-M7 — CLOSED, verify độc lập nhiều lượt liên tiếp (lint/typecheck/format/test/build sạch mỗi lượt), không phát hiện lỗi thật ở 3 lượt gần nhất (M5-M7).

**Dependencies:** F2 M1-M7 (đã verify lại thật ở Mục 2, không chỉ tin nhãn milestone).

**Scope:** 1 file integration test mới, 1 file E2E mới, 1 file MSW handlers mới (cho riêng M8), bổ sung nhỏ có bằng chứng cụ thể vào `client.test.ts`/`register/page.test.tsx` (Mục 3), tài liệu hóa precondition E2E.

**Non-goals:** Redesign M1-M7, sửa `registerSchema`/`authStore`/coordinator, thêm CI service Postgres/backend đầy đủ, retrofit MSW handlers tập trung cho M1-M7, thêm coverage % threshold cứng, thêm backend reset endpoint.

**Quan hệ với M8/M9/M10 cũ:** Đúng Mục 5 prompt gốc — M8 (Error Dictionary) cũ đã gộp vào M2 (đã CLOSED từ lâu). Milestone hiện tại **là M8 mới** = Testing Consolidation & E2E (tương đương M9 cũ trong numbering ban đầu, đã renumber theo F2 Decision Log Rev.2).

---

## 2. Current Repository Assessment

### Nguồn đã inspect trực tiếp
- `frontend/package.json` — scripts đầy đủ (Mục 12).
- `frontend/playwright.config.ts` — đã tồn tại từ F1, `webServer` tự start frontend (`npm run dev`), `baseURL: http://localhost:5173`, `fullyParallel: true`.
- `frontend/e2e/{smoke,layout,Select}.spec.ts` — 3 spec F1 có sẵn, không cần backend.
- `.github/workflows/frontend-ci.yml` — đã chạy `test:coverage` + `test:e2e` trong CI, **không có Postgres/backend service** (Phát hiện 1).
- `backend/docker-compose.yml` — 2 service: `postgres` (host port **5433**→5432) + `backend` (build từ Dockerfile, bind-mount, chạy `npm install && prisma:generate && npm run dev` bên trong container, port 3000).
- `backend/.env.example`: `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/astroviet"` — **lệch cổng với docker-compose** (5432 vs host-mapped 5433) nếu chạy backend NATIVE ngoài Docker trong khi Postgres chạy qua compose — không phải lỗi M8 gây ra, ghi nhận ở Mục 9.
- `frontend/.env.example`: `VITE_API_BASE_URL=http://localhost:3000` — khớp đúng port backend trong compose.
- `docs/frontend/Frontend_Coding_Standards.md` §13 (Testing Standards) — đọc toàn văn (Phát hiện 2).
- `docs/frontend/Frontend_UI_Specification.md` §23 (Testing Strategy) — đọc toàn văn: §23.1 xác nhận luồng E2E chính "**Register → Login**"; §23.3 xác nhận **không có % coverage cứng toàn cục**.
- Toàn bộ test M1-M7 (đọc trực tiếp, không suy diễn) — bảng tổng hợp Mục 4.
- Coverage report thật (`npm run test:coverage`, chạy trực tiếp) — số liệu Mục 3.
- `shared/api/auth-refresh-coordinator.ts`, `shared/api/client.ts` — xác nhận **vẫn đúng** boundary `shared ↛ features/auth` (0 import, không đổi từ M1-M7 review trước).
- `widgets/user-menu/index.tsx`, `app/router.tsx` — không đổi kể từ M7 review trước.

### Existing scripts (đã tồn tại, không cần tạo mới)
`test`, `test:watch`, `test:coverage` (`vitest run --coverage --passWithNoTests`), `test:e2e` (`playwright test`), `lint`, `typecheck`, `format:check`, `build` — **tất cả đã tồn tại và hoạt động đúng**, không cần thêm script mới.

### Playwright state
Config tồn tại và hợp lệ, nhưng **chưa có spec nào cần backend thật** — `auth.spec.ts` sẽ là spec đầu tiên thực sự cần `docker compose up` + backend chạy.

---

## 3. Coverage Review

**Chạy thật** `npm run test:coverage` (không suy diễn) — 55 test file pass, **All files: 90.39% stmt / 80.57% branch / 92.63% func / 92.2% line**.

### Vùng liên quan Auth — số liệu thật

| File | Stmt | Branch | Ghi chú |
|---|---|---|---|
| `features/auth/api/*` (4 file) | 100 | 100 | Đầy đủ |
| `features/auth/hooks/*` (4 file) | 100 | 100 | Đầy đủ |
| `features/auth/model/schema.ts` | 100 | 100 | Đầy đủ |
| `shared/stores/authStore.ts` | 100 | 100 | Đầy đủ |
| `shared/api/auth-refresh-coordinator.ts` | 100 | 100 | Đầy đủ |
| `widgets/user-menu/index.tsx` | 100 | 100 | Đầy đủ |
| `pages/auth/login/page.tsx` | 100 | **80** | Dòng 41: `loginMutation.isError && loginMutation.error &&` — nhánh `error` falsy khi `isError` true gần như không xảy ra thật với TanStack Query (defensive code) — **rủi ro thấp, không cần test thêm** |
| `pages/auth/register/page.tsx` | 100 | **60** | Dòng 30 (`if (errorCode === "EMAIL_ALREADY_EXISTS")` nhánh else) + dòng 62-101 (khối `Alert variant="danger"` cho lỗi **không phải 409**) — **CHƯA từng được test**: không có test nào cho đăng ký thất bại do lỗi 500/generic |
| `shared/api/client.ts` | 100 | **81.81** | Dòng 59-60, 64, 89 — nhánh **network error thật** (không có `error.response` — mất kết nối/timeout) và fallback `data.title` rỗng → `error.message` — **chưa test qua trực tiếp lỗi network thuần túy** |
| `shared/api/queryClient.ts` | 100 | 90 | Dòng 16 — nhánh `errorCode` tồn tại nhưng không phải kiểu `string` — edge case hiếm, rủi ro thấp |
| `app/router.tsx` | 90 | 50 | Dòng 119 — nhánh `import.meta.env.DEV === false` (route dev-only bị loại ở production build) — **không liên quan Auth**, môi trường-phụ-thuộc, ngoài phạm vi M8 |

### Đánh giá risk-based (không dùng % làm mục tiêu, đúng UI Spec §23.3 + Backend §12.7 philosophy)

| Vùng rủi ro cao (theo Mục 14 prompt gốc) | Đã test đủ chưa? | Ở tầng nào |
|---|---|---|
| Session bootstrap | ✅ Đủ | Unit (`useSessionBootstrap.test.ts`) + Integration (race test, M4) |
| Refresh / refresh failure | ✅ Đủ | Unit (`auth-refresh-coordinator.test.ts`, M1) + `client.test.ts` (401→refresh→retry, retry-fail) |
| Refresh single-flight / concurrent 401 | ✅ **Đủ, không cần lặp lại** — xem Mục 8 | Integration (`useSessionBootstrap.integration.test.tsx`, M4) |
| Retry loop prevention | ✅ Đủ | `client.test.ts` (`isRefreshRequest` OQ3 test, M2) |
| Logout failure behavior | ✅ Đủ | `useLogoutMutation.test.ts` (M3) + `UserMenu.test.tsx` (M7) |
| Auth store transitions | ✅ Đủ | `authStore.test.ts` (M3) |
| Protected/Guest route behavior | ✅ Đủ | `ProtectedRoute.test.tsx`/`GuestRoute.test.tsx` (F1) |
| Register/Login validation | ✅ Đủ | `schema.test.ts` (M3), `page.test.tsx` × 2 (M5/M6) |
| RFC7807 error normalization | 🟡 **Gap thật** | `client.test.ts` chưa test đường network-error thuần túy (không có `error.response`) |
| Field error mapping | ✅ Đủ | `client.test.ts` (M1), `page.test.tsx` (M5/M6) |
| API error-code mapping | ✅ Đủ | `error-messages.test.ts` (M1) |
| Cookie-dependent behavior | ✅ Đủ trong giới hạn MSW (đã ghi nhận từ M2: MSW không mô phỏng cookie thật) | Bù bằng Playwright E2E thật (Mục 10) |
| Redirect behavior | ✅ Đủ | `redirect-url.test.ts` (M1/M5), `page.test.tsx` Login (M5-T02/T03/T05) |
| Loading states | ✅ Đủ | Rải rác mọi `page.test.tsx`/hook test |
| **Register lỗi generic (không phải 409)** | 🔴 **Gap thật, chưa từng test** | Cần bổ sung |
| **Full-flow qua composition thật (không phải từng hàm riêng lẻ)** | 🔴 **Chưa tồn tại — đây chính là lý do M8 tồn tại** | Cần tạo (Mục 6) |
| **E2E qua backend thật** | 🔴 **Chưa tồn tại** | Cần tạo (Mục 7) |

**Kết luận Coverage Review:** Chỉ 2 gap thật cần lấp — (a) register generic-error path chưa test (nhỏ, thêm 1 test vào `register/page.test.tsx` có sẵn, không phải tạo file mới); (b) network-error-thuần-túy path trong `client.ts` chưa test (nhỏ, thêm 1 test vào `client.test.ts` có sẵn). Còn lại: **đã đủ, không cần thêm gì** — đúng Rule 12 ("Do not rewrite existing adequate tests").

---

## 4. Architecture / Testing Strategy

| Tầng | Công cụ | Ranh giới |
|---|---|---|
| Unit | Vitest | Hàm thuần (`redirect-url`, `error-messages`, coordinator) |
| Component | Vitest + RTL | 1 component độc lập (`page.tsx` Login/Register, `UserMenu`) |
| Integration (MSW) | Vitest + RTL + MSW | **Tổ hợp nhiều module qua composition thật** — validate hành vi **quan sát được**, không phải để backend thật quyết định |
| E2E (Playwright) | Playwright + backend thật | Validate đường thật browser → frontend → backend → DB — **không thay thế bằng MSW, không thay thế integration bằng E2E** |

**Điều gì integration test (mới) chứng minh mà unit/component KHÔNG chứng minh được** (đúng yêu cầu §9 prompt gốc — giải thích rõ, không trùng lặp): mỗi hook/component đã được test **cô lập** (mock `useLoginMutation` gián tiếp qua MSW nhưng vẫn trong 1 component). Integration test mới chứng minh: **route guard thật + provider thật (QueryClient, ThemeProvider) + router thật + toàn bộ 3 trang (Login/Register/App) + `UserMenu` + `client.ts` interceptor + coordinator + `registerAuthInfrastructure`** phối hợp đúng với nhau **trong cùng 1 cây React thật**, không phải giả định chúng "sẽ" phối hợp đúng vì từng mảnh đã test riêng. Đây là lớp bảo vệ cho lỗi loại "đúng từng phần, sai khi ráp lại" (integration bug) — loại lỗi mà unit/component test **không thể phát hiện** dù có 100% coverage riêng lẻ.

**MSW boundary:** Integration test dùng MSW (đúng Rule 4) vì mục đích là kiểm tra hành vi Frontend xác định, độc lập backend thật đang chạy hay không. Playwright dùng backend thật vì mục đích là kiểm tra đường thật (đặc biệt cookie HttpOnly — MSW không mô phỏng được, Mục 8).

**Refresh coordination:** đã verify lại `auth-refresh-coordinator.ts`/`client.ts` — **không đổi** từ M1, **không có** `shared/api/client → features/auth/api/refresh` — boundary vẫn giữ nguyên đúng (đối chiếu §17 prompt gốc).

**Cookie authentication:** MSW-based integration test **không** mô phỏng cookie HttpOnly thật (giới hạn công cụ, đã ghi nhận từ M2) — Playwright E2E (backend thật) là nơi DUY NHẤT thật sự verify cookie flow.

**Route guards:** `ProtectedRoute`/`GuestRoute` (F1, không đổi) tham gia integration test thông qua router thật, không mock.

---

## 5. Test Matrix (thay bảng mẫu bằng số liệu thật)

| Area | Existing Coverage | M8 Coverage | Layer | Risk |
|---|---|---|---|---|
| Register happy path | `register/page.test.tsx` (M6) | Không lặp lại — chỉ 1 bước trong integration flow | Integration/E2E | High |
| Register generic error | **Thiếu** | **Thêm 1 test vào `register/page.test.tsx`** | Component | High |
| Login happy path | `login/page.test.tsx` (M5) | Không lặp lại — 1 bước trong integration flow | Integration/E2E | High |
| Protected `/app` | `ProtectedRoute.test.tsx` (F1) | Verify qua integration/E2E composition thật | Integration/E2E | High |
| 401 → refresh (đơn lẻ) | `client.test.ts` (M1/M2) | **Thêm vào integration test** — chứng minh qua composition thật | Integration | Critical |
| Concurrent 401 / single-flight | `useSessionBootstrap.integration.test.tsx` (M4) — **đã đủ** | **Không lặp lại** (Mục 8 trả lời trực tiếp §28) | Integration (đã có) | Critical |
| Refresh failure | `client.test.ts` (M1) | Không cần thêm — đã đủ ở unit | Unit (đã có) | Critical |
| Retry loop prevention | `client.test.ts` (OQ3, M2) | Không cần thêm | Unit (đã có) | Critical |
| Logout happy + failure | `useLogoutMutation.test.ts`, `UserMenu.test.tsx` | Không lặp lại — 1 bước trong integration/E2E flow | Integration/E2E | High |
| Route redirect (login↔app) | `redirect-url.test.ts`, `login/page.test.tsx` | Verify qua integration/E2E composition thật | Integration/E2E | High |
| Validation | `schema.test.ts`, 2× `page.test.tsx` | Đủ — không thêm | Component | Medium |
| Error mapping | `error-messages.test.ts`, `client.test.ts` | **Thêm 1 test network-error vào `client.test.ts`** | Unit | High |
| **Full-flow composition** | **Không tồn tại** | **Tạo `auth-flow.integration.test.tsx`** | Integration | Critical |
| **Real backend flow** | **Không tồn tại** | **Tạo `auth.spec.ts`** | E2E | Critical |

---

## 6. M8 File Changes

| File | Action | Responsibility | Why | Dependencies |
|---|---|---|---|---|
| `frontend/src/features/auth/api/mocks/handlers.ts` | **Create** | MSW handler tập trung cho luồng full-flow (register/login/refresh/logout/mock-protected) | Đúng Coding Standards §13.3 cho công việc mới (Phát hiện 2); giảm lặp lại 5+ handler dài trong 1 file test | Không |
| `frontend/src/features/auth/auth-flow.integration.test.tsx` | **Create** | Full-flow integration test qua composition thật | Yêu cầu bắt buộc §8/§9/§27 | `handlers.ts` (mới), toàn bộ hạ tầng M1-M7 (không đổi) |
| `frontend/e2e/auth.spec.ts` | **Create** | E2E thật qua backend local | Yêu cầu bắt buộc §8/§11 | Backend + Postgres chạy local (Mục 9) |
| `frontend/src/shared/api/client.test.ts` | **Modify** | Thêm 1 test: lỗi network thuần túy (không `error.response`) được normalize đúng | Gap thật phát hiện ở Mục 3 | Không |
| `frontend/src/pages/auth/register/page.test.tsx` | **Modify** | Thêm 1 test: lỗi 500/generic → `Alert variant="danger"`, không phải field-error | Gap thật phát hiện ở Mục 3 | Không |
| `.github/workflows/frontend-ci.yml` | **Modify (tối thiểu)** | Không đổi bước nào — chỉ ghi nhận qua tài liệu rằng `auth.spec.ts` tự skip trong CI (không cần sửa YAML nếu skip logic nằm trong chính spec file qua `test.skip`) | Phát hiện 1 — **quyết định: xử lý bằng `test.skip()` trong spec, không sửa YAML** (nhỏ nhất có thể, đúng Rule 11) | `auth.spec.ts` |

**Không tạo thêm file nào khác.** Vị trí 2 file bắt buộc (`frontend/e2e/auth.spec.ts`, `frontend/src/features/auth/auth-flow.integration.test.tsx`) **giữ nguyên đúng như prompt gốc chỉ định** — đối chiếu cấu trúc thư mục thật xác nhận đây là vị trí đúng chuẩn (E2E ở `e2e/` cấp root theo Coding Standards §13.5; integration test co-located trong `features/auth/` theo convention chung).

---

## 7. M8 Implementation Steps

1. **Coverage inspection** — chạy `npm run test:coverage` thật (đã làm khi lập plan, Mục 3).
2. **Test-gap classification** — phân loại risk-based (Mục 3), xác nhận chỉ 2 gap nhỏ thật cần lấp (không phải tạo hàng loạt test mới).
3. **Integration test preparation** — tạo `features/auth/api/mocks/handlers.ts` (Mục 11).
4. **Full MSW auth-flow integration test** — viết `auth-flow.integration.test.tsx` (Mục 11).
5. **401 → refresh → retry verification** (trong integration test) — dùng `mock-protected-resource` (Phát hiện 3), **không** viết lại test concurrent (đã có, Mục 8).
6. **Logout verification** (trong integration test) — bước cuối luồng, tái khẳng định qua composition thật.
7. **Playwright environment verification** — xác nhận `docker compose up` (backend/) + `npm run dev` frontend (Playwright tự làm) hoạt động đúng cổng (Mục 9).
8. **Playwright real-backend E2E** — viết `auth.spec.ts` (Mục 12).
9. **Test-data isolation** — email unique theo timestamp/random (Mục 9).
10. **Coverage rerun** — `npm run test:coverage` sau khi thêm 2 test nhỏ (Mục 3) + integration test mới.
11. **E2E rerun** — `npm run test:e2e` với backend thật chạy local.
12. **Cleanup/stabilization** — review lại toàn bộ, xác nhận không TODO/FIXME sót, không flaky test (chạy lại 2-3 lần cục bộ nếu nghi ngờ).

---

## 8. Trả lời trực tiếp câu hỏi §28 — "Điều gì chứng minh 2 lỗi 401 đồng thời không tạo 2 lời gọi refresh?"

**Đã có bằng chứng, không cần test mới:** `useSessionBootstrap.integration.test.tsx` (M4, đã review độc lập, pass) dựng chính xác kịch bản này — bootstrap + 2 request `mock-protected-1`/`-2` đồng thời nhận 401, MSW handler `/refresh` có `delay()` cố ý + đếm số lần gọi, assert **đúng 1 lần** gọi `/refresh` thật. Đây **đã là integration-level test** (không phải chỉ unit coordinator), dùng đúng composition thật (`registerAuthInfrastructure` thật, `apiClient` thật). 

**M8 không lặp lại test này.** M8's `auth-flow.integration.test.tsx` chỉ cần **1 lần** 401→refresh→retry (không đồng thời) — vì mục đích của M8 là chứng minh **toàn bộ luồng Register→Login→App→401→Refresh→App→Logout** hoạt động nối tiếp qua composition thật, không phải re-verify tính chất single-flight (đã verify đủ, đúng nơi, ở M4).

---

## 9. Detailed Playwright E2E Design

### Preconditions (xác nhận từ cấu hình thật, không phát minh)

| Thành phần | Giá trị thật | Nguồn |
|---|---|---|
| Frontend dev server | `http://localhost:5173`, **Playwright tự start** qua `webServer.command: "npm run dev"` | `playwright.config.ts` |
| Backend server | `http://localhost:3000` — **KHÔNG tự start**, phải chạy sẵn thủ công trước khi `npm run test:e2e` | `backend/.env.example` (`PORT=3000`), `frontend/.env.example` (`VITE_API_BASE_URL=http://localhost:3000`) |
| Database | Postgres, qua `backend/docker-compose.yml` — host port **5433**, container port 5432 | `docker-compose.yml` |
| Cách khởi động backend | **`docker compose up` từ thư mục `backend/`** — file compose này bao gồm CẢ Postgres LẪN service `backend` (build container, tự `npm install && prisma:generate && npm run dev` bên trong) → **1 lệnh này khởi động cả 2 thành phần cùng lúc**, không phải chỉ DB như prompt gốc §12 giả định (giả định "docker compose up chỉ cho DB, backend chạy riêng" **không khớp thực tế** — ghi nhận theo Rule 14) | `docker-compose.yml` |
| ⚠️ Lệch cổng cần lưu ý | Nếu developer chọn chạy backend **native** (`npm run dev` ngoài Docker) thay vì qua compose, `DATABASE_URL` trong `.env.example` trỏ `localhost:5432` — nhưng Postgres qua compose chỉ mở ở host port **5433** → **kết nối sẽ thất bại** trừ khi tự sửa `.env` thành `5433` hoặc chỉ chạy `docker compose up postgres` sau đó tự đổi port. **Khuyến nghị: dùng nguyên `docker compose up` (cả 2 service), không tách backend ra chạy native**, để tránh lệch cổng này hoàn toàn | Đối chiếu `docker-compose.yml` × `.env.example` |
| Playwright tự start frontend? | **Có** | `webServer` config |
| Backend tự động hay thủ công? | **Thủ công** (`docker compose up`, chạy trước khi test) — Playwright không quản lý backend | `playwright.config.ts` không có bước nào liên quan backend |

### Test data isolation
- **Email unique:** dùng `email-${Date.now()}@e2e-test.local` (hoặc tương tự) — tránh xung đột 409 `EMAIL_ALREADY_EXISTS` giữa các lần chạy lặp lại cục bộ.
- **Không cần backend reset endpoint mới** (đúng §23 — "Do not add a backend reset endpoint... unless proven necessary") — vì mỗi lần chạy dùng email mới, không cần xóa dữ liệu cũ để test pass.
- **Chạy serial hay parallel:** `auth.spec.ts` nên set `test.describe.configure({ mode: "serial" })` cho các bước trong CÙNG 1 luồng (Register→Login→App→Logout phải chạy tuần tự, vì Login phụ thuộc Register vừa tạo) — không ảnh hưởng `fullyParallel: true` ở cấp file khác (3 spec F1 cũ vẫn chạy song song bình thường).
- **Cleanup:** không cần dọn DB sau test (mỗi email chỉ dùng 1 lần, không tái sử dụng) — chấp nhận dữ liệu test tích lũy trong DB dev local theo thời gian (ngoài phạm vi M8 để giải quyết triệt để, ghi nhận Known Gap nếu cần dọn dẹp định kỳ sau này).

### Flow chi tiết (selector lấy từ UI thật, không phát minh)

| Bước | Selector (đã verify từ source) | Assertion |
|---|---|---|
| Register | `page.goto("/register")`; `getByLabel("Email")`, `getByLabel("Mật khẩu")`, `getByLabel("Xác nhận mật khẩu")`; `getByRole("button", {name: "Đăng ký"})` | `getByRole("status")` (Alert success) hiện; sau ~2000ms tự điều hướng `/login` |
| Login | Đã ở `/login`; `getByLabel("Email")`, `getByLabel("Mật khẩu")`; `getByRole("button", {name: "Đăng nhập"})` | Điều hướng `/app` |
| Protected app | — | `getByRole("heading", {name: "Bảng điều khiển"})` visible (từ `pages/app/page.tsx` thật) |
| Logout | `UserMenu` hiện text user + `getByRole("button", {name: "Đăng xuất"})` | Điều hướng `/login`; truy cập lại `/app` trực tiếp → redirect `/login` (verify session đã clear thật) |

**Selector strategy:** ưu tiên `getByRole`+accessible name (đúng thứ tự §25) — toàn bộ label/button text đã verify tồn tại thật trong source (Mục "Selector" ở trên), không dùng `data-testid` mới trừ khi cần (không cần ở đây, mọi phần tử đều có role/label ngữ nghĩa sẵn).

### Skip trong CI
```ts
test.skip(!!process.env.CI, "Yêu cầu backend thật + Postgres cục bộ — CI chưa có hạ tầng này (Phát hiện 1, out of scope M8)");
```

---

## 10. Detailed Integration Test Design (MSW)

### Setup
- `renderWithProviders` **không phù hợp trực tiếp** (thiết kế cho 1 component + `MemoryRouter` đơn giản) — integration test cần render **toàn bộ `App`-like tree** (Router thật + toàn bộ route Login/Register/App) — dùng `MemoryRouter`/`RouterProvider` với `routesConfig` thật (import từ `app/router.tsx` nếu cấu trúc cho phép tái sử dụng, hoặc dựng lại cây route tối thiểu tương đương — quyết định chính xác khi code, ưu tiên tái dùng `routesConfig` thật nếu import được mà không kéo theo side-effect không mong muốn).
- `QueryClientProvider` với `createQueryClient()` (M1, tái dùng).
- Gọi `registerAuthInfrastructure()` thật trong `beforeEach` (không mock) — đúng tinh thần "composition thật".

### MSW handlers (`features/auth/api/mocks/handlers.ts`, mới — Phát hiện 2)
`register` (201), `login` (200, `AuthResponse`), `refresh` (200, delay nhẹ), `logout` (204), `mock-protected-resource` (401 lần đầu → 200 sau khi có token mới, theo đúng pattern M4's `mock-protected-1`).

### Flow test (đúng §27, 1 test dài mô tả tuần tự — hoặc chia nhỏ `it()` có `beforeEach` giữ state, quyết định lúc code dựa trên độ dễ đọc, nhưng đúng §13.1 "mỗi `it()` chỉ assert 1 hành vi" nên khuyến nghị **chia nhiều `it()` tuần tự trong 1 `describe`**, dùng biến ngoài scope để giữ context giữa các bước — chấp nhận vi phạm nhẹ tính độc lập test vì bản chất integration test theo luồng, ghi chú rõ lý do trong code comment)
1. Render app tại `/register` → điền form → submit → assert điều hướng `/login`.
2. Điền Login → submit → assert điều hướng `/app`, `authStore.status==="authenticated"`.
3. Gọi `mock-protected-resource` (qua `apiClient` trực tiếp trong test, Phát hiện 3) → nhận 401 → coordinator tự refresh → retry → assert response cuối cùng thành công + `authStore` vẫn `authenticated` (không bị logout nhầm).
4. Click "Đăng xuất" (qua UI thật, không gọi hook trực tiếp) → assert điều hướng `/login`, `authStore.status==="unauthenticated"`.

### Assertions
Quan sát được: route hiện tại (`getByRole("heading",...)` tương ứng mỗi trang), `authStore.getState()`, số lần MSW handler bị gọi (cho bước 401→refresh, đảm bảo đúng 1 lần refresh, dù đây **không phải** trọng tâm — trọng tâm concurrent đã có ở M4).

### Cleanup
`__resetRefreshCoordinatorForTests()` (M1) trong `afterEach` — bắt buộc, tránh state rò rỉ giữa test integration này và các test khác dùng chung coordinator singleton.

---

## 11. Files to Create — Chi tiết `handlers.ts`

```ts
// features/auth/api/mocks/handlers.ts
export const authFlowHandlers = [
  http.post("*/api/v1/auth/register", ...),
  http.post("*/api/v1/auth/login", ...),
  http.post("*/api/v1/auth/refresh", ...),
  http.post("*/api/v1/auth/logout", ...),
  http.get("*/api/v1/mock-protected-resource", ...), // test-only, không phải production API
];
```
Export riêng lẻ hoặc theo nhóm tùy nhu cầu `server.use()` linh hoạt giữa các bước (một số bước cần handler khác nhau theo thời điểm, ví dụ `mock-protected-resource` phải đổi hành vi giữa "401 lần đầu" và "200 sau khi có token mới" — dùng closure/counter y hệt kỹ thuật đã có ở M4).

---

## 12. Commands

```bash
npm run test              # vitest run --passWithNoTests — đã tồn tại
npm run test:coverage     # vitest run --coverage --passWithNoTests — đã tồn tại
npm run test:e2e          # playwright test — đã tồn tại
npm run build             # tsc --noEmit && vite build — đã tồn tại
npm run lint               # eslint . — đã tồn tại
npm run typecheck          # tsc --noEmit — đã tồn tại
```
**Không cần tạo script mới** — toàn bộ lệnh yêu cầu đã tồn tại và hoạt động đúng (Mục 2).

---

## 13. Failure / Edge-Case Matrix

| Case | Đã test ở đâu | M8 cần thêm? |
|---|---|---|
| Register failure (409) | `register/page.test.tsx` (M6) | Không |
| Register failure (generic) | **Không có** | **Có — Mục 3/6** |
| Login failure | `login/page.test.tsx` (M5) | Không |
| Refresh failure | `client.test.ts` (M1) | Không |
| Concurrent 401 | `useSessionBootstrap.integration.test.tsx` (M4) | Không (Mục 8) |
| Retry loop | `client.test.ts` OQ3 (M2) | Không |
| Logout failure | `useLogoutMutation.test.ts`, `UserMenu.test.tsx` | Không |
| Network failure (thuần túy) | **Không có** | **Có — Mục 3/6** |
| Unauthenticated `/app` | `ProtectedRoute.test.tsx` (F1) | Không — verify lại qua E2E (bước cuối `auth.spec.ts`) |

---

## 14. Coverage Strategy

**Không đặt ngưỡng % cứng** (đúng UI Spec §23.3 + Backend §12.7 philosophy, đúng Rule 5) — số liệu Mục 3 chỉ là **bằng chứng chẩn đoán**, không phải mục tiêu. Câu hỏi trung tâm: *"Authentication failure modes và architectural boundaries đã được test đủ chưa?"* — trả lời: **Đủ, ngoại trừ đúng 2 gap cụ thể đã xác định** (Mục 3), cả 2 đều nhỏ, có bằng chứng rõ ràng, không phải suy đoán.

---

## 15. Definition of Done

- [ ] `auth-flow.integration.test.tsx` pass, chứng minh composition thật (Mục 10)
- [ ] `auth.spec.ts` pass với backend local thật (Mục 9)
- [ ] Coverage review hoàn thành, risk-based, không ngưỡng % cứng (Mục 3/14)
- [ ] 2 gap thật đã lấp (`client.test.ts`, `register/page.test.tsx`)
- [ ] Không trùng lặp test không cần thiết (concurrent-401 không lặp lại — Mục 8)
- [ ] Không vi phạm dependency direction (`shared ↛ features/auth` vẫn 0, verify lại)
- [ ] Không TODO/FIXME chưa phân loại trong `features/auth/`
- [ ] lint/typecheck/build/coverage/E2E đều pass

---

## 16. Acceptance Criteria

- [ ] Integration test full flow pass
- [ ] Playwright E2E pass với backend local thật
- [ ] Coverage review hoàn thành theo risk-based methodology
- [ ] Không áp ngưỡng % coverage tùy tiện
- [ ] `npm run test:coverage` pass sạch
- [ ] `npm run test:e2e` pass (local, có backend thật)
- [ ] Không TODO/FIXME chưa phân loại trong `features/auth/`
- [ ] **Bổ sung riêng repo này:** `auth.spec.ts` skip đúng cách trong CI (Phát hiện 1), có lý do rõ ràng trong code
- [ ] **Bổ sung riêng repo này:** `features/auth/api/mocks/handlers.ts` tồn tại, không phá vỡ pattern inline của M1-M7 (2 pattern cùng tồn tại có chủ đích, đã ghi nhận — Phát hiện 2)

---

## 17. Exit Criteria

```
✓ npm run test:coverage   — pass sạch
✓ npm run test:e2e        — pass (local, backend thật chạy)
```
- Full integration flow pass
- Real-backend E2E pass
- Risk-based coverage review đã ghi tài liệu (Mục 3)
- Authentication critical path có coverage phù hợp
- Không vi phạm kiến trúc chưa giải quyết
- Không TODO/FIXME chưa phân loại trong `features/auth/`
- **CI vẫn xanh** với `auth.spec.ts` skip có lý do (không phải CI fail vì thiếu backend)

---

## 18. Risks

| Risk | Mitigation |
|---|---|
| E2E flaky (timing `setTimeout(2000)` ở Register) | Playwright tự động chờ điều hướng (`page.waitForURL`), không cần `waitForTimeout` thủ công |
| Backend chưa chạy khi test E2E | Tài liệu hóa rõ precondition (Mục 9); Playwright sẽ timeout rõ ràng, không silent-pass |
| Database contamination qua nhiều lần chạy | Email unique theo timestamp (Mục 9) — chấp nhận tích lũy dữ liệu test, không cần reset endpoint |
| Duplicate test user giữa các lần chạy | Cùng giải pháp — email luôn mới |
| Cookie behavior khác nhau MSW vs thật | Đã phân định rõ 2 tầng (Mục 4) — Playwright là nơi verify cookie thật duy nhất |
| Refresh timing trong integration test (fake vs real timer) | Dùng `delay()` MSW nhẹ + `waitFor` (Testing Library), theo đúng pattern M4 đã verify hoạt động ổn định |
| Concurrent 401 race giả (nếu lỡ viết lại) | **Không viết lại** — dùng nguyên bằng chứng M4 (Mục 8) |
| Selector giòn (brittle) trong E2E | Dùng `getByRole`+accessible name, không CSS class (Mục 9) |
| CI environment mismatch | Giải quyết bằng `test.skip` tường minh, không giả vờ CI có backend (Phát hiện 1) |
| Lệch cổng Postgres (.env.example vs docker-compose) gây nhầm lẫn khi setup E2E lần đầu | Ghi rõ trong Mục 9, khuyến nghị dùng nguyên `docker compose up` (cả 2 service), tránh setup lai |
| `act()` warning nhỏ đã thấy trong `register/page.test.tsx` khi chạy coverage (không fail, chỉ noise) | Không thuộc phạm vi M8 sửa (test đã "adequate", Rule 12) — ghi nhận, không hành động |

---

## 19. Open Questions / Decisions

F2-OQ-1 đã RESOLVED (E2E bắt buộc, không defer) — không mở lại.

**1 quyết định mới phát sinh từ inspect repo (không phải Open Question chờ trả lời — đã tự quyết định với evidence, ghi lại để minh bạch):**

| Question | Evidence | Options | Recommendation | Impact |
|---|---|---|---|---|
| `auth.spec.ts` chạy trong CI hay chỉ local? | Phát hiện 1 — CI không có backend/DB | (a) Thêm service Postgres+backend vào CI; (b) Skip tường minh trong CI, chạy local | **(b)** | (a) là công việc hạ tầng CI/DevOps lớn, vượt phạm vi "Testing Consolidation" (Rule 11); (b) tối thiểu, tường minh, không hạ thấp Exit Criteria (chỉ phân định rõ Local vs CI requirement) |

**Không còn Open Question kiến trúc nào khác chưa giải quyết cho M8.**

---

## 20. Implementation Order

```
1. Coverage inspection (đã làm khi lập plan) — dev re-run để xác nhận không đổi
2. Tạo features/auth/api/mocks/handlers.ts
3. Viết auth-flow.integration.test.tsx (4 bước tuần tự, Mục 10)
4. Chạy test tích hợp, debug tới khi pass ổn định (chạy lại 2-3 lần kiểm tra flaky)
5. Thêm test network-error vào client.test.ts (gap nhỏ, độc lập bước 2-4)
6. Thêm test register-generic-error vào register/page.test.tsx (gap nhỏ, độc lập)
7. npm run test:coverage — xác nhận 2 gap đã lấp, không gap mới phát sinh
8. Viết auth.spec.ts với test.skip(CI) (Mục 9)
9. Khởi động backend thật (docker compose up, thư mục backend/) — verify thủ công cổng đúng
10. npm run test:e2e cục bộ — debug selector/timing tới khi pass ổn định
11. npm run lint / typecheck / build — xác nhận không regression
12. Review cuối: dependency-direction grep, TODO/FIXME grep trong features/auth/, đối chiếu Mục 16/17
```

---

## 21. Final Architect Review

| Tiêu chí | Đánh giá có bằng chứng |
|---|---|
| Dependency direction | Không đổi — `handlers.ts` mới chỉ nằm trong `features/auth/api/mocks/`, không tạo quan hệ `shared→features` nào; grep xác nhận lại sau khi code |
| Clean Architecture | Không đụng Domain/Application layer nào (đây là Frontend testing milestone) |
| Feature boundaries | `auth-flow.integration.test.tsx` nằm trong `features/auth/`, đúng vị trí; không test nào viết logic production mới |
| Test-layer separation | Phân định rõ Unit/Component/Integration/E2E (Mục 4), không lẫn lộn |
| MSW usage | Đúng — dùng cho integration, không dùng cho E2E (Mục 4, Rule 4) |
| Real-backend E2E | Đúng — `auth.spec.ts` chạy backend thật, tài liệu hóa đầy đủ precondition (Mục 9) |
| Cookie-based authentication | Chỉ verify thật qua E2E (Mục 4/9) — không cố mô phỏng giả trong MSW |
| Refresh single-flight | Không viết lại — dùng bằng chứng M4 có sẵn (Mục 8) — tránh trùng lặp không cần thiết |
| Route protection | Không đổi `ProtectedRoute`/`GuestRoute` — chỉ verify qua composition thật |
| Test determinism | Email unique theo timestamp; `__resetRefreshCoordinatorForTests()` trong `afterEach`; `getByRole` thay vì CSS/class |
| Maintainability | `handlers.ts` tập trung giảm lặp lại cho riêng luồng dài M8, không ép buộc M1-M7 đổi theo |
| CI compatibility | Xử lý tường minh (Phát hiện 1) — không để CI fail âm thầm, không giả vờ backend tồn tại trong CI |
| Documentation consistency | Ghi nhận rõ 2 mâu thuẫn thật (§13.3 vs thực tế M1-M7; docker-compose vs .env.example) theo đúng Rule 14, không tự ý chọn 1 bên và giấu bên kia |
| Scope control | Không sửa M1-M7, không thêm CI service lớn, không thêm backend endpoint mới, không thêm ngưỡng coverage — đúng Rule 11 |

**Không có mục nào thiếu bằng chứng hoặc bị bỏ qua.**

---

# Final Deliverable Summary

```
F2 M1-M7 = COMPLETE (verify lại thật, không chỉ tin nhãn)

M8 hiện tại = Testing Consolidation & E2E
(Error Dictionary cũ đã gộp M2 từ trước — không tạo lại)

3 phát hiện quan trọng đã xử lý trong plan, không phải blocker mở:
1. CI thiếu backend/DB → auth.spec.ts skip tường minh trong CI
2. §13.3 vs M1-M7 thực tế → chỉ áp dụng đúng chuẩn cho file M8 mới, không retrofit
3. Không có protected API thật → tái dùng đúng pattern mock-protected đã có từ M4

Integration flow (MSW):
Register → Login → /app → 401 (mock-protected) → Refresh → Retry → /app → Logout → /login

E2E flow (backend thật):
Register → Login → /app → Logout → /login

Coverage: risk-based, không % cứng — 2 gap thật cần lấp (register generic error,
network error thuần túy trong client.ts)

Exit: npm run test:coverage + npm run test:e2e (local, backend thật)
```

**READY FOR IMPLEMENTATION**
