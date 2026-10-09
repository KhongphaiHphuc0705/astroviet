# Sprint 4 M6 — Exit Criteria Evidence Matrix (Final)

**Phạm vi:** Sprint 4 M6 — Integration, Regression & Architecture Hardening
**Commit đóng Sprint:** `72de6d9`
**Cập nhật:** Đã xử lý toàn bộ các góp ý từ bản review trước.

## 1. Evidence Matrix Tổng Hợp

| ID | Tiêu chí | Trạng thái | Bằng chứng và ghi chú |
|---|---|---|---|
| EV-M6-01 | Full suite | **PASS** | CI #258 Success. (Ghi nhận riêng: test cho phần unit chart chạy nội bộ là 38 file / 332 test passed). |
| EV-M6-02 | Hồi quy Sprint 3 | **PASS** | Tích hợp thành công trong toàn bộ test của dự án mà không làm ảnh hưởng các domain rule cốt lõi ở `domain/engine/calculators/**` (CI #258 xanh). |
| EV-M6-03 | Lint | **PASS** | Lệnh `npm run lint` (`eslint . --ext .ts`) trả về exit 0, 0 error. (Giữ 3 warning JWT từ Sprint 1 hợp lệ). |
| EV-M6-04 | Typecheck | **PASS** | Lệnh `npm run typecheck` (`tsc --noEmit`) thành công hoàn toàn. |
| EV-M6-05 | Format | **PASS** | Lệnh `npm run format:check` (`prettier --check .`) xác nhận toàn bộ backend sạch. |
| EV-M6-06 | Build | **PASS** | Lệnh `npm run build` tạo ra thư mục `dist/` thành công. Đã chạy lệnh kiểm tra: `Get-ChildItem -Path dist -Recurse -Include *.test.js,*.spec.js` trả về rỗng (dist sạch sẽ). |
| EV-M6-07 | Coverage (rà rủi ro) | **UNVERIFIED** | Đã bỏ con số "97%" do chưa có báo cáo `test:coverage` cụ thể. Các rủi ro chính được coi là PASS qua CI #258 nhưng số liệu chính xác chưa được đính kèm. |
| EV-M6-08 | OpenAPI | **PASS** | Contract test 4/4 pass. `required`/`interpretationVersion` đều khớp. |
| EV-M6-09 | DB sạch → migrate | **PASS** | `down -v` → `up -d` → `prisma:deploy`: 5 migration áp dụng thành công trên DB trắng. |
| EV-M6-10 | Seed nội dung | **PASS** | Lệnh `npm run prisma:seed:content` báo thành công (252/252, `Published`). |
| EV-M6-11 | Smoke API thật | **PASS** | Chạy `npx tsx scripts/run-smoke-test.ts` pass toàn bộ: Test đủ GET, POST, trường hợp thiếu giờ sinh (trả về đúng 10 PlanetInSign và house rỗng), và 404 handler. Log truy cập đã được lưu đầy đủ vào Clean Environment Verification. |
| EV-M6-12 | Drift migration | **UNVERIFIED** | Đã chuyển sang ghi chú ở Known Gaps (KG-M1-05). |
| EV-M6-13 | Ranh giới kiến trúc | **PASS** | ESLint `boundaries` pass tuyệt đối. Tầng Domain sạch bóng, không import `infrastructure` hay `@prisma`. |
| EV-M6-14 | TODO/FIXME | **PASS** | 0 kết quả grep trong `src/`, ngoại trừ stub Pattern Detection đã được đưa vào Known Gaps (G-13). |
| EV-M6-15 | Test nội dung thật | **PASS** | `real-content-file.test.ts` và `chart-real-content.api.test.ts` pass, xác nhận file `.json` hợp lệ và map đúng cấu trúc `Hybrid`. |
| EV-M6-16 | Assertion bổ sung | **PASS** | API test xác nhận `snapshot_interpretation_version === '1.0'`. |
| EV-M6-17 | Review bảo mật | **PASS** | Không có SQL Injection (`queryRaw`), không lộ HTML rác. Error handler không rò rỉ stack trace (test 404 xác nhận). |
| EV-M6-18 | Review hiệu năng | **PASS** | Quét Prisma query log cho API POST chart trả về 5 truy vấn chính (User, BirthProfile, Chart, DISTINCT version, và nội dung OR). Log đã được chèn vào văn bản. |
| EV-M6-19 | Tài liệu REST | **PASS** | §12.4 loại bỏ biểu đồ. §5.5 sửa cấu trúc ngữ pháp `{Planet}_in_{Sign}`. |
| EV-M6-20 | CHANGELOG, version | **PASS** | Version được bump lên 0.4.0. `CHANGELOG.md` đã được tối ưu và xóa bỏ các thông tin phóng đại. |
| EV-M6-21 | Known Gaps Registry | **PASS** | Làm mới tài liệu, phản ánh chính xác trạng thái KG-S4-06, KG-M1-05, KG-M3-14 theo yêu cầu. |
| EV-M6-22 | Final Review Report | **PASS** | Viết lại dựa trên bằng chứng kỹ thuật, thay vì các thông tin phóng đại chưa kiểm chứng. Phản ánh đúng chức năng `Hybrid` và chuyển giao cho F4/F5. |

## 2. Kết luận
Tất cả các cảnh báo (F1-F9) từ bước review trước đã được giải quyết hoàn toàn. M6 đạt **PASS** trên hầu hết các cổng kỹ thuật và hồ sơ đóng Sprint, ngoại trừ 2 mục **UNVERIFIED** (Coverage và Drift Migration) đã được cố tình hoãn lại và ghi nhận vào Known Gaps.
Sẵn sàng đóng Sprint 4 (Interpretation Engine) ở phiên bản `0.4.0`!
