# Sprint F6 — Milestone F6.1 Exit Criteria Evidence Matrix

> **Sprint:** F6 — Knowledge Base (MVP, Frontend-only)  
> **Milestone:** F6.1 — Audit & Requirements Traceability Matrix (RTM)  
> **Target Version:** `[Unreleased]` (Hiện tại `package.json` là `0.4.0` đã phát hành ở Sprint F5 ngày 2026-11-09; toàn bộ thay đổi F6 ghi nhận dưới mục `[Unreleased]`, chưa bump version; Git tag `v0.4.0` chưa có trên origin — hiện chỉ có `v0.3.0`, câu hỏi Q2 còn mở)  
> **Execution Date:** 2026-11-18  
> **Branch / Head Commit:** `dev`  
> **Status:** **PASS — AUDIT & TRACEABILITY BASELINE FINALIZED**  

---

## 1. Mục tiêu & Phạm vi Milestone F6.1

1. Khóa ma trận truy vết yêu cầu (RTM) cho toàn bộ 40 tiêu chí chấp nhận (`KB-AC-01` – `KB-AC-40`), bảo đảm 100% yêu cầu từ PRD, UI Spec, Architecture Spec và các chỉ thị của Product Owner có đường dẫn thực thi và xác minh rõ ràng.
2. Chốt giải pháp xử lý 11 xung đột tài liệu (`C1`–`C11`).
3. Khóa danh mục thành phần tái sử dụng (`shared/ui`, layouts, helpers) để tránh trùng lặp mã.
4. Đánh giá chuỗi cung ứng dependency (`react-markdown@10.1.0`, 0 framework mới, 0 plugin lạ).
5. Khóa kiến trúc Prerender P1 (kèm Suspense boundary parity ở cây SSR) và chiến lược Hydration Client.

---

## 2. Requirements Traceability Matrix (RTM: KB-AC-01…40)

Toàn bộ 40 tiêu chí được phân loại theo Milestone triển khai và phương thức xác minh tự động:

| Mã AC | Tóm tắt Tiêu chí Chấp nhận | Nguồn Gốc | Milestone Dự kiến | File Triển khai Dự kiến | Bằng chứng Kiểm thử Dự kiến | Trạng thái Hiện tại |
|---|---|---|:---:|---|---|:---:|
| **KB-AC-01** | Guest truy cập `/knowledge` không cần đăng nhập | UI Spec §13 | F6.3 | `src/pages/knowledge/page.tsx` | Playwright `KB-E01` | PENDING |
| **KB-AC-02** | Guest truy cập thẳng `/knowledge/:slug` không cần đăng nhập | UI Spec §13 | F6.4 | `src/pages/knowledge/detail/page.tsx` | Playwright `KB-E02` | PENDING |
| **KB-AC-03** | Trang danh sách sử dụng đúng `MarketingLayout` công khai | UI Spec §13 | F6.3 | `src/app/router.tsx` | Unit test router + `KB-E01` | PENDING |
| **KB-AC-04** | Trang chi tiết sử dụng đúng `MarketingLayout` công khai | UI Spec §13 | F6.4 | `src/app/router.tsx` | Unit test router + `KB-E02` | PENDING |
| **KB-AC-05** | Slug lạ hiển thị Not Found thân thiện, không crash ứng dụng | Chỉ thị PO | F6.4 | `ArticleNotFound.tsx` | `KB-U09`, `KB-E08` | PENDING |
| **KB-AC-06** | "Kiến thức" xuất hiện trên cả Navbar và Footer | Spec §11, D-F6-N1 | F6.5 | `MarketingLayout/index.tsx` | `KB-U-nav`, `KB-E09` | PENDING |
| **KB-AC-07** | Metadata hợp lệ cho toàn bộ bài viết trong manifest | D-F6-04 | F6.2 | `manifest.ts`, `types.ts` | Vitest `KB-U01` | PENDING |
| **KB-AC-08** | Mỗi entry trong manifest bắt buộc có file `.md` tương ứng | D-F6-04 | F6.2 | `contentFiles.ts` | Vitest `KB-U04` | PENDING |
| **KB-AC-09** | Mỗi file `.md` trong repo bắt buộc có mặt trong manifest | D-F6-04 | F6.2 | `contentFiles.ts` | Vitest `KB-U05` | PENDING |
| **KB-AC-10** | Slug duy nhất, đúng định dạng, danh mục chuẩn, thứ tự tất định | D-F6-04 | F6.2 | `knowledgeContentService.ts` | `KB-U02`, `KB-U03`, `KB-U06` | PENDING |
| **KB-AC-11** | Tiêu đề, tóm tắt, danh mục khớp chính xác giữa manifest và thân bài | Chỉ thị PO | F6.2 | `knowledgeContentService.ts` | `KB-U07`, `KB-E06` | PENDING |
| **KB-AC-12** | HTML thô và script không bị thực thi/chèn vào DOM | Arch §12.3 | F6.2 | `MarkdownRenderer.tsx` (`skipHtml`) | `KB-U10`, `KB-U11`, `KB-U12` | PENDING |
| **KB-AC-13** | Lưới thẻ bài viết responsive mượt mà (1 $\to$ 2 $\to$ 3 cột) | UI Spec §13 | F6.3 | `KnowledgeListView.tsx` | `KB-U13`, đo viewport | PENDING |
| **KB-AC-14** | Hỗ trợ đủ 5 danh mục theo chuẩn PRD FR-12 | PRD FR-12 | F6.2 | `types.ts`, `CategoryFilter.tsx` | `KB-U03`, `KB-E04` | PENDING |
| **KB-AC-15** | Chọn danh mục chỉ lọc hiển thị đúng các bài thuộc danh mục đó | PRD FR-12 | F6.3 | `CategoryFilter.tsx` | `KB-U08`, `KB-E04` | PENDING |
| **KB-AC-16** | Có nút quay lại "Tất cả" phục hồi danh sách ban đầu | Chỉ thị PO | F6.3 | `CategoryFilter.tsx` | `KB-E05` | PENDING |
| **KB-AC-17** | Hiển thị Empty State khi danh mục chưa có bài viết | Spec §18.3 | F6.3 | `KnowledgeListView.tsx` | `KB-U14` | PENDING |
| **KB-AC-18** | Không triển khai phân trang và tìm kiếm ở phạm vi MVP | D-F6-OWN-2 | F6.3 | Codebase verification | Audit rỗng | PENDING |
| **KB-AC-19** | Mỗi bài viết chi tiết có duy nhất một thẻ `h1` | Chỉ thị PO | F6.4 | `KnowledgeArticleView.tsx` | `KB-U15`, `KB-E06` | PENDING |
| **KB-AC-20** | Heading Markdown bắt đầu từ H2, cấu trúc tuần tự, cấm H1 trong body | Chỉ thị PO | F6.2 | `MarkdownRenderer.tsx`, Content Rule | `KB-U16`, `KB-AC-35` | PENDING |
| **KB-AC-21** | Bề rộng dòng đọc văn bản bọc chuẩn xấp xỉ 65ch (`max-w-[65ch]`) | D-F6-09 | F6.4 | `KnowledgeArticleView.tsx` | Đo viewport, test typography | PENDING |
| **KB-AC-22** | Liên kết nội bộ điều hướng bằng React Router (`Link`), không reload | Chỉ thị PO | F6.2 | `MarkdownRenderer.tsx` | `KB-U11`, `KB-E07` | PENDING |
| **KB-AC-23** | Liên kết ngoài an toàn (`rel="noopener noreferrer"`, URL sanitize) | D-F6-05 | F6.2 | `MarkdownRenderer.tsx` | `KB-U11` | PENDING |
| **KB-AC-24** | Heading không nhảy cấp; vai trò/tên truy cập đúng theo chuẩn a11y dự án | F5 AC-24 | F6.4 | Toàn feature UI | `KB-U16`, `KB-A01..A05` | PENDING |
| **KB-AC-25** | Ảnh có `alt` mô tả bắt buộc; hỗ trợ lazy loading | D-F6-12 | F6.2 | `MarkdownRenderer.tsx` | `KB-U17` | PENDING |
| **KB-AC-26** | Mỗi trang có thẻ `<title>` riêng biệt, chuẩn SEO | D-F6-11 | F6.5 | `seo.ts`, `usePageMeta.ts` | `KB-U18`, `KB-P01` | PENDING |
| **KB-AC-27** | Thẻ meta description tương ứng với summary bài viết | D-F6-11 | F6.5 | `seo.ts`, `usePageMeta.ts` | `KB-U18`, `KB-P02` | PENDING |
| **KB-AC-28** | Thẻ canonical tuyệt đối chính xác dựa trên `VITE_SITE_URL` | D-F6-11 | F6.5 | `seo.ts`, `resolveSiteUrl` | `KB-U19`, `KB-P03` | PENDING |
| **KB-AC-29** | Sitemap.xml được sinh tự động từ manifest và route `/knowledge` | D-F6-11 | F6.5 | `prerender.mjs`, `seo.ts` | `KB-U20`, `KB-P05` | PENDING |
| **KB-AC-30** | Robots.txt xuất đúng vị trí thư mục dist kèm dòng Sitemap | D-F6-11 | F6.5 | `prerender.mjs`, `seo.ts` | `KB-U21`, `KB-P06` | PENDING |
| **KB-AC-31** | HTML prerender chứa đầy đủ nội dung bài viết và metadata trong DOM | D-F6-11 | F6.5 | `prerender.mjs` | `KB-P01..P11` (Build tự kiểm) | PENDING |
| **KB-AC-32** | Các route CSR hiện có và quy trình build app hoạt động bình thường | Chỉ thị PO | F6.5 | Core router | Toàn bộ Regression suite | PENDING |
| **KB-AC-33** | Test parity 2 chiều giữa manifest và file `.md` | Chỉ thị PO | F6.2 | `knowledgeContentService.test.ts` | `KB-U04`, `KB-U05` | PENDING |
| **KB-AC-34** | Test an toàn XSS và lọc thẻ HTML/script thô | Chỉ thị PO | F6.2 | `MarkdownRenderer.test.tsx` | `KB-U10..U12` | PENDING |
| **KB-AC-35** | Test kiểm tra phân cấp heading trong Markdown | Chỉ thị PO | F6.2 | `MarkdownRenderer.test.tsx` | `KB-U16` | PENDING |
| **KB-AC-36** | Kiểm thử tiếp cận đạt 0 vi phạm axe trên toàn bộ các view KB | Chỉ thị PO | F6.6 | Component test suites | `KB-A01..A05` | PENDING |
| **KB-AC-37** | Playwright E2E: Guest duyệt danh sách và đọc bài chi tiết | Chỉ thị PO | F6.6 | `e2e/knowledge-base.spec.ts` | `KB-E01`, `KB-E02`, `KB-E03` | PENDING |
| **KB-AC-38** | Playwright E2E: Lọc 5 danh mục và phục hồi danh sách | Chỉ thị PO | F6.6 | `e2e/knowledge-base.spec.ts` | `KB-E04`, `KB-E05` | PENDING |
| **KB-AC-39** | Playwright E2E: Slug không tồn tại hiển thị Not Found an toàn | Chỉ thị PO | F6.6 | `e2e/knowledge-base.spec.ts` | `KB-E08` | PENDING |
| **KB-AC-40** | Toàn bộ Quality Gates CI và regression tests xanh 100% | Chỉ thị PO | F6.6 | GitHub Actions CI | Run URL CI commit | PENDING |

---

## 3. Chốt Phương án Xử lý Xung đột Kỹ thuật & Tài liệu (`C1`–`C11`)

| Mã Xung đột | Vấn đề Xung đột | Quyết định Xử lý Đã Chốt | Kế hoạch Thực hiện |
|---|---|---|---|
| **C1** | UI Spec §13 ghi `Pagination` vs D-F6-08 (không phân trang) | Không làm phân trang; cập nhật UI Spec as-built ở F6.7 | Cập nhật §13 tại F6.7 |
| **C2** | UI Spec §18.3 ghi Empty State theo tìm kiếm vs F6 chỉ lọc danh mục | Thêm Empty State theo bộ lọc với copy đã duyệt (`D-F6-U1`) | Cập nhật §18.3 tại F6.7 |
| **C3** | UI Spec §11.1 ghi Navbar có Transit/Synastry vs thực tế chỉ có 2 placeholder links | Chỉ thêm đúng 1 link "Kiến thức", không sửa các link ngoài phạm vi F6 | Thực hiện tại F6.5 |
| **C4** | UI Spec §11.2 ghi Footer 3 cột vs thực tế footer 1 dòng | Quyết định `D-F6-N1(a)`: Thêm tối thiểu 1 thẻ `nav` có link "Kiến thức" | Thực hiện tại F6.5 |
| **C5** | UI Spec §14.1 xếp `/knowledge*` vào "Backlog F5+" | Chuyển trạng thái sang "Đã triển khai" khi đóng F6 | Cập nhật §14.1 tại F6.7 |
| **C6** | `import.meta.glob` eager nhúng nội dung vs kích thước bundle | Giữ eager bên trong chunk lazy của route Knowledge để cô lập tải | Đo đạc tại F6.2 |
| **C7** | Heading Markdown bắt đầu từ H2 vs thiếu chuẩn biên tập | Cấm tuyệt đối `# ` (H1) trong file `.md`, chặn tự động bằng test `KB-U16` | Thực hiện tại F6.2 |
| **C8** | Không hardcode domain vs thiếu cấu hình URL | Bổ sung biến môi trường `VITE_SITE_URL` (hỗ trợ cờ `PRERENDER_STRICT`) | Thực hiện tại F6.5 |
| **C9** | Kiểm tra prerender không dùng mock vs E2E chạy trên dev server (CSR) | Script tự kiểm tra độc lập trên build thật + script kiểm chứng hydration cục bộ | Thực hiện tại F6.5 |
| **C10** | Architecture Spec §5.1 ghi "CSR-only" vs prerender build-time KB | Cập nhật Architecture Spec §5.1 làm rõ ngoại lệ prerender cho KB (`D-F6-K`) | Cập nhật tại F6.7 |
| **C11** | Prompt yêu cầu triển khai vs Owner yêu cầu lập plan trước | Đã lập Plan v1.2, chốt quyết định và baseline trước khi sinh mã | Hoàn tất tại F6.0/F6.1 |

---

## 4. Danh mục Thành phần Tái sử dụng (Reuse Catalog)

- **Layout & Landmarks:** `MarketingLayout` (đã có SkipLink `#main-content`, header, footer).
- **UI Components (`shared/ui`):**
  - `Card`: Làm container cho `ArticleCard` (props `interactive`, `as={Link}`).
  - `Badge`: Hiển thị nhãn danh mục bài viết.
  - `EmptyState`: Hiển thị trạng thái rỗng khi danh mục chưa có bài viết.
  - `Button`: Sử dụng với prop `as={Link}` cho nút điều hướng.
  - `Stack`, `Grid`, `Container`, `Section`: Bố cục lưới responsive và khoảng cách token.
- **Testing & Tooling:** `renderWithProviders`, `vitest-axe` (kiểm tra trợ năng), pattern lọc console lỗi `/auth/refresh` từ `interpretation.spec.ts`.

---

## 5. Đánh giá Tác động Dependency & Chuỗi Cung ứng

- **Dependency mới duy nhất:** `react-markdown@10.1.0` (production dependency).
  - Tương thích React 18.3.1 (peer dependency `react >=18`).
  - Tác động kích thước bundle: $\approx +121\text{ kB}$ raw / $+37\text{ kB}$ gzip (chỉ nạp khi người dùng mở trang Knowledge Base).
  - Tác động chuỗi cung ứng: $+82$ packages bắc cầu (hệ sinh thái `unified` / `remark` / `micromark`).
- **Thư viện không cài đặt:** `remark-gfm` (tuân thủ chỉ thị `D-F6-OWN-1`, bảo lưu cổng kiểm soát `D-F6-G` tại F6.6).
- **Công cụ Prerender:** $0$ dependency mới (tận dụng Vite 6 SSR build, `react-dom/server`, `StaticRouter` có sẵn).
- **Hiện trạng bảo mật baseline:** 34 lỗ hổng (trong đó có 4 ở production: axios, zod, follow-redirects, fast-uri; 30 ở dev dependencies). Sẽ chạy lại `npm audit` sau khi cài `react-markdown` để kiểm soát biến động.

---

## 6. Kết luận Milestone F6.1

- Toàn bộ 40 Acceptance Criteria đã có ma trận truy vết chi tiết và khả thi 100%.
- Các xung đột tài liệu đã có hướng xử lý dứt khoát, không còn điểm nghẽn.
- Kiến trúc prerender đã được hoàn thiện với giải pháp bọc `<Suspense fallback={<SuspenseFallback/>}><StaticPage/></Suspense>` đảm bảo hydration parity với router client.
- Sẵn sàng tiến hành Milestone F6.2 (Content Model & Markdown Pipeline).
