# Sprint 4 M5 — Exit Criteria Evidence Matrix (bản đã review)

**Vị trí đề xuất:** `docs/implementation/archive/sprint-4/Sprint_4_M5_Exit_Criteria_Evidence_Matrix.md` (thay bản tự đánh giá hiện có trong repo)
**Phạm vi:** Sprint 4 M5 — Interpretation Presentation & API Contract
**Commit được review:** `adedf64` (HEAD `dev`); chuỗi M5 từ `c66dd15`: `9a52073` → `b9f02ae` → `dd8aae7` → `adedf64`
**Đối chiếu với:** `Sprint_4_M5_Interpretation_Presentation_API_Contract_Plan.md` v1.0 (Mục 31 Acceptance, Mục 32 Exit Criteria, Mục 34 Evidence Matrix)

## 0. Kết luận

**`PASS WITH KNOWN GAPS` — mã M5 đóng được; Acceptance Criteria #12 (tài liệu và bàn giao F5) mới đạt một phần, nên vá bằng một commit tài liệu nhỏ trước khi bắt đầu M6.**

- **Mã production khớp plan:** `toResponse(chart, interpretation)` với đối số bắt buộc; ánh xạ 5 trường tường minh (không rò `contentSource`/`status`/`version`); `interpretationVersion: z.string().nullable()` gán thẳng từ `interpretation.version`; hai call-site controller đã truyền `interpretation`. Không phát hiện lỗi hành vi khi đọc mã.
- **CI backend run #252 trên đúng HEAD `adedf64`: Success** (2m 19s); annotation chỉ có 3 warning `jwt-token.adapter.ts` có từ Sprint trước (và cảnh báo hạ tầng Node 20/Ubuntu của GitHub).
- **Điểm yếu chính:** (1) test hợp đồng OpenAPI phụ thuộc file `openapi.json` đã sinh sẵn — trên một bản clone sạch chạy `npm test` sẽ **FAIL** (đã tái hiện); CI qua được chỉ vì bước `Generate OpenAPI` đứng trước bước test; (2) REST Spec chỉ cập nhật một dòng, thiếu các phần plan Mục 24 yêu cầu; (3) bản ma trận trong repo không có bảng bàn giao F5 và ghi nhận quá mức.
- Không có mục FAIL.

## 1. Nguồn bằng chứng

| Ký hiệu | Ý nghĩa |
|---|---|
| **[C-run]** | Claude chạy trong sandbox trên clone `dev` tại `adedf64` (eslint, prettier, vitest unit, `generate:openapi`; sandbox không có Postgres và không tải được Prisma engine nên không chạy được test API/tích hợp, `typecheck`, `build`) |
| **[C-static]** | Claude đọc mã, diff, grep |
| **[CI]** | Trang tóm tắt run #252 (`adedf64`): Success; log từng bước cần đăng nhập |

## 2. Evidence Matrix

| ID | Tiêu chí | Trạng thái | Bằng chứng và ghi chú |
|---|---|---|---|
| EV-M5-00 | M4 tiền đề còn nguyên | **PASS** | Ma trận M4 v2; `git diff --stat c66dd15..HEAD` không chạm `application/`, `domain/`, `infrastructure/`, `composition-root.ts`, `prisma/` |
| EV-M5-01 | Mapper ánh xạ đúng | **PASS** | [C-static] `interpretation.items.map(...)` chọn 5 trường, giữ thứ tự, `tone: item.tone`; [C-run] `chart-response.mapper.test.ts` 2 test pass (bank rỗng → `[]` + `null`; hai item có trường nội bộ → chỉ 5 khoá, đúng thứ tự, `tone` `null` và `'casual'` giữ nguyên). Test mapper dùng `as any` cho item (chấp nhận được) |
| EV-M5-02 | `interpretationVersion` đúng nguồn | **PASS** | Gán thẳng `interpretation.version`; API test D/E/F/G/H khẳng định `null`, `'1.0'`, `'2.0'` |
| EV-M5-03 | API: tạo chart (user) | **PASS** | [CI] API test A/B/J: 201, 21 phần tử, 3 loại subject theo nhóm, `interpretationVersion '1.0'`, `chartResponseSchema.strict().safeParse` OK, khoá item = đúng 5, `tone === null`. Chưa khẳng định thứ tự hành tinh Sun→Pluto trong từng nhóm (chỉ kiểm theo `subjectType`) |
| EV-M5-04 | API: thiếu giờ sinh | **PASS** | [CI] test C: `isHouseDataAvailable === false`, 10 phần tử, tất cả `PlanetInSign`. Không kiểm tường minh `houses`/`angles` rỗng và có `Moon_in_*` |
| EV-M5-05 | API: bank rỗng | **PASS** | [CI] test D: `interpretations === []`, `interpretationVersion === null`, 201 |
| EV-M5-06 | API: ghim / chưa ghim / ghim hết nội dung | **PASS** | [CI] test E (ghim `1.0`, thêm `2.0`, GET vẫn `1.0`), F (đặt cột `NULL` bằng `prisma.chart.update`, GET trả `2.0`), G (xoá nội dung `1.0`, GET `[]` + `'1.0'`). F chưa kiểm cột DB vẫn `NULL` sau GET (không backfill); E chưa đọc DB để xác nhận cột đã được ghi (được chứng minh gián tiếp qua kết quả GET) |
| EV-M5-07 | API: Guest `save=false` | **PASS** | [CI] test H: 200, có diễn giải và version, `chart.count() === 0` |
| EV-M5-08 | API: lỗi và quyền | **PASS** | [CI] test I: 401, 404, 403, không có khoá `interpretations` trong body lỗi |
| EV-M5-09 | Không lộ trường nội bộ | **PASS** | Mapper chọn trường tường minh; test mapper và A/B/J kiểm tập khoá của phần tử đầu (chỉ phần tử `[0]`) |
| EV-M5-10 | Schema/OpenAPI khớp | **PASS** | [C-run] `generate:openapi` exit 0; `ChartResponse.required` có cả `interpretations` và `interpretationVersion`; `interpretationVersion` kiểu `["string","null"]`; `InterpretationResponse.required` = 4 trường (không `tone`), 5 thuộc tính. [CI] bước `Generate OpenAPI` Success |
| EV-M5-11 | Test hợp đồng OpenAPI | **PARTIAL** | [C-run] 4 test pass **sau khi** chạy `generate:openapi`; **FAIL khi chưa có `openapi.json`** ("openapi.json not found… Run npm run generate:openapi first") — tái hiện trên clone sạch (KG-M5-01). Test không khẳng định `required` của `ChartResponse` (chỉ `properties`). Đặt trong `tests/api/chart/` thay vì `tests/unit/docs/` như plan (khác biệt nhỏ) |
| EV-M5-12 | Hồi quy toàn bộ | **PASS** | [CI] #252 Success (chạy `test:coverage` có DB; thứ tự bước: Lint+Format → Generate OpenAPI → Typecheck → test:coverage → Build). Diff test chỉ **thêm** file/ca mới và cập nhật chữ ký mapper; không sửa kỳ vọng cũ |
| EV-M5-13 | Lint | **PASS** | [C-run] `eslint` trên `src/modules/chart`, `tests/api/chart`, `tests/fixtures`, `tests/unit/modules/chart`: exit 0; [CI] Success (3 warning `jwt` có sẵn) |
| EV-M5-14 | Format | **PASS** | [C-run] `prettier --check` trên mã M5 sạch; [CI] Success. (`docs/api/REST_API_Specification.md` báo lệch Prettier — có từ trước, ngoài phạm vi CI backend) |
| EV-M5-15 | Typecheck / Build | **PASS** | [CI] Success |
| EV-M5-16 | Ranh giới kiến trúc | **PASS** | [C-static] mapper chỉ import kiểu `InterpretationResult` từ `application` (presentation → application hợp lệ); không import `infrastructure`/Prisma; controller không đổi logic |
| EV-M5-17 | Tài liệu REST Spec | **PARTIAL** | Có: thêm dòng `interpretationVersion` ở §5.4. Thiếu: §5.5 (liệt kê `subjectType` MVP, grammar `subjectKey`, `tone` luôn `null`), §14.9 (ghi chú), sửa dòng `interpretations` còn ghi "`PlanetInHouse`/`Angle`" (đúng ra là `AngleInSign`), thứ tự dòng (đặt trước `interpretations`); mô tả `interpretationVersion` ghi "tại thời điểm tính/lưu" — **không đúng** với chart chưa ghim, nơi version là "mới nhất tại thời điểm request" (KG-M5-02) |
| EV-M5-18 | Bàn giao F5 | **PARTIAL** | Bản ma trận trong repo không có bảng bàn giao; được bổ sung ở Mục 6 của tài liệu này |

## 3. Đối chiếu Acceptance Criteria (Mục 31 plan)

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | `toResponse(chart, interpretation)` nhận đầu ra M4 thật | PASS |
| 2 | 5 trường, giữ thứ tự, không rò trường nội bộ | PASS |
| 3 | `interpretationVersion` = `interpretation.version` | PASS |
| 4 | Mapper không có logic diễn giải/version/DB | PASS |
| 5 | POST (`save=true/false`) và GET trả cả hai trường | PASS (API test A, H, E–G) |
| 6 | Trường hiện có và mã lỗi không đổi | PASS |
| 7 | Bank rỗng, thiếu giờ sinh, ghim/chưa ghim/ghim hết nội dung | PASS |
| 8 | Schema Zod/OpenAPI đúng, required/nullable khớp runtime | PASS (đối chiếu [C-run] trên artifact sinh ra) |
| 9 | `generate:openapi` thành công; artifact đúng | PASS |
| 10 | Test API và mapper pass; test cũ không sửa kỳ vọng | PASS |
| 11 | lint/format/typecheck/build pass; ranh giới; không TODO mới | PASS |
| 12 | REST Spec §5.4/§5.5 cập nhật; bàn giao F5 trong matrix | **PARTIAL** (EV-M5-17/18) |

## 4. Known Gaps

| ID | Gap | Mức | Đề xuất |
|---|---|---|---|
| KG-M5-01 | Test hợp đồng OpenAPI đọc file `backend/openapi.json` (gitignore, sinh ra bởi script). Clone sạch chạy `npm test` → FAIL; nếu file có sẵn nhưng cũ so với nguồn Zod thì test kiểm một tài liệu lỗi thời. CI không bị ảnh hưởng vì bước `Generate OpenAPI` chạy trước. Plan (Mục 19) đã nêu gọi `generateOpenApiDocument()` trong test để tránh phụ thuộc này | Trung bình–thấp | Tự sinh tài liệu trong `beforeAll`: `import` `chart.openapi.js` rồi gọi `generateOpenApiDocument()` (như `scripts/generate-openapi.ts`), bỏ đọc file; thêm kiểm `required` của `ChartResponse` và `InterpretationResponse` |
| KG-M5-02 | REST Spec chưa đầy đủ (EV-M5-17): thiếu §5.5/§14.9; dòng `interpretations` còn ghi "`Angle`"; mô tả `interpretationVersion` sai ngữ nghĩa cho chart chưa ghim (ví dụ nên viết: "version nội dung diễn giải được dùng cho response: version đã ghim khi tạo chart; chart cũ chưa ghim dùng version Published mới nhất tại thời điểm request; `null` khi chưa có nội dung Published") | Trung bình (ảnh hưởng F5) | Một commit tài liệu theo plan Mục 24 |
| KG-M5-03 | Mô tả OpenAPI của `POST /charts/natal` chứa chuỗi "(M5)" — tên milestone nội bộ lọt vào tài liệu công khai | Thấp | Bỏ "(M5)" |
| KG-M5-04 | Chi tiết test còn thiếu so với plan: thứ tự hành tinh Sun→Pluto trong từng nhóm (B); cột DB vẫn `NULL` sau GET ở F; đọc cột DB sau POST ở E; `houses`/`angles` rỗng và có `Moon_in_*` ở C; tập khoá chỉ kiểm phần tử đầu | Thấp | Thêm vài assertion vào các test hiện có |
| KG-M5-05 | Bản ma trận trong repo ghi nhận quá mức: nói REST Spec §5.5 đã cập nhật (chỉ §5.4 một dòng); không nêu commit/CI; không có bảng bàn giao F5; không có hàng cho typecheck/build/hồi quy/ranh giới | Thấp | Thay bằng tài liệu này |
| KG-M3-14, KG-S4-06 (kế thừa) | Văn phong tài chính/sức khỏe còn trong `bodyText` (owner giữ nguyên); Moon có thể sai cung khi thiếu giờ sinh (engine 12:00 địa phương, không warning) | Đã chấp nhận | Đã đưa vào bàn giao F5 (Mục 6) |
| (kế thừa) | KG-M1-05, KG-S4-08, KG-M3-01, KG-M2-03; REST Spec §12.4 còn mô tả endpoint `/charts/{id}/interpretations` mâu thuẫn §14.9 (O-M5-2: ghi gap, sửa khi đóng Sprint 4) | Như đã ghi | Đưa vào Known Gaps Registry khi đóng Sprint 4 |

**Đã đóng nhờ M5:** Sprint 3 Known Gap G-01 (`interpretations` luôn `[]`).

## 5. Việc cần làm trước khi bắt đầu M6

- [ ] Một commit nhỏ: sửa KG-M5-01 (test OpenAPI tự sinh tài liệu), KG-M5-02 (REST Spec), KG-M5-03 (bỏ "(M5)"), vài assertion ở KG-M5-04
- [ ] Thay ma trận M5 trong `archive/sprint-4/` bằng tài liệu này
- [ ] CI xanh trên commit đó; không cần log owner (M5 không có việc ngoài CI)

## 6. Bàn giao Frontend F5 (hợp đồng đã được test chứng minh)

| Field | Ý nghĩa | Kiểu | Ghi chú |
|---|---|---|---|
| `interpretations` | Danh sách diễn giải của chart | `InterpretationResponse[]` | **Mảng phẳng**, luôn có, có thể `[]`; thứ tự cố định: `PlanetInSign` (Sun→Pluto) → `AngleInSign` (Ascendant) → `PlanetInHouse` (Sun→Pluto). Frontend nhóm theo `subjectType` |
| `interpretations[].subjectType` | Loại subject | string | MVP: `PlanetInSign`, `AngleInSign`, `PlanetInHouse` |
| `interpretations[].subjectKey` | Định danh ổn định | string | `Sun_in_Leo`, `Ascendant_in_Leo`, `Sun_in_House_7`; frontend tự ánh xạ tên hiển thị, không parse `bodyText` |
| `interpretations[].language` | Ngôn ngữ | string | `vi` |
| `interpretations[].bodyText` | Văn bản đã hoàn thiện | string | Tiếng Việt |
| `interpretations[].tone` | Giọng điệu | string \| null | MVP luôn `null` |
| `interpretationVersion` | Version nội dung diễn giải đã dùng | string \| null | Luôn có khoá; không phải version API/engine; `null` + `[]` = chưa có nội dung |
| `isHouseDataAvailable` | Có dữ liệu nhà/góc | boolean | `false` ⇒ không có `PlanetInHouse` và `AngleInSign` |

Lưu ý cho F5: (1) khi `isHouseDataAvailable=false`, `Moon_in_*` vẫn có và có thể sai cung (KG-S4-06) → hiển thị lưu ý; (2) chart cũ chưa ghim có thể đổi nội dung khi owner publish version mới; (3) `bodyText` có văn phong tài chính/sức khỏe (KG-M3-14) → cân nhắc lưu ý "chỉ mang tính tham khảo"; (4) lỗi: 401 (chưa đăng nhập, trừ `POST … save=false`), 403 `FORBIDDEN`, 404; dùng `getErrorMessage(errorCode)`, không dùng `.message` của backend.
