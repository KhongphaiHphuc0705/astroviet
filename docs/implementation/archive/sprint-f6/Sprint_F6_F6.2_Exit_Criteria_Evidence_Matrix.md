# Sprint F6 — Milestone F6.2 Exit Criteria Evidence Matrix

> **Sprint:** F6 — Knowledge Base (MVP, Frontend-only)  
> **Milestone:** F6.2 — Content Domain Model, Content Integrity, Markdown Security Policy & SEO Foundation  
> **Target Version:** `[Unreleased]` (Hiện tại `package.json` là `0.4.0` đã phát hành ở Sprint F5 ngày 2026-11-09; toàn bộ thay đổi F6 ghi nhận dưới mục `[Unreleased]`, chưa bump version; Git tag `v0.4.0` chưa có trên origin — hiện chỉ có `v0.3.0`)  
> **Execution Date:** 2026-11-20  
> **Branch / Head Commit:** `dev`  
> **Status:** **PASS — CONTENT DOMAIN MODEL, INTEGRITY PARITY, MARKDOWN SECURITY & SEO FOUNDATION VERIFIED**  

---

## 1. Mục tiêu & Phạm vi Milestone F6.2

Milestone F6.2 thiết lập toàn bộ nền tảng dữ liệu, dịch vụ nội dung, bảo mật hiển thị Markdown và siêu dữ liệu SEO cho tính năng Knowledge Base theo đúng hợp đồng kiến trúc Sprint F6:
1. **Content Domain Model & Manifest (`F6.2.1`):** Khóa kiểu dữ liệu, danh mục chuẩn, validation runtime độc lập với Vite, manifest tĩnh và bài viết mẫu.
2. **File Mapping, Integrity & Content Service (`F6.2.2`):** Kiểm tra đối sánh hai chiều (parity) giữa manifest và file `.md`, cô lập `import.meta.glob` duy nhất trong `contentFiles.ts`, cung cấp `knowledgeContentService` bất đồng bộ xử lý rõ ràng 3 trạng thái (`found`, `not-found`, `content-error`).
3. **Markdown Renderer & Security Policy (`F6.2.3`):** Cài đặt `react-markdown@10.1.0` với `--save-exact`, 0 plugin ngoài, bật `skipHtml`, cấm tuyệt đối `dangerouslySetInnerHTML`. Cơ chế bảo vệ đa lớp kiểm soát URL hostile, chuẩn hoá heading bảo vệ cấu trúc tài liệu, lazy image. Content linter (L1–L6) kiểm soát chất lượng nội dung trước khi xuất bản.
4. **SEO Metadata Foundation (`F6.2.4`):** Bộ helper thuần SSR-safe (`seo.ts`) chạy độc lập trong môi trường Node, chuẩn hoá URL site, ngăn chặn sinh `og:image` giả.
5. **Integration, Bundle & Quality Verification (`F6.2.5`):** Barrel export tường minh, kiểm định khóa ranh giới kiến trúc bằng regex gates (`boundaries.test.ts`), chứng minh bằng số đo thực tế thư viện Markdown không nằm trong bundle entry ban đầu, vượt qua toàn bộ quality gates (format, lint, typecheck, test, build, audit).

---

## 2. Acceptance Criteria Traceability Matrix (F6.2)

| Mã AC | Yêu cầu nghiệp vụ / kỹ thuật | File Triển khai | Test ID & Test File | Lệnh Kiểm chứng Thực tế | Kết quả Xác minh | Trạng thái |
|---|---|---|---|---|---|:---:|
| **KB-AC-07** | Metadata đầy đủ field, kiểm tra runtime bằng hàm thuần, mã lỗi phân biệt | `types.ts`, `validateManifest.ts`, `manifest.ts` | `KB-U01` (`validateManifest.test.ts`) | `npx vitest run src/features/knowledge-base/model/validateManifest.test.ts` | 13/13 tests pass; bắt đúng mọi vi phạm (`code`, `index`, ngày không hợp lệ, tiêu đề rỗng, summary > 160 ký tự) | **PASS** |
| **KB-AC-08** | Mỗi entry trong manifest tương ứng đúng 1 file `.md` vật lý | `contentIntegrity.ts`, `contentFiles.ts` | `KB-U04`, `KB-U27` (`contentIntegrity.test.ts`, `contentFiles.test.ts`) | `npx vitest run src/features/knowledge-base/model/contentIntegrity.test.ts` | 8/8 tests pass; bắt chính xác fixture thiếu file trong `missingFiles` | **PASS** |
| **KB-AC-09** | Mỗi file `.md` trong repo tương ứng manifest (không orphan/malformed keys) | `contentIntegrity.ts`, `contentFiles.ts` | `KB-U05`, `KB-U27` (`contentIntegrity.test.ts`, `contentFiles.test.ts`) | `npx vitest run src/features/knowledge-base/model/contentIntegrity.test.ts` | 8/8 tests pass; phát hiện file mồ côi, file sai thư mục, key lạ | **PASS** |
| **KB-AC-10** | Slug duy nhất, đúng 5 danh mục, thứ tự tất định không phụ thuộc thứ tự nạp glob | `types.ts`, `validateManifest.ts` | `KB-U02`, `KB-U03`, `KB-U06` (`validateManifest.test.ts`, `types.test.ts`) | `npx vitest run src/features/knowledge-base/model/validateManifest.test.ts` | 13/13 tests pass; đảo thứ tự mảng đầu vào luôn trả về kết quả sắp xếp xác định | **PASS** |
| **KB-AC-11** | Service resolve bài theo slug; phân biệt rõ `found`, `not-found`, `content-error` | `knowledgeContentService.ts` | `KB-U07`, `KB-U08`, `KB-U09a/b` (`knowledgeContentService.test.ts`) | `npx vitest run src/features/knowledge-base/model/knowledgeContentService.test.ts` | 11/11 tests pass; slug lạ trả về `not-found` mà không kích hoạt nạp file; file thiếu trả về `content-error/missing-file` | **PASS** |
| **KB-AC-12** | HTML thô và script không được thực thi hay xuất hiện trong DOM | `MarkdownRenderer.tsx` | `KB-U10`, `KB-U12b` (`MarkdownRenderer.test.tsx`, `boundaries.test.ts`) | `npx vitest run src/features/knowledge-base/ui/MarkdownRenderer.test.tsx` | 19/19 tests pass; DOM không chứa `<script>`, `<iframe>`, `on*` attributes | **PASS** |
| **KB-AC-14** | Hỗ trợ đúng 5 danh mục theo thứ tự PRD (`fundamentals` đứng đầu) | `types.ts` | `KB-U03` (`types.test.ts`) | `npx vitest run src/features/knowledge-base/model/types.test.ts` | 5/5 tests pass; đúng 5 danh mục và nhãn tiếng Việt tương ứng | **PASS** |
| **KB-AC-20** | Thân bài bắt đầu từ H2; H1 Markdown được chuẩn hoá tất định sang H2 | `markdownPolicy.ts`, `MarkdownRenderer.tsx`, `contentLint.test.ts` | `KB-U16`, `KB-U29` (`MarkdownRenderer.test.tsx`, `contentLint.test.ts`) | `npx vitest run src/features/knowledge-base/ui/MarkdownRenderer.test.tsx` | 19/19 tests pass; H1 render thành `<h2>` kèm `data-heading-normalized-from="1"`; không có thẻ `<h1>` trong rendered DOM | **PASS** |
| **KB-AC-22** | Link nội bộ điều hướng bằng React Router `<Link>`, không reload trang | `markdownPolicy.ts`, `MarkdownRenderer.tsx` | `KB-U11` (`MarkdownRenderer.test.tsx`) | `npx vitest run src/features/knowledge-base/ui/MarkdownRenderer.test.tsx` | 19/19 tests pass; link `/knowledge` và `/knowledge/:slug` hợp lệ dùng `<Link>` | **PASS** |
| **KB-AC-23** | Link ngoài an toàn (chỉ cho phép `https:`), bắt buộc `target="_blank"` và `rel="noopener noreferrer"` | `markdownPolicy.ts`, `MarkdownRenderer.tsx` | `KB-U11` (`markdownPolicy.test.ts`, `MarkdownRenderer.test.tsx`) | `npx vitest run src/features/knowledge-base/model/markdownPolicy.test.ts` | 21/21 tests pass; từ chối `http:`, `mailto:`, `javascript:`, `data:`, credentialed URLs | **PASS** |
| **KB-AC-25** | Ảnh bắt buộc có alt mô tả, `loading="lazy"`, `decoding="async"`, chỉ cho phép ảnh cục bộ | `markdownPolicy.ts`, `MarkdownRenderer.tsx` | `KB-U12`, `KB-U17` (`markdownPolicy.test.ts`, `MarkdownRenderer.test.tsx`) | `npx vitest run src/features/knowledge-base/ui/MarkdownRenderer.test.tsx` | 19/19 tests pass; ảnh remote/CDN/thiếu alt bị ẩn và đánh dấu `data-kb-fallback` | **PASS** |
| **KB-AC-33** | Kiểm tra parity hai chiều chạy tự động trong test suite | `contentIntegrity.ts`, `contentFiles.ts` | `KB-U04`, `KB-U05`, `KB-U27` (`contentIntegrity.test.ts`, `contentFiles.test.ts`) | `npx vitest run src/features/knowledge-base/model/contentFiles.test.ts` | 7/7 tests pass; kiểm tra khớp 100% trên cả dữ liệu thật lẫn fixture giả lập | **PASS** |
| **KB-AC-34** | Test an toàn XSS và URL độc hại bao phủ 6 nhóm rủi ro bảo mật | `MarkdownRenderer.tsx`, `markdownPolicy.ts` | `KB-U10`, `KB-U11`, `KB-U12` (`MarkdownRenderer.test.tsx`, `markdownPolicy.test.ts`) | `npx vitest run src/features/knowledge-base/ui/MarkdownRenderer.test.tsx` | 19/19 tests pass; chặn `<script>`, `<img onerror>`, `javascript:`, `vbscript:`, `data:`, `//protocol-relative` | **PASS** |
| **KB-AC-35** | Test kiểm tra phân cấp heading trong Markdown (H2 bắt đầu, không nhảy cấp) | `MarkdownRenderer.tsx`, `contentLint.test.ts` | `KB-U16`, `KB-U29` (`contentLint.test.ts`) | `npx vitest run src/features/knowledge-base/model/contentLint.test.ts` | 11/11 tests pass; bắt chính xác vi phạm nhảy cấp H2 $\to$ H4 trong fixture hỏng; bài mẫu đạt 0 vi phạm | **PASS** |
| **KB-AC-26** | Nền tảng SEO Title chuẩn hoá có hậu tố `— AstroViet` | `seo.ts` | `KB-U18`, `KB-U28` (`seo.test.ts`) | `npx vitest run src/features/knowledge-base/model/seo.test.ts` | 11/11 tests pass trong môi trường Node | **PASS (nền)** |
| **KB-AC-27** | Nền tảng SEO Meta Description từ summary bài viết | `seo.ts` | `KB-U18`, `KB-U28` (`seo.test.ts`) | `npx vitest run src/features/knowledge-base/model/seo.test.ts` | 11/11 tests pass trong môi trường Node | **PASS (nền)** |
| **KB-AC-28** | Nền tảng SEO Canonical URL chuẩn hoá host, không có `/` cuối | `seo.ts` | `KB-U19`, `KB-U28` (`seo.test.ts`) | `npx vitest run src/features/knowledge-base/model/seo.test.ts` | 11/11 tests pass; `normalizeSiteUrl` loại bỏ trailing slash, kiểm tra scheme http(s) | **PASS (nền)** |

---

## 3. Bằng chứng Đo Bundle & Cô lập Lazy Loading (Task T5.2)

Phương pháp đo: Thực hiện theo script Node độc lập tại Phụ lục A của kế hoạch, so sánh trực tiếp kích thước các chunk giữa bản build baseline và bản build có chứa dynamic lazy import `void import("./features/knowledge-base")`.

### Bảng đối chiếu Kích thước Chunk (Raw & Gzip-9)

| Chunk / Tệp phát sinh | Baseline Build (`main.tsx` gốc) | Bản build Spike T5.2 (Lazy import) | Chênh lệch (Diff) | Nhận xét phân loại |
|---|:---:|:---:|:---:|---|
| **Entry Chunk** (`index-*.js`) | 458.891 B raw / 145.383 B gz | 458.955 B raw / 145.453 B gz | **+64 B raw / +70 B gz** | **ENTRY**. Hoàn toàn KHÔNG chứa mã `react-markdown` hay parser (`micromark`, `mdast`, `hast`). |
| **Lazy KB Chunk** (`index-*.js`) | *Không tồn tại* | **133.346 B raw / 41.527 B gz** | +133.346 B raw | **CHUNK LAZY (MARKDOWN-LIBS)**. Toàn bộ thư viện `react-markdown` và dependencies được cô lập tại đây. |
| **Content Chunk** (`what-is-astrology-*.js`) | *Không tồn tại* | **1.188 B raw / 653 B gz** | +1.188 B raw | **CHUNK CONTENT**. Nội dung Markdown của bài viết mẫu được tách riêng biệt. |
| **Global CSS** (`index-*.css`) | 51.49 kB (8.87 kB gz) | 51.49 kB (8.87 kB gz) | 0 B | Không ảnh hưởng CSS toàn cục. |

**Kết luận T5.2:** Thư viện `react-markdown` và các thư viện phụ thuộc (`micromark`, `mdast-util`, `hast-util-to-jsx-runtime`) được chia nhỏ và cô lập 100% bên ngoài entry bundle chính của ứng dụng. Bundle entry ban đầu chỉ tăng 64 bytes (câu lệnh import động). Mọi thay đổi tạm thời đã được hoàn tác hoàn toàn, `git status` sạch.

---

## 4. Bằng chứng Khóa Ranh giới Kiến trúc (Task T5.1 & KB-U12b, U26, U30)

Test suite tĩnh [boundaries.test.ts](file:///d:/Hphucc/Hphuc/astroviet/frontend/src/features/knowledge-base/model/boundaries.test.ts) xác nhận 100% tuân thủ các quy tắc kiến trúc tại Mục 5.1:
- `KB-U12b`: $0$ xuất hiện của `dangerouslySetInnerHTML`, `rehype-raw`, `remark-gfm`, `rehype-sanitize`, `gray-matter` trên toàn bộ thư mục `src/features/knowledge-base/**`.
- `KB-U26`: `import.meta.glob` chỉ xuất hiện duy nhất tại [contentFiles.ts](file:///d:/Hphucc/Hphuc/astroviet/frontend/src/features/knowledge-base/model/contentFiles.ts) và các file test (`*.test.ts`, `*.test.tsx`).
- `KB-U30.1`: Các module production trong `model/*.ts` không import `react`, `react-dom`, `react-router-dom`, hay `react-markdown`.
- `KB-U30.2`: Các module production trong `model/*.ts` không chứa tham chiếu tới `window`, `document`, hay `import.meta.env` (kết quả `git grep -nE "window|document|import\.meta\.env" src/features/knowledge-base/model` rỗng 100%).
- `KB-U30.3`: `MarkdownRenderer.tsx` không import `contentFiles`, `knowledgeContentService`, hay `manifest` (chỉ nhận `isKnownSlug` từ props).
- `KB-U30.4`: `knowledgeContentService.ts` không import `MarkdownRenderer` hay `seo`.
- `KB-U30.5`: `index.ts` không chứa `export *`, chỉ re-export tường minh các định danh cụ thể.

---

## 5. Bảng tổng hợp Quality Gates (Task T5.3)

| Cổng kiểm định | Lệnh thực hiện | Kết quả thực tế | Trạng thái |
|---|---|---|:---:|
| **Format Check** | `npx prettier --end-of-line auto --check .` | `All matched files use Prettier code style!` | **PASS** |
| **Lint Check** | `npm run lint` | `eslint .` chạy thành công, 0 errors, 0 warnings | **PASS** |
| **Typecheck** | `npm run typecheck` | `tsc.app` và `tsc.node` 0 errors | **PASS** |
| **Knowledge Base Tests** | `npx vitest run src/features/knowledge-base/` | 11 test files, **114/114 tests passed** | **PASS** |
| **Toàn bộ Test Suite Dự án** | `npx vitest run --maxWorkers=4 --passWithNoTests` | 156 test files, **1.319/1.319 tests passed** (100%) | **PASS** |
| **E2E Test Suite Count** | `CI=1 npx playwright test --list` | Đúng **60 tests trong 9 files** (không đổi so với baseline) | **PASS** |
| **Production Build** | `npm run build` | Biến đổi thành công 2.155 modules, xuất tệp `dist/` sạch | **PASS** |
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
- **`D-F6.2-06` [AD]**: Hỗ trợ hiển thị cơ bản cho `pre > code` và inline code mà không cài thư viện highlight cồng kềnh.
- **`D-F6.2-07` [AD]**: Định dạng tiêu đề thống nhất với repo: `{Tiêu đề} — AstroViet`.
- **`D-F6.2-08` [AD]**: Ghim chính xác phiên bản `react-markdown@10.1.0` với `--save-exact`.

---

## 7. Handoff sang Milestone F6.3 (Knowledge Base Listing Page)

Các yêu cầu chuyển giao bắt buộc đối với F6.3:
1. **HR-1:** Import Knowledge Base feature **chỉ** được đặt trong route component tải chậm (`React.lazy()`) trong `router.tsx`. Lặp lại phép đo bundle sau khi có trang listing để bảo đảm `micromark` không lọt vào entry bundle.
2. **HR-2:** Trang danh sách chỉ được sử dụng `listArticles({ category })`, `KNOWLEDGE_CATEGORIES` và `KNOWLEDGE_CATEGORY_LABELS`. Tuyệt đối **không gọi `getArticle()`** tại trang danh sách để tránh tải không cần thiết thân bài Markdown của 15 bài viết vào bộ nhớ.
3. **HR-3:** Component giao diện danh sách (`KnowledgeListView`) là presentational component nhận mảng metadata từ service, hỗ trợ kiểm thử giao diện và empty state độc lập mà không can thiệp manifest thật.
