# Sprint F3 — M5 Implementation Plan: Create/Edit Pages & Routing

**Milestone ID**: F3-M5
**Name**: Create/Edit Pages & Routing
**Status**: Planned
**Lập ngày**: 2026-09-27

## 1. Milestone Overview

- **Objective**: Hoàn thiện `BirthProfileCreatePage`/`BirthProfileEditPage`, đăng ký routing đúng pattern hiện có, nối `BirthProfileForm` (M3) với `useCreateBirthProfileMutation`/`useUpdateBirthProfileMutation` (M2), hoàn thiện E2E CRUD happy-path chạy trên CI với backend thật (G-05, đã CLOSED).
- **Scope**: 2 page mới, route registration, success/error UX (tái dùng pattern đã có — xem mục "Specification vs Implementation Discrepancies"), unit/component/integration test, 1 E2E spec mới.
- **Non-goals**: Chart/Swiss Ephemeris/Interpretation/Synastry/Composite/Admin/RBAC, sửa Backend Birth Profile API, sửa kiến trúc frontend đã freeze, xây Delete mới (đã CLOSED ở M4), xây `Toast` component mới (xem Discrepancy D1).

## 2. Context & Current State (xác nhận trực tiếp trên `origin/dev`, không suy diễn)

- **M1-M4 đều đã CLOSED**, verify độc lập nhiều vòng bằng lệnh thật (typecheck/lint/format/build/test), lần audit gần nhất cho M4 xác nhận: 76/76 file, 363/363 test pass, bao gồm cả 2 gap đã flag ở review trước (wording modal có tên hồ sơ, đủ test Loading/Error/Cancel/Failure/auto-page-back) đã được vá và verify lại.
- `router.tsx` hiện tại: route `app` (bọc `ProtectedRoute`) có đúng 2 children: `index → AppPage` (placeholder) và `path: "profiles" → BirthProfilesPage` (M4). **`/app/profiles/new` và `/app/profiles/:id/edit` chưa tồn tại** — đúng như M5 cần làm.
- `Suspense` đã bọc SẴN ở tầng `AppLayout` (`<Suspense fallback={<SuspenseFallback/>}><Outlet/></Suspense>`) — route con mới **không cần tự thêm `Suspense` riêng**.
- `ProtectedRoute` bọc SẴN toàn bộ path `app` — route con mới tự động được bảo vệ, không cần cấu hình thêm.
- `BirthProfileForm` (M3) export qua `features/birth-profile/ui/BirthProfileForm/index.ts`: `{BirthProfileForm, BirthProfileFormValues, toFormValues}`. Props thật (đọc trực tiếp source, **khác với mô tả trong Sprint_F3_M3_Implementation_Plan.md** — xem Discrepancy D2): `{defaultValues?: Partial<BirthProfileFormValues>, onSubmit: (values: BirthProfileFormValues) => void, isLoading?: boolean}` — **không có prop `mode`**.
- `useBirthProfileQuery(id: string | undefined)` (M2): `useQuery({queryKey: birthProfileKeys.detail(id ?? ""), queryFn: () => getBirthProfile(id as string), enabled: Boolean(id)})`.
- `useCreateBirthProfileMutation()`/`useUpdateBirthProfileMutation()` (M2): xác nhận lại đúng signature — Update nhận `{id, input}`, tự invalidate cả `lists()` lẫn `detail(id)` khi thành công.
- `toFormValues(profile: BirthProfile): BirthProfileFormValues` (M3): map flat response → nested form values, đã verify từng field ở review M3.
- **`Toast` component KHÔNG tồn tại** trong `shared/ui/` (đã xác nhận `find` không ra kết quả nào) — xem Discrepancy D1.
- **Phát hiện quan trọng**: `pages/auth/register/page.tsx` (F2, đã CLOSED) đã có sẵn 1 pattern thật, đang chạy tốt trên E2E, cho đúng nhu cầu "thông báo thành công rồi điều hướng": `registerMutation.mutate(payload, {onSuccess: () => setTimeout(() => navigate("/login"), 2000)})` kết hợp `{registerMutation.isSuccess && <Alert variant="success" title="..."/>}` và `isFormDisabled = isPending || isSuccess` (khóa form trong lúc chờ điều hướng). Đây là **tiền lệ thật duy nhất trong codebase** cho UX "success rồi navigate" — xem Discrepancy D1 cho quyết định áp dụng.
- G-05 (`frontend-ci.yml` trên `origin/dev`, đã xác nhận đúng nội dung thật): Postgres service (`postgres:16-alpine`, port 5432) → cài backend deps → ghi `.env` backend (bao gồm `DATABASE_URL`, `JWT_*`, `GEONAMES_USERNAME=ci-e2e-placeholder`) → `prisma:generate` + `prisma:deploy` → build backend → **chạy thẳng `node dist/server.js`** (không dùng `npm run start` — comment trong chính file giải thích lý do: tránh `NODE_ENV=production` ép `secure:true` lên refresh-cookie phá E2E qua `http://localhost`) → poll `http://localhost:3000/live` tới khi sẵn sàng (tối đa 30×2s) → `npx playwright install --with-deps chromium` → `npm run test:e2e`. `playwright.config.ts`: `baseURL: http://localhost:5173`, `webServer.command: "npm run dev"` (Playwright tự boot frontend dev server), `retries: 2`/`workers: 1` khi `CI=true`.
- `e2e/auth.spec.ts` (F2, mẫu tham chiếu bắt buộc): `test.describe.configure({mode: "serial"})`, 1 `page` dùng chung xuyên suốt qua `beforeAll`/`afterAll` (session giữ nguyên giữa các test), dữ liệu duy nhất qua `` `e2e-${Date.now()}@test.local` `` (không có bước cleanup DB tường minh nào — dữ liệu tồn tại tới khi container Postgres ephemeral của CI job bị hủy), chọn phần tử hoàn toàn bằng semantic query (`getByRole`, `getByLabel`) — **không dùng `data-testid`** ở bất kỳ đâu trong E2E.
- Naming convention page thật (đối chiếu `pages/auth/login`, `pages/auth/register`, `pages/app/profiles`): `pages/<domain>/<tên-page>/page.tsx`, tên thư mục **không nhất thiết phản ánh URL đầy đủ** (ví dụ `pages/auth/login/page.tsx` ánh xạ route thật `/login`, không phải `/auth/login` — "auth" chỉ là gom nhóm source code, route thật khai báo tay trong `routesConfig`, không dùng file-based routing). **Không có tiền lệ bracket-folder (`[id]`) nào trong toàn bộ codebase.**

## 3. Dependencies

- **F3 M1** (API layer): `getBirthProfile`, `createBirthProfile`, `updateBirthProfile` — CLOSED, dùng nguyên trạng.
- **F3 M2** (hooks): `useBirthProfileQuery`, `useCreateBirthProfileMutation`, `useUpdateBirthProfileMutation`, `birthProfileKeys` — CLOSED, dùng nguyên trạng.
- **F3 M3** (`BirthProfileForm`): CLOSED, dùng nguyên trạng — **không sửa** component này ở M5 (kể cả khi thiếu prop `mode` so với plan cũ, mục 4 xác nhận không cần).
- **F3 M4** (List page + Delete): CLOSED, dùng nguyên trạng — Delete **không** thuộc phạm vi M5 (đã có, chỉ cần E2E gọi tới).
- **G-05** (CI backend thật): CLOSED, dùng nguyên trạng, không cần sửa `frontend-ci.yml`.
- Shared: `apiClient`, `queryClient`, `error-messages.ts`, `Alert`, `Button`, `Container`, `Skeleton`, `EmptyState` (M4) — dùng nguyên trạng, không sửa.

## 4. Existing Implementation Audit

| Area | Existing implementation | Reuse? | Missing? | Action |
|---|---|---|---|---|
| Birth Profile API service | `features/birth-profile/api/{createBirthProfile,updateBirthProfile,getBirthProfile}.ts` (M1) | ✅ | — | Không đổi |
| Hooks/query logic | `useCreateBirthProfileMutation`, `useUpdateBirthProfileMutation`, `useBirthProfileQuery`, `birthProfileKeys` (M2) | ✅ | — | Không đổi |
| Stores | Không có store nào cho Birth Profile (đúng chủ đích — form state cục bộ, page state cục bộ) | N/A | — | Không tạo store mới |
| `BirthForm` | `features/birth-profile/ui/BirthProfileForm/` (M3), 2 bước, không có prop `mode` | ✅ | — | Không sửa |
| Step 1/2 | Đã implement trong `BirthProfileForm.tsx` | ✅ | — | Không đổi |
| Validation schemas | `schema.ts` (`birthProfileFormSchema`, `.superRefine` cho INV-BP1) | ✅ | — | Không đổi |
| Location Search | `LocationSearchField.tsx` (M3), dùng `useLocationSearchQuery` (M2) | ✅ | — | Không đổi |
| Loading/error/empty states (List) | `EmptyState` (M4, `variant="default"/"danger"`), `Skeleton` | ✅ (tái dùng style tương tự cho Edit) | — | Dùng `EmptyState variant="danger"` cho lỗi fetch profile ở Edit |
| Toast mechanism | **Không tồn tại** trong `shared/ui/` | ❌ | ✅ | Xem Discrepancy D1 — dùng `Alert variant="success"` + `setTimeout` theo pattern `register/page.tsx` |
| Router | `router.tsx`, `routesConfig`, `ProtectedRoute` bọc sẵn `app`, `Suspense` bọc sẵn ở `AppLayout` | ✅ | ✅ (thiếu 2 route con) | Thêm 2 entry vào `children` của route `app` |
| Protected routes | `ProtectedRoute` (component, đã CLOSED F1/F2) | ✅ | — | Không sửa |
| Page lazy-loading pattern | `const XPage = lazy(() => import("@pages/.../page"))` khai báo đầu file `router.tsx` | ✅ | — | Theo đúng pattern |
| E2E infrastructure | `e2e/auth.spec.ts` (serial, `beforeAll`/`afterAll` page dùng chung, semantic selectors) | ✅ | — | Tạo file E2E mới theo đúng pattern này (không sửa `auth.spec.ts`) |
| CI workflow (G-05) | `frontend-ci.yml` — Postgres service + backend thật + `npm run test:e2e` | ✅ | — | Không sửa |
| Test helpers/fixtures | `@test/render` (`renderWithProviders`), `@test/msw-server`, `features/birth-profile/api/mocks/handlers.ts` (M1) | ✅ | — | Dùng nguyên trạng cho unit/component/integration test |
| 404/invalid-id handling | `NotFoundPage` (route-level, catch-all `*`) cho URL sai hoàn toàn; **chưa có pattern riêng cho "route đúng nhưng resource không tồn tại"** | Một phần | ✅ | Edit page tự xử lý qua `EmptyState variant="danger"` inline (không điều hướng sang `NotFoundPage` — route vẫn hợp lệ, chỉ dữ liệu không tồn tại/không thuộc user) |

## 5. Files to Create

```
frontend/src/pages/app/profiles/new/page.tsx
frontend/src/pages/app/profiles/new/page.test.tsx
frontend/src/pages/app/profiles/edit/page.tsx
frontend/src/pages/app/profiles/edit/page.test.tsx
frontend/e2e/birth-profile.spec.ts
```

**Về tên thư mục Edit — khác với gợi ý `[id]` của prompt gốc, xem Decision Log**: prompt gốc gợi ý `pages/app/profiles/[id]/edit/page.tsx` (bracket notation kiểu Next.js). Audit xác nhận: dự án này **không** dùng file-based routing (route khai báo tay trong `routesConfig`, tên thư mục dưới `pages/` chỉ là tổ chức source code, không ảnh hưởng route thật — bằng chứng: `pages/auth/login` ánh xạ `/login`, không phải `/auth/login`), và **không có bất kỳ tiền lệ bracket-folder nào** trong toàn repo. Đưa `[id]` vào sẽ là tạo 1 convention hoàn toàn mới, không có căn cứ, đúng điều mục 4 prompt gốc cấm ("Không tự tạo convention routing mới"). Quyết định: dùng `pages/app/profiles/edit/page.tsx` (phẳng, nhất quán với `new`/`login`/`register` — `id` chỉ là route param lấy qua `useParams()`, không cần phản ánh trong tên thư mục).

## 6. Files to Modify

```
frontend/src/app/router.tsx   — thêm 2 lazy import + 2 route con vào children của route "app"
```

Không có file nào khác cần sửa — đã kiểm chứng `BirthProfileForm`, các hook M2, `apiClient`, `queryClient` đều đủ dùng nguyên trạng.

## 7. Detailed Implementation Steps

### M5-T1 — Repository & Architecture Audit
Đã thực hiện trong plan này (mục 2-4). Không có task code.

### M5-T2 — Create Page
- **Goal**: `BirthProfileCreatePage` render `BirthProfileForm`, nối `useCreateBirthProfileMutation`.
- **Files**: `pages/app/profiles/new/page.tsx`, `page.test.tsx`.
- **Implementation**:
  ```tsx
  export default function BirthProfileCreatePage() {
    const navigate = useNavigate();
    const mutation = useCreateBirthProfileMutation();

    const handleSubmit = (values: BirthProfileFormValues) => {
      // values.birthLocation đã được Zod .superRefine đảm bảo non-null lúc submit (M3)
      mutation.mutate(values as CreateBirthProfileInput, {
        onSuccess: () => setTimeout(() => navigate("/app/profiles"), 2000),
      });
    };

    return (
      <Container className="py-8">
        <h1 className="text-display-sm font-semibold">Tạo hồ sơ sinh mới</h1>
        {mutation.isSuccess && (
          <Alert variant="success" title="Tạo hồ sơ thành công! Đang chuyển về danh sách..." />
        )}
        {mutation.isError && !mutation.isSuccess && (
          <Alert variant="danger" title={getErrorMessage(mutation.error.errorCode)} />
        )}
        <BirthProfileForm onSubmit={handleSubmit} isLoading={mutation.isPending || mutation.isSuccess} />
      </Container>
    );
  }
  ```
  Đúng pattern `register/page.tsx`: `isLoading` khóa form cả lúc `isPending` LẪN `isSuccess` (tránh submit lại trong 2s chờ điều hướng).
- **Type note**: `BirthProfileFormValues` (form) và `CreateBirthProfileInput` (API) có shape giống hệt nhau về field (đã xác nhận ở M1/M3 — `birthLocation` nested cả 2 phía) nhưng là 2 type khai báo độc lập — cast tường minh `as CreateBirthProfileInput` chấp nhận được ở **đúng điểm ranh giới Submit Boundary** (page, không phải trong form) vì đây chính xác là nơi mapping form→API được phép diễn ra theo thiết kế M3 (mục 12 M3 plan: "mapping sang API request là trách nhiệm container/page").
- **Dependencies**: M5-T1.
- **Test**: render đúng `BirthProfileForm`; submit gọi `mutation.mutate` với đúng payload; `isSuccess` hiển thị Alert + form disabled; `isError` hiển thị Alert lỗi tương ứng.
- **Acceptance criteria**: đúng luồng 8 bước mục 6 prompt gốc.

### M5-T3 — Edit Page
- **Goal**: `BirthProfileEditPage` — fetch, map, populate, submit update.
- **Files**: `pages/app/profiles/edit/page.tsx`, `page.test.tsx`.
- **Implementation**:
  ```tsx
  export default function BirthProfileEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: profile, isLoading, isError } = useBirthProfileQuery(id);
    const mutation = useUpdateBirthProfileMutation();

    if (isLoading) return <Skeleton .../>;                       // đúng pattern loading M4
    if (isError || !profile) return <EmptyState variant="danger"  // KHÔNG điều hướng NotFoundPage —
      title="Không thể tải hồ sơ" .../>;                          // route hợp lệ, chỉ data lỗi/không có quyền

    const handleSubmit = (values: BirthProfileFormValues) => {
      mutation.mutate({ id: id!, input: values as UpdateBirthProfileInput }, {
        onSuccess: () => setTimeout(() => navigate("/app/profiles"), 2000),
      });
    };

    return (
      <Container className="py-8">
        <h1 className="text-display-sm font-semibold">Sửa hồ sơ sinh</h1>
        {mutation.isSuccess && <Alert variant="success" title="Cập nhật thành công! Đang chuyển về danh sách..." />}
        {mutation.isError && !mutation.isSuccess && <Alert variant="danger" title={getErrorMessage(mutation.error.errorCode)} />}
        <BirthProfileForm
          defaultValues={toFormValues(profile)}
          onSubmit={handleSubmit}
          isLoading={mutation.isPending || mutation.isSuccess}
        />
      </Container>
    );
  }
  ```
- **INV-BP1 bảo toàn**: `values` submit ra từ `BirthProfileForm` đã pass `.superRefine` (M3) nên LUÔN nhất quán `isBirthTimeKnown ⟺ birthTime`; page gửi **toàn bộ** `values` (không diff), đúng quyết định đã chốt ở M3 mục 9 ("Submit luôn gửi toàn bộ BirthProfileFormValues hiện tại") — tự động thỏa mãn invariant mà không cần code thêm ở M5.
- **Dependencies**: M5-T1, M5-T2 (tái dùng cấu trúc Alert success/error).
- **Test**: loading state hiển thị `Skeleton`; fetch lỗi (403/404) hiển thị `EmptyState danger`, KHÔNG render form; fetch thành công → `BirthProfileForm` nhận đúng `defaultValues` (verify field cụ thể, học từ bài học M3: assert `historicalTimezoneId` riêng, không `toEqual` nguyên khối); submit gọi `mutation.mutate` với đúng `{id, input}`.
- **Acceptance criteria**: đúng luồng 9 bước mục 7 prompt gốc.

### M5-T4 — Route Registration
- **Goal**: đăng ký 2 route mới.
- **Files**: `router.tsx` (MODIFY).
- **Implementation**:
  ```tsx
  const BirthProfileCreatePage = lazy(() => import("@pages/app/profiles/new/page"));
  const BirthProfileEditPage = lazy(() => import("@pages/app/profiles/edit/page"));
  // ...trong children của route "app", sau { path: "profiles", ... }:
  { path: "profiles/new", element: <BirthProfileCreatePage /> },
  { path: "profiles/:id/edit", element: <BirthProfileEditPage /> },
  ```
  Đặt `profiles/new` TRƯỚC `profiles/:id/edit` (không bắt buộc về mặt matching — React Router v6 dùng specificity scoring, không phải thứ tự tuyệt đối như v5 — nhưng giữ thứ tự này cho dễ đọc/nhất quán).
- **Dependencies**: M5-T2, M5-T3.
- **Test**: không cần test riêng cho route registration (đã phủ gián tiếp qua E2E + component test dùng `MemoryRouter`).
- **Acceptance criteria**: `/app/profiles/new`, `/app/profiles/:id/edit` render đúng page, vẫn bị chặn bởi `ProtectedRoute` khi chưa đăng nhập.

### M5-T5 — Success/Error UX
Đã tích hợp trực tiếp trong M5-T2/T3 (không tách task riêng vì 2 page dùng chung 1 pattern — tách sẽ tạo phụ thuộc chéo không cần thiết).

### M5-T6 — Component/Integration Tests
- **Goal**: hoàn thiện ma trận test mục 11.
- **Files**: 2 file `page.test.tsx` đã tạo ở T2/T3.
- **Dependencies**: M5-T2, M5-T3.

### M5-T7 — E2E
- **Goal**: `e2e/birth-profile.spec.ts` — full CRUD happy-path.
- **Files**: `e2e/birth-profile.spec.ts` (CREATE — **không sửa `auth.spec.ts`**, đúng nguyên tắc "existing infra đã đáp ứng, chỉ cần theo đúng pattern").
- **Implementation**: theo đúng cấu trúc `auth.spec.ts` — `test.describe.configure({mode:"serial"})`, 1 `page` xuyên suốt qua `beforeAll`, tự Register+Login trong `beforeAll` (spec tự chứa, không phụ thuộc thứ tự chạy với `auth.spec.ts`), dữ liệu định danh bằng timestamp (`e2e-bp-${Date.now()}@test.local`), chọn phần tử bằng `getByLabel`/`getByRole` (không thêm `data-testid`).
- **Dependencies**: M5-T4 (route phải tồn tại).
- **Acceptance criteria**: đúng kịch bản đầy đủ ở mục 12.

### M5-T8 — CI Verification
- **Goal**: xác nhận `npm run test:e2e` (bao gồm spec mới) chạy được trên G-05 CI thật.
- **Files**: không (dùng `frontend-ci.yml` nguyên trạng — spec mới tự động được `playwright.config.ts`'s `testDir: "./e2e"` nhặt vào mà không cần sửa config).
- **Dependencies**: M5-T7.

## 8. Data Flow

**Create:**
```
BirthProfileCreatePage
  → BirthProfileForm (validate qua .superRefine, M3)
  → onSubmit(values: BirthProfileFormValues)
  → useCreateBirthProfileMutation().mutate(values as CreateBirthProfileInput)
  → createBirthProfile (M1) → apiClient.post("/api/v1/birth-profiles")
  → Backend → 201 BirthProfile
  → onSuccess: invalidateQueries(birthProfileKeys.lists()) [đã có sẵn từ M2]
  → setTimeout(2000) → navigate("/app/profiles")
```

**Edit:**
```
BirthProfileEditPage
  ← useParams<{id}>()
  → useBirthProfileQuery(id) → getBirthProfile (M1) → apiClient.get("/api/v1/birth-profiles/{id}")
  → toFormValues(profile) → defaultValues cho BirthProfileForm
  → BirthProfileForm (validate qua .superRefine)
  → onSubmit(values)
  → useUpdateBirthProfileMutation().mutate({id, input: values as UpdateBirthProfileInput})
  → updateBirthProfile (M1) → apiClient.patch("/api/v1/birth-profiles/{id}")
  → Backend → 200 BirthProfile
  → onSuccess: invalidateQueries(lists() + detail(id)) [đã có sẵn từ M2]
  → setTimeout(2000) → navigate("/app/profiles")
```

## 9. Routing Design

```
/app/profiles/new       → BirthProfileCreatePage  (lazy, pages/app/profiles/new/page.tsx)
/app/profiles/:id/edit  → BirthProfileEditPage    (lazy, pages/app/profiles/edit/page.tsx)
```

- Cả 2 là children của `{path: "app", element: <ProtectedRoute/>}` → tự động protected.
- Nằm trong cùng nhóm layout `<AppLayout>` đã bọc `<Suspense>` — không cần `Suspense` riêng.
- Route param: `:id` lấy qua `useParams<{id: string}>()` trong `BirthProfileEditPage` — đúng convention React Router v6 chuẩn, không có abstraction param nào khác trong repo cần theo.
- Không đổi thứ tự/vị trí của route `index`/`profiles` đã có.

## 10. Error & Loading States

| State | Create | Edit | Expected UX |
|---|---|---|---|
| Loading (page mount) | N/A (không fetch gì trước khi render form) | `Skeleton` (đúng shape đã dùng ở M4 List loading) | Edit chờ `useBirthProfileQuery` |
| Validation error | `BirthProfileForm` tự hiển thị (M3, `Input error`) | Giống Create | Không cần code thêm ở M5 |
| API error (submit) | `Alert variant="danger"` với `getErrorMessage(mutation.error.errorCode)` | Giống Create | Form vẫn giữ dữ liệu đã nhập, không clear |
| Fetch error (Edit only) | N/A | `EmptyState variant="danger"` thay thế toàn bộ page content (không render form) | 403/404 khi profile không tồn tại/không thuộc user |
| 404 (route-level, URL sai) | N/A | `NotFoundPage` (route-level, không phải lỗi fetch — ví dụ gõ nhầm `/app/profiles/edit` thiếu `:id` sẽ không khớp route nào, catch-all `*` xử lý) | Đã có sẵn từ F1, không cần code thêm |
| Success | `Alert variant="success"` + form disabled 2s → navigate | Giống Create | Đúng pattern `register/page.tsx` |

## 11. Testing Plan

**Unit/Component** (risk-based, không đặt % coverage cứng — đúng Coding Standards đã áp dụng xuyên suốt F3):
- Create: render `BirthProfileForm`; submit gọi đúng mutation với đúng payload; success hiển thị Alert + khóa form; error hiển thị Alert đúng message.
- Edit: loading hiển thị `Skeleton`; fetch lỗi hiển thị `EmptyState danger` KHÔNG render form; fetch thành công populate đúng `defaultValues` (assert từng field, đặc biệt `historicalTimezoneId`); submit gọi đúng `{id, input}`; success/error giống Create.

**Integration**: Create/Edit page test đã dùng MSW thật (`server.use(...)` với factory sẵn có từ M1: `createBirthProfileSuccess`, `getBirthProfileSuccess`, `updateBirthProfileSuccess`, và các factory lỗi `birthProfileNotFound`/`birthProfileForbidden`/`birthProfileValidationError`) — không tạo factory mock mới.

**Không viết test nào chỉ để tăng coverage** — mỗi test map trực tiếp tới 1 rủi ro thật (submit sai payload, populate sai field, không khóa form lúc success, hiển thị sai state).

**E2E**: xem mục 12.

## 12. E2E Scenario

```
Precondition:
  - CI đã chạy xong: Postgres service up, backend build+start qua node dist/server.js,
    health-check /live pass, Playwright webServer (npm run dev) sẵn sàng tại
    http://localhost:5173.
  - Không cần fixture/seed data thủ công — spec tự tạo user mới qua Register.

Steps (file mới: e2e/birth-profile.spec.ts, test.describe.configure({mode:"serial"})):
  1. Register user mới (email: `e2e-bp-${Date.now()}@test.local`) — lặp lại đúng bước
     Register của auth.spec.ts (spec tự chứa, không phụ thuộc thứ tự chạy file khác).
  2. Login với user vừa tạo.
  3. page.goto("/app/profiles") — xác nhận heading "Hồ sơ sinh của tôi", EmptyState
     "Bạn chưa có hồ sơ sinh nào" (user mới, chưa có hồ sơ).
  4. Click "Tạo hồ sơ mới" → xác nhận URL /app/profiles/new.
  5. Điền Bước 1 (label, birthDate, birthTime hoặc tick "Không rõ giờ sinh"), qua Bước 2,
     gõ địa điểm (chờ >= 2 ký tự + có birthDate), chọn 1 suggestion từ dropdown thật
     (backend geonames/geo-tz thật — không mock ở E2E), submit.
  6. Xác nhận Alert "Tạo hồ sơ thành công!" xuất hiện (role="status" hoặc tương đương
     Alert component thật render), rồi tự điều hướng về /app/profiles sau ~2s
     (page.waitForURL("**/app/profiles")).
  7. Xác nhận hồ sơ vừa tạo xuất hiện trong danh sách (đúng label đã nhập).
  8. Click "Sửa" trên hồ sơ đó → xác nhận URL /app/profiles/:id/edit, form populate
     đúng dữ liệu cũ (kiểm tra giá trị input label/birthDate).
  9. Đổi label sang giá trị mới, submit.
  10. Xác nhận Alert thành công, điều hướng về /app/profiles, label mới xuất hiện
      trong danh sách (label cũ không còn).
  11. Click "Xóa" trên hồ sơ đó → Modal xác nhận (đã có từ M4) → click "Xóa" trong modal.
  12. Xác nhận hồ sơ không còn trong danh sách, EmptyState "Bạn chưa có hồ sơ sinh nào"
      xuất hiện lại.

Expected Results: toàn bộ 12 bước pass, không bước nào cần page.waitForTimeout() tùy
  tiện (dùng waitForURL/expect...toBeVisible với timeout mặc định của Playwright).

Cleanup: không có bước cleanup DB tường minh — đúng convention auth.spec.ts (dữ liệu
  tồn tại trong Postgres ephemeral của CI job, bị hủy cùng container khi job kết thúc).

Cách chạy trên CI: không cần thay đổi gì ở frontend-ci.yml — `npm run test:e2e` (đã
  được cấu hình sẵn ở bước "Run E2E Tests" của G-05) tự động nhặt mọi file khớp
  playwright.config.ts's testDir: "./e2e", bao gồm birth-profile.spec.ts mới.
```

## 13. Security / Ownership

- Cả 2 route đều là children của `ProtectedRoute` — chưa đăng nhập sẽ bị chặn trước khi tới page (đã CLOSED từ F2, không cần code thêm).
- Backend là nguồn thẩm quyền DUY NHẤT cho ownership (đã xác nhận từ M1: 403 khi profile thuộc user khác, thứ tự `findById`→ownership check) — Edit page **không** tự kiểm tra `profile.userId === currentUser.id` ở frontend; chỉ hiển thị `EmptyState danger` khi backend trả 403/404, không cố "đoán" hay chặn sớm hơn.
- Không expose bất kỳ field nhạy cảm nào của user khác — vì request luôn scope theo access token hiện tại (`apiClient` tự đính kèm, không đổi).

## 14. UX / Accessibility

- Heading `<h1>` duy nhất mỗi trang ("Tạo hồ sơ sinh mới"/"Sửa hồ sơ sinh").
- Focus: không tự thêm focus-management mới (route `index`/`profiles`/`login` hiện tại cũng không có auto-focus-on-navigate riêng — giữ nhất quán, đúng TODO đã ghi nhận sẵn trong `router.tsx` là việc của milestone khác, không phải M5).
- Loading/disabled: `isLoading`/`isPending` prop của `BirthProfileForm` đã tự xử lý disable input/submit button trong lúc pending (M3) — M5 chỉ cần truyền đúng `mutation.isPending || mutation.isSuccess`.
- Error association: `Alert` component đã có sẵn semantics đúng (dùng nguyên trạng, không sửa).
- Responsive: `BirthProfileForm`/`Container` đã responsive từ M3/F1 — không cần code riêng cho M5.
- Không biến M5 thành accessibility redesign — chỉ tái dùng nguyên trạng.

## 15. Known Risks

- **`setTimeout(2000)` trước khi navigate**: nếu người dùng điều hướng đi (đóng tab, back button) trong lúc chờ, timer vẫn treo tới khi component unmount — React Router v6 không tự hủy `setTimeout` khi unmount. Rủi ro thấp (không gây lỗi crash, `navigate()` gọi trên component đã unmount chỉ log warning vô hại trong dev, không ảnh hưởng production) nhưng nên `useEffect` cleanup nếu muốn triệt để — **không bắt buộc cho M5** vì `register/page.tsx` (F2, đã CLOSED) cũng có đúng rủi ro này và chưa từng gây vấn đề thật.
- **E2E phụ thuộc geonames/geo-tz thật** (bước 5, location search) — nếu service bên thứ 3 chậm/lỗi tạm thời, E2E có thể flaky. Không có mitigation nào khác ngoài `retries: 2` đã cấu hình sẵn cho CI (G-05) — chấp nhận được, không phải rủi ro mới do M5 tạo ra (location search đã public từ M1).
- **Cast `values as CreateBirthProfileInput`/`as UpdateBirthProfileInput`** ở Submit Boundary — an toàn vì 2 type thật sự cấu trúc giống nhau (đã verify), nhưng nếu 1 trong 2 type đổi shape trong tương lai mà không đồng bộ, cast này sẽ không tự báo lỗi ở compile-time (rủi ro kế thừa từ chính thiết kế Submit Boundary của M3, không phải lỗi mới của M5).

## 16. Open Questions / Decisions

Không có Open Question mới cần Phuc Hoang quyết định — mọi điểm mơ hồ tiềm ẩn (tên thư mục Edit, cơ chế thông báo thành công) đã được giải quyết bằng bằng chứng trực tiếp từ repository (mục Discrepancies dưới).

## 17. Acceptance Criteria

- [ ] Create page hoạt động đúng luồng mục 6 prompt gốc
- [ ] Edit page hoạt động đúng luồng mục 7 prompt gốc
- [ ] Cả 2 route protected bởi `ProtectedRoute`
- [ ] Lazy loading đúng pattern hiện có (`lazy(() => import(...))`)
- [ ] Alert thành công hiển thị đúng (thay Toast — xem Discrepancy D1)
- [ ] Redirect về `/app/profiles` sau 2s
- [ ] Loading/error state đúng bảng mục 10
- [ ] INV-BP1 được bảo toàn (kế thừa tự động từ M3, không cần code thêm ở M5)
- [ ] Unit/component test pass
- [ ] E2E CRUD happy path pass trên backend thật (G-05)

## 18. Definition of Done

- `npm run lint && npm run typecheck && npm run format:check && npm run build` sạch
- Test liên quan pass (`npx vitest run src/pages/app/profiles`)
- `npx vitest run --passWithNoTests` giữ nguyên toàn bộ test M1-M4 (363 test) + test mới M5 đều pass
- E2E `birth-profile.spec.ts` pass trên CI thật (G-05)
- Không phá ranh giới kiến trúc (page chỉ orchestration, không gọi `apiClient` trực tiếp)
- Không có TODO/FIXME chưa phân loại trong code mới
- Router.tsx chỉ thêm, không tái cấu trúc phần đã có

---

## Specification vs Implementation Discrepancies

### D1 — Toast không tồn tại, prompt M5 yêu cầu Toast

- **Expected**: prompt M5 (mục 6, 9, 17) yêu cầu "hiển thị Toast thông báo kết quả" sau Create/Edit thành công.
- **Actual**: `shared/ui/` không có `Toast` (xác nhận `find` không ra kết quả, giống gap đã ghi nhận từ M4 cho `EmptyState`/`PageErrorState`/`Toast` — lúc đó M4 đã hoãn xây `Toast` vì quá nặng so với nhu cầu, dùng `Alert` cục bộ thay thế cho case xóa thất bại).
- **Impact**: nếu chặn cứng theo đúng chữ "Toast", M5 sẽ phải tự dựng cả 1 hạ tầng notification (`ToastProvider` + `useToast()` + queue/auto-dismiss) — vượt xa quy mô 1 milestone "Create/Edit Pages & Routing", và lặp lại chính xác gap đã quyết định hoãn ở M4.
- **Recommended action**: tái dùng pattern thật đã có sẵn và đang chạy tốt trên E2E — `pages/auth/register/page.tsx` (F2, CLOSED) giải quyết đúng nhu cầu tương tự bằng `{mutation.isSuccess && <Alert variant="success" title="..."/>}` kết hợp `setTimeout(() => navigate(...), 2000)` và khóa form bằng `isPending || isSuccess`. M5 áp dụng verbatim pattern này cho cả Create và Edit.
- **Blocks M5?**: **Không** — đây là quyết định có căn cứ trực tiếp (tiền lệ code thật, không phải suy đoán), nhất quán với quyết định đã áp dụng ở M4 cho cùng loại gap.

### D2 — `BirthProfileForm` không có prop `mode`, khác mô tả trong `Sprint_F3_M3_Implementation_Plan.md`

- **Expected**: `Sprint_F3_M3_Implementation_Plan.md` mục 10 mô tả `BirthProfileFormProps` gồm `mode: "create" | "edit"`.
- **Actual**: implementation thật (đọc trực tiếp `BirthProfileForm.tsx`) chỉ có `{defaultValues?, onSubmit, isLoading?}` — không có `mode`.
- **Impact**: không có tác động tiêu cực — hành vi form (2 bước, state machine giờ sinh, location search) hoàn toàn không phụ thuộc `create`/`edit` (đã xác nhận cả ở M3 plan lẫn code thật: "State machine không phụ thuộc mode"), nên bỏ prop này là hợp lý, không phải thiếu sót.
- **Recommended action**: không cần sửa `BirthProfileForm` — M5 chỉ cần biết interface thật (mục 2, 4) khi viết Create/Edit page, không viện dẫn `mode` ở bất kỳ đâu.
- **Blocks M5?**: **Không**.

### D3 — Tên thư mục Edit page: `[id]` (prompt gợi ý) vs không có tiền lệ bracket-folder nào trong repo

- **Expected**: prompt M5 mục 4 gợi ý `pages/app/profiles/[id]/edit/page.tsx`.
- **Actual**: dự án dùng route khai báo tay (`routesConfig`), không dùng file-based routing; không có bracket-folder nào từng tồn tại; tên thư mục dưới `pages/` không cần khớp URL (`pages/auth/login` → route `/login`).
- **Impact**: nếu làm đúng y hệt gợi ý của prompt, sẽ tạo ra 1 convention đặt tên hoàn toàn mới, không nhất quán với phần còn lại của `pages/`, vi phạm trực tiếp yêu cầu "Không tự tạo convention routing mới" của chính prompt.
- **Recommended action**: dùng `pages/app/profiles/edit/page.tsx` (phẳng, nhất quán với `new`).
- **Blocks M5?**: **Không** — quyết định đã chốt trong mục 5, developer triển khai theo đúng path này.

### Final Recommendation

```text
READY FOR IMPLEMENTATION
```

Không có blocker thật nào được phát hiện. Cả 3 discrepancy trên đều có bằng chứng trực tiếp đủ để quyết định mà không cần thêm thông tin từ Phuc Hoang trước khi bắt đầu code M5.
