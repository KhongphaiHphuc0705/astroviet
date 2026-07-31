# Sprint F1 — Technical Implementation Plan

## Design System & Frontend Foundation

**Phiên bản:** 1.0
**Trạng thái:** Draft — sẵn sàng triển khai
**Dựa trên:** Frontend UI Specification (Frozen), Frontend Architecture Specification (Frozen), Frontend Coding Standards (Frozen)
**Không thuộc phạm vi tài liệu này:** Đặc tả token/component chi tiết (đã có ở 3 tài liệu trên) — tài liệu này chỉ lập kế hoạch **triển khai theo trình tự nào, mốc nào, tiêu chí hoàn thành nào**

---

## 1. Sprint Overview

### 1.1. Sprint Goal

Xây dựng **nền tảng Frontend dùng lại được** mà mọi Sprint tính năng sau này (F2 — Authentication UI, F3 — Birth Profile UI, F4 — Chart Engine UI...) đều phụ thuộc vào: project đã bootstrap, Design Token đã implement, Shared UI Library đã có, Layout/Routing/Form/Testing đã có khung sẵn. Sprint F1 **kết thúc bằng 1 project chạy được, có UI Kit xem trực quan được, nhưng chưa có bất kỳ tính năng nghiệp vụ nào**.

### 1.2. Giá trị nghiệp vụ (Business Value)

Dù không có tính năng end-user nào trong Sprint này, giá trị nghiệp vụ là **giảm rủi ro và tăng tốc độ mọi Sprint sau**:

- Mỗi component nghiệp vụ ở Sprint F2 trở đi được lắp ráp từ Primitive đã kiểm chứng (đúng token, đúng accessibility baseline) thay vì viết mới từ đầu mỗi lần — giảm thời gian phát triển tính năng thực tế.
- Rủi ro "phát hiện lỗi kiến trúc/token sau khi đã có 10 trang dùng sai" bị loại bỏ — sửa nền tảng khi chưa có gì phụ thuộc vào nó luôn rẻ hơn sửa sau khi đã lan rộng.
- Thiết lập ngay từ đầu kỷ luật kỹ thuật (lint, test, accessibility, Coding Standards) khi codebase còn nhỏ, dễ enforce — trì hoãn thiết lập tới khi có tính năng thực sẽ luôn khó hơn.

### 1.3. Vì sao Sprint này tồn tại (tách riêng khỏi Sprint tính năng)

Đối chiếu trực tiếp cách Backend đã làm (Sprint 0 = Bootstrap thuần túy, tách biệt khỏi Sprint 1 = Identity Module) — Frontend áp dụng đúng triết lý đó: **hạ tầng dùng chung không trộn vào cùng 1 Sprint với tính năng nghiệp vụ đầu tiên**. Trộn lẫn 2 việc này dẫn tới rủi ro cụ thể: quyết định nền tảng (cấu trúc token, baseline component) bị thiết kế vội theo nhu cầu hẹp của 1 tính năng cụ thể (ví dụ Login form) thay vì đúng theo đặc tả tổng quát đã đóng băng ở 3 tài liệu nguồn.

### 1.4. Dependencies

| Phụ thuộc | Trạng thái | Ảnh hưởng tới Sprint F1 |
|---|---|---|
| Frontend UI Specification | 🔒 Frozen | Nguồn duy nhất cho giá trị token, props/variants/states từng component |
| Frontend Architecture Specification | 🔒 Frozen | Nguồn duy nhất cho cấu trúc thư mục, ranh giới tầng, quy ước state/routing |
| Frontend Coding Standards | 🔒 Frozen | Nguồn duy nhất cho quy ước code/test/lint/git |
| Backend OpenAPI Specification | 🔒 Frozen (Sprint 0–2) | **Không dùng trong Sprint F1** — API Integration nằm ngoài phạm vi (mục 1.6); chỉ liên quan gián tiếp qua việc xác nhận `shared/config/env.ts` biết trước base URL API sẽ trỏ tới đâu |
| Node.js / package manager version | Phải khớp Backend (đồng bộ Node LTS đã dùng ở Backend Sprint 0) | Tránh 2 phiên bản Node khác nhau trong cùng 1 repo monorepo |

### 1.5. Phạm vi (Scope)

Đúng 10 hạng mục đã liệt kê ở Deliverables gốc: Project bootstrap, Design Token implementation, Shared UI Library, Layout system, Form foundation, Routing foundation, Theme system, Asset organization, Testing foundation, Documentation. Chi tiết từng hạng mục ở mục 2 (Milestone Breakdown).

### 1.6. Out of Scope — liệt kê tường minh, không mơ hồ

| Không làm trong Sprint F1 | Sprint dự kiến đảm nhiệm |
|---|---|
| Authentication pages (Register/Login UI thật) | F2 |
| Birth Profile pages (CRUD UI thật) | F3 (dự kiến) |
| Chart pages, Astrology Engine integration, Chart rendering thật | Sau khi Backend đóng băng Chart module Spec |
| API Integration thật (gọi endpoint Backend thật) | F2 trở đi — Sprint F1 chỉ dựng **khung** gọi API (interceptor, error normalize) nhưng không có endpoint thật nào được gọi, vì chưa có tính năng nào cần |
| Generate type từ OpenAPI | F2 — hoãn tới khi có nhu cầu thực (Identity Module) tiêu thụ type đó, tránh generate rồi không dùng, dễ lệch khi Backend cập nhật Spec giữa chừng |
| Storybook | Tương lai (đã ghi nhận ở Coding Standards §18.2) — Sprint F1 dùng giải pháp tạm thay thế (mục 2, Milestone M6/M7 — trang UI Kit nội bộ) |
| `eslint-plugin-boundaries` (enforcement tự động ranh giới tầng) | Hoãn tới ngưỡng kích hoạt đã chốt (Architecture Spec §4.7) — Sprint F1 chỉ enforce bằng review thủ công |

---

## 2. Milestone Breakdown

### Tổng quan trình tự

```
M1 Tooling & Project Bootstrap
        ↓
M2 Design Token Implementation
        ↓
M3 Asset Pipeline & Theme Foundation
        ↓
M4 Layout Foundation
        ↓
M5 Shared UI — Form Controls          M6 Shared UI — Display/Feedback/Overlay
        ↓                                       ↓
        └──────────────┬────────────────────────┘
                        ↓
                M7 Forms Foundation
                        ↓
                M8 Routing Foundation
                        ↓
                M9 State & Testing Foundation
                        ↓
                M10 Documentation & Sprint Closure
```

M5/M6 có thể triển khai song song (không phụ thuộc lẫn nhau, chỉ cùng phụ thuộc M2–M4) — với 1 developer duy nhất, thực hiện tuần tự nhưng thứ tự giữa 2 milestone này có thể hoán đổi tự do.

### M1 — Tooling & Project Bootstrap

- **Objectives**: Có 1 project Vite + React + TypeScript chạy được (`npm run dev`), toàn bộ công cụ chất lượng code (lint/format/test) hoạt động và enforce qua Git hook.
- **Deliverables**: `frontend/` khởi tạo trong repo hiện có (ngang hàng `backend/`, không phải workspace monorepo thật — mỗi package độc lập); `package.json` với script chuẩn; ESLint + Prettier + Husky + lint-staged hoạt động; Vitest + Testing Library chạy được 1 test mẫu; Playwright cài đặt + 1 smoke test.
- **Dependencies**: Không — milestone khởi đầu.
- **Acceptance Criteria**: `npm run dev` chạy trang trắng không lỗi console; `npm run lint`/`npm run typecheck`/`npm run test` đều pass; commit thử nghiệm với lỗi lint cố ý bị Husky chặn.

### M2 — Design Token Implementation

- **Objectives**: Toàn bộ token đã chốt ở UI Spec §2–§7, §16.3 và Design System Spec §6–§7 (Radius, Shadow — 2 thang mới định nghĩa ở đó) tồn tại dưới dạng CSS Variable + Tailwind theme extension, dùng được ngay trong class Tailwind.
- **Deliverables**: `app/styles/tokens.css` (Global + Semantic layer, cả Light/Dark); `tailwind.config.ts` map token vào theme; kiểm tra 1 component thử nghiệm dùng đúng token render đúng màu ở cả 2 theme.
- **Dependencies**: M1 (cần Tailwind đã cài).
- **Acceptance Criteria**: Đổi `data-theme` thủ công trên `<html>` (qua DevTools) đổi đúng toàn bộ màu nền/chữ của trang thử nghiệm mà không cần build lại; không 1 giá trị hex/px nào hardcode trong `tailwind.config.ts` ngoài chính bảng ánh xạ token gốc.

### M3 — Asset Pipeline & Theme Foundation

- **Objectives**: Font tự host hoạt động đúng 3 vai trò (Display/UI/Data, UI Spec §4.1), icon Lucide sẵn sàng dùng, và **cơ chế chuyển đổi theme** (không chỉ giá trị token tĩnh như M2) hoạt động qua code — bao gồm chống FOUC, đọc `prefers-color-scheme`, persist lựa chọn.
- **Deliverables**: `public/fonts/*.woff2` (subset Vietnamese + Latin) + khai báo `@font-face`; `ThemeProvider` (Architecture Spec §4.5) + `preferenceStore` (Zustand, Architecture Spec §7.3) quản lý `theme: 'light'|'dark'|'system'`; inline script chống FOUC trong `index.html`.
- **Dependencies**: M2 (cần token Dark/Light đã có sẵn để `ThemeProvider` chuyển đổi giữa chúng).
- **Acceptance Criteria**: Tải lại trang (F5) không có khoảnh khắc nhấp nháy sai theme; chọn `system` và đổi theme hệ điều hành (giả lập qua DevTools) tự động đổi theo; chọn thủ công `dark` rồi F5 lại vẫn giữ `dark` (persist đúng, Architecture Spec §16.1).

### M4 — Layout Foundation

- **Objectives**: 3 Layout Primitive (`Container`/`Stack`/`Grid`) và 3 Layout Component (`AppLayout`/`AuthLayout`/`PublicLayout`, tương ứng UI Spec §10.1/§11) dựng được khung trang, responsive đúng breakpoint.
- **Deliverables**: `shared/ui/Container`, `shared/ui/Stack`, `shared/ui/Grid`; `widgets/app-layout`, `widgets/auth-layout`, `widgets/marketing-layout` (đổi tên `PublicLayout`→`MarketingLayout` cho khớp thuật ngữ đã dùng ở Architecture Spec §3.1 — xem ghi chú mục 8); `Section` (Design System Spec §11.2).
- **Dependencies**: M2 (spacing/breakpoint token), M3 (theme để layout hiển thị đúng cả 2 chế độ).
- **Acceptance Criteria**: `AppLayout` sụp Sidebar thành Drawer đúng dưới `lg` (UI Spec §7.2); `Stack` đổi `direction` theo breakpoint object (UI Spec §9.1) hoạt động đúng trên trang thử nghiệm.

### M5 — Shared UI Library: Form Controls

- **Objectives**: 8 component nhóm Form Control (Button, Input, Textarea, Select, Checkbox, Radio, Switch, và `Label` — tách riêng theo yêu cầu, xem ghi chú mục 7) hoàn thành đủ baseline (Design System Spec §10.1) và Component Test + Accessibility Test.
- **Deliverables**: 8 thư mục component trong `shared/ui/`, mỗi thư mục có `index.tsx` + `ComponentName.test.tsx`.
- **Dependencies**: M2, M3, M4 (dùng `Stack`/token cho layout nội bộ component).
- **Acceptance Criteria**: Mỗi component đạt đủ 6 tiêu chí Component Lifecycle Review (Design System Spec §16.3); `npm run test` pass toàn bộ 8 component; `vitest-axe` không báo lỗi `critical`/`serious`.

### M6 — Shared UI Library: Display, Feedback & Overlay

- **Objectives**: 8 component còn lại của UI Kit Sprint F1 (Card, Badge, Alert, Modal — bao gồm luôn hành vi "Dialog" theo làm rõ Design System Spec §10.4, Spinner, Skeleton, Divider, Avatar).
- **Deliverables**: 8 thư mục component tương tự M5.
- **Dependencies**: M2, M3, M4 — độc lập với M5 (có thể làm song song).
- **Acceptance Criteria**: Giống M5; riêng `Modal` xác nhận focus trap + `Esc` hoạt động đúng bằng test bàn phím thủ công (không chỉ automated test).

### M7 — Forms Foundation

- **Objectives**: Pattern tích hợp React Hook Form + Zod dùng chung cho mọi form tương lai đã hoạt động và **kiểm chứng được** qua 1 form mẫu nội bộ (không phải form nghiệp vụ thật).
- **Deliverables**: Pattern `useZodForm` (hoặc tương đương) chuẩn hóa cách khởi tạo `useForm` + `zodResolver`; mẫu Field wrapper nối `Input`/`Select`/`Checkbox` (M5) với `Controller`/`register` + hiển thị lỗi đúng vị trí (Design System Spec §12.4); 1 form demo trong trang UI Kit (mục 2 M6 note) minh họa toàn bộ validate `onBlur`, error display, disabled/readOnly.
- **Dependencies**: M5 (cần Input/Select/Checkbox đã có).
- **Acceptance Criteria**: Form demo: gõ sai định dạng → rời trường → lỗi hiện đúng vị trí; sửa lại → lỗi biến mất theo `onChange` sau lần đầu (Coding Standards §8.5/Design System Spec §12.3); test bàn phím: submit lỗi tự động focus vào field lỗi đầu tiên (Design System Spec §13.2).

### M8 — Routing Foundation

- **Objectives**: Cây route dựng theo đúng Architecture Spec §6, có Public/Protected/Guest route, Layout route lồng nhau, Error route, toàn bộ lazy-load đúng.
- **Deliverables**: `app/router.tsx` với `createBrowserRouter`; `ProtectedRoute`/`GuestRoute` (guard logic đầy đủ, chạy trên `authStore` stub — xem mục 11); `NotFoundPage`, root `errorElement`; trang UI Kit nội bộ (mục 6) làm route thật để kiểm chứng lazy loading + Suspense fallback hoạt động.
- **Dependencies**: M4 (Layout), M6 (trang UI Kit cần component đã có để hiển thị).
- **Acceptance Criteria**: Vào route không tồn tại → `NotFoundPage`; vào `/app/*` (chưa có trang thật, chỉ placeholder) khi `authStore` stub ở `unauthenticated` → redirect `/login?redirect=...` đúng; Network tab xác nhận mỗi route tải 1 chunk JS riêng (code splitting hoạt động, Architecture Spec §5.2).

### M9 — State Foundation & Testing Foundation

- **Objectives**: Khung 3 Zustand store scaffold đúng cấu trúc (Architecture Spec §7.3) dù phần lớn còn stub; hạ tầng test (custom render, MSW server rỗng, coverage, Playwright config thật) sẵn sàng cho mọi Sprint sau chỉ việc thêm case.
- **Deliverables**: `shared/stores/authStore.ts` (stub, xem mục 11), `uiStore.ts`, `preferenceStore.ts` (M3 đã tạo, hoàn thiện ở đây); `src/test/render.tsx`, `src/test/msw-server.ts` (0 handler), `playwright.config.ts` + 1 smoke E2E (mở trang UI Kit, xác nhận render).
- **Dependencies**: M1 (Vitest/Playwright đã cài), M6 (UI Kit route tồn tại để test).
- **Acceptance Criteria**: `renderWithProviders()` dùng được ngay trong 1 test mẫu không lỗi Provider thiếu; `npm run test:e2e` chạy smoke test Playwright pass; coverage report sinh ra được (chưa cần đạt ngưỡng % cụ thể, đúng triết lý Coding Standards §13 không đặt % cứng).

### M10 — Documentation & Sprint Closure

- **Objectives**: Tài liệu vận hành cập nhật đúng thực tế đã code (không chỉ đúng kế hoạch), sẵn sàng đánh giá Exit Criteria (mục 17).
- **Deliverables**: `frontend/README.md` hoàn chỉnh; cập nhật ngược 4 tài liệu nền tảng nếu có sai lệch phát sinh lúc code hóa (mục 13); danh sách Known Gaps (nếu có) chuyển thành `TODO`/ghi nhận theo đúng Coding Standards §16.
- **Dependencies**: Tất cả milestone trước.
- **Acceptance Criteria**: 1 người mới (giả lập: tự thực hiện lại theo đúng README từ đầu trên môi trường sạch) clone repo, chạy đúng các bước README, project chạy được mà không cần hỏi thêm.

---

## 3. Project Bootstrap

### 3.1. Core Stack — quyết định phiên bản/công cụ cụ thể

| Công cụ | Quyết định | Lý do |
|---|---|---|
| **Vite** | Bản ổn định mới nhất tại thời điểm bootstrap | Đã chốt ở Architecture Spec §5.1 (CSR, không SSR framework) |
| **React** | 18.x (không nhảy sang bản thử nghiệm mới nhất nếu chưa ổn định tại thời điểm bootstrap) | Ưu tiên ổn định — Sprint F1 là nền tảng lâu dài, không phải nơi thử công nghệ mới |
| **TypeScript** | `strict: true` + `noUncheckedIndexedAccess: true` ngay từ commit đầu tiên | Coding Standards §6.1 — không có "bật sau" |
| **TailwindCSS** | Bản 3.x (JS config `tailwind.config.ts`, không dùng CSS-first config của bản 4.x) | Bản 3.x có hệ sinh thái plugin ổn định hơn tại thời điểm này (`prettier-plugin-tailwindcss` cần), và Architecture Spec §3.1 đã tham chiếu tường minh file `tailwind.config.ts` — giữ nhất quán với quyết định đã có sẵn trong tài liệu đóng băng |
| **React Router** | 6.4+ (Data Router API — `createBrowserRouter`) | Đã chốt Architecture Spec §6.1, cần cho `errorElement`/`lazy` loader pattern |

### 3.2. Path Aliases

Cấu hình đồng thời ở **2 nơi** (bắt buộc khớp nhau, sai lệch gây lỗi khó hiểu giữa dev server và type-check):

- `tsconfig.json` → `compilerOptions.paths`: `@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*` (Architecture Spec §3.1).
- `vite.config.ts` → `resolve.alias`: cùng danh sách, cùng thứ tự — dùng `vite-tsconfig-paths` plugin để tự động đồng bộ 2 nơi từ 1 nguồn (`tsconfig.json`), tránh phải sửa 2 chỗ mỗi khi thêm alias.

### 3.3. Environment Variables

- Toàn bộ biến môi trường có tiền tố `VITE_` (bắt buộc theo cơ chế Vite để expose ra client bundle).
- `shared/config/env.ts` là **điểm đọc `import.meta.env` duy nhất** (Architecture Spec §4.1) — validate qua Zod schema ngay khi module này load, throw lỗi rõ ràng lúc build/dev-start nếu thiếu biến bắt buộc (fail-fast, không để lỗi "biến undefined" xuất hiện âm thầm lúc runtime ở 1 tính năng xa xôi).
- Sprint F1 chỉ cần khai báo biến **chưa thực sự dùng** (`VITE_API_BASE_URL`) vì chưa gọi API thật (mục 1.6) — khai báo trước để `env.ts` có sẵn khung, Sprint F2 chỉ việc dùng, không phải dựng lại cơ chế.

### 3.4. ESLint

- **Flat config** (`eslint.config.js`, ESLint 9+) — chọn flat config vì đây là hướng chuẩn hiện tại của hệ sinh thái, tránh phải migrate lại gần như ngay sau khi bootstrap.
- Plugin bắt buộc: `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks` (bật `exhaustive-deps` ở mức `error`, Coding Standards §5.5), `eslint-plugin-jsx-a11y` (Design System Spec §13.1), `eslint-plugin-import` (rule `import/order`, Coding Standards §14.5), `no-console` (mức `error`, chỉ cho phép `warn`/`error`, Coding Standards §10.4).
- `eslint-plugin-boundaries`: **cài đặt nhưng cấu hình rule ở trạng thái tắt** (không xóa hoàn toàn khỏi `devDependencies`) — quyết định có chủ đích: khi ngưỡng kích hoạt tới (Architecture Spec §4.7), chỉ cần bật rule trong config, không phải cài mới + học cấu hình giữa chừng 1 Sprint tính năng đang gấp.

### 3.5. Prettier

`prettier-plugin-tailwindcss` bắt buộc (Coding Standards §7.2, tự sắp xếp thứ tự class) — cấu hình `.prettierrc` dùng chung 1 bộ rule (không override riêng file nào), format-on-save khuyến nghị ở cấp editor (ghi trong README, không enforce được bằng tool).

### 3.6. Husky + lint-staged

`frontend/` có Husky + lint-staged **hoàn toàn độc lập** của riêng nó — repo không phải 1 workspace monorepo thật (không có `package.json`/`workspaces` ở root), `backend/` cũng có `.husky/` riêng của chính nó, không có hook nào ở root để "mở rộng". `frontend/.husky/pre-commit` chạy `lint-staged` cấu hình riêng cho file trong `frontend/`: `*.{ts,tsx}` → `eslint --fix` + `tsc --noEmit` (chỉ file liên quan, không toàn repo, giữ pre-commit nhanh); `*.{ts,tsx,css,md}` → `prettier --write`.

### 3.7. Vitest + Testing Library

- `vitest.config.ts` (hoặc tích hợp trong `vite.config.ts` qua `test` field) — môi trường `jsdom`.
- `@testing-library/react`, `@testing-library/jest-dom` (matcher mở rộng), `@testing-library/user-event` (mô phỏng tương tác thật hơn `fireEvent` thô — ưu tiên dùng cho mọi Component Test theo Coding Standards §13.2).
- `vitest-axe` cho Accessibility Test (Design System Spec §16.3).

### 3.8. Playwright (Placeholder)

Cài đặt + `playwright.config.ts` cấu hình đúng `baseURL` trỏ dev server, nhưng **chỉ 1 smoke test duy nhất** trong Sprint F1 (mở trang UI Kit, xác nhận render không lỗi) — đúng tinh thần "placeholder" của Deliverables gốc: hạ tầng sẵn sàng, chưa viết E2E nghiệp vụ vì chưa có nghiệp vụ nào tồn tại (mục 1.6).

### 3.9. Build Scripts (`package.json`)

| Script | Việc làm |
|---|---|
| `dev` | Vite dev server |
| `build` | `tsc --noEmit && vite build` (type-check trước khi build, fail sớm) |
| `preview` | Xem thử bản build |
| `lint` | ESLint toàn bộ `src/` |
| `format` | Prettier `--write` toàn bộ |
| `typecheck` | `tsc --noEmit` |
| `test` | Vitest (unit + component) |
| `test:coverage` | Vitest kèm coverage report |
| `test:e2e` | Playwright |
| `prepare` | Cài Husky hook (chạy tự động sau `npm install`) |

---

## 4. Folder Structure

### 4.1. Cấu trúc được tạo trong Sprint F1

Đầy đủ khung thư mục theo Architecture Spec §3.1 — nhưng **không phải mọi thư mục đều có nội dung thật** trong Sprint này. Bảng dưới phân loại rõ:

| Thư mục | Trạng thái cuối Sprint F1 |
|---|---|
| `app/` | Có nội dung thật — Provider, Router, style bootstrap (M1–M3, M8, M9) |
| `pages/` | Chỉ có `errors/not-found-page.tsx` + `dev/style-guide-page.tsx` (mục 2, M6/M8) — **không có page nghiệp vụ nào** |
| `widgets/` | Có nội dung thật — `app-layout`, `auth-layout`, `marketing-layout` (M4) |
| `features/` | **Rỗng có chủ đích** — chỉ có 1 file `.gitkeep` + `README.md` ngắn giải thích đây là nơi Sprint F2 trở đi sẽ thêm feature module, tránh thư mục rỗng gây hiểu lầm "quên tạo" |
| `entities/` | **Rỗng có chủ đích**, tương tự `features/` — `entities/astrology/` chưa tồn tại vì chưa có Chart module |
| `shared/ui` | Có nội dung thật — 16 component (M5, M6) |
| `shared/api` | Chỉ có `client.ts` (Axios instance + interceptor **cấu trúc sẵn**, chưa gọi endpoint thật nào — mục 1.6) |
| `shared/lib` | Có nội dung thật tối thiểu — `cn()`, có thể thêm `formatDegree()` **placeholder chưa dùng** nếu cần cho demo (quyết định tại chỗ, không bắt buộc) |
| `shared/hooks` | Có nội dung thật tối thiểu — `useMediaQuery` (cần cho Layout responsive nếu không giải quyết đủ bằng CSS) |
| `shared/stores` | Có nội dung thật (dạng stub) — 3 store (M9) |
| `shared/config` | Có nội dung thật — `env.ts` (mục 3.3) |
| `shared/types` | **Rỗng có chủ đích** — chưa generate từ OpenAPI (mục 1.6) |
| `locales/` | Có nội dung thật tối thiểu — namespace `common` (dùng cho `NotFoundPage`, UI Kit), chưa có namespace nghiệp vụ nào |
| `test/` | Có nội dung thật — `render.tsx`, `msw-server.ts` (M9) |

### 4.2. Vì sao tạo thư mục rỗng có `.gitkeep` thay vì không tạo

Quyết định có chủ đích: tạo sẵn `features/README.md`/`entities/README.md` mô tả ngắn gọn "thư mục này dùng cho gì, xem Architecture Spec §4.2/§4.3" giúp Sprint F2 bắt đầu đúng ngay thư mục đã có sẵn ngữ cảnh, thay vì phải tự nhớ lại cấu trúc từ tài liệu — chi phí gần như 0, lợi ích onboarding rõ ràng (kể cả onboarding lại chính mình sau vài tháng).

---

## 5. Design Token Implementation

### 5.1. Nguồn sự thật cho từng nhóm token

| Nhóm | Nguồn đặc tả | Ghi chú triển khai |
|---|---|---|
| Colors | UI Spec §3 | Global (`brass-*`, `ink-*`...) khai báo `:root`; Semantic khai báo theo `[data-theme]` (mục 6) |
| Typography | UI Spec §4 | Font-face (mục 3, Asset Pipeline M3); type scale qua Tailwind `fontSize` extend, dùng cú pháp `[size, { lineHeight, letterSpacing }]` để 1 class Tailwind mang đủ cả 3 thuộc tính, tránh phải cộng thêm class `leading-*` riêng dễ quên |
| Spacing | UI Spec §6 | Tailwind `spacing` extend theo đúng thang `space-0`...`space-32` — **không dùng thang mặc định của Tailwind song song** (phải override hoàn toàn, không mở rộng thêm, tránh 2 hệ thang cùng tồn tại) |
| Radius | Design System Spec §6 | Tailwind `borderRadius` extend — 5 giá trị đúng tên (`radius-sm`...`radius-full`) |
| Shadows | Design System Spec §7 | Tailwind `boxShadow` extend — 5 mức elevation; giá trị Dark Mode (opacity cao hơn, Design System Spec §7.1 ghi chú) triển khai qua CSS Variable đổi theo `[data-theme]`, **không** qua Tailwind variant `dark:` (giữ nhất quán cơ chế theme với Semantic Color — 1 cơ chế `data-theme` duy nhất cho mọi loại token đổi theo theme) |
| Motion | UI Spec §19.3 | Tailwind `transitionDuration`/`transitionTimingFunction` extend |
| Breakpoints | UI Spec §7.1 | Tailwind `screens` extend — khớp chính xác 6 bậc, **ghi đè** breakpoint mặc định Tailwind (không cộng thêm) |
| Z-index | UI Spec §16.3 | Tailwind `zIndex` extend theo đúng 7 tên (`z-dropdown`...`z-toast`) — cấm dùng số z-index trần trong bất kỳ component nào ngoài bảng này |

### 5.2. Naming Strategy khi map sang Tailwind

Tên token giữ **nguyên vẹn** khi map sang Tailwind config key (`color-accent-primary` → class `bg-accent-primary`/`text-accent-primary`) — không rút gọn hay đổi tên cho "gọn class" (ví dụ không đổi thành `bg-accent`), vì làm vậy tạo ra **2 tên khác nhau cho cùng 1 khái niệm** (tên trong tài liệu Design System vs tên trong code) — vi phạm trực tiếp nguyên tắc Consistency (Design System Spec §1.3) mà không có lý do kỹ thuật bắt buộc.

### 5.3. Cấu trúc file token

```
app/styles/
├── tokens.css       # Global + Semantic Token (CSS Variable), cả [data-theme="light"] và [data-theme="dark"]
└── base.css         # Tailwind @layer base (font-face import, reset tối thiểu)
```

`tailwind.config.ts` **đọc giá trị từ `tokens.css`** thông qua `var(--token-name)` trong phần `theme.extend` (không định nghĩa giá trị số/hex trùng lặp ở cả 2 nơi) — CSS Variable là nguồn sự thật duy nhất, Tailwind config chỉ là "cầu nối" đặt tên class, không phải nơi lưu giá trị thứ 2.

---

## 6. Theme Foundation

### 6.1. Cơ chế CSS Variables theo `[data-theme]`

Đúng cơ chế đã chốt UI Spec §16.1: mọi Semantic Token định nghĩa 2 lần trong `tokens.css`, dưới `[data-theme="light"]` và `[data-theme="dark"]`; component không bao giờ biết đang ở theme nào, chỉ dùng tên Semantic Token.

### 6.2. Light Theme

Giá trị mặc định — khi `data-theme` chưa được set (trước khi `ThemeProvider` chạy lần đầu, hoặc fallback nếu JS lỗi), CSS vẫn phải hiển thị đúng Light Theme nhờ `:root` (không `[data-theme]`-scoped) đã có giá trị Light làm mặc định song song với khai báo `[data-theme="light"]` — đảm bảo trang không "trắng xóa không style" trong bất kỳ tình huống lỗi nào.

### 6.3. Cơ chế chống FOUC (Flash of Unstyled/Wrong Content)

Inline `<script>` **đặt trong `<head>` của `index.html`**, chạy **trước** khi bất kỳ CSS/React nào load: đọc `localStorage` (key theme, khớp field `preferenceStore` sẽ đọc lại sau đó), hoặc `prefers-color-scheme` nếu chưa có lựa chọn lưu, set `data-theme` ngay lập tức lên `<html>`. Đây là **kỹ thuật bắt buộc phải làm bằng script thuần**, không thể làm bằng React component (React chỉ chạy sau khi bundle JS tải xong, quá muộn để tránh flash).

### 6.4. Sẵn sàng cho Dark Theme — không phải "compatibility", mà là "đã implement song song"

Theo đúng ghi chú đã nêu ở Design System Spec §15.1: Dark Theme **không phải** tính năng "tương lai" cần tương thích, mà **được implement đồng thời với Light Theme trong M2/M3** vì token Dark đã có sẵn giá trị cụ thể — không có lý do kỹ thuật để trì hoãn implement Dark Mode sang Sprint sau. Sprint F1 hoàn thành nghĩa là: `data-theme="dark"` set thủ công (qua toggle demo trong UI Kit, mục 2 M6/M8) hiển thị đúng 100% màu Dark đã đặc tả — không phải "khung sẵn sàng, giá trị làm sau".

---

## 7. Shared UI Components

### 7.1. Đối chiếu danh sách yêu cầu với UI Spec/Design System Spec — 2 điểm cần làm rõ trước khi triển khai

**`Label`**: UI Spec §9.2 mô tả `Input` có prop `label` tích hợp sẵn, không liệt `Label` như 1 component độc lập. Yêu cầu Sprint này liệt `Label` riêng — quyết định triển khai: tạo `Label` như **1 Primitive nhỏ độc lập** (`<label>` + style Type Token `text-label`, UI Spec §4.2) mà `Input`/`Textarea`/`Select`/`Checkbox`/`Radio`/`Switch` đều **compose** bên trong thay vì mỗi component tự style riêng phần label của nó. Đây không phải mâu thuẫn với UI Spec — là 1 chi tiết implementation hợp lý hơn (tránh lặp style label ở 6 component), và **không đổi API bên ngoài** của `Input`... (person vẫn truyền `label` như 1 prop, `Input` tự dùng `Label` bên trong). Cập nhật ghi chú này ngược lại UI Spec §9.2 ở cuối Sprint (mục 13).

**`Dialog`**: Theo đúng làm rõ đã có ở Design System Spec §10.4 — không tạo component `Dialog` riêng, `Modal` đã hiện thực hóa đầy đủ ARIA Dialog Pattern.

### 7.2. Danh sách triển khai — 16 component (đối chiếu M5 + M6)

| Nhóm (M5) | Nhóm (M6) |
|---|---|
| Button, Input, Textarea, Select, Checkbox, Radio, Switch, Label | Card, Badge, Alert, Modal, Spinner, Skeleton, Divider, Avatar |

Đặc tả Props/Variants/Sizes/States/Accessibility đầy đủ cho từng component: **UI Spec §9** (nguồn duy nhất — không lặp lại ở tài liệu này). Composition rule tổng quát: **Universal Component Contract** (Design System Spec §10.1).

### 7.3. Composition Principles áp dụng khi code hóa

1. **`Label` là Primitive độc lập nhưng không bao giờ đứng 1 mình trong UI Kit demo** — luôn compose bên trong 1 Form Control khác (mục 7.1), giữ đúng tinh thần "primitive chỉ thực sự hữu ích khi ghép với primitive khác" (Coding Standards §2.5).
2. **`Input`/`Textarea`/`Select` dùng chung 1 khối hiển thị lỗi/helper text nội bộ** (không viết lại 3 lần) — tách thành 1 sub-component nội bộ dùng chung trong `shared/ui`, không export ra `index.ts` của thư mục cha (giữ đúng quy tắc "1 file 1 export chính", Coding Standards §3.1 — sub-component thực sự riêng tư).
3. **`Modal` implement engine positioning/focus-trap 1 lần**, các Overlay khác (`Dropdown`, `Popover`, `Tooltip`) — dù **không** thuộc phạm vi Sprint F1 (không có trong danh sách 16 component) — thiết kế `Modal` sao cho phần lõi (focus trap, `Esc` handler) **tách được** thành hook dùng lại (`useDialogBehavior` nội bộ `shared/ui`), để Sprint sau thêm `Drawer`/`Popover`/`Dropdown` không viết lại logic này từ đầu (đúng nguyên tắc Architecture Spec §9.5 "1 engine positioning dùng chung", chuẩn bị trước phần lõi không phụ thuộc UI dù chưa cần tới UI đó ngay).
4. **`Skeleton` không tạo sẵn preset composite** (`SkeletonPlanetTable`...) trong Sprint F1 — preset đó gắn với component nghiệp vụ (`entities/astrology`) chưa tồn tại (mục 1.6); Sprint F1 chỉ dựng `Skeleton` Primitive (`variant="text"|"circle"|"rectangle"`).

### 7.4. Trang UI Kit nội bộ — thay thế tạm cho Storybook

Route `/dev/style-guide` (chỉ tồn tại trong môi trường `development`, loại khỏi bundle production qua `import.meta.env.DEV` guard ở `router.tsx`) hiển thị toàn bộ 16 component với đủ variant/size/state, cả 2 theme (toggle demo, mục 6.4), là **bằng chứng trực quan** cho Acceptance Criteria của M5/M6/M7 — thay thế tạm thời cho Storybook (Coding Standards §18.2, chưa thiết lập). Khi Storybook được thiết lập ở Sprint sau, trang này **deprecate** theo đúng quy trình Design System Spec §17.3 (không xóa đột ngột, có Migration Note).

---

## 8. Layout Foundation

### 8.1. Danh sách triển khai và đối chiếu tên gọi

| Yêu cầu Sprint | Tên chính thức trong Architecture Spec §3.1 | Ghi chú |
|---|---|---|
| App Layout | `widgets/app-layout` | Navbar + Sidebar + ContentContainer (UI Spec §11) |
| Auth Layout | `widgets/auth-layout` | Khớp tên |
| Public Layout | `widgets/marketing-layout` | **Đổi tên** — yêu cầu Sprint dùng "Public Layout" nhưng Architecture Spec §3.1 đã chốt tên `marketing-layout`; giữ tên đã đóng băng trong Architecture Spec (nguồn có thẩm quyền cao hơn), không tạo tên mới song song gây nhầm lẫn 2 tên cho cùng 1 khái niệm |
| Container, Grid, Stack | `shared/ui/Container`, `Grid`, `Stack` | Khớp tên (UI Spec §9.1) |
| Section | `shared/ui` (bổ sung, Design System Spec §11.2) | Chưa có trong UI Spec §9 gốc — đã bổ sung khi viết Design System Spec, Sprint F1 code hóa theo bổ sung đó |

### 8.2. Nội dung thật vs. Placeholder trong 3 Layout Component

Vì Sprint F1 không có Authentication/Feature nào (mục 1.6), nội dung **bên trong** 3 Layout có giới hạn thực tế:

- **`AppLayout`**: Navbar hiển thị **đúng cấu trúc** (logo, vị trí nav-link, vị trí Avatar/Auth button) nhưng nav-link trỏ tới route chưa tồn tại (disabled hoặc trỏ `/dev/style-guide` tạm) — Sidebar hiển thị đúng cấu trúc responsive (mục 2 M4 Acceptance Criteria) với nav-item placeholder.
- **`AuthLayout`**: Khung đúng 100% (logo căn giữa, `Divider variant="ring"` trang trí mờ, UI Spec §10.1) — không có Form thật bên trong (Form thật là Sprint F2), demo tạm bằng `Card` trống có ghi chú "Auth form — Sprint F2".
- **`MarketingLayout`**: Navbar + Footer đúng cấu trúc — nội dung trang chủ (Landing Page thật) **không** thuộc Sprint F1 (mục 1.6); trang `/` tạm thời redirect hoặc hiện placeholder tối giản.

### 8.3. Trách nhiệm Responsive — kiểm chứng bằng Layout Foundation, không đợi tới Component sau

Đúng quy tắc Architecture Spec §6.5 (layout chỉ là khung chứa thụ động) — Sprint F1 xác nhận **toàn bộ hành vi responsive tầng Layout** (Sidebar↔Drawer, Navbar sticky+blur khi cuộn — UI Spec §11.1) hoạt động đúng **trước khi** bất kỳ component nghiệp vụ nào tồn tại để đặt bên trong, cô lập rõ "lỗi layout" khỏi "lỗi component" khi debug Sprint sau.

---

## 9. Forms Foundation

### 9.1. React Hook Form Integration — pattern chuẩn hóa

Không mỗi form tự `useForm()` rồi tự nối `zodResolver` theo cách khác nhau — Sprint F1 dựng **1 pattern chuẩn** (custom hook mỏng bọc `useForm`, tự động nhận `schema` Zod và trả về đúng type suy ra từ schema đó qua `z.infer`) để mọi form nghiệp vụ Sprint sau bắt đầu giống hệt nhau về cách khởi tạo, chỉ khác `schema`/`onSubmit`.

### 9.2. Validation Abstraction

- Zod là công cụ **duy nhất** định nghĩa validation rule (đã chốt Architecture Spec §15.3/Coding Standards §8.5) — Sprint F1 không viết bất kỳ rule validate thủ công song song nào.
- Pattern chuẩn hóa việc parse lỗi Zod thành format `Field wrapper` (mục 9.3) hiểu được — 1 hàm tiện ích (`shared/lib`) chuyển `ZodError` → cấu trúc lỗi theo field, dùng chung cho mọi form (không phải mỗi form tự viết lại cách đọc `error.issues`).

### 9.3. Error Presentation

Nối đúng quy tắc đã chốt ở Design System Spec §12.3–§12.5: validate `onBlur` mặc định, chuyển `onChange` sau lần lỗi đầu tiên của field đó; lỗi hiện đúng 1 vị trí cố định dưới control, thay thế Help Text khi cả 2 cùng tồn tại. Field wrapper (mục 7.3 điểm 2) là nơi **duy nhất** implement quy tắc này — component nghiệp vụ Sprint sau chỉ dùng Field wrapper, không tự viết lại logic hiển thị lỗi.

### 9.4. Accessibility

Submit form lỗi → focus tự động chuyển tới field lỗi đầu tiên theo thứ tự DOM (Design System Spec §13.2, kiểm chứng cụ thể ở M7 Acceptance Criteria) — implement qua `setFocus()` của React Hook Form trong `onError` callback của `handleSubmit`, không tự viết logic tìm DOM node thủ công.

### 9.5. Không tích hợp Backend — ranh giới rõ với Sprint F2

Form demo trong UI Kit (mục 7.4) `onSubmit` chỉ `console.info` (ngoại lệ hợp lệ duy nhất cho phép `console` trong Sprint F1, vì đây là code demo không merge vào luồng sản phẩm thật, gắn rõ comment giải thích) — không gọi bất kỳ API thật nào (mục 1.6). Pattern (`useZodForm`, Field wrapper) thiết kế sao cho Sprint F2 chỉ cần thêm `useMutation` (Architecture Spec §7.1) vào `onSubmit`, không sửa lại phần validation/error display đã có.

---

## 10. Routing Foundation

### 10.1. Route Organization

Cây route dựng theo Architecture Spec §6.1, nhưng với **route thật tối thiểu** vì chưa có tính năng (mục 1.6):

```
/                          MarketingLayout > (placeholder — "Coming soon")
/dev/style-guide           (chỉ DEV) > UI Kit demo page
/login, /register          AuthLayout > placeholder "Sprint F2"
/app                       ProtectedRoute > AppLayout > placeholder "Sprint F2/F3"
*                          NotFoundPage
```

### 10.2. Public Routes

`/`, `/dev/style-guide` (chỉ môi trường dev) — không cần qua bất kỳ guard nào.

### 10.3. Protected Routes

`/app/*` bọc `ProtectedRoute` (Architecture Spec §6.3–6.4) — logic guard **implement đầy đủ** (3 trạng thái `resolving`/`authenticated`/`unauthenticated`) dù chạy trên `authStore` stub (mục 11) luôn trả về `unauthenticated` sau 1 lần "resolve" giả lập (`setTimeout` ngắn mô phỏng độ trễ silent-refresh thật, để hành vi `resolving` cũng kiểm chứng được, không chỉ 2 trạng thái còn lại).

### 10.4. Guest Routes

`/login`, `/register` — route "chỉ dành cho chưa đăng nhập" (Architecture Spec §6, khái niệm `GuestOnlyRoute` được nhắc sơ) — Sprint F1 implement guard đơn giản: nếu `authStore.status === 'authenticated'` → redirect `/app`; do `authStore` stub luôn `unauthenticated`, guard này **không quan sát được hành vi redirect thật** trong Sprint F1 (chỉ xác nhận bằng code review logic đúng, không phải bằng thao tác tay) — sẽ kiểm chứng đầy đủ khi Sprint F2 có Login thật đổi được `status`.

### 10.5. Layout Routes

Lồng nhau đúng Architecture Spec §6.5 — mỗi Layout Component (mục 8) chỉ render đúng 1 cấp `<Outlet />`.

### 10.6. Error Routes

`errorElement` cấp root (Architecture Spec §6.6) implement đầy đủ dù Sprint F1 khó "cố ý gây lỗi render" để test tự nhiên — kiểm chứng bằng cách tạm thời throw lỗi giả trong 1 component demo, xác nhận `errorElement` bắt được, rồi xóa code throw giả trước khi merge (không để lại code throw giả trong `main`).

### 10.7. Lazy Loading

100% `pages/*` qua `React.lazy()` (Architecture Spec §5.2) — kể cả các trang placeholder ít nội dung trong Sprint F1, giữ đúng pattern ngay từ đầu để Sprint sau thay nội dung placeholder bằng nội dung thật mà không phải nhớ quay lại thêm `lazy()`.

---

## 11. State Foundation

### 11.1. Vì sao Sprint F1 chỉ cần state management tối thiểu

Toàn bộ Server State thật sự (mục lớn nhất trong kiến trúc state, Architecture Spec §7.1) **không tồn tại trong Sprint F1** vì không có API Integration (mục 1.6) — không có gì để TanStack Query cache. Local Component State và Context chỉ cần cho **hành vi UI thuần túy** (mở/đóng Modal demo, giá trị form demo) — không có state nghiệp vụ nào phức tạp tới mức cần thiết kế trước. Đây là hệ quả trực tiếp của phạm vi Sprint (mục 1.6), không phải thiếu sót — cố tình dựng nhiều state management hơn mức cần vi phạm YAGNI (Coding Standards §2.2).

### 11.2. Local State

Dùng trong UI Kit demo (mục 7.4) và Layout demo — không có quy tắc riêng ngoài Coding Standards §8.2 đã chốt.

### 11.3. Context

Không có nhu cầu Context thực sự trong Sprint F1 (chưa có `ChartWheel`/`PlanetTable` — trường hợp dùng Context đã xác định trước, Architecture Spec §16 OQ5) — không tạo Context "phòng xa" cho nhu cầu chưa tồn tại.

### 11.4. Server State Placeholder

`shared/api/client.ts` dựng đủ cấu trúc (interceptor request gắn token, response interceptor chuẩn hóa `ApiError`, refresh-on-401 — Architecture Spec §8.1, §10.1, §12.2) nhưng **không có API service nào gọi nó** trong Sprint F1 — interceptor kiểm chứng bằng Unit Test giả lập response lỗi (MSW handler test riêng, không phải endpoint thật), không phải bằng cách gọi Backend thật.

### 11.5. Future Zustand Integration — 3 Store dạng Stub

| Store | Nội dung Sprint F1 |
|---|---|
| `authStore` | Đúng shape 3-trạng thái (Architecture Spec §7.3) + hàm `login()`/`logout()` **tồn tại nhưng thân hàm rỗng/giả lập** (không gọi API thật) — đủ để `ProtectedRoute`/`GuestRoute` (mục 10) compile và chạy được đúng logic |
| `uiStore` | Đầy đủ thật — `sidebarCollapsed` dùng ngay ở `AppLayout` (mục 8) |
| `preferenceStore` | Đầy đủ thật — `theme` dùng ngay ở `ThemeProvider` (mục 6), `densityMode` khai báo trước nhưng chưa có bảng dữ liệu nào (Planet Table...) để áp dụng thật |

### 11.6. Future TanStack Query Integration

Cài đặt `@tanstack/react-query`, cấu hình `QueryClientProvider` (Architecture Spec §4.5) với `defaultOptions` đã quyết định (Architecture Spec §10.2) — nhưng **0 query/mutation thật nào được viết** trong Sprint F1. Việc cài đặt trước (dù chưa dùng) có lý do cụ thể: xác nhận `QueryClientProvider` không xung đột thứ tự lồng Provider với `ThemeProvider`/Router (mục 6, Architecture Spec §4.5) ngay từ Sprint nền tảng, tránh Sprint F2 vừa thêm feature vừa phải debug thứ tự Provider.

---

## 12. Testing Foundation

### 12.1. Component Testing

Hạ tầng: `src/test/render.tsx` (`renderWithProviders`, Architecture Spec §14.3/Coding Standards §13). Áp dụng thật ngay trong Sprint F1 cho toàn bộ 16 component (mục 7) — đây là Sprint duy nhất có tỷ lệ "component có test / component tồn tại" phải đạt 100%, vì toàn bộ component của Sprint này đều là Design System component (bắt buộc theo Design System Spec §16.3), không có ngoại lệ "feature gấp nên bỏ qua test" như có thể xảy ra ở Sprint tính năng sau.

### 12.2. Accessibility Testing

`vitest-axe` chạy kèm mỗi Component Test của `shared/ui` (Design System Spec §16.3) — bổ sung 1 lượt kiểm tra bàn phím **thủ công** (không automated) cho: `Modal` (focus trap, mục 6 M6), Form demo (mục 9.4 submit-focus-error) — 2 hành vi này khó kiểm chứng đầy đủ bằng `vitest-axe` (axe kiểm cấu trúc DOM/ARIA tĩnh tốt hơn hành vi tương tác động).

### 12.3. Snapshot Policy

**Không dùng Snapshot Test** (`toMatchSnapshot()`) trong Sprint F1, và khuyến nghị hạn chế xuyên suốt dự án — snapshot dễ bị "approve mù" (chấp nhận diff mà không thực sự đọc) khi thay đổi UI nhỏ liên tục, không phù hợp triết lý Component Test "test hành vi quan sát được" đã chốt (Coding Standards §13.2) hơn là "test hình dạng output". Thay thế: assertion tường minh (`expect(screen.getByRole(...)).toBeInTheDocument()`, kiểm tra thuộc tính cụ thể).

### 12.4. Mock Organization

`src/test/msw-server.ts` dựng sẵn khung tổng hợp handler (Architecture Spec §14.4) — **0 handler thật** trong Sprint F1 (không có API service nào cần mock, mục 1.6/11.4). 1 handler demo duy nhất (giả lập lỗi 401 cho Unit Test của interceptor, mục 11.4) đặt tạm trong `shared/api/client.test.ts` cạnh test đó, **không** đặt trong `features/*/api/mocks/` (thư mục đó thuộc về feature chưa tồn tại).

### 12.5. Future E2E Strategy

Playwright config thật (mục 3.8) + 1 smoke test duy nhất. Chiến lược đầy đủ (test theo luồng người dùng đa bước — Register→Login, mục UI Spec §23.1) **hoãn tới khi có luồng thật để test** — viết E2E test cho luồng chưa tồn tại là kiểm tra placeholder, không có giá trị thật, chỉ tạo cảm giác an toàn giả.

---

## 13. Documentation

### 13.1. Danh sách tài liệu phải cập nhật trong Sprint F1

| Tài liệu | Cập nhật gì | Bắt buộc/Tùy điều kiện |
|---|---|---|
| `frontend/README.md` | Toàn bộ — chưa tồn tại trước Sprint F1 | Bắt buộc (mục 2 M10) |
| Frontend UI Specification §9.2 | Ghi chú `Label` triển khai thành Primitive độc lập compose bên trong Form Control (mục 7.1) | Bắt buộc nếu phát sinh đúng như dự kiến |
| Frontend Architecture Specification §3.1 | Xác nhận `marketing-layout` (không đổi tên) — không cần sửa, chỉ đối chiếu | Không cần sửa (mục 8.1 đã dùng đúng tên có sẵn) |
| Design System Specification | Không dự kiến cần sửa — Sprint F1 code hóa đúng theo đặc tả đã có | Chỉ sửa nếu phát sinh sai lệch thực tế lúc code |
| Frontend Coding Standards | Không dự kiến cần sửa | Tương tự |
| Changelog nội bộ Design System (Design System Spec §16.5) | Ghi nhận version `0.1.0` — lần đầu code hóa Primitive, mọi thứ đều `MINOR` (thêm mới, không có gì để "đổi") | Bắt buộc — bắt đầu thói quen versioning ngay từ Sprint đầu tiên có code thật |

### 13.2. Nguyên tắc cập nhật — trong cùng PR, không tách riêng

Nhắc lại Coding Standards §18.3: bất kỳ sai lệch nào phát hiện lúc code hóa (như trường hợp `Label` mục 7.1, hoặc bất kỳ phát sinh khác chưa lường trước) được cập nhật ngược lại tài liệu nguồn **trong cùng PR** với code liên quan, không backlog "cập nhật tài liệu sau".

---

## 14. Risks

### 14.1. Technical Risks

| Rủi ro | Khả năng | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| Token CSS Variable + Tailwind config lệch pha (sửa 1 nơi quên nơi kia) | Trung bình | Cao — bug thị giác âm thầm | `tailwind.config.ts` đọc `var(--token)` thay vì hardcode giá trị (mục 5.3) — về mặt kỹ thuật loại bỏ khả năng lệch pha, không chỉ nhắc nhở kỷ luật |
| FOUC script (mục 6.3) chạy sai thứ tự do thay đổi cấu trúc `index.html` sau này | Thấp | Trung bình — flash theme khi F5, ảnh hưởng trải nghiệm | Comment rõ ràng trong `index.html` giải thích script này **phải** đứng trước mọi `<link>`/`<script>` khác; test thủ công F5 nhiều lần mỗi khi sửa `index.html` |

### 14.2. Architecture Risks

| Rủi ro | Khả năng | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| `authStore` stub (mục 11.5) được thiết kế sai giả định, Sprint F2 phải đổi shape khi thêm logic thật | Trung bình | Cao — `ProtectedRoute`/`GuestRoute` (mục 10) có thể phải viết lại | Thiết kế `authStore` bám sát **chính xác** shape 3-trạng thái đã có sẵn trong Architecture Spec §7.3/§6.4 (không tự sáng tạo thêm field) — giảm rủi ro bằng cách không tự quyết định gì ngoài tài liệu đã đóng băng |
| Trang UI Kit (`/dev/style-guide`) phình to, trở thành "nơi chứa mọi thử nghiệm" thay vì chỉ demo | Trung bình | Thấp — nợ kỹ thuật cục bộ, không lan ra codebase chính | Route này **không** import bởi bất kỳ page nào khác — cô lập hoàn toàn, dễ xóa/deprecate (mục 7.4) khi Storybook thay thế |

### 14.3. Scalability Risks

| Rủi ro | Khả năng | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| 16 component code hóa cùng lúc không có review chéo (1 developer) dễ lệch chuẩn dần theo thời gian (component đầu và component cuối Sprint "phong cách" khác nhau) | Trung bình | Trung bình | Dùng Universal Component Contract (Design System Spec §10.1) như checklist **áp lại cho component đầu tiên sau khi hoàn thành component cuối cùng** — tự review chéo thời gian, không chỉ review 1 lần lúc mới viết |
| Thư mục `features/`/`entities/` rỗng (mục 4.1) có thể khiến Sprint F2 "tiện tay" đặt sai chỗ vì chưa quen | Thấp | Trung bình | `.gitkeep` + `README.md` mỗi thư mục (mục 4.2) trỏ thẳng về đúng section Architecture Spec |

### 14.4. Developer Experience Risks

| Rủi ro | Khả năng | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| Husky/lint-staged cấu hình sai khiến pre-commit chậm (chạy toàn repo thay vì chỉ file staged) | Trung bình | Trung bình — làm chậm vòng lặp phát triển hàng ngày | Cấu hình `lint-staged` tường minh theo pattern file (mục 3.6), đo thời gian pre-commit thực tế trước khi coi M1 hoàn thành |
| Path alias (mục 3.2) cấu hình lệch giữa `tsconfig.json` và Vite gây lỗi "tìm không thấy module" khó hiểu | Trung bình | Trung bình | Dùng `vite-tsconfig-paths` để 1 nguồn duy nhất, loại bỏ khả năng lệch cấu hình bằng kỹ thuật thay vì kỷ luật (cùng logic mục 14.1) |

---

## 15. Deliverables

### 15.1. Artifact List đầy đủ

- [ ] `frontend/` project khởi tạo trong repo, chạy được `npm run dev`.
- [ ] Bộ công cụ chất lượng code hoạt động: ESLint (flat config), Prettier, Husky + lint-staged, Vitest + Testing Library + vitest-axe, Playwright (config + 1 smoke test).
- [ ] `tokens.css` (Global + Semantic, Light + Dark) và `tailwind.config.ts` map đầy đủ 8 nhóm token (mục 5.1).
- [ ] `ThemeProvider` + FOUC-prevention script + `preferenceStore` hoạt động đầy đủ 2 theme.
- [ ] Font tự host (3 vai trò) + Lucide icon sẵn sàng dùng.
- [ ] 3 Layout Primitive (`Container`/`Stack`/`Grid`) + `Section` + 3 Layout Component (`AppLayout`/`AuthLayout`/`MarketingLayout`).
- [ ] 16 Shared UI Component, mỗi component có Component Test + Accessibility Test.
- [ ] Forms Foundation: `useZodForm` pattern + Field wrapper + 1 form demo hoàn chỉnh hành vi.
- [ ] Route tree đầy đủ (Public/Protected/Guest/Layout/Error routes) với lazy loading 100%.
- [ ] 3 Zustand store (2 thật — `uiStore`/`preferenceStore`, 1 stub có chủ đích — `authStore`).
- [ ] `shared/api/client.ts` với interceptor đầy đủ (chưa gọi endpoint thật).
- [ ] `src/test/render.tsx` + `src/test/msw-server.ts` (khung, 0 handler nghiệp vụ).
- [ ] Trang `/dev/style-guide` (chỉ DEV) tổng hợp toàn bộ 16 component + theme toggle demo.
- [ ] `frontend/README.md` hoàn chỉnh.
- [ ] Cập nhật ngược tài liệu nguồn nếu phát sinh sai lệch (mục 13.1).

---

## 16. Acceptance Criteria

> Tiêu chí đo được, áp dụng cho **toàn Sprint** (khác Acceptance Criteria riêng từng milestone ở mục 2).

1. **Build sạch**: `npm run build` thành công, 0 lỗi TypeScript, 0 lỗi ESLint.
2. **Test xanh**: `npm run test` pass 100% (toàn bộ 16 component + interceptor test); `npm run test:e2e` pass (1 smoke test).
3. **Accessibility baseline**: `vitest-axe` không báo lỗi `critical`/`serious` trên bất kỳ component nào trong `shared/ui`.
4. **Theme hoạt động đầy đủ**: chuyển đổi Light ↔ Dark tại `/dev/style-guide` phản ánh đúng 100% giá trị token đã đặc tả (đối chiếu trực quan với UI Spec §3.3–3.4), không có phần tử nào "quên" đổi theme.
5. **Responsive đầy đủ**: `AppLayout` (Sidebar↔Drawer), `AspectTable`-style card-per-row pattern *(không áp dụng — chưa có bảng dữ liệu thật, tiêu chí này hoãn tới Sprint có component bảng — ghi nhận rõ để không đánh giá nhầm Sprint F1 thiếu sót)*, `Stack` responsive direction hoạt động đúng tại 6 breakpoint.
6. **Pre-commit hook hoạt động**: commit chứa lỗi lint cố ý bị chặn; commit hợp lệ chạy qua không quá X giây (X đo thực tế, ghi vào README, không phải số áp đặt trước).
7. **Không có code nghiệp vụ nào lọt vào Sprint F1**: rà soát `features/`/`entities/` chỉ chứa `README.md`/`.gitkeep`, không có logic nghiệp vụ thật (đối chiếu mục 1.6).
8. **Tài liệu đồng bộ**: README chạy đúng theo đúng trình tự viết, không bước nào bị bỏ sót hoặc sai (mục 2, M10 Acceptance Criteria).

---

## 17. Exit Criteria

Sprint F1 được coi là **hoàn thành và sẵn sàng bắt đầu Sprint F2 (Authentication UI)** khi và chỉ khi toàn bộ điều kiện sau đồng thời đúng:

1. Toàn bộ 10 Milestone (mục 2) đạt Acceptance Criteria riêng của milestone đó.
2. Toàn bộ 8 điều mục Acceptance Criteria cấp Sprint (mục 16) đạt.
3. Toàn bộ 15 Deliverable (mục 15) tồn tại và kiểm chứng được (không phải "coi như đã có").
4. `frontend/README.md` đủ để 1 người mới hoàn toàn (giả lập bằng cách tự thực hiện lại từ đầu trên máy/container sạch) tự chạy được project mà không cần hỏi thêm câu nào.
5. **Không còn `FIXME` nào trong code Sprint F1** (Coding Standards §16.2 — `FIXME` trong code mới là điều kiện chặn merge, áp dụng nghiêm ngặt hơn ở Sprint nền tảng vì đây là code mọi Sprint sau sẽ xây dựa trên đó).
6. `authStore` stub (mục 11.5) đã được review đối chiếu **chính xác** khớp shape Architecture Spec §7.3/§6.4 — đây là điều kiện riêng, tách khỏi các điều kiện chung, vì đây là điểm rủi ro kiến trúc lớn nhất đã xác định (mục 14.2) và là nền tảng trực tiếp Sprint F2 sẽ mở rộng ngay lập tức.
7. Không có Deliverable nào của Sprint F2 (Authentication pages, API Integration thật) vô tình đã được implement sớm trong Sprint F1 — xác nhận ranh giới phạm vi (mục 1.6) được tôn trọng nghiêm ngặt tới cuối Sprint, không "tiện tay làm luôn" phá vỡ tính tách bạch 2 Sprint.

Khi cả 7 điều kiện trên đồng thời đúng, Sprint F2 (Authentication UI) có thể bắt đầu trên nền tảng đã kiểm chứng đầy đủ, không cần quay lại sửa hạ tầng giữa chừng.

---

*Hết tài liệu. Sprint F1 Technical Implementation Plan này là kế hoạch triển khai cụ thể hóa 4 tài liệu nền tảng Frontend (UI Spec / Architecture Spec / Design System Spec / Coding Standards) thành công việc thực thi theo trình tự — không giới thiệu bất kỳ quyết định kiến trúc/thiết kế mới nào ngoài phạm vi 4 tài liệu đó, trừ các điểm làm rõ/bổ sung nhỏ đã ghi chú tường minh (mục 7.1, 8.1) kèm cam kết cập nhật ngược tài liệu nguồn (mục 13).*
