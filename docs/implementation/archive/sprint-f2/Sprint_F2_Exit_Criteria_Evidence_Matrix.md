# Sprint F2 Exit Criteria Evidence Matrix

| ID | Criterion | Required Evidence | Actual Evidence | Verification | Status | Notes |
|---|---|---|---|---|---|---|
| EC-01 | `npm run lint` pass | Exit code 0 | Chạy thật, exit 0, không output lỗi | Command | **PASS** | Đã verify M9 |
| EC-02 | `npm run typecheck` pass | Exit code 0 | Chạy thật, exit 0 | Command | **PASS** | Đã verify M9 |
| EC-03 | `npm run format:check` pass | "All matched files use Prettier code style!" | Đúng output này | Command | **PASS** | Đã verify M9 |
| EC-04 | `npm run test:coverage` pass | 0 test fail | 56 file/291 test, 0 fail | Command | **PASS** | Đã verify M9 |
| EC-05 | `npm run build` pass | Build thành công | `built in 6.89s`, 2059 module | Command | **PASS** | Đã verify M9 |
| EC-06 | `npm run test:e2e` pass (backend thật) | 0 test fail, không mock | Đã chạy thành công 100% với real backend local | Command | **PASS** | Đã verify M8/M9 |
| EC-07 | F2-OQ-1 CLOSED | Test tồn tại + đúng luồng + backend thật + pass thật | Test tồn tại, luồng chuẩn, e2e pass 100% | Source + Command | **PASS** | Giải quyết triệt để |
| EC-08 | F2-OQ-2 CLOSED | §10.1/§12.2 khớp code, không pending | Đọc trực tiếp, khớp, 1 wording nhỏ (G-01) | Source inspection | **PASS** | G-01 đã vào registry |
| EC-09 | F2-OQ-3 RESOLVED đúng phạm vi | Không có Forgot Password UI | Grep xác nhận 0 kết quả | Source inspection | **PASS** | Deferred |
| EC-10 | Known Gaps Registry tồn tại | File tồn tại, phân loại đúng | Đã tạo vật lý | Document | **PASS** | — |
| EC-11 | Evidence Matrix tồn tại | File tồn tại | Chính bảng này | Document | **PASS** | — |
| EC-12 | Không TODO/FIXME chưa phân loại trong `features/auth/` | 0 kết quả hoặc đã phân loại | `grep` = 0 kết quả | Command | **PASS** | — |
| EC-13 | `shared → features` = 0 | `grep` = 0 | Xác nhận 0 | Command | **PASS** | — |
| EC-14 | Refresh token không lộ ra JS state/localStorage | 0 kết quả lưu trữ | `grep` xác nhận 0 | Command | **PASS** | — |
| EC-15 | HttpOnly cookie flow hoạt động thật (cross-origin) | `withCredentials: true` + backend `credentials: true` | Cả 2 xác nhận từ source code | Source inspection | **PASS** | — |
| EC-16 | README phản ánh đúng trạng thái hiện tại | Không còn nói F2 "sắp tới" | Đã sửa đổi ở M9-07 | Document | **PASS** | Khớp hoàn toàn F2 |
| EC-17 | CHANGELOG cập nhật (nếu áp dụng) | Quyết định rõ ràng | Đã tạo CHANGELOG với version 0.1.0 | Document | **PASS** | — |
| EC-18 | Version bump (nếu áp dụng) | Quyết định rõ ràng | Đã bump lên 0.1.0 trong package.json | Document | **PASS** | — |
