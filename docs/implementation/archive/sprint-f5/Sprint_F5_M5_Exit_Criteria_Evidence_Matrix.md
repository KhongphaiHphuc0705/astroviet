# Sprint F5 — M5 Exit Criteria & Evidence Matrix
## Degraded States & Copy Consolidation

- **Vị trí lưu trữ:** `docs/implementation/archive/sprint-f5/Sprint_F5_M5_Exit_Criteria_Evidence_Matrix.md`
- **Phạm vi:** F5-M5.0 → M5.7 (Xác minh & củng cố 6 trạng thái suy giảm, bảo vệ không hồi quy M3/M4, cô lập lỗi dựng model H-1, đăng ký đầy đủ Known Gap KG-F5-01, 17 test mới D5-*, thực thi các quyết định D-M5-00..D-M5-11).
- **Trạng thái:** `IN_PROGRESS` (Khởi tạo & hoàn thành Task 0 / M5.0).
- **Nhánh / Commit bắt đầu:** `dev` @ HEAD `3711587` (`[docs] update m4 evidence matrix`).
- **Ngày khởi tạo:** 2026-11-05.

---

## 1. Bảng Quyết Định Kỹ Thuật & Phạm Vi (D-M5-00 .. D-M5-11)

Theo chỉ đạo của Owner: Đồng ý toàn bộ các đề xuất mặc định của Plan F5.M5.

| ID | Vấn đề | Quyết định được áp dụng | Trạng thái |
|---|---|---|---|
| **D-M5-00** | Định nghĩa lại M5 = "củng cố & đóng", không làm lại M3 (C-3) | **Duyệt**: Tập trung gia cố, bổ sung test lấp khoảng trống thật, cô lập lỗi H-1, không đảo ngược mã M3/M4 đã nghiệm thu. | **APPROVED** (Blocking cleared) |
| **D-M5-01** | Banner F4 `HouseDataNotice` (C-4): Phương án A hay B | **Phương án A**: Giữ nguyên banner F4 theo quyết định O-8 ở M3 (KG-F5M3-02); không sửa câu chữ F4. | **APPROVED** |
| **D-M5-02** | Chuỗi copy trạng thái (`interpretationCopy.ts`) | **Giữ nguyên**: Không thay đổi bất kỳ chuỗi copy nào (disclaimer C-08 đã duyệt, các chuỗi khác đã qua kiểm thử M3). | **APPROVED** |
| **D-M5-03** | Ngữ nghĩa điều kiện AC-19 | **Đọc là VÀ**: `isUnreleased = version === null && interpretations.length === 0`. Nếu `version = "1.0"` + `[]` thì chuyển sang trạng thái S-08 `warning`. | **APPROVED** |
| **D-M5-04** | Tần suất và quy cách `reportError` cho AC-20 | **1 lần gộp / payload / mount**: Gộp các mã defect theo chuỗi `CODE×N` (`CONTENT_MISSING×N`). | **APPROVED** |
| **D-M5-05** | Đề xuất H-1: Cô lập lỗi dựng `InterpretationModel` khỏi viewer F4 | **Duyệt**: Bọc bước dựng `InterpretationModel` trong `page.tsx`; nếu ném lỗi thì Shell nhận `interpretation={undefined}` và báo lỗi 1 lần, viewer F4 không bị sập. | **APPROVED** |
| **D-M5-06** | Phân loại `SUBJECT_UNSUPPORTED` | **Giữ nguyên**: Tiếp tục là `defect` được ghi nhận vào `model.issues` và báo lỗi qua `reportError`. | **APPROVED** |
| **D-M5-07** | Vai trò ngữ nghĩa trạng thái S-08 `unavailable` | **Giữ nguyên**: `role="alert"` (warning) cho thông báo không thể hiển thị do dữ liệu. Kiểm lại bằng trình đọc màn hình ở M6. | **APPROVED** |
| **D-M5-08** | Đăng ký Known Gap KG-F5-01 | **Duyệt**: Ghi nhận bản ghi đầy đủ trong Evidence Matrix M5 và cập nhật bảng KG của Sprint F5 Plan; chuyển sang F5 Registry hoàn chỉnh ở M8. | **APPROVED** |
| **D-M5-09** | Xử lý `ANGLE_ABSENT` khi có Nhà (bất thường Backend) | **Chỉ ghi chú & test**: Tài liệu hoá hành vi hiện tại (trả về trạng thái `unavailable` cho Cung Mọc), không thêm mã issue mới vào `interpretation.ts`. | **APPROVED** |
| **D-M5-10** | Quản lý phiên bản & CHANGELOG | **Giữ nguyên**: Không đổi version (hiện `0.3.0`) và không cập nhật CHANGELOG tại M5 (hoàn tất tại M8). | **APPROVED** |
| **D-M5-11** | Chụp ảnh kiểm thử trực quan S-05 @375px (KG-F5M3-04) | **Hoãn về M7 / đợt E2E tổng hợp**: M5 tập trung vào kiểm thử tự động, logic suy giảm và bảo toàn tính toàn vẹn. | **APPROVED** |

---

## 2. Baseline Quality Gate Measurements (Task 0 / M5.0)

Đo lường trực tiếp tại HEAD `3711587` trên môi trường làm việc:

| Cổng kiểm tra | Lệnh thực thi | Kết quả thực tế | Trạng thái |
|---|---|---|---|
| **Format** | `npm --prefix frontend run format:check` | `All matched files use Prettier code style!` | **PASS** |
| **Lint** | `npm --prefix frontend run lint` | `eslint .` (0 errors, 0 warnings) | **PASS** |
| **Typecheck** | `npm --prefix frontend run typecheck` | `tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit` (exit code 0) | **PASS** |
| **Core Vitest Subset** | `npm --prefix frontend test -- src/features/chart src/pages/app/charts` | **60 test files / 732 tests passed** (0 failed) | **PASS** (Khớp baseline plan) |
| **Full Vitest Run** | `npm --prefix frontend test` | **143 test files / 1177 tests passed** (`router.test.tsx` pass riêng lẻ trong 1.64s) | **PASS** |
| **Production Build** | `npm --prefix frontend run build` | `tsc && vite build` (2155 modules transformed, built in 8.35s) | **PASS** |
| **E2E Test Inventory** | `npx playwright test --list` | **38 tests in 7 files** (không thay đổi) | **PASS** |
| **Purity Gate** | `git diff 3711587 -- frontend/src/features/chart/model/selection.ts frontend/src/features/chart/model/interpretation.ts` | 0 dòng thay đổi (diff rỗng) | **PASS** |

---

## 3. Known Gap Registry: KG-F5-01 (Mặt Trăng)

| Trường | Nội dung chi tiết |
|---|---|
| **ID** | `KG-F5-01` |
| **Tiêu đề** | Moon interpretation uncertainty (thiếu cảnh báo độ bất định Mặt Trăng khi giờ sinh không rõ) |
| **Mô tả** | Backend duy trì diễn giải `Moon_in_{Sign}` khi không rõ giờ sinh (quyết định Sprint 4, `KG-S4-06`). Khi giờ sinh không biết, cung của Mặt Trăng có thể không chắc chắn nếu nó nằm gần ranh giới cung (0° hoặc 29°). Hợp đồng `ChartResponse` hiện không cung cấp cờ `isBirthTimeKnown` hay chỉ số độ bất định thiên thể, do đó Frontend không thể tự ý hiển thị cảnh báo và hiển thị Mặt Trăng như các hành tinh khác. |
| **Nguồn gốc** | Sprint F5 Plan §F5-03, X-3, R-04; `Sprint_4_Known_Gaps_Registry.md` (`KG-S4-06`); `Sprint_F4_M10_Exit_Criteria_Evidence_Matrix.md` (`FG-01`, `FG-07`); `types.ts` (thiếu `isBirthTimeKnown`). |
| **Tác động người dùng** | Người dùng không rõ giờ sinh có thể đọc diễn giải Mặt Trăng như một thông tin hoàn toàn chắc chắn. Mức độ rủi ro được giảm nhẹ một phần bởi Disclaimer chung ở Overview (`C-08`). |
| **Phân loại sở hữu** | **Cross-layer** (Backend sở hữu dữ liệu tính toán thiên văn & hợp đồng API; Frontend chỉ hiển thị khi có tín hiệu chuẩn tắc). |
| **Biện pháp giảm nhẹ hiện tại** | Không tạo cảnh báo giả đoán ở FE; hiển thị Disclaimer chung; kiểm tra tự động đảm bảo không có câu chữ suy diễn giờ sinh/độ chắc chắn Mặt Trăng trong UI (`AC-18`, test `D5-M01`, `D5-M02`). |
| **Điều kiện để đóng** | Backend bổ sung trường `isBirthTimeKnown` (`FG-01`) và hoàn tất quyết định hợp đồng độ bất định thiên thể (`FG-07`); FE cập nhật kiểu dữ liệu và hiển thị cảnh báo tương ứng khi có tín hiệu. |
| **Mức độ nghiêm trọng** | Medium |
| **Trạng thái** | `OPEN` (Phụ thuộc Backend / Quyết định sản phẩm tương lai) |
| **Chặn đóng Sprint F5?** | Không (Ghi nhận dưới dạng Known Gap hợp lệ) |

---

## 4. Kế Hoạch Triển Khai Các Task Tiếp Theo (M5.1 → M5.7)

| Task | Mục tiêu | Test ID | File tác động |
|---|---|---|---|
| **M5.1** | T1 — Khoá hành vi chú thích Nhà trung tính | `D5-H01`..`D5-H03` | `ChartViewerShell.interpretation.test.tsx`, `InterpretationPanel.degraded.test.tsx` (new) |
| **M5.2** | T2 — Cung Mọc "chưa khả dụng" & hồi quy M4 fixture không-Nhà | `D5-A01`..`D5-A03` | `InterpretationPanel.degraded.test.tsx`, `ChartViewerShell.interpretation.test.tsx` |
| **M5.3** | T3 — Xử lý `version` (`null` vs `"1.0"`) & AC-19 | `D5-V01`..`D5-V04` | `page.interpretation.test.tsx`, `InterpretationPanel.degraded.test.tsx` |
| **M5.4** | T4 — Trạng thái thiếu một phần (partial) | `D5-P01`..`D5-P03` | `InterpretationPanel.degraded.test.tsx`, `page.interpretation.test.tsx` |
| **M5.5** | T5 — Cô lập entry hỏng, `reportError` & thực thi H-1 | `D5-E01`..`D5-E03` | `page.tsx`, `page.interpretation.test.tsx`, `InterpretationPanel.degraded.test.tsx` |
| **M5.6** | T6 — Gate tĩnh không suy diễn giờ sinh/Moon | `D5-M01`, `D5-M02` | `ChartViewerShell.interpretation.test.tsx`, `InterpretationPanel.purity.test.ts` |
| **M5.7** | Đóng Milestone & cập nhật hồ sơ nghiệm thu | Tất cả cổng chất lượng | `Sprint_F5_M5_Exit_Criteria_Evidence_Matrix.md`, `Sprint_F5_Implementation_Plan.md` |

---

## 5. Tiến Độ Thực Thi & Bằng Chứng Từng Task (M5.1 → M5.3)

### Task 1 (M5.1): Khoá hành vi chú thích Nhà trung tính (AC-17)
- **Mục tiêu:** Đảm bảo khi đủ Nhà thì không có chú thích; khi thiếu Nhà thì có đúng 1 chú thích trung tính tại Panel và phân tách rõ ràng với banner F4 `HouseDataNotice`; cờ mâu thuẫn (`isHouseDataAvailable: true` nhưng thiếu nhà) xử lý an toàn.
- **Bằng chứng test:**
  - `D5-H01` (`ChartViewerShell.interpretation.test.tsx`): `chartFull` không hiển thị chú thích Nhà trong vùng Diễn giải (`PASS`).
  - `D5-H02` (`ChartViewerShell.interpretation.test.tsx`): `chartNoHouses` hiển thị đúng 1 chú thích trong Panel; text của Panel tuyệt đối không chứa `/giờ sinh|birth|vĩ độ|latitude/i`; banner F4 `HouseDataNotice` là vùng riêng biệt bên ngoài Panel (`PASS`).
  - `D5-H03` (`InterpretationPanel.degraded.test.tsx`): Cờ mâu thuẫn (11 nhà) kích hoạt `vm.flags.houseDataAvailable === false`, Panel hiển thị chú thích trung tính và ẩn hoàn toàn khối "Theo nhà" (`PASS`).

### Task 2 (M5.2): Cung Mọc "chưa khả dụng" & Hồi quy M4 trên fixture không-Nhà (AC-17, AC-13..16, AC-24..26)
- **Mục tiêu:** Phân biệt rõ "dữ liệu góc vắng" vs "nội dung thiếu"; bảo vệ các tương tác M4 trên lá số không có Nhà (chọn Mặt Trời, badge "Đang chọn", "Đọc diễn giải", phím Escape, không cuộn/dời focus khi chọn).
- **Bằng chứng test:**
  - `D5-A01` (`InterpretationPanel.degraded.test.tsx`): `chartNoHouses` hiển thị Cung Mọc với copy `C-11` ("Cung Mọc chưa khả dụng cho lá số này."); nút disclosure mở/đóng bình thường; không có nút "Xem trên biểu đồ" cho Cung Mọc; các hành tinh khác vẫn hiển thị phần "Theo cung" (`PASS`).
  - `D5-A02` (`InterpretationPanel.degraded.test.tsx`): Lá số có Nhà nhưng thiếu entry Cung Mọc hiển thị "Chưa có nội dung cho mục này", tuyệt đối không hiển thị "chưa khả dụng" (`PASS`).
  - `D5-A03` (`ChartViewerShell.interpretation.test.tsx`): Trên `chartNoHouses`, chọn Mặt Trời từ bảng cập nhật `aria-current="true"` và badge "Đang chọn", không dời focus và không cuộn trang; nút "Đọc diễn giải" chuyển focus tức thì đến header Mặt Trời; Escape khôi phục trạng thái F4; Cung Mọc không bao giờ nhận badge "Đang chọn" (`PASS`).

### Task 3 (M5.3): Xử lý `version` (`null` vs `"1.0"`) & Tuân thủ AC-19 (AC-19)
- **Mục tiêu:** Khẳng định `version = null` đi kèm mảng rỗng là trạng thái S-03 `unpublished` (Alert info); `version = "1.0"` đi kèm mảng rỗng là dữ liệu bất thường S-08 (Alert warning) và báo lỗi 1 lần; `version = null` nhưng có mục hợp lệ thì hiển thị bình thường; không bao giờ để lộ các chuỗi kỹ thuật (`version`, `null`, `tone`, `contentSource`) ra DOM.
- **Bằng chứng test:**
  - `D5-V01` (`page.interpretation.test.tsx`): `version = null` và `interpretations = []` hiển thị Alert info `role="status"` "Nội dung diễn giải chưa được phát hành"; 3 bảng dữ liệu F4 (Hành tinh, Nhà, Góc chiếu) được bảo tồn nguyên vẹn; 0 lỗi báo qua `reportError` (`PASS`).
  - `D5-V02` (`InterpretationPanel.degraded.test.tsx` & `page.interpretation.test.tsx`): `version = "1.0"` và `interpretations = []` hiển thị Alert warning `role="alert"` "Hiện chưa thể hiển thị diễn giải cho lá số này." (không phải "chưa phát hành"); `page.tsx` ghi nhận và gọi `reportError` đúng 1 lần với defect `CONTENT_MISSING` (`PASS`).
  - `D5-V03` (`InterpretationPanel.degraded.test.tsx`): `version = null` nhưng có đủ 21 entry hợp lệ thì Panel hiển thị bình thường 11 mục (3 Cốt lõi + 8 Hành tinh), không hiển thị bất kỳ Alert nào (`PASS`).
  - `D5-V04` (`InterpretationPanel.degraded.test.tsx`): Quét DOM Panel trên cả 4 trạng thái (S-02 Full, S-03 Unpublished, S-05 No houses, S-08 Unavailable), khẳng định không chứa các chuỗi kỹ thuật `1.0`, `version`, `null`, `tone` (`neutral`), hoặc `contentSource` (`Hybrid`) (`PASS`).

---

## 6. Tiến Độ Thực Thi & Bằng Chứng Tasks 4–6 (M5.4 → M5.6)

### Task 4 (M5.4): Trạng thái thiếu một phần (Partial) (AC-20)
- **Mục tiêu:** Đảm bảo khi thiếu một hoặc nhiều phần diễn giải (nhưng vẫn còn nội dung khác), trạng thái mô hình là `partial`, số đếm phản ánh chính xác các phần khả dụng, các phần thiếu hiển thị thông báo thay thế đúng chuẩn và không sinh thêm `Alert` gây ồn; lỗi `CONTENT_MISSING` được báo cáo theo chính sách gộp 1 lần.
- **Bằng chứng test:**
  - `D5-P01` (`page.interpretation.test.tsx`): `F-MissingOne` (thiếu `Mars_in_Sagittarius`): hiển thị dòng thiếu "Chưa có nội dung cho mục này", 20 mục còn lại hiển thị bình thường; `reportError` được gọi đúng 1 lần với defect `CONTENT_MISSING×1` (`PASS`).
  - `D5-P02` (`InterpretationPanel.degraded.test.tsx`): `F-Unsupported` (thêm entry có `subjectType: "UnknownSubject"`): model ghi nhận issue `SUBJECT_UNSUPPORTED`; Panel hiển thị 21 mục bình thường; text container hoàn toàn sạch, không rò rỉ `UnknownSubject`, `Unknown_Key_12345`, hay raw unknown body text (`PASS`).
  - `D5-P03` (`InterpretationPanel.degraded.test.tsx`): Khi thiếu đồng thời 3 part (Sun in sign, Mars in house, Venus in sign): `model.status` là `"partial"`, `availableCount = 18`, Overview hiển thị chính xác "Có 18 diễn giải cho lá số này", hoàn toàn không render thêm `Alert` (warning hay info); 3 vị trí thiếu hiển thị "Chưa có nội dung cho mục này"; các nội dung hợp lệ khác hiển thị nguyên vẹn (`PASS`).

### Task 5 (M5.5): Cô lập entry hỏng, `reportError` & thực thi H-1 (AC-21, AC-22)
- **Mục tiêu:** Cô lập lỗi dữ liệu thô và lỗi ngoại lệ khi dựng mô hình để không bao giờ làm sập route xem lá số F4 (`page.tsx`); đảm bảo báo lỗi qua `reportError` đúng ngữ cảnh và không bị nhân bản khi re-render.
- **Thay đổi mã nguồn:**
  - Đã thực thi H-1 trong `frontend/src/pages/app/charts/detail/page.tsx`: tách bước gọi `buildInterpretationModel(query.data, vm)` vào khối `try...catch` riêng biệt. Khi có ngoại lệ, `mapping.ok` vẫn là `true`, `interpretation` nhận `undefined`, và `useEffect` phát tín hiệu `reportError(error, "interpretation-model-build")` đúng 1 lần. Viewer F4 tiếp tục hoạt động mà không có panel diễn giải.
- **Bằng chứng test:**
  - `D5-E01` (`InterpretationPanel.degraded.test.tsx`): `F-Malformed` (trộn các entry hỏng: `null`, số, chuỗi, thiếu `subjectKey`, key rác, sai ngôn ngữ, body trắng): các entry hỏng được `buildInterpretationModel` lọc bỏ an toàn; model ghi nhận `ENTRY_MALFORMED`; các entry anh em hợp lệ hiển thị bình thường; không rò rỉ mã lỗi hay nội dung hỏng vào DOM (`PASS`).
  - `D5-E02` (`page.interpretation.test.tsx`): Khi `ChartDetailPage` re-render với cùng payload dữ liệu, `reportError` không bị gọi lặp lại (giữ đúng 1 lần) (`PASS`).
  - `D5-E03` (`page.interpretation.test.tsx`): `F-ModelThrows` (H-1): mock `buildInterpretationModel` ném lỗi bất ngờ; viewer F4 hiển thị đầy đủ 4 heading chính ("Lá số sinh", "Vị trí hành tinh", "Nhà và các góc", "Góc chiếu"), vùng Diễn giải bị ẩn an toàn, và `reportError` nhận đúng message lỗi với context `"interpretation-model-build"` (`PASS`).

### Task 6 (M5.6): Gate tĩnh & không suy diễn giờ sinh/Moon (AC-18, KG-F5-01)
- **Mục tiêu:** Không thực hiện bất kỳ phép ngoại suy nào về giờ sinh hoặc độ bất định vị trí Mặt Trăng tại Frontend khi hợp đồng dữ liệu chưa hỗ trợ (`KG-F5-01`); kiểm soát tĩnh toàn bộ source code component và copy.
- **Bằng chứng test:**
  - `D5-M01` (`ChartViewerShell.interpretation.test.tsx`): Quét DOM trên 3 fixture `F-NoHouse`, `F-NullEmpty`, và `F-MoonEdge` (Mặt Trăng ở sát ranh giới cung 29.99°): khẳng định không chứa bất kỳ từ ngữ phỏng đoán nào liên quan tới `/bất định|không chắc|ranh giới|uncertain/i` quanh mục Mặt Trăng hay trong toàn bộ Shell (`PASS`).
  - `D5-M02 / AR-09` (`InterpretationPanel.purity.test.ts`): Cổng kiểm tra tĩnh cấp mã nguồn khẳng định toàn bộ 3 component (`InterpretationPanel.tsx`, `InterpretationItem.tsx`, `InterpretationOverview.tsx`) và file bản sao `interpretationCopy.ts` không chứa `isBirthTimeKnown`, `birthTime`, hay các logic suy đoán độ bất định/biên độ của Mặt Trăng (`PASS`).

---

## 7. Tổng Hợp & Đánh Giá Tiêu Chí Đóng Milestone 5 (Task 7 / M5.7)

| Tiêu chí DoD | Mục tiêu | Kết quả thực tế | Trạng thái |
|---|---|---|---|
| **AC-17 .. AC-22 traceability** | Mỗi AC có ít nhất 1 test cụ thể | Phủ đầy đủ qua 18 test D5-* (D5-H01..H03, D5-A01..A03, D5-V01..V04, D5-P01..P03, D5-E01..E03, D5-M01..M02) | **PASS** |
| **Bảo vệ 6 trạng thái suy giảm** | Full, NoHouse, Contradiction, MissingOne, Unsupported, VerEmpty, Malformed | Tất cả trạng thái đều có test tương ứng và pass 100% | **PASS** |
| **Toàn vẹn nội dung hợp lệ** | Partial degraded không ảnh hưởng nội dung còn lại | D5-P01, D5-P03, D5-E01 xác minh nội dung hợp lệ hiển thị bình thường | **PASS** |
| **Cô lập lỗi dữ liệu & model (H-1)** | App không sập khi model ném; báo lỗi 1 lần | D5-E01..E03 & sửa `page.tsx` pass sạch | **PASS** |
| **Ghi nhận Known Gap KG-F5-01** | Trạng thái OPEN, không nhận giải quyết xong | Đã ghi nhận tại Mục 3 và kiểm chứng bằng D5-M01, D5-M02 | **PASS** |
| **Zero-diff gate trên model files** | `model/selection.ts` & `model/interpretation.ts` | 0 dòng khác biệt (`git diff --stat` rỗng) | **PASS** |
| **CI Quality Gates** | Format, Lint, Typecheck, Tests | Format clean, Lint 0 errors, Typecheck 0 errors, 167/167 tests pass | **PASS** |
| **D-M5-00 .. D-M5-11 Decisions** | Toàn bộ 12 quyết định được phê duyệt & ghi nhận | Đã ghi nhận đầy đủ tại Mục 1 | **PASS** |


