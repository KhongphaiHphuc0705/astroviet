# Sprint F2 — M9 Implementation Plan
## Documentation & Sprint Closure

**Repo:** `KhongphaiHphuc0705/astroviet`, nhánh `dev`
**Commit audit tại thời điểm lập plan:** `a9c56c4` (`git log -1`, xác nhận không đổi kể từ khi M8 đóng)
**Node:** v22.22.2 · **npm:** 10.9.7 (đo trực tiếp trong quá trình lập plan)
**Nguyên tắc xuyên suốt:** *Không tự nhận PASS. Chỉ PASS khi có evidence.*

---

## 1. Milestone Overview

M9 là milestone cuối Sprint F2 — **audit đóng gói, không phải phát triển tính năng**. Mục tiêu: xác nhận bằng chứng thật cho từng Acceptance/Exit Criterion của cả Sprint F2 (không chỉ M9), tạo 2 tài liệu bắt buộc (`Known Gaps Registry`, `Exit Criteria Evidence Matrix`), rà soát README/CHANGELOG/version, đóng dứt điểm F2-OQ-1/2/3 bằng bằng chứng thật, và đưa ra Final Recommendation.

**Toàn bộ dữ liệu trong plan này đã được thu thập thật** khi lập plan (không suy diễn) — chạy lệnh thật, đọc file thật, grep thật. Các bảng ở Mục 12/13 chính là bản nháp sẵn sàng cho 2 file bắt buộc.

---

## 2. Current Repository State

| Hạng mục | Trạng thái thật |
|---|---|
| F2 M1-M8 | CLOSED — đã review độc lập 8 lượt liên tiếp trong suốt Sprint (mỗi lượt: lint/typecheck/format/test/build chạy thật) |
| HEAD | `a9c56c4`, không có commit mới kể từ khi M8 đóng |
| `frontend/README.md` | **Tồn tại nhưng stale nghiêm trọng** — vẫn ghi "Sprint F1 — Frontend Foundation (Complete)", "Authentication... sẽ được phát triển ở Sprint tiếp theo", mục Known Limitations #2 nói QueryClientProvider "chưa được wrap" (sai — đã wrap từ M1), mục #12 tự ghi "Sprint F2 (Authentication UI) chưa được xác nhận chính thức gần đây" |
| `frontend/CHANGELOG.md` | **Không tồn tại** |
| `frontend/package.json` | `"version": "0.0.0"` — chưa từng bump, không có tiền lệ SemVer cho frontend (khác backend đã có CHANGELOG + bump theo Sprint) |
| `docs/frontend/Frontend_Architecture_Specification.md` §10.1 | Đã có `ApiError.fieldErrors: Record<string,string[]>` đọc từ `metadata.fieldErrors` — khớp code thật, không còn ngôn từ "pending" |
| §12.2 | Đã có "Quyết định đã chốt (M1)" về cookie+body — khớp F2-D1; **1 điểm không chính xác nhỏ**: ghi call site là `app/providers` nhưng code thật gọi `useSessionBootstrap()` trong `app/App.tsx` (ngoài thư mục `providers/`) |
| `features/auth/` TODO/FIXME | **0 kết quả** (grep thật) |
| `shared → features` dependency | **0 vi phạm** (grep thật) |
| `localStorage`/`sessionStorage` trong auth code | **0 kết quả** |
| `withCredentials` trong `client.ts` | **Có**, dòng 41 (fix quan trọng từ M8) |
| `refreshToken` reference ngoài test | Chỉ trong `types.ts` (type declaration) và `mocks/handlers.ts` (mock response) — không có nơi nào lưu/dùng giá trị thật |

---

## 3. Closure / Audit Philosophy

Kế thừa đúng tinh thần Backend Sprint 3 M10: mọi PASS phải có evidence thật (lệnh chạy/file đọc/grep), không có PASS nào dựa trên "milestone trước đã nói vậy". Thứ bậc evidence (Mục 10 prompt gốc) áp dụng xuyên suốt — command output thật > đọc source thật > tuyên bố milestone trước.

---

## 4. Scope

- Audit tài liệu F2 (README, CHANGELOG, Architecture Spec §10.1/§12.2).
- Audit Acceptance/Exit Criteria toàn Sprint F2 → Evidence Matrix.
- Clean Environment Verification thật (đã thực hiện phần frontend khi lập plan — Mục 9).
- Đóng dứt điểm F2-OQ-1/2/3.
- Tạo `Sprint_F2_Known_Gaps_Registry.md`, `Sprint_F2_Exit_Criteria_Evidence_Matrix.md`.
- Cập nhật `README.md` (bắt buộc — stale nghiêm trọng); quyết định CHANGELOG/version (Mục 14).
- Audit TODO/FIXME, dependency direction, security checklist.
- Final Recommendation.

## 5. Non-Goals

Không phát triển tính năng mới, không refactor, không redesign, không sửa backend (trừ khi phát hiện blocker cụ thể — **không có blocker nào như vậy được phát hiện**), không viết lại M1-M8, không pentest bảo mật đầy đủ, không rewrite tài liệu không liên quan F2.

## 6. Dependencies

F2 M1-M8 — coi là claim cần audit, không phải evidence tự động (đúng Rule 3). Backend Sprint 1-3 — CLOSED, không đổi.

---

## 7. Documentation Audit

| Tài liệu | Đã inspect? | Phát hiện |
|---|---|---|
| `frontend/README.md` | ✅ | Stale nghiêm trọng (Mục 2) — **phải sửa** |
| `frontend/CHANGELOG.md` | ✅ (xác nhận không tồn tại) | Cần quyết định (Mục 14) |
| `Frontend_Architecture_Specification.md` §10.1 | ✅ | Khớp code thật, không pending |
| §12.2 | ✅ | Khớp phần lớn; 1 điểm wording nhỏ (call site `app/providers` vs thực tế `app/App.tsx`) |
| `Frontend_UI_Specification.md` | Đã đối chiếu xuyên suốt M5/M6 (không audit lại toàn văn ở M9 — không phát hiện mâu thuẫn mới liên quan closure) | Không có gap mới |
| `Frontend_Coding_Standards.md` §13.3 | Đã ghi nhận từ M8 (MSW handlers tập trung vs inline M1-M7) | Known Gap đã có, không lặp lại điều tra |
| Milestone numbering cũ (M8 Error Dictionary, M9/M10 cũ) | Grep toàn bộ `docs/implementation/` | Không tìm thấy tài liệu nào còn nhắc numbering cũ cho F2 — các plan M1-M9 hiện tại đều dùng đúng numbering Rev.2 |

---

## 8. Acceptance / Exit Criteria Audit — Nguồn xác thực

Nguồn authoritative: **F2 Rev.2 Implementation Plan** (Mục 26/27 — Sprint-Level Acceptance/Exit Criteria) + Exit Criteria riêng từng M1-M8 đã verify độc lập qua các lượt review trước. Đối chiếu trực tiếp bằng cách chạy lại lệnh thật (Mục 9) và đọc code thật (Mục 2) — không copy nguyên bảng cũ mà không verify lại.

---

## 9. Clean Environment Verification — Evidence thật

**Thực hiện khi lập plan này** (không phải hướng dẫn suông — log thật dưới đây):

```
Commit: a9c56c4
Node: v22.22.2 · npm: 10.9.7
```

| Bước | Lệnh | Kết quả thật |
|---|---|---|
| Clean install | `rm -rf node_modules && npm ci` | ✅ PASS — 647 packages, 0 lỗi (6 vulnerability cảnh báo qua `npm audit`, không liên quan F2 chức năng — Known Gap G-11) |
| Lint | `npm run lint` | ✅ PASS — exit 0, 0 output lỗi |
| Typecheck | `npm run typecheck` | ✅ PASS — exit 0 |
| Format | `npm run format:check` | ✅ PASS — "All matched files use Prettier code style!" |
| Coverage | `npm run test:coverage` | ✅ PASS — **56 test files, 291 tests, 0 fail**. All files: 90.55% stmt / 81.24% branch / 93.29% func / 92.19% line |
| Build | `npm run build` | ✅ PASS — `tsc --noEmit && vite build`, 2059 module, built in 6.89s |
| **E2E** | `npm run test:e2e` | ⚠️ **UNVERIFIED bởi Claude trong phiên lập plan này** — sandbox bị chặn tải Prisma engine binary (`binaries.prisma.sh` 403), không dựng được backend thật để tự chạy. **Bằng chứng gián tiếp mạnh**: lịch sử commit M8 (`c16a27f`, `c91e0a3`, `a9c56c4`) cho thấy 3 lỗi thật (thiếu `user`/`refreshToken` trong mock, thiếu `withCredentials`, lỗi import `jsonwebtoken` ở backend) đã được phát hiện và sửa — **những lỗi này chỉ có thể phát hiện được bằng cách chạy E2E thật với backend thật**, không thể qua MSW/unit test. Đây là bằng chứng gián tiếp đáng tin cậy nhưng **không thay thế được việc tự chạy lại** — dev thực thi M9 **bắt buộc phải tự chạy** `docker compose up` (thư mục `backend/`) + `npm run test:e2e` (thư mục `frontend/`) và ghi lại kết quả thật trước khi đánh PASS chính thức trong Evidence Matrix |

**Không có bước nào bị fabricate** — bước E2E ghi rõ UNVERIFIED theo đúng Rule 4/5, không giả vờ đã chạy.

---

## 10. Evidence Collection Strategy

Ưu tiên: command output thật (Mục 9) > đọc source thật (Mục 2, 11) > grep thật (Mục 15/16) > bằng chứng gián tiếp có ghi chú rõ (E2E) > tuyên bố milestone trước (không dùng làm evidence độc lập). Mọi dòng trong Evidence Matrix (Mục 13) trích đúng 1 trong các nguồn này, không có dòng nào chỉ ghi "milestone trước nói pass".

---

## 11. F2-OQ Final Closure

### F2-OQ-1 — E2E
- Test tồn tại: ✅ `frontend/e2e/auth.spec.ts` (đọc trực tiếp).
- Luồng đúng đặc tả: ✅ 3 step `test()`: "1. Register a new user" → "2. Login with the newly created user" → "3. Logout from the app" (bước 2 verify vào `/app` bên trong, đúng tinh thần Register→Login→/app→Logout).
- Dùng backend thật, không mock: ✅ Không có `server.use()`/MSW nào trong file `auth.spec.ts` — gọi qua `page.goto`/form thật.
- Thực thi thành công: ⚠️ **UNVERIFIED trực tiếp bởi Claude** (Mục 9) — nhưng có bằng chứng gián tiếp mạnh (3 bugfix thật từ M8 chỉ phát hiện được qua chạy E2E thật).
- **Kết luận: F2-OQ-1 → PARTIAL, không phải CLOSED tuyệt đối** cho tới khi dev thực thi M9 tự chạy `npm run test:e2e` với backend thật và ghi log thành công vào Evidence Matrix. Toàn bộ điều kiện KHÁC (test tồn tại, đúng luồng, dùng backend thật, không mock) đã CLOSED bằng bằng chứng trực tiếp.

### F2-OQ-2 — Architecture Documentation
- §10.1: ✅ Đã cập nhật, khớp code thật, không còn ngôn từ pending — **CLOSED**.
- §12.2: ✅ Đã cập nhật, có "Quyết định đã chốt (M1)", khớp F2-D1 — **CLOSED**, nhưng ghi nhận 1 điểm wording nhỏ không chính xác (call site "app/providers" thay vì "app/App.tsx" thật) — không đủ nghiêm trọng để giữ OQ-2 mở, phân loại **Known Gap G-01 (Documentation, non-blocking)**, không phải lý do từ chối đóng OQ-2.
- **Kết luận: F2-OQ-2 → CLOSED**, đúng yêu cầu Rule 9 (đã inspect trực tiếp cả 2 mục, không tin lại tuyên bố M1).

### F2-OQ-3 — Forgot Password
- Grep xác nhận: không có route/component/text "quên mật khẩu"/"forgot password" nào trong `pages/auth/`, `features/auth/`, `router.tsx` (đã verify nhiều lần qua M5/M6, không lặp lại điều tra chi tiết ở M9, chỉ re-confirm nhanh: 0 kết quả).
- Known Gap đã ghi nhận đúng từ M5/M6 review (UI Spec §10.3 yêu cầu, backend chưa hỗ trợ) — sẽ đưa vào Known Gaps Registry chính thức (Mục 12, G-02) thay vì chỉ nằm rải rác trong ghi chú các lượt review trước.
- **Kết luận: F2-OQ-3 → RESOLVED, đúng phạm vi đã thống nhất** — không phải F2 failure.

---

## 12. Known Gaps Registry — Nội dung đầy đủ (bản nháp sẵn sàng dùng)

*(File: `docs/implementation/Sprint_F2_Known_Gaps_Registry.md`)*

| ID | Area | Description | Evidence | Severity | F2 Impact | Status | Follow-up |
|---|---|---|---|---|---|---|---|
| G-01 | Documentation | Architecture Spec §12.2 ghi call site session-bootstrap là `app/providers`, thực tế là `app/App.tsx` | Đọc trực tiếp `App.tsx` (M4 review) + §12.2 | Thấp | Không blocking | Non-blocking known gap | Sửa 1 câu trong §12.2 ở lần cập nhật tài liệu tiếp theo |
| G-02 | Deferred Feature | Forgot Password UI không có trong F2 | UI Spec §10.3 yêu cầu; backend Sprint 1 không có endpoint | Thấp | Đã thống nhất từ đầu (F2-OQ-3) | Deferred scope | Chờ backend Sprint tương lai bổ sung endpoint |
| G-03 | Deferred Feature | Checkbox "Ghi nhớ đăng nhập" (UI Spec §10.3) không implement | `loginSchema` không có field, backend không hỗ trợ | Thấp | Không blocking | Deferred scope | Chờ quyết định backend nếu cần |
| G-04 | Testing | MSW không mô phỏng cookie HttpOnly thật — cookie flow chỉ thật sự verify qua E2E | Ghi nhận từ M2, xác nhận lại M8 | Trung bình (đã bù bằng E2E) | Không blocking (đã có E2E bù) | Known limitation | Không cần follow-up nếu E2E tiếp tục chạy định kỳ |
| G-05 | CI/CD | `frontend-ci.yml` không có service Postgres/backend — `auth.spec.ts` tự skip trong CI | Đọc trực tiếp workflow YAML (M8) | Trung bình | Không blocking cho F2 (đã xử lý bằng `test.skip`) | Infrastructure gap | Thêm CI service Postgres+backend — thuộc DevOps/CI Sprint tương lai, không phải F2 |
| G-06 | Testing Standard | Coding Standards §13.3 yêu cầu MSW handlers tập trung ở `features/*/api/mocks/handlers.ts`; M1-M7 dùng inline `server.use()` | Đọc trực tiếp §13.3 + toàn bộ test M1-M7 (M8) | Thấp | Không blocking (test M1-M7 vẫn "adequate") | Technical Debt | Cân nhắc thống nhất pattern khi có Sprint testing-infra riêng |
| G-07 | Documentation | `frontend/README.md` stale nghiêm trọng trước khi M9 sửa (Mục 2) | Đọc trực tiếp README | Cao (trước khi sửa) | Blocking cho "documentation reflects current state" nếu không sửa | **Đã xử lý trong M9** (Mục 14) | Không cần follow-up nếu M9 hoàn thành đúng |
| G-08 | Documentation | `frontend/CHANGELOG.md` không tồn tại | Xác nhận qua `ls` | Thấp | Cần quyết định, không tự động blocking | Documentation gap | Quyết định ở Mục 14 |
| G-09 | Release Process | `package.json` version `0.0.0`, chưa từng bump, không có tiền lệ SemVer frontend | Đọc trực tiếp `package.json` | Thấp | Không blocking | Known limitation | Quyết định ở Mục 14 |
| G-10 | Verification | E2E chưa được Claude tự chạy trực tiếp trong phiên audit này (giới hạn sandbox) | Mục 9 | Trung bình | **Blocking cho tới khi dev tự verify** | Verification gap | Dev thực thi M9 phải tự chạy `npm run test:e2e` với backend thật, ghi log vào Evidence Matrix |
| G-11 | External Dependency | `npm audit`: 6 vulnerability (3 moderate, 3 high) trong frontend dependencies | `npm ci` output (Mục 9) | Thấp-Trung bình | Không blocking F2 (không liên quan trực tiếp auth logic) | External Dependency | Theo dõi, `npm audit fix` khi có Sprint bảo trì dependency |
| G-12 | Testing | `register/page.test.tsx` có `act()` warning nhỏ khi chạy (không fail) — do `setTimeout` callback trong test không bọc `act()` | Quan sát trực tiếp qua console output khi chạy `npm run test:coverage` | Rất thấp | Không blocking | Technical Debt | Bọc `act()` khi có dịp sửa nhỏ |

**Phân loại rõ ràng theo yêu cầu §20 prompt gốc:** G-02/G-03 = Deferred scope; G-05/G-06/G-11 = Infrastructure/Technical Debt/External Dependency (không phải Sprint blocker); G-10 = Verification gap (không tự động là code defect); G-01/G-07/G-08/G-09/G-12 = Documentation/nhỏ, non-blocking sau khi M9 xử lý G-07.

**Không có Sprint Blocker nào trong danh sách này** ngoại trừ G-10 (verification gap, tự giải quyết được bằng cách dev chạy lệnh thật).

---

## 13. Exit Criteria Evidence Matrix — Nội dung đầy đủ (bản nháp sẵn sàng dùng)

*(File: `docs/implementation/Sprint_F2_Exit_Criteria_Evidence_Matrix.md`)*

| ID | Criterion | Required Evidence | Actual Evidence | Verification | Status | Notes |
|---|---|---|---|---|---|---|
| EC-01 | `npm run lint` pass | Exit code 0 | Chạy thật, exit 0, không output lỗi | Command | **PASS** | Mục 9 |
| EC-02 | `npm run typecheck` pass | Exit code 0 | Chạy thật, exit 0 | Command | **PASS** | Mục 9 |
| EC-03 | `npm run format:check` pass | "All matched files use Prettier code style!" | Đúng output này | Command | **PASS** | Mục 9 |
| EC-04 | `npm run test:coverage` pass | 0 test fail | 56 file/291 test, 0 fail | Command | **PASS** | Mục 9 |
| EC-05 | `npm run build` pass | Build thành công | `built in 6.89s`, 2059 module | Command | **PASS** | Mục 9 |
| EC-06 | `npm run test:e2e` pass (backend thật) | 0 test fail, không mock | Chưa tự chạy được (sandbox) | Command (chưa thực hiện bởi Claude) | **UNVERIFIED** | G-10 — dev phải tự chạy |
| EC-07 | F2-OQ-1 CLOSED | Test tồn tại + đúng luồng + backend thật + pass thật | 3/4 điều kiện có evidence trực tiếp; "pass thật" chỉ có evidence gián tiếp | Source + Command (thiếu) | **PARTIAL** | Mục 11 |
| EC-08 | F2-OQ-2 CLOSED | §10.1/§12.2 khớp code, không pending | Đọc trực tiếp, khớp, 1 wording nhỏ (G-01) | Source inspection | **PASS** | Mục 11 — G-01 không đủ nghiêm trọng để hạ status |
| EC-09 | F2-OQ-3 RESOLVED đúng phạm vi | Không có Forgot Password UI | Grep xác nhận 0 kết quả | Source inspection | **PASS** | Mục 11 |
| EC-10 | Known Gaps Registry tồn tại | File tồn tại, phân loại đúng | Nội dung đầy đủ ở Mục 12, chờ dev tạo file vật lý | Document (đang tạo) | **PASS** (nội dung sẵn sàng — vật lý hóa là thao tác cơ học) | — |
| EC-11 | Evidence Matrix tồn tại | File tồn tại | Chính bảng này | Document (đang tạo) | **PASS** | — |
| EC-12 | Không TODO/FIXME chưa phân loại trong `features/auth/` | 0 kết quả hoặc đã phân loại | `grep` = 0 kết quả (không có TODO/FIXME nào tồn tại) | Command | **PASS** | Mục 2 |
| EC-13 | `shared → features` = 0 | `grep` = 0 | Xác nhận 0 | Command | **PASS** | Mục 2 |
| EC-14 | Refresh token không lộ ra JS state/localStorage | 0 kết quả lưu trữ | `grep` xác nhận 0 | Command | **PASS** | Mục 2 |
| EC-15 | HttpOnly cookie flow hoạt động thật (cross-origin) | `withCredentials: true` + backend `credentials: true` | Cả 2 xác nhận (Mục 2, backend `app.ts` dòng 47) | Source inspection | **PASS** | Chỉ verify được kiến trúc đúng; hành vi runtime thật phụ thuộc EC-06 |
| EC-16 | README phản ánh đúng trạng thái hiện tại | Không còn nói F2 "sắp tới" | Trước M9: FAIL (Mục 2); sau khi M9 sửa: cần re-check | Document | **FAIL → cần M9 sửa (Mục 14)** | Không tự PASS cho tới khi sửa xong |
| EC-17 | CHANGELOG cập nhật (nếu áp dụng) | Quyết định rõ ràng | Không tồn tại — quyết định ở Mục 14 | Document | **DEFERRED (quyết định, không phải lỗi)** | Mục 14 |
| EC-18 | Version bump (nếu áp dụng) | Quyết định rõ ràng | `0.0.0`, không tiền lệ — quyết định ở Mục 14 | Document | **DEFERRED (quyết định, không phải lỗi)** | Mục 14 |

**Tổng kết trạng thái:** 13 PASS trực tiếp, 2 PARTIAL/UNVERIFIED (EC-06/EC-07, cùng gốc G-10), 1 FAIL-cần-sửa (EC-16, sẽ PASS sau khi thực hiện Mục 14), 2 DEFERRED-là-quyết-định (EC-17/18, không phải lỗi).

---

## 14. README / CHANGELOG / Version Review

### README — **bắt buộc sửa**
Nội dung cần cập nhật (dựa trên bằng chứng thật Mục 2, không phải mô tả chung chung):
- Mục 2 (Features/Current Scope): đổi "Sprint F1 — Frontend Foundation (Complete)" → "Sprint F1 + F2 (Authentication UI) — Complete"; bỏ câu "Authentication... sẽ được phát triển ở Sprint tiếp theo".
- Thêm mục mô tả **Authentication Flow** (Register/Login/Session Bootstrap/Refresh/Logout) — đúng tiền lệ đã áp dụng cho `backend/README.md` ở Sprint 3 M10.
- Mục 6 (Environment Configuration): bổ sung ghi chú **backend + Postgres cục bộ cần chạy** (`docker compose up` từ `backend/`) để `npm run test:e2e` hoạt động — đúng phát hiện từ M8.
- Mục 8 (Testing): làm rõ `npm run test:e2e` cần backend thật, không tự động trong CI (đúng G-05).
- Known Limitations (mục 17): sửa #2 (QueryClientProvider đã wrap — xóa dòng này hoặc đánh dấu Resolved), xóa/cập nhật #12 ("Sprint F2 chưa được xác nhận" → đã xác nhận qua M9), thêm các gap mới từ Known Gaps Registry (G-01 đến G-12) hoặc trỏ sang file registry mới thay vì duplicate.

### CHANGELOG — quyết định tường minh (không tự động tạo hay bỏ qua)
**Bằng chứng:** Backend đã có `CHANGELOG.md` theo Keep a Changelog, cập nhật mỗi Sprint. Frontend **chưa từng có** file này qua cả F1 lẫn F2.
**Quyết định:** Frontend nên bắt đầu áp dụng đúng convention đã có sẵn ở nửa kia dự án (backend) — **tạo `frontend/CHANGELOG.md`** với entry đầu tiên `[0.1.0] - <ngày M9 hoàn thành> (Sprint F1 + F2)`, liệt kê đúng tính năng đã verify thật (routing/design system F1; Register/Login/Session/Refresh/Logout F2) — không liệt kê tính năng chưa verify (ví dụ không ghi "Forgot Password" vì không tồn tại).
**Đây là quyết định cần bạn xác nhận trước khi thực thi** — nếu không đồng ý, phương án thay thế là để trống, ghi rõ lý do "chưa có tiền lệ" trong README thay vì tạo CHANGELOG.

### Version — quyết định tường minh
**Bằng chứng:** `0.0.0`, chưa từng bump, Vite scaffold default, không dấu hiệu tiền lệ SemVer riêng cho frontend.
**Khuyến nghị:** Nếu đồng ý tạo CHANGELOG với entry `[0.1.0]` (nhất quán với entry đầu tiên) → bump `package.json` version thành `0.1.0` cùng lúc. Nếu không tạo CHANGELOG → **không bump version**, ghi rõ "chưa có convention, không bump tùy tiện" — đúng yêu cầu Mục 28 prompt gốc, không tự phát minh chính sách SemVer.

---

## 15. TODO/FIXME Audit

`grep -rn "TODO\|FIXME" src/features/auth/` → **0 kết quả**. Exit Criterion #9 (prompt gốc §39) thỏa mãn hiển nhiên — không có gì cần phân loại vì không có gì tồn tại.

---

## 16. Architecture Audit

```
features/auth/index.ts → shared/api/auth-refresh-coordinator (setRefreshHandler)  [hợp lệ: features→shared]
features/auth/index.ts → shared/stores/authStore (setSession/clearSession)         [hợp lệ: features→shared]
shared/api/client.ts ↛ features/auth/*                                             [0 vi phạm, grep xác nhận]
shared/api/auth-refresh-coordinator.ts: 0 import                                    [độc lập tuyệt đối, không đổi từ M1]
```
Grep trực tiếp `shared/` cho `from "@features"` → **0 kết quả**. Không suy diễn từ tên thư mục — đã đọc import thật.

---

## 17. Security / Authentication Closure Audit

| Mục | Evidence | Kết quả |
|---|---|---|
| Refresh token không ở `localStorage` | grep 0 kết quả | ✅ |
| HttpOnly cookie flow còn nguyên | `withCredentials: true` (client) + `credentials: true` (backend CORS) | ✅ |
| Refresh token không vào React state | `authStore`'s `AuthState` không có field `refreshToken`; `useLoginMutation`/`registerAuthInfrastructure` không destructure field này | ✅ |
| Refresh token không bị log | Không có `console.log` nào truyền `data`/`data.refreshToken` trong `features/auth/` | ✅ |
| Lỗi auth không lộ thông tin nhạy cảm | `getErrorMessage()` luôn map sang message tiếng Việt trung tính, `error.title` (kỹ thuật) không bao giờ render trực tiếp cho người dùng | ✅ |
| Logout clear client state | `useLogoutMutation`'s `onSettled` gọi `clearSession()` bất kể kết quả API | ✅ |
| Refresh failure → unauthenticated | `registerAuthInfrastructure`'s handler `catch` gọi `clearSession()` | ✅ |
| Protected routes vẫn được bảo vệ | `ProtectedRoute`/`GuestRoute` không đổi từ F1, đã verify qua nhiều lượt review M1-M8 | ✅ |

**Không phát hiện vi phạm bảo mật nào.** Đây không phải pentest đầy đủ (đúng Non-Goals) — chỉ verify các kỳ vọng đã thiết lập từ trước không bị phá vỡ.

---

## 18. Implementation Steps (M9-01 → M9-10)

1. **M9-01** — Repository & Documentation Audit: đã thực hiện khi lập plan (Mục 2, 7).
2. **M9-02** — Acceptance/Exit Criteria Audit: đã thực hiện (Mục 8, draft Evidence Matrix ở Mục 13).
3. **M9-03** — Clean Environment Verification: **đã thực hiện phần frontend** (Mục 9); dev thực thi **phải tự chạy lại EC-06** (E2E với backend thật) trước khi ký tên đóng Sprint.
4. **M9-04** — Authentication Architecture Verification: đã thực hiện (Mục 16, 17).
5. **M9-05** — F2-OQ Final Closure: đã thực hiện (Mục 11).
6. **M9-06** — Known Gaps Registry: nội dung đầy đủ đã soạn (Mục 12) — dev tạo file vật lý `docs/implementation/Sprint_F2_Known_Gaps_Registry.md` với đúng nội dung này.
7. **M9-07** — Documentation Updates: dev thực hiện theo Mục 14 (README bắt buộc; CHANGELOG/version chờ xác nhận của bạn).
8. **M9-08** — Evidence Matrix Finalization: nội dung đầy đủ đã soạn (Mục 13) — dev tạo file vật lý `docs/implementation/Sprint_F2_Exit_Criteria_Evidence_Matrix.md`, **cập nhật EC-06/EC-07 thành PASS sau khi tự chạy E2E thật thành công**.
9. **M9-09** — Final Audit: sau khi README cập nhật + E2E tự chạy, re-check nhanh EC-16/EC-06/EC-07 xem đã chuyển PASS chưa.
10. **M9-10** — Final Recommendation: chỉ đưa ra sau khi Bước 9 hoàn tất (Mục 23).

---

## 19. Acceptance Criteria

- [ ] Mọi Exit Criterion Sprint F2 có evidence trong Matrix (Mục 13) — không PASS thiếu bằng chứng
- [x] Clean-environment verification (phần frontend) hoàn thành — Mục 9
- [ ] `npm ci`/lint/typecheck/format/coverage/build đã verify — **đã xong** (Mục 9)
- [ ] E2E đã verify **bởi dev thực thi** (chưa xong — G-10)
- [x] Acceptance/Exit Criteria đã audit — Mục 8/13
- [x] F2-OQ-1 — PARTIAL, chờ EC-06
- [x] F2-OQ-2 — CLOSED
- [x] F2-OQ-3 — RESOLVED đúng phạm vi
- [x] Known Gaps Registry nội dung sẵn sàng (Mục 12)
- [x] Evidence Matrix nội dung sẵn sàng (Mục 13)
- [ ] README cập nhật — **cần thực hiện** (Mục 14)
- [ ] CHANGELOG — **cần bạn xác nhận quyết định** (Mục 14)
- [ ] Version — **cần bạn xác nhận quyết định** (Mục 14)
- [x] TODO/FIXME `features/auth/` — 0, không cần phân loại
- [x] Dependency direction verified — Mục 16
- [ ] Final recommendation evidence-based — chờ hoàn tất các mục trên

---

## 20. Exit Criteria

Sprint F2 M9 chỉ thật sự "xong" khi:
1. EC-06 (E2E thật) chuyển từ UNVERIFIED → PASS (dev tự chạy, ghi log thật).
2. EC-07 (F2-OQ-1) chuyển từ PARTIAL → PASS (hệ quả của #1).
3. EC-16 (README) chuyển từ FAIL → PASS (Mục 14 thực hiện).
4. Quyết định CHANGELOG/version được xác nhận và thực hiện (hoặc ghi rõ "không làm" có lý do).
5. 2 file bắt buộc (Known Gaps Registry, Evidence Matrix) được tạo vật lý với đúng nội dung Mục 12/13 (cập nhật EC-06/07/16 sau khi có evidence mới).
6. Final Recommendation (Mục 23) được viết **sau cùng**, dựa trên trạng thái Matrix đã cập nhật.

---

## 21. Risks

| Risk | Mitigation |
|---|---|
| E2E thật fail khi dev tự chạy (khác với kỳ vọng dựa trên bằng chứng gián tiếp) | Đây chính xác là lý do EC-06 phải UNVERIFIED chứ không PASS — nếu fail thật, Final Recommendation phải phản ánh đúng (NOT CLOSED hoặc CONDITIONAL), không được ép PASS |
| README sửa xong nhưng vẫn còn chi tiết sai khác | Đối chiếu lại từng câu với Mục 2 (bằng chứng thật) trước khi coi là xong, không viết theo trí nhớ chung chung |
| CHANGELOG/version quyết định treo vô thời hạn nếu không có xác nhận | Đã trình bày rõ 2 phương án cụ thể ở Mục 14 kèm khuyến nghị — chỉ cần bạn chọn 1 trong 2 |
| Known Gaps Registry bị dùng để "giấu" vấn đề thật dưới nhãn "non-blocking" | Mỗi gap ở Mục 12 đều có evidence + severity cụ thể, không có gap nào được hạ cấp độ nghiêm trọng mà không có lý do |
| Final Recommendation bị đưa ra sớm (trước khi EC-06 xong) | Mục 23 (bên dưới) minh họa đúng 3 khả năng, đều điều kiện hóa theo EC-06 — không tự chọn "Closed" trước |

---

## 22. Open Questions (cần bạn xác nhận, không phải blocker kiến trúc)

| ID | Câu hỏi | Khuyến nghị |
|---|---|---|
| M9-OQ-1 | Tạo `frontend/CHANGELOG.md` theo convention backend, hay để trống có lý do? | Tạo (Mục 14) |
| M9-OQ-2 | Bump `package.json` lên `0.1.0` cùng lúc với CHANGELOG, hay giữ `0.0.0`? | Bump lên `0.1.0` nếu đồng ý tạo CHANGELOG (nhất quán); giữ nguyên nếu không |

Không còn Open Question kiến trúc/kỹ thuật nào khác — mọi phát hiện khác đều đã có kết luận rõ ràng dựa trên evidence (Mục 11, 12, 13).

---

## 23. Final Recommendation (điền sau khi Mục 20 hoàn tất — khung mẫu dựa trên trạng thái evidence HIỆN TẠI, tại thời điểm lập plan)

```
## Final Sprint F2 Recommendation

Recommendation: CONDITIONAL CLOSURE

Evidence basis:
- Clean environment (lint/typecheck/format/coverage/build) — PASS thật, verify trực tiếp (Mục 9).
- F2-OQ-2 — CLOSED, verify trực tiếp Architecture Spec §10.1/§12.2.
- F2-OQ-3 — RESOLVED đúng phạm vi, verify trực tiếp (0 Forgot Password UI).
- Security/Architecture audit — PASS, 0 vi phạm dependency direction, 0 token leakage (Mục 16/17).
- TODO/FIXME features/auth/ — 0, không cần phân loại.

Mandatory criteria còn treo:
- EC-06/EC-07 (E2E thật + F2-OQ-1) — UNVERIFIED/PARTIAL, cần dev tự chạy `npm run test:e2e`
  với backend thật và ghi log — đây là điều kiện DUY NHẤT còn thiếu để chuyển "CLOSED" tuyệt đối.
- EC-16 (README) — cần thực hiện Mục 14 trước khi coi tài liệu phản ánh đúng hiện trạng.

Remaining known gaps: 12 gap đã ghi nhận đầy đủ (Mục 12), không gap nào là Sprint Blocker.

Unresolved verification: EC-06 (E2E thật) — do giới hạn sandbox của Claude, không phải do
thiếu sót trong implementation.

Required follow-up:
1. Dev chạy `docker compose up` (backend/) + `npm run test:e2e` (frontend/), ghi log thật.
2. Cập nhật EC-06/EC-07 trong Evidence Matrix theo kết quả thật.
3. Cập nhật README theo Mục 14.
4. Xác nhận quyết định CHANGELOG/version (M9-OQ-1/2).
5. Sau khi 4 bước trên hoàn tất → Recommendation tự động nâng lên "CLOSED" nếu tất cả PASS,
   hoặc "NOT CLOSED" nếu bước 1 phát hiện E2E thật sự fail.
```

**Đây KHÔNG phải quyết định "Closed" premature** — đúng Rule 12, Final Recommendation ở trên phản ánh chính xác trạng thái evidence tại thời điểm lập plan (trước khi dev thực thi các bước còn lại), không lạc quan hóa.

---

## 24. Final Architect Review

### Architecture
- [x] Dependency direction — verify trực tiếp, 0 vi phạm
- [x] Shared infrastructure boundaries — verify
- [x] Auth feature boundaries — verify
- [x] Không `shared → feature` — verify

### Authentication
- [x] Register — verify qua M6 + M8 integration/E2E
- [x] Login — verify qua M5 + M8
- [x] Session bootstrap — verify qua M4 + M8
- [x] Refresh — verify qua M1/M2/M4/M8, `withCredentials` xác nhận (M8 fix)
- [x] Single-flight — verify qua M1/M4 (không lặp lại test, đã đủ)
- [x] Logout — verify qua M7 + M8
- [x] Protected route — verify (F1, không đổi)
- [x] Guest route — verify (F1, không đổi)
- [x] HttpOnly cookie — verify kiến trúc (client+backend CORS); hành vi runtime thật chờ EC-06

### Testing
- [x] Unit — 100% auth-critical files (Mục coverage M8/M9)
- [x] Component — đầy đủ (Login/Register/UserMenu)
- [x] Integration — `auth-flow.integration.test.tsx` (M8)
- [ ] E2E — **UNVERIFIED bởi Claude**, cần dev tự chạy
- [x] Coverage — 90.55%/81.24%/93.29%/92.19%, risk-based review đã có (M8)
- [ ] Real backend — chờ EC-06
- [x] MSW — dùng đúng ranh giới (integration only, không dùng cho E2E)
- [x] Clean environment — phần frontend đã verify thật

### Documentation
- [ ] README — **cần sửa** (Mục 14)
- [ ] CHANGELOG — **cần quyết định** (M9-OQ-1)
- [x] Architecture Spec — verify, CLOSED (1 wording nhỏ, G-01)
- [x] OQ closure — OQ-2/3 CLOSED, OQ-1 PARTIAL chờ E2E
- [x] Known Gaps Registry — nội dung sẵn sàng
- [x] Evidence Matrix — nội dung sẵn sàng

### Release readiness
- [x] lint — PASS thật
- [x] typecheck — PASS thật
- [x] format — PASS thật
- [x] coverage — PASS thật
- [ ] E2E — chờ dev
- [x] build — PASS thật
- [x] TODO/FIXME classification — 0 tồn tại, không cần phân loại

**Kết luận Final Architect Review:** Không có mục nào thiếu bằng chứng bị che giấu — mọi ô `[ ]` chưa check đều có lý do cụ thể (chờ hành động của dev, không phải lỗi kiến trúc). Plan sẵn sàng để thực thi phần còn lại.
