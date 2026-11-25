# AstroViet — Frontend Sprint F6.6: Content & QA Implementation Plan

| | |
|---|---|
| **Trạng thái tài liệu** | **PLAN v1.0 — chờ Owner review.** Plan-only: không có bài viết, mã, package, cấu hình hay tài liệu nào trong repo bị tạo/sửa; không AC nào được ghi PASS; **không** bài nào được gắn nhãn Approved |
| **Repo / nhánh đã audit** | `KhongphaiHphuc0705/astroviet`, nhánh `dev`, HEAD `3989a11` (2026-11-24 15:40, "[docs] update f6.5 evidence matrix"); evidence commit F6.5 = `cfdbd13` — **Frontend CI #383 = Success** (build job 7m42s; 1 cảnh báo Node 20 của actions; tôi mở được trang tóm tắt job, không đọc được log vì cần đăng nhập) |
| **Ngày lập** | 2026-11-24 |
| **Vị trí đề xuất** | `docs/implementation/Sprint_F6.6_Content_QA_Implementation_Plan.md` (tên theo prompt; prompt gợi ý `docs/frontend/sprints/…` — **thư mục này không tồn tại**, mọi plan sprint/milestone hiện có nằm ở `docs/implementation/` và là tài liệu tạm, xoá khi đóng). Evidence/Registry/Tracker: `docs/implementation/archive/sprint-f6/` |
| **Nhãn** | **[VF]** đã đọc/chạy trên bản clone · **[EXISTING]** đã tồn tại trong repo · **[PROPOSED]** đề xuất của plan này · **[OWNER]** cần Owner phê duyệt · **[BLOCKED]** chưa thể tiếp tục · **[AD]** Owner đã duyệt (theo F6 plan §3.1/§14.1) · **NOT VERIFIED** chưa kiểm được |

---

## 1. Executive Summary

**Mục tiêu F6.6.** Soạn đủ **15 bài** Knowledge Base (3 bài × 5 danh mục) bằng Markdown thuần, hoàn thiện manifest, kiểm thử nội dung (KB-U22/U23 + lint + parity), kiểm thử trợ năng (axe + QA thủ công), mở rộng Playwright `e2e/knowledge-base.spec.ts`, hồi quy F4/F5 + toàn bộ E2E, xác minh build/prerender/sitemap/robots/CI, và ghi evidence để đóng milestone **chỉ khi Owner duyệt toàn bộ nội dung** (KB-AC-36…40).

**Kết quả audit tóm tắt (tôi tự chạy/đọc ở HEAD `3989a11`)** [VF]:
- **Cổng F6.0b: PASS về điều kiện viết nội dung** — 5 nhãn góc chiếu chuẩn đã nằm trong `labels.ts` (dòng 79–83), UI Spec §12.11 (bảng "Nguồn chuẩn duy nhất", dòng 920–930), commit `58153ed`, Matrix F6.0b; test nhãn 47/47 pass. Còn mở **chỉ** `F6-AC-L5`/KG-F6-09 (ảnh viewport độ dài nhãn) — **không chặn** soạn bài (mục 5).
- **F6.5 đã đóng với bằng chứng chạy được:** build thật (client + SSR + prerender) ra `knowledge.html`, `knowledge/index.html`, `knowledge/<slug>.html`, `sitemap.xml`, `robots.txt`; tự kiểm KB-P01…P11 `PRERENDER OK`; 175 file / 1.483 test pass (tôi chạy ở `90436e2`, **chưa chạy lại toàn bộ** ở `3989a11`; test vùng thay đổi sau đó 56/56 pass); lint/typecheck sạch; `playwright --list` = **70 test / 10 file**. Các điểm tôi nêu khi review F6.5 đã được sửa: hai báo cáo hydration nay `passed: true`; strict từ chối tên miền dành riêng (`RESERVED_HOST`); `.prettierrc endOfLine: auto`.
- **Hiện trạng nội dung:** chỉ **1** file Markdown (`fundamentals/what-is-astrology.md`, 293 từ, 2 `##`, 0 liên kết) và **1** entry manifest — được ghi rõ là *bài kỹ thuật mẫu* (KG-F6-01/02/16). **14 bài chưa tồn tại.**
- **KB-U22/U23: chưa triển khai** (`git grep` không có). Định nghĩa nằm ở F6 plan §9.1 dòng 502–503; D-F6-A5/A6 **chưa duyệt** (mục 8).
- **Cổng GFM (D-F6-G): CHƯA kích hoạt** — chưa có bài thật để đánh giá. Cổng thực thi sẵn nhờ lint L4 (KB-U29) fail nếu bài dùng bảng/gạch ngang/task list.

**Chênh lệch/blocker nội dung cần Owner làm rõ trước khi chốt manifest** (mục 24): (1) **tiêu đề 15 bài** — prompt F6.6 dùng tên tiếng Anh (ví dụ "Sun, Moon và Ascendant…"), trong khi F6 plan §3.1 ghi **D-F6-C1 [AD]** "15 tiêu đề tiếng Việt chuẩn hoá" (Mục 11.1) — hai bản không khớp (và cột "tiêu đề trong prompt" của F6 plan là bản rút gọn so với prompt này); (2) thuật ngữ **chưa có trong repo**: Angular/Succedent/Cadent, nguyên tố/tính chất, chủ tinh (cổ điển vs hiện đại); (3) D-F6-A5/A6; (4) chính sách nguồn tham khảo; (5) hai quy tắc đối nghịch về số bài (F6 plan "tối thiểu 10" vs prompt "đủ 15").

**Trạng thái gate:** Content Authoring = **READY TO START sau khi Owner trả lời mục 24.1 (D-F6.6-01…03)**; phần kỹ thuật (hạ tầng test, E2E data-driven, tracker) làm được ngay. Không blocker kỹ thuật.

**Không tạo bài viết hay triển khai bất cứ thứ gì trong nhiệm vụ này.**

---

## 2. Project Context & Current State

| Milestone | Trạng thái [VF] | Evidence |
|---|---|---|
| F4 Natal Chart Viewer, F5 Interpretation UI | Hoàn thành | `archive/sprint-f4`, `archive/sprint-f5` (Matrix, Known Gaps) — **không đọc lại toàn bộ**; hồi quy dựa trên test hiện có (mục 14) |
| F6.0 / F6.0b | Hoàn thành (F6-AC-L5 UNVERIFIED → KG-F6-09) | Matrix F6.0, F6.0b |
| F6.1 | Audit + RTM | Matrix F6.1 |
| F6.2 | Content model + Markdown pipeline | Matrix F6.2, CI |
| F6.3 | Listing | Matrix F6.3, ảnh viewport |
| F6.4 | Article detail | Matrix F6.4, ảnh viewport |
| F6.5 | Navigation, SEO, prerender, hydration có điều kiện | Matrix F6.5, CI #383, báo cáo `f6_5_hydration*.json` (`passed: true`) |
| **F6.6** | **Content & QA — milestone cần lập plan** | plan này |
| F6.7 | Docs & closure | **chưa bắt đầu** |

Kiến trúc đã khoá [AD]: Frontend-only; `.md` + `import.meta.glob(…, {query:"?raw"})` qua `contentRegistry`; manifest TS; **không** frontmatter/`gray-matter`; `react-markdown` (chỉ plugin: **không** `remark-gfm`/`rehype-raw`, không `dangerouslySetInnerHTML`); `knowledgeContentService` là boundary; không CMS; nội dung qua Git/PR/redeploy; KB không thay Interpretation Engine.

---

## 3. Repository Audit Findings

### 3.1 Đã đọc [VF]
F6 plan (đủ các mục F6.6: §7, §8, §9, §11, §13, §14, §15); Matrix F6.0–F6.5; `Sprint_F6_Known_Gaps_Registry.md`; UI Spec §12.11; `Astrology_Domain_Specification.md` (§9.4 bảng orb, định nghĩa góc); `Natal_Chart_Domain_Specification.md` (§15 hệ nhà, §18.3 `isApplying`); `features/chart/model/labels.ts`; toàn bộ `features/knowledge-base/**` (manifest, service, renderer, lint, seo, prerender); `src/prerender/**`; `scripts/prerender.mjs`, `verify-hydration.mjs`; `e2e/knowledge-base.spec.ts`; `package.json`, `playwright.config.ts`, `.github/workflows/frontend-ci.yml`; báo cáo hydration.
**Không tồn tại trong repo:** "Knowledge Base Specification"/Content Specification riêng, glossary file riêng, tiêu chuẩn biên tập (F6 plan §11.2 mục 5 ghi rõ), `Confirmation.md` (F6 plan viện dẫn làm nguồn cho D-F6-*; **NOT VERIFIED**), thư mục `docs/frontend/sprints/`.

### 3.2 Hạ tầng nội dung đã có [EXISTING]
| Hạng mục | Thực tế | Dùng cho F6.6 |
|---|---|---|
| Manifest | `features/knowledge-base/model/manifest.ts` — 1 entry; trường `slug,title,category,summary,order,updatedAt` | điền 15 entry, **không đổi schema** |
| Validation | `validateManifest` (slug `^[a-z0-9]+(?:-[a-z0-9]+)*$`, ≤80, `index`/`images` dành riêng; title ≤120; summary ≤160; order số nguyên ≥0; `updatedAt` ngày lịch hợp lệ) | tái dùng |
| Parity | `checkContentParity` + `contentRegistry.listRawKeys()` (bắt file lạ `README.md`, thư mục lạ — đã sửa ở F6.2) | tái dùng (KB-U04/U05/U27) |
| Content lint KB-U29 | L1 HTML thô · L2 không `#`/`#####` · L3 hierarchy (bắt đầu `##`, không nhảy cấp) · L4 **không GFM** (bảng/`~~`/task list) · L5 link nội bộ phải có trong manifest · L6 ảnh hợp lệ — chạy trên **mọi bài thật** | tự động áp cho 15 bài |
| Renderer | `MarkdownRenderer`: `skipHtml`; link `https:` + `/knowledge[/slug]` only; ảnh `/knowledge/images/*.(png|jpe?g|webp|avif)` có alt; h1→h2, h5/h6→h4 + marker; code/blockquote/list đã có class | list/blockquote/code/link **chưa từng được kiểm với bài thật** (KG-F6-16) |
| Service | `listArticles`, `getArticleMetadata`, `getArticle` (`found/not-found/content-error`) | không đổi |
| SEO/prerender | `listPrerenderRoutes()` đọc từ manifest; sitemap/robots từ manifest; `validatePrerenderOutput` KB-P01–P11; KB-P07 yêu cầu text bài ≥ **200 ký tự** | tự mở rộng theo 15 bài (mục 15) |
| Test baseline | 175 file / 1.483 test (chạy ở `90436e2`); KB: 11+ file; E2E: **70 test / 10 file** (`knowledge-base.spec.ts`: 10 test) | baseline phải **đo lại** ở F6.6.1 |
| Hạ tầng a11y | `vitest-axe` (đã có); **không** `@axe-core/playwright`; jsdom không tính được contrast/layout | axe ở Vitest + QA thủ công |
| CI | `frontend-ci.yml`: trigger `push`/`pull_request` theo path `frontend/**`, `backend/**`; `npm ci` → `.env` ← example → `format:check` → `lint` → `typecheck` → `test:coverage` → `npm run build` → Backend → Playwright E2E (Postgres thật) | file `.md` mới nằm trong `frontend/**` ⇒ kích hoạt CI; **không cần workflow mới** |
| Hydration | **bật mặc định** (Owner PASS ở F6.5.8 trên **1 bài**, KG-F6-21) | **phải chạy lại** với 15 bài thật (mục 15) |

### 3.3 Phát hiện/chênh lệch (không chọn âm thầm)
| ID | Phát hiện | Xử lý đề xuất |
|---|---|---|
| X1 | **Tiêu đề:** prompt F6.6 §5 (tiếng Anh, ví dụ `Sun, Moon và Ascendant: Bộ ba nền tảng`, `Conjunction, Opposition, Square, Trine và Sextile`) ≠ F6 plan §3.1 **D-F6-C1 [AD]** (15 tiêu đề tiếng Việt chuẩn hoá, §11.1; `major-aspects` → "Góc chiếu chính: Trùng tụ, Lục hợp, Vuông góc, Tam hợp và Đối đỉnh"; `sun-moon-rising` → "Mặt Trời, Mặt Trăng và Cung Mọc (Ascendant)…"). Cột "tiêu đề trong prompt" ở F6 plan §11.1 là bản **rút gọn** (ví dụ #8 thiếu "trong chiêm tinh", #10 thiếu "trong bản đồ sao") | **D-F6.6-01 [OWNER]**; slug luôn giữ nguyên. Chưa chốt ⇒ **không điền `title` trong manifest** (mục 6) |
| X2 | Prompt §5.6: không tự đặt số từ; F6 plan §11.2 đề xuất ~500–900 từ (**giả định**) | giữ làm **[PROPOSED]**, Owner duyệt (D-F6.6-04) |
| X3 | F6 plan §11.2: nếu bài không đủ chất lượng → giảm số bài, tối thiểu 10; prompt DoD §12: **đủ 15** | giữ 15; giảm số bài = đổi scope ⇒ phải có quyết định Owner (D-F6.6-08) |
| X4 | Prompt §11 F6.6.8: "cập nhật changelog và các tài liệu liên quan"; F6 plan §7 F6.7 + D-F6-K/R: CHANGELOG/UI Spec/README/Closure Report ở **F6.7**, báo cáo đóng sprint **một** | **D-F6.6-10**: F6.6.8 cập nhật Matrix F6.6 + Known Gaps + Content Tracker; CHANGELOG/UI Spec/README ở F6.7; "closure report" = mục Closure trong Matrix F6.6 |
| X5 | Prompt §9.4 Scenario 6 ("HTML production build, extensionless"); D-F6-T1 [AD]: E2E chạy trên dev server, prerender bảo đảm bằng script tự kiểm trên build thật | giữ D-F6-T1; Scenario 6 = tự kiểm KB-P (15 bài) + bảng `vite preview`/`fetch` — **không** đổi `playwright.config.ts` |
| X6 | Prompt §9.4 Scenario 1 "nội dung card khớp manifest" — Playwright dùng alias TS riêng | thử import manifest bằng đường dẫn **tương đối** (manifest chỉ import `./types`) — **NOT VERIFIED**, kiểm ở F6.6.1; fallback: đối chiếu với DOM listing + KB-U05 |
| X7 | `what-is-astrology.md` hiện là "bài mẫu kỹ thuật" nhưng đã là 1 trong 15 slug chính thức | viết lại thành bài chính thức, đi qua quy trình duyệt như 14 bài còn lại (KG-F6-01) |
| X8 | `updatedAt` hiện trùng ngày tạo (19/11) | quy ước [PROPOSED]: ngày **commit nội dung được Owner duyệt gần nhất**; cập nhật thủ công khi sửa nội dung có ý nghĩa |
| X9 | Hydration PASS chỉ trên 1 bài ngắn không có list/link/blockquote | chạy lại cổng sau khi có 15 bài (KG-F6-21) |
| X10 | Lint L1/L4 là regex (KG-F6-06) | bổ sung duyệt thủ công checklist (mục 7.4) |

---

## 4. Scope & Out of Scope

**Trong F6.6:** soạn/chỉnh 15 file Markdown + 15 entry manifest; test nội dung (KB-U22/U23/U03b, lint, parity); mở rộng E2E; axe + QA thủ công (kèm ảnh viewport); hồi quy F4/F5; build/prerender/sitemap/robots/CI; Content Approval Tracker; evidence; cập nhật Known Gaps; chạy lại cổng hydration (Owner).
**Ngoài F6.6 (không làm):** thêm `remark-gfm` hay dependency nào (trừ khi D-F6-G được duyệt **bằng văn bản**); search/pagination/CMS/Admin; Backend/Prisma/API; tính toán chiêm tinh ở Frontend; đổi schema manifest; đổi hành vi F4/F5; đổi nhãn góc chiếu; thêm feature KB mới (related-articles tự động, mục lục…); ảnh minh hoạ (không có asset được duyệt — Owner có thể cung cấp, khi đó dùng chính sách ảnh F6.2); Nginx/deploy (KG-F6-19/20); sửa `playwright.config.ts`/workflow CI; cập nhật UI Spec/CHANGELOG/README (F6.7).
**Quy tắc:** vấn đề ngoài phạm vi ⇒ Known Gap hoặc decision request, không tự triển khai.

---

## 5. Prerequisites & F6.0b Gate

### 5.1 Gate F6.0b — **PASS (cho Content Authoring)**
| Điều kiện | Bằng chứng [VF] | Kết quả |
|---|---|---|
| F6.0b hoàn thành | commit `58153ed` (labels + 3 test + UI Spec §12.11 + CHANGELOG), Matrix F6.0b, F6 plan §7 F6.0b | ✔ |
| Nhãn cuối do Owner xác nhận | F6 plan §3.1 **D-F6-L1/L2/L3 [AD]** (nguồn gốc `Confirmation.md` **NOT VERIFIED** nhưng Matrix F6.0b ghi nhận) | ✔ (có điều kiện nguồn) |
| Nhãn khớp UI/glossary hiện có | `labels.ts` ↔ UI Spec §12.11 ↔ `AspectBadge/AspectLegend` test; 47/47 test pass ở `fcf9384`/HEAD | ✔ |
| Nhãn cũ không còn trong code/E2E | `git grep` `Vuông chiếu`/`Đối xung` trong `frontend/src`, `e2e`: 0 | ✔ |
| Còn lại | `F6-AC-L5` UNVERIFIED (ảnh viewport 320/375/768/1280 chưa đủ) → KG-F6-09 | **không chặn** (không liên quan thuật ngữ) |
**Nhãn chuẩn (nguyên văn nguồn)** — UI Spec §12.11 và `labels.ts`:
| Loại | Glyph | Góc | Tính chất | Nhãn chuẩn |
|---|:---:|:---:|---|---|
| Conjunction | ☌ | 0° | Neutral (Trung tính) | **Trùng tụ** |
| Sextile | ⚹ | 60° | Harmonious (Hài hòa) | **Lục hợp** |
| Square | □ | 90° | Tense/Challenging (Căng thẳng) | **Vuông góc** |
| Trine | △ | 120° | Harmonious (Hài hòa) | **Tam hợp** |
| Opposition | ☍ | 180° | Tense/Challenging (Căng thẳng) | **Đối đỉnh** |
Quy tắc nguồn: tên khác ("Hợp", "Vuông chiếu", "Đối xung") **chỉ** làm alias trong chú thích; F6 plan §11.1 #14: alias nêu ở **lần xuất hiện đầu** ("Đối đỉnh (còn gọi là Đối xung)"). Plan này **không** tự chọn/sửa nhãn.

### 5.2 Gate khác
| Gate | Trạng thái | Chặn |
|---|---|---|
| G-TITLE: Owner chốt tiêu đề (D-F6.6-01) | **[OWNER] chờ** | chặn điền `title` manifest và đặt tên bài #4, #5, #6, #14 (các bài khác trùng nhau ở cả hai bản — vẫn có thể bắt đầu) |
| G-TERM: thuật ngữ chưa có trong repo (D-F6.6-03) | **[OWNER] chờ** | chặn bài #8, #9, #11, #12 (phần thuật ngữ) |
| G-RULER: trường phái chủ tinh (D-F6.6-02) | **[OWNER] chờ** | chặn bài #9, #12 |
| G-GFM (D-F6-G) | chưa kích hoạt | chỉ chặn phần phụ thuộc GFM (mục 10) |
| G-APPROVE: Owner duyệt nội dung | chưa bắt đầu | chặn DoD cuối |

---

## 6. Content Inventory — 15 Articles

`category` ∈ `fundamentals|planets|signs|houses|aspects`; `order` = 1–3 trong danh mục (thứ tự hiển thị: danh mục → order → slug). `Trạng thái` ban đầu: **Draft** (chưa viết). **Slug khớp prompt** (giữ nguyên). Tiêu đề: cột 4 = prompt F6.6; cột 5 = F6 plan D-F6-C1 — **chờ D-F6.6-01**.

| # | Category | Slug | Tiêu đề (prompt) | Tiêu đề (D-F6-C1 [AD→Owner xác nhận lại]) | Phụ thuộc | Hiện trạng |
|---|---|---|---|---|---|---|
| 1 | fundamentals | `what-is-astrology` | Chiêm tinh học là gì? | giữ | — | **tồn tại** (bài mẫu 293 từ) → cần viết lại |
| 2 | fundamentals | `how-to-read-a-natal-chart` | Cách đọc một bản đồ sao cá nhân | giữ | `labels.ts`; Spec lá số | chưa có |
| 3 | fundamentals | `planets-signs-houses` | Hành tinh, cung hoàng đạo và nhà: Ba thành phần của lá số | giữ | `labels.ts` | chưa có |
| 4 | planets | `sun-moon-rising` | Sun, Moon và Ascendant: Bộ ba nền tảng | Mặt Trời, Mặt Trăng và Cung Mọc (Ascendant): Bộ ba nền tảng | `labels.ts` (Cung Mọc); **G-TITLE** | chưa có |
| 5 | planets | `personal-planets` | Mercury, Venus và Mars: Các hành tinh cá nhân | Sao Thủy, Sao Kim và Sao Hỏa: Các hành tinh cá nhân | `labels.ts`; **G-TITLE** | chưa có |
| 6 | planets | `social-and-outer-planets` | Jupiter, Saturn và các hành tinh thế hệ | Sao Mộc, Sao Thổ và các hành tinh thế hệ | `labels.ts`; **G-TITLE** | chưa có |
| 7 | signs | `zodiac-signs-overview` | Tổng quan 12 cung hoàng đạo | giữ | tên cung từ `labels.ts` | chưa có |
| 8 | signs | `elements-and-modalities` | Bốn nguyên tố và ba tính chất trong chiêm tinh | "…ba tính chất" (rút gọn) — **chênh nhẹ** | **G-TERM** (tên Việt nguyên tố/tính chất) | chưa có |
| 9 | signs | `sign-rulerships` | Chủ tinh của 12 cung hoàng đạo | giữ | **G-RULER** | chưa có |
| 10 | houses | `astrological-houses-overview` | Tổng quan 12 nhà trong bản đồ sao | "Tổng quan 12 nhà" (rút gọn) | Spec: Placidus + Whole Sign | chưa có |
| 11 | houses | `angular-succedent-cadent-houses` | Nhà Angular, Succedent và Cadent | giữ (kèm chú thích Việt) | **G-TERM** | chưa có |
| 12 | houses | `house-rulers` | House Ruler: Cách hiểu chủ tinh của một nhà | "Chủ tinh của nhà (House Ruler)" | **G-RULER**, **G-TERM** | chưa có |
| 13 | aspects | `what-are-astrological-aspects` | Góc chiếu trong chiêm tinh là gì? | "Góc chiếu là gì?" (rút gọn) | F6.0b ✔ | chưa có |
| 14 | aspects | `major-aspects` | Conjunction, Opposition, Square, Trine và Sextile | **Góc chiếu chính: Trùng tụ, Lục hợp, Vuông góc, Tam hợp và Đối đỉnh** | F6.0b ✔; KB-U22/U23; **G-TITLE** | chưa có |
| 15 | aspects | `orbs-and-applying-separating` | Orb, Applying và Separating Aspects | "Orb, Applying và Separating" | F6.0b ✔; Spec §18.3 `isApplying` | chưa có |

**Bài phụ thuộc F6.0b:** #13, #14, #15 (nhãn góc chiếu), #2/#3 (nếu nhắc tới góc chiếu), #1 (nếu liệt kê). **Dàn ý đề xuất ([PROPOSED], tối thiểu — Owner/biên tập duyệt):**
| # | Mở bài + các mục `##` gợi ý | Sự thật AstroViet phải khớp |
|---|---|---|
| 1 | giới thiệu; chiêm tinh học là gì / không là gì; bản đồ sao; cách tiếp cận hiện đại | không hứa dự đoán tất định (F6 plan §11.2) |
| 2 | các thành phần cần nhìn trước; thứ tự đọc (hành tinh → cung → nhà → góc chiếu); ví dụ minh hoạ | chart gồm hành tinh, cung, nhà, góc chiếu, 4 điểm góc (Cung Mọc/Thiên Đỉnh/Cung Lặn/Thiên Để); có thể thiếu nhà khi **không có giờ sinh** (`isHouseDataAvailable=false`) |
| 3 | vai trò của từng thành phần; ví dụ một hành tinh trong cung và nhà | phân biệt tri thức chung ≠ diễn giải cá nhân |
| 4 | Mặt Trời, Mặt Trăng, Cung Mọc; vì sao Cung Mọc cần giờ sinh | Cung Mọc cần giờ sinh (F6 plan §11.2 bước 2) |
| 5 | Sao Thủy/Kim/Hỏa: ý nghĩa biểu tượng | nhãn `labels.ts` |
| 6 | Sao Mộc, Sao Thổ; Thiên Vương/Hải Vương/Diêm Vương là "hành tinh thế hệ"; (Chiron/Lilith/Nút là *điểm*/thiên thể phụ — chỉ nhắc nếu Owner muốn) | engine hỗ trợ 14 thiên thể (xem `labels.ts`) — không khẳng định tính năng khác |
| 7 | 12 cung theo `labels.ts`; nhóm cung | tên cung đúng `labels.ts` |
| 8 | 4 nguyên tố × 3 tính chất; cách mỗi cung thuộc nhóm nào | **dạng bảng 4×3 rất tự nhiên** → khả năng kích hoạt D-F6-G (mục 10) |
| 9 | khái niệm chủ tinh; cổ điển vs hiện đại (nêu rõ có trường phái khác nhau) | sản phẩm **chưa có** tính năng chủ tinh — không hứa |
| 10 | 12 nhà; **Placidus & Whole Sign** là hai hệ AstroViet hỗ trợ; giới hạn vĩ độ ≥ 66,5° với Placidus | Spec: đóng 2 giá trị; Placidus không hội tụ ở vĩ độ ≥ 66,5° |
| 11 | ba nhóm nhà; ví dụ | thuật ngữ Việt chờ G-TERM |
| 12 | chủ tinh của nhà (cách xác định theo cung trên đỉnh nhà) | như #9; không hứa tính năng |
| 13 | khái niệm góc chiếu; 5 góc chính; tính chất hài hòa/căng thẳng không đồng nghĩa tốt/xấu (Domain Spec) | engine chỉ hỗ trợ đúng **5 góc**; nhãn chuẩn |
| 14 | 5 góc: góc độ, nhãn chuẩn, tính chất; alias lần đầu | Trùng tụ 0° · Lục hợp 60° · Vuông góc 90° · Tam hợp 120° · Đối đỉnh 180°; nature theo Domain Spec; **bảng 5×4 rất tự nhiên** → D-F6-G |
| 15 | orb là gì; ví dụ số; applying/separating | công thức `isApplying` (wrap-aware, khoảng cách thu hẹp = applying; bằng nhau = separating — `Natal_Chart_Domain_Specification` §18.3); số orb AstroViet là **tham số cấu hình** (Domain Spec §9.4: ví dụ ±8°/±6° Conjunction…) — bài chỉ nêu "thông lệ phổ biến", **không** hứa giá trị engine nếu Owner chưa duyệt |
**Liên kết nội bộ gợi ý ([PROPOSED]; L5 kiểm tra hợp lệ):** 1→2,3 · 2→3,4,7,10,13 · 3→4,7,10,13 · 4→5,7,10 · 5→4,6,7 · 6→5,13 · 7→8,9 · 8→7,9 · 9→7,12 · 10→11,12 · 11→10 · 12→9,10 · 13→14,15 · 14→13,15 · 15→13,14. Mỗi bài ≥ 1 link ra, không bài mồ côi; mỗi link có văn cảnh (không "xem thêm" trần).

---

## 7. Content Authoring Standards

### 7.1 Checklist áp dụng cho từng bài (theo prompt §5.6)
Đúng slug/title/category · 100% tiếng Việt, thuật ngữ nhất quán · **không `#`** (H1 do trang quản lý), heading bắt đầu `##`, không nhảy cấp, không `#####`/`######` · có mở bài giới thiệu · định nghĩa thuật ngữ quan trọng (tên Việt + tên gốc ở lần đầu) · ví dụ khi hữu ích · không khẳng định thiếu căn cứ/tất định; phân biệt các trường phái · không mâu thuẫn glossary (`labels.ts`), nhãn góc chiếu chuẩn, spec · liên kết nội bộ có chọn lọc (đúng dạng `/knowledge/<slug>`) · **không HTML/script**, không bảng/`~~`/task list (trừ khi D-F6-G được duyệt) · không ảnh trừ khi Owner cung cấp asset (`/knowledge/images/…`, alt bắt buộc) · không trùng lặp không cần thiết giữa bài · nguồn tham khảo theo D-F6.6-05.

### 7.2 Hướng dẫn độ dài — **[PROPOSED, Owner duyệt]**
~500–900 từ/bài (F6 plan §11.2, là giả định; repo/PRD không quy định). KB-P07 (≥ 200 ký tự văn bản) là sàn kỹ thuật, không phải chuẩn biên tập.

### 7.3 Nguồn sự thật và quy trình đối chiếu
Mọi mệnh đề về **hành vi AstroViet** phải khớp: `Astrology_Domain_Specification.md` (§9.4, định nghĩa góc), `Natal_Chart_Domain_Specification.md` (hệ nhà, `isApplying`), `Astrology_Engine_Specification.md`, nhãn `labels.ts`, UI Spec §12.11. Khi một mệnh đề chuyên môn **không** thuộc spec (ví dụ ý nghĩa biểu tượng của hành tinh) ⇒ trình bày như tri thức chiêm tinh phổ biến, **không** như hành vi sản phẩm; không trích dẫn bịa.

### 7.4 Terminology canon — [EXISTING] (seed, nguồn `labels.ts`)
Hành tinh: Mặt Trời, Mặt Trăng, Sao Thủy, Sao Kim, Sao Hỏa, Sao Mộc, Sao Thổ, Sao Thiên Vương, Sao Hải Vương, Sao Diêm Vương, Chiron, Lilith, Nút Bắc, Nút Nam · Cung: Bạch Dương, Kim Ngưu, Song Tử, Cự Giải, Sư Tử, Xử Nữ, Thiên Bình, Thiên Yết, Nhân Mã, Ma Kết, Bảo Bình, Song Ngư · Góc chiếu: 5 nhãn chuẩn (mục 5.1) · Điểm góc: Cung Mọc (Ascendant), Thiên Đỉnh (Midheaven), Cung Lặn (Descendant), Thiên Để (Imum Coeli) · Hệ nhà: Placidus, Whole Sign · Tính chất: Hài hòa, Căng thẳng. **Chưa có trong repo (cần Owner — D-F6.6-03):** tên Việt cho Angular/Succedent/Cadent, 4 nguyên tố, 3 tính chất (Cardinal/Fixed/Mutable), "House Ruler"/"Sign Ruler", Orb/Applying/Separating (có thể giữ tiếng Anh kèm giải thích).
### 7.5 Checklist duyệt thủ công (không thể tự động hoá) — đưa vào Content Approval Tracker
"Hợp" trong từng bài dùng đúng ngữ cảnh (không nhầm với "Lục hợp"/"Tam hợp"; từ "phù hợp" hợp lệ) · alias nhãn cũ chỉ ở lần đầu · không tuyên bố tất định · không mâu thuẫn giữa các bài · số/độ trong ví dụ đúng toán học · lỗi chính tả/dấu tiếng Việt · tóm tắt (`summary`) mô tả đúng thân bài.

---

## 8. KB-U22 / KB-U23 Traceability & Test Plan

**Nguồn gốc [VF]:** F6 plan §9.1 dòng 502–503; D-F6-A5 (KB-U22 phạm vi) và D-F6-A6 (KB-U23 import `ASPECT_TYPE_LABELS` chỉ trong test) — **[REC], chưa duyệt** ⇒ **D-F6.6-06 [OWNER]**. PRD/UI Spec không có ID "KB-U22/U23" (chúng là ID test của F6 plan).
| ID | Yêu cầu gốc (nguyên văn rút gọn) | Nhãn cũ | Nhãn chuẩn | Bài ảnh hưởng | Test case (tách riêng) | Expected | Evidence |
|---|---|---|---|---|---|---|---|
| **KB-U22** | không tiêu đề/tóm tắt/thân bài nào chứa `Vuông chiếu`, `Đối xung` ngoài cụm alias ("còn gọi là"/"hay gọi là"/"tên gọi khác là"); **không** tự kiểm "Hợp" | `Vuông chiếu`, `Đối xung` (+ "Hợp" — checklist) | `Vuông góc`, `Đối đỉnh` | cả 15 (trọng tâm #13–15) | **U22-a** quét `title`+`summary` mọi entry; **U22-b** quét thân 15 bài; **U22-c** alias hợp lệ (fixture đúng: "Đối đỉnh (còn gọi là Đối xung)") → pass; **U22-d** fixture sai (nhãn cũ ngoài alias; alias sai vị trí) → fail đúng chỗ; **U22-e** nhãn cũ trong code fence/inline code theo quy tắc ghi rõ trong test | 0 vi phạm trên bài thật; fixture sai bị bắt | log `vitest`; danh sách cấm khai báo trong test + ghi nguồn UI Spec §12.11 |
| **KB-U23** | `major-aspects` chứa đủ 5 nhãn từ `ASPECT_TYPE_LABELS` | — | 5 nhãn | #14 (+ #13, #15 khi nêu tên) | **U23-a** đủ 5 nhãn lấy **động** từ `ASPECT_TYPE_LABELS` (không hard-code); **U23-b (đúng ngữ cảnh):** mỗi nhãn xuất hiện cùng góc độ tương ứng (0°/60°/90°/120°/180°) trong **cùng heading hoặc cùng mục danh sách/đoạn** — tránh pass khi nhãn chỉ xuất hiện rải rác; **U23-c** #13/#15, khi gọi tên 5 góc, chỉ dùng nhãn chuẩn | đủ 5 nhãn đúng ngữ cảnh | log; ví dụ vị trí trích xuất |
**Quy tắc kiểm thử (prompt §7):** không thay thế hàng loạt máy móc; không chỉ kiểm sự hiện diện; phát hiện nhãn cũ sót; nhãn chuẩn nhất quán F6.0b. **Vị trí [PROPOSED]:** `features/knowledge-base/model/contentTerminology.test.ts` (tái dùng `knowledgeContentService` như KB-U29; import `ASPECT_TYPE_LABELS` từ `@features/chart` **chỉ trong test**). **Trạng thái hiện tại:** chưa có test nào; **KB-U22/U23 không BLOCKED** (nhãn chuẩn đã xác định), chỉ phụ thuộc D-F6.6-06 để chốt phạm vi.

---

## 9. Content Manifest Plan

**Schema giữ nguyên** (`slug,title,category,summary,order,updatedAt`). 
| # | Yêu cầu (prompt §6) | Kế hoạch | Test |
|---|---|---|---|
| 1 | đủ 15 entry | thêm 14 entry; `KNOWLEDGE_MANIFEST.length === 15` | **KB-U03b-1** (mới) so với danh sách slug **hợp đồng phạm vi** hard-code trong test (15 slug mục 6) |
| 2–3 | 1–1 file; không file lạ | `checkContentParity` (đã có) | KB-U04/U05/U27 (tái dùng) |
| 4 | slug duy nhất | `validateManifest` | KB-U02 (có) |
| 5 | đúng 5 danh mục; mỗi danh mục **3** bài | thêm | **KB-U03b-2** (mới): mỗi `KNOWLEDGE_CATEGORIES` có đúng 3 bài (F6 plan KB-U03b "mỗi danh mục có bài" — siết thành 3) |
| 6 | `order` ổn định | 1–3 trong danh mục; comparator đã xác định | KB-U06 (có) + KB-U03b-3: `order` trong mỗi danh mục = {1,2,3} |
| 7 | `updatedAt` thực tế | quy ước X8 [OWNER]; không tương lai | KB-U01 (có) + KB-U03b-4 (≤ ngày hiện tại UTC — kiểm bằng ngưỡng cố định ghi trong test, tránh flake) |
| 8 | `summary` ngắn, đúng nội dung | ≤160 ký tự (đã có); đúng thân bài: **duyệt thủ công** (checklist 7.5) | KB-U01 + tracker |
| 9 | không mâu thuẫn metadata↔nội dung | `title` không lặp `#`; summary duy nhất | KB-U03b-5: title/summary **duy nhất** giữa 15 bài |
| 10 | không placeholder | cấm `TODO`, `Lorem`, `...`, `[placeholder]`, `Draft` trong title/summary/body | KB-U03b-6 (regex gate, ghi rõ giới hạn) |
**`title` chỉ điền sau D-F6.6-01.** Mỗi entry mới đi cùng file `.md`; commit theo danh mục. Manifest chỉ chứa bài **đã có nội dung hoàn chỉnh** (không entry rỗng ở trạng thái Draft chưa có file — parity sẽ fail). Bài ở trạng thái Draft vẫn ở nhánh làm việc, không merge manifest cho tới khi file tồn tại.

---

## 10. GFM Decision Gate — D-F6-G

**Hiện trạng [VF]:** `react-markdown` đã duyệt; `remark-gfm` **chưa**; KB-U29 L4 **fail** nếu bài dùng bảng (hàng phân cách), `~~gạch~~`, `- [ ]` ⇒ tác giả bị buộc dùng Markdown cơ bản.
**Ứng viên cần GFM (dự đoán — phải kiểm bằng bài thật, không mặc định):** #8 (ma trận nguyên tố × tính chất), #9 (cung ↔ chủ tinh), #11 (3 nhóm nhà), #14 (5 góc × độ × tính chất) — mọi trường hợp **có phương án thay thế** bằng danh sách lồng nhau; phương án đó chỉ được coi là hợp lý nếu **không làm giảm độ chính xác/đọc được**.
| Condition | Required Action | Owner Approval | Status |
|---|---|---|---|
| Sau khi có **bản nháp đủ 15 bài**, mọi bài trình bày rõ bằng heading/đoạn/danh sách/blockquote | Giữ `react-markdown`, **không** thêm `remark-gfm`; ghi kết quả đánh giá vào Matrix F6.6 + tracker | Không cần | **PENDING** (chờ bản nháp) |
| ≥ 1 bài thực sự cần bảng/task list/strikethrough để truyền đạt đúng | **Dừng** phần phụ thuộc GFM; **không** đổi `package.json`/lockfile; lập danh sách bài + vị trí + cú pháp + lý do không thay được; tạo **GFM Decision Request** (mục 21.3) | **Bắt buộc, bằng văn bản** | Chưa kích hoạt |
| Owner **duyệt** `remark-gfm` | Thêm đúng 1 dependency (exact), bật plugin có kiểm soát, **thêm lại** test an toàn HTML/URL (bảng không tạo đường tắt XSS), cập nhật L4, `npm audit` trước/sau, đo bundle (chunk Detail) | đã có | — |
| Owner **từ chối** | Viết lại bằng Markdown cơ bản, giữ L4 | — | — |
**Phân tách chặn:** chỉ task "triển khai GFM" bị chặn; mọi task khác (bài không cần bảng, manifest, QA, E2E) tiếp tục. **Tiêu chí "thực sự cần":** thông tin có ≥ 2 chiều so sánh (ví dụ 4×3, 5×4) mà danh sách lồng nhau làm mất khả năng đối chiếu; thẩm định bằng người đọc mục tiêu, không bằng tiện lợi tác giả.

---

## 11. Testing Strategy

Nguyên tắc: **mở rộng test hiện có, không nhân bản**; test class-string không phải bằng chứng CSS; không `waitForTimeout/test.skip/test.only`; không bỏ/giảm assertion để xanh CI.
| Nhóm | Hiện có [EXISTING] | Bổ sung F6.6 [PROPOSED] |
|---|---|---|
| Manifest/validate/parity/service | KB-U01…U09, U27 | KB-U03b-1…6 (mục 9); chạy trên manifest thật 15 bài |
| Content lint | KB-U29 (L1–L6) trên mọi bài thật | tự áp 15 bài; thêm kiểm "không HTML/GFM" đã nằm trong L1/L4 |
| Terminology | — | **KB-U22 (a–e), KB-U23 (a–c)** (mục 8) |
| Renderer / bảo mật | KB-U10–U12, KB-U12b | **test với bài thật:** mọi `a[href^="https"]` trong 15 bài có `target=_blank rel="noopener noreferrer"`; `skipHtml` không đổi; không `dangerouslySetInnerHTML` (gate hiện có) |
| Heading/H1 | KB-U15/U16 | KB-U29 L2/L3 trên 15 bài; **mỗi bài render đúng 1 `h1` (từ trang)** — data-driven |
| Ngày | KB-U34, KB-U44 | không đổi |
| Listing/filter/empty/reset | KB-U13/14/35, KB-E04/E05 | đã dynamic theo manifest; bổ sung kiểm **mỗi danh mục = 3 bài** |
| Prerender | KB-P01–P11 (`validatePrerenderOutput`) | tự chạy trên 15 bài (build thật) |
| Regression F4/F5 | toàn bộ suite | mục 14 |
**Nhiệm vụ đo lại trước khi sửa:** F6.6.1 ghi baseline số file/test/E2E tại HEAD hiện hành (không dùng số lịch sử).

---

## 12. Accessibility & axe Plan

**Công cụ:** `vitest-axe` (jsdom) + QA thủ công; **không** thêm dependency. **Phạm vi:** Listing (`/knowledge` với 15 thẻ), **mỗi** trang bài (15), Not Found.
| Hạng mục | Cách kiểm | Pass/Fail | Ghi nhận |
|---|---|---|---|
| Heading hierarchy, một `h1`, landmark, tên link, nhãn nhóm lọc, alt ảnh (nếu có) | axe + assertion `getByRole` | 0 vi phạm **critical/serious** | log `vitest` |
| axe trên từng bài | test data-driven render 15 bài qua `KnowledgeArticleView` + axe | mỗi bài 0 critical/serious | bảng vi phạm theo bài |
| Bàn phím (Tab order, focus nhìn thấy) | `userEvent` + QA thủ công | thứ tự hợp lý, focus ring thấy được | ghi chú QA |
| Tương phản | **jsdom không tính được** ⇒ thủ công/đo tay với 2 theme (sáng/tối) cho Listing + ≥3 bài đại diện (bài có list, blockquote, link) | AA 4.5:1 chữ thường | số đo ghi vào Matrix; lưu ý token `text-muted` từng đo 2,39:1 ở F6.4 — đã đổi sang `text-secondary` ở ngày bài (**kiểm lại** ở nội dung thật) |
| Responsive/viewport nhỏ | E2E KB-E11/E13 + ảnh 320/375/768/1024/1280 × sáng/tối (Owner/QA cung cấp) | không tràn ngang; 65ch đúng | ảnh vào `evidence/` — **thiếu ảnh ⇒ UNVERIFIED** (bài học F6.0b/KG-F6-14) |
| Empty state | KB-A06 | 0 vi phạm | log |
| Trình đọc màn hình | Narrator (Windows) nếu khả dụng | — | **không kiểm được ⇒ Known Gap, không hạ AC** |
**Phân loại:** critical/serious ⇒ **phải sửa** trước đóng; moderate ⇒ sửa hoặc Known Gap có Owner duyệt; minor ⇒ ghi nhận. **Một lần axe sạch không chứng minh a11y đầy đủ** (prompt §9.3) — AC-36 cần axe **và** QA thủ công **và** bằng chứng viewport.

---

## 13. Playwright E2E Plan (`e2e/knowledge-base.spec.ts` — mở rộng, không viết lại)

**Hiện có [EXISTING]:** 10 test (E01/E03, E04/E05 dynamic, E12, E11, Scenario A–C…). Quy ước: mock `**/api/v1/auth/refresh` (như `interpretation-responsive.spec.ts`), chạy trên dev server (D-F6-T1), slug lấy **từ Listing** (không hard-code), chờ bằng `expect(...).toBeVisible/toHaveCount`.
| Scenario (prompt §9.4) | Kế hoạch | Ghi chú |
|---|---|---|
| 1 Guest listing | `h1` + mô tả; **5 nút danh mục + Tất cả**; **15 thẻ**; mỗi thẻ: tiêu đề/summary/nhãn khớp manifest (nếu import manifest khả thi — X6) hoặc đối chiếu với trang bài; điều hướng nav hoạt động | siết "≥1" → "đúng số bài hợp đồng (15)" **sau** khi đủ bài |
| 2 Lọc | lặp qua 5 danh mục: nút pressed, số hiển thị = số thẻ **= 3**, mọi thẻ đúng nhãn; `Tất cả` khôi phục 15; empty state: không tái hiện được bằng dữ liệu thật (mỗi danh mục có bài) ⇒ **phủ ở unit (KB-U14/U35)**, ghi rõ trong Matrix | không dùng fixture trong E2E |
| 3 Chi tiết | **data-driven cả 15 bài** (vòng lặp nhỏ): URL đúng, `h1` = tiêu đề, đúng 1 `h1`, thứ tự heading hợp lệ, không `console.error` ngoài allowlist refresh, `document.title`/canonical/OG đúng, back-link về `/knowledge`; thêm **kiểm sâu 3 bài** (một mỗi nhóm: có danh sách, có liên kết nội bộ, dài nhất) gồm click liên kết nội bộ → đúng bài đích | độ phủ tránh timeout: không chụp ảnh trong vòng lặp |
| 4 Slug lạ | `/knowledge/khong-ton-tai` → Not Found, `h1`, link về `/knowledge` hoạt động, không crash | đã có (KB-E08) |
| 5 An toàn Markdown | **quét DOM bài thật:** không `script`/`on*`; mọi link ngoài (nếu có) `rel="noopener noreferrer"` + `target=_blank`; không ảnh remote | bài thật không chứa HTML (lint) ⇒ khẳng định hành vi thực |
| 6 SEO/prerender | **không** qua Playwright dev server; dùng `npm run build` (tự kiểm KB-P01–P11 trên 15 bài) + bảng `fetch` trên `vite preview` (`/knowledge`, `/knowledge/`, 15 bài, slug lạ, `sitemap.xml`, `robots.txt`) | D-F6-T1; `/knowledge/<slug lạ>` trên preview = SPA shell 200 (Nginx cần 404 — KG-F6-20) |
**Toàn bộ E2E suite** phải chạy (70 test/10 file hiện tại + test mới); số lượng báo cáo lấy từ `--list`, không dùng số lịch sử. Cấm `waitForTimeout`/`test.skip`/`test.only`/giảm assertion.

---

## 14. F4/F5 Regression Plan

| Hạng mục | Cách xác minh | Evidence |
|---|---|---|
| **Guard thay đổi** | `git diff --stat <SHA đầu F6.6>..HEAD -- frontend/src/features/chart frontend/src/features/auth frontend/src/features/birth-profile frontend/src/shared/api` = rỗng (trừ nếu Owner duyệt); `backend/**` = rỗng; `package.json`/lockfile không đổi | lệnh + kết quả |
| F4 Viewer, Planet/House/Aspect Table, Wheel, responsive, loading/error/empty, `isHouseDataAvailable=false` | toàn bộ unit test `features/chart` (57 file test) + E2E `chart.spec.ts` (17), `chart-list.spec.ts` (8) | log + CI |
| F5 Interpretation | unit `interpretation*` + E2E `interpretation.spec.ts` (12), `interpretation-responsive.spec.ts` (10): sections, `interpretationVersion`, không-interpretation, giờ sinh không rõ, `isHouseDataAvailable=false` không crash | log + CI |
| KB không đổi cách xử lý `ChartResponse` | KB không import `features/chart` ngoại trừ test nhãn (KB-U23, chỉ import test) — kiểm bằng `git grep` | kết quả grep |
| F5 không bị ảnh hưởng bởi markdown deps | chunk `react-markdown` chỉ ở Detail (bundle check F6.4/F6.5) — xác nhận lại | Phụ lục B (F6.3) |
| Toàn bộ suite | `npm test` (≥ baseline), E2E đầy đủ, `npm run build` | log + CI run |
Không yêu cầu tính toán chiêm tinh mới; nếu phát hiện regression ⇒ sửa tối thiểu **trong F6.6** kèm evidence, không bỏ test.

---

## 15. Production Build & CI Plan

| Gate | Lệnh/nguồn [VF scripts] | Kỳ vọng | Ghi chú |
|---|---|---|---|
| Format/Lint/Typecheck | `npm run format:check`, `lint`, `typecheck` | sạch | |
| Unit + integration | `npm test`, `npm run test:coverage` (CI) | ≥ baseline, 0 fail | |
| Build + prerender | `npm run build` (gồm `build:prerender`) | `PRERENDER OK`, KB-P01–P11 đạt trên **15 bài**; có `knowledge.html`, `knowledge/index.html`, 15 `knowledge/<slug>.html`; sitemap = `/knowledge` + 15 bài (không `/`); robots đúng | kiểm bằng inventory `dist/` + sitemap |
| Chunk | Phụ lục B (F6.3): entry không đổi; chunk markdown chỉ Detail | ghi số thật | 15 bài có chunk `.md` riêng |
| Hydration | `npm run verify:hydration` (+ `-- --fallback`), Owner chạy, ≥ 3 bài đa dạng (ngắn/dài/có list/liên kết) | `passed: true` | KG-F6-21; báo cáo cần gắn SHA (hiện `gitSha: null`) |
| CI | `frontend-ci.yml` (trigger path `frontend/**`) chạy cả E2E thật | Success | link run **của commit chạm `frontend/**`** (F6 plan §15.2) |
| Strict build (mô phỏng production) | `PRERENDER_STRICT=true VITE_SITE_URL=https://<tên miền thật hoặc giả hợp lệ>` | pass; domain dành riêng bị từ chối | không bịa domain; domain thật là Owner action (KG-F6-19) |
**Pull request vs release:** CI hiện chạy ở push/PR như nhau; không có pipeline release. Giới hạn đã biết: Node 20 deprecation của actions; cổng hydration không tự động trong CI (D-F6-P2b). Không tạo workflow mới.

---

## 16. Milestone Breakdown — F6.6.1 đến F6.6.8

*Effort S/M/L = ước lượng tương đối chủ quan; tách **Content / Kỹ thuật / QA**; không deadline, không giả định team size. Giả định: bản nháp do Claude Code soạn, Owner duyệt; thời gian chờ duyệt **không** ước lượng.*
| Milestone | Nội dung | Content | Kỹ thuật | QA |
|---|---|---|---|---|
| F6.6.1 Content Readiness & Gate | gate F6.0b, baseline, chốt D-F6.6-01…12, tracker, glossary bổ sung | S | S | S |
| F6.6.2 Fundamentals & Planets | 6 bài | **L** | S | S |
| F6.6.3 Signs & Houses | 6 bài | **L** | S | S |
| F6.6.4 Aspects | 3 bài + KB-U22/U23 + đánh giá GFM | M | S | M |
| F6.6.5 Manifest & Integrity | 15 entry, KB-U03b, parity | S | M | S |
| F6.6.6 KB QA & a11y | axe, E2E, ảnh viewport | — | M | **L** |
| F6.6.7 Regression, Build & CI | F4/F5, full E2E, build, hydration, CI | — | S | **M** |
| F6.6.8 Owner Approval & Closure | duyệt, Matrix, Known Gaps, tracker | S | S | S |

---

## 17. Task-level Implementation Checklist

*(Mỗi task: Mục tiêu · Công việc · Files · Phụ thuộc · AC · Test · Evidence · DoD · Rủi ro — rút gọn.)*

### F6.6.1 — Content Readiness & F6.0b Verification
- **T1.1 Entry & baseline.** git sạch; `npm ci`; `format:check`, `lint`, `typecheck`, `npm test` (ghi số file/test), `npm run build`, `playwright --list`; *tuần tự* vì số liệu làm mốc. Files: không. AC: baseline xanh. Evidence: bảng baseline + SHA. DoD: số thật, không dùng số lịch sử. Rủi ro: máy Windows CRLF (đã `endOfLine: auto`).
- **T1.2 Gate F6.0b.** Xác nhận mục 5.1 bằng lệnh (`git grep` nhãn cũ; test nhãn). Evidence: log. DoD: PASS ghi vào Matrix F6.6. Rủi ro: chỉ ghi nhận L5/KG-F6-09 còn mở.
- **T1.3 Chốt quyết định Owner.** Thu D-F6.6-01…12 (mục 24). Blocked nếu 01/02/03 chưa trả lời ⇒ chỉ viết bài không bị chặn (mục 5.2).
- **T1.4 Content Approval Tracker + glossary bổ sung.** Tạo `archive/sprint-f6/Sprint_F6_Content_Approval_Tracker.md` (mục 21) gồm bảng bài, checklist 7.5, danh sách thuật ngữ cần Owner duyệt. Evidence: file. DoD: 15 dòng ở `Draft`. Rủi ro: trùng tài liệu có sẵn — không (chưa tồn tại).
- **T1.5 Spike E2E import manifest (X6).** Thử import `KNOWLEDGE_MANIFEST` bằng đường dẫn tương đối trong Playwright; không commit spike. Evidence: kết quả. DoD: quyết định dùng hay fallback.

### F6.6.2 — Fundamentals & Planets (bài 1–6)
- **T2.x (mỗi bài một task, commit riêng):** soạn `content/<category>/<slug>.md` theo checklist 7.1 + dàn ý mục 6; **chưa** thêm entry manifest cho tới khi bài sẵn sàng; chạy lint cục bộ. Files: `.md` mới/viết lại (#1). Dependencies: T1.3 (G-TITLE cho #4–6), nhãn `labels.ts`. AC: lint L1–L6 sạch; không nhãn cũ; link nội bộ hợp lệ. Test: KB-U29 (khi có entry), thủ công 7.5. Evidence: commit + trạng thái tracker `Ready for Review`. DoD: Claude Code **không** đặt Approved. Rủi ro: mệnh đề chuyên môn sai; lệch Spec; độn nội dung.
- **T2.7 Review batch 1** (Owner): trạng thái `Approved`/`Changes Requested` ghi vào tracker kèm SHA; thay đổi phản ánh vào file thật.

### F6.6.3 — Signs & Houses (bài 7–12) — như F6.6.2
Phụ thuộc: G-TERM (#8, #11, #12), G-RULER (#9, #12). **Chặn riêng** từng bài; các bài còn lại (#7, #10) có thể làm. #10 phải khớp Spec (Placidus/Whole Sign, giới hạn ≥ 66,5°). **Đánh giá GFM sớm** cho #8/#9/#11 (ghi vào tracker).

### F6.6.4 — Aspects (bài 13–15)
- Soạn 3 bài dùng **đúng 5 nhãn chuẩn**; alias ở lần đầu; #15 khớp `isApplying` (Spec §18.3). **T4.4** triển khai `contentTerminology.test.ts` (KB-U22/U23) — **test-first** (viết fixture sai trước). **T4.5 Đánh giá GFM (D-F6-G)** trên 15 bản nháp ⇒ điền bảng mục 10; Trường hợp B ⇒ tạo Decision Request, dừng phần phụ thuộc.
- AC: KB-U22/U23 xanh; GFM gate có kết luận hoặc BLOCKED. Evidence: log + bảng quyết định. Rủi ro: bảng cần cho #14.

### F6.6.5 — Manifest & Content Integrity
- **T5.1** điền/chuẩn hoá 15 entry (title theo D-F6.6-01, summary ≤160 đúng thân bài, order, `updatedAt`); **T5.2** thêm KB-U03b-1…6; **T5.3** chạy parity + lint + KB-U22/U23 trên manifest thật. Files: `manifest.ts`, test mới (cạnh `types.test.ts`/`validateManifest.test.ts` — mở rộng). AC: KB-AC-33 giữ xanh. Evidence: log. Rủi ro: summary lệch thân bài (kiểm tay).

### F6.6.6 — KB QA & Accessibility
- **T6.1** axe data-driven 15 bài + Listing + Not Found; **T6.2** mở rộng E2E (mục 13); **T6.3** QA bàn phím/focus/contrast 2 theme; **T6.4** ảnh viewport (Owner/QA) cho Listing + ≥3 bài đại diện; **T6.5** kiểm render phần tử thật (list/blockquote/code/link) — đóng KG-F6-16 nếu đạt. AC: KB-AC-36/37/38/39. Evidence: log, CI, ảnh, bảng số đo. Rủi ro: E2E chậm vì 15 bài; thiếu ảnh ⇒ UNVERIFIED.

### F6.6.7 — Regression, Build & CI
- **T7.1** hồi quy F4/F5 (mục 14); **T7.2** toàn bộ E2E; **T7.3** `npm run build` + KB-P (15 bài) + bảng `vite preview`; **T7.4** strict build mô phỏng; **T7.5** Owner chạy `verify:hydration` (+ fallback) sau khi có 15 bài; **T7.6** CI run URL của commit chạm `frontend/**`. AC: KB-AC-40. DoD: tất cả xanh hoặc tồn dư có Owner chấp thuận. Rủi ro: hydration mismatch với nội dung giàu phần tử (list/link).

### F6.6.8 — Owner Approval & Sprint Closure
- **T8.1** tổng hợp 15 bài + trạng thái; **T8.2** Owner duyệt (không còn bài `Draft/Ready/Changes Requested`); **T8.3** hoàn thiện Matrix F6.6, cập nhật Known Gaps (KG-F6-01/02/16 đóng; KG-F6-21 cập nhật; KG-F6-09 nếu có ảnh); **T8.4** đồng bộ F6 plan; **T8.5** mục Closure trong Matrix. **Không** đánh dấu DoD khi còn bài chưa Owner duyệt.

---

## 18. Dependency Graph
```
F6.0b ✔ ─► [G-TITLE/G-TERM/G-RULER: Owner] ─► F6.6.2 ─► F6.6.3 ─► F6.6.4 ─┬─► GFM Gate (D-F6-G)
                                                                            ├─► F6.6.5 Manifest ─► Content QA (F6.6.6) ─► Full Regression (F6.6.7) ─► Closure (F6.6.8)
                                                                            └─► KB-U22/U23
F6.6.1 (baseline/tracker/spike) ─► tất cả
Owner Content Approval ─► Final DoD
Regression + Build + CI ─► Sprint Closure
```
| Quan hệ | Ghi chú |
|---|---|
| F6.0b → Content Authoring | **đã thoả** |
| Content → GFM Gate | gate chỉ chặn phần cần GFM |
| Content → Manifest; Content+Manifest → Content QA | KB-U03b/U22/U23/lint |
| KB QA → Full Regression → Closure | |
| Song song được | T1.4/T1.5 ∥ viết bài không bị chặn; F6.6.2 ∥ F6.6.3 (khác danh mục); soạn E2E ∥ viết bài |

---

## 19. Acceptance Criteria Traceability (nguyên văn F6 plan §8)

| AC | Nội dung nguyên văn | Task | Test/Evidence | Trạng thái |
|---|---|---|---|---|
| **KB-AC-36** | "A11y theo quy ước dự án (axe đã có)" — kiểm chứng: `vitest-axe`, KB-A01…A03 | F6.6.6 | axe 15 bài + Listing + Not Found; QA thủ công; ảnh | PENDING |
| **KB-AC-37** | "Playwright: guest vào danh sách + chi tiết" — KB-E01, E02 | F6.6.6 | E2E CI (15 bài) | PENDING |
| **KB-AC-38** | "Playwright: lọc danh mục" — KB-E04, E05 | F6.6.6 | E2E CI (5 danh mục × 3 bài) | PENDING |
| **KB-AC-39** | "Playwright: slug lạ" — KB-E08 | F6.6.6 | E2E CI | PENDING |
| **KB-AC-40** | "Mọi gate + hồi quy xanh" — Mục 9.4 + CI | F6.6.7 | toàn bộ gate + CI URL | PENDING |
**Bổ sung F6.6 (không phải AC mới; truy vết yêu cầu prompt):** đủ 15 bài (KB-U03b), nhãn chuẩn (KB-U22/U23), manifest parity (KB-AC-33 đã PASS ở F6.2 — giữ), GFM gate (D-F6-G), Owner approval (DoD #16). AC gốc **không bị sửa**.

---

## 20. Evidence Matrix Plan
File: `archive/sprint-f6/Sprint_F6_F6.6_Exit_Criteria_Evidence_Matrix.md` (tạo ở F6.6.8; điền dần).
| Cột | Nội dung |
|---|---|
| Requirement/AC | KB-AC-36…40, KB-U03b/U22/U23, D-F6-G, DoD 1–16 |
| Implementation location | file `.md`, `manifest.ts`, test, spec |
| Test case / command | ID + lệnh |
| Expected result | từ plan |
| **Actual result** | **chỉ điền sau khi chạy** |
| Evidence location | log/CI/ảnh/JSON |
| Status | PASS/FAIL/BLOCKED/UNVERIFIED/N/A |
| Owner approval | với nội dung: link tới Content Approval Tracker |
Quy tắc (F6 plan §15.2): không PASS khi thiếu evidence; số đo layout phải có số thật; CI = URL run của commit chạm `frontend/**`.

---

## 21. Content Owner Approval Workflow

### 21.1 Trạng thái & quy tắc
`Draft → Ready for Review → (Changes Requested ↔ Ready for Review) → Approved`. **Chỉ Owner** được chuyển sang `Approved`; Claude Code chỉ chuyển `Draft → Ready for Review` hoặc `Changes Requested → Ready for Review`. Chuyển trạng thái phải kèm **ngày + commit SHA** của file được duyệt; nếu file đổi sau Approved ⇒ quay về `Ready for Review`. Review theo **5 batch (mỗi danh mục)** (F6.6.2: Fundamentals+Planets; F6.6.3: Signs+Houses; F6.6.4: Aspects). Tracker lưu ngoài manifest (không đổi schema).
### 21.2 Content Approval Tracker (mẫu, tạo ở T1.4; giá trị ban đầu)
| Article | Slug | Content Status | Owner Review | Approval Evidence |
|---|---|---|---|---|
| 1–15 | (15 slug mục 6) | **Draft** (#1: Draft — viết lại) | chưa | — |
**Approval Evidence hợp lệ:** xác nhận bằng văn bản của Owner (bình luận PR/commit/tin nhắn được ghi lại) gắn SHA. Plan **không** coi một file nội bộ tự tạo là phê duyệt.
### 21.3 GFM Decision Request (mẫu — chỉ tạo nếu Trường hợp B)
Bài/vị trí · cú pháp cần · nội dung đề nghị bằng Markdown cơ bản (phương án thay) · vì sao không đủ · tác động (dependency, test bảo mật, bundle) · đề xuất · **chữ ký Owner**.

---

## 22. Risks & Mitigations
| ID | Rủi ro | Mitigation |
|---|---|---|
| R1 | Nội dung chuyên môn sai/mâu thuẫn spec | đối chiếu Spec (7.3), checklist 7.5, Owner duyệt |
| R2 | Nhãn cũ lọt vào bài | KB-U22 + duyệt "Hợp" thủ công |
| R3 | `major-aspects` thiếu/sai nhãn hoặc sai ngữ cảnh | KB-U23 (a–c) |
| R4 | Tiêu đề lệch (X1) | D-F6.6-01 trước khi điền manifest |
| R5 | Bài cần bảng nhưng không có GFM | gate D-F6-G; phương án danh sách lồng nhau; quyết định có kiểm soát |
| R6 | Chủ tinh/nhà: trường phái khác nhau | nêu rõ có nhiều trường phái; D-F6.6-02 |
| R7 | Nội dung giàu phần tử lộ lỗi renderer/hydration chưa từng gặp (bài mẫu chỉ `h2`/`p`) | QA phần tử thật (T6.5), chạy lại cổng hydration |
| R8 | `summary` lệch thân bài (đã từng xảy ra ở bài mẫu) | checklist 7.5 + rà soát Owner |
| R9 | E2E chậm/giòn với 15 bài | vòng lặp nhẹ, deep-check 3 bài, không chụp ảnh trong vòng lặp |
| R10 | Thiếu ảnh viewport ⇒ AC thị giác UNVERIFIED | Owner/QA cung cấp ảnh; không PASS suông |
| R11 | Bài ngắn hơn ngưỡng prerender 200 ký tự | thực tế ≥ 500 từ; KB-P07 kiểm |
| R12 | Windows vs CI Linux (CRLF/đường dẫn) | `.prettierrc` đã `auto`; nguồn evidence chính = CI |
| R13 | Owner chưa duyệt kịp ⇒ không đóng milestone | không rút ngắn DoD; ghi BLOCKED |
| R14 | Bài mẫu hiện hữu bị coi là "đã xong" | X7: viết lại + duyệt như bài khác |
| R15 | Hydration mismatch sau khi thêm 15 bài | chạy lại `verify:hydration`; kill-switch `VITE_ENABLE_HYDRATION=false` |

## 23. Known Gaps (dự kiến — chỉ ghi khi có bằng chứng lúc đóng)
Đóng nếu đạt: **KG-F6-01** (bài mẫu), **KG-F6-02** (chỉ 1 bài), **KG-F6-16** (phần tử Markdown chưa kiểm với bài thật), cập nhật **KG-F6-21** (gate hydration với 15 bài), **KG-F6-09** (nếu có ảnh L5), **KG-F6-14** (ảnh viewport). Giữ nguyên: KG-F6-03/04/05/06 (ảnh, id heading, icon link ngoài, lint regex), KG-F6-19/20/22, KG-F6-08. Có thể phát sinh: nội dung chuyên môn chờ chuyên gia ngoài Owner; Narrator chưa kiểm; thuật ngữ Việt chưa thống nhất giữa các nguồn.

---

## 24. Owner Decisions & Actions Required
### 24.1 Cần trả lời **trước** khi chốt manifest/viết bài bị chặn
| ID | Nội dung | Mặc định [PROPOSED] | Chặn |
|---|---|---|---|
| **D-F6.6-01** | Bộ tiêu đề 15 bài: (A) tiếng Việt chuẩn hoá theo **D-F6-C1** (F6 plan §11.1) hay (B) đúng tiêu đề trong prompt F6.6 (tên Anh)? Gồm cả #8, #10, #13, #15 (độ dài tiêu đề) | **A** (khớp glossary `labels.ts` và quy tắc "không mâu thuẫn glossary"), nhưng cần Owner xác nhận lại vì prompt mới dùng B | title manifest; bài #4–6, #14 |
| **D-F6.6-02** | Chủ tinh: chỉ hệ cổ điển, chỉ hiện đại, hay trình bày cả hai (nêu rõ trường phái)? | cả hai, gắn nhãn trường phái | bài #9, #12 |
| **D-F6.6-03** | Thuật ngữ Việt: Angular/Succedent/Cadent; 4 nguyên tố & 3 tính chất; House/Sign Ruler; Orb/Applying/Separating | đề xuất bảng ở tracker để Owner duyệt | bài #8, #9, #11, #12, #15 |
### 24.2 Cần xác nhận nhưng không chặn khởi động
| ID | Nội dung | Mặc định |
|---|---|---|
| D-F6.6-04 | Hướng dẫn độ dài 500–900 từ (giả định) | đồng ý |
| D-F6.6-05 | Nguồn tham khảo: (A) không có mục nguồn (không trích dẫn bịa); (B) chỉ liên kết nội bộ "Tìm hiểu thêm"; (C) nguồn ngoài do Owner duyệt từng nguồn | **B** |
| D-F6.6-06 | D-F6-A5 (KB-U22 không tự kiểm "Hợp") và D-F6-A6 (KB-U23 import `ASPECT_TYPE_LABELS` chỉ trong test) | đồng ý |
| D-F6.6-07 | Quy trình duyệt + Content Approval Tracker (mục 21), review theo danh mục | đồng ý |
| D-F6.6-08 | Giữ đúng 15 bài (không giảm); giảm số bài chỉ khi Owner đổi scope | giữ 15 |
| D-F6.6-09 | Không dùng ảnh trong bài trừ khi Owner cung cấp asset | không ảnh |
| D-F6.6-10 | CHANGELOG/UI Spec/README ở F6.7; "closure report" F6.6 = mục Closure trong Matrix | đồng ý |
| D-F6.6-11 | E2E so khớp thẻ ↔ manifest bằng import tương đối nếu spike khả thi; nếu không, đối chiếu DOM | đồng ý |
| D-F6.6-12 | `updatedAt` = ngày commit nội dung được Owner duyệt gần nhất | đồng ý |
### 24.3 Owner actions
(1) Trả lời D-F6.6-01/02/03; (2) duyệt nội dung theo batch và ghi Approved vào tracker; (3) cung cấp ảnh viewport (320/375/768/1024/1280 × sáng/tối) cho Listing + ≥3 bài; (4) chạy `npm run verify:hydration` (+ `--fallback`) sau khi có 15 bài; (5) (sau MVP) domain production + `VITE_SITE_URL`/`PRERENDER_STRICT=true` + Nginx (KG-F6-19/20); (6) quyết định GFM nếu Decision Request được tạo.

---

## 25. Definition of Done (prompt §12)
- [ ] 1 Đủ 15 bài đúng slug/category (KB-U03b-1/2).
- [ ] 2 Nội dung nhất quán glossary + nhãn góc chiếu chuẩn (KB-U22/U23 + duyệt thủ công).
- [ ] 3 KB-U22/U23 đã test và có evidence (log).
- [ ] 4 Manifest hoàn chỉnh; parity hai chiều xanh (KB-U04/U05/U27 + KB-U03b).
- [ ] 5 GFM gate xử lý đúng quy trình (kết luận ghi trong Matrix; nếu cần GFM thì có quyết định Owner bằng văn bản).
- [ ] 6 Unit/integration xanh.
- [ ] 7 Axe + QA a11y đạt tiêu chí (mục 12), kèm ảnh viewport.
- [ ] 8 `e2e/knowledge-base.spec.ts` hoàn chỉnh và pass (KB-AC-37/38/39).
- [ ] 9 Regression F4 pass. [ ] 10 Regression F5 pass. [ ] 11 Toàn bộ E2E pass.
- [ ] 12 Build + prerender + sitemap + robots validation pass (15 bài).
- [ ] 13 CI pass (URL run của commit chạm `frontend/**`).
- [ ] 14 Evidence Matrix cập nhật đầy đủ. [ ] 15 Known Gaps cập nhật.
- [ ] 16 **Toàn bộ 15 bài do Owner duyệt (tracker không còn trạng thái nào khác `Approved`).**
Không đánh dấu DoD hoàn tất nếu còn bài chưa Approved, kể cả khi mọi test xanh.

## 26. Sprint Closure Checklist
KB-AC-36…40 có trạng thái + evidence · Matrix F6.6 hoàn tất · Known Gaps cập nhật (đóng/giữ đúng) · Content Approval Tracker đủ 15 `Approved` có SHA · cổng hydration có báo cáo mới (≥3 bài) hoặc fallback ghi rõ · CI URL + `npm run build` log + inventory `dist/` · F6 plan đồng bộ quyết định D-F6.6-* · không có deviation chưa ghi · việc chuyển sang F6.7 (UI Spec/CHANGELOG/README/Closure Report/version) do Owner xác nhận. Tag/merge/version là hành động của Owner.

---

## Phụ lục — Báo cáo kết thúc nhiệm vụ lập plan (prompt §18)
1. **File plan:** `Sprint_F6.6_Content_QA_Implementation_Plan.md` (đề xuất đặt `docs/implementation/`).
2. **Tài liệu/file đã kiểm:** mục 3.1.
3. **F6.0b:** **PASS** cho Content Authoring (mục 5.1); `F6-AC-L5` còn UNVERIFIED (KG-F6-09), không chặn.
4. **F6.5:** hoàn tất; tôi xác minh lại gate chính (build 5 file prerender, `PRERENDER OK`, 175/1.483 test ở `90436e2`, 56/56 test vùng sửa sau đó, lint/typecheck, `--list` 70/10); CI #383 Success (chỉ tóm tắt).
5. **15 bài:** 1 tồn tại (bài mẫu kỹ thuật), **14 chưa có**.
6. **KB-U22/U23:** chưa triển khai; định nghĩa có (F6 plan §9.1); D-F6-A5/A6 chờ Owner.
7. **GFM gate:** **chưa kích hoạt** (không BLOCKED); chờ bản nháp 15 bài.
8. **Owner:** D-F6.6-01…12 (mục 24); actions mục 24.3.
9. **Milestones/dependency:** F6.6.1→…→F6.6.8 (mục 16, 18).
10. **Khác biệt kế hoạch ↔ repo:** X1–X10 (mục 3.3), đặc biệt tiêu đề (prompt vs D-F6-C1), thuật ngữ chưa có glossary, vị trí tài liệu, thời điểm cập nhật tài liệu.
11. **Xác nhận:** chỉ tạo Implementation Plan; **không** soạn bài, không sửa repo, không cài dependency. Các thí nghiệm/lệnh chỉ chạy trên bản clone ngoài repo của Owner.
