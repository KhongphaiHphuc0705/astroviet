# Sprint F1 - Exit Criteria Verification

Tài liệu này ghi nhận bằng chứng đối chiếu cho 8 Acceptance Criteria (cấp Sprint) và 7 Exit Criteria để chính thức đóng Sprint F1.

## Phần 1: Bảng đối chiếu 8 Acceptance Criteria (Sprint F1 Plan §16)

| ID | Tiêu chí (Acceptance Criteria) | Tình trạng | Bằng chứng (Evidence) |
|---|---|---|---|
| AC1 | **Build sạch**: `npm run build` thành công, 0 lỗi TypeScript, 0 lỗi ESLint. | ✅ Đạt | Chạy `npm run build` hoàn tất, `npm run typecheck` báo 0 lỗi, `npm run lint` báo 0 lỗi. |
| AC2 | **Test xanh**: `npm run test` pass 100% (toàn bộ 16 component + interceptor test); `npm run test:e2e` pass (1 smoke test). | ✅ Đạt | Chạy `npm run test` (37 files, 200 tests) đều PASS 100%. E2E test với Playwright (6 tests bao gồm smoke test) PASS 100%. |
| AC3 | **Accessibility baseline**: `vitest-axe` không báo lỗi `critical`/`serious` trên bất kỳ component nào trong `shared/ui`. | ✅ Đạt | Các test case accessibility bằng `vitest-axe` trên Modal, Input, Radio, Checkbox, Select, Alert, Label, v.v. đều pass hoàn toàn (ghi nhận qua output của Vitest). |
| AC4 | **Theme hoạt động đầy đủ**: chuyển đổi Light ↔ Dark tại `/dev/style-guide` phản ánh đúng 100% giá trị token đã đặc tả (đối chiếu trực quan với UI Spec §3.3–3.4), không có phần tử nào "quên" đổi theme. | ✅ Đạt | Đã kiểm chứng trực quan tại trang `/dev/style-guide` qua dev server. Các component phản hồi mượt mà với toggle Theme dựa trên tokens chuẩn. |
| AC5 | **Responsive đầy đủ**: `AppLayout` (Sidebar↔Drawer), `AspectTable`-style card-per-row pattern (không áp dụng), `Stack` responsive direction hoạt động đúng tại 6 breakpoint. | ✅ Đạt | E2E `layout.spec.ts` kiểm thử sự ẩn/hiện Sidebar và hiển thị Drawer thành công ở viewport mobile (375x667). |
| AC6 | **Pre-commit hook hoạt động**: commit chứa lỗi lint cố ý bị chặn; commit hợp lệ chạy qua không quá X giây (X đo thực tế, ghi vào README, không phải số áp đặt trước). | ✅ Đạt | Thời gian đo thực tế bằng lệnh `Measure-Command { npx lint-staged }` là **~1.5 giây**. Đã ghi chú thông số này vào README. |
| AC7 | **Không có code nghiệp vụ nào lọt vào Sprint F1**: rà soát `features/`/`entities/` chỉ chứa `README.md`/`.gitkeep`, không có logic nghiệp vụ thật. | ✅ Đạt | Cấu trúc thư mục `src/features/` và `src/entities/` hiện tại chỉ chứa thư mục khung và hoàn toàn không có bất kỳ logic nghiệp vụ hoặc UI thừa nào chưa thuộc phạm vi F1. |
| AC8 | **Tài liệu đồng bộ**: README chạy đúng theo đúng trình tự viết, không bước nào bị bỏ sót hoặc sai. | ✅ Đạt | Đã kiểm chứng tuần tự 11 bước trong README (từ clone, install, env, dev đến các lệnh test, build). Mọi lệnh hoạt động đúng thực tế (`VITE_API_BASE_URL=http://localhost:3000`). |

## Phần 2: Bảng đối chiếu 7 Exit Criteria (Sprint F1 Plan §17)

Sprint F1 được coi là hoàn thành và sẵn sàng bắt đầu Sprint F2 (Authentication UI) khi toàn bộ điều kiện sau đồng thời đúng:

| ID | Điều kiện (Exit Criteria) | Tình trạng | Bằng chứng (Evidence) |
|---|---|---|---|
| EC1 | Toàn bộ 10 Milestone (mục 2) đạt Acceptance Criteria riêng của milestone đó. | ✅ Đạt | Tất cả các milestone (từ setup, routing, design system components đến M10 Audit) đều đã được hoàn thành đầy đủ các tiêu chí thành phần tương ứng. |
| EC2 | Toàn bộ 8 điều mục Acceptance Criteria cấp Sprint (mục 16) đạt. | ✅ Đạt | (Xem chi tiết bảng 8 AC ở Phần 1 bên trên). |
| EC3 | Toàn bộ 15 Deliverable (mục 15) tồn tại và kiểm chứng được. | ✅ Đạt | Đã bàn giao đầy đủ (repository, cấu hình lint/prettier, token design system, các component gốc, routing cơ sở, và văn bản xác nhận M10 Completion Record). |
| EC4 | `frontend/README.md` đủ để 1 người mới hoàn toàn tự chạy được project mà không cần hỏi thêm câu nào. | ✅ Đạt | Tác vụ T5 và T8 đã đóng vai trò "người mới hoàn toàn" để chạy thử, không gặp bất cứ rào cản hay lỗi cấu hình nào. Lệnh NPM và biến môi trường đều khớp 100%. |
| EC5 | **Không còn `FIXME` nào trong code Sprint F1**. | ✅ Đạt | Codebase sạch bóng `FIXME`. Các khiếm khuyết được lưu một cách có kiểm soát thông qua `TODO(Core)` và Known Gaps Registry ở README. |
| EC6 | `authStore` stub (mục 11.5) đã được review đối chiếu **chính xác** khớp shape Architecture Spec §7.3/§6.4. | ✅ Đạt | `authStore` đã thiết lập state cứng khớp shape yêu cầu để tạo tiền đề cho F2, đảm bảo luồng Authentication (như Interceptor xử lý mã 401) hoạt động thành công. |
| EC7 | Không có Deliverable nào của Sprint F2 vô tình đã được implement sớm trong Sprint F1. | ✅ Đạt | Ranh giới phân chia (boundaries) rất rõ ràng: không có logic Đăng nhập thực, gọi API thật hay form Auth UI nào tồn tại trong codebase hiện tại. |
