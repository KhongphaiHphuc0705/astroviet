# Sprint F3 — M7 Implementation Plan: Testing Consolidation & Coverage

**Trạng thái**: Plan only — mọi số liệu trong tài liệu này lấy từ lệnh thật đã chạy (`npm run test:coverage`, `npx vitest run --reporter=verbose`) trên clone sạch của `origin/dev` (HEAD `1419077`, M6 đã CLOSED), không suy đoán.

## 1. Milestone Overview

M7 không thêm tính năng. Mục tiêu: (a) kiểm kê toàn bộ test hiện có của module Birth Profile (M1–M6), (b) đối chiếu coverage thật với ma trận rủi ro, (c) xác nhận G-06 (MSW tập trung) chưa từng bị vi phạm trong suốt F3, (d) lấp đúng những khoảng trống rủi ro cao đã tìm thấy — không viết test chỉ để tăng %.

## 2. Test Inventory (thật, từ `npx vitest run --reporter=verbose`)

**20 file / 73 test**, toàn bộ PASS, không có `.only`/`.skip`/TODO/FIXME nào (grep xác nhận sạch).

| File | Test | Milestone |
|---|---:|---|
| `features/birth-profile/api/createBirthProfile.test.ts` | 3 | M1 |
| `.../getBirthProfile.test.ts` | 3 | M1 |
| `.../listBirthProfiles.test.ts` | 3 | M1 |
| `.../updateBirthProfile.test.ts` | 6 | M1 |
| `.../deleteBirthProfile.test.ts` | 3 | M1 |
| `.../searchLocations.test.ts` | 3 | M1 |
| `features/birth-profile/hooks/query-keys.test.ts` | 4 | M2 |
| `.../useBirthProfilesQuery.test.tsx` | 2 | M2 |
| `.../useBirthProfileQuery.test.tsx` | 4 | M2 |
| `.../useCreateBirthProfileMutation.test.tsx` | 2 | M2 |
| `.../useUpdateBirthProfileMutation.test.tsx` | 2 | M2 |
| `.../useDeleteBirthProfileMutation.test.tsx` | 1 | M2 |
| `.../useLocationSearchQuery.test.tsx` | 4 | M2 |
| `features/birth-profile/ui/BirthProfileForm/schema.test.ts` | 7 | M3 |
| `.../mapper.test.ts` | 2 | M3 |
| `.../LocationSearchField.test.tsx` | 5 | M3 |
| `.../BirthProfileForm.test.tsx` | 5 | M3 |
| `pages/app/profiles/page.test.tsx` | 8 | M4 |
| `pages/app/profiles/new/page.test.tsx` | 2 | M5 |
| `pages/app/profiles/edit/page.test.tsx` | 4 | M5/M6 |
| `e2e/birth-profile.spec.ts` | 4 test block (12-bước CRUD, serial) | M5 |

M6 không thêm file test riêng cho Birth Profile (chỉ sửa `AppLayout.test.tsx` + `error-messages.test.ts`, thuộc `shared/`/`widgets/`, không tính vào bảng này).

## 3. Coverage Analysis (thật, từ `npm run test:coverage`)

**Toàn dự án**: 90.78% stmt / 83.29% branch / 92% funcs / 92.54% lines (78 file / 383 test). Baseline F2 tại thời điểm CLOSED (Sprint_F2 M9, đã verify độc lập trước đây): ~90.5% stmt / ~81% branch trên 56 file/291 test — **không regression tổng thể**, nhưng đây là so sánh ở cấp toàn dự án qua các thời điểm khác nhau (scope code đã lớn hơn), không phải so sánh cùng tập file.

**Theo module Birth Profile**:

| Folder | Stmt | Branch | Funcs | Lines |
|---|---:|---:|---:|---:|
| `features/birth-profile/api` (trừ `mocks/`) | 100 | 100 | 100 | 100 |
| `features/birth-profile/api/mocks` | 41.3 | 0 | 3.57 | 44.18 |
| `features/birth-profile/hooks` | 100 | 100 | 100 | 100 |
| `features/birth-profile/ui/BirthProfileForm` | 81.33 | 84 | 76.19 | 84.5 |
| `pages/app/profiles` (list) | 82.5 | 92.3 | 72.22 | 88.57 |
| `pages/app/profiles/new`, `.../edit` | 100 | 100 | 100 | 100 |

Hai điểm dưới ngưỡng ~90% baseline: **`BirthProfileForm` (81.33%)** và **`pages/app/profiles` list (82.5%)**. `api/mocks` (41.3%) là **false-negative có chủ đích** — đây là test infrastructure (factory MSW), nhiều factory (`problemDetails`, `birthProfileNotFound`, v.v.) chỉ được gọi bởi các test *khác* trong module, công cụ coverage đếm theo file định nghĩa chứ không theo nơi factory thực sự chạy → không phải gap thật, không đưa vào kế hoạch vá.

## 4. Gap Analysis — dòng code thật chưa được test chạy qua

Lấy trực tiếp từ coverage report + đọc source (không suy đoán số dòng).

### `BirthProfileForm.tsx` — dòng 53 chưa chạy qua
```ts
const onBack = () => { setStep(1); };
```
Không có test nào bấm "Back" từ Bước 2 quay lại Bước 1. Đây chính là hành vi mà **chính plan M3 (mục 13) đã liệt kê là bắt buộc** ("chuyển bước giữ giá trị đã nhập") nhưng chưa từng được viết.

### `LocationSearchField.tsx` — dòng 108-110, 183, 207-209 chưa chạy qua
- **108-110**: mở dropdown bằng phím `ArrowDown`/`ArrowUp` khi đang focus input.
- **183**: nút "Thử lại" (`refetch()`) khi `isError` — toàn bộ nhánh lỗi tra cứu địa điểm (`isError` → `Alert danger`) không được test nào chạy qua.
- **207-209**: chọn 1 suggestion bằng phím `Enter`/`Space` (thay vì click chuột) trên `<li role="option">`.

5 test hiện có (`LocationSearchField.test.tsx`) chỉ cover: disabled/enabled theo `birthDate`, debounce+hiển thị suggestion, empty-state, chọn bằng **click chuột**. Toàn bộ tương tác bàn phím của pattern `role="combobox"`/`role="listbox"` (component tự dựng, đã xác nhận có đủ ARIA từ M3) và nhánh lỗi mạng đều chưa có test.

### `pages/app/profiles/page.tsx` — dòng 60, 71, 145, 177 chưa chạy qua
- **60**: `onClick={() => refetch()}` — nút "Thử lại" trong `EmptyState variant="danger"` khi tải danh sách lỗi.
- **71**: `onClick={() => navigate("/app/profiles/new")}` — nút "Tạo hồ sơ mới" **bên trong EmptyState** (khác với nút cùng tên ở header, dùng `Button as={Link}`, đã được test từ M4).
- **145**: `onClick={() => setPage((p) => p - 1)}` — bấm "Trang trước" chưa từng thực sự được click (test M4 chỉ xác nhận `disabled` ở trang 1, không xác nhận việc bấm thực sự lùi trang).
- **177**: `onClose={() => setDeletingProfile(null)}` — đường tắt Modal tự đóng (overlay-click/Escape) khác với nút "Hủy" trong footer (đã test) đi qua path riêng.

## 5. Required Birth Profile Test Matrix — đối chiếu matrix rủi ro với inventory thật

| Rủi ro | Đã cover? | Bằng chứng |
|---|---|---|
| INV-BP1 (isBirthTimeKnown ⟺ birthTime) — cả 4 tổ hợp | ✅ | `schema.test.ts` (7 test, cả `.superRefine`) |
| Ownership 403 vs 404 (get/update/delete) | ✅ | `getBirthProfile.test.ts`, `updateBirthProfile.test.ts`, `deleteBirthProfile.test.ts` |
| List không có 403 (đúng contract thật, M1 đã sửa lại matrix gốc) | ✅ | `listBirthProfiles.test.ts` (400 + success, không test 403 — **đúng**, vì 403 không reachable) |
| Location search: gate theo `birthDate`, ngưỡng 2 ký tự, debounce | ✅ (gate/ngưỡng/debounce-delay) — ❌ (lỗi mạng, phím) | Có: `LocationSearchField.test.tsx` 3/5 test. Thiếu: mục 4 |
| birthDate đổi → xóa location cũ (OQ-2) | ✅ | `BirthProfileForm.test.tsx` (đã xác nhận ở review M3) |
| 2 bước giữ giá trị khi Back | ❌ | Không có test nào — mục 4 |
| Query key 2 namespace độc lập, Update invalidate cả 2 | ✅ | `useUpdateBirthProfileMutation.test.tsx`, `query-keys.test.ts` |
| Pagination: disabled đúng biên, **bấm Next/Prev đổi page thật** | ✅ (disabled) — ❌ (bấm Prev thật) | `page.test.tsx` có test Next hoạt động (M4 review đã xác nhận), nhưng dòng 145 (Prev onClick) chưa chạy qua — mục 4 |
| Auto-lùi trang khi xóa item cuối | ✅ | `page.test.tsx` (đã xác nhận ở review M4) |
| Delete: cancel / confirm / failure | ✅ | `page.test.tsx` (đã xác nhận ở review M4) |
| Modal đóng qua overlay/Escape (không chỉ nút Hủy) | ❌ | mục 4 |
| List/Edit fetch lỗi → EmptyState danger + retry hoạt động thật | ✅ (hiển thị) — ❌ (bấm Thử lại thật) | `page.test.tsx`/`edit/page.test.tsx` test hiển thị đúng trạng thái, nhưng dòng 60 (click retry) chưa chạy qua |
| `getErrorMessage(errorCode)` cho toàn bộ 10 mã (M6) | ✅ | `error-messages.test.ts` (không thuộc birth-profile module, đã review ở M6, không lặp lại ở đây) |
| CRUD E2E thật (backend thật, G-05) | ✅ | `e2e/birth-profile.spec.ts`, 4 block tuần tự, đã review M5 |

## 6. MSW/G-06 Audit

Grep toàn bộ `features/birth-profile/**` và `pages/app/profiles/**` cho literal `http.get/post/patch/delete("*/api/v1/...")` **ngoài** `mocks/handlers.ts`: **0 kết quả**. G-06 (tập trung MSW handler, thiết lập từ M1) **chưa từng bị vi phạm** ở bất kỳ milestone nào của F3 — mọi test đều import factory từ `features/birth-profile/api/mocks/handlers.ts` (18 factory export, liệt kê đủ ở mục 2). Không cần công việc "consolidate" nào — không có gì để gộp. Khuyến nghị duy nhất: giữ nguyên kỷ luật này khi viết test mới ở M7-T1/T2 (dùng factory sẵn có, chỉ thêm factory mới nếu thật sự cần kịch bản chưa có — ví dụ lỗi mạng cho location search).

## 7. Required Cleanup

| Vấn đề | Vị trí | Ghi chú |
|---|---|---|
| `act()` warning (không fail) khi chạy `BirthProfileForm.test.tsx` | Cập nhật state bất đồng bộ của `LocationSearchField` bên trong test tích hợp | Đã ghi nhận ở review M3 trước đây, chưa sửa. Cùng loại với gap G-12 đã đăng ký ở F2 Known Gaps (`register/page.test.tsx`) — **không** thuộc phạm vi sửa của M7 (M7 không mở lại code M1-M6 để refactor thẩm mỹ), chỉ ghi nhận vào Known Gaps chung |
| Test naming không theo Coding Standards §13.4 ("should X when Y") | Toàn bộ 20 file | Đã là drift được chấp nhận có chủ đích từ M1 (ưu tiên nhất quán nội bộ F2 hơn tuân thủ spec chưa từng áp dụng) — không sửa lại ở M7 |
| Không có test file nào trùng lặp/thừa/lỗi thời | — | Không tìm thấy |

Không phát hiện brittle test (snapshot, sleep cứng, console suppression) nào trong 20 file — đã grep xác nhận.

## 8. Coverage Priority Plan

Chỉ thêm test cho khoảng trống ở mục 4, xếp theo rủi ro thật (không xếp theo % coverage):

| # | Test cần thêm | File | Rủi ro nếu bỏ qua |
|---|---|---|---|
| 1 | Chọn suggestion bằng bàn phím (`ArrowDown` → `Enter`) | `LocationSearchField.test.tsx` | Cao — đây là hành vi cốt lõi của pattern ARIA combobox mà chính M3 dựng tay (không dùng thư viện) để đảm bảo accessibility; nếu hỏng, người dùng bàn phím không chọn được địa điểm — không có gì khác bắt lỗi này |
| 2 | Nhánh `isError` của location search (Alert danger + bấm "Thử lại" gọi lại `refetch`) | `LocationSearchField.test.tsx` | Cao — lỗi mạng bên thứ 3 (geonames) là kịch bản thực tế đã được chính plan M3 lường trước (mục Location Search Behavior), nhưng chưa từng test |
| 3 | Bấm "Back" ở Bước 2 → Bước 1 vẫn giữ giá trị đã nhập | `BirthProfileForm.test.tsx` | Trung bình — mất dữ liệu người dùng đã nhập là trải nghiệm tệ, và đây là yêu cầu tường minh đã ghi trong plan M3 nhưng bị bỏ sót |
| 4 | Bấm "Trang trước" thực sự gọi lại `useBirthProfilesQuery` với `page` giảm 1 | `page.test.tsx` | Trung bình — hiện chỉ test `disabled` ở biên, chưa test hành vi chính của nút |
| 5 | Bấm "Thử lại" ở trạng thái lỗi tải danh sách gọi `refetch` | `page.test.tsx` | Trung bình — cùng loại thiếu sót như #2 nhưng ở tầng List |
| 6 | Nút "Tạo hồ sơ mới" bên trong `EmptyState` (không phải nút header) điều hướng đúng | `page.test.tsx` | Thấp — cùng đích với nút đã test, nhưng là code path riêng (dòng 71) |

**Không thêm**: test cho Modal tự đóng qua overlay/Escape (dòng 177) — đây là hành vi **nội bộ của component `Modal`** (đã có `Modal.test.tsx` riêng từ F1 xác nhận `onClose` hoạt động đúng khi overlay/Escape) — test lại ở `page.tsx` là test implementation của thư viện dùng chung, không phải rủi ro riêng của Birth Profile (đúng nguyên tắc Coding Standards §13.2 "không test chi tiết implementation nội bộ"). Không thêm test coverage cho `api/mocks/handlers.ts` (mục 3 đã giải thích false-negative).

## 9. Files to Modify

```
frontend/src/features/birth-profile/ui/BirthProfileForm/LocationSearchField.test.tsx   (+2 test: #1, #2)
frontend/src/features/birth-profile/ui/BirthProfileForm/BirthProfileForm.test.tsx      (+1 test: #3)
frontend/src/pages/app/profiles/page.test.tsx                                          (+3 test: #4, #5, #6)
```
**Không tạo file mới.** Không sửa bất kỳ file implementation nào (`.tsx` không phải `.test.tsx`) — M7 chỉ thêm test, không sửa hành vi.

## 10. Test Addition Plan (chi tiết)

- **#1 (keyboard select)**: theo đúng flow `LocationSearchField.test.tsx` đã có (fake timers, debounce), sau khi suggestion xuất hiện: `await user.keyboard("{ArrowDown}")` rồi `await user.keyboard("{Enter}")` (dùng `userEvent` đã setup sẵn `advanceTimers`), assert `field.onChange` hiệu lực qua việc chuyển sang read-only view (giống assertion của test click chuột hiện có, chỉ khác thao tác kích hoạt).
- **#2 (error + retry)**: `server.use(mockSearchLocations(() => HttpResponse.json({errorCode:"..."}, {status:500})))` (factory sẵn có, không tạo factory mới trừ khi 500-cho-location-search chưa có sẵn factory riêng — nếu chưa, thêm 1 factory nhỏ `searchLocationsError` vào `mocks/handlers.ts`, vẫn tuân thủ G-06); assert `Alert` với text "Lỗi tra cứu" hiển thị; bấm "Thử lại"; assert `useLocationSearchQuery` gọi lại (đếm số request qua handler, theo đúng kỹ thuật capture request đã dùng từ M1).
- **#3 (Back giữ giá trị)**: điền Bước 1, bấm "Tiếp tục", bấm "Back", assert input Bước 1 vẫn còn giá trị đã điền (dùng `getByLabelText`/`getByRole` theo §13.2, không đọc `form.getValues()` nội bộ).
- **#4 (Prev thật)**: mock `listBirthProfilesSuccess` cho `page=2` rồi `page=1` khác nội dung (2 `server.use` nối tiếp, hoặc 1 handler đọc query `page` để trả khác nhau); render ở trang 2 (qua click Next từ trang 1, hoặc set state ban đầu nếu component cho phép qua props — theo đúng cách trang được test hiện tại render); bấm "Trang trước"; assert nội dung trang 1 xuất hiện lại.
- **#5 (retry List)**: `server.use` trả lỗi 1 lần, assert `EmptyState danger`; bấm "Thử lại"; `server.use` lại (hoặc để mặc định fallback nếu `resetHandlers` giữa test không áp dụng giữa hành động trong-1-test) trả success; assert danh sách hiện ra.
- **#6 (Create CTA trong EmptyState)**: render với `listBirthProfilesSuccess` trả `items: []`; bấm nút "Tạo hồ sơ mới" trong `EmptyState`; assert điều hướng `/app/profiles/new` (dùng `MemoryRouter`+route đích có marker, đúng pattern đã dùng ở `AppLayout.test.tsx` M6 — không phải phát minh cách mới).

## 11. Definition of Done

- [ ] 6 test mới (mục 8) được thêm đúng 3 file (mục 9), không tạo file mới
- [ ] Không sửa bất kỳ file implementation nào
- [ ] `npx vitest run src/features/birth-profile src/pages/app/profiles` — 26/26 test pass (20 file/73 test hiện có + 6 test mới, không mất test nào)
- [ ] `npm run test:coverage` — `BirthProfileForm` và `pages/app/profiles` (list) đạt ≥90% cả 4 chỉ số (ước tính hợp lý dựa trên số dòng/nhánh cụ thể đã xác định ở mục 4, không cam kết con số chính xác trước khi chạy thật)
- [ ] Toàn bộ 383 test hiện có của dự án vẫn pass (regression = 0)
- [ ] `npm run lint && npm run typecheck && npm run format:check && npm run build` sạch
- [ ] G-06 vẫn được giữ nguyên (0 literal endpoint URL ngoài `mocks/handlers.ts`, kể cả 2 test mới có thể cần factory `searchLocationsError`)

## 12. Acceptance Criteria

- Mỗi dòng/nhánh liệt kê ở mục 4 (53; 108-110, 183, 207-209; 60, 71, 145) được ít nhất 1 test chạy qua, **trừ dòng 177** (quyết định không test, mục 8).
- Không có test mới nào vi phạm G-06 hoặc Coding Standards §13.2/13.3.
- Coverage 2 folder yếu (`BirthProfileForm`, `pages/app/profiles`) tăng thật (verify bằng lệnh thật sau khi code, không tự nhận).

## 13. Verification Commands

```bash
cd frontend
npm run typecheck
npx vitest run src/features/birth-profile src/pages/app/profiles
npm run test:coverage    # đối chiếu lại 2 folder ở mục 3, xác nhận tăng thật
npx vitest run --passWithNoTests   # toàn bộ 383+6 test
npm run lint
npm run format:check
npm run build
```

## 14. Known Gaps (đưa sang M8, không sửa ở M7)

| ID | Gap |
|---|---|
| KG-M7-01 | `act()` warning trong `BirthProfileForm.test.tsx` (cùng loại đã đăng ký ở F2 G-12), không fail, chưa sửa |
| KG-M7-02 | Test naming toàn F3 không theo Coding Standards §13.4 ("should...when"), là drift có chủ đích đã chấp nhận từ M1 |
| KG-M7-03 | Dòng 177 (`page.tsx`, Modal `onClose` qua overlay/Escape) không có test riêng ở tầng Birth Profile — chấp nhận được vì đã cover ở `Modal.test.tsx` (F1) |

## 15. Final Recommendation

**Sẵn sàng implement ngay.** Không có blocker. G-06 đã sạch từ trước — M7 chỉ cần thêm 6 test có mục tiêu rõ ràng (mục 8-10), không cần bất kỳ công việc "dọn dẹp"/"gộp mock" nào như tên gọi milestone có thể gợi ý — audit thật cho thấy phần đó chưa bao giờ có vấn đề.
