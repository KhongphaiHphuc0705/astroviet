# Sprint 4 - Known Gaps Registry

## Overview
Tài liệu này ghi nhận lại các khoảng trống (gaps) được phát hiện trong suốt Sprint 4 (Interpretation Engine) nhưng đã được phân loại là ngoài phạm vi hoặc được hoãn lại có chủ đích để xử lý ở các Sprint tiếp theo.

## Danh sách Known Gaps

| ID | Hạng mục | Mô tả | Xử lý |
|---|---|---|---|
| KG-S4-06 | Engine | Khi thiếu giờ sinh engine tính tại 12:00 địa phương và không phát warning; Moon (~13°/ngày) có thể sai cung gần ranh giới, nhưng `Moon_in_*` vẫn được trả | Giữ; F5 hiển thị lưu ý; không sửa engine |
| KG-S4-08 | Identity/DB | DB Spec nêu `users.preferred_language` nhưng schema/code không có | Hoãn; xét lại khi có đa ngôn ngữ |
| KG-M1-05 | Database | `prisma migrate diff` và `prisma:seed` chưa có log chạy thật; dự kiến chỉ drift đã tài liệu (partial index, UNIQUE expression, CHECK viết tay) | Mở; owner chạy khi tiện hoặc ghi nhận khi đóng sprint |
| KG-M3-01 | Tooling | `prisma/` và `scripts/` nằm ngoài `typecheck`/`build` (`tsconfig` chỉ gồm `src/`) | Chấp nhận; kiểm bằng ESLint và chạy CLI thật |
| KG-M3-14 | Content | Văn phong tài chính/sức khỏe còn trong `bodyText` (v1.0, `Hybrid`) | **Owner quyết định giữ nguyên như đã seed**; sửa = phát hành version mới; F5 cân nhắc lưu ý "chỉ mang tính tham khảo" |
| KG-M4-03 | Performance | Khi bank rỗng, Create gọi `findPublishedVersions` hai lần | Chấp nhận ở MVP |
| KG-M2-03 | Test | Mock `as any` cho `Planet`/`Angle` ở test M2/derive | Chấp nhận |
| G-02 | Sprint 3 | `ChartSummaryResponse.birthProfileLabel` luôn `null` | Kế thừa, hoãn |
| G-13 | Sprint 3 | Pattern detection là stub, `chart_patterns` luôn `[]` | Kế thừa, hoãn |
