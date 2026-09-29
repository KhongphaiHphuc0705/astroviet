# Sprint F3 — M6 Implementation Plan: Navigation & Error Dictionary

## 1. Milestone Overview

| | |
|---|---|
| **Milestone ID** | F3-M6 |
| **Name** | Navigation & Error Dictionary |
| **Sprint** | Sprint F3 — Birth Profile Module (Frontend) |
| **Status** | Planned (chưa implement — plan này chỉ định nghĩa cách làm và cách verify, không tuyên bố PASS) |
| **Lập ngày** | 2026-09-28 |
| **Objective** | (1) Thêm mục "Hồ sơ sinh" vào Sidebar (desktop) và mobile Drawer của `AppLayout` bằng `<Link>` thật tới `/app/profiles`. (2) Bổ sung 100% error code của §2.4 vào `shared/lib/error-messages.ts` với message tiếng Việt, kèm test cho từng mã. |

## 2. Context

M1–M5 đã CLOSED: người dùng đã có thể liệt kê / tạo / sửa / xóa Birth Profile, nhưng (a) chỉ vào được `/app/profiles` bằng cách gõ URL, và (b) mọi lỗi nghiệp vụ của Birth Profile (404/403/422) đang rơi vào message fallback chung "Đã có lỗi xảy ra, vui lòng thử lại." đồng thời bị `reportError` như lỗi "không rõ". M6 đóng hai khoảng trống này ở đúng thời điểm module đã chạy end-to-end, trước khi milestone đóng tài liệu (M8) chốt Known Gaps.

## 3. Scope

### In Scope
- Thêm 1 mục điều hướng "Hồ sơ sinh" (desktop sidebar + mobile drawer) trong `widgets/app-layout/index.tsx`.
- Đóng drawer khi bấm link điều hướng trong mobile drawer (hệ quả bắt buộc của việc dùng `<Link>` — xem D-04).
- Thêm các mã lỗi §2.4 (kèm 1 Correction có căn cứ — D-03) vào **đúng 1 dictionary** hiện có.
- Chuyển `AppLayout.test.tsx` sang `renderWithProviders` (bắt buộc — xem F-08) và thêm test điều hướng.
- Thêm test từng mã lỗi trong `error-messages.test.ts`.
- Cập nhật 2 assertion trong test page Create/Edit đang gắn chặt vào trạng thái "chưa map" (F-11).

### Out of Scope (đúng mục 10 của prompt; phát sinh thì ghi Known Gaps, không kéo vào M6)
Sidebar/Drawer redesign; sửa 2 mục `<a href="/">` cũ; shared navigation config; active-state; Backend/API/OpenAPI; business logic Birth Profile; global error handling / `queryClient` / Toast / i18n / Sentry; đổi message tĩnh ở List/Edit/LocationSearchField; validation ngày sinh phía client; pagination; Chart/Swiss Ephemeris/Interpretation.

## 4. Dependencies

| Dependency | Trạng thái | Ghi chú |
|---|---|---|
| F3 M1–M5 | CLOSED (78/78 file, 369/369 test, quality gates sạch tại lần xác nhận gần nhất) | M6 không sửa code M1–M5, chỉ chạm 2 assertion test của M5 (F-11) |
| Routing `/app/profiles` | Đã tồn tại (M4) | `router.tsx`: child của route `app` (bọc `ProtectedRoute` + `AppLayout`) |
| `AppLayout` | Tồn tại, chưa có nav Birth Profile | `widgets/app-layout/index.tsx` |
| Sidebar / mobile Drawer | Cùng nằm trong `AppLayout`, **hai khối markup riêng** | xem F-02 |
| Error dictionary | `shared/lib/error-messages.ts`, 5 mã | xem F-09 |
| §2.4 error contract | `docs/implementation/Sprint_F3_Implementation_Plan.md` §2.4 (9 mã) | có 2 sai lệch so với backend — D-02, D-03 |
| Shared test helper | `@test/render` (`renderWithProviders`: MemoryRouter + QueryClientProvider + ThemeProvider) | dùng cho `AppLayout.test.tsx` |

## 5. Repository Audit Findings

Mọi mục dưới đây được đọc trực tiếp từ source (`origin/dev`, HEAD `3959980`) và/hoặc xác nhận bằng lệnh thật. Riêng F-06 và F-08 được xác nhận bằng một spike tạm (thêm `<Link>` vào bản clone rồi hoàn tác toàn bộ — không phải implementation).

### Navigation

| # | Finding |
|---|---|
| F-01 | `/app/profiles` **đã tồn tại thật** (M4). Ngoài ra `/app/profiles/new` và `/app/profiles/:id/edit` (M5). Route khai báo tay trong `routesConfig` (`app/router.tsx`), lazy-load, nằm dưới `ProtectedRoute`. Không có module hằng số route — convention là chuỗi literal (`navigate("/app/profiles")` ở M4/M5, `/login` ở F2). |
| F-02 | `AppLayout` (`widgets/app-layout/index.tsx`) nhận props `{children, headerActions?}`. **Không có prop/config danh sách điều hướng.** Desktop `<aside><nav aria-label="Điều hướng chính">` và mobile `<nav aria-label="Điều hướng chính (Mobile)">` là **hai khối JSX hard-code riêng biệt**, mỗi khối có 2 mục `<a href="/">`: "Bảng điều khiển" (icon `LayoutDashboard`) và "Cài đặt" (icon `Settings`). → **Desktop và mobile KHÔNG dùng chung navigation source.** |
| F-03 | Hai mục hiện có là `<a href="/">` (full reload, đích sai "/") — nợ kỹ thuật có sẵn từ F1, không thuộc M6. `Link` của `react-router-dom` chưa được import trong file này (`widgets/user-menu` đã dùng `useNavigate` → widget dùng router là pattern hợp lệ). |
| F-04 | **Không có active-state** (không `useLocation`, `NavLink`, `aria-current`, class theo route) cho bất kỳ mục nào. Không có convention để "theo". |
| F-05 | Icon convention: import tên icon từ `lucide-react` (v1.28.0) ở đầu file, render `size={20}` đầu mỗi link, link có `className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-raised"` (copy nguyên className của link anh em trong cùng `<nav>`). Đã xác nhận `IdCard`, `CircleUser`, `Contact`, `ContactRound` đều được export; `UserCircle` chỉ là alias cũ của `CircleUser`. |
| F-06 | **Drawer không tự đóng khi điều hướng client-side.** `mobileDrawerOpen` là state Zustand singleton (`uiStore`), chỉ đóng bởi overlay (dòng 108) và nút X (dòng 125); không có effect nào theo dõi route. Các link `<a href="/">` hiện nay che khuất vấn đề vì full reload reset state. Spike xác nhận: bấm `<Link>` trong drawer → `mobileDrawerOpen` vẫn `true`. Nếu không xử lý, người dùng mobile bấm "Hồ sơ sinh" sẽ thấy route đổi nhưng drawer vẫn che nội dung. |
| F-07 | `AppLayout` được render ở: `router.tsx` (trong RouterProvider), `pages/verify/page.tsx` (route `/dev/style-guide`, cũng trong RouterProvider), `AppLayout.test.tsx`, và gián tiếp qua `router.test.tsx`, `auth-flow.integration.test.tsx` (qua router). E2E `layout.spec.ts` chỉ assert visibility của 2 landmark nav — không bị ảnh hưởng khi thêm 1 mục. → Chỉ **`AppLayout.test.tsx`** chịu tác động khi thêm `<Link>`. |
| F-08 | `AppLayout.test.tsx` (5 test) dùng `render()` trần của RTL, **không bọc Router**. Spike: thêm 1 `<Link>` → **cả 5/5 test fail** (thiếu Router context). `renderWithProviders` đã bọc `MemoryRouter` và re-export `screen`/`fireEvent`; hỗ trợ `initialEntries`. Ngoài ra `useUiStore` là singleton → state rò rỉ giữa các test; test mới phải reset trong `beforeEach`. |

### Error Dictionary

| # | Finding |
|---|---|
| F-09 | `ERROR_MESSAGES` hiện có 5 mã: `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `TOKEN_EXPIRED`, `UNAUTHORIZED`, `MALFORMED_REQUEST`. `getErrorMessage(code)` trả message; nếu không có → **fallback** "Đã có lỗi xảy ra, vui lòng thử lại." **và gọi `reportError`** (mỗi lần gọi). `isKnownBusinessError(code)` = `code in ERROR_MESSAGES`. Cả hai hàm suy ra từ cùng 1 record → thêm mã vào record là đủ, không sửa hàm. |
| F-10 | `queryClient.ts` `mutations.onError` chỉ `reportError` khi mã **không** thuộc `isKnownBusinessError`. Hệ quả của M6: 10 mã mới chuyển từ "lỗi lạ được báo cáo" sang "lỗi nghiệp vụ đã biết, không báo cáo" (đúng ngữ nghĩa cho 404/403/422; nhất quán với 5 mã auth). Trước M6, mỗi lần Create/Edit hiển thị lỗi Birth Profile đều bị báo cáo (global `onError` + `getErrorMessage` gọi ngay trong render). Query (không phải mutation) không có handler toàn cục nên không đổi. |
| F-11 | **Test M5 gắn chặt vào trạng thái "chưa map"**: `pages/app/profiles/new/page.test.tsx` (mock `errorCode: "VALIDATION_ERROR"`, assert fallback ở dòng ~110) và `edit/page.test.tsx` (tương tự, dòng ~121/143). Sau M6, `VALIDATION_ERROR` có message riêng → 2 assertion này **sẽ fail** nếu không cập nhật. `register/page.test.tsx:190` dùng mã auth khác → không bị ảnh hưởng. |
| F-12 | Convention test dictionary (`error-messages.test.ts`): `vi.spyOn(reportErrorModule, "reportError")` trong `beforeEach`; **assertion explicit từng mã** `expect(getErrorMessage(CODE)).toBe("<message chính xác>")`; assert `reportError` không được gọi với mã đã biết; `isKnownBusinessError` test true/false. Repo **không dùng `it.each`/`describe.each`** ở bất kỳ đâu → theo convention explicit. Test cũ tên "mỗi mã trong 5 mã đã biết" vẫn đúng cho 5 mã gốc → giữ nguyên. |

### Backend / API error contract

| # | Finding |
|---|---|
| F-13 | Cả 9 mã §2.4 **đều tồn tại** trong `backend/src/shared/errors/error-codes.ts`. |
| F-14 | `mapDomainErrorToAppError` (birth-profile) phát ra: `INVALID_BIRTH_DATE`, **`INVALID_BIRTH_TIME`**, `INVALID_LATITUDE_RANGE`, `INVALID_LONGITUDE_RANGE`, `INVALID_TIMEZONE`, `INVALID_BIRTH_LOCATION`, `INVALID_BIRTH_TIME_STATE` (tất cả `DomainError`, HTTP 422), và `InvalidLabelError → VALIDATION_ERROR` (INV-BP2: label 1–100 ký tự). `RESOURCE_NOT_FOUND` (404) / `FORBIDDEN` (403) đến từ use-case + `assertOwnership`. |
| F-15 | `RESOURCE_NOT_FOUND` và `FORBIDDEN` được phát bởi **cả module birth-profile và chart** cùng middleware dùng chung → dictionary là global, message phải trung tính về loại tài nguyên (D-05). |
| F-16 | `INVALID_BIRTH_DATE` thực tế được ném khi: ngày không parse được, **ngày lịch không tồn tại** (vd 2001-02-29), hoặc **ngày không nằm hoàn toàn trong quá khứ** (hôm nay/tương lai). **Không có kiểm tra "phạm vi ephemeris" nào** trong module; REST API Spec §14.11 (quyết định đã chốt) khẳng định "không đặt biên dưới cứng… chỉ yêu cầu `birthDate < ngày hiện tại`". Form M3 chỉ validate regex định dạng và input date native không có `max` → người dùng **hoàn toàn có thể** gửi ngày hôm nay/tương lai và nhận 422 này trong luồng UI bình thường. |
| F-17 | Mã có thể gặp trong luồng F3 nhưng **không thuộc §2.4** và chưa map: `GEOCODING_PROVIDER_ERROR` (location search lỗi upstream, 500 theo OpenAPI; UI hiện dùng text tĩnh), `INTERNAL_SERVER_ERROR` (fallback chung là đủ). `RATE_LIMIT_EXCEEDED` chỉ có trong enum, **không nơi nào phát ra** (không có rate limiter) → không reachable. |

## 6. Decision Log

| ID | Decision | Căn cứ |
|---|---|---|
| D-01 | **Không tạo shared navigation config / abstraction mới.** Thêm mục vào cả 2 khối JSX hiện có, theo đúng cấu trúc hiện tại. | Rule 3 & 4 của prompt; F-02. Ghi nhận trùng lặp desktop/mobile ở Known Gaps (KG-02) thay vì tự refactor. |
| D-02 | **Correction §2.4 — ngữ nghĩa `INVALID_BIRTH_DATE`.** §2.4 ghi "Ngày sinh ngoài phạm vi ephemeris hỗ trợ" — **sai**. Nguồn authoritative: backend implementation (`birth-date.vo.ts`) + REST Spec §14.11 (frozen) — cả hai xếp trên tài liệu kế hoạch F3 theo thứ tự ưu tiên nguồn sự thật của dự án. Message dùng ngữ nghĩa thật: ngày phải hợp lệ và ở quá khứ. | F-16. Không sửa tài liệu §2.4 một cách im lặng — ghi erratum ở KG-08 để M8 chốt. |
| D-03 | **Correction §2.4 — bổ sung `INVALID_BIRTH_TIME`** (mã thứ 10). §2.4 bỏ sót mã mà backend thật sự trả cho POST/PATCH khi `BirthTime.create` từ chối giờ/phút/giây ngoài khoảng (regex HTTP-layer chỉ kiểm chữ số). Nguồn authoritative: `map-domain-error.ts` + enum backend. Thiếu mã này thì lỗi thật rơi vào fallback + bị báo cáo như lỗi lạ. | F-14. Đây là **mở rộng so với chữ của prompt ("không thêm mã ngoài §2.4")** nên được nêu tường minh và đưa vào OQ-M6-1 (non-blocking). Rollback: xóa 1 dòng dictionary + 1 test. |
| D-04 | **Link trong mobile drawer phải đóng drawer khi bấm** (`onClick={() => setMobileDrawerOpen(false)}`), dùng setter đã có sẵn trong component. Link desktop không cần. Không sửa 2 link `<a>` cũ (chúng reload trang nên tự reset). | F-06. Đây là hành vi bắt buộc để mục mới dùng được trên mobile, không phải redesign Drawer. |
| D-05 | Message cho `RESOURCE_NOT_FOUND` / `FORBIDDEN` **trung tính về tài nguyên** (không nói "hồ sơ"). | F-15: cùng mã sẽ được Chart (Phase 3) dùng. Message quá cụ thể trong dictionary global sẽ sai ngữ cảnh. |
| D-06 | **Không tạo active-state cho mục mới.** | F-04 + yêu cầu tường minh của prompt. |
| D-07 | Icon: **`IdCard`** (lucide-react), `size={20}`. Vị trí: giữa "Bảng điều khiển" và "Cài đặt" (Cài đặt giữ cuối). | F-05. `IdCard` diễn đạt "bản ghi hồ sơ cá nhân" và tránh nhầm với avatar/menu tài khoản trên header (`CircleUser`). Đây là khuyến nghị nhẹ, đổi icon không ảnh hưởng gì khác. |
| D-08 | Đường dẫn đích viết **literal `"/app/profiles"`** trong `AppLayout`, **không import gì từ `@features/birth-profile`**. | Rule 5; F-01 (không có module route constants; literal là convention). |
| D-09 | Mọi mã mới vào **cùng record `ERROR_MESSAGES`** với comment nhóm; không sửa `getErrorMessage`/`isKnownBusinessError`. Chuỗi mã sao chép nguyên văn từ enum backend (kiểm bằng grep ở T5). | F-09; yêu cầu "không duplicate logic". |
| D-10 | Test dictionary theo convention explicit, **mỗi mã 1 `it`** (không `it.each`), mỗi `it` assert: message chính xác, `isKnownBusinessError === true`, `reportError` không được gọi. | F-12; cách explicit cũng cô lập lỗi theo từng mã. |
| D-11 | Test page M5 (F-11): **đổi mã lỗi giữ nguyên `VALIDATION_ERROR`, đổi expected text sang message đã map** thay vì đổi sang mã "lạ". | Test giữ dữ liệu thực tế và trở thành kiểm tra chuỗi thật "mã backend → dictionary → UI" (chính bản chất bug M5). Nhánh fallback đã có test riêng ở `error-messages.test.ts`. |
| D-12 | Không thêm E2E mới; `layout.spec.ts` và `birth-profile.spec.ts` không sửa. | Prompt yêu cầu test component/dictionary; E2E chạy trên CI (G-05). Gợi ý tùy chọn ở KG-07. |

## 7. Implementation Tasks

| Task | Tên | Loại |
|---|---|---|
| M6-T1 | Audit kiến trúc navigation | Đã hoàn tất trong plan này (mục 5) — không code |
| M6-T2 | Thêm mục "Hồ sơ sinh" vào desktop Sidebar | Code |
| M6-T3 | Thêm mục "Hồ sơ sinh" vào mobile Drawer + đóng drawer khi bấm | Code |
| M6-T4 | Cập nhật `AppLayout.test.tsx` (Router bắt buộc) + test điều hướng | Test |
| M6-T5 | Audit §2.4 vs backend | Đã hoàn tất (F-13…F-17, D-02, D-03); còn 1 bước kiểm tra chuỗi mã bằng grep khi code |
| M6-T6 | Thêm mapping vào `error-messages.ts` | Code |
| M6-T7 | Thêm test từng mã trong `error-messages.test.ts` | Test |
| M6-T8 | Cập nhật 2 assertion test page Create/Edit (F-11) | Test |
| M6-T9 | Chạy verification đầy đủ | Verify |

Thứ tự khuyến nghị: T2 → T3 → T4 (chạy test ngay) → T6 → T7 → T8 → T9. (Đúng bài học các milestone trước: chạy test ngay sau mỗi cụm thay đổi.)

## 8. Files to Create

**Không có.** Mọi thay đổi nằm trong file hiện có (không tạo file config/nav/route constants mới — D-01, D-08).

## 9. Files to Modify

| File | Thay đổi |
|---|---|
| `frontend/src/widgets/app-layout/index.tsx` | import `Link` (react-router-dom) + `IdCard` (lucide-react, gộp vào import lucide hiện có); thêm 1 `<Link>` vào desktop nav và 1 `<Link>` (kèm `onClick` đóng drawer) vào mobile nav |
| `frontend/src/widgets/app-layout/AppLayout.test.tsx` | đổi sang `renderWithProviders`/`screen`/`fireEvent` từ `@test/render`; reset `useUiStore` trong `beforeEach`; thêm test điều hướng |
| `frontend/src/shared/lib/error-messages.ts` | thêm 10 mã vào `ERROR_MESSAGES` |
| `frontend/src/shared/lib/error-messages.test.ts` | thêm block test 10 mã |
| `frontend/src/pages/app/profiles/new/page.test.tsx` | chỉ đổi expected text của test lỗi tạo (F-11) |
| `frontend/src/pages/app/profiles/edit/page.test.tsx` | chỉ đổi expected text của test lỗi cập nhật (F-11) |

## 10. Files Not to Modify

`shared/api/client.ts`, `shared/api/queryClient.ts`, `app/router.tsx` (route đã đủ), `shared/stores/uiStore.ts`, `shared/lib/report-error.ts`, mọi thứ trong `features/birth-profile/**` và `pages/app/profiles/**` **ngoại trừ** 2 assertion nêu trên, `e2e/**`, toàn bộ `backend/**`, và 2 link `<a href="/">` cũ trong `AppLayout`. Dễ sửa nhầm nhất: (a) "tiện tay" đổi 2 link cũ sang `<Link>`, (b) đổi `getErrorMessage` để tách map theo feature.

## 11. Detailed Implementation Steps

### M6-T2 — Desktop Sidebar
- **Objective**: hiển thị "Hồ sơ sinh" trong `aside nav[aria-label="Điều hướng chính"]`.
- **Exact source location**: `widgets/app-layout/index.tsx`, trong `<nav>` của `<aside>` — chèn giữa `<a>` "Bảng điều khiển" và `<a>` "Cài đặt".
- **Implementation logic**: `<Link to="/app/profiles" className={<copy className của <a> anh em>}>` chứa `<IdCard size={20} />` + text `Hồ sơ sinh`. Cấu trúc bên trong y hệt các mục hiện có (icon rồi label; nếu các mục hiện có bọc label trong `<span>` hoặc ẩn khi `sidebarCollapsed`, làm giống hệt — đọc lại đoạn JSX ngay trước khi sửa, không giả định).
- **Constraints**: không import từ `@features/*`; không `NavLink`, không `useLocation`, không active class (D-06); không đổi mục cũ.
- **Test**: T4.
- **Completion**: link render trong landmark desktop, `href="/app/profiles"`.

### M6-T3 — Mobile Drawer
- **Objective**: cùng mục trong `nav[aria-label="Điều hướng chính (Mobile)"]`, và drawer đóng sau khi bấm.
- **Exact source location**: `<nav>` trong khối drawer, cùng vị trí tương đối (giữa 2 mục cũ).
- **Implementation logic**: như T2 nhưng thêm `onClick={() => setMobileDrawerOpen(false)}` (setter đã có tại dòng 18; overlay/nút X đã dùng cùng cách). Đóng ở `onClick` là an toàn: `Link` vẫn thực hiện điều hướng vì handler không `preventDefault`.
- **Constraints**: D-04; không đổi cấu trúc Drawer, không thêm focus-trap (TODO có sẵn trong file thuộc backlog khác).
- **Completion**: bấm link trong drawer → route đổi và `mobileDrawerOpen === false`.

### M6-T4 — `AppLayout.test.tsx`
- **Objective**: chứng minh mục mới tồn tại ở **cả hai đường render** (vì chúng không dùng chung nguồn — F-02 — nên test cả hai là cần thiết, không phải lặp vô nghĩa) và điều hướng đúng.
- **Exact location**: `widgets/app-layout/AppLayout.test.tsx`.
- **Implementation logic**:
  1. Thay `render` trần bằng `renderWithProviders` cho **cả 5 test cũ** (chỉ đổi helper, giữ nguyên assertion) — nếu bỏ bước này 5/5 test cũ fail (F-08).
  2. `beforeEach`: `useUiStore.setState({ mobileDrawerOpen: false, sidebarCollapsed: false })` để test không phụ thuộc thứ tự.
  3. Test mới (dùng query theo landmark, giống test "dual nav landmarks" hiện có, để không nhập nhằng khi có 2 link cùng tên):
     - desktop: trong `getByRole("navigation", { name: "Điều hướng chính" })` có link "Hồ sơ sinh" với `href` = `/app/profiles`;
     - mobile: trong `getByRole("navigation", { name: "Điều hướng chính (Mobile)" })` có link "Hồ sơ sinh" với `href` = `/app/profiles`;
     - điều hướng desktop: render `AppLayout` tại route `/app` và một route đích `/app/profiles` hiển thị marker text; bấm link → marker hiện ra (chứng minh điều hướng client-side thật, không chỉ `href`);
     - điều hướng mobile: mở drawer (bấm nút "Menu"), bấm link trong drawer → marker đích hiện ra **và** `useUiStore.getState().mobileDrawerOpen === false`.
- **Constraints**: không snapshot; không assert class Tailwind; không assert thứ tự mục (Rule 6).
- **Completion**: 5 test cũ + các test mới pass.

### M6-T5 — Kiểm tra chuỗi mã lỗi (khi code)
Trước khi gõ dictionary, xác nhận từng chuỗi mã có trong `backend/src/shared/errors/error-codes.ts` (grep từng mã). Lý do: `ERROR_MESSAGES` là `Record<string,string>` nên TypeScript không bắt được typo trong key (rủi ro R-04).

### M6-T6 — Dictionary
- **Objective**: thêm 10 mã (mục 12) vào record hiện có.
- **Exact location**: `shared/lib/error-messages.ts`, trong `ERROR_MESSAGES`, sau 5 mã hiện có, đặt dưới comment nhóm (vd "// Birth Profile — Sprint F3 §2.4 (+ INVALID_BIRTH_TIME, xem Decision Log D-03)"), mỗi mã 1 dòng, văn phong giống 5 mã cũ (câu ngắn, kết thúc bằng dấu chấm).
- **Constraints**: không sửa `getErrorMessage`/`isKnownBusinessError`; không file/record thứ hai; không thêm mã ngoài mục 12.
- **Completion**: `getErrorMessage(code)` trả đúng message cho cả 10 mã và **không** gọi `reportError`.

### M6-T7 — Dictionary tests
- **Objective**: mỗi mã mới có test riêng, kiểm tra hành vi quan sát được.
- **Exact location**: `shared/lib/error-messages.test.ts`, thêm `describe("Birth Profile error codes (§2.4)")` **bên trong** `describe("error-messages")` (dùng lại `beforeEach` với spy `reportError` sẵn có).
- **Implementation logic**: 10 `it`, mỗi `it`: `expect(getErrorMessage(CODE)).toBe(MESSAGE)`; `expect(isKnownBusinessError(CODE)).toBe(true)`; `expect(reportErrorSpy).not.toHaveBeenCalled()`. Không dùng `Object.keys(...).toContain`. Không sửa 2 test cũ.
- **Completion**: 10 test mới + test cũ pass.

### M6-T8 — 2 test page M5
- **Objective**: giữ test Create/Edit phản ánh đúng hành vi mới.
- **Exact location**: `new/page.test.tsx` (test lỗi tạo, assertion `findByText` ở dòng ~110), `edit/page.test.tsx` (test lỗi cập nhật, dòng ~143).
- **Implementation logic**: đổi expected text từ fallback sang message đã map của `VALIDATION_ERROR` (mục 12). Không đổi mock, không đổi cấu trúc test (D-11).
- **Completion**: 2 test pass với message mới.

### M6-T9 — Verification
Xem mục 14.

## 12. Error Code Mapping Matrix

**Toàn bộ §2.4 (9 mã) + 1 Correction (D-03) = 10 mã mới.** Message viết theo 2 vế "vấn đề → việc cần làm" cho mã lỗi input; không lộ chi tiết kỹ thuật (không nhắc ephemeris, IANA, INV-BP1, HTTP status, stack, DB/API).

| # | Error Code | Vietnamese Message | Existing/New | Source |
|---|---|---|---|---|
| 1 | `RESOURCE_NOT_FOUND` | Không tìm thấy nội dung bạn yêu cầu. Có thể nội dung đã bị xóa. | New | §2.4 (404) — wording trung tính, D-05 |
| 2 | `FORBIDDEN` | Bạn không có quyền thực hiện thao tác này. | New | §2.4 (403) — wording trung tính, D-05 |
| 3 | `VALIDATION_ERROR` | Thông tin bạn nhập chưa hợp lệ. Vui lòng kiểm tra lại. | New | §2.4 (422) — backend: label không hợp lệ (INV-BP2) |
| 4 | `INVALID_BIRTH_DATE` | Ngày sinh không hợp lệ. Vui lòng chọn một ngày có thật trong quá khứ. | New | §2.4 (422) — **ngữ nghĩa theo D-02**, không theo mô tả "ephemeris" của §2.4 |
| 5 | `INVALID_BIRTH_TIME_STATE` | Thông tin giờ sinh chưa nhất quán. Vui lòng nhập giờ sinh, hoặc đánh dấu là chưa rõ giờ sinh. | New | §2.4 (422) |
| 6 | `INVALID_LATITUDE_RANGE` | Vĩ độ của nơi sinh không hợp lệ. Vui lòng chọn lại nơi sinh. | New | §2.4 (422) |
| 7 | `INVALID_LONGITUDE_RANGE` | Kinh độ của nơi sinh không hợp lệ. Vui lòng chọn lại nơi sinh. | New | §2.4 (422) |
| 8 | `INVALID_TIMEZONE` | Múi giờ của nơi sinh không hợp lệ. Vui lòng chọn lại nơi sinh. | New | §2.4 (422) |
| 9 | `INVALID_BIRTH_LOCATION` | Thông tin nơi sinh không hợp lệ. Vui lòng tìm và chọn lại nơi sinh. | New | §2.4 (422) |
| 10 | `INVALID_BIRTH_TIME` | Giờ sinh không hợp lệ. Vui lòng nhập giờ từ 00:00 đến 23:59. | New | **Correction D-03** — backend `map-domain-error.ts`; không có trong §2.4 |

Không đổi (đã có, ngoài §2.4): `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `TOKEN_EXPIRED`, `UNAUTHORIZED`, `MALFORMED_REQUEST`.

Chủ ý không map (ngoài §2.4, ghi ở KG-05): `GEOCODING_PROVIDER_ERROR`, `INTERNAL_SERVER_ERROR`.

## 13. Testing Strategy

| Loại | Nội dung | Vì sao (rủi ro) |
|---|---|---|
| Component / navigation | `AppLayout.test.tsx`: link "Hồ sơ sinh" + `href` ở desktop landmark; link + `href` ở mobile landmark; bấm desktop → tới `/app/profiles`; bấm mobile → tới `/app/profiles` và drawer đóng | Hai khối markup độc lập (F-02) → mỗi khối có thể mất item riêng; drawer-stay-open là lỗi thật đã tái hiện (F-06) |
| Unit / dictionary | 10 `it` trong `error-messages.test.ts`, mỗi mã: message chính xác + `isKnownBusinessError` + không `reportError` | Chống typo key (R-04), chống nhầm message, khóa hợp đồng "mã đã biết không bị báo cáo" (F-10) |
| Regression | 5 test `AppLayout` cũ (chỉ đổi helper); 2 test page M5 (đổi expected text); toàn bộ suite | F-08 (5/5 sẽ fail nếu thiếu Router), F-11 |
| Không làm | Snapshot; assert class CSS; test thứ tự nav; test active-state; test `queryClient` mới; E2E mới | Không có rủi ro tương ứng / ngoài scope (Rule 6) |

Không đặt mục tiêu % coverage; số test mới = số hành vi/rủi ro ở trên.

## 14. Verification Commands

Chỉ dùng script có thật trong `frontend/package.json` (đã kiểm: `lint`, `format:check`, `typecheck`, `test`, `test:coverage`, `build`, `test:e2e`, …):

```bash
cd frontend
npm run typecheck
npx vitest run src/widgets/app-layout src/shared/lib src/pages/app/profiles
npm run test            # full suite, kỳ vọng: toàn bộ test M1–M5 giữ nguyên + test mới M6, 0 fail
npm run lint
npm run format:check
npm run build
```
Kiểm tra thủ công khi review: diff không chứa TODO/FIXME mới; không có import từ `@features/*` trong `widgets/app-layout`; các file trong mục 10 không xuất hiện trong diff. (`npm run test:e2e` cần backend thật — chạy trên CI G-05, không bắt buộc cục bộ.)

## 15. Definition of Done

### Navigation
- [ ] "Hồ sơ sinh" xuất hiện trên desktop sidebar
- [ ] "Hồ sơ sinh" xuất hiện trong mobile drawer
- [ ] Dùng `<Link>` của React Router (không `<a href>`, không `window.location`)
- [ ] Route đích là `/app/profiles`
- [ ] Bấm link ở mobile drawer đóng drawer
- [ ] Navigation test pass

### Error Dictionary
- [ ] 100% mã §2.4 (9 mã) được map, cộng `INVALID_BIRTH_TIME` nếu OQ-M6-1 được xác nhận (mặc định: có)
- [ ] Message tiếng Việt, đúng bảng mục 12
- [ ] Không duplicate logic (1 record, không sửa hàm)
- [ ] Test riêng cho từng mã mới pass

### Quality
- [ ] `npm run lint` pass · [ ] `npm run typecheck` pass · [ ] `npm run format:check` pass
- [ ] test liên quan + full suite pass (không mất/skip test nào) · [ ] `npm run build` pass

## 16. Acceptance Criteria

- **AC-1**: Render `AppLayout` → trong landmark "Điều hướng chính" có link tên "Hồ sơ sinh".
- **AC-2**: Trong landmark "Điều hướng chính (Mobile)" có link tên "Hồ sơ sinh".
- **AC-3**: Cả hai link là `<a>` do `Link` sinh ra với `href="/app/profiles"` (không phải `href="/"`).
- **AC-4**: Bấm link (desktop, và mobile sau khi mở drawer) → route hiển thị đích `/app/profiles`; ở mobile `mobileDrawerOpen` trở về `false`.
- **AC-5**: Với mỗi mã ở mục 12, `getErrorMessage(mã)` trả đúng message tương ứng.
- **AC-6**: Mỗi mã ở mục 12 có ít nhất 1 test tự động riêng; mã đã map không kích hoạt `reportError`.
- **AC-7**: Không regression: toàn bộ test M1–M5 pass (2 test page M5 chỉ đổi expected text), quality gates pass.

## 17. Exit Criteria

- [ ] Navigation hoàn chỉnh trên desktop và mobile
- [ ] Điều hướng `/app/profiles` được test xác nhận
- [ ] Toàn bộ mã §2.4 (kèm correction đã duyệt) đã map
- [ ] Test dictionary pass · [ ] Test AppLayout pass · [ ] Regression suite pass
- [ ] lint / typecheck / format:check / build pass
- [ ] Không TODO/FIXME mới chưa phân loại trong phạm vi M6
- [ ] Known Gaps KG-01…KG-08 được chuyển sang tài liệu đóng sprint (M8) — không sửa trong M6

## 18. Open Questions

**OQ-M6-1 — Có duyệt Correction §2.4 thêm `INVALID_BIRTH_TIME` không?**
- *Question*: prompt yêu cầu "không thêm mã ngoài §2.4", nhưng backend thật sự trả `INVALID_BIRTH_TIME` cho POST/PATCH (F-14) và §2.4 bỏ sót nó (lỗi của chính master plan). Có chấp nhận thêm mã thứ 10 như một erratum của §2.4?
- *Why it matters*: thiếu mã này thì lỗi giờ sinh ngoài khoảng (hiếm — native time input gần như chặn, nhưng vẫn là hợp đồng API thật) hiển thị fallback chung và bị báo cáo như lỗi lạ.
- *Blocking?* **Non-blocking.**
- *Recommended decision*: **Có** (D-03) — nguồn authoritative là backend.
- *Affected point*: mục 12 dòng 10; M6-T6; M6-T7 (1 test); DoD/AC. Nếu từ chối: xóa dòng 10, xóa 1 test, các phần còn lại không đổi.

## 19. Risk Analysis

| Risk | Mức | Mitigation |
|---|---|---|
| Thêm `<Link>` làm hỏng toàn bộ `AppLayout.test.tsx` (thiếu Router) | **High** nếu bỏ sót (đã tái hiện 5/5 fail) | T4 bước 1 bắt buộc; chạy `AppLayout.test.tsx` ngay sau T2/T3 |
| 2 test M5 fail sau khi map `VALIDATION_ERROR` | **High** nếu bỏ sót (đã xác định chính xác 2 assertion) | T8; chạy `src/pages/app/profiles` trong T9 |
| Mobile drawer không đóng sau điều hướng | Medium (đã tái hiện) | D-04 + test mobile trong T4 |
| Desktop/mobile lệch nhau (nav là 2 khối riêng) | Medium | Test riêng từng landmark (T4); KG-02 |
| Trùng lặp cấu hình nav (thêm item ở 2 nơi) | Low–Medium | Chấp nhận có chủ đích theo D-01; không refactor trong M6 |
| Thiếu/typo mã lỗi (`Record<string,string>` không bắt được key sai) | Medium | T5 grep đối chiếu enum backend; test explicit từng mã kiểm tra chuỗi chính xác |
| Lệch mã giữa §2.4 và backend | Medium | Đã xử lý bằng D-02/D-03 dựa trên backend authoritative; OQ-M6-1 |
| Message tiếng Việt sai ngữ cảnh (đặc biệt `RESOURCE_NOT_FOUND`/`FORBIDDEN` dùng chung với Chart; `INVALID_BIRTH_DATE` theo mô tả sai của §2.4) | Medium | D-05 (trung tính), D-02 (ngữ nghĩa theo code thật); PM/owner rà lại bảng mục 12 khi review |
| Vi phạm ranh giới kiến trúc (AppLayout import feature) | Low | D-08; review thủ công `widgets/app-layout` không import `@features/*` |
| Thêm mã làm đổi telemetry (không còn `reportError` cho 10 mã) | Low | Chủ đích và nhất quán với mã auth (F-10); test khóa hành vi |

## 20. Final Recommendation

1. **M6 có thể bắt đầu implementation ngay.** Không có blocker; OQ-M6-1 là xác nhận non-blocking (mặc định đã chọn, rollback rẻ).
2. **Dependency chưa giải quyết:** không có. M1–M5 đã CLOSED, `/app/profiles` đã tồn tại.
3. **Tài liệu cần update trước khi code:** không bắt buộc. Nên ghi erratum cho `Sprint_F3_Implementation_Plan.md` §2.4 (ngữ nghĩa `INVALID_BIRTH_DATE`; thiếu `INVALID_BIRTH_TIME`) trong tài liệu đóng sprint M8 (KG-08) thay vì sửa lặng lẽ.
4. **Dễ bị kéo vào M6 nhưng nằm ngoài scope:** sửa 2 link `<a href="/">` cũ; tách shared nav config / active-state / `aria-current`; thêm validation "ngày sinh phải ở quá khứ" phía client; chuyển các message tĩnh ở List/Edit/LocationSearchField sang dictionary; map `GEOCODING_PROVIDER_ERROR` / `INTERNAL_SERVER_ERROR`; đụng `queryClient`/Toast/observability; viết lại test page M5 ngoài 2 assertion.

### Known Gaps / Follow-up (chuyển sang M8, không làm trong M6)

| ID | Gap |
|---|---|
| KG-01 | 2 mục nav cũ dùng `<a href="/">`: reload toàn trang và trỏ sai đích "/" (nợ F1) |
| KG-02 | Nav trùng lặp giữa desktop/mobile; không có config chung; không active-state/`aria-current` |
| KG-03 | Message lỗi tĩnh ở List (tải lỗi, xóa lỗi), Edit (tải lỗi), LocationSearchField chưa dùng dictionary — `RESOURCE_NOT_FOUND`/`FORBIDDEN` đã có message sau M6 nhưng chưa được các nơi này dùng (M4 review đã hoãn việc này chờ M6) |
| KG-04 | Form M3 không validate "ngày sinh ở quá khứ" phía client và input date không có `max` → người dùng chỉ biết lỗi sau round-trip (nay ít nhất có message đúng ngữ nghĩa) |
| KG-05 | `GEOCODING_PROVIDER_ERROR` (location search upstream) và `INTERNAL_SERVER_ERROR` chưa map; `RATE_LIMIT_EXCEEDED` chỉ tồn tại trong enum, chưa được phát ra |
| KG-06 | Regex giờ (form và tầng HTTP backend) chấp nhận chữ số ngoài khoảng; chỉ value object mới từ chối → `INVALID_BIRTH_TIME` |
| KG-07 | (Tùy chọn) `e2e/birth-profile.spec.ts` vào `/app/profiles` bằng `page.goto`; có thể bổ sung 1 bước bấm link sidebar |
| KG-08 | Erratum cho master plan §2.4 (D-02, D-03) |
