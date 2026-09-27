# Sprint F3 — M4 Implementation Plan: Birth Profiles List Page & Pagination

**Lập ngày:** 2026-09-26
**Trạng thái:** Implementation Plan only — chưa viết code

## 1. Milestone Overview

- **Milestone**: Sprint F3 — M4: Birth Profiles List Page & Pagination
- **Objective**: Xây `pages/app/profiles/page.tsx` — trang danh sách Birth Profile với loading/empty/error/data state, phân trang Prev/Next, điều hướng Create/Edit, xóa qua modal xác nhận.
- **Scope**: 1 page component + phần route registration còn thiếu + 3 component Design System mới (đánh giá kỹ ở mục 2) + test đầy đủ.
- **Non-goals**: form tạo/sửa (đã CLOSED ở M3, không redesign), trang chi tiết Birth Profile, mọi thứ thuộc Chart/Swiss Ephemeris/Interpretation, không reopen F3-OQ-1/2/3.

## 2. Repository Audit

### 2.1 Route registration — CONFIRMED MISSING, phải làm ở M4

`frontend/src/app/router.tsx` hiện tại (đọc trực tiếp): route `app` chỉ có 1 child duy nhất — `index: true` → `AppPage` (placeholder "Sprint F2/F3 - Dashboard"). **`/app/profiles`, `/app/profiles/new`, `/app/profiles/:id/edit` chưa tồn tại** — có TODO comment sẵn trong code xác nhận: `// TODO(Core): Ánh xạ đầy đủ các route của Phase 1/2/3`. M4 phải đăng ký `/app/profiles` (route thật của M4); `/app/profiles/new` và `/app/profiles/:id/edit` **chỉ cần điều hướng tới** (dùng `<Link>`), **không cần đăng ký route đích thật** vì trang Create/Edit thuộc milestone khác (M5 theo Sprint F3 master plan) — điều hướng tới 1 route chưa đăng ký sẽ rơi vào catch-all `*` (404) cho tới khi M5 hoàn thành, đây là hành vi tạm thời chấp nhận được, không phải lỗi của M4.

### 2.2 Query/Mutation hooks — CONFIRMED EXISTING (M2, CLOSED), dùng nguyên trạng

- `useBirthProfilesQuery(params?: ListBirthProfilesParams)` (`features/birth-profile/hooks/useBirthProfilesQuery.ts`): `useQuery({queryKey: birthProfileKeys.list(params), queryFn: () => listBirthProfiles(params)})` — không override `retry`/`staleTime`. Trả `UseQueryResult<ListBirthProfilesResponse>` nguyên vẹn (`data`, `isLoading`, `isError`, `error`, `isFetching`, `refetch`...).
- `ListBirthProfilesResponse` (`features/birth-profile/api/types.ts`): `{items: BirthProfile[], total: number, page: number, pageSize: number}` — **không có `totalPages`/`hasNextPage`** — M4 phải tự tính (mục 5).
- `useDeleteBirthProfileMutation()` (`features/birth-profile/hooks/useDeleteBirthProfileMutation.ts`): `useMutation({mutationFn: (id: string) => deleteBirthProfile(id), onSuccess: () => invalidateQueries({queryKey: birthProfileKeys.lists()})})` — không có `onError` riêng (dựa vào default toàn cục của `queryClient.ts`).
- `birthProfileKeys` (`features/birth-profile/hooks/query-keys.ts`): `.lists() → ["profiles"]`, `.list(params) → ["profiles", params]`, `.detail(id) → ["profile", id]`.
- `BirthProfile` (response, flat): có `id`, `label` (bắt buộc), `fullName` (optional/nullable), `birthDate`, `birthTime`, `isBirthTimeKnown`, `placeName`, `latitude`, `longitude`, `historicalTimezoneId`, `warnings`, `createdAt`, `updatedAt`.

### 2.3 Design System — 3 gap thật quan trọng (không suy diễn có sẵn)

`ls shared/ui/` xác nhận đầy đủ 21 component hiện có: `Alert, Avatar, Badge, Button, Card, Checkbox, Container, Divider, Grid, Input, Label, Modal, Radio, Section, Select, Skeleton, SkipLink, Spinner, Stack, Switch, Textarea`.

| Component prompt/spec giả định có sẵn | Thực tế | Nguồn |
|---|---|---|
| `EmptyState` | **KHÔNG tồn tại** — dù được đặc tả đầy đủ ở UI Spec §18.3 (`icon`/`illustration`, `title`, `description`, `action`) | `ls shared/ui/` + UI Spec §18.3 |
| `PageErrorState` (dùng cho lỗi tải trang toàn phần) | **KHÔNG tồn tại** — UI Spec §18.4 mô tả rõ: "tương tự `EmptyState` nhưng tone khác" | UI Spec §18.4 |
| `Toast variant="danger"` (dùng cho lỗi hành động — submit/mutation thất bại) | **KHÔNG tồn tại** — UI Spec §18.4 quy định rõ đây là cơ chế chuẩn cho lỗi hành động (không dùng inline cho case này) | UI Spec §18.4 |

**Quyết định (Decision Log, không phải Open Question chặn — áp dụng đúng nguyên tắc đã dùng nhất quán ở M2/M3 cho gap loại này: `useDebounce` được xây vì hẹp/thật cần; `Progress`/`Combobox` bị hoãn vì bản đầy đủ theo spec nặng hơn nhu cầu thực tế):**

1. **`EmptyState` → XÂY MỚI** (`shared/ui/EmptyState/`): shape hẹp, rõ ràng, tái sử dụng được cho nhiều trang tương lai đã liệt kê trong chính UI Spec (Chart list rỗng, Knowledge Base search rỗng). Props: `icon?: ReactNode`, `title: ReactNode`, `description?: ReactNode`, `action?: ReactNode`, và **thêm `variant?: "default" | "danger"`** để cùng lúc phục vụ `PageErrorState` (spec tự nói 2 component này giống hệt nhau về cấu trúc, chỉ khác tone) — tránh dựng 2 component gần như trùng lặp. `PageErrorState` **không tồn tại như 1 component riêng** — dùng `<EmptyState variant="danger" .../>` thay thế.
2. **`Toast` → HOÃN, không xây ở M4.** Lý do: Toast là hạ tầng cross-cutting thật sự (cần `ToastProvider`/context toàn app + `useToast()` hook + queue/stacking/auto-dismiss) — nặng hơn hẳn nhu cầu hẹp của M4 ("báo xóa thất bại"), đúng tinh thần "Keep M4 simple... Do not introduce... unless repository evidence demonstrates a real need" (mục 19 prompt gốc). **M4 dùng `Alert variant="danger"` cục bộ trong trang** (component đã có sẵn, có sẵn slot `actions`/`onDismiss`) để báo lỗi xóa thất bại, thay vì Toast. Ghi nhận `Toast` là gap Design System kế thừa, để dành cho milestone dựng hạ tầng notification riêng khi có nhu cầu thật ở nhiều nơi hơn 1 page.
3. Không tạo `shared/ui/Pagination` (đã loại trừ tường minh bởi chính OQ-3 — chỉ cần Prev/Next + text hiển thị, không cần component riêng).

### 2.4 Modal — CONFIRMED, dùng nguyên trạng

`ModalProps`: `{isOpen, onClose, title, description?, children?, footer?, variant?: "default"|"danger", size?, closeOnOverlayClick?}`. Không có slot `primaryAction`/`secondaryAction` riêng — footer nhận `ReactNode` tự do, M4 tự compose 2 `<Button>` (Hủy + Xóa) vào `footer`.

### 2.5 Testing infrastructure — CONFIRMED pattern tái dùng

`pages/auth/login/page.test.tsx` xác nhận pattern wrapper chuẩn cho page test: `<QueryClientProvider client={createQueryClient()}><MemoryRouter initialEntries={...}><Routes>...</Routes></MemoryRouter></QueryClientProvider>`. M4 tái dùng y hệt, cộng thêm `server.use(...)` với factory MSW đã có sẵn từ M1 (`listBirthProfilesSuccess`, `deleteBirthProfileSuccess`, `birthProfileMalformedRequest`, v.v. trong `features/birth-profile/api/mocks/handlers.ts`) — **không tạo factory MSW mới**, không tạo cơ chế mock thứ 2.

### 2.6 Wording "vĩnh viễn" — không có tiền lệ thật trong code, chỉ có khuyến nghị trước đó

Grep toàn bộ `src/`+`docs/` xác nhận **chưa từng có** text "vĩnh viễn"/"permanent" nào được implement ở bất kỳ đâu trong codebase — đây là copy mới hoàn toàn cho M4, không phải "theo convention có sẵn" (khuyến nghị dùng ngôn ngữ này chỉ mới xuất hiện ở `Sprint_F3_Implementation_Plan.md` §2.6, tài liệu do Claude viết, chưa từng biến thành code thật). Xem copy đề xuất ở mục 6.

### Confirmed existing / Missing / Not required (tổng hợp)

| Hạng mục | Trạng thái |
|---|---|
| `useBirthProfilesQuery`, `useDeleteBirthProfileMutation`, `birthProfileKeys` | Confirmed existing |
| `/app/profiles` route | Missing — phải tạo ở M4 |
| `/app/profiles/new`, `/app/profiles/:id/edit` route đích | Missing nhưng **không thuộc M4** (chỉ cần `<Link>` trỏ tới) |
| `Modal`, `Alert`, `Button`, `Card`, `Skeleton`, `Stack` | Confirmed existing, dùng nguyên trạng |
| `EmptyState` (kèm `variant="danger"` cho error) | Missing — **M4 phải xây** (shared/ui, hẹp, đúng spec) |
| `PageErrorState` (component riêng) | Missing — **không xây riêng**, dùng `EmptyState variant="danger"` |
| `Toast` | Missing — **không thuộc M4**, dùng `Alert` cục bộ thay thế |
| `shared/ui/Pagination` | Not required (OQ-3 loại trừ) |
| Zustand store cho pagination | Not required (page state cục bộ `useState`, đúng mục 18 prompt gốc) |
| MSW factory cho birth-profile | Confirmed existing (M1), dùng nguyên trạng |

## 3. Architecture & Data Flow

```
BirthProfilesPage (pages/app/profiles/page.tsx)
    ↓ useState(page) — local, không Zustand
    ↓ useBirthProfilesQuery({page, pageSize: 20})
    ↓ listBirthProfiles (M1)
    ↓ GET /api/v1/birth-profiles?page=&pageSize=
```

```
User click "Xóa" trên 1 item
    ↓ setState(deletingProfile: BirthProfile)  ← mở Modal variant="danger"
    ↓ User xác nhận
    ↓ useDeleteBirthProfileMutation().mutate(deletingProfile.id)
    ↓ Backend DELETE /api/v1/birth-profiles/{id}
    ↓ onSuccess (đã có sẵn từ M2): invalidateQueries(birthProfileKeys.lists())
    ↓ useBirthProfilesQuery tự refetch (TanStack Query v5, không cần code thêm)
    ↓ Danh sách cập nhật, item biến mất
    ↓ Page tự đóng Modal khi mutation.isSuccess (mục 6)
```

## 4. Detailed Implementation Tasks

### T1 — Route Registration
- **Objective**: đăng ký `/app/profiles` trong `router.tsx`.
- **Files**: `frontend/src/app/router.tsx` (MODIFY — thêm 1 child route, không tái cấu trúc phần còn lại).
- **Implementation**: thêm `{path: "profiles", element: <BirthProfilesPage />}` vào mảng `children` của `AppLayout` (cạnh `index: true`), theo đúng pattern `lazy(() => import("@pages/app/profiles/page"))` như các page khác.
- **Dependencies**: không.
- **Edge cases**: không đụng route `index`/`AppPage` hiện có.
- **Completion criteria**: điều hướng `/app/profiles` render đúng `BirthProfilesPage`, các route khác không đổi hành vi.

### T2 — `EmptyState` component (shared/ui, mới)
- **Objective**: component dùng chung cho cả trạng thái rỗng và lỗi toàn trang (mục 2.3).
- **Files**: `shared/ui/EmptyState/index.tsx`, `shared/ui/EmptyState/index.test.tsx` (CREATE).
- **Props**: `{icon?: ReactNode, title: ReactNode, description?: ReactNode, action?: ReactNode, variant?: "default" | "danger"}`.
- **Implementation**: `variant="danger"` đổi màu icon/title theo token `danger` đã có (tương tự cách `Alert` dùng `variant`), không thêm animation phức tạp (đúng mục 19 prompt gốc — "no premature").
- **Dependencies**: không (component thuần).
- **Test**: render đúng title/description/action theo props; `variant="danger"` áp đúng class màu.
- **Completion criteria**: `npm run typecheck` sạch, test pass, không phá component nào khác.

### T3 — `BirthProfilesPage` skeleton & data fetching
- **Objective**: gọi `useBirthProfilesQuery`, xử lý 4 trạng thái (loading/empty/error/data).
- **Files**: `pages/app/profiles/page.tsx` (CREATE).
- **Implementation**:
  ```tsx
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const { data, isLoading, isError, error, refetch } =
    useBirthProfilesQuery({ page, pageSize: PAGE_SIZE });

  if (isLoading) return <Skeleton .../> // giữ đúng layout danh sách (UI Spec §18.2)
  if (isError) return <EmptyState variant="danger" title="Không thể tải danh sách hồ sơ"
    description={...} action={<Button onClick={() => refetch()}>Thử lại</Button>} />
  if (data.items.length === 0) return <EmptyState title="Bạn chưa có hồ sơ sinh nào"
    action={<Button onClick={() => navigate("/app/profiles/new")}>Tạo hồ sơ mới</Button>} />
  // render data.items
  ```
- **Dependencies**: T1, T2.
- **Edge cases**: không hiển thị `EmptyState` (rỗng) trong lúc `isLoading` — kiểm tra `isLoading` TRƯỚC `data.items.length === 0` (thứ tự if quan trọng, đúng cảnh báo mục 4 prompt gốc "Do not show an empty state while the query is still loading").
- **Completion criteria**: 4 trạng thái hiển thị đúng, đúng thứ tự ưu tiên.

### T4 — List rendering (Card, responsive)
- **Objective**: hiển thị từng `BirthProfile` bằng `Card` (đã có sẵn), đủ thông tin nhận diện.
- **Files**: `pages/app/profiles/page.tsx` (tiếp tục T3).
- **Implementation**: mỗi item render `label` (nổi bật nhất — đây là "tên hồ sơ" người dùng đặt), `fullName` (nếu có), `birthDate` (định dạng hiển thị dd/MM/yyyy, không hiển thị `birthTime` nếu `!isBirthTimeKnown`), `placeName`. **Không** hiển thị `latitude`/`longitude`/`historicalTimezoneId` (dữ liệu kỹ thuật, không cần thiết cho nhận diện — đúng "Use actual fields... Do not invent additional business fields" nhưng cũng không cần hiển thị MỌI field). Layout: `Stack`/`Grid` chứa nhiều `Card`, mỗi `Card` có 2 action ở cuối: "Sửa" (`<Link to={`/app/profiles/${profile.id}/edit`}>`) và "Xóa" (`<Button variant="danger" onClick={() => setDeletingProfile(profile)}>`).
- **Dependencies**: T3.
- **Responsive**: `Grid` với `cols` responsive theo breakpoint có sẵn (1 cột mobile, 2-3 cột tablet/desktop) — dùng đúng token Grid đã có, không tự định nghĩa breakpoint mới (mục 12 prompt gốc).
- **Completion criteria**: dữ liệu hiển thị đúng, responsive không vỡ layout ở 3 kích thước.

### T5 — Pagination controls
- **Objective**: Prev/Next + chỉ số trang hiện tại, đúng F3-OQ-3.
- **Files**: `pages/app/profiles/page.tsx` (tiếp tục).
- **Implementation**: `const hasNextPage = page * PAGE_SIZE < data.total;` (tính từ `total`/`page`/`pageSize` trả về — backend không có `hasNextPage`/`totalPages`, mục 2.2). Nút "Trước" `disabled={page === 1}`, nút "Sau" `disabled={!hasNextPage}`. Text hiển thị "Trang {page}" (không cần tổng số trang vì OQ-3 không yêu cầu numbered pagination). Đổi `page` → `useBirthProfilesQuery` tự refetch (query key đổi theo `params`).
- **Dependencies**: T3.
- **Edge cases**: xem mục 5 (delete cuối trang).
- **Completion criteria**: đúng ma trận mục 7.

### T6 — Delete flow (Modal + mutation)
- **Objective**: xóa với xác nhận, đúng luồng 12 bước mục 9 prompt gốc.
- **Files**: `pages/app/profiles/page.tsx` (tiếp tục).
- **Implementation**: xem chi tiết mục 6 (Delete UX) — bao gồm xử lý `isPending` (disable nút Xóa trong modal, tránh double-submit), tự đóng modal khi `isSuccess`, giữ modal mở + hiển thị `Alert danger` bên trong modal khi `isError`.
- **Dependencies**: T4, T5 (cần biết profile đang xóa thuộc trang nào để xử lý edge case trang rỗng).
- **Completion criteria**: đúng 12 bước + ma trận mục 7.

### T7 — Component Tests
- **Objective**: hoàn thiện `page.test.tsx` theo ma trận mục 7.
- **Files**: `pages/app/profiles/page.test.tsx` (CREATE).
- **Dependencies**: T1–T6.

### T8 — Quality Gates
- **Files**: không. Chạy lệnh mục 14.

## 5. Pagination Design (F3-OQ-3 — KHÔNG mở lại)

- **Initial page**: `1`.
- **Page size**: hằng số cục bộ `PAGE_SIZE = 20` khai báo trong `page.tsx` (khớp default backend `pageSize=20` — không cần đồng bộ 2 nơi vì backend tự áp dụng default nếu không truyền, nhưng M4 truyền tường minh để logic `hasNextPage` phía client tính đúng mà không phụ thuộc "đoán" giá trị default của backend).
- **Page state location**: `useState<number>(1)` cục bộ trong `BirthProfilesPage` — **không** Zustand, không URL query param (URL sync không được prompt yêu cầu, thêm vào sẽ là scope creep không có evidence cần thiết, đúng mục 19).
- **Query parameter construction**: `useBirthProfilesQuery({page, pageSize: PAGE_SIZE})` — không truyền `sortBy`/`order` (dùng default backend `createdAt`/`desc`, đúng hành vi mặc định hợp lý cho danh sách hồ sơ, không có yêu cầu sort nào từ prompt).
- **Previous-page disabled**: `page === 1`.
- **Next-page disabled**: `!(page * PAGE_SIZE < data.total)`.
- **Current page display**: text tĩnh "Trang {page}" — không cần tổng số trang (OQ-3 không yêu cầu numbered pagination).
- **Behavior khi trang rỗng sau xóa**: xem mục 6 (Delete + Pagination Edge Case).
- **Behavior khi đổi trang**: `useBirthProfilesQuery` tự vào lại trạng thái `isFetching` (TanStack Query v5 giữ `data` cũ hiển thị trong lúc fetch trang mới nếu không có `placeholderData` cấu hình riêng — mặc định `isLoading` chỉ `true` ở lần fetch đầu tiên của 1 query key mới, các lần đổi `params` sau đó là `isFetching` mà `data` vẫn giữ nguyên bản cũ cho tới khi có bản mới — đây là hành vi mặc định của TanStack Query v5, **không cần code thêm gì**, chỉ cần UI hiển thị 1 chỉ báo `isFetching` nhẹ (ví dụ dim nhẹ danh sách cũ) thay vì full Skeleton lại khi đổi trang, để tránh giật layout — dùng `isFetching && !isLoading` để phân biệt "đổi trang" với "lần tải đầu").
- **Behavior khi backend báo không còn trang sau**: không có field `hasNextPage` từ backend — tự suy ra từ `total`, xem trên.

## 6. Delete UX

- **Modal**: `Modal variant="danger"`, `title="Xóa hồ sơ sinh"`, `description` = nội dung cảnh báo.
- **Wording đề xuất** (mới, không có tiền lệ code — mục 2.6): "Bạn có chắc muốn xóa hồ sơ **{label}**? Hành động này **không thể hoàn tác** và dữ liệu sẽ bị xóa vĩnh viễn." — dùng đúng tinh thần "vĩnh viễn" đã khuyến nghị từ Sprint F3 master plan §2.6 (vì backend là soft-delete nhưng không có endpoint restore, UI phải coi là vĩnh viễn).
- **Footer** (`footer` prop): 2 `<Button>` — "Hủy" (`variant="secondary"`, `onClick={onClose}`) và "Xóa" (`variant="danger"`, `isLoading={mutation.isPending}`, `disabled={mutation.isPending}`).
- **Mutation state**: `mutation.isPending` → disable cả 2 nút (tránh vừa xóa vừa hủy giữa chừng) và hiện `isLoading` trên nút Xóa.
- **Invalidation**: đã có sẵn từ M2 (`onSuccess` invalidate `birthProfileKeys.lists()`), M4 không viết lại — chỉ tiêu thụ `mutation.isSuccess`/`isPending`/`isError` từ hook.
- **Failure**: giữ Modal **mở** (không tự đóng khi lỗi), hiển thị `Alert variant="danger"` bên trong Modal (dùng slot `children`/dưới `description`) với message lỗi tương ứng — item không biến mất khỏi danh sách (vì không invalidate khi lỗi).
- **Modal đóng khi nào**: (1) user bấm "Hủy" → đóng ngay, không gọi mutation; (2) `mutation.isSuccess === true` → tự đóng modal (qua `useEffect` theo dõi `isSuccess`, hoặc `onSuccess` callback truyền thêm vào `.mutate(id, {onSuccess: () => setDeletingProfile(null)})` — **ưu tiên cách thứ 2** (truyền `onSuccess` cục bộ vào lệnh gọi `mutate`, không phải định nghĩa lại hook) để tránh tạo thêm `useEffect` không cần thiết; (3) lỗi → **không tự đóng**, cho user thấy lỗi và tự quyết định Hủy hay thử lại.
- **Final-page deletion (mục 10 prompt gốc, phân tích kỹ)**: kịch bản trang 3 chỉ còn 1 item, xóa xong trang 3 rỗng nhưng trang 2 vẫn còn data. Sau khi `invalidateQueries` + refetch với `params={page:3,...}` thành công, `data.items.length === 0 && page > 1` → **tự động lùi về `page - 1`** (`setPage(p => p - 1)`) qua 1 `useEffect` theo dõi `data`/`page` (đây là trường hợp DUY NHẤT trong M4 cần `useEffect` theo dõi query result, vì nó phản ứng với kết quả fetch chứ không phải side-effect của user input — khác hẳn lý do M3 tránh `useEffect` cho form). Điều kiện `page > 1` đảm bảo không nhầm với empty-state hợp lệ ở trang 1 (chưa từng có hồ sơ nào). Đây là UX chủ động tránh "stranded on an empty page" đúng yêu cầu mục 10 prompt gốc, dựa hoàn toàn trên `total`/`page`/`pageSize` đã có sẵn từ backend — không cần thay đổi gì ở API/backend.

## 7. Testing Plan

| Scenario | Expected Result |
|---|---|
| Loading | `Skeleton` hiển thị, không render `EmptyState`/data |
| Empty | `EmptyState` (default) + text "Tạo hồ sơ mới" hiển thị |
| Error | `EmptyState variant="danger"` hiển thị, **không** hiển thị nhầm thành Empty thường |
| Data | Đúng số lượng `Card`, đúng field hiển thị (`label`, `birthDate`, `placeName`) |
| Create CTA | Click "Tạo hồ sơ mới" → điều hướng `/app/profiles/new` (assert qua route hiển thị trong `MemoryRouter` test, không cần route đích thật render đúng nội dung) |
| Edit | Click "Sửa" trên 1 item → điều hướng `/app/profiles/:id/edit` với đúng `id` |
| Delete open | Click "Xóa" → `Modal variant="danger"` mở, đúng wording "vĩnh viễn" |
| Delete cancel | Click "Hủy" → modal đóng, **không** có request DELETE nào được gửi (MSW `onUnhandledRequest` sẽ throw nếu có, xác nhận gián tiếp) |
| Delete confirm | Click "Xóa" trong modal → mutation gọi đúng `id`, nút chuyển `isLoading` |
| Delete success | Sau khi mock 204 thành công → item biến mất khỏi danh sách (qua refetch thật, không giả lập optimistic) |
| Delete failure | Mock lỗi 500/403 → item **vẫn còn**, `Alert danger` hiển thị trong modal, modal không tự đóng |
| Pagination next | Mock `total` đủ lớn cho 2 trang → click "Sau" → `useBirthProfilesQuery` gọi lại với `page:2` (assert qua request thật nhận được, dùng lại kỹ thuật capture request đã dùng ở M1) |
| Pagination previous | Từ trang 2 → click "Trước" → về trang 1 |
| First page | Nút "Trước" `disabled` |
| Last page | Mock `total = page*pageSize` (không còn dư) → nút "Sau" `disabled` |
| Delete final item on page | Mock trang 2 (page>1) chỉ có 1 item → xóa → sau refetch trả `items:[]` cho trang 2 → tự động lùi về trang 1, hiển thị lại data trang 1 |

Test end-to-end delete flow (mục 14 prompt gốc) viết thành **1 test riêng, đầy đủ 9 bước** (mở modal → xác nhận wording → confirm → verify request đúng `id` → mock success → verify item biến mất qua UI, không kiểm tra chi tiết implementation nội bộ của invalidate) + **1 test cancel riêng** (5 bước, verify mutation KHÔNG được gọi) — đúng yêu cầu mục 14.

## 8. Accessibility

- Page heading: `<h1>` "Hồ sơ sinh của tôi" (hoặc tương đương), duy nhất trên trang.
- Nút "Tạo hồ sơ mới": `<Link>` render dưới dạng button có `role` ngầm định đúng (dùng `Button as={Link}` nếu Button hỗ trợ `as`, hoặc `<Link><Button>...</Button></Link>` — kiểm tra API `Button` thật lúc code, không giả định).
- "Sửa"/"Xóa" mỗi item: có `aria-label` cụ thể kèm tên hồ sơ (ví dụ `aria-label="Sửa hồ sơ {label}"`) để tránh nhiều nút "Sửa" giống hệt nhau gây mơ hồ khi dùng screen reader.
- Modal: `Modal` component đã có sẵn `useFocusTrap` (xác nhận từ code) — không cần tự implement focus trap.
- Nút Prev/Next khi `disabled`: dùng thuộc tính `disabled` native (không chỉ CSS mờ đi) — screen reader tự thông báo đúng trạng thái.
- Loading/Error/Empty state: `EmptyState` cần `role="status"` (empty, không phải lỗi nghiêm trọng) hoặc để mặc định (đủ vì có text rõ ràng); trạng thái lỗi nên cân nhắc `role="alert"` cho phần mô tả lỗi để screen reader thông báo chủ động — quyết định chi tiết khi code T2.

## 9. Responsive Behavior

- **Mobile**: `Grid` 1 cột, mỗi `Card` full width, action Sửa/Xóa xếp dọc hoặc cạnh nhau tùy không gian (dùng `Stack direction="row"` nếu đủ chỗ).
- **Tablet**: `Grid` 2 cột (dùng token breakpoint có sẵn của `Grid`, không tự định nghĩa breakpoint mới).
- **Desktop**: `Grid` 2-3 cột tùy độ rộng `Container` đã dùng ở các trang khác.
- Pagination controls: giữ nguyên vị trí cuối danh sách ở mọi kích thước, không cần responsive riêng (chỉ là 2 nút + 1 text).

## 10. File Change Matrix

| File | Action |
|---|---|
| `frontend/src/app/router.tsx` | MODIFY (thêm 1 route) |
| `frontend/src/pages/app/profiles/page.tsx` | CREATE |
| `frontend/src/pages/app/profiles/page.test.tsx` | CREATE |
| `frontend/src/shared/ui/EmptyState/index.tsx` | CREATE |
| `frontend/src/shared/ui/EmptyState/index.test.tsx` | CREATE |
| `features/birth-profile/hooks/*`, `features/birth-profile/api/*` | NO CHANGE |
| `shared/api/client.ts`, `shared/api/queryClient.ts` | NO CHANGE |
| `widgets/app-layout/*` | NO CHANGE (thêm nav link "Hồ sơ sinh" vào sidebar thuộc M6 theo Sprint F3 master plan, không phải M4 — xem Risk mục 11) |

## 11. Risks / Edge Cases

- **Nhầm thứ tự kiểm tra `isLoading`/`isError`/empty** dẫn tới hiển thị sai state — đã chốt thứ tự tường minh ở T3.
- **`EmptyState` xây thiếu `variant`** rồi phải quay lại thêm sau khi đã dùng cho cả 2 use case — quyết định thêm `variant` ngay từ đầu (T2) để tránh phải sửa lại giao diện component giữa milestone.
- **Auto-lùi trang sau xóa item cuối** dùng `useEffect` — rủi ro loop vô hạn nếu điều kiện `page > 1` viết sai (ví dụ quên check, dẫn tới cố lùi xuống `page: 0`) — test riêng case này (mục 7) để bắt sớm.
- **Sidebar `AppLayout` vẫn chưa có link "Hồ sơ sinh"** (đã biết từ audit Sprint F3 master plan trước đó — 2 link hiện có là `<a href="/">` placeholder) — **không thuộc phạm vi M4** theo đúng milestone breakdown gốc (M6), nhưng nghĩa là sau M4, người dùng chỉ vào được `/app/profiles` bằng cách gõ thẳng URL cho tới khi M6 làm xong — chấp nhận được vì đúng thứ tự milestone đã lên kế hoạch, ghi nhận ở đây để không ai bất ngờ.
- **`Toast` bị hoãn** → nếu tương lai có nhiều nơi cần thông báo tương tự trước khi milestone dựng `Toast` chính thức tới, sẽ có nhiều chỗ dùng `Alert` cục bộ rải rác — chấp nhận được ở quy mô hiện tại (M4 chỉ 1 chỗ dùng).

## 12. Definition of Done

- 3 file CREATE + 1 file MODIFY (mục 10) tồn tại đúng, không file nào ngoài danh sách bị sửa
- Toàn bộ ma trận test mục 7 pass, bao gồm 2 test end-to-end delete/cancel đầy đủ bước
- `npm run typecheck && npm run lint && npm run format:check && npm run build` sạch
- `npx vitest run --passWithNoTests` — giữ nguyên toàn bộ test cũ (M1-M3) + test mới M4 đều pass
- Không route/hook/component nào của M1-M3 bị sửa ngoài `router.tsx` (chỉ thêm, không tái cấu trúc)

## 13. Acceptance Criteria

Đúng 1:1 với mục 22 prompt gốc — đã thiết kế đáp ứng đầy đủ ở mục 3–9 trên.

## 14. Exit Criteria

```bash
cd frontend
npm run typecheck
npx vitest run src/pages/app/profiles src/shared/ui/EmptyState
npx vitest run --passWithNoTests
npm run lint
npm run format:check
npm run build
```

Đúng 1:1 với mục 23 prompt gốc (10 điều kiện) — không có TODO/FIXME không phân loại nào được thêm; không dependency Chart; không global state thừa (page state cục bộ); boundary kiến trúc giữ nguyên (page chỉ orchestrate, không tự gọi HTTP client, dùng đúng `features/birth-profile/hooks` đã có).

---

## Repository findings that materially affect implementation

1. `/app/profiles` chưa được đăng ký route — phải làm ở M4 (mục 2.1).
2. `EmptyState`, `PageErrorState`, `Toast` đều được UI Spec quy định nhưng **chưa từng được xây** — cùng loại gap đã gặp ở M2 (`useDebounce`)/M3 (`Progress`, `Combobox`) — xử lý nhất quán: xây cái hẹp/thật cần (`EmptyState`), hoãn cái nặng hơn nhu cầu thực tế (`Toast`).
3. `ListBirthProfilesResponse` không có `totalPages`/`hasNextPage` — M4 tự suy ra từ `total`/`page`/`pageSize`.
4. Không có tiền lệ code thật cho wording "vĩnh viễn" — là copy mới, dựa trên khuyến nghị trước đó của Sprint F3 master plan §2.6.
5. Sidebar `AppLayout` chưa có link tới `/app/profiles` — đúng kế hoạch thuộc M6, không phải thiếu sót của M4.

## Explicit list of assumptions

- `PAGE_SIZE = 20` chọn khớp default backend, không có yêu cầu cụ thể nào khác từ prompt/spec — UNVERIFIED liệu Product có muốn số khác, nhưng hợp lý làm mặc định.
- Sort mặc định backend (`createdAt desc`) được giữ nguyên, M4 không thêm UI chọn sort — không có yêu cầu nào từ prompt gốc đòi hỏi sort UI.

## Final Acceptance Criteria / Exit Criteria

Xem mục 13/14 ở trên — không lặp lại.
