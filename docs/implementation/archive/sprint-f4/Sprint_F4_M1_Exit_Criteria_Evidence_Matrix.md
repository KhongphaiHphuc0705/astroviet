# Sprint F4 — M1 Exit Criteria Evidence Matrix
## Chart API / DTO / Data Hooks

**Vị trí lưu đề xuất:** `docs/implementation/archive/sprint-f4/Sprint_F4_M1_Exit_Criteria_Evidence_Matrix.md`
**Phạm vi:** F4-M1.1 → M1.7 + commit sửa Category A (`4a1bd10`) + chore bật typecheck và ghim runner (`7ff48cf`).
**Commit được đánh giá:** HEAD `dev` = `7ff48cf` (chuỗi: `f3bdb61` → `4a1bd10` → `7ff48cf`). Ngày review: 2026-10-11.
**Nguồn bằng chứng:** `[repo]` đọc mã/diff; `[C-run]` Claude chạy lệnh trong sandbox (`npm ci` theo lockfile, Node v22.22.2) tại `7ff48cf`; `[CI]` trang GitHub Actions công khai (log từng bước cần đăng nhập nên chỉ thấy kết quả cấp job); `[owner]` owner cung cấp.
**Trạng thái:** `VERIFIED` · `PARTIALLY VERIFIED` · `UNVERIFIED` · `ACCEPTED GAP` · `NOT APPLICABLE`.

## Kết luận

**`PASS`** — toàn bộ tiêu chí kỹ thuật và cổng chất lượng của M1 đã đạt, liên kết Frontend CI trên commit `7ff48cf` đã được xác nhận (xem EV-M1-31). Các tồn đọng kiến trúc/nợ kỹ thuật không chặn đã được ghi nhận đầy đủ tại Mục 3 (Known Gaps Registry). Hồ sơ M1 chính thức được đóng.

---

## 1. Bằng chứng kỹ thuật theo tiêu chí

### 1.1 API & DTO (F4-M1.1, M1.2)

| ID | Tiêu chí | Bằng chứng | Nguồn | Trạng thái |
|---|---|---|---|---|
| EV-M1-01 | DTO khớp `chart-response.mapper.ts`; nullable/optional đúng (`house`, `interpretationVersion`, `tone`, `birthProfileId`, `birthProfileLabel`) | `features/chart/api/types.ts`; `fixtures.contract.test.ts` kiểm key-set chính xác cho top-level, planets, houses, angles, aspects, interpretations | [repo] [C-run] | VERIFIED |
| EV-M1-02 | Không lộ trường chỉ-persistence (`snapshotInterpretationVersion`, `birthProfileId` ở `ChartResponse`) | Test "does not contain birthProfileId or snapshotInterpretationVersion at the root" (`@ts-expect-error` + runtime) | [C-run] | VERIFIED |
| EV-M1-03 | `getChart`: đúng URL, có `encodeURIComponent`, lỗi giữ `errorCode` | `getChart.test.ts` (5 test, gồm path `a%20b%2Fc`, 403/404/400/422) | [C-run] | VERIFIED |
| EV-M1-04 | `createNatalChart`: `save=true` là query **duy nhất**, body `toStrictEqual({birthProfileId, houseSystem, includeOptionalPoints: []})`, WholeSign, lỗi 401/404/422 | `createNatalChart.test.ts` (5 test) | [C-run] | VERIFIED |
| EV-M1-05 | `listCharts`: serialize `page/pageSize/sortBy/order/birthProfileId`, không tham số, 400/401 | `listCharts.test.ts` (4 test) | [C-run] | VERIFIED |
| EV-M1-06 | `isValidChartId` (UUID 8-4-4-4-12) | `isValidChartId.test.ts` (6 test) | [C-run] | VERIFIED |
| EV-M1-07 | Chỉ dùng `apiClient`; không `fetch`/`axios.create`/`XMLHttpRequest`, không Zod, không import chéo feature, không key literal `["charts"` ngoài `query-keys.ts` | grep trên `features/chart` = 0 kết quả | [C-run] | VERIFIED |

### 1.2 Hooks & cache (F4-M1.3, M1.4)

| ID | Tiêu chí | Bằng chứng | Nguồn | Trạng thái |
|---|---|---|---|---|
| EV-M1-08 | `chartKeys` phân cấp; `lists()` là tiền tố `list(p)` nhưng **không** là tiền tố `detail(id)`; `invalidateQueries(lists())` không làm stale detail | `query-keys.test.ts` (9 test) | [C-run] | VERIFIED |
| EV-M1-09 | `useChartQuery`: 0 request khi `undefined`/không phải UUID; `staleTime: Infinity`; focus/reconnect không refetch; hook thứ hai cùng id không fetch; cache seed không fetch; `ApiError` 404/403 | `useChartQuery.test.tsx` (7 test) | [C-run] | VERIFIED |
| EV-M1-10 | `useChartsQuery` dùng `placeholderData: keepPreviousData` (v5): giữ trang trước, `isPlaceholderData` đúng; lỗi → `ApiError` | `useChartsQuery.test.tsx` (2 test) | [C-run] | PARTIALLY VERIFIED — chưa có ca danh sách rỗng (KG-F4M1-10) |
| EV-M1-11 | Mutation: seed `detail`, invalidate **chỉ** `lists()`, refetch list đang mount, lỗi ⇒ cache không đổi và list không invalidate, `reportError` chỉ cho mã chưa ánh xạ, hai lần gọi ⇒ hai snapshot | `useCreateNatalChartMutation.test.tsx` (5 test) | [C-run] | VERIFIED |

### 1.3 Lỗi (F4-M1.5)

| ID | Tiêu chí | Bằng chứng | Nguồn | Trạng thái |
|---|---|---|---|---|
| EV-M1-12 | Thêm đúng 3 mã (`INVALID_DATETIME`, `UNRESOLVABLE_TIMEZONE`, `INVALID_COORDINATES`), câu chữ có hướng dẫn hành động đúng bản Mục 16 của plan | diff `error-messages.ts` tại `4a1bd10`; 3 test "không reportError" | [repo] [C-run] | VERIFIED |
| EV-M1-13 | Mã nội bộ **không** ánh xạ (D-5): `CHART_CALCULATION_FAILED`, `DATA_INTEGRITY_ERROR`, `EPHEMERIS_PROVIDER_ERROR`, `INTERNAL_SERVER_ERROR` ⇒ fallback + `reportError` | test "unmapped internal codes → fallback + reportError được gọi" | [C-run] | VERIFIED |

### 1.4 MSW & fixtures (F4-M1.6)

| ID | Tiêu chí | Bằng chứng | Nguồn | Trạng thái |
|---|---|---|---|---|
| EV-M1-14 | `chartFull`/`chartNoHouses` là response CAPTURED, không sửa tay | deep-equal với `docs/implementation/archive/sprint-f4/evidence/fixture_full.json` và `fixture_nohouse.json` = **true** cả hai (tại `7ff48cf`); header ghi ngày chụp, commit `9f0ff70`, lệnh, engine | [C-run] | VERIFIED |
| EV-M1-15 | Không còn fixture bịa (A-1) | `chartFullWithInterpretations`: 0 lần xuất hiện trong `src` | [C-run] | VERIFIED |
| EV-M1-16 | Bất biến fixture: 21 diễn giải đúng thứ tự (10 `PlanetInSign` → `Ascendant_in_Aries` → 10 `PlanetInHouse`) và `subjectKey` suy ra từ chính planets/angles; `chartNoHouses` đúng 10 `PlanetInSign`, không có `AngleInSign`/`PlanetInHouse`; `isRetrograde ⇔ speed<0`; `orb`; envelope 4 khoá | `fixtures.contract.test.ts` (**20 test**); mình cũng kiểm độc lập bằng script ở lượt review trước (0 sai lệch nhà–cusp) | [C-run] | VERIFIED |
| EV-M1-17 | `chartSummaryFixtures` dùng UUID cho `birthProfileId` (A-6), một mục `null`, label `null` | `fixtures.ts` dòng 747/754 | [repo] | VERIFIED — **DERIVED từ mã**, không phải CAPTURED |
| EV-M1-18 | Handler không dùng `as unknown as` (A-6): `ChartMockEndpoint` | diff `handlers.ts` tại `4a1bd10` | [repo] | VERIFIED |
| EV-M1-19 | Cô lập MSW không đổi (`onUnhandledRequest: "error"`) | `src/test/setup.ts`, `msw-server.ts` không nằm trong diff | [repo] | VERIFIED |

### 1.5 Cổng chất lượng [C-run] tại `7ff48cf`

| ID | Lệnh | Kết quả | Trạng thái |
|---|---|---|---|
| EV-M1-20 | `npm run format:check` | exit 0, "All matched files use Prettier code style!" | VERIFIED |
| EV-M1-21 | `npm run lint` (`eslint .`) | exit 0, không cảnh báo | VERIFIED |
| EV-M1-22 | `npm run typecheck` (**đã đổi** thành `tsc -p tsconfig.app.json --noEmit`) | **exit 0** (trước chore: 16 lỗi / 12 file trong cùng môi trường) | VERIFIED |
| EV-M1-23 | `npm run build` (`tsc -p tsconfig.app.json --noEmit && vite build`) | exit 0, "built in 8.85s" | VERIFIED |
| EV-M1-24 | `npx vitest run --coverage` | **87 file, 458 test passed**, exit 0 (baseline plan F4: 78 file ⇒ +9 file chart) | VERIFIED |
| EV-M1-25 | Coverage | All files 92.38% stmts / 84.25% branch / 94.18% funcs / 94.10% lines; `chart/api` và `chart/hooks` đều 100%; `chart/api/mocks` 77.27% (helper MSW chưa dùng hết — KG-F4M1-13) | VERIFIED |
| EV-M1-26 | Typecheck không hồi quy: 0 lỗi mới và 0 lỗi trong `features/chart` | tại `9f0ff70` và `f3bdb61` cùng 16 lỗi / 12 file (cùng tập); tại `7ff48cf` = 0 lỗi | VERIFIED |

> Lưu ý đo lường: baseline "14 lỗi / 11 file" owner báo cáo khác "16 lỗi / 12 file" trong sandbox trên cùng commit và lockfile (khác ở `ThemeProvider.test.tsx` và số lỗi của `BirthProfileForm.tsx`). Chore đã đưa tổng về 0 nên chênh lệch không còn ảnh hưởng; khuyến nghị dùng `npm ci` sạch khi đo baseline.

### 1.6 Phạm vi, phụ thuộc và hạ tầng

| ID | Tiêu chí | Bằng chứng | Nguồn | Trạng thái |
|---|---|---|---|---|
| EV-M1-27 | Không dependency mới | diff ròng `package.json`, `package-lock.json` (gốc), `frontend/package-lock.json` so với `9f0ff70` = rỗng ngoài hai dòng script ở EV-M1-28; `frontend/package.json` chỉ đổi `scripts` | [repo] | VERIFIED |
| EV-M1-28 | Chore bật typecheck thật (đã được owner chốt) | `typecheck` và `build` trỏ `tsc -p tsconfig.app.json --noEmit`; 16 lỗi được sửa trong 11 file (7× import `React` thừa; `queryClient.test`; cụm `useZodForm`/form) | [repo] [C-run] | VERIFIED — xem KG-F4M1-11 |
| EV-M1-29 | Ghim runner | `runs-on: ubuntu-24.04` ở cả `backend-ci.yml` và `frontend-ci.yml` | [repo] | VERIFIED |
| EV-M1-30 | F3 và `shared/api/**` không bị sửa | không có trong diff; chỉ `error-messages(.test).ts`, `useZodForm.ts`, `formFields.ts`, `queryClient.test.ts` và các file test/UI có lỗi kiểu | [repo] | VERIFIED (các thay đổi ngoài chart đều thuộc chore đã duyệt) |
| EV-M1-31 | CI xanh trên commit cuối | Backend CI #269 trên `7ff48cf`: **Success**, 2m 11s [CI]. Frontend CI trên `7ff48cf`: **Success** ([Run #38102309318](https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/38102309318)) [CI]. Toàn bộ cổng format, lint, typecheck, test, build đều pass. | [CI] | VERIFIED |
| EV-M1-32 | JSON bằng chứng không nằm lạc ở `backend/` (A-5) | hai file được `git mv` sang `docs/implementation/archive/sprint-f4/evidence/` (0 dòng đổi) | [repo] | VERIFIED |

## 2. Quyết định D-1…D-9 đã thực thi

| Quyết định | Thực tế trong mã | Trạng thái |
|---|---|---|
| D-1 key phân cấp | `chartKeys` (EV-M1-08) | VERIFIED |
| D-2 `ListChartsParams` đủ tham số | `listCharts.test` kiểm cả 5 | VERIFIED |
| D-3 union đóng + `KNOWN_*` | `types.ts` + contract test | VERIFIED |
| D-4 mutation trả `ChartResponse` | test `result.current.data?.id` | VERIFIED |
| D-5 chỉ 3 mã | EV-M1-12/13 | VERIFIED |
| D-6 `refetchOnReconnect: false` | EV-M1-09 | VERIFIED |
| D-7 nhân bản `problemDetails` | `handlers.ts` | VERIFIED |
| D-8 `encodeURIComponent` + `isValidChartId` | EV-M1-03/06 | VERIFIED |
| D-9 `keepPreviousData` | EV-M1-10 | VERIFIED |

## 3. Known Gaps Registry (M1)

| ID | Vấn đề | Phân loại |
|---|---|---|
| KG-F4M1-01 | `ChartResponse` không có `birthProfileId` (FG-01), Backend giữ `0.4.0` | Known Gap — defer (quyết định owner 2026-10-10) |
| KG-F4M1-03 | `staleTime: Infinity` + chart cũ chưa ghim version ⇒ diễn giải có thể đổi sau khi cache bị loại; F4 không hiển thị diễn giải | Known Gap — xử lý ở F5 |
| KG-F4M1-04 | `birthProfileLabel` luôn `null`, `birthProfileId` nullable (REST Spec §5.4 lệch mã) | Backend Contract Issue (G-02) + Documentation Gap |
| KG-F4M1-05 | REST Spec: `422` cho `houseSystem`, loại diễn giải `Angle`; F4 plan Mục 10: mã lỗi/status | Documentation Gap |
| KG-F4M1-06 | `problemDetails` nhân bản (F3 + chart) | Known Gap — defer |
| KG-F4M1-07 | F3 `useBirthProfilesQuery` chưa có `placeholderData` | Known Gap — defer (F3) |
| KG-F4M1-08 | `EPHEMERIS_PROVIDER_ERROR` bị bọc thành `CHART_CALCULATION_FAILED` | Backend Contract Issue (chỉ ghi nhận) |
| KG-F4M1-10 | `useChartsQuery` chỉ có 2 test, thiếu ca danh sách rỗng | Known Gap — nhỏ |
| KG-F4M1-11 | Chore dùng `schema as never`/`as Resolver<…>` trong `useZodForm.ts`, `any` có `eslint-disable` trong `formFields.ts`, và ép kiểu `onError as (err: unknown) => void` trong `queryClient.test.ts`: lỗi kiểu được **dập tắt** chứ chưa giải bằng generic đúng | Accepted Gap — nợ kỹ thuật cần theo dõi |
| KG-F4M1-12 | Cảnh báo Node 20 của `actions/checkout@v4`, `actions/setup-node@v4` trong CI | Known Gap — cập nhật khi có bản Node 24 |
| KG-F4M1-13 | Helper MSW chưa dùng hết (`chart/api/mocks` 77.27% coverage) | Known Gap — nhỏ |
| KG-F4M1-14 | Chính tả không đồng nhất: thông báo lỗi M1 dùng "Toạ" trong khi nội dung diễn giải Backend dùng kiểu mới ("Mặt Trời", "Sao Hỏa", "Sao Thủy") | Known Gap — chốt quy ước chính tả ở M2 |
| — | Cảnh báo `jwt-token.adapter.ts` (Backend, từ Sprint 1) | Known Gap kế thừa |

## 4. Việc đóng hồ sơ

1. [x] Cung cấp liên kết **Frontend CI** của `7ff48cf` (EV-M1-31: https://github.com/KhongphaiHphuc0705/astroviet/actions/runs/38102309318) và cập nhật Evidence Matrix sang `PASS`.
2. [x] Xoá blueprint `docs/implementation/Sprint_F4_M1_Implementation_Plan.md` (đang nằm trong `docs/implementation/`); giữ `Sprint_F4_Implementation_Plan.md` đến hết sprint F4.
3. [x] Lưu file này vào `docs/implementation/archive/sprint-f4/Sprint_F4_M1_Exit_Criteria_Evidence_Matrix.md`.
