# Sprint 4 M5 — Interpretation Presentation & API Contract

**Vị trí đề xuất:** `docs/implementation/Sprint_4_M5_Interpretation_Presentation_API_Contract_Plan.md` (blueprint tạm thời; xoá sau khi M5 đóng, chỉ lưu Evidence Matrix vào `archive/sprint-4/`)
**Phiên bản:** 1.0 — không có câu hỏi chặn; 2 câu không chặn ở Mục 29
**Dựa trên:** audit trực tiếp nhánh `dev` tại `c66dd15` (clone mới, 2026-10-06); prompt M5; Sprint 4 Implementation Plan v1.1; Evidence Matrix M1–M4 (M4 v2, CI #247 Success); REST API Spec §5.4, §5.5, §14.1, §14.9; Architecture Spec.
**Nguồn bằng chứng:** `[repo]` đọc từ mã; `[spec]` đọc từ tài liệu; `[C-run]` Claude chạy trong sandbox; `[evidence]` ma trận/CI đã nhận; `UNVERIFIED` nghĩa là chưa có bằng chứng.

---

## 1. Sprint Overview

M5 là milestone **Presentation/API**. Sau M4, `CreateNatalChartUseCase` và `GetChartUseCase` đã trả `{ chart, interpretation }` nhưng controller bỏ `interpretation`, còn mapper vẫn gán `interpretations: []`. M5 đưa kết quả đó ra `ChartResponse`:

```
UseCase → { chart, interpretation: InterpretationResult }      (M4, đã có)
        ↓ controller (truyền cả hai)
ChartResponseMapper.toResponse(chart, interpretation)          (M5)
        ↓
ChartResponse { …, interpretations[], interpretationVersion }  (M5)
        ↓
chartResponseSchema (Zod) → OpenAPI → JSON
```

M5 không có logic diễn giải, không truy vấn DB, không đổi route, không đổi engine, không đổi schema DB.

## 2. M4 Prerequisite Verification

**Kết luận: M4 đã hoàn tất thật. Không kích hoạt `NOT READY`.**

| Hạng mục (prompt mục 3) | Kết quả | Nguồn |
|---|---|---|
| Service/application tra cứu diễn giải | `InterpretationLookupService` (`chart/application/services/`), 22 test | [repo], [evidence] |
| Hợp đồng đầu ra | `InterpretationResult = { version: string \| null; items: readonly InterpretationContentRecord[] }`; `CreateNatalChartResult`/`GetChartResult = { chart, interpretation }`; export qua `chart/index.ts` | [repo] |
| Tích hợp provider | `PrismaInterpretationContentProvider` → service → use case nối ở `composition-root.ts` | [repo] |
| Derive subject được nối thật | `lookup()` gọi `deriveInterpretationSubjects(chart)`; thứ tự canonical, sắp lại ở application | [repo] |
| Phân giải version | `resolveLatestVersion()` + chart ghim; chart mới được ghim qua `ChartBuilder` | [repo], [evidence] |
| Ngữ nghĩa `snapshotInterpretationVersion` giữ nguyên | getter chuẩn hoá `null`; `save=false` không persist | [repo] |
| Chart use case có kết quả diễn giải | Có, trả về dưới tên `interpretation` | [repo] |
| Mapper hiện tại | `ChartResponseMapper.toResponse(chart)` với `interpretations: []` (chú thích "D-2") | [repo] |
| `ChartResponse` hiện tại | `chartResponseSchema` Zod + `.openapi('ChartResponse')`; **chưa có** `interpretationVersion` | [repo] |
| Route/controller | 4 route; controller hiện `const { chart } = await …` rồi `toResponse(chart)` (dòng 43–45, 51–55) | [repo] |
| Pipeline OpenAPI | `scripts/generate-openapi.ts`, lệnh `npm run generate:openapi`; chạy được trong sandbox (exit 0) | [repo], [C-run] |
| API test hiện có | `tests/api/chart/` 4 file (649 dòng); **không** có test nào kiểm `interpretations` | [repo] |
| CI | M4 đóng với CI #247 Success trên `c66dd15` | [evidence] |

Không có gap M4 cần vá trong M5. Hai điểm lệch giữa prompt và repo (repo thắng):

| Prompt nói | Thực tế | Xử lý |
|---|---|---|
| Stack "CommonJS" | ESM (`"type": "module"`, NodeNext, import `.js`) | Theo ESM |
| Trường diễn giải có thể là `content` | REST Spec §5.5 và Zod hiện tại dùng `bodyText` | Dùng `bodyText` (spec thắng) |

## 3. Repository Audit

| Chủ đề | Thực tế |
|---|---|
| Mapper | `chart/presentation/mappers/chart-response.mapper.ts`: định nghĩa **cả schema và mapper** (`planetResponseSchema`, …, `interpretationResponseSchema`, `chartResponseSchema`, class `ChartResponseMapper` với `static toResponse(chart: Chart)`) |
| Schema diễn giải sẵn có | `interpretationResponseSchema = z.object({ subjectType, subjectKey, language, bodyText: z.string(), tone: z.string().nullable().optional() }).openapi('InterpretationResponse')` — **đã đúng** REST Spec §5.5, không có `contentSource` |
| `chartResponseSchema` | 13 trường, `interpretations: z.array(interpretationResponseSchema)`; thiếu `interpretationVersion` |
| Call-site mapper | Chỉ 2 chỗ production: `chart.controller.ts` dòng 45 (create) và 55 (get); 1 test: `chart-response.mapper.test.ts` dòng 110. `ChartSummaryResponseMapper` (list) tách biệt, không đổi |
| OpenAPI | `chart.openapi.ts` đăng ký 4 route bằng `registry.registerPath`; `chartResponseSchema` dùng ở response 200/201 của `POST /charts/natal` và 200 của `GET /charts/{id}`; `scripts/generate-openapi.ts` import file đăng ký rồi `generateOpenApiDocument()` |
| Artifact OpenAPI | `openapi.json`/`openapi.yaml` ghi ở `backend/`, **bị `.gitignore`** (`backend/.gitignore` dòng 20–22) — không commit |
| Xác thực OpenAPI trong CI | `backend-ci.yml` có bước `Generate OpenAPI` (`npm run generate:openapi`) — chỉ kiểm sinh được, **không có diff check**, không validate schema, không có test OpenAPI riêng |
| Baseline OpenAPI | [C-run] hiện tại `ChartResponse.required` có `interpretations`, không có `interpretationVersion`; `InterpretationResponse` đúng 5 trường, `required` 4 (không có `tone`), `tone` kiểu `["string","null"]` |
| API test | `supertest` + `bootstrapApplication()` thật + DB thật; `beforeEach: clearDatabase()` (giữ `languages`) → **bank nội dung rỗng**; có `PrismaTestFactory`, `JwtTokenAdapter`; không dùng snapshot test |
| Frontend | Không dùng OpenAPI và không có mã `interpretation` ([repo], grep rỗng): không có consumer hiện hữu bị ảnh hưởng |
| Nội dung | `interpretations.vi.json` v`1.0` `Published`, `contentSource: Hybrid` (nội bộ, **không** lộ ra API theo REST Spec §14.1) |

## 4. Document Audit

| Tài liệu | Điều liên quan |
|---|---|
| REST Spec §5.4 `ChartResponse` | Dòng `interpretations`: bắt buộc, không nullable, "nhúng sẵn… Nếu `isHouseDataAvailable=false`, không chứa `PlanetInHouse`/`Angle`". **Chưa có** `interpretationVersion` |
| REST Spec §5.5 `InterpretationResponse` | `subjectType`, `subjectKey`, `language`, `bodyText` bắt buộc; `tone` không bắt buộc, nullable; không expose `contentSource` (Quyết định 14.1) |
| REST Spec §14.1, §14.9 | Interpretation luôn nhúng trong `ChartResponse`, `POST /charts/natal` luôn trả kèm kể cả `save=false`; không endpoint riêng (FD3) |
| REST Spec §4.5/§12.4 | Còn mục luồng `GET /charts/{id}/interpretations` (12.4, lỗi thời, mâu thuẫn với 14.9): ghi vào Known Gaps tài liệu, **không** sửa trong M5 trừ khi owner yêu cầu (O-M5-2) |
| Sprint 4 Plan v1.1 §10, §34 | Hợp đồng đã chốt cho F5: luôn là mảng, thứ tự cố định, `interpretationVersion` nullable, `null` + `[]` = chưa có nội dung |
| Coding/Testing Standards (tài liệu riêng) | `UNVERIFIED` (không đọc riêng); dùng quy ước thực tế trong mã (ESLint, vitest) |

## 5. Source-of-Truth Hierarchy

Mã nguồn `c66dd15` > Architecture Spec > REST API Spec > Natal Chart Spec > quyết định Sprint 4 (A–E, R1–R4, O-M4) > plan/matrix M1–M4 > tài liệu khác. Không có mâu thuẫn giữa mã và spec về hợp đồng `interpretations`; chỉ thiếu `interpretationVersion` trong spec (Mục 24).

## 6. Existing Architecture Baseline

- Hướng phụ thuộc: `presentation → application → domain`; ESLint `boundaries/dependencies` cấm `presentation → infrastructure`.
- Controller đã import use case và type từ `application`; mapper hiện import entity domain. M5 thêm import **type** `InterpretationResult` từ `application/services/interpretation-lookup.service.js` (hoặc từ `chart/index.ts`) — hợp lệ (presentation → application).
- Mapper không nhận service, repository hay Prisma.

## 7. M5 Objective

1. `ChartResponseMapper.toResponse` nhận thêm kết quả diễn giải của M4 và xuất `interpretations` + `interpretationVersion`.
2. Schema Zod/OpenAPI khớp response thật.
3. Test API chứng minh hành vi đầu-cuối với DB thật.
4. `generate:openapi` chạy thành công và phản ánh hợp đồng mới.
5. Không đổi hành vi hiện có của API Chart.

## 8. Frozen Decisions

FD1–FD8 của prompt và mọi quyết định Sprint 4 giữ nguyên. Ánh xạ:

| FD | Thực hiện |
|---|---|
| FD1 | Chỉ sửa trong module `chart` |
| FD2 | Mapper chỉ chọn trường và gán giá trị; không derive/so sánh version/chọn nội dung |
| FD3 | Không thêm endpoint |
| FD4 | `interpretations` là mảng phẳng; không `groups`/`sections` |
| FD5 | `interpretationVersion` = `interpretation.version` của M4, không tính lại |
| FD6 | Chỉ **thêm** `interpretationVersion`; không đổi tên/xoá trường nào |
| FD7 | Mapper giữ nguyên thứ tự `items` (không `sort`) |
| FD8 | Mapper không có logic nhà/Moon; `isHouseDataAvailable` giữ nguyên; KG-S4-06 vẫn là gap |

## 9. Scope

Mapper (chữ ký + hai trường), schema `chartResponseSchema`, hai call-site trong controller, mô tả OpenAPI, unit test mapper, API test, tài liệu REST Spec và bàn giao F5.

## 10. Out of Scope

Engine/derive/lookup (M2–M4), nội dung diễn giải, endpoint mới, danh sách `GET /charts` (summary không đổi), UI/frontend, AI/LLM, CMS, đổi schema DB, đổi hành vi lỗi, i18n runtime, cảnh báo giờ sinh cho người dùng (F5), bump version backend (theo R4 là khi đóng Sprint 4).

## 11. Dependencies

Vào: M1–M4 (đã có, CI xanh). Ra: M6 (tích hợp và hồi quy đầu-cuối với nội dung thật `1.0`), F5 (hợp đồng Mục 25).

## 12. M4 → M5 Handoff Contract

| Đầu ra M4 | Kiểu thực tế ([repo]) | Bắt buộc | Ánh xạ M5 |
|---|---|---|---|
| Dữ liệu chart | `Chart` (entity bất biến) trong `CreateNatalChartResult.chart` / `GetChartResult.chart` | Có | Giữ nguyên toàn bộ phần mapper hiện có |
| Danh sách diễn giải | `InterpretationResult.items: readonly InterpretationContentRecord[]` (thứ tự canonical đã sắp ở application) | Có (có thể rỗng) | `interpretations[i] = { subjectType, subjectKey, language, bodyText, tone }` chọn **tường minh từng trường** |
| Version diễn giải | `InterpretationResult.version: string \| null` | Có (có thể `null`) | `interpretationVersion = interpretation.version` (không fallback, không tính lại) |
| Cờ có dữ liệu nhà | `Chart.isHouseDataAvailable: boolean` | Có | `isHouseDataAvailable` (trường hiện có, không đổi) |

Trường nội bộ của `InterpretationContentRecord` **không public**: `version` (cấp bản ghi; đã có `interpretationVersion` ở cấp response), `status`, `contentSource`. Không có id bản ghi nào trong kiểu này nên không thể lộ id DB.

## 13. Interpretation Response Model

Mỗi phần tử `interpretations[]` (REST Spec §5.5, giữ nguyên `interpretationResponseSchema`):

| Field | Type | Required | Nullable | Nguồn |
|---|---|---|---|---|
| `subjectType` | string (MVP: `PlanetInSign`, `AngleInSign`, `PlanetInHouse`) | ✔ | ✘ | `record.subjectType` |
| `subjectKey` | string (`Sun_in_Leo`, `Ascendant_in_Leo`, `Sun_in_House_7`) | ✔ | ✘ | `record.subjectKey` |
| `language` | string (`vi`) | ✔ | ✘ | `record.language` |
| `bodyText` | string | ✔ | ✘ | `record.bodyText` |
| `tone` | string | ✘ | ✔ | `record.tone` (MVP luôn `null`; mapper luôn gán, kể cả `null`) |

Không thêm trường công khai mới. `subjectType` giữ kiểu `string` (không enum) để không buộc OpenAPI phải đổi khi mở rộng loại subject; liệt kê giá trị MVP bằng tài liệu (D-M5-04).

## 14. `interpretationVersion` Trace

| Giai đoạn | Kiểu | Nguồn / ngữ nghĩa |
|---|---|---|
| Tạo chart (Create) | `string \| null` | `resolveLatestVersion()` trước build; ghim vào `Chart.snapshotInterpretationVersion` |
| Load chart (Get) | `string \| null` | Cột `snapshot_interpretation_version`; `null` ⇒ chart cũ chưa ghim |
| Phân giải M4 | `InterpretationResult.version: string \| null` | Ghim → đúng version đã ghim (kể cả khi hết nội dung); `null` → Published mới nhất; không có → `null` |
| Application result | `InterpretationResult.version` | Giá trị đã phân giải cho response |
| Mapper | `interpretationVersion: string \| null` | **Gán thẳng**, không tính lại |
| `ChartResponse` / JSON | `string \| null`, **luôn có khoá** | `null` ⇔ không có version Published dùng được |
| OpenAPI | `type: ["string","null"]`, nằm trong `required` | Khớp runtime |

Không nhầm với: phiên bản API, phiên bản package backend, `engineVersion` (phiên bản engine tính toán). Ghi rõ trong tài liệu (Mục 24).

## 15. Null / Empty Semantics

| Tình huống | `interpretations` | `interpretationVersion` | HTTP |
|---|---|---|---|
| Chart đủ dữ liệu, nội dung đủ | 21 phần tử (10 PlanetInSign, 1 AngleInSign, 10 PlanetInHouse) | version (vd `"1.0"`) | 200/201 |
| `isHouseDataAvailable=false` | 10 phần tử `PlanetInSign` | version | 200/201 |
| Bank rỗng (không version Published) | `[]` | `null` | 200/201 |
| Chart ghim version đã hết nội dung | `[]` | version đã ghim | 200 |
| Một phần nội dung thiếu | các phần tử còn lại (đã bỏ phần thiếu) | version | 200 |
| Lỗi hạ tầng khi tra nội dung | không có body diễn giải | — | 500 như hiện tại (không biến thành `[]`) |

`interpretations` luôn là mảng (không `null`, không thiếu khoá). Mapper không phân biệt "không có nội dung" với "lỗi": lỗi đã bị chặn ở lớp dưới.

## 16. Mapper Responsibility

Chữ ký (D-M5-01): `static toResponse(chart: Chart, interpretation: InterpretationResult): ChartResponseDto`, trong đó `ChartResponseDto = z.infer<typeof chartResponseSchema>`.

- **Có thay đổi chữ ký:** thêm đối số thứ hai bắt buộc (không tuỳ chọn, để quên truyền sẽ lỗi biên dịch).
- Diễn giải không nằm trong `Chart` nên **không** thể chỉ nhận `chart`; cũng không cần gói thành một đối tượng mới (một đối số thêm là đủ).
- Ánh xạ: `interpretations: interpretation.items.map((item) => ({ subjectType: item.subjectType, subjectKey: item.subjectKey, language: item.language, bodyText: item.bodyText, tone: item.tone }))` — O(n), giữ thứ tự, chọn trường tường minh (không `...item`).
- `interpretationVersion: interpretation.version`.
- Không thêm hàm `mapInterpretation` riêng (D-M5-02): một phép `map` nội tuyến đủ đơn giản; chỉ tách nếu test cần.
- Cập nhật: 2 call-site controller + 1 test mapper; xoá hai chú thích "D-2" lỗi thời.
- Mapper không import `application` ngoài kiểu `InterpretationResult`, không import Prisma/infrastructure.

## 17. API Contract

| Endpoint | Xác thực | Request | Response | Thay đổi |
|---|---|---|---|---|
| `POST /api/v1/charts/natal?save=` | tuỳ chọn (Guest hợp lệ khi `save=false`) | không đổi | `ChartResponse` 201 (`save=true`) / 200 (`save=false`) | thêm `interpretations` có dữ liệu + `interpretationVersion` |
| `GET /api/v1/charts/{id}` | bắt buộc (`requireAuth`) | không đổi | `ChartResponse` 200 | như trên |
| `GET /api/v1/charts` | bắt buộc | không đổi | `ChartSummaryResponse` | **không đổi** |
| `DELETE /api/v1/charts/{id}` | bắt buộc | không đổi | 204 | không đổi |

Mã lỗi (400/401/403/404/422/500) và `problemDetails` không đổi.

## 18. OpenAPI

| Câu hỏi (prompt mục 14) | Câu trả lời ([repo]) |
|---|---|
| 1. File nguồn schema | `backend/src/modules/chart/presentation/mappers/chart-response.mapper.ts` (`chartResponseSchema`, `interpretationResponseSchema`) |
| 2. Đăng ký route | `backend/src/modules/chart/presentation/openapi/chart.openapi.ts` (không đổi schema được tham chiếu; có thể cập nhật `description`) |
| 3. Artifact sinh ra | `backend/openapi.json`, `backend/openapi.yaml` |
| 4. Lệnh | `npm run generate:openapi` (`tsx scripts/generate-openapi.ts`) |
| 5. Có commit không | **Không** (`backend/.gitignore`) |
| 6. CI | Bước `Generate OpenAPI` chạy lệnh trên; chỉ kiểm sinh thành công |
| 7. Diff check | **Không có** |

Quy trình: sửa nguồn Zod → chạy `npm run generate:openapi` → kiểm bằng Mục 19 → không sửa tay artifact.

Thay đổi nguồn tối thiểu: thêm `interpretationVersion: z.string().nullable()` ngay sau `interpretations` trong `chartResponseSchema` (D-M5-03); xoá chú thích "D-2". `interpretationResponseSchema` giữ nguyên.

## 19. OpenAPI Schema Consistency

Ba lớp cần khớp: kiểu TypeScript (`z.infer`) ↔ response runtime ↔ OpenAPI.

| Thuộc tính | TypeScript | Runtime | OpenAPI | Kiểm bằng |
|---|---|---|---|---|
| `interpretations` | `{…}[]` | mảng, có thể rỗng | `array`, required | API test + `safeParse` |
| `interpretations[].tone` | `string \| null \| undefined` | `null` (MVP) | `["string","null"]`, không trong `required` | API test (khoá `tone` có mặt, giá trị `null`) |
| `interpretationVersion` | `string \| null` | luôn có khoá | `["string","null"]`, trong `required` | API test + test hợp đồng OpenAPI |
| `subjectType`, `language` | `string` | giá trị MVP | `string` | API test giá trị |
| Trường lạ | — | không có | — | API test so tập khoá item bằng `['bodyText','language','subjectKey','subjectType','tone']` |

**Hai cơ chế kiểm tự động (D-M5-06):**
1. Trong API test: `chartResponseSchema.strict().safeParse(response.body)` phải `success` — chứng minh body thật khớp schema và không có khoá thừa.
2. Một unit test nhỏ `tests/unit/docs/chart-openapi-contract.test.ts` gọi `generateOpenApiDocument()` (sau khi import `chart.openapi.js`) rồi khẳng định `components.schemas.ChartResponse` có `interpretationVersion` trong `required` kiểu nullable và `InterpretationResponse` có đúng 5 thuộc tính (không `contentSource`). Repo chưa có test OpenAPI (O-M5-1: đề xuất thêm, vì CI hiện không bắt được drift).

## 20. API Test Strategy

Đặt trong `tests/api/chart/` (bổ sung file mới `chart-interpretation.api.test.ts`, không sửa kỳ vọng của 4 file hiện có). Dùng `bootstrapApplication()` thật, DB thật, token qua `JwtTokenAdapter`, `PrismaTestFactory`. Vì `clearDatabase()` làm bank rỗng, mỗi test tự nạp nội dung fixture (D-M5-05).

**Fixture nội dung:** thêm vào `PrismaTestFactory` phương thức `createInterpretationContents({ version, status = 'Published' })` dựng bản ghi từ `enumerateMvpInterpretationSubjects()` với `bodyText = "fixture:" + version + ":" + subjectKey` (phân biệt version qua nội dung) và ghi bằng `PrismaInterpretationContentProvider.insertMany` hoặc `prisma.interpretationContent.createMany`. Không dùng nội dung chiêm tinh thật.

| # | Tình huống | Kiểm |
|---|---|---|
| A | `POST …?save=true` user, nạp `1.0`, hồ sơ có giờ sinh | 201; `interpretations.length === 21`; đủ 3 `subjectType`; `bodyText` đúng fixture; `interpretationVersion === '1.0'`; `tone === null`; tập khoá item đúng; `chartResponseSchema.strict()` parse OK |
| B | Thứ tự | 10 phần tử đầu `PlanetInSign` theo Sun→Pluto; phần tử thứ 11 `AngleInSign` `Ascendant_in_*`; 10 cuối `PlanetInHouse` theo Sun→Pluto. **Không** khẳng định thứ tự alphabet; so thứ tự `subjectKey` hành tinh với `planets` (hoặc danh sách hằng trong test) chứ không với DB |
| C | Thiếu giờ sinh (`isBirthTimeKnown=false`, bỏ `birthTime`) | `isHouseDataAvailable === false`; `houses=[]`, `angles=[]`; đúng 10 phần tử, tất cả `PlanetInSign` (có `Moon_in_*`), không `PlanetInHouse`/`AngleInSign` |
| D | Bank rỗng | 200/201; `interpretations === []`; `interpretationVersion === null`; các trường chart khác nguyên vẹn |
| E | Chart đã ghim | `save=true` khi chỉ có `1.0` → ghi nhận; nạp thêm `2.0` (Published) → `GET /charts/:id` trả `interpretationVersion === '1.0'` và `bodyText` thuộc `1.0`; đọc DB xác nhận `snapshot_interpretation_version === '1.0'` |
| F | Chart chưa ghim | đặt `snapshot_interpretation_version = NULL` bằng `prisma.chart.update`; với `1.0` và `2.0` đều Published → `GET` trả `interpretationVersion === '2.0'` và nội dung `2.0`; DB vẫn `NULL` (không backfill) |
| G | Ghim nhưng hết nội dung | chart ghim `1.0`, sau đó chuyển hàng `1.0` sang `Draft`/xoá → `GET` 200, `interpretations === []`, `interpretationVersion === '1.0'` |
| H | Guest `save=false` (`birthData`) | 200; có `interpretations` (REST Spec §14.9) và `interpretationVersion` = version Published; không có chart nào được lưu |
| I | Lỗi và quyền không đổi | 401 (GET không token), 403 (chart người khác), 404 (không tồn tại) như test hiện có; body lỗi không chứa `interpretations` |
| J | Không lộ nội bộ | Mọi phần tử chỉ có 5 khoá; không có `contentSource`, `status`, `version`, `id`, `language_*` |

**Không kiểm bằng API test:** lỗi hạ tầng khi tra nội dung (khó giả lập ổn định qua `bootstrapApplication`, `AppOverrides` chỉ có `locationSearchProvider`). Hành vi "lỗi hạ tầng truyền lên" đã được chứng minh ở test service M4 (`reject`) và test provider M1; ghi rõ là phạm vi đã phủ ở lớp dưới (D-M5-08).

Test unit mapper (`chart-response.mapper.test.ts`, sửa): cập nhật lời gọi theo chữ ký mới; thêm ca: `items` rỗng → `[]` + `version null`; nhiều `items` giữ nguyên thứ tự (đầu vào xáo trộn theo thứ tự cho trước, đầu ra y nguyên); chỉ 5 khoá, không rò `contentSource/status/version`; `tone` giữ `null`; `interpretationVersion` gán thẳng (không biến đổi).

## 21. Regression Tests

Giữ nguyên (không sửa kỳ vọng): `create-natal-chart.api.test.ts`, `get-chart.api.test.ts`, `list-charts.api.test.ts`, `delete-chart.api.test.ts`, test identity/birth-profile, golden, E2E pipeline, test tích hợp repository/provider/seeder. Các test hiện có vẫn pass vì chúng chạy với bank rỗng (`interpretations: []`, `interpretationVersion: null`) và không khẳng định `toEqual` toàn bộ response ([repo]: grep `interpretations` trong `tests/api` rỗng). Chạy thật `npm test`/`test:coverage` ở CI.

## 22. API Error Semantics

M5 không bắt lỗi, không `try/catch` quanh việc tra nội dung, không đổi mã HTTP. Lỗi từ provider/derive vẫn là `InfrastructureError`/lỗi dữ liệu → 500 qua error handler như M4 quyết định (R3). Mapper chỉ chạy sau khi use case thành công.

## 23. Security / Data Exposure Review

| Kiểm | Kết quả/biện pháp |
|---|---|
| ID DB | `InterpretationContentRecord` không có `id`; mapper chọn trường tường minh |
| `contentSource`/`status`/`version` bản ghi | Không đưa vào DTO (REST Spec §14.1); test J khẳng định |
| Metadata AI/prompt | Không tồn tại trong kiểu; `contentSource = Hybrid` vẫn nội bộ |
| Model Prisma | Không serialize trực tiếp; response đi qua `ChartResponseMapper` |
| Chi tiết lỗi | Không đổi; KG-M1-03 đã sửa ở M4 (`details` không còn chứa `cause`) |
| Guest | Chỉ nhận diễn giải của chart tạm do chính họ gửi dữ liệu (không có đường đọc chart đã lưu) |

## 24. Documentation Changes

| Tài liệu | Thay đổi cần |
|---|---|
| REST Spec §5.4 `ChartResponse` | Thêm dòng `interpretationVersion | string | ✔ | ✔ | Version nội dung diễn giải đã dùng cho response (không phải version API/engine); null khi chưa có nội dung Published`; sửa dòng `interpretations`: nêu thứ tự cố định và mô tả đầy đủ trường hợp thiếu nhà (không `PlanetInHouse`/`AngleInSign`) |
| REST Spec §5.5 `InterpretationResponse` | Liệt kê `subjectType` MVP (`PlanetInSign`, `AngleInSign`, `PlanetInHouse`), grammar `subjectKey`, `tone` luôn `null` ở MVP |
| REST Spec §14.9 | Ghi chú: `interpretationVersion` đi kèm; không đổi quyết định |
| REST Spec §12.4 (luồng `GET /charts/{id}/interpretations`) | Mâu thuẫn với 14.9 (đã có từ trước); **không sửa trong M5**, ghi vào Known Gaps; O-M5-2 |
| `chart.openapi.ts` mô tả | Thêm một câu về `interpretations`/`interpretationVersion` |
| Sprint 4 Known Gaps Registry | Đóng Sprint 3 G-01 (`interpretations` luôn `[]`) khi M5 đóng |
| Architecture/DB Spec | Không đổi |
| Sprint 4 Plan v1.1 | Không sửa |

## 25. Frontend F5 Handoff

| Field | Meaning | Type | Notes |
|---|---|---|---|
| `interpretations` | Danh sách diễn giải của chart | `InterpretationResponse[]` | **Mảng phẳng**, luôn có, có thể `[]`; thứ tự cố định: `PlanetInSign` (Sun→Pluto), `AngleInSign` (Ascendant), `PlanetInHouse` (Sun→Pluto) |
| `interpretations[].subjectType` | Loại subject | string | MVP: 3 giá trị; **frontend nhóm theo `subjectType`** (backend không nhóm) |
| `interpretations[].subjectKey` | Định danh ổn định | string | `Sun_in_Leo`, `Ascendant_in_Leo`, `Sun_in_House_7`; frontend tự ánh xạ tên hiển thị, không parse `bodyText` |
| `interpretations[].language` | Ngôn ngữ nội dung | string | `vi` |
| `interpretations[].bodyText` | Văn bản đã hoàn thiện | string | Tiếng Việt |
| `interpretations[].tone` | Giọng điệu | string \| null | MVP luôn `null` |
| `interpretationVersion` | Version nội dung diễn giải đã dùng | string \| null | Không phải version API/engine; `null` + `[]` = chưa có nội dung |
| `isHouseDataAvailable` | Có dữ liệu nhà/góc | boolean | Trường hiện có; khi `false` không có `PlanetInHouse`/`AngleInSign` |

Lưu ý cho F5: (1) khi `isHouseDataAvailable=false`, `Moon_in_*` vẫn có và có thể sai cung (KG-S4-06, engine tính tại 12:00 địa phương, không warning) → F5 hiển thị lưu ý; (2) chart cũ (chưa ghim) có thể đổi nội dung khi owner publish version mới; (3) `bodyText` có thể chứa văn phong tài chính/sức khỏe (KG-M3-14, owner quyết định giữ) → F5 có thể thêm lưu ý "chỉ mang tính tham khảo".

## 26. File Change Map

| File | Hành động | Lý do | Lớp |
|---|---|---|---|
| `backend/src/modules/chart/presentation/mappers/chart-response.mapper.ts` | MODIFY | Chữ ký `toResponse(chart, interpretation)`, ánh xạ `interpretations`, thêm `interpretationVersion` vào schema, xoá chú thích "D-2" | Presentation |
| `backend/src/modules/chart/presentation/controllers/chart.controller.ts` | MODIFY | Hai call-site truyền `interpretation` (create, get) | Presentation |
| `backend/src/modules/chart/presentation/openapi/chart.openapi.ts` | MODIFY (nhỏ) | Cập nhật `description` cho endpoint tạo/lấy chart | Presentation/API |
| `backend/tests/unit/modules/chart/presentation/mappers/chart-response.mapper.test.ts` | MODIFY | Chữ ký mới + các ca ở Mục 20 | Test |
| `backend/tests/api/chart/chart-interpretation.api.test.ts` | CREATE | Ca A–J | Test (API) |
| `backend/tests/fixtures/prisma-test.factory.ts` | MODIFY | `createInterpretationContents` | Test |
| `backend/tests/unit/docs/chart-openapi-contract.test.ts` | CREATE (theo O-M5-1) | Hợp đồng OpenAPI | Test |
| `docs/api/REST_API_Specification.md` | MODIFY | Mục 24 | Tài liệu |
| `docs/implementation/archive/sprint-4/Sprint_4_M5_Exit_Criteria_Evidence_Matrix.md` | CREATE (khi đóng) | Evidence | Tài liệu |

**Chỉ đọc (không sửa):** `chart.routes.ts`, `chart-summary-response.mapper.ts`, `application/**`, `domain/**`, `infrastructure/**`, `composition-root.ts`, `chart/index.ts`, `scripts/generate-openapi.ts`, `prisma/**`, mọi test API/golden/tích hợp hiện có.

## 27. Dependency Check

Phải giữ `Presentation → Application → Domain`. Kiểm bằng: `npm run lint` (ESLint `boundaries/dependencies`); `grep -rn "infrastructure\|@prisma\|Swiss\|openai\|anthropic" backend/src/modules/chart/presentation` → kỳ vọng 0 kết quả (trừ import hợp lệ đã có); `git diff --stat` không chạm `application/`, `domain/`, `infrastructure/`. Không có phụ thuộc kiến trúc khác với tài liệu.

## 28. Decision Log

M1–M4 và FD1–FD8 không mở lại. Quyết định mới của M5:

| ID | Quyết định | Lý do |
|---|---|---|
| D-M5-01 | `toResponse(chart: Chart, interpretation: InterpretationResult)` (đối số thứ hai bắt buộc) | Diễn giải không thuộc `Chart`; không thêm đối tượng bọc; quên truyền sẽ lỗi biên dịch |
| D-M5-02 | Ánh xạ nội tuyến, không thêm `mapInterpretation` | Một phép `map` đủ; tránh trừu tượng thừa |
| D-M5-03 | `interpretationVersion: z.string().nullable()` — **bắt buộc có khoá, có thể `null`** | Khớp `string \| null` của M4 và Quyết định A (owner); luôn xuất hiện giúp F5 không phải xử lý "thiếu khoá" |
| D-M5-04 | `subjectType` giữ `string` (không enum OpenAPI) | Tránh breaking khi mở rộng loại subject; liệt kê giá trị bằng tài liệu |
| D-M5-05 | Fixture nội dung qua `PrismaTestFactory`, sinh từ `enumerateMvpInterpretationSubjects()` | Theo convention fixture DB của repo; không dùng nội dung thật |
| D-M5-06 | Kiểm hợp đồng bằng `chartResponseSchema.strict().safeParse` trong API test + 1 unit test OpenAPI | CI hiện không bắt drift OpenAPI (không diff check) |
| D-M5-07 | Không commit artifact OpenAPI; không thêm diff check CI | Đúng convention hiện tại (`.gitignore`); ngoài phạm vi |
| D-M5-08 | Lỗi hạ tầng tra nội dung không có API test; dựa vào test M1/M4 | Không giả lập ổn định được qua `bootstrapApplication` |
| D-M5-09 | Không bump version backend ở M5 | R4: `0.4.0` khi đóng Sprint 4; thêm trường additive không buộc bump riêng |
| D-M5-10 | Không sửa REST Spec §12.4 mâu thuẫn có sẵn | Ngoài phạm vi; ghi gap (O-M5-2) |

## 29. Open Questions

No blocking Open Questions identified after repository/spec audit.

| ID | Câu hỏi | Vì sao quan trọng | Đề xuất | Chặn? |
|---|---|---|---|---|
| O-M5-1 | Thêm unit test hợp đồng OpenAPI mới (`tests/unit/docs/…`) dù repo chưa có tiền lệ? | CI chỉ chạy generate, không bắt drift schema | Có, một file nhỏ | Không |
| O-M5-2 | REST Spec §12.4 (luồng `GET /charts/{id}/interpretations`) còn tồn tại, trái 14.9: sửa trong M5 hay ghi gap? | Tài liệu mâu thuẫn có thể gây hiểu nhầm cho F5 | Ghi gap, sửa khi đóng Sprint 4 | Không |

## 30. Risks

| Rủi ro | Mức | Khả năng | Giảm thiểu | Lớp |
|---|---|---|---|---|
| Lệch kiểu M4 → M5 | Trung bình | Thấp | Kiểu `InterpretationResult` import trực tiếp; `tsc` bắt lỗi | Presentation |
| Mapper chứa logic diễn giải | Cao | Thấp | Chỉ `map`/gán; unit test chỉ-5-khoá; review diff | Presentation |
| API ≠ OpenAPI | Cao | Trung bình | `strict().safeParse` + test OpenAPI | API |
| Sai nullable/optional | Trung bình | Trung bình | Bảng Mục 19; test `tone === null`, `interpretationVersion === null` | API |
| Hồi quy thứ tự | Trung bình | Thấp | Test B; mapper không `sort` | API |
| Sai ngữ nghĩa version | Cao | Thấp | Gán thẳng `interpretation.version`; test E/F/G | API |
| Hồi quy API Chart cũ | Cao | Thấp | Chỉ thêm trường; không sửa test cũ; CI toàn bộ | API |
| Drift OpenAPI | Trung bình | Trung bình | Test hợp đồng; chạy `generate:openapi` trong CI | OpenAPI |
| Lộ trường nội bộ | Cao | Thấp | Chọn trường tường minh; test J | Presentation |
| Hồi quy thiếu giờ sinh | Trung bình | Thấp | Test C | API |
| Thời gian chạy test API tăng (nạp 252 dòng mỗi test) | Thấp | Trung bình | `createMany` một lệnh; chỉ nạp ở test cần | Test |

## 31. Acceptance Criteria

1. `ChartResponseMapper.toResponse(chart, interpretation)` nhận đầu ra M4 thật và ánh xạ vào DTO.
2. `interpretations` được ánh xạ đủ 5 trường, giữ thứ tự, không rò trường nội bộ.
3. `interpretationVersion` bằng `interpretation.version`, không tính lại.
4. Mapper không có logic diễn giải/version/DB.
5. `POST /charts/natal` (cả `save=true` và `save=false`) và `GET /charts/{id}` trả `interpretations` và `interpretationVersion`.
6. Mọi trường `ChartResponse` hiện có không đổi; mã lỗi không đổi.
7. Bank rỗng → `[]` + `null`; thiếu giờ sinh → chỉ `PlanetInSign`; ghim/chưa ghim/ghim hết nội dung đúng ngữ nghĩa.
8. `chartResponseSchema` và OpenAPI định nghĩa đúng, required/nullable khớp runtime.
9. `npm run generate:openapi` thành công; tài liệu sinh ra có `interpretationVersion` và `InterpretationResponse` đúng 5 thuộc tính.
10. Test API (A–J) và test unit mapper pass; toàn bộ test hiện có pass không sửa kỳ vọng.
11. `lint`, `format:check`, `typecheck`, `build` pass; không vi phạm ranh giới; không TODO/FIXME mới.
12. REST Spec §5.4/§5.5 cập nhật; bàn giao F5 có trong Evidence Matrix.

## 32. Exit Criteria

| Tiêu chí | Lệnh / nguồn | Bằng chứng chấp nhận |
|---|---|---|
| API test | `npx vitest run tests/api/chart` | CI (trên đúng commit) hoặc log |
| Unit mapper và OpenAPI | `npx vitest run tests/unit/modules/chart/presentation tests/unit/docs` | CI hoặc log |
| Hồi quy | `npm run test:coverage` (CI) | CI |
| `generate:openapi` | `npm run generate:openapi` | CI bước `Generate OpenAPI`; Claude có thể chạy lại và kiểm nội dung artifact |
| Typecheck / Lint / Format / Build | `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` | CI |
| Ranh giới / TODO | `grep` Mục 27 | Claude chạy |
| Nội dung artifact OpenAPI | Đọc `openapi.json` sinh ra | Claude chạy |

CI Success trên **đúng commit** đủ cho các lệnh trên; trang CI không cho số test nên không dùng làm bằng chứng số liệu. Không cần log owner nào thêm (không có việc ngoài CI). Các trạng thái dùng `PASS/FAIL/PARTIAL/UNVERIFIED/NOT APPLICABLE/DEFERRED`; thiếu bằng chứng = `UNVERIFIED`.

## 33. Definition of Done

1. M4 vẫn an toàn hồi quy.
2. Mapper ánh xạ đúng; `interpretationVersion` đúng nguồn.
3. Response khớp hợp đồng và OpenAPI (kiểm bằng test).
4. `generate:openapi` thành công.
5. Test API và test hiện có pass.
6. Không vi phạm ranh giới Presentation → Infrastructure; không logic diễn giải trong mapper.
7. Hành vi thiếu giờ sinh đúng.
8. Không lộ dữ liệu nội bộ.
9. REST Spec và bàn giao F5 cập nhật.
10. Mọi Exit Criteria có bằng chứng thật.

## 34. Evidence Matrix

Trạng thái lúc lập plan; chưa chạy lệnh nào cho M5.

| Criterion | Evidence Required | Status | Evidence Location |
|---|---|---|---|
| M4 prerequisite | audit repo + matrix M4 v2 | PASS (tiền đề) | Mục 2 |
| Mapper | code + test | UNVERIFIED | diff + unit test |
| `interpretations` | API test A, B | UNVERIFIED | CI |
| `interpretationVersion` | API test A, D, E, F, G | UNVERIFIED | CI |
| Thiếu giờ sinh | API test C | UNVERIFIED | CI |
| Không lộ nội bộ | test J + unit mapper | UNVERIFIED | CI |
| OpenAPI schema | nguồn Zod + test hợp đồng | UNVERIFIED | diff + CI |
| `generate:openapi` | bước CI + đọc artifact | UNVERIFIED | CI, [C-run] |
| Typecheck | CI | UNVERIFIED | CI |
| Lint / Format | CI | UNVERIFIED | CI |
| Hồi quy | CI `test:coverage` | UNVERIFIED | CI |
| Architecture boundary | ESLint + grep | UNVERIFIED | lint + grep |
| Tài liệu REST Spec | diff | UNVERIFIED | diff |

## 35. Implementation Sequence

1. Task 1: schema + mapper + controller + unit mapper (biên dịch được ngay vì chữ ký bắt buộc).
2. Task 2: fixture + API test A–J.
3. Task 3: OpenAPI (test hợp đồng, chạy `generate:openapi`, đọc artifact), cập nhật REST Spec, Evidence Matrix.
4. Một CI xanh trên **commit cuối** là điều kiện đóng; sau đó xoá plan M5, lưu Evidence Matrix vào `archive/sprint-4/`.

**Phân task (3 task):** ranh giới thật theo phụ thuộc: (1) code Presentation + unit — phải xong trước vì đổi chữ ký; (2) API test cần (1) và fixture — là bằng chứng chính; (3) OpenAPI, tài liệu, đóng — phụ thuộc kết quả (1)–(2). Không tách "DTO/OpenAPI" thành task riêng vì schema và mapper nằm chung một file và đổi cùng nhau.

## 36. Final Architect Review

1. **M5 dùng đầu ra M4, không nhân đôi logic?** Có: chỉ ánh xạ `InterpretationResult`.
2. **`interpretationVersion` lấy từ M4?** Có: gán thẳng `interpretation.version`.
3. **Mapper không phụ thuộc DB/provider?** Đúng: chỉ import kiểu `InterpretationResult` và entity domain.
4. **Response khớp OpenAPI?** Được bảo đảm bằng `strict().safeParse` và test hợp đồng OpenAPI; hiện `UNVERIFIED` cho tới khi triển khai.
5. **`generate:openapi` khớp workflow hiện tại?** Có: lệnh và bước CI sẵn có, artifact không commit; [C-run] chạy được ở baseline.
6. **Nullability nhất quán?** Có (Mục 19); điểm cần chú ý: `tone` `optional+nullable` trong schema nhưng runtime luôn gán `null`.
7. **Thứ tự được giữ?** Có: không `sort`; test B.
8. **Hợp đồng Chart cũ được giữ?** Có: chỉ thêm trường `interpretationVersion`.
9. **Thiếu giờ sinh được giữ?** Có: test C; KG-S4-06 vẫn mở.
10. **Phạm vi đủ nhỏ?** Có: 3 file nguồn, test, tài liệu.
11. **F5 có hợp đồng ổn định?** Có (Mục 25), chờ test chứng minh.
12. **Còn blocker nào?** Không.

## 37. Final Recommendation

`READY FOR IMPLEMENTATION`
