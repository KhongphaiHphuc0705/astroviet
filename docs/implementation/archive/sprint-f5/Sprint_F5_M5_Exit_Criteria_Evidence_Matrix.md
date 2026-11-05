# Sprint F5 — M5 Exit Criteria & Evidence Matrix
## Degraded States & Copy Consolidation

- **Vị trí lưu trữ:** `docs/implementation/archive/sprint-f5/Sprint_F5_M5_Exit_Criteria_Evidence_Matrix.md`
- **Phạm vi:** F5-M5.0 → M5.7 (Xác minh & củng cố 6 trạng thái suy giảm, bảo vệ không hồi quy M3/M4, cô lập lỗi dựng model H-1, đăng ký đầy đủ Known Gap KG-F5-01, 18 test mới D5-*, thực thi các quyết định D-M5-00..D-M5-11).
- **Trạng thái:** `COMPLETED` (Hoàn thành 100% các tiêu chí đóng Milestone M5.0 → M5.7).
- **Nhánh / Commit hoàn thành:** `dev` `622ad14` (`[refactor] resolved inconsistencies in code & test enhancement`).
- **Evidence CI Run:** [Run #42035307766](https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/42035307766)
- **Ngày hoàn thành:** 2026-11-05.

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
| **Full Vitest Run** | `npm --prefix frontend test` | **144 test files / 1178 tests passed** (0 failed, duration ~280s) | **PASS** |
| **Production Build** | `npm --prefix frontend run build` | `tsc && vite build` (2155 modules transformed, built in 8.35s) | **PASS** |
| **E2E Test Inventory** | `npx playwright test --list` | **38 tests in 7 files** (không thay đổi) | **PASS** |
| **Zero Diff Gate** | `git diff 3711587..HEAD -- frontend/src/features/chart/model/selection.ts frontend/src/features/chart/model/interpretation.ts` | 0 dòng thay đổi (diff rỗng) | **PASS** |

> [!NOTE] Ghi chú về tính ổn định của kiểm thử (Test Stability Note)
> Khi chạy toàn bộ test suite (144–145 file) trên môi trường Windows với mức tải cao, Vitest có thể gặp hiện tượng worker contention khiến file `router.test.tsx` (13 tests) bị timeout nếu chạy song song. Khi chạy đơn lẻ, `router.test.tsx` hoàn thành ổn định trong ~1.6s. Đây là hiện tượng flake phụ thuộc tài nguyên phần cứng cục bộ, không phải lỗi logic ứng dụng.

---

## 3. Known Gap Registry (Tình Trạng Tại M5)

### 3.1 Bảng Tổng Hợp Các Known Gap Còn Mở

| ID | Tiêu đề | Phân loại | Trạng thái tại M5 | Lý do / Biện pháp giảm nhẹ |
|---|---|---|---|---|
| **KG-F5-01** | Moon interpretation uncertainty (thiếu cờ độ bất định Mặt Trăng) | Cross-layer (Backend) | **OPEN** | Hợp đồng API chưa có `isBirthTimeKnown`/độ bất định. Frontend không tự suy đoán; hiển thị Disclaimer chung (`C-08`). |
| **KG-F5M3-02** | Phân kỳ câu chữ `HouseDataNotice` F4 | Frontend UX | **OPEN** | Giữ nguyên banner F4 theo quyết định O-8 ở M3 và D-M5-01; bảo vệ tính ổn định F4. |
| **KG-F5M3-04** | Kiểm thử trực quan S-05 @375px màn hình hẹp | Testing / Manual | **OPEN** | Hoãn về M7 theo quyết định D-M5-11 để thực hiện chung với đợt chụp ảnh E2E toàn diện. |

---

### 3.2 Chi Tiết Known Gap: KG-F5-01 (Mặt Trăng)

| Trường | Nội dung chi tiết |
|---|---|
| **ID** | `KG-F5-01` |
| **Tiêu đề** | Moon interpretation uncertainty (thiếu cảnh báo độ bất định Mặt Trăng khi giờ sinh không rõ) |
| **Mô tả** | Backend duy trì diễn giải `Moon_in_{Sign}` khi không rõ giờ sinh (quyết định Sprint 4, `KG-S4-06`). Khi giờ sinh không biết, cung của Mặt Trăng có thể không chắc chắn nếu nó nằm gần ranh giới cung. Hợp đồng `ChartResponse` hiện không cung cấp cờ `isBirthTimeKnown` hay chỉ số độ bất định thiên thể, do đó Frontend không thể tự ý hiển thị cảnh báo và hiển thị Mặt Trăng như các hành tinh khác. Ngưỡng xác định ranh giới được nhường quyền quyết định cho Backend (`FG-07`). |
| **Nguồn gốc** | Sprint F5 Plan §F5-03, X-3, R-04; `Sprint_4_Known_Gaps_Registry.md` (`KG-S4-06`); `Sprint_F4_M10_Exit_Criteria_Evidence_Matrix.md` (`FG-01`, `FG-07`); `types.ts` (thiếu `isBirthTimeKnown`). |
| **Tác động người dùng** | Người dùng không rõ giờ sinh có thể đọc diễn giải Mặt Trăng như một thông tin hoàn toàn chắc chắn. Mức độ rủi ro được giảm nhẹ một phần bởi Disclaimer chung ở Overview (`C-08`). |
| **Phân loại sở hữu** | **Cross-layer** (Backend sở hữu dữ liệu tính toán thiên văn & hợp đồng API; Frontend chỉ hiển thị khi có tín hiệu chuẩn tắc). |
| **Biện pháp giảm nhẹ hiện tại** | Không tạo cảnh báo giả đoán ở FE; hiển thị Disclaimer chung; kiểm tra tự động đảm bảo không có câu chữ suy diễn giờ sinh/độ chắc chắn Mặt Trăng trong UI (`AC-18`, test `D5-M01`, `D5-M02`). |
| **Điều kiện để đóng** | Backend bổ sung trường `isBirthTimeKnown` (`FG-01`) và hoàn tất quyết định hợp đồng độ bất định thiên thể (`FG-07`); FE cập nhật kiểu dữ liệu và hiển thị cảnh báo tương ứng khi có tín hiệu. |
| **Mức độ nghiêm trọng** | Medium |
| **Trạng thái** | `OPEN` (Phụ thuộc Backend / Quyết định sản phẩm tương lai) |
| **Chặn đóng Sprint F5?** | Không (Ghi nhận dưới dạng Known Gap hợp lệ) |

---

## 4. Cấu Trúc Triển Khai Các Task (M5.1 → M5.7)

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
  - `D5-A03` (`ChartViewerShell.interpretation.test.tsx`): Trên `chartNoHouses`, chọn Mặt Trời từ bảng cập nhật `aria-current="true"` và badge "Đang chọn", không dời focus và không cuộn trang; nút "Đọc diễn giải" chuyển focus tức thì đến header Mặt Trời; phím Escape khôi phục trạng thái F4 (xác minh có nút "Bỏ chọn" trước khi Escape); Cung Mọc không bao giờ nhận badge "Đang chọn". Sử dụng khối `try...finally` phục hồi nguyên bản `window.HTMLElement.prototype.scrollIntoView` sau kiểm thử (`PASS`).

### Task 3 (M5.3): Xử lý `version` (`null` vs `"1.0"`) & Tuân thủ AC-19 (AC-19)
- **Mục tiêu:** Khẳng định `version = null` đi kèm mảng rỗng là trạng thái S-03 `unpublished` (Alert info); `version = "1.0"` đi kèm mảng rỗng là dữ liệu bất thường S-08 (Alert warning) và báo lỗi 1 lần; `version = null` nhưng có mục hợp lệ thì hiển thị bình thường; không bao giờ để lộ các chuỗi kỹ thuật (`version`, `null`, `tone`, `contentSource`) ra DOM.
- **Bằng chứng test:**
  - `D5-V01` (`page.interpretation.test.tsx`): `version = null` và `interpretations = []` hiển thị Alert info `role="status"` "Nội dung diễn giải chưa được phát hành"; 3 bảng dữ liệu F4 (Hành tinh, Nhà, Góc chiếu) được bảo tồn nguyên vẹn; 0 lỗi báo qua `reportError` (`PASS`).
  - `D5-V02` (`InterpretationPanel.degraded.test.tsx` & `page.interpretation.test.tsx`): `version = "1.0"` và `interpretations = []` hiển thị Alert warning `role="alert"` "Hiện chưa thể hiển thị diễn giải cho lá số này." (không phải "chưa phát hành"); `page.tsx` ghi nhận và gọi `reportError` đúng 1 lần với defect `CONTENT_MISSING` (`PASS`).
  - `D5-V03` (`InterpretationPanel.degraded.test.tsx`): `version = null` nhưng có đủ 21 diễn giải hợp lệ thì Panel hiển thị bình thường 11 mục (3 Cốt lõi + 8 Hành tinh), không hiển thị bất kỳ Alert nào (`PASS`).
  - `D5-V04` (`InterpretationPanel.degraded.test.tsx`): Quét DOM Panel trên cả 4 trạng thái (S-02 Full, S-03 Unpublished, S-05 No houses, S-08 Unavailable), khẳng định không chứa các chuỗi kỹ thuật `1.0`, `version`, `null`, `tone` (`neutral`), hoặc `contentSource` (`Hybrid`) (`PASS`).

---

## 6. Tiến Độ Thực Thi & Bằng Chứng Tasks 4–6 (M5.4 → M5.6)

### Task 4 (M5.4): Trạng thái thiếu một phần (Partial) (AC-20)
- **Mục tiêu:** Đảm bảo khi thiếu một hoặc nhiều phần diễn giải (nhưng vẫn còn nội dung khác), trạng thái mô hình là `partial`, số đếm phản ánh chính xác các phần khả dụng, các phần thiếu hiển thị thông báo thay thế đúng chuẩn và không sinh thêm `Alert` gây ồn; lỗi `CONTENT_MISSING` được báo cáo theo chính sách gộp 1 lần.
- **Bằng chứng test:**
  - `D5-P01` (`page.interpretation.test.tsx`): `F-MissingOne` (thiếu `Mars_in_Sagittarius`): hiển thị dòng thiếu "Chưa có nội dung cho mục này", 20 diễn giải còn lại (10 mục kia và phần nhà của Sao Hỏa) hiển thị bình thường; `reportError` được gọi đúng 1 lần với defect `CONTENT_MISSING×1` (`PASS`).
  - `D5-P02` (`InterpretationPanel.degraded.test.tsx`): `F-Unsupported` (thêm entry có `subjectType: "UnknownSubject"`): model ghi nhận issue `SUBJECT_UNSUPPORTED`; Panel hiển thị 11 mục (21 diễn giải) bình thường; text container hoàn toàn sạch, không rò rỉ `UnknownSubject`, `Unknown_Key_12345`, hay raw unknown body text (`PASS`).
  - `D5-P03` (`InterpretationPanel.degraded.test.tsx`): Khi thiếu đồng thời 3 phần (Sun in sign, Mars in house, Venus in sign): `model.status` là `"partial"`, `availableCount = 18`, Overview hiển thị chính xác "Có 18 diễn giải cho lá số này", hoàn toàn không render thêm `Alert` (warning hay info); 3 vị trí thiếu hiển thị "Chưa có nội dung cho mục này"; các nội dung hợp lệ khác hiển thị nguyên vẹn (`PASS`).

### Task 5 (M5.5): Cô lập entry hỏng, `reportError` & thực thi H-1 (AC-21, AC-22)
- **Mục tiêu:** Cô lập lỗi dữ liệu thô và lỗi ngoại lệ khi dựng mô hình để không bao giờ làm sập route xem lá số F4 (`page.tsx`); đảm bảo báo lỗi qua `reportError` đúng ngữ cảnh, hỗ trợ cả trường hợp ngoại lệ ném ra không phải Error chuẩn (falsy throws), và không bị nhân bản khi re-render hoặc refetch query.
- **Thay đổi mã nguồn:**
  - Đã thực thi H-1 trong `frontend/src/pages/app/charts/detail/page.tsx`:
    - Tách bước gọi `buildInterpretationModel(query.data, vm)` vào khối `try...catch` riêng biệt với cờ boolean `interpretationBuildFailed`. Khi có ngoại lệ (kể cả falsy throw như `undefined`, `null`, `""`), `mapping.ok` vẫn là `true`, `interpretation` nhận `undefined`.
    - Sử dụng `lastReportedInterpretationSignatureRef = useRef<string | null>(null)` theo phạm vi component mount để ngăn việc gọi `reportError` lặp lại khi component re-render hoặc query refetch nhận lại payload cũ/mới giống nhau.
    - Viewer F4 tiếp tục hoạt động đầy đủ mà không có panel diễn giải.
- **Bằng chứng test:**
  - `D5-E01` (`InterpretationPanel.degraded.test.tsx`): `F-Malformed` (trộn các entry hỏng: `null`, số, chuỗi, thiếu `subjectKey`, key rác, sai ngôn ngữ, body trắng): các entry hỏng được `buildInterpretationModel` lọc bỏ an toàn; model ghi nhận `ENTRY_MALFORMED`; các entry anh em hợp lệ hiển thị bình thường; không rò rỉ mã lỗi hay nội dung hỏng vào DOM (`PASS`).
  - `D5-E02` (`page.interpretation.test.tsx`): Kiểm tra cả hai kịch bản: khi `ChartDetailPage` re-render cây component và khi TanStack Query thực hiện `refetchQueries()` trả về cùng payload dữ liệu, `reportError` không bị gọi lặp lại (giữ đúng 1 lần duy nhất) (`PASS`).
  - `D5-E03` (`page.interpretation.test.tsx`): `F-ModelThrows` (H-1): mock `buildInterpretationModel` ném lỗi bất ngờ; viewer F4 hiển thị đầy đủ 4 heading chính ("Lá số sinh", "Vị trí hành tinh", "Nhà và các góc", "Góc chiếu"), vùng Diễn giải bị ẩn an toàn, và `reportError` nhận đúng message lỗi với context `"interpretation-model-build"` (`PASS`).

### Task 6 (M5.6): Gate tĩnh & không suy diễn giờ sinh/Moon (AC-18, KG-F5-01)
- **Mục tiêu:** Không thực hiện bất kỳ phép ngoại suy nào về giờ sinh hoặc độ bất định vị trí Mặt Trăng tại Frontend khi hợp đồng dữ liệu chưa hỗ trợ (`KG-F5-01`); kiểm soát tĩnh toàn bộ source code component và copy.
- **Bằng chứng test:**
  - `D5-M01` (`ChartViewerShell.interpretation.test.tsx`):
    - Đã chuẩn hoá fixture `F-MoonEdge`: Mặt Trăng ở 29.99° Bảo Bình (`sign: "Aquarius"`, `longitude: 329.99`, `degreeInSign: 29.99`). Khẳng định đoạn diễn giải Mặt Trăng ở Bảo Bình vẫn hiển thị đầy đủ nội dung (`Mặt Trăng ở Bảo Bình`), không hiển thị trạng thái thiếu.
    - Quét DOM trên cả 3 fixture `F-NoHouse`, `F-NullEmpty`, và `F-MoonEdge`: khẳng định không chứa bất kỳ từ ngữ phỏng đoán nào liên quan tới `/bất định|không chắc|ranh giới|uncertain/i` quanh mục Mặt Trăng hay trong toàn bộ Shell (`PASS`).
  - `D5-M02 / AR-09` (`InterpretationPanel.purity.test.ts`): Cổng kiểm tra tĩnh cấp mã nguồn (source-level regex gate) đọc nội dung tệp trực tiếp và khẳng định toàn bộ 3 component (`InterpretationPanel.tsx`, `InterpretationItem.tsx`, `InterpretationOverview.tsx`) và file bản sao `interpretationCopy.ts` không chứa `isBirthTimeKnown`, `birthTime`, hay các logic suy đoán độ bất định/biên độ của Mặt Trăng (`PASS`).

---

## 7. Bằng Chứng "Đỏ-Trước-Xanh" Cho Bộ Test D5-* (Red-Before-Green Verification)

Theo yêu cầu của DoD §12 và bài học rút ra từ F3-M7, mọi kiểm thử mới D5-* đều được thiết kế để phát hiện đúng lỗi (fail) khi logic bị thiếu hoặc bị vi phạm, trước khi được xác nhận pass.

| Test ID | Tệp kiểm thử | Hành vi kiểm tra (Điều kiện thất bại / Red condition) | Kết quả kiểm tra (Green) |
|---|---|---|---|
| `D5-H01` | `ChartViewerShell.interpretation.test.tsx` | Fail nếu xuất hiện chú thích thiếu Nhà khi lá số có đủ 12 nhà. | **PASS** (Không render notice) |
| `D5-H02` | `ChartViewerShell.interpretation.test.tsx` | Fail nếu thiếu notice Nhà khi không có nhà, hoặc notice chứa từ ngữ giờ sinh/vĩ độ, hoặc đè lên banner F4. | **PASS** (Notice trung tính duy nhất tại Panel) |
| `D5-H03` | `InterpretationPanel.degraded.test.tsx` | Fail nếu cờ mâu thuẫn (11 nhà) vẫn render phần "Theo nhà" hoặc không hiện notice trung tính. | **PASS** (Ẩn Theo nhà, hiện notice) |
| `D5-A01` | `InterpretationPanel.degraded.test.tsx` | Fail nếu Cung Mọc hiện copy thiếu thay vì chưa khả dụng, hoặc có nút "Xem trên biểu đồ", hoặc mất phần Theo cung của các hành tinh. | **PASS** (Copy C-11, không nút xem) |
| `D5-A02` | `InterpretationPanel.degraded.test.tsx` | Fail nếu lá số có nhà mà Cung Mọc thiếu entry lại hiện copy "chưa khả dụng". | **PASS** (Hiện "Chưa có nội dung cho mục này") |
| `D5-A03` | `ChartViewerShell.interpretation.test.tsx` | Fail nếu chọn hành tinh trên lá số không-Nhà làm dời focus/cuộn trang, hoặc nút Đọc diễn giải không focus header, hoặc Escape không huỷ chọn, hoặc Cung Mọc nhận badge chọn. | **PASS** (Toàn vẹn hành vi M4) |
| `D5-V01` | `page.interpretation.test.tsx` | Fail nếu `version=null & []` không hiện S-03 info alert, hoặc làm mất bảng F4, hoặc gọi `reportError`. | **PASS** (S-03 info, 0 error report) |
| `D5-V02` | `page.interpretation.test.tsx` & `InterpretationPanel.degraded.test.tsx` | Fail nếu `version="1.0" & []` hiện S-03 thay vì S-08 warning alert, hoặc không báo lỗi `CONTENT_MISSING`. | **PASS** (S-08 warning, báo lỗi đúng 1 lần) |
| `D5-V03` | `InterpretationPanel.degraded.test.tsx` | Fail nếu `version=null` nhưng có đủ 21 entry mà lại hiển thị alert thay vì render bình thường 11 mục. | **PASS** (Render 11 mục, không alert) |
| `D5-V04` | `InterpretationPanel.degraded.test.tsx` | Fail nếu DOM chứa bất kỳ từ khoá kỹ thuật nội bộ nào (`version`, `null`, `tone`, `contentSource`). | **PASS** (DOM hoàn toàn sạch chuỗi kỹ thuật) |
| `D5-P01` | `page.interpretation.test.tsx` | Fail nếu thiếu 1 entry mà 20 entry khác bị mất, hoặc không hiện thông báo thiếu tại chỗ, hoặc `reportError` sai mã defect. | **PASS** (Bảo toàn nội dung khác, báo lỗi đúng) |
| `D5-P02` | `InterpretationPanel.degraded.test.tsx` | Fail nếu entry lạ không ghi nhận `SUBJECT_UNSUPPORTED`, hoặc làm hỏng render, hoặc rò rỉ text lạ vào DOM. | **PASS** (Cô lập entry lạ, DOM sạch) |
| `D5-P03` | `InterpretationPanel.degraded.test.tsx` | Fail nếu thiếu 3 part mà status không phải `partial`, hoặc Overview đếm sai số lượng (không phải 18), hoặc sinh thêm Alert. | **PASS** (Đếm đúng 18, không sinh thêm Alert) |
| `D5-E01` | `InterpretationPanel.degraded.test.tsx` | Fail nếu entry hỏng làm throw exception ở model parser hoặc rò rỉ mã lỗi/body rác ra giao diện. | **PASS** (Lọc bỏ an toàn, DOM sạch) |
| `D5-E02` | `page.interpretation.test.tsx` | Fail nếu re-render hoặc query refetch với cùng payload gọi `reportError` nhiều hơn 1 lần. | **PASS** (Chặn nhân bản cuộc gọi báo lỗi) |
| `D5-E03` | `page.interpretation.test.tsx` | Fail nếu parser throw làm sập toàn bộ route xem lá số F4 hoặc không báo lỗi với context `interpretation-model-build`. | **PASS** (Viewer F4 nguyên vẹn, báo lỗi đúng context) |
| `D5-M01` | `ChartViewerShell.interpretation.test.tsx` | Fail nếu fixture `F-MoonEdge` bị mất nội dung Mặt Trăng, hoặc xuất hiện từ ngữ phỏng đoán bất định/ranh giới trong Shell. | **PASS** (Hiện nội dung Mặt Trăng, không phỏng đoán) |
| `D5-M02` | `InterpretationPanel.purity.test.ts` | Fail nếu mã nguồn UI interpretation chứa tham chiếu tới `isBirthTimeKnown` hoặc logic suy đoán Mặt Trăng. | **PASS** (Source sạch hoàn toàn) |

---

## 8. Ma Trận Truy Vết Yêu Cầu Chấp Nhận (Acceptance Criteria Traceability Matrix)

| Tiêu chí | Mô tả tiêu chí | Các test kiểm chứng trực tiếp | Trạng thái |
|---|---|---|---|
| **AC-17** | Toàn vẹn trạng thái thiếu Nhà / góc vắng (Cung Mọc unavailable, chú thích Nhà trung tính duy nhất, phân tách banner F4, bảo vệ chọn M4). | `D5-H01`, `D5-H02`, `D5-H03`, `D5-A01`, `D5-A02`, `D5-A03` | **PASS** |
| **AC-18** | Không suy diễn giờ sinh hoặc độ bất định vị trí Mặt Trăng tại Frontend (`KG-F5-01`). | `D5-M01`, `D5-M02 / AR-09` | **PASS** |
| **AC-19** | Phân biệt chính xác `version === null` (S-03 unpublished, info) vs `version !== null` rỗng (S-08 unavailable, warning + defect); DOM sạch chuỗi kỹ thuật. | `D5-V01`, `D5-V02`, `D5-V03`, `D5-V04` | **PASS** |
| **AC-20** | Trạng thái thiếu một phần (Partial) hiển thị thông báo thiếu tại chỗ, số đếm phản ánh chính xác mục khả dụng, không sinh Alert phụ, báo lỗi gộp 1 lần. | `D5-P01`, `D5-P02`, `D5-P03` | **PASS** |
| **AC-21** | Lọc bỏ an toàn entry hỏng/lạ, báo lỗi đúng mã defect và deduplicate qua re-render và refetch. | `D5-E01`, `D5-E02` | **PASS** |
| **AC-22** | Lỗi API chart đi theo flow F4 hiện có; cô lập lỗi ném ra từ `buildInterpretationModel` (H-1) giúp viewer F4 giữ nguyên vẹn. | `PG-05` (page.interpretation.test.tsx), `D5-E03` | **PASS** |

---

## 9. Báo Cáo Độ Phủ Mã Nguồn Từng File (Code Coverage Report)

Đo lường trực tiếp bằng Vitest V8 Coverage trên các tệp thuộc phạm vi M5:

```bash
npm --prefix frontend test -- --coverage \
  --coverage.include=src/pages/app/charts/detail/page.tsx \
  --coverage.include=src/features/chart/ui/InterpretationPanel/** \
  src/pages/app/charts/detail/page.interpretation.test.tsx \
  src/features/chart/ui/InterpretationPanel/
```

| Tệp nguồn | % Statements | % Branch | % Functions | % Lines | Dòng chưa phủ & Giải trình |
|---|---|---|---|---|---|
| `src/pages/app/charts/detail/page.tsx` | **80.64%** | **74.24%** | **76.92%** | **81.81%** | L201, 213-221, 238: Các nhánh fallback loading/lỗi ngoài F4 chart route đã được bảo vệ bởi test suite F4. Nhánh H-1 interpretation được phủ 100%. |
| `InterpretationPanel.tsx` | **90.90%** | **84.78%** | **94.73%** | **97.72%** | L175: Nhánh fallback an toàn khi model trống rỗng. |
| `InterpretationItem.tsx` | **87.50%** | **91.17%** | **100.00%** | **92.85%** | L38: `return ""` khi không có dữ liệu nhà (nhánh `HOUSE_DATA_UNAVAILABLE` đã ẩn khối giao diện). |
| `InterpretationOverview.tsx` | **100.00%** | **100.00%** | **100.00%** | **100.00%** | Phủ toàn diện 100% tất cả các câu lệnh và nhánh. |
| `interpretationCopy.ts` | **100.00%** | **100.00%** | **100.00%** | **100.00%** | Phủ toàn diện 100% tất cả các câu lệnh và hàm format. |
| **Tổng thể phạm vi M5** | **85.87%** | **83.01%** | **91.30%** | **88.67%** | **Vượt xa ngưỡng tối thiểu 80% của toàn bộ dự án.** |

---

## 10. Tổng Hợp & Đánh Giá Tiêu Chí Đóng Milestone 5 (Task 7 / M5.7)

### 10.1 Kết Quả Đo Lường Các Cổng Chất Lượng (Quality Gate Measurements)

| Cổng kiểm tra | Lệnh thực thi | Kết quả thực tế đo được | Trạng thái |
|---|---|---|---|
| **Zero Diff Gate** | `git diff 3711587..HEAD -- frontend/src/features/chart/model/selection.ts frontend/src/features/chart/model/interpretation.ts` | **0 dòng khác biệt (Diff hoàn toàn rỗng)** | **PASS** |
| **Format** | `npm --prefix frontend run format:check` | `All matched files use Prettier code style!` | **PASS** |
| **Lint** | `npm --prefix frontend run lint` | `eslint .` (0 errors, 0 warnings) | **PASS** |
| **Typecheck** | `npm --prefix frontend run typecheck` | `tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit` (0 errors, exit code 0) | **PASS** |
| **Chart & Pages Vitest Run** | `npm --prefix frontend test -- src/features/chart src/pages/app/charts` | **61 test files / 751 tests passed** (0 failed, 100% xanh) | **PASS** |
| **Full Frontend Vitest Run** | `npm --prefix frontend test` | **145 test files / 1197 tests passed** (+1 file `InterpretationPanel.degraded.test.tsx`, +19 tests) | **PASS** |
| **Production Build** | `npm --prefix frontend run build` | `tsc && vite build` (2155 modules transformed, built in 7.75s, gzip size chuẩn) | **PASS** |
| **Playwright Inventory** | `npx playwright test --list` (tại `frontend/`) | **38 tests trong 7 files** (không thay đổi, không thêm E2E ở M5) | **PASS** |
| **Purity / Grep Gate** | Quét `dangerouslySetInnerHTML` và `isBirthTimeKnown` trong vùng interpretation | Không phát hiện mã rò rỉ; chỉ xuất hiện trong các câu lệnh assert kiểm thử | **PASS** |

---

### 10.2 Đánh Giá Chi Tiết Theo Definition of Done (DoD §12)

| # | Tiêu chí DoD | Yêu cầu | Bằng chứng đối chiếu | Đánh giá |
|---|---|---|---|---|
| 1 | **AC-17 .. AC-22 Traceability** | Mỗi AC có ít nhất 1 test cụ thể mang tên rõ | Phủ đầy đủ qua 18 test D5-* và PG-05 (xem Mục 8) | **ĐẠT** |
| 2 | **Phủ 6 Trạng Thái Suy Giảm** | F-Full, F-NoHouse, F-Contradiction, F-MissingOne, F-Unsupported, F-VerEmpty, F-Malformed | Có fixture rõ ràng, logic phân nhánh chính xác và test pass 100% | **ĐẠT** |
| 3 | **Toàn Vẹn Nội Dung Hợp Lệ** | Trạng thái suy giảm một phần không làm ảnh hưởng nội dung khả dụng khác | D5-P01, D5-P03, D5-E01 xác minh các nội dung hợp lệ vẫn render đầy đủ, số đếm phản ánh chính xác | **ĐẠT** |
| 4 | **Cô Lập Lỗi Dữ Liệu & Model (H-1)** | Lỗi dữ liệu/mô hình không làm sập viewer F4; báo lỗi đúng 1 lần; xử lý falsy throws và deduplicate refetch | H-1 trong `page.tsx` và test D5-E01..E03 xác minh F4 viewer giữ nguyên vẹn khi model ném lỗi | **ĐẠT** |
| 5 | **Đăng Ký Known Gap KG-F5-01** | Bản ghi đầy đủ, trạng thái OPEN, không tuyên bố đã giải quyết, định nghĩa ranh giới khách quan | Đã ghi nhận chi tiết tại Mục 3 của Matrix và Mục 15.3 của F5 Implementation Plan | **ĐẠT** |
| 6 | **Zero Diff Gate** | Diff rỗng trên 2 file lõi `selection.ts` và `interpretation.ts` | `git diff 3711587..HEAD` trả về 0 diff | **ĐẠT** |
| 7 | **Hồi Quy M3/M4 Xanh** | Không làm hỏng hoặc sửa đổi kỳ vọng của test M3/M4 | 751 tests thuộc `features/chart` và `pages/app/charts` pass 100% | **ĐẠT** |
| 8 | **CI Quality Gates** | Format, Lint, Typecheck, Build, Vitest toàn bộ xanh | Toàn bộ các lệnh CI thực thi với exit code 0 | **ĐẠT** |
| 9 | **Không Suy Diễn Giờ Sinh / Mặt Trăng** | Không có mã ngoại suy ở Frontend khi API chưa có metadata | D5-M01 (Shell quét DOM với fixture 29.99° Bảo Bình) và D5-M02 / AR-09 (source-level regex gate) | **ĐẠT** |
| 10 | **Kiểm Soát Quyết Định Kỹ Thuật** | Ghi nhận đầy đủ 12 quyết định D-M5-00 .. D-M5-11 | Mục 1 đã ghi nhận chi tiết toàn bộ quyết định | **ĐẠT** |
