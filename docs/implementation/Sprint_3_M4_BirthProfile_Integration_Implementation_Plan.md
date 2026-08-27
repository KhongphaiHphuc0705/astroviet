# Sprint 3 Backend — Milestone 4 Implementation Plan

## Final Consistency Check (thực hiện trước, trình bày trước khi vào plan chính)

Trước khi viết plan, đã đối chiếu prompt M4 với tài liệu đã đóng băng và phát hiện **1 xung đột thật cần xử lý minh bạch**, đúng nguyên tắc "identify the conflict, explain which source has authority":

**Xung đột:** Mục 14 của prompt ("Dependency Injection") mô tả kiến trúc mong muốn là `Chart Application → Port/interface → BirthProfile Application implementation`, và Mục 18 (gợi ý sequence) liệt kê bước "6. Integrate with existing Chart calculation pipeline" như một phần của M4. Điều này ngụ ý M4 cũng tạo file phía `chart/` (một Port + có thể 1 adapter/mapper).

**Nhưng** Sprint 3 Backend Implementation Plan §Milestone 4 (tài liệu cấp Sprint đã Confirmed, viết dựa trên inspect trực tiếp `.eslintrc.cjs` thật) quy định phạm vi hẹp hơn và cụ thể hơn nhiều: **"Deliverables: 2 file mới ở `birth-profile/`"**, **"Definition of Done: `birth-profile` module có thêm đúng 2 file mới..., không sửa file nào khác của Sprint 2 đã đóng"** — không hề nhắc tới bất kỳ file `chart/` nào. Hơn nữa, `CreateNatalChartUseCase` (nơi lẽ ra sẽ *sử dụng* 1 Port phía Chart) **chưa tồn tại** — nó là sản phẩm của **M6 (Application Layer)**, chưa bắt đầu.

**Quyết định (theo đúng nguyên tắc "tài liệu cụ thể hơn, đã inspect code thật, thắng tài liệu template chung"):** M4 trong plan này **chỉ giao hàng phía `birth-profile/`** (đúng Sprint 3 Plan). Việc tạo Port phía `chart/application/ports/` để tiêu thụ `GetBirthProfileSnapshotUseCase`, cùng mapper `BirthDataSnapshot → EngineInput`, thuộc về **M6** — vì Port đó chỉ có ý nghĩa khi có `CreateNatalChartUseCase` là consumer thật. M4 chuẩn bị **"nửa cung cấp"** (BirthProfile expose gì), M6 chuẩn bị **"nửa tiêu thụ"** (Chart dùng gì) — đây không phải là bỏ sót, mà là ranh giới milestone tự nhiên đã được Sprint 3 Plan chốt từ trước. Điều này được ghi rõ lại ở Mục 6.7 và Mục 14 dưới, không bị lặp lại như một Open Question.

---

## 1. Milestone Overview

**Milestone:** Sprint 3 Backend — Milestone 4: BirthProfile Integration.

**Vị trí trong Sprint 3:** M1 (Domain Foundation), M2 (Adapter), M3 (Calculation Engine) đã merge và review clean trên `dev` (đã verify trực tiếp qua `git clone` + chạy test thật). M4 **không phụ thuộc code của M1–M3** (độc lập hoàn toàn, chỉ chạm module `birth-profile`) — có thể code song song với M1–M3, nhưng đặt sau M3 trong trình tự logic vì đây là bước chuẩn bị input cho M6 sắp tới (Sprint 3 Backend Plan §Milestone 4, "Dependencies").

**Nguồn xác nhận chính thức cho scope M4** (Sprint 3 Backend Implementation Plan §Milestone 4):

> "Objective: Bổ sung điểm tích hợp cross-module duy nhất (Conflict #2 RESOLVED) + verify ranh giới ESLint thật sự enforce đúng (T-BOUNDARY-VERIFY, thay thế OQ-B3)."

"Conflict #2" (Natal Chart Domain Spec §36) là quyết định đã RESOLVED từ trước Sprint 3: **Chart module đọc BirthProfile qua Use Case (`getBirthProfileSnapshot`), không đọc thẳng Repository nội bộ của `birth-profile`.** M4 là nơi hiện thực hóa quyết định này thành code thật lần đầu tiên.

---

## 2. Objectives

1. Cung cấp **1 điểm truy cập công khai duy nhất** để lấy dữ liệu sinh (birth data) từ `birth-profile`, ở đúng shape mà Chart Engine cần (`EngineInput.birthData`), không rò rỉ bất kỳ chi tiết nội bộ nào của `birth-profile` (Entity, VO, Repository, Prisma).
2. Bảo toàn nguyên vẹn ownership model đã có từ Sprint 2 (`assertOwnership()`) — không tạo policy ownership thứ 2.
3. Bảo toàn nguyên vẹn hành vi Unknown Birth Time 2 trạng thái (KNOWN/UNKNOWN) đã đóng băng — không phát minh mức độ chính xác thứ 3.
4. Biến ranh giới cross-module (`chart → birth-profile`) từ "quy ước bằng lời" thành **rule ESLint thật sự chặn được** — đây là lần đầu tiên dự án có cross-module dependency thật, nên ranh giới phải được verify bằng thử nghiệm, không chỉ code review bằng mắt.
5. Chuẩn bị đúng "nửa cung cấp" của hợp đồng cross-module để M6 có thể bắt đầu ngay mà không cần thiết kế lại ranh giới `birth-profile` (Mục 11 prompt, Mục 14 dưới).

---

## 3. Scope

### 3.1 In Scope

**M4 tạo đúng 2 production file mới** (`GetBirthProfileSnapshotUseCase`, `birth-profile/index.ts`) — mọi thay đổi khác dưới đây là **supporting change bắt buộc phải có** để 2 file trên hoạt động được (DI, boundary enforcement, test), **không phải mở rộng scope tính năng BirthProfile**:

| Hạng mục | Loại | Vị trí | Ghi chú |
|---|---|---|---|
| `GetBirthProfileSnapshotUseCase` | **Production file mới** | `birth-profile/application/use-cases/get-birth-profile-snapshot.usecase.ts` | Use Case mới, đúng convention `UseCase` (không dùng "Service") |
| `birth-profile/index.ts` | **Production file mới** | `birth-profile/index.ts` (module-root) | File **hoàn toàn mới** — module `birth-profile` hiện **chưa có** module-root barrel nào (đã verify qua `find`, không tồn tại) |
| `composition-root.ts` | Supporting change (sửa) | `backend/src/composition-root.ts` | **Bắt buộc** — `GetBirthProfileSnapshotUseCase` cần được DI, không có cách nào khác để instantiate nó trong runtime thật |
| `.eslintrc.cjs` | Supporting change (sửa) | `backend/.eslintrc.cjs` | **Bắt buộc** — T-BOUNDARY-VERIFY yêu cầu cross-module boundary phải được enforce thật, không chỉ nằm trên giấy |
| Unit test cho Use Case mới | Supporting change (mới) | `tests/unit/modules/birth-profile/application/use-cases/get-birth-profile-snapshot.usecase.test.ts` | **Bắt buộc** — Use Case mới phải có test, mock `IBirthProfileRepository`, không cần DB thật |
| 1 test cố ý vi phạm boundary rồi xóa | Tạm thời, không commit | — | Verify rule ESLint mới thật sự reject (AC yêu cầu tường minh "không phải chỉ đọc code bằng mắt") |

**Ngoài đúng 5 thay đổi trên, M4 không tạo/sửa bất kỳ production file nào khác** trong `birth-profile/` hoặc `chart/`.

### 3.2 Out of Scope

- **Bất kỳ file nào trong `chart/`** — không tạo Port phía Chart, không tạo mapper `BirthDataSnapshot → EngineInput`, không đụng `chart-builder.ts`/`EngineInput` (xem Final Consistency Check ở trên — đây là ranh giới M4/M6 đã xác nhận, không phải bỏ sót).
- Chart persistence (Prisma model `charts`, Repository) → **M5**.
- REST Controller/Route/Schema/OpenAPI cho Chart → **M7**.
- `CreateNatalChartUseCase` — chưa tồn tại, thuộc **M6**.
- Bất kỳ tính năng BirthProfile mới nào (M4 không thêm field, không đổi API hiện có của `birth-profile`) — `composition-root.ts`/`.eslintrc.cjs`/test mới ở trên là **supporting changes cho chính 2 file M4 tạo ra**, không phải mở rộng feature.
- Sửa `birth-profile.entity.ts`, VO, Repository, Controller, Route đã đóng ở Sprint 2 — **AC/DoD của Sprint 3 Plan cấm tường minh** ("không sửa file nào khác của Sprint 2 đã đóng" — nghĩa là không sửa **production file khác ngoài 2 file mới + supporting changes đã liệt kê**).
- Admin bypass ownership — Sprint 2 đã quyết định không có, giữ nguyên, không mở lại.
- Interpretation, Synastry, Composite, Transit, Progression, Solar Return, Admin chart management, Redis, cơ chế auth mới.
- Redesign snapshot schema — snapshot schema (`chart_id.snapshot_*` cột) đã đóng băng ở Database Design Spec, M4 không đụng tới.



---

## 4. Existing Architecture & Relevant Decisions

Đã inspect trực tiếp code thật (không suy đoán) để xác nhận các quyết định sau vẫn còn nguyên hiệu lực và M4 phải tuân theo, không được tạo phiên bản thứ 2:

| Quyết định đã có | Bằng chứng (code thật) | Áp dụng vào M4 |
|---|---|---|
| Ownership check qua `assertOwnership(profile, currentUserId)` — throw `AuthorizationError(ErrorCode.FORBIDDEN, message)` | `birth-profile/application/shared/assert-ownership.ts` | `GetBirthProfileSnapshotUseCase` **tái sử dụng y hệt hàm này**, không viết lại logic so sánh `userId` |
| Not-found dùng `NotFoundError` (shared, `shared/errors/app-error.js`) | `GetBirthProfileUseCase` hiện tại throw đúng class này | `GetBirthProfileSnapshotUseCase` tái sử dụng y hệt |
| Soft-delete đã được lọc **ngay tại `findById()`** — trả `null` nếu `deleted_at !== null` | `PrismaBirthProfileRepository.findById()`, dòng `if (!record \|\| record.deleted_at !== null) return null;` | `GetBirthProfileSnapshotUseCase` **không cần tự check `deletedAt`** — case "soft-deleted" và "not found" đi chung 1 nhánh code, tự động, miễn phí |
| Không có admin bypass (Sprint 2) | Không có role-check nào trong `assertOwnership`/`GetBirthProfileUseCase` | Giữ nguyên, không thêm |
| `eslint-plugin-boundaries` đã bật từ Sprint 0, `module-root` type đã khai báo (`pattern: 'src/modules/*/index.ts'`) nhưng **chưa từng được tham chiếu** trong bất kỳ rule `boundaries/element-types` nào | Đọc trực tiếp `backend/.eslintrc.cjs` — 3 rule hiện có chỉ chặn `domain→{application,infrastructure,presentation}`, `application→{infrastructure,presentation}`, `infrastructure→presentation`; **không rule nào chặn domain-to-domain hoặc application-to-domain khác module** | Đây chính là lỗ hổng T-BOUNDARY-VERIFY phải vá — hiện tại `chart/application` **có thể** import thẳng `birth-profile/domain/...` mà không bị ESLint báo lỗi |
| `EngineInput.birthData` **chính là** `BirthDataSnapshot` (không có bản sao thứ 2) | Natal Chart Domain Spec §9.2: *"Không trùng lặp dữ liệu: EngineInput.birthData là chính BirthDataSnapshot lấy từ BirthProfile"* | Return type của `GetBirthProfileSnapshotUseCase` phải **field-for-field khớp** `EngineInputBirthData` (đã có ở M1: `birthDate: Date; birthTime: {hour,minute,second}\|null; isBirthTimeKnown: boolean; latitude: number; longitude: number; timezoneId: string`) |
| BirthTimePrecision 2 trạng thái (KNOWN/UNKNOWN), không có mức thứ 3 | `BirthProfile.isBirthTimeKnown: boolean` + INV-BP1 (`isBirthTimeKnown=false ⟺ birthTime=null`) đã enforce ở Entity | M4 chỉ **truyền qua nguyên trạng** `isBirthTimeKnown`/`birthTime`, không tự suy luận thêm |
| Timezone lưu bằng IANA string, không lưu offset cố định | `Timezone` VO — reject `+07:00` format, chỉ nhận IANA qua `Intl.DateTimeFormat` | Map `birthLocation.timezone.value` (string IANA) → `timezoneId` |

---

## 5. Current Codebase State

Đã verify trực tiếp qua `find`/`cat` trên `dev` (không suy đoán):

```
backend/src/modules/birth-profile/
├── application/
│   ├── errors/map-domain-error.ts
│   ├── shared/assert-ownership.ts                    ← tái sử dụng
│   └── use-cases/
│       ├── create-birth-profile.usecase.ts
│       ├── delete-birth-profile.usecase.ts
│       ├── get-birth-profile.usecase.ts               ← khuôn mẫu tham chiếu cho use case mới
│       ├── list-birth-profiles.usecase.ts
│       ├── search-birth-locations.usecase.ts
│       └── update-birth-profile.usecase.ts
│                                                        ← get-birth-profile-snapshot.usecase.ts CHƯA TỒN TẠI
├── domain/ (entities, value-objects, ports, errors — đầy đủ từ Sprint 2, không đụng)
├── infrastructure/ (Prisma repository, adapters — không đụng)
└── presentation/ (controller, routes, schemas, openapi — không đụng)
                                                          ← birth-profile/index.ts (module-root) CHƯA TỒN TẠI
```

**`composition-root.ts` hiện tại** (đã đọc trực tiếp): `birthProfileRepository = new PrismaBirthProfileRepository(prisma)` được khởi tạo **1 lần duy nhất**, dùng chung cho `CreateBirthProfileUseCase`/`GetBirthProfileUseCase`/`UpdateBirthProfileUseCase`/`DeleteBirthProfileUseCase`/`ListBirthProfilesUseCase`. M4 **tái sử dụng đúng instance này**, không tạo repository instance thứ 2.

**`chart/domain/value-objects/engine-input.vo.ts`** (M1, đã merge): `EngineInputBirthData` interface đã tồn tại đúng shape cần thiết (bảng ở Mục 4 trên) — M4 không cần đụng file này, chỉ cần đảm bảo `GetBirthProfileSnapshotUseCase` trả về dữ liệu **field-for-field tương thích cấu trúc** (structurally compatible) với interface này.

---

## 6. BirthProfile → Chart Integration Design

### 6.1 Dependency Direction

```
chart/*  (bất kỳ layer nào, hiện tại chưa có consumer thật — sẽ là M6)
   │
   ▼  (chỉ được phép qua đường này)
birth-profile/index.ts   ← module-root, export DUY NHẤT: GetBirthProfileSnapshotUseCase (+ types đi kèm, xem 6.2)
   │
   ▼
birth-profile/application/use-cases/get-birth-profile-snapshot.usecase.ts
   │
   ▼
birth-profile/domain/ports/birth-profile-repository.port.ts (IBirthProfileRepository — đã có từ Sprint 2)
```

`chart` **không bao giờ** import trực tiếp bất kỳ file nào dưới `birth-profile/domain/`, `birth-profile/infrastructure/`, `birth-profile/application/` — chỉ import từ `birth-profile/index.ts`.

### 6.2 Public Application Contract

**File:** `birth-profile/application/use-cases/get-birth-profile-snapshot.usecase.ts` (mirror 1:1 cấu trúc `get-birth-profile.usecase.ts` đã có).

```typescript
export interface GetBirthProfileSnapshotCommand {
  birthProfileId: string;
  requestingUserId: string;
}

export interface BirthDataSnapshot {
  birthDate: Date;
  birthTime: { hour: number; minute: number; second: number } | null;
  isBirthTimeKnown: boolean;
  latitude: number;
  longitude: number;
  timezoneId: string;
}

export class GetBirthProfileSnapshotUseCase {
  constructor(private readonly repository: IBirthProfileRepository) {}
  async execute(command: GetBirthProfileSnapshotCommand): Promise<BirthDataSnapshot>;
}
```

**[INFERENCE]** — tên field trong `command` (`birthProfileId`/`requestingUserId` thay vì `id`/`userId` như `GetBirthProfileCommand` hiện có) được đặt tường minh hơn vì đây là **contract cross-module** (tên field generic `id`/`userId` dễ gây nhầm lẫn khi đọc từ phía `chart`, còn nội bộ `birth-profile`'s `GetBirthProfileCommand` đã tồn tại thì giữ nguyên không đổi). Đây là lựa chọn đặt tên, không phải quyết định kiến trúc — có thể đổi lại `id`/`userId` cho nhất quán 100% với `GetBirthProfileCommand` nếu người phát triển ưu tiên tính nhất quán hơn tính tường minh; không chặn implementation.

**Tên `BirthDataSnapshot`** lấy đúng thuật ngữ đã dùng xuyên suốt Natal Chart Domain Spec (§9.1, §9.2, §35 Conflict #2) — không tự đặt tên mới.

**Module-root barrel** (`birth-profile/index.ts`, file mới hoàn toàn):

```typescript
export { GetBirthProfileSnapshotUseCase } from './application/use-cases/get-birth-profile-snapshot.usecase.js';
export type { GetBirthProfileSnapshotCommand, BirthDataSnapshot } from './application/use-cases/get-birth-profile-snapshot.usecase.js';
```

Chỉ export đúng 3 identifier trên (1 class + 2 type) — **không** export `IBirthProfileRepository`, `BirthProfile` entity, `GetBirthProfileUseCase`, hay bất kỳ gì khác của `birth-profile`, đúng AC Sprint 3 Plan ("chỉ export đúng `GetBirthProfileSnapshotUseCase`"). Export kèm 2 type là cần thiết để phía tiêu thụ (M6) type-check được `command`/return value mà không phải dùng `ReturnType<>` gián tiếp — không phải mở rộng scope, chỉ là điều kiện cần để type dùng được.

### 6.3 Data Mapping

| Nguồn (`BirthProfile` Entity, đã có) | Đích (`BirthDataSnapshot`) | Transform |
|---|---|---|
| `profile.birthDate.value` (getter trả `Date`, đã là UTC-midnight — xem `BirthDate.create()`) | `birthDate: Date` | Không transform, pass-through nguyên `Date` object |
| `profile.birthTime` (`BirthTime \| null`) | `birthTime: {hour,minute,second} \| null` | Nếu `null` → `null`; nếu có → destructure `{hour: bt.hour, minute: bt.minute, second: bt.second}` (không truyền thẳng instance `BirthTime`, tránh rò rỉ VO ra khỏi module) |
| `profile.isBirthTimeKnown` | `isBirthTimeKnown: boolean` | Pass-through |
| `profile.birthLocation.coordinates.latitude` | `latitude: number` | Pass-through (đơn vị độ thập phân, không đổi) |
| `profile.birthLocation.coordinates.longitude` | `longitude: number` | Pass-through |
| `profile.birthLocation.timezone.value` | `timezoneId: string` | Pass-through (IANA string, ví dụ `"Asia/Ho_Chi_Minh"`) |

**Lưu ý naming (không phải lỗi, chỉ ghi nhận):** Natal Chart Domain Spec §9.1 gọi field này là `historicalTimezoneId`, nhưng code thật `EngineInputBirthData` (M1) và `BirthLocation`/`Timezone` VO (Sprint 2) đều dùng tên ngắn hơn (`timezoneId`/`timezone`). M4 dùng đúng tên **code thật** (`timezoneId`) để khớp `EngineInputBirthData` — không tạo thêm 1 tên thứ 3. Đây là inconsistency thuật ngữ giữa tài liệu và code đã tồn tại từ trước M4 (không phải M4 gây ra), không cần sửa tài liệu trong phạm vi M4.

**Không có transform số học nào khác** (không đổi múi giờ, không đổi UTC ở bước này — việc quy đổi UTC là trách nhiệm `time-conversion.ts` của M3, xảy ra **sau** khi `EngineInput` được construct, không phải việc của M4).

### 6.4 Ownership

`GetBirthProfileSnapshotUseCase.execute()`:
1. `repository.findById(command.birthProfileId)` — trả `null` nếu không tồn tại **hoặc đã soft-delete** (đã lọc sẵn ở Repository, Mục 4).
2. Nếu `null` → `throw new NotFoundError('Birth profile not found')` (tái sử dụng nguyên class, message có thể giữ nguyên hoặc đổi nhẹ cho ngữ cảnh, không ảnh hưởng hành vi).
3. Nếu có → `assertOwnership(profile, command.requestingUserId)` (tái sử dụng nguyên hàm, không viết lại).
4. Map sang `BirthDataSnapshot` theo bảng Mục 6.3, trả về.

Không có bước ownership nào khác cần thêm — đây chính xác là pattern `GetBirthProfileUseCase` đã dùng, chỉ khác bước cuối (trả `BirthDataSnapshot` thay vì trả nguyên `BirthProfile` entity).

### 6.5 Unknown Birth Time

M4 **không** implement bất kỳ logic rẽ nhánh nào cho Unknown Birth Time — chỉ truyền qua nguyên trạng `isBirthTimeKnown`/`birthTime` (Mục 6.3). Toàn bộ hành vi rẽ nhánh (bỏ House/Angle Calculator, anchor time 12:00 khi tính Planet) đã được implement ở **M3** (`ChartBuilder`, `time-conversion.ts`) — M4 không lặp lại, không cần biết logic đó tồn tại.

Giữ nguyên đúng 2 trạng thái `KNOWN`/`UNKNOWN` (biểu diễn bằng `isBirthTimeKnown: boolean`, không dùng enum 3 giá trị) — không phát minh mức độ chính xác mới (ví dụ "biết giờ nhưng không biết phút" — **không có trong bất kỳ tài liệu nào**, không tự thêm).

### 6.6 Error Handling

| Tình huống | Error class | Nguồn |
|---|---|---|
| `birthProfileId` không tồn tại | `NotFoundError` (shared) | Tái sử dụng, đã có ở `GetBirthProfileUseCase` |
| `birthProfileId` tồn tại nhưng đã soft-delete | `NotFoundError` (shared) — **cùng nhánh với "không tồn tại"**, không phân biệt | `findById()` đã lọc tại tầng Repository (Mục 4) — Use Case không cần tự check `deletedAt` |
| `birthProfileId` thuộc user khác | `AuthorizationError(ErrorCode.FORBIDDEN, ...)` | Tái sử dụng `assertOwnership()` nguyên trạng |
| Dữ liệu `BirthProfile` không hợp lệ để tính Chart (ví dụ tọa độ hỏng) | **Không xảy ra được** — `Coordinates`/`BirthDate`/`BirthTime`/`Timezone` VO đã validate tại thời điểm tạo/cập nhật Profile (Sprint 2); dữ liệu trong DB luôn hợp lệ theo invariant đã enforce | Không cần thêm error class nào cho case này ở M4 |

**Không thêm bất kỳ error class mới nào** (`BirthProfileNotFound`, `BirthProfileNotOwned`, `BirthProfileUnavailable`, `InvalidBirthProfileForChart` — **tất cả đều KHÔNG cần tạo**) — 2 error class đã có (`NotFoundError`, `AuthorizationError`) bao phủ đủ mọi tình huống thật sự có thể xảy ra. Đây là câu trả lời trực tiếp cho Mục 12 của prompt: không có case nào trong danh sách gợi ý cần error riêng.

M4 **không tự map error sang RFC7807** — đó là trách nhiệm Presentation layer của module gọi đến (M7, khi Chart có Controller riêng) hoặc middleware error-handler chung đã có sẵn (map theo `instanceof`, không đổi ở M4).

### 6.7 Dependency Injection

**M4 chỉ wiring phía `birth-profile`:**

```typescript
// composition-root.ts — thêm vào block "Birth Profile Module" đã có
const getBirthProfileSnapshotUseCase = new GetBirthProfileSnapshotUseCase(birthProfileRepository);
```

Tái sử dụng đúng `birthProfileRepository` instance đã tồn tại (Mục 5) — không tạo repository instance thứ 2, không tạo Prisma client thứ 2.

Thêm `getBirthProfileSnapshotUseCase` vào object `useCases` được `createApp`/composition-root trả về (mirror cách các use case khác đã được expose), để **M6 có thể lấy ra và inject vào `CreateNatalChartUseCase`** khi milestone đó bắt đầu.

**M4 không wiring phía `chart`** (xem Final Consistency Check) — không có `chart/application/ports/` nào được tạo ở M4. Khi M6 bắt đầu, M6 sẽ:
1. Định nghĩa 1 Port trong `chart/application/ports/` (tên cụ thể là quyết định của M6, ví dụ `IBirthProfileQueryPort` hoặc tương đương — **không đặt tên trước ở đây**, tránh áp đặt quyết định của milestone khác).
2. `CreateNatalChartUseCase` phụ thuộc Port đó qua constructor injection (không phụ thuộc thẳng `GetBirthProfileSnapshotUseCase`).
3. Composition-root (ở M6) bind instance `getBirthProfileSnapshotUseCase` (đã có từ M4) vào Port đó — có thể cần 1 lớp adapter mỏng nếu chữ ký không khớp 100%, hoặc dùng thẳng nếu TypeScript structural typing đã đủ tương thích.

Việc này **không redesign lại `birth-profile` boundary** — M6 chỉ thêm 1 lớp mỏng phía `chart`, đúng như Mục 11 prompt yêu cầu ("without redesigning the BirthProfile boundary later").

---

## 7. Detailed Implementation Tasks

### M4-T1 — Implement `GetBirthProfileSnapshotUseCase`

- **Objective:** Tạo Use Case mới trả `BirthDataSnapshot` từ `birthProfileId` + `requestingUserId`.
- **Files:** `birth-profile/application/use-cases/get-birth-profile-snapshot.usecase.ts` (mới).
- **Dependencies:** Không (dùng port `IBirthProfileRepository` đã có).
- **Steps:**
  1. Định nghĩa `GetBirthProfileSnapshotCommand`, `BirthDataSnapshot` (Mục 6.2).
  2. Implement `execute()`: `findById` → check `null` → `assertOwnership` → map (Mục 6.3, 6.4).
  3. Không thêm logic nào khác ngoài 3 bước trên.
- **Test requirements:** Xem Mục 9, nhóm "Unit — Use Case".

### M4-T2 — Tạo `birth-profile/index.ts` (module-root barrel)

- **Objective:** Barrel export đúng 3 identifier (Mục 6.2).
- **Files:** `birth-profile/index.ts` (mới).
- **Dependencies:** M4-T1 (cần class/type đã tồn tại để export).
- **Steps:** Export đúng như snippet Mục 6.2 — không export thêm.

### M4-T3 — T-BOUNDARY-VERIFY: bổ sung rule ESLint chặn cross-module

- **Objective:** Biến `module-root` type (đã khai báo, chưa dùng) thành rule thật sự chặn cross-module import sai.
- **Files:** `backend/.eslintrc.cjs` (sửa).
- **Dependencies:** Không (độc lập với T1/T2 về mặt kỹ thuật, nhưng nên làm sau khi có `birth-profile/index.ts` để có gì đó thật để test).
- **Steps (CONFIRMED — dùng đúng 2 rule chuyên biệt, không mô phỏng bằng capture):**
  1. Giữ nguyên `boundaries/element-types` cho đúng trách nhiệm của nó — quan hệ **layer/module dependency** (`domain→{application,infrastructure,presentation}`, v.v.) — không nhồi thêm logic cross-module vào rule này.
  2. Thêm rule **mới, tách biệt**: `boundaries/entry-point` — đây là rule chuyên dụng của `eslint-plugin-boundaries`, thiết kế đúng cho mục đích "1 element chỉ được import qua entry point đã định nghĩa (`module-root`), không được import thẳng file bên trong element đó". Cấu hình rule này cho element `module-root`/mỗi module: chỉ file `index.ts` được phép là điểm vào hợp lệ khi import từ **ngoài module**; import nội bộ trong cùng module không bị ảnh hưởng.
  3. Không xóa 3 rule hiện có trong `boundaries/element-types` — 2 rule (`element-types`, `entry-point`) cùng tồn tại, mỗi rule phụ trách đúng 1 trách nhiệm (layer dependency vs. cross-module entry point) — thiết kế sạch hơn dồn hết vào 1 rule.
- **Test requirements:** Viết 1 file import thử nghiệm cố ý sai (ví dụ trong `chart/application/` import thẳng `birth-profile/domain/ports/birth-profile-repository.port.ts`), chạy `npm run lint`, xác nhận `boundaries/entry-point` **thật sự báo lỗi**, sau đó **xóa file thử nghiệm** (không commit) — đúng yêu cầu AC "xác nhận bằng 1 test thử cố ý vi phạm rồi xóa đi, không phải chỉ đọc code bằng mắt".

### M4-T4 — Unit test cho `GetBirthProfileSnapshotUseCase`

- **Objective:** Cover đủ nhánh hành vi.
- **Files:** `tests/unit/modules/birth-profile/application/use-cases/get-birth-profile-snapshot.usecase.test.ts` (mới).
- **Dependencies:** M4-T1.
- **Test requirements:** Xem Mục 9.

### M4-T5 — Review tổng thể

- **Objective:** Xác nhận toàn bộ M4 sạch, không phá vỡ gì đã có.
- **Files:** Không tạo file mới.
- **Dependencies:** M4-T1 đến M4-T4.
- **Steps:** `npm run lint`/`typecheck`/`test`/`build` full backend (không chỉ scope `birth-profile`) — vì đây là lần đầu có cross-module rule mới, cần chắc chắn không vô tình chặn nhầm import hợp lệ nào ở `identity`/`birth-profile` nội bộ đã có từ trước.

---

## 8. File Change Plan

| File | Trạng thái | Layer | Lý do |
|---|---|---|---|
| `birth-profile/application/use-cases/get-birth-profile-snapshot.usecase.ts` | **Mới** | Application | Public contract cho Chart tiêu thụ (Mục 6.2) |
| `birth-profile/index.ts` | **Mới** | Module-root | Entry point duy nhất cho module khác truy cập `birth-profile` |
| `backend/.eslintrc.cjs` | **Sửa** | Config (cross-cutting) | T-BOUNDARY-VERIFY — bổ sung rule, không xóa rule cũ |
| `backend/src/composition-root.ts` | **Sửa** | Composition Root | Thêm `getBirthProfileSnapshotUseCase`, import từ `birth-profile/index.ts` (module-root) thay vì đường dẫn sâu như các use case khác — **đây sẽ là import đầu tiên trong composition-root đi qua module-root thay vì trực tiếp** |
| `tests/unit/modules/birth-profile/application/use-cases/get-birth-profile-snapshot.usecase.test.ts` | **Mới** | Test | Unit test Use Case |

**Không sửa:** bất kỳ file nào khác trong `birth-profile/domain/`, `infrastructure/`, `presentation/`; bất kỳ file nào trong `chart/`.

---

## 9. Testing Strategy

Theo đúng phân loại prompt yêu cầu (Mục 15/16):

### 9.1 Unit test (Use Case) — `tests/unit/modules/birth-profile/application/use-cases/`

Mock `IBirthProfileRepository` (không cần DB thật, không cần Prisma), theo đúng pattern test hiện có của `GetBirthProfileUseCase` (nếu có, dùng làm khuôn mẫu):

| Test case | Input | Expect |
|---|---|---|
| BirthProfile tồn tại, đúng chủ sở hữu, biết giờ sinh | `findById` trả profile hợp lệ, `isBirthTimeKnown=true` | Trả đúng `BirthDataSnapshot`, field khớp 1-1 theo bảng Mục 6.3 |
| BirthProfile tồn tại, đúng chủ sở hữu, không biết giờ sinh | `isBirthTimeKnown=false`, `birthTime=null` | `BirthDataSnapshot.birthTime=null`, `isBirthTimeKnown=false` |
| BirthProfile không tồn tại | `findById` trả `null` | `execute()` reject với `NotFoundError` |
| BirthProfile thuộc user khác | `findById` trả profile có `userId` khác `requestingUserId` | `execute()` reject với `AuthorizationError` (kiểm `errorCode===ErrorCode.FORBIDDEN`) |
| BirthProfile đã soft-delete | `findById` trả `null` (đã lọc sẵn ở tầng repository — mock trả `null` để mô phỏng đúng hành vi thật) | Cùng nhánh `NotFoundError` — verify **không có nhánh code riêng** nào xử lý case này |
| Mapping tọa độ/timezone chính xác | Profile với `latitude=10.5`, `longitude=106.7`, `timezone='Asia/Ho_Chi_Minh'` | `BirthDataSnapshot.latitude===10.5`, `.longitude===106.7`, `.timezoneId==='Asia/Ho_Chi_Minh'` — không lệch, không làm tròn |

### 9.2 Boundary/Architecture test — thủ công 1 lần, không phải test tự động chạy trong CI

Đúng như Mục 10 dưới — thử nghiệm import sai, xác nhận ESLint reject, xóa đi. **Không** viết thành 1 test case tự động trong `vitest` (ESLint rule tự nó đã là cơ chế bảo vệ liên tục qua CI lint step, không cần duplicate bằng test runtime).

### 9.3 Không cần Integration test riêng cho M4

M4 không tạo bất kỳ HTTP endpoint hay luồng end-to-end nào mới (đó là M6/M7) — Unit test cho Use Case là đủ, đúng nguyên tắc "test behavior, not lines" (Mục 15 prompt) và tránh over-testing 1 milestone thuần nội bộ.

---

## 10. Boundary / Architecture Verification

**Vấn đề cụ thể đã verify bằng cách đọc trực tiếp `.eslintrc.cjs`:** `boundaries/elements` đã khai báo `module-root` (`pattern: 'src/modules/*/index.ts'`) từ Sprint 0, nhưng **0 rule nào trong `boundaries/element-types` tham chiếu tới `module-root`**. 3 rule hiện có chỉ enforce quan hệ `domain/application/infrastructure/presentation` — vì các type này dùng wildcard `*` (khớp mọi module), 1 hệ quả phụ là **domain-to-domain giữa 2 module khác nhau hiện tại không bị chặn** (`chart/domain` có thể import `birth-profile/domain` mà ESLint không báo lỗi gì, vì rule chỉ nói "domain không được import application/infrastructure/presentation", không nói gì về "domain không được import domain của module khác").

**Cách vá — CONFIRMED, dùng đúng 2 rule chuyên biệt của `eslint-plugin-boundaries`, không mô phỏng bằng capture:**

`eslint-plugin-boundaries` cung cấp sẵn 2 rule với 2 trách nhiệm tách biệt, và cả hai đều tiếp tục dùng song song trong `.eslintrc.cjs`:
- **`boundaries/element-types`** (đã có từ Sprint 0, giữ nguyên) — chỉ phụ trách quan hệ **layer/module dependency** (`domain→...`, `application→...`, `infrastructure→...`).
- **`boundaries/entry-point`** (rule mới, thêm ở T-BOUNDARY-VERIFY) — chuyên dụng đúng cho mục đích "1 element chỉ được import qua entry point đã định nghĩa, không được import thẳng file bên trong element đó" (đúng tài liệu plugin mô tả). Áp dụng rule này lên `module-root` để bắt buộc: từ ngoài 1 module, chỉ `index.ts` là điểm vào hợp lệ; import nội bộ trong cùng module không bị ảnh hưởng.

Tách 2 rule theo đúng 2 trách nhiệm (layer dependency vs. cross-module entry point) là thiết kế sạch hơn nhồi chung vào `element-types` — không cần tự mô phỏng cơ chế "capture module" thủ công.

**Tiêu chí xác nhận đã pass** (không phụ thuộc cơ chế cụ thể ở trên):
1. `chart/**` (giả lập, vì `chart` module chưa có consumer thật) import `birth-profile/index.ts` → **không lỗi**.
2. `chart/**` (giả lập) import thẳng bất kỳ file nào dưới `birth-profile/domain/`, `birth-profile/application/`, `birth-profile/infrastructure/` → **ESLint error**, có message rõ ràng hướng dẫn dùng module-root.
3. Import nội bộ trong cùng `birth-profile` (ví dụ Use Case import Entity của chính module mình) → **vẫn hoạt động bình thường**, không bị rule mới chặn nhầm.
4. `identity` module (không liên quan M4) chạy `npm run lint` vẫn sạch — xác nhận rule mới không có tác dụng phụ ngoài ý muốn.

---

## 11. Risks & Mitigations

| Risk | Severity | Likelihood | Mitigation | Detection |
|---|---|---|---|---|
| Rule ESLint mới chặn nhầm import hợp lệ đã có (nội bộ `identity`/`birth-profile`) | Cao | Trung bình (rule mới, lần đầu áp dụng) | Chạy full `npm run lint` toàn backend sau khi thêm rule (M4-T5), không chỉ lint riêng file mới | CI lint step full repo |
| Rule ESLint mới **không** chặn được import sai (rule viết sai, có lỗ hổng) | Cao | Thấp (`boundaries/entry-point` là rule chuyên dụng có sẵn của plugin, không phải tự mô phỏng logic phức tạp) | Bắt buộc thử nghiệm import sai thật (Mục 10), không tin tưởng chỉ đọc cấu hình | Thử nghiệm thủ công + xóa, ghi lại trong PR description là đã verify |
| `GetBirthProfileSnapshotUseCase` vô tình trả thẳng VO (`BirthTime`/`Coordinates`/`Timezone` instance) thay vì primitive, làm rò rỉ kiểu nội bộ `birth-profile` ra ngoài | Trung bình | Thấp (nếu code đúng theo Mục 6.3 mapping table) | Code review đối chiếu đúng bảng Mục 6.3; `BirthDataSnapshot` interface dùng toàn `number`/`string`/`Date`/plain object, TypeScript sẽ tự báo lỗi type nếu lỡ gán nhầm VO instance | `tsc --noEmit` |
| Trùng lặp logic ownership (viết `assertOwnership` phiên bản 2 trong use case mới thay vì tái sử dụng) | Trung bình | Thấp | Code review — `GetBirthProfileSnapshotUseCase` phải import và gọi đúng `assertOwnership` đã có, không viết lại so sánh `userId` | Code review checklist |
| `composition-root.ts` tạo `PrismaBirthProfileRepository` instance thứ 2 (thay vì tái dùng) | Thấp | Thấp | Code review — chỉ 1 dòng `new GetBirthProfileSnapshotUseCase(birthProfileRepository)` dùng biến đã có sẵn | Code review |
| Test pass nhưng boundary thực tế vẫn bị vi phạm (rule không hoạt động, nhưng không ai thử) | Cao | Trung bình nếu bỏ qua bước thử nghiệm thủ công | Đây chính là lý do AC yêu cầu tường minh bước thử-rồi-xóa, không chấp nhận "code trông đúng" | Bước thử nghiệm bắt buộc trong T-BOUNDARY-VERIFY |
| Circular module dependency (`birth-profile` vô tình import `chart`) | Thấp (không có lý do kỹ thuật nào khiến `birth-profile` cần biết `chart` tồn tại) | Rất thấp | Code review — `birth-profile/index.ts` và use case mới không import bất kỳ gì từ `chart/` | `tsc --noEmit`, không có cycle nào trong dependency graph |
| Error semantics rò rỉ HTTP concern vào Application layer (ví dụ tự thêm `statusCode` vào `NotFoundError` cho tiện M7 sau này) | Thấp | Thấp | `NotFoundError`/`AuthorizationError` giữ nguyên như đã thiết kế (không biết HTTP), việc map RFC7807 vẫn ở Presentation layer/middleware, M4 không đụng | Code review |

---

## 12. Open Questions

### OQ-M4-1 — Cơ chế ESLint cụ thể cho T-BOUNDARY-VERIFY: ✅ RESOLVED (Confirmation.md)

**Quyết định:** Dùng đúng 2 rule chuyên biệt, tách trách nhiệm rõ ràng — không mô phỏng bằng `capture` thủ công:
- `boundaries/element-types` — giữ nguyên, phụ trách layer/module dependency (`domain→...`, `application→...`, `infrastructure→...`).
- `boundaries/entry-point` (mới) — rule chuyên dụng của `eslint-plugin-boundaries`, thiết kế đúng cho mục đích "1 element chỉ được import qua entry point đã định nghĩa (`module-root`/`index.ts`), không được import thẳng file bên trong element đó" (đúng tài liệu plugin). Áp dụng cho `module-root`.

Lý do chọn: 2 rule, 2 trách nhiệm tách biệt (layer dependency vs. cross-module entry point) là thiết kế sạch hơn nhồi toàn bộ logic vào `element-types` — không cần tự mô phỏng cơ chế phân biệt module bằng `capture`. Chi tiết implementation: Mục 7 (M4-T3), Mục 10.

**Không còn Open Question nào chặn M4.** Các điểm tưởng chừng mơ hồ ban đầu (Port phía Chart có thuộc M4 không? Error class mới có cần không? Soft-delete xử lý sao? Cơ chế ESLint cụ thể?) đều đã được giải quyết dứt điểm bằng cách đối chiếu trực tiếp Sprint 3 Backend Plan (đã Confirmed), code thật (Mục 4–6), và Confirmation.md — không cần để mở.

**Không mở lại các quyết định đã đóng băng** (đúng yêu cầu Mục 20 prompt): licensing AGPL/open-source, 2-state BirthTimePrecision, no-admin-bypass, boundary enforcement decision, kiến trúc hiện có, snapshot strategy — **không xuất hiện lại** trong plan này như Open Question.

---

## 13. M4 Acceptance Criteria

### Functional
1. `GetBirthProfileSnapshotUseCase.execute({birthProfileId, requestingUserId})` trả đúng `BirthDataSnapshot` khi profile tồn tại và thuộc đúng user.
2. Field mapping đúng 100% theo bảng Mục 6.3 — không lệch đơn vị, không đổi timezone.
3. Ownership enforce đúng — profile thuộc user khác → `AuthorizationError`.
4. Unknown birth time truyền qua nguyên trạng — không có logic suy luận thêm ở M4.

### Architectural
5. `chart/**` (giả lập test import) chỉ có thể truy cập `birth-profile` qua `birth-profile/index.ts`.
6. Không có import trực tiếp nào từ `chart` vào `birth-profile/domain|application|infrastructure` trong toàn bộ codebase (hiện tại — vì `chart` chưa tiêu thụ gì, điều kiện này tự động đúng, nhưng rule phải sẵn sàng chặn khi M6 bắt đầu).
7. Không có circular dependency giữa `chart` và `birth-profile`.
8. `npm run lint` pass với rule `boundaries` mới, cả 2 chiều (chặn đúng case sai, không chặn nhầm case đúng).

### Data
9. Mapping deterministic — cùng `BirthProfile` input luôn cho cùng `BirthDataSnapshot` output.
10. Tọa độ/timezone/ngày giờ giữ nguyên đơn vị và định dạng gốc (độ thập phân, IANA string, `Date` object) — không convert.
11. `BirthDataSnapshot` không chứa reference tới `BirthProfile` entity gốc hay bất kỳ VO nào — chỉ primitive/plain object, đảm bảo không có mutable reference nào rò rỉ.

### Testing
12. Đủ 6 test case ở Mục 9.1 pass.
13. Toàn bộ test Sprint 0–3 hiện có (134+ test của `chart`, toàn bộ test `identity`/`birth-profile` cũ) vẫn pass sau khi thêm rule ESLint mới.

### Quality
14. `npm run lint`/`typecheck`/`test`/`build` toàn backend pass sạch.
15. Không có vi phạm kiến trúc mới nào phát sinh ở bất kỳ module nào khác (verify bằng full lint, không chỉ lint riêng `birth-profile`).

---

## 14. M5 Handoff Contract

Sau khi M4 hoàn thành, **M5 (Chart Persistence) không phụ thuộc trực tiếp vào M4** — M5 làm việc với `Chart` Entity/Repository của `chart` module, không liên quan gì tới `birth-profile`. Handoff thật sự quan trọng của M4 là cho **M6**, không phải M5 (khác với cách đặt câu hỏi ở Mục 22 prompt — nêu rõ ở đây để không gây hiểu nhầm):

> M6 có thể giả định: tồn tại `GetBirthProfileSnapshotUseCase` (import qua `birth-profile/index.ts`), nhận `{birthProfileId, requestingUserId}`, trả về `BirthDataSnapshot` field-for-field tương thích `EngineInputBirthData` (M1), đã tự xử lý đúng ownership (`AuthorizationError`) và not-found/soft-deleted (`NotFoundError`, gộp chung 1 nhánh) — M6 chỉ cần viết 1 Port + mapper mỏng phía `chart/application/`, không cần biết gì về cấu trúc nội bộ `birth-profile`. Rule ESLint boundary đã có sẵn và đã verify hoạt động, nên M6 code sai (import nhầm domain/infrastructure của `birth-profile`) sẽ bị chặn ngay từ lint, không phải đợi tới code review.

M5 chỉ cần biết: `Chart` snapshot lưu **dữ liệu đã copy** (qua `EngineInput` mà `ChartBuilder`, M3, đã build hoàn chỉnh) — không lưu reference sống tới `BirthProfile`. Điều này **đã đúng từ M3** (Chart Entity không có field nào tham chiếu `BirthProfile` object, chỉ có `birthProfileId: string | null` — id thuần, không phải object) — M4 không thay đổi gì về việc này, chỉ xác nhận lại nó vẫn đúng.

---

## 15. Implementation Order & Dependency Graph

```
(Không phụ thuộc M1–M3 code)
        │
        ▼
M4-T1 (GetBirthProfileSnapshotUseCase)
        │
        ▼
M4-T2 (birth-profile/index.ts) ──┐
        │                         │
        ▼                         │
M4-T4 (Unit test)                 │
        │                         │
        └─────────────┬───────────┘
                       ▼
              M4-T3 (T-BOUNDARY-VERIFY — nên làm sau khi có module-root thật để test)
                       │
                       ▼
              M4-T5 (Review tổng thể: lint/typecheck/test/build full backend)
```

T4 (test cho use case) có thể viết song song/ngay sau T1, không cần chờ T2/T3. T3 nên làm sau T2 vì cần `birth-profile/index.ts` tồn tại để có gì đó thật để thử nghiệm import qua module-root. T5 luôn là bước cuối.

---

## 16. Definition of Done

- Đúng 2 production files mới thuộc `birth-profile/`: `get-birth-profile-snapshot.usecase.ts` và `index.ts`. Ngoài hai file này, M4 chỉ được phép có các supporting changes đã liệt kê tường minh: `.eslintrc.cjs`, `composition-root.ts` và unit test tương ứng; không tạo/sửa production file nào khác trong `birth-profile` hoặc `chart`.
- Đúng 0 file mới/sửa trong `chart/` (xem Final Consistency Check).
- `backend/.eslintrc.cjs` có rule mới, đã verify bằng thử nghiệm import sai thật (làm rồi xóa) — không chỉ đọc cấu hình bằng mắt.
- `composition-root.ts` wiring `getBirthProfileSnapshotUseCase`, tái sử dụng đúng `birthProfileRepository` instance có sẵn.
- Unit test đủ 6 case ở Mục 9.1, tất cả pass.
- `npm run lint`/`typecheck`/`test`/`build` toàn backend sạch — không chỉ scope `birth-profile`.
- Không error class mới nào được thêm (tái sử dụng `NotFoundError`/`AuthorizationError` nguyên trạng).
- Ownership logic không bị nhân bản — chỉ 1 nơi duy nhất (`assertOwnership`) trong toàn bộ codebase.
- `BirthDataSnapshot` không rò rỉ VO/Entity nào của `birth-profile` — chỉ primitive/plain object.
- M6 có thể bắt đầu ngay sau M4 mà không cần redesign lại bất kỳ phần nào của `birth-profile` boundary (Mục 14).
