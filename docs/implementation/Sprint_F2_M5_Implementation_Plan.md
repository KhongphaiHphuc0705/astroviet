# Sprint F2 — M5 Implementation Plan
## Login Page

---

## ⚠️ 2 phát hiện quan trọng cần đọc trước (đọc trực tiếp code thật, `dev` HEAD `ac2431b`)

### Phát hiện 1 — BLOCKER: `createSafeRedirectUrl` không phải hàm validate inbound, mà là hàm construct outbound

Prompt gốc (Mục 8, 20) coi `createSafeRedirectUrl` là "canonical redirect-security mechanism" để **validate** giá trị `redirect` đọc từ URL trước khi dùng làm đích điều hướng sau login. Đọc trực tiếp `shared/lib/redirect-url.ts`:

```ts
export const createSafeRedirectUrl = (
  pathname: string, search: string = "", hash: string = "",
): string => {
  const fullPath = `${pathname}${search}${hash}`;
  const safePath = fullPath.replace(/^\/+/, "/");
  return `/login?redirect=${encodeURIComponent(safePath)}`;   // ← LUÔN trả về URL /login?redirect=...
};
```

Hàm này được `ProtectedRoute.tsx` dùng để **xây dựng** URL `/login?redirect=...` khi đá người dùng chưa đăng nhập ra khỏi route bảo vệ — **không** dùng để kiểm tra 1 giá trị `redirect` đã có sẵn có an toàn để điều hướng tới hay không. Gọi lại hàm này bên trong `LoginPage` là vô nghĩa (nó sẽ trả về `/login?redirect=...` một lần nữa, không phải đích điều hướng thật).

Đúng như comment đã có sẵn trong `ProtectedRoute.tsx` từ trước:
> *"Important for F2: When reading the redirect param in LoginForm, ensure it is validated to be a relative path starting with '/' to prevent Open Redirect vulnerabilities."*

— comment này đã lường trước rằng **chiều ngược lại (validate) chưa tồn tại**, và là việc của F2 (M5) phải bổ sung.

**Phân loại theo đúng yêu cầu prompt gốc Mục 2:**
> **BLOCKER — requires correction before M5 implementation**

**Xử lý (không redesign, không tự viết validate thủ công trong `LoginPage`):** Thêm 1 hàm mới, nhỏ, thuần túy — `getSafeRedirectDestination()` — vào **đúng file đã có** (`shared/lib/redirect-url.ts`), cạnh `createSafeRedirectUrl` (2 nửa của cùng 1 tính năng: 1 nửa outbound đã có từ F1, 1 nửa inbound còn thiếu). Không đổi `createSafeRedirectUrl` hiện có (giữ nguyên chữ ký, hành vi, mọi consumer hiện tại — `ProtectedRoute.tsx` — không bị ảnh hưởng).

### Phát hiện 2 — Corrective nhỏ: `useLoginMutation`'s `mutation.error` chưa được type đúng là `ApiError`

Đọc `features/auth/hooks/useLoginMutation.ts`:
```ts
export function useLoginMutation() {
  return useMutation({ mutationFn: login, onSuccess: (data) => {...} });
}
```
Không khai báo generic `TError` cho `useMutation` → TanStack Query mặc định suy ra `error: Error | null`, không phải `ApiError | null`. Đọc `shared/api/client.ts`'s response interceptor xác nhận: **runtime luôn luôn** reject bằng `new ApiError(...)` (không có đường nào để 1 `AxiosError` thô lọt ra ngoài) — nghĩa là **giá trị thật lúc chạy đã đúng là `ApiError`**, chỉ thiếu khai báo type tường minh.

**Không phải BLOCKER** (M5 vẫn có thể ép kiểu thủ công `as ApiError` để chạy được), nhưng ép kiểu trong `LoginPage` là thực hành xấu, dễ lặp lại sai ở M6 (Register) sau này. **Đề xuất:** sửa đúng 1 dòng trong `useLoginMutation.ts` — thêm generic `useMutation<AuthResponse, ApiError, LoginRequest>({...})` — không đổi hành vi runtime, chỉ khai báo type đúng sự thật đã luôn đúng. Đây là thay đổi tối thiểu, an toàn, thuộc phạm vi "correction" mà prompt gốc cho phép khi có lý do rõ ràng, không phải "redesign M3".

---

## 1. Executive Summary

**Mục đích M5:** Thay placeholder `frontend/src/pages/auth/login/page.tsx` bằng Login Page thật, dùng toàn bộ hạ tầng đã CLOSED từ M1-M4: `loginSchema`, `useZodForm`, `getInputFieldProps`, `useLoginMutation`, `getErrorMessage`, và (sau khi vá Phát hiện 1) `getSafeRedirectDestination`.

**Trạng thái hiện tại:** F2 M1-M4 CLOSED, verify độc lập nhiều lượt liên tiếp không lỗi. F1 cung cấp đầy đủ `AuthLayout`, `GuestRoute`, `Input`/`Button`/`Alert`/`Spinner`, routing.

**Vì sao M5 làm được ngay bây giờ:** Toàn bộ dependency (API, hook, store, session bootstrap, error infra) đã tồn tại và đã verify đúng — chỉ thiếu 1 hàm nhỏ (Phát hiện 1) cần bổ sung trước khi viết `LoginPage`.

**Kết quả mong đợi:** Đăng nhập thành công điều hướng đúng đích (mặc định `/app` hoặc redirect hợp lệ); lỗi hiện đúng tiếng Việt cuối cùng; không có Open Redirect; 0 vi phạm accessibility.

---

## 2. Current-State Verification

### M1
- `ApiError` (`shared/api/client.ts`): `{status, errorCode, title, detail?, fieldErrors?}` — **verified**, mọi lỗi từ `apiClient` đều là instance này (đọc interceptor trực tiếp).
- `getErrorMessage(errorCode: string): string` (`shared/lib/error-messages.ts`) — **verified**: map 5 mã (`INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `TOKEN_EXPIRED`, `UNAUTHORIZED`, `MALFORMED_REQUEST`); mã lạ → fallback an toàn + tự `reportError` nội bộ (không cần `LoginPage` xử lý case "unknown code" riêng).
- `createSafeRedirectUrl` — **verified, nhưng khác chức năng giả định** (Phát hiện 1).
- Shared UI: `Input` (prop `error?: string|boolean`, đã có toggle hiện/ẩn mật khẩu tích hợp sẵn cho `type="password"`), `Button` (`isLoading` tự render `Spinner` nội bộ + `aria-busy`/`aria-disabled`, KHÔNG cần đặt `Spinner` riêng cạnh nút submit), `Alert` (`title: ReactNode` bắt buộc, `variant="danger"` tự set `role="alert"`), `Spinner` (dùng ở `GuestRoute`/`ProtectedRoute`, không cần dùng trực tiếp trong `LoginPage`) — **verified bằng đọc source**.

### M2
- `login(input: LoginRequest): Promise<AuthResponse>` (`features/auth/api/login.ts`) — **verified**, POST `/api/v1/auf/login`, không side-effect.
- `LoginRequest = {email, password}`, `AuthResponse = {accessToken, refreshToken, expiresIn, user}` — **verified** từ `types.ts`.

### M3
- `loginSchema` (`features/auth/model/schema.ts`): `{email: string (trim, lowercase, email), password: string (min 1)}` — **verified nguyên văn**.
- `useLoginMutation()` (`features/auth/hooks/useLoginMutation.ts`): `useMutation({mutationFn: login, onSuccess: (data) => setSession(data.user, data.accessToken)})` — **verified**; trả về `UseMutationResult` chuẩn TanStack Query (`mutate`, `mutateAsync`, `isPending`, `isError`, `isSuccess`, `error`, `data`). `error` type hiện là `Error|null` (Phát hiện 2).
- `authStore`: `{status, accessToken, user, setSession, clearSession}` — **verified**, `LoginPage` **không** tự gọi `setSession`/`clearSession` (đã là trách nhiệm của hook, M3).

### M4
- `useSessionBootstrap()` gọi lúc app khởi động (`App.tsx`), không liên quan trực tiếp `LoginPage` — **verified**, không cần `LoginPage` chờ/kiểm tra gì thêm (đến lúc `LoginPage` render, `status` đã rời `resolving` — do `GuestRoute`, xem dưới).
- Refresh coordinator (single-flight) — không liên quan trực tiếp M5, không đổi.

### Routing/Guard (F1, không đổi)
- `router.tsx`: `/login` nằm trong `GuestRoute > AuthLayout > Suspense > Outlet` — **verified nguyên văn**.
- `GuestRoute.tsx`: nếu `status==="authenticated"` → `<Navigate to="/app" replace />` (không đọc `redirect` param) — **verified**. Kết luận: **người dùng đã đăng nhập không bao giờ thấy `LoginPage` render** — đây là hành vi có sẵn, M5 không cần tự viết guard nào trong `LoginPage`.
- `AuthLayout` bọc sẵn logo + card (`max-w-md`, padding, shadow) — `LoginPage` chỉ cần render nội dung bên trong (heading, form, links), không tự bọc `Container`/`Stack` lần nữa.

### UI Spec (`docs/frontend/Frontend_UI_Specification.md` §10.3) — đối chiếu copy thật

| Yêu cầu UI Spec | Trong scope M5? | Xử lý |
|---|---|---|
| Field Email, Password | ✅ | Đúng `loginSchema` |
| CTA `Button variant="primary" fullWidth` "Đăng nhập" | ✅ | Dùng nguyên văn |
| Lỗi "Email hoặc mật khẩu không đúng" | ✅ | Khớp **chính xác** với `getErrorMessage("INVALID_CREDENTIALS")` đã có sẵn trong `error-messages.ts` — không cần sửa dictionary |
| "Chưa có tài khoản? Đăng ký" | ✅ | Mục 10, trong scope M5 (chỉ là link, không phải implement Register) |
| Checkbox "Ghi nhớ đăng nhập" | ❌ **Không đưa vào M5** | `loginSchema` không có field này, backend login contract không nhận flag "remember" — thêm vào sẽ chỉ là UI trang trí không có tác dụng thật. Ghi nhận Known Gap, không tự ý thêm |
| Link "Quên mật khẩu?" | ❌ **Không đưa vào M5** | Đã là Open Question chưa chốt trong UI Spec §25 (backend Sprint 1 chưa có Forgot Password) + Non-Goal tường minh của prompt gốc Mục 18 |

**Kết luận Current-State:** Không có gì UNVERIFIED mang tính blocking ngoài Phát hiện 1 (đã có hướng xử lý cụ thể).

---

## 3. Dependencies

- F2 M1-M4 — CLOSED (verify độc lập, không redesign).
- F1 shared UI + `AuthLayout` + `GuestRoute` — CLOSED, dùng nguyên trạng.
- **Precondition bắt buộc trước khi viết `LoginPage`:** Phát hiện 1 (`getSafeRedirectDestination`) phải được thêm vào `shared/lib/redirect-url.ts` trước.
- **Khuyến nghị đi kèm (không bắt buộc để bắt đầu, nhưng nên làm cùng lúc):** Phát hiện 2 (generic type cho `useLoginMutation`).

---

## 4. Architecture / Dependency Graph

```
pages/auth/login/page.tsx  (SỬA — nội dung thật)
   ↓
features/auth (@features/auth)
   ↓ useLoginMutation()
   ↓ (không đổi API, chỉ thêm generic type — Phát hiện 2)

pages/auth/login/page.tsx
   ↓
features/auth/model/schema.ts → loginSchema
   ↓
shared/hooks/useZodForm → useZodForm(loginSchema)

pages/auth/login/page.tsx
   ↓
shared/lib/formFields.ts → getInputFieldProps(name, form)

pages/auth/login/page.tsx
   ↓
shared/lib/error-messages.ts → getErrorMessage(error.errorCode)

pages/auth/login/page.tsx
   ↓
shared/lib/redirect-url.ts → getSafeRedirectDestination(param)  [MỚI — Phát hiện 1]

pages/auth/login/page.tsx
   ↓
react-router-dom → useNavigate(), useSearchParams(), Link
```

**Không có vi phạm dependency direction:** `pages/*` được phép import `features/*` và `shared/*` (chiều xuống hợp lệ theo `app→pages→widgets→features→entities→shared`). Không có `shared → features`/`shared → pages` nào được tạo mới.

---

## 5. Detailed Implementation Design

### 5.1 Cấu trúc trang
`LoginPage` là component mặc định (export default), render trực tiếp bên trong `AuthLayout` (đã bọc sẵn ở `router.tsx`, không tự thêm layout). Nội dung: heading "Đăng nhập" → form → Alert lỗi (nếu có) → link phụ ("Chưa có tài khoản? Đăng ký").

### 5.2 Form
```ts
const form = useZodForm(loginSchema);
```
2 field: `email`, `password` — dùng `getInputFieldProps("email", form)`/`getInputFieldProps("password", form)` spread trực tiếp vào `<Input>`. `password` field dùng `type="password"` (Input tự có toggle hiện/ẩn tích hợp sẵn — không cần code thêm).

### 5.3 Validation
Hoàn toàn qua `loginSchema` (Zod) — không viết validate thủ công. `useZodForm` mặc định `mode:"onBlur"`, `reValidateMode:"onChange"` (đã xác nhận từ code F1) — hành vi hiện lỗi khi blur, cập nhật lại khi gõ tiếp, giữ nguyên, không override.

### 5.4 Submit lifecycle
```ts
const loginMutation = useLoginMutation();
const navigate = useNavigate();
const [searchParams] = useSearchParams();
const destination = getSafeRedirectDestination(searchParams.get("redirect"));

const onSubmit = form.handleSubmit((values) => {
  loginMutation.mutate(values, {
    onSuccess: () => navigate(destination, { replace: true }),
  });
});
```
**Quan trọng:** `onSuccess` truyền vào `.mutate()` (cấp gọi) là **bổ sung**, không thay thế `onSuccess` đã khai báo bên trong `useLoginMutation` (cấp hook, M3, gọi `setSession`) — TanStack Query chạy **cả 2**, theo đúng thứ tự (hook-level trước, call-level sau). `LoginPage` **không** tự gọi `setSession`/`clearSession` — giữ đúng ranh giới M3.

### 5.5 Loading state
```tsx
<Button type="submit" variant="primary" fullWidth isLoading={loginMutation.isPending} disabled={loginMutation.isPending}>
  Đăng nhập
</Button>
```
`isLoading` tự vô hiệu hóa tương tác (qua `onClick` guard nội bộ của `Button`) + tự hiện `Spinner` đè lên nút (đã xác nhận từ source `Button/index.tsx`) — **không** cần đặt `Spinner` riêng. `disabled` thêm tường minh để chống double-submit qua phím Enter (Button's `disabled` prop set `aria-disabled` + chặn click, nhưng form `onSubmit` qua Enter vẫn có thể trigger nếu không disable input — nên **cả 2 field `Input` cũng disable khi `isPending`**: `disabled={loginMutation.isPending}`).

### 5.6 Error state
```tsx
{loginMutation.isError && (
  <Alert variant="danger" title={getErrorMessage((loginMutation.error as ApiError).errorCode)} />
)}
```
(Sau khi áp dụng Phát hiện 2, không cần ép kiểu `as ApiError` — `loginMutation.error` đã đúng type.) Alert hiện phía trên form (đúng UI Spec §10.2 pattern áp dụng tương tự cho Login). Field-level error (email/password) hiện riêng qua `Input`'s `error` prop — **tách biệt** khỏi `Alert` (Alert chỉ dành cho lỗi cấp toàn form từ API, không phải lỗi Zod cấp field).

### 5.7 Success state
Không render gì đặc biệt — điều hướng xảy ra ngay (Mục 5.4), người dùng rời khỏi `LoginPage` trước khi cần hiện trạng thái "thành công" riêng.

### 5.8 Redirect parsing
```ts
const [searchParams] = useSearchParams();
const redirectParam = searchParams.get("redirect");
```

### 5.9 Redirect validation
```ts
const destination = getSafeRedirectDestination(redirectParam); // Mục 6
```

### 5.10 Navigation
`useNavigate()` (react-router-dom) — đây là abstraction điều hướng DUY NHẤT đã có trong dự án (không có wrapper tùy chỉnh nào khác được tạo ở F1-F2). `{replace: true}` để không lưu `/login` vào history (tránh người dùng bấm Back quay lại trang login sau khi đã đăng nhập).

### 5.11 Register link
```tsx
<Link to="/register" className="text-body-sm text-accent-primary underline-offset-4 hover:underline">
  Chưa có tài khoản? Đăng ký
</Link>
```
Dùng `Link` từ `react-router-dom` trực tiếp — **không** có component `Link`/`TextLink` nào trong `shared/ui` (đã grep xác nhận, chỉ có `SkipLink` không liên quan). Không ép qua `Button as={Link}` vì `ButtonProps`'s type (`ButtonHTMLAttributes & AnchorHTMLAttributes`) không khai báo prop `to` của React Router, gây lỗi typecheck nếu dùng `as={Link} to=...`. Class Tailwind copy đúng "công thức" của `Button variant="link"` (`text-accent-primary underline-offset-4 hover:underline`) để nhất quán thị giác mà không cần sửa `Button`.

### 5.12 Accessibility
`Input` tự có `aria-invalid`/`aria-describedby` khi có lỗi (đã xác nhận từ source). `Alert variant="danger"` tự có `role="alert"`. `Button isLoading` tự có `aria-busy`. Không cần thêm ARIA thủ công nào — chỉ cần đảm bảo `label` prop được truyền cho cả 2 `Input` (bắt buộc theo `InputProps`, dùng "Email"/"Mật khẩu").

---

## 6. Redirect Security Design

**Nguồn:** `searchParams.get("redirect")` — giá trị này do `ProtectedRoute` tạo ra qua `createSafeRedirectUrl()` khi đá người dùng ra khỏi route bảo vệ (ví dụ `/app/settings` → `/login?redirect=%2Fapp%2Fsettings`), NHƯNG cũng có thể bị người dùng/kẻ tấn công tự gõ tay bất kỳ giá trị nào vào URL (`/login?redirect=https://evil.com`) — **không được tin tưởng chỉ vì nó đến từ URL của chính ứng dụng**.

**Hàm mới (Phát hiện 1), thêm vào `shared/lib/redirect-url.ts`:**
```ts
export const getSafeRedirectDestination = (
  redirectParam: string | null,
  fallback: string = "/app",
): string => {
  if (!redirectParam) return fallback;
  if (!redirectParam.startsWith("/")) return fallback;   // chặn absolute URL: https://evil.com, evil.com
  if (redirectParam.startsWith("//")) return fallback;    // chặn protocol-relative URL: //evil.com
  return redirectParam;
};
```

**Control flow đầy đủ:**
1. `searchParams.get("redirect")` → có thể là `null`, chuỗi rỗng, đường dẫn hợp lệ, hoặc chuỗi tấn công.
2. `getSafeRedirectDestination()`:
   - `null`/`""` (falsy) → trả `fallback` (`"/app"`).
   - Không bắt đầu bằng `/` (ví dụ `https://evil.com`, `evil.com`, `javascript:alert(1)`) → trả `fallback`.
   - Bắt đầu bằng `//` (protocol-relative, trình duyệt hiểu là external origin) → trả `fallback`.
   - Còn lại (relative path đúng 1 dấu `/` đầu) → trả nguyên giá trị, dùng làm đích điều hướng.
3. `navigate(destination, {replace:true})` — `react-router-dom`'s `navigate()` với string bắt đầu bằng `/` luôn điều hướng nội bộ (client-side), không bao giờ rời khỏi origin hiện tại — đây là lớp bảo vệ thứ 2 tự nhiên (kể cả nếu bước 2 có sót gì, `navigate()` của React Router không có cách nào điều hướng ra ngoài domain từ 1 string tương đối).

**Vì sao không có Open Redirect:** giá trị dùng làm đích điều hướng LUÔN là 1 trong 2: (a) `fallback="/app"` (hardcode, an toàn tuyệt đối), hoặc (b) 1 chuỗi đã qua kiểm tra bắt đầu bằng đúng 1 dấu `/` — không thể là URL tuyệt đối, không thể là protocol-relative, và bản thân cơ chế `navigate()` của React Router chỉ thao tác trong SPA history, không set `window.location.href` cho giá trị bất kỳ.

**Nhất quán với `createSafeRedirectUrl` đã có:** cùng threat model (chặn leading `//`) — không phát minh security posture mới, không mở rộng phạm vi (không xử lý các kỹ thuật bypass hiếm gặp hơn như backslash `/\evil.com` — ghi nhận là hardening tương lai, không phải yêu cầu M5, xem Mục 17 Open Questions).

---

## 7. Error Flow

```
API 401 INVALID_CREDENTIALS
    ↓
client.ts response interceptor → new ApiError(title, 401, "INVALID_CREDENTIALS", title, detail, fieldErrors)
    ↓
login() (M2) → reject(apiError) nguyên trạng, không catch
    ↓
useLoginMutation() (M3) → mutation.error = apiError (sau Phát hiện 2, đúng type ApiError)
    ↓
LoginPage: loginMutation.isError === true
    ↓
getErrorMessage(loginMutation.error.errorCode)   // "INVALID_CREDENTIALS" → "Email hoặc mật khẩu không đúng."
    ↓
<Alert variant="danger" title="Email hoặc mật khẩu không đúng." />
```

**`error.title` không phải nguồn message cuối cùng** — `error.title` (đến từ RFC7807 `title` field backend trả, tiếng Anh kỹ thuật) không bao giờ được render trực tiếp cho người dùng ở M5.

**Mã lỗi lạ (không phải INVALID_CREDENTIALS/EMAIL_ALREADY_EXISTS/...):** `getErrorMessage()` đã tự xử lý (fallback "Đã có lỗi xảy ra, vui lòng thử lại." + tự gọi `reportError` nội bộ) — `LoginPage` không cần thêm logic riêng cho trường hợp này, chỉ cần gọi `getErrorMessage()` đồng nhất cho mọi `errorCode`.

**Không tự gọi `reportError` trong `LoginPage`:** lỗi 401 khi login là **expected authentication error** (người dùng gõ sai), không phải unexpected/system error — đúng nguyên tắc §15 prompt gốc, tránh double-logging (việc gọi `reportError` cho mã lạ đã nằm trong `getErrorMessage()`, không lặp lại ở `LoginPage`).

---

## 8. UI/UX Behavior

| Trạng thái | Hiển thị |
|---|---|
| Mặc định | Heading "Đăng nhập", form 2 field, nút "Đăng nhập", link "Chưa có tài khoản? Đăng ký" |
| Đang submit (`isPending`) | Cả 2 `Input` disable, `Button` `isLoading` (Spinner nội bộ + disable) |
| Lỗi field (Zod, blur) | `Input`'s `error` hiện dưới field tương ứng |
| Lỗi API (401) | `Alert variant="danger"` phía trên form, giữ nguyên giá trị đã nhập (không tự `reset()` form) |
| Thành công | Điều hướng ngay, không hiện trạng thái riêng |

---

## 9. Test Plan

| ID | Scenario | Setup | Action | Expected |
|---|---|---|---|---|
| M5-T01 | Invalid email | Không mock API | Nhập email sai định dạng, blur, submit | Lỗi Zod hiện dưới field; **0 lần gọi** `POST /api/v1/auth/login` (spy MSW) |
| M5-T02 | Login success, mặc định | MSW `POST /login` → 200 `AuthResponse` | `/login` (không query), nhập đúng, submit | `navigate("/app", {replace:true})` được gọi (assert qua `MemoryRouter` initialEntries + kiểm tra route hiện tại, hoặc mock `useNavigate`) |
| M5-T03 | Login success, redirect hợp lệ | MSW 200 | `/login?redirect=%2Fapp%2Fsettings`, submit | Điều hướng tới `/app/settings` |
| M5-T04 | Invalid credentials | MSW `POST /login` → 401 `INVALID_CREDENTIALS` | Submit | `Alert variant="danger"` hiện đúng text "Email hoặc mật khẩu không đúng."; **không** hiện `error.title` |
| M5-T05 | Unsafe redirect | MSW 200 | `/login?redirect=https%3A%2F%2Fevil.example`, submit | Điều hướng tới `/app` (fallback), **không** tới `evil.example` |
| M5-T06 | Accessibility | Render mặc định + trạng thái lỗi | `vitest-axe` | 0 vi phạm ở cả 2 trạng thái |

**Nguyên tắc test (đúng §11 prompt gốc):** assert hành vi quan sát được (điều hướng tới đâu, text nào hiện ra, số lần API bị gọi) — không assert chi tiết implementation nội bộ (không kiểm tra `authStore` state trực tiếp trong test M5, vì đó đã là trách nhiệm/test của `useLoginMutation`, M3, không cần lặp lại).

---

## 10. MSW Plan

- **Handler có sẵn:** Không có handler dùng chung cho `/api/v1/auth/login` — mỗi test file (`useLoginMutation.test.tsx`, M3) tự `server.use()` cục bộ, **không** phải factory tái sử dụng được. `LoginPage.test.tsx` (M5) sẽ tự định nghĩa `server.use()` riêng, đúng convention đã có (không tạo factory mới — quy mô hiện tại 1-2 handler/file không cần trừu tượng hóa thêm).
- **Handler cần cho M5:** `POST /api/v1/auth/login` → 200 (`AuthResponse` đầy đủ) cho T02/T03/T05; → 401 `INVALID_CREDENTIALS` cho T04.
- **Cookie/session modeling:** **Không cần** — M5 không test refresh/session persistence (đó là M4, đã test riêng); `AuthResponse` mock không cần cookie thật, chỉ cần đúng shape JSON.
- **Không trùng lặp handler:** dùng `msw-server.ts`'s `server` (import `@test/msw-server`), không tạo `setupServer` mới.

---

## 11. File-by-File Change Plan

### Required files

```
File: frontend/src/shared/lib/redirect-url.ts
Purpose: Thêm hàm validate inbound redirect param (Phát hiện 1)
Changes: Thêm export `getSafeRedirectDestination()`; KHÔNG đổi `createSafeRedirectUrl` hiện có
Dependencies: Không
Tests: Thêm case vào redirect-url.test.ts (null/rỗng/hợp lệ/protocol-relative/absolute)
Risk: Thấp — thuần cộng thêm, không đổi hành vi cũ

File: frontend/src/pages/auth/login/page.tsx
Purpose: Thay placeholder bằng Login Page thật
Changes: Toàn bộ nội dung (Mục 5)
Dependencies: loginSchema, useZodForm, getInputFieldProps, useLoginMutation, getErrorMessage, getSafeRedirectDestination, Input/Button/Alert (shared/ui), Link/useNavigate/useSearchParams (react-router-dom)
Tests: frontend/src/pages/auth/login/page.test.tsx (mới)
Risk: Trung bình — file trung tâm của M5
```

### Optional (khuyến nghị mạnh, Phát hiện 2)

```
File: frontend/src/features/auth/hooks/useLoginMutation.ts
Purpose: Type đúng mutation.error là ApiError thay vì Error mặc định
Changes: Thêm generic <AuthResponse, ApiError, LoginRequest> vào useMutation() — 1 dòng
Dependencies: Import thêm ApiError từ @shared/api/client
Tests: Không cần test mới (hành vi runtime không đổi) — test hiện có (M3) vẫn pass nguyên
Risk: Rất thấp — thuần type annotation, đã verify runtime luôn đúng ApiError
```

### Files that must NOT be touched

`features/auth/api/login.ts`, `features/auth/model/schema.ts`, `shared/api/client.ts`, `shared/api/auth-refresh-coordinator.ts`, `shared/stores/authStore.ts`, `app/routing/*`, `app/router.tsx`, `widgets/auth-layout/*`, `pages/auth/register/*` (thuộc M6).

---

## 12. M5 Milestone Breakdown

### M5.1 — Current-State Verification
Đọc lại Mục 2 tại thời điểm bắt đầu code (re-verify `git log`, không tin lại báo cáo cũ nếu có commit mới).

### M5.2 — Vá Phát hiện 1 (bắt buộc, làm trước)
Thêm `getSafeRedirectDestination()` vào `redirect-url.ts` + test. **Files:** `redirect-url.ts`, `redirect-url.test.ts`. **Dependencies:** M5.1. **Acceptance:** 5 case test (Mục 6) pass, `createSafeRedirectUrl` không đổi hành vi (test cũ vẫn pass).

### M5.3 — Login Page Structure
Heading + `AuthLayout` content shell + link Register (Mục 5.1, 5.11). **Files:** `page.tsx`. **Dependencies:** Không. **Acceptance:** Render không lỗi, có heading + link `/register`.

### M5.4 — Form + Zod Validation
`useZodForm(loginSchema)` + `getInputFieldProps` cho 2 field (Mục 5.2-5.3). **Dependencies:** M5.3. **Tests:** M5-T01. **Acceptance:** Sai định dạng → lỗi Zod, 0 API call.

### M5.5 — Login Mutation Integration
`useLoginMutation()`, `onSubmit` (Mục 5.4). **Dependencies:** M5.2 (Phát hiện 1 xong để có `destination`), M5.4. Khuyến nghị làm cùng lúc Phát hiện 2. **Tests:** M5-T02, M5-T03. **Acceptance:** Login thành công điều hướng đúng đích (mặc định + redirect hợp lệ).

### M5.6 — Loading + Error UI
`isPending` → disable + `Button isLoading`; `isError` → `Alert` (Mục 5.5-5.6). **Dependencies:** M5.5. **Tests:** M5-T04. **Acceptance:** Lỗi hiện đúng message cuối cùng, không phải `error.title`.

### M5.7 — Redirect Security Verification
Test riêng cho trường hợp tấn công (Mục 6). **Dependencies:** M5.2, M5.5. **Tests:** M5-T05. **Acceptance:** Không Open Redirect.

### M5.8 — Unit/Component/Integration Tests
Hoàn thiện toàn bộ bảng Mục 9 còn thiếu. **Dependencies:** M5.2-M5.7.

### M5.9 — Accessibility Verification
`vitest-axe` cho cả trạng thái mặc định và lỗi (M5-T06). **Dependencies:** M5.6.

### M5.10 — Final Verification & Closure
Chạy đủ Mục 15; grep dependency direction; đối chiếu Acceptance/Exit Criteria; Manual QA (đăng nhập thật trên trình duyệt nếu có thể, hoặc qua Storybook/dev server).

---

## 13. Acceptance Criteria

### AC-M5-1 (bắt buộc theo prompt gốc)
> Login thành công điều hướng đúng đích — verify bằng M5-T02 (mặc định `/app`) và M5-T03 (redirect hợp lệ).

### AC-M5-2 (bắt buộc theo prompt gốc)
> Lỗi hiển thị đúng message tiếng Việt cuối cùng ngay từ M5, dùng `getErrorMessage(error.errorCode)`, không dùng `error.title` — verify bằng M5-T04.

### AC-M5-3 (bắt buộc theo prompt gốc)
> Không có Open Redirect — verify bằng M5-T05 + Mục 6 (control flow).

### Bổ sung (phát sinh từ codebase thật)
- [ ] `getSafeRedirectDestination()` tồn tại, không đổi `createSafeRedirectUrl` hiện có
- [ ] `loginSchema`/`useZodForm`/`getInputFieldProps` dùng nguyên trạng, không viết lại validate
- [ ] `useLoginMutation()` dùng nguyên trạng (chỉ thêm type, không đổi hành vi)
- [ ] Không tạo error dictionary thứ 2, không hardcode message tiếng Việt nào ngoài `error-messages.ts`
- [ ] Không tự gọi `setSession`/`clearSession` trong `LoginPage`
- [ ] Register link trỏ `/register`, không implement Register
- [ ] 0 vi phạm accessibility (`vitest-axe`)
- [ ] 0 vi phạm dependency direction

---

## 14. Definition of Done

Đúng nguyên văn Mục 26 prompt gốc — đối chiếu: placeholder đã thay hoàn toàn; form/schema/hook/error dictionary đều dùng nguyên trạng đã có; loading dùng `mutation.isPending`; lỗi qua `getErrorMessage(error.errorCode)`, không `error.title`; redirect an toàn (mặc định `/app`, hợp lệ dùng đúng đích, không hợp lệ về `/app`); Register link đúng; invalid email = 0 API call; INVALID_CREDENTIALS scenario pass; a11y 0 lỗi; test/typecheck/lint/format pass; không scope creep.

---

## 15. Exit Criteria

```
✓ npm run test          — pass (bao gồm regression F1-M4)
✓ npm run typecheck      — pass
✓ npm run lint           — pass
✓ npm run format:check   — pass
✓ npm run build          — pass
✓ vitest-axe             — 0 violations
```

- Không blocker chưa giải quyết (Phát hiện 1 đã có hướng xử lý cụ thể trong plan này, không còn là blocker mở)
- Không lỗi bảo mật chưa xử lý
- Không error handling tạm thời
- Không TODO/FIXME mới cho hành vi core M5
- Không vi phạm dependency direction (grep xác nhận)
- Không Open Redirect path
- Manual QA (đăng nhập thật) pass

---

## 16. Risk Register

| Risk | Likelihood | Impact | Mitigation | Verification |
|---|---|---|---|---|
| Redirect validation không khớp giữa `createSafeRedirectUrl` (outbound) và `getSafeRedirectDestination` (inbound) | Thấp (đã thiết kế cùng threat model) | Cao nếu sai (Open Redirect) | Dùng chung logic chặn leading `//`, test cả 2 chiều (M5-T03, M5-T05) | Test cases Mục 9 |
| Mutation success/navigation timing (điều hướng trước khi `setSession` cập nhật xong) | Thấp | Trung bình | TanStack Query chạy `onSuccess` tuần tự trong cùng microtask; `setSession` (hook-level) chạy TRƯỚC `navigate` (call-level) — đúng thứ tự React Query đảm bảo | Đọc source TanStack Query behavior + M5-T02 quan sát kết quả cuối |
| `authStore`/session state không đồng bộ khi test | Thấp | Thấp | `LoginPage` không tự đọc/ghi `authStore` trực tiếp — chỉ dựa vào `useLoginMutation`'s side-effect đã test riêng ở M3 | Không cần test riêng ở M5 |
| MSW cookie/session modeling thiếu | Không áp dụng | — | M5 không cần test cookie — đã xác nhận M4 sở hữu phần này | Mục 10 |
| API error shape mismatch (`error.errorCode` không tồn tại) | Rất thấp | Trung bình | Đã verify trực tiếp `ApiError` luôn có `errorCode: string` (Mục 2) | Đọc source `client.ts` |
| Form abstraction dùng sai (bỏ qua `getInputFieldProps`, tự viết `register()` thủ công) | Thấp | Trung bình | Review checklist đối chiếu Mục 5.2 | Code review |
| Accessibility regression (thiếu `label`, `Alert` không đọc được bởi screen reader) | Thấp | Trung bình | `Input`/`Alert` đã có sẵn ARIA đúng (Mục 2) — chỉ cần truyền đúng prop `label` | M5-T06 |
| Loading/duplicate submission (bấm Enter nhiều lần lúc `isPending`) | Trung bình | Trung bình | Disable cả `Input` lẫn `Button` khi `isPending` (Mục 5.5) | Test thủ công + review |
| Người dùng đã đăng nhập vào `/login` | Không áp dụng (đã giải quyết ở F1) | — | `GuestRoute` chặn từ trước, `LoginPage` không bao giờ render trong trường hợp này | Đọc source `GuestRoute.tsx` (Mục 2) |

---

## 17. Decision Log / Open Questions

| ID | Quyết định/Câu hỏi | Bằng chứng | Khuyến nghị | Impact |
|---|---|---|---|---|
| M5-D1 | Thêm `getSafeRedirectDestination()` vào `redirect-url.ts` thay vì viết validate thủ công trong `LoginPage` | Phát hiện 1 | Đã quyết định, thực hiện ở M5.2 | Bắt buộc trước khi viết `LoginPage` |
| M5-D2 | Sửa generic type `useLoginMutation` để `error` đúng là `ApiError` | Phát hiện 2 | Nên làm cùng M5 (rủi ro thấp, lợi ích rõ) | Tùy chọn nhưng khuyến nghị mạnh — nếu không làm, `LoginPage` phải tự ép kiểu `as ApiError` |
| M5-OQ-1 | UI Spec §10.3 yêu cầu checkbox "Ghi nhớ đăng nhập" và link "Quên mật khẩu?" — có đưa vào M5 không? | UI Spec §10.3; `loginSchema` không có field tương ứng; backend không hỗ trợ; prompt gốc liệt kê Forgot Password là Non-Goal | **Không đưa vào M5** — cả 2 đều thiếu nền tảng thật (schema/backend) hoặc đã là Non-Goal tường minh; ghi Known Gap cho milestone tương lai | Không blocking — chỉ là thiếu 2 UI element trang trí/chưa có backend, không ảnh hưởng luồng chính |
| M5-OQ-2 | `getSafeRedirectDestination` có cần chặn thêm các kỹ thuật bypass hiếm (backslash, control character) không? | Không có yêu cầu cụ thể từ prompt gốc; `createSafeRedirectUrl` hiện tại cũng chỉ chặn leading `//` | Giữ nguyên phạm vi tối thiểu khớp `createSafeRedirectUrl` đã có — không mở rộng threat model ngoài yêu cầu | Không blocking — có thể hardening thêm ở milestone bảo mật tương lai nếu cần |

Không còn câu hỏi nào khác ngoài 2 mục trên — không tạo Open Question giả.

---

## 18. Architect Review

| # | Câu hỏi | Kết quả |
|---|---|---|
| 1 | Login Page chỉ phụ thuộc tầng cho phép? | **PASS** — chỉ `features/auth`, `shared/*`, `react-router-dom` |
| 2 | `shared/` còn business-agnostic? | **PASS** — `getSafeRedirectDestination` (mới) là hạ tầng thuần, không biết `LoginPage` tồn tại |
| 3 | Auth business logic vẫn thuộc `features/auth`? | **PASS** — `LoginPage` không tự viết logic auth nào |
| 4 | `useLoginMutation` được tái sử dụng? | **PASS** |
| 5 | `loginSchema` được tái sử dụng? | **PASS** |
| 6 | Error dictionary cuối cùng được tái sử dụng? | **PASS** — không tạo dictionary thứ 2 |
| 7 | `createSafeRedirectUrl` được tái sử dụng thay vì trùng lặp? | **CONCERN → đã xử lý** — hàm này không đúng chức năng giả định (Phát hiện 1); đã bổ sung hàm sibling thay vì viết validate trùng lặp trong `LoginPage` |
| 8 | Refresh logic để lại cho M4? | **PASS** — `LoginPage` không chạm coordinator/session bootstrap |
| 9 | `authStore` dùng đúng kiến trúc M3? | **PASS** — chỉ đọc gián tiếp qua hook, không tự ghi |
| 10 | Navigation nhất quán với routing hiện có? | **PASS** — `useNavigate()`, không có abstraction khác trong dự án |
| 11 | Register nằm ngoài scope M5? | **PASS** — chỉ có link, không implement |
| 12 | Có Open Redirect nào không? | **PASS** — Mục 6 chứng minh control flow đầy đủ |
| 13 | Lỗi API mong đợi được xử lý như lỗi mong đợi (không phải crash)? | **PASS** — không gọi `reportError` cho 401 trong `LoginPage` |
| 14 | Accessibility đã bao phủ? | **PASS** — M5-T06 + component có sẵn ARIA đúng |
| 15 | Test quan sát hành vi, không quá chi tiết implementation? | **PASS** — Mục 9 chỉ assert điều hướng/text/số lần gọi API |
| 16 | MSW tái sử dụng thay vì trùng lặp không cần thiết? | **PASS** — dùng `server` có sẵn, không tạo `setupServer` mới |
| 17 | Scope giữ đúng trong Login Page? | **PASS** — đối chiếu Mục 18 (Non-Goals) prompt gốc, 0 vi phạm |
| 18 | M3/M4 dependencies đã verify thật? | **PASS** — Mục 2, đọc trực tiếp source, không suy diễn |
| 19 | Có circular dependency nào không? | **PASS** — `pages → features/shared`, không có chiều ngược |
| 20 | Có giả định ngầm nào chưa gắn nhãn? | **PASS** — 2 phát hiện đã gắn nhãn rõ (BLOCKER/Corrective), 2 Open Question đã liệt kê tường minh (Mục 17), không còn giả định ẩn |

**Không có mục nào BLOCKER còn mở** — Phát hiện 1 (BLOCKER ban đầu) đã có giải pháp cụ thể tích hợp vào M5.2.

---

## 19. Implementation Order

```
1.  Verify M1-M4 hiện tại (M5.1) — re-run git log, đọc lại Mục 2
2.  Vá Phát hiện 1: thêm getSafeRedirectDestination() + test (M5.2) — BẮT BUỘC TRƯỚC
3.  (Khuyến nghị) Vá Phát hiện 2: generic type useLoginMutation
4.  Login Page structure + Register link (M5.3)
5.  Form + Zod validation (M5.4) — test M5-T01
6.  Login mutation integration + navigation (M5.5) — test M5-T02, T03
7.  Loading + error UI (M5.6) — test M5-T04
8.  Redirect security test riêng (M5.7) — test M5-T05
9.  Hoàn thiện test suite (M5.8)
10. Accessibility verification (M5.9) — test M5-T06
11. typecheck/lint/format/build + dependency-direction grep (M5.10)
12. Manual QA (đăng nhập thật)
13. M5 closure
```

---

## 20. Final Recommendation

```
READY FOR IMPLEMENTATION

Blocking item resolved by this plan: Phát hiện 1 (createSafeRedirectUrl mismatch) —
giải pháp cụ thể đã có (M5.2), không cần quyết định thêm từ bạn trước khi bắt đầu code,
trừ khi bạn muốn tên hàm khác `getSafeRedirectDestination`.

Recommended but non-blocking: Phát hiện 2 (generic type useLoginMutation) — có thể làm
cùng M5 hoặc để riêng, không ảnh hưởng khả năng bắt đầu M5 ngay.
```
