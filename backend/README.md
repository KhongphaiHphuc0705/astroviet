# AstroViet Backend

Backend cho nền tảng AstroViet — Western Astrology cho người Việt.

> **Trạng thái:** Hoàn thành Sprint 1 (Identity Module). Hệ thống cung cấp đầy đủ Register/Login/Refresh/Logout an toàn với JWT và Refresh Token.

## Architecture

Hệ thống được thiết kế chặt chẽ theo **Clean Architecture** để đảm bảo khả năng bảo trì và mở rộng dài hạn. Mỗi module nghiệp vụ được chia thành 4 layer (từ trong ra ngoài):

1. **Domain Layer:** Chứa Entities và Ports (Interfaces), hoàn toàn không phụ thuộc framework hay thư viện bên ngoài.
2. **Application Layer:** Chứa các Use Cases (Business Logic), chỉ gọi Domain Ports.
3. **Infrastructure Layer:** Triển khai các Ports (Adapters), giao tiếp với Database, Hashers, Token Providers.
4. **Presentation Layer:** Giao tiếp với Client (Express Controllers, Routes, OpenAPI Schemas).

Dependency Rule: **Layer ngoài chỉ được import layer trong, layer trong không bao giờ biết đến layer ngoài.**
_(Xem chi tiết tại `docs/architecture/Project_Architecture_Specification.md`)_

## Tech Stack

- **Runtime:** Node.js v22 LTS (hoặc mới hơn)
- **Framework:** Express
- **Database ORM:** Prisma + PostgreSQL
- **Validation:** Zod
- **Testing:** Vitest
- **Logging:** Pino
  _(Xem file `package.json` để biết phiên bản chính xác)_

## Folder Structure

```text
src/
├── config/              # Cấu hình biến môi trường
├── docs/                # Code sinh OpenAPI và cấu hình Swagger UI
├── health/              # Module Health Check cơ bản
├── modules/
│   └── identity/        # 🔐 Identity Module (Nghiệp vụ cốt lõi hiện tại)
│       ├── domain/        # Entities, Ports
│       ├── application/   # Use Cases (Register, Login, Refresh, Logout)
│       ├── infrastructure/# Prisma Repositories, JWT Adapter, Bcrypt Adapter
│       └── presentation/  # Auth Controllers, Routes, Zod Schemas
├── shared/              # Shared Kernel (Error Kernel, Middleware, Logger)
├── app.ts               # Khởi tạo Express App
├── composition-root.ts  # Nơi kết nối toàn bộ Dependencies (Manual DI)
└── server.ts            # Entry point chạy ứng dụng
```

## Quick Start

### 1. Cài đặt

```bash
npm ci
cp .env.example .env
```

### 2. Thiết lập Database & Chạy Development

> **Lưu ý:** Việc phát triển hàng ngày (Dev) thường nên chạy Node.js trực tiếp trên host và chỉ dùng Docker cho PostgreSQL để tối ưu tốc độ.

```bash
# Khởi động PostgreSQL qua Docker Compose
docker compose up -d

# Migrate database
npm run prisma:migrate

# Chạy server ở chế độ dev (mặc định PORT 3000 hoặc theo cấu hình trong .env)
npm run dev
```

_Nếu bạn muốn chạy toàn bộ stack qua Docker (cả Node.js và Postgres), hãy tạo file `.env.development` từ `.env.example` và chạy `docker compose -f docker-compose.yml up`._

## Environment Variables

Tạo file `.env` dựa trên `.env.example`. Dưới đây là giải thích các biến chính:

| Biến                        | Bắt buộc | Default       | Mô tả                                                        |
| :-------------------------- | :------: | :------------ | :----------------------------------------------------------- |
| `NODE_ENV`                  |    Có    | `development` | `development`, `production`, hoặc `test`.                    |
| `PORT`                      |  Không   | `3000`        | Cổng HTTP server.                                            |
| `DATABASE_URL`              |    Có    | -             | Chuỗi kết nối PostgreSQL.                                    |
| `LOG_LEVEL`                 |  Không   | `info`        | Mức log của Pino (`debug`, `info`, `warn`, `error`).         |
| `JWT_ACCESS_SECRET`         |    Có    | -             | Khóa bí mật ký Access Token (≥ 32 ký tự).                    |
| `JWT_REFRESH_SECRET`        |    Có    | -             | Khóa bí mật ký Refresh Token (khác với Access Secret).       |
| `JWT_ACCESS_EXPIRY_MINUTES` |  Không   | `15`          | Thời gian sống của Access Token (phút).                      |
| `JWT_REFRESH_EXPIRY_DAYS`   |  Không   | `7`           | Thời gian sống của Refresh Token (ngày).                     |
| `SEED_ADMIN_*`              |  Không   | -             | Email/Password dùng cho `prisma:seed` để tạo Admin đầu tiên. |

## Authentication Flow

Hệ thống sử dụng cơ chế Access/Refresh token bảo mật:

1. **Register / Login:** Client gửi thông tin xác thực. Server trả về `accessToken` dạng JSON và tự động set `refreshToken` vào **HttpOnly Cookie**.
2. **Access API:** Các request yêu cầu xác thực (`requireAuth`) cần truyền `Authorization: Bearer <accessToken>`.
3. **Refresh Token:** Khi Access Token hết hạn, Client gọi `POST /api/v1/auth/refresh` (cookie sẽ tự được gửi kèm) để nhận bộ Token mới (Refresh Token Rotation).
4. **Logout:** Gọi `POST /api/v1/auth/logout`. Server thu hồi token trong DB và xóa cookie ở Client.

## Running Test

Dự án phân biệt rõ Unit Test (không chạm DB) và Integration/API Test (cần DB thật).

```bash
# 1. Chạy toàn bộ test (YÊU CẦU DB TEST)
# Khởi động DB cho môi trường Test ở port riêng biệt (5433)
docker compose -f docker-compose.test.yml up -d
npm run test:coverage

# 2. Chỉ chạy Unit Test (Mock dependencies, KHÔNG cần DB)
npx vitest run tests/unit
```

_(Lưu ý: Nếu có file test tên trùng nhau ở `tests/unit/` và `tests/integration/`, đó là chủ ý phân tách mock test và real-DB test)._

## OpenAPI / Swagger UI

Dự án dùng một nguồn sự thật duy nhất (Zod schema) để vừa validate dữ liệu vừa sinh OpenAPI docs.

- Generate file `openapi.json`: `npm run generate:openapi`
- Xem giao diện tương tác Swagger UI: Chạy server và truy cập `http://localhost:3000/docs`

## Docker Environments

Dự án cung cấp 3 file Compose:

- `docker-compose.yml`: Dùng cho Dev.
- `docker-compose.test.yml`: Dùng riêng cho Test (DB rỗng, port khác để chạy song song Dev).
- `docker-compose.prod.yml`: Dùng cho Production.

## Database Management (Prisma)

Trình tự làm việc với DB chuẩn:

1. `npm run prisma:generate`: Cập nhật Prisma Client sau khi đổi schema.
2. `npm run prisma:migrate`: Apply migration lên Dev DB.
3. `npm run prisma:deploy`: Dành riêng cho môi trường CI/Production.
4. `npm run prisma:seed`: Khởi tạo dữ liệu mẫu (ví dụ: Admin đầu tiên).

## Scripts

| Lệnh                              | Mô tả                                                 |
| :-------------------------------- | :---------------------------------------------------- |
| `npm run dev`                     | Khởi chạy Dev server (tsx watch).                     |
| `npm run build`                   | Compile TypeScript sang JavaScript ở thư mục `dist/`. |
| `npm start`                       | Chạy production build.                                |
| `npm run lint` / `lint:fix`       | Kiểm tra và tự động sửa lỗi mã nguồn bằng ESLint.     |
| `npm run format` / `format:check` | Định dạng code bằng Prettier.                         |
| `npm run typecheck`               | Dùng tsc để kiểm tra lỗi TypeScript.                  |
| `npm run test`                    | Chạy bộ test bằng Vitest.                             |
| `npm run test:coverage`           | Chạy test và sinh báo cáo Coverage.                   |
| `npm run generate:openapi`        | Sinh tài liệu Swagger JSON/YAML từ mã nguồn Zod.      |
| `npm run prisma:migrate`          | Migrate cho Dev.                                      |
| `npm run prisma:deploy`           | Migrate cho Production.                               |
| `npm run prisma:studio`           | Mở giao diện quản trị DB.                             |
| `npm run prisma:seed`             | Seed dữ liệu ban đầu.                                 |
| `npm run db:reset`                | Xóa sạch DB và chạy lại migration.                    |
| `npm run db:push`                 | Đồng bộ schema nhanh không cần migration (chỉ dev).   |

## Coding Standards

Dự án áp dụng chặt chẽ ESLint, Prettier, TypeScript Strict Mode, Error Kernel Pattern và Conventional Commits.
_(Xem chi tiết tại `docs/development/Coding_Standards_And_Conventions.md`)_

## Contribution

- Mọi code mới phải trải qua quá trình PR.
- Yêu cầu vượt qua các bước kiểm tra cục bộ trước khi push: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test:coverage`. (Husky đã được thiết lập để hỗ trợ việc này).

## Project Roadmap

- **Sprint 1:** Identity Module (Hoàn thành) ✅
- **Sprint 2:** Birth Profile Module (Sắp tới) 🔜

---

**License:** Proprietary — Internal project.
