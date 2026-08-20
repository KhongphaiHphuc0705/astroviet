# Sprint F1 - Exit Criteria Verification

Bảng dưới đây ghi nhận kết quả xác minh (verification) cho 8 Acceptance Criteria cấp Sprint (Exit Criteria) của Sprint F1.

| ID | Tiêu chí (Acceptance Criteria) | Tình trạng | Bằng chứng (Evidence) |
|---|---|---|---|
| AC1 | Zero regression: Toàn bộ code test cũ/mới (unit, component, e2e) phải pass 100%. | ✅ Đạt | Chạy `npm run test:coverage` (200/200 tests pass, 100% độ bao phủ) và `npm run test:e2e` (6/6 tests pass). |
| AC2 | Documentation cập nhật và phản ánh đúng thực tế codebase, không viết spec giả tưởng. | ✅ Đạt | Thực hiện đối chiếu 4-way (Documentation Audit). Các spec được cập nhật, `README.md` mới được xây dựng từ thực tế codebase (đã xử lý lỗi biến môi trường và ghi nhận 12 Known Gaps). |
| AC3 | Code quality: Zero lint/type errors. | ✅ Đạt | Chạy `npm run lint` (0 lỗi), `npm run format:check` (pass) và `npm run typecheck` (0 lỗi TypeScript). |
| AC4 | API Client (Axios) được tích hợp MSW để giả lập các request mà không cần server thực. | ✅ Đạt | `client.ts` được bọc bằng interceptor và MSW xử lý trong các bài test nội bộ (e.g. `client.test.ts`), bao gồm logic trả về `ApiError` chuẩn hóa khi có lỗi (như 401 Unauthorized). |
| AC5 | UI rendering: Giao diện cơ bản (Marketing, App Layout) hiển thị chính xác trên desktop & mobile. | ✅ Đạt | Playwright E2E test `layout.spec.ts` xác thực UI layout collapse (Sidebar -> Drawer) trên kích thước mobile/desktop. |
| AC6 | Pre-commit hook chạy tự động kiểm tra code < 10s. | ✅ Đạt | Đã đo đạc thực tế: `npx lint-staged` chạy trong khoảng **~1.5 giây** (ghi nhận trong `README.md`). |
| AC7 | M10 Completion Record được ghi nhận chính thức trước khi đóng Sprint. | ✅ Đạt | Đã lập tài liệu `m10_completion_record.md`. |
| AC8 | Toàn bộ Known Gaps được lưu trữ trong Registry hoặc TODO comments. | ✅ Đạt | Rải `TODO(Core)` trên 7 file code tương ứng và lưu 12 mục Known Gaps tại Mục 17 của `README.md`. |

> [!NOTE]
> Việc xác thực tuân thủ nguyên tắc "evidence-based" (Clean Environment Verification - T5) đã được thực hiện bằng cách khởi chạy lại toàn bộ môi trường từ đầu (install, dev, build, test, e2e) và ghi log xác minh thành công.
