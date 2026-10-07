# Sprint 4 M4 — Exit Criteria Evidence Matrix (v2 — đã đóng)

**Vị trí đề xuất:** `docs/implementation/archive/sprint-4/Sprint_4_M4_Exit_Criteria_Evidence_Matrix.md` (thay bản 24 dòng hiện có trong repo)
**Phạm vi:** Sprint 4 M4 — Interpretation Application Layer (kèm Task 3: gộp tồn đọng M3/M1)
**Commit được review:** v1 `171a5ca`; **v2 `c66dd15` (HEAD, CI run #247 Success)**; chuỗi M4 tính từ `db4a008`: `ac22076` → `c071007` → `9c5cda0` → `ff83892` → `292bce1` → `171a5ca`

**Đối chiếu với:** `Sprint_4_M4_Interpretation_Application_Layer_Plan.md` v1.1 (Mục 28 Acceptance, Mục 29 Exit Criteria, Mục 31 Evidence Matrix)

## 0. Kết luận

**`PASS WITH KNOWN GAPS` — M4 đóng được về mặt chức năng; khuyến nghị một commit bổ sung test nhỏ (KG-M4-01/02) trước khi bắt đầu M5.**

- **Mã production khớp plan:** `InterpretationLookupService`, hai use case, `ChartBuilder`, controller tối thiểu, composition root, export type đều đúng thiết kế (D-M4-02…13). Không phát hiện lỗi hành vi khi đọc mã.
- **CI backend run #246 trên đúng HEAD `171a5ca`: Success** (1m 49s). Annotation của CI vẫn có **3 warning `jwt-token.adapter.ts`** (có từ Sprint trước).
- **Task 3:** C1, C2, C3, C4, C6, C7 hoàn thành; C5 hoàn thành một phần (Mục 4).
- **Điểm yếu chính:** phần test của Task 2 không chứng minh được các hành vi quan trọng nhất của M4 (ghim version trước build, thứ tự tra-nội-dung-trước-lưu, guard chạy trước tra nội dung). Bản ma trận cũ trong repo đánh `PASS` cho các mục này; mình hạ xuống `PARTIAL` vì bằng chứng không đủ (Mục 2, 4).
- Không có mục FAIL.

## 1. Nguồn bằng chứng

| Ký hiệu | Ý nghĩa |
|---|---|
| **[C-run]** | Claude chạy trong sandbox trên clone `dev` tại `171a5ca` (eslint, prettier, vitest unit; sandbox không tải được Prisma engine nên không chạy được test tích hợp, `typecheck`, `build`) |
| **[C-static]** | Claude đọc mã, diff, grep |
| **[CI]** | Trang tóm tắt run #246 (`171a5ca`): Success; log từng bước cần đăng nhập |
| **[Owner]** | `Sprint4_M4_Logs.txt` (log seed) |

## 2. Evidence Matrix

| ID | Tiêu chí | Trạng thái | Bằng chứng và ghi chú |
|---|---|---|---|
| EV-M4-00 | M1–M3 tiền đề | **PASS** | Ma trận M1–M3 đã nằm trong `archive/sprint-4/`; M3 plan đã xoá đúng quy ước |
| EV-M4-01 | Service có test | **PASS** | [C-run] `interpretation-lookup.service.test.ts` **22 test**; phủ chọn version, ghim, `null`, bank rỗng, thiếu nội dung (cap 20 key), thứ tự, trùng, lỗi hạ tầng truyền lên, dữ liệu hỏng (house 13), không đổi đầu vào. Tên `describe` có lỗi chính tả `unpiinned` |
| EV-M4-02 | Create/Get có test điều phối | **PARTIAL** | Test chỉ được cập nhật theo kiểu trả về mới (`{ chart, interpretation }`) và thêm mock service (`resolveLatestVersion`, `lookup`). **Không có** assertion cho: `build` nhận `snapshotInterpretationVersion`; `resolveLatestVersion` chạy trước `build`; `lookup` chạy trước `save`; `lookup` lỗi thì `save` không được gọi; guard (XOR, Guest) thì service không được gọi; `save=false` vẫn tra nội dung; Get: không tìm thấy hoặc sai chủ sở hữu thì service không được gọi, lỗi service truyền lên. Đây là các ca plan Mục 21 yêu cầu (KG-M4-01) |
| EV-M4-03 | `ChartBuilder` chuyển version | **PARTIAL** | [C-static] mã đúng (`input.snapshotInterpretationVersion ?? null`). `chart-builder.test.ts` **không bị sửa** từ `db4a008` và không file test nào khẳng định builder trả chart mang version. Bản ma trận cũ ghi "Đã pass test chart-builder.test.ts" — test cũ vẫn pass nhưng không kiểm hành vi mới (KG-M4-02) |
| EV-M4-04 | Hồi quy toàn bộ | **PASS** | [CI] #246 Success (chạy `test:coverage` có DB thật). [C-run] unit `tests/unit/modules/chart`: 37 file / 323 test pass |
| EV-M4-05 | Lint | **PASS** | [C-run] `eslint . --ext .ts` exit 0, **0 error, 3 warning** `jwt-token.adapter.ts`; [CI] cùng 3 warning. Bản cũ ghi "không cảnh báo sau khi fix" là không đúng |
| EV-M4-06 | Format | **PASS** | [C-run] `prettier --check .` sạch; [CI] Success |
| EV-M4-07 | Typecheck | **PASS** | [CI] Success (không chạy được trong sandbox) |
| EV-M4-08 | Build | **PASS** | [CI] Success |
| EV-M4-09 | Ranh giới kiến trúc | **PASS** | [C-static] `application/` không import `infrastructure`/Prisma/Express (chỉ 2 dòng comment); `PrismaInterpretationContentProvider` chỉ xuất hiện ở file định nghĩa và `composition-root.ts`; không `statusCode` trong service |
| EV-M4-10 | Không AI, không TODO/FIXME | **PASS** | [C-static] grep `openai\|anthropic` trong `src`, `package.json`, `scripts`, `prisma`: 0; TODO/FIXME trong `application/` và test tương ứng: 0; `scripts/` chỉ còn `generate-openapi.ts` |
| EV-M4-11 | Wiring | **PASS** | [C-static] composition root nối provider → service → hai use case; [CI] API/E2E Success (bank rỗng trong CI nên `interpretations` vẫn `[]`) |
| EV-M4-12 | C1 `InfrastructureError` | **PASS** | [C-static] `grep "{ cause" src` = 0; 11 vị trí đã đổi (4 ở chart, 7 ở birth-profile) sang `(message, undefined, error as Error)`; test tích hợp thêm assertion `details` là `undefined` ở **2 vị trí** (chart `save`, birth-profile `create`); các vị trí còn lại chỉ dựa vào sửa cơ học và grep |
| EV-M4-13 | C2, C3, C7 | **PASS** | C2: bỏ tham chiếu sample trong `seed-content.ts` và `prisma/README.md`; C3: `generate-interpretations.ts` đã xoá; C7: Evidence Matrix M3, M4 đã ở `archive/sprint-4/`, plan M3 đã xoá, plan M4 không được commit |
| EV-M4-14 | C4, C5 (nội dung) | **PARTIAL** | C4: `contentSource` = `Hybrid` (O-M4-3 đã chốt). C5: 75/252 mục được sửa; lỗi "khát kho" đã sửa; các hành tinh ngoài thống nhất "Sao Thiên Vương/Hải Vương/Diêm Vương"; `trầm cảm` và `kết hôn` đã bỏ. Còn lại: `đầu tư` 3, `tài chính` 18, `sức khỏe` 9; `Jupiter_in_House_2` vẫn ghi "kiếm tiền một cách thuận lợi, đầu tư khôn ngoan" (quyết định thuộc owner, xem KG-M3-14). [C-run] `--validate-only`: 252/252, placeholder 0 |
| EV-M4-15 | C6 seed 252 mục | **PASS** | [Owner] lần 1 `inserted 252`; lần 2 `unchanged 252`; `SELECT status, count(*)` → `Published | 252`. Log chạy trên DB dev `astroviet` (không có `db:reset` đi kèm; kết quả `inserted` cho thấy `1.0` chưa tồn tại). Phù hợp D-M4-16: nội dung được sửa trước lần seed đầu tiên |

## 3. Đối chiếu Acceptance Criteria (Mục 28 plan)

| # | Tiêu chí | Kết quả | Ghi chú |
|---|---|---|---|
| 1 | Service ở `application/services/`, chỉ phụ thuộc port và `ILogger` | PASS | |
| 2 | Dùng `derive…`, `isValidContentVersion`, `compareContentVersion`; không dùng `enumerate…` | PASS | |
| 3 | Chart ghim: dùng đúng version, không gọi `findPublishedVersions` | PASS | Có test service |
| 4 | Chart `null`: Published mới nhất, không backfill | PASS | Có test service |
| 5 | Chart mới được ghim trước build; `save=false` không persist | **PASS (đọc mã), chưa có test** | Xem EV-M4-02 |
| 6 | Không có nhà: không `PlanetInHouse`, không lỗi | PASS | Có test service |
| 7 | Thiếu nội dung: bỏ item + warn; bank rỗng: `[]` | PASS | |
| 8 | Lỗi provider truyền lên nguyên vẹn | PASS | Có test service |
| 9 | Thứ tự kết quả xác định | PASS | Có test service |
| 10 | Guard và ownership chạy trước mọi truy vấn nội dung | **PASS (đọc mã), chưa có test** | Xem EV-M4-02 |
| 11 | `ChartBuilder` chuyển version | **PASS (đọc mã), chưa có test** | Xem EV-M4-03 |
| 12 | Composition root nối đủ | PASS | |
| 13 | Test pass; không sửa kỳ vọng cũ | PASS | Diff test chỉ đổi kiểu trả về và thêm mock |
| 14 | lint/typecheck/format/build pass; không vi phạm ranh giới | PASS | |
| 15 | Không AI trong `src/` và `scripts/` | PASS | |
| 16 | C1 | PASS | EV-M4-12 |
| 17 | C2 | PASS | EV-M4-13 |
| 18 | C3/C4/C5/O-M4-3/O-M4-4 có quyết định; `--validate-only` 252/252 | PASS có phần C5 còn mở | EV-M4-14 |

## 4. Known Gaps

| ID | Gap | Loại | Mức | Đề xuất |
|---|---|---|---|---|
| KG-M4-01 | Test Create/Get thiếu các ca điều phối nêu ở EV-M4-02 | Chất lượng test | Trung bình | Một commit bổ sung (khoảng 8 ca): `build` nhận version từ `resolveLatestVersion`; thứ tự `resolve → build → lookup → save` (dùng `mock.invocationCallOrder`); `lookup` ném lỗi thì `save` không được gọi; guard thì service không được gọi; `save=false` vẫn gọi `lookup` nhưng không `save`; version `null` thì `build` nhận `null`; Get: không tìm thấy hoặc sai chủ sở hữu thì không `lookup`, lỗi service truyền lên. Nên làm **trước M5** vì M5 dựa vào các hành vi này |
| KG-M4-02 | Không test nào xác nhận `ChartBuilder.build` trả chart mang `snapshotInterpretationVersion` | Chất lượng test | Trung bình–thấp | Thêm 2 ca vào `chart-builder.test.ts`: truyền `'1.0'` → chart `'1.0'`; bỏ qua → `null` |
| KG-M4-03 | Khi bank rỗng, Create gọi `findPublishedVersions` hai lần: lần 1 trong `resolveLatestVersion` (trả `null`, chart không được ghim), lần 2 trong `lookup` (vì chart `null` nên service tự resolve lại). Có cửa sổ race rất nhỏ (version vừa được publish giữa hai lần gọi → nội dung có version nhưng chart không ghim) | Thiết kế nhỏ | Thấp | Chấp nhận ở MVP; hoặc để `lookup` nhận tuỳ chọn version đã resolve. Ghi nhận, không cần sửa |
| KG-M4-04 | Bản ma trận trong repo có vài ô quá lạc quan: lint "không cảnh báo", EV-M4-02/03 `PASS`, kết luận "100%" | Tài liệu | Thấp | Thay bằng bản này khi lưu vào `archive/sprint-4/` |
| KG-M4-05 | Architecture Spec §12 chưa có ghi chú `InterpretationLookupService` (plan Mục 27 dự kiến); tên `describe` `unpiinned` | Tài liệu/nhỏ | Rất thấp | Sửa khi tiện, ví dụ cùng commit bổ sung test |
| KG-M4-06 | Trạng thái trung gian: use case tính nội dung nhưng controller bỏ qua kết quả đến M5 (thêm 1–2 truy vấn mỗi request Create/Get) | Đã chốt O-M4-1 | Thấp | Chấp nhận trên `dev`; không phát hành riêng M4 |
| KG-M3-14 (còn lại một phần) | Văn phong tài chính/sức khỏe còn lại nêu ở EV-M4-14 | Nội dung, owner | Thấp–trung bình | Owner quyết định; `1.0` đã `Published` và seed, nên mọi sửa tiếp theo cần version mới (`1.1`) |
| (kế thừa) | KG-M1-05 (`prisma migrate diff` chưa có log), KG-S4-06 (Moon), KG-S4-08 (`preferred_language`), KG-M3-01 (CLI ngoài `typecheck`), KG-M2-03 (mock `as any`) | Như đã ghi | Như đã ghi | Đưa vào Known Gaps Registry khi đóng Sprint 4 |

**Đã đóng nhờ M4:** KG-M1-03, KG-M3-09, KG-M3-10, KG-M3-11 (`Hybrid`), KG-M3-12, KG-M3-13, KG-M3-08 (rút lại theo quy ước), EV-M3-06b.

## 5. Việc cần làm trước khi đóng M4 / bắt đầu M5

- [ ] (Khuyến nghị) Một commit bổ sung test: KG-M4-01 và KG-M4-02, cộng sửa `unpiinned`
- [ ] Thay bản ma trận M4 trong `archive/sprint-4/` bằng bản này
- [ ] Owner quyết định phần C5 còn lại (KG-M3-14) — không chặn
- [ ] Chạy CI trên commit bổ sung; khi có CI xanh trên đúng HEAD thì không cần log thêm (log seed đã đủ)


---

## 6. Cập nhật v2 — đóng M4 (commit `c66dd15`, CI run #247)

### 6.0 Kết luận v2

**`PASS WITH KNOWN GAPS` — M4 ĐÓNG.** CI backend run #247 trên đúng HEAD `c66dd15` **Success** (1m 55s); annotation vẫn chỉ có 3 warning `jwt-token.adapter.ts` có từ Sprint trước.

### 6.1 Gap của v1 đã xử lý

| Gap | Kết quả | Bằng chứng |
|---|---|---|
| KG-M4-01 (test Create/Get) | **ĐÓNG (còn ca nhỏ)** | [C-run] `create-natal-chart.usecase.test.ts` **22 test pass** (thêm 5 ca): `build` nhận version đã resolve; thứ tự `resolve → build → lookup → save`; `lookup` lỗi thì `save` không được gọi; guard thiếu input thì service không được gọi; `save=false` vẫn `lookup`. `get-chart.usecase.test.ts` thêm 3 assertion `lookup` không được gọi (không tìm thấy; sai chủ sở hữu; admin truy cập chart người khác) |
| KG-M4-02 (builder) | **ĐÓNG** | [C-run] `chart-builder.test.ts` 8 test pass, thêm 2 ca: `'1.0'` → chart mang `'1.0'`; bỏ qua → `null` |
| KG-M4-05 (tài liệu, chính tả) | **ĐÓNG** | `unpinned` đã sửa; Architecture Spec có ghi chú về `InterpretationLookupService` |
| KG-M4-04 (ma trận quá lạc quan) | **ĐÓNG** | Ma trận trong repo đã thay bằng bản review |
| KG-M3-14 (văn phong còn lại) | **ĐÓNG theo quyết định owner** | Owner quyết định giữ nguyên nội dung `1.0` như đã seed, không sửa thêm (2026-10-06) |

[C-run] tổng cộng 7 file / 79 test pass cho `application/` và `chart-builder`; `eslint` trên `src/modules/chart` và `tests/unit/modules/chart` exit 0.

### 6.2 Ca nhỏ còn lại (không chặn, ghi nhận)

- Create: chưa có ca "service trả version `null` thì `build` nhận `null`" và ca guard Guest+`save` cho service (chỉ guard thiếu input được test).
- Get: chưa có ca "lỗi từ service được truyền lên".
- KG-M4-03 (hai lần `findPublishedVersions` khi bank rỗng) và KG-M4-06 (trạng thái trung gian đến M5) giữ nguyên là chấp nhận.

### 6.3 Gap kế thừa chuyển sang Known Gaps Registry của Sprint 4

KG-M1-05 (`prisma migrate diff` chưa có log), KG-S4-06 (Moon khi thiếu giờ sinh), KG-S4-08 (`preferred_language`), KG-M3-01 (CLI ngoài `typecheck`), KG-M2-03 (mock `as any` ở test M2).
