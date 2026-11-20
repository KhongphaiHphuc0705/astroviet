# AstroViet — Frontend Sprint F6.3: Knowledge Base Listing Implementation Plan

| | |
|---|---|
| **Trạng thái** | **PLAN v1.0 — chờ Owner review.** Plan-only: không có mã ứng dụng, package, lockfile, cấu hình hay tài liệu nào trong repo bị thay đổi. Không AC nào được ghi PASS |
| **Repo / nhánh đã audit** | `KhongphaiHphuc0705/astroviet`, nhánh `dev`, HEAD `fcf9384` (2026-11-20, "[docs] update f6.2 evidence matrix"); evidence commit F6.2 = `f09ee7b`, **Frontend CI #360 = Success** (9m14s; 1 cảnh báo Node 20 của actions; log chi tiết cần đăng nhập nên không đọc được) |
| **Ngày lập** | 2026-11-20 |
| **Vị trí đề xuất** | `docs/implementation/Sprint_F6.3_Knowledge_Listing_Implementation_Plan.md` (tên theo prompt). Mọi plan sprint/milestone hiện có (`Sprint_F5_M7_M8_…`, `Sprint_F6_Implementation_Plan.md`) nằm ở `docs/implementation/`; plan milestone là tài liệu tạm, xoá khi đóng (như plan F6.2); Matrix/Registry ở `docs/implementation/archive/sprint-f6/` |
| **Nhãn bằng chứng** | **[VF]** đã đọc/chạy trực tiếp trên bản clone · **[SPIKE]** thí nghiệm tạm ngoài repo (clone `/home/claude/av` + bản sao `/tmp`, không commit) · **[AD]** quyết định Owner đã duyệt (F6 plan §3.1/§14.2, Matrix) · **[REC]/Proposed — Owner confirmation required** · **[UNK]** chưa biết · **[PLAN]** dự kiến |

---

## 1. Executive Summary

**Mục tiêu F6.3.** Xây trang công khai `/knowledge` (danh sách bài Knowledge Base): thẻ bài viết, lọc theo 1 trong 5 danh mục + `Tất cả`, đếm số bài đang hiển thị, empty state có hành động reset, lưới responsive, route lazy dưới `MarketingLayout`, truy cập được bởi guest. **Không** có trang chi tiết, SEO/prerender, phân trang, tìm kiếm.

**Phạm vi giao hàng.** `ArticleCard`, `CategoryFilter`, `KnowledgeListView`, `pages/knowledge/page.tsx`, 1 route lazy trong `router.tsx`, test component/page/route/axe, E2E guest + lọc + lưới responsive, tài liệu & Evidence Matrix F6.3.

**Quan hệ F6.1/F6.2.** F6.1 chốt RTM (KB-AC-01, 03, 13–18 gán cho F6.3) và các quyết định D-F6-*; F6.2 đã giao nền nội dung (manifest + service đồng bộ-về-dữ-liệu, 5 danh mục + nhãn, parity, renderer, SEO thuần). F6.3 **chỉ tiêu thụ** API công khai của F6.2 qua barrel `@features/knowledge-base`; **không** thiết kế lại F6.2.

**Kết quả audit F6.2 (tôi tự chạy ở HEAD `fcf9384`)** [VF]: `lint`, `typecheck`, `format:check` sạch; **120/120 test** của `features/knowledge-base` (11 file) pass; toàn bộ suite ở `e618907` (trước commit sửa lỗi) là 156 file/1.319 test pass — **chưa chạy lại toàn bộ ở HEAD** (sẽ chạy ở F6.3.1). Ba lỗi tôi nêu khi review F6.2 đã được xử lý và **tôi xác minh lại bằng thực nghiệm**: (a) thêm `content/README.md` giờ làm test parity thật **fail**; (b) import riêng `knowledgeContentService` từ barrel tạo chunk lazy **8,8 kB raw / 3,7 kB gzip, không có thư viện markdown** (trước đó 133 kB); (c) renderer dùng token Tailwind hợp lệ, `useMemo`. Barrel không còn xuất `MarkdownRenderer`.

**Phụ thuộc chính.** `knowledgeContentService.listArticles()` (đồng bộ), `KNOWLEDGE_CATEGORIES`, `KNOWLEDGE_CATEGORY_LABELS`, `KnowledgeArticleMetadata`; shared `Grid`/`Card`/`Badge`/`Button`/`EmptyState`; `MarketingLayout`; `vitest-axe`; Playwright + CI backend.

**Rủi ro kỹ thuật chính.** (1) `EmptyState` dùng `h3` cố định ⇒ `h1 → h3` vi phạm axe `heading-order` [SPIKE xác nhận]; (2) theme Tailwind **thay thế** (không extend) `colors/fontSize/fontFamily/borderRadius` ⇒ class không có trong theme **không sinh CSS** (bài học F6.2: 11 class hỏng đã lọt qua test); `text-body-md/lg` có biến CSS không tồn tại; (3) thẻ trỏ `/knowledge/:slug` nhưng trang chi tiết thuộc F6.4 ⇒ liên kết dẫn tới Not Found tạm thời; (4) mất focus sau khi bấm "Xem tất cả bài viết" (nút bị gỡ khỏi DOM); (5) E2E phải độc lập số lượng bài (hiện 1 bài mẫu, F6.6 sẽ có 15).

**Điều kiện hoàn thành.** KB-AC-01, 03, 13–18 có evidence thật (test/lệnh/ảnh viewport); các cổng `format:check`, `lint`, `typecheck`, `test`, `build`, E2E xanh; chunk trang listing không chứa thư viện markdown; không đụng route/test F4–F5 hiện có; Owner duyệt các quyết định mục 12.4.

**Không có blocker xác nhận** (mục 12.1). Có 8 quyết định Owner kèm mặc định đề xuất (mục 12.4); không quyết định nào chặn F6.3.1.

---

## 2. Current Repository State

### 2.1 Cấu trúc đã xác minh [VF]
| Hạng mục | Vị trí / ký hiệu | Ghi chú |
|---|---|---|
| Frontend root | `frontend/` — Vite 6.4.3, Vitest 4.1.10, React Router 7 (`createBrowserRouter`), Tailwind **3.4.19** | alias `@app @pages @widgets @features @entities @shared @test` (`tsconfig.app.json`) |
| Feature KB | `frontend/src/features/knowledge-base/{model,ui,content,index.ts}` | cấu trúc `model/ + ui/` như `features/chart` |
| Pages | `src/pages/<area>/page.tsx` (default export), ví dụ `pages/home/page.tsx`, `pages/app/charts/page.tsx` | **chưa có** `pages/knowledge/` |
| Router | `src/app/router.tsx` — `routesConfig` (export), nhóm `MarketingLayout` hiện chỉ có `index: true → HomePage`; catch-all `*` → `NotFoundPage` (`h-screen`); `SuspenseFallback` (Spinner, `role=status`) | **chưa có route `/knowledge`**; không có placeholder |
| Lazy convention | `const HomePage = lazy(() => import("@pages/home/page"))` + `<Suspense fallback={<SuspenseFallback/>}><Outlet/></Suspense>` bọc trong layout | route con khai báo `element: <XxxPage />` |
| Public layout | `src/widgets/marketing-layout/index.tsx` — `Container as="main" id="main-content" tabIndex={-1}` (`max-w-container-default`, `px-4 md:px-8`, `py-8`); Navbar chỉ có "Trang chủ"/"Giới thiệu" (**cả hai** trỏ `/`), **không** có "Kiến thức"; Footer 1 dòng bản quyền | KB-AC-06 (Navbar/Footer) **đã gán F6.5** (F6 plan §7 F6.5, D-F6-N1) — **không** làm ở F6.3 |
| Guard | `GuestRoute` chỉ bọc `/login`,`/register`; `ProtectedRoute` bọc `/app/*`; nhóm Marketing **không** có guard | thêm `/knowledge` vào nhóm Marketing là public, không đổi guard |
| Shared UI | `Grid` (polymorphic `as`, `columns={{xs,md,lg}}`), `Card` (`as`, `interactive` ⇒ `hover/focus-within` ring), `Badge` (`variant outline`, `size sm`), `Button` (`as={Link}`, `variant primary/secondary/ghost`, `size md = h-11 = 44px`), `EmptyState` (`title` là **`h3`**, `role="status"`, `action`), `Container`, `Stack` | `Pagination`/`Tabs`/`Chip` **không có** (F6 plan F8) |
| Precedent lưới | `features/chart/ui/ChartList/ChartList.tsx`: `<Grid as="ul" role="list" columns={{ xs:"1", md:"2", lg:"3" }} className="gap-6">`; `pages/app/profiles/page.tsx` cùng cột | **bằng chứng cho 1→2→3 cột**; Tailwind screens `md=768`, `lg=1024` (config mặc định) |
| Precedent thẻ | `ChartListItem`: `Card as="li"`, `h2` tiêu đề, `Badge outline`, `Button as={Link}` | F6.3 dùng `Card as="article"` + `li` ở view (xem D-F6.3-02) |
| Test infra | Vitest + jsdom, `src/test/setup.ts` (jest-dom, `vitest-axe/matchers`, MSW `onUnhandledRequest:"error"`), `renderWithProviders` (`ThemeProvider`+`QueryClient`+`MemoryRouter`) trong `src/test/render.tsx`; mẫu route test `app/router.test.tsx` (dùng `routesConfig` + `createMemoryRouter` + `useAuthStore`) | `@axe-core/playwright` **không** có |
| E2E | `frontend/e2e/*.spec.ts` (9 file, 60 test theo Matrix F6.0), `playwright.config.ts` (chromium Desktop Chrome, `baseURL :5173`, `webServer: npm run dev`, `forbidOnly` trên CI); CI **chạy E2E thật** với backend Postgres (`.github/workflows/frontend-ci.yml`, `npm run test:e2e`); precedent mock `page.route("**/api/v1/auth/refresh", …)` (`interpretation-responsive.spec.ts:32`) và allowlist 400/401 refresh (`chart.spec.ts:129`) | `test.skip`/`waitForTimeout` bị cấm theo prompt |
| Fixtures KB | `src/test/fixtures/knowledge-base/manifests.ts` → `VALID_FIXTURE_MANIFEST: readonly KnowledgeArticleMetadata[]` (6 bài: 1 ở `fundamentals`, **2 ở `planets`**, 1 ở `signs`/`houses`/`aspects`) | tái dùng cho test listing (đúng kiểu production) |

### 2.2 API F6.2 dùng được (barrel `@features/knowledge-base/index.ts`) [VF]
Xuất: `KNOWLEDGE_CATEGORIES` (`["fundamentals","planets","signs","houses","aspects"] as const`), `KnowledgeCategory`, `KNOWLEDGE_CATEGORY_LABELS` (Khái niệm cơ bản / Hành tinh / Cung / Nhà / Góc chiếu), `isKnowledgeCategory`, `KnowledgeArticleMetadata {slug,title,category,summary,order,updatedAt('YYYY-MM-DD')}`, `knowledgeContentService` (`listArticles(options?)` **đồng bộ**, trả danh sách đã sắp xếp xác định; `getArticleMetadata`; `getArticle` bất đồng bộ), `KNOWLEDGE_MANIFEST` (1 bài mẫu `what-is-astrology`, `fundamentals`), parity/registry/SEO helpers. **Không** xuất `MarkdownRenderer` (đã bỏ khỏi barrel để không kéo `react-markdown` vào mọi nơi import). Slug được validate runtime (`SLUG_PATTERN`, slug dành riêng `index`,`images`). Nội dung `listArticles` là **dữ liệu có sẵn khi gọi** ⇒ **không cần loading state** cho danh sách (prompt §5.4); chỉ có `Suspense` ở mức chunk route.

### 2.3 Phát hiện từ audit & thí nghiệm [SPIKE]
| # | Phát hiện | Hệ quả cho F6.3 |
|---|---|---|
| S1 | `axe` (vitest-axe) trên `<h1/>` + `EmptyState`: **`heading-order` (moderate)**; thêm `<h2 class="sr-only">` giữa hai thứ ⇒ sạch; `h1 → ul/li/h2` ⇒ sạch | cần xử lý `h3` của EmptyState (D-F6.3-06) |
| S2 | Barrel hiện tại, chỉ dùng `knowledgeContentService` trong một `import()` lazy: chunk **8.816 B raw / 3.674 B gzip**, không có `micromark`/`mdast`/`hast-util`; entry chính **không đổi đáng kể** | HR-1/HR-2 của F6.2 khả thi; có thể kiểm lại sau F6.3 |
| S3 | Thêm `content/README.md` ⇒ `contentFiles.test.ts` **fail** đúng như mong đợi (trước fix: pass) | parity thật đã đáng tin; F6.3 không cần sửa |
| S4 | Theme Tailwind **thay thế** `colors`, `fontSize`, `fontFamily`, `borderRadius`… [VF `tailwind.config.ts`]; bài kiểm trên F6.2 cho thấy class ngoài theme **không sinh CSS** mà test class-string vẫn pass | F6.3 bắt buộc có **cổng kiểm CSS thật** (Phụ lục A) |
| S5 | `tokens.css` định nghĩa `--font-size-body-md/lg` nhưng `tailwind.config.ts` tham chiếu `var(--text-body-md/lg)` ⇒ `text-body-md`/`text-body-lg` có biến **không tồn tại** (D-F6-X1); `text-body-base`, `text-display-sm` (HomePage) **không có** trong config | không dùng các class này; cỡ chữ cục bộ bằng giá trị tường minh (D-F6-X1) |
| S6 | Renderer F6.2 hiện dùng `text-body-md` ở `p/ul/ol/li` | **không thuộc F6.3**; ghi nhận cho F6.4 (mục 12.3) |

### 2.4 Chênh lệch giữa prompt F6.3, quyết định đã duyệt và repo — **không chọn âm thầm**
| ID | Chênh lệch | Đề xuất | Quyết định |
|---|---|---|---|
| M1 | Prompt §5.3: `KnowledgeListView` **tự lấy** danh sách qua service. F6 plan §6.5 & HR-3 (F6.2): view **presentational nhận `articles`** để test empty state mà không cần dữ liệu rỗng thật | **Trang** (`pages/knowledge/page.tsx`) gọi `knowledgeContentService.listArticles()`; `KnowledgeListView` nhận `articles` | D-F6.3-01 |
| M2 | D-F6-U1 (đã duyệt) có dòng thẻ "Cập nhật {ngày}" (`dd/MM/yyyy`); bảng copy của prompt không có. F6 plan gán "định dạng ngày xác định" cho **F6.4** | Thẻ có dòng cập nhật; **hàm format thuần** đưa vào F6.3 (card cần), F6.4 dùng lại | D-F6.3-04 |
| M3 | Prompt yêu cầu E2E guest ở F6.3; F6 plan đặt Playwright KB (`e2e/knowledge-base.spec.ts`, KB-AC-37–39) ở F6.6 (nhưng KB-AC-01/03/15/16 ghi "KB-E01/E04/E05") | Tạo `e2e/knowledge-base.spec.ts` **ở F6.3** (E01, E03, E04, E05 + lưới/overflow); F6.6 mở rộng (chi tiết, slug lạ…) | D-F6.3-05 |
| M4 | Navbar/Footer "Kiến thức" (D-F6-N1/D-F6-10, KB-AC-06) | **Đã gán F6.5**, chưa làm; **không** đưa vào F6.3 ⇒ `/knowledge` chỉ vào được bằng URL tới F6.5 | ghi nhận; Owner có thể kéo task nhỏ này sớm |
| M5 | `EmptyState` `h3` cố định (S1) | thêm prop `headingLevel` **hoặc** `h2` ẩn | D-F6.3-06 |
| M6 | PRD FR-12 liệt kê "…Góc chiếu, Khái niệm cơ bản" (cơ bản cuối) ↔ D-F6-C2 [AD]: "Khái niệm cơ bản" **đầu** | theo D-F6-C2 / `KNOWLEDGE_CATEGORIES` | đã duyệt |
| M7 | Nguồn đánh số **KB-AC-xx** là F6 plan §8 (từ prompt sprint), **không** phải PRD (PRD chỉ có FR-12/13/14). UI Spec §13 hàng 13 còn ghi `Pagination` + "⏳ Backlog"; §18.3 mô tả empty state theo tìm kiếm (C1/C2) | giữ nguyên số AC; Spec sửa ở F6.7 (không sửa ở F6.3) | ghi nhận |
| M8 | Thẻ trỏ `/knowledge/:slug` (đúng yêu cầu) nhưng route này đến F6.4; hiện `*` → `NotFoundPage` | chấp nhận có điều kiện: chỉ merge `dev`, **không phát hành F6.3 riêng** | D-F6.3-08 (rủi ro chấp nhận) |
| M9 | F6 plan §6.4/§6.5 đã **cũ** so với quyết định F6.2 (code block, ảnh `https:`, `http(s)`, title `\|` vs `—`) | cập nhật khi đóng F6.3 (mục 15) | — |
| M10 | F6.2: hai class cùng tên `KnowledgeContentIntegrityError` (service: có `issues`; `contentIntegrity.ts`: có `code`; chỉ bản sau nằm ở barrel) | **ngoài F6.3**; ghi vào Known Gaps/hand-off F6.5 | — |
| M11 | Tên file plan theo prompt (`Sprint_F6.3_Knowledge_Listing_…`) khác tên milestone plan trước (`Sprint_F6-2_…`) | giữ tên prompt | — |

---

## 3. Requirement Traceability Matrix

**Phân loại:** **[O]** AC chính thức theo RTM F6 plan §8 (nguồn gốc: prompt sprint; PRD FR-12 là yêu cầu gốc cho lọc theo danh mục) · **[M]** yêu cầu milestone đã duyệt (prompt F6.3 §5–7, D-F6-U1) · **[E]** cổng kỹ thuật bổ sung. Trạng thái toàn bộ: **PENDING**.

| # | Yêu cầu | Loại | Nguồn | Thành phần / route | Task | Test | Evidence kỳ vọng |
|---|---|---|---|---|---|---|---|
| 1 | **KB-AC-01** Guest vào `/knowledge` | O | RTM; UI Spec §13 | route con Marketing | F6.3.6, .7 | KB-U-route, KB-E01 | test route (guest + authenticated, không redirect) + E2E CI |
| 2 | **KB-AC-03** Dùng `MarketingLayout` | O | RTM; Spec §13 | `router.tsx` | F6.3.6 | KB-U-route, KB-E01 | test thấy `nav[aria-label="Điều hướng chính"]` + `main#main-content` |
| 3 | **KB-AC-13** Lưới thẻ responsive | O | RTM (KB-U13, "đo F6.3") | `Grid` + `KnowledgeListView` | F6.3.4, .5, .7 | KB-U13, KB-E11 | track `grid-template-columns` = 1/2/3 tại 375/768/1280 + không tràn ngang + ảnh chụp 320…1280 |
| 4 | **KB-AC-14** Đúng 5 danh mục | O | RTM; PRD FR-12 | `CategoryFilter` (từ `KNOWLEDGE_CATEGORIES`) | F6.3.3 | KB-U03 (F6.2), KB-U31 | 6 nút (Tất cả + 5), nhãn khớp `KNOWLEDGE_CATEGORY_LABELS`, không định nghĩa danh mục thứ hai |
| 5 | **KB-AC-15** Lọc đúng | O | RTM; FR-12 | `filterArticlesByCategory` + view | F6.3.3, .4 | KB-U32, KB-U35, KB-E04 | mọi thẻ hiển thị có đúng danh mục; số đếm khớp |
| 6 | **KB-AC-16** `Tất cả` reset | O | RTM | `CategoryFilter`/view | F6.3.3, .4 | KB-U35, KB-E05 | quay về toàn bộ bài |
| 7 | **KB-AC-17** Empty state | O | RTM; Spec §18.3 | `KnowledgeListView` (+`EmptyState`) | F6.3.4 | KB-U14, KB-A06 | copy đã duyệt + nút reset + focus |
| 8 | **KB-AC-18** Không phân trang/tìm kiếm | O | RTM (D-F6-08) | — | F6.3.7 | rà soát mã + KB-U36 | `git grep` không có `Pagination`/`search`/`input type=search` trong code F6.3 |
| 9 | ArticleCard hiển thị metadata thật | M | prompt §5.1 | `ArticleCard` | F6.3.2 | KB-U31a | tiêu đề/summary/nhãn/ngày/slug từ `KnowledgeArticleMetadata` |
| 10 | CategoryFilter dùng định danh canonical | M | prompt §5.2 | `CategoryFilter` | F6.3.3 | KB-U31 | `onSelect` nhận `KnowledgeCategory`/`"all"` |
| 11 | View suy ra danh sách + đếm (không trùng state) | M | prompt §5.3 | `KnowledgeListView` | F6.3.4 | KB-U35 | duy nhất 1 state `selected` |
| 12 | Đếm = số thẻ đang hiện | M | prompt §5.4 | view | F6.3.4 | KB-U35 | `Hiển thị {n} bài viết` = số `li` |
| 13 | Hành động empty reset filter | M | prompt §5.4 | view | F6.3.4 | KB-U14, KB-E05 | quay lại danh sách đủ + focus ở `Tất cả` |
| 14 | Route lazy cấp route | M | prompt §5.6 | `router.tsx` | F6.3.6, .7 | KB-U-route + đo bundle | page ở chunk riêng; **entry không đổi đáng kể**; chunk không chứa markdown libs |
| 15 | Guest không làm yếu route bảo vệ | M | prompt §5.7 | `router.tsx` | F6.3.6 | KB-U-route (+ test cũ) | `/app/*` vẫn redirect khi unauthenticated |
| 16 | Test component + axe | M | prompt §6 | — | F6.3.2–.7 | KB-U31…U36, KB-A01, A04–A07 | log vitest |
| 17 | E2E guest, refresh | M | prompt §6.3 | — | F6.3.7 | KB-E01, KB-E12 | CI (E2E thật) |
| 18 | Hồi quy F4/F5, build, typecheck, lint | E | prompt §6.4 | — | F6.3.8 | toàn bộ gate | log + CI |
| 19 | Class Tailwind sinh CSS thật | E | bài học F6.2, S4 | mọi file F6.3 | F6.3.2–.5, .8 | script Phụ lục A | báo cáo 0 class thiếu |
| 20 | Không `dangerouslySetInnerHTML`, không import markdown vào listing | E | prompt §12 | — | F6.3.7 | KB-U36 (regex gate) | `git grep` + gate |

---

## 4. Architecture and Design Decisions

> Mỗi quyết định: **Đề xuất · Lý do · Bằng chứng · Phương án khác · Đánh đổi**. Số hiệu `D-F6.3-xx` là đề xuất, chưa duyệt (mục 12.4 liệt kê những quyết định cần Owner).

### D-F6.3-01 — Sở hữu dữ liệu và state *(Proposed — Owner confirmation required; xem M1)*
- **Đề xuất:** `pages/knowledge/page.tsx` lấy `articles` từ `knowledgeContentService.listArticles()` (đồng bộ, trong `useMemo`) rồi truyền vào `KnowledgeListView`. `KnowledgeListView` giữ **một** state cục bộ: `selected: KnowledgeCategoryFilterValue` (mặc định `"all"`). Danh sách lọc và số đếm là **giá trị suy ra** (không state riêng).
- **Lý do:** test empty state/biên (danh mục rỗng, 1 bài, nhiều bài, tiêu đề dài) bằng fixture đúng kiểu mà không cần sửa manifest thật; HR-3 của F6.2. Component giao diện không biết `import.meta.glob` (guardrail prompt §12). Yêu cầu "obtain through the content-service boundary" được đáp ứng ở **trang** — ranh giới service vẫn là điểm duy nhất.
- **Bằng chứng:** F6 plan §6.5 ("`KnowledgeListView` presentational nhận `articles`"); Matrix F6.2 §7 HR-3; `ChartList` nhận `items` qua props.
- **Khác:** view tự gọi service ⇒ test empty state cần `vi.mock` module service hoặc manifest rỗng (khó); view nhận cả `getArticles`/service qua DI (thừa abstraction).
- **Đánh đổi:** trang là một lớp mỏng; chấp nhận.

### D-F6.3-02 — `ArticleCard`
- **Đề xuất:** `Card as="article" interactive` (`relative`), trong đó: `Badge outline sm` nhãn danh mục; `h2` chứa `Link` (react-router `Link`) tới `/knowledge/{slug}`, dùng **stretched link** (`after:absolute after:inset-0`) để cả thẻ là một mục tiêu bấm duy nhất; summary (không cắt); dòng `Cập nhật <time dateTime={updatedAt}>dd/MM/yyyy</time>`. `li` do `KnowledgeListView` bọc (không đặt `li` trong `ArticleCard`).
- **Lý do:** một liên kết có tên truy cập = tiêu đề (không lặp thông tin cho trình đọc màn hình); `Card interactive` đã có `focus-within:ring` + hover ⇒ thẻ chỉ có dáng "bấm được" **vì thật sự bấm được**; `ArticleCard` hợp lệ khi render độc lập (axe `listitem`).
- **Bằng chứng:** `Card` (`interactive`, `as`), `Badge` (non-interactive), `ChartListItem` (precedent `h2` + `Link`), `react-router-dom` `Link` là chuẩn dự án.
- **Khác:** (a) chỉ tiêu đề là link, thẻ không `interactive` — mục tiêu nhỏ hơn nhưng không có chọn-văn-bản bị chặn; (b) `Button as={Link}` "Đọc bài" — thêm một liên kết trùng ý. **Chọn stretched link; (a) là phương án dự phòng** (D-F6.3-03).
- **Đánh đổi:** overlay chặn chọn/copy summary bằng chuột; chấp nhận (mẫu phổ biến). Cần xác minh focus ring nhìn thấy được (Link `outline` + ring của `Card` không chồng xấu).

### D-F6.3-03 — Mẫu ngữ nghĩa của `CategoryFilter`
- **Đề xuất:** `<div role="group" aria-labelledby={useId()}>` với nhãn hiển thị `Lọc theo chủ đề`, chứa **6 `Button` (toggle)** có `aria-pressed`; đúng một nút `aria-pressed="true"`. Chọn: `variant="primary"`, các nút khác `variant="secondary"`; `size="md"` (44px = `--hit-area-min`). Bố cục `flex flex-wrap gap-2` (xuống dòng, không cuộn ngang).
- **Lý do:** F6 plan §6.5 đã đề xuất đúng mẫu này; chỉ một mục được chọn nhưng đây là **bộ lọc** (không submit form) ⇒ toggle button là ngữ nghĩa HTML gốc, Tab/Space/Enter dùng sẵn, **không cần mã bàn phím tự viết**; `role="tablist"` sai ngữ nghĩa (không có tabpanel — prompt cấm dùng tablist chỉ để tạo kiểu); `radiogroup` yêu cầu roving tabindex + phím mũi tên tự viết, `shared/ui/Radio` thiên về form.
- **Bằng chứng:** `Button` hỗ trợ `aria-pressed` qua `ButtonHTMLAttributes`; không có `Tabs/Chip` trong `shared/ui`; ví dụ có sẵn `aria-expanded` trên nút menu ở `MarketingLayout`.
- **Khác:** radiogroup (mũi tên điều hướng, 1 tab stop) — tốt cho nhóm lớn nhưng tốn mã & test; `<select>` — ẩn lựa chọn, không khớp "6 nút".
- **Đánh đổi:** 6 điểm dừng Tab (chấp nhận được). Khác biệt trạng thái chọn không chỉ dựa vào màu: `aria-pressed` + khác biệt fill (primary/secondary) — kiểm bằng mắt ở cả hai theme.
- **Hành vi bàn phím (để tài liệu hoá):** `Tab`/`Shift+Tab` di chuyển giữa nút; `Enter`/`Space` chọn; focus **ở yên trên nút vừa chọn**.

### D-F6.3-04 — Kiểu giá trị bộ lọc, hàm lọc và định dạng ngày
- **Đề xuất:** file mới `model/categoryFilter.ts`: `CATEGORY_FILTER_ALL = "all"`, `type KnowledgeCategoryFilterValue = KnowledgeCategory | typeof CATEGORY_FILTER_ALL`, `filterArticlesByCategory(articles, selected)` (thuần, giữ thứ tự đầu vào, `"all"` ⇒ toàn bộ). File mới `model/formatDate.ts`: `formatKnowledgeDate('YYYY-MM-DD') → 'dd/MM/yyyy'` (tách chuỗi, **không** dùng `Date`/`Intl` ⇒ không phụ thuộc múi giờ/locale, SSR-safe; giá trị lạ trả nguyên chuỗi). File mới `model/routes.ts`: `KNOWLEDGE_LIST_PATH`, `knowledgeArticlePath(slug)`.
- **Lý do:** một định nghĩa duy nhất cho `"all"` (tránh chuỗi ma thuật ở card/filter/test); lọc là logic thuần dễ test biên; định dạng ngày xác định là điều kiện cho prerender/hydration (F6.5) và dùng lại ở F6.4; đường dẫn không lặp chuỗi `"/knowledge/..."`.
- **Bằng chứng:** `pages/app/profiles/page.tsx` có `formatDate` cục bộ kiểu tách chuỗi; `formatCalculatedAt` dùng `Intl` (phụ thuộc môi trường) — KB cần xác định tuyệt đối. Barrel F6.2 không xuất các thứ này nên là file mới, **không sửa file F6.2**.
- **Khác:** `Intl.DateTimeFormat('vi-VN', {timeZone:'UTC'})` — phụ thuộc ICU của Node/trình duyệt.
- **Đánh đổi:** 3 file rất nhỏ; mỗi file có test riêng; không thêm abstraction khác.

### D-F6.3-05 — Đếm và vùng thông báo
- **Đề xuất:** `<p role="status">Hiển thị {n} bài viết</p>` luôn có trong DOM (kể cả `n = 0`), `n = filtered.length`. Không `aria-live` thủ công (role `status` ngầm polite + atomic).
- **Lý do:** vùng live phải tồn tại trước khi nội dung đổi để trình đọc màn hình thông báo; số đếm = số `li` hiển thị, suy ra từ cùng một mảng đã lọc.
- **Rủi ro:** `EmptyState` cũng có `role="status"` ⇒ hai vùng status khi rỗng (ồn nhẹ) — ghi vào QA thủ công (mục 11).

### D-F6.3-06 — Empty state và thứ bậc heading *(Owner decision — S1)*
- **Đề xuất (A, mặc định):** thêm prop tùy chọn `headingLevel?: "h2" | "h3"` (mặc định `"h3"`, **không đổi hành vi hiện có**) cho `shared/ui/EmptyState`; listing dùng `h2` ⇒ `h1 → h2` (cùng bậc với tiêu đề thẻ). Thay đổi: 1 file + test; các nơi dùng `EmptyState` hiện có không đổi.
- **B:** không sửa shared; thêm `h2` `sr-only` "Danh sách bài viết" ⇒ tiêu đề thẻ phải là `h3` (lệch F6 plan §6.5 `h2`, thêm copy chưa duyệt).
- **C:** viết khối empty tại chỗ (không dùng `EmptyState`) — mất tái dùng, tự duy trì class.
- **Lý do chọn A:** thay đổi nhỏ, tương thích ngược, giữ `h2` thẻ theo plan/precedent `ChartListItem`. **Rủi ro:** chạm shared component ⇒ chạy lại test `EmptyState` + trang dùng nó (`profiles`).

### D-F6.3-07 — Lưới responsive
- **Đề xuất:** `<Grid as="ul" role="list" columns={{ xs: "1", md: "2", lg: "3" }} className="gap-6">`, mỗi con là `li` có `className="flex"`/`h-full` để thẻ cao đều (`ArticleCard` `h-full`).
- **Bằng chứng:** `ChartList.tsx`, `pages/app/profiles/page.tsx` (cùng cột/gap); `COLUMNS_MAPPING` có `md`/`lg`; `Container` đã `px-4 md:px-8`. `role="list"` tường minh theo precedent (Safari/VoiceOver bỏ ngữ nghĩa list khi `list-style:none`).
- **Mốc:** `<768px` 1 cột; `768–1023px` 2 cột; `≥1024px` 3 cột. Kiểm tại 320, 375, 768, 1024, 1280 (mục 10.6).
- **Không** tạo token/khoảng cách mới; **không** `overflow-x`; tiêu đề/summary xuống dòng tự nhiên (`break-words`, **không** `truncate`/line-clamp vì đây là nội dung, khác `ChartListItem`).

### D-F6.3-08 — Route, lazy, guest *(rủi ro chấp nhận có điều kiện — M8)*
- **Đề xuất:** trong `router.tsx`: `const KnowledgeListPage = lazy(() => import("@pages/knowledge/page"));` (nhóm "Public Pages") và thêm vào `children` của nhóm `MarketingLayout`: `{ path: "knowledge", element: <KnowledgeListPage /> }`. **Chỉ** các dòng đó. Không đổi guard, `HomePage`, `*`, route `/app/*`.
- **Bằng chứng:** cấu trúc `router.tsx` (đọc nguyên văn ở 2.1); mẫu `HomePage`. Không có placeholder `/knowledge` ⇒ thêm, không thay.
- **Tạm thời:** `/knowledge/:slug` vẫn rơi vào `*` (NotFoundPage `h-screen`) cho tới F6.4 ⇒ **F6.3 không phát hành riêng; chỉ merge vào `dev`**. Test E2E chỉ khẳng định `href` của thẻ, không khẳng định nội dung đích.

### D-F6.3-09 — Không loading state; state không vào URL
- Danh sách đồng bộ ⇒ không skeleton/spinner (prompt §5.4); `Suspense` sẵn có cho chunk route là đủ.
- Bộ lọc là state cục bộ ⇒ **tải lại trang trả về `Tất cả`** (F6 plan §8 / D-F6 "state cục bộ"). Đồng bộ `?category=` lên URL **ngoài phạm vi** (Owner có thể yêu cầu ở backlog).

### D-F6.3-10 — Barrel và phạm vi chạm F6.2
- `features/knowledge-base/index.ts` **chỉ** thêm xuất `KnowledgeListView` (+ `KnowledgeListViewProps`) và các hằng/kiểu mới cần cho trang (`CATEGORY_FILTER_ALL`, `KnowledgeCategoryFilterValue`, `formatKnowledgeDate`, `knowledgeArticlePath`/`KNOWLEDGE_LIST_PATH` nếu trang/F6.4 cần). `ArticleCard`/`CategoryFilter` nội bộ (import tương đối). Không import `MarkdownRenderer`/`react-markdown`/`contentFiles` trong code F6.3 (regex gate KB-U36).
- **File F6.2 được bảo vệ** (không sửa ngoài `index.ts`): `model/{types,validateManifest,manifest,contentIntegrity,contentFiles,knowledgeContentService,markdownPolicy,seo}.ts`, `ui/MarkdownRenderer*.tsx`, toàn bộ test F6.2, `content/**`, `src/test/setup.ts`, fixtures hiện có (có thể **thêm** fixture mới, không sửa cái cũ).

### D-F6.3-11 — Cỡ chữ/token (D-F6-X1, S4–S5)
- Chỉ dùng class **chắc chắn có CSS**: `text-heading-lg|md|sm`, `text-display-lg`, `text-body-sm`, `text-label`, `font-*` có trong theme, màu `text-primary|secondary|muted`, `border-subtle`, `bg-surface*`. Cỡ chữ đoạn văn đọc dùng giá trị tường minh `text-[16px]`/`text-[14px]` + `leading-relaxed` (D-F6-X1). **Không** dùng `text-body-md/lg/base`, `text-display-sm`, `font-mono`, `rounded` trần, `text-subtle` cho chữ nội dung (là token màu viền) — kiểm bằng cổng CSS (Phụ lục A) và QA thị giác hai theme.

### D-F6.3-12 — Focus sau khi reset từ empty state
- `CategoryFilter` nhận `allButtonRef?: Ref<HTMLButtonElement>`; `KnowledgeListView` sau khi `onSelect("all")` từ nút "Xem tất cả bài viết" gọi `allButtonRef.current?.focus()` (nút empty bị gỡ khỏi DOM nên nếu không sẽ mất focus về `body`). Chọn bằng nút lọc thường: focus ở yên.

---

## 5. Component Contracts *(đề xuất — chưa phải mã hiện có; tên/kiểu F6.2 đã xác minh)*

```ts
// model/categoryFilter.ts (mới)
export const CATEGORY_FILTER_ALL = "all" as const;
export type KnowledgeCategoryFilterValue = KnowledgeCategory | typeof CATEGORY_FILTER_ALL;
export function filterArticlesByCategory(
  articles: readonly KnowledgeArticleMetadata[],
  selected: KnowledgeCategoryFilterValue,
): readonly KnowledgeArticleMetadata[];

// model/formatDate.ts (mới)
export function formatKnowledgeDate(updatedAt: string): string;        // 'YYYY-MM-DD' -> 'dd/MM/yyyy'; giá trị lạ: trả nguyên

// model/routes.ts (mới)
export const KNOWLEDGE_LIST_PATH = "/knowledge";
export function knowledgeArticlePath(slug: string): string;            // `/knowledge/${slug}`

// ui/ArticleCard.tsx (mới)
export interface ArticleCardProps { readonly article: KnowledgeArticleMetadata }

// ui/CategoryFilter.tsx (mới)
export interface CategoryFilterProps {
  readonly selected: KnowledgeCategoryFilterValue;
  readonly onSelect: (value: KnowledgeCategoryFilterValue) => void;
  readonly allButtonRef?: Ref<HTMLButtonElement>;
}                                                // tùy chọn lấy từ KNOWLEDGE_CATEGORIES + KNOWLEDGE_CATEGORY_LABELS, không nhận qua props

// ui/KnowledgeListView.tsx (mới)
export interface KnowledgeListViewProps { readonly articles: readonly KnowledgeArticleMetadata[] }

// pages/knowledge/page.tsx (mới) — default export, không props
```
Không thêm field vào `KnowledgeArticleMetadata` (không cần: tiêu đề, summary, danh mục, ngày, slug đều có sẵn). Không `any`. Mỗi component ≤ ~120 dòng (Coding Standards §3.2).

---

## 6. User Interaction and State Model

**Source state:** `selected` (1 giá trị, trong `KnowledgeListView`). **Props/nguồn:** `articles`. **Derived:** `filtered = filterArticlesByCategory(articles, selected)`, `count = filtered.length`, `isEmpty = count === 0`.

| # | Tình huống | Hành vi mong đợi |
|---|---|---|
| 1 | Tải trang lần đầu | h1 + mô tả; nhóm lọc; `selected="all"` (`Tất cả` `aria-pressed=true`); `Hiển thị N bài viết` (N = tổng); lưới đủ bài |
| 2 | Mặc định `Tất cả` | đúng 1 nút pressed |
| 3 | Chọn danh mục X | nút X pressed, `Tất cả` không pressed; chỉ thẻ có `category === X`; thứ tự giữ nguyên thứ tự service |
| 4 | Cập nhật đếm | `Hiển thị {số thẻ hiện} bài viết` (cùng mảng với lưới) |
| 5 | Danh mục không có bài | lưới thay bằng `EmptyState`: "Chưa có bài viết trong chủ đề này" + nút "Xem tất cả bài viết"; đếm `Hiển thị 0 bài viết` |
| 6 | Bấm "Xem tất cả bài viết" | `selected → "all"`; lưới đủ bài; focus chuyển tới nút `Tất cả` |
| 7 | Bấm thẻ | điều hướng SPA tới `/knowledge/{slug}` (Link, không reload) — đích hoàn thiện ở F6.4 |
| 8 | F5 / reload ở `/knowledge` | tải lại chunk; trạng thái về `Tất cả` (state không lưu) |
| 9 | Guest | không redirect, không cần đăng nhập |

```
selected="all" ──chọn X──► selected=X ──(X có bài)──► lưới X
      ▲                        │
      │                        └──(X rỗng)──► Empty ──"Xem tất cả bài viết"──┐
      └────────────────────────── chọn "Tất cả" ◄──────────────────────────────┘
```

---

## 7. UI and Responsive Design Specification

**Cấu trúc trang** (trong `main#main-content` của `MarketingLayout`, không thêm landmark thừa):
```
<div class="flex flex-col gap-8">                         ← pages/knowledge/page.tsx
  <header>  <h1>Kiến thức chiêm tinh</h1>  <p>Tìm hiểu các khái niệm nền tảng …</p>  </header>
  <KnowledgeListView articles={…}/>
      <div role="group" aria-labelledby>  <p id>Lọc theo chủ đề</p>  [Tất cả][Khái niệm cơ bản][Hành tinh][Cung][Nhà][Góc chiếu]  </div>
      <p role="status">Hiển thị N bài viết</p>
      <ul role="list" grid> <li><article card/></li> … </ul>       (hoặc EmptyState)
</div>
```
**Copy đã duyệt** (D-F6-U1 = prompt §5.4): H1 `Kiến thức chiêm tinh`; mô tả `Tìm hiểu các khái niệm nền tảng của chiêm tinh phương Tây: hành tinh, cung hoàng đạo, nhà và góc chiếu.`; nhãn nhóm `Lọc theo chủ đề`; `Tất cả`; `Hiển thị {n} bài viết`; `Chưa có bài viết trong chủ đề này`; `Xem tất cả bài viết`; dòng thẻ `Cập nhật {dd/MM/yyyy}`. Nhãn danh mục: từ `KNOWLEDGE_CATEGORY_LABELS`. Không thêm copy mới (không có `h2` ẩn, không placeholder).

**Nội dung thẻ:** Badge danh mục → tiêu đề (`h2`, link) → summary → ngày cập nhật. Thẻ `h-full flex flex-col`, dòng ngày `mt-auto`. Khoảng cách dùng thang hiện có (`gap-3/4/6`).

**Lớp tham chiếu (đề xuất, phải qua cổng CSS):** h1 `text-heading-lg md:text-display-lg font-bold text-primary`; mô tả `max-w-container-narrow text-[16px] leading-relaxed text-secondary`; tiêu đề thẻ `text-heading-sm font-semibold text-primary break-words`; summary `text-[14px] leading-relaxed text-secondary`; ngày `text-body-sm text-muted`.

| Viewport | Hành vi |
|---|---|
| **Mobile (<768px, kiểm 320/375)** | 1 cột; nhóm lọc xuống dòng (flex-wrap), nút 44px; không cuộn ngang; thẻ đọc được ở 320px |
| **Tablet (768–1023px)** | 2 cột; `gap-6`; padding `md:px-8` (từ `Container`) |
| **Desktop (≥1024px, kiểm 1280)** | 3 cột trong `max-w-container-default` |
| **Dark/Light** | cùng token; kiểm cả hai theme |

**Bàn phím/focus:** Tab đi qua skip link → Navbar → 6 nút lọc → các link thẻ theo thứ tự DOM → footer. Nút lọc: `Enter/Space`. Mọi phần tử tương tác có `focus-visible` ring (Button có sẵn; thẻ dùng ring `focus-within` của `Card interactive`). `prefers-reduced-motion`: `Card`/`Button` đã có `motion-reduce`. **Không** thêm animation mới.

**Ngữ nghĩa HTML:** `header`/`h1` một lần; `ul/li`; `article` cho thẻ; `time dateTime`; `p role="status"`; `div role="group"` có nhãn; không ARIA thừa (không `role="tablist"`, không `aria-label` lặp tên link).

---

## 8. Route and Loading Strategy

- **Điểm tích hợp duy nhất:** `frontend/src/app/router.tsx` (2 chỗ: khai báo `lazy` ở khối "Public Pages"; 1 object route trong `children` của nhóm `MarketingLayout`). Không sửa `MarketingLayout`/Navbar/Footer (KB-AC-06 là F6.5).
- **Lazy:** theo đúng quy ước hiện có (`lazy(() => import("@pages/…"))` + `Suspense` + `SuspenseFallback` đã có sẵn bên ngoài `Outlet`).
- **Layout công khai & guest:** route nằm trong nhóm Marketing (không guard) ⇒ guest vào được; user đã đăng nhập cũng vào được (không bị `GuestRoute` đẩy đi).
- **Lỗi/fallback:** `RootErrorBoundary` của route gốc xử lý lỗi render; `Suspense` xử lý chunk tải chậm. Không thêm error boundary mới. Khi tải chunk lỗi: hành vi hiện có của app (ghi nhận, không xử lý riêng ở F6.3).
- **Bảo toàn route:** test hồi quy `/`, `/login`, `/register`, `/app` (redirect khi chưa đăng nhập), `*` → NotFound; `/knowledge/xyz` vẫn → NotFound (hành vi tạm thời tới F6.4).
- **Kiểm chứng không nằm trong bundle chính:** (1) `npm run build` trước/sau; (2) Phụ lục B (Node, không thêm dependency): entry không đổi quá vài trăm byte; xuất hiện **một** chunk mới chứa chuỗi `Kiến thức chiêm tinh` và `what-is-astrology`; **không** có `micromark|mdast-util|hast-util-to-jsx-runtime` ở bất kỳ chunk nào được `/knowledge` kéo theo (listing không import renderer). Kỳ vọng tham chiếu [SPIKE]: service-only ≈ 8,8 kB raw / 3,7 kB gzip; chunk trang sẽ lớn hơn một chút do UI.
- **Cổng này lặp lại ở F6.4** khi `MarkdownRenderer` lazy được thêm (HR-1 F6.2).

---

## 9. Milestone Breakdown

*Ước lượng độ phức tạp chủ quan (S/M), **không** dựa trên số liệu vận tốc; mỗi task commit riêng, tiền tố theo lịch sử repo (`[feat]`, `[test]`, `[docs]`).*

### F6.3.1 — Repository & F6.2 Integration Verification (S)
- **Objective:** xác nhận điều kiện vào, ghi baseline, chốt quyết định Owner trước khi viết mã.
- **Scope:** chỉ đọc/chạy lệnh; không sửa file. *(Spike S1–S3 đã chạy trong lúc lập plan; ở đây lặp lại ngay trong repo.)*
- **Files:** không (kết quả ghi vào Matrix F6.3 ở F6.3.8).
- **Dependencies:** Owner duyệt plan (D-F6.3-01, 02, 06 tối thiểu).
- **Steps:** (1) `git status` sạch, HEAD ≥ `fcf9384`, `.env` từ `.env.example`; (2) `npm ci`; `format:check`, `lint`, `typecheck`, `npm test` (ghi số file/test), `npm run build` (ghi kích thước entry/CSS bằng Phụ lục B), `CI=1 npx playwright test --list` (kỳ vọng 60/9 — Matrix F6.0); (3) xác nhận barrel xuất đủ ký hiệu mục 2.2 và **không** xuất `MarkdownRenderer`; (4) lặp S1 (axe heading-order) bằng test tạm **không commit**; (5) chạy script CSS Phụ lục A trên `MarkdownRenderer.tsx` làm mẫu hiệu chuẩn; (6) ghi baseline.
- **Acceptance:** baseline xanh hoặc chênh lệch giải thích bằng văn bản; mọi giả định mục 2 được xác nhận hoặc ghi lệch.
- **Tests:** không mới. **Evidence:** log lệnh + bảng baseline (SHA, ngày). **Risks:** số liệu trôi (advisory, commit mới) ⇒ ghi ngày/SHA.

### F6.3.2 — Foundations & `ArticleCard` (M)
- **Objective:** các hàm thuần cần chung + thẻ bài viết.
- **Scope:** `model/formatDate.ts`, `model/routes.ts`, `ui/ArticleCard.tsx` (+ test). (`categoryFilter.ts` ở F6.3.3.)
- **Files (mới):** `features/knowledge-base/model/formatDate.ts`, `formatDate.test.ts`, `routes.ts`, `routes.test.ts`, `ui/ArticleCard.tsx`, `ui/ArticleCard.test.tsx`.
- **Dependencies:** F6.3.1.
- **Steps:** test-first cho `formatKnowledgeDate` (hợp lệ, ngày 1 chữ số, giá trị lạ trả nguyên, không phụ thuộc múi giờ — chạy với `TZ` khác nhau) → `routes` → `ArticleCard` theo D-F6.3-02 → chạy script CSS → axe.
- **Acceptance:** thẻ hiển thị tiêu đề/summary/nhãn/ngày từ metadata; một link có tên = tiêu đề, `href="/knowledge/{slug}"`; không dùng class ngoài theme; render độc lập không vi phạm axe.
- **Tests:** KB-U31a (nội dung, href, một link duy nhất, nhãn đúng danh mục, `time[datetime]`), KB-U34 (ngày), tiêu đề rất dài/summary dài (xuống dòng, không `truncate`), axe thẻ. Điều hướng: `userEvent.click` → `location` đổi (MemoryRouter), không reload.
- **Evidence:** log vitest; báo cáo CSS 0 class thiếu. **Risks:** ring focus chồng outline ⇒ xem QA thị giác; link overlay che chữ ⇒ kiểm click vào badge/summary cũng điều hướng.

### F6.3.3 — `CategoryFilter` (M)
- **Objective:** bộ lọc 6 nút canonical.
- **Files (mới):** `model/categoryFilter.ts` (+ test), `ui/CategoryFilter.tsx` (+ test).
- **Dependencies:** F6.3.1 (độc lập F6.3.2 — có thể song song).
- **Steps:** test-first `filterArticlesByCategory` → `CategoryFilter` (nhóm có nhãn `useId`, 6 `Button`, `aria-pressed`, `allButtonRef`) → test → script CSS → axe.
- **Acceptance:** đúng 6 nút theo thứ tự `Tất cả` + `KNOWLEDGE_CATEGORIES`, nhãn từ `KNOWLEDGE_CATEGORY_LABELS`; đúng 1 pressed; `onSelect` nhận đúng định danh; bàn phím `Enter/Space`.
- **Tests:** KB-U31 (6 nút, pressed, callback từng danh mục, `Tất cả` → `"all"`, `userEvent.keyboard`/`tab`), KB-U32 (lọc: `"all"`, 1 bài, nhiều bài, danh mục rỗng, giữ thứ tự, không đột biến mảng đầu vào), tên truy cập của group, axe mọi trạng thái pressed. **Boundary "định danh không hợp lệ":** kiểu `KnowledgeCategoryFilterValue` khiến giá trị lạ không thể phát sinh từ UI; test tài liệu hoá `isKnowledgeCategory("x") === false` và helper trả `[]` khi cưỡng ép cast — không mâu thuẫn service F6.2 (service ném `RangeError` cho tham số lạ, nhưng listing không gọi tham số đó).
- **Evidence:** log. **Risks:** trạng thái chọn chỉ dựa vào màu ⇒ kiểm hai theme; nút 44px trên mobile.

### F6.3.4 — `KnowledgeListView` (+ `EmptyState` prop nếu D-F6.3-06 = A) (M)
- **Objective:** phối hợp filter, đếm, lưới, empty state, reset + focus.
- **Files:** (mới) `ui/KnowledgeListView.tsx`, `ui/KnowledgeListView.test.tsx`; (sửa nhỏ, **chỉ nếu duyệt A**) `shared/ui/EmptyState/EmptyState.tsx` + `EmptyState.test.tsx` (thêm `headingLevel`, mặc định `"h3"`).
- **Dependencies:** F6.3.2, F6.3.3.
- **Steps:** (1) `EmptyState` (A) + test hồi quy hành vi mặc định; (2) view: `useState<KnowledgeCategoryFilterValue>("all")`, suy ra `filtered/count`, `Grid as="ul" role="list"` + `li`, `p role="status"`, empty state + reset + `focus()`; (3) test; (4) script CSS; (5) axe.
- **Acceptance:** KB-AC-15/16/17; đếm = số `li`; chỉ một state; reset trả toàn bộ và focus ở `Tất cả`.
- **Tests:** KB-U13 (lưới: `ul[role=list]`, class cột `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, số `li`), KB-U14 (empty: copy, nút, role status), KB-U35 (lọc từng danh mục trong `VALID_FIXTURE_MANIFEST` [có danh mục 1 bài và 2 bài], đếm cập nhật, reset, focus, "mảng rỗng" `articles=[]` ⇒ `Hiển thị 0 bài viết` + empty — *hợp lệ vì view nhận mảng bất kỳ; F6.2 `listArticles()` hiện có ≥1 bài nhưng không cam kết ≥1*), tiêu đề/summary dài.
- **Evidence:** log. **Risks:** nhiều vùng `status` khi rỗng; mất focus (đã xử lý D-F6.3-12).

### F6.3.5 — Listing Page & Responsive Grid (S)
- **Objective:** trang `/knowledge` ghép header + view.
- **Files (mới):** `pages/knowledge/page.tsx`, `pages/knowledge/page.test.tsx`; (sửa) `features/knowledge-base/index.ts` (xuất `KnowledgeListView` + kiểu/hằng mới — D-F6.3-10).
- **Dependencies:** F6.3.4.
- **Steps:** page: `useMemo(() => knowledgeContentService.listArticles(), [])`; `h1` + mô tả; `<KnowledgeListView articles>`; import **chỉ** từ `@features/knowledge-base`; test tích hợp bằng `renderWithProviders`; script CSS; kiểm bằng mắt (F6.3.7).
- **Acceptance:** đúng một `h1`; copy đã duyệt nguyên văn; hiển thị đúng bài từ manifest thật; không import markdown/glob.
- **Tests:** KB-U36 (page: h1 duy nhất = `Kiến thức chiêm tinh`, mô tả, có `group` + `status` + ≥1 `article`; regex gate: không `dangerouslySetInnerHTML`, `MarkdownRenderer`, `react-markdown`, `import.meta.glob`, `Pagination`, `type="search"` trong code F6.3), KB-A01 (axe page).
- **Evidence:** log. **Risks:** `useMemo` + service singleton an toàn SSR (không `window`) — F6.5 dùng lại.

### F6.3.6 — Route Integration & Guest Access (S)
- **Objective:** đăng ký route lazy công khai.
- **Files (sửa):** `app/router.tsx` (2 chỗ, D-F6.3-08); `app/router.test.tsx` (thêm `describe` cho `/knowledge`, **không** sửa test cũ).
- **Dependencies:** F6.3.5.
- **Steps:** thêm `lazy` + route; chạy toàn bộ `router.test.tsx` + test layout; thêm test guest/authenticated/refresh-resolving.
- **Acceptance:** KB-AC-01/03; route cũ nguyên vẹn.
- **Tests (KB-U-route):** `unauthenticated` → thấy `Điều hướng chính`, `main#main-content`, `h1 Kiến thức chiêm tinh`, **không** ở `/login`; `authenticated` → vẫn ở `/knowledge` (không bị đẩy sang `/app`); Suspense fallback xuất hiện rồi biến mất; hồi quy: `/` render Home, `/app` unauthenticated → `/login`, `/khong-co` → NotFound, `/knowledge/abc` → NotFound (hành vi tạm).
- **Evidence:** log vitest; diff `router.tsx` ≤ ~6 dòng. **Risks:** sửa nhầm thứ tự route/`*`; đụng bundle ⇒ kiểm Phụ lục B.

### F6.3.7 — Axe, E2E, Responsive & Bundle Verification (M)
- **Objective:** bằng chứng tích hợp/trình duyệt thật.
- **Files (mới):** `frontend/e2e/knowledge-base.spec.ts`; (test tích hợp bổ sung nằm trong các file ở trên).
- **Dependencies:** F6.3.6.
- **Steps:** (1) axe ở mức component/page/empty (KB-A01, A06, A07 — mục 10.4); (2) E2E (mục 10.5/10.6); (3) chụp ảnh viewport 320/375/768/1024/1280 × light/dark (Owner/QA lưu vào thư mục evidence do Owner chọn — **chưa có ảnh ⇒ L5-kiểu: UNVERIFIED**, bài học F6.0b); (4) Phụ lục B (bundle); (5) QA bàn phím + trình đọc màn hình theo chính sách F5 (Narrator Windows; phần không kiểm ⇒ Known Gap, không hạ AC).
- **Acceptance:** E2E xanh ở CI; không `waitForTimeout`/`test.skip`/`only`; bundle đạt Phụ lục B.
- **Evidence:** CI link, log `npx playwright test e2e/knowledge-base.spec.ts`, bảng bundle, ảnh/ghi chú QA.
- **Risks:** E2E phụ thuộc số bài (xem 10.5); phụ thuộc backend/refresh (mock như `interpretation-responsive.spec.ts:32`); môi trường Windows của Owner khác CI Linux ⇒ nguồn evidence chính là CI.

### F6.3.8 — Regression, Documentation & Sprint Closure (S)
- **Steps:** toàn bộ gate (mục 10.7); cổng CSS toàn bộ file F6.3; tạo `Sprint_F6_F6.3_Exit_Criteria_Evidence_Matrix.md`; cập nhật Known Gaps Registry (chỉ gap có bằng chứng); đồng bộ F6 plan (mục 15); **không** sửa UI Spec/CHANGELOG/version (F6.7).
- **Acceptance:** mọi dòng KB-AC có trạng thái + bằng chứng; AC thiếu bằng chứng giữ `PENDING/UNVERIFIED`.

---

## 10. Testing Strategy

### 10.1 Nguyên tắc
Co-located (`*.test.ts(x)`); AAA; `it("should … when …")`; query ưu tiên `getByRole`; fixture **đúng kiểu production** (`VALID_FIXTURE_MANIFEST: readonly KnowledgeArticleMetadata[]` + biến thể sinh bằng spread có kiểu cho tiêu đề/summary dài); không mock service nội bộ; không snapshot; không `waitForTimeout`/`test.skip`/`test.only`; test class-string **không** được coi là bằng chứng CSS (bài học F6.2) — luôn kèm cổng CSS (Phụ lục A).

### 10.2 Bảng test
| ID | File dự kiến | Mục tiêu / kịch bản | Fixture | Lệnh | Pass |
|---|---|---|---|---|---|
| KB-U31a | `ui/ArticleCard.test.tsx` | tiêu đề, summary, nhãn, ngày, `href`, 1 link, tên truy cập; click → đổi location; title/summary dài; axe | bài từ `VALID_FIXTURE_MANIFEST` + biến thể dài | `npx vitest run src/features/knowledge-base/ui/ArticleCard.test.tsx` | xanh |
| KB-U31 | `ui/CategoryFilter.test.tsx` | 6 nút, pressed, callback từng danh mục, reset `"all"`, bàn phím, group có tên, axe từng trạng thái | — | tương tự | xanh |
| KB-U32 | `model/categoryFilter.test.ts` | `"all"`, 1 bài, nhiều bài, rỗng, thứ tự, bất biến đầu vào, cast lạ → `[]` | fixture manifest | tương tự | xanh |
| KB-U34 | `model/formatDate.test.ts`, `routes.test.ts` | ngày/`TZ`, giá trị lạ, path | — | tương tự | xanh |
| KB-U13, KB-U14, KB-U35 | `ui/KnowledgeListView.test.tsx` | lưới; empty; lọc/đếm/reset/focus; `articles=[]`; danh mục 1 và 2 bài | fixture | tương tự | xanh |
| KB-U36 | `pages/knowledge/page.test.tsx` | tích hợp trang; regex gate (mục 3 #8, #20) | manifest thật | tương tự | xanh |
| KB-U-route | `app/router.test.tsx` (thêm `describe`) | guest/auth/refresh/hồi quy route | store set tay | `npx vitest run src/app/router.test.tsx` | xanh, test cũ không đổi |
| KB-A01, A04–A07 | trong file tương ứng | axe + tab order + tên truy cập (mục 10.4) | — | `npx vitest run src/features/knowledge-base src/pages/knowledge` | 0 vi phạm critical/serious |
| KB-E01, E03, E04, E05, E11, E12 | `e2e/knowledge-base.spec.ts` | mục 10.5/10.6 | — | `npx playwright test e2e/knowledge-base.spec.ts` | xanh (CI) |
| Hồi quy | toàn bộ | mục 10.7 | — | — | xanh |

### 10.3 Biên/âm bắt buộc (mapping prompt §10)
Empty category ✔ (KB-U14/U35/E04); định danh không hợp lệ/thiếu ✔ (kiểu + KB-U32); bộ sưu tập rỗng ✔ (`articles=[]`); tiêu đề dài ✔; summary dài ✔; danh mục 1 bài ✔ (fixture `fundamentals`/`signs`…); nhiều bài ✔ (`planets`); refresh trực tiếp ✔ (KB-E12). Không có kịch bản nào mâu thuẫn hợp đồng F6.2 (service không bị gọi với tham số lạ).

### 10.4 Kế hoạch axe
- **KB-A01:** trang `/knowledge` (`renderWithProviders`) — 0 vi phạm.
- **KB-A07:** `CategoryFilter` ở trạng thái `Tất cả` và từng danh mục pressed.
- **KB-A06:** empty state (danh mục rỗng) — kỳ vọng 0 vi phạm **chỉ khi** D-F6.3-06 đã xử lý (S1).
- **Giới hạn:** jsdom **không** tính được tương phản màu/layout ⇒ phần này là QA thủ công (mục 11), không tuyên bố "axe đạt contrast".
- Không có `@axe-core/playwright` ⇒ **không** thêm dependency (không cần); axe chỉ ở Vitest.

### 10.5 E2E (`e2e/knowledge-base.spec.ts`) — độc lập số bài
- Mock `**/api/v1/auth/refresh` (như `interpretation-responsive.spec.ts:32`) để guest ổn định, hoặc allowlist 400/401 refresh như `chart.spec.ts:129`.
- **KB-E01:** `goto("/knowledge")` → URL giữ nguyên (không `/login`), `h1 "Kiến thức chiêm tinh"` thấy được, có `nav "Điều hướng chính"` (layout công khai).
- **KB-E03:** có ≥1 `article` với link `href^="/knowledge/"`.
- **KB-E04/E05 (bất biến, lặp qua 5 danh mục):** bấm nút X ⇒ nút X `pressed`; số hiển thị trong `Hiển thị N bài viết` **bằng** số thẻ; mọi thẻ mang nhãn danh mục X; N = 0 ⇒ thấy empty state + nút `Xem tất cả bài viết` ⇒ bấm ⇒ `Tất cả` pressed, N = tổng ban đầu. **Không** gõ cứng số bài (F6.6 sẽ thêm 15 bài).
- **KB-E12:** `page.reload()` ⇒ vẫn render đúng, `Tất cả` pressed.
- Chờ bằng `expect(...).toBeVisible()` / `toHaveCount` (auto-retry), không timeout cứng.

### 10.6 Responsive (KB-E11 + QA thị giác)
Tại 320, 375, 768, 1024, 1280: `getComputedStyle(grid).gridTemplateColumns` có **1 / 1 / 2 / 3 / 3** track (hoạt động cả khi chỉ có 1 bài vì track là khai báo tường minh); `document.documentElement.scrollWidth <= clientWidth` (không tràn ngang); nhóm lọc không cuộn ngang. Ảnh chụp light/dark do Owner/QA cung cấp — **chưa có ảnh ⇒ KB-AC-13 phần thị giác = UNVERIFIED** (không PASS suông).

### 10.7 Hồi quy
`npm run format:check` · `lint` · `typecheck` · `npm test` (so với baseline F6.3.1; **không** giảm số test) · `npm run build` · `CI=1 npx playwright test --list` (60/9 + file mới) · CI. Test F4/F5 (`features/chart`, `interpretation`, `birth-profile`, `profiles`) chạy nguyên trạng. Nếu test không chạy được ở môi trường nào ⇒ ghi blocker + bằng chứng, không tuyên bố đã chạy.

---

## 11. Accessibility Plan
- **Cấu trúc:** đúng **một `h1`** (trong page); `h2` = tiêu đề thẻ và (nếu D-F6.3-06 = A) tiêu đề empty state ⇒ không nhảy cấp; không `h3` rời rạc.
- **Chọn danh mục:** group có nhãn hiển thị + `aria-pressed` (mục D-F6.3-03); không `role="tablist"`.
- **Bàn phím:** Tab/Shift+Tab/Enter/Space; focus ở yên trên nút vừa chọn; sau "Xem tất cả bài viết" focus về `Tất cả`. Test bằng `userEvent` (thứ tự Tab) + QA thủ công.
- **Focus nhìn thấy:** ring của `Button`/`Card interactive`; kiểm bằng mắt hai theme (jsdom không đo được).
- **Liên kết có nghĩa:** tên link = tiêu đề bài (duy nhất trong trang).
- **Vùng status:** `Hiển thị N bài viết` polite; ghi nhận khả năng hai vùng status khi rỗng — kiểm bằng trình đọc màn hình (Narrator trên Windows nếu có; không kiểm được ⇒ Known Gap).
- **Màu/tương phản & chọn trạng thái không chỉ bằng màu:** QA thủ công (jsdom không tính được).
- **Reduced motion:** dùng class `motion-reduce` có sẵn; không thêm chuyển động.
- Không ARIA thừa khi HTML gốc đủ nghĩa.

---

## 12. Risks, Dependencies, and Open Questions

### 12.1 Confirmed blockers
**Không có.** (F6.2 đã xác minh xanh ở HEAD; CI #360 Success.)

### 12.2 Potential risks
| ID | Rủi ro | Tác động | Khả năng | Giảm thiểu | Quyết định/Owner |
|---|---|---|---|---|---|
| R1 | Tích hợp F6.2: service/barrel đổi API | Trung bình | Thấp | chỉ dùng ký hiệu đã liệt kê (2.2); F6.3.1 xác nhận; không sửa file F6.2 | — |
| R2 | Định danh danh mục ↔ nhãn lệch | Trung bình | Thấp | chỉ dùng `KNOWLEDGE_CATEGORIES`/`KNOWLEDGE_CATEGORY_LABELS`; không định nghĩa danh mục mới (test) | — |
| R3 | Xung đột route (`/knowledge/:slug` rơi vào `*`) | Thấp | Chắc chắn (tạm) | không phát hành F6.3 riêng; test chỉ khẳng định `href` | D-F6.3-08 |
| R4 | Tương tác guard | Cao | Thấp | route trong nhóm không guard; test guest + authenticated + hồi quy `/app` | — |
| R5 | Hành vi lazy: chunk lớn bất ngờ/kéo markdown | Trung bình | Thấp | chỉ import từ barrel (đã kiểm [SPIKE S2]); regex gate; Phụ lục B | — |
| R6 | Công cụ a11y: jsdom không đo contrast/layout | Trung bình | Chắc chắn | QA thủ công + ảnh; **không** thêm dependency (không cần) | — |
| R7 | Hồi quy responsive / class không sinh CSS | Cao | TB (đã xảy ra ở F6.2) | cổng CSS Phụ lục A + test KB-E11 + ảnh | — |
| R8 | `heading-order` từ `EmptyState` | Trung bình | Chắc chắn nếu bỏ qua | D-F6.3-06 | Owner |
| R9 | Mất focus sau reset | Trung bình | Chắc chắn nếu bỏ qua | D-F6.3-12 + test | — |
| R10 | E2E giòn khi F6.6 thêm bài | Trung bình | TB | bất biến thay vì số cứng | — |
| R11 | Hạ tầng test: MSW `onUnhandledRequest:"error"` | Thấp | Thấp | trang không gọi mạng; router test đặt `useAuthStore` như test hiện có | — |
| R12 | Thẻ "bấm được" nhưng đích chưa có | Thấp | Chắc chắn (tạm) | như R3 | D-F6.3-08 |
| R13 | Sửa `EmptyState` chung ảnh hưởng nơi khác | Thấp | Thấp | prop tùy chọn, mặc định `h3`; chạy test `EmptyState` + `profiles` | D-F6.3-06 |
| R14 | Môi trường Windows (CRLF/đường dẫn) vs CI Linux | Thấp | TB | evidence chính = CI; Matrix ghi nguồn từng số | — |

### 12.3 Khuyến nghị không chặn (ngoài F6.3)
(1) F6.4: `text-body-md` trong `MarkdownRenderer` (biến không tồn tại — S5/S6); (2) hợp nhất hai class `KnowledgeContentIntegrityError` (M10) trước F6.5; (3) đồng bộ F6 plan §6.4/§6.5 (M9); (4) `document.title` của `/knowledge` vẫn `AstroViet` tới khi có `usePageMeta` (F6.4/F6.5 — ngoài phạm vi prompt, SEO bị loại).

### 12.4 Quyết định Owner (mặc định [REC]; không có cái nào chặn F6.3.1)
| ID | Nội dung | Mặc định | Cần trước |
|---|---|---|---|
| D-F6.3-01 | Trang gọi service, `KnowledgeListView` nhận `articles` (M1) | đồng ý | F6.3.4 |
| D-F6.3-02/03 | Thẻ stretched-link toàn thẻ (dự phòng: chỉ tiêu đề là link); bộ lọc = nút `aria-pressed` | đồng ý | F6.3.2/3 |
| D-F6.3-04 | Thẻ có "Cập nhật {ngày}" + format ngày đưa về F6.3 (M2) | đồng ý | F6.3.2 |
| D-F6.3-05 | `e2e/knowledge-base.spec.ts` bắt đầu ở F6.3 (M3) | đồng ý | F6.3.7 |
| D-F6.3-06 | `EmptyState.headingLevel` (A) / `h2` ẩn (B) / tự viết (C) | **A** | F6.3.4 |
| D-F6.3-08 | Chấp nhận `/knowledge/:slug` → Not Found tạm; không phát hành F6.3 riêng | đồng ý | F6.3.6 |
| D-F6.3-09 | Bộ lọc không lên URL; reload → `Tất cả` | đồng ý | F6.3.4 |
| D-F6.3-11 | Cỡ chữ tường minh (`text-[16px]`/`[14px]`) theo D-F6-X1; ảnh viewport do Owner/QA cung cấp | đồng ý | F6.3.5/7 |
| (nhắc) | Navbar/Footer "Kiến thức" ở F6.5 — Owner có thể kéo sớm thành task nhỏ riêng | giữ F6.5 | — |

---

## 13. File Change Plan
| File | Trạng thái | Mục đích / thay đổi | Task | Thuộc F6.2 (bảo vệ)? |
|---|---|---|---|---|
| `frontend/src/features/knowledge-base/model/formatDate.ts` + `.test.ts` | Mới | `formatKnowledgeDate` | F6.3.2 | không |
| `…/model/routes.ts` + `.test.ts` | Mới | path helper | F6.3.2 | không |
| `…/model/categoryFilter.ts` + `.test.ts` | Mới | `"all"`, kiểu, lọc thuần | F6.3.3 | không |
| `…/ui/ArticleCard.tsx` + test | Mới | thẻ | F6.3.2 | không |
| `…/ui/CategoryFilter.tsx` + test | Mới | bộ lọc | F6.3.3 | không |
| `…/ui/KnowledgeListView.tsx` + test | Mới | điều phối + empty + lưới | F6.3.4 | không |
| `frontend/src/shared/ui/EmptyState/EmptyState.tsx` + `EmptyState.test.tsx` | **Có sẵn — sửa nhỏ nếu duyệt A** | thêm `headingLevel` (mặc định `h3`) | F6.3.4 | không (shared, F4/F5 dùng) |
| `frontend/src/pages/knowledge/page.tsx` + `page.test.tsx` | Mới | trang `/knowledge` | F6.3.5 | không |
| `frontend/src/features/knowledge-base/index.ts` | **Có sẵn (F6.2) — sửa tối thiểu** | thêm xuất `KnowledgeListView` + kiểu/hằng mới | F6.3.5 | **có** — chỉ thêm dòng export |
| `frontend/src/app/router.tsx` | Có sẵn | `lazy` import + 1 route con Marketing | F6.3.6 | không |
| `frontend/src/app/router.test.tsx` | Có sẵn | thêm `describe` `/knowledge` | F6.3.6 | không |
| `frontend/e2e/knowledge-base.spec.ts` | Mới | E2E | F6.3.7 | không |
| `docs/implementation/archive/sprint-f6/Sprint_F6_F6.3_Exit_Criteria_Evidence_Matrix.md` | Mới | evidence | F6.3.8 | không |
| `docs/implementation/archive/sprint-f6/Sprint_F6_Known_Gaps_Registry.md` | Có sẵn | cập nhật khi có gap có bằng chứng | F6.3.8 | không |
| `docs/implementation/Sprint_F6_Implementation_Plan.md` | Có sẵn | đồng bộ quyết định D-F6.3-*, §6.4/6.5 cũ | F6.3.8 | không |
| **Không đổi:** `model/{types,validateManifest,manifest,contentIntegrity,contentFiles,knowledgeContentService,markdownPolicy,seo}.ts`, `ui/MarkdownRenderer*`, test & fixtures F6.2 hiện có, `content/**`, `MarketingLayout`, `src/test/setup.ts`, `tailwind.config.ts`, `tokens.css`, `vite.config.ts`, CI workflow, `backend/**`, `features/chart/**`, `package.json`/lockfile | — | — | — | có |
Mọi đường dẫn trên **đã xác minh** trừ các file **mới** (vị trí đề xuất theo convention `pages/<x>/page.tsx` và `features/<x>/{model,ui}`).

---

## 14. Definition of Done
- [ ] KB-AC-01 — Guest vào `/knowledge` (test route + E2E CI).
- [ ] KB-AC-03 — dùng `MarketingLayout` (test route + E2E).
- [ ] KB-AC-13 — lưới responsive (KB-U13 + KB-E11 + **ảnh viewport**; chưa có ảnh ⇒ UNVERIFIED).
- [ ] KB-AC-14 — đúng 5 danh mục (+ `Tất cả`), từ `KNOWLEDGE_CATEGORIES`.
- [ ] KB-AC-15 — lọc đúng.
- [ ] KB-AC-16 — `Tất cả` reset.
- [ ] KB-AC-17 — empty state đúng copy.
- [ ] KB-AC-18 — không phân trang/tìm kiếm (rà mã + regex gate).
- [ ] `ArticleCard`, `CategoryFilter`, `KnowledgeListView` có test.
- [ ] Đếm = số bài hiển thị.
- [ ] Nút empty reset filter **và** focus về `Tất cả`.
- [ ] `/knowledge` lazy ở cấp route; entry không đổi đáng kể; chunk không chứa markdown libs (Phụ lục B).
- [ ] Guest vào được; `/app/*` vẫn được bảo vệ (test hồi quy).
- [ ] Test component xanh; axe 0 critical/serious (jsdom) + QA thủ công contrast/focus/Narrator ghi lại.
- [ ] E2E liên quan xanh ở CI; không `waitForTimeout`/`skip`/`only`.
- [ ] Hồi quy F4/F5 xanh; `build`, `typecheck`, `lint`, `format:check` xanh.
- [ ] Cổng CSS: 0 class thiếu trong file F6.3.
- [ ] Không có chức năng ngoài phạm vi (mục 16.6); không đổi Backend/F6.2 (ngoài dòng `index.ts`).
- [ ] Evidence Matrix F6.3 + Known Gaps + đồng bộ F6 plan; **không** đổi version/CHANGELOG/UI Spec.

---

## 15. Documentation and Sprint Closure
| Tài liệu | Hiện trạng [VF] | Cập nhật ở F6.3 |
|---|---|---|
| PRD (`docs/product/PRD.md`) | FR-12 có; **không có** KB-AC | không sửa |
| Architecture Spec | §5.1, §12.3 | không (D-F6-K ở F6.7) |
| Frontend UI Spec | §13 hàng `/knowledge` còn `Pagination`/Backlog; §18.3 theo tìm kiếm | **không sửa ở F6.3** — F6.7 (F6 plan §7) |
| Decision Log | = F6 plan §3.1/§14.2 (không có file riêng) | thêm D-F6.3-* đã duyệt; sửa §6.4/§6.5 cũ (code block, ảnh, scheme, title) và ghi `formatKnowledgeDate` đã ở F6.3 |
| Known Gaps Registry | `archive/sprint-f6/Sprint_F6_Known_Gaps_Registry.md` có | thêm gap **chỉ khi có bằng chứng** (vd. ảnh viewport/Narrator chưa kiểm; `/knowledge` chưa có link điều hướng tới F6.5) |
| Evidence Matrix | F6.0/F6.0b/F6.1/F6.2 có | **tạo** `Sprint_F6_F6.3_Exit_Criteria_Evidence_Matrix.md` (SHA, CI run, baseline vs sau, từng AC: file/test/lệnh/kết quả; mục Closure gộp trong Matrix — D-F6-R: báo cáo sprint duy nhất ở F6.7) |
| F6.3 completion report | không có tài liệu riêng theo D-F6-R | gộp vào Matrix |
| `CHANGELOG.md` | `[Unreleased]` | **không** sửa (F6.7) |
| Version | `package.json 0.4.0`, tag `v0.4.0` chưa có trên origin | **không đổi**; bump chỉ khi Owner duyệt ở F6.7 |

---

## 16. Implementation Handoff
1. **Thứ tự:** F6.3.1 → F6.3.2 ∥ F6.3.3 → F6.3.4 → F6.3.5 → F6.3.6 → F6.3.7 → F6.3.8.
2. **Tiền đề trước khi code:** Owner duyệt plan; chốt D-F6.3-01, 02/03, 06 (tối thiểu); `fcf9384` làm điểm vào; `.env` từ `.env.example`.
3. **Quyết định Owner:** mục 12.4.
4. **Rủi ro chấp nhận rõ ràng:** R3/R12 (link tới `/knowledge/:slug` dẫn Not Found tới F6.4; không phát hành F6.3 riêng); R6 (contrast/Narrator chỉ kiểm tay).
5. **Task đầu tiên:** **F6.3.1** (không sửa file) — chạy baseline, xác nhận barrel/số liệu, lặp spike S1, hiệu chuẩn script CSS.
6. **Hoãn sang F6.4+:** trang chi tiết & Not Found bài; `MarkdownRenderer` lazy + typography 65ch (+ sửa `text-body-md`); `usePageMeta`/`document.title`; SEO/canonical/OG/sitemap/robots/prerender/hydration (F6.5); Navbar/Footer "Kiến thức" (KB-AC-06, F6.5); đủ 15 bài, E2E chi tiết/slug lạ, nhãn góc chiếu trong bài (F6.6); sửa UI Spec/CHANGELOG/version (F6.7); đồng bộ filter lên URL (backlog).

### 16.6 Ngoài phạm vi (xác nhận không làm)
Trang `/knowledge/:slug`; render Markdown chi tiết; typography bài đọc; SEO/canonical/OG/sitemap/robots; prerender/SSR; cấu hình deploy; CMS; Backend/DB; tìm kiếm; phân trang; related/recommend; bookmark/lịch sử; bình luận/đánh giá; thư viện state mới; design-system abstraction mới.

---

## Phụ lục A — Cổng "class Tailwind có sinh CSS thật" (Node, không thêm dependency)
```js
// chạy trong frontend/ SAU `npm run build`; truyền danh sách file F6.3 (ví dụ ArticleCard, CategoryFilter, KnowledgeListView, pages/knowledge/page.tsx)
const fs = require("node:fs"), path = require("node:path");
const css = fs.readdirSync("dist/assets").filter(f => f.endsWith(".css")).map(f => fs.readFileSync(path.join("dist/assets", f), "utf8")).join("");
const esc = t => t.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
const files = process.argv.slice(2);
let missing = 0;
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  const toks = new Set([...src.matchAll(/(?:className|class)=(?:"([^"]+)"|\{`([^`]+)`\})/g)].flatMap(m => (m[1] ?? m[2]).split(/\s+/)).filter(Boolean));
  for (const t of toks) {
    if (t.includes("${")) continue;                       // class động: kiểm tay
    const re = new RegExp("\\." + esc(t) + "(?![A-Za-z0-9_-])");
    if (!re.test(css)) { console.log(`MISSING ${path.basename(f)}: ${t}`); missing++; }
  }
}
console.log(missing ? `${missing} class không sinh CSS` : "OK: mọi class sinh CSS");
process.exitCode = missing ? 1 : 0;
```
Giới hạn: không biết class động; cần kiểm tay biến CSS (ví dụ `text-body-md` **có** class nhưng biến `--text-body-md` không tồn tại — kiểm bằng `grep` trong `src/app/styles/tokens.css`). Hiệu chuẩn bằng cách chạy lên `MarkdownRenderer.tsx` trước F6.2-fix: phải báo 11 class thiếu.

## Phụ lục B — Đo bundle (Node, đa nền tảng)
```js
// trong frontend/ sau `npm run build`
const fs = require("node:fs"), path = require("node:path"), zlib = require("node:zlib");
const dir = "dist/assets";
const entry = /src="\/assets\/([^"]+\.js)"/.exec(fs.readFileSync("dist/index.html", "utf8"))[1];
for (const f of fs.readdirSync(dir).filter(n => n.endsWith(".js"))) {
  const b = fs.readFileSync(path.join(dir, f)), s = b.toString("utf8");
  const md = /micromark|mdast-util|hast-util-to-jsx-runtime/.test(s);
  const kb = s.includes("Kiến thức chiêm tinh");
  if (f === entry || md || kb) console.log(f.padEnd(38), String(b.length).padStart(8), String(zlib.gzipSync(b, { level: 9 }).length).padStart(7), f === entry ? "ENTRY" : "", md ? "MARKDOWN-LIBS" : "", kb ? "KB-LISTING" : "");
}
```
Pass: dòng `ENTRY` không có `KB-LISTING`/`MARKDOWN-LIBS`; chunk `KB-LISTING` không có `MARKDOWN-LIBS`; chênh lệch entry so với baseline F6.3.1 ≤ vài trăm byte (ghi số thật).

## Phụ lục C — Tự kiểm
| Mục | Trạng thái |
|---|---|
| Không sửa file/cài dependency/đổi cấu hình trong repo | ✔ (thí nghiệm chỉ trên clone `/home/claude/av` và `/tmp`; repo của Owner không bị đụng) |
| Không tuyên bố test đã chạy khi chưa | ✔ — đã chạy: `lint`, `typecheck`, `format:check`, 120 test KB ở `fcf9384`, suite đầy đủ chỉ ở `e618907`; **chưa chạy**: suite đầy đủ ở HEAD, E2E, build CI chi tiết |
| Không đổi số/ý nghĩa AC | ✔ (KB-AC-01, 03, 13–18 theo RTM F6 plan §8; nguồn gốc ghi rõ M7) |
| Không bịa đường dẫn/kiểu/script | ✔ (file mới ghi "mới/đề xuất"; ký hiệu F6.2 đọc từ barrel) |
| Không thêm dependency | ✔ (không cần `@axe-core/playwright`, không thư viện state/UI) |
| Chênh lệch tài liệu được nêu | ✔ (mục 2.4) |
| F6.3 hoàn thành? | ✘ — đây chỉ là plan chờ Owner duyệt |
