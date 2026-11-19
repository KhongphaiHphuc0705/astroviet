# Sprint F6 — Milestone F6.0 Exit Criteria Evidence Matrix

> **Sprint:** F6 — Knowledge Base (MVP, Frontend-only)  
> **Milestone:** F6.0 — Entry Gate & Quality Baseline  
> **Target Version:** `[Unreleased]` (Hiện tại `package.json` là `0.4.0` đã phát hành ở Sprint F5 ngày 2026-11-09; toàn bộ thay đổi của Sprint F6 được ghi nhận dưới mục `[Unreleased]`, chưa bump version; Git release tag `v0.4.0` chưa có trên origin — hiện chỉ có `v0.3.0`, câu hỏi Q2 còn mở)  
> **Execution Date:** 2026-11-18  
> **Branch / Head Commit:** `dev` @ `23f965a`  
> **Status:** **PASS — ENTRY GATE COMPLETED**  

---

## 1. Mục tiêu & Phạm vi Milestone F6.0

Xác lập cổng đầu vào kỹ thuật cho Sprint F6:
1. Xác nhận trạng thái nhánh nền `dev` đã đồng bộ với `main` sau Sprint F5 (PR #67).
2. Đo đạc và ghi nhận đầy đủ bộ chỉ số chất lượng baseline (format, lint, typecheck, test, build, E2E count, audit) trước khi thay đổi bất kỳ file mã nguồn nào của Sprint F6.
3. Ghi nhận toàn bộ các quyết định phê duyệt của Owner đã được chốt (bao gồm quyết định `D-F6-A1` chốt ngày 2026-11-18 về nhánh hydrate có điều kiện).

---

## 2. Bảng đo đạc Quality Baseline (Pre-Implementation Baseline)

| Chỉ số kiểm thử / Công cụ | Lệnh thực thi | Kết quả thực tế | Trạng thái | Ghi chú kỹ thuật |
|---|---|---|---|---|
| **Format Check (Prettier)** | `npm run format:check` | `All matched files use Prettier code style!` | **PASS** | Exit code 0; tự động xử lý line-ending tương thích Windows/Linux |
| **Lint (ESLint)** | `npm run lint` | `0 errors, 0 warnings` | **PASS** | Exit code 0; quy chuẩn `jsx-a11y`, `no-console`, `import/order` |
| **Typecheck (TypeScript)** | `npm run typecheck` | `0 errors` | **PASS** | Exit code 0; kiểm tra cả `tsconfig.app.json` và `tsconfig.node.json` |
| **Unit & Integration Tests (Vitest)** | `npm run test` | **145 passed (145 files)**<br>**1.205 passed (1.205 tests)** | **PASS** | Thời gian chạy 227.20s; 0 test fail, 0 flaky |
| **Production Build (Vite)** | `npm run build` | `built in 7.48s` | **PASS** | 2.155 modules transformed; `dist/index.html` và assets băm sinh đầy đủ |
| **Playwright E2E Suite Count** | `CI=1 npx playwright test --list` | **60 tests in 9 files** | **PASS** | Khớp 100% với baseline đóng Sprint F5 (`interpretation.spec.ts` 12, `interpretation-responsive.spec.ts` 7, `chart.spec.ts` 17, `chart-list.spec.ts` 8, `birth-profile.spec.ts` 4, `auth.spec.ts` 3, `layout.spec.ts` 2, `Select.spec.ts` 2, `smoke.spec.ts` 2) |
| **Dependency Security Audit** | `npm audit` / `npm audit --omit=dev` | **Tổng: 34 lỗ hổng** (10 moderate, 21 high, 3 critical)<br>• **Production:** 4 lỗ hổng (1 moderate, 3 high): `axios` (high, trực tiếp), `zod` (high, trực tiếp), `follow-redirects` (high, gián tiếp), `fast-uri` (moderate, gián tiếp).<br>• **Dev dependencies:** 30 lỗ hổng (9 moderate, 18 high, 3 critical). | **RECORDED** | Kết quả phụ thuộc vào ngày chạy và cơ sở dữ liệu GitHub Advisory; ghi nhận chính xác phân bổ trước khi cài `react-markdown` |

---

## 3. Nhật ký Quyết định & Điểm Làm rõ của Owner

### 3.1 Quyết định đã duyệt [AD]
| Quyết định | Nội dung phê duyệt | Trạng thái | Nguồn phê duyệt |
|---|---|---|---|
| **D-F6-OWN-1** | Cài đặt `react-markdown@10.1.0`; **chưa** cài `remark-gfm` ở MVP (chỉ xem xét ở F6.6 nếu bài viết cần bảng) | **ĐÃ DUYỆT [AD]** | Owner Confirmation 2026-11-14 |
| **D-F6-OWN-2** | Lọc theo 5 chủ đề là đủ; **không** làm phân trang (pagination) hay tìm kiếm (search) ở MVP | **ĐÃ DUYỆT [AD]** | Owner Confirmation 2026-11-14 |
| **D-F6-OWN-3** | Prerender Knowledge Base lúc build ngay từ đầu | **ĐÃ DUYỆT [AD]** | Owner Confirmation 2026-11-14 |
| **D-F6-OWN-4** | Giữ phạm vi MVP: diễn giải theo cung/nhà; góc chiếu và FR-08 sang v1.1 | **ĐÃ DUYỆT [AD]** | Owner Confirmation |
| **D-F6-P1** | Duyệt phương án Prerender P1 (Vite SSR build + Node script nội bộ, 0 dependency framework mới) | **ĐÃ DUYỆT [AD]** | Owner Confirmation |
| **D-F6-P2** | Client hydration: nhánh (b) `hydrateRoot` cho route KB có `data-prerendered`, fallback duyệt = (a) `createRoot` nếu cổng không đạt | **ĐÃ DUYỆT [AD]** | Owner Confirmation |
| **D-F6-P2b** | Cổng kiểm chứng hydration: script riêng `verify-hydration.mjs` chạy cục bộ trên `vite preview` | **ĐÃ DUYỆT [AD]** | Owner phản hồi 2026-11-16 |
| **D-F6-P3** | Tích hợp bước prerender vào lệnh `npm run build` | **ĐÃ DUYỆT [AD]** | Owner Confirmation |
| **D-F6-P4 / P4b** | Biến `VITE_SITE_URL` (bắt buộc fail build khi thiếu lúc prerender production); cờ `PRERENDER_STRICT` | **ĐÃ DUYỆT [AD]** | Owner Confirmation & 2026-11-16 |
| **D-F6-P5 / P5b** | Layout file phẳng: `dist/knowledge.html` và `dist/knowledge/<slug>.html` (canonical không dấu `/` cuối) | **ĐÃ DUYỆT [AD]** | Owner Confirmation & 2026-11-16 |
| **D-F6-N1** | Navbar thêm 1 liên kết "Kiến thức"; Footer thêm 1 `nav aria-label="Chân trang"` tối thiểu | **ĐÃ DUYỆT [AD]** | Owner Confirmation |
| **D-F6-U1** | Duyệt toàn bộ chuỗi copy UI tiếng Việt (Mục 14.3 Plan) | **ĐÃ DUYỆT [AD]** | Owner Confirmation |
| **D-F6-C1** | Chuẩn hoá 15 tiêu đề bài viết sang tiếng Việt bám sát glossary sản phẩm (`labels.ts`) | **ĐÃ DUYỆT [AD]** | Owner Confirmation |
| **D-F6-C2** | Thứ tự danh mục: đặt "Khái niệm cơ bản" lên đầu tiên | **ĐÃ DUYỆT [AD]** | Owner phản hồi 2026-11-16 |
| **D-F6-L1..L3** | Micro-change F6.0b: Đổi nhãn góc chiếu (`Hợp` → `Trùng tụ`, `Vuông chiếu` → `Vuông góc`, `Đối xung` → `Đối đỉnh`); nguồn chuẩn UI Spec §12.11 | **ĐÃ DUYỆT [AD]** | Owner phản hồi 2026-11-16 |
| **D-F6-A1** | Giải quyết điều kiện P1 & Hydrate: Không đổi hành vi CSR hiện tại; `main.tsx` chỉ thêm một nhánh có điều kiện gọi module tách biệt `src/app/hydrate.ts` | **ĐÃ DUYỆT [AD]** | Owner phản hồi 2026-11-18 |

### 3.2 Điểm làm rõ kỹ thuật đề xuất [REC] (Chưa duyệt, không chặn)
| Điểm làm rõ | Nội dung đề xuất | Trạng thái |
|---|---|:---:|
| **D-F6-A2** | Khi `PRERENDER_STRICT=true`: yêu cầu `https:` và host không phải `localhost`/IP nội bộ | Đề xuất [REC] |
| **D-F6-A3** | Sinh `dist/knowledge/index.html` (nội dung giống `knowledge.html`) cho URL `/knowledge/` | Đề xuất [REC] |
| **D-F6-A4** | URL sai định dạng luôn làm build fail (kể cả non-strict); chỉ thiếu URL mới fallback localhost | Đề xuất [REC] |
| **D-F6-A5** | Test nhãn cũ chỉ cấm tự động `Vuông chiếu`/`Đối xung`; nhãn "Hợp" kiểm soát qua checklist biên tập | Đề xuất [REC] |
| **D-F6-A6** | Test `KB-U23` import `ASPECT_TYPE_LABELS` từ `features/chart` (ngoại lệ chỉ trong test) để kiểm bài `major-aspects` | Đề xuất [REC] |

---

## 4. Kết luận Milestone F6.0

- 100% điều kiện cổng vào đã được thỏa mãn.
- Baseline 145 files / 1.205 unit tests, 60 E2E tests, 0 lint/type errors được xác thực độc lập.
- Sẵn sàng tiến hành micro-change F6.0b và Milestone F6.1.
