# Sprint 2 — Birth Profile Module — Technical Implementation Plan

> **Trạng thái:** FROZEN ở cấp Sprint — đã xác nhận đủ 4 Open Question + 2 điều chỉnh bổ sung. Sẵn sàng tạo Implementation Plan chi tiết cho Milestone 1.
> **Triết lý:** Theo đúng tinh thần Sprint 1 (Identity Module) — mỗi Milestone có Implementation Plan riêng, review trước khi code, review sau khi code, không code trước hỏi sau.
> **Ràng buộc:** Architecture/Tech Stack/Coding Standards/REST API Specification/Database Specification đã freeze — Sprint 2 **hiện thực hoá** các tài liệu này, không thiết kế lại.
> **Phạm vi:** Quản lý Birth Profile (hồ sơ sinh đã lưu). **Không** tính toán chiêm tinh (Sprint 3 — Natal Chart bằng Swiss Ephemeris).

---

## 0. Xung đột cần xác nhận trước — ĐÃ CHỐT

Trước khi đi vào 12 mục, có 1 điểm lệch giữa đề bài Sprint 2 và REST API Specification đã freeze — đã xác nhận cách xử lý:

**Đề bài gợi ý Use Case `RestoreBirthProfile`, nhưng REST API Specification Mục 4.3 chỉ định nghĩa đúng 5 endpoint: `POST`, `GET` (list), `GET` (detail), `PATCH`, `DELETE` — không có endpoint restore nào.** Vì "Không được thay đổi REST API" là ràng buộc cứng, Sprint 2 **không tạo** `POST /birth-profiles/{id}/restore` hay bất kỳ route nào tương đương — điểm này không đổi.

**Đã chốt lại (khác bản nháp đầu):** **Bỏ hẳn `RestoreBirthProfileUseCase` khỏi Sprint 2**, không giữ lại "dự phòng" như đề xuất ban đầu của tôi. Lý do đổi quyết định: áp dụng nhất quán YAGNI — giữ 1 UseCase không có Controller/Route/Admin tooling nào gọi tới là suy đoán trước nhu cầu chưa xác nhận, đúng loại rủi ro mà nguyên tắc YAGNI đã dùng xuyên suốt Sprint 1 (ví dụ quyết định không thêm `EMAIL_PROVIDER` env var ở M7 vì chưa có adapter thứ 2 thật) cảnh báo tránh. Hệ quả: `IBirthProfileRepository` cũng bỏ luôn `restore()` và `findByIdIncludingDeleted()` (Mục 4.1) — không có UseCase nào gọi, giữ lại chỉ là bề mặt interface "chết". Nếu Product sau này thật sự cần restore (qua Admin Module tương lai, xem OQ3), thêm lại 2 method này vào Repository là thay đổi rẻ, không cần thiết kế lại gì.

---

## 1. Architecture Review

### 1.1 Vị trí Birth Profile Module trong hệ thống

```
src/modules/
├── identity/         (Sprint 1 — không đổi)
└── birth-profile/    (Sprint 2 — MỚI)
```

Đặt `birth-profile` **ngang hàng** `identity` dưới `src/modules/`, không lồng vào trong `identity/` — đúng nguyên tắc Module Boundary đã xác lập từ Sprint 1 (mỗi domain nghiệp vụ là 1 module độc lập, chỉ phụ thuộc `shared/`). Điều này khớp trực tiếp với ranh giới đã **freeze ở tầng Database** (Database Design Spec Mục 3.1): `identity` và `astrology` là 2 PostgreSQL schema tách biệt, `astrology` phụ thuộc `identity` (qua FK `user_id`) nhưng **không ngược lại**. Module code nên phản ánh đúng ranh giới đã có ở DB, không tạo thêm module lồng nhau gây nhầm lẫn về ai phụ thuộc ai.

**Vì sao không đặt tên module là `astrology` ngay từ Sprint 2** dù schema DB tên là `astrology`: Sprint 2 chỉ làm Birth Profile — chưa có Chart/Interpretation. Đặt tên module là `birth-profile` (hẹp, đúng phạm vi hiện tại) thay vì `astrology` (rộng, bao hàm cả Chart tương lai) tránh 2 vấn đề: (1) code trong `src/modules/astrology/` ở Sprint 2 sẽ trông "trống" một cách khó hiểu (chỉ có birth-profile, không có chart), (2) khi Sprint 3 thêm Chart, cần quyết định Chart có sống chung `astrology/` với Birth Profile hay tách `modules/chart/` riêng — quyết định đó nên hoãn tới lúc thật sự cần, không quyết trước cho tương lai (YAGNI, đúng tinh thần đã áp dụng nhất quán ở Sprint 1). Nếu Sprint 3 quyết định gộp, đổi tên folder `birth-profile/` → `astrology/` là refactor rẻ (rename, không đổi logic).

### 1.2 Folder Structure — 4 layer, đúng khuôn Sprint 1

```
src/modules/birth-profile/
├── domain/
│   ├── entities/
│   │   └── birth-profile.entity.ts        — BirthProfile (Domain Entity, có BirthLocation lồng trong dạng Value Object)
│   ├── value-objects/
│   │   ├── birth-date.vo.ts               — BirthDate
│   │   ├── birth-time.vo.ts               — BirthTime (+ BirthTimePrecision)
│   │   └── birth-location.vo.ts           — BirthLocation, Coordinates, Timezone
│   ├── ports/
│   │   ├── birth-profile-repository.port.ts
│   │   ├── geocoding-provider.port.ts
│   │   ├── location-search-provider.port.ts
│   │   └── timezone-provider.port.ts
│   └── errors/
│       └── birth-profile.errors.ts        — Domain Error thuần (không phải HTTP error) — xem Mục 2.4
├── application/
│   └── use-cases/
│       ├── create-birth-profile.usecase.ts
│       ├── update-birth-profile.usecase.ts
│       ├── delete-birth-profile.usecase.ts
│       ├── get-birth-profile.usecase.ts
│       ├── list-birth-profiles.usecase.ts
│       └── search-birth-locations.usecase.ts   — SearchBirthLocationsUseCase (Mục 6.4, đổi tên theo xác nhận)
├── infrastructure/
│   ├── repositories/
│   │   └── prisma-birth-profile.repository.ts
│   ├── mappers/
│   │   └── prisma-birth-profile.mapper.ts
│   └── adapters/
│       └── (Geocoding/LocationSearch/Timezone Adapter — Mục 6, tuỳ Milestone)
└── presentation/
    ├── controllers/
    │   └── birth-profile.controller.ts
    ├── routes/
    │   └── birth-profile.routes.ts
    ├── schemas/
    │   ├── create-birth-profile.schema.ts
    │   └── update-birth-profile.schema.ts
    ├── mappers/
    │   └── birth-profile-response.mapper.ts
    └── openapi/
        └── birth-profile.openapi.ts
```

**Giải thích lý do tồn tại của từng layer (đúng như đã áp dụng Sprint 1, không lặp lại lý thuyết — chỉ nêu điểm khác biệt của module này):**

- **`domain/value-objects/` — folder MỚI, chưa từng tồn tại ở Identity Module.** Identity Module (Sprint 1) không có Value Object nào vì `User`/`RefreshToken` không có thuộc tính nào đủ phức tạp để tách VO (email là string đơn giản có validate, không cần đóng gói hành vi riêng). Birth Profile **khác về bản chất**: `BirthDate`/`BirthTime`/`BirthLocation` đều mang theo **bất biến nghiệp vụ riêng** (invariant) cần tự bảo vệ tính hợp lệ ngay tại điểm khởi tạo (constructor), không thể biểu diễn an toàn bằng `string`/`Date` trần — đây chính là lý do Domain-Driven Design tồn tại khái niệm Value Object, và đây là module đầu tiên của dự án thực sự cần nó. Xem chi tiết Mục 2.
- **`domain/errors/` — lần đầu tiên được dùng thật trong dự án.** Sprint 1 review (Milestone 10) từng ghi nhận `domain/errors/` "được dự trù nhưng chưa bao giờ dùng" vì Error Kernel tập trung (`shared/errors/`) đủ dùng cho Identity. Birth Profile Module **cần** domain error riêng — lý do cụ thể ở Mục 2.4 (không phải quyết định tuỳ tiện để "dùng cho có").
- **`infrastructure/adapters/` (Geocoding/LocationSearch/Timezone)** — 3 Port mới hoàn toàn (Mục 6), đúng nguyên tắc Port/Adapter đã dùng cho `IPasswordHasher`/`ITokenProvider`/`IEmailVerificationService` ở Sprint 1 — Domain/Application không biết Google Places API hay bất kỳ vendor cụ thể nào.

### 1.3 Dependency Direction

```
presentation/ ──▶ application/ ──▶ domain/ ◀── infrastructure/
```

Không đổi so với Identity Module. Điểm cần xác nhận riêng: `birth-profile` module **có được phép** `import` bất kỳ thứ gì từ `identity` module không? **Câu trả lời: Không, kể cả Port.** Khác với `shared/middlewares/authenticate.middleware.ts` (Sprint 1) — nơi có 1 ngoại lệ *có chủ đích* cho phép `shared/` import `ITokenProvider` từ `identity/domain/ports/` — `birth-profile` module hoàn toàn **không cần biết** `User` entity hay bất kỳ Port nào của Identity. Toàn bộ thứ `birth-profile` cần từ "danh tính người dùng" chỉ là 1 chuỗi `userId: string` (UUID) — đã có sẵn qua `req.user.sub` (gắn bởi `authMiddleware`/`requireAuth` dùng chung ở `shared/`), không cần `import` gì từ module Identity. Đây chính là bằng chứng thực tế đầu tiên cho nguyên tắc "module không phụ thuộc module khác" đã nêu lý thuyết từ Sprint 1 (khi đó chỉ có 1 module nên chưa kiểm chứng được).

### 1.4 Repository Abstraction & Naming

Giữ đúng convention Sprint 1: `IBirthProfileRepository` (Port) / `PrismaBirthProfileRepository` (Adapter) — không đổi pattern.

### 1.5 Technical Debt xác định trước (chủ động, không đợi review sau)

| # | Vấn đề | Mức độ |
|---|---|---|
| TD-BP1 | `GET /api/v1/locations/search` (REST API Spec Mục 4.6) dùng chung `ILocationSearchProvider`/`IGeocodingProvider` với Birth Profile Module, nhưng bản thân endpoint này là `Auth: Guest` — không thuộc về "hồ sơ sinh của user" theo nghĩa hẹp. Cần quyết định route này (Milestone nào implement, module nào sở hữu Controller) — xem Mục 6.4 và Open Question OQ1 |
| TD-BP2 | Chưa có Sprint 2 nào kiểm chứng thật việc `astrology` schema tách biệt vật lý khỏi `identity` (mới chỉ đúng trên giấy DB Spec) — Milestone 1 (Prisma Foundation) là nơi đầu tiên phải tự kiểm tra: migration cho schema `astrology` chạy độc lập, không lẫn với migration `identity` đã có |

---

## 2. Domain Design

### 2.1 Aggregate Boundary

**`BirthProfile` là Aggregate Root duy nhất của module này** (khớp Database Design Spec Mục 4: `BirthProfile | ✔ Aggregate Root`). `BirthLocation`/`BirthDate`/`BirthTime` là **Value Object**, không phải Entity con — chúng không có định danh (`id`) riêng và không có vòng đời độc lập với `BirthProfile` (không có "sửa 1 mình BirthLocation mà không qua BirthProfile"). Đây là điểm khác `Chart` (Sprint 3) — nơi `Planet`/`House`/`Angle`/`Aspect` là Entity con có `id` riêng (bảng riêng trong DB) vì cần truy vấn độc lập; `BirthLocation` thì không cần bảng riêng (đã xác nhận qua Database Design Spec Mục 5.6 — mọi field `BirthLocation` nằm phẳng trong chính bảng `birth_profiles`, không có bảng `birth_locations` riêng).

### 2.2 Value Objects — trách nhiệm từng cái

**`BirthDate`**
- Bọc 1 giá trị `Date`/ISO string, tự validate ngay tại constructor: không ở tương lai (Validation Rules Mục 6 REST API Spec — "birthDate < ngày hiện tại"), đúng lịch Gregorian.
- **Không tự validate "không quá xa quá khứ"** — Domain Spec/REST API Spec Mục 6 nói rõ "không có biên dưới cứng" (Quyết định 14.11), ngày quá xa quá khứ tạo `warnings[].code = HISTORICAL_DATE` chứ **không** bị chặn ở validation. Đây là điểm dễ làm sai nếu không đọc kỹ — VO này không được throw lỗi cho input hợp lệ về mặt lịch nhưng "già" về mặt dữ liệu; việc phát hiện "quá già" thuộc về UseCase (sinh warning), không phải VO (chặn tạo object).
- **Bất biến (invariant):** 1 khi khởi tạo thành công, giá trị bên trong không đổi (immutable) — nếu cần đổi ngày sinh, tạo 1 `BirthDate` mới, không có method `setDate()`.

**`BirthTime` + `BirthTimePrecision`**
- `BirthTime` bọc giờ/phút/giây, validate range `00:00:00`–`23:59:59`.
- `BirthTimePrecision` — đây là khái niệm **tôi bổ sung, không có tên tương ứng trực tiếp trong Domain Spec** (Domain Spec chỉ có `isBirthTimeKnown: boolean`, không có khái niệm "độ chính xác" nhiều mức). Đề bài Sprint 2 liệt kê `BirthTimePrecision` như 1 khái niệm cần thiết kế — nhưng theo đúng dữ liệu đã freeze, hệ thống hiện tại chỉ có 2 trạng thái nhị phân: biết giờ chính xác hay không (`isBirthTimeKnown`), **không có** khái niệm "biết khoảng tương đối" (ví dụ "buổi sáng", "khoảng 2-3h chiều") — Domain Spec Mục 5.1 nói rõ: *"Sản phẩm quyết định có cho phép nhập 'khoảng thời gian ước lượng' hay không — đây là quyết định UX, không phải quy luật chiêm tinh"* và **chưa có quyết định này ở bất kỳ đâu**. → Xem Open Question OQ2. Đề xuất Sprint 2: **`BirthTimePrecision` chỉ có 2 giá trị** (`KNOWN` / `UNKNOWN`) ánh xạ trực tiếp `isBirthTimeKnown`, không làm enum nhiều mức tại thời điểm này — giữ đúng đơn giản như dữ liệu đã freeze, dễ mở rộng thêm giá trị sau (thêm case vào enum) hơn là thu hẹp lại nếu lỡ làm phức tạp trước khi có quyết định UX chính thức.
- **Invariant quan trọng nhất của cả `BirthProfile`:** `isBirthTimeKnown = false` ⟺ `birthTime = null` — đây là CHECK constraint đã có ở DB (`CHECK (is_birth_time_known = true OR birth_time IS NULL)`), nhưng **phải enforce lại ở tầng Domain trước khi chạm DB** — không phải vì không tin DB, mà vì đây là **invariant nghiệp vụ**, cần fail nhanh với thông báo rõ nghĩa (Domain Error) thay vì để lộ ra ngoài dưới dạng lỗi CHECK constraint khó hiểu từ Postgres.

**`BirthLocation` (gồm `Coordinates` + `Timezone`)**
- `Coordinates` — bọc `latitude`/`longitude`, validate range `[-90,90]`/`[-180,180]` ngay tại constructor.
- `Timezone` — bọc `historicalTimezoneId` (chuỗi IANA), validate **format hợp lệ trong IANA tzdb** (Mục 3.3 bàn kỹ hơn về validate bằng cách nào).
- `BirthLocation` tổng hợp `placeName` + `Coordinates` + `Timezone` thành 1 VO — không tách `placeName` ra ngoài vì nó luôn đi cùng toạ độ theo đúng ngữ nghĩa "tên địa danh mà toạ độ này đại diện" (không có toạ độ "vô danh" trong ngữ cảnh nghiệp vụ này).

### 2.3 `BirthProfile` Entity — thuộc tính & trách nhiệm

```
BirthProfile {
  id: UUID
  userId: UUID              // ownership — KHÔNG phải Value Object, là reference thuần
  label: string              // 1-100 ký tự
  fullName: string | null
  birthDate: BirthDate
  birthTime: BirthTime | null
  isBirthTimeKnown: boolean
  birthLocation: BirthLocation
  createdAt, updatedAt: Date
  deletedAt: Date | null     // soft delete
  version: number            // optimistic lock
}
```

Trách nhiệm của Entity: đảm bảo **toàn bộ profile ở trạng thái hợp lệ như 1 tổng thể** — không chỉ từng field riêng lẻ hợp lệ (đó là việc của VO), mà cả sự **kết hợp** giữa các field (`isBirthTimeKnown` ↔ `birthTime`) cũng phải nhất quán. Entity không tự query DB, không biết gì về Prisma/HTTP.

### 2.4 Domain Errors — vì sao cần riêng, khác Identity Module

| Domain Error | Khi nào throw |
|---|---|
| `InvalidBirthTimeStateError` | `isBirthTimeKnown=false` nhưng `birthTime` khác `null` (hoặc ngược lại thiếu `birthTime` khi `isBirthTimeKnown=true`) |
| `InvalidCoordinatesError` | Toạ độ ngoài range (dù Zod ở Presentation đã chặn hầu hết, VO vẫn tự bảo vệ — defense in depth, đặc biệt quan trọng vì `Coordinates` có thể được tạo từ nhiều nguồn: Controller, hoặc trực tiếp trong UseCase khi nhận dữ liệu từ `IGeocodingProvider`) |
| `InvalidTimezoneError` | `historicalTimezoneId` không phải chuỗi IANA hợp lệ |
| `BirthDateInFutureError` | `birthDate >= hôm nay` |

**Vì sao Birth Profile cần `domain/errors/` riêng trong khi Identity không cần (Sprint 1 Milestone 10 review):** Identity Module có rất ít bất biến nghiệp vụ phức tạp — lỗi của nó chủ yếu là lỗi **hạ tầng** (unique constraint, token hết hạn) hoặc lỗi **xác thực** (sai password), cả 2 loại này đã có sẵn `InfrastructureError`/`AuthenticationError` dùng chung hợp lý. Birth Profile Module có **nhiều bất biến thuần domain** (invariant giữa các field, range toạ độ, format timezone) — đây là loại lỗi phát sinh **trước khi chạm hạ tầng**, xảy ra ngay trong constructor của Value Object, cần tên lỗi phản ánh đúng ngữ nghĩa nghiệp vụ chiêm tinh/địa lý thay vì generic `ValidationError`. Các Domain Error này **không kế thừa trực tiếp** `AppError` (Error Kernel của `shared/`) — chúng là exception thuần TypeScript trong `domain/`, không import gì từ `shared/errors/`; **Application Layer (UseCase) là nơi bắt chúng và convert sang `AppError` phù hợp** (thường là `DomainError`/`ErrorCode.VALIDATION_ERROR`, 422, đã có sẵn từ Sprint 0 Error Kernel) — giữ đúng nguyên tắc Domain Layer không phụ thuộc bất kỳ thứ gì bên ngoài, kể cả Error Kernel của `shared/`.

---

## 3. Technical Decisions

### 3.1 Unknown Birth Time

**Đã chốt theo Domain Spec/DB Spec, không phải quyết định mới:** `isBirthTimeKnown=false` → `birthTime=null`, không gán giờ mặc định (12:00 hay bất kỳ giá trị nào) ở tầng lưu trữ. Việc engine tính toán xử lý "không rõ giờ sinh" như thế nào (Sun/Moon sign gần đúng kèm cảnh báo) là việc của **Sprint 3 (Engine)** — Birth Profile Module chỉ có trách nhiệm **lưu đúng trạng thái "không biết"**, không tự ý suy luận hộ.

### 3.2 Time Precision

Theo Mục 2.2 — chỉ 2 mức (`KNOWN`/`UNKNOWN`) ở Sprint 2, không làm nhiều mức. **Trade-off:** nếu Sprint sau cần "biết khoảng tương đối" (ví dụ UX cho phép chọn "buổi sáng"), sẽ cần thêm giá trị enum + có thể thêm cột DB mới (`birth_time_range_start`/`birth_time_range_end` hoặc tương tự) — đây là thay đổi Database Schema, ngoài phạm vi "không đổi Schema nếu chưa có lý do chính đáng" của Sprint 2, nên **chủ động không làm trước khi có yêu cầu rõ ràng** (YAGNI), chấp nhận trade-off phải migrate thêm 1 lần nữa sau này nếu nhu cầu thật sự xuất hiện.

### 3.3 Timezone Strategy — quyết định kỹ thuật quan trọng nhất của Sprint 2

**Vấn đề:** Domain Spec yêu cầu `historicalTimezoneId` phải "hợp lệ trong IANA Time Zone Database" — nhưng validate **thế nào**?

**3 phương án:**
- **(a)** Dùng thư viện `Intl.supportedValuesOf('timeZone')` (built-in Node.js ≥18, không cần thêm dependency) để lấy danh sách IANA timezone hợp lệ, validate bằng cách check membership.
- **(b)** Dùng package ngoài (`moment-timezone`, `luxon`, hoặc `@vvo/tzdb`) có database IANA đầy đủ hơn kèm metadata lịch sử offset.
- **(c)** Không tự validate — tin tưởng hoàn toàn giá trị trả về từ `ITimezoneProvider`/`ILocationSearchProvider` (external service), chỉ validate format chuỗi (`Region/City`) bằng regex, không validate "có tồn tại thật trong tzdb" ở tầng ứng dụng.

**Khuyến nghị: (a) kết hợp (c)** — dùng `Intl.supportedValuesOf('timeZone')` (built-in, không thêm dependency mới — đúng tinh thần "tối giản hạ tầng" đã áp dụng suốt Sprint 1) để validate **format/tồn tại** ngay trong `Timezone` Value Object, **nhưng không tự tính toán/resolve** timezone từ toạ độ — việc "toạ độ này thuộc timezone nào tại thời điểm lịch sử nào" là trách nhiệm của `ITimezoneProvider`/`ILocationSearchProvider` (Mục 6), không phải của Birth Profile Module. Value Object chỉ đảm bảo: "chuỗi này CÓ THẬT trong IANA tzdb", không đảm bảo "chuỗi này ĐÚNG cho toạ độ X tại ngày Y" (đó là bài toán geocoding/timezone lookup, ngoài phạm vi validate dữ liệu đơn thuần).

**Trade-off:** `Intl.supportedValuesOf('timeZone')` phụ thuộc phiên bản ICU được biên dịch cùng Node.js runtime — có thể không tuyệt đối 100% khớp bản mới nhất của IANA tzdb (cập nhật vài lần/năm do thay đổi luật giờ mùa hè ở 1 số quốc gia). Chấp nhận được cho MVP — sai lệch nếu có chỉ ảnh hưởng các timezone vừa đổi luật trong vài tháng gần nhất, tỷ lệ cực thấp trong dữ liệu ngày sinh (đa số là quá khứ, tzdb đã ổn định).

### 3.4 Coordinate Validation

Range check `[-90,90]`/`[-180,180]` ở cả Zod (Presentation, fail nhanh 400) **và** `Coordinates` Value Object (Domain, defense-in-depth) — trùng lặp có chủ đích, đúng nguyên tắc "validate format ở Presentation, validate business invariant ở Domain" đã áp dụng nhất quán từ Sprint 1 (email format ở Zod, nhưng uniqueness check ở Application/Repository). Không validate "toạ độ này có thật trên đất liền không" (ví dụ chặn toạ độ giữa đại dương) — đây không phải bug, nhiều đảo/tàu biển vẫn là nơi sinh hợp lệ về mặt kỹ thuật, và việc "có người ở đó không" không phải bất biến toán học mà Value Object nên tự quyết định.

### 3.5 Soft Delete

Đã chốt ở Database Design Spec (Quyết định 14.8) — `deleted_at`, không cascade xoá `Chart` liên quan. Birth Profile Module chỉ cần **hiện thực hoá đúng**, không phải quyết định mới: `DeleteBirthProfileUseCase` set `deleted_at`, mọi Repository read method (`findById`, `list`) mặc định lọc `deleted_at IS NULL` — đúng pattern đã dùng cho `User.findByEmail()` (Sprint 1 M2).

### 3.6 Ownership

**Đã chốt ở REST API Spec:** `GET/PATCH/DELETE /birth-profiles/{id}` → "User, Admin (chỉ chủ sở hữu)". Đây chính là **ranh giới "Ownership Check thuộc Application Layer"** đã ghi thành Architectural Decision AD2 ở Sprint 1 Milestone 8 — Birth Profile Module là nơi **đầu tiên** thực thi AD2 trong thực tế (Sprint 1 Identity không có khái niệm ownership vì User sở hữu chính mình). Mỗi UseCase (`GetBirthProfileUseCase`, `UpdateBirthProfileUseCase`, `DeleteBirthProfileUseCase`) tự so sánh `birthProfile.userId === command.currentUserId` sau khi query Repository, throw `AuthorizationError(FORBIDDEN)` (đã có sẵn từ Error Kernel Sprint 0) nếu không khớp — **không** làm ở middleware (đúng AD2, middleware không gọi Repository).

**Đã chốt (OQ3):** ownership áp dụng cho **mọi role như nhau**, kể cả Admin — Admin không có quyền vượt qua ownership check ở Sprint 2. Mọi khả năng thao tác thay người dùng (ví dụ Admin cần xem/sửa BirthProfile của user khác để hỗ trợ) sẽ thuộc về **1 Admin Module/API riêng trong tương lai** (có thể là `/admin/birth-profiles/*`, tương tự cách `/admin/articles/*` đã tồn tại trong Permission Matrix cho Article) — không lẫn vào 5 endpoint CRUD hiện có của Sprint 2. Điều này giữ đúng ranh giới: endpoint `User`-facing luôn tự-sở-hữu-dữ-liệu, endpoint `Admin`-facing (nếu có) là 1 bề mặt API hoàn toàn khác, được đặc tả riêng khi thật sự cần.

### 3.7 Maximum Profile Limit

**Đã chốt (OQ4):** **Không thêm `countByUserId()` vào `IBirthProfileRepository` ở Sprint 2** — kể cả dưới dạng "chuẩn bị sẵn". Đây là điều chỉnh nhất quán YAGNI so với đề xuất ban đầu của tôi (từng đề xuất thêm sẵn vì "chi phí gần 0") — thêm method không ai gọi vẫn là bề mặt interface không cần thiết, dù rẻ. Chỉ bổ sung method này khi Product **chính thức** có yêu cầu giới hạn số lượng hồ sơ — lúc đó thêm 1 method vào interface + 1 check trong `CreateBirthProfileUseCase` là thay đổi nhỏ, không cần thiết kế lại.

### 3.8 Snapshot Philosophy — quan hệ với Chart (Sprint 3)

**Đã chốt ở Database Design Spec (Design Rationale Mục 5.7):** `Chart` (Sprint 3) sẽ **snapshot toàn bộ dữ liệu sinh** tại thời điểm tính, không giữ FK sống runtime tới `BirthProfile`. Hệ quả trực tiếp cho Sprint 2: **`BirthProfile` không cần biết gì về `Chart`** — không có quan hệ 2 chiều, không cần cột `chart_ids` hay bất kỳ tham chiếu ngược nào. `UpdateBirthProfileUseCase` có thể tự do sửa `birthDate`/`birthTime`/`birthLocation` mà không cần lo "làm hỏng Chart cũ" — đúng theo REST API Spec Mục 4.3 đã ghi rõ. Đây là lý do Sprint 2 **an toàn để làm trước** Sprint 3 mà không tạo ràng buộc ngược khó tháo gỡ sau này.

### 3.9 IANA Timezone Identifiers

Đã quyết ở Mục 3.3 — dùng chuỗi IANA (`Asia/Ho_Chi_Minh`), không dùng offset cố định (`+07:00`), đúng Domain Spec.

### 3.10 Geocoding Abstraction & Location Search Abstraction

Xem Mục 6 — 2 Port riêng biệt dù có thể trông giống nhau, lý do tách ở Mục 6.1-6.2.

### 3.11 Caching Strategy

Database Design Spec Mục 2.2 đã chốt: cache `GET /locations/search` nên dùng **Redis** (ephemeral, không phải nguồn sự thật) để giảm số lần gọi Geocoding provider trả phí/rate-limit. **Sprint 2 không triển khai Redis** — đây là quyết định hạ tầng lớn hơn phạm vi module, cần 1 Milestone/task riêng có chủ đích (thêm Redis vào `docker-compose.yml`, `ICacheProvider` Port mới ở `shared/`). Ở Sprint 2, `ILocationSearchProvider`/`IGeocodingProvider` gọi trực tiếp external API mỗi lần, **không cache** — chấp nhận chi phí/latency cao hơn tạm thời, đổi lấy việc không mở rộng hạ tầng ngoài phạm vi cần thiết của module này. Ghi vào Out of Scope (Mục 10) và Risk (Mục 11).

### 3.12 Future Extensibility cho Natal Chart / Transit / Solar Return / Progression / Rectification

Mọi quyết định trên đã tính tới việc Sprint 3 cần **đọc** `BirthProfile` để tạo `Chart` (snapshot), nhưng **không sửa/xoá** `BirthProfile`:
- `BirthDate`/`BirthTime`/`BirthLocation` Value Object thiết kế đủ "thuần" (immutable, tự validate) để Sprint 3 tái sử dụng **trực tiếp** khi build input cho Swiss Ephemeris — không cần chuyển đổi qua lại nhiều lớp.
- `IBirthProfileRepository.findById()` là điểm truy cập duy nhất Sprint 3 cần — không cần API/Port mới nào khác từ module này.
- Rectification (kỹ thuật suy luận giờ sinh từ sự kiện đời thực) — nằm ngoài hoàn toàn phạm vi Birth Profile Module (đây là 1 workflow phức tạp riêng, có thể sinh ra 1 BirthProfile mới với giờ sinh "đã hiệu chỉnh" chứ không sửa trực tiếp — Birth Profile Module không cần biết gì về khái niệm này ở Sprint 2).

---

## 4. Repository Layer

### 4.1 `IBirthProfileRepository` — method

```typescript
export interface IBirthProfileRepository {
  create(profile: BirthProfile): Promise<void>;
  findById(id: string): Promise<BirthProfile | null>;         // lọc deleted_at IS NULL
  listByUserId(userId: string, options: ListOptions): Promise<{ items: BirthProfile[]; total: number }>;
  update(profile: BirthProfile): Promise<void>;                // optimistic lock qua version, pattern giống PrismaUserRepository (Sprint 1 M2)
  softDelete(id: string, userId: string): Promise<boolean>;
}

interface ListOptions {
  page: number;
  pageSize: number;
  sortBy: 'createdAt' | 'fullName';
  order: 'asc' | 'desc';
}
```

**Đã rút gọn so với bản nháp đầu (bỏ `restore()`, `findByIdIncludingDeleted()`, `countByUserId()`)** — theo đúng quyết định YAGNI đã chốt ở Mục 0, 3.7: không giữ method nào chưa có UseCase/nhu cầu Product xác nhận gọi tới.

**Giải thích các quyết định thiết kế:**
- **`update()` dùng optimistic lock (`version`)** — copy nguyên pattern đã kiểm chứng từ `PrismaUserRepository.update()` (Sprint 1 M2: `updateMany({where: {id, version}, data: {version: {increment: 1}}})`, throw `OptimisticLockError` nếu `count === 0`). Lý do cần ở đây: DB Design Spec Mục 5.6 đã có sẵn cột `version` cho đúng mục đích "tránh mất dữ liệu khi sửa từ 2 tab/thiết bị cùng lúc" — dùng lại nguyên xi, không phát minh lại.
- **`softDelete` nhận cả `userId`** (không chỉ `id`) — để Repository tự enforce ownership ngay ở tầng câu lệnh SQL (`WHERE id = ? AND user_id = ?`), làm **lưới an toàn thứ 2** sau khi UseCase đã tự check ownership (Mục 3.6) — defense in depth, tương tự cách `PrismaRefreshTokenRepository.rotate()` (Sprint 1 M6) dùng điều kiện `WHERE` chặt để chống race condition.
- **`listByUserId` trả `{ items, total }`** — cần `total` để tính `PaginatedResponse` (REST API Spec Mục 8, đã dùng khái niệm này trong Mục 4.3 `GET /birth-profiles`).

### 4.2 Prisma Implementation — điểm khác biệt so với Identity Repository

- **Ánh xạ Value Object ↔ Prisma flat columns:** `PrismaBirthProfileMapper.toDomain()` phải "gói" các cột phẳng (`latitude`, `longitude`, `historical_timezone_id`) từ Prisma model thành 1 `BirthLocation` VO duy nhất khi dựng `BirthProfile` Entity — và `toPersistence()` làm ngược lại (destructure VO ra field phẳng). Đây là điểm khác biệt kỹ thuật rõ nhất so với Identity Module (nơi Entity ↔ Prisma model gần như 1-1 phẳng, không có VO cần gói/mở).
- **Schema Prisma dùng `@@schema("astrology")`** (đa schema, đã cấu hình `multiSchema` từ Sprint 1 M1) — `birth_profiles` model mới hoàn toàn tách khỏi `identity`, chỉ có FK 1 chiều `user_id → identity.users(id)`.
- **Không cần trigger riêng cho `updated_at`** — dùng lại đúng cơ chế Postgres trigger đã tồn tại từ Sprint 1 (Phương án B, `BEFORE UPDATE`), chỉ cần thêm trigger tương tự cho bảng `birth_profiles` trong cùng migration.

---

## 5. Use Case Layer — tách rõ theo Single Responsibility

| Use Case | Input | Output | Business Rule chính |
|---|---|---|---|
| `CreateBirthProfileUseCase` | `CreateBirthProfileCommand` (label, fullName?, birthDate, birthTime?, isBirthTimeKnown, birthLocation, currentUserId) | `BirthProfile` | Validate invariant `isBirthTimeKnown`↔`birthTime` qua VO; không gọi Geocoding/LocationSearch (toạ độ đã được client resolve sẵn qua `GET /locations/search` trước đó — xem Mục 6.4) |
| `UpdateBirthProfileUseCase` | `UpdateBirthProfileCommand` (id, currentUserId, partial fields) | `BirthProfile` | Ownership check; optimistic lock; **không** động tới Chart nào (Mục 3.8) |
| `DeleteBirthProfileUseCase` | `{id, currentUserId}` | `void` | Ownership check; soft delete; không cascade Chart |
| `GetBirthProfileUseCase` | `{id, currentUserId}` | `BirthProfile` | Ownership check; 404 nếu không tồn tại (kể cả đã soft-delete — không phân biệt "không tồn tại" và "đã xoá" ra bên ngoài, tương tự tinh thần "không tiết lộ thông tin thừa" đã áp dụng ở Identity) |
| `ListBirthProfilesUseCase` | `{currentUserId, page, pageSize, sortBy, order}` | `{items, total}` | Luôn lọc theo `currentUserId` — không có tham số `userId` nào khác được truyền vào từ Controller (tránh 1 lớp lỗi "quên check ownership" hoàn toàn bằng thiết kế, không chỉ bằng review) |

**Không có `RestoreBirthProfileUseCase`** — đã bỏ khỏi phạm vi Sprint 2 (Mục 0, xác nhận).

**Không tạo "God Use Case":** không có `ManageBirthProfileUseCase` gộp chung create/update/delete — đúng yêu cầu đề bài, và đúng nguyên tắc đã áp dụng nhất quán ở Identity Module (`RegisterUserUseCase`/`LoginUserUseCase`/`RefreshTokenUseCase`/`LogoutUserUseCase` tách riêng dù có thể trông "gần giống nhau về shape").

**Điểm khác biệt quan trọng với Identity UseCase:** mọi UseCase ở đây (trừ `Create`) đều cần **ownership check tường minh** ngay trong `execute()`, đây là logic **mới, lặp lại giống nhau ở 3/5 UseCase** — cân nhắc 1 helper dùng chung `assertOwnership(resource, currentUserId)` (thuần function, đặt ở `domain/` vì là business rule, không phải infrastructure) để tránh lặp code nhiều lần — đề xuất đưa vào Milestone 3 (Mục 9), không phải viết lại từ đầu ở mỗi UseCase.

---

## 6. External Services

### 6.1 `ILocationSearchProvider` — vì sao tách khỏi Geocoding

```typescript
export interface ILocationSearchProvider {
  search(query: string, dateContext: Date): Promise<LocationSuggestion[]>;
}
interface LocationSuggestion {
  placeName: string;
  latitude: number;
  longitude: number;
  historicalTimezoneId: string;
}
```
Ánh xạ trực tiếp `GET /locations/search` (REST API Spec Mục 4.6) — nhận chuỗi tìm kiếm (autocomplete) + `date` (Quyết định 14.10, để resolve đúng timezone lịch sử), trả **nhiều gợi ý**.

### 6.2 `IGeocodingProvider` — khác `ILocationSearchProvider` ở điểm nào

```typescript
export interface IGeocodingProvider {
  geocode(placeName: string): Promise<Coordinates>;
}
```
**Lý do tách thành 2 Port riêng dù có thể cùng 1 vendor thực tế đứng sau (ví dụ cùng gọi Google Places API):** đây là 2 **use case khác nhau về mặt hành vi domain**, không phải 2 cách gọi cùng 1 thứ:
- `ILocationSearchProvider` — **autocomplete, trả nhiều kết quả mơ hồ**, phục vụ trực tiếp form nhập liệu (đúng 1-1 với `GET /locations/search`).
- `IGeocodingProvider` — **resolve chính xác 1 địa danh → 1 toạ độ**, dùng nội bộ nếu có luồng nào cần "convert placeName thành toạ độ" mà không qua UI autocomplete (ví dụ import dữ liệu hàng loạt, hoặc validate lại toạ độ đã lưu).

Tách theo Interface Segregation Principle: `CreateBirthProfileUseCase` **không cần** `ILocationSearchProvider` (vì toạ độ đã được client gửi sẵn, xem Mục 6.4) — nếu gộp 2 Port thành 1 interface lớn, `CreateBirthProfileUseCase` sẽ phải "biết" về method `search()` nó không bao giờ dùng.

### 6.3 `ITimezoneProvider`

```typescript
export interface ITimezoneProvider {
  resolveHistorical(coordinates: Coordinates, date: Date): Promise<string>; // trả IANA timezone id
}
```
Tách riêng khỏi `ILocationSearchProvider` dù về mặt vendor thực tế **có thể** cùng 1 provider (nhiều Geocoding API trả kèm timezone) — lý do tách: đây là 2 **capability khái niệm khác nhau** theo đúng Domain Spec Mục 5.2 ("Geolocation là 1 capability... domain chỉ quan tâm kết quả, không quan tâm cách tra ra") — nếu Sprint sau đổi vendor Geocoding nhưng muốn giữ nguyên vendor Timezone (hoặc ngược lại), tách Port riêng cho phép thay từng cái độc lập mà không đụng cái kia. Đây là áp dụng trực tiếp Dependency Inversion + Interface Segregation, không phải tách vì tách.

### 6.4 Vì sao `CreateBirthProfileUseCase` không tự gọi Geocoding/LocationSearch

**Quyết định quan trọng, cần xác nhận:** Theo đúng chú thích trong REST API Spec Mục 5.3 (*"latitude/longitude/historicalTimezoneId được lấy từ response của GET /locations/search — client không tự nhập tay tọa độ"*) — **luồng chuẩn là: Frontend tự gọi `GET /locations/search` trước, rồi mới gửi toạ độ đã resolve kèm trong `CreateBirthProfileRequest`.** Điều này có nghĩa: `CreateBirthProfileUseCase` **nhận toạ độ đã có sẵn**, chỉ validate (Mục 3.4), **không tự gọi** `IGeocodingProvider`/`ILocationSearchProvider` trong luồng tạo profile.

**Vậy `GET /locations/search` thuộc về đâu?** Đây chính là **TD-BP1** (Mục 1.5) — endpoint này (`Auth: Guest`, REST API Spec Mục 4.6, nằm ngoài Mục 4.3 BirthProfiles) về mặt ranh giới nghiệp vụ **không thuộc sở hữu của 1 user cụ thể nào** (khác hẳn CRUD BirthProfile, luôn cần `Auth: User, Admin`). **Đã chốt (OQ1):** giữ endpoint này trong `birth-profile` module (dùng chung Port `ILocationSearchProvider`), tách thành Use Case riêng biệt — đổi tên từ `SearchLocationsUseCase` (bản nháp đầu) thành **`SearchBirthLocationsUseCase`** để tên phản ánh đúng ngữ cảnh nghiệp vụ (tìm địa điểm phục vụ nhập liệu ngày sinh, không phải tìm kiếm địa điểm chung chung) — không có `currentUserId`, không ownership, tách biệt hoàn toàn khỏi 5 Use Case ở Mục 5.

### 6.5 Xem xét gộp 3 Provider thành 1 abstraction cấp cao hơn — hoãn tới Milestone 7

Đã cân nhắc theo góp ý: gộp `ILocationSearchProvider`/`IGeocodingProvider`/`ITimezoneProvider` thành 1 Port duy nhất nếu khảo sát cho thấy chúng luôn đi cùng 1 vendor. **Chưa thể quyết định ở giai đoạn lập kế hoạch này** — việc này phụ thuộc vào khảo sát vendor thật (ví dụ Google Places trả kèm timezone hay không, Nominatim có cần ghép thêm 1 vendor timezone riêng hay không), mà Milestone 7 (External Service Abstraction) mới là nơi chọn vendor cụ thể. Giữ nguyên 3 Port tách biệt ở tài liệu này (đúng lý do Interface Segregation đã nêu ở Mục 6.2-6.3) — **Milestone 7 sẽ tự quyết định lại** dựa trên vendor thật đã chọn: nếu 1 vendor duy nhất phục vụ đủ cả 3 khả năng và tách 3 Port chỉ tạo ra 3 Adapter cùng gọi 1 client bên dưới không có giá trị thực sự, gộp lại lúc đó là hợp lý và rẻ hơn (rename/merge 3 file thay vì thiết kế lại). Ghi chú này đưa vào Milestone 7 Implementation Plan khi tới lượt.

---

## 7. Presentation Layer

### 7.1 REST Endpoints — đối chiếu Auth/Validation cho từng route

| Endpoint | Auth | Middleware chain (theo AD3, Sprint 1 M8) |
|---|---|---|
| `POST /api/v1/birth-profiles` | User, Admin | `authMiddleware, requireAuth()` |
| `GET /api/v1/birth-profiles` | User, Admin | `authMiddleware, requireAuth()` |
| `GET /api/v1/birth-profiles/{id}` | User, Admin (chủ sở hữu) | `authMiddleware, requireAuth()` — ownership check nằm trong UseCase, không thêm middleware nào khác |
| `PATCH /api/v1/birth-profiles/{id}` | User, Admin (chủ sở hữu) | như trên |
| `DELETE /api/v1/birth-profiles/{id}` | User, Admin (chủ sở hữu) | như trên |
| `GET /api/v1/locations/search` | Guest | Không middleware auth nào (đúng REST API Spec Mục 4.6) |

**Không dùng `requireRole()`** (Sprint 1 M8) ở bất kỳ route nào — không có route nào giới hạn theo role cụ thể (`User`/`Admin` đều được phép như nhau, phân biệt duy nhất là ownership, xử lý ở UseCase).

### 7.2 Validation — Zod Schema

`createBirthProfileSchema`/`updateBirthProfileSchema` (partial) ánh xạ đúng `CreateBirthProfileRequest`/`UpdateBirthProfileRequest` (REST API Spec Mục 5.3) — range toạ độ, format ngày/giờ ISO-8601, `label` 1-100 ký tự. **`birthTime` optional nhưng bắt buộc nếu `isBirthTimeKnown=true`** — đây là 1 constraint **liên trường** (cross-field), cần `zod.refine()` ở Presentation (fail nhanh 400) **song song** với việc `BirthTime`/`BirthProfile` VO ở Domain cũng tự kiểm tra lại (Mục 2.3) — 2 lớp bảo vệ, đúng nguyên tắc đã dùng nhất quán từ Sprint 1.

### 7.3 RFC7807, OpenAPI, Swagger

Tái dùng nguyên `mapErrorToProblemDetails()`/`ProblemDetailsSchema` từ Error Kernel (Sprint 0, không đổi). `DomainError` (Mục 2.4, sau khi UseCase convert) map sang `422` (khớp REST API Spec: `POST /birth-profiles` → `Error Response: 400, 401, 422`). `birth-profile.openapi.ts` theo đúng pattern `auth.openapi.ts` (Sprint 1 M4) — 1 file `.openapi.ts` cho mỗi Controller, side-effect import từ `scripts/generate-openapi.ts`.

---

## 8. Testing Strategy

**Triết lý: viết test song song từng Milestone, không dồn hết vào cuối** — đúng yêu cầu đề bài, và đúng bài học rút ra từ Sprint 1 Milestone 9 (dồn coverage review vào cuối làm lộ ra nhiều gap tích luỹ qua 8 milestone trước).

| Loại test | Thuộc Milestone nào | Ghi chú |
|---|---|---|
| Unit Test cho Value Object (`BirthDate`/`BirthTime`/`BirthLocation`/`Coordinates`/`Timezone`) | Milestone 2 (Domain Design), viết **cùng lúc** với VO, không tách riêng | Đây là nơi cần test dày nhất — mọi invariant đều nằm ở đây, chi phí test rẻ (không cần mock gì) |
| Unit Test UseCase | Milestone 4-5, mỗi UseCase viết xong ngay lập tức có test kèm, không đợi Milestone riêng cho "viết test" | Mock `IBirthProfileRepository` + Port external service |
| Repository Integration Test | Milestone 3 (Prisma Foundation + Repository Layer), dùng lại `DatabaseTestHelper`/`docker-compose.test.yml` (Sprint 1 M2) | Test riêng: ownership filter đúng ở `softDelete`/`restore`, optimistic lock, soft-delete filter ở `findById`/`list` |
| API Test | Milestone 6 (Presentation Layer xong) | Đúng pattern Sprint 1 — `bootstrapApplication()` + DB test thật |
| Edge Case Review | Milestone 9 (dành riêng, học từ Sprint 1 M9) | Không đợi hết mọi Milestone — nhưng vẫn giữ 1 milestone review tổng thể cuối cùng để bắt các gap **liên-Milestone** (ví dụ: ownership check nhất quán giữa 4 UseCase có thực sự đồng bộ hành vi không) mà test riêng lẻ từng Milestone khó phát hiện |

**Edge Case cần chú ý đặc thù module này (khác Identity):**
- Concurrent update 2 field khác nhau cùng lúc (race condition qua `version` — tương tự `rotate()` Sprint 1 M6, nhưng đây là `update()` thường không phải rotation, vẫn cần 1 test xác nhận optimistic lock hoạt động dưới tải đồng thời thật, không chỉ tin tưởng logic).
- Toạ độ ở vĩ độ cực (Domain Spec Mục 5.2 — ảnh hưởng Placidus, dù *tính toán* thuộc Sprint 3, Birth Profile Module vẫn phải **lưu được** toạ độ hợp lệ ở vùng cực mà không tự ý chặn — dễ nhầm "toạ độ khó tính" với "toạ độ không hợp lệ").
- `birthDate` đúng bằng ngày hôm nay (boundary — REST API Spec nói `< ngày hiện tại`, cần test rõ boundary `=` bị từ chối).
- IANA timezone hợp lệ về format nhưng đã bị deprecated/đổi tên trong tzdb mới (ví dụ 1 số alias cũ) — `Intl.supportedValuesOf()` có xử lý alias đúng không, cần 1 test xác nhận thay vì giả định.

---

## 9. Milestone Breakdown

| # | Milestone | Objectives | Deliverables | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| 1 | **Prisma Foundation** | Tạo schema `astrology.birth_profiles`, migration, trigger `updated_at` | Migration file, `schema.prisma` cập nhật | Sprint 1 hoàn thành (đã có) | Migration chạy sạch trên DB test, không đụng schema `identity` |
| 2 | **Domain Design** | `BirthProfile` Entity, `BirthDate`/`BirthTime`/`BirthLocation`/`Coordinates`/`Timezone` VO, Domain Error | Code + Unit Test VO đầy đủ (Mục 8) | M1 | Mọi invariant Mục 2 có test, coverage Domain Layer cao hơn cả chuẩn Sprint 1 (≥90%) vì VO nhỏ, chi phí test rẻ |
| 3 | **Repository Layer** | `IBirthProfileRepository`, `PrismaBirthProfileRepository`, Mapper | Code + Repository Integration Test | M1, M2 | Ownership filter, soft-delete filter, optimistic lock đều có test riêng qua DB thật |
| 4 | **Use Case Layer — Create & Get** | `CreateBirthProfileUseCase`, `GetBirthProfileUseCase` | Code + Unit Test | M2, M3 | Ownership check đúng, invariant Domain Error được convert đúng sang `DomainError` (422) |
| 5 | **Use Case Layer — Update, Delete, List** | 3 UseCase còn lại | Code + Unit Test | M4 (tái dùng `assertOwnership` helper nếu tách ở M4) | Optimistic lock conflict → lỗi rõ ràng; List đúng phân trang |
| 6 | **Presentation Layer** | Controller, Route, Zod Schema, Response Mapper, OpenAPI cho 5 endpoint CRUD | Code + API Test | M5 | 5 endpoint hoạt động đúng REST API Spec, OpenAPI generate không lỗi |
| 7 | **External Service Abstraction** | `ILocationSearchProvider`/`IGeocodingProvider`/`ITimezoneProvider` Port + ít nhất 1 Adapter thật (chọn 1 vendor cụ thể, xem lại Mục 6.5 về khả năng gộp Port) + `SearchBirthLocationsUseCase` + `GET /locations/search` endpoint | Code + Unit Test (mock Port) | M1 (độc lập phần lớn với M2-M6, có thể làm song song) | `GET /locations/search` hoạt động đúng Guest access, trả `LocationSuggestionResponse[]` |
| 8 | **OpenAPI & Documentation Consistency** | Review toàn bộ OpenAPI module mới, cập nhật README (Folder Structure, thêm mô tả module) | OpenAPI Review Report | M6, M7 | Đúng quy trình đã có từ Sprint 1 M10 — diff route thật vs `openapi.json` |
| 9 | **Coverage Gap Review & Edge Case Testing** | Áp dụng đúng phương pháp Sprint 1 M9 cho module mới | Coverage Gap Report | M1-M8 | Domain ≥90%, Application ≥80%, không còn nhánh quan trọng chưa test |
| 10 | **Review, Cleanup & Release Prep** | Áp dụng đúng phương pháp Sprint 1 M10 | Final Review Report, cập nhật CHANGELOG | M1-M9 | Sẵn sàng merge `dev`→`main`, version bump |

**Thứ tự logic:** M1→M6 tuyến tính (mỗi Milestone phụ thuộc trực tiếp cái trước, đúng cách Sprint 1 đã làm), M7 có thể chạy **song song** với M4-M6 (ít phụ thuộc, chỉ cần M1 xong) nếu muốn rút ngắn timeline — nhưng đề xuất vẫn làm tuần tự đúng thứ tự trên để giữ nhất quán "review từng bước" như Sprint 1, trừ khi có áp lực thời gian thật sự.

---

## 10. Out of Scope

- Tính toán Chart (Swiss Ephemeris) — Sprint 3.
- Redis caching cho `GET /locations/search` (Mục 3.11) — quyết định hạ tầng riêng.
- Rectification (suy luận giờ sinh) — Mục 3.12.
- `BirthTimePrecision` nhiều mức (khoảng ước lượng) — chờ quyết định UX (OQ2).
- Giới hạn số lượng BirthProfile/user — chờ quyết định sản phẩm (OQ4).
- Restore BirthProfile đã xoá mềm — không có route, không có UseCase (Mục 0). Nếu cần, sẽ là 1 phần của Admin Module tương lai (OQ3).
- Admin xem/sửa BirthProfile của user khác — chưa có đặc tả (OQ3).
- Bulk import/export BirthProfile.
- Chia sẻ BirthProfile giữa nhiều user (collaboration).

---

## 11. Risks

| Rủi ro | Mitigation |
|---|---|
| Vendor Geocoding/LocationSearch thật (Milestone 7) có rate limit/chi phí — chưa cache (Mục 3.11) | Chọn vendor có free tier đủ rộng cho MVP (ví dụ Nominatim/OpenStreetMap — miễn phí nhưng rate limit thấp, cần đọc kỹ ToS trước khi chọn ở M7); thiết kế Port đã sẵn sàng thêm cache sau mà không đổi UseCase |
| `Intl.supportedValuesOf('timeZone')` (Mục 3.3) có thể lệch nhẹ so với tzdb mới nhất | Chấp nhận rủi ro thấp cho MVP; nếu phát hiện sai lệch thật ở Milestone 9 (Edge Case Review), cân nhắc thêm `@vvo/tzdb` làm nguồn bổ sung |
| Ownership check lặp lại ở 4 UseCase (Mục 5) dễ bị quên/làm sai ở 1 trong 4 nếu không cẩn thận | Tách `assertOwnership()` helper dùng chung càng sớm càng tốt (Milestone 4-5), không để mỗi UseCase tự viết lại |
| `astrology` schema là schema Prisma multiSchema thứ 2 — có thể phát sinh vấn đề chưa gặp ở Sprint 1 (chỉ có `identity`) khi 2 schema cùng tồn tại (ví dụ thứ tự migration, cross-schema FK) | Milestone 1 nên có bước "dry-run" migration đầy đủ trên DB test sạch trước khi coi là xong, đúng tinh thần Sprint 1 M2 review kỹ migration |
| Value Object (khái niệm mới của dự án) có thể bị áp dụng không nhất quán nếu không có ví dụ tham chiếu rõ ràng trước khi code | Milestone 2 nên có 1 đoạn "VO Convention" ngắn bổ sung vào Coding Standards & Conventions sau khi hoàn thành, để Sprint 3 (Chart, chắc chắn cần nhiều VO hơn nữa) có khuôn mẫu sẵn |

---

## 12. Deliverables

1. **Sprint 2 Birth Profile Module Technical Implementation Plan** — tài liệu này.
2. 10 Milestone Implementation Plan riêng (1 file/milestone, theo đúng format Sprint 1) — tạo lần lượt khi bắt đầu từng Milestone, không tạo trước hàng loạt.
3. Code hoàn chỉnh 4 layer cho `birth-profile` module, đúng cấu trúc Mục 1.2.
4. Prisma migration cho schema `astrology.birth_profiles`.
5. OpenAPI cập nhật (6 endpoint: 5 CRUD + `GET /locations/search`).
6. README cập nhật (Folder Structure phản ánh 2 module).
7. Coverage Gap Report (Milestone 9) + Final Review Report (Milestone 10), theo đúng mẫu Sprint 1.
8. Cập nhật `CHANGELOG.md` với entry Sprint 2.

---

## Open Questions

## Open Questions — ĐÃ XÁC NHẬN

| # | Quyết định |
|---|---|
| OQ1 | Giữ `GET /locations/search` trong `birth-profile` module; Use Case đổi tên thành **`SearchBirthLocationsUseCase`** |
| OQ2 | `BirthTimePrecision` chỉ 2 trạng thái `KNOWN`/`UNKNOWN` — có thể tiếp tục dùng thẳng `isBirthTimeKnown: boolean` nếu chưa thấy cần thiết phải bọc thành enum riêng ở Milestone 2, quyết định cụ thể để ngỏ cho lúc code (không ảnh hưởng thiết kế tổng thể) |
| OQ3 | Ownership áp dụng cho **mọi role**, kể cả Admin. Mọi thao tác thay người dùng thuộc về Admin Module/API riêng trong tương lai, chưa đặc tả |
| OQ4 | **Không** thêm `countByUserId()` vào Repository ở Sprint 2 — chỉ bổ sung khi Product chính thức yêu cầu giới hạn số lượng hồ sơ |

**Bổ sung — đã xử lý:**
- **Bỏ `RestoreBirthProfileUseCase`** khỏi Sprint 2 (Mục 0) — đúng YAGNI, không giữ lại "dự phòng" như bản nháp đầu.
- **Gộp 3 External Service Provider** — chưa quyết ở giai đoạn plan này, hoãn tới Milestone 7 khi đã khảo sát vendor thật (Mục 6.5).
- **Giữ nguyên kiến trúc còn lại** — không có thay đổi nào khác ngoài 6 điểm trên.

---

**Trạng thái: FROZEN ở cấp Sprint.** Tài liệu này sẵn sàng làm cơ sở tạo Implementation Plan chi tiết cho Milestone 1 (Prisma Foundation).
