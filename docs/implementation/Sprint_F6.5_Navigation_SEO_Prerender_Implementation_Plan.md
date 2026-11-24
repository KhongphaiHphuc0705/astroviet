# AstroViet — Frontend Sprint F6.5: Navigation, SEO & Prerender Implementation Plan

## 1. Document Control

| | |
|---|---|
| **Trạng thái** | **PLAN v1.0 — chờ Owner review.** Plan-only: không sửa mã, package, lockfile, cấu hình hay tài liệu nào trong repo; không cài dependency; không test/AC nào được ghi PASS; hydration **chưa** được bật |
| **Repo / nhánh đã audit** | `KhongphaiHphuc0705/astroviet`, nhánh `dev`, HEAD `7f78cfb` (2026-11-22, "[docs] update f6.4 evidence matrix & known gap registry"); evidence commit F6.4 = `6e848aa` — **Frontend CI #374 = Success** (5m39s; 1 cảnh báo Node 20 của actions; tôi mở được trang tóm tắt, không đọc được log vì cần đăng nhập) |
| **Ngày lập** | 2026-11-22 |
| **Vị trí đề xuất** | `docs/implementation/Sprint_F6.5_Navigation_SEO_Prerender_Implementation_Plan.md` (prompt gợi ý `docs/frontend/Sprint_F6_5_…`; mọi plan sprint/milestone hiện có nằm ở `docs/implementation/` và là tài liệu tạm, xoá khi đóng). Evidence: `docs/implementation/archive/sprint-f6/` |
| **Nhãn bằng chứng** | **[VF]** đã đọc/chạy trên clone · **[SPIKE]** thí nghiệm tạm ngoài repo (bản sao `/tmp/fe-f65`, không commit; repo của Owner không bị đụng) · **[AD]** Owner đã duyệt · **[REC]** đề xuất, **cần Owner duyệt** · **NOT VERIFIED** chưa kiểm · **[PLAN]** dự kiến |
| **Nguồn quyết định** | F6 plan `docs/implementation/Sprint_F6_Implementation_Plan.md` (§3.1 bảng D-F6-*, §6.5–6.7, §9, §14.2, §15) — đây là "Decision Log" của F6 (không có file Opening Decisions riêng trong repo; `Confirmation.md` mà F6 plan viện dẫn **không có trong repo** ⇒ nguồn gốc cuối cùng của các quyết định **NOT VERIFIED** ngoài việc F6 plan + Matrix F6.0 ghi "đã duyệt") |

---

## 2. Executive Summary

**Mục tiêu.** (A) Thêm điều hướng tối thiểu "Kiến thức" (D-F6-N1); (B) nền tảng Site URL + SEO (`resolveSiteUrl`, `PRERENDER_STRICT`, helper sitemap/robots/head); (C) SSR entry riêng + script prerender sinh HTML phẳng cho `/knowledge` và mọi bài trong manifest, kèm `sitemap.xml`, `robots.txt`, tự kiểm KB-P01…P11; (D) tích hợp vào `npm run build`; (E) hạ tầng hydration có điều kiện + script `verify:hydration` + cổng Owner PASS/FAIL, **fallback (a) = CSR `createRoot`**.

**Kết luận kỹ thuật chính (đã kiểm chứng bằng spike):**
- **P1 SSR feasibility: PASS** ở mức build/render: `vite build --ssr` thật (48 module, **737 ms**, `entry-server.js` 75,85 kB) + import trong Node 22 + render `/knowledge`, `/knowledge/what-is-astrology`, `/knowledge/khong-co` thành công (**64 ms** cho 4 lần render; kết quả lặp lại **y hệt** — listing 7.659 ký tự), có `h1`, `<main id="main-content">`, thân bài thật, không lỗi browser-API; `MarketingLayout` và store zustand render được trong Node [SPIKE].
- **Hydration: CONDITIONAL** — hydrate trong jsdom sạch (0 recoverable error, HTML trước = sau) cho listing/bài/Not Found **khi cache React Query của bài được nạp sẵn trước `hydrateRoot`**; **thiếu bước nạp sẵn ⇒ hydration thất bại** (`Hydration failed…`, `Switched to client rendering`, HTML bị thay bằng skeleton) [SPIKE]. Chưa có bằng chứng trên trình duyệt thật ⇒ phụ thuộc cổng Owner.
- **D-F6-A1: CONFIRMED** (F6 plan §3.1 hàng D-F6-A1 và §14.2: "ĐÃ DUYỆT [AD] 2026-11-18"; Matrix F6.0 ghi nhận; ngoại lệ nguồn gốc `Confirmation.md` NOT VERIFIED). ⇒ hạ tầng hydration **được phép lập kế hoạch/triển khai** (không bật cho tới khi Owner PASS cổng).
- **Phát hiện làm đổi thiết kế:** (1) `vite preview` chỉ trả bản prerender cho `/knowledge` nếu có `dist/knowledge.html`; chỉ có `dist/knowledge/index.html` thì `/knowledge` ra **SPA shell**, `/knowledge/` mới ra bản prerender [SPIKE xác nhận lại F13] ⇒ prompt (`knowledge/index.html`) và D-F6-P5b (`knowledge.html`) **phải cùng được sinh**; (2) SSR entry **không được import `@app/router`** (`createBrowserRouter` ở phạm vi module) ⇒ `SuspenseFallback` (đang nằm trong `router.tsx`) không dùng được ở server — `fallback={null}` cho markup giống hệt; (3) `env.ts` bắt buộc `VITE_API_BASE_URL` ngay khi import ⇒ bước prerender **cần biến này lúc build** (ZodError nếu thiếu [SPIKE]); (4) manifest **không có** trường `published/draft` ⇒ "bài chưa published" nghĩa là không có trong manifest; (5) `usePageMeta` hiện coi tag có sẵn là của trang khác ⇒ sau hydrate, rời trang KB sẽ khôi phục metadata **bài cũ** — cần cơ chế nhận diện tag prerender.

**Phạm vi:** 9 sub-milestone F6.5.1–F6.5.9 (mục 19). **Ngoài phạm vi:** Nginx/CDN, Backend, SSR toàn app, `og:image`, JSON-LD, analytics (mục 8).

**Owner actions chính:** cung cấp domain production + đặt `VITE_SITE_URL`/`PRERENDER_STRICT` ở pipeline deploy (chưa có pipeline); duyệt D-F6-A2/A3/A4 (hiện [REC]) và các quyết định D-F6.5-*; **chạy cổng hydration cục bộ** (Chromium) và ra quyết định PASS/FAIL.

**Không có blocker xác nhận** (mục 23.1).

---

## 3. Sprint Context & Current State

| Milestone | Trạng thái [VF] | Dùng cho F6.5 |
|---|---|---|
| F6.1 | Audit/RTM xong | KB-AC-06, 26–32 gán cho F6.5 (F6 plan §8) |
| F6.2 | Xong (Matrix + CI) | manifest + `validateManifest` + `checkContentParity`; `seo.ts`; `contentRegistry` |
| F6.3 | Xong | Listing page; nhãn/copy đã duyệt |
| F6.4 | Xong; sửa lỗi `6e848aa` (header dùng chung `KnowledgeArticleHeader`, `useKnowledgeSiteUrl`, `seo.ts` nhận `siteUrl` tuỳ chọn) | `usePageMeta` (`shared/hooks`), `useKnowledgeArticle`, `knowledgeKeys`, `ArticleNotFound`, `resolveSiteUrl(Detailed)` (client) |
| Chất lượng ở HEAD | `lint`/`typecheck`/`format:check` sạch; full suite **170 file / 1.416 test** pass; build 2.339 module; entry **459.368 B**; `playwright --list` **69 test / 10 file**; audit production 4 lỗ hổng cũ [VF, chạy ở `3a2cbcc`/`6e848aa` — chưa chạy lại ở `7f78cfb` (chỉ đổi docs/ảnh)] | baseline cho F6.5.1 |

---

## 4. Repository Audit Findings

### 4.1 Cấu trúc thực tế (đã đọc)
| Hạng mục | Thực tế [VF] | Hệ quả |
|---|---|---|
| `frontend/package.json` | `build`: `tsc -p tsconfig.app.json --noEmit && vite build`; `preview`: `vite preview`; **không** có `build:prerender`, `verify:hydration`, thư mục `scripts/`; `type: "module"`, `engines.node >=22.18.0`; deps có `react-markdown 10.1.0` (exact), `@playwright/test ^1.62.1` | thêm 2 script mới; **không cần dependency mới** |
| `vite.config.ts` | plugins `react()`+`tsconfigPaths()`; `test` (jsdom, `setupFiles`, `globals`); **không** có `build.ssr`/`copyPublicDir` | SSR build dùng CLI flag; chỉ sửa config nếu chọn D-F6.5-11 |
| `src/main.tsx` | `registerAuthInfrastructure()` rồi `createRoot(#root).render(<StrictMode><App/></StrictMode>)` | nhánh hydrate thêm ở đây (≤ vài dòng) |
| `src/app/App.tsx` | `useSessionBootstrap()` + `StrictMode` + `ThemeProvider` + `QueryClientProvider(queryClient)` + `RouterProvider(router)` | `queryClient` là **singleton** `@shared/api/queryClient` ⇒ `hydrate.ts` nạp sẵn đúng instance này |
| `src/app/router.tsx` | `createBrowserRouter` ở phạm vi module; `SuspenseFallback` export từ đây; nhóm Marketing: `MarketingLayout > Suspense > Outlet`, 3 route `index`, `knowledge`, `knowledge/:slug` (lazy) | **SSR không import file này** |
| `index.html` | script theme inline, preload font, `<title>AstroViet</title>`, `#root`, `#modal-root`, `<script type=module src=/src/main.tsx>`; **không** có description/canonical/OG | prerender bắt đầu từ `dist/index.html` đã build |
| `public/` | `favicon.svg`, `fonts/`; **không** có `robots.txt`/`sitemap.xml` | không xung đột output |
| `MarketingLayout` | `widgets/marketing-layout/index.tsx`: Navbar desktop (`nav aria-label="Điều hướng chính"`, `Link` "Trang chủ"/"Giới thiệu" đều → `/`), drawer **luôn có trong DOM** (`nav aria-label="Điều hướng chính (Mobile)"`, class `hidden`/`flex`), Footer = `<footer>` + 1 dòng bản quyền; **chưa có** "Kiến thức"; **không** có active state (chỉ `Link`) | D-F6-N1 |
| Test layout | `MarketingLayout.test.tsx` 5 test (landmarks, drawer, auth login/register, authenticated, resolving); `e2e/layout.spec.ts` dùng `nav[aria-label="Điều hướng chính"]` (dòng 13) và `"(Mobile)"` (dòng 31) | footer nav `"Chân trang"` **không** xung đột selector hiện có |
| Env | `shared/config/env.ts`: zod `parse(import.meta.env)`: `VITE_API_BASE_URL` (url, bắt buộc), `VITE_SITE_URL` (optional string — F6.4); `.env.example` có `VITE_SITE_URL=http://localhost:5173` | `PRERENDER_STRICT` **không** vào `env.ts` (không có tiền tố `VITE_`) |
| ESLint | `files: **/*.{ts,tsx}` ⇒ `scripts/*.mjs` **không** bị lint/typecheck; `ignores` có `dist` nhưng **không** `dist-ssr` (không ảnh hưởng vì chỉ lint `ts/tsx`); `boundaries/element-types: off` | logic nên đặt trong TS (`src/prerender/*.ts`) để được typecheck/lint/test; `.mjs` mỏng |
| `.gitignore` | có `dist`, `dist-ssr` | sẵn |
| CI | `.github/workflows/frontend-ci.yml`: `npm ci` → `cp .env.example .env` → `format:check` → `lint` → `typecheck` → `test:coverage` → `npm run build` → (Backend) → Playwright E2E trên dev server; **không có** deploy pipeline; **không có** Nginx/Docker cho frontend (chỉ Backend có Dockerfile/compose) | build tích hợp prerender sẽ chạy trong CI với `.env` từ example (non-strict) |
| Service F6.2/F6.4 | `knowledgeContentService.listArticles/getArticleMetadata/getArticle`; `getArticle` trả `found/not-found/content-error` (không ném); `classifyArticleResult`; `knowledgeKeys.article(slug)`; barrel còn xuất `checkContentParity`, `contentRegistry`, `KnowledgeContentIntegrityError`, `buildKnowledge*Seo`, `KNOWLEDGE_*` title/description | đủ cho prerender/validator, **không tạo manifest/loader thứ hai** |
| `seo.ts` | `SITE_NAME`, `buildKnowledgeListSeo/ArticleSeo/NotFoundSeo` (`siteUrl` tuỳ chọn), `normalizeSiteUrl`, `KnowledgeSeoError`; title `"{Tiêu đề} — AstroViet"`; **không** có sitemap/robots/serialize head | mở rộng ở F6.5.2 |
| `siteUrl.ts` | `resolveSiteUrl/Detailed(raw,{isDev})` (client: thiếu & production ⇒ `undefined`) | cần thêm biến thể **build-time có strict** (mục 11) |
| `usePageMeta` | `shared/hooks/usePageMeta.ts` — upsert title/description/canonical/`og:*`/robots, cleanup khôi phục; coi tag có sẵn là "đã tồn tại" | cần nhận diện tag prerender (mục 16.5) |
| UI Spec | §11.1 Navbar desktop ghi sẵn "Natal Chart \| Transit \| Synastry \| Kiến thức", §11.2 Footer 3 cột | D-F6-N1 là **lệch có chủ đích** ⇒ cập nhật as-built |

### 4.2 Discrepancy giữa prompt ↔ F6 plan ↔ repo (không chọn âm thầm)
| ID | Discrepancy | Xử lý đề xuất |
|---|---|---|
| X1 | **Layout listing:** prompt (§4.5, DoD) = `dist/knowledge/index.html`; D-F6-P5b [AD] = `dist/knowledge.html` bản chính + `knowledge/index.html` tuỳ chọn (D-F6-A3 [REC]) | sinh **cả hai**, nội dung giống nhau, canonical vẫn `/knowledge` — **D-F6.5-01** |
| X2 | Prompt: "build = client + SSR + prerender + validate"; F6 plan: `build` và `build:prerender` tách | `build` = `tsc && vite build && npm run build:prerender`; `build:prerender` = SSR build + script (mục 10) |
| X3 | Prompt: "article chưa published"; manifest **không có** trường trạng thái | mọi entry manifest = published; file không có entry = orphan (đã bị parity fail ở F6.2) — không thêm trường mới |
| X4 | `PRERENDER_STRICT`/D-F6-A2/A3/A4 là **[REC]** (F6 plan §14.2), chưa duyệt | thiết kế theo F6 plan; xin Owner duyệt (mục 24) |
| X5 | Prompt F6.5.9 yêu cầu cập nhật UI Spec + CHANGELOG + "F6.5 closure report"; F6 plan: UI Spec/CHANGELOG/README ở **F6.7** (D-F6-K) và D-F6-R: báo cáo đóng sprint **một** (F6.7) | **D-F6.5-08**: mặc định giữ F6.7; F6.5 ghi as-built vào Matrix F6.5 (mục "Closure") |
| X6 | Prompt: "KB-P01…P11 phải đối chiếu tài liệu gốc": F6 plan §9.2 định nghĩa P01…P11 **khác** danh mục gợi ý của prompt | **giữ định nghĩa nguồn F6 plan** (mục 21.3) |
| X7 | F6 plan §6.6 vẽ `<Suspense fallback={<SuspenseFallback/>}>` ở server; `SuspenseFallback` nằm trong `router.tsx` | dùng `fallback={null}` (markup giống nhau, đã kiểm hydrate sạch) hoặc chuyển `SuspenseFallback` sang `shared` (đụng `router.tsx`) — **D-F6.5-05b** |
| X8 | F6 plan §9.2 E2E giữ trên dev server (D-F6-T1) ⇒ E2E không thấy HTML prerender; prompt đòi "vite preview trả đúng HTML" | kiểm `vite preview` bằng script tự kiểm + `curl`/`fetch` trong `verify` (không đổi `playwright.config.ts`) |
| X9 | Prompt "Footer nav một link" vs UI Spec §11.2 (3 cột) | D-F6-N1 [AD]; as-built |

---

## 5. Source Documents & Requirement Traceability

### 5.1 Tài liệu đã đọc
`docs/implementation/Sprint_F6_Implementation_Plan.md` (đầy đủ các mục liên quan), Matrix F6.0–F6.4, `Sprint_F6_Known_Gaps_Registry.md`, `docs/frontend/Frontend_UI_Specification.md` (§11, §13), `docs/frontend/Frontend_Architecture_Specification.md` (§5.1, §12.3 — qua F6 plan), `docs/product/PRD.md` (FR-12/14 — qua F6 plan RTM), mã nguồn mục 4.1, prompt F6.5. **NOT VERIFIED:** PRD FR-14 văn bản gốc (chỉ đọc qua RTM F6 plan).

### 5.2 AC (nguồn: F6 plan §8 — nguồn gốc là prompt sprint, **không** phải PRD)
| AC | Nội dung (nguồn) | Thành phần | Task | Test | Evidence |
|---|---|---|---|---|---|
| **KB-AC-06** | "Kiến thức" ở Navbar **và** Footer (Spec §11; D-F6-10) | `MarketingLayout` | F6.5.6 | KB-U-nav, KB-E09 | test layout + E2E |
| **KB-AC-26** | Mỗi trang có `<title>` riêng | `seo.ts` + prerender | F6.5.2/.4 | KB-U18, KB-P01 | validator + HTML |
| **KB-AC-27** | Meta description phù hợp | như trên | F6.5.2/.4 | KB-U18, KB-P02 | |
| **KB-AC-28** | Canonical đúng, theo cấu hình môi trường | `VITE_SITE_URL` | F6.5.2/.4 | KB-U19, KB-U24, KB-P03 | |
| **KB-AC-29** | Sitemap sinh từ manifest | `buildSitemapXml` | F6.5.2/.4 | KB-U20, KB-P05 | `dist/sitemap.xml` |
| **KB-AC-30** | `robots.txt` đúng vị trí output | `buildRobotsTxt` | F6.5.2/.4 | KB-U21, KB-P06 | `dist/robots.txt` |
| **KB-AC-31** | HTML prerender có nội dung bài + metadata (không chỉ shell) | `prerender.mjs` | F6.5.4 | KB-P01…P11 | HTML inspection |
| **KB-AC-32** | Route CSR hiện có + build không hồi quy | không đổi route khác | F6.5.5/.9 | hồi quy (mục 21.6) | full suite + E2E CI |
**Không thuộc F6.5:** KB-AC-01–05, 13–25 (F6.3/F6.4), 33–35 (F6.2), 36–40 (F6.6/F6.7).

### 5.3 Mapping quyết định đã duyệt → task/evidence
| Quyết định | Task | Evidence |
|---|---|---|
| D-F6-P1 (Vite SSR + Node script; 6 điều kiện) | F6.5.1, .3, .4 | spike + KB-U-ssr + KB-P |
| D-F6-P2/P2b (hydrate có điều kiện, cổng script, fallback (a)) | F6.5.7, .8 | KB-U25 (`shouldHydrate`), KB-H01–H05, quyết định Owner |
| D-F6-P3 (tích hợp vào `build`) | F6.5.5 | build log + inventory `dist/` |
| D-F6-P4/P4b (`VITE_SITE_URL`, `PRERENDER_STRICT`) | F6.5.2, .4 | KB-U24, KB-P08, KB-P11 |
| D-F6-P5/P5b (flat file, không `.html` công khai) | F6.5.4 | KB-P09 + `vite preview` |
| D-F6-S1 (sitemap/robots) | F6.5.2, .4 | KB-U20/U21, KB-P05/P06 |
| D-F6-D1 (không `og:image`) | F6.5.2 | KB-U18 (không có thẻ), Known Gap |
| D-F6-N1 (nav tối thiểu) | F6.5.6 | KB-U-nav, KB-E09 |
| D-F6-U1 (copy) | không đổi copy F6.3–F6.4 | hồi quy |
| D-F6-A1 (nhánh có điều kiện ở `main.tsx`) | F6.5.7 | diff `main.tsx` ≤ vài dòng |
| D-F6-T1 / D-F6-H / D-F6-K | F6.5.5 / ghi Known Gap / F6.5.9 | — |

---

## 6. Approved Decisions (nhắc lại — không thay đổi)
P1, P2 (+hydrate có điều kiện, fallback (a)), P2b (cổng = script Playwright API trên `vite preview`, Owner chạy, **không** đổi `playwright.config.ts`/CI), P3, P4/P4b, P5/P5b, S1, D1, N1, U1, A1 — như F6 plan §3.1/§14.2 và prompt §4. Nginx **hoãn**. Các điểm chưa duyệt: A2–A6 [REC]; tất cả `D-F6.5-*` là đề xuất mới.

---

## 7. Scope

**A. Navigation** — `MarketingLayout`: 1 `NavLink` "Kiến thức" ở Navbar desktop, 1 ở drawer mobile, `nav aria-label="Chân trang"` + 1 link ở Footer; cập nhật `MarketingLayout.test.tsx`.
**B. Site URL & SEO** — mở rộng `seo.ts`/`siteUrl.ts`: `resolveSiteUrl` có strict cho build, `buildSitemapXml`, `buildRobotsTxt`, serialize head (escape), hằng marker; unit test.
**C. SSR entry** — `src/prerender/entry-server.tsx` (+ module TS phụ trợ).
**D. Prerender script** — `scripts/prerender.mjs` (mỏng) + validator KB-P01…P11.
**E. Build** — `package.json` (`build`, `build:prerender`, `verify:hydration`), `vite.config.ts` nếu chọn D-F6.5-11.
**F/G. Hydration** — `src/app/hydrate.ts`, nhánh `main.tsx`, `scripts/verify-hydration.mjs`.
**H. Tài liệu & evidence.**

## 8. Out of Scope
Backend/Prisma/migration; tính toán chiêm tinh; Interpretation Engine; CMS; search/pagination; SSR toàn app; Footer/Navbar redesign; thêm item điều hướng khác; `og:image`; **Nginx/CDN/deploy**; analytics; JSON-LD; dependency mới; sửa `playwright.config.ts`/CI workflow (D-F6-P2b); sửa Listing/Detail ngoài những gì F6.5 cần (nạp sẵn cache, nhận diện tag prerender). Phát hiện prerequisite ngoài scope ⇒ ghi Owner decision, không tự đưa vào.

---

## 9. Target Architecture

```
npm run build
 ├─ tsc -p tsconfig.app.json --noEmit
 ├─ vite build                              → dist/ (index.html + assets băm)                [CSR, không đổi]
 └─ npm run build:prerender
     ├─ vite build --ssr src/prerender/entry-server.tsx --outDir dist-ssr   → dist-ssr/entry-server.js (+ chunk .md)   [KHÔNG deploy]
     └─ node scripts/prerender.mjs
         ├─ nạp dist-ssr/entry-server.js (pathToFileURL)  ──►  { render, listPrerenderRoutes, buildHead, buildSitemapXml, buildRobotsTxt, validate… }
         ├─ resolve siteUrl (1 nguồn) → strict policy
         ├─ clean generated output (dist/knowledge*, sitemap.xml, robots.txt)
         ├─ với mỗi route: html = render(url) ; head = buildHead(route) ; template = dist/index.html
         │      → ghi dist/knowledge.html, dist/knowledge/index.html, dist/knowledge/<slug>.html
         ├─ ghi dist/sitemap.xml, dist/robots.txt
         └─ TỰ KIỂM KB-P01…P11 → exit 1 nếu sai
```
Client runtime: `main.tsx` → (cờ bật ∧ `shouldHydrate`) ? nạp sẵn cache + `hydrateRoot` : `createRoot` (hiện trạng).

**Nguyên tắc:** (1) một bản UI: server render **chính** `KnowledgeListPage`/`KnowledgeDetailPage` + `MarketingLayout` (đã kiểm hydrate sạch), không viết lại; (2) một nguồn meta: `seo.ts` builders → vừa serialize vào `<head>` (prerender) vừa dùng bởi `usePageMeta` (runtime); (3) logic nằm trong TS có test, `.mjs` chỉ I/O; (4) output sinh ra **không bao giờ** được hợp nhất vào source; (5) lỗi bắt buộc ⇒ exit ≠ 0.

---

## 10. Build Pipeline Design

| Bước | Lệnh | Input | Output | Ghi chú / kiểm [SPIKE] |
|---|---|---|---|---|
| 0 | `tsc -p tsconfig.app.json --noEmit` | `src/**` (gồm `src/prerender/**`) | — | typecheck cả entry server |
| 1 | `vite build` | `index.html`, `src` | `dist/` | `emptyOutDir` mặc định ⇒ **xoá output cũ** (kể cả file prerender) |
| 2 | `vite build --ssr src/prerender/entry-server.tsx --outDir dist-ssr` | như trên | `dist-ssr/entry-server.js`, chunk `.md` lazy | chạy được: 48 module/737 ms; **cảnh báo vô hại** "`default` is imported from external module `react` but never used" (`MarketingLayout`, `SkipLink`); **sao chép `public/` vào `dist-ssr`** (favicon, fonts) — vô hại vì không deploy, tuỳ chọn tắt bằng `build.copyPublicDir:false` khi `isSsrBuild` (D-F6.5-11) |
| 3 | `node scripts/prerender.mjs` | `dist/index.html`, `dist-ssr/entry-server.js`, env | `dist/knowledge.html`, `dist/knowledge/**`, `dist/sitemap.xml`, `dist/robots.txt` | exit ≠ 0 khi sai |
`package.json` [PLAN]:
```
"build": "tsc -p tsconfig.app.json --noEmit && vite build && npm run build:prerender",
"build:prerender": "vite build --ssr src/prerender/entry-server.tsx --outDir dist-ssr && node scripts/prerender.mjs",
"verify:hydration": "node scripts/verify-hydration.mjs"
```
- **Không ghi đè client build:** SSR ra `dist-ssr`; script chỉ thêm/ghi đè file trong tập sinh ra.
- **SSR bundle không bị deploy nhầm:** `dist-ssr` ngoài `dist`, đã `.gitignore`; README ghi "chỉ deploy `dist/`".
- **Build lặp lại không còn file cũ:** `npm run build` luôn bắt đầu bằng `vite build` (xoá `dist`); `build:prerender` chạy riêng thì script **xoá trước** `dist/knowledge`, `dist/knowledge.html`, `dist/sitemap.xml`, `dist/robots.txt` rồi kiểm parity manifest↔output (R6).
- **Lỗi lan tới CI:** `&&` + `process.exitCode = 1`/`throw` ⇒ `npm run build` fail ⇒ CI đỏ.
- **Không cần Backend:** chỉ đọc manifest/Markdown trong repo.
- **Biến môi trường lúc build (mới):** SSR bundle chạy `env.ts` ⇒ cần `VITE_API_BASE_URL` (CI đã có qua `.env.example`; production client build cũng bắt buộc có biến này để chạy được) — script bắt `ZodError` và in thông báo rõ ("thiếu VITE_API_BASE_URL khi build SSR").
- **Thời gian:** SSR build ≈ 0,7 s + render ≈ 0,1 s trong spike (máy spike); tổng thời gian `npm run build` tăng nhỏ — **đo thật ở F6.5.5**, không cam kết.
- `vite preview` phục vụ `dist/` để kiểm (không dùng làm bằng chứng Nginx).

---

## 11. Site URL & SEO Design

### 11.1 Một nguồn đọc `VITE_SITE_URL`
| Nơi đọc | Cách | Ghi chú |
|---|---|---|
| Client runtime | `useKnowledgeSiteUrl` ← `env.VITE_SITE_URL` (đã có F6.4) | giữ nguyên |
| Build/prerender | `scripts/prerender.mjs` ← `loadEnv(mode, cwd, "")` ∪ `process.env` (cùng giá trị Vite bake vào client) | **một** hàm quyết định cho cả hai: `resolveSiteUrl*` trong `siteUrl.ts` (thuần) |
Không component nào tự nối URL: mọi canonical/OG/sitemap lấy từ `seo.ts` + `normalizeSiteUrl`.

### 11.2 API đề xuất (thuần, không React/DOM/env) — mở rộng module hiện có
```ts
// siteUrl.ts (thêm)
export type PrerenderSiteUrlErrorCode = "MISSING" | "INVALID" | "NOT_HTTPS" | "LOCAL_HOST";
export type PrerenderSiteUrlResolution =
  | { readonly status: "ok"; readonly siteUrl: string; readonly source: "env" | "dev-fallback"; readonly warnings: readonly string[] }
  | { readonly status: "error"; readonly code: PrerenderSiteUrlErrorCode; readonly message: string };
export function resolveSiteUrlForBuild(raw: string | undefined, options: { strict: boolean }): PrerenderSiteUrlResolution;
export function parseStrictFlag(raw: string | undefined): { value: boolean } | { error: string };

// seo.ts (thêm)
export function buildSitemapXml(input: { siteUrl: string; articles: readonly KnowledgeArticleMetadata[] }): string;
export function buildRobotsTxt(input: { siteUrl: string }): string;
export function serializeHeadTags(seo: KnowledgeSeo, options?: { marker?: boolean }): string;   // escape thuộc tính
```
`resolveSiteUrl` (client) **không đổi hợp đồng**; `resolveSiteUrlForBuild` dùng chung `normalizeSiteUrl`. Tên theo prompt (`resolveSiteUrl`) được giữ cho phía client; biến thể build đặt tên rõ để không đổi hành vi client.

### 11.3 `PRERENDER_STRICT` (D-F6-P4b; A2/A4 [REC])
| Mặc định | `false` khi không đặt |
|---|---|
| Parse | không phân biệt hoa/thường: `true`/`1` ⇒ true; `false`/`0`/rỗng/không đặt ⇒ false; **giá trị khác ⇒ build fail** (bắt lỗi gõ) [REC D-F6.5-03] |
| Không đặt + `VITE_SITE_URL` thiếu | dùng `http://localhost:5173` + **cảnh báo to** (local/CI) |
| Bất kỳ + `VITE_SITE_URL` sai định dạng | **luôn fail** (A4) |
| `true` + thiếu/sai/không `https:`/host `localhost`·IP nội bộ | **fail** (A2); không sinh canonical/sitemap giả |
| `true` + manifest rỗng | **fail** (production không phát hành KB trống) [REC D-F6.5-09]; non-strict: cảnh báo, vẫn sinh listing (empty state) |
| Luôn fail (mọi chế độ) | SSR render lỗi; manifest không hợp lệ (`validateManifest`); parity lệch (`checkContentParity`); template `index.html` thiếu anchor (`<title>`, `<div id="root"></div>`, `</head>`); file output thiếu; `h1` ≠ 1; sitemap sai/trùng; robots chứa placeholder |
| Chỉ strict | HTTPS bắt buộc; cấm `localhost`/IP; cấm output chứa `localhost`/`example`/`<production-domain>`; manifest rỗng |
**Không có pipeline deploy** ⇒ cờ **không được ép tự động**: Known Gap + **Owner action** đặt `PRERENDER_STRICT=true` và `VITE_SITE_URL` ở nơi build production. Thông báo lỗi nêu tên biến, giá trị nhận được (đã che nếu nhạy cảm — URL không nhạy cảm), cách sửa.

### 11.4 Metadata
Tận dụng builder F6.4: listing `Kiến thức chiêm tinh — AstroViet` + mô tả đã duyệt, canonical `${siteUrl}/knowledge`, `og:type=website`; bài: `"{Tiêu đề} — AstroViet"`, `description = summary`, canonical `${siteUrl}/knowledge/${slug}`, `og:type=article`, `og:url` = canonical; **không** `og:image`/`twitter:*`/JSON-LD. Chuẩn hoá: không `//`, không `/` cuối, slug đã validate `[a-z0-9-]` (không cần encode; test slug mã hoá → từ chối/giữ nguyên theo `normalize`); `description` rỗng không xảy ra (manifest validate) — nếu xảy ra ⇒ fail, **không** tự bịa; ký tự đặc biệt (`& < > " '`) được escape trong `serializeHeadTags` (test). Mô tả/ tiêu đề dài: không cắt tự động (validate ≤160 từ manifest).

---

## 12. SSR Entry Design (`src/prerender/entry-server.tsx`)

- **Hợp đồng:** `export async function render(url: string): Promise<{ html: string; route: PrerenderRoute }>`; `listPrerenderRoutes(): readonly PrerenderRoute[]` (từ `knowledgeContentService.listArticles()`); `buildHead(route, siteUrl)`; export validator/sitemap/robots để script chỉ gọi hàm.
- **Cây render (đã chạy [SPIKE]):** `QueryClientProvider(client mới + dữ liệu bài nạp sẵn) > StaticRouter(location) > MarketingLayout > Suspense(fallback=null) > Routes[ /knowledge → KnowledgeListPage ; /knowledge/:slug → KnowledgeDetailPage ]`. Dùng **chính** page component của client (không UI thứ hai). Không `routesConfig`/`router.tsx` (lazy ⇒ spinner; `createBrowserRouter` ⇒ cần `window`).
- **Nạp sẵn dữ liệu bài trước khi render:** `await knowledgeContentService.getArticle(slug)` → `queryClient.setQueryData(knowledgeKeys.article(slug), result)`; render đồng bộ sau đó. `QueryClient` **mới cho mỗi lần render** ⇒ không rò state giữa các route.
- **Unknown slug:** `getArticleMetadata` = `undefined` ⇒ render `ArticleNotFound` (cùng hành vi client, `h1 "Không tìm thấy bài viết"`); **không** ghi file (script chỉ prerender slug trong manifest). Test `KB-U-ssr` khẳng định hành vi này.
- **`content-error`:** `render` **ném** (script ⇒ exit ≠ 0): không prerender trang lỗi như thể thành công.
- **SSR-safe:** không `window/document/localStorage/navigator`; store zustand (persist) chỉ tạo, không ghi trong render; `ThemeProvider` effect-only ⇒ không cần ở server (không phát DOM). `usePageMeta`, `scrollTo`, `reportError` nằm trong effect ⇒ không chạy ở server.
- **Markup:** có comment Suspense `<!--$-->…<!--/$-->` ⇒ cây client có cùng `Suspense` bọc `Outlet` (router.tsx dòng 70–75).
- **Marker (D-F6-P2):** `#root data-prerendered="1" data-prerender-route="<route chuẩn hoá>" data-prerender-version="<n>"` do **script** ghi (không do component); `PRERENDER_VERSION` là hằng trong `src/prerender/marker.ts` (module nhỏ, không import React) dùng chung với `shouldHydrate`.
- **Không** import: `@app/router`, `@app/App`, `registerAuthInfrastructure`, API client, Playwright.
- **Test KB-U-ssr:** mục 21.2.

---

## 13. Prerender Script Design (`scripts/prerender.mjs` mỏng + logic TS)

**Trách nhiệm [PLAN]:** parse env (`parseStrictFlag`, `resolveSiteUrlForBuild`) → nạp SSR bundle → `listPrerenderRoutes` → xoá output sinh ra cũ → với từng route: `render` + `buildHead` + chèn vào template → ghi file → sitemap/robots → `validatePrerenderOutput` → in báo cáo → `process.exitCode`.
**Chèn vào template (`dist/index.html`):** thay `<title>AstroViet</title>` bằng title route; chèn các tag meta/canonical/OG (có `data-prerendered`) trước `</head>`; thay `<div id="root"></div>` bằng `<div id="root" data-prerendered="1" data-prerender-route=… data-prerender-version=…>{html}</div>`; giữ nguyên script theme, preload font, `#modal-root`, tham chiếu asset băm. Template thiếu bất kỳ anchor ⇒ **fail** (không chèn mù).
**Xử lý các trường hợp (prompt §5-D):**
| Trường hợp | Hành vi |
|---|---|
| Không có bài | strict: fail; non-strict: cảnh báo, sinh listing (empty state) |
| Slug trùng / metadata sai | `validateManifest` ⇒ fail (đã có F6.2) |
| Manifest ↔ Markdown lệch | `checkContentParity` ⇒ fail (đã có F6.2) |
| "Chưa published" | không có khái niệm (X3): chỉ entry manifest; không thêm trường |
| SSR render lỗi / `content-error` | fail, nêu route |
| Thư mục output không tồn tại | fail kèm gợi ý chạy `vite build` trước |
| Site URL sai | fail (A4) |
| HTML thiếu / rỗng / chỉ shell | fail (P07) — **không** ghi file rỗng hoặc metadata-only |
| Sitemap sai/trùng | fail (P05) |
| Robots có placeholder | fail (P06/P10-strict) |
**Ghi file:** `path.join` + `fs.mkdir recursive`; mã hoá UTF-8; dùng `pathToFileURL` khi `import()` (Windows của Owner) — **NOT VERIFIED trên Windows** (spike chạy Linux).
**Báo cáo:** bảng route → file → kích thước + kết quả từng KB-P; chuỗi `PRERENDER OK`/`PRERENDER FAILED`.

---

## 14. Sitemap & Robots Design (D-F6-S1)
- `sitemap.xml`: `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`; URL = `${siteUrl}/knowledge` + `${siteUrl}/knowledge/{slug}` cho **mọi entry manifest**; **không** `/`; không trùng; `lastmod` = `updatedAt` (listing: ngày lớn nhất); escape XML; sắp xếp xác định (listing trước, bài theo thứ tự service).
- `robots.txt` (đúng văn bản đã duyệt, siteUrl thật):
```
User-agent: *
Disallow: /app/

Sitemap: ${siteUrl}/sitemap.xml
```
Không thêm directive khác. **Quan sát [VF]:** `Disallow: /app/` không phủ đúng `/app` (không `/`) — dashboard gốc; là lệch nhỏ của văn bản **đã duyệt**, ghi Owner awareness, không tự đổi. `Disallow` không phải access control (auth hiện có giữ nguyên).
- Strict: không `localhost`/placeholder trong cả hai file. Non-strict (local/CI): được phép `localhost` kèm cảnh báo.

---

## 15. Navigation Implementation (D-F6-N1)

| Mục | Thiết kế |
|---|---|
| Desktop | trong `nav aria-label="Điều hướng chính"`, **sau** "Giới thiệu", trước cụm auth: `<NavLink to="/knowledge" className={({isActive}) => …}>Kiến thức</NavLink>` — class nền giống 2 link hiện có + trạng thái active bằng token **đã kiểm có CSS** (cổng CSS). `NavLink` tự gắn `aria-current="page"`; **không `end`** ⇒ active cả ở `/knowledge/:slug` [REC D-F6.5-10] |
| Mobile drawer | trong `nav aria-label="Điều hướng chính (Mobile)"`, sau "Giới thiệu": `NavLink` tương tự, `onClick={() => setMobileDrawerOpen(false)}` như các link khác |
| Footer | trong `<footer>`, **trên** dòng bản quyền: `<nav aria-label="Chân trang"><Link to="/knowledge">Kiến thức</Link></nav>`; không heading hiển thị; style `text-body-sm text-secondary hover:text-primary` (token đã có) |
| Không đổi | cấu trúc/thứ tự khác, style hiện có, auth buttons, `AppLayout`, Sidebar |
| Hiện trạng cần biết | hiện **không có** active state ở các link khác (chỉ `Link`) ⇒ "theo conventions hiện tại" = không có; chỉ link mới có `aria-current`; không refactor 2 link kia |
| a11y | 3 landmark `navigation` có nhãn **khác nhau**; mỗi bề mặt đúng 1 link "Kiến thức"; không trùng ID; drawer luôn có trong DOM (`hidden`) ⇒ test dùng `hidden: true` như test hiện có |
| Test (`MarketingLayout.test.tsx` — thêm vào file hiện có) | KB-U-nav-1 desktop: trong nav "Điều hướng chính" đúng 1 link "Kiến thức" `href="/knowledge"`; -2 mobile: trong nav "(Mobile)" đúng 1 link, click đóng drawer (`useUiStore`); -3 footer: `navigation` tên "Chân trang" có đúng 1 link `/knowledge`, **không** có heading trong nav; -4 active: render ở `/knowledge` và `/knowledge/x` (MemoryRouter) ⇒ link desktop+mobile `aria-current="page"`, ở `/` ⇒ không; -5 cả `authenticated/unauthenticated/resolving`: link vẫn hiện; -6 landmark: số `navigation` = 3, nhãn duy nhất |
| E2E (`knowledge-base.spec.ts`, KB-E09) | desktop: click link Navbar → `/knowledge`; mobile 375: mở menu → click → URL đúng + drawer đóng; footer link hiện và điều hướng; không phá `layout.spec.ts` |
| Class mới | qua cổng CSS (bài học F6.2/F6.3): không dùng `text-body-md/lg` mới |

---

## 16. Conditional Hydration Design (D-F6-P2; D-F6-A1 CONFIRMED)

### 16.1 Điều kiện và cờ
Nhánh hydrate chỉ chạy khi **tất cả**: (1) cờ bật; (2) `shouldHydrate` = true. Cờ: `HYDRATION_ENABLED = import.meta.env.VITE_ENABLE_HYDRATION === "true"` **mặc định tắt** (D-F6.5-04) — đọc ở **một** chỗ (`hydrate.ts`), ghi vào `.env.example`. Không hydrate khi chưa Owner PASS. (Lý do dùng biến build-time: cổng cần build **có hydrate** mà không phải commit trạng thái "bật"; `verify-hydration.mjs` tự build với `VITE_ENABLE_HYDRATION=true` bằng `child_process` — không cần `cross-env`/dependency.)

### 16.2 `shouldHydrate` (thuần, không DOM)
```ts
interface PrerenderMarker { readonly prerendered?: string; readonly route?: string; readonly version?: string }
interface HydrationInput { readonly enabled: boolean; readonly pathname: string; readonly marker: PrerenderMarker | null; readonly h1Count: number; readonly hasRoot: boolean }
type HydrationDecision = { readonly hydrate: true } | { readonly hydrate: false; readonly reason: "disabled" | "no-root" | "no-marker" | "not-knowledge-route" | "route-mismatch" | "version-mismatch" | "invalid-markup" };
function shouldHydrate(input: HydrationInput): HydrationDecision
```
Điều kiện (F6 plan §6.6 #2): `marker.prerendered` có; `normalize(pathname)` ∈ `/knowledge` | `/knowledge/<slug hợp lệ>` và `=== marker.route`; `marker.version === PRERENDER_VERSION`; `h1Count === 1`; `enabled`. `normalize`: bỏ `/` cuối (`/knowledge/` ≡ `/knowledge`). Hàm đọc DOM (`readPrerenderMarker(root)`, đếm `h1`) tách riêng, mỏng.

### 16.3 `hydrate.ts` — `hydrateKnowledge`
1. Với route bài: `await knowledgeContentService.getArticle(slug)`; **chỉ** khi `status === "found"` ⇒ `queryClient.setQueryData(knowledgeKeys.article(slug), result)` (singleton `@shared/api/queryClient`) — **bắt buộc**: thiếu bước này hydrate thất bại [SPIKE]. Không `found` ⇒ trả về "dùng CSR".
2. `hydrateRoot(root, <StrictMode><App/></StrictMode>, { onRecoverableError: (e, info) => reportError(e, "hydration:recoverable") })` — **ghi nhận, không "khôi phục"**; không nuốt lỗi.
3. **Không** gọi `createRoot` lần hai trên cùng container; không teardown/remount tự động.
4. Phân loại (prompt §5-F): *recoverable* ⇒ `onRecoverableError`; *fatal render* ⇒ `RootErrorBoundary` hiện có; *missing marker / wrong route / invalid markup / disabled* ⇒ `shouldHydrate` false ⇒ `createRoot`; *CSR fallback* = hành vi hiện tại.
5. Lazy page: chunk trang tải bất đồng bộ; React giữ HTML server của boundary đã dehydrate cho tới khi chunk sẵn sàng [SPIKE: hydrate sạch với `routesConfig` thật + lazy].

### 16.4 `main.tsx` (≤ vài dòng)
```ts
registerAuthInfrastructure();
const root = document.getElementById("root")!;
if (!(await tryHydrateKnowledge(root))) createRoot(root).render(<StrictMode><App /></StrictMode>);
```
(`tryHydrateKnowledge` ở `hydrate.ts`, trả `true` nếu đã `hydrateRoot`). Mọi route khác đúng hành vi cũ. **Giữ `registerAuthInfrastructure()` đứng trước** như hiện tại. *Lưu ý:* top-level `await` trong module — Vite target mặc định hỗ trợ; nếu không, bọc `void (async () => …)()`; quyết khi triển khai, kiểm build.

### 16.5 Tương thích `usePageMeta` với tag prerender (phát hiện mới)
Hook hiện nhớ giá trị "trước" khi mount và khôi phục khi unmount. Sau hydrate, `previous` = metadata **bài đã prerender**; rời sang `/` ⇒ khôi phục metadata bài cũ (sai). Đề xuất [REC D-F6.5-06]: prerender đánh dấu tag bằng `data-prerendered` và `<title data-base-title="AstroViet">`; `usePageMeta` coi tag có `data-prerendered` là **do hook sở hữu** (gỡ khi cleanup) và khôi phục title về `data-base-title`. Có test hook (tag prerender → rời trang → sạch). *Không* đụng nơi khác.

### 16.6 Rủi ro hydration đã biết (cần cổng)
Giá trị phụ thuộc trình duyệt; mismatch do extension; bootstrap auth đổi header sau hydrate (nút Đăng nhập/Đăng ký xuất hiện — thay đổi **sau** hydrate, không phải mismatch, nhưng có thể góp CLS); font/`data-theme`; ngày định dạng đã xác định (không phụ thuộc múi giờ). Mọi giả định phải được cổng kiểm — jsdom **không** thay thế trình duyệt thật.

---

## 17. Hydration Verification & Owner Gate (F6.5.8)

**Ai/Khi nào:** Owner, **cuối F6.5** (sau F6.5.1–.7 xong); không chặn các task trước.
**Prerequisites:** Node ≥ 22.18; `npm ci`; Chromium (`npx playwright install chromium`) hoặc Chrome; `.env` có `VITE_API_BASE_URL`; không cần Backend (route `/auth/refresh` được mock/allowlist).
**Lệnh chính:** `npm run verify:hydration` (script tự: build có cờ vào thư mục riêng `dist-hydration` + prerender, chạy `vite preview` cổng riêng, chạy kịch bản, tắt server, ghi báo cáo). Tuỳ chọn `-- --fallback` chạy lại với cờ tắt để chứng minh CSR fallback.
**Kịch bản (F6 plan §6.6):** viewport 1280×800 và 375×667; trễ JS chính 800 ms bằng route handler; routes: `/knowledge`, mọi bài trong manifest (hiện **chỉ 1 bài** ⇒ chưa đạt "3 bài" của F6 plan — chạy lại sau F6.6, ghi Known Gap), `/knowledge/<slug-lạ>`, `/`.
| ID | Kiểm | Pass |
|---|---|---|
| KB-H01 | `h1` + đoạn đầu bài hiển thị **trước** khi JS chạy (chặn JS) | có |
| KB-H02 | 0 thông điệp hydration (`hydrat…`, `did not match`, React #418/#423/#425) và 0 `console.error`/`pageerror` ngoài allowlist `/auth/refresh` | 0 |
| KB-H03 | `h1` prerender không bị gỡ/thay (MutationObserver `removedNodes`) | không |
| KB-H04 | CLS < 0,1 (`PerformanceObserver layout-shift`, bỏ `hadRecentInput`, đến `networkidle` + 1 s) | đạt — **chỉ cho kịch bản này, không tuyên bố Core Web Vitals production** |
| KB-H05 | route KB hợp lệ ⇒ hydrate (marker); `/`, slug lạ ⇒ `createRoot` bình thường; không lỗi double root; không lỗi tải asset | đạt |
**Artifacts:** `hydration-report.json` + log (Owner lưu vào `docs/implementation/archive/sprint-f6/evidence/`), ảnh nếu cần. Không dùng `waitForTimeout`; chờ bằng điều kiện tường minh (`waitForLoadState`, `expect`, `waitForFunction`).
**Quyết định:**
- **PASS** (tất cả H01–H05 đạt, D-F6-A1 confirmed, không lỗi nghiêm trọng ở route CSR): Owner xác nhận; commit nhỏ đổi mặc định cờ `VITE_ENABLE_HYDRATION` thành bật (hoặc bỏ điều kiện) + cập nhật Matrix/Decision Log.
- **FAIL / thiếu bằng chứng:** **giữ cờ tắt** ⇒ fallback (a) `createRoot`; SEO/prerender/điều hướng **không bị chặn**; Known Gap ghi: tiêu chí không đạt, môi trường, lệnh, actual vs expected, log/ảnh, ảnh hưởng (HTML prerender bị thay khi React khởi chạy — **không** tuyên bố bảo toàn markup), hành động tiếp theo. **Không** tự retry/tự bật.
**Tắt nhánh an toàn / chứng minh fallback:** cờ tắt ⇒ `shouldHydrate` trả `disabled`; chạy `npm run verify:hydration -- --fallback` (hoặc `npm run build` mặc định + `vite preview`): trang KB vẫn hiển thị (HTML prerender được thay bằng CSR) và route CSR hoạt động; không `hydrateRoot` được gọi (assert bằng cờ log).
**Hạn chế:** cổng **không** vào CI (D-F6-P2b; CI không cài browser trước build) ⇒ Known Gap "không tự động trong CI".

---

## 18. File-Level Change Plan
| File | Trạng thái | Thay đổi | Task | Test |
|---|---|---|---|---|
| `frontend/package.json` | có | thêm `build:prerender`, `verify:hydration`; sửa `build` | F6.5.5, .7 | `npm run build` |
| `frontend/.env.example` | có | chú thích `PRERENDER_STRICT`, `VITE_ENABLE_HYDRATION` (mặc định tắt) | F6.5.2, .7 | — |
| `frontend/vite.config.ts` | có | **chỉ nếu** D-F6.5-11: `build.copyPublicDir:false` khi `isSsrBuild` | F6.5.5 | build SSR |
| `…/knowledge-base/model/siteUrl.ts` + test | có | thêm `resolveSiteUrlForBuild`, `parseStrictFlag` | F6.5.2 | KB-U24 |
| `…/knowledge-base/model/seo.ts` + test | có | thêm `buildSitemapXml`, `buildRobotsTxt`, `serializeHeadTags` | F6.5.2 | KB-U18–U21 |
| `…/knowledge-base/index.ts` | có | xuất các hàm mới (chỉ nếu SSR entry/test cần qua barrel) | F6.5.2 | boundaries |
| `frontend/src/prerender/entry-server.tsx` | **mới** | `render`, `listPrerenderRoutes`, `buildHead` | F6.5.3 | KB-U-ssr |
| `frontend/src/prerender/marker.ts` | **mới** | `PRERENDER_VERSION`, tên thuộc tính marker | F6.5.3 | — |
| `frontend/src/prerender/validate.ts` (+test) | **mới** | `validatePrerenderOutput` (KB-P01…P11 thuần), `injectIntoTemplate` | F6.5.4 | KB-P (đơn vị) |
| `frontend/scripts/prerender.mjs` | **mới** | I/O mỏng + exit code | F6.5.4 | KB-P (build thật) |
| `frontend/src/widgets/marketing-layout/index.tsx` + `MarketingLayout.test.tsx` | có | 2 `NavLink` + footer `nav` | F6.5.6 | KB-U-nav |
| `frontend/e2e/knowledge-base.spec.ts` | có | KB-E09 | F6.5.6 | E2E |
| `frontend/src/app/hydrate.ts` (+test) | **mới** | `shouldHydrate`, `readPrerenderMarker`, `hydrateKnowledge`, `tryHydrateKnowledge` | F6.5.7 | KB-U25 |
| `frontend/src/main.tsx` | có | nhánh có điều kiện (D-F6-A1) | F6.5.7 | build + `verify` |
| `frontend/src/shared/hooks/usePageMeta.ts` (+test) | có | nhận diện tag `data-prerendered` (D-F6.5-06) | F6.5.7 | KB-U45… |
| `frontend/scripts/verify-hydration.mjs` | **mới** | cổng (Playwright API) | F6.5.7 | chạy bởi Owner |
| `docs/…/Sprint_F6_F6.5_Exit_Criteria_Evidence_Matrix.md`, Known Gaps, F6 plan, README FE | mới/có | evidence + đồng bộ | F6.5.9 | — |
| **Giữ nguyên** | `playwright.config.ts`, CI workflow, `router.tsx`, Listing/Detail UI, `backend/**`, `tailwind.config.ts`, `package-lock.json` (không đổi) | — | — | — |
Không tạo file chỉ vì có trong danh sách candidate: `src/.../site-url.ts` **không** tạo (đã có `siteUrl.ts`); `robots.txt`/`sitemap.xml` là **output** (không commit).

---

## 19. Milestone & Task Breakdown
*Effort S/M/L = ước lượng tương đối chủ quan (không có số liệu vận tốc đáng tin). Mỗi task: commit riêng.*

### F6.5.1 — Repository Audit & Feasibility (S)
- **Objective:** xác nhận điều kiện vào, ghi baseline, lặp spike trong repo. **Context:** mục 2–4. **Files:** không sửa. **Changes:** none. **Depends:** Owner duyệt plan.
- **Steps:** git sạch; `npm ci`; `.env` ← example; `format:check`, `lint`, `typecheck`, `test`, `build`, `playwright --list` (kỳ vọng 170/1.416; 69/10); ghi entry/chunk; lặp spike: `vite build --ssr` thử với entry tạm (không commit) + render 3 URL + hydrate jsdom có/không nạp sẵn cache; `vite preview` với/không `knowledge.html`.
- **Acceptance:** baseline xanh; P1 PASS được tái hiện trong repo (hoặc lệch giải thích); D-F6-A1 ghi CONFIRMED + nguồn. **Tests:** không mới. **Evidence:** log + bảng. **Risks:** số liệu trôi. **Exit:** không blocker chưa ghi.

### F6.5.2 — Site URL & SEO Foundation (M)
- **Objective:** hàm thuần + test. **Files:** `siteUrl.ts`, `seo.ts` (+test), `.env.example`, barrel. **Changes:** mục 11.2.
- **Depends:** F6.5.1. **Steps:** test-first `parseStrictFlag`, `resolveSiteUrlForBuild` (bảng 11.3), `serializeHeadTags` (escape), `buildSitemapXml`, `buildRobotsTxt`.
- **Acceptance:** KB-AC-26–30 phần thuần; không hardcode domain; không `og:image`. **Tests:** KB-U18–U21, U24 (mục 21.1). **Evidence:** log vitest + `git grep` không có domain cứng. **Risks:** lệch hợp đồng client (`resolveSiteUrl` không đổi). **Exit:** pure functions có test, strict rõ.

### F6.5.3 — Dedicated SSR Entry (M)
- **Files:** `src/prerender/entry-server.tsx`, `marker.ts`. **Depends:** F6.5.2.
- **Steps:** entry theo mục 12; `listPrerenderRoutes`; `buildHead`; test trong Vitest (`@vitest-environment node`) **trước** khi có script.
- **Acceptance:** listing/bài/unknown đúng; không browser API; không rò state. **Tests:** KB-U-ssr (mục 21.2). **Evidence:** log + `vite build --ssr` thành công. **Risks:** import nhầm `router.tsx`; `env.ts` cần biến. **Exit:** SSR build + render OK; CSR không đổi.

### F6.5.4 — Prerender Script & SEO Files (L)
- **Files:** `scripts/prerender.mjs`, `src/prerender/validate.ts` (+test). **Depends:** F6.5.3.
- **Steps:** script theo mục 13; validator KB-P01…P11 thuần + test **âm** (mỗi lỗi một fixture); chạy trên build thật.
- **Acceptance:** KB-AC-26–31; 2 file listing + 1 file/bài; sitemap/robots; strict hoạt động; thiếu `VITE_SITE_URL` ở strict ⇒ fail. **Tests:** KB-P01–P11. **Evidence:** log build, inventory `dist/`, HTML inspection `/knowledge` + 1 bài. **Risks:** chèn template sai; Windows path. **Exit:** exit code đúng cả đường vui lẫn lỗi.

### F6.5.5 — Build Integration (M)
- **Files:** `package.json`, (tuỳ chọn) `vite.config.ts`. **Depends:** F6.5.4.
- **Steps:** sửa script; `npm run build` từ `dist` sạch; chạy hai lần liên tiếp; xoá/đổi tên 1 bài để thử stale; `vite preview` + `curl` `/knowledge`, `/knowledge/`, bài, slug lạ, `/`; CI giữ xanh.
- **Acceptance:** KB-AC-31/32 phần build; preview đúng như bảng [SPIKE]; không còn file cũ. **Evidence:** log + bảng curl. **Risks:** CI thiếu env; thời gian build. **Exit:** một lệnh build tạo đủ output.

### F6.5.6 — Navigation Integration (S) — **song song được** với F6.5.2–.5 (không phụ thuộc)
- **Files:** `marketing-layout/index.tsx`, `MarketingLayout.test.tsx`, `e2e/knowledge-base.spec.ts`. **Steps/Tests:** mục 15. **Acceptance:** KB-AC-06; không hồi quy responsive/`layout.spec.ts`. **Evidence:** log + E2E CI + ảnh nav (tuỳ Owner). **Risks:** active state style; selector E2E cũ. **Exit:** D-F6-N1 đúng.

### F6.5.7 — Conditional Hydration Infrastructure (L) — **được phép (A1 confirmed)**, **không bật**
- **Files:** `hydrate.ts`, `main.tsx`, `usePageMeta.ts`, `verify-hydration.mjs`, `package.json`, `.env.example`. **Depends:** F6.5.4 (cần HTML prerender có marker), F6.5.5.
- **Steps:** `shouldHydrate` test-first (KB-U25); `hydrateKnowledge` (nạp sẵn cache, `onRecoverableError`→`reportError`); nhánh `main.tsx`; hook nhận diện tag prerender; script cổng.
- **Acceptance:** cờ tắt ⇒ hành vi **y hệt** hiện tại (test); cờ bật ⇒ hydrate đúng trong jsdom; không double-root. **Tests:** KB-U25, hook, tích hợp jsdom (`hydrateRoot` + SSR HTML thật từ build). **Evidence:** log + chạy thử script ở dev. **Risks:** top-level await; StrictMode; mismatch thật chỉ lộ ở trình duyệt. **Exit:** Owner có thể chạy cổng.

### F6.5.8 — Owner Hydration Gate & Decision (S, Owner-run)
Mục 17. **Exit:** quyết định Owner + evidence; không trạng thái mơ hồ.

### F6.5.9 — Documentation, Regression & Closure (S)
Mục 25. **Exit:** traceability đầy đủ; không deviation chưa ghi.

---

## 20. Dependency Graph
```
F6.5.1 ─► F6.5.2 ─► F6.5.3 ─► F6.5.4 ─► F6.5.5 ─► F6.5.7 ─► F6.5.8 (Owner) ─► F6.5.9
   └────────────► F6.5.6 (Navigation) ─────────────────────────────────────────┘
```
| Loại | Task |
|---|---|
| **Blocking tuần tự** | 1→2→3→4→5; 7 sau 4+5; 8 sau 7; 9 cuối |
| **Song song** | F6.5.6 ∥ 2–5 |
| **Hydration (cần A1 — đã confirmed)** | F6.5.7, F6.5.8 |
| **Không bị chặn bởi hydration** | 1–6 và 9; nếu cổng FAIL vẫn đóng F6.5 với fallback |
| **Owner-run** | F6.5.8; cung cấp domain; đặt env strict |

---

## 21. Test Strategy & Test Matrix

### 21.1 Unit — hàm thuần
| ID | File | Kịch bản |
|---|---|---|
| KB-U24 | `siteUrl.test.ts` | `parseStrictFlag` (true/1/false/0/rỗng/**giá trị lạ ⇒ lỗi**); `resolveSiteUrlForBuild`: hợp lệ; thiếu non-strict ⇒ fallback+warning; thiếu strict ⇒ `MISSING`; sai định dạng ⇒ `INVALID` (cả non-strict); strict + `http:` ⇒ `NOT_HTTPS`; strict + `localhost`/`127.0.0.1`/`10.x` ⇒ `LOCAL_HOST`; trailing slash chuẩn hoá; path/query/hash bị từ chối |
| KB-U18 | `seo.test.ts` | title/description/OG list & bài; **không** có `og:image`; `serializeHeadTags` escape `& < > " '`; tiêu đề có ký tự đặc biệt; không trùng thẻ |
| KB-U19 | `seo.test.ts` | canonical: không `//`, không `/` cuối; `siteUrl` có `/` cuối; slug mã hoá |
| KB-U20 | `seo.test.ts` | `buildSitemapXml`: `/knowledge` + mọi bài, **không** `/`; không trùng; `lastmod`; escape; rỗng bài |
| KB-U21 | `seo.test.ts` | `buildRobotsTxt`: đúng văn bản duyệt, `Sitemap:` theo `siteUrl`, không placeholder |
| KB-U25 | `hydrate.test.ts` | `shouldHydrate`: hợp lệ ⇒ true; từng điều kiện thiếu ⇒ `reason` tương ứng (cờ tắt, không root, không marker, route không phải KB, route lệch marker, version lệch, `h1Count≠1`); `/knowledge/` ≡ `/knowledge` |
| KB-U-nav-1…6 | `MarketingLayout.test.tsx` | mục 15 |

### 21.2 SSR entry — KB-U-ssr (`@vitest-environment node`)
Gọi trực tiếp `render()` (không cần build): (1) listing: `h1 "Kiến thức chiêm tinh"`, ≥1 `article`, nhóm lọc, `main#main-content`; (2) bài hợp lệ: `h1` = tiêu đề, thân bài có `h2`; (3) bài có heading (fixture qua `vi.spyOn(knowledgeContentService,"getArticle")`); (4) bài có liên kết nội bộ → `<a href="/knowledge/…">` (fixture); (5) metadata: `buildHead` đúng title/description/canonical/OG; (6) **không browser API**: môi trường node (`window`/`document` undefined) ⇒ không ném; (7) unknown slug ⇒ `ArticleNotFound` (`h1`), không ném; (8) `content-error` ⇒ `render` ném; (9) render lần lượt listing→bài→listing **y hệt** lần đầu (không rò state; QueryClient mới mỗi lần). Expected output định nghĩa bằng assert cấu trúc (không chỉ `length > 0`).

### 21.3 Prerender self-validation — KB-P01…P11 (**giữ nguyên ID/ý nghĩa nguồn** F6 plan §9.2)
| ID | Nội dung nguồn | Phủ | Expected | Evidence |
|---|---|---|---|---|
| KB-P01 | `<title>` mỗi file, **duy nhất** | KB-AC-26 | đúng 1 `title`, khác nhau giữa các file | báo cáo script |
| KB-P02 | meta description | KB-AC-27 | đúng 1, khớp `summary`/mô tả duyệt | |
| KB-P03 | canonical đúng host, không `/` cuối | KB-AC-28 | `${siteUrl}/knowledge[/slug]` | |
| KB-P04 | OG tối thiểu, không trùng | D-F6-D1 | `og:title/description/type/url`; **không** `og:image` | |
| KB-P05 | sitemap = `/knowledge` + manifest, chỉ URL có file | KB-AC-29, D-F6-S1 | tập URL = manifest; không `/`; không trùng | `dist/sitemap.xml` |
| KB-P06 | robots + dòng `Sitemap` | KB-AC-30 | văn bản duyệt | `dist/robots.txt` |
| KB-P07 | đúng 1 `<h1>` + nội dung đủ dài | KB-AC-31 | `h1`=1; thân bài ≥ ngưỡng (đặt khi triển khai, ví dụ ≥ 200 ký tự; ngưỡng ghi trong script) | |
| KB-P08 | thông điệp rõ khi sai/thiếu `VITE_SITE_URL` | D-F6-P4 | lỗi nêu biến + cách sửa | log lỗi cố ý |
| KB-P09 | đủ file layout: `knowledge.html`, `knowledge/<slug>.html`, `knowledge/index.html` | D-F6-P5/P5b/A3 | đủ + không `…/<slug>/index.html` | inventory `dist/` |
| KB-P10 | marker `data-prerendered` đúng route/version | D-F6-P2 | khớp route, `version` = hằng | |
| KB-P11 | `PRERENDER_STRICT` fail đúng | D-F6-P4b | `true`+thiếu/localhost/http ⇒ exit ≠ 0; non-strict ⇒ warning | log chạy 3 cấu hình |
Mapping sang danh mục gợi ý của prompt §7.3: (listing HTML ⇒ P09/P07; bài có file ⇒ P09; nội dung thật ⇒ P07; flat path ⇒ P09; canonical ⇒ P03; SEO đủ ⇒ P01/P02/P04; sitemap ⇒ P05; robots ⇒ P06; không placeholder/local ⇒ P08/P11; fail khi thiếu ⇒ P08/P11) — **giữ ID nguồn**. Mỗi KB-P có test thuần trên `validatePrerenderOutput` với fixture đúng **và** sai.

### 21.4 Integration & E2E
KB-E09 (nav desktop/mobile/footer); `verify` trên `vite preview`: `fetch` `/knowledge`, `/knowledge/`, bài, slug lạ, `/` — `curl`-level (HTML có nội dung/marker hay SPA shell); E2E hiện có chạy trên dev server (D-F6-T1, không đổi); canonical/metadata theo từng bài đã ở KB-P; CSR route hiện có (E2E CI + test router); **không** giảm coverage/xoá test.

### 21.5 Hydration tests
KB-U25 (thuần); tích hợp jsdom: SSR HTML thật (từ `render`) → `hydrateRoot` → 0 recoverable error, HTML không đổi, **có** và **không** nạp sẵn cache (ca không nạp ⇒ phải thất bại — chứng minh bước nạp sẵn cần thiết); cờ tắt ⇒ `createRoot`; KB-H01–H05 do Owner chạy.

### 21.6 Quality gates & hồi quy
`format:check`, `lint`, `typecheck` (gồm `src/prerender/**`), `npm test` (≥ baseline 170/1.416), `npm run build` (gồm prerender), `CI=1 npx playwright test --list` (≥ 69/10), E2E CI, `npm audit` + `--omit=dev` (mốc 4 lỗ hổng production; ghi số, **không** `audit fix`), cổng CSS (Phụ lục A F6.3 trên file mới). Không đổi coverage config.

---

## 22. KB-AC Traceability — xem mục 5.2 và 21; trạng thái toàn bộ **PENDING**.

---

## 23. Risk Register

### 23.1 Blocker xác nhận: **không có.**
### 23.2 Rủi ro
| ID | Rủi ro | Tác động | Khả năng | Giảm thiểu | Verification |
|---|---|---|---|---|---|
| R1 | **D-F6-A1** | — | — | **CONFIRMED** (nguồn gốc `Confirmation.md` NOT VERIFIED) — không chặn | Matrix |
| R2 | Mã SSR-unsafe (import `router.tsx`, module-scope `window`) | Cao | TB | SSR entry không import router/App; render trong Node + KB-U-ssr (node env) | KB-U-ssr, build |
| R3 | **Hydration mismatch** (thiếu nạp sẵn cache; tag meta; nút auth; extension) | Cao | TB | nạp sẵn cache; cờ tắt mặc định; cổng Owner; fallback (a) | KB-H01–H05 |
| R4 | **Nginx/deploy** (map `/knowledge` ↔ `knowledge.html`, không redirect, slug lạ trả 404 thật; `vite preview` ≠ Nginx; **trả SPA shell cho `/knowledge` nếu thiếu `knowledge.html`** [SPIKE]) | Cao | Chắc chắn (chưa có) | ghi Deployment Notes + Known Gap; không sửa infra; sinh cả 2 file layout | Known Gap |
| R5 | **SEO config** (domain chưa có; localhost lọt production) | Cao | TB | strict + validator; Owner action | KB-P08/P11 |
| R6 | **Stale output** | TB | Thấp | `vite build` xoá `dist`; script xoá trước + parity | KB-P09, build lặp |
| R7 | Hồi quy build/CSR | Cao | Thấp | SSR ra `dist-ssr`; `build` hồi quy đầy đủ; E2E CI | gate |
| R8 | `env.ts` đòi `VITE_API_BASE_URL` lúc SSR | TB | Cao nếu env thiếu | thông báo rõ; CI có `.env` | build thiếu env |
| R9 | `usePageMeta` khôi phục metadata sai sau hydrate | TB | Cao nếu bật hydrate | D-F6.5-06 + test | hook test |
| R10 | Chỉ 1 bài ⇒ cổng/E2E phủ hẹp | TB | Chắc chắn | chạy lại sau F6.6; Known Gap | Matrix |
| R11 | Windows (path, `file://`, CRLF) vs Linux CI | TB | TB | `pathToFileURL`, `path.join`, `\r?\n`; Owner chạy cổng trên Windows | Owner log |
| R12 | CLS do auth bootstrap đổi header sau hydrate | Thấp | TB | đo H04; ghi giới hạn | KB-H04 |
| R13 | Thời gian/độ ổn định `npm run build` | Thấp | Thấp | đo; không cam kết số | build log |
| R14 | Cổng hydration không tự động trong CI | TB | Chắc chắn | Known Gap (D-F6-P2b) | Registry |
| R15 | `Disallow: /app/` không phủ `/app` | Thấp | Chắc chắn | ghi nhận; văn bản đã duyệt | — |
| R16 | Top-level `await` trong `main.tsx` | Thấp | Thấp | kiểm build; bọc IIFE nếu cần | build |

---

## 24. Owner Actions & Open Decisions
**Owner actions:** (1) cung cấp **domain production** và đặt `VITE_SITE_URL` + `PRERENDER_STRICT=true` ở pipeline deploy (chưa có pipeline); (2) duyệt D-F6-A2/A3/A4 và các `D-F6.5-*` dưới đây; (3) **chạy cổng hydration** cục bộ (cài Chromium) và ra PASS/FAIL; (4) (hoãn) cấu hình Nginx theo yêu cầu vận hành ở mục 27.
| ID | Nội dung | Mặc định [REC] | Cần trước |
|---|---|---|---|
| **D-F6.5-01** | Sinh **cả** `dist/knowledge.html` và `dist/knowledge/index.html` (A3 thành bắt buộc), canonical `/knowledge` | đồng ý | F6.5.4 |
| **D-F6.5-02** | D-F6-A2: strict yêu cầu `https:` + không `localhost`/IP nội bộ | đồng ý | F6.5.2 |
| **D-F6.5-03** | D-F6-A4: URL sai **luôn** fail; `PRERENDER_STRICT` giá trị lạ ⇒ fail | đồng ý | F6.5.2 |
| **D-F6.5-04** | Hydration điều khiển bằng cờ build-time `VITE_ENABLE_HYDRATION` (mặc định tắt); cổng tự build có cờ | đồng ý | F6.5.7 |
| **D-F6.5-05** | Server render **chính** page component + cache nạp sẵn; hydrate bắt buộc nạp sẵn cache; `Suspense fallback={null}` ở server (hoặc chuyển `SuspenseFallback` sang `shared` — D-F6.5-05b) | đồng ý | F6.5.3 |
| **D-F6.5-06** | `usePageMeta` nhận diện tag `data-prerendered`/`data-base-title` | đồng ý | F6.5.7 |
| **D-F6.5-07** | Logic prerender/validator viết bằng TS trong `src/prerender/`, `.mjs` mỏng | đồng ý | F6.5.3 |
| **D-F6.5-08** | UI Spec/CHANGELOG/README cập nhật ở F6.7 (D-F6-K/R); F6.5 ghi as-built + "Closure" trong Matrix (thay vì báo cáo riêng) | đồng ý | F6.5.9 |
| **D-F6.5-09** | Manifest rỗng: strict fail, non-strict cảnh báo | đồng ý | F6.5.4 |
| **D-F6.5-10** | `NavLink` "Kiến thức" **không `end`** (active ở `/knowledge/:slug`) | đồng ý | F6.5.6 |
| **D-F6.5-11** | `copyPublicDir:false` cho SSR build (sửa `vite.config.ts`) hay chấp nhận bản sao `public/` trong `dist-ssr` | chấp nhận (không sửa config) | F6.5.5 |
| (nhắc) | D-F6-K: làm rõ Architecture §5.1 (ngoại lệ prerender) — cần Owner duyệt | — | F6.5.9 |
**Có thể quyết khi triển khai:** ngưỡng độ dài P07; tên hằng marker; định dạng báo cáo.

---

## 25. Documentation & Evidence Plan
| Tài liệu | Cập nhật ở F6.5 |
|---|---|
| UI Spec §11 | ghi as-built (nav/footer tối thiểu — lệch có chủ đích so với §11.1/11.2) — **sửa thật ở F6.7 theo D-F6.5-08**; ghi trong Matrix |
| Architecture §5.1 | nếu D-F6-K duyệt: ngoại lệ prerender (ở F6.7) |
| F6 plan | ghi D-F6.5-*, trạng thái A2–A4, kết quả cổng; sửa §6.5–6.7 cho khớp (layout 2 file, cờ hydrate, SuspenseFallback) |
| Known Gaps | domain production; `og:image` (D-F6-D1); Nginx mapping (R4); hydration FAIL (nếu); cổng không tự động CI; chỉ 1 bài khi chạy cổng; `PRERENDER_STRICT` chưa ép tự động; `Disallow: /app/` |
| Evidence Matrix F6.5 | từng task/AC/test/evidence (SHA, CI, baseline vs sau, log build, inventory `dist/`, HTML inspection, bảng `curl` preview, kết quả KB-P, báo cáo cổng Owner) |
| CHANGELOG / README FE | F6.7 (README: `VITE_SITE_URL`, `PRERENDER_STRICT`, cờ hydrate, "chỉ deploy `dist/`", yêu cầu hosting) |
| Closure | mục "Closure notes" trong Matrix (D-F6-R); báo cáo sprint ở F6.7 |
**Evidence bắt buộc (prompt §12):** audit, P1 feasibility, unit/SSR reports, KB-P validation, build log, `dist/` inventory, HTML `/knowledge` + ≥1 bài, sitemap/robots, `vite preview`, navigation tests, CSR regression, báo cáo cổng Owner + quyết định. **Không ghi PASS khi chưa có execution evidence.**

---

## 26. Definition of Done
**Navigation**
- [ ] Desktop Navbar đúng 1 `NavLink` `Kiến thức` → `/knowledge`.
- [ ] Mobile drawer đúng 1 `NavLink`; click đóng drawer.
- [ ] Footer có `nav aria-label="Chân trang"` + 1 link `/knowledge`, không heading hiển thị.
- [ ] `MarketingLayout.test.tsx` cập nhật, pass; KB-E09 pass; không hồi quy responsive/`layout.spec.ts`.

**Site URL & SEO**
- [ ] `VITE_SITE_URL` xử lý qua `resolveSiteUrl*` (một nguồn); `PRERENDER_STRICT` có hành vi rõ + test.
- [ ] Production strict: thiếu/sai ⇒ **build fail**; local fallback chỉ khi non-strict.
- [ ] Canonical, title duy nhất, description, OG title/description/type/url đúng; **không** `og:image`.

**Prerender**
- [ ] SSR entry + `scripts/prerender.mjs` hoạt động; `dist/knowledge.html`, `dist/knowledge/index.html` (D-F6.5-01), `dist/knowledge/{slug}.html` cho mọi bài.
- [ ] HTML có nội dung thật (không shell); flat output đúng; không `…/<slug>/index.html`.
- [ ] `sitemap.xml` (listing + bài, không `/`), `robots.txt` (văn bản duyệt); không placeholder/localhost ở strict.
- [ ] Không còn output cũ sau build; KB-P01…P11 pass (thuần + build thật).

**Build & Preview**
- [ ] `npm run build` chạy cả pipeline; `npm run build:prerender` chạy riêng đúng; `dist/` đủ file; CI xanh.
- [ ] `vite preview` trả HTML prerender cho `/knowledge`, `/knowledge/`, bài; CSR route hoạt động; không cần Backend.

**Tests**
- [ ] KB-U24, KB-U18–U21, KB-U25, KB-U-ssr, KB-U-nav, hồi quy toàn bộ, E2E hiện có.

**Hydration Gate**
- [ ] D-F6-A1 ghi CONFIRMED + nguồn; `hydrate.ts`, nhánh `main.tsx`, `onRecoverableError`→`reportError`, `verify:hydration` triển khai; **cờ tắt mặc định**.
- [ ] Owner chạy cổng; có evidence PASS/FAIL; PASS ⇒ Owner xác nhận bật; FAIL ⇒ cờ tắt, CSR fallback, Known Gap.
*(Các ô hydration không được đánh dấu chỉ vì code compile — cần evidence do Owner chạy và quyết định cuối.)*

**Documentation**
- [ ] Matrix F6.5, Known Gaps, F6 plan đồng bộ; UI Spec/CHANGELOG/README theo D-F6.5-08; closure notes.

---

## 27. Rollback / Fallback Strategy
| Tình huống | Hành động |
|---|---|
| Hydration FAIL / chưa đủ bằng chứng | cờ `VITE_ENABLE_HYDRATION` **tắt** (mặc định) ⇒ `createRoot`; prerender/SEO/nav giữ; Known Gap |
| Prerender fail ở production | `npm run build` đỏ ⇒ không phát hành (đúng thiết kế); chế độ non-strict chỉ cho local/CI |
| Cần gỡ prerender hoàn toàn | revert script `build` về `tsc && vite build` (1 dòng) — app CSR không phụ thuộc prerender; `dist-ssr` bỏ |
| Nav gây lỗi | revert commit F6.5.6 (độc lập) |
| **Yêu cầu vận hành cho deployment layer (Nginx — hoãn):** `/knowledge` → `dist/knowledge.html`; `/knowledge/{slug}` → `dist/knowledge/{slug}.html`; **không** lộ `.html`; **không** redirect `/knowledge/`↔`/knowledge`; **không** để SPA fallback che thiếu bài đã prerender; slug lạ trả **404 thật** nhưng vẫn phục vụ SPA để hiển thị Not Found (ví dụ `error_page 404 /index.html` giữ status 404). Ví dụ trong `Confirmation.md` (`try_files … =404` dưới `location /knowledge/`) **không khớp `/knowledge`** — không sao chép; kiểm khi có staging. `vite preview` **không** chứng minh Nginx hoạt động |

---

## 28. Estimated Implementation Sequence (S/M/L — tương đối, chủ quan)
1. F6.5.1 (S) → 2. F6.5.2 (M) ∥ F6.5.6 (S) → 3. F6.5.3 (M) → 4. F6.5.4 (L) → 5. F6.5.5 (M) → 6. F6.5.7 (L) → 7. **Owner gate** F6.5.8 → 8. F6.5.9 (S).
Đóng F6.5 **không** phụ thuộc kết quả cổng: PASS ⇒ bật; FAIL ⇒ fallback + Known Gap. Không cam kết giờ/ngày.

---

## 29. Final Readiness Assessment
| Hạng mục | Đánh giá |
|---|---|
| **P1 SSR feasibility** | **PASS** (build SSR + render Node + lặp lại + không browser API) — evidence mục 2 [SPIKE]; cần lặp lại trong repo ở F6.5.1 |
| **Hydration** | **CONDITIONAL** — sạch trong jsdom khi nạp sẵn cache; chưa kiểm trình duyệt thật ⇒ cổng Owner |
| **D-F6-A1** | **CONFIRMED** (F6 plan §3.1/§14.2, Matrix F6.0); nguồn gốc `Confirmation.md` **NOT VERIFIED** |
| **Blocker** | không |
| **Sẵn sàng để triển khai** | **Có** — sau khi Owner duyệt D-F6.5-01…11 và D-F6-A2/A4; F6.5.1 có thể bắt đầu ngay |
| **NOT VERIFIED** | hydration trên trình duyệt thật; chạy trên Windows; thời gian build thực; Nginx; PRD FR-14 văn bản gốc; log CI chi tiết |
| **Self-check** | approved decisions phản ánh ✔; A1 xử lý đúng gate ✔; gate phân biệt Owner-run PASS/FAIL ✔; CSR fallback rõ ✔; `build` đủ pipeline ✔; flat HTML ✔; SEO URL dùng chung một nguồn ✔; sitemap/robots đúng S1 ✔; Nginx ngoài scope ✔; `og:image` Known Gap ✔; Navigation đúng N1 ✔; KB-U-ssr + KB-P01…P11 ✔; KB-AC-06, 26–32 có traceability ✔; **chỉ tạo plan, chưa triển khai code** ✔ |
