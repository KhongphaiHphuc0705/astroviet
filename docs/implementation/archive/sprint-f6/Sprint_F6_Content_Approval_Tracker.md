# Sprint F6 — Content Approval Tracker & Supplementary Glossary (Milestone F6.6)

> **Sprint:** F6 — Knowledge Base (MVP, Frontend-only)  
> **Milestone:** F6.6 — 15 Bài viết Chính thức & Full QA  
> **Baseline Commit:** `3989a11` (`dev`)  
> **Created:** 2026-11-25 (Task `F6.6.1 / T1.4`)  
> **Overall Content Approval Status:** **0 / 15 Approved** (**6 / 15 `Ready for Review`** — Batch 1 & Batch 2; 9 / 15 `Draft`)  
> **Quy tắc bất biến (§21.1):**
>
> - Chu trình trạng thái: `Draft → Ready for Review → (Changes Requested ↔ Ready for Review) → Approved`.
> - **Chỉ Owner** được chuyển trạng thái sang `Approved`. Agent chỉ chuyển `Draft → Ready for Review` hoặc `Changes Requested → Ready for Review`.
> - Mọi chuyển trạng thái `Approved` bắt buộc gắn **ngày + commit SHA** của file `.md` được duyệt; nếu file thay đổi sau khi `Approved`, trạng thái tự quay về `Ready for Review`.
> - Không đóng DoD Milestone F6.6 khi vẫn còn bất kỳ bài nào khác trạng thái `Approved`.

---

## 1. Bằng chứng Khởi động Milestone F6.6 (`T1.1`, `T1.2`, `T1.5`)

| Task     | Hạng mục kiểm chứng                                                                                              | Kết quả thực tế tại HEAD `3989a11`                                                                                                                                                                                                                                                       | Trạng thái |
| -------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------: |
| **T1.1** | Entry & Baseline (`npm ci`, `format:check`, `lint`, `typecheck`, `vitest`, `npm run build`, `playwright --list`) | Node `v22.18.0`; `npm ci` (723 pkg); `format:check`/`lint`/`typecheck` 0 lỗi; **175 files / 1.484 tests PASS**; `npm run build` (2.343 client + 50 SSR modules, `PRERENDER OK`, 0 warning); **70 E2E tests / 10 files**                                                                  |  **PASS**  |
| **T1.2** | Gate F6.0b (`git grep` nhãn cũ, `labels.ts` ↔ UI Spec §12.11, test nhãn/góc chiếu)                               | `git grep` `Vuông chiếu\|Đối xung` trên `frontend/src` & `frontend/e2e`: **0 match**; 5 nhãn chuẩn khớp 100%; **4 files / 47 tests PASS** (`labels.test.ts` 25, `AspectBadge` 4, `AspectLegend` 4, `AspectTable` 14). Lưu ý `F6-AC-L5` (`KG-F6-09`) còn UNVERIFIED — không chặn soạn bài |  **PASS**  |
| **T1.5** | Spike E2E import tương đối `KNOWLEDGE_MANIFEST` (X6, `D-F6.6-11`) — không commit file spike                      | Import `../src/features/knowledge-base/model/manifest` & `../src/features/knowledge-base/model/types` trong Playwright: `--list` `exit 0`, runtime test **1/1 passed (4,8 s)**, đã xoá file spike tạm (`SPIKE_CLEANED=True`) ⇒ **Dùng import tương đối ở F6.6.6**                        |  **PASS**  |

---

## 2. Chốt Quyết định `D-F6.6-01..12` (`T1.3`)

Owner đã đồng ý áp dụng các mặc định đề xuất của `Sprint_F6.6_Content_QA_Implementation_Plan.md` §24. Các điểm cần Owner rà nhanh trước khi viết bài bị ảnh hưởng được đánh dấu rõ ở cột **Ghi chú / Owner Review**.

| Mã quyết định | Chủ đề                                              | Quyết định áp dụng (theo mặc định đề xuất)                                                                                                                   | Ghi chú / Owner Review                                                                                                                                                                                                       |
| ------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-F6.6-01** | Bộ tiêu đề 15 bài                                   | **Phương án A** — tiếng Việt chuẩn hoá theo `D-F6-C1` (`Sprint_F6_Implementation_Plan.md` §11.1), kèm bản đầy đủ đã Owner chốt cho `#8`, `#10`, `#13`, `#15` | **Đã Owner xác nhận (2026-11-25):** `#8` "Bốn nguyên tố và ba tính chất trong chiêm tinh"; `#10` "Tổng quan 12 nhà trong bản đồ sao"; `#13` "Góc chiếu trong chiêm tinh là gì?"; `#15` "Orb, Applying và Separating Aspects" |
| **D-F6.6-02** | Trường phái chủ tinh (`#9`, `#12`)                  | Trình bày **cả hai hệ (cổ điển & hiện đại)**, gắn nhãn trường phái rõ ràng; không hứa tính năng chủ tinh trên app                                            | Đã chốt theo mặc định                                                                                                                                                                                                        |
| **D-F6.6-03** | Bảng thuật ngữ tiếng Việt bổ sung                   | Dùng bảng thuật ngữ đã Owner xác nhận tại **Mục 4.2** của Tracker này                                                                                        | **Đã Owner xác nhận (2026-11-25):** xem chi tiết tại Mục 4.2                                                                                                                                                                 |
| **D-F6.6-04** | Hướng dẫn độ dài bài viết                           | ~500–900 từ/bài (hướng dẫn biên tập; không độn nội dung)                                                                                                     | Đã chốt theo mặc định                                                                                                                                                                                                        |
| **D-F6.6-05** | Chính sách nguồn tham khảo                          | **Phương án B** — chỉ liên kết nội bộ trong mục "Tìm hiểu thêm", không trích dẫn nguồn ngoài bịa                                                             | Đã chốt theo mặc định                                                                                                                                                                                                        |
| **D-F6.6-06** | Phạm vi `KB-U22` (`D-F6-A5`) & `KB-U23` (`D-F6-A6`) | `KB-U22` kiểm `Vuông chiếu`/`Đối xung` ngoài cụm alias (không auto-check "Hợp", rà thủ công); `KB-U23` import `ASPECT_TYPE_LABELS` chỉ trong test            | Đã chốt theo mặc định                                                                                                                                                                                                        |
| **D-F6.6-07** | Quy trình duyệt & Content Approval Tracker          | Duyệt theo **5 batch** (mỗi danh mục 1 batch) qua Tracker này, gắn ngày + commit SHA                                                                         | Đã chốt theo mặc định                                                                                                                                                                                                        |
| **D-F6.6-08** | Số lượng bài mục tiêu                               | Giữ **đủ 15 bài** (3 bài × 5 danh mục); giảm số bài chỉ khi có quyết định đổi scope từ Owner                                                                 | Đã chốt theo mặc định                                                                                                                                                                                                        |
| **D-F6.6-09** | Hình ảnh minh họa trong bài                         | **Không chèn ảnh** trừ khi Owner cung cấp asset vật lý vào `public/knowledge/images/` kèm alt                                                                | Đã chốt theo mặc định                                                                                                                                                                                                        |
| **D-F6.6-10** | Phân tách tài liệu F6.6 vs F6.7                     | F6.6 cập nhật Matrix F6.6 + Known Gaps + Tracker; CHANGELOG / UI Spec / README / Closure Report tổng ở F6.7                                                  | Đã chốt theo mặc định                                                                                                                                                                                                        |
| **D-F6.6-11** | Chiến lược đối chiếu card ↔ manifest trong E2E      | **Import đường dẫn tương đối** `KNOWLEDGE_MANIFEST` (đã xác minh khả thi 100% qua spike `T1.5`)                                                              | Đã xác minh kỹ thuật                                                                                                                                                                                                         |
| **D-F6.6-12** | Quy ước trường `updatedAt`                          | Ngày commit nội dung được Owner duyệt gần nhất (`YYYY-MM-DD`); cập nhật thủ công khi sửa nội dung có ý nghĩa                                                 | Đã chốt theo mặc định                                                                                                                                                                                                        |

---

## 3. Bảng Theo dõi Phê duyệt 15 Bài viết (Content Approval Tracker)

> **Trạng thái tiêu đề (`D-F6.6-01`):** Đã được Owner xác nhận đầy đủ cho cả 15 bài vào ngày 2026-11-25 (gồm bản đầy đủ cho `#8`, `#10`, `#13`, `#15`).  
> **Lưu ý liên kết nội bộ liên danh mục (L5):** Các bài `#1..#6` hiện liên kết chéo nội bộ lẫn nhau trong tập 6 bài đã có ở `manifest.ts` để giữ xanh cổng `KB-U29 L5`; các liên kết mở rộng sang nhóm Cung (`#7`), Nhà (`#10`) và Góc chiếu (`#13`) sẽ được bổ sung ở F6.6.3–F6.6.5 khi các slug tương ứng có mặt trong manifest.

| #   | Batch            | Category (`order`) | Slug                              | Tiêu đề chuẩn hoá (`D-F6.6-01` — Đã chốt)                          | Phụ thuộc chính                    | Content Status                      | Đánh giá GFM (`D-F6-G`) |  Owner Review   | Approval Evidence (Ngày + Commit SHA) |
| --- | ---------------- | ------------------ | --------------------------------- | ------------------------------------------------------------------ | ---------------------------------- | ----------------------------------- | :---------------------: | :-------------: | ------------------------------------- |
| 1   | Batch 1 (F6.6.2) | `fundamentals` (1) | `what-is-astrology`               | Chiêm tinh học là gì?                                              | —                                  | **Ready for Review** _(2026-11-25)_ |      Không cần GFM      | Chờ Owner duyệt | —                                     |
| 2   | Batch 1 (F6.6.2) | `fundamentals` (2) | `how-to-read-a-natal-chart`       | Cách đọc một bản đồ sao cá nhân                                    | `labels.ts`, Spec lá số            | **Ready for Review** _(2026-11-25)_ |      Không cần GFM      | Chờ Owner duyệt | —                                     |
| 3   | Batch 1 (F6.6.2) | `fundamentals` (3) | `planets-signs-houses`            | Hành tinh, cung hoàng đạo và nhà: Ba thành phần của lá số          | `labels.ts`                        | **Ready for Review** _(2026-11-25)_ |      Không cần GFM      | Chờ Owner duyệt | —                                     |
| 4   | Batch 2 (F6.6.2) | `planets` (1)      | `sun-moon-rising`                 | Mặt Trời, Mặt Trăng và Cung Mọc (Ascendant): Bộ ba nền tảng        | `labels.ts`, Spec giờ sinh         | **Ready for Review** _(2026-11-25)_ |      Không cần GFM      | Chờ Owner duyệt | —                                     |
| 5   | Batch 2 (F6.6.2) | `planets` (2)      | `personal-planets`                | Sao Thủy, Sao Kim và Sao Hỏa: Các hành tinh cá nhân                | `labels.ts`                        | **Ready for Review** _(2026-11-25)_ |      Không cần GFM      | Chờ Owner duyệt | —                                     |
| 6   | Batch 2 (F6.6.2) | `planets` (3)      | `social-and-outer-planets`        | Sao Mộc, Sao Thổ và các hành tinh thế hệ                           | `labels.ts`                        | **Ready for Review** _(2026-11-25)_ |      Không cần GFM      | Chờ Owner duyệt | —                                     |
| 7   | Batch 3 (F6.6.3) | `signs` (1)        | `zodiac-signs-overview`           | Tổng quan 12 cung hoàng đạo                                        | `labels.ts`                        | **Draft**                           |      Chưa đánh giá      |      Chưa       | —                                     |
| 8   | Batch 3 (F6.6.3) | `signs` (2)        | `elements-and-modalities`         | Bốn nguyên tố và ba tính chất trong chiêm tinh                     | `D-F6.6-03` ✔                      | **Draft**                           |     Ứng viên (4×3)      |      Chưa       | —                                     |
| 9   | Batch 3 (F6.6.3) | `signs` (3)        | `sign-rulerships`                 | Chủ tinh của 12 cung hoàng đạo                                     | `D-F6.6-02` ✔, `D-F6.6-03` ✔       | **Draft**                           |   Ứng viên (12 cung)    |      Chưa       | —                                     |
| 10  | Batch 4 (F6.6.3) | `houses` (1)       | `astrological-houses-overview`    | Tổng quan 12 nhà trong bản đồ sao                                  | Spec: Placidus / Whole Sign        | **Draft**                           |      Chưa đánh giá      |      Chưa       | —                                     |
| 11  | Batch 4 (F6.6.3) | `houses` (2)       | `angular-succedent-cadent-houses` | Nhà Angular, Succedent và Cadent                                   | `D-F6.6-03` ✔                      | **Draft**                           |    Ứng viên (3 nhóm)    |      Chưa       | —                                     |
| 12  | Batch 4 (F6.6.3) | `houses` (3)       | `house-rulers`                    | Chủ tinh của nhà (House Ruler)                                     | `D-F6.6-02` ✔, `D-F6.6-03` ✔       | **Draft**                           |      Chưa đánh giá      |      Chưa       | —                                     |
| 13  | Batch 5 (F6.6.4) | `aspects` (1)      | `what-are-astrological-aspects`   | Góc chiếu trong chiêm tinh là gì?                                  | F6.0b ✔                            | **Draft**                           |      Chưa đánh giá      |      Chưa       | —                                     |
| 14  | Batch 5 (F6.6.4) | `aspects` (2)      | `major-aspects`                   | Góc chiếu chính: Trùng tụ, Lục hợp, Vuông góc, Tam hợp và Đối đỉnh | F6.0b ✔, `KB-U22/U23`              | **Draft**                           |     Ứng viên (5×4)      |      Chưa       | —                                     |
| 15  | Batch 5 (F6.6.4) | `aspects` (3)      | `orbs-and-applying-separating`    | Orb, Applying và Separating Aspects                                | F6.0b ✔, Spec §18.3, `D-F6.6-03` ✔ | **Draft**                           |      Chưa đánh giá      |      Chưa       | —                                     |

---

## 4. Từ điển Thuật ngữ (Terminology Canon & Glossary Bổ sung)

### 4.1 Canon Hiện có trong Repo (Bắt buộc tuân thủ — không thay đổi)

- **14 thiên thể (`labels.ts`):** Mặt Trời, Mặt Trăng, Sao Thủy, Sao Kim, Sao Hỏa, Sao Mộc, Sao Thổ, Sao Thiên Vương, Sao Hải Vương, Sao Diêm Vương, Chiron, Lilith, Nút Bắc, Nút Nam.
- **12 cung hoàng đạo (`labels.ts`):** Bạch Dương, Kim Ngưu, Song Tử, Cự Giải, Sư Tử, Xử Nữ, Thiên Bình, Thiên Yết, Nhân Mã, Ma Kết, Bảo Bình, Song Ngư.
- **5 góc chiếu chuẩn (`labels.ts` & UI Spec §12.11 — Nguồn chuẩn duy nhất):**
  - `Conjunction` (☌ 0°, Trung tính): **Trùng tụ**
  - `Sextile` (⚹ 60°, Hài hòa): **Lục hợp**
  - `Square` (□ 90°, Căng thẳng): **Vuông góc**
  - `Trine` (△ 120°, Hài hòa): **Tam hợp**
  - `Opposition` (☍ 180°, Căng thẳng): **Đối đỉnh**
  - _Quy tắc alias:_ tên gọi khác (`Hợp`, `Vuông chiếu`, `Đối xung`) **chỉ** nêu làm alias ở lần xuất hiện đầu trong cụm chuẩn (ví dụ: `Đối đỉnh (còn gọi là Đối xung)`).
- **4 điểm góc (`labels.ts`):** Cung Mọc (Ascendant — `ASC`), Thiên Đỉnh (Midheaven — `MC`), Cung Lặn (Descendant — `DSC`), Thiên Để (Imum Coeli — `IC`).
- **2 hệ nhà hỗ trợ trên AstroViet (`Natal_Chart_Domain_Specification.md` §15):** `Placidus` (không hội tụ ở vĩ độ ≥ 66,5°), `Whole Sign`.
- **4 nguyên tố (đã nêu tại UI Spec §12.12):** **Lửa**, **Đất**, **Khí**, **Nước**.

### 4.2 Bảng Thuật ngữ Bổ sung Đã duyệt (`D-F6.6-03` — Owner xác nhận ngày 2026-11-25)

| Nhóm                | Thuật ngữ tiếng Anh          | Thuật ngữ chuẩn áp dụng trong bài viết KB                                                       | Quy tắc sử dụng                                                     | Bài áp dụng  |     Trạng thái Owner      |
| ------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------ | :-----------------------: |
| **4 Nguyên tố**     | Fire / Earth / Air / Water   | **Lửa / Đất / Khí / Nước** _(khớp nguyên văn UI Spec §12.12)_                                   | Dùng xuyên suốt                                                     | `#7`, `#8`   | **Đã duyệt (2026-11-25)** |
| **3 Tính chất**     | Cardinal / Fixed / Mutable   | **Tiên phong (Cardinal)** / **Kiên định (Fixed)** / **Linh hoạt (Mutable)**                     | Chú thích tên gốc lần đầu, dùng nhãn tiếng Việt chuẩn các lần sau   | `#7`, `#8`   | **Đã duyệt (2026-11-25)** |
| **3 Nhóm nhà**      | Angular / Succedent / Cadent | **Nhà Angular (nhà góc)**, **Nhà Succedent (nhà kế tiếp)**, **Nhà Cadent (nhà chuyển tiếp)**    | Kèm chú thích Việt ở **lần đầu**; những lần sau **chỉ giữ tên gốc** | `#10`, `#11` | **Đã duyệt (2026-11-25)** |
| **Chủ tinh**        | Sign Ruler / House Ruler     | **Chủ tinh của cung (Sign Ruler)** / **Chủ tinh của nhà (House Ruler)**                         | Chú thích tên gốc lần đầu                                           | `#9`, `#12`  | **Đã duyệt (2026-11-25)** |
| **Trường phái**     | Traditional / Modern Ruler   | **Chủ tinh cổ điển (Traditional Ruler)** / **Chủ tinh hiện đại (Modern Ruler)**                 | Gắn nhãn trường phái rõ ràng khi nêu chủ tinh                       | `#9`, `#12`  | **Đã duyệt (2026-11-25)** |
| **Độ lệch & Chiều** | Orb / Applying / Separating  | **Orb (độ lệch cho phép)**, **Applying (góc chiếu hội tụ)**, **Separating (góc chiếu phân ly)** | Giữ tên gốc kèm giải thích tiếng Việt chuẩn                         | `#13`, `#15` | **Đã duyệt (2026-11-25)** |

---

## 5. Checklist Duyệt Biên tập Thủ công (Áp dụng cho mọi Batch — §7.5)

Những tiêu chí dưới đây **không thể tự động hóa hoàn toàn** bằng lint/unit test và cần kiểm tra thủ công cho từng bài trước khi chuyển `Ready for Review` / `Approved`:

- [ ] **Từ "Hợp":** Mọi lần xuất hiện của từ "Hợp" trong bài đều đúng ngữ cảnh (ví dụ "phù hợp", "Lục hợp", "Tam hợp"), không dùng thay cho nhãn chuẩn "Trùng tụ".
- [ ] **Alias nhãn cũ:** `Vuông chiếu` / `Đối xung` (nếu có) chỉ xuất hiện ở **lần đầu** dưới dạng alias chú thích, không lặp lại làm thuật ngữ chính.
- [ ] **Không khẳng định tất định:** Không hứa hẹn dự đoán tương lai chắc chắn; phân biệt rõ tri thức chiêm tinh phổ biến với hành vi kỹ thuật của AstroViet.
- [ ] **Khớp Spec AstroViet:** Mọi chi tiết về tính năng (14 thiên thể, 5 góc chiếu, 2 hệ nhà Placidus/Whole Sign, giới hạn vĩ độ ≥ 66,5°, `isHouseDataAvailable=false` khi thiếu giờ sinh, `isApplying` wrap-aware, chưa có tính năng chủ tinh) đều khớp Spec.
- [ ] **Toán học & ví dụ:** Mọi số độ, cung hoàng đạo, góc chiếu, ví dụ orb trong bài đều chính xác về mặt toán học.
- [ ] **Chính tả & ngôn ngữ:** 100% tiếng Việt tự nhiên, không lỗi dấu/chính tả, không từ tiếng Anh thừa ngoài thuật ngữ gốc cần chú thích.
- [ ] **Độ khớp `summary` ↔ thân bài:** `summary` (≤ 160 ký tự) phản ánh đúng nội dung thật của bài, không hứa nội dung không có trong thân bài.
- [ ] **Không placeholder & không trùng lặp:** Không `TODO`/`Lorem`/`Draft`, không sao chép nội dung thừa giữa các bài; mọi liên kết nội bộ có văn cảnh tự nhiên.

### 5.1 Nhật ký Kiểm thử Thủ công §7.5 — Batch 1 & Batch 2 (`F6.6.2`, 2026-11-25)

| Bài | Slug                        | Số từ (`wc -w`) | Summary (≤ 160) | Nhãn cũ / Placeholder | Rà từ `"Hợp"` theo ngữ cảnh                                  | Lint L1–L6 (`KB-U29`) | Kết luận tự kiểm |
| --- | --------------------------- | :-------------: | :-------------: | :-------------------: | ------------------------------------------------------------ | :-------------------: | :--------------: |
| #1  | `what-is-astrology`         |       797       |      139 ✔      |         0 / 0         | `Lục hợp (60°)`, `Tam hợp (120°)` — đúng ngữ cảnh            |        0 lỗi ✔        | Đạt — Chờ Owner  |
| #2  | `how-to-read-a-natal-chart` |       829       |      140 ✔      |         0 / 0         | `Phối hợp Quốc`, `phối hợp tạo`, `Lục hợp`, `Tam hợp` — đúng |        0 lỗi ✔        | Đạt — Chờ Owner  |
| #3  | `planets-signs-houses`      |       861       |      127 ✔      |         0 / 0         | `kết hợp ba`, `trường hợp so` — đúng ngữ cảnh                |        0 lỗi ✔        | Đạt — Chờ Owner  |
| #4  | `sun-moon-rising`           |       868       |      135 ✔      |         0 / 0         | Không xuất hiện                                              |        0 lỗi ✔        | Đạt — Chờ Owner  |
| #5  | `personal-planets`          |       821       |      135 ✔      |         0 / 0         | `phối hợp liên` — đúng ngữ cảnh                              |        0 lỗi ✔        | Đạt — Chờ Owner  |
| #6  | `social-and-outer-planets`  |       850       |      133 ✔      |         0 / 0         | `Lục hợp`, `Tam hợp` — đúng ngữ cảnh                         |        0 lỗi ✔        | Đạt — Chờ Owner  |

---

## 6. Theo dõi Cổng GFM (`D-F6-G`) & Mẫu Decision Request

- **Trạng thái hiện tại:** **PENDING** (chưa kích hoạt — sẽ đánh giá tổng thể trên 15 bản nháp tại `F6.6.4 / T4.5`).
- **Quy tắc:** `react-markdown` giữ nguyên **không có `remark-gfm`** và lint L4 (`KB-U29`) vẫn chặn bảng/strikethrough/task list. Nếu có ≥ 1 bài (ứng viên: `#8`, `#9`, `#11`, `#14`) thực sự cần bảng mà danh sách lồng nhau làm giảm độ rõ/khả năng đối chiếu 2 chiều ⇒ dừng phần phụ thuộc GFM và điền mẫu dưới đây trình Owner duyệt **bằng văn bản**.

### Mẫu GFM Decision Request _(chỉ điền nếu Trường hợp B xảy ra)_

```markdown
### GFM Decision Request (D-F6-G)

- **Bài viết & vị trí:** <slug>, mục `<heading>`
- **Cú pháp GFM cần dùng:** <ví dụ: bảng 4×3 / 5×4>
- **Phương án Markdown cơ bản đã thử:** <tóm tắt danh sách lồng nhau>
- **Lý do phương án thay thế chưa đạt:** <ảnh hưởng khả năng đối chiếu / đọc hiểu>
- **Tác động kỹ thuật:** +1 dependency `remark-gfm` (exact), cập nhật lint L4, bổ sung test XSS/URL cho bảng, `npm audit`, đo chênh lệch chunk Detail
- **Đề xuất:** <Bật `remark-gfm` có kiểm soát / Giữ Markdown cơ bản>
- **Phê duyệt Owner (văn bản + ngày):** [Chưa ký]
```
