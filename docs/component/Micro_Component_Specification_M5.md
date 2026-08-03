# Micro Component Specification — Sprint F1 Milestone M5

## Shared UI Library — Form Controls

**Phiên bản:** 1.0
**Trạng thái:** Draft — sẵn sàng làm hợp đồng kỹ thuật trước khi code hóa M5
**Dựa trên:** Frontend UI Specification §4, §9.2, §12.1 (Frozen), Design System Specification §10 (Frozen), Frontend Architecture Specification §9 (Frozen), Frontend Coding Standards, Sprint F1 Implementation Plan, kết quả nghiệm thu M1–M4
**Không thuộc phạm vi:** Code React/TypeScript/CSS, giá trị thị giác (đã có UI Spec §9), quy tắc quản trị chung (đã có Design System Spec §10) — tài liệu này là **hợp đồng kỹ thuật cấp component**, lớp trung gian giữa 2 tài liệu đó và code thật.

> **Ghi chú minh bạch**: Đề bài liệt "Sprint F1 M5 Implementation Plan" trong danh sách tài liệu nguồn — tài liệu đó **chưa tồn tại** trong phiên làm việc này (chưa được tạo hoặc cung cấp). Micro Component Spec này được xây dựng trực tiếp từ UI Spec/Design System Spec/Architecture Spec/Coding Standards (đã có đầy đủ), cộng với 2 quyết định đã chốt tường minh trong quá trình trao đổi trước đó của dự án (nhắc lại ở đúng chỗ liên quan): (1) `Button` không tách `IconButton`/`LinkButton` riêng, dùng `as` polymorphic đã có; (2) `Label` triển khai thành Primitive độc lập, được các Form Control khác compose bên trong. Nếu M5 Implementation Plan được tạo sau, cần đối chiếu ngược tài liệu đó với đây để đảm bảo nhất quán.

---

## Mục lục

0. [Shared Contracts (áp dụng mọi component dưới đây)](#0-shared-contracts)
1. [Button](#1-button)
2. [Input](#2-input)
3. [Textarea](#3-textarea)
4. [Select](#4-select)
5. [Checkbox](#5-checkbox)
6. [Radio](#6-radio)
7. [Switch](#7-switch)
8. [Label](#8-label)

---

## 0. Shared Contracts

> Mọi Micro Spec dưới đây **kế thừa mặc định** nội dung mục này — chỉ nêu lại khi có ngoại lệ. Đây là cách tránh lặp lại 8 lần cùng 1 nội dung nền tảng đã có sẵn ở Design System Spec §10.1 (Universal Component Contract), cụ thể hóa thêm 1 bậc cho riêng nhóm Form Control.

### 0.1. Non-responsibility dùng chung cho mọi Form Control

Không component nào trong 8 component dưới đây được:
- Tự gọi API, tự đọc/ghi TanStack Query cache, tự biết tới `features/*` (đúng ranh giới tầng Architecture Spec §9.2 — Composite/Primitive không tự fetch).
- Tự thực hiện validation nghiệp vụ (kiểm tra định dạng email hợp lệ, kiểm tra mật khẩu đủ mạnh...) — validation luôn là quyết định của Zod schema (Architecture Spec §7.5), component chỉ **hiển thị** kết quả validation đã có qua props (`error`/`invalid`), không tự tính toán nó.
- Tự quản lý giá trị nếu được dùng trong ngữ cảnh React Hook Form (`Controller`/`register`) — component phải hoạt động đúng ở cả 2 chế độ controlled (nhận `value`/`onChange` từ ngoài) và uncontrolled (tự quản lý qua `defaultValue`), nhưng **không bao giờ** tự quyết định chuyển đổi giữa 2 chế độ này (React tiêu chuẩn: cách dùng props quyết định chế độ, component không có logic đặc biệt).

### 0.2. State Baseline dùng chung (Design System Spec §10.1)

`default`, `hover`, `focus-visible`, `disabled` là 4 state tối thiểu bắt buộc cho mọi component có tương tác — chỉ nêu lại state **khác biệt/bổ sung** ở từng Micro Spec, không liệt lại 4 state này mỗi lần.

### 0.3. Token Usage dùng chung

Toàn bộ 8 component tuân thủ tuyệt đối: không hardcode giá trị (Coding Standards §7.1), chỉ dùng Semantic Token (không bao giờ Global Token trực tiếp — đúng nguyên tắc chống Semantic Leakage đã kiểm chứng lại vừa qua ở M4, khi `AppLayout` từng vi phạm chính điều này với `bg-midnight-900` và phải sửa lại thành `bg-overlay`). Mục "Design Token Usage" ở mỗi component chỉ liệt **nhóm token nào** được dùng, không liệt lại nguyên tắc này.

### 0.4. Testing Baseline dùng chung

Mỗi component bắt buộc: Component Test (Coding Standards §13.2, query ưu tiên `getByRole`/`getByLabelText`) + Accessibility Test (`vitest-axe`, Design System Spec §16.3, Definition of Done). Mục "Testing Surface" ở mỗi component chỉ liệt **kịch bản cụ thể** cần test, không lặp lại yêu cầu công cụ.

### 0.5. Performance Baseline dùng chung

Không component nào trong 8 component này cần `React.memo`/`useMemo`/`useCallback` mặc định (Architecture Spec §11.1 — chỉ thêm khi có lý do đo được cụ thể, ví dụ nằm trong danh sách lặp lớn). Cả 8 component đều là **leaf component** đơn lẻ (không tự lặp danh sách con) — điều kiện memoization của Architecture Spec §11.1 hầu như không áp dụng ở tầng Primitive này, chỉ có thể phát sinh sau ở tầng gọi chúng (ví dụ `PlanetTable` lặp nhiều `Input`, Sprint sau).

---

## 1. Button

### 1.1. Purpose

Kích hoạt 1 hành động rời rạc (submit, mở overlay) hoặc điều hướng (khi dùng như link). Giải quyết đúng 1 vấn đề: cung cấp **1 điểm chạm bấm được, nhất quán về hình thức và hành vi**, trên toàn hệ thống, để người dùng không phải học lại "cái này có bấm được không" ở từng màn hình. **Không bao giờ** được: tự chứa logic nghiệp vụ của hành động nó kích hoạt (Button không biết "submit thì làm gì", chỉ gọi `onClick`/`type="submit"` được truyền vào); tự quyết định điều hướng tới đâu (nhận `href`/route qua `as` + props, không tự import Router).

### 1.2. Component Boundary

- **Responsibilities**: render đúng hình thức (variant/size), phát sự kiện tương tác (`onClick`), thể hiện đúng trạng thái thị giác tương ứng props nhận vào (`isLoading`, `disabled`).
- **Non-responsibilities**: không biết kết quả của hành động nó kích hoạt (thành công/lỗi) — nếu cần hiện Toast sau khi bấm, đó là trách nhiệm của component gọi `Button`, không phải `Button` tự làm.
- **Forbidden responsibilities**: không bao giờ tự fetch, tự validate, tự điều hướng bằng `window.location`; không bao giờ chứa nội dung nghiệp vụ hardcode (ví dụ không có `variant="delete-chart"` — biến thể luôn theo vocabulary chung `primary/secondary/ghost/danger/link`, ý nghĩa nghiệp vụ "xóa chart" tới từ `label`/`onClick` do component cha truyền vào).
- **Lý do**: `Button` là Primitive dùng lại ở **mọi nơi** trong hệ thống — bất kỳ tri thức nghiệp vụ nào rò rỉ vào nó sẽ giới hạn khả năng tái sử dụng xuống còn đúng 1 use-case.

### 1.3. Public API Philosophy

- **Variants**: đúng 5 giá trị đã chốt UI Spec §9.2 (`primary`/`secondary`/`ghost`/`danger`/`link`) — đây là **toàn bộ từ vựng variant** dùng chung cho hệ thống (Design System Spec §10.1), không riêng Button.
- **Sizes**: 3 bậc (`sm`/`md`/`lg`). **Không có size thứ 4** — nhu cầu "icon-only" (nút chỉ chứa icon, không label) xử lý bằng **modifier trên 3 size sẵn có** (padding vuông thay vì bất đối xứng), không phải 1 size riêng biệt — quyết định đã chốt trong quá trình trao đổi trước đó của dự án.
- **States**: default/hover/focus-visible/active/loading/disabled (baseline mục 0.2 + `active`/`loading` riêng của Button).
- **Optional capabilities**: `leftIcon`/`rightIcon` (icon kèm label), `isLoading` (thay label bằng Spinner, giữ nguyên width — chống layout shift), `fullWidth`, `as` (polymorphic — render `<a>` khi dùng cho điều hướng).
- **Extension philosophy**: **không** có pattern `asChild` (kiểu Radix) — đã cân nhắc và quyết định không thêm, vì `as` đã giải quyết đúng nhu cầu polymorphic mà không cần 2 pattern làm cùng 1 việc trong hệ thống (vi phạm Consistency, Design System Spec §1.3 nếu có cả 2). API cố ý tối giản: 1 component, đúng 3 nhóm prop (variant/size/optional capability) — không tách `IconButton`/`LinkButton` thành component riêng (nhu cầu này đã cân nhắc và quyết định KHÔNG tách ở M5; chỉ tách khi có bằng chứng sử dụng thực tế cho thấy API hiện tại không đủ).

### 1.4. Composition Rules

- **Được compose bởi**: mọi Feature Component, mọi Layout Component (M4 — ví dụ nút "Thu gọn Sidebar" trong `AppLayout` lẽ ra nên dùng `Button variant="ghost"` thay vì `<button>` thuần như hiện trạng M4 — ghi nhận đây là cải tiến áp dụng khi `Button` sẵn sàng, không phải lỗi M4 vì `Button` chưa tồn tại lúc đó).
- **Được phép compose**: `Spinner` (khi `isLoading`), icon từ Lucide (`leftIcon`/`rightIcon` nhận `ReactNode`, thường là 1 icon Lucide do component cha truyền vào — `Button` không tự import icon cụ thể nào).
- **Forbidden composition**: `Button` không bao giờ chứa `Button` khác lồng bên trong (không có ý nghĩa — nút trong nút); không chứa `Input`/`Checkbox`/component tương tác khác (2 phần tử tương tác lồng nhau vi phạm HTML semantics, gây lỗi focus/click nghiêm trọng).
- **Ví dụ hợp lệ**: `Button` trong `Modal footer` (Card slot); `Button` như `children` của `Toast` (nút "Hoàn tác").
- **Ví dụ không hợp lệ**: `Button` chứa `Badge` làm toàn bộ nội dung mà không có text — nếu cần "nút chỉ có Badge", đây là dấu hiệu cần xem lại thiết kế, không phải composition hợp lệ của Design System.

### 1.5. State Model

| State | Kích hoạt khi | Chuyển tiếp |
|---|---|---|
| `default` | Không tương tác | → `hover` khi con trỏ vào, → `focus-visible` khi Tab tới |
| `hover` | Con trỏ chuột ở trên | → `active` khi nhấn giữ, → `default` khi rời chuột |
| `focus-visible` | Nhận focus qua bàn phím (không phải click chuột) | → `default` khi mất focus |
| `active` (pressed) | Đang nhấn giữ (mousedown/touchstart chưa nhả) | → `hover`/`default` khi nhả |
| `loading` | Prop `isLoading=true` | Chặn toàn bộ tương tác khác (không thể `hover`/`active`) cho tới khi `isLoading=false` |
| `disabled` | Prop `disabled=true` | Chặn toàn bộ tương tác, **không** nhận `focus-visible` (đúng hành vi HTML `disabled` gốc) |

`loading` và `disabled` **loại trừ lẫn nhau về mặt hiển thị** nhưng có thể cùng `true` (component cha có thể disable Button trong lúc loading để chặn double-submit) — khi cả 2 cùng `true`, hiển thị theo `loading` (Spinner) vì đây là thông tin quan trọng hơn với người dùng ngay lúc đó.

### 1.6. Accessibility Contract

- **Semantic HTML**: `<button>` thật (`type="button"` mặc định, `type="submit"` khi dùng trong form) — khi `as="a"`, chuyển thành `<a href>` thật, không giả lập bằng `<button onClick={() => navigate()}>`.
- **ARIA**: `aria-busy="true"` khi `isLoading` (Design System Spec §9.2); icon-only Button **bắt buộc** `aria-label` (không có text fallback nào khác cho screen reader).
- **Keyboard**: `Enter`/`Space` kích hoạt (hành vi gốc của `<button>`, không cần code thêm); khi `as="a"`, chỉ `Enter` kích hoạt (đúng hành vi gốc `<a>`, không thêm `Space` giả lập — không phá vỡ kỳ vọng chuẩn của người dùng bàn phím quen thao tác link).
- **Focus management**: `Button` không tự quản lý focus của phần tử khác — nếu bấm `Button` mở `Modal`, việc chuyển focus vào `Modal` là trách nhiệm của `Modal` (mục 0, nguyên tắc mỗi component chỉ quản lý phạm vi của chính nó).
- **Screen reader**: nội dung text/`aria-label` phải mô tả **hành động** (động từ), không mô tả hình thức ("Xóa biểu đồ", không phải "Nút màu đỏ").
- **Error announcement**: không áp dụng (Button không phải input, không có khái niệm lỗi riêng).
- **Label association**: không áp dụng (Button tự chứa label, không cần liên kết `<label>` ngoài).

### 1.7. Design Token Usage

Color (Semantic — `accent-primary`/`accent-secondary`/`danger`/`text-*`/`border-*` tùy variant), Typography (`text-body-md`/`font-ui`, weight `semibold`), Spacing (padding nội bộ theo size), Radius (`radius-sm`/`radius-md` theo size — Design System Spec §6.1, không đổi theo variant), Motion (`duration-fast`/`ease-standard` cho hover/active transition).

### 1.8. Responsive Behaviour

- **Thay đổi theo breakpoint**: `fullWidth` là **quyết định của component cha** (ví dụ Form action bar tự set `fullWidth` dưới `sm`, theo UI Spec §9.2) — `Button` **không tự** đổi hành vi theo breakpoint bên trong chính nó.
- **Không bao giờ đổi**: kích thước touch target tối thiểu 44×44px (Design System Spec §13.2) áp dụng ở **mọi** breakpoint, không chỉ mobile — kể cả `size="sm"` trên desktop vẫn cần đạt hit-area này qua padding vô hình nếu kích thước thị giác nhỏ hơn 44px.

### 1.9. Validation Behaviour

Không áp dụng — `Button` không phải input, không tham gia validate.

### 1.10. Testing Surface

Rendering (mỗi variant × size render đúng class); Variants (5 variant × 3 size = 15 tổ hợp, ít nhất smoke test từng variant); States (`isLoading` thay label bằng Spinner mà giữ nguyên width đo được — test đo `offsetWidth` trước/sau khi bật `isLoading`); Accessibility (`aria-busy`, icon-only bắt buộc có `aria-label` — test cố ý thiếu `aria-label` phải fail lint/type nếu có ràng buộc kiểu, hoặc test runtime cảnh báo); Keyboard (`Enter`/`Space` kích hoạt `onClick`, `as="a"` chỉ `Enter`); Composition (Button chứa `leftIcon` + `isLoading` đồng thời — xác nhận icon ẩn đúng khi loading, không hiện chồng lên Spinner); Responsive (không có breakpoint riêng, chỉ test `fullWidth` prop hoạt động đúng).

### 1.11. Performance Considerations

Theo baseline mục 0.5 — không memoization mặc định. Tránh tối ưu: không cần `useCallback` bọc `onClick` bên trong `Button` (nó chỉ forward event, không tạo closure nặng); không cần lazy-load `Spinner` import (component nhỏ, luôn cần sẵn khi `Button` tồn tại).

### 1.12. Future Extensibility

Có thể thêm `variant` mới (ví dụ `outline`, đã có trong từ vựng chung Design System Spec §10.1 nhưng chưa dùng ở Button) mà không phá API — chỉ thêm 1 key vào union type. `size="icon"` (modifier vuông, mục 1.3) là ứng viên rõ ràng nhất cho mở rộng gần nhất khi Sprint sau cần nút chỉ-icon lặp lại nhiều lần (ví dụ hành động trong `PlanetTable` row).

### 1.13. Definition of Done

- Đủ 5 variant × 3 size render đúng token, đúng cả 2 theme.
- `isLoading` không gây layout shift (đo được, không chỉ quan sát).
- Đạt đủ 6 tiêu chí Component Lifecycle Review (Design System Spec §16.3).
- Test bàn phím thủ công: Tab tới, `Enter`/`Space` kích hoạt, `disabled` không nhận focus.
- 0 vi phạm token hardcode (đối chiếu bài học M4: `Container`/`SkipLink` từng vi phạm điều này, cần rà soát kỹ hơn ở M5).

---

## 2. Input

### 2.1. Purpose

Nhập liệu văn bản 1 dòng. Giải quyết: thu thập 1 giá trị text/số/email/password... với hiển thị lỗi/helper nhất quán. **Không bao giờ**: tự validate định dạng (chỉ hiển thị `error` được truyền vào — mục 0.1); tự format lại giá trị khi gõ (không tự thêm dấu `-` vào số điện thoại lúc người dùng đang gõ — formatting, nếu cần, là trách nhiệm của component cha qua `onChange` xử lý trước khi set state).

### 2.2. Component Boundary

- **Responsibilities**: hiển thị đúng state (default/focus/error/success/disabled/readOnly), forward `value`/`onChange`/`onBlur` đúng ngữ nghĩa HTML gốc, hiển thị `label`/`helperText`/`errorText` đúng vị trí (Design System Spec §12.4).
- **Non-responsibilities**: không biết Input đang nằm trong React Hook Form hay không (hoạt động giống hệt ở cả 2 ngữ cảnh, mục 0.1).
- **Forbidden responsibilities**: không tự debounce `onChange` (nếu 1 use-case cần debounce — ví dụ tìm kiếm địa điểm, UI Spec §12.1 Birth Form — đó là logic ở tầng hook gọi `Input`, không phải hành vi mặc định của `Input`); không tự quản lý `id` ngẫu nhiên không kiểm soát được (mục 8, Label Association — `id` phải nhất quán, dùng `useId()` hoặc nhận từ props, không dùng `Math.random()`).

### 2.3. Public API Philosophy

- **Variants**: `default`, `filled` (UI Spec §9.2 — nền `surface` thay viền, dùng trong Card nền tối).
- **Sizes**: `sm`/`md`/`lg`.
- **States**: default/focus/disabled/readOnly/error/success (mục 2.5).
- **Optional capabilities**: `leftAdornment`/`rightAdornment` (icon hoặc unit — ví dụ "°"), `helperText`, `errorText`, `required`.
- **Extension philosophy**: `Input` **compose** `Label` bên trong (mục 3, quyết định đã chốt trước) — người dùng API vẫn truyền `label` như 1 prop phẳng (không đổi trải nghiệm dùng), nhưng nội bộ `Input` không tự vẽ label, nó render `<Label>` (mục 8) — tách logic label ra khỏi 6 Form Control khác nhau, tránh lặp code style label 6 lần.

### 2.4. Composition Rules

- **Được compose bởi**: mọi Form (React Hook Form `Controller`), Field wrapper (Sprint F1 Plan §7.4 M7, chưa tồn tại nhưng đã có kế hoạch).
- **Được phép compose**: `Label` (bắt buộc, nội bộ), icon Lucide (qua `leftAdornment`/`rightAdornment`, nhận `ReactNode` giống `Button`).
- **Forbidden composition**: không chứa `Button`/component tương tác khác bên trong (input lồng button gây lỗi focus nghiêm trọng); `Textarea`/`Select` **không** compose `Input` (dù cùng "kế thừa governance", đây là 3 component ngang hàng dùng chung pattern, không phải quan hệ cha-con — mục 3, 4 làm rõ thêm).
- **Ví dụ hợp lệ**: `Input` với `rightAdornment` là icon vị trí (Birth Form, UI Spec §12.1).
- **Ví dụ không hợp lệ**: 2 `Input` lồng nhau (vô nghĩa về DOM); `Input` chứa `Tooltip` như `children` (Tooltip không phải nội dung Input, phải đặt cạnh, không lồng bên trong).

### 2.5. State Model

| State | Kích hoạt khi | Ghi chú |
|---|---|---|
| `default` | Baseline | — |
| `focus` | Đang nhận input (khác `focus-visible` của Button — Input luôn hiện focus ring khi focus dù bằng chuột hay bàn phím, vì đang gõ text cần biết rõ đang ở đâu) |
| `disabled` | Không tương tác được, **không** gửi giá trị khi submit form |
| `readOnly` | Không sửa được nhưng **vẫn** gửi giá trị khi submit, vẫn focus/copy được — khác biệt quan trọng với `disabled` (Design System Spec §12.6) |
| `error` | `errorText` có giá trị | Viền `color-danger`, icon cảnh báo phải, `aria-invalid="true"` |
| `success` | Validate real-time xác nhận hợp lệ | Dùng có chọn lọc (ví dụ email hợp lệ ngay khi gõ xong), không mặc định mọi Input đều cần |

`error` và `success` loại trừ lẫn nhau (không thể cùng hiện) — `disabled` và `readOnly` cũng loại trừ lẫn nhau (2 khái niệm khác mục đích, không có tình huống hợp lệ nào cần cả 2 cùng lúc).

### 2.6. Accessibility Contract

- **Semantic HTML**: `<input>` thật, `type` đúng ngữ nghĩa (`text`/`email`/`password`/`tel`...) — không dùng `type="text"` cho mọi trường hợp rồi tự validate bằng tay (mất native validation UX của trình duyệt, ví dụ bàn phím số trên mobile cho `type="tel"`).
- **ARIA**: `aria-invalid="true"` khi `error` state; `aria-describedby` trỏ `id` của `errorText`/`helperText` (Design System Spec §9.2).
- **Keyboard**: hành vi gốc `<input>` (không cần code thêm) — Tab vào/ra, gõ trực tiếp.
- **Focus management**: `Input` không tự quản lý focus phần tử khác — nhưng khi submit lỗi (M7, Forms Foundation), `Input` phải **nhận được** `.focus()` gọi từ ngoài đúng cách (ref forward — `Input` phải `forwardRef` để `setFocus()` của React Hook Form hoạt động, đúng Design System Spec §13.2/M7 Plan §9.4).
- **Screen reader**: label + helper/error text đọc được theo đúng thứ tự (label → giá trị hiện tại → helper/error).
- **Error announcement**: `aria-live` **không** đặt trên chính `Input` (input không tự thay đổi nội dung động ngoài giá trị gõ) — nếu cần thông báo lỗi ngay khi xuất hiện, đó là trách nhiệm của `aria-describedby` (screen reader đọc khi focus vào field, không cần `aria-live` ngắt ngang).
- **Label association**: `<label htmlFor>` liên kết `id` của `<input>` — `id` **bắt buộc** ổn định qua các lần render (không đổi ngẫu nhiên), dùng `useId()` (React) hoặc nhận `id` từ props nếu component cha cần kiểm soát.

### 2.7. Design Token Usage

Color (Semantic — `border-subtle`/`border-strong`/`danger`/`success`/`text-muted` cho placeholder), Typography (`text-body-md`, `text-label` cho Label con), Spacing (padding nội bộ theo size), Radius (`radius-sm`), Motion (`duration-fast` cho border-color transition khi focus).

### 2.8. Responsive Behaviour

- **Thay đổi**: không có — `Input` luôn `width: 100%` của container cha (UI Spec §9.2), không có breakpoint riêng bên trong chính nó.
- **Không bao giờ đổi**: `font-size` tối thiểu 16px trên mobile là khuyến nghị ẩn (tránh iOS Safari tự động zoom khi focus input có font-size < 16px) — cần xác nhận `text-body-md` (15px, UI Spec §4.2) có đạt ngưỡng này không; nếu không, đây là rủi ro cần ghi nhận (mục 9, Risks tương lai) chứ không phải lý do đổi token đã đóng băng.

### 2.9. Validation Behaviour

- **Controlled validation**: `Input` nhận `error`/`errorText` như props thuần túy — không tự chạy bất kỳ rule nào.
- **Visual feedback**: đổi viền/icon theo `error`/`success` (mục 2.5) — tức thời, không animation phức tạp (chỉ `duration-fast` border-color, mục 2.7).
- **Error presentation**: đúng vị trí đã chốt Design System Spec §12.4 (dưới control, thay thế `helperText` khi cả 2 cùng tồn tại).
- **Interaction với form**: hoạt động đúng cả 2 chế độ (mục 0.1) — với React Hook Form, nhận `error` từ `formState.errors[name]?.message`, KHÔNG tự đọc `formState` (Input không biết gì về React Hook Form tồn tại hay không).

### 2.10. Testing Surface

Rendering (mỗi `type` × variant × size); Variants (`default`/`filled`); States (toàn bộ 6 state mục 2.5, đặc biệt `disabled` vs `readOnly` — test 2 hành vi khác nhau rõ ràng: `readOnly` vẫn có giá trị trong `FormData` khi submit, `disabled` thì không); Accessibility (`aria-invalid`/`aria-describedby` đúng khi có lỗi, `htmlFor`/`id` khớp); Keyboard (gõ, Tab, xác nhận `ref` forward hoạt động qua test gọi `.focus()` từ ngoài); Composition (Label render đúng bên trong, `leftAdornment` không chặn click vào input); Responsive (không áp dụng, ghi chú "N/A" tường minh thay vì bỏ trống).

### 2.11. Performance Considerations

Theo baseline mục 0.5. Tránh tối ưu: không debounce `onChange` mặc định trong `Input` (mục 2.2 — nếu cần, đó là quyết định của nơi gọi, không phải hành vi ẩn của Primitive — debounce ẩn bên trong Primitive sẽ gây bất ngờ khó debug cho mọi use-case không cần debounce).

### 2.12. Future Extensibility

Thêm `type` mới (ví dụ `type="search"` với icon kính lúp mặc định) không phá API hiện có. Biến thể `variant` mới nếu Design System mở rộng (Governance, Design System Spec §16) — không thiết kế trước ở M5.

### 2.13. Definition of Done

- 6 state + 2 variant × 3 size render đúng, cả 2 theme.
- `ref` forward hoạt động (`setFocus()` từ ngoài gọi được).
- `disabled` vs `readOnly` có hành vi khác biệt xác nhận được qua test (không chỉ khác giao diện).
- Đạt đủ Component Lifecycle Review (Design System Spec §16.3).

---

## 3. Textarea

> `Textarea` kế thừa **toàn bộ** hợp đồng của `Input` (mục 2) trừ những điểm khác biệt nêu dưới đây — không lặp lại nội dung giống hệt.

### 3.1. Purpose

Nhập liệu văn bản nhiều dòng (ghi chú cá nhân cho chart, phản hồi — UI Spec §12 ví dụ). Cùng nguyên tắc "không tự validate/không tự format" như `Input` (mục 2.1).

### 3.2. Component Boundary

Giống hệt `Input` (mục 2.2) — bổ sung: **không** tự giới hạn số ký tự người dùng gõ được (nếu có `maxLength`, dùng thuộc tính HTML gốc `maxLength`, trình duyệt tự chặn — `Textarea` không tự viết logic chặn ký tự thứ N+1 bằng JS).

### 3.3. Public API Philosophy

Kế thừa `label`/`helperText`/`errorText`/`disabled` từ `Input` — thêm riêng: `rows` (thay `size`, kích thước Textarea xác định qua số dòng chứ không phải bậc `sm`/`md`/`lg` như Input — UI Spec §9.2 xác nhận "không có size preset riêng, điều khiển qua `rows`"), `autoResize` (boolean), `maxLength` (kèm counter hiển thị).

### 3.4. Composition Rules

Giống `Input` — bổ sung: khi có `maxLength`, `Textarea` compose thêm 1 khối counter nhỏ (`X/500 ký tự`) hiển thị góc dưới — counter này không phải component riêng, chỉ là đoạn text nội bộ.

### 3.5. State Model

Giống hệt `Input` (mục 2.5) — không có state riêng biệt nào khác.

### 3.6. Accessibility Contract

Giống `Input` (mục 2.6) — bổ sung: counter ký tự (mục 3.3) dùng `aria-live="polite"` (Design System Spec §12.1 gốc "khi gần đạt giới hạn, screen reader cần được thông báo") — đây là **ngoại lệ duy nhất** trong toàn bộ 8 component có `aria-live` trên phần tử phụ trợ (không phải chính control) — cần chú ý khi implement, dễ quên vì khác pattern các component khác.

### 3.7. Design Token Usage

Giống hệt `Input` (mục 2.7).

### 3.8. Responsive Behaviour

Khác biệt duy nhất với `Input`: `autoResize=true` **mặc định** trên `xs`/`sm` (mobile) để tránh scroll lồng nhau trong viewport nhỏ (UI Spec §9.2) — đây là **hành vi responsive tự động duy nhất** trong nhóm 8 component (mọi component khác không tự đổi hành vi theo breakpoint bên trong chính nó, mục 2.8/1.8).

### 3.9. Validation Behaviour

Giống hệt `Input` (mục 2.9).

### 3.10. Testing Surface

Giống `Input` (mục 2.10) — bổ sung riêng: `maxLength` + counter cập nhật đúng số khi gõ, `aria-live` kích hoạt đúng lúc gần giới hạn (ví dụ còn 10% dung lượng — ngưỡng cụ thể để lại quyết định implementation, không chốt cứng ở tài liệu hợp đồng này); `autoResize` hoạt động đúng dưới `sm`.

### 3.11. Performance Considerations

Giống `Input` (mục 2.11) — lưu ý riêng: `autoResize` tính lại chiều cao mỗi lần gõ — không dùng `useEffect` + đo DOM mỗi keystroke nếu tránh được (ưu tiên CSS `field-sizing`/kỹ thuật thuần CSS nếu trình duyệt hỗ trợ đủ rộng tại thời điểm code hóa, tránh JS đo lường lại toàn bộ mỗi phím gõ — quyết định kỹ thuật cụ thể để lại cho lúc implement, chỉ nêu nguyên tắc ưu tiên CSS trước JS).

### 3.12. Future Extensibility

Giống `Input` (mục 2.12).

### 3.13. Definition of Done

Giống `Input` (mục 2.13) — bổ sung: `autoResize` + `maxLength` counter xác nhận hoạt động đúng qua test riêng.

---

## 4. Select

### 4.1. Purpose

Chọn 1 giá trị từ danh sách (Quốc gia, Múi giờ sinh, ngôn ngữ — UI Spec §9.2). Giải quyết: chọn lựa từ danh sách dài hơn mức `Radio` hợp lý xử lý được (Radio phù hợp ≤ 4-5 lựa chọn hiển thị hết, Select phù hợp danh sách dài cần thu gọn). **Không bao giờ**: tự fetch danh sách `options` (luôn nhận qua props, component cha chịu trách nhiệm lấy dữ liệu — kể cả khi options tới từ API); tự lưu lịch sử lựa chọn gần đây (không có "recent searches" ẩn bên trong Primitive).

### 4.2. Component Boundary

- **Responsibilities**: hiển thị danh sách, xử lý chọn, xử lý tìm kiếm nội bộ (khi `searchable`), đóng/mở đúng hành vi Overlay chuẩn.
- **Non-responsibilities**: không quyết định `options` tới từ đâu (props thuần); không tự debounce khi gõ tìm kiếm nếu danh sách tới từ API (đó là trách nhiệm hook gọi `Select`, tương tự nguyên tắc `Input` mục 2.2).
- **Forbidden responsibilities**: không tự viết lại cơ chế positioning riêng — dùng chung 1 engine với `Popover`/`Dropdown`/`Tooltip` (Architecture Spec §9.5, dù các Overlay đó chưa tồn tại tới M6 — `Select` **chuẩn bị trước** phần dropdown positioning theo cách tách được để M6 tái sử dụng, không viết cách riêng biệt sẽ phải bỏ đi sau).

### 4.3. Public API Philosophy

- **Variants**: `default` (custom dropdown), `native` (dùng `<select>` gốc hệ điều hành trên mobile — UI Spec §9.2, "tận dụng UI hệ điều hành cho danh sách đơn giản").
- **Sizes**: `sm`/`md`/`lg`.
- **States**: default/open/focus/disabled/error/empty (không có kết quả tìm kiếm).
- **Optional capabilities**: `searchable` (bật ô tìm kiếm khi > 8 option — ngưỡng cụ thể từ UI Spec §9.2), `clearable`, `placeholder`.
- **Extension philosophy**: `Select` là component **duy nhất trong 8 component được phép tồn tại ở 2 hình thái hiển thị khác nhau tùy nền tảng** (`native` mobile / custom desktop, Design System Spec §10.3 đã ghi nhận đây là ngoại lệ có chủ đích với nguyên tắc "1 component = 1 hình thái"). API vẫn là **1 component duy nhất** (không tách `NativeSelect`/`CustomSelect`) — logic chọn hình thái nằm **bên trong** `Select`, không phải trách nhiệm của component cha quyết định.

### 4.4. Composition Rules

- **Được compose bởi**: Form (giống `Input`).
- **Được phép compose**: `Label` (nội bộ, giống `Input`), phần dropdown list — khi `searchable`, dropdown chứa 1 `Input` nội bộ ẩn danh (không phải `Input` component công khai lồng vào, để tránh 2 lớp label/error chồng chéo — dropdown search box là 1 input thuần, không phải instance của `Input` Primitive).
- **Forbidden composition**: `Select` không chứa `Select` khác lồng nhau; danh sách item bên trong **không** dùng `Checkbox` (Select là single-choice theo đúng phạm vi UI Spec §9.2 — multi-select không nằm trong scope M5, xem mục 12).
- **Ví dụ hợp lệ**: `Select searchable` cho Múi giờ sinh (UI Spec §12.1 Birth Form).
- **Ví dụ không hợp lệ**: dùng `Select` cho danh sách ≤ 3 lựa chọn cố định luôn hiển thị hết được — đó là use-case của `Radio` (Design System Spec composition boundary), không phải `Select`.

### 4.5. State Model

| State | Kích hoạt khi | Ghi chú |
|---|---|---|
| `default` | Baseline | — |
| `open` | Dropdown đang mở | Chỉ áp dụng variant `default` — `native` không có state `open` riêng (trình duyệt tự quản lý UI native) |
| `focus` | Nhận focus, chưa mở | — |
| `disabled` | Không tương tác | — |
| `error` | `errorText` có giá trị | Kế thừa pattern `Input` |
| `empty` | `searchable`, không có kết quả khớp | Hiển thị text "Không tìm thấy kết quả" trong dropdown, không phải lỗi field |

### 4.6. Accessibility Contract

- **Semantic HTML**: variant `native` dùng `<select>` thật (kế thừa toàn bộ hành vi/accessibility gốc trình duyệt, không cần code thêm gì). Variant `default` **không có** phần tử HTML gốc tương đương đủ mạnh — bắt buộc dùng ARIA Combobox Pattern đầy đủ.
- **ARIA (variant `default`)**: tuân theo [ARIA Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) khi `searchable=true` (UI Spec §9.2) — `role="combobox"`, `aria-expanded`, `aria-controls` trỏ tới `id` danh sách, `aria-activedescendant` theo item đang highlight bằng bàn phím.
- **Keyboard (variant `default`)**: mũi tên lên/xuống di chuyển highlight, `Enter` chọn, `Esc` đóng không chọn, gõ ký tự nhảy tới option khớp chữ cái đầu (khi không `searchable`) — đầy đủ theo UI Spec §9.2.
- **Focus management**: đóng dropdown trả focus về chính `Select` trigger (không rơi ra ngoài) — theo đúng nguyên tắc Design System Spec §14.3 "Focus không bao giờ biến mất".
- **Screen reader**: label + giá trị đã chọn đọc được; khi `searchable`, số lượng kết quả tìm được nên thông báo qua `aria-live="polite"` trong vùng danh sách (tương tự counter của `Textarea`, mục 3.6 — cùng pattern, khác vị trí áp dụng).
- **Error announcement**: giống `Input` (`aria-describedby`).
- **Label association**: giống `Input`.

### 4.7. Design Token Usage

Color (giống `Input`, thêm `bg-surface-raised` + `shadow-level-1` cho dropdown panel — Design System Spec §7.1), Typography (giống `Input`), Spacing/Radius (giống `Input` + `radius-md` cho dropdown panel), Z-index (`z-dropdown`, UI Spec §16.3 — token duy nhất trong nhóm Form Control cần Z-index, vì là Overlay).

### 4.8. Responsive Behaviour

- **Thay đổi**: variant tự chọn `native` trên mobile / `default` trên desktop **là chính hành vi responsive cốt lõi** của component này (khác mọi component khác trong M5, nơi responsive chỉ là chi tiết phụ). `searchable=true` bắt buộc mở dạng full-screen sheet trên mobile thay vì dropdown nhỏ (UI Spec §9.2) — đây là thay đổi **cấu trúc hiển thị**, không chỉ đổi kích thước.
- **Không bao giờ đổi**: hành vi chọn giá trị (logic nghiệp vụ) giống hệt bất kể breakpoint — chỉ hình thức trình bày đổi.

### 4.9. Validation Behaviour

Giống `Input` (mục 2.9) — không có gì khác biệt về nguyên tắc, chỉ khác cách hiển thị lỗi (viền dropdown trigger thay vì viền input text).

### 4.10. Testing Surface

Rendering (2 variant × 3 size); States (6 state, đặc biệt `empty` khi search không khớp); Accessibility (ARIA Combobox pattern đầy đủ — đây là component phức tạp accessibility nhất trong 8 component, cần review kỹ nhất); Keyboard (đầy đủ chuỗi tương tác: mở bằng Enter/Space/mũi tên xuống, di chuyển, chọn, đóng bằng Esc không đổi giá trị); Composition (search box nội bộ không xung đột với `Label` ngoài); Responsive (chuyển `native`↔`default` đúng theo breakpoint qua Viewport Test — Component Test/jsdom không đủ để xác nhận variant nào thực sự active, cần Playwright giống cách M4 đã làm cho Sidebar↔Drawer).

### 4.11. Performance Considerations

Danh sách `options` dài (ví dụ danh sách Múi giờ, hàng trăm entry) — cân nhắc virtualization **chỉ khi đo được cần thiết** (Architecture Spec §11.1, không mặc định thêm thư viện virtualization ở M5 nếu chưa có bằng chứng danh sách thật đủ dài gây giật).

### 4.12. Future Extensibility

Multi-select (chọn nhiều giá trị) **không** thuộc phạm vi M5 — nếu cần sau, đây là ứng viên Component Lifecycle mới (`MultiSelect`, không mở rộng `Select` hiện tại thành 2 chế độ single/multi trong cùng API, vì thay đổi shape giá trị trả về — string vs array — là breaking change lớn hơn 1 optional prop, Design System Spec §16 Propose bắt buộc trả lời "component hiện có có đủ không").

### 4.13. Definition of Done

- 2 variant × 3 size × 6 state render đúng, cả 2 theme.
- ARIA Combobox Pattern đầy đủ, kiểm chứng bằng `vitest-axe` + review thủ công (không chỉ tin automated test).
- Chuyển đổi `native`↔`default` đúng breakpoint, xác nhận bằng Playwright thật.
- Focus không bao giờ "biến mất" khi đóng dropdown bằng bất kỳ cách nào (click ngoài, `Esc`, chọn giá trị).

---

## 5. Checkbox

### 5.1. Purpose

Lựa chọn nhị phân **độc lập**, là 1 phần của form chờ submit (khác `Switch`, mục 7 — ranh giới quan trọng nhất giữa 2 component này). Ví dụ: "Ghi nhớ đăng nhập", "Đồng ý điều khoản" (UI Spec §10.2). **Không bao giờ**: gây hiệu lực ngay lập tức khi tích (nếu 1 tick-box cần hiệu lực ngay, đó là `Switch`, không phải `Checkbox` — dùng sai component ở đây là lỗi composition, không phải lỗi thẩm mỹ, Design System Spec §10.3).

### 5.2. Component Boundary

- **Responsibilities**: hiển thị đúng state (checked/unchecked/indeterminate/disabled), forward `checked`/`onChange`.
- **Non-responsibilities**: không tự submit form khi tích (đó là hành vi của nút Submit riêng biệt, Checkbox chỉ đổi giá trị của chính nó).
- **Forbidden responsibilities**: không tự động gọi side-effect nào khi tích (ví dụ không tự lưu localStorage khi tích "Ghi nhớ đăng nhập" — đó là component cha xử lý qua `onChange`).

### 5.3. Public API Philosophy

- **Variants**: 1 variant hình ảnh duy nhất (UI Spec §9.2 — không có biến thể màu, luôn dùng `accent-secondary` khi checked).
- **Sizes**: `md` (mặc định, 18px box), `sm` (16px, dùng trong bảng dày đặc — chưa cần thiết ở M5 vì chưa có `PlanetTable`, nhưng chuẩn bị sẵn theo UI Spec §9.2).
- **States**: unchecked/checked/indeterminate/disabled (mục 5.5).
- **Optional capabilities**: `description` (text phụ dưới label, UI Spec §9.2).
- **Extension philosophy**: API tối giản nhất trong 8 component — chỉ `checked`/`onChange`/`indeterminate`/`disabled`/`label`/`description`, không có gì tùy biến thêm (đúng bản chất — Checkbox không cần linh hoạt cao, mọi Checkbox trong hệ thống nên trông/hoạt động giống hệt nhau).

### 5.4. Composition Rules

- **Được compose bởi**: Form, danh sách item cần chọn nhiều (Sprint sau — ví dụ chọn nhiều House System để so sánh, UI Spec §9.2).
- **Được phép compose**: `Label` (nội bộ).
- **Forbidden composition**: `Checkbox` không chứa `Checkbox` khác; không dùng thay `Switch` dù về mặt hình ảnh "trông tương tự" (mục 5.1 — đây là composition sai theo ngữ nghĩa dù có thể "chạy được" về mặt kỹ thuật).
- **Ví dụ hợp lệ**: "Tôi đồng ý Điều khoản" trong `AuthLayout` (M4) form Register.

### 5.5. State Model

| State | Kích hoạt khi | Chuyển tiếp |
|---|---|---|
| `unchecked` | Mặc định | → `checked` khi click/Space |
| `checked` | Đã tích | → `unchecked` khi click/Space lần nữa |
| `indeterminate` | Set qua thuộc tính DOM (không phải attribute HTML — đặc thù kỹ thuật của checkbox, cần lưu ý khi implement) | Chỉ dùng cho "chọn tất cả" cha khi con chọn 1 phần — click vào `indeterminate` luôn chuyển thẳng sang `checked` (không quay lại `unchecked`), đúng hành vi chuẩn UX |
| `disabled` | Không tương tác | Có thể kết hợp với bất kỳ state nào ở trên (checked+disabled hợp lệ — hiện trạng thái đã chọn nhưng khóa không cho đổi) |

### 5.6. Accessibility Contract

- **Semantic HTML**: `<input type="checkbox">` thật, ẩn dưới lớp style tùy biến (Design System Spec §14.4 — "First Rule of ARIA", dùng gốc trước) — **không** dùng `<div role="checkbox">` trừ khi có lý do bắt buộc (không có ở M5).
- **ARIA**: `aria-checked` tự động từ `checked` (native), `indeterminate` set qua DOM property `element.indeterminate = true` (không có attribute HTML tương đương, phải set bằng JS/ref).
- **Keyboard**: `Space` toggle (hành vi gốc, không cần code); Tab vào/ra bình thường.
- **Focus management**: không áp dụng (không mở overlay/thay đổi nội dung trang).
- **Screen reader**: label đọc kèm trạng thái ("đã chọn"/"chưa chọn"/"một phần") — hành vi gốc `<input type="checkbox">` đã xử lý đúng, không cần thêm.
- **Label association**: `<label>` bọc hoặc `htmlFor` — hit-area 44×44px bắt buộc kể cả khi box thị giác 18px (Design System Spec §10.3, baseline chung cho mọi control chọn nhỏ — mục 6.6/7.6 nhắc lại).

### 5.7. Design Token Usage

Color (`accent-secondary` khi checked — **không phải** `accent-primary`, đúng UI Spec §9.2 "luôn dùng `color-accent-secondary` cố định"), Spacing (hit-area padding vô hình), Radius (`radius-sm` cho box vuông bo góc nhẹ).

### 5.8. Responsive Behaviour

Không đổi theo breakpoint — chỉ hit-area 44×44px là yêu cầu **không đổi ở mọi breakpoint** (mục 0, baseline Design System Spec §13.2), không phải hành vi "responsive" theo nghĩa thay đổi qua breakpoint.

### 5.9. Validation Behaviour

Hiếm khi cần (Checkbox thường không có khái niệm "lỗi" — ngoại lệ: "Đồng ý điều khoản" bắt buộc tích mới submit được, lỗi hiển thị dạng `Alert`/text bên dưới nhóm Checkbox, không phải trong chính `Checkbox`, vì `Checkbox` không có `errorText` prop trong API đã chốt mục 5.3).

### 5.10. Testing Surface

Rendering (2 size); States (4 state, đặc biệt `indeterminate` set qua DOM property test đúng cách — không test qua attribute); Accessibility (label liên kết đúng, hit-area đo được ≥ 44px); Keyboard (`Space` toggle, không phải `Enter` — dễ nhầm với Button); Composition (trong danh sách nhiều Checkbox, mỗi cái độc lập không ảnh hưởng nhau trừ khi component cha tự quản lý logic "chọn tất cả").

### 5.11. Performance Considerations

Theo baseline mục 0.5.

### 5.12. Future Extensibility

Không dự kiến mở rộng API — đây là component ổn định nhất, ít khả năng cần biến thể mới.

### 5.13. Definition of Done

- 2 size × 4 state render đúng, cả 2 theme.
- `indeterminate` set/đọc đúng qua DOM property (test riêng, không nhầm attribute).
- Hit-area ≥ 44×44px đo được, kể cả `size="sm"`.

---

## 6. Radio

### 6.1. Purpose

Chọn **đúng 1** trong nhiều lựa chọn loại trừ nhau, hiển thị hết toàn bộ lựa chọn cùng lúc (khác `Select` — mục 4, dùng khi danh sách dài cần thu gọn). Ví dụ: House System Placidus/Whole Sign (UI Spec §9.2). **Không bao giờ**: cho phép không lựa chọn nào sau khi 1 nhóm đã có lựa chọn mặc định (khác `Checkbox` — 1 khi đã chọn trong nhóm Radio, luôn có đúng 1 lựa chọn active, không quay về "không gì được chọn" trừ khi component cha chủ động reset).

### 6.2. Component Boundary

- **Responsibilities**: quản lý nhóm lựa chọn loại trừ nhau, forward `value`/`onChange` cho cả nhóm (không phải từng radio riêng lẻ — API ở cấp nhóm, khác `Checkbox` ở cấp từng item).
- **Non-responsibilities**: không tự quyết định lựa chọn mặc định nào được chọn sẵn (component cha truyền `value` ban đầu).
- **Forbidden responsibilities**: không cho phép 2 nhóm `Radio` khác nhau vô tình dùng chung `name` (gây xung đột hành vi loại trừ ở cấp trình duyệt) — `name` **bắt buộc** là prop, không có giá trị mặc định ngầm định trùng nhau.

### 6.3. Public API Philosophy

- **Variants**: `default` (radio tròn chuẩn), `card` (mỗi option là 1 Card có viền, UI Spec §9.2 — dùng cho lựa chọn quan trọng như House System).
- **Sizes**: `md`/`sm`.
- **States**: giống `Checkbox` (unchecked/checked/disabled) + `selected` riêng cho variant `card` (viền nổi bật hơn khi chọn).
- **Optional capabilities**: `orientation` (`vertical`/`horizontal`), mỗi option có `description` tùy chọn.
- **Extension philosophy**: API ở **cấp nhóm** (`RadioGroup`-style, nhận `options` array + `value`/`onChange` chung), không phải từng `Radio` item riêng lẻ tự quản lý state — quyết định này giảm khả năng lỗi (không thể có 2 radio "cùng chọn" do lỗi implement từng item riêng biệt, vì chỉ có 1 nguồn `value` duy nhất cho cả nhóm).

### 6.4. Composition Rules

- **Được compose bởi**: Form.
- **Được phép compose**: `Label` (cho từng option + cho tiêu đề nhóm), `Card` (nội bộ, chỉ khi `variant="card"` — đây là ví dụ cụ thể "Component Token" theo Design System Spec §2.1, Semantic không đủ nên thêm biến thể riêng).
- **Forbidden composition**: các `Radio` item trong cùng 1 nhóm không được render rời rạc ở 2 vị trí khác nhau trên trang (phá vỡ khái niệm "nhóm" — nếu cần tách vị trí hiển thị, đó không còn là 1 `RadioGroup`, cần thiết kế lại).
- **Ví dụ hợp lệ**: Chọn House System dạng `variant="card"` (UI Spec §9.2).

### 6.5. State Model

Giống `Checkbox` (mục 5.5) nhưng ở cấp nhóm — không có `indeterminate` (không có ý nghĩa với Radio, luôn đúng 1 lựa chọn hoặc không lựa chọn nào, không có khái niệm "1 phần"). Thêm `selected` cho variant `card` (mục 6.3).

### 6.6. Accessibility Contract

- **Semantic HTML**: mỗi option là `<input type="radio">` thật, cùng `name` (mục 6.2).
- **ARIA**: nhóm bọc `role="radiogroup"` + `aria-labelledby` trỏ tới tiêu đề nhóm (UI Spec §9.2 — ví dụ "Hệ thống nhà").
- **Keyboard**: mũi tên lên/xuống (hoặc trái/phải nếu `orientation="horizontal"`) di chuyển giữa các option **và tự động chọn luôn** (hành vi gốc HTML radio group — khác Checkbox, di chuyển = chọn, không cần `Enter`/`Space` riêng); `Tab` chỉ dừng ở **1** điểm cho cả nhóm (radio đang được chọn, hoặc option đầu nếu chưa chọn gì) — hành vi gốc trình duyệt.
- **Focus management**: không áp dụng thêm (hành vi gốc đã đúng).
- **Hit-area**: 44×44px tối thiểu, giống `Checkbox` (mục 5.6, baseline chung).
- **Label association**: mỗi option có `<label>` riêng, cả nhóm có `aria-labelledby` riêng (2 tầng label — dễ nhầm lẫn khi implement, cần chú ý).

### 6.7. Design Token Usage

Giống `Checkbox` (mục 5.7) — biến thể `card` thêm `border-subtle`/`border-strong` (viền Card) + `shadow` nếu variant Card raised được dùng.

### 6.8. Responsive Behaviour

- **Thay đổi**: `orientation` **tự động chuyển `horizontal → vertical` dưới `sm`** bất kể prop truyền vào, **trừ khi chỉ có 2 option** (UI Spec §9.2 — ngoại lệ cụ thể cần nhớ, dễ implement sai nếu bỏ qua điều kiện "trừ khi 2 option").
- **Không bao giờ đổi**: hit-area tối thiểu (giống mọi control chọn nhỏ).

### 6.9. Validation Behaviour

Tương tự `Checkbox` — lỗi (ví dụ "bắt buộc chọn 1 House System") hiển thị bên ngoài nhóm, không phải prop riêng của từng `Radio` item.

### 6.10. Testing Surface

Rendering (2 variant × 2 size); States (bao gồm `selected` riêng variant `card`); Accessibility (`radiogroup` + `aria-labelledby` đúng, chỉ 1 `Tab` stop cho cả nhóm); Keyboard (mũi tên di chuyển VÀ chọn cùng lúc — test riêng biệt với `Checkbox`'s `Space`-only pattern, dễ viết test sai nếu copy từ Checkbox); Composition (variant `card` render đúng `Card` bên trong); Responsive (orientation auto-switch dưới `sm`, trừ trường hợp 2 option — test riêng ngoại lệ này).

### 6.11. Performance Considerations

Theo baseline mục 0.5 — nhóm nhiều option (> 10) vẫn là leaf-level component, không cần virtualization ở quy mô Form thông thường.

### 6.12. Future Extensibility

Thêm variant hiển thị mới (ví dụ dạng button-group ngang) có thể cần nếu Sprint sau có nhu cầu — chưa thiết kế trước.

### 6.13. Definition of Done

- 2 variant × 2 size × state render đúng, cả 2 theme.
- `orientation` auto-switch dưới `sm` đúng, kể cả ngoại lệ 2-option.
- Keyboard: mũi tên di chuyển = chọn (test riêng, không lẫn với Checkbox).
- Chỉ 1 `Tab` stop/nhóm xác nhận qua test.

---

## 7. Switch

### 7.1. Purpose

Bật/tắt 1 cài đặt có **hiệu lực ngay lập tức**, không cần nút Submit riêng (UI Spec §9.2 — ví dụ Dark Mode toggle, đã dùng thật ở M3 `verify/page.tsx`). Ranh giới quan trọng nhất (nhắc lại từ mục 5.1): `Switch` = hiệu lực ngay; `Checkbox` = chờ submit. **Không bao giờ**: dùng trong ngữ cảnh form chờ submit (nếu 1 field cần chờ Submit mới có hiệu lực, đó là `Checkbox`, dùng `Switch` ở đây là composition sai).

### 7.2. Component Boundary

- **Responsibilities**: hiển thị on/off, forward `checked`/`onChange`, hiển thị `loading` khi hành động cần gọi API (mục 7.5 — điểm khác biệt lớn với `Checkbox`, vì hiệu lực ngay thường gắn với side-effect thật).
- **Non-responsibilities**: không tự gọi API khi toggle — `onChange` chỉ báo ý định, component cha (đã có ở M3 thật: `preferenceStore.setPreference`) quyết định gọi gì.
- **Forbidden responsibilities**: không tự optimistic-update rồi tự rollback nếu lỗi (đó là logic của nơi gọi `Switch`, ví dụ TanStack Query mutation xử lý optimistic update, `Switch` chỉ nhận `checked` mới nhất sau khi state cha đã quyết định).

### 7.3. Public API Philosophy

- **Variants**: 1 variant hình ảnh (UI Spec §9.2).
- **Sizes**: `sm` (32×18px track), `md` (40×22px, mặc định).
- **States**: off/on/disabled/loading (mục 7.5).
- **Optional capabilities**: `label`, `labelPosition` (`left`/`right`).
- **Extension philosophy**: tối giản như `Checkbox` — không thêm biến thể màu/hình dạng, vì mọi `Switch` trong hệ thống nên đồng nhất tuyệt đối (đã có tiền lệ thật: `ThemeProvider`/`preferenceStore`, M3, chứng minh API tối giản này đã đủ dùng cho use-case thật đầu tiên).

### 7.4. Composition Rules

- **Được compose bởi**: `Settings` page (Sprint sau), Navbar (Theme toggle, M3 đã demo bằng `<button>` thuần vì `Switch` chưa tồn tại — tương tự ghi chú `Button` mục 1.4, đây là cải tiến áp dụng khi `Switch` sẵn sàng).
- **Được phép compose**: `Label` (khi có `label`), `Spinner` nhỏ trong knob khi `loading` (UI Spec §9.2 — "dot xoay nhỏ trong knob").
- **Forbidden composition**: không dùng thay `Checkbox` (mục 7.1); không lồng `Switch` trong `Switch`.
- **Ví dụ hợp lệ**: Toggle Dark Mode trong Navbar (`size="sm"`, không label hiển thị nhưng có `aria-label`, đúng UI Spec §9.2 — ví dụ cụ thể đã có trong tài liệu gốc).

### 7.5. State Model

| State | Kích hoạt khi | Ghi chú |
|---|---|---|
| `off` | Mặc định tắt | → `on` khi toggle |
| `on` | Đã bật | → `off` khi toggle lần nữa |
| `disabled` | Không tương tác | — |
| `loading` | Đang chờ side-effect (API) hoàn thành | Không phải state độc lập — `loading` chồng lên `on`/`off` hiện tại (ví dụ đang `on`, chờ xác nhận đổi sang `off`, vẫn hiển thị `on` + dot xoay cho tới khi xác nhận) — khác `Button.loading` (thay thế hoàn toàn label bằng Spinner), `Switch.loading` chỉ **thêm** dot xoay nhỏ, không ẩn track |

### 7.6. Accessibility Contract

- **Semantic HTML**: không có phần tử gốc "switch" trong HTML chuẩn — bắt buộc `role="switch"` (Design System Spec §14.4, ngoại lệ hợp lệ khi không có tương đương gốc).
- **ARIA**: `aria-checked` (không phải `checked` DOM property thuần vì đây là `role="switch"`, không phải `<input>` checkbox thật ẩn dưới — cần xác nhận cách implement cụ thể: có thể vẫn dùng `<input type="checkbox">` ẩn + `role="switch"` ghi đè ngữ nghĩa, hoặc dùng `<button role="switch">` — quyết định cụ thể để lại code hóa, tài liệu này chỉ yêu cầu `aria-checked` phải phản ánh đúng `on`/`off`).
- **Keyboard**: `Space`/`Enter` đều toggle (khác `Checkbox` chỉ `Space` — vì `Switch` thường implement trên `<button>` semantics nếu không dùng input ẩn, `<button>` nhận cả `Enter`/`Space`).
- **Screen reader**: label **luôn** hiển thị kèm (UI Spec §9.2 "không dùng Switch không nhãn") — kể cả khi thị giác không hiện text (ví dụ Navbar Theme toggle), `aria-label` bắt buộc tồn tại.
- **Label association**: nếu có `label` hiển thị, liên kết `htmlFor`/`aria-labelledby`; nếu không, `aria-label` bắt buộc (không có ngoại lệ nào cho phép Switch hoàn toàn không tên).

### 7.7. Design Token Usage

Color (track on/off dùng `accent-secondary`/`border-subtle`), Motion (`duration-fast` cho animation trượt knob — đây là component **duy nhất trong 8 component có animation chuyển động thị giác thật sự** khi đổi state, khác `Checkbox`/`Radio` chỉ đổi màu tức thời).

### 7.8. Responsive Behaviour

Không đổi theo breakpoint (UI Spec §9.2).

### 7.9. Validation Behaviour

Không áp dụng — `Switch` không phải 1 phần validate của form (đúng bản chất "hiệu lực ngay", không có khái niệm submit nên không có khái niệm lỗi form gắn với nó).

### 7.10. Testing Surface

Rendering (2 size); States (4 state, đặc biệt `loading` chồng lên `on`/`off` — test xác nhận dot xoay xuất hiện mà track không đổi hình dạng); Accessibility (`role="switch"` + `aria-checked` đúng, `aria-label` bắt buộc khi không có label hiển thị — test cố ý không truyền label phải vẫn có accessible name qua `aria-label`); Keyboard (cả `Space` và `Enter` đều toggle — khác Checkbox, test riêng biệt tường minh); Composition (label + Spinner nội bộ không xung đột vị trí).

### 7.11. Performance Considerations

Theo baseline mục 0.5 — animation knob (mục 7.7) dùng CSS transition thuần (`transform`), không dùng JS animation library (Framer Motion chỉ dùng khi thực sự cần theo UI Spec §19.2, animation đơn giản này không đủ lý do).

### 7.12. Future Extensibility

Không dự kiến mở rộng — tương tự `Checkbox`, đây là component ổn định.

### 7.13. Definition of Done

- 2 size × 4 state render đúng, cả 2 theme.
- `loading` hiển thị đúng (dot xoay, track giữ nguyên) — test riêng phân biệt với `Button.isLoading`.
- `aria-label` bắt buộc có mặt khi không label hiển thị — test cố ý thiếu case này.
- Cả `Space` và `Enter` đều toggle — test cả 2 phím riêng biệt.

---

## 8. Label

### 8.1. Purpose

Hiển thị nhãn cho 1 Form Control, style nhất quán theo Type Token `text-label` (UI Spec §4.2). Giải quyết đúng 1 vấn đề: **6 Form Control khác nhau (Input/Textarea/Select/Checkbox/Radio/Switch) không cần tự viết lại style label 6 lần** — quyết định đã chốt khi lập kế hoạch M5 (nhắc lại đầu tài liệu). **Không bao giờ**: tự biết nó đang gắn với control nào về mặt logic (chỉ nhận `htmlFor`/`children` qua props, không tự tìm control liên kết bằng DOM traversal).

### 8.2. Component Boundary

- **Responsibilities**: render `<label>` đúng style, hiển thị dấu `*` đỏ khi `required` (Design System Spec §12.2 — quy ước duy nhất cho required field trong toàn hệ thống).
- **Non-responsibilities**: không tự validate xem control liên kết có thực sự tồn tại đúng `id` hay không (đó là trách nhiệm review/test của Form Control cha, `Label` chỉ render đúng những gì nhận được).
- **Forbidden responsibilities**: không bao giờ đứng độc lập là nội dung chính của 1 màn hình (mục 7.3, Sprint F1 M1 Plan — "Label không bao giờ đứng 1 mình trong UI Kit demo, luôn compose bên trong 1 Form Control khác").

### 8.3. Public API Philosophy

- **Variants**: không có (1 style duy nhất, đúng `text-label` token — không có "biến thể Label" nào trong UI Spec).
- **Sizes**: không có (kích thước cố định theo `text-label`, không đổi theo size của Form Control cha — 1 Label 13px dùng chung cho `Input size="sm"` lẫn `size="lg"`, đây là quyết định nhất quán thị giác, tránh Label "nhảy cỡ chữ" gây rối mắt khi nhìn nhiều field cỡ khác nhau cạnh nhau).
- **States**: không có state tương tác riêng (Label không tự tương tác được — click vào Label kích hoạt control liên kết qua `htmlFor`, đây là hành vi gốc HTML, không phải "state" của Label).
- **Optional capabilities**: `required` (boolean, hiện dấu `*`), `optional` (boolean, hiện "(tùy chọn)" — 2 prop **loại trừ lẫn nhau về mặt sử dụng thực tế**: 1 form đa số field bắt buộc thì dùng `optional` cho thiểu số field không bắt buộc; form đa số field tùy chọn thì dùng `required` cho thiểu số field bắt buộc — Design System Spec §12.2 "chọn đánh dấu nhóm thiểu số").
- **Extension philosophy**: đây là component **nhỏ nhất, ổn định nhất** trong toàn bộ 8 component — API tối giản tuyệt đối (`children`, `htmlFor`, `required`, `optional`), không có lý do kỹ thuật nào để mở rộng thêm trong tương lai gần.

### 8.4. Composition Rules

- **Được compose bởi**: `Input`/`Textarea`/`Select` (label cho toàn field, 1 `Label`/field), `Checkbox`/`Radio`/`Switch` (label cho từng option hoặc cả nhóm).
- **Được phép compose**: chỉ `children` (text hoặc `ReactNode` đơn giản) — không compose component phức tạp nào khác bên trong `Label`.
- **Forbidden composition**: `Label` không bao giờ compose `Button`/`Input`/component tương tác khác bên trong nó (label chỉ chứa text, không chứa control — nếu cần icon giải thích cạnh Label, ví dụ Tooltip "?", đó là 2 phần tử đặt **cạnh nhau** bởi component cha, không phải `Label` tự chứa `Tooltip`).
- **Ví dụ hợp lệ**: `Input` render `<Label htmlFor={id} required>{label}</Label>` nội bộ.
- **Ví dụ không hợp lệ**: `Label` dùng làm heading trang (đó là `Typography variant="heading-*"`, không phải `Label` — 2 component khác mục đích dù cùng "hiển thị text").

### 8.5. State Model

Không có state — đây là component **thuần túy trình bày, không tương tác** (giống `Badge`/`Divider` trong Design System Spec §9.3, không phải Form Control tương tác thật). Ghi nhận rõ ở đây vì đề bài yêu cầu mục "State Model" cho mọi component — với `Label`, câu trả lời đúng là "N/A, có lý do" chứ không phải bỏ trống mục này.

### 8.6. Accessibility Contract

- **Semantic HTML**: `<label>` thật — **không** dùng `<span>`/`<div>` giả lập (mất hoàn toàn liên kết `htmlFor` tự động của trình duyệt, phải tự thêm `aria-labelledby` thủ công ở mọi nơi dùng — rủi ro quên sót cao hơn nhiều so với dùng đúng `<label>` gốc).
- **ARIA**: không cần thêm gì khi dùng đúng `<label htmlFor>` (đúng "First Rule of ARIA", Design System Spec §14.4).
- **Keyboard**: không áp dụng trực tiếp — nhưng **gián tiếp cải thiện** trải nghiệm bàn phím/chuột của control liên kết (click vào Label focus/toggle control tương ứng, hành vi gốc HTML).
- **Focus management**: không áp dụng (Label không nhận focus).
- **Screen reader**: đây chính là **nguồn chính** cung cấp "accessible name" cho control liên kết — nếu `Label` implement sai (ví dụ `htmlFor` không khớp `id` control), toàn bộ Form Control đó mất tên gọi với screen reader dù thị giác vẫn "trông đúng" — đây là lỗi **nghiêm trọng nhất có thể xảy ra** liên quan tới `Label`, dù bản thân component rất đơn giản.
- **Error announcement**: không áp dụng (Label không hiển thị lỗi — đó là `errorText` của Form Control cha).
- **Label association**: đây **là** toàn bộ lý do tồn tại của component này (mục 8.1) — `htmlFor` phải khớp chính xác `id` của control, không có ngoại lệ.

### 8.7. Design Token Usage

Typography (`text-label` — duy nhất, UI Spec §4.2: 13px, weight 500, uppercase tracking 0.02em), Color (`text-primary` mặc định, `danger` cho dấu `*` required, `text-muted` cho "(tùy chọn)").

### 8.8. Responsive Behaviour

Không đổi theo breakpoint — `text-label` là token cố định (UI Spec §4.6: "Body/Data token không cần responsive, đã đủ nhỏ để không cần co giãn").

### 8.9. Validation Behaviour

Không áp dụng trực tiếp (Label không hiển thị lỗi) — nhưng có liên quan gián tiếp: khi Form Control cha ở state `error`, `Label` **không** tự đổi màu theo lỗi (màu lỗi chỉ ở viền/icon/text lỗi của control, không lan sang Label — giữ Label luôn đọc được rõ ràng làm điểm neo ổn định dù control xung quanh đổi trạng thái).

### 8.10. Testing Surface

Rendering (`required`/`optional`/mặc định không có gì); Accessibility (**test quan trọng nhất của toàn bộ 8 component**: `htmlFor` khớp đúng `id` control liên kết — viết test tường minh cho từng Form Control xác nhận `getByLabelText` tìm được đúng control, không chỉ test riêng `Label` cô lập); Composition (render đúng bên trong cả 6 Form Control khác, không lệch style giữa các nơi dùng).

### 8.11. Performance Considerations

Theo baseline mục 0.5 — component nhỏ nhất, không có cân nhắc hiệu năng đặc biệt nào.

### 8.12. Future Extensibility

Không dự kiến mở rộng.

### 8.13. Definition of Done

- Render đúng token, cả 2 theme.
- `required`/`optional` hiển thị đúng, không cả 2 cùng lúc trên 1 Label.
- **Bắt buộc**: mỗi Form Control (6 component còn lại) có ít nhất 1 test xác nhận `getByLabelText` tìm đúng control qua `Label` — đây là điều kiện chấp nhận áp dụng chéo, không chỉ nằm trong Definition of Done riêng của `Label`.

---

*Hết tài liệu. Micro Component Specification này là hợp đồng kỹ thuật cấp component cho M5 — cầu nối giữa Design System Specification (quy tắc chung) và code thật. Mọi quyết định trong tài liệu này đã đối chiếu với 5 tài liệu đã đóng băng và các quyết định đã chốt trước đó trong dự án; không có quyết định kiến trúc mới nào được tự ý đưa ra ngoài phạm vi đã có, trừ các điểm được ghi chú rõ là "quyết định đã chốt trước" khi tài liệu M5 Implementation Plan chính thức chưa tồn tại.*
