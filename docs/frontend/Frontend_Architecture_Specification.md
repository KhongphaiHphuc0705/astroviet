# Frontend Architecture Specification — AstroViet

**Phiên bản:** 1.0
**Trạng thái:** Draft — sẵn sàng cho Sprint 1 Frontend
**Phạm vi:** Kiến trúc kỹ thuật, ranh giới module, quy ước phát triển của toàn bộ React Application
**Không thuộc phạm vi:** Màu sắc, typography, spacing, accessibility chi tiết theo component, page mockup — xem [Frontend UI Specification](./Frontend_UI_Specification.md)

> Tài liệu này là nguồn tham chiếu kiến trúc duy nhất (Architectural Source of Truth) cho Frontend AstroViet. Nó trả lời câu hỏi **"code được tổ chức và kết nối với nhau như thế nào"** — trong khi Frontend UI Specification trả lời câu hỏi **"giao diện trông và hoạt động như thế nào"**. Hai tài liệu bổ sung cho nhau và không được mâu thuẫn; nếu phát sinh mâu thuẫn, tài liệu này thắng thế về quyết định kỹ thuật/kiến trúc, UI Specification thắng thế về quyết định thị giác/UX.

---

## Bối cảnh dự án tại thời điểm viết tài liệu

| Hạng mục | Trạng thái |
|---|---|
| Backend Sprint 0 (Bootstrap) | ✅ Hoàn thành |
| Backend Sprint 1 (Identity Module) | ✅ Hoàn thành |
| Backend Sprint 2 (Birth Profile Module) | ✅ Hoàn thành |
| Backend Architecture / REST API Spec / OpenAPI Spec / Database Design | 🔒 Đã đóng băng (frozen) |
| Frontend | Chưa có code — đang ở giai đoạn đặc tả kiến trúc trước khi bootstrap project |

Vì Backend đã đóng băng ở mức API contract, Frontend Architecture được thiết kế để **tiêu thụ (consume)** contract đó một cách tường minh, có kiểm soát type-safety, thay vì giả định cấu trúc dữ liệu — chi tiết ở mục 8.

---

## Mục lục

1. [Architecture Goals & Principles](#1-architecture-goals--principles)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Project Structure](#3-project-structure)
4. [Module Organization](#4-module-organization)
5. [Rendering Strategy](#5-rendering-strategy)
6. [Routing Architecture](#6-routing-architecture)
7. [State Management Architecture](#7-state-management-architecture)
8. [API Integration Architecture](#8-api-integration-architecture)
9. [Component Architecture](#9-component-architecture)
10. [Error Handling Architecture](#10-error-handling-architecture)
11. [Performance Strategy](#11-performance-strategy)
12. [Security Considerations](#12-security-considerations)
13. [Accessibility Strategy](#13-accessibility-strategy)
14. [Testing Architecture](#14-testing-architecture)
15. [Future Extensibility](#15-future-extensibility)
16. [Open Questions](#16-open-questions)

---

## 1. Architecture Goals & Principles

### 1.1. Triết lý kiến trúc

Backend AstroViet đã chọn **Clean Architecture** với ranh giới lớp nghiêm ngặt (Domain không được import `@prisma/client`/`express`). Frontend **không sao chép y nguyên** mô hình 4 lớp đó — phần lớn "business rule" thực sự (tính toán ephemeris, domain rule chiêm tinh) đã và sẽ luôn nằm ở Backend. Áp một Domain Layer đầy đủ phía Frontend cho logic không tồn tại ở đó là over-engineer, vi phạm nguyên tắc **YAGNI** đã thống nhất cho toàn dự án.

Thay vào đó, Frontend áp dụng triết lý **"Feature-Sliced, Layered by Responsibility"**: chia theo **tính năng nghiệp vụ** (feature) ở lớp ngoài, và trong mỗi feature, tách theo **trách nhiệm kỹ thuật** (data-fetching / presentation / state) — không tách theo lớp trừu tượng nghiệp vụ như Backend.

### 1.2. Mục tiêu kiến trúc

| Mục tiêu | Cách đạt được |
|---|---|
| **Scalability** (mở rộng khi thêm Chart type, thêm module) | Feature module độc lập, không có "God folder" (`components/`, `utils/` phình to vô hạn) — mục 3, 4 |
| **Maintainability** | Ranh giới import rõ ràng, enforce bằng lint rule (không phải chỉ quy ước bằng lời) — mục 4.4 |
| **Reusability** | Phân tách rõ Primitive (dùng lại 100%) khỏi Feature-specific (dùng lại 0%) — mục 9 |
| **Separation of Concerns** | Data-fetching (hooks) tách khỏi Presentation (component) tách khỏi Orchestration (page) — mục 9.3 |
| **Feature-first Organization** | Tìm code theo "tôi đang sửa tính năng gì" chứ không phải "đây là loại file gì" — mục 3 |
| **Composition over Inheritance** | Không class component, không HOC lồng nhau — dùng custom hook + render composition + slot props — mục 9.4 |

### 1.3. Nguyên tắc không thỏa hiệp (Non-negotiable)

1. **Một chiều phụ thuộc** (xem mục 2.2) — lớp thấp không bao giờ import lớp cao hơn nó, kể cả khi "tiện".
2. **Type-safety xuyên suốt biên API** — không có `any` ở ranh giới giao tiếp Backend↔Frontend (mục 8).
3. **Không business logic trong Page component** — Page chỉ orchestration (compose feature + layout), logic luôn nằm trong `features/*/hooks` hoặc `features/*/lib`.
4. **Mọi quyết định kiến trúc có lý do bằng văn bản** — tài liệu này ghi rõ *tại sao*, không chỉ *là gì*, để version sau không lặp lại tranh luận đã giải quyết (đúng tinh thần Backend Coding Standards đã áp dụng).

---

## 2. High-Level Architecture

### 2.1. Sơ đồ tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   React Application (CSR)                  │  │
│  │                                                             │  │
│  │   Pages ─▶ Widgets ─▶ Features ─▶ Entities ─▶ Shared        │  │
│  │                         │                                   │  │
│  │                         ▼                                   │  │
│  │              TanStack Query Cache (Server State)             │  │
│  │                         │                                   │  │
│  │                         ▼                                   │  │
│  │            Generated API Client (từ OpenAPI Spec)            │  │
│  └───────────────────────────┬─────────────────────────────────┘  │
└──────────────────────────────┼─────────────────────────────────┘
                                │ HTTPS / JSON (REST, RFC7807 errors)
                                ▼
                 ┌──────────────────────────────┐
                 │   Backend — Modular Monolith   │
                 │   (Express, Clean Architecture) │
                 │   Identity | Birth Profile |...  │
                 └──────────────────────────────┘
```

### 2.2. Ranh giới kiến trúc và hướng phụ thuộc

Frontend là **một client tiêu thụ REST API** — không có kiến thức về Database, ORM, hay cấu trúc nội bộ Backend. Ranh giới duy nhất giữa 2 hệ thống là **OpenAPI Specification đã đóng băng**. Đây là điểm mấu chốt: bất kỳ thay đổi contract nào cũng phải đi qua việc cập nhật OpenAPI Spec trước — Frontend không bao giờ "đoán" field response.

Trong nội bộ Frontend, hướng phụ thuộc là **một chiều, từ trên xuống**:

```
app  →  pages  →  widgets  →  features  →  entities  →  shared
```

- Lớp bên phải **không được biết tới** lớp bên trái (`shared` không import gì từ `entities`; `entities` không import gì từ `features`...).
- Lớp bên trái có thể import bất kỳ lớp nào bên phải nó.
- Cùng cấp (2 `features` khác nhau) **không import chéo nhau trực tiếp** — nếu 2 feature cần chia sẻ logic, logic đó được nâng cấp (promote) lên `entities` hoặc `shared`, không import ngang.

Chi tiết từng lớp ở mục 3–4.

### 2.3. Tích hợp với Backend đã đóng băng

| Backend đã chốt | Hệ quả kiến trúc Frontend |
|---|---|
| REST, JSON, RFC7807 error format | Lớp API Integration (mục 8) và Error Handling (mục 10) build trực tiếp trên 2 chuẩn này, không cần lớp adapter đa giao thức (không cần chuẩn bị cho GraphQL/gRPC). |
| JWT (Access + Refresh Token, HS256) | Kiến trúc Auth (mục 12) xoay quanh vòng đời 2 token, không phải session cookie thuần túy. |
| Modular Monolith, mỗi module có REST resource riêng (`/auth/*`, `/birth-profiles/*`...) | Feature module Frontend ánh xạ gần như 1:1 với Backend module (`features/auth`, `features/birth-profile`...) — dễ định vị code khi cross-reference với Backend. |
| OpenAPI Spec đã đóng băng cho Sprint 0–2 | Frontend có thể generate type ngay từ đầu Sprint 1 Frontend mà không lo contract đổi giữa chừng cho các module đã xong; module tương lai (Chart) sẽ generate lại khi Backend đóng băng spec tương ứng. |

---

## 3. Project Structure

### 3.1. Cấu trúc thư mục đầy đủ

> Đây là cấu trúc **có thẩm quyền** (authoritative) cho toàn bộ engineering. Frontend UI Specification §21 có một bản rút gọn phục vụ ngữ cảnh thiết kế component — nếu 2 bản lệch nhau, tài liệu này là nguồn đúng.

```
frontend/
├── public/
│   └── fonts/
├── src/
│   ├── app/                       # Bootstrap tầng ứng dụng — KHÔNG chứa business logic
│   │   ├── App.tsx                 # Compose toàn bộ Provider (mục 4.5) + Router
│   │   ├── router.tsx               # Khai báo route tree (mục 6)
│   │   ├── providers/                # QueryClientProvider, ThemeProvider, i18nProvider...
│   │   └── styles/                    # tokens.css, tailwind base layer, font-face (build từ UI Spec §2)
│   │
│   ├── pages/                      # 1 file = 1 route. CHỈ orchestration, không logic.
│   │   ├── landing/
│   │   ├── auth/                    # register-page.tsx, login-page.tsx
│   │   ├── chart/                    # new-chart-page.tsx, chart-detail-page.tsx
│   │   ├── app/                       # charts-dashboard-page.tsx, profiles-page.tsx, settings-page.tsx
│   │   ├── knowledge/
│   │   └── errors/                     # not-found-page.tsx, error-page.tsx
│   │
│   ├── widgets/                    # Khối UI ghép từ nhiều feature, không tự sở hữu business logic riêng
│   │   ├── app-layout/               # AppLayout, Sidebar, ContentContainer (UI Spec §11)
│   │   ├── marketing-layout/           # Navbar, Footer (UI Spec §11)
│   │   └── auth-layout/
│   │
│   ├── features/                   # Đơn vị nghiệp vụ độc lập — trọng tâm của codebase
│   │   ├── auth/                     # Register, Login, Refresh, Logout
│   │   │   ├── api/                    # api-service theo module (mục 8.2)
│   │   │   ├── hooks/                   # useLogin, useRegister, useAuthGuard
│   │   │   ├── components/               # LoginForm, RegisterForm (feature-specific, không dùng lại nơi khác)
│   │   │   ├── model/                     # types, Zod schema, mapper DTO→Model (mục 8.4)
│   │   │   └── index.ts                    # Public API của feature (mục 4.4)
│   │   ├── birth-profile/            # CRUD Birth Profile — ánh xạ Backend module cùng tên
│   │   ├── chart-generation/          # Birth Form → gọi API tạo Chart (Sprint tương lai)
│   │   ├── chart-viewer/               # Tab điều hướng, filter Aspect Table, tương tác Chart Wheel
│   │   ├── interpretation/              # Hiển thị + fetch Interpretation Card
│   │   └── knowledge-base/               # Danh sách/chi tiết bài viết
│   │
│   ├── entities/                   # Domain building block — hiển thị thuần túy, tái sử dụng CAO
│   │   └── astrology/                # PlanetBadge, SignBadge, HouseBadge, AspectBadge,
│   │                                   # PlanetTable, HouseTable, AspectTable, ChartWheel,
│   │                                   # ElementChart, ModalityChart, PatternCard
│   │                                   # (đặc tả UI đầy đủ ở UI Spec §12 — thư mục này CHỈ chứa code)
│   │
│   ├── shared/                     # Không biết gì về domain chiêm tinh hay nghiệp vụ AstroViet
│   │   ├── ui/                       # Design System Phase 1 (Button, Input, Card... — UI Spec §9)
│   │   ├── api/                       # HTTP client gốc, interceptor, generated OpenAPI client (mục 8.1)
│   │   ├── lib/                        # Tiện ích thuần: formatDegree, dateUtils, cn() classNames helper
│   │   ├── hooks/                       # useMediaQuery, useDebounce... (không gắn domain)
│   │   ├── stores/                       # authStore, uiStore, themeStore (mục 7.3)
│   │   ├── config/                        # env.ts (đọc + validate biến môi trường qua Zod), constants.ts
│   │   └── types/                          # Type generate từ OpenAPI (mục 8.1) + type dùng chung
│   │
│   ├── locales/                    # vi/, en/ — namespace theo feature (mục 15.3)
│   └── test/                       # test setup, custom render (Provider wrapper), MSW server, fixtures
│
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json                   # path alias @app/*, @pages/*, @widgets/*, @features/*, @entities/*, @shared/*
└── package.json
```

### 3.2. Trách nhiệm từng thư mục cấp cao nhất

| Thư mục | Trách nhiệm | KHÔNG được chứa |
|---|---|---|
| `app/` | Khởi tạo ứng dụng: gắn Provider, khởi tạo Router, load style toàn cục | Bất kỳ component nghiệp vụ hay hook fetch data nào |
| `pages/` | Map 1:1 với route trong UI Spec §14, compose Widget + Feature thành 1 màn hình hoàn chỉnh | Business logic, gọi API trực tiếp (phải qua `features/*/hooks`) |
| `widgets/` | Bố cục khung lặp lại trên nhiều page (Navbar, Sidebar, Footer) | Logic đặc thù 1 feature nghiệp vụ |
| `features/` | Toàn bộ hành vi nghiệp vụ: gọi API, quản lý state cục bộ, form, validation | Component thuần hiển thị dùng lại được ở nhiều feature (phải đẩy xuống `entities`/`shared`) |
| `entities/` | Component hiển thị domain (biết khái niệm "hành tinh", "cung", "aspect" nhưng không biết "đăng ký", "lưu chart") | Gọi API, side-effect, form state |
| `shared/` | Không biết bất kỳ khái niệm nghiệp vụ AstroViet nào — có thể tái sử dụng cho 1 dự án hoàn toàn khác | Bất cứ thứ gì nhắc tới "planet", "chart", "birth profile" |
| `locales/` | Bản dịch, tổ chức theo namespace | Logic |
| `test/` | Hạ tầng test dùng chung | Test case cụ thể (test case nằm cạnh code nó test, mục 14.4) |

---

## 4. Module Organization

### 4.1. Shared Modules (`shared/`)

`shared/` là lớp **domain-agnostic** — quy tắc kiểm tra đơn giản: đổi tên "AstroViet" thành 1 sản phẩm bất kỳ khác, code trong `shared/` vẫn dùng được nguyên vẹn.

| Sub-module | Nội dung |
|---|---|
| `shared/ui` | Toàn bộ 28 component Design System Phase 1 (UI Spec §9) — mỗi component 1 thư mục con, có `index.tsx` + `ComponentName.test.tsx` |
| `shared/api` | `client.ts` (Axios/fetch instance + interceptor gắn Access Token, mục 8.1, 12.1), type generate từ OpenAPI |
| `shared/lib` | Hàm thuần không side-effect: `formatDegree(decimal): "15°23'47″"`, `cn()` (classnames merge), `dateUtils` |
| `shared/hooks` | `useMediaQuery`, `useDebounce`, `useLocalStorage`, `useClickOutside` — không liên quan chiêm tinh |
| `shared/stores` | 3 Zustand store cấp ứng dụng (mục 7.3) — **không** thêm store thứ 4 mà không có lý do kiến trúc rõ ràng |
| `shared/config` | `env.ts` — nơi **duy nhất** đọc `import.meta.env`, validate bằng Zod, export object đã type-safe; phần còn lại của app không bao giờ đọc `import.meta.env` trực tiếp |
| `shared/types` | Type generate tự động (không sửa tay, mục 8.1) + type thủ công thật sự dùng chung (ví dụ `Locale`, `ThemeMode`) |

### 4.2. Feature Modules (`features/`)

Mỗi feature là 1 **vertical slice** hoàn chỉnh: từ gọi API tới hiển thị. Cấu trúc nội bộ chuẩn cho mọi feature:

```
features/<feature-name>/
├── api/            # api-service.ts (mục 8.2) — hàm gọi API thô, KHÔNG phải hook
├── hooks/          # use<Feature>Query.ts, use<Feature>Mutation.ts — bọc api/ bằng TanStack Query
├── components/     # Component chỉ dùng trong feature này (LoginForm, không phải Button)
├── model/          # types.ts, schema.ts (Zod), mapper.ts (DTO → Model, mục 8.4)
├── lib/            # (optional) logic thuần riêng của feature, ví dụ tính bước Progress của Birth Form
└── index.ts        # Public API — xem mục 4.4
```

**Danh sách feature ở Sprint 1 Frontend** (ánh xạ Backend module đã đóng băng + nhu cầu UI ngay lập tức):

| Feature | Ánh xạ Backend | Ghi chú |
|---|---|---|
| `features/auth` | Identity Module | Register, Login, Refresh, Logout, `useAuthGuard` |
| `features/birth-profile` | Birth Profile Module | CRUD hồ sơ sinh (UI Spec §13, trang `/app/profiles`) |
| `features/theme-preference` | *(không có Backend, thuần Client)* | Toggle theme, density mode — persist local, không gọi API |

> Feature cho **Chart Generation/Viewer/Interpretation** (UI Spec §12) sẽ được thêm khi Backend Sprint 3 (Swiss Ephemeris Integration) đóng băng contract tương ứng — cấu trúc thư mục đã có chỗ dự phòng (mục 3.1) nhưng **không tạo module rỗng trước** (tránh dead code, đúng YAGNI).

### 4.3. UI Primitives (`shared/ui`) và Entities (`entities/`)

Ranh giới giữa 2 lớp này là điểm dễ nhầm nhất — quy tắc phân biệt:

| Câu hỏi | `shared/ui` | `entities/astrology` |
|---|---|---|
| Component có biết khái niệm "hành tinh"/"cung"/"nhà" không? | Không bao giờ | Luôn luôn |
| Có thể copy sang dự án khác (ví dụ app quản lý task) không? | Có | Không |
| Ví dụ | `Badge`, `Table` (nếu có), `Card` | `PlanetBadge` (dùng `Badge` bên trong), `PlanetTable` (dùng `Card`/`Table` bên trong) |

`entities/astrology` **được phép** import từ `shared/ui` (đúng hướng phụ thuộc mục 2.2: `entities` nằm bên phải `shared`... — lưu ý: theo sơ đồ `pages → widgets → features → entities → shared`, `shared` là lớp trong cùng nên **mọi lớp** đều được import từ `shared`, còn `entities` chỉ được import từ `shared`, không từ `features` trở lên).

### 4.4. Layout Modules (`widgets/`)

`widgets/` chứa 3 layout khung đã đặc tả UI ở UI Spec §11: `AppLayout` (Navbar + Sidebar + ContentContainer), `MarketingLayout` (Navbar + Footer), `AuthLayout`. Mỗi widget **compose** từ `shared/ui` + có thể đọc `shared/stores` (ví dụ `AppLayout` đọc `authStore` để hiện Avatar) nhưng **không tự gọi API** — nếu Navbar cần hiển thị tên người dùng, nó nhận qua `authStore` (đã được `features/auth` ghi vào sau khi login) chứ không tự fetch.

### 4.5. Providers (`app/providers/`)

| Provider | Trách nhiệm | Thứ tự lồng (ngoài → trong) |
|---|---|---|
| `ErrorBoundaryProvider` | Bắt lỗi render cấp root (mục 10.3) | 1 (ngoài cùng) |
| `QueryClientProvider` (TanStack Query) | Cấu hình `QueryClient` toàn cục: `staleTime` mặc định, `retry`, global `onError` (mục 10.2) | 2 |
| `ThemeProvider` | Đọc `themeStore`, set `data-theme` (UI Spec §16.1) | 3 |
| `I18nextProvider` | Cấu hình i18next instance, namespace loading (mục 15.3) | 4 |
| `RouterProvider` | React Router (mục 6) | 5 (trong cùng) |

Thứ tự này đảm bảo: lỗi ở bất kỳ tầng nào trong (Router, Theme, i18n) đều được `ErrorBoundaryProvider` bắt được; `QueryClient` sẵn sàng trước khi bất kỳ route nào cố gắng fetch.

### 4.6. Utilities (`shared/lib`)

Quy tắc duy nhất: hàm trong `shared/lib` phải là **pure function** (không side-effect, không gọi API, không đọc store) — nếu 1 "utility" cần side-effect, nó thuộc về `hooks/` (có thể ở `shared/hooks` nếu domain-agnostic, hoặc `features/*/lib` nếu gắn nghiệp vụ).

### 4.7. Enforcement ranh giới bằng công cụ (không chỉ bằng quy ước)

Ranh giới mô tả ở mục 2.2 và 4.1–4.6 được enforce bằng **ESLint** (`eslint-plugin-boundaries` hoặc `eslint-plugin-import` với rule `no-restricted-imports` cấu hình theo layer), chạy trong CI — tương tự cách Backend đã enforce Clean Architecture layer bằng ESLint (đã có tiền lệ trong `dev` branch). Vi phạm ranh giới là **lint error**, không phải warning — chặn merge.

---

## 5. Rendering Strategy

### 5.1. CSR (Client-Side Rendering) — quyết định cho Sprint 1–2 Frontend

AstroViet Frontend là **CSR thuần túy** (Vite + React, không Next.js/Remix) ở giai đoạn hiện tại. Lý do:

- Sản phẩm yêu cầu tương tác nặng (Chart Wheel, form nhiều bước) — giá trị SSR chủ yếu ở SEO/First Paint, trong khi trang có SEO quan trọng nhất (Landing, Knowledge Base) là nội dung tương đối tĩnh, có thể tối ưu riêng nếu cần mà không cần SSR toàn app.
- 1 developer duy nhất — độ phức tạp vận hành thêm của SSR (hydration mismatch, data-fetching waterfall phía server) không tương xứng lợi ích ở quy mô MVP.
- Giữ khả năng chuyển sang SSR sau này (mục 15.5) bằng cách **không khóa kiến trúc vào API chỉ-chạy-được-trên-browser** (ví dụ không dùng `window`/`document` trong logic data-fetching của `features/*/hooks`, chỉ trong `shared/ui` component thực sự cần, có guard).

### 5.2. Lazy Loading & Route-level Code Splitting

- Mọi component trong `pages/` được `React.lazy()` hóa tại nơi khai báo route (mục 6), **không** lazy hóa `widgets/` (layout cần sẵn sàng ngay để tránh layout shift) hay `entities/`/`shared/ui` (quá nhỏ để tách chunk, overhead HTTP request không đáng).
- Ngưỡng lazy hóa bổ sung trong 1 page (không phải route-level): component **> 40KB gzip ước tính** hoặc phụ thuộc thư viện nặng dùng không thường xuyên — ứng viên rõ nhất là `ChartWheel` (SVG phức tạp + có thể kèm Framer Motion) nếu đo được vượt ngưỡng, tách lazy độc lập khỏi phần còn lại của `chart-viewer` feature.
- `vite.config.ts` cấu hình `manualChunks` tách riêng: `vendor-react` (react/react-dom/react-router), `vendor-query` (TanStack Query), `vendor-charts` (Recharts) — tránh 1 vendor chunk khổng lồ chứa mọi thư viện.

### 5.3. Suspense

- `React.lazy()` bắt buộc đi kèm `<Suspense>` ở **route level** (bọc trong `RouterProvider`/route element), fallback = `PageSkeleton` tương ứng (UI Spec §18.2) — không dùng `Spinner` chung chung làm fallback mặc định cho route.
- TanStack Query v5 hỗ trợ Suspense-mode (`useSuspenseQuery`) — **áp dụng có chọn lọc**: dùng cho data bắt buộc phải có trước khi render bất kỳ phần nào của page (ví dụ Chart data trong `ChartDetailPage`), **không** dùng cho data phụ trợ có thể hiện Skeleton cục bộ độc lập (ví dụ Pattern Card có thể loading riêng trong khi Planet Table đã render — mục 12.7 UI Spec, graceful degradation).
- Suspense boundary lồng nhau (nested) theo đúng ranh giới "phần nào có thể fail/load độc lập" — không 1 Suspense boundary bọc toàn trang nếu trang có nhiều nguồn dữ liệu độc lập.

### 5.4. Tương thích SSR tương lai (thiết kế phòng ngừa, không triển khai)

| Rủi ro SSR | Cách kiến trúc hiện tại đã phòng ngừa |
|---|---|
| Zustand không tự isomorphic | Store khởi tạo qua factory function thay vì singleton module-level export ngay từ đầu (dễ chuyển sang per-request store nếu cần SSR) |
| `window`/`localStorage` truy cập trực tiếp | Chỉ truy cập trong `shared/hooks` có guard `typeof window !== 'undefined'`, không rải rác trong feature code |
| Data-fetching gắn chặt `useEffect` client-only | TanStack Query hook trong `features/*/hooks` đã theo pattern có thể prefetch phía server (`queryOptions` factory, mục 8.3) nếu sau này cần |

Đây **không** phải cam kết triển khai SSR — chỉ là nguyên tắc "không đóng cửa" khi viết code hiện tại.

---

## 6. Routing Architecture

### 6.1. Công cụ và cấu trúc

React Router v6+ (đã chốt trong stack), khai báo route dạng **object route** (`createBrowserRouter`) trong `app/router.tsx` — không dùng JSX route declaration rải rác nhiều file, để `router.tsx` là nơi duy nhất nhìn thấy toàn bộ cây route.

### 6.2. Public Routes

Route không yêu cầu authentication: `/`, `/register`, `/login`, `/chart/new`, `/chart/:chartId` (Guest xem được, mục 25 UI Spec — Open Question #4), `/knowledge`, `/knowledge/:slug`. Các route này **vẫn có thể** render khác nhau tùy trạng thái auth (ví dụ CTA "Lưu chart" chỉ hiện khi đã login) — "Public" nghĩa là route-level không chặn, không phải nội dung giống hệt nhau cho mọi người dùng.

### 6.3. Protected Routes

Toàn bộ nhánh `/app/*` bọc bởi 1 route cha dùng **layout route pattern** của React Router (`<Route element={<ProtectedRoute />}>` chứa `<Outlet />`), không lặp lại logic guard ở từng route con.

```tsx
// Minh họa cấu trúc (không phải implementation đầy đủ — tài liệu này không viết code)
{
  path: '/app',
  element: <ProtectedRoute />,   // kiểm tra auth, KHÔNG tự render layout
  children: [
    { element: <AppLayout />, children: [   // layout tách riêng khỏi guard
      { index: true, element: <Navigate to="charts" /> },
      { path: 'charts', lazy: () => import('@pages/app/charts-dashboard-page') },
      { path: 'profiles', lazy: () => import('@pages/app/profiles-page') },
      { path: 'settings', lazy: () => import('@pages/app/settings-page') },
    ]},
  ],
}
```

Tách `ProtectedRoute` (logic guard) khỏi `AppLayout` (bố cục hiển thị) — 2 trách nhiệm khác nhau, không gộp vào 1 component để dễ test độc lập (guard logic test được mà không cần mount toàn bộ layout).

### 6.4. Route Guard — chi tiết hành vi

`ProtectedRoute` đọc trạng thái từ `authStore` (mục 7.3) và có **3 trạng thái**, không phải chỉ 2 (đã login/chưa login):

| Trạng thái `authStore` | Hành vi `ProtectedRoute` |
|---|---|
| `status: 'resolving'` (đang silent-refresh lúc khởi động app, mục 12.2) | Render `Spinner` full-page — **không** redirect vội (tránh flash về `/login` rồi bật lại `/app` gây giật màn hình) |
| `status: 'authenticated'` | Render `<Outlet />` |
| `status: 'unauthenticated'` | `<Navigate to={`/login?redirect=${currentPath}`} replace />` |

Trạng thái thứ 3 (`resolving`) là quyết định kiến trúc quan trọng thường bị bỏ sót trong thiết kế route guard đơn giản — bắt buộc đưa vào từ đầu vì AstroViet dùng Access Token in-memory (mục 12.1), luôn cần silent-refresh mỗi lần tải lại trang.

### 6.5. Nested Layouts

Layout lồng nhau theo đúng cấu trúc UI Spec §11.2 (App Shell), triển khai bằng React Router `<Outlet />` lồng nhau — mỗi `widgets/*-layout` component chỉ render 1 cấp `<Outlet />`, không có widget nào tự quản lý route con của nó (routing luôn tập trung ở `router.tsx`, layout chỉ là "khung chứa" thụ động).

### 6.6. Error Routes

Mỗi route entry có thể khai báo `errorElement` riêng (React Router built-in) — chiến lược 2 cấp:

1. **Route-level `errorElement`**: bắt lỗi loader/render cục bộ của riêng route đó (ví dụ `chart/:chartId` load thất bại do `chartId` không tồn tại → 404 cục bộ, không crash cả `/app`).
2. **Root-level `errorElement`** (trên route gốc `/`): lưới an toàn cuối cùng cho lỗi không route nào bắt được.

Route `*` (catch-all, không khớp path nào) render `NotFoundPage` — khác về bản chất với `errorElement` (404 là "route hợp lệ nhưng không tìm thấy nội dung", `errorElement` là "có lỗi khi render route").

---

## 7. State Management Architecture

> Frontend UI Specification §15 đã định nghĩa **bảng ánh xạ** "loại state nào dùng công cụ nào" (Server/Client/Form/URL State → TanStack Query/Zustand/React Hook Form/Router). Mục này **không lặp lại bảng đó** — nó giải thích **kiến trúc phân lớp** đằng sau mỗi loại, tức là *code tổ chức ra sao* để việc phân loại đó thực sự được giữ vững khi hệ thống lớn lên.

### 7.1. Server State — kiến trúc phân lớp trong `features/*`

Server State không bao giờ được truy cập trực tiếp qua `useQuery` rải rác trong component. Kiến trúc bắt buộc 2 lớp bên trong mỗi feature:

```
features/<feature>/api/          → hàm gọi API thô, trả Promise<DTO>, KHÔNG cache
features/<feature>/hooks/        → bọc hàm trên bằng useQuery/useMutation, trả Model đã map (mục 8.4)
```

Component (trong `pages/`, `widgets/`, `entities/` khi cần) **chỉ** import từ `features/*/hooks`, không bao giờ import trực tiếp từ `features/*/api`. Lý do: điều này cho phép thay đổi caching strategy (staleTime, retry, select) tại 1 điểm duy nhất mà không sửa bất kỳ component nào.

**Query Key Factory**: mỗi feature export 1 object factory duy nhất cho query key của nó (ví dụ `birthProfileKeys.detail(id)`, `birthProfileKeys.list(filters)`), tránh string key rải rác gây khó invalidate đúng phạm vi. Factory này sống trong `features/*/hooks/query-keys.ts`, được cả `hooks/` (định nghĩa query) và các feature khác cần `invalidateQueries` sau mutation (hiếm, qua `index.ts` public API — mục 4.2) sử dụng.

### 7.2. Client State — ranh giới Local vs Global

Không phải mọi state không-tới-từ-server đều lên Zustand. Quy tắc quyết định:

| Câu hỏi | Kết luận |
|---|---|
| State chỉ 1 component (và con trực tiếp của nó) cần biết? | `useState`/`useReducer` cục bộ — không đẩy lên Zustand |
| State cần chia sẻ giữa ≥ 2 component **không có quan hệ cha-con gần**? | Ứng viên cho Zustand |
| State cần tồn tại qua nhiều lần unmount/remount (đổi route)? | Ứng viên cho Zustand (hoặc URL State nếu cần share link — mục 7.4) |

### 7.3. Kiến trúc 3 Zustand Store (không phải 1 store khổng lồ, không phải store-per-feature vô hạn)

| Store | Slice chứa | Ai được ghi (write) |
|---|---|---|
| `authStore` | `status` (`resolving`/`authenticated`/`unauthenticated`), `accessToken` (in-memory), `user` (thông tin cơ bản từ JWT payload) | **Chỉ** `features/auth/hooks` (login/logout/refresh) — không component nào khác gọi `setState` của store này trực tiếp |
| `uiStore` | `sidebarCollapsed`, `activeModalId` (nếu cần quản lý modal tập trung) | `widgets/app-layout`, các component Modal-trigger |
| `preferenceStore` | `theme`, `locale`, `densityMode` (persist `localStorage` qua middleware `persist`, UI Spec §16.1) | `features/theme-preference`, Settings page |

**Tại sao 3, không phải 1**: mỗi store có **vòng đời và độ nhạy cảm khác nhau** — `authStore` không persist (bảo mật, mục 12.1), `preferenceStore` persist toàn bộ, `uiStore` không persist và reset khi reload (đúng ý nghĩa "trạng thái UI phiên hiện tại"). Gộp chung 1 store buộc phải xử lý logic persist chọn-lọc-từng-field phức tạp không cần thiết.

**Tại sao không store-per-feature**: `birth-profile`, `chart-viewer` v.v. **không có Global UI State thực sự** — toàn bộ state của chúng hoặc là Server State (TanStack Query) hoặc Local Component State. Chỉ tạo Zustand store mới cho 1 feature khi thực sự phát sinh nhu cầu chia sẻ state không-server giữa các component không liên quan trực tiếp (xem Open Question mục 16).

### 7.4. Form State — biên giới với Server State

React Hook Form quản lý state của form đang nhập dở — **không đồng bộ 2 chiều liên tục** với TanStack Query cache. Với form Edit (ví dụ sửa Birth Profile):

1. `useQuery` fetch data hiện tại (Server State).
2. `defaultValues` của `useForm` khởi tạo **1 lần** từ data đó khi query resolve (không dùng `values` reactive-sync trừ khi có lý do cụ thể, để tránh ghi đè input người dùng đang gõ dở nếu query refetch ngầm).
3. Submit gọi `useMutation`, thành công → `invalidateQueries` (Server State cập nhật lại từ nguồn thật, không tự đẩy giá trị form vào cache thủ công — tránh 2 nguồn sự thật tạm thời sai lệch).

### 7.5. URL State — khi nào bắt buộc dùng

URL State (React Router `useSearchParams`) là **bắt buộc**, không phải tùy chọn, cho bất kỳ state nào ảnh hưởng tới **nội dung hiển thị mà người dùng có thể muốn chia sẻ link hoặc refresh không mất** — đã liệt kê ví dụ ở UI Spec §15 (filter Aspect Table, trang Pagination). Kiến trúc: mỗi feature cần URL State định nghĩa 1 hook riêng (ví dụ `useAspectTableFilters()`) bọc `useSearchParams`, trả về object đã parse/type-safe thay vì để component tự `searchParams.get('planet')` rải rác.

---

## 8. API Integration Architecture

### 8.1. Pipeline tổng thể

```
OpenAPI Specification (đã đóng băng, Backend)
        ↓  [openapi-typescript, chạy qua script npm, output vào shared/types/]
Generated Types (interface request/response thô theo schema)
        ↓  [shared/api/client.ts — 1 Axios instance, KHÔNG generate full client SDK]
API Services  (features/*/api/*.ts — hàm gọi API thô theo từng resource)
        ↓  [features/*/hooks/*.ts — bọc TanStack Query]
Custom Hooks
        ↓
Feature Components
```

### 8.2. Quyết định: generate **type**, không generate **client SDK** đầy đủ

Có 2 trường phái phổ biến: (a) generate toàn bộ client (hàm gọi API tự động, kiểu `openapi-generator`), (b) chỉ generate type, tự viết hàm gọi API mỏng bằng tay. AstroViet chọn **(b)**:

| Lý do chọn (b) | Đánh đổi chấp nhận |
|---|---|
| Hàm gọi API thủ công trong `features/*/api/` giữ được chỗ để xử lý riêng từng endpoint (ví dụ endpoint search location cần debounce ở tầng hook, không phải tầng API) mà không phải "đấu tranh" với code generate | Phải tự viết wrapper (tốn thời gain đầu, nhưng khối lượng nhỏ vì backend hiện có ít endpoint — Identity + Birth Profile) |
| 1 Axios instance duy nhất (`shared/api/client.ts`) dễ gắn interceptor JWT (mục 12.1) và error normalize (mục 10.1) tại 1 điểm | Nếu Backend endpoint tăng nhanh (hàng trăm), chi phí viết tay tăng theo — đánh giá lại ở Sprint có > ~30 endpoint (mục 16) |
| Type vẫn 100% tự động, không lệch contract | — |

### 8.3. Cấu trúc 1 API Service điển hình

Mỗi hàm trong `features/*/api/` nhận input đã validate (Zod, từ `model/schema.ts`), trả về Promise của **DTO type generate từ OpenAPI** (chưa map) — việc map DTO→Model xảy ra ở lớp hook (mục 8.4), không trộn vào lớp API. Việc tách này giữ lớp `api/` "câm" (dumb) — chỉ là dây dẫn HTTP, dễ test bằng MSW mà không cần biết logic map.

`features/*/hooks/` sử dụng `queryOptions()` (TanStack Query v5 API) để định nghĩa query 1 lần dùng lại được cho cả `useQuery` (trong component) lẫn `prefetchQuery` (nếu cần prefetch khi hover link, hoặc SSR tương lai — mục 5.4).

### 8.4. Mapping DTO ↔ Frontend Model

Backend DTO (định dạng JSON qua REST) và Frontend Model (định dạng dùng trong component/state) **không phải lúc nào cũng giống hệt nhau** — lớp `model/mapper.ts` trong mỗi feature chịu trách nhiệm chuyển đổi, ví dụ:

| Backend DTO (theo REST/OpenAPI Spec) | Frontend Model | Lý do cần map |
|---|---|---|
| Tọa độ hành tinh dạng số thập phân độ (`degree: 154.3961`) | Object `{ sign, degreeInSign, minute, second }` | UI Spec §4.5 yêu cầu hiển thị dạng `15°23'47″` theo cung — tính toán chuyển đổi 1 lần ở biên, không lặp lại logic này trong từng component hiển thị |
| ISO 8601 timestamp | `Date` object hoặc giữ nguyên string tùy nơi dùng (`dayjs`/`date-fns` nếu cần format phức tạp — công cụ cụ thể là Open Question, mục 16) | Tránh parse rải rác |
| Field theo naming convention Backend (xác nhận là `camelCase` dựa trên Coding Standards đã chốt) | Giữ nguyên tên field nếu convention khớp — **không map lại tên chỉ vì thói quen**, chỉ map khi hình dạng dữ liệu thực sự cần đổi |

**Nguyên tắc quan trọng**: chỉ map khi có lý do thực sự (hình dạng dữ liệu khác, cần tính toán, cần gộp nhiều field). Map "cho có" 1-1 không đổi gì là chi phí bảo trì thừa — nhiều field DTO có thể dùng thẳng làm Model.

### 8.5. Đồng bộ khi Backend đổi contract

- Vì OpenAPI Spec của Sprint 0–2 (Identity, Birth Profile) đã đóng băng, Frontend generate type 1 lần khi bắt đầu và **chỉ regenerate khi có thông báo đổi Spec chính thức** — không tự động chạy generate trong mỗi lần `npm install`/CI build (tránh type đổi ngầm không ai review).
- Khi Backend Sprint 3+ đóng băng Spec mới (Chart module), quy trình lặp lại: cập nhật `shared/types/`, review diff, cập nhật `features/*/api` tương ứng — coi đây là 1 **thay đổi có review**, không phải build step tự động (rủi ro: Spec sai/chưa ổn định lọt vào type production).
- CI có bước kiểm tra type-check tổng thể (`tsc --noEmit`) sau mỗi lần Spec đổi — nếu Backend đổi field mà Frontend chưa cập nhật, build **fail cứng**, không fail âm thầm ở runtime.

---

## 9. Component Architecture

### 9.1. 4 tầng — ánh xạ trực tiếp với cấu trúc thư mục mục 3–4

```
Primitive   →  shared/ui             (Button, Input, Card... — UI Spec §9)
Composite   →  entities/astrology    (PlanetTable, ChartWheel... — UI Spec §12)
              +  widgets/             (AppLayout, Navbar... — UI Spec §11)
Feature     →  features/*/components  (LoginForm, BirthProfileForm...)
Page        →  pages/*                (orchestration thuần)
```

### 9.2. Trách nhiệm và ràng buộc từng tầng

| Tầng | Được phép | Không được phép |
|---|---|---|
| **Primitive** | Nhận props, quản lý state UI cực nhỏ (ví dụ `open` của Dropdown nếu uncontrolled) | Biết bất kỳ khái niệm domain hay gọi hook feature nào |
| **Composite** | Compose nhiều Primitive, nhận data đã chuẩn hóa qua props, có thể có state hiển thị cục bộ (ví dụ hover state trong `ChartWheel`) | Tự gọi API, tự đọc Zustand store nghiệp vụ (nhận mọi thứ qua props từ Feature/Page gọi nó) |
| **Feature** | Gọi hook từ `features/*/hooks`, quản lý form state, xử lý side-effect (submit, navigate sau thành công) | Định nghĩa lại style/token (luôn dùng Primitive/Composite có sẵn) |
| **Page** | Compose Widget + Feature theo layout của 1 route, đọc route param | Chứa bất kỳ logic nghiệp vụ nào dài hơn vài dòng orchestration — nếu logic phức tạp lên, nó thuộc về 1 hook trong `features/*/hooks`, Page chỉ gọi hook đó |

### 9.3. Container/Presentational tách theo tầng, không tách theo file-suffix

AstroViet **không** dùng quy ước đặt tên `*.container.tsx` / `*.presentational.tsx` truyền thống — thay vào đó, sự tách bạch Container (biết state/data) và Presentational (chỉ nhận props) được thể hiện **qua chính ranh giới tầng** ở mục 9.1: mọi thứ trong `entities/`/`shared/ui` mặc định presentational; "container" luôn là component ở tầng `features/*/components` hoặc `pages/*` — không cần hậu tố tên file để phân biệt, vì vị trí thư mục đã tự nói lên vai trò (đúng tinh thần Feature-first mục 1.2).

### 9.4. Composition Pattern cụ thể

| Pattern | Dùng khi | Ví dụ trong AstroViet |
|---|---|---|
| **Slot props** (children hoặc named slot prop) | Composite cần Feature "bơm" nội dung tùy biến vào 1 vị trí cố định | `Card` nhận `header`/`footer` slot (UI Spec §9.3); `PageHeader` nhận `actions` slot (UI Spec §11.5) |
| **Render prop / function-as-children** | Composite cần chia sẻ *state nội bộ* ra ngoài cho phần render tùy biến | Hiếm dùng trong hệ thống hiện tại — chỉ cân nhắc nếu 1 Composite (ví dụ `ChartWheel`) cần cho Feature tùy biến tooltip nội dung theo dữ liệu hover mà Composite tự quản lý |
| **Compound Components** (component cha export nhiều sub-component cùng chia sẻ context nội bộ) | Nhóm component luôn đi cùng nhau, có quan hệ ngầm | `Tabs`/`Tabs.List`/`Tabs.Panel` nếu Design System (UI Spec §9.6) triển khai theo hướng này thay vì prop `items` phẳng — quyết định cụ thể để lại cho lúc code hóa Design System, không chốt cứng ở tài liệu kiến trúc |
| **Custom Hook làm đơn vị composition chính** | Chia sẻ logic (không phải UI) giữa nhiều Feature component | `useAuthGuard`, `useAspectTableFilters` (mục 7.5) — đây là cơ chế "tái sử dụng logic" chính thay thế hoàn toàn HOC/Mixin |

### 9.5. Tại sao "Composition over Inheritance" cụ thể nghĩa là gì ở đây

Không có class component nào trong codebase (kể cả `ErrorBoundary` — dùng thư viện wrapper hoặc pattern hook-based hiện đại nếu React version hỗ trợ, chỉ dùng class thực sự nếu React API bắt buộc). "Kế thừa hành vi" giữa các component **luôn** giải quyết bằng 1 trong 2 cách: (a) compose nhiều component nhỏ lại, (b) trích xuất logic dùng chung thành custom hook — không bao giờ bằng cách 1 component "extends" hành vi của component khác.

---

## 10. Error Handling Architecture

### 10.1. Tầng chuẩn hóa lỗi API (RFC7807)

Backend Error Kernel (đã chốt: `AppError`, `BadRequestError`, `NotFoundError`, `AuthenticationError`, `ForbiddenError`, `ConflictError`, `ValidationError`, `InfrastructureError`) trả response theo **RFC7807 Problem Details** cho mọi lỗi. `shared/api/client.ts` có **1 interceptor response duy nhất** chuẩn hóa mọi lỗi HTTP thành 1 class nội bộ `ApiError` trước khi lỗi đó đi tới bất kỳ lớp nào cao hơn:

```
ApiError {
  status: number
  errorCode: string        // map trực tiếp từ field Backend (ví dụ "VALIDATION_ERROR")
  title: string
  detail?: string
  fieldErrors?: { field: string; message: string }[]   // cho ValidationError
}
```

**Không có nơi nào khác trong codebase tự parse response lỗi thô** — mọi `catch`/`onError` trong `features/*/hooks` chỉ làm việc với `ApiError` đã chuẩn hóa.

### 10.2. Global Error Handling (tầng TanStack Query)

`QueryClient` (mục 4.5) cấu hình `defaultOptions.mutations.onError`/`queries.onError` **mặc định** hiện `Toast variant="danger"` (UI Spec §9.4) với message dịch từ `errorCode` qua từ điển (mục 10.5) — đây là **fallback**, không phải hành vi duy nhất. Từng `useMutation`/`useQuery` cụ thể trong `features/*/hooks` có thể override `onError` khi cần xử lý khác (ví dụ lỗi Login hiện `Alert` inline thay vì Toast, mục 10.4 dưới đây — UI Spec §10.3 đã mô tả hành vi thị giác, ở đây là *nơi* logic đó được đặt: trong hook của feature `auth`, không phải trong interceptor toàn cục).

### 10.3. Error Boundary — 2 cấp, không phải 1

| Cấp | Vị trí | Bắt lỗi gì | Fallback UI |
|---|---|---|---|
| **Root** | `app/providers/ErrorBoundaryProvider` (mục 4.5), bọc ngoài cùng `RouterProvider` | Lỗi render không route nào lường trước (bug thật sự, không phải lỗi API) | `PageErrorState` toàn màn hình (UI Spec §18.4) + nút reload |
| **Route-level** | `errorElement` của từng route (mục 6.6) | Lỗi cục bộ trong 1 page (ví dụ `chartId` không hợp lệ khi parse param) | `PageErrorState` trong `ContentContainer`, Navbar/Sidebar vẫn sống (UI Spec §11.7) |

**Không** đặt Error Boundary ở cấp từng Feature component nhỏ lẻ (ví dụ quanh mỗi `InterpretationCard`) — trường hợp lỗi cục bộ đó (mục 10.4 dưới) xử lý bằng **trạng thái, không phải exception** (TanStack Query trả `isError` cho component tự quyết định hiển thị gì, đúng UI Spec §12.6 "chỉ Card này hiện lỗi cục bộ" — đây là data-driven rendering, không phải React Error Boundary).

### 10.4. Form Validation Errors — nguồn kép (Client + Server)

1. **Client-side**: Zod schema trong `features/*/model/schema.ts` (dùng chung cấu trúc với Backend validation, không nhất thiết chung code vì khác runtime, nhưng **cùng rule** — đồng bộ thủ công có review, tương tự mục 8.5) chạy qua `@hookform/resolvers/zod`, chặn submit trước khi gọi API.
2. **Server-side**: nếu Backend trả `ValidationError` (422, RFC7807 kèm `fieldErrors`, mục 10.1) dù đã qua validate client (ví dụ race condition, business rule chỉ Backend biết — ví dụ email đã tồn tại), `features/*/hooks` map `fieldErrors` từ `ApiError` sang `setError()` của React Hook Form theo đúng tên field, hiển thị inline giống hệt lỗi client-side (người dùng không phân biệt được nguồn gốc lỗi — nhất quán UX).

### 10.5. Từ điển thông báo lỗi (`errorCode` → tiếng Việt)

`shared/lib/error-messages.ts` (hoặc namespace i18next riêng `errors.json`, mục 15.3) ánh xạ **mọi** `errorCode` mà Backend định nghĩa (Error Kernel, mục 10.1) sang câu tiếng Việt thân thiện — **không** hiển thị `detail` thô từ RFC7807 trực tiếp cho người dùng cuối (thường bằng tiếng Anh kỹ thuật, không phù hợp persona "Người mới", UI Spec §1.4). `errorCode` lạ/chưa map → fallback message chung "Đã có lỗi xảy ra, vui lòng thử lại" + log riêng để bổ sung dịch sau (không throw crash vì thiếu bản dịch).

### 10.6. Global Unhandled Error / Observability Hook

Kiến trúc chừa 1 điểm cắm duy nhất — `shared/lib/report-error.ts` — được gọi từ: (1) Root Error Boundary (mục 10.3), (2) global `onError` của QueryClient (mục 10.2) cho lỗi mức `5xx`/`InfrastructureError`. Bên trong hàm này **hiện tại chỉ `console.error`**; khi công cụ observability được chọn (Sentry hoặc tương đương, Open Question mục 16), chỉ cần đổi implementation của 1 file này, không sửa nơi gọi.

---

## 11. Performance Strategy

> UI Spec §20 đã định nghĩa **ngân sách hiệu năng cụ thể** (LCP, bundle size, thời gian render Chart Wheel) và một số kỹ thuật ở mức UI (font subset, lazy image). Mục này tập trung vào **kiến trúc** đứng sau các con số đó — nơi/cách các kỹ thuật được tổ chức trong codebase.

### 11.1. Memoization — nguyên tắc áp dụng có chọn lọc

Memoization (`React.memo`, `useMemo`, `useCallback`) **không** áp dụng mặc định cho mọi component — chi phí đọc code tăng lên không tương xứng lợi ích ở component nhẹ. Áp dụng bắt buộc chỉ khi:

| Trường hợp | Kỹ thuật |
|---|---|
| Component nằm trong danh sách lặp lớn (`PlanetTable` row, `Grid` item) và props ổn định giữa các render cha | `React.memo` |
| Tính toán nặng lặp lại mỗi render (chuyển đổi tọa độ hành tinh sang path SVG trong `ChartWheel`, mục 8.4) | `useMemo` |
| Callback truyền xuống component đã `React.memo` hóa (tránh phá vỡ memo do reference đổi mỗi render) | `useCallback` |
| Phần **tĩnh** của `ChartWheel` (vòng cung hoàng đạo, vòng nhà — không đổi khi hover/chọn hành tinh, UI Spec §20.2) | Tách thành sub-component riêng + `React.memo`, tách biệt hoàn toàn khỏi phần động (đường Aspect, highlight) |

### 11.2. Bundle Splitting — trách nhiệm phân theo tầng

Kế thừa mục 5.2 (route-level splitting) và bổ sung ở mức **thư viện**: `vite.config.ts` `manualChunks` tách vendor theo nhóm sử dụng (`vendor-charts` chỉ load khi vào page có `ChartWheel`/`ElementChart` — nhờ route-level lazy loading kéo theo, không cần cấu hình tách thủ công phức tạp nếu import đúng chỗ). Nguyên tắc: **import thư viện nặng (Recharts, Framer Motion) chỉ trong file thực sự dùng nó** (`entities/astrology/chart-wheel`, không import lại ở `index.ts` barrel file của `entities/astrology` nếu barrel export khiến bundler không tree-shake được — xem 11.5).

### 11.3. Asset Optimization

- Font: chiến lược đã chốt ở UI Spec §20.2 (self-host, subset, `font-display: swap`) — trách nhiệm kiến trúc ở đây là: font file đặt tại `public/fonts/`, khai báo `@font-face` **1 lần duy nhất** trong `app/styles/`, không rải rác import font ở nhiều nơi.
- SVG (glyph chiêm tinh, icon custom, UI Spec §5.1): inline SVG component (không phải `<img src="*.svg">`) cho glyph cần đổi màu theo `currentColor`/theme; SVG thuần túy trang trí dùng `<img>` + `loading="lazy"` nếu ngoài viewport đầu.

### 11.4. Image Optimization

Áp dụng cho ảnh minh họa Knowledge Base (nội dung duy nhất trong hệ thống có khả năng chứa ảnh do người biên tập tải lên): `<img loading="lazy" decoding="async">` ngoài viewport đầu tiên, kiến trúc chừa chỗ cho 1 **image CDN/transform service** (resize/format theo viewport) như 1 quyết định triển khai riêng — không cam kết công cụ cụ thể ở giai đoạn MVP (Open Question mục 16).

### 11.5. Barrel File (`index.ts`) — dùng thận trọng

Mỗi `features/*/index.ts` (Public API, mục 4.2) và mỗi thư mục trong `entities/astrology/` có barrel file `index.ts` re-export — đây là **ranh giới module** (tốt cho enforcement mục 4.7), nhưng barrel file có rủi ro thực tế: cản trở tree-shaking nếu cấu hình bundler không tối ưu, và có thể vô tình kéo theo import thư viện nặng không cần thiết (mục 11.2). Quy tắc giảm rủi ro: barrel file **chỉ re-export type và component**, không re-export side-effect module; Vite/Rollup (`sideEffects: false` trong `package.json` các package nội bộ nếu tách monorepo sau này) — đo bundle size định kỳ (mục 11.6) để phát hiện sớm nếu barrel file gây phình bundle.

### 11.6. Đo lường liên tục (không chỉ đặt ngân sách 1 lần)

CI có bước `vite build --mode analyze` (hoặc `rollup-plugin-visualizer`) sinh báo cáo bundle size, so sánh với ngân sách UI Spec §20.1 — **cảnh báo** (không nhất thiết fail build ở MVP) khi 1 route vượt ngân sách > 10%, để phát hiện regression sớm thay vì chỉ đo thủ công khi nghi ngờ chậm.

---

## 12. Security Considerations

### 12.1. JWT Handling — kiến trúc lưu trữ token

Đã quyết định ở UI Spec §15.1 (Access Token in-memory, không `localStorage`) — mục này mô tả **kiến trúc cụ thể hóa** quyết định đó:

- `authStore` (mục 7.3) giữ Access Token **chỉ trong bộ nhớ JS runtime** — biến mất khi refresh trang (F5)/đóng tab, đây là đánh đổi **có chủ đích** để giảm bề mặt tấn công XSS (token không nằm trong bất kỳ storage nào script độc hại có thể đọc qua `localStorage.getItem`).
- `shared/api/client.ts` gắn Access Token vào header `Authorization: Bearer <token>` qua **request interceptor** đọc từ `authStore` tại thời điểm gọi — không truyền token qua props/context xuống từng feature.

### 12.2. Refresh Flow — kiến trúc silent-refresh

Vòng đời: khi app khởi động (`app/providers`, trước khi render Router — mục 6.4 trạng thái `resolving`), gọi 1 lần endpoint refresh; thành công → set `authStore.status = 'authenticated'` + Access Token mới; thất bại → `status = 'unauthenticated'`.

Ngoài ra, `shared/api/client.ts` có **response interceptor** bắt lỗi `401` từ bất kỳ API call nào giữa phiên làm việc (Access Token hết hạn giữa chừng) → tự động gọi refresh 1 lần, **retry đúng 1 lần** request gốc nếu refresh thành công, nếu refresh cũng thất bại → set `unauthenticated` + điều hướng `/login` (không retry vô hạn, tránh loop).

> **Phụ thuộc quyết định chưa chốt** (kế thừa Open Question UI Spec §25 mục 1): cơ chế trên giả định Refresh Token nằm trong `HttpOnly Cookie` (browser tự gửi kèm, Frontend không cầm token này) — nếu Backend xác nhận trả qua response body thay vào đó, kiến trúc trên vẫn đứng vững về mặt luồng, chỉ đổi cách gọi endpoint refresh (gửi token trong body thay vì dựa vào cookie tự động) — đây là lý do interceptor refresh được cô lập trong `features/auth/api/`, không rải logic refresh ra `shared/api/client.ts` (chỉ interceptor *gọi* refresh khi gặp 401 nằm ở `shared`, còn *cách* refresh hoạt động nằm ở `features/auth`) — giảm chi phí thay đổi khi câu hỏi này được trả lời.

### 12.3. XSS Prevention

- **Không** dùng `dangerouslySetInnerHTML` cho bất kỳ nội dung nào có nguồn gốc từ input người dùng hoặc CMS/API mà không qua sanitize.
- Nội dung duy nhất trong hệ thống là rich text/markdown (bài viết Knowledge Base, có thể cả `InterpretationCard.content` nếu Backend cho phép định dạng — UI Spec §12.6): render qua markdown parser có sanitize built-in (ví dụ `react-markdown` mặc định không dùng `dangerouslySetInnerHTML`, hoặc `rehype-sanitize` nếu cần HTML thô) — quyết định thư viện cụ thể để lại lúc code hóa `knowledge-base` feature, nguyên tắc kiến trúc là **sanitize bắt buộc tại 1 điểm duy nhất**, không rải parse rải rác.
- React tự động escape nội dung text thông thường (JSX `{value}`) — rủi ro XSS thực sự chỉ tập trung ở 2 điểm trên, dễ audit vì đã cô lập.

### 12.4. CSRF Considerations

Nếu Refresh Token dùng `HttpOnly Cookie` (giả định mục 12.2), endpoint refresh **phải** được Backend bảo vệ CSRF (`SameSite=Strict` hoặc `Lax` + CSRF token nếu cross-site request cần thiết) — đây là trách nhiệm phối hợp 2 phía, Frontend không tự giải quyết CSRF một mình. Nếu Backend xác nhận dùng response body thay vì cookie, rủi ro CSRF cho luồng refresh **không áp dụng** (không có cookie tự động gửi kèm) — một lý do nữa để chốt sớm câu hỏi ở mục 12.2.

### 12.5. Route Protection — không chỉ ở Frontend

`ProtectedRoute` (mục 6.3–6.4) là **UX guard**, không phải security boundary thật sự — mọi endpoint nhạy cảm vẫn phải được Backend enforce authorization độc lập (đã đúng theo Clean Architecture Backend, `ForbiddenError`/`AuthenticationError` ở Use Case Layer). Kiến trúc Frontend **không bao giờ** giả định 1 route "an toàn" chỉ vì có `ProtectedRoute` bọc ngoài — mọi data hiển thị vẫn qua API có auth thật.

---

## 13. Accessibility Strategy

> Toàn bộ nguyên tắc, chuẩn tuân thủ (WCAG 2.1 AA), và checklist theo component đã ở UI Spec §17. Mục này chỉ nêu **trách nhiệm kiến trúc** đảm bảo accessibility không bị "quên" khi codebase lớn lên.

### 13.1. Enforcement tại tầng công cụ

| Công cụ | Vị trí | Vai trò |
|---|---|---|
| ESLint `eslint-plugin-jsx-a11y` | Toàn bộ `src/`, đặc biệt bắt buộc nghiêm ngặt cho `shared/ui` và `entities/astrology` | Bắt lỗi tĩnh (thiếu `alt`, `aria-*` sai) ngay lúc viết code, trước khi tới runtime test |
| `vitest-axe` (hoặc tương đương) | Component Test (mục 14.2) của mọi component trong `shared/ui`/`entities/astrology` | Definition of Done bắt buộc (UI Spec §17.3) — CI fail nếu thiếu |
| Storybook a11y addon | Storybook instance (roadmap Project Summary — Component → Storybook → MSW) | Kiểm tra trực quan nhanh trong lúc phát triển component cô lập, trước khi tích hợp vào feature |

### 13.2. Trách nhiệm theo tầng kiến trúc (mục 9)

- **Primitive/Composite** (`shared/ui`, `entities/astrology`): chịu **toàn bộ** trách nhiệm accessibility kỹ thuật (focus management, ARIA role, keyboard nav) — vì đây là nơi duy nhất render DOM thực sự tương tác được.
- **Feature/Page**: chỉ chịu trách nhiệm **accessibility ở mức luồng** (ví dụ: sau khi submit form lỗi, focus có được chuyển tới field lỗi đầu tiên không; sau khi Modal đóng, focus có quay lại đúng trigger không) — không tự implement lại ARIA pattern (luôn dùng Primitive đã làm sẵn).

### 13.3. Không có accessibility "bù sau" cho Chart Wheel

`ChartWheel` (UI Spec §12.5) là rủi ro accessibility lớn nhất hệ thống — kiến trúc **bắt buộc** feature `chart-viewer` render `PlanetTable`/`HouseTable`/`AspectTable` (bảng đọc được) **song song, cùng lúc** với `ChartWheel`, không phải như 1 tính năng "thêm sau nếu có thời gian" — đây là ràng buộc kiến trúc component, không phải checklist QA cuối kỳ (2 component này không được thiết kế để có thể tồn tại độc lập trong `chart-viewer`, xem 9.2 ràng buộc Feature phải compose Composite đã có sẵn accessibility).

---

## 14. Testing Architecture

> UI Spec §23 đã chọn công cụ (Vitest, RTL, MSW, `axe-core`, Playwright) và ưu tiên rủi ro. Mục này định nghĩa **cách tổ chức test trong codebase** và ranh giới giữa các tầng test.

### 14.1. Vị trí test — co-located, không thư mục `__tests__` tách biệt

Test nằm **cạnh** code nó kiểm tra (mục 3.1, quy ước Naming Convention UI Spec §22): `Button/Button.test.tsx` cạnh `Button/index.tsx`; `features/auth/hooks/useLogin.test.ts` cạnh `useLogin.ts`. Lý do: dễ nhận biết code thiếu test (nhìn thư mục thấy ngay thiếu file `.test.tsx`), và xóa feature = xóa luôn test liên quan (không để lại test mồ côi trong `__tests__/` tách biệt).

Ngoại lệ: **E2E test** (Playwright) nằm ở `e2e/` cấp root (ngang hàng `src/`), vì E2E test theo **luồng người dùng** (cross-feature), không thuộc về 1 file/feature cụ thể để co-locate.

### 14.2. Ranh giới Unit / Component / Integration Test

| Tầng | Ví dụ | Render gì | Mock gì |
|---|---|---|---|
| **Unit** | `formatDegree()`, `birthProfileMapper()` | Không render DOM | Không cần mock (hàm thuần) |
| **Component** | `<PlanetTable planets={mockData} />` | 1 component cô lập qua custom `render()` (mục 14.3) | Không gọi API thật — data truyền thẳng qua props (mục 9.2, Composite không tự fetch) |
| **Integration** | `<ChartDetailPage />` toàn bộ, hoặc 1 Feature (`features/birth-profile`) với router thật | Nhiều component ghép lại, qua route thật | **MSW** chặn network layer (mục 14.5) — đây là điểm khác biệt cốt lõi so với Component Test: Integration Test cho phép data-fetching thật chạy, chỉ mock ở biên HTTP |

Vì kiến trúc Composite (`entities/`) **không tự fetch data** (mục 9.2), phần lớn Component Test không cần MSW — đây là hệ quả trực tiếp của quyết định kiến trúc mục 9, không phải may mắn: tách "component nhận props" khỏi "component tự fetch" giúp bản thân việc test rẻ hơn nhiều.

### 14.3. Test Utility dùng chung (`src/test/`)

`src/test/render.tsx` export 1 hàm `renderWithProviders()` bọc sẵn `QueryClientProvider` (với `QueryClient` mới mỗi test, tránh cache rò rỉ giữa test case), `ThemeProvider`, `I18nextProvider`, `MemoryRouter` — mọi Component/Integration Test dùng hàm này thay vì `@testing-library/react` `render()` trực tiếp, để không phải lặp lại setup Provider ở mỗi file test.

### 14.4. Mock Strategy — MSW làm trung tâm

- **1 bộ MSW handler cho mỗi feature** (`features/*/api/mocks/handlers.ts`), ánh xạ đúng path/method theo OpenAPI Spec (mục 8) — khi Backend đổi contract (mục 8.5), handler cần cập nhật cùng lúc với `shared/types/`, cùng 1 Pull Request để không lệch pha.
- Handler tổng hợp toàn bộ trong `src/test/msw-server.ts`, dùng chung cho Component/Integration Test (Vitest) — **và** có thể tái sử dụng cho môi trường dev cô lập (chạy Frontend không cần Backend chạy thật) nếu cần, dù đây không phải mục tiêu chính của MSW trong kiến trúc này (mục tiêu chính là test).
- **Không dùng MSW cho E2E** (Playwright chạy trên môi trường có Backend thật hoặc staging — theo đúng định nghĩa Integration vs E2E ở mục 14.2/UI Spec §23.1).

### 14.5. CI Pipeline — thứ tự chạy test

```
1. Lint (ESLint, bao gồm boundary rule mục 4.7 + jsx-a11y mục 13.1)
2. Type-check (tsc --noEmit, mục 8.5)
3. Unit + Component Test (Vitest, song song, nhanh nhất — fail sớm)
4. Integration Test (Vitest + MSW, chậm hơn)
5. Build (vite build, kèm bundle size check — mục 11.6)
6. E2E (Playwright, chậm nhất, chỉ chạy trên PR nhắm vào `main`/trước release — không bắt buộc mọi commit, để giữ vòng lặp phản hồi nhanh cho commit thường)
```

Thứ tự này tối ưu **fail-fast**: lỗi rẻ tiền phát hiện (lint, type) chặn trước khi tốn thời gian chạy test nặng hơn.

---

## 15. Future Extensibility

### 15.1. Natal Chart → các Chart Type khác (Transit/Synastry/Composite/Progression/Solar Return)

Kiến trúc đã hỗ trợ sẵn mà **không cần tái cấu trúc**: `entities/astrology/chart-wheel` nhận `chartData`/`secondaryChartData` (UI Spec §12.5) qua props thuần túy, không biết "đây là Natal hay Synastry" — sự khác biệt nằm hoàn toàn ở tầng `features/chart-viewer` (fetch đúng endpoint, truyền đúng shape data). Thêm 1 Chart Type mới = thêm logic trong `features/chart-viewer/api` + `hooks`, **không đổi** bất kỳ Composite nào trong `entities/`.

### 15.2. Interpretation Engine (Human/AI source)

Backend đã quyết định "Server tự quyết định nguồn, Client không chọn" (Project Summary). Kiến trúc Frontend phản ánh đúng: `InterpretationCard` (UI Spec §12.6) chỉ hiển thị field `source` đã có sẵn trong response, **không có** UI/state nào cho phép người dùng chọn nguồn — không cần thay đổi kiến trúc nếu Backend sau này thêm nguồn thứ 3 (ví dụ Hybrid), chỉ cần Badge hiển thị thêm 1 variant.

### 15.3. Internationalization (i18n)

`i18next` đã tích hợp từ đầu (không phải "thêm sau"). Kiến trúc namespace hóa theo feature: `locales/vi/auth.json`, `locales/vi/birth-profile.json`, `locales/vi/common.json` — mỗi feature tự khai báo namespace nó cần qua `useTranslation('auth')`, tránh 1 file dịch khổng lồ. Thêm ngôn ngữ mới (ví dụ tiếng Anh cho thị trường quốc tế) = thêm thư mục `locales/en/` với cùng cấu trúc namespace, **không sửa code feature nào** — đã kiểm chứng nguyên tắc này qua yêu cầu line-height/typography UI Spec §4.4 (thiết kế token đã tính sẵn cho đa ngôn ngữ có dấu).

### 15.4. PWA (Progressive Web App)

Chưa triển khai ở MVP, nhưng kiến trúc CSR + Vite tương thích tự nhiên với `vite-plugin-pwa` (thêm Service Worker, Web App Manifest) khi cần — không có quyết định kiến trúc hiện tại nào cản trở việc này (không dùng API chỉ tồn tại khi online-only mà không có fallback state, TanStack Query vốn đã có cache-first behavior gần giống offline-support một phần). Quyết định **kích hoạt** PWA để lại cho Product (Open Question mục 16).

### 15.5. SSR (Server-Side Rendering)

Đã phòng ngừa kiến trúc ở mục 5.4 — nếu SSR được quyết định triển khai (ví dụ chuyển sang Next.js hoặc thêm Vite SSR thủ công), phần **ít phải viết lại nhất** là `features/*` (đã tách data-fetching khỏi component qua hook + `queryOptions` factory theo mục 8.3, tương thích `prefetchQuery` phía server); phần **phải viết lại nhiều nhất** dự kiến là `app/providers` (khởi tạo Provider theo request thay vì 1 lần) và bất kỳ chỗ nào dùng `window`/`localStorage` trực tiếp ngoài `shared/hooks` đã guard (mục 5.4).

### 15.6. Theme Expansion (White-label / Multi-brand)

Kiến trúc token 3 lớp (Global → Alias → Component, UI Spec §2.1) đã tách biệt hoàn toàn giá trị màu khỏi component implementation. Về mặt kiến trúc code, điều này nghĩa là: không component nào trong `shared/ui`/`entities/astrology` import trực tiếp giá trị hex hay tên màu cụ thể (`brass-500`) — chỉ dùng Alias Token (`color-accent-primary`) qua Tailwind class/CSS variable. Thêm 1 theme thứ 3 (brand khác) chỉ cần thêm 1 bộ giá trị Alias Token mới, seletor `data-theme="brand-x"`, không sửa component.

---

## 16. Open Questions

Danh sách quyết định kiến trúc **cố ý để ngỏ**, cần chốt trước hoặc trong quá trình code hóa — phân biệt với Open Question của UI Spec §25 (những câu hỏi đó thuộc phạm vi UX/Product; danh sách dưới đây thuộc phạm vi kỹ thuật/kiến trúc thuần túy):

1. **Công cụ format ngày/giờ**: chưa chốt giữa `date-fns`, `dayjs`, hay `Intl` API thuần (mục 8.4) — ảnh hưởng bundle size (mục 11) và cách format tiếng Việt (locale `vi`). Cần benchmark nhanh trước khi viết `features/*/model/mapper.ts` đầu tiên.
2. **Ngưỡng chuyển từ "viết tay API Service" sang "generate full client SDK"** (mục 8.2): đã chọn viết tay cho MVP, nhưng chưa có con số ngưỡng chính thức (ước lượng "~30 endpoint") — cần quyết định chính thức khi lập kế hoạch Sprint có Chart module (nhiều endpoint hơn Identity/Birth Profile cộng lại).
3. **Công cụ observability/error tracking** (kế thừa UI Spec §25 mục 5, nhắc lại ở đây với khung kiến trúc cụ thể hơn): điểm cắm `shared/lib/report-error.ts` (mục 10.6) đã sẵn sàng, nhưng chưa chọn Sentry hay thay thế khác — không chặn tiến độ code (vì đã cô lập), nhưng nên chốt trước khi launch production.
4. **`eslint-plugin-boundaries` vs quy ước + code review thủ công** (mục 4.7): dự án 1 developer có thể tạm thời chấp nhận enforce bằng review thủ công ở Sprint 1 Frontend, bổ sung tooling tự động khi codebase đủ lớn để rủi ro vi phạm ranh giới tăng lên — cần quyết định điểm bắt đầu enforce cứng.
5. **Store thứ 4 cho `chart-viewer`?**: mục 7.3 hiện chỉ định nghĩa 3 store cố định; nếu `chart-viewer` phát sinh state chia sẻ phức tạp (ví dụ đồng bộ hover/select giữa `ChartWheel` và `PlanetTable` — UI Spec §12.2/12.5 — nếu 2 component này không có quan hệ cha-con đủ gần để dùng `useState` nâng lên 1 cấp), cần quyết định: thêm store thứ 4 riêng cho feature này, hay dùng React Context cục bộ trong phạm vi `ChartDetailPage`. Khuyến nghị sơ bộ: thử Context trước (phạm vi hẹp, không cần Zustand), chỉ nâng cấp lên Zustand nếu Context gây re-render thừa đo được rõ ràng.
6. **Compound Component vs prop `items` phẳng cho `Tabs`/`Accordion`** (mục 9.4): để ngỏ cho lúc code hóa Design System, không ảnh hưởng kiến trúc tổng thể.
7. **Quy trình đồng bộ khi Backend Sprint 3 (Chart module) đóng băng Spec mới** (mục 8.5): quy trình mô tả là nguyên tắc, chưa có checklist/script cụ thể (ví dụ: có tự động diff OpenAPI cũ/mới và cảnh báo breaking change không, hay hoàn toàn thủ công) — nên hình thành trước khi Sprint 3 Backend đóng băng, để không lúng túng lúc cần dùng ngay.
8. **Refresh Token: Cookie hay Response Body** (mục 12.2, 12.4): đây là câu hỏi **chặn tiến độ thực sự** — khác với các câu hỏi khác ở trên (có thể code trước, quyết định sau), luồng Auth (`features/auth`) không thể hoàn thiện nếu chưa có câu trả lời này từ Backend. **Ưu tiên xác nhận cao nhất** trong toàn bộ danh sách Open Question của cả 2 tài liệu.

---

*Hết tài liệu. Frontend Architecture Specification này cùng Frontend UI Specification tạo thành bộ đôi tài liệu bắt buộc đọc trước khi bootstrap `frontend/` project. Mọi thay đổi kiến trúc phát sinh trong quá trình code hóa phải được cập nhật ngược lại tài liệu này trước khi merge, theo đúng nguyên tắc Single Source of Truth.*
