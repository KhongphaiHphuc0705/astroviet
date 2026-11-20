# Sprint F6 — Milestone F6.2 Exit Criteria Evidence Matrix

> **Sprint:** F6 — Knowledge Base (MVP, Frontend-only)  
> **Milestone:** F6.2 — Content Domain Model, Content Integrity, Markdown Security Policy & SEO Foundation  
> **Target Version:** `[Unreleased]` (Hiện tại `package.json` là `0.4.0` đã phát hành ở Sprint F5 ngày 2026-11-09; toàn bộ thay đổi F6 ghi nhận dưới mục `[Unreleased]`, chưa bump version; Git tag `v0.4.0` chưa có trên origin — hiện chỉ có `v0.3.0`)  
> **Execution Date:** 2026-11-20  
> **Branch:** `dev` (Sau khi hoàn tất toàn bộ defect fixes và chất lượng kiểm định)  
> **Evidence Commit:** `f09ee7b` 
> **Evidence CI Link:** [Frontend CI #360](https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/44670609680)
> **Status:** **PASS — CONTENT DOMAIN MODEL, INTEGRITY PARITY, MARKDOWN SECURITY & SEO FOUNDATION VERIFIED**  

---

## 1. Mục tiêu & Phạm vi Milestone F6.2

Milestone F6.2 thiết lập toàn bộ nền tảng dữ liệu, dịch vụ nội dung, bảo mật hiển thị Markdown và siêu dữ liệu SEO cho tính năng Knowledge Base theo đúng hợp đồng kiến trúc Sprint F6:
1. **Content Domain Model & Manifest (`F6.2.1`):** Khóa kiểu dữ liệu, danh mục chuẩn, validation runtime độc lập với Vite, manifest tĩnh và bài viết mẫu.
2. **File Mapping, Integrity & Content Service (`F6.2.2`):** Kiểm tra đối sánh hai chiều (parity) giữa manifest và file `.md`, cô lập `import.meta.glob` duy nhất trong `contentFiles.ts`, cung cấp `knowledgeContentService` bất đồng bộ xử lý rõ ràng 3 trạng thái (`found`, `not-found`, `content-error`).
3. **Markdown Renderer & Security Policy (`F6.2.3`):** Cài đặt `react-markdown@10.1.0` với `--save-exact`, 0 plugin ngoài, bật `skipHtml`, cấm tuyệt đối `dangerouslySetInnerHTML`. Cơ chế bảo vệ đa lớp kiểm soát URL hostile, chuẩn hoá heading bảo vệ cấu trúc tài liệu, lazy image. Content linter (L1–L6) kiểm soát chất lượng nội dung trước khi xuất bản.
4. **SEO Metadata Foundation (`F6.2.4`):** Bộ helper thuần SSR-safe (`seo.ts`) chạy độc lập trong môi trường Node, chuẩn hoá URL site, ngăn chặn sinh `og:image` giả.
5. **Integration, Bundle & Quality Verification (`F6.2.5`):** Tách biệt barrel `index.ts` (chỉ export model/service/types, không kéo Markdown renderer), kiểm định khóa ranh giới kiến trúc bằng regex gates (`boundaries.test.ts`), chứng minh bằng số đo thực tế thư viện Markdown không nằm trong bundle entry ban đầu và không rò rỉ vào service consumers, vượt qua toàn bộ quality gates (format, lint, typecheck, test, build, audit).

### 1.1 Bảng Baseline Đối chiếu Kỹ thuật (F6.2.0)

| Chỉ số / Hạng mục | Trạng thái Baseline (F6.2.0) | Trạng thái Sau Hoàn tất F6.2 | Chênh lệch (Diff) | Ghi chú kỹ thuật |
|---|:---:|:---:|:---:|---|
| **Git Commit SHA** | `d9453ca` | Hiện tại trên `dev` | + các commit F6.2 | Baseline tạo tại mốc hoàn tất F6.1 |
| **Execution Date** | 2026-11-18 | 2026-11-20 | +2 ngày | |
| **Unit / Integration Tests** | 145 files / 1.205 tests | 156 files / 1.325 tests | **+11 files / +120 tests** | 100% test pass, bao phủ toàn bộ F6.2 |
| **E2E Playwright Suite** | 60 tests trong 9 files | 60 tests trong 9 files | 0 tests | Tuyệt đối không ảnh hưởng E2E hiện có |
| **npm audit (Production)** | 4 vulnerabilities (1 mod, 3 high) | 4 vulnerabilities (1 mod, 3 high) | **0 lỗ hổng mới** | Kế thừa từ `axios`, `zod`, `follow-redirects`, `fast-uri` |
| **npm audit (Tổng thể)** | 34 vulnerabilities | 22 vulnerabilities | -12 vulnerabilities | Cập nhật cây phụ thuộc gián tiếp từ npm overrides |
| **Lockfile Packages** | 1.055 packages | 1.132 packages | **+77 packages** | Đúng cây phụ thuộc của `react-markdown@10.1.0` |
| **Entry Bundle Size** | 458.849 B raw / 145.383 B gz | 458.849 B raw / 145.383 B gz | **0 B** | Hoàn toàn không tăng entry bundle chính |

### 1.2 Kết quả Khảo sát 7 điểm Glob Spike (T0.1, T0.2)

1. **Cú pháp Glob Vite (`T0.1`):** `import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default' })` hoạt động chính xác trong Vite, sinh map các hàm lazy loader dạng `() => Promise<string>`.
2. **Cấu trúc Key Glob:** Vite tạo key tương đối dạng `../content/<category>/<slug>.md`.
3. **Chuẩn hoá Key Regex (`normalizeGlobKey`):** Bóc tách tiền tố `../` hoặc `./`, đối chiếu với biểu thức chính quy tái sử dụng `KNOWLEDGE_CATEGORIES` và `SLUG_PATTERN.source` để loại trừ mọi đường dẫn sai cấu trúc.
4. **Bảo toàn Raw Keys cho Parity Audit:** `contentRegistry.listRawKeys()` trả về toàn bộ danh sách key thô chưa lọc (sắp xếp ASCII) để `checkContentParity` phát hiện các file lạ, file sai thư mục, file mồ côi (`malformedKeys`, `orphanFiles`).
5. **Chuẩn hoá Đường dẫn Cross-platform:** Thay thế toàn bộ dấu gạch chéo ngược `\` thành `/` để chạy đồng nhất trên cả Windows và Linux.
6. **Thứ tự Tất định ASCII:** Toàn bộ hàm sắp xếp và đối sánh sử dụng bộ so sánh mã ký tự ASCII thuần túy (`a < b ? -1 : a > b ? 1 : 0`), độc lập với cài đặt hệ điều hành và `localeCompare`.
7. **Toàn vẹn Manifest Parity trên Dữ liệu Thật:** Chạy đối sánh giữa `KNOWLEDGE_MANIFEST` và `contentRegistry.listRawKeys()` đạt 0 missing, 0 orphan, 0 malformed files.

### 1.3 Quản lý Phụ thuộc & Điều chỉnh Môi trường Test

- **react-markdown:** Cài đặt chính xác phiên bản `10.1.0` với cờ `--save-exact`.
- **Lockfile diff:** `package-lock.json` ghi nhận bổ sung đúng 77 packages phụ thuộc cho cây phân tích Markdown (`micromark`, `mdast-util-*`, `unist-util-*`, `vfile`, `property-information`).
- **`src/test/setup.ts` SSR Safety Guard:** Bổ sung điều kiện kiểm tra tồn tại môi trường trình duyệt:
  ```ts
  if (typeof document !== "undefined") {
    const modalRoot = document.createElement("div");
    modalRoot.setAttribute("id", "modal-root");
    document.body.appendChild(modalRoot);
  }

  if (typeof window !== "undefined") {
    Object.defineProperty(window, "matchMedia", { ... });
  }
  ```
  *Lý do:* Cho phép các bài test SSR (như `MarkdownRenderer.ssr.test.tsx` và `seo.test.ts`) chạy an toàn trong môi trường Node.js thuần (`// @vitest-environment node`) mà không bị crash do truy cập các biến toàn cục không tồn tại.

---

## 2. Acceptance Criteria Traceability Matrix (F6.2)

| Mã AC | Yêu cầu nghiệp vụ / kỹ thuật | File Triển khai | Test ID & Test File | Lệnh Kiểm chứng Thực tế | Kết quả Xác minh | Trạng thái |
|---|---|---|---|---|---|:---:|
| **KB-AC-07** | Metadata đầy đủ field, kiểm tra runtime bằng hàm thuần, mã lỗi phân biệt | `types.ts`, `validateManifest.ts`, `manifest.ts` | `KB-U01` (`validateManifest.test.ts`) | `npx vitest run src/features/knowledge-base/model/validateManifest.test.ts` | 13/13 tests pass; bắt đúng mọi vi phạm (`code`, `index`, ngày không hợp lệ, tiêu đề rỗng, summary > 160 ký tự) | **PASS** |
| **KB-AC-08** | Mỗi entry trong manifest tương ứng đúng 1 file `.md` vật lý | `contentIntegrity.ts`, `contentFiles.ts` | `KB-U04`, `KB-U27` (`contentIntegrity.test.ts`, `contentFiles.test.ts`) | `npx vitest run src/features/knowledge-base/model/contentIntegrity.test.ts` | 9/9 tests pass; bắt chính xác fixture thiếu file trong `missingFiles` | **PASS** |
| **KB-AC-09** | Mỗi file `.md` trong repo tương ứng manifest (không orphan/malformed keys) | `contentIntegrity.ts`, `contentFiles.ts` | `KB-U05`, `KB-U27` (`contentIntegrity.test.ts`, `contentFiles.test.ts`) | `npx vitest run src/features/knowledge-base/model/contentFiles.test.ts` | 8/8 tests pass; phát hiện file mồ côi, file lạ (`README.md`, `Planets/Sun.md`, `Bad_Name.md`) trong `malformedKeys` | **PASS** |
| **KB-AC-10** | Slug duy nhất, đúng 5 danh mục, thứ tự tất định không phụ thuộc thứ tự nạp glob | `types.ts`, `validateManifest.ts` | `KB-U02`, `KB-U03`, `KB-U06` (`validateManifest.test.ts`, `types.test.ts`) | `npx vitest run src/features/knowledge-base/model/validateManifest.test.ts` | 13/13 tests pass; đảo thứ tự mảng đầu vào luôn trả về kết quả sắp xếp xác định | **PASS** |
| **KB-AC-11** | Service resolve bài theo slug; phân biệt rõ `found`, `not-found`, `content-error` | `knowledgeContentService.ts` | `KB-U07`, `KB-U08`, `KB-U09a/b` (`knowledgeContentService.test.ts`) | `npx vitest run src/features/knowledge-base/model/knowledgeContentService.test.ts` | 11/11 tests pass; slug lạ trả về `not-found` mà không kích hoạt nạp file; file thiếu trả về `content-error/missing-file` | **PASS** |
| **KB-AC-12** | HTML thô và script không được thực thi hay xuất hiện trong DOM; không rò rỉ thuộc tính lạ | `MarkdownRenderer.tsx` | `KB-U10`, `KB-U12b` (`MarkdownRenderer.test.tsx`, `boundaries.test.ts`) | `npx vitest run src/features/knowledge-base/ui/MarkdownRenderer.test.tsx` | 21/21 tests pass; DOM không chứa `<script>`, `<iframe>`, `on*` attributes, và $0$ thuộc tính `node="[object Object]"` | **PASS** |
| **KB-AC-14** | Hỗ trợ đúng 5 danh mục theo thứ tự PRD (`fundamentals` đứng đầu) | `types.ts` | `KB-U03` (`types.test.ts`) | `npx vitest run src/features/knowledge-base/model/types.test.ts` | 5/5 tests pass; đúng 5 danh mục và nhãn tiếng Việt tương ứng | **PASS** |
| **KB-AC-20** | Thân bài bắt đầu từ H2; H1 Markdown được chuẩn hoá tất định sang H2; token CSS hợp lệ | `markdownPolicy.ts`, `MarkdownRenderer.tsx`, `contentLint.test.ts` | `KB-U16`, `KB-U29` (`MarkdownRenderer.test.tsx`, `contentLint.test.ts`) | `npx vitest run src/features/knowledge-base/ui/MarkdownRenderer.test.tsx` | 21/21 tests pass; H1 render thành `<h2>` kèm `data-heading-normalized-from="1"`; sử dụng class token thật (`text-heading-lg`, v.v.) | **PASS** |
| **KB-AC-22** | Link nội bộ điều hướng bằng React Router `<Link>`, không reload trang | `markdownPolicy.ts`, `MarkdownRenderer.tsx` | `KB-U11` (`MarkdownRenderer.test.tsx`) | `npx vitest run src/features/knowledge-base/ui/MarkdownRenderer.test.tsx` | 21/21 tests pass; click link nội bộ chuyển đổi `pathname` trực tiếp trong router không reload trang | **PASS** |
| **KB-AC-23** | Link ngoài an toàn (chỉ cho phép `https:`), bắt buộc `target="_blank"` và `rel="noopener noreferrer"` | `markdownPolicy.ts`, `MarkdownRenderer.tsx` | `KB-U11` (`markdownPolicy.test.ts`, `MarkdownRenderer.test.tsx`) | `npx vitest run src/features/knowledge-base/model/markdownPolicy.test.ts` | 21/21 tests pass; từ chối `http:`, `mailto:`, `javascript:`, `data:`, credentialed URLs | **PASS** |
| **KB-AC-25** | Ảnh bắt buộc có alt mô tả, `loading="lazy"`, `decoding="async"`, chỉ cho phép ảnh cục bộ | `markdownPolicy.ts`, `MarkdownRenderer.tsx` | `KB-U12`, `KB-U17` (`markdownPolicy.test.ts`, `MarkdownRenderer.test.tsx`) | `npx vitest run src/features/knowledge-base/ui/MarkdownRenderer.test.tsx` | 21/21 tests pass; ảnh remote/CDN/thiếu alt bị ẩn và đánh dấu `data-kb-fallback` | **PASS** |
| **KB-AC-33** | Kiểm tra parity hai chiều chạy tự động trong test suite | `contentIntegrity.ts`, `contentFiles.ts` | `KB-U04`, `KB-U05`, `KB-U27` (`contentIntegrity.test.ts`, `contentFiles.test.ts`) | `npx vitest run src/features/knowledge-base/model/contentFiles.test.ts` | 8/8 tests pass; kiểm tra khớp 100% trên cả dữ liệu thật lẫn fixture giả lập với `listRawKeys()` | **PASS** |
| **KB-AC-34** | Test an toàn XSS và URL độc hại bao phủ 6 nhóm rủi ro bảo mật | `MarkdownRenderer.tsx`, `markdownPolicy.ts` | `KB-U10`, `KB-U11`, `KB-U12` (`MarkdownRenderer.test.tsx`, `markdownPolicy.test.ts`) | `npx vitest run src/features/knowledge-base/ui/MarkdownRenderer.test.tsx` | 21/21 tests pass; chặn `<script>`, `<img onerror>`, `javascript:`, `vbscript:`, `data:`, `//protocol-relative` | **PASS** |
| **KB-AC-35** | Test kiểm tra phân cấp heading trong Markdown (H2 bắt đầu, không nhảy cấp) | `MarkdownRenderer.tsx`, `contentLint.test.ts` | `KB-U16`, `KB-U29` (`contentLint.test.ts`) | `npx vitest run src/features/knowledge-base/model/contentLint.test.ts` | 11/11 tests pass; helper tách biệt tại `src/test/helpers/knowledge-base-lint.ts`; bài mẫu đạt 0 vi phạm | **PASS** |
| **KB-AC-26** | Nền tảng SEO Title chuẩn hoá có hậu tố `— AstroViet` | `seo.ts` | `KB-U18`, `KB-U28` (`seo.test.ts`) | `npx vitest run src/features/knowledge-base/model/seo.test.ts` | 11/11 tests pass trong môi trường Node | **PASS (nền)** |
| **KB-AC-27** | Nền tảng SEO Meta Description từ summary bài viết | `seo.ts` | `KB-U18`, `KB-U28` (`seo.test.ts`) | `npx vitest run src/features/knowledge-base/model/seo.test.ts` | 11/11 tests pass trong môi trường Node | **PASS (nền)** |
| **KB-AC-28** | Nền tảng SEO Canonical URL chuẩn hoá host, không có `/` cuối | `seo.ts` | `KB-U19`, `KB-U28` (`seo.test.ts`) | `npx vitest run src/features/knowledge-base/model/seo.test.ts` | 11/11 tests pass; `normalizeSiteUrl` loại bỏ trailing slash, kiểm tra scheme http(s) | **PASS (nền)** |

---

## 3. Bằng chứng Đo Bundle & Cô lập Lazy Loading (Task T5.2)

### Phương pháp Thực nghiệm & Kết quả Đo Đạc

Để giải quyết triệt để rủi ro rò rỉ mã phân tích Markdown vào các trang chỉ sử dụng dữ liệu tĩnh (như trang Listing F6.3), ranh giới export của module Knowledge Base đã được cấu trúc chặt chẽ:
- **`index.ts` (Feature Barrel):** Chỉ export các hàm nghiệp vụ, manifest, content service, validation, integrity và helper SEO. Tuyệt đối **không export `MarkdownRenderer`**.
- **`ui/MarkdownRenderer.tsx`:** Tách biệt độc lập, chỉ được import trực tiếp tại route component chi tiết bài viết (F6.4).

### Bảng đối chiếu Kích thước Chunk (Raw & Gzip)

| Hạng mục Đo kiểm | Kích thước Raw | Kích thước Gzip | Thành phần Mã bên trong | Đánh giá Ranh giới Cô lập |
|---|:---:|:---:|---|---|
| **Entry Bundle chính** (`dist/assets/index-*.js`) | **459.00 kB** | **145.65 kB** | React, React Router, Query, Auth, UI Core | **Hoàn toàn KHÔNG chứa** `react-markdown` hay các thư viện parser (`micromark`, `mdast`, `hast`). |
| **Knowledge Base Service Chunk** (khi import barrel `index.ts`) | **1.09 kB** (1.094 B) | **0.54 kB** (540 B) | Service, Manifest, Manifest Validator, Parity, SEO | `contains micromark: false`<br>`contains react-markdown: false`. Cực nhẹ, tải tức thì. |
| **Markdown Renderer Chunk** (khi import `ui/MarkdownRenderer`) | **~133.35 kB** | **~41.53 kB** | `react-markdown`, `micromark`, `mdast`, `hast-util` | Cô lập 100% trong chunk bài viết chi tiết; không bị tải trước ở trang danh sách. |
| **Article Content Chunk** (`what-is-astrology-*.js`) | **1.19 kB** | **0.65 kB** | Chuỗi Markdown của bài viết mẫu | Tách độc lập, nạp theo nhu cầu từng bài. |

**Kết luận T5.2:** Thư viện Markdown và toàn bộ cây phân tích cú pháp AST được cô lập an toàn ngoài entry bundle chính và ngoài service barrel. Trang danh sách ở Milestone F6.3 hoàn toàn miễn nhiễm với gánh nặng tải của parser Markdown.

---

## 4. Bằng chứng Khóa Ranh giới Kiến trúc (Task T5.1 & KB-U12b, U26, U30)

Test suite tĩnh [boundaries.test.ts](../../../../frontend/src/features/knowledge-base/model/boundaries.test.ts) xác nhận 100% tuân thủ các quy tắc kiến trúc tại Mục 5.1:
- `KB-U12b`: $0$ xuất hiện của `dangerouslySetInnerHTML`, `rehype-raw`, `remark-gfm`, `rehype-sanitize`, `gray-matter` trên toàn bộ thư mục `src/features/knowledge-base/**`.
- `KB-U26`: `import.meta.glob` chỉ xuất hiện duy nhất tại [contentFiles.ts](../../../../frontend/src/features/knowledge-base/model/contentFiles.ts) và các file test (`*.test.ts`, `*.test.tsx`).
- `KB-U30.1`: Các module production trong `model/*.ts` không import `react`, `react-dom`, `react-router-dom`, hay `react-markdown`.
- `KB-U30.2`: Các module production trong `model/*.ts` không chứa tham chiếu tới `window`, `document`, hay `import.meta.env` (kết quả `git grep -nE "window|document|import\.meta\.env" src/features/knowledge-base/model` rỗng 100%).
- `KB-U30.3`: `MarkdownRenderer.tsx` không import `contentFiles`, `knowledgeContentService`, hay `manifest` (chỉ nhận `isKnownSlug` từ props).
- `KB-U30.4`: `knowledgeContentService.ts` không import `MarkdownRenderer` hay `seo`.
- `KB-U30.5`: `index.ts` không chứa `export *`, chỉ re-export tường minh các định danh cụ thể.
- `KB-U30.6`: `index.ts` không export `MarkdownRenderer` và không import từ `./ui/` để bảo vệ các consumer chỉ cần dùng service/model.

---

## 5. Bảng tổng hợp Quality Gates (Task T5.3)

| Cổng kiểm định | Lệnh thực hiện | Kết quả thực tế | Trạng thái |
|---|---|---|:---:|
| **Format Check** | `npx prettier --end-of-line auto --check .` | `All matched files use Prettier code style!` | **PASS** |
| **Lint Check** | `npm run lint` | `eslint .` chạy thành công, 0 errors, 0 warnings | **PASS** |
| **Typecheck** | `npm run typecheck` | `tsc.app` và `tsc.node` 0 errors | **PASS** |
| **Knowledge Base Tests** | `npx vitest run src/features/knowledge-base/` | 11 test files, **120/120 tests passed** | **PASS** |
| **Toàn bộ Test Suite Dự án** | `npx vitest run --maxWorkers=4 --passWithNoTests` | 156 test files, **1.325/1.325 tests passed** (100%) | **PASS** |
| **E2E Test Suite Count** | `CI=1 npx playwright test --list` | Đúng **60 tests trong 9 files** (không đổi so với baseline) | **PASS** |
| **Production Build** | `npm run build` | Biến đổi thành công 2.164 modules, xuất tệp `dist/` sạch | **PASS** |
| **Security Audit (Prod)** | `npm audit --omit=dev` | **4 vulnerabilities** (1 moderate, 3 high) từ `axios`, `zod`, `follow-redirects`, `fast-uri` (kế thừa từ baseline F6.0, **0 lỗ hổng mới**) | **PASS** |
| **Scope Boundary Check** | `git diff --stat` | 0 thay đổi ngoài phạm vi; không chạm `backend/**`, `router.tsx`, `main.tsx`, `vite.config.ts`, CI | **PASS** |

---

## 6. Closure Notes & Trạng thái Quyết định (D-F6.2-01…08)

Toàn bộ 8 đề xuất kỹ thuật trong kế hoạch F6.2 đã được duyệt và hiện thực hóa đầy đủ:
- **`D-F6.2-01` [AD]**: Áp dụng cấu trúc thư mục thực tế của repo `model/` + `ui/` (không tạo `services/`, `data/`, `lib/`).
- **`D-F6.2-02` [AD]**: Sử dụng glob lazy theo từng bài viết kết hợp API service bất đồng bộ.
- **`D-F6.2-03` [AD]**: Lựa chọn Phương án B (1 bài mẫu `what-is-astrology.md` để kiểm thử toàn vẹn pipeline và content linter; ghi nhận Known Gap về việc biên tập nội dung chuyên môn ở F6.6).
- **`D-F6.2-04` [AD]**: Giới hạn ảnh chỉ cho phép ảnh cục bộ tại `public/knowledge/images/`; khóa các slug dành riêng `index`, `images`.
- **`D-F6.2-05` [AD]**: Link ngoài chỉ cho phép scheme `https:`; từ chối `http:`, `mailto:`, `tel:`.
- **`D-F6.2-06` [AD]**: Hỗ trợ hiển thị cơ bản cho `pre > code` và inline code bằng design tokens có thật (`font-data`, `bg-surface-raised`), không sử dụng thư viện highlight cồng kềnh.
- **`D-F6.2-07` [AD]**: Định dạng tiêu đề thống nhất với repo: `{Tiêu đề} — AstroViet`.
- **`D-F6.2-08` [AD]**: Ghim chính xác phiên bản `react-markdown@10.1.0` với `--save-exact`.

---

## 7. Handoff sang Milestone F6.3 (Knowledge Base Listing Page)

Các yêu cầu chuyển giao bắt buộc đối với F6.3:
1. **HR-1:** Import Knowledge Base feature **chỉ** được đặt trong route component tải chậm (`React.lazy()`) trong `router.tsx`. Lặp lại phép đo bundle sau khi có trang listing để bảo đảm `micromark` không lọt vào entry bundle.
2. **HR-2:** Trang danh sách chỉ được sử dụng `listArticles({ category })`, `KNOWLEDGE_CATEGORIES` và `KNOWLEDGE_CATEGORY_LABELS` từ `@features/knowledge-base`. Tuyệt đối **không gọi `getArticle()`** tại trang danh sách để tránh tải không cần thiết thân bài Markdown của 15 bài viết vào bộ nhớ. Trang danh sách **không import `MarkdownRenderer`**.
3. **HR-3:** Component giao diện danh sách (`KnowledgeListView`) là presentational component nhận mảng metadata từ service, hỗ trợ kiểm thử giao diện và empty state độc lập mà không can thiệp manifest thật.
