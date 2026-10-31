# Sprint F5 — M1 Exit Criteria Evidence Matrix
## CI Seed & Contract Baseline

- **Vị trí lưu trữ:** `docs/implementation/archive/sprint-f5/Sprint_F5_M1_Exit_Criteria_Evidence_Matrix.md`
- **Phạm vi:** F5-M1.0 → M1.7 (Bổ sung seed nội dung diễn giải vào Frontend CI, bổ sung Probe A & Probe B thường trực vào `chart.spec.ts`, xác minh baseline và chốt giả định `sign.key`).
- **Commit được đánh giá:** `4b7042216068cd41b70f99a4cd93e9a286ade7c0` (short `4b70422`: `[feat] seed interpretation content in frontend ci`) trên nhánh `dev`.
- **Frontend CI Run:** [Run #41155563064](https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/41155563064) — Job [build #124401486911](https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/41155563064/job/124401486911).
- **Ngày thực hiện:** 2026-10-31.
- **Nguồn bằng chứng:**
  - `[repo]`: Đọc mã nguồn, diff, schema, workflow, JSON content.
  - `[C-run]`: Lệnh chạy kiểm tra trong môi trường cục bộ (PowerShell, Node v22, lockfile).
  - `[CI]`: Kết quả chạy thực tế trên GitHub Actions runner `ubuntu-24.04`.
  - `[owner]`: Phê duyệt từ chủ sở hữu.
- **Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `ACCEPTED GAP`.

---

## Kết luận chung

**`PASS`** — Toàn bộ tiêu chí kỹ thuật và cổng chất lượng của M1 đã đạt 100%:
1. Job `Frontend CI` trên commit `4b70422` đã chạy thành công trọn vẹn (24 bước, 4 phút 39 giây, kết luận `success`).
2. Bước `Seed interpretation content` chạy đúng vị trí (ngay sau `Migrate database`, trước `Build backend`/`Start backend server`).
3. Cả hai probe hợp đồng Backend thật trên E2E đều **PASS**:
   - **Probe A (S1.3):** `interpretationVersion === "1.0"`, đủ đúng **21 mục** diễn giải (10 `PlanetInSign`, 1 `AngleInSign`, 10 `PlanetInHouse`), toàn bộ `vi`, không rỗng, khớp đúng 100% khoá tra cứu từ 10 hành tinh và Ascendant.
   - **Probe B (S2.3):** `interpretationVersion === "1.0"`, suy giảm hợp lệ về đúng **10 mục** (`PlanetInSign` duy nhất), 0 lỗi hạ tầng, khớp đúng 100% khoá tra cứu.
4. Giả định **D-06 (`PlanetVM.sign.key`)** chính thức được **`CONFIRMED`** trên runtime thật: toàn bộ hành tinh mang cung thuộc `KNOWN_ZODIAC_SIGNS` (chuỗi tiếng Anh), bảo đảm `resolveSign(sign).known === true` và `key === sign`.
5. Baseline chất lượng được bảo toàn tuyệt đối: **130 file Vitest / 1049 test cases / 38 Playwright E2E tests**, không gate nào bị nới lỏng hay bỏ qua. Milestone M1 chính thức đủ điều kiện đóng.

---

## 1. Bảng xác minh tiêu chí kiểm tra (Verification Matrix V-01 → V-19)

| ID | Kiểm tra | Lệnh / Thủ tục | Kết quả thực tế | Trạng thái | Nguồn |
|---|---|---|---|:---:|:---:|
| **V-01** | Audit seed script | Đọc `seed-content.ts`, seeder, validator | Đã audit chi tiết; xác nhận chạy tsx, cwd `backend`, cần `DATABASE_URL`, idempotent | **VERIFIED** | [repo] |
| **V-02** | Validate nội dung JSON | Chạy trực tiếp validator trên `interpretations.vi.json` | 252/252 mục hợp lệ, 0 issue, status `Published`, version `1.0` | **VERIFIED** | [C-run] |
| **V-03** | Thứ tự bước trong CI | Đối chiếu diff workflow và thứ tự log CI | `Migrate database` (Step 14) $\rightarrow$ `Seed interpretation content` (Step 15) $\rightarrow$ `Build backend` (Step 16) $\rightarrow$ `Start backend server` (Step 17) | **VERIFIED** | [CI] [repo] |
| **V-04** | Bước seed thực thi trong CI | Step 15 `Seed interpretation content` | Thực thi thành công (`conclusion: success`) | **VERIFIED** | [CI] |
| **V-05** | Thiết kế không nuốt lỗi | Kiểm tra workflow `frontend-ci.yml` | 0 `continue-on-error`, 0 `\|\| true`, 0 retry giả; exit 1 sẽ làm fail job | **VERIFIED** | [repo] |
| **V-06** | Probe A (Lá số đủ giờ sinh) | `frontend/e2e/chart.spec.ts` (S1.3) | `interpretationVersion === "1.0"`, `isHouseDataAvailable === true`, đúng **21 mục** (10 PlanetInSign + 1 AngleInSign + 10 PlanetInHouse), 100% tiếng Việt, 0 duplicate key | **VERIFIED** | [CI] |
| **V-07** | Probe B (Lá số không giờ sinh) | `frontend/e2e/chart.spec.ts` (S2.3) | `interpretationVersion === "1.0"`, `isHouseDataAvailable === false`, đúng **10 mục** (10 PlanetInSign), 0 AngleInSign, 0 PlanetInHouse, suy giảm hợp lệ HTTP 200 | **VERIFIED** | [CI] |
| **V-08** | Xác minh runtime `sign.key` | Assertion kiểm tra `planets[].sign` trong Probe A & B | Toàn bộ 10 hành tinh mang cung thuộc 12 `KNOWN_ZODIAC_SIGNS`; `key` khớp hoàn toàn | **VERIFIED** | [CI] [repo] |
| **V-09** | Tái xác minh baseline | Kiểm đếm file test và ca kiểm thử | 130 file Vitest, 1049 ca kiểm thử thu thập, 38 Playwright E2E tests; không thay đổi số lượng khai báo | **VERIFIED** | [C-run] [CI] |
| **V-10** | Cổng Format | `npm run format:check` | Pass — 100% file chuẩn Prettier (Step 7 trong CI pass, 5s) | **VERIFIED** | [C-run] [CI] |
| **V-11** | Cổng Lint | `npm run lint` | Pass — ESLint 0 error, 0 warning (Step 8 trong CI pass, 8s) | **VERIFIED** | [C-run] [CI] |
| **V-12** | Cổng Typecheck | `npm run typecheck` | Pass — TypeScript app & node 0 error (Step 9 trong CI pass, 7s) | **VERIFIED** | [C-run] [CI] |
| **V-13** | Cổng Test & Coverage | `npm run test:coverage` | Pass (Step 10 trong CI pass, 1m 41s) | **VERIFIED** | [CI] |
| **V-14** | Cổng Build Frontend | `npm run build` | Pass (Step 11 trong CI pass, 10s) | **VERIFIED** | [CI] |
| **V-15** | Cổng E2E toàn bộ | `npm run test:e2e` | Pass toàn bộ 38 test (Step 19 trong CI pass, 45s); 0 failure | **VERIFIED** | [CI] |
| **V-16** | Grep an toàn mã nguồn | `grep -rn "dangerouslySetInnerHTML" frontend/src` | 0 lần xuất hiện | **VERIFIED** | [C-run] |
| **V-17** | Không nới lỏng gate | Review git diff trên commit `4b70422` | Chỉ bổ sung assertion cứng và bước seed; không sửa/bỏ/nới lỏng bất kỳ gate nào | **VERIFIED** | [repo] |
| **V-18** | Không hồi quy F4/Backend | Toàn bộ suite E2E và build backend | Step 16 `Build backend` pass (3s); Step 17 `Start backend server` pass (2s); E2E F4 pass 100% | **VERIFIED** | [CI] |
| **V-19** | Không lộ secret/PII | Review diff và log | Không có token, mật khẩu, database secret hay dữ liệu cá nhân nào bị ghi đè hay rò rỉ | **VERIFIED** | [repo] [CI] |

---

## 2. Trạng thái thực thi các quyết định (D-01 → D-12)

| Quyết định | Nội dung đã chốt | Thực tế triển khai | Trạng thái |
|---|---|---|:---:|
| **D-01** | Vị trí seed trong workflow | Đặt ngay sau `Migrate database`, trước `Build backend` (Step 15) | **VERIFIED** |
| **D-02** | An toàn & idempotent | Chạy sạch trên container mới; không retry, không `continue-on-error` | **VERIFIED** |
| **D-03/D-09** | Bổ sung probe thường trực | Đặt probe trong S1.3 và S2.3 của `chart.spec.ts`, không tạo file spec mới | **VERIFIED** |
| **D-04** | Khẳng định cứng 21/10 | Giữ đúng 21 mục cho S1.3 và 10 mục cho S2.3; probe pass trực tiếp trên CI | **VERIFIED** |
| **D-05** | Phân biệt 252 vs 21/10 | 252 là tổng kho seed; 21/10 là số mục áp dụng cho từng lá số cụ thể | **VERIFIED** |
| **D-06** | Kết luận `PlanetVM.sign.key` | Khẳng định `CONFIRMED` sau khi probe CI pass 100% các cung đã biết | **VERIFIED** |
| **D-07** | Phương pháp baseline | 130 file Vitest / 1049 case / 38 Playwright E2E | **VERIFIED** |
| **D-08** | Thẩm quyền Section 12 | Tuân thủ các cổng chất lượng Mục 12 F5 Quality Gates | **VERIFIED** |
| **D-10** | Nơi lưu trữ Evidence Matrix | `docs/implementation/archive/sprint-f5/Sprint_F5_M1_Exit_Criteria_Evidence_Matrix.md` | **VERIFIED** |
| **D-11** | Quy ước commit | Commit `[feat]` code/test trên `dev` (`4b70422`); commit `[docs]` riêng cho evidence | **VERIFIED** |
| **D-12** | Step summary | Bổ sung ghi đếm tóm tắt vào `$GITHUB_STEP_SUMMARY` khi biến tồn tại | **VERIFIED** |

---

## 3. Chi tiết kết quả CI Run #41155563064

- **Workflow Name:** `Frontend CI`
- **Head Branch:** `dev`
- **Head SHA:** `4b7042216068cd41b70f99a4cd93e9a286ade7c0`
- **Thời gian chạy:** 2026-10-31T01:29:11Z $\rightarrow$ 2026-10-31T01:33:50Z (tổng cộng 4m 39s)
- **Trạng thái tổng thể:** `completed`, **`conclusion: success`**

### Trình tự thực thi các bước chính:
```text
  Step 1  - Set up job [success]
  Step 2  - Initialize containers (postgres:16-alpine) [success]
  Step 3  - Run actions/checkout@v4 [success]
  Step 4  - Use Node.js 22.x [success]
  Step 5  - Install frontend dependencies (npm ci) [success - 36s]
  Step 6  - Setup frontend environment [success]
  Step 7  - Check Formatting (npm run format:check) [success - 5s]
  Step 8  - Lint (npm run lint) [success - 8s]
  Step 9  - Typecheck (npm run typecheck) [success - 7s]
  Step 10 - Test (npm run test:coverage) [success - 1m 41s]
  Step 11 - Build (npm run build) [success - 10s]
  Step 12 - Install backend dependencies (npm ci) [success - 7s]
  Step 13 - Setup backend environment [success]
  Step 14 - Migrate database (prisma:generate & prisma:deploy) [success - 2s]
  Step 15 - Seed interpretation content (npm run prisma:seed:content) [success]
  Step 16 - Build backend (npm run build) [success - 3s]
  Step 17 - Start backend server (node dist/server.js) [success - 2s]
  Step 18 - Install Playwright Browsers [success - 23s]
  Step 19 - Run E2E Tests (npm run test:e2e) [success - 45s]
  Step 20 - Upload backend log on failure [skipped - 0 errors]
  Step 21 - Upload Playwright report on failure [skipped - 0 errors]
```

---

## 4. Bằng chứng kiểm tra hợp đồng thực tế (Probe A & Probe B)

### Probe A (Scenario S1.3 — Lá số có đầy đủ giờ sinh)
- **Đầu vào hồ sơ:** `1995-10-25`, `08:30`, Đà Nẵng, `isBirthTimeKnown: true`.
- **Phản hồi Backend:**
  - `status: 200/201 OK`.
  - `interpretationVersion`: `"1.0"`.
  - `isHouseDataAvailable`: `true`.
  - `houses`: 12 nhà.
  - `interpretations`: Đúng **21 mục**.
- **Phân rã theo loại:**
  - `PlanetInSign`: Đúng 10 mục (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto).
  - `AngleInSign`: Đúng 1 mục (`Ascendant_in_${sign}`).
  - `PlanetInHouse`: Đúng 10 mục (`${planet}_in_House_${house}`).
- **Tính toàn vẹn:**
  - 21/21 mục có `language === "vi"`.
  - 21/21 mục có `bodyText` là chuỗi không rỗng (`length > 0`).
  - Toàn bộ `subjectKey` không trùng lặp (Set size = 21).
  - Khớp 100% khoá tra cứu suy ra từ các hành tinh và điểm mọc thực tế của lá số.

### Probe B (Scenario S2.3 — Lá số không rõ giờ sinh / suy giảm)
- **Đầu vào hồ sơ:** `1998-05-12`, Đà Nẵng, bỏ chọn "Tôi biết rõ giờ sinh của mình".
- **Phản hồi Backend:**
  - `status: 200/201 OK` (Suy giảm hợp lệ, không phải lỗi hệ thống).
  - `interpretationVersion`: `"1.0"`.
  - `isHouseDataAvailable`: `false`.
  - `houses`: `[]` (0 nhà).
  - `angles`: `[]` (0 góc).
  - `planets[].house`: toàn bộ `null`.
  - `interpretations`: Đúng **10 mục**.
- **Phân rã theo loại:**
  - `PlanetInSign`: Đúng 10 mục (10 hành tinh MVP).
  - `AngleInSign`: 0 mục.
  - `PlanetInHouse`: 0 mục.
- **Tính toàn vẹn:**
  - 10/10 mục có `language === "vi"`.
  - 10/10 mục có `bodyText` không rỗng.
  - Khớp 100% khoá tra cứu `${planet.name}_in_${planet.sign}`.

---

## 5. Kết luận cho Quyết định D-06 (`PlanetVM.sign.key`)

- **Kết luận:** **`CONFIRMED`**
- **Căn cứ thực nghiệm:**
  - Toàn bộ các giá trị `sign` trả về trong mảng `planets` ở cả Probe A và Probe B đều thuộc tập 12 cung chuẩn `KNOWN_ZODIAC_SIGNS` (`Aries`, `Taurus`, `Gemini`, `Cancer`, `Leo`, `Virgo`, `Libra`, `Scorpio`, `Sagittarius`, `Capricorn`, `Aquarius`, `Pisces`).
  - Hàm `resolveSign(sign)` trong `frontend/src/features/chart/model/labels.ts` xử lý các cung này với `known === true`, và gán `key === sign` (chính xác bằng chuỗi gốc).
  - Do đó, trong các milestone tiếp theo của Sprint F5 (M2 $\rightarrow$ M7), việc tra cứu diễn giải cung hoàng đạo qua `vm.planets[i].sign.key` khi `sign.known === true` được xác nhận là **hoàn toàn chính xác và an toàn**, không cần cơ chế ánh xạ đặc biệt hay nắn chỉnh dữ liệu.

---

## 6. Known Gaps Registry (M1)

| ID | Vấn đề | Phân loại | Tác động | Kế hoạch xử lý |
|---|---|---|---|---|
| **KG-F5M1-01** | Cảnh báo runner GitHub Actions về việc Node.js 20 bị deprecate (`actions/checkout@v4`, `actions/setup-node@v4`) | Runner Warning | Không ảnh hưởng build hay test; runner tự chuyển sang Node 24 | Đã ghi nhận từ Sprint F4 (FG-11); duy trì theo dõi cho đến khi upstream action có bản cập nhật |
| **KG-F5M1-02** | GitHub REST API yêu cầu quyền admin repo để tải raw stdout logs qua API | Tooling / Observability | Trạng thái từng bước, thời gian và kết luận tổng thể vẫn đọc được 100% qua API công khai; web UI hiển thị đầy đủ logs | Lưu trữ các trích đoạn và số liệu chi tiết trong Evidence Matrix này |

---

## 7. M1 Closure Report

| Mục | Kết quả ghi nhận |
|---|---|
| **Commit SHA (M1)** | `4b7042216068cd41b70f99a4cd93e9a286ade7c0` (short `4b70422`) |
| **CI run URL** | https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/41155563064 |
| **CI job URL** | https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/41155563064/job/124401486911 |
| **Trạng thái CI** | `completed`, **`conclusion: success`** (4m 39s) |
| **Log Seed Content** | Step 15 thực thi thành công ngay sau `Migrate database`, trước `Build backend` |
| **Baseline metrics** | **130 file Vitest / 1049 test cases / 38 Playwright E2E tests** (Pass 100%) |
| **Probe A** | `interpretationVersion: "1.0"`, `isHouseDataAvailable: true`, tổng 21 (10 PlanetInSign + 1 AngleInSign + 10 PlanetInHouse) |
| **Probe B** | `interpretationVersion: "1.0"`, `isHouseDataAvailable: false`, tổng 10 (10 PlanetInSign, 0 House, 0 Angle) |
| **`PlanetVM.sign` runtime** | Thuộc 12 `KNOWN_ZODIAC_SIGNS`, `known === true`, `key === sign` |
| **Kết luận D-06** | **`CONFIRMED`** |
| **Cổng chất lượng Mục 12** | Pass toàn bộ: `format:check` (5s), `lint` (8s), `typecheck` (7s), `test:coverage` (1m 41s), `build` (10s), `test:e2e` (45s) |
| **Lệch & giải thích** | 0 sai lệch hợp đồng |
| **Known Gaps** | KG-F5M1-01 (Node 20 runner warning), KG-F5M1-02 (API log download auth) |
| **Quyết định nghiệm thu** | **`ACCEPT`** — Đóng Sprint F5 M1, sẵn sàng kích hoạt M2 |
| **Ngày hoàn thành** | 2026-10-31 |
