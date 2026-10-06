# Sprint 4 M3 — Exit Criteria Evidence Matrix

**Vị trí đề xuất:** `docs/implementation/archive/sprint-4/Sprint_4_M3_Exit_Criteria_Evidence_Matrix.md` (cùng thư mục với M1 và M2)
**Phạm vi:** Sprint 4 M3 — Interpretation Infrastructure & Content Pipeline
**Commit được review:** v1: `46586b4`; **v2: `db4a008` (HEAD)**; chuỗi M3: `fddb951` → `7569f62` → `46586b4` → `1a211dc` (revert `seed.ts`, vá gap) → `db4a008` (nội dung 252 mục)
**Phiên bản tài liệu:** v2 — thêm Mục 7 (đóng gap sau review v1, nội dung 252 mục). Mục 0–6 giữ nguyên làm lịch sử của v1
**Đối chiếu với:** `Sprint_4_M3_Interpretation_Infrastructure_Content_Pipeline_Plan.md` v1.1 (Mục 27 Acceptance, Mục 28 Exit Criteria, Mục 30 Evidence Matrix)

## 0. Kết luận

**`PASS WITH KNOWN GAPS` — M3 có thể đóng.**

- Provider không bị đổi (đúng D-M3-01), không wiring `composition-root.ts` (đúng O-M3-4), không chạm `domain/**`, `prisma/migrations`, `schema.prisma`, `seed.config.ts`, `tsconfig*`, port. Validator, seeder, CLI, script và file mẫu đều có mặt và khớp thiết kế. 16/16 Acceptance Criteria đạt (Mục 3), kèm hai lệch nhỏ về mã issue và việc cắt khoảng trắng (KG-M3-03, KG-M3-04).
- CI backend của HEAD `46586b4` (run #236) có trạng thái **Success** (1m 44s), cùng commit với log của owner (tổng 101 file / 719 test khớp HEAD).
- **Một sai lệch so với quyết định đã chốt cần owner xử lý:** commit `7569f62` sửa `prisma/seed.ts` để tự seed file mẫu mỗi lần `prisma db seed` / `db:reset`. Plan v1.1 ghi rõ `seed.ts` nằm trong danh sách "không được chạm" và D-M3-11 quy định seed nội dung là lệnh riêng. Đây không làm hỏng tiêu chí nào nhưng trái quyết định chưa được sửa chính thức (KG-M3-02).
- Không có mục FAIL. Mọi gap ở Mục 4 đều mức thấp đến trung bình, không chặn M4. Nội dung production 252 mục vẫn là phụ thuộc của owner cho M6.

## 1. Nguồn bằng chứng

| Ký hiệu | Ý nghĩa |
|---|---|
| **[C-run]** | Claude chạy lệnh thật trong sandbox trên bản clone `dev` tại `46586b4`. Sandbox không tải được Prisma engine nên không chạy được test tích hợp, `typecheck`/`build` toàn dự án |
| **[C-static]** | Claude đọc mã nguồn, diff, grep |
| **[Owner]** | `Sprint4_M3_Logs.md`. Log không in exit code; việc exit code bằng 0 là lời owner xác nhận, được củng cố bởi nội dung log (không có lỗi) và CI Success |
| **[CI]** | Trang tóm tắt GitHub Actions run #236 (`46586b4`). Log từng bước cần đăng nhập nên Claude không xem được |

Trạng thái: `PASS`, `FAIL`, `PARTIAL`, `UNVERIFIED`, `NOT APPLICABLE`, `DEFERRED`.

## 2. Evidence Matrix

| ID | Tiêu chí | Trạng thái | Bằng chứng và ghi chú |
|---|---|---|---|
| EV-M3-00 | M1/M2 tiền đề còn nguyên | **PASS** | Evidence Matrix M1 v2 và M2 (đã nằm trong `archive/sprint-4/`); `git diff aec6d29..HEAD` không chạm `domain/**`, `prisma/migrations`, `schema.prisma`, `seed.config.ts`, `tsconfig*`, `composition-root.ts`, provider, port (0 kết quả) |
| EV-M3-01 | Hồi quy M1 | **PASS** | [Owner] `npm test`: 101 file / 719 test pass, gồm `prisma-interpretation-content.provider.test.ts` 22 test. [CI] #236 Success |
| EV-M3-02 | Hồi quy M2 | **PASS** | Như EV-M3-01; [C-run] test M2 vẫn xanh ở M2; không file `domain/**` bị sửa |
| EV-M3-03 | Provider với dữ liệu seed | **PASS** | [Owner] `interpretation-content.seeder.test.ts` 12 test pass: seed `Published` 252 dòng rồi `provider.findPublishedContents` trả đủ 252; ba subject đại diện; ngôn ngữ thiếu, version thiếu/nhiều version, `Draft` → rỗng. [CI] Success |
| EV-M3-04 | Validator | **PASS** | [C-run] `validator.test.ts` **17 test pass** trên HEAD. [Owner] log ghi "(20 tests)" nhưng tổng 719 chỉ khớp 17: xem Mục 5 |
| EV-M3-05 | Clean DB: migration | **PASS** | [Owner] `npm run db:reset -- --force` trên DB `test`: áp dụng đủ 5 migration, "Database reset successful". Lệnh khác với plan (`migrate reset --force --skip-seed` ở Mục 18) vì có chạy seed; cùng chuỗi migration |
| EV-M3-06 | Seed thực thi | **PARTIAL** | [Owner] `db:reset` chạy seed, in "Outcome: inserted, Count: 3". **Đây là đường `prisma/seed.ts`, không phải CLI `prisma:seed:content`** theo plan. Chưa có log chạy lại để thấy `unchanged`, và chưa có log chạy CLI `npm run prisma:seed:content` trên DB (bước 5–7 Mục 18). [C-run] ba nhánh CLI không cần DB: mẫu `--validate-only` exit 0 "Coverage 3/252"; file thiếu (đường mặc định) exit 1 kèm ghi chú phụ thuộc owner; mẫu đổi thành `Published` exit 1 với `PLACEHOLDER_CONTENT` ×3 và `INCOMPLETE_PUBLISHED_CONTENT`. Tính idempotent được phủ bởi test tích hợp (EV-M3-11) |
| EV-M3-07 | Provider lookup | **PASS** | EV-M3-03 |
| EV-M3-08 | Từ chối nội dung sai | **PASS** | [C-run] unit test validator 17/17 pass; [C-run] CLI từ chối file Published chứa placeholder, exit 1, **trước khi mở kết nối DB** |
| EV-M3-09 | Phát hiện trùng | **PASS** | Test `DUPLICATE_SUBJECT` (17/17) |
| EV-M3-10 | Bao phủ subject | **PASS** | Test Published đủ 252 → ok; thiếu → `INCOMPLETE_PUBLISHED_CONTENT`; Draft thiếu → ok; `UNEXPECTED_SUBJECT` |
| EV-M3-11 | Seeder: unchanged / thăng hạng / từ chối | **PASS** | [Owner] test tích hợp: seed hai lần → `unchanged`; Draft thay Draft; Draft → Published; từ chối ghi đè và hạ cấp `Published`; va chạm `'1'` vs `'1.0'`; thiếu `vi` |
| EV-M3-12 | Typecheck | **PASS** | [Owner] `tsc --noEmit` không in lỗi; [CI] Success. Lưu ý phạm vi: `typecheck` chỉ gồm `src/` (KG-M3-01) |
| EV-M3-13 | Lint | **PASS** | [C-run] `eslint` trên `src/.../infrastructure/content`, `prisma`, hai thư mục test mới: exit 0. [Owner] 0 error, 3 warning `jwt-token.adapter.ts` có từ Sprint trước. [CI] Success |
| EV-M3-14 | Format | **PASS** | [C-run] `prettier --check` trên các thư mục M3: sạch. [Owner] sạch. [CI] Success |
| EV-M3-15 | Build | **PASS** | [Owner] `tsc -p tsconfig.json` sạch; [CI] Success |
| EV-M3-16a | Không `fs`/`path` trong `infrastructure/content/` | **PASS** | [C-static] grep: 0 kết quả (chỉ `prisma/seed-content.ts` và `prisma/seed.ts` dùng `fs`) |
| EV-M3-16b | Không `@prisma` trong `domain/` | **PASS** | [C-static] grep: 0 kết quả |
| EV-M3-16c | Không phụ thuộc AI | **PASS** | [C-static] grep `openai\|anthropic` trong `src`, `package.json`, `prisma`: 0 kết quả |
| EV-M3-16d | Không TODO/FIXME | **PASS** | [C-static] 0 kết quả trong file M3 và test M3 |
| EV-M3-17 | Nội dung production 252 mục | **DEFERRED** | Không có `interpretations.vi.json` trong repo (đúng O-M3-1); owner cung cấp cho M6 |

## 3. Đối chiếu Acceptance Criteria (Mục 27 plan)

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Provider vẫn implement port; file production không đổi | PASS | EV-M3-00 |
| 2 | Tra cứu chính xác theo type/key/language/version | PASS | EV-M3-03 |
| 3 | `vi` hoạt động; version khác → `[]`; chỉ `Published`; thiếu → `[]` | PASS | EV-M3-03 |
| 4 | Lỗi hạ tầng vẫn truyền lên | PASS | Test M1 (stub) còn xanh, provider không đổi |
| 5 | Prisma chỉ ở `infrastructure/`; `domain/**` không đổi | PASS | EV-M3-00, EV-M3-16b |
| 6 | Validator phát hiện cấu trúc, header, type, key, trùng, thiếu/dư, language/status/version, nhà sai, nội dung rỗng | PASS có lệch nhỏ | Phát hiện đủ; riêng status lạ/`Archived` ra `SCHEMA_ERROR` thay vì `INVALID_STATUS` của plan (KG-M3-04); nhà sai được bắt qua `isValidInterpretationSubjectKey` nhưng test của M3 không có ca `House_0/13` riêng (đã có ở test M2) |
| 7 | Không có danh sách 252 key hay grammar thứ hai | PASS | [C-static] validator chỉ gọi `enumerateMvpInterpretationSubjects`, `isValidInterpretationSubjectKey`, `isValidContentVersion`; không có regex mới |
| 8 | `MVP_INTERPRETATION_SUBJECT_TYPES` được validator dùng | PASS | [C-static] import và dùng trong validator. Đóng KG-M2-02 |
| 9 | Nội dung không hợp lệ không tới DB | PASS | CLI validate trước, chưa mở kết nối (đọc mã và [C-run] ba nhánh) |
| 10 | DB sạch seed được; chạy lại không tạo trùng | PASS | EV-M3-06 (seed), EV-M3-11 (`unchanged`) |
| 11 | `Published` không bị ghi đè/hạ cấp; `Draft` thay thế được | PASS | EV-M3-11 |
| 12 | CLI exit khác 0 khi file thiếu/sai/xung đột; `--validate-only` không cần DB | PASS có giới hạn | [C-run] thiếu file và sai nội dung → exit 1, `--validate-only` → exit 0 không DB. Nhánh xung đột (`ContentSeedConflictError`) trong CLI chưa chạy thật; logic seeder được test tích hợp |
| 13 | Test tích hợp seed → provider pass; M1/M2 vẫn xanh | PASS | EV-M3-01..03 |
| 14 | lint/typecheck/format/build pass; không TODO/FIXME | PASS | EV-M3-12..16d |
| 15 | Không phụ thuộc AI | PASS | EV-M3-16c |
| 16 | Nội dung production thiếu được ghi rõ là phụ thuộc owner | PASS có lỗi lời | `README` và thông báo CLI có ghi; lý do trong README là "copyright/size" (không đúng với quyết định O-M3-1): KG-M3-07 |

Bốn Open Question đã được owner chốt trong plan v1.1: O-M3-1 (chỉ file mẫu), O-M3-2 (`Published` bất biến), O-M3-3 (header `version, language, status, contentSource, items`, version `major.minor`), O-M3-4 (không wiring). Cả bốn khớp với mã.

## 4. Known Gaps

| ID | Gap | Loại | Mức | Hành động đề xuất |
|---|---|---|---|---|
| KG-M3-02 | `prisma/seed.ts` được sửa để seed file mẫu khi `prisma db seed`/`db:reset`, trái plan v1.1 ("không được chạm `seed.ts`", D-M3-11, `seed.ts` nằm ở danh sách chỉ-đọc). Hệ quả: (a) file mẫu có placeholder được ghi vào mọi DB mà `prisma db seed` chạy, kể cả môi trường production nếu lệnh được dùng ở đó; (b) lỗi seed nội dung bị `catch` rồi chỉ `console.error`, nên `db seed` vẫn thành công khi nội dung lỗi; (c) `seed.ts` giờ import `fs` và mã trong `src/`, trước đó tự chứa; (d) lặp lại logic validate + seed của CLI. Bằng chứng EV-M3-06 của owner dựa vào chính đường này | Sai lệch quyết định, chưa được duyệt | Trung bình | Chọn một: (a) **khuyến nghị** hoàn tác `seed.ts`, dùng `npm run prisma:seed:content -- --file …sample.json` làm bước chứng minh và chạy lại Mục 18 bước 4–7; hoặc (b) ghi chính thức D-M3-12 chấp nhận hành vi này, kèm sửa: bỏ qua khi `NODE_ENV=production`, và thoát khác 0 khi seed nội dung lỗi |
| KG-M3-03 | Schema dùng `z.string().trim().min(1)` cho `bodyText`: Zod **thay đổi giá trị** (cắt khoảng trắng đầu/cuối) trước khi ghi DB ([C-run]: `'  xin chào  '` → `'xin chào'`), trong khi plan Mục 14 ghi "nội dung không bị sửa khi ghi". Chỉ ảnh hưởng khoảng trắng biên; `unchanged` vẫn ổn định vì so sánh theo giá trị đã cắt | Lệch plan nhỏ | Thấp | Dùng `z.string().refine((v) => v.trim().length > 0)` (giữ nguyên giá trị) hoặc ghi nhận hành vi cắt khoảng trắng vào README |
| KG-M3-04 | Vệ sinh mã validator: khối `if` rỗng cùng chú thích kiểu ghi nháp (dòng ≈132–140, ≈183–188: "Wait,…", "I'll adjust…", "Actually…"); `UNEXPECTED_SUBJECT` bị cắt còn 5 issue dù plan nói gom toàn bộ (tổng số vẫn có trong `coverage.unexpected`); mã `INVALID_STATUS` trong plan không tồn tại (status lạ/`Archived` ra `SCHEMA_ERROR`); kiểu `InterpretationSubjectRef` khai báo lại trong validator trùng tên với kiểu domain của M1 nhưng khác độ chặt | Mã/chất lượng | Thấp | Xoá khối rỗng và chú thích nháp; đổi tên kiểu cục bộ (vd `ContentSubjectIdentity`); quyết định giữ `SCHEMA_ERROR` cho status và sửa plan, hoặc thêm `INVALID_STATUS` |
| KG-M3-05 | Test M3 thiếu so với Mục 20 plan: `Archived`/status lạ, `bodyText` chỉ khoảng trắng, nhà `0`/`13`, `Ascendant_in_Leo` dưới `PlanetInSign`, version `''`/`'v1.0'`/`'1.0.0'`; CLI không có test; chưa có ca seeder cho hàng cùng version có trạng thái hỗn hợp | Chất lượng test | Thấp | Bổ sung vài ca `it.each`; chấp nhận CLI chỉ kiểm bằng lần chạy thật |
| KG-M3-06 | Test tích hợp "Prerequisites" khôi phục hàng `vi` với `display_name: 'Vietnamese'`, trong khi migration seed `'Tiếng Việt'`. `clearDatabase()` giữ `languages`, nên sau test này DB test mang tên hiển thị khác với trạng thái migration (không ảnh hưởng test nhưng làm DB test lệch migration) | Test pollution | Rất thấp | Khôi phục bằng `'Tiếng Việt'`, hoặc dùng giá trị đọc trước khi xoá |
| KG-M3-07 | `prisma/README.md` ghi file production "KHÔNG được commit vì copyright/size", trong khi quyết định O-M3-1 là chưa có và do owner cung cấp (M6); và README mô tả `db:reset` tự seed file mẫu (hệ quả của KG-M3-02) | Tài liệu | Thấp | Sửa câu lý do; cập nhật nếu KG-M3-02 chọn hướng (a) |
| KG-M3-01 | CLI `prisma/seed-content.ts` nằm ngoài phạm vi `typecheck`/`build` (`tsconfig` chỉ gồm `src/`) | Khoảng trống có từ trước (đã dự báo ở plan) | Thấp | Giữ nguyên; logic ở `src/` đã được typecheck; CLI được ESLint và chạy thật [C-run] |
| KG-M3-08 | ~~Plan M1/M2 bị xoá chưa lưu trữ~~ **RÚT LẠI (v3):** theo quy ước của owner, implementation plan của từng milestone là blueprint tạm thời, xoá sau khi milestone đóng; chỉ Evidence Matrix được lưu vào `archive/sprint-4/`. Đây không phải gap | Quy ước (không phải gap) | — | Hành động còn lại duy nhất: lưu Evidence Matrix M3 này vào `archive/sprint-4/` (hiện mới có M1, M2) và xoá plan M3 sau khi M4 đóng |
| (kế thừa) | KG-S4-06 (Moon khi thiếu giờ sinh), KG-S4-08 (`preferred_language`), KG-M1-03 (`{ cause }` truyền vào `details` ở Sprint 2–3; **nên xử lý trước M4** vì R3 để lỗi lookup lan thành 500), KG-M1-05 (`prisma migrate diff` chưa có log), KG-M2-03 (mock `as any` ở test M2) | Như đã ghi | Như đã ghi | Đưa vào Sprint 4 Known Gaps Registry khi đóng sprint |

**Đã đóng nhờ M3:** KG-M2-02 (hằng `MVP_INTERPRETATION_SUBJECT_TYPES` nay có consumer production). **Đóng một phần:** KG-M1-05 — log M3 chứng minh `prisma db seed` chạy thành công ("The seed command has been executed"), còn `migrate diff` vẫn chưa có log.

## 5. Phát hiện về log của owner

Log ghi `interpretation-content.validator.test.ts (20 tests)`, nhưng trên HEAD file này có **17 test** ([C-run] 17 pass). Tổng 719 test khớp với 17: số test của HEAD trước M3 là 690 (682 ở log M2 cộng 8 test thêm ở `aec6d29`), cộng 17 + 12 = 719; nếu validator có 20 thì tổng phải là 722. Nhiều khả năng đây là gõ nhầm khi chép log, không phải chạy trên commit khác (số file 101 = 99 + 2 cũng khớp). Đề nghị owner xác nhận và sửa dòng này nếu log được lưu vào hồ sơ sprint.

Ngoài ra log không có exit code từng lệnh; kết luận dựa vào nội dung log sạch lỗi, lời xác nhận của owner và CI Success trên cùng commit.

## 6. Việc cần làm trước/khi đóng (không chặn M4)

- [ ] **Quyết định KG-M3-02** (hoàn tác hay chính thức hoá `seed.ts`); nếu hoàn tác, chạy lại và lưu log clean-DB bằng CLI (Mục 18 bước 4–7)
- [ ] Dọn validator (KG-M3-04) và quyết định `bodyText` có cắt khoảng trắng hay không (KG-M3-03)
- [ ] Sửa README (KG-M3-07), khôi phục `display_name` trong test (KG-M3-06)
- [ ] Xác nhận dòng "(20 tests)" trong log (Mục 5)
- [ ] Xử lý KG-M1-03 trước M4
- [ ] Khi đóng Sprint 4: lưu Evidence Matrix này vào `archive/sprint-4/`; **không** khôi phục plan M1/M2 (blueprint tạm thời, KG-M3-08 đã rút lại); đưa các gap kế thừa vào Known Gaps Registry


---

## 7. Cập nhật v2 — review `1a211dc` và `db4a008` (CI run #240)

### 7.0 Kết luận v2

**`PASS WITH KNOWN GAPS` — giữ nguyên, M3 đóng được; có hai điều kiện cần bổ sung trước khi coi nội dung production là "đã nghiệm thu" (7.3).**

- Tất cả gap nêu ở v1 đã được xử lý đúng hướng khuyến nghị (7.1). CI backend của HEAD `db4a008` (run #240) **Success** (2m 14s).
- File `interpretations.vi.json` đã có trong repo: `Published`, phiên bản `1.0`, **252/252 mục hợp lệ**. [C-run] `prisma:seed:content -- --validate-only` trên HEAD: "Validation passed! Coverage 252/252, Placeholder count 0", exit 0. Chưa có log seed file này vào DB sạch (7.3).
- Phát hiện mới ở nội dung và công cụ (7.2) là mức thấp đến trung bình; không cái nào làm hỏng tiêu chí kỹ thuật, nhưng hai cái cần owner quyết định.

### 7.1 Gap của v1 đã đóng

| Gap v1 | Kết quả | Bằng chứng |
|---|---|---|
| KG-M3-02 (`seed.ts`) | **ĐÓNG** | [C-static] `git diff aec6d29..HEAD -- prisma/seed.ts`: rỗng (đã hoàn tác hoàn toàn). README cập nhật: `db:reset` chỉ migrate + tạo Admin, seed nội dung bằng `npm run prisma:seed:content` |
| KG-M3-03 (Zod `trim`) | **ĐÓNG** | Schema dùng `refine((s) => s.trim().length >= 1)`, không còn đổi giá trị `bodyText` |
| KG-M3-04 (mã validator) | **ĐÓNG** | Đã xoá khối `if` rỗng và chú thích nháp; đổi tên kiểu thành `ContentSubjectRef`; `UNEXPECTED_SUBJECT` không còn cắt ở 5; thêm `INVALID_STATUS`; `EMPTY_BODY_TEXT` nhận diện qua `custom` |
| KG-M3-05 (test thiếu) | **ĐÓNG MỘT PHẦN** | Thêm 3 test (nhà `0`/`13`, `Ascendant_in_Leo` dưới `PlanetInSign`, `INVALID_STATUS` gồm `Archived`) → validator **20 test** ([C-run] 20/20 pass). Còn thiếu: `bodyText` toàn khoảng trắng và version `''`/`'v1.0'`/`'1.0.0'` không có ca riêng ở M3 (đã có ở test `content-version` của M2) |
| KG-M3-06 (`display_name`) | **ĐÓNG** | Khôi phục `'Tiếng Việt'` |
| KG-M3-07 (README) | **ĐÓNG** | Lý do file production sửa thành "sẽ cung cấp ở M6"; mô tả `db:reset` đã đúng |
| EV-M3-04 (log "20 tests") | **CHƯA GIẢI THÍCH ĐƯỢC** | Ở `46586b4` validator có 17 test; ở `db4a008` có 20 (sau khi thêm 3 test). Log M3 của owner ghi 20 test nhưng tổng 719 khớp với 17, không khớp với 20 (nếu cơ sở là 690 thì 20 + 12 sẽ cho 722). Không xác định được log ứng với commit nào hoặc working tree nào. Không ảnh hưởng kết luận (CI #236 và #240 đều Success), nhưng hồ sơ sprint nên dùng log chạy lại trên `db4a008` (7.3) |

**Chưa đóng (không đổi so với v1):** KG-M3-01 (CLI ngoài `typecheck`), KG-M3-08 (đã rút lại: plan là blueprint tạm thời; thư mục hiện có hai Evidence Matrix và hai plan còn lại ở `docs/implementation/`: Sprint 4 Implementation Plan và M3 Plan), cùng các gap kế thừa (KG-S4-06, KG-S4-08, KG-M1-03, KG-M1-05, KG-M2-03).

### 7.2 Phát hiện mới

| ID | Phát hiện | Mức | Đề xuất |
|---|---|---|---|
| KG-M3-09 | **Còn tham chiếu tới file mẫu đã xoá.** Commit `db4a008` xoá `interpretations.vi.sample.json`, nhưng `prisma/seed-content.ts` (thông báo lỗi khi thiếu file, dòng 34) và `prisma/README.md` (dòng 45) vẫn hướng dẫn dùng nó; các tài liệu plan M3 cũng còn nhắc | Thấp | Sửa thông báo CLI và README: bỏ phần "sample", hoặc khôi phục sample |
| KG-M3-10 | **`scripts/generate-interpretations.ts` không tái lập được và mâu thuẫn với file đã commit.** Script đọc `scripts/data/{planets,ascendant,houses1,houses2}.json` — thư mục `scripts/data/` **không có trong repo**, nên chạy lại sẽ ghi toàn bộ phần thiếu thành `[OWNER_CONTENT_REQUIRED]`. Script còn ghi `contentSource: 'Hybrid'` và nhúng sẵn 12 đoạn Mặt Trời, trong khi file JSON đã commit ghi `contentSource: 'HumanAuthored'`. Chạy lại script sẽ ghi đè file nội dung bằng bản khác | Trung bình | Chọn một: xoá script (file JSON là nguồn sự thật), hoặc commit cả dữ liệu nguồn và để script khớp file hiện tại. Dù chọn gì, nên đảm bảo `scripts/` không thể ghi đè nội dung đã `Published` một cách vô tình |
| KG-M3-11 | **Nhãn nguồn nội dung cần owner xác nhận.** File ghi `HumanAuthored`, nhưng script sinh nội dung cho thấy quy trình dựng file bằng mã. DB Spec định nghĩa `Hybrid` cho nội dung kết hợp người và máy; quyết định #5 của Sprint 4 là nội dung do owner cung cấp và review thủ công. Mình không xác minh được bằng chứng review từ repo | Trung bình | Owner xác nhận nhãn đúng với thực tế; nếu có hỗ trợ bằng công cụ, dùng `Hybrid` để trung thực, và ghi lại việc đã rà soát toàn bộ 252 mục |
| KG-M3-12 | **Lỗi chính tả:** `Sun_in_Sagittarius` có "khát kho mở rộng" (đúng: "khát khao"). Mình chỉ quét được một mẫu lỗi cụ thể; chưa có kiểm tra chính tả toàn bộ | Thấp | Sửa; vì `1.0` đã `Published` và bất biến, sửa văn bản = phát hành version mới (xem 7.3) |
| KG-M3-13 | **Tên hành tinh không nhất quán:** Mặt Trời/Mặt Trăng/Sao Thủy/Sao Kim/Sao Hỏa/Sao Mộc/Sao Thổ có "Sao", còn "Thiên Vương/Hải Vương/Diêm Vương" bỏ "Sao" (24 đoạn mỗi hành tinh). Cả hai đều là cách gọi chấp nhận được, nhưng không đồng nhất | Rất thấp | Thống nhất khi phát hành version tiếp theo (hoặc chấp nhận) |
| KG-M3-14 | **Văn phong dự đoán/ngoài phạm vi.** Non-goals của Sprint 4 loại trừ diễn giải y tế/tài chính/pháp lý và "đề xuất dự đoán". Quét từ khoá trên 252 mục: có 18 đoạn nhắc "tài chính", 10 đoạn "sức khỏe", 3 đoạn "đầu tư". Ba chỗ cần đọc kỹ: `Uranus_in_House_7` ("có xu hướng kết hôn hoặc chia tay một cách đột ngột"), `Saturn_in_House_12` (nhắc "cảm giác tội lỗi hoặc trầm cảm"), `Uranus_in_Virgo` ("ảnh hưởng đến sức khỏe của bạn"); thêm `Jupiter_in_House_2` ("kiếm tiền một cách thuận lợi, đầu tư khôn ngoan"). Đây là nhận định rủi ro nội dung, không phải lỗi kỹ thuật; quyết định thuộc owner | Trung bình | Owner rà các đoạn trên và quyết định giữ, làm mềm (nêu như xu hướng, bỏ thuật ngữ lâm sàng như "trầm cảm"), hoặc thêm câu từ chối trách nhiệm ở UI (F5). Cân nhắc trước khi dữ liệu này lên môi trường thật |
| KG-M3-15 | Hai đoạn dùng cùng cấu trúc câu cố định: 251/252 đoạn câu thứ hai mở đầu "Bạn thường có xu hướng", 252/252 có câu cảnh báo "Cần chú ý/lưu ý rằng…". Đồng nhất tốt cho giọng điệu nhưng văn bản đọc theo khuôn | Rất thấp | Ghi nhận; không cần xử lý ở M3 |

Không có phát hiện về: trùng nội dung (0 đoạn trùng), khoảng trắng đầu/cuối (0), placeholder (0), độ dài (238–422 ký tự, trung vị 350), hay đoạn nhắc nhầm cung/nhà khác (kiểm tra tự động: tên cung đúng ở mọi đoạn `PlanetInSign`/`AngleInSign`, số nhà đúng ở mọi đoạn `PlanetInHouse`). Mình **không** đánh giá được chất lượng chiêm tinh hay bản quyền của văn bản; đó là việc review của owner (xem KG-M3-11).

### 7.3 Điều kiện/bằng chứng còn thiếu

| ID | Nội dung | Trạng thái |
|---|---|---|
| EV-M3-17 | Nội dung production 252 mục có trong repo, hợp lệ theo validator | **PASS** ([C-run] 252/252, 0 placeholder). Review nội dung bởi owner: không có bằng chứng trong repo |
| EV-M3-06b | Seed file thật vào DB sạch qua CLI: `npm run db:reset` → `npm run prisma:seed:content` (kỳ vọng `inserted`, 252) → chạy lại (kỳ vọng `unchanged`) → `SELECT status, count(*) FROM astrology.interpretation_contents GROUP BY status` (kỳ vọng `Published | 252`) | **UNVERIFIED** (không có log; CI không seed). Đây cũng là bằng chứng M6 cần |
| EV-M3-18 | Test chạy lại trên `db4a008`: `npm test` toàn bộ | CI #240 Success; chưa có log owner. [C-run] unit chart: 36 file / 301 test pass; eslint/prettier trên các thư mục M3 sạch |

### 7.4 Quyết định cần owner trước M4 (chỉ liên quan nội dung)

1. KG-M3-10 và KG-M3-11 (số phận script sinh nội dung và nhãn `contentSource`).
2. KG-M3-14 (các đoạn văn nhạy cảm) và KG-M3-12 (chính tả): vì `1.0` `Published` bất biến, mọi sửa văn bản cần version mới (`1.1`). Nếu muốn sửa trước khi M4/M6 dùng, nên làm **trước** khi version `1.0` được seed vào DB thật.
3. Chạy EV-M3-06b và gửi log.

M4 không bị chặn bởi các điểm trên về mặt mã (M4 chỉ cần provider và domain), nhưng KG-M1-03 vẫn nên được xử lý trước M4.


---

## 8. Cập nhật v3 — quy ước lưu trữ

Theo quy ước owner chốt ngày 2026-10-05: implementation plan của từng milestone chỉ là blueprint tạm thời và bị xoá sau khi milestone đóng; Evidence Matrix là tài liệu được lưu vào `docs/implementation/archive/sprint-4/`. Vì vậy KG-M3-08 (và KG-M2-04 ở ma trận M2) được rút lại, không còn là gap. Các gap còn mở của M3 được chuyển vào Task 3 của plan M4 (xem plan M4 v1.1, Mục 23).