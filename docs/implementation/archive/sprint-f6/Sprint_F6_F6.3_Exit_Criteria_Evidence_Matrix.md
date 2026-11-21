# Sprint F6 — Milestone F6.3 Exit Criteria Evidence Matrix

> **Sprint:** F6 — Knowledge Base (MVP, Frontend-only)  
> **Milestone:** F6.3 — Knowledge Base Listing Page, Category Filtering & Guest Access  
> **Target Version:** `[Unreleased]` (Hiện tại `package.json` là `0.4.0` đã phát hành ở Sprint F5; toàn bộ thay đổi F6 ghi nhận dưới mục `[Unreleased]`, chưa bump version)  
> **Execution Date:** 2026-11-21  
> **Branch:** `dev`  
> **Evidence Commit:** `2f1e168`  
> **Status:** **PASS — KNOWLEDGE BASE LISTING, CATEGORY FILTERING, GUEST ACCESS & RESPONSIVE GRID VERIFIED** (Ảnh viewport light/dark chờ bổ sung lưu trữ chính thức theo KG-F6-14)

---

## 1. Mục tiêu & Phạm vi Milestone F6.3

Milestone F6.3 hiện thực hóa giao diện danh sách bài viết kiến thức chiêm tinh tại route công khai `/knowledge`, bộ lọc 6 nút chuẩn hóa, điều phối trạng thái đếm và empty state, tích hợp router và kiểm thử tự động toàn diện:

1. **Foundations & ArticleCard (`F6.3.2`):** Hàm định dạng ngày độc lập múi giờ (`formatKnowledgeDate`), path helpers (`knowledgeArticlePath`), thẻ bài viết ngữ nghĩa (`ArticleCard`) với stretched-link toàn thẻ, badge danh mục, summary và thời gian cập nhật.
2. **CategoryFilter (`F6.3.3`):** Bộ lọc 6 nút canonical (`Tất cả` + 5 danh mục PRD) sử dụng `Button` với `aria-pressed`, group ngữ nghĩa có nhãn, chuẩn hóa kiểu lọc và kiểm thử accessibility.
3. **KnowledgeListView & EmptyState (`F6.3.4`):** Điều phối bộ lọc, đếm số bài hiển thị đồng bộ qua `p role="status"`, lưới responsive (`Grid as="ul" role="list"`), và empty state tùy biến `headingLevel="h2"` bảo đảm phân cấp heading không bị gián đoạn; nút reset khôi phục và trả focus về nút `Tất cả`.
4. **Listing Page & Barrel Export (`F6.3.5`):** Trang `/knowledge` gọi `knowledgeContentService.listArticles()` qua `useMemo`, hiển thị H1 và mô tả chuẩn hóa, xuất sạch qua feature barrel mà không kéo thư viện Markdown parser.
5. **Route Integration & Guest Access (`F6.3.6`):** Tích hợp lazy route `/knowledge` dưới `MarketingLayout`, kiểm chứng quyền truy cập cho cả khách vãng lai (unauthenticated) lẫn người dùng đã đăng nhập (authenticated).
6. **E2E & Responsive Verification (`F6.3.7`):** Bộ test Playwright `e2e/knowledge-base.spec.ts` kiểm chứng độc lập số lượng bài viết, kiểm tra toàn diện 5 breakpoint (320, 375, 768, 1024, 1280px) không tràn ngang, đo đạc bundle cô lập 100% ngoài entry bundle.
7. **Regression, Documentation & Sprint Closure (`F6.3.8`):** Vượt qua 100% quality gates, kiểm định cổng CSS không thiếu class, thiết lập Evidence Matrix và cập nhật Known Gaps Registry.

### 1.1 Bảng Baseline Đối chiếu Kỹ thuật (F6.3.1 vs Sau F6.3)

| Chỉ số / Hạng mục               |   Trạng thái Baseline (F6.3.1)    |   Trạng thái Sau Hoàn tất F6.3    |     Chênh lệch (Diff)     | Ghi chú kỹ thuật                                          |
| ------------------------------- | :-------------------------------: | :-------------------------------: | :-----------------------: | --------------------------------------------------------- |
| **Git Commit SHA**              |             `fcf9384`             |             `2f1e168`             |        +6 commits         | Các commit F6.3 trên nhánh `dev`                          |
| **Execution Date**              |            2026-11-21             |            2026-11-21             |          0 ngày           | Hoàn thành trong ngày                                     |
| **Unit / Integration Tests**    |      156 files / 1.325 tests      |      163 files / 1.373 tests      | **+7 files / +48 tests**  | 100% test pass, bao phủ toàn bộ F6.3                      |
| **E2E Playwright Suite**        |      60 tests trong 9 files       |      64 tests trong 10 files      |  **+1 file / +4 tests**   | Bổ sung `e2e/knowledge-base.spec.ts`                      |
| **npm audit (Production)**      | 4 vulnerabilities (1 mod, 3 high) | 4 vulnerabilities (1 mod, 3 high) |     **0 lỗ hổng mới**     | Kế thừa từ `axios`, `zod`, `follow-redirects`, `fast-uri` |
| **npm audit (Tổng thể)**        |        22 vulnerabilities         |        22 vulnerabilities         |       0 lỗ hổng mới       | Không thêm dependency ngoài                               |
| **Lockfile Packages**           |          1.132 packages           |          1.132 packages           |      **0 packages**       | 0 package mới thêm vào                                    |
| **Entry Bundle Size**           |     458.89 kB (145.38 kB gz)      |     459.09 kB (145.44 kB gz)      | **+194 B raw / +52 B gz** | Chỉ tăng dòng import lazy trong router                    |
| **Listing Chunk (`page-*.js`)** |              Chưa có              |     8.77 kB raw / 3.76 kB gz      |       **+8.77 kB**        | Không chứa bất kỳ thư viện parser Markdown nào            |

---

## 2. Acceptance Criteria Traceability Matrix (F6.3)

| Mã AC        | Yêu cầu nghiệp vụ / kỹ thuật                                                                                                      | File Triển khai                               | Test ID & Test File                                                                   | Lệnh Kiểm chứng Thực tế                                                                                                     | Kết quả Xác minh                                                                                            |                   Trạng thái                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | :--------------------------------------------: |
| **KB-AC-01** | Người dùng vãng lai (chưa đăng nhập) truy cập được URL `/knowledge`, không bị chuyển hướng về `/login`                            | `frontend/src/app/router.tsx`                 | `KB-U-route-1`, `KB-E01` (`router.test.tsx`, `knowledge-base.spec.ts`)                | `npm test -- src/app/router.test.tsx`<br>`npx playwright test e2e/knowledge-base.spec.ts`                                   | Pass; URL `/knowledge` hiển thị bình thường cho guest, auth status = unauthenticated                        |                    **PASS**                    |
| **KB-AC-03** | Trang `/knowledge` dùng `MarketingLayout` công khai (có Navbar AstroViet, không dùng `AppLayout` có sidebar lá số)                | `frontend/src/app/router.tsx`                 | `KB-U-route-1`, `KB-E01` (`router.test.tsx`, `knowledge-base.spec.ts`)                | `npm test -- src/app/router.test.tsx`<br>`npx playwright test e2e/knowledge-base.spec.ts`                                   | Pass; chứa `nav[aria-label="Điều hướng chính"]` và `main#main-content`, không chứa sidebar `AppLayout`      |                    **PASS**                    |
| **KB-AC-13** | Trang danh sách hiển thị lưới bài viết responsive (mobile 1 cột, tablet 2 cột, desktop 3 cột)                                     | `KnowledgeListView.tsx`, `page.tsx`           | `KB-U13`, `KB-E11` (`KnowledgeListView.test.tsx`, `knowledge-base.spec.ts`)           | `npm test -- src/features/knowledge-base/ui/KnowledgeListView.test.tsx`<br>`npx playwright test e2e/knowledge-base.spec.ts` | Pass; `gridTemplateColumns` đo được 1 cột (320/375px), 2 cột (768px), 3 cột (1024/1280px), 0 overflow ngang | **PASS** (trực quan: UNVERIFIED theo KG-F6-14) |
| **KB-AC-14** | Bộ lọc danh mục hiển thị đầy đủ 5 danh mục chính thức từ PRD (`fundamentals`, `planets`, `signs`, `houses`, `aspects`) + `Tất cả` | `CategoryFilter.tsx`, `types.ts`              | `KB-U31`, `KB-E01` (`CategoryFilter.test.tsx`, `knowledge-base.spec.ts`)              | `npm test -- src/features/knowledge-base/ui/CategoryFilter.test.tsx`                                                        | Pass; đúng thứ tự canonical, đúng nhãn `KNOWLEDGE_CATEGORY_LABELS`                                          |                    **PASS**                    |
| **KB-AC-15** | Bấm vào nút danh mục thì chỉ hiển thị bài viết thuộc danh mục đó; số lượng đếm cập nhật tương ứng                                 | `KnowledgeListView.tsx`, `categoryFilter.ts`  | `KB-U32`, `KB-U35`, `KB-E04` (`KnowledgeListView.test.tsx`, `knowledge-base.spec.ts`) | `npm test -- src/features/knowledge-base/ui/KnowledgeListView.test.tsx`<br>`npx playwright test e2e/knowledge-base.spec.ts` | Pass; trạng thái `aria-pressed` cập nhật, số bài trong đếm khớp số thẻ trong DOM                            |                    **PASS**                    |
| **KB-AC-16** | Nút `Tất cả` khôi phục hiển thị toàn bộ bài viết từ manifest                                                                      | `CategoryFilter.tsx`, `KnowledgeListView.tsx` | `KB-U31`, `KB-U35`, `KB-E04`, `KB-E05`                                                | `npm test -- src/features/knowledge-base/ui/KnowledgeListView.test.tsx`                                                     | Pass; bấm `Tất cả` trả về danh sách gốc đầy đủ; reset từ empty state trả focus về `Tất cả`                  |                    **PASS**                    |
| **KB-AC-17** | Khi chọn danh mục chưa có bài viết, hiển thị empty state thân thiện kèm nút reset                                                 | `KnowledgeListView.tsx`, `EmptyState.tsx`     | `KB-U14`, `KB-U35`, `KB-E05` (`KnowledgeListView.test.tsx`, `knowledge-base.spec.ts`) | `npm test -- src/features/knowledge-base/ui/KnowledgeListView.test.tsx`<br>`npx playwright test e2e/knowledge-base.spec.ts` | Pass; hiển thị copy "Chưa có bài viết trong chủ đề này" và nút "Xem tất cả bài viết"                        |                    **PASS**                    |
| **KB-AC-18** | Không có phân trang và không có ô tìm kiếm trong phạm vi MVP (theo PRD FR-12)                                                     | `KnowledgeListView.tsx`, `page.tsx`           | `KB-U36` (`page.test.tsx`, `boundaries.test.ts`)                                      | `npm test -- src/pages/knowledge/page.test.tsx`                                                                             | Pass; regex gate xác nhận 0 `Pagination`, 0 `type="search"`, 0 `useSearchParams`                            |                    **PASS**                    |

---

## 3. Bằng chứng Đo Bundle & Cô lập Lazy Loading (Phụ lục B)

### 3.1 Phương pháp Đo Đạc

Kiểm tra trực tiếp trên bản dựng production (`dist/assets/*.js`) bằng script Node độc lập cross-platform:

- Kiểm tra entry bundle chính (`index-Zrdqek0Y.js`).
- Kiểm tra chunk lazy tải trang danh sách (`page-CZirp4xm.js`).
- Kiểm tra sự hiện diện của chuỗi từ khóa phân tích Markdown: `micromark|mdast-util|hast-util-to-jsx-runtime`.

### 3.2 Kết quả Thực tế

```text
Analyzing assets in frontend/dist/assets
Entry bundle: index-Zrdqek0Y.js
index-Zrdqek0Y.js                        459085  145435 ENTRY
page-CZirp4xm.js                           8773    3756 KB-LISTING

PASS: Appendix B bundle criteria satisfied cleanly!
```

### 3.3 Đánh giá Ranh giới Cô lập

1. **Entry Bundle (`index-Zrdqek0Y.js`):** 459.09 kB raw / 145.44 kB gzip. Chênh lệch so với baseline F6.3.1 (458.89 kB) chỉ là **+194 byte**, hoàn toàn tương ứng với 2 dòng khai báo `React.lazy` và route object. **0 byte mã thư viện Markdown**.
2. **Knowledge Listing Chunk (`page-CZirp4xm.js`):** 8.77 kB raw / 3.76 kB gzip. Chunk chỉ chứa mã UI danh sách, hàm lọc thuần, SVG icon Lucide và danh sách bài viết từ manifest. **Hoàn toàn KHÔNG chứa `micromark`, `mdast-util`, `hast-util` hay `react-markdown`**.
3. **Kết luận:** Tiêu chí cô lập lazy loading đạt 100%. Người dùng truy cập trang danh sách `/knowledge` không phải tải bất kỳ byte nào của parser Markdown.

---

## 4. Bằng chứng Cổng CSS Tailwind & Accessibility (Phụ lục A & Axe)

### 4.1 Cổng Kiểm tra Class Tailwind Sinh CSS Thật (Phụ lục A)

Đã chạy kiểm tra toàn bộ 4 file giao diện mới của F6.3:

- `frontend/src/features/knowledge-base/ui/ArticleCard.tsx`
- `frontend/src/features/knowledge-base/ui/CategoryFilter.tsx`
- `frontend/src/features/knowledge-base/ui/KnowledgeListView.tsx`
- `frontend/src/pages/knowledge/page.tsx`

**Kết quả kiểm tra:**

- Tổng số class kiểm tra: 42 tokens (bao gồm cả các class có ký tự đặc biệt như `after:absolute`, `after:inset-0`, `focus:outline-none`, `text-[14px]`, `text-[16px]`, `md:text-display-lg`).
- Số class thiếu: **0 class thiếu**.
- **Kết luận:** Mọi class Tailwind sử dụng trong F6.3 đều sinh CSS hợp lệ trong tệp `dist/assets/index-*.css`.

### 4.2 Accessibility Checks (Axe Core & Phân cấp Tiêu đề)

1. **`page.test.tsx` (`KB-A01`):** Kiểm tra `axe(container)` trên toàn bộ trang `/knowledge` đầy đủ: **0 vi phạm accessibility** (critical, serious, moderate, minor).
2. **`CategoryFilter.test.tsx` (`KB-A07`):** Kiểm tra `axe(container)` trên tất cả 6 trạng thái nút được chọn (`Tất cả`, `fundamentals`, `planets`, `signs`, `houses`, `aspects`): **0 vi phạm accessibility**.
3. **`ArticleCard.test.tsx` (`KB-A04`):** Thẻ bài viết độc lập đạt **0 vi phạm accessibility**. Tên accessible của link trùng khớp tiêu đề bài viết.
4. **`KnowledgeListView.test.tsx` (`KB-A01`, `KB-A06`):**
   - Trạng thái có bài viết: **0 vi phạm accessibility**.
   - Trạng thái empty state: **0 vi phạm accessibility**. Việc áp dụng `headingLevel="h2"` cho `EmptyState` loại bỏ hoàn toàn lỗi `heading-order` (D-F6.3-06).
5. **Cấu trúc Tiêu đề (Heading Hierarchy):**
   - Đúng **một `h1`** duy nhất trên trang (`Kiến thức chiêm tinh`).
   - Mọi tiêu đề thẻ bài viết là `h2`.
   - Tiêu đề empty state là `h2`.
   - Không có heading bị nhảy cấp hoặc rời rạc.

---

## 5. Bảng tổng hợp Quality Gates (F6.3.8)

| Cổng kiểm định               | Lệnh thực hiện                                                | Kết quả thực tế                                                                   | Trạng thái |
| ---------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- | :--------: |
| **Format Check**             | `cd frontend; npx prettier --end-of-line auto --check .`      | `All matched files use Prettier code style!`                                      |  **PASS**  |
| **Lint Check**               | `npm run lint`                                                | `eslint .` chạy thành công, 0 errors, 0 warnings                                  |  **PASS**  |
| **Typecheck**                | `npm run typecheck`                                           | `tsc.app` và `tsc.node` 0 errors                                                  |  **PASS**  |
| **Knowledge Base Tests**     | `npm test -- src/features/knowledge-base src/pages/knowledge` | 18 test files, **162/162 tests passed** (100%)                                    |  **PASS**  |
| **Router Tests**             | `npm test -- src/app/router.test.tsx`                         | 17/17 tests passed (bao gồm 4 test mới cho `/knowledge`)                          |  **PASS**  |
| **Toàn bộ Test Suite Dự án** | `npx vitest run --maxWorkers=4 --passWithNoTests`             | 163 test files, **1.373/1.373 tests passed** (100%)                               |  **PASS**  |
| **Playwright E2E Tests**     | `npx playwright test e2e/knowledge-base.spec.ts`              | Đúng **4/4 tests passed** (12.4s)                                                 |  **PASS**  |
| **E2E Suite Count**          | `CI=1 npx playwright test --list`                             | Đúng **64 tests trong 10 files** (+4 tests, +1 file)                              |  **PASS**  |
| **Production Build**         | `npm run build`                                               | Biến đổi thành công 2.171 modules, xuất tệp `dist/` sạch                          |  **PASS**  |
| **Security Audit (Prod)**    | `npm audit --omit=dev`                                        | **4 vulnerabilities** (1 moderate, 3 high) kế thừa từ baseline, **0 lỗ hổng mới** |  **PASS**  |
| **Tailwind CSS Port Gate**   | `node scratch/check_css.js`                                   | 0 class thiếu trong toàn bộ file F6.3                                             |  **PASS**  |
| **Bundle Isolation Gate**    | `node scratch/check_bundle.js`                                | Entry bundle sạch, listing chunk 0 markdown libs                                  |  **PASS**  |
| **Scope Boundary Check**     | `git diff --stat`                                             | 0 thay đổi ngoài phạm vi; không chạm `backend/**`, `vite.config.ts`, CI workflows |  **PASS**  |

---

## 6. Closure Notes & Trạng thái Quyết định Kỹ thuật (D-F6.3-01...12)

| Quyết định      | Nội dung thống nhất                                                                          | Hiện trạng Triển khai                                                             |
| --------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **`D-F6.3-01`** | Trang gọi `knowledgeContentService.listArticles()`, truyền kết quả vào `KnowledgeListView`   | Đã thực hiện tại `pages/knowledge/page.tsx` qua `useMemo`                         |
| **`D-F6.3-02`** | `ArticleCard` sử dụng mẫu stretched link toàn thẻ (`after:absolute after:inset-0`)           | Đã thực hiện tại `ArticleCard.tsx`, link duy nhất nằm ở tiêu đề `h2`              |
| **`D-F6.3-03`** | `CategoryFilter` là group nút bấm có `aria-pressed`, không dùng tablist                      | Đã thực hiện tại `CategoryFilter.tsx`, 6 `Button` toggles                         |
| **`D-F6.3-04`** | `ArticleCard` hiển thị thời gian cập nhật dạng `Cập nhật {dd/MM/yyyy}`                       | Đã thực hiện tại `formatDate.ts` (thuần chuỗi, độc lập múi giờ)                   |
| **`D-F6.3-05`** | Bắt đầu viết file Playwright E2E cho Knowledge Base ngay từ Milestone F6.3                   | Đã tạo `frontend/e2e/knowledge-base.spec.ts` (4 kịch bản, 4 pass)                 |
| **`D-F6.3-06`** | Thêm prop tùy chọn `headingLevel?: "h2" \| "h3"` vào component dùng chung `EmptyState`       | Đã cập nhật `EmptyState.tsx` (mặc định giữ `h3` cho F4/F5, F6 truyền `h2`)        |
| **`D-F6.3-08`** | Đăng ký route `/knowledge` công khai; chấp nhận `/knowledge/:slug` tạm thời rơi vào NotFound | Đã tích hợp trong `router.tsx` dưới `MarketingLayout`; test KB-U-route-4 xác nhận |
| **`D-F6.3-09`** | Bộ lọc chỉ lưu trong component state, không đẩy lên URL search params                        | Đã thực hiện; test reload KB-E12 xác nhận khôi phục về "Tất cả"                   |
| **`D-F6.3-10`** | Xuất các thành phần listing qua feature barrel `index.ts` mà không export MarkdownRenderer   | Đã cập nhật `features/knowledge-base/index.ts`, boundaries test xác nhận sạch     |
| **`D-F6.3-11`** | Sử dụng cỡ chữ tường minh `text-[16px]` và `text-[14px]` cho mô tả và summary                | Đã áp dụng, xác nhận sinh CSS hợp lệ qua cổng Phụ lục A                           |
| **`D-F6.3-12`** | Nút reset trên empty state trả focus về nút "Tất cả"                                         | Đã triển khai thông qua `allButtonRef` truyền vào `CategoryFilter`                |

---

## 7. Handoff sang Milestone F6.4 (Knowledge Base Article Detail Page)

Các yêu cầu chuyển giao kỹ thuật bắt buộc cho Milestone F6.4:

1. **HR-1:** Đăng ký route chi tiết `/knowledge/:slug` trong `router.tsx` dưới `MarketingLayout`. Route component phải được bọc trong `React.lazy()` để cô lập `MarkdownRenderer` và các thư viện `react-markdown`, `micromark`.
2. **HR-2:** `MarkdownRenderer` chỉ được import tại trang chi tiết bài viết (`pages/knowledge/detail/page.tsx`), tuyệt đối không đưa vào barrel `index.ts` hay trang danh sách.
3. **HR-3:** Trang chi tiết gọi `knowledgeContentService.getArticle(slug)`, xử lý đầy đủ 3 trạng thái: `found` (render bài), `not-found` (render component NotFoundPage thân thiện của Knowledge Base), và `content-error` (render error state).
4. **HR-4:** Khung hiển thị bài đọc tuân thủ quy chuẩn typography tối đa 65ch (`max-w-prose`), xử lý các class token hợp lệ cho heading, blockquote, code block và link ngoài.
