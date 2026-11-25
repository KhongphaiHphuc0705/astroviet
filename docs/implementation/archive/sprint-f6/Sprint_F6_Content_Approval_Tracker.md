# Sprint F6 — Content Approval Tracker & Supplementary Glossary (Milestone F6.6)

> **Sprint:** F6 — Knowledge Base (MVP, Frontend-only)  
> **Milestone:** F6.6 — 15 Bài viết Chính thức & Full QA  
> **Baseline Commit:** `3989a11` (`dev`)  
> **Created:** 2026-11-25 (Task `F6.6.1 / T1.4`)  
> **Overall Content Approval Status:** **15 / 15 Approved** (Owner xác nhận ngày 2026-11-25; 0 `Draft`, 0 `Ready for Review`)  
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
> **Liên kết nội bộ toàn bộ 15 bài (L5 — `F6.6.5`):** Đã hoàn thiện liên kết chéo liên danh mục cho cả 15 bài (gồm bổ sung liên kết từ Batch 1–2 sang Cung `#7`, Nhà `#10`, Góc chiếu `#13`); mọi bài đều có ≥ 2 link ra và ≥ 1 link vào (**0 bài mồ côi**, `KB-U29 L5` 0 lỗi).

| #   | Batch            | Category (`order`) | Slug                              | Tiêu đề chuẩn hoá (`D-F6.6-01` — Đã chốt)                          | Commit SHA file `.md` | Content Status |                Đánh giá GFM (`D-F6-G`)                |       Owner Review        | Approval Evidence (Ngày + Commit SHA)    |
| --- | ---------------- | ------------------ | --------------------------------- | ------------------------------------------------------------------ | :-------------------: | :------------: | :---------------------------------------------------: | :-----------------------: | ---------------------------------------- |
| 1   | Batch 1 (F6.6.2) | `fundamentals` (1) | `what-is-astrology`               | Chiêm tinh học là gì?                                              |       `db0e836`       |  **Approved**  |                     Không cần GFM                     | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `db0e836` |
| 2   | Batch 1 (F6.6.2) | `fundamentals` (2) | `how-to-read-a-natal-chart`       | Cách đọc một bản đồ sao cá nhân                                    |       `db0e836`       |  **Approved**  |                     Không cần GFM                     | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `db0e836` |
| 3   | Batch 1 (F6.6.2) | `fundamentals` (3) | `planets-signs-houses`            | Hành tinh, cung hoàng đạo và nhà: Ba thành phần của lá số          |       `776fe0b`       |  **Approved**  |                     Không cần GFM                     | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `776fe0b` |
| 4   | Batch 2 (F6.6.2) | `planets` (1)      | `sun-moon-rising`                 | Mặt Trời, Mặt Trăng và Cung Mọc (Ascendant): Bộ ba nền tảng        |       `776fe0b`       |  **Approved**  |                     Không cần GFM                     | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `776fe0b` |
| 5   | Batch 2 (F6.6.2) | `planets` (2)      | `personal-planets`                | Sao Thủy, Sao Kim và Sao Hỏa: Các hành tinh cá nhân                |       `776fe0b`       |  **Approved**  |                     Không cần GFM                     | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `776fe0b` |
| 6   | Batch 2 (F6.6.2) | `planets` (3)      | `social-and-outer-planets`        | Sao Mộc, Sao Thổ và các hành tinh thế hệ                           |       `776fe0b`       |  **Approved**  |                     Không cần GFM                     | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `776fe0b` |
| 7   | Batch 3 (F6.6.3) | `signs` (1)        | `zodiac-signs-overview`           | Tổng quan 12 cung hoàng đạo                                        |       `c48bcd3`       |  **Approved**  |                     Không cần GFM                     | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `c48bcd3` |
| 8   | Batch 3 (F6.6.3) | `signs` (2)        | `elements-and-modalities`         | Bốn nguyên tố và ba tính chất trong chiêm tinh                     |       `c48bcd3`       |  **Approved**  |     Đánh giá sớm: danh sách 4 dòng rõ _(xem §6)_      | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `c48bcd3` |
| 9   | Batch 3 (F6.6.3) | `signs` (3)        | `sign-rulerships`                 | Chủ tinh của 12 cung hoàng đạo                                     |       `c48bcd3`       |  **Approved**  |     Đánh giá sớm: danh sách 12 cung rõ _(xem §6)_     | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `c48bcd3` |
| 10  | Batch 4 (F6.6.3) | `houses` (1)       | `astrological-houses-overview`    | Tổng quan 12 nhà trong bản đồ sao                                  |       `c3b38f2`       |  **Approved**  |                     Không cần GFM                     | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `c3b38f2` |
| 11  | Batch 4 (F6.6.3) | `houses` (2)       | `angular-succedent-cadent-houses` | Nhà Angular, Succedent và Cadent                                   |       `c3b38f2`       |  **Approved**  |      Đánh giá sớm: phân nhóm 3 mục rõ _(xem §6)_      | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `c3b38f2` |
| 12  | Batch 4 (F6.6.3) | `houses` (3)       | `house-rulers`                    | Chủ tinh của nhà (House Ruler)                                     |       `c3b38f2`       |  **Approved**  |                     Không cần GFM                     | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `c3b38f2` |
| 13  | Batch 5 (F6.6.4) | `aspects` (1)      | `what-are-astrological-aspects`   | Góc chiếu trong chiêm tinh là gì?                                  |       `734d0e4`       |  **Approved**  |                     Không cần GFM                     | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `734d0e4` |
| 14  | Batch 5 (F6.6.4) | `aspects` (2)      | `major-aspects`                   | Góc chiếu chính: Trùng tụ, Lục hợp, Vuông góc, Tam hợp và Đối đỉnh |       `734d0e4`       |  **Approved**  | Đánh giá cuối: danh sách 5 dòng + 5 mục rõ _(xem §6)_ | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `734d0e4` |
| 15  | Batch 5 (F6.6.4) | `aspects` (3)      | `orbs-and-applying-separating`    | Orb, Applying và Separating Aspects                                |       `734d0e4`       |  **Approved**  |                     Không cần GFM                     | **Đã duyệt (2026-11-25)** | Owner phê duyệt `2026-11-25` @ `734d0e4` |

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

| Bài | Slug                        | Số từ (`wc -w`) | Summary (≤ 160) | Nhãn cũ / Placeholder | Rà từ `"Hợp"` theo ngữ cảnh                                  | Lint L1–L6 (`KB-U29`) |        Kết luận tự kiểm        |
| --- | --------------------------- | :-------------: | :-------------: | :-------------------: | ------------------------------------------------------------ | :-------------------: | :----------------------------: |
| #1  | `what-is-astrology`         |       797       |      139 ✔      |         0 / 0         | `Lục hợp (60°)`, `Tam hợp (120°)` — đúng ngữ cảnh            |        0 lỗi ✔        | Đạt — Owner duyệt (2026-11-25) |
| #2  | `how-to-read-a-natal-chart` |       829       |      140 ✔      |         0 / 0         | `Phối hợp Quốc`, `phối hợp tạo`, `Lục hợp`, `Tam hợp` — đúng |        0 lỗi ✔        | Đạt — Owner duyệt (2026-11-25) |
| #3  | `planets-signs-houses`      |       861       |      127 ✔      |         0 / 0         | `kết hợp ba`, `trường hợp so` — đúng ngữ cảnh                |        0 lỗi ✔        | Đạt — Owner duyệt (2026-11-25) |
| #4  | `sun-moon-rising`           |       868       |      135 ✔      |         0 / 0         | Không xuất hiện                                              |        0 lỗi ✔        | Đạt — Owner duyệt (2026-11-25) |
| #5  | `personal-planets`          |       821       |      135 ✔      |         0 / 0         | `phối hợp liên` — đúng ngữ cảnh                              |        0 lỗi ✔        | Đạt — Owner duyệt (2026-11-25) |
| #6  | `social-and-outer-planets`  |       850       |      133 ✔      |         0 / 0         | `Lục hợp`, `Tam hợp` — đúng ngữ cảnh                         |        0 lỗi ✔        | Đạt — Owner duyệt (2026-11-25) |

### 5.2 Nhật ký Kiểm thử Thủ công §7.5 — Batch 3 & Batch 4 (`F6.6.3`, 2026-11-25)

| Bài | Slug                              | Số từ (`wc -w`) | Summary (≤ 160) | Nhãn cũ / Placeholder | Rà từ `"Hợp"` theo ngữ cảnh                           | Lint L1–L6 (`KB-U29`) |        Kết luận tự kiểm        |
| --- | --------------------------------- | :-------------: | :-------------: | :-------------------: | ----------------------------------------------------- | :-------------------: | :----------------------------: |
| #7  | `zodiac-signs-overview`           |       856       |      139 ✔      |         0 / 0         | Không xuất hiện                                       |        0 lỗi ✔        | Đạt — Owner duyệt (2026-11-25) |
| #8  | `elements-and-modalities`         |       807       |      137 ✔      |         0 / 0         | `Tam hợp`, `tổng hợp đa`, `tổ hợp:` — đúng ngữ cảnh   |        0 lỗi ✔        | Đạt — Owner duyệt (2026-11-25) |
| #9  | `sign-rulerships`                 |       782       |      140 ✔      |         0 / 0         | Không xuất hiện                                       |        0 lỗi ✔        | Đạt — Owner duyệt (2026-11-25) |
| #10 | `astrological-houses-overview`    |       859       |      136 ✔      |         0 / 0         | `hợp tác` — đúng ngữ cảnh                             |        0 lỗi ✔        | Đạt — Owner duyệt (2026-11-25) |
| #11 | `angular-succedent-cadent-houses` |       898       |      133 ✔      |         0 / 0         | Không xuất hiện; quy tắc tên gốc sau lần đầu đạt 100% |        0 lỗi ✔        | Đạt — Owner duyệt (2026-11-25) |
| #12 | `house-rulers`                    |       856       |      134 ✔      |         0 / 0         | Không xuất hiện                                       |        0 lỗi ✔        | Đạt — Owner duyệt (2026-11-25) |

### 5.3 Nhật ký Kiểm thử Thủ công §7.5 — Batch 5 (`F6.6.4`, 2026-11-25)

| Bài | Slug                            | Số từ (`wc -w`) | Summary (≤ 160) | Nhãn cũ / Placeholder | Rà từ `"Hợp"` & alias theo ngữ cảnh                                                                                                                                                                                                       | Lint L1–L6 & `KB-U22/U23` |        Kết luận tự kiểm        |
| --- | ------------------------------- | :-------------: | :-------------: | :-------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----------------------: | :----------------------------: |
| #13 | `what-are-astrological-aspects` |       857       |      148 ✔      |         0 / 0         | `Lục hợp`, `Tam hợp`, `phối hợp`, `hợp nhất` — 100% đúng ngữ cảnh; đủ 5 nhãn chuẩn từ `ASPECT_TYPE_LABELS`                                                                                                                                |          0 lỗi ✔          | Đạt — Owner duyệt (2026-11-25) |
| #14 | `major-aspects`                 |       955       |      150 ✔      |  2 alias hợp lệ / 0   | 2 alias lần đầu đúng quy tắc: `Vuông góc (... còn gọi là Vuông chiếu)`, `Đối đỉnh (... còn gọi là Đối xung)`; nhắc chú thích `"Hợp"` 1 lần trong mục `Trùng tụ` để giải thích lý do chuẩn hóa; đủ 5 nhãn ghép cùng `0°/60°/90°/120°/180°` |          0 lỗi ✔          | Đạt — Owner duyệt (2026-11-25) |
| #15 | `orbs-and-applying-separating`  |       919       |      145 ✔      |         0 / 0         | `Tam hợp`, `Lục hợp`, `phù hợp`, `tích hợp`, `kết hợp`, `trường hợp` — đúng ngữ cảnh; khớp `Natal_Chart_Domain_Specification.md` §18.3 (`isApplying` wrap-aware, bằng tốc độ → `Separating`)                                              |          0 lỗi ✔          | Đạt — Owner duyệt (2026-11-25) |

### 5.4 Kiểm tra Toàn vẹn Manifest & Đồ thị Liên kết 15 Bài (`F6.6.5`, 2026-11-25)

- **Manifest (`manifest.ts`):** Đủ **15 entry** (5 danh mục × 3 bài, `order` = `{1, 2, 3}`, 15 tiêu đề & 15 summary duy nhất ≤ 160 ký tự, 0 placeholder) — kiểm chứng tự động qua `KB-U03b-1..6` (`validateManifest.test.ts`), parity 2 chiều `KB-U27` (`contentFiles.test.ts`), `KB-U29` L1–L6 (`contentLint.test.ts`), và `KB-U22/U23` (`contentTerminology.test.ts`).
- **Đồ thị liên kết nội bộ:** Toàn bộ 15/15 bài có ≥ 2 liên kết ra và ≥ 1 liên kết vào (**0 bài mồ côi**; 0 link gãy `L5`).
- **Prerender 15 bài (`npm run build`):** Sinh đủ **17 file HTML** (`knowledge.html`, `knowledge/index.html`, + 15 file bài phẳng) + `sitemap.xml` (**16 URL**, không có `/`) + `robots.txt` → `KB-P01..KB-P11` **11/11 PASS** (`PRERENDER OK`); Entry bundle giữ nguyên `462,09 kB` (+0 B), 0 SSR warning.

---

## 6. Theo dõi Cổng GFM (`D-F6-G`) & Mẫu Decision Request

- **Trạng thái hiện tại (`T4.5` — Đánh giá tổng thể trên đủ 15 bản nháp, 2026-11-25):** **ĐÃ ĐÁNH GIÁ — TRƯỜNG HỢP A (KHÔNG KÍCH HOẠT `remark-gfm`)**.
- **Kết quả đánh giá trên cả 4 bài ứng viên và toàn bộ 15 bài:**
  - `#8` (`elements-and-modalities`): Tổ hợp 4 nguyên tố × 3 tính chất trình bày bằng danh sách 4 dòng gom theo nguyên tố (`Bạch Dương (Tiên phong) · Sư Tử (Kiên định) · Nhân Mã (Linh hoạt)`), hiển thị gọn cả mobile 320px lẫn desktop 1280px mà vẫn đối chiếu 2 chiều rõ ràng.
  - `#9` (`sign-rulerships`): Danh sách 12 cung kèm nhãn `_(Chủ tinh cổ điển)_` / `_(Chủ tinh hiện đại)_` rõ ràng, không cần bảng.
  - `#11` (`angular-succedent-cadent-houses`): Phân 3 mục rõ ràng (`Nhà Angular`, `Nhà Succedent`, `Nhà Cadent`) kèm ví dụ so sánh Nhà 10/11/12, không cần bảng.
  - `#14` (`major-aspects`): Tóm tắt nhanh 5 dòng có cấu trúc đồng nhất (`Tên chuẩn (Tên Anh, glyph, độ) — Tính chất: tóm lược`) kết hợp 5 mục `###` phân tích chi tiết và so sánh cặp `Mặt Trời – Sao Thổ`, bảo toàn khả năng đối chiếu 5×4 mà không bị tràn ngang trên mobile và không cần thêm `remark-gfm`.
  - **11 bài còn lại:** Trình bày hoàn chỉnh bằng heading, đoạn văn, danh sách có/không thứ tự, blockquote và liên kết nội bộ thuần CommonMark.
- **Kết luận cổng `D-F6-G`:** Giữ nguyên `react-markdown` không cài `remark-gfm` (+0 dependency, +0 kB bundle, giữ nguyên lint L4 `KB-U29` và `KB-U12b`). Nếu trong quá trình duyệt nội dung Owner vẫn muốn chuyển `#8` hoặc `#14` sang bảng GFM thật, sẽ dừng phần đó và lập **GFM Decision Request** theo mẫu dưới đây để Owner duyệt bằng văn bản.

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
