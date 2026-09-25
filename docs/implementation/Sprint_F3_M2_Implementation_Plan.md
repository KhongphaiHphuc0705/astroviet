# Sprint F3 — M2 Implementation Plan: Query Keys & Hooks

**Lập ngày:** 2026-09-24
**Trạng thái:** Implementation Plan only — chưa viết code

> **Ghi chú mở đầu — file prompt bị cắt cụt**: `Sprint_F3_M2_Implementation_Plan_Prompt.md` dừng đột ngột giữa dòng ở mục "12. OQ-F..." (không có nội dung sau đó). Tôi không suy đoán nội dung bị thiếu. Thay vào đó, plan này dùng lại đúng cấu trúc 13 mục đã chứng minh hiệu quả ở `Sprint_F3_M1_Implementation_Plan.md` (được chính Phuc Hoang chấp nhận và implement đúng 100%) để đảm bảo không thiếu phần nào quan trọng (Backend Contract, File Changes, Test Matrix, Execution Order, DoD, Risks, Open Questions). Nếu file gốc mục 12+ có yêu cầu cụ thể khác, cần bổ sung sau khi Phuc Hoang cung cấp lại phần bị thiếu.

## 1. Milestone Overview

- **Tên**: Sprint F3 — M2: Query Keys & Hooks
- **Mục tiêu**: Xây lớp tích hợp TanStack Query v5 cho Birth Profile — 1 file query-key factory + 6 hook (2 query, 3 mutation, 1 query đặc biệt có debounce), dựa hoàn toàn trên API layer đã CLOSED ở M1.
- **Trong phạm vi**: `features/birth-profile/hooks/{query-keys, useBirthProfilesQuery, useBirthProfileQuery, useCreateBirthProfileMutation, useUpdateBirthProfileMutation, useDeleteBirthProfileMutation, useLocationSearchQuery}` + test tương ứng; **1 file mới ngoài `features/birth-profile/`**: `shared/hooks/useDebounce.ts` (lý do bắt buộc, xem mục 2 và Correction).
- **Ngoài phạm vi**: component/trang, Birth Form, Zustand store, routing, toast/UI feedback, navigation sau mutation.
- **Phụ thuộc**: M1 đã CLOSED trên `origin/dev` (commit `85c1790`, đã tự review độc lập — 6 hàm API + types + mocks/handlers.ts + 21 test đều pass, không regression).

## 2. Verified Existing Architecture

### 2.1 Sửa lại 4 giả định sai trong prompt gốc (Newly discovered issue — đối chiếu trực tiếp với repo thật)

| Giả định trong prompt | Thực tế xác nhận | Nguồn |
|---|---|---|
| `docs/specifications/Frontend_Architecture_Specification.md` | Đường dẫn thật: `docs/frontend/Frontend_Architecture_Specification.md` | `find docs` |
| `features/birth-profile/model/`, `features/birth-profile/mocks/` (2 thư mục riêng) | Không tồn tại. M1 thực tế chỉ có `features/birth-profile/api/{types.ts, mocks/handlers.ts, ...}` — mọi thứ nằm trong `api/` | Cây thư mục thật đã liệt kê |
| Tên file hook kiểu kebab-case (`use-birth-profiles-query.ts`) | **Sai hoàn toàn so với convention thật.** Toàn bộ hook của F2 dùng **camelCase**: `useLoginMutation.ts`, `useLogoutMutation.ts`, `useRegisterMutation.ts`, `useSessionBootstrap.ts` | `ls features/auth/hooks/` |
| `hooks/__tests__/` (thư mục test riêng) | Sai. Coding Standards §13.5 + thực tế F2: test **co-located** cạnh file nó test (`useLoginMutation.test.tsx` nằm ngay cạnh `useLoginMutation.ts`), không có `__tests__/` ở bất kỳ đâu trong `src/` | Coding Standards §13.5 + `ls features/auth/hooks/` |

→ **M2 dùng tên file thật theo convention F2**: `query-keys.ts` (không có tiền lệ hook nào tên này ở F2 vì auth không cần, nhưng đây là tên hợp lý duy nhất, giữ nguyên như prompt gợi ý vì không mâu thuẫn gì), `useBirthProfilesQuery.ts`, `useBirthProfileQuery.ts`, `useCreateBirthProfileMutation.ts`, `useUpdateBirthProfileMutation.ts`, `useDeleteBirthProfileMutation.ts`, `useLocationSearchQuery.ts` — camelCase, không kebab-case, test co-located cùng thư mục.

### 2.2 `features/auth/model/` là gì (làm rõ vì prompt liệt kê nó như nguồn tham khảo)

`features/auth/model/schema.ts` chứa **Zod schema validate FORM phía client** (`registerSchema`, `loginSchema` — dùng bởi `useZodForm` ở trang Login/Register), hoàn toàn khác với `api/types.ts` (DTO khớp backend contract). Đây không phải nơi chứa "model" cho tầng API/hook — **không liên quan tới M2** (M2 không có form). Ghi chú lại để milestone Birth Form sau này (không phải M2) biết đặt Zod form schema ở `features/birth-profile/model/schema.ts` khi tới lúc.

### 2.3 `queryClient.ts` — 2 default quan trọng M2 phải biết, không được ghi đè tùy tiện

```ts
defaultOptions: {
  queries: { retry: false },  // comment gốc: "auth session không dùng useQuery"
  mutations: { onError: (error) => { if (!isKnownBusinessError(...)) reportError(...) } }
}
```

- `retry: false` áp dụng **toàn cục cho mọi `useQuery`**, kể cả các hook M2 sắp tạo — đây sẽ là lần đầu tiên `useQuery` thật sự được dùng trong codebase (F2 chỉ có `useMutation`). Theo đúng yêu cầu "không tự ý override global default chỉ để cho chắc", **M2 giữ nguyên `retry: false`**, không set `retry` riêng ở bất kỳ hook nào — dù comment gốc cho thấy default này được nghĩ ra khi chưa có `useQuery` thật. Ghi nhận đây là điểm nên revisit sau khi có UI thật (list load lỗi mạng sẽ không tự retry) — không phải việc M2 quyết định.
- `onError` toàn cục đã tự báo lỗi cho **mọi mutation** (không phân biệt feature) nếu lỗi không thuộc `isKnownBusinessError`. Bằng chứng: cả 3 mutation hook của F2 (`useLoginMutation`, `useLogoutMutation`, `useRegisterMutation`) đều **không** định nghĩa `onError` riêng — xác nhận qua grep, 0 kết quả. → **3 mutation hook của M2 cũng không tự viết `onError`** (trừ phi có nhu cầu side-effect đặc thù, mà theo scope mục 3 thì không có).

### 2.4 Chưa từng có `invalidateQueries`/`useQueryClient` trong codebase

Grep xác nhận `features/auth/` không dùng `invalidateQueries` ở đâu cả (auth không có list query để invalidate). **M2 là nơi đầu tiên** pattern này xuất hiện — không có tiền lệ để "theo", chỉ có yêu cầu tường minh từ prompt (mục 7-9) và từ TanStack Query v5 idiom chuẩn.

### 2.5 Test harness pattern (xác nhận từ 4 file test hook có sẵn)

Mọi hook test dùng chung 1 wrapper: `<QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>` (không dùng singleton `queryClient` export sẵn — mỗi test tạo instance mới để cô lập cache giữa các test). M2 theo đúng pattern này.

### 2.6 Correction quan trọng — `useDebounce` được Architecture Spec yêu cầu nhưng CHƯA từng được xây

`Frontend_Architecture_Specification.md` dòng 183 và 223 liệt kê rõ: `shared/hooks/ # useMediaQuery, useDebounce... (không gắn domain)`. Nhưng `ls src/shared/hooks/` xác nhận thư mục này hiện chỉ có `useFocusTrap.ts`, `useMountAnimation.ts`, `usePosition.ts`, `useZodForm.ts` — **`useDebounce` chưa từng tồn tại**, dù đã được spec từ trước (gap kế thừa từ F1, không phải lỗi của M2). Mục 11 của prompt gốc cũng ngầm giả định nó "hiện có" ("có nên dùng `useDebounce` hiện có không?") — giả định này sai.

**Quyết định (có căn cứ trực tiếp từ spec, không phải tự ý mở rộng phạm vi)**: M2 tạo `shared/hooks/useDebounce.ts` — generic, không gắn domain Birth Profile, đúng vị trí spec đã chỉ định — rồi `useLocationSearchQuery` tiêu thụ nó. Đây **không phải premature abstraction** (spec đã định vị trí từ trước) và **không phải sửa file đã có** (là file mới, không đụng gì tới các hook `shared/hooks/` khác).

## 3. Backend Contract Summary (tham chiếu M1, không lặp lại toàn bộ)

M2 không gọi trực tiếp backend — chỉ gọi lại 6 hàm đã có ở `features/birth-profile/api/*.ts` (M1). Điểm cần nhắc lại vì ảnh hưởng trực tiếp thiết kế hook:
- `searchLocations({q, date})`: `date` bắt buộc, không optional (xác nhận lại `SearchLocationsParams` trong `api/types.ts` thật) — `useLocationSearchQuery` phải `enabled: false` hoàn toàn khi chưa có `date` hợp lệ, không được gọi API với `date: undefined`.
- `updateBirthProfile(id, input)`: trả về `BirthProfile` đầy đủ (flat) — dùng trực tiếp làm optimistic cache update nếu cần (không bắt buộc ở M2, xem mục 12).
- Không có endpoint nào trả `403`/`404` cho chính `listBirthProfiles`/`searchLocations` (đã xác nhận ở M1) — hook không cần xử lý case đặc biệt nào cho 2 query này ngoài lỗi chung `ApiError`.

## 4. File Changes

### Files to create
```
frontend/src/shared/hooks/useDebounce.ts              (mục 2.6 — vị trí đúng theo Architecture Spec, không phải feature-specific)
frontend/src/shared/hooks/useDebounce.test.ts
frontend/src/features/birth-profile/hooks/query-keys.ts
frontend/src/features/birth-profile/hooks/query-keys.test.ts
frontend/src/features/birth-profile/hooks/useBirthProfilesQuery.ts
frontend/src/features/birth-profile/hooks/useBirthProfilesQuery.test.tsx
frontend/src/features/birth-profile/hooks/useBirthProfileQuery.ts
frontend/src/features/birth-profile/hooks/useBirthProfileQuery.test.tsx
frontend/src/features/birth-profile/hooks/useCreateBirthProfileMutation.ts
frontend/src/features/birth-profile/hooks/useCreateBirthProfileMutation.test.tsx
frontend/src/features/birth-profile/hooks/useUpdateBirthProfileMutation.ts
frontend/src/features/birth-profile/hooks/useUpdateBirthProfileMutation.test.tsx
frontend/src/features/birth-profile/hooks/useDeleteBirthProfileMutation.ts
frontend/src/features/birth-profile/hooks/useDeleteBirthProfileMutation.test.tsx
frontend/src/features/birth-profile/hooks/useLocationSearchQuery.ts
frontend/src/features/birth-profile/hooks/useLocationSearchQuery.test.tsx
```
Không tạo `features/birth-profile/index.ts` — quyết định này để dành cho milestone UI đầu tiên thật sự cần barrel export (M4/M5 theo master plan), tránh tạo barrel rỗng/chưa ai dùng.

### Files to modify
Không có.

### Files explicitly not to modify
- `frontend/src/shared/api/client.ts`, `frontend/src/shared/api/queryClient.ts` — không sửa, chỉ đọc default đã có (mục 2.3).
- Toàn bộ `frontend/src/features/birth-profile/api/**` (đã CLOSED ở M1) — M2 chỉ import, không sửa.
- `frontend/src/features/auth/**` — không đụng.

## 5. Query Key Factory (`features/birth-profile/hooks/query-keys.ts`)

```ts
import type { ListBirthProfilesParams } from "../api/types";

export const birthProfileKeys = {
  lists: () => ["profiles"] as const,
  list: (params?: ListBirthProfilesParams) => ["profiles", params] as const,
  detail: (id: string) => ["profile", id] as const,
};
```

**Lưu ý kiến trúc quan trọng**: `['profiles', params]` và `['profile', id]` là **2 namespace độc lập, không lồng nhau** (khác số ít/số nhiều, xác nhận đúng UI Spec §15.2 nguyên văn). Điều này có nghĩa: invalidate `birthProfileKeys.lists()` (`['profiles']`) **không** tự động invalidate `['profile', id]` — đây chính là lý do Update mutation (mục 8) phải gọi `invalidateQueries` **2 lần riêng biệt**, không phải 1 lần với prefix chung. `as const` đảm bảo readonly tuple, tương thích TanStack Query v5 (`QueryKey` type yêu cầu mảng, không yêu cầu tuple nhưng `as const` giúp TypeScript suy luận chính xác từng phần tử thay vì union type rộng).

Test cho file này chỉ cần xác nhận tính chất đã nêu ở mục 4 của prompt gốc: `list(paramsA) !== list(paramsB)` (khác reference nhưng khác nội dung — thực ra test nên assert bằng `toEqual` nội dung khác nhau, không phải identity), `detail(idA) !== detail(idB)` (nội dung), và cấu trúc mảng đúng thứ tự phần tử.

## 6. Hook Implementation

### 6.1 `useBirthProfilesQuery(params?: ListBirthProfilesParams)`
```ts
useQuery({
  queryKey: birthProfileKeys.list(params),
  queryFn: () => listBirthProfiles(params),
});
```
- Không set `staleTime`/`retry` riêng — dùng default toàn cục (mục 2.3; UI Spec dòng 999 xác nhận rõ profiles dùng mặc định TanStack Query, không phải `Infinity`).
- `enabled`: không cần gate — `params` optional, gọi được ngay cả khi `undefined` (M1 đã xác nhận backend tự áp dụng default).
- Trả nguyên `UseQueryResult` (không destructure/transform) — component tự chọn field cần dùng.

### 6.2 `useBirthProfileQuery(id: string | undefined)`
```ts
useQuery({
  queryKey: birthProfileKeys.detail(id ?? ""),
  queryFn: () => getBirthProfile(id as string),
  enabled: Boolean(id),
});
```
- `enabled: Boolean(id)` đúng như prompt gợi ý — không có convention nào khác trong repo mâu thuẫn với cách này (F2 không có tiền lệ `useQuery` để đối chiếu, nhưng đây là idiom chuẩn TanStack Query v5 cho "query phụ thuộc tồn tại của id", ví dụ điển hình khi vào trang edit trước khi `id` từ URL param sẵn sàng).
- `ApiError` không bị wrap — để nguyên trong `error` field của `UseQueryResult`, component tự `instanceof ApiError` nếu cần phân biệt.

### 6.3 `useCreateBirthProfileMutation()`
```ts
const queryClient = useQueryClient();
return useMutation({
  mutationFn: createBirthProfile,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: birthProfileKeys.lists() });
  },
});
```
- Không `onError` riêng (mục 2.3). Không invalidate detail (đúng lý do prompt nêu: hồ sơ mới chưa có trong cache detail nào).
- Không navigation/toast/form logic (ngoài scope).

### 6.4 `useUpdateBirthProfileMutation()`
```ts
const queryClient = useQueryClient();
return useMutation({
  mutationFn: ({ id, input }: { id: string; input: UpdateBirthProfileInput }) =>
    updateBirthProfile(id, input),
  onSuccess: (_data, variables) => {
    queryClient.invalidateQueries({ queryKey: birthProfileKeys.lists() });
    queryClient.invalidateQueries({ queryKey: birthProfileKeys.detail(variables.id) });
  },
});
```
- `id` lấy từ `variables` (tham số thứ 2 của `onSuccess`) — type-safe, không cần đóng `id` qua closure ở tầng gọi hook (đúng yêu cầu prompt mục 8 "id được lấy từ mutation variables một cách type-safe").
- 2 lệnh `invalidateQueries` riêng biệt — bắt buộc vì 2 namespace độc lập (mục 5).

### 6.5 `useDeleteBirthProfileMutation()`
```ts
const queryClient = useQueryClient();
return useMutation({
  mutationFn: (id: string) => deleteBirthProfile(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: birthProfileKeys.lists() });
  },
});
```
- **Không dùng `removeQueries` cho detail cache.** Lý do (đúng yêu cầu prompt mục 9 "phải giải thích quyết định"): sau khi xóa, không có route nào còn hiển thị `/app/profiles/:id` với `id` vừa xóa (component sẽ điều hướng đi trước khi cache detail đó được đọc lại — thuộc trách nhiệm milestone UI). Nếu cache detail cũ vẫn tồn tại vô thời hạn trong bộ nhớ, tác động chỉ là tốn RAM nhỏ tới khi bị garbage-collect theo `gcTime` mặc định của TanStack Query — không có architectural reason đủ mạnh để chủ động `removeQueries` ở tầng hook (đúng tinh thần "không tự thêm nếu không có lý do kiến trúc" của prompt).

### 6.6 `useLocationSearchQuery({ query, date, enabled? }: {query: string; date: string | undefined; enabled?: boolean})`
```ts
const debouncedQuery = useDebounce(query, 300);
const isReady = Boolean(date) && debouncedQuery.trim().length >= 2 && (enabled ?? true);

return useQuery({
  queryKey: ["locationSearch", debouncedQuery, date],
  queryFn: () => searchLocations({ q: debouncedQuery, date: date as string }),
  enabled: isReady,
});
```
- **Debounce nằm ở tầng hook** (không phải shared utility ngoài `useDebounce` chung, không phải ở tầng `api/`) — đúng phân tích mục 11 prompt: tầng `api/searchLocations.ts` (M1) phải giữ "dumb", debounce là concern của tương tác người dùng (hook/UI), không phải của HTTP call thuần túy. `useDebounce` bản thân là generic (mục 2.6), không biết gì về location search.
- **Ngưỡng `q` tối thiểu 2 ký tự**: lấy đúng từ backend contract thật (`location-search.schema.ts`: `q: z.string().min(2)`, đã xác nhận ở M1) — không tự đặt threshold tùy tiện, dùng đúng số backend đã yêu cầu để tránh gọi API chắc chắn sẽ nhận 400.
- **`date` bắt buộc, không fallback `today`, không gọi khi thiếu** — đúng OQ-F3-2 đã RESOLVED: `enabled` gate `Boolean(date)` là điều kiện tiên quyết, không có nhánh nào bỏ qua điều kiện này.
- Query key `["locationSearch", debouncedQuery, date]` **không** dùng `birthProfileKeys` — đây là 1 concern khác (tìm kiếm địa điểm, không phải CRUD hồ sơ), không cần factory riêng cho 1 query duy nhất không có nhu cầu invalidate từ nơi khác (không over-engineer).
- **Về "location/timezone selection phải coi là stale khi `birthDate` đổi" (OQ-2 đã chốt)**: đây là hành vi thuộc **state của component Birth Form** (chọn lại location = xóa lựa chọn cũ khỏi form state), không phải thuộc về query cache của `useLocationSearchQuery` — hook chỉ chịu trách nhiệm fetch gợi ý khi được enable, không lưu "lựa chọn đã chọn". M2 không cần code gì thêm cho phần này; ghi chú lại để milestone Birth Form (M3) biết rõ ranh giới trách nhiệm.

## 7. Test Implementation

Toàn bộ test hook dùng chung 1 test wrapper (mục 2.5): `<QueryClientProvider client={createQueryClient()}>`, `renderHook` từ `@testing-library/react`, mock qua `server.use(...)` với factory đã có sẵn từ `features/birth-profile/api/mocks/handlers.ts` (M1) — **không viết factory MSW mới** cho M2 (tái dùng nguyên trạng: `createBirthProfileSuccess`, `getBirthProfileSuccess`, `listBirthProfilesSuccess`, `updateBirthProfileSuccess`, `deleteBirthProfileSuccess`, `searchLocationsSuccess`, và các factory lỗi `birthProfileNotFound`/`birthProfileForbidden`/`birthProfileValidationError`/`birthProfileMalformedRequest`).

| Hook | Test bắt buộc |
|---|---|
| `query-keys` | `list(paramsA)` khác `list(paramsB)` về nội dung; `detail(idA)` khác `detail(idB)`; `lists()` là prefix hợp lệ của `list(params)` (so 2 mảng, phần tử đầu khớp) |
| `useBirthProfilesQuery` | success trả đúng `items`/`total`; lỗi 400 → `error instanceof ApiError` |
| `useBirthProfileQuery` | success trả đúng profile; `enabled=false` khi `id` là `undefined` (verify **không có request nào được gửi** — dùng `onUnhandledRequest:"error"` sẵn có, không cần assert thủ công); 403/404 → đúng `errorCode` |
| `useCreateBirthProfileMutation` | success → `invalidateQueries` được gọi với đúng `birthProfileKeys.lists()` (spy `queryClient.invalidateQueries`); 422 → `error.errorCode` đúng, không throw ra ngoài React (bắt bằng `mutateAsync().catch()` hoặc đọc `result.current.error`) |
| `useUpdateBirthProfileMutation` | success → `invalidateQueries` được gọi **2 lần** với đúng 2 key (`lists()` và `detail(id)`); `id` đúng lấy từ variables (test với 2 `id` khác nhau, xác nhận key invalidate khớp `id` đã gọi, không phải giá trị cũ/hardcode) |
| `useDeleteBirthProfileMutation` | success → chỉ invalidate `lists()`, **không** gọi `removeQueries`/`invalidateQueries` cho detail (assert `queryClient.invalidateQueries` không được gọi với `birthProfileKeys.detail(...)`) |
| `useLocationSearchQuery` | dùng `vi.useFakeTimers({shouldAdvanceTime:true})` (đúng pattern có sẵn ở `pages/auth/register/page.test.tsx`): gõ liên tiếp nhiều ký tự trong <300ms → chỉ 1 request được gửi sau khi advance timer; `enabled=false` khi `date` là `undefined` → không có request nào (kể cả khi `query` hợp lệ); `q` < 2 ký tự → không gọi API dù đã debounce xong |
| `useDebounce` (`shared/hooks`) | giá trị trả về không đổi ngay lập tức khi input đổi liên tục; chỉ cập nhật sau khi hết thời gian debounce (dùng fake timers) |

## 8. Execution Order

```
1. Viết shared/hooks/useDebounce.ts + test (độc lập, không phụ thuộc Birth Profile)
2. Viết query-keys.ts + test
3. Viết 2 query hook (useBirthProfilesQuery → useBirthProfileQuery) + test ngay sau mỗi file
4. Viết 3 mutation hook (create → update → delete) + test ngay sau mỗi file — đặc biệt kỹ với update (2 lần invalidate)
5. Viết useLocationSearchQuery (phụ thuộc useDebounce đã có ở bước 1) + test
6. npm run typecheck sau mỗi 2-3 file
7. npx vitest run src/features/birth-profile/hooks src/shared/hooks/useDebounce.test.ts
8. npx vitest run --passWithNoTests (đảm bảo không phá 62 file/310 test hiện có)
9. npm run lint && npm run format:check && npm run build
```

## 9. Validation Commands

```bash
cd frontend
npm run typecheck
npx vitest run src/features/birth-profile/hooks src/shared/hooks
npx vitest run --passWithNoTests
npm run lint
npm run format:check
npm run build
```

## 10. Definition of Done

- 6 hook + `query-keys.ts` + `useDebounce.ts` (shared) tồn tại đúng vị trí, đúng tên camelCase
- Không hook nào override `retry`/`staleTime` toàn cục không có lý do (mục 2.3)
- Không hook mutation nào tự viết `onError` trùng với default toàn cục
- Update mutation gọi đúng 2 lần `invalidateQueries` với `id` lấy từ variables; Create/Delete chỉ invalidate `lists()`
- `useLocationSearchQuery` không bao giờ gọi API khi `date` thiếu, không dùng `new Date()` fallback, dùng đúng ngưỡng `q.length >= 2` từ backend contract thật
- `npm run typecheck` sạch, không `any`/cast không an toàn
- `npx vitest run --passWithNoTests` — giữ nguyên 310 test cũ + toàn bộ test mới pass, không skip/xóa test nào
- `shared/api/client.ts`, `shared/api/queryClient.ts`, mọi thứ trong `features/birth-profile/api/` không bị sửa

## 11. Risks / Edge Cases

- **2 namespace query key độc lập** (`profiles` số nhiều vs `profile` số ít) — rủi ro lớn nhất là lập trình viên "tiện tay" gộp thành 1 lệnh invalidate với hy vọng prefix chung hoạt động — sẽ không hoạt động, phải test tường minh 2 lệnh riêng (mục 7).
- **`retry: false` toàn cục áp lên cả `useQuery`** — nếu không biết trước, dễ hiểu nhầm là bug khi thấy list không tự retry lúc lỗi mạng thoáng qua — đã ghi chú rõ đây là default có chủ đích kế thừa, không phải lỗi M2.
- **Debounce test dùng fake timer** — nếu quên `vi.runOnlyPendingTimers()` trước `vi.useRealTimers()` ở `afterEach` (đúng pattern đã có), timer treo có thể làm rò rỉ sang test khác — copy chính xác pattern đã dùng ở `register/page.test.tsx`.
- **`useDebounce` đặt sai chỗ** — rủi ro đặt nhầm vào `features/birth-profile/hooks/` cho tiện — vi phạm trực tiếp Architecture Spec dòng 183/223 (đã dẫn chứng ở mục 2.6), phải đặt ở `shared/hooks/`.
- **`enabled: Boolean(id)` với `id` kiểu `string | undefined`** — TypeScript sẽ phàn nàn nếu `queryFn` gọi `getBirthProfile(id)` trực tiếp khi `id` có thể `undefined` — cần `id as string` bên trong `queryFn` (an toàn thật sự vì `enabled` đảm bảo `queryFn` chỉ chạy khi `id` tồn tại) kèm comment giải thích, không dùng `!` non-null assertion trần trụi không giải thích (đúng tinh thần "không cast không an toàn mà không tài liệu hóa" của M1 prompt, áp dụng tương tự cho M2).

## 12. Open Questions

Không có Open Question nào chặn M2. OQ-F3-2 (location search/debounce) đã RESOLVED trước đó và được áp dụng đầy đủ ở mục 6.6. Phần mục 12 của prompt gốc bị cắt cụt (xem ghi chú đầu tài liệu) — nếu nội dung đó chứa yêu cầu bổ sung ngoài những gì đã phân tích ở đây, cần Phuc Hoang cung cấp lại để rà soát.

```text
No implementation-blocking Open Questions remain, ngoại trừ việc xác nhận phần mục 12 bị thiếu của prompt gốc không chứa yêu cầu mâu thuẫn với plan này.
```
