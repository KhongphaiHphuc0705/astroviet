# Sprint 4 Backend Implementation Plan

## Interpretation Engine (Content Bank + Version Pinning)

**Phiên bản:** 1.1 — Confirmed. R1–R4 đã được project owner xác nhận (Mục 29). Sẵn sàng bắt đầu M1.
**Vị trí đề xuất trong repo:** `docs/implementation/Sprint_4_Interpretation_Engine_Implementation_Plan.md`
**Dựa trên:** audit trực tiếp nhánh `dev` (commit `a369019`), `backend/src/modules/chart/**`, `backend/prisma/**`, `backend/tests/**`, DB Design Spec §5.5/5.7/5.13, REST API Spec §5.4/5.5/14.1/14.9, Project Architecture Spec §3.3/ADR-007, Sprint 3 Known Gaps Registry (G-01), Sprint F3 Summary.
**Nguyên tắc:** repo là nguồn sự thật về cái đã làm; spec đã đóng băng là nguồn sự thật về thiết kế. Mọi chỗ lệch được ghi ở Mục 28.

---

## 1. Sprint Overview

Sprint 4 lấp **Known Gap G-01**: `ChartResponse.interpretations` hiện luôn trả `[]` (mapper dòng "D-2"), và `charts.snapshot_interpretation_version` luôn `null` (`prisma-chart.mapper.ts`).

Sprint 4 **không** xây một "rule engine" tổng quát. Theo spec đã đóng băng, "Interpretation Engine" gồm hai phần:

1. **Suy ra danh sách subject cần diễn giải** từ Chart đã tính (hàm thuần, deterministic).
2. **Tra cứu nội dung tiếng Việt** trong content bank PostgreSQL (`astrology.interpretation_contents`) theo `(subject_type, subject_key, language, version)`, ghim version vào chart.

Luồng: `Chart (Sprint 3) → derive subjects → lookup content bank (version pinned) → InterpretationResponse[] nhúng trong ChartResponse`.

## 2. Current Repository State (đã verify)

- Module `chart` có đủ 4 lớp: `domain/`, `application/`, `infrastructure/`, `presentation/`. **Không có** module `interpretation` (README trên `main` liệt kê nhưng đã lỗi thời).
- `Chart` entity bất biến; `ChartProps` **chưa có** `snapshotInterpretationVersion`.
- `Planet` có `name`, `zodiacPosition.sign`, `house: number | null`, `isRetrograde`. `Angle` chỉ có `type` + `longitude` (sign suy ra bằng `ZodiacPosition.fromLongitude`, mapper hiện đã làm vậy).
- `ChartResponseMapper.toResponse(chart)` là hàm **static, đồng bộ, thuần** — chưa có chỗ cho dữ liệu async.
- `GetChartUseCase` trả `Chart`; ownership qua `assertChartOwnership` (403 `FORBIDDEN`), không tìm thấy → `NotFoundError`. `POST /charts/natal` cho phép guest (`save=false`, `userId = null`).
- DI tập trung ở `backend/src/composition-root.ts`.
- Prisma: multiSchema (`identity`, `astrology`, `content`). **Chưa có** model `Language`, `InterpretationContent`. Dữ liệu tham chiếu (vd `house_systems`) được `INSERT` thẳng trong migration SQL.
- Index/constraint Prisma không biểu diễn được (partial, expression, CHECK) được viết tay trong migration SQL (xem `prisma/README.md`).
- Vitest: **không có coverage threshold** (risk-based, Sprint 3 §12.7). `tests/helpers/database.helper.ts` truncate mọi bảng trừ `_prisma_migrations` và `house_systems`.
- `IInterpretationContentProvider` (nêu trong Architecture Spec §12 và G-01) **không tồn tại** trong `backend/src`.
- Scripts thật (`backend/package.json`): `lint`, `typecheck`, `format:check`, `test`, `test:coverage`, `build`, `generate:openapi`, `prisma:generate`, `prisma:migrate`, `prisma:deploy`, `prisma:seed`.

## 3. Previous Sprint Dependencies

| Phụ thuộc | Nguồn | Trạng thái |
|---|---|---|
| Chart đã tính: planets (sign, house), angles, `isHouseDataAvailable` | Sprint 3 | Đủ cho MVP, không cần sửa engine |
| `GET /charts/:id` + ownership + `POST /charts/natal` | Sprint 3 | Dùng lại nguyên |
| Quy ước migration raw SQL cho constraint/index đặc biệt | Sprint 0–3 | Dùng lại |
| Frontend F3 (Birth Profile UI) | F3 | Không phụ thuộc; F4/F5 phụ thuộc Sprint 4 |

## 4. Objectives

1. `ChartResponse.interpretations` trả nội dung thật cho phạm vi MVP.
2. Ghim `snapshot_interpretation_version` cho chart `save=true` mới.
3. Giữ chart cũ (`null`) hoạt động, không migration backfill.
4. Chart thiếu giờ sinh vẫn trả 200 với interpretations đã loại House/Angle.
5. Contract ổn định cho F4/F5, tài liệu hoá đầy đủ.
6. Không đổi hành vi tính toán của Sprint 3.

## 5. Scope (đã được project owner chốt)

| Hạng mục | Quyết định |
|---|---|
| API | Giữ trong `ChartResponse`, không endpoint mới (REST Spec §14.1/14.9) |
| Nguồn nội dung | PostgreSQL `interpretation_contents` |
| Vị trí code | Trong module `chart` |
| Nội dung MVP | `PlanetInSign` (10 hành tinh × 12 cung = 120), `AngleInSign` cho Ascendant (12), `PlanetInHouse` (10 × 12 = 120) → **252 mục** |
| Hành tinh MVP | Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto |
| Ngôn ngữ | `vi` duy nhất; tạo bảng `languages`, seed `vi` |
| Nội dung | Một bộ Published do owner cung cấp (file JSON), review thủ công, không CMS |
| Chart cũ | `snapshot = null` → dùng Published mới nhất lúc request, không backfill |
| Thiếu giờ sinh | Trạng thái suy giảm bình thường: bỏ House/Angle, không lỗi |
| Thay đổi contract | Thêm `interpretationVersion: string \| null` ở cấp `ChartResponse` |

## 6. Non-Goals

AI/LLM, CMS hoặc API admin quản lý content, Aspect/Pattern/SignSummary/HouseSummary, Chiron/Lilith/Nodes, mục "Big Three" tổng hợp, tone selection và `interpretationTone` preference, đa ngôn ngữ ngoài `vi`, caching/Redis, retrograde-specific content, PDF/share, đề xuất dự đoán (predictive), diễn giải y tế/tài chính/pháp lý, endpoint `GET /charts/:id/interpretations` riêng (đã bị loại ở REST Spec §14.9), sửa Sprint 3 engine.

## 7. Architecture Context

```
ChartController
   ↓
Create/GetChartUseCase                (application)
   ↓                    ↓
InterpretationLookupService          (application/services — cần I/O)
   ↓                    ↓
deriveInterpretationSubjects(chart)   IInterpretationContentProvider (domain port)
 (domain, pure)                          ↓
                                      PrismaInterpretationContentProvider (infrastructure)
                                         ↓
                                      astrology.interpretation_contents
```

Khớp Architecture Spec §3.3 (`chart/application/services/interpretation-lookup.service.ts`, Application layer) và ADR-007 (luôn JOIN kèm `version`).

## 8. Domain Model

- `InterpretationSubject { subjectType, subjectKey }` — value object thuần.
- `SubjectType` (MVP dùng 3): `PlanetInSign`, `AngleInSign`, `PlanetInHouse`.
- **Key grammar (R1, đã xác nhận):**
  - `PlanetInSign` → `{Planet}_in_{Sign}`, vd `Sun_in_Leo`
  - `AngleInSign` → `Ascendant_in_{Sign}`, vd `Ascendant_in_Leo`
  - `PlanetInHouse` → `{Planet}_in_House_{1..12}`, vd `Sun_in_House_7`
  - Tên hành tinh/cung dùng đúng giá trị enum hiện có (`PlanetName`, `ZODIAC_SIGNS`).
- `InterpretationItem { subjectType, subjectKey, language, bodyText, tone }` — khớp `InterpretationResponse` hiện có (`tone` nullable).
- `InterpretationResult { version: string | null, items: InterpretationItem[] }`.

## 9. Interpretation Engine Design

**9.1 Derive (domain, thuần):** `deriveInterpretationSubjects(chart)` trả mảng subject theo thứ tự cố định:

1. `PlanetInSign` theo thứ tự hành tinh canonical (Sun → Pluto).
2. `AngleInSign` Ascendant — chỉ khi `chart.angles` có Ascendant.
3. `PlanetInHouse` theo thứ tự hành tinh canonical — chỉ khi `chart.isHouseDataAvailable === true` và `planet.house !== null`.

Bỏ qua mọi body ngoài 10 hành tinh MVP (Chiron, Lilith, Nodes). Chuỗi suy giảm (thiếu giờ sinh, hoặc house không khả dụng vì lý do khác) dựa **chỉ** vào `isHouseDataAvailable`/`house`/`angles`, không đọc `isBirthTimeKnown`, nên tự phủ cả trường hợp polar-latitude.

**9.2 Resolve version (application):**
- Chart có `snapshotInterpretationVersion` → dùng đúng version đó.
- Chart `null` hoặc `save=false` → version Published mới nhất của `language = 'vi'`.
- So sánh version bằng hàm thuần `compareContentVersion` (dotted-numeric: `"2.0" > "1.10"` theo từng đoạn số), version bắt buộc khớp `^\d+(\.\d+)*$` (kiểm tra khi seed).

**9.3 Lookup (infrastructure):** một query duy nhất `WHERE language = 'vi' AND version = $v AND status = 'Published' AND tone IS NULL AND (subject_type, subject_key) IN (...)` (tối đa 21 cặp). Service **sắp xếp lại** kết quả theo thứ tự derive (không tin thứ tự DB). Subject không có row → bỏ qua item đó và ghi log warn.

**9.4 Rule representation:** Hybrid có chủ đích — "rule" (subject nào áp dụng cho chart) là TypeScript hard-coded, thuần, test độc lập; **nội dung** nằm trong DB. Không rule database, không DSL: MVP chỉ có 3 loại rule đơn giản; mở rộng sau chỉ cần thêm hàm derive + `SubjectType` (đã có sẵn trong CHECK của spec).

## 10. Interpretation Output Contract

Giữ nguyên `InterpretationResponse` của REST Spec §5.5 (không breaking change):

```json
{
  "id": "…", "planets": [...], "houses": [...], "angles": [...],
  "interpretations": [
    { "subjectType": "PlanetInSign", "subjectKey": "Sun_in_Leo",
      "language": "vi", "bodyText": "…", "tone": null }
  ],
  "interpretationVersion": "1.0",
  "warnings": [], "engineVersion": "…"
}
```

Cam kết với frontend:

- `interpretations` **luôn là mảng** (có thể rỗng), không bao giờ `null`/thiếu field.
- Thứ tự cố định (Mục 9.1); cùng `(chart, version)` luôn cho cùng kết quả.
- `interpretationVersion` = version đã dùng để sinh `interpretations`; `null` **chỉ khi** không có content Published nào dùng được (khi đó `interpretations = []`).
- `tone` nullable (MVP luôn `null`); `contentSource` không expose (REST Spec §14.1).
- `subjectKey` theo grammar Mục 8; F5 tự map tên hiển thị (hành tinh/cung/nhà) bằng từ điển phía frontend, không parse bodyText.
- Không có `sections[]`, `ruleId` (xem D-S4-06).
- `ChartSummaryResponse` (GET `/charts` list) **không đổi**, không có interpretations.

## 11. Persistence Strategy

**Nội dung:** persist trong `astrology.interpretation_contents` (đã chốt). **Kết quả diễn giải:** không persist, tính theo request (rẻ: 1–2 query theo index, ≤ 21 key). Chart chỉ ghim `snapshot_interpretation_version`.

**Ngữ nghĩa version (ghi vào REST/DB Spec):**

| Trường hợp | Version dùng |
|---|---|
| Chart `save=true` tạo sau Sprint 4 | Published mới nhất lúc tạo, **ghim vĩnh viễn** |
| Chart tạo trước Sprint 4 (`null`) | Published mới nhất **tại thời điểm request** (không ghim, không backfill) |
| `save=false` (guest hoặc user) | Published mới nhất lúc request, không persist |
| Không có version Published | `interpretations = []`, `interpretationVersion = null` |

Hệ quả cần ghi rõ: nội dung chart cũ có thể thay đổi khi owner publish version mới. Đây là ngoại lệ có chủ đích của nguyên tắc ADR-007; chart mới thì ổn định.

**Determinism:** đảm bảo cho cặp `(chart, version đã ghim)`. Chart `null`/`save=false` phụ thuộc thời điểm publish — ngoại lệ đã tài liệu hoá.

## 12. Database Changes

**Cần migration:** `backend/prisma/migrations/<timestamp>_init_interpretation_content_bank/migration.sql` (additive, không đụng bảng hiện có).

1. `astrology.languages` (`code` PK, `display_name`, `is_default` default false) + partial unique index `ON (is_default) WHERE is_default = true` + `INSERT ('vi','Tiếng Việt',true)` ngay trong migration (theo tiền lệ `house_systems`).
2. `astrology.interpretation_contents` theo DB Spec §5.13: `id` UUID, `subject_type`, `subject_key`, `language` FK → `languages(code)` ON DELETE RESTRICT, `content_source` default `'HumanAuthored'`, `tone` nullable, `body_text`, `status` default `'Published'`, `version` default `'1.0'`, `created_at`, `updated_at`.
3. CHECK: `subject_type IN ('PlanetInSign','AngleInSign','PlanetInHouse','Aspect','PatternType','SignSummary','HouseSummary')` (**thêm `AngleInSign`** so với spec — D-S4-04); `content_source`, `status`, `tone` theo spec.
4. Index viết tay: `UNIQUE (subject_type, subject_key, language, version, COALESCE(tone,''))` và partial `INDEX (subject_type, subject_key, language, version) WHERE status = 'Published'`.
5. Không thêm FK vật lý từ `charts.snapshot_interpretation_version` (đúng DB Spec §5.7).
6. `schema.prisma`: thêm model `Language`, `InterpretationContent` (schema `astrology`, theo DB Spec — D-S4-04). Cảnh báo drift index đã có trong `prisma/README.md`: **không để Prisma tự drop** index viết tay.

**Rollback:** Prisma không có down-migration; migration thuần additive nên rollback = forward-fix hoặc `db:reset` ở môi trường dev. Chưa có dữ liệu production phụ thuộc, nên rủi ro thấp.
**Test fixture:** `tests/helpers/database.helper.ts` phải **loại `languages` khỏi truncate** (giống `house_systems`); `interpretation_contents` vẫn truncate, test tự insert fixture.

## 13. API Design

Không có endpoint mới.

| Endpoint | Auth | Thay đổi |
|---|---|---|
| `GET /api/v1/charts/:id` | `requireAuth` | `interpretations` có dữ liệu, thêm `interpretationVersion` |
| `POST /api/v1/charts/natal?save=` | optional (guest hợp lệ khi `save=false`) | Tương tự; `201` khi `save=true`, `200` khi `save=false` (không đổi) |
| `GET /api/v1/charts` | `requireAuth` | Không đổi |
| `DELETE /api/v1/charts/:id` | `requireAuth` | Không đổi |

Không có query/path param mới, không cần Zod schema mới. Không chọn ngôn ngữ qua request (MVP cố định `vi`).

## 14. Authentication & Ownership

Dùng lại nguyên: `requireAuth` + `assertChartOwnership` trong `GetChartUseCase` (người khác → 403 `FORBIDDEN`; không tồn tại → 404). Interpretation **không** có đường truy cập riêng nên không thể vượt ownership. Guest `save=false` chỉ nhận interpretations của chart tạm do chính họ gửi dữ liệu. Không nhân bản logic ownership.

## 15. Error Handling

Dùng lại `AppError`/`ErrorCode`; **không thêm mã lỗi mới**, vì mọi tình huống nội dung thiếu đều suy giảm thay vì lỗi.

| Tình huống | Hành vi |
|---|---|
| Chart không tồn tại / của người khác | 404 / 403 (không đổi) |
| Thiếu giờ sinh / house không khả dụng | 200, bỏ House/Angle items, không warning mới |
| Content bank rỗng (chưa seed) | 200, `interpretations: []`, `interpretationVersion: null` |
| Chart ghim version không còn row Published | 200, `[]`, `interpretationVersion` = version đã ghim, log warn |
| Thiếu row cho một subject | Bỏ item đó, log warn, các item khác vẫn trả |
| Lỗi hạ tầng DB khi lookup | Truyền lên như mọi lỗi DB khác → 500 (không nuốt lỗi) (R3, đã xác nhận) |
| Chart không hợp lệ/`DataIntegrityError` | Giữ mapping hiện có của Sprint 3 |

## 16. Observability

Dùng `Pino` logger hiện có (qua `shared/logger`). Log: `interpretation.content_missing` (level warn; gồm `chartId`, `version`, danh sách `subjectKey` thiếu, **không** log dữ liệu sinh/tên), `interpretation.version_unavailable` (warn), lỗi DB (error, qua error handler hiện có).

## 17. Testing Strategy (risk-based, không đặt ngưỡng %)

Theo cấu trúc `tests/` hiện có.

**Unit** (`tests/unit/modules/chart/domain/interpretation/`):
- `derive-interpretation-subjects`: đủ 10 hành tinh → 10 + 1 + 10 subject; thứ tự cố định; `isHouseDataAvailable=false` → chỉ 10 `PlanetInSign`; không có Ascendant → bỏ `AngleInSign`; body ngoài MVP bị bỏ qua; `planet.house === null` bị bỏ qua; cùng input → cùng output (gọi 2 lần).
- Key builders / grammar, `compareContentVersion` (`"1.10" > "1.9"`, `"2.0" > "1.10"`, version sai định dạng bị từ chối).
- Content-file validator: đủ 252 key, thiếu/trùng/dư key bị từ chối, `bodyText` rỗng bị từ chối.

**Application** (`tests/unit/modules/chart/application/services/interpretation-lookup.service.test.ts`, mock provider): chart ghim → dùng đúng version; `null` → latest; sắp xếp theo thứ tự derive dù DB trả lộn xộn; thiếu row → bỏ + log; không có version → rỗng + `null`. Cập nhật `get-chart.usecase.test.ts`, `create-natal-chart.usecase.test.ts` (kiểu trả về mới; `save=true` ghim version; `save=false` không persist).

**Integration** (`tests/integration/modules/chart/repositories/`): `PrismaInterpretationContentProvider` với Postgres thật (partial index, CHECK, unique expression index, FK `languages`); `PrismaChartRepository` lưu/đọc `snapshot_interpretation_version`.

**API** (`tests/api/chart/`): `GET` (owner có interpretations + version; user khác 403; chart thiếu giờ sinh không có House/Angle; chart `null` dùng latest), `POST` (`save=true` ghim; guest `save=false` có interpretations; contract field `interpretationVersion`).

**Contract/OpenAPI:** `npm run generate:openapi` và đối chiếu schema `ChartResponse` có `interpretationVersion`; mở rộng `chart-response.mapper.test.ts`.

**Regression Sprint 3:** toàn bộ `tests/unit/modules/chart/domain/**`, `tests/golden/**`, `natal-chart-pipeline.e2e.test.ts` phải xanh **không sửa kỳ vọng**; không file nào dưới `domain/engine/**` bị sửa ngoài việc `ChartBuilder` nhận thêm tham số version tuỳ chọn.

## 18. Milestone Breakdown

| M | Nội dung | Kết quả kiểm chứng |
|---|---|---|
| **M1** | Schema & migration: `Language`, `InterpretationContent`, CHECK/index, `vi` seed; `Chart.snapshotInterpretationVersion`; persistence đọc/ghi version; sửa `database.helper.ts` | Migration áp dụng được, integration test repository |
| **M2** | Domain: subject types, key grammar, `deriveInterpretationSubjects`, `compareContentVersion`, port `IInterpretationContentProvider` | Unit test domain |
| **M3** | Infrastructure & content: `PrismaInterpretationContentProvider`, `seed-content.ts` + validator + file JSON mẫu (cấu trúc thật, nội dung owner cung cấp) | Integration test + seed chạy được trên DB sạch |
| **M4** | Application: `InterpretationLookupService`, sửa Create/Get use case, `ChartBuilder` nhận version, composition root | Unit test application |
| **M5** | Presentation: mapper nhận interpretations, `interpretationVersion`, OpenAPI | API test + generate:openapi |
| **M6** | Tích hợp & hồi quy: toàn bộ suite, kiểm tra ranh giới kiến trúc, dọn TODO | Lệnh trong Mục 26 |
| **M7** | Tài liệu & đóng sprint | Mục 27 |

## 19. Task Breakdown

**M1:** (T1) model + migration SQL; (T2) `ChartProps.snapshotInterpretationVersion` (nullable) + getter + `reconstitute`; (T3) `prisma-chart.mapper.ts` ghi/đọc `snapshot_interpretation_version` thay cho hard-code `null`; (T4) `database.helper.ts`; (T5) test repository.
**M2:** (T1) `interpretation-subject.ts`; (T2) `derive-interpretation-subjects.ts`; (T3) `content-version.ts`; (T4) `all-mvp-subjects.ts` (liệt kê 252 key, dùng chung cho validator); (T5) port.
**M3:** (T1) provider Prisma (`findLatestPublishedVersion(language)`, `findContents(language, version, subjects)`); (T2) schema Zod của file content; (T3) `seed-content.ts`: validate đủ 252 key → insert `Published` trong transaction; nếu version đã tồn tại mà nội dung khác → **từ chối** và yêu cầu tạo version mới; (T4) script `prisma:seed:content`; (T5) test.
**M4:** (T1) `InterpretationLookupService.resolve(chart | version)`; (T2) `CreateNatalChartUseCase`: resolve version trước khi build, truyền vào builder, lookup sau khi build; (T3) `GetChartUseCase`: trả `{ chart, interpretation }`; (T4) `composition-root.ts`; (T5) cập nhật test.
**M5:** (T1) `ChartResponseMapper.toResponse(chart, interpretation)`; (T2) controller truyền kết quả use case; (T3) thêm `interpretationVersion` vào `chartResponseSchema` và `chart.openapi.ts`; (T4) API test.
**M6:** chạy toàn bộ Mục 26, quét `grep` TODO/FIXME trong phạm vi Sprint 4, kiểm tra không import `infrastructure` từ `domain`.
**M7:** Mục 27.

## 20. Files to Create

- `backend/prisma/migrations/<timestamp>_init_interpretation_content_bank/migration.sql`
- `backend/prisma/seed-content.ts`
- `backend/prisma/content/interpretations.vi.json` (cấu trúc: `{ "version", "language", "items": [{ "subjectType", "subjectKey", "bodyText" }] }`; `tone` bỏ trống = `null`) — nội dung do owner cung cấp
- `backend/src/modules/chart/domain/interpretation/interpretation-subject.ts`
- `backend/src/modules/chart/domain/interpretation/derive-interpretation-subjects.ts`
- `backend/src/modules/chart/domain/interpretation/content-version.ts`
- `backend/src/modules/chart/domain/interpretation/all-mvp-subjects.ts`
- `backend/src/modules/chart/domain/ports/interpretation-content-provider.port.ts`
- `backend/src/modules/chart/infrastructure/repositories/prisma-interpretation-content.provider.ts`
- `backend/src/modules/chart/application/services/interpretation-lookup.service.ts`
- Test files tương ứng (Mục 17)
- `docs/implementation/Sprint_4_Known_Gaps_Registry.md`, `docs/implementation/Sprint_4_Exit_Criteria_Evidence_Matrix.md` (theo tiền lệ Sprint 3/F3; vị trí archive quyết định lúc đóng sprint)

## 21. Files to Modify

`backend/prisma/schema.prisma`, `backend/prisma/README.md` (sửa mô tả schema `content`), `backend/package.json` (script `prisma:seed:content`, version), `backend/src/composition-root.ts`, `chart.entity.ts`, `chart-builder.ts` (tham số version tuỳ chọn), `prisma-chart.mapper.ts`, `create-natal-chart.usecase.ts`, `get-chart.usecase.ts`, `chart.controller.ts`, `chart-response.mapper.ts`, `chart.openapi.ts`, `tests/helpers/database.helper.ts`, và các test hiện có bị ảnh hưởng (`get-chart.usecase.test.ts`, `create-natal-chart.usecase.test.ts`, `chart-response.mapper.test.ts`, `get-chart.api.test.ts`, `create-natal-chart.api.test.ts`).

## 22. Files to Inspect trước khi sửa

`chart-builder.ts` (đường nhận input), `list-charts.usecase.ts` và `chart-summary-response.mapper.ts` (xác nhận không dùng interpretations), `PrismaChartRepository.findById` (chart đã xoá mềm), `tests/golden/**`, `Natal_Chart_Domain_Specification.md` mục Interpretation, `REST_API_Specification.md` §5.4.

## 23. Database Changes (tóm tắt)

Có migration (Mục 12). Hai bảng mới, không sửa bảng cũ. **Không backfill** `charts`.

## 24. API/OpenAPI Changes

Thêm `interpretationVersion` (string, nullable) vào schema `ChartResponse`. `InterpretationResponse` giữ nguyên. Chạy `npm run generate:openapi` và commit artifact nếu repo đang commit nó (kiểm tra ở M5). Không đổi status code.

## 25. Acceptance Criteria (đo được)

1. `deriveInterpretationSubjects` nằm ở `domain/`, không import Prisma/Express; lookup nằm ở `application/services/`.
2. Không có tính toán thiên văn/house/aspect mới; `git diff` không chạm `domain/engine/calculators/**`.
3. Chart đủ dữ liệu → đúng 21 item theo thứ tự cố định; chart thiếu giờ sinh → đúng 10 item, status 200.
4. Gọi 2 lần với cùng chart đã ghim → response byte-identical (trừ trường tự nhiên như timestamp nếu có).
5. `POST … save=true` ghi `snapshot_interpretation_version` ≠ null khi có content; chart `null` vẫn đọc được.
6. User khác truy cập → 403; không tồn tại → 404; guest không đọc được chart đã lưu.
7. Content thiếu hoặc bank rỗng **không** làm chart trả lỗi.
8. Seed từ chối file thiếu/trùng/dư key và version trùng khác nội dung.
9. `chartResponseSchema`/OpenAPI có `interpretationVersion`.
10. Không TODO/FIXME chưa phân loại trong phạm vi Sprint 4.
11. Toàn bộ test Sprint 3 xanh, không đổi kỳ vọng.

## 26. Exit Criteria (cần bằng chứng chạy thật, thư mục `backend/`)

| Tiêu chí | Lệnh |
|---|---|
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Format | `npm run format:check` |
| Test toàn bộ (cần Postgres) | `npm test` |
| Coverage (rà soát rủi ro, không ngưỡng %) | `npm run test:coverage` |
| Build | `npm run build` |
| OpenAPI | `npm run generate:openapi` + đối chiếu `ChartResponse` |
| Migration | `npm run prisma:deploy` trên DB sạch, rồi seed content và `GET` chart thật |
| Hồi quy Sprint 3 | `tests/unit/modules/chart/domain/**`, `tests/golden/**`, `natal-chart-pipeline.e2e.test.ts` |
| Ranh giới | `grep` không có import `infrastructure`/`express`/`@prisma` trong `chart/domain/**` |

Chú ý: sandbox của Claude có thể không chạy được test cần Postgres/Prisma binary (đã gặp ở F3); khi đó kết quả `npm test` và migration phải do project owner chạy và gửi log, và hai loại bằng chứng được ghi tách bạch trong Evidence Matrix.

## 27. Documentation & Known Gaps Strategy

Cập nhật: DB Spec §5.13 (thêm `AngleInSign`, ghi ngữ nghĩa version `null`), REST API Spec §5.4/5.5 (thêm `interpretationVersion`, key grammar, ngữ nghĩa suy giảm), Architecture Spec (ghi `IInterpretationContentProvider` nay thật sự tồn tại; ADR-007 ghi ngoại lệ chart `null`), `prisma/README.md`, Sprint 3 Known Gaps G-01 → đóng, Backend Implementation Roadmap (mục Sprint 4), README gốc (Sprint status), CHANGELOG nếu có, bàn giao F4/F5 (Mục 34).

**Known Gaps dự kiến (mỗi gap phân loại):**

| ID | Gap | Loại |
|---|---|---|
| KG-S4-01 | Không có API/CMS quản lý content | intentional deferral |
| KG-S4-02 | Chiron/Lilith/Nodes, Aspect, Pattern, tone, i18n chưa có | future scope |
| KG-S4-03 | Chart `null` đổi nội dung khi publish version mới | intentional deferral (đã tài liệu hoá) |
| KG-S4-04 | Không cache lookup (Redis ở Sprint 6) | intentional deferral |
| KG-S4-05 | Index expression/partial nằm ngoài Prisma schema (nguy cơ drift) | technical debt |
| KG-S4-06 | Khi không rõ giờ sinh, engine tính tại 12:00 giờ địa phương (`time-conversion.ts`) và **không phát warning**; Moon (~13°/ngày) có thể sai cung, và `Moon_in_{Sign}` vẫn được trả theo quyết định #7. Cần cảnh báo ở UI (F5) hoặc warning ở engine ở sprint sau | technical debt (đã verify bằng code) |
| KG-S4-07 | Nội dung 252 mục chưa review chuyên môn ngoài owner | unverified |

## 28. Decision Log

| ID | Phát hiện / quyết định | Nguồn |
|---|---|---|
| D-S4-01 | Prompt gợi ý module/endpoint riêng (`GET /charts/:id/interpretation`); repo + REST Spec §14.9 loại endpoint này → nhúng vào `ChartResponse` | Owner + spec |
| D-S4-02 | Roadmap cũ liệt kê Sprint 4 gồm "Markdown, AI Adapter, Chart Summary"; lỗi thời so với spec/PRD (human-authored, rule-based) → không làm, cập nhật roadmap | Roadmap vs spec §14.1 |
| D-S4-03 | `main` trên GitHub lỗi thời (2 commit); `dev` là nguồn thật; README liệt kê module `interpretation` chưa tồn tại | Audit |
| D-S4-04 | `prisma/README.md` ghi `interpretations` thuộc schema `content`, DB Spec đặt ở `astrology` → theo DB Spec; thêm `AngleInSign` vào CHECK `subject_type` (spec chưa có loại cho Angle) | Owner (A) + spec |
| D-S4-05 | `IInterpretationContentProvider` được Architecture Spec và G-01 nói đã có nhưng không tồn tại trong code → tạo mới với đúng tên spec | Audit |
| D-S4-06 | Prompt gợi ý `sections[]`, `ruleId`; REST Spec đã chốt danh sách phẳng `InterpretationResponse` → giữ danh sách phẳng, không thêm `ruleId` (key đã đóng vai trò định danh ổn định) | Spec §5.5 |
| D-S4-07 | README gốc liệt kê "AI-generated Interpretation" ở roadmap tương lai; Sprint 4 không làm (Non-Goal) | README |
| D-S4-08 | Prompt cấm ngưỡng coverage; `vitest.config.ts` đã không có ngưỡng → khớp | Audit |
| D-S4-09 | Hàm derive đặt ở `domain/interpretation/` (spec chỉ quy định vị trí service lookup); use case Create/Get đổi kiểu trả về thành `{ chart, interpretation }` vì mapper hiện thuần/đồng bộ; Chart vẫn bất biến, version được truyền vào builder | Planner |
| D-S4-10 | Ghim version: use case resolve version trước khi build, `ChartBuilder` chỉ nhận chuỗi, domain không I/O | Planner |
| D-S4-11 | Sau Sprint 4, `charts.snapshot_interpretation_version` ≠ null cho chart `save=true` mới; spec đã sửa ở Sprint 3 (T-DB-01) cho phép nullable | Sprint 3 closure |

## 29. Open Questions

**RESOLVED (owner):** OQ-S4-1 (MVP scope), OQ-S4-2 (rule hybrid, content DB), OQ-S4-3 (không persist kết quả, persist content), OQ-S4-4 (contract giữ trong `ChartResponse` + `interpretationVersion`), OQ-S4-5 (version pinning, 1 version MVP), OQ-S4-7 (taxonomy = `subject_type`, không category), OQ-S4-8 (planet-in-sign/house + Ascendant, không aspect), OQ-S4-9 (đồng bộ trong request), OQ-S4-10 (Interpretation không có ownership riêng, đi theo Chart).
**OQ-S4-6 (field Chart ổn định):** RESOLVED bằng audit: dùng `planet.name`, `zodiacPosition.sign`, `planet.house`, `angles[Ascendant].longitude`, `isHouseDataAvailable`.

**RESOLVED (R1–R4, owner xác nhận):**

| ID | Quyết định |
|---|---|
| R1 | Key nhà: `{Planet}_in_House_{n}` (vd `Sun_in_House_7`, `Venus_in_House_2`, `Saturn_in_House_10`); Ascendant: `Ascendant_in_{Sign}` (vd `Ascendant_in_Leo`, `Ascendant_in_Aries`) |
| R2 | File content: `backend/prisma/content/interpretations.vi.json` |
| R3 | Lỗi hạ tầng DB khi lookup propagate thành 500, không trả mảng rỗng âm thầm |
| R4 | Backend version `0.3.0 → 0.4.0` |

**Không còn Decision Required nào chặn coding.**

**DEFERRED:** tone selection, đa ngôn ngữ, cache, API admin content, quy tắc retrograde, nội dung cho Chiron/Nodes/Lilith, Aspect/Pattern.

## 30. Risks

| Rủi ro | Giảm thiểu |
|---|---|
| Khối lượng nội dung (252 mục tiếng Việt) là việc lớn nhất, không phải code | Code và content tách biệt; chart vẫn hoạt động với bank rỗng; seed validator chặn publish thiếu key |
| Drift Prisma với index viết tay | Quy trình trong `prisma/README.md`; review SQL migration mỗi lần |
| Regression Sprint 3 | Không sửa `domain/engine/**`; chạy golden test; kiểm tra diff |
| Đổi kiểu trả về use case lan sang test | Giới hạn ở Create/Get, cập nhật trong M4 |
| Contract F5 bất ổn | Đóng băng `subjectKey` grammar + thứ tự + `interpretationVersion` ở M7 |
| Chart `null` đổi nội dung theo thời gian | Ghi rõ ngữ nghĩa trong REST Spec và Known Gaps |
| Moon-in-sign khi thiếu giờ sinh có thể sai cung (engine dùng 12:00 địa phương, không warning) | KG-S4-06; ghi vào handoff F5 để hiển thị lưu ý; không đổi engine trong Sprint 4 |
| Body ngoài MVP trong chart (Chiron…) bị bỏ qua im lặng | Có test, ghi vào handoff |

## 31. Execution Order

M1 → M2 → M3 (song song được với việc owner soạn nội dung) → M4 → M5 → M6 → M7. Không bắt đầu M6 trước khi có file content thật hoặc fixture đủ 252 key.

## 32. Definition of Done

Toàn bộ Acceptance Criteria (Mục 25) đạt; mọi dòng Exit Criteria (Mục 26) có log chạy thật kèm nguồn (Claude chạy hay owner chạy); Known Gaps và Evidence Matrix đã tạo; tài liệu Mục 27 đã cập nhật; không còn TODO/FIXME chưa phân loại; kết luận `PASS` / `PASS WITH KNOWN GAPS` chỉ ghi khi có bằng chứng.

---

## 33. Final Recommendation

### Recommended Sprint 4 Architecture
Content bank PostgreSQL có version pinning + hàm derive thuần trong domain + `InterpretationLookupService` ở application, kết quả nhúng vào `ChartResponse`; không module mới, không endpoint mới, không rule database.

### Recommended MVP Scope
252 mục: 120 `PlanetInSign`, 12 `AngleInSign` (Ascendant), 120 `PlanetInHouse`; `vi` duy nhất; một version Published.

### Explicitly Deferred Scope
Aspect, Pattern, summary types, Chiron/Lilith/Nodes, tone, đa ngôn ngữ, CMS/API admin, cache, AI.

### Decisions Required Before Coding
Không còn (R1–R4 đã được xác nhận).

### Decisions Safe to Defer
Tone, i18n, cache, cơ chế publish version mới, retrograde.

## 34. Dependency Handoff to Frontend F4/F5

**F4 (Natal Chart Viewer)** không bị chặn bởi Sprint 4: dùng `planets`, `houses`, `angles`, `isHouseDataAvailable` như Sprint 3. Cảnh báo "Ascendant/House không khả dụng" (F3 OQ-1 hoãn sang Chart) dựa trên `isHouseDataAvailable`.

**F5 (Interpretation UI)** được bảo đảm:
- `interpretations` luôn là mảng, có thứ tự cố định (PlanetInSign → AngleInSign → PlanetInHouse, hành tinh Sun → Pluto).
- `subjectKey` theo grammar Mục 8; frontend tự ánh xạ nhãn hiển thị; `bodyText` là tiếng Việt hoàn chỉnh.
- Chart thiếu giờ sinh: không có item House/Angle, **không** lỗi. Lưu ý: engine tính tại 12:00 địa phương và không phát warning, nên `Moon_in_{Sign}` có thể sai cung; F5 nên hiển thị lưu ý khi `isHouseDataAvailable=false`.
- `interpretationVersion` cho biết version nội dung đã dùng; `null` + mảng rỗng = chưa có nội dung.
- Lỗi: 404 (không tồn tại), 403 `FORBIDDEN` (không phải chủ sở hữu), 401 (chưa đăng nhập, trừ `POST … save=false`). Frontend dùng `getErrorMessage(errorCode)`, không dùng `.message`/`.title` của backend (đã là quy ước từ F3).
- Chart cũ (trước Sprint 4) có thể đổi nội dung khi owner publish version mới.
