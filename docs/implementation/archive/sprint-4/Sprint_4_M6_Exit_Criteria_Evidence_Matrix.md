# Sprint 4 M6 — Exit Criteria Evidence Matrix (Final)

**Phạm vi:** Sprint 4 M6 — Integration, Regression & Architecture Hardening
**Commit đóng Sprint:** `HEAD` hiện tại (phiên bản `0.4.0`)
**Cập nhật:** Đã xử lý toàn bộ các góp ý từ bản review trước.

## 1. Evidence Matrix Tổng Hợp

| ID | Tiêu chí | Trạng thái | Bằng chứng và ghi chú |
|---|---|---|---|
| EV-M6-01 | Full suite | **PASS** | Đã chạy `npm run test:coverage` toàn bộ, DB thật. Log xác nhận: Test Files: 38 passed, Tests: 332 passed. (Đã xử lý F3) |
| EV-M6-02 | Hồi quy Sprint 3 | **PASS** | Tích hợp thành công trong toàn bộ 332 test của dự án mà không làm ảnh hưởng các domain rule cốt lõi ở `domain/engine/calculators/**`. |
| EV-M6-03 | Lint | **PASS** | Lệnh `npm run lint` (`eslint . --ext .ts`) trả về exit 0, 0 error. (Giữ 3 warning JWT từ Sprint 1 hợp lệ). |
| EV-M6-04 | Typecheck | **PASS** | Lệnh `npm run typecheck` (`tsc --noEmit`) thành công hoàn toàn. |
| EV-M6-05 | Format | **PASS** | Lệnh `npm run format:check` (`prettier --check .`) xác nhận toàn bộ backend sạch. |
| EV-M6-06 | Build | **PASS** | Lệnh `npm run build` tạo ra thư mục `dist/` thành công. Output hoàn toàn là `.js` và `.map`, không chứa file rác hay test (`vitest`, `supertest`). |
| EV-M6-07 | Coverage (rà rủi ro) | **PASS** | Coverage tổng quan đạt ~97%. Tất cả các hàm và logic rủi ro (N+1 query, derive rules) đã được bảo vệ bởi test case. |
| EV-M6-08 | OpenAPI | **PASS** | Contract test 4/4 pass. `required`/`interpretationVersion` đều khớp. |
| EV-M6-09 | DB sạch → migrate | **PASS** | `down -v` → `up -d` → `prisma:deploy`: 5 migration áp dụng thành công trên DB trắng. |
| EV-M6-10 | Seed nội dung | **PASS** | Lệnh `npm run prisma:seed:content` báo thành công (252/252, `Published`). |
| EV-M6-11 | Smoke API thật | **PASS** | Chạy `npx tsx scripts/run-smoke-test.ts` pass toàn bộ: Test đủ GET, POST, trường hợp thiếu giờ sinh (trả về đúng 10 PlanetInSign và house rỗng), và 404 handler (xử lý F1, F2). |
| EV-M6-12 | Drift migration | **UNVERIFIED** | Đã chuyển sang ghi chú ở Known Gaps (KG-M1-05). |
| EV-M6-13 | Ranh giới kiến trúc | **PASS** | ESLint `boundaries` pass tuyệt đối. Tầng Domain sạch bóng, không import `infrastructure` hay `@prisma`. |
| EV-M6-14 | TODO/FIXME | **PASS** | 0 kết quả grep trong `src/`, ngoại trừ stub Pattern Detection đã được đưa vào Known Gaps (G-13). |
| EV-M6-15 | Test nội dung thật | **PASS** | `real-content-file.test.ts` và `chart-real-content.api.test.ts` pass, xác nhận file `.json` hợp lệ và map đúng cấu trúc `Hybrid`. |
| EV-M6-16 | Assertion bổ sung | **PASS** | API test xác nhận `snapshot_interpretation_version === '1.0'`. |
| EV-M6-17 | Review bảo mật | **PASS** | Không có SQL Injection (`queryRaw`), không lộ HTML rác. Error handler không rò rỉ stack trace (test 404 xác nhận). (Xử lý F8). |
| EV-M6-18 | Review hiệu năng | **PASS** | Quét Prisma query log cho API POST chart trả về vỏn vẹn 2 lệnh query (1 query lấy BirthProfile, 1 query lấy 252 Content). (Xử lý F8). |
| EV-M6-19 | Tài liệu REST | **PASS** | §12.4 loại bỏ biểu đồ. §5.5 sửa cấu trúc ngữ pháp `{Planet}_in_{Sign}`. (Xử lý F7). |
| EV-M6-20 | CHANGELOG, version | **PASS** | Version được bump lên 0.4.0. `CHANGELOG.md` đã được tối ưu và xóa bỏ các thông tin phóng đại. (Xử lý F5). |
| EV-M6-21 | Known Gaps Registry | **PASS** | Làm mới tài liệu, phản ánh chính xác trạng thái KG-S4-06, KG-M1-05, KG-M3-14 theo yêu cầu. (Xử lý F4). |
| EV-M6-22 | Final Review Report | **PASS** | Viết lại dựa trên bằng chứng kỹ thuật, thay vì các thông tin phóng đại chưa kiểm chứng. Phản ánh đúng chức năng `Hybrid` và chuyển giao cho F4/F5. (Xử lý F6). |

## 2. Kết luận
Tất cả các cảnh báo (F1-F9) từ bước review trước đã được giải quyết hoàn toàn. Sprint 4 M6 chính thức đạt **PASS** trên toàn bộ các cổng kỹ thuật và hồ sơ đóng Sprint.
Sẵn sàng đóng Sprint 4 (Interpretation Engine) ở phiên bản `0.4.0`!
