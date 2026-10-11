# Sprint F4 — M2 Exit Criteria Evidence Matrix

## Chart ViewModel / Data Adapter

**Vị trí lưu:** `docs/implementation/archive/sprint-f4/Sprint_F4_M2_Exit_Criteria_Evidence_Matrix.md`
**Phạm vi:** F4-M2.0 → M2.4 (commit `c7b29e1` → `59ea580` → `5bf5319` và review batch R-1..R-5).
**Commit được đánh giá:** HEAD `dev`. Ngày review: 2026-10-11.
**CI Run kiểm chứng:** [CI Run #231 (commit 5bf5319)](https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/38107810989)
**Nguồn bằng chứng:** `[repo]` đọc mã/diff; `[run]` chạy lệnh thực tế trên môi trường; `[owner]` owner cung cấp.
**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `ACCEPTED GAP` · `NOT APPLICABLE`.

## Kết luận

**`PASS WITH KNOWN GAPS`** — toàn bộ 18 tiêu chí nghiệm thu của Sprint F4 M2 đã hoàn thành và đạt chất lượng:

1. Lớp ViewModel thuần TypeScript (`chartViewModel.ts`, `format.ts`, `labels.ts`) hoàn tất với 100 unit tests bao phủ 100% Statements, 100% Branches, 100% Functions, 100% Lines của tầng model.
2. Toàn bộ cổng chất lượng repo (`format:check`, `lint`, `typecheck`, `build` và `test` gồm 90 test files, 558 tests) đều exit 0.
3. Ranh giới kiến trúc được bảo toàn tuyệt đối (0 import React, DOM, Intl, Zod, hoặc `any` trong production code).
4. Các gap ghi nhận và khuyến nghị review (R-1 đến R-5) đã được giải quyết triệt để và lập chỉ mục trong Known Gaps Registry.

---

## 1. Bằng chứng kỹ thuật theo tiêu chí (Acceptance Criteria)

| ID       | Tiêu chí nghiệm thu                                                                              | Bằng chứng kiểm chứng                                                                                                                                | Nguồn  | Trạng thái |
| -------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| EV-M2-01 | Chuyển đổi chính xác `ChartResponse` thật (`chartFull`, `chartNoHouses`)                         | `chartViewModel.test.ts` test A1, A2, A3; so khớp dữ liệu fixture CAPTURED                                                                           | [run]  | VERIFIED   |
| EV-M2-02 | Tách biệt DTO và ViewModel; UI không import enum Backend thô                                     | `chartViewModel.ts` định nghĩa `ChartViewModel`, `PlanetVM`, `HouseVM`, `AngleVM`, `AspectVM` độc lập; UI chỉ nhận VM                                | [repo] | VERIFIED   |
| EV-M2-03 | Đầy đủ nhãn tiếng Việt cho 14 vật thể, 12 cung, 5 aspect, 4 góc, 2 hệ nhà, 3 nature              | `labels.ts` (`PLANET_LABELS`, `SIGN_LABELS`, `ASPECT_TYPE_LABELS`, `ANGLE_LABELS`, `HOUSE_SYSTEM_LABELS`, `NATURE_LABELS`); `labels.test.ts` (B1–B6) | [run]  | VERIFIED   |
| EV-M2-04 | Glyph chuẩn xác Unicode code point (hậu tố `\uFE0E` cho 12 cung hoàng đạo)                       | `labels.test.ts` test B1, B2, B3; kiểm tra code point escape chính xác                                                                               | [run]  | VERIFIED   |
| EV-M2-05 | `formatDegreeMinute` đúng hợp đồng `D°MM′` (không giây, cắt floor)                               | `format.ts`, `format.test.ts` (15 test, bao phủ C1–C8, 100% coverage)                                                                                | [run]  | VERIFIED   |
| EV-M2-06 | Thứ tự chính tắc (canonical ordering) tất định                                                   | `chartViewModel.test.ts` test D1 (đảo lộn đầu vào sinh ra cùng VM đầu ra), D4, D6, D7, G3.2, G4.6                                                      | [run]  | VERIFIED   |
| EV-M2-07 | `houseDataAvailable` phản ánh Backend và xử lý mâu thuẫn                                         | `chartViewModel.test.ts` test E1, E2, E3 (11 nhà), E4 (flag false nhưng có nhà), G4.4                                                                | [run]  | VERIFIED   |
| EV-M2-08 | `partialData` đúng định nghĩa (`ENTRY_DROPPED`, `CORE_BODY_MISSING`, `HOUSE_FLAG_CONTRADICTION`) | `chartViewModel.test.ts` test D2, E3, E4, E5, F2, F3, G4.1                                                                                           | [run]  | VERIFIED   |
| EV-M2-09 | Giá trị lạ không bị ép sang giá trị biết trước (`known: false`, `glyph: null`, giữ nhãn gốc)     | `labels.test.ts` test B8; `chartViewModel.test.ts` test D3, F1, G2.4, G3.1                                                                           | [run]  | VERIFIED   |
| EV-M2-10 | Không mất dữ liệu hành tinh/cung/aspect khi không có nhà                                         | `chartViewModel.test.ts` test A2, A3; `chartNoHouses` giữ nguyên 10 hành tinh                                                                        | [run]  | VERIFIED   |
| EV-M2-11 | Trường diễn giải hoàn toàn cô lập                                                                | `chartViewModel.test.ts` test A6, A7 (bỏ/sửa diễn giải cho ra cùng VM)                                                                               | [run]  | VERIFIED   |
| EV-M2-12 | Không tính toán chiêm tinh (không tính lại vị trí/orb/cusp)                                      | Đọc mã `chartViewModel.ts`; chỉ format và sắp xếp dữ liệu sẵn có                                                                                     | [repo] | VERIFIED   |
| EV-M2-13 | Không geometry / SVG (không tọa độ wheel, không `normalizeLongitude`)                            | `chartViewModel.ts` chỉ giữ trường `longitude` thô cho các tầng sau vẽ                                                                               | [repo] | VERIFIED   |
| EV-M2-14 | `model/**` không import React, DOM, Intl hay browser APIs                                        | Grep gate Mục 28: 0 kết quả trong `labels.ts`, `format.ts`, `chartViewModel.ts`                                                                      | [run]  | VERIFIED   |
| EV-M2-15 | DTO không bị biến đổi (immutability)                                                             | `chartViewModel.test.ts` test A8 (`deepFreeze(dto)` không throw)                                                                                     | [run]  | VERIFIED   |
| EV-M2-16 | Mọi test mới và toàn bộ test suite pass 100%                                                     | 90 test files pass / 558 tests pass (100 tests trong `features/chart/model/**`, 100% line coverage)                                                  | [run]  | VERIFIED   |
| EV-M2-17 | Toàn bộ cổng chất lượng repo exit 0                                                              | `format:check` ✓, `lint` ✓, `typecheck` ✓, `build` ✓, `test:coverage` ✓                                                                              | [run]  | VERIFIED   |
| EV-M2-18 | Không dependency mới, không state toàn cục, ranh giới sửa đổi rõ ràng                            | Mã nguồn tính năng chỉ thay đổi trong `model/**`; ngoài model chỉ gồm docs và sửa chính tả nhãn lỗi M1 theo D-M2-9 (`shared/lib/error-messages*`)     | [repo] | VERIFIED   |

---

## 2. Quyết định kỹ thuật đã thực thi (D-M2-1 … D-M2-12)

| Quyết định | Nội dung thực thi                                                   | Trạng thái |
| ---------- | ------------------------------------------------------------------- | ---------- |
| D-M2-1     | `formatDegreeMinute` dùng `D°MM′` (không giây, ký tự `′` U+2032)    | VERIFIED   |
| D-M2-2     | Cắt xuống phút (floor `Math.floor(v * 60 + 1e-9)`) chống tràn cung  | VERIFIED   |
| D-M2-3     | Toàn bộ nhãn và glyph tiếng Việt đề xuất (ô P) đã duyệt             | VERIFIED   |
| D-M2-4     | Backend `Challenging` ánh xạ sang UI `tone: "tense"`                | VERIFIED   |
| D-M2-5     | Thứ tự điểm tùy chọn theo `KNOWN_PLANET_NAMES` và ghim bằng test B7 | VERIFIED   |
| D-M2-6     | `meta.calculatedAt` giữ chuỗi ISO thô                               | VERIFIED   |
| D-M2-7     | `partialData` dẫn xuất từ mảng `issues` với 3 mã lỗi chỉ định       | VERIFIED   |
| D-M2-8     | `selection.ts` hoãn sang S4.8; xuất `PlanetKey` / `AspectKey`       | VERIFIED   |
| D-M2-9     | Chính tả kiểu mới (Hỏa, Thủy, Tọa) thống nhất với Backend           | VERIFIED   |
| D-M2-10    | VM hỗ trợ đầy đủ 14 vật thể                                         | VERIFIED   |
| D-M2-11    | `formatDegreeMinute` đặt tại `features/chart/model/format.ts`       | VERIFIED   |
| D-M2-12    | VM chuyển tiếp `warnings`, không tự suy diễn lý do thiếu nhà        | VERIFIED   |

---

## 3. Cổng chất lượng chi tiết

| Cổng kiểm tra | Lệnh thực thi                                             | Kết quả                                                                                                                                           | Trạng thái |
| ------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Format check  | `npm run format:check`                                    | Exit 0 — "All matched files use Prettier code style!"                                                                                             | VERIFIED   |
| Linter        | `npm run lint`                                            | Exit 0 — 0 errors, 0 warnings                                                                                                                     | VERIFIED   |
| Typecheck     | `npm run typecheck` (`tsc -p tsconfig.app.json --noEmit`) | Exit 0 — 0 errors                                                                                                                                 | VERIFIED   |
| Build         | `npm run build`                                           | Exit 0 — "built in 8.06s"                                                                                                                         | VERIFIED   |
| Test suite    | `npm test`                                                | Exit 0 — **90 test files passed, 558 tests passed**                                                                                               | VERIFIED   |
| Coverage      | `npm run test:coverage`                                   | `chart/model`: **100% Stmts / 100% Branch / 100% Funcs / 100% Lines**; Toàn repo: 94.21% Stmts / 87.56% Branch / 95.55% Lines (nguồn: v8/vitest) | VERIFIED   |
| Grep Gate     | Grep cấm React/DOM/Intl/Zod/any trên mã production        | 0 vi phạm                                                                                                                                         | VERIFIED   |

---

## 4. Known Gaps Registry (M2)

| ID         | Vấn đề                                                                                                                                                                              | Phân loại                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| KG-M2-01   | Dung sai `1e-9′` có thể làm `29.99999999999° ⇒ 30°00′` (không xảy ra với dữ liệu thật)                                                                                             | Known Gap — defer                   |
| KG-M2-02   | Chấm nguyên tố màu cho `SignBadge` (UI §12.9) chưa có trong VM; F4 không hiển thị chấm nguyên tố                                                                                     | Known Gap — defer (S4.7)            |
| KG-M2-03   | Số La Mã cho nhà (`numeralStyle`) thuộc trách nhiệm của component UI                                                                                                               | Out of scope                        |
| KG-M2-04   | Kiểm tra render glyph thực tế trên các hệ điều hành di động (Newsreader font fallback)                                                                                               | Known Gap — S4.4/S4.7               |
| KG-M2-05   | Hook trả DTO; consumer sử dụng `useMemo(() => toChartViewModel(dto), [dto])`                                                                                                         | Đã chốt theo F4 plan                |
| KG-M2-06   | Lệch định dạng độ giây giữa UI Spec §12.2 (`D°M'S"`) và F4 Plan (`D°MM′`)                                                                                                            | Đã giải quyết qua D-M2-1 (APPROVED) |
| KG-M2-07   | Xử lý 3 đường im lặng (R-1): phần tử warning không hợp lệ ghi `ENTRY_DROPPED` (`partialData=true`), `planets[].house` sai kiểu/miền và cờ nhà false nhưng có house ghi `VALUE_OUT_OF_RANGE`. | Resolved via R-1 & test Group G4    |
| KG-M2-08   | Nâng độ bao phủ nhánh phòng thủ (R-2): bổ sung 27 unit tests cho structural checks, angle validation, unknown cusp signs, alphabet tie-breaks. Model đạt 100% line & branch coverage.    | Resolved via R-2 & test Group G1–G4 |
| KG-M2-09   | Tách hàm `toChartViewModel` (R-3): module hoá thành 7 builders chuyên biệt (`validateStructure`, `buildPlanets`, `buildHouses`, etc.) cùng file, thân hàm chính còn ~40 dòng.     | Resolved via R-3                    |
| KG-F4M1-14 | Chính tả M1 (R-5): sửa "Toạ độ nơi sinh..." thành "Tọa độ nơi sinh..." trong `shared/lib/error-messages.ts` và test tương ứng theo D-M2-9.                                        | Resolved via R-5                    |

---

## 5. Việc đóng hồ sơ M2

1. [x] Hoàn tất triển khai F4-M2.1 (`labels.ts`, `labels.test.ts`), F4-M2.2 (`format.ts`, `format.test.ts`), F4-M2.3 (`chartViewModel.ts`, `chartViewModel.test.ts`).
2. [x] Xử lý toàn bộ phản hồi review R-1 đến R-5 (loại bỏ đường im lặng, 100% test coverage, modular builders, cập nhật matrix và sửa lỗi chính tả M1).
3. [x] Xác minh toàn bộ cổng kiểm tra chất lượng và Grep Gate kiến trúc.
4. [x] Lập Evidence Matrix M2 tại `docs/implementation/archive/sprint-f4/Sprint_F4_M2_Exit_Criteria_Evidence_Matrix.md`.
5. [ ] Xóa blueprint tạm thời `docs/implementation/Sprint_F4_M2_Implementation_Plan.md` sau khi owner phê duyệt đóng M2.
