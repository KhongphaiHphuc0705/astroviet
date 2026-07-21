Kế hoạch triển khai Sprint 1: Identity Module

1. Review Kiến trúc & Cấu trúc Thư mục (Clean Architecture 4-layer)
Module Identity sẽ được đặt tại src/modules/identity/ và phân bổ chặt chẽ theo 4 layer:

text

src/modules/identity/
├── domain/
│   ├── ports/
│   │   ├── user-repository.port.ts      # IUserRepository
│   │   ├── token-repository.port.ts     # ITokenRepository
│   │   ├── password-hasher.port.ts      # IPasswordHasher
│   │   └── token-provider.port.ts       # ITokenProvider

├── application/
│   └── use-cases/
│       ├── register-user.usecase.ts
│       ├── login-user.usecase.ts
│       ├── refresh-token.usecase.ts
│       └── logout-user.usecase.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── prisma-user.repository.ts
│   │   └── prisma-token.repository.ts
│   └── adapters/
│       ├── bcrypt-password-hasher.adapter.ts
│       └── jwt-token.adapter.ts
├── presentation/
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── schemas/
│   │   ├── register.schema.ts
│   │   └── login.schema.ts
│   └── routes/
│       └── auth.routes.ts
└── index.ts                             # Export các thành phần cần thiết cho Composition Root
Ngoài ra:

Middleware: auth.middleware.ts và require-role.middleware.ts sẽ được đặt tại src/shared/middlewares/ vì nó phục vụ toàn bộ hệ thống. Các middleware này sẽ nhận ITokenProvider thông qua Dependency Injection.
2. Giải thích Use Case Layer (Chống Anti-pattern)
Để tránh "God Use Case", toàn bộ logic được chia nhỏ thành các class riêng biệt. Mỗi class chỉ thực hiện đúng 1 phương thức execute():

RegisterUserUseCase: Xử lý đăng ký. Kích hoạt Email Verification Placeholder (in log).
LoginUserUseCase: Xác minh password, tạo Access + Refresh Token.
RefreshTokenUseCase: Xoay vòng token.
LogoutUserUseCase: Thu hồi Refresh Token hiện hành.
3. Quyết định Kỹ thuật (Tech Choices)
Password Hash: Quay về sử dụng bcrypt (cost factor 12) theo đúng nguyên trạng 5 tài liệu đã freeze. Không đổi sang Argon2id để tránh sửa specs.
JWT Provider: Khai báo port ITokenProvider và triển khai adapter bằng jsonwebtoken.
Refresh Token Rotation: Ở Milestone 6, chỉ làm Rotation cơ bản (reject nếu client gửi lên token đã bị revoke). Việc tự động bắt đăng nhập lại toàn bộ family (Leak Detection) sẽ để dành cho tính năng mở rộng, tránh phình scope M6.
Out of Scope: Endpoint GET/PATCH /users/me và GET/PUT /users/me/preferences được xác nhận là OUT OF SCOPE cho Sprint 1, sẽ được làm ở Sprint quản lý hồ sơ sau.
4. Giải thích Testing Strategy
Quy ước vị trí Test: Lựa chọn phương án (b) — Công nhận tests/unit/<module>/ là convention chính thức. Điều này giúp giữ nguyên trạng thái thành công của Sprint 0 (các test của health đang nằm ở tests/unit/health/).
Phân bổ Test: Test sẽ không dồn cục vào Milestone 9. Thay vào đó, test được viết song song với quá trình code:
Repository Integration Test sẽ viết trong Milestone 2.
Use Case Unit Test và API Test sẽ viết ngay trong Milestone 4, 5, 6.
Auth Middleware Test viết tại Milestone 8.
Milestone 9 chỉ dành cho việc rà soát Coverage Gap.
5. Danh sách 10 Milestone cụ thể cho Sprint 1
Milestone 1: Cập nhật schema.prisma (bảng identity.users, identity.refresh_tokens). Migration. Viết seed tạo 1 tài khoản admin local để phục vụ dev.
Milestone 2: Phát triển domain/ports và infrastructure/repositories (Prisma) cho User và Token. Kèm Integration Test.
Milestone 3: Phát triển password-hasher (bcrypt) và token-provider (JWT) cùng các interfaces. Kèm Unit Test.
Milestone 4: Phát triển RegisterUserUseCase (check trùng email, hash password, persist user) và API /register. Kèm Unit/API Test.
Milestone 5: Phát triển LoginUserUseCase (verify password, issue tokens) và API /login (set HttpOnly cookie). Kèm Unit/API Test.
Milestone 6: Phát triển RefreshTokenUseCase, LogoutUserUseCase (rotation cơ bản, revocation) và API /refresh, /logout. Kèm Unit/API Test.
Milestone 7: Implement Email Verification Placeholder (in log token ra console ở hàm Register).
Milestone 8: Phát triển auth.middleware.ts tại src/shared/middlewares/ để decode JWT, gắn req.user.
Milestone 9: Rà soát Coverage Gap, bổ sung các edge cases còn thiếu để đạt chuẩn >= 80/90%.
Milestone 10: Review, OpenAPI Documentation, Cleanup code và update README.md.