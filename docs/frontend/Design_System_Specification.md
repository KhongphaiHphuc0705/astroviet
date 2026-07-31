# Design System Specification — AstroViet

**Phiên bản:** 1.0
**Trạng thái:** Draft — dựa trên Frontend UI Specification (Frozen) và Frontend Architecture Specification (Frozen)
**Phạm vi:** Nguyên tắc quản trị, ngữ pháp thiết kế, và bộ quy tắc chi phối toàn bộ Design System — **không** phải bảng liệt kê lại chi tiết từng token/component
**Không thuộc phạm vi:** Business page, code implementation, chi tiết React-specific

> Tài liệu này trả lời câu hỏi khác với 2 tài liệu trước: Frontend UI Specification định nghĩa **"component X trông như thế nào, có props/variant gì"**; Frontend Architecture Specification định nghĩa **"code được tổ chức ra sao"**; tài liệu này định nghĩa **"quy tắc nào khiến mọi component, dù do ai thiết kế ở bất kỳ thời điểm nào, vẫn thuộc về cùng 1 hệ thống nhất quán"**. Đây là **ngữ pháp** (grammar) của Design System — Frontend UI Specification là **từ điển** (dictionary) áp dụng ngữ pháp đó.
>
> Tài liệu này **công nghệ-trung lập** (technology-agnostic) ở mức tối đa có thể — không nhắc tới React, Tailwind, hay bất kỳ chi tiết implementation nào; những chi tiết đó thuộc Frontend Architecture Specification.

---

## Mục lục

1. [Design System Goals & Principles](#1-design-system-goals--principles)
2. [Design Tokens](#2-design-tokens)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing System](#5-spacing-system)
6. [Radius](#6-radius)
7. [Shadows](#7-shadows)
8. [Motion](#8-motion)
9. [Iconography](#9-iconography)
10. [Component Foundation](#10-component-foundation)
11. [Layout Components](#11-layout-components)
12. [Form Design](#12-form-design)
13. [Responsive Design](#13-responsive-design)
14. [Accessibility](#14-accessibility)
15. [Theming Strategy](#15-theming-strategy)
16. [Component Lifecycle](#16-component-lifecycle)
17. [Design Tokens Governance](#17-design-tokens-governance)
18. [Future Extensibility](#18-future-extensibility)

---

## 1. Design System Goals & Principles

### 1.1. Định vị: Design System là một sản phẩm nội bộ, không phải phụ lục

AstroViet Design System được đối xử như **1 sản phẩm có vòng đời riêng** (proposal → review → version → deprecate, mục 16), phục vụ "khách hàng nội bộ" là chính codebase Frontend. Nó **không** là tập hợp component ngẫu nhiên tích lũy theo nhu cầu từng trang — mọi component đều bắt nguồn từ cùng 1 bộ token và cùng 1 bộ quy tắc hành vi.

### 1.2. Triết lý thiết kế

Triết lý thị giác đầy đủ ("Ephemeris Instrument", "The Ring", 6 nguyên tắc cốt lõi) đã được đặc tả tại **UI Spec §1** — tài liệu này không lặp lại, chỉ trích xuất **hệ quả quản trị** của triết lý đó:

| Nguyên tắc UI Spec §1 | Hệ quả quản trị (Design System) |
|---|---|
| "Dữ liệu là trung tâm" | Mọi Component Foundation (mục 10) ưu tiên khả năng hiển thị dữ liệu chính xác hơn hiệu ứng thị giác — token số liệu (mono, tabular) là công dân hạng nhất, không phải ngoại lệ |
| "Ít màu, có chủ đích" | Semantic Color Role (mục 3) giới hạn nghiêm ngặt số lượng vai trò màu — thêm 1 màu mới vào hệ thống phải qua Token Governance (mục 17), không phải quyết định tùy hứng khi làm 1 component |
| "Không sao chép, chỉ học triết lý" | Component Lifecycle (mục 16) yêu cầu mọi component mới phải giải thích **tại sao token/component hiện có không đủ** trước khi được duyệt — chống "mượn tạm" ý tưởng từ nơi khác mà không tích hợp vào hệ thống |

### 1.3. Sáu trụ cột

| Trụ cột | Định nghĩa vận hành trong AstroViet |
|---|---|
| **Consistency** | 1 khái niệm (spacing, màu, radius...) chỉ có 1 tên token duy nhất trong toàn hệ thống — không có 2 token khác tên cùng giá trị, không có giá trị hardcode song song với token đã tồn tại |
| **Accessibility** | Accessibility là **thuộc tính bắt buộc của baseline component** (mục 10.1), không phải checklist thêm vào cuối — 1 component chưa đạt baseline a11y coi như chưa hoàn thành, không phải "hoàn thành, cần polish thêm" |
| **Reusability** | Tỷ lệ tái sử dụng đo bằng "component ở tầng Primitive có bao nhiêu nơi gọi" — component chỉ dùng đúng 1 chỗ duy nhất là tín hiệu nó nên ở tầng Feature-specific, không nên vào Design System |
| **Scalability** | Thêm 1 theme mới, 1 platform mới, hay hàng chục component domain mới (Chart, Interpretation...) không được đòi hỏi sửa lại token/component nền tảng đã có — chỉ được **thêm**, không **sửa cấu trúc** |
| **Maintainability** | Mọi quyết định thiết kế có lý do bằng văn bản (đúng tinh thần Architecture Spec §1.3) — Design System không có quy tắc "vì trước giờ vẫn làm vậy" mà không truy được nguồn gốc |
| **Predictability** *(bổ sung ngoài 5 mục yêu cầu, vì đây là hệ quả trực tiếp của Reusability+Consistency)* | Người thiết kế/code 1 component mới có thể **đoán đúng** tên token, tên variant, cấu trúc state cần dùng chỉ bằng cách nhìn component tương tự đã có — không cần hỏi lại |

---

## 2. Design Tokens

### 2.1. Kiến trúc 3 lớp (nhắc lại khung, không lặp giá trị — xem UI Spec §2 cho registry đầy đủ)

```
Global Tokens        — giá trị thô, không mang ý nghĩa ngữ cảnh (ví dụ #C08A3E)
        ↓
Semantic Tokens       — ý nghĩa vai trò, đổi theo theme (ví dụ "màu accent chính")
        ↓
Component Tokens      — áp dụng cho 1 component cụ thể khi semantic không đủ đặc tả
```

Đây **không** phải 1 tầng kỹ thuật (CSS variable) mà là **1 mô hình tư duy bắt buộc** khi ra quyết định: bất kỳ ai muốn thêm 1 giá trị thiết kế mới phải tự hỏi theo đúng thứ tự — "Đây có phải giá trị hoàn toàn mới (Global)? Hay 1 vai trò mới của giá trị đã có (Semantic)? Hay chỉ 1 component cụ thể cần khác biệt (Component)?" — bỏ qua bước nào cũng dẫn tới token trùng lặp không kiểm soát được.

### 2.2. Chiến lược đặt tên (Naming Strategy)

**Cấu trúc bắt buộc**: `--{layer-hint}-{category}-{concept}-{modifier?}`

| Quy tắc | Ví dụ đúng | Ví dụ sai và lý do |
|---|---|---|
| Semantic token đặt tên theo **vai trò**, không theo **giá trị** | `color-accent-primary` | `color-brass` (rò rỉ giá trị Global vào tên Semantic — nếu sau này đổi màu accent sang không phải brass nữa, tên token trở nên sai nghĩa) |
| Global token đặt tên theo **chất liệu/nguồn cảm hứng**, không theo **số thứ tự vô nghĩa** | `brass-500` | `color-1`, `primary-3` (không tự giải thích, không nhất quán với triết lý §1.2) |
| Component token chỉ tồn tại khi Semantic **thực sự không đủ** — không tạo mặc định | `button-bg-primary-pressed` (nếu trạng thái `pressed` cần giá trị khác biệt riêng không suy ra được từ semantic) | Tạo `card-padding` riêng khi `space-6` (Semantic/Global) đã hoàn toàn đủ dùng |
| Modifier (state/variant) luôn ở cuối, dùng từ vựng chung (mục 10.1), không tự chế | `input-border-error` | `input-border-red-warning-ish` |

### 2.3. Vì sao 3 lớp, không phải 2 hay 4

- **2 lớp (bỏ Component)** không đủ khi 1 component cần 1 giá trị rất đặc thù mà đưa lên Semantic sẽ làm ô nhiễm vai trò dùng chung (ví dụ padding riêng của `Toast` không nên trở thành 1 Semantic Spacing Token dùng chung).
- **4 lớp** (thêm 1 tầng "Alias" giữa Global/Semantic như UI Spec §2.1 có nhắc sơ) — trong thực tế Alias **chính là** Semantic ở cách gọi khác; tài liệu này gộp lại còn 3 lớp để tránh khái niệm trùng lặp giữa 2 tài liệu.

---

## 3. Color System

### 3.1. Bảng vai trò ngữ nghĩa chuẩn (Semantic Color Role Contract)

Đây là **lớp hợp đồng vai trò** (semantic role contract) — cách gọi tên chuẩn ngành cho hệ thống màu, ánh xạ xuống token cụ thể đã chọn ở UI Spec §3. Mọi component **chỉ được phép** tham chiếu tới **cột "Vai trò"**, không bao giờ tham chiếu trực tiếp tên Global Token (`brass-500`) — đây là ranh giới quan trọng nhất của mục này.

| Vai trò | Ánh xạ tới UI Spec §3 | Ghi chú ngữ nghĩa |
|---|---|---|
| **Primary** | `color-accent-primary` (`brass-500`/`brass-400` Dark) | Hành động chính, CTA, điểm nhấn số liệu quan trọng nhất trên màn hình |
| **Secondary** | `color-accent-secondary` (`indigo-600`/`indigo-400` Dark) | Hành động phụ, link, trạng thái selected — **không** phải "Primary nhạt hơn", mà là 1 vai trò độc lập |
| **Accent** | *Không tách biệt khỏi Primary trong AstroViet* | Xem 3.2 — quyết định có chủ đích, không phải thiếu sót |
| **Neutral** | Ramp `slate-*`, `ink-*` | Text, border, icon mặc định — chiếm phần lớn diện tích giao diện (đúng nguyên tắc "ít màu") |
| **Surface** | `color-bg-surface`, `color-bg-surface-raised` | Nền của Card/Modal/Dropdown — luôn tương phản 1 bậc với Background |
| **Background** | `color-bg-canvas` | Nền toàn trang, ở dưới cùng của Surface |
| **Border** | `color-border-subtle`, `color-border-strong` | 2 cường độ — `subtle` cho phân tách nhẹ, `strong` cho ranh giới cần chú ý (input focus-adjacent, table header) |
| **Success** | `color-success` | Xác nhận, hoàn thành |
| **Warning** | `color-warning` | Cảnh báo, cần chú ý nhưng chưa chặn |
| **Error** (Danger) | `color-danger` | Lỗi, hành động phá hủy |
| **Info** | `color-info` | Thông tin trung tính |

> Bảng này **không** liệt lại giá trị hex (xem UI Spec §3.3–3.4) — mục đích duy nhất là cố định **tên vai trò chuẩn** để mọi thảo luận thiết kế trong tương lai (kể cả khi mở rộng team) dùng chung 1 từ vựng, tránh tình trạng người gọi "màu chính", người gọi "màu thương hiệu", người gọi "màu cam" cho cùng 1 token.

### 3.2. Vì sao "Accent" không tách khỏi "Primary"

Nhiều Design System (Material, hầu hết bộ token phổ thông) tách `Primary` và `Accent` thành 2 vai trò màu khác nhau. AstroViet **cố tình gộp lại** — đây là quyết định thiết kế có lý do, không phải thiếu vai trò: nguyên tắc "ít màu, có chủ đích" (UI Spec §1.2, §3.6 — tối đa 2 accent/màn hình) sẽ bị phá vỡ ngay từ tầng token nếu hệ thống có 3 màu nhấn độc lập (Primary/Secondary/Accent) thay vì 2 (Primary/Secondary). Nếu tương lai phát sinh nhu cầu thực sự cho vai trò `Accent` tách biệt (ví dụ 1 tính năng cần nhấn mạnh khác hẳn CTA chính), đây phải đi qua Token Governance (mục 17) như 1 thay đổi có chủ ý, không tự phát sinh trong lúc code 1 component.

### 3.3. Element Colors và Aspect Colors — vai trò thứ 3 nằm ngoài bảng chuẩn

UI Spec §3.5 và §12.11 định nghĩa 2 bộ màu **mã hóa dữ liệu domain** (Element: Lửa/Đất/Khí/Nước; Aspect: Harmonious/Tense/Neutral) — các bộ màu này **không thuộc** Semantic Color Role Contract ở mục 3.1, vì chúng không biểu thị trạng thái UI (thành công/lỗi/nhấn mạnh) mà biểu thị **giá trị dữ liệu chiêm tinh**. Quy tắc quản trị riêng cho nhóm này: **không thêm role UI mới** (Success/Warning...) bằng cách tái sử dụng màu domain, và ngược lại — 2 hệ thống màu này luôn tách biệt, kể cả khi tình cờ trùng sắc độ.

### 3.4. Nguyên tắc sử dụng xuyên suốt (áp dụng mọi component, không lặp lại per-component ở mục 10)

1. Không component nào tự định nghĩa màu ngoài 11 vai trò ở mục 3.1 (+ 2 hệ màu domain mục 3.3 khi thực sự hiển thị dữ liệu chiêm tinh).
2. Contrast tối thiểu 4.5:1 (text)/3:1 (icon, text lớn) là **điều kiện chấp nhận** của Component Lifecycle (mục 16.3), không phải gợi ý.
3. Màu không bao giờ là kênh thông tin duy nhất (nhắc lại nguyên tắc UI Spec §3.6/§17.2 ở cấp quản trị: đây là tiêu chí review bắt buộc, không phải khuyến nghị).

---

## 4. Typography

### 4.1. Vai trò 3 họ font (nhắc khung, xem UI Spec §4.1 cho font cụ thể và fallback stack)

| Vai trò trừu tượng | Áp dụng cho |
|---|---|
| **Display** | Tiêu đề, số liệu hero — ưu tiên tính cách thương hiệu hơn tính trung tính |
| **UI** | Toàn bộ giao diện, body text — ưu tiên độ đọc, trung tính tuyệt đối |
| **Data** | Số liệu cần căn cột chính xác — ưu tiên tabular, độ rộng ký tự đều |

**Quy tắc quản trị**: 1 họ font chỉ được thêm vào hệ thống khi phục vụ **1 trong 3 vai trò trên và không vai trò nào hiện có đáp ứng được** — không thêm font vì lý do thẩm mỹ đơn lẻ cho 1 component.

### 4.2. Type Scale — nguyên tắc tỷ lệ, không liệt lại từng bậc

Type Scale (UI Spec §4.2) tuân theo tỷ lệ **Major Third (1.25)** cố định. Quy tắc quản trị: **mọi kích thước chữ mới phải khớp 1 bậc trong thang có sẵn** — không tạo `font-size` tùy ý (`17.5px`, `21px`...) cho 1 nhu cầu cụ thể. Nếu 1 component thực sự cần kích thước nằm giữa 2 bậc, đây là tín hiệu cần xem lại thiết kế component đó, không phải lý do phá vỡ thang đo.

### 4.3. Font Weight — từ vựng đóng (closed vocabulary)

Chỉ 4 giá trị (`regular`/`medium`/`semibold`/`bold`, UI Spec §4.3) — **đóng**, không mở rộng thêm (`light`, `extrabold`...) trừ khi qua Token Governance. Lý do: mỗi weight thêm vào là 1 file font subset cần tải thêm (ảnh hưởng Performance Strategy — Architecture Spec §11), chi phí không tương xứng lợi ích thẩm mỹ biên.

### 4.4. Line Height & Letter Spacing — quy tắc, không phải bảng số

- **Line-height** tối thiểu 1.5 cho mọi body text (bắt buộc vì tiếng Việt có dấu thanh, UI Spec §4.4) — đây là **sàn cứng** (hard floor), component nào cần line-height thấp hơn cho mục đích thị giác (ví dụ Badge 1 dòng) phải chứng minh không chứa văn bản tiếng Việt dài/nhiều dấu trước khi được duyệt ngoại lệ.
- **Letter-spacing âm bị cấm tuyệt đối** trên mọi token, mọi component, không có ngoại lệ (khác line-height — đây không phải sàn mà là **cấm hoàn toàn**, do rủi ro dấu thanh chồng ký tự là lỗi hiển thị, không phải vấn đề thẩm mỹ).

### 4.5. Numeric Typography — hợp đồng bắt buộc

`tabular-nums` là thuộc tính **bắt buộc** (không phải mặc định có thể tắt) trên Token Data-role (mục 4.1) — bất kỳ component nào hiển thị số liệu domain (độ, orb, giờ, ngày) mà không dùng Data token là vi phạm Component Foundation baseline (mục 10.1), bị chặn ở Component Lifecycle review (mục 16.3).

### 4.6. Responsive Typography — nguyên tắc `clamp()`, không lặp cặp giá trị

Các bậc `display-*`/`heading-*` co giãn bằng hàm nội suy liên tục giữa 2 mốc desktop/mobile (giá trị cụ thể ở UI Spec §4.2) — quy tắc quản trị: **không** dùng breakpoint rời rạc (`font-size` nhảy bậc đột ngột tại `md`) cho Display/Heading, vì gây giật khi resize; Body/Data token **không** cần responsive (cố định, vì đã đủ nhỏ để không cần co giãn — co giãn thêm chỉ gây bất nhất giữa các màn hình khi so sánh số liệu).

---

## 5. Spacing System

### 5.1. Thang đo — nguyên tắc bội số, không lặp bảng giá trị (xem UI Spec §6.1)

Toàn bộ spacing dựa trên **lưới 4px** — mọi khoảng cách trong hệ thống, dù mới thêm sau này, phải là bội số của 4px. Đây là ràng buộc cứng: không có "khoảng cách đặc biệt 15px" cho bất kỳ nhu cầu nào — nếu 16px (`space-4`) quá lớn và 12px (`space-3`) quá nhỏ cho 1 tình huống, đó là tín hiệu cần xem lại bố cục, không phải lý do phá lưới.

### 5.2. Layout Rhythm (nhịp điệu bố cục)

"Rhythm" trong Design System nghĩa là: **cùng 1 cấp độ quan hệ giữa các phần tử luôn dùng cùng 1 khoảng cách**, xuyên suốt toàn hệ thống — không phải mỗi trang tự quyết định khoảng cách riêng. AstroViet định nghĩa 3 cấp nhịp điệu cố định:

| Cấp nhịp điệu | Khoảng cách | Áp dụng |
|---|---|---|
| **Micro** (bên trong 1 component) | `space-1`–`space-4` | Padding nội bộ Button/Input/Badge |
| **Meso** (giữa các phần tử liên quan trong 1 nhóm) | `space-4`–`space-6` | Khoảng cách giữa field trong cùng 1 form section |
| **Macro** (giữa các section độc lập trên trang) | `space-12`–`space-24` | Khoảng cách giữa `PageHeader` và nội dung, giữa 2 section |

**Quy tắc quan trọng nhất của mục này**: khoảng cách **không bao giờ giảm dần khi đi từ Macro xuống Micro một cách tùy tiện** — nếu 1 thiết kế mới cần khoảng cách "ở giữa" 2 cấp (ví dụ 8px giữa 2 section, thay vì tối thiểu 48px của Macro), đây luôn là dấu hiệu 2 phần tử đó thực ra thuộc cùng 1 nhóm Meso, cần thiết kế lại thành 1 khối, không phải hạ cấp khoảng cách Macro xuống.

### 5.3. Density Mode — governance, không lặp lại quy tắc bảng đã có ở UI Spec §6.2

`comfortable`/`compact` (đã định nghĩa cho bảng dữ liệu ở UI Spec §6.2) là **biến thể spacing được kiểm soát duy nhất** được phép tồn tại song song trong hệ thống — không component nào khác được tự tạo "chế độ mật độ" riêng của nó; nếu 1 component ngoài bảng dữ liệu cần density, nó phải tái sử dụng đúng 2 giá trị `comfortable`/`compact` đã có, không định nghĩa cặp giá trị mới.

---

## 6. Radius

### 6.1. Thang đo Radius (định nghĩa mới — chưa có trong UI Spec)

| Token | Giá trị | Triết lý |
|---|---|---|
| `radius-none` | 0px | Bảng dữ liệu dày đặc (`PlanetTable`/`AspectTable` ở chế độ bảng thật, không phải card mobile) — giữ cảm giác lưới số liệu chính xác |
| `radius-sm` | 4px | Input, Badge, Button `sm` — đủ mềm để không "sắc" như broadsheet báo in, nhưng vẫn giữ tinh thần instrument |
| `radius-md` | 8px | Button mặc định, Card, Modal, Dropdown — **giá trị mặc định của hệ thống** khi không có lý do dùng bậc khác |
| `radius-lg` | 12px | Card `raised` nổi bật (Pattern Card, UI Spec §12.7), Popover |
| `radius-full` | 9999px | Avatar, Switch track, Pill Badge/Tab — chỉ dùng cho hình khối có chủ đích tròn hoàn toàn, không dùng như "radius lớn nhất có thể" cho hình chữ nhật |

### 6.2. Nguyên tắc chọn bậc radius

AstroViet **cố tình không dùng radius lớn** (16px+) ở bất kỳ đâu ngoài `radius-full` — đây là quyết định thẩm mỹ nối tiếp trực tiếp triết lý "Ephemeris Instrument" (UI Spec §1.1): radius lớn tạo cảm giác "app tiêu dùng mềm mại" (kiểu mobile app phổ thông), trong khi AstroViet cần cảm giác "dụng cụ chính xác". Đồng thời AstroViet **không dùng `radius-none` toàn hệ thống** (khác phong cách "broadsheet zero-radius" thuần túy) — chỉ dùng `none` có chủ đích cho bảng số liệu, giữ phần lớn UI ở `sm`/`md` để không lạnh lùng quá mức.

**Quy tắc bất biến**: 1 component chỉ dùng **đúng 1 bậc radius** cho mọi trạng thái/kích thước của nó (Button `sm`/`md`/`lg` đều `radius-sm`/`radius-md` tương ứng theo size, không đổi bậc radius theo variant màu). Radius không bao giờ là tín hiệu phân biệt variant.

---

## 7. Shadows

### 7.1. Hệ thống Elevation (định nghĩa mới — chưa có trong UI Spec, đồng bộ với thang z-index Architecture Spec §16.3)

Shadow trong AstroViet biểu thị **độ cao (elevation)**, tương ứng trực tiếp với thang z-index đã định nghĩa — mỗi mức z-index có đúng 1 mức shadow đi kèm, không tách rời:

| Elevation | Shadow (giá trị tham khảo) | Ứng với z-index (Architecture Spec §16.3) | Component |
|---|---|---|---|
| **Level 0** — Flat | *Không shadow, chỉ `border-subtle`* | — | Card `default`, Input, mọi phần tử nằm phẳng trên Canvas/Surface |
| **Level 1** — Raised | `0 1px 3px rgba(27,32,54,0.08)` | `z-dropdown` (1000) | Card `raised`, Dropdown menu |
| **Level 2** — Floating | `0 4px 12px rgba(27,32,54,0.10)` | `z-drawer`/`z-popover` (1200/1400) | Popover, Tooltip, Drawer |
| **Level 3** — Overlaid | `0 8px 24px rgba(27,32,54,0.14)` | `z-modal` (1310) | Modal |
| **Level 4** — Alert | `0 12px 32px rgba(27,32,54,0.18)` | `z-toast` (1500) | Toast |

*(Giá trị `rgba` ở Dark Mode dùng alpha cao hơn tương ứng — `rgba(0,0,0,...)` với opacity tăng ~1.5 lần mỗi bậc, vì shadow ít nhìn thấy hơn trên nền tối; giá trị chính xác thuộc phạm vi implementation, không chốt cứng ở tài liệu governance này.)*

### 7.2. Nguyên tắc

1. **Elevation càng cao, blur/spread càng lớn nhưng opacity không tăng tuyến tính** (giữ bảng trên) — mô phỏng đúng vật lý ánh sáng (vật càng xa nền, bóng càng lan tỏa nhưng càng nhạt ở rìa), tránh shadow "nặng" giả tạo.
2. **Không 2 mức elevation nào dùng chung giá trị shadow** — nếu 1 component mới "cảm thấy cần shadow riêng", nó phải map vào 1 trong 5 mức đã có (kể cả Level 0), không tạo mức thứ 6.
3. Shadow **không bao giờ dùng để mô phỏng trạng thái tương tác** (không có "shadow khi hover" như dùng phổ biến ở nhiều Design System khác) — trạng thái hover/active của AstroViet dùng thay đổi màu nền/viền (mục 10), giữ shadow thuần túy cho ý nghĩa elevation, tránh 2 ngôn ngữ thị giác chồng chéo nhau cho 2 khái niệm khác nhau (độ cao vs. tương tác).

---

## 8. Motion

### 8.1. Duration & Easing — nhắc khung, xem UI Spec §19.3 cho token cụ thể

4 mức duration (`fast`/`base`/`slow`/`deliberate`) và 3 easing curve đã định nghĩa ở UI Spec §19.3. Quy tắc quản trị bổ sung: **duration tỷ lệ thuận với "khoảng cách di chuyển/thay đổi thị giác"**, không tỷ lệ thuận với "mức độ quan trọng của hành động" — 1 lỗi thường gặp là kéo dài animation cho hành động "quan trọng" (ví dụ xóa dữ liệu) nhằm gây chú ý; AstroViet không làm vậy — mức độ nghiêm trọng của hành động truyền tải qua màu (`variant="danger"`, mục 10) và nội dung xác nhận (Modal), không qua kéo dài thời gian animation.

### 8.2. Transition Principles (nguyên tắc chuyển động)

1. **Có chủ đích, trả lời được "animation này giúp hiểu điều gì đang xảy ra"** (nhắc lại UI Spec §19.1 ở cấp quy tắc bắt buộc, không phải gợi ý phong cách).
2. **Không đổi quá 2 thuộc tính CSS cùng lúc** cho 1 transition đơn (ví dụ chỉ `opacity`+`transform`, không thêm `color`+`background`+`border` cùng lúc) — giữ chuyển động "đọc được", tránh cảm giác hỗn loạn.
3. **Exit animation luôn nhanh hơn hoặc bằng Enter animation**, không bao giờ chậm hơn — người dùng không nên phải chờ 1 phần tử biến mất lâu hơn thời gian nó xuất hiện.
4. **`prefers-reduced-motion` là input bắt buộc của mọi component có animation**, không phải tính năng tùy chọn thêm sau (baseline, mục 10.1) — 1 component animate mà chưa xử lý reduced-motion là chưa đạt Component Lifecycle review (mục 16.3).

### 8.3. Loading Animation — 2 ngôn ngữ riêng biệt, không hoán đổi cho nhau

| Ngôn ngữ | Dùng khi | Không dùng khi |
|---|---|---|
| **Skeleton** (shimmer/pulse, giữ nguyên hình dạng layout — UI Spec §9.3, §18.2) | Đã biết trước **hình dạng** nội dung sắp tới (bảng, card, text nhiều dòng) | Không biết trước hình dạng, hoặc thời gian chờ quá ngắn (< 300ms — dưới ngưỡng này Skeleton gây nháy hình khó chịu hơn là hữu ích) |
| **Spinner** (The Ring quay — UI Spec §9.3) | Hành động rời rạc (submit, chuyển trang) không có "hình dạng nội dung" để giữ chỗ | Vùng nội dung lớn có thể phác thảo trước layout (khi đó luôn ưu tiên Skeleton) |

**Quy tắc governance**: Skeleton là **mặc định ưu tiên** — Spinner chỉ là fallback khi Skeleton không khả thi (đúng thứ tự ưu tiên đã ngầm định ở UI Spec §18.2, nay nêu tường minh thành quy tắc bắt buộc, không phải lựa chọn ngang hàng).

---

## 9. Iconography

### 9.1. Nguồn icon — nhắc khung, xem UI Spec §5 cho chi tiết

Lucide React là nguồn **duy nhất** cho icon giao diện; ký hiệu chiêm tinh Unicode/glyph là nguồn **duy nhất** cho biểu tượng domain (hành tinh/cung/aspect). Quy tắc quản trị: **cấm tuyệt đối trộn 2 icon set khác nhau** cho cùng 1 khái niệm (ví dụ không dùng icon Lucide "star" thay cho glyph ♈ ở bất kỳ đâu, dù tình huống gấp) — vi phạm nguyên tắc Consistency (mục 1.3) ở mức dễ nhận ra nhất với người dùng.

### 9.2. Kích thước & Stroke Width — nhắc khung (UI Spec §5.2–5.3)

5 bậc size (`xs`–`xl`), stroke-width cố định 1.5px toàn cục. Quy tắc bổ sung: **stroke-width không đổi theo size** (khác cách nhiều icon set tự động dày stroke khi icon nhỏ) — giữ tính "instrument mảnh mai" nhất quán ở mọi kích thước, kể cả `icon-xs` 14px.

### 9.3. Semantic Icon Dictionary (từ điển icon theo ngữ nghĩa — governance mới)

Để tránh "trôi nghĩa icon" (icon drift — cùng 1 icon dùng cho 2 nghĩa khác nhau ở 2 nơi, hoặc 2 icon khác nhau dùng cho cùng 1 hành động), AstroViet cố định 1 bộ ánh xạ **hành động → icon**, áp dụng cho mọi component/feature tương lai:

| Hành động/Khái niệm | Icon cố định | Không dùng cho việc khác |
|---|---|---|
| Xóa (destructive) | `trash` | Không dùng cho "loại bỏ khỏi danh sách yêu thích" (dùng `x` hoặc toggle riêng) |
| Đóng overlay (Modal/Drawer/Toast) | `x` | Không dùng cho "Xóa dữ liệu" |
| Mở rộng/thu gọn (Accordion, Dropdown chỉ báo) | `chevron-down` (xoay 180° khi mở) | Không dùng `arrow-down` (dành riêng cho "sắp xếp giảm dần") |
| Cảnh báo | `alert-triangle` | Không dùng cho Error (dùng `alert-circle` hoặc `x-circle`, tách biệt Warning/Error dù cùng họ "alert") |
| Thông tin thêm (Tooltip/Popover trigger, UI Spec §12.5) | `info` (icon tròn "i") | — |
| Nghịch hành (Retrograde) | **Không phải icon Lucide** — ký hiệu domain `℞` (glyph, cùng họ với glyph hành tinh) | Không thay bằng icon "rotate"/"refresh" của Lucide dù ẩn dụ gần đúng — giữ nhất quán với nhóm ký hiệu domain (mục 9.1) |

Từ điển này **mở rộng được** (thêm hành động mới khi phát sinh) nhưng **không sửa ánh xạ đã có** mà không qua Token/Component Governance (mục 16–17) — vì đổi nghĩa 1 icon đã dùng rộng rãi là thay đổi phá vỡ (breaking change) về mặt nhận thức người dùng, tương đương đổi giá trị 1 token màu.

---

## 10. Component Foundation

> Mục này **không** liệt lại Props/Variants/Sizes chi tiết từng component (đã đầy đủ ở UI Spec §9) — nó định nghĩa **Universal Component Contract**: baseline mọi component interactive phải thỏa mãn, và từ vựng variant/state dùng chung. Mỗi component dưới đây chỉ mô tả **ngoại lệ hoặc quy tắc composition đặc thù** so với baseline — nếu không có ghi chú ngoại lệ, nghĩa là component đó tuân thủ baseline hoàn toàn.

### 10.1. Universal Component Contract (áp dụng cho MỌI component tương tác)

| Hạng mục | Yêu cầu baseline |
|---|---|
| **State bắt buộc tối thiểu** | `default`, `hover`, `focus-visible`, `disabled` — component nào thiếu bất kỳ state nào trong 4 state này (khi state đó có ý nghĩa với component — ví dụ `Badge` không tương tác nên miễn `hover`/`focus`) coi như chưa đạt baseline |
| **State bổ sung có điều kiện** | `loading` (nếu component có hành động bất đồng bộ), `error`/`success` (nếu component nhận input), `selected` (nếu component thuộc nhóm lựa chọn) |
| **Sizing scale dùng chung** | `sm`/`md`/`lg` — mọi component có khái niệm "kích thước" phải dùng đúng 3 tên này theo đúng thứ tự tăng dần, không tự đặt tên khác (`small`/`large`, `compact`/`spacious`...) |
| **Variant vocabulary dùng chung** | `primary`/`secondary`/`ghost`/`outline`/`danger` — component nào cần phân biệt biến thể trực quan phải chọn từ danh sách này trước, chỉ thêm tên mới khi không khái niệm nào ở trên diễn tả đúng ý nghĩa (governance mục 16) |
| **Accessibility baseline** | Dùng đúng phần tử ngữ nghĩa gốc (native element) khi có; ARIA chỉ bổ sung khi ngữ nghĩa gốc không đủ (nguyên tắc "First Rule of ARIA" — nhắc lại ở mục 14.4); `focus-visible` luôn dùng `color-focus-ring` (mục 3.1), không component nào tự định nghĩa focus ring riêng |
| **Token compliance** | Không hardcode giá trị màu/spacing/radius/shadow — 100% qua token (mục 2–7); vi phạm là điều kiện **chặn** Component Lifecycle review (mục 16.3), không phải góp ý |

### 10.2. Composition Rules chung

- **Primitive không compose Primitive khác cùng cấp phức tạp hóa** (ví dụ `Input` không tự chứa `Tooltip` bên trong — nếu cần Tooltip giải thích cạnh Input, đó là composition ở tầng gọi component, không phải trách nhiệm nội tại của `Input`).
- **Overlay (Tooltip/Popover/Dropdown/Modal/Drawer) dùng chung 1 engine positioning** (UI Spec §9.5) — đây là quy tắc composition bắt buộc: không component Overlay mới nào được viết logic positioning riêng.
- **Component nhận `children`/slot phải định nghĩa rõ slot nào bắt buộc, slot nào tùy chọn** — tránh tình trạng slot tùy chọn im lặng bị bỏ trống gây layout vỡ (ví dụ `Card` không có `header` vẫn phải giữ padding nhất quán, không co lại bất thường).

### 10.3. Ghi chú theo từng component (chỉ ngoại lệ/composition đặc thù — xem UI Spec §9 cho đặc tả đầy đủ)

| Component | Ghi chú governance (không lặp UI Spec) |
|---|---|
| **Button** | Nguồn variant chuẩn cho toàn hệ thống — mọi component khác có khái niệm "variant màu" phải tham chiếu đúng 5 tên đã dùng ở Button (mục 10.1), không phát minh biến thể riêng |
| **Input** | Baseline "error/success state" của mọi Form Control kế thừa từ đây — `Textarea`/`Select` không định nghĩa lại cách hiển thị lỗi, chỉ tái sử dụng pattern của `Input` |
| **Textarea** | Kế thừa 100% governance của `Input` (mục 4.4 sàn line-height áp dụng nghiêm ngặt hơn vì nội dung nhiều dòng) |
| **Select** | Là component **duy nhất** được phép tồn tại ở 2 hình thái hiển thị khác nhau tùy nền tảng (`native` trên mobile, custom trên desktop — UI Spec §9.2) — ngoại lệ có chủ đích với nguyên tắc "1 component = 1 hình thái", vì tận dụng UI hệ điều hành cho danh sách dài quan trọng hơn tính nhất quán thị giác tuyệt đối ở đây |
| **Checkbox** | Hit-area tối thiểu 44×44px là baseline accessibility bắt buộc cho **mọi control chọn nhỏ** (Radio, Switch cũng kế thừa quy tắc này), không riêng Checkbox |
| **Radio** | Biến thể `card` (UI Spec §9.2) là ví dụ điển hình của "Component Token" (mục 2.1) — khi Semantic không đủ (radio thường quá nhỏ để làm nổi bật lựa chọn quan trọng như House System), thêm 1 biến thể trực quan mới thay vì phá cấu trúc Radio gốc |
| **Switch** | Không bao giờ dùng khi hành động cần bước xác nhận (Submit) — ranh giới rõ với `Checkbox` trong Form: `Switch` = hiệu lực ngay, `Checkbox` = 1 phần của form chờ submit; nhầm lẫn 2 khái niệm này là lỗi composition, không phải lỗi thẩm mỹ |
| **Card** | Container trung lập nhất hệ thống — **không** được thêm ý nghĩa ngữ nghĩa domain vào chính `Card` (ý nghĩa domain luôn nằm ở tầng Composite bọc ngoài, ví dụ `PatternCard`, không sửa `Card` gốc để "biết" nó đang hiển thị Pattern) |
| **Badge** | Không tương tác — nếu 1 nhu cầu thiết kế muốn Badge "bấm được", đó không còn là Badge, phải dùng `Button variant="ghost" size="sm"` với hình thức tương tự, giữ đúng ranh giới "Badge = thông tin, Button = hành động" |
| **Alert** | Gắn liền trong luồng nội dung — không bao giờ dùng thay Toast (governance ranh giới rõ ở UI Spec §9.4, nhắc lại: Alert = cần chú ý nhưng người dùng vẫn chủ động ở lại trang, Toast = xảy ra 1 lần, tự biến mất) |
| **Modal** | Xem 10.4 — quan hệ với "Dialog" |
| **Dialog** | Xem 10.4 |
| **Toast** | Duy nhất trong hệ thống có `aria-live` khác nhau theo mức nghiêm trọng (`polite` mặc định, `assertive` cho `danger`) — không component Feedback nào khác có hành vi `aria-live` thay đổi động như vậy |
| **Tooltip** | Component **duy nhất** trong toàn hệ thống bị **ẩn hoàn toàn trên touch device** (UI Spec §9.5) — đây là ngoại lệ nền tảng lớn nhất trong Design System, ghi nhận rõ ở đây để không ai "sửa lại cho hiện trên mobile" mà không hiểu lý do (nội dung phải có đường dẫn thay thế qua Popover) |
| **Avatar** | Fallback `initials` không phải "trang trí thay ảnh" — nó mang thông tin thật (tên viết tắt), nên vẫn phải tuân `aria-label` đầy đủ như thể có ảnh (baseline accessibility, không miễn trừ) |
| **Divider** | Component duy nhất có biến thể mang tính "signature" (`ring`, mục 1.2 UI Spec §1.3) — quy tắc quản trị: biến thể `ring` **giới hạn tối đa 1 lần/màn hình** là ràng buộc cứng do Component Lifecycle enforce (mục 16.3), không phải gợi ý phong cách |
| **Spinner** | Hình dạng "The Ring" là **tài sản thương hiệu**, không phải style tùy chọn — không component loading nào khác được dùng hình dạng vòng tròn đầy đủ generic thay thế |
| **Skeleton** | Bắt buộc giữ đúng kích thước layout nội dung thật (mục 8.3) — 1 Skeleton không khớp kích thước nội dung thật sau khi load là lỗi Component Lifecycle review, gây Cumulative Layout Shift |

### 10.4. Modal và Dialog — làm rõ quan hệ

"Dialog" (trong yêu cầu tài liệu này) là **tên gọi mẫu hình tương tác** (ARIA Dialog Pattern) chứ không phải 1 component riêng biệt trong AstroViet. Hệ thống hiện có **2 component cụ thể hiện thực hóa mẫu hình Dialog**: `Modal` (xuất hiện giữa màn hình, dùng cho xác nhận/form ngắn) và `Drawer` (trượt từ cạnh màn hình, UI Spec §9.5) — cả 2 đều kế thừa chung 1 baseline accessibility của ARIA Dialog Pattern (`role="dialog"`, focus trap, `Esc` đóng, mục 10.1/14.3). AstroViet **không** có nhu cầu tạo thêm 1 component "Dialog" thứ 3 tách biệt — 2 hình thái hiện có đã bao phủ đầy đủ use-case; nếu tương lai phát sinh nhu cầu thực sự khác biệt (ví dụ Dialog không-blocking dạng inline), đây là ứng viên Component Lifecycle mới (mục 16), không phải đổi tên `Modal` thành `Dialog`.

---

## 11. Layout Components

> Đặc tả thị giác/props đầy đủ ở UI Spec §8 (Layout System), §9.1 (Container/Stack/Grid), §11 (Navbar/Footer/Sidebar/Breadcrumb/PageHeader/ContentContainer). Mục này định nghĩa **quy tắc lồng ghép (nesting rules)** — thứ chưa được nói rõ ở UI Spec.

### 11.1. Phân loại 2 nhóm Layout

| Nhóm | Thành viên | Đặc điểm |
|---|---|---|
| **Layout Primitives** (trung lập, không có hình dạng cố định) | `Container`, `Stack`, `Grid` | Dùng để **dựng** mọi Layout Component khác — không tự có style thị giác (không border, không background) |
| **Layout Components** (có hình dạng, vị trí cố định trong App Shell) | `Section`, `Header` (Navbar), `Sidebar`, `Footer`, `Page Layout` (App Shell tổng, UI Spec §8.2) | Có vị trí và vai trò cố định trong cấu trúc trang, được **dựng từ** Layout Primitives |

### 11.2. Quy tắc lồng ghép bắt buộc

1. **Layout Component không bao giờ dùng CSS bố cục viết tay** (flexbox/grid trực tiếp) — luôn dựng từ `Stack`/`Grid` (nhắc lại UI Spec §8.3 ở cấp bắt buộc, không phải khuyến nghị).
2. **`Section` (mới, làm rõ ở đây)**: là 1 Layout Component bọc `Container` + áp dụng khoảng cách Macro (mục 5.2) phía trên/dưới tự động — mọi block nội dung độc lập trên 1 trang (ví dụ mỗi tab-panel trong Chart Detail) nên là 1 `Section`, không tự thêm margin thủ công giữa các block.
3. **`Page Layout` (App Shell) là nút gốc duy nhất chứa `Header`/`Sidebar`/`Footer`/`ContentContainer`** — không Layout Component con nào (`Sidebar`, `Footer`...) được phép tự quyết định vị trí của chính nó (position/z-index) — vị trí luôn do `Page Layout` cha kiểm soát (đúng nguyên tắc "layout chỉ là khung chứa thụ động", Architecture Spec §6.5).
4. **`Grid` không lồng `Grid`** trực tiếp — nếu cần bố cục lưới trong 1 ô lưới lớn hơn, ô đó nên là 1 `Card` chứa `Stack`/`Grid` riêng, giữ ranh giới thị giác rõ ràng giữa 2 cấp lưới.

---

## 12. Form Design

### 12.1. Label — quy tắc bắt buộc

Mọi Form Control có nghĩa (không phải Checkbox đơn lẻ dạng "đồng ý điều khoản" đã tự chứa nghĩa trong text cạnh nó) **phải có Label hiển thị** — AstroViet **cấm** dùng `placeholder` làm Label thay thế (kể cả khi thiết kế "muốn gọn") vì placeholder biến mất khi người dùng gõ, gây mất ngữ cảnh, đặc biệt nghiêm trọng với trường có đơn vị/định dạng cụ thể (giờ sinh, tọa độ).

### 12.2. Required Fields — 1 quy ước duy nhất, không lẫn lộn

Trường bắt buộc đánh dấu bằng **dấu `*` đỏ ngay sau Label + `aria-required="true"`** — không dùng cách nào khác (không dùng chữ "(bắt buộc)" lặp lại ở mọi field vì gây rối mắt với form nhiều trường như Birth Form). Ngược lại, trường **không bắt buộc** trong 1 form mà đa số trường là bắt buộc thì đánh dấu "(tùy chọn)" — chọn đánh dấu nhóm thiểu số (dù là bắt buộc hay tùy chọn), không đánh dấu cả 2 nhóm cùng lúc.

### 12.3. Validation — thời điểm kích hoạt, thống nhất toàn hệ thống

**Validate khi rời trường (`onBlur`)**, không validate theo từng phím gõ (`onChange`) — trừ 1 ngoại lệ duy nhất được phép: xác nhận khớp giữa 2 trường liên quan (ví dụ "Xác nhận mật khẩu" so với "Mật khẩu") được phép validate theo `onChange` của trường thứ 2, vì lỗi ở đây chỉ có ý nghĩa khi so sánh động. Sau khi 1 trường đã hiện lỗi, có thể chuyển sang validate `onChange` **chỉ cho trường đó** để phản hồi ngay khi người dùng sửa (không bắt phải blur lại mới biết đã hết lỗi) — đây là pattern chuẩn, áp dụng thống nhất mọi form, không phải quyết định riêng của Birth Form hay Auth Form.

### 12.4. Error Display — 1 vị trí cố định

Lỗi field-level luôn hiển thị **ngay dưới control, trước help text nếu cả 2 cùng tồn tại** (lỗi quan trọng hơn hướng dẫn, nên đứng gần control hơn) — không hiện lỗi ở đầu form dạng danh sách tổng hợp **thay thế** cho lỗi inline (danh sách tổng hợp, nếu cần cho form rất dài, chỉ là **bổ sung** dẫn link nhảy tới field, không phải thay thế).

### 12.5. Help Text — ranh giới với Error

Help text (mô tả cách điền, ví dụ định dạng ngày) và Error text **dùng chung 1 vị trí, không hiện đồng thời** — khi Error xuất hiện, nó **thay thế** Help text tại vị trí đó (không xếp chồng 2 dòng), tránh form nhảy quá nhiều dòng nội dung reflow gây khó theo dõi. Ngoại lệ: nếu Help text mang thông tin không thể mất (ví dụ đơn vị đo bắt buộc phải nhớ), nó chuyển thành phần cố định trong Label/Adornment thay vì vùng Help text có thể bị Error ghi đè.

### 12.6. Disabled State — nhất quán baseline

Tuân thủ Universal Component Contract (mục 10.1): `opacity` giảm + `cursor: not-allowed`, không có ngoại lệ riêng cho từng loại Form Control. Quy tắc bổ sung riêng cho Form: **field `disabled` không bao giờ đồng thời `required`** về mặt UX hiển thị — nếu 1 field bắt buộc nhưng tạm thời không cho sửa (ví dụ email đã xác thực), dùng `readOnly` thay vì `disabled` (2 trạng thái này có ý nghĩa khác nhau: `readOnly` vẫn gửi giá trị khi submit và vẫn focus được để copy, `disabled` thì không — nhầm 2 khái niệm là lỗi thường gặp cần chặn ở review).

---

## 13. Responsive Design

### 13.1. Breakpoint — nhắc khung (xem UI Spec §7.1 cho giá trị đầy đủ)

6 bậc (`xs`–`2xl`), mobile-first. Quy tắc quản trị: **breakpoint chỉ được dùng để đổi bố cục (layout), không dùng để ẩn/hiện nội dung thông tin** — nếu 1 thiết kế "ẩn cột dữ liệu trên mobile", đó phải là chuyển đổi hình thức hiển thị (bảng → card, UI Spec §7.2), không phải mất thông tin đó hoàn toàn trên màn hình nhỏ.

### 13.2. Adaptive Layout Principles

1. **Mobile-first tuyệt đối** — mọi component/token định nghĩa giá trị mặc định cho `xs`, sau đó override tăng dần ở breakpoint lớn hơn; không định nghĩa ngược (desktop mặc định, override giảm dần cho mobile) vì dễ bỏ sót trường hợp mobile khi thêm component mới.
2. **Touch target tối thiểu 44×44px** trên mọi bậc `xs`/`sm` (đã nêu cho `Checkbox`/`Radio`/`Switch` mục 10.3 — đây là **nguyên tắc hệ thống**, áp dụng cho mọi phần tử bấm được, không riêng Form Control).
3. **Content Reflow, không Content Loss**: nguyên tắc tổng quát hóa từ trường hợp cụ thể "bảng → card" (UI Spec §7.2) — bất kỳ pattern hiển thị dày đặc nào (bảng, ma trận, lưới nhiều cột) đều bắt buộc có 1 đường thoát responsive **giữ nguyên toàn bộ dữ liệu**, không có ngoại lệ "ẩn bớt cho gọn".
4. **Progressive Disclosure trên mobile ưu tiên hơn Horizontal Scroll**: khi không gian hẹp, thu gọn nội dung vào tương tác thêm (Accordion, "Xem thêm") luôn được ưu tiên hơn để người dùng cuộn ngang — cuộn ngang chỉ chấp nhận như phương án cuối (đã nêu cụ thể cho Aspect Table `compact` mode, UI Spec §7.2, đây là nguyên tắc chung áp dụng rộng hơn).

---

## 14. Accessibility

### 14.1. Cam kết WCAG (nhắc khung — chi tiết đầy đủ + checklist ở UI Spec §17)

**WCAG 2.1 Level AA** là cam kết ở **cấp Design System**, nghĩa là: bất kỳ component nào được thêm vào hệ thống (qua Component Lifecycle, mục 16) mà không đạt AA sẽ **không được merge vào Design System**, dù trang cụ thể dùng nó có deadline gấp tới đâu — đây là ranh giới cứng giữa "nợ kỹ thuật chấp nhận được tạm thời ở 1 feature" và "nợ kỹ thuật không được phép tồn tại ở tầng nền tảng dùng chung".

### 14.2. Keyboard Navigation — nguyên tắc thiết kế (không phải checklist)

Nguyên tắc gốc: **mọi hành động khả dụng bằng chuột phải khả dụng tương đương bằng bàn phím, không có ngoại lệ "vì component này phức tạp"**. `ChartWheel` (UI Spec §12.5) là bài kiểm tra khó nhất của nguyên tắc này trong toàn hệ thống — nó tồn tại như 1 case study bắt buộc tham chiếu mỗi khi thiết kế 1 component tương tác trực quan phức tạp mới: nếu `ChartWheel` (phức tạp nhất) làm được, không component nào khác được viện lý do "quá phức tạp để hỗ trợ bàn phím".

### 14.3. Focus Management — 3 quy tắc bất biến

1. **Focus không bao giờ biến mất** — khi 1 phần tử đang focus bị unmount (đóng Modal, xóa item khỏi danh sách), focus phải được chuyển tới 1 phần tử hợp lý kế tiếp (phần tử trigger, hoặc item liền kề) — không để focus "rơi" về `<body>`.
2. **Focus trap chỉ áp dụng cho Overlay chặn tương tác** (`Modal`, `Drawer`) — Overlay không chặn (`Popover`, `Dropdown`, `Tooltip`) không bao giờ trap focus, chỉ đóng khi `Esc`/click ngoài.
3. **Focus ring luôn dùng `color-focus-ring`** (mục 3.1) — không component nào ẩn focus ring bằng `outline: none` mà không thay thế tương đương (baseline, mục 10.1).

### 14.4. ARIA Guidance — "First Rule of ARIA"

Nguyên tắc chi phối toàn bộ cách dùng ARIA trong hệ thống: **nếu có phần tử HTML ngữ nghĩa gốc làm được việc, dùng nó trước — chỉ thêm ARIA khi ngữ nghĩa gốc thực sự không đủ**. Cụ thể hóa: `Button` luôn là `<button>` thật (không phải `<div role="button">`), `Checkbox`/`Radio` luôn dùng `<input>` gốc ẩn dưới lớp style tùy biến (UI Spec §9.2) — ARIA chỉ bổ sung cho trường hợp không có tương đương gốc (`Tabs`, `Accordion`, `Dropdown` — các ARIA Pattern phức tạp UI Spec §9.6 đã liệt kê).

### 14.5. Contrast Requirements — ngưỡng cứng, áp dụng cả token mới

4.5:1 (text thường), 3:1 (text lớn ≥ 24px, icon, thành phần đồ họa quan trọng như viền input) — đây là **điều kiện đầu vào của Token Governance** (mục 17): 1 token màu mới, dù đẹp tới đâu, **không được thêm vào Semantic layer** nếu không đạt ngưỡng contrast với ít nhất 1 cặp nền chuẩn (`color-bg-canvas`/`color-bg-surface` ở cả Light/Dark).

---

## 15. Theming Strategy

### 15.1. Đối chiếu thực tế: Dark Mode không còn là "tương lai"

Cần nêu rõ 1 điểm để tránh hiểu lầm khi đọc riêng tài liệu này: yêu cầu gốc đặt "Dark Theme" vào nhóm "Future" — nhưng thực tế, **UI Spec §16 đã đặc tả đầy đủ** Dark Mode (bảng token Light/Dark song song ở §3.3–3.4, cơ chế chuyển đổi ở §16.1–16.2) từ trước khi tài liệu này được viết. Vậy trạng thái chính xác là: **Light Theme = đã đặc tả + sẵn sàng code**, **Dark Theme = đã đặc tả + sẵn sàng code** (không phải "tương lai" theo nghĩa "chưa thiết kế") — cả 2 chỉ đang chờ giai đoạn bootstrap code (chưa có dòng code Frontend nào tồn tại, theo Architecture Spec bối cảnh dự án). Tài liệu này ghi nhận đúng thực tế thay vì lặp lại khung "Light hiện tại/Dark tương lai" không còn chính xác.

### 15.2. Light Theme

Theme mặc định, không cần cấu hình gì thêm — mọi Semantic Token (mục 3.1) có giá trị Light là giá trị **mặc định** khi không có `data-theme` nào được set (UI Spec §16.1).

### 15.3. Dark Theme

Đã đặc tả đầy đủ (UI Spec §16.1–16.2) — nguyên tắc quan trọng nhất được nhắc lại ở cấp Design System: Dark Mode **không phải phép "invert" tự động** của Light Mode — mỗi Semantic Token có giá trị Dark **được thiết kế riêng**, không suy ra bằng công thức đảo màu. Đây là lý do vì sao Token Governance (mục 17) yêu cầu: **mọi Semantic Token mới đều phải khai báo đồng thời cả giá trị Light và Dark trước khi được duyệt** — không có "để giá trị Dark tính sau".

### 15.4. Custom Theme tương lai (White-label)

Đây **mới thực sự** là phần "tương lai" theo đúng nghĩa yêu cầu — chưa có kế hoạch cụ thể, nhưng kiến trúc token 3 lớp (mục 2.1) đã đặt nền: 1 theme thứ 3 (`brand-x`) chỉ cần khai báo lại tập giá trị Semantic Token, không đụng tới Global hay Component Token, không sửa bất kỳ component nào (đã nêu ở Architecture Spec §15.6, nhắc lại ở đây như 1 cam kết của chính Design System, không chỉ của tầng code).

### 15.5. Quy tắc chọn theme không thuộc phạm vi tài liệu này

Cơ chế lưu lựa chọn theme của người dùng (`system`/thủ công, persist ở đâu) là quyết định **kiến trúc**, đã thuộc Architecture Spec §16.1 — Design System Specification chỉ chịu trách nhiệm rằng **mọi token đều sẵn sàng phục vụ bất kỳ cơ chế chuyển theme nào**, không quy định cơ chế đó.

---

## 16. Component Lifecycle

### 16.1. Bốn giai đoạn

```
Propose  →  Design  →  Review  →  Approve  →  (Implement, ngoài phạm vi Design System)  →  Version  →  [Deprecate]
```

### 16.2. Propose (Đề xuất)

Bất kỳ nhu cầu component mới nào phải trả lời bằng văn bản 3 câu hỏi trước khi sang giai đoạn Design:

1. **Component/token hiện có tại sao không đủ?** (bắt buộc thử composition từ Primitive có sẵn trước — mục 10.2 — trước khi kết luận cần thêm mới).
2. **Đây là nhu cầu dùng lại được (≥ 2 nơi dự kiến sử dụng), hay chỉ 1 feature cụ thể?** — nếu chỉ 1 nơi, nó thuộc `features/*/components` (Architecture Spec §4.2), **không** vào Design System.
3. **Nó thuộc nhóm nào**: mở rộng Primitive hiện có (variant/size mới), hay 1 Primitive hoàn toàn mới, hay 1 Composite domain (`entities/astrology`)?

### 16.3. Design → Review — Checklist chấp nhận (Definition of Done ở cấp Design System)

| Tiêu chí | Bắt buộc đạt |
|---|---|
| Token compliance (mục 10.1) | 100% — không hardcode |
| Universal Component Contract (mục 10.1) | Đủ state/size/variant baseline theo đúng vai trò component |
| Accessibility (mục 14) | WCAG AA, đã test bàn phím + ít nhất 1 screen reader (kế thừa Architecture Spec §14, DoD đã có ở UI Spec §17.3 — nhắc lại ở cấp component mới) |
| Cả 2 theme (mục 15.3) | Semantic Token khai báo đủ Light + Dark |
| Không trùng lặp | Không có Primitive/Composite hiện tại nào giải quyết được cùng nhu cầu (đối chiếu câu hỏi Propose #1) |
| Naming | Đúng từ vựng chung (mục 10.1 variant vocabulary, mục 9.3 icon dictionary nếu áp dụng) |

Component **không đạt dù chỉ 1 tiêu chí** không được coi là "hoàn thành, nợ lại sau" — quay về giai đoạn Design.

### 16.4. Approve

Với quy mô hiện tại (1 developer — Architecture Spec bối cảnh dự án), người phê duyệt chính là người thiết kế/code, nhưng quyết định **vẫn phải ghi lại bằng văn bản** (changelog Design System, mục 16.5) — approve không có nghĩa là bỏ qua checklist mục 16.3, chỉ có nghĩa là không cần chờ người thứ 2 ký duyệt. Khi team mở rộng (kích hoạt cùng ngưỡng với Architecture Spec §4.7 — `≥ 3 người phát triển song song`), Approve chuyển thành bắt buộc có người thứ 2 review độc lập.

### 16.5. Version

Design System được version hóa như 1 gói độc lập (Semantic Versioning: `MAJOR.MINOR.PATCH`), dù chưa publish thành package riêng biệt tách khỏi codebase chính:

| Loại thay đổi | Bậc version |
|---|---|
| Thêm Component/variant/size mới, không đổi API/token cũ | `MINOR` |
| Sửa lỗi thị giác/accessibility, không đổi API | `PATCH` |
| Đổi tên token/prop, đổi hành vi mặc định, xóa variant | `MAJOR` (kèm ghi chú Migration ở mục 17.3) |

### 16.6. Deprecate

Component/token bị deprecate **không bị xóa ngay** — đánh dấu deprecated (ghi chú lý do + component/token thay thế), giữ hoạt động tối thiểu 1 chu kỳ `MINOR` release trước khi xóa ở lần `MAJOR` kế tiếp, đảm bảo không phá vỡ bất kỳ trang nào đang dùng mà chưa kịp migrate.

---

## 17. Design Tokens Governance

### 17.1. Nguyên tắc cốt lõi: Additive an toàn, Sửa đổi rủi ro, Xóa nguy hiểm nhất

| Loại thay đổi token | Rủi ro | Quy trình |
|---|---|---|
| **Thêm token mới** (Global/Semantic/Component) | Thấp — không ảnh hưởng gì đang tồn tại | Qua checklist mục 16.3 (contrast, cả 2 theme), không cần quy trình đặc biệt thêm |
| **Đổi TÊN token** (giá trị giữ nguyên) | Trung bình — mọi nơi tham chiếu tên cũ phải cập nhật | Bắt buộc giữ **alias** (tên cũ trỏ sang tên mới) tối thiểu 1 chu kỳ `MINOR` trước khi xóa alias ở `MAJOR` kế tiếp (mục 16.6) |
| **Đổi GIÁ TRỊ token** (tên giữ nguyên) | **Cao nhất** — thay đổi thị giác âm thầm lan ra mọi nơi dùng token đó mà không ai chủ động sửa gì | Bắt buộc **visual review toàn hệ thống** (không chỉ nơi "định đổi cho") trước khi merge — vì đây là thay đổi tên vẫn giữ nguyên nhưng ý nghĩa/thị giác đổi, dễ bị đánh giá thấp mức độ ảnh hưởng nhất |
| **Xóa token** | Cao — vỡ mọi nơi còn tham chiếu | Bắt buộc **audit sử dụng** (tìm toàn bộ tham chiếu trong codebase) trả về 0 kết quả mới được xóa; không xóa "vì nghĩ là không ai dùng" |

### 17.2. Backward Compatibility — nguyên tắc "Additive over Mutative"

Ưu tiên tuyệt đối: khi có nhu cầu thay đổi hành vi 1 token, **luôn ưu tiên thêm token mới** hơn sửa token cũ, trừ khi token cũ thực sự sai (bug, không đạt contrast) — 1 nhu cầu thẩm mỹ mới ("muốn Primary đậm hơn 1 chút cho 1 ngữ cảnh cụ thể") không phải lý do sửa `color-accent-primary` toàn cục, mà là ứng viên Component Token mới (mục 2.1).

### 17.3. Migration Note — bắt buộc kèm mọi thay đổi `MAJOR`

Mỗi thay đổi `MAJOR` (mục 16.5) phải kèm 1 đoạn Migration Note ngắn: token/component nào đổi, thay thế bằng gì, ví dụ trước/sau (mô tả bằng lời, không code) — mục tiêu là để chính người viết (hoặc người kế nhiệm) 6 tháng sau đọc lại vẫn hiểu ngay cần sửa gì mà không phải đoán qua git blame.

---

## 18. Future Extensibility

### 18.1. Đánh giá mức độ sẵn sàng ở cấp Design System (khác trọng tâm với Architecture Spec §15)

Architecture Spec §15 đánh giá sẵn sàng ở cấp **tổ chức code**; mục này đánh giá sẵn sàng ở cấp **có đủ Primitive/Composite thị giác hay chưa**.

| Hạng mục tương lai | Mức sẵn sàng | Ghi chú |
|---|---|---|
| **Natal Chart / Chart Viewer** | ✅ Sẵn sàng đầy đủ | Toàn bộ Composite cần thiết (`ChartWheel`, `PlanetTable`, `HouseTable`, `AspectTable`...) đã đặc tả chi tiết UI Spec §12 — không cần Primitive mới, chỉ cần Component Lifecycle "Implement" |
| **Interpretation Viewer** | ✅ Sẵn sàng đầy đủ | `InterpretationCard` (UI Spec §12.6) + `Accordion` (Primitive có sẵn) đủ bao phủ nhu cầu hiển thị |
| **Dashboard** ("Chart của tôi", UI Spec §13 mục 6) | ✅ Sẵn sàng đầy đủ | `Grid` + `Card interactive` + `EmptyState` (mục 18.3 UI Spec) đã đủ — không phát sinh Primitive mới |
| **Admin** | ⚠️ **Chưa sẵn sàng — khoảng trống thực sự** | Xem 18.2 |

### 18.2. Khoảng trống: Admin

Khác các mục trên (chỉ cần ghép Primitive/Composite có sẵn), khu vực **Admin** (quản lý nội dung Knowledge Base, quản lý người dùng nếu SaaS hóa — Architecture Spec §15.1) nhiều khả năng cần **Primitive mới chưa tồn tại trong hệ thống hiện tại**, ví dụ:

- **DataTable** với sort/filter/bulk-action — khác hẳn `PlanetTable`/`AspectTable` (những bảng này hiển thị dữ liệu **đọc-only**, không có khái niệm chọn nhiều dòng/hành động hàng loạt).
- **Rich Text Editor** (soạn bài viết Knowledge Base) — chưa có Primitive nào trong hệ thống hiện tại đảm nhiệm.
- **File/Image Upload** — chưa có Primitive nào.

Đây là **ghi nhận có chủ đích**, không phải thiếu sót của tài liệu: đúng nguyên tắc YAGNI xuyên suốt cả 3 tài liệu, Admin **chưa được thiết kế trước** vì chưa có nhu cầu xác nhận (Backend cũng chưa có Sprint nào cho Admin theo bối cảnh dự án hiện tại). Khi nhu cầu Admin trở nên cụ thể, đây là ứng viên rõ ràng cho 1 vòng Component Lifecycle (mục 16) hoàn chỉnh — bắt đầu lại từ Propose, không giả định trước bất kỳ giải pháp nào ở tài liệu này.

---

*Hết tài liệu. Design System Specification này, cùng Frontend UI Specification và Frontend Architecture Specification, tạo thành bộ ba tài liệu nền tảng của AstroViet Frontend. Ba tài liệu không lặp lại nội dung của nhau — mỗi tài liệu trả lời đúng 1 câu hỏi (trông ra sao / tổ chức thế nào / quản trị theo quy tắc gì) — và phải được cập nhật đồng bộ khi có thay đổi kiến trúc/thiết kế lớn.*
