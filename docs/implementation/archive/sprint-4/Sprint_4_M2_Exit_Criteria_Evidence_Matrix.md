# Sprint 4 M2 — Exit Criteria Evidence Matrix

**Vị trí đề xuất:** `docs/implementation/Sprint_4_M2_Exit_Criteria_Evidence_Matrix.md`
**Phạm vi:** Sprint 4 M2 — Interpretation Domain Foundation
**Commit được review:** `aec6d29` (HEAD của `dev`); chuỗi M2: `3923397` → `48a252a` → `e404c9c` → `9304e49` → `aec6d29`
**Đối chiếu với:** `Sprint_4_M2_Interpretation_Domain_Foundation_Plan.md` v1.1 (Mục 26 Acceptance, Mục 27 Exit Criteria, Mục 29 Evidence Matrix)

## 0. Kết luận

**`PASS WITH KNOWN GAPS` — M2 có thể đóng.**

- Mã nguồn khớp plan: không có sai lệch về hành vi. Cả 3 task đã được thực hiện; 14/14 Acceptance Criteria đạt (Mục 3).
- CI backend của HEAD `aec6d29` (run #231) có trạng thái **Success**; workflow chạy `Lint and Format Check`, `Generate OpenAPI`, `Typecheck`, `test:coverage` (toàn bộ), `Build`.
- **Lưu ý về log của owner:** `Sprint4_M2_Logs.md` phản ánh trạng thái **trước** commit cuối `aec6d29` (xem Mục 5). Vì vậy log đó không phải bằng chứng cho HEAD. Bằng chứng cho HEAD là CI #231 và các lệnh Claude chạy trực tiếp trên HEAD (Mục 1). Kết luận không đổi, nhưng nên có thêm một log `npm test` trên HEAD để hồ sơ sprint khớp commit.
- Không có mục FAIL. Các gap ở Mục 4 đều mức thấp, không chặn M3.

## 1. Nguồn bằng chứng

| Ký hiệu | Ý nghĩa |
|---|---|
| **[C-run]** | Claude chạy lệnh thật trong sandbox trên bản clone `dev` tại `aec6d29` (Node v22, `npm ci` thành công). Sandbox không tải được Prisma engine nên **không** chạy được `typecheck`/`build` toàn dự án và test tích hợp |
| **[C-static]** | Claude đọc mã nguồn, diff, grep |
| **[Owner]** | `Sprint4_M2_Logs.md`, ở trạng thái **trước** `aec6d29` |
| **[CI]** | Trang tóm tắt GitHub Actions run #231 (`aec6d29`). Log từng bước cần đăng nhập nên Claude không xem được |

Trạng thái: `PASS`, `FAIL`, `PARTIAL`, `UNVERIFIED`, `NOT APPLICABLE`, `DEFERRED`.

## 2. Evidence Matrix

| ID | Tiêu chí | Trạng thái | Bằng chứng và ghi chú |
|---|---|---|---|
| EV-M2-00 | M1 tiền đề còn nguyên | **PASS** | Evidence Matrix M1 v2; không file nào trong `prisma/**`, `infrastructure/`, `presentation/`, `use-cases/`, `domain/engine/`, `composition-root.ts` bị sửa từ `d9ff172` (`git diff --name-only` + grep: 0 kết quả) |
| EV-M2-01 | Test unit M2 | **PASS** | [C-run] trên HEAD: `derive` 11, `interpretation-subject-key` 33, `content-version` 40, `enumerate-mvp-subjects` 5 = **89 test**; thêm `chart.errors.test.ts` 10 test; tổng 5 file / **99 test pass**. [Owner] (trạng thái cũ): 4 file / 81 test pass |
| EV-M2-02 | Hồi quy `npm test` toàn bộ | **PASS** | [Owner] 99 file / 682 test pass (trạng thái trước `aec6d29`, gồm test tích hợp và E2E pipeline). [CI] #231 Success trên HEAD (chạy `test:coverage` toàn bộ). Chưa có log `npm test` trên HEAD |
| EV-M2-03 | Lint | **PASS** | [C-run] `eslint src/modules/chart/domain tests/unit/modules/chart/domain`: exit 0. [Owner] `npm run lint`: 0 error, 3 warning `jwt-token.adapter.ts` có từ Sprint trước. [CI] bước Lint Success |
| EV-M2-04 | Typecheck | **PASS** | [Owner] `npm run typecheck` sạch (trước `aec6d29`). [CI] bước Typecheck Success trên HEAD. [C-run] không dùng được (thiếu Prisma client); không có lỗi TS nào nằm trong `chart/domain` |
| EV-M2-05 | Format | **PASS** | [C-run] `prettier --check` trên `src/modules/chart/domain` và `tests/unit/modules/chart/domain`: không có cảnh báo. [Owner] "All matched files use Prettier code style!" (trước `aec6d29`). [CI] bước Format Success |
| EV-M2-06 | Build | **PASS** | [Owner] `npm run build` sạch (trước `aec6d29`). [CI] bước Build Success trên HEAD |
| EV-M2-07 | Ranh giới kiến trúc | **PASS** | [C-static] grep `@prisma\|express\|infrastructure\|application/` trong `domain/interpretation/` và `types/interpretation.types.ts`: 0 kết quả; không có module `interpretation` cấp cao; ESLint `boundaries/dependencies` pass |
| EV-M2-08 | TODO/FIXME | **PASS** | [C-static] 0 kết quả trong src và test của M2 |
| EV-M2-09 | Tài liệu (Mục 25 plan) | **PASS** | [C-static] DB Spec: thêm grammar `subject_key`; sửa KG-M1-01 (nhãn A1/FD7) và KG-M1-02 (dòng Seed Data); Architecture Spec: adapter ghi `PrismaInterpretationContentProvider` (KG-M2-01 đã xử lý) |
| EV-M2-10 | Không đổi Prisma/engine/presentation | **PASS** | Xem EV-M2-00 |
| EV-M2-11 | Thay đổi M2 chỉ nằm trong `chart/domain` + test + tài liệu | **PASS** | `git diff --stat d9ff172..HEAD`: 4 file `interpretation/`, `types/`, `errors/`, `ports/` (chỉ JSDoc), 5 file test, 3 tài liệu |

## 3. Đối chiếu Acceptance Criteria (Mục 26 plan)

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | 7 loại subject trong từ vựng; logic chỉ cho 3 loại MVP | PASS | `INTERPRETATION_SUBJECT_TYPES` (M1) giữ nguyên; validator trả `false` cho 4 loại dành riêng (test `Aspect`, `PatternType`) |
| 2 | Grammar tập trung một file, ví dụ đúng | PASS | `interpretation-subject-key.ts` (builder + validator dựng regex từ hằng); test 8 ca hợp lệ và 16 ca không hợp lệ |
| 3 | 21 subject cho chart đầy đủ, đúng thứ tự | PASS | Test `derive` "21 subjects in correct order" |
| 4 | `PlanetInHouse` khi có nhà; `house = null` bỏ qua riêng | PASS | Test `null house` và `house 12` |
| 5 | Ascendant theo dữ liệu angle; không có nhà → chỉ 10 `PlanetInSign`, không ném lỗi | PASS | Test `isHouseDataAvailable = false`; derive dựa vào `angles.find('Ascendant')` |
| 6 | Cùng đầu vào (kể cả xáo trộn) → cùng dãy | PASS | Test "regardless of input array order"; thứ tự do cấu trúc vòng lặp theo `MVP_INTERPRETATION_PLANETS` |
| 7 | `compareContentVersion` thuần, đúng bảng ví dụ, ném lỗi cho version sai | PASS | 40 test; gồm `'1'`=`'1.0'`, `1.9` < `1.10`, đoạn dài 17 chữ số; commit cuối bỏ `trim()` nên khớp plan (không chấp nhận khoảng trắng) |
| 8 | Port ở `chart/domain/ports/`, không phụ thuộc Prisma, hợp đồng rỗng vs lỗi, chữ ký không đổi | PASS | Diff port chỉ là JSDoc; chữ ký hai phương thức không đổi |
| 9 | Test M2 + lint + typecheck + format + build pass | PASS | EV-M2-01, 03–06 |
| 10 | Không vi phạm ranh giới | PASS | EV-M2-07 |
| 11 | Test cũ (M1, Sprint 3) vẫn pass | PASS | EV-M2-02 (kèm lưu ý log cũ) |

Ba Open Question đã được owner chốt đúng đề xuất: O-M2-1 (`'1'` = `'1.0'`), O-M2-2 (`house = null` → bỏ qua; số ngoài 1..12 → ném `InvalidInterpretationSubjectKeyError`), O-M2-3 (252 subject nằm trong M2). Cả ba đã có test.

## 4. Known Gaps

| ID | Gap | Loại | Mức | Hành động đề xuất |
|---|---|---|---|---|
| KG-M2-02 | `MVP_INTERPRETATION_SUBJECT_TYPES` và `MvpInterpretationSubjectType` được export nhưng **không dùng trong mã production**; chỉ có một test khẳng định giá trị của chính hằng đó. Thứ tự derive thực tế do cấu trúc vòng lặp quyết định, nên hằng này không bảo vệ thứ tự như plan mô tả (Mục 11) | Mã thừa / thiết kế chưa chặt | Thấp | Chọn một: (a) dùng nó làm nguồn thứ tự trong `derive`/`enumerate`, hoặc (b) xoá cùng test tự-tham-chiếu. Có thể làm cùng M3 nếu M3 cần hằng này |
| KG-M2-03 | Test `derive` dùng mock `as any` (19 chỗ trong file này, 30 chỗ trên 3 file) cho `Planet`/`Angle`, nên không kiểm chứng với getter của entity thật; chỉ một ca dùng `Chart.create` thật. ESLint cho phép `any` trong test | Chất lượng test | Thấp | Chấp nhận ở M2; nếu muốn, thêm 1–2 ca dùng `Planet.create`/`Angle.create` cho hành tinh lệch cung và Ascendant |
| KG-M2-04 | Commit `3923397` (loại `feat`) **xoá** `docs/implementation/Sprint_4_M1_Interpretation_Persistence_Foundation_Plan.md` mà không có bản lưu trữ; `docs/implementation/archive/` hiện chỉ có `sprint-3`, `sprint-f2`, `sprint-f3`. Evidence Matrix M1 (v2) và M2 (file này) cũng chưa nằm trong repo | Tài liệu | Thấp | Khôi phục M1 plan và thêm hai Evidence Matrix vào `docs/implementation/archive/sprint-4/` khi đóng Sprint 4 (theo tiền lệ Sprint 3/F2/F3) |
| KG-M2-05 | Plan M2 trong repo ghi Final Recommendation là `READY`, trong khi prompt yêu cầu đúng một trong `READY FOR IMPLEMENTATION` / `CONDITIONALLY READY` / `NOT READY` | Tài liệu (nhãn) | Rất thấp | Sửa thành `READY FOR IMPLEMENTATION` |
| KG-M2-06 | Log owner cho M2 phản ánh trạng thái trước `aec6d29` (81 test M2, 99 file / 682 test toàn bộ), trong khi HEAD có 89 test M2 | Hồ sơ bằng chứng | Thấp | Chạy lại `npm test` trên HEAD và lưu log vào hồ sơ sprint (không chặn) |
| (kế thừa) | KG-S4-06 (Moon khi thiếu giờ sinh), KG-S4-08 (`preferred_language`), KG-M1-03 (`{ cause }` truyền vào `details` ở Sprint 2–3, cần xử lý trước M4), KG-M1-05 (`migrate diff`, `prisma:seed` chưa có log) | Như đã ghi | Như đã ghi | Đưa vào Sprint 4 Known Gaps Registry khi đóng sprint |

**Đã đóng nhờ M2:** KG-M1-01, KG-M1-02 (sửa tài liệu), KG-M2-01 (tên adapter trong Architecture Spec).

**Ghi nhận chủ động:** `derive` bỏ qua im lặng hành tinh MVP bị thiếu và dùng lần xuất hiện đầu nếu trùng tên — đúng thiết kế đã duyệt (Chart không đảm bảo đủ 10 hành tinh MVP hay tên duy nhất); domain không có logger nên M4 là nơi ghi log nếu cần. Đây không phải gap.

## 5. Phát hiện về log của owner

Bằng chứng: số test trong `Sprint4_M2_Logs.md` là `derive` 7, `key` 33, `content-version` 37, `enumerate` 4 (tổng 81). Commit cuối `aec6d29` đã thêm test vào ba trong bốn file đó (`derive` +4, `content-version` +3, `enumerate` +1). Trên HEAD, chạy thật cho `derive` 11, `key` 33, `content-version` 40, `enumerate` 5 (tổng 89). Nghĩa là log của owner được chạy trên commit trước `aec6d29`.

Tác động: các lệnh `lint`/`typecheck`/`format:check`/`build` trong log đó cũng ứng với trạng thái cũ. Commit cuối chỉ đổi cách dựng regex (đưa ra hằng module), bỏ `trim()` ở `content-version.ts`, thêm test và sửa tài liệu, rủi ro thấp; CI #231 trên HEAD đã xác nhận Success. Vì vậy kết luận không bị ảnh hưởng.

## 6. Việc cần làm trước/khi đóng (nhỏ, không chặn M3)

- [ ] (Khuyến nghị) Chạy `npm test` trên HEAD, lưu log (KG-M2-06)
- [ ] Sửa nhãn `READY` thành `READY FOR IMPLEMENTATION` trong plan M2 (KG-M2-05)
- [ ] Quyết định KG-M2-02 (dùng hay xoá `MVP_INTERPRETATION_SUBJECT_TYPES`), nên chốt trước khi M3 import hằng này
- [ ] Khôi phục M1 plan và lưu hai Evidence Matrix vào `archive/sprint-4/` khi đóng Sprint 4 (KG-M2-04)
- [ ] Đưa KG-S4-06, KG-S4-08, KG-M1-03, KG-M1-05 vào Known Gaps Registry của Sprint 4
