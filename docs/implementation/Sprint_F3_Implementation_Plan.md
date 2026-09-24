# Sprint F3 Implementation Plan — Birth Profile Module (Frontend)

**Ngày lập:** 2026-09-22
**Phạm vi:** Frontend CRUD cho Birth Profile (`/app/profiles`), tích hợp Location Search
**Baseline giả định:** Sprint F1 + F2 đã CLOSED, cộng với patch "pre-F3 fixes" (G-05/G-06/npm audit, commit `233c521`) đã được apply vào `dev`
**Ranh giới cứng:** KHÔNG động vào Backend, KHÔNG thiết kế Chart Generation/Astrology Domain (Phase 3), KHÔNG sửa hạ tầng Auth (F2) trừ khi bổ sung thuần túy (ví dụ thêm mã lỗi vào dictionary có sẵn)

---

## 1. Executive Summary

Sprint F3 xây dựng module quản lý Hồ sơ sinh (Birth Profile) — CRUD hoàn chỉnh tại route `/app/profiles`, dùng lại 100% hạ tầng đã CLOSED ở F1 (Design System, routing, testing) và F2 (API client, error dictionary, form hook, auth). Đây KHÔNG phải tính năng tạo biểu đồ (Chart) — Birth Profile là dữ liệu **mutable** người dùng lưu để tái sử dụng khi tạo Chart sau này (Chart thuộc Phase 3, ngoài phạm vi Sprint này).

Điểm khác biệt lớn nhất so với F2 (Auth): F2 chỉ có 4 action đơn giản (register/login/refresh/logout), không có danh sách, không có form phức tạp, không có tra cứu bên thứ 3. F3 có: danh sách có phân trang, form 2 bước (bao gồm tra cứu địa điểm qua API riêng), 1 bất biến domain nghiêm ngặt (`isBirthTimeKnown ⟺ birthTime`), và một endpoint public không cần auth (`/locations/search`) — mỗi điểm này đều có rủi ro triển khai sai nếu không bám sát đúng contract thật đã audit.

## 2. Audit Evidence — Nguồn sự thật đã xác minh (không suy diễn)

Toàn bộ mục dưới đây được xác minh trực tiếp bằng cách đọc source code thật của backend/frontend trong repo, và chạy `npm run generate:openapi` thành công (không cần Prisma, không bị chặn bởi giới hạn sandbox) để lấy `openapi.json` làm bằng chứng đối chiếu — không dựa vào tài liệu cũ có thể lệch pha.

### 2.1 Backend endpoints (xác nhận khớp 100% giữa source code và OpenAPI sinh ra)

| Method | Path | Auth | Status thành công | Body |
|---|---|---|---|---|
| POST | `/api/v1/birth-profiles` | Bearer | 201 | flat `BirthProfileResponse` |
| GET | `/api/v1/birth-profiles` | Bearer | 200 | `{items, total, page, pageSize}` |
| GET | `/api/v1/birth-profiles/{id}` | Bearer | 200 | flat `BirthProfileResponse` |
| PATCH | `/api/v1/birth-profiles/{id}` | Bearer | 200 | flat `BirthProfileResponse` |
| DELETE | `/api/v1/birth-profiles/{id}` | Bearer | 204 | (rỗng) |
| GET | `/api/v1/locations/search` | **Không cần auth** (xác nhận cả ở route code lẫn OpenAPI `security` field vắng mặt) | 200 | `LocationSuggestionResponse[]` (mảng phẳng, không có wrapper phân trang) |

### 2.2 Bất đối xứng Request vs Response — điểm dễ code sai nhất

**Request** (create/update) lồng địa điểm trong object `birthLocation`:
```json
{
  "fullName": "...", "birthDate": "1995-05-12", "birthTime": "14:30:00",
  "isBirthTimeKnown": true,
  "birthLocation": {
    "placeName": "Hồ Chí Minh, Việt Nam",
    "latitude": 10.7756, "longitude": 106.7019,
    "historicalTimezoneId": "Asia/Ho_Chi_Minh"
  }
}
```

**Response** (create/get/update) trả các field địa điểm **phẳng ở top-level**, không có key `birthLocation`:
```json
{
  "id": "...", "userId": "...", "fullName": "...",
  "birthDate": "1995-05-12", "birthTime": "14:30:00", "isBirthTimeKnown": true,
  "placeName": "Hồ Chí Minh, Việt Nam",
  "latitude": 10.7756, "longitude": 106.7019, "historicalTimezoneId": "Asia/Ho_Chi_Minh",
  "warnings": [], "createdAt": "...", "updatedAt": "..."
}
```

→ Type `BirthProfile` (response) và type `CreateBirthProfileInput`/`UpdateBirthProfileInput` (request) **phải là 2 type khác nhau**, không được coi là symmetric. Khi điền `defaultValues` cho form Edit từ response đã fetch, phải tự lồng lại `birthLocation: {placeName, latitude, longitude, historicalTimezoneId}` từ 4 field phẳng.

`warnings` là field có thật trong response (mảng `Warning[]`), nhưng **implementation hiện tại luôn trả `[]`** (mapper hard-code, chưa có warning nào được sinh ra thật) — component hiển thị (nếu có) chỉ nên render khi mảng khác rỗng, không giả định nó luôn có nội dung, và không cần xây dựng UI phức tạp cho field này ở F3.

### 2.3 Bất biến domain cứng: INV-BP1

Domain entity (`birth-profile.entity.ts`) enforce nghiêm ngặt:

> `isBirthTimeKnown === false` **khi và chỉ khi** `birthTime === null`

Vi phạm → lỗi `INVALID_BIRTH_TIME_STATE`, HTTP 422. Quan trọng: **backend không tự động clear `birthTime` khi `isBirthTimeKnown` chuyển thành `false`** — đây là trách nhiệm của frontend.

- **Create**: nếu người dùng tick "Không rõ giờ sinh" nhưng field giờ vẫn còn giá trị cũ trong state form, phải tự set `birthTime: null` trước khi gửi request, không dựa vào backend tự xử lý.
- **Update (PATCH)**: nghiêm trọng hơn — vì PATCH là partial update, nếu chỉ gửi `{isBirthTimeKnown: false}` mà **không gửi `birthTime: null`** trong cùng request, use-case sẽ giữ nguyên `birthTime` cũ từ DB (do spread `{...oldProps, ...changes}`, field không có trong `changes` thì không bị ghi đè) → vi phạm INV-BP1 ngay tại entity, trả về 422. Form Edit **bắt buộc** phải gửi cả 2 field cùng lúc mỗi khi trạng thái "biết giờ sinh" thay đổi, kể cả khi chỉ 1 trong 2 field đó thực sự đổi giá trị.

### 2.4 Mã lỗi mới cần thêm vào `error-messages.ts`

Dictionary hiện tại (F2) chỉ có 5 mã: `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `TOKEN_EXPIRED`, `UNAUTHORIZED`, `MALFORMED_REQUEST`. F3 cần bổ sung (cùng 1 dictionary, không tạo dictionary riêng):

| Mã lỗi | HTTP status | Ngữ cảnh |
|---|---|---|
| `RESOURCE_NOT_FOUND` | 404 | Get/Update/Delete profile không tồn tại (hoặc đã bị xóa mềm) |
| `FORBIDDEN` | 403 | Profile tồn tại nhưng thuộc user khác (ownership check tách biệt khỏi not-found, xem 2.5) |
| `VALIDATION_ERROR` | 422 | Generic domain validation |
| `INVALID_BIRTH_DATE` | 422 | Ngày sinh ngoài phạm vi ephemeris hỗ trợ |
| `INVALID_BIRTH_TIME_STATE` | 422 | Vi phạm INV-BP1 (mục 2.3) |
| `INVALID_LATITUDE_RANGE` / `INVALID_LONGITUDE_RANGE` | 422 | Tọa độ ngoài [-90,90]/[-180,180] |
| `INVALID_TIMEZONE` | 422 | `historicalTimezoneId` không phải IANA identifier hợp lệ |
| `INVALID_BIRTH_LOCATION` | 422 | Lỗi tổng hợp địa điểm |

### 2.5 Ownership: 403, không phải 404 ẩn danh

`get-birth-profile.usecase.ts` xác nhận thứ tự: (1) `findById` — nếu không tồn tại → 404 `RESOURCE_NOT_FOUND`; (2) nếu tồn tại nhưng `profile.userId !== currentUserId` → 403 `FORBIDDEN` (không che giấu bằng 404). Frontend không cần tự làm thêm gì đặc biệt cho case này (không phải lỗ hổng bảo mật phía client vì backend là nguồn thẩm quyền duy nhất — đúng comment sẵn có trong `ProtectedRoute.tsx`), chỉ cần đảm bảo cả 2 mã lỗi đều có message tiếng Việt hợp lý trong dictionary (không hiển thị message kỹ thuật thô).

### 2.6 Xóa là soft-delete (backend), nhưng UI vẫn phải coi là vĩnh viễn

DB có cột `deletedAt`, repository dùng `softDelete()`. Không có endpoint restore nào được expose. → Modal xác nhận xóa phải dùng ngôn ngữ "Xóa vĩnh viễn" / cảnh báo không thể hoàn tác — hành vi soft-delete ở DB là chi tiết triển khai backend, không phải điều người dùng có thể trông cậy vào để "undo".

### 2.7 Location Search — endpoint có sẵn, không cần tự xây

`GET /api/v1/locations/search?q=<tên>&date=<YYYY-MM-DD>` (backend đã có `geonames-location-search.adapter.ts` + `geo-tz-timezone.adapter.ts`, resolve cả tên địa điểm lẫn `historicalTimezoneId` chính xác theo ngày cụ thể — vì quy tắc timezone thay đổi theo lịch sử). Tham số `date` **bắt buộc** (không optional) — nghĩa là component tìm kiếm địa điểm phải biết `birthDate` đã nhập trước đó trong form để truyền vào query, không gọi search độc lập trước khi có ngày sinh.

`historicalTimezoneId` trả về từ endpoint này **phải** là IANA identifier hợp lệ (value object `Timezone.vo.ts` validate bằng `Intl.DateTimeFormat` thử-parse) — không phải fixed offset — nên frontend không cần và không nên tự resolve timezone, chỉ cần forward nguyên giá trị nhận được từ search vào field `historicalTimezoneId` khi submit.

Endpoint này **không yêu cầu auth**, được xác nhận nhất quán ở cả route middleware lẫn OpenAPI `security` field — không phải lỗi thiếu sót, là quyết định có chủ đích (có thể do chi phí gọi third-party geocoding không nên gate theo auth cho retry logic). Không cần frontend tự thêm access token cho call này.

### 2.8 Lệch giữa Spec và Implementation thật (F1/F2) — phải theo tiền lệ thật

`Frontend_Architecture_Specification.md` §8.1/8.2 mô tả pipeline generate type tự động từ OpenAPI vào `shared/types/` (qua `openapi-typescript`). **Thực tế F1/F2 chưa bao giờ triển khai việc này**: không có `openapi-typescript` trong `devDependencies`, không có thư mục `shared/types/`, toàn bộ type của `features/auth` viết tay trực tiếp trong `features/auth/api/types.ts`. Đây là gap thật giữa tài liệu và code, không phải điều F3 cần/nên tự ý sửa (dựng pipeline generate giữa chừng 1 module là tạo thêm 1 pattern lạc loài, không nhất quán với F2). **F3 theo đúng tiền lệ đã CLOSED: viết type tay trong `features/birth-profile/api/types.ts`.** Gap về pipeline generate được ghi nhận là technical debt kế thừa, không thuộc phạm vi đóng của F3.

## 3. Nguồn sự thật cho UI/Routing (Frontend UI Specification, đã đối chiếu với router.tsx thật)

`Frontend_UI_Specification.md` §13/§14 (bảng Page Specification + cây route) là **frozen spec**, khớp với route hiện có trong `router.tsx`:

```
/app                        AppLayout (route cha, bọc ProtectedRoute — ĐÃ CÓ ở F1/F2)
├── /app  (index)            AppPage (hiện là placeholder "Sprint F2/F3", TODO dashboard thật — KHÔNG thuộc F3, xem 5.3)
├── /app/profiles            BirthProfilesPage      ← F3 thêm mới
│   ├── /app/profiles/new    BirthProfileCreatePage  ← F3 thêm mới
│   └── /app/profiles/:id/edit  BirthProfileEditPage ← F3 thêm mới
└── /app/settings            (Phase khác, không thuộc F3)
```

Route đúng là **`/app/profiles`** — không phải `/app/birth-profiles`. Query key convention cũng đã được spec chốt sẵn ở §15.2: `['profiles']` (list), `['profile', profileId]` (detail, số ít) — không phải `['birth-profiles']`. `staleTime` cho profiles dùng mặc định TanStack Query (0, không phải `Infinity` như Chart, vì Chart immutable còn Profile mutable).

`AppLayout` hiện có sidebar nhưng cả 2 mục ("Bảng điều khiển", "Cài đặt") đang là `<a href="/">` placeholder (không phải `<Link>` của React Router, chưa trỏ đúng route). F3 cần thêm 1 mục điều hướng mới "Hồ sơ sinh" trỏ `/app/profiles`, dùng `<Link>` thật (không copy pattern `<a href="/">` cũ) — việc sửa 2 mục cũ là kỹ thuật nợ có sẵn từ trước, ngoài phạm vi F3, chỉ mục mới do F3 thêm phải làm đúng.

## 4. Ranh giới phạm vi (Scope Boundaries)

### Trong phạm vi F3
- CRUD Birth Profile hoàn chỉnh: danh sách (phân trang), tạo, xem/sửa, xóa (với modal xác nhận)
- Tích hợp Location Search (autocomplete địa điểm sinh)
- Route `/app/profiles`, `/app/profiles/new`, `/app/profiles/:id/edit`
- Bổ sung mã lỗi mới vào `error-messages.ts` (không tạo dictionary riêng)
- Thêm 1 mục điều hướng "Hồ sơ sinh" vào sidebar `AppLayout` hiện có
- Test: unit (API layer, hooks), component (form, list, modal), tối thiểu 1 E2E happy-path (tạo → xem trong danh sách → sửa → xóa)

### Ngoài phạm vi F3 (không được động vào)
- Bất kỳ phần nào của Chart Generation/Astrology Domain (Swiss Ephemeris, Planet/House/Aspect, Chart Wheel...) — kể cả route `/chart/new` dùng chung component `Birth Form` (§12.1 UI Spec) cũng không triển khai ở F3 (xem Open Question OQ-F3-1)
- Sửa Backend dưới bất kỳ hình thức nào
- Sửa lại hạ tầng Auth F2 (chỉ được bổ sung thuần túy vào `error-messages.ts`, không sửa cấu trúc `apiClient`/`authStore`)
- Dashboard thật cho `/app` (index) — vẫn giữ placeholder hiện tại, không thuộc scope Birth Profile
- CI cho Birth Profile E2E — tái sử dụng workflow `frontend-ci.yml` đã có Postgres/backend service (G-05, patch pre-F3), không cần sửa CI thêm

## 5. Resolved Decisions (formerly Open Questions)

### OQ-F3-1: Quan hệ giữa CRUD Form (F3) và "Birth Form" 2 bước (UI Spec §12.1)

**Quyết định:** F3 sử dụng Birth Form 2 bước theo đúng thiết kế §12.1 cho luồng Birth Profile CRUD. Form này chỉ làm nhiệm vụ nhập liệu cơ bản (Thông tin cá nhân → Nơi sinh), không chứa Chart-specific business logic hoặc Ascendant/House warning. Khi Phase 3 làm chức năng tạo Chart (`/chart/new`), context của Chart sẽ tự cung cấp các warning/alert liên quan đến Astrological data tách biệt với form CRUD.

### OQ-F3-2: Location Search — debounce, số kết quả, và UX khi date trống

**Quyết định:** Chức năng Location Search bị disabled hoàn toàn cho tới khi trường `birthDate` hợp lệ được điền. Không sử dụng ngày hiện tại làm fallback để gọi API. Nếu người dùng thay đổi `birthDate` sau khi location đã được chọn, location/timezone hiện tại phải được coi là stale (mất hiệu lực) và form bắt buộc người dùng chọn lại địa điểm ứng với ngày sinh mới.

### OQ-F3-3: Pagination UI cho danh sách Hồ sơ

**Quyết định:** Frontend sử dụng `page-number` state (thay vì cursor pagination) để tương thích chính xác với Backend schema (`page`/`pageSize`). Tuy nhiên, ở phiên bản MVP, UI chỉ hiển thị nút Prev/Next và thông báo trang hiện tại (current page indicator), không cần render numbered pagination hay selector chọn số lượng hiển thị (page-size selector).

## 6. Milestone Breakdown

Theo đúng pattern đã CLOSED ở F2 (M1–M9), F3 chia thành milestone tuần tự, mỗi milestone có Definition of Done riêng, verify bằng lệnh thật trước khi coi là xong (không tự nhận, không dùng GUID/bằng chứng giả — bài học từ audit M10 Backend Sprint 3).

### M1 — API Layer & Types (`features/birth-profile/api/`)
- `types.ts`: `BirthProfile` (response, flat), `CreateBirthProfileInput`/`UpdateBirthProfileInput` (request, nested `birthLocation`), `LocationSuggestion`, `ListBirthProfilesParams`/`ListBirthProfilesResponse`
- `createBirthProfile.ts`, `getBirthProfile.ts`, `listBirthProfiles.ts`, `updateBirthProfile.ts`, `deleteBirthProfile.ts`, `searchLocations.ts` — mỗi hàm gọi `apiClient` (F2, không sửa), theo đúng pattern `login.ts`/`register.ts` đã có
- `mocks/handlers.ts` riêng cho feature này (theo đúng Coding Standards §13.3 và tiền lệ G-06 vừa fix ở F2) — không tái dùng file `handlers.ts` của `features/auth`
- **DoD**: unit test cho từng hàm API (success + lỗi 404/403/422 theo đúng mã ở mục 2.4), `npm run typecheck` sạch

### M2 — Query Keys & Hooks (`features/birth-profile/hooks/`)
- `query-keys.ts`: factory theo đúng convention UI Spec §15.2 (`['profiles', params]`, `['profile', id]`)
- `useBirthProfilesQuery`, `useBirthProfileQuery`, `useCreateBirthProfileMutation`, `useUpdateBirthProfileMutation`, `useDeleteBirthProfileMutation`, `useLocationSearchQuery` (debounced, `enabled` gate theo OQ-F3-2)
- Mutation success → `invalidateQueries` đúng key liên quan (create/delete invalidate `['profiles']`, update invalidate cả `['profiles']` và `['profile', id]`)
- **DoD**: hook test bằng `renderHook` + MSW, verify đúng invalidation, đúng error mapping qua `ApiError`

### M3 — Form Component & Validation (`features/birth-profile/ui/BirthProfileForm/`)
- Zod schema riêng cho form (client-side), đồng bộ ràng buộc với backend (bao gồm business rule INV-BP1 — validate ở client TRƯỚC khi submit để tránh round-trip 422 không cần thiết, dùng `.superRefine` cho ràng buộc chéo field)
- Dùng `useZodForm` (F1, không sửa) + `formFields.ts` helpers (`getInputFieldProps`, `getCheckboxFieldProps` cho "Không rõ giờ sinh")
- Logic bắt buộc: khi checkbox "Không rõ giờ sinh" đổi trạng thái, tự set `birthTime` về `null`/giá trị hợp lệ tương ứng (mục 2.3) — cả ở Create lẫn Edit
- Location search field: input với debounce (gợi ý 300ms), disable cho tới khi có `birthDate` hợp lệ (OQ-F3-2), chọn 1 suggestion → điền `placeName`/`latitude`/`longitude`/`historicalTimezoneId` vào form state
- `mode: "create" | "edit"`, `defaultValues` khi edit phải tự lồng lại `birthLocation` từ response phẳng (mục 2.2)
- **DoD**: component test bao phủ: submit hợp lệ, lỗi field-level hiển thị đúng (`Input errorText`), toggle checkbox tự clear/không clear đúng theo case, chọn location suggestion điền đúng field ẩn

### M4 — List Page & Pagination (`pages/app/profiles/page.tsx`)
- `BirthProfilesPage`: gọi `useBirthProfilesQuery`, hiển thị danh sách dạng Card/Table (theo Design System hiện có), `EmptyState` khi chưa có hồ sơ nào, `Skeleton` khi loading
- Phân trang theo quyết định ở OQ-F3-3
- Nút "Tạo hồ sơ mới" → điều hướng `/app/profiles/new`
- Mỗi item có action Sửa (`/app/profiles/:id/edit`) và Xóa (mở `Modal variant="danger"` xác nhận, ngôn ngữ "vĩnh viễn" theo mục 2.6)
- **DoD**: component test cho Loading/Empty/Error/Có dữ liệu, test riêng cho luồng xóa (mở modal → xác nhận → gọi mutation → invalidate → item biến mất khỏi danh sách)

### M5 — Create/Edit Pages & Routing
- `pages/app/profiles/new/page.tsx`, `pages/app/profiles/[id]/edit/page.tsx` (tên thư mục theo đúng convention `pages/auth/login`/`pages/auth/register` đã có)
- Đăng ký route vào `router.tsx` (children của route `app` đã có `ProtectedRoute`, `code splitting` bằng `React.lazy` theo đúng pattern các page khác)
- Submit thành công → Toast báo kết quả + điều hướng về `/app/profiles`
- **DoD**: E2E happy-path (tạo → thấy trong danh sách → sửa → thấy thay đổi → xóa → không còn trong danh sách), chạy được trên CI đã có backend thật (G-05)

### M6 — Navigation & Error Dictionary
- Thêm mục "Hồ sơ sinh" vào sidebar `AppLayout` (desktop + mobile drawer), dùng `<Link>` thật trỏ `/app/profiles`
- Bổ sung toàn bộ mã lỗi mục 2.4 vào `shared/lib/error-messages.ts` với message tiếng Việt phù hợp
- **DoD**: test AppLayout cập nhật xác nhận link mới tồn tại và điều hướng đúng; test error-messages cho từng mã mới

### M7 — Testing Consolidation & Coverage
- Review toàn bộ test đã viết ở M1–M6, đảm bảo dùng chung `mocks/handlers.ts` của module (không lặp lại literal endpoint URL trong từng file test — áp dụng bài học G-06 ngay từ đầu, không để nợ lại)
- Coverage tối thiểu ngang F2 (~90% statement) cho module mới
- **DoD**: `npm run test:coverage` xanh, không giảm coverage tổng

### M8 — Documentation & Sprint Closure
- Cập nhật `CHANGELOG.md` (entry mới), `README.md` (Current Scope)
- Tạo `Sprint_F3_Known_Gaps_Registry.md` + `Sprint_F3_Exit_Criteria_Evidence_Matrix.md` theo đúng format đã dùng ở F2 (đã đọc làm mẫu), liệt kê rõ 2 quyết định ở OQ-F3-1/2/3 đã chốt ra sao
- **DoD**: Phuc Hoang xác nhận trực tiếp đã chạy E2E thật pass (theo đúng kỷ luật đã áp dụng ở F2 M9 — không tự nhận thay)

## 7. Rủi ro & Lưu ý triển khai

- **INV-BP1** (mục 2.3) là rủi ro cao nhất về đúng-sai chức năng — cần test riêng, rõ ràng cho cả 4 tổ hợp: (biết giờ→biết giờ, biết giờ→không biết, không biết→biết, không biết→không biết) ở cả Create và Edit.
- Location search có dependency vào `birthDate` (OQ-F3-2) — nếu không xử lý đúng, dễ tạo ra state form không nhất quán (chọn địa điểm ứng với 1 ngày, sau đó đổi ngày sinh mà không tìm lại địa điểm) — nên cân nhắc: đổi `birthDate` sau khi đã chọn địa điểm thì không tự động xóa lựa chọn địa điểm cũ (backend không validate chéo 2 field này tại DB, chỉ validate riêng lẻ từng field) — nhưng nên cảnh báo nhẹ cho người dùng nếu UX cho phép.
- `npm audit` còn 3 vulnerability frontend / 9 backend chưa xử lý (đã biết từ trước F3) — không liên quan tới code mới của F3, không phải blocker.

## 8. Định nghĩa Hoàn thành (Definition of Done — cấp Sprint)

Sprint F3 chỉ được coi là CLOSED khi, giống kỷ luật đã áp dụng ở F2:
1. Toàn bộ milestone M1–M8 có DoD riêng đã đạt, verify bằng lệnh thật (không tự nhận)
2. `npm run lint && npm run typecheck && npm run test:coverage && npm run build` xanh
3. E2E cho luồng CRUD chạy thật trên CI (không skip) — tận dụng hạ tầng Postgres/backend đã có ở G-05
4. Evidence Matrix + Known Gaps Registry được tạo và Phuc Hoang xác nhận trực tiếp đã tự chạy lại độc lập ít nhất phần E2E
5. Toàn bộ Open Question (mục 5) đã có quyết định ghi lại rõ ràng, không còn "TBD" nào ảnh hưởng tới hành vi đã code
