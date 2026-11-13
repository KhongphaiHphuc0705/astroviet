# Sprint F5 — Known Gaps Registry

> **Sprint:** F5 — Natal Chart Interpretation Experience (`FE-S5.1`–`FE-S5.7`)  
> **Release Target:** `0.4.0`  
> **Registry Version:** 1.0 (Draft Proposal for Sprint F5 Closure)  
> **Date:** 2026-11-12  
> **Status:** DRAFT REGISTRY (PROPOSED FOR SPRINT F5 CLOSURE)  
> **Scope:** Frontend (`frontend/`), Backend Interface Boundaries, E2E Integration, and Documentation

---

## 1. Registry Policy & Taxonomy

Tài liệu này ghi nhận toàn bộ các giới hạn kỹ thuật đã biết (Known Gaps), nợ kỹ thuật (Technical Debt), tính năng hoãn lại (Deferred Features), các mục chưa kiểm chứng (Unverified Items), và các đánh đổi kiến trúc (Architectural Trade-offs) phát sinh hoặc kế thừa trong suốt quá trình triển khai Sprint F5.

### 1.1 Nguyên tắc quản lý Gap (Registry Rules)
1. **Evidence-based:** Mọi khoảng trống (gap) đều phải có bằng chứng đối chiếu thực tế (unit test, E2E test, CI run log, hoặc ảnh chụp màn hình), không suy đoán.
2. **Không xoá khi sửa mã:** Gap không tự động biến mất khi có thay đổi code trừ khi có test hoặc bằng chứng nghiệm thu đóng gap rõ ràng (`RESOLVED`).
3. **Phê duyệt độc lập cho `ACCEPTED GAP`:** Trạng thái `ACCEPTED GAP` chỉ được áp dụng khi có sự chấp thuận bằng văn bản từ Product Owner kèm ngày và tham chiếu cụ thể (ví dụ quyết định `D-F5-08`, `D-M7-01`, `D-M8-11`).
4. **Không chặn nghiệm thu nếu đã có Disposition:** Các gap ở mức `Thấp` hoặc `Trung bình` đã được phân loại `DEFERRED`, `ACCEPTED GAP`, hoặc `ACCEPTED TRADE-OFF` không chặn việc đóng Sprint F5 dưới trạng thái *"Completed with accepted limitations"* (theo quyết định `D-M8-10`).

### 1.2 Thang phân loại mức độ nghiêm trọng (Severity)
| Severity | Ý nghĩa & Tiêu chuẩn xử lý |
|---|---|
| **Cao (P1)** | Lỗi ngăn chặn phát hành production hoặc chặn đóng milestone; bắt buộc phải sửa trong sprint hiện tại. |
| **Trung bình (P2)** | Ảnh hưởng trực tiếp đến trải nghiệm người dùng hoặc phạm vi kiểm thử tự động, nhưng có cơ chế phòng thủ (graceful degradation) hoặc đã được Product Owner duyệt chấp nhận hoãn. |
| **Thấp (P3)** | Nợ kỹ thuật tài liệu, giới hạn hiển thị vi mô, hoặc tối ưu hóa hiệu năng không gây lỗi hệ thống. |

### 1.3 Trạng thái Gap (Status)
- **OPEN:** Khoảng trống đang tồn tại và cần tiếp tục theo dõi/xử lý trong các sprint tiếp theo.
- **ACCEPTED GAP:** Giới hạn đã được Product Owner chính thức phê duyệt chấp nhận (có quyết định bằng chứng).
- **ACCEPTED TRADE-OFF:** Đánh đổi kỹ thuật hoặc thiết kế có chủ đích nhằm bảo đảm tính ổn định hoặc hiệu năng (đã duyệt).
- **DEFERRED:** Tính năng hoặc phạm vi chủ động lùi sang các sprint tương lai (F6+).
- **RESOLVED:** Khoảng trống đã được xử lý triệt để và xác minh bằng chứng trong Sprint F5.
- **UNVERIFIED:** Giới hạn chưa đủ điều kiện hạ tầng/dữ liệu thực tế để kiểm chứng độc lập.

---

## 2. Bảng tổng hợp Known Gaps Registry F5 (Master Table)

| ID | Nhóm | Mô tả tóm tắt | Milestone / AC | Evidence | Severity | Status | Owner | Next Action | Tham chiếu duyệt Owner |
|---|---|---|---|---|---|---|---|---|---|
| **KG-F5-01** | Domain Uncertainty | Không có cảnh báo độ bất định vị trí Mặt Trăng khi thiếu giờ sinh do Backend không cung cấp tín hiệu độ bất định | M5 / AC-18 | Test `D5-M01` (F-MoonEdge), contract `ChartResponse` | Trung bình | **OPEN** | Backend | Tích hợp khi Backend có hợp đồng `FG-07` | Chưa có phê duyệt giải pháp từ Owner; ghi nhận trong Plan §15.3, chờ Backend FG-07 |
| **KG-F5-02** | Domain Scope | Chưa có diễn giải cho các góc chiếu (aspects), cấu trúc (patterns), và tổng hợp (summary); v1.0 tập trung Sign & House | M2, M3 / AC-01, AC-07 | `interpretations.vi.json` (252 mục), `interpretation.ts` | Trung bình | **DEFERRED** | Owner | Mở rộng domain model ở Sprint F6+ | Plan §15.3, UI Spec §12.6 as-built |
| **KG-F5-03** | Domain Points | Diễn giải chỉ hỗ trợ 10 hành tinh + Cung Mọc; chưa hỗ trợ Chiron, Lilith, Nodes và các đỉnh Nhà độc lập | M2, M3 / AC-03 | `INTERPRETATION_GROUP_SPECS` trong `interpretation.ts` | Thấp | **DEFERRED** | Backend | Bổ sung khi Backend có nội dung seed | Plan §15.3 |
| **KG-F5-04** | Contract Alignment | Trường `tone` luôn null; DTO không có trường `contentSource`/`source` (AI/Human); Frontend không hiển thị badge nguồn | M2 / AC-08 | Test `U-22`, DTO `ChartInterpretationDto` | Thấp | **RESOLVED** | Frontend | Giữ nguyên xử lý phòng thủ | Quyết định D-M8-01 (Hợp đồng thật là source of truth) |
| **KG-F5-05** | Interaction | Cung Mọc (Ascendant) là góc, không chọn ngược từ Wheel để kích hoạt đồng bộ như hành tinh | M4 / AC-13, AC-14 | `ChartViewerShell.interpretation.test.tsx` | Thấp | **DEFERRED** | Frontend | Thiết kế tương tác chọn Angle trên Wheel ở F6+ | Plan §15.3 |
| **KG-F5-06** | Documentation | `frontend/README.md` dòng 69 ghi "E2E bị skip trong CI" là thông tin lỗi thời sau khi M7 tích hợp CI E2E | M8 / AC-30 | `frontend/README.md` dòng 69, workflow CI | Thấp | **RESOLVED** | Frontend | Đã cập nhật dòng 69 `frontend/README.md` | Quyết định D-M8-08 |
| **KG-F5-07** | QA Matrix | Chưa thực hiện QA thủ công trên thiết bị thực tế (iOS Safari, Android) và Screen Reader ngoài Windows (VoiceOver/TalkBack) | M6, M7 / AC-25, AC-27 | Báo cáo QA M6 giới hạn trên Windows 11 + Chromium CDP | Trung bình | **OPEN** | Dev | Đưa vào kế hoạch kiểm thử release đa nền tảng | Plan §15.3, CHANGELOG [0.4.0] |
| **KG-F5M3-02** | UX Copy | Phân kỳ câu chữ thông báo thiếu dữ liệu Nhà giữa banner cấp chart F4 (`HouseDataNotice`) và Panel F5 | M3, M5 / AC-17 | `InterpretationOverview.tsx` vs `HouseDataNotice.tsx`, test `D5-H03` | Thấp | **ACCEPTED TRADE-OFF** | Dev | Cân nhắc hợp nhất copy ở bản cập nhật tiếp theo | Quyết định D-M5-01 (bảo tồn độc lập copy F4 và F5) |
| **KG-F5M3-04** | Visual QA | Thiếu ảnh chụp minh chứng trạng thái suy giảm S-05 @375px màn hình hẹp | M3, M6 / AC-25 | Ảnh chụp thực nghiệm `m6_r03_375_s05.png` | Thấp | **RESOLVED** | Dev | Đã nghiệm thu đo đạc và chụp ảnh tại M6.1 | Quyết định D-M6-09 |
| **KG-F5M4-01** | Accessibility | Windows Narrator không phát ra âm thanh thông báo live region mong muốn; cấu trúc ARIA đã xác thực qua CDP Tree | M4, M6 / AC-27 | Chromium CDP Tree `m6_s_accessibility_tree.json`, axe scan 0 violations | Trung bình | **ACCEPTED GAP** | Owner | Nghiên cứu tối ưu phát âm với Narrator hoặc NVDA/JAWS | Phê duyệt Owner 2026-11-09 & D-M8-11 |
| **KG-F5M4-02** | UX / Fallback | Fallback bảng khi `labelLayout` tràn trên wheel (`items: []`) chưa tái lập được trong QA thực tế với dữ liệu thật | M4, M6 / AC-25, AC-26 | Đã kiểm chứng qua unit test `FC-03`, `FC-04`, `SH-N7` | Thấp | **UNVERIFIED** | Dev | Tái lập kịch bản edge case trong test chuyên biệt | Matrix M4, Matrix M6 |
| **KG-F5M4-03** | Cross-browser | Bộ kiểm thử tự động E2E chỉ chạy trên Chromium Desktop; chưa có suite tự động trên WebKit và Gecko | M4, M6, M7 / AC-25, AC-29 | `playwright.config.ts` (chỉ 1 project `chromium`) | Trung bình | **OPEN** | Dev | Bổ sung WebKit/Firefox projects khi CI hỗ trợ | CHANGELOG [0.4.0] |
| **KG-F5M6-01** | Test Stability | Flake concurrency trong full Vitest suite tại `router.test.tsx` (dòng 142) khi chạy 145 files song song | M6, M7 / AC-28, AC-30 | Vitest run logs: 144/145 pass song song; pass 13/13 khi chạy độc lập | Thấp | **OPEN** | Dev | Tinh chỉnh isolate worker hoặc timeout cho router test | Matrix M6, Matrix M7 |
| **KG-F5M6-02** | UX / Layout | Khả năng tìm thấy Panel Diễn giải trước khi chọn đối tượng bị hạn chế trên mobile do vị trí nằm dưới Wheel | M6 / AC-25, AC-26 | Số đo layout §7.1 trong Matrix M6 (3481px @1280px, 6478px @375px) | Thấp | **ACCEPTED TRADE-OFF** | Owner | Cân nhắc thêm shortcut nhảy trực tiếp tại toolbar | Quyết định D-M6-02 |
| **KG-F5M7-01** | E2E Integration | Endpoint tìm kiếm vị trí `/api/v1/locations/search` (GeoNames) được mock trong Real Backend E2E để tránh rủi ro mạng | M7 / AC-28, AC-29 | `e2e/interpretation.spec.ts` dòng 89, 497 | Thấp | **ACCEPTED TRADE-OFF** | Dev | Duy trì mock ngoại vi, tập trung API nội bộ | Phê duyệt quyết định D-M7-04 (2026-11-09) |
| **KG-F5M7-02** | Test Strategy | 10 test E2E responsive layout từ M6 dùng `page.route` mock fixture thay vì Real Backend | M6, M7 / AC-25, AC-29 | `e2e/interpretation-responsive.spec.ts` | Thấp | **ACCEPTED TRADE-OFF** | Dev | Duy trì suite mock độc lập cho layout responsive | Quy ước phân tách suite mock responsive và Real Backend; D-M8-07 ghi nhận phân bổ test count |
| **KG-F5M7-03** | CI / DevOps | GitHub Actions chỉ tải lên Playwright test artifact khi fail; không giữ trace/screenshot khi toàn bộ 60 test pass | M7 / AC-28, AC-29 | `.github/workflows/frontend-ci.yml` bước upload artifact | Thấp | **ACCEPTED TRADE-OFF** | Dev | Duy trì chính sách để tiết kiệm quota lưu trữ | Cấu hình workflow CI (`if: failure()`), tối ưu quota lưu trữ |

---

## 3. Hồ sơ chi tiết các Gap trọng yếu (Detailed Gap Profiles)

### 3.1 KG-F5-01 — Độ bất định vị trí Mặt Trăng khi thiếu giờ sinh (Moon Boundary Uncertainty)
- **Bản chất kỹ thuật:** Mặt Trăng di chuyển xấp xỉ 13.2° mỗi ngày (khoảng 0.55° mỗi giờ). Khi một lá số không rõ giờ sinh (`isBirthTimeKnown: false`), Backend (`time-conversion.ts`) neo mốc tính toán tại 12:00:00 giờ địa phương theo múi giờ nơi sinh. Nếu vị trí tính được nằm rất gần ranh giới giữa 2 cung hoàng đạo, vị trí thực tế tại các thời điểm khác trong ngày có thể đã thuộc về cung liền kề. Tuy nhiên, API hiện tại không cung cấp trường cờ hoặc khoảng bất định (uncertainty range) cho đối tượng Mặt Trăng.
- **Biện pháp phòng thủ tại Frontend:** Tuân thủ nguyên tắc không tự suy diễn dữ liệu: Frontend hiển thị nội dung diễn giải theo cung mà Backend tính toán, không tự phát sinh cảnh báo suy đoán (xác nhận qua unit test `D5-M01` và `D5-M02 / AR-09`).
- **Hướng giải quyết:** Đưa vào hợp đồng `FG-07` của Backend ở Sprint tiếp theo để cung cấp cờ dữ liệu chính thức.

### 3.2 KG-F5M4-01 — Windows Narrator Live Region Audio (ACCEPTED GAP)
- **Bản chất kỹ thuật:** Tiêu chuẩn WAI-ARIA quy định vùng `aria-live="polite"` thông báo cập nhật khi trạng thái lựa chọn thay đổi. Kiểm tra bằng Chromium Accessibility Tree (CDP) ghi nhận đầy đủ 1.207 nodes, cấu trúc live-region và thuộc tính `aria-current="true"` hoàn toàn hợp lệ, 0 lỗi axe-core. Tuy nhiên, trên môi trường Windows 11 với Windows Narrator, luồng âm thanh thông báo không phát ra giọng đọc ổn định như kỳ vọng của kiểm thử tự động.
- **Phê duyệt của Product Owner:** Product Owner đã trực tiếp xem xét và phê duyệt trạng thái **ACCEPTED GAP** cho riêng phần âm thanh Narrator trong phiên làm việc ngày 2026-11-09 (quyết định `D-M8-11`). Cấu trúc ngữ nghĩa được nghiệm thu qua cây trợ năng CDP và Playwright assertion.

### 3.3 KG-F5M7-01 — GeoNames Search Mock Boundary trong Real Backend E2E
- **Bản chất kỹ thuật:** Trong kịch bản E2E Real Backend (`interpretation.spec.ts`), API tìm kiếm địa lý GeoNames (`/api/v1/locations/search`) phụ thuộc vào dịch vụ web bên ngoài (có nguy cơ rate limit, timeout, hoặc rớt mạng).
- **Đánh đổi kiến trúc:** Để bảo đảm CI chạy ổn định và determinism, chỉ duy nhất endpoint ngoại vi này được giả lập (`page.route`). 100% các API cốt lõi của hệ thống (đăng ký, đăng nhập, hồ sơ sinh, tính toán lá số, truy xuất diễn giải) đều chạy qua container backend Node.js/Express và cơ sở dữ liệu PostgreSQL thật. Quyết định được phê duyệt qua `D-M7-04`.

### 3.4 KG-F5M6-02 — Khả năng phát hiện (Discoverability) Panel Diễn giải
- **Bản chất kỹ thuật:** Trên viewport di động hẹp (375px), để đến được Interpretation Panel người dùng cần cuộn qua SVG Wheel và 3 bảng dữ liệu (tương đương ~6478px). Nút "Đọc diễn giải" chỉ hiển thị sau khi người dùng chủ động chọn 1 hành tinh.
- **Đánh đổi UX:** Thiết kế hiện tại ưu tiên hiển thị toàn vẹn bánh xe và dữ liệu hình học theo chuẩn F4. Product Owner chấp nhận đánh đổi này (theo `D-M6-02`); tính năng thanh điều hướng nhanh hoặc nút floating action bar sẽ được xem xét ở Sprint F6+.

---

## 4. Kế thừa các Gap kỹ thuật từ Sprint F4 (Carryover Gaps)

| ID | Nhóm | Mô tả | Trạng thái hiện tại | Kế hoạch xử lý |
|---|---|---|---|---|
| **FG-01** | Backend Contract | `ChartResponse` chưa có `isBirthTimeKnown` / `birthProfileId` / dữ liệu sinh | **OPEN** | Yêu cầu thay đổi Backend ở Sprint sau |
| **FG-07** | Astrology Domain | Mặt Trăng khi thiếu giờ sinh: chưa có độ bất định riêng từng thiên thể | **OPEN** | Quyết định kiến trúc / Hợp đồng dữ liệu Backend |
| **FG-10** | Core A11y / Nav | `<title>` động, focus sau điều hướng, drawer focus trap | **OPEN** | Nợ kỹ thuật core, giải quyết tại Backlog Core |
| **KG-M8-01** | Testing / AT | Kiểm thử trình đọc màn hình trên thiết bị chuyên dụng ngoài Windows | **ACCEPTED GAP** | Phê duyệt tại Sprint F4 M10 |
| **KG-M9-01** | Responsive / Sticky | Cột trái sticky chỉ bật khi chiều cao màn hình $\ge 1000\text{ px}$ và container $\ge 1010\text{ px}$ | **ACCEPTED GAP** | Phê duyệt tại Sprint F4 M10 |
| **KG-M10-03** | E2E Coverage | Bộ E2E tự động hóa chỉ bao phủ Chromium Desktop Chrome | **DEFERRED** | Hoãn kiểm thử đa trình duyệt |
| **KG-M10-05** | E2E Tooling | Helper E2E (`registerAndLogin`, `createBirthProfile`) lặp lại cục bộ giữa các spec | **DEFERRED** | Tái cấu trúc shared E2E fixture ở Sprint sau |
| **KG-CI-NODE20** | CI Tooling | Runner CI dùng Node 22; cảnh báo Node 20 là do các action runtime của GitHub Actions | **OPEN** | Nâng cấp các GitHub Actions dùng Node 20 runtime |

---

## 5. Kết luận & Điều kiện đóng Sprint F5

1. **Tổng số Gap Sprint F5:** 17 mục (chính xác theo bảng §2):
   - **RESOLVED:** 3 mục (`KG-F5M3-04`, `KG-F5-04`, `KG-F5-06`).
   - **ACCEPTED GAP:** 1 mục (`KG-F5M4-01`).
   - **ACCEPTED TRADE-OFF:** 5 mục (`KG-F5M3-02`, `KG-F5M6-02`, `KG-F5M7-01`, `KG-F5M7-02`, `KG-F5M7-03`).
   - **DEFERRED:** 3 mục (`KG-F5-02`, `KG-F5-03`, `KG-F5-05`).
   - **OPEN / UNVERIFIED:** 5 mục (`KG-F5-01`, `KG-F5-07`, `KG-F5M4-02`, `KG-F5M4-03`, `KG-F5M6-01`).
   *(Tổng cộng: 3 + 1 + 5 + 3 + 5 = 17 mục F5)*.
2. **Kế thừa từ Sprint F4:** 8 mục (2 ACCEPTED GAP, 2 DEFERRED, 4 OPEN).
3. **Đánh giá điều kiện nghiệm thu:** Không có gap nào ở mức **Cao (P1)** chặn phát hành. Toàn bộ các gap đã được phân loại trạng thái minh bạch với bằng chứng đối soát. Đủ điều kiện đóng Sprint F5 theo tiêu chí **"Completed with accepted limitations"**.
