# Sprint 0 — Project Bootstrap
## AstroViet Backend — Thiết kế Project Skeleton

| | |
|---|---|
| **Loại tài liệu** | Sprint Plan — Project Bootstrap (không chứa business logic) |
| **Ngày soạn** | 12/07/2026 |
| **Tài liệu nguồn** | 8 tài liệu đã freeze (PRD → Coding Standards & Conventions) |
| **Trạng thái** | **Chờ xác nhận từng bước** — theo yêu cầu, chưa sinh code cho đến khi có xác nhận |

> **Nhắc lại phạm vi Sprint 0:** Không business logic, không endpoint nghiệp vụ, không Astrology Engine, không Chart Module. Chỉ dựng khung xương để `npm install && docker compose up && npm run dev` chạy được với Swagger/Health Check/Prisma/Logger/Test/CI hoạt động.

---

## Mục lục
1. [Folder Structure hoàn chỉnh](#1-folder-structure-hoàn-chỉnh)
2. [Dependency List & Lý do chọn](#2-dependency-list--lý-do-chọn)
3. [Quyết định kỹ thuật theo từng khu vực](#3-quyết-định-kỹ-thuật-theo-từng-khu-vực)
4. [File Manifest — toàn bộ file sẽ tạo](#4-file-manifest--toàn-bộ-file-sẽ-tạo)
5. [Implementation Roadmap (từng bước nhỏ)](#5-implementation-roadmap-từng-bước-nhỏ)
6. [Implementation Notes](#6-implementation-notes)

---

## 1. Folder Structure hoàn chỉnh

```
astroviet-backend/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .husky/
│   └── pre-commit
├── docs/
│   └── openapi/                      # openapi.json generate ra, không sửa tay
├── prisma/
│   ├── schema.prisma
│   ├── migrations/                    # trống ở Sprint 0, chỉ có migration_lock.toml sau lần đầu chạy
│   └── seed.ts                        # skeleton rỗng — Sprint 0 chưa có reference data thật
├── scripts/
│   └── generate-openapi.ts
├── src/
│   ├── config/
│   │   └── env.config.ts
│   ├── shared/
│   │   ├── errors/
│   │   │   ├── app-error.ts
│   │   │   └── error-codes.ts
│   │   ├── http/
│   │   │   ├── problem-details.ts
│   │   │   └── async-handler.ts
│   │   ├── logger/
│   │   │   └── pino.logger.ts
│   │   ├── middlewares/
│   │   │   ├── request-id.middleware.ts
│   │   │   └── error-handler.middleware.ts
│   │   ├── prisma/
│   │   │   └── prisma-client.ts        # Prisma Client singleton
│   │   └── zod/
│   │       └── common-schemas.ts       # khung rỗng — mở rộng ở Sprint 1
│   ├── health/                         # KHÔNG nằm trong modules/ — xem Mục 3.7 Design Rationale
│   │   ├── health.controller.ts
│   │   └── health.routes.ts
│   ├── modules/                         # TRỐNG ở Sprint 0 — chỉ có .gitkeep, chưa có module nghiệp vụ nào
│   │   └── .gitkeep
│   ├── app.ts
│   ├── server.ts
│   └── composition-root.ts             # skeleton rỗng — chưa register gì
├── tests/
│   ├── setup/
│   │   └── vitest.setup.ts
│   └── api/
│       └── health.api.test.ts
├── .dockerignore
├── .editorconfig
├── .env.example
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc
├── .prettierignore
├── docker-compose.yml
├── docker-compose.prod.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

**Đối chiếu Project Architecture Specification Mục 5:** Cấu trúc trên giữ nguyên `src/config`, `src/shared`, `src/modules`, `app.ts`, `server.ts`, `composition-root.ts` đúng như đã chốt — Sprint 0 chỉ **chưa lấp đầy** `modules/` (đúng phạm vi "không business logic"). `src/health/` là bổ sung hợp lý nằm ngoài `modules/` — giải thích ở Mục 3.7.

---

## 2. Dependency List & Lý do chọn

### 2.1 Production Dependencies

| Package | Lý do chọn |
|---|---|
| `express` | Framework đã chốt (Project Architecture Spec) |
| `helmet` | Security header chuẩn (Backend Implementation Guide Mục 27) |
| `cors` | CORS whitelist theo `CORS_ORIGIN` (REST API Spec Mục 11) |
| `compression` | Gzip response (Backend Implementation Guide Mục 26) |
| `cookie-parser` | Đọc `refreshToken` từ HttpOnly Cookie (REST API Spec Quyết định 14.4) — cần sẵn từ Sprint 0 dù Identity module chưa có, vì middleware toàn cục |
| `dotenv` | Load `.env` ở local/Docker — đơn giản, phổ biến, tương thích mọi Node LTS (thay vì phụ thuộc `--env-file` chỉ có ở Node 20.6+) |
| `zod` | Validation đã chốt — dùng ngay từ Sprint 0 để validate `env.config.ts` (fail-fast) |
| `pino` | Logger đã chốt |
| `pino-http` | Middleware log HTTP request tự động, tích hợp `req.id` (Backend Implementation Guide Mục 14) |
| `@prisma/client` | Prisma Client runtime |
| `swagger-ui-express` | Serve Swagger UI từ OpenAPI spec đã generate |
| `@asteasolutions/zod-to-openapi` | Generate OpenAPI 3.1 từ Zod schema (Backend Implementation Guide Quyết định IN-2 — default implementation) |

> **Ghi chú:** `jsonwebtoken`, `bcrypt` (Identity module) và `node-cron` (Background Job) **chưa cài ở Sprint 0** — đây là dependency của business logic, sẽ thêm khi bắt đầu module tương ứng ở Sprint sau, đúng tinh thần "không nhảy sang nghiệp vụ".

### 2.2 Development Dependencies

| Package | Lý do chọn |
|---|---|
| `typescript` | Ngôn ngữ đã chốt |
| `tsx` | Chạy TypeScript trực tiếp + hot-reload cho `npm run dev` (nhẹ hơn `ts-node-dev`, tương thích ESM tốt) |
| `@types/node`, `@types/express`, `@types/cors`, `@types/compression`, `@types/cookie-parser` | Type definition cần thiết ứng với từng package production |
| `cross-env` | Đặt `NODE_ENV` nhất quán giữa Windows/macOS/Linux trong npm scripts (`cross-env NODE_ENV=test vitest run`) — tránh lỗi cú pháp set biến môi trường khác nhau giữa các OS shell |
| `vitest` | Test framework đã chốt |
| `supertest` + `@types/supertest` | HTTP assertion cho API Test (Backend Implementation Guide Mục 20) |
| `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` | Lint TypeScript |
| `eslint-plugin-import` | Enforce Import Order (Coding Standards Mục 15) |
| `eslint-plugin-boundaries` | Enforce Dependency Rules (Backend Implementation Guide Mục 4) — **quan trọng bật từ Sprint 0** để mọi module nghiệp vụ sau này tự động bị chặn nếu vi phạm ranh giới layer, không phải "thêm sau" |
| `eslint-config-prettier` | Tắt rule ESLint xung đột với Prettier |
| `prettier` | Formatter đã chốt |
| `husky` | Git hook |
| `lint-staged` | Chỉ lint/format file thay đổi trong commit, không toàn repo |
| `prisma` (CLI) | Migration tool |
| `pino-pretty` | Pretty log cho `development` (Backend Implementation Guide Mục 14) |

**Checklist Design Rationale tổng quát:** Toàn bộ package trên khớp *chính xác* danh sách Tech Stack đã chốt ở Project Architecture Specification — không thêm package ngoài phạm vi (ví dụ không thêm `winston` thay Pino, không thêm `joi` thay Zod).

---

## 3. Quyết định kỹ thuật theo từng khu vực

### 3.1 Dependency Injection
**Quyết định:** **Không dùng DI framework** (không InversifyJS/tsyringe). `composition-root.ts` là 1 file duy nhất, Manual Constructor Injection — đúng ADR ngầm định ở Project Architecture Spec Mục 5 Design Rationale ("quy mô 1 dev không cần thêm độ phức tạp DI framework").

**Sprint 0 làm gì:** Tạo `composition-root.ts` với **cấu trúc rỗng** — khởi tạo `PrismaClient` singleton, `logger`, `env` — nhưng **chưa** khởi tạo bất kỳ Repository/UseCase/Controller nghiệp vụ nào (vì chưa có module nào tồn tại). File này sẽ được "lấp dần" ở mỗi Sprint sau khi thêm module mới.

### 3.2 Express Bootstrap
**Thứ tự middleware ở `app.ts`** (khớp Project Architecture Spec Mục 7.1 bước [1]-[3]):
1. `helmet()`
2. `cors({ origin: env.CORS_ORIGIN, credentials: true })`
3. `compression()`
4. `cookie-parser()`
5. `requestId middleware` (sinh `req.id` bằng `crypto.randomUUID()` — không cần thêm package `uuid`, Node built-in đã đủ)
6. `pino-http` (tự log mỗi request, dùng `req.id` làm `reqId`)
7. Mount routes (`/health`, `/ready`, `/live` — Sprint 0; `/api/v1/*` — để trống, mount dần từ Sprint sau)
8. `errorHandlerMiddleware` (luôn là middleware **cuối cùng** — Backend Implementation Guide Mục 12)

**`server.ts`** tách biệt khỏi `app.ts` (Project Architecture Spec Mục 5) — `app.ts` chỉ export Express instance (test được bằng Supertest không cần bind port thật), `server.ts` là entry point thật sự gọi `app.listen()`.

### 3.3 Configuration
**Quyết định:** `env.config.ts` dùng Zod `.parse()` fail-fast đúng mẫu đã có sẵn ở Project Architecture Spec Mục 13.1. Sprint 0 chỉ cần tập con biến môi trường **thực sự dùng ở khung xương** (không khai báo biến của module nghiệp vụ chưa tồn tại):

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `NODE_ENV` | ✔ | `development`\|`staging`\|`production` |
| `PORT` | ✘ (default 3000) | — |
| `DATABASE_URL` | ✔ | Prisma cần ngay để migrate |
| `CORS_ORIGIN` | ✔ | — |
| `LOG_LEVEL` | ✘ (default `info`) | — |

> Các biến `JWT_*`, `RATE_LIMIT_*`, `DATA_RETENTION_DAYS`, `GEOCODING_PROVIDER_API_KEY`, `SWISS_EPHEMERIS_DATA_PATH`... **chưa khai báo ở Sprint 0** — sẽ bổ sung vào `envSchema` đúng lúc module cần đến chúng ra đời, tránh `env.config.ts` khai báo "khống" biến chưa dùng.

### 3.4 Logging
Pino ở `shared/logger/pino.logger.ts`, cấu hình transport `pino-pretty` chỉ khi `NODE_ENV=development` (đúng Backend Implementation Guide Mục 14) — production log JSON thuần. `pino-http` tự động gắn `req.id` vào mọi log line trong vòng đời 1 request.

### 3.5 Prisma
**Sprint 0 tạo `schema.prisma` với 3 schema Postgres rỗng** (`identity`, `astrology`, `content` — đúng Database Design Spec Mục 3), **chưa có model nào** — chỉ khai báo `datasource`/`generator` với `previewFeatures = ["multiSchema"]` và `schemas = ["identity", "astrology", "content"]`. Chạy migration đầu tiên chỉ để **tạo 3 schema rỗng trong Postgres**, xác nhận Prisma kết nối DB thành công — đúng Sprint Goal ("Prisma kết nối PostgreSQL. Migration chạy được.") mà chưa cần bảng thật.

`PrismaClient` singleton ở `shared/prisma/prisma-client.ts` — instantiate đúng 1 lần, export ra cho `composition-root.ts` dùng (tránh nhiều instance gây exhaust connection pool, đặc biệt quan trọng với `tsx watch` hot-reload dễ tạo nhiều instance nếu không cẩn thận).

**Repository Base:** Sprint 0 **không tạo** Repository Base class/interface chung — vì mỗi Repository theo Backend Implementation Guide Mục 7 đặt tên method theo ý định nghiệp vụ cụ thể (không phải CRUD generic dùng chung 1 base class). Nếu về sau phát hiện logic thật sự lặp lại giữa các Repository (ví dụ helper build pagination), sẽ tách thành 1 hàm dùng chung ở `shared/`, không phải class kế thừa.

### 3.6 Testing
`vitest.config.ts` trỏ `tests/setup/vitest.setup.ts` (load `.env.test` nếu có, cấu hình global). Sample test duy nhất ở Sprint 0: `tests/api/health.api.test.ts` — dùng Supertest gọi `GET /health` qua `app` (import trực tiếp từ `app.ts`, không cần server thật chạy).

### 3.7 Health Module — vì sao nằm ngoài `modules/`
**Design Rationale:** `health` không phải Bounded Context nghiệp vụ (không có Aggregate Root, không theo 4-layer Clean Architecture đầy đủ — Project Architecture Spec Mục 3 liệt kê Identity/BirthProfile/Chart/Article/Location/ReferenceData, không có Health). Đặt `src/health/` ngang hàng `src/shared/`, `src/config/` — đây là **infrastructure cross-cutting concern**, tương tự cách Kubernetes/Docker coi health check là hạ tầng vận hành, không phải nghiệp vụ sản phẩm.

3 endpoint theo đúng quy ước container orchestration chuẩn:
| Endpoint | Mục đích | Check gì |
|---|---|---|
| `GET /health` | Tổng quan tình trạng hệ thống (dùng bởi con người/monitoring dashboard) | `SELECT 1` qua Prisma — xác nhận kết nối DB |
| `GET /ready` | Readiness probe (container orchestration hỏi "đã sẵn sàng nhận traffic chưa") | Giống `/health` — DB phải kết nối được mới `ready` |
| `GET /live` | Liveness probe ("process còn sống không") | Không check gì ngoài — chỉ trả `200 OK` nếu process nhận được request (không check DB, vì DB down không có nghĩa là process cần bị kill/restart) |

### 3.8 OpenAPI/Swagger
`scripts/generate-openapi.ts` chạy độc lập (`npm run generate:openapi`), quét toàn bộ Zod schema đã đăng ký `.openapi(...)` (Coding Standards Mục 11), xuất `docs/openapi/openapi.json`. `app.ts` mount `swagger-ui-express` đọc file này ở route `/docs`. Sprint 0 chỉ có health check trong Swagger — spec sẽ "lớn dần" theo từng Sprint thêm module.

### 3.9 Docker
- `Dockerfile`: multi-stage (`deps` → `build` → `runner`), base image `node:22-alpine` (khớp Node.js 22.18.0 đang dùng — Quyết định xác nhận).
- `docker-compose.yml` (dev): service `app` (mount source code, hot-reload qua `tsx watch`) + service `postgres` (image `postgres:16-alpine`, volume named đảm bảo dữ liệu không mất khi container restart, `healthcheck` dùng `pg_isready`). Cả 2 service có `restart: unless-stopped` (bổ sung theo xác nhận) — tự khởi động lại nếu crash, nhưng không cố khởi động lại nếu bị dừng thủ công (`docker compose stop`).
- `docker-compose.prod.yml`: build image từ `Dockerfile` stage `runner`, không mount source, dùng `env_file`.
- `app` service trong Compose có `depends_on: postgres: condition: service_healthy` — tránh app khởi động trước khi Postgres sẵn sàng (lỗi kết nối giả ở lần chạy đầu).

### 3.10 CI (GitHub Actions)
`ci.yml` chạy trên `push`/`pull_request`, 3 job tuần tự: `lint` → `test` (có service `postgres` để chạy test cần DB thật nếu có) → `build` (`tsc --noEmit` + `npm run build`). Fail bất kỳ job nào → chặn merge (khớp Coding Standards Mục 23).

---

## 4. File Manifest — toàn bộ file sẽ tạo

| # | File | Nội dung tóm tắt |
|---|---|---|
| 1 | `package.json` | Scripts + dependency list Mục 2 |
| 2 | `tsconfig.json` | `strict: true`, path alias `@/*` → `src/*` |
| 3 | `.editorconfig` | Đồng bộ indent/charset giữa editor khác nhau |
| 4 | `.gitignore` | `node_modules`, `dist`, `.env`, `docs/openapi/*.json` (generated) |
| 5 | `.dockerignore` | Loại trừ `node_modules`, `.git`, test file khỏi Docker build context |
| 6 | `.env.example` | 5 biến Mục 3.3, không giá trị thật |
| 7 | `.eslintrc.cjs` | Rule set Coding Standards Mục 23, bật `boundaries` ngay từ đầu |
| 8 | `.prettierrc` | Config Coding Standards Mục 24 |
| 9 | `.prettierignore` | Loại trừ file generated |
| 10 | `.husky/pre-commit` | Chạy `lint-staged` |
| 11 | `src/config/env.config.ts` | Zod envSchema (Mục 3.3) |
| 12 | `src/shared/errors/app-error.ts` | `AppError` + subclass (Backend Implementation Guide Mục 12) |
| 13 | `src/shared/errors/error-codes.ts` | Hằng số error code dùng chung |
| 14 | `src/shared/http/problem-details.ts` | RFC7807 formatter |
| 15 | `src/shared/http/async-handler.ts` | Wrapper Controller (Coding Standards Mục 17) |
| 16 | `src/shared/logger/pino.logger.ts` | Logger instance (Mục 3.4) |
| 17 | `src/shared/middlewares/request-id.middleware.ts` | Sinh `req.id` |
| 18 | `src/shared/middlewares/error-handler.middleware.ts` | Global Error Handler |
| 19 | `src/shared/prisma/prisma-client.ts` | Prisma Client singleton |
| 20 | `src/shared/zod/common-schemas.ts` | Khung rỗng (pagination query schema dùng chung — chuẩn bị sẵn, chưa dùng ở Sprint 0) |
| 21 | `src/health/health.controller.ts` | 3 handler `/health`, `/ready`, `/live` |
| 22 | `src/health/health.routes.ts` | Express Router cho Health |
| 23 | `src/app.ts` | Lắp middleware + mount route (Mục 3.2) |
| 24 | `src/server.ts` | Entry point `app.listen()` |
| 25 | `src/composition-root.ts` | Khởi tạo `PrismaClient`, `logger`, `env` — chưa register module |
| 26 | `prisma/schema.prisma` | 3 schema rỗng (Mục 3.5) |
| 27 | `prisma/seed.ts` | Skeleton rỗng |
| 28 | `scripts/generate-openapi.ts` | Generate `docs/openapi/openapi.json` |
| 29 | `tests/setup/vitest.setup.ts` | Global test setup |
| 30 | `tests/api/health.api.test.ts` | Test `GET /health` |
| 31 | `vitest.config.ts` | Cấu hình Vitest |
| 32 | `Dockerfile` | Multi-stage build |
| 33 | `docker-compose.yml` | `app` + `postgres` (dev) |
| 34 | `docker-compose.prod.yml` | Production variant |
| 35 | `.github/workflows/ci.yml` | Lint → Test → Build |
| 36 | `README.md` | Hướng dẫn chạy Quickstart (`npm install && docker compose up && npm run dev`) |

**Tổng: 36 file.** Không có file nào thuộc `modules/` (đúng phạm vi Sprint 0).

---

## 5. Implementation Roadmap (8 Milestone)

> **Cập nhật theo xác nhận:** Gộp thành **8 milestone** (thay vì review sau từng bước cực nhỏ) — mỗi milestone là 1 nhóm việc liên quan, generate xong 1 milestone thì dừng lại để review trước khi sang milestone kế tiếp.

| Milestone | Nội dung | Kết quả kiểm chứng được |
|---|---|---|
| **M1 — Tooling & Skeleton** | `package.json`, Git, `.gitignore`/`.dockerignore`/`.editorconfig`, `tsconfig.json`, folder skeleton rỗng, ESLint + `eslint-plugin-boundaries` + Prettier + Husky + lint-staged | `npx tsc --noEmit` và `npm run lint` chạy sạch trên project rỗng |
| **M2 — Configuration & Logging** | `env.config.ts` (Zod fail-fast), `.env.example`, Pino logger (`pino.logger.ts`) | Thiếu biến bắt buộc → app throw ngay; `logger.info(...)` in pretty log ở terminal |
| **M3 — Error Kernel** | `app-error.ts`, `error-codes.ts`, `problem-details.ts`, `async-handler.ts` | Unit test: throw `NotFoundError` → đúng `statusCode`/`errorCode`/format RFC7807 |
| **M4 — Express Bootstrap** | `app.ts`, `server.ts`, `request-id.middleware.ts`, `error-handler.middleware.ts` (helmet/cors/compression/cookie-parser/pino-http lắp đủ) | `npm run dev`, `curl localhost:3000/anything` trả 404 JSON đúng RFC7807 |
| **M5 — Health Module & Prisma** | `health.controller.ts`/`health.routes.ts` (3 endpoint), `schema.prisma` (3 schema rỗng), `prisma-client.ts`, `/health`+`/ready` check DB qua Prisma | `npx prisma migrate dev` tạo 3 schema thành công; `curl /live`→200, `curl /health`→200 khi DB up / lỗi rõ khi DB down |
| **M6 — Docker** | `Dockerfile` (multi-stage, `node:22-alpine`), `docker-compose.yml` + `docker-compose.prod.yml` (`restart: unless-stopped`), `.dockerignore` | `docker compose up` chạy cả `app`+`postgres`, `/health` trả 200 qua container |
| **M7 — Testing** | `vitest.config.ts`, `tests/setup/vitest.setup.ts`, `tests/api/health.api.test.ts` | `npm run test` pass |
| **M8 — OpenAPI, Composition Root, CI & Finalize** | `generate-openapi.ts` + mount `/docs`, `composition-root.ts` skeleton, `.github/workflows/ci.yml`, hoàn thiện `package.json` scripts + README Quickstart | `npm run generate:openapi` sinh file, `/docs` hiển thị Swagger; CI (lint→test→build) xanh; `npm install && docker compose up && npm run dev` chạy mượt từ máy sạch (Sprint Goal) |

**`package.json` scripts (hoàn chỉnh ở M8):**
```
dev, build, start, test, test:watch, lint, lint:fix, format, format:check,
prisma:generate, prisma:migrate, prisma:studio, generate:openapi
```

---

## 6. Implementation Notes

| Ghi nhận | Diễn giải |
|---|---|
| **Health Module không có trong danh sách module ở Project Architecture Spec Mục 3** | Không phải mâu thuẫn — chỉ là khoảng trống hợp lý (Health Check là hạ tầng, không phải Bounded Context). Đã tự quyết định vị trí đặt file ở Mục 3.7 kèm rationale, không sửa tài liệu nguồn nào |
| **`dotenv` chưa được liệt kê tường minh ở 8 tài liệu trước** | Project Architecture Spec Mục 13 chỉ mô tả hành vi ("đọc từ biến môi trường"), không chỉ định cách load `.env` cụ thể — theo nguyên tắc "default implementation, không phải ràng buộc kiến trúc" (Backend Implementation Guide), `dotenv` là lựa chọn hợp lý, không phải quyết định kiến trúc mới |
| **`tsx` thay vì `ts-node-dev`** | Project Architecture Spec Mục 18.1 chỉ nói "hot-reload qua `ts-node-dev`/`tsx watch`" — đã liệt kê cả 2 làm ví dụ ngang hàng, Sprint 0 chọn `tsx` (nhanh hơn, ESM-native) — vẫn trong phạm vi lựa chọn đã gợi ý, không phải quyết định mới ngoài phạm vi |
| **Module system: Native ESM (`NodeNext`), không phải CommonJS** | Không tài liệu nào trong 8 tài liệu nguồn chỉ định module system cụ thể — đây là chi tiết implementation cần quyết định ở Sprint 0. **Đã xác nhận (12/07/2026): dùng ESM.** Đã cập nhật `package.json`("type": "module")/`tsconfig.json` (`module`/`moduleResolution`: `NodeNext`) và bổ sung quy tắc mới vào Coding Standards & Conventions v1.1 Mục 15.1 (mọi relative import bắt buộc đuôi `.js`). Đã verify: `tsc` tự động enforce quy tắc này (báo lỗi `TS2835` nếu thiếu `.js`), `tsx` chạy đúng, `@prisma/client` có `exports` map hỗ trợ cả `import`/`require` nên tương thích ESM hoàn toàn |

---

## Xác nhận đã nhận (11/07/2026)

- ✅ Folder Structure, Manual DI, Health Module, Prisma Multi-Schema — giữ nguyên như đề xuất.
- ✅ Bổ sung `cross-env`, xác nhận `@types/cookie-parser` đã có sẵn trong danh sách.
- ✅ Docker Compose thêm `restart: unless-stopped`.
- ✅ Roadmap gộp thành **8 milestone**, generate xong 1 milestone thì dừng review.
- ✅ Node.js **22.18.0** → Dockerfile dùng `node:22-alpine`, `package.json.engines.node` ghi `>=22.18.0`.

**Bắt đầu generate code từ M1 — Tooling & Skeleton.**
