# Sprint 4 - Known Gaps Registry

## Overview
Tài liệu này ghi nhận lại các khoảng trống (gaps) được phát hiện trong suốt Sprint 4 (Interpretation Engine) nhưng đã được phân loại là ngoài phạm vi hoặc được hoãn lại có chủ đích để xử lý ở các Sprint tiếp theo.

## Danh sách Known Gaps

| Gap ID | Hạng mục | Mô tả & Rủi ro | Kế hoạch xử lý | Quyết định/Nguồn |
|---|---|---|---|---|
| KG-M1-05 | Database | Drift nhẹ (schema vs database state) đối với tên các index và Foreign Key (`fk_birth_profiles_users`, index `email`). | Bỏ qua trong Sprint 4 do không ảnh hưởng logic vận hành. | D-M6-12 / Audit M1 |
| KG-M3-14 | Content | Lời văn (tone) và nội dung của `interpretations.vi.json` không đồng nhất hoặc chưa chuẩn xác 100%. | Đội Content sẽ rà soát ngoài scope backend. M6 không sửa. | PRD / O-M6-2 |
| KG-M4-03 | Performance | Khởi tạo khi content bank rỗng sẽ phát sinh 2 truy vấn DB để fallback. | Chấp nhận ở quy mô MVP. | D-M6-11 / M4 |
| KG-S4-06 | Engine | Khi thiếu giờ sinh (`isBirthTimeKnown: false`), Chart Engine vẫn tính tại 12:00 trưa nhưng hệ thống không đưa ra cảnh báo Interpretation Warning cụ thể nào. | Ghi nhận tài liệu để bàn giao cho đội Frontend (F5) xử lý UI cảnh báo người dùng. M6 không sửa engine. | Mục 16 / D-M6-12 |
| KG-S4-08 | Identity | Cột `users.preferred_language` chưa được ánh xạ hoàn chỉnh trong Identity domain. | Giữ nguyên, không thuộc phạm vi Sprint 4. | D-M6-12 |
| G-13 | Engine | Pattern Detection (Grand Trine, T-Square) được stub `pattern.calculator.ts` trả về mảng rỗng. | Chấp nhận hoãn, API sẽ trả về `chart_patterns: []` cho đến khi tính năng này được code thật. | Kế thừa Sprint 3 |
