# Sprint F3 — M1 Implementation Plan: Birth Profile API Layer

**Lập ngày:** 2026-09-24
**Trạng thái:** Implementation Plan only — chưa viết code
**Đầu vào:** `Sprint_F3_M1_Implementation_Plan_Prompt.md` + `Sprint_F3_Implementation_Plan.md` (master plan) + F3-DEC-01/02/03 đã chốt

> **Ghi chú mở đầu về 2 phát hiện mới**: quá trình audit lại sâu hơn cho M1 (đọc trực tiếp use-case/schema, không chỉ controller) phát hiện 2 điểm mà bản Sprint F3 master plan (mục 2.3) đã nêu **chưa chính xác hoàn toàn**. Cả hai được sửa lại trong tài liệu này với evidence cụ thể (mục 3.5 và 12). Đây là "Newly discovered issue" theo đúng phân loại được yêu cầu, không phải mâu thuẫn cần hỏi lại — plan này tự sửa và ghi rõ.

---

## 1. Milestone Overview

- **Tên**: Sprint F3 — M1: Birth Profile API Layer
- **Mục tiêu**: Xây dựng tầng giao tiếp HTTP thuần túy (types + 6 hàm gọi API + MSW mock + unit test) cho Birth Profile, làm nền cho M2 (hooks/query) và các milestone UI sau. Không có business logic, không có UI.
- **Trong phạm vi**: `features/birth-profile/api/{types.ts, createBirthProfile.ts, getBirthProfile.ts, listBirthProfiles.ts, updateBirthProfile.ts, deleteBirthProfile.ts, searchLocations.ts, mocks/handlers.ts}` + file test tương ứng.
- **Ngoài phạm vi**: trang, component React, Birth Form, UI location search, Zustand store, routing, loading/error UI, pagination UI, mọi thứ thuộc Chart/Swiss Ephemeris/Interpretation, chuẩn hóa input theo bất biến domain (đó là việc của Birth Form, M3 theo master plan).
- **Phụ thuộc**: F2 đã CLOSED (`shared/api/client.ts`, `shared/api/queryClient.ts` — dùng nguyên trạng); F3-DEC-01/02/03 đã chốt, không mở lại.

## 2. Verified Existing Architecture

Tất cả các điểm dưới đây xác minh trực tiếp từ source code (`frontend/src/features/auth/`, `frontend/src/shared/`), không suy diễn từ tài liệu.

- **`apiClient`** (`shared/api/client.ts`): instance Axios `withCredentials: true`, interceptor tự retry 1 lần qua `coordinateRefresh()` khi 401 (trừ chính request `/refresh`), chuẩn hóa mọi lỗi thành `ApiError` (có `status`, `errorCode`, `detail`, `fieldErrors` lấy từ `metadata.fieldErrors` của RFC7807 response). M1 chỉ **gọi** `apiClient.get/post/patch/delete`, không sửa file này.
- **Auth API pattern** (`features/auth/api/login.ts` làm mẫu): mỗi hàm là 1 named export `async function`, nhận input đã match schema, gọi `apiClient.post<ResponseType>(url, body)`, trả `response.data`. Import `apiClient` từ `@shared/api/client`. Không try/catch thủ công trong hàm — lỗi được `apiClient`/`ApiError` xử lý ở tầng gọi (hook/component), không phải ở tầng `api/*.ts`.
- **Không có `api/index.ts` barrel** trong `features/auth/` — chỉ có `features/auth/index.ts` ở cấp feature (barrel cho hooks, không export thẳng hàm `api/*.ts`). Vì M1 chỉ làm tầng API (chưa có hook), **M1 không tạo bất kỳ file barrel nào** — khớp đúng với việc M1 không nằm trong danh sách deliverable có `index.ts`.
- **MSW architecture**: `src/test/msw-server.ts` là `setupServer()` với mảng handler rỗng (baseline global trống). `src/test/setup.ts` gọi `server.listen({onUnhandledRequest: "error"})` — **bất kỳ request nào không khớp handler đã đăng ký sẽ throw lỗi test** (không fail âm thầm), `afterEach` gọi `server.resetHandlers()`. Handler được đăng ký **runtime, per-test**, qua `server.use(...)` ngay trong từng `it()`/`beforeEach()` — không có cơ chế đăng ký tĩnh handler theo feature vào baseline toàn cục.
- **Feature-specific handlers** (`features/auth/api/mocks/handlers.ts`, đã mở rộng ở fix G-06 trước F3): export các factory nhỏ (`mockLogin`, `loginSuccess`, `loginInvalidCredentials`, `problemDetails`, ...) mà từng test file import và gọi trong `server.use(...)`. **Không có global registration nào khác** — mỗi feature tự viết file `mocks/handlers.ts` riêng, tự dùng trong test riêng của feature đó.
- **Error handling / RFC7807 fixture**: `problemDetails({type?, title?, status, errorCode, detail?})` (trong `features/auth/api/mocks/handlers.ts`) trả `HttpResponse.json({type, title, status, errorCode, detail?}, {status, headers: {"Content-Type": "application/problem+json"}})`. Đây khớp chính xác với format RFC7807 thật mà backend trả (đã xác nhận qua `problem-details.ts` phía backend). Hàm này **nằm trong file của `features/auth`**, không nằm ở `shared/` hay nơi dùng chung — Birth Profile **không được import** hàm này từ `features/auth` (vi phạm ranh giới feature). M1 cần viết 1 bản `problemDetails` cục bộ tương đương (~15 dòng, trùng lặp có chủ đích, xem mục 4).
- **Test conventions**: file test co-located (`tên-hàm.test.ts` cạnh `tên-hàm.ts`), dùng Vitest (`describe`/`it`/`expect`), `server.use(...)` để mock riêng từng test case. **Phát hiện lệch giữa Coding Standards §13.4 và thực tế F2**: §13.4 quy định `it()` nên viết dạng "should [kết quả] when [điều kiện]", nhưng toàn bộ 4 file test API layer thật của F2 (`login.test.ts`, `register.test.ts`, `logout.test.ts`, `refresh.test.ts`) đều dùng văn phong khác nhất quán ("sends correct request and returns X on success", "rejects with ApiError on <code>") — không file nào theo "should...when". Đây là **Newly discovered issue**, không phải điều cần hỏi lại: theo đúng tinh thần "Follow Existing Auth API Pattern" (mục 10 của prompt) và để tránh 1 module có văn phong test khác biệt giữa 1 codebase nhỏ do 1 người duy nhất maintain, **M1 theo văn phong thật của F2** (không theo "should...when" của Coding Standards), ghi nhận gap này như nợ kỹ thuật kế thừa chứ không tự sửa lại toàn bộ F2 giữa chừng.

## 3. Backend Contract Summary

Toàn bộ xác nhận bằng cách đọc trực tiếp source code backend (`backend/src/modules/birth-profile/`) **và** chạy thật `npm run generate:openapi` để lấy `openapi.json` làm bằng chứng đối chiếu (script này chạy được, không cần Prisma, không bị chặn trong sandbox).

### 3.1 `POST /api/v1/birth-profiles` — Create
- **Auth**: Bearer bắt buộc
- **Request body** (`create-birth-profile.schema.ts`): `label` (string, min 1 — **bắt buộc**), `fullName` (string, nullable, optional), `birthDate` (string, regex `YYYY-MM-DD`, bắt buộc), `birthTime` (string, regex `HH:mm:ss`, nullable, optional), `isBirthTimeKnown` (boolean, bắt buộc), `birthLocation` (object bắt buộc, toàn bộ 4 field con đều bắt buộc: `placeName` string, `latitude`/`longitude` number, `historicalTimezoneId` string)
- **Response 201**: flat `BirthProfileResponse` (xem 3.6)
- **Lỗi**: `400` (`MALFORMED_REQUEST` — body không khớp Zod schema), `401` (auth middleware, không thuộc scope test của M1), `422` (domain: `INVALID_BIRTH_DATE`/`INVALID_BIRTH_TIME_STATE`/`INVALID_LATITUDE_RANGE`/`INVALID_LONGITUDE_RANGE`/`INVALID_TIMEZONE`/`INVALID_BIRTH_LOCATION`, tùy value object nào throw trước)
- **Bất biến quan trọng**: `create-birth-profile.usecase.ts` **không** tự sửa `birthTime`/`isBirthTimeKnown` — cả 2 field được truyền y nguyên vào `BirthProfile.create()`, entity tự kiểm tra INV-BP1 và throw `InvalidBirthTimeStateError` nếu vi phạm. Request gửi lên phải tự nhất quán.

### 3.2 `GET /api/v1/birth-profiles` — List
- **Auth**: Bearer bắt buộc
- **Query** (`list-birth-profiles-query.schema.ts`): `page` (number, optional, mặc định 1), `pageSize` (number, optional, mặc định 20, tối đa 100 — vượt quá bị clamp về 100 chứ không lỗi), `sortBy` (enum `"createdAt" | "fullName"`, optional, mặc định `createdAt`), `order` (enum `"asc" | "desc"`, optional, mặc định `desc`)
- **Response 200**: `{items: BirthProfileResponse[], total: number, page: number, pageSize: number}` — **không có `totalPages`**
- **Lỗi**: `400` (query không hợp lệ — ví dụ `sortBy` sai enum), `401`
- **Phát hiện quan trọng — sửa lại so với master plan/prompt gợi ý**: `list-birth-profiles.usecase.ts` gọi thẳng `repository.listByUserId(command.userId, ...)` — **truy vấn được scope theo `userId` hiện tại ngay từ đầu, không có khái niệm "list của user khác" để mà bị 403**. Bằng chứng: `openapi.json` xác nhận `GET /api/v1/birth-profiles` chỉ khai báo response `['200', '400', '401']` — **không có `403`**. Prompt gợi ý test matrix có "list: success + 403" — **không khớp thực tế, sẽ không đưa vào M1** (lý do nêu ở mục 8).

### 3.3 `GET /api/v1/birth-profiles/{id}` — Get one
- **Auth**: Bearer bắt buộc
- **Path param**: `id` (UUID, validate qua `birthProfileIdSchema`)
- **Response 200**: flat `BirthProfileResponse`
- **Lỗi**: `401`, `403` (`FORBIDDEN` — profile tồn tại nhưng `userId` khác), `404` (`RESOURCE_NOT_FOUND` — không tồn tại/đã xóa mềm)
- **Thứ tự kiểm tra xác nhận từ code** (`get-birth-profile.usecase.ts`): `findById` trước (404 nếu null) → `assertOwnership` sau (403 nếu có nhưng không phải chủ sở hữu). Không có "404 giả trang" để che giấu — 403 là 403 thật.

### 3.4 `PATCH /api/v1/birth-profiles/{id}` — Update
- **Auth**: Bearer bắt buộc
- **Path param**: `id` (UUID)
- **Request body** (`update-birth-profile.schema.ts`): tất cả field đều **optional** (partial update) — `label` (string min 1, optional), `fullName` (nullable, optional), `birthDate` (optional), `birthTime` (nullable, optional), `isBirthTimeKnown` (optional), `birthLocation` (object optional, nhưng nếu có thì **toàn bộ 4 field con bên trong đều bắt buộc** — không partial-update được từng field con của `birthLocation`)
- **Response 200**: flat `BirthProfileResponse`
- **Lỗi**: `400`, `401`, `403`, `404` (cùng logic thứ tự như Get — xác nhận ở `update-birth-profile.usecase.ts`: `findById` → `assertOwnership` → mới áp dụng thay đổi), `422` (domain)

### 3.5 Correction quan trọng cho master plan §2.3 — hành vi thật của PATCH với `isBirthTimeKnown`

Master plan (`Sprint_F3_Implementation_Plan.md` §2.3) viết: *"backend không tự động clear birthTime khi isBirthTimeKnown chuyển thành false... Form Edit bắt buộc phải gửi cả 2 field cùng lúc"*. Đọc lại trực tiếp `update-birth-profile.usecase.ts` (dòng xử lý `changes.birthTime`) cho thấy **điều này chỉ đúng một phần**:

```ts
if (command.birthTime !== undefined) {
  changes.birthTime = command.birthTime ? BirthTime.create(command.birthTime) : null;
} else if (command.isBirthTimeKnown === false) {
  // Edge case: isBirthTimeKnown changed to false, but birthTime not provided.
  // We must explicitly set birthTime to null, otherwise Entity will use the old non-null birthTime
  // and throw InvalidBirthTimeStateError.
  changes.birthTime = null;
}
```

**Sự thật chính xác**: nếu PATCH gửi `{isBirthTimeKnown: false}` mà **không kèm `birthTime`**, use-case tự động set `birthTime = null` trước khi áp dụng — **không throw 422**. Chỉ khi PATCH gửi `{isBirthTimeKnown: false, birthTime: "14:30:00"}` (cả 2 cùng lúc, mâu thuẫn nhau) thì mới rơi vào nhánh `command.birthTime !== undefined` → giữ nguyên giá trị non-null → entity throw 422.

**Impact**: type `UpdateBirthProfileInput.birthTime` phải là `string | null` **và optional** (`birthTime?: string | null`) để phản ánh đúng 3 trạng thái có thể gửi: (1) không gửi field này (giữ nguyên/backend tự xử lý theo `isBirthTimeKnown`), (2) gửi `null` (xóa tường minh), (3) gửi 1 chuỗi giờ hợp lệ. M1 chỉ cần type đúng 3 trạng thái này — **không viết logic tự động nào trong `updateBirthProfile.ts`** (đúng nguyên tắc mục 12 của prompt: "M1 không đặt logic chuẩn hóa vào hàm API chung"). Milestone Birth Form (M3, tương lai) cần biết sự thật này để KHÔNG tự ý luôn gửi `birthTime: null` một cách máy móc — có thể chỉ gửi `isBirthTimeKnown: false` mà không kèm `birthTime` vẫn hợp lệ, nhưng gửi kèm `birthTime` cũ (non-null) cùng lúc thì sẽ lỗi. Đây là ghi chú cảnh báo cho M3, không phải việc M1 phải code.

Lưu ý: hành vi tương tự **không tồn tại** ở `create-birth-profile.usecase.ts` — Create không có nhánh "tự sửa" nào, `birthTime`/`isBirthTimeKnown` được truyền thẳng, phải tự nhất quán khi gửi (mục 3.1).

### 3.6 `DELETE /api/v1/birth-profiles/{id}` — Delete
- **Auth**: Bearer bắt buộc
- **Response 204**: không có body (soft-delete ở DB qua cột `deletedAt`, không có endpoint restore — UI tầng trên phải coi là vĩnh viễn, nhưng đây không phải việc của M1)
- **Lỗi**: `401`, `403`, `404` (cùng thứ tự `findById` → ownership như Get/Update; xác nhận thêm: nếu `softDelete()` trả `false` do race condition, use-case cũng throw 404 để giữ idempotent — không ảnh hưởng tới thiết kế API function của M1)
- **Return type khuyến nghị**: `Promise<void>` — khớp đúng tiền lệ `logout()` của F2 (204 → `Promise<void>`, xem `features/auth/api/logout.ts`)

### 3.7 `GET /api/v1/locations/search` — Location Search
- **Auth**: **Không yêu cầu** — xác nhận cả ở `location.routes.ts` (không có `authMiddleware`) lẫn `openapi.json` (`security` field vắng mặt hoàn toàn ở path này, trong khi 5 endpoint birth-profiles đều có `security: [{bearerAuth: []}]`)
- **Query** (`location-search.schema.ts`): `q` (string, min 2 ký tự, **bắt buộc**), `date` (string, regex `YYYY-MM-DD`, **bắt buộc** — không có default)
- **Response 200**: `LocationSuggestionResponse[]` — mảng phẳng, **không có wrapper phân trang, không có field `id`**. Từng phần tử: `{placeName: string, latitude: number, longitude: number, historicalTimezoneId: string}`
- **Lỗi**: `400` (`MALFORMED_REQUEST` — thiếu/sai `q` hoặc `date`; **đã có sẵn message trong dictionary F2, không cần thêm mới**), `500` (lỗi service geocoding bên thứ 3 — mô tả trong `openapi.json` là "External geocoding service error", không có `errorCode` riêng, xử lý qua fallback lỗi chung của `apiClient`, không cần test riêng ở M1)
- **Không có 422 cho endpoint này** — xác nhận qua `openapi.json`: `responses = ['200', '400', '500']`. Prompt gợi ý "search: success + 422" — **sửa lại thành success + 400** (xem mục 8).
- **Nhận xét cấu trúc**: shape của `LocationSuggestionResponse` **giống hệt** shape của `birthLocation` trong request body (4 field: `placeName`/`latitude`/`longitude`/`historicalTimezoneId`) — hợp lý vì chọn 1 suggestion chính là điền `birthLocation`. Xem khuyến nghị đặt tên type ở mục 4.

### 3.8 Response phẳng `BirthProfileResponse` (đầy đủ, xác nhận qua `birth-profile-response.mapper.ts`)

```ts
{
  id: string;              // uuid
  userId: string;          // uuid
  label: string;           // KHÔNG có trong bản draft ban đầu của prompt — field bắt buộc, 1-100 ký tự (INV-BP2), là "nhãn" người dùng đặt cho hồ sơ (khác fullName)
  fullName: string | null;
  birthDate: string;       // YYYY-MM-DD
  birthTime: string | null;// HH:mm:ss
  isBirthTimeKnown: boolean;
  placeName: string;
  latitude: number;
  longitude: number;
  historicalTimezoneId: string;
  warnings: Warning[];     // luôn [] ở implementation hiện tại — không giả định có nội dung
  createdAt: string;       // ISO datetime
  updatedAt: string;       // ISO datetime
}
```

**`label` vs `fullName`**: đây là 2 field khác nhau, cả hai đều thật, xác nhận ở cả schema/entity/mapper. `label` bắt buộc (nhãn hồ sơ, ví dụ "Bản thân", "Con tôi"), `fullName` optional/nullable (tên đầy đủ thật, có thể không nhập). Bản mô tả `BirthProfile` ở mục 5 của prompt **thiếu field `label`** — đây là **Newly discovered issue**, đã sửa trong type ở mục 4, không phải điều cần hỏi lại vì bằng chứng dứt khoát từ 3 nguồn độc lập (schema, entity, mapper) đều khớp nhau.

## 4. File Changes

### Files to create
```
frontend/src/features/birth-profile/api/types.ts
frontend/src/features/birth-profile/api/createBirthProfile.ts
frontend/src/features/birth-profile/api/getBirthProfile.ts
frontend/src/features/birth-profile/api/listBirthProfiles.ts
frontend/src/features/birth-profile/api/updateBirthProfile.ts
frontend/src/features/birth-profile/api/deleteBirthProfile.ts
frontend/src/features/birth-profile/api/searchLocations.ts
frontend/src/features/birth-profile/api/mocks/handlers.ts
frontend/src/features/birth-profile/api/createBirthProfile.test.ts
frontend/src/features/birth-profile/api/getBirthProfile.test.ts
frontend/src/features/birth-profile/api/listBirthProfiles.test.ts
frontend/src/features/birth-profile/api/updateBirthProfile.test.ts
frontend/src/features/birth-profile/api/deleteBirthProfile.test.ts
frontend/src/features/birth-profile/api/searchLocations.test.ts
```
Không tạo `features/birth-profile/index.ts` hay `api/index.ts` — không có tiền lệ này ở F2 tại giai đoạn tương đương (chỉ-API, chưa có hook), xem mục 2.

### Files to modify
**Không có.** M1 không sửa bất kỳ file đã tồn tại nào (kể cả `error-messages.ts` — việc thêm mã lỗi mới thuộc M6 theo master plan, không phải M1, vì M1 không tự parse/hiển thị lỗi, chỉ để `ApiError` đi qua nguyên trạng).

### Files explicitly not to modify
- **`frontend/src/shared/api/client.ts`** — tuyệt đối không sửa, không thêm interceptor/logic auth/retry/HTTP abstraction mới. M1 chỉ import và gọi `apiClient` nguyên trạng.
- `frontend/src/shared/api/queryClient.ts`, `frontend/src/shared/stores/*` — không liên quan tới M1 (tầng API thuần túy, không có hook/store).
- `frontend/src/features/auth/**` — không sửa gì, kể cả `mocks/handlers.ts` của auth (ranh giới feature, đã nêu ở mục 2).

## 5. Type Definitions (`features/birth-profile/api/types.ts`)

```ts
// ---- Request-side location shape (dùng chung cho birthLocation lẫn LocationSuggestion) ----
export interface LocationSuggestion {
  placeName: string;
  latitude: number;
  longitude: number;
  historicalTimezoneId: string;
}
// Ghi chú: BirthLocation trong request body có shape giống hệt LocationSuggestion
// (xác nhận ở mục 3.7) — dùng lại type này làm birthLocation thay vì định nghĩa
// trùng lặp. Đây không phải premature abstraction: là 1 alias phản ánh đúng sự
// trùng khớp thật của backend contract, không phải abstraction tự nghĩ ra.
export type BirthLocationInput = LocationSuggestion;

// ---- Response model (FLAT — mục 3.8) ----
export interface Warning {
  code: string;
  message: string;
  severity: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface BirthProfile {
  id: string;
  userId: string;
  label: string;
  fullName: string | null;
  birthDate: string;
  birthTime: string | null;
  isBirthTimeKnown: boolean;
  placeName: string;
  latitude: number;
  longitude: number;
  historicalTimezoneId: string;
  warnings: Warning[];
  createdAt: string;
  updatedAt: string;
}

// ---- Create request (NESTED birthLocation — mục 3.1) ----
export interface CreateBirthProfileInput {
  label: string;
  fullName?: string | null;
  birthDate: string;
  birthTime?: string | null;
  isBirthTimeKnown: boolean;
  birthLocation: BirthLocationInput;
}

// ---- Update request (mọi field optional, birthLocation all-or-nothing — mục 3.4/3.5) ----
export interface UpdateBirthProfileInput {
  label?: string;
  fullName?: string | null;
  birthDate?: string;
  birthTime?: string | null;
  isBirthTimeKnown?: boolean;
  birthLocation?: BirthLocationInput;
}

// ---- List (mục 3.2) ----
export interface ListBirthProfilesParams {
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "fullName";
  order?: "asc" | "desc";
}

export interface ListBirthProfilesResponse {
  items: BirthProfile[];
  total: number;
  page: number;
  pageSize: number;
}

// ---- Location search (mục 3.7) ----
export interface SearchLocationsParams {
  q: string;
  date: string; // YYYY-MM-DD — BẮT BUỘC, không optional (F3-DEC-02)
}
```

Không dùng `any`, không cast không an toàn. `Warning`/`warnings` được type đầy đủ dù hiện tại backend luôn trả `[]` — để type chính xác với contract thật (mapper backend, mục 3.8), không phải để dùng ngay.

## 6. API Function Implementation

Thứ tự dưới đây theo đúng thứ tự yêu cầu ở mục 24.6 của prompt.

### 6.1 `createBirthProfile.ts`
- **Input**: `CreateBirthProfileInput`
- **Gọi**: `apiClient.post<BirthProfile>("/api/v1/birth-profiles", input)`
- **Output**: `Promise<BirthProfile>` — trả `response.data`
- **Lỗi**: để `ApiError` throw tự nhiên từ `apiClient`, không catch
- **Edge case đáng chú ý**: caller (M3 sau này) chịu trách nhiệm đảm bảo `birthTime`/`isBirthTimeKnown` nhất quán trước khi gọi — hàm này không tự validate/normalize (mục 3.1, 3.5)

### 6.2 `getBirthProfile.ts`
- **Input**: `id: string`
- **Gọi**: `apiClient.get<BirthProfile>(\`/api/v1/birth-profiles/${id}\`)`
- **Output**: `Promise<BirthProfile>`
- **Lỗi**: 404/403 đi qua `ApiError` nguyên trạng
- **Edge case**: không validate format `id` phía client (UUID) — để backend tự trả lỗi, tránh trùng lặp validation logic không cần thiết ở M1

### 6.3 `listBirthProfiles.ts`
- **Input**: `params?: ListBirthProfilesParams` (toàn bộ optional, khớp backend có default)
- **Gọi**: `apiClient.get<ListBirthProfilesResponse>("/api/v1/birth-profiles", {params})`
- **Output**: `Promise<ListBirthProfilesResponse>`
- **Lỗi**: chỉ 400/401 có thể xảy ra thật (mục 3.2) — không có 403/404 cho hàm này
- **Edge case**: nếu `params` không truyền, Axios không gửi query string nào — backend tự áp dụng default (`page=1, pageSize=20, sortBy=createdAt, order=desc`), không cần hàm client tự điền default trùng lặp

### 6.4 `updateBirthProfile.ts`
- **Input**: `id: string`, `input: UpdateBirthProfileInput`
- **Gọi**: `apiClient.patch<BirthProfile>(\`/api/v1/birth-profiles/${id}\`, input)`
- **Output**: `Promise<BirthProfile>`
- **Lỗi**: 404/403/422/400 đi qua `ApiError` nguyên trạng
- **Edge case quan trọng nhất của M1**: hàm **gửi y nguyên** `input` đã cho — nếu caller gửi `{birthTime: null}` thì `null` phải đi tới tận request body (không bị `JSON.stringify` bỏ qua vì `undefined`, không bị Axios serialize sai). Cần test riêng xác nhận field `birthTime: null` thật sự nằm trong request body gửi đi (không phải bị lược bỏ) — đây là cách M1 "bảo vệ" đúng hành vi mô tả ở mục 3.5 mà không cần viết logic gì thêm.

### 6.5 `deleteBirthProfile.ts`
- **Input**: `id: string`
- **Gọi**: `apiClient.delete(\`/api/v1/birth-profiles/${id}\`)`
- **Output**: `Promise<void>` (204 không có body — khớp tiền lệ `logout()`)
- **Lỗi**: 404/403 đi qua `ApiError` nguyên trạng

### 6.6 `searchLocations.ts`
- **Input**: `params: SearchLocationsParams` (**bắt buộc**, không optional — F3-DEC-02, không dùng `new Date()` làm fallback)
- **Gọi**: `apiClient.get<LocationSuggestion[]>("/api/v1/locations/search", {params})`
- **Output**: `Promise<LocationSuggestion[]>`
- **Lỗi**: 400 (thiếu/sai `q`/`date`), 500 (lỗi service bên thứ 3, không cần test riêng — mục 3.7)
- **Edge case**: hàm này **không** áp dụng `withCredentials`/auth header đặc biệt gì — dùng `apiClient` y hệt các hàm khác dù endpoint không cần auth (Axios instance dùng chung, gửi cookie/header thừa không gây lỗi vì backend route này đơn giản không đọc chúng); không cần nhánh code riêng cho "endpoint public".

## 7. MSW Handler Implementation (`features/birth-profile/api/mocks/handlers.ts`)

- **Tổ chức**: theo đúng pattern G-06 đã áp dụng cho `features/auth/api/mocks/handlers.ts` — 1 file duy nhất, export các factory nhỏ, KHÔNG import gì từ `features/auth`.
- **Đăng ký vào test infra**: không cần đăng ký tĩnh nào cả — mỗi test file của `features/birth-profile/api/*.test.ts` tự `import {...} from "./mocks/handlers"` rồi gọi `server.use(...)` (từ `@test/msw-server`, dùng chung instance `server` toàn cục, nhưng handler chỉ tồn tại trong phạm vi 1 test nhờ `afterEach(() => server.resetHandlers())` đã có sẵn ở `src/test/setup.ts`). Không cần sửa `msw-server.ts`.
- **Helper cục bộ `problemDetails`**: viết lại y hệt bản của `features/auth` (~15 dòng) ngay trong file này — trùng lặp có chủ đích để giữ ranh giới feature, không refactor thành shared util ở M1 (tránh mở rộng phạm vi ngoài yêu cầu).

**Danh sách factory cần có** (đặt tên theo đúng văn phong đã dùng ở auth: `mock<Endpoint>`, `<endpoint><Scenario>`):

```ts
export const mockCreateBirthProfile = (resolver) => http.post("*/api/v1/birth-profiles", resolver);
export const mockListBirthProfiles = (resolver) => http.get("*/api/v1/birth-profiles", resolver);
export const mockGetBirthProfile = (resolver) => http.get("*/api/v1/birth-profiles/:id", resolver);
export const mockUpdateBirthProfile = (resolver) => http.patch("*/api/v1/birth-profiles/:id", resolver);
export const mockDeleteBirthProfile = (resolver) => http.delete("*/api/v1/birth-profiles/:id", resolver);
export const mockSearchLocations = (resolver) => http.get("*/api/v1/locations/search", resolver);

export const mockBirthProfile = (overrides = {}) => ({ /* đủ field theo mục 3.8, giá trị mẫu hợp lệ */ ...overrides });

// Success
export const createBirthProfileSuccess = () => mockCreateBirthProfile(() => HttpResponse.json(mockBirthProfile(), {status: 201}));
export const getBirthProfileSuccess = () => mockGetBirthProfile(() => HttpResponse.json(mockBirthProfile()));
export const listBirthProfilesSuccess = () => mockListBirthProfiles(() => HttpResponse.json({items: [mockBirthProfile()], total: 1, page: 1, pageSize: 20}));
export const updateBirthProfileSuccess = () => mockUpdateBirthProfile(() => HttpResponse.json(mockBirthProfile()));
export const deleteBirthProfileSuccess = () => mockDeleteBirthProfile(() => new HttpResponse(null, {status: 204}));
export const searchLocationsSuccess = () => mockSearchLocations(() => HttpResponse.json([{placeName: "...", latitude: 0, longitude: 0, historicalTimezoneId: "Asia/Ho_Chi_Minh"}]));

// Errors — mỗi hàm 1 mã lỗi thật theo mục 3
export const birthProfileNotFound = (endpointFactory) => endpointFactory(() => problemDetails({status: 404, errorCode: "RESOURCE_NOT_FOUND", title: "Not Found"}));
export const birthProfileForbidden = (endpointFactory) => endpointFactory(() => problemDetails({status: 403, errorCode: "FORBIDDEN", title: "Forbidden"}));
export const birthProfileValidationError = (endpointFactory, errorCode = "INVALID_BIRTH_TIME_STATE") => endpointFactory(() => problemDetails({status: 422, errorCode, title: "Unprocessable Entity"}));
export const birthProfileMalformedRequest = (endpointFactory) => endpointFactory(() => problemDetails({status: 400, errorCode: "MALFORMED_REQUEST", title: "Bad Request"}));
```

(Ký hiệu trên là minh họa cấu trúc, không phải code cuối — thứ tự tham số/kiểu chính xác quyết định lúc code thật M1, không phải lúc lập plan.)

## 8. Test Implementation — Ma trận đã hiệu chỉnh theo `openapi.json` thật

| Hàm | Success | 400 | 403 | 404 | 422 |
|---|---:|---:|---:|---:|---:|
| create | ✓ | ✓ | — | — | ✓ |
| get | ✓ | — | ✓ | ✓ | — |
| list | ✓ | ✓ | — | — | — |
| update | ✓ | ✓ | ✓ | ✓ | ✓ |
| delete | ✓ | — | ✓ | ✓ | — |
| search | ✓ | ✓ | — | — | — |

**Khác với ma trận gợi ý trong prompt gốc (mục 8 của prompt), có 2 điều chỉnh, cả hai đều có bằng chứng trực tiếp từ `openapi.json`:**
1. **List**: bỏ cột 403 (prompt gợi ý có) — `openapi.json` xác nhận `GET /api/v1/birth-profiles` chỉ có `['200', '400', '401']`, và code (`listByUserId(userId,...)`) xác nhận không có khái niệm ownership-violation cho thao tác list (mục 3.2). Thêm cột 400 (query sai enum) vì đây là case thật, đơn giản, dễ test.
2. **Search**: đổi cột 422 (prompt gợi ý) thành 400 — `openapi.json` xác nhận `['200', '400', '500']`, không có `422` cho endpoint này (mục 3.7).
3. Thêm cột 400 cho **create** và **update** (prompt gốc không liệt kê ở bảng ví dụ nhưng có nhắc ở mục 16 "tests must reflect real backend contract") — cả hai đều thật có trong `openapi.json`.

Mỗi hàm test theo đúng 7 điểm yêu cầu ở mục 17 của prompt (method, URL, query, body, dữ liệu trả về, và mã lỗi tương ứng) — riêng `updateBirthProfile.test.ts` cần thêm 1 test case đặc thù xác nhận `body.birthTime === null` được gửi đúng khi input có `birthTime: null` tường minh (mục 6.4).

## 9. Execution Order

```
1. Xác nhận lại contract bằng cách chạy `npm run generate:openapi` (backend) nếu nghi ngờ bất kỳ field nào — đã làm xong cho plan này, chỉ cần re-run nếu backend code đổi trước khi bắt tay code M1
2. Viết types.ts (mục 5)
3. Viết 6 hàm API theo thứ tự: createBirthProfile → getBirthProfile → listBirthProfiles → updateBirthProfile → deleteBirthProfile → searchLocations
4. Viết mocks/handlers.ts (mục 7)
5. Viết test cho từng hàm ngay sau khi hàm đó xong (không dồn hết cuối mới test — bài học từ fix G-06: chạy test ngay sau mỗi file để bắt lỗi sớm)
6. npm run typecheck sau mỗi 2-3 file
7. Chạy targeted test: npx vitest run src/features/birth-profile/api
8. Chạy full suite: npx vitest run --passWithNoTests (đảm bảo không phá vỡ 56 file/291 test hiện có của F2)
9. npm run lint, npm run build (đầy đủ như checklist F2 đã dùng)
```

## 10. Validation Commands

```bash
cd frontend
npm run typecheck
npx vitest run src/features/birth-profile/api
npx vitest run --passWithNoTests   # toàn bộ suite, xác nhận không regression F2
npm run lint
npm run build
```
(Không có script nào khác được bịa ra — toàn bộ lệnh trên đã tồn tại thật trong `package.json`, xác nhận ở lần audit F2/pre-F3 trước đó.)

## 11. Definition of Done

- 6 hàm API + `types.ts` + `mocks/handlers.ts` tồn tại đúng vị trí ở mục 4
- `BirthProfile` (response) và `CreateBirthProfileInput`/`UpdateBirthProfileInput` (request) là 2 nhóm type tách biệt, đúng bất đối xứng nested-vs-flat
- `label` field có mặt trong `BirthProfile`/`CreateBirthProfileInput` (không bị thiếu như bản draft ban đầu)
- Test ma trận mục 8 pass đầy đủ (đã hiệu chỉnh theo contract thật, không theo gợi ý sai của prompt gốc)
- Handler MSW của Birth Profile hoàn toàn tách biệt khỏi `features/auth/api/mocks/handlers.ts` — không import chéo
- `npm run typecheck` sạch, không `any`/`@ts-ignore`/`@ts-expect-error` nào được thêm
- `npx vitest run --passWithNoTests` — vẫn giữ nguyên (hoặc nhiều hơn) 291 test cũ pass, cộng thêm test mới của M1, không có test nào bị xóa/skip
- Không file nào ngoài danh sách mục 4 bị sửa, đặc biệt `shared/api/client.ts` nguyên vẹn 100%

## 12. Risks / Edge Cases

- **`isBirthTimeKnown`/`birthTime`**: đã phân tích chi tiết ở mục 3.1 (Create — không tự sửa) và 3.5 (Update — tự sửa 1 phần, chỉ khi field `birthTime` hoàn toàn vắng mặt). Rủi ro nếu code M1 hiểu sai: gán nhầm cùng 1 hành vi cho cả Create lẫn Update.
- **Nested request vs flat response**: `BirthLocationInput`/`LocationSuggestion` (nested/phẳng-như-nhau ở request) đối lập với 4 field phẳng trực tiếp trong `BirthProfile` response — dễ nhầm khi viết `defaultValues` cho form ở milestone sau, nhưng đó là việc của M3, M1 chỉ cần đảm bảo 2 type không lẫn vào nhau.
- **`date` bắt buộc ở location search**: type-level đã ép buộc (`SearchLocationsParams.date: string`, không optional) — không có cách nào gọi thiếu `date` mà qua được TypeScript, nhưng vẫn cần 1 test xác nhận query string thật sự chứa `date` (không bị Axios bỏ qua nếu truyền `undefined` do lỗi runtime nào đó bypass type).
- **Historical timezone**: M1 không validate format IANA phía client — tin tưởng hoàn toàn giá trị trả về từ `searchLocations()`, forward nguyên vẹn. Không thêm thư viện validate timezone mới (premature).
- **403 vs 404**: đã xác nhận thứ tự đúng (mục 3.3), M1 không cần làm gì đặc biệt ngoài test đúng cả 2 mã cho get/update/delete.
- **RFC7807**: `problemDetails` cục bộ (mục 7) phải khớp chính xác format thật (`type/title/status/errorCode/detail`, header `application/problem+json`) — sao chép đúng, không tự sáng tạo shape khác.
- **MSW boundary**: rủi ro lớn nhất là "tiện tay" import `problemDetails` hoặc `mockUser`-tương-tự từ `features/auth` cho nhanh — phải tránh, chấp nhận trùng lặp nhỏ (mục 7).
- **Vô tình sửa `apiClient`**: vì `updateBirthProfile.ts` cần đảm bảo gửi đúng `null` (mục 6.4), có rủi ro lập trình viên "tiện tay" thêm 1 dòng xử lý serialize đặc biệt vào `client.ts` — phải làm bằng cách đảm bảo `input` object (đã có `birthTime: null` từ caller) được truyền thẳng, không transform gì thêm trong `updateBirthProfile.ts` lẫn `client.ts`.

## 13. Open Questions

Không có Open Question nào chặn việc bắt đầu code M1. Toàn bộ điểm mơ hồ tiềm ẩn (label field, hành vi PATCH isBirthTimeKnown, ma trận lỗi List/Search) đã được giải quyết bằng bằng chứng trực tiếp từ source code + `openapi.json` trong quá trình lập plan này, không còn điều gì cần Phuc Hoang quyết định thêm trước khi vào code.

```text
No implementation-blocking Open Questions remain.
```

---

## Phụ lục — Đối chiếu nguồn sự thật (Source-of-Truth Priority Check)

| Quyết định | Nguồn xác nhận | Cấp ưu tiên |
|---|---|---|
| Route `/api/v1/birth-profiles`, `/api/v1/locations/search` | `openapi.json` (generate thật) + route source | 1-2 |
| `label` field tồn tại, bắt buộc ở Create | schema + entity + mapper (3 nguồn độc lập) | 2 |
| List không có 403 | `openapi.json` + `list-birth-profiles.usecase.ts` | 1-2 |
| Search dùng 400 không dùng 422 | `openapi.json` | 1 |
| PATCH tự null `birthTime` khi thiếu field | `update-birth-profile.usecase.ts` (đọc trực tiếp) | 2 |
| Không tạo `api/index.ts` | F2 thực tế không có tiền lệ này | 6 |
| Test naming theo văn phong F2 thật, không theo Coding Standards §13.4 | quyết định có chủ đích, ưu tiên nhất quán nội bộ hơn tuân thủ máy móc spec chưa từng được áp dụng | Recommendation (không phải fact) |

Không có mục nào trong plan này dựa trên suy đoán không kiểm chứng được.
