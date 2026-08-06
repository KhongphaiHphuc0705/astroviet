# Micro Component Specification — Sprint F1 Milestone M6

## Shared UI Library — Display, Feedback & Overlay

**Phiên bản:** 1.0
**Trạng thái:** Draft — sẵn sàng làm hợp đồng kỹ thuật trước khi code hóa M6
**Dựa trên:** Frontend UI Specification §9.3, §9.4, §9.5, §1.3 (Frozen), Design System Specification §10 (Frozen), Frontend Architecture Specification §9 (Frozen), Frontend Coding Standards, Sprint F1 Implementation Plan, Micro Component Specification M5 (Frozen), kết quả nghiệm thu M1–M5
**Không thuộc phạm vi:** Code React/TypeScript/CSS, quy tắc quản trị chung (Design System Spec §10) — tài liệu này là hợp đồng kỹ thuật cấp component, cầu nối giữa kiến trúc và code thật.

> **Ghi chú minh bạch**: Tương tự tình huống ở M5, đề bài liệt "Sprint F1 M6 Implementation Plan" như 1 tài liệu nguồn — tài liệu đó **chưa tồn tại** trong phiên làm việc này. Micro Component Spec này xây dựng trực tiếp từ 4 tài liệu đã đóng băng + Micro Spec M5 (để nhất quán pattern) + 1 khoản nợ kỹ thuật đã ghi nhận từ M5 cần trả ở đây (mục 0.6).

> **Điểm cần làm rõ trước khi đọc tiếp — "Dialog" không phải 1 component riêng**: Đề bài liệt `Dialog` như 1 component tách biệt khỏi `Modal`. Design System Specification §10.4 (đã đóng băng) đã quyết định rõ: *"Dialog" là tên gọi mẫu hình tương tác (ARIA Dialog Pattern), không phải 1 component riêng biệt* — `Modal` là hiện thực hóa cụ thể của mẫu hình đó trong hệ thống AstroViet. Tạo 1 component `Dialog` riêng sẽ **mâu thuẫn trực tiếp** với quyết định đã đóng băng này (vi phạm yêu cầu "Do NOT contradict any existing specification"). Xử lý: mục 9 (Modal) bao gồm luôn phần làm rõ quan hệ Dialog↔Modal thay vì tách thành 1 Micro Spec riêng biệt thứ 9 — giữ đúng 8 component thật đã xác định từ Sprint F1 Plan §4 M6.

---

## Mục lục

0. [Shared Contracts](#0-shared-contracts)
1. [Card](#1-card)
2. [Badge](#2-badge)
3. [Avatar](#3-avatar)
4. [Divider](#4-divider)
5. [Alert](#5-alert)
6. [Spinner](#6-spinner)
7. [Skeleton](#7-skeleton)
8. [Modal (bao gồm làm rõ Dialog)](#8-modal-bao-gồm-làm-rõ-dialog)

---

## 0. Shared Contracts

> Kế thừa toàn bộ Micro Spec M5 §0 (Non-responsibility, State Baseline, Token Usage, Testing Baseline, Performance Baseline) — không lặp lại. Bổ sung riêng cho nhóm Display/Feedback/Overlay dưới đây.

### 0.1. Phân loại 3 nhóm (đề bài) đối chiếu 2 trục Design System Spec

Đề bài phân loại theo **mục đích** (Display/Feedback/Overlay) — Design System Spec §9 phân loại theo **tầng kiến trúc** (Primitive/Composite). 2 trục này độc lập, không thay thế nhau — mục 3 mỗi component trả lời **cả 2 trục cùng lúc**.

### 0.2. Nguyên tắc chung: component hiển thị thuần túy, không có "ý nghĩa domain"

Khác nhóm Form Control (M5, luôn gắn với 1 giá trị dữ liệu cụ thể), nhóm M6 phần lớn là **container/chỉ báo trạng thái thuần túy** — `Card`/`Badge`/`Alert` không bao giờ tự mang ý nghĩa nghiệp vụ cụ thể (không có `variant="pattern-detected"`, chỉ có `variant="outline-accent"` trung lập — ý nghĩa nghiệp vụ do component nghiệp vụ Sprint sau, ví dụ `PatternCard`, gán vào qua cách dùng, không phải built-in).

### 0.3. Overlay dùng chung 1 engine positioning — kế thừa trực tiếp từ M5

Architecture Spec §9.5 đã yêu cầu `Modal`/`Popover`/`Dropdown`/`Tooltip` dùng chung 1 engine positioning. `Select` (M5) đã tách `usePosition` (`shared/hooks/usePosition.ts`) với ý định tái sử dụng — **`Modal` không cần dùng `usePosition`** (Modal không "neo" theo 1 trigger như dropdown, nó căn giữa viewport cố định) — nhưng **`Popover`/`Dropdown`/`Tooltip`** (nếu Sprint sau thêm) sẽ cần. Ghi nhận rõ ở đây: `usePosition` hiện tại (theo review M5) **chưa có flip/collision detection** — nếu M6 hoặc Sprint sau cần Popover/Tooltip thật (không nằm trong 8 component M6 lần này), cần mở rộng hook đó trước, không viết engine mới song song.

### 0.4. Focus Trap — dùng chung giữa Modal và (tương lai) Drawer

`Modal` (mục 8) là component **đầu tiên** trong toàn hệ thống cần Focus Trap thật — thiết kế phần lõi (bẫy Tab trong phạm vi overlay, trả focus khi đóng) dưới dạng logic **tách được** (hook nội bộ, tương tự tinh thần `usePosition`), để `Drawer` (chưa thuộc phạm vi M6, đã nêu ở Layout Foundation mục 4.5 M4 Plan là "chưa có Drawer thật tới M6" — thực tế đề bài M6 lần này **cũng không có `Drawer`** trong danh sách 8 component, nên đây tiếp tục là nợ kỹ thuật chuyển sang Sprint sau) tái sử dụng khi tới lượt.

### 0.5. Animation — tuân thủ `prefers-reduced-motion` không ngoại lệ

`Spinner`/`Skeleton`/`Modal` (fade/scale enter) là 3 component trong nhóm M6 có animation thật — cả 3 **bắt buộc** tôn trọng `prefers-reduced-motion` (UI Spec §19.4, Design System Spec §8.4) — đây là điều kiện chặn Component Lifecycle Review (Design System Spec §16.3), không phải tùy chọn.

### 0.6. Trả nợ kỹ thuật từ M5 — `Button.isLoading` và `Radio variant="card"`

Ghi nhận tường minh (Sprint F1 M5 Plan §2.3, §6.1): khi `Spinner` (mục 6) và `Card` (mục 1) hoàn thành ở M6, **bước đầu tiên của M6** (trước khi coi 2 component này "xong") là quay lại `Button`/`Radio` (M5), thay implementation nội bộ tạm thời bằng import `Spinner`/`Card` thật — không đổi Public API của `Button`/`Radio` (đã cam kết từ M5). Đây là Deliverable ẩn của M6, cần đưa vào Definition of Done dù không nằm trong danh sách 8 component mới.

---

## 1. Card

### 1.1. Purpose

Container trung lập nhất hệ thống, tạo ranh giới thị giác rõ ràng (viền/shadow nhẹ) quanh 1 khối nội dung liên quan (UI Spec §9.3). Tồn tại để: thay thế mọi `<div className="border...">` viết tay rải rác, đảm bảo mọi "khối nội dung có ranh giới" trong hệ thống trông giống nhau. **Độc lập nghiệp vụ tuyệt đối**: `Card` không biết nó đang hiển thị 1 chart, 1 profile, hay 1 bài viết — ý nghĩa nghiệp vụ luôn tới từ `children` do component cha truyền vào. **Vai trò kiến trúc**: Primitive nền tảng cho **mọi** Composite hiển thị dữ liệu dạng khối trong toàn dự án (Sprint sau: `PlanetTable`, `PatternCard`... đều compose `Card` bên trong).

### 1.2. Responsibilities

- **MUST**: render đúng biến thể viền/nền/shadow, cung cấp slot `header`/`footer`, hỗ trợ chế độ `interactive` (toàn bộ Card là 1 target bấm được).
- **MUST NOT**: tự biết ý nghĩa nội dung bên trong; tự thêm padding không nhất quán giữa các nơi dùng (padding luôn qua token, mục 11); tự điều hướng khi `interactive` (nhận `href`/`onClick` từ ngoài, giống nguyên tắc `Button` M5 — Card không tự import Router).
- **Tránh chồng lấn trách nhiệm**: `Card` không tự xử lý trạng thái loading nội dung bên trong nó (đó là `Skeleton`, mục 7, đặt cạnh/thay thế `children`, không phải hành vi built-in của `Card`).

### 1.3. Component Classification

**Display + Primitive** — thuần túy trình bày (nhóm Display theo đề bài), và ở tầng Primitive theo Architecture Spec §9.1 (không compose Composite nào khác bắt buộc, chỉ nhận `children` bất kỳ).

### 1.4. Public API Philosophy

- **Inputs**: `children` (bắt buộc), `header`/`footer` (slot tùy chọn), `padding` (token spacing), `variant`, `interactive` (boolean).
- **Configurable behaviors**: khi `interactive=true`, toàn bộ Card trở thành 1 phần tử bấm được (không phải chỉ đổi con trỏ chuột — hành vi thật, mục 9).
- **Extension points**: `as` polymorphic (giống `Button`/`Container`) để render `<a>` khi `interactive` dùng cho điều hướng.
- **API tối giản có chủ đích**: không có prop điều khiển màu nền tùy ý (chỉ `variant` đóng, tránh Card trở thành "div có thể tô bất kỳ màu gì" — phá vỡ tính hệ thống).

### 1.5. Visual Variants

`default` (viền `border-subtle`, không shadow — UI Spec §9.3), `raised` (shadow-level-1, dùng khi Card nổi trên nền có texture), `outline-accent` (viền `accent-primary`, dùng cho Card cần nổi bật — ví dụ Pattern Card tương lai phát hiện Grand Trine).

### 1.6. Sizes

Không có size scale — kích thước hoàn toàn theo nội dung + `padding`. Responsive: `padding` tự giảm 1 bậc dưới `sm` (UI Spec §9.3).

### 1.7. States

`default`, `hover` (chỉ khi `interactive`), `focus-visible` (chỉ khi `interactive`), `selected` (viền `accent`, dùng khi Card là 1 lựa chọn trong danh sách — ví dụ chọn chart để so sánh, Sprint sau).

### 1.8. Composition Rules

Nhận `children` bất kỳ (không giới hạn loại). Composite bởi mọi thứ (`Grid`/`Stack` M4 bọc danh sách nhiều Card). Nhiều instance cùng tồn tại là bình thường (ví dụ `Grid` chứa hàng chục Card). Quan hệ Layout: `Card` không bao giờ tự quyết định vị trí của chính nó trên trang — luôn đặt trong `Grid`/`Stack`/`Section` (M4).

### 1.9. Accessibility

Semantic HTML mặc định `<div>`, đổi `as` khi `interactive` dùng cho điều hướng (`<a>` — không giả lập bằng `onClick`). Không có ARIA mặc định trừ khi nội dung yêu cầu (ví dụ Card chứa heading nên có heading thật, không phải trách nhiệm Card). Keyboard: khi `interactive`, đạt focus bằng Tab, `Enter` kích hoạt (đúng hành vi gốc nếu render đúng `<a>`/`<button>`). Color independence: `selected` state không chỉ dựa viền màu — cần icon/dấu hiệu bổ sung nếu ngữ cảnh dùng cần rõ ràng cho người mù màu (khuyến nghị, không bắt buộc built-in vào Card).

### 1.10. Responsive Behavior

Mobile: `padding` giảm 1 bậc. Tablet/Desktop: không đổi thêm. Không có breakpoint riêng nào khác — Card tự nhiên co giãn theo `Grid`/`Container` cha.

### 1.11. Theme Support

Toàn bộ 3 variant dùng Semantic Token (`border-subtle`, `bg-surface`, `shadow-level-1`, `accent-primary`) — đã có sẵn cặp giá trị Light/Dark từ M2, không cần thêm token mới.

### 1.12. Performance Considerations

Rendering rẻ (không logic phức tạp). Không memoization mặc định — chỉ cân nhắc `React.memo` khi dùng trong danh sách lớn (Architecture Spec §11.1, quyết định ở tầng gọi, không phải bên trong `Card`).

### 1.13. Testing Checklist

Unit: N/A (không có hàm thuần). Component: 3 variant × `interactive` on/off render đúng. Accessibility: `interactive` Card đạt focus, `Enter` kích hoạt, `vitest-axe` sạch. Responsive: padding giảm dưới `sm`. Interaction: click Card `interactive` gọi đúng `onClick`/điều hướng đúng `href`.

### 1.14. Common Mistakes

Card tự thêm padding hardcode thay vì token; Card tự import Router để điều hướng thay vì nhận `href`/`as`; dùng Card cho mọi loại "khối có viền" kể cả khi ý nghĩa thực chất là Modal/Alert (lẫn nhóm Feedback/Overlay vào Display).

### 1.15. Future Extensibility

Slot `media` (ảnh minh họa đầu Card) có thể cần cho Knowledge Base (Sprint sau) — chưa thêm ở M6 (YAGNI, chưa có use-case thật).

---

## 2. Badge

### 2.1. Purpose

Nhãn nhỏ, không tương tác, gắn trạng thái/phân loại (UI Spec §9.3 — "Miễn phí", số lượng chưa đọc). Tồn tại để mã hóa 1 mẩu thông tin ngắn nhất quán, không lẫn với `Alert` (mang thông điệp) hay `Button` (hành động).

### 2.2. Responsibilities

- **MUST**: render đúng biến thể màu + kích thước, hỗ trợ `dot` (chấm tròn thay text).
- **MUST NOT**: bao giờ trở nên tương tác được (không `onClick`) — nếu cần bấm, đó là `Button variant="ghost" size="sm"` (Design System Spec §10.3, ranh giới đã chốt tường minh).
- **Tránh chồng lấn**: không dùng thay `Alert` khi cần truyền tải thông điệp đầy đủ (Badge chỉ 1-2 từ).

### 2.3. Component Classification

**Display + Primitive**.

### 2.4. Public API Philosophy

Inputs: `children`/`variant`/`size`/`icon` (tùy chọn)/`dot` (boolean). Không có `onClick` trong API (khóa cứng bằng thiết kế, không phải quy ước bằng lời — không expose prop tương tác nào).

### 2.5. Visual Variants

`neutral`, `accent`, `secondary`, `success`, `warning`, `danger`, `outline` (UI Spec §9.3 — 7 biến thể, dùng đúng Semantic Color Role, không dùng Element/Aspect Color domain, Design System Spec §3.3).

### 2.6. Sizes

`sm` (20px), `md` (24px). Không đổi theo breakpoint.

### 2.7. States

Chỉ `default` — không tương tác (mục 2.2), do đó không có `hover`/`focus`/`active`.

### 2.8. Composition Rules

Nhận `children` (text ngắn) hoặc `icon`. Nested: không có ý nghĩa (Badge trong Badge vô nghĩa). Nhiều instance cùng tồn tại bình thường (ví dụ nhiều Badge cạnh nhau trong 1 hàng bảng). Composite bởi: Navbar (badge "Miễn phí"), bảng dữ liệu tương lai.

### 2.9. Accessibility

`<span>` (không phải `<div>` — Badge luôn là inline content theo ngữ nghĩa). Không có role ARIA mặc định. Nếu Badge mang thông tin quan trọng (không chỉ trang trí), nội dung text phải đọc được — không dùng chỉ icon/màu không kèm text (UI Spec §9.3, nhắc lại nguyên tắc color independence).

### 2.10. Responsive Behavior

Không đổi theo breakpoint.

### 2.11. Theme Support

7 variant dùng đúng Semantic Color, đã có Light/Dark từ M2.

### 2.12. Performance Considerations

Rendering cực rẻ, không cân nhắc gì đặc biệt.

### 2.13. Testing Checklist

Component: 7 variant × 2 size render đúng. Accessibility: `vitest-axe` sạch, xác nhận **không** có `onClick`/`tabIndex` nào bị vô tình thêm vào (test tiêu cực — cố ý xác nhận Badge không tương tác được, không chỉ test nó "trông đúng").

### 2.14. Common Mistakes

Thêm `onClick` vào Badge "vì tiện" thay vì dùng `Button ghost`; dùng Element Color (Fire/Earth/Air/Water, domain-specific) cho Badge UI chung thay vì Semantic Color.

### 2.15. Future Extensibility

Không dự kiến mở rộng — component ổn định, API tối giản đã đủ.

---

## 3. Avatar

### 3.1. Purpose

Đại diện hình ảnh người dùng — ảnh thật hoặc chữ cái đầu khi chưa có ảnh (UI Spec §9.3). Tồn tại để chuẩn hóa cách hiển thị "danh tính người dùng" nhất quán (Navbar, danh sách thành viên tương lai). Độc lập nghiệp vụ: không tự biết đây là user nào, chỉ nhận `src`/`name` qua props.

### 3.2. Responsibilities

- **MUST**: hiển thị ảnh nếu `src` hợp lệ, tự động fallback sang initials nếu `src` lỗi/rỗng.
- **MUST NOT**: tự fetch ảnh từ API/tự cache; tự suy luận tên viết tắt sai ngữ pháp tiếng Việt phức tạp (initials chỉ lấy 1-2 ký tự đầu theo quy tắc đơn giản, không xử lý NLP).
- **Tránh chồng lấn**: không dùng thay `Badge` để hiển thị trạng thái (Avatar luôn là danh tính, không phải trạng thái).

### 3.3. Component Classification

**Display + Primitive**.

### 3.4. Public API Philosophy

Inputs: `src` (tùy chọn), `name` (bắt buộc — dùng cho initials fallback **và** `alt`/`aria-label`), `size`, `shape` (`circle`/`rounded`). Extension point: không có prop tùy biến màu nền initials (màu tự tính theo hash tên, nhất quán, không cấu hình được — tránh mỗi nơi dùng chọn màu tùy tiện phá vỡ tính hệ thống).

### 3.5. Visual Variants

`image`, `initials` — không phải "variant" người dùng chọn, mà **tự động** theo trạng thái `src` (UI Spec §9.3).

### 3.6. Sizes

`xs` (24px), `sm` (32px), `md` (40px, mặc định), `lg` (56px). Không đổi theo breakpoint.

### 3.7. States

`default`, `loading` (skeleton tròn trong lúc ảnh tải — compose `Skeleton variant="circle"`, mục 7).

### 3.8. Composition Rules

Không nhận `children` (nội dung cố định: ảnh hoặc initials, không tùy biến tự do). Compose `Skeleton` (mục 7, state `loading`). Nhiều instance cùng tồn tại bình thường (danh sách người dùng tương lai). Không nested (Avatar trong Avatar vô nghĩa).

### 3.9. Accessibility

`<img>` thật khi có `src`, `alt` bắt buộc = `name`. Khi initials, `aria-label` = `name` đầy đủ (**không** để screen reader đọc 2 chữ cái viết tắt — UI Spec §9.3 nhấn mạnh rõ điều này, đây là lỗi accessibility dễ mắc nhất của component này).

### 3.10. Responsive Behavior

Không đổi theo breakpoint.

### 3.11. Theme Support

Màu nền initials tính theo hash tên — cần đảm bảo dải màu chọn ra vẫn đạt contrast AA với text initials ở **cả 2 theme** (không phải 1 màu cố định đẹp ở Light nhưng vỡ contrast ở Dark) — đây là điểm kỹ thuật cần chú ý khi implement thuật toán hash-to-color.

### 3.12. Performance Considerations

`onError` handler cho `<img>` (chuyển sang initials khi ảnh lỗi) — rẻ, không cần debounce/throttle.

### 3.13. Testing Checklist

Component: `src` hợp lệ → hiển thị ảnh; `src` lỗi → fallback initials (test giả lập sự kiện `onError`); không `src` → initials ngay từ đầu. Accessibility: `alt`/`aria-label` đúng ở cả 2 trường hợp. Responsive: N/A. Visual regression: đối chiếu contrast màu nền initials ở cả 2 theme (thủ công, không tự động hóa dễ dàng).

### 3.14. Common Mistakes

Quên `aria-label` khi hiển thị initials (chỉ có `alt` cho `<img>`, không tự động áp dụng cho fallback initials — dễ quên vì tưởng 1 lần khai `alt`/`aria-label` là đủ cho cả 2 nhánh).

### 3.15. Future Extensibility

Trạng thái online/offline (chấm nhỏ góc dưới) có thể cần khi có tính năng xã hội — chưa thêm ở M6.

---

## 4. Divider

### 4.1. Purpose

Phân tách nội dung bằng đường kẻ mảnh (UI Spec §9.3). Tồn tại để thay thế `<hr>`/border viết tay rải rác bằng 1 component nhất quán, bao gồm cả biến thể signature `ring` (mục 1.3 UI Spec — 1 trong những chi tiết nhận diện thương hiệu AstroViet).

### 4.2. Responsibilities

- **MUST**: render đúng orientation (`horizontal`/`vertical`), hỗ trợ `label` (text giữa divider, ví dụ "Hoặc").
- **MUST NOT**: tự giới hạn số lần dùng biến thể `ring` trong code (giới hạn "tối đa 1 lần/màn hình" là quy tắc **thiết kế**, Design System Spec §16.3 enforce ở Component Lifecycle Review, không phải logic runtime trong chính Divider — Divider không tự đếm/chặn lần dùng thứ 2).
- **Tránh chồng lấn**: không dùng thay `Skeleton`/`Spinner` dù về mặt hình học "cũng là 1 đường/hình" — mục đích hoàn toàn khác (phân tách nội dung tĩnh vs. chỉ báo loading động).

### 4.3. Component Classification

**Display + Primitive**.

### 4.4. Public API Philosophy

Inputs: `orientation`, `variant` (`solid`/`dashed`/`ring`), `label` (tùy chọn). Tối giản — không có prop màu/độ dày tùy ý (độ dày cố định 1px xuyên suốt hệ thống, Design System Spec §10.3 "giữ tính hairline").

### 4.5. Visual Variants

`solid` (mặc định, `border-subtle`), `dashed` (hiếm, cho nội dung tạm/draft), `ring` (signature — cung tròn mảnh có vạch chia độ, UI Spec §1.3, dùng tối đa 1 lần/màn hình).

### 4.6. Sizes

Không có size scale — chỉ độ dày 1px cố định (mục 4.4).

### 4.7. States

Không có state — thuần túy trình bày tĩnh, không tương tác.

### 4.8. Composition Rules

Không nhận `children` tùy ý (chỉ `label` string đơn giản). Đặt giữa 2 khối nội dung trong `Stack`. Nhiều instance `solid` cùng tồn tại bình thường; `ring` giới hạn 1/màn hình (mục 4.2 — review-time constraint).

### 4.9. Accessibility

`role="separator"`. Khi `variant="ring"` (thuần trang trí), `aria-hidden="true"` (UI Spec §9.3 — screen reader bỏ qua hoàn toàn, không đọc "separator" vô nghĩa cho 1 chi tiết thẩm mỹ).

### 4.10. Responsive Behavior

`orientation="vertical"` tự ẩn và chuyển `horizontal` dưới `sm` trong ngữ cảnh `Stack` responsive (UI Spec §9.3) — hành vi này thuộc về cách `Stack` (M4) xử lý con, không phải logic tự thân của `Divider`.

### 4.11. Theme Support

`border-subtle` (Semantic Token, đổi đúng theo theme). Biến thể `ring` dùng `opacity: 0.15` (rất mờ, giữ nguyên tỷ lệ mờ ở cả 2 theme — không cần giá trị opacity riêng cho Dark, vì đây là hiệu ứng trang trí không cần contrast AA).

### 4.12. Performance Considerations

Rendering cực rẻ, không cân nhắc gì đặc biệt.

### 4.13. Testing Checklist

Component: 3 variant × 2 orientation. Accessibility: `role="separator"` đúng, `ring` có `aria-hidden`. Visual: xác nhận `ring` chỉ xuất hiện tối đa 1 lần trên trang xác minh demo (review thủ công, không phải test tự động).

### 4.14. Common Mistakes

Dùng `ring` nhiều hơn 1 lần/màn hình (phá vỡ tính "đặc biệt" của signature element — Design System Spec §10.3 nhấn mạnh đây là ràng buộc cứng do review enforce).

### 4.15. Future Extensibility

Không dự kiến mở rộng.

---

## 5. Alert

### 5.1. Purpose

Thông báo gắn liền trong luồng nội dung (không phải overlay), cần chú ý nhưng không chặn thao tác (UI Spec §9.4). Tồn tại để phân biệt rõ với `Toast` (chưa thuộc M6 — Toast là thông báo tạm thời tự biến mất, nằm ngoài luồng nội dung; Alert ở lại cho tới khi người dùng chủ động đóng hoặc rời trang).

### 5.2. Responsibilities

- **MUST**: hiển thị đúng biến thể + icon tương ứng, hỗ trợ đóng (`onDismiss`) khi cần.
- **MUST NOT**: tự động biến mất sau X giây (đó là hành vi của `Toast`, không phải `Alert` — nhầm 2 khái niệm là lỗi composition nghiêm trọng, UI Spec §9.4 đã phân biệt rõ); tự quyết định nội dung lỗi (nhận `title`/`description` từ ngoài, không tự parse lỗi API).
- **Tránh chồng lấn**: không dùng cho thông báo tạm thời (Toast); không dùng cho trạng thái trống danh sách (đó là Empty State pattern, chưa thuộc M6, khác Alert về mục đích).

### 5.3. Component Classification

**Feedback + Composite** (compose icon + text + action button — nhiều phần hơn Primitive thuần túy).

### 5.4. Public API Philosophy

Inputs: `variant`, `title`, `description`, `icon` (tùy chọn, mặc định theo variant), `onDismiss` (tùy chọn — có thì hiện nút đóng), `actions` (slot cho `Button` phụ, ví dụ "Thử lại"). Extension point: `icon` override cho phép thay icon mặc định khi ngữ cảnh cần cụ thể hơn (không giới hạn cứng).

### 5.5. Visual Variants

`info`, `success`, `warning`, `danger` (UI Spec §9.4, đúng 4 Semantic Feedback Color).

### 5.6. Sizes

Không có size scale — 1 kích thước, padding `space-4` cố định (UI Spec §9.4).

### 5.7. States

`default` (persistent), `dismissible` (có nút đóng khi `onDismiss` được truyền). Không có `hover`/`focus` riêng cho chính Alert (chỉ nút đóng/action bên trong có state tương tác riêng, kế thừa từ `Button`).

### 5.8. Composition Rules

Compose: icon (Lucide hoặc mặc định theo variant), `Button` (trong `actions` slot). Nhận `children` không cần thiết (dùng `title`/`description` có cấu trúc thay vì `children` tự do — giữ layout nhất quán). Nhiều instance cùng tồn tại được (nhiều Alert xếp chồng trong 1 form dài) nhưng không khuyến nghị > 1 Alert cùng lúc trên 1 màn hình nhỏ (nguyên tắc UX, không phải giới hạn kỹ thuật).

### 5.9. Accessibility

`role="alert"` cho `danger`/`warning` (ngắt screen reader ngay lập tức — UI Spec §9.4), `role="status"` cho `info`/`success` (không ngắt). Đây là **điểm accessibility quan trọng nhất của Alert** — dùng sai role (ví dụ `role="alert"` cho mọi variant) sẽ làm phiền người dùng screen reader với thông báo không quan trọng liên tục ngắt ngang.

### 5.10. Responsive Behavior

`actions` xếp xuống dòng dưới `title`/`description` thay vì cùng hàng dưới `sm` (UI Spec §9.4).

### 5.11. Theme Support

4 variant dùng đúng Semantic Feedback Color (`-bg`/`-border`/`-text`, Design System Spec §3.4, mỗi màu có 3 biến thể độ đậm) — đã có sẵn Light/Dark từ M2.

### 5.12. Performance Considerations

Rendering rẻ. Không cân nhắc đặc biệt — không phải component lặp trong danh sách lớn.

### 5.13. Testing Checklist

Component: 4 variant × dismissible on/off. Accessibility: `role` đúng theo variant (test riêng biệt `alert` vs `status`, không gộp chung), `vitest-axe` sạch. Interaction: `onDismiss` gọi đúng khi bấm nút đóng; `actions` Button hoạt động đúng.

### 5.14. Common Mistakes

Dùng `role="alert"` cho mọi variant (kể cả `info`/`success`) — phiền screen reader không cần thiết; nhầm Alert với Toast (thêm logic tự ẩn sau X giây vào Alert).

### 5.15. Future Extensibility

`Toast` (Sprint sau, không thuộc M6 theo danh sách đề bài — dù ban đầu Sprint F1 Plan có nhắc tới, đối chiếu lại danh sách 8 component M6 lần này **không có Toast**, ghi nhận đây là backlog gap tương tự `Breadcrumb`/`PageHeader` đã ghi ở M4) sẽ dùng chung 4 variant + Semantic Feedback Color với `Alert`, không định nghĩa lại bảng màu riêng.

---

## 6. Spinner

### 6.1. Purpose

Chỉ báo loading không xác định thời lượng (UI Spec §9.3). Tồn tại để có 1 hình ảnh loading **nhất quán và có tính thương hiệu** ("The Ring", UI Spec §1.3) thay vì spinner generic — đây là 1 trong số ít component mang tính nhận diện thương hiệu rõ rệt trong toàn Design System.

### 6.2. Responsibilities

- **MUST**: hiển thị đúng hình dạng The Ring (cung tròn quay, không phải vòng tròn đầy đủ), tôn trọng `prefers-reduced-motion`.
- **MUST NOT**: tự quyết định khi nào nên hiển thị (component cha quyết định qua điều kiện render, `Spinner` không tự đọc bất kỳ global loading state nào); tự thay thế `Skeleton` khi biết trước hình dạng nội dung (Design System Spec §8.3 — Skeleton luôn ưu tiên trước, Spinner là fallback).
- **Tránh chồng lấn**: không tự chứa text mô tả nhìn thấy được (label chỉ dành cho screen reader, `visually-hidden`).

### 6.3. Component Classification

**Feedback + Primitive**.

### 6.4. Public API Philosophy

Inputs: `size`, `label` (text ẩn cho screen reader, ví dụ "Đang tính toán biểu đồ..."). Cực kỳ tối giản — không `variant` (chỉ 1 hình ảnh duy nhất, mục 6.5) — đây là quyết định có chủ đích: The Ring là tài sản thương hiệu (Design System Spec §10.3), không phải style tùy chọn được đổi.

### 6.5. Visual Variants

Chỉ 1 — không có biến thể hình ảnh khác (khác `Divider` có 3 variant, `Spinner` chỉ có 1 hình dạng duy nhất trong toàn hệ thống).

### 6.6. Sizes

`xs` (14px, trong `Button size="sm"` — đây chính là điểm nối trả nợ kỹ thuật M5, mục 0.6), `sm` (16px), `md` (24px, mặc định), `lg` (40px, full-page loading).

### 6.7. States

Chỉ `spinning` — không có state khác (không `paused`/`stopped`, Spinner luôn quay khi tồn tại trong DOM; ẩn nó = unmount, không phải đổi state).

### 6.8. Composition Rules

Không nhận `children`. Composite bởi: `Button` (`isLoading`, trả nợ M5), full-page loading (route Suspense fallback, Architecture Spec §5.3), Sprint sau nhiều nơi khác. Nhiều instance cùng tồn tại được (2 Button cùng loading độc lập).

### 6.9. Accessibility

`role="status"` + `aria-live="polite"` + text `label` ẩn thị giác nhưng đọc được (UI Spec §9.3). Đây là component **duy nhất trong nhóm Feedback không dùng `role="alert"`/`role="status"` theo mức nghiêm trọng khác nhau như Alert** — luôn `polite` (loading không bao giờ đủ khẩn cấp để ngắt ngang `assertive`).

### 6.10. Responsive Behavior

Không đổi theo breakpoint.

### 6.11. Theme Support

Màu The Ring dùng `accent-primary` hoặc `text-secondary` tùy ngữ cảnh (cần xác nhận cụ thể lúc code hóa dựa trên nền đặt Spinner lên) — cả 2 lựa chọn đều có sẵn cặp giá trị Light/Dark từ M2, không cần token mới.

### 6.12. Performance Considerations

Animation CSS thuần (`@keyframes` xoay), **không dùng Framer Motion** (UI Spec §19.2 — animation đơn giản không đủ lý do dùng thư viện). `prefers-reduced-motion`: giảm tốc độ quay thay vì tắt hẳn (Design System Spec §10.3 — "vẫn truyền tải đang xử lý", khác `Skeleton`/`Modal` có thể tắt hẳn animation).

### 6.13. Testing Checklist

Component: 4 size render đúng hình dạng. Accessibility: `role="status"` + `aria-live="polite"` + label đọc được (không thấy bằng mắt nhưng `getByText` tìm thấy trong DOM). Animation: xác nhận giảm tốc (không tắt hẳn) khi `prefers-reduced-motion` bật — test bằng cách mock media query, đối chiếu class/style animation-duration khác nhau giữa 2 trường hợp.

### 6.14. Common Mistakes

Dùng vòng tròn generic thay The Ring "vì nhanh hơn" — vi phạm trực tiếp tài sản thương hiệu (Design System Spec §10.3); tắt hẳn animation khi `prefers-reduced-motion` thay vì chỉ giảm tốc (khác quy tắc riêng của Spinner so với các animation khác trong hệ thống).

### 6.15. Future Extensibility

Không dự kiến mở rộng ngoài việc **hoàn thành ngay lập tức khoản nợ M5** (mục 0.6) — đây là ưu tiên gần nhất, không phải mở rộng tính năng mới.

---

## 7. Skeleton

### 7.1. Purpose

Placeholder giữ đúng hình dạng nội dung sắp tới, chống Cumulative Layout Shift (UI Spec §9.3, §18.2). Tồn tại để là **lựa chọn ưu tiên số 1** cho loading state (Design System Spec §8.3), Spinner chỉ là fallback khi không biết trước hình dạng.

### 7.2. Responsibilities

- **MUST**: giữ đúng kích thước/vị trí nội dung thật sẽ xuất hiện (không giữ kích thước bất kỳ).
- **MUST NOT**: tự đoán hình dạng nội dung (nhận `width`/`height`/`variant` tường minh từ component cha, không có logic "tự động khớp" ẩn).
- **Tránh chồng lấn**: không dùng khi thời gian chờ quá ngắn (< 300ms, Design System Spec §8.3 — quyết định đó thuộc component cha, không phải logic bên trong `Skeleton`).

### 7.3. Component Classification

**Feedback + Primitive**.

### 7.4. Public API Philosophy

Inputs: `variant` (`text`/`circle`/`rectangle`), `width`, `height`, `count` (số dòng lặp — dùng cho danh sách). Không có prop "tự động đo nội dung thật" (component cha luôn phải tường minh kích thước, tránh Skeleton "đoán sai" gây chính layout shift mà nó tồn tại để ngăn).

### 7.5. Visual Variants

`text` (1 dòng, bo góc nhỏ), `circle` (dùng cho Avatar loading, mục 3.7), `rectangle` (khối tùy ý — Card/Image placeholder).

### 7.6. Sizes

Không có size scale cố định — hoàn toàn theo `width`/`height` truyền vào.

### 7.7. States

Chỉ `animating` (shimmer) — tự động chuyển sang pulse tĩnh khi `prefers-reduced-motion` bật (UI Spec §9.3 — khác Spinner, Skeleton **có thể** giảm hẳn về static thay vì chỉ giảm tốc, vì shimmer chuyển động không mang thông tin thiết yếu như "đang xử lý" của Spinner).

### 7.8. Composition Rules

Không nhận `children`. Không compose component khác trực tiếp — nhưng có **preset composite** dự kiến Sprint sau (`SkeletonPlanetTable`, chưa thuộc M6, UI Spec §18.2 — ghi nhận nhưng không tự tạo trước, đúng nguyên tắc "chỉ tạo Primitive `Skeleton`, chưa tạo preset domain-specific" đã có tiền lệ ở Sprint F1 M1 Plan §7.3 điểm 4). Nhiều instance cùng tồn tại (danh sách skeleton row).

### 7.9. Accessibility

`aria-hidden="true"` trên chính Skeleton (UI Spec §18.2 — không đọc placeholder rỗng cho screen reader). Container cha bọc `aria-busy="true"` (trách nhiệm của component cha, không phải Skeleton tự thêm vào chính nó — Skeleton không biết nó đang ở trong 1 container "busy" hay đứng độc lập).

### 7.10. Responsive Behavior

Kích thước theo % container (không hardcode px cố định khi cần responsive) — quyết định `width` dạng % hay px cụ thể tùy component cha truyền vào, `Skeleton` chỉ render đúng giá trị nhận được.

### 7.11. Theme Support

Màu nền shimmer dùng `border-subtle`/`surface` (độ tương phản thấp, không nổi bật quá mức) — cần xác nhận cặp giá trị đủ tinh tế ở cả 2 theme (Dark Mode dễ bị shimmer "quá sáng" nếu dùng nhầm token, cần review kỹ khi implement).

### 7.12. Performance Considerations

Shimmer animation CSS thuần (`background-position` animate) — không dùng JS, không dùng Framer Motion (giống Spinner). Với `count` lớn (nhiều dòng skeleton), không cần virtualization (số dòng skeleton luôn hữu hạn nhỏ, không phải danh sách thật).

### 7.13. Testing Checklist

Component: 3 variant × `count` khác nhau (số phần tử lặp đúng). Accessibility: `aria-hidden="true"` luôn có mặt. Animation: chuyển shimmer→pulse tĩnh đúng khi `prefers-reduced-motion` (test tương tự Spinner mục 6.13 nhưng khác hành vi — tắt hẳn động, không chỉ giảm tốc, cần assertion khác).

### 7.14. Common Mistakes

Skeleton "đoán" kích thước nội dung thay vì nhận tường minh (dẫn tới chính layout shift mà nó phải ngăn); dùng Skeleton cho thời gian chờ quá ngắn gây nháy hình khó chịu hơn là hữu ích.

### 7.15. Future Extensibility

`SkeletonPlanetTable`/preset domain khác — Sprint sau, khi `entities/astrology` tồn tại (ngoài phạm vi Sprint F1).

---

## 8. Modal (bao gồm làm rõ Dialog)

### 8.0. Quan hệ Dialog ↔ Modal — đọc trước khi tiếp tục

Nhắc lại từ đầu tài liệu: "Dialog" (ARIA Dialog Pattern) là **mẫu hình tương tác**, không phải component. `Modal` là hiện thực hóa cụ thể của mẫu hình đó trong AstroViet (Design System Spec §10.4). Toàn bộ nội dung mục 8 dưới đây **là** Micro Spec cho cả 2 khái niệm — không tách riêng.

### 8.1. Purpose

Hộp thoại chặn tương tác (modal thật sự — UI Spec §9.5), dùng cho hành động quan trọng cần xác nhận hoặc form ngắn không đáng 1 trang riêng. Tồn tại để có 1 cơ chế overlay-chặn-tương-tác nhất quán, đúng chuẩn accessibility (focus trap, `Esc`), thay vì mỗi nơi tự viết lại.

### 8.2. Responsibilities

- **MUST**: chặn tương tác với phần còn lại của trang khi mở (focus trap thật, không chỉ thị giác), đóng đúng cách (`Esc`, click overlay tùy `closeOnOverlayClick`, nút đóng), trả focus về đúng trigger khi đóng.
- **MUST NOT**: tự biết nội dung form bên trong nó là gì (chỉ nhận `children` + `title` + `footer` slot); tự gọi API khi submit form bên trong (đó là trách nhiệm của `children`, Modal chỉ là khung chứa).
- **Tránh chồng lấn**: không dùng thay `Drawer` (chưa thuộc M6 — khi cần trượt từ cạnh màn hình thay vì nổi giữa, đó là nhu cầu khác, Sprint sau); không dùng thay `Alert` cho thông báo đơn giản không cần chặn tương tác.

### 8.3. Component Classification

**Overlay + Composite** (compose header/body/footer + engine focus-trap riêng — phức tạp nhất trong 8 component M6).

### 8.4. Public API Philosophy

Inputs: `isOpen`, `onClose`, `title`, `size`, `closeOnOverlayClick` (mặc định `true`, `false` cho hành động phá hủy dữ liệu — UI Spec §9.5), `footer` (slot action buttons). Extension point: `variant="danger"` cho xác nhận hành động phá hủy (viền/tiêu đề nhấn `danger`). API không cho phép tắt focus trap (không có prop `disableFocusTrap` — đây là baseline accessibility bắt buộc, không phải tùy chọn có thể tắt).

### 8.5. Visual Variants

`default`, `danger` (UI Spec §9.5 — viền/tiêu đề nhấn `color-danger`, dùng cho xác nhận Xóa).

### 8.6. Sizes

`sm` (400px), `md` (560px, mặc định), `lg` (720px), `fullscreen` (mobile luôn dùng biến thể này tự động, mục 10).

### 8.7. States

`closed`, `open`, `closing` (exit animation — mục 12). Chuyển tiếp: `closed→open` (trigger gọi `isOpen=true`, focus tự động chuyển vào Modal), `open→closing→closed` (đóng, exit animation chạy xong mới thực sự unmount, tránh cắt animation đột ngột).

### 8.8. Composition Rules

Nhận `children` (nội dung body) + `footer` slot (thường chứa `Button` từ M5). Compose: engine focus-trap nội bộ (mục 0.4), overlay backdrop (dùng `bg-overlay` — token đã thêm ở M4 khi sửa lỗi `AppLayout`, tái sử dụng đúng ở đây thay vì tạo mới). Nested: **Modal trong Modal bị cấm** (2 lớp focus trap chồng nhau gây xung đột nghiêm trọng — nếu cần xác nhận trong Modal, dùng `window.confirm` tạm thời hoặc thiết kế lại luồng, không lồng Modal). Nhiều instance: chỉ 1 Modal mở tại 1 thời điểm trên toàn ứng dụng (ràng buộc thiết kế, không phải giới hạn kỹ thuật cứng — nhưng cần 1 cơ chế toàn cục nếu có rủi ro 2 Modal cùng mở, ví dụ `uiStore` chỉ cho phép 1 `activeModalId`, Architecture Spec §7.3 đã có field này dự phòng).

### 8.9. Accessibility

`role="dialog"` + `aria-modal="true"` + `aria-labelledby` trỏ `title` (UI Spec §9.5). **Focus trap đầy đủ** (Tab không thoát khỏi Modal) — đây là yêu cầu accessibility nghiêm ngặt nhất trong toàn bộ 8 component M6, cần review kỹ nhất (tương tự `Select` đã là component phức tạp nhất M5). Focus tự động vào Modal khi mở (phần tử đầu tiên có thể focus, hoặc `title` nếu không có phần tử tương tác nào), trả về đúng trigger khi đóng (Design System Spec §14.3 "Focus không bao giờ biến mất"). `Esc` đóng trừ khi `closeOnOverlayClick=false` kèm hành động phá hủy (vẫn cho `Esc`, chỉ chặn click nền — UI Spec §9.5).

### 8.10. Responsive Behavior

Dưới `sm`, **mọi** Modal (trừ đã `size="sm"`) tự động chuyển `fullscreen` (UI Spec §9.5 — tránh Modal nhỏ nổi giữa màn hình bé). Đây là hành vi responsive **tự động, không cấu hình được qua prop** (khác `Select`'s native/custom cũng tự động nhưng do khác biệt nền tảng — ở đây do khác biệt kích thước màn hình thuần túy).

### 8.11. Theme Support

`bg-surface` (nền Modal), `bg-overlay` (backdrop, tái sử dụng token M4), `shadow-level-3` (Design System Spec §7.1) — đã có sẵn Light/Dark.

### 8.12. Performance Considerations

Enter/exit animation dùng Framer Motion **có thể chấp nhận được** ở đây (khác Spinner/Skeleton) — UI Spec §19.2 liệt Modal enter/exit là 1 trong số ít trường hợp hợp lệ dùng Framer Motion (animation phức tạp hơn CSS transition đơn thuần, kèm phối hợp exit-animation-trước-khi-unmount, mục 8.7). Focus trap logic (mục 0.4) chạy `useEffect` khi mount — chi phí thấp, chỉ 1 Modal mở tại 1 thời điểm (mục 8.8) nên không có rủi ro nhân bản listener.

### 8.13. Testing Checklist

Component: 2 variant × 4 size. Accessibility: focus trap thật (Tab liên tục không thoát ra ngoài Modal — test dài hơn bình thường, cần mô phỏng nhiều lần Tab); focus vào đúng khi mở, trả đúng khi đóng; `Esc` đóng đúng theo `closeOnOverlayClick`. Interaction: click overlay đóng/không đóng đúng theo prop; click nội dung bên trong Modal không đóng nhầm (event bubbling cần chặn đúng chỗ). Responsive: `fullscreen` tự động dưới `sm` (Playwright, giống cách M4/M5 đã làm cho hành vi chỉ quan sát được ở viewport thật). Animation: exit animation chạy xong mới unmount (test bằng `waitFor` xác nhận DOM còn tồn tại ngay sau khi gọi đóng, biến mất sau khi animation kết thúc).

### 8.14. Common Mistakes

Tắt/bỏ qua focus trap "vì phức tạp" — vi phạm accessibility nghiêm trọng nhất có thể xảy ra ở component này; quên trả focus về trigger khi đóng (lỗi rất dễ mắc, hậu quả nặng nề với người dùng bàn phím/screen reader); cho phép lồng Modal trong Modal.

### 8.15. Future Extensibility

`Drawer` (Sprint sau, không thuộc M6) sẽ **tái sử dụng engine focus-trap** đã tách ở đây (mục 0.4) — thiết kế Modal ở M6 cần cố ý giữ phần lõi focus-trap tách biệt khỏi phần trình bày (vị trí giữa màn hình, animation fade) để `Drawer` (trượt cạnh, animation slide) dùng lại được phần lõi mà không viết lại từ đầu — đúng tinh thần "chuẩn bị trước phần tách được" đã áp dụng nhất quán từ `Select` (M5) tới đây.

---

*Hết tài liệu. Micro Component Specification M6 này hoàn thiện bộ 16 component Shared UI Library của Sprint F1 (8 Form Control từ M5 + 8 Display/Feedback/Overlay từ M6) — cùng với đó, khép lại 2 khoản nợ kỹ thuật đã ghi nhận có tên từ M5 (mục 0.6). Mọi quyết định trong tài liệu này đã đối chiếu với 4 tài liệu đã đóng băng và Micro Spec M5; điểm duy nhất cần lưu ý khi code hóa là làm rõ Dialog↔Modal (mục 8.0) đã xử lý ngay từ đầu tài liệu để không gây nhầm lẫn khi đọc.*
