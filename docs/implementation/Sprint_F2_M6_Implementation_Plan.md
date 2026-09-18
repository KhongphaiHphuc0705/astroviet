# F2 M6 — Register Page Implementation Plan

---

## ⚠️ 3 phát hiện quan trọng cần đọc trước (đọc trực tiếp code thật, `dev` HEAD `0625758`)

### Phát hiện 1 — Không có hệ thống toast/notification nào tồn tại; dùng `Alert variant="success"` có sẵn

Prompt gốc (Mục 8, 19) giả định có "notification/toast/message mechanism" đã tồn tại để tái sử dụng. Grep toàn bộ `src/` (`toast|notification|snackbar`) và đọc `uiStore.ts` xác nhận: **không có** — `uiStore` chỉ có `sidebarCollapsed`/`mobileDrawerOpen` (layout state, không liên quan). Không có `Toast`/`Notification`/`Snackbar` component nào trong `shared/ui/`.

**Giải pháp — không phát minh hệ thống mới:** `shared/ui/Alert/index.tsx` (đã dùng cho lỗi ở Login, M5) **đã có sẵn** `variant="success"` (icon `CheckCircle2`, style xanh lá, `role="status"`) — chưa từng được dùng nhưng tồn tại sẵn trong component. Đây chính là "existing UI convention" đúng nghĩa: **tái sử dụng `Alert` với `variant="success"`**, hiện ngay trên trang Register (không cần chuyển trang trước khi hiện), sau đó điều hướng `/login` sau độ trễ ngắn để người dùng kịp đọc thông báo.

### Phát hiện 2 — `useRegisterMutation` chưa khai báo generic type (giống hệt gap đã sửa ở M5 cho `useLoginMutation`)

```ts
// features/auth/hooks/useRegisterMutation.ts — HIỆN TẠI
export function useRegisterMutation() {
  return useMutation({ mutationFn: register });  // ← không có <RegisterResponse, ApiError, RegisterRequest>
}
```
`mutation.error` hiện type `Error | null` thay vì `ApiError | null`, dù runtime luôn là `ApiError` thật (đã verify qua `client.ts` interceptor, không đổi từ M1-M5). Đây là **cùng 1 pattern gap** đã được xác nhận và sửa ở M5 cho `useLoginMutation` (đã CLOSED) — áp dụng đúng tiền lệ đã có, không phải quyết định mới.

### Phát hiện 3 — Defect thật: `displayName` "optional" nhưng thực chất reject chuỗi rỗng, không tương thích với hành vi input HTML

Đọc trực tiếp `registerSchema` (`features/auth/model/schema.ts`):
```ts
displayName: z.string().min(1, "Tên hiển thị không được để trống.").max(100, ...).optional(),
```
Và đọc trực tiếp `schema.test.ts` — có test **đã tồn tại và đang pass**, chủ động khẳng định hành vi này:
```ts
it("rejects empty displayName", () => {
  const result = registerSchema.safeParse({..., displayName: ""});
  expect(result.success).toBe(false);  // ← chuỗi rỗng bị TỪ CHỐI
});
```

**Vấn đề:** `useZodForm` dùng `zodResolver` + RHF's `register()` (uncontrolled input, đọc qua `getInputFieldProps`, không đổi từ M5). Với `<input>` HTML thô, 1 field bị bỏ trống **luôn** đọc ra giá trị `""` (chuỗi rỗng) — **không bao giờ** là `undefined` — bất kể `.optional()` khai báo ở tầng Zod. Kết quả thật: nếu người dùng để trống "Tên hiển thị" (đúng như field được mô tả là optional) và submit, họ sẽ nhận lỗi validation "Tên hiển thị không được để trống." — **field optional hoạt động như bắt buộc trên thực tế**.

**Đây là defect thật trong tương tác Zod↔RHF, không phải giả định sai của prompt** — cần xử lý theo đúng Rule 4 (evidence → defect/wording → smallest correction).

**2 phương án đã cân nhắc:**
- (a) Sửa `registerSchema.ts` (đổi rule + đổi luôn kỳ vọng của test "rejects empty displayName" đang pass) — chạm file M3 sở hữu, đổi hành vi đã có test khẳng định tường minh → footprint lớn, rủi ro cao hơn.
- (b) **Chọn:** Mở rộng `getInputFieldProps()` (`shared/lib/formFields.ts`) thêm tham số thứ 3 tùy chọn để forward RHF's `register(name, options)` — dùng `setValueAs: (v) => (v === "" ? undefined : v)` riêng cho field `displayName` tại `RegisterPage`. Đây là bổ sung **thuần túy cộng thêm** (optional param, mọi lời gọi cũ — `LoginPage`'s 2 field — không đổi hành vi), không chạm `registerSchema.ts`, không đổi bất kỳ test nào đang pass.

**Khuyến nghị: phương án (b)** — nhỏ nhất, không tái mở quyết định M3, không đổi test đã có.

---

## 1. Executive Summary

- **Objective:** Thay `frontend/src/pages/auth/register/page.tsx` (placeholder) bằng form đăng ký thật, dùng nguyên hạ tầng F2 M1-M5.
- **Current state:** Placeholder tĩnh, không form, không API call.
- **Target state:** Form 4 field (`email`, `password`, `confirmPassword`, `displayName` — optional, đã vá Phát hiện 3), validate bằng `registerSchema` có sẵn, gọi `useRegisterMutation()` có sẵn, lỗi 409 map vào field `email`, thành công hiện `Alert variant="success"` rồi điều hướng `/login` — **không** tạo session, **không** vào `/app`.
- **Dependencies:** F2 M1-M5 (CLOSED, verify độc lập nhiều lượt, không đổi ở đây trừ 2 fix nhỏ Phát hiện 2/3).
- **Scope:** 1 file bắt buộc (`page.tsx`) + 1 file test bắt buộc + 2 sửa nhỏ tùy chọn nhưng khuyến nghị mạnh (`useRegisterMutation.ts`, `formFields.ts`).

---

## 2. Repository Verification

| File | Đã đọc? | Xác nhận gì |
|---|---|---|
| `pages/auth/register/page.tsx` | ✅ | Placeholder thuần văn bản, không form |
| `pages/auth/login/page.tsx` (M5) | ✅ | Pattern tham chiếu — `useZodForm`, `getInputFieldProps`, `Alert`, `Button isLoading`, `Link`, `useNavigate` |
| `features/auth/model/schema.ts` | ✅ | `registerSchema` 4 field + `.refine()` confirmPassword; **defect Phát hiện 3** |
| `shared/hooks/useZodForm.ts` | ✅ | `useForm({resolver: zodResolver(schema), mode:"onBlur", reValidateMode:"onChange"})` |
| `features/auth/api/register.ts` | ✅ | `register(input: RegisterRequest): Promise<RegisterResponse>` — POST `/api/v1/auth/register`, dumb wrapper |
| `features/auth/hooks/useRegisterMutation.ts` | ✅ | `useMutation({mutationFn: register})` — **Phát hiện 2**, không `onSuccess`/`onError` |
| `features/auth/api/types.ts` | ✅ | `RegisterRequest{email,password,displayName?}`, `RegisterResponse{user: UserResponse}` |
| `shared/stores/authStore.ts` | ✅ | Không đổi, không đụng ở M6 |
| `shared/api/client.ts` (ApiError) | ✅ | `{status,errorCode,title,detail?,fieldErrors?}`, mọi lỗi reject qua `new ApiError(...)`, không đổi |
| `shared/lib/error-messages.ts` | ✅ | `getErrorMessage("EMAIL_ALREADY_EXISTS") → "Email này đã được đăng ký."`, `isKnownBusinessError()` |
| `shared/lib/formFields.ts` | ✅ | `getInputFieldProps(name, form)` hiện KHÔNG nhận tham số RHF options — cần mở rộng (Phát hiện 3) |
| `app/router.tsx` | ✅ | `/register` nằm trong `GuestRoute > AuthLayout > Suspense`, cùng cấu trúc `/login` |
| `shared/ui/Alert/index.tsx` | ✅ | Có `variant="success"` sẵn (Phát hiện 1) |
| `shared/ui/Input`, `Button` | ✅ | Không đổi từ M5 — `Input.error`, `Button.isLoading` |
| `shared/stores/uiStore.ts` | ✅ | Không có notification field nào (Phát hiện 1) |
| `test/msw-server.ts` | ✅ | `server` export, mỗi test tự `server.use()` |
| `features/auth/hooks/useLoginMutation.test.tsx` | ✅ | Convention: `wrapper` (`QueryClientProvider(createQueryClient())`), MSW `http.post`, `renderHook`/`waitFor` |
| `pages/auth/login/page.test.tsx` (M5) | ✅ | Convention: `MemoryRouter` + `Routes`, `userEvent`, `vitest-axe` — tham chiếu trực tiếp cho `page.test.tsx` của M6 |

Không có file nào được "claim đã inspect" mà chưa thực sự đọc.

---

## 3. Current Architecture Relevant to M6

```
Auth flow:   register() → mutation.error/isSuccess → page tự xử lý (không setSession)
Form flow:   registerSchema (Zod) → useZodForm → getInputFieldProps → <Input>
API flow:    apiClient.post("/api/v1/auth/register") → ApiError normalize (client.ts, không đổi)
Error flow:  ApiError.errorCode → getErrorMessage() (toàn form) HOẶC setError() (field-level, 409)
Routing flow: GuestRoute > AuthLayout > RegisterPage; thành công → navigate("/login")
State flow:  Không có state mới — chỉ TanStack Query mutation state (isPending/isSuccess/isError)
```

---

## 4. M6 Scope

### In scope
- Nội dung thật `pages/auth/register/page.tsx`: form 4 field, validate, submit, loading, lỗi field (409), lỗi form khác (nếu có), thành công (Alert + điều hướng trễ).
- Test cho toàn bộ hành vi trên.
- (Khuyến nghị) Sửa `useRegisterMutation.ts`: thêm generic type (Phát hiện 2).
- (Khuyến nghị) Mở rộng `formFields.ts`'s `getInputFieldProps` thêm tham số RHF options tùy chọn (Phát hiện 3).

### Out of scope
- Forgot Password (dưới mọi hình thức, kể cả placeholder/disabled/"coming soon").
- Auto-login, tạo session, gọi `setSession`.
- Refresh token handling, session bootstrap, refresh coordinator.
- Backend changes.
- Sửa `registerSchema.ts`/`schema.test.ts` (đã có phương án nhỏ hơn — Phát hiện 3).
- Sửa `LoginPage`, `authStore`, `AppLayout`, routing config.
- Toast/notification system mới (đã có `Alert` sẵn — Phát hiện 1).

---

## 5. UX / Functional Specification

| Giai đoạn | Hành vi |
|---|---|
| Mặc định | 4 field trống, submit sẵn sàng, không lỗi server cũ |
| Validate client | Email sai định dạng / password < 8 hoặc không có số / confirmPassword không khớp / displayName > 100 ký tự → lỗi Zod dưới field tương ứng; displayName để trống → **không lỗi** (sau khi vá Phát hiện 3) |
| Submit | `confirmPassword` bị loại khỏi payload trước khi gọi API (không gửi lên backend — backend không có field này) |
| Loading | Cả 4 `Input` disable, `Button isLoading` |
| Lỗi 409 | `setError("email", {message: getErrorMessage("EMAIL_ALREADY_EXISTS")})` — lỗi hiện đúng dưới field Email, không phải Alert toàn form |
| Lỗi khác (400/5xx) | `Alert variant="danger" title={getErrorMessage(error.errorCode)}` — tương tự Login |
| Thành công | `Alert variant="success"` hiện ngay trên trang; form ẩn/disable; sau độ trễ ngắn (khuyến nghị 2000ms) → `navigate("/login")` |

---

## 6. Component / File Design

**`page.tsx` chịu trách nhiệm:** render form, gọi `useZodForm`/`useRegisterMutation`, xử lý submit (strip `confirmPassword`), xử lý `onError` (409 → `setError`, khác → Alert), xử lý `onSuccess` (Alert success + delayed navigate).

**`page.tsx` KHÔNG được chứa:** logic validate thủ công (dùng nguyên `registerSchema`), logic gọi API thô (dùng nguyên `register()`/`useRegisterMutation`), logic quản lý session/authStore, logic refresh, bất kỳ UI Forgot Password nào.

**Dùng từ `features/auth`:** `useRegisterMutation`, `registerSchema`, `RegisterFormValues` (type).
**Dùng từ `shared`:** `useZodForm`, `getInputFieldProps` (mở rộng — Phát hiện 3), `getErrorMessage`, `Input`, `Button`, `Alert`, `Stack`.
**Dùng từ `react-router-dom`:** `useNavigate`, `Link` (link "Đã có tài khoản? Đăng nhập" — chiều ngược của Login's "Chưa có tài khoản? Đăng ký", cùng pattern).

---

## 7. Detailed Implementation Steps

### Step 1 — Verify/reuse register schema và form infrastructure
Đọc lại `registerSchema`, `useZodForm`, `getInputFieldProps` (Mục 2). Xác nhận Phát hiện 3 còn tồn tại tại thời điểm code (chạy lại `schema.test.ts`).

### Step 2 — Vá Phát hiện 3 (làm trước khi viết `page.tsx`)
**File:** `shared/lib/formFields.ts`. Thêm tham số thứ 3 tùy chọn:
```ts
export function getInputFieldProps<T extends FieldValues>(
  name: FieldPath<T>,
  form: FormWithRegisterAndErrors<T> & { register: UseFormRegister<T> },
  registerOptions?: Parameters<UseFormRegister<T>>[1],
): ReturnType<UseFormRegister<T>> & { error: string | undefined } {
  const registered = form.register(name, registerOptions);
  ...
}
```
**Test:** thêm case vào `formFields.test.ts` — gọi với `registerOptions={setValueAs: ...}`, xác nhận forward đúng; gọi không truyền tham số 3 (như `LoginPage` đang dùng) vẫn hoạt động y hệt cũ (regression).

### Step 3 — (Khuyến nghị) Vá Phát hiện 2
**File:** `useRegisterMutation.ts` — thêm generic `useMutation<RegisterResponse, ApiError, RegisterRequest>({mutationFn: register})`.

### Step 4 — Implement Register Page form structure
Heading "ĐĂNG KÝ" (khớp style `text-heading-md font-semibold`, uppercase — đúng pattern `LoginPage`), 4 `Input` (`Email`, `Mật khẩu` `type=password`, `Xác nhận mật khẩu` `type=password`, `Tên hiển thị`), link "Đã có tài khoản? Đăng nhập" → `/login`.

### Step 5 — Wire `useZodForm(registerSchema)` + `getInputFieldProps`
4 field, `displayName` dùng `getInputFieldProps("displayName", form, {setValueAs: (v) => (v === "" ? undefined : v)})` (Phát hiện 3 áp dụng); 3 field còn lại gọi như cũ (không truyền tham số 3).

### Step 6 — Submit handler + payload stripping
```ts
const onSubmit = form.handleSubmit((values) => {
  const { confirmPassword, ...payload } = values;
  registerMutation.mutate(payload, {
    onSuccess: () => {
      setTimeout(() => navigate("/login"), 2000);
    },
    onError: (error) => {
      if (error.errorCode === "EMAIL_ALREADY_EXISTS") {
        form.setError("email", { message: getErrorMessage("EMAIL_ALREADY_EXISTS") });
      }
    },
  });
});
```
`confirmPassword` **không bao giờ** được gửi lên API — đúng Constraint đã ghi ở M2 Decision Log (M2-DL-02).

### Step 7 — Success UI
`{registerMutation.isSuccess && <Alert variant="success" title="Đăng ký thành công! Đang chuyển tới trang đăng nhập..." />}`. Khi `isSuccess`, ẩn hoặc disable toàn bộ form (không cho sửa/submit lại) — tránh double action trong lúc chờ điều hướng.

### Step 8 — Đảm bảo không tạo session
Review: không import `useAuthStore`/`setSession` vào `page.tsx`. `useRegisterMutation` (kể cả sau Phát hiện 2) vẫn không có `onSuccess` nội bộ nào chạm `authStore` — xác nhận đúng F2-D6.

### Step 9 — Đảm bảo Forgot Password vắng mặt hoàn toàn
Review: không có text/link/route/comment nào nhắc "quên mật khẩu"/"forgot password" trong `page.tsx`.

### Step 10 — Implement/extend tests
Bảng đầy đủ ở Mục 10.

### Step 11 — Run verification
`lint`/`typecheck`/`format:check`/`test`/`build` (Mục 19).

---

## 8. Error Handling Matrix

| Scenario | Source | UI behavior | API call? | Field |
|---|---|---|---|---|
| Password mismatch | Client Zod (`registerSchema.refine`) | Lỗi dưới `confirmPassword`: "Mật khẩu không khớp." | Không | `confirmPassword` |
| displayName để trống | Client Zod (sau vá Phát hiện 3) | Không lỗi — coi là không cung cấp | Không (nếu submit) | — |
| Email đã tồn tại | HTTP 409 `EMAIL_ALREADY_EXISTS` | `form.setError("email", {message: getErrorMessage("EMAIL_ALREADY_EXISTS")})` | Có | `email` |
| Lỗi API khác (400/5xx) | `ApiError` | `Alert variant="danger" title={getErrorMessage(error.errorCode)}` | Có | Toàn form |
| Thành công | HTTP 201 | `Alert variant="success"` + điều hướng `/login` sau 2000ms | Có | Không |

---

## 9. Navigation Matrix

| Trạng thái | Đích |
|---|---|
| Vào `/register` lần đầu | Ở lại `/register` (form trống) |
| Validate client fail | Ở lại `/register` |
| 409 duplicate email | Ở lại `/register`, lỗi hiện dưới field `email` |
| Đăng ký thành công | `/login` (sau delay) — **KHÔNG BAO GIỜ** `/app` |
| Người dùng đã đăng nhập vào `/register` | Không tới `RegisterPage` — `GuestRoute` chặn từ trước (F1, không đổi), redirect `/app` |

---

## 10. Test Plan

| ID | Test | Setup | Hành động | Assert |
|---|---|---|---|---|
| M6-T01 | Password mismatch | Không mock API | Nhập password/confirmPassword khác nhau, blur, submit | Lỗi Zod dưới `confirmPassword`; **0 lần** gọi `POST /api/v1/auth/register` |
| M6-T02 | displayName để trống hợp lệ (regression cho Phát hiện 3) | MSW 201 | Để trống displayName, điền các field khác đúng, submit | **Không** có lỗi Zod cho `displayName`; API được gọi, payload không có `displayName` hoặc `displayName: undefined` |
| M6-T03 | 409 EMAIL_ALREADY_EXISTS | MSW `POST /register` → 409 | Submit | Request được gửi; lỗi hiện **đúng dưới field email**, text = `getErrorMessage("EMAIL_ALREADY_EXISTS")` = "Email này đã được đăng ký."; **không** phải Alert toàn form |
| M6-T04 | Đăng ký thành công | MSW `POST /register` → 201 | Submit | `authStore.status` **không đổi** (vẫn `unauthenticated`, verify gián tiếp hoặc không cần vì `useRegisterMutation` không chạm store — có thể assert bằng spy trên `useAuthStore.setState` không bị gọi); **không** điều hướng `/app`; `Alert variant="success"` xuất hiện (`getByRole("status")`); sau khi advance fake timer → `navigate("/login")` được gọi |
| M6-T05 | Forgot Password vắng mặt | — | Render trang | `queryByText(/quên mật khẩu/i)` = `null`; không có link nào trỏ tới path chứa "forgot"/"reset" |
| M6-T06 | Accessibility | Render mặc định + trạng thái lỗi 409 + trạng thái thành công | `vitest-axe` | 0 vi phạm ở cả 3 trạng thái |

**Kỹ thuật xử lý delay (Test M6-T04, đúng cảnh báo §Mục 12 prompt gốc "không dùng timing hack"):** dùng `vi.useFakeTimers()` + `vi.advanceTimersByTime(2000)` (Vitest, đã là dependency có sẵn) — đây là kỹ thuật test tiêu chuẩn cho `setTimeout`, không phải "hack" tùy tiện chờ thời gian thật.

---

## 11. Accessibility Plan

- Cả 4 `Input` có `label` tường minh ("Email", "Mật khẩu", "Xác nhận mật khẩu", "Tên hiển thị") — `Input` tự có `aria-invalid`/`aria-describedby` khi lỗi (không đổi từ M5, đã verify).
- `Alert` (cả `danger` và `success`) tự có `role` đúng (`alert`/`status` — đã verify từ source, Mục "Phát hiện 1").
- `Button isLoading` tự có `aria-busy` (không đổi từ M5).
- Focus/keyboard: không cần thêm gì thủ công — hành vi tab-order tự nhiên của form HTML chuẩn, đúng như `LoginPage` đã verify không có vấn đề gì ở M5.
- Submit state: 4 `Input` + `Button` đều disable khi `isPending` — nhất quán với khuyến nghị đã đưa ra ở M5 (bao gồm cả khuyến nghị thêm `disabled` cho `Button`, không chỉ `isLoading` — áp dụng ngay từ đầu ở M6 thay vì để lại làm polish sau như M5).

---

## 12. Security Review

| Mục | Xác nhận |
|---|---|
| Password không lưu client persistence | ✅ Chỉ tồn tại trong RHF form state (bộ nhớ, không persist), biến mất khi unmount |
| Password không bị log | ✅ Không `console.log` nào trong `page.tsx` |
| `confirmPassword` không gửi lên API | ✅ Destructure loại bỏ trước `.mutate()` (Mục 7, Step 6) |
| Refresh token không bị đụng | ✅ `RegisterResponse` không có field này (Mục 2, `types.ts`); `page.tsx` không import gì từ `auth-refresh-coordinator` |
| Không tự quản lý cookie | ✅ Không đổi gì liên quan cookie |
| Dùng đúng API client trung tâm | ✅ Qua `useRegisterMutation` → `register()` → `apiClient`, không tự `fetch`/`axios` |
| Không bypass error normalization | ✅ Dùng nguyên `ApiError`/`getErrorMessage`, không tự parse response thô |
| Không lộ backend internals | ✅ `error.title` (tiếng Anh kỹ thuật) không bao giờ render trực tiếp — chỉ `getErrorMessage(error.errorCode)` |

---

## 13. Files to Modify

### Required
```
frontend/src/pages/auth/register/page.tsx        (thay toàn bộ nội dung)
frontend/src/pages/auth/register/page.test.tsx   (mới)
```

### Potential (khuyến nghị mạnh, dựa trên Phát hiện 2/3 — đã có bằng chứng cụ thể, không phải suy đoán)
```
frontend/src/shared/lib/formFields.ts        (mở rộng getInputFieldProps, thêm test)
frontend/src/features/auth/hooks/useRegisterMutation.ts   (thêm generic type, không cần test mới)
```

### Must Not Modify
```
frontend/src/features/auth/model/schema.ts        (Phát hiện 3 không sửa ở đây)
frontend/src/features/auth/model/schema.test.ts
frontend/src/features/auth/api/register.ts
frontend/src/shared/stores/authStore.ts
frontend/src/shared/api/client.ts
frontend/src/shared/api/auth-refresh-coordinator.ts
frontend/src/pages/auth/login/page.tsx            (không đổi Login khi làm Register)
frontend/src/app/router.tsx, app/routing/*
frontend/src/widgets/auth-layout/*
Backend (mọi file)
```

---

## 14. Test Cases (checklist đối chiếu Mục 12 prompt gốc)

- [x] password mismatch → client error (M6-T01)
- [x] password mismatch → no API request (M6-T01)
- [x] 409 EMAIL_ALREADY_EXISTS → email field error (M6-T03)
- [x] 201 success → `/login` (M6-T04)
- [x] 201 success → no session (M6-T04)
- [x] 201 success → no `/app` (M6-T04)
- [x] Forgot Password UI absent (M6-T05)
- [x] a11y pass (M6-T06)
- [x] typecheck
- [x] lint
- [x] tests

---

## 15. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Schema drift (registerSchema đổi sau này mà page không cập nhật) | Dùng trực tiếp `RegisterFormValues` (suy ra từ schema), không tự định nghĩa type riêng |
| API contract drift | `RegisterRequest`/`RegisterResponse` từ `types.ts`, không tự định nghĩa lại |
| ApiError shape mismatch | Dùng nguyên `error.errorCode`, đã verify runtime luôn đúng |
| Field-error mapping sai (hiện nhầm chỗ) | Test M6-T03 assert cụ thể vị trí field, không chỉ "có text đâu đó trên trang" |
| Vô tình auto-login | Test M6-T04 xác nhận không tạo session; review checklist Step 8 |
| Navigation race (điều hướng trước khi user đọc thông báo) | Delay 2000ms + fake timer test kiểm chứng đúng trình tự |
| Duplicate submission | Disable Input + Button khi `isPending` (áp dụng ngay, không để lại như M5) |
| Notification timing trong test | `vi.useFakeTimers()` — không dùng `setTimeout` thật trong test |
| Accessibility regression | M6-T06, tái dùng `vitest-axe` đã có |
| Vô tình thêm Forgot Password UI | M6-T05 assert tường minh vắng mặt, review Step 9 |
| Mở rộng `getInputFieldProps` phá vỡ `LoginPage` đang dùng | Tham số 3 là **optional**, test regression xác nhận lời gọi cũ (2 tham số) không đổi hành vi |

---

## 16. Decision Log

Không reopen F2-D1/D4/D6/D7/F2-OQ-3 (giữ nguyên).

| ID | Question | Evidence | Options | Chosen | Rationale | Impact |
|---|---|---|---|---|---|---|
| M6-D1 | Notification/success message dùng cơ chế nào? | Không có toast system nào tồn tại (Mục "Phát hiện 1") | (a) Xây toast system mới; (b) Dùng `Alert variant="success"` có sẵn | **(b)** | Đã có sẵn, đúng variant, đúng ARIA, 0 abstraction mới | Không ảnh hưởng file nào khác |
| M6-D2 | `displayName` rỗng bị reject sai — sửa ở đâu? | `schema.test.ts`'s "rejects empty displayName" đang pass; RHF text input luôn đọc `""` không phải `undefined` | (a) Sửa `registerSchema.ts` + đổi test hiện có; (b) Mở rộng `getInputFieldProps` với `setValueAs` cục bộ | **(b)** | Không chạm file M3 sở hữu, không đổi test đang pass, footprint nhỏ nhất | Thêm 1 tham số optional vào hàm dùng chung — cần test regression cho `LoginPage`'s cách gọi cũ |
| M6-D3 | `useRegisterMutation` thiếu generic type — sửa không? | Giống hệt gap đã sửa ở M5 cho `useLoginMutation` | (a) Bỏ qua, ép kiểu trong page; (b) Sửa hook (đúng tiền lệ M5) | **(b)** | Nhất quán với quyết định đã áp dụng ở M5, rủi ro thấp | 1 dòng, không đổi hành vi runtime |
| M6-D4 | Delay bao lâu trước khi điều hướng sau thành công? | Không có tiền lệ trong codebase | — | **2000ms** (implementation recommendation, không phải quyết định kiến trúc) | Đủ để người dùng đọc thông báo ngắn, không quá lâu gây khó chịu | Có thể điều chỉnh sau, không ảnh hưởng kiến trúc |

---

## 17. Open Questions

**Không còn Open Question nào chưa giải quyết** — cả 3 phát hiện (Mục đầu) đều đã có giải pháp cụ thể tích hợp trong plan (M6-D1, M6-D2, M6-D3), không cần chờ quyết định thêm từ bạn để bắt đầu code. M6-D4 (thời lượng delay) là implementation recommendation có thể điều chỉnh, không phải blocker.

---

## 18. Acceptance Criteria

- [ ] Form Register thật thay hoàn toàn placeholder
- [ ] 4 field implement đúng `registerSchema`
- [ ] `useZodForm(registerSchema)` được dùng, không viết validate thủ công
- [ ] Client-side confirmPassword validation hoạt động (M6-T01)
- [ ] `displayName` để trống không bị lỗi sai (M6-T02 — regression cho Phát hiện 3)
- [ ] Lỗi email trùng hiện đúng dưới field email (M6-T03)
- [ ] Đăng ký thành công KHÔNG tạo session xác thực
- [ ] Đăng ký thành công KHÔNG điều hướng `/app`
- [ ] Đăng ký thành công điều hướng `/login`
- [ ] Thông báo thành công ngắn được hiển thị (`Alert variant="success"`)
- [ ] Không có UI Forgot Password ở bất kỳ đâu trên trang Register
- [ ] Accessibility đạt yêu cầu (0 vi phạm axe)

---

## 19. Exit Criteria

```
✓ npm run test          — pass (M6 + regression F1-M5, bao gồm formFields.test.ts nếu Phát hiện 3 được vá)
✓ npm run typecheck      — pass
✓ npm run lint           — pass
✓ npm run format:check   — pass
```
- Không unintended `authStore` mutation
- Không auto-login
- Không `/app` redirect sau đăng ký
- Không Forgot Password UI
- Không vi phạm kiến trúc mới (`shared → features` vẫn 0)
- Không TODO/FIXME mới cho M6
- Toàn bộ test M1-M5 vẫn pass (regression = 0)

---

## 20. Implementation Order

```
1. Verify current state (Mục 2) — re-run git log, đọc lại Phát hiện 1-3 còn đúng không
2. Vá Phát hiện 3: mở rộng getInputFieldProps + test regression (formFields.test.ts)
3. (Khuyến nghị) Vá Phát hiện 2: generic type useRegisterMutation
4. Register Page structure (heading, 4 field, link Login)
5. Wire useZodForm + getInputFieldProps (dùng setValueAs cho displayName)
6. Test M6-T01, M6-T02 (client validation trước, chưa cần mock API thành công)
7. Submit handler + payload stripping + useRegisterMutation integration
8. Test M6-T03 (409) — implement onError → setError
9. Test M6-T04 (201) — implement Alert success + delayed navigate + fake timer test
10. Test M6-T05 (Forgot Password absent)
11. Test M6-T06 (a11y, 3 trạng thái)
12. Verification đầy đủ (Mục 19) + dependency-direction grep
13. M6 closure
```

Thứ tự này tránh việc viết test cho hành vi tạm — client validation (bước 6) làm trước khi có mutation thật, tránh phải viết lại test sau khi thêm submit logic.

---

## 21. Final Architect Review

### Architecture
- [x] Dependency direction preserved — `pages → features/shared`, không chiều ngược
- [x] Existing auth abstractions reused — `useRegisterMutation`, `registerSchema`, `getErrorMessage`, `apiClient` (gián tiếp)
- [x] No duplicate auth infrastructure
- [x] No feature → shared violation
- [x] No shared → feature violation — `formFields.ts`'s mở rộng vẫn thuần túy generic, không biết `RegisterPage` tồn tại
- [x] No unnecessary new abstraction — dùng `Alert` có sẵn thay vì toast mới

### Authentication
- [x] Register does not authenticate user
- [x] Register does not call setSession
- [x] Refresh token untouched
- [x] authStore remains correct — không import vào `page.tsx`
- [x] `/app` is not registration destination

### Form
- [x] registerSchema reused
- [x] useZodForm reused
- [x] Four fields implemented
- [x] Server field error mapped correctly (409 → email)
- [x] Loading/duplicate submit handled — Input + Button đều disable khi pending

### UX
- [x] Success message — `Alert variant="success"`
- [x] Navigation to `/login`
- [x] No Forgot Password UI
- [x] Responsive — kế thừa `AuthLayout` (không đổi)
- [x] Accessible — M6-T06

### Testing
- [x] Client validation test (M6-T01)
- [x] MSW 409 test (M6-T03)
- [x] MSW 201 test (M6-T04)
- [x] No-session assertion (M6-T04)
- [x] No-/app assertion (M6-T04)
- [x] a11y (M6-T06)
- [x] typecheck/lint

### Scope
- [x] No backend work
- [x] No refresh/session infrastructure changes
- [x] No unrelated F2 work
- [x] No hidden scope creep — 2 file "Potential" đều có bằng chứng cụ thể (Phát hiện 2/3), không phải mở rộng tùy tiện

**Không có mục nào unchecked.**

---

## Final Recommendation

```
READY FOR IMPLEMENTATION

3 phát hiện (notification mechanism, useRegisterMutation type gap, displayName defect)
đều đã có giải pháp cụ thể tích hợp sẵn trong plan — không cần quyết định thêm từ bạn
trước khi bắt đầu code, trừ khi bạn muốn chọn phương án khác cho Phát hiện 3 (sửa
schema.ts thay vì mở rộng formFields.ts) hoặc đổi thời lượng delay (M6-D4, hiện đề xuất 2000ms).
```
