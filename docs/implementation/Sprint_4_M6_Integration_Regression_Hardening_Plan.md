# Sprint 4 M6 — Integration, Regression & Architecture Hardening

**Vị trí đề xuất:** `docs/implementation/Sprint_4_M6_Integration_Regression_Hardening_Plan.md` (blueprint tạm thời; xoá sau khi M6 đóng, chỉ lưu Evidence Matrix vào `archive/sprint-4/`)
**Phiên bản:** 1.0 — không có câu hỏi chặn; 2 câu không chặn ở Mục 33
**Dựa trên:** audit trực tiếp nhánh `dev` tại `efda8f9` (clone mới, 2026-10-07); prompt M6; Sprint 4 Implementation Plan v1.1; Evidence Matrix M1–M5 (M5 đóng với CI #253 Success); REST/DB/Architecture Spec; `backend/CHANGELOG.md`; `package.json`; CI workflows.
**Quy ước nguồn bằng chứng:** `[repo]` đọc từ mã/tài liệu; `[C-run]` Claude đã chạy trong sandbox khi lập plan (baseline, không phải bằng chứng đóng M6); `[evidence]` ma trận/CI đã nhận; `UNVERIFIED` nghĩa là chưa có bằng chứng ở M6.

---

## 1. Sprint Overview

M1–M5 đã xây xong tính năng diễn giải theo chuỗi:

```
Chart (Sprint 3) → deriveInterpretationSubjects (M2) → InterpretationLookupService (M4)
   → IInterpretationContentProvider (M2 port) → PrismaInterpretationContentProvider (M1)
   → PostgreSQL (astrology.interpretation_contents, 252 mục Published v1.0, M3/M4 seed)
   → ChartResponseMapper (M5) → ChartResponse { interpretations[], interpretationVersion }
```

M6 **không phát triển tính năng**. M6 là cổng cuối chứng minh tính năng đó nhất quán, an toàn hồi quy, đúng ranh giới kiến trúc, build được, khớp OpenAPI, migrate được từ DB sạch và trả về diễn giải thật qua API thật. M6 chỉ sửa lỗi do việc kiểm chứng phát hiện và phải phân loại từng lỗi theo Category A–D (Mục 8). Kết thúc M6 là "Sprint 4 sẵn sàng đóng".

## 2. M5 Prerequisite Verification

**Kết luận: M5 đã hoàn tất thật. Không kích hoạt `NOT READY`.**

| Hạng mục (prompt Mục 2) | Kết quả | Nguồn |
|---|---|---|
| M5 implementation | `ChartResponseMapper.toResponse(chart, interpretation)`; `interpretationVersion: z.string().nullable()`; controller truyền cả hai (create/get) | [repo] |
| M5 tests | `chart-interpretation.api.test.ts` (8 test ↔ ca A–J), `chart-openapi-contract.test.ts` (4 test, tự sinh tài liệu bằng `generateOpenApiDocument()`), mapper test, `PrismaTestFactory.createInterpretationContents` | [repo], [evidence] |
| M5 evidence | Evidence Matrix M5 trong `archive/sprint-4/`; commit cuối `efda8f9`, **CI run #253 Success** (2m 8s; chỉ 3 warning `jwt-token.adapter.ts` có sẵn) | [evidence] |
| Interpretation Engine / lookup | `InterpretationLookupService` (`chart/application/services/`), 22 test | [repo] |
| Content provider | `PrismaInterpretationContentProvider` (M1), 22 test tích hợp | [repo] |
| ChartResponse + REST | 13 trường cũ + `interpretationVersion`; REST Spec §5.4/§5.5/§14.9 đã cập nhật ở `efda8f9` | [repo] |
| OpenAPI generation | `npm run generate:openapi` chạy được ([C-run] exit 0 ở `adedf64`); artifact gitignore | [repo], [C-run] |
| Prisma schema/migrations | 5 migration, mới nhất `20261004120000_init_interpretation_content_bank` | [repo] |
| Content seed/source | `prisma/content/interpretations.vi.json` (`Published`, `1.0`, `vi`, `Hybrid`, 252 mục; [C-run] `--validate-only` 252/252, 0 placeholder); log seed của owner: `inserted 252`, `unchanged 252`, DB `Published \| 252` | [repo], [C-run], [evidence] |
| Known Gaps còn mở | KG-S4-06, KG-S4-08, KG-M1-05, KG-M3-01, KG-M2-03, REST §12.4 | [evidence] |

Gap M5 còn lại (không chặn, xử lý ở Task 6): REST Spec §5.5 mô tả grammar `{Planet}_in_{Sign/House}` dễ gây hiểu nhầm (key nhà thật là `{Planet}_in_House_{n}`); dòng `interpretationVersion` đặt trước `interpretations`; test OpenAPI chưa khẳng định `required` của `ChartResponse`; REST Spec §12.4 còn sơ đồ "Generate Interpretation" cho endpoint đã bị loại.

**Lệch giữa prompt và repo (repo thắng, không mở lại frozen decision):**

| Prompt nói | Thực tế | Xử lý |
|---|---|---|
| Stack "CommonJS" | ESM (`"type": "module"`, NodeNext, import `.js`) | Theo ESM |
| M3 = "Content/Generation", M4 = "Engine/Integration", M5 = "Interpretation API/feature" | M3 = Infrastructure & Content Pipeline; M4 = Application Layer; M5 = Presentation & API Contract | Dùng tên thật trong plan |
| Dùng `npm run start` để chạy backend | `start` đặt `NODE_ENV=production` và làm hỏng cookie refresh qua `http://localhost` (bài học F3); CI frontend chạy `node dist/server.js` | Smoke test chạy `node dist/server.js` (Mục 27) |

## 3. Current Repository Audit

| Chủ đề | Thực tế |
|---|---|
| Version/package | `backend/package.json` `0.3.0`; `backend/CHANGELOG.md` có (Keep a Changelog; mỗi Sprint một mục: Added/Changed/Known Gaps); **chưa có mục 0.4.0** |
| Test runner | Vitest 2.1.9; `npm test` = `cross-env NODE_ENV=test vitest run`; `npm run test:coverage` = `vitest run --coverage`; không có coverage threshold |
| Quality scripts | `lint` (`eslint . --ext .ts`), `typecheck` (`tsc --noEmit`, chỉ phủ `src/`), `format:check` (`prettier --check .`), `build` (`tsc -p tsconfig.json`) |
| Prisma/OpenAPI scripts | `prisma:generate`, `prisma:deploy`, `prisma:seed` (tạo Admin), `prisma:seed:content` (nội dung), `db:reset` (`prisma migrate reset`, có chạy seed Admin), `generate:openapi` (`tsx scripts/generate-openapi.ts`) |
| Artifact sinh ra | `backend/openapi.json`, `openapi.yaml` (gitignore); `dist/` (gitignore); `coverage/` |
| CI | `backend-ci.yml`: Setup DB (Postgres, `prisma:generate` + `prisma:deploy`) → Lint+Format → Generate OpenAPI → Typecheck → `test:coverage` → Build. `frontend-ci.yml` cũng dựng backend thật (`node dist/server.js`, `/live`) cho E2E |
| Môi trường chạy | `/live` (liveness), `/health`, Swagger `/docs`; API tiền tố `/api/v1`; auth `POST /auth/register`, `/auth/login`; chart 4 route (`POST /charts/natal`, `GET /charts`, `GET /charts/:id`, `DELETE /charts/:id`); DB test: `docker-compose.test.yml` (Postgres 16, cổng 5432, DB `test`); DB dev: `docker-compose.yml` (cổng 5433) |
| `.env` cần | `NODE_ENV, PORT, CORS_ORIGIN, DATABASE_URL, LOG_LEVEL, SEED_ADMIN_EMAIL/PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY_MINUTES, JWT_REFRESH_EXPIRY_DAYS, GEONAMES_USERNAME` |
| Chart module | `domain/` (engine, entities, errors, interpretation, ports, types, value-objects), `application/` (errors, services, shared, use-cases), `infrastructure/` (adapters, content, mappers, repositories), `presentation/` (controllers, mappers, openapi, routes, schemas); không có module `interpretation` riêng |
| Baseline audit đã chạy khi lập plan | [C-run] TODO/FIXME/HACK/XXX trong `backend/{src,tests,prisma,scripts}`: **0**; import cấm trong `chart/domain/**` (`infrastructure`, `application`, `presentation`, `express`, `@prisma`, `fs`, `path`, `process.env`): **0**; `chart/application/**` import `infrastructure/presentation/express/@prisma`: **0**; `chart/presentation/**` import `infrastructure/@prisma`: **0**; `chart/infrastructure/**` import `presentation/express`: **0**; unit `tests/unit/modules/chart`: 37 file / 331 test pass; eslint/prettier trên vùng chart sạch |

Phát hiện quan trọng cho M6: **CI chưa bao giờ xác thực file nội dung thật.** Validator chỉ chạy qua CLI thủ công và qua test với fixture; không test nào đọc `interpretations.vi.json`. Các API test dùng fixture `fixture:<version>:<key>`, nên nếu file nội dung hỏng (thiếu key, placeholder, sai grammar) thì CI vẫn xanh (xem Mục 17, D-M6-06).

## 4. Sprint 4 Change Inventory

Nguồn: `git diff a369019..HEAD -- backend docs` nhóm theo commit của từng milestone ([C-run]). Có 31 file backend production/prisma, 20 file test, 10 file tài liệu.

| Layer | File (đường dẫn dưới `backend/`) | MS | Mục đích | Public/Private | Test | M6 kiểm |
|---|---|---|---|---|---|---|
| prisma | `prisma/schema.prisma`; `prisma/migrations/20261004120000_init_interpretation_content_bank/migration.sql` | M1 | `Language`, `InterpretationContent`, CHECK, index | Public (DB) | provider + repo integration | Mục 19 |
| prisma | `prisma/content/interpretations.vi.json`; `prisma/seed-content.ts`; `prisma/README.md`; `package.json` (script `prisma:seed:content`) | M3/M4 | Nội dung v1.0 và CLI seed | Dữ liệu/Vận hành | validator + seeder test | Mục 17, 27 |
| domain | `domain/entities/chart.entity.ts` (`snapshotInterpretationVersion`) | M1 | Thuộc tính ghim version | Private | chart.entity.test | Mục 13–15 |
| domain | `domain/interpretation/{content-version,derive-interpretation-subjects,enumerate-mvp-subjects,interpretation-subject-key}.ts` | M2 | Hàm thuần: grammar, derive, version, liệt kê 252 | Private | 4 file test (≈89) | Mục 15, 21 |
| domain | `domain/types/interpretation.types.ts`; `domain/ports/interpretation-content-provider.port.ts`; `domain/errors/chart.errors.ts` | M1/M2 | Kiểu, port, lỗi | Private | test M2 | Mục 18, 21 |
| domain | `domain/engine/chart-builder.ts` (**file Sprint 3**) | M4 | Nhận và chuyển `snapshotInterpretationVersion` | Private | chart-builder.test (+2) | **Hồi quy Sprint 3 (Mục 13)** |
| application | `application/services/interpretation-lookup.service.ts` | M4 | Chọn version, tra nội dung, sắp xếp | Private | 22 test | Mục 15, 18 |
| application | `application/use-cases/{create-natal-chart,get-chart}.usecase.ts` (**Sprint 3**) | M4 | Trả `{ chart, interpretation }` | Private | 22 + 8 test | Mục 12, 15 |
| infrastructure | `infrastructure/repositories/prisma-interpretation-content.provider.ts` | M1 | Truy vấn nội dung Published | Private | 22 test tích hợp | Mục 18 |
| infrastructure | `infrastructure/content/{…schema,…validator,…seeder}.ts` | M3 | Validate/seed nội dung | Private (tooling) | validator 20 + seeder 12 | Mục 17 |
| infrastructure | `infrastructure/mappers/prisma-chart.mapper.ts`, `infrastructure/repositories/prisma-chart.repository.ts` (**Sprint 3**) | M1/M4 | Ghi/đọc cột ghim; sửa `InfrastructureError` | Private | repo integration | Mục 14, 25 |
| other module | `src/modules/birth-profile/infrastructure/repositories/prisma-birth-profile.repository.ts` (**Sprint 2**) | M4 | Sửa `InfrastructureError` (KG-M1-03) | Private | repo integration | **Hồi quy Sprint 2** |
| presentation | `presentation/mappers/chart-response.mapper.ts`, `controllers/chart.controller.ts`, `openapi/chart.openapi.ts` (**Sprint 3**) | M4/M5 | `ChartResponse` + 2 trường; mô tả OpenAPI | **Public (API)** | mapper 2 + API 8 + OpenAPI 4 | Mục 14, 20 |
| root | `src/composition-root.ts`; `src/modules/chart/index.ts` | M4 | Nối provider → service → use case; export type | Private | API/E2E | Mục 18 |
| tests | 20 file (Mục "tests added/modified" trong git): provider/seeder/repo integration; 4 test M2; service/use case/builder/mapper; 2 API test M5; `prisma-test.factory.ts`; `database.helper.ts` | M1–M5 | — | — | — | Mục 12 |
| docs | REST Spec, DB Spec, Architecture Spec, `prisma/README.md`; 5 Evidence Matrix | M1–M5 | — | — | — | Mục 35 |

**Tập file Sprint 2–3 bị chạm (hồi quy trọng tâm):** `chart-builder.ts`, `chart.entity.ts`, `prisma-chart.mapper.ts`, `prisma-chart.repository.ts`, `create-natal-chart.usecase.ts`, `get-chart.usecase.ts`, `chart-response.mapper.ts`, `chart.controller.ts`, `chart.openapi.ts`, `composition-root.ts`, `prisma-birth-profile.repository.ts`, `chart/index.ts`. Không có file nào dưới `domain/engine/calculators/**`, Swiss adapter hay `identity` bị sửa ([C-static]).

## 5. Source-of-Truth Hierarchy

Quyết định frozen (A–E, R1–R4, O-M3/M4/M5, Moon, KG-M3-14) > Spec hiện hành (DB, REST, Architecture, Natal Chart) > mã nguồn đã hoàn tất > decision log của milestone > test/golden > quy ước repo > giả định chung.

**Mâu thuẫn đã phát hiện (ghi nhận, không tự sửa lặng lẽ):**

| # | Mâu thuẫn | Bằng chứng | Phân loại | Xử lý |
|---|---|---|---|---|
| C1 | REST Spec §12.4 còn sơ đồ "Generate Interpretation" gọi `GET /charts/{id}/interpretations`; §14.9 và dòng 166 nói endpoint đã bị loại | [repo] REST Spec dòng 952–956 vs 166, 1107 | Tài liệu (Category A cho tài liệu release) | Sửa ở Task 6 (O-M5-2 đã hẹn "sửa khi đóng Sprint 4") |
| C2 | REST Spec §5.5 mô tả `subjectKey` bằng `{Planet}_in_{Sign/House}` | key nhà thật là `{Planet}_in_House_{n}` (R1) | Tài liệu | Sửa ở Task 6 |
| C3 | Sprint 4 Plan v1.1 §19–§20 dùng tên cũ (phương thức provider, đường dẫn `seed-content`) | plan v1.1 vs mã | Tài liệu (blueprint) | Không sửa lịch sử; ghi nhận ở Decision Log |
| C4 | DB Spec nói `users.preferred_language` tồn tại; schema/code không có | KG-S4-08 | **Category B (deferred)** | Giữ nguyên, ghi vào Known Gaps Registry |
| C5 | `npm run start` đặt `NODE_ENV=production` | `package.json`, ghi chú `frontend-ci.yml` | Hạn chế vận hành | Smoke dùng `node dist/server.js`; ghi nhận |
| C6 | `tsconfig.json` chỉ gồm `src/`: `prisma/` và `scripts/` nằm ngoài `typecheck`/`build` | KG-M3-01 | **Category B** | Giữ; kiểm bằng ESLint và chạy CLI thật |

## 6. Existing Architecture Baseline

Hướng phụ thuộc cho phép (ESLint `boundaries/dependencies`, Architecture Spec): `presentation → application → domain`; `infrastructure → domain`; `application ↛ infrastructure`; `domain ↛` mọi lớp trên; `composition-root.ts` được phép nối mọi lớp. Mapper presentation import **kiểu** `InterpretationResult` từ `application` (hợp lệ). Provider Prisma chỉ xuất hiện ở file định nghĩa và `composition-root.ts`. Interpretation nằm trong module `chart` (FD), không có module riêng.

## 7. M6 Objective

Chứng minh bằng bằng chứng thật rằng Sprint 4 (M1–M5) đạt: nhất quán nội bộ; hồi quy Sprint 1–3 an toàn; ranh giới kiến trúc đúng; type/lint/format/build sạch; OpenAPI khớp response; migration an toàn từ DB sạch; nội dung thật phục vụ qua API thật; semantics version đúng; trạng thái thiếu giờ sinh đúng; không còn mảnh vụn TODO/FIXME của Sprint 4; tài liệu phản ánh đúng thực tế.

## 8. Frozen Decisions Relevant to M6

Không mở lại. Chỉ dùng để phân loại lỗi.

| Nhóm | Quyết định |
|---|---|
| Kiến trúc | Trong module `chart`; không endpoint riêng; `ChartResponse` nhúng `interpretations` + `interpretationVersion` (nullable) |
| Phạm vi MVP | 252 = 120 `PlanetInSign` + 12 `AngleInSign` + 120 `PlanetInHouse`; chỉ `vi`; không Chiron/Lilith/Nodes/Aspect/Pattern |
| Grammar | `{Planet}_in_{Sign}`, `{Planet}_in_House_{n}`, `Ascendant_in_{Sign}` |
| Version | Ghim khi tạo chart `save=true`; chart `null` dùng Published mới nhất lúc request, không backfill; `save=false` không persist; ghim hết nội dung → `[]` + giữ version |
| Thiếu giờ sinh | Trạng thái suy giảm bình thường; bỏ `PlanetInHouse` và `AngleInSign`; **không** lỗi; KG-S4-06 giữ nguyên |
| Lỗi | Lỗi hạ tầng truyền lên thành 500 (R3); thiếu nội dung thì bỏ item + warn |
| Nội dung | `1.0` `Published`, `Hybrid`, giữ nguyên văn phong như đã seed (KG-M3-14); sửa nội dung = version mới |
| Quy ước | Plan milestone là blueprint tạm thời; chỉ Evidence Matrix được lưu; version `0.4.0` khi đóng sprint (R4) |

**Phân loại lỗi trong M6 (Category):**

| Cat | Định nghĩa | Hành động |
|---|---|---|
| A | Vi phạm spec/quyết định M1–M5/hợp đồng API công khai/bất biến domain/hồi quy/ranh giới kiến trúc/lỗi build-type-lint | **Sửa trong M6** (bounded, có test) |
| B | Đã có gap/hoãn có chủ đích | Giữ; ghi Known Gaps Registry |
| C | Tính năng/cải tiến mới | Không làm |
| D | Refactor/thẩm mỹ | Không làm, trừ khi trực tiếp giảm rủi ro đã kiểm chứng và phạm vi hẹp |

## 9. Scope

(1) Kiểm toàn bộ suite và phân loại thất bại; (2) bảo vệ hồi quy Sprint 3 (và các file Sprint 2 bị chạm); (3) xác minh `ChartResponse` và OpenAPI; (4) xác minh semantics version và thiếu giờ sinh; (5) xác minh nội dung thật và grammar xuyên suốt; (6) kiểm DB sạch → migrate → seed → khởi động → API thật; (7) kiểm ranh giới kiến trúc; (8) review bảo mật/hiệu năng có giới hạn; (9) review rủi ro coverage; (10) dọn TODO/FIXME; (11) tài liệu đóng sprint; (12) Evidence Matrix.

## 10. Out of Scope

Tính năng mới, thay đổi engine/Swiss adapter, đổi hành vi Moon/giờ sinh (KG-S4-06), thêm `users.preferred_language`, sinh nội dung bằng AI, sửa văn bản diễn giải, CMS/admin, endpoint mới, đổi schema/migration, refactor/format toàn repo, sửa lỗi ở Identity/Birth Profile không do Sprint 4 gây ra, đặt ngưỡng coverage, sửa warning `jwt-token.adapter.ts` (Sprint 1), frontend (F4/F5).

## 11. Dependencies

| Hướng | Phụ thuộc |
|---|---|
| Vào | M1–M5 (đã có, CI xanh); Docker (Postgres 16) trên máy owner cho Task 3; nội dung `1.0` (đã có); quy trình CI hiện có |
| Ra | Sprint 4 đóng; F4/F5 dựa vào hợp đồng ở Evidence Matrix M5 và bản REST Spec đã chốt |

## 12. Full-Suite Integration Strategy

**Nguyên tắc bằng chứng (D-M6-01):** link CI xanh trên **đúng commit cuối** là bằng chứng chấp nhận cho các bước CI thật sự chạy (Lint+Format, Generate OpenAPI, Typecheck, `test:coverage`, Build). Log của owner chỉ cần cho việc CI không chạy: DB sạch + seed + khởi động + API thật, `migrate diff`, `prisma:seed`, chạy riêng ba suite Sprint 3. Claude tự chạy lại được: eslint/prettier, test unit, `generate:openapi`, các lệnh `grep`.

| Phân hệ | Phạm vi test (đường dẫn dưới `backend/tests/`) | Chạy bằng |
|---|---|---|
| Identity/Auth | `unit/modules/identity`, `api/identity`, tích hợp liên quan | `npm test` (CI) |
| Birth Profile | `unit/…/birth-profile`, `integration/…/birth-profile`, `api/birth-profile` | `npm test` (CI) |
| Natal Chart | `unit/modules/chart/domain/**`, `golden/**`, `integration/e2e/natal-chart-pipeline.e2e.test.ts` | `npm test` + chạy riêng (Mục 13) |
| Interpretation | `unit/modules/chart/{domain/interpretation,application,infrastructure/content,presentation}`, `integration/modules/chart/{content,repositories}`, `api/chart` | `npm test` (CI) |
| Database integration | `integration/**` | CI (Postgres thật) |
| API | `api/**` | CI |
| E2E / golden | `integration/e2e`, `golden` | CI |

**Quy trình khi có thất bại (D-M6-02):** ghi tên test + thông báo lỗi; gán một nhãn: *regression do Sprint 4* / *pre-existing* / *environment* / *flaky* / *unrelated*. Chỉ được ghi "pre-existing" khi **có bằng chứng**: chạy đúng test đó trên commit trước Sprint 4 (`a369019`, worktree riêng) và thất bại như nhau. "Flaky" cần ≥ 3 lần chạy lại với kết quả khác nhau trên cùng commit. Lỗi ngoài Sprint 4 không tự thành task của M6 (Category B hoặc chuyển ra ngoài).

## 13. Sprint 3 Regression Strategy

Bảo vệ ba nhóm: `tests/unit/modules/chart/domain/**`, `tests/golden/**`, `tests/integration/e2e/natal-chart-pipeline.e2e.test.ts`.

| Kiểm | Cách | Evidence |
|---|---|---|
| Phép tính không đổi | Không file nào dưới `domain/engine/calculators/**`, `infrastructure/adapters/**` bị sửa (`git diff --stat a369019..HEAD -- <paths>` rỗng) | Output `git diff` |
| Vị trí hành tinh / nhà / góc / aspect | 25 golden test (JPL Horizons DE441, ≤ 0.01°) + 189 unit domain xanh, **không sửa kỳ vọng** | CI + log chạy riêng |
| `ChartBuilder` | Thay đổi duy nhất: `snapshotInterpretationVersion ?? null` → `Chart.create`; test builder (8) xanh | CI + đọc diff |
| Snapshot | `snapshot_*` không đổi; repository integration xanh | CI |
| `ChartResponse` cũ | 13 trường cũ không đổi tên/kiểu; chỉ **thêm** `interpretationVersion`; API test cũ (4 file) không sửa kỳ vọng | `git diff` test + CI + Mục 14 |
| Diễn giải là phần cộng thêm | Chart bank rỗng vẫn trả đúng response cũ cộng `interpretations: []`, `interpretationVersion: null` (API test D) | CI |

**Lệnh chạy riêng (owner, PowerShell hoặc bash; DB test đang chạy):** `npx vitest run tests/unit/modules/chart/domain tests/golden tests/integration/e2e` với `NODE_ENV=test`; lưu log. Claude chạy phần không cần DB nếu sandbox cho phép (`UNVERIFIED` cho golden trong sandbox).

## 14. ChartResponse & API Regression

**Phân biệt hai khái niệm version (bắt buộc ghi rõ ở tài liệu):**

| | `snapshotInterpretationVersion` | `interpretationVersion` |
|---|---|---|
| Nằm ở | Thực thể `Chart` / cột `charts.snapshot_interpretation_version` | Trường của `ChartResponse` (API) |
| Ý nghĩa | Version **đã ghim** vào chart lúc tạo (`save=true`); `null` = chart cũ chưa ghim hoặc chart chưa persist | Version **đã dùng** để sinh `interpretations` của response này |
| Kiểu | `string \| null` | `string \| null`, **luôn có khoá** |
| Nguồn | `resolveLatestVersion()` lúc Create → `ChartBuilder` → `Chart.create` | `InterpretationResult.version` do `InterpretationLookupService` trả về (ghim → đúng bản ghim; `null` → Published mới nhất; không có → `null`) |
| Công khai | Không (nội bộ, DB) | Có |

Hai giá trị **khác nhau** khi chart chưa ghim (`snapshot = null` nhưng `interpretationVersion = '1.0'`) và khi ghim hết nội dung (cả hai = version ghim nhưng `interpretations = []`). Cũng không nhầm với `engineVersion` hay version API/package.

**Danh sách xác minh `ChartResponse`:**

| Hạng mục | Cách kiểm | Test hiện có |
|---|---|---|
| Trường cũ tương thích | So `chartResponseSchema` với `git show a369019:…/chart-response.mapper.ts`: chỉ thêm 1 khoá | test mapper, API cũ |
| `interpretations` đúng hình | 5 khoá, `tone` luôn `null`, không rò `contentSource/status/version/id` | API A/B/J; mapper |
| `interpretationVersion` đúng | `null` (bank rỗng), `'1.0'`, version ghim, version mới nhất | API D/E/F/G/H |
| Thứ tự xác định | PlanetInSign (Sun→Pluto) → AngleInSign → PlanetInHouse (Sun→Pluto) | API B (đã có assertion Sun→Pluto) |
| Rỗng | `[]` + `null` | API D |
| Thiếu giờ sinh | 10 `PlanetInSign`, `houses=[]`, `angles=[]` | API C |
| Mã lỗi không đổi | 401/403/404/422 | API I + test cũ |
| Không breaking | Frontend hiện không có consumer (grep rỗng) | [repo] |

## 15. Interpretation Version Verification

| Kịch bản | Kỳ vọng | Test/Evidence hiện có | Hành động M6 |
|---|---|---|---|
| Chart mới `save=true` | Ghim version Published mới nhất; cột DB = version đó | API E (gián tiếp qua GET sau khi thêm `2.0`); service/use case test (thứ tự `resolve → build → lookup → save`) | Thêm **một assertion đọc cột DB** sau POST (KG-M5-04 còn lại), trong Task 2 |
| Chart cũ (`null`) | Dùng Published mới nhất lúc request; **không** backfill | API F (có assertion cột vẫn `NULL`) | Chỉ xác nhận chạy xanh |
| Chart đã ghim | Giữ nguyên version ghim dù có version mới | API E | Xác nhận |
| Ghim hết nội dung | `[]` + giữ version ghim | API G; service test | Xác nhận |
| `save=false` | Không persist chart/ghim | API H (`chart.count()===0`) | Xác nhận |
| Bank rỗng | `null` + `[]`; chart không ghim | API D | Xác nhận |
| Smoke DB thật | Chỉ có một version Published (`1.0`) nên chỉ kiểm ghim = `'1.0'`; **không** seed version giả vào DB smoke | Task 3 | Ghi rõ giới hạn (D-M6-11) |

## 16. Unknown Birth Time Regression

| Kiểm | Kỳ vọng | Evidence |
|---|---|---|
| `isHouseDataAvailable=false` không gây lỗi | HTTP 200/201 | API C |
| `PlanetInSign` còn đủ | 10 phần tử (kể cả `Moon_in_*`) | API C |
| `PlanetInHouse`, `AngleInSign` bị bỏ | không có | API C (tất cả `PlanetInSign`) + service test |
| Chart hợp lệ | `houses=[]`, `angles=[]` | API C |
| Engine không bị đổi | Engine vẫn tính tại 12:00 địa phương khi thiếu giờ sinh; không thêm warning | `git diff` rỗng dưới `domain/engine/**` ngoài `chart-builder.ts` |
| KG-S4-06 được giữ | Ghi trong Known Gaps Registry + bàn giao F5 (đã có ở Evidence Matrix M5) | Mục 35 |

M6 **không** sửa engine hay thêm warning. Cảnh báo người dùng là việc của F5.

## 17. Interpretation Content Regression

**Khoảng trống phát hiện:** không test nào đọc file nội dung thật (Mục 3).

| Kiểm | Cách | Evidence |
|---|---|---|
| File hợp lệ | `npm run prisma:seed:content -- --validate-only`: 252/252, 0 placeholder, `Published`, `vi`, `1.0` | [C-run] đã đạt ở `efda8f9`; chạy lại ở commit cuối |
| Bao phủ đủ | `expected = enumerateMvpInterpretationSubjects() = 252`; không thiếu/dư/trùng/key sai | Validator (CLI) |
| Trạng thái trong DB | `SELECT status, count(*) …` → `Published \| 252`; ngôn ngữ `vi`; `tone IS NULL`; version `1.0` | Log seed của owner (M4) + Task 3 |
| Grammar xuyên suốt | derive ↔ enumerate ↔ JSON ↔ DB ↔ provider ↔ API đều dùng một grammar (`isValidInterpretationSubjectKey`); API test dùng key sinh từ `enumerate` | Validator + API test |
| Văn phong | Giữ nguyên (KG-M3-14); M6 không sửa | — |

**Đề xuất test bảo vệ bằng nội dung thật (D-M6-06, O-M6-2):** thêm (a) một test đọc `prisma/content/interpretations.vi.json` rồi gọi `validateInterpretationContentText` và khẳng định `ok`, 252/252, `Published`, `vi` — không cần DB, chạy trong CI; (b) một API test seed **chính file thật** qua `seedInterpretationContent` rồi khẳng định chart đầy đủ trả 21 phần tử không phải fixture, mọi `bodyText` không rỗng/không placeholder. Đây là Category A: nó khoá hợp đồng nội dung mà hiện CI không bảo vệ; không thêm hành vi sản phẩm.

## 18. Provider / Engine Integration Verification

| Bước | Kỳ vọng | Chứng minh bằng |
|---|---|---|
| `Chart → derive` | Chỉ 10 hành tinh MVP; thứ tự canonical; thiếu nhà bỏ nhóm nhà | test M2 (11) + service test |
| `derive → lookup` | Gọi provider với đúng `language='vi'` và version đã phân giải | service test (22) |
| `Port` | Không phụ thuộc Prisma; hợp đồng "rỗng ≠ lỗi" | port JSDoc + test provider M1 |
| `Provider → PostgreSQL` | Lọc `status='Published'`, `tone IS NULL`, version/language chính xác | test tích hợp M1 (22) + seeder (12) |
| Không kết quả vs lỗi hạ tầng | `[]` hợp lệ; `InfrastructureError` truyền lên | test M1 + service test |
| Chọn version | Ghim > mới nhất; chuỗi sai bỏ qua + warn | service test |
| Thứ tự | Sắp lại theo thứ tự derive, độc lập DB | service test + API B |
| Wiring thật | `composition-root.ts` nối provider thật | API test (bootstrap thật) + smoke (Mục 27) |

M6 chạy lại toàn bộ trong CI và đối chiếu danh sách trên; không viết lại thành phần nào trừ khi phát hiện lỗi Category A.

## 19. Database & Migration Verification

**Quy trình DB sạch (Task 3; lệnh lấy từ `package.json`, `docker-compose.test.yml`, log M1/M3 của owner; owner dùng Windows nên có biến thể PowerShell):**

| Bước | Lệnh (trong `backend/`) | Kỳ vọng |
|---|---|---|
| 1. DB trống hoàn toàn | `docker compose -f docker-compose.test.yml down -v` rồi `docker compose -f docker-compose.test.yml up -d` | Postgres 16 mới, DB `test`, chưa có `_prisma_migrations` |
| 2. Trỏ DB | bash: `export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test` — PowerShell: `$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/test"` | Cùng URL `vitest.config.ts`/CI |
| 3. Migrate | `npm run prisma:deploy` | Áp dụng đủ 5 migration, không can thiệp thủ công |
| 4. Dữ liệu tham chiếu | `docker exec <container> psql -U postgres -d test -c "SELECT code, is_default FROM astrology.languages;"` | `vi`/`true` (do migration, A1) |
| 5. Nội dung | `npm run prisma:seed:content` | `Outcome: inserted, Count: 252`; chạy lại → `unchanged` |
| 6. Đếm | `… -c "SELECT status, count(*) FROM astrology.interpretation_contents GROUP BY status;"` | `Published \| 252` |
| 7. Drift (KG-M1-05) | `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url <URL DB tạm>` | Chỉ drift đã tài liệu (partial index, UNIQUE expression, CHECK viết tay). **Cờ chính xác cần xác nhận bằng `prisma migrate diff --help` ở Prisma 5.22.0 lúc thực hiện** (`UNVERIFIED` trong plan) |

Ghi chú: tên container test là `UNVERIFIED` (dùng `docker ps` lúc thực hiện); `db:reset` không dùng cho bước 3 vì nó cũng chạy seed Admin (cần `SEED_ADMIN_*`) và bỏ qua việc kiểm "từ DB trống". Dùng `down -v` để bảo đảm thật sự sạch; nếu owner dùng `migrate reset --force --skip-seed` thì ghi rõ là biến thể.

**Kiểm bổ sung:** migration chỉ `CREATE`/`INSERT` (không `ALTER`/`UPDATE` bảng cũ) — đã xác nhận ở M1; không có migration mới trong M6 (không được thêm).

## 20. OpenAPI Verification

| Câu hỏi | Thực tế |
|---|---|
| Nguồn sự thật | Zod trong `chart-response.mapper.ts` (`chartResponseSchema`, `interpretationResponseSchema`) + `chart.openapi.ts` |
| Sinh ra | `npm run generate:openapi` → `backend/openapi.json`, `openapi.yaml`; **gitignore**, không commit |
| CI | Bước `Generate OpenAPI` chạy lệnh (kiểm sinh được); **không** diff check |
| Chống drift | `chart-openapi-contract.test.ts` tự sinh tài liệu trong test (không phụ thuộc file) + `chartResponseSchema.strict().safeParse` trong API test |

Kiểm ở M6: chạy `generate:openapi`, đọc `openapi.json` và xác nhận: `ChartResponse` có đủ 13 trường cũ + `interpretationVersion`; `required` gồm `interpretations` và `interpretationVersion`; `interpretationVersion` kiểu `["string","null"]`; `InterpretationResponse` đúng 5 thuộc tính, `required` = 4 (không `tone`), `tone` nullable; mô tả hai endpoint không còn tên milestone nội bộ; không có `contentSource`. **Không** sửa tay artifact. Assertion còn thiếu (`ChartResponse.required` gồm `interpretationVersion`) được thêm vào test hợp đồng (Task 2, Category A nhỏ). Nếu sinh ra khác kỳ vọng: xác định nguồn Zod lỗi/thời (sửa nguồn), không phải artifact.

## 21. Architecture Boundary Verification

**Phương pháp:** (1) ESLint `boundaries/dependencies` — công cụ chính (`npm run lint`); (2) `grep`; (3) rà soát import tĩnh bằng tay cho 31 file production ở Mục 4. Không dùng công cụ phân tích đồ thị chưa có trong repo.

| Kiểm | bash (Git Bash/Linux) | PowerShell | Kỳ vọng |
|---|---|---|---|
| Domain không import cấm | `grep -rnE "from '.*(infrastructure\|application\|presentation\|express\|@prisma\|prisma-client)" backend/src/modules/chart/domain` | `Select-String -Path backend\src\modules\chart\domain\* -Pattern "infrastructure\|application\|presentation\|express\|@prisma" -Recurse` (hoặc `Get-ChildItem -Recurse … \| Select-String`) | 0 |
| Domain không `fs`/`path`/env | `grep -rnE "process\.env\|from 'fs'\|from 'node:fs'\|from 'path'" backend/src/modules/chart/domain` | tương tự | 0 |
| Application không import hạ tầng | `grep -rnE "from '.*(infrastructure\|presentation\|express\|@prisma)" backend/src/modules/chart/application` | tương tự | 0 |
| Presentation không import hạ tầng | `grep -rnE "from '.*(infrastructure\|@prisma)" backend/src/modules/chart/presentation` | tương tự | 0 |
| Infrastructure không import presentation/express | `grep -rnE "from '.*(presentation\|express)" backend/src/modules/chart/infrastructure` | tương tự | 0 |
| Provider chỉ ở composition root | `grep -rn "PrismaInterpretationContentProvider" backend/src` | tương tự | chỉ file định nghĩa + `composition-root.ts` |
| Không SQL thô trong provider | `grep -rnE "queryRaw\|executeRaw" backend/src/modules/chart` | tương tự | 0 (hoặc giải thích) |
| Không HTTP trong application | `grep -rnE "statusCode\|HttpStatus" backend/src/modules/chart/application` | tương tự | 0 |

[C-run] baseline các kiểm trên đều 0 vi phạm. M6 chạy lại ở commit cuối (một lần, ở Task 4). Dòng comment chứa từ `infrastructure` trong `application/` là nhiễu hợp lệ (đã gặp ở M4) — phân biệt bằng `from '` ở đầu mẫu.

**Đường ống diễn giải:** `chart/domain → chart/application → chart/infrastructure → Prisma/PostgreSQL` và `presentation → application`; Domain không import Prisma/Express/HTTP/filesystem/env. Vi phạm nào tìm thấy phải được ghi và phân loại (Category A nếu trái Architecture Spec).

## 22. TODO/FIXME Audit

**Sprint 4 TODO/FIXME Audit Table (baseline [C-run] ở `efda8f9`):**

| File | Dòng/ngữ cảnh | Category | Action | Lý do |
|---|---|---|---|---|
| `backend/{src,tests,prisma,scripts}/**` | `TODO`, `FIXME`, `HACK`, `XXX` | — | **Không có kết quả** | Không còn mảnh vụn của M1–M5 để xoá |
| `domain/engine/calculators/pattern.calculator.ts:10` | "stub and always returns an empty array" | Keep (Sprint 3, G-13) | Giữ | Hoãn có chủ đích, không thuộc Sprint 4 |
| `infrastructure/adapters/console-email-verification.adapter.ts`, `register-user.usecase.ts:62` | "placeholder" xác thực email | Keep (Sprint 1) | Giữ | Ngoài Sprint 4 |
| `domain/interpretation/interpretation-subject-key.ts:59,78` | "Non-MVP types … return false" | Keep | Giữ | Là tài liệu thiết kế, không phải việc dở dang |
| `prisma/seed-content.ts` | biến `placeholderCount` | Keep | Giữ | Là tính năng chặn nội dung giữ chỗ |
| Chú thích kiểu "D-2", "G-01", "chưa tồn tại" | `grep` | — | Không còn trong `src/` | Đã gỡ ở M5 |

Task 6 chạy lại sweep ở commit cuối; mọi kết quả mới được phân loại Remove/Keep/Convert/Fix theo prompt Mục 21; không mở rộng phạm vi chỉ vì có TODO. Ngoài mã: tài liệu có mô tả lỗi thời (C1, C2 ở Mục 5) được xử lý ở Mục 35.

## 23. Coverage Risk Review

Chạy `npm run test:coverage` (CI chạy lệnh này mỗi lần; báo cáo ở `backend/coverage/`). **Không có ngưỡng %** (D-M6-08). Dùng để tìm nhánh chưa test ở các file trong Mục 4:

| Rủi ro | File | Đã có test? | Cách rà |
|---|---|---|---|
| Lỗi provider / nhánh `InfrastructureError` | `prisma-interpretation-content.provider.ts` | Có (stub, M1) | Xem nhánh `catch` đã phủ |
| Fallback version (null/ghim/rỗng/không hợp lệ) | `interpretation-lookup.service.ts` | Có (22) | Nhánh `resolveLatestVersion`, hòa version |
| Thiếu giờ sinh | derive + service + API C | Có | — |
| Nội dung không tìm thấy | service (cap 20 key), API G | Có | — |
| Subject không hợp lệ | derive/`interpretation-subject-key` | Có (M2) | — |
| Ánh xạ API | `chart-response.mapper.ts` | Có (2 test + API) | Kiểm nhánh `tone` |
| Persistence | `prisma-chart.mapper/repository` | Có (M1/M4) | Nhánh `snapshotInterpretationVersion` |
| Validator/seeder | `infrastructure/content/*` | Có (20 + 12) | Nhánh Published thiếu, xung đột, hạ cấp |

Kết quả: bảng "nhánh chưa phủ → mức rủi ro → hành động". Chỉ thêm test cho khoảng trống rủi ro cao (không thêm chỉ để tăng %). Khoảng trống đã biết: file nội dung thật (Mục 17).

## 24. Build / Lint / Typecheck / Format Verification

| Kiểm | Lệnh | Bằng chứng | Ghi chú |
|---|---|---|---|
| Lint | `npm run lint` | CI | 3 warning `jwt-token.adapter.ts` có từ Sprint 1: phân loại ngoài phạm vi, không sửa |
| Typecheck | `npm run typecheck` | CI | Phạm vi chỉ `src/` (C6/KG-M3-01) |
| Format | `npm run format:check` | CI | Không format lại file cũ. `docs/api/REST_API_Specification.md` báo lệch Prettier từ trước, ngoài phạm vi CI backend (D-M6-09) |
| Build | `npm run build` | CI | Kiểm `dist/` có `server.js`, `modules/chart/application/services/interpretation-lookup.service.js`, `infrastructure/repositories/prisma-interpretation-content.provider.js`; không có tệp test trong `dist` (`tsconfig` `include: src`) |
| Không rò thư viện test vào build | đọc `tsconfig.json`; grep `vitest\|supertest` trong `src/` | audit | kỳ vọng 0 |

Việc không có trong CI (ESLint trên `prisma/`, `scripts/` đã nằm trong `eslint .`) được chạy kèm bởi `npm run lint`.

## 25. Security Review

Giới hạn trong thay đổi Sprint 4; không refactor bảo mật ngoài phạm vi.

| Hạng mục | Quan sát ([repo]) | Hành động M6 |
|---|---|---|
| Content injection / HTML | `bodyText` là văn bản thuần, nội dung do dự án soạn (`Hybrid`), qua validator strict trước khi vào DB; backend không render HTML; Express serialize JSON. Frontend phải escape khi hiển thị | Ghi vào bàn giao F5 (đã có); xác nhận không có `dangerouslySetInnerHTML` ở backend (không áp dụng) |
| Serialization API | `ChartResponseMapper` chọn trường tường minh; `chartResponseSchema.strict()` trong test | Xác nhận test J |
| Truy vấn Prisma | `findMany` có kiểu, tham số hoá; không SQL thô trong provider | `grep queryRaw` (Mục 21) |
| Định danh chart do người dùng điều khiển | `:id` qua Zod; `assertChartOwnership` chạy **trước** `lookup` (test M4) | Xác nhận test |
| Version/language | Server-side: `'vi'` hằng; version từ DB hoặc cột chart; **không có đầu vào người dùng** | Xác nhận (không có tham số request mới) |
| Rò lỗi | KG-M1-03 đã sửa (`details` không còn chứa `cause`); `mapErrorToProblemDetails` đưa `details` vào `metadata` không lọc theo status | `grep "{ cause"` = 0; smoke: gửi `GET /charts/<id không tồn tại>` kiểm body 404 |
| Ghi log | Service log `chartId`, version, `missingKeys` (tối đa 20); không log tên người dùng/dữ liệu sinh | Đọc các lời gọi `logger.*` trong service |
| Niềm tin nội dung sinh ra | Không có sinh nội dung ở runtime; seeder từ chối ghi đè `Published` | Xác nhận |

Phát hiện ngoài Sprint 4 (nếu có) được phân loại Category B, không sửa.

## 26. Performance Review

Mục tiêu: xác nhận hợp lý ở quy mô MVP; không tối ưu sớm.

| Hạng mục | Phân tích ([repo]) | Đo ở M6 |
|---|---|---|
| Số truy vấn Create | `findPublishedVersions` (1, `distinct` theo version, lọc `language`+`status`) + `findPublishedContents` (1, tối đa 21 cặp `OR`) + insert chart; khi bank rỗng gọi `findPublishedVersions` hai lần (KG-M4-03) | Bật `DEBUG=prisma:query` khi smoke, đếm truy vấn |
| Số truy vấn Get | `findById` + `findPublishedContents` (ghim: 1; chưa ghim: thêm `findPublishedVersions`) | Như trên |
| N+1 | Không có (một truy vấn nội dung cho cả danh sách) | Xác nhận bằng log truy vấn |
| Chỉ mục | UNIQUE expression + partial index `WHERE status='Published'` (M1) phục vụ đúng lookup | `EXPLAIN` tuỳ chọn (không bắt buộc) |
| Sắp xếp/Serialize | O(21), `Map` trong bộ nhớ; payload ≤ 21 đoạn (~8 KB) | Đo kích thước body ở smoke |
| Danh sách chart | `GET /charts` không đổi, không có diễn giải | — |

Kết luận dự kiến: chấp nhận được cho MVP; ghi nhận KG-M4-03 như đã chấp nhận.

## 27. Clean Database / Real API Smoke Test

Một đường đầu-cuối thật; thực hiện bởi owner (cần Docker), Claude hướng dẫn và đối chiếu bằng chứng. **Không có script mới**; thủ tục thủ công có chụp bằng chứng (D-M6-05). Kết quả được ghi vào `docs/implementation/archive/sprint-4/Sprint_4_Clean_Environment_Verification.md` (theo tiền lệ `archive/sprint-3/Sprint_3_Clean_Environment_Verification.md`).

| Bước | Hành động | Kỳ vọng |
|---|---|---|
| 1–6 | DB sạch → `prisma:deploy` → kiểm `vi` → `prisma:seed:content` → đếm (Mục 19) | `Published \| 252` |
| 7 | `.env` có `DATABASE_URL` DB test, JWT secret, `NODE_ENV` **không** là `production`; `GEONAMES_USERNAME` đặt giá trị tạm nếu bắt buộc (`UNVERIFIED` có bắt buộc không) | Server lên |
| 8 | `npm run build` rồi `node dist/server.js` (không dùng `npm run start`) | `GET http://localhost:3000/live` → 200 |
| 9 | `POST /api/v1/auth/register` + `POST /api/v1/auth/login` | `accessToken` |
| 10 | `POST /api/v1/birth-profiles` (payload như API test: `label, birthDate, birthTime, isBirthTimeKnown:true, birthLocation{placeName,latitude,longitude,historicalTimezoneId}`) | `id` |
| 11 | `POST /api/v1/charts/natal?save=true` `{birthProfileId, houseSystem:'Placidus', includeOptionalPoints:[]}` | 201; `interpretations.length===21`; `interpretationVersion==='1.0'`; `bodyText` là văn bản thật (không phải `fixture:`) |
| 12 | `GET /api/v1/charts/{id}` | 200; cùng nội dung; thứ tự: 10 `PlanetInSign` (Sun→Pluto) → `Ascendant_in_*` → 10 `PlanetInHouse`; 5 khoá mỗi phần tử; `tone` `null` |
| 13 | Thiếu giờ sinh: `POST /api/v1/charts/natal?save=false` (Guest) với `birthData` `isBirthTimeKnown:false` | 200; `isHouseDataAvailable:false`; 10 `PlanetInSign`; `houses=[]`, `angles=[]` |
| 14 | Chart không tồn tại / người khác | 404 / 403; body không chứa chi tiết nội bộ |
| 15 | Đếm truy vấn (`DEBUG=prisma:query`) và kích thước body | Khớp Mục 26 |
| 16 | Dừng server, lưu log | Không lỗi chưa xử lý trong log |

Cách gửi yêu cầu: `curl` (Git Bash) hoặc `Invoke-RestMethod` (PowerShell); chụp phần JSON liên quan (số phần tử, 3 key đầu/cuối, `interpretationVersion`, một đoạn `bodyText`). Kịch bản chart cũ chưa ghim ở DB thật được ghi là phủ bởi API test F (D-M6-11).

## 28. Task Breakdown

Sáu task có biên rõ, mỗi task có đầu ra kiểm chứng riêng; Task 1 chỉ đọc, các task sau thực hiện.

### Task 1 — Repository & Sprint 4 Integration Audit
1. **ID/Tên:** T1 — Audit tích hợp và kiểm kê.
2. **Mục tiêu:** xác nhận Change Inventory (Mục 4), chạy baseline chung, ghi mâu thuẫn spec–mã (Mục 5), liệt kê rủi ro tích hợp. Không sửa rộng.
3. **Vì sao thuộc M6:** M6 là cổng tích hợp; cần inventory thật làm nền cho mọi task.
4. **Tiền điều kiện:** HEAD `dev` có CI xanh (efda8f9 hoặc mới hơn).
5. **Kiểm:** `git diff --name-status a369019..HEAD -- backend docs`; `package.json`; `backend/CHANGELOG.md`; `docs/**`; workflows.
6. **Có thể sửa:** không.
7. **Bước:** (a) tái dựng inventory và so với Mục 4; (b) xác nhận không có file ngoài danh sách; (c) đối chiếu từng quyết định frozen với mã; (d) ghi mọi sai lệch vào bảng Mục 5.
8. **Phụ thuộc:** không.
9. **Test:** không thêm.
10. **Lệnh:** `git`, `grep`.
11. **Evidence:** bảng inventory đã xác nhận; danh sách mâu thuẫn; danh sách rủi ro.
12. **Acceptance:** inventory khớp lịch sử git; mọi mâu thuẫn có phân loại A–D.
13. **Ngoài phạm vi:** sửa mã.

### Task 2 — Automated Suite & Regression Hardening
1. **ID/Tên:** T2 — Suite tự động và củng cố hồi quy.
2. **Mục tiêu:** toàn bộ suite xanh trên commit cuối; Sprint 3 được bảo vệ; thêm test giá trị cao còn thiếu.
3. **Vì sao thuộc M6:** hồi quy là mục tiêu chính; có khoảng trống đã xác định (nội dung thật, assertion cột DB, `required`).
4. **Tiền điều kiện:** T1 xong.
5. **Kiểm:** `tests/**`, `vitest.config.ts`, báo cáo CI.
6. **Có thể sửa:** `tests/api/chart/chart-interpretation.api.test.ts`, `tests/api/chart/chart-openapi-contract.test.ts`; **tạo** (nếu O-M6-2 được duyệt) test nội dung thật; mã production **chỉ** khi lỗi Category A được chứng minh.
7. **Bước:** (a) chạy `npm test`/CI, phân loại thất bại (Mục 12); (b) chạy riêng 3 suite Sprint 3 (Mục 13); (c) thêm assertion: cột DB `= version` sau POST `save=true`; `ChartResponse.required` gồm `interpretationVersion`; (d) thêm test file nội dung thật (Mục 17 a) và API test với nội dung thật (b); (e) mỗi test mới phải khoá một hành vi cụ thể, không thêm để tăng %.
8. **Phụ thuộc:** T1.
9. **Test:** như trên.
10. **Lệnh:** `npm test`; `npx vitest run tests/unit/modules/chart/domain tests/golden tests/integration/e2e`; CI.
11. **Evidence:** CI trên commit cuối; log suite Sprint 3; diff test mới.
12. **Acceptance:** suite xanh; không sửa kỳ vọng cũ; thất bại (nếu có) có nhãn và bằng chứng.
13. **Ngoài phạm vi:** sửa test Identity/Birth Profile không do Sprint 4; thêm test chỉ để tăng coverage.

### Task 3 — API / OpenAPI / Database Integration Verification
1. **ID/Tên:** T3 — API, OpenAPI, DB, smoke thật.
2. **Mục tiêu:** chứng minh DB sạch → migrate → seed → khởi động → chart thật → diễn giải đúng; OpenAPI khớp.
3. **Vì sao thuộc M6:** CI không seed và không chạy server từ `dist/`; đây là bằng chứng vận hành duy nhất.
4. **Tiền điều kiện:** T2 có commit xanh; Docker khả dụng.
5. **Kiểm:** `docker-compose.test.yml`, `prisma/**`, `package.json`, `src/server.ts`, `scripts/generate-openapi.ts`.
6. **Có thể sửa:** không (tài liệu bằng chứng nằm ở T6); sửa mã chỉ khi smoke lộ lỗi Category A.
7. **Bước:** Mục 19, 20, 27.
8. **Phụ thuộc:** T2.
9. **Test:** smoke thủ công có bằng chứng; contract test OpenAPI (CI).
10. **Lệnh:** Mục 19 và 27; `npm run generate:openapi`.
11. **Evidence:** log owner (migrate, seed, đếm, JSON excerpt, đếm truy vấn); đọc `openapi.json`.
12. **Acceptance:** Mục 36 #9–#13.
13. **Ngoài phạm vi:** viết script smoke mới; thay đổi seed; thêm version giả vào DB smoke.

### Task 4 — Architecture Boundary & Dependency Audit
1. **ID/Tên:** T4.
2. **Mục tiêu:** chứng minh không vi phạm ranh giới (Mục 21).
3. **Vì sao thuộc M6:** prompt Mục 19–20; ngăn xói mòn kiến trúc trước khi đóng sprint.
4. **Tiền điều kiện:** commit cuối đã ổn định.
5. **Kiểm:** `chart/{domain,application,infrastructure,presentation}`, `composition-root.ts`, `.eslintrc.cjs`.
6. **Có thể sửa:** chỉ để loại vi phạm Category A (nếu có).
7. **Bước:** chạy `npm run lint` (boundaries); chạy các `grep`; rà tay import của 31 file production; đối chiếu Architecture Spec §3.3, §12.
8. **Phụ thuộc:** T1.
9. **Test:** không.
10. **Lệnh:** Mục 21.
11. **Evidence:** output `grep` (0 kết quả), kết quả ESLint.
12. **Acceptance:** 0 vi phạm hoặc vi phạm được phân loại và xử lý.
13. **Ngoài phạm vi:** đổi cấu trúc lớp, thêm công cụ phân tích mới.

### Task 5 — Quality Gates & Build Hardening
1. **ID/Tên:** T5.
2. **Mục tiêu:** lint/typecheck/format/build sạch; coverage được rà; review bảo mật và hiệu năng có giới hạn.
3. **Vì sao thuộc M6:** prompt Mục 22–26.
4. **Tiền điều kiện:** T2 xong.
5. **Kiểm:** `coverage/`, `dist/`, Mục 23–26.
6. **Có thể sửa:** chỉ lỗi Category A thuộc phạm vi M6.
7. **Bước:** CI trên commit cuối; mở báo cáo coverage cho các file Sprint 4; điền bảng rủi ro Mục 23; thực hiện checklist Mục 25–26; kiểm nội dung `dist/`.
8. **Phụ thuộc:** T2 (và T3 cho số truy vấn).
9. **Test:** như phát hiện ở coverage (chỉ khoảng trống rủi ro cao).
10. **Lệnh:** `npm run lint`, `typecheck`, `format:check`, `build`, `test:coverage`.
11. **Evidence:** CI xanh; bảng coverage-risk; bảng security/performance.
12. **Acceptance:** Mục 36 #4–#8.
13. **Ngoài phạm vi:** ngưỡng coverage, format cả repo, sửa warning Sprint 1.

### Task 6 — TODO/FIXME Cleanup & Sprint Closure
1. **ID/Tên:** T6.
2. **Mục tiêu:** sweep TODO, sửa tài liệu mâu thuẫn, soạn tài liệu đóng sprint, Evidence Matrix cuối.
3. **Vì sao thuộc M6:** prompt Mục 21 và 28; cổng cuối "Sprint 4 sẵn sàng đóng".
4. **Tiền điều kiện:** T2–T5 xong, các cổng PASS.
5. **Kiểm:** `docs/**`, `backend/CHANGELOG.md`, `backend/README.md`, `backend/package.json`.
6. **Có thể sửa:** REST Spec §12.4 (xoá/đánh dấu sơ đồ cho endpoint đã loại), §5.5 (grammar), thứ tự dòng §5.4; `CHANGELOG.md` (mục `[0.4.0]`); `package.json` version; `backend/README.md` (trạng thái roadmap nếu có liệt kê sprint — `UNVERIFIED`); `docs/implementation/Backend_Implementation_Roadmap.md` nếu mô tả Sprint 4 lỗi thời (xem D-S4-02).
7. **Bước:** (a) sweep TODO (Mục 22) ở commit cuối; (b) sửa C1, C2; (c) tạo `Sprint_4_Known_Gaps_Registry.md`, `Sprint_4_Clean_Environment_Verification.md`, Evidence Matrix M6 (và Final Review Report theo tiền lệ Sprint 3) trong `archive/sprint-4/`; (d) `CHANGELOG.md` mục `[0.4.0]` theo định dạng hiện có (Added/Changed/Known Gaps); (e) **bump `package.json` `0.3.0 → 0.4.0` là commit cuối cùng**, chỉ sau khi mọi cổng PASS (R4); (f) xoá plan M6 sau khi đóng.
8. **Phụ thuộc:** T2–T5.
9. **Test:** `format:check` và CI sau khi sửa.
10. **Lệnh:** `grep`, `npm run format:check`, CI.
11. **Evidence:** bảng TODO; diff tài liệu; Evidence Matrix.
12. **Acceptance:** Mục 36 #17–#22.
13. **Ngoài phạm vi:** sửa nội dung diễn giải; tạo tính năng; format lại tài liệu không liên quan.

## 29. File Change Map

**Must inspect:** toàn bộ file Mục 4; `package.json`; `tsconfig.json`; `.eslintrc.cjs`; `.prettierrc*`; `vitest.config.ts`; `docker-compose*.yml`; `.github/workflows/*.yml`; `.env.example`; `scripts/generate-openapi.ts`; `docs/api/REST_API_Specification.md`; `docs/database/Database_Design_Specification.md`; `docs/architecture/*.md`; `backend/CHANGELOG.md`; `backend/README.md`; `docs/implementation/**`.

**Expected modify:** `tests/api/chart/chart-interpretation.api.test.ts` (assertion cột DB); `tests/api/chart/chart-openapi-contract.test.ts` (`required`); `docs/api/REST_API_Specification.md` (C1, C2); `backend/CHANGELOG.md`; `backend/package.json` (`version`, commit cuối); `backend/README.md` (nếu có bảng trạng thái sprint). Mã production: **không dự kiến sửa**; chỉ khi có lỗi Category A.

**Expected create:** test nội dung thật (nếu O-M6-2 duyệt) — vị trí đề xuất `tests/unit/modules/chart/infrastructure/content/real-content-file.test.ts` và `tests/api/chart/chart-real-content.api.test.ts`; `docs/implementation/archive/sprint-4/{Sprint_4_M6_Exit_Criteria_Evidence_Matrix.md, Sprint_4_Known_Gaps_Registry.md, Sprint_4_Clean_Environment_Verification.md, Sprint_4_Final_Review_Report.md}`.

**Generated artifacts (không commit):** `backend/openapi.json`, `backend/openapi.yaml`, `backend/dist/`, `backend/coverage/`.

**Source-of-truth files:** Zod schemas (`chart-response.mapper.ts`, `chart.openapi.ts`) cho OpenAPI; `prisma/schema.prisma` + `migrations/` cho DB; `prisma/content/interpretations.vi.json` cho nội dung (đóng băng); spec trong `docs/`.

**Must not modify:** `domain/engine/**` (calculators, Swiss adapter), `prisma/migrations/**` (không thêm migration), `prisma/schema.prisma`, `prisma/content/interpretations.vi.json`, `domain/interpretation/**`, `domain/ports/**`, provider, `infrastructure/content/**`, `application/**` và `presentation/**` trừ khi lỗi Category A; `.github/workflows/**`; mọi file Identity/Birth Profile.

## 30. Regression Matrix

| Area | Existing behavior | Sprint 4 risk | Verification | Evidence |
|---|---|---|---|---|
| Identity | Đăng ký/đăng nhập/refresh/logout | `composition-root.ts` đổi; `InfrastructureError` | `npm test` phân hệ identity; smoke bước 9 | CI + log smoke |
| Birth Profile | CRUD, ownership, INV-BP1 | `prisma-birth-profile.repository.ts` sửa `InfrastructureError` | test tích hợp birth-profile; smoke bước 10 | CI |
| Natal Chart | Phép tính, golden, snapshot | `chart-builder.ts`, `chart.entity.ts` bị chạm | domain unit + golden + E2E (Mục 13) | CI + log suite |
| Chart persistence | Lưu/đọc/xoá mềm chart | Ghi/đọc `snapshot_interpretation_version` | `prisma-chart.repository.test`; API E/F | CI |
| Interpretation | — (mới) | Version/thiếu nội dung/thiếu giờ sinh | Mục 15–18; test M2/M4/M5 | CI |
| API | 4 route chart, mã lỗi | Mapper/controller đổi chữ ký | API test cũ + mới | CI |
| OpenAPI | Tài liệu chart | Thêm `interpretationVersion` | Mục 20; contract test | CI + đọc artifact |
| Database | Migration 1–4, bảng chart | Migration mới (additive) | Mục 19 từ DB trống | log owner |
| Build | `tsc` build | Mã mới, import `.js` | `npm run build`; kiểm `dist/` | CI |
| Architecture | Ranh giới lớp | Service/validator/provider mới | Mục 21 | lint + grep |

## 31. Command / Evidence Matrix

Trạng thái ban đầu `UNVERIFIED` (M6 chưa chạy). Cột "Baseline" chỉ là bằng chứng trước M6, **không** thay bằng chứng của M6.

| Verification | Command / Procedure | Expected Result | Evidence Required | Baseline trước M6 | Status |
|---|---|---|---|---|---|
| Lint | `npm run lint` | 0 error; 3 warning `jwt` có sẵn | CI trên commit cuối | CI #253 ✔ (`efda8f9`) | UNVERIFIED |
| Typecheck | `npm run typecheck` | Pass | CI | CI #253 ✔ | UNVERIFIED |
| Format | `npm run format:check` | Pass | CI | CI #253 ✔ | UNVERIFIED |
| Full test | `npm test` | Pass | CI (`test:coverage` chạy toàn bộ) | CI #253 ✔ | UNVERIFIED |
| Coverage | `npm run test:coverage` | Risk reviewed | báo cáo + bảng rủi ro | chưa rà rủi ro | UNVERIFIED |
| Build | `npm run build` | Pass | CI | CI #253 ✔ | UNVERIFIED |
| OpenAPI | `npm run generate:openapi` + đọc `ChartResponse` | Khớp hợp đồng | output + trích artifact | [C-run] ở `adedf64` | UNVERIFIED |
| Migration | DB trống + `prisma:deploy` + seed + `GET` thật | Pass | log owner | M1/M3 trên DB test/dev | UNVERIFIED |
| Sprint 3 regression | `vitest run tests/unit/modules/chart/domain tests/golden tests/integration/e2e` | Pass | log + CI | CI #253 ✔ | UNVERIFIED |
| Architecture | `grep` + ESLint boundaries | 0 vi phạm | output | [C-run] 0 vi phạm | UNVERIFIED |
| TODO/FIXME | sweep repo | Đã phân loại | bảng Mục 22 | [C-run] 0 kết quả | UNVERIFIED |
| Nội dung thật | `--validate-only` + test nội dung thật | 252/252 | output + CI | [C-run] 252/252 | UNVERIFIED |
| Drift migration | `prisma migrate diff` (KG-M1-05) | Chỉ drift đã tài liệu | log owner | chưa có | UNVERIFIED |
| Smoke DB sạch | Mục 27 | Pass | log owner + JSON excerpt | chưa có | UNVERIFIED |

Trạng thái cho phép: `PASS`, `FAIL`, `PARTIAL`, `UNVERIFIED`, `NOT APPLICABLE`, `DEFERRED`. Không ghi PASS vì lệnh tồn tại.

## 32. Decision Log

M1–M5 và quyết định frozen không mở lại. Quyết định mới của M6:

| ID | Quyết định | Lý do |
|---|---|---|
| D-M6-01 | CI xanh trên đúng commit là bằng chứng cho các bước CI chạy; log owner chỉ cho việc CI không chạy | Thoả thuận từ M4; tránh lặp log |
| D-M6-02 | Thất bại: phân loại 5 nhãn; "pre-existing" cần chạy trên `a369019`; "flaky" cần ≥ 3 lần | Prompt Mục 9; tránh gán nhãn cảm tính |
| D-M6-03 | Không commit artifact OpenAPI; không thêm diff check CI | Convention hiện tại; ngoài phạm vi |
| D-M6-04 | TODO: baseline 0 kết quả; stub/placeholder của Sprint 1–3 giữ nguyên | Không phải mảnh vụn Sprint 4 |
| D-M6-05 | Smoke test thủ công có bằng chứng; không tạo script/artifact mới; ghi kết quả ở `Sprint_4_Clean_Environment_Verification.md` | Tiền lệ Sprint 3; M6 không phải milestone công cụ |
| D-M6-06 | Thêm 2 test nội dung thật (file + API) nếu owner duyệt | CI hiện không bảo vệ file nội dung; Category A, không thêm hành vi |
| D-M6-07 | Tài liệu đóng sprint, CHANGELOG và bump `0.4.0` nằm trong Task 6; bump là commit cuối | Prompt Task 6; R4; plan v1.1 từng đặt ở M7 (O-M6-1) |
| D-M6-08 | Coverage chỉ để rà rủi ro, không ngưỡng | Prompt Mục 22; Sprint 3 §12.7 |
| D-M6-09 | Không format lại `docs/api/REST_API_Specification.md` (lệch Prettier có từ trước, ngoài CI) | Tránh churn |
| D-M6-10 | Cung cấp lệnh cho cả bash và PowerShell | Owner dùng Windows |
| D-M6-11 | Smoke DB thật chỉ kiểm version `1.0`; kịch bản đa version dựa vào API test E/F/G | Không seed version giả vào DB smoke |
| D-M6-12 | Warning `jwt-token.adapter.ts` (Sprint 1), `pattern.calculator` stub (Sprint 3), `users.preferred_language` (KG-S4-08) giữ nguyên | Category B |

## 33. Open Questions

No blocking Open Questions identified after repository audit. Hai điểm không chặn:

| ID | Câu hỏi | Vì sao quan trọng | Đề xuất | Chặn? |
|---|---|---|---|---|
| O-M6-1 | Tài liệu đóng sprint (CHANGELOG `0.4.0`, bump version, Known Gaps Registry, Final Review Report) làm trong M6 Task 6, hay tách thành milestone đóng sprint riêng như Sprint 4 Plan v1.1 (M7)? | Quyết định ai đóng sprint và khi nào bump version | Làm trong Task 6, bump là commit cuối sau khi mọi cổng PASS | Không |
| O-M6-2 | Duyệt thêm hai test dùng nội dung thật (D-M6-06)? | Hiện CI không bắt được lỗi trong `interpretations.vi.json` | Có; nếu không, ghi thành Known Gap và chỉ dựa vào `--validate-only` thủ công | Không |

## 34. Risks

| ID | Rủi ro | Xác suất | Tác động | Phát hiện | Giảm thiểu | Lớp | Hành động M6 |
|---|---|---|---|---|---|---|---|
| R1 | Hồi quy suite toàn bộ | Thấp | Cao | CI/`npm test` | Phân loại thất bại (D-M6-02) | Tất cả | T2 |
| R2 | Trôi hợp đồng `ChartResponse` | Thấp | Cao | `strict().safeParse`, contract test | So với bản Sprint 3 | Presentation | T2, T3 |
| R3 | Lệch migration/seed | Thấp | Cao | DB sạch + seed | Mục 19 | DB | T3 |
| R4 | Lệch version (ghim vs response) | Thấp | Cao | API E/F/G | Bảng Mục 14–15 | Application | T2 |
| R5 | Khoảng trống bao phủ nội dung | Trung bình | Cao | Không test đọc file thật | D-M6-06 | Content | T2 |
| R6 | Vi phạm phụ thuộc kiến trúc | Thấp | Cao | ESLint + grep | Mục 21 | Tất cả | T4 |
| R7 | Ghép nối ngầm Prisma/domain | Thấp | Cao | grep + rà tay | Mục 21 | Domain | T4 |
| R8 | Hồi quy thiếu giờ sinh | Thấp | Trung bình | API C | Mục 16 | Application | T2 |
| R9 | Trôi OpenAPI | Trung bình | Trung bình | CI không có diff check | Contract test + đọc artifact | OpenAPI | T3 |
| R10 | Lệch build/type | Thấp | Cao | CI | Mục 24 | Build | T5 |
| R11 | Dọn TODO không đầy đủ / mở rộng phạm vi | Thấp | Thấp | sweep | Bảng Mục 22 | Mã | T6 |
| R12 | Smoke test không tái hiện được (môi trường owner) | Trung bình | Trung bình | Thiếu log | Lệnh PowerShell/bash, `down -v` | DB | T3 |
| R13 | Smoke/E2E bị ảnh hưởng bởi `npm run start` đặt `production` | Thấp | Trung bình | cookie refresh lỗi | Dùng `node dist/server.js` | Vận hành | T3 |
| R14 | Bump version trước khi cổng xanh | Thấp | Trung bình | Review | Bump là commit cuối | Tài liệu | T6 |

## 35. Documentation Changes

| Tài liệu | Thay đổi |
|---|---|
| REST API Spec §12.4 | Loại sơ đồ "Generate Interpretation" (endpoint đã bị loại ở §14.9) hoặc đánh dấu lỗi thời |
| REST API Spec §5.5, §5.4 | Sửa grammar `subjectKey` (`{Planet}_in_House_{n}`, `Ascendant_in_{Sign}`); đặt `interpretationVersion` sau `interpretations` |
| `backend/CHANGELOG.md` | Mục `[0.4.0] - <ngày> (Sprint 4)`: Added (interpretation persistence/domain/application/API, 252 mục nội dung `Hybrid`, CLI `prisma:seed:content`, `interpretationVersion`), Changed (`ChartResponse` additive, `InfrastructureError` đúng chữ ký, DB Spec `AngleInSign`/`languages`), Known Gaps (KG-S4-06, KG-S4-08, KG-M1-05, KG-M3-01, KG-M2-03, §12.4 nếu chưa sửa) — theo định dạng hiện có |
| `backend/package.json` | `0.3.0 → 0.4.0` (commit cuối) |
| `backend/README.md` | Trạng thái Sprint 4 và `prisma:seed:content` nếu README có bảng script/roadmap (`UNVERIFIED`) |
| `docs/implementation/Backend_Implementation_Roadmap.md` | Sửa mô tả Sprint 4 lỗi thời (D-S4-02), nếu còn |
| `archive/sprint-4/` | Evidence Matrix M6, Known Gaps Registry, Clean Environment Verification, Final Review Report; xoá plan M6 sau khi đóng |
| Sprint 4 Plan v1.1 | Không sửa lịch sử |

Known Gaps Registry (đề xuất nội dung): KG-S4-06 (Moon/giờ sinh), KG-S4-08 (`preferred_language`), KG-M1-05 (`migrate diff`, nếu còn), KG-M3-01 (CLI ngoài `typecheck`), KG-M2-03 (mock `as any`), KG-M4-03 (hai lần `findPublishedVersions`), KG-M3-14 (văn phong, đã chấp nhận), Sprint 3: G-02, G-13; REST §12.4 (nếu chưa sửa).

## 36. Acceptance Criteria

1. Change Inventory khớp lịch sử git; mâu thuẫn được phân loại.
2. Full suite xanh trên commit cuối; mọi thất bại (nếu có) có nhãn và bằng chứng.
3. Ba suite Sprint 3 xanh, không sửa kỳ vọng; không file `domain/engine/calculators/**` hay Swiss adapter bị sửa.
4. `lint` pass (chỉ 3 warning Sprint 1).
5. `typecheck` pass.
6. `format:check` pass.
7. `build` pass; `dist/` đúng.
8. Coverage đã rà rủi ro; khoảng trống rủi ro cao đã xử lý hoặc ghi Known Gap.
9. OpenAPI khớp `ChartResponse` (13 trường cũ + `interpretationVersion`; nullable/required đúng).
10. DB sạch migrate được, không can thiệp thủ công; `languages.vi` tồn tại.
11. Seed nội dung thành công (`inserted 252`, `unchanged`, `Published | 252`).
12. `GET` chart thật trả diễn giải đúng (21 phần tử, thứ tự, `interpretationVersion '1.0'`, nội dung thật).
13. Semantics version đã kiểm (ghim, chưa ghim, ghim hết nội dung, `save=false`, bank rỗng).
14. Thiếu giờ sinh vẫn đúng (10 `PlanetInSign`, không lỗi).
15. Ranh giới kiến trúc đã kiểm (0 vi phạm).
16. Không có import cấm trong `chart/domain/**`.
17. TODO/FIXME của Sprint 4 đã phân loại (hiện 0).
18. Không còn hồi quy Sprint 4 chưa ghi nhận.
19. Không có việc ngoài phạm vi bị kéo vào M6.
20. Evidence Matrix có bằng chứng thật cho mọi cổng áp dụng.
21. CHANGELOG và tài liệu cập nhật theo convention; `0.4.0` bump là commit cuối.
22. Final architect review hoàn tất.

## 37. Exit Criteria

| Tiêu chí | Lệnh / nguồn | Bằng chứng chấp nhận |
|---|---|---|
| Lint/Format/Typecheck/Build/Test | CI trên **commit cuối** | CI Success |
| Sprint 3 regression | `npx vitest run tests/unit/modules/chart/domain tests/golden tests/integration/e2e` | Log owner (và CI) |
| OpenAPI | `npm run generate:openapi` | CI + trích `ChartResponse` |
| DB sạch + seed + API thật | Mục 19, 27 | Log owner + JSON excerpt |
| `migrate diff` | Mục 19 bước 7 | Log owner (hoặc ghi Known Gap) |
| Ranh giới | Mục 21 | Output `grep` + ESLint |
| TODO/FIXME | sweep | Bảng Mục 22 |
| Tài liệu | diff | Mục 35 |

Evidence phải ghi rõ commit tương ứng (bài học M2: log chạy trước commit cuối không phải bằng chứng cho HEAD).

## 38. Definition of Done

M6 xong khi: M5 vẫn an toàn hồi quy; full suite và Sprint 3 xanh; lint/typecheck/format/build pass; coverage đã rà; OpenAPI khớp; DB sạch migrate và seed thành công; `GET` chart thật có diễn giải đúng; version và thiếu giờ sinh đúng; kiến trúc sạch; TODO đã phân loại; không có hồi quy chưa ghi nhận; không kéo việc ngoài phạm vi; Evidence Matrix có bằng chứng thật; CHANGELOG/tài liệu cập nhật; final architect review hoàn tất.

## 39. Implementation Sequence

1. T1 (đọc) → xác nhận inventory và mâu thuẫn.
2. T2 (test) → một commit nhỏ (assertion, test nội dung thật nếu duyệt) → CI xanh.
3. T4 song song được với T2 (chỉ đọc).
4. T3 (smoke) sau khi có commit xanh từ T2.
5. T5 (cổng chất lượng, coverage, security/performance).
6. T6: sweep TODO → sửa tài liệu → tài liệu đóng sprint → CHANGELOG → **bump version (commit cuối)** → CI xanh trên commit cuối.
7. Đóng M6: lưu Evidence Matrix; xoá plan M6; chuyển Sprint 4 sang "sẵn sàng đóng".

## 40. Final Architect Review

| Câu hỏi | Đánh giá hiện tại (trước thực thi) |
|---|---|
| Domain purity | `chart/domain/**` độc lập hạ tầng: [C-run] 0 import cấm; M6 xác nhận lại ở commit cuối |
| Dependency direction | Khớp Architecture Spec và ESLint `boundaries`; provider chỉ ở composition root |
| Persistence | Truy cập interpretation chỉ qua `IInterpretationContentProvider`; không SQL thô |
| API | `ChartResponse` khớp REST §5.4/§5.5/§14.9 sau `efda8f9`; còn nhận xét tài liệu C1, C2 |
| Versioning | Hai khái niệm tách bạch (Mục 14); API test E/F/G/H/D kiểm; smoke thật chỉ có `1.0` (D-M6-11) |
| Unknown birth time | Là trạng thái suy giảm bình thường (API test C); KG-S4-06 giữ nguyên |
| Regression | Sprint 3 được bảo vệ bằng 189 unit + 25 golden + E2E; engine không bị sửa |
| Database | Migration additive; DB sạch → serve chart thật là việc Task 3 chứng minh (`UNVERIFIED` trước M6) |
| Build | CI #253 xanh trên HEAD hiện tại; M6 xác nhận ở commit cuối |
| Test | CI xanh; khoảng trống duy nhất đã xác định: không test đọc file nội dung thật (R5) |
| Documentation | Hai tài liệu mâu thuẫn (REST §12.4, §5.5 grammar), CHANGELOG chưa có `0.4.0`; được xử lý ở Task 6 |

Không có blocker. Điểm cần chú ý nhất: CI hiện không bảo vệ nội dung thật; smoke test cần môi trường Docker của owner.

## 41. Final Recommendation

`READY FOR IMPLEMENTATION`
