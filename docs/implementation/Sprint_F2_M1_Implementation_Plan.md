# Sprint F2 — M1 Implementation Plan

## 1. Metadata

| Field | Value |
|---|---|
| Sprint | F2 — Authentication UI & Session Management |
| Milestone | M1 — Authentication Infrastructure & Contract Alignment |
| Repo | `KhongphaiHphuc0705/astroviet`, nhánh `dev` |
| HEAD tại thời điểm lập plan | `08412ca` (verify bằng `git log`) |
| Trạng thái | Plan-only — chưa sinh code |
| Nguồn căn cứ | Repo thật (`frontend/src/**`, `backend/src/modules/identity/**`), Frontend Architecture Specification, Frontend UI Specification, F2 Decision Log (Rev.2, đã ACCEPTED qua `Confirmation.md`) |
| Numbering note | Prompt gốc (§5) liệt kê sequence F2 10-milestone cũ (M8=Error dictionary, M9=Testing, M10=Docs). F2 Decision Log Rev.2 (F2-D12, ACCEPTED) đã gộp error dictionary hoàn toàn vào M1 và giảm còn 9 milestone (M8=Testing+E2E, M9=Docs+Closure). Plan này dùng numbering Rev.2 làm nguồn sự thật vì đó là quyết định ACCEPTED gần nhất; điểm không khớp này được nêu lại ở Mục 16 (Open Questions) để tránh im lặng thay đổi. |

## 2. M1 Objective

> Thiết lập và verify ranh giới hạ tầng Frontend cần thiết cho tính năng Authentication: sửa đúng `ApiError` contract, thêm TanStack Query, thêm hạ tầng báo lỗi (`report-error.ts` + `error-messages.ts`), thêm slot `headerActions` cho `AppLayout`, và thiết lập ranh giới điều phối refresh (`shared/api/auth-refresh-coordinator.ts`) — **không cho phép `shared` phụ thuộc vào `features/auth`**.

Sau M1:
- M2 có thể bắt đầu ngay, không cần redesign hạ tầng.
- M3 có thể dùng TanStack Query + hạ tầng lỗi.
- M4 có thể xây session/refresh behavior thật trên nền coordinator đã duyệt.
- Chưa có UI authentication nào được implement.

## 3. Current State

Đọc trực tiếp code thật trên `dev` HEAD `08412ca` (không suy diễn từ spec):

| File | Trạng thái thật |
|---|---|
| `frontend/src/shared/api/client.ts` | Axios instance thật; `ApiError` class có `fieldErrors?: {field,message}[]` (**sai shape** — Mục 9.2); request interceptor gắn Bearer từ `authStore.accessToken`; response interceptor: khi 401 lần đầu, set `_retry=true` **rồi gọi `useAuthStore.getState().logout()` ngay** (dòng code F1 tạm, có `TODO(Core)` tường minh chờ refresh logic thật) |
| `frontend/src/shared/stores/authStore.ts` | `AuthState = {status, accessToken, user: {id,email}\|null, login(), logout()}`; `login()` là no-op; `logout()` set `unauthenticated`; `bootstrapAuthResolution()` (hàm riêng, không phải action trong store) giả lập `setTimeout` 100ms rồi fallback `unauthenticated` nếu còn `resolving` |
| `frontend/src/main.tsx` | Gọi `bootstrapAuthResolution()` **là side-effect ở module scope, trước `createRoot().render()`** — không phải bên trong hook/provider |
| `frontend/src/app/App.tsx` | `<StrictMode><ThemeProvider>{/* TODO(Core): Bọc QueryClientProvider... khi thực sự cài đặt (Architecture Spec §14.3) */}<RouterProvider router={router} /></ThemeProvider></StrictMode>` — **đã có sẵn TODO đúng vị trí cần thêm `QueryClientProvider`** |
| `frontend/src/test/render.tsx` (`renderWithProviders`) | Có **cùng TODO(Core)** y hệt `App.tsx` — cần cập nhật song song, nếu không test sẽ không có `QueryClientProvider` trong khi app thật có |
| `frontend/src/app/providers/` | Chỉ có `ThemeProvider.tsx` — chưa có file tổng hợp provider nào khác |
| `frontend/src/widgets/app-layout/index.tsx` | `{children}: {children: React.ReactNode}` — không có prop khác; có `<div className="h-8 w-8 rounded-full ...">` cố định làm "user profile placeholder" trong header |
| `frontend/src/features/`, `frontend/src/entities/` | Rỗng (chỉ README + `.gitkeep`) |
| `frontend/package.json` | Không có `@tanstack/react-query`; có `msw`, `vitest-axe`, `@playwright/test` |
| `frontend/tsconfig.app.json` | Path alias: `@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*`, `@test/*` |
| `eslint-plugin-boundaries` | Đã cài (`^7.1.0`) nhưng **chưa kích hoạt** (F1 M1 quyết định: chỉ bật khi đạt 1 trong 4 ngưỡng — F2 M1 chưa đủ ngưỡng) — không có lệnh kiểm tra dependency-direction tự động nào tồn tại hiện nay |

Backend Identity contract (đọc trực tiếp `backend/src/modules/identity/**`, HEAD `08412ca`):

| Điểm | Bằng chứng thật |
|---|---|
| Validation error shape | `validate-body.middleware.ts` dùng Zod `.flatten()` → `AppError.details = {formErrors: string[], fieldErrors: Record<string,string[]>}`; `mapErrorToProblemDetails` đọc `details.errors` (không tồn tại trong shape này) nên toàn bộ `{formErrors,fieldErrors}` rơi vào field `metadata` của response RFC7807, **không phải** field `fieldErrors` cấp cao nhất |
| Refresh token | `POST /api/v1/auth/refresh` — cookie `HttpOnly, Secure(prod), SameSite=Strict, Path=/api/v1/auth` **và đồng thời** JSON body chứa `refreshToken` thật (`auth-response.mapper.ts`) |
| Refresh rotation | `refresh-token.usecase.ts` rotate nghiêm ngặt — 2 lời gọi đồng thời với cùng token cũ chỉ 1 thành công, cái còn lại nhận 401 |

## 4. Preconditions

- Backend Sprint 1 (Identity) — CLOSED, contract đã verify thật (Mục 3).
- Sprint F1 — CLOSED. M1 không mở lại F1.
- Không có precondition nào chưa thỏa mãn — M1 có thể bắt đầu ngay.

## 5. Scope

1. Cài đặt + cấu hình `@tanstack/react-query` (provider tại đúng vị trí `TODO(Core)` đã có trong `App.tsx` và `render.tsx`).
2. Sửa `ApiError.fieldErrors` đúng shape thật (`Record<string,string[]>`, đọc từ `metadata.fieldErrors`).
3. Tạo `shared/lib/report-error.ts` với hợp đồng gọi rõ ràng (expected vs unexpected — Mục 9.3).
4. Tạo `shared/lib/error-messages.ts` — hạ tầng dictionary (5 mã lỗi Identity đã biết + fallback), không phải bản đầy đủ cuối cùng.
5. Tạo `shared/api/auth-refresh-coordinator.ts` — single-flight + injection boundary, hoàn toàn không biết `features/auth`/`authStore`/React tồn tại.
6. Sửa `shared/api/client.ts`: fix `ApiError`, response interceptor 401 gọi coordinator thay vì `logout()` trực tiếp.
7. Thêm `headerActions?: React.ReactNode` vào `AppLayout`.
8. Test cho toàn bộ mục trên (Mục 12).
9. Cập nhật Architecture Spec §10.1/§12.2 theo bằng chứng thật (chỉ phần M1 quyết định — không làm toàn bộ documentation audit của M9).

## 6. Non-Goals

Loại trừ tường minh (theo đúng prompt gốc §23):

- Login UI, Register UI, Logout UI, UserMenu implementation (kể cả scaffold rỗng — không cần thiết vì `headerActions` chỉ là prop nhận `ReactNode`, không đòi hỏi component thật tồn tại để test)
- `features/auth/hooks/*` (useLoginMutation, useRegisterMutation, useLogoutMutation, useSessionBootstrap)
- `authStore` redesign (không thêm `setSession`/`clearSession`, không đổi `User` type, không đổi `login()`/`logout()` hiện tại)
- `features/auth/api/*` hoàn chỉnh (refresh.ts thật — đó là M2)
- Đăng ký handler thật vào coordinator (`setRefreshHandler(refresh)`) — không thể làm vì `refresh()` chưa tồn tại tới M2
- Forgot Password, Email Verification UI, Social Login, MFA
- Birth Profile, Natal Chart, Interpretation, Dashboard, Admin, RBAC
- OpenAPI SDK generation, Design System không liên quan, refactor không liên quan

## 7. Architecture Constraints

- **Dependency Direction** (Mục 8) là ràng buộc cứng nhất của M1.
- `AppLayout` phải giữ tuyệt đối business-agnostic — chỉ render `ReactNode` được truyền vào, không tự biết `features/auth` tồn tại.
- `shared/api/auth-refresh-coordinator.ts` phải độc lập hoàn toàn với React, Zustand, và `features/auth` — chỉ là TypeScript thuần (Promise + closure).
- Không được silently redesign `authStore.ts` — mọi thay đổi tới file này đều nằm ngoài M1 (Mục 6).
- Cơ chế `_retry` đã có từ F1 phải được tôn trọng nguyên trạng (kiểu `ExtendedRequestConfig` inline hiện tại giữ nguyên cách làm, không cần global module augmentation mới).

## 8. Dependency Direction

Chiều phụ thuộc hiện tại của dự án (đã verify qua import thật trong `router.tsx`, `App.tsx`, v.v.):

```
app → pages → widgets → features → entities → shared
```

`shared/*` không được phụ thuộc lên bất kỳ tầng nào ở trên.

**Quan hệ import mới M1 tạo ra:**

| Ai import ai | Chiều có hợp lệ? | Lý do | Vòng lặp? | Business-aware hay Infra-only? |
|---|---|---|---|---|
| `shared/api/client.ts` → `shared/api/auth-refresh-coordinator.ts` | ✅ Hợp lệ | Cùng tầng `shared`, cả 2 đều infra | Không | Infra-only |
| `shared/api/auth-refresh-coordinator.ts` → `features/auth/*` | ❌ **Cấm tuyệt đối** | Vi phạm Dependency Direction (`shared` không được phụ thuộc `features`) | — | — |
| `shared/api/auth-refresh-coordinator.ts` → `shared/stores/authStore.ts` | ⛔ **M1 không tạo quan hệ này** | Dù cùng tầng `shared` nên về lý thuyết hợp lệ, M1 cố tình **không** làm điều này để tránh vi phạm Non-Goal "không redesign authStore" (Mục 6, Mục 9.5) | — | — |
| `widgets/app-layout/index.tsx` → `React` (prop `headerActions: ReactNode`) | ✅ Hợp lệ | Không import `features/auth`, chỉ nhận `ReactNode` như bất kỳ children nào | Không | Infra-only (structural) |
| `app/App.tsx` → `@tanstack/react-query` | ✅ Hợp lệ | `app` là tầng cao nhất, được phép import mọi thứ | Không | Infra-only |
| `shared/lib/error-messages.ts` → `shared/lib/report-error.ts` | ✅ Hợp lệ | Cùng tầng `shared` | Không | Infra-only |

Không có quan hệ `shared → features` nào được tạo bởi M1. Đây là điểm khác biệt cốt lõi so với bản F2 plan gốc (Mục 1, ghi chú numbering) — vốn từng đặt sai `refresh-queue.ts` vào `features/auth/api/`.

## 9. Infrastructure Design

### 9.1 TanStack Query

- Cài `@tanstack/react-query@^5` (tương thích React `^18.3.1`, Vite `^6` hiện có trong `package.json`).
- `QueryClient` instance singleton: **file mới `frontend/src/shared/api/queryClient.ts`** (không đặt trong `app/`, vì cấu hình `defaultOptions` — đặc biệt `onError` phân loại lỗi — thuộc về tầng hạ tầng API, cần import `ApiError`/`error-messages`/`report-error`, tất cả đều ở `shared`).
- `App.tsx`: thay đúng dòng `TODO(Core)` bằng `<QueryClientProvider client={queryClient}>`, bọc `<RouterProvider>`.
- `src/test/render.tsx` (`renderWithProviders`): **thay TODO tương tự** — nếu không, mọi test dùng `renderWithProviders` sau này (M3+) mà cần `useMutation`/`useQuery` sẽ throw lỗi "No QueryClient set".
- Cấu hình `defaultOptions`:
  ```ts
  {
    queries: { retry: false }, // auth session không dùng useQuery — nhưng cấu hình mặc định vẫn cần cho các query khác tương lai; giữ an toàn, không auto-retry lỗi 401/403
    mutations: {
      onError: (error) => classifyAndReport(error), // Mục 9.3
    },
  }
  ```
- **Auth session KHÔNG vào Query Cache** — `user`/`accessToken` chỉ sống trong `authStore` (Zustand), đúng quyết định đã có từ F2 Rev.2 Mục 11. M1 không tạo bất kỳ `useQuery`/`useMutation` nào cho auth (đó là M3).
- Retry mặc định cho auth mutations: không cấu hình riêng trong M1 vì chưa có auth mutation nào tồn tại — để M3 tự quyết khi viết `useLoginMutation` (mặc định TanStack Query v5 không retry mutation, phù hợp — login sai không nên tự động thử lại).

### 9.2 ApiError

**Hiện tại** (`client.ts`, đọc thật):
```ts
public fieldErrors?: { field: string; message: string }[];
...
const fieldErrors = data.fieldErrors as { field: string; message: string }[] | undefined;
```

**Sai ở đâu:** backend không bao giờ trả field `fieldErrors` ở cấp cao nhất của response — Zod `.flatten()` output (`{formErrors, fieldErrors}`) nằm trong `metadata` (Mục 3). Field top-level `fieldErrors` trong response luôn `undefined` trên thực tế — nghĩa là tính năng hiện tại **chưa từng hoạt động đúng dù compile được**.

**Target interface:**
```ts
export class ApiError extends Error {
  public status: number;
  public errorCode: string;
  public title: string;
  public detail?: string;
  public fieldErrors?: Record<string, string[]>;
  ...
}
```

**Parser/normalizer:**
```ts
const metadata = data.metadata as Record<string, unknown> | undefined;
const fieldErrors = metadata?.fieldErrors as Record<string, string[]> | undefined;
```

- **Compatibility impact:** không có consumer nào hiện tại đọc `ApiError.fieldErrors` (grep xác nhận `features/`/`pages/` rỗng) — đổi shape an toàn tuyệt đối, không breaking change thật nào tồn tại.
- **Test cases:** normal error (không `fieldErrors`), RFC7807 với `metadata.fieldErrors` 1 field nhiều message, nhiều field, `metadata` thiếu hẳn (an toàn `undefined`, không throw), response không đúng JSON/RFC7807 (fallback `errorCode: "UNKNOWN_ERROR"`, đã có sẵn logic F1, giữ nguyên).
- **TypeScript implications:** không cần global type augmentation, chỉ đổi interface field.
- **RFC7807 handling khác** không cần đổi — `title`/`detail`/`errorCode`/`status` giữ nguyên logic đọc hiện tại (đã đúng).

### 9.3 Error Reporting (`report-error.ts`)

**File:** `frontend/src/shared/lib/report-error.ts`

```ts
export function reportError(error: unknown, context?: string): void {
  // Development: console.error đầy đủ. Production: vẫn console.error ở giai đoạn này
  // (chưa tích hợp dịch vụ ngoài như Sentry — đó là quyết định tương lai, không phải M1).
  console.error(`[reportError]${context ? ` (${context})` : ""}`, error);
}
```

- **Input type:** `unknown` (không ép `Error`) — vì lỗi có thể là `ApiError`, `AxiosError` thô (network), hoặc bất kỳ giá trị nào ném ra từ code không kiểm soát được.
- **Error vs non-Error:** hàm không phân biệt xử lý khác nhau ở M1 (chỉ log nguyên trạng) — việc format đẹp hơn (stack trace riêng, message riêng) là cải tiến có thể làm sau, không phải yêu cầu M1.
- **Không bao giờ throw** — đây là hàm side-effect thuần túy, lỗi trong chính `reportError` (ví dụ `console.error` bị mock ném lỗi trong test) không được lan ra ngoài làm hỏng luồng gọi nó — bọc `try/catch` nội bộ rỗng nếu cần (M1 quyết định: không bọc, vì `console.error` không throw trong môi trường thật; nếu test cần, mock sẽ không throw theo hợp đồng).
- **Quan hệ với ApiError:** `reportError` không tự parse `ApiError` — nơi gọi (Mục 9.3 bảng dưới) quyết định có gọi hay không dựa trên phân loại.
- **Quan hệ với TanStack Query:** `queryClient.ts`'s `defaultOptions.mutations.onError` là nơi gọi `reportError` có điều kiện — không phải nơi khác.

**Quy tắc phân loại bắt buộc (đúng §39 của prompt gốc):**

| Loại lỗi | Ví dụ | Gọi `reportError`? |
|---|---|---|
| Lỗi nghiệp vụ đã biết (400/401/403/404/409/422 có `errorCode` nằm trong `error-messages.ts`) | `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `MALFORMED_REQUEST` | **Không** |
| `errorCode` không có trong dictionary | Backend thêm mã lỗi mới chưa map | **Có** |
| 5xx / lỗi hạ tầng | 500, 502, 503 | **Có** |
| Network error (không có `error.response`) | Timeout, mất mạng | **Có** |
| Lỗi render không lường trước (Error Boundary bắt) | Ngoài phạm vi M1 (chưa có Error Boundary nào đổi ở M1) | Ghi nhận là hành vi tương lai, không implement ở M1 |

Việc phân loại **không thể hoàn chỉnh 100% ở M1** vì `error-messages.ts` (Mục 9.4) chỉ có dictionary cơ bản — nhưng cơ chế phân loại (hàm `isKnownBusinessError(errorCode)` dựa trên `error-messages.ts` có mapping hay không) đã đủ để implement đúng ở M1.

### 9.4 Error Message Dictionary (`error-messages.ts`)

**File:** `frontend/src/shared/lib/error-messages.ts`

```ts
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
  EMAIL_ALREADY_EXISTS: "Email này đã được đăng ký.",
  TOKEN_EXPIRED: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
  UNAUTHORIZED: "Bạn cần đăng nhập để tiếp tục.",
  MALFORMED_REQUEST: "Dữ liệu gửi lên không hợp lệ.",
};

export function getErrorMessage(errorCode: string): string {
  const message = ERROR_MESSAGES[errorCode];
  if (!message) {
    reportError(new Error(`Unmapped errorCode: ${errorCode}`), "error-messages");
    return "Đã có lỗi xảy ra, vui lòng thử lại.";
  }
  return message;
}

export function isKnownBusinessError(errorCode: string): boolean {
  return errorCode in ERROR_MESSAGES;
}
```

- **Location:** `shared/lib/` — cùng tầng với `report-error.ts`, đúng Architecture Spec §10 (tầng `shared/lib` chứa tiện ích thuần, không phụ thuộc React).
- **API:** `getErrorMessage(code): string` (dùng ở UI M5/M6), `isKnownBusinessError(code): boolean` (dùng ở `queryClient.ts`'s `onError` để quyết định gọi `reportError` hay không — Mục 9.3).
- **Fallback:** message tiếng Việt trung tính, không lộ chi tiết kỹ thuật, đồng thời tự gọi `reportError` để phát hiện mã lỗi mới cần map (đóng vòng lặp giữa 9.3 và 9.4).
- **Tách biệt kỹ thuật vs UI copy:** `ERROR_MESSAGES` là dữ liệu thuần (map string→string), không chứa logic hiển thị (Alert/Toast) — nơi gọi (Login/Register, M5/M6) tự quyết định cách hiển thị.
- **Login/Register sẽ dùng thế nào (tương lai, không implement ở M1):** `getErrorMessage(apiError.errorCode)` truyền thẳng vào `Alert`/`setError()`.
- **Field validation errors có bypass dictionary không?** Có — `fieldErrors` (Mục 9.2) là lỗi cấp field cụ thể (ví dụ "email không đúng định dạng"), hiển thị trực tiếp message từ backend (đã là tiếng Việt/tiếng Anh tùy backend cấu hình Zod message) qua `setError()`, không qua `getErrorMessage()`. Chỉ lỗi cấp "toàn bộ request" (như `INVALID_CREDENTIALS`) mới qua dictionary. Đây là ranh giới rõ ràng cần giữ ở M5/M6 (ngoài phạm vi M1 nhưng cần nêu rõ ngay để M8/M9 không nhầm lẫn).
- **M1 chỉ tạo hạ tầng + 5 mã đã biết** (đúng contract Mục 3) — không cố gắng liệt kê toàn bộ `error-codes.ts` của backend (nhiều mã không liên quan Identity/F2). Dictionary có thể mở rộng ở M8 (Testing Consolidation, theo numbering Rev.2 — xem ghi chú Mục 1) khi phát hiện mã lỗi mới qua test thật.

### 9.5 Refresh Coordinator

**File:** `frontend/src/shared/api/auth-refresh-coordinator.ts` (đặt tên chính xác theo diagram của prompt gốc §9, khác với tên `refresh-queue.ts`/`refresh-coordinator.ts` dùng tạm ở bản F2 plan tổng trước đó — đây là điểm tinh chỉnh tên file, không phải thay đổi kiến trúc).

```ts
type RefreshHandler<T = unknown> = () => Promise<T>;

let handler: RefreshHandler | null = null;
let inFlight: Promise<unknown> | null = null;

export function setRefreshHandler<T>(newHandler: RefreshHandler<T>): void {
  handler = newHandler as RefreshHandler;
}

export function coordinateRefresh<T = unknown>(): Promise<T> {
  if (inFlight) {
    return inFlight as Promise<T>;
  }
  if (!handler) {
    return Promise.reject(
      new Error("[auth-refresh-coordinator] No refresh handler registered."),
    );
  }
  const promise = handler().finally(() => {
    inFlight = null;
  });
  inFlight = promise;
  return promise as Promise<T>;
}

// Chỉ dùng trong test — reset module-level singleton state giữa các test file
export function __resetRefreshCoordinatorForTests(): void {
  handler = null;
  inFlight = null;
}
```

**Quyết định thiết kế quan trọng nhất của M1:** coordinator **không biết gì về `accessToken`/`user`/`authStore`** — nó chỉ coordinate 1 Promise generic. Điều này thỏa mãn đồng thời:
- Invariant "độc lập với React/Zustand/`features/auth`" (prompt gốc §17).
- Non-Goal "không redesign `authStore`" (Mục 6) — vì coordinator không bao giờ chạm `authStore`.

**Hệ quả cần nêu rõ (không giấu):** vì coordinator không tự cập nhật `authStore`, việc "session thật sự được refresh và ghi nhớ" (để các request tiếp theo dùng access token mới) **chưa hoàn chỉnh sau M1** — đây chính xác là ranh giới M1/M4 mà prompt gốc §38 yêu cầu phân loại tường minh (xem Mục 9.7 để biết M1 xử lý phần retry-tức-thời thế nào mà không cần đụng `authStore`).

- **Exported symbols:** `setRefreshHandler`, `coordinateRefresh`, `__resetRefreshCoordinatorForTests`.
- **Input:** `RefreshHandler<T> = () => Promise<T>` — generic, không ép kiểu cụ thể của Auth.
- **Output:** `Promise<T>` — bất kể `T` là gì (M1 tests dùng `T = {accessToken: string}` giả lập; M4 sẽ dùng type thật từ `features/auth`).
- **Lifecycle:** singleton module-level state (`handler`, `inFlight`), sống suốt vòng đời app (không reset trừ khi test gọi `__resetRefreshCoordinatorForTests`).
- **Ownership:** `shared/api` — infra thuần túy.
- **Initialization timing:** `handler = null` cho tới khi có `setRefreshHandler()` — **M1 không gọi `setRefreshHandler()` ở đâu cả** (không có gì để đăng ký, vì `features/auth/api/refresh.ts` chưa tồn tại tới M2).
- **Registration timing:** ngoài phạm vi M1 — xảy ra ở M2/M3 khi `features/auth` tồn tại (Mục 16, Open Question không blocking).
- **Failure behavior:** nếu gọi `coordinateRefresh()` trước khi đăng ký handler → reject với lỗi rõ ràng, không silent hang, không throw đồng bộ (giữ nguyên hợp đồng Promise).
- **Concurrency behavior:** N lời gọi đồng thời → dùng chung 1 `inFlight` Promise → 1 lần gọi `handler()` thật.
- **Test strategy:** Mục 12.

### 9.6 Refresh Handler Injection / Composition Boundary

- **Ai đăng ký:** `features/auth` (cụ thể, hàm nào — quyết định ở M2/M3, không phải M1) — **M1 không đăng ký**.
- **Khi nào đăng ký xảy ra:** không xảy ra trong M1. Dự kiến ở app bootstrap (`app/App.tsx` hoặc tương đương), gọi đúng 1 lần — nhưng cơ chế gọi chính xác (ví dụ hàm `registerAuthInfrastructure()` từ `features/auth/index.ts`) là quyết định của M2/M3, không phải M1 (tránh lấn sân theo đúng §38).
- **M1 hay M4 sở hữu việc đăng ký?** Theo Rev.2 F2 Decision Log (F2-D8, ACCEPTED trước khi có prompt M1 chi tiết này), việc đăng ký thuộc **M2/M3** (ngay khi `refresh.ts` tồn tại), không phải M4 — M1 chỉ xây cơ chế `setRefreshHandler` chờ sẵn.
- **Đăng ký trùng lặp xử lý thế nào:** `setRefreshHandler()` hiện tại (M1) đơn giản là gán lại biến `handler` — gọi lần 2 sẽ **ghi đè** lần 1 mà không cảnh báo. Đây là hành vi tối thiểu chấp nhận được cho M1 (ứng dụng thật chỉ gọi 1 lần lúc bootstrap); nếu M2/M3/M4 phát hiện cần cảnh báo gọi trùng, đó là cải tiến nằm ngoài M1 (ghi vào Mục 17 Risk Register làm rủi ro thấp, không blocking).
- **Refresh được gọi trước khi đăng ký:** đã xử lý ở Mục 9.5 (reject rõ ràng, có test — Test 6 Mục 12).
- **Test thay handler thế nào:** gọi `setRefreshHandler(mockHandler)` trực tiếp trong test, gọi `__resetRefreshCoordinatorForTests()` ở `beforeEach`/`afterEach` để cô lập giữa các test.
- **App composition giữ sạch thế nào:** vì M1 không đăng ký gì, `app/App.tsx` sau M1 **không đổi gì liên quan tới đăng ký** — chỉ đổi phần `QueryClientProvider` (Mục 9.1). Việc đăng ký (dòng gọi `setRefreshHandler`) sẽ xuất hiện ở `App.tsx` lần đầu tiên tại M2/M3, không phải M1.

### 9.7 API Client Boundary

**Trách nhiệm giữ lại ở `client.ts`:** Axios instance, request interceptor (gắn token — giữ nguyên), response normalization (`ApiError`, sửa shape), phát hiện 401, gọi `coordinateRefresh()`, retry đúng 1 lần.

**Trách nhiệm KHÔNG thuộc `client.ts`:** `authStore` business logic (M1 xóa dòng `useAuthStore.getState().logout()` khỏi nhánh 401 — không thay bằng lệnh ghi `authStore` nào khác), Login/Register/Logout/UserMenu, import trực tiếp `features/auth`.

**Refactor chính xác (diff thật, dựa trên code hiện tại đã trích ở Mục 3):**

```ts
// TRƯỚC (F1, sai/tạm):
if (status === 401 && originalRequest && !originalRequest._retry) {
  originalRequest._retry = true;
  // TODO(Core): Implement refresh token logic...
  useAuthStore.getState().logout();
}
return Promise.reject(apiError);

// SAU (M1):
if (status === 401 && originalRequest && !originalRequest._retry) {
  originalRequest._retry = true;
  try {
    const result = await coordinateRefresh<{ accessToken: string }>();
    if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
    }
    return apiClient(originalRequest);
  } catch (refreshError) {
    return Promise.reject(apiError); // giữ nguyên lỗi 401 gốc, không leak lỗi refresh nội bộ ra caller
  }
}
return Promise.reject(apiError);
```

- Retry dùng lại `apiClient(originalRequest)` — Axios tự giữ nguyên method/body/headers khác của `originalRequest`, chỉ ghi đè `Authorization`.
- **Không tự cập nhật `authStore.accessToken`** (đúng Mục 9.5/Non-Goal) — hệ quả: request retry dùng token mới thành công, nhưng request **tiếp theo, độc lập** vẫn đọc `authStore.accessToken` cũ (chưa cập nhật) ở request interceptor, nên sẽ 401 lại và trigger `coordinateRefresh()` lần nữa (không phải infinite loop — mỗi lần đều thành công vì cookie đã rotate đúng — nhưng **không hiệu quả** cho tới khi M4 nối `authStore`). Đây là giới hạn đã biết, được liệt kê tường minh ở Mục 16 (Open Question, non-blocking) thay vì giấu đi.
- **Loại trừ chính route `/refresh` khỏi vòng lặp retry:** vì `refresh()` chưa tồn tại (M2), M1 chưa thể gọi thật `/refresh` qua Axios — bản thân `coordinateRefresh()` không tự gọi Axios, chỉ gọi `handler()` đã đăng ký (chưa có, nên luôn reject ở M1). Do đó, rủi ro "refresh endpoint tự gọi lại chính nó qua interceptor" **không tồn tại ở M1** — sẽ cần xử lý khi M2/M3 thêm `refresh.ts` thật (dùng 1 Axios instance riêng không qua interceptor cho chính request `/refresh`, hoặc đánh dấu flag loại trừ — quyết định của M2/M3, ghi nhận ở Mục 16 làm điểm cần lưu ý cho milestone sau, không phải M1 tự giải quyết).

### 9.8 AppLayout Header Actions

```tsx
// TRƯỚC:
export function AppLayout({ children }: { children: React.ReactNode }) {
  ...
  <div className="h-8 w-8 rounded-full ...">{/* user profile placeholder */}</div>
  ...
}

// SAU:
interface AppLayoutProps {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}
export function AppLayout({ children, headerActions }: AppLayoutProps) {
  ...
  {headerActions ?? <div className="h-8 w-8 rounded-full ...">{/* fallback giữ nguyên hành vi cũ nếu không truyền gì */}</div>}
  ...
}
```

- `AppLayout` **không** import `features/auth`, không import `UserMenu`, không gọi auth hook, không đọc `authStore` — chỉ nhận và render `ReactNode`.
- Hành vi cũ (không ai truyền `headerActions`, ví dụ mọi nơi gọi `<AppLayout>` hiện tại trong `router.tsx`) **giữ nguyên y hệt** nhờ fallback `??`.
- Responsive/layout khác trong `AppLayout` không đổi.
- M1 **không** tạo `widgets/user-menu` — kể cả scaffold rỗng — vì `headerActions` chỉ cần nhận `ReactNode` để test (M1 test dùng `<div>Test Actions</div>` giả lập, không cần `UserMenu` thật tồn tại).

## 10. File Impact Analysis

| File | Action | Responsibility | Why M1 needs it | Dependencies | Risk |
|---|---|---|---|---|---|
| `frontend/package.json` | Modify | Thêm `@tanstack/react-query` | Bắt buộc cho 9.1 | — | Thấp |
| `frontend/src/shared/api/queryClient.ts` | Create | QueryClient singleton + `onError` phân loại | 9.1, 9.3 | `error-messages.ts`, `report-error.ts` | Thấp |
| `frontend/src/shared/api/auth-refresh-coordinator.ts` | Create | Single-flight + injection boundary | 9.5 | Không (thuần TS) | **Cao** (trọng tâm kiến trúc M1) |
| `frontend/src/shared/api/client.ts` | Modify | Sửa `ApiError` shape; 401 gọi coordinator | 9.2, 9.7 | `auth-refresh-coordinator.ts` | Trung bình |
| `frontend/src/shared/lib/report-error.ts` | Create | Hàm log lỗi có ngữ cảnh | 9.3 | Không | Thấp |
| `frontend/src/shared/lib/error-messages.ts` | Create | Dictionary + fallback | 9.4 | `report-error.ts` | Thấp |
| `frontend/src/widgets/app-layout/index.tsx` | Modify | Thêm `headerActions` prop | 9.8 | Không | Thấp |
| `frontend/src/app/App.tsx` | Modify | Bọc `QueryClientProvider` đúng vị trí `TODO(Core)` có sẵn | 9.1 | `queryClient.ts` | Thấp |
| `frontend/src/test/render.tsx` | Modify | Bọc `QueryClientProvider` trong `renderWithProviders` (cùng TODO) | 9.1 | `queryClient.ts` | Thấp |
| `docs/frontend/Frontend_Architecture_Specification.md` | Modify | §10.1 (`ApiError` shape), §12.2 (cookie + body) | F2-OQ-2 (phần M1 sở hữu) | Không | Thấp |

**Files to avoid touching:** `frontend/src/shared/stores/authStore.ts`, `frontend/src/main.tsx`, `frontend/src/app/router.tsx`, `frontend/src/app/routing/*`, `frontend/src/pages/*`, mọi file trong `frontend/src/features/`, `frontend/src/entities/`.

Không có path nào trong bảng trên thuộc diện `UNKNOWN — REQUIRES VERIFICATION` — toàn bộ đã đọc trực tiếp code thật.

## 11. Implementation Sequence

### M1.1 — Baseline Verification
**Objective:** Xác nhận HEAD, chạy baseline test/lint/typecheck trước khi sửa gì, để có mốc so sánh "trước/sau".
**Prerequisites:** Không.
**Files:** Không sửa.
**Steps:** `git log -1`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run format:check` — ghi lại kết quả baseline.
**Tests:** Không (đây là bước đo, không phải bước code).
**Acceptance Criteria:** Baseline ghi nhận đầy đủ, không có lỗi ẩn từ trước M1.
**Risks:** Nếu baseline đã fail sẵn (không do M1), cần phân biệt rõ trước khi tiếp tục.
**Expected evidence:** Log output của 4 lệnh trên.

### M1.2 — TanStack Query Infrastructure
**Objective:** Cài + cấu hình provider tại đúng 2 vị trí `TODO(Core)` đã có sẵn.
**Prerequisites:** M1.1.
**Files:** `package.json`, `shared/api/queryClient.ts` (mới), `app/App.tsx`, `test/render.tsx`.
**Dependencies:** Không phụ thuộc `error-messages.ts`/`report-error.ts` NGAY (có thể tạo `queryClient.ts` với `onError` rỗng tạm, rồi hoàn thiện ở M1.4) — nhưng để tránh 2 lần sửa cùng 1 file, khuyến nghị làm sau M1.4 (xem thứ tự tổng ở Mục "Implementation Order" cuối mục này).
**Tests:** `queryClient.test.ts` (provider tồn tại, `renderWithProviders` không throw "No QueryClient set" khi 1 component test gọi `useQuery` giả lập tối thiểu).
**Acceptance Criteria:** `npm run build` pass; test dùng `renderWithProviders` cũ (F1) vẫn pass nguyên trạng.
**Risks:** Quên cập nhật `test/render.tsx` → mọi test tương lai dùng mutation sẽ crash hàng loạt ở M3. Mitigation: test M1.2 chủ động gọi `useMutation` giả trong 1 component test tối thiểu.
**Expected evidence:** Test pass + đọc lại `App.tsx`/`render.tsx` xác nhận không còn dòng `TODO(Core)` liên quan Query.

### M1.3 — ApiError Contract Correction
**Objective:** Sửa `ApiError.fieldErrors` đúng shape thật.
**Prerequisites:** M1.1.
**Files:** `shared/api/client.ts`.
**Dependencies:** Không phụ thuộc milestone khác.
**Tests:** Mục 12 (7 case ApiError).
**Acceptance Criteria:** `metadata.fieldErrors` parse đúng `Record<string,string[]>`; case thiếu `metadata` không throw.
**Risks:** Thấp — không consumer nào bị ảnh hưởng (Mục 9.2).
**Expected evidence:** Test pass, đọc lại type definition xác nhận đổi đúng.

### M1.4 — Error Reporting + Message Infrastructure
**Objective:** Tạo `report-error.ts` + `error-messages.ts`.
**Prerequisites:** M1.1.
**Files:** `shared/lib/report-error.ts` (mới), `shared/lib/error-messages.ts` (mới).
**Dependencies:** Không phụ thuộc M1.2/M1.3 để tồn tại, nhưng M1.2's `queryClient.ts` cần cả 2 file này cho `onError` — nên hoàn thành M1.4 **trước khi hoàn thiện phần `onError` của M1.2**.
**Tests:** Mục 12 (report-error 4 case, error-messages: known code, unknown code + reportError spy).
**Acceptance Criteria:** `getErrorMessage`/`isKnownBusinessError` hoạt động đúng bảng Mục 9.3/9.4.
**Risks:** Thấp.
**Expected evidence:** Test pass.

### M1.5 — Refresh Coordination Boundary
**Objective:** Xây `auth-refresh-coordinator.ts` — phần kiến trúc quan trọng nhất M1.
**Prerequisites:** M1.1.
**Files:** `shared/api/auth-refresh-coordinator.ts` (mới).
**Dependencies:** Độc lập hoàn toàn — không phụ thuộc file nào khác trong M1 (đúng thiết kế "độc lập React/Zustand/features/auth", Mục 9.5).
**Tests:** Mục 12, Test 1–7 (single call, concurrent calls, failure, next cycle, no stale Promise, registration, no feature dependency — kiểm tra tĩnh bằng đọc import, ghi log thủ công vào PR description vì không có công cụ tự động).
**Acceptance Criteria:** N lời gọi đồng thời → đúng 1 lần gọi `handler()` thật (test đếm số lần gọi).
**Risks:** **Cao nếu test sai cách** (mock không thật sự đồng thời) — mitigation: dùng `Promise` chưa resolve thật (không `Promise.resolve()` ngay) để mô phỏng đúng khoảng thời gian "đang chạy dở" cần dedupe.
**Expected evidence:** Test pass với assertion đếm số lần gọi cụ thể (`expect(handlerSpy).toHaveBeenCalledTimes(1)`).

### M1.6 — API Client Integration Boundary
**Objective:** Nối `client.ts`'s 401 interceptor vào coordinator (M1.5), bỏ dòng `logout()` cũ.
**Prerequisites:** M1.3, M1.5.
**Files:** `shared/api/client.ts`.
**Dependencies:** Cần M1.3 (ApiError đã đúng) và M1.5 (coordinator tồn tại) xong trước.
**Tests:** Mục 12 (401 detection, gọi coordinator, retry đúng 1 lần, refresh fail → reject lỗi 401 gốc, concurrent 401 → single-flight qua coordinator dùng thật, không phải giả lập lại logic dedupe lần 2 trong `client.ts`).
**Acceptance Criteria:** Không còn dòng `useAuthStore.getState().logout()` trong nhánh 401; retry dùng đúng token mới từ kết quả `coordinateRefresh()`.
**Risks:** Nếu handler chưa đăng ký (đúng trạng thái M1), mọi 401 thật trong quá trình dev/test sẽ reject với lỗi "chưa đăng ký" — đây là hành vi **đúng và có chủ đích** ở M1 (chưa có auth UI nào tồn tại để tạo 401 thật ngoài test có mock).
**Expected evidence:** Test pass; đọc lại code xác nhận không còn import `authStore` cho mục đích ghi (import để đọc `accessToken` ở request interceptor vẫn giữ nguyên, đó là hành vi F1 hợp lệ không đổi).

### M1.7 — AppLayout headerActions
**Objective:** Thêm slot, giữ business-agnostic.
**Prerequisites:** M1.1.
**Files:** `widgets/app-layout/index.tsx`.
**Dependencies:** Độc lập hoàn toàn với M1.2–M1.6.
**Tests:** Mục 12 (render không `headerActions` → giữ hành vi cũ; có `headerActions` → render đúng nội dung truyền vào; children không đổi; test F1 cũ vẫn pass nguyên).
**Acceptance Criteria:** Test `AppLayout` cũ (F1) không cần sửa vẫn pass.
**Risks:** Thấp.
**Expected evidence:** Test pass.

### M1.8 — Infrastructure Tests Consolidation
**Objective:** Rà soát toàn bộ test M1.2–M1.7, đảm bảo đủ 100% case yêu cầu ở Mục 12, không thiếu case nào.
**Prerequisites:** M1.2–M1.7.
**Files:** Không tạo file mới — chỉ review/bổ sung test còn thiếu.
**Tests:** Đối chiếu checklist Mục 12.
**Acceptance Criteria:** Mọi case trong Mục 12 có test tương ứng, không có case nào bị bỏ sót.
**Risks:** Thấp.
**Expected evidence:** Coverage report (nếu `test:coverage` chạy được) + checklist đối chiếu thủ công.

### M1.9 — Documentation & Final Verification
**Objective:** Cập nhật Architecture Spec §10.1/§12.2; chạy đầy đủ verification commands (Mục 20).
**Prerequisites:** M1.2–M1.8.
**Files:** `docs/frontend/Frontend_Architecture_Specification.md`.
**Tests:** Không thêm — chạy lại toàn bộ suite.
**Acceptance Criteria:** Mục 18 (Acceptance Criteria) đạt 100%.
**Risks:** Thấp.
**Expected evidence:** Log đầy đủ 7 lệnh verification (Mục 20).

**Implementation Order thực tế (giải thích lệch nhẹ so với gợi ý mẫu §26/§27 của prompt gốc):**
```
M1.1 (baseline)
  ↓
M1.4 (error infra) ──┐
M1.3 (ApiError)       │  3 nhánh độc lập, có thể làm song song
M1.5 (coordinator)    │  hoặc theo thứ tự bất kỳ trong nhóm này
M1.7 (AppLayout) ─────┘
  ↓
M1.2 (Query — hoàn thiện onError SAU khi M1.4 xong, để tránh sửa queryClient.ts 2 lần)
  ↓
M1.6 (Client integration — cần M1.3 + M1.5 xong trước)
  ↓
M1.8 (test consolidation)
  ↓
M1.9 (docs + final verification)
```
Lý do lệch so với gợi ý mẫu: prompt mẫu đặt Query ngay sau baseline, nhưng `queryClient.ts`'s `onError` thật sự cần `error-messages.ts` (M1.4) để phân loại lỗi đúng ngay từ đầu — làm Query trước rồi quay lại sửa `onError` sau tạo 2 lần chỉnh sửa không cần thiết trên cùng 1 file.

## 12. Testing Strategy

### ApiError (M1.3)
1. Lỗi thường (không `fieldErrors`) → `ApiError` đúng field cơ bản.
2. RFC7807 với `metadata.fieldErrors` 1 field, 1 message.
3. `metadata.fieldErrors` 1 field, **nhiều** message (mảng >1 phần tử) — giữ nguyên toàn bộ mảng, không cắt bớt.
4. `metadata.fieldErrors` nhiều field.
5. Response không có `metadata` → `fieldErrors` là `undefined`, không throw.
6. Response không đúng shape RFC7807 (lỗi mạng thô) → fallback `errorCode: "UNKNOWN_ERROR"` (giữ logic F1).
7. `metadata` tồn tại nhưng không có `fieldErrors` bên trong → `undefined`, không throw.

### Refresh Coordinator (M1.5) — đúng 7 test bắt buộc theo prompt gốc §22
1. **Single call:** 1 caller → `handler` gọi đúng 1 lần.
2. **Concurrent calls:** N caller đồng thời (dùng `Promise` chưa resolve ngay) → `handler` gọi đúng 1 lần, tất cả nhận cùng kết quả.
3. **Refresh failure:** N caller đồng thời, `handler` reject → tất cả nhận cùng lỗi.
4. **Next independent cycle:** sau khi hoàn tất (thành công/thất bại), gọi `coordinateRefresh()` lần nữa → tạo Promise MỚI, gọi `handler` thêm 1 lần nữa (tổng 2 lần qua 2 chu kỳ riêng biệt).
5. **No stale Promise:** sau khi Promise resolve/reject, biến `inFlight` nội bộ trở về `null` (verify gián tiếp qua Test 4 — nếu còn stale, Test 4 sẽ fail vì không gọi `handler` lần 2).
6. **Handler registration:** chưa `setRefreshHandler` → `coordinateRefresh()` reject với message rõ ràng, không hang.
7. **No feature dependency:** kiểm tra tĩnh (đọc `import` statement của file `auth-refresh-coordinator.ts`) — xác nhận không có import từ `features/*` hoặc `react`/`zustand`. Không có công cụ tự động (`eslint-plugin-boundaries` chưa kích hoạt — Mục 3) nên đây là bước review thủ công, ghi rõ trong PR checklist, không phải unit test.

### API Client (M1.6)
1. 401 phát hiện đúng.
2. Gọi `coordinateRefresh()` đúng 1 lần khi 401 (mock `auth-refresh-coordinator` module).
3. Retry đúng 1 lần với token mới, dùng đúng `originalRequest` (giữ method/body).
4. Refresh fail → reject lỗi 401 **gốc** (không phải lỗi refresh nội bộ), không retry thêm.
5. Concurrent 401 (N request cùng lúc 401) → `coordinateRefresh` (đã tự dedupe ở M1.5) chỉ chạy 1 lần — test này là **test tích hợp giữa client.ts và coordinator thật** (không mock coordinator), phân biệt rõ với test M1.5 (đơn vị coordinator độc lập).

Phân loại tường minh theo §33 của prompt gốc:
- Test 1–4 ở trên: **Infrastructure test, thuộc M1** (dùng handler giả lập, không phải `refresh()` thật).
- Test tích hợp thật với `refresh()` thật (gọi `/api/v1/auth/refresh` qua MSW với backend contract thật): **thuộc M4** — vì `refresh()` chưa tồn tại tới M2, và hành vi `authStore` cập nhật sau refresh thành công là M4 business logic, không phải M1 infra.

### AppLayout (M1.7)
1. Render không `headerActions` → giữ hành vi cũ (fallback div).
2. Render có `headerActions` → hiện đúng nội dung truyền vào, không hiện fallback.
3. `children` vẫn render đúng như trước (test F1 cũ, không sửa, phải tiếp tục pass).
4. Responsive/layout snapshot (nếu F1 đã có snapshot test) không đổi ngoài phần header.

### report-error (M1.4)
1. Gọi với `Error` thật → `console.error` được gọi với đúng arguments.
2. Gọi với giá trị không phải `Error` (string, object, `undefined`) → không throw, vẫn log.
3. Gọi có `context` → context xuất hiện trong log.
4. Không throw trong mọi trường hợp trên (assertion `expect(() => reportError(...)).not.toThrow()`).

### error-messages (M1.4)
1. Mỗi mã trong 5 mã đã biết → đúng message tiếng Việt.
2. Mã lạ → fallback + `reportError` được gọi (spy).
3. `isKnownBusinessError` đúng true/false tương ứng.

### TanStack Query (M1.2)
1. `App.tsx` render không lỗi (smoke test, có thể tái dùng test hiện có nếu F1 đã có root render test).
2. `renderWithProviders` hỗ trợ 1 component test gọi `useMutation` tối thiểu (giả lập) không throw "No QueryClient set".
3. Test F1 cũ dùng `renderWithProviders` (ví dụ `ProtectedRoute.test.tsx`) tiếp tục pass nguyên trạng — đây là regression test bắt buộc.

## 13. Security Review

| Mục kiểm tra | Kết quả M1 |
|---|---|
| Refresh token vẫn HttpOnly | ✅ Không đổi — M1 không chạm cookie config (backend), không lưu gì phía client |
| Refresh token body field bị bỏ qua | ✅ N/A ở M1 — `refresh()` chưa tồn tại nên chưa có response body nào để đọc; nguyên tắc này sẽ được thực thi ở M2 khi viết `features/auth/api/refresh.ts` (M1 chỉ đảm bảo `RefreshHandler<T>` generic, không ép kiểu chứa `refreshToken`, nên M2 không có "chỗ" nào tự nhiên để vô tình lưu field đó) |
| Không refresh token nào vào Zustand | ✅ Coordinator không chạm `authStore` (Mục 9.5) |
| Không vào `localStorage`/`sessionStorage` | ✅ M1 không thêm bất kỳ storage API nào |
| Không log token | ✅ `report-error`/`reportError` chỉ nhận `error`/`context` — M1 không truyền token vào bất kỳ lời gọi `reportError` nào; cần lưu ý ở M2+ không vô tình log response body chứa `refreshToken` |
| Access token behavior nhất quán | ✅ Request interceptor giữ nguyên logic đọc `authStore.accessToken` (F1) |
| Refresh endpoint không tự gọi lại chính nó | ✅ N/A ở M1 (chưa có request `/refresh` thật nào được gọi qua `client.ts` — Mục 9.7 đã giải thích) — cần M2/M3 xử lý khi thêm `refresh.ts` thật |
| Refresh fail terminate an toàn | 🟡 Một phần — `client.ts` reject đúng lỗi gốc, nhưng "terminate session" (cập nhật UI/route) chưa xảy ra vì `authStore` chưa được nối (đúng ranh giới M1/M4 đã nêu ở Mục 9.7) |
| Không infinite retry | ✅ `_retry` flag F1 giữ nguyên, coordinator không tự gọi lại chính nó |
| Error reporting không leak token | ✅ Không có đường dẫn nào trong M1 truyền response body (chứa token) vào `reportError` |

## 14. Accessibility / UI Impact

- `AppLayout` thay đổi duy nhất là thêm prop optional — không đổi DOM structure khi không truyền `headerActions` (fallback giữ nguyên div cũ) → không có regression accessibility/keyboard/focus.
- Khi có `headerActions` (chưa xảy ra tới M7), trách nhiệm accessibility của nội dung đó thuộc về component được truyền vào (M7), không phải `AppLayout`.
- Không có thay đổi UI/visual nào khác trong M1 — không cần QA responsive riêng.

## 15. Decision Log

| ID | Decision | Status | Rationale | Alternatives Rejected | Impact |
|---|---|---|---|---|---|
| M1-DL-01 | `QueryClient` instance đặt ở `shared/api/queryClient.ts`, không phải `app/providers/` | ACCEPTED | Cần import `error-messages`/`report-error` (đều ở `shared`) cho `onError`; giữ mọi thứ liên quan "API infra" cùng 1 nơi | Đặt trong `app/providers/QueryProvider.tsx` (bản F2 tổng trước đó từng đề xuất) — bị bác vì tách rời cấu hình `onError` khỏi nơi định nghĩa lỗi, gây khó bảo trì | Thấp — chỉ là vị trí file |
| M1-DL-02 | `ApiError.fieldErrors: Record<string,string[]>` đọc từ `metadata.fieldErrors` | ACCEPTED (F2-D2 kế thừa) | Khớp bằng chứng backend thật | Giữ `{field,message}[]` — bác vì chưa từng hoạt động đúng với backend thật | Không breaking (chưa ai dùng) |
| M1-DL-03 | Coordinator đặt tên `auth-refresh-coordinator.ts`, generic `RefreshHandler<T>`, không biết `accessToken`/`authStore` | ACCEPTED | Đúng yêu cầu "độc lập features/auth/Zustand/React"; đồng thời tránh vi phạm Non-Goal "không redesign authStore" | Coordinator tự cập nhật `authStore` khi thành công (bản F2 tổng trước đó) — bác vì M1 Non-Goals cấm chạm `authStore.ts` | Cao — đây là quyết định kiến trúc trung tâm của M1 |
| M1-DL-04 | M1 không gọi `setRefreshHandler()` ở đâu cả | ACCEPTED | `features/auth/api/refresh.ts` chưa tồn tại tới M2 — không có gì để đăng ký | Tạo handler giả (`() => Promise.reject('not implemented')`) đăng ký tạm ở M1 — bác vì tạo ảo giác "đã hoạt động" trong khi chưa, đồng thời là code chết cần xóa lại ở M2 | Trung bình — nghĩa là mọi 401 thật giữa M1 và M2 sẽ luôn reject "chưa đăng ký" (chấp nhận được, không có UI nào tạo 401 thật lúc này) |
| M1-DL-05 | `client.ts`'s nhánh 401 xóa `useAuthStore.getState().logout()`, không thay bằng lệnh ghi `authStore` nào khác | ACCEPTED | Đúng Non-Goal + giữ `client.ts` infra-only tuyệt đối; "logout thật" khi refresh fail là hành vi M4 | Giữ nguyên gọi `logout()` cũ — bác vì đó là hành vi tạm F1 không đúng với thiết kế coordinator mới (gọi logout trước cả khi thử refresh là sai) | Trung bình — UI sẽ không "thấy" được người dùng bị đăng xuất khi refresh fail cho tới M4 (chấp nhận được vì chưa có auth UI) |
| M1-DL-06 | `error-messages.ts` chỉ chứa 5 mã Identity đã biết, không cố liệt kê toàn bộ `error-codes.ts` backend | ACCEPTED | Đúng phạm vi F2 (chỉ Auth); mã khác không liên quan | Copy toàn bộ error-codes.ts backend sang dictionary — bác vì scope creep, nhiều mã không bao giờ xuất hiện ở luồng Auth | Thấp |
| M1-DL-07 | Không tạo `widgets/user-menu` scaffold ở M1 | ACCEPTED | `headerActions` chỉ cần `ReactNode` để test — không cần component thật tồn tại | Tạo scaffold rỗng cho tiện M7 — bác vì đó là "auth UI" nằm ngoài Non-Goals M1 dù chỉ là vỏ rỗng | Thấp |

## 16. Open Questions

| ID | Question | Why it matters | Blocking? | Owner | Required before | Recommended resolution |
|---|---|---|---|---|---|---|
| M1-OQ-1 | Numbering F2 M8/M9/M10 trong prompt gốc §5 (Error dictionary/Testing/Docs) không khớp F2 Decision Log Rev.2 (F2-D12, đã gộp Error dictionary vào M1, còn 9 milestone) — dùng numbering nào cho các mốc tương lai? | Ảnh hưởng cách đặt tên milestone từ M8 trở đi trong tài liệu tương lai | Không blocking M1 (M1 tự nó không đổi vì numbering) | Bạn | Trước khi lập plan M8/M9 tương lai | Dùng numbering Rev.2 (9 milestone) làm chính thức, vì đó là quyết định ACCEPTED gần nhất qua `Confirmation.md` |
| M1-OQ-2 | Ai (M2 hay M3) chính xác gọi `setRefreshHandler()` và bằng cơ chế nào (`registerAuthInfrastructure()` hay side-effect import)? | Ảnh hưởng thiết kế `features/auth/index.ts` ở M2/M3 | Không blocking M1 | Bạn/M2 implementer | Trước khi bắt đầu M2 | Giữ đề xuất F2-D8 (Rev.2): `features/auth/index.ts` export `registerAuthInfrastructure()`, gọi 1 lần từ `app/App.tsx` |
| M1-OQ-3 | Request `/api/v1/auth/refresh` tự thân có cần loại trừ khỏi response interceptor's 401-retry logic không (tránh trường hợp chính request refresh trả 401 lại tự trigger `coordinateRefresh()` đệ quy)? | Rủi ro vòng lặp khi M2/M3 thêm `refresh()` thật | Không blocking M1 (chưa có `refresh()` thật) | M2/M3 implementer | Trước khi M2/M3 viết `refresh.ts` và nối vào `client.ts` | Khuyến nghị: kiểm tra `originalRequest.url` có chứa `/auth/refresh` trong nhánh 401, nếu có thì không gọi `coordinateRefresh()` mà reject thẳng |

Không có Open Question nào **blocking** M1 bắt đầu hoặc hoàn thành.

## 17. Risk Register

| Risk | Probability | Impact | Mitigation | Detection |
|---|---|---|---|---|
| Circular dependency giữa `client.ts` ↔ `auth-refresh-coordinator.ts` | Thấp | Cao | Coordinator không import `client.ts` (chỉ chiều ngược lại) — kiểm tra thủ công khi review | Đọc import list |
| Refresh coordinator bị ai đó sau này vô tình import `features/auth` để "tiện" | Thấp | Cao | Ghi rõ trong file header comment "KHÔNG import features/* — xem Decision M1-DL-03"; review checklist riêng | Code review + test 7 (Mục 12) |
| Test race condition giả (mock resolve ngay lập tức, không thật sự đồng thời) | Trung bình | Cao | Dùng Promise chưa resolve thật + đếm số lần gọi handler, không chỉ so sánh kết quả cuối | Review test implementation |
| Axios typing cho `_retry` (`ExtendedRequestConfig` inline) gây lỗi typecheck khi thêm logic mới | Thấp | Trung bình | Giữ nguyên pattern inline hiện có (không tạo global augmentation mới ngoài phạm vi cần) | `npm run typecheck` |
| TanStack Query cấu hình sai khiến lỗi 401 bị auto-retry bởi `queries.retry` mặc định | Trung bình | Trung bình | Set `queries.retry: false` tường minh trong `queryClient.ts` (Mục 9.1) | Test M1.2 |
| Duplicate error reporting (cả `client.ts` và `queryClient.onError` cùng gọi `reportError` cho cùng 1 lỗi) | Trung bình | Trung bình | `client.ts` **không** tự gọi `reportError` ở M1 (chỉ chuẩn hóa `ApiError` và reject) — chỉ `queryClient.onError` gọi `reportError`, đúng 1 nơi duy nhất | Review code + test M1.4/M1.2 |
| `ApiError` shape drift trong tương lai nếu backend đổi lại cấu trúc lỗi | Thấp | Trung bình | Test M1.3 cụ thể cho shape hiện tại — regression guard | Test suite |
| Phá vỡ test F1 hiện có (`ProtectedRoute.test.tsx`, `AppLayout.test.tsx`, `client.test.ts`) | Trung bình | Cao | Chạy toàn bộ suite F1 trước (M1.1 baseline) và sau mỗi milestone con | `npm run test` |
| `AppLayout` slot bị lạm dụng sau này để nhét business logic trực tiếp vào layout | Thấp | Trung bình | Ghi rõ trong Coding Standards checklist (đã đề cập ở F2 Rev.2 Mục 24) | Code review tương lai |
| Side-effect ẩn lúc module khởi tạo (`auth-refresh-coordinator.ts` module-level `let` state) gây khó test nếu quên reset | Trung bình | Trung bình | Export `__resetRefreshCoordinatorForTests()`, dùng trong mọi `beforeEach` liên quan | Test suite tự chứng minh (nếu quên reset, Test 4 sẽ fail chéo giữa các test file) |
| Test-only behavior khác production (ví dụ mock `handler` không phản ánh đúng độ trễ thật) | Thấp | Thấp | Dùng `Promise` với `setTimeout`/`queueMicrotask` thay vì resolve đồng bộ trong test coordinator | Review test |

## 18. Acceptance Criteria

- [ ] `@tanstack/react-query` có trong `package.json` dependencies, version tương thích React 18/Vite 6
- [ ] `App.tsx` và `test/render.tsx` không còn dòng `TODO(Core)` liên quan Query — cả 2 đã bọc `QueryClientProvider`
- [ ] Toàn bộ test F1 hiện có tiếp tục pass (regression = 0)
- [ ] `ApiError.fieldErrors` là `Record<string,string[]>`, đọc đúng từ `metadata.fieldErrors`, có test cho 7 case (Mục 12)
- [ ] Lỗi validation nhiều message/field không bị mất dữ liệu khi normalize
- [ ] `report-error.ts` tồn tại, đúng contract (`unknown, context?`), không bao giờ throw
- [ ] Lỗi nghiệp vụ đã biết (401/409/400 có mapping) **không** gọi `reportError` (có test chứng minh)
- [ ] `error-messages.ts` tồn tại với 5 mã Identity + fallback an toàn
- [ ] `auth-refresh-coordinator.ts` là hạ tầng `shared`, **không** import `features/auth` (verify thủ công + test 7)
- [ ] N caller đồng thời chỉ tạo 1 lần gọi `handler()` thật (test đếm số lần gọi)
- [ ] Refresh thất bại propagate đúng lỗi cho mọi caller đang chờ
- [ ] `client.ts` không còn import `authStore` cho mục đích ghi (chỉ đọc `accessToken` như F1 vốn có)
- [ ] Retry xảy ra tối đa 1 lần cho 1 request gốc
- [ ] `AppLayout` nhận `headerActions?: ReactNode`, fallback đúng khi không truyền
- [ ] `AppLayout` vẫn business-agnostic (không import gì mới ngoài `React`)
- [ ] `npm run test` pass 100% (cả test cũ lẫn mới)
- [ ] `npm run typecheck` pass
- [ ] `npm run lint` pass
- [ ] `npm run format:check` pass
- [ ] `npm run build` pass
- [ ] Không có TODO/FIXME mới nào không được phân loại (mọi TODO còn lại — nếu có — phải ghi rõ thuộc M2/M3/M4)
- [ ] Không có Login/Register/Logout/UserMenu/authStore-redesign nào lọt vào M1 (đối chiếu Mục 6)

## 19. Definition of Done

> `@tanstack/react-query` hoạt động đúng tại 2 điểm tích hợp đã có sẵn từ F1 (`App.tsx`, `render.tsx`); `ApiError` phản ánh đúng shape RFC7807 thật của backend Identity; `report-error`/`error-messages` phân loại đúng lỗi expected/unexpected; `auth-refresh-coordinator.ts` coordinate đúng 1 lần refresh cho N caller đồng thời, hoàn toàn độc lập với `features/auth`/Zustand/React, có test chứng minh bằng đếm số lần gọi thật; `client.ts` gọi coordinator đúng khi 401 và retry đúng 1 lần mà không tự ý ghi `authStore`; `AppLayout` có slot `headerActions` mà vẫn business-agnostic tuyệt đối; toàn bộ test F1 cũ không regression; lint/typecheck/format/build sạch; và F2 M2 có thể bắt đầu ngay mà không cần redesign bất kỳ phần hạ tầng nào M1 vừa dựng.

## 20. Verification Commands

Đọc trực tiếp `frontend/package.json` — không phát minh lệnh:

```bash
npm install                  # cài đặt (bao gồm @tanstack/react-query mới)
npm run lint                 # eslint .
npm run typecheck            # tsc --noEmit
npm run format:check         # prettier --check .
npm run test                 # vitest run --passWithNoTests
npm run test:coverage        # vitest run --coverage --passWithNoTests
npm run build                # tsc --noEmit && vite build
```

**Không tồn tại lệnh kiểm tra dependency-direction tự động** — `eslint-plugin-boundaries` đã cài (`^7.1.0`) nhưng chưa kích hoạt trong `eslint.config`/`.eslintrc` (F1 M1 quyết định, chưa đạt ngưỡng kích hoạt). Verify Invariant 1 (Mục 8) bằng **đọc thủ công** import statement của `auth-refresh-coordinator.ts` và `client.ts`, ghi vào PR description — không có script `npm run check:boundaries` hay tương đương để gọi.

`npm run test:e2e` (Playwright) tồn tại nhưng **không thuộc phạm vi verify M1** — không có auth UI nào để E2E kiểm tra ở milestone này (đúng Non-Goals, Mục 6).

## 21. Documentation Impact

- `docs/frontend/Frontend_Architecture_Specification.md` §10.1: cập nhật `ApiError.fieldErrors` sang `Record<string,string[]>`, ghi rõ nguồn `metadata.fieldErrors`.
- `docs/frontend/Frontend_Architecture_Specification.md` §12.2: ghi rõ backend trả refresh token cả qua Cookie lẫn response body (bằng chứng M1 xác nhận), và quyết định Frontend bỏ qua body field (F2-D1).
- **Không đụng các phần khác của Architecture Spec** (ví dụ §7.3 state ownership, §12.4 CSRF) — những phần đó không bị M1 quyết định nào làm sai lệch, để nguyên cho M9 (theo đúng chỉ dẫn "không trùng lặp công việc M10/M9", prompt gốc §11 F2-OQ-2).
- `frontend/README.md`/`CHANGELOG.md`: **không đổi ở M1** — đây là công việc tổng hợp cuối Sprint (M9 theo numbering Rev.2), không phải từng milestone.

## 22. Expected Evidence

| Claim | Evidence |
|---|---|
| TanStack Query hoạt động | Test M1.2 pass + đọc `App.tsx`/`render.tsx` xác nhận hết `TODO(Core)` |
| `ApiError` đúng shape | Test M1.3 (7 case) pass |
| `report-error`/`error-messages` đúng contract | Test M1.4 pass, bao gồm test "known error không gọi reportError" |
| Coordinator single-flight đúng | Test M1.5 (7 case), đặc biệt Test 2/3 với assertion đếm số lần gọi |
| Client boundary đúng | Test M1.6 pass + đọc code xác nhận không còn `authStore.logout()` trong nhánh 401 |
| AppLayout slot đúng | Test M1.7 pass + test F1 cũ (`AppLayout.test.tsx`) không sửa vẫn pass |
| Không regression F1 | Toàn bộ `npm run test` (baseline M1.1 so với sau M1.9) — số lượng test pass F1 cũ không giảm |
| Dependency direction giữ đúng | Đọc thủ công import list của `auth-refresh-coordinator.ts`, `client.ts`, `AppLayout` — ghi vào PR |
| Không scope creep | Đối chiếu Mục 6 (Non-Goals) — không có file nào trong `features/`, `pages/auth/`, `widgets/user-menu/` bị tạo/sửa |

## 23. Final Architect Review

### Architecture
- [x] No shared → feature dependency — `auth-refresh-coordinator.ts` không import `features/*` (Mục 8, 9.5)
- [x] No circular dependency — coordinator không import `client.ts` (Mục 17)
- [x] AppLayout remains business-agnostic — chỉ nhận `ReactNode` (Mục 9.8)
- [x] Refresh coordinator remains business-agnostic — generic `RefreshHandler<T>`, không biết `accessToken`/`user` (Mục 9.5)
- [x] Auth state ownership remains outside shared infrastructure — coordinator không chạm `authStore` (Mục 9.5, Decision M1-DL-03)
- [x] Dependency direction is explicit — Mục 8 có bảng đầy đủ

### Authentication
- [x] Refresh token body is ignored — N/A/chưa áp dụng ở M1 (chưa có `refresh()` thật), nhưng thiết kế generic của coordinator không tạo "chỗ" nào để lỡ lưu nó (Mục 13)
- [x] HttpOnly cookie remains the refresh mechanism — không đổi (backend không bị M1 chạm tới)
- [x] Single-flight is enforced — Mục 9.5, test 2/3
- [x] Infinite refresh loop is impossible — `_retry` flag giữ nguyên + coordinator không tự gọi lại (Mục 9.7)
- [x] Refresh failure can terminate safely — **một phần**: `client.ts` reject đúng, nhưng "chấm dứt session UI" chưa hoàn chỉnh tới M4 (nêu rõ ràng, không giấu — Mục 9.7, Decision M1-DL-05)
- [x] M1 does not implement M4 business logic — Mục 6, 9.5, 9.6 phân định rõ

### API
- [x] ApiError matches actual backend — Mục 9.2, đối chiếu trực tiếp code backend
- [x] Field errors preserve multiple messages — `Record<string,string[]>` giữ nguyên mảng (Mục 12, case 3)
- [x] RFC7807 normalization remains coherent — không đổi logic `errorCode`/`title`/`detail`, chỉ đổi `fieldErrors`
- [x] API client responsibility remains infrastructure-only — Mục 9.7

### State
- [x] TanStack Query is used for server interaction infrastructure — Mục 9.1
- [x] Auth session is not moved into Query Cache — Mục 9.1 nêu rõ
- [x] authStore remains owned by auth feature hooks — M1 không chạm `authStore.ts` (Mục 6)

### Testing
- [x] Single-flight tested — Mục 12
- [x] Concurrent refresh tested — Mục 12
- [x] Refresh failure tested — Mục 12
- [x] Retry behavior tested — Mục 12
- [x] ApiError tested — Mục 12 (7 case)
- [x] report-error tested — Mục 12 (4 case)
- [x] AppLayout slot tested — Mục 12 (4 case)
- [x] F1 regression tests preserved — M1.1 baseline + verify lại mỗi milestone con

### Scope
- [x] No Login UI / No Register UI / No Logout UI / No UserMenu implementation / No Password Reset / No unrelated refactor / No F1 reopening — Mục 6 liệt kê tường minh, đối chiếu Mục 10 (File Impact) xác nhận không file nào ngoài danh sách bị đụng

### Delivery
- [x] One developer can execute M1 — 9 sub-milestone, mỗi cái 1-2 file
- [x] Dependencies are ordered — Mục 11 (Implementation Order có giải thích lệch so với gợi ý mẫu)
- [x] Acceptance criteria are objective — Mục 18, đều verify được bằng lệnh/test cụ thể
- [x] Definition of Done is objective — Mục 19
- [x] Verification commands are real — Mục 20, đọc trực tiếp `package.json`
- [x] No hidden architectural decisions remain — Mục 15 (Decision Log) + Mục 16 (Open Questions, không cái nào blocking)

**Không có mục nào unchecked.** M1 sẵn sàng để bắt đầu implement.

## 24. Handoff to F2 M2

### What M1 provides to M2
- `@tanstack/react-query` đã cấu hình sẵn, dùng ngay được cho `useMutation` trong `features/auth/hooks` (M3, không phải M2, nhưng hạ tầng đã sẵn sàng).
- `ApiError` với `fieldErrors: Record<string,string[]>` đúng thật — M2 viết `api/register.ts`/`login.ts` có thể tin tưởng shape này khi bắt lỗi.
- `report-error`/`error-messages` — M2 chưa cần dùng trực tiếp (đó là UI M5/M6), nhưng hạ tầng đã ổn định.
- `shared/api/auth-refresh-coordinator.ts` với `setRefreshHandler<T>()`/`coordinateRefresh<T>()` — **M2 sẽ là nơi ĐẦU TIÊN thực sự gọi `setRefreshHandler(refresh)`** sau khi viết `features/auth/api/refresh.ts`.
- `client.ts` đã sẵn sàng gọi coordinator khi 401 — không cần M2 sửa `client.ts`.
- `AppLayout.headerActions` — M2 không dùng trực tiếp (đó là M7), nhưng slot đã tồn tại.

### What M2 is now allowed to implement
- `features/auth/model/schema.ts` (Zod `registerSchema`, `loginSchema`).
- `features/auth/api/{register,login,refresh,logout}.ts` — gọi `apiClient` (từ `shared/api/client.ts`) thô, trả `Promise<DTO>`.
- Ngay khi `refresh.ts` tồn tại: gọi `setRefreshHandler(refresh)` — quyết định chính xác gọi ở đâu (`features/auth/index.ts` hay nơi khác) là quyết định của M2 (M1-OQ-2, không blocking).
- DTO/type cho `RegisterResponse`, `AuthResponse`, `UserResponse` khớp backend thật (Mục 3).

### What M2 must NOT redesign

Đóng băng sau M1, M2 **không được** thay đổi:
- Vị trí và API của `auth-refresh-coordinator.ts` (`setRefreshHandler`/`coordinateRefresh`, generic `RefreshHandler<T>`) — nếu M2 thấy API này không đủ dùng, đó là Open Question cần quay lại thảo luận, không tự ý sửa.
- `ApiError` shape (`fieldErrors: Record<string,string[]>`).
- Vị trí `report-error.ts`/`error-messages.ts` và hợp đồng gọi (`reportError` không gọi cho lỗi nghiệp vụ đã biết).
- `client.ts`'s trách nhiệm ranh giới (Mục 9.7) — M2 không được tự thêm business logic vào `client.ts`.
- `AppLayout.headerActions` API — M2 (và M7 sau này) chỉ được *dùng* prop này, không đổi signature.
- Nguyên tắc "coordinator không chạm `authStore`" — nếu M2/M3 cần session cập nhật sau refresh, đó là trách nhiệm của `features/auth` tự làm (ví dụ trong hàm inject vào `setRefreshHandler`, wrapper gọi cả `refresh()` lẫn cập nhật `authStore`), không phải sửa coordinator để nó tự biết `authStore`.
