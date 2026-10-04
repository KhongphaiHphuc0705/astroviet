# Sprint 4 M3 — Interpretation Infrastructure & Content Pipeline

**Vị trí đề xuất:** `docs/implementation/Sprint_4_M3_Interpretation_Infrastructure_Content_Pipeline_Plan.md`
**Phiên bản:** 1.1 — đã chốt 4 câu hỏi mở
**Dựa trên:** audit trực tiếp nhánh `dev` tại `aec6d29` (clone sạch, 2026-10-05), prompt M3, Sprint 4 Implementation Plan v1.1, Sprint 4 M1/M2 Plan và Evidence Matrix, DB Design Spec §5.13/§7, Project Architecture Spec §12.
**Quy ước nguồn bằng chứng:** `[repo]` đọc từ mã nguồn; `[spec]` đọc từ tài liệu; `[C-run]` Claude chạy trong sandbox; `[evidence]` Evidence Matrix hoặc log owner/CI đã nhận; `UNVERIFIED` nghĩa là chưa có bằng chứng.

---

## 1. Sprint Overview

M1 dựng persistence, M2 dựng domain thuần. M3 nối hai phần đó với PostgreSQL theo hai đường độc lập:

```
Runtime:  IInterpretationContentProvider (port, M2) → PrismaInterpretationContentProvider → PostgreSQL
Tooling:  enumerateMvpInterpretationSubjects() → validator → seeder → PostgreSQL
                         ↑ file nội dung JSON do content owner cung cấp
```

**Điều audit phát hiện quan trọng nhất:** `PrismaInterpretationContentProvider` **đã được M1 triển khai đầy đủ** và đã implement port (có `findPublishedVersions`, `findPublishedContents`, `insertMany`; 22 test tích hợp). Prompt M3 coi provider là việc mới; thực tế phần provider của M3 là **kiểm chứng và bổ sung test với dữ liệu seed thật**, không phải viết lại. Phần việc thật sự mới của M3 là **pipeline nội dung**: schema file JSON, validator, seeder, CLI, file mẫu.

Hai việc cuối cùng của M3 không làm: không sinh nội dung diễn giải (không có AI), không viết Interpretation Engine.

## 2. M1/M2 Prerequisite Verification

**Kết luận: M1 và M2 đều đã triển khai thật. Không kích hoạt `NOT READY`.**

| Hạng mục | Kết quả | Nguồn |
|---|---|---|
| `Language`, `InterpretationContent` | Model trong `schema.prisma`; bảng + 4 CHECK (gồm `AngleInSign`), FK `language`, UNIQUE expression, partial index lookup trong migration `20261004120000_init_interpretation_content_bank` | [repo] |
| `vi` bootstrap | `INSERT ... ON CONFLICT DO NOTHING` ngay trong migration; `clearDatabase()` giữ `languages` | [repo], [evidence] |
| `Chart.snapshotInterpretationVersion` + mapping | Có, đã có test roundtrip | [repo], [evidence] |
| Provider/repository foundation | `PrismaInterpretationContentProvider` (M1) | [repo] |
| Test tích hợp M1 | `prisma-interpretation-content.provider.test.ts`, 22 case | [repo] |
| Subject type, key grammar, `deriveInterpretationSubjects`, `enumerateMvpInterpretationSubjects` (252), `compareContentVersion`, `isValidContentVersion` | Có trong `chart/domain/interpretation/`; 89 test M2 pass trên HEAD (Claude chạy lại) | [repo], [C-run] |
| Port | `IInterpretationContentProvider` có JSDoc hợp đồng "rỗng vs lỗi", "không đảm bảo thứ tự" | [repo] |
| Bằng chứng chạy | M1: 95 file / 599 test, CI #225 Success. M2: CI #231 Success trên `aec6d29` (log owner phản ánh trạng thái trước commit cuối, đã ghi ở Evidence Matrix M2) | [evidence] |

Gap còn mở không chặn M3: KG-S4-06, KG-S4-08, KG-M1-03 (nên xử lý trước M4), KG-M1-05, KG-M2-03/04/05/06. KG-M2-02 (hằng `MVP_INTERPRETATION_SUBJECT_TYPES` chưa có consumer production) **được M3 giải quyết** (Mục 15).

## 3. Repository Audit

| Chủ đề | Thực tế |
|---|---|
| Provider hiện có | `chart/infrastructure/repositories/prisma-interpretation-content.provider.ts`. Constructor nhận `PrismaClient`. `findPublishedVersions` dùng `findMany({ where: { language, status: 'Published' }, distinct: ['version'] })`. `findPublishedContents` trả `[]` khi `subjects` rỗng, ngược lại `findMany` với `language`, `version`, `status: 'Published'`, `tone: null`, `OR: [{subject_type, subject_key}…]`. Lỗi được bọc `InfrastructureError(message, undefined, error)`. `insertMany` dùng `createMany` (không `skipDuplicates`, nên trùng khoá ném lỗi). Mapper là hàm nội tuyến, ép kiểu `subject_type`/`status`/`tone`/`content_source` (an toàn nhờ CHECK ở DB) |
| `InterpretationContentRecord` | `subjectType`, `subjectKey`, `language`, `tone`, `bodyText`, `version`, `status`, `contentSource` (tên trường theo domain; cột DB là `body_text`) |
| Prisma schema | `Language { code @id, display_name, is_default }`; `InterpretationContent` có `content_source` default `'HumanAuthored'`, `tone String?`, `status` default `'Published'`, `version` default `'1.0'`. **UNIQUE expression và partial index không có trong Prisma** (viết tay trong migration) nên **không dùng được `upsert` theo khoá hợp** |
| Kiểu domain | `InterpretationContentStatus = 'Draft' \| 'Published' \| 'Archived'`; `InterpretationTone`, `InterpretationContentSource = 'HumanAuthored' \| 'AIGenerated' \| 'Hybrid'` |
| Wiring | `composition-root.ts` không có tham chiếu interpretation; không có consumer của provider (Interpretation Engine ở M4) |
| Seed hiện có | `prisma/seed.ts` (tạo Admin; `prisma.seed = tsx prisma/seed.ts`), `prisma/seed.config.ts` (đọc `SEED_ADMIN_*` bằng Zod và **gọi `process.exit(1)` khi thiếu**). Dùng `new PrismaClient()` trực tiếp, không import `src/` |
| Tooling import `src/` | `scripts/generate-openapi.ts` import `../src/...js` — tiền lệ cho script nằm ngoài `src` dùng mã trong `src` |
| Typecheck phạm vi | `tsconfig.json`: `rootDir: src`, `include: ["src/**/*.ts"]` ⇒ `npm run typecheck` và `npm run build` **không kiểm** `prisma/` và `scripts/`. `tsconfig.eslint.json` có `prisma/**` nhưng dùng nó làm typecheck cho **104 lỗi TS6059** ([C-run], vì kế thừa `rootDir: src`). ESLint (type-aware qua `tsconfig.eslint.json`) vẫn lint các file đó |
| Zod | Có trong dependencies; đã dùng ở presentation và `jwt-token.adapter.ts` (infrastructure) |
| Script/npm | `prisma:generate`, `prisma:deploy`, `prisma:seed` (`prisma db seed`), `db:reset` (`prisma migrate reset`), `test`, `lint`, `typecheck`, `format:check`, `build`. Chưa có script seed nội dung |
| DB test | `docker-compose.test.yml`: Postgres 16 cổng 5432, DB `test`; `vitest.config.ts` đặt `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test`; CI chạy `prisma:generate` + `prisma:deploy` rồi test; test tự dọn bằng `DatabaseTestHelper.clearDatabase()` |
| Thư mục nội dung | `backend/prisma/content/` **chưa tồn tại**; **không có** `interpretations.vi.json` hay bất kỳ nội dung do owner cung cấp trong repo |
| Cấu trúc test | `tests/unit/modules/chart/{application,domain,infrastructure/adapters,presentation}`; `tests/integration/modules/chart/repositories/` |

## 4. Documentation Audit

| Tài liệu | Điều liên quan M3 |
|---|---|
| DB Spec §5.13 | Cột, CHECK, UNIQUE `(subject_type, subject_key, language, version, COALESCE(tone,''))`; "Khi tạo version mới phải có bản ghi cho toàn bộ `subject_key` đang dùng"; chỉ `Published` được dùng khi build response. Đã có mục grammar `subject_key` (M2) |
| DB Spec Seed Data | `languages` và `house_systems` seed trong migration; `en` không seed (A1/FD7). Không có quy ước seed nội dung |
| Architecture Spec §12 | Port `IInterpretationContentProvider` ở `chart/domain/ports/`; adapter hiện tại ghi `PrismaInterpretationContentProvider` (M2 đã sửa) |
| REST API Spec | Không liên quan M3 (không có endpoint) |
| Sprint 4 Plan v1.1 | M3 = provider + `seed-content.ts` + validator + file JSON mẫu; file nội dung `backend/prisma/content/interpretations.vi.json` cấu trúc `{ version, language, items[{ subjectType, subjectKey, bodyText }] }`; seed từ chối file thiếu/trùng/dư key và version trùng khác nội dung; script `prisma:seed:content`. **Tên phương thức provider trong §19 đã lỗi thời** so với port thực tế |
| `prisma/README.md`, `backend/README.md` | Có hướng dẫn `prisma:seed`/`prisma:migrate`; chưa có phần nội dung diễn giải |
| Coding/Testing Standards | Không có file riêng được xác nhận trong audit này; quy ước lấy từ mã và `.eslintrc.cjs` (import order, boundaries, `no-console`). `UNVERIFIED — không đọc riêng tài liệu Coding Standards`; dùng quy ước thực tế trong repo |

## 5. Source-of-Truth Hierarchy

1. Mã nguồn tại `aec6d29`.
2. Spec đã đóng băng (DB Spec, Architecture Spec, Domain Spec).
3. Sprint 4 Plan v1.1, quyết định owner (R1–R4, A–E, Moon) và M1/M2 Plan + Evidence Matrix.
4. Prompt M3 (FD1–FD14).

**Mâu thuẫn giữa prompt và repo (repo thắng, không mở lại FD):**

| Prompt nói | Repo thực tế | Xử lý |
|---|---|---|
| Stack "CommonJS" | ESM (`"type": "module"`, NodeNext, import `.js`) | Theo ESM; `prisma/seed.ts` hiện import `./seed.config` không đuôi vì chạy qua `tsx` |
| Task 1 "Implement `PrismaInterpretationContentProvider`" | Đã có từ M1 | Task 1 thành xác minh + test (D-M3-01) |
| JSON ví dụ dùng trường `content`, `version`/`status`/`tone` trên từng dòng | Domain dùng `bodyText`; Sprint 4 Plan v1.1 đã chốt cấu trúc `{version, language, items}` | Theo domain + plan, mở rộng tối thiểu (D-M3-04, O-M3-3) |
| Thư mục `tools/` | Repo có `scripts/` và `prisma/`, không có `tools/` | Dùng `prisma/` cho CLI seed (cạnh `seed.ts`), logic nằm trong `src/` |
| Loại trừ "North Node/South Node" | enum `NorthNode`, `SouthNode` | Không ảnh hưởng (FD5) |

## 6. Existing Architecture Baseline

- Port ở `domain/ports/`, implementation ở `infrastructure/repositories/` — M3 không đổi.
- ESLint `boundaries/dependencies`: `infrastructure → domain` được phép; `domain → infrastructure` bị cấm; `application → infrastructure` bị cấm. M3 đặt validator và seeder ở `infrastructure/` và chỉ import từ `domain/` và `shared/`.
- Không có module `interpretation` (FD1 giữ nguyên).
- `fs` và đọc file chỉ nằm trong CLI ở `prisma/`; `src/` không đọc đường dẫn file nội dung.

## 7. M3 Objective

1. Chứng minh nội dung có thể nạp vào DB sạch và đọc lại qua provider và port.
2. Có validator tái sử dụng M2 (grammar, version, enumerate) cho file nội dung.
3. Có seeder an toàn (kiểm trước khi ghi, giao dịch, không ghi đè nội dung Published).
4. Có file mẫu cấu trúc thật, đánh dấu rõ nội dung production là việc của content owner.
5. Không đổi hành vi API, không wiring runtime.

## 8. Frozen Decisions

FD1–FD14 của prompt và mọi quyết định M1/M2 giữ nguyên, không mở lại. Ánh xạ sang M3:

| FD | Thực hiện |
|---|---|
| FD1 | Mọi file mới thuộc module `chart`; không tạo module `interpretation` |
| FD2/FD3 | Provider M1 giữ nguyên; domain/application không import Prisma |
| FD4/FD5/FD6 | Validator dùng `MVP_INTERPRETATION_SUBJECT_TYPES`, `isValidInterpretationSubjectKey` của M2 |
| FD7 | Tập mong đợi = `enumerateMvpInterpretationSubjects()`, không có danh sách 252 key thứ hai |
| FD8 | Bao phủ đầy đủ 252 là điều kiện để `Published` |
| FD9 | Prose do owner cung cấp; M3 chỉ có file mẫu |
| FD10 | Chỉ `vi` |
| FD11 | Version theo `isValidContentVersion`/`compareContentVersion` của M2 (+ ràng buộc dạng ở D-M3-05) |
| FD12 | Chiến lược trạng thái ở Mục 17 |
| FD13 | `tone` luôn `null` trong M3 (file không có trường tone) |
| FD14 | Không LLM, không API key, không phụ thuộc AI |

## 9. Scope

1. Validator và schema Zod cho file nội dung (`infrastructure/content/`).
2. Seeder (`infrastructure/content/`) và CLI `prisma/seed-content.ts`.
3. Script `prisma:seed:content` trong `package.json`.
4. File mẫu `prisma/content/interpretations.vi.sample.json`.
5. Test unit cho validator; test tích hợp cho seeder + provider (đường seed → lookup).
6. Tài liệu quy trình (Mục 26).

## 10. Out of Scope

Interpretation Engine (`InterpretationLookupService`, chọn version mới nhất), API và `ChartResponse` (kể cả `interpretationVersion`), wiring `composition-root.ts`, nội dung 252 mục, CMS/API quản trị, sinh nội dung bằng AI, Aspect/Pattern/summary, Moon uncertainty, đổi schema hay migration, đổi chữ ký port, sửa engine hay Swiss Ephemeris, bump version backend (`0.4.0` khi đóng Sprint 4), sửa `tsconfig`.

## 11. Dependencies

| Hướng | Phụ thuộc |
|---|---|
| Vào | M1 (bảng, provider, helper), M2 (`enumerate`, grammar, version, `MVP_INTERPRETATION_SUBJECT_TYPES`) — đã có |
| Ra M4 | Provider đã được kiểm chứng với dữ liệu seed; M4 wiring và dùng service |
| Ra M6 | Cần file `interpretations.vi.json` thật do owner cung cấp để chạy nghiệm thu đầu-cuối |
| Ngoài | Chore KG-M1-03 (`{ cause }` truyền vào `details`) nên làm trước M4, không thuộc M3 |

## 12. PrismaInterpretationContentProvider

**Hiện trạng:** đã implement `IInterpretationContentProvider` (M1). **Quyết định D-M3-01: không đổi file production của provider** trừ khi test M3 chứng minh lỗi.

Lý do: query đã đúng hợp đồng (language, version, `Published`, `tone IS NULL`, khớp tuyệt đối `subject_type` + `subject_key`), lỗi được bọc `InfrastructureError` và không bị nuốt thành `[]`, và có chỉ mục partial index đúng cho truy vấn này.

Việc M3 làm cho provider:

1. **Test tích hợp với dữ liệu seed thật** (Mục 19): tra cứu 252 subject sau khi seed; ba ca đại diện `Sun_in_Leo`, `Venus_in_House_7`, `Ascendant_in_Leo`.
2. **Xác nhận ranh giới:** provider không import mã seeder/validator; seeder không import provider (hai đường độc lập, cùng chạm bảng).
3. `insertMany` tiếp tục là phương thức của class (không thuộc port), dùng cho test.
4. **Wiring vào `composition-root.ts`: hoãn sang M4** (D-M3-02, O-M3-4). Lý do: chưa có consumer; wiring một provider không dùng là mã chết và không chứng minh được gì.

## 13. Provider Query Semantics

| Khía cạnh | Hành vi (đã có, được M3 kiểm chứng bằng test) |
|---|---|
| Khớp chính xác | `language`, `version`, `subject_type`, `subject_key` bằng nhau tuyệt đối; kết quả chỉ chứa cặp được yêu cầu |
| Published | `status = 'Published'` luôn được áp dụng; Draft/Archived không bao giờ trả về |
| Tone | `tone IS NULL` (MVP không có chọn tone) |
| Rỗng | Không có dòng khớp, hoặc `subjects` rỗng → `[]` (hợp lệ, `subjects` rỗng không truy vấn) |
| Lỗi hạ tầng | Ném `InfrastructureError`, không bao giờ biến thành `[]` (R3). Test M1 dùng stub; M3 không thêm test mới cho nhánh này và ghi rõ quyết định (dòng "Database failure" ở Mục 19) |
| Thứ tự | **Không đảm bảo** (hợp đồng M2: caller sắp xếp lại). M3 **không** thêm `orderBy`, vì thêm sẽ ngầm tạo hợp đồng thứ tự mà M2 đã loại. Test M3 so sánh theo tập (không theo thứ tự) |
| Đa version | Các version cùng tồn tại; chỉ trả về đúng `version` được yêu cầu |

Câu hỏi "giữ thứ tự yêu cầu / thứ tự DB / collection có khoá" (prompt Mục 9): trả lời theo M2 — thứ tự DB không đảm bảo, caller (M4) sắp xếp theo thứ tự `deriveInterpretationSubjects`.

## 14. Content JSON Contract

**Đường dẫn:**
- Production (owner cung cấp, **chưa tồn tại**): `backend/prisma/content/interpretations.vi.json` (R2).
- Mẫu do M3 tạo: `backend/prisma/content/interpretations.vi.sample.json`.

**Cấu trúc (đề xuất, xác nhận ở O-M3-3):**

```json
{
  "language": "vi",
  "version": "1.0",
  "status": "Draft",
  "contentSource": "HumanAuthored",
  "items": [
    { "subjectType": "PlanetInSign", "subjectKey": "Sun_in_Leo", "bodyText": "…" },
    { "subjectType": "PlanetInHouse", "subjectKey": "Venus_in_House_7", "bodyText": "…" },
    { "subjectType": "AngleInSign", "subjectKey": "Ascendant_in_Leo", "bodyText": "…" }
  ]
}
```

| Trường | Bắt buộc | Quy tắc |
|---|---|---|
| `language` | có | Đúng `'vi'` (FD10) |
| `version` | có | `isValidContentVersion` (M2) **và** đúng dạng `major.minor` (D-M3-05) |
| `status` | có | `'Draft'` hoặc `'Published'`. `Archived` **không** được ghi bằng file seed |
| `contentSource` | không | `HumanAuthored` (mặc định) \| `AIGenerated` \| `Hybrid` — giữ chỗ để pipeline AI sau này dùng cùng schema; M3 không sinh nội dung và không đọc AI |
| `items` | có | Mảng; mỗi phần tử có **đúng** `subjectType`, `subjectKey`, `bodyText` |
| `items[].bodyText` | có | Chuỗi không rỗng sau `trim()`; nội dung không bị sửa khi ghi |

Schema **strict**: khoá lạ (`tone`, `content`, `status` trên từng dòng…) bị từ chối, vì lỗi đánh máy tên trường phải bắt được. Không có `tone` theo dòng (FD13). Không có `schemaVersion` (không cần ở MVP).

Ánh xạ vào `InterpretationContentRecord`: `bodyText → bodyText`, header → `language`/`version`/`status`/`contentSource`, `tone = null`.

**File mẫu:** 3 dòng đại diện (như ví dụ), `status: "Draft"`, `bodyText` là chuỗi giữ chỗ chứa dấu `[OWNER_CONTENT_REQUIRED]` (không phải lời diễn giải chiêm tinh). **Không** phải nội dung production; ghi rõ ở mục `prisma/README.md`.

## 15. Content Validator

**Vị trí:** `backend/src/modules/chart/infrastructure/content/` (D-M3-03): `interpretation-content-file.schema.ts` (Zod), `interpretation-content.validator.ts`. Nằm trong `src/` để được `typecheck`/`build`/coverage kiểm; không import `fs`, Prisma hay Express.

**API:**
- `validateInterpretationContentText(text: string): ValidationResult` — parse JSON (lỗi JSON → issue `MALFORMED_JSON`), rồi gọi bước sau.
- `validateInterpretationContent(input: unknown): ValidationResult`.
- `ValidationResult = { ok: boolean; issues: ValidationIssue[]; coverage: ContentCoverage | null; file: InterpretationContentFile | null }`; `file` chỉ có khi `ok`.
- `ValidationIssue = { code: string; message: string; path?: string }`; `ContentCoverage = { expected: number; present: number; missing: InterpretationSubjectRef[]; unexpected: InterpretationSubjectRef[] }`.

**Quy tắc (mỗi quy tắc một mã issue):**

| Nhóm | Quy tắc | Tái sử dụng M2 |
|---|---|---|
| Cấu trúc | JSON hợp lệ; Zod strict; thiếu trường bắt buộc | — |
| Header | `language='vi'`; `status` ∈ {Draft, Published}; `version` hợp lệ và `major.minor`; `contentSource` hợp lệ | `isValidContentVersion` |
| Subject type | Phải thuộc `MVP_INTERPRETATION_SUBJECT_TYPES`; loại dành riêng (`Aspect`, `PatternType`, `SignSummary`, `HouseSummary`) → `RESERVED_SUBJECT_TYPE`; loại lạ → `INVALID_SUBJECT_TYPE` | `MVP_INTERPRETATION_SUBJECT_TYPES`, `INTERPRETATION_SUBJECT_TYPES` |
| Subject key | Phải khớp grammar **của đúng subjectType** (nhà ngoài 1..12, Ascendant dưới PlanetInSign, hành tinh ngoài MVP đều bị từ chối) | `isValidInterpretationSubjectKey` (không tạo regex thứ hai) |
| Nội dung | `bodyText` không rỗng; không chứa `[OWNER_CONTENT_REQUIRED]` khi `status = Published` (D-M3-06) | — |
| Duy nhất | Trùng danh tính → `DUPLICATE_SUBJECT`. Danh tính = `(subjectType, subjectKey)`; `language`, `version`, `tone=null` cố định theo file, nên khớp UNIQUE của DB `(subject_type, subject_key, language, version, COALESCE(tone,''))` | — |
| Bao phủ | `expected = enumerateMvpInterpretationSubjects()`; tính `missing` và `unexpected` (mọi dòng ngoài tập mong đợi). `unexpected` ≠ rỗng luôn là lỗi. `missing` ≠ rỗng là lỗi **khi `status = Published`** (`INCOMPLETE_PUBLISHED_CONTENT`); với `Draft` chỉ báo cáo | `enumerateMvpInterpretationSubjects` |

**Giải quyết KG-M2-02:** validator là consumer production đầu tiên của `MVP_INTERPRETATION_SUBJECT_TYPES`, nên hằng này có lý do tồn tại (không xoá).

**Số lượng issue:** gom tối đa toàn bộ lỗi (không dừng ở lỗi đầu); CLI chỉ in tối đa N dòng đầu mỗi mã kèm tổng số (N là chi tiết triển khai).

## 16. MVP Subject Coverage

- Tập mong đợi: 252 = 120 `PlanetInSign` + 12 `AngleInSign` + 120 `PlanetInHouse`, sinh bởi `enumerateMvpInterpretationSubjects()` (M2).
- `Published` ⟹ phải đủ 252 (đúng DB Spec §5.13 "version mới phải có bản ghi cho toàn bộ `subject_key` đang dùng"). Đây là rào chắn chống **R3 (nội dung một phần bị coi là hoàn chỉnh)**.
- `Draft` được phép thiếu để owner làm việc dần; báo cáo `missing` là danh sách việc cần làm (liệt kê key sẵn, không sinh prose).
- Không có "template đủ 252 dòng" trong M3 (xem D-M3-07).

## 17. Seed Strategy

**Chiến lược:** **bất biến cho `Published`, thay thế được `Draft`, hoàn tác toàn bộ trong một giao dịch** (D-M3-08, xác nhận ở O-M3-2). Không `upsert` (Prisma không biểu diễn được UNIQUE expression của bảng). Không xoá hay ghi đè hàng `Published` hoặc `Archived`.

**Thuật toán (`seedInterpretationContent(prisma, file)`, trong `prisma.$transaction`):**

1. Kiểm tra hàng `languages` `vi` tồn tại; nếu không → `ContentSeedPrerequisiteError` (hướng dẫn chạy `prisma:deploy`). Seeder **không** tự tạo `vi` (migration sở hữu dữ liệu tham chiếu, A1).
2. Đọc các dòng hiện có của `(language, version)`.
3. Kiểm tra va chạm version: nếu có version khác chuỗi nhưng `compareContentVersion === 0` với version đang seed (vd `'1'` và `'1.0'`) → từ chối (tránh hai version "bằng nhau").
4. Quyết định theo bảng:

| Hiện trạng `(vi, version)` | File `Draft` | File `Published` |
|---|---|---|
| Không có dòng | Chèn tất cả (`Draft`) | Chèn tất cả (`Published`) |
| Có dòng, **giống hệt** (cùng tập key, `bodyText`, `status`, `contentSource`) | Không làm gì (`unchanged`) | Không làm gì (`unchanged`) |
| Chỉ có dòng `Draft`, khác | Thay thế: xoá các dòng `Draft` rồi chèn lại (`replaced-draft`) | Thăng hạng: xoá các dòng `Draft` rồi chèn `Published` (`replaced-draft`) |
| Có bất kỳ dòng `Published`/`Archived`, khác file | **Từ chối** (`ContentSeedConflictError`): không hạ cấp, không ghi đè | **Từ chối**: yêu cầu tạo version mới |

5. Chèn bằng `createMany` (một câu lệnh, nguyên tử); giao dịch rollback toàn bộ khi lỗi. Kết quả `{ outcome: 'inserted' | 'unchanged' | 'replaced-draft', count }`.
6. Ghi `status` theo file; `content_source` từ header (mặc định `HumanAuthored`); `tone = null`.

**Quyết định (tính xác định):** seeder không phụ thuộc thứ tự dòng của file; so sánh "giống hệt" theo tập. Chèn theo thứ tự canonical của `enumerate` để log ổn định.

**CLI `prisma/seed-content.ts` (mỏng, ≈30–40 dòng, không có logic nghiệp vụ):**
1. `import 'dotenv/config'` (tiền lệ `seed.config.ts`); **không** import `seed.config.ts` (nó `process.exit(1)` khi thiếu `SEED_ADMIN_*` và sẽ làm seed nội dung phụ thuộc vào thông tin Admin).
2. Đọc tham số bằng `node:util` `parseArgs`: `--file <path>` (mặc định `prisma/content/interpretations.vi.json`), `--validate-only`.
3. Đọc file (`fs`); thiếu file → thông báo nêu rõ nội dung production chưa được owner cung cấp, exit 1.
4. Validate; in tóm tắt (đếm issue theo mã, coverage); có lỗi → exit 1, **chưa mở kết nối DB**.
5. `--validate-only` → exit 0 sau khi validate (không cần DB).
6. Ngược lại: `new PrismaClient()`, gọi seeder, in `outcome` và số dòng, `$disconnect()`; lỗi → in lỗi, exit 1.

**Script:** `"prisma:seed:content": "tsx prisma/seed-content.ts"` (dùng `npm run prisma:seed:content -- --file …`). Không móc vào `prisma db seed`/`db:reset` (seed đó đang tạo Admin và cần `SEED_ADMIN_*`); nội dung được seed bằng lệnh riêng.

**Thực tế cần biết:** CLI nằm ngoài phạm vi `typecheck`/`build` (Mục 3), nên toàn bộ logic nằm trong `src/` và CLI được kiểm bằng ESLint cùng lần chạy thật ở Mục 18. Đây là khoảng trống có từ trước (cũng đúng với `seed.ts` và `generate-openapi.ts`), ghi thành KG-M3-01, không sửa `tsconfig` trong M3.

## 18. Clean Database Workflow

Lệnh lấy từ `package.json`, `docker-compose.test.yml`, `backend-ci.yml` và log M1 của owner (owner dùng Windows nên cú pháp biến môi trường khác nhau).

| Bước | Lệnh (chạy trong `backend/`) | Ghi chú |
|---|---|---|
| 1. Khởi động Postgres test | `docker compose -f docker-compose.test.yml up -d` | `UNVERIFIED` cú pháp `docker compose` so với `docker-compose` trên máy owner; log M1 cho thấy container dev tên `backend-postgres-1` |
| 2. Trỏ DB test | `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test` (PowerShell: `$env:DATABASE_URL="…"`) | Cùng URL `vitest.config.ts` và CI |
| 3. DB sạch + migration | `npx prisma migrate reset --force --skip-seed` | Đã dùng ở log M1; áp dụng đủ 5 migration, `vi` có sẵn |
| 4. Kiểm file nội dung (không cần DB) | `npm run prisma:seed:content -- --file prisma/content/interpretations.vi.sample.json --validate-only` | Kỳ vọng: hợp lệ, `Draft`, coverage 3/252 |
| 5. Seed | `npm run prisma:seed:content -- --file prisma/content/interpretations.vi.sample.json` | Kỳ vọng: `inserted`, 3 dòng `Draft` |
| 6. Chạy lại | lệnh bước 5 | Kỳ vọng: `unchanged` |
| 7. Đếm theo trạng thái | `docker exec <tên container> psql -U postgres -d test -c "SELECT status, count(*) FROM astrology.interpretation_contents GROUP BY status;"` | Tiền lệ log M1 dùng `docker exec … psql … astrology.charts`; tên container test `UNVERIFIED` (`docker ps`) |
| 8. Test | `npm test` | Test tích hợp tự seed dữ liệu đầy đủ 252 dòng trong test (Mục 19) |

Vì sample là `Draft`, bước 5–7 chứng minh pipeline nhưng provider **không** trả hàng nào (đúng bộ lọc `Published`). Việc tra cứu 252 hàng `Published` qua provider được chứng minh bằng test tích hợp (dữ liệu test sinh từ `enumerate`) và, khi owner có file thật, bằng nghiệm thu ở M6.

## 19. Integration Test Strategy

Chạy với Postgres thật, theo vòng đời hiện có: DB đã migrate, `clearDatabase()` trước mỗi test, `languages` được giữ lại. File mới: `tests/integration/modules/chart/content/interpretation-content.seeder.test.ts`.

**Dữ liệu test:** file hợp lệ 252 dòng sinh **trong test** từ `enumerateMvpInterpretationSubjects()` với `bodyText = "test:" + subjectKey` (fixture chỉ dùng trong test, không phải nội dung chiêm tinh, không ghi vào repo như nội dung production).

| Hành vi | Ca kiểm | Ghi chú |
|---|---|---|
| Published lookup | Seed file `Published` 252 dòng → `provider.findPublishedContents('vi','1.0', 252 subjects)` trả đủ 252; so sánh theo tập | Thêm `findPublishedVersions` = `['1.0']` |
| Subject type/key | Ba ca đại diện `PlanetInSign/Sun_in_Leo`, `PlanetInHouse/Venus_in_House_7`, `AngleInSign/Ascendant_in_Leo` trả đúng `bodyText` | |
| Ngôn ngữ | `vi` có dữ liệu; `findPublishedContents('en', …)` → `[]` | `en` không tồn tại trong `languages`; truy vấn vẫn trả `[]` |
| Version | Tra `'2.0'` → `[]`; seed thêm `'1.1'` Published thì hai version cùng tồn tại | M1 đã có ca coexist; M3 kiểm với dữ liệu đủ |
| Status | Seed file `Draft` → `provider` trả `[]` và `findPublishedVersions` = `[]` | R5 |
| Thiếu nội dung | Tra subject không có trong DB → `[]` | |
| Seeder `unchanged` | Seed hai lần cùng file → lần hai `unchanged`, tổng 252 | R4 |
| Thăng hạng Draft | Seed `Draft` rồi cùng version `Published` → `replaced-draft`, provider trả 252 | |
| Từ chối ghi đè | Seed `Published`, rồi file khác nội dung → `ContentSeedConflictError`, DB nguyên vẹn | |
| Từ chối hạ cấp | `Published` đã có, seed `Draft` cùng version → từ chối | |
| Va chạm version | Hàng thủ công `'1'` rồi seed `'1.0'` → từ chối | |
| Thiếu `vi` | Xoá hàng `vi` tạm thời (khôi phục trong `afterEach`) → `ContentSeedPrerequisiteError` | |
| Database failure | **Không thêm test mới.** Nhánh này đã có test stub ở M1 (`Failure Semantics`); không thêm kiểu test giả lập lỗi kết nối vì repo chưa có tiền lệ và dễ giòn | Quyết định ghi tại D-M3-09 |
| Giao dịch | Không thêm test "lỗi giữa chừng" riêng: validator chặn dữ liệu sai trước DB và `createMany` là một câu lệnh nguyên tử; tính nguyên tử dựa vào giao dịch Prisma | Ghi nhận giới hạn, không phải gap hành vi |

Provider test M1 giữ nguyên, không sửa.

## 20. Unit/Test Matrix

`tests/unit/modules/chart/infrastructure/content/interpretation-content.validator.test.ts`, dùng `it.each` (đã có tiền lệ ở M2). Không cần DB, Docker, Prisma, mạng.

| Ca | Mã issue dự kiến |
|---|---|
| File mẫu (đọc từ `prisma/content/…sample.json`) hợp lệ, coverage 3/252 | — |
| File 252 dòng sinh từ `enumerate`, `Published` | ok, `missing = 0` |
| JSON hỏng | `MALFORMED_JSON` |
| Thiếu trường bắt buộc (mỗi trường header; mỗi trường item) | schema |
| Khoá lạ (`tone`, `content`, `status` trên dòng) | schema (strict) |
| `subjectType` lạ | `INVALID_SUBJECT_TYPE` |
| `subjectType` dành riêng (`Aspect`…) | `RESERVED_SUBJECT_TYPE` |
| Key sai grammar: `Sun_in_house_7`, `Sun_House_7`, `Ascendant_in_House_1`, `UnknownPlanet_in_Leo`, `Sun_in_UnknownSign` | `INVALID_SUBJECT_KEY` |
| Nhà không hợp lệ: `Sun_in_House_0`, `Sun_in_House_13` | `INVALID_SUBJECT_KEY` |
| Key đúng nhưng sai loại: `Ascendant_in_Leo` dưới `PlanetInSign` | `INVALID_SUBJECT_KEY` |
| Trùng danh tính | `DUPLICATE_SUBJECT` |
| Thiếu subject (Published) | `INCOMPLETE_PUBLISHED_CONTENT`, liệt kê `missing` |
| Thiếu subject (Draft) | ok, `missing` được báo cáo |
| Dòng ngoài tập mong đợi | `unexpected` > 0 → lỗi (cả hai status) |
| `language` ≠ `vi` (`en`) | `INVALID_LANGUAGE` |
| `status` lạ hoặc `Archived` | `INVALID_STATUS` |
| `version`: `''`, `'1'`, `'1.0.0'`, `'v1.0'`, `'01.0'` | `INVALID_VERSION` |
| `bodyText` rỗng hoặc chỉ khoảng trắng | `EMPTY_BODY_TEXT` |
| Chứa `[OWNER_CONTENT_REQUIRED]` khi `Published` | `PLACEHOLDER_CONTENT` |
| `items` không phải mảng; JSON không phải object | schema |

Seeder logic thuần (nếu có hàm phân loại hiện trạng → hành động) được unit test riêng; phần chạm DB do test tích hợp phủ.

## 21. File Change Map

**Tạo mới**

- `backend/src/modules/chart/infrastructure/content/interpretation-content-file.schema.ts`
- `backend/src/modules/chart/infrastructure/content/interpretation-content.validator.ts`
- `backend/src/modules/chart/infrastructure/content/interpretation-content.seeder.ts` (gồm hai lỗi `ContentSeedConflictError`, `ContentSeedPrerequisiteError`)
- `backend/prisma/seed-content.ts`
- `backend/prisma/content/interpretations.vi.sample.json`
- `backend/tests/unit/modules/chart/infrastructure/content/interpretation-content.validator.test.ts`
- `backend/tests/integration/modules/chart/content/interpretation-content.seeder.test.ts`

**Sửa**

- `backend/package.json` — thêm script `prisma:seed:content` (không đổi version).
- `backend/prisma/README.md` — mục quy trình nội dung (Mục 26).
- Tài liệu theo Mục 26.

**Chỉ đọc (không sửa)**

`infrastructure/repositories/prisma-interpretation-content.provider.ts`, `domain/ports/interpretation-content-provider.port.ts`, `domain/interpretation/*`, `domain/types/interpretation.types.ts`, `prisma/seed.ts`, `prisma/seed.config.ts`, `prisma/schema.prisma`, `tests/helpers/database.helper.ts`, `vitest.config.ts`, `.eslintrc.cjs`, `scripts/generate-openapi.ts`.

**Không được chạm:** `composition-root.ts`, `domain/**` (M2 đóng), `prisma/migrations/**`, `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/seed.config.ts`, `tsconfig*.json`, port, provider production, mọi use case và presentation.

**Test mới nằm ở thư mục mới** (`tests/unit/.../infrastructure/content/`, `tests/integration/.../content/`) vì thư mục hiện có chỉ chứa `adapters/` và `repositories/`; đặt seeder test vào `repositories/` sẽ sai nghĩa.

## 22. Task Breakdown

Khối lượng thực: provider đã xong nên M3 nhẹ hơn prompt dự đoán; ba task, mỗi task có một đầu ra kiểm chứng riêng. Không tách "provider" thành task vì không có mã production mới cho provider.

**Task 1 — Content contract & validator (kèm unit test).**
Schema Zod strict, `validateInterpretationContent[Text]`, mã issue, coverage, hằng placeholder; file mẫu `interpretations.vi.sample.json`; unit test Mục 20.

**Task 2 — Seeder, CLI & script (kèm test tích hợp).**
`seedInterpretationContent`, hai lỗi, `prisma/seed-content.ts`, script `prisma:seed:content`; test tích hợp seed → provider (Mục 19), gồm xác minh provider M1 với dữ liệu seed.

**Task 3 — Xác minh & tài liệu.**
Chạy Exit Criteria (Mục 28), quy trình clean-DB (Mục 18), cập nhật tài liệu (Mục 26), điền Evidence Matrix.

## 23. Decision Log

M1/M2 và FD1–FD14 không mở lại. Chỉ quyết định mới của M3:

| ID | Quyết định | Lý do / phương án đã loại | Tác động |
|---|---|---|---|
| D-M3-01 | Không đổi provider production; Task provider = kiểm chứng + test | Provider M1 đã đúng hợp đồng; viết lại là rủi ro không cần thiết | Giảm phạm vi |
| D-M3-02 | Không wiring `composition-root.ts` ở M3 | Chưa có consumer; wiring thuộc M4 khi có service | Không đổi hành vi runtime |
| D-M3-03 | Validator + seeder nằm ở `chart/infrastructure/content/`; CLI mỏng ở `prisma/` | `src/` được typecheck/coverage kiểm, `prisma/` thì không; infrastructure được phép import domain; tránh đặt ở application vì không có đường application → infrastructure | Mã kiểm được; không chạm ranh giới |
| D-M3-04 | Header file: `language`, `version`, `status`, tùy chọn `contentSource`; item: `subjectType`, `subjectKey`, `bodyText`; schema strict | Mở rộng tối thiểu cấu trúc đã chốt ở Plan v1.1 để có chiến lược trạng thái (FD12); `bodyText` khớp domain và cột DB; strict bắt lỗi chính tả. Loại phương án để `status`/`version`/`tone` theo từng dòng (lặp, dễ lệch) | Owner chỉ cần soạn `items` |
| D-M3-05 | `version` phải `major.minor` (ngoài `isValidContentVersion`) | Tránh hai version `'1'`/`'1.0'` khác chuỗi nhưng so sánh bằng nhau (O-M2-1) | Ràng buộc ở ranh giới nhập |
| D-M3-06 | Dấu `[OWNER_CONTENT_REQUIRED]` bị từ chối khi `Published` | Chặn publish nhầm file mẫu/giữ chỗ (R3) | Hằng số trong validator |
| D-M3-07 | Không sinh template 252 dòng | Danh sách key thiếu đã nằm trong báo cáo `missing`; sinh file là sinh dữ liệu không được yêu cầu | Có thể thêm sau nếu owner muốn |
| D-M3-08 | Seed: `Published` bất biến, `Draft` thay thế được, giao dịch, không `upsert` | Prisma không có khoá hợp cho UNIQUE expression; tránh phá hủy nội dung đang chạy; cho phép sửa bản nháp | Bảng Mục 17 |
| D-M3-09 | Không thêm test lỗi hạ tầng mới | Đã có stub test M1; repo chưa có mẫu test lỗi kết nối | Ghi nhận ở Mục 19 |
| D-M3-10 | Không thêm `orderBy` cho provider | Hợp đồng M2: không đảm bảo thứ tự | Test so sánh theo tập |
| D-M3-11 | Seed nội dung là lệnh riêng, không móc vào `prisma db seed`/`db:reset` | `seed.ts` cần `SEED_ADMIN_*` và thoát khi thiếu | Hai seed độc lập |

## 24. Open Questions

Tất cả các câu hỏi mở đã được owner xác nhận và chốt:

| ID | Quyết định (Approved) | Tác động tới M3 |
|---|---|---|
| O-M3-1 | **Approved**: M3 tạo `interpretations.vi.sample.json` làm structural/test fixture. Sample có ít nhất 3 representative subjects bao phủ cả 3 loại (PlanetInSign, PlanetInHouse, AscendantInSign). Không tạo production file, full 252-item deferred tới M6. | Sẽ tạo sample json gồm `Sun_in_Leo`, `Venus_in_House_7`, và `Ascendant_in_Leo`. |
| O-M3-2 | **Approved**: `Published` là immutable. `Draft` có thể được cập nhật/thay thế. Chỉnh sửa `Published` bắt buộc phải ra version mới. | Seeder sẽ hoạt động đúng theo chiến lược ở Mục 17. |
| O-M3-3 | **Approved**: Header file có `version, language, status, contentSource, items`. Version STRICTLY dạng `major.minor`. | Zod validator sẽ bắt buộc các trường này và strict version format. |
| O-M3-4 | **Approved**: `PrismaInterpretationContentProvider` KHÔNG wiring vào `composition-root.ts` ở M3, hoãn tới M4. | File provider giữ nguyên như M1, không chạm composition-root. |

## 25. Risks

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Schema JSON lệch Prisma/DB | Trung bình | Validator ánh xạ thẳng vào `InterpretationContentRecord`; test tích hợp seed→provider; UNIQUE của DB là lớp bảo vệ cuối |
| Tạo lại grammar ở validator | Trung bình | Chỉ gọi `isValidInterpretationSubjectKey`, `enumerate…`, `isValidContentVersion`; không có regex mới cho key |
| Nội dung một phần bị coi là đủ (R3) | Trung bình | `Published` đòi đủ 252; chặn `[OWNER_CONTENT_REQUIRED]`; sample là `Draft` |
| Seed phá nội dung đang chạy (R4) | Cao nếu sai | Bảng Mục 17; giao dịch; từ chối ghi đè `Published`; test ba ca xung đột |
| Provider trả Draft (R5) | Thấp | Test status với dữ liệu seed |
| Lỗi DB bị nuốt thành `[]` (R6) | Thấp | Hợp đồng port + test M1; M3 không đổi code |
| Ô nhiễm AI (R7) | Thấp | Không có phụ thuộc/biến môi trường AI; `contentSource` chỉ là nhãn; không có mã sinh nội dung trong `src/modules/chart` |
| CLI không được typecheck | Thấp | Logic nằm trong `src/`; CLI mỏng; lint + chạy thật (KG-M3-01) |
| `seed.config.ts` phụ thuộc Admin | Thấp | CLI nội dung không import nó (D-M3-11) |
| Đường dẫn Windows/PowerShell của owner | Thấp | Dùng `path.resolve` và `parseArgs`; hướng dẫn biến môi trường cho PowerShell |

## 26. Documentation Changes

Chỉ những tài liệu bị ảnh hưởng thật:

- `backend/prisma/README.md`: mục "Interpretation content pipeline" — vị trí file, cấu trúc JSON, bảng chiến lược seed, lệnh clean-DB, nêu rõ file mẫu **không phải** nội dung production và owner là bên cung cấp prose.
- Sprint 4 Plan v1.1 §19–§20: cập nhật tên phương thức provider và đường dẫn thật (hoặc ghi Decision Log trỏ tới plan M3, không sửa lịch sử).
- `backend/README.md`: thêm `prisma:seed:content` vào bảng script **nếu** README đang liệt kê script (đã thấy mục lệnh; xác nhận khi thực hiện).
- Known Gaps Registry Sprint 4 (chưa tạo): KG-M3-01 (CLI ngoài `typecheck`), nội dung production chưa có, KG-S4-06/08, KG-M1-03/05, KG-M2-03..06.
- Không đổi DB Spec, REST API Spec, Architecture Spec (không có thay đổi hợp đồng).

## 27. Acceptance Criteria

**Provider**
1. `PrismaInterpretationContentProvider` vẫn implement port; file production không đổi (hoặc đổi có lý do ghi Decision Log).
2. Tra cứu chính xác theo `subjectType`/`subjectKey`/`language`/`version` đúng với dữ liệu seed.
3. `vi` hoạt động; version khác → `[]`; chỉ `Published` được trả; thiếu → `[]`.
4. Lỗi hạ tầng vẫn truyền lên (kiểm bằng test M1, không bị giảm).
5. Prisma chỉ nằm ở `infrastructure/`; `domain/**` không đổi.

**Validator**
6. Cấu trúc, header, subject type, key (qua M2), trùng, thiếu/dư subject, language/status/version, house sai, nội dung rỗng đều được phát hiện (Mục 20).
7. Không có danh sách 252 key hay grammar thứ hai.
8. `MVP_INTERPRETATION_SUBJECT_TYPES` được validator dùng.

**Seed**
9. Nội dung không hợp lệ không bao giờ tới DB (validate trước, chưa mở kết nối).
10. DB sạch seed được; chạy lại không tạo trùng (`unchanged`).
11. `Published` không bị ghi đè hoặc hạ cấp; `Draft` thay thế được.
12. CLI exit khác 0 khi file thiếu, sai, hoặc xung đột; `--validate-only` không cần DB.

**Integration/Regression**
13. Test tích hợp seed → provider pass trên Postgres thật; test M1/M2 vẫn xanh.
14. `lint`, `typecheck`, `format:check`, `build` pass; không TODO/FIXME chưa phân loại.
15. Không có phụ thuộc hay biến môi trường AI.
16. Nội dung production thiếu được ghi rõ là phụ thuộc của owner.

## 28. Exit Criteria

Chạy trong `backend/` (lệnh lấy từ `package.json`):

| Tiêu chí | Lệnh |
|---|---|
| Unit validator | `npx vitest run tests/unit/modules/chart/infrastructure/content` (kèm `NODE_ENV=test`) |
| Tích hợp seeder + provider (cần Postgres) | `npx vitest run tests/integration/modules/chart/content` |
| Hồi quy toàn bộ | `npm test` |
| Lint / Format | `npm run lint`, `npm run format:check` |
| Typecheck / Build | `npm run typecheck`, `npm run build` |
| Clean DB workflow | Các bước 1–8 ở Mục 18 (log owner) |
| Ranh giới | `grep` `@prisma\|fs` trong `src/modules/chart/domain`; `grep` `fs` trong `infrastructure/content/` (kỳ vọng 0) |
| Không AI | `grep -ri "openai\|anthropic" src package.json` (kỳ vọng 0) |
| TODO/FIXME | `grep` trong file M3 |

Lưu ý môi trường: sandbox của Claude không tải được Prisma engine nên không chạy được test tích hợp, `typecheck`, `build`; các mục đó cần log của owner hoặc CI. Evidence Matrix ghi tách "Claude chạy / Owner chạy / CI". Nếu log owner chạy trước commit cuối, ghi rõ commit của log (bài học M2).

## 29. Definition of Done

1. M1 và M2 vẫn an toàn hồi quy.
2. Provider đã được chứng minh với dữ liệu seed qua test tích hợp.
3. Schema JSON được ghi tài liệu và kiểm bằng validator.
4. Validator từ chối nội dung sai, trùng, thiếu, dư.
5. Seeder kiểm trước khi ghi; hành vi xác định và có tài liệu.
6. DB sạch seed được và đọc lại được.
7. Test unit và tích hợp pass.
8. Lint/typecheck/format/build pass.
9. Không TODO/FIXME chưa phân loại; không phụ thuộc AI.
10. Evidence Matrix có bằng chứng thật; nội dung production thiếu được ghi là phụ thuộc owner.

## 30. Evidence Matrix

Trạng thái lúc lập plan; chưa chạy lệnh nào cho M3.

| ID | Tiêu chí | Bằng chứng cần | Trạng thái |
|---|---|---|---|
| EV-M3-00 | M1/M2 tiền đề | Evidence Matrix M1 v2, M2; kiểm tra file ở Mục 2 | PASS (tiền đề) |
| EV-M3-01 | Hồi quy M1 | `npm test` thật | UNVERIFIED |
| EV-M3-02 | Hồi quy M2 | `npm test` thật | UNVERIFIED |
| EV-M3-03 | Provider với dữ liệu seed | Test tích hợp | UNVERIFIED |
| EV-M3-04 | Validator | Test unit | UNVERIFIED |
| EV-M3-05 | Migration trên DB sạch | Lệnh/log Mục 18 bước 3 | UNVERIFIED |
| EV-M3-06 | Seed thực thi | Lệnh/log Mục 18 bước 5–6 | UNVERIFIED |
| EV-M3-07 | Provider lookup | Test tích hợp | UNVERIFIED |
| EV-M3-08 | Từ chối nội dung sai | Test validator | UNVERIFIED |
| EV-M3-09 | Phát hiện trùng | Test validator | UNVERIFIED |
| EV-M3-10 | Bao phủ subject mong đợi | Test validator + tích hợp | UNVERIFIED |
| EV-M3-11 | Seeder: unchanged/thăng hạng/từ chối | Test tích hợp | UNVERIFIED |
| EV-M3-12 | Typecheck | Log | UNVERIFIED |
| EV-M3-13 | Lint | Log | UNVERIFIED |
| EV-M3-14 | Format | Log | UNVERIFIED |
| EV-M3-15 | Build | Log | UNVERIFIED |
| EV-M3-16 | Ranh giới, không AI, TODO/FIXME | `grep` | UNVERIFIED |
| EV-M3-17 | Nội dung production | File do owner cung cấp | DEFERRED (phụ thuộc owner, M6) |

## 31. Implementation Sequence

1. Owner xác nhận O-M3-1..4 (hoặc sửa đề xuất).
2. Task 1: schema → validator → file mẫu → unit test.
3. Task 2: seeder → CLI → script → test tích hợp (seed → provider).
4. Task 3: clean-DB workflow, Exit Criteria, tài liệu, Evidence Matrix.
5. Chỉ đóng M3 khi có log thật (ghi commit của log).

Provider không có bước riêng vì không có mã production mới cho nó.

## 32. Final Architecture Review

```
Domain ──▶ Port ──▶ Infrastructure (provider) ──▶ PostgreSQL       (không đổi, M1)
Domain subject manifest ──▶ Validator ──▶ Seeder ──▶ PostgreSQL     (M3, đều ở infrastructure)
JSON (owner) ──▶ CLI (prisma/) ──▶ Validator
```

- Không có `Domain → Prisma`: seeder và validator ở `infrastructure/`, chỉ import xuôi vào `domain/`.
- Không có `Runtime → LLM` và không có `Provider → AI`: không thêm phụ thuộc hay biến môi trường AI; `contentSource` chỉ là nhãn dữ liệu.
- Hai đường nội dung không phụ thuộc lẫn nhau (provider không import seeder).
- Điểm đáng lưu ý: CLI nằm ngoài `typecheck`; giảm thiểu bằng cách giữ logic trong `src/` (KG-M3-01).
- Phát hiện quan trọng nhất của audit: provider đã tồn tại; M3 là pipeline nội dung, nhỏ hơn mô tả trong prompt.
- Không có FD nào bị mở lại; năm điểm lệch prompt/repo đã ghi ở Mục 5.

## 33. Final Recommendation

`READY`

**Điều kiện:** Tất cả Open Questions đã được project owner xác nhận. Nội dung production 252 mục chưa có trong repo; đó là phụ thuộc của owner cho nghiệm thu ở M6, không chặn việc xây pipeline. Sẵn sàng triển khai M3.
