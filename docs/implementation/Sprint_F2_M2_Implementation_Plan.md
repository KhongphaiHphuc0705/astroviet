# Sprint F2 — M2 Implementation Plan
## Authentication Foundation — Model + API Layer

**Repo:** `KhongphaiHphuc0705/astroviet`, nhánh `dev`
**HEAD tại thời điểm lập plan:** `76a6c4d` (verify bằng `git log`; xác nhận F2 M1 đã CLOSED, không có commit mới nào kể từ lần review M1)
**Trạng thái:** Plan-only — chưa sinh code.

---

## 0. Xác nhận giải quyết Open Questions từ M1 (bắt buộc trước khi lập M2)

| ID | Nghị quyết | Áp dụng vào plan này ở đâu |
|---|---|---|
| M1-OQ-1 (numbering) | Dùng numbering F2 Decision Log Rev.2 — 9 milestone (M1..M9), **không dùng** numbering 10-milestone cũ | Toàn bộ tài liệu này gọi milestone hiện tại là **M2**, milestone kế tiếp là **M3** (Hooks + authStore wiring), theo đúng Rev.2 |
| M1-OQ-2 (refresh handler ownership) | `features/auth` sở hữu implementation của refresh handler + export 1 hàm registration tường minh; app composition layer gọi đúng 1 lần; không side-effect import; an toàn nếu gọi lại | M2 tạo `features/auth/index.ts` với `registerAuthInfrastructure()` (Mục 7, 9); `main.tsx` gọi hàm này đúng 1 lần (Mục 10) — đây là bổ sung tường minh so với danh sách file gốc của prompt M2, có lý do rõ ràng (Mục 7.5) |
| M1-OQ-3 (refresh request bypass) | `/api/v1/auth/refresh` phải bypass refresh-on-401 logic; dùng helper xác định refresh request, không substring tùy tiện | M2 sửa `shared/api/client.ts` thêm `AUTH_REFRESH_ENDPOINT` hằng số + `isRefreshRequest()` helper (Mục 7.6) — đây là **companion fix bắt buộc** vì M2 là milestone đầu tiên tạo `refresh.ts` thật, khiến bug này trở nên có thể xảy ra thật (trước M2, coordinator chưa có handler nào để tạo ra tình huống này) |

Không còn Open Question nào từ M1 chưa giải quyết. M2 có thể bắt đầu.

---

## 1. Milestone Overview

**Tên:** F2 M2 — Authentication Foundation (Model + API Layer)

**Objective:** Tạo lớp model (Zod schema validate input) và lớp API (hàm gọi HTTP thô) cho Authentication. Lớp này phải "câm" — model chỉ validate dữ liệu, hàm API chỉ gọi HTTP, không có gì khác.

**Dependencies:** F2 M1 (CLOSED, verify lại ở Mục 2), Backend Sprint 1 Identity (CLOSED, contract verify trực tiếp ở Mục 4).

**Scope:** `features/auth/model/schema.ts`, `features/auth/api/{register,login,refresh,logout}.ts`, `features/auth/api/types.ts` (bổ sung có lý do — Mục 7.4), `features/auth/index.ts` (bổ sung theo M1-OQ-2 — Mục 7.5), companion fix `shared/api/client.ts` (theo M1-OQ-3 — Mục 7.6), test cho toàn bộ.

**Non-Goals:** Toàn bộ danh sách ở Mục 19 của prompt gốc (authStore, hooks, UI, routing, session bootstrap, single-flight, v.v.) — không đổi.

**Expected Outputs:** 4 hàm API thô hoạt động đúng contract backend thật; 2 Zod schema đúng rule Mục 14 (F2 Rev.2 Plan); `registerAuthInfrastructure()` sẵn sàng cho M3 gọi hoặc tự gọi lúc bootstrap; `client.ts` không còn nguy cơ đệ quy refresh khi chính `/refresh` trả 401.

---

## 2. Current-State Preconditions

Đọc trực tiếp code thật tại HEAD `76a6c4d` (không suy diễn):

| Precondition | Trạng thái |
|---|---|
| F1 hoàn thành | ✅ — `shared/ui`, `shared/hooks/useZodForm`, layouts, routing đều tồn tại và hoạt động |
| F2 M1 hoàn thành | ✅ — đã review độc lập lượt trước: lint/typecheck/format/test(228 pass)/build đều sạch |
| `apiClient` sẵn sàng | ✅ — `shared/api/client.ts`, Axios instance, `baseURL: env.VITE_API_BASE_URL` (`.env`: `http://localhost:3000`, không có prefix `/api/v1`) |
| Chuẩn hóa lỗi sẵn sàng | ✅ — `ApiError` với `fieldErrors: Record<string,string[]>` đọc từ `metadata.fieldErrors` (F2-D2) |
| MSW sẵn sàng | ✅ — `src/test/msw-server.ts`, dùng trong `client.test.ts`/`auth-refresh-coordinator.test.ts` |
| Hạ tầng test/validate | ✅ — Vitest, `useZodForm` (F1 M7), Zod đã là dependency |
| Backend Identity contract | ✅ — đọc trực tiếp `backend/src/modules/identity/**` tại HEAD tương ứng (Mục 4) |
| Refresh coordinator sẵn sàng nhận handler | ✅ — `shared/api/auth-refresh-coordinator.ts` export `setRefreshHandler<T>()`/`coordinateRefresh<T>()`, hiện **chưa có handler nào đăng ký** |

Không có precondition nào chưa thỏa mãn.

---

## 3. Architecture Position

```
UI (M5/M6 — chưa tồn tại)
    ↓
Hooks / orchestration (M3 — chưa tồn tại)
    ↓
Auth API  ←── M2 xây dựng đúng tầng này (features/auth/model + features/auth/api)
    ↓
apiClient (shared/api/client.ts — M1, chỉ sửa 1 điểm nhỏ theo OQ3)
    ↓
Backend (Identity module — CLOSED)
```

M2 **chỉ** implement tầng `Auth API` + `Model`. Registration function (`registerAuthInfrastructure`) là ngoại lệ nằm ở ranh giới `Auth API ↔ apiClient/coordinator` — nó không phải "hooks/orchestration" (không có state, không có retry, không gọi React) mà là **composition wiring** thuần túy, đã được M1-OQ-2 giao tường minh cho M2 sở hữu.

---

## 4. Backend Contract Verification Matrix

Đọc trực tiếp `backend/src/modules/identity/**` (routes, controller, schemas, mappers) tại `dev` HEAD hiện tại — không dùng OpenAPI generate sẵn (không cần, code thật đã đủ rõ).

| Operation | Method | Endpoint | Request Body | Response Status | Response DTO | Cookie | Error |
|---|---|---|---|---|---|---|---|
| Register | `POST` | `/api/v1/auth/register` | `{email: string, password: string, displayName?: string}` | `201` | `{user: UserResponse}` | Không | `400` (validation), `409 EMAIL_ALREADY_EXISTS` |
| Login | `POST` | `/api/v1/auth/login` | `{email: string, password: string}` | `200` | `{accessToken: string, refreshToken: string, expiresIn: number, user: UserResponse}` | `Set-Cookie: refreshToken` (HttpOnly, Secure prod, SameSite=Strict, Path=`/api/v1/auth`) | `400` (validation), `401 INVALID_CREDENTIALS` |
| Refresh | `POST` | `/api/v1/auth/refresh` | `{refreshToken?: string}` (optional — **Frontend gửi `{}`, không đọc/gửi giá trị cookie**, theo F2-D1) | `200` | **Cùng shape với Login** (`AuthResponse`) | `Set-Cookie: refreshToken` (rotate — token mới) | `400 MALFORMED_REQUEST` (thiếu cả cookie lẫn body), `401` (token invalid/rotated/reused) |
| Logout | `POST` | `/api/v1/auth/logout` | Không có body — cần header `Authorization: Bearer <accessToken>` (tự động qua request interceptor có sẵn) | `204` | **Không có body** (`res.status(204).send()`) | `Set-Cookie: refreshToken=; Max-Age=0` (xóa cookie) | `401 UNAUTHORIZED` (thiếu/hết hạn access token) |

**`UserResponse` (dùng chung cho Register/Login/Refresh):**
```
{
  id: string,          // UUID
  email: string,
  displayName: string | null,
  role: "user" | "admin",
  createdAt: string,   // ISO 8601 date-time — LƯU Ý: backend Zod dùng z.date(), nhưng qua JSON.stringify (Express response) trở thành ISO string trên wire; Frontend PHẢI type là string, không phải Date
}
```

**Casing/nullable xác nhận:** `camelCase` toàn bộ (không có field nào `snake_case` lọt ra presentation layer — mapper đã chuẩn hóa). `displayName` là `string | null` (không phải `optional`/`undefined` — mapper luôn trả field này, giá trị `null` nếu user không đặt).

**Validation error structure:** đã verify từ M1 — `metadata.fieldErrors: Record<string,string[]>`, không đổi, không cần verify lại.

**Auth error codes liên quan:** `INVALID_CREDENTIALS` (401, login sai), `EMAIL_ALREADY_EXISTS` (409, đăng ký trùng), `UNAUTHORIZED` (401, thiếu/hết hạn access token — bao gồm cả logout khi token đã hết hạn), `MALFORMED_REQUEST` (400, refresh thiếu cả cookie lẫn body — trường hợp hiếm).

Không có mục nào còn `UNKNOWN — MUST VERIFY` trong bảng này — toàn bộ đã đọc trực tiếp source code.

---

## 5. DTO / Type Strategy

1. **Request types cho API function** sống trong file **mới** `frontend/src/features/auth/api/types.ts` (không phải colocate riêng lẻ trong từng file `register.ts`/`login.ts`) — lý do: `UserResponse` được dùng lại ở cả 3 response type (`RegisterResponse`, `AuthResponse` cho Login, `AuthResponse` cho Refresh); nếu định nghĩa lại trong từng file sẽ trùng lặp định nghĩa `UserResponse` 3 lần. Đây là bổ sung tối thiểu được cho phép theo Mục 6 của prompt gốc ("minimal supporting type files... necessary to avoid violating established... type boundaries").
2. **Response DTO là plain TypeScript `interface`/`type`, KHÔNG phải Zod-inferred.** Bằng chứng: `shared/api/client.ts` hiện tại (M1) không Zod-parse response — chỉ cast `data as Record<string,unknown>` rồi đọc field cụ thể. Đây là convention F1/M1 đã thiết lập: Zod chỉ dùng cho **input validation** (form/request), không dùng để runtime-validate response từ backend (tin tưởng backend contract). M2 không phát minh kiến trúc DTO mới — tiếp tục convention này.
3. **`registerSchema`/`loginSchema` (Zod, `model/schema.ts`) phục vụ CẢ 2 mục đích** — vừa là input validation cho UI form (M6 sẽ dùng trực tiếp với `useZodForm`), vừa là nguồn suy ra type cho phần field chung với backend. Tuy nhiên **`registerSchema` không thể dùng trực tiếp làm type input của `register()` API** vì nó chứa `confirmPassword` (field chỉ tồn tại ở UI, theo Mục 14 F2 Rev.2 Plan) — backend không có field này. Do đó:
   - `RegisterFormValues = z.infer<typeof registerSchema>` → `{email, password, confirmPassword, displayName?}` — dùng cho UI (M6).
   - `RegisterRequest` (plain type, trong `types.ts`) → `{email: string, password: string, displayName?: string}` — dùng cho `register()` API, khớp chính xác backend.
   - **M2 không tự chuyển đổi giữa 2 type này** (không có `omit(values, 'confirmPassword')` nào trong M2) — đó là trách nhiệm của M6 khi gọi `register()` từ UI. M2 chỉ định nghĩa cả 2 type tường minh và để rõ ranh giới.
4. **`loginSchema` không có field UI-only nào** → `LoginRequest = z.infer<typeof loginSchema>` dùng thẳng, không cần type riêng.
5. **Domain model tách biệt khỏi DTO?** Không cần ở M2 — dự án chưa có khái niệm "Domain Model" phía Frontend cho Auth (chỉ có DTO đi thẳng từ backend response tới nơi tiêu thụ). Không giới thiệu tầng mapping DTO→Domain — đúng cảnh báo "không giới thiệu kiến trúc mới không cần thiết" (Mục 13 prompt gốc).

---

## 6. Schema Design

### `registerSchema` (Zod) — rule theo đúng Mục 14, F2 Rev.2 Implementation Plan, đối chiếu khớp 100% với `backend/src/modules/identity/presentation/schemas/register.schema.ts`

| Field | Rule | Nguồn |
|---|---|---|
| `email` | `string`, `.trim()`, `.toLowerCase()`, `.email()` | Khớp backend chính xác |
| `password` | `string`, min 8, max 72 ký tự, `.regex(/\d/)` (≥1 chữ số) | Khớp backend chính xác |
| `confirmPassword` | `string`, `.refine()` so khớp `password` — **CHỈ tồn tại phía Frontend**, backend không có field này | Mục 14, F2 Rev.2 Plan |
| `displayName` | `string`, min 1, max 100, `.optional()` | Khớp backend chính xác |

**Không copy rule `Buffer.byteLength(pw, 'utf8') <= 72`** (kiểm tra byte-length UTF-8) vào Frontend — đây là quyết định đã ghi rõ trong Mục 14 (F2 Rev.2 Plan): *"kiểm tra byte-length để backend là nguồn xác nhận cuối cho trường hợp hiếm (tiếng Việt có dấu)"* — Frontend chỉ check độ dài ký tự (đơn giản hơn), để backend validation error (400, hiếm khi xảy ra) là lưới an toàn cuối. Không phải thiếu sót — là quyết định đã ghi nhận trước.

**Không có conflict nào giữa Mục 14 và code backend thật** — đối chiếu trực tiếp xác nhận khớp (ngoại trừ điểm byte-length nêu trên, vốn đã được Mục 14 tự giải thích rõ, không phải mâu thuẫn).

### `loginSchema` (Zod)

| Field | Rule | Nguồn |
|---|---|---|
| `email` | `string`, `.trim()`, `.toLowerCase()`, `.email()` | Khớp backend chính xác |
| `password` | `string`, `.min(1)` (không rỗng — backend **không** áp rule độ dài/chữ số cho login, chỉ check không rỗng) | Khớp backend chính xác |

**Error messages:** Mục 14/UI Spec không quy định message tiếng Việt cụ thể cho từng rule Zod ở tầng schema (đó là quyết định UI, M6 có thể tùy chỉnh message hiển thị) — M2 dùng message Zod mặc định hợp lý bằng tiếng Việt (tương tự cách backend viết, để nhất quán), nhưng **không bắt buộc trùng khớp 100% với message backend** (2 tầng validate độc lập, message UI có thể khác message API).

**Inference strategy:** `RegisterFormValues = z.infer<typeof registerSchema>`, `LoginFormValues = z.infer<typeof loginSchema>` — export cả 2 từ `schema.ts` cho M6 dùng sau này.

---

## 7. API Design

### 7.1 `features/auth/api/register.ts`

- **File:** `frontend/src/features/auth/api/register.ts`
- **Export:** `export async function register(input: RegisterRequest): Promise<RegisterResponse>`
- **Input type:** `RegisterRequest` (từ `./types`) — `{email: string, password: string, displayName?: string}`
- **HTTP method:** `POST`
- **Endpoint:** `/api/v1/auth/register`
- **Request body:** gửi nguyên `input`
- **Response DTO:** `RegisterResponse` — `{user: UserResponse}`
- **Error propagation:** không `try/catch` — để lỗi (đã là `ApiError` qua interceptor M1) tự propagate lên caller
- **Forbidden:** không mutate store, không điều hướng, không hiện UI, không dịch lỗi

```ts
export async function register(input: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>("/api/v1/auth/register", input);
  return response.data;
}
```

### 7.2 `features/auth/api/login.ts`

- **File:** `frontend/src/features/auth/api/login.ts`
- **Export:** `export async function login(input: LoginRequest): Promise<AuthResponse>`
- **Input type:** `LoginRequest` — `{email: string, password: string}`
- **HTTP method:** `POST`
- **Endpoint:** `/api/v1/auth/login`
- **Request body:** gửi nguyên `input`
- **Response DTO:** `AuthResponse` — `{accessToken, refreshToken, expiresIn, user}`
- **Refresh token trong response:** tồn tại trong DTO type (khớp backend thật — không được xóa field khỏi type vì nó THẬT SỰ tồn tại trên wire) nhưng **`login()` không đọc/dùng field này cho bất cứ việc gì** — không log, không lưu, không truyền tiếp field này ra khỏi hàm dưới bất kỳ hình thức nào khác ngoài việc nó tồn tại trong object trả về nguyên trạng. Việc "bỏ qua" (F2-D1) là trách nhiệm của **nơi gọi** (M3's `useLoginMutation` sẽ chỉ destructure `accessToken`/`user`, không chạm `refreshToken`) — `login()` bản thân không được phép tự ý xóa field khỏi response thật (đó sẽ là "translate/mutate response", vi phạm nguyên tắc dumb API).
- **Error propagation:** không bắt lỗi
- **Forbidden:** không mutate `authStore`, không điều hướng, không set cookie thủ công (browser tự làm qua header `Set-Cookie` thật)

```ts
export async function login(input: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/api/v1/auth/login", input);
  return response.data;
}
```

### 7.3 `features/auth/api/refresh.ts`

- **File:** `frontend/src/features/auth/api/refresh.ts`
- **Export:** `export async function refresh(): Promise<AuthResponse>`
- **Input type:** **Không có tham số** — Frontend không cầm giá trị refresh token (F2-D1), không có gì để truyền vào
- **HTTP method:** `POST`
- **Endpoint:** `AUTH_REFRESH_ENDPOINT` — hằng số import từ `@shared/api/client` (Mục 7.6), **không** hardcode lại chuỗi `/api/v1/auth/refresh` lần thứ 2 trong file này (tránh 2 nguồn sự thật cho cùng 1 giá trị, đúng tinh thần "helper thay vì substring tùy tiện" của OQ3)
- **Request body:** gửi `{}` tường minh (object rỗng) — **không** gửi `undefined`/không có body, để tránh rủi ro backend body-parser xử lý sai khi `Content-Type: application/json` nhưng body trống hoàn toàn (rủi ro đã ghi ở Mục 17); `{}` là JSON hợp lệ và khớp `refreshSchema` (`refreshToken` là optional)
- **Response DTO:** `AuthResponse` — **cùng type với Login** (không định nghĩa `RefreshResponse` riêng vì backend dùng chung `AuthResponseMapper`)
- **CRITICAL — không được có:** gọi `coordinateRefresh`, single-flight, retry, mutate `authStore`, điều hướng, gọi React hook, session orchestration — hàm này thuần túy là 1 lời gọi HTTP
- **Cookie:** browser tự động gửi kèm cookie `refreshToken` (HttpOnly) — code không đọc/ghi cookie này dưới bất kỳ hình thức nào

```ts
export async function refresh(): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(AUTH_REFRESH_ENDPOINT, {});
  return response.data;
}
```

### 7.4 `features/auth/api/logout.ts`

- **File:** `frontend/src/features/auth/api/logout.ts`
- **Export:** `export async function logout(): Promise<void>`
- **Input type:** Không có — backend không cần body, đọc `req.cookies?.refreshToken` nội bộ
- **HTTP method:** `POST`
- **Endpoint:** `/api/v1/auth/logout`
- **Request body:** không gửi body
- **Response DTO:** **Không có** — backend trả `204 No Content`, không có body nào để type. `Promise<void>` là biểu diễn chính xác, không phát minh DTO giả.
- **Auth header:** tự động gắn qua request interceptor có sẵn (M1, đọc `authStore.accessToken`) — `logout()` không tự gắn header thủ công
- **Forbidden:** không set state, không điều hướng (đó là F2-D4, thuộc milestone sau — M3's `useLogoutMutation`)

```ts
export async function logout(): Promise<void> {
  await apiClient.post("/api/v1/auth/logout");
}
```

### 7.5 `features/auth/index.ts` (bổ sung — giải quyết M1-OQ-2)

- **File:** `frontend/src/features/auth/index.ts`
- **Export:** `export function registerAuthInfrastructure(): void`
- **Lý do tồn tại:** M1-OQ-2 giao tường minh cho M2 "tạo implementation + public registration API". Đây là điểm nối duy nhất giữa `refresh()` (raw API, M2) và `setRefreshHandler()` (coordinator, M1) — không thuộc về `client.ts` (sẽ tạo `shared → features` — cấm) và không thuộc về M3 (M1-OQ-2 đã chỉ định rõ M3 không sở hữu việc đăng ký).
- **Implementation:**
  ```ts
  export function registerAuthInfrastructure(): void {
    setRefreshHandler(async () => {
      const result = await refresh();
      return result.accessToken;
    });
  }
  ```
- **Vì sao adapter (lấy `.accessToken` từ `AuthResponse`) nằm ở đây, không phải trong `refresh.ts` hay `client.ts`:** `refresh.ts` phải trả **nguyên DTO thật** (Constraint C, Mục 11.3 prompt gốc — "Must return: Promise<actual Refresh DTO>"), không được tự cắt bớt field. `coordinateRefresh<string>()` (M1, không đổi) kỳ vọng handler trả về `Promise<string>` (xem `client.ts` hiện tại: `coordinateRefresh<string>()`). Ai đó phải làm cầu nối giữa 2 shape này — `features/auth` là nơi hợp lý duy nhất (nó biết cả `refresh()` DTO thật lẫn "coordinator cần string gì") mà không buộc `client.ts`/`auth-refresh-coordinator.ts` phải biết về `AuthResponse`.
- **An toàn khi gọi lại nhiều lần (yêu cầu tường minh của bạn):** `setRefreshHandler()` (M1) chỉ gán lại biến `handler` — gọi `registerAuthInfrastructure()` 2 lần chỉ ghi đè bằng 1 closure **tương đương hệt nhau** (không có side-effect nào khác biệt giữa 2 lần gọi) → an toàn tuyệt đối, không cần thêm cờ "đã đăng ký chưa". Test M2 sẽ verify tường minh: gọi hàm 2 lần liên tiếp không throw, không tạo ra 2 handler khác nhau, hành vi `coordinateRefresh()` sau đó vẫn đúng.
- **Không phải side-effect import:** import module `features/auth/index.ts` ở bất kỳ đâu (kể cả `main.tsx`) **không** tự động đăng ký gì — phải gọi tường minh `registerAuthInfrastructure()`. Test M2 verify: chỉ `import` (không gọi hàm) → `coordinateRefresh()` vẫn reject "chưa đăng ký" (test import-only-no-registration).
- **Forbidden:** không export `api/*` trực tiếp cho consumer khác ngoài chính hàm này sử dụng nội bộ (giữ nguyên tinh thần index.ts "public surface tối thiểu" đã định hướng từ F2 Rev.2 Plan Mục 13) — M2 **không** export `register`/`login`/`logout`/`refresh` qua `index.ts` vì chưa có hook nào (M3) cần dùng qua đường public API này; M3 sẽ mở rộng `index.ts` khi cần.

### 7.6 Companion Fix — `shared/api/client.ts` (giải quyết M1-OQ-3)

- **Thêm vào `client.ts`:**
  ```ts
  export const AUTH_REFRESH_ENDPOINT = "/api/v1/auth/refresh";

  function isRefreshRequest(config?: { url?: string }): boolean {
    return config?.url === AUTH_REFRESH_ENDPOINT;
  }
  ```
- **Sửa nhánh 401 trong response interceptor:**
  ```ts
  if (status === 401 && originalRequest && !originalRequest._retry) {
    if (isRefreshRequest(originalRequest)) {
      // Chính request /refresh nhận 401 (token invalid/rotated/reused) — không thử refresh lại refresh
      return Promise.reject(apiError);
    }
    originalRequest._retry = true;
    try {
      const newAccessToken = await coordinateRefresh<string>();
      ...
    }
  }
  ```
- **Vì sao đây là "helper", không phải "substring tùy tiện":** so sánh **chính xác** (`===`) với hằng số đã export, dùng **cùng 1 hằng số** cho cả nơi gọi thật (`refresh.ts`, Mục 7.3) lẫn nơi kiểm tra (`client.ts`) — không có 2 chuỗi literal độc lập có thể lệch nhau theo thời gian.
- **Tại sao đây là M2, không phải bug fix riêng của M1:** trước M2, không có `refresh()` thật nào được đăng ký — `coordinateRefresh()` luôn reject "chưa đăng ký" ngay lập tức, không bao giờ thực sự gọi `/api/v1/auth/refresh` — nên tình huống "chính request refresh nhận 401" **không thể xảy ra** trước M2. M2 là milestone đầu tiên khiến bug này có thể xảy ra thật (vì giờ `refresh()` thật tồn tại và có thể được đăng ký) — sửa nó cùng lúc với việc tạo ra nguyên nhân là hợp lý về trình tự, dù về mặt file đây là sửa file M1 tạo ra.

---

## 8. Dependency Graph

```
features/auth/model/schema.ts   (không phụ thuộc gì trong dự án, chỉ Zod)
        ↑
features/auth/api/types.ts      (không phụ thuộc gì, chỉ type)
        ↑
features/auth/api/{register,login,refresh,logout}.ts
        ↓ import
shared/api/client.ts  (apiClient, AUTH_REFRESH_ENDPOINT)
        ↓ import (chỉ refresh.ts dùng AUTH_REFRESH_ENDPOINT)

features/auth/index.ts
        ↓ import
    features/auth/api/refresh.ts   (cùng module, chiều xuống hợp lệ)
    shared/api/auth-refresh-coordinator.ts   (setRefreshHandler — shared, hợp lệ)

main.tsx
        ↓ import
    features/auth (gọi registerAuthInfrastructure())
```

**Xác nhận không có `shared → features/auth`:**
- `shared/api/client.ts` sau M2 vẫn **không** import bất kỳ thứ gì từ `features/*` — `isRefreshRequest()`/`AUTH_REFRESH_ENDPOINT` là hằng số/hàm thuần túy sống trong `shared`, được `features/auth/api/refresh.ts` **import xuống** (chiều `features → shared`, hợp lệ), không phải chiều ngược lại.
- `shared/api/auth-refresh-coordinator.ts` **không đổi gì** ở M2 — vẫn 0 import.

**Không có vòng lặp (circular dependency):** `features/auth/index.ts → features/auth/api/refresh.ts` là chiều xuống trong cùng feature, không quay ngược lại `index.ts`.

---

## 9. Test Strategy

Quy ước test: **co-located** (`.test.ts` cạnh file nguồn) — đúng convention F1/M1 đã xác nhận qua toàn bộ `shared/api/*.test.ts`, `shared/stores/*.test.ts`.

### Test files:
```
features/auth/model/schema.test.ts
features/auth/api/register.test.ts
features/auth/api/login.test.ts
features/auth/api/refresh.test.ts
features/auth/api/logout.test.ts
features/auth/index.test.ts
```
Và cập nhật: `shared/api/client.test.ts` (thêm case OQ3).

### Bảng Schema Rule × Test (Mục 14 đối chiếu)

| Schema | Rule | Valid case | Invalid case | Expected result |
|---|---|---|---|---|
| `registerSchema` | email format | `"a@b.com"` | `"not-an-email"` | reject, message email |
| `registerSchema` | email trim/lowercase | `" A@B.COM "` → parse ra `"a@b.com"` | — | `.parse()` trả email đã chuẩn hóa |
| `registerSchema` | password min 8 | `"abcd1234"` (8 ký tự) | `"abc123"` (6 ký tự) | reject "ít nhất 8 ký tự" |
| `registerSchema` | password max 72 | chuỗi 72 ký tự hợp lệ | chuỗi 73 ký tự | reject "tối đa 72" |
| `registerSchema` | password ≥1 chữ số | `"abcdefg1"` | `"abcdefgh"` (không số) | reject "ít nhất 1 chữ số" |
| `registerSchema` | confirmPassword khớp | `password="Abc12345", confirmPassword="Abc12345"` | `confirmPassword="Different1"` | reject "không khớp" |
| `registerSchema` | displayName optional | không truyền field | truyền `""` (rỗng, vi phạm min 1) | trường hợp thiếu: pass; trường hợp rỗng: reject |
| `registerSchema` | displayName max 100 | chuỗi 100 ký tự | chuỗi 101 ký tự | reject |
| `registerSchema` | required fields missing | — | thiếu `email` hoàn toàn | reject "Required" |
| `registerSchema` | whitespace-only email | — | `"   "` | reject (không phải email hợp lệ sau trim) |
| `loginSchema` | email format | `"a@b.com"` | `"invalid"` | reject |
| `loginSchema` | password không rỗng | `"x"` (1 ký tự, hợp lệ — login không có rule độ dài) | `""` | reject "không được để trống" |
| `loginSchema` | required fields missing | — | thiếu `password` | reject |

### Bảng API × MSW Test

| Area | Test | Expected |
|---|---|---|
| `register()` | POST đúng URL/method/body, mock 201 | Trả đúng `RegisterResponse.user` khớp field |
| `register()` | mock 409 `EMAIL_ALREADY_EXISTS` | Reject với `ApiError`, `errorCode==="EMAIL_ALREADY_EXISTS"` |
| `login()` | POST đúng URL/method/body, mock 200 | Trả đúng `AuthResponse` đầy đủ 4 field |
| `login()` | mock 401 `INVALID_CREDENTIALS` | Reject với `ApiError` đúng `errorCode` |
| `refresh()` | POST đúng URL (`AUTH_REFRESH_ENDPOINT`), body `{}`, mock 200 | Trả đúng `AuthResponse`; test **không** đọc/giả lập giá trị cookie thật (đúng Mục 16 prompt gốc) — chỉ verify request/response, không assert cookie |
| `refresh()` | mock 401 | Reject với `ApiError`; **test riêng ở `client.test.ts`** (không phải ở `refresh.test.ts`) verify rằng lỗi này KHÔNG kích hoạt `coordinateRefresh()` thêm lần nữa (OQ3) |
| `logout()` | POST đúng URL, không body, mock 204 | Resolve `undefined`, không throw |
| `logout()` | mock 401 `UNAUTHORIZED` (access token hết hạn) | Reject với `ApiError` |
| `registerAuthInfrastructure()` | gọi 1 lần, rồi `coordinateRefresh()` | Gọi `refresh()` thật (mock MSW) và trả về đúng `accessToken` (string) |
| `registerAuthInfrastructure()` | gọi 2 lần liên tiếp | Không throw; hành vi `coordinateRefresh()` sau đó vẫn đúng (idempotent) |
| `registerAuthInfrastructure()` | chỉ `import` module, không gọi hàm | `coordinateRefresh()` vẫn reject "chưa đăng ký" (chứng minh không có side-effect import) |
| `client.ts` (OQ3) | mock `/api/v1/auth/refresh` trả 401 (không đăng ký handler nào, hoặc handler đã đăng ký nhưng `/refresh` tự nó 401) | Reject ngay với lỗi 401 gốc của chính request đó, **`coordinateRefresh()` không được gọi thêm lần nào** (spy trên `coordinateRefresh`/`handlerSpy` đếm 0 lần gọi thêm) |

### Giới hạn cookie (Mục 16 prompt gốc, tuân thủ tường minh)

MSW/JSDOM không mô phỏng đúng hành vi gửi/nhận `HttpOnly Cookie` như trình duyệt thật. Test `refresh()` **chỉ** verify: request gửi đúng endpoint, đúng method, body `{}`; response mock trả đúng shape `AuthResponse`. Test **không** cố gắng assert cookie có được gửi/set hay không — đây là giới hạn môi trường test đã biết, ghi nhận rõ (không dựng "fake security abstraction" để giả vờ verify được điều không thể verify).

---

## 10. Exact File Change List

### Create

```
frontend/src/features/auth/model/schema.ts
frontend/src/features/auth/model/schema.test.ts
frontend/src/features/auth/api/types.ts
frontend/src/features/auth/api/register.ts
frontend/src/features/auth/api/register.test.ts
frontend/src/features/auth/api/login.ts
frontend/src/features/auth/api/login.test.ts
frontend/src/features/auth/api/refresh.ts
frontend/src/features/auth/api/refresh.test.ts
frontend/src/features/auth/api/logout.ts
frontend/src/features/auth/api/logout.test.ts
frontend/src/features/auth/index.ts
frontend/src/features/auth/index.test.ts
```

### Modify

```
frontend/src/shared/api/client.ts        (thêm AUTH_REFRESH_ENDPOINT + isRefreshRequest() — OQ3)
frontend/src/shared/api/client.test.ts   (thêm test case OQ3)
frontend/src/main.tsx                    (gọi registerAuthInfrastructure() 1 lần — OQ2)
```

### Delete

`Modify: None` — không có file nào bị xóa.

**Ghi chú minh bạch:** 3 file trong nhóm "Modify" (`client.ts`, `client.test.ts`, `main.tsx`) và 2 file trong nhóm "Create" (`features/auth/api/types.ts`, `features/auth/index.ts` + test) **không nằm trong danh sách file tối thiểu của Mục 7/20 (prompt gốc)** — cả 5 điểm bổ sung này đều xuất phát trực tiếp từ 2 quyết định OQ2/OQ3 mà bạn đã giao cho M2 xử lý tường minh ở đầu phiên này, không phải tự ý mở rộng phạm vi.

---

## 11. Step-by-Step Implementation Tasks

1. Verify M1 outputs (đọc lại `auth-refresh-coordinator.ts`, `client.ts`, `queryClient.ts` — xác nhận đúng như review lượt trước, không có commit mới lạ).
2. Verify backend contract (Mục 4 — đã hoàn thành khi lập plan này; developer thực thi nên re-run `git log` phía backend để chắc chắn không có commit mới).
3. Verify DTO/type strategy (Mục 5 — quyết định trước khi viết code, tránh viết lại).
4. Implement `features/auth/api/types.ts`.
5. Implement `features/auth/model/schema.ts`.
6. Implement `features/auth/model/schema.test.ts` (toàn bộ bảng Mục 9).
7. Implement `register.ts` + `register.test.ts`.
8. Implement `login.ts` + `login.test.ts`.
9. Sửa `shared/api/client.ts` (thêm `AUTH_REFRESH_ENDPOINT`/`isRefreshRequest`) **trước khi** viết `refresh.ts`, vì `refresh.ts` cần import hằng số này.
10. Implement `refresh.ts` + `refresh.test.ts`.
11. Cập nhật `client.test.ts` (case OQ3 — cần `refresh.ts` tồn tại để test thật sự có ý nghĩa, dù về mặt kỹ thuật có thể mock).
12. Implement `logout.ts` + `logout.test.ts`.
13. Implement `features/auth/index.ts` (`registerAuthInfrastructure`) + `index.test.ts`.
14. Sửa `main.tsx` (gọi `registerAuthInfrastructure()`).
15. Chạy verification đầy đủ (Mục 20, tương tự M1: lint/typecheck/format/test/build).
16. Review dependency boundary thủ công (đọc import list mọi file mới/sửa — xác nhận Mục 8).
17. Final milestone verification (đối chiếu Acceptance/Exit Criteria).

**Lý do thứ tự 9 trước 10:** `refresh.ts` phụ thuộc hằng số `AUTH_REFRESH_ENDPOINT` từ `client.ts` — phải tồn tại trước khi import.

---

## 12. Testing Matrix

(Đã trình bày đầy đủ ở Mục 9 — không lặp lại, tham chiếu ngược.)

---

## 13. Acceptance Criteria

- [ ] 4 hàm API (`register`, `login`, `refresh`, `logout`) tồn tại, đúng chữ ký Mục 7
- [ ] Cả 4 hàm có MSW test pass, verify đúng URL/method/body
- [ ] `registerSchema`/`loginSchema` reject đúng input sai theo Mục 14, có test cho từng rule (bảng Mục 9)
- [ ] Input hợp lệ pass qua cả 2 schema
- [ ] Response DTO khớp chính xác `UserResponse`/`RegisterResponse`/`AuthResponse` (Mục 4)
- [ ] Không có mutation `authStore` ở bất kỳ đâu trong `features/auth/api/*` hoặc `index.ts`
- [ ] Không có `navigate()`/điều hướng nào trong M2
- [ ] `refresh.ts` không import/gọi `coordinateRefresh`
- [ ] Không lưu/log/decode `refreshToken` ở bất kỳ đâu (kể cả trong test, không log giá trị thật ra console)
- [ ] `isRefreshRequest()` dùng so sánh chính xác với hằng số dùng chung, không substring
- [ ] `registerAuthInfrastructure()` an toàn khi gọi lại nhiều lần (có test)
- [ ] Import module `features/auth` không tự đăng ký gì (có test import-only)
- [ ] Không có vi phạm dependency direction (`shared → features/auth` = 0, verify thủ công)

## 14. Exit Criteria

- [ ] `npm run typecheck` pass
- [ ] `npm run lint` pass
- [ ] `npm run format:check` pass
- [ ] `npm run test` pass (toàn bộ, không chỉ file mới — regression F1/M1 = 0)
- [ ] Toàn bộ MSW test pass
- [ ] Không có TODO/FIXME mới không phân loại
- [ ] Không dead code (không có export không dùng — ví dụ nếu `types.ts` export field thừa)
- [ ] Không circular dependency
- [ ] Không scope creep (đối chiếu Mục 19 prompt gốc — 0 vi phạm)
- [ ] Architecture review (Mục 25 — Final Architect Review) toàn bộ `YES`

---

## 15. Decision Log

| ID | Decision | Rationale | Consequence |
|---|---|---|---|
| M2-DL-01 | `AuthResponse` dùng chung cho cả Login lẫn Refresh (không tạo `RefreshResponse` riêng) | Backend dùng chung `AuthResponseMapper` cho cả 2 use case (bằng chứng: `auth.controller.ts`) | `refresh.ts` và `login.ts` cùng import 1 type từ `types.ts` |
| M2-DL-02 | Tạo `RegisterRequest` (plain type) tách biệt với `RegisterFormValues` (`z.infer<registerSchema>`) | `registerSchema` chứa `confirmPassword` (UI-only), backend không nhận field này — API type phải khớp chính xác backend | M6 (tương lai) chịu trách nhiệm map `RegisterFormValues → RegisterRequest` trước khi gọi `register()`; M2 không tự làm việc này |
| M2-DL-03 | `refresh()` gửi body `{}` tường minh, không gửi `undefined`/không có body | Tránh rủi ro body-parser xử lý sai khi có `Content-Type: application/json` nhưng body thực sự trống | Test `refresh.test.ts` verify body gửi đi chính xác là `{}` |
| M2-DL-04 | Adapter chuyển `AuthResponse → string (accessToken)` đặt trong `features/auth/index.ts`, không đặt trong `refresh.ts` hay `client.ts` | `refresh.ts` phải trả DTO thật nguyên vẹn (Constraint C); `client.ts`/coordinator không được biết về shape `AuthResponse` (giữ generic, M1-DL-03) | `registerAuthInfrastructure()` là nơi duy nhất biết cả 2 phía |
| M2-DL-05 | `AUTH_REFRESH_ENDPOINT` là hằng số duy nhất, export từ `shared/api/client.ts`, dùng chung bởi `refresh.ts` và `isRefreshRequest()` | Tránh 2 chuỗi literal độc lập lệch nhau theo thời gian (đúng yêu cầu OQ3 "không substring tùy tiện") | Thay đổi endpoint trong tương lai chỉ cần sửa 1 nơi |
| M2-DL-06 | `features/auth/index.ts` **không** export `register`/`login`/`logout` ở M2 | Chưa có consumer nào (hook M3) cần — export sớm tạo bề mặt API chưa dùng tới, dễ drift | M3 tự mở rộng `index.ts` khi viết hook, không phải việc của M2 |

## 16. Open Questions

Không có Open Question nào **blocking** M2 (đúng mục tiêu prompt gốc §16). 1 điểm cần lưu ý cho M3 (không blocking M2):

| ID | Note | Blocking? | Cần verify trước |
|---|---|---|---|
| M2-OQ-1 | `login()` trả `refreshToken` thật trong `AuthResponse` (đúng backend) — M3's `useLoginMutation` phải chủ động **không** destructure/lưu field này vào bất kỳ đâu (kể cả biến tạm debug) | Không blocking M2 | M3 bắt đầu |

## 17. Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| DTO drift (backend đổi field mà Frontend không hay) | Thấp | Trung bình | `types.ts` đối chiếu trực tiếp với mapper thật (Mục 4) — nếu backend đổi, MSW test dùng shape cứng sẽ vẫn "pass" (không tự phát hiện drift qua network thật) — đây là giới hạn cố hữu của MSW, ghi nhận rõ |
| Endpoint drift (`/api/v1/auth/*` đổi path) | Thấp | Cao | `AUTH_REFRESH_ENDPOINT` tập trung 1 nơi giảm rủi ro cho riêng refresh; 3 endpoint còn lại vẫn hardcode string riêng lẻ trong từng file — chấp nhận được ở quy mô 3 endpoint, không cần trừu tượng hóa thêm (tránh over-engineering, Constraint H) |
| Schema/backend mismatch tương lai nếu backend đổi rule password | Thấp | Trung bình | Test M2 map trực tiếp từng rule — nếu backend đổi, test Frontend không tự fail (2 codebase độc lập) — cần quy trình đồng bộ thủ công khi backend đổi rule (ngoài phạm vi M2) |
| Nhầm cookie assumption (tưởng có thể đọc/set cookie từ JS) | Thấp | Cao nếu xảy ra | Toàn bộ Mục 7 không có dòng code nào đọc/ghi `document.cookie` — verify thủ công khi review |
| `coordinateRefresh` vô tình bị gọi trong `refresh.ts` (nhầm lẫn khi code) | Thấp | Cao | Test tĩnh: `refresh.ts` không import `auth-refresh-coordinator` — grep xác nhận (tương tự Test 7 của M1) |
| `authStore` vô tình bị import vào `features/auth/api/*` | Thấp | Cao | Grep xác nhận: chỉ `index.ts` được phép import `auth-refresh-coordinator`; không file `api/*.ts` nào import `authStore` |
| MSW test pass nhưng backend thật khác (giả định sai về response shape) | Trung bình | Trung bình | Toàn bộ shape trong Mục 4 lấy trực tiếp từ code backend thật (không phải OpenAPI cache/tài liệu cũ) — rủi ro giảm đáng kể so với dùng tài liệu; rủi ro còn lại chỉ nếu backend có commit mới chưa được re-verify (Task 2, Mục 11) |
| API function trở thành business-logic container theo thời gian (bị thêm dần logic không thuộc về nó) | Thấp | Trung bình | Code review checklist tương lai (đã có tiền lệ ở M1's Risk Register) — mỗi PR sửa `features/auth/api/*` cần đối chiếu lại "dumb API" checklist (Mục 10 prompt gốc) |

## 18. Definition of Done

- [ ] 4 hàm API tồn tại, đúng contract backend thật (Mục 4), có MSW test pass
- [ ] `registerSchema`/`loginSchema` đúng 100% rule Mục 14, có test cho mọi rule + boundary case
- [ ] `registerAuthInfrastructure()` tồn tại, an toàn khi gọi lại, không side-effect-on-import, có test cho cả 3 hành vi
- [ ] `client.ts` không còn nguy cơ đệ quy refresh khi `/refresh` tự nó 401 (OQ3), có test chứng minh
- [ ] `main.tsx` gọi `registerAuthInfrastructure()` đúng 1 lần
- [ ] Không có business logic/state/routing nào lọt vào M2 (đối chiếu Mục 19 prompt gốc)
- [ ] `shared → features/auth` = 0 dependency
- [ ] Toàn bộ lint/typecheck/format/test/build sạch, không regression
- [ ] M3 có thể bắt đầu ngay: gọi `login`/`register`/`logout` trực tiếp qua `import` từ `features/auth/api/*`, và `registerAuthInfrastructure()` đã sẵn sàng hoạt động đúng khi app khởi động

---

## 19. Final Architect Review

| # | Câu hỏi | Trả lời |
|---|---|---|
| 1 | Backend endpoints đã verify từ evidence thật? | **YES** — Mục 4, đọc trực tiếp routes/controller |
| 2 | Request DTO đã verify? | **YES** — Mục 4/6, đối chiếu Zod schema backend thật |
| 3 | Response DTO đã verify? | **YES** — Mục 4, đối chiếu mapper thật |
| 4 | `registerSchema` rule từ Mục 14 đầy đủ? | **YES** — Mục 6, đối chiếu song song backend + Mục 14 |
| 5 | `loginSchema` rule từ Mục 14 đầy đủ? | **YES** — Mục 6 |
| 6 | Mọi rule có test? | **YES** — bảng Mục 9 |
| 7 | Mọi API function có MSW test? | **YES** — bảng Mục 9 |
| 8 | MSW test verify method/URL/body? | **YES** — Mục 9 |
| 9 | API test verify DTO shape trả về? | **YES** — Mục 9 |
| 10 | `refresh.ts` chỉ raw HTTP? | **YES** — Mục 7.3, không có logic nào khác |
| 11 | `refresh.ts` tránh coordinator? | **YES** — xác nhận tường minh, adapter nằm ở `index.ts` (7.5) |
| 12 | Không phụ thuộc `authStore`? | **YES** — không file nào trong `features/auth/api`/`index.ts` import `authStore` |
| 13 | Không phụ thuộc routing/navigation? | **YES** |
| 14 | Không lưu token? | **YES** — không `localStorage`/`sessionStorage` nào xuất hiện |
| 15 | Bảo mật HttpOnly refresh-token được giữ nguyên? | **YES** — không đọc/ghi cookie, không log `refreshToken` |
| 16 | API layer tái dùng `apiClient`? | **YES** — cả 4 hàm đều gọi qua `apiClient` |
| 17 | Dependency direction hợp lệ? | **YES** — Mục 8 |
| 18 | Không có `shared → features/auth`? | **YES** — verify thủ công, `client.ts` chỉ export hằng số/hàm thuần túy, không import ngược |
| 19 | M2 không lấn M3? | **YES** — Mục 19 (prompt gốc) đối chiếu đầy đủ, ngoại trừ 2 bổ sung đã giải trình rõ (registration function, OQ3 fix) theo chỉ định trực tiếp của bạn |
| 20 | Toàn bộ Acceptance Criteria thỏa mãn? | **YES** (theo thiết kế — sẽ verify thật khi code) |
| 21 | Exit Criteria đo lường khách quan? | **YES** — Mục 14, đều là lệnh/test cụ thể |
| 22 | Còn blocker nào không? | **NO** |
| 23 | 1 developer thực thi được không cần đoán kiến trúc? | **YES** — mọi file có chữ ký, input/output, forbidden list tường minh |

Không có mục nào `NO`. Không có mục nào `UNKNOWN` mang tính blocking.

---

## M2 Final Status

### Scope
Model (`schema.ts`) + API layer thô (4 hàm) cho Authentication, cộng 2 bổ sung bắt buộc theo nghị quyết OQ2/OQ3 từ M1: `registerAuthInfrastructure()` (đăng ký refresh handler) và companion fix cho `client.ts` (bypass refresh-on-401 cho chính request refresh).

### Dependencies
F2 M1 (CLOSED), Backend Sprint 1 Identity (CLOSED) — cả 2 đã verify bằng code thật, không có dependency nào UNKNOWN.

### Files Created
13 file (7 source + 6 test) — liệt kê đầy đủ Mục 10.

### Files Modified
`shared/api/client.ts`, `shared/api/client.test.ts`, `main.tsx` — cả 3 đều xuất phát từ nghị quyết OQ2/OQ3, không phải scope creep tự phát.

### Tests Added
6 test file mới + 1 test file mở rộng (`client.test.ts`) — tổng cộng bao phủ toàn bộ bảng Mục 9.

### Architectural Constraints
Constraint A–H (prompt gốc Mục 22) đều được tuân thủ tường minh — xem đối chiếu trực tiếp ở Mục 7 (mỗi hàm đều liệt kê "Forbidden") và Mục 8 (dependency graph).

### Acceptance Criteria
Mục 13 — 13 tiêu chí, tất cả khách quan, đo được bằng test/grep cụ thể.

### Exit Criteria
Mục 14 — 10 tiêu chí, tất cả là lệnh/kết quả cụ thể.

### Blockers
Không có.

### Ready for Implementation?

```
READY FOR IMPLEMENTATION
```
