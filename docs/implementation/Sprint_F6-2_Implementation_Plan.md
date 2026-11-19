# Frontend Sprint F6.2 — Content Model & Markdown Pipeline — Implementation Plan

## 1. Executive Summary

| | |
|---|---|
| **Dự án / Milestone** | AstroViet — Frontend Sprint F6 (Knowledge Base, Frontend-only MVP) — **F6.2: Content Model & Markdown Pipeline** |
| **Trạng thái tài liệu** | **PLAN v1.0 — chờ Owner review.** Plan-only: không có dòng mã, package, lockfile, cấu hình hay tài liệu kiến trúc nào trong repo bị thay đổi. Không AC nào được ghi PASS |
| **Repo / nhánh đã audit** | `KhongphaiHphuc0705/astroviet`, nhánh `dev`, HEAD `d9453ca` (2026-11-18, "[docs] resolve conflicts between docs & plan"); `dev` = `main` (PR #67) + 3 commit F6 (`58153ed`, `a0cc512`, `d9453ca`) |
| **Ngày lập** | 2026-11-19 |
| **Tên & vị trí đề xuất** | `docs/implementation/Sprint_F6_2_Implementation_Plan.md` — **lệch prompt** (`docs/frontend/Sprint_F6.2_…`) vì mọi plan sprint hiện có (F1–F6, Sprint 0–4) nằm ở `docs/implementation/` và là plan tạm, xoá khi đóng sprint (D-F6 plan §1). Matrix/Registry lưu ở `docs/implementation/archive/sprint-f6/` |

### 1.1 Mục tiêu
Xây nền kỹ thuật có **type safety, deterministic, testable, an toàn** cho Knowledge Base: `types.ts`, `manifest.ts` (+ validation runtime), `contentFiles.ts` (boundary duy nhất của `import.meta.glob`), `knowledgeContentService.ts`, `seo.ts` (pure), `MarkdownRenderer` (+ chính sách URL/ảnh/heading) và bộ test. F6.3–F6.6 dùng service/renderer **mà không biết glob**. **Không** có page, Navbar/Footer, filter UI, prerender, sitemap/robots.

### 1.2 Phát hiện kỹ thuật chính (đã kiểm chứng bằng spike — mục 2.3)
1. **`import.meta.glob` hoạt động trong Vitest** hiện tại (Vitest 4.1.10 + Vite 6.4.3, cấu hình test nằm trong `vite.config.ts` nên dùng chung pipeline Vite): `query: "?raw"` + `import: "default"` trả hàm lazy → `string`; glob rỗng trả `{}` (không lỗi); module chứa glob mock được bằng `vi.doMock`. **Hạn chế quan trọng:** pattern **không dùng được alias** của `tsconfig paths` (Vite báo `Invalid glob … must start with '/' or './'`) → bắt buộc pattern tương đối (`../content/**/*.md` từ `model/`).
2. **`react-markdown@10.1.0` không tự đủ an toàn:** mặc định chỉ "trung hoà" `javascript:`/`data:`/`vbscript:`/`ftp:`/`tel:` thành `href=""` **nhưng vẫn render `<a href="">`**, và để lọt `//evil.com`, `./x`, `#x`, `xmpp:`; ảnh `alt=""` vẫn render. ⇒ cần **allow-list tường minh** (`markdownPolicy.ts`) — hai nhóm rủi ro (raw HTML, URL) được test riêng.
3. **Chunk:** renderer + `react-markdown` đóng gói vào chunk lazy ≈ **120,8 kB raw / 36,9 kB gzip** (đo trên bản spike, trùng ước lượng +121/+37 kB của F6 plan); entry chính tăng ≈ 68 byte (stub `import()`), không chứa mã markdown. Baseline entry thật: **458,85 kB raw / ≈145,5 kB gzip**.
4. **Glob lazy vs eager** có hệ quả thiết kế (listing có phải tải thân bài?, hydration — F6.5): plan đề xuất **glob lazy theo bài + API service bất đồng bộ** (D-F6.2-02) — khác ghi chú C6 của F6.1 ("giữ eager trong chunk lazy"); **không chặn F6.2** vì API service async trong cả hai phương án.
5. **Khác biệt tài liệu cần Owner xác nhận** (mục 3.4 & 18): cấu trúc thư mục (Coding Standards §3.4 vs F6 plan §6.2 vs prompt), phạm vi `seo.ts`, ảnh `https:`, scheme `http:`, code block, dấu phân cách title (`|` vs `—` đang dùng trong repo), `dist/knowledge/index.html` (prompt) vs `dist/knowledge.html` (D-F6-P5b).

### 1.3 Phạm vi giao hàng (một dòng mỗi thành phần)
| Thành phần | Quyết định thiết kế (chi tiết mục 5–12) |
|---|---|
| `types.ts` | `interface` cho object shape, union cho kết quả; không enum (`erasableSyntaxOnly`); `KNOWLEDGE_CATEGORIES` as const (5 giá trị, "Khái niệm cơ bản" đứng đầu) |
| `manifest.ts` | mảng `readonly KnowledgeArticleMetadata[]` thuần dữ liệu; **validation runtime riêng** (`validateManifest`), TypeScript chỉ kiểm shape |
| `contentFiles.ts` | duy nhất chứa `import.meta.glob` (lazy, `?raw`, `default`); factory thuần `createContentRegistry` để test bằng fixture |
| `knowledgeContentService.ts` | factory DI + instance mặc định; 3 phương thức; kết quả discriminated union (`found` / `not-found` / `content-error`) |
| `seo.ts` | hàm thuần, SSR-safe, **không** `og:image`, **không** sitemap/robots, **không** chạm `document` |
| `MarkdownRenderer` | `react-markdown` + `skipHtml` + `components`; chính sách link/ảnh/heading ở `markdownPolicy.ts` (thuần, test trực tiếp) |
| Dependency | **duy nhất** `react-markdown@10.1.0`, đề xuất `--save-exact` |
| Test | fixture độc lập (không phụ thuộc 15 bài), parity hai chiều, security DOM-based, heading, content-lint, SSR-safety (môi trường `node`), boundary tĩnh |

---

## 2. Sprint Context & Current State

### 2.1 Nhãn độ tin cậy
| Nhãn | Nghĩa |
|---|---|
| **[VF]** | Đọc trực tiếp từ repo/tài liệu hoặc lệnh tôi tự chạy trên bản clone |
| **[SPIKE]** | Chạy trong spike tạm `/tmp/fe-f62` (bản sao `frontend/` tại `d9453ca`, có cài `react-markdown@10.1.0` **chỉ trong bản sao**); repo gốc không bị đụng. Task F6.2.0 **lặp lại** các spike này trong repo thật |
| **[AD]** | Quyết định Owner đã duyệt (F6 plan §3.1, Matrix F6.0/F6.1) |
| **[REC]** | Đề xuất của plan này, chưa duyệt |
| **[UNK]** | Chưa biết / chưa kiểm |
| **[PLAN]** | Kết quả dự kiến, chưa thực hiện |

### 2.2 Kết quả F6.0 / F6.1 / F6.0b đã đọc từ repo [VF]
| Milestone | Nguồn | Kết quả dùng cho F6.2 |
|---|---|---|
| **F6.0 Entry Gate** | `archive/sprint-f6/Sprint_F6_F6.0_Exit_Criteria_Evidence_Matrix.md` | Baseline: format/lint/typecheck sạch; **145 file / 1.205 test** pass; build 7,48 s (2.155 modules); Playwright **60 test / 9 file**; `npm audit` tổng **34** (10 moderate, 21 high, **3 critical**) trong đó **production 4** (`axios` high, `zod` high — trực tiếp; `follow-redirects` high, `fast-uri` moderate — gián tiếp). Mọi quyết định D-F6-* đã ghi, kể cả D-F6-A1 |
| **F6.1 Audit & RTM** | `…F6.1_Exit_Criteria_Evidence_Matrix.md` | RTM KB-AC-01…40; **KB-AC-07…12, 14, 20, 22, 23, 25, 33, 34, 35 gán cho F6.2**; xung đột C1–C11 đã chốt (C6: eager trong chunk lazy — "đo đạc tại F6.2"; C7: cấm H1 trong `.md`, test `KB-U16`); Reuse catalog; dependency: chỉ `react-markdown@10.1.0` |
| **F6.0b** | `…F6.0b_…Matrix.md`, commit `58153ed` | 3 nhãn góc chiếu đã đổi (47/47 test liên quan pass — tôi tự chạy lại ở HEAD `a0cc512`); **F6-AC-L5 = UNVERIFIED** (chưa có ảnh viewport) — **không ảnh hưởng F6.2**, vẫn mở |
| **Commit `d9453ca`** | git | Plan F6 lên **v1.2** (D-F6-A1 duyệt; Suspense parity ở cây SSR; `loadEnv`); **D-F6-A2…A6 vẫn là [REC] chưa duyệt**; Matrix đổi tên theo `F6.0`/`F6.0b`/`F6.1`; sửa audit note, CHANGELOG, README |
| Blocker/finding mở ảnh hưởng F6.2 | — | **Không có blocker.** Các điểm lệch tài liệu ở mục 3.4 cần Owner xác nhận nhưng đều có mặc định an toàn |

### 2.3 Spike đã chạy khi lập plan (bằng chứng — [SPIKE], không nằm trong repo)
| # | Kiểm tra | Kết quả |
|---|---|---|
| S1 | Phiên bản | Node 22.23.5; Vite **6.4.3**; Vitest **4.1.10** (`vitest.config` không có — dùng `vite.config.ts`, `environment: jsdom`, `globals: true`, `setupFiles: src/test/setup.ts`) |
| S2 | Glob lazy `?raw`+`default` trong Vitest | `Object.keys` = `["./content/fundamentals/a.md", …]`; gọi loader → đúng chuỗi file (`"## Mot\n\nNoi dung A\n"`); từ thư mục con `model/` pattern `../content/**/*.md` cho key `../content/<category>/<slug>.md` |
| S3 | Glob eager / glob rỗng / mock | `eager:true` trả `string`; glob không khớp → `{}`; `vi.resetModules()+vi.doMock("./files", …)` thay được boundary |
| S4 | Glob dùng alias `@features/...` | **Lỗi** `Invalid glob … It must start with '/' or './'` ⇒ chỉ pattern tương đối |
| S5 | Thứ tự key | Quan sát được theo bảng chữ cái nhưng **không phải cam kết** ⇒ sắp xếp tường minh |
| S6 | Line ending | `.gitattributes` = `* text=auto` (LF trong repo); checkout Windows có thể cho CRLF trong working tree ⇒ chuẩn hoá `\r\n`→`\n` khi nạp nội dung (R-F6.2-10) |
| S7 | `react-markdown@10.1.0` (jsdom + RTL) | Bảng 2.4 |
| S8 | Cài `react-markdown@10.1.0` vào bản sao | `npm i` mặc định ghi `^10.1.0`; **+77 mục** trong `package-lock.json` (gồm chính nó; không đổi phiên bản mục sẵn có; 3 mục đổi cờ `dev/peer`: `@types/estree`, `dequal`, `is-plain-obj`) — **số "+82 gói" ở F6 plan cần đối chiếu lại** khi cài thật |
| S9 | `npm audit --omit=dev` sau cài (bản sao) | **4 lỗ hổng, đúng bộ package cũ** (`axios`, `fast-uri`, `follow-redirects`, `zod`) ⇒ `react-markdown` **không thêm** lỗ hổng production tại ngày đo (kết quả phụ thuộc cơ sở dữ liệu advisory theo ngày) |
| S10 | Bundle (toy `.md` + import lazy tạm) | Mục 12.4 |

### 2.4 Hành vi `react-markdown@10.1.0` đã đo [SPIKE]
| Đầu vào | Kết quả mặc định (không `components`) | Hàm ý thiết kế |
|---|---|---|
| `<script>alert(1)</script>`, `<img onerror>`, `<div onclick>` | **escape thành chữ hiển thị** (không `skipHtml`); với `skipHtml`: **bị loại bỏ hoàn toàn** (`"ok  end"` — mất chữ) | Chọn `skipHtml` (đã duyệt D-F6-05); vì mất nội dung âm thầm ⇒ **content-lint cấm HTML thô trong `.md`** |
| `[t](javascript:…)`, `JaVaScRiPt:`, `data:`, `vbscript:`, `ftp:`, `tel:` | `<a href="">` (vẫn có thẻ `<a>`) | Không dựa vào mặc định; `a` custom render **chữ thuần** khi bị từ chối |
| `//evil.com/x`, `./foo`, `#frag`, `xmpp:a@b` | **giữ nguyên** `href` | Allow-list: chỉ `https:` tuyệt đối và `/knowledge[/<slug>]` |
| `mailto:`, `http:`, `https:` | giữ nguyên | `mailto`/`http` không nằm trong allow-list đề xuất (D-F6.2-05) |
| `![a](data:…)`, `![a](javascript:…)` | `<img src="" alt="a">` | `img` custom: không render ảnh bị từ chối |
| `![](/knowledge/a.png)` | `<img alt="">` (alt rỗng được render) | Bắt buộc alt hữu ích; thiếu ⇒ không render |
| `urlTransform` trả `null` | thẻ `<a>`/`<img>` **không có** `href`/`src` | Vẫn cần `components` để bỏ thẻ |
| `# h1` và setext `Title\n===` | `<h1>`; `###### h6` → `<h6>` | Map h1→h2, h5/h6→h4 + marker (mục 10) |
| fenced ```js / không ngôn ngữ / indented | `pre>code` (class `language-js` khi có); **không có prop `inline`** (v10) | Phân biệt khối bằng `pre`; **bỏ `className` từ info string** |
| bảng `\|a\|b\|`, `~~x~~`, `- [ ]`, URL trần | **chữ thuần** (không GFM); `<https://x>` thành link | Content-lint cấm cú pháp GFM (gate D-F6-G) |
| Bên trong `components.a/img/code` | nhận `node` + `children`; `a` nhận `href` đã qua `urlTransform` | Không dùng `node` |

---

## 3. Source of Truth & Requirement Traceability

### 3.1 Tài liệu đã đọc [VF]
PRD (FR-12/13/14, §5.3); `Frontend_Architecture_Specification.md` (§3 cây thư mục dòng 140–176, §5.1, §12.3 dòng 600–632, §14); `Frontend_Coding_Standards.md` (§3.1–3.4, §4.1–4.2, §6.2/6.4, §13); `Frontend_UI_Specification.md`; F6 plan **v1.2**; Matrix F6.0/F6.0b/F6.1; `package.json`, `vite.config.ts`, `tsconfig.app.json`, `eslint.config.js`, `src/test/*`, `features/chart/{index.ts,model/*}`, `shared/ui/Card`, `shared/config/env.ts`, `.gitattributes`, `public/`; `Sprint_F6_2_Implementation_Plan_Prompt.md`.
**Không tồn tại:** "F6 Opening Decisions / Decision Log" riêng (Decision Log = F6 plan §3.1); `Sprint_F6_Known_Gaps_Registry.md` (chưa tạo — F6.2.6 tạo, đúng D-F6-R); bundle analyzer (không có; không thêm).

### 3.2 Ràng buộc đã duyệt dùng làm constraint [AD]
D-F6-OWN-1/2/3; D-F6-01…15 (Frontend-only, `.md` + `import.meta.glob`, manifest TS, `react-markdown`, 5 danh mục, `65ch`, ảnh, Git-based, `knowledgeContentService`, tách khỏi diễn giải lá số); D-F6-P1/P2/P3/P4/P4b/P5/P5b; D-F6-D1 (`og:image` Known Gap); D-F6-X1 (typography cục bộ, **không dùng** `text-body-md/lg` — token chưa định nghĩa); D-F6-C2 (thứ tự danh mục); D-F6-R (đặt tên tài liệu); D-F6-G (cổng `remark-gfm`).

### 3.3 Traceability yêu cầu → thiết kế → task → test → evidence
| AC (nguồn) | Thiết kế | Task | Test | Evidence (mục 20) |
|---|---|---|---|---|
| **KB-AC-07** metadata hợp lệ (D-F6-04) | `validateManifest` (runtime) + `types.ts` (compile-time) | T1.1, T1.2 | KB-U01 | E-07 |
| **KB-AC-08** manifest→file | `checkContentParity` + `contentRegistry` | T2.1 | KB-U04 | E-08 |
| **KB-AC-09** file→manifest | như trên | T2.1 | KB-U05 | E-09 |
| **KB-AC-10** slug unique, category hợp lệ, thứ tự xác định | `validateManifest`, comparator tường minh | T1.2 | KB-U02, U03, U06 | E-10 |
| **KB-AC-11** content resolution | service + kết quả union | T2.2 | KB-U07, U08, U09a, U09b | E-11 |
| **KB-AC-12** raw HTML an toàn (Arch §12.3) | `skipHtml`, không `rehype-raw`/`dangerouslySetInnerHTML` | T3.3 | KB-U10, U12b | E-12 |
| KB-AC-14 (phần model) đủ 5 danh mục | `KNOWLEDGE_CATEGORIES` | T1.1 | KB-U03 | E-14 |
| KB-AC-20 heading bắt đầu H2 | policy + marker + lint | T3.2–T3.4 | KB-U16 | E-20 |
| KB-AC-22 link nội bộ dùng `Link` | `classifyLinkHref` → `Link` | T3.2, T3.3 | KB-U11 | E-22 |
| KB-AC-23 link ngoài an toàn | allow-list `https:` + `rel` | T3.2, T3.3 | KB-U11 | E-23 |
| KB-AC-25 ảnh có alt, lazy | `classifyImageSrc`, `validateImageAlt` | T3.2, T3.3 | KB-U12, U17 | E-25 |
| **KB-AC-33** parity hai chiều | pure + wiring thật | T2.1 | KB-U04/U05/U27 | E-33 |
| **KB-AC-34** HTML/script/URL | test DOM-based | T3.3 | KB-U10–U12 | E-34 |
| **KB-AC-35** heading hierarchy | renderer + lint | T3.3, T3.4 | KB-U16, U29 | E-35 |
| KB-AC-26/27/28 (nền, **hoàn tất ở F6.5**) | `seo.ts` thuần | T4.1 | KB-U18, U19 | E-26 (một phần) |
| Prompt §6.x / Arch §12.3 "sanitize tại 1 điểm duy nhất" | `MarkdownRenderer` là điểm duy nhất | T3.3, T5.1 | KB-U12b, U30 | E-ARCH |

> AC gốc **không bị sửa**; nội dung AC trong prompt khớp RTM F6.1 (KB-AC-11 trong RTM "khớp manifest" ≈ "content resolution" trong prompt — gộp trong KB-U07).

### 3.4 Mâu thuẫn tài liệu ↔ prompt ↔ repo — **không chọn âm thầm**
| ID | Mâu thuẫn (tài liệu/section) | Đang được duyệt? | Đề xuất (mặc định) | Mức |
|---|---|---|---|---|
| X1 | **Cấu trúc feature.** Prompt §2.3: `components/ services/ data/`. Coding Standards **§3.4: cấm** tự tạo `utils/ helpers/ services/`; khuôn chuẩn `api/ hooks/ components/ model/`. F6 plan §6.2: `model/ ui/ lib/`. **Thực tế repo** (`features/chart`): `api/ hooks/ model/ ui/` | F6 plan §6.2 là [REC] v1.0, chưa [AD] | **`model/` + `ui/` (+ `hooks/` khi có `usePageMeta`)**; không `services/ data/ lib/`. Ghi nhận lệch `components/` (Standards) ↔ `ui/` (repo) cho Owner | D-F6.2-01 |
| X2 | **Glob eager vs lazy.** F6.1 C6: eager trong chunk lazy. Prompt §4.4/6.3: không tải toàn bộ Markdown vào bundle đầu, lazy theo article | C6 "đã chốt" nhưng kèm "đo đạc tại F6.2" | **Lazy theo bài + service async** (lý do mục 8.3) | D-F6.2-02 |
| X3 | **Code block.** F6 plan §6.4: "không hỗ trợ code block". Prompt §6.6: có `Code block` trong danh sách mapping | [REC] | Hỗ trợ tối thiểu `pre>code` (không highlight, bỏ `className`) — rẻ hơn việc mất nội dung | D-F6.2-06 |
| X4 | **Ảnh `https:`.** F6 plan §6.4: `/knowledge/…` **hoặc** `https:`. Prompt §6.7: chỉ đường dẫn quy định, không CDN | [REC] | **Chỉ ảnh cục bộ** `public/knowledge/images/…` | D-F6.2-04 |
| X5 | **Scheme link.** F6 plan §6.4: `http(s)://`. Prompt: allow-list tối thiểu | [REC] | **Chỉ `https:`**; `http:`, `mailto:`, `tel:` không cho | D-F6.2-05 |
| X6 | **Phạm vi `seo.ts`.** F6 plan §6.2: gồm `buildSitemapXml`/`buildRobotsTxt`, và `usePageMeta` ở F6.4. Prompt §5.2/§6.5: không sitemap/robots | [REC] | `seo.ts` F6.2 chỉ metadata + canonical; sitemap/robots/escape-HTML ở F6.5; `usePageMeta` không thuộc F6.2 | không cần quyết |
| X7 | **Dấu phân cách title.** F6 plan §6.5: `"{Tiêu đề} \| AstroViet"`. Repo [VF]: `pages/app/charts/detail/page.tsx:141` dùng `"Lá số sinh — AstroViet"` | [REC] | Theo repo: **`{Tiêu đề} — AstroViet`** | D-F6.2-07 |
| X8 | **Layout prerender.** Prompt §4.5: `dist/knowledge/index.html` làm bản chính. D-F6-P5b [AD]: **`dist/knowledge.html`** chính + `knowledge/index.html` tuỳ chọn (A3 [REC]) | [AD] | Theo D-F6-P5b. Không ảnh hưởng F6.2 (canonical `/knowledge` như nhau) | — |
| X9 | **Closure report.** Prompt F6.2.6: "F6.2 closure report". D-F6-R [AD]: **một** `Sprint_F6_Closure_Report.md` | [AD] | Mục "Closure" nằm trong Matrix F6.2; báo cáo sprint ở F6.7 | — |
| X10 | **`siteUrl` runtime.** F6 plan: `usePageMeta` ở F6.4 nhưng `VITE_SITE_URL`/`resolveSiteUrl` ở F6.5 | — | F6.2 nhận `siteUrl` làm **tham số**; xếp thứ tự F6.4↔F6.5 là handoff HR-6 (không chặn F6.2) | — |
| X11 | **Fixture.** Architecture §3.1 đặt fixtures ở `src/test/`; Coding Standards §13.5 cấm `__tests__/` | — | `src/test/fixtures/knowledge-base/` (coverage đã loại trừ `src/test/**` [VF `vite.config.ts`]) | — |

---

## 4. Scope / Out of Scope

**Trong F6.2:** các thành phần ở mục 1.3; cài `react-markdown@10.1.0`; chính sách URL/ảnh/heading; test unit/integration/security/SSR-safety; kiểm chunk bằng spike tạm; `npm audit`; tài liệu & Evidence Matrix F6.2; Known Gaps Registry (khởi tạo).

**Ngoài F6.2 (không được làm):** Listing/Detail page, route, Navbar/Footer, Category filter UI, search/pagination; viết đủ 15 bài; CMS; Backend/API/DB; Interpretation Engine; SSR/prerender/hydration (`entry-server`, `prerender.mjs`, `hydrate.ts`); sitemap/robots; `og:image`; `VITE_SITE_URL`/`resolveSiteUrl`/`env.ts`; `usePageMeta` (đụng `document.head`); sửa `router.tsx`, `main.tsx`, `MarketingLayout`; thêm bất kỳ dependency nào ngoài `react-markdown@10.1.0` (cấm: `remark-gfm`, `rehype-raw`, `rehype-sanitize`, `gray-matter`, analyzer).

---

## 5. Architecture & Component Design

### 5.1 Boundary và hướng phụ thuộc
```
pages/knowledge (F6.3/F6.4)  ──►  features/knowledge-base (index.ts — public API)
                                       │
   ui/MarkdownRenderer ──► model/markdownPolicy ──► model/types
        │  (react, react-router-dom, react-markdown)        ▲
        │                                                     │
   model/knowledgeContentService ──► model/manifest ──► model/validateManifest ──► model/types
        │                         └─► model/contentFiles (duy nhất `import.meta.glob`) ──► model/contentIntegrity ──► model/types
   model/seo ──► model/types                      (không React, không router, không DOM, không env)
```
Quy tắc (có test tĩnh KB-U30, mục 13): `model/*` **không** import `react`, `react-router-dom`, `react-markdown`, không tham chiếu `window`/`document`/`import.meta.env`; `ui/MarkdownRenderer` **không** import `contentFiles`/`knowledgeContentService`/`manifest` (nhận `isKnownSlug` qua prop); `import.meta.glob` chỉ ở `contentFiles.ts` (+ file test); service **không** chứa render Markdown hay SEO.

### 5.2 Cây thư mục đề xuất ([REC] D-F6.2-01; theo convention thực tế `features/chart`)
```
frontend/src/features/knowledge-base/
  content/                         # .md — tạo ở F6.2 chỉ khi chọn "1 bài mẫu" (D-F6.2-03); đầy đủ ở F6.6
    <category>/<slug>.md           #   category ∈ fundamentals|planets|signs|houses|aspects
  model/
    types.ts                       # category, metadata, article, result types, SLUG_PATTERN, RESERVED_SLUGS
    validateManifest.ts            # validation runtime thuần + comparator thứ tự
    manifest.ts                    # KNOWLEDGE_MANIFEST (dữ liệu thuần)
    contentIntegrity.ts            # contentKeyFor(), normalizeGlobKey(), checkContentParity() — thuần
    contentFiles.ts                # createContentRegistry() (thuần) + contentRegistry (import.meta.glob) — DUY NHẤT
    knowledgeContentService.ts     # createKnowledgeContentService() + knowledgeContentService
    markdownPolicy.ts              # classifyLinkHref / classifyImageSrc / validateImageAlt / normalizeHeadingLevel — thuần
    seo.ts                         # buildKnowledge{List,Article,NotFound}Seo, normalizeSiteUrl — thuần
    *.test.ts                      # co-located (Standards §13.5)
  ui/
    MarkdownRenderer.tsx (+ .test.tsx)
  index.ts                         # barrel tường minh, không `export *` (Standards §4.2)
frontend/src/test/fixtures/knowledge-base/   # manifest/markdown fixtures (hợp lệ + cố ý hỏng)
```
Mỗi file ≤ ~200 dòng (Standards §3.2: tín hiệu tách). Tên file service khớp D-F6-14 (`knowledgeContentService.ts`); thư mục `services/` **không** được tạo.

### 5.3 Quy ước code áp dụng [VF Standards]
`interface` cho object shape, `type` cho union/tuple (§4.1/6.2); discriminated union bắt buộc cho kết quả nhiều hình dạng (§6.4); không enum (`erasableSyntaxOnly`, và §4.1 ưu tiên union); hằng số nhóm `SCREAMING_SNAKE` như repo (`ASPECT_TYPE_LABELS`); named export như repo (`MarketingLayout`); class lỗi theo mẫu `ChartViewModelError` (không parameter property); `import/order` alphabetize; `no-console`; test theo AAA, `it("should … when …")`, query `getByRole` ưu tiên (§13); không `vi.mock` hàm API (không có API ở F6.2).

---

## 6. File Structure — danh sách file F6.2

| File | Hành động | Task |
|---|---|---|
| `frontend/package.json`, `frontend/package-lock.json` | **Modify** (`react-markdown` duy nhất) | T3.1 |
| `features/knowledge-base/model/{types,validateManifest,manifest,contentIntegrity,contentFiles,knowledgeContentService,markdownPolicy,seo}.ts` + 8 `*.test.ts` | **Create** | T1–T4 |
| `features/knowledge-base/ui/MarkdownRenderer.tsx` + test | **Create** | T3.3 |
| `features/knowledge-base/index.ts` | **Create** | T5.1 |
| `features/knowledge-base/model/boundaries.test.ts` (KB-U26, U30, U12b) | **Create** | T5.1 |
| `features/knowledge-base/content/<category>/<slug>.md` | **Create 0 hoặc 1** (D-F6.2-03) | T1.2 |
| `src/test/fixtures/knowledge-base/**` | **Create** | T1.2+ |
| `docs/implementation/archive/sprint-f6/Sprint_F6_F6.2_Exit_Criteria_Evidence_Matrix.md`, `…/Sprint_F6_Known_Gaps_Registry.md` | **Create** | T6.1 |
| `docs/implementation/Sprint_F6_Implementation_Plan.md` | **Modify** (ghi quyết định D-F6.2-*) | T6.1 |
| `frontend/CHANGELOG.md` | **Không đổi ở F6.2** (gộp `[Unreleased]` ở F6.7 theo F6 plan §12) | — |
| **Không đổi** | `backend/**`, `router.tsx`, `main.tsx`, `MarketingLayout`, `env.ts`, `.env.example`, `vite.config.ts`, `tsconfig*`, `eslint.config.js`, `playwright.config.ts`, workflow CI, `features/chart/**` | — |

---

## 7. Content Model Design

### 7.1 Types (`types.ts`)
```ts
export const KNOWLEDGE_CATEGORIES = ["fundamentals","planets","signs","houses","aspects"] as const; // thứ tự hiển thị D-F6-C2
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];
export const KNOWLEDGE_CATEGORY_LABELS: Readonly<Record<KnowledgeCategory, string>>; // "Khái niệm cơ bản","Hành tinh","Cung","Nhà","Góc chiếu"
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RESERVED_SLUGS = ["index","images"] as const;          // [REC] va chạm file/thư mục ở dist (mục 7.4)
export function isKnowledgeCategory(value: string): value is KnowledgeCategory;

export interface KnowledgeArticleMetadata { readonly slug: string; readonly title: string; readonly category: KnowledgeCategory; readonly summary: string; readonly order: number; readonly updatedAt: string /* YYYY-MM-DD */ }
export interface KnowledgeArticleContent  { readonly markdown: string }
export interface KnowledgeArticle extends KnowledgeArticleMetadata, KnowledgeArticleContent {}

export type KnowledgeContentErrorReason = "missing-file" | "load-failed" | "empty-content";
export type KnowledgeArticleResult =
  | { readonly status: "found"; readonly article: KnowledgeArticle }
  | { readonly status: "not-found"; readonly slug: string }
  | { readonly status: "content-error"; readonly slug: string; readonly reason: KnowledgeContentErrorReason; readonly cause?: unknown };
export interface ListArticlesOptions { readonly category?: KnowledgeCategory }
```
Tách rõ 5 khái niệm prompt §6.1: metadata trong manifest · Markdown thô (`KnowledgeArticleContent`) · article đã resolve (`KnowledgeArticle`) · không tồn tại (`not-found`) · lỗi mapping/nạp (`content-error`). Không `any`; type không phụ thuộc Vite (chỉ `contentFiles.ts` biết glob). `slug: string` (không union literal) để slug lạ từ URL là dữ liệu hợp lệ về mặt type và được xử lý ở runtime.

### 7.2 Manifest (`manifest.ts`) và validation runtime (`validateManifest.ts`)
- `export const KNOWLEDGE_MANIFEST: readonly KnowledgeArticleMetadata[] = [ … ]` — dữ liệu thuần, **không** chứa Markdown; thêm bài = thêm 1 entry + 1 file (một PR).
- **Compile-time vs runtime (prompt §6.2):** annotation kiểu chỉ bắt sai shape/danh mục **khi biên dịch** (không bắt slug trùng, ngày không tồn tại, summary dài). Mọi bất biến chạy ở **`validateManifest(entries: readonly unknown[])`** — nhận `unknown` để không tin type — trả `{status:"valid", entries (đã sắp xếp)} | {status:"invalid", issues: ManifestIssue[]}`.
- Quy tắc: `slug` khớp `SLUG_PATTERN`, 1–80 ký tự, không thuộc `RESERVED_SLUGS`, **duy nhất**; `title` trim không rỗng ≤120; `category` ∈ 5 giá trị; `summary` trim không rỗng ≤160 (dùng làm meta description — plan F6 §6.3); `order` số nguyên ≥0; `updatedAt` đúng `YYYY-MM-DD` **và** là ngày lịch hợp lệ (kiểm round-trip UTC, không phụ thuộc múi giờ). Mỗi vi phạm là một `ManifestIssue {code, index, slug?, field?, message}` (mã: `INVALID_ENTRY`, `INVALID_SLUG`, `RESERVED_SLUG`, `DUPLICATE_SLUG`, `INVALID_CATEGORY`, `INVALID_TITLE`, `INVALID_SUMMARY`, `INVALID_ORDER`, `INVALID_UPDATED_AT`) — "phát hiện rõ ràng" (KB-AC-10); gom tất cả lỗi, không dừng ở lỗi đầu.
- **Thứ tự xác định:** comparator `(index danh mục theo KNOWLEDGE_CATEGORIES) → order → slug` (so sánh slug bằng `<`/`>` theo code unit — slug là ASCII — **không** dùng `localeCompare`); không dựa vào thứ tự glob hay filesystem. `order` trùng nhau trong một danh mục được phép (phá hoà bằng slug, ghi tài liệu).
- Service **fail-fast**: tạo service với manifest `invalid` ⇒ ném `KnowledgeContentIntegrityError` (liệt kê `issues`); CI bắt sớm bằng KB-U01–U03 trên manifest thật. Không biến manifest hỏng thành danh sách rỗng.

### 7.3 Manifest mẫu (D-F6.2-03)
Mặc định [REC] **(B): 1 bài mẫu thật** `fundamentals/what-is-astrology.md` (~100–150 từ, nội dung khái quát, không khẳng định về tính năng AstroViet) để F6.3 có dữ liệu xem trình duyệt và để parity/wiring test chạy trên glob thật. Rủi ro: nội dung chưa qua duyệt biên tập → ghi Known Gap (bài mẫu, Owner duyệt/viết lại ở F6.6; version/deploy chỉ khi Owner duyệt). Phương án **(A) manifest rỗng**: không rủi ro nội dung, nhưng test wiring thật rỗng (chỉ còn fixture) và F6.3 phải tự có dữ liệu. Test **không phụ thuộc** lựa chọn: parity/service test dùng fixture; chỉ KB-U27 (wiring thật) tự điều chỉnh (A: chỉ kiểm `{}`/khớp trống).

### 7.4 Đường dẫn nội dung và slug dành riêng
Đường dẫn file **suy ra** `content/<category>/<slug>.md` (không thêm trường `file`) ⇒ parity kiểm đồng thời slug **và** danh mục (file nằm sai thư mục = orphan + missing). Slug dành riêng `index` (va `dist/knowledge/index.html`, D-F6-A3) và `images` (thư mục ảnh `public/knowledge/images/` — tránh xung đột `dist/knowledge/images/` với `images.html` ở `try_files`) — [REC], đưa vào D-F6.2-04.

---

## 8. Markdown Loading Design

### 8.1 `contentFiles.ts` — boundary duy nhất
```ts
// contentIntegrity.ts (thuần)
contentKeyFor(entry): string                 // "content/<category>/<slug>.md"
normalizeGlobKey(rawKey): string | undefined // "../content/x/y.md" -> "content/x/y.md"; sai hình dạng -> undefined
checkContentParity(manifest, keys): { missingFiles: ParityIssue[]; orphanFiles: ParityIssue[]; malformedKeys: string[] }

// contentFiles.ts
export type ContentLoadResult = { status: "ok"; markdown: string } | { status: "missing" } | { status: "error"; cause: unknown };
export interface ContentRegistry { listKeys(): readonly string[] /* đã chuẩn hoá + sắp xếp */; load(category: KnowledgeCategory, slug: string): Promise<ContentLoadResult> }
export function createContentRegistry(glob: Readonly<Record<string, () => Promise<string>>>): ContentRegistry   // thuần, test bằng glob giả/fixture
export const contentRegistry: ContentRegistry = createContentRegistry(
  import.meta.glob<string>("../content/**/*.md", { query: "?raw", import: "default" }),   // literal bắt buộc (Vite phân tích tĩnh)
);
```
- **Lazy (`eager:false`)**: tải **theo từng bài**; `listKeys()` không tải nội dung ⇒ parity test và listing **không** kéo thân bài. Build thật: mỗi `.md` thành chunk riêng [SPIKE]; không có chuỗi Markdown nào trong entry chunk.
- **Không có đường dẫn từ input người dùng:** `load(category, slug)` chỉ nhận cặp đã qua manifest; khoá tra cứu là `contentKeyFor` rồi tra **bằng map chính xác** (`Map`/`Object.hasOwn`), không nối chuỗi vào `import()` động ⇒ không path traversal.
- `missing` (manifest có, file không có) ≠ `error` (loader reject) ≠ `ok` nhưng rỗng (service xử lý `empty-content`). Chuẩn hoá `\r\n`→`\n` tại đây (S6).
- Mọi key không khớp `^content/(fundamentals|planets|signs|houses|aspects)/<SLUG>\.md$` (vd `README.md`, thư mục lồng, chữ hoa) vào `malformedKeys` ⇒ parity **fail** (không bỏ qua im lặng).

### 8.2 Kiểm thử được trong Vitest — [SPIKE] đã xác minh, **task F6.2.0 xác minh lại trong repo**
Chi tiết exit criteria ở T0.2: (1) phiên bản; (2) cấu hình test dùng đúng `vite.config.ts`; (3) glob được transform; (4) `?raw` trả `string`; (5) lazy glob mock được; (6) parity hai chiều chạy được; (7) pattern `../content/**/*.md` ra key đúng hình dạng. **Nếu thất bại** (kỳ vọng thấp): inject glob vào `createContentRegistry` (đã là thiết kế), không đổi kiến trúc production, không dùng `fs` ở runtime trình duyệt.

### 8.3 Vì sao lazy theo bài (D-F6.2-02) — và cái giá
| Tiêu chí | **A. Lazy theo bài (đề xuất)** | B. Eager trong chunk lazy (F6.1 C6) |
|---|---|---|
| Bundle ban đầu | không đổi | không đổi (nếu chỉ route KB import) |
| Trang listing | không tải thân bài | **tải toàn bộ 15 bài** dù không cần (ước ~60–100 kB raw nếu ~4–7 kB/bài — **[UNK]**, chưa có bài thật) |
| Số request | 1 chunk nhỏ/bài | 1 chunk |
| Prerender (F6.5) | `await` trong Node — dễ | đồng bộ |
| **Hydration (F6.5)** | cần nạp **trước** `hydrateRoot` (client render lần đầu phải có sẵn thân bài để khớp HTML server) — `hydrate.ts` `await` preload theo slug (đã đọc từ `pathname`) | tự nhiên đồng bộ |
| API service | **async** | async hoặc sync |
Plan chọn **A** nhưng **API service async ở cả hai** ⇒ đổi sang B sau này chỉ sửa `contentFiles.ts`. Quyết định cuối trước F6.5 (không chặn F6.2). HR-5 ghi yêu cầu preload.

---

## 9. Content Service API Design

```ts
export interface KnowledgeContentService {
  listArticles(options?: ListArticlesOptions): readonly KnowledgeArticleMetadata[];     // sắp xếp xác định; lọc theo danh mục
  getArticleMetadata(slug: string): KnowledgeArticleMetadata | undefined;               // tra manifest, đồng bộ (dùng cho link/SEO/sitemap)
  getArticle(slug: string): Promise<KnowledgeArticleResult>;                             // metadata + nội dung thô
}
export function createKnowledgeContentService(deps: { manifest: readonly unknown[]; registry: ContentRegistry }): KnowledgeContentService; // validate → ném KnowledgeContentIntegrityError nếu invalid
export const knowledgeContentService: KnowledgeContentService;                           // manifest thật + registry thật
export class KnowledgeContentIntegrityError extends Error { readonly code = "KNOWLEDGE_CONTENT_INTEGRITY" as const; readonly issues: readonly ManifestIssue[]; }
```
API nhỏ nhất đáp ứng F6.3 (`listArticles`, `isKnowledgeCategory`), F6.4 (`getArticle`, `getArticleMetadata`), F6.5 (`listArticles()` + `updatedAt` cho sitemap, `getArticle` cho prerender), F6.6 (test nội dung). Không `getByCategory` (trùng `listArticles({category})`), không `hasArticle` (= `getArticleMetadata !== undefined`), không cache (module cache của `import()` đủ cho MVP).
Hành vi:
- `getArticle(slug)`: slug **không** có trong manifest ⇒ `{status:"not-found"}` (không fallback sang bài khác; không đụng registry). Có trong manifest: `registry.load` → `missing` ⇒ `content-error/missing-file`; `error` ⇒ `content-error/load-failed` (+`cause`); markdown rỗng/chỉ khoảng trắng ⇒ `content-error/empty-content`; ngược lại `found`. **Không bao giờ** ném lỗi nạp ra ngoài, **không** trả `null`/rỗng im lặng.
- `listArticles({category})`: category ngoài 5 giá trị (dữ liệu runtime không tin cậy) ⇒ ném `RangeError` (lỗi lập trình), không trả `[]` im lặng; UI dùng `isKnowledgeCategory` để kiểm tra input trước.
- Trả bản sao chỉ-đọc; không phụ thuộc React/router/DOM/`import.meta.env`; không chứa render hay SEO.
- UI (F6.4) **phải** ánh xạ `content-error` sang trạng thái lỗi riêng (kèm `reportError`), **không** dùng chung Not Found (HR-4).

---

## 10. Markdown Renderer Design

### 10.1 API
```ts
export interface MarkdownRendererProps { readonly markdown: string; readonly isKnownSlug: (slug: string) => boolean; readonly className?: string }
export function MarkdownRenderer(props: MarkdownRendererProps): JSX.Element   // <div className=…><Markdown skipHtml components=…>{markdown}</Markdown></div>
```
Không fetch/nạp file, không import service/manifest, không biết route của trang KB. **Cần Router context** (dùng `Link` cho link nội bộ — KB-AC-22): test dùng `renderWithProviders`; prerender dùng `StaticRouter`. Không đặt `h1`; không áp `max-w-[65ch]` (thuộc trang F6.4); class phần tử dùng token sẵn có, **không** `text-body-md/lg` (D-F6-X1).

### 10.2 Cấu hình `react-markdown`
`skipHtml` bật; **không** `rehype-raw`/`remark-gfm`/plugin; `urlTransform` **giữ mặc định** (lớp phòng thủ 1) + `components` allow-list tự viết (lớp 2, độc lập phiên bản — vì hành vi mặc định có thể đổi); **cấm** `dangerouslySetInnerHTML`.

### 10.3 Mapping phần tử
| Phần tử | Hành vi |
|---|---|
| `h1` | render **`<h2>`** + `data-heading-normalized-from="1"` (nội dung không mất; H1 thuộc page — KB-AC-19/20) |
| `h2`,`h3`,`h4` | giữ cấp |
| `h5`,`h6` | render **`<h4>`** + `data-heading-normalized-from="5\|6"` |
| `p`, `ul`, `ol`, `li`, `blockquote`, `hr`, `strong`, `em` | class token hiện có |
| `code` (inline) / `pre>code` (khối) | phân biệt bằng cha `pre` (v10 không có `inline`); **bỏ `className`** từ info string; không highlight (D-F6.2-06) |
| `a` | theo `classifyLinkHref` (10.4) |
| `img` | theo `classifyImageSrc` + `validateImageAlt` (10.5) |
| Phần tử khác | không phát sinh (HTML thô bị `skipHtml`; không GFM) |
Marker `data-heading-normalized-from` và `data-kb-fallback` là **thuộc tính xác định (deterministic)** — giống nhau ở server/client (an toàn cho hydration F6.5) và giúp lint/QA phát hiện vi phạm tác giả mà không cần parser Markdown riêng.

### 10.4 Chính sách link (`classifyLinkHref(rawHref, isKnownSlug)` — hàm thuần)
Kết quả: `internal-article {slug,to}` | `internal-list {to:"/knowledge"}` | `external {href}` | `rejected {reason}`.
1. `undefined`/rỗng/có khoảng trắng hoặc ký tự điều khiển/zero-width (`[\u0000-\u0020\u007f-\u009f\u200b-\u200f\u2028\u2029\ufeff]`) hoặc dài >2048 ⇒ `rejected`.
2. Có scheme (`^[a-z][a-z0-9+.-]*:` không phân biệt hoa/thường): **chỉ `https:`**; parse bằng `new URL`; có `username`/`password` hoặc `hostname` rỗng ⇒ rejected; còn lại ⇒ `external` (`href` chuẩn hoá). Mọi scheme khác (`javascript:`, `data:`, `vbscript:`, `file:`, `blob:`, `http:`, `mailto:`, `tel:`, `ftp:`…) ⇒ `rejected: unsupported-scheme`. Test gồm biến thể hoa/thường, tab/xuống dòng chèn giữa scheme và dạng thực thể (`jav&#x61;script:` — micromark giải mã thực thể trước khi tới renderer; **[UNK] cho đến khi T3.2 chạy**).
3. Bắt đầu `//` hoặc `\` ⇒ rejected (`protocol-relative`); `#…`, `./`, `../`, `?…` ⇒ rejected (`unsupported-relative`; heading không có id nên anchor trong trang vô nghĩa ở MVP).
4. `^/knowledge$` ⇒ `internal-list`; `^/knowledge/(SLUG)$` (không `/` cuối, không query/fragment) ⇒ `isKnownSlug(slug)` ? `internal-article` : `rejected: broken-internal`. Đường dẫn nội bộ khác ⇒ `rejected: unsupported-relative`.
Render: `internal-*` → `<Link to=…>`; `external` → `<a href target="_blank" rel="noopener noreferrer">`; `rejected` → **chữ thuần** `<span data-kb-fallback="link:<reason>">{children}</span>` (giữ nội dung, không có `<a>`). Link nội bộ gãy bị bắt ở **hai lớp**: runtime (chữ thuần) và content-lint (KB-U29) — "manifest-aware", không chỉ kiểm định dạng chuỗi.

### 10.5 Chính sách ảnh
`classifyImageSrc(raw)`: chỉ `^/knowledge/images/<đường dẫn>.(png|jpe?g|webp|avif)$` (không phân biệt hoa/thường; từng đoạn `[A-Za-z0-9][A-Za-z0-9._-]*`; **không** `%`, `?`, `#`, `..`, `//`, `\`) ⇒ `local`; còn lại ⇒ `rejected` (`javascript:`, `data:`, `https:`/remote, protocol-relative, traversal, sai đuôi). Không CDN, không image hosting (D-F6.2-04). `validateImageAlt`: trim không rỗng, ≥3 ký tự, không giống tên file (`\.(png|jpe?g|webp|avif)$`), ≤200 — **heuristic**, không bảo đảm chất lượng mô tả (ghi rõ). Render: `<img loading="lazy" decoding="async" class="max-w-full h-auto">`; src/alt không hợp lệ ⇒ **không render ảnh**, chỉ `<span hidden data-kb-fallback="image:<reason>">`. Ảnh trang trí (`alt=""`) **không hỗ trợ** ở MVP. Kích thước (CLS) và việc file ảnh tồn tại trong `public/knowledge/images/`: **hoãn tới F6.6** (khi có ảnh đầu tiên) — Known Gap.

### 10.6 Chính sách heading
Tác giả: không `#` (H1), bắt đầu `##`, không nhảy cấp (H2→H4), không H5/H6. Renderer chỉ **bảo toàn nội dung** (map ở 10.3); **vi phạm tác giả bị bắt bởi content-lint** (đọc marker + thứ tự cấp trong DOM) ⇒ không âm thầm "sửa" rồi che lỗi.

---

## 11. URL / Image / HTML / Heading Security Policy — tóm tắt kiểm thử

| Rủi ro | Lớp chặn | Test (DOM/render, không chỉ so chuỗi) |
|---|---|---|
| `<script>alert(1)</script>` | `skipHtml` | không có `script` trong container; `window.alert` không bị gọi |
| `<img src=x onerror=alert(1)>` | `skipHtml` | không có `img`/thuộc tính bắt đầu bằng `on*` trong toàn bộ cây |
| HTML thường (`<div onclick>`, `<iframe>`, `<style>`) | `skipHtml` | không phần tử/thuộc tính tương ứng; văn bản kế cận còn nguyên |
| `[x](javascript:…)`, `data:`, `vbscript:`, biến thể | `urlTransform` mặc định **và** `classifyLinkHref` | không `<a>`; chữ còn; `data-kb-fallback` đúng lý do |
| `![x](javascript:…)`, `data:`, remote, `//`, `..` | `classifyImageSrc` | không `<img>` |
| `//evil.com`, `http:`, `mailto:`, `tel:`, `#x`, `./x` | `classifyLinkHref` | không `<a>` (đối chiếu bảng 2.4: mặc định để lọt) |
| Link ngoài hợp lệ | — | có `target="_blank"` **và** `rel="noopener noreferrer"` |
| Link nội bộ tới slug không tồn tại | `isKnownSlug` | chữ thuần; content-lint fail |
| Không `dangerouslySetInnerHTML`/`rehype-raw`/`remark-gfm` | KB-U12b (regex gate tĩnh trên `features/knowledge-base/**`; gọi là "regex gate", **không** phải AST) + review `package.json` diff | — |
Hai nhóm rủi ro **tách test**: (a) HTML thô (cơ chế `skipHtml`), (b) URL link/ảnh (cơ chế policy) — tránh kết luận "không bật `rehype-raw` là đủ an toàn URL" (prompt §6.7).

---

## 12. SEO Helper Design (`seo.ts`)

### 12.1 Hợp đồng (thuần, SSR-safe)
```ts
export const SITE_NAME = "AstroViet";
export interface KnowledgeSeo { readonly title: string; readonly description: string; readonly canonicalUrl?: string; readonly robots?: "noindex"; readonly openGraph: { readonly type: "website" | "article"; readonly title: string; readonly description: string; readonly url?: string } }
export function normalizeSiteUrl(raw: string): string                                  // origin http(s), bỏ "/" cuối, không path/query/hash; sai ⇒ ném KnowledgeSeoError
export function buildKnowledgeListSeo(input: { siteUrl: string }): KnowledgeSeo
export function buildKnowledgeArticleSeo(input: { siteUrl: string; article: KnowledgeArticleMetadata }): KnowledgeSeo
export function buildKnowledgeNotFoundSeo(): KnowledgeSeo                              // robots: "noindex", không canonical
```
- **Không có trường `image`** trong kiểu ⇒ cấu trúc ngăn việc tạo `og:image` giả (D-F6-D1 Known Gap).
- Listing: title `Kiến thức chiêm tinh — AstroViet` (h1 đã duyệt D-F6-U1), description theo câu meta ở F6 plan §14.3 (đề xuất cùng nhóm copy — Owner xác nhận ở F6.3), canonical `${siteUrl}/knowledge`, OG `website`. Article: title `${title} — AstroViet` (D-F6.2-07), description = `summary`, canonical `${siteUrl}/knowledge/${slug}` (không `/` cuối — D-F6-P5), OG `article`, `og:url` = canonical, `og:title` = tiêu đề bài (không hậu tố). Not-found: title `Không tìm thấy bài viết — AstroViet`, `noindex`.
- **Nguồn `siteUrl` và xử lý khi `VITE_SITE_URL` thiếu:** F6.2 **không** đọc env — nhận `siteUrl` là tham số đã chuẩn hoá. `resolveSiteUrl`/`PRERENDER_STRICT`/fallback `http://localhost:5173`/`loadEnv` thuộc F6.5 (D-F6-P4/P4b/A2/A4). Không có domain production được viết cứng ở bất kỳ đâu.
- Không `window`/`document`/`import.meta.env`. Cập nhật `document.head` (`usePageMeta`) và escape thuộc tính HTML khi serialize `<head>` thuộc F6.4/F6.5; `seo.ts` chỉ trả dữ liệu có cấu trúc. SSR-safety được **chứng minh** bằng test chạy `// @vitest-environment node` (KB-U28).

### 12.2 Xung đột thứ tự đã biết
`usePageMeta` (F6.4) cần `siteUrl` còn `resolveSiteUrl` ở F6.5 (X10) → handoff HR-6.

### 12.3 (Mục 12.4 tham chiếu từ 2.3) Đo bundle — spike tạm [SPIKE]
| Biến thể | Entry chunk | Chunk markdown | Nội dung `.md` |
|---|---|---|---|
| Baseline repo (`d9453ca`) | `index-*.js` **458.849 B raw / ≈145,1 kB gz (Vite báo 145,53 kB)**; CSS 50,76 kB / 8,73 kB | — | — |
| `import()` lazy + glob lazy | 458.917 B (+68 B) | `lazyEntry-*.js` **120.783 B raw / 36.924 B gz** (python `gzip -9`) | 1 chunk ~52 B / file |
| `import()` lazy + glob eager | 458.913 B (+64 B) | 120.635 B / 36.867 B gz | gộp vào chunk lazy |
Cả hai: không có chuỗi thư viện markdown (`micromark`/`mdast`/`hast-util`) trong entry. **Giới hạn của spike:** dùng `.md` đồ chơi; kích thước thân 15 bài thật là **[UNK]**. F6.2 **không có route** import renderer ⇒ nếu chỉ build thật, "không nằm trong entry" đúng một cách **tầm thường** (tree-shaking loại bỏ) — vì vậy T5.2 yêu cầu spike lazy tạm để chứng minh không vacuous, và F6.3/F6.4 phải lặp lại với route thật (HR-1).

---

## 13. Test Strategy

### 13.1 Nguyên tắc
Co-located; AAA; một hành vi/`it`; `it("should … when …")`; `getByRole` ưu tiên; fixture độc lập, **không** cần 15 bài; test cố ý-hỏng ("test của test") cho mọi lint/validator; "regex gate" không gọi là AST; mock duy nhất là glob giả qua `createContentRegistry` (DI) — không `vi.mock` hàm nội bộ. Môi trường: mặc định `jsdom`; file thuần-model ghim `// @vitest-environment node` để chứng minh SSR-safety.

### 13.2 Bảng test (ID kế hoạch; ID có sẵn lấy từ F6 plan §9.1)
| ID | File | Nội dung | AC |
|---|---|---|---|
| KB-U01 | `validateManifest.test.ts` | metadata hợp lệ; từng trường sai ⇒ đúng `code`/`index`; ngày không tồn tại (`2026-02-30`), định dạng sai, `summary` 161 ký tự, title rỗng | 07 |
| KB-U02 | như trên | slug trùng; sai hình dạng (`Hoa`, `a--b`, `-a`, ký tự Unicode); `RESERVED_SLUGS` | 10 |
| KB-U03 | `types.test.ts` | đúng 5 danh mục, đúng thứ tự (`fundamentals` đầu); `isKnowledgeCategory` | 10, 14 |
| KB-U04 | `contentIntegrity.test.ts` | manifest có entry thiếu file ⇒ `missingFiles` (fixture) | 08, 33 |
| KB-U05 | như trên | file mồ côi, file sai thư mục, key lạ (`README.md`, lồng thư mục) ⇒ `orphanFiles`/`malformedKeys` | 09, 33 |
| KB-U06 | `validateManifest.test.ts` | cùng tập entry, mọi hoán vị đầu vào ⇒ cùng thứ tự; đảo thứ tự key glob ⇒ cùng kết quả | 10 |
| KB-U07 | `knowledgeContentService.test.ts` | `getArticle` found: metadata + markdown đúng (registry fixture) | 11 |
| KB-U08 | như trên | `listArticles({category})` đúng tập & thứ tự; `RangeError` khi category lạ | 11 |
| KB-U09a | như trên | slug lạ ⇒ `not-found`, **không** gọi registry, không fallback | 11 |
| KB-U09b | như trên | thiếu file ⇒ `content-error/missing-file`; loader reject ⇒ `load-failed`; rỗng ⇒ `empty-content`; **khác** `not-found` | 11 |
| KB-U10 | `MarkdownRenderer.test.tsx` | `<script>`, `<img onerror>`, HTML thường (mục 11) | 12, 34 |
| KB-U11 | `markdownPolicy.test.ts` + renderer | toàn bộ bảng link (mục 11) + `rel`/`target` + `Link` nội bộ điều hướng không reload | 22, 23, 34 |
| KB-U12 | như trên | ảnh: bảng mục 10.5; thiếu/blank alt; `loading`/`decoding` | 25, 34 |
| KB-U12b | `boundaries.test.ts` | regex gate: không `dangerouslySetInnerHTML`, `rehype-raw`, `remark-gfm`, `rehype-sanitize`, `gray-matter` trong `features/knowledge-base/**` | 12 |
| KB-U16 | `MarkdownRenderer.test.tsx` | h1→h2 + marker; h2–h4 giữ; h5/h6→h4 + marker; **không** có `h1` trong output | 20, 35 |
| KB-U17 | như trên | ảnh hợp lệ: `alt` ≠ rỗng, `loading="lazy"` | 25 |
| KB-U18 | `seo.test.ts` (node) | title/description/OG list & article; hậu tố `— AstroViet`; description = summary | 26–27 (nền) |
| KB-U19 | như trên | canonical đúng host, không `/` cuối, không `//`; `normalizeSiteUrl` (hợp lệ/không hợp lệ: path, query, scheme lạ, rỗng) | 28 (nền) |
| KB-U26 | `boundaries.test.ts` | `import.meta.glob` chỉ xuất hiện ở `contentFiles.ts` và file test (regex gate) | 08/09 |
| KB-U27 | `contentFiles.test.ts` | **wiring thật**: key hợp lệ hình dạng; loader trả `string`; parity trên manifest thật (D-F6.2-03 A: tập rỗng khớp rỗng); `createContentRegistry` với glob fixture (dùng `import.meta.glob` ngay trong test trên `src/test/fixtures/...`) | 33 |
| KB-U28 | `*.test.ts` model/seo/policy (`node`) + `MarkdownRenderer.ssr.test.tsx` | import & chạy không cần `window`; `renderToString(<StaticRouter><MarkdownRenderer/>)` không ném | nền F6.5 |
| KB-U29 | `contentLint.test.ts` | lint nội dung (mục 13.3) chạy trên **bài thật** (qua service) **và** trên fixture cố ý hỏng (mỗi quy tắc một fixture) | 20, 22, 25, 35 |
| KB-U30 | `boundaries.test.ts` | regex gate hướng phụ thuộc (mục 5.1) | ARCH |
**Hoãn có chủ đích:** KB-U03 "mỗi danh mục có ≥1 bài" (cần F6.6), KB-U22/U23 nhãn góc chiếu (F6.6), KB-U20/U21 sitemap/robots (F6.5), kiểm file ảnh tồn tại (F6.6). Không dùng `it.skip`; các kiểm tra này được thêm vào đúng milestone.

### 13.3 Content-lint (KB-U29) — quy tắc, chạy bằng render + marker (ưu tiên) và regex (chỉ khi cần)
L1 không HTML thô (regex trên Markdown đã loại fenced/inline code; ngoại lệ autolink `<https://…>`) — cần vì `skipHtml` làm mất chữ im lặng · L2 không H1/H5/H6 (marker `data-heading-normalized-from`) · L3 cấp heading: đầu tiên H2, không nhảy cấp (đọc thứ tự heading trong DOM) · L4 không cú pháp GFM (hàng phân cách bảng, `~~…~~`, `- [ ]`) — kích hoạt cổng D-F6-G thay vì tự thêm `remark-gfm` · L5 không `data-kb-fallback="link:*"` (link gãy/không hỗ trợ) · L6 không `data-kb-fallback="image:*"`. Render dùng `isKnownSlug` lấy từ manifest. **Hạn chế đã biết:** L1/L4 là heuristic regex (có thể sót trường hợp biên) — ghi Known Gap; tests cố ý-hỏng ghi lại phạm vi phát hiện.

### 13.4 Lệnh (xác minh từ `package.json` [VF])
| Mục đích | Lệnh |
|---|---|
| Format | `npm run format:check` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` (`tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit`) |
| Test | `npm run test` (`vitest run --passWithNoTests`); riêng file: `npx vitest run src/features/knowledge-base` |
| Coverage (tham khảo) | `npm run test:coverage` |
| Build | `npm run build` (`tsc … && vite build`) |
| Audit | `npm audit` và `npm audit --omit=dev` (ghi tổng + theo severity + package; **không** `npm audit fix`) |
| Đếm E2E không đổi | `CI=1 npx playwright test --list` (60/9) — PowerShell: `$env:CI=1; npx playwright test --list` |
Tên script thực tế **khớp** DoD của prompt; không thêm script mới ở F6.2.

---

## 14. Acceptance Criteria Traceability Matrix (F6.2)

Trạng thái **toàn bộ = PENDING** (chưa triển khai). Evidence ID tham chiếu mục 20.

| AC | Yêu cầu (rút gọn) | Triển khai | Test | Exit criteria | Trạng thái |
|---|---|---|---|---|---|
| KB-AC-07 | Metadata đủ field, type ≠ runtime validation | `types.ts`, `validateManifest.ts`, `manifest.ts` | KB-U01 | mọi vi phạm có `code`; manifest thật `valid` | PENDING |
| KB-AC-08 | Mỗi entry ↔ đúng một file | `contentIntegrity.ts`, `contentFiles.ts` | KB-U04, U27 | `missingFiles` rỗng trên thật; fixture hỏng bị bắt | PENDING |
| KB-AC-09 | Mỗi file ↔ manifest (không orphan) | như trên | KB-U05, U27 | `orphanFiles`/`malformedKeys` rỗng; fixture hỏng bị bắt | PENDING |
| KB-AC-10 | Slug duy nhất, 5 danh mục, thứ tự xác định, không phụ thuộc glob | `validateManifest.ts` | KB-U02, U03, U06 | hoán vị/đảo key ⇒ cùng kết quả | PENDING |
| KB-AC-11 | Resolve theo slug; unknown rõ ràng; thiếu file ≠ unknown; lọc danh mục | `knowledgeContentService.ts` | KB-U07, U08, U09a/b | ba trạng thái phân biệt; không `null`/rỗng im lặng | PENDING |
| KB-AC-12 | HTML thô không thực thi/không DOM tuỳ ý | `MarkdownRenderer.tsx` | KB-U10, U12b | DOM không có script/`on*`/iframe | PENDING |
| KB-AC-14 (model) | Đủ 5 danh mục | `types.ts` | KB-U03 | đúng 5, đúng thứ tự | PENDING |
| KB-AC-20 | Body bắt đầu H2; H1 xử lý xác định | policy + lint | KB-U16, U29 | không `h1` trong output; vi phạm bị lint bắt | PENDING |
| KB-AC-22 | Link nội bộ dùng `Link` | renderer | KB-U11 | điều hướng không reload (MemoryRouter) | PENDING |
| KB-AC-23 | Link ngoài an toàn | policy + renderer | KB-U11 | chỉ `https:` + `rel` | PENDING |
| KB-AC-25 | Ảnh: alt, lazy, nguồn quy định | policy + renderer | KB-U12, U17 | ảnh xấu không render | PENDING |
| KB-AC-33 | Parity hai chiều chạy được trong môi trường test | `contentIntegrity.ts` | KB-U04/U05/U27 | chạy trong `npm test`; không cần 15 bài | PENDING |
| KB-AC-34 | Test HTML/script/URL (script, img onerror, HTML, js:/data: link & ảnh) | renderer | KB-U10–U12 | đủ 6 nhóm trong prompt §8.4, DOM-based | PENDING |
| KB-AC-35 | Test heading hierarchy | renderer + lint | KB-U16, U29 | H2/H3/H4 đúng; không nhảy cấp ở bài thật | PENDING |
| KB-AC-26/27/28 | **nền** cho title/description/canonical | `seo.ts` | KB-U18, U19 | hàm thuần đúng; **PASS đầy đủ ở F6.5** | PENDING (một phần) |
**Không** thuộc F6.2: KB-AC-13, 15–19, 21, 24, 29–32, 36–40.

---

## 15. Milestone & Task Breakdown

Quy ước effort: S ≈ nửa ngày · M ≈ 1 ngày · L ≈ 1,5–2 ngày — **ước lượng chủ quan**, không có số liệu vận tốc đáng tin ngoài ngày commit. Mỗi task: commit riêng, tiền tố theo lịch sử repo (`[feat]`, `[test]`, `[chore]`, `[docs]`).

### F6.2.0 — Repository & Test Feasibility Verification (S, **bắt buộc đầu tiên**)

**T0.1 — Entry check & baseline**
1. *Objective:* xác nhận trạng thái vào, ghi baseline trước khi sửa. 2. *Approach:* chạy đủ cổng trên `dev` sạch; đo bundle gốc. 3. *Inspect:* Matrix F6.0/F6.1, `package.json`, `vite.config.ts`. 4. *Create/modify:* không (kết quả ghi vào Matrix F6.2 ở T6.1). 5. *Prereq:* Owner duyệt plan. 6. *Steps:* (a) `git status` sạch, HEAD ≥ `d9453ca`; (b) `npm ci`; (c) `npm run format:check`, `lint`, `typecheck`, `test`, `build`; (d) `CI=1 npx playwright test --list`; (e) `npm audit` + `npm audit --omit=dev`; (f) ghi kích thước chunk từ output build (entry, CSS) — dùng đoạn Node ở Phụ lục A; (g) đối chiếu số baseline với F6.0 (145 file/1.205 test, 60/9, audit 34/4). 7. *Tests:* không viết mới. 8. *AC:* tiền đề mọi AC. 9. *Risks:* số liệu trôi (advisory đổi theo ngày; thêm test từ commit khác) ⇒ ghi ngày/commit. 10. *Exit:* baseline xanh hoặc sai lệch được giải thích bằng văn bản. 11. *Evidence:* log lệnh + bảng baseline (ngày, commit SHA).

**T0.2 — Spike `import.meta.glob` trong Vitest (tạm thời, có kiểm soát)**
1. *Objective:* xác minh 7 điểm mục 8.2 **trong repo thật**. 2. *Approach:* tạo thư mục `src/features/knowledge-base/__spike__/` tạm (hoặc một nhánh nháp) gồm 2–3 `.md` giả + 1 test; **xoá toàn bộ trước commit** (không giữ code spike). 3. *Inspect:* `vite.config.ts`, `package.json` (version), `src/test/setup.ts`. 4. *Create:* tạm, không commit. 5. *Prereq:* T0.1. 6. *Steps:* in version Vite/Vitest; test: key hình dạng cho pattern `./…` và `../…`; loader → `string`; glob rỗng → `{}`; `vi.doMock` thay boundary; parity hai chiều trên key thật bằng fixture; thử alias glob (kỳ vọng lỗi — ghi lại); `git status` chứng minh sạch. 7. *Tests:* spike test (không giữ). 8. *AC:* KB-AC-33 (khả thi), R-F6.2-01. 9. *Risks:* khác biệt môi trường Windows (đường dẫn) ⇒ chạy cả trên máy Owner. 10. *Exit:* 7/7 điểm có kết quả; hoặc phương án thay thế được ghi (DI — đã là thiết kế) và Owner được báo. 11. *Evidence:* log vitest + `git status` sạch + đoạn kết luận trong Matrix.

### F6.2.1 — Content Domain Model & Manifest (S)

**T1.1 — `types.ts`**
1. *Obj:* kiểu miền + hằng. 2. *Approach:* mục 7.1; `as const`, interface/union; không enum; `isKnowledgeCategory`. 3. *Inspect:* `features/chart/model/labels.ts` (mẫu hằng/nhãn), Standards §4.1/6.4. 4. *Create:* `model/types.ts`, `model/types.test.ts`. 5. *Prereq:* T0.1. 6. *Steps:* khai báo → test 5 danh mục/thứ tự/guard → typecheck. 7. *Tests:* KB-U03. 8. *AC:* 14 (model), 10. 9. *Risks:* nhãn tiếng Việt lệch glossary ⇒ lấy đúng chuỗi D-F6-U1/PRD FR-12. 10. *Exit:* typecheck + KB-U03 xanh. 11. *Evidence:* log test, diff.

**T1.2 — `validateManifest.ts`, `manifest.ts`, fixture**
1. *Obj:* validation runtime + manifest + fixture. 2. *Approach:* mục 7.2–7.4. 3. *Inspect:* T1.1, F6 plan §6.3. 4. *Create:* `model/validateManifest.ts` (+test), `model/manifest.ts`, `src/test/fixtures/knowledge-base/manifests.ts` (hợp lệ + từng loại hỏng), (D-F6.2-03 B) `content/fundamentals/what-is-astrology.md`. 5. *Prereq:* T1.1. 6. *Steps:* viết test đỏ cho từng `code` → implement → sort → manifest (rỗng hoặc 1 entry) → chạy `validateManifest(KNOWLEDGE_MANIFEST)` trong test. 7. *Tests:* KB-U01, U02, U06. 8. *AC:* 07, 10. 9. *Risks:* ngày/múi giờ ⇒ kiểm round-trip UTC; bài mẫu bị coi là nội dung chính thức ⇒ Known Gap. 10. *Exit:* manifest thật `valid`; fixture hỏng đều bị bắt đúng mã. 11. *Evidence:* log test + danh sách mã vi phạm đã phủ.

### F6.2.2 — Markdown File Registry & Content Service (M)

**T2.1 — `contentIntegrity.ts`, `contentFiles.ts`**
1. *Obj:* boundary glob + parity thuần. 2. *Approach:* mục 8.1. 3. *Inspect:* kết quả T0.2. 4. *Create:* `model/contentIntegrity.ts`, `model/contentFiles.ts` (+2 test), fixture `.md` dưới `src/test/fixtures/knowledge-base/content/**` (gồm bản hỏng cố ý). 5. *Prereq:* T1.1, T1.2. 6. *Steps:* `contentKeyFor`/`normalizeGlobKey`/`checkContentParity` (test trước) → `createContentRegistry` → `contentRegistry` với glob literal → chuẩn hoá CRLF → `load` trả `ok/missing/error`. 7. *Tests:* KB-U04, U05, U27. 8. *AC:* 08, 09, 33. 9. *Risks:* glob không nhận alias (S4) ⇒ pattern tương đối; typing của `import.meta.glob<string>` ⇒ kiểm `typecheck`. 10. *Exit:* hai chiều xanh trên fixture + wiring thật; không có `import()` động nối chuỗi. 11. *Evidence:* log test; `git grep -n "import.meta.glob" -- src` chỉ ở `contentFiles.ts` + test.

**T2.2 — `knowledgeContentService.ts`**
1. *Obj:* public boundary. 2. *Approach:* mục 9. 3. *Inspect:* `ChartViewModelError` (mẫu lỗi). 4. *Create:* `model/knowledgeContentService.ts` (+test). 5. *Prereq:* T2.1. 6. *Steps:* factory + fail-fast → `listArticles` → `getArticleMetadata` → `getArticle` (4 nhánh) → instance mặc định. 7. *Tests:* KB-U07, U08, U09a, U09b. 8. *AC:* 11. 9. *Risks:* dùng chung state giữa test ⇒ factory DI, không singleton trong test. 10. *Exit:* ba trạng thái phân biệt; không gọi registry khi `not-found`. 11. *Evidence:* log test.

### F6.2.3 — Markdown Renderer & Security Policy (L)

**T3.1 — Cài `react-markdown@10.1.0`**
1. *Obj:* thêm dependency duy nhất. 2. *Approach:* `npm i react-markdown@10.1.0 --save-exact` (D-F6.2-08 — repo mặc định dùng `^`; ghim vì đang dựa vào hành vi `urlTransform`/`skipHtml`). 3. *Inspect:* `package.json`, lockfile trước. 4. *Modify:* `package.json`, `package-lock.json` (commit riêng `[chore]`). 5. *Prereq:* Owner duyệt; có thể song song với T1/T2. 6. *Steps:* chạy lệnh → `git diff --stat` chỉ 2 file → đối chiếu số mục lockfile mới (kỳ vọng ≈77 theo spike) → `npm audit --omit=dev` và `npm audit` so với baseline T0.1 (phân biệt mới/cũ). 7. *Tests:* không. 8. *AC:* ràng buộc §4.3/§9. 9. *Risks:* advisory mới ở `react-markdown`/transitive (R-F6.2-09) ⇒ báo Owner, **không** `audit fix`. 10. *Exit:* diff chỉ `react-markdown`; 0 lỗ hổng mới (hoặc được đánh giá bằng văn bản). 11. *Evidence:* `git diff package.json`, bảng audit trước/sau.

**T3.2 — `markdownPolicy.ts` (thuần)**
1. *Obj:* chính sách link/ảnh/heading kiểm thử trực tiếp. 2. *Approach:* mục 10.4–10.6. 3. *Inspect:* bảng 2.4. 4. *Create:* `model/markdownPolicy.ts` (+test). 5. *Prereq:* T1.1. 6. *Steps:* bảng test đầu vào hostile (mục 11 + biến thể hoa/thường/tab/zero-width/thực thể; **ghi lại kết quả thực của `jav&#x61;script:`**) → implement → refine. 7. *Tests:* KB-U11, U12 (phần pure). 8. *AC:* 22, 23, 25, 34. 9. *Risks:* parser URL khác biệt trình duyệt ⇒ allow-list hẹp + `new URL` chỉ cho nhánh `https:`. 10. *Exit:* mọi đầu vào hostile ⇒ `rejected`; chỉ `https:` + `/knowledge[/slug]` + ảnh `/knowledge/images/*` đi qua. 11. *Evidence:* log test + bảng ca đầu vào.

**T3.3 — `MarkdownRenderer.tsx`**
1. *Obj:* renderer + test DOM. 2. *Approach:* mục 10. 3. *Inspect:* `shared/ui/Card|Badge` (class token), `src/test/render.tsx`. 4. *Create:* `ui/MarkdownRenderer.tsx` (+test, +ssr test). 5. *Prereq:* T3.1, T3.2. 6. *Steps:* test đỏ (HTML thô, link, ảnh, heading) → component + `components` map → `data-*` marker → SSR test `StaticRouter` → a11y: axe trên bài mẫu. 7. *Tests:* KB-U10, U11, U12, U16, U17, U28(ssr), axe. 8. *AC:* 12, 20, 22, 23, 25, 34, 35. 9. *Risks:* `Link` cần Router (đã ghi); eslint `jsx-a11y` với `img` custom ⇒ truyền `alt` tường minh; không dùng `text-body-md/lg`. 10. *Exit:* DOM không script/`on*`; không `h1`; link/ảnh xấu ⇒ fallback. 11. *Evidence:* log test + `git grep` không `dangerouslySetInnerHTML`.

**T3.4 — Content-lint (`contentLint.test.ts`)**
1. *Obj:* kiểm tác giả bằng test. 2. *Approach:* mục 13.3. 3. *Inspect:* service, renderer. 4. *Create:* `model/contentLint.test.ts` (+ `.md` fixture hỏng cố ý). 5. *Prereq:* T2.2, T3.3. 6. *Steps:* fixture hỏng cho L1–L6 → test phát hiện → áp dụng lên mọi bài thật qua `knowledgeContentService`. 7. *Tests:* KB-U29. 8. *AC:* 20, 22, 25, 35. 9. *Risks:* regex L1/L4 sót biên ⇒ ghi Known Gap; không gọi "AST". 10. *Exit:* mỗi quy tắc có fixture hỏng bị bắt và bài thật đạt. 11. *Evidence:* log test.

### F6.2.4 — SEO Metadata Foundation (S)

**T4.1 — `seo.ts`**
1. *Obj:* helper thuần SSR-safe. 2. *Approach:* mục 12. 3. *Inspect:* `pages/app/charts/detail/page.tsx:141` (định dạng title hiện hành), F6 plan §6.5/§6.7. 4. *Create:* `model/seo.ts` (+test `node`). 5. *Prereq:* T1.1 (độc lập T2/T3 — song song được). 6. *Steps:* `normalizeSiteUrl` (test trước) → list → article → not-found. 7. *Tests:* KB-U18, U19, U28. 8. *AC:* 26–28 (nền). 9. *Risks:* nhầm phạm vi sang F6.5 ⇒ không `env`, không HTML escape, không sitemap. 10. *Exit:* chạy được trong môi trường `node`; không có trường `image`. 11. *Evidence:* log test; `git grep -nE "window|document|import\.meta\.env" src/features/knowledge-base/model` rỗng.

### F6.2.5 — Integration, Bundle & Quality Verification (M)

**T5.1 — Barrel & boundary tests**
1. *Obj:* public API + khoá kiến trúc. 2. *Approach:* `index.ts` re-export tường minh (service, types, hằng, `MarkdownRenderer`, `seo` builders); test tĩnh. 3. *Inspect:* `features/chart/index.ts` (mẫu barrel). 4. *Create:* `index.ts`, `model/boundaries.test.ts`. 5. *Prereq:* T1–T4. 6. *Steps:* barrel → KB-U26, U30, U12b. 7. *Tests:* KB-U12b, U26, U30. 8. *AC:* ARCH, 12. 9. *Risks:* **barrel kéo renderer vào chunk đầu** nếu code không-lazy import barrel (F6.5 Navbar không cần barrel) ⇒ T5.2 + HR-1. 10. *Exit:* regex gate xanh; không `export *`. 11. *Evidence:* log test.

**T5.2 — Bundle verification (spike tạm)**
1. *Obj:* chứng minh `react-markdown` chỉ ở chunk lazy, đo thật. 2. *Approach:* nhánh/bản sao tạm thêm `void import("…/knowledge-base")` (hoặc `React.lazy`) vào `main.tsx` **chỉ trong bản tạm**; build; đo (Phụ lục A); **huỷ bản tạm**. 3. *Inspect:* `dist/index.html`, `dist/assets`. 4. *Create:* không (kết quả vào Matrix). 5. *Prereq:* T5.1. 6. *Steps:* (a) build baseline; (b) build tạm; (c) liệt kê entry, chunk chứa `micromark|mdast|hast-util`, chunk chứa nội dung `.md`; (d) tính raw/gzip; (e) `git status` sạch. 7. *Tests:* script/lệnh, không commit. 8. *AC:* §7.2 prompt, R-F6.2-02. 9. *Risks:* đo vacuous (không route) ⇒ bắt buộc dùng import lazy tạm. 10. *Exit:* entry **không** chứa markdown lib; số raw/gzip thực được ghi (không chỉ "+37 kB"); chunk thân bài tách đúng. 11. *Evidence:* bảng trước/sau + lệnh + `git status`.

**T5.3 — Quality gates & audit cuối**
1. *Obj:* DoD kỹ thuật. 2. *Approach:* chạy toàn bộ. 3. *Steps:* `format:check`, `lint`, `typecheck`, `test` (so 145 file/1.205 test + file/test mới), `build`, `CI=1 npx playwright test --list` (60/9 không đổi), `npm audit` + `--omit=dev`; `git diff --stat` xác nhận không đụng `backend/**`, `router.tsx`, `main.tsx`, `vite.config.ts`, CI. 4. *Exit:* tất cả xanh; audit có số liệu thật (không tuyên bố "sạch"). 5. *Evidence:* log + bảng.

### F6.2.6 — Documentation & Milestone Closure (S)

**T6.1 — Tài liệu & bằng chứng**
1. *Objective:* đóng milestone có evidence. 2. *Create:* `archive/sprint-f6/Sprint_F6_F6.2_Exit_Criteria_Evidence_Matrix.md` (mục "Closure notes" thay cho báo cáo riêng — X9), `Sprint_F6_Known_Gaps_Registry.md` (khởi tạo, chỉ gap có bằng chứng). 3. *Modify:* F6 plan (ghi D-F6.2-01…08 đã duyệt/không). 4. *Steps:* điền từng AC: file, test, lệnh, kết quả **thật**; PASS chỉ khi có evidence; ghi handoff F6.3. 5. *Exit:* mọi AC trong mục 14 có trạng thái + bằng chứng; Known Gaps khớp thực tế. 6. *Risks:* ghi PASS sớm ⇒ quy tắc §15.2 F6 plan.

---

## 16. Dependency Graph

```
T0.1 ─► T0.2 ─┬─► T1.1 ─► T1.2 ─► T2.1 ─► T2.2 ───────────────┐
              │      │                     │                  ├─► T3.4 ─┐
              │      ├─► T3.2 ─────────────┼────────────┐     │         │
              │      │                     │            ▼     │         │
              │      └─► T4.1 (song song)  │   T3.1 ─► T3.3 ──┘         ├─► T5.1 ─► T5.2 ─► T5.3 ─► T6.1
              └───────────────────────────►│  (T3.1 song song với T1/T2)│
                                           └────────────────────────────┘
```
| Loại | Task |
|---|---|
| **Blocking / tuần tự** | T0.1 → T0.2 → T1.1 → T1.2 → T2.1 → T2.2; T3.2 → T3.3 → T3.4; T5.1 → T5.2 → T5.3 → T6.1 |
| **Song song được** | T3.1 (cài dependency) ∥ T1–T2; T4.1 ∥ T2–T3 (chỉ cần T1.1) |
| **Optional** | gộp test ssr vào cùng file renderer; phương án DI cho glob chỉ khi T0.2 thất bại |
| **Liên quan Security tests** | gắn trong T3.2/T3.3/T3.4 (không phải task riêng) |

---

## 17. Risk Register

*Probability/Impact là **đánh giá sơ bộ ban đầu**, không phải số liệu đã xác minh.*

| Risk ID | Risk | Prob. | Impact | Mitigation | Verification |
|---|---|---|---|---|---|
| R-F6.2-01 | `import.meta.glob` không hoạt động trong Vitest | **Thấp** (đã [SPIKE] OK; alias glob lỗi — đã tránh) | High | T0.2 lặp trong repo; `createContentRegistry` DI | T0.2, KB-U27 |
| R-F6.2-02 | Markdown lib làm tăng bundle đầu / barrel kéo vào entry | TB | TB | chỉ route lazy import; đo bằng spike lazy | T5.2, HR-1 (đo lại ở F6.3/F6.4) |
| R-F6.2-03 | URL không an toàn trong Markdown | TB | High | allow-list `https:` + `/knowledge/*`; 2 lớp (urlTransform + policy) | KB-U11/U12 |
| R-F6.2-04 | HTML thô/handler gây XSS | Thấp–TB | High | `skipHtml`; không `rehype-raw`/`dangerouslySetInnerHTML` | KB-U10, U12b |
| R-F6.2-05 | Manifest ↔ file lệch | TB | High | parity hai chiều + key hình dạng chặt | KB-U04/U05/U27 |
| R-F6.2-06 | Link nội bộ gãy | TB | TB | runtime fallback + content-lint manifest-aware | KB-U11/U29 |
| R-F6.2-07 | Heading sai cấp/nhiều H1 | TB | TB | map + marker + lint | KB-U16/U29 |
| R-F6.2-08 | SEO helper không SSR-safe | Thấp | TB | hàm thuần; test `node` | KB-U18/U19/U28 |
| R-F6.2-09 | `react-markdown`/transitive có advisory | Thấp (S9: 0 mới) | TB–High | ghim `--save-exact`; audit trước/sau; không `audit fix` | T3.1, T5.3 |
| R-F6.2-10 | CRLF (checkout Windows) làm sai regex/lint/test | TB | Thấp–TB | chuẩn hoá `\r\n` ở registry; lint dùng `\r?\n` | KB-U27 |
| R-F6.2-11 | Glob lazy ⇒ hydration (F6.5) cần preload | TB | TB | API async hiện tại; HR-5; có thể đổi sang eager chỉ trong `contentFiles.ts` | F6.5 gate |
| R-F6.2-12 | Content-lint regex (L1/L4) sót biên | TB | Thấp | fixture hỏng cố ý; ghi Known Gap; không gọi "AST" | KB-U29 |
| R-F6.2-13 | Bài mẫu chưa duyệt lọt production | Thấp | TB | Known Gap; Owner kiểm soát deploy/version; hoặc chọn (A) manifest rỗng | Registry |
| R-F6.2-14 | Số liệu gói/kích thước lệch ước lượng cũ ("+82 gói") | Chắc chắn | Thấp | đo thật lúc cài; ghi chênh lệch | T3.1 |
| R-F6.2-15 | API/hành vi `react-markdown` đổi ở phiên bản khác | Thấp | TB | ghim phiên bản; policy độc lập mặc định | KB-U11/U12 |

---

## 18. Open Questions / Owner Decisions

**Không có quyết định chặn việc bắt đầu F6.2.0–F6.2.2.** Các mục dưới có mặc định [REC]; nên xác nhận khi duyệt plan (đặc biệt 01, 03, 04, 05, 06) trước F6.2.1/F6.2.3.

| ID | Nội dung | Mặc định [REC] | Thời điểm cần | Chặn? |
|---|---|---|---|---|
| D-F6.2-01 | Cấu trúc `model/` + `ui/` (không `services/ data/ lib/`), ghi nhận lệch Standards `components/` ↔ repo `ui/` (X1) | đồng ý | trước T1.1 | Không (đổi tên thư mục rẻ) |
| D-F6.2-02 | Glob **lazy theo bài** + service async (thay vì eager trong chunk, C6) | lazy | trước F6.5 | Không |
| D-F6.2-03 | Manifest F6.2: **(B)** 1 bài mẫu thật hay **(A)** rỗng | B (Known Gap) | trước T1.2 | Không |
| D-F6.2-04 | Ảnh chỉ cục bộ `public/knowledge/images/` + slug dành riêng `index`,`images` (siết F6 plan §6.4) | đồng ý | trước T3.2 | Không |
| D-F6.2-05 | Link ngoài chỉ `https:`; `http:`/`mailto:`/`tel:` không cho | đồng ý | trước T3.2 | Không |
| D-F6.2-06 | Hỗ trợ tối thiểu code block/inline code (không highlight) | đồng ý | trước T3.3 | Không |
| D-F6.2-07 | Title `{Tiêu đề} — AstroViet` (theo repo) thay `\|` của F6 plan | đồng ý | trước T4.1 | Không |
| D-F6.2-08 | `react-markdown` ghim `--save-exact` | đồng ý | T3.1 | Không |
| (kế thừa) | D-F6-A2…A6 vẫn [REC] chưa duyệt; không ảnh hưởng F6.2 | — | F6.5/F6.6 | Không |
**Có thể quyết định trong triển khai:** giới hạn độ dài `title`/`slug`; ngưỡng `validateImageAlt`. **Có thể hoãn sau F6.2:** heading id/anchor trong trang; ảnh remote/CDN (Arch §12.3 chừa chỗ); `og:site_name`/`og:locale`; `usePageMeta`.

---

## 19. Definition of Done (F6.2)

- [ ] File theo mục 6 tồn tại, đúng convention đã xác minh; không `services/ data/ lib/`.
- [ ] `validateManifest` + manifest `valid`; thứ tự xác định; fixture hỏng bị bắt.
- [ ] `contentFiles.ts` là nơi duy nhất có `import.meta.glob` (regex gate); parity hai chiều xanh (fixture + wiring thật).
- [ ] Service hoạt động độc lập UI; `not-found` ≠ `content-error`; không `null`/rỗng im lặng.
- [ ] `MarkdownRenderer` dùng `react-markdown@10.1.0`; `skipHtml`; không `dangerouslySetInnerHTML`/`rehype-raw`/`remark-gfm`.
- [ ] Chính sách URL/ảnh/heading đã triển khai và có test DOM-based; link nội bộ gãy bị phát hiện (runtime + lint).
- [ ] `seo.ts` thuần, SSR-safe (test `node`), không `og:image`, không sitemap/robots.
- [ ] KB-AC-07…12, 14 (model), 20, 22, 23, 25, 33, 34, 35 có evidence xanh.
- [ ] `npm run lint` · `npm run typecheck` · `npm run test` xanh; `format:check`, `build` xanh; E2E `--list` vẫn 60/9.
- [ ] `npm audit` (+`--omit=dev`) **đã chạy**, ghi tổng theo severity + package; phân biệt mới/cũ; không `audit fix`.
- [ ] `package.json` diff chỉ thêm `react-markdown`; lockfile đồng bộ.
- [ ] Spike bundle chứng minh `react-markdown` không ở entry (số raw/gzip thật).
- [ ] Không thay đổi Backend, `router.tsx`, `main.tsx`, `vite.config.ts`, CI.
- [ ] Matrix F6.2, Known Gaps Registry, handoff F6.3 đã viết; không AC nào PASS thiếu bằng chứng.

---

## 20. Expected Evidence (không tạo bằng chứng giả — các ô dưới là *kỳ vọng thu thập*)

| Evidence | Test file / case | Lệnh | Build/Bundle/Audit/Arch |
|---|---|---|---|
| E-07 | `validateManifest.test.ts` / KB-U01 | `npx vitest run src/features/knowledge-base/model/validateManifest.test.ts` | — |
| E-08/09/33 | `contentIntegrity.test.ts`, `contentFiles.test.ts` / KB-U04, U05, U27 | `npx vitest run …/model` | `git grep -n "import.meta.glob" -- src` |
| E-10 | `validateManifest.test.ts`, `types.test.ts` / KB-U02, U03, U06 | như trên | — |
| E-11 | `knowledgeContentService.test.ts` / KB-U07–U09b | như trên | — |
| E-12/34 | `MarkdownRenderer.test.tsx` / KB-U10–U12 | `npx vitest run …/ui` | `git grep -nE "dangerouslySetInnerHTML|rehype-raw|remark-gfm" -- src/features/knowledge-base` (rỗng) |
| E-20/35 | `MarkdownRenderer.test.tsx`, `contentLint.test.ts` / KB-U16, U29 | như trên | — |
| E-22/23/25 | `markdownPolicy.test.ts`, renderer / KB-U11, U12, U17 | như trên | — |
| E-26 (nền) | `seo.test.ts` (node) / KB-U18, U19, U28 | như trên | `git grep -nE "window|document|import\.meta\.env" -- src/features/knowledge-base/model` (rỗng) |
| E-DEP | `git diff -- frontend/package.json` | — | chỉ `react-markdown`; số mục lockfile mới (so ≈77) |
| E-AUDIT | `npm audit`, `npm audit --omit=dev` | — | bảng trước/sau theo severity + package |
| E-BUNDLE | Phụ lục A trên bản tạm | `npm run build` (bản tạm) | entry vs chunk markdown (raw/gzip) |
| E-ARCH | `boundaries.test.ts` / KB-U26, U30, U12b | `npm test` | `git diff --stat` không đụng ngoài phạm vi |
| E-GATE | log `format:check`, `lint`, `typecheck`, `test`, `build`, `playwright --list` | mục 13.4 | baseline vs sau |
**Dòng Matrix cần bổ sung khi triển khai xong:** KB-AC-07…12, 14, 20, 22, 23, 25, 33, 34, 35 (+26–28 "nền") trong `Sprint_F6_F6.2_Exit_Criteria_Evidence_Matrix.md`; cập nhật dòng KB-AC tương ứng của RTM F6.1 từ `PENDING`. Không PASS khi thiếu file/test/lệnh/kết quả.

### Known Gaps có thể phát sinh (chỉ ghi khi còn tồn tại sau audit lúc đóng)
Bài mẫu chưa qua duyệt biên tập (nếu D-F6.2-03 B) · chưa đủ 15 bài (F6.6) · ảnh remote/CDN không hỗ trợ, kích thước ảnh (CLS) và kiểm tồn tại file ảnh hoãn F6.6 · heading không có id (không hỗ trợ anchor) · dấu hiệu "mở tab mới" cho link ngoài là việc UI F6.4 · content-lint L1/L4 là regex · `og:image` (D-F6-D1) · production domain / `resolveSiteUrl` / SSR-prerender-hydration (F6.5) · production dependencies còn 4 advisory **có sẵn từ trước F6** (F6.0) · F6-AC-L5 UNVERIFIED (F6.0b, không liên quan F6.2).

---

## 21. Handoff Requirements

**F6.3 — Listing (M):**
- HR-1: import feature **chỉ** trong page lazy (`router.tsx` dùng `lazy()`); **đo lại** entry vs chunk với route thật (spike F6.2 chỉ là bằng chứng nền) — chốt "không có `micromark|mdast|hast-util` trong entry".
- HR-2: dùng `listArticles({category})`, `KNOWLEDGE_CATEGORIES` (thứ tự) + `KNOWLEDGE_CATEGORY_LABELS`, `isKnowledgeCategory` cho mọi input không tin cậy; **không** gọi `getArticle` ở listing (tránh tải thân bài); **không** đụng `import.meta.glob`.
- HR-3: `KnowledgeListView` presentational nhận mảng metadata (test empty state không cần manifest rỗng thật).

**F6.4 — Detail:**
- HR-4: ánh xạ `getArticle`: `found` → render; `not-found` → `ArticleNotFound` (trong `MarketingLayout`, `noindex`); **`content-error` → trạng thái lỗi riêng + `reportError`, không dùng Not Found**.
- HR-5 (giữ chỗ cho F6.5): nếu giữ glob lazy, hydration cần nạp trước thân bài của slug hiện tại (client render đầu tiên phải khớp HTML server).
- Truyền `isKnownSlug={(s) => knowledgeContentService.getArticleMetadata(s) !== undefined}` cho `MarkdownRenderer`; `h1` do trang sở hữu; wrapper `max-w-[65ch]` ở trang; Router context bắt buộc; thiết kế dấu hiệu "mở tab mới" cho link ngoài; ngày hiển thị `dd/MM/yyyy` định dạng xác định (D-F6-U1).
- HR-6: `usePageMeta` cần `siteUrl` ⇒ thống nhất với F6.5 (hoặc F6.4 chỉ đặt title/description, canonical/OG ở F6.5).

**F6.5 — SEO & Prerender:** gọi `checkContentParity` + `validateManifest` làm bước tiền kiểm của script prerender (fail build nếu lệch); sitemap từ `listArticles()` (+`updatedAt`); `resolveSiteUrl`/`PRERENDER_STRICT`/`loadEnv` (D-F6-P4/P4b/A2/A4) cấp `siteUrl` cho `buildKnowledge*Seo`; SSR build xử lý glob qua Vite; hydration: chốt D-F6.2-02 và preload thân bài; theo **D-F6-P5b** (`dist/knowledge.html`), không theo prompt `knowledge/index.html` (X8); serialize `<head>` phải escape thuộc tính (R11 F6 plan).

**F6.6 — Content & QA:** thêm KB-U03b (mỗi danh mục ≥1 bài), KB-U22/U23 (nhãn góc chiếu), kiểm file ảnh tồn tại + kích thước; xác nhận/viết lại bài mẫu; cổng GFM (D-F6-G) nếu lint L4 báo cú pháp; thay bài mẫu bằng 15 bài đã duyệt; chạy lại content-lint.

---

## Phụ lục A — Đo bundle không cần analyzer (Node, đa nền tảng; không thêm dependency)

```js
// chạy trong frontend/ sau `npm run build` (ghi kết quả vào Matrix; không commit script)
const fs = require("node:fs"), path = require("node:path"), zlib = require("node:zlib");
const dir = "dist/assets";
const entry = /src="\/assets\/([^"]+\.js)"/.exec(fs.readFileSync("dist/index.html", "utf8"))[1];
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".js"))) {
  const b = fs.readFileSync(path.join(dir, f)), s = b.toString("utf8");
  const md = /micromark|mdast-util|hast-util-to-jsx-runtime/.test(s);
  console.log(f.padEnd(40), String(b.length).padStart(8), String(zlib.gzipSync(b, { level: 9 }).length).padStart(7),
    f === entry ? "ENTRY" : "", md ? "MARKDOWN-LIBS" : "");
}
```
Ghi chú: gzip tự tính (level 9) có thể lệch nhẹ so với số Vite báo; nêu rõ nguồn của từng số khi ghi evidence.

## Phụ lục B — Tự kiểm (prompt §13 Step 9)

| Mục | Trạng thái |
|---|---|
| Không có task ngoài phạm vi F6.2 | ✔ (mục 4; hoãn tường minh sang F6.3–F6.6) |
| Không bỏ sót AC bắt buộc (07–12, 33–35) | ✔ (mục 14) |
| Không dependency ngoài `react-markdown@10.1.0` | ✔ (không analyzer, không plugin) |
| Không yêu cầu đủ 15 bài | ✔ (0 hoặc 1 bài mẫu; test dùng fixture) |
| Không triển khai SSR/prerender/hydration | ✔ (chỉ nền `seo.ts` thuần + test SSR-safety) |
| Không giả định glob trong Vitest | ✔ ([SPIKE] đã chạy; T0.2 lặp trong repo) |
| Không nhầm "không render HTML" với "URL an toàn" | ✔ (bảng 2.4; hai nhóm test riêng) |
| Không ghi PASS khi chưa evidence | ✔ (mọi AC = PENDING) |
| Không invent domain production | ✔ (`siteUrl` là tham số; F6.5 sở hữu `resolveSiteUrl`) |
| Không đổi Backend / repo | ✔ (spike chỉ trong clone và `/tmp/fe-f62`; **không có thay đổi nào trong repo của Owner**) |
| Tuyên bố F6.2 hoàn thành | ✘ — đây chỉ là plan chờ Owner review |
