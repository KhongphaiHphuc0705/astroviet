# Sprint F3 Known Gaps Registry

This registry tracks technical debt, deferred features, unverified assumptions, and actual defects identified during Sprint F3.

| ID | Nhóm | Mô tả | Evidence | Severity | Follow-up |
|---|---|---|---|---|---|
| G-F3-01 | Intentionally Deferred | Chart-specific Ascendant/House warning không có trong Birth Form | OQ-F3-1 RESOLVED | — | Chờ milestone Chart creation (Phase 3) |
| G-F3-02 | Intentionally Deferred | `Toast` component không được xây; dùng `Alert`/success-banner cục bộ cho mọi thông báo kết quả | Grep `shared/ui/` xác nhận không có `Toast` | Low | Xây khi có milestone Design-System/notification riêng |
| G-F3-03 | Known Technical Debt | 2 mục nav cũ (`Bảng điều khiển`, `Cài đặt`) trong `AppLayout` vẫn dùng `<a href="/">` thay vì `<Link>` | Đọc trực tiếp `widgets/app-layout/index.tsx`, M6 audit | Low | Sửa khi làm Dashboard/Settings thật |
| G-F3-04 | Known Technical Debt | Desktop sidebar và mobile drawer là 2 khối JSX trùng lặp, không chung config; không có active-state route | M6 audit | Low | Refactor khi có >3 mục nav |
| G-F3-05 | Known Technical Debt | Input giờ sinh tự viết tay không còn dùng `register()`/`mode:"onBlur"` của RHF — lỗi hiện ở submit thay vì on-blur như trước (khác UX nhỏ so với các field khác trong form) | Đọc `BirthProfileForm.tsx` sau UI/UX fix #1 | Low | Cân nhắc rebuild bằng `Controller` nếu cần đồng bộ timing validate |
| G-F3-06 | Known Technical Debt | `e2e/birth-profile.spec.ts` mock response `/locations/search` thay vì gọi geonames thật, lệch nhẹ so với chủ đích ban đầu (M5 plan) "không mock ở E2E" cho bước này | commit `bc593e5`, lý do: giảm flaky CI | Low | Chấp nhận trade-off, ghi nhận coverage thật của geonames integration chỉ còn ở mức manual/staging |
| G-F3-07 | RESOLVED | `npm run test:e2e` với backend thật chưa được Claude tự verify trong phiên M8 | Phuc Hoang đã tự xác nhận E2E pass 13/13 (16.6s) trên backend thật (Docker) | N/A | Không còn gap, đã VERIFIED |
| G-F3-08 | Unverified | Responsive layout (`Grid` breakpoint) chưa có test tự động, chỉ review bằng mắt qua các lần trước | M4 audit | Low | Thêm visual/responsive test nếu cần ở Sprint sau |
| G-F3-09 | Documentation | REST API Spec §2.4 (trong `Sprint_F3_Implementation_Plan.md`, không phải tài liệu Backend) có 2 sai lệch đã phát hiện ở M6 (`INVALID_BIRTH_DATE` mô tả sai ngữ nghĩa; thiếu `INVALID_BIRTH_TIME`) | M6 Decision Log D-02/D-03 | Low | Sửa khi cập nhật lại master plan, không blocking code |
