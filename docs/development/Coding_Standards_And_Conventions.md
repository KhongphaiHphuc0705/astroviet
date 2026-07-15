# Coding Standards & Conventions
## AstroViet Platform — Code Style Guide

| | |
|---|---|
| **Loại tài liệu** | Coding Standards & Conventions |
| **Phiên bản** | 1.1 — bổ sung quy tắc ESM `.js` extension (Mục 1, 15.1) theo quyết định 12/07/2026: dự án dùng Native ESM thay vì CommonJS |
| **Ngày soạn** | 11/07/2026 (khởi tạo) — cập nhật 12/07/2026 |
| **Tác giả** | Staff Software Engineer / Tech Lead |
| **Tài liệu nguồn (Single Source of Truth)** | 1. PRD · 2. Astrology Domain Specification · 3. Astrology Engine Specification · 4. REST API Specification v1.1 · 5. Database Design Specification v1.1 · 6. Project Architecture Specification v1.1 · 7. Backend Implementation Guide v1.1 |
| **Mục tiêu** | Đảm bảo mọi source code trong dự án có phong cách **thống nhất, dễ đọc, dễ review, dễ bảo trì** — bất kể do 1 Developer hay AI Coding Assistant viết |

> **Phân biệt với Backend Implementation Guide:** Guide (tài liệu 7) trả lời "code nên tổ chức theo kiến trúc nào" (layer, module, pattern). Tài liệu này trả lời **"code nên trông như thế nào ở mức câu chữ"** — naming, format, comment, commit message. Hai tài liệu bổ sung cho nhau, không lặp lại.

> **Nguyên tắc kế thừa:** Mọi package/công cụ cụ thể nêu ở đây (ESLint, Prettier, Vitest...) là **default implementation cho MVP** (đúng nguyên tắc đã chốt ở Backend Implementation Guide) — có thể thay thế công cụ tương đương miễn giữ nguyên *quy tắc* mà công cụ đó thực thi.

---

## Mục lục

1. [TypeScript Rules](#1-typescript-rules) · 2. [Naming Convention (tổng quan)](#2-naming-convention-tổng-quan) · 3. [Folder Naming](#3-folder-naming) · 4. [File Naming](#4-file-naming) · 5. [Class Naming](#5-class-naming) · 6. [Interface Naming](#6-interface-naming) · 7. [Enum Naming](#7-enum-naming) · 8. [Constant Naming](#8-constant-naming) · 9. [Function Naming](#9-function-naming) · 10. [Variable Naming](#10-variable-naming) · 11. [DTO Naming](#11-dto-naming) · 12. [Entity Naming](#12-entity-naming) · 13. [Repository Naming](#13-repository-naming) · 14. [Use Case Naming](#14-use-case-naming) · 15. [Import Order](#15-import-order) · 16. [Export Rules](#16-export-rules) · 17. [Async/Await Rules](#17-asyncawait-rules) · 18. [Error Handling Rules](#18-error-handling-rules) · 19. [Logging Rules](#19-logging-rules) · 20. [Comment Rules](#20-comment-rules) · 21. [JSDoc Rules](#21-jsdoc-rules) · 22. [Formatting Rules](#22-formatting-rules) · 23. [ESLint Rules](#23-eslint-rules) · 24. [Prettier Rules](#24-prettier-rules) · 25. [Testing Naming Convention](#25-testing-naming-convention) · 26. [Git Commit Convention](#26-git-commit-convention) · 27. [Branch Naming Convention](#27-branch-naming-convention) · 28. [TODO/FIXME Convention](#28-todofixme-convention) · 29. [Deprecation Convention](#29-deprecation-convention) · 30. [Code Review Checklist](#30-code-review-checklist)

---

## 1. TypeScript Rules

**Rule:**
- `strict: true` bắt buộc trong `tsconfig.json` (bao gồm `strictNullChecks`, `noImplicitAny`, `noUncheckedIndexedAccess`).
- Cấm `any` — dùng `unknown` + type narrowing nếu type thật sự chưa biết.
- Dùng `interface` cho hình dạng object/contract (Entity, DTO, Port); dùng `type` cho union/intersection/mapped type.
- Hạn chế non-null assertion (`!`) — chỉ dùng khi có comment giải thích tại sao chắc chắn không null.
- Bật `noUnusedLocals`, `noUnusedParameters`.
- **Module system: Native ESM** — `package.json` có `"type": "module"`, `tsconfig.json` dùng `"module": "NodeNext"` + `"moduleResolution": "NodeNext"`. Không dùng CommonJS. Xem Mục 15 về quy tắc extension `.js` bắt buộc đi kèm.

**Rationale:** Dự án dùng TypeScript chính vì type-safety (Project Architecture Spec) — bật `strict` lỏng lẻo triệt tiêu toàn bộ lợi ích đó, đặc biệt nguy hiểm với module `chart` nơi sai kiểu dữ liệu thiên văn (ví dụ nhầm `degree` với `radian`) khó phát hiện bằng mắt. ESM (thay vì CommonJS) là chuẩn hiện tại của hệ sinh thái Node.js/npm — chọn ESM ngay từ Sprint 0 tránh phải migrate giữa chừng dự án (chi phí migrate CommonJS → ESM về sau tốn kém hơn nhiều so với cấu hình đúng từ đầu).

**Good:**
```typescript
function parseHouseSystem(value: unknown): HouseSystemName {
  if (value === 'Placidus' || value === 'WholeSign') return value;
  throw new ValidationError('UNSUPPORTED_HOUSE_SYSTEM', `Invalid house system: ${String(value)}`);
}
```

**Bad:**
```typescript
function parseHouseSystem(value: any): any { return value; } // mất toàn bộ type-safety, lỗi chỉ phát hiện lúc runtime
```

**Exceptions:** Được phép `any` tạm thời khi viết Adapter bọc thư viện ngoài **thiếu type definition** (ví dụ 1 số hàm của `swisseph-wasm`) — bắt buộc kèm comment `// TODO: type this once @types package available` và giới hạn phạm vi `any` trong đúng 1 dòng bằng cách ép kiểu tường minh ngay sau đó.

---

## 2. Naming Convention (tổng quan)

**Rule (bảng tra nhanh — chi tiết từng loại ở Mục 3-14):**

| Đối tượng | Convention | Ví dụ |
|---|---|---|
| Folder | kebab-case, số nhiều nếu là collection | `use-cases/`, `birth-profile/` |
| File | kebab-case + hậu tố loại | `create-natal-chart.usecase.ts` |
| Class | PascalCase | `CreateNatalChartUseCase` |
| Interface (Port) | PascalCase, tiền tố `I` | `IChartRepository` |
| Type alias / DTO shape | PascalCase, không tiền tố `I` | `ChartResponse` |
| Enum | PascalCase (tên + giá trị) | `AspectType.Conjunction` |
| Constant | SCREAMING_SNAKE_CASE | `MAX_LABEL_LENGTH` |
| Function/Method | camelCase, động từ đầu câu | `calculateAspects()` |
| Variable | camelCase | `birthProfileId` |
| Boolean variable/method | tiền tố `is`/`has`/`can`/`should` | `isRetrograde`, `hasWarnings()` |

**Rationale:** 1 bảng duy nhất tra cứu nhanh — giảm thời gian quyết định khi code, đặc biệt hữu ích cho AI Coding Assistant cần quy tắc tường minh, không suy luận ngầm.

**Good:** Xem bảng trên — mọi ví dụ trong tài liệu 1-7 trước đó đã tuân theo bảng này nhất quán.

**Bad:** Trộn `snake_case` (kiểu Python/DB) vào biến TypeScript: `const birth_date = ...` — không khớp convention camelCase của ngôn ngữ.

**Exceptions:** Field ánh xạ trực tiếp từ cột DB snake_case **chỉ trong Infrastructure Layer** (trước khi qua Mapper) được giữ nguyên snake_case nếu đó là raw Prisma row type (Prisma tự sinh theo `@map`) — không tự ý đổi tên field ở raw type, đổi ở Mapper.

---

## 3. Folder Naming

**Rule:** kebab-case, số nhiều cho thư mục chứa nhiều file cùng loại (`entities/`, `use-cases/`), số ít cho thư mục khái niệm (`domain/`, `application/`). Không viết tắt tùy tiện.

**Rationale:** Nhất quán với Backend Implementation Guide Mục 2 — kebab-case tránh vấn đề case-sensitivity khác nhau giữa hệ điều hành (macOS mặc định case-insensitive, Linux production case-sensitive) gây lỗi import khó debug.

**Good:** `modules/birth-profile/application/use-cases/`

**Bad:** `modules/BirthProfile/Application/UseCases/` (PascalCase folder — không khớp convention, và có rủi ro lỗi trên Linux nếu code từng chạy trên macOS với casing khác)

**Exceptions:** Không có — quy tắc này áp dụng tuyệt đối cho mọi thư mục trong `src/`.

---

## 4. File Naming

**Rule:** `<tên-mô-tả-kebab-case>.<loại>.ts` — hậu tố loại là bắt buộc, tra theo bảng:

| Hậu tố | Dùng cho | Ví dụ |
|---|---|---|
| `.entity.ts` | Domain Entity | `chart.entity.ts` |
| `.port.ts` | Interface (Domain định nghĩa) | `chart-repository.port.ts` |
| `.usecase.ts` | Use Case (Application) | `create-natal-chart.usecase.ts` |
| `.service.ts` | Application Service (điều phối, không phải 1 hành vi HTTP đơn) | `interpretation-lookup.service.ts` |
| `.repository.ts` | Repository implementation | `prisma-chart.repository.ts` |
| `.adapter.ts` | External Service Adapter | `swiss-ephemeris.adapter.ts` |
| `.controller.ts` | Presentation Controller | `chart.controller.ts` |
| `.routes.ts` | Express Router definition | `chart.routes.ts` |
| `.schema.ts` | Zod schema | `create-natal-chart.schema.ts` |
| `.mapper.ts` | Mapper function | `chart.mapper.ts` |
| `.error.ts` | Domain Error class | `email-already-exists.error.ts` |
| `.middleware.ts` | Express middleware | `auth.middleware.ts` |
| `.test.ts` | Test file | `create-natal-chart.usecase.test.ts` |
| `.config.ts` | Configuration loader | `env.config.ts` |

**Rationale:** Hậu tố cho biết ngay **layer + vai trò** mà không cần mở file — quan trọng khi codebase có hàng trăm file cùng tên gốc khác thư mục (ví dụ `chart.entity.ts` vs `chart.controller.ts`).

**Good:** `prisma-birth-profile.repository.ts`

**Bad:** `birthProfileRepo.ts` (camelCase file name, viết tắt `Repo`, thiếu hậu tố chuẩn — không nhất quán, khó `grep` theo pattern)

**Exceptions:** File cấu hình gốc dự án (`app.ts`, `server.ts`, `composition-root.ts`) không cần hậu tố vì tên đã đủ rõ vai trò và chỉ có đúng 1 file loại đó trong toàn dự án.

---

## 5. Class Naming

**Rule:** PascalCase, hậu tố khớp vai trò kiến trúc: `*UseCase`, `*Controller`, `*Adapter`, `Prisma*Repository`, `*Error`, `*Service`.

**Rationale:** Đọc tên class là biết ngay class đó thuộc layer nào — giảm phụ thuộc vào việc nhớ đường dẫn file.

**Good:** `class CreateNatalChartUseCase { ... }`, `class SwissEphemerisAdapter implements IEphemerisProvider { ... }`

**Bad:** `class ChartManager { ... }` (tên "Manager" mơ hồ, không cho biết đây là Use Case, Service, hay gì khác)

**Exceptions:** Domain Entity không cần hậu tố (`Chart`, `Planet`, không phải `ChartEntity`) — vì đây là danh từ nghiệp vụ thuần túy, thêm hậu tố "Entity" là dư thừa và không khớp thuật ngữ Domain Spec.

---

## 6. Interface Naming

**Rule:** Tiền tố `I` **chỉ** áp dụng cho interface đóng vai trò **Port** (hợp đồng hành vi, có implementation cụ thể khác nhau) — ví dụ `IChartRepository`, `IEphemerisProvider`, `ITokenProvider`. **Không** dùng tiền tố `I` cho interface mô tả hình dạng dữ liệu thuần túy (DTO, Value Object) — dùng tên thẳng theo REST API Spec.

**Rationale:** Phân biệt rõ 2 loại interface hoàn toàn khác mục đích — nếu I-prefix mọi thứ, developer mất khả năng phân biệt "đây là 1 contract có thể có nhiều implementation" (Port) hay "đây chỉ là hình dạng dữ liệu" (DTO) khi đọc lướt code.

**Good:**
```typescript
export interface IChartRepository { save(chart: Chart): Promise<Chart>; } // Port — có nhiều implementation khả dĩ
export interface ChartResponse { id: string; planets: PlanetResponse[]; } // DTO — không phải Port
```

**Bad:** `export interface IChartResponse { ... }` — DTO không cần/không nên có tiền tố `I`, gây hiểu lầm đây là Port.

**Exceptions:** Không có.

---

## 7. Enum Naming

**Rule:** Tên enum và giá trị enum PascalCase, **khớp chính xác thuật ngữ đã dùng ở Domain Specification** — không tự ý viết hoa toàn bộ (`CONJUNCTION`) hay đổi cách viết.

**Rationale:** Enum trong code phải là "single source of truth" phản chiếu đúng Domain Spec — lệch chính tả (ví dụ `Opposition` vs `OPPOSITION`) giữa tài liệu và code gây khó đối chiếu khi review.

**Good:**
```typescript
export enum AspectType { Conjunction = 'Conjunction', Sextile = 'Sextile', Square = 'Square', Trine = 'Trine', Opposition = 'Opposition' }
```

**Bad:** `enum ASPECT_TYPE { CONJUNCTION, SEXTILE }` (SCREAMING_SNAKE_CASE cho enum — sai convention TypeScript, và giá trị số ngầm định thay vì string rõ ràng gây khó debug khi log)

**Exceptions:** Không có — mọi enum liên quan Domain đều phải đối chiếu đúng chính tả với 6 tài liệu nguồn trước.

---

## 8. Constant Naming

**Rule:** SCREAMING_SNAKE_CASE cho hằng số cấp module (`MAX_LABEL_LENGTH`, `DEFAULT_PAGE_SIZE`). Hằng số đặc thù 1 module đặt ở `<module>/constants.ts`; hằng số dùng chung nhiều module đặt ở `shared/constants/`.

**Rationale:** Phân biệt trực quan hằng số (giá trị cố định, không đổi lúc runtime) với biến thường — đồng thời tránh "magic number" rải rác nhiều file (Backend Implementation Guide Mục 23).

**Good:** `export const MAX_BIRTH_PROFILE_LABEL_LENGTH = 100;` (khớp Database Design Spec CHECK constraint)

**Bad:** `if (label.length > 100)` lặp lại số `100` trực tiếp ở nhiều file — sửa 1 chỗ (ví dụ đổi CHECK constraint DB) quên sửa chỗ khác.

**Exceptions:** Giá trị hiển nhiên, không có ý nghĩa nghiệp vụ, dùng đúng 1 lần (ví dụ `array[0]`) không cần đặt thành constant.

---

## 9. Function Naming

**Rule:** camelCase, bắt đầu bằng động từ mô tả đúng hành động: `calculate*` (Engine calculator), `map*`/`to*` (Mapper), `find*`/`list*`/`save*`/`delete*` (Repository), `validate*` (Validation), `build*` (Builder).

**Rationale:** Tiền tố động từ nhất quán giúp đoán được hàm trả về gì mà không cần đọc implementation — đặc biệt quan trọng cho Engine Calculator (Engine Spec Mục 6) vốn có nhiều hàm thuần túy dễ nhầm lẫn nếu tên không rõ ràng.

**Good:** `calculateAspects(planets: Planet[]): Aspect[]`, `toChartResponseDto(chart: Chart): ChartResponse`

**Bad:** `aspects(planets)` (danh từ, không phải động từ — không rõ đây là hàm tính toán hay getter đơn giản)

**Exceptions:** Getter 1 dòng trên class có thể dùng danh từ nếu là property-like (`chart.planetCount()`) — nhưng khuyến khích dùng `get` accessor thay vì method nếu thực sự chỉ đọc giá trị có sẵn, không tính toán.

---

## 10. Variable Naming

**Rule:** camelCase, tên đầy đủ có nghĩa (không viết tắt trừ các từ đã quen thuộc: `id`, `dto`, `req`, `res`, `err`, `ctx`). Biến boolean bắt đầu `is`/`has`/`can`/`should`.

**Rationale:** Code đọc như văn xuôi tiếng Anh giúp giảm gánh nặng nhận thức khi review — đặc biệt quan trọng với dự án chỉ 1 dev, không có ai khác "dịch hộ" ý nghĩa biến viết tắt khó hiểu.

**Good:** `const isBirthTimeKnown = birthProfile.isBirthTimeKnown;`

**Bad:** `const flg = bp.ibtk;` (viết tắt tùy tiện, không ai đoán được `ibtk` là gì nếu không mở lại field gốc)

**Exceptions:** Vòng lặp ngắn có thể dùng `i`/`j` cho index thuần túy không mang ý nghĩa nghiệp vụ (ví dụ lặp qua mảng cố định 12 House) — không áp dụng cho biến có ý nghĩa nghiệp vụ dù trong vòng lặp.

---

## 11. DTO Naming

**Rule:** Tên DTO **khớp chính xác 100%** tên đã định nghĩa ở REST API Specification Mục 5 — `CreateNatalChartRequest`, `ChartResponse`, `PlanetResponse`... Không tự sáng tạo tên khác dù ngắn gọn hơn.

**Rationale:** DTO là hợp đồng với Frontend — bất kỳ ai đọc REST API Spec rồi tìm trong code phải tìm thấy đúng tên đó ngay lập tức, không phải đoán qua 1 lớp "dịch tên".

**Good:** `export type ChartResponse = z.infer<typeof chartResponseSchema>;`

**Bad:** `export type ChartDto = ...` (đặt tên tắt "Dto" thay vì "Response" — lệch REST API Spec Mục 5, gây khó đối chiếu)

**Exceptions:** DTO nội bộ dùng riêng cho 1 Mapper trung gian (không xuất hiện trong REST API Spec, ví dụ `RawEphemerisData` — dữ liệu thô từ Swiss Ephemeris) không bắt buộc theo naming REST API Spec vì nó chưa bao giờ ra khỏi Infrastructure Layer.

---

## 12. Entity Naming

**Rule:** Danh từ số ít, khớp chính xác thuật ngữ Domain Specification (`Chart`, `Planet`, `BirthProfile`, `Aspect`, `Pattern`) — không thêm hậu tố kỹ thuật (`Entity`, `Model`).

**Rationale:** Entity đại diện khái niệm nghiệp vụ — tên phải là ngôn ngữ mà cả Astrologer (Domain Expert) lẫn Developer đều hiểu giống nhau ("Ubiquitous Language" của DDD).

**Good:** `class BirthProfile { ... }`

**Bad:** `class BirthProfileModel { ... }` hoặc `class TblBirthProfile { ... }` (hậu tố kỹ thuật rò rỉ khái niệm database vào Domain Layer)

**Exceptions:** Không có.

---

## 13. Repository Naming

**Rule:** Interface `I<Entity>Repository` (số ít, khớp Entity) — ví dụ `IChartRepository`, không phải `IChartsRepository`. Implementation `Prisma<Entity>Repository`.

**Rationale:** Nhất quán số ít vì Repository quản lý 1 loại Aggregate Root, không phải 1 danh sách — tên số nhiều gây hiểu lầm đây là 1 collection thay vì 1 service truy cập dữ liệu.

**Good:** `export class PrismaChartRepository implements IChartRepository { ... }`

**Bad:** `export class ChartRepo implements ChartsRepository { ... }` (viết tắt "Repo", số nhiều sai, thiếu tiền tố `I` cho interface)

**Exceptions:** Không có.

---

## 14. Use Case Naming

**Rule:** `<Động từ><Danh từ>UseCase` — khớp đúng hành vi ở REST API Specification Mục 4 (1 endpoint thường = 1 Use Case). Ví dụ `CreateNatalChartUseCase`, `DeleteBirthProfileUseCase`, `RefreshTokenUseCase`.

**Rationale:** Đặt tên theo hành vi (không phải theo resource chung chung như `ChartService.handle()`) giữ đúng Single Responsibility — dễ dàng tra ngược 1 Use Case về đúng dòng nào ở REST API Spec Mục 4.

**Good:** `class ListBirthProfilesUseCase { async execute(...) {} }`

**Bad:** `class ChartService { createChart() {} getChart() {} deleteChart() {} }` (gộp nhiều hành vi vào 1 class lớn — vi phạm Backend Implementation Guide Mục 30 Anti-pattern #2 "God Use Case")

**Exceptions:** `*.service.ts` (không phải `*UseCase`) được dùng cho logic điều phối dùng chung bởi *nhiều* Use Case (ví dụ `InterpretationLookupService` được gọi từ cả `CreateNatalChartUseCase` lẫn `GetChartUseCase`) — đây không phải 1 hành vi HTTP đơn lẻ nên không đặt hậu tố `UseCase`.

---

## 15. Import Order

**Rule:** Nhóm import theo thứ tự, cách nhau 1 dòng trống, enforce bằng `eslint-plugin-import` (`import/order`):
1. Node.js built-in (`node:crypto`)
2. External package (`express`, `zod`)
3. Internal alias tuyệt đối (`@/shared/...`, `@/modules/...`)
4. Relative đi lên (`../../domain/...`)
5. Relative cùng cấp (`./chart.mapper`)

**Rationale:** Thứ tự cố định giúp diff trong PR gọn gàng (không có "noise" do import bị xáo trộn ngẫu nhiên), và giúp nhận diện nhanh 1 file phụ thuộc bao nhiêu vào code ngoài vs. code nội bộ.

**Good:**
```typescript
import { randomUUID } from 'node:crypto';

import { z } from 'zod';

import { AppError } from '@/shared/errors/app-error.js';

import { Chart } from '../../domain/entities/chart.entity.js';

import { toPlanetResponseDto } from './planet.mapper.js';
```

### 15.1 Bắt buộc extension `.js` cho relative import (Native ESM)

**Rule:** Dự án dùng Native ESM (`"type": "module"`, `tsconfig` `moduleResolution: "NodeNext"` — Mục 1). Mọi **relative import** (bắt đầu bằng `./` hoặc `../`) trong source TypeScript **bắt buộc** dùng đuôi `.js`, kể cả khi file thật trên đĩa là `.ts`. **Không bao giờ** dùng đuôi `.ts` trong câu lệnh `import`, và không được bỏ trống đuôi file.

**Rationale:** Dưới Node.js ESM (`moduleResolution: NodeNext`), trình giải quyết module (module resolver) hoạt động theo đúng ngữ nghĩa Node.js runtime thực tế — tại runtime, file `.ts` đã được biên dịch thành `.js`, nên import phải trỏ đến đúng tên file **sau khi build** chứ không phải tên file nguồn. Đây **không phải quy ước tùy chọn của team** — chính trình biên dịch TypeScript sẽ báo lỗi biên dịch (`TS2835: Relative import paths need explicit file extensions...`) nếu thiếu đuôi `.js`, nên quy tắc này **tự động được enforce bởi `tsc`**, không cần thêm ESLint rule riêng (khác các quy tắc khác trong tài liệu này vốn cần ESLint enforce thủ công).

**Good:**
```typescript
// file: src/modules/chart/application/use-cases/create-natal-chart.usecase.ts
import { Chart } from '../../domain/entities/chart.entity.js'; // file thật là chart.entity.ts, nhưng import ghi .js
import { toChartResponseDto } from './chart.mapper.js';
```

**Bad:**
```typescript
import { Chart } from '../../domain/entities/chart.entity';    // SAI: thiếu extension — tsc báo lỗi TS2835
import { Chart } from '../../domain/entities/chart.entity.ts'; // SAI: dùng đuôi .ts — không hợp lệ trong ESM import, tsc cũng báo lỗi
```

**Exceptions:**
- Import từ package ngoài (`import { z } from 'zod'`) và import qua alias tuyệt đối (`@/shared/...` — được cấu hình sẵn `.js` ở nơi khai báo alias nếu cần) không áp dụng quy tắc này theo cùng cách — chỉ **relative import** (`./`, `../`) bắt buộc `.js`.
- File JSON/config không phải `.ts` (ví dụ `import data from './data.json'`) giữ nguyên đuôi thật của nó, không đổi thành `.js`.

**Bad:** Import trộn lẫn không theo nhóm, package ngoài xen giữa import nội bộ — khó đọc, dễ conflict khi merge.

**Exceptions:** Không có — `import/order` là ESLint rule bắt buộc pass, không có ngoại lệ thủ công (dùng `eslint --fix` tự sắp xếp).

---

## 16. Export Rules

**Rule:** Ưu tiên **named export**, hạn chế tối đa `export default`. Barrel (`index.ts`) chỉ tồn tại ở **gốc mỗi module**, không tạo `index.ts` trung gian ở từng thư mục con.

**Rationale:** Named export giữ tên nhất quán mọi nơi import (default export cho phép người import tự đặt tên khác nhau ở mỗi file — dễ gây nhầm lẫn); giới hạn barrel ở gốc module thực thi đúng Module Communication Rule (Project Architecture Spec Mục 8) — chỉ có 1 điểm vào công khai.

**Good:** `export class CreateNatalChartUseCase { ... }` + import `import { CreateNatalChartUseCase } from '...'`

**Bad:** `export default class CreateNatalChartUseCase { ... }` rồi có nơi `import ChartUseCase from '...'` (đổi tên tùy tiện lúc import — mất khả năng "Find All References" chính xác của IDE)

**Exceptions:** File entry point (`server.ts`) có thể `export default app` nếu công cụ triển khai (ví dụ 1 số testing framework) yêu cầu — trường hợp hiếm, cần comment giải thích.

---

## 17. Async/Await Rules

**Rule:**
- Luôn dùng `async/await`, không dùng `.then()/.catch()` chain thủ công.
- Mọi Promise phải được `await` hoặc return — cấm "floating promise" (enforce bằng ESLint `@typescript-eslint/no-floating-promises`).
- Controller method async luôn bọc `asyncHandler` (Backend Implementation Guide Mục 5) để lỗi tự rơi vào Error Handler.

**Rationale:** `async/await` dễ đọc tuyến tính hơn `.then()` chain lồng nhau; floating promise là nguồn lỗi âm thầm phổ biến nhất trong Node.js (lỗi không được catch, silent failure).

**Good:**
```typescript
async function createArticle(input: CreateArticleInput): Promise<Article> {
  const cleanBody = await this.htmlSanitizer.sanitize(input.body);
  return this.articleRepo.save(new Article(cleanBody));
}
```

**Bad:**
```typescript
function createArticle(input: CreateArticleInput) {
  this.articleRepo.save(new Article(input.body)); // SAI: floating promise, không await/return — lỗi ghi DB có thể bị nuốt hoàn toàn im lặng
}
```

**Exceptions:** Fire-and-forget thật sự chủ đích (ví dụ ghi audit log không quan trọng tới mức phải chặn response) phải dùng `void somePromise().catch(err => logger.error(...))` tường minh — không để floating promise trần không có `void` + `.catch()`.

---

## 18. Error Handling Rules

**Rule:** (nhắc lại có chọn lọc từ Backend Implementation Guide Mục 12, tập trung khía cạnh *code style*) Luôn `throw` subclass `AppError`; message lỗi tiếng Việt dễ hiểu cho end-user (vì hiển thị trực tiếp qua RFC7807 `detail`), `errorCode` tiếng Anh SCREAMING_SNAKE_CASE khớp REST API Spec Mục 7.

**Rationale:** Nhất quán ngôn ngữ theo đúng vai trò từng field — `message`/`detail` là thứ người dùng cuối (Frontend hiển thị) đọc được, `errorCode` là thứ machine-readable để Frontend rẽ nhánh logic.

**Good:** `throw new ConflictError('EMAIL_ALREADY_EXISTS', 'Email này đã được sử dụng.');`

**Bad:** `throw new ConflictError('EMAIL_ALREADY_EXISTS', 'Email already exists');` (message tiếng Anh lộ ra Frontend tiếng Việt — không nhất quán trải nghiệm người dùng theo PRD)

**Exceptions:** Log nội bộ (Pino) luôn tiếng Anh bất kể message lỗi trả về người dùng là gì — log dành cho Developer đọc, không cần song ngữ.

---

## 19. Logging Rules

**Rule:** Structured log object luôn có tối thiểu `module` + `action`; dùng đúng level: `debug` (chi tiết dev-only), `info` (sự kiện nghiệp vụ bình thường), `warn` (bất thường nhưng không chặn request — ví dụ Warning House không hội tụ), `error` (lỗi thực sự cần chú ý). Không log PII thô (Backend Implementation Guide Mục 13).

**Rationale:** Level nhất quán cho phép lọc log production theo mức độ nghiêm trọng mà không bị nhiễu bởi log `debug` tràn ngập, hoặc bỏ lỡ `error` quan trọng lẫn trong `info`.

**Good:** `logger.warn({ module: 'chart', action: 'create_natal_chart', chartId, warningCode: 'HOUSE_SYSTEM_NOT_CONVERGING' }, 'Chart created with warnings');`

**Bad:** `logger.error('something went wrong with chart maybe??')` (string tự do không có field cấu trúc, sai level cho tình huống không phải lỗi nghiêm trọng, không kèm context để debug)

**Exceptions:** Log ở `shared/logger/pino.logger.ts` (setup ban đầu) không cần field `module`/`action` vì đây là log hạ tầng khởi động, không phải sự kiện nghiệp vụ.

---

## 20. Comment Rules

**Rule:** Comment giải thích **"tại sao" (why)**, không lặp lại **"cái gì" (what)** đã rõ ràng từ code. Không để code chết (commented-out code) tồn tại trong file đã merge — xóa hẳn, Git history đã lưu lại nếu cần xem lại.

**Rationale:** Code tự nó đã nói "làm gì" nếu đặt tên tốt (Mục 9-10) — comment lặp lại "cái gì" là dư thừa, dễ lệch khỏi code thực tế theo thời gian (code đổi, comment quên đổi theo).

**Good:**
```typescript
// Placidus không hội tụ ở vĩ độ cực (Engine Spec 6.4) — fallback trả rỗng thay vì throw lỗi cứng
if (!housesConverged) return { houses: [], isHouseDataAvailable: false };
```

**Bad:**
```typescript
// tăng i lên 1
i++;
```

**Exceptions:** Comment tạm thời đánh dấu công việc dở dang dùng format TODO/FIXME chuẩn (Mục 28), không phải comment giải thích thông thường.

---

## 21. JSDoc Rules

**Rule:** JSDoc **bắt buộc** cho: mọi Port interface (`domain/ports/*.port.ts`), mọi Engine Calculator public function (`domain/engine/calculators/*`), mọi Use Case `execute()` method. **Không bắt buộc** cho method nội bộ đơn giản, getter, Mapper (tên hàm đã đủ tự giải thích).

**Rationale:** Port và Calculator là "hợp đồng" quan trọng nhất trong codebase (Project Architecture Spec ADR-003/009) — JSDoc ở đây đóng vai trò tài liệu tối thiểu cho bất kỳ ai (kể cả AI Coding Assistant) implement/gọi mà không cần đọc lại toàn bộ Engine Specification.

**Good:**
```typescript
/**
 * Tính toán các góc chiếu (Aspect) giữa mọi cặp hành tinh.
 * Pure function — deterministic (Engine Spec Mục 2).
 * @param planets Danh sách hành tinh đã có longitude
 * @param orbConfig Bảng orb cho phép theo loại góc (Domain Spec Appendix 9.4)
 * @returns Danh sách Aspect hợp lệ (orb trong ngưỡng cho phép)
 */
export function calculateAspects(planets: Planet[], orbConfig: OrbConfiguration): Aspect[] { ... }
```

**Bad:** Viết JSDoc cho 1 getter đơn giản `/** Gets the id */ get id() { return this._id; }` — dư thừa, không thêm giá trị.

**Exceptions:** Test file (`*.test.ts`) không cần JSDoc — tên `describe`/`it` (Mục 25) đã đóng vai trò tài liệu.

---

## 22. Formatting Rules

**Rule:** Format tự động 100% bằng Prettier (Mục 24) — không format thủ công, không tranh luận style trong code review (nếu Prettier chấp nhận, coi là hợp lệ). Chạy `format:check` trong CI, chặn merge nếu chưa format.

**Rationale:** Loại bỏ hoàn toàn tranh cãi về style cá nhân ("nên xuống dòng ở đâu") — tiết kiệm thời gian review cho nội dung thực sự quan trọng (logic, kiến trúc).

**Good:** Chạy `npm run format` trước khi commit (hoặc Husky pre-commit hook tự động).

**Bad:** Tự canh khoảng trắng/xuống dòng thủ công khác với output Prettier — gây diff không cần thiết ở PR sau khi ai đó chạy format lại.

**Exceptions:** Không có ngoại lệ format — nếu Prettier format ra thứ "xấu" ở 1 trường hợp cụ thể, thêm `// prettier-ignore` kèm comment lý do, không tắt Prettier toàn file.

---

## 23. ESLint Rules

**Rule:** Bộ rule tối thiểu bắt buộc bật ở mức `error` (không phải `warn`):

| Rule | Mục đích |
|---|---|
| `boundaries/element-types` | Chặn vi phạm Dependency Rules (Backend Implementation Guide Mục 4) |
| `@typescript-eslint/no-explicit-any` | Thực thi Mục 1 (cấm `any`) |
| `@typescript-eslint/no-floating-promises` | Thực thi Mục 17 |
| `import/order` | Thực thi Mục 15 |
| `no-console` | Thực thi Backend Implementation Guide Mục 13 (chỉ dùng Pino) |
| `@typescript-eslint/no-unused-vars` | Dọn dẹp code chết |
| `eqeqeq` | Bắt buộc `===`/`!==`, cấm `==`/`!=` |

**Rationale:** ESLint là tuyến phòng thủ tự động — quy tắc chỉ nằm trong tài liệu (không có tool enforce) sẽ dần bị bỏ qua khi deadline gấp, đặc biệt với 1 dev không có code review chéo tự nhiên.

**Good:** CI pipeline có bước `npm run lint` **chặn merge** nếu fail, không chỉ hiển thị warning.

**Bad:** Cấu hình toàn bộ rule ở mức `warn` — warning bị lờ đi theo thời gian, giá trị ESLint giảm dần về 0.

**Exceptions:** `eslint-disable-next-line` được phép dùng **kèm comment giải thích bắt buộc** — không disable không lý do; CI có thể thêm bước đếm số lượng `eslint-disable` và cảnh báo nếu tăng bất thường.

---

## 24. Prettier Rules

**Rule:** Cấu hình cố định, không tùy biến theo sở thích cá nhân:

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

**Rationale:** `trailingComma: all` giảm diff khi thêm dòng cuối object/array; `printWidth: 100` (rộng hơn mặc định 80) phù hợp code TypeScript có type annotation dài (interface, generic).

**Good:** Mọi file mới tự động format đúng theo config này qua editor extension hoặc pre-commit hook.

**Bad:** Có file dùng `"` (double quote) xen giữa codebase chủ yếu `'` (single quote) — không đồng bộ, phải chạy `prettier --write` toàn repo để sửa.

**Exceptions:** File generated tự động (Prisma Client, OpenAPI spec generate ra) loại trừ khỏi Prettier check (`.prettierignore`) — không kiểm soát style code không phải do người viết.

---

## 25. Testing Naming Convention

**Rule:**
- File test: `<tên-file-gốc>.test.ts`, co-located cạnh file nguồn (Unit) hoặc trong `tests/` (Integration/API — Backend Implementation Guide Mục 17.1).
- `describe(<TênClassHoặcModule>)` → `it('<mô tả hành vi bằng tiếng Việt hoặc tiếng Anh nhất quán trong toàn bộ file>')`.
- Test data giả (fixture) đặt tên `fixture<TênKháiNiệm>` hoặc `mock<TênKháiNiệm>`.

**Rationale:** Tên test mô tả hành vi (không phải "test case 1, test case 2") giúp đọc report test như 1 tài liệu đặc tả sống — test fail cho biết ngay hành vi nào bị hỏng mà không cần mở file.

**Good:**
```typescript
describe('CreateNatalChartUseCase', () => {
  it('trả về houses rỗng khi isBirthTimeKnown=false', async () => { ... });
  it('throw ValidationError khi vừa có birthProfileId vừa có birthData', async () => { ... });
});
```

**Bad:** `it('test 1', () => {...})`, `it('should work', () => {...})` — không mô tả hành vi cụ thể, vô dụng khi đọc report.

**Exceptions:** Snapshot test (nếu dùng cho `ChartResponse` phức tạp) có thể đặt tên ngắn gọn `it('matches snapshot')` — vì bản thân snapshot file đã là tài liệu chi tiết.

---

## 26. Git Commit Convention

**Rule:** [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <subject>` — `type` ∈ {`feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`}, `scope` = tên module (`chart`, `identity`, `article`...) hoặc `shared`/`infra`. `subject` viết thường, không chấm cuối câu, dùng thì hiện tại mệnh lệnh ("add" không phải "added").

**Rationale:** Commit message có cấu trúc cho phép tự động sinh Changelog, và giúp `git log --oneline` đọc được ngay đây là thay đổi loại gì ở module nào mà không cần mở diff.

**Good:**
```
feat(chart): add version pinning for interpretation lookup
fix(identity): correct refresh token rotation race condition
test(chart): add unit tests for aspect calculator orb boundaries
```

**Bad:** `update stuff`, `fix bug`, `asdf` — không có type/scope, không mô tả được thay đổi gì.

**Exceptions:** Commit `WIP` tạm thời trên nhánh cá nhân (chưa push lên PR) được miễn quy tắc — nhưng **bắt buộc squash/rewrite** thành commit chuẩn trước khi mở Pull Request.

---

## 27. Branch Naming Convention

**Rule:** `<type>/<mô-tả-ngắn-kebab-case>` — `type` khớp Conventional Commits (`feature`, `fix`, `refactor`, `chore`). Có thể thêm mã ticket nếu dùng issue tracker: `feature/CHART-12-natal-chart-endpoint`.

**Rationale:** Tên nhánh mô tả rõ nội dung giúp tra cứu nhanh trong danh sách nhánh dài, đặc biệt khi nhiều nhánh cũ chưa dọn.

**Good:** `feature/birth-profile-soft-delete`, `fix/rate-limit-guest-ip-counting`

**Bad:** `my-branch`, `test123`, `phuc-dev` — không mô tả nội dung, không phân loại được.

**Exceptions:** Nhánh `main`/`develop` (nếu dùng Git Flow rút gọn) không theo quy tắc này — đây là nhánh cố định, không phải nhánh tính năng.

---

## 28. TODO/FIXME Convention

**Rule:** `// TODO(<ngày hoặc người>): <mô tả việc cần làm>` cho công việc **có kế hoạch** làm sau (không phải lỗi). `// FIXME(<ngày hoặc người>): <mô tả lỗi đã biết>` cho **lỗi đã biết nhưng chưa sửa ngay** (khác `TODO` — FIXME hàm ý đây là sai, cần ưu tiên hơn).

**Rationale:** Phân biệt "cải tiến tương lai" (TODO) và "lỗi tồn đọng" (FIXME) giúp ưu tiên đúng khi dọn dẹp kỹ thuật (technical debt) sau này — gộp chung thành 1 loại comment mất khả năng phân loại mức độ khẩn cấp.

**Good:** `// TODO(2026-07-11): Thêm calculateTransit() thật khi Engine Spec Mục 9.7 được triển khai`

**Bad:** `// TODO fix this` (không có ngày/người, không mô tả rõ cần làm gì — vô dụng khi tìm lại 6 tháng sau)

**Exceptions:** Không có — mọi `TODO`/`FIXME` phải theo đúng format, CI có thể thêm bước cảnh báo (không chặn) nếu số lượng `FIXME` vượt ngưỡng.

---

## 29. Deprecation Convention

**Rule:** Đánh dấu `@deprecated` trong JSDoc, kèm: lý do deprecated, thay thế bằng gì, và **version/ngày dự kiến xóa** — khớp Backward Compatibility Policy đã chốt ở REST API Specification Mục 10 (deprecation window tối thiểu 90 ngày cho breaking change).

**Rationale:** Xóa code ngay lập tức mà không có giai đoạn deprecated có thể phá vỡ code khác đang gọi (kể cả nội bộ) — cần thời gian chuyển tiếp có kiểm soát.

**Good:**
```typescript
/**
 * @deprecated Dùng ITokenProvider.generateAccessToken() thay thế. Sẽ xóa sau 2026-10-01.
 */
export function legacyGenerateToken(): string { ... }
```

**Bad:** Xóa thẳng function đang được gọi ở nơi khác mà không deprecate trước — gây lỗi build ở những chỗ chưa kịp cập nhật.

**Exceptions:** Code nội bộ chưa từng release/merge vào `main` không cần quy trình deprecate — xóa thẳng vì chưa có ai phụ thuộc.

---

## 30. Code Review Checklist

*(Bổ sung cho Pull Request Checklist ở Backend Implementation Guide Mục 28 — checklist đó tập trung tính đúng đắn chức năng/kiến trúc, checklist này tập trung **style & khả năng đọc**)*

- [ ] Naming đúng theo Mục 2-14 (không có biến/hàm/class đặt tên mơ hồ)
- [ ] Không có `any`, không có `eslint-disable` thiếu giải thích
- [ ] Import order đúng (Mục 15), export dùng named export (Mục 16)
- [ ] Không có floating promise, mọi `async` đều `await` đúng chỗ (Mục 17)
- [ ] Comment giải thích "tại sao", không phải "cái gì"; không còn code chết bị comment-out (Mục 20)
- [ ] JSDoc đầy đủ cho Port/Calculator/Use Case mới thêm (Mục 21)
- [ ] `npm run format` và `npm run lint` đã chạy sạch trước khi mở PR (Mục 22-23)
- [ ] Test mới có tên mô tả hành vi rõ ràng, không phải `it('works')` (Mục 25)
- [ ] Commit message theo Conventional Commits (Mục 26), branch name đúng convention (Mục 27)
- [ ] Không có `TODO`/`FIXME` mới thiếu ngày/mô tả (Mục 28)
- [ ] Nếu deprecate 1 function/endpoint → có `@deprecated` JSDoc đầy đủ (Mục 29)
- [ ] Reviewer đọc code như đọc văn xuôi — nếu phải dừng lại đoán ý nghĩa 1 biến/hàm quá 5 giây, yêu cầu đổi tên trước khi approve
