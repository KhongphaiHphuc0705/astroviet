# REST API Specification
## AstroViet Platform — HTTP Contract giữa Client và Server

| | |
|---|---|
| **Loại tài liệu** | REST API Specification (HTTP Contract) |
| **Phiên bản** | 1.1 — đã cập nhật theo phản hồi Product Owner ngày 10/07/2026 (chốt 13 Open Questions, xem Mục 14) |
| **Ngày soạn** | 10/07/2026 (khởi tạo) — cập nhật 10/07/2026 |
| **Tác giả** | Senior Backend Architect (DDD, RESTful API, OpenAPI 3.1) |
| **Tài liệu nguồn (Single Source of Truth)** | 1. Product Requirements Document (PRD) v1.0 <br> 2. Astrology Domain Specification v1.0 <br> 3. Astrology Engine Specification v1.0 |
| **Nguyên tắc kế thừa** | Tài liệu này **không được** tự ý thay đổi Domain Model, Business Rules, Engine Workflow, hay Input/Output Model đã định nghĩa ở 3 tài liệu trên. Mọi mâu thuẫn phát hiện được ghi nhận tại **Mục 14 — Open Questions & Inconsistencies**; toàn bộ mục trong lần cập nhật này đã được Product Owner chốt quyết định |

> **Phạm vi tài liệu:** Chỉ mô tả **HTTP Contract** — request/response, status code, header, auth. **Không** mô tả Database schema, Internal class, UI/Frontend, hay thuật toán tính toán chiêm tinh (đã có ở Engine Specification).

---

## Mục lục

1. [Overview](#1-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [API Resources](#3-api-resources)
4. [Endpoint Specification](#4-endpoint-specification)
5. [Request / Response Models](#5-request--response-models)
6. [Validation Rules](#6-validation-rules)
7. [Error Handling](#7-error-handling)
8. [Pagination, Filtering & Sorting](#8-pagination-filtering--sorting)
9. [Rate Limiting](#9-rate-limiting)
10. [API Lifecycle](#10-api-lifecycle)
11. [Security Considerations](#11-security-considerations)
12. [Sequence Diagrams](#12-sequence-diagrams)
13. [OpenAPI Mapping](#13-openapi-mapping)
14. [Open Questions & Inconsistencies](#14-open-questions--inconsistencies)

---

## 1. Overview

### 1.1 Purpose
API này là lớp giao tiếp HTTP duy nhất giữa Client (Web Frontend) và Backend của AstroViet, expose các khả năng đã định nghĩa ở PRD (lập lá số, lưu lá số, thư viện kiến thức, tài khoản người dùng) thông qua các resource RESTful, đồng thời **ủy quyền toàn bộ phần tính toán chiêm tinh** cho Astrology Engine (xem Engine Specification) — API layer không tự tính toán, chỉ điều phối input/output.

### 1.2 Scope
Theo đúng phạm vi MVP đã chốt ở PRD Mục 3.1 (In-scope) và 8.3 (MoSCoW):

| Trong phạm vi v1 | Ngoài phạm vi v1 |
|---|---|
| Natal Chart (tạo, xem, lưu, xóa) | Synastry (PRD xếp Could-have, **không đưa vào v1** — xem Mục 14.3) |
| Tài khoản người dùng (đăng ký/đăng nhập, quản lý lá số đã lưu) | Transit, Composite, Solar Return (Engine Spec đã thiết kế extension point nhưng chưa triển khai) |
| Thư viện kiến thức chiêm tinh (đọc công khai + quản trị nội dung) | Thanh toán / Premium tier (PRD Out-of-scope) |
| Tra cứu địa danh sinh (geocoding proxy) | AI Interpretation qua LLM (Quyết định 14.1: server tự quyết định nguồn nội dung nội bộ, không expose lựa chọn AI ra API — xem Mục 14.1) |

### 1.3 API Version
- Version hiện tại: **v1**, đặt trong URL path: `https://api.astroviet.vn/api/v1/...`
- Lý do chọn **URL path versioning** thay vì header versioning: dễ debug, dễ cache theo version, phù hợp với việc client là web frontend đơn giản (không phải hệ sinh thái đa client phức tạp cần thương lượng version qua header).

### 1.4 Naming Convention

| Quy tắc | Áp dụng |
|---|---|
| Resource danh từ số nhiều | `/charts`, `/birth-profiles`, `/articles` (không dùng động từ trong URL) |
| kebab-case cho URL path | `/birth-profiles`, `/house-systems` |
| camelCase cho JSON field | `birthDate`, `isRetrograde`, `houseSystem` |
| snake_case / camelCase cho query param | camelCase, đồng nhất với JSON body: `?pageSize=20&sortBy=createdAt` |
| Timestamp | ISO-8601, luôn UTC, hậu tố `Z` (ví dụ `2026-07-10T08:30:00Z`) |
| ID | UUID v4 dạng chuỗi |

### 1.5 Design Philosophy

| Nguyên tắc | Diễn giải |
|---|---|
| **Resource-oriented** | Mọi endpoint xoay quanh danh từ (Chart, BirthProfile, Article), không có endpoint dạng RPC (`/calculateChart`) |
| **Stateless** | Mỗi request tự chứa đủ thông tin (JWT trong header) — server không lưu session giữa các request |
| **Separation Calculation vs. Persistence** | `POST /charts/natal` **luôn** tính toán qua Engine (stateless, deterministic theo Engine Spec); việc có **lưu lại** kết quả hay không là một hành vi riêng, điều khiển qua tham số `save` — phản ánh đúng ranh giới Engine không tự quyết định việc lưu trữ (Engine Spec Mục 1.3) |
| **JSON Response Standard** | Toàn bộ response body là JSON (`Content-Type: application/json; charset=utf-8`) |
| **RFC 7807 Problem Details** | Mọi error response tuân theo chuẩn `application/problem+json` (xem Mục 7) |
| **Idempotency** | `PUT`, `DELETE` là idempotent theo chuẩn HTTP; `POST /charts/natal` tuy là POST nhưng **deterministic** (theo Engine) — cùng input luôn trả cùng kết quả tính toán, dù mỗi lần gọi vẫn tạo `id` mới nếu `save=true` (xem Mục 4.4 và Mục 14.5 về idempotency key) |

---

## 2. Authentication & Authorization

### 2.1 Ba cấp độ truy cập

| Cấp độ | Mô tả |
|---|---|
| **Guest** | Không có JWT hợp lệ. Có thể tính toán Chart (stateless) và đọc thư viện kiến thức, nhưng **không lưu** được dữ liệu |
| **User** | Có JWT hợp lệ, role = `user`. Truy cập đầy đủ tính năng cá nhân: lưu BirthProfile, lưu Chart, quản lý Preferences |
| **Admin** | Có JWT hợp lệ, role = `admin`. Có thêm quyền quản trị nội dung thư viện kiến thức (CRUD Article) — xem Mục 14.2 về việc role Admin chưa được Domain Spec định nghĩa chính thức |

### 2.2 JWT Flow

```
┌────────┐                                  ┌────────┐
│ Client │                                  │ Server │
└───┬────┘                                  └───┬────┘
    │  POST /auth/login {email, password}       │
    ├───────────────────────────────────────────▶│
    │                                             │ validate credentials
    │                                             │ generate accessToken (short-lived, 15p)
    │                                             │ generate refreshToken (long-lived, 30 ngày)
    │  200 OK {accessToken, refreshToken, user}   │
    │◀───────────────────────────────────────────┤
    │                                             │
    │  GET /birth-profiles                       │
    │  Header: Authorization: Bearer <accessToken>│
    ├───────────────────────────────────────────▶│
    │                                             │ verify JWT signature + expiry
    │  200 OK [...]                              │
    │◀───────────────────────────────────────────┤
    │                                             │
    │  (15 phút sau, accessToken hết hạn)         │
    │  GET /birth-profiles (accessToken cũ)      │
    ├───────────────────────────────────────────▶│
    │  401 Unauthorized (TOKEN_EXPIRED)           │
    │◀───────────────────────────────────────────┤
    │                                             │
    │  POST /auth/refresh {refreshToken}          │
    ├───────────────────────────────────────────▶│
    │                                             │ verify refreshToken, rotate
    │  200 OK {accessToken mới, refreshToken mới} │
    │◀───────────────────────────────────────────┤
```

### 2.3 Refresh Token — quy tắc vận hành

| Quy tắc | Giá trị |
|---|---|
| accessToken thời hạn | 15 phút |
| refreshToken thời hạn | 30 ngày |
| Refresh Token Rotation | Mỗi lần refresh thành công, `refreshToken` cũ bị vô hiệu hóa và cấp `refreshToken` mới (chống replay attack) |
| Lưu trữ refreshToken phía client | **Đã chốt:** HttpOnly Cookie + `SameSite=Strict` (Quyết định 14.4) — an toàn hơn localStorage trước XSS. Backend cần cấu hình CORS/CSRF tương ứng (xem Mục 11) |
| Revoke | `POST /auth/logout` vô hiệu hóa refreshToken hiện tại phía server |

### 2.4 Permission Matrix

| Endpoint | Guest | User | Admin |
|---|---|---|---|
| `POST /auth/register` | ✔ | — | — |
| `POST /auth/login` | ✔ | — | — |
| `POST /auth/refresh` | ✔ (cần refreshToken hợp lệ) | ✔ | ✔ |
| `POST /auth/logout` | ✘ | ✔ | ✔ |
| `GET /users/me` | ✘ | ✔ | ✔ |
| `PATCH /users/me` | ✘ | ✔ | ✔ |
| `GET /users/me/preferences` | ✘ | ✔ | ✔ |
| `PUT /users/me/preferences` | ✘ | ✔ | ✔ |
| `POST /birth-profiles` | ✘ | ✔ | ✔ |
| `GET /birth-profiles` | ✘ | ✔ | ✔ |
| `GET /birth-profiles/{id}` | ✘ | ✔ (chỉ sở hữu) | ✔ (chỉ sở hữu) |
| `PATCH /birth-profiles/{id}` | ✘ | ✔ (chỉ sở hữu) | ✔ (chỉ sở hữu) |
| `DELETE /birth-profiles/{id}` | ✘ | ✔ (chỉ sở hữu) | ✔ (chỉ sở hữu) |
| `POST /charts/natal` (save=false) | ✔ | ✔ | ✔ |
| `POST /charts/natal` (save=true) | ✘ | ✔ | ✔ |
| `GET /charts/{id}` | ✘* | ✔ (chỉ sở hữu) | ✔ (chỉ sở hữu) |
| `GET /charts` | ✘ | ✔ | ✔ |
| `DELETE /charts/{id}` | ✘ | ✔ (chỉ sở hữu) | ✔ (chỉ sở hữu) |
| `GET /articles` | ✔ | ✔ | ✔ |
| `GET /articles/{slug}` | ✔ | ✔ | ✔ |
| `POST /admin/articles` | ✘ | ✘ | ✔ |
| `PATCH /admin/articles/{id}` | ✘ | ✘ | ✔ |
| `DELETE /admin/articles/{id}` | ✘ | ✘ | ✔ |
| `GET /locations/search` | ✔ | ✔ | ✔ |
| `GET /languages` | ✔ | ✔ | ✔ |
| `GET /house-systems` | ✔ | ✔ | ✔ |

*\* `GET /charts/{id}` yêu cầu đăng nhập vì Chart đã lưu (`save=true`) luôn gắn với 1 user — Guest không có Chart nào để lấy theo `id` vì kết quả `save=false` không được persist (xem Mục 4.4).*

> **Lưu ý (Quyết định 14.1/14.9):** Không còn endpoint `GET /charts/{chartId}/interpretations` riêng — `Interpretation` **luôn được nhúng sẵn** trong `ChartResponse` (field `interpretations`, xem Mục 5.4), áp dụng cho cả Chart đã lưu lẫn Chart tạm thời (`save=false`). Server tự quyết định nguồn sinh nội dung, client không truyền/nhận `contentSource`.

---

## 3. API Resources

| Resource | Base Path | Mô tả | Nguồn Domain |
|---|---|---|---|
| Authentication | `/auth` | Đăng ký, đăng nhập, refresh, logout | *(Identity/Account — ngoài phạm vi Domain Spec, xem Mục 14.2)* |
| Users | `/users` | Thông tin & tùy chọn tài khoản | UserPreferences (Domain Spec 5.14) |
| BirthProfiles | `/birth-profiles` | Hồ sơ sinh đã lưu (tên, ngày/giờ/nơi sinh) — nhiều BirthProfile / 1 User | BirthData, BirthLocation (Domain Spec 5.1, 5.2) |
| Charts | `/charts` | Kết quả tính toán lá số (Natal Chart), **bao gồm luôn Interpretation nhúng kèm** (Quyết định 14.1/14.9 — không phải resource riêng) | Chart, Planet, House, Angle, Aspect, Pattern, Interpretation (Domain Spec 5.3–5.13) |
| Articles | `/articles`, `/admin/articles` | Thư viện kiến thức chiêm tinh | *(Content/CMS — mở rộng ngoài Domain Spec cốt lõi, xem Mục 14.6)* |
| Locations | `/locations` | Tra cứu địa danh → tọa độ + timezone | Geolocation (Domain Spec 5.2) |
| Languages | `/languages` | Danh sách ngôn ngữ hỗ trợ | Language (Domain Spec 5.15) |
| HouseSystems | `/house-systems` | Danh sách hệ thống nhà hỗ trợ | HouseSystem (Domain Spec 5.9) |

---

## 4. Endpoint Specification

### 4.1 Authentication

#### `POST /api/v1/auth/register`

| Field | Value |
|---|---|
| **Purpose** | Tạo tài khoản người dùng mới |
| **Auth** | Guest |
| **Headers** | `Content-Type: application/json` |
| **Path Params** | — |
| **Query Params** | — |
| **Request Body** | `RegisterRequest` (Mục 5) |
| **Validation** | `email` đúng định dạng RFC 5322, chưa tồn tại; `password` ≥ 8 ký tự, có ít nhất 1 chữ số |
| **Success Response** | `201 Created` — body `AuthResponse` |
| **Error Response** | `400` (dữ liệu không hợp lệ), `409` (email đã tồn tại) |
| **Business Rules** | *(Website Business Rule — ngoài Domain Spec)* Email phải unique toàn hệ thống |
| **Notes** | Đăng nhập qua Google OAuth (PRD Mục 4.2) nằm ngoài phạm vi tài liệu này — chi tiết xem **Identity Service Specification** (tài liệu tương lai, xem Mục 14.7) |

#### `POST /api/v1/auth/login`

| Field | Value |
|---|---|
| **Purpose** | Đăng nhập, cấp accessToken + refreshToken |
| **Auth** | Guest |
| **Request Body** | `LoginRequest { email, password }` |
| **Validation** | `email`, `password` bắt buộc |
| **Success Response** | `200 OK` — `AuthResponse` |
| **Error Response** | `400`, `401` (sai email/mật khẩu) |
| **Business Rules** | Không tiết lộ email có tồn tại hay không trong message lỗi (chống user enumeration) — trả chung `401 INVALID_CREDENTIALS` |
| **Notes** | — |

#### `POST /api/v1/auth/refresh`

| Field | Value |
|---|---|
| **Purpose** | Cấp accessToken mới từ refreshToken hợp lệ |
| **Auth** | Guest (nhưng cần refreshToken hợp lệ trong body/cookie) |
| **Request Body** | `RefreshRequest { refreshToken }` |
| **Success Response** | `200 OK` — `AuthResponse` (refreshToken mới do rotation) |
| **Error Response** | `401` (refreshToken hết hạn/không hợp lệ/đã bị revoke) |
| **Business Rules** | Refresh Token Rotation bắt buộc (Mục 2.3) |

#### `POST /api/v1/auth/logout`

| Field | Value |
|---|---|
| **Purpose** | Vô hiệu hóa refreshToken hiện tại |
| **Auth** | User, Admin |
| **Headers** | `Authorization: Bearer <accessToken>` |
| **Success Response** | `204 No Content` |
| **Error Response** | `401` |

---

### 4.2 Users

#### `GET /api/v1/users/me`

| Field | Value |
|---|---|
| **Purpose** | Lấy thông tin tài khoản hiện tại |
| **Auth** | User, Admin |
| **Success Response** | `200 OK` — `UserResponse` |
| **Error Response** | `401` |

#### `PATCH /api/v1/users/me`

| Field | Value |
|---|---|
| **Purpose** | Cập nhật thông tin cơ bản (tên hiển thị) |
| **Auth** | User, Admin |
| **Request Body** | `UpdateUserRequest { displayName? }` |
| **Validation** | `displayName` 1–100 ký tự nếu có |
| **Success Response** | `200 OK` — `UserResponse` |
| **Error Response** | `400`, `401` |

#### `GET /api/v1/users/me/preferences`

| Field | Value |
|---|---|
| **Purpose** | Lấy `UserPreferences` (Domain Spec 5.14) |
| **Auth** | User, Admin |
| **Success Response** | `200 OK` — `UserPreferencesResponse` |
| **Error Response** | `401` |

#### `PUT /api/v1/users/me/preferences`

| Field | Value |
|---|---|
| **Purpose** | Cập nhật toàn bộ Preferences (thay thế, không phải merge từng phần — dùng PUT đúng ngữ nghĩa idempotent) |
| **Auth** | User, Admin |
| **Request Body** | `UpdateUserPreferencesRequest { defaultHouseSystem, preferredLanguage, showRetrogradeWarnings, interpretationTone }` |
| **Validation** | `defaultHouseSystem` ∈ danh sách `/house-systems`; `preferredLanguage` ∈ danh sách `/languages` (Domain Spec 5.14 Validation Rules) |
| **Success Response** | `200 OK` — `UserPreferencesResponse` |
| **Error Response** | `400`, `401`, `422` (giá trị không nằm trong danh sách hỗ trợ) |
| **Business Rules** | *(Website Business Rule)* Preferences **không được** ảnh hưởng đến kết quả tính toán khách quan của Chart — đúng theo Domain Spec 5.14, chỉ ảnh hưởng cách trình bày mặc định |

---

### 4.3 BirthProfiles

> **BirthProfile** là resource **lưu trữ** `BirthData` + `BirthLocation` có đặt tên (ví dụ "Bản thân", "Người yêu"), tương ứng PRD FR-10/FR-11 ("lưu nhiều lá số... bản thân, người thân, bạn bè"). Đây là resource **tách biệt** khỏi `Chart` — một BirthProfile có thể được dùng để tính lại Chart nhiều lần (ví dụ khi Engine version cập nhật).

#### `POST /api/v1/birth-profiles`

| Field | Value |
|---|---|
| **Purpose** | Tạo một hồ sơ sinh mới để lưu và tái sử dụng |
| **Auth** | User, Admin |
| **Request Body** | `CreateBirthProfileRequest` (Mục 5) |
| **Validation** | Xem Mục 6 — kế thừa nguyên vẹn Validation Rules của `BirthData`/`BirthLocation` (Domain Spec Mục 7) |
| **Success Response** | `201 Created` — `BirthProfileResponse` |
| **Error Response** | `400`, `401`, `422` |
| **Business Rules** | Astrological: nếu `isBirthTimeKnown=false`, `birthTime` phải là `null` (Domain Spec 5.1) |
| **Notes** | Endpoint này **không** tính toán Chart — chỉ lưu dữ liệu đầu vào. Muốn xem lá số, gọi tiếp `POST /charts/natal` với `birthProfileId` |

#### `GET /api/v1/birth-profiles`

| Field | Value |
|---|---|
| **Purpose** | Liệt kê các hồ sơ sinh đã lưu của user hiện tại |
| **Auth** | User, Admin |
| **Query Params** | `page`, `pageSize`, `sortBy` (`createdAt`\|`fullName`), `order` (`asc`\|`desc`) — xem Mục 8 |
| **Success Response** | `200 OK` — `PaginatedResponse<BirthProfileResponse>` |
| **Error Response** | `401` |

#### `GET /api/v1/birth-profiles/{id}`

| Field | Value |
|---|---|
| **Purpose** | Xem chi tiết 1 hồ sơ sinh |
| **Auth** | User, Admin (chỉ chủ sở hữu) |
| **Path Params** | `id` (UUID) |
| **Success Response** | `200 OK` — `BirthProfileResponse` |
| **Error Response** | `401`, `403` (không phải chủ sở hữu), `404` |

#### `PATCH /api/v1/birth-profiles/{id}`

| Field | Value |
|---|---|
| **Purpose** | Cập nhật một phần thông tin hồ sơ sinh (ví dụ đổi tên) |
| **Auth** | User, Admin (chỉ chủ sở hữu) |
| **Request Body** | `UpdateBirthProfileRequest` (partial, mọi field optional) |
| **Success Response** | `200 OK` — `BirthProfileResponse` |
| **Error Response** | `400`, `401`, `403`, `404`, `422` |
| **Business Rules** | Nếu thay đổi `birthDate`/`birthTime`/`birthLocation`, mọi `Chart` đã tính trước đó **không bị ảnh hưởng** — client cần gọi lại `POST /charts/natal` để có Chart mới. Điều này luôn đúng vì `Chart` lưu **snapshot** dữ liệu độc lập tại thời điểm tính, không tham chiếu runtime tới `BirthProfile` (Quyết định 14.8) |

#### `DELETE /api/v1/birth-profiles/{id}`

| Field | Value |
|---|---|
| **Purpose** | Xóa một hồ sơ sinh |
| **Auth** | User, Admin (chỉ chủ sở hữu) |
| **Success Response** | `204 No Content` |
| **Error Response** | `401`, `403`, `404` |
| **Business Rules** | **Đã chốt (Quyết định 14.8):** Đây là **soft delete** — BirthProfile bị đánh dấu đã xóa (ẩn khỏi `GET /birth-profiles`) nhưng **không cascade xóa** các `Chart` đã lưu liên quan, vì `Chart` là snapshot độc lập, không phụ thuộc runtime vào BirthProfile gốc |

---

### 4.4 Charts

#### `POST /api/v1/charts/natal`

| Field | Value |
|---|---|
| **Purpose** | Tính toán một Natal Chart mới thông qua Astrology Engine (Engine Spec Mục 4) |
| **Auth** | **Guest** (nếu `save=false`) hoặc **User/Admin** (nếu `save=true`) |
| **Headers** | `Content-Type: application/json` |
| **Query Params** | `save` (boolean, default `false`) |
| **Request Body** | `CreateNatalChartRequest` (Mục 5) — có thể chứa `birthProfileId` (tham chiếu hồ sơ đã lưu) **hoặc** `birthData` inline (tính nhanh không cần lưu hồ sơ trước) |
| **Validation** | Kế thừa toàn bộ Validation Rules ở Engine Spec Mục 4.3 / Domain Spec Mục 7 |
| **Success Response** | `201 Created` nếu `save=true` (Chart được persist, có `id` cố định); `200 OK` nếu `save=false` (Chart tạm thời, `id` là transient/không dùng để GET lại sau này). Response luôn kèm `interpretations` nhúng sẵn (Quyết định 14.1/14.9) |
| **Error Response** | `400` (thiếu field), `401` (guest cố `save=true`), `422` (dữ liệu không hợp lệ theo Engine — ví dụ `houseSystem` không được hỗ trợ) |
| **Business Rules** | Nếu `isBirthTimeKnown=false` → response `houses: []`, `angles: []`, `isHouseDataAvailable: false` theo đúng Engine Spec Mục 5 bước 6–7 — **API không được tự chế dữ liệu House/Angle** khi Engine trả rỗng |
| **Notes** | Đây là endpoint "lõi" nhất của toàn hệ thống — mọi UI hiển thị lá số đều bắt nguồn từ đây. **Idempotency (Quyết định 14.5):** ở v1, gọi lại nhiều lần với `save=true` và cùng input **có thể tạo nhiều bản ghi Chart trùng nội dung** — đây là hành vi chấp nhận được cho MVP. Header `Idempotency-Key` (dedup theo key) được để dành cho v1.1/v2, chưa triển khai ở v1 |

#### `GET /api/v1/charts/{id}`

| Field | Value |
|---|---|
| **Purpose** | Lấy lại một Chart đã lưu trước đó |
| **Auth** | User, Admin (chỉ chủ sở hữu) |
| **Path Params** | `id` (UUID) |
| **Success Response** | `200 OK` — `ChartResponse` |
| **Error Response** | `401`, `403`, `404` |
| **Notes** | Chỉ áp dụng cho Chart có `save=true` khi tạo — Chart transient (`save=false`) không thể GET lại (đúng nguyên tắc Engine stateless, không có gì để tra cứu) |

#### `GET /api/v1/charts`

| Field | Value |
|---|---|
| **Purpose** | Liệt kê các Chart đã lưu của user hiện tại |
| **Auth** | User, Admin |
| **Query Params** | `page`, `pageSize`, `birthProfileId` (filter theo hồ sơ sinh), `sortBy` (`calculatedAt`), `order` |
| **Success Response** | `200 OK` — `PaginatedResponse<ChartSummaryResponse>` (dạng rút gọn, không kèm toàn bộ planets/aspects để tối ưu payload — xem `ChartSummaryResponse` ở Mục 5) |
| **Error Response** | `401` |

#### `DELETE /api/v1/charts/{id}`

| Field | Value |
|---|---|
| **Purpose** | Xóa một Chart đã lưu |
| **Auth** | User, Admin (chỉ chủ sở hữu) |
| **Success Response** | `204 No Content` |
| **Error Response** | `401`, `403`, `404` |

---

> **Ghi chú (Quyết định 14.1/14.9):** Mục "Interpretations" như một endpoint riêng đã được **loại bỏ**. `Interpretation` (Engine Spec Mục 6.11) nay được nhúng trực tiếp vào field `interpretations` của `ChartResponse` — trả về đồng thời trong `POST /charts/natal` (cả `save=true` và `save=false`) và `GET /charts/{id}`. Business rule cốt lõi vẫn giữ nguyên: nếu `chart.isHouseDataAvailable = false`, mảng `interpretations` **không được chứa** phần tử loại `PlanetInHouse` hay `Angle` (Domain Spec Mục 6, Engine Spec Mục 6.11).

### 4.5 Articles (Thư viện kiến thức)

#### `GET /api/v1/articles`

| Field | Value |
|---|---|
| **Purpose** | Liệt kê bài viết trong thư viện kiến thức (PRD FR-12) |
| **Auth** | Guest, User, Admin |
| **Query Params** | `page`, `pageSize`, `category` (`Planet`\|`Sign`\|`House`\|`Aspect`\|`Basics`), `search` (tìm theo tiêu đề) |
| **Success Response** | `200 OK` — `PaginatedResponse<ArticleSummaryResponse>` |
| **Error Response** | — |

#### `GET /api/v1/articles/{slug}`

| Field | Value |
|---|---|
| **Purpose** | Xem chi tiết 1 bài viết (PRD FR-13) |
| **Auth** | Guest, User, Admin |
| **Path Params** | `slug` (string, SEO-friendly, ví dụ `sao-kim-trong-cung-su-tu`) |
| **Success Response** | `200 OK` — `ArticleDetailResponse` |
| **Error Response** | `404` |

#### `POST /api/v1/admin/articles`

| Field | Value |
|---|---|
| **Purpose** | Tạo bài viết mới (PRD FR-14) |
| **Auth** | **Admin only** |
| **Request Body** | `CreateArticleRequest` |
| **Validation** | `title` bắt buộc 1–200 ký tự; `slug` unique; `body` bắt buộc |
| **Success Response** | `201 Created` — `ArticleDetailResponse` |
| **Error Response** | `400`, `401`, `403` (không phải Admin), `409` (slug trùng) |

#### `PATCH /api/v1/admin/articles/{id}`

| Field | Value |
|---|---|
| **Purpose** | Cập nhật bài viết |
| **Auth** | Admin only |
| **Success Response** | `200 OK` — `ArticleDetailResponse` |
| **Error Response** | `400`, `401`, `403`, `404` |

#### `DELETE /api/v1/admin/articles/{id}`

| Field | Value |
|---|---|
| **Purpose** | Xóa bài viết |
| **Auth** | Admin only |
| **Success Response** | `204 No Content` |
| **Error Response** | `401`, `403`, `404` |

---

### 4.6 Locations

#### `GET /api/v1/locations/search`

| Field | Value |
|---|---|
| **Purpose** | Tra cứu địa danh (autocomplete) → trả về tọa độ + timezone lịch sử **chính xác theo thời điểm sinh**, phục vụ form nhập nơi sinh (PRD FR-01) |
| **Auth** | Guest, User, Admin |
| **Query Params** | `q` (bắt buộc, chuỗi tìm kiếm, tối thiểu 2 ký tự); `date` (bắt buộc, ISO-8601 `YYYY-MM-DD` — **Quyết định 14.10**: dùng để resolve đúng `historicalTimezoneId` tại thời điểm đó, vì múi giờ 1 địa danh có thể thay đổi theo lịch sử) |
| **Success Response** | `200 OK` — `list<LocationSuggestionResponse>` |
| **Error Response** | `400` (thiếu `q`/`date` hoặc `q` quá ngắn) |
| **Business Rules** | Đây là proxy tới Geolocation service ngoài (Domain Spec 5.2) — API layer **không tự tính toán** tọa độ, chỉ format lại kết quả. `historicalTimezoneId` phải phản ánh đúng múi giờ tại `date` được truyền, không phải múi giờ hiện tại của địa danh |
| **Notes** | Client (form nhập ngày sinh) nên gọi lại endpoint này mỗi khi người dùng đổi `birthDate`, vì `date` ảnh hưởng trực tiếp đến `historicalTimezoneId` trả về |

---

### 4.7 Reference Data (Languages, HouseSystems)

#### `GET /api/v1/languages`

| Field | Value |
|---|---|
| **Purpose** | Danh sách ngôn ngữ hệ thống hỗ trợ (Domain Spec 5.15) |
| **Auth** | Guest, User, Admin |
| **Success Response** | `200 OK` — `list<LanguageResponse>` |

#### `GET /api/v1/house-systems`

| Field | Value |
|---|---|
| **Purpose** | Danh sách hệ thống nhà hỗ trợ (Domain Spec 5.9) |
| **Auth** | Guest, User, Admin |
| **Success Response** | `200 OK` — `list<HouseSystemResponse>` |

---

## 5. Request / Response Models

> Field naming: camelCase. `?` sau tên field = optional/nullable trong request. Tất cả timestamp là ISO-8601 UTC.

### 5.1 Authentication DTOs

**`RegisterRequest`**

| Field | Type | Required | Nullable | Description | Example |
|---|---|---|---|---|---|
| email | string | ✔ | ✘ | Email đăng ký | `"linh@example.com"` |
| password | string | ✔ | ✘ | Mật khẩu thô (server hash trước khi lưu) | `"Abcd1234"` |
| displayName | string | ✘ | ✘ | Tên hiển thị | `"Linh"` |

**`AuthResponse`**

| Field | Type | Required | Nullable | Description |
|---|---|---|---|---|
| accessToken | string | ✔ | ✘ | JWT, hết hạn sau 15 phút |
| refreshToken | string | ✔ | ✘ | Token dùng để refresh |
| expiresIn | integer | ✔ | ✘ | Số giây accessToken còn hiệu lực |
| user | UserResponse | ✔ | ✘ | Thông tin user |

### 5.2 User DTOs

**`UserResponse`**

| Field | Type | Required | Nullable | Description |
|---|---|---|---|---|
| id | UUID | ✔ | ✘ | — |
| email | string | ✔ | ✘ | — |
| displayName | string | ✘ | ✔ | — |
| role | enum(`user`,`admin`) | ✔ | ✘ | Xem Mục 14.2 |
| createdAt | datetime | ✔ | ✘ | — |

**`UserPreferencesResponse`**

| Field | Type | Required | Nullable | Description | Example |
|---|---|---|---|---|---|
| defaultHouseSystem | string | ✔ | ✘ | Domain Spec 5.9 | `"Placidus"` |
| preferredLanguage | string | ✔ | ✘ | ISO 639-1 | `"vi"` |
| showRetrogradeWarnings | boolean | ✔ | ✘ | — | `true` |
| interpretationTone | string | ✘ | ✔ | Domain Spec 5.13 `tone` | `"Encouraging"` |

### 5.3 BirthProfile DTOs

**`CreateBirthProfileRequest`**

| Field | Type | Required | Nullable | Description | Example |
|---|---|---|---|---|---|
| label | string | ✔ | ✘ | Tên gợi nhớ hồ sơ (khác `fullName` — dùng để phân biệt trong danh sách, ví dụ "Người yêu") | `"Bản thân"` |
| fullName | string | ✘ | ✔ | Domain Spec `BirthData.fullName` | `"Nguyễn Thị Linh"` |
| birthDate | date | ✔ | ✘ | ISO-8601 `YYYY-MM-DD` | `"2000-05-14"` |
| birthTime | time | ✘ | ✔ | ISO-8601 `HH:mm:ss`, bắt buộc `null` nếu `isBirthTimeKnown=false` | `"14:30:00"` |
| isBirthTimeKnown | boolean | ✔ | ✘ | — | `true` |
| birthLocation | `BirthLocationInput` | ✔ | ✘ | — | — |

**`BirthLocationInput`**

| Field | Type | Required | Nullable | Description | Example |
|---|---|---|---|---|---|
| placeName | string | ✔ | ✘ | — | `"Đà Lạt, Lâm Đồng, Việt Nam"` |
| latitude | decimal | ✔ | ✘ | -90..90 | `11.9404` |
| longitude | decimal | ✔ | ✘ | -180..180 | `108.4419` |
| historicalTimezoneId | string | ✔ | ✘ | IANA timezone | `"Asia/Ho_Chi_Minh"` |

> **Nguồn gốc field này:** `latitude`/`longitude`/`historicalTimezoneId` được lấy từ response của `GET /locations/search` — client không tự nhập tay tọa độ.

**`BirthProfileResponse`** — gồm toàn bộ field của `CreateBirthProfileRequest` + `id`, `userId`, `createdAt`, `updatedAt`, `warnings` (list\<Warning\>, ví dụ `HISTORICAL_DATE` nếu `birthDate` rất xa quá khứ — Quyết định 14.11, xem Mục 5.8).

### 5.4 Chart DTOs

**`CreateNatalChartRequest`**

| Field | Type | Required | Nullable | Description | Example |
|---|---|---|---|---|---|
| birthProfileId | UUID | ✘* | ✘ | Dùng hồ sơ đã lưu (loại trừ với `birthData`) | — |
| birthData | `CreateBirthProfileRequest`-like (inline, không có `label`) | ✘* | ✘ | Tính nhanh không cần lưu hồ sơ trước (loại trừ với `birthProfileId`) | — |
| houseSystem | string | ✔ | ✘ | `Placidus` \| `WholeSign` | `"Placidus"` |
| includeOptionalPoints | list\<string\> | ✘ | ✘ | `Chiron`,`Lilith`,`NorthNode`,`SouthNode` | `["Chiron"]` |

*\* Bắt buộc chọn đúng 1 trong 2: `birthProfileId` HOẶC `birthData` — vi phạm → `422 EXACTLY_ONE_SOURCE_REQUIRED`.*

**`ChartResponse`**

| Field | Type | Required | Nullable | Description |
|---|---|---|---|---|
| id | UUID | ✔ | ✘ | `null`-equivalent nếu `save=false` (transient — xem Mục 14.5) |
| chartType | string | ✔ | ✘ | `"Natal"` (v1 chỉ có giá trị này) |
| houseSystem | string | ✔ | ✘ | — |
| isHouseDataAvailable | boolean | ✔ | ✘ | — |
| planets | list\<PlanetResponse\> | ✔ | ✘ | Tối thiểu 10 phần tử |
| houses | list\<HouseResponse\> | ✔ | ✘ | Rỗng nếu `isHouseDataAvailable=false` |
| angles | list\<AngleResponse\> | ✔ | ✘ | Rỗng nếu `isHouseDataAvailable=false` |
| aspects | list\<AspectResponse\> | ✔ | ✘ | — |
| patterns | list\<PatternResponse\> | ✔ | ✘ | — |
| interpretations | list\<InterpretationResponse\> | ✔ | ✘ | Nhúng sẵn (Quyết định 14.1/14.9) — không phải endpoint riêng. Nếu `isHouseDataAvailable=false`, không chứa phần tử `PlanetInHouse`/`Angle` |
| warnings | list\<Warning\> | ✔ | ✘ | Mảng rỗng nếu không có cảnh báo. Xem cấu trúc `Warning` ở Mục 5.8 (Quyết định 14.12) |
| calculatedAt | datetime | ✔ | ✘ | — |
| engineVersion | string | ✔ | ✘ | — |

**`PlanetResponse`**

| Field | Type | Required | Nullable | Example |
|---|---|---|---|---|
| name | string | ✔ | ✘ | `"Venus"` |
| category | string | ✔ | ✘ | `"Personal"` |
| longitude | decimal | ✔ | ✘ | `135.42` |
| speed | decimal | ✔ | ✘ | `-0.12` |
| isRetrograde | boolean | ✔ | ✘ | `true` |
| sign | string | ✔ | ✘ | `"Leo"` |
| degreeInSign | decimal | ✔ | ✘ | `15.42` |
| house | integer | ✘ | ✔ | `10` (null nếu `isHouseDataAvailable=false`) |

**`HouseResponse`**

| Field | Type | Required | Nullable |
|---|---|---|---|
| number | integer | ✔ | ✘ |
| cuspDegree | decimal | ✔ | ✘ |
| signOnCusp | string | ✔ | ✘ |

**`AngleResponse`**

| Field | Type | Required | Nullable |
|---|---|---|---|
| type | string (`Ascendant`\|`Midheaven`\|`Descendant`\|`ImumCoeli`) | ✔ | ✘ |
| longitude | decimal | ✔ | ✘ |
| sign | string | ✔ | ✘ |
| degreeInSign | decimal | ✔ | ✘ |

**`AspectResponse`**

| Field | Type | Required | Nullable |
|---|---|---|---|
| planetA | string | ✔ | ✘ |
| planetB | string | ✔ | ✘ |
| aspectType | string | ✔ | ✘ |
| exactAngle | decimal | ✔ | ✘ |
| orb | decimal | ✔ | ✘ |
| isApplying | boolean | ✔ | ✘ |
| nature | string (`Harmonious`\|`Challenging`\|`Neutral`) | ✔ | ✘ |

**`PatternResponse`**

| Field | Type | Required | Nullable |
|---|---|---|---|
| patternType | string | ✔ | ✘ |
| involvedPlanets | list\<string\> | ✔ | ✘ |

**`ChartSummaryResponse`** (dùng cho `GET /charts` — rút gọn payload)

| Field | Type | Description |
|---|---|---|
| id | UUID | — |
| birthProfileId | UUID | — |
| birthProfileLabel | string | Denormalized để tránh N+1 lookup phía client |
| houseSystem | string | — |
| calculatedAt | datetime | — |

### 5.5 Interpretation DTOs

**`InterpretationResponse`**

> **Quyết định 14.1:** API v1 **không expose** `contentSource` — server tự quyết định nội bộ cách sinh nội dung (human-authored, AI, hoặc hybrid); client chỉ nhận về văn bản đã hoàn thiện.

| Field | Type | Required | Nullable | Example |
|---|---|---|---|---|
| subjectType | string | ✔ | ✘ | `"PlanetInSign"` |
| subjectKey | string | ✔ | ✘ | `"Venus_in_Leo"` |
| language | string | ✔ | ✘ | `"vi"` |
| bodyText | string | ✔ | ✘ | — |
| tone | string | ✘ | ✔ | `"Encouraging"` |

### 5.6 Article DTOs

**`ArticleSummaryResponse`**

| Field | Type | Required | Nullable |
|---|---|---|---|
| id | UUID | ✔ | ✘ |
| slug | string | ✔ | ✘ |
| title | string | ✔ | ✘ |
| category | string | ✔ | ✘ |
| excerpt | string | ✘ | ✔ |
| publishedAt | datetime | ✔ | ✘ |

**`ArticleDetailResponse`** — kế thừa toàn bộ field của `ArticleSummaryResponse` + `body` (string, rich-text/markdown).

**`CreateArticleRequest`**

| Field | Type | Required | Nullable |
|---|---|---|---|
| title | string | ✔ | ✘ |
| slug | string | ✔ | ✘ |
| category | string | ✔ | ✘ |
| body | string | ✔ | ✘ |
| excerpt | string | ✘ | ✔ |

### 5.7 Location / Reference DTOs

**`LocationSuggestionResponse`**

| Field | Type | Required | Nullable | Example |
|---|---|---|---|---|
| placeName | string | ✔ | ✘ | `"Đà Lạt, Lâm Đồng, Việt Nam"` |
| latitude | decimal | ✔ | ✘ | `11.9404` |
| longitude | decimal | ✔ | ✘ | `108.4419` |
| historicalTimezoneId | string | ✔ | ✘ | `"Asia/Ho_Chi_Minh"` |

**`LanguageResponse`**: `code`, `displayName`, `isDefault`.

**`HouseSystemResponse`**: `name`, `requiresPreciseBirthTime`, `supportsPolarLatitudes`.

### 5.8 Shared DTOs

**`PaginationResponse<T>`** (envelope chuẩn cho mọi list endpoint)

| Field | Type | Description |
|---|---|---|
| data | list\<T\> | Dữ liệu trang hiện tại |
| pagination.page | integer | Trang hiện tại (bắt đầu từ 1) |
| pagination.pageSize | integer | Số phần tử / trang |
| pagination.totalItems | integer | Tổng số phần tử |
| pagination.totalPages | integer | Tổng số trang |

**`ProblemDetails`** — xem Mục 7.

**`Warning`** (Quyết định 14.12 — dùng trong `ChartResponse.warnings` và tương tự ở nơi khác cần cảnh báo mềm, không phải lỗi chặn request)

| Field | Type | Required | Nullable | Description | Example |
|---|---|---|---|---|---|
| code | string | ✔ | ✘ | Mã cảnh báo, dạng SCREAMING_SNAKE_CASE | `"HOUSE_SYSTEM_NOT_CONVERGING"` |
| message | string | ✔ | ✘ | Thông điệp dễ hiểu, có thể hiển thị trực tiếp cho người dùng | `"Không thể tính Houses với hệ Placidus tại vĩ độ này."` |
| severity | enum(`info`,`warning`) | ✔ | ✘ | Mức độ nghiêm trọng | `"warning"` |
| field | string | ✘ | ✔ | Field liên quan (nếu cảnh báo gắn với 1 field cụ thể) | `"houseSystem"` |
| details | object | ✘ | ✔ | Dữ liệu bổ sung tùy loại cảnh báo (cấu trúc tự do theo `code`) | `{}` |

Ví dụ trong `ChartResponse`:
```json
"warnings": [
  {
    "code": "HOUSE_SYSTEM_NOT_CONVERGING",
    "message": "Không thể tính Houses với hệ Placidus tại vĩ độ này.",
    "severity": "warning",
    "field": "houseSystem"
  }
]
```
Ví dụ trong `BirthProfileResponse`/`CreateNatalChartRequest` khi ngày sinh rất xa quá khứ (Quyết định 14.11):
```json
"warnings": [
  {
    "code": "HISTORICAL_DATE",
    "message": "Ngày sinh rất xa trong quá khứ. Hãy kiểm tra lại nếu đây không phải dữ liệu của nhân vật lịch sử.",
    "severity": "info",
    "field": "birthDate"
  }
]
```

---

## 6. Validation Rules

| Field | Required | Format | Range | Default Value | Nguồn |
|---|---|---|---|---|---|
| `birthDate` | ✔ | ISO-8601 `YYYY-MM-DD` | Chỉ bắt buộc `birthDate < ngày hiện tại` — **không có biên dưới cứng** (Quyết định 14.11). Nếu ngày quá xa quá khứ, trả `warnings[].code = "HISTORICAL_DATE"` thay vì lỗi chặn request | — | Domain Spec 5.1 |
| `birthTime` | ✘ (bắt buộc nếu `isBirthTimeKnown=true`) | ISO-8601 `HH:mm:ss` | `00:00:00`–`23:59:59` | `null` | Domain Spec 5.1 |
| `isBirthTimeKnown` | ✔ | boolean | — | — | Domain Spec 5.1 |
| `houseSystem` | ✔ (khi tạo Chart) | enum string | `Placidus` \| `WholeSign` | — | Domain Spec 5.9 |
| `latitude` | ✔ | decimal | [-90, 90] | — | Domain Spec 5.2 |
| `longitude` | ✔ | decimal | [-180, 180] | — | Domain Spec 5.2 |
| `historicalTimezoneId` | ✔ | IANA timezone string | Phải tồn tại trong IANA tzdb | — | Domain Spec 5.2 |
| `email` | ✔ | RFC 5322 | ≤ 254 ký tự | — | *(Business rule — Identity)* |
| `password` | ✔ | string | ≥ 8 ký tự, ≥1 chữ số | — | *(Business rule — Identity)* |
| `label` (BirthProfile) | ✔ | string | 1–100 ký tự | — | *(Business rule — application)* |
| `page` | ✘ | integer | ≥ 1 | `1` | — |
| `pageSize` | ✘ | integer | 1–100 | `20` | — |

> **Nguyên tắc:** Bảng này chỉ **ánh xạ lại** validation rule đã có ở Domain Specification Mục 7 sang định dạng HTTP-level (cùng field, cùng ràng buộc) — **không tạo thêm rule chiêm tinh mới** ở tầng API.

---

## 7. Error Handling

Toàn bộ lỗi trả về theo chuẩn **RFC 7807 Problem Details**, `Content-Type: application/problem+json`:

```json
{
  "type": "https://api.astroviet.vn/errors/validation-error",
  "title": "Validation Failed",
  "status": 422,
  "detail": "Trường 'latitude' phải nằm trong khoảng -90 đến 90.",
  "instance": "/api/v1/birth-profiles",
  "errorCode": "INVALID_LATITUDE_RANGE",
  "errors": [
    { "field": "birthLocation.latitude", "message": "Must be between -90 and 90" }
  ]
}
```

| Status | Code (ví dụ) | Message | Description | Possible Cause | Recovery |
|---|---|---|---|---|---|
| **400** | `MALFORMED_REQUEST` | Bad Request | Body không parse được (JSON sai cú pháp) hoặc thiếu field bắt buộc | Client gửi JSON lỗi cú pháp | Kiểm tra lại body theo DTO spec |
| **401** | `UNAUTHORIZED` / `TOKEN_EXPIRED` / `INVALID_CREDENTIALS` | Unauthorized | Thiếu/hết hạn/sai JWT hoặc credentials | Không gửi header `Authorization`, hoặc token hết hạn | Gọi `POST /auth/refresh` hoặc đăng nhập lại |
| **403** | `FORBIDDEN` | Forbidden | Có JWT hợp lệ nhưng không đủ quyền (ví dụ User cố truy cập resource của người khác, hoặc cố gọi endpoint Admin) | Sai role hoặc không phải chủ sở hữu resource | Không thể tự khắc phục — liên hệ hỗ trợ nếu cho là nhầm lẫn |
| **404** | `RESOURCE_NOT_FOUND` | Not Found | Resource với `id` được yêu cầu không tồn tại | Sai `id`, hoặc resource đã bị xóa | Kiểm tra lại `id` |
| **409** | `EMAIL_ALREADY_EXISTS` / `SLUG_ALREADY_EXISTS` | Conflict | Vi phạm ràng buộc unique | Đăng ký email đã tồn tại, tạo Article trùng slug | Dùng giá trị khác |
| **422** | `INVALID_BIRTH_DATE` / `INVALID_LATITUDE_RANGE` / `UNSUPPORTED_HOUSE_SYSTEM` / `EXACTLY_ONE_SOURCE_REQUIRED` | Unprocessable Entity | Dữ liệu đúng format JSON nhưng vi phạm business/domain validation rule (Mục 6) | Sai domain constraint | Sửa theo `errors[]` trong response |
| **429** | `RATE_LIMIT_EXCEEDED` | Too Many Requests | Vượt quá giới hạn request (Mục 9) | Gọi API quá tần suất cho phép | Chờ theo header `Retry-After` |
| **500** | `INTERNAL_SERVER_ERROR` | Internal Server Error | Lỗi không xác định phía server (bao gồm cả `EphemerisProviderError` từ Engine nếu không được xử lý mềm) | Lỗi hạ tầng, lỗi Engine không lường trước | Thử lại sau; nếu lặp lại, báo cáo kèm `instance`/request ID |

> **Trường hợp đặc biệt — House không hội tụ:** Theo Engine Spec Mục 4.4, `HouseSystemNotConvergingError` là **kết quả hợp lệ có cảnh báo**, KHÔNG map sang HTTP error status. API trả `200`/`201` bình thường với `isHouseDataAvailable: false` kèm mảng `warnings` theo cấu trúc `Warning` đã chốt ở Mục 5.8 (Quyết định 14.12): `{ code, message, severity, field?, details? }`.

---

## 8. Pagination, Filtering & Sorting

Áp dụng cho: `GET /birth-profiles`, `GET /charts`, `GET /articles`.

| Query Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Trang hiện tại, bắt đầu từ 1 |
| `pageSize` | integer | `20` | Số phần tử/trang, tối đa `100` |
| `sortBy` | string | tùy resource (ví dụ `createdAt`) | Field dùng để sort |
| `order` | enum(`asc`,`desc`) | `desc` | Chiều sắp xếp |
| `search` | string | — | Tìm kiếm full-text (chỉ áp dụng `articles`) |
| `filter[...]` | — | — | Filter theo field cụ thể (ví dụ `category` cho articles, `birthProfileId` cho charts) |

**Response envelope:** xem `PaginationResponse<T>` ở Mục 5.8.

---

## 9. Rate Limiting

### 9.1 Rate Limit Policy (cấu hình được)

**Quyết định 14.13:** Thay vì hard-code con số, các giới hạn được quản lý như một **Rate Limit Policy** cấu hình qua biến môi trường, cho phép điều chỉnh mà không cần deploy lại code:

| Biến môi trường | Mặc định đề xuất | Đơn vị | Áp dụng theo |
|---|---|---|---|
| `RATE_LIMIT_GUEST` | `30` | requests/phút | IP address |
| `RATE_LIMIT_GUEST_DAILY` | `200` | requests/ngày | IP address |
| `RATE_LIMIT_USER` | `300` | requests/phút | Account (`userId`) |
| `RATE_LIMIT_USER_DAILY` | `2000` | requests/ngày | Account (`userId`) |
| `RATE_LIMIT_ADMIN` | `600` | requests/phút | Account (`userId`) |
| `RATE_LIMIT_ADMIN_DAILY` | `5000` | requests/ngày | Account (`userId`) |

### 9.2 Bảng tổng hợp (giá trị mặc định)

| Cấp độ | Requests / phút | Requests / ngày | Định danh dùng để đếm | Ghi chú |
|---|---|---|---|---|
| Guest | `RATE_LIMIT_GUEST` (30) | `RATE_LIMIT_GUEST_DAILY` (200) | **IP address** | Bao gồm `POST /charts/natal` với `save=false` — endpoint tính toán tốn CPU nên nên cân nhắc policy riêng chặt hơn nếu cần (xem 9.3) |
| User | `RATE_LIMIT_USER` (300) | `RATE_LIMIT_USER_DAILY` (2000) | **Account (`userId`)** | — |
| Admin | `RATE_LIMIT_ADMIN` (600) | `RATE_LIMIT_ADMIN_DAILY` (5000) | **Account (`userId`)** | — |

### 9.3 Ghi chú triển khai
- Đếm theo **IP** cho Guest và theo **`userId`** cho User/Admin (không đếm theo IP khi đã đăng nhập, tránh nhiều user dùng chung mạng — ví dụ NAT công ty — bị giới hạn lẫn nhau).
- Policy có thể **khác nhau theo từng endpoint** trong tương lai (ví dụ `POST /charts/natal` cần policy riêng do tốn CPU hơn `GET /articles`) — kiến trúc rate limiter nên hỗ trợ gắn policy theo route, không chỉ theo role, dù v1 dùng chung 1 policy/role cho đơn giản.

**Headers trả về mỗi response:**
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1752134400
```
Khi vượt giới hạn → `429 Too Many Requests` kèm header `Retry-After: <seconds>`.

> Các giá trị mặc định ở trên (30/300/600 mỗi phút) là khởi điểm hợp lý theo Quyết định 14.13; vì được cấu hình qua biến môi trường, Product Owner có thể điều chỉnh trực tiếp theo tải thực tế mà không cần sửa tài liệu này.

---

## 10. API Lifecycle

### 10.1 Versioning Strategy
- Version nằm trong URL path (`/api/v1/...`).
- Breaking change (đổi field bắt buộc, đổi kiểu dữ liệu, xóa field) → bắt buộc bump version (`/api/v2/...`).
- Non-breaking change (thêm field optional mới, thêm endpoint mới) → không cần bump version.

### 10.2 Deprecation Policy
| Giai đoạn | Hành động |
|---|---|
| Thông báo | Header `Deprecation: true` + `Sunset: <date>` trên response của version cũ, tối thiểu 90 ngày trước khi tắt |
| Song song | Version cũ và mới cùng chạy song song trong giai đoạn chuyển tiếp |
| Tắt hẳn | Version cũ trả `410 Gone` sau ngày Sunset |

### 10.3 Backward Compatibility
- Field mới thêm vào response **luôn optional** đối với client cũ (client cũ có thể bỏ qua field lạ).
- Không đổi ý nghĩa của field đã có (ví dụ không đổi đơn vị `orb` từ độ sang radian mà không bump version).
- Enum values (ví dụ `houseSystem`) chỉ được **thêm**, không được **xóa** giá trị cũ trong cùng 1 major version.

---

## 11. Security Considerations

| Hạng mục | Biện pháp |
|---|---|
| **JWT** | Ký bằng thuật toán bất đối xứng (RS256) khuyến nghị thay vì HS256, để tách biệt service ký token và service verify token trong tương lai |
| **HTTPS** | Bắt buộc TLS cho toàn bộ endpoint, không hỗ trợ HTTP thuần (redirect 301 hoặc từ chối) |
| **CORS** | Whitelist chỉ domain chính thức của Frontend (`https://astroviet.vn`), không dùng `*` cho endpoint có auth |
| **CSRF** | Nếu dùng HttpOnly Cookie cho refreshToken (Mục 2.3), bắt buộc kèm CSRF token hoặc `SameSite=Strict` cookie attribute |
| **XSS** | `Article.body` (rich text do Admin nhập) phải được sanitize phía server trước khi lưu, tránh lưu trữ script độc hại có thể chạy khi client render |
| **Rate Limit** | Xem Mục 9 — áp dụng riêng cho endpoint tốn tài nguyên tính toán (`POST /charts/natal`) |
| **Sensitive Data / PII** | `birthDate`, `birthTime`, `birthLocation` là dữ liệu cá nhân nhạy cảm (Domain Spec Mục 6 NFR Bảo mật) — không log full giá trị này trong access log, mã hóa at-rest nếu hạ tầng cho phép |
| **Input Validation** | Toàn bộ input được validate ở tầng API **trước khi** chuyển vào Engine — Engine chỉ tin tưởng dữ liệu đã qua Validation Module riêng của nó (Engine Spec 6.1), nhưng API vẫn phải validate độc lập để trả lỗi HTTP đúng chuẩn sớm nhất có thể (fail-fast) |

---

## 12. Sequence Diagrams

### 12.1 Login

```
Client                          API Server                    Auth Service
  │  POST /auth/login              │                                │
  ├────────────────────────────────▶│                                │
  │                                 │  verify(email, password)      │
  │                                 ├───────────────────────────────▶│
  │                                 │◀───────────────────────────────┤ valid
  │                                 │  generate accessToken/refreshToken
  │  200 OK {accessToken, ...}      │                                │
  │◀────────────────────────────────┤                                │
```

### 12.2 Create Natal Chart (Guest, không lưu)

```
Client                    API Server                Astrology Engine
  │ POST /charts/natal?save=false   │                        │
  │ {birthData: {...}, houseSystem} │                        │
  ├─────────────────────────────────▶│                        │
  │                                  │  validate request       │
  │                                  │  build(BirthData, opts) │
  │                                  ├────────────────────────▶│
  │                                  │                         │ Core Pipeline
  │                                  │                         │ (Engine Spec Mục 5)
  │                                  │◀────────────────────────┤ Chart
  │                                  │  map Chart → ChartResponse (id = transient UUID, không persist)
  │  200 OK {ChartResponse}          │                        │
  │◀─────────────────────────────────┤                        │
```

### 12.3 Create & Save Natal Chart (User đã đăng nhập)

```
Client              API Server         Astrology Engine        Database
  │ POST /charts/natal?save=true       │                          │
  │ Authorization: Bearer <token>      │                          │
  │ {birthProfileId, houseSystem}      │                          │
  ├────────────────────────────────────▶│                          │
  │                                     │ verify JWT               │
  │                                     │ load BirthProfile         │
  │                                     ├──────────────────────────▶│
  │                                     │◀──────────────────────────┤ BirthData
  │                                     │ build(BirthData, opts)    │
  │                                     ├─────────▶ Engine          │
  │                                     │◀───────── Chart           │
  │                                     │ persist Chart              │
  │                                     ├──────────────────────────▶│
  │                                     │◀──────────────────────────┤ saved (id)
  │  201 Created {ChartResponse, id}   │                          │
  │◀─────────────────────────────────────┤                          │
```

### 12.4 Generate Interpretation

```
Client                 API Server           Interpretation Engine     Content Store
  │ GET /charts/{id}/interpretations         │                             │
  │ Authorization: Bearer <token>            │                             │
  ├──────────────────────────────────────────▶│                             │
  │                                           │ verify ownership             │
  │                                           │ load Chart (persisted)       │
  │                                           │ interpret(Chart, language)   │
  │                                           ├──────────────────────────────▶│
  │                                           │                             │ lookup by subjectKey
  │                                           │◀──────────────────────────────┤ Interpretation[]
  │  200 OK [InterpretationResponse, ...]     │                             │
  │◀──────────────────────────────────────────┤                             │
```

---

## 13. OpenAPI Mapping

Cấu trúc dưới đây đủ để chuyển trực tiếp sang `openapi.yaml` (OpenAPI 3.1) — mỗi endpoint ở Mục 4 map 1-1 vào 1 `path` + `operation`. Ví dụ minh họa cho endpoint lõi:

```yaml
paths:
  /charts/natal:
    post:
      operationId: createNatalChart
      summary: Tính toán một Natal Chart mới
      tags: [Charts]
      security:
        - bearerAuth: []   # optional — Guest vẫn gọi được nếu save=false
      parameters:
        - name: save
          in: query
          required: false
          schema: { type: boolean, default: false }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateNatalChartRequest'
      responses:
        '200':
          description: Chart tính toán thành công (không lưu)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ChartResponse' }
        '201':
          description: Chart tính toán và lưu thành công
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ChartResponse' }
        '400': { $ref: '#/components/responses/BadRequest' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '422': { $ref: '#/components/responses/UnprocessableEntity' }

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    CreateNatalChartRequest:
      type: object
      required: [houseSystem]
      properties:
        birthProfileId: { type: string, format: uuid, nullable: true }
        birthData: { $ref: '#/components/schemas/BirthDataInput', nullable: true }
        houseSystem: { type: string, enum: [Placidus, WholeSign] }
        includeOptionalPoints:
          type: array
          items: { type: string, enum: [Chiron, Lilith, NorthNode, SouthNode] }
    ChartResponse:
      type: object
      properties:
        id: { type: string, format: uuid }
        chartType: { type: string, enum: [Natal] }
        houseSystem: { type: string }
        isHouseDataAvailable: { type: boolean }
        planets:
          type: array
          items: { $ref: '#/components/schemas/PlanetResponse' }
        # ... houses, angles, aspects, patterns theo Mục 5.4
  responses:
    BadRequest:
      description: Malformed request
      content:
        application/problem+json:
          schema: { $ref: '#/components/schemas/ProblemDetails' }
```

**Quy tắc mapping chung:**

| Mục trong tài liệu này | Mapping sang OpenAPI |
|---|---|
| Mỗi bảng endpoint (Mục 4) | 1 `path` + `operation` (method) |
| Auth (Guest/User/Admin) | `security: []` (Guest) hoặc `security: [bearerAuth: []]` + note phân quyền role trong `description` (OpenAPI không tự expose role-based access, cần bổ sung ở docs) |
| Mỗi DTO (Mục 5) | 1 `component.schemas.<TênDTO>` |
| Bảng Error Handling (Mục 7) | `component.responses.<TênLỗi>` dùng chung, tham chiếu qua `$ref` |
| Query params Pagination (Mục 8) | `component.parameters.PageParam`, `PageSizeParam`... dùng chung |

---

## 14. Open Questions & Inconsistencies

> **Cập nhật 10/07/2026:** Toàn bộ 13 mục dưới đây đã được Product Owner review và chốt quyết định (xem văn bản phản hồi ngày 10/07/2026). Tài liệu giữ lại nguyên phần "Vấn đề" và "Phương án đã cân nhắc" để làm **decision log** tham chiếu trong tương lai, đồng thời bổ sung rõ **✅ Quyết định cuối cùng** cho mỗi mục. Các thay đổi tương ứng đã được áp dụng vào Mục 1–13 ở trên.

### 14.1 AI Interpretation — mâu thuẫn phạm vi giữa PRD và Engine Spec
**Vấn đề:** PRD (FR-07) mô tả Interpretation là "ghép nối với đoạn diễn giải tương ứng từ ngân hàng nội dung đã biên soạn sẵn" — tức **hoàn toàn rule-based/human-authored**, không đề cập AI. Trong khi đó, Domain Spec (`Interpretation.contentSource`) và Engine Spec (Mục 9.6 — Extension Point) đã thiết kế sẵn cho `AIGenerated`.

**Phương án đã cân nhắc:**
1. Giữ API v1 chỉ hỗ trợ `HumanAuthored`, không cho client chọn `contentSource`.
2. Thiết kế API đã sẵn field `contentSource` trong response nhưng luôn trả `HumanAuthored` ở v1.
3. Loại bỏ hẳn field `contentSource` khỏi `InterpretationResponse`.

**✅ Quyết định cuối cùng:** Phương án 3 (điều chỉnh) — **REST API v1 không expose `contentSource`**. `Interpretation` luôn là một phần nhúng sẵn của `ChartResponse` (xem 14.9), server tự quyết định nội bộ cách sinh nội dung, client không biết và không cần biết nguồn gốc. Đã áp dụng: `InterpretationResponse` (Mục 5.5) không còn field `contentSource`.

### 14.2 Vai trò User/Admin chưa được Domain Specification định nghĩa chính thức
**Vấn đề:** Domain Spec không có entity `User`/`role` được đặc tả chính thức, trong khi tài liệu này cần `role` cho Permission Matrix và quản trị Article.

**Phương án đã cân nhắc:**
1. Bổ sung entity `User`/`role` vào một tài liệu **Identity/Account Domain Specification** riêng, tách khỏi Astrology Domain Spec.
2. Coi `role` là chi tiết triển khai thuần túy, không cần tài liệu domain riêng.

**✅ Quyết định cuối cùng:** Phương án 1 — sẽ có một **Identity/Account Domain Specification** riêng biệt, tách bạch hoàn toàn khỏi Astrology Domain Spec (đúng nguyên tắc domain chiêm tinh không lẫn với domain định danh người dùng). REST API Specification này **tiếp tục dùng tạm** `role: enum(user, admin)` như hiện tại cho đến khi tài liệu Identity Domain Spec chính thức ra đời; khi đó Mục 2 (Auth) và các DTO liên quan (`UserResponse`) sẽ được đối chiếu/cập nhật lại theo tài liệu mới đó.

### 14.3 Synastry — xác nhận loại khỏi v1
**✅ Quyết định cuối cùng:** Đã xác nhận — **không implement Synastry trong API v1**, nhất quán với PRD MoSCoW (Could-have). Nếu được xác nhận đưa vào giai đoạn sau, sẽ bổ sung dưới dạng endpoint mới (không cần bump major version, theo Mục 10.3).

### 14.4 Nơi lưu trữ Refresh Token phía Client
**Phương án đã cân nhắc:** (1) HttpOnly Cookie + `SameSite=Strict`; (2) localStorage.

**✅ Quyết định cuối cùng:** Phương án 1 — **HttpOnly Cookie + `SameSite=Strict`**. Đã áp dụng vào Mục 2.3. Backend cần cấu hình CORS (Mục 11) tương ứng với domain Frontend chính thức; Frontend cần thống nhất việc gửi cookie tự động qua `credentials: 'include'` khi gọi API.

### 14.5 Idempotency Key cho `POST /charts/natal`
**Phương án đã cân nhắc:** (1) Thêm header `Idempotency-Key` ngay từ v1; (2) Chấp nhận Chart trùng lặp ở MVP, bổ sung Idempotency-Key sau.

**✅ Quyết định cuối cùng:** Phương án 2 — **MVP (v1) chấp nhận việc có thể tạo Chart trùng lặp nội dung**, không triển khai `Idempotency-Key`. Cơ chế `Idempotency-Key` (client tự sinh UUID, server dedup theo key trong 1 khoảng thời gian) được **lên kế hoạch cho v1.1 hoặc v2**, sẽ bổ sung như một non-breaking change (thêm header optional) khi cần. Đã áp dụng ghi chú vào Mục 4.4.

### 14.6 Article — resource nằm ngoài Domain Specification cốt lõi
**✅ Quyết định cuối cùng:** Xác nhận đây là khoảng trống tài liệu, không phải mâu thuẫn. **Sẽ có một Content Domain Specification riêng** khi thư viện kiến thức phát triển phức tạp hơn (thêm tag, tác giả, đa ngôn ngữ...). Ở giai đoạn hiện tại, `Article` tiếp tục được đặc tả trực tiếp trong REST API Specification này (Mục 4.5, 5.6) do quy mô còn đơn giản.

### 14.7 Google OAuth — chi tiết luồng chưa được đặc tả
**✅ Quyết định cuối cùng:** Xác nhận phạm vi — chi tiết luồng OAuth (redirect URI, scope, xử lý callback) **không thuộc REST API Specification này**, sẽ được đặc tả trong **Identity Service Specification** (tài liệu tương lai, cùng phạm vi với Mục 14.2). Đã cập nhật `Notes` của `POST /auth/register` (Mục 4.1) để dẫn chiếu "Chi tiết xem Identity Service Specification" thay vì mô tả tạm một endpoint OAuth cụ thể.

### 14.8 Cascade behavior khi xóa BirthProfile
**Phương án đã cân nhắc:** (1) Soft delete + Chart giữ snapshot độc lập; (2) Cascade delete toàn bộ Chart liên quan.

**✅ Quyết định cuối cùng:** Phương án 1 — **Soft delete BirthProfile, Chart giữ nguyên dưới dạng snapshot độc lập**, không phụ thuộc runtime vào BirthProfile gốc. Đã áp dụng vào `DELETE /birth-profiles/{id}` (Mục 4.3) và ghi chú `PATCH /birth-profiles/{id}` — sửa BirthProfile không ảnh hưởng Chart đã tính trước đó.

### 14.9 Interpretation cho Chart transient (`save=false`)
**✅ Quyết định cuối cùng:** Hợp nhất với 14.1 — `POST /charts/natal` **luôn trả kèm `interpretations`** trong cùng response, bất kể `save=true` hay `save=false`. Endpoint `GET /charts/{chartId}/interpretations` riêng biệt đã được **loại bỏ hoàn toàn** khỏi Mục 4 (không còn là resource độc lập ở Mục 3).

### 14.10 Timezone lịch sử theo `date` cụ thể khi tra cứu Location
**✅ Quyết định cuối cùng:** Đã chốt — thêm query param **`date` bắt buộc** vào `GET /locations/search` (Mục 4.6), server trả `historicalTimezoneId` chính xác theo `date` được truyền, không phải timezone hiện tại của địa danh.

### 14.11 Biên dưới hợp lệ của `birthDate`
**✅ Quyết định cuối cùng:** **Không đặt biên dưới cứng** (không có business rule kiểu "năm ≥ 1900"). Validation chỉ yêu cầu `birthDate < ngày hiện tại`. Để tối ưu UX, nếu `birthDate` rất xa quá khứ, server trả về cảnh báo mềm thay vì lỗi chặn:
```json
{
  "warnings": [
    {
      "code": "HISTORICAL_DATE",
      "message": "Ngày sinh rất xa trong quá khứ. Hãy kiểm tra lại nếu đây không phải dữ liệu của nhân vật lịch sử.",
      "severity": "info",
      "field": "birthDate"
    }
  ]
}
```
Đã áp dụng vào Mục 5.8 (`Warning` DTO), Mục 5.3 (`BirthProfileResponse`) và Mục 6 (Validation Rules).

### 14.12 Cấu trúc `warnings` trong response khi House không hội tụ
**Đề xuất ban đầu** (tối giản, chỉ `code` + `message`) **và đề xuất mở rộng** (thêm `severity`, `field`, `details` optional) đã được cân nhắc.

**✅ Quyết định cuối cùng:** Chọn **cấu trúc mở rộng**, phù hợp cho cả MVP lẫn khả năng tái sử dụng về sau (dùng chung cho `HOUSE_SYSTEM_NOT_CONVERGING`, `HISTORICAL_DATE`, và mọi cảnh báo mềm khác):
```json
{
  "code": "string (bắt buộc)",
  "message": "string (bắt buộc)",
  "severity": "info | warning (bắt buộc)",
  "field": "string (optional)",
  "details": "object (optional)"
}
```
Đã định nghĩa chính thức thành DTO `Warning` dùng chung tại Mục 5.8, áp dụng cho `ChartResponse.warnings` (Mục 5.4) và `BirthProfileResponse.warnings` (Mục 5.3).

### 14.13 Con số Rate Limiting cụ thể
**✅ Quyết định cuối cùng:** Đồng ý với các con số khởi điểm đã đề xuất, nhưng **không hard-code** — chính thức hóa thành khái niệm **Rate Limit Policy**, cấu hình qua biến môi trường (`RATE_LIMIT_GUEST`, `RATE_LIMIT_USER`, `RATE_LIMIT_ADMIN`...), cho phép Product Owner điều chỉnh sau này mà không cần sửa code/tài liệu. Đếm giới hạn theo **IP** cho Guest, theo **Account (`userId`)** cho User/Admin. Đã áp dụng đầy đủ vào Mục 9 (Rate Limiting).
