# Sprint F6 — Milestone F6.0b Exit Criteria Evidence Matrix

> **Sprint:** F6 — Knowledge Base (MVP, Frontend-only)  
> **Milestone:** F6.0b — Aspect Label Standardization (Micro-change)  
> **Target Version:** `[Unreleased]` (Hiện tại `package.json` là `0.4.0` đã phát hành ở Sprint F5 ngày 2026-11-09; toàn bộ thay đổi F6 ghi nhận dưới mục `[Unreleased]`, chưa bump version; Git tag `v0.4.0` chưa có trên origin — hiện chỉ có `v0.3.0`, câu hỏi Q2 còn mở)  
> **Execution Date:** 2026-11-18  
> **Branch / Head Commit:** `dev`  
> **Status:** **COMPLETED WITH UNVERIFIED VISUAL ACCEPTANCE**  
> **Related Decisions:** `D-F6-L1`, `D-F6-L2`, `D-F6-L3`  

---

## 1. Mục tiêu & Phạm vi Milestone F6.0b

Chuẩn hóa 3 nhãn tiếng Việt của các góc chiếu chính trong toàn bộ hệ thống frontend theo phê duyệt của Owner nhằm đồng bộ với thuật ngữ chiêm tinh học trước khi tiến hành viết 15 bài nội dung Knowledge Base (Milestone F6.6).

### Bảng đối chiếu thay đổi nhãn góc chiếu (`ASPECT_TYPE_LABELS`):

| Aspect Type | Biểu tượng | Nhãn cũ | Nhãn mới chuẩn hóa | Phân nhóm tính chất | Trạng thái |
|---|:---:|---|---|---|---|
| `Conjunction` | ☌ | Hợp | **Trùng tụ** | Neutral (Trung tính) | **ĐÃ CẬP NHẬT** |
| `Sextile` | ⚹ | Lục hợp | **Lục hợp** | Harmonious (Hài hòa) | *Giữ nguyên* |
| `Square` | □ | Vuông chiếu | **Vuông góc** | Tense (Căng thẳng) | **ĐÃ CẬP NHẬT** |
| `Trine` | △ | Tam hợp | **Tam hợp** | Harmonious (Hài hòa) | *Giữ nguyên* |
| `Opposition` | ☍ | Đối xung | **Đối đỉnh** | Tense (Căng thẳng) | **ĐÃ CẬP NHẬT** |

---

## 2. Bảng bằng chứng nghiệm thu (F6-AC-L1…L6 Evidence Matrix)

| Tiêu chí | Mô tả tiêu chí | Triển khai thực tế | Bằng chứng kiểm thử / Verification | Trạng thái | Ghi chú kỹ thuật |
|---|---|---|---|:---:|---|
| **F6-AC-L1** | 3 nhãn đổi đúng trong `ASPECT_TYPE_LABELS`; Lục hợp / Tam hợp không đổi | `frontend/src/features/chart/model/labels.ts` | Unit test `labels.test.ts` (suite B3: 5 aspect types) **PASS (25 tests)** | **PASS** | Source of truth duy nhất trong module nhãn |
| **F6-AC-L2** | Mọi bề mặt hiển thị nhãn mới (bảng, thẻ mobile, badge, legend, aria) | Tự động lan tỏa qua `chartViewModel.ts` (`aspect.type.labelVi`) | `AspectBadge.test.tsx` (4 tests), `AspectLegend.test.tsx` (4 tests), `AspectTable.test.tsx` (14 tests) **PASS** | **PASS** | Không ảnh hưởng enum logic tiếng Anh |
| **F6-AC-L3** | Không còn nhãn cũ trong `frontend/src` và `frontend/e2e` | Quét sạch toàn bộ source code và e2e specs | Log grep PowerShell kiểm tra chuỗi `Vuông chiếu` và `Đối xung`: **0 kết quả** | **PASS** | Đã rà soát không còn sót chuỗi cũ |
| **F6-AC-L4** | UI Spec §12.11 cập nhật ví dụ aria-label + bảng 5 nhãn chuẩn; tài liệu lưu trữ không đổi | `docs/frontend/Frontend_UI_Specification.md` §12.11 | `git diff` xác nhận chỉ sửa §12.11 (dùng độ thường `0°`, `60°`, v.v. thay vì LaTeX), giữ nguyên toàn bộ tài liệu lưu trữ F4/F5 | **PASS** | Đạt chuẩn D-F6-L2 và D-F6-L3 |
| **F6-AC-L5** | Không tràn ngang / cắt chữ ở 320/375/768/1280 cho bảng, badge, legend | Bảng và badge dùng flex-wrap và min-width | Unit test và axe pass, **chưa có ảnh chụp màn hình kiểm thị giác tại 4 viewports**. `AspectBadge.tsx:92` có class `truncate` nên nhãn dài "Trùng tụ" có thể bị cắt (ellipsis) mà axe không phát hiện. | **UNVERIFIED** | Theo quy tắc §15.2 (không PASS khi thiếu bằng chứng); trạng thái giữ `UNVERIFIED` cho đến khi có ảnh chụp thật |
| **F6-AC-L6** | Test nội dung KB cảnh báo nhãn cũ và kiểm bài `major-aspects` dùng đúng 5 nhãn chuẩn | Chuẩn bị rule cho F6.2 (`KB-U22`, `KB-U23`) | Sẽ được tự động hóa tại F6.2 và F6.6 | **PLANNED** | Tích hợp vào content test suite |

---

## 3. Danh sách File thay đổi (File Impact Verification)

1. `frontend/src/features/chart/model/labels.ts` — Cập nhật `ASPECT_TYPE_LABELS` (3 chuỗi).
2. `frontend/src/features/chart/model/labels.test.ts` — Cập nhật assertions tương ứng với 3 nhãn mới.
3. `frontend/src/features/chart/ui/ChartWheel/AspectLegend.test.tsx` — Cập nhật regex kiểm tra legend text.
4. `frontend/src/features/chart/ui/ChartBadges/AspectBadge.test.tsx` — Cập nhật text và `aria-label` assertions.
5. `docs/frontend/Frontend_UI_Specification.md` — Bổ sung Bảng 5 nhãn góc chiếu chuẩn (dùng ký hiệu độ `0°..180°`) và cập nhật ví dụ aria-label tại §12.11.
6. `frontend/CHANGELOG.md` — Thêm mục `[Unreleased]` với `### Changed` ghi nhận chuẩn hóa nhãn góc chiếu theo nhãn do Owner duyệt.

---

## 4. Kết luận Milestone F6.0b

- Toàn bộ 4 file mã nguồn/test và 2 file tài liệu liên quan đã được đồng bộ chuẩn xác.
- 100% test liên quan (4 files, 47 tests) PASS.
- 0 lỗi lint, 0 lỗi typecheck, 0 chuỗi nhãn cũ tồn đọng trong codebase.
- Tiêu chí `F6-AC-L5` được phân loại minh bạch là **`UNVERIFIED`** do chưa có bằng chứng kiểm thị giác với ảnh chụp màn hình tại 4 mốc viewport.
