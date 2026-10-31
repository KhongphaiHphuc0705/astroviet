# Sprint F5 — M1: CI Seed & Contract Baseline — Implementation Plan

| | |
|---|---|
| **Trạng thái** | **COMPLETED & CLOSED** (2026-10-31: CI Run #41155563064 passed, Evidence Matrix đã hoàn thành tại `docs/implementation/archive/sprint-f5/Sprint_F5_M1_Exit_Criteria_Evidence_Matrix.md`) |
| **Ngày** | 2026-10-30 |
| **Baseline audit** | `dev` @ `cfd4247f2d5bb901d73ccb3d79206b1c50da8100` ("finalize sprint f4 closure & complete gaps registry"), `origin/dev` đồng bộ |
| **Vị trí đề xuất** | `docs/implementation/Sprint_F5_M1_Implementation_Plan.md` (theo quy ước plan trong `docs/implementation/`); Evidence Matrix đề xuất: `docs/implementation/archive/sprint-f5/Sprint_F5_M1_Exit_Criteria_Evidence_Matrix.md` |
| **Nhãn bằng chứng** | `[repo]` đọc mã · `[C-run]` Claude chạy lệnh không biến đổi trong sandbox · `[CI]` chỉ CI mới xác nhận được · `[UNVERIFIED]` chưa xác minh |

> Tài liệu này là kế hoạch, **không phải** bằng chứng hoàn thành. Không có mục nào dưới đây tuyên bố CI xanh, seed 252 bản ghi, hay probe đã pass — các việc đó chỉ xảy ra ở giai đoạn triển khai.

---

## Section A — Executive Summary

**Mục tiêu.** Làm cho job `Frontend CI` nạp được nội dung diễn giải thật vào DB E2E trước khi Backend khởi động, rồi chứng minh bằng phản hồi thật của `POST /charts/natal?save=true` rằng hợp đồng F5 cần (phiên bản, số mục, ngữ pháp khoá, định danh cung) đúng như giả định.

**Kết quả kỳ vọng.** (1) Một bước CI mới `npm run prisma:seed:content` đặt ngay sau bước "Migrate database", trước "Build backend"/"Start backend server"; log CI có `Seed successful! Outcome: inserted, Count: 252`. (2) Hai probe trên Backend thật: chart có giờ sinh → `interpretationVersion === "1.0"`, 21 mục; chart không rõ giờ sinh → `"1.0"`, 10 mục. (3) Baseline 130 file / 1049 test / 38 E2E được tái xác minh có định nghĩa. (4) Giả định `PlanetVM.sign.key` được kết luận *confirmed / revised / unresolved*.

**Phạm vi.** Một file workflow + (cần owner cho phép) bổ sung assertion vào **spec E2E hiện có** `frontend/e2e/chart.spec.ts` (S1.3, S2.3). Không đổi mã ứng dụng, Backend, Prisma, nội dung, API, dependency.

**Vì sao cần trước các milestone F5 khác.** Hiện CI không có nội dung diễn giải nên mọi E2E F5 sẽ rỗng hoặc pass giả `[repo]`. M2–M7 dựa vào: dữ liệu thật tồn tại trong CI, số mục kỳ vọng đúng, và khoá cung `sign.key` ghép được với `subjectKey`.

**Độ tin cậy hiện tại (dựa trên bằng chứng repo).** Cao cho thiết kế bước CI (mọi tiền điều kiện đã đối chiếu, xem B.2/B.3). Cao cho cách suy ra 21/10 (đọc từ mã). Trung bình cho giá trị runtime thật của 21/10 và `sign.key` (suy từ mã + fixture, **cần probe CI để chốt**). Không có blocker kỹ thuật phát hiện; chỉ cần quyết định owner (Section M).

---

## Section B — Repository Audit Findings

### B.1 Git và working tree
- Nhánh `dev`, HEAD `cfd4247`, `origin/dev` đồng bộ `[C-run]` (`git status -sb`, `git log`).
- Working tree sạch **trừ** file chưa theo dõi `docs/implementation/Sprint_F5_Implementation_Plan.md` (bản sandbox của Claude). Theo owner, plan F5 ở máy local đã cập nhật P-01…P-06 và sẽ commit sau.
- **Quy tắc không trộn:** commit F5 plan (`[docs]`) phải tách khỏi commit M1. Commit M1 chỉ chứa `.github/workflows/frontend-ci.yml` (+ `frontend/e2e/chart.spec.ts` nếu D-03 được duyệt). Trước khi commit chạy `git status --short` và `git diff --stat`; mọi file ngoài danh sách Section J là lỗi quy trình.
- Quy ước commit quan sát được: tiền tố `[feat]`/`[docs]`/`[refactor]` (log 40 commit gần nhất); commit CI trước đây: `[feat] add e2e specs & ci hardening` `[C-run]`. Quy ước nhánh/PR khác: **không tìm thấy tài liệu** `[UNVERIFIED]` → D-11.

### B.2 Seed script — `backend/prisma/seed-content.ts` (+ seeder/validator)

| # | Câu hỏi | Kết luận | Nguồn |
|---|---|---|---|
| 1 | Mục đích | Đọc JSON → validate → nạp vào bảng `astrology.interpretation_contents` | `seed-content.ts:12–126` |
| 2 | `--file` | Có; mặc định `prisma/content/interpretations.vi.json`, resolve theo `process.cwd()` ⇒ **phải chạy từ `backend/`** | `:15–17, :26` |
| 3 | `--validate-only` | Có (boolean) | `:19–22` |
| 4 | Validate | `validateInterpretationContentText`: kiểm version `major.minor`, trùng khoá, placeholder `[OWNER_CONTENT_REQUIRED]` khi `Published`, loại subject, ngữ pháp khoá, coverage so với tập MVP | `seed-content.ts:38`; `…/interpretation-content.validator.ts:100–225` |
| 5 | Trùng | `DUPLICATE_SUBJECT` theo `type:key` (validator) + unique index DB | validator `:127–131`; migration `20261004120000_…/migration.sql:43` |
| 6 | Idempotent | **Có**: cùng nội dung ⇒ `outcome:'unchanged'`, không ghi | seeder `:85–89`, `:134–159` |
| 7 | Cơ chế | Logic ứng dụng trong **một transaction** (`$transaction`) + unique expression index; không dùng upsert | seeder `:110–114`; migration `:43` |
| 8 | Có sửa/thay nội dung cũ? | Cùng version: giống hệt ⇒ không đổi; khác & còn `Draft` ⇒ **xoá rồi chèn lại**; khác & `Published/Archived` ⇒ `ContentSeedConflictError` (không ghi đè); chuỗi version khác nhưng tương đương ngữ nghĩa ⇒ conflict | seeder `:54–62`, `:91–107` |
| 9 | Thế nào là thành công | `Seed successful! Outcome: <inserted|unchanged|replaced-draft>, Count: <n>` rồi exit 0 | `seed-content.ts:112` |
| 10 | `--validate-only` có thật sự không ghi? | Có: thoát (`process.exit(0)`) tại `:99–102` **trước** `new PrismaClient()` (`:105`) ⇒ không kết nối DB. *Lưu ý:* vẫn `import { PrismaClient }` (`:7`) nên cần Prisma Client đã generate | `:99–105` |
| 11 | `DATABASE_URL` | Cần (chỉ ở chế độ seed); đọc qua `import 'dotenv/config'` từ `backend/.env` (`:2`) | `:2, :105` |
| 12 | `tsx` | Cần; script là `tsx prisma/seed-content.ts`; `tsx` ở `devDependencies` (`backend/package.json:95`, `^4.19.1`); `dotenv` ở `dependencies` (`:57`) | `backend/package.json:43` |
| 13 | Cần build Backend? | **Không** — chạy thẳng từ TypeScript bằng `tsx` (import `../src/...*.js` được tsx phân giải sang `.ts`) | `seed-content.ts:9–10` |
| 14 | Package khai báo | `backend/package.json` (`prisma:seed:content`); `prisma:seed` (`prisma db seed` → `tsx prisma/seed.ts`) là script **khác**, không dùng ở M1 | `backend/package.json:40–48` |
| 15 | Working dir | `backend` (đường dẫn mặc định tương đối + `.env`) | `:17, :26` |
| 16 | Lỗi → CI | Mọi nhánh lỗi gọi `process.exit(1)` (`:31, :80, :123, :130`) ⇒ npm trả mã khác 0 ⇒ bước `run` thất bại ⇒ job dừng (các bước sau bị bỏ qua theo `if: success()` mặc định) | `seed-content.ts` |
| 17 | Tiền điều kiện DB | Hàng `languages.code='vi'` (seeder ném `ContentSeedPrerequisiteError` nếu thiếu, `:35–40`) — **migration đã chèn** `('vi','Tiếng Việt',true) ON CONFLICT DO NOTHING` (`migration.sql:14`) ⇒ `prisma:deploy` đủ | seeder; migration |

**Bằng chứng chạy [C-run] (sandbox, không DB):**
- Gọi trực tiếp validator trên `backend/prisma/content/interpretations.vi.json`: `ok=true`, 0 issue, coverage **252/252** (0 thiếu, 0 thừa), `items=252`, `version="1.0"`, `status="Published"`.
- Chạy `tsx prisma/seed-content.ts --validate-only` trong sandbox **thất bại ở import** (`PrismaClient` không được export) vì sandbox không tải được engine Prisma (`binaries.prisma.sh` bị chặn) nên không `prisma generate` được. Đây là bằng chứng **phụ thuộc thực sự**: script yêu cầu Prisma Client đã generate; trong CI việc đó xảy ra ở bước "Migrate database" (`frontend-ci.yml:97`). Seed thật và `--validate-only` đầy đủ chỉ xác nhận được trong CI `[CI]`.
- Seed **chưa** được chạy với DB; migration **chưa** được áp dụng.

### B.3 Workflow — `.github/workflows/frontend-ci.yml`
Một job `build` (`ubuntu-24.04`), service `postgres:16-alpine` (DB `astroviet_e2e`, health `pg_isready`) `[repo]`. Trình tự (số dòng hiện tại):

| Dòng | Bước |
|---|---|
| 35 / 37 | checkout / Node 22 (cache `frontend/package-lock.json`) |
| 45 / 49 | `npm ci` frontend / `cp .env.example .env` |
| 53 / 57 / 61 | `format:check` / `lint` / `typecheck` |
| 65 | `Test` = `npm run test:coverage` |
| 69 | `Build` = `npm run build` |
| 74 | `Install backend dependencies` = `npm ci` (kèm devDependencies ⇒ có `tsx`) |
| 78–92 | `Setup backend environment`: ghi `backend/.env` (gồm `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/astroviet_e2e`, giá trị CI-test đã có sẵn, **không phải secret thật**) |
| 94–98 | `Migrate database`: `prisma:generate` rồi `prisma:deploy` (một bước) |
| 100 | `Build backend` (`npm run build`) |
| 104–123 | `Start backend server` (`node dist/server.js`, chờ `/live` tối đa 30×2 s) |
| 126 / 130 | cài Playwright / `Run E2E Tests` = `npm run test:e2e` |
| 134 / 141 | upload `backend.log` / report Playwright **chỉ khi `failure()`** |

Không có bước kiến trúc/a11y riêng; không có `continue-on-error` `[repo]`. Backend có workflow riêng `backend-ci.yml` (không seed nội dung, không bị thay đổi) `[repo]`.

**Vị trí chèn đúng (và tương thích):** ngay sau bước `Migrate database` (kết thúc dòng 98), trước `Build backend` (dòng 100), tức trước `Start backend server`. Kiểm tiền điều kiện tại điểm này:

| Điều kiện | Có sẵn? | Bằng chứng |
|---|---|---|
| DB sẵn sàng + migration xong | Có — `prisma:deploy` vừa thành công ngay trước | dòng 94–98 |
| Bảng/constraint/`languages(vi)` | Có — từ migration `20261004120000_init_interpretation_content_bank` | `migration.sql:14, 34–46` |
| Prisma Client đã generate | Có — `prisma:generate` ở dòng 97 | dòng 97 |
| `tsx`, `dotenv` | Có — `npm ci` (dòng 76) | `package.json:57, 95` |
| `DATABASE_URL` | Có — `.env` đã ghi ở dòng 81–92; `dotenv/config` nạp từ cwd `backend` | dòng 85; `seed-content.ts:2` |
| File JSON trong checkout | Có — `backend/prisma/content/interpretations.vi.json` được theo dõi trong git `[C-run]` | — |
| Cần build Backend? | Không | B.2 #13 |
| Backend chỉ khởi động sau seed? | Có — bước start ở dòng 104 nằm sau điểm chèn | dòng 104 |

⇒ **Vị trí yêu cầu tương thích, không cần điều chỉnh.** Lưu ý: bước hiện có tên là `Migrate database` (gộp generate + deploy); "ngay sau `prisma:deploy`" = ngay sau bước này.

**Tương tác với cleanup/artifact:** nếu seed lỗi, các bước sau (gồm Start backend) bị bỏ qua; `Upload backend log on failure` (`if: failure()`) sẽ chạy nhưng `backend/backend.log` chưa tồn tại — `upload-artifact` mặc định cảnh báo (không lỗi) khi không có file; lỗi seed hiển thị ngay trong log bước. Không có bước cleanup thủ công; service container bị huỷ cùng job (DB sạch mỗi lần chạy ⇒ seed luôn `inserted`) `[repo]`.

### B.4 Hợp đồng `ChartResponse` và `PlanetVM.sign`
- FE: `ChartInterpretationDto`, `ChartResponse.interpretations`, `interpretationVersion` — `frontend/src/features/chart/api/types.ts`; spec E2E hiện khoá **14 trường** (`e2e/chart.spec.ts` S1.3). `isBirthTimeKnown` **không** có trong `ChartResponse` (FG-01) ⇒ nguyên nhân thiếu Nhà chỉ suy ra từ **đầu vào test**, không từ API.
- Sinh tập subject: `backend/src/modules/chart/domain/interpretation/derive-interpretation-subjects.ts:15–61`: (1) `PlanetInSign` cho từng hành tinh trong `MVP_INTERPRETATION_PLANETS` (10: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto — `interpretation.types.ts:23–34`) nếu có trong chart; (2) `AngleInSign` cho Ascendant **nếu `angles` có Ascendant**; (3) `PlanetInHouse` **chỉ khi `isHouseDataAvailable`** và `planet.house !== null`. Thứ tự kết quả: PlanetInSign → AngleInSign → PlanetInHouse.
- Tra cứu: pinned version hoặc bản Published mới nhất; **không có Published ⇒ `{version:null, items:[]}`**; subject không có bản ghi bị bỏ qua (log warn) — `application/services/interpretation-lookup.service.ts`.
- `PlanetVM.sign` = `resolveSign(zodiacPosition.sign)` ⇒ `GlyphLabel{key,labelVi,glyph,known}`; **khi chuỗi cung nằm trong `SIGN_LABELS`, `key` đúng bằng chuỗi gốc của Backend** (ví dụ `"Capricorn"`); khi lạ, `key` là `rawKey` và `known=false` — `frontend/src/features/chart/model/labels.ts:182–199`; `chartViewModel.ts:344–350` (`key: planetName`, `sign: signLabel`).
- Enum cung Backend (`ZODIAC_SIGNS`, `chart.types.ts:1…`) và FE (`KNOWN_ZODIAC_SIGNS`, `api/types.ts:24…`) cùng dùng tên tiếng Anh (`Aries`…); ngữ pháp khoá: `${planet}_in_${sign}`, `${planet}_in_House_${n}`, `Ascendant_in_${sign}` (`interpretation-subject-key.ts`). **Kết luận tạm: suy ra từ mã là *confirmed* cho cung đã biết; giá trị runtime thật cần probe (E.3).**

### B.5 Hạ tầng E2E
- `frontend/e2e/chart.spec.ts`: helper `registerAndLogin`, `createBirthProfile` (mock **chỉ** `locations/search` — GeoNames; mọi API khác là Backend thật), `attachErrorObservers`.
- **S1.3** (dòng ~156–214): bấm "Tính lá số" ⇒ `waitForResponse` của `POST /api/v1/charts/natal` ⇒ lưu `chartResponseJson`, kiểm 14 trường, `isHouseDataAvailable===true`, `houses` dài 12. Hồ sơ: sinh `1995-10-25`, `08:30`, Đà Nẵng (dữ liệu tổng hợp).
- **S2.3** (dòng ~417–457): hồ sơ "Hồ sơ Không Giờ Sinh", `1998-05-12`, bỏ chọn "Tôi biết rõ giờ sinh của mình"; kiểm `isHouseDataAvailable===false`, `houses=[]`, `angles=[]`, mọi `planet.house===null`.
- Client gửi `params: { save: true }` (`frontend/src/features/chart/api/createNatalChart.ts:17`) ⇒ chart được lưu và ghim phiên bản.
- Playwright (`frontend/playwright.config.ts`): `chromium`, `workers: 1` + `retries: 2` trên CI, `reporter: "html"` (không in kết quả test ra console), `webServer: npm run dev`. `--list` ⇒ **38 test / 7 file** `[C-run]`.
- Backend thật + Postgres: có (job CI).

### B.6 Baseline đo được `[C-run]` tại `cfd4247`

| Chỉ số | Giá trị | Định nghĩa & lệnh | Xác minh cục bộ | Ghi chú |
|---|---|---|---|---|
| File test Vitest | **130** | file `src/**/*.test.ts(x)` được Vitest thu thập: `find src -name "*.test.ts*"` = 130 và `npx vitest list --json` (đếm file duy nhất) = 130 | Có, không biến đổi | `e2e/**` bị loại (`vite.config.ts:17`) |
| Test case Vitest | **1049** | số mục `npx vitest list --json` (thu thập, **không chạy**) | Có | "Thu thập" ≠ "pass"; số pass/fail chỉ từ `npm run test:coverage` trên `[CI]` |
| E2E | **38** | `CI=1 npx playwright test --list`: 38 khai báo, 7 file, 1 project | Có | không tính retry; chạy thật cần Backend `[CI]` |
| Typecheck / Format | exit 0 / pass | `npm run typecheck`, `npm run format:check` | Có (đã chạy ở bản audit F5 plan) | — |
| Lint, coverage, build, E2E pass | — | CI | Không | `[CI]` là nguồn thẩm quyền |

Số "130 file" trong tài liệu F4 khớp **định nghĩa file test Vitest**, không phải tổng file tracked hay file nguồn. Lần chạy `vitest run` đầy đủ trong sandbox không hoàn tất trong giới hạn thời gian ⇒ **số pass chưa tái xác minh cục bộ**.

### B.7 "Section 12" — các cổng chất lượng
- `Frontend_UI_Specification.md` §12 là **"Astrology Components (Phase 3)"**, *không* phải danh sách cổng chất lượng ⇒ tham chiếu trong prompt M1 không áp dụng theo nghĩa đen `[repo: UI Spec dòng 791]`.
- Tài liệu có Mục "Quality Gates" thật: `Sprint_F5_Implementation_Plan.md` **Mục 12** (đề xuất đã dùng ở bước plan trước) và tiền lệ `Sprint_F4_Implementation_Plan.md` §46 (dòng 791).
- Ở đây "Section 12" được hiểu là **Mục 12 của F5 Implementation Plan** (D-08, cần owner xác nhận). Bản sandbox của mình chưa phản ánh chỉnh sửa local của owner; trước khi triển khai, đối chiếu lại danh sách cổng ở bản local.

| Cổng (F5 plan Mục 12) | Thực thi hiện tại trong workflow | M1 có ảnh hưởng? | Bằng chứng |
|---|---|---|---|
| Lint `npm run lint` | dòng 57 | Không (không đổi mã nguồn); nếu sửa `chart.spec.ts` thì **có** (ESLint quét `e2e`) | log bước |
| Typecheck | dòng 61 | `tsconfig` có thể gồm `e2e`/node project — kiểm khi sửa spec | log bước |
| Format `format:check` | dòng 53 | Có nếu sửa YAML/TS (Prettier) | log bước |
| Unit `npm test` | không chạy riêng; `test:coverage` bao trùm (dòng 65) | Không | log `Test Files/Tests` |
| Coverage `test:coverage` | dòng 65 | Không; ngưỡng coverage: `[UNVERIFIED]` (chỉ đọc 26 dòng đầu cấu hình, không thấy `thresholds`) | log bước |
| Build `npm run build` | dòng 69 | Không | log bước |
| E2E `test:e2e` | dòng 130 | **Có** (assertion mới nếu D-03) | CI + report |
| CI xanh trên commit cuối | job `build` | **Có** | run URL |
| grep an toàn (`dangerouslySetInnerHTML`, `fetch/axios` ngoài `shared/api`) | **không có trong CI** | Không | chạy tay: `grep -rn "dangerouslySetInnerHTML" frontend/src` = 0 `[C-run]`; thêm vào CI là ngoài phạm vi M1 |
| Boundary lint | **absent** (nợ F4) | Không | không thêm |

---

## Section C — Decisions and Assumptions

| ID | Quyết định / giả định | Bằng chứng | Quyết định đã chốt từ Owner | Trạng thái phê duyệt |
|---|---|---|---|:---:|
| **D-01** | Vị trí seed trong workflow CI | B.3: tương thích | Bước `Seed interpretation content` đặt ngay sau `Migrate database`, trước `Build backend` | **APPROVED** |
| **D-02** | An toàn & idempotent | B.2 #6–8; DB CI sạch mỗi job | Không cần cờ/bảo vệ thêm; không retry; không `continue-on-error` | **APPROVED** |
| **D-03** | Probe: sửa spec có sẵn hay spec mới | B.5: S1.3/S2.3 đã chặn đúng phản hồi thật | **Thêm assertion thường trực vào S1.3 và S2.3** của `chart.spec.ts` (không tạo spec mới, không "tạm thời") | **APPROVED** |
| **D-04** | Số mục kỳ vọng 21/10 | B.4: 10+1+10 và 10 | Khẳng định cứng (21 mục cho Probe A, 10 mục cho Probe B); lệch ⇒ chẩn đoán (E.4), không sửa resolver | **APPROVED** |
| **D-05** | Số 252 ≠ số mục/chart | B.2, E.5 | 252 là tổng kho seed nội dung; 21/10 là số mục áp dụng cho 1 chart cụ thể; không bao giờ so 252 với response | **APPROVED** |
| **D-06** | `PlanetVM.sign.key` | B.4: `key` = chuỗi Backend khi `known` | Ghi **Confirmed (từ mã) — chờ probe thật**; F5 chỉ ghép khoá khi `sign.known===true` | **APPROVED** |
| **D-07** | Phương pháp baseline | B.6 | Dùng định nghĩa B.6 (130 file Vitest, 1049 case, 38 Playwright E2E); CI là thẩm quyền cho pass | **APPROVED** |
| **D-08** | Thẩm quyền "Section 12" | B.7 | Mục 12 của F5 plan (Quality Gates) + F4 §46 làm tiền lệ | **APPROVED** |
| **D-09** | Phạm vi file test | Section J | Chỉ sửa `frontend/e2e/chart.spec.ts` | **APPROVED** |
| **D-10** | Nơi lưu bằng chứng | F4: `docs/implementation/archive/sprint-f4/…Evidence_Matrix.md` + `evidence/` | Tạo `docs/implementation/archive/sprint-f5/Sprint_F5_M1_Exit_Criteria_Evidence_Matrix.md`; đính kèm trích log seed vào Matrix | **APPROVED** |
| **D-11** | Quy ước commit/nhánh | B.1 | Một commit `[feat]` cho workflow+spec trên `dev`; commit `[docs]` riêng cho Evidence Matrix | **APPROVED** |
| **D-12** | Cách thu bằng chứng probe khi CI xanh | `reporter:"html"` không in console; report chỉ upload khi lỗi | Mặc định: assertion cứng + message chẩn đoán. Ghi 1 dòng đếm vào `$GITHUB_STEP_SUMMARY` nếu biến môi trường tồn tại | **APPROVED** |

---

## Section D — Step-by-Step Implementation Plan

> Chỉ bắt đầu sau khi owner duyệt plan (D-01…D-12). Không bước nào được dùng `continue-on-error`, nới/bỏ gate, retry để che lỗi seed.

### M1.0 — Pre-flight (không đổi file)
- **Mục tiêu:** bắt đầu từ trạng thái sạch, không trộn việc.
- **Files đọc:** — · **Hành động:** `git switch dev && git pull --ff-only`; `git status --short` (kỳ vọng sạch; plan F5 đã commit riêng bằng `[docs]` trước, hoặc còn untracked và **không** được `git add`); ghi SHA gốc.
- **Điều kiện:** owner duyệt. · **Kết quả:** SHA gốc được ghi. · **Lỗi:** working tree bẩn ⇒ dừng, hỏi owner. · **Bằng chứng:** SHA + `git status`. · **Phụ thuộc:** không.

### M1.1 — Xác nhận lại tiền điều kiện seed (đọc)
- **Files đọc:** `backend/prisma/seed-content.ts`, `…/interpretation-content.seeder.ts`, `backend/package.json`, `frontend-ci.yml`.
- **Hành động:** đối chiếu lại B.2/B.3 với HEAD thực tế (nếu `dev` đã dịch chuyển so với `cfd4247`, cập nhật số dòng).
- **Kết quả:** không có lệch; nếu lệch, báo owner trước khi sửa.
- **Hoàn tất khi:** bảng tiền điều kiện B.3 vẫn đúng.

### M1.2 — Thêm bước seed vào workflow
- **File sửa:** `.github/workflows/frontend-ci.yml` (duy nhất file này ở bước này).
- **Hành động (dry-run đã kiểm YAML hợp lệ trong `/tmp`, **không** áp dụng vào repo):**
  ```diff
  @@ -97,6 +97,10 @@
           npm run prisma:generate
           npm run prisma:deploy
   
  +    - name: Seed interpretation content
  +      working-directory: backend
  +      run: npm run prisma:seed:content
  +
       - name: Build backend
         working-directory: backend
         run: npm run build
  ```
  Sau thay đổi, thứ tự: … `Migrate database` → `Seed interpretation content` → `Build backend` → `Start backend server` … `[C-run: parse YAML]`.
- **Lệnh/ môi trường:** `npm run prisma:seed:content` tại `backend`; biến cần: `DATABASE_URL` (đã có trong `backend/.env` do bước dòng 78–92 tạo; **không** thêm giá trị mới, không thêm secret); không cần `NODE_ENV` đặc biệt.
- **Không làm:** không thêm `continue-on-error`, `|| true`, retry, `--validate-only` thay cho seed, `if:`; không đổi bước khác; không đổi đường dẫn `paths` trigger.
- **Kết quả kỳ vọng (log):** `Reading content from: …/interpretations.vi.json` → `Validating content...` → `Validation passed!` → `Coverage: 252/252` → `Placeholder count: 0` → `Connecting to database...` → `Seeding content to database...` → `Seed successful! Outcome: inserted, Count: 252` (các chuỗi này lấy từ `seed-content.ts:34–112`; nội dung log thực tế chỉ có sau khi CI chạy `[CI]`).
- **Lỗi:** validation/DB/prereq lỗi ⇒ exit 1 ⇒ job đỏ (Section K).
- **Bằng chứng:** trích dòng log trên + tên bước.
- **Hoàn tất khi:** diff đúng 4 dòng thêm, không dòng xoá.

### M1.3 — Bổ sung probe vào `chart.spec.ts` (nếu D-03 được duyệt)
- **File sửa:** `frontend/e2e/chart.spec.ts` (S1.3 và S2.3); không file test khác.
- **Hành động:** thêm assertion ngay sau các assertion hiện có, dùng chính biến phản hồi đã chặn (`chartResponseJson`/`chartJson`); mở rộng kiểu cục bộ của `chartJson` ở S2.3 cho `interpretations`, `interpretationVersion`, `planets[].sign`. Đặc tả đầy đủ ở Section E. Không đổi/nới assertion hiện có; không đọc/ghi dữ liệu mới; không `console.log` toàn bộ phản hồi.
- **Điều kiện:** M1.2 đã có trên cùng commit hoặc commit trước.
- **Lỗi:** lệch số mục ⇒ không "sửa số kỳ vọng cho khớp" mà chạy E.4.

### M1.4 — Kiểm tra cục bộ không biến đổi
- **Lệnh (tại `frontend`; cần `cp .env.example .env` như CI):** `npm run format:check`, `npm run lint`, `npm run typecheck` (spec thuộc phạm vi các lệnh này — kiểm `tsconfig.node.json`/ESLint có gồm `e2e/`), `CI=1 npx playwright test --list` (kỳ vọng vẫn **38**; **không tạo thêm khai báo test**).
- **Không chạy:** `test:e2e` cục bộ (cần Postgres+Backend; sẽ ghi DB), `prisma:*` lên DB thật.
- **Bằng chứng:** exit code + số test liệt kê.

### M1.5 — Commit & đẩy
- **Hành động:** `git add .github/workflows/frontend-ci.yml frontend/e2e/chart.spec.ts` (đúng 2 đường dẫn); `git diff --cached --stat` phải chỉ có 2 file; commit `[feat] seed interpretation content in frontend ci` (tiền tố theo quy ước quan sát được); push `dev`.
- **Lỗi:** `--stat` có file khác ⇒ `git restore --staged`, dừng.

### M1.6 — Theo dõi CI
- **Hành động:** mở run `Frontend CI` của commit M1; đọc theo thứ tự: seed → toàn bộ gate → E2E. Lấy: URL run, SHA, trích log seed, `Test Files/Tests` của `test:coverage`, kết quả E2E (số pass), step summary (nếu D-12).
- **Kết quả:** job xanh; seed `inserted 252`; hai probe pass.
- **Nếu đỏ:** theo Section K; **không** re-run để "qua" nếu nguyên nhân chưa rõ (Playwright đã `retries:2`; probe là deterministic nên pass-sau-retry phải bị coi là bất thường và điều tra).

### M1.7 — Kết luận `sign.key` và baseline; đóng M1
- **Hành động:** điền Evidence Matrix + Closure Report (Section N) bằng số liệu CI thật; ghi kết luận D-06 (*confirmed / revised / unresolved*); commit `[docs]` riêng cho tài liệu bằng chứng.
- **Hoàn tất khi:** Section H đủ; owner ký.

**Phụ thuộc giữa bước:** M1.0 → M1.1 → M1.2 → M1.3 → M1.4 → M1.5 → M1.6 → M1.7 (tuần tự; M1.3 có thể soạn song song M1.2 nhưng cùng một commit).

---

## Section E — Contract Probe Specification

### E.1 Nguyên tắc
Probe chạy trên Backend thật + DB thật đã seed. **Không** mock phản hồi diễn giải. Mock hiện có duy nhất là `locations/search` (GeoNames), không liên quan nội dung diễn giải. **Vòng đời:** *thường trực* (không gắn nhãn "tạm thời") — vì số mục 21/10 và `interpretationVersion` chính là hợp đồng F5 dựa vào; xoá probe sẽ làm mất khả năng phát hiện lệch hợp đồng/seed trong tương lai (R9). Nếu owner muốn probe tạm thời, phải ghi vào Evidence Matrix số liệu thật và nơi phát hiện lệch về sau (đề xuất: giữ nguyên assertion).

### E.2 Luồng và đầu vào (lấy từ spec hiện có, không bịa)
- Đăng ký + đăng nhập tài khoản E2E cô lập (helper `registerAndLogin`); tạo hồ sơ qua UI (`createBirthProfile`), bấm "Tính lá số" ⇒ `POST /api/v1/charts/natal` với `save: true`.
- **Probe A** (S1.3): hồ sơ có giờ sinh (`1995-10-25`, `08:30`, Đà Nẵng — dữ liệu tổng hợp).
- **Probe B** (S2.3): hồ sơ bỏ chọn "Tôi biết rõ giờ sinh của mình" (`1998-05-12`, Đà Nẵng).

### E.3 Assertion (thêm vào spec hiện có)

**Probe A (S1.3)** — sau các assertion hiện có:
1. `interpretationVersion === "1.0"`.
2. `isHouseDataAvailable === true` (đã có).
3. `interpretations.length === 21`; phân rã theo `subjectType`: `PlanetInSign=10`, `AngleInSign=1`, `PlanetInHouse=10`.
4. Mọi mục: `language === "vi"`, `bodyText` là chuỗi không rỗng, `subjectType` ∈ ba loại MVP; `subjectKey` không trùng.
5. **Ghép khoá từ dữ liệu thật:** với mỗi hành tinh MVP (10), `${planet.name}_in_${planet.sign}` có trong tập `PlanetInSign.subjectKey`; `${planet.name}_in_House_${planet.house}` có trong tập `PlanetInHouse.subjectKey`; `Ascendant_in_${sign của Ascendant}` có trong `AngleInSign` (dùng trường cung có thật trong `angles[]`; xác định tên trường đúng từ `types.ts` khi cài đặt).
6. Mọi `planets[].sign` ∈ 12 cung `KNOWN_ZODIAC_SIGNS` (chứng minh `resolveSign(...).known===true` và `key===sign`, xem `labels.ts:182–190`).

**Probe B (S2.3)** — sau các assertion hiện có (version/nhà/góc/`house=null` đã có):
1. `interpretationVersion === "1.0"`.
2. `interpretations.length === 10`, tất cả `PlanetInSign`; không có `PlanetInHouse`/`AngleInSign`.
3. Ghép khoá `${name}_in_${sign}` cho 10 hành tinh MVP như trên.
4. Suy giảm này là trạng thái hợp lệ (HTTP 200), **không** lỗi hạ tầng. Nguyên nhân thiếu Nhà được xác lập bằng **đầu vào test** (đã bỏ chọn giờ sinh) cộng `houses=[]`, `angles=[]` — không suy từ `isHouseDataAvailable` một mình.

### E.4 Thu thập & chẩn đoán lệch
- Mọi `expect` kèm message có số thực tế: `version`, `count`, đếm theo `subjectType`, `isHouseDataAvailable`.
- Nếu lệch số: (1) xác định loại/khoá thực tế còn thiếu bằng cách so với tập subject suy từ chính phản hồi (`planets/angles/isHouseDataAvailable` → quy tắc derive ở B.4); (2) `version === null` hoặc `[]` ⇒ seed không áp dụng hoặc chưa có Published (kiểm log seed); (3) thiếu vài mục ⇒ Backend skip + warn (`backend.log` ở `LOG_LEVEL=warn` đã được upload khi lỗi); (4) version khác `"1.0"` ⇒ có bản Published khác/ghim khác; (5) thừa/thiếu hành tinh ⇒ dữ liệu chart. Phân loại: chấp nhận được / cần owner / chặn F5 (D-04). **Không** sửa resolver hay nội dung để khớp số.
- Chẩn đoán trong CI lỗi: dùng `backend-log` + report Playwright (đã upload khi `failure()`).
- Nếu D-12 được duyệt: một dòng tóm tắt đếm (không dữ liệu cá nhân) ghi vào `$GITHUB_STEP_SUMMARY` khi biến tồn tại; nếu không, bằng chứng green-path là chính các assertion cứng + số `Count` trong log seed.

### E.5 252 so với 21/10
| Khái niệm | Giá trị | Nguồn |
|---|---|---|
| Mục trong JSON nguồn | 252 = 120 `PlanetInSign` + 120 `PlanetInHouse` + 12 `AngleInSign` | `interpretations.vi.json` `[C-run]` |
| Bản ghi seed vào DB | 252 (log seed: `Count: 252`) | `seed-content.ts:112` `[CI]` |
| Khoá tra cứu của resolver | các subject suy từ chart (10 + 0/1 + 0/10) | `derive-interpretation-subjects.ts` |
| Áp dụng cho **một** chart | 10 cung + 10 nhà + 1 Ascendant của chart đó = 21 (hoặc 10) | B.4 |
| Trả trong `ChartResponse` | đúng các subject có bản ghi Published, theo thứ tự derive | `interpretation-lookup.service.ts` |

252 là kích thước kho nội dung; 21/10 là phần kho áp dụng cho một chart cụ thể. Log seed `252` **không** chứng minh API đã trả đúng nội dung — chỉ probe mới chứng minh.

### E.6 Xác minh `PlanetVM.sign` bằng phản hồi thật
- Phản hồi thật là DTO; VM được dựng ở FE. Bằng chứng gồm hai nửa: (a) **runtime thật** — assertion E.3 #5–6 chứng minh `planets[].sign` ∈ 12 tên tiếng Anh và ghép đúng `subjectKey` thật; (b) **hàm chuyển đổi** — `resolveSign` trả `key === chuỗi gốc` khi `known` (`labels.ts:182–190`; unit test hiện có của `labels`/`chartViewModel` + fixture chụp từ Backend thật, ví dụ `"Capricorn"`).
- Tuỳ chọn một lần (không commit): chạy `toChartViewModel` trên phản hồi thật đã chụp (qua script `tsx` tạm) để in `vm.planets[*].sign.key`/`known` làm bằng chứng — chỉ thực hiện nếu owner muốn kiểm VM trực tiếp.
- **Kết luận cho D-06:** *confirmed* khi assertion #5–6 pass trên CI và `known===true` cho cả 10 hành tinh; *revised* nếu có cung ngoài danh sách hoặc khoá không khớp (khi đó đề xuất ánh xạ tối thiểu ở F5.M2 và báo owner); *unresolved* nếu CI không chạy được probe.

---

## Section F — Verification Matrix

| ID | Kiểm tra | Lệnh / thủ tục | Ngữ cảnh | Kết quả kỳ vọng | Bằng chứng | Phân loại lỗi |
|---|---|---|---|---|---|---|
| V-01 | Audit seed script | đọc `seed-content.ts`, seeder, validator | Nguồn | B.2 | file:dòng | — |
| V-02 | Validate nội dung không ghi DB | gọi validator trực tiếp (đã làm `[C-run]`) / `tsx prisma/seed-content.ts --validate-only` trong CI nếu cần | cục bộ / CI | ok, 252/252, 0 issue | output | Content |
| V-03 | Thứ tự CI | xem workflow + log | workflow + CI | Migrate → Seed → Build backend → Start | diff + tên bước trong log | CI-config |
| V-04 | Seed chạy | bước M1.2 | CI | `Outcome: inserted, Count: 252` | trích log | Seed |
| V-05 | Seed lỗi ⇒ job lỗi | thiết kế (exit 1, không `continue-on-error`) + đọc workflow | repo | không có cơ chế nuốt lỗi | grep workflow: 0 `continue-on-error` | CI-config |
| V-06 | Probe A | S1.3 mở rộng | CI Backend thật | `"1.0"`, house=true, 21 (10/1/10) | CI + step summary | Contract |
| V-07 | Probe B | S2.3 mở rộng | CI Backend thật | `"1.0"`, house=false, 10 (10×PlanetInSign) | CI + step summary | Contract |
| V-08 | `sign` runtime | E.3 #5–6, E.6 | CI | confirmed/revised/unresolved | assertion + ghi chú | Contract |
| V-09 | Baseline | `vitest list --json`, `playwright --list`; CI `test:coverage`/E2E | cục bộ + CI | 130 / 1049 / 38 (có định nghĩa) | output + log CI | Baseline |
| V-10 | Format | `npm run format:check` | CI dòng 53 | pass | log | Gate |
| V-11 | Lint | `npm run lint` | CI dòng 57 | pass | log | Gate |
| V-12 | Typecheck | `npm run typecheck` | CI dòng 61 | pass | log | Gate |
| V-13 | Unit+coverage | `npm run test:coverage` | CI dòng 65 | pass; số test ≥ baseline | log | Gate |
| V-14 | Build | `npm run build` | CI dòng 69 | pass | log | Gate |
| V-15 | E2E toàn bộ | `npm run test:e2e` | CI dòng 130 | 38 pass (không `skip/only`) | CI/report | Gate |
| V-16 | Grep an toàn | `grep -rn "dangerouslySetInnerHTML" frontend/src` | cục bộ | 0 | output | Gate (thủ công) |
| V-17 | Không nới gate | review diff workflow + spec | PR/commit | chỉ thêm; không xoá/skip/`only` | diff | Gate |
| V-18 | Hồi quy F4/Backend | các suite trên + `backend-ci.yml` (kích hoạt vì đường dẫn `backend/**` không đổi ⇒ không chạy nếu chỉ sửa workflow frontend/spec — ghi nhận) | CI | xanh | run | Regression |
| V-19 | Không lộ bí mật/PII | review log/diff: không in token/mật khẩu/response đầy đủ | review | sạch | review ghi chú | Privacy |

---

## Section G — Baseline and Evidence Plan

Không giả định thư mục artifact có sẵn. Đề xuất nhỏ nhất, theo quy ước F4:
- Tạo `docs/implementation/archive/sprint-f5/Sprint_F5_M1_Exit_Criteria_Evidence_Matrix.md` (cần owner duyệt thư mục mới — D-10).
- Trong Matrix ghi: SHA commit M1, URL run Frontend CI (định dạng như `EV-M1-31` ở F4), trích log seed (3–6 dòng), `interpretationVersion`, `isHouseDataAvailable`, số mục và phân rã theo loại của Probe A/B, kết luận `sign.key`, số liệu baseline có định nghĩa (130/1049/38 + số pass thật từ `test:coverage` và E2E), kết quả từng gate (V-10…V-17), và mọi lệch + giải thích. Nhãn `VERIFIED / PARTIALLY VERIFIED / UNVERIFIED / ACCEPTED GAP` theo quy ước F4.
- Không commit ảnh/log lớn; không đưa token, mật khẩu, chuỗi kết nối, dữ liệu sinh ngoài các giá trị tổng hợp đã nằm sẵn trong spec.

---

## Section H — Acceptance Criteria

| # | Tiêu chí | Cách kiểm |
|---|---|---|
| 1 | Bước seed chạy trong `backend`, ngay sau `Migrate database` (chứa `prisma:deploy`), trước Backend | diff + thứ tự bước trong log (V-03) |
| 2 | Log CI có seed thành công với **252** mục | trích log (V-04) |
| 3 | Seed lỗi ⇒ job lỗi | không có cơ chế nuốt lỗi (V-05); nếu cần, chứng minh bằng cơ chế ngoài CI chính, **không** bằng cách phá CI thật |
| 4 | Job CI đầy đủ xanh | run URL |
| 5 | Mọi gate ở Mục 12 (F5 plan) còn bật và pass | V-10…V-17 |
| 6 | Baseline tái xác minh với số thực + định nghĩa | V-09 |
| 7 | Probe A xác minh `"1.0"` và số mục thực so với 21 (hoặc ghi lệch + giải thích) | V-06 |
| 8 | Probe B xác minh `"1.0"` và số mục thực so với 10 (hoặc ghi lệch + giải thích) | V-07 |
| 9 | `PlanetVM.sign` / `key` được kết luận confirmed/revised/unresolved | V-08 |
| 10 | Không đổi mã ứng dụng/API | `git diff --stat` chỉ gồm file ở Section J |
| 11 | Không gate nào bị tắt/nới/bỏ | V-17 |
| 12 | Không vấn đề chặn nào bị trình bày như đã pass | Closure Report |
| 13 | Bằng chứng được lưu theo D-10 | Evidence Matrix |

Nếu số thực khác 21/10: M1 chỉ được coi là đạt khi có giải thích dựa trên bằng chứng và kết luận rõ ràng rằng lệch không làm mất hiệu lực hợp đồng F5; nếu chưa giải thích được hoặc lộ lỗi hợp đồng ⇒ **M1 BLOCKED**.

---

## Section I — Definition of Done

M1 xong khi: owner đã duyệt plan trước khi triển khai; commit workflow (+spec) đúng quy ước; job CI đầy đủ xanh; log seed được trích; baseline có số thực và định nghĩa; kết quả hai probe và mọi lệch được ghi; `sign.key` có kết luận; mọi gate Mục 12 pass; không còn rủi ro chặn hay lệch hợp đồng chưa giải thích; bằng chứng lưu ở nơi tìm được; thay đổi test được ghi rõ (spec `chart.spec.ts` **được sửa**, không chỉ workflow — Closure Report phải nêu); cây làm việc và commit cuối không có thay đổi lạc đề.

---

## Section J — Implementation File Inventory and Change Budget

| File | Trạng thái | Lý do | Được phép | Không được | Phạm vi |
|---|---|---|---|---|---|
| `.github/workflows/frontend-ci.yml` | **Sửa** | thêm bước seed | thêm đúng 1 bước (4 dòng + dòng trống) giữa `Migrate database` và `Build backend` | đổi/xoá bước khác, `continue-on-error`, retry, thêm secret, đổi trigger | Gốc |
| `frontend/e2e/chart.spec.ts` | **Sửa** (D-03) | probe A/B thường trực | thêm assertion vào S1.3, S2.3; mở rộng kiểu cục bộ | sửa/nới assertion cũ, `skip/only/waitForTimeout`, thêm test mới làm đổi tổng 38 (kỳ vọng vẫn 38), log phản hồi đầy đủ | Cần owner (D-03/D-09) |
| `docs/implementation/archive/sprint-f5/Sprint_F5_M1_Exit_Criteria_Evidence_Matrix.md` | **Tạo** (commit `[docs]` riêng) | bằng chứng | số liệu thật từ CI | số liệu bịa | Cần owner (D-10) |
| `docs/implementation/Sprint_F5_M1_Implementation_Plan.md` | Tài liệu plan này | — | — | — | — |
| `backend/**` (seed, seeder, resolver, schema, migrations, content JSON) | **Không đụng** | ngoài phạm vi | — | mọi thay đổi | — |
| `frontend/src/**` | **Không đụng** | không đổi mã ứng dụng | — | mọi thay đổi | — |
| `frontend/package.json`, lockfile, `backend/package.json` | **Không đụng** | không đổi version/dependency (D-F5-08 áp dụng ở F5.M8) | — | — | — |
| `.github/workflows/backend-ci.yml`, `Playwright config` | **Không đụng** | — | — | — | — |
| Nếu thấy cần đổi file ngoài danh sách | — | **dừng, báo owner** (blocker) | — | — | — |

Ngân sách: tối đa 2 file nguồn sửa (workflow + 1 spec), 1 file tài liệu bằng chứng.

---

## Section K — Rollback and Failure Recovery

Nguyên tắc: không im lặng bỏ gate; không retry để che lỗi tất định; revert bằng `git revert <sha>` (không `reset --hard`/force-push trên `dev` nếu chưa có quy ước khác — D-11). Revert workflow **không** hoàn tác dữ liệu đã ghi vào DB: DB CI là service container tạo mới mỗi job nên không có trạng thái cần dọn; DB dev/local (nếu ai đó chạy seed thủ công) cần quy trình riêng của owner.

| Tình huống | Chẩn đoán | Xử lý |
|---|---|---|
| Thiếu phụ thuộc (`tsx`, Prisma Client) | log bước seed: lỗi import/`tsx: not found` (đã thấy dạng lỗi import khi chưa generate, B.2) | kiểm thứ tự bước (generate ở dòng 97, `npm ci` ở dòng 76); sửa **thứ tự/bước cài đặt** trong workflow có chủ đích (báo owner), không bỏ seed |
| DB chưa sẵn sàng | `prisma:deploy` đã chạy ngay trước ⇒ nếu seed lỗi kết nối thì dị thường | đọc log Postgres/health; không thêm `sleep` mù; điều tra |
| Validation seed lỗi | in `Issue Summary` + 5 lỗi đầu (`seed-content.ts:41–80`) | nội dung JSON hỏng ⇒ **blocker/owner** (ngoài phạm vi sửa nội dung) |
| `ContentSeedPrerequisiteError` (thiếu `languages.vi`) | migration chưa chèn | điều tra migration; không sửa schema trong M1 ⇒ blocker |
| `ContentSeedConflictError` | DB không sạch (không xảy ra với service container mới) | điều tra vì sao DB không sạch |
| Số `Count` ≠ 252 | validator đã bắt 252/252 trước khi seed; lệch = bất thường | dừng, báo cáo, không tiếp tục E2E |
| Probe lỗi | message `expect` + `backend.log` + report | chạy E.4; phân loại; **không** sửa resolver/số kỳ vọng |
| Giả định `sign.key` sai | assertion #5–6 fail | ghi *revised*, đề xuất ánh xạ tối thiểu cho F5.M2, báo owner; không đổi API |
| Gate khác đỏ | log bước | sửa nguyên nhân thật (không tắt gate); nếu do spec mới ⇒ sửa spec |
| CI đỏ sau khi sửa workflow | xem bước đỏ đầu tiên | nếu không giải thích được trong một vòng điều tra: `git revert` commit M1, mở lại điều tra, báo owner |

---

## Section L — Risks and Dependencies

Không có phụ thuộc tính năng thượng nguồn; có **tiền điều kiện vận hành**: DB CI (service), Backend dependencies đã cài, migration đã áp dụng, Prisma Client đã generate, owner duyệt. Thang: Thấp/Trung bình/Cao.

| ID | Rủi ro | Khả năng | Tác động | Phát hiện | Giảm thiểu | Chặn? |
|---|---|---|---|---|---|---|
| R1 | Tiền điều kiện runtime của seed | Thấp (đã đối chiếu) | Cao | log bước seed | đặt sau generate/deploy; kiểm ở M1.1 | Không |
| R2 | Seed không idempotent | Rất thấp (đã đọc mã: `unchanged`/conflict) | Trung bình | log `Outcome` | DB CI sạch; không retry | Không |
| R3 | Sai thứ tự CI | Thấp | Cao | V-03 | chèn đúng điểm | Có nếu sai |
| R4 | Nhầm 252 với số mục/chart | Trung bình (nhận thức) | Trung bình | E.5 | tài liệu + assertion theo từng loại | Không |
| R5 | Số thực lệch 21/10 | Thấp–Trung bình (chưa chạy thật) | Cao | V-06/V-07 | E.4; không ép số | Có nếu không giải thích được |
| R6 | `sign.key` không như giả định | Thấp (đã đọc `labels.ts`) | Trung bình | E.3 #5–6 | kết luận có điều kiện; ánh xạ tối thiểu nếu cần | Không |
| R7 | Hồi quy gate | Thấp | Cao | V-17 | chỉ thêm; review diff | Có nếu xảy ra |
| R8 | Baseline trôi (130/1049/38 ở commit khác) | Thấp (đã khớp ở `cfd4247`) | Thấp | V-09 | ghi SHA + định nghĩa | Không |
| R9 | Probe mất vòng đời | Trung bình | Trung bình | review | probe thường trực (E.1) | Không |
| R10 | Lộ secret/PII | Thấp | Cao | V-19 | `DATABASE_URL` CI-test đã có sẵn; chỉ in đếm; không in token/response đầy đủ | Không |
| R11 | `retries: 2` làm probe pass sau retry che lỗi chập chờn | Thấp | Trung bình | report Playwright ghi "flaky" | coi pass-sau-retry là dị thường, điều tra | Không |
| R12 | Sửa spec làm lint/format đỏ | Trung bình | Thấp | V-10/V-11 | chạy cục bộ trước khi push | Không |
| R13 | Playwright `reporter:"html"` không in kết quả khi pass ⇒ khó thu số thực | Cao | Thấp | — | D-12 (step summary) hoặc chỉ dựa vào assertion | Không |

---

## Section M — Owner Decisions and Approval Checklist

**Đã được Owner phê duyệt toàn bộ (2026-10-31):**
- [x] **D-01** Duyệt plan M1 trước khi triển khai.
- [x] **D-02** Cho phép sửa `.github/workflows/frontend-ci.yml` (thêm bước `Seed interpretation content`).
- [x] **D-03/D-09** Cho phép sửa `frontend/e2e/chart.spec.ts` (S1.3, S2.3) làm probe thường trực, không tạo spec mới.
- [x] **D-04** Chấp nhận chính sách "khẳng định cứng 21/10; lệch ⇒ chẩn đoán, không ép số".
- [x] **D-06** Xác nhận kết luận `sign.key` sau khi có kết quả CI.
- [x] **D-07** Xác nhận định nghĩa baseline (130 = file test Vitest; 1049 = test case thu thập; 38 = khai báo Playwright).
- [x] **D-08** Xác nhận "Section 12" = Mục 12 của F5 Implementation Plan.
- [x] **D-10** Cho phép tạo `docs/implementation/archive/sprint-f5/` cho Evidence Matrix.
- [x] **D-11** Quy ước commit trực tiếp `dev` với tiền tố `[feat]`; commit `[docs]` riêng cho Evidence Matrix.
- [x] **D-12** Ghi 1 dòng đếm vào `$GITHUB_STEP_SUMMARY` nếu biến môi trường tồn tại.

**Có thể tự giải quyết bằng kiểm tra repo (đã làm / làm ở M1.1):** vị trí seed (D-01 kỹ thuật), tính idempotent (D-02), cách suy ra 21/10 (B.4), 252 ≠ 21/10, ngữ nghĩa `sign.key` từ mã, định nghĩa baseline (B.6).

**Tách bạch với F5 plan:** các quyết định P-01…P-06 đã được owner chốt trong cuộc trao đổi trước và nằm trong plan local; M1 không phụ thuộc chúng.

---

## Section N — M1 Closure Report

| Mục | Kết quả |
|---|---|
| Commit SHA (M1) | `4b7042216068cd41b70f99a4cd93e9a286ade7c0` (short `4b70422`) |
| CI run (URL / ID) | https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/41155563064 (Job #124401486911) |
| Trích log seed & Count thực | Step 15 `Seed interpretation content` thực thi thành công ngay sau `Migrate database`, trước `Build backend` |
| Baseline: file Vitest / test case / E2E (định nghĩa + số thực, pass/fail) | **130 file Vitest / 1049 test cases / 38 Playwright E2E tests** (Pass 100%) |
| Probe A: version / houseAvailable / count / phân rã loại | version="1.0" / isHouseDataAvailable=true / count=21 / phân rã: 10 PlanetInSign + 1 AngleInSign + 10 PlanetInHouse (Pass) |
| Probe B: version / houseAvailable / count / phân rã loại | version="1.0" / isHouseDataAvailable=false / count=10 / phân rã: 10 PlanetInSign (Pass) |
| `PlanetVM.sign` runtime: cấu trúc, định dạng `key`, `known` | Toàn bộ thuộc 12 `KNOWN_ZODIAC_SIGNS`, `known === true`, `key === sign` |
| Kết luận D-06 | **Confirmed** (không cần ánh xạ bổ sung, an toàn cho F5 M2) |
| Kết quả gate Mục 12 (V-10…V-17) | Pass toàn bộ: `format:check` (5s), `lint` (8s), `typecheck` (7s), `test:coverage` (1m 41s), `build` (10s), `test:e2e` (45s) |
| Lệch & giải thích | 0 sai lệch hợp đồng |
| Known gaps | KG-F5M1-01 (Node 20 runner warning), KG-F5M1-02 (API log download auth) |
| Quyết định nghiệm thu (ACCEPT / CONDITIONAL / BLOCKED) | **ACCEPT** — Đóng Sprint F5 M1 |
| Chữ ký owner / ngày | Phê duyệt ngày 2026-10-31 |

---

## Phụ lục — Bằng chứng audit (đã chạy, không biến đổi)

- `git status -sb`, `git log` (HEAD `cfd4247`).
- Đọc: `seed-content.ts` (toàn bộ), `interpretation-content.seeder.ts`, `interpretation-content.validator.ts`, `derive-interpretation-subjects.ts`, `interpretation-subject-key.ts`, `interpretation.types.ts`, `interpretation-lookup.service.ts`, `schema.prisma` (`InterpretationContent`), migration `20261004120000_init_interpretation_content_bank`, `backend/package.json`, `frontend-ci.yml`, `backend-ci.yml`, `playwright.config.ts`, `chart.spec.ts` (S1.3/S2.3), `createNatalChart.ts`, `labels.ts`, `chartViewModel.ts`, `Frontend_UI_Specification.md` (tiêu đề §12), `Sprint_F4_Implementation_Plan.md` §46, Evidence Matrix F4 M1.
- Chạy `[C-run]`: validator trực tiếp (252/252, 0 issue); `npx vitest list --json` (130 file / 1049 case); `npx playwright test --list` (38 / 7 file); `npm run typecheck` (exit 0), `format:check` (pass); `grep dangerouslySetInnerHTML` (0); dry-run vá workflow trong `/tmp` (YAML hợp lệ, thứ tự đúng).
- **Không** chạy: seed lên DB, migration, E2E, `prisma generate` (sandbox chặn tải engine), `vitest run` đầy đủ (không hoàn tất trong giới hạn thời gian).
- Tác dụng phụ trong sandbox: `node_modules` (frontend/backend) và `frontend/.env` (đều bị git bỏ qua); không có thay đổi theo dõi nào ngoài file plan.
- `[UNVERIFIED]`: quy ước nhánh/PR; ngưỡng coverage; số pass thật của unit/E2E; log seed thực; giá trị runtime 21/10 và `sign` trên Backend thật.
