# Sprint F5 — M5: Degraded States & Copy — Implementation Plan

| | |
|---|---|
| **Dự án** | AstroViet — Frontend Sprint F5 (Interpretation UI) |
| **Milestone** | F5.M5 — Trạng thái suy giảm & copy |
| **Trạng thái tài liệu** | **PLAN — chờ Owner duyệt**; chưa triển khai, chưa sửa mã/test/fixture/config |
| **Repo / nhánh đã audit** | `KhongphaiHphuc0705/astroviet`, nhánh `dev`, HEAD `3711587` ("[docs] update m4 evidence matrix") — clone mới, đọc mã thật |
| **Ngày lập** | 2026-11-05 |
| **Vị trí lưu đề xuất** | `docs/implementation/Sprint_F5_M5_Implementation_Plan.md` (plan tạm; xoá sau khi M5 đóng, chỉ lưu Evidence Matrix — theo quy ước đã chốt ở Sprint 4/M4) |

**Nhãn độ tin cậy dùng xuyên suốt**

| Nhãn | Nghĩa |
|---|---|
| **[VF]** | Verified fact — có trong mã, test, hợp đồng hoặc tài liệu đã duyệt (kèm đường dẫn) |
| **[AD]** | Approved decision — đã được Owner ghi nhận là duyệt |
| **[REC]** | Recommendation — đề xuất, **chưa** duyệt |
| **[UNK]** | Unknown — chưa đủ bằng chứng; cần làm rõ |

---

## 1. Executive Summary

### 1.1 Phát hiện quan trọng nhất

**Phần lớn nội dung M5 trong F5 plan đã được giao ở M3 và đã nghiệm thu** [VF]. Cả sáu việc của prompt M5 (chú thích Nhà, Cung Mọc "chưa khả dụng", `version=null`, một phần, entry hỏng + `reportError`, KG-F5-01) đều đã có hành vi, copy và test trong `dev` — riêng KG-F5-01 mới chỉ nằm trong bảng của F5 plan, **chưa** có bản ghi đầy đủ trong Evidence Matrix. Nếu lập plan "làm mới" cả sáu việc, M5 sẽ vừa làm lại M3 vừa có nguy cơ đảo hành vi đã nghiệm thu (đúng điều prompt cấm: *"Do not reimplement M3 or M4"*).

Vì vậy plan này **định nghĩa lại M5 là "củng cố & đóng"** (khớp đề xuất C-3 của bản tóm tắt, nay đã có bằng chứng mã):

| Loại việc | Nội dung | Mức thay đổi mã |
|---|---|---|
| **Quyết định** | Chốt xung đột phạm vi/copy còn treo (Mục 10) | 0 dòng |
| **Gia cố nhỏ** | Cô lập lỗi *dựng model* khỏi viewer F4 (H-1, [REC]) | ~10–20 dòng ở `pages/app/charts/detail/page.tsx` |
| **Test bổ sung** | ~17 test mới lấp khoảng trống thật (Mục 8.4) — chỉ những gì chưa có | test-only |
| **Tài liệu** | Evidence Matrix M5, bản ghi KG-F5-01 đầy đủ, sửa câu M5 trong F5 plan | docs-only |

**Copy:** mặc định **không đổi chuỗi nào** (đã chạy qua M3, Owner chấp nhận). Chỉ đổi nếu Owner chọn phương án B ở D-M5-01/D-M5-02.

### 1.2 Phạm vi — Deliverables

1. Bảng quyết định D-M5-00…09 được Owner duyệt/không duyệt (Mục 10).
2. (Nếu duyệt D-M5-05) H-1: tách lỗi dựng `InterpretationModel` khỏi lỗi dựng `ChartViewModel` trong `page.tsx`.
3. ~17 test mới (ID `D5-*`) theo ma trận fixture Mục 8.
4. `docs/implementation/archive/sprint-f5/Sprint_F5_M5_Exit_Criteria_Evidence_Matrix.md` (**proposed new file**, theo mẫu M1–M4) có bản ghi **KG-F5-01** đầy đủ.
5. Sửa câu M5 trong `Sprint_F5_Implementation_Plan.md` §10 để khỏi hiểu nhầm phạm vi.

### 1.3 Quan hệ với M3/M4

- **M3** là tiền đề; đã giao đủ nền tảng cho M5 (Mục 2.2). M5 **không đổi hợp đồng** props/model của M3.
- **M4** hoàn tất; M5 phải giữ nguyên: `selection.ts` (diff rỗng), `forwardRef`/`revealItem`, `canReadInterpretation`, `focusChartObject`, Escape + khôi phục focus, không thêm live region (Mục 2.3).

---

## 2. Repository Audit and Current State

### 2.1 Tài liệu & mã đã đọc

| Nhóm | Đường dẫn (tại `3711587`) |
|---|---|
| Plan/AC | `docs/implementation/Sprint_F5_Implementation_Plan.md` (bảng AC dòng ~491–502; §7.6 ma trận trạng thái; §10 M5 dòng ~325–329; bảng KG dòng ~445–450) |
| Evidence Matrix | `docs/implementation/archive/sprint-f5/Sprint_F5_M{1..4}_Exit_Criteria_Evidence_Matrix.md` |
| Mẫu registry | `docs/implementation/archive/sprint-3/Sprint_3_Known_Gaps_Registry.md` (định dạng bản ghi), `…/sprint-4/Sprint_4_Known_Gaps_Registry.md` (nguồn KG-S4-06), `…/sprint-f4/Sprint_F4_M10_Exit_Criteria_Evidence_Matrix.md` (FG-01, FG-07) |
| Model | `frontend/src/features/chart/model/interpretation.ts` (749 dòng) + `interpretation.test.ts`, `interpretation.contract.test.ts` |
| UI | `…/ui/InterpretationPanel/{InterpretationPanel,InterpretationOverview,InterpretationItem}.tsx`, `interpretationCopy.ts`, `index.ts` + 8 file test |
| Tích hợp | `…/ui/ChartViewerShell/{ChartViewerShell.tsx,HouseDataNotice.tsx,focusChartObject.ts}`, `frontend/src/pages/app/charts/detail/page.tsx` |
| Hợp đồng | `frontend/src/features/chart/api/types.ts`, `api/mocks/fixtures.ts`, `model/chartViewModel.ts` |
| Lỗi | `frontend/src/shared/lib/report-error.ts`, `shared/api/queryClient.ts` |
| Backend (chỉ đọc) | `backend/src/modules/chart/application/services/interpretation-lookup.service.ts`, `domain/interpretation/derive-interpretation-subjects.ts`, `domain/engine/chart-builder.ts`, `domain/engine/calculators/house.calculator.ts`, `presentation/mappers/chart-response.mapper.ts` |

### 2.2 Xác minh M3 — đã giao gì [VF]

| Trạng thái F5 §7.6 | Hành vi trong mã | Test/bằng chứng hiện có |
|---|---|---|
| S-02 đầy đủ | Overview + 2 nhóm; Core mở sẵn | PN-01/02, U-04; M3 Matrix V-07 |
| S-03 chưa phát hành | `Alert variant="info"` (`role=status`) "Nội dung diễn giải chưa được phát hành" khi `status="unavailable"` **và** có issue `CONTENT_NOT_PUBLISHED`; không render Overview/nhóm | PN-06, U-09; V-08 |
| S-04 một phần | Từng *part* thiếu → dòng "Chưa có nội dung cho mục này"; part khác bình thường | U-07/U-08, IT-07; V-09 |
| S-05 thiếu Nhà | `!model.houseDataAvailable` → **một** `<p>` chú thích ở Overview; ẩn "Theo nhà"; Cung Mọc "Cung Mọc chưa khả dụng cho lá số này." | OV-06, PN-07/08, U-05; V-10 |
| S-06 entry hỏng | `classifyEntries` loại entry; `page.tsx` gọi `reportError` gộp 1 lần/lần tải | U-10…U-13, PN-09, page test "reports malformed … once per loaded model"; V-11 |
| S-07 lỗi API | Luồng lỗi F4; không render Panel | PG-05; V-12 |
| S-08 (thêm so với §7.6) | `Alert variant="warning"` (`role=alert`) "Hiện chưa thể hiển thị diễn giải cho lá số này." khi `status="unavailable"` không do chưa phát hành | PN-06b; V-13 |

Chất lượng M3 [VF]: Matrix kết luận `PASS WITH GAPS`; known gaps liên quan M5: **KG-F5M3-02** (câu "cần giờ sinh" trong F4 `HouseDataNotice` — Owner **giữ nguyên**, O-8), **KG-F5M3-04** (thiếu ảnh S-05 ở 375px).

**Kết luận:** M3 cung cấp *đủ* cấu trúc dữ liệu (`InterpretationModel`: `status`, `version`, `houseDataAvailable`, `items`, `issues[]` có `category: degraded|defect`) và nền UI cho M5. **Không có blocker từ M3.**

### 2.3 Xác minh M4 — ràng buộc M5 phải giữ [VF]

- Selection: một nguồn sự thật ở `ChartViewerShell`; Panel nhận `selectedPlanetKey`. Mục diễn giải được chọn → "Đang chọn" + `aria-current`, **tự mở khi đổi chọn**, **không** cuộn/dời focus.
- `canReadInterpretation` (Shell) = `interpretation` tồn tại **và** `status !== "unavailable"` **và** item tồn tại trong `itemsById`. ⇒ Khi S-03/S-08, nút "Đọc diễn giải" bị ẩn — đúng, không đổi.
- `revealItem(planetKey)` trả `false` nếu item không có/không nối DOM; `Ascendant` không có nút "Xem trên biểu đồ" (`kind === "angle"` → `onViewOnChart = undefined`) và **không chọn được** trên wheel (P-02, KG-F5-05).
- Escape giữ hành vi F4; không thêm live region.
- **Đã tự kiểm:** `git diff --stat 5e2c116^..3711587` trên `model/selection.ts` và `model/interpretation.ts` → **rỗng** (M4 không đổi hai file này); `interpretationCopy.ts` +6 dòng (chuỗi copy của M4). Xem 2.6 về phạm vi những gì tôi tự chạy.

**Ràng buộc cho M5:** mọi test hồi quy M4 trên fixture không-Nhà là *thêm mới*, không sửa test M4; trạng thái "Cung Mọc chưa khả dụng" không được làm `revealItem`/Escape/stale-selection hỏng.

### 2.4 Hợp đồng API & ngữ nghĩa Backend [VF]

| Mục | Phát hiện | Nguồn |
|---|---|---|
| `ChartResponse` | `isHouseDataAvailable: boolean`; `houses[]`, `angles[]`; `interpretations: ChartInterpretationDto[]` (`subjectType`, `subjectKey`, `language`, `bodyText`, `tone?`); `interpretationVersion: string \| null`; `warnings[]` | `api/types.ts` 120–150 |
| `version = null` | `interpretationVersion = null` **khi và chỉ khi** Backend không có Published version nào → `{version:null, items:[]}`. Chart đã "pin" version luôn có version khác null. ⇒ Backend **không bao giờ** trả `null` kèm mục nội dung | `interpretation-lookup.service.ts` `lookup()` |
| Version khác null + `[]` | Có thể xảy ra khi bản content của version đã pin không còn bản ghi (service chỉ `log.warn` các subject thiếu) | cùng file |
| Nguồn của `isHouseDataAvailable=false` | `chart-builder.ts`: Nhà/góc **chỉ** được tính khi `isBirthTimeKnown`; `isHouseDataAvailable = houses.length === 12`; `HouseCalculator` trả `[]` khi `not_convergent` (vĩ độ cực) kèm warning `HOUSE_SYSTEM_NOT_CONVERGING`. ⇒ **ít nhất hai nguyên nhân**, FE không phân biệt được | `chart-builder.ts` 60–125; `house.calculator.ts` |
| Ascendant | `AngleInSign` chỉ derive khi `chart.angles` có Ascendant; angles chỉ tồn tại khi Nhà được tính | `derive-interpretation-subjects.ts` |
| `PlanetInHouse` | Chỉ derive khi `isHouseDataAvailable` | cùng file |
| Tín hiệu giờ sinh / độ bất định Mặt Trăng | **Không có** trên `ChartResponse` (`isBirthTimeKnown` không tồn tại ở `types.ts`; `warnings` — trong phần Backend tôi đã đọc, mã duy nhất tìm thấy là `HOUSE_SYSTEM_NOT_CONVERGING`) | grep `types.ts`, `chart-builder.ts` |
| `isHouseDataAvailable` thiếu/sai kiểu | `validateStructure` ném `ChartViewModelError` ⇒ trang rơi vào nhánh `invalid-data` (EmptyState "Dữ liệu lá số không hợp lệ") — **không** bị coi là `false` | `chartViewModel.ts:207` |
| `interpretations`/`interpretationVersion` sai kiểu | `validateStructure` **không** kiểm hai trường này; model tự bảo vệ (`ENTRY_MALFORMED` / `VERSION_INVALID`) | `chartViewModel.ts` 207–253; `interpretation.ts` `classifyEntries` |
| "Có Nhà" hiệu dụng | `vm.flags.houseDataAvailable` = cờ API **và** đủ 12 nhà hợp lệ; mâu thuẫn ⇒ `false` + issue F4 `HOUSE_FLAG_CONTRADICTION` | `chartViewModel.ts` `buildHouses` |

### 2.5 Cơ chế lỗi hiện có [VF]

- `reportError(error: unknown, context?: string): void` → `console.error("[reportError] (ctx)", error)`. **Không** có dedupe, không có telemetry ngoài (chú thích mã: Sentry là quyết định tương lai).
- Caller diễn giải duy nhất: `pages/app/charts/detail/page.tsx` — `useEffect` phụ thuộc `[mapping]`; gộp issue `category === "defect"` theo mã thành chuỗi `CODE×N`; gọi `reportError(new Error("Interpretation data issues: …"), "interpretation-model")` **một lần**; issue `degraded` (`CONTENT_NOT_PUBLISHED`, `HOUSE_DATA_UNAVAILABLE`) **không** báo.
- Chống trùng: `mapping` là `useMemo([query.data])`; `useChartQuery` đặt `staleTime: Infinity`; TanStack giữ nguyên tham chiếu khi dữ liệu bằng nhau (structural sharing mặc định — [UNK] chưa thấy tuỳ chỉnh ghi đè). Chính sách thực tế = **một lần/lần mount trang cho mỗi payload**; rời trang rồi quay lại sẽ báo lại. Không lộ chi tiết kỹ thuật cho người dùng (UI chỉ hiện copy trung tính).

### 2.6 Cổng chất lượng — phần tôi tự chạy trên clone `3711587` [VF]

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run format:check` | pass |
| `CI=1 npx playwright test --list` | **38 test / 7 file** (khớp summary) |
| `npx vitest run src/features/chart src/pages/app/charts` (với `VITE_API_BASE_URL=http://localhost:3000` từ `.env.example`) | **60 file / 732 test pass**, 0 fail |

**Chưa tự chạy** (ghi rõ để không tuyên bố quá): ESLint, `build`, toàn bộ Vitest (144 file/1178 test là số của summary), coverage, E2E. Lưu ý môi trường: thiếu `VITE_API_BASE_URL` làm 11 file fail giả (lỗi `env.ts`, không phải mã); với giá trị khác `.env.example` có 1 test fail do khác URL — không phải lỗi M5.

### 2.7 Đối chiếu bản tóm tắt phiên (xác nhận / chênh lệch)

| Mục summary | Kết quả đối chiếu |
|---|---|
| M1–M4 hoàn tất, HEAD `3711587`, CI #318 xanh | Khớp git log; CI không kiểm lại được log từng bước ([UNK]) |
| 38 E2E / 7 file | **Xác nhận** |
| **C-3** M5 chồng lấn M3 | **Xác nhận** bằng mã + M3 Matrix V-08…V-13 (Mục 2.2) |
| **C-4** F5 plan M5 ghi "Overview và `HouseDataNotice`" vs O-8 | **Xác nhận mâu thuẫn**; nhưng Owner **đã quyết ở M3** (KG-F5M3-02: giữ nguyên banner F4) ⇒ chỉ cần xác nhận lại, không phải câu hỏi mới |
| **C-5** S-08 `role=alert` | Đã được Owner chấp nhận ở M3 (V-13); chỉ cần xác minh lại bằng trình đọc màn hình ở M6 |
| **C-6** copy chờ duyệt "đặc biệt disclaimer" | **Mâu thuẫn nội bộ summary**: §6 ghi "disclaimer đã duyệt" và M3 Matrix xác nhận C-08 "nguyên văn theo phê duyệt của Owner". Coi disclaimer **đã duyệt**; trạng thái duyệt *rõ ràng* của các chuỗi còn lại chỉ là chấp nhận ngầm qua nghiệm thu M3 ⇒ xin Owner xác nhận một dòng (D-M5-02) |
| "C-01…C-16" | M3 Matrix nói **13** chuỗi C-01…C-13; M4 thêm 6 dòng vào `interpretationCopy.ts` (khớp việc có thêm chuỗi, nhiều khả năng `selectedBadge`, `viewOnChart`, `formatViewOnChartLabel`) — số thứ tự C-14…C-16 chưa đối chiếu ([UNK]), không chặn |
| C-1, C-2, C-7…C-12 | Ngoài phạm vi M5 (M6–M8/Backend), không xác minh lại |

---

## 3. Requirements and Acceptance Criteria

### 3.1 Định nghĩa AC có thẩm quyền

Nguồn: bảng AC trong `docs/implementation/Sprint_F5_Implementation_Plan.md` (dòng 493–498 tại `3711587`). Trích **nguyên văn**:

| AC | Nguyên văn |
|---|---|
| AC-17 | `isHouseDataAvailable=false`: có `PlanetInSign`, không có `PlanetInHouse`, Cung Mọc "chưa khả dụng", một chú thích trung tính, chart không lỗi |
| AC-18 | Không hiển thị bất kỳ suy luận nào về giờ sinh/độ chắc chắn Mặt Trăng; KG-F5-01 ghi trong registry |
| AC-19 | `interpretations=[]`/`version=null` ⇒ thông báo "chưa phát hành", viewer F4 nguyên vẹn |
| AC-20 | Thiếu một mục ⇒ "Chưa có nội dung cho mục này" + `reportError` đúng một lần; mục khác bình thường |
| AC-21 | Entry hỏng/`language≠vi`/trùng khoá bị loại, không crash, không render |
| AC-22 | Lỗi API chart đi qua luồng lỗi F4 (không bị nuốt thành "rỗng thành công") |

### 3.2 Ma trận truy vết AC

| AC | Task M5 | Bằng chứng triển khai hiện có [VF] | Test hiện có | Test M5 bổ sung | Trạng thái |
|---|---|---|---|---|---|
| AC-17 | M5.1, M5.2 | `InterpretationOverview.tsx` (`!houseDataAvailable`); `getPartText` ANGLE_ABSENT | OV-06, PN-07/08, U-05, IT-08 | D5-H01…H03, D5-A01…A03 | Đạt ở M3; M5 thêm đối chứng + hồi quy M4 |
| AC-18 | M5.6 | Không có mã suy luận giờ sinh/Moon; `U-26`; PN-08 regex "giờ sinh\|birth" | U-26, PN-08 | D5-M01, D5-M02 | Đạt; M5 mở rộng regex Moon + gate tĩnh + ghi KG-F5-01 |
| AC-19 | M5.3 | `isUnreleased` = `version===null` **và** mảng rỗng | U-09 (cả `null`+`[]` và `"1.0"`+`[]`), U-09b (không phải mảng), U-22 (`null`+có mục), PN-06/06b | D5-V01…V04 (UI-level) | **Cần xác nhận cách đọc "/" (D-M5-03)** |
| AC-20 | M5.4 | `resolvePart` → `missing` + `CONTENT_MISSING`(defect) | U-07/U-08, IT-07, page test | D5-P01…P03 | Đạt; "đúng một lần" = một lần **gộp theo payload** (D-M5-04) |
| AC-21 | M5.5 | `classifyEntries` (4 luật) | U-10…U-13, PN-09, page test | D5-E01…E03 | Đạt; M5 thêm cô lập lỗi dựng model + test không báo trùng |
| AC-22 | — (đã đạt) | `page.tsx` viewKind | PG-05, V-12 | hồi quy gián tiếp qua D5-E03 | Đạt |

### 3.3 Xung đột / chưa xác minh

1. **AC-19 mơ hồ**: "`interpretations=[]`/`version=null`" có thể là *hoặc* hoặc *và*. Mã hiện tại đọc là **và** (quyết định M2 sau review: tránh gắn nhãn "chưa phát hành" cho dữ liệu hỏng, U-09b) và khớp ngữ nghĩa Backend (2.4). Hệ quả: `version="1.0"` + `[]` → S-08 `warning` + `reportError`; `version=null` + có mục → hiển thị bình thường, không báo (U-22). → D-M5-03.
2. **AC-17 "một chú thích"**: trong *vùng Diễn giải* chỉ có **một** chú thích (Overview) + dòng Cung Mọc ở mục; nhưng trang còn banner F4 `HouseDataNotice` ở khu bảng Nhà (KG-F5M3-02). Coi AC-17 áp dụng cho vùng Diễn giải. → D-M5-01.
3. **AC-20 "đúng một lần"**: hiện thực là một lần gộp cả payload (`CONTENT_MISSING×N`), không phải một lần mỗi mục. Phù hợp ý "không spam"; ghi rõ trong Matrix.

### 3.4 Ảnh hưởng tới AC M3/M4 (rủi ro hồi quy, không phải quyền sửa AC)

AC-05/06/09 (nội dung, Cung Mọc, cấu trúc), AC-12/23 (disclosure, text-only), AC-13…16 (selection/navigation), AC-24…26 (a11y). M5 không đụng mã M3/M4 trừ H-1 ở `page.tsx`; các test M5 mới chỉ *thêm*.

---

## 4. Scope

**In scope:** xác minh + gia cố + tài liệu hoá 6 trạng thái suy giảm; ~17 test mới; H-1 (nếu duyệt); Evidence Matrix + KG-F5-01; sửa câu M5 trong F5 plan.

**Out of scope:** M6 (responsive/a11y sâu, Narrator/NVDA, R-09/R-10), M7 (E2E Backend thật, ảnh live), M8 (CHANGELOG, version `0.4.0`, Spec as-built, README); mọi thay đổi Backend/API/nội dung; sửa `selection.ts`; sửa copy F4 (trừ phương án B được duyệt).

**Non-goals / ràng buộc kiến trúc:** FE không suy luận giờ sinh từ `isHouseDataAvailable`; không suy luận độ bất định Mặt Trăng; không tự tính cung/ranh giới của Mặt Trăng; không hiển thị `tone`/`contentSource`/version; không tạo diễn giải góc chiếu/Nhà độc lập; không thêm state-library, error-abstraction hay live region; không "nuốt" lỗi API thành rỗng.

---

## 5. M5 Functional Design

### 5.1 Ma trận trạng thái cuối cùng (đối chiếu F5 §7.6; **[VF]** = hành vi đã có)

| ID | Điều kiện dữ liệu | Vùng Diễn giải hiển thị | `reportError`? | Ghi chú |
|---|---|---|---|---|
| S-02 | version≠null, đủ mục, có Nhà | Overview + 2 nhóm, 21 mục | Không | [VF] |
| S-03 | `version=null` **và** `interpretations=[]` | `Alert info` "Nội dung diễn giải chưa được phát hành"; không Overview; viewer F4 nguyên vẹn | Không (`degraded`) | [VF] |
| S-03b | `version=null`, có mục hợp lệ | Hiển thị như S-02; **không** nhắc version | Không | [VF] U-22; D5-V03 thêm test UI |
| S-04 | Thiếu ≥1 mục, còn mục khác | Part thiếu: "Chưa có nội dung cho mục này"; mục khác bình thường | **1 lần** gộp (`CONTENT_MISSING×N`) | [VF] |
| S-05 | `isHouseDataAvailable` hiệu dụng = false | 1 chú thích ở Overview; ẩn "Theo nhà"; Cung Mọc "chưa khả dụng" | Không (`degraded`) | [VF] |
| S-06 | Entry hỏng/ngôn ngữ/trùng/không hỗ trợ | Entry bị loại; không hiện gì kỹ thuật | **1 lần** gộp | [VF] |
| S-07 | Lỗi API chart | EmptyState F4; không Panel | Theo F4 | [VF] |
| S-08 | `status="unavailable"` không do chưa phát hành (vd. version="1.0" + `[]`, hoặc `interpretations` không phải mảng) | `Alert warning` "Hiện chưa thể hiển thị diễn giải cho lá số này." | **1 lần** gộp | [VF]; xem D-M5-03 |
| S-09 *(mới, [REC])* | `buildInterpretationModel` ném lỗi bất ngờ (lỗi FE) | Viewer F4 vẫn hiển thị; **không** có Panel | 1 lần, context `interpretation-model-build` | Chỉ nếu duyệt D-M5-05 |

### 5.2 M5-T1 — Chú thích Nhà trung tính (Overview) — D-M5-01

- **Điều kiện [VF]:** `InterpretationOverview` nhận `houseDataAvailable = model.houseDataAvailable` ← `vm.flags.houseDataAvailable` (cờ API **và** đủ 12 nhà hợp lệ). Hiển thị `<p>` khi `!houseDataAvailable`.
- **Trường thiếu/sai kiểu:** không rơi vào đây — `isHouseDataAvailable` không phải boolean ⇒ `ChartViewModelError` ⇒ trang `invalid-data` (F4). M5 **không** coi thiếu = `false`.
- **Cờ mâu thuẫn** (API nói `true` nhưng nhà thiếu/lặp): hiệu dụng = `false` ⇒ chú thích vẫn hiện, trung tính; vấn đề dữ liệu nằm ở issue F4 `HOUSE_FLAG_CONTRADICTION`. Cần test (D5-H03) để khoá hành vi.
- **Vị trí:** Overview, một lần; Cung Mọc có dòng riêng ở mục (không nhân bản câu chú thích).
- **Khi có Nhà:** không có chú thích nào (D5-H01).
- **Không suy luận:** copy không nhắc giờ sinh/vĩ độ/lỗi lá số. Hợp đồng Backend cho thấy ≥2 nguyên nhân (2.4) ⇒ trung tính là bắt buộc, không phải lựa chọn.
- **Banner F4 `HouseDataNotice`** (KG-F5M3-02): mặc định **giữ** (D-M5-01 A). Phương án B ở 5.8.

### 5.3 M5-T2 — Cung Mọc "chưa khả dụng" — D-M5-02

| Điều kiện dữ liệu | `part.state / reason` | Text hiển thị | Nhóm nguyên nhân | `reportError` |
|---|---|---|---|---|
| `vm.angles` không có Ascendant | `unavailable / ANGLE_ABSENT` | "Cung Mọc chưa khả dụng cho lá số này." | **Dữ liệu góc** vắng | Không (không phát issue) |
| Có Ascendant, cung không nhận ra | `unavailable / SIGN_UNRESOLVED` | "Chưa có nội dung cho mục này" | Dữ liệu góc lỗi | Có (`IDENTIFIER_UNRESOLVED`) |
| Có Ascendant, cung hợp lệ, thiếu entry | `missing` | "Chưa có nội dung cho mục này" | **Nội dung** thiếu | Có (`CONTENT_MISSING`) |
| Ascendant trùng trong `angles` | `ambiguous` | "Chưa có nội dung cho mục này" | Dữ liệu lỗi | Có (`AMBIGUOUS_IDENTIFIER`) |

- Phân biệt "dữ liệu góc vắng" vs "nội dung thiếu" **đã có** nhờ hai copy khác nhau. Không giả định mọi trường hợp thiếu Ascendant cùng một nguyên nhân.
- Mục luôn tồn tại trong `itemsById` ⇒ vẫn đứng trong nhóm Cốt lõi, mở/đóng được, **không** có "Xem trên biểu đồ", không chọn được (P-02) ⇒ M4 không bị phá. Cần test hồi quy trên fixture không-Nhà (D5-A03).
- **Quan sát [REC, không đổi mã]:** `ANGLE_ABSENT` khi cờ Nhà = `true` (bất thường Backend) hiện **im lặng**. Mặc định chỉ ghi chú + test mô tả hành vi (D-M5-09), không thêm mã issue vào `interpretation.ts`.

### 5.4 M5-T3 — `version = null` — D-M5-03

| `interpretationVersion` | `interpretations` | Mô hình hiện tại [VF] | UI | Báo lỗi | Ý nghĩa Backend |
|---|---|---|---|---|---|
| `null` | `[]` | `CONTENT_NOT_PUBLISHED` (degraded), status `unavailable` | S-03 info | Không | Chưa có bản Published — **trạng thái hợp lệ** |
| `null` | có mục hợp lệ | nội dung bình thường, không issue | S-02/S-04 | Không | Backend **không** phát sinh; chấp nhận nếu gặp |
| `"1.0"` | `[]` | mọi part `missing` ⇒ `CONTENT_MISSING`, status `unavailable` | S-08 warning | Có | Content của version đã pin biến mất → dữ liệu bất thường |
| `"1.0"` | đủ | bình thường | S-02 | Không | Bình thường |
| không phải string/null | bất kỳ | `VERSION_INVALID` (defect), version=`null` | theo nội dung | Có | Hợp đồng sai |

- Không bao giờ hiển thị version (`tone`/`contentSource` cũng không). Test D5-V04 quét DOM mọi trạng thái.
- `null` **không** coi là lỗi API và **không** coi mọi entry vô hiệu: render nội dung hợp lệ nếu có.
- Phân biệt với lỗi API: lỗi API không có `data` ⇒ không bao giờ tới model (PG-05).
- Theo dõi: coi là trạng thái hợp lệ ⇒ **không** log/monitor.

### 5.5 M5-T4 — Nội dung một phần

| Loại | Cơ chế nhận diện [VF] | Xử lý |
|---|---|---|
| 1. Hỗ trợ & có | key ∈ `buildInterpretationKeySpace()` (252) + khớp key dẫn xuất từ `vm` | `available` |
| 2. Hỗ trợ nhưng thiếu | key dẫn xuất từ `vm` (hành tinh+cung / nhà) không có entry | `missing` → dòng "Chưa có nội dung cho mục này" + `CONTENT_MISSING` |
| 3. Loại/khoá **không hỗ trợ** | type ∉ `KNOWN_INTERPRETATION_SUBJECT_TYPES` hoặc key ∉ key-space | **Loại bỏ**, `SUBJECT_UNSUPPORTED` (defect, báo gộp) — D-M5-06 |
| 4. Hỏng | sai hình/kiểu/rỗng | **Loại bỏ**, `ENTRY_MALFORMED` |

FE nhận diện được "thiếu" vì danh mục khoá là **ổn định và hữu hạn** (key-space + dữ liệu hành tinh trong `vm`), không phải suy luận chiêm tinh. Chống ồn: chỉ **một dòng ngắn tại đúng part thiếu**; không banner, không đếm lặp. Một mục thiếu không chặn mục khác (xử lý theo từng key). D5-P03 khoá việc không thêm Alert khi thiếu một phần.

### 5.6 M5-T5 — Entry hỏng & `reportError` — D-M5-05/06

- **Định nghĩa "hỏng" (`ENTRY_MALFORMED`)** [VF]: phần tử không phải object/là mảng; `subjectType`/`language` không phải string; `subjectKey` rỗng/không phải string; `bodyText` không phải string hoặc rỗng/chỉ khoảng trắng; **hoặc** `interpretations` không phải mảng. Các loại loại-bỏ khác: `SUBJECT_UNSUPPORTED`, `LANGUAGE_NOT_SUPPORTED` (≠`"vi"`), `DUPLICATE_SUBJECT` (cả hai bị loại), `ENTRY_NOT_APPLICABLE`.
- **Điểm kiểm tra [VF]:** `classifyEntries` trong `interpretation.ts` — ranh giới duy nhất giữa `query.data` và UI. Backend có schema zod/OpenAPI cho response (`chart-response.mapper.ts`) nên entry hỏng chỉ xuất hiện khi lệch hợp đồng/proxy/lỗi — xác suất thấp, vẫn phải an toàn (chưa xác minh Backend có parse runtime response hay không).
- **Nơi gọi `reportError`:** `page.tsx` (effect `[mapping]`) — **một lần/payload/mount**, gộp theo mã; context `interpretation-model`; thông điệp chỉ gồm **mã + số lượng** (`CODE×N`), không chứa `subject`, khoá thô hay `bodyText`.
- **Người dùng thấy:** không gì về entry hỏng; part tương ứng (nếu là entry kỳ vọng) hiện copy "Chưa có nội dung cho mục này".
- **Khoảng trống [REC] H-1:** nếu `buildInterpretationModel` *ném* (lỗi FE chưa lường), `page.tsx` hiện chỉ bắt `ChartViewModelError` ⇒ lỗi lan lên và sập cả route. Prompt yêu cầu "malformed entry must not crash the entire UI" ⇒ cô lập (6.3).
- **Chống báo trùng:** giữ chính sách hiện tại; thêm test render lại cùng payload không báo thêm (D5-E02). Hai ca ngoài kiểm soát ghi nhận: rời/quay lại trang; React StrictMode ở dev ([UNK], chưa kiểm).

### 5.7 M5-T6 — KG-F5-01 (Mặt Trăng)

**Biết được từ API [VF]:** `isHouseDataAvailable`, `houses[]`, `angles[]`, `warnings[]` (mã `HOUSE_SYSTEM_NOT_CONVERGING`), vị trí `Moon` (cung, độ). **Không biết:** có giờ sinh không; Moon có gần ranh giới cung không *trong khoảng giờ chưa biết*; liệu bất định áp dụng cho bản ghi này.
**Không được làm:** suy từ `isHouseDataAvailable=false` hay `version=null`; tự tính độ/ranh giới của Moon ở FE.

**Bản ghi đề xuất ghi vào Evidence Matrix M5 (định dạng theo `Sprint_3_Known_Gaps_Registry.md`):**

| Trường | Giá trị |
|---|---|
| **ID** | KG-F5-01 |
| **Tiêu đề** | Moon interpretation uncertainty (thiếu cảnh báo độ bất định Mặt Trăng khi giờ sinh không rõ) |
| **Mô tả** | Backend giữ diễn giải `Moon_in_{Sign}` khi không rõ giờ sinh (quyết định Sprint 4, KG-S4-06). Khi giờ sinh không biết, cung của Mặt Trăng có thể không chắc chắn nếu nó gần ranh giới cung. `ChartResponse` không có tín hiệu giờ sinh hay độ bất định, nên FE không hiển thị cảnh báo và hiển thị Mặt Trăng như các hành tinh khác. |
| **Nguồn** | F5 plan §F5-03, X-3, R-04, bảng KG; `archive/sprint-4/Sprint_4_Known_Gaps_Registry.md` (KG-S4-06); `archive/sprint-f4/Sprint_F4_M10_Exit_Criteria_Evidence_Matrix.md` (FG-01, FG-07); `api/types.ts` (không có `isBirthTimeKnown`) |
| **Tác động người dùng** | Người dùng không rõ giờ sinh có thể đọc diễn giải Mặt Trăng như chắc chắn. Giảm nhẹ một phần bằng disclaimer chung (C-08, Overview). |
| **Phân loại sở hữu** | **Cross-layer** — Backend sở hữu tín hiệu/hợp đồng; FE chỉ hiển thị khi có tín hiệu |
| **Giảm nhẹ hiện tại** | Không cảnh báo riêng; disclaimer chung; không có nội dung nào khẳng định giờ sinh hay độ chắc chắn (AC-18, test D5-M01/M02) |
| **Tín hiệu/hợp đồng cần có** | FG-01 (trạng thái giờ sinh trên `ChartResponse`) **và** quyết định hợp đồng FG-07 (độ bất định theo thiên thể, do Backend tính). FG-01 một mình chưa đủ kết luận về Moon |
| **Bằng chứng để đóng** | Hợp đồng/OpenAPI có trường; type FE cập nhật; test: có tín hiệu ⇒ hiển thị cảnh báo đúng chỗ; không/false ⇒ không hiển thị; Matrix ghi đóng; Backend test tương ứng |
| **Severity** | Trung bình [REC] |
| **Status** | OPEN — blocked by Backend/Owner decision |
| **Owner** | Backend + Product Owner (quyết định FG-07); FE theo sau |
| **Follow-up** | Sau Backend FG-01/FG-07; ngoài F5 |
| **Chặn đóng Sprint F5?** | Không |
| **M5 có đóng được không?** | **Không** — M5 chỉ ghi nhận và khoá bằng test |

### 5.8 Bảng copy (D-M5-08) — **tất cả là [VF] đang chạy; chưa có ghi nhận duyệt riêng ngoài disclaimer, nên xin Owner xác nhận một dòng (D-M5-02)**

| State | Trigger | Copy hiện tại (`INTERPRETATION_COPY.<key>`) | Vị trí | Đánh giá |
|---|---|---|---|---|
| Thiếu Nhà (C-06) | `!houseDataAvailable` | "Dữ liệu Nhà và một số góc trong lá số này chưa khả dụng. Bạn vẫn có thể xem các diễn giải theo cung." (`houseDataUnavailable`) | Overview, 1 lần | Trung bình-trung tính; "một số góc" hơi dè dặt (Backend bỏ **tất cả** góc khi không có Nhà) — an toàn, giữ |
| Phạm vi (C-07) | luôn (khi có Overview) | "Diễn giải góc chiếu và nhận định tổng hợp toàn lá số hiện chưa có nội dung." (`coverage`) | Overview | Giữ |
| Disclaimer (C-08) | luôn | (nguyên văn đã duyệt) `disclaimer` | Overview | **[AD]** |
| Chưa phát hành (S-03) | `version=null` + `[]` | "Nội dung diễn giải chưa được phát hành" (`unpublished`) | Alert info | Giữ |
| Thiếu mục | part `missing`/`ambiguous`/…| "Chưa có nội dung cho mục này" (`itemMissing`) | Trong mục | Giữ |
| Cung Mọc (C-11) | `ANGLE_ABSENT` | "Cung Mọc chưa khả dụng cho lá số này." (`ascendantUnavailable`) | Trong mục Cung Mọc | Giữ |
| Không khả dụng (S-08) | unavailable do dữ liệu | "Hiện chưa thể hiển thị diễn giải cho lá số này." (`unavailable`) | Alert warning | Giữ (D-M5-07) |
| Entry hỏng / version null có nội dung / Mặt Trăng | — | **Không có copy** (cố ý) | — | Đúng yêu cầu |

Không chuỗi nào chứa thuật ngữ nội bộ (`version`, `API`, `malformed`, `reportError`) — [VF] qua PN-09 + purity AR-03.
**Phương án B (chỉ khi Owner chọn):** (i) chú thích Nhà chính xác hơn: *"Dữ liệu Nhà và các góc (như Cung Mọc) của lá số này chưa khả dụng. Bạn vẫn có thể xem các diễn giải theo cung."*; (ii) banner F4: bỏ câu nguyên nhân, giữ *"Lá số này hiển thị không có Nhà và các góc (Cung Mọc, MC, DSC, IC)."* — ảnh hưởng `HouseDataNotice.test.tsx`, `ChartViewerShell.test.tsx`, `page.test.tsx` (3 file có tham chiếu; **chưa** đo chi tiết). Cả hai là [REC], mặc định **không** làm.

### 5.9 Truy cập & responsive (D-M5-07)

- Không thêm live region. S-03 (`role=status`) và S-08 (`role=alert`) đến từ `Alert` dùng chung, xuất hiện khi tải trang, **không** tại thời điểm tương tác ⇒ không xung đột với live region chọn của F4.
- Dòng suy giảm nằm trong `<dd>` của đúng "Theo cung"/"Theo nhà" của mục ⇒ liên kết đúng phần; chú thích Nhà là `<p>` tĩnh trong Overview.
- Suy giảm **không** đổi focus M4 (khoá bằng D5-A03). Layout: một cột, text thuần; ảnh 375px cho S-05 còn thiếu (KG-F5M3-04) — D-M5-11.

---

## 6. Technical Design

### 6.1 Tái dùng (không đổi)
`interpretation.ts` (`buildInterpretationModel`, `InterpretationModel.issues`), `InterpretationPanel/Overview/Item`, `interpretationCopy.ts`, `Alert`, `reportError`, fixtures `chartFull`/`chartNoHouses`/`chartZeroBoundary` (`api/mocks/fixtures.ts`), helper `build(dto)` đã có ở `InterpretationPanel.test.tsx` (gọi `toChartViewModel` + `buildInterpretationModel`).

### 6.2 Thay đổi ở mức file

| Đường dẫn | Trạng thái | Thay đổi | Consumer | Test bảo vệ |
|---|---|---|---|---|
| `frontend/src/pages/app/charts/detail/page.tsx` | tồn tại [VF] | **H-1 [REC]**: tách bước dựng `InterpretationModel` khỏi `try` của `ChartViewModel`; lỗi → `interpretation=undefined` + báo 1 lần | route `/app/charts/:chartId` | D5-E03; PG-*, V5 hiện có |
| `…/detail/page.interpretation.test.tsx` | tồn tại | mở rộng: D5-V01, D5-E02, D5-E03, D5-P01 | — | — |
| `…/ChartViewerShell/ChartViewerShell.interpretation.test.tsx` | tồn tại | mở rộng: D5-H01, D5-H02, D5-A03, D5-M01 | — | — |
| `…/InterpretationPanel/InterpretationPanel.degraded.test.tsx` | **proposed new** | gom D5-H03, D5-A01/A02, D5-V02…V04, D5-P02/P03, D5-E01. Lý do: không phình `InterpretationPanel.test.tsx` của M3; có tiền lệ `*.selection.test.tsx` | — | — |
| `…/InterpretationPanel/InterpretationPanel.purity.test.ts` | tồn tại | thêm AR-09: gate tĩnh cấm `isBirthTimeKnown`/`birthTime`/tính độ Moon trong 3 component + copy | — | chính nó |
| `docs/implementation/archive/sprint-f5/Sprint_F5_M5_Exit_Criteria_Evidence_Matrix.md` | **proposed new** | Evidence Matrix + KG-F5-01 | M8 | — |
| `docs/implementation/Sprint_F5_Implementation_Plan.md` | tồn tại | sửa câu M5 (§10); ghi trạng thái KG-F5-01 | — | — |
| **Không đổi (diff rỗng — gate)**: `model/selection.ts`, `model/interpretation.ts`, `interpretationCopy.ts`*, `InterpretationItem.tsx`*, `InterpretationOverview.tsx`*, `HouseDataNotice.tsx`*, `ChartViewerShell.tsx` | | *\*trừ khi Owner chọn phương án B* | | |

### 6.3 Thiết kế H-1 (mô tả, không mã)
- Hiện tại: một `try` bao `toChartViewModel` + `buildInterpretationModel`; chỉ `ChartViewModelError` được chuyển thành `invalid-data`; lỗi khác `throw`.
- Đề xuất: giữ nguyên nhánh `vm`. Bước dựng model nằm trong khối bảo vệ riêng, kết quả dạng `{ model | null, error | null }`. Nếu `vm` hợp lệ nhưng model lỗi ⇒ `mapping.ok` vẫn `true`; Shell nhận `interpretation={undefined}` (Shell đã hỗ trợ prop tuỳ chọn — test "keeps the panel optional"); một `useEffect` báo `reportError(error, "interpretation-model-build")`.
- Đánh đổi: người dùng không thấy khu Diễn giải **và không có thông báo**. Chủ ý **không** bịa model "unavailable" ở FE (tránh tạo mô hình giả) — đây là đường lỗi lập trình FE, không phải trạng thái dữ liệu. Owner quyết (D-M5-05).

### 6.4 Luồng dữ liệu & ranh giới kiểm tra
```
GET /charts/:id ─► query.data (ChartResponse, chưa kiểm interpretations)
   page.tsx useMemo([query.data])
     ├─ toChartViewModel ── validateStructure(isHouseDataAvailable: boolean…) ──► ChartViewModelError ──► "invalid-data" (F4)
     └─ buildInterpretationModel(dto, vm) ── classifyEntries (RANH GIỚI) ──► issues[degraded|defect]
   useEffect([mapping]) ── gộp defect theo mã ──► reportError ×1
   <ChartViewerShell interpretation={model}> ──► Panel (status/groups/items)
```

### 6.5 Hướng phụ thuộc
Model thuần (không React); Panel chỉ import theo allowlist AR-04 — **mọi import mới trong 3 component phải cập nhật allowlist** nên M5 tránh thêm import. `page.tsx` nhập từ `@features/chart` (barrel); không `shared → features`.

---

## 7. Implementation Breakdown

**Trình tự:** M5.0 → (M5.1 ∥ M5.2 ∥ M5.3 ∥ M5.4) → M5.5 → M5.6 → M5.7. Mỗi test mới phải được chứng minh "đỏ khi hành vi bị phá" (làm hỏng tạm điều kiện tương ứng, ghi lại, rồi hoàn tác) để tránh test dương tính giả.

| ID | Việc | Phụ thuộc | AC | File chính | Test | DoD |
|---|---|---|---|---|---|---|
| **M5.0** | Cổng vào: Owner duyệt D-M5-00 (chặn) và các D-M5-0x khác (có mặc định); chạy lại baseline Mục 8.5; chốt branch/PR theo quy ước (C-1, **chưa có tài liệu**) | — | — | — | baseline xanh | Quyết định ghi vào Matrix; baseline = 60/732 (subset) hoặc số toàn bộ owner đo |
| **M5.1** | T1 — khoá hành vi chú thích Nhà | M5.0 | 17 | `ChartViewerShell.interpretation.test.tsx`, `…degraded.test.tsx` | D5-H01…H03 | 0 thay đổi mã; test đỏ khi bỏ điều kiện |
| **M5.2** | T2 — Cung Mọc + hồi quy M4 | M5.0 | 17 (+13–16, 24–26 hồi quy) | như trên | D5-A01…A03 | Diff rỗng `selection.ts`; M4 test cũ không sửa |
| **M5.3** | T3 — version | M5.0 | 19 | `page.interpretation.test.tsx`, `…degraded.test.tsx` | D5-V01…V04 | D-M5-03 ghi vào Matrix |
| **M5.4** | T4 — một phần | M5.0 | 20 | `…degraded.test.tsx` | D5-P01…P03 | Không thêm Alert khi thiếu một phần |
| **M5.5** | T5 — hỏng + H-1 | M5.0, D-M5-05 | 21, 22 | `page.tsx`, `page.interpretation.test.tsx` | D5-E01…E03 | App không sập khi model ném; báo đúng 1 lần |
| **M5.6** | T6 — KG-F5-01 + Moon | M5.0 | 18 | purity test, Shell test, Matrix | D5-M01, D5-M02 | Bản ghi đầy đủ (5.7); không đánh dấu "đã đóng" |
| **M5.7** | Tài liệu & cổng chất lượng | M5.1–6 | — | Matrix; sửa F5 plan | toàn bộ cổng 8.5 | Mục 12 |

---

## 8. Fixture and Test Plan

### 8.1 Kho fixture [VF]
`chartFull` (21 mục, có Nhà), `chartNoHouses` (10 mục), `chartZeroBoundary` (có hành tinh ở ~29,5° và ~0,5°; **[UNK]** hành tinh nào — không dùng nguyên bản cho Moon). Mọi biến thể khác tạo bằng `structuredClone(chartFull)` + đột biến có kiểu, rồi `toChartViewModel` + `buildInterpretationModel` — **không** tạo mô hình giả song song.

### 8.2 Ma trận fixture

| Fixture | Điều kiện dữ liệu | UI mong đợi | Báo lỗi | Lớp test |
|---|---|---|---|---|
| F-Full | `chartFull` | Không chú thích Nhà; 21 mục | 0 | Shell |
| F-NoHouse | `chartNoHouses` | 1 chú thích Overview; không "Theo nhà"; Cung Mọc "chưa khả dụng"; PlanetInSign còn | 0 | Panel + Shell |
| F-Contradiction | cờ `true` + 11 nhà | như F-NoHouse | 0 (issue F4) | Panel |
| F-MissingOne | xoá 1 entry | 1 dòng "Chưa có nội dung…"; 20 còn lại | 1 (`CONTENT_MISSING×1`) | Page + Panel |
| F-Unsupported | thêm entry `subjectType` lạ | Không hiện gì | 1 (`SUBJECT_UNSUPPORTED×1`) | Panel + Page |
| F-NullEmpty | `null` + `[]` | S-03; viewer F4 đủ | 0 | Page + Panel |
| F-NullItems | `null` + 21 mục | như S-02; không nhắc version | 0 | Panel |
| F-VerEmpty | `"1.0"` + `[]` | S-08 (không "chưa phát hành") | 1 | Panel + Page |
| F-Malformed | trộn entry hỏng + hợp lệ | entry hỏng bị loại; mục khác đủ; DOM sạch | 1 | Page + Panel |
| F-ModelThrows | mock `buildInterpretationModel` ném | viewer F4 vẫn có; không Panel | 1 (`interpretation-model-build`) | Page |
| F-MoonEdge | clone, Moon ~29,9° (đồng bộ longitude) | Không từ bất định | 0 | Shell |

### 8.3 Khoảng trống thật so với test hiện có (đã đối chiếu tên test)
Hiện có đủ đơn vị model (U-01…U-26), Panel (PN-*), Overview (OV-*), Item (IT-*), Page (PG-05/06 + 3 test). **Còn thiếu:** (a) bằng chứng ở mức Shell/Page rằng chú thích Nhà không lặp và không có "giờ sinh/vĩ độ"; (b) hồi quy M4 trên fixture không-Nhà ở mức Shell; (c) cờ mâu thuẫn; (d) UI-level cho `null`+có mục và `"1.0"`+`[]`; (e) render lại không báo trùng; (f) model ném lỗi; (g) quét Moon/bất định.

### 8.4 Danh sách test mới

| ID | Lớp | Nội dung (Given → Then) | Âm tính |
|---|---|---|---|
| D5-H01 | Shell | F-Full → không có chú thích Nhà trong vùng Diễn giải | ✔ |
| D5-H02 | Shell | F-NoHouse → đúng 1 chú thích trong Panel; DOM Panel không khớp /giờ sinh\|birth\|vĩ độ\|latitude/i; banner F4 là vùng riêng | ✔ |
| D5-H03 | Panel | F-Contradiction → chú thích hiện; không "Theo nhà" | ✔ |
| D5-A01 | Panel | F-NoHouse → mục Cung Mọc có đúng text C-11; không nút "Xem trên biểu đồ"; mở/đóng được; PlanetInSign hành tinh còn hiển thị | ✔ |
| D5-A02 | Panel | Có Nhà, thiếu entry Ascendant → hiện "Chưa có nội dung cho mục này", **không** hiện "chưa khả dụng" (phân biệt nội dung/dữ liệu góc) | ✔ |
| D5-A03 | Shell | F-NoHouse: chọn Mặt Trời → mục "Đang chọn" + mở; "Đọc diễn giải" focus nút Mặt Trời; Escape giữ hành vi F4; Cung Mọc không bao giờ "Đang chọn"; không cuộn/dời focus khi chỉ chọn | ✔ |
| D5-V01 | Page | F-NullEmpty → S-03; Planet/House/Aspect table còn; 0 `reportError` | ✔ |
| D5-V02 | Panel+Page | F-VerEmpty → S-08, **không** "chưa phát hành"; 1 `reportError` | ✔ |
| D5-V03 | Panel | F-NullItems → nội dung hiển thị; 0 báo; không "chưa phát hành" | ✔ |
| D5-V04 | Panel | Quét DOM mọi trạng thái: không chứa version (`"1.0"`), "null", `tone`, `contentSource` | ✔ |
| D5-P01 | Page | F-MissingOne → 1 dòng thiếu; 20 mục khác nguyên; `reportError` đúng 1 lần với `CONTENT_MISSING×1` | ✔ |
| D5-P02 | Panel+Page | F-Unsupported → không DOM thừa; 1 báo `SUBJECT_UNSUPPORTED` | ✔ |
| D5-P03 | Panel | Thiếu nhiều part (nhưng còn nội dung) → không `Alert` mới; số đếm đúng | ✔ |
| D5-E01 | Panel | F-Malformed → siblings đủ; không rò khoá thô/`bodyText` lỗi | ✔ |
| D5-E02 | Page | Render lại cùng payload → tổng `reportError` vẫn 1 | ✔ |
| D5-E03 | Page | F-ModelThrows (H-1) → viewer F4 hiển thị; không Panel; 1 `reportError` context `interpretation-model-build` | ✔ |
| D5-M01 | Shell | F-NoHouse, F-NullEmpty, F-MoonEdge → DOM không chứa /bất định\|không chắc\|ranh giới\|uncertain/i quanh mục Mặt Trăng | ✔ |
| D5-M02 | Static | AR-09: không có `isBirthTimeKnown`/`birthTime` hay tính toán độ Moon trong 3 component + copy | ✔ |

*(D5-E03 và AR-09 phụ thuộc quyết định tương ứng; nếu D-M5-05 bị từ chối thì bỏ D5-E03.)*

### 8.5 Lệnh chạy (tại `frontend/`; đặt `VITE_API_BASE_URL=http://localhost:3000`)
`npm run format:check` · `npm run lint` · `npm run typecheck` · `npx vitest run src/features/chart src/pages/app/charts` · toàn bộ `npx vitest run` · `npm run build` · `CI=1 npx playwright test --list` (kỳ vọng vẫn **38/7**; M5 không thêm E2E) · coverage từng file: `npx vitest run --coverage --coverage.include=<file> --coverage.reporter=text <test>`.
**Gate diff rỗng:** `git diff --stat <HEAD-trước-M5>..HEAD -- frontend/src/features/chart/model/selection.ts frontend/src/features/chart/model/interpretation.ts` (và 3 file copy/component nếu không chọn B). **Grep gate:** không `dangerouslySetInnerHTML`; không `isBirthTimeKnown` trong vùng interpretation.

### 8.6 Bằng chứng cần thu
Đầu ra lệnh (không tự chứng nhận), danh sách test mới + "đỏ-trước-xanh", coverage từng file thay đổi, `git diff --stat`, link CI, bản ghi KG-F5-01, bảng quyết định đã duyệt; ảnh S-05 @375px (nếu D-M5-11 chọn làm).

---

## 9. Risk and Mitigation Register

| ID | Rủi ro | Xác suất/Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| R5-01 | AC-19 đọc khác nhau ("/" = và/hoặc) | TB / TB | D-M5-03; ghi trong Matrix; U-09/U-09b/U-22 đã khoá bốn tổ hợp ở mức model, D5-V* khoá ở mức UI |
| R5-02 | `null`+có mục (bất thường Backend) bị im lặng | Thấp / Thấp | Chấp nhận có chủ ý (không phải lỗi người dùng); test D5-V03 mô tả; không báo để tránh ồn |
| R5-03 | Entry hỏng/lỗi dựng model làm sập route | Thấp / **Cao** | H-1 + D5-E03; theo đọc mã, model không ném với đầu vào kiểu `unknown` |
| R5-04 | Báo lỗi trùng (rời/quay lại; StrictMode dev) | TB / Thấp | Chính sách "1 lần/payload/mount" ghi rõ; D5-E02; không thêm dedupe toàn cục |
| R5-05 | Hồi quy M3/M4 (allowlist purity, snapshot, focus) | Thấp / Cao | Chỉ *thêm* test; diff rỗng file lõi; chạy lại toàn bộ test M3/M4 |
| R5-06 | A11y/mobile: S-05 thiếu ảnh 375px; `role=alert` ồn | TB / Thấp | D-M5-07/11; xác minh Narrator ở M6, không tuyên bố đạt |
| R5-07 | Copy mơ hồ ("một số góc"); banner F4 nhắc "cần giờ sinh" | TB / Thấp | D-M5-01/02; mặc định giữ, phương án B sẵn |
| R5-08 | Người dùng hiểu "không cảnh báo" = "Mặt Trăng chắc chắn" | Chắc chắn / TB | KG-F5-01; disclaimer chung; chờ Backend |
| R5-09 | Test dương tính giả (đã từng xảy ra ở F3-M7) | TB / TB | Yêu cầu "đỏ-trước-xanh" + coverage thật từng file |
| R5-10 | Phạm vi trôi (làm lại M3) | TB / TB | D-M5-00 + gate diff rỗng |

---

## 10. Dependency and Owner Decision Register

### 10.1 Phụ thuộc

| Phụ thuộc | Nguồn | Đầu ra cần | Trạng thái | Chặn? | Giảm thiểu/Owner |
|---|---|---|---|---|---|
| Model + issue taxonomy | M2 | `InterpretationModel.issues` | [VF] đủ | Không | — |
| Panel/Overview/Item + copy | M3 | state S-03…S-08 | [VF] đủ | Không | — |
| Selection/navigation | M4 | `revealItem`, `canReadInterpretation`… | [VF] đủ | Không | — |
| Fixtures `ChartResponse` | F4/M1 | `chartFull`, `chartNoHouses` | [VF] | Không | — |
| CI seed nội dung | F5.M1 | 252 bản ghi | [VF] (matrix M1) | Không | — |
| Quy ước branch/PR/merge `dev`→`main` | C-1 | tài liệu quy ước | **[UNK]** chưa có văn bản | **Không chặn M5**, chặn đóng sprint | Owner nêu |
| FG-01 / FG-07 Backend | F4 registry | `isBirthTimeKnown` + quyết định bất định Moon | Chưa có | Không (ghi KG) | Owner/BE |

### 10.2 Quyết định (mặc định = [REC], **chưa duyệt**)

| ID | Vấn đề | Mặc định đề xuất | Chặn? |
|---|---|---|---|
| **D-M5-00** | Định nghĩa lại M5 = "củng cố & đóng", không làm lại M3 (C-3) | **Có** | **Có** |
| D-M5-01 | Banner F4 `HouseDataNotice` (C-4): A giữ (KG-F5M3-02, đã quyết ở O-8) / B sửa câu | **A** | Không |
| D-M5-02 | Xác nhận copy hiện tại là cuối cùng (disclaimer đã [AD]); giữ chú thích Nhà như cũ | **Giữ, không đổi** | Không |
| D-M5-03 | AC-19 đọc là "`version=null` **và** `[]`" (như mã); `"1.0"`+`[]` = S-08 | **Có** | Không |
| D-M5-04 | AC-20 "đúng một lần" = một lần gộp/payload/mount | **Có** | Không |
| D-M5-05 | H-1: cô lập lỗi dựng model; không dựng UI fallback | **Duyệt** | Không |
| D-M5-06 | `SUBJECT_UNSUPPORTED` tiếp tục là `defect` có báo | **Giữ** | Không |
| D-M5-07 | S-08 giữ `role=alert`; kiểm lại bằng trình đọc màn hình ở M6 | **Giữ** | Không |
| D-M5-08 | KG-F5-01 ghi ở Matrix M5 + bảng F5 plan; registry riêng ở M8 | **Có** | Không |
| D-M5-09 | `ANGLE_ABSENT` khi có Nhà: chỉ tài liệu hoá, không thêm mã issue | **Chỉ ghi chú** | Không |
| D-M5-10 | Không đổi version/CHANGELOG ở M5 (hiện `frontend@0.3.0`) | **Có** | Không |
| D-M5-11 | Chụp lại S-05 @375px ở M5 (đóng KG-F5M3-04) hay để M7 | **Tuỳ Owner** | Không |

---

## 11. Documentation and Release

- **KG-F5-01:** ghi đầy đủ ở Matrix M5 (5.7) và cập nhật trạng thái trong bảng KG của F5 plan; **không** tuyên bố đã giải quyết. Registry F5 độc lập (nếu dùng) hoàn thiện ở M8.
- **UI Specification (`docs/frontend/Frontend_UI_Specification.md`):** không đổi ở M5; as-built §12.6/§13 thuộc M8 (C-11).
- **CHANGELOG & version:** không đổi ở M5; `package.json` hiện `0.3.0`; điều kiện `0.4.0` (D-F5-08) chốt ở M8.
- **F5 plan §10 M5:** thay câu "chú thích Nhà trung tính (Overview và `HouseDataNotice`) … entry hỏng + `reportError`" bằng mô tả "củng cố & xác minh; KG-F5-01" để tránh hiểu nhầm.
- **Plan này** xoá sau khi M5 đóng; Evidence Matrix lưu archive.
- **Bằng chứng đóng sprint:** Matrix M5 thêm vào chuỗi M1–M8.

---

## 12. Acceptance and Definition of Done

| # | Tiêu chí | Bằng chứng |
|---|---|---|
| 1 | AC-17…22 có truy vết, mỗi AC ≥1 test tên rõ | Mục 3.2 + kết quả test |
| 2 | Cả sáu trạng thái suy giảm được phủ (Mục 8.4) | Danh sách D5-* xanh, "đỏ-trước-xanh" |
| 3 | Nội dung hợp lệ vẫn dùng được khi suy giảm một phần | D5-P01/P03, D5-E01 |
| 4 | Entry hỏng bị cô lập và báo đúng chính sách | D5-E01…E03 |
| 5 | KG-F5-01 ghi chính xác, trạng thái OPEN | Matrix M5 |
| 6 | Hồi quy M3/M4 xanh; `selection.ts`/`interpretation.ts` diff rỗng | `git diff --stat` + toàn bộ test |
| 7 | Cổng chất lượng: format, lint, typecheck, build, toàn bộ Vitest, 38 E2E list | Log lệnh thật |
| 8 | Không có diễn giải/Moon suy luận; không `dangerouslySetInnerHTML` | D5-M01/M02 + grep |
| 9 | Không đổi API/Backend/kiến trúc ngoài H-1 | diff |
| 10 | Quyết định D-M5-00…11 được ghi (duyệt/từ chối) | Matrix |
| 11 | Bằng chứng a11y/responsive: chỉ ghi `VERIFIED` cho phần thật sự kiểm; phần còn lại `UNVERIFIED`/`ACCEPTED GAP` | Matrix |

---

## 13. Final Readiness Assessment

**Kết luận: READY WITH CONDITIONS.**

- **Blocking:** duy nhất **D-M5-00** (xác nhận M5 là "củng cố & đóng"). Nếu Owner muốn làm lại M3 thì plan này không áp dụng.
- **Non-blocking:** D-M5-01…11 đều có mặc định an toàn; C-1 (quy ước branch/PR) cần trước khi đóng sprint, không cần để bắt đầu M5.
- **Phần chưa xác minh trong plan này:** ESLint/build/toàn bộ Vitest/coverage/E2E chưa tự chạy; chi tiết ảnh hưởng của phương án B tới test F4; hành vi StrictMode; CI log từng bước.
- **Owner cần duyệt:** D-M5-00 (bắt buộc); D-M5-05 (H-1); D-M5-03 (cách đọc AC-19); D-M5-02 (một dòng xác nhận copy). Các mục còn lại chấp nhận mặc định nếu im lặng — nhưng nên ghi rõ vào Matrix.
- **Việc đầu tiên nên làm:** **M5.0** — chốt D-M5-00 và chạy lại baseline; sau đó viết trước **D5-A03** (hồi quy M4 trên fixture không-Nhà): nếu xanh ngay trên mã hiện tại, đó là bằng chứng trực tiếp rằng M5 không cần đổi hành vi M3/M4.
