# Sprint 4 M1 — Exit Criteria Evidence Matrix

**Vị trí đề xuất:** `docs/implementation/Sprint_4_M1_Exit_Criteria_Evidence_Matrix.md`
**Phạm vi:** Sprint 4 M1 — Interpretation Persistence Foundation (Schema, Migration & Repository)
**Commit được review:** `d9ff172` (nhánh `dev`); chuỗi M1: `02cd93a` → `7665aef` → `d9ff172`
**Phiên bản tài liệu:** v2 — đã cập nhật theo log của owner (`Sprint4_M1_Logs.md`) và CI run #225
**Đối chiếu với:** `Sprint_4_M1_Interpretation_Persistence_Foundation_Plan.md` (Mục 25 Acceptance, Mục 26 Exit Criteria, Mục 28 Evidence Matrix)

## 0. Kết luận

**`PASS WITH KNOWN GAPS` — M1 có thể đóng.**

- Toàn bộ điều kiện đóng đã đề ra ở bản v1 (mục 1–4, cộng bước khuyến nghị về DB có dữ liệu) đều có log thật và đều PASS: `prisma generate`/`validate`, `prisma:deploy`, `npm test` (95 file, 599 test), `typecheck`, `build`.
- CI backend của `d9ff172` (run #225, workflow `backend-ci.yml`) có trạng thái **Success** (2m 3s). Mình chỉ đọc được trang tóm tắt; log từng bước cần đăng nhập GitHub nên không xem được, và trang chỉ ghi nhận 3 warning `jwt-token.adapter.ts` có sẵn từ trước.
- Không còn mục nào FAIL. Các mục chưa có bằng chứng chạy thật (`migrate diff`, `prisma:seed`) và các lỗi tài liệu nhỏ được ghi thành Known Gap ở Mục 4. Không gap nào chặn M2.

## 1. Nguồn bằng chứng

| Ký hiệu | Ý nghĩa |
|---|---|
| **[C-run]** | Claude chạy lệnh thật trong sandbox trên bản clone `dev` tại `d9ff172` (Node v22.22.2, npm 10.9.7, `npm ci` thành công) |
| **[C-static]** | Claude đọc code, SQL, diff hoặc grep; không phải kết quả thực thi |
| **[Owner]** | Log do project owner chạy và cung cấp (`Sprint4_M1_Logs.md`) |
| **[CI]** | Trang tóm tắt GitHub Actions run #225 (`d9ff172`), do Claude đọc; log từng bước không xem được (cần đăng nhập) |

Trạng thái cho phép: `PASS`, `FAIL`, `PARTIAL`, `UNVERIFIED`, `NOT APPLICABLE`, `DEFERRED`.

## 2. Evidence Matrix

| ID | Tiêu chí | Lệnh / cách kiểm | Trạng thái | Bằng chứng và ghi chú |
|---|---|---|---|---|
| EV-01 | `prisma generate` + `validate` | `npm run prisma:generate`, `npx prisma validate` | **PASS** | [Owner] Generated Prisma Client v5.22.0; "The schema at prisma\schema.prisma is valid". (Claude không chạy được trong sandbox do tải engine bị 403) |
| EV-02 | `prisma:deploy` trên DB sạch | `npx prisma migrate reset --force --skip-seed` | **PASS** | [Owner] DB `test`: áp dụng đủ 5 migration, gồm `20261004120000_init_interpretation_content_bank`, "Database reset successful". [C-static] SQL đúng thứ tự plan. [CI] run #225 Success; `backend-ci.yml` có bước `prisma:deploy`. Lưu ý: log của owner dùng `migrate reset`, không phải lệnh `prisma:deploy` trên DB sạch theo đúng chữ của plan; hai lệnh áp dụng cùng chuỗi migration nên mình coi là tương đương |
| EV-03 | Deploy trên DB có sẵn chart, `charts` không đổi | `npm run prisma:deploy` trên DB dev | **PASS** | [Owner] `astrology.charts`: 1 dòng trước, 1 dòng sau; "Applying migration `20261004120000_init_interpretation_content_bank`" thành công. [C-static] migration không đụng `charts`. Giới hạn: mẫu chỉ có 1 chart; không kiểm tra riêng việc chart cũ đọc ra `snapshotInterpretationVersion = null` trên DB dev (được test repository phủ ở EV-07) |
| EV-04 | Tên constraint/index và `vi` tồn tại | test introspection `pg_constraint`/`pg_indexes` | **PASS** | [C-static] 10 tên trong SQL khớp Mục 11 plan. [Owner] `npm test` 95/95 file pass, gồm file test provider có case introspection và case `vi`. Log không liệt kê kết quả từng file, nên kết luận dựa vào việc cả bộ pass; [CI] cũng Success |
| EV-05 | `migrate diff` chỉ drift đã tài liệu | `npx prisma migrate diff` | **UNVERIFIED** | Không có trong log của owner. Rủi ro thấp: `prisma validate` và deploy đều sạch, `prisma/README.md` đã cảnh báo drift. Ghi thành KG-M1-05 |
| EV-06 | Integration test provider | `npm test` | **PASS** | [C-static] file có 22 case `it`, phủ đủ Mục 18 plan (gồm `AngleInSign`, COALESCE duplicate, FK, stub DB failure → `InfrastructureError`, `vi` còn sau `clearDatabase()`). [Owner] `npm test`: 95 file, 599 test, tất cả pass (157.82s). [CI] Success |
| EV-07 | Roundtrip `snapshotInterpretationVersion` | `npm test` | **PASS** | [C-run] `chart.entity.test.ts` 14/14 pass (2 case mới). [Owner] case roundtrip qua DB trong `prisma-chart.repository.test.ts` (lưu `'1.0'` và `null`, đọc lại) nằm trong bộ 599 test pass |
| EV-08 | Regression toàn bộ test | `npm test` | **PASS** | [Owner] 95/95 file, 599/599 test pass. Ba test fail trong sandbox của Claude (`Prisma.Decimal is not a constructor`) là do sandbox thiếu Prisma client, không tái hiện trên máy owner và CI |
| EV-09a | Format | `npx prettier --check .` | **PASS** | [C-run] exit 0: "All matched files use Prettier code style!" |
| EV-09b | Lint | `npx eslint . --ext .ts` | **PASS** | [C-run] exit 0; 0 error, 3 warning `import/no-named-as-default-member` trong `jwt-token.adapter.ts` (có sẵn từ trước, ngoài M1) |
| EV-09c | Typecheck | `npm run typecheck` | **PASS** | [Owner] `tsc --noEmit` kết thúc không in lỗi. Log không hiển thị exit code. (Trong sandbox của Claude có 42 lỗi do thiếu Prisma client, không dùng làm bằng chứng) |
| EV-09d | Build | `npm run build` | **PASS** | [Owner] `tsc -p tsconfig.json` kết thúc không in lỗi (cùng lưu ý về exit code) |
| EV-10 | `prisma:seed` vẫn chạy | `npm run prisma:seed` | **UNVERIFIED** | Không có trong log (owner dùng `--skip-seed`). [C-static] `prisma/seed.ts` không bị sửa trong M1, nên rủi ro thấp. Ghi thành KG-M1-05 |
| EV-11 | Ranh giới kiến trúc | grep | **PASS** | [C-static] không có `@prisma`/`express`/`infrastructure` trong `chart/domain/**`; không raw SQL trong provider; không có module `interpretation` (`src/modules`: `birth-profile`, `chart`, `identity`); không wiring trong `composition-root.ts`; port chỉ có hàm đọc, `insertMany` chỉ ở class Prisma |
| EV-12 | Cập nhật tài liệu (Mục 24 plan) | diff | **PARTIAL** | [C-static] đã có: `AngleInSign` trong CHECK (DB Spec), ghi chú seed `vi` trong migration, ghi chú `preferred_language`, `prisma/README.md`. Còn 2 lỗi nhỏ chưa sửa (HEAD vẫn là `d9ff172`): KG-M1-01, KG-M1-02 |
| EV-13 | Không TODO/FIXME trong phạm vi M1 | grep | **PASS** | [C-static] 0 kết quả trên port, types, provider, test, helper, migration |
| EV-14 | Hành vi `database.helper.ts` | đọc diff + test | **PASS** | Thêm `languages` vào danh sách giữ lại, `interpretation_contents` vẫn bị truncate; test `vi` còn sau `clearDatabase()` nằm trong bộ test pass (EV-06) |

## 3. Đối chiếu Acceptance Criteria (Mục 25 plan)

| # | Tiêu chí | Trạng thái |
|---|---|---|
| 1 | `languages` đúng spec §5.5 (3 cột) | PASS (static; deploy OK) |
| 2 | `interpretation_contents` đúng spec §5.13 (11 cột) | PASS (static; deploy OK) |
| 3 | Sau deploy DB sạch, `languages` có đúng một dòng `vi` | PASS (EV-02/04/06) |
| 4 | CHECK nhận `AngleInSign` và 6 giá trị của spec, từ chối giá trị khác | PASS |
| 5 | Đủ index/constraint đúng tên | PASS (EV-04) |
| 6 | FK và UNIQUE expression hoạt động | PASS (EV-06) |
| 7 | Deploy trên DB có chart không đổi `charts`; chart cũ đọc ra `null` | PASS (EV-03, EV-07) |
| 8 | Cột nullable; ghi/đọc lại `'1.0'` | PASS (EV-07) |
| 9 | Chart không truyền version lưu và đọc là `null` | PASS (EV-07) |
| 10 | Provider ghi/đọc fixture, lọc đúng | PASS (EV-06) |
| 11 | Không dòng → `[]`; lỗi DB → `InfrastructureError` | PASS (EV-06) |
| 12 | Helper giữ `languages`, vẫn truncate `interpretation_contents` | PASS (static + EV-06) |
| 13 | Test mới và test cũ đều pass | PASS (EV-08) |
| 14 | Không vi phạm ranh giới | PASS (EV-11) |

## 4. Known Gaps

| ID | Gap | Loại | Mức | Hành động |
|---|---|---|---|---|
| KG-S4-08 | `users.preferred_language` có trong DB Spec nhưng không có trong `schema.prisma`/migration; đã ghi chú vào DB Spec (A4) | Spec-code discrepancy, **deferred** (đã duyệt) | Thấp | Đưa vào Sprint 4 Known Gaps Registry khi đóng sprint; xem lại khi có multi-language |
| KG-M1-01 | DB Spec dùng nhãn "A4" cho ghi chú "`en` chưa seed", nhưng theo plan A4 là `preferred_language`; việc không seed `en` thuộc A1/FD7 | Tài liệu (nhãn sai) | Thấp | Sửa nhãn thành A1/FD7 trong ghi chú Seed Data |
| KG-M1-02 | Dòng Seed Data của DB Spec vẫn nói `house_systems` "cần seed script", trong khi `house_systems` đang được `INSERT` trong migration (tiền lệ mà A1 dựa vào) | Tài liệu (có sẵn từ trước, nay dễ gây hiểu nhầm) | Thấp | Sửa câu cho đúng thực tế |
| KG-M1-03 | `PrismaChartRepository` (4 chỗ) và `PrismaBirthProfileRepository` truyền `{ cause: error }` vào tham số `details`, trong khi chữ ký `InfrastructureError` là `(message, details, cause)`. `mapErrorToProblemDetails` xuất `details` (trừ `errors`) thành `metadata` trong response, nên nội dung lỗi Prisma (vd các trường `code`, `meta`) có thể xuất hiện trong body lỗi 500. Provider mới của M1 dùng đúng chữ ký | Nợ kỹ thuật có sẵn từ Sprint 3 và Sprint 2, **ngoài M1** | Thấp đến trung bình (đã xác nhận ở mã nguồn, **chưa** kiểm chứng response thật) | Kiểm tra bằng một request lỗi giả lập; sửa ở một chore riêng (nên trước M4, vì R3 để lỗi lookup lan thành 500) |
| KG-M1-05 | `prisma migrate diff` (EV-05) và `prisma:seed` (EV-10) chưa có bằng chứng chạy thật | Unverified, rủi ro thấp | Thấp | Owner chạy khi tiện; nếu không, giữ làm gap khi đóng Sprint 4 |
| KG-M1-04 | Partial index lookup trùng tiền tố với UNIQUE expression index | Trade-off đã duyệt (A3) | Không | Không cần làm gì |
| KG-S4-06 | Moon-in-sign khi thiếu giờ sinh (engine dùng 12:00 địa phương, không warning) | Technical debt đã duyệt, xử lý ở F5 | Thấp | Không thuộc M1 |

## 5. Điều kiện đóng M1 — đã đáp ứng

| Điều kiện (từ bản v1) | Kết quả |
|---|---|
| `prisma:generate` + `validate` | PASS (EV-01) |
| `prisma:deploy` trên DB sạch | PASS (EV-02) |
| `npm test` đầy đủ | PASS, 95/95 file, 599/599 test (EV-06/07/08) |
| `typecheck` + `build` | PASS (EV-09c/d) |
| Deploy trên DB có chart | PASS, `charts` 1 → 1 (EV-03) |
| CI xanh `d9ff172` | Success (run #225) |

**Quy tắc kết luận (đã đề ra ở v1):** mọi điều kiện PASS, không mục nào FAIL → M1 = `PASS WITH KNOWN GAPS`.

## 6. Việc còn lại sau khi đóng (không chặn)

- [ ] Sửa KG-M1-01 và KG-M1-02 trong `docs/database/Database_Design_Specification.md` (docs-only; đề xuất gộp vào commit tài liệu của M2)
- [ ] Đưa KG-S4-08, KG-M1-03, KG-M1-05 vào Sprint 4 Known Gaps Registry khi đóng sprint
- [ ] Xử lý KG-M1-03 trước M4
