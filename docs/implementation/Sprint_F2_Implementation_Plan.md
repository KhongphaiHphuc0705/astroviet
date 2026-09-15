# Sprint F2 — Authentication UI Implementation Plan

**Repo:** `KhongphaiHphuc0705/astroviet`, nhánh `dev`
**HEAD tại thời điểm lập plan:** `08412ca` (đã verify bằng `git log`)
**Trạng thái:** Plan-only — chưa sinh code. Rev.2 — đã tích hợp toàn bộ quyết định trong `Confirmation.md`.

---

## 1. Sprint Overview

F2 là **vertical slice thật đầu tiên** của Frontend: nối Frontend Foundation (F1, đã CLOSED) với Backend Identity Module (Sprint 1, đã CLOSED). F2 không phải sprint UI thuần túy — nó là bài kiểm tra kiến trúc: xác nhận API Client, State Architecture, Routing, và Error Handling đã thiết kế ở Architecture Spec thực sự hoạt động đúng khi nối với backend thật, trước khi Sprint F3+ xây thêm domain UI phức tạp hơn (Birth Profile, Natal Chart).

## 2. Current-State Assessment

Đã đọc trực tiếp code thật trên `dev` (không suy diễn từ spec) tại các thư mục sau:

| Khu vực | Trạng thái thật |
|---|---|
| `frontend/src/entities/` | Rỗng (chỉ README + .gitkeep) — đúng như F1 phạm vi |
| `frontend/src/features/` | **Rỗng** (chỉ README + .gitkeep) — F2 là sprint đầu tiên tạo nội dung thật trong `features/` |
| `frontend/src/shared/stores/authStore.ts` | Đã tồn tại dạng **stub**: 3-state shape (`resolving`/`authenticated`/`unauthenticated`) đúng khớp Architecture Spec §7.3; `login()` là no-op comment "Logic thật sẽ nằm ở F2"; `logout()` chỉ set state, không gọi API; có sẵn `bootstrapAuthResolution()` giả lập độ trễ rồi fallback `unauthenticated` sau 100ms — đây là hành vi tạm thời cần thay bằng gọi API refresh thật |
| `frontend/src/app/routing/ProtectedRoute.tsx`, `GuestRoute.tsx` | Đã code đầy đủ, hoạt động thật (không phải stub): đọc `status` từ `authStore`, xử lý cả 3 trạng thái, `ProtectedRoute` đã dùng `createSafeRedirectUrl()` để chống Open Redirect khi lưu redirect URL — có code comment tường minh đánh dấu đây là điểm chờ F2 dùng |
| `frontend/src/app/router.tsx` | Route tree đã dựng đủ: `/` (Marketing), `/login` + `/register` (GuestRoute + AuthLayout), `/app` (ProtectedRoute + AppLayout, có `AppPage` placeholder), `/dev/style-guide` (dev-only), catch-all NotFound — F2 không cần thêm route mới, chỉ cần thay nội dung 2 trang `login`/`register` |
| `frontend/src/pages/auth/login/page.tsx`, `register/page.tsx` | Placeholder thuần văn bản "(Placeholder cho Sprint F2)" — chưa có form nào |
| `frontend/src/pages/app/page.tsx` | Placeholder "(Placeholder cho Sprint F2/F3 - Dashboard)" — xác nhận `/app` là đích redirect sau login đã có sẵn, không cần F2 phát minh |
| `frontend/src/shared/api/client.ts` | Đã có Axios instance thật + request interceptor gắn Bearer token từ `authStore` + response interceptor chuẩn hóa `ApiError` + xử lý 401 sơ bộ (set `_retry` flag, gọi `logout()` ngay — chưa có logic refresh-rồi-retry, có `TODO(Core)` tường minh) |
| `frontend/src/widgets/app-layout/index.tsx` | Có "User profile placeholder" (`<div>` hình tròn rỗng, không phải slot) trong header — AppLayout hiện KHÔNG có prop để nhận nội dung business-aware |
| `frontend/src/shared/lib/report-error.ts` | Không tồn tại |
| `@tanstack/react-query` trong `package.json` | Không có |
| `msw` | Đã cài (`^2.15.0`), `src/test/msw-server.ts` đã setup với `handlers: []` rỗng |
| `eslint-plugin-boundaries` | Đã cài (`^7.1.0`) nhưng chưa đủ ngưỡng kích hoạt (F1 M1 quyết định) — F2 chỉ tạo 1 feature, không phải blocking |

**Kết luận:** F1 cung cấp đúng những gì Architecture Spec mô tả là "infrastructure only". Không có phát hiện nào mâu thuẫn với tuyên bố "F1 CLOSED".

## 3. F1 → F2 Readiness

| Hạng mục | Sẵn sàng? | Ghi chú |
|---|---|---|
| Routing | ✅ Có | `/login`, `/register`, `/app`, guard 2 chiều đã hoạt động |
| Layouts | ✅ Có | `AuthLayout`, `AppLayout` tồn tại; AppLayout cần bổ sung 1 slot (Mục 9) |
| Shared UI | ✅ Có | Input/Button/Checkbox/Alert/Spinner đầy đủ (F1 M5/M6) |
| Forms | ✅ Có | `useZodForm` + 3 connector function (F1 M7) — dùng thẳng, không viết lại |
| API Client | 🟡 Một phần | Interceptor tồn tại nhưng shape lỗi thật sai (Mục 4) + thiếu refresh-retry logic |
| State Foundation | ✅ Có | 3-store Zustand đúng kiến trúc; `authStore` là stub cần thay logic |
| Testing Foundation | ✅ Có | Vitest + Testing Library + MSW + `vitest-axe` + `renderWithProviders` helper + Playwright đã cài |
| Error Infrastructure | 🔴 Thiếu | `report-error.ts`/`error-messages.ts` chưa tồn tại; `ApiError.fieldErrors` sai shape; TanStack Query chưa cài |

**Kết luận:** 3 gap hạ tầng thật (TanStack Query, `ApiError` shape, error infra) phải xử lý **trước** khi viết `features/auth` — đây là lý do F2 M1 mở rộng thành milestone hạ tầng đầy đủ (Mục 18).

## 4. Backend Identity → F2 Contract Verification

Đọc trực tiếp code thật (`backend/src/modules/identity/`, `dev` HEAD `08412ca`).

### 4.1. Route thật

```
POST /api/v1/auth/register   (validateBody registerSchema)
POST /api/v1/auth/login      (validateBody loginSchema)
POST /api/v1/auth/refresh    (validateBody refreshSchema)
POST /api/v1/auth/logout     (authMiddleware + requireAuth — CẦN access token hợp lệ)
```

### 4.2. Contract Matrix

| Capability | Backend contract | Frontend requirement | Status |
|---|---|---|---|
| Register | `POST /register` body `{email, password, displayName?}` → 201 `{user: UserResponse}` — KHÔNG trả token | Form 3 field (+confirmPassword chỉ client-side) → điều hướng `/login` sau thành công | Ready |
| Login | `POST /login` body `{email, password}` → 200 `{accessToken, refreshToken, expiresIn, user}` + Set-Cookie `refreshToken` (HttpOnly) | Lưu `accessToken`/`user` vào `authStore`; KHÔNG lưu `refreshToken` từ body (F2-D1, ACCEPTED) | Ready |
| Refresh | `POST /refresh` — ưu tiên đọc cookie, body `refreshToken` optional fallback → 200 cùng shape với Login | Gọi khi app khởi động (silent refresh) + khi 401 giữa phiên | Ready |
| Logout | `POST /logout` cần Bearer access token hợp lệ → 204 no body, xóa cookie | Gọi trước khi clear `authStore`; access token hết hạn vẫn clear state cục bộ (F2-D4, ACCEPTED) | Ready |
| Current user / session | Không có `/me` endpoint — user info chỉ có trong response Login/Refresh | Session restore hoàn toàn dựa vào silent-refresh lúc khởi động | Ready (giới hạn thiết kế, không phải blocker) |
| Validation errors | 400 RFC7807, chi tiết Zod `flatten()` nằm trong field `metadata` (`{formErrors, fieldErrors: Record<string,string[]>}`) | `client.ts` parse đúng `metadata.fieldErrors` (F2-D2, ACCEPTED) | Sẽ sửa ở M1 |
| Auth errors | 401 `INVALID_CREDENTIALS`, 401 `UNAUTHORIZED`/`TOKEN_EXPIRED`, 409 `EMAIL_ALREADY_EXISTS` | Map từng `errorCode` sang message tiếng Việt cụ thể | Bảng mapping dựng ở M1 (đẩy sớm — xem Mục 18) |

### 4.3. `ApiError.fieldErrors` sai shape — F2-D2 (ACCEPTED)

Cả code F1 lẫn Architecture Spec §10.1 giả định `fieldErrors?: {field,message}[]`. Backend thật (`validate-body.middleware.ts` dùng `result.error.flatten()`) trả `{"metadata": {"formErrors": [], "fieldErrors": {"email": ["..."]}}}`. F2-D2 đã ACCEPTED: sửa `ApiError` đọc từ `metadata.fieldErrors` dạng `Record<string,string[]>`; đồng thời cập nhật Architecture Spec §10.1 (F2-OQ-2 RESOLVED — cập nhật tài liệu nguồn, không để Known Gap).

### 4.4. Refresh Token vừa trong Cookie vừa trong Response Body — F2-D1 (ACCEPTED)

Backend set cookie `HttpOnly, Secure (prod), SameSite=Strict, Path=/api/v1/auth` **đồng thời** trả `refreshToken` thật trong JSON body. F2-D1 đã ACCEPTED: Frontend **bỏ qua hoàn toàn** field `refreshToken` trong response body — không lưu, không truyền qua bất kỳ biến/state nào, chỉ dựa vào cookie tự động gửi kèm.

### 4.5. CORS/Cookie — đối chiếu quyết định cũ

Ghi chú lịch sử trước đó ghi `SameSite=Lax, Path=/auth/refresh` — code thật là `SameSite=Strict, Path=/api/v1/auth`. Theo F2-OQ-2 (RESOLVED — cập nhật tài liệu nguồn), đây là 1 trong các điểm phải cập nhật lại trong Architecture Spec ở F2 M9 (Mục 25), không còn để Known Gap tùy chọn.

## 5. Sprint Objective

Xây dựng vertical slice Authentication hoàn chỉnh: Register → Login → Session Restore → Protected Access → Token Refresh (kể cả khi hết hạn giữa phiên) → Logout, với error handling đúng theo RFC7807 thật, đúng kiến trúc `features/auth` đã đóng băng, không phá vỡ bất kỳ quyết định F1 nào.

## 6. Scope

- `features/auth/` hoàn chỉnh: `api/`, `hooks/`, `model/`
- Cài đặt và cấu hình `@tanstack/react-query` (QueryClientProvider, global `onError` fallback có phân biệt lỗi expected/unexpected — Mục 15)
- `shared/api/refresh-coordinator.ts` — cơ chế single-flight refresh + injection boundary (Mục 9, 13)
- Sửa `shared/api/client.ts`: đúng `ApiError` shape thật + gọi coordinator khi 401
- Tạo `shared/lib/report-error.ts` và `shared/lib/error-messages.ts` **ngay từ M1** (không hoãn tới cuối sprint)
- Thay nội dung thật cho `pages/auth/login/page.tsx`, `pages/auth/register/page.tsx`
- Thêm slot `headerActions` cho `AppLayout` + component `UserMenu` (phạm vi bị giới hạn nghiêm ngặt — Mục 18, F2 M7)
- **Playwright E2E cho luồng chính (Register → Login → Protected access → Logout)** — trong scope (F2-OQ-1 RESOLVED)
- **Cập nhật Architecture Spec §10.1, §12.2, §12.4 theo bằng chứng thật** — trong scope (F2-OQ-2 RESOLVED)
- Test: unit, component, integration (MSW, bao gồm refresh-race), a11y, E2E

## 7. Non-Goals

- Birth Profile UI, Natal Chart UI, Interpretation UI
- Dashboard thật (chỉ giữ nguyên placeholder `AppPage`)
- Admin UI, RBAC UI
- Email verification UI (backend chỉ placeholder)
- **Forgot Password UI — không đưa vào F2** (F2-OQ-3 RESOLVED, quyết định chính thức, không còn để ngỏ)
- Social login, MFA
- Full OpenAPI client SDK generation
- Mở rộng Design System không liên quan auth

## 8. Preconditions & Dependencies

- Backend Sprint 1 (Identity) — CLOSED, contract đã verify thật (Mục 4)
- Sprint F1 — CLOSED, không tạo F1 M11, không mở lại F1
- `@tanstack/react-query` phải cài xong trước `features/auth/hooks`
- `shared/api/refresh-coordinator.ts` phải tồn tại (M1) trước khi `features/auth` đăng ký handler (M3)

## 9. Architecture Impact

**Quyết định kiến trúc đã ACCEPTED (theo `Confirmation.md`):**

1. **`AppLayout.headerActions?: React.ReactNode`** (F2-D3) — truyền từ `router.tsx`, nơi biết về `features/auth`. AppLayout vẫn business-agnostic tuyệt đối.
2. **`ApiError.fieldErrors: Record<string,string[]>`** đọc từ `metadata.fieldErrors` (F2-D2).
3. **Refresh coordinator sống ở `shared/api/`, không phải `features/auth/api/`** — đây là điều chỉnh quan trọng so với plan gốc. Lý do: `shared/api/client.ts` (tầng `shared`) không được phép import `features/auth` (vi phạm Dependency Direction — `shared` không phụ thuộc ngược lên `features`). Giải pháp: **injection boundary** —
   - `shared/api/refresh-coordinator.ts` định nghĩa `setRefreshHandler(handler: () => Promise<RefreshResult>)` và `coordinateRefresh(): Promise<RefreshResult>` (single-flight, dedupe N lời gọi 401 đồng thời thành 1 lời gọi handler thật). Coordinator **không biết** `refresh()` gọi endpoint nào — nó chỉ gọi `handler()` đã được đăng ký.
   - `features/auth` export `registerAuthInfrastructure()` (từ `index.ts`), gọi `setRefreshHandler(refresh)` (trong đó `refresh` là hàm API thật từ `features/auth/api/refresh.ts`). Hàm này được gọi **đúng 1 lần** từ `app/providers` lúc khởi động app — đây là nơi duy nhất `app/` "biết" cả `shared` lẫn `features/auth`, đúng chiều phụ thuộc cho phép.
   - Khi refresh thành công/thất bại, coordinator tự cập nhật `authStore` (session mới hoặc `clearSession()`) — vì `authStore` cũng nằm ở tầng `shared`, coordinator được phép import thẳng.
4. **`report-error.ts` chỉ được gọi cho lỗi unexpected/unmapped** — không phải mọi lỗi 5xx một cách máy móc, và tuyệt đối không gọi cho lỗi nghiệp vụ đã biết (400/401/403/404/409/422 có mapping trong `error-messages.ts`) — chi tiết Mục 15.

## 10. Authentication Lifecycle

```
App khởi động
    ↓
authStore.status = 'resolving'
    ↓
app/providers gọi registerAuthInfrastructure() (đăng ký refresh handler — 1 lần duy nhất)
    ↓
app/providers gọi useSessionBootstrap() (KHÔNG dùng useMutation — xem Mục 18, F2 M4)
    ↓
useSessionBootstrap gọi shared/api/refresh-coordinator.coordinateRefresh()
    ↓
  Thành công → coordinator tự set accessToken + user vào authStore, status = 'authenticated'
  Thất bại   → coordinator tự clearSession(), status = 'unauthenticated' (im lặng, không hiện lỗi)
    ↓
Router render (ProtectedRoute/GuestRoute — không sửa, đã đúng từ F1)
    ↓
[Trong phiên] API request bất kỳ → 401
    ↓
client.ts interceptor gọi coordinateRefresh() (CÙNG 1 coordinator — dùng lại, không viết logic riêng)
    ↓
  Coordinator đang có 1 lời gọi refresh chạy dở? → trả lại đúng Promise đó (dedupe)
  Chưa có?                                        → gọi handler() thật (POST /refresh) 1 lần
    ↓
  Thành công → cập nhật accessToken → retry request gốc đúng 1 lần (`_retry` flag đã có từ F1)
  Thất bại   → clearSession() → điều hướng /login (qua ProtectedRoute tự redirect)
    ↓
Logout thủ công (UserMenu, chỉ gọi useLogoutMutation() có sẵn — Mục 18, F2 M7 boundary)
    → POST /logout, bất kể kết quả, luôn clearSession() ngay (F2-D4, onSettled)
    → điều hướng /login
```

**Vì sao bắt buộc single-flight (F2-D5, ACCEPTED)**: backend `RefreshTokenUseCase` rotate token nghiêm ngặt — 2 lời gọi `/refresh` đồng thời với cùng token cũ chỉ 1 lời gọi thành công, lời gọi còn lại nhận `401`. Không dedupe sẽ tự phá hỏng phiên hợp lệ của chính người dùng.

## 11. State Architecture

| Loại | Vị trí | Chi tiết |
|---|---|---|
| Global auth state | `authStore` (F1, sửa lại action) | `status`, `accessToken` (in-memory), `user` — **chỉ** `shared/api/refresh-coordinator.ts` và `features/auth/hooks` được ghi trực tiếp (mở rộng nhẹ so với §7.3 gốc để coordinator — tầng hạ tầng — cũng được phép ghi, vì đây là nơi duy nhất hợp lý để cập nhật session sau refresh mà không tạo vòng phụ thuộc ngược) |
| Local component state | `LoginForm`/`RegisterForm` | password visibility toggle |
| Form state | React Hook Form (F1 M7) | field errors từ cả Zod client-side lẫn `setError()` từ server |
| Server state | `useMutation` cho Register/Login/Logout | **Không dùng `useMutation` cho session bootstrap** (Mục 18, F2 M4) — đây là initialization concern, không phải user-triggered action, ép vào TanStack Query làm phức tạp lifecycle không cần thiết |

Không tạo store thứ 4.

## 12. Routing Architecture

Không đổi route tree. Chỉ thay nội dung `pages/auth/login|register/page.tsx` và truyền `headerActions={<UserMenu />}` vào `AppLayout` trong `router.tsx`. `ProtectedRoute`/`GuestRoute` không sửa code.

## 13. API Integration Architecture

```
shared/
└── api/
    ├── client.ts                # SỬA — ApiError shape + gọi coordinator khi 401
    └── refresh-coordinator.ts   # MỚI — single-flight + injection boundary (Mục 9)

features/auth/
├── model/
│   └── schema.ts       # Zod: registerSchema, loginSchema
├── api/
│   ├── register.ts
│   ├── login.ts
│   ├── refresh.ts       # raw call — được INJECT vào coordinator, không tự gọi coordinator
│   └── logout.ts
├── hooks/
│   ├── useRegisterMutation.ts
│   ├── useLoginMutation.ts
│   ├── useLogoutMutation.ts
│   └── useSessionBootstrap.ts   # gọi coordinator trực tiếp, KHÔNG qua useMutation
└── index.ts             # export hooks + type + registerAuthInfrastructure() (duy nhất hàm "đặc biệt" được export ngoài hook)
```

`registerAuthInfrastructure()` là ngoại lệ duy nhất trong `index.ts` không phải hook/type — nó tồn tại chỉ để `app/providers` gọi đúng 1 lần lúc khởi động, nối `refresh.ts` (feature-specific) vào `refresh-coordinator.ts` (shared, generic) mà không phá chiều phụ thuộc.

## 14. Form Architecture

(Không đổi so với v1) Dùng nguyên `useZodForm` + 3 connector function từ F1 M7.

- **LoginForm**: `email`, `password`.
- **RegisterForm**: `email`, `password`, `confirmPassword` (client-only), `displayName` (optional) — password rule khớp backend: min 8, max 72 ký tự, ≥1 chữ số; kiểm tra byte-length để backend là nguồn xác nhận cuối cho trường hợp hiếm (tiếng Việt có dấu).

## 15. Error Handling

1. `client.ts` chuẩn hóa lỗi thành `ApiError` đúng shape thật (`fieldErrors: Record<string,string[]>` từ `metadata`).
2. **`error-messages.ts` được tạo ở M1**, không phải M8 — `LoginForm`/`RegisterForm` (M5/M6) dùng behavior cuối ngay từ đầu, không có giai đoạn tạm dùng `error.title`.
3. **Hợp đồng gọi `reportError(error, context)` — quy tắc tường minh (mới, thay thế mô tả mơ hồ ở v1):**

   | Loại lỗi | Có gọi `reportError`? | Lý do |
   |---|---|---|
   | Lỗi nghiệp vụ đã biết, có mapping trong `error-messages.ts` (400 `MALFORMED_REQUEST`, 401 `INVALID_CREDENTIALS`/`UNAUTHORIZED`/`TOKEN_EXPIRED`, 409 `EMAIL_ALREADY_EXISTS`, 422 validation) | **Không** | Đây là hành vi ứng dụng bình thường (người dùng gõ sai mật khẩu không phải "lỗi ứng dụng") — hiện message tiếng Việt tương ứng là đủ |
   | `errorCode` lạ/chưa có trong `error-messages.ts` | **Có** | Dấu hiệu backend thêm lỗi mới mà Frontend chưa map kịp — cần biết để bổ sung |
   | Lỗi 5xx / `InfrastructureError` | **Có** | Ngoài tầm kiểm soát người dùng, cần quan sát |
   | Network error (không có response — timeout, mất mạng) | **Có** | Không phải lỗi nghiệp vụ, cần quan sát |
   | Lỗi render không lường trước (Root/Route Error Boundary bắt) | **Có** | Đúng bản chất "unexpected application error" |

   `reportError()` **không** được gọi vô điều kiện cho "mọi lỗi 5xx" một cách máy móc từ `QueryClient.onError` — hàm `onError` toàn cục phải tự phân loại theo bảng trên trước khi quyết định gọi `reportError` hay chỉ hiện Toast; tránh duplicate logging nếu 1 hook cụ thể (ví dụ Login) đã tự xử lý lỗi riêng bằng Alert inline (không cần `reportError` thêm lần nữa cho cùng 1 lỗi nghiệp vụ).
4. `report-error.ts`: implementation hiện tại `console.error`, nhưng **contract** (chữ ký hàm + quy tắc gọi ở trên) mới là phần quan trọng cần đúng ngay từ đầu — implementation có thể đổi sau (Sentry) mà không ảnh hưởng nơi gọi.

## 16. Security Considerations

(Không đổi so với v1)

- Access Token: chỉ trong `authStore` (bộ nhớ JS).
- Refresh Token: dựa hoàn toàn vào Cookie; bỏ qua field body (F2-D1).
- CSRF: `SameSite=Strict` — đủ bảo vệ.
- `ProtectedRoute` là UX guard, không phải security boundary.
- Redirect URL: bắt buộc `createSafeRedirectUrl()`.
- Logout: luôn `clearSession()` trước/độc lập kết quả API (F2-D4).

## 17. Proposed File Structure

```
frontend/src/
├── features/
│   └── auth/
│       ├── model/schema.ts
│       ├── api/{register,login,refresh,logout}.ts
│       ├── hooks/{useRegisterMutation,useLoginMutation,useLogoutMutation,useSessionBootstrap}.ts
│       └── index.ts                     # + registerAuthInfrastructure()
├── widgets/
│   └── user-menu/                       # MỚI — feature-aware, phạm vi giới hạn (Mục 18, F2 M7)
│       ├── index.tsx
│       └── UserMenu.test.tsx
├── shared/
│   ├── api/
│   │   ├── client.ts                    # SỬA
│   │   └── refresh-coordinator.ts       # MỚI
│   ├── lib/
│   │   ├── report-error.ts              # MỚI — F2 M1
│   │   └── error-messages.ts            # MỚI — F2 M1 (đẩy sớm từ M8)
│   └── stores/authStore.ts              # SỬA
├── widgets/app-layout/index.tsx         # SỬA — thêm prop headerActions
├── pages/auth/login/page.tsx            # SỬA
├── pages/auth/register/page.tsx         # SỬA
├── app/router.tsx                        # SỬA
├── app/providers/                        # SỬA — gọi registerAuthInfrastructure() + useSessionBootstrap()
├── test/msw-server.ts                    # SỬA
└── e2e/auth.spec.ts                      # MỚI — Playwright, trong scope (F2-OQ-1)
```

## 18. Milestone Plan

### F2 M1 — Authentication Infrastructure & Contract Alignment

**Objective:** Dựng toàn bộ hạ tầng auth (contract fix + error handling + refresh coordinator) trước khi viết bất kỳ business logic nào — đúng luồng `F1 Foundation → contract corrected → auth infrastructure ready → F2 feature implementation`.
**Dependencies:** Không.
**Preconditions:** Không.

**Files to create:**
- `frontend/src/shared/lib/report-error.ts`
- `frontend/src/shared/lib/error-messages.ts`
- `frontend/src/shared/api/refresh-coordinator.ts`
- `frontend/src/app/providers/QueryProvider.tsx` (hoặc gộp vào provider tổng hợp có sẵn)

**Files to modify:**
- `frontend/package.json` (thêm `@tanstack/react-query`)
- `frontend/src/shared/api/client.ts` (sửa `ApiError.fieldErrors` shape; response interceptor 401 gọi `coordinateRefresh()` thay vì `logout()` trực tiếp)
- `frontend/src/widgets/app-layout/index.tsx` (thêm prop `headerActions?: React.ReactNode`)
- `docs/frontend/Frontend_Architecture_Specification.md` (§10.1 `ApiError` shape; §12.2 ghi rõ backend trả cả cookie lẫn body; §12.4 không đổi nội dung, chỉ xác nhận SameSite=Strict khớp — F2-OQ-2 RESOLVED, thực hiện ngay, không để Known Gap)

**Files to avoid touching:** `app/routing/*`, mọi component trong `shared/ui/`.

**Implementation steps:**
1. `npm install @tanstack/react-query`; tạo `QueryProvider`, cấu hình `defaultOptions.mutations.onError`/`queries.onError` — hàm `onError` phân loại lỗi theo bảng Mục 15.3 trước khi gọi Toast và/hoặc `reportError`.
2. Viết `report-error.ts`: `export const reportError = (error: unknown, context?: string): void => { console.error(...) }`.
3. Viết `error-messages.ts`: dictionary đầy đủ cho `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `TOKEN_EXPIRED`, `UNAUTHORIZED`, `MALFORMED_REQUEST` + `getErrorMessage(code)` với fallback gọi `reportError` (đúng bảng Mục 15.3, dòng "errorCode lạ").
4. Sửa `ApiError` trong `client.ts`: đọc `data.metadata?.fieldErrors as Record<string,string[]> | undefined`.
5. Viết `refresh-coordinator.ts`:
   ```ts
   type RefreshHandler = () => Promise<{ accessToken: string; user: User; expiresIn: number }>;
   let handler: RefreshHandler | null = null;
   let inFlight: Promise<...> | null = null;
   export const setRefreshHandler = (h: RefreshHandler) => { handler = h; };
   export const coordinateRefresh = async () => {
     if (inFlight) return inFlight;
     if (!handler) throw new Error('Refresh handler chưa được đăng ký');
     inFlight = handler()
       .then((result) => { useAuthStore.getState().setSession(result.user, result.accessToken); return result; })
       .catch((err) => { useAuthStore.getState().clearSession(); throw err; })
       .finally(() => { inFlight = null; });
     return inFlight;
   };
   ```
6. Sửa interceptor 401 trong `client.ts`: gọi `coordinateRefresh()`, thành công → gắn token mới vào `originalRequest`, retry (dùng `_retry` flag có sẵn); thất bại → reject lỗi gốc (không tự điều hướng — `ProtectedRoute` lo việc đó).
7. Thêm `headerActions` prop vào `AppLayout`.
8. Cập nhật Architecture Spec §10.1/§12.2 theo bằng chứng thật (Mục 4.3/4.4).

**Tests:**
1. `refresh-coordinator.test.ts`: 2 lời gọi `coordinateRefresh()` đồng thời với handler mock (đếm số lần gọi) → assert handler chỉ chạy **1 lần**, cả 2 Promise đều resolve cùng kết quả.
2. `coordinateRefresh()` khi chưa `setRefreshHandler` → throw lỗi rõ ràng (không silent fail).
3. `client.test.ts`: response 400 với `metadata.fieldErrors` dạng dictionary → `ApiError.fieldErrors` parse đúng.
4. `error-messages.test.ts`: từng `errorCode` đã biết trả đúng message; `errorCode` lạ → fallback + `reportError` được gọi (spy).
5. `report-error.test.ts`: gọi hàm, assert `console.error` được gọi.
6. `AppLayout.test.tsx`: truyền `headerActions` → render đúng; không truyền → fallback rỗng.
7. Test riêng cho `onError` toàn cục của `QueryClient`: mock lỗi 401 đã mapped → assert `reportError` **không** được gọi; mock lỗi 500 → assert `reportError` **được** gọi.

**Acceptance Criteria:**
- [ ] `@tanstack/react-query` có trong dependencies
- [ ] `ApiError.fieldErrors` đọc đúng từ `metadata.fieldErrors`
- [ ] `refresh-coordinator` dedupe đúng, có test chứng minh bằng đếm số lần gọi thật
- [ ] `error-messages.ts` đầy đủ 5 mã lỗi Identity + fallback an toàn
- [ ] `reportError` KHÔNG bị gọi cho lỗi nghiệp vụ đã mapped (test chứng minh)
- [ ] `AppLayout` nhận `headerActions` không phá test cũ
- [ ] Architecture Spec §10.1/§12.2 đã cập nhật khớp code thật

**Exit Criteria:**
- [ ] typecheck/lint sạch, toàn bộ test M1 pass

---

### F2 M2 — `features/auth` Foundation (Model + API layer)

**Objective:** Tạo `model/schema.ts` và `api/*.ts` — lớp "câm" chỉ gọi HTTP.
**Dependencies:** F2 M1.

**Files to create:**
- `frontend/src/features/auth/model/schema.ts`
- `frontend/src/features/auth/api/{register,login,refresh,logout}.ts`

**Implementation steps:**
1. `schema.ts`: `registerSchema`, `loginSchema` theo rule Mục 14.
2. `register.ts`/`login.ts`/`refresh.ts`/`logout.ts`: hàm gọi `apiClient` thô, trả `Promise<DTO>` đúng type thật (Mục 4.2) — `refresh.ts` **không tự gọi coordinator**, chỉ là raw call sẽ được inject ở M3.

**Tests:**
1. Mỗi hàm API: 1 test MSW, assert đúng URL/method/body/response type.
2. `schema.ts`: test từng rule.

**Acceptance Criteria:**
- [ ] 4 hàm API tồn tại, có test MSW pass
- [ ] Schema reject đúng input sai

**Exit Criteria:**
- [ ] typecheck/lint sạch, test pass

---

### F2 M3 — `features/auth` Hooks + `authStore` Wiring + Infrastructure Registration

**Objective:** Bọc `api/*.ts` bằng `useMutation`, nối `authStore` thật, và đăng ký `refresh` vào coordinator (M1).
**Dependencies:** F2 M2.

**Files to create:**
- `frontend/src/features/auth/hooks/{useRegisterMutation,useLoginMutation,useLogoutMutation}.ts`
- `frontend/src/features/auth/index.ts` (export hooks + `registerAuthInfrastructure()`)

**Files to modify:**
- `frontend/src/shared/stores/authStore.ts` (bỏ `bootstrapAuthResolution()` giả lập; thêm `setSession(user, accessToken)`/`clearSession()` thật — coordinator M1 đã gọi 2 hàm này, giờ hiện thực hóa)
- `frontend/src/app/providers/` (gọi `registerAuthInfrastructure()` đúng 1 lần lúc khởi động, trước `useSessionBootstrap` ở M4)

**Implementation steps:**
1. `useLoginMutation`: `useMutation({ mutationFn: login, onSuccess: (data) => useAuthStore.getState().setSession(data.user, data.accessToken) })`.
2. `useRegisterMutation`: `useMutation({ mutationFn: register })` — không set session (F2-D6).
3. `useLogoutMutation`: `useMutation({ mutationFn: logout, onSettled: () => useAuthStore.getState().clearSession() })` (F2-D4).
4. `authStore.ts`: implement `setSession`/`clearSession` thật.
5. `index.ts`: `export const registerAuthInfrastructure = () => setRefreshHandler(refresh);` — export cùng 3 hook, **không** export `api/*` trực tiếp cho consumer khác.
6. `app/providers`: gọi `registerAuthInfrastructure()` 1 lần ở module/effect cấp cao nhất.

**Tests:**
1. `useLoginMutation`: MSW mock thành công → `authStore.status === 'authenticated'`.
2. `useRegisterMutation`: MSW mock 409 → `authStore` không đổi.
3. `useLogoutMutation`: MSW mock logout fail (500) → `authStore` vẫn về `unauthenticated`.
4. `registerAuthInfrastructure()` gọi đúng `setRefreshHandler` với `refresh` thật (spy trên module `refresh-coordinator`).

**Acceptance Criteria:**
- [ ] `authStore` không còn hành vi giả lập
- [ ] 3 hook hoạt động đúng, có test MSW
- [ ] `registerAuthInfrastructure()` nối đúng `refresh` vào coordinator

**Exit Criteria:**
- [ ] typecheck/lint sạch, test pass

---

### F2 M4 — Session Bootstrap

**Objective:** Khởi tạo phiên lúc app start, dùng lại coordinator (M1) — **không ép vào `useMutation`** (theo `Confirmation.md`, đây là application initialization concern, không phải user-triggered action).
**Dependencies:** F2 M3.

**Files to create:**
- `frontend/src/features/auth/hooks/useSessionBootstrap.ts`

**Files to modify:**
- `frontend/src/app/providers/` (gọi `useSessionBootstrap()` sau `registerAuthInfrastructure()`, trước khi render `RouterProvider`)

**Implementation steps:**
1. `useSessionBootstrap`:
   ```ts
   export const useSessionBootstrap = () => {
     useEffect(() => {
       coordinateRefresh().catch(() => {
         // Đã tự clearSession() bên trong coordinator — không cần xử lý gì thêm ở đây
       });
     }, []);
   };
   ```
   Không dùng `useMutation`/`useQuery` — chỉ 1 `useEffect` gọi thẳng coordinator đã có sẵn từ M1, tái sử dụng logic single-flight (quan trọng nếu React StrictMode dev gọi effect 2 lần — coordinator tự dedupe, không cần xử lý riêng).
2. Đặt `useSessionBootstrap()` trong `app/providers`, đúng thứ tự: `registerAuthInfrastructure()` → `useSessionBootstrap()` → render `RouterProvider`.

**Tests:**
1. `useSessionBootstrap`: MSW mock refresh thành công/thất bại — 2 test, assert đúng trạng thái `authStore` cuối.
2. **Test race quan trọng nhất** (chuyển từ M1 sang đây để test ở mức tích hợp thật): mock 2 request 401 đồng thời + `useSessionBootstrap` cùng lúc app khởi động → tổng cộng `/refresh` chỉ bị gọi **đúng 1 lần**.
3. Thứ tự khởi tạo: assert `RouterProvider` không render trước khi `authStore.status` rời `'resolving'`.

**Acceptance Criteria:**
- [ ] Session bootstrap không dùng TanStack Query, chỉ dùng coordinator trực tiếp
- [ ] 401 đồng thời (kể cả trộn giữa bootstrap và request thường) chỉ trigger 1 lần `/refresh` thật

**Exit Criteria:**
- [ ] Test Mục "Refresh" (Mục 26) pass tại milestone này, typecheck/lint sạch

---

### F2 M5 — Login Page

**Objective:** Thay placeholder `pages/auth/login/page.tsx` bằng form thật, dùng ngay `error-messages.ts` đã có từ M1 (không còn giai đoạn tạm).
**Dependencies:** F2 M3, F2 M4.

**Files to modify:**
- `frontend/src/pages/auth/login/page.tsx`

**Implementation steps:**
1. `useZodForm(loginSchema)` + `getInputFieldProps`.
2. `onSubmit` gọi `useLoginMutation().mutate(payload)`; `isPending` → disable + Spinner.
3. Lỗi → `Alert variant="danger"` inline, message qua `getErrorMessage(error.errorCode)` (đã có sẵn từ M1 — không phải placeholder `error.title`).
4. Đọc `redirect` query param, validate qua `createSafeRedirectUrl`, điều hướng sau `mutation.isSuccess`; mặc định `/app`.
5. Link tới `/register`.

**Tests:**
1. Sai email → lỗi Zod client-side, 0 lần gọi API.
2. MSW mock thành công → điều hướng đúng đích (mặc định và có redirect hợp lệ).
3. MSW mock 401 `INVALID_CREDENTIALS` → Alert hiện đúng message tiếng Việt cuối cùng (không phải `error.title`).
4. `vitest-axe`: 0 vi phạm.

**Acceptance Criteria:**
- [ ] Login thành công điều hướng đúng đích
- [ ] Lỗi hiển thị đúng message tiếng Việt cuối cùng ngay từ M5 (không phải placeholder)
- [ ] Không có Open Redirect

**Exit Criteria:**
- [ ] Test + a11y pass, typecheck/lint sạch

---

### F2 M6 — Register Page

**Objective:** Thay placeholder `pages/auth/register/page.tsx` bằng form thật.
**Dependencies:** F2 M3.

**Files to modify:**
- `frontend/src/pages/auth/register/page.tsx`

**Implementation steps:**
1. Form 4 field dùng `useZodForm(registerSchema)`.
2. Thành công → **không** set session (F2-D6) — thông báo ngắn, `navigate('/login')`.
3. Lỗi 409 `EMAIL_ALREADY_EXISTS` → `setError('email', { message: getErrorMessage('EMAIL_ALREADY_EXISTS') })`.
4. Không có link "Quên mật khẩu" (F2-OQ-3 RESOLVED — không đưa Forgot Password vào F2 dưới bất kỳ hình thức nào, kể cả placeholder link).

**Tests:**
1. Password không khớp `confirmPassword` → lỗi client-side.
2. MSW mock 409 → lỗi đúng vị trí field.
3. MSW mock 201 → điều hướng `/login`.
4. a11y test.

**Acceptance Criteria:**
- [ ] Đăng ký thành công không tự động vào `/app`
- [ ] Lỗi email trùng hiện đúng vị trí field
- [ ] Không có bất kỳ UI nào liên quan Forgot Password

**Exit Criteria:**
- [ ] Test + a11y pass, typecheck/lint sạch

---

### F2 M7 — Logout UX (`UserMenu`)

**Objective:** Nối nút Logout vào slot `headerActions` (M1), với **ranh giới trách nhiệm nghiêm ngặt** theo `Confirmation.md`.
**Dependencies:** F2 M1 (`headerActions`), F2 M3 (`useLogoutMutation`).

**Files to create:**
- `frontend/src/widgets/user-menu/index.tsx`
- `frontend/src/widgets/user-menu/UserMenu.test.tsx`

**Files to modify:**
- `frontend/src/app/router.tsx` (truyền `<AppLayout headerActions={<UserMenu />}>`)

**Files to avoid touching:** `widgets/app-layout/index.tsx`, `shared/api/refresh-coordinator.ts`, `shared/stores/authStore.ts` (UserMenu không được sửa các file này).

**Ranh giới bắt buộc — `UserMenu` CHỈ được phép:**
- Đọc `user` từ `useAuthStore` (hiển thị tên/email)
- Gọi `useLogoutMutation()` có sẵn (không tự viết logic logout mới)

**`UserMenu` TUYỆT ĐỐI KHÔNG được:**
- Tự gọi refresh token hoặc bất kỳ hàm nào từ `refresh-coordinator`
- Thay đổi auth lifecycle (không tự set `status`)
- Gọi trực tiếp `authStore.setState`/`setSession`/`clearSession` (chỉ qua hook đã có)
- Tự implement logic redirect bảo mật (điều hướng sau logout là UX thông thường, được phép; nhưng **không** tự quyết định ai được vào route nào — đó là việc của `ProtectedRoute`)

Đây là "Auth orchestration" — thuộc về `features/auth`/`shared/api`, không phải `widgets/user-menu`.

**Implementation steps:**
1. `UserMenu`: đọc `user`, nút "Đăng xuất" gọi `useLogoutMutation().mutate()`.
2. Sau `onSettled`, điều hướng `/login` (UX, không phải security decision).

**Tests:**
1. Click "Đăng xuất" → MSW mock logout → `authStore.status === 'unauthenticated'` + điều hướng `/login`.
2. Logout API fail (500) → vẫn điều hướng `/login`.
3. **Test ranh giới (mới)**: review tĩnh — `UserMenu` source không import `refresh-coordinator` hoặc gọi trực tiếp `authStore.setState`/`setSession`/`clearSession` (kiểm tra bằng đọc lại import list khi review, không chỉ chạy test).

**Acceptance Criteria:**
- [ ] Logout hoạt động cả khi API thành công lẫn thất bại
- [ ] `UserMenu` không vi phạm ranh giới trách nhiệm ở trên
- [ ] `AppLayout` không import `features/auth`

**Exit Criteria:**
- [ ] Test pass, typecheck/lint sạch

---

### F2 M8 — Testing Consolidation & E2E

**Objective:** Rà soát coverage, thêm test tích hợp toàn luồng, và **Playwright E2E cho luồng chính** (F2-OQ-1 RESOLVED — trong scope, không còn tùy chọn).
**Dependencies:** F2 M1–M7.

**Files to create:**
- `frontend/e2e/auth.spec.ts` (Playwright — Register → Login → truy cập `/app` → Logout, chạy trên backend thật local)
- `frontend/src/features/auth/auth-flow.integration.test.tsx` (MSW, toàn luồng)

**Implementation steps:**
1. Đọc lại coverage report, đối chiếu Coding Standards §13.
2. Integration test toàn luồng qua MSW: register → login → truy cập `/app` → giả lập 401 giữa phiên → tự refresh + vào được `/app` → logout → về `/login`.
3. Playwright E2E: chạy trên backend thật (ghi rõ precondition — cần `docker compose up` DB + backend chạy local), kịch bản đúng UI Spec dòng 1217 ("Register → Login").

**Acceptance Criteria:**
- [ ] Integration test toàn luồng pass
- [ ] E2E Playwright pass trên backend thật local
- [ ] Coverage review theo tinh thần risk-based (tương tự Backend §12.7, không ngưỡng % cứng)

**Exit Criteria:**
- [ ] `npm run test:coverage` sạch, `npm run test:e2e` pass, không TODO/FIXME chưa phân loại trong `features/auth/`

---

### F2 M9 — Documentation & Sprint Closure

**Objective:** Đóng Sprint F2 theo đúng tinh thần "audit thật, không tự nhận PASS" đã áp dụng cho Backend Sprint 3 M10.
**Dependencies:** F2 M1–M8.

**Files to create:**
- `docs/implementation/Sprint_F2_Known_Gaps_Registry.md`
- `docs/implementation/Sprint_F2_Exit_Criteria_Evidence_Matrix.md`

**Files to modify:**
- `frontend/README.md`, `frontend/CHANGELOG.md` (kiểm tra tồn tại trước, không giả định), `frontend/package.json` (version bump nếu convention đã có)
- Xác nhận Architecture Spec §10.1/§12.2 (M1) đã thực sự merge, không còn "chờ quyết định" — F2-OQ-2 phải đóng dứt điểm ở đây

**Implementation steps:**
1. Clean Environment Verification thật: clone sạch → `npm ci` → `lint` → `typecheck` → `format:check` → `test:coverage` → `test:e2e` → `build` — ghi log thật.
2. Đối chiếu Acceptance/Exit Criteria (Mục 26/27) bằng bằng chứng thật.
3. Known Gaps Registry: mọi điểm còn lại (nếu có) sau khi F2-OQ-1/2/3 đã đóng hoàn toàn trong Sprint này.
4. Final Recommendation.

**Acceptance Criteria:**
- [ ] Mọi Exit Criteria có bằng chứng thật

**Exit Criteria:**
- [ ] Final Recommendation rõ ràng, có căn cứ

## 19. Testing Strategy

| Loại | Công cụ | Phạm vi |
|---|---|---|
| Unit | Vitest | `authStore`, `error-messages.ts`, `schema.ts`, `refresh-coordinator.ts` dedupe |
| Component | Vitest + Testing Library + MSW | `LoginForm`, `RegisterForm`, `UserMenu` |
| Integration | Vitest + MSW | Toàn luồng auth (M8), đặc biệt race-condition refresh |
| Accessibility | `vitest-axe` | `LoginForm`/`RegisterForm`/`UserMenu` |
| E2E | Playwright | **Trong scope (F2-OQ-1 RESOLVED)** — luồng chính Register→Login→Protected→Logout trên backend thật local |

## 20. Accessibility & Responsive QA

(Không đổi so với v1) Dùng lại accessibility có sẵn từ F1; focus chuyển tới field lỗi đầu tiên sau submit lỗi — verify thủ công (Mục 21); responsive QA chỉ cần cho nội dung form mới.

## 21. Manual QA Matrix

(Không đổi so với v1 — xem bảng 6 kịch bản: login sai 3 lần, cookie bị xóa, truy cập `/app` trực tiếp, logout mất mạng, tab ẩn danh, zoom 200% + bàn phím)

## 22. F2 Decision Log

| ID | Decision | Rationale | Status |
|---|---|---|---|
| F2-D1 | Bỏ qua field `refreshToken` trong response body; chỉ dựa HttpOnly Cookie | Giữ tinh thần chống XSS §12.1 | **ACCEPTED** |
| F2-D2 | `ApiError.fieldErrors = Record<string,string[]>` từ `metadata.fieldErrors` | Khớp bằng chứng backend thật | **ACCEPTED** |
| F2-D3 | `AppLayout.headerActions?: ReactNode` + `UserMenu` compose từ ngoài | Giữ layout business-agnostic | **ACCEPTED** |
| F2-D4 | Logout luôn `clearSession()` bất kể kết quả API (`onSettled`) | Access token có thể đã hết hạn khi bấm logout | **ACCEPTED** |
| F2-D5 | Refresh dùng single-flight bắt buộc | Backend rotate token nghiêm ngặt | **ACCEPTED** |
| F2-D6 | Register → `/login`, không auto-login | Existing decision (UI Spec dòng 704) | **CONFIRMED** |
| F2-D7 | `/app` là đích mặc định sau login | Existing decision | **CONFIRMED** |
| F2-D8 | Refresh coordinator sống ở `shared/api/`, không phải `features/auth/api/`; `features/auth` inject handler qua `registerAuthInfrastructure()` | `shared` không được import ngược `features` — injection boundary giải quyết đúng chiều phụ thuộc | **ACCEPTED** (theo `Confirmation.md`) |
| F2-D9 | `reportError` chỉ gọi cho lỗi unexpected/unmapped/5xx/network — không gọi cho lỗi nghiệp vụ đã mapped | Tránh duplicate logging, tránh coi lỗi 401/409/400 là "application crash" | **ACCEPTED** (theo `Confirmation.md`) |
| F2-D10 | `useSessionBootstrap` không dùng `useMutation` — gọi thẳng `coordinateRefresh()` trong `useEffect` | Bootstrap là initialization concern, không phải user-triggered mutation; ép vào TanStack Query làm phức tạp lifecycle không cần thiết | **ACCEPTED** (theo `Confirmation.md`) |
| F2-D11 | `UserMenu` giới hạn nghiêm ngặt: chỉ đọc `authStore` + gọi `useLogoutMutation`; không tự refresh/không tự đổi lifecycle/không tự mutate store/không tự làm redirect security | Ngăn `UserMenu` trở thành "Auth controller" ẩn, giữ orchestration tập trung ở `features/auth`/`shared/api` | **ACCEPTED** (theo `Confirmation.md`) |
| F2-D12 | `error-messages.ts` tạo ở M1, không phải M8 | M5/M6 dùng behavior cuối ngay từ đầu, tránh giai đoạn "tạm" gây rework | **ACCEPTED** (theo `Confirmation.md`) |

## 23. F2 Open Questions & Blockers — ĐÃ ĐÓNG

| ID | Final Status |
|---|---|
| F2-OQ-1 | **RESOLVED** — Playwright E2E luồng chính nằm trong scope F2 M8 |
| F2-OQ-2 | **RESOLVED** — cập nhật Architecture Spec §10.1/§12.2 ngay trong F2 M1, xác nhận lại ở F2 M9 |
| F2-OQ-3 | **RESOLVED** — không có UI Forgot Password dưới bất kỳ hình thức nào trong F2 |

Không còn Open Question nào chưa đóng. Toàn bộ Decision Log (Mục 22) đã ACCEPTED/CONFIRMED — F2 sẵn sàng bắt đầu code từ F2 M1.

## 24. Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Refresh race condition test sai cách (giả mock không thật) | Trung bình | Cao | M4 bắt buộc test đếm số lần gọi `/refresh` thật qua MSW |
| Injection boundary (F2-D8) bị phá vỡ về sau — ai đó import thẳng `features/auth` vào `shared/api` cho "tiện" | Thấp | Cao (phá Dependency Direction) | Code review checklist thêm mục kiểm tra riêng cho `shared/api/refresh-coordinator.ts` không bao giờ có import từ `features/*` |
| `reportError` bị gọi tràn lan trở lại theo thời gian (dev sau này quên rule F2-D9) | Trung bình | Trung bình | Test M1 cụ thể (đã thêm) chứng minh lỗi mapped không gọi `reportError` — giữ test này như regression guard |
| `UserMenu` bị mở rộng dần thành nơi chứa auth logic (vi phạm F2-D11) | Thấp | Trung bình | Test ranh giới tĩnh ở M7 + ghi rõ trong Coding Standards checklist |
| MSW không mô phỏng đúng hành vi cookie thật của trình duyệt | Trung bình | Trung bình | Manual QA Matrix (Mục 21) verify cookie thật trên trình duyệt |

## 25. Documentation Requirements

- **Bắt buộc, không còn tùy chọn** (F2-OQ-2 RESOLVED): cập nhật Architecture Spec §10.1 (`ApiError` shape) và §12.2 (backend trả cả cookie lẫn body) — thực hiện ngay trong F2 M1, xác nhận lại đã merge đúng ở F2 M9.
- `frontend/README.md`: thêm mục "Authentication Flow" (theo pattern `backend/README.md` đã dùng ở Backend Sprint 3 M10).
- `CHANGELOG.md` frontend — kiểm tra tồn tại trước, tạo mới nếu chưa có.

## 26. Sprint-Level Acceptance Criteria

### Authentication
- [ ] User đăng ký được, nhận đúng lỗi nếu email đã tồn tại
- [ ] User đăng nhập được, vào đúng `/app` (hoặc `redirect` hợp lệ)
- [ ] Phiên sống sót qua reload (silent refresh qua cookie)
- [ ] User đăng xuất được, cả khi API logout lỗi

### Routing
- [ ] Chưa đăng nhập không vào được `/app`
- [ ] Đã đăng nhập không bị chặn sai bởi `/login`/`/register`
- [ ] Không có redirect flicker lúc khởi tạo

### Refresh
- [ ] Access token hết hạn giữa phiên tự trigger refresh đúng contract
- [ ] Request gốc retry đúng 1 lần sau refresh thành công
- [ ] Refresh thất bại chuyển hẳn về `unauthenticated`
- [ ] 401 đồng thời không gây gọi `/refresh` nhiều lần — không thể có refresh loop
- [ ] Session bootstrap và refresh giữa phiên dùng chung 1 coordinator, không có 2 cơ chế song song

### Errors
- [ ] Lỗi validation hiển thị đúng (shape thật, Mục 4.3)
- [ ] Lỗi auth hiện message tiếng Việt cuối cùng **ngay từ M5/M6**, không qua giai đoạn tạm
- [ ] `reportError` không bị gọi cho lỗi nghiệp vụ đã biết (F2-D9, có test chứng minh)
- [ ] Lỗi mạng/server có UX phù hợp

### Quality
- [ ] `npm run typecheck` pass
- [ ] `npm run lint` pass
- [ ] `npm run format:check` pass
- [ ] Unit/component/integration test pass
- [ ] **E2E Playwright pass** (bắt buộc, F2-OQ-1 RESOLVED — không còn điều kiện "nếu chọn")
- [ ] `npm run build` pass
- [ ] `vitest-axe` không vi phạm
- [ ] Manual QA Matrix đã chạy ít nhất 1 lần trên trình duyệt thật

## 27. Sprint Exit Criteria

- [ ] Toàn bộ 9 milestone đạt Acceptance Criteria riêng
- [ ] Không có TODO/FIXME chưa phân loại trong `features/auth/`
- [ ] Lint/format/typecheck/build sạch trên môi trường clean clone
- [ ] E2E Playwright pass (bắt buộc)
- [ ] Manual QA đã thực hiện, ghi log thật
- [ ] Accessibility review pass
- [ ] Responsive review pass
- [ ] Security review: F2-D1 (bỏ qua refresh token body) đã implement đúng, không chỉ ghi trong doc
- [ ] Documentation cập nhật (Mục 25) — **đã merge thật**, không còn "chờ quyết định"
- [ ] Không còn Open Question nào chưa đóng (Mục 23 xác nhận cả 3 đã RESOLVED)
- [ ] Known Gaps đã phân loại (F2 M9)

## 28. Definition of Done

> Người dùng đăng ký, đăng nhập, giữ phiên qua reload, bị 401 giữa phiên vẫn tiếp tục làm việc êm nhờ 1 cơ chế refresh single-flight duy nhất dùng chung cho cả bootstrap lẫn interceptor (không loop, không race), đăng xuất sạch qua `UserMenu` có ranh giới trách nhiệm rõ ràng — toàn bộ luồng có test chứng minh bằng MSW và ít nhất 1 kịch bản Playwright E2E thật, lỗi hiển thị đúng tiếng Việt theo đúng shape thật của backend ngay từ milestone UI đầu tiên (không qua giai đoạn tạm), kiến trúc tôn trọng đúng chiều phụ thuộc `shared`↛`features` qua injection boundary, và Sprint đóng được với bằng chứng thật cho từng Exit Criterion.

## 29. Final Implementation Sequence

```
F2 M1 (hạ tầng đầy đủ: TanStack Query, ApiError fix, report-error + error-messages, refresh-coordinator + injection boundary, AppLayout slot, cập nhật doc)
   ↓
F2 M2 (model + api/ - lớp câm)
   ↓
F2 M3 (hooks + authStore thật + đăng ký refresh handler)
   ↓
F2 M4 (session bootstrap — dùng lại coordinator M1, không useMutation)
   ↓
F2 M5 (Login Page) ──┐
F2 M6 (Register Page) ┤ có thể song song sau M4
   ↓                  ┘
F2 M7 (Logout UX / UserMenu — ranh giới nghiêm ngặt)
   ↓
F2 M8 (Testing consolidation + E2E Playwright)
   ↓
F2 M9 (Documentation & Closure)
```

So với v1: M1 nặng hơn đáng kể (gồm cả error dictionary và refresh coordinator), M4 nhẹ hơn (chỉ còn wiring, logic nặng đã chuyển sang M1), M8 (error dictionary riêng) đã bị loại bỏ hoàn toàn — nội dung dồn vào M1; tổng còn 9 milestone thay vì 10.

## 30. Final Architect Review

1. **F2 chỉ phụ thuộc chức năng đã hoàn thành/verify?** Có.
2. **Backend Identity contract đủ rõ?** Có.
3. **Refresh-token strategy đã biết rõ?** Có — cookie + rotation, đã xác nhận bằng code.
4. **Auth state ownership rõ ràng?** Có — mở rộng tường minh cho `refresh-coordinator` (tầng hạ tầng) bên cạnh `features/auth/hooks`, ghi rõ lý do (Mục 11).
5. **Route protection rõ ràng?** Có — không sửa.
6. **App có restore session đúng?** Có — qua coordinator dùng chung, không phải cơ chế riêng.
7. **Refresh thất bại có terminate an toàn?** Có.
8. **Có khả năng refresh loop vô hạn?** Không — `_retry` flag + single-flight coordinator dùng chung cho cả bootstrap lẫn 401 giữa phiên (đã hợp nhất, giảm rủi ro có 2 cơ chế lệch nhau).
9. **API infra và auth business logic tách đúng?** Có — rõ ràng hơn v1 nhờ injection boundary tường minh (F2-D8), giải quyết đúng vi phạm Dependency Direction mà v1 chưa xử lý triệt để.
10. **Plan tôn trọng Dependency Direction?** Có — đây chính là điểm được sửa quan trọng nhất so với v1.
11. **Layout còn business-agnostic?** Có.
12. **Plan vừa sức 1 developer?** Có — 9 milestone, M1 lớn hơn nhưng gộp các việc hạ tầng liên quan chặt chẽ với nhau thay vì rải rác.
13. **Có scope creep không?** Không — E2E và doc update giờ là Acceptance Criteria bắt buộc (theo quyết định của bạn), không phải tự ý thêm.
14. **Test đủ để validate vertical slice?** Có — bổ sung test ranh giới cho `UserMenu` và test phân loại `reportError`.
15. **Sprint đóng được khách quan?** Có.
16. **Mọi quyết định chưa chốt đã được nêu rõ?** Có — không còn Open Question nào (Mục 23).
17. **Có giả định nào bị coi là fact không?** Không — v1's `features/auth/api/refresh-queue.ts` (đặt sai tầng, vi phạm Dependency Direction) đã được thay bằng `shared/api/refresh-coordinator.ts` + injection boundary đúng kiến trúc.

**Kết luận Final Architect Review: Đạt — plan Rev.2 sẵn sàng để bắt đầu code từ F2 M1.**
