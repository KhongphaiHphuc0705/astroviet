# Frontend Sprint F6 — Knowledge Base — Implementation Plan

## 1. Document Metadata

| | |
|---|---|
| **Dự án** | AstroViet — Frontend Sprint F6: Knowledge Base (MVP, Frontend-only) |
| **Trạng thái tài liệu** | **PLAN v1.2 — 100% quyết định chặn tiến độ đã được Owner duyệt (Mục 3, Mục 14; gồm D-F6-A1 ngày 2026-11-18).** Đang triển khai các milestone ban đầu. |
| **Repo / nhánh đã audit** | `KhongphaiHphuc0705/astroviet`, nhánh `dev`, HEAD `23f965a` (2026-11-13, "[docs] update ui spec, registry, changelog, m8 matrix & f5 final report" — commit này đã được amend so với `7104081`; plan M7-8 đã bị xoá khỏi repo theo quy ước) |
| **Ngày lập / phiên bản** | v1.0: 2026-11-14 · v1.1: 2026-11-16 · **v1.2: 2026-11-18** (chốt D-F6-A1, Suspense boundary parity ở SSR tree, loadEnv prerender) |
| **Tên & vị trí đề xuất** | `docs/implementation/Sprint_F6_Implementation_Plan.md` (plan tạm ở `docs/implementation/`, xoá khi đóng sprint — quy ước F5). Matrix/Registry/Report lưu ở `docs/implementation/archive/sprint-f6/` |
| **Về prompt đính kèm** | File có tiêu đề "Implementation Prompt" (yêu cầu *triển khai*). Theo yêu cầu của Owner trong phiên này ("tạo plan") và preference "xác nhận quyết định trước khi sinh mã", tài liệu này **chỉ lập kế hoạch**; không có dòng mã nào được thêm vào repo |

**Nhãn độ tin cậy**

| Nhãn | Nghĩa |
|---|---|
| **[VF]** | Verified — đọc trực tiếp từ repo/tài liệu/`npm view`, hoặc tôi tự chạy |
| **[SPIKE]** | Verified bằng **spike thử nghiệm trong `/tmp`** (dự án riêng, hoặc bản sao repo có `node_modules` symlink, chỉ-đọc) — **không** phải mã đề xuất, **không** nằm trong repo |
| **[AD]** | Quyết định đã được Owner duyệt (trong phiên này hoặc tài liệu repo) |
| **[REC]** | Đề xuất của plan, **chưa** duyệt |
| **[UNK]** | Chưa biết / chưa xác minh |
| **[PLAN]** | Kết quả dự kiến, chưa thực hiện |

> **Giới hạn.** Tôi chưa chạy bất kỳ test/E2E/CI nào của F6 (chưa có mã F6). Hosting production, tên miền và cấu hình Nginx thực tế **chưa biết**. Spike chứng minh *render phía server* và an toàn Markdown; **chưa** chứng minh *hydration* của app thật.

---

## 2. Executive Summary

### 2.1 Mục tiêu
Cho Guest duyệt, lọc theo 5 chủ đề và đọc 10–15 (mục tiêu 15) bài viết chiêm tinh dạng Markdown trong repo, **không** cần Backend/API/Admin; các route `/knowledge` và `/knowledge/:slug` được **prerender lúc build** cho SEO.

### 2.2 Phát hiện chính
| # | Phát hiện | Hệ quả |
|---|---|---|
| F1 | Prerender **khả thi bằng công cụ sẵn có**: Vite 6 (`vite build --ssr`) + `react-dom/server` + `StaticRouter` (có trong `react-router-dom` 7.18.2) — **không cần plugin/framework/dependency** [SPIKE]. Cả `MarketingLayout` thật render được trong Node, không lỗi `window`/`document` [SPIKE] | Có thể prerender **layout đầy đủ + bài viết** (không chỉ phần nội dung) → ít nhảy bố cục |
| F2 | Chưa chứng minh **hydration**: `main.tsx` dùng `createRoot` (xoá DOM prerender khi mount) và route dùng `lazy()` (hiện spinner trong lúc tải chunk) → nếu giữ `createRoot` sẽ có nháy "bài → spinner → bài" | Cần quyết định chiến lược client (D-F6-P2) và cổng kiểm chứng |
| F3 | `react-markdown` **10.1.0** (peer `react >=18` ✓ với React 18.3.1): thêm ≈ **+121 kB raw / +37 kB gzip** vào bundle client và **+82 gói** phụ thuộc bắc cầu [SPIKE] | Chỉ nạp trong chunk route Knowledge (lazy); cần Owner chấp nhận thêm 1 dependency chính + chuỗi cung ứng |
| F4 | Mặc định `react-markdown` **đã** trung hoà `javascript:`/`data:` (href → `""`) nhưng **vẫn render `<a href="">` với `target="_blank"`**; HTML thô mặc định bị **escape thành chữ**, với `skipHtml` bị **loại bỏ** [SPIKE] | Cần chính sách URL tường minh trong component `a`; chọn `skipHtml` |
| F5 | **Không có tiện ích SEO/metadata nào** trong repo (chỉ `<title>AstroViet</title>` tĩnh trong `index.html` và `document.title` rải rác ở page); router có TODO `OQ-M8-1` (title động) [VF] | F6 phải tạo hook meta **có phạm vi hẹp** trong feature; **không** đóng OQ-M8-1 |
| F6 | **Chưa có biến môi trường URL site**: `env.ts` (zod) chỉ có `VITE_API_BASE_URL` [VF] | Cần `VITE_SITE_URL` (mới) cho canonical/sitemap/OG; không hardcode domain |
| F7 | Footer hiện chỉ có **một dòng bản quyền**, Navbar chỉ có "Trang chủ" và "Giới thiệu" (cả hai trỏ `/`) và **không** có ThemeToggle/Language Switcher như UI Spec §11 [VF] | "Thêm Kiến thức vào Navbar và Footer" cần phạm vi Footer tối thiểu (D-F6-N1) |
| F8 | UI Spec §13 hàng `/knowledge` ghi dùng **`Pagination`**, §18.3 ghi empty state theo **tìm kiếm**; cả hai trái D-F6-08 (chỉ lọc chủ đề). `shared/ui` **không có** Pagination/Tabs/Chip [VF] | Sửa Spec as-built; copy empty state mới cần duyệt |
| F9 | `vite preview` phục vụ file tĩnh phẳng `dist/knowledge/<slug>.html` tại URL `/knowledge/<slug>` (200, đúng `<title>`), slug lạ rơi về SPA fallback [SPIKE] | Có thể kiểm output build thật mà không cần server mới; **Nginx production** cần `try_files $uri $uri.html /index.html` (repo không có cấu hình Nginx — [UNK]) |
| F10 | Dự án đã có mẫu để tái dùng: `Card`, `Grid`, `Badge`, `Container`, `Section`, `Stack`, `EmptyState`, `Button as={Link}`, `SkipLink`; routing lazy trong `router.tsx`; `vitest-axe`; ESLint `jsx-a11y`; E2E guest/không-Backend (smoke) [VF] | Không tạo component trùng lặp |
| F11 | **Chỉ một** định nghĩa "AC-24" trong repo: F5 plan dòng 505 — "Heading không nhảy cấp; vai trò/tên truy cập đúng (test)" [VF grep] | KB-AC-24 tham chiếu đúng câu này; số KB-AC-xx không xung đột số AC-xx của F5 |
| F12 | Glossary dự án có trong tài liệu (`Astrology_Domain_Specification.md` §8, `Astrology_Engine_Specification.md` §10.1) và nhãn tiếng Việt trong mã (`features/chart/model/labels.ts`: "Sao Hỏa", …) [VF]; **không** có tiêu chuẩn biên tập riêng | Bài viết phải dùng thuật ngữ nhất quán với hai nguồn này |
| F13 | **Layout file:** với sơ đồ `dist/knowledge/index.html` cho danh sách, `/knowledge` (canonical, không `/` cuối) trả **SPA shell**; chỉ `/knowledge/` trả bản prerender. Thêm `dist/knowledge.html` thì `/knowledge` trả đúng bản prerender [SPIKE `vite preview`]. Ví dụ Nginx `location /knowledge/ { … =404; }` cũng không khớp `/knowledge` | Chốt `dist/knowledge.html` + `knowledge/<slug>.html` (+ `knowledge/index.html` tuỳ chọn) — D-F6-P5b |
| F14 | **Nhãn góc chiếu** nằm ở **một nguồn duy nhất** `ASPECT_TYPE_LABELS` (`features/chart/model/labels.ts` dòng 79/81/83), đi qua `chartViewModel.ts:667` → `aspect.type.labelVi` → bảng/badge/legend/aria; chỉ **3 file test** gõ cứng nhãn và **1 dòng UI Spec** (§12.11); Backend, seed và E2E không phụ thuộc [VF quét repo] | Micro-change F6.0b |
| F15 | CI chạy `npm run build` **trước** khi cài Playwright browsers; E2E chạy trên dev server nên **không thấy** HTML prerender | Cổng hydration là script cục bộ (D-F6-P2b), không vào CI |
| F16 | Hydration cần sửa `main.tsx` (hiện chỉ `createRoot`), trong khi điều kiện P1#1 nói "không thay đổi entry CSR hiện tại" | Làm rõ D-F6-A1 |

### 2.3 Cách tiếp cận đề xuất (tóm tắt)
- Nội dung `.md` + manifest TypeScript + `knowledgeContentService`; `react-markdown` (`skipHtml`, chính sách URL tường minh).
- **Prerender build-time, phạm vi KB-only**: script Node nhỏ + Vite SSR build; xuất `dist/knowledge.html`, `dist/knowledge/<slug>.html`, `sitemap.xml`, `robots.txt`; script **tự kiểm** output (fail build nếu thiếu `<h1>`/title/description/canonical).
- App vẫn CSR cho mọi route khác; không SSR toàn app, không framework.

---

## 3. Decisions Provided by the Owner

### 3.1 Nhật ký quyết định [AD]
| ID | Quyết định | Nguồn |
|---|---|---|
| D-F6-OWN-1 | Thêm `react-markdown`; **chưa** thêm `remark-gfm` — chỉ khi bài viết thật cần bảng/task list/strikethrough (= D-F6-G) | phiên 2026-11-14; `Confirmation.md` |
| D-F6-OWN-2 | Lọc theo chủ đề là đủ; không pagination/search ở MVP | phiên 2026-11-14 |
| D-F6-OWN-3 | Prerender KB ngay từ đầu | phiên 2026-11-14 |
| D-F6-OWN-4 | MVP: diễn giải theo cung/nhà; góc chiếu và FR-08 sang v1.1; Guest tạo lá số sang v1.1 | phiên trước |
| D-F6-01…15 | Frontend-only, `.md` + `import.meta.glob`, manifest TS, `react-markdown`, 5 danh mục, chỉ lọc, `65ch`, "Kiến thức" ở Navbar/Footer, CSR mặc định + prerender KB, ảnh, Git-based, `knowledgeContentService`, tách khỏi diễn giải lá số | prompt đính kèm |
| D-F6-P1 | **P1** (Vite SSR build + Node script) — duyệt về kiến trúc, kèm 6 điều kiện: SSR entry riêng; script đọc manifest; render nội dung + metadata từng route; output được kiểm (không thiếu nội dung, không trùng metadata, không sai canonical); SSR không kéo mã chỉ-browser; không đổi Backend/Chart calculation | `Confirmation.md` |
| D-F6-P2 | Client: **(b)** `hydrateRoot` chỉ cho route KB có marker `data-prerendered`; kiểm trước hydrate (đúng trang/route/phiên bản markup); route khác giữ `createRoot`; đăng ký `onRecoverableError`; **không** tự `createRoot` lần hai; không dùng teardown/remount chưa được thiết kế + kiểm thử; cổng: 0 cảnh báo hydration, nội dung ban đầu không biến mất, không lỗi console nghiêm trọng, CLS < 0,1, route CSR khác không ảnh hưởng; **fallback duyệt = (a)** | `Confirmation.md` |
| D-F6-P2b | Cổng hydration = **script riêng dùng Playwright API trên `vite preview`**; Owner chạy cục bộ và ghi bằng chứng; **không** đổi `playwright.config.ts`/CI | phản hồi 2026-11-16 |
| D-F6-P3 | Tích hợp bước prerender vào `npm run build` | `Confirmation.md` |
| D-F6-P4 | `VITE_SITE_URL`: production prerender bắt buộc URL hợp lệ (thiếu/sai ⇒ build fail, không sinh canonical/sitemap giả); local cho phép fallback `http://localhost:5173`; chuẩn hoá URL (không `//`); canonical, sitemap, OG dùng **cùng một nguồn**; không điền domain giả | `Confirmation.md` |
| D-F6-P4b | Tín hiệu "production" = cờ **`PRERENDER_STRICT`** | phản hồi 2026-11-16 |
| D-F6-P5 | File phẳng; URL công khai không có `.html`; canonical không có `/` cuối; Nginx phải map URL→file và không trả nhầm SPA `index.html` cho bài đã prerender | `Confirmation.md` |
| D-F6-P5b | Layout: **`dist/knowledge.html`** (danh sách, bản chính) + tuỳ chọn `dist/knowledge/index.html` (cho `/knowledge/`) + `dist/knowledge/<slug>.html` | phản hồi 2026-11-16 |
| D-F6-S1 | Sitemap = `/knowledge` + URL bài (chỉ URL thực sự truy cập được; không có `/`); robots theo đề xuất | `Confirmation.md` |
| D-F6-D1 | `og:image`: chấp nhận Known Gap ở MVP | `Confirmation.md` |
| D-F6-N1 | (a): Navbar thêm **một** liên kết "Kiến thức"; Footer **một** `nav aria-label="Chân trang"` tối thiểu (không hiển thị chữ "Chân trang"); không tái cấu trúc; deviation có chủ đích so với UI Spec §11 (cập nhật Spec as-built; Footer 3 cột/menu đầy đủ vẫn backlog) | `Confirmation.md` |
| D-F6-U1 | Duyệt toàn bộ chuỗi UI (Mục 14.3) + quy tắc: `{n}` = số bài sau lọc; ngày `dd/MM/yyyy` từ `updatedAt`; "Xem tất cả bài viết" **thực sự reset filter**; "← Tất cả bài viết" → `/knowledge`; tên danh mục theo glossary/ngôn ngữ UI hiện tại | `Confirmation.md` |
| D-F6-C1 | 15 tiêu đề tiếng Việt chuẩn hoá (Mục 11.1), giữ slug | `Confirmation.md` |
| D-F6-C2 | "Khái niệm cơ bản" đứng đầu | phản hồi 2026-11-16 |
| D-F6-X1 | Typography: xử lý cục bộ (không đụng token toàn cục) | `Confirmation.md` |
| D-F6-T1 | E2E giữ trên `npm run dev`; prerender bảo đảm bằng script tự kiểm trên build thật | `Confirmation.md` |
| D-F6-K | Cập nhật Architecture §5.1 ghi nhận ngoại lệ prerender KB | `Confirmation.md` |
| D-F6-R | Tên: `Sprint_F6_Closure_Report.md`, `Sprint_F6_Known_Gaps_Registry.md`, `Sprint_F6_*_Exit_Criteria_Evidence_Matrix.md` | `Confirmation.md` |
| D-F6-V | F5 đã merge `main` (PR #67 — [VF]); Owner xác nhận đã gắn tag `v0.4.0` (**chưa thấy tag trên origin** ở lần kiểm 2026-11-16: chỉ `v0.3.0` — [UNK]); thay đổi F6 ghi dưới `[Unreleased]` | `Confirmation.md` |
| D-F6-H | Hosting/Nginx staging **chưa tồn tại**; không thuộc DoD F6; nếu cần, gộp thành **một task "deploy readiness"** trong plan sau; F6 chỉ ghi yêu cầu `try_files` và Known Gap | phản hồi 2026-11-16 |
| D-F6-L1 | Đổi nhãn góc chiếu thành **micro-change riêng (F6.0b)** trước F6.6: Hợp → **Trùng tụ**, Vuông chiếu → **Vuông góc**, Đối xung → **Đối đỉnh**; Lục hợp, Tam hợp giữ nguyên | phản hồi 2026-11-16 |
| D-F6-L2 | Chỉ sửa UI Spec (ví dụ aria-label §12.11); **giữ nguyên** tài liệu lưu trữ lịch sử (Matrix/plan F4–F5, `m6_s_accessibility_tree.json`) | phản hồi 2026-11-16 |
| D-F6-L3 | Ghi 5 nhãn cuối vào **một nơi duy nhất** — UI Spec §12.11 — làm nguồn chuẩn; thêm test nội dung KB cảnh báo nhãn cũ | phản hồi 2026-11-16 |
| D-F6-A1 | Không đổi hành vi CSR hiện tại: `main.tsx` chỉ thêm một nhánh có điều kiện gọi module tách biệt `src/app/hydrate.ts` | phản hồi 2026-11-18 |
| D-F6.2-01 | Cấu trúc `model/` + `ui/` theo thực tế repo `features/chart` (không tạo `services/`, `data/`, `lib/`) | `Confirmation.md` 2026-11-20 |
| D-F6.2-02 | Glob **lazy theo bài** kết hợp API service async (thay vì eager trong chunk) | `Confirmation.md` 2026-11-20 |
| D-F6.2-03 | Manifest F6.2 dùng Phương án B (1 bài mẫu `what-is-astrology.md` để test pipeline + content lint, kèm Known Gap KG-F6-01/02) | `Confirmation.md` 2026-11-20 |
| D-F6.2-04 | Ảnh chỉ cho phép cục bộ `public/knowledge/images/` + khóa slug dành riêng `index`, `images` | `Confirmation.md` 2026-11-20 |
| D-F6.2-05 | Link ngoài chỉ cho phép scheme `https:`; từ chối `http:`, `mailto:`, `tel:` | `Confirmation.md` 2026-11-20 |
| D-F6.2-06 | Hỗ trợ tối thiểu `pre > code` và inline code (không highlight cú pháp) | `Confirmation.md` 2026-11-20 |
| D-F6.2-07 | Định dạng tiêu đề thống nhất với repo: `{Tiêu đề} — AstroViet` | `Confirmation.md` 2026-11-20 |
| D-F6.2-08 | `react-markdown` ghim phiên bản chính xác `@10.1.0` với `--save-exact` | `Confirmation.md` 2026-11-20 |

### 3.2 Không còn quyết định chặn
Toàn bộ các quyết định chặn trước đây (P1, P2, P4, U1, C1, C2, và D-F6-A1) đã được Owner phê duyệt dứt khoát [AD]. Các điểm làm rõ kỹ thuật A2–A6 (Mục 14.2) là các chi tiết đề xuất không chặn tiến độ.

---

## 4. Repository Audit Findings

### 4.1 Nguồn đã đọc [VF]
| Nhóm | Nguồn |
|---|---|
| PRD | `docs/product/PRD.md`: FR-12/13/14 (dòng 169–171), §3.1 phạm vi, §8 roadmap |
| Architecture | `Frontend_Architecture_Specification.md`: §5.1 (CSR, dòng 292–298), §5.4 (SSR phòng ngừa), §12.3 (dòng 594–606: markdown/HTML, ảnh KB), §15.5 (dòng 731–733: "Vite SSR thủ công"), cây thư mục (dòng 152, 171); `Project_Architecture_Specification.md` dòng 872–904 (Nginx/VPS/Docker) |
| UI Spec | §11.1 Navbar (dòng 743–750), §11.2 Footer (752–757), §13 bảng route, §14.1 cây route (987–988 trong "Backlog F5+"), §18.3 Empty State (1102–1111) |
| Mã | `package.json`, `vite.config.ts`, `tsconfig.app.json`, `eslint.config.js`, `index.html`, `src/main.tsx`, `src/app/router.tsx`, `src/shared/config/env.ts`, `src/widgets/marketing-layout/index.tsx`, `src/pages/{home,errors}/*`, `src/shared/ui/*`, `src/test/render.tsx`, `e2e/*`, `.github/workflows/frontend-ci.yml`, `frontend/CHANGELOG.md`, `features/chart/model/labels.ts` |

### 4.2 Hiện trạng kỹ thuật liên quan [VF]
| Hạng mục | Thực tế |
|---|---|
| Stack/phiên bản | React 18.3.1, `react-router-dom` 7.18.2, Vite 6.4.3, `@vitejs/plugin-react` 4.7.0, Vitest + jsdom + RTL, `vitest-axe`, Playwright (1 project chromium), npm; `"type": "module"`, `engines.node >=22.18.0`; TS `erasableSyntaxOnly` (**không dùng `enum`**), `verbatimModuleSyntax`, `types: ["vite/client"]` (có `import.meta.glob`) |
| Scripts | `build`: `tsc -p tsconfig.app.json --noEmit && vite build`; `dev`, `preview`, `lint`, `typecheck`, `test`, `test:e2e`; **không có** prerender/postbuild |
| `vite.config.ts` | plugins `react()`, `tsconfigPaths()`; **không có** khối `build`/`ssr` |
| Alias | `@app @pages @widgets @features @entities @shared @test` |
| ESLint | `no-console` (cho phép `warn/error`), `import/order` (alphabetize), `jsx-a11y/recommended`; `boundaries/element-types` **off** (TODO) |
| `index.html` | có script theme inline (`data-theme`), `<title>AstroViet</title>`, `lang="vi"`, `#root` + `#modal-root` — **prerender phải bắt đầu từ `dist/index.html` đã build** để giữ script theme và tham chiếu asset băm |
| `main.tsx` | `registerAuthInfrastructure()` rồi `createRoot(...).render(<StrictMode><App/></StrictMode>)` |
| Router | `createBrowserRouter`; `routesConfig` export; cây `/` → `errorElement` → nhóm `MarketingLayout` (chỉ `index: HomePage`), `GuestRoute`, `ProtectedRoute`/`AppLayout`, `*` NotFound; trang lazy bằng `lazy()` + `SuspenseFallback` |
| `MarketingLayout` | `Stack` + `SkipLink` (→ `#main-content`) + header sticky 64px + `nav aria-label="Điều hướng chính"` (desktop `lg`) + drawer mobile (placeholder, TODO focus trap) + `<main id="main-content" tabIndex={-1}>` + footer 1 dòng; dùng `useAuthStore`/`useUiStore` (zustand). Trạng thái auth khởi tạo `resolving` ⇒ lần render đầu **chưa** có nút Đăng nhập/Đăng ký |
| `HomePage` | placeholder "Trang chủ / AstroViet — Coming soon"; smoke E2E đang assert chuỗi này |
| `NotFoundPage` | `h-screen` căn giữa, `h1` "404" — **không** phù hợp để nhúng trong `MarketingLayout` |
| Env | `env.ts` parse `import.meta.env` bằng zod, chỉ `VITE_API_BASE_URL` bắt buộc; `.env.example` chỉ 1 dòng |
| Public assets | `public/favicon.svg`, `public/fonts/`; chưa có `robots.txt`/`sitemap.xml`/`public/knowledge/` |
| Metadata | không có hook/tiện ích; `document.title` được đặt cục bộ ở vài page; TODO `OQ-M8-1` |
| E2E | `testDir ./e2e`; CI chạy E2E cùng Backend thật; mẫu guest: `smoke.spec.ts`; mẫu quan sát lỗi console/API: `interpretation.spec.ts` (`attachErrorObservers`, allowlist `/auth/refresh`) |
| CI | `frontend-ci.yml`: format → lint → typecheck → test:coverage → build → (Backend) → E2E; `paths` filter `frontend/**`, `backend/**`; Node 22; `cp .env.example .env` |
| Phát hành | `frontend` ở `0.4.0`; tag git hiện có chỉ `v0.3.0` (tag `v0.4.0` của F5 **chưa thấy** — [UNK], hành động của Owner) |
| Hạ tầng | Backend: Docker Compose + Nginx/VPS (`Project_Architecture` §18); FE tĩnh: "Static file (nếu cần)" — **không có** cấu hình Nginx/hosting FE trong repo |

### 4.3 Xung đột giữa prompt/quyết định và tài liệu repo
| ID | Xung đột | Đề xuất xử lý |
|---|---|---|
| C1 | UI Spec §13 `/knowledge`: "Danh sách bài viết (`Pagination`)" ↔ D-F6-08 (không phân trang) | Sửa Spec as-built (§13); ghi rõ "không phân trang ở MVP" |
| C2 | UI Spec §18.3: empty state KB theo **tìm kiếm** ↔ F6 chỉ lọc chủ đề | Thêm dòng empty state theo bộ lọc; copy mới **cần Owner duyệt** |
| C3 | UI Spec §11.1 Navbar: "Natal Chart \| Transit \| Synastry \| Kiến thức" + Language Switcher + Theme Toggle ↔ thực tế 2 liên kết giữ chỗ | F6 chỉ thêm "Kiến thức"; **không** thêm Transit/Synastry; ghi nhận chênh lệch Spec (không sửa phạm vi ngoài F6) |
| C4 | UI Spec §11.2 Footer 3 cột (Sản phẩm/Tài nguyên/Pháp lý) ↔ footer 1 dòng | **Đã giải quyết (D-F6-N1 a):** Footer một `nav aria-label="Chân trang"` tối thiểu chỉ có "Kiến thức"; Footer 3 cột vẫn backlog, ghi vào Spec as-built |
| C5 | UI Spec §14.1: `/knowledge*` thuộc "Backlog F5+" | Chuyển sang đã triển khai khi đóng sprint |
| C6 | D-F6-03 ví dụ `eager: true` ↔ nhúng toàn bộ nội dung vào chunk | Giữ `eager` **bên trong chunk lazy của route KB** (đơn giản, không có trạng thái loading, thân thiện hydration); đo kích thước ở F6.2; đổi sang lazy-glob nếu chunk quá lớn |
| C7 | Prompt yêu cầu "heading Markdown bắt đầu từ H2" ↔ không có quy ước biên tập | Quy tắc nội dung: **cấm `#` (H1) trong `.md`**, không nhảy cấp; có test (KB-AC-35) |
| C8 | D-F6-11 "không hardcode domain" ↔ không có cấu hình URL site | Thêm `VITE_SITE_URL` (D-F6-P4) |
| C9 | Prompt: "không dùng mock thay cho build thật" ↔ E2E hiện chạy trên `npm run dev` (CSR), không thấy HTML prerender | Kiểm prerender bằng **script tự kiểm trên output build thật** (+ tuỳ chọn E2E trên `vite preview`) |
| C10 | Architecture §5.1 "CSR-only" ↔ prerender KB | Là **ngoại lệ hẹp**, nên có làm rõ trong Architecture (cần Owner duyệt tài liệu — D-F6-K) |
| C11 | Prompt là "implementation prompt" ↔ yêu cầu của Owner là lập plan | Plan này; triển khai sau khi duyệt |

**Trạng thái xử lý (v1.1):** C1/C2/C5 → sửa Spec ở F6.7; C3/C4 → D-F6-N1; C6 → giữ `eager` trong chunk lazy (đo ở F6.2); C7 → test KB-U16; C8 → D-F6-P4/P4b; C9 → D-F6-T1 + cổng hydration (D-F6-P2b); C10 → D-F6-K; C11 → plan này.

### 4.4 Tái dùng được
`MarketingLayout`, `Container`, `Section`, `Stack`, `Grid`, `Card` (`interactive`, `as`), `Badge`, `Button as={Link}`, `EmptyState` (xác nhận props khi triển khai), `SkipLink`; pattern lazy route; `renderWithProviders`; `vitest-axe`; helper quan sát lỗi E2E (sao chép, không trích xuất — như F5); nhãn tiếng Việt `labels.ts` làm nguồn thuật ngữ.

### 4.5 Đánh giá khả thi prerender / SEO
| Phương án | Mô tả | Dependency mới | Thay đổi build | Rủi ro / chi phí | Đánh giá |
|---|---|---|---|---|---|
| **P1 (đề xuất)** | Vite SSR build một entry nhỏ + script Node: render `StaticRouter > MarketingLayout > trang KB` bằng `renderToString`, chèn vào `dist/index.html`, ghi file `.html` phẳng + sitemap + robots | **Không** | Thêm 1 bước sau `vite build` (`vite build --ssr` + `node scripts/prerender.mjs`) | Phải giữ module trong cây prerender "SSR-safe"; cần chiến lược client (D-F6-P2); cần cấu hình Nginx `try_files` | **Khả thi [SPIKE]**; nhỏ nhất, không phụ thuộc bên ngoài |
| P2 | Chụp HTML bằng Playwright sau `vite build` + `vite preview` | Không (Playwright đã có) | Thêm bước build cần trình duyệt | Máy build deploy có thể **không có** browser; chậm, dễ flaky; cần server tạm | Dự phòng; **không** khuyến nghị |
| P3 | Plugin/framework (`vite-react-ssg`, Vike, Next…) | Có | Thay đổi router/build lớn | Vi phạm "không đổi build lớn / không framework" | **Loại** |
| P4 | Chỉ meta tĩnh (title/description/canonical) per-route, **không** render nội dung | Không | Nhỏ | Crawler vẫn thấy `#root` rỗng ⇒ **hạ chuẩn SEO** (D-F6-11 cấm âm thầm hạ) | **Loại** |

**Kết luận khả thi:** selective prerender **khả thi trong kiến trúc hiện tại** bằng P1; không cần SSR toàn app, framework hay plugin. Điều **chưa chứng minh**: hydration (xem D-F6-P2) và cấu hình hosting thật.

**Trạng thái:** P1 đã được Owner duyệt (D-F6-P1) cùng 6 điều kiện (Mục 3.1).

### 4.6 Dependency impact
| Gói | Phiên bản [VF `npm view`] | Loại | Lý do | Chi phí đo được [SPIKE] |
|---|---|---|---|---|
| `react-markdown` | 10.1.0 (peer `react >=18`, `@types/react >=18`) | `dependencies` | D-F6-05 (Architecture §12.3 nêu rõ) | +≈121 kB raw / +37 kB gzip client; +82 gói bắc cầu (hệ sinh thái unified/remark/micromark) |
| `remark-gfm` | — | — | **Không cài** (D-F6-OWN-1) | — |
| Công cụ prerender | — | — | dùng `vite`, `react-dom/server`, `react-router-dom` sẵn có | 0 gói mới |
Cần chạy `npm audit` ngay khi cài (chưa chạy — [UNK]).

---

## 5. Requirement Traceability (nguồn → yêu cầu)

| Nguồn | Nội dung nguyên văn/ý chính | Đưa vào |
|---|---|---|
| PRD FR-12 | "Hiển thị bài viết theo danh mục (Hành tinh, Cung, Nhà, Góc chiếu, Khái niệm cơ bản)" | KB-AC-13…17; D-F6-07 |
| PRD FR-13 | "Nội dung dạng rich-text, có thể kèm hình minh họa" | KB-AC-19…25 |
| PRD FR-14 | Quản trị nội dung "có thể đơn giản là CMS headless hoặc file markdown… ưu tiên giải pháp ít tốn công" | D-F6-13 (Git-based) |
| Arch §5.1 | CSR; SEO của Landing/KB "có thể tối ưu riêng nếu cần mà không cần SSR toàn app" | D-F6-11, P1 |
| Arch §12.3 | không `dangerouslySetInnerHTML` với nội dung chưa sanitize; ví dụ `react-markdown` | D-F6-05, KB-AC-12/34 |
| Arch §15.5 | nếu SSR: "thêm Vite SSR thủ công" | P1 |
| UI Spec §11 | Navbar (`aria-current="page"`), Footer 3 cột | D-F6-10, KB-AC-06 |
| UI Spec §13 | `/knowledge`, `/knowledge/:slug` (MarketingLayout, Guest) | KB-AC-01…05 |
| F5 AC-24 | "Heading không nhảy cấp; vai trò/tên truy cập đúng (test)" | KB-AC-24 |
| Prompt D-F6-01…15 | xem Mục 3 | toàn bộ |

---

## 6. Technical Design

### 6.1 Nguyên tắc
Cô lập trong `features/knowledge-base/`; không API/DB/Backend; không state toàn cục mới; không thư viện state mới; tái dùng `shared/ui`; hướng phụ thuộc `pages → features → shared`; không thêm abstraction không có use case cụ thể (D-F6-14: chỉ một `knowledgeContentService` nhỏ). Mọi module trong cây prerender **không** được dùng `window`/`document` ở phạm vi module.

### 6.2 Cấu trúc đề xuất ([REC]; theo quy ước `pages/<x>/page.tsx`, `features/<x>/{model,ui,lib}`)
```
frontend/src/features/knowledge-base/
  content/{fundamentals,planets,signs,houses,aspects}/<slug>.md      # 15 file (F6.6)
  model/types.ts                 # KNOWLEDGE_CATEGORIES (as const), KnowledgeCategory, KnowledgeArticleMeta, CATEGORY_LABELS (vi)
  model/manifest.ts              # KNOWLEDGE_MANIFEST (typed, ordered)
  model/contentFiles.ts          # DUY NHẤT nơi dùng import.meta.glob (eager, ?raw)
  model/knowledgeContentService.ts   # listArticles / filterByCategory / getArticleMeta / getArticle(slug) / listCategories
  model/seo.ts                   # buildListSeo / buildArticleSeo / buildSitemapXml / buildRobotsTxt  (thuần, dùng chung runtime + prerender + test)
  lib/usePageMeta.ts             # hook meta có phạm vi hẹp (title, description, canonical, OG, robots) + cleanup
  ui/{ArticleCard,CategoryFilter,KnowledgeListView,KnowledgeArticleView,MarkdownRenderer,ArticleNotFound}.tsx
  index.ts                       # barrel
frontend/src/pages/knowledge/page.tsx           # /knowledge
frontend/src/pages/knowledge/detail/page.tsx    # /knowledge/:slug
frontend/src/prerender/entry-server.tsx         # chỉ dùng lúc build (SSR entry); KHÔNG import từ app
frontend/scripts/prerender.mjs                  # Node ESM: render → ghi HTML + sitemap + robots + tự kiểm
frontend/e2e/knowledge-base.spec.ts
```
Chỉ **một** module (`contentFiles.ts`) biết `import.meta.glob`; UI/service chỉ thấy kiểu đã định nghĩa (D-F6-14).

### 6.3 Mô hình nội dung
| Thành phần | Thiết kế | Ràng buộc kiểm bằng test |
|---|---|---|
| Danh mục | `fundamentals \| planets \| signs \| houses \| aspects` (`as const`, **không** `enum` do `erasableSyntaxOnly`); nhãn hiển thị tiếng Việt theo PRD FR-12: Khái niệm cơ bản, Hành tinh, Cung, Nhà, Góc chiếu | đúng 5 giá trị; mỗi danh mục ≥1 bài (đích 3) |
| Metadata | `slug`, `title`, `category`, `summary`, `order`, `updatedAt` (chuỗi `YYYY-MM-DD`) | không rỗng; `slug` khớp `^[a-z0-9]+(-[a-z0-9]+)*$`, duy nhất; `summary` ≤ 160 ký tự (dùng làm meta description); `updatedAt` hợp lệ |
| File | đường dẫn **suy ra** `content/<category>/<slug>.md` (không thêm trường `file` vào manifest) ⇒ parity kiểm cả slug lẫn danh mục | manifest↔file hai chiều; không file mồ côi, không entry mất file |
| Thứ tự | `order danh mục` → `order` → `slug` (xác định) | test thứ tự ổn định |
| Body | Markdown thuần, **không** frontmatter; **cấm H1 (`# `)**; không nhảy cấp (H2→H4); không HTML thô (cảnh báo bằng test) | KB-AC-35, 12 |
| Liên kết | nội bộ dạng `/knowledge/<slug>`; slug phải tồn tại | test "không liên kết nội bộ gãy" |
| Ảnh | `![alt](/knowledge/…)`, `alt` không rỗng | test (khi có ảnh) |

### 6.4 Render Markdown (`MarkdownRenderer`)
- `react-markdown` 10.1.0, `skipHtml`, **không** `rehype-raw`, **không** `dangerouslySetInnerHTML` [SPIKE: HTML thô bị loại; mặc định không skipHtml thì bị escape thành chữ].
- Map `h1→h2` (phòng thủ), `h2…h4` giữ nguyên cấp + class khoảng cách/typography; `h5/h6` bị cấm bởi test nội dung.
- `a`: **allow-list tường minh** — nội bộ `/knowledge/<slug>` (slug tồn tại) → `Link`; `http(s)://` → `<a target="_blank" rel="noopener noreferrer">`; mọi thứ khác (gồm href rỗng sau khi `react-markdown` trung hoà `javascript:`/`data:`) → **chỉ text**, không render `<a>` (khắc phục `<a href="">` [SPIKE]).
- `img`: chỉ `/knowledge/…` hoặc `https:`; **bắt buộc `alt`** không rỗng (thiếu → không render); `loading="lazy" decoding="async"`, `max-w-full h-auto`.
- Danh sách/đoạn/trích dẫn: class theo token hiện có; **không** hỗ trợ code block (không có use case); **không** cài `remark-gfm`.
- Kiểu chữ bài đọc: bọc `max-w-[65ch]`, `leading-relaxed` (mẫu M6). ⚠ `tailwind.config.ts` tham chiếu `var(--text-body-md)`/`var(--text-body-lg)` nhưng `tokens.css` **không định nghĩa** (lỗi phát hiện ở F5-M6; đã hoàn tác thay đổi toàn cục) ⇒ **không dùng class `text-body-md/lg`**; đặt cỡ chữ cục bộ bằng giá trị tường minh (ví dụ `text-[16px]`) — đo ở F6.4; sửa token toàn cục là **quyết định riêng** (D-F6-X1).

### 6.5 Trang
| Route | Hành vi |
|---|---|
| `/knowledge` | `MarketingLayout` (Guest). `h1` "Kiến thức chiêm tinh"; nhóm lọc 6 nút (`Tất cả` + 5 danh mục), `aria-pressed`, mặc định "Tất cả"; vùng trạng thái (`role=status`, polite) "Hiển thị N bài viết"; lưới thẻ responsive (1 → 2 → 3 cột) trong `ul/li`; thẻ: Badge danh mục, tiêu đề `h2` là `Link`, tóm tắt, "Cập nhật {ngày}". Lọc bằng **state cục bộ** (D-F6 §8); empty state khi không có bài ("Chưa có bài viết trong chủ đề này" + nút "Xem tất cả bài viết") — `KnowledgeListView` là **presentational nhận `articles`** để test empty state mà không cần dữ liệu rỗng |
| `/knowledge/:slug` | `h1` = tiêu đề; dòng meta (Badge danh mục + "Cập nhật" định dạng ngày **xác định, không phụ thuộc múi giờ**); liên kết "← Tất cả bài viết"; thân bài `max-w-[65ch]`; slug lạ → `ArticleNotFound` **trong `MarketingLayout`** (không dùng `NotFoundPage` `h-screen`): `h1` "Không tìm thấy bài viết" + nút về danh sách + `noindex` (runtime) |
| Meta | mỗi trang gọi `usePageMeta` (title `"{Tiêu đề} \| AstroViet"`, description = `summary`, canonical, OG, `robots noindex` cho not-found); **cleanup** khi rời trang để meta KB không rò sang route khác. **Không** đóng `OQ-M8-1`/FG-10 cho các route khác |
| Điều hướng | `NavLink` "Kiến thức" (tự có `aria-current="page"`) trong Navbar desktop **và** drawer mobile; Footer: tối thiểu một `nav aria-label="Chân trang"` có liên kết "Kiến thức" (D-F6-N1) |
| Router | thêm hai route con của nhóm `MarketingLayout` (lazy, theo pattern hiện có); không đụng route khác |

### 6.6 Prerender pipeline (P1 — đã duyệt)
```
npm run build
 ├─ tsc -p tsconfig.app.json --noEmit
 ├─ vite build                          → dist/index.html (template: script theme + asset băm)
 └─ npm run build:prerender  [D-F6-P3]
     ├─ vite build --ssr src/prerender/entry-server.tsx --outDir dist-ssr   (dist-ssr đã nằm trong frontend/.gitignore [VF])
     └─ node scripts/prerender.mjs
          ├─ đọc manifest (qua SSR bundle) → danh sách route chính xác
          ├─ resolveSiteUrl() (6.7) → base URL duy nhất cho canonical/OG/sitemap/robots
          ├─ mỗi route: renderToString(<StaticRouter location={route}><MarketingLayout><Suspense fallback={<SuspenseFallback/>}><StaticPage/></Suspense></MarketingLayout></StaticRouter>)
          │     + head (title, description, canonical, OG) từ model/seo.ts (cùng nguồn với runtime)
          │     + marker trên #root: data-prerendered="1" data-prerender-route="<route>" data-prerender-version="<n>"
          ├─ ghi file (layout bên dưới) + sitemap.xml + robots.txt
          └─ TỰ KIỂM → exit 1 nếu sai
```
**Layout output (D-F6-P5/P5b — đã kiểm bằng `vite preview` [SPIKE])**
```
dist/
  knowledge.html                 → /knowledge          (bản chính)
  knowledge/index.html           → /knowledge/         (tuỳ chọn, nội dung giống knowledge.html; canonical vẫn /knowledge)
  knowledge/<slug>.html          → /knowledge/<slug>
  sitemap.xml   robots.txt
```
**Tự kiểm bắt buộc (D-F6-P1 điều kiện 4):** mỗi file có đúng một `<h1>`, một `<title>`, một meta description, một canonical **đúng** (không `/` cuối, đúng host), `og:*` không trùng lặp, nội dung bài đủ độ dài tối thiểu; `sitemap.xml` chỉ liệt kê URL có file tương ứng và đúng bằng `/knowledge` + manifest; `robots.txt` có `Sitemap:` đúng; không có `window`/`document` bị tham chiếu khi render (điều kiện 5, bắt bằng chính việc render trong Node + test `KB-U-ssr`).

**Chiến lược client (D-F6-P2) — quy tắc triển khai**
1. Logic nằm ở module riêng `src/app/hydrate.ts` (hàm thuần `shouldHydrate(root, pathname)` + `hydrateKnowledge(...)`); `main.tsx` chỉ thêm **một nhánh có điều kiện** (xem D-F6-A1). Mọi route khác vẫn `createRoot` đúng như hiện tại.
2. `shouldHydrate` đúng khi **đồng thời**: `#root` có `data-prerendered`; `pathname` (đã chuẩn hoá, bỏ `/` cuối) thuộc `/knowledge` hoặc `/knowledge/<slug>` và **bằng** `data-prerender-route`; `data-prerender-version` bằng hằng số dùng chung với SSR entry; `#root` có đúng một `h1`. Sai bất kỳ điều kiện nào ⇒ `createRoot`.
3. `hydrateRoot(root, <StrictMode><App/></StrictMode>, { onRecoverableError })`; `onRecoverableError` gọi `reportError(error, "hydration")` (hạ tầng sẵn có, ghi console) — **ghi nhận, không "khôi phục"**.
4. **Không** gọi `createRoot` lần hai trên cùng container; **không** có teardown/remount tự động (chưa thiết kế/kiểm thử) — nếu cổng không đạt thì **fallback duyệt = (a)**: không bật nhánh hydrate, giữ `createRoot`, chấp nhận HTML prerender bị thay khi React khởi chạy (SEO vẫn đầy đủ).
5. Route lazy & Suspense boundary parity: Client router (`router.tsx` dòng 70–75) bọc các route con của `MarketingLayout` bằng `<Suspense fallback={<SuspenseFallback/>}><Outlet/></Suspense>`. `renderToString` của React 18 phát sinh comment marker cho Suspense boundary (`<!--$?-->` / `<!--/$-->`). Do đó, cây server SSR bắt buộc phải bọc trang tĩnh import trực tiếp trong `<Suspense fallback={<SuspenseFallback/>}><StaticPage/></Suspense>` y hệt wrapper client để tránh hydration mismatch làm React loại bỏ DOM prerender. Tuyệt đối không dùng lại `routesConfig` cho server vì `lazy()` sẽ render spinner trong `renderToString`.
6. Parity DOM bắt buộc: `MarketingLayout` render lần đầu ở trạng thái auth `resolving` (không có nút Đăng nhập/Đăng ký) cả server lẫn client [VF mã + SPIKE]; ngày cập nhật định dạng **xác định** (không phụ thuộc múi giờ); không dùng `Date.now()`/random trong render.

**Cổng hydration (D-F6-P2b) — `scripts/verify-hydration.mjs`**
- Công cụ: Playwright **API** (không qua `playwright.config.ts`); khởi chạy `vite preview` trên cổng riêng; trình duyệt Chromium hoặc Chrome cài sẵn (`channel: "chrome"`); **Owner chạy cục bộ**, không vào CI (CI chạy `npm run build` trước khi có browser).
- Kịch bản chuẩn: viewport 1280×800 và 375×667; trễ bundle JS chính 800 ms bằng route handler; routes: `/knowledge`, 3 bài mẫu (ngắn, dài, có liên kết nội bộ), `/knowledge/<slug-lạ>`, `/`.
- Kiểm: **H01** nội dung tĩnh (`h1` + đoạn đầu bài) hiển thị **trước** khi JS chạy; **H02** 0 thông điệp hydration (`hydrat…`, `did not match`, lỗi React #418/#423/#425) và 0 `console.error`/`pageerror` ngoài allowlist `/auth/refresh`; **H03** phần tử `h1` prerender **không bị gỡ/thay** (MutationObserver bắt `removedNodes`); **H04** CLS < 0,1 (`PerformanceObserver` `layout-shift`, loại `hadRecentInput`, từ điều hướng đến `networkidle` + 1 s); **H05** route KB hợp lệ → hydrate (có marker), route không marker (`/`, slug lạ) → `createRoot` và hoạt động bình thường.
- Kết quả: JSON + log do Owner dán vào Matrix F6.5; **không** CI ⇒ ghi Known Gap "cổng hydration không tự động trong CI".

**Hosting/Nginx (D-F6-H):** chưa có staging; F6 **chỉ** ghi yêu cầu: Nginx phải map `/knowledge` → `knowledge.html` và `/knowledge/<slug>` → `knowledge/<slug>.html` **không** 301 sang `/…/`, **không** để lộ `.html`, và không trả SPA `index.html` cho route đã prerender; slug lạ nên trả **404 thật** (ví dụ `error_page 404 /index.html;` giữ status 404 để SPA vẫn hiển thị Not Found). Ví dụ trong `Confirmation.md` (`location /knowledge/ { try_files $uri $uri.html $uri/ =404; }`) **không khớp `/knowledge` không có `/`** và dùng `=404` làm mất giao diện Not Found trong app — **không sao chép**; kiểm thật ở task "deploy readiness" (Known Gap KG-F6 dự kiến).

**Tự kiểm vs E2E:** E2E giữ trên `npm run dev` (D-F6-T1); prerender được bảo đảm bằng script tự kiểm (chạy trong `npm run build`, CI chạy) + test hàm thuần + `KB-U-ssr`; cổng hydration là bằng chứng cục bộ tách biệt.

### 6.7 Cấu hình môi trường (D-F6-P4/P4b)
`VITE_SITE_URL` (**mới**): thêm vào `env.ts` dạng `optional URL` (không làm vỡ test hiện có) và `.env.example` (`http://localhost:5173`, CI đã `cp .env.example .env`). Cờ **`PRERENDER_STRICT`** do pipeline deploy đặt (không có tiền tố `VITE_`). Script `scripts/prerender.mjs` chạy trong môi trường Node.js: biến môi trường được tải bằng cách hợp nhất `process.env` và `loadEnv(mode, process.cwd(), '')` (tiện ích từ Vite) để đọc đầy đủ cả biến không có tiền tố `VITE_` lẫn các biến cấu hình từ file `.env`. Một hàm thuần `resolveSiteUrl(env)` (có test, dùng cho canonical/OG/sitemap/robots):

| `PRERENDER_STRICT` | `VITE_SITE_URL` | Kết quả |
|---|---|---|
| không đặt / false | không đặt | dùng `http://localhost:5173` + **cảnh báo** (local/CI) |
| không đặt / false | sai định dạng | **build fail** (D-F6-A4) |
| `true` | thiếu / sai định dạng / host `localhost`/IP nội bộ / không phải `https:` | **build fail**, không sinh canonical/sitemap (D-F6-A2) |
| bất kỳ | hợp lệ | chuẩn hoá: bỏ `/` cuối, không `//`, cùng một base cho mọi URL |

Không tự điền domain; domain production: [UNK]. **Chưa có pipeline deploy** ⇒ cờ `PRERENDER_STRICT` **chưa được ép tự động** (Known Gap; xử lý ở task "deploy readiness").

### 6.8 Trợ năng & bảo mật (thiết kế)
Landmark: `<main id="main-content">` có sẵn (SkipLink); một `h1`/trang; không nhảy cấp (H2→H4 bị test chặn); nhóm lọc có nhãn "Lọc theo chủ đề", nút `aria-pressed`, focus ring token; liên kết có tên mô tả (tiêu đề bài); ảnh `alt`; thân bài 65ch; reduced-motion: không thêm chuyển động mới (nếu thêm hover transition phải có `motion-reduce:`). Bảo mật: không HTML thô/`dangerouslySetInnerHTML`/`rehype-raw`; allow-list URL; `rel="noopener noreferrer"`; không thực thi nội dung Markdown.

### 6.9 Tác động tới tài liệu kiến trúc
Prerender KB là **ngoại lệ hẹp** của Architecture §5.1 "CSR-only" — nên có đoạn làm rõ (D-F6-K); không SSR toàn app, không framework.

---

## 7. Milestones

Quy ước F5: `F6.k`; mỗi milestone có Evidence Matrix riêng (`archive/sprint-f6/`). **F6.0** (mới, như M5.0/M6.0): cổng vào.

### F6.0 — Entry gate (S)
Baseline: `npm run format:check`, `lint`, `typecheck`, `npm test` (kỳ vọng 145 file/1.205 test theo F5), `npm run build`, `CI=1 npx playwright test --list` (60/9), `npm audit` (trước khi cài). Chốt **D-F6-A1** (Mục 14.2). Nhánh nền: `dev` đã merge `main` (PR #67); version/tag theo D-F6-V (không bump). **DoD:** baseline xanh/được ghi; quyết định ghi vào Matrix F6.0.

### F6.0b — Đổi nhãn góc chiếu (micro-change riêng, S) — D-F6-L1/L2/L3
- **Phạm vi:** `ASPECT_TYPE_LABELS` trong `features/chart/model/labels.ts`: Conjunction `Hợp` → **`Trùng tụ`**, Square `Vuông chiếu` → **`Vuông góc`**, Opposition `Đối xung` → **`Đối đỉnh`**; Sextile `Lục hợp` và Trine `Tam hợp` **giữ nguyên**.
- **Tác động đã quét [VF]:** một nguồn duy nhất → tự lan tới bảng/thẻ/badge/legend/aria (`chartViewModel.ts:667` → `aspect.type.labelVi` → `aspectGeometry` `typeLabelVi` → `AspectLegend`). Khóa logic/React key dùng enum tiếng Anh nên **không đổi logic**. Backend/seed/E2E không phụ thuộc.
- **File:** `labels.ts` (3 chuỗi); test `labels.test.ts`, `AspectLegend.test.tsx`, `AspectBadge.test.tsx` (cập nhật chuỗi gõ cứng); UI Spec **§12.11** (cập nhật ví dụ aria-label + **bảng 5 nhãn chuẩn** — nguồn chuẩn duy nhất về thuật ngữ góc chiếu); `CHANGELOG` `[Unreleased]` → `### Changed`.
- **Không đụng:** Backend, tài liệu lưu trữ lịch sử (Matrix/plan F4–F5, `m6_s_accessibility_tree.json`), `features/chart` ngoài `labels.ts`, token/CSS toàn cục.
- **Kiểm:** grep không còn `Vuông chiếu`/`Đối xung`/nhãn "Hợp" cũ trong `frontend/src` và `frontend/e2e`; `format:check`, `lint`, `typecheck`, `npm test` (toàn bộ), `CI=1 npx playwright test --list` không đổi (60/9); **kiểm bằng mắt** bảng góc chiếu (list/thẻ mobile), badge, legend ở 320/375/768/1280 — "Trùng tụ" dài hơn "Hợp" (8 so với 3 ký tự) nên cần xem xuống dòng/tràn; xác nhận bảng không sắp xếp theo nhãn (chưa kiểm).
- **Thứ tự:** ngay sau F6.0, **trước** F6.6 (nội dung bài dùng nhãn cuối). **DoD:** F6-AC-L1…L6 (Mục 8.1). **Độ phức tạp:** S.

### F6.1 — Audit & traceability (S — phần lớn đã làm trong plan này)
Chốt RTM (Mục 8), conflicts (4.3), reuse (4.4), dependency (4.6), chiến lược prerender (4.5). **DoD:** Owner duyệt plan + RTM.

### F6.2 — Content model & Markdown pipeline (M)
- Tạo `types.ts`, `manifest.ts` (rỗng/1 bài mẫu cho đến F6.6 hoặc dùng fixture test), `contentFiles.ts`, `knowledgeContentService.ts`, `seo.ts`.
- Cài `react-markdown@10.1.0` (**duy nhất 1 dependency**) + `MarkdownRenderer` + chính sách URL/ảnh/heading.
- Test: schema, slug unique, category valid, parity 2 chiều, thứ tự, unknown slug, filter; render; **an toàn** (script/HTML thô/`javascript:`/`data:`/onerror); heading hierarchy; liên kết nội bộ gãy.
- **Rủi ro:** `import.meta.glob` trong Vitest (kỳ vọng hoạt động vì Vitest dùng Vite — xác minh ở bước đầu F6.2); +37 kB gzip (chỉ trong chunk lazy).
- **DoD:** KB-AC-07…12, 33…35 có test xanh; `npm run lint/typecheck/test` xanh; `npm audit` ghi nhận.

### F6.3 — Listing (M)
`ArticleCard`, `CategoryFilter`, `KnowledgeListView`, trang `/knowledge`, route lazy; lưới responsive; empty state; trạng thái đếm; test component + axe; kiểm guest.
**DoD:** KB-AC-01, 03, 13…18.

### F6.4 — Article detail (M)
Trang `/knowledge/:slug`, `KnowledgeArticleView`, `ArticleNotFound`, định dạng ngày xác định, `usePageMeta` (dùng cho cả hai trang), đo typography 65ch (không dùng `text-body-md/lg`), ảnh.
**DoD:** KB-AC-02, 04, 05, 19…25.

### F6.5 — Navigation, SEO & prerender (L)
- Navbar (desktop + drawer) thêm **một** `NavLink` "Kiến thức"; Footer **một** `nav aria-label="Chân trang"` tối thiểu (D-F6-N1); cập nhật `MarketingLayout.test.tsx`.
- `VITE_SITE_URL` (+ `resolveSiteUrl`, `PRERENDER_STRICT`), `seo.ts`, `src/prerender/entry-server.tsx`, `scripts/prerender.mjs` (layout 6.6, tự kiểm), scripts `package.json` (`build` tích hợp, `build:prerender`), `sitemap.xml`/`robots.txt` sinh lúc build.
- Hydration: `src/app/hydrate.ts` + nhánh có điều kiện ở `main.tsx` (**sau khi D-F6-A1 được xác nhận**), `onRecoverableError` → `reportError`; `scripts/verify-hydration.mjs` + script `verify:hydration`.
- **Cổng hydration (cuối milestone, Owner chạy cục bộ):** đạt ⇒ bật nhánh hydrate; **không đạt ⇒ fallback (a)** đã duyệt (tắt nhánh hydrate), ghi Known Gap.
- Test: hàm thuần (`seo`, `resolveSiteUrl`, `shouldHydrate`), render SSR entry (KB-U-ssr), tự kiểm prerender (KB-P01…P11).
- **Rủi ro:** D-F6-A1; mã SSR-unsafe; mismatch hydration; Nginx (hoãn).
- **DoD:** KB-AC-06, 26…32; build thật tạo đủ file; `vite preview` trả đúng HTML; bằng chứng cổng hydration.

### F6.6 — Content & QA (L)
Viết 15 bài (Mục 11) **sau F6.0b** (nhãn góc chiếu cuối); điền manifest; test nội dung (KB-U22/U23 nhãn cũ/chuẩn); toàn bộ test, axe, Playwright `e2e/knowledge-base.spec.ts`; hồi quy F4/F5; build + CI. **Cổng GFM:** nếu bài thật cần bảng/task list/strikethrough ⇒ dừng, xin Owner duyệt `remark-gfm` (D-F6-G). **DoD:** KB-AC-36…40; nội dung được Owner duyệt.

### F6.7 — Docs & closure (M)
UI Spec §11/§13/§14.1/§18.3 (+ §12.11 đã sửa ở F6.0b); Architecture §5.1 (D-F6-K); `CHANGELOG` `[Unreleased]` (Added: Knowledge Base; Changed: nhãn góc chiếu); README FE; Known Gaps registry; Matrix F6; Closure Report; version **chỉ khi Owner duyệt**. **DoD:** Mục 15.

---

## 8. Acceptance Criteria Traceability Matrix (KB-AC-01…40)

Nguồn: prompt F6 §5 (dòng 419–513). Trạng thái **toàn bộ là `PENDING` (chưa triển khai)** — không có AC nào được ghi PASS. "PRD/Spec" = nguồn yêu cầu gốc nếu có.

| AC | Yêu cầu (rút gọn) | Nguồn | Triển khai dự kiến | Xác minh dự kiến |
|---|---|---|---|---|
| KB-AC-01 | Guest vào `/knowledge` không cần đăng nhập | Spec §13 | route con `MarketingLayout` (F6.3) | KB-E01 |
| KB-AC-02 | Guest vào thẳng `/knowledge/:slug` | Spec §13 | F6.4 | KB-E02 |
| KB-AC-03 | Danh sách dùng `MarketingLayout` | Spec §13 | router (F6.3) | KB-U-route, KB-E01 |
| KB-AC-04 | Chi tiết dùng layout/nav công khai đúng | Spec §13 | router (F6.4) | KB-E02 |
| KB-AC-05 | Slug lạ → Not Found, không crash | prompt | `ArticleNotFound` (F6.4) | KB-U09, KB-E08 |
| KB-AC-06 | "Kiến thức" ở Navbar **và** Footer | Spec §11; D-F6-10 | `MarketingLayout` (F6.5) | KB-U-nav, KB-E09 |
| KB-AC-07 | Metadata hợp lệ cho mọi bài | D-F6-04 | `manifest.ts` | KB-U01 |
| KB-AC-08 | Mỗi entry có file `.md` | D-F6-04 | `contentFiles.ts` | KB-U04 |
| KB-AC-09 | Mỗi file `.md` có trong manifest | D-F6-04 | như trên | KB-U05 |
| KB-AC-10 | Slug duy nhất; danh mục hợp lệ; thứ tự xác định | D-F6-04 | service | KB-U02, U03, U06 |
| KB-AC-11 | Tiêu đề/tóm tắt/danh mục/thân khớp manifest + nguồn | prompt | service + view | KB-U07, KB-E06 |
| KB-AC-12 | HTML/script thô không thực thi/không chèn | Arch §12.3 | `MarkdownRenderer` (`skipHtml`, allow-list) | KB-U10…U12 |
| KB-AC-13 | Lưới thẻ responsive | UI Spec | `KnowledgeListView` | KB-U13, đo F6.3 |
| KB-AC-14 | Đủ 5 danh mục FR-12 | PRD FR-12 | `types.ts` | KB-U03, KB-E04 |
| KB-AC-15 | Chọn danh mục chỉ hiện bài của danh mục | FR-12 | `CategoryFilter` | KB-U08, KB-E04 |
| KB-AC-16 | Quay về "Tất cả" | prompt | như trên | KB-E05 |
| KB-AC-17 | Empty state khi không có bài | prompt; Spec §18.3 | `KnowledgeListView` (prop) | KB-U14 |
| KB-AC-18 | Không cần phân trang/tìm kiếm | D-F6-08 | không triển khai | rà soát mã (không có Pagination/search) |
| KB-AC-19 | Mỗi bài có đúng một H1 | prompt | view | KB-U15, KB-E06 |
| KB-AC-20 | Heading Markdown hợp lệ, bắt đầu từ H2 | prompt | quy tắc nội dung + renderer | KB-U16 |
| KB-AC-21 | Bề rộng ≈65ch, thích ứng mobile | D-F6-09 | `max-w-[65ch]` | đo viewport (F6.4/F6.6) |
| KB-AC-22 | Liên kết nội bộ dùng React Router | prompt | renderer `a` → `Link` | KB-U11, KB-E07 |
| KB-AC-23 | Liên kết ngoài an toàn (`rel`, URL) | D-F6-05 | renderer | KB-U11 |
| KB-AC-24 | Heading + bàn phím theo **AC-24 gốc** (F5 plan dòng 505: "Heading không nhảy cấp; vai trò/tên truy cập đúng (test)") + yêu cầu a11y hiện hành | F5 AC-24 | toàn feature | KB-U16, KB-A01…A05 (axe, thứ tự Tab, tên link) + QA bàn phím |
| KB-AC-25 | Ảnh có `alt`; không-quan-trọng lazy | D-F6-12 | renderer `img` | KB-U17 (fixture) |
| KB-AC-26 | Mỗi trang có `<title>` riêng | D-F6-11 | `seo.ts` + hook + prerender | KB-U18, KB-P01 |
| KB-AC-27 | Meta description phù hợp | D-F6-11 | như trên | KB-U18, KB-P02 |
| KB-AC-28 | Canonical đúng, theo cấu hình môi trường | D-F6-11 | `VITE_SITE_URL` | KB-U19, KB-P03 |
| KB-AC-29 | Sitemap sinh từ manifest | D-F6-11 | `buildSitemapXml` | KB-U20, KB-P05 |
| KB-AC-30 | `robots.txt` đúng vị trí output | D-F6-11 | script prerender | KB-U21, KB-P06 |
| KB-AC-31 | HTML prerender có nội dung bài + metadata (không chỉ shell rỗng) | D-F6-11 | `scripts/prerender.mjs` | KB-P01…P11 (tự kiểm trên build thật) |
| KB-AC-32 | Route CSR hiện có + build vẫn hoạt động | prompt | không đổi route khác | regression (Mục 9.4) |
| KB-AC-33 | Test parity manifest↔file | prompt | — | KB-U04, U05 |
| KB-AC-34 | Test an toàn HTML/script | prompt | — | KB-U10…U12 |
| KB-AC-35 | Test hierarchy heading | prompt | — | KB-U16 |
| KB-AC-36 | A11y theo quy ước dự án (axe đã có) | prompt | `vitest-axe` | KB-A01…A03 |
| KB-AC-37 | Playwright: guest vào danh sách + chi tiết | prompt | — | KB-E01, E02 |
| KB-AC-38 | Playwright: lọc danh mục | prompt | — | KB-E04, E05 |
| KB-AC-39 | Playwright: slug lạ | prompt | — | KB-E08 |
| KB-AC-40 | Mọi gate + hồi quy xanh | prompt | — | Mục 9.4 + CI |

**Ghi chú xung đột AC:** KB-AC-13/17 nhờ UI Spec cũ nhắc `Pagination`/tìm kiếm (C1/C2) — Spec sẽ sửa, AC không đổi. KB-AC-24 dùng đúng một định nghĩa AC-24 trong repo (F5), không có AC-24 khác.

### 8.1 Tiêu chí bổ sung cho F6.0b (nhãn góc chiếu) — F6-AC-Lx
| AC | Yêu cầu | Xác minh |
|---|---|---|
| F6-AC-L1 | 3 nhãn đổi đúng trong `ASPECT_TYPE_LABELS`; Lục hợp/Tam hợp không đổi | `labels.test.ts` |
| F6-AC-L2 | Mọi bề mặt hiển thị nhãn mới (bảng, thẻ mobile, badge, legend, aria) | `AspectBadge.test`, `AspectLegend.test` + kiểm bằng mắt |
| F6-AC-L3 | Không còn nhãn cũ trong `frontend/src` và `frontend/e2e` (ngoại trừ danh sách cấm trong test KB) | log grep |
| F6-AC-L4 | UI Spec §12.11: ví dụ aria-label cập nhật + bảng 5 nhãn chuẩn; tài liệu lưu trữ **không** đổi | `git diff` |
| F6-AC-L5 | Không tràn ngang/cắt chữ ở 320/375/768/1280 cho bảng, badge, legend | số đo + ảnh |
| F6-AC-L6 | Test nội dung KB cảnh báo nhãn cũ và kiểm bài `major-aspects` dùng đúng 5 nhãn chuẩn | KB-U22, KB-U23 |

---

## 9. Test and QA Strategy

### 9.1 Kiểm thử đơn vị (Vitest) — ID kế hoạch
| ID | Nội dung |
|---|---|
| KB-U01 | metadata hợp lệ (không rỗng, `summary ≤160`, `updatedAt` hợp lệ) |
| KB-U02 | slug duy nhất + đúng định dạng |
| KB-U03 | danh mục hợp lệ; đúng 5 giá trị; mỗi danh mục có bài |
| KB-U04 / U05 | parity manifest→file / file→manifest (qua `import.meta.glob` — [UNK] xác minh trong Vitest ở F6.2) |
| KB-U06 | thứ tự xác định |
| KB-U07 | tiêu đề/tóm tắt/thân khớp nguồn |
| KB-U08 | `filterByCategory` |
| KB-U09 | slug lạ → `undefined` + view Not Found |
| KB-U10 | `<script>`/HTML thô **không** xuất hiện trong DOM |
| KB-U11 | allow-list URL: `javascript:`/`data:`/rỗng → không có `<a>`; ngoài → `rel="noopener noreferrer"`; nội bộ → `Link` |
| KB-U12 | không dùng `dangerouslySetInnerHTML`/`rehype-raw` (regex tĩnh trên feature; **không** gọi là AST) |
| KB-U13…U14 | lưới/empty state (`KnowledgeListView` nhận `articles`) |
| KB-U15…U16 | một `h1`; heading nội dung bắt đầu H2, không nhảy cấp, không H1 |
| KB-U17 | ảnh: `alt` bắt buộc; `loading="lazy"` |
| KB-U18…U21 | hàm `seo.ts`: title/description/canonical/OG/sitemap/robots + escape thuộc tính |
| KB-U-route / KB-U-nav | route dùng `MarketingLayout`; Navbar/Footer có "Kiến thức" |
| KB-U-ssr | render SSR entry cho mọi route không ném lỗi, có `h1` |
| KB-U22 | **Nhãn cũ**: không tiêu đề/tóm tắt/thân bài nào chứa `Vuông chiếu`, `Đối xung` ngoài cụm alias cho phép ("còn gọi là", "hay gọi là", "tên gọi khác là"); **không** tự kiểm "Hợp" (trùng từ thông dụng, ví dụ "phù hợp", "Tam hợp") ⇒ checklist biên tập (D-F6-A5). Danh sách cấm khai báo trong test, ghi chú nguồn chuẩn UI Spec §12.11 |
| KB-U23 | Bài `major-aspects` chứa đủ 5 nhãn lấy từ `ASPECT_TYPE_LABELS` (import chỉ trong test — D-F6-A6) |
| KB-U24 | `resolveSiteUrl` theo bảng 6.7 (strict/non-strict, chuẩn hoá, fail) |
| KB-U25 | `shouldHydrate`: đủ marker/route/version/`h1` ⇒ true; thiếu bất kỳ ⇒ false |

### 9.2 Prerender & hydration (không mock)
**A. Tự kiểm trong `npm run build` (CI chạy):** KB-P01 title · P02 description · P03 canonical (đúng host, không `/` cuối) · P04 OG tối thiểu, không trùng · P05 sitemap = `/knowledge` + manifest, chỉ URL có file · P06 robots + dòng `Sitemap` · P07 đúng 1 `<h1>` + nội dung bài đủ dài · P08 thông điệp rõ khi sai/thiếu `VITE_SITE_URL` · P09 đủ file layout (`knowledge.html`, `knowledge/<slug>.html`, `knowledge/index.html` nếu bật) · P10 marker `data-prerendered` đúng route · P11 `PRERENDER_STRICT` fail đúng. Sau build: `vite preview` + `curl` cho `/knowledge`, một slug thật, một slug lạ (đã [SPIKE]).
**B. Cổng hydration — script cục bộ (Mục 6.6):** KB-H01…H05; Owner chạy, ghi JSON + log; **không** CI.

### 9.3 Playwright (`e2e/knowledge-base.spec.ts`, bám mẫu hiện có)
Chạy trên dev server (CSR) như các spec khác; **không** mock API; cấm `waitForTimeout`/`test.skip`/`test.only`/sleep; chờ bằng auto-wait/`expect`/`waitForURL`.
KB-E01 guest vào `/knowledge` · E02 vào thẳng bài · E03 có thẻ bài · E04 lọc từng danh mục chỉ ra đúng bài · E05 "Tất cả" khôi phục · E06 trang chi tiết đúng bài (1 `h1`) · E07 liên kết nội bộ điều hướng · E08 slug lạ → Not Found · E09 có "Kiến thức" ở Navbar/Footer · E10 không lỗi console nghiêm trọng (tái dùng bộ lọc cho `/auth/refresh` như `interpretation.spec.ts`).
⚠ Boot ứng dụng gọi refresh token; CI có Backend nên ổn; chạy cục bộ không Backend cần cùng bộ lọc.

### 9.4 Trợ năng & hồi quy
- **A11y:** KB-A01 axe trang danh sách · A02 axe trang bài · A03 axe Not Found · A04 thứ tự Tab (user-event) · A05 tên link/nhóm lọc; QA bàn phím + trình đọc màn hình theo chính sách F5 (Narrator trên Windows nếu khả dụng; phần không kiểm ⇒ Known Gap, **không** hạ AC); kiểm focus ring, tương phản (token hiện có), reduced-motion.
- **Hồi quy (KB-AC-32/40):** `format:check`, `lint`, `typecheck`, toàn bộ `npm test` (baseline 145 file/1.205 test — F5), `npm run build`, `CI=1 npx playwright test --list` (60/9 + spec mới), toàn bộ E2E trên CI (Backend thật). Guard diff: `features/chart/**`, Backend, `router` các route khác **không đổi**; `MarketingLayout` chỉ đổi phần nav/footer. Smoke `/` ("Coming soon") vẫn xanh.
- **Bằng chứng hydration:** kết quả `verify-hydration` (KB-H01…H05) do Owner chạy cục bộ trên bản build, lưu `archive/sprint-f6/evidence/` (JSON + log).

### 9.5 Lệnh (nhãn)
| Mục đích | Lệnh | Nhãn |
|---|---|---|
| Cổng FE | `npm run format:check`, `lint`, `typecheck`, `npm test`, `npm run build` | [VF scripts] |
| Đếm E2E | `CI=1 npx playwright test --list` | [VF] (60/9 tại HEAD) |
| E2E riêng | `npx playwright test e2e/knowledge-base.spec.ts --reporter=list` | Proposed |
| SSR build | `npx vite build --ssr src/prerender/entry-server.tsx --outDir dist-ssr` | [SPIKE] cú pháp đã chạy được trên bản sao |
| Xem output | `npx vite preview --port 4173` + `curl -s http://localhost:4173/knowledge/<slug>` | [SPIKE] |
| Dependency | `npm i react-markdown@10.1.0` + `npm audit` | Proposed (chưa cài) |
| Prerender | `npm run build` (gồm `build:prerender`) | Proposed (D-F6-P3) |
| Cổng hydration | `npm run verify:hydration` (`node scripts/verify-hydration.mjs`) | Proposed (Owner chạy cục bộ) |

---

## 10. File Impact Matrix

| File | Hành động | Ghi chú |
|---|---|---|
| `frontend/src/features/knowledge-base/**` | **Create** | Mục 6.2 |
| `frontend/src/pages/knowledge/page.tsx`, `…/detail/page.tsx` | **Create** | |
| `frontend/src/app/router.tsx` | **Modify** | +2 route con (lazy) trong nhóm `MarketingLayout` |
| `frontend/src/widgets/marketing-layout/index.tsx` (+ `.test.tsx`) | **Modify** | "Kiến thức" (Navbar + drawer) + footer nav tối thiểu |
| `frontend/src/shared/config/env.ts`, `frontend/.env.example` | **Modify** | `VITE_SITE_URL` (optional) |
| `frontend/src/prerender/entry-server.tsx`, `frontend/scripts/prerender.mjs` | **Create** | chỉ dùng lúc build |
| `frontend/package.json` (+ `package-lock.json`) | **Modify** | `react-markdown`; scripts `build`/`build:prerender` (D-F6-P1/P3) |
| `frontend/src/main.tsx`, `frontend/src/app/hydrate.ts` | **Modify / Create** | nhánh hydrate có điều kiện (D-F6-A1); `main.tsx` ≤ vài dòng |
| `frontend/scripts/verify-hydration.mjs` | **Create** | cổng hydration cục bộ (Playwright API) |
| `frontend/src/features/chart/model/labels.ts` | **Modify (F6.0b)** | 3 chuỗi nhãn góc chiếu |
| `frontend/src/features/chart/model/labels.test.ts`, `…/ui/AspectLegend/AspectLegend.test.tsx`, `…/ui/AspectBadge/AspectBadge.test.tsx` | **Modify (F6.0b)** | cập nhật chuỗi gõ cứng |
| `docs/frontend/Frontend_UI_Specification.md` §12.11 | **Modify (F6.0b)** | ví dụ aria-label + bảng 5 nhãn chuẩn |
| `frontend/.gitignore` | **Không đổi** | `dist-ssr` đã có (dòng 12) [VF] |
| `frontend/public/knowledge/` | **Create (tuỳ)** | chỉ khi có ảnh |
| `frontend/e2e/knowledge-base.spec.ts` | **Create** | |
| `docs/frontend/Frontend_UI_Specification.md` | **Modify** (F6.7) | §11.1, §11.2, §13, §14.1, §18.3 |
| `docs/frontend/Frontend_Architecture_Specification.md` | **Modify nếu D-F6-K duyệt** | §5.1 làm rõ ngoại lệ prerender |
| `frontend/CHANGELOG.md`, `frontend/README.md` | **Modify** | README: `VITE_SITE_URL`, bước prerender |
| `docs/implementation/archive/sprint-f6/*` | **Create** | Matrix (từng milestone), Known Gaps Registry, Closure Report |
| **Không đổi** | | `backend/**`, `features/chart/**` (trừ `model/labels.ts` + 3 file test ở F6.0b), `features/interpretation*`, auth/birth-profile, `selection.ts`, token toàn cục, `playwright.config.ts` (trừ D-F6-T1), workflow CI |

---

## 11. Content Plan (F6.6)

### 11.1 Danh sách 15 bài và đề xuất điều chỉnh
Tiêu đề trong prompt dùng tên **tiếng Anh** (Sun, Moon, Ascendant, Mercury…) trong khi sản phẩm dùng nhãn **tiếng Việt** (`labels.ts`: Mặt Trời, Mặt Trăng, Sao Thủy/Kim/Hỏa/Mộc/Thổ; giao diện F5 dùng "Cung Mọc" cho Ascendant). Quy tắc biên tập yêu cầu thuật ngữ nhất quán với glossary hiện có ⇒ đề xuất điều chỉnh nhỏ (**cần Owner duyệt — D-F6-C1**; slug giữ nguyên):

| # | Danh mục | Slug | Tiêu đề trong prompt | Đề xuất điều chỉnh [REC] |
|---|---|---|---|---|
| 1 | Khái niệm cơ bản | `what-is-astrology` | Chiêm tinh học là gì? | giữ |
| 2 | Khái niệm cơ bản | `how-to-read-a-natal-chart` | Cách đọc một bản đồ sao cá nhân | giữ |
| 3 | Khái niệm cơ bản | `planets-signs-houses` | Hành tinh, cung hoàng đạo và nhà: Ba thành phần của lá số | giữ |
| 4 | Hành tinh | `sun-moon-rising` | Sun, Moon và Ascendant: Bộ ba nền tảng | "Mặt Trời, Mặt Trăng và Cung Mọc (Ascendant): Bộ ba nền tảng" |
| 5 | Hành tinh | `personal-planets` | Mercury, Venus và Mars | "Sao Thủy, Sao Kim và Sao Hỏa: Các hành tinh cá nhân" |
| 6 | Hành tinh | `social-and-outer-planets` | Jupiter, Saturn và các hành tinh thế hệ | "Sao Mộc, Sao Thổ và các hành tinh thế hệ" |
| 7 | Cung | `zodiac-signs-overview` | Tổng quan 12 cung hoàng đạo | giữ (dùng tên cung từ `labels.ts`) |
| 8 | Cung | `elements-and-modalities` | Bốn nguyên tố và ba tính chất | giữ |
| 9 | Cung | `sign-rulerships` | Chủ tinh của 12 cung hoàng đạo | giữ — **lưu ý** quy ước chủ tinh cổ điển/hiện đại; sản phẩm chưa có tính năng chủ tinh |
| 10 | Nhà | `astrological-houses-overview` | Tổng quan 12 nhà | giữ — nêu cả Placidus và Whole Sign (engine hỗ trợ 2 hệ) |
| 11 | Nhà | `angular-succedent-cadent-houses` | Nhà Angular, Succedent và Cadent | giữ (kèm chú thích tiếng Việt) |
| 12 | Nhà | `house-rulers` | House Ruler | "Chủ tinh của nhà (House Ruler)" — như #9 |
| 13 | Góc chiếu | `what-are-astrological-aspects` | Góc chiếu là gì? | giữ |
| 14 | Góc chiếu | `major-aspects` | Conjunction, Opposition, Square, Trine, Sextile | **"Góc chiếu chính: Trùng tụ, Lục hợp, Vuông góc, Tam hợp và Đối đỉnh"** (5 nhãn chuẩn từ F6.0b); nêu tên gọi khác ở lần xuất hiện đầu (ví dụ "Đối đỉnh (còn gọi là Đối xung)") vì thuật ngữ tiếng Việt chưa thống nhất — engine chỉ hỗ trợ đúng **5 góc chuẩn** [VF `types.ts`] |
| 15 | Góc chiếu | `orbs-and-applying-separating` | Orb, Applying và Separating | `isApplying` đã được định nghĩa trong Domain Spec §18.3 [VF] — nội dung phải khớp |

### 11.2 Quy trình biên tập [REC]
1. Soạn nháp (có thể hỗ trợ bằng AI như PRD gợi ý) theo mẫu cấu trúc thống nhất (mở đầu, các mục `##`, tóm lược); độ dài ~500–900 từ (**giả định**, chưa có chuẩn trong repo).
2. **Đối chiếu sự thật** với `Astrology_Domain_Specification.md` §8, `Astrology_Engine_Specification.md` §10.1, `Natal_Chart_Domain_Specification.md` (Placidus/Whole Sign, `isApplying`, 5 góc) và nhãn `labels.ts`; mọi mệnh đề về **hành vi AstroViet** phải khớp spec/engine (ví dụ Cung Mọc cần giờ sinh; không hứa tính năng chưa có).
3. Quy tắc: tiếng Việt rõ ràng; không khẳng định tất định; phân biệt biểu tượng/ý nghĩa với bằng chứng khoa học; không trình bày nội dung chung như diễn giải cá nhân; không trích dẫn bịa; liên kết nội bộ có chọn lọc; **không độn nội dung** cho đủ 15 bài (nếu một bài không đủ chất lượng ⇒ giảm số bài, tối thiểu 10).
4. Owner duyệt nội dung theo từng danh mục trước khi merge; `updatedAt` cập nhật thủ công khi sửa.
5. Không có tiêu chuẩn biên tập riêng trong repo [VF] — nếu Owner có chuẩn ngoài repo, áp dụng thay.
6. **Thuật ngữ góc chiếu:** nguồn chuẩn là UI Spec §12.11 (sau F6.0b); mọi bài dùng đúng 5 nhãn chuẩn, tên gọi khác chỉ trong cụm alias được test KB-U22 cho phép; "Hợp" cần rà bằng mắt.

---

## 12. Documentation and Release Plan

| Tài liệu | Cập nhật (F6.7) |
|---|---|
| UI Spec §11.1/§11.2 | ghi "Kiến thức" đã có; chênh lệch còn lại (Transit/Synastry/Language/Theme; Footer 3 cột) ghi rõ là **chưa triển khai** (không sửa phạm vi ngoài F6) |
| UI Spec §13, §14.1 | `/knowledge`, `/knowledge/:slug` → đã triển khai; bỏ `Pagination` (C1); chuyển khỏi "Backlog F5+" |
| UI Spec §18.3 | thêm empty state theo bộ lọc (copy đã duyệt) thay cho "tìm kiếm" |
| UI Spec §12.11 (F6.0b) | cập nhật ví dụ aria-label; thêm bảng **5 nhãn chuẩn** (nguồn chuẩn duy nhất); tài liệu lưu trữ không đổi |
| Architecture §5.1 | (nếu D-F6-K) làm rõ: CSR mặc định + prerender build-time cho `/knowledge*`; không SSR toàn app |
| CHANGELOG | mục **`[Unreleased]`** (D-F6-V): `### Added` — Knowledge Base; `### Changed` — nhãn góc chiếu (Trùng tụ, Vuông góc, Đối đỉnh). **Chỉ** ghi điều đã xác minh (bài học F5: không "WCAG compliance", "system-wide…") |
| README FE | `VITE_SITE_URL`, bước prerender, lưu ý hosting (`try_files … $uri.html`) |
| Registry/Matrix/Closure | `archive/sprint-f6/…` (tên: D-F6-R) |
| Version | FE `0.4.0`; F5 đã merge `main` (PR #67); tag `v0.4.0`: Owner xác nhận đã tạo nhưng **chưa thấy trên origin** (chỉ `v0.3.0`) — [UNK]. **Không bump** version trong F6 khi chưa có phê duyệt bằng văn bản (D-F6-V: giữ `[Unreleased]`) |

---

## 13. Risks and Expected Known Gaps

### 13.1 Rủi ro
| ID | Rủi ro | Xác suất | Tác động | Giảm thiểu |
|---|---|---|---|---|
| R1 | Hydration lệch DOM / nháy (D-F6-P2) | TB | TB | cổng đo; rơi về `createRoot` |
| R2 | Mã SSR-unsafe trong layout/trang tương lai làm vỡ build prerender | TB | TB | test `KB-U-ssr` + tự kiểm build (đây cũng là lợi ích: lỗi lộ sớm) |
| R3 | Hosting/Nginx chưa tồn tại và chưa kiểm `try_files`/404 (D-F6-H) ⇒ `/knowledge/<slug>` có thể rơi về SPA ở production | Cao nếu không ghi | Cao | task "deploy readiness" sau; F6 ghi yêu cầu + Known Gap; kiểm bằng `vite preview` |
| R4 | Domain/canonical sai hoặc `localhost` lọt vào production | TB | Cao | `VITE_SITE_URL` bắt buộc khi prerender; cảnh báo localhost |
| R5 | +37 kB gzip và +82 gói bắc cầu (chuỗi cung ứng) | Chắc chắn | Thấp–TB | chunk lazy; `npm audit`; ghim phiên bản |
| R6 | Nội dung sai/lệch thuật ngữ so với sản phẩm | TB | Cao | đối chiếu spec/`labels.ts`; Owner duyệt; test link gãy |
| R7 | Soft-404 (SPA fallback trả 200 cho slug lạ) | Chắc chắn | Thấp | `noindex` runtime; ghi Known Gap |
| R8 | Token typography `--text-body-md/lg` chưa định nghĩa gây cỡ chữ sai | TB | TB | không dùng class đó; đo ở F6.4; D-F6-X1 |
| R9 | `import.meta.glob` khác hành vi trong Vitest | Thấp | TB | xác minh ở bước đầu F6.2 |
| R10 | Footer/Navbar thay đổi vỡ test/E2E hiện có | Thấp | TB | cập nhật `MarketingLayout.test.tsx`; chạy toàn bộ suite |
| R11 | Chèn meta không escape ⇒ lỗi HTML/XSS build-time | Thấp | Cao | hàm escape + test KB-U18 |
| R12 | Phạm vi trôi (search/pagination/GFM/ảnh trang trí) | TB | TB | cổng GFM; danh sách loại trừ; Owner duyệt ngoại lệ |
| R13 | Prerender chỉ tại build ⇒ dev khác prod (parity) | Chắc chắn | Thấp | hook meta runtime dùng cùng `seo.ts`; kiểm `vite preview` |
| R14 | Trạng thái release F5 chưa rõ ⇒ version/nhánh F6 mơ hồ | TB | Thấp | F6.0 chốt |
| R15 | Nhãn "Trùng tụ" dài hơn "Hợp" gây xuống dòng/tràn ở bảng, badge, legend | Thấp–TB | Thấp | kiểm bằng mắt 320/375/768/1280 (F6-AC-L5) |
| R16 | Hydration cần sửa `main.tsx` mâu thuẫn điều kiện P1#1 | TB | TB | D-F6-A1; logic ở `hydrate.ts`, nhánh có điều kiện |
| R17 | Cổng hydration chỉ chạy cục bộ ⇒ hồi quy sau này không bị CI chặn | TB | TB | ghi Known Gap; chạy lại khi đổi layout/KB; cân nhắc tự động hoá ở task "deploy readiness" |
| R18 | `PRERENDER_STRICT` chưa được ép (chưa có pipeline deploy) ⇒ artifact chứa canonical `localhost` có thể lọt | TB | Cao | ghi Known Gap; kiểm thủ công trước deploy; ép ở task "deploy readiness" |
| R19 | Test nhãn cũ báo sai ("Hợp" trùng từ thông dụng) hoặc bỏ sót | TB | Thấp | chỉ cấm `Vuông chiếu`/`Đối xung`; "Hợp" qua checklist biên tập (D-F6-A5) |

### 13.2 Known Gap dự kiến (**chỉ ghi khi có bằng chứng lúc đóng sprint**)
Soft-404 slug lạ (SPA fallback trả 200; `noindex` runtime) — cải thiện bằng 404 thật ở Nginx khi có hosting; chưa có `og:image` (D-F6-D1); hydration nếu rơi về `createRoot`; **cổng hydration không chạy trong CI**; **hosting/Nginx và domain chưa kiểm** (D-F6-H); `PRERENDER_STRICT` chưa được ép tự động; tìm kiếm/phân trang (hoãn v1.1); QA Safari/Firefox/thiết bị thật và Narrator (kế thừa KG-F5-07/KG-F5M4-01/03); `updatedAt` thủ công; không có analytics (PRD §7.2); ảnh không khai báo kích thước (CLS) nếu có ảnh; `remark-gfm` chưa cài; Navbar còn liên kết giữ chỗ "Trang chủ/Giới thiệu" (có trước F6); Footer 3 cột/menu đầy đủ vẫn backlog (D-F6-N1).

---

## 14. Owner Decisions

### 14.1 Đã duyệt
Toàn bộ quyết định ở **Mục 3.1** (gồm `Confirmation.md`, phản hồi 2026-11-16, và quyết định D-F6-A1 ngày 2026-11-18) là **[AD]**. Không còn quyết định nào chặn tiến độ.

### 14.2 Điểm làm rõ kỹ thuật (mặc định = [REC], chưa duyệt)
| ID | Điểm làm rõ | Mặc định đề xuất | Trạng thái | Chặn? |
|---|---|---|---|---|
| **D-F6-A1** | Điều kiện P1#1 ("không thay đổi entry CSR hiện tại") và P2 (hydrate ở client) — hydrate bắt buộc sửa `main.tsx`. Diễn giải: *không đổi hành vi CSR hiện tại*; `main.tsx` chỉ thêm **một nhánh có điều kiện** gọi `src/app/hydrate.ts` | đồng ý diễn giải này | **ĐÃ DUYỆT [AD]** (2026-11-18) | **Không chặn** |
| D-F6-A2 | Khi `PRERENDER_STRICT=true`: yêu cầu `https:` và host không phải `localhost`/IP nội bộ | có | Đề xuất [REC] | không |
| D-F6-A3 | Sinh `knowledge/index.html` (giống `knowledge.html`) cho `/knowledge/` | có | Đề xuất [REC] | không |
| D-F6-A4 | URL sai định dạng **luôn** làm build fail (kể cả non-strict); chỉ trường hợp *thiếu* mới dùng fallback localhost | có | Đề xuất [REC] | không |
| D-F6-A5 | Test nhãn cũ chỉ cấm `Vuông chiếu`/`Đối xung` (trừ cụm alias); "Hợp" **không** kiểm tự động (trùng từ thông dụng) ⇒ checklist biên tập | có | Đề xuất [REC] | không |
| D-F6-A6 | KB-U23 import `ASPECT_TYPE_LABELS` từ `features/chart` (ngoại lệ chỉ trong test) để bài `major-aspects` dùng đúng nhãn chuẩn | có | Đề xuất [REC] | không |

### 14.3 Chuỗi UI đã duyệt (D-F6-U1)
h1 "Kiến thức chiêm tinh"; mô tả "Tìm hiểu các khái niệm nền tảng của chiêm tinh phương Tây: hành tinh, cung hoàng đạo, nhà và góc chiếu."; nhóm lọc "Lọc theo chủ đề" + nút "Tất cả"; "Hiển thị {n} bài viết"; empty "Chưa có bài viết trong chủ đề này" + nút "Xem tất cả bài viết"; not found "Không tìm thấy bài viết" + "Bài viết bạn tìm không tồn tại hoặc đã được di chuyển."; "← Tất cả bài viết"; "Cập nhật {ngày}" (`dd/MM/yyyy`); `aria-label="Chân trang"` (không hiển thị). Meta list (đề xuất, thuộc cùng nhóm copy): "Các bài viết giải thích khái niệm chiêm tinh phương Tây: hành tinh, cung, nhà và góc chiếu."

---

## 15. Definition of Done and Closure Evidence

### 15.1 DoD sprint (theo prompt §10, kèm bằng chứng)
| # | Điều kiện | Bằng chứng |
|---|---|---|
| 1–2 | Yêu cầu truy vết được; tôn trọng quyết định đã duyệt | Mục 8 + Matrix F6 |
| 3 | Route hoạt động cho Guest | KB-E01/E02 (CI) |
| 4 | Manifest ↔ file nhất quán | KB-U04/U05 |
| 5 | Render Markdown an toàn | KB-U10…U12 |
| 6 | Năm bộ lọc hoạt động | KB-E04/E05 |
| 7 | Trang bài dễ đọc, responsive | đo viewport (ảnh/số đo thật) |
| 8 | Điều hướng tích hợp | KB-E09, KB-U-nav |
| 9 | Đầu ra SEO sinh theo chiến lược đã duyệt | KB-P01…P08 trên build thật |
| 10–11 | Unit/E2E pass | log + CI |
| 12 | A11y hoàn tất và ghi lại (phần không kiểm = Known Gap) | KB-A01…A05 + QA thủ công |
| 13–15 | Hồi quy, production build, CI gates | log + CI run URL (commit chạm `frontend/**`) |
| 16 | Tài liệu cập nhật | Mục 12 |
| 17 | Known Gaps/rủi ro dư | Registry F6 |
| 18–19 | Evidence Matrix + Closure Report | `archive/sprint-f6/` |
| 20 | F6.0b: nhãn góc chiếu đổi đúng, không hồi quy | F6-AC-L1…L6 + log grep + test |
| 21 | Cổng hydration có bằng chứng (hoặc fallback (a) được ghi) | JSON + log `verify-hydration` + Matrix F6.5 |
| 22 | `PRERENDER_STRICT`/`resolveSiteUrl` có test; Known Gap về việc chưa ép tự động | KB-U24 + Registry |

### 15.2 Quy tắc bằng chứng
Mỗi AC ghi: ID · nguồn · file triển khai · test/bằng chứng · trạng thái (PASS/FAIL/BLOCKED/N/A) · ghi chú. **Không** PASS nếu thiếu bằng chứng; kiểm thử tự động không thay thế QA bàn phím/trình đọc màn hình thủ công; số đo layout phải có số thật; bằng chứng CI = URL run **của commit chạm `frontend/**`** (commit chỉ-docs không kích hoạt CI). Rút kinh nghiệm F5: bảng test ID phải được đối chiếu với mã thực (không trích ID không tồn tại); khẳng định về thuật ngữ/hành vi sản phẩm phải khớp mã/spec; không dùng từ "tuân thủ WCAG" khi chưa đủ bằng chứng; mô tả bằng "regex gate" thay cho "AST" nếu là regex.

### 15.3 Đóng sprint
Commit đóng theo tiền lệ F4/F5 ("finalize sprint f6 closure & complete gaps registry"); xoá `Sprint_F6_Implementation_Plan.md` (plan tạm) sau khi Owner nghiệm thu; tag/merge/version là hành động của Owner.

---

## 16. Effort, Open Questions, Sources

### 16.1 Độ phức tạp (không có số liệu vận tốc đáng tin ngoài ngày commit F5)
F6.0 S · F6.1 S · F6.2 M · F6.3 M · F6.4 M · **F6.5 L** (prerender + cổng hydration) · **F6.6 L** (viết/duyệt 15 bài + QA) · F6.7 M. Phần tốn thời gian nhất và khó rút ngắn: **nội dung** và vòng duyệt của Owner.

### 16.2 Thứ tự khuyến nghị
F6.0 → **F6.0b (đổi nhãn)** → F6.2 (bước đầu: xác minh `import.meta.glob` trong Vitest) → F6.3 → F6.4 → F6.5 (sau khi chốt D-F6-A1) → F6.6 (nội dung viết sau F6.0b; có thể bắt đầu song song với F6.3–F6.5) → F6.7. Lát cắt dọc prerender sớm vẫn là tuỳ chọn nếu Owner muốn giảm rủi ro.

### 16.3 Câu hỏi mở
(Q1) Tên miền production và thời điểm có sẵn? (Q2) Tag `v0.4.0` đã được push lên origin chưa (hiện chỉ thấy `v0.3.0`)? (Q3) Máy Owner có Chrome/Chromium cho script cổng hydration? (Q4) Task "deploy readiness" (hosting + Nginx URL mapping + `PRERENDER_STRICT` + staging) sẽ lập trong plan nào? (Q5) Chuẩn biên tập/độ dài bài ngoài repo (nếu có)?

### 16.4 Nguồn audit & những gì tôi đã chạy
- **Đọc trực tiếp:** PRD (FR-12…14, §3.1, §8), `Frontend_Architecture_Specification.md` (§5.1, §12.3, §15.5, cây thư mục), `Frontend_UI_Specification.md` (§11, §13, §14.1, §18.3), `Project_Architecture_Specification.md` (§Deployment), F5 plan (AC-24), `package.json`, `vite.config.ts`, `tsconfig.app.json`, `eslint.config.js`, `index.html`, `main.tsx`, `router.tsx`, `env.ts`, `MarketingLayout`, `HomePage`, `NotFoundPage`, `shared/ui/*`, `labels.ts`, `e2e/*`, `frontend-ci.yml`, `CHANGELOG.md`.
- **Lệnh/Spike đã chạy (không đụng repo):** `npm view react-markdown` (10.1.0, peer `react >=18`); dự án thử `/tmp/spike` (Vite 6.4.3 + React 18.3.1 + `react-router-dom` 7.18.2 + `react-markdown` 10.1.0): SSR build, prerender 2 bài, `StaticRouter`, `import.meta.glob` raw, an toàn HTML/URL, đo bundle (+≈121 kB raw / +37 kB gzip), `vite preview` với file `.html` phẳng; bản sao `/tmp/fe-spike` (symlink `node_modules`): SSR build + render `MarketingLayout` thật trong Node thành công; cài riêng `react-markdown` (+82 gói); grep thuật ngữ/engine.
- **Chưa làm / chưa biết:** hydration của app thật; hosting/Nginx/domain; mọi test/E2E/CI của F6 (chưa có mã); xác minh `import.meta.glob` trong Vitest (đã xác nhận `dist-ssr` có ở dòng 12 `frontend/.gitignore` [VF]); quyết định Owner ở Mục 14.
- **Bổ sung ở v1.1 (đã chạy, không đụng repo):** kiểm tag/merge (`v0.3.0` là tag duy nhất trên origin; PR #67 đã merge `dev`→`main`); spike `vite preview` với layout `knowledge/index.html` so với `knowledge.html` (kết quả F13); quét repo cho nhãn góc chiếu (một nguồn duy nhất, 3 file test, 1 dòng UI Spec); đọc `main.tsx`, `frontend/.gitignore`, UI Spec §12.11; tham khảo web về thuật ngữ góc chiếu tiếng Việt (chưa thống nhất: "Hợp/Trùng tụ", "Đối xung/Đối đỉnh/góc đối", "Vuông chiếu/Góc vuông").

**Xác nhận:** tài liệu này **không** sửa mã, test, cấu hình, dependency, tài liệu as-built, version hay lockfile của repo; **chưa được Owner duyệt**.
