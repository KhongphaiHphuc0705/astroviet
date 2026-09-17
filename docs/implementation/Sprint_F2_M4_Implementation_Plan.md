# Sprint F2 — M4 Implementation Plan
## Session Bootstrap

---

## ⚠️ Phát hiện kiến trúc quan trọng nhất (đọc trước khi xem phần còn lại)

Đọc trực tiếp code thật tại `dev` HEAD `ca43f4d` (không suy diễn từ prompt), phát hiện **3 điểm sai lệch thật** giữa giả định của prompt gốc và thực tế repo — theo đúng nguyên tắc §22 ("Do not silently assume the prompt is more accurate than the repository"), cả 3 đều được xử lý tường minh trong plan này, không âm thầm bỏ qua:

### Sai lệch 1 — Coordinator/handler hiện tại KHÔNG cập nhật `authStore` khi refresh thành công/thất bại

Prompt gốc (Mục 5, comment trong snippet mẫu) giả định: *"coordinator đã tự `clearSession()` bên trong"*. Đọc trực tiếp `auth-refresh-coordinator.ts` + `features/auth/index.ts` + `shared/api/client.ts` xác nhận **điều này SAI**:

```ts
// features/auth/index.ts — HIỆN TẠI
export function registerAuthInfrastructure(): void {
  setRefreshHandler(async () => {
    const result = await refresh();
    return result.accessToken;   // ← chỉ trả về string, KHÔNG đụng authStore
  });
}
```

`coordinateRefresh()` (generic, đúng thiết kế M1) không biết `authStore` tồn tại. `client.ts`'s interceptor gọi `coordinateRefresh<string>()` chỉ để lấy token mới gắn vào header retry — **không** cập nhật `authStore`. Kết quả: nếu `useSessionBootstrap()` chỉ đơn thuần gọi `coordinateRefresh().catch(() => {})` đúng như snippet mẫu của prompt, `authStore.status` sẽ **mãi mãi kẹt ở `resolving`** kể cả khi refresh thành công thật — vì không có gì transition nó sang `authenticated`.

**Xử lý:** M4 phải sửa `registerAuthInfrastructure()` (file đã tồn tại từ M2) để handler tự gọi `setSession()`/`clearSession()` — đây là nơi hợp lý duy nhất (đã có sẵn cả `AuthResponse` đầy đủ lẫn quyền truy cập `authStore`, không vi phạm dependency direction vì `features/auth → shared/stores` là chiều hợp lệ). Sau khi sửa, **cả 2 luồng** (bootstrap M4 lẫn refresh giữa phiên qua `client.ts` interceptor, M1/M2) đều tự động được cập nhật `authStore` đúng — không cần sửa gì thêm ở `client.ts`.

### Sai lệch 2 — KHÔNG cần "RouterProvider rendering gate" mới

Prompt gốc (Mục 7, Mục 17) giả định cần 1 cơ chế mới (ví dụ `AuthBootstrapGate`) để chặn `RouterProvider` render khi `status==='resolving'`. Đọc trực tiếp `ProtectedRoute.tsx`/`GuestRoute.tsx` xác nhận: **cơ chế này đã tồn tại từ F1**, ở đúng cấp route guard, không phải cấp provider:

```tsx
// ProtectedRoute.tsx (F1, không đổi)
if (status === "resolving") {
  return <Spinner ... label="Đang xác thực..." />;
}
```
```tsx
// GuestRoute.tsx (F1, không đổi)
if (status === "resolving") {
  return <Spinner ... label="Đang tải..." />;
}
```

Đối chiếu `router.tsx`: mọi route quan tâm tới auth status (`/login`, `/register` qua `GuestRoute`; `/app` qua `ProtectedRoute`) đều đã được bọc đúng. Route công khai (`/`, catch-all) không cần quan tâm auth status — render ngay là đúng hành vi.

**Kết luận:** `RouterProvider` **có thể** render ngay lập tức sau `useSessionBootstrap()` — không cần gate mới, không cần `AuthBootstrapGate`, không cần sửa `App.tsx`'s cấu trúc JSX ngoài việc thêm 1 dòng gọi hook.

### Sai lệch 3 — File cần sửa là `app/App.tsx`, không phải file trong `app/providers/`

Prompt gốc (Mục 4/17) giả định file cần sửa nằm "dưới `frontend/src/app/providers/`". Đọc trực tiếp: `app/providers/` **chỉ chứa `ThemeProvider.tsx`** (1 provider component tái sử dụng, không phải nơi compose gốc). Nơi thực sự compose toàn bộ cây provider + gọi hook cấp cao nhất là `frontend/src/app/App.tsx` — file này nằm **ngoài** thư mục `providers/`, là cha của nó.

---

## 1. Executive Summary

**Milestone:** F2 M4 — Session Bootstrap
**Objective:** Khởi tạo phiên đăng nhập lúc app start bằng cách gọi `coordinateRefresh()` (M1) đúng 1 lần, không dùng TanStack Query, tái sử dụng toàn bộ hạ tầng đã CLOSED (M1-M3).
**Current dependencies:** F1 (CLOSED), F2 M1-M3 (CLOSED, verify độc lập 4 lượt liên tiếp không lỗi).
**Expected outcome:** `authStore.status` chuyển đúng từ `resolving` sang `authenticated`/`unauthenticated` sau khi app khởi động, dựa trên cookie `refreshToken` thật (nếu có); không có refresh loop; không có refresh kép khi có nhiều request 401 đồng thời lúc khởi động.
**Scope boundaries:** Chỉ Session Bootstrap — không Login/Register/Logout UI, không redesign coordinator/authStore/routing.

---

## 2. Repository Preconditions

Xác nhận cụ thể (không lặp lại tài liệu, đọc trực tiếp code — HEAD `ca43f4d`):

| Từ | Cụ thể | Trạng thái |
|---|---|---|
| F1 | `ProtectedRoute.tsx`, `GuestRoute.tsx` (đọc `status`, xử lý `resolving` bằng Spinner) | ✅ Xác nhận, không đổi |
| F2 M1 | `shared/api/auth-refresh-coordinator.ts`: `setRefreshHandler<T>()`, `coordinateRefresh<T>()`, `__resetRefreshCoordinatorForTests()` | ✅ Xác nhận nguyên văn |
| F2 M1 | `shared/api/client.ts`: `AUTH_REFRESH_ENDPOINT`, `isRefreshRequest()`, interceptor 401 gọi `coordinateRefresh<string>()` | ✅ Xác nhận nguyên văn |
| F2 M1 | `shared/api/queryClient.ts`: export `queryClient` (singleton) + `createQueryClient()` (factory, dùng trong test) | ✅ Xác nhận |
| F2 M2 | `features/auth/api/refresh.ts`: `refresh(): Promise<AuthResponse>` — raw call, không side-effect | ✅ Xác nhận |
| F2 M2 | `features/auth/index.ts`: `registerAuthInfrastructure()` — **hiện chỉ trả `accessToken`, không cập nhật `authStore`** | ⚠️ Cần sửa (Sai lệch 1) |
| F2 M3 | `shared/stores/authStore.ts`: `{status, accessToken, user: AuthUser\|null, setSession(user,accessToken), clearSession()}` | ✅ Xác nhận nguyên văn |
| F2 M3 | `features/auth/index.ts` export `useLoginMutation`/`useRegisterMutation`/`useLogoutMutation` | ✅ Xác nhận |

**Không có precondition nào chưa thỏa mãn** — Sai lệch 1 là **việc cần làm ở M4**, không phải blocker chặn M4 bắt đầu.

---

## 3. Existing Architecture Relevant to M4

```
shared/stores/authStore.ts
  status: "resolving" | "authenticated" | "unauthenticated"  (khởi tạo "resolving")
  accessToken: string | null
  user: AuthUser | null
  setSession(user, accessToken) / clearSession()

shared/api/auth-refresh-coordinator.ts
  setRefreshHandler<T>(handler: () => Promise<T>): void
  coordinateRefresh<T>(): Promise<T>   — single-flight, 0 import, không biết auth

shared/api/client.ts
  apiClient (Axios instance)
  AUTH_REFRESH_ENDPOINT = "/api/v1/auth/refresh"
  isRefreshRequest()
  response interceptor: 401 (không phải chính /refresh) → coordinateRefresh<string>() → retry 1 lần

features/auth/api/refresh.ts
  refresh(): Promise<AuthResponse>   — POST /api/v1/auth/refresh, body {}

features/auth/index.ts
  registerAuthInfrastructure(): void   — setRefreshHandler(async () => (await refresh()).accessToken)
  export { useLoginMutation, useRegisterMutation, useLogoutMutation }

app/routing/ProtectedRoute.tsx, GuestRoute.tsx
  đọc authStore.status — tự xử lý "resolving" (Spinner), "authenticated"/"unauthenticated" (Outlet/Navigate)

app/router.tsx
  "/" (public), "/login"+"/register" (GuestRoute), "/app" (ProtectedRoute), "*" (NotFound)

app/App.tsx
  StrictMode > ThemeProvider > QueryClientProvider > RouterProvider

main.tsx
  registerAuthInfrastructure() (module scope) → createRoot().render(<App/>)
```

**Dependency direction (đối chiếu §23 prompt gốc):**

```
features/auth/hooks/useSessionBootstrap   (MỚI)
        ↓
shared/api/auth-refresh-coordinator (coordinateRefresh)
        ↑ (đã đăng ký từ trước bởi)
features/auth/index.ts (registerAuthInfrastructure, SỬA)
        ↓
features/auth/api/refresh
        ↓ (side-effect mới, SỬA)
shared/stores/authStore (setSession/clearSession)
```

`shared/api/*` (coordinator, client) **không** import `features/auth/*` ở bất kỳ đâu — xác nhận qua code đọc trực tiếp (Mục 2). M4 không tạo quan hệ `shared → features` mới.

---

## 4. Session Bootstrap State Machine

```
App khởi động
    ↓
authStore.status = "resolving"   (giá trị khởi tạo có sẵn, không đổi)
    ↓
main.tsx: registerAuthInfrastructure()   (đã CLOSED từ M2, không đổi vị trí gọi)
    ↓
App() render lần đầu → useSessionBootstrap() chạy (useEffect, chạy sau render đầu)
    ↓
coordinateRefresh<string>()   (gọi handler đã đăng ký — nay sẽ tự cập nhật authStore, xem Mục 5)
    ↓
 ┌─────────────────────────┐
 │                         │
thành công               thất bại (401/network/không có cookie)
 │                         │
 ↓                         ↓
handler tự setSession()   handler tự clearSession()
 ↓                         ↓
status = "authenticated"  status = "unauthenticated"
    ↓                         ↓
    └────────────┬────────────┘
                 ↓
    ProtectedRoute/GuestRoute (đã có từ F1) tự phản ứng đúng theo status mới
    — không cần RouterProvider chờ gì cả (Sai lệch 2)
```

**Route rendering condition (không phải "RouterProvider chờ"):**
- `status==="resolving"` → route được bọc `ProtectedRoute`/`GuestRoute` hiện Spinner; route công khai (`/`) hiện bình thường ngay.
- `status==="authenticated"`/`"unauthenticated"` → route guard hiện đúng nội dung/redirect.

---

## 5. Detailed File Changes

### `frontend/src/features/auth/hooks/useSessionBootstrap.ts` (CREATE)

- **Responsibility:** Gọi `coordinateRefresh()` đúng 1 lần lúc app khởi động (qua `useEffect([])`), không xử lý gì thêm.
- **Imports:** `useEffect` (react), `coordinateRefresh` (`@shared/api/auth-refresh-coordinator`).
- **Implementation:**
  ```ts
  import { useEffect } from "react";

  import { coordinateRefresh } from "@shared/api/auth-refresh-coordinator";

  export const useSessionBootstrap = (): void => {
    useEffect(() => {
      coordinateRefresh().catch(() => {
        // Handler đăng ký qua registerAuthInfrastructure() đã tự clearSession()
        // bên trong (xem features/auth/index.ts) — không cần xử lý gì thêm ở đây.
      });
    }, []);
  };
  ```
- **Forbidden:** `useMutation`/`useQuery`; gọi `clearSession()`/`setSession()` trực tiếp; `navigate()`; toast; `useRef` cờ chống StrictMode; import `authStore` (hook này không cần biết `authStore` tồn tại — chỉ gọi coordinator).

### `frontend/src/features/auth/index.ts` (MODIFY — sửa Sai lệch 1)

- **Responsibility:** Handler đăng ký giờ có 2 side-effect: cập nhật `authStore` VÀ trả `accessToken` cho `client.ts` dùng.
- **Imports thêm:** `useAuthStore` (`@shared/stores/authStore`).
- **Implementation:**
  ```ts
  export function registerAuthInfrastructure(): void {
    setRefreshHandler(async () => {
      try {
        const result = await refresh();
        useAuthStore.getState().setSession(result.user, result.accessToken);
        return result.accessToken;
      } catch (error) {
        useAuthStore.getState().clearSession();
        throw error;
      }
    });
  }
  ```
- **Vì sao sửa ở đây, không phải trong `useSessionBootstrap`:** `client.ts`'s interceptor (refresh giữa phiên) và `useSessionBootstrap` (refresh lúc khởi động) **dùng chung 1 handler đã đăng ký** — sửa tại nguồn duy nhất này đảm bảo cả 2 luồng đều nhất quán, không cần viết lại logic 2 lần.
- **Dependency direction:** `features/auth/index.ts → shared/stores/authStore` — hợp lệ (`features → shared`).
- **Forbidden:** Không đổi chữ ký `registerAuthInfrastructure()` (vẫn `(): void`, vẫn không nhận tham số); không đổi hành vi `client.ts` dùng — `coordinateRefresh<string>()` vẫn nhận đúng `string` như trước (handler vẫn `return result.accessToken`).

### `frontend/src/app/App.tsx` (MODIFY — không phải file trong `providers/`, xem Sai lệch 3)

- **Responsibility:** Gọi `useSessionBootstrap()` ở top-level component, trước khi render cây provider.
- **Implementation:**
  ```tsx
  export default function App() {
    useSessionBootstrap();

    return (
      <StrictMode>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </ThemeProvider>
      </StrictMode>
    );
  }
  ```
- **Không tạo file provider mới, không tạo `AuthBootstrapGate`, không đổi cấu trúc JSX ngoài 1 dòng gọi hook.**
- **`frontend/src/app/providers/` không có file nào bị sửa** — `ThemeProvider.tsx` không liên quan.

### Test files (CREATE, co-located)

```
features/auth/hooks/useSessionBootstrap.test.ts        — Test A, B (unit-level, mock coordinator)
features/auth/hooks/useSessionBootstrap.integration.test.tsx  — Race test + Router rendering order test
features/auth/index.test.ts (MODIFY)                    — bổ sung case: handler tự setSession/clearSession
```

---

## 6. Detailed Implementation Steps

### M4-1 — Xác nhận contract coordinator (đã làm khi lập plan, dev thực thi re-verify)
`git log -3`; đọc lại `auth-refresh-coordinator.ts`, `client.ts`, `features/auth/index.ts`, `authStore.ts` — xác nhận khớp Mục 2/3.

### M4-2 — Sửa `registerAuthInfrastructure()` (Sai lệch 1)
Thêm `setSession`/`clearSession` vào handler (Mục 5). **Làm trước `useSessionBootstrap`** vì `useSessionBootstrap`'s test (Test A/B) cần hành vi này đúng để assert `authStore` transition.

### M4-3 — Implement `useSessionBootstrap`
Tạo file theo Mục 5.

### M4-4 — Tích hợp vào `App.tsx`
Thêm `useSessionBootstrap()` (Mục 5) — **không** sửa gì trong `app/providers/`.

### M4-5 — Router rendering: xác nhận không cần gate mới (Sai lệch 2)
Không có code thay đổi ở bước này — đây là bước **xác nhận bằng test** (Mục 9, "Router Rendering Order Test"), không phải bước implement.

### M4-6 — Test A/B (unit-level `useSessionBootstrap`)
Viết `useSessionBootstrap.test.ts`.

### M4-7 — Test `registerAuthInfrastructure` mở rộng
Bổ sung `index.test.ts`: handler mới phải tự `setSession`/`clearSession` (không chỉ trả token).

### M4-8 — Race condition integration test (quan trọng nhất)
Viết `useSessionBootstrap.integration.test.tsx` — kịch bản Mục 9.

### M4-9 — Router Rendering Order integration test
Cùng file với M4-8 (Mục 9) — verify `ProtectedRoute` phản ứng đúng khi bootstrap thật chạy.

### M4-10 — Verification & cleanup
Chạy đủ Mục 18; grep dependency direction; đối chiếu Acceptance/Exit Criteria.

---

## 7. Testing Strategy

| Loại | File | Mục đích |
|---|---|---|
| Unit | `useSessionBootstrap.test.ts` | Verify hook gọi đúng `coordinateRefresh` 1 lần lúc mount, không dùng TanStack Query, xử lý success/failure đúng (dựa trên `authStore` cuối cùng, không mock sâu implementation) |
| Unit (mở rộng) | `index.test.ts` | Verify `registerAuthInfrastructure`'s handler mới tự `setSession`/`clearSession` |
| Integration — Race | `useSessionBootstrap.integration.test.tsx` | Chứng minh **đúng 1 lần** `/refresh` thật khi bootstrap + 2 request 401 đồng thời — không unit-test coordinator lại (đã làm ở M1), mà verify tại biên tích hợp thật |
| Integration — Router order | `useSessionBootstrap.integration.test.tsx` | Chứng minh `ProtectedRoute` hiện Spinner khi `resolving`, hiện đúng nội dung sau khi bootstrap thật resolve — dựa trên cơ chế CÓ THẬT (route guard), không dựng abstraction giả |
| Regression | Toàn bộ suite F1/M1/M2/M3 | Không có test nào bị phá vỡ bởi thay đổi ở `registerAuthInfrastructure`/`App.tsx` |

---

## 8. MSW Design

| Handler | Endpoint | Hành vi |
|---|---|---|
| Refresh thành công | `POST /api/v1/auth/refresh` | 200, `AuthResponse` đầy đủ; đếm số lần gọi qua biến đóng (closure counter) trong test |
| Refresh thất bại | `POST /api/v1/auth/refresh` | 401 `UNAUTHORIZED` (không có cookie hợp lệ) |
| Mock "protected resource" (chỉ dùng cho test race, KHÔNG phải endpoint thật của app — vì Frontend hiện chưa có tính năng nào ngoài Auth) | `GET /api/v1/mock-protected` (2 endpoint tùy ý, ví dụ `/mock-protected-1`, `/mock-protected-2`) | Lần gọi đầu (chưa có `Authorization` mới) → 401; lần gọi lại (sau khi interceptor retry với token mới) → 200 |

**Ghi chú minh bạch:** endpoint `mock-protected-*` không tồn tại trong app thật — đây là fixture test thuần túy để mô phỏng "2 request bình thường nhận 401 đồng thời", vì Frontend chưa có tính năng nào khác ngoài Auth để dùng làm ví dụ thật (Birth Profile/Chart UI chưa tồn tại). Không phát minh route thật nào trong `router.tsx`.

---

## 9. Race Condition Test Design

```
T0  app khởi động (test: render <App/> tối giản, hoặc gọi trực tiếp registerAuthInfrastructure()
    + renderHook(useSessionBootstrap) + 2 lời gọi apiClient.get() song song trong cùng 1 `act()`)
T1  registerAuthInfrastructure() đã chạy (test setup, trước khi render)
T2  useSessionBootstrap() mount → gọi coordinateRefresh() lần 1 (từ bootstrap)
T3  Đồng thời: 2 lời gọi apiClient.get("/mock-protected-1"), apiClient.get("/mock-protected-2")
T4  Cả 2 request nhận 401 (MSW mock) → interceptor mỗi request tự gọi coordinateRefresh() lần 2, lần 3
T5  Coordinator: lần gọi đầu tiên (T2) đã tạo `inFlight` Promise — lần 2 (T4a)/lần 3 (T4b) dùng lại
    CÙNG Promise đó (single-flight, M1, không đổi)
T6  MSW handler `/refresh` chỉ thực sự nhận request 1 LẦN — biến đếm tăng lên 1
T7  `/refresh` trả 200 sau độ trễ giả lập (ví dụ `await delay(50)` trong MSW handler, đảm bảo
    T3 kịp xảy ra trước khi T2 resolve — đây là điều kiện bắt buộc để test có ý nghĩa, không phải
    race giả)
T8  Handler (đã sửa, Mục 5) tự setSession() → authStore.status = "authenticated"
T9  2 request mock-protected tự động retry (client.ts, không đổi) với token mới → nhận 200
T10 assert: đếm số lần MSW `/refresh` được gọi === 1
T11 assert: 2 request mock-protected đều resolve thành công (không reject)
T12 assert: authStore.status === "authenticated" ở cuối
```

**Không tạo coordinator giả, không bypass coordinator thật** — toàn bộ test dùng `coordinateRefresh`/`registerAuthInfrastructure`/`apiClient` thật, chỉ mock ở biên MSW (đúng yêu cầu §10 prompt gốc).

---

## 10. Error Handling

| Việc | Ai sở hữu |
|---|---|
| Refresh thất bại (401/network) | `registerAuthInfrastructure()`'s handler — tự `clearSession()`, tự `throw` lại để `coordinateRefresh()` reject |
| `authStore` transition | Handler (M4 sửa), không phải `useSessionBootstrap`, không phải `client.ts` |
| Lỗi API khác (không phải refresh) | Không đổi — vẫn `ApiError` (M1), vẫn propagate qua `mutation.error` cho hook nào gọi |
| Lỗi không lường trước trong `useSessionBootstrap` | `.catch(() => {})` nuốt lỗi có chủ đích — đây là lỗi ĐÃ ĐƯỢC XỬ LÝ (handler đã `clearSession`), không phải lỗi ẩn cần `reportError`. Không gọi `reportError` trong hook này (đúng §15 prompt gốc — coordinator/handler sở hữu semantics thất bại, không phải "unexpected application error") |

---

## 11. Security Considerations

| Mục | Xác nhận |
|---|---|
| Refresh token vẫn HttpOnly | ✅ Không đổi — M4 không chạm cookie config |
| Refresh token không vào JS | ✅ `refresh()` (M2) không đổi, vẫn không đọc/set cookie; `registerAuthInfrastructure`'s handler chỉ dùng `result.user`/`result.accessToken`, không chạm `result.refreshToken` |
| Không log token | ✅ Không có `console.log` nào trong `useSessionBootstrap`/`registerAuthInfrastructure` sửa đổi |
| Không token exposure trong test | ✅ Test dùng giá trị giả (`"fake-access-token"`) theo đúng convention M3 đã thiết lập |
| Không refresh kép | ✅ Test race (Mục 9) chứng minh bằng số đếm thật, không suy luận |
| Không refresh loop | ✅ `_retry` flag (M1) + single-flight (M1) không đổi; `isRefreshRequest()` (M1) vẫn chặn chính request `/refresh` tự gọi lại chính nó |
| Không render route trái phép trước khi bootstrap resolve | ✅ `ProtectedRoute`/`GuestRoute` (F1) đã xử lý — verify bằng test M4-9, không phải implement mới |

---

## 12. Accessibility / UX Considerations

- Không cần splash screen/loading toàn app mới — `ProtectedRoute`/`GuestRoute` đã có `Spinner` với `label` mô tả rõ ("Đang xác thực...", "Đang tải...") + `role="status"` (xác nhận qua test F1 `getByRole("status")`) — đáp ứng đủ accessibility cho trạng thái loading.
- Route công khai (`/`) không bị ảnh hưởng — hiện ngay, không có độ trễ nhân tạo nào.
- M4 không cần thêm bất kỳ UI mới nào.

---

## 13. Open Questions

Không còn câu hỏi nào thật sự bỏ ngỏ — toàn bộ 10 điểm cần verify ở §5 prompt gốc đã được trả lời bằng bằng chứng thật (Mục 2, Mục "Phát hiện kiến trúc quan trọng nhất"). 1 điểm duy nhất cần xác nhận (không blocking, chỉ để nhất quán):

| ID | Câu hỏi | Blocking? |
|---|---|---|
| M4-OQ-1 | Tên 2 mock endpoint dùng riêng cho test race (`/mock-protected-1/2`) có cần đặt tên khác để tránh nhầm với route thật tương lai không? | Không — chỉ tồn tại trong phạm vi file test, không đăng ký vào `router.tsx` |

---

## 14. Decision Log

| ID | Decision | Verify |
|---|---|---|
| M4-D1 | **Không** dùng TanStack Query cho bootstrap | Đúng — `useSessionBootstrap` chỉ `useEffect` + `coordinateRefresh()` |
| M4-D2 | Coordinator (M1) được tái sử dụng nguyên trạng, không đổi API | Đúng — 0 thay đổi file `auth-refresh-coordinator.ts` |
| M4-D3 | Không có cờ dedupe cục bộ (`useRef`) trong hook | Đúng — coordinator đã lo việc này |
| M4-D4 | Không tự `navigate()` trong `useSessionBootstrap` | Đúng — route guard (F1) tự phản ứng theo `status` |
| M4-D5 | Coordinator/handler sở hữu việc dọn dẹp khi refresh thất bại | Đúng, nhưng **cụ thể hóa**: không phải `coordinateRefresh()` tự làm (nó generic) — mà là **handler đã đăng ký** (`registerAuthInfrastructure`, M4 sửa) — đây là điểm plan làm rõ hơn giả định ban đầu của prompt |
| M4-D6 | `RouterProvider` chờ `resolving` xong ở đâu | **Không chờ ở cấp `RouterProvider`** — route guard (`ProtectedRoute`/`GuestRoute`, F1) tự xử lý per-route (Sai lệch 2) |
| M4-D7 | Race test thuộc cấp độ nào | Integration (M4), không phải unit coordinator (đã làm ở M1) — đúng yêu cầu §10 prompt gốc |
| M4-D8 (mới) | Sửa `registerAuthInfrastructure()` để tự cập nhật `authStore` | **Bắt buộc** — nếu không sửa, M4 không thể hoạt động đúng (Sai lệch 1). Đây là phát hiện của quá trình lập plan, không phải quyết định tùy chọn |

---

## 15. Risk Register

| Risk | Assessment |
|---|---|
| React StrictMode double-effect | Không cần xử lý thủ công — coordinator's `inFlight` Promise tự dedupe bất kể effect chạy 1 hay 2 lần trong dev (đã đúng thiết kế từ M1) |
| Refresh race (nhiều request 401 cùng lúc bootstrap) | Test M4-8 chứng minh bằng đếm số lần gọi thật — rủi ro chính đã có mitigation cụ thể |
| Provider ordering sai (bootstrap chạy sau khi route đã render sai) | Thấp — `useSessionBootstrap()` gọi trong `App()` (component gốc), chạy trước `RouterProvider` con render lần đầu hoàn chỉnh (React render thứ tự cha trước) |
| `RouterProvider` render sớm | Đã xác nhận **không phải rủi ro thật** — route guard xử lý đúng (Sai lệch 2), verify bằng test M4-9 |
| `authStore` timing (test đọc state trước khi effect chạy xong) | Dùng `waitFor` (Testing Library, đã là convention M3) thay vì đọc state ngay lập tức |
| MSW timing/race không ổn định | Dùng `delay()` có chủ đích trong MSW handler để đảm bảo thứ tự T3 xảy ra trước T7 (Mục 9) — không dựa vào may rủi |
| Refresh loop | Không tăng rủi ro — `isRefreshRequest()`/`_retry` (M1) không đổi |
| Dependency-direction regression | Grep xác nhận (Mục 18) — `registerAuthInfrastructure`'s import mới (`useAuthStore`) là `features → shared`, hợp lệ, không tạo `shared → features` |

---

## 16. Acceptance Criteria

- [ ] `useSessionBootstrap()` tồn tại, chỉ dùng `useEffect` + `coordinateRefresh()` — không `useMutation`/`useQuery`
- [ ] `registerAuthInfrastructure()`'s handler tự `setSession()` khi refresh thành công, tự `clearSession()` khi thất bại
- [ ] `App.tsx` gọi `useSessionBootstrap()` đúng 1 lần ở top-level component
- [ ] Không có file nào trong `app/providers/` bị sửa
- [ ] Refresh thành công lúc khởi động → `authStore.status==="authenticated"`, `user`/`accessToken` đúng
- [ ] Refresh thất bại lúc khởi động → `authStore.status==="unauthenticated"`
- [ ] 2 request 401 đồng thời lúc bootstrap chỉ trigger **đúng 1 lần** `/refresh` thật (test đếm số lần gọi)
- [ ] `ProtectedRoute`/`GuestRoute` hiện đúng Spinner khi `resolving`, đúng nội dung sau khi bootstrap thật resolve
- [ ] Không `navigate()` thủ công trong `useSessionBootstrap`
- [ ] Không `reportError`/toast nào bị gọi cho lỗi refresh thất bại lúc bootstrap (đây là lỗi đã được xử lý, không phải unexpected)
- [ ] Không refresh token nào bị log/lưu ngoài cơ chế đã duyệt

## 17. Exit Criteria

```
✓ npm run test         — toàn bộ pass, bao gồm race test + router order test + regression F1-M3
✓ npm run typecheck     — sạch
✓ npm run lint          — sạch
✓ npm run format:check  — sạch
✓ npm run build         — thành công
✓ Không TODO/FIXME mới không phân loại
✓ Không vi phạm dependency direction (grep xác nhận)
✓ Không có abstraction thừa (không AuthBootstrapGate, không provider mới, không store mới)
✓ Race test verify đúng "đúng 1 lần /refresh" bằng số đếm thật, không suy luận
```

**Documentation:** Không cần cập nhật README/CHANGELOG/Architecture Spec ở M4 — không có contract/API/kiến trúc nào bị đổi ra bên ngoài phạm vi nội bộ `features/auth`; việc sửa `registerAuthInfrastructure()` là hoàn thiện đúng ý đồ đã ghi trong Architecture Spec §12.2 (M1), không phải thay đổi quyết định đã đóng băng.

---

## 18. Verification Commands

```bash
npm run lint
npm run typecheck
npm run format:check
npm run test
npm run test:coverage
npm run build

# Dependency direction (thủ công — eslint-plugin-boundaries chưa kích hoạt, như M1-M3 đã ghi nhận)
grep -rn "from [\"']@features" frontend/src/shared/     # phải rỗng
grep -rln "@features/auth" frontend/src/app/providers/  # phải rỗng (ThemeProvider không cần biết auth)
```

---

## 19. Implementation Sequence

```
M4-1 (verify contract)
  ↓
M4-2 (sửa registerAuthInfrastructure — BẮT BUỘC làm trước, mọi thứ khác phụ thuộc vào đây)
  ↓
M4-3 (useSessionBootstrap)
  ↓
M4-4 (App.tsx)
  ↓
M4-6 (Test A/B unit)
M4-7 (Test index.ts mở rộng)
  ↓
M4-8 (Race integration test — ưu tiên cao nhất)
M4-9 (Router order integration test)
  ↓
M4-10 (Verification & cleanup)
```

---

## Final Architect Review

| # | Câu hỏi | Trả lời |
|---|---|---|
| 1 | Bootstrap dùng coordinator trực tiếp? | **YES** — `useSessionBootstrap` chỉ gọi `coordinateRefresh()` |
| 2 | TanStack Query bị loại trừ? | **YES** — không `useMutation`/`useQuery` nào trong hook |
| 3 | Single-flight tái dùng, không nhân đôi? | **YES** — 0 thay đổi `auth-refresh-coordinator.ts` |
| 4 | StrictMode xử lý bởi coordinator, không phải cờ trong hook? | **YES** — không `useRef` nào được thêm |
| 5 | `authStore.status` resolving được tôn trọng? | **YES** — giá trị khởi tạo không đổi, route guard đã xử lý |
| 6 | `RouterProvider` có thể render sớm không? | **Không phải rủi ro** — route guard (F1) chặn đúng ở cấp route, không cần chặn ở cấp Provider (Sai lệch 2) |
| 7 | Refresh failure cleanup do coordinator sở hữu? | **Cụ thể hóa: do handler đã đăng ký sở hữu** (registerAuthInfrastructure, M4 sửa) — coordinator tự nó generic, không sở hữu semantics này |
| 8 | Navigation thủ công tránh được? | **YES** |
| 9 | 401 đồng thời test với coordinator thật? | **YES** — Mục 9, không mock coordinator |
| 10 | `/refresh` assert đúng 1 lần? | **YES** — bằng số đếm thật trong MSW handler |
| 11 | Bootstrap success/failure đều có test? | **YES** — Test A, B |
| 12 | Provider ordering đúng? | **YES** — `App.tsx`, không phải file trong `providers/` (Sai lệch 3) |
| 13 | Dependency direction còn hợp lệ? | **YES** — `features/auth/index.ts → shared/stores/authStore` là chiều hợp lệ; không `shared → features` mới |
| 14 | Refresh token nằm ngoài JS? | **YES** — handler chỉ dùng `user`/`accessToken`, không chạm `refreshToken` |
| 15 | Refresh-loop prevention giữ nguyên? | **YES** — `isRefreshRequest()`/`_retry` không đổi |
| 16 | Implementation tối giản? | **YES** — 1 file mới, 2 file sửa (1 dòng mỗi file ngoài phần sửa handler) |
| 17 | Nhất quán với F2 M1-M3? | **YES** — tái dùng 100% hạ tầng đã có, chỉ hoàn thiện 1 gap thật (Sai lệch 1) |
| 18 | Còn blocker nào trước khi implement? | **KHÔNG** |

---

# M4 Readiness:
```
READY

Blockers:
(none)
```

**Lưu ý quan trọng nhất cho developer thực thi:** Bước M4-2 (sửa `registerAuthInfrastructure()`) là điều kiện tiên quyết thật sự — nếu bỏ qua bước này và chỉ tạo `useSessionBootstrap()` đúng y hệt snippet mẫu trong prompt gốc, `authStore.status` sẽ không bao giờ rời khỏi `"resolving"`, kể cả khi refresh thành công.
