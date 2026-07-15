# Project Architecture Specification
## AstroViet Platform — Backend Architecture (Node.js / TypeScript)

| | |
|---|---|
| **Loại tài liệu** | Project Architecture Specification |
| **Phiên bản** | 1.1 — đã cập nhật theo phản hồi Product Owner ngày 11/07/2026 (chốt 5 Open Questions, xem Mục 22) |
| **Ngày soạn** | 11/07/2026 (khởi tạo) — cập nhật 11/07/2026 |
| **Tác giả** | Principal Software Architect / Backend Tech Lead / Solution Architect |
| **Tài liệu nguồn (Single Source of Truth)** | 1. PRD v1.0 · 2. Astrology Domain Specification v1.0 · 3. Astrology Engine Specification v1.0 · 4. REST API Specification v1.1 · 5. Database Design Specification v1.1 |
| **Nguyên tắc kế thừa** | Không thay đổi Business Rules, Domain Model, Database Schema, REST API Contract. Mâu thuẫn/khoảng trống ghi ở **Mục 22 — Open Questions & Inconsistencies**; toàn bộ mục trong lần cập nhật này đã được Product Owner chốt quyết định |

> **Phạm vi tài liệu:** Đây không phải hướng dẫn viết code — đây là bản thiết kế kiến trúc backend hoàn chỉnh, đủ chi tiết để Backend Developer implement mà không cần hỏi lại Architect.

**Tech Stack đã chốt:** Node.js · Express.js · TypeScript · PostgreSQL · Prisma ORM · JWT (Access + Refresh, HttpOnly Cookie) · Zod · Pino · Vitest · Docker/Docker Compose · OpenAPI/Swagger · Linux VPS + Nginx + PM2/Docker Compose.

---

## Mục lục

1. [Architecture Overview](#1-architecture-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Module Architecture](#3-module-architecture)
4. [Layer Architecture](#4-layer-architecture)
5. [Folder Structure](#5-folder-structure)
6. [Dependency Rules](#6-dependency-rules)
7. [Request Lifecycle](#7-request-lifecycle)
8. [Module Communication](#8-module-communication)
9. [Error Handling Strategy](#9-error-handling-strategy)
10. [Validation Strategy](#10-validation-strategy)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [External Service Integration](#12-external-service-integration)
13. [Configuration Management](#13-configuration-management)
14. [Logging & Observability](#14-logging--observability)
15. [Security Architecture](#15-security-architecture)
16. [Performance Strategy](#16-performance-strategy)
17. [Testing Strategy](#17-testing-strategy)
18. [Deployment Architecture](#18-deployment-architecture)
19. [Coding Standards](#19-coding-standards)
20. [Future Scalability](#20-future-scalability)
21. [Architecture Decision Records (ADR)](#21-architecture-decision-records-adr)
22. [Open Questions & Inconsistencies](#22-open-questions--inconsistencies)

---

## 1. Architecture Overview

### 1.1 Mục tiêu
Định nghĩa kiến trúc backend Node.js hiện thực hóa đầy đủ 5 tài liệu nguồn — biến Domain Model (Domain Spec), Engine Workflow (Engine Spec), HTTP Contract (REST API Spec) và Schema (DB Spec) thành 1 codebase có tổ chức rõ ràng, dễ bảo trì bởi **1 developer** trong timeline **3-4 tháng** (PRD Mục 8), đồng thời đủ vững chắc để mở rộng khi sản phẩm phát triển.

### 1.2 Design Principles

| Nguyên tắc | Áp dụng |
|---|---|
| **Clean Architecture / Hexagonal** | Domain logic (business rules chiêm tinh) độc lập hoàn toàn với framework (Express), DB (Prisma/Postgres), và external service (Swiss Ephemeris) — các thành phần này chỉ là "chi tiết implementation" cắm vào qua interface |
| **Domain-Driven Design (DDD)** | Codebase chia theo **Bounded Context** khớp 1-1 với domain đã xác lập ở Database Design Spec Mục 3 (`identity`, `astrology`, `content`) — không chia theo layer kỹ thuật ở cấp cao nhất (tránh kiểu tổ chức "tất cả controller 1 chỗ, tất cả service 1 chỗ" gây khó bảo trì khi hệ thống lớn dần) |
| **Layered Architecture trong từng module** | Mỗi module tự có đủ 4 layer: Presentation → Application → Domain → Infrastructure |
| **Dependency Inversion** | Domain/Application layer định nghĩa **interface** (port), Infrastructure layer **implement** (adapter) — layer trong không bao giờ import trực tiếp từ layer ngoài |
| **SOLID** | Đặc biệt nhấn Single Responsibility (1 Use Case = 1 hành vi nghiệp vụ) và Interface Segregation (Repository interface nhỏ, đúng nhu cầu từng Use Case) |
| **Không MVC truyền thống** | Không có khái niệm "Controller béo" chứa business logic — Controller chỉ chuyển đổi HTTP ↔ Use Case, không tự quyết định nghiệp vụ |
| **Modular Monolith (không Microservices)** | Xem Mục 1.4 |

### 1.3 Kiến trúc tổng thể (tóm tắt)
1 Node.js process duy nhất, chứa nhiều **module nghiệp vụ độc lập** (Identity, BirthProfile, Chart, Article, Location, ReferenceData), mỗi module tự tổ chức theo Clean Architecture 4 layer, giao tiếp với nhau qua **Application-layer interface công khai** (không bao giờ đi thẳng vào Repository/DB của module khác) — xem chi tiết Mục 3 và 8.

### 1.4 Vì sao chọn Monolith Modular (không Microservices)

| Yếu tố | Phân tích |
|---|---|
| Quy mô đội ngũ | **1 developer** (PRD Mục 1) — Microservices đòi hỏi vận hành nhiều service, nhiều pipeline deploy, service discovery, distributed tracing... chi phí vận hành vượt xa lợi ích với 1 người |
| Timeline | 3-4 tháng (PRD Mục 8) — không đủ thời gian dựng hạ tầng Microservices mà vẫn giao được tính năng lõi đúng hạn |
| Ranh giới domain đã rõ | DB Design Spec Mục 3 đã tách 3 schema (`identity`/`astrology`/`content`) với nguyên tắc phụ thuộc 1 chiều rõ ràng — **Modular Monolith tận dụng được ranh giới này ngay hôm nay**, và **là bước đệm tự nhiên để tách Microservices sau này** nếu cần (mỗi module đã độc lập về code, chỉ cần tách deploy) |
| Tính chất bài toán | Astrology Engine (Engine Spec) là **stateless, deterministic, không cần scale độc lập** phức tạp — không có động lực kỹ thuật mạnh để tách thành service riêng ở quy mô MVP |

**Trade-off chấp nhận:**
- **Được:** Deploy đơn giản (1 process), transaction xuyên module dễ dàng hơn (dù ta cố tránh — xem Mục 8), debug/test nhanh hơn, chi phí hạ tầng thấp.
- **Đánh đổi:** Không scale từng module độc lập (ví dụ Chart tính toán nặng CPU nhưng Article nhẹ — cả 2 cùng scale theo 1 process); 1 module lỗi nặng (ví dụ leak memory) có thể ảnh hưởng toàn hệ thống; đòi hỏi kỷ luật code để không phá vỡ ranh giới module theo thời gian (không có "network boundary" ép buộc như Microservices).

---

## 2. High-Level Architecture

```
┌──────────────┐
│   Browser      │
└──────┬───────┘
       │ HTTPS
       ▼
┌──────────────┐
│ Frontend (React) │   (ngoài phạm vi tài liệu này — chỉ tiêu thụ REST API)
└──────┬───────┘
       │ HTTPS (REST API Spec v1.1 — JSON, RFC7807)
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy + TLS termination)             │
└──────────────────────────────┬──────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Node.js Process (PM2/Docker)                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     REST API (Express.js)                        │  │
│  │   Middleware: Helmet, CORS, Rate Limiter, Request ID, Auth        │  │
│  └───────────────────────────────┬─────────────────────────────────┘  │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Presentation Layer (Controller, Zod Schema)          │  │
│  └───────────────────────────────┬─────────────────────────────────┘  │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Application Layer (Use Case, DTO Mapper)             │  │
│  └───────────────────────────────┬─────────────────────────────────┘  │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │        Domain Layer (Entity, Business Rule, Astrology Engine)     │  │
│  │        [framework-independent — Engine Spec Mục 1-9]              │  │
│  └───────────────────────────────┬─────────────────────────────────┘  │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Infrastructure Layer (Prisma Repository, Adapter cho external)   │  │
│  └──┬──────────────┬──────────────┬──────────────┬─────────────────┘  │
└─────┼──────────────┼──────────────┼──────────────┼──────────────────┘
      ▼               ▼               ▼               ▼
┌───────────┐ ┌────────────────┐ ┌───────────────┐ ┌────────────────────┐
│ PostgreSQL   │ │ Swiss Ephemeris  │ │ AI Interpretation │ │ External Geocoding    │
│ (Prisma)      │ │ (swisseph-wasm)   │ │ Provider (future)  │ │ Provider (Google/OSM)   │
└───────────┘ └────────────────┘ └───────────────┘ └────────────────────┘
```

### 2.1 Giải thích Dependency giữa các thành phần

| Từ | Đến | Loại phụ thuộc |
|---|---|---|
| Frontend | REST API | HTTP/JSON, tuân theo REST API Spec v1.1 tuyệt đối — Frontend không biết gì về cấu trúc backend bên trong |
| Presentation Layer | Application Layer | Gọi trực tiếp (in-process function call), không qua network |
| Application Layer | Domain Layer | Gọi trực tiếp — Domain Layer chứa Astrology Engine (Engine Spec) và business entity |
| Domain Layer | Infrastructure Layer | **KHÔNG BAO GIỜ** — hướng phụ thuộc luôn từ ngoài vào trong (Dependency Inversion, xem Mục 6) |
| Infrastructure Layer | PostgreSQL / Swiss Ephemeris / Geocoding / AI | Adapter cụ thể, implement interface do Domain/Application định nghĩa |
| Domain Layer (Chart) | Domain Layer (BirthProfile) | **KHÔNG trực tiếp** — chỉ qua Application-layer interface công khai của module BirthProfile (xem Mục 8) |

---

## 3. Module Architecture

> Ranh giới module bám sát Database Design Spec Mục 3 (schema `identity`/`astrology`/`content`) và REST API Spec Mục 3 (API Resources), **không tự tạo ranh giới mới**.

| Module | Responsibility | Aggregate Root |
|---|---|---|
| **Identity** | Đăng ký/đăng nhập, JWT + Refresh Token, UserPreferences — **module độc lập hoàn toàn** (DB Spec Quyết định 14.1) | `User` |
| **BirthProfile** | CRUD hồ sơ sinh đã lưu (BirthData + BirthLocation) | `BirthProfile` |
| **Chart** | **Module lõi** — chứa Astrology Engine (Engine Spec), tính toán + lưu Chart, tra cứu Interpretation Content Bank theo version pinning (DB Spec Quyết định 14.2) | `Chart` |
| **Article** | Thư viện kiến thức chiêm tinh (CRUD công khai + Admin) | `Article` |
| **Location** | Proxy tra cứu địa danh → tọa độ + timezone lịch sử (Geocoding provider ngoài) | *(không có aggregate — stateless proxy)* |
| **ReferenceData** | Danh sách `HouseSystem`, `Language` — dữ liệu tĩnh dùng chung bởi Identity (preferences) và Chart (house system) | *(lookup, không phải aggregate nghiệp vụ)* |
| **Shared/Kernel** | Không phải "module nghiệp vụ" — chứa cross-cutting: base error class, logger, Result type, base Zod schema, middleware dùng chung | — |

### 3.1 Identity

| | |
|---|---|
| **Public API (Application layer)** | `AuthService.register()`, `.login()`, `.refresh()`, `.logout()`; `UserService.getMe()`, `.updateMe()`; `UserPreferencesService.get()`, `.update()` |
| **Internal Components** | `User` entity, `RefreshToken` entity, `UserPreferences` entity, `PasswordHasher` (port), `TokenService` (port) |
| **Dependency** | **Không phụ thuộc module nào khác** — đúng nguyên tắc "module độc lập" đã xác nhận ở DB Spec 14.1 |
| **Aggregate Root** | `User` (bao gồm `RefreshToken[]` và `UserPreferences` như một phần vòng đời) |

### 3.2 BirthProfile

| | |
|---|---|
| **Public API** | `BirthProfileService.create()`, `.list()`, `.getById()`, `.update()`, `.delete()`, và **`getSnapshotData(id): BirthDataSnapshot`** — hàm nội bộ cross-module dùng bởi Chart module (xem Mục 8) |
| **Internal Components** | `BirthProfile` entity, `BirthLocation` value object |
| **Dependency** | Identity (chỉ `userId` — ownership check, không truy vấn sâu vào Identity) |
| **Aggregate Root** | `BirthProfile` |

### 3.3 Chart (module lõi)

| | |
|---|---|
| **Public API** | `ChartService.createNatalChart()`, `.getById()`, `.list()`, `.delete()` |
| **Internal Components** | `Chart` (aggregate root) + `Planet`/`House`/`Angle`/`Aspect`/`Pattern` (entity con); **toàn bộ 11 module của Astrology Engine** (Engine Spec Mục 6) sống trong `domain/engine/` của module này — xem Mục 3.3.1; `InterpretationLookupService` (Application layer, thực hiện version-pinned JOIN theo DB Spec 14.2) |
| **Dependency** | BirthProfile (đọc snapshot khi có `birthProfileId`), ReferenceData (validate `houseSystem`) |
| **Aggregate Root** | `Chart` |

**3.3.1 Vị trí Astrology Engine trong kiến trúc:** Toàn bộ 11 module của Engine Spec (Validation, Swiss Adapter, Planet/House/Angle/Aspect/Pattern/Element/Modality Calculator, Chart Builder, Interpretation Engine) được **port nguyên trạng** vào module `Chart`, tách theo đúng ranh giới Clean Architecture:

| Engine Spec Module | Vị trí trong kiến trúc Node.js | Lý do |
|---|---|---|
| Validation Module | `chart/domain/engine/validation/` | Pure logic, không phụ thuộc gì — Domain layer |
| Planet/House/Angle/Aspect/Pattern/Element/Modality Calculator | `chart/domain/engine/calculators/` | **Pure function, deterministic** (Engine Spec Mục 2) — đúng bản chất Domain layer, test được 100% mà không cần mock gì |
| Chart Builder | `chart/domain/engine/chart-builder.ts` | Domain Service điều phối các Calculator — vẫn là Domain layer vì chỉ gọi các pure function khác, không I/O |
| Swiss Adapter | `chart/infrastructure/adapters/swiss-ephemeris.adapter.ts` | **Infrastructure layer** — bọc thư viện `swisseph-wasm` (I/O thực sự: đọc file ephemeris data), implement interface `IEphemerisProvider` định nghĩa ở Domain |
| Interpretation Engine | `chart/application/services/interpretation-lookup.service.ts` | **Application layer**, không phải Domain — vì cần I/O (query `interpretation_contents` qua Repository), không phải pure calculation |

### 3.4 Article

| | |
|---|---|
| **Public API** | `ArticleService.list()`, `.getBySlug()`, `.create()`, `.update()`, `.delete()` |
| **Internal Components** | `Article` entity |
| **Dependency** | Identity (chỉ `authorId`) |
| **Aggregate Root** | `Article` |

### 3.5 Location

| | |
|---|---|
| **Public API** | `LocationService.search(query, date): LocationSuggestion[]` |
| **Internal Components** | `IGeocodingProvider` (port), cache wrapper (Redis khi có, xem Mục 12) |
| **Dependency** | Không phụ thuộc module nghiệp vụ nào — thuần proxy |
| **Aggregate Root** | *(không có — không có state persist ở MVP, theo DB Spec Quyết định 14.3)* |

### 3.6 ReferenceData

| | |
|---|---|
| **Public API** | `HouseSystemService.list()`, `.isSupported(name)`; `LanguageService.list()`, `.isSupported(code)` |
| **Internal Components** | Đọc thẳng từ bảng seed `house_systems`/`languages`, cache in-memory (dữ liệu gần như tĩnh) |
| **Dependency** | Không phụ thuộc module nào |
| **Aggregate Root** | *(lookup thuần túy)* |

---

## 4. Layer Architecture

| Layer | Nhiệm vụ | Được phép phụ thuộc vào | KHÔNG được phụ thuộc vào |
|---|---|---|---|
| **Presentation** | Route, Controller, Zod Schema (request/response DTO), middleware gắn route | Application Layer | Domain Layer trực tiếp, Infrastructure Layer, Prisma, thư viện HTTP-specific khác ngoài Express |
| **Application** | Use Case (1 class/function = 1 hành vi nghiệp vụ từ REST API Spec Mục 4), orchestrate Domain + Repository, transaction boundary | Domain Layer, Repository **interface** (không phải implementation) | Express (`req`/`res`), Prisma Client trực tiếp, HTTP status code |
| **Domain** | Entity, Value Object, Business Rule, Astrology Engine (pure), Repository **interface** definition | *(không phụ thuộc layer nào khác — đây là "trung tâm" của Clean Architecture)* | Application, Infrastructure, Express, Prisma — **tuyệt đối không import bất kỳ thứ gì từ 2 layer ngoài** |
| **Infrastructure** | Prisma Repository implementation, external adapter (Swiss Ephemeris, Geocoding, JWT lib, bcrypt) | Domain Layer (để implement interface), thư viện bên thứ ba | Presentation Layer |
| **Shared/Kernel** | Base class dùng chung (`AppError`, `Result<T>`), logger instance, config loader, common Zod primitive | *(không phụ thuộc module nghiệp vụ nào)* | Bất kỳ module nghiệp vụ cụ thể nào (Identity, Chart...) — Shared phải trung lập tuyệt đối |

### Ví dụ code minh họa hướng phụ thuộc đúng

```typescript
// domain/engine/calculators/aspect-calculator.ts  (Domain Layer — Chart module)
// KHÔNG import Express, Prisma, hay bất kỳ thứ gì ngoài Domain
export function calculateAspects(planets: Planet[], orbConfig: OrbConfiguration): Aspect[] {
  // pure function — cùng input luôn ra cùng output (Engine Spec: Deterministic)
  ...
}

// domain/ports/chart-repository.port.ts  (Domain Layer định nghĩa INTERFACE)
export interface IChartRepository {
  save(chart: Chart): Promise<Chart>;
  findById(id: string, userId: string): Promise<Chart | null>;
}

// infrastructure/repositories/prisma-chart.repository.ts  (Infrastructure Layer IMPLEMENT)
import { PrismaClient } from '@prisma/client';
import { IChartRepository } from '../../domain/ports/chart-repository.port';

export class PrismaChartRepository implements IChartRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async save(chart: Chart): Promise<Chart> { /* Prisma transaction — xem Mục 7 */ }
  async findById(id: string, userId: string): Promise<Chart | null> { /* ... */ }
}

// application/use-cases/create-natal-chart.usecase.ts  (Application Layer)
export class CreateNatalChartUseCase {
  constructor(
    private readonly chartRepo: IChartRepository,           // interface, không phải Prisma trực tiếp
    private readonly ephemerisProvider: IEphemerisProvider, // interface
    private readonly birthProfileService: IBirthProfileQueryService, // cross-module qua Application interface
  ) {}
  async execute(input: CreateNatalChartInput): Promise<Chart> { /* orchestrate */ }
}

// presentation/controllers/chart.controller.ts  (Presentation Layer)
export class ChartController {
  constructor(private readonly createNatalChartUseCase: CreateNatalChartUseCase) {}
  async createNatalChart(req: Request, res: Response, next: NextFunction) {
    // KHÔNG có business logic ở đây — chỉ parse request đã Zod-validate và gọi Use Case
    const result = await this.createNatalChartUseCase.execute(req.body);
    res.status(201).json(toChartResponseDto(result));
  }
}
```

---

## 5. Folder Structure

```
src/
├── config/                          # Load & validate .env (Zod schema cho config — xem Mục 13)
│   └── env.config.ts
├── shared/                          # Kernel — trung lập, không phụ thuộc module nghiệp vụ nào
│   ├── errors/
│   │   ├── app-error.ts             # Base class: DomainError, ValidationError, InfrastructureError...
│   │   └── error-codes.ts
│   ├── http/
│   │   ├── problem-details.ts       # RFC7807 formatter (REST API Spec Mục 7)
│   │   └── pagination.ts            # PaginationResponse<T> helper (REST API Spec Mục 8)
│   ├── logger/
│   │   └── pino.logger.ts
│   ├── middlewares/                 # Middleware dùng chung nhiều module
│   │   ├── request-id.middleware.ts
│   │   ├── auth.middleware.ts       # JWT verify — dùng chung mọi module cần Auth
│   │   ├── rate-limit.middleware.ts
│   │   └── error-handler.middleware.ts
│   └── zod/
│       └── common-schemas.ts        # ISO date, UUID, pagination query...
│
├── modules/
│   ├── identity/
│   │   ├── domain/
│   │   │   ├── entities/ (user.entity.ts, refresh-token.entity.ts, user-preferences.entity.ts)
│   │   │   ├── ports/ (user-repository.port.ts, password-hasher.port.ts, token-service.port.ts)
│   │   │   └── errors/ (invalid-credentials.error.ts, email-already-exists.error.ts)
│   │   ├── application/
│   │   │   ├── use-cases/ (register-user.usecase.ts, login-user.usecase.ts, refresh-token.usecase.ts, logout-user.usecase.ts, update-preferences.usecase.ts)
│   │   │   └── services/ (auth.service.ts — public API cho module khác nếu cần, ví dụ verify token)
│   │   ├── infrastructure/
│   │   │   ├── repositories/ (prisma-user.repository.ts, prisma-refresh-token.repository.ts)
│   │   │   └── adapters/ (bcrypt-password-hasher.adapter.ts, jwt-token.adapter.ts)
│   │   ├── presentation/
│   │   │   ├── controllers/ (auth.controller.ts, user.controller.ts)
│   │   │   ├── routes/ (auth.routes.ts, user.routes.ts)
│   │   │   └── schemas/ (register.schema.ts, login.schema.ts — Zod)
│   │   └── index.ts                 # BARREL — public API duy nhất module này export ra ngoài
│   │
│   ├── birth-profile/
│   │   ├── domain/ (entities, ports)
│   │   ├── application/ (use-cases, services — bao gồm getSnapshotData cho Chart module)
│   │   ├── infrastructure/ (prisma-birth-profile.repository.ts)
│   │   ├── presentation/ (controllers, routes, schemas)
│   │   └── index.ts
│   │
│   ├── chart/                       # Module lõi — chứa Astrology Engine
│   │   ├── domain/
│   │   │   ├── entities/ (chart.entity.ts, planet.entity.ts, house.entity.ts, angle.entity.ts, aspect.entity.ts, pattern.entity.ts)
│   │   │   ├── engine/              # Astrology Engine — port trực tiếp từ Engine Spec Mục 6
│   │   │   │   ├── validation/ (validate-birth-data.ts)
│   │   │   │   ├── calculators/ (planet-calculator.ts, house-calculator.ts, angle-calculator.ts, aspect-calculator.ts, pattern-calculator.ts, element-calculator.ts, modality-calculator.ts)
│   │   │   │   └── chart-builder.ts
│   │   │   ├── ports/ (chart-repository.port.ts, ephemeris-provider.port.ts, timezone-provider.port.ts, interpretation-content-repository.port.ts)
│   │   │   └── errors/ (ephemeris-provider.error.ts, house-system-not-converging.error.ts — mềm, xem Mục 9)
│   │   ├── application/
│   │   │   ├── use-cases/ (create-natal-chart.usecase.ts, get-chart.usecase.ts, list-charts.usecase.ts, delete-chart.usecase.ts)
│   │   │   └── services/ (interpretation-lookup.service.ts — Engine Spec 6.11, thực hiện version-pinned JOIN theo DB Spec 14.2)
│   │   ├── infrastructure/
│   │   │   ├── repositories/ (prisma-chart.repository.ts, prisma-interpretation-content.repository.ts)
│   │   │   └── adapters/ (swiss-ephemeris.adapter.ts, iana-timezone.adapter.ts)
│   │   ├── presentation/ (controllers, routes, schemas)
│   │   └── index.ts
│   │
│   ├── article/
│   │   ├── domain/ · application/ · infrastructure/ · presentation/
│   │   └── index.ts
│   │
│   ├── location/
│   │   ├── domain/ (ports: geocoding-provider.port.ts)
│   │   ├── application/ (services: location.service.ts)
│   │   ├── infrastructure/ (adapters: google-geocoding.adapter.ts hoặc nominatim.adapter.ts; cache: redis-location-cache.adapter.ts)
│   │   ├── presentation/
│   │   └── index.ts
│   │
│   └── reference-data/
│       ├── application/ (services: house-system.service.ts, language.service.ts)
│       ├── infrastructure/ (repositories: prisma-reference-data.repository.ts)
│       ├── presentation/
│       └── index.ts
│
├── app.ts                           # Lắp ráp Express app: middleware toàn cục, mount routes từng module
├── server.ts                        # Entry point — khởi động HTTP server, đọc PORT từ config
└── composition-root.ts              # Dependency Injection thủ công — khởi tạo toàn bộ Repository/Service/UseCase, wire vào Controller (xem Design Rationale bên dưới)
```

**Design Rationale — vì sao mỗi module có `index.ts` (barrel) riêng và vì sao có `composition-root.ts`:**
- `index.ts` của mỗi module chỉ export **đúng những gì module khác được phép dùng** (thường là 1-2 Application Service, không export Entity/Repository nội bộ) — đây là cơ chế kỹ thuật (ESLint rule + barrel) để **enforce Mục 8 (Module Communication)** ở cấp độ code, không chỉ ở cấp độ tài liệu.
- `composition-root.ts` là **nơi duy nhất trong toàn bộ codebase** biết cách khởi tạo cụ thể (Prisma Client, JWT secret, bcrypt...) và "tiêm" (inject) chúng vào Use Case qua constructor — không dùng DI framework nặng (ví dụ NestJS/InversifyJS) vì quy mô 1 dev không cần thêm độ phức tạp đó; Manual Constructor Injection là đủ và dễ debug hơn.

---

## 6. Dependency Rules

```
┌────────────┐
│ Controller   │  (Presentation)
└──────┬─────┘
       │ gọi
       ▼
┌────────────┐
│  Use Case    │  (Application)
└──────┬─────┘
       │ gọi qua INTERFACE
       ▼
┌──────────────────────┐
│ Repository Interface    │  (Domain — chỉ định nghĩa "port", không biết Prisma là gì)
└──────────┬────────────┘
            │ được implement bởi
            ▼
┌──────────────────────────┐
│ Repository Implementation   │  (Infrastructure — biết Prisma, biết SQL)
└──────────────────────────┘
```

**Quy tắc tuyệt đối: KHÔNG được dependency ngược** — `Repository Implementation` không bao giờ được gọi ngược lại `Use Case`; `Domain` không bao giờ `import` bất cứ thứ gì từ `Infrastructure` hay `Presentation`.

**Dependency Inversion Principle áp dụng cụ thể:** Domain Layer (trong cùng) định nghĩa **interface** nó cần (`IChartRepository`, `IEphemerisProvider`) — đây là ngôn ngữ của riêng Domain, không nhắc gì đến Prisma/swisseph-wasm. Infrastructure Layer (ngoài cùng) mới là nơi **biết** cách hiện thực hóa interface đó bằng công nghệ cụ thể. Điều này đảo ngược hướng phụ thuộc "tự nhiên" (thường code gọi thẳng thư viện) — do đó gọi là **Dependency *Inversion***. Lợi ích thực tế cho dự án này: có thể thay `swisseph-wasm` bằng 1 thư viện ephemeris khác trong tương lai (Engine Spec Mục 7 Design Decision đã dự trù điều này) mà **không sửa một dòng nào** ở Domain/Application layer.

**Enforcement bằng công cụ:** Khuyến nghị dùng ESLint rule `import/no-restricted-paths` (hoặc `eslint-plugin-boundaries`) để **chặn cứng ở CI** việc `domain/**` import từ `infrastructure/**` hoặc `presentation/**` — không chỉ dựa vào kỷ luật code review (quan trọng vì chỉ có 1 dev, không có code review chéo tự nhiên).

---

## 7. Request Lifecycle

### 7.1 Sơ đồ tổng quát

```
HTTP Request
   │
   ▼
[1] Middleware toàn cục: Helmet → CORS → Request ID → Pino HTTP logger
   │
   ▼
[2] Middleware Rate Limiter (theo Rate Limit Policy — REST API Spec Mục 9)
   │
   ▼
[3] Middleware Auth (JWT verify, optional tùy route — gắn req.user nếu có token hợp lệ)
   │
   ▼
[4] Express Router khớp route → Middleware Zod Validation (parse & validate req.body/query/params)
   │      │
   │      └─ Invalid → next(ValidationError) → nhảy thẳng tới [8] Error Handler
   ▼
[5] Controller (Presentation) — map request đã validate thành Use Case Input DTO
   │
   ▼
[6] Use Case (Application) — orchestrate:
   │    ├─ Kiểm tra Authorization (role, ownership — nếu Controller/Middleware chưa đủ)
   │    ├─ Gọi Domain Layer (Entity method, Astrology Engine nếu là Chart module)
   │    ├─ Gọi Repository Interface (đọc/ghi dữ liệu)
   │    └─ Mở Prisma Transaction nếu ghi nhiều bảng cùng lúc (ví dụ tạo Chart — xem 7.2)
   │
   ▼
[7] Repository Implementation (Infrastructure) → Prisma Client → PostgreSQL
   │
   ▼
   Use Case nhận kết quả → map thành Domain object trả về Controller
   │
   ▼
Controller map Domain object → Response DTO (đúng schema REST API Spec Mục 5) → res.json()
   │
   ▼
HTTP Response (200/201/204...)

   [Bất kỳ bước nào throw Error]
   │
   ▼
[8] Error Handler Middleware (toàn cục, cuối chuỗi middleware Express)
   │    ├─ Map AppError subclass → HTTP status + RFC7807 body (Mục 9)
   │    ├─ Log error (Pino, kèm Request ID)
   │    └─ res.status(...).json(problemDetails)
```

### 7.2 Transaction — ví dụ cụ thể `POST /charts/natal`

Đây là request phức tạp nhất hệ thống (ghi vào `charts` + `chart_planets` + `chart_houses` + `chart_angles` + `chart_aspects` + `chart_patterns` + `chart_pattern_planets` cùng lúc — DB Spec Mục 5.7–5.12), **bắt buộc dùng Prisma Interactive Transaction** để đảm bảo tính nguyên tử (atomic — hoặc toàn bộ Chart + các bảng con được ghi thành công, hoặc không ghi gì cả):

```typescript
// infrastructure/repositories/prisma-chart.repository.ts
async save(chart: Chart): Promise<Chart> {
  return this.prisma.$transaction(async (tx) => {
    const chartRow = await tx.chart.create({ data: mapChartToRow(chart) });
    await tx.chartPlanet.createMany({ data: chart.planets.map(p => mapPlanetToRow(p, chartRow.id)) });
    if (chart.isHouseDataAvailable) {
      await tx.chartHouse.createMany({ data: chart.houses.map(h => mapHouseToRow(h, chartRow.id)) });
      await tx.chartAngle.createMany({ data: chart.angles.map(a => mapAngleToRow(a, chartRow.id)) });
    }
    await tx.chartAspect.createMany({ data: chart.aspects.map(a => mapAspectToRow(a, chartRow.id)) });
    // Pattern + junction table chart_pattern_planets tương tự...
    return chartRow;
  });
}
```

### 7.3 Các mối quan tâm xuyên suốt lifecycle

| Mối quan tâm | Nơi xử lý | Ghi chú |
|---|---|---|
| **Authentication** | Middleware `auth.middleware.ts` (bước [3]) | Verify JWT, gắn `req.user = { id, role }`; route không cần auth (Guest-accessible) bỏ qua middleware này hoặc để nó "optional" (không lỗi nếu thiếu token) |
| **Authorization** | Kết hợp middleware (role-based, ví dụ `requireAdmin`) + Use Case (ownership-based, ví dụ "chỉ chủ sở hữu Chart mới xem được") | Role check ở middleware (rẻ, sớm); ownership check bắt buộc ở Use Case vì cần query DB để biết `chart.userId` |
| **Logging** | Pino HTTP logger (bước [1], tự động) + log thủ công ở Use Case cho sự kiện nghiệp vụ quan trọng | Mục 14 |
| **Error Handling** | Error Handler Middleware tập trung (bước [8]) — **Controller/Use Case không tự viết `res.status().json()` cho lỗi**, chỉ `throw` đúng loại `AppError` | Mục 9 |
| **Transaction** | Application Layer (Use Case) quyết định ranh giới transaction, Infrastructure Layer (Repository) thực thi | Chỉ Use Case biết "hành vi nghiệp vụ nào cần atomic" — Repository không tự ý mở transaction ngoài phạm vi được yêu cầu |

---

## 8. Module Communication

| Quy tắc | Chi tiết |
|---|---|
| **Không bao giờ import trực tiếp Repository/Entity nội bộ của module khác** | Ví dụ: `chart/application/use-cases/create-natal-chart.usecase.ts` **không được** `import { PrismaBirthProfileRepository } from '../../birth-profile/infrastructure/...'` |
| **Giao tiếp chéo module CHỈ qua Application-layer interface công khai (barrel `index.ts`)** | `chart` module gọi `birthProfileModule.getSnapshotData(id)` — 1 hàm được `birth-profile/index.ts` export tường minh, ẩn toàn bộ chi tiết bên trong |
| **Không gọi chéo Presentation/Domain layer giữa các module** | Chart Controller không bao giờ gọi thẳng BirthProfile Controller; Chart Domain Entity không import BirthProfile Domain Entity |
| **Hướng phụ thuộc giữa module phải theo đúng DB Spec Mục 3.3** | `astrology` (BirthProfile, Chart) phụ thuộc `identity`; `content` (Article) phụ thuộc `identity`; **`identity` và `content` không bao giờ phụ thuộc ngược lại `astrology`** — enforce bằng cùng ESLint rule ở Mục 6 |
| **Không có Event Bus / Message Queue ở MVP** | Modular Monolith ở quy mô này dùng **synchronous in-process call** qua interface là đủ — không cần domain event/pub-sub (over-engineering cho 1 dev/MVP); cân nhắc lại nếu tách Microservices trong tương lai (Mục 20) |

### 8.1 Bảng Module Dependency (ai gọi ai)

| Module | Gọi module nào (qua Application interface) | Bị gọi bởi |
|---|---|---|
| Identity | *(không gọi module nào)* | BirthProfile, Chart, Article (chỉ để lấy `userId`/ownership, không gọi Application Service thực sự — dùng chung `userId` đã có sẵn trong JWT payload) |
| BirthProfile | Identity (ownership check qua `userId`, không qua interface phức tạp) | Chart |
| Chart | BirthProfile (`getSnapshotData`), ReferenceData (`isSupported(houseSystem)`) | *(không module nào gọi Chart)* |
| Article | Identity (chỉ `authorId`) | *(không module nào gọi Article)* |
| Location | *(không gọi module nào — chỉ gọi external Geocoding Provider)* | *(Frontend gọi trực tiếp qua REST API — không có module khác trong backend cần gọi Location)* |
| ReferenceData | *(không gọi module nào)* | Identity (validate `defaultHouseSystem`/`preferredLanguage` khi update Preferences), Chart |

---

## 9. Error Handling Strategy

Ánh xạ trực tiếp bảng Error Handling ở REST API Spec Mục 7 — tài liệu này chỉ bổ sung **cách tổ chức code** để tạo ra đúng những response đó.

### 9.1 Phân loại lỗi (class hierarchy)

```typescript
// shared/errors/app-error.ts
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  constructor(message: string, public readonly details?: unknown) { super(message); }
}

export class ValidationError extends AppError {           // 400/422 — lỗi input (Zod hoặc business validation)
  readonly statusCode = 422;
  readonly errorCode: string;
  constructor(errorCode: string, message: string, details?: unknown) { super(message, details); this.errorCode = errorCode; }
}
export class AuthenticationError extends AppError {       // 401
  readonly statusCode = 401; readonly errorCode = 'UNAUTHORIZED';
}
export class AuthorizationError extends AppError {        // 403
  readonly statusCode = 403; readonly errorCode = 'FORBIDDEN';
}
export class NotFoundError extends AppError {              // 404
  readonly statusCode = 404; readonly errorCode = 'RESOURCE_NOT_FOUND';
}
export class ConflictError extends AppError {               // 409
  readonly statusCode = 409; readonly errorCode: string;
}
export class ExternalServiceError extends AppError {         // 500 (hoặc 503 nếu muốn phân biệt rõ hơn)
  readonly statusCode = 500; readonly errorCode = 'EXTERNAL_SERVICE_ERROR'; // ví dụ EphemerisProviderError, Geocoding failure
}
export class InfrastructureError extends AppError {           // 500 — lỗi DB, lỗi không lường trước
  readonly statusCode = 500; readonly errorCode = 'INTERNAL_SERVER_ERROR';
}
```

### 9.2 Bảng phân loại đầy đủ

| Loại lỗi | Class | Nguồn gốc | Ví dụ |
|---|---|---|---|
| **Business Error** | `ValidationError` (422) hoặc `ConflictError` (409) tùy tình huống | Domain/Application layer phát hiện vi phạm business rule | `EXACTLY_ONE_SOURCE_REQUIRED` (REST API Spec 5.4), `EMAIL_ALREADY_EXISTS` |
| **Validation Error** | `ValidationError` (400 nếu malformed / 422 nếu business validation) | Zod schema ở Presentation layer | Sai format email, thiếu field bắt buộc |
| **Infrastructure Error** | `InfrastructureError` (500) | Lỗi kết nối DB, lỗi Prisma không lường trước | Connection timeout |
| **External API Error** | `ExternalServiceError` (500) | Adapter ở Infrastructure layer (Swiss Ephemeris, Geocoding) | `EphemerisProviderError` (Engine Spec Mục 4.4) |
| **Authentication Error** | `AuthenticationError` (401) | Middleware Auth hoặc Use Case verify token | Token hết hạn, sai credentials |
| **Authorization Error** | `AuthorizationError` (403) | Middleware role-check hoặc Use Case ownership-check | User thường gọi endpoint Admin |

**Trường hợp đặc biệt — "lỗi mềm" (Warning, không phải Error):** `HouseSystemNotConvergingError` và `HISTORICAL_DATE` (REST API Spec Mục 7, 14.11/14.12) **không được throw như Error** — đây là dữ liệu hợp lệ kèm cảnh báo, xử lý bằng cách **trả về `warnings[]` trong kết quả Use Case**, không phải cơ chế exception. Đây là điểm rất quan trọng để tránh nhầm lẫn: pattern trong code phải phân biệt rõ 2 khái niệm khác nhau — Error (chặn request) vs. Warning (dữ liệu vẫn hợp lệ, đính kèm cảnh báo).

### 9.3 Error Response Format
Error Handler Middleware map `AppError` → RFC 7807 (đúng REST API Spec Mục 7), luôn kèm `instance` (route path) và Request ID để tra log:

```typescript
// shared/middlewares/error-handler.middleware.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const requestId = req.id;
  if (err instanceof AppError) {
    logger.warn({ requestId, errorCode: err.errorCode }, err.message);
    return res.status(err.statusCode).contentType('application/problem+json').json({
      type: `https://api.astroviet.vn/errors/${err.errorCode.toLowerCase()}`,
      title: err.errorCode,
      status: err.statusCode,
      detail: err.message,
      instance: req.originalUrl,
      errorCode: err.errorCode,
      errors: err.details,
    });
  }
  // Lỗi không lường trước — log FULL stack trace ở mức error, KHÔNG lộ chi tiết ra response
  logger.error({ requestId, err }, 'Unhandled error');
  return res.status(500).contentType('application/problem+json').json({
    type: 'https://api.astroviet.vn/errors/internal-server-error',
    title: 'Internal Server Error', status: 500, instance: req.originalUrl, errorCode: 'INTERNAL_SERVER_ERROR',
  });
}
```

---

## 10. Validation Strategy

| Tầng | Công cụ | Trách nhiệm | Ví dụ |
|---|---|---|---|
| **Client Validation** | *(Frontend — ngoài phạm vi backend)* | UX tức thời, không đáng tin cậy về bảo mật | — |
| **API Validation** | **Zod**, chạy ở Presentation Layer (middleware trước Controller) | Kiểm tra **format/type/range** đúng như bảng Validation Rules REST API Spec Mục 6 — hoàn toàn cơ học, không cần biết business context | `latitude` là số trong [-90,90]; `email` đúng regex |
| **Business Validation** | Domain/Application Layer (Astrology Engine's Validation Module cho Chart; Use Case logic cho các module khác) | Kiểm tra quy tắc **cần business context** mà Zod không thể biết | `isBirthTimeKnown=false` thì `birthTime` phải null (cần biết mối quan hệ 2 field); Placidus không hội tụ ở vĩ độ cực (cần chạy Engine mới biết) |
| **Database Constraint** | CHECK/UNIQUE/FK constraint (DB Design Spec Mục 5) | **Tuyến phòng thủ cuối cùng** — không phải nơi validate chính, chỉ bắt các trường hợp lọt qua 2 tầng trên do bug | Nếu Zod + Business Validation hoạt động đúng, DB constraint **hầu như không bao giờ** thực sự chặn được gì ở runtime bình thường |

### 10.1 Nguyên tắc "Không validate trùng lặp"

**Vấn đề cần tránh:** Viết lại y hệt logic `latitude BETWEEN -90 AND 90` ở cả Zod, cả Use Case, cả tự kiểm tra thủ công trước khi gọi Repository — vừa dư thừa vừa dễ lệch nhau khi sửa 1 chỗ quên chỗ khác.

**Quy tắc phân định rõ ràng:**
- **Nếu rule chỉ cần nhìn vào 1 field / cấu trúc dữ liệu (không cần business context, không cần query DB, không cần chạy Engine)** → **chỉ** viết ở Zod schema, Business Validation **không lặp lại**.
- **Nếu rule cần biết quan hệ giữa nhiều field, hoặc cần I/O (DB, Engine, external service)** → **chỉ** viết ở Domain/Application layer, Zod **không cố gắng** diễn đạt (Zod `refine()` có thể làm được 1 phần nhưng nên tránh nhồi business logic vào Presentation layer).
- **DB constraint luôn được giữ** (không bỏ) như tuyến phòng thủ cuối, nhưng **không phải nơi đầu tiên** trả lỗi cho người dùng — nếu code đúng, nó không bao giờ nên là nơi lỗi *đầu tiên* xuất hiện.

---

## 11. Authentication & Authorization

> Toàn bộ nội dung dưới đây ánh xạ trực tiếp REST API Spec Mục 2 (đã chốt version 1.1) — tài liệu này chỉ mô tả cách hiện thực hóa bằng code.

### 11.1 JWT Flow (implementation)

| Bước | Component chịu trách nhiệm |
|---|---|
| Cấp `accessToken`/`refreshToken` khi login | `identity/application/use-cases/login-user.usecase.ts` gọi `ITokenProvider.generateAccessToken()`/`generateRefreshToken()` (interface), implement cụ thể ở `identity/infrastructure/adapters/jwt-token.adapter.ts` (dùng thư viện `jsonwebtoken`) |
| Verify `accessToken` mỗi request | `shared/middlewares/auth.middleware.ts` — dùng chung `ITokenProvider.verifyAccessToken()`, gắn `req.user` |
| Refresh Token Rotation | `identity/application/use-cases/refresh-token.usecase.ts` — verify `refreshToken` cũ (`token_hash` trong DB), revoke, tạo mới, cập nhật `replaced_by_token_id` (DB Spec Mục 5.2) |

### 11.1.1 `ITokenProvider` — abstraction cho thuật toán ký JWT (Quyết định 22.4)

**Đã chốt: HS256 (symmetric) cho MVP** — đơn giản hơn RS256 và đủ dùng cho Modular Monolith 1 process (chỉ 1 service vừa ký vừa verify, không có lợi ích thực tế nào từ việc tách public/private key ở giai đoạn này). Để việc chuyển sang RS256 sau này (khi thực sự tách Microservices — Mục 20) **không ảnh hưởng Application Layer**, thuật toán ký được che giấu hoàn toàn sau interface:

```typescript
// identity/domain/ports/token-provider.port.ts
export interface TokenPayload { sub: string; role: 'user' | 'admin'; }

export interface ITokenProvider {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(): { rawToken: string; tokenHash: string; expiresAt: Date };
  verifyAccessToken(token: string): TokenPayload; // throw AuthenticationError nếu invalid/expired
}

// identity/infrastructure/adapters/jwt-token.adapter.ts  (MVP: HS256)
export class JwtTokenAdapter implements ITokenProvider {
  constructor(private readonly accessSecret: string, private readonly refreshSecret: string) {}
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.accessSecret, { algorithm: 'HS256', expiresIn: '15m' });
  }
  // ...
}
```

**Design Rationale:** `CreateNatalChartUseCase`, `AuthMiddleware`, và mọi nơi khác trong Application/Presentation Layer chỉ biết `ITokenProvider`, không biết `jsonwebtoken` hay thuật toán ký cụ thể tồn tại. Chuyển sang RS256 trong tương lai chỉ cần viết `RsaJwtTokenAdapter` mới (đổi `algorithm: 'RS256'`, dùng cặp khóa public/private thay vì 1 secret) và đổi 1 dòng ở `composition-root.ts` — không đụng vào Use Case nào. Đây là ứng dụng trực tiếp của Dependency Inversion (Mục 6), cùng pattern với `IEphemerisProvider` (Mục 12.1) và `ICacheProvider` (Mục 12).

### 11.2 Refresh Token qua HttpOnly Cookie
Đúng Quyết định 14.4 (REST API Spec) — implement bằng middleware `cookie-parser` + set cookie ở response:
```typescript
res.cookie('refreshToken', rawRefreshToken, {
  httpOnly: true, secure: true, sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000,
});
```
`accessToken` trả trong JSON body (không phải cookie) — client giữ tạm trong memory (không localStorage) theo khuyến nghị bảo mật chuẩn cho SPA.

### 11.3 Role & Permission

| Cơ chế | Vị trí |
|---|---|
| Role lưu trong JWT payload (`{ sub: userId, role: 'user'\|'admin' }`) | Tránh phải query DB mỗi request chỉ để biết role |
| Middleware `requireRole('admin')` | Áp cho route `/admin/articles/*` — dùng chung `auth.middleware.ts` đã verify token trước đó |
| Ownership check (ví dụ "chỉ chủ sở hữu Chart") | **Không** thể làm ở middleware chung (cần biết `chart.userId` cụ thể) — thực hiện ở Use Case, throw `AuthorizationError` nếu `chart.userId !== req.user.id` |

### 11.4 Session
Không có khái niệm "session" server-side (stateless theo JWT) — trạng thái đăng nhập hoàn toàn nằm ở `accessToken` (ngắn hạn) + `refreshToken` (dài hạn, có thể revoke qua DB), khớp nguyên tắc Stateless đã đặt ra ở Engine Spec/REST API Spec.

### 11.5 Google OAuth (future)
Theo REST API Spec Mục 14.7 và DB Spec Mục 3.3 (Quyết định 14.1) — khi triển khai, thêm:
- `identity/infrastructure/adapters/google-oauth.adapter.ts` (implement `IOAuthProvider`)
- `identity/application/use-cases/login-with-google.usecase.ts`
- Bảng `oauth_accounts` (đã dự trù ở DB Spec)

**Không cần sửa bất kỳ module nào khác** — đúng tính chất "module độc lập" của Identity.

---

## 12. External Service Integration

**Nguyên tắc chủ đạo (nhắc lại từ đề bài):** Business logic **không bao giờ phụ thuộc trực tiếp SDK bên ngoài** — mọi external service được bọc qua 1 interface (port) định nghĩa ở Domain Layer, implement cụ thể ở Infrastructure Layer (Mục 4, Mục 6).

| External Service | Interface (Domain) | Adapter (Infrastructure) | Ghi chú |
|---|---|---|---|
| **Swiss Ephemeris** (`swisseph-wasm`) | `IEphemerisProvider` (`chart/domain/ports/`) — xem 12.1 | `SwissEphemerisAdapter` | Engine Spec Mục 6.2 — Adapter là **lớp duy nhất** import package `swisseph-wasm`. **Đã chốt WASM cho MVP (Quyết định 22.1)** |
| **Geocoding Provider** (Google Places / OpenStreetMap Nominatim...) | `IGeocodingProvider` (`location/domain/ports/`) | `GoogleGeocodingAdapter` hoặc `NominatimAdapter` | Chưa chốt provider cụ thể — xem Mục 22 |
| **AI Interpretation Provider** (future) | `IInterpretationContentProvider` (`chart/domain/ports/`) — **định nghĩa sẵn ngay từ bây giờ dù chưa implement AI** | `HumanAuthoredContentAdapter` (hiện tại, đọc từ Postgres `interpretation_contents`) → tương lai thêm `AIContentAdapter` | Vì REST API Spec 14.1 đã xác nhận API không expose `contentSource` nhưng Domain Model vẫn giữ khái niệm này (DB Spec 5.13) — thiết kế interface đủ tổng quát ngay từ đầu để thêm `AIContentAdapter` sau này **không đổi Application layer** |
| **Redis** (future) | `ICacheProvider` (`shared/ports/`, dùng chung nhiều module) | `InMemoryCacheAdapter` (**MVP, đã chốt — Quyết định 22.2**) → `RedisCacheAdapter` (khi cần scale, thay qua Dependency Injection ở `composition-root.ts`, không đổi code gọi) | Dùng cho Rate Limit counter + cache Location/Interpretation/ReferenceData (Mục 16) |
| **Email Service** (future — cho `email_verification_tokens`/`password_reset_tokens`) | `IEmailService` (`identity/domain/ports/`) | `SmtpEmailAdapter` hoặc `SendgridAdapter` | Chưa triển khai ở MVP (PRD không yêu cầu xác thực email) |

### 12.1 `IEphemerisProvider` — định nghĩa interface (Quyết định 22.1)

Để việc chuyển từ `swisseph-wasm` sang native binding (nếu cần trong tương lai) **không đòi hỏi sửa Business Layer**, interface phải được thiết kế theo ngôn ngữ nghiệp vụ (Domain), không rò rỉ chi tiết kỹ thuật của `swisseph-wasm`, và **tổng quát đủ cho các loại Chart tương lai** (Transit/Synastry/Composite/Solar Return — Engine Spec Mục 9), không chỉ Natal Chart hiện tại:

```typescript
// chart/domain/ports/ephemeris-provider.port.ts
export interface EphemerisRequest {
  utcDateTime: Date;
  coordinates: { latitude: number; longitude: number };
}

export interface RawEphemerisData {
  planets: Array<{ name: PlanetName; longitude: number; latitude: number; speed: number }>;
}

export interface IEphemerisProvider {
  /** Vị trí thiên thể cho Natal Chart (Engine Spec Mục 6.2) */
  calculateNatal(request: EphemerisRequest): Promise<RawEphemerisData>;

  /** Chỗ trống sẵn cho Transit — chưa implement ở v1, nhưng interface định nghĩa trước
   *  để không phải sửa lại chữ ký hàm khi Engine Spec Mục 9.7 (Transit) được triển khai */
  calculateTransit(request: EphemerisRequest): Promise<RawEphemerisData>;
}
```

**Design Rationale:** `SwissEphemerisAdapter` (Infrastructure) là **nơi duy nhất** biết `swisseph-wasm` tồn tại. Nếu sau này thay bằng native `swisseph` binding, chỉ cần viết `NativeSwissEphemerisAdapter` mới implement cùng `IEphemerisProvider` này và đổi 1 dòng trong `composition-root.ts` — `chart/application/use-cases/create-natal-chart.usecase.ts` và toàn bộ Domain Layer (Calculators, Chart Builder) **không đổi một ký tự nào**. Việc định nghĩa sẵn `calculateTransit()` dù chưa implement là chủ đích: tránh phải **breaking change interface** khi Transit Chart được triển khai (Engine Spec Mục 9.7) — implementation ban đầu có thể `throw new UnsupportedChartTypeError()`, khớp đúng REST API Spec Mục 4.4.

---


## 13. Configuration Management

### 13.1 Nguyên tắc
Toàn bộ cấu hình đọc từ biến môi trường (`.env` cho local, secret manager của hạ tầng cho production), **validate bằng Zod ngay khi ứng dụng khởi động** (fail-fast — ứng dụng từ chối chạy nếu thiếu config bắt buộc, thay vì lỗi mơ hồ lúc runtime).

```typescript
// config/env.config.ts
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY_MINUTES: z.coerce.number().default(15),
  JWT_REFRESH_EXPIRY_DAYS: z.coerce.number().default(30),
  RATE_LIMIT_GUEST: z.coerce.number().default(30),          // REST API Spec 14.13
  RATE_LIMIT_USER: z.coerce.number().default(300),
  RATE_LIMIT_ADMIN: z.coerce.number().default(600),
  DATA_RETENTION_DAYS: z.coerce.number().default(30),        // DB Spec 14.7
  GEOCODING_PROVIDER_API_KEY: z.string(),
  SWISS_EPHEMERIS_DATA_PATH: z.string(),                      // đường dẫn file ephemeris (.se1) trong container
  REDIS_URL: z.string().url().optional(),                     // optional — xem Mục 22.2
  CORS_ORIGIN: z.string(),
  LOG_LEVEL: z.enum(['debug','info','warn','error']).default('info'),
});
export const env = envSchema.parse(process.env); // throw ngay nếu invalid — app không start
```

### 13.2 Bảng cấu hình đầy đủ

| Biến | Bắt buộc | Nguồn gốc | Ghi chú |
|---|---|---|---|
| `DATABASE_URL` | ✔ | — | Connection string Postgres cho Prisma |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | ✔ | REST API Spec Mục 11 | Secret ký JWT — **khác nhau** cho access/refresh (đổi 1 loại không ảnh hưởng loại kia) |
| `RATE_LIMIT_GUEST/USER/ADMIN` | ✘ (có default) | REST API Spec Quyết định 14.13 — Rate Limit Policy cấu hình được | — |
| `DATA_RETENTION_DAYS` | ✘ (default 30) | DB Spec Quyết định 14.7 | Dùng bởi background job dọn soft-delete (Mục 16) |
| `SWISS_EPHEMERIS_DATA_PATH` | ✔ | Engine Spec | Xem Mục 22.3 về cách đóng gói file dữ liệu ephemeris vào Docker image |
| `CORS_ORIGIN` | ✔ | REST API Spec Mục 11 | Domain Frontend chính thức, không dùng `*` |

### 13.3 Secrets
Không commit `.env` vào git (`.gitignore`); production dùng secret injection của hạ tầng deploy (VPS: file `.env` ngoài git, quyền đọc giới hạn; nếu dùng Docker Compose: Docker secrets hoặc biến môi trường qua CI/CD pipeline).

### 13.4 Feature Flags
Chưa cần hệ thống Feature Flag phức tạp ở MVP (1 dev, 1 môi trường production) — nếu cần "bật/tắt" 1 tính năng tạm thời (ví dụ tạm tắt Location search khi provider lỗi), dùng đơn giản 1 biến môi trường boolean (`FEATURE_LOCATION_SEARCH_ENABLED=true`), đọc qua `env.config.ts` như mọi config khác — không cần dịch vụ Feature Flag chuyên dụng (LaunchDarkly...) ở quy mô này.

---

## 14. Logging & Observability

| Hạng mục | Công cụ / Cách làm |
|---|---|
| **Logger** | **Pino** — structured JSON logging, cấu hình `LOG_LEVEL` qua env; dùng `pino-pretty` chỉ ở `development`, JSON thuần ở `production` (dễ ingest bởi log aggregator sau này) |
| **Request ID** | Middleware sinh UUID v4 cho mỗi request (`req.id`), gắn vào mọi log line trong vòng đời request đó (`logger.child({ requestId: req.id })`) |
| **Correlation ID** | **MVP: dùng chung với Request ID** (1 process, không có nhiều service để cần phân biệt) — nếu tách Microservices sau này (Mục 20), Correlation ID sẽ tách riêng để theo dõi 1 luồng nghiệp vụ xuyên nhiều service, còn Request ID vẫn là định danh riêng mỗi service |
| **Audit Log** | **Không có bảng DB riêng ở MVP** (DB Design Spec không định nghĩa bảng audit) — thay vào đó, log các hành động nhạy cảm (Admin sửa/xóa Article, User đổi role...) ở mức `info` với field `audit: true` để dễ lọc trong log aggregator; nâng cấp lên bảng `audit_log` chính thức nếu yêu cầu compliance tăng (xem Mục 20) |
| **Health Check** | `GET /health` (không thuộc `/api/v1`, không cần auth) — trả `200 OK` kèm trạng thái kết nối DB (`SELECT 1`); dùng bởi PM2/Docker healthcheck và Nginx upstream check |
| **Metrics** | *(Future)* — chưa cần Prometheus/Grafana ở MVP; khi cần, thêm `prom-client`, expose `/metrics` |
| **Tracing** | *(Future)* — OpenTelemetry chỉ cần thiết khi có nhiều service (Microservices), không áp dụng cho Modular Monolith 1 process |

### 14.1 Ví dụ log line chuẩn
```json
{
  "level": "info",
  "time": "2026-07-11T10:00:00.000Z",
  "requestId": "a1b2c3d4-...",
  "userId": "u_123",
  "module": "chart",
  "action": "create_natal_chart",
  "durationMs": 340,
  "msg": "Natal chart created successfully"
}
```

---

## 15. Security Architecture

Ánh xạ trực tiếp REST API Spec Mục 11 — bổ sung công cụ Node.js cụ thể:

| Hạng mục | Công cụ / Cách làm |
|---|---|
| **Helmet** | Middleware `helmet()` áp toàn cục ở `app.ts` — set security header chuẩn (CSP cơ bản, X-Frame-Options, X-Content-Type-Options...) |
| **CORS** | Middleware `cors()` với `origin: env.CORS_ORIGIN` (whitelist domain Frontend, không dùng `*` khi có credentials/cookie) |
| **Rate Limiter** | Middleware tự viết hoặc `express-rate-limit` (MVP, in-memory) → nâng cấp `rate-limit-redis` store khi có Redis (Mục 22.2) — áp dụng Rate Limit Policy từ `env.config.ts` (Mục 13) |
| **SQL Injection** | Prisma parameterized query mặc định — **tuyệt đối không** dùng `$queryRawUnsafe` với input chưa qua Zod validate |
| **XSS** | Sanitize `article.body` trước khi lưu (thư viện `sanitize-html` ở `article/application/use-cases/create-article.usecase.ts`) — DB Design Spec Mục 10 đã yêu cầu, đây là nơi implement cụ thể |
| **CSRF** | `SameSite=Strict` trên cookie `refreshToken` (Mục 11.2) là phòng tuyến chính; endpoint state-changing khác dùng JWT trong header `Authorization` (không phải cookie) nên tự nhiên miễn nhiễm CSRF (CSRF chỉ khai thác được cookie tự động gửi kèm) |
| **Password Hash** | `bcrypt` (cost factor 12) ở `identity/infrastructure/adapters/bcrypt-password-hasher.adapter.ts` — implement `IPasswordHasher` |
| **JWT** | `jsonwebtoken` package qua `ITokenProvider` abstraction (Mục 11.1.1); **đã chốt HS256 cho MVP** (Quyết định 22.4), secret riêng biệt access/refresh (Mục 13.2) |
| **Refresh Token** | Chỉ lưu `token_hash` (SHA-256) trong DB, đúng DB Design Spec Mục 5.2 — không bao giờ lưu token thô |
| **Input Validation** | Zod ở mọi route nhận input (Mục 10) — **không có route nào bỏ qua** bước này, kể cả route nội bộ/admin |

---

## 16. Performance Strategy

| Hạng mục | Chiến lược |
|---|---|
| **Caching** | `ICacheProvider` interface (Mục 12) — cache `interpretation_contents` (theo `subjectKey+version`), `house_systems`/`languages` (ReferenceData, TTL dài), kết quả `locations/search` (TTL vài ngày). MVP dùng `InMemoryCacheAdapter` nếu chưa có Redis (xem Mục 22.2), tương thích interface để chuyển sang `RedisCacheAdapter` không đổi code gọi |
| **Connection Pool** | Prisma connection pool mặc định (cấu hình `connection_limit` trong `DATABASE_URL`); cân nhắc PgBouncer khi scale (DB Design Spec Mục 11.4) — chưa cần ở MVP (1 process dài hạn, không serverless) |
| **Pagination** | Offset-based (`page`/`pageSize`) đúng REST API Spec Mục 8 — implement 1 lần ở `shared/http/pagination.ts`, tái sử dụng cho `birth-profiles`, `charts`, `articles` |
| **Compression** | Middleware `compression()` (gzip) áp toàn cục ở `app.ts` cho response JSON lớn (đặc biệt `ChartResponse` với nhiều Planet/Aspect/Interpretation nhúng kèm) |
| **Lazy Loading** | Không áp dụng nhiều ở backend thuần API (khác Frontend) — riêng `ReferenceData` cache in-memory được load 1 lần lúc khởi động (`eager`, không phải lazy, vì dữ liệu rất nhỏ và ít đổi) |
| **Async Processing / Background Jobs** | **MVP: `node-cron`** chạy trong cùng process cho 2 job định kỳ đã xác định ở DB Design Spec Mục 13: (1) dọn `refresh_tokens` hết hạn, (2) hard-delete bản ghi soft-delete quá `DATA_RETENTION_DAYS`. **Future:** khi cần queue thực sự (ví dụ AI Interpretation generation không đồng bộ), nâng cấp lên BullMQ + Redis (Mục 20) |

---

## 17. Testing Strategy

| Loại test | Công cụ | Phạm vi | Mock Strategy |
|---|---|---|---|
| **Unit Test** | Vitest | **Domain Layer, đặc biệt Astrology Engine Calculators** (`chart/domain/engine/calculators/*`) — vì đây là pure function (Engine Spec: Deterministic), test rất rẻ và có giá trị cao: input cố định → output cố định, không cần mock gì | Không cần mock — pure function |
| **Unit Test (Use Case)** | Vitest | Application Layer — test 1 Use Case với Repository/Adapter **giả lập hoàn toàn** | Mock `IChartRepository`, `IEphemerisProvider`... bằng `vi.fn()`/hand-written fake — test Use Case KHÔNG chạm DB thật |
| **Integration Test (Repository)** | Vitest + Docker Compose test DB | Infrastructure Layer — test `PrismaChartRepository` chạy transaction thật, xác nhận đúng DB Design Spec Mục 5–7 (constraint, index hoạt động đúng) | Không mock — dùng Postgres thật trong container test riêng biệt, seed/truncate giữa các test |
| **API Test** | Vitest + Supertest | End-to-end 1 request HTTP thật (in-memory Express app) qua toàn bộ layer — xác nhận đúng REST API Spec Mục 4 (status code, response shape, RFC7807 error) | Mock các external adapter thật sự tốn kém/không xác định (Swiss Ephemeris có thể giữ thật vì nó cũng deterministic và nhanh; Geocoding Provider **nên mock** vì gọi network thật) |
| **Coverage Goal** | — | **Domain Layer ≥ 90%** (rẻ để đạt vì pure function, và đây là phần quan trọng nhất về đúng đắn nghiệp vụ); **Application Layer ≥ 80%**; **Infrastructure/Presentation ≥ 60%** (phần lớn là "glue code", giá trị test thấp hơn) | — |

### 17.1 Test Folder Structure
```
src/modules/chart/
├── domain/engine/calculators/
│   ├── aspect-calculator.ts
│   └── aspect-calculator.test.ts        # co-located — test nằm cạnh code, dễ tìm
├── application/use-cases/
│   ├── create-natal-chart.usecase.ts
│   └── create-natal-chart.usecase.test.ts
tests/
├── integration/
│   └── chart/prisma-chart.repository.integration.test.ts
└── api/
    └── chart.api.test.ts                # Supertest, end-to-end
```
**Design Rationale:** Unit test **co-located** (cạnh file code) để dễ maintain khi refactor; Integration/API test tách riêng thư mục `tests/` vì chúng cần setup phức tạp hơn (DB container, HTTP server) không phù hợp lẫn vào `src/`.

---

## 18. Deployment Architecture

### 18.1 Development
Docker Compose local: Node.js app container (hot-reload qua `ts-node-dev`/`tsx watch`) + Postgres container + (tùy chọn) Redis container — 1 lệnh `docker compose up` khởi động toàn bộ môi trường, đảm bảo **parity** giữa dev và production (tránh lỗi kiểu "chạy được ở máy tôi").

### 18.2 Staging
*(Future — PRD không yêu cầu môi trường Staging cho MVP do quy mô 1 dev/timeline gấp)* — khi cần, dùng cùng Docker Compose config như production, database riêng biệt.

### 18.3 Production

```
┌─────────────┐
│   Internet    │
└──────┬──────┘
       │ :443 (HTTPS)
       ▼
┌───────────────────────┐
│   Nginx (Linux VPS)     │
│   - TLS termination       │
│   - Reverse proxy → :3000   │
│   - Static file (nếu cần)     │
└──────────┬────────────┘
            │ :3000 (HTTP nội bộ)
            ▼
┌───────────────────────┐
│  Node.js App (Docker Compose)│
│  - 1 container app (Express)   │
│  - 1 container Postgres          │
│  - (future) 1 container Redis      │
└───────────────────────┘
```

**Quyết định (xem ADR-008 Mục 21): Docker Compose làm phương án triển khai chính, PM2 là phương án dự phòng đơn giản hơn** nếu VPS không đủ tài nguyên chạy Docker (RAM thấp) — Backend Developer nên mặc định dùng Docker Compose trừ khi có lý do hạ tầng cụ thể phải chuyển sang PM2 (native Node process + PM2 process manager, không container hóa).

| Hạng mục | Chi tiết |
|---|---|
| **Docker** | 1 `Dockerfile` multi-stage (build TypeScript → run compiled JS, giảm kích thước image production) |
| **Docker Compose** | `docker-compose.yml` (dev, có hot-reload) + `docker-compose.prod.yml` (production, không mount source code, dùng image đã build) |
| **Nginx** | Reverse proxy `location /` → `proxy_pass http://localhost:3000`; xử lý TLS (Let's Encrypt/Certbot); có thể thêm rate limit ở tầng Nginx như lớp phòng thủ bổ sung (không thay thế Rate Limiter ở app) |
| **PM2** *(phương án thay thế)* | Nếu không dùng Docker: `pm2 start dist/server.js --name astroviet-api -i 1` — **BẮT BUỘC đúng 1 instance** (Quyết định 22.5), **không** dùng `-i max`/cluster mode, vì `InMemoryCacheAdapter` và `node-cron` không share state giữa nhiều process |
| **HTTPS** | Certbot (Let's Encrypt) tự động gia hạn, cấu hình ở tầng Nginx — Node.js app **không** tự xử lý TLS |
| **CI/CD** | *(Future)* — MVP deploy thủ công (`git pull` + `docker compose up -d --build`) do 1 dev, chưa cần pipeline tự động; migration DB chạy trước deploy code mới (DB Design Spec Mục 12) |

---

## 19. Coding Standards

| Hạng mục | Quy tắc | Ví dụ |
|---|---|---|
| **File Naming** | kebab-case, hậu tố mô tả loại file | `create-natal-chart.usecase.ts`, `chart.controller.ts`, `chart-repository.port.ts`, `chart.entity.ts`, `create-chart.schema.ts` |
| **Class Naming** | PascalCase | `CreateNatalChartUseCase`, `PrismaChartRepository` |
| **Interface Naming** | Tiền tố `I` | `IChartRepository`, `IEphemerisProvider` — giúp phân biệt tức thì interface (Domain) vs. implementation (Infrastructure) khi đọc code |
| **DTO Naming** | Hậu tố `Request`/`Response`/`Dto`, khớp tên đã định nghĩa ở REST API Spec Mục 5 | `CreateNatalChartRequest`, `ChartResponse` — **không tự đặt tên khác** với DTO đã chốt ở REST API Spec |
| **Entity Naming** | Danh từ số ít, khớp Domain Spec | `Chart`, `Planet`, `BirthProfile` |
| **Use Case Naming** | Động từ + danh từ + hậu tố `UseCase` | `CreateNatalChartUseCase`, `DeleteBirthProfileUseCase` — 1 file = 1 hành vi, không gộp nhiều hành vi vào 1 class "Service" lớn |
| **Constants** | SCREAMING_SNAKE_CASE, tách riêng file `constants.ts` mỗi module | `MAX_LABEL_LENGTH = 100` |
| **Enums** | PascalCase tên enum, PascalCase giá trị (khớp Domain Spec) | `enum AspectType { Conjunction, Sextile, Square, Trine, Opposition }` |
| **Import Rules** | Chỉ import từ `index.ts` (barrel) của module khác — **không bao giờ** `import ... from '../../other-module/domain/entities/foo'` | Enforce bằng ESLint (Mục 6) |
| **Barrel Export Policy** | Mỗi module có đúng 1 `index.ts` ở gốc, chỉ export Application Service cần thiết cho module khác — **không** export Entity, Repository, hay Use Case nội bộ | `export { ChartService } from './application/services/chart.service';` |

---

## 20. Future Scalability

| Kịch bản | Kiến trúc hiện tại mở rộng như thế nào |
|---|---|
| **10,000 user/ngày** | Modular Monolith vẫn chịu được ở mức này với: (1) PgBouncer cho connection pooling (DB Design Spec Mục 11.4), (2) chuyển `RATE_LIMIT_*`/cache sang Redis thật (đã có interface sẵn — Mục 12), (3) chạy nhiều instance Node.js phía sau Nginx load balancing (cần chuyển `node-cron` sang chỉ chạy ở 1 instance — xem Mục 22.5) |
| **AI Interpretation** | Chỉ cần thêm `AIContentAdapter` implement `IInterpretationContentProvider` (đã định nghĩa sẵn ở Mục 12) — **không sửa Application/Presentation layer** |
| **Queue** | Thêm BullMQ + Redis, chuyển các tác vụ nặng/không cần đồng bộ (ví dụ AI generation, gửi email) từ `node-cron` sang Job Queue thực sự — `chart` module Application layer không đổi, chỉ đổi cách Use Case "kích hoạt" tác vụ (gọi hàm trực tiếp → enqueue job) |
| **Redis** | Đã có `ICacheProvider` interface từ đầu (Mục 12) — chỉ cần cắm `RedisCacheAdapter` thay `InMemoryCacheAdapter`, không đổi code nghiệp vụ |
| **Full Text Search** | DB Design Spec Mục 14.4 đã ghi nhận `'simple'` config chỉ tạm cho MVP — khi cần, thêm `SearchProvider` interface (tương tự pattern các external service khác), cắm Elasticsearch/Meilisearch làm implementation mới cho `article/domain/ports/search-provider.port.ts` |
| **Multi-language** | `Language` reference data đã hỗ trợ đa ngôn ngữ từ đầu (Domain Spec 5.15); content bank (`interpretation_contents`) đã có cột `language` — chỉ cần Admin nhập thêm nội dung ngôn ngữ mới, không đổi schema/code |
| **CMS** | `article` module có thể tách thành service riêng nếu độ phức tạp CMS tăng cao (nhiều loại content, workflow duyệt bài...) — vì đã là module độc lập trong Modular Monolith, việc tách ra thành service HTTP riêng chỉ cần thay `article/index.ts` (in-process call) bằng 1 HTTP client gọi service mới, các module khác gọi qua cùng interface không đổi |
| **Mobile App** | REST API đã client-agnostic (JSON qua HTTPS, không phụ thuộc giả định gì về Frontend cụ thể) — Mobile App tiêu thụ **y hệt** REST API Spec v1.1 hiện có, **không cần thay đổi backend** |

---

## 21. Architecture Decision Records (ADR)

### ADR-001: PostgreSQL thay vì MongoDB/NoSQL
- **Context:** Cần chọn hệ quản trị CSDL cho dữ liệu có quan hệ rõ ràng (Chart → Planet/House/Aspect...) và cần ràng buộc toàn vẹn chặt (Database Design Spec Mục 1.3).
- **Decision:** PostgreSQL — đã chốt từ Database Design Spec Mục 2.1.
- **Consequence:** Có CHECK/FK constraint mạnh, JSONB linh hoạt khi cần (`warnings`), Full Text Search built-in đủ dùng cho MVP.
- **Trade-off:** Không có sharding ngang tự nhiên như MongoDB nếu data volume tăng cực lớn — chấp nhận được vì Domain Spec/PRD không có yêu cầu big data.

### ADR-002: Modular Monolith thay vì Microservices
- **Context:** 1 developer, timeline 3-4 tháng, 5 domain module đã có ranh giới rõ (Identity/BirthProfile/Chart/Article/Location).
- **Decision:** Modular Monolith — chi tiết Mục 1.4.
- **Consequence:** Deploy đơn giản, transaction dễ quản lý, chi phí vận hành thấp.
- **Trade-off:** Không scale độc lập từng module; đòi hỏi kỷ luật (ESLint boundary rule) để không suy biến thành "Big Ball of Mud" theo thời gian.

### ADR-003: Clean Architecture / Hexagonal thay vì MVC truyền thống
- **Context:** Astrology Engine (Engine Spec) yêu cầu tường minh "framework-independent, database-independent" (Engine Spec Mục 2 Design Principles).
- **Decision:** Clean Architecture 4 layer trong mỗi module, Dependency Inversion bắt buộc.
- **Consequence:** Domain Layer (đặc biệt Astrology Engine) test được 100% không cần mock DB/HTTP; dễ thay Swiss Ephemeris hoặc Prisma sau này.
- **Trade-off:** Nhiều file/layer hơn MVC thuần cho cùng 1 tính năng nhỏ — chi phí ban đầu cao hơn, nhưng cần thiết cho module Chart vốn phức tạp (Engine Spec 11 module).

### ADR-004: Prisma thay vì TypeORM/raw SQL
- **Context:** Tech stack đã chốt Prisma (đề bài).
- **Decision:** Prisma ORM + Prisma Migrate (đã khuyến nghị ở Database Design Spec Mục 12).
- **Consequence:** Type-safety tự động từ schema, Migration tool tích hợp sẵn, giảm 1 công cụ riêng biệt.
- **Trade-off:** Prisma Client không hỗ trợ mọi tính năng Postgres nâng cao (ví dụ 1 số dạng partial index phức tạp) bằng schema DSL thuần — cần raw SQL trong migration cho các trường hợp đó (đã có ở DB Design Spec Mục 5, ví dụ composite FK, expression index).

### ADR-005: JWT + Refresh Token Rotation thay vì Session-based Auth
- **Context:** REST API Spec đã chốt JWT (Mục 2).
- **Decision:** Access Token (JWT, 15 phút, **ký bằng HS256** — Quyết định 22.4) + Refresh Token (DB-tracked, rotation, HttpOnly Cookie), toàn bộ ẩn sau `ITokenProvider` abstraction (Mục 11.1.1) để đổi thuật toán/thư viện sau này không ảnh hưởng Application Layer.
- **Consequence:** Stateless access token (không cần query DB mỗi request để biết ai đang gọi), nhưng vẫn giữ khả năng revoke qua Refresh Token (đánh đổi được kiểm soát).
- **Trade-off:** Phức tạp hơn session thuần (cần bảng `refresh_tokens`, cơ chế rotation) — chấp nhận được vì lợi ích scale-out tốt hơn session server-side truyền thống. HS256 đơn giản hơn RS256 nhưng đòi hỏi migration sang RS256 nếu tách Microservices sau này (đã có `ITokenProvider` để việc này rẻ).

### ADR-006: Zod thay vì Joi/class-validator
- **Context:** Tech stack đã chốt Zod (đề bài); TypeScript là ngôn ngữ chính.
- **Decision:** Zod cho toàn bộ validation ở Presentation layer.
- **Consequence:** Type inference tự động (`z.infer<typeof schema>`) — DTO TypeScript type và validation schema luôn đồng bộ, giảm rủi ro lệch nhau.
- **Trade-off:** Zod runtime overhead nhẹ hơn TypeScript type (vốn bị xóa lúc compile) — chấp nhận được, cần thiết vì validate input runtime không thể chỉ dựa vào type-checking lúc biên dịch.

### ADR-007: Content Bank với Version Pinning thay vì Snapshot thuần túy hoặc JOIN động thuần túy
- **Context:** Database Design Spec Quyết định 14.2 — cần cân bằng giữa tái sử dụng nội dung diễn giải và tính ổn định của Chart đã lưu.
- **Decision:** `charts.snapshot_interpretation_version` ghim vào 1 version cụ thể của `interpretation_contents`.
- **Consequence:** `InterpretationLookupService` (Application layer, Mục 3.3.1) luôn JOIN kèm điều kiện `version = chart.snapshotInterpretationVersion` — đây là ràng buộc **bắt buộc phải nhớ** ở mọi nơi Use Case truy vấn Interpretation, không chỉ lúc tạo Chart.
- **Trade-off:** Thêm 1 tầng gián tiếp (không phải JOIN đơn giản theo `subjectKey`) — độ phức tạp code tăng nhẹ, đổi lại đúng ngữ nghĩa nghiệp vụ đã chốt.

### ADR-008: Docker Compose làm phương án triển khai chính, PM2 là dự phòng
- **Context:** Đề bài liệt kê cả Docker/Docker Compose và PM2 là lựa chọn hợp lệ ("PM2 hoặc Docker Compose nếu phù hợp").
- **Decision:** Docker Compose chính, PM2 dự phòng khi hạ tầng VPS hạn chế tài nguyên.
- **Consequence:** Đảm bảo dev/production parity (Mục 18.1); dễ thêm Redis/service khác vào `docker-compose.yml` sau này.
- **Trade-off:** Docker có overhead tài nguyên hơn PM2 chạy trực tiếp trên host — với VPS giá rẻ/cấu hình thấp, đây có thể là vấn đề thực tế (xem Mục 22.5).

### ADR-009: Astrology Engine là Domain module thuần túy, không nằm trong Application Layer
- **Context:** Engine Spec Mục 2 yêu cầu tường minh Engine phải Stateless + Deterministic + framework-independent.
- **Decision:** Toàn bộ Calculator/ChartBuilder nằm ở `chart/domain/engine/`, chỉ Swiss Adapter (I/O thật) nằm ở Infrastructure; Interpretation Engine (cần DB) nằm ở Application (Mục 3.3.1).
- **Consequence:** Phần lõi quan trọng nhất về mặt đúng đắn nghiệp vụ (tính toán chiêm tinh) được cô lập hoàn toàn khỏi framework, test cực rẻ (Mục 17), và **có thể tái sử dụng ở ngữ cảnh khác** (ví dụ 1 CLI tool nội bộ để debug 1 lá số cụ thể) mà không cần dựng Express server.
- **Trade-off:** Cần kỷ luật giữ Calculator "pure" tuyệt đối (không lỡ tay import Prisma/logger vào đó) — enforce bằng ESLint boundary rule (Mục 6).

---

## 22. Open Questions & Inconsistencies

> **Cập nhật 11/07/2026:** Toàn bộ 5 mục dưới đây đã được Product Owner review và chốt quyết định. Tài liệu giữ lại "Vấn đề" và "Phương án đã cân nhắc" làm decision log tham chiếu, bổ sung **✅ Quyết định cuối cùng** cho mỗi mục. Các thay đổi tương ứng đã được áp dụng vào Mục 1–21 ở trên.

### 22.1 `swisseph-wasm` (WASM) vs. native `swisseph` binding
**Vấn đề:** Đề bài liệt kê "Swiss Ephemeris / swisseph-wasm" như 2 khả năng, Engine Spec không chỉ định implementation cụ thể.

**✅ Quyết định cuối cùng:** Đồng ý **WASM cho MVP** như đề xuất ban đầu. **Bổ sung quan trọng:** `IEphemerisProvider` phải được định nghĩa theo ngôn ngữ nghiệp vụ (`calculateNatal()`, và có sẵn chỗ cho `calculateTransit()`...), không rò rỉ chi tiết `swisseph-wasm` ra ngoài Infrastructure Layer — để sau này chuyển sang native binding **không cần sửa Business Layer**. Đã áp dụng: thêm Mục 12.1 với interface đầy đủ và Design Rationale.

### 22.2 Redis "future"
**✅ Quyết định cuối cùng:** Đồng ý **in-memory cho MVP, Redis sau**. Thiết kế theo `ICacheProvider` interface — `InMemoryCacheAdapter` cho MVP, thay bằng `RedisCacheAdapter` sau này **qua Dependency Injection** (đổi 1 dòng ở `composition-root.ts`, không đổi code nghiệp vụ gọi cache). Đã áp dụng vào Mục 12 (bảng External Service Integration cập nhật để nêu rõ cơ chế DI swap thay vì chỉ ghi "future" mơ hồ).

### 22.3 Đóng gói file dữ liệu Swiss Ephemeris (`.se1`) vào Docker image
**✅ Quyết định cuối cùng:** Đồng ý **COPY trực tiếp vào Docker image**. Lý do được xác nhận: đây là static data (không đổi/không cần update thường xuyên), COPY trực tiếp đơn giản và phù hợp quy mô MVP — không cần Docker volume riêng hay cơ chế tải động. Giữ nguyên như Phương án 1 đã đề xuất ở Mục 18.

### 22.4 JWT Algorithm — HS256 hay RS256?
**Vấn đề:** REST API Spec "khuyến nghị" RS256 nhưng không bắt buộc; Modular Monolith 1 process hiện tại chưa cần lợi ích tách public/private key của RS256.

**✅ Quyết định cuối cùng:** Đồng ý **HS256 cho MVP**. **Bổ sung bắt buộc:** tạo `ITokenProvider` abstraction (không gọi trực tiếp `jsonwebtoken` từ Application Layer) để có thể chuyển sang RS256 sau này **mà không ảnh hưởng Application Layer** — cùng nguyên tắc Dependency Inversion đã áp dụng cho `IEphemerisProvider`/`ICacheProvider`. Đã áp dụng: thêm Mục 11.1.1 với interface `ITokenProvider` đầy đủ, cập nhật Mục 15 (Security) và ADR-005 (Mục 21).

### 22.5 PM2 Cluster Mode và `node-cron`/In-memory Cache
**✅ Quyết định cuối cùng:** Đồng ý **chỉ chạy đúng 1 process/instance** ở MVP (dù Docker Compose hay PM2) — không bật cluster mode/`-i max`. Đã áp dụng: sửa lệnh PM2 mẫu ở Mục 18.3 thành `-i 1` kèm ghi chú bắt buộc, nhất quán với việc `InMemoryCacheAdapter` và `node-cron` chưa an toàn cho nhiều process. Ràng buộc này vẫn cần được gỡ bỏ có chủ đích (chuyển sang Redis + scheduler-safe job) trước khi scale ngang trong tương lai (Mục 20).
