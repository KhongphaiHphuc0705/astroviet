# Sprint F2 — M3 Implementation Plan
## `features/auth` Hooks + `authStore` Real Wiring

---

## 1. Executive Summary

M3 nối tầng API "câm" (M2) với `authStore` (Zustand) thông qua 3 mutation hook (`useLoginMutation`, `useRegisterMutation`, `useLogoutMutation`), và thay thế hoàn toàn hành vi giả lập F1 trong `authStore.ts` bằng state transition thật (`setSession`/`clearSession`).

**Phát hiện quan trọng nhất trước khi lập plan (đọc trực tiếp code thật, HEAD `dc6b455`):** Trách nhiệm thứ 3 mà prompt gốc gán cho M3 — *"Register auth infrastructure"* (tạo `registerAuthInfrastructure()`, đăng ký `refresh` thật vào coordinator, gọi từ provider startup) — **đã được hoàn thành trọn vẹn ở M2**, không phải còn để M3 làm. Đây là hệ quả trực tiếp của việc giải quyết M1-OQ-2 (đã thực hiện khi lập plan M2): `features/auth/index.ts` đã tồn tại với `registerAuthInfrastructure()` gọi `setRefreshHandler(async () => (await refresh()).accessToken)`, và `main.tsx` đã gọi hàm này đúng 1 lần. 3 test case cho hành vi này (đăng ký-và-dùng, gọi lại an toàn, chỉ import không tự đăng ký) đã tồn tại và pass trong `features/auth/index.test.ts`.

Theo đúng chỉ dẫn của prompt gốc (§3: *"If the actual code differs from this prompt, explicitly identify the discrepancy and base the plan on the actual code"*), **plan này không lặp lại công việc đã xong** — M3 chỉ còn 2 trách nhiệm thật sự: (A) 3 mutation hook, (B) `authStore` real wiring. Phần hạ tầng đăng ký (C) chỉ cần **verify lại** (M3.1), không implement lại.

---

## 2. Current-State Verification

Đọc trực tiếp toàn bộ 18 điểm yêu cầu ở §3 prompt gốc, tại `dev` HEAD `dc6b455`:

| # | Đường dẫn | Trạng thái thật |
|---|---|---|
| 1 | `features/auth/model/schema.ts` | `registerSchema` (email/password/confirmPassword/displayName), `loginSchema` (email/password) — Zod, export `RegisterFormValues`/`LoginFormValues` |
| 2-5 | `features/auth/api/{register,login,refresh,logout}.ts` | Đúng "dumb" — chỉ gọi `apiClient`, trả DTO thô, không hook/state/UI/navigation |
| 6 | `shared/stores/authStore.ts` | **F1 stub nguyên trạng**: `{status, accessToken, user: {id,email}\|null, login(): void /* no-op */, logout(): void}` + hàm rời `bootstrapAuthResolution()` (setTimeout 100ms giả lập) |
| 7 | `shared/api/client.ts` | Axios instance, `ApiError`, `AUTH_REFRESH_ENDPOINT`, `isRefreshRequest()`, 401 interceptor gọi `coordinateRefresh<string>()` (M1+M2) |
| 8 | `shared/api/auth-refresh-coordinator.ts` | `setRefreshHandler<T>(handler: () => Promise<T>): void`, `coordinateRefresh<T>(): Promise<T>`, `__resetRefreshCoordinatorForTests(): void` — module-level singleton, 0 import |
| 9 | `setRefreshHandler()` thật | Đúng như trên — generic, không biết `accessToken`/`user`/`authStore` |
| 10 | Refresh handler contract | `() => Promise<T>` — T do caller quyết định qua generic |
| 11 | `app/providers/*` | **Chỉ có `ThemeProvider.tsx`** — không có file provider nào khác |
| 12 | `QueryProvider`/`QueryClientProvider` | Không có file `QueryProvider` riêng — `QueryClientProvider` được bọc trực tiếp trong `app/App.tsx`, dùng `queryClient` (singleton) từ `shared/api/queryClient.ts`; `createQueryClient()` cũng được export làm factory (dùng lại trong test) |
| 13 | Test utilities | `src/test/render.tsx` — `renderWithProviders()` bọc `ThemeProvider` + `QueryClientProvider` (dùng `createQueryClient()` mới mỗi test) + `MemoryRouter` |
| 14 | MSW | `src/test/msw-server.ts` — đã dùng rộng rãi trong `features/auth/api/*.test.ts` |
| 15 | Zustand convention | `create<State>((set) => ({...}))`, export named `useXStore`, actions là method trong cùng object |
| 16 | Path alias | `@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`, `@test` (từ `tsconfig.app.json`) |
| 17 | Barrel convention | `features/auth/index.ts` đã tồn tại: **hiện chỉ export `registerAuthInfrastructure`** — chưa export hook nào (vì hook chưa tồn tại) |
| 18 | Lint/format/test config | `npm run lint` (eslint .), `typecheck` (tsc --noEmit), `format:check` (prettier --check .), `test` (vitest run --passWithNoTests), `test:coverage`, `build` (tsc --noEmit && vite build) |

**Người tiêu thụ `authStore`/`bootstrapAuthResolution` hiện tại** (grep toàn repo, loại trừ file test):
```
shared/stores/authStore.ts   (định nghĩa)
shared/api/client.ts         (chỉ đọc accessToken — request interceptor, KHÔNG gọi login()/logout())
app/routing/ProtectedRoute.tsx  (chỉ đọc status)
app/routing/GuestRoute.tsx      (chỉ đọc status)
main.tsx                        (gọi bootstrapAuthResolution())
```
→ Xóa `login()`/`logout()`/`bootstrapAuthResolution()` **không ảnh hưởng** `client.ts`/`ProtectedRoute`/`GuestRoute` (chỉ đọc `status`/`accessToken`, không gọi action nào sắp bị xóa) — **chỉ ảnh hưởng** `authStore.ts` chính nó, `authStore.test.ts` (5 test đang test API cũ), và `main.tsx` (gọi `bootstrapAuthResolution()`).

**`features/auth/index.ts` hiện tại (nguyên văn):**
```ts
import { setRefreshHandler } from "@shared/api/auth-refresh-coordinator";
import { refresh } from "./api/refresh";

export function registerAuthInfrastructure(): void {
  setRefreshHandler(async () => {
    const result = await refresh();
    return result.accessToken;
  });
}
```

**`main.tsx` hiện tại (nguyên văn):**
```tsx
import { registerAuthInfrastructure } from "@features/auth";
import { bootstrapAuthResolution } from "@shared/stores/authStore";

registerAuthInfrastructure();
bootstrapAuthResolution();

createRoot(...).render(<StrictMode><App /></StrictMode>);
```

Không có điểm nào trong 18 mục còn "UNKNOWN — verify during implementation".

---

## 3. Objective

M3 có đúng **2 trách nhiệm còn lại** (không phải 3 như khung prompt gốc mô tả — xem Mục 1):

- **Trách nhiệm A — Mutation hooks:** `useLoginMutation`, `useRegisterMutation`, `useLogoutMutation` bọc 3 hàm API tương ứng, nối kết quả vào `authStore`.
- **Trách nhiệm B — `authStore` real wiring:** thay `login()`/`logout()`/`bootstrapAuthResolution()` (giả) bằng `setSession(user, accessToken)`/`clearSession()` (thật).
- **Trách nhiệm C (đã xong ở M2, chỉ verify lại):** `registerAuthInfrastructure()` + đăng ký ở `main.tsx` — không implement lại, không sửa trừ khi phát hiện lỗi thật.

---

## 4. Dependencies & Preconditions

- F2 M1 — CLOSED (verify độc lập 2 lượt trước: lint/typecheck/format/228 test/build sạch).
- F2 M2 — CLOSED (verify độc lập lượt trước: lint/typecheck/format/255 test/build sạch, 0 vi phạm dependency direction).
- Backend Sprint 1 Identity — CLOSED, contract đã verify trực tiếp từ code thật ở M2 (không cần verify lại — API layer M2 đã đúng contract).
- Không có precondition nào chưa thỏa mãn.

---

## 5. Scope

1. `features/auth/hooks/useLoginMutation.ts` (mới)
2. `features/auth/hooks/useRegisterMutation.ts` (mới)
3. `features/auth/hooks/useLogoutMutation.ts` (mới)
4. `shared/stores/authStore.ts` (sửa toàn bộ — bỏ stub, thêm `setSession`/`clearSession`)
5. `shared/stores/authStore.test.ts` (viết lại toàn bộ — 5 test cũ test API sẽ không còn tồn tại)
6. `features/auth/index.ts` (sửa — thêm export 3 hook; **không đổi** `registerAuthInfrastructure`)
7. `main.tsx` (sửa tối thiểu — bỏ import/gọi `bootstrapAuthResolution()` đã bị xóa khỏi `authStore.ts`; **không đổi** dòng `registerAuthInfrastructure()`)
8. Test cho 3 hook (Mục 11)

---

## 6. Non-Goals

Đúng nguyên văn §25 prompt gốc — không implement: Login/Register Page UI, Forgot Password, UserMenu, Logout UI, thay đổi `ProtectedRoute`/`GuestRoute`, session bootstrap, refresh retry logic, single-flight implementation, redesign 401 interceptor, redirect handling, hoàn thiện dictionary lỗi tiếng Việt, E2E, backend/database changes, store Zustand thứ 4, redesign token persistence, refresh token rotation logic, access-token renewal logic vượt quá ranh giới đăng ký.

**Bổ sung riêng cho repo này (không có trong danh sách gốc vì gốc giả định M3 làm việc này lần đầu):** M3 **không tạo lại** `registerAuthInfrastructure()`, **không tạo file provider mới**, **không sửa logic đăng ký refresh handler** — việc này đã CLOSED ở M2 (Mục 1).

---

## 7. Architecture & Dependency Direction

```
features/auth/api/*        (M2, không đổi)
        ↓
features/auth/hooks/*      (M3 — MỚI)
        ↓
shared/stores/authStore    (M3 — sửa)

features/auth/api/refresh
        ↓
registerAuthInfrastructure()   (M2, đã CLOSED — M3 chỉ verify)
        ↓
shared/api/auth-refresh-coordinator   (M1, không đổi)
        ↑
shared/api/client                      (M1/M2, không đổi)

main.tsx
        ↓
registerAuthInfrastructure()  (đã có từ M2 — không đổi dòng này)
```

**Xác nhận tường minh (đối chiếu §24 prompt gốc):**

| Quan hệ yêu cầu | Đúng thật? |
|---|---|
| `features/auth/api → shared/api/client` | ✅ (đã có từ M2) |
| `features/auth/hooks → features/auth/api` | ✅ (M3 tạo) |
| `features/auth/hooks → shared/stores/authStore` | ✅ (M3 tạo — hook gọi `setSession`/`clearSession`) |
| `features/auth/index → features/auth/hooks` | ✅ (M3 thêm export) |
| `features/auth/index → features/auth/api/refresh` | ✅ (đã có từ M2, không đổi) |
| `features/auth/index → shared/api/auth-refresh-coordinator` | ✅ (đã có từ M2, không đổi) |
| `shared/api/* ↛ features/auth` | ✅ — verify thủ công (grep), 0 vi phạm |
| `app/providers (main.tsx) → features/auth/index` | ✅ (đã có từ M2 — `registerAuthInfrastructure()`) |

**Không có vi phạm nào cần sửa.** Đây là bằng chứng M2 đã dựng đúng nền móng cho M3.

---

## 8. Auth Contract Relevant to M3

(Đối chiếu lại — không re-verify backend, dùng nguyên contract đã xác nhận ở M2)

| Operation | DTO trả về (từ `features/auth/api/types.ts`) | Hook dùng field nào |
|---|---|---|
| Register | `RegisterResponse = {user: UserResponse}` | Không dùng gì cho `authStore` — chỉ để lỗi/thành công propagate qua mutation state |
| Login | `AuthResponse = {accessToken, refreshToken, expiresIn, user}` | **Chỉ** `data.user`, `data.accessToken` — **không** destructure `refreshToken` (F2-D1/M3-D1) |
| Logout | Không có response body (`Promise<void>`) | Không có field nào để dùng — chỉ cần biết thành công/thất bại |

`UserResponse = {id, email, displayName: string\|null, role: "user"\|"admin", createdAt: string}` — đây chính là type sẽ truyền vào `setSession()`.

---

## 9. Detailed Implementation Plan

### M3.1 — Repository / M2 Contract Verification

- **Objective:** Xác nhận Mục 2 đúng thật tại thời điểm bắt đầu code (không tin lại báo cáo cũ nếu có commit mới).
- **Files:** Không sửa — chỉ đọc.
- **Preconditions:** Không.
- **Exact work:** `git log -3`, đọc lại 18 điểm Mục 2, đặc biệt xác nhận `features/auth/index.ts` vẫn đúng như Mục 2 mô tả (chưa bị ai sửa khác đi).
- **Dependency direction:** N/A (chỉ đọc).
- **Error/security:** N/A.
- **Tests:** Không.
- **Acceptance criteria:** Baseline khớp Mục 2, không có commit lạ.
- **Failure modes:** Nếu có commit mới thay đổi `registerAuthInfrastructure()`/`auth-refresh-coordinator.ts`, dừng lại và re-plan trước khi tiếp tục.
- **Verification command:** `git log --oneline -5`.

### M3.2 — `authStore` Real State Transition

- **Objective:** Xóa hành vi giả (`login`, `logout`, `bootstrapAuthResolution`), thêm `setSession`/`clearSession` thật.
- **Files:** `shared/stores/authStore.ts` (MODIFY).
- **Preconditions:** M3.1.
- **Exact implementation work:**
  ```ts
  import { create } from "zustand";

  export interface AuthUser {
    id: string;
    email: string;
    displayName: string | null;
    role: "user" | "admin";
    createdAt: string;
  }

  export interface AuthState {
    status: "resolving" | "authenticated" | "unauthenticated";
    accessToken: string | null;
    user: AuthUser | null;
    setSession: (user: AuthUser, accessToken: string) => void;
    clearSession: () => void;
  }

  export const useAuthStore = create<AuthState>((set) => ({
    status: "resolving",
    accessToken: null,
    user: null,
    setSession: (user, accessToken) =>
      set({ status: "authenticated", user, accessToken }),
    clearSession: () =>
      set({ status: "unauthenticated", user: null, accessToken: null }),
  }));
  ```
  **Bị xóa hoàn toàn:** `login()`, `logout()`, hàm rời `bootstrapAuthResolution()` (kể cả `setTimeout` bên trong).
  **Giữ nguyên:** field `status`/`accessToken` (tên/kiểu không đổi), giá trị khởi tạo (`resolving`/`null`/`null`).
- **Vì sao `AuthUser` định nghĩa riêng trong `authStore.ts`, không import `UserResponse` từ `features/auth/api/types.ts` (Decision M3-D6, Mục 13):** import như vậy sẽ tạo `shared → features/auth` — vi phạm ranh giới cứng (§24 prompt gốc). `AuthUser` và `UserResponse` **trùng khớp cấu trúc 100%** (cùng field, cùng kiểu) nên TypeScript structural typing cho phép truyền `UserResponse` vào `setSession(user: AuthUser, ...)` mà không cần cast — không cần tầng mapping nào.
- **Hệ quả cần nêu rõ (interim gap, không phải bug):** Xóa `bootstrapAuthResolution()` nghĩa là `status` sẽ **mãi mãi ở `resolving`** sau khi app khởi động, cho tới khi M4 implement `useSessionBootstrap()` (gọi `coordinateRefresh()` thật để chuyển trạng thái). Đây là khoảng trống đã biết trước, chấp nhận được — chưa có UI nào (Login/Register/Dashboard) tồn tại để bị ảnh hưởng bởi trạng thái `resolving` kéo dài.
- **Dependency direction:** `authStore.ts` không import gì mới, không import `features/*`.
- **Error/security:** Không liên quan trực tiếp — nhưng đảm bảo `clearSession()` luôn set cả 3 field cùng lúc (không để `user`/`accessToken` sót lại khi `status` đã đổi).
- **Tests:** Viết lại toàn bộ `authStore.test.ts` (Mục 11).
- **Acceptance criteria:** Không còn `login`/`logout`/`bootstrapAuthResolution` trong file; `setSession`/`clearSession` set đúng field.
- **Potential failure modes:** Quên xóa `bootstrapAuthResolution` khỏi export → `main.tsx` vẫn import được nhưng gọi hàm không tồn tại thật sự (runtime crash) — phải xử lý đồng bộ với M3.7.
- **Verification command:** `npm run typecheck` (sẽ tự bắt lỗi nếu `main.tsx` còn gọi hàm đã xóa, vì TS compile-time error).

### M3.3 — `useLoginMutation`

- **Objective:** Bọc `login()` (M2) bằng `useMutation`, nối `setSession`.
- **Files:** `features/auth/hooks/useLoginMutation.ts` (CREATE).
- **Preconditions:** M3.2 (`setSession` phải tồn tại trước).
- **Exact implementation work:**
  ```ts
  import { useMutation } from "@tanstack/react-query";

  import { useAuthStore } from "@shared/stores/authStore";

  import { login } from "../api/login";

  export function useLoginMutation() {
    return useMutation({
      mutationFn: login,
      onSuccess: (data) => {
        useAuthStore.getState().setSession(data.user, data.accessToken);
      },
    });
  }
  ```
- **`refreshToken` không được destructure ở đâu cả** — `data.refreshToken` không xuất hiện trong bất kỳ dòng code nào của hook này (M3-D1, xác nhận YES).
- **Dependency direction:** `features/auth/hooks → features/auth/api` + `→ shared/stores/authStore`. Hợp lệ.
- **Error/security:** Không bắt lỗi trong hook — lỗi propagate tự nhiên qua `mutation.error`/`mutation.isError` (TanStack Query). Không gọi `reportError` trong hook (đã xử lý ở tầng `queryClient.onError` từ M1, tránh double-report).
- **Tests:** Test A, Test B (Mục 11).
- **Acceptance criteria:** Login thành công → `authStore` authenticated đúng `user`/`accessToken`; login thất bại → `authStore` không đổi.
- **Potential failure modes:** Vô tình thêm `data.refreshToken` vào object khác "cho tiện" — bị cấm tuyệt đối, review thủ công + test Mục 11 Test A verify.
- **Verification command:** `npm run test -- useLoginMutation`.

### M3.4 — `useRegisterMutation`

- **Objective:** Bọc `register()`, **không** đụng `authStore`.
- **Files:** `features/auth/hooks/useRegisterMutation.ts` (CREATE).
- **Preconditions:** M3.1.
- **Exact implementation work:**
  ```ts
  import { useMutation } from "@tanstack/react-query";

  import { register } from "../api/register";

  export function useRegisterMutation() {
    return useMutation({
      mutationFn: register,
    });
  }
  ```
- **Không có `onSuccess`** — hoàn toàn không chạm `authStore` (đúng F2-D6). Login Page (M5, tương lai) sẽ tự quyết định điều hướng `/login` sau khi `mutation.isSuccess`.
- **Dependency direction:** `features/auth/hooks → features/auth/api`. Hợp lệ.
- **Error/security:** Lỗi 409 `EMAIL_ALREADY_EXISTS` propagate nguyên trạng qua `mutation.error`.
- **Tests:** Test C, Test D (Mục 11).
- **Acceptance criteria:** Đăng ký thành công/thất bại đều không đổi `authStore`.
- **Potential failure modes:** Vô tình thêm `onSuccess` "cho đủ bộ" giống `useLoginMutation` — đây là lỗi thật cần tránh, test Mục 11 Test D verify tường minh.
- **Verification command:** `npm run test -- useRegisterMutation`.

### M3.5 — `useLogoutMutation`

- **Objective:** Bọc `logout()`, đảm bảo `clearSession()` chạy dù thành công hay thất bại.
- **Files:** `features/auth/hooks/useLogoutMutation.ts` (CREATE).
- **Preconditions:** M3.2.
- **Exact implementation work:**
  ```ts
  import { useMutation } from "@tanstack/react-query";

  import { useAuthStore } from "@shared/stores/authStore";

  import { logout } from "../api/logout";

  export function useLogoutMutation() {
    return useMutation({
      mutationFn: logout,
      onSettled: () => {
        useAuthStore.getState().clearSession();
      },
    });
  }
  ```
- **Vì sao `onSettled` chứ không phải `onSuccess`+`onError` riêng:** `onSettled` chạy trong CẢ 2 trường hợp mà không cần viết 2 lần cùng 1 logic — đây chính là ngữ nghĩa cần cho F2-D4.
- **Hook không nuốt lỗi:** không có `onError` nào return giá trị/catch âm thầm — TanStack Query tự expose `mutation.error`/`mutation.isError` cho caller (M7 UserMenu, tương lai) đọc được. "Local session cleared" và "HTTP request có thành công hay không" là 2 việc tách biệt: `onSettled` lo việc đầu, `mutation.error` lo việc sau — hook không hợp nhất 2 khái niệm này thành 1.
- **Dependency direction:** `features/auth/hooks → features/auth/api` + `→ shared/stores/authStore`. Hợp lệ.
- **Error/security:** Không navigate, không toast trong hook (đúng §11 prompt gốc).
- **Tests:** Test E, Test F (Mục 11).
- **Acceptance criteria:** Cả 2 kịch bản (thành công/thất bại) đều `clearSession()`; lỗi vẫn quan sát được qua `mutation.error` ở kịch bản thất bại.
- **Potential failure modes:** Dùng nhầm `onSuccess` thay vì `onSettled` — Test F sẽ fail ngay nếu nhầm.
- **Verification command:** `npm run test -- useLogoutMutation`.

### M3.6 — `features/auth` Public API

- **Objective:** Mở rộng `index.ts` để export 3 hook mới, giữ nguyên `registerAuthInfrastructure`.
- **Files:** `features/auth/index.ts` (MODIFY).
- **Preconditions:** M3.3, M3.4, M3.5.
- **Exact implementation work:**
  ```ts
  export { useLoginMutation } from "./hooks/useLoginMutation";
  export { useRegisterMutation } from "./hooks/useRegisterMutation";
  export { useLogoutMutation } from "./hooks/useLogoutMutation";

  // Không đổi — đã đúng từ M2
  export { registerAuthInfrastructure } from "./..."; // giữ nguyên implementation gốc tại chỗ, chỉ thêm export hook phía trên
  ```
  (Ghi chú: giữ nguyên định nghĩa `registerAuthInfrastructure` tại chỗ trong file, chỉ thêm 3 dòng export mới — không refactor thành re-export nếu hàm đang định nghĩa trực tiếp trong `index.ts`.)
- **KHÔNG export:** `api/register`, `api/login`, `api/refresh`, `api/logout` cho consumer bên ngoài — giữ đúng ranh giới public API (§14 prompt gốc).
- **Dependency direction:** Không đổi.
- **Error/security:** N/A.
- **Tests:** `index.test.ts` bổ sung: import `useLoginMutation`/`useRegisterMutation`/`useLogoutMutation` từ `features/auth` (không phải từ đường dẫn sâu `features/auth/hooks/...`) → tồn tại, là function.
- **Acceptance criteria:** M5/M6/M7 (tương lai) có thể `import { useLoginMutation } from "@features/auth"` mà không cần biết cấu trúc thư mục nội bộ.
- **Potential failure modes:** Vô tình export thêm `api/*` "cho tiện test bên ngoài" — cấm.
- **Verification command:** `npm run test -- features/auth/index`.

### M3.7 — Provider Startup Registration (Verify + Corrective Change)

- **Objective:** Xác nhận `registerAuthInfrastructure()` vẫn được gọi đúng 1 lần (đã CLOSED từ M2), và sửa hệ quả bắt buộc của việc xóa `bootstrapAuthResolution()` (M3.2) khỏi `main.tsx`.
- **Files:** `main.tsx` (MODIFY — tối thiểu).
- **Preconditions:** M3.2 (hàm đã bị xóa khỏi `authStore.ts`).
- **Phân loại (đúng yêu cầu §25 prompt gốc — không được âm thầm hấp thụ):** **Corrective change**, không phải scope creep. Lý do: M3.2 xóa `bootstrapAuthResolution()` theo đúng yêu cầu tường minh của Trách nhiệm B; `main.tsx` gọi hàm này ở dòng `bootstrapAuthResolution();` — nếu không sửa, `npm run typecheck`/`npm run build` sẽ fail ngay (import không tồn tại). Đây là hệ quả không thể tránh, không phải mở rộng phạm vi tự phát.
- **Exact implementation work:**
  ```tsx
  // TRƯỚC:
  import { registerAuthInfrastructure } from "@features/auth";
  import { bootstrapAuthResolution } from "@shared/stores/authStore";

  registerAuthInfrastructure();
  bootstrapAuthResolution();

  // SAU:
  import { registerAuthInfrastructure } from "@features/auth";

  registerAuthInfrastructure();
  // bootstrapAuthResolution() đã bị loại bỏ (M3.2) — session bootstrap thật
  // sẽ được M4 implement (useSessionBootstrap), không phải M3.
  ```
- **KHÔNG đổi dòng `registerAuthInfrastructure();`** — dòng này đã đúng, đã CLOSED từ M2, không có lý do kỹ thuật nào để sửa.
- **KHÔNG tạo file provider mới, không đổi `app/providers/*`** — `ThemeProvider.tsx` không liên quan, không chạm.
- **Dependency direction:** Không đổi (`main.tsx → features/auth` đã có từ M2).
- **Error/security:** N/A.
- **Tests:** Không cần test riêng cho `main.tsx` (không có tiền lệ test file entry-point trong dự án — xác nhận qua Mục 2 điểm 13, không có `main.test.ts` nào tồn tại) — verify qua `npm run build` thành công (module resolution đúng) là đủ bằng chứng.
- **Acceptance criteria:** `npm run typecheck`/`npm run build` không lỗi; `registerAuthInfrastructure()` vẫn được gọi đúng 1 lần (không đổi).
- **Potential failure modes:** Quên sửa `main.tsx` sau M3.2 → build fail ngay lập tức (dễ phát hiện, không phải rủi ro âm thầm).
- **Verification command:** `npm run build`.

### M3.8 — (Không áp dụng riêng — đã gộp vào M3.7)

Ghi chú tường minh: cấu trúc gợi ý ở §26 prompt gốc có bước riêng "M3.8 — Provider Startup Registration" giả định đây là việc làm MỚI. Trong repo này, việc đó đã CLOSED ở M2 — phần còn lại (sửa hệ quả ở `main.tsx`) đã gộp vào M3.7 ở trên vì cùng 1 file, cùng 1 lý do (dọn dẹp sau khi xóa `bootstrapAuthResolution`). Không tạo mục M3.8 riêng để tránh đánh số giả một công việc không tồn tại.

### M3.9 — MSW / Mutation / Wiring Tests

- **Objective:** Hoàn thiện toàn bộ test còn thiếu từ M3.2–M3.7, đối chiếu đủ Test A–F + registration/provider test.
- **Files:** `shared/stores/authStore.test.ts` (REWRITE), `features/auth/hooks/{useLoginMutation,useRegisterMutation,useLogoutMutation}.test.ts` (CREATE), `features/auth/index.test.ts` (MODIFY — thêm case export hook).
- **Preconditions:** M3.2–M3.6.
- **Exact work:** Bảng đầy đủ ở Mục 11.
- **Dependency direction:** Test dùng `renderHook` (từ `@testing-library/react`, đã là dependency có sẵn) + wrapper tự tạo tái dùng `createQueryClient()` (đã export từ `shared/api/queryClient.ts`, M1) — **không tạo test harness thứ 2**.
- **Tests:** Chính milestone này LÀ test.
- **Acceptance criteria:** Toàn bộ bảng Mục 11 có test tương ứng và pass.
- **Potential failure modes:** Dùng `renderWithProviders` (thiết kế cho `render()` component) nhầm cho hook — `renderHook` cần wrapper riêng, không dùng chung được 1:1; phải tự dựng wrapper nhỏ (xem Mục 11).
- **Verification command:** `npm run test`.

### M3.10 — Verification / Review / Exit

- **Objective:** Chạy toàn bộ verification, đối chiếu Acceptance/Exit Criteria, dependency review thủ công.
- **Files:** Không sửa.
- **Preconditions:** M3.1–M3.9.
- **Exact work:** Mục 18 (Verification Commands) chạy đầy đủ; grep dependency direction (Mục 7); đối chiếu Mục 16/17.
- **Tests:** Không thêm — chạy lại toàn bộ.
- **Acceptance criteria:** Mục 16 đạt 100%.
- **Potential failure modes:** Bỏ sót regression F1/M1/M2 nếu không chạy full suite (không chỉ file mới).
- **Verification command:** Toàn bộ Mục 18.

---

## 10. File-by-File Change Plan

| Path | Action | Purpose | Dependencies | Expected changes | Must NOT change | Tests |
|---|---|---|---|---|---|---|
| `features/auth/hooks/useLoginMutation.ts` | CREATE | Bọc `login()`, nối `setSession` | `../api/login`, `@shared/stores/authStore`, `@tanstack/react-query` | Toàn bộ file mới | — | Test A, B |
| `features/auth/hooks/useRegisterMutation.ts` | CREATE | Bọc `register()`, không đụng `authStore` | `../api/register`, `@tanstack/react-query` | Toàn bộ file mới | Không thêm `onSuccess` | Test C, D |
| `features/auth/hooks/useLogoutMutation.ts` | CREATE | Bọc `logout()`, `onSettled` → `clearSession` | `../api/logout`, `@shared/stores/authStore`, `@tanstack/react-query` | Toàn bộ file mới | Không dùng `onSuccess` thay `onSettled` | Test E, F |
| `shared/stores/authStore.ts` | MODIFY | Thay stub bằng state transition thật | Không đổi import (chỉ `zustand`) | Xóa `login`/`logout`/`bootstrapAuthResolution`; thêm `AuthUser`, `setSession`, `clearSession` | Tên/kiểu `status`/`accessToken`, giá trị khởi tạo | `authStore.test.ts` (rewrite) |
| `shared/stores/authStore.test.ts` | REWRITE | Test state transition thật | `authStore.ts` | Xóa 5 test cũ, viết test mới (Mục 11) | — | Chính nó |
| `features/auth/index.ts` | MODIFY | Export 3 hook mới | `./hooks/*` | Thêm 3 dòng export | `registerAuthInfrastructure` implementation | `index.test.ts` (bổ sung case) |
| `main.tsx` | MODIFY (Corrective) | Bỏ gọi hàm đã xóa | `@features/auth` (không đổi) | Xóa import + dòng gọi `bootstrapAuthResolution()` | Dòng `registerAuthInfrastructure()` | Không có test riêng — verify qua `build` |
| `app/providers/*` | **VERIFY ONLY** | Xác nhận không cần file mới | — | Không đổi gì | Toàn bộ | — |

---

## 11. Testing Plan

Quy ước: co-located `.test.ts`/`.test.tsx`, đúng convention F1/M1/M2.

### `authStore.test.ts` (rewrite hoàn toàn)

| Test | Setup | Assert |
|---|---|---|
| Initial shape | Store mặc định | `status==='resolving'`, `accessToken===null`, `user===null`, `typeof setSession==='function'`, `typeof clearSession==='function'` |
| `setSession` | Gọi `setSession(mockUser, "token-abc")` | `status==='authenticated'`, `user===mockUser`, `accessToken==='token-abc'` |
| `clearSession` sau khi đã authenticated | `setState` giả lập authenticated trước | `status==='unauthenticated'`, `user===null`, `accessToken===null` |
| Không còn API cũ | — | `"login" in useAuthStore.getState()` → `false`; `"logout" in ...` → `false` (kiểm tra tường minh đã xóa, không chỉ tình cờ không dùng) |

### Hook tests (Test A–F, đúng §20 prompt gốc)

**Wrapper cho `renderHook`** (không dùng chung `renderWithProviders` vì đó thiết kế cho `render()`, không phải `renderHook()` — nhưng **tái dùng `createQueryClient()`** đã có từ M1, không tạo QueryClient logic mới):
```ts
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
);
```

| Test | File | MSW mock | Assert |
|---|---|---|---|
| **A — Login success** | `useLoginMutation.test.ts` | `POST /api/v1/auth/login` → 200, `AuthResponse` đầy đủ | `authStore.status==='authenticated'`; `authStore.user===response.user`; `authStore.accessToken===response.accessToken`; **`"refreshToken" in useAuthStore.getState()` → `false`** (proof có ý nghĩa: kiểm tra field này không tồn tại trong toàn bộ shape store, không phải chỉ giá trị `undefined` tình cờ) |
| **B — Login failure** | `useLoginMutation.test.ts` | 401 `INVALID_CREDENTIALS` | `authStore.status==='unauthenticated'` (không đổi từ initial); `user===null`; `accessToken===null` |
| **C — Register 409** | `useRegisterMutation.test.ts` | 409 `EMAIL_ALREADY_EXISTS` | `mutation.isError===true`; `authStore` không đổi (`status==='unauthenticated'`/initial) |
| **D — Register success** | `useRegisterMutation.test.ts` | 201, `RegisterResponse` | `mutation.isSuccess===true`; `authStore.status` **vẫn** là trạng thái ban đầu (không chuyển `authenticated`) — bằng chứng trực tiếp F2-D6 |
| **E — Logout success** | `useLogoutMutation.test.ts` | Setup: `authStore` authenticated trước; MSW 204 | `status==='unauthenticated'`, `user===null`, `accessToken===null` |
| **F — Logout failure** | `useLogoutMutation.test.ts` | Setup: authenticated trước; MSW 500 | `mutation.isError===true` (lỗi vẫn quan sát được); **đồng thời** `status==='unauthenticated'`, `user===null`, `accessToken===null` (test `onSettled` quan trọng nhất) |

**Về "không lưu `refreshToken` vào bất kỳ persistence mechanism nào":** đã verify bằng test A (field không tồn tại trong `authStore` state) — không tạo thêm assertion giả cho `localStorage`/`sessionStorage` vì `useLoginMutation` (Mục 9, M3.3) **không có bất kỳ dòng code nào** đọc/ghi 2 API này — assertion về việc "không dùng localStorage" sẽ là kiểm tra 1 implementation detail không tồn tại (đúng cảnh báo §20 prompt gốc: *"Do not create an artificial assertion against an implementation detail that does not exist"*) — review thủ công (đọc code) là đủ, không cần test giả.

### Infrastructure/Provider Registration Test (§21/§22 prompt gốc)

**Đã có sẵn từ M2, không cần thêm mới:** `features/auth/index.test.ts` (M2) đã có 3 test case chứng minh chính xác điều §21 yêu cầu — dùng spy thật trên `coordinateRefresh()` (không phải chỉ đếm `setRefreshHandler` được gọi) để verify handler đăng ký hoạt động đúng với `refresh` thật (gọi MSW, nhận đúng `accessToken`). M3 chỉ bổ sung 1 case nhỏ: verify 3 hook export đúng qua `@features/auth` (Mục 9, M3.6) — không lặp lại test registration.

**Provider registration exactly-once:** Theo đúng hướng dẫn §22 prompt gốc khi "không thể test có ý nghĩa ở mức milestone này mà không phụ thuộc chi tiết implementation" — module-level registration (`registerAuthInfrastructure()` gọi ở top-level `main.tsx`, không trong React component) tự nhiên đảm bảo "đúng 1 lần" vì module chỉ evaluate 1 lần khi app khởi động thật — không có React re-render nào ảnh hưởng. Test đếm "số lần gọi" ở đây sẽ brittle và vô nghĩa (đúng cảnh báo prompt). Thay vào đó: bằng chứng đã có (test M2 xác nhận cơ chế registration hoạt động đúng) + review thủ công `main.tsx` (chỉ 1 dòng gọi, không nằm trong loop/effect) là đủ.

---

## 12. Security Verification

| Mục kiểm tra | Kết quả M3 |
|---|---|
| `refreshToken` không lưu Zustand | ✅ — `useLoginMutation` chỉ truyền `data.user`/`data.accessToken` vào `setSession`; `AuthState` interface không có field `refreshToken` |
| `refreshToken` không lưu `localStorage`/`sessionStorage` | ✅ — không dòng code nào trong `features/auth/hooks/*` gọi 2 API này (review thủ công + không cần test giả, xem Mục 11) |
| `refreshToken` không bị log | ✅ — không có `console.log`/`console.error` nào trong 3 hook mới truyền `data`/`data.refreshToken` |
| `refreshToken` không bị copy vào biến tạm | ✅ — `useLoginMutation`'s `onSuccess: (data) => {...}` chỉ đọc `data.user`/`data.accessToken`, không destructure `refreshToken` ở bất kỳ dòng nào |
| Access token chỉ theo cơ chế đã duyệt | ✅ — `setSession` ghi vào `authStore.accessToken` (in-memory, đúng kiến trúc F1/M1 đã chốt) — không có persistence mới |
| Logout clear session cả khi server fail | ✅ — `onSettled` (M3.5), có Test F chứng minh |
| Refresh registration dùng handler thật | ✅ — đã CLOSED ở M2, verify lại (M3.1), không cần refresh-token argument thủ công nào trong M3 |
| Không có coordinator thứ 2 | ✅ — M3 không tạo file coordinator nào, chỉ dùng `shared/api/auth-refresh-coordinator.ts` có sẵn |

---

## 13. Decision Log

| ID | Decision | Direction | Evidence |
|---|---|---|---|
| M3-D1 | `useLoginMutation` không destructure `refreshToken` | **YES — bắt buộc** | Mục 9 (M3.3), Mục 12 |
| M3-D2 | `registerAuthInfrastructure()` đăng ký ở đâu? | **Module-level, đã CLOSED ở M2** — không phải quyết định của M3 nữa; M3 chỉ verify, không chọn lại giữa 3 phương án (module-level/effect/provider body) vì lựa chọn đã được thực hiện và đã đúng | Mục 1, Mục 2 |
| M3-D3 | `useLogoutMutation` có tự navigate không? | **NO** | Mục 9 (M3.5) — route guard (`ProtectedRoute`, đã có từ F1) tự phản ứng theo `authStore.status`, hook không điều hướng |
| M3-D4 | `authStore` có đổi gì ngoài `setSession`/`clearSession` không? | **NO** | Mục 9 (M3.2) — chỉ thêm đúng 2 action + 1 type `AuthUser`, không thêm gì khác |
| M3-D5 | `registerAuthInfrastructure()` có cần idempotent không? | **Đã CLOSED ở M2** — `setRefreshHandler()` chỉ gán lại biến, gọi lại vô hại; M2 đã có test "safe to call multiple times" xác nhận | Mục 1 |
| M3-D6 (mới, M3 tự phát sinh) | `authStore`'s `AuthUser` type định nghĩa ở đâu? | Định nghĩa **cục bộ trong `authStore.ts`**, không import `UserResponse` từ `features/auth/api/types.ts` | Mục 9 (M3.2) — tránh `shared → features/auth`; 2 type trùng cấu trúc, TypeScript structural typing tự tương thích, không cần adapter |

---

## 14. Open Questions & Resolutions

Đối chiếu 7 câu hỏi §29 prompt gốc — tất cả được giải quyết bằng bằng chứng thật, không câu nào còn để ngỏ:

| # | Câu hỏi | Trả lời |
|---|---|---|
| 1 | Coordinator cần đăng ký trước `QueryProvider` không? | Không liên quan tới thứ tự — `registerAuthInfrastructure()` (đăng ký handler) và `QueryClientProvider` (React tree) là 2 cơ chế độc lập hoàn toàn (module-level side-effect vs. React render) — thứ tự hiện tại (`main.tsx` gọi đăng ký trước `createRoot().render()`, `QueryClientProvider` nằm trong cây React render sau đó) đã đúng và không cần đổi |
| 2 | Kiến trúc provider hiện tại có hỗ trợ module-level init sạch không? | **Có** — `main.tsx` đã chứng minh điều này từ M2 (registration hoạt động đúng, có test) |
| 3 | `authStore` có consumer nào phụ thuộc `bootstrapAuthResolution` giả không? | **Có 1** — `main.tsx` (Mục 2) — xử lý ở M3.7 |
| 4 | Có test nào giả định `login()`/`logout()` là store action không? | **Có** — `authStore.test.ts` (5 test) — xử lý bằng rewrite hoàn toàn (M3.9) |
| 5 | Có code nào import `features/auth/api/*` trực tiếp, xung đột ranh giới public API? | **Không** — grep xác nhận (Mục 2 điểm 17, và grep toàn repo Mục 2) chỉ `index.ts` import `./api/refresh`; không nơi nào khác import `features/auth/api/*` |
| 6 | Có code nào log/lưu `refreshToken` hiện tại? | **Không** — `login.ts`/`refresh.ts` (M2) trả `AuthResponse` đầy đủ nhưng không nơi nào (trước M3) tiêu thụ field này theo cách lưu/log — M3 tiếp tục giữ vậy |
| 7 | Global `onError` của M1 QueryClient có trùng lặp báo lỗi với mutation hook không? | **Không** — `queryClient.ts` (M1) chỉ gọi `reportError` khi `errorCode` KHÔNG nằm trong `error-messages.ts` (lỗi không xác định); `INVALID_CREDENTIALS`/`EMAIL_ALREADY_EXISTS`/`UNAUTHORIZED` đều đã có trong dictionary → không bị `reportError` gọi trùng; hook M3 cũng không tự gọi `reportError` — không có double-report |

---

## 15. Risk Register

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| `refreshToken` bị vô tình lưu | Critical | Thấp (đã thiết kế tránh từ đầu) | Review thủ công + Test A (Mục 11) |
| `authStore` còn sót hành vi bootstrap giả | High | Thấp | `npm run typecheck`/`build` sẽ tự bắt nếu sót (M3.2/M3.7 đồng bộ) |
| Logout chỉ clear khi thành công | High | Thấp (thiết kế `onSettled` từ đầu) | Test F |
| Đăng ký refresh trùng lặp | High | **Không áp dụng** — đã CLOSED ở M2, có test | — |
| `shared → feature` dependency regression | Critical | Thấp | Grep thủ công (Mục 7), không file `shared/*` nào bị sửa ở M3 |
| Export trực tiếp `api/*` phá vỡ ranh giới feature | Medium | Thấp | `index.ts` review (Mục 9, M3.6) |
| QueryClient/provider bị nhân đôi | High | Thấp | M3 không tạo `QueryClientProvider`/`QueryClient` mới — chỉ tái dùng `createQueryClient()` cho test wrapper |
| Test cũ phụ thuộc store API cũ | Medium | **Chắc chắn xảy ra nếu không xử lý** | `authStore.test.ts` rewrite hoàn toàn (M3.9) — đã xác nhận cụ thể 5 test bị ảnh hưởng (Mục 2) |

---

## 16. Acceptance Criteria

### authStore
- [ ] `bootstrapAuthResolution()` đã xóa hoàn toàn khỏi `authStore.ts`
- [ ] Không còn `setTimeout` giả lập nào trong `authStore.ts`
- [ ] `setSession(user, accessToken)` tạo trạng thái `authenticated` đúng
- [ ] `clearSession()` tạo trạng thái `unauthenticated` đúng
- [ ] `user`/`accessToken` được clear đúng (không sót giá trị cũ)
- [ ] Không có store Zustand thứ 4 nào được tạo

### Login
- [ ] `useLoginMutation` bọc đúng hàm `login` có sẵn
- [ ] Login thành công cập nhật `authStore`
- [ ] Login thất bại không authenticate người dùng
- [ ] `refreshToken` không bị lưu/log/copy không cần thiết ở bất kỳ đâu

### Register
- [ ] `useRegisterMutation` bọc đúng `register`
- [ ] Đăng ký thành công KHÔNG authenticate
- [ ] Đăng ký thất bại KHÔNG đổi `authStore`

### Logout
- [ ] `useLogoutMutation` bọc đúng `logout`
- [ ] Thành công → clear session
- [ ] Thất bại → **vẫn** clear session
- [ ] Lỗi mutation vẫn quan sát được bởi caller

### Infrastructure (đã CLOSED ở M2 — verify lại, không implement lại)
- [ ] `registerAuthInfrastructure()` tồn tại (✅ từ M2)
- [ ] `refresh` thật đã đăng ký vào coordinator M1 (✅ từ M2)
- [ ] `shared` layer vẫn feature-agnostic (✅ verify lại bằng grep, M3 không phá vỡ)
- [ ] Provider startup đăng ký đúng 1 lần (✅ từ M2, `main.tsx` không đổi dòng này)
- [ ] Đăng ký xảy ra trước khi M4's session bootstrap phụ thuộc vào nó (✅ — đăng ký ở module scope, chạy trước mọi thứ khác)

### Public API
- [ ] 3 hook được export qua `features/auth/index.ts`
- [ ] `registerAuthInfrastructure()` vẫn được export (không đổi)
- [ ] `api/*` không được export trực tiếp cho consumer ngoài

### Tests
- [ ] Login success MSW test
- [ ] Login failure MSW test
- [ ] Register success test
- [ ] Register 409 test
- [ ] Logout success test
- [ ] Logout failure/`onSettled` test
- [ ] Refresh-handler registration test (✅ đã có từ M2, xác nhận vẫn pass)
- [ ] Provider registration behavior đã verify phù hợp (module-level, không cần test đếm render — Mục 11)
- [ ] Không có `refreshToken` leakage (test + review)

---

## 17. Exit Criteria

```
✓ npm run typecheck   — pass
✓ npm run lint        — pass
✓ npm run format:check — pass
✓ npm run test        — toàn bộ pass (bao gồm regression F1/M1/M2)
✓ Không console.log/debug leakage
✓ Không TODO/FIXME mới không phân loại
✓ Không refreshToken leakage
✓ Không vi phạm shared → feature dependency
✓ authStore fake behavior đã xóa hoàn toàn
✓ Registration boundary đã verify (không cần implement lại)
✓ Toàn bộ test F1/M1/M2 vẫn xanh
✓ Không có logic M4 nào bị implement (session bootstrap, single-flight, retry, interceptor)
✓ Implementation khớp đúng kiến trúc repo thật
```

---

## 18. Verification Commands

Đọc trực tiếp `frontend/package.json` — không phát minh lệnh mới:

```bash
npm run lint            # eslint .
npm run typecheck       # tsc --noEmit
npm run format:check    # prettier --check .
npm run test            # vitest run --passWithNoTests
npm run test:coverage   # vitest run --coverage --passWithNoTests
npm run build           # tsc --noEmit && vite build
```

**Dependency direction (thủ công, không có script tự động — `eslint-plugin-boundaries` chưa kích hoạt, đúng như M1/M2 đã ghi nhận):**
```bash
grep -rn "from [\"']@features" frontend/src/shared/     # phải rỗng
grep -rln "authStore" frontend/src/features/auth/api/   # phải rỗng
grep -rn "login\|logout" frontend/src/shared/api/client.ts  # phải rỗng (đã xác nhận rỗng từ M2)
```

---

## 19. Final Architect Review

| # | Câu hỏi | YES/NO | Evidence | Action |
|---|---|---|---|---|
| 1 | M2 API layer đã inspect thật? | YES | Mục 2 (điểm 2-5), đọc trực tiếp | — |
| 2 | `AuthResponse` đã inspect thật? | YES | Mục 8, từ `features/auth/api/types.ts` thật | — |
| 3 | `refreshToken` handling đã verify tường minh? | YES | Mục 12, M3-D1 | — |
| 4 | `authStore` implementation hiện tại đã inspect? | YES | Mục 2 điểm 6, nguyên văn code | — |
| 5 | Hành vi bootstrap giả đã xác định vị trí? | YES | Mục 2, Mục 9 (M3.2) | — |
| 6 | `setSession()` semantics khớp shape store thật? | YES | Mục 9 (M3.2) — dùng đúng field `status`/`accessToken`/`user` có sẵn | — |
| 7 | `clearSession()` semantics khớp shape store thật? | YES | Mục 9 (M3.2) | — |
| 8 | `useLoginMutation` chỉ ghi `user`+`accessToken`? | YES | Mục 9 (M3.3), không dòng nào chạm `refreshToken`/`expiresIn` | — |
| 9 | `useRegisterMutation` không bao giờ authenticate? | YES | Mục 9 (M3.4), không `onSuccess` | — |
| 10 | `useLogoutMutation` dùng `onSettled`? | YES | Mục 9 (M3.5) | — |
| 11 | M1 coordinator đã inspect? | YES | Mục 2 điểm 8, nguyên văn code | — |
| 12 | `setRefreshHandler` contract thật đã verify? | YES | Mục 2 điểm 9-10 | — |
| 13 | `registerAuthInfrastructure()` dùng `refresh` thật? | YES | Mục 1, Mục 2 — **đã CLOSED ở M2**, verify lại xác nhận đúng | — |
| 14 | Provider registration xảy ra đúng 1 lần? | YES | Mục 2 (`main.tsx` module-level, không trong loop/effect) | — |
| 15 | Đăng ký xảy ra trước M4 bootstrap? | YES | Trivial — M4 chưa tồn tại, registration đã chạy từ module load | — |
| 16 | Không có `shared → features/auth` mới? | YES | Mục 7, grep xác nhận M3 không sửa file `shared/*` nào ngoài không-có | — |
| 17 | Không có QueryClient thứ 2? | YES | M3 không tạo `QueryClient`/`QueryClientProvider` nào — chỉ tái dùng `createQueryClient()` cho test wrapper | — |
| 18 | Không có auth store thứ 2? | YES | M3 chỉ sửa `authStore.ts` có sẵn, không tạo store mới | — |
| 19 | Public auth exports không lộ `api/*`? | YES | Mục 9 (M3.6) | — |
| 20 | Test dùng hạ tầng MSW/provider có sẵn? | YES | Mục 11 — tái dùng `msw-server.ts`, `createQueryClient()` | — |
| 21 | M3 không implement chức năng M4? | YES | Mục 6 (Non-Goals) — không session bootstrap/retry/single-flight/interceptor | — |
| 22 | M3 không implement Login/Register UI? | YES | Mục 6 | — |
| 23 | Mọi Open Question đã giải quyết hoặc deferred tường minh? | YES | Mục 14 — cả 7 câu đều có câu trả lời cụ thể | — |
| 24 | Mọi Acceptance Criteria có đường verify thực thi được? | YES | Mục 16 — mỗi mục đều gắn với test/lệnh cụ thể ở Mục 11/18 | — |
| 25 | Plan khả thi cho 1 developer? | YES | 10 sub-step (M3.1-M3.7, M3.9-M3.10 — M3.8 gộp vào M3.7), mỗi bước 1-2 file | — |

Không có câu nào NO. Plan sẵn sàng.

---

## 20. Developer Execution Checklist

- [ ] M3.1 — Xác nhận HEAD, đọc lại 18 điểm Mục 2
- [ ] M3.2 — Sửa `authStore.ts`: xóa `login`/`logout`/`bootstrapAuthResolution`, thêm `AuthUser`/`setSession`/`clearSession`
- [ ] M3.3 — Tạo `useLoginMutation.ts`
- [ ] M3.4 — Tạo `useRegisterMutation.ts`
- [ ] M3.5 — Tạo `useLogoutMutation.ts`
- [ ] M3.6 — Sửa `index.ts`: thêm 3 export hook
- [ ] M3.7 — Sửa `main.tsx`: xóa import/gọi `bootstrapAuthResolution()`
- [ ] M3.9 — Viết lại `authStore.test.ts`; tạo test cho 3 hook; bổ sung `index.test.ts`
- [ ] M3.10 — Chạy đủ 6 lệnh Mục 18 + 3 lệnh grep dependency direction
- [ ] Đối chiếu Mục 16 (Acceptance) và Mục 17 (Exit) — tất cả `[x]`
- [ ] Xác nhận không milestone nào của M4 bị lẫn vào (Mục 6)

**Trạng thái: READY FOR IMPLEMENTATION.**
