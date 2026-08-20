# M10 Completion Record (Sprint F1 Closure)

**Dự án**: AstroViet
**Sprint**: F1 — Frontend Foundation
**Milestone**: M10 (Sprint Wrap-up & Documentation Audit)
**Ngày hoàn thành**: 20/08/2026

## 1. Tóm tắt Milestone M10

Milestone M10 đóng vai trò là "chốt chặn" cuối cùng của Sprint F1, đảm bảo toàn bộ codebase, kiến trúc, và tài liệu nền tảng được đồng bộ, đạt chất lượng và sẵn sàng chuyển giao cho Sprint F2 (Authentication). 

Các công việc chính đã thực hiện:
- **T-CORRECTIVE**: Scaffold các thư mục `features/`, `entities/` và cấu hình lại API Client (`client.ts`) với interceptors, MSW. Sửa cấu trúc `ApiError` chuẩn hóa theo RFC7807 (`fieldErrors` dạng mảng).
- **Documentation Audit (T1 & T3)**: Thực hiện đối chiếu 4-way toàn diện giữa Code thật, Sprint Plan, Architecture Spec, và Coding Standards. Ghi nhận và sửa lỗi sai lệch tài liệu.
- **README Update (T2)**: Viết lại `frontend/README.md` theo chuẩn 17 mục, phản ánh chính xác cấu hình môi trường thật (`VITE_API_BASE_URL=http://localhost:3000`).
- **Known Gaps Registry (T4)**: Đánh dấu `TODO(Core)` trên toàn bộ codebase và lưu 12 mục khiếm khuyết vào README để xử lý trong tương lai.
- **Clean Environment Verification (T5)**: Chạy thử nghiệm thành công chuỗi 11 lệnh kiểm tra môi trường sạch (install, dev, test:coverage, lint, build, test:e2e).
- **Exit Criteria Final Verification (T7)**: Ghi nhận bằng chứng thực tế cho 8/8 Acceptance Criteria (bao gồm đo lường pre-commit hook).

## 2. Các Quyết định Kiến trúc & Sự đánh đổi (Trade-offs)

- Khôi phục scaffold `_retry` (Architecture §12.2) trong cấu hình Axios interceptor để chuẩn bị cho Refresh Token logic ở F2, dù hiện tại chức năng Auth chưa được tích hợp hoàn chỉnh.
- Định dạng lại `fieldErrors` thành `{ field: string; message: string }[]` nhằm tương thích 100% với đặc tả và để dễ dàng map lỗi sang React Hook Form (`setError()`) ở Sprint tới.
- Để lại `eslint-plugin-boundaries` ở trạng thái "Chờ kích hoạt" (TODO) do codebase hiện tại chưa đủ lớn để tạo gánh nặng ranh giới layer FSD, ưu tiên tốc độ phát triển nhưng vẫn giữ ý thức thiết kế.

## 3. Chuyển giao (Handover) cho Sprint F2

Với việc đóng M10, Sprint F1 đã hoàn thành toàn bộ trách nhiệm. Hệ thống đã đủ vững chắc để Sprint F2 tiếp nhận:
- Có sẵn `client.ts` để gọi API.
- Cấu trúc `features/auth` và `entities/user` đã được tạo chỗ trống (scaffolded).
- Routing cơ bản và UI Components (Input, Button, Modal) đã vượt qua kiểm thử chặt chẽ (Đạt mức Coverage tổng thể ~88.76%, đúng định hướng không ép ngưỡng cứng từ M9).
- Ghi chú: F2 cần dựa vào `Known Gaps Registry` (Mục 17 README) để tích hợp `QueryClientProvider`, `I18nextProvider` và thay thế Mobile Drawer menu.

---
**Trạng thái**: ✅ APPROVED & CLOSED
