# Sprint F3 — M8 Implementation Plan: Documentation & Sprint Closure

**Trạng thái**: Plan only. Đây là milestone cuối cùng của Sprint F3 — không thêm tính năng, chỉ audit, cập nhật tài liệu, và đưa ra khuyến nghị đóng sprint dựa trên bằng chứng thật.

## 1. Milestone Overview

| | |
|---|---|
| Sprint | F3 — Birth Profile Module (Frontend) |
| Milestone | M8 — Documentation & Sprint Closure (milestone cuối) |
| Tiền đề | M1–M7 đều đã CLOSED, xác nhận độc lập qua nhiều vòng review với lệnh thật (chi tiết ở mục 12/Decision Log) |
| Kỷ luật áp dụng | Giống hệt Sprint F2 M9: "audit thật, không tự nhận PASS" |

## 2. Objectives

1. Audit toàn bộ implementation F3 thật so với: Sprint F3 Implementation Plan (master + M1-M7), UI Spec §12, Architecture Spec, Coding Standards, backend REST/OpenAPI contract, Acceptance Criteria, Exit Criteria.
2. Cập nhật `README.md`/`CHANGELOG.md` để phản ánh đúng trạng thái thật (không phải trạng thái đã lên kế hoạch).
3. Ghi nhận trung thực mọi gap còn lại.
4. Đưa ra khuyến nghị đóng sprint có căn cứ.
5. Không tự tuyên bố PASS chỉi vì các milestone trước đã được đánh dấu "CLOSED".

## 3. Scope

Audit + tài liệu hóa 100% những gì đã thật sự implement trong F3 (M1-M7): Birth Profile list/create/edit/delete, 2-bước Birth Form, location search, pagination, loading/empty/error state, error dictionary, navigation, toàn bộ test (unit/component/E2E).

## 4. Non-Goals

Không thêm tính năng; không refactor vì thẩm mỹ; không thêm kiến trúc/dependency mới (trừ khi thật sự bắt buộc để đóng sprint — không trường hợp nào được xác định cần); không tự chạy/tự xác nhận thay phần việc của Phuc Hoang (đặc biệt E2E, xem mục 17); không mở lại OQ-F3-1/2/3 (đã RESOLVED).

## 5. Dependencies

M1–M7 CLOSED trên `origin/dev` (lần xác nhận gần nhất: 78 file/391 test, `typecheck`/`lint`/`format:check`/`build` sạch, coverage `BirthProfileForm` 97.59%/94.5%/100%/100%, `pages/app/profiles` 92.5%/82.35%/94.44%/97.14% — dòng còn lại chưa cover (184) là hành vi nội bộ `Modal` đã test ở F1, loại trừ có chủ đích). `Sprint_F2_Exit_Criteria_Evidence_Matrix.md`/`Sprint_F2_Known_Gaps_Registry.md` dùng làm khuôn mẫu định dạng.

## 6. Files to Create

```
docs/implementation/Sprint_F3_Known_Gaps_Registry.md
docs/implementation/Sprint_F3_Exit_Criteria_Evidence_Matrix.md
```

## 7. Files to Modify

```
frontend/README.md       — mục 2 (Current Scope), mục 8 (Testing — E2E), mục 17 (Known Limitations, sửa dòng #3 đã sai sau F3), thêm pointer tới Sprint_F3_Known_Gaps_Registry.md
frontend/CHANGELOG.md    — thêm entry mới theo đúng convention Keep a Changelog đã có (xem Decision Log D-02)
```

## 8. Files to Inspect (không sửa, chỉ đọc làm bằng chứng)

`frontend/package.json` (scripts + version), toàn bộ `src/features/birth-profile/**`, `src/pages/app/profiles/**`, `src/widgets/app-layout/index.tsx`, `src/shared/hooks/useDebounce.ts`, `src/shared/ui/EmptyState/`, `src/shared/lib/error-messages.ts`, `src/app/router.tsx`, `e2e/birth-profile.spec.ts`, `frontend-ci.yml`, toàn bộ `docs/implementation/Sprint_F3_*.md` (8 file kế hoạch M1-M7 + master), `docs/implementation/archive/sprint-f2/*` (khuôn mẫu).

## 9. Task Breakdown (đúng 3 task, không chia nhỏ hơn)

- **T1** — Repository Audit & Exit Criteria Evidence
- **T2** — Documentation, Known Gaps & Evidence Matrix
- **T3** — Final Sprint Closure & Recommendation

## 10. Detailed Task Steps

### T1 — Repository Audit & Exit Criteria Evidence

Đối chiếu từng hạng mục A-X với bằng chứng thật đã thu thập xuyên suốt 7 lần review M1-M7 (tổng hợp lại dưới đây, **không suy đoán lại** — mọi dòng đều trỏ về 1 lần verify bằng lệnh thật cụ thể) cộng với lệnh verify cuối chạy lại tươi cho T3:

| # | Hạng mục | Kết quả | Bằng chứng |
|---|---|---|---|
| A | Birth Profile list | PASS | `pages/app/profiles/page.tsx`, M4, review cuối: 8→11 test, coverage 92.5%/82.35%/94.44%/97.14% |
| B | Create flow | PASS | `pages/app/profiles/new/page.tsx`, M5, đã vá bug `mutation.error.message` (commit `3959980`) |
| C | Edit flow | PASS | `pages/app/profiles/edit/page.tsx`, M5, cùng fix trên |
| D | Delete flow | PASS | Modal confirm trong `page.tsx`, M4, đủ test cancel/confirm/failure/auto-lùi-trang |
| E | 2-bước Birth Form | PASS | `BirthProfileForm.tsx`, M3, đúng UI Spec §12.1 (trừ phần Chart-warning — xem OQ-F3-1 RESOLVED, mục 19) |
| F | Birth date validation | PASS | `schema.ts` regex `YYYY-MM-DD` + `.superRefine`; không có biên dưới cứng (đúng REST Spec §14.11 frozen) |
| G | Birth time validation | PASS (có 1 regression UX nhỏ) | Input mask HH:mm tự viết tay (UI/UX fix #1) đã khôi phục `aria-invalid`/`aria-describedby` ở commit `7f9de42`; UX: lỗi hiện ở submit thay vì on-blur như input gốc (KG-M8, xem mục 13) |
| H | INV-BP1 (`isBirthTimeKnown=false ⟺ birthTime=null`) | PASS | `schema.test.ts` (7 test, M3), cả 2 chiều toggle (Case A/B, M3 mục 7); backend hành vi thật đã xác nhận ở M1 (PATCH tự null khi thiếu field, không tự null khi Create) |
| I | Location search | PASS | `LocationSearchField.tsx`, `useLocationSearchQuery` (M2), coverage 95.91% sau M7-fix |
| J | Disabled trước birthDate hợp lệ | PASS | `isBirthDateValid` gate (M3), test xác nhận (M7) |
| K | Stale location khi đổi birthDate | PASS | `onChange` trực tiếp field birthDate → `setValue(birthLocation, null)` (M3), test OQ-2 end-to-end (M3 review, đã vá thiếu test) |
| L | Historical timezone | PASS | `historicalTimezoneId` forward nguyên vẹn từ location search, không tự resolve phía client (M1/M3) |
| M | Pagination | PASS | Prev/Next + indicator (OQ-F3-3), `hasNextPage` tự tính client-side, `PAGE_SIZE=10` (đổi từ 20 theo UI/UX fix #6) |
| N | Loading states | PASS | `Skeleton` (list/edit), `isLoading`/`isPending` (form) |
| O | Empty states | PASS | `EmptyState` (M4, xây mới, có `variant`) |
| P | Error states | PASS | `EmptyState variant="danger"` (list/edit fetch lỗi), `Alert variant="danger"` (submit lỗi, dùng `getErrorMessage` sau fix M5) |
| Q | Ownership UI behavior | PASS | Backend là thẩm quyền duy nhất (403/404), frontend không tự đoán quyền (M1 audit, không code thêm ở FE) |
| R | API error handling | PASS | 10 mã §2.4(+1 correction) map đầy đủ vào `error-messages.ts` (M6), verify từng mã khớp enum backend |
| S | Responsive | PARTIAL | `Grid` breakpoint cố định (M4), chưa test tự động cho responsive (chỉ review thủ công); không có lỗi được biết |
| T | Tests (unit/component) | PASS | 20 file/81 test riêng Birth Profile (sau M7 fix), 0 `.only`/`.skip`/TODO |
| U | E2E | PARTIAL — xem mục 17 | `e2e/birth-profile.spec.ts` tồn tại, 4 block tuần tự, Claude **đã** verify code tồn tại đúng cấu trúc nhưng **không thể tự chạy** (giới hạn sandbox — Prisma binary 403, không có Postgres/Docker); `page.route` mock location search (lệch nhẹ so với plan M5 "không mock E2E" — KG đã ghi) |
| V | Architecture boundaries | PASS | `grep` xác nhận 0 kết quả `shared→features`; `features/birth-profile` không import `@features/auth` |
| W | Không phụ thuộc Chart domain | PASS | `grep` xác nhận 0 kết quả Chart/ephemeris/ascendant trong toàn bộ `features/birth-profile`+`pages/app/profiles` |
| X | TODO/FIXME chưa phân loại | PASS | 1 TODO duy nhất trong phạm vi liên quan (`widgets/app-layout`, Backlog M4, **đã phân loại** từ trước F3 ở README mục 17 #5) |

Không hạng mục nào bị gán PASS chỉ vì "code tồn tại" — mỗi dòng trên trỏ về 1 lần chạy lệnh/test/grep thật, đã thực hiện xuyên suốt các lần review M1-M7 và xác nhận lại ở T3.

### T2 — Documentation, Known Gaps & Evidence Matrix

**A. `frontend/README.md`** (sửa tối thiểu, không viết lại toàn bộ):
- Mục 2: đổi "Current Status: Sprint F1 + F2 — Complete" → "Sprint F1 + F2 + F3 — Complete", thêm 2-3 câu mô tả Birth Profile (CRUD, 2-bước form, location search, pagination) **đúng những gì thật sự chạy được** — không nhắc "Chart warning" hay bất kỳ thứ gì đã deferred.
- Mục 8 (Testing): thêm dòng về `e2e/birth-profile.spec.ts`, giữ nguyên cảnh báo "CI skip nếu thiếu backend" đã có (G-05 đã CLOSED từ pre-F3, không đổi).
- Mục 17 (Known Limitations): **sửa dòng #3** ("router.tsx chỉ làm nền tảng, chưa ánh xạ route Phase 1/2/3") — dòng này **sai từ sau F3** vì `/app/profiles`, `/app/profiles/new`, `/app/profiles/:id/edit` đã thật sự tồn tại; cập nhật thành "đã ánh xạ route Birth Profile (F3); Phase 2/3 (Chart, Interpretation...) vẫn chưa". Thêm pointer `Sprint_F3_Known_Gaps_Registry.md` cạnh pointer F2 đã có.
- Không đổi mục 3-7, 9-16 trừ khi T1 phát hiện sai lệch cụ thể (hiện chưa thấy).

**B. `frontend/CHANGELOG.md`**: thêm entry mới theo đúng format Keep a Changelog đã dùng cho `[0.1.0]` — xem Decision Log D-02 cho số version cụ thể.

**C. `Sprint_F3_Known_Gaps_Registry.md`**: theo đúng cấu trúc bảng của F2 (`ID | Area | Description | Evidence | Severity | F3 Impact | Status | Follow-up`), nội dung ở mục 13.

**D. `Sprint_F3_Exit_Criteria_Evidence_Matrix.md`**: theo đúng cấu trúc bảng của F2 (`ID | Criterion | Required Evidence | Actual Evidence | Verification | Status | Notes`), nội dung ở mục 11/14.

Cả 2 file đặt tại `docs/implementation/` (chưa archive — F2 chỉ archive sau khi Sprint 3 kế tiếp bắt đầu; không tự ý archive F3 trong M8).

### T3 — Final Sprint Closure & Recommendation

Chạy lại **tươi, trên clone sạch** toàn bộ lệnh ở mục 11, ghi nhận output thật, đối chiếu với mục 14 (Exit Criteria), rồi chọn ĐÚNG 1 trong 3 khuyến nghị (mục 18) — không chọn theo kỳ vọng.

## 11. Verification Strategy

Chỉ dùng script có thật trong `frontend/package.json` (đã đọc trực tiếp, không suy đoán tên lệnh):

```bash
cd frontend
npm ci                      # clean install, không --ignore-scripts nếu môi trường cho phép (nếu husky prepare lỗi do sandbox, ghi nhận, dùng --ignore-scripts thay thế và nêu rõ)
cp .env.example .env
npm run lint
npm run typecheck
npm run format:check
npm run test:coverage
npm run build
npm run test:e2e            # yêu cầu backend thật — xem mục 17, không tự suy ra PASS nếu môi trường không cho chạy
```

Không có lệnh `test:e2e` nào khác cần đoán — đã xác nhận `playwright test` đúng là lệnh thật trong `package.json`.

## 12. Evidence Requirements

Mỗi dòng trong Evidence Matrix (T2.D) phải trỏ về: (a) lệnh thật đã chạy + output, hoặc (b) đường dẫn file + nội dung cụ thể đã đọc, hoặc (c) kết quả `grep`/lệnh kiểm tra cụ thể. Không chấp nhận "đã implement ở milestone trước" làm bằng chứng tự thân — phải re-verify tối thiểu 1 lần ở M8 (qua chạy lại lệnh ở mục 11), đúng tinh thần "repository source code is the source of truth" của prompt gốc.

## 13. Known Gaps Handling — nội dung cho `Sprint_F3_Known_Gaps_Registry.md`

Phân loại rõ 4 nhóm (đúng yêu cầu prompt): **Intentionally Deferred**, **Known Technical Debt**, **Unverified**, **Actual Defect**. Không biến mọi thứ-không-phải-feature thành "gap".

| ID | Nhóm | Mô tả | Evidence | Severity | Follow-up |
|---|---|---|---|---|---|
| G-F3-01 | Intentionally Deferred | Chart-specific Ascendant/House warning không có trong Birth Form | OQ-F3-1 RESOLVED (mục 19) | — | Chờ milestone Chart creation (Phase 3) |
| G-F3-02 | Intentionally Deferred | `Toast` component không được xây; dùng `Alert`/success-banner cục bộ cho mọi thông báo kết quả (M4, M5) | Grep `shared/ui/` xác nhận không có `Toast`; pattern thay thế đã dùng nhất quán | Thấp | Xây khi có milestone Design-System/notification riêng |
| G-F3-03 | Known Technical Debt | 2 mục nav cũ (`Bảng điều khiển`, `Cài đặt`) trong `AppLayout` vẫn dùng `<a href="/">` thay vì `<Link>` | Đọc trực tiếp `widgets/app-layout/index.tsx`, M6 audit | Thấp | Sửa khi làm Dashboard/Settings thật |
| G-F3-04 | Known Technical Debt | Desktop sidebar và mobile drawer là 2 khối JSX trùng lặp, không chung config; không có active-state route | M6 audit | Thấp | Refactor khi có >3 mục nav |
| G-F3-05 | Known Technical Debt | Input giờ sinh tự viết tay không còn dùng `register()`/`mode:"onBlur"` của RHF — lỗi hiện ở submit thay vì on-blur như trước (khác UX nhỏ so với các field khác trong form) | Đọc `BirthProfileForm.tsx` sau UI/UX fix #1 | Thấp | Cân nhắc rebuild bằng `Controller` nếu cần đồng bộ timing validate |
| G-F3-06 | Known Technical Debt | `e2e/birth-profile.spec.ts` mock response `/locations/search` thay vì gọi geonames thật, lệch nhẹ so với chủ đích ban đầu (M5 plan) "không mock ở E2E" cho bước này | commit `bc593e5`, lý do: giảm flaky CI | Thấp | Chấp nhận trade-off, ghi nhận coverage thật của geonames integration chỉ còn ở mức manual/staging |
| G-F3-07 | Unverified | `npm run test:e2e` với backend thật **chưa được Claude tự verify** trong phiên M8 (giới hạn sandbox: Prisma binary 403, không có Postgres/Docker) | Lệnh thật đã thử, output lỗi ghi lại ở Evidence Matrix | Trung bình | **Blocking cho tới khi Phuc Hoang tự xác nhận** (mục 17) |
| G-F3-08 | Unverified | Responsive layout (`Grid` breakpoint) chưa có test tự động, chỉ review bằng mắt qua các lần trước | M4 audit | Thấp | Thêm visual/responsive test nếu cần ở Sprint sau |
| G-F3-09 | Documentation | REST API Spec §2.4 (trong `Sprint_F3_Implementation_Plan.md`, không phải tài liệu Backend) có 2 sai lệch đã phát hiện ở M6 (`INVALID_BIRTH_DATE` mô tả sai ngữ nghĩa; thiếu `INVALID_BIRTH_TIME`) | M6 Decision Log D-02/D-03 | Thấp | Sửa khi cập nhật lại master plan, không blocking code |

Thừa kế nguyên trạng (không lặp lại chi tiết, chỉ tham chiếu): mọi Known Gap của F2 (`Sprint_F2_Known_Gaps_Registry.md`) và pre-F3 (`npm audit`: 3 vuln frontend/9 backend chưa `--force`) vẫn còn, không thuộc trách nhiệm đóng của F3.

**Không liệt kê làm Known Gap** (vì không phải gap thật): branch coverage 82.35% của `pages/app/profiles` — dòng chưa cover là Modal `onClose` nội bộ, loại trừ có chủ đích (M7 review); `api/mocks/handlers.ts`/`types.ts`/`index.ts` 0%/thấp — false-negative của công cụ coverage với file không có statement thật thi hành (M7 review).

## 14. Acceptance Criteria

Đúng 9 điều mục 10 của prompt gốc — không lặp lại nguyên văn, tình trạng dự kiến sau khi T1-T3 hoàn thành: (1)-(6) đạt được qua T2; (7)-(9) đạt được qua T3, với lưu ý riêng: AC-7 "mọi kết quả verify dựa trên lệnh thật đã chạy" — **trừ `test:e2e`**, nơi Claude chỉ verify được rằng lệnh *tồn tại* và cấu trúc spec đúng, không verify được kết quả chạy thật (ghi `NOT VERIFIED — ENVIRONMENT LIMITATION`, khác với `NOT VERIFIED — HUMAN CONFIRMATION REQUIRED` của chính tiêu chí con người, mục 17).

## 15. Exit Criteria

`Sprint_F3_Exit_Criteria_Evidence_Matrix.md` phải có đủ các dòng tương ứng 24 hạng mục A-X (mục 10/T1) cộng các tiêu chí vận hành dưới đây — mỗi dòng PASS/FAIL/PARTIAL/NOT VERIFIED, không có dòng nào bỏ trống kết quả:

| ID | Criterion |
|---|---|
| EC-F3-01 | `npm run lint` pass |
| EC-F3-02 | `npm run typecheck` pass |
| EC-F3-03 | `npm run format:check` pass |
| EC-F3-04 | `npm run test:coverage` pass, 0 fail |
| EC-F3-05 | `npm run build` pass |
| EC-F3-06 | `npm run test:e2e` — Claude tự chạy (nếu môi trường cho phép) |
| EC-F3-07 | `test:e2e` **được Phuc Hoang xác nhận trực tiếp pass trên backend thật** |
| EC-F3-08 | OQ-F3-1 RESOLVED đúng phạm vi (không Chart logic) |
| EC-F3-09 | OQ-F3-2 RESOLVED đúng phạm vi (gate birthDate, stale-on-change) |
| EC-F3-10 | OQ-F3-3 RESOLVED đúng phạm vi (Prev/Next, không cursor/numbered) |
| EC-F3-11 | Known Gaps Registry tồn tại, phân loại đúng 4 nhóm |
| EC-F3-12 | Evidence Matrix tồn tại, đủ bằng chứng từng dòng |
| EC-F3-13 | Không TODO/FIXME chưa phân loại trong phạm vi F3 |
| EC-F3-14 | `shared → features` = 0 |
| EC-F3-15 | Không import Chart domain trong Birth Profile |
| EC-F3-16 | README phản ánh đúng trạng thái thật (không còn dòng sai ở mục 17 #3) |
| EC-F3-17 | CHANGELOG cập nhật đúng convention sẵn có |
| EC-F3-18 | Version bump (nếu áp dụng) — quyết định rõ ràng, có căn cứ |

## 16. Definition of Done

- 2 file mới (mục 6) tồn tại vật lý, đúng cấu trúc bảng đã dùng ở F2.
- README/CHANGELOG cập nhật đúng phạm vi mục 10.T2, không viết lại toàn bộ.
- Toàn bộ lệnh mục 11 đã chạy thật trên môi trường sẵn có, output ghi lại nguyên văn trong Evidence Matrix (kể cả khi FAIL/NOT VERIFIED do giới hạn môi trường).
- 3 OQ-F3 được ghi là RESOLVED (không phải Known Gap) kèm quyết định thật.
- Không Open Question nào còn treo mà chặn việc đóng sprint, trừ phi được phân loại rõ `NOT VERIFIED` và escalate đúng (mục 17).
- Final Recommendation được ghi rõ, chọn đúng 1 trong 3 mức (mục 18), có căn cứ.
- Trạng thái xác nhận E2E bởi con người được ghi tách biệt, không gộp với việc Claude tự chạy.

## 17. Risks (bao gồm CRITICAL E2E RULE)

| Risk | Mitigation |
|---|---|
| **Tự nhận E2E pass vì milestone trước "đã CLOSED"** | **Không được phép.** "Claude Code chạy E2E pass" và "Phuc Hoang xác nhận trực tiếp E2E pass trên backend thật" là 2 sự kiện khác nhau (đúng mục 6/11 prompt gốc). M8 phải tự chạy `test:e2e` trong môi trường của mình (Claude's sandbox) và ghi kết quả thật — nếu môi trường chặn (như đã xác nhận: Prisma binary 403, không Docker/Postgres), ghi `NOT VERIFIED — ENVIRONMENT LIMITATION` cho phần Claude tự chạy, và **riêng biệt** ghi `NOT VERIFIED — HUMAN CONFIRMATION REQUIRED` cho tiêu chí "Phuc Hoang confirms directly". Không suy luận cái này từ cái kia theo bất kỳ chiều nào. |
| Môi trường M8 (dù là sandbox nào) có thể khác môi trường đã chạy M1-M7 review trước | Luôn chạy lại `npm ci` sạch + toàn bộ lệnh mục 11 ngay trong phiên M8, không tái sử dụng kết quả cũ làm bằng chứng cuối |
| Tự ý archive tài liệu Sprint F3 | Không archive trong M8 — theo đúng tiền lệ F2 (chỉ archive khi Sprint kế tiếp bắt đầu) |
| Viết lại toàn bộ README thay vì sửa tối thiểu | Giới hạn thay đổi đúng 3 mục (2, 8, 17) — không đụng mục 3-7, 9-16 |
| Bịa version bump không có căn cứ | Không bump version trừ khi dựa trên SemVer đã tuyên bố trong chính CHANGELOG hiện có (xem Decision Log D-02) |

## 18. Final Recommendation Rules

Chọn đúng 1, dựa hoàn toàn trên Evidence Matrix thật (không theo kỳ vọng):

- `RECOMMEND CLOSE — PASS` — chỉ khi **toàn bộ** EC-F3-01…18 đều PASS thật, bao gồm cả EC-F3-07 (xác nhận người thật).
- `RECOMMEND CLOSE — PASS WITH KNOWN GAPS` — khi mọi tiêu chí tự động (EC-F3-01…06, 08…18) PASS, Known Gaps đã ghi nhận đầy đủ và không có gap nào ở mức Severity cao chưa xử lý, **nhưng** EC-F3-07 vẫn `NOT VERIFIED — HUMAN CONFIRMATION REQUIRED`.
- `DO NOT CLOSE — EXIT CRITERIA NOT SATISFIED` — nếu bất kỳ tiêu chí tự động nào FAIL thật khi chạy lại ở T3.

**Dự kiến dựa trên bằng chứng đã có tới thời điểm lập plan này** (sẽ re-verify ở T3, không tự nhận trước): nhiều khả năng rơi vào `PASS WITH KNOWN GAPS`, vì mọi lệnh tự động đã xanh xuyên suốt M1-M7 và lần verify tươi gần nhất, nhưng EC-F3-07 (Phuc Hoang tự xác nhận E2E thật) **chưa từng được ghi nhận trong suốt F3** — đây không phải giả định, là quan sát: không có bất kỳ xác nhận trực tiếp nào từ Phuc Hoang về việc tự chạy `npm run test:e2e` với backend thật xuất hiện trong toàn bộ lịch sử review M1-M8.

## 19. Decision Log / Resolved OQs

| OQ | Quyết định | Trạng thái |
|---|---|---|
| OQ-F3-1 | Dùng Birth Form 2 bước theo UI Spec §12.1; domain-agnostic; không Chart-specific Ascendant/House warning; Chart context sẽ tự cung cấp warning khi triển khai | **RESOLVED** (Phuc Hoang, 2026-09-24) |
| OQ-F3-2 | Location search disabled tới khi `birthDate` hợp lệ; không fallback `today`; đổi `birthDate` sau khi đã chọn location → location/timezone cũ bị coi là stale, bắt buộc chọn lại | **RESOLVED** (Phuc Hoang, 2026-09-24) |
| OQ-F3-3 | Page-number state nội bộ tương thích `page`/`pageSize` backend; UI chỉ Prev/Next + chỉ số trang; không cursor; không numbered pagination/page-size selector cho MVP | **RESOLVED** (Phuc Hoang, 2026-09-24) |

Ghi rõ: cả 3 là **quyết định đã RESOLVED**, không liệt kê lại trong Known Gaps Registry (đúng yêu cầu mục 4.C của prompt gốc).

**Decision Log bổ sung (câu hỏi thật tự nảy sinh khi lập plan M8, không phải OQ-F3 gốc):**

- **D-01 (Phạm vi README)**: sửa tối thiểu 3 mục (2, 8, 17), không viết lại toàn bộ — theo đúng "Prefer the smallest change necessary" của prompt gốc, và theo đúng cách M9 (F2) đã làm trước đây.
- **D-02 (Version bump)**: `CHANGELOG.md`/`package.json` hiện ở `0.1.0`, là **bản gộp chung cho cả F1+F2** (xác nhận đọc trực tiếp — không phải 1 version riêng cho mỗi sprint). Dự án tuyên bố tuân thủ SemVer ngay trong header `CHANGELOG.md`. F3 thêm 1 tính năng người dùng mới hoàn chỉnh (Birth Profile CRUD) → theo đúng SemVer đã tuyên bố (không phải quy ước mới tự bịa), đây là **minor bump**: `0.1.0 → 0.2.0`. Đây là suy luận từ quy ước đã có sẵn trong chính file, không phải phát minh quy trình release mới — nhưng vẫn là 1 quyết định cần Phuc Hoang xác nhận trước khi T2 thực thi (không tự ý bump nếu có lý do khác muốn giữ `0.1.x`).
- **D-03 (Vị trí 2 file mới)**: đặt tại `docs/implementation/` (không archive), đúng tiền lệ F2 lúc mới đóng (chỉ archive sau khi Sprint kế tiếp bắt đầu).

## 20. Execution Order

```
T1 (audit + chạy lại toàn bộ lệnh mục 11 trên clone sạch, ghi output thật)
  → T2.A (README) → T2.B (CHANGELOG) → T2.C (Known Gaps Registry) → T2.D (Evidence Matrix)
  → T3 (đối chiếu Evidence Matrix với Exit Criteria mục 15, chọn khuyến nghị mục 18)
```
Không chạy T2 trước khi T1 hoàn thành — mọi dòng tài liệu ở T2 phải trỏ về bằng chứng đã thu thập ở T1, không được viết trước rồi tìm bằng chứng sau.

---

**Ghi chú cuối cùng, trả lời trực tiếp câu hỏi mục 14 của prompt gốc**: dựa trên toàn bộ bằng chứng thật đã có tới thời điểm lập plan (chưa phải T3 chính thức), Sprint F3 **đã sẵn sàng về mặt kỹ thuật** (mọi lệnh tự động xanh, mọi Acceptance Criteria của M1-M7 đã verify độc lập nhiều vòng) nhưng **chưa thể đóng chính thức** cho tới khi Phuc Hoang tự xác nhận trực tiếp đã chạy `npm run test:e2e` thành công với backend thật — đây là phụ thuộc đóng sprint duy nhất còn lại, không phải giả định, không phải việc Claude có thể tự làm thay.
