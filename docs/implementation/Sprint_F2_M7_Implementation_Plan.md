# F2 M7 — Logout UX (UserMenu) Implementation Plan

---

## ⚠️ Ghi chú đối chiếu với prompt gốc trước khi vào plan

Prompt gốc (Mục "Files that must not be touched") ghi tên file bảo vệ là `frontend/src/shared/api/refresh-coordinator.ts`. Đọc trực tiếp thư mục `shared/api/` xác nhận **tên file thật là `auth-refresh-coordinator.ts`** (đặt tên từ M1, không đổi tới nay). Đây là sai lệch tên gọi trong prompt, không phải sai lệch kiến trúc — Protected Files list trong plan này dùng đúng tên file thật.

---

## 1. Executive Summary

**Objective:** Tạo `widgets/user-menu` — 1 widget nhỏ hiển thị thông tin người dùng đã đăng nhập + nút "Đăng xuất", nối vào slot `AppLayout.headerActions` đã có sẵn từ M1, dùng đúng `useLogoutMutation()` đã có sẵn từ M3.

**Scope:** Cực nhỏ — 1 widget mới, 1 dòng sửa trong `router.tsx`. Không tạo API mới, không tạo state mới, không tạo auth logic mới.

**Dependencies:**
- F2 M1 — `AppLayout.headerActions?: React.ReactNode` (đã verify, Mục 2)
- F2 M3 — `useLogoutMutation()` (đã verify, Mục 2)
- F2 M1-M6 (CLOSED, verify độc lập nhiều lượt liên tiếp, không đổi ở đây)

**Architectural intent:** `UserMenu` là **UX entry point thuần túy** — đọc `authStore` (chỉ đọc), gọi `useLogoutMutation()` (không viết logic logout mới), điều hướng `/login` (UX, không phải security boundary). Toàn bộ auth orchestration vẫn thuộc `features/auth`/hạ tầng đã có.

**Vì sao milestone nhỏ:** M1-M6 đã dựng đủ toàn bộ hạ tầng cần thiết (slot layout, mutation, store) — M7 chỉ là bước nối cuối cùng, không phát sinh quyết định kiến trúc mới nào.

---

## 2. Current-State Verification

### M1 — `AppLayout.headerActions`
Đọc trực tiếp `widgets/app-layout/index.tsx`:
```ts
interface AppLayoutProps {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}
export function AppLayout({ children, headerActions }: AppLayoutProps) { ... }
```
- **Actual prop type:** `React.ReactNode`, optional.
- **Rendering location:** bên trong `<Stack as="header">`, cùng hàng với logo, thay thế fallback `<div>` avatar rỗng (`{headerActions ?? <fallback/>}`).
- **AppLayout vẫn feature-agnostic:** ✅ — file này **không** import bất kỳ thứ gì từ `features/*` (đã grep xác nhận), chỉ import `useUiStore`, `Container`, `SkipLink`, `Stack`, `lucide-react`.
- **Hiện tại `router.tsx` chưa truyền `headerActions`** → đang hiện fallback avatar rỗng.

### M3 — `useLogoutMutation()`
Đọc trực tiếp `features/auth/hooks/useLogoutMutation.ts`:
```ts
export function useLogoutMutation() {
  return useMutation({
    mutationFn: logout,
    onSettled: () => { useAuthStore.getState().clearSession(); },
  });
}
```
- **Actual signature:** không nhận tham số, trả về `UseMutationResult<void, ApiError, void>` chuẩn TanStack Query.
- **Success/error/settled semantics:** `onSettled` (không phải `onSuccess`/`onError` riêng) — chạy trong **cả 2** trường hợp thành công lẫn thất bại — gọi `clearSession()` **bên trong hook**, không phải trách nhiệm của consumer.
- **authStore interaction:** hook tự gọi `clearSession()` — UserMenu **không cần và không được** tự gọi lại.
- **Có clear session không:** ✅ có, tự động, mọi lúc mutation settle (bất kể kết quả API).
- **Có invalidate queries không:** ❌ không — đọc toàn bộ hàm, không có `queryClient.invalidateQueries` nào.
- **Có hỗ trợ callback/options không:** Có — theo chuẩn TanStack Query, `.mutate(variables, options)` cho phép truyền `onSettled`/`onSuccess`/`onError` bổ sung ở **cấp gọi**, chạy **thêm vào** (không thay thế) callback đã khai báo trong hook — đây chính là pattern đã dùng nhất quán ở M5 (`useLoginMutation().mutate(values, {onSuccess: () => navigate(...)})`) và M6 (`useRegisterMutation().mutate(payload, {onSuccess, onError})`).

### Router — `app/router.tsx`
Đọc trực tiếp: cấu trúc `routesConfig` (data router, không phải JSX `<Routes>`), route `/app`:
```tsx
{
  path: "app",
  element: <ProtectedRoute />,
  children: [{
    element: (
      <AppLayout>
        <Suspense fallback={<SuspenseFallback />}><Outlet /></Suspense>
      </AppLayout>
    ),
    children: [{ index: true, element: <AppPage /> }],
  }],
}
```
- **AppLayout usage:** đúng 1 chỗ duy nhất, không truyền `headerActions` — cần sửa thành `<AppLayout headerActions={<UserMenu />}>`.
- **ProtectedRoute placement:** bọc ngoài `AppLayout`, đúng cấu trúc — route `/login` tồn tại (`GuestRoute > AuthLayout`, path `"login"`).

### Auth Store — read-only
```ts
export interface AuthUser { id: string; email: string; displayName: string | null; role: "user"|"admin"; createdAt: string; }
export interface AuthState { status: "resolving"|"authenticated"|"unauthenticated"; accessToken: string|null; user: AuthUser|null; setSession; clearSession; }
```
- **User shape thật:** `{id, email, displayName: string|null, role, createdAt}` — hiển thị hợp lý: `user.displayName ?? user.email` (vì `displayName` có thể `null`).
- **Status enum thật:** chuỗi literal `"resolving" | "authenticated" | "unauthenticated"` (không phải boolean, không phải số).
- Không sửa file này ở M7.

### Existing tests (tham chiếu trực tiếp `pages/auth/login/page.test.tsx`, M5)
- **Test providers:** `QueryClientProvider client={createQueryClient()}` (từ `@shared/api/queryClient`).
- **Router setup:** `MemoryRouter` + `Routes`/`Route` tường minh (không dùng router thật).
- **MSW setup:** `server.use(http.post(...))` cục bộ mỗi test, import `server` từ `@test/msw-server`.
- **Auth state setup:** `useAuthStore.setState({...})` trực tiếp trong `beforeEach`.
- **Navigation assertion convention:** render 1 `<Route>` đích (`data-testid="..."`) trong cùng `MemoryRouter`, assert `getByTestId(...)` xuất hiện sau hành động.
- **Import hook convention (quan trọng):** đọc trực tiếp `login/page.tsx`/`register/page.tsx` xác nhận cả 2 đều import **deep path** `@features/auth/hooks/useXMutation`, **không** qua barrel `@features/auth` — đây là convention thật đang dùng, UserMenu sẽ theo đúng convention này, không phải quyết định mới.

### `shared/ui` — kiểm tra sự tồn tại của Dropdown/Menu primitive
Đọc danh sách `shared/ui/`: `Alert, Avatar, Badge, Button, Card, Checkbox, Container, Divider, Grid, Input, Label, Modal, Radio, Section, Select, Skeleton, SkipLink, Spinner, Stack, Switch, Textarea` — **không có** `Menu`/`Dropdown`/`Popover`. `Button` có `variant: "primary"|"secondary"|"ghost"|"danger"|"link"`.

**Kết luận:** theo đúng chỉ dẫn "Do NOT introduce a complex dropdown/menu library" — M7 dùng bố cục **phẳng, không dropdown**: tên/email hiển thị trực tiếp + nút "Đăng xuất" hiện luôn (không cần click-to-expand). Đây là lựa chọn đơn giản nhất tương thích F1, không cần primitive mới.

---

## 3. Architecture / Responsibility Boundary

| Component | Responsibility | M7 may modify? |
|---|---|---|
| `widgets/user-menu` | Hiển thị user + trigger logout UI | **YES** (tạo mới) |
| `features/auth/hooks/useLogoutMutation` | Logout lifecycle, `clearSession()` | NO |
| `shared/stores/authStore.ts` | Auth state | NO |
| `shared/api/auth-refresh-coordinator.ts` | Refresh coordination | NO |
| `widgets/app-layout/index.tsx` | Layout composition, business-agnostic | NO |
| `app/router.tsx` | Route composition | **YES** (1 dòng — truyền `headerActions`) |

---

## 4. Dependency Direction

```
app/router.tsx
   ↓
widgets/user-menu
   ↓ (deep import, đúng convention M5/M6)
features/auth/hooks/useLogoutMutation
   ↓ (bên trong hook, không đổi)
shared/stores/authStore (clearSession) + features/auth/api/logout
```

**Từ chối tường minh (verify bằng đọc source `UserMenu`, không chỉ giả định):**
```
widgets/user-menu ↛ shared/api/auth-refresh-coordinator   (0 import — bắt buộc)
widgets/user-menu ↛ authStore.setState()/setSession()/clearSession()   (chỉ đọc qua selector, không gọi action ghi)
```

`widgets/app-layout` **không** đổi hướng phụ thuộc — vẫn `0` import `features/*`, chỉ nhận `headerActions` như `ReactNode` bất kỳ (đã đúng từ M1, verify lại không đổi).

---

## 5. Files to Create

### `frontend/src/widgets/user-menu/index.tsx`
- **Responsibility:** Đọc `user` từ `authStore` (chỉ đọc), render tên/email + nút "Đăng xuất", gọi `useLogoutMutation().mutate()`, điều hướng `/login` sau khi `onSettled`.
- **Imports allowed:** `react-router-dom` (`useNavigate`), `@shared/stores/authStore` (chỉ đọc `user`, không gọi action ghi), `@features/auth/hooks/useLogoutMutation` (deep path, đúng convention), `@shared/ui/Button`, `@shared/ui/Stack`.
- **Imports forbidden:** `@shared/api/auth-refresh-coordinator` (dưới mọi hình thức), bất kỳ hàm ghi nào của `authStore` (`setSession`/`clearSession`/`setState`), bất kỳ API auth thô nào (`features/auth/api/*`).
- **Testing role:** Component chính được test (Test 1, 2 — Mục 15).

### `frontend/src/widgets/user-menu/UserMenu.test.tsx`
- **Responsibility:** Verify Test 1 (logout success), Test 2 (logout failure) — cả 2 dùng MSW + `authStore` thật (không mock `useLogoutMutation`).
- **Testing role:** Runtime verification cho 2 kịch bản chính; Test 3 (boundary review) là **static review**, không phải test runtime trong file này (Mục 15).

---

## 6. Files to Modify

### `frontend/src/app/router.tsx`
**Thay đổi chính xác** (chỉ đúng 2 chỗ: import + prop):
```tsx
// Thêm import
import { UserMenu } from "@widgets/user-menu";

// Trong route "app", đổi:
<AppLayout>
  <Suspense fallback={<SuspenseFallback />}><Outlet /></Suspense>
</AppLayout>

// Thành:
<AppLayout headerActions={<UserMenu />}>
  <Suspense fallback={<SuspenseFallback />}><Outlet /></Suspense>
</AppLayout>
```
Không đổi bất kỳ route/path/layout nào khác. Không đổi `ProtectedRoute`/`GuestRoute`.

---

## 7. Protected Files

M7 **không được** sửa:
```
frontend/src/widgets/app-layout/index.tsx
frontend/src/shared/api/auth-refresh-coordinator.ts   (tên thật, khác tên trong prompt gốc)
frontend/src/shared/stores/authStore.ts
```

Đối chiếu Mục 2: không có bằng chứng nào cho thấy M7 cần sửa 3 file này — `AppLayout` đã có `headerActions` sẵn, `authStore`/coordinator không cần thay đổi gì để hỗ trợ logout UX. **Không có xung đột nào cần giải quyết bằng cách sửa các file này.**

---

## 8. Detailed Implementation Steps

### Step 1 — Verify M1/M3 contracts
Đã thực hiện khi lập plan (Mục 2) — dev thực thi nên `git log` lại để xác nhận không có commit mới làm sai lệch.

### Step 2 — Implement UserMenu presentation
```tsx
export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  ...
  return (
    <Stack direction="horizontal" align="center" gap="3">
      <span className="text-body-sm text-muted">
        {user?.displayName ?? user?.email ?? ""}
      </span>
      <Button type="button" variant="ghost" onClick={handleLogout} ...>
        Đăng xuất
      </Button>
    </Stack>
  );
}
```
`user` đọc qua selector (`useAuthStore((state) => state.user)`), không destructure toàn bộ store (tránh re-render thừa — tuy nhiên với milestone nhỏ này không bắt buộc, chỉ là thực hành tốt).

### Step 3 — Wire `useLogoutMutation`
```ts
const logoutMutation = useLogoutMutation();
```

### Step 4 — Wire settled navigation
```ts
const navigate = useNavigate();
const handleLogout = () => {
  logoutMutation.mutate(undefined, {
    onSettled: () => navigate("/login"),
  });
};
```
`onSettled` truyền ở cấp gọi **chạy thêm vào** (không thay thế) `onSettled` đã khai báo trong hook (M3) — thứ tự: hook's `onSettled` (clear session) chạy trước, sau đó call-site's `onSettled` (navigate) chạy — cả 2 đều thuộc "settled" callback nên TanStack Query đảm bảo cả 2 chạy khi mutation settle, không phụ thuộc thứ tự tương đối ảnh hưởng kết quả cuối (điều hướng luôn xảy ra sau khi session đã clear, vì cả 2 đều trong cùng đợt settle).

### Step 5 — Integrate qua router/headerActions
Sửa `router.tsx` (Mục 6).

### Step 6 — Add success test (Test 1, Mục 15)

### Step 7 — Add failure test (Test 2, Mục 15)

### Step 8 — Static architectural boundary review (Test 3, Mục 15)
Đọc lại `import` list của `widgets/user-menu/index.tsx` sau khi code xong — xác nhận đúng danh sách "Imports allowed" (Mục 5), không có gì trong "Imports forbidden".

### Step 9 — Run validation
Mục 20.

---

## 9. Test Plan

| Test | Setup | Action | Expected |
|---|---|---|---|
| Test 1 — Logout success | `useAuthStore.setState({status:"authenticated", user:{id,email,displayName,role,createdAt}, accessToken:"..."})`; MSW `POST /api/v1/auth/logout` → 204 | Render `UserMenu` (wrapper có `MemoryRouter` + route `/login` đích), click "Đăng xuất" | `useAuthStore.getState().status === "unauthenticated"`; route `/login` (`data-testid`) xuất hiện |
| Test 2 — Logout failure | Cùng setup authenticated; MSW `POST /logout` → 500 | Click "Đăng xuất" | `useAuthStore.getState().status === "unauthenticated"` (hook's `onSettled` vẫn chạy dù lỗi — đúng M3 contract, không phải hành vi UserMenu tự quyết định); route `/login` vẫn xuất hiện — **không** tự ý `setState` thủ công trong test để "cho qua" |
| Test 3 — Boundary review | Đọc `widgets/user-menu/index.tsx` sau khi implement | Kiểm tra `import` statement | Không có `auth-refresh-coordinator`, không gọi `setState`/`setSession`/`clearSession` trực tiếp |

**Không có công cụ ESLint boundary tự động** — `eslint-plugin-boundaries` đã cài từ F1 nhưng chưa kích hoạt (xác nhận không đổi qua M1-M6) — Test 3 là **review thủ công bắt buộc**, ghi vào PR checklist, không phải lint tự động.

**Không viết thêm test nào khác** (ví dụ test riêng cho "không gọi refresh-coordinator" bằng runtime spy) — vì đó là việc **không xảy ra do thiết kế** (UserMenu không import file đó), verify bằng đọc source (Test 3) là đủ và đúng bản chất hơn runtime test giả.

---

## 10. Accessibility Review

- Nút "Đăng xuất" là `<Button type="button">` — phần tử tương tác ngữ nghĩa chuẩn, tự có focus ring/keyboard activation (Enter/Space) từ HTML `<button>` gốc — không cần thêm gì.
- Accessible name: text "Đăng xuất" hiển thị trực tiếp bên trong `<Button>` — không dùng icon-only, đúng yêu cầu "Do not rely only on iconography".
- Loading state: `Button`'s `isLoading` (đã xác nhận có sẵn từ M1, tự hiện `Spinner` + `aria-busy`) — dùng `isLoading={logoutMutation.isPending}` + `disabled={logoutMutation.isPending}` để chống double-click khi đang chờ, đúng pattern đã dùng nhất quán ở M5/M6.
- Không dùng dropdown/menu pattern → không có vấn đề focus-trap/escape-key cần xử lý (đã loại trừ ở Mục 2).
- Focus sau điều hướng: không cần xử lý thủ công — đây là hành vi chung của router (đã có `TODO(Core)` ghi nhận ở `router.tsx` cho "focus management chủ động sau khi điều hướng" — OQ-M8-1/M8-2, thuộc phạm vi milestone tương lai khác, không phải M7).

---

## 11. Security Review

| Mục | Xác nhận |
|---|---|
| Không truy cập refresh token | ✅ Không import `auth-refresh-coordinator`, không đọc `accessToken` field nào khác ngoài không dùng tới |
| Không lưu token | ✅ Không `localStorage`/biến nào |
| Không decode token | ✅ Không xử lý JWT nào |
| Không tự gọi refresh logic | ✅ |
| Không tự mutate auth state | ✅ Chỉ đọc `user` qua selector, ghi duy nhất qua `useLogoutMutation()` |
| Không bypass `ProtectedRoute` | ✅ Điều hướng `/login` là UX thuần túy sau khi mutation settle — không tự quyết định ai được vào route nào |
| Không tự implement authorization | ✅ |
| Không lộ thông tin nhạy cảm | ✅ Chỉ hiện `displayName`/`email` (dữ liệu đã có trong `authStore`, không phải secret) |

---

## 12. Edge Cases

| # | Edge case | Hành vi |
|---|---|---|
| 1 | Click "Đăng xuất" nhiều lần liên tiếp | `disabled={logoutMutation.isPending}` chặn click thêm khi đang chờ — đúng pattern M5/M6, không phải hành vi mới |
| 2 | Logout API trả 500 | `onSettled` (hook, M3) vẫn `clearSession()`; `onSettled` (call-site) vẫn `navigate("/login")` — Test 2 |
| 3 | Lỗi network | Cùng nhánh `onSettled` như case 2 — TanStack Query coi network error cũng là "settled" (không phải "pending" mãi) |
| 4 | User đã unauthenticated | **Ngoài phạm vi M7** — `UserMenu` chỉ được render khi đã ở `/app` (qua `ProtectedRoute`), tức `status==="authenticated"` tại thời điểm render; nếu status đổi ngay trong lúc UserMenu hiển thị (hiếm, ví dụ refresh thất bại giữa phiên), `ProtectedRoute` (không đổi) sẽ tự redirect `/login` độc lập — UserMenu không cần tự xử lý |
| 5 | `user` thiếu field (`displayName: null`) | Đã xử lý bằng `user?.displayName ?? user?.email ?? ""` — không crash |
| 6 | Mutation vẫn `pending` khi component unmount (điều hướng xảy ra trước khi mutation xong) | Không xảy ra theo thiết kế — `navigate` chỉ gọi bên trong `onSettled`, nghĩa là mutation đã xong trước khi điều hướng |
| 7 | Điều hướng xảy ra sau khi mutation settle | Đúng theo thiết kế Step 4 — không có race |
| 8 | `ProtectedRoute` tự redirect độc lập sau khi auth state đổi | Không cần `UserMenu` phối hợp gì thêm — đây chính xác là lý do `navigate("/login")` trong `UserMenu` chỉ là UX (dù `UserMenu` không tự gọi, `ProtectedRoute` cũng sẽ redirect ngay khi `status` chuyển `unauthenticated` vì `/app` không còn hợp lệ — 2 cơ chế độc lập, không xung đột, cùng đích) |

---

## 13. Decision Log

| ID | Question | Evidence | Decision |
|---|---|---|---|
| M7-D1 | `/login` navigation ở đâu? | `useLogoutMutation` (M3) không tự navigate | `UserMenu`'s call-site `onSettled` — UX thuần túy, không phải security routing |
| M7-D2 | `UserMenu` tự mutate `authStore`? | `useLogoutMutation` đã tự `clearSession()` | **Không** — chỉ `useLogoutMutation()` sở hữu logout lifecycle |
| M7-D3 | `UserMenu` truy cập `auth-refresh-coordinator`? | Không có nhu cầu chức năng nào | **Tuyệt đối không** |
| M7-D4 | Sửa `AppLayout`? | Đã có `headerActions` từ M1 (Mục 2) | **Không** — dùng nguyên `headerActions` có sẵn |
| M7-D5 | Logout thất bại ảnh hưởng UX thế nào? | `onSettled` (M3) chạy cả 2 trường hợp | Điều hướng `/login` sau khi settle, đúng M3 contract, không phân biệt thành công/thất bại |
| M7-D6 (mới) | Dùng dropdown/menu pattern hay bố cục phẳng? | Không có `Menu`/`Dropdown` primitive nào trong `shared/ui` (Mục 2) | Bố cục phẳng: text + Button hiện trực tiếp, không cần primitive mới |
| M7-D7 (mới) | Import `useLogoutMutation` qua đường nào? | `login/page.tsx`/`register/page.tsx` đều dùng deep path `@features/auth/hooks/useXMutation`, không qua barrel | Theo đúng convention thật: `@features/auth/hooks/useLogoutMutation` |

---

## 14. Open Questions

Không còn Open Question kiến trúc/implementation nào chưa giải quyết sau khi inspect M1/M3/router/authStore/test convention.

> No unresolved architectural or implementation Open Questions remain for M7.

---

## 15. Test Matrix

(Đã trình bày đầy đủ ở Mục 9 — tham chiếu ngược, không lặp lại)

**Unit/component test scope:** `UserMenu` render + interaction (Test 1, 2).
**Integration behavior:** MSW thật cho `/api/v1/auth/logout`, `authStore` thật (không mock `useLogoutMutation`).
**MSW expectations:** `POST /api/v1/auth/logout` → 204 (success) / 500 (failure) — 2 handler, mỗi test 1 handler qua `server.use()`.
**Router/navigation verification:** `MemoryRouter` + route `/login` đích với `data-testid`, đúng convention M5/M6.
**authStore verification:** đọc `useAuthStore.getState().status` sau hành động, không spy giả.
**Static source review:** Test 3, đọc `import` list thủ công (Mục 9).

---

## 16. Risk Register

| Risk | Mitigation |
|---|---|
| R1 — M3 contract mismatch (giả định sai `onSuccess`/`onError` thay vì `onSettled`) | Đã đọc trực tiếp `useLogoutMutation.ts` (Mục 2) — xác nhận `onSettled`, không giả định |
| R2 — Vô tình thêm mutation `authStore` trực tiếp | Static review (Test 3) + review checklist Step 8 |
| R3 — Vi phạm ranh giới refresh | Đọc import list (Mục 2, Mục 5) — xác nhận không có nhu cầu chức năng nào cần refresh-coordinator |
| R4 — Router integration vô tình đổi security routing | Chỉ đổi đúng 1 dòng (`headerActions` prop), không đụng `ProtectedRoute`/`GuestRoute`/path nào |
| R5 — Logout failure behavior khác giả định | Đã verify `onSettled` chạy cả 2 trường hợp (Mục 2) — Test 2 xác nhận runtime |
| R6 (mới) — Tên file `auth-refresh-coordinator.ts` khác tên trong prompt gốc gây nhầm lẫn khi review sau này | Ghi rõ tên thật ngay đầu plan + Mục 7 |

---

## 17. Documentation Impact

- **`frontend/README.md`'s "Authentication Flow" section** (nếu đã có từ M5/M6 — cần kiểm tra thực tế khi thực thi, không giả định nội dung cụ thể): nếu có mô tả luồng Login/Register nhưng chưa nhắc Logout, nên bổ sung 1-2 câu mô tả UserMenu — **chỉ nếu file/section này thực sự tồn tại và thiếu**, không tự tạo mới nếu chưa có tiền lệ.
- **F2 implementation docs / CHANGELOG:** theo đúng convention Sprint 3 Backend đã thiết lập (cập nhật cuối Sprint, không phải từng milestone) — M7 không cần tự cập nhật CHANGELOG riêng.
- **Không sửa** Architecture Spec — M7 không phát hiện mâu thuẫn hợp đồng nào cần cập nhật tài liệu nguồn (khác với M1/M5 từng cần sửa Architecture Spec do phát hiện sai lệch thật).

---

## 18. Acceptance Criteria

### Functional
- [ ] Authenticated user thấy `UserMenu`
- [ ] Click "Đăng xuất"
- [ ] Logout dùng `useLogoutMutation()` có sẵn
- [ ] Thành công → `authStore` unauthenticated đúng theo M3
- [ ] Điều hướng `/login` sau khi settle
- [ ] Thất bại API vẫn điều hướng `/login` sau khi settle

### Architecture
- [ ] Không import `auth-refresh-coordinator`
- [ ] Không gọi refresh logic
- [ ] Không tự mutate `authStore` trực tiếp
- [ ] Không tự implement auth lifecycle
- [ ] Không tự implement route authorization/security
- [ ] `AppLayout` vẫn business-agnostic
- [ ] `AppLayout` không import `features/auth`
- [ ] `headerActions` slot có sẵn được tái sử dụng

### Testing
- [ ] Test logout success pass
- [ ] Test logout failure pass
- [ ] Static boundary review pass
- [ ] Test convention F2 hiện có được giữ nguyên

### Quality
- [ ] Typecheck pass
- [ ] Lint pass
- [ ] Format pass
- [ ] Unit/component test liên quan pass
- [ ] Không test nào khác bị regression

---

## 19. Exit Criteria

- `UserMenu` tồn tại và đã tích hợp vào `router.tsx`
- Logout hoạt động đúng khi API thành công
- Logout UX hoạt động đúng khi API thất bại
- Điều hướng `/login` xảy ra sau khi mutation settle
- Không có auth orchestration bị cấm nào bên trong `UserMenu`
- Không file protected nào bị sửa
- `AppLayout` vẫn business-agnostic
- Test pass
- Typecheck pass
- Lint pass
- Format pass
- Không TODO/FIXME mới cho M7
- Không Open Question blocking nào còn lại
- Implementation nằm đúng trong phạm vi M7

---

## 20. Validation Commands

Đọc trực tiếp `frontend/package.json` — không phát minh lệnh:

```bash
npx vitest run src/widgets/user-menu          # 1. targeted UserMenu tests
npx vitest run src/features/auth src/app      # 2. relevant F2 tests (hooks + router)
npm run test                                   # 3. full test suite
npm run typecheck                              # 4. typecheck
npm run lint                                   # 5. lint
npm run format:check                           # 6. format/check
npm run build                                  # 7. build — M7 đổi router.tsx (production entry), nên build là bắt buộc, không phải tùy chọn
```

---

## 21. Final Architect Review

| # | Câu hỏi | Trả lời |
|---|---|---|
| 1 | `UserMenu` chỉ tiêu thụ auth capability có sẵn? | **YES** — chỉ `useAuthStore` (đọc) + `useLogoutMutation()` |
| 2 | Dùng `useLogoutMutation()` thay vì tự implement logout? | **YES** — Mục 8, Step 3 |
| 3 | Tránh mutate `authStore` trực tiếp? | **YES** — không gọi `setState`/`setSession`/`clearSession`; verify bằng Test 3 |
| 4 | Tránh `auth-refresh-coordinator`? | **YES** — 0 import, verify Mục 2/5 |
| 5 | Tránh refresh-token logic? | **YES** |
| 6 | Tránh auth lifecycle logic? | **YES** — lifecycle hoàn toàn thuộc `useLogoutMutation` (M3) |
| 7 | Tránh authorization/security routing? | **YES** — điều hướng chỉ là UX, `ProtectedRoute` độc lập sở hữu security |
| 8 | `/login` navigation chỉ là UX? | **YES** — Mục 13, M7-D1 |
| 9 | `AppLayout` vẫn business-agnostic? | **YES** — verify đọc source, 0 import `features/*` |
| 10 | `headerActions` được tái sử dụng, không sửa? | **YES** — Mục 6, chỉ truyền prop, không đổi component |
| 11 | Router integration tối thiểu? | **YES** — đúng 1 prop, 1 import |
| 12 | Protected files không bị đụng? | **YES** — Mục 7 |
| 13 | Success/failure path đều có test? | **YES** — Test 1, 2 |
| 14 | Ranh giới kiến trúc được static review? | **YES** — Test 3 |
| 15 | M1/M3 contract đã thật sự verify? | **YES** — Mục 2, đọc trực tiếp source, không suy diễn |
| 16 | Có scope creep nào không? | **KHÔNG** — đối chiếu Mục 18 (prompt gốc, danh sách loại trừ: profile/settings/avatar/notification/theme/password/forgot-password/role/preferences/API mới) — 0 vi phạm |
| 17 | Còn blocker nào không? | **KHÔNG** |
| 18 | Milestone vừa sức 1 developer? | **YES** — 2 file mới, 1 file sửa 1 dòng, 9 bước nhỏ |

**Không có mục nào NO.**

---

# Final Recommendation

```
READY FOR IMPLEMENTATION

Không có Open Question chặn M7. Duy nhất 1 điểm khác biệt so với prompt gốc đã ghi nhận
ngay đầu tài liệu (tên file coordinator thật là auth-refresh-coordinator.ts) — không ảnh
hưởng nội dung kỹ thuật của plan.
```
