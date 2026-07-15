# AstroViet Backend

Backend cho nền tảng AstroViet — Western Astrology cho người Việt.

> **Trạng thái:** Hoàn tất Sprint 0 (Project Bootstrap). Hệ thống đã sẵn sàng cho Development.

## Project Overview

Hệ thống API xây dựng trên nền tảng **Node.js 22 LTS**, sử dụng kiến trúc **Clean Architecture**. Cung cấp đầy đủ hạ tầng cho Error Handling, Logging, Validation, Testing, và CI/CD.

## Requirements

- **Node.js:** v22.18.0 trở lên
- **Docker & Docker Compose** (để chạy Database cục bộ)
- **Database:** PostgreSQL (sẽ được spin up qua Docker)

## Installation

```bash
# 1. Cài đặt dependencies
npm ci

# 2. Setup biến môi trường
cp .env.example .env

# 3. Generate Prisma Client (nếu cần thiết)
npx prisma generate
```

## Docker

Dự án đi kèm cấu hình Docker để bạn có thể nhanh chóng khởi tạo PostgreSQL Database.

```bash
docker compose up -d
```

Sau đó bạn có thể chạy `npm run prisma:migrate` để đồng bộ schema.

## Development

Khởi chạy HTTP server kèm tính năng Hot Reloading.

```bash
npm run dev
```

Server sẽ chạy ở cổng `3000` (theo mặc định của `.env`).

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

## Folder Structure

Dự án tuân theo Clean Architecture:

- `src/config/`: Quản lý cấu hình toàn cục.
- `src/docs/`: Quản lý logic sinh OpenAPI và Swagger UI.
- `src/health/`: Module mẫu đầu tiên, tuân theo thiết kế Dependency Injection.
- `src/shared/`: Shared Infrastructure (Error Kernel, Logger, Prisma).
- `src/composition-root.ts`: Đỉnh của cấu trúc DI, khởi tạo và lắp ráp dependencies.

## OpenAPI

Chạy lệnh `npm run generate:openapi` để hệ thống đọc các schema Zod và xuất ra file `openapi.json` ở thư mục gốc.
Sau khi chạy Dev Server, truy cập `http://localhost:3000/docs` để xem giao diện **Swagger UI**.

## Testing

Dự án yêu cầu Coverage ở mức tối thiểu 80% (Global).

```bash
npm run test:coverage
```

Tất cả các file unit test, integration test được đặt trong thư mục `tests/`.

---

**License:** Proprietary — Internal project.
