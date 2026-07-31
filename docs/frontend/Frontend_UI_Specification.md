# Frontend UI Specification — AstroViet

**Phiên bản:** 1.0
**Trạng thái:** Draft — sẵn sàng cho Sprint 1 Frontend
**Phạm vi:** Toàn bộ React Application (Design System, Layout, Astrology Components, Routing, State Management)
**Đối tượng đọc:** Frontend Engineer, UI/UX Designer, QA

> Tài liệu này là nguồn tham chiếu duy nhất (Single Source of Truth) cho việc phát triển giao diện AstroViet. Mọi component, màu sắc, khoảng cách, hành vi responsive và accessibility đều phải bắt nguồn từ tài liệu này. Không tài liệu Figma hay code nào được phép mâu thuẫn với spec mà không cập nhật lại spec trước.

---

## Mục lục

1. [Design Philosophy](#1-design-philosophy)
2. [Design Tokens](#2-design-tokens)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Iconography](#5-iconography)
6. [Spacing System](#6-spacing-system)
7. [Responsive Breakpoints](#7-responsive-breakpoints)
8. [Layout System](#8-layout-system)
9. [Component Library Specification (Phase 1)](#9-component-library-specification-phase-1)
10. [Authentication Screens](#10-authentication-screens)
11. [App Layout (Phase 2)](#11-app-layout-phase-2)
12. [Astrology Components (Phase 3)](#12-astrology-components-phase-3)
13. [Page Specification](#13-page-specification)
14. [Routing Structure](#14-routing-structure)
15. [State Management](#15-state-management)
16. [Theme System](#16-theme-system)
17. [Accessibility Guidelines](#17-accessibility-guidelines)
18. [Loading / Error / Empty States](#18-loading--error--empty-states)
19. [Animation Guidelines](#19-animation-guidelines)
20. [Performance Guidelines](#20-performance-guidelines)
21. [File Structure](#21-file-structure)
22. [Naming Convention](#22-naming-convention)
23. [Testing Strategy](#23-testing-strategy)
24. [Future Extensibility](#24-future-extensibility)
25. [Open Questions](#25-open-questions)

---

## 1. Design Philosophy

### 1.1. Định vị thẩm mỹ: "Ephemeris Instrument"

AstroViet không lấy cảm hứng từ thẩm mỹ "huyền bí" thường thấy ở các app tử vi (tím than, sao lấp lánh, gradient mystical). Thay vào đó, hướng thiết kế được chọn là **"Ephemeris Instrument"** — cảm giác của một **thiết bị đo lường thiên văn chính xác**: bảng ephemeris in trên giấy, la bàn/astrolabe bằng đồng thau, sổ tay quan sát của nhà thiên văn. Đây là lựa chọn có chủ đích để:

- Truyền tải **độ chính xác và đáng tin cậy** của dữ liệu (tọa độ hành tinh, góc chiếu, giờ sinh) — điều mà một astrologer nghiêm túc quan tâm hơn là hiệu ứng thị giác.
- Phân biệt AstroViet khỏi các website tử vi phổ thông tại Việt Nam (nhiều màu, nhiều icon trang trí).
- Vẫn giữ được sự ấm áp, dễ tiếp cận cho người mới bắt đầu tìm hiểu.

### 1.2. Nguyên tắc cốt lõi

| Nguyên tắc | Ý nghĩa thực thi |
|---|---|
| **Dữ liệu là trung tâm** | Bảng số liệu (planet table, aspect table) phải dễ đọc, căn chỉnh số liệu (tabular figures), không bị lu mờ bởi trang trí. |
| **Nhiều khoảng trắng** | Mật độ thông tin cao (chart có thể chứa 10+ hành tinh, hàng chục aspect) đòi hỏi khoảng trắng đủ lớn để mắt không quá tải. |
| **Ít màu, có chủ đích** | Bảng màu giới hạn ở 1 accent chính (brass/gold) + 1 accent phụ (indigo) + trung tính. Màu không dùng để trang trí, chỉ dùng để mã hóa thông tin (ví dụ: nguyên tố Lửa/Đất/Khí/Nước). |
| **Typography rõ ràng, phân cấp** | Serif hiển thị cho tiêu đề mang tính "văn bản thiên văn cổ điển", sans-serif cho giao diện, monospace cho số liệu góc độ (degree/minute/second). |
| **Không sao chép, chỉ học triết lý** | Tham khảo astro.com, Astro-Seek, chiemtinhlaso.com ở mức bố cục và mật độ thông tin — không sao chép màu sắc, icon, hay layout cụ thể. |
| **Dark Mode là công dân hạng nhất** | Nhiều người xem chart vào buổi tối; Dark Mode không phải bản "invert" của Light Mode mà được thiết kế riêng (xem mục 16). |

### 1.3. Signature Element: "The Ring"

Mỗi sản phẩm cần **một chi tiết đặc trưng** để nhận diện — không lặp lại chart wheel ở khắp nơi (dễ trở thành cliché), mà trừu tượng hóa nó thành **The Ring**: một cung tròn mảnh (1px, 60–120°), có vạch chia độ nhỏ (tick) mỗi 5°, dùng làm:

- Hiệu ứng "vẽ" (draw-on reveal) khi hero section load lần đầu.
- Hình dạng của `Spinner` (loading indicator) — cung tròn quay thay vì vòng tròn đặc.
- Divider trang trí ở góc `Card` chứa dữ liệu chart (góc trên-phải, rất mờ, `opacity: 0.15`).
- Watermark nền cho Empty State của Chart.

The Ring **không xuất hiện quá 1 lần trên mỗi màn hình chính** — giữ tính đặc biệt, tránh lạm dụng.

### 1.4. Đối tượng người dùng và ưu tiên thiết kế

| Persona | Ưu tiên UI |
|---|---|
| Người mới (Guest/User mới) | Birth Form đơn giản, Interpretation Card dễ đọc bằng tiếng Việt phổ thông, ẩn thuật ngữ kỹ thuật theo mặc định (có thể mở rộng "Xem chi tiết kỹ thuật"). |
| Người đã biết Astrology | Có thể chuyển nhanh giữa các loại chart (Natal/Transit/Synastry...), xem Aspect Table đầy đủ orb. |
| Astrologer chuyên nghiệp | Cần độ chính xác số liệu tối đa (degree/minute/second), có thể chọn House System, xem Pattern Card (Grand Trine, T-Square...). |

---

## 2. Design Tokens

Toàn bộ token được định nghĩa dưới dạng CSS Custom Properties, expose qua Tailwind theme extension (`tailwind.config.ts`). Token là nguồn duy nhất cho giá trị thiết kế — **không hardcode hex/px trong component**.

### 2.1. Cấu trúc token (3 lớp)

```
Global Tokens (giá trị thô)
        ↓
Alias Tokens (ngữ nghĩa, theo theme sáng/tối)
        ↓
Component Tokens (theo từng component, tham chiếu Alias Tokens)
```

- **Global tokens**: `--color-ink-900`, `--color-brass-500`, `--space-4`, `--radius-md`... — giá trị tuyệt đối, không đổi theo theme.
- **Alias tokens**: `--color-text-primary`, `--color-surface-default`, `--color-border-subtle`... — đổi giá trị theo Light/Dark theme, tham chiếu tới Global tokens.
- **Component tokens**: `--button-bg-primary`, `--card-border-radius`... — dùng khi một component cần override alias mặc định (hiếm khi cần ở Phase 1).

### 2.2. Naming convention của token

```
--{category}-{concept}-{modifier?}
```

Ví dụ: `--color-surface-raised`, `--space-6`, `--font-size-heading-lg`, `--radius-full`.

### 2.3. Token nào bắt buộc phải có ngay từ Sprint 1

Color, Typography, Spacing, Radius, Shadow, Breakpoint, Z-index, Motion (duration/easing). Chi tiết ở các mục 3–7 và 16.

---

## 3. Color System

### 3.1. Bảng màu Global (Brainstorm → Chốt)

Bảng màu gồm 6 màu chính, được đặt tên theo chất liệu thực (giấy, mực, đồng thau, đêm) thay vì tên trừu tượng ("primary-500"):

| Token | Hex | Ý nghĩa / Nguồn cảm hứng |
|---|---|---|
| `ink-900` | `#1B2036` | Mực viết — text chính, gần đen nhưng ngả indigo, không dùng đen tuyền `#000` |
| `paper-50` | `#F7F8FA` | Giấy ephemeris — nền Light Mode, trắng ngả xám-lạnh (không phải cream ấm) |
| `midnight-900` | `#10131F` | Bầu trời đêm quan sát — nền Dark Mode |
| `brass-500` | `#C08A3E` | Đồng thau của astrolabe — accent chính, CTA, điểm nhấn số liệu |
| `indigo-600` | `#3B4C8C` | Mực xanh đêm — accent phụ, link, trạng thái selected, đường nét chart wheel |
| `slate-500` | `#6B7280` | Xám trung tính — text phụ, placeholder, icon mặc định |

> **Lý do chọn `paper-50` thay vì tông cream ấm phổ biến (`#F4F1EA`)**: cream ấm dễ gợi liên tưởng tới thiệp mời/blog cá nhân, còn AstroViet cần cảm giác "dụng cụ đo lường" — trung tính, hơi lạnh, giống giấy in bảng ephemeris hơn là giấy viết thư.

### 3.2. Ramp màu (50 → 900) cho mỗi màu có chức năng nền/text

Mỗi màu nền tảng (`ink`, `paper`, `midnight`, `brass`, `indigo`, `slate`) có ramp 10 bước (50/100/200/300/400/500/600/700/800/900) sinh tự động bằng công cụ token (ví dụ Radix Colors scale hoặc script HSL interpolation nội bộ), đảm bảo tương phản nhất quán. Ramp đầy đủ được lưu trong file `design-tokens/colors.json`, không liệt kê hết ở đây để tránh trùng lặp — chỉ liệt kê các bước dùng trực tiếp trong spec (mục 3.3).

### 3.3. Semantic Colors (theo cặp Light / Dark)

| Alias Token | Light | Dark | Dùng cho |
|---|---|---|---|
| `color-bg-canvas` | `paper-50` `#F7F8FA` | `midnight-900` `#10131F` | Nền toàn trang |
| `color-bg-surface` | `#FFFFFF` | `midnight-800` `#161B2E` | Nền `Card`, `Modal`, `Popover` |
| `color-bg-surface-raised` | `#FFFFFF` + shadow | `midnight-700` `#1D2338` | Dropdown, Toast, Tooltip |
| `color-text-primary` | `ink-900` `#1B2036` | `paper-100` `#EEF0F4` | Text chính |
| `color-text-secondary` | `slate-600` `#4B5563` | `slate-400` `#9CA3AF` | Text phụ, mô tả |
| `color-text-muted` | `slate-400` `#9CA3AF` | `slate-500` `#6B7280` | Placeholder, timestamp |
| `color-text-on-accent` | `#FFFFFF` | `#12141F` | Text trên nền `brass-500` |
| `color-border-subtle` | `slate-200` `#E5E7EB` | `midnight-600` `#2A3150` | Border mặc định, divider |
| `color-border-strong` | `slate-300` `#D1D5DB` | `midnight-500` `#39406A` | Border input focus-adjacent, table header |
| `color-accent-primary` | `brass-500` `#C08A3E` | `brass-400` `#D4A05E` | CTA chính, active state, giá trị số liệu nổi bật |
| `color-accent-secondary` | `indigo-600` `#3B4C8C` | `indigo-400` `#7C90D4` | Link, selected tab, house/chart line |
| `color-focus-ring` | `indigo-600` `#3B4C8C` @ 40% | `indigo-300` `#A8B6E8` @ 50% | Focus ring (xem mục 17) |

### 3.4. Semantic / Feedback Colors

Cố ý **giảm độ bão hòa** (muted) so với màu semantic mặc định của framework UI phổ thông, để không phá vỡ nguyên tắc "ít màu":

| Token | Light | Dark | Dùng cho |
|---|---|---|---|
| `color-success` | `#3F7D58` | `#6FAE86` | Thành công, xác nhận |
| `color-warning` | `#B8863B` | `#D9A55C` | Cảnh báo (gần `brass` có chủ đích — cảnh báo và accent cùng "họ màu ấm") |
| `color-danger` | `#B14A4A` | `#D97575` | Lỗi, xóa, validation fail |
| `color-info` | `#3B6EA5` | `#7BA3D6` | Thông tin trung tính |

Mỗi màu feedback có 3 biến thể dùng trong `Alert`/`Toast`: `-bg` (nền nhạt 8–12% opacity), `-border`, `-text` (đậm, đảm bảo AA).

### 3.5. Element Colors (Fire / Earth / Air / Water)

Đây là **bảng màu mã hóa dữ liệu chiêm tinh** — dùng nhất quán cho `ElementChart`, `SignBadge`, dải màu trong `PlanetTable`:

| Element | Token | Hex (Light) | Ghi chú |
|---|---|---|---|
| Lửa (Fire) | `color-element-fire` | `#C1522E` | Đỏ đất nung, không dùng đỏ sáng (tránh nhầm với `danger`) |
| Đất (Earth) | `color-element-earth` | `#7A6A45` | Nâu đất/olive trầm |
| Khí (Air) | `color-element-air` | `#4C7A9E` | Xanh da trời trầm |
| Nước (Water) | `color-element-water` | `#3E5C99` | Xanh nước biển đậm, gần `indigo` nhưng phân biệt được |

> Element colors **không** dùng emoji hay icon hoạt hình — chỉ dùng dot màu nhỏ (8px) + text label, đúng tinh thần "ít trang trí, nhiều dữ liệu".

### 3.6. Nguyên tắc sử dụng màu

1. Không dùng quá **2 accent color** trên cùng một màn hình (trừ Element Colors, vốn là dữ liệu chứ không phải trang trí).
2. `brass-500` chỉ dùng cho **một** CTA chính trên mỗi màn hình (nguyên tắc "một hành động chính").
3. Contrast ratio tối thiểu: **4.5:1** cho text thường, **3:1** cho text lớn (≥24px) và icon, theo WCAG AA (xem mục 17).
4. Không dùng màu làm phương tiện truyền tải thông tin duy nhất (ví dụ trạng thái aspect Harmonious/Tense phải có thêm icon hoặc label, không chỉ dựa vào màu xanh/đỏ).

---

## 4. Typography

### 4.1. Font Family — 3 vai trò

| Vai trò | Font | Fallback stack | Lý do chọn |
|---|---|---|---|
| **Display** (H1, H2, tiêu đề trang, số liệu hero) | **Newsreader** (variable, serif) | `Georgia, "Times New Roman", serif` | Serif hiện đại có origin từ typography xuất bản học thuật — gợi cảm giác "văn bản thiên văn" mà vẫn dễ đọc trên màn hình, khác hẳn serif high-contrast kiểu tạp chí thời trang. |
| **UI / Body** (toàn bộ giao diện, form, câu chữ diễn giải) | **Inter** (variable, sans-serif) | `-apple-system, "Segoe UI", Roboto, sans-serif` | Trung tính, hỗ trợ tiếng Việt đầy đủ dấu, độ đọc cao ở size nhỏ. |
| **Data / Mono** (độ, phút, giây; tọa độ; giờ sinh; mã trong OpenAPI viewer) | **IBM Plex Mono** | `"SF Mono", Consolas, monospace` | Tabular, độ rộng ký tự đều — bắt buộc cho bảng số liệu chiêm tinh (ví dụ `15°23'47"`) để các cột thẳng hàng. |

Cả 3 font đều tự host (self-hosted, `.woff2`) qua `@font-face` — không gọi Google Fonts CDN trực tiếp (kiểm soát hiệu năng, tuân thủ mục 20).

### 4.2. Type Scale

Type scale dùng tỷ lệ **1.25 (Major Third)**, base 16px, có clamp responsive cho các bậc lớn:

| Token | Size (desktop) | Size (mobile) | Line-height | Font | Dùng cho |
|---|---|---|---|---|---|
| `text-display-xl` | 48px / 3rem | 32px / 2rem | 1.15 | Display | Hero landing page |
| `text-display-lg` | 36px / 2.25rem | 28px / 1.75rem | 1.2 | Display | H1 trang |
| `text-heading-lg` | 28px / 1.75rem | 22px / 1.375rem | 1.25 | Display | H2 section |
| `text-heading-md` | 22px / 1.375rem | 19px / 1.1875rem | 1.3 | Display | H3, Card title |
| `text-heading-sm` | 18px / 1.125rem | 17px | 1.35 | UI (Inter, 600) | H4, subsection |
| `text-body-lg` | 17px | 16px | 1.6 | UI | Body nổi bật, intro |
| `text-body-md` | 15px | 15px | 1.6 | UI | Body mặc định |
| `text-body-sm` | 13px | 13px | 1.5 | UI | Caption, helper text |
| `text-label` | 13px | 13px | 1.4 | UI, 500 weight, uppercase tracking 0.02em | Form label, table header |
| `text-data-lg` | 20px | 18px | 1.3 | Mono | Số liệu độ nổi bật (Ascendant, Sun sign) |
| `text-data-md` | 15px | 14px | 1.5 | Mono, tabular-nums | Nội dung PlanetTable/AspectTable |
| `text-data-sm` | 13px | 12px | 1.4 | Mono, tabular-nums | Badge độ số, orb value |

### 4.3. Font Weight

| Token | Giá trị | Dùng cho |
|---|---|---|
| `font-weight-regular` | 400 | Body text |
| `font-weight-medium` | 500 | Label, emphasis nhẹ |
| `font-weight-semibold` | 600 | Heading nhỏ, button |
| `font-weight-bold` | 700 | Heading lớn (Display) |

Display font (Newsreader) **không dùng weight 700 cho size nhỏ hơn 22px** — ở size nhỏ, dùng Inter semibold thay thế để tránh giảm độ đọc.

### 4.4. Quy tắc Typography cho tiếng Việt

- Toàn bộ font đã kiểm tra hỗ trợ **Vietnamese Extended subset** (dấu thanh, ký tự đặc biệt: ư, ơ, đ, ê...).
- `line-height` tối thiểu **1.5** cho body text tiếng Việt (dấu thanh cần khoảng cách dòng lớn hơn tiếng Anh để không bị cắt).
- Không dùng `letter-spacing` âm cho bất kỳ size nào (tránh dấu thanh chồng lên ký tự kế tiếp).
- Test bắt buộc với chuỗi dài nhất trong hệ thống: tên hành tinh + cung + nhà (ví dụ "Sao Diêm Vương tại Ma Kết, Nhà thứ Mười Hai") để đảm bảo không tràn trong Badge/Table cell — xem `PlanetBadge` (mục 12).

### 4.5. Tabular Numerals bắt buộc

`font-variant-numeric: tabular-nums` là **bắt buộc** trên mọi nơi hiển thị số liệu (degree, orb, thời gian) — không phải chỉ là gợi ý — để các cột trong `PlanetTable`/`AspectTable` thẳng hàng theo chiều dọc.

---

## 5. Iconography

### 5.1. Nguồn icon

- Thư viện chính: **Lucide React** (đã chốt trong stack) — dùng cho toàn bộ icon giao diện (navigation, action, status).
- **Không** tạo bộ icon riêng cho hành tinh/cung hoàng đạo dạng hình vẽ minh họa (illustration) ở Phase 1–3 — thay vào đó dùng **ký hiệu chiêm tinh chuẩn Unicode/glyph** (☉ ☽ ☿ ♀ ♂ ♃ ♄ ♅ ♆ ♇, ♈ ♉ ♊...) render bằng font Display, đặt trong `PlanetBadge`/`SignBadge`. Lý do: ký hiệu chuẩn được astrologer toàn cầu công nhận, tránh việc phải tự vẽ và duy trì 10 hành tinh × 12 cung minh họa riêng.
- Custom icon (nếu cần, ví dụ icon cho House System) được vẽ theo lưới 24×24, stroke-width 1.5px, bo góc `round` — đồng nhất với style stroke của Lucide.

### 5.2. Kích thước icon chuẩn

| Token | Size | Dùng cho |
|---|---|---|
| `icon-xs` | 14px | Inline trong text nhỏ, badge |
| `icon-sm` | 16px | Input adornment, button size `sm` |
| `icon-md` | 20px | Mặc định — button, list item, nav |
| `icon-lg` | 24px | Page header, empty state phụ |
| `icon-xl` | 40px | Empty state chính, illustration thay thế |

### 5.3. Quy tắc

1. Icon luôn kèm `aria-hidden="true"` khi có text label đi kèm; dùng `aria-label` khi icon đứng độc lập (icon-only button).
2. Icon dùng `currentColor` — không hardcode màu, kế thừa màu text của context.
3. Stroke-width mặc định của Lucide (`2px`) được **giảm còn 1.5px** toàn cục để khớp với cảm giác "instrument" mảnh mai, chính xác thay vì icon dày, bo tròn kiểu consumer app.
4. Ký hiệu chiêm tinh (glyph) không đổi màu theo Element Color trừ khi trong context `ElementChart`/`SignBadge` — mặc định dùng `color-text-primary`.

---

## 6. Spacing System

### 6.1. Thang đo (4px base grid)

| Token | Giá trị | Token | Giá trị |
|---|---|---|---|
| `space-0` | 0px | `space-8` | 32px |
| `space-1` | 4px | `space-10` | 40px |
| `space-2` | 8px | `space-12` | 48px |
| `space-3` | 12px | `space-16` | 64px |
| `space-4` | 16px | `space-20` | 80px |
| `space-5` | 20px | `space-24` | 96px |
| `space-6` | 24px | `space-32` | 128px |

### 6.2. Quy tắc áp dụng

- **Padding trong component nhỏ** (Button, Input, Badge): dùng bậc `space-1` → `space-4`.
- **Khoảng cách giữa các phần tử trong nhóm liên quan** (form field trong cùng section): `space-4` → `space-6`.
- **Khoảng cách giữa các section trên trang**: `space-12` → `space-24`, không dùng dưới `space-8`.
- **Density Mode cho bảng dữ liệu**: `PlanetTable`/`AspectTable` có 2 chế độ mật độ — `comfortable` (padding cell `space-3`) và `compact` (padding cell `space-2`) — người dùng astrologer chuyên nghiệp có thể chuyển sang `compact` để xem nhiều dữ liệu hơn trên màn hình (xem mục 12.2).

---

## 7. Responsive Breakpoints

### 7.1. Bảng breakpoint (mobile-first)

| Token | Min-width | Thiết bị tham chiếu |
|---|---|---|
| `xs` (mặc định, không cần prefix) | 0px | Mobile dọc |
| `sm` | 640px | Mobile ngang / phablet |
| `md` | 768px | Tablet dọc |
| `lg` | 1024px | Tablet ngang / laptop nhỏ |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Desktop lớn / màn hình chart rộng |

### 7.2. Nguyên tắc responsive đặc thù cho dữ liệu chiêm tinh

- **Chart Wheel** là thành phần khó responsive nhất: dưới `md`, Chart Wheel chuyển sang chế độ **pinch-to-zoom trong container cố định vuông** (không co kích thước chữ ký hiệu nhỏ hơn 10px — dưới ngưỡng này ký hiệu không đọc được), thay vì scale toàn bộ theo chiều rộng màn hình.
- **PlanetTable/AspectTable** dưới `sm`: chuyển từ layout bảng (`<table>`) sang layout **card-per-row** (mỗi hành tinh là 1 card dọc) — không dùng horizontal scroll làm giải pháp chính (chỉ là fallback nếu người dùng bật `compact` mode trên mobile).
- **Sidebar** (mục 11) sụp thành `Drawer` dưới `lg`.
- Layout **không có breakpoint riêng cho `2xl` trừ trang Chart Detail** — nơi có thể tận dụng không gian rộng để hiển thị Chart Wheel + PlanetTable song song thay vì xếp chồng.

---

## 8. Layout System

### 8.1. Grid

- Grid 12 cột, `gutter` = `space-6` (24px) trên `lg` trở lên, `space-4` (16px) dưới `md`.
- `max-width` nội dung mặc định: **1200px** (`container-default`), căn giữa, padding ngang tối thiểu `space-4` trên mobile, `space-8` trên desktop.
- Trang Chart Detail dùng `container-wide` = **1440px** để đủ chỗ cho Chart Wheel + bảng dữ liệu song song.

### 8.2. Layout khung trang (App Shell)

```
┌───────────────────────────────────────────────┐
│                    Navbar                      │  height: 64px, sticky top
├───────────┬─────────────────────────────────────┤
│           │              Breadcrumb              │
│  Sidebar  ├─────────────────────────────────────┤
│ (lg+ only)│           Page Header                │
│           ├─────────────────────────────────────┤
│           │         Content Container            │
│           │        (scrollable, main)            │
│           │                                       │
├───────────┴─────────────────────────────────────┤
│                    Footer                       │
└───────────────────────────────────────────────┘
```

- Dưới `lg`: `Sidebar` ẩn, thay bằng `Drawer` mở từ `Navbar` (hamburger icon).
- `Content Container` có `min-height` đảm bảo `Footer` luôn ở đáy viewport kể cả khi nội dung ngắn (sticky footer pattern).

### 8.3. Layout Primitives (component-level)

Ba primitive dùng để dựng mọi layout mà **không** viết CSS Flexbox/Grid trực tiếp trong page component — chi tiết đầy đủ ở mục 9.1 (`Container`, `Stack`, `Grid`).

---

## 9. Component Library Specification (Phase 1)

### Quy ước chung cho mọi component trong mục này

- Mọi component đều nhận `className` để override có kiểm soát (không khuyến khích dùng tràn lan) và `data-testid` cho testing (xem mục 23).
- Mọi component tương tác (button, input, tab...) đều phải có trạng thái `disabled` và `focus-visible` được style rõ ràng — không dùng `outline: none` mà không thay thế bằng focus ring token (mục 17).
- "Usage Example" mô tả bằng lời (không phải code React) vì tài liệu này ở mức Software Architecture, không sinh code.

---

### 9.1. Layout Primitives

#### Container

- **Purpose**: Giới hạn chiều rộng nội dung và căn giữa trang, là primitive ngoài cùng của mọi page.
- **Props**: `size` (`default` 1200px | `wide` 1440px | `narrow` 768px | `full` 100%), `paddingX` (boolean, mặc định `true`), `as` (element polymorphic, mặc định `div`).
- **Variants**: theo `size` ở trên.
- **Sizes**: không có prop `size` riêng biệt ngoài `size` đã liệt kê.
- **States**: không áp dụng (không tương tác).
- **Accessibility**: không có vai trò ARIA riêng; nếu dùng làm `<main>` phải set `as="main"` và đảm bảo mỗi trang chỉ có 1 `<main>`.
- **Responsive**: padding ngang tự động `space-4` (mobile) → `space-8` (desktop) trừ khi `paddingX=false`.
- **Usage Example**: Bọc toàn bộ nội dung trang Chart Detail bằng `Container size="wide"` để tận dụng không gian hiển thị Chart Wheel.

#### Stack

- **Purpose**: Xếp các phần tử con theo chiều dọc hoặc ngang với khoảng cách nhất quán, thay thế Flexbox viết tay.
- **Props**: `direction` (`vertical` | `horizontal`), `gap` (token `space-*`), `align` (`start`|`center`|`end`|`stretch`), `justify` (`start`|`center`|`end`|`between`), `wrap` (boolean).
- **Variants**: theo `direction`.
- **Sizes**: điều khiển qua `gap`.
- **States**: không áp dụng.
- **Accessibility**: không thêm ngữ nghĩa ARIA — chỉ là công cụ bố cục thuần túy.
- **Responsive**: `direction` và `gap` có thể nhận object responsive (`{ xs: 'vertical', md: 'horizontal' }`) để đổi hướng theo breakpoint — ví dụ Birth Form chuyển từ xếp dọc (mobile) sang 2 cột ngang (desktop).
- **Usage Example**: Xếp các trường trong `Birth Form` theo `Stack direction="vertical" gap="space-4"`.

#### Grid

- **Purpose**: Bố cục dạng lưới cho danh sách card đồng đều (ví dụ danh sách Chart đã lưu, danh sách bài viết Knowledge Base).
- **Props**: `columns` (số hoặc object responsive, ví dụ `{ xs: 1, sm: 2, lg: 3 }`), `gap` (token `space-*`), `rowGap`/`columnGap` (override riêng nếu cần).
- **Variants**: không có variant riêng, cấu hình hoàn toàn qua `columns`.
- **Sizes**: qua `gap`.
- **States**: không áp dụng.
- **Accessibility**: nếu danh sách là tập hợp item cùng loại, khuyến nghị bọc bằng `role="list"` ở component cha, không phải trách nhiệm của `Grid`.
- **Responsive**: bắt buộc cấu hình `columns` responsive cho mọi danh sách card (không để mặc định 1 cột trên desktop).
- **Usage Example**: Trang "Chart của tôi" hiển thị danh sách `Card` chart đã lưu bằng `Grid columns={{ xs: 1, sm: 2, lg: 3 }}`.

#### Typography

- **Purpose**: Component render text nhất quán theo Type Scale (mục 4), tránh việc mỗi nơi tự set `font-size`/`font-family`.
- **Props**: `variant` (map trực tiếp tới token mục 4.2: `display-xl`...`data-sm`), `as` (polymorphic element), `color` (`primary`|`secondary`|`muted`|`accent`|`danger`...), `truncate` (boolean hoặc số dòng clamp), `align`.
- **Variants**: toàn bộ token Type Scale.
- **Sizes**: đồng nghĩa với `variant`.
- **States**: không áp dụng.
- **Accessibility**: `as` phải được chọn đúng ngữ nghĩa heading (h1–h6), không chọn heading level chỉ vì muốn cỡ chữ to — cỡ chữ và heading level là 2 khái niệm tách biệt trong component này.
- **Responsive**: các variant `display-*`/`heading-*` tự động dùng `clamp()` theo cặp giá trị desktop/mobile ở mục 4.2.
- **Usage Example**: Tiêu đề trang Chart Detail dùng `Typography variant="display-lg" as="h1"`.

---

### 9.2. Form Controls

#### Button

- **Purpose**: Kích hoạt một hành động hoặc điều hướng.
- **Props**: `variant`, `size`, `leftIcon`, `rightIcon`, `isLoading` (boolean, hiện `Spinner` thay label, giữ nguyên width), `disabled`, `fullWidth`, `as` (polymorphic — render như `<a>` khi dùng cho điều hướng).
- **Variants**: `primary` (nền `brass-500`), `secondary` (viền `border-strong`, nền trong suốt), `ghost` (không viền, không nền, chỉ text+hover nền nhẹ), `danger` (nền `color-danger`), `link` (giống text link, không padding).
- **Sizes**: `sm` (32px height), `md` (40px, mặc định), `lg` (48px).
- **States**: `default`, `hover`, `active/pressed`, `focus-visible`, `disabled` (opacity 40%, `cursor: not-allowed`), `loading` (disable tương tác, giữ kích thước cố định để tránh layout shift).
- **Accessibility**: dùng thẻ `<button>` thật (không phải `<div onClick>`); khi `isLoading=true` thêm `aria-busy="true"`; icon-only button bắt buộc `aria-label`.
- **Responsive**: trên mobile, `Button` trong form action bar mặc định `fullWidth=true`.
- **Usage Example**: CTA "Xem biểu đồ" trên Birth Form dùng `variant="primary" size="lg"`.

#### Input

- **Purpose**: Nhập liệu văn bản một dòng (tên, email, mật khẩu, giờ sinh dạng text...).
- **Props**: `type`, `label`, `placeholder`, `helperText`, `errorText`, `leftAdornment`/`rightAdornment` (icon hoặc unit, ví dụ "°"), `size`, `disabled`, `readOnly`, `required`.
- **Variants**: `default`, `filled` (nền `surface` thay vì viền — dùng trong Card có nền tối), theo Design Token, không phải theo shadcn trực tiếp.
- **Sizes**: `sm`, `md` (mặc định), `lg`.
- **States**: `default`, `focus`, `disabled`, `readOnly`, `error` (viền `color-danger`, icon cảnh báo bên phải), `success` (dùng cho validate real-time, ví dụ email hợp lệ).
- **Accessibility**: `label` liên kết qua `htmlFor`/`id`; `errorText` liên kết qua `aria-describedby` và set `aria-invalid="true"` khi có lỗi.
- **Responsive**: chiều rộng mặc định `100%` của container cha — không set width cố định trong component.
- **Usage Example**: Trường "Nơi sinh" trong Birth Form dùng `Input` với `rightAdornment` là icon vị trí (kích hoạt tìm kiếm địa điểm).

#### Textarea

- **Purpose**: Nhập liệu văn bản nhiều dòng (ghi chú cá nhân cho chart, phản hồi).
- **Props**: kế thừa phần lớn từ `Input` (`label`, `helperText`, `errorText`, `disabled`), thêm `rows`, `autoResize` (boolean), `maxLength` (hiện counter).
- **Variants**: `default`, `filled`.
- **Sizes**: điều khiển qua `rows`, không có size preset riêng.
- **States**: giống `Input`.
- **Accessibility**: giống `Input`; khi có `maxLength`, counter phải là `aria-live="polite"` để screen reader thông báo khi gần đạt giới hạn.
- **Responsive**: `autoResize=true` mặc định trên mobile để tránh scroll lồng nhau trong viewport nhỏ.
- **Usage Example**: Ghi chú cá nhân trong "Chart của tôi" dùng `Textarea rows={4} maxLength={500}`.

#### Checkbox

- **Purpose**: Lựa chọn nhị phân độc lập (ví dụ "Ghi nhớ đăng nhập", chọn nhiều House System để so sánh).
- **Props**: `label`, `checked`, `indeterminate` (boolean), `disabled`, `description` (text phụ dưới label).
- **Variants**: chỉ 1 variant hình ảnh, không có variant màu (dùng `color-accent-secondary` cố định khi checked).
- **Sizes**: `md` (mặc định, 18px box), `sm` (16px, dùng trong bảng dày đặc).
- **States**: `unchecked`, `checked`, `indeterminate`, `disabled`, `focus-visible`.
- **Accessibility**: dùng `<input type="checkbox">` thật ẩn dưới lớp style tùy biến (không dùng `<div role="checkbox">` trừ khi bắt buộc); `indeterminate` set qua thuộc tính DOM, không phải attribute.
- **Responsive**: hit-area tối thiểu 44×44px trên mobile dù box hiển thị nhỏ hơn (padding vô hình xung quanh).
- **Usage Example**: "Ghi nhớ đăng nhập" ở màn hình Login.

#### Radio

- **Purpose**: Chọn 1 trong nhiều lựa chọn loại trừ nhau (House System: Placidus / Whole Sign).
- **Props**: `name` (bắt buộc để nhóm), `options` (array `{ value, label, description? }`), `value`, `onChange`, `disabled`, `orientation` (`vertical`|`horizontal`).
- **Variants**: `default` (radio tròn chuẩn), `card` (mỗi option là 1 card có viền, nổi bật hơn cho lựa chọn quan trọng như House System).
- **Sizes**: `md` (mặc định), `sm`.
- **States**: giống Checkbox, thêm `selected` cho variant `card`.
- **Accessibility**: bọc nhóm bằng `role="radiogroup"` + `aria-labelledby` trỏ tới tiêu đề nhóm (ví dụ "Hệ thống nhà").
- **Responsive**: `orientation` tự chuyển `horizontal → vertical` dưới `sm` bất kể prop truyền vào, trừ khi chỉ có 2 option.
- **Usage Example**: Chọn House System (Placidus/Whole Sign) trong Settings dùng variant `card`.

#### Switch

- **Purpose**: Bật/tắt một cài đặt có hiệu lực ngay lập tức (không cần nút Submit) — ví dụ Dark Mode toggle, "Hiện thuật ngữ kỹ thuật".
- **Props**: `checked`, `onChange`, `label`, `labelPosition` (`left`|`right`), `disabled`, `size`.
- **Variants**: 1 variant hình ảnh duy nhất.
- **Sizes**: `sm` (32×18px track), `md` (40×22px, mặc định).
- **States**: `off`, `on`, `disabled`, `focus-visible`, `loading` (khi thay đổi cần gọi API, hiện dot xoay nhỏ trong knob).
- **Accessibility**: dùng `role="switch"` + `aria-checked`; label luôn hiển thị kèm, không dùng Switch không nhãn.
- **Responsive**: không đổi theo breakpoint.
- **Usage Example**: Toggle Dark Mode trong Navbar (dùng variant `sm`, không label, chỉ icon mặt trời/mặt trăng bên cạnh — nhưng vẫn có `aria-label="Chuyển giao diện tối"`).

#### Select

- **Purpose**: Chọn 1 giá trị từ danh sách dài (Quốc gia, Múi giờ sinh, ngôn ngữ).
- **Props**: `options`, `value`, `onChange`, `placeholder`, `searchable` (boolean, bật ô tìm kiếm khi > 8 option), `label`, `errorText`, `disabled`, `clearable`.
- **Variants**: `default`, `native` (dùng `<select>` gốc trên mobile để tận dụng UI hệ điều hành khi danh sách đơn giản, ví dụ chọn giới tính hiển thị).
- **Sizes**: `sm`, `md` (mặc định), `lg`.
- **States**: `default`, `open`, `focus`, `disabled`, `error`, `empty` (không có kết quả tìm kiếm).
- **Accessibility**: tuân theo [ARIA Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) khi `searchable=true`; điều hướng đầy đủ bằng bàn phím (mũi tên lên/xuống, Enter, Esc).
- **Responsive**: `searchable=true` bắt buộc mở dạng full-screen sheet trên mobile (không phải dropdown nhỏ khó thao tác) cho các danh sách dài như Múi giờ.
- **Usage Example**: Chọn Múi giờ sinh trong Birth Form, `searchable=true`.

---
### 9.3. Data Display

#### Badge

- **Purpose**: Nhãn nhỏ, không tương tác, gắn nhãn trạng thái hoặc phân loại (ví dụ "Miễn phí", "Mới", số lượng chưa đọc).
- **Props**: `variant`, `size`, `icon` (optional, bên trái), `dot` (boolean, chấm tròn thay vì text — dùng cho trạng thái online/status nhỏ).
- **Variants**: `neutral`, `accent` (nền `brass-100`/text `brass-700`), `secondary` (nền `indigo-100`), `success`, `warning`, `danger`, `outline` (chỉ viền, không nền).
- **Sizes**: `sm` (20px height), `md` (24px, mặc định).
- **States**: không tương tác nên không có `hover`/`focus`; chỉ có `default`.
- **Accessibility**: không phải interactive element — nếu Badge mang thông tin quan trọng (không chỉ trang trí), nội dung text phải đọc được bởi screen reader (không dùng chỉ icon/màu).
- **Responsive**: không đổi theo breakpoint.
- **Usage Example**: Badge "Miễn phí" cạnh tên gói tài khoản trong Navbar.

> Lưu ý: `PlanetBadge`, `SignBadge`, `HouseBadge`, `AspectBadge` là **biến thể chuyên biệt** của `Badge` cho domain chiêm tinh — được đặc tả riêng ở mục 12 (Phase 3) vì có props và logic hiển thị phức tạp hơn nhiều so với Badge chung.

#### Card

- **Purpose**: Container nhóm nội dung liên quan, có ranh giới thị giác rõ ràng (viền/shadow nhẹ).
- **Props**: `padding` (token `space-*`, mặc định `space-6`), `variant`, `header`/`footer` (slot), `interactive` (boolean — thêm hover state khi cả Card có thể click, ví dụ Card chart trong danh sách).
- **Variants**: `default` (viền `border-subtle`, không shadow — đúng tinh thần "instrument" phẳng), `raised` (có shadow nhẹ, dùng khi Card nổi trên nền có texture như Chart Wheel background), `outline-accent` (viền `brass-500`, dùng cho Card được highlight, ví dụ Pattern Card phát hiện Grand Trine).
- **Sizes**: không có size preset, phụ thuộc nội dung + `padding`.
- **States**: `default`, `hover` (chỉ khi `interactive=true`), `focus-visible` (khi `interactive=true` và render dưới dạng link/button), `selected` (viền `accent`).
- **Accessibility**: khi `interactive=true`, toàn bộ Card phải là 1 target bấm được (dùng `<a>`/`<button>` bao ngoài, không dùng `onClick` trên `<div>` trần).
- **Responsive**: `padding` tự giảm 1 bậc (`space-6` → `space-4`) dưới `sm`.
- **Usage Example**: Mỗi item trong danh sách "Chart của tôi" là 1 `Card interactive padding="space-4"`.

#### Avatar

- **Purpose**: Đại diện hình ảnh người dùng (ảnh, hoặc chữ cái đầu khi chưa có ảnh).
- **Props**: `src`, `name` (dùng sinh initials + màu nền cố định theo hash tên khi không có `src`), `size`, `shape` (`circle`|`rounded`).
- **Variants**: `image`, `initials` (tự động fallback khi `src` lỗi/rỗng).
- **Sizes**: `xs` (24px), `sm` (32px), `md` (40px, mặc định), `lg` (56px).
- **States**: `default`, `loading` (skeleton tròn trong lúc ảnh tải).
- **Accessibility**: `alt` bắt buộc = tên người dùng khi có `src`; khi là initials, thêm `aria-label` đầy đủ tên thay vì để screen reader đọc 2 chữ cái.
- **Responsive**: không đổi theo breakpoint.
- **Usage Example**: Avatar người dùng ở góc phải Navbar, `size="sm"`.

#### Divider

- **Purpose**: Phân tách nội dung bằng đường kẻ mảnh.
- **Props**: `orientation` (`horizontal`|`vertical`), `variant`, `label` (text/section ở giữa divider, ví dụ "Hoặc").
- **Variants**: `solid` (mặc định, `border-subtle`), `dashed` (dùng hiếm, cho phân tách tạm thời/draft), `ring` (**biến thể signature** — cung tròn mảnh thay vì đường thẳng, dùng tối đa 1 lần/trang, xem mục 1.3).
- **Sizes**: chỉ có độ dày `1px` cố định (không có size scale — giữ tính "hairline" xuyên suốt hệ thống).
- **States**: không áp dụng.
- **Accessibility**: `role="separator"`; nếu chỉ trang trí thuần túy (variant `ring`) thì `aria-hidden="true"`.
- **Responsive**: `vertical` tự ẩn và chuyển thành `horizontal` dưới `sm` trong context Stack responsive.
- **Usage Example**: Divider `variant="ring"` ở đầu section "Interpretation" trên trang Chart Detail.

#### Skeleton

- **Purpose**: Placeholder hình dạng nội dung trong lúc chờ dữ liệu tải (đặc biệt quan trọng vì tính toán chart qua Swiss Ephemeris có độ trễ).
- **Props**: `variant` (`text`|`circle`|`rectangle`), `width`, `height`, `count` (số dòng lặp lại, dùng cho danh sách).
- **Variants**: theo `variant` ở trên; có preset dựng sẵn `SkeletonPlanetTable`, `SkeletonChartWheel` (composite, xem mục 18).
- **Sizes**: qua `width`/`height`.
- **States**: chỉ có `animating` (shimmer) — tự động respect `prefers-reduced-motion` (chuyển sang pulse tĩnh thay vì shimmer chuyển động, mục 19).
- **Accessibility**: bọc bằng `aria-busy="true"` ở container cha; bản thân Skeleton set `aria-hidden="true"` (không đọc placeholder rỗng cho screen reader).
- **Responsive**: kích thước theo tỷ lệ % container, không hardcode px.
- **Usage Example**: `SkeletonChartWheel` hiện trong lúc chờ API tính toán Natal Chart trả về.

#### Tooltip *(đặt cùng nhóm Overlay ở 9.5, tham chiếu chéo)*

*(Xem mục 9.5 — Tooltip được nhóm cùng Popover/Dropdown vì cùng cơ chế positioning.)*

#### Pagination

- **Purpose**: Điều hướng qua nhiều trang dữ liệu (danh sách bài viết Knowledge Base, lịch sử Transit đã xem).
- **Props**: `currentPage`, `totalPages`, `onChange`, `siblingCount` (số trang lân cận hiển thị), `variant`.
- **Variants**: `numbered` (mặc định, hiện số trang), `simple` (chỉ Prev/Next + "Trang X/Y", dùng trên mobile).
- **Sizes**: `sm`, `md` (mặc định).
- **States**: `default`, `active` (trang hiện tại), `disabled` (nút Prev ở trang 1, Next ở trang cuối).
- **Accessibility**: `nav` với `aria-label="Phân trang"`; trang hiện tại có `aria-current="page"`.
- **Responsive**: tự chuyển từ `numbered` sang `simple` dưới `sm`.
- **Usage Example**: Danh sách bài viết Knowledge Base, `variant="numbered"` trên desktop.

#### Progress

- **Purpose**: Hiển thị tiến độ xác định (ví dụ % hoàn thành form nhiều bước — Birth Form có thể chia 2 bước: Thông tin cá nhân → Nơi sinh).
- **Props**: `value` (0–100), `max`, `label`, `variant`, `size`.
- **Variants**: `linear` (thanh ngang, mặc định), `circular` (dùng trong không gian hẹp, ví dụ trong Card nhỏ).
- **Sizes**: `sm` (4px thick), `md` (8px, mặc định).
- **States**: `default`, `indeterminate` (khi chưa biết % chính xác — dùng animation quét, khác với `Spinner` ở chỗ vẫn giữ hình dạng thanh ngang).
- **Accessibility**: `role="progressbar"` + `aria-valuenow`/`aria-valuemin`/`aria-valuemax`.
- **Responsive**: không đổi theo breakpoint.
- **Usage Example**: Progress 2 bước ở đầu Birth Form (`value=50` khi đang ở bước Nơi sinh).

#### Spinner

- **Purpose**: Chỉ báo loading không xác định thời lượng, dùng trong Button `isLoading`, hoặc full-page loading.
- **Props**: `size`, `label` (text ẩn cho screen reader, ví dụ "Đang tính toán biểu đồ...").
- **Variants**: chỉ 1 hình ảnh — dùng hình dạng **The Ring** (cung tròn quay, không phải vòng tròn đầy đủ) làm signature, thay vì spinner generic (xem mục 1.3, mục 19).
- **Sizes**: `xs` (14px, trong Button `sm`), `sm` (16px), `md` (24px, mặc định), `lg` (40px, full-page loading).
- **States**: chỉ có `spinning`, tôn trọng `prefers-reduced-motion` (giảm tốc độ quay, không tắt hoàn toàn để vẫn truyền tải "đang xử lý").
- **Accessibility**: `role="status"` + `aria-live="polite"` + visually-hidden text mô tả hành động đang chờ.
- **Responsive**: không đổi theo breakpoint.
- **Usage Example**: `Spinner size="lg" label="Đang tính toán vị trí hành tinh..."` khi chờ API Natal Chart.

---

### 9.4. Feedback

#### Alert

- **Purpose**: Thông báo nổi bật, gắn liền trong luồng nội dung (không phải overlay), cần người dùng chú ý nhưng không chặn thao tác.
- **Props**: `variant`, `title`, `description`, `icon` (auto theo variant, có thể override), `onDismiss` (nếu có, hiện nút đóng), `actions` (slot cho Button phụ, ví dụ "Thử lại").
- **Variants**: `info`, `success`, `warning`, `danger` — dùng token màu mục 3.4.
- **Sizes**: không có size scale, chỉ 1 kích thước, padding `space-4`.
- **States**: `default`, `dismissible` (có nút đóng) vs `persistent`.
- **Accessibility**: `role="alert"` cho `danger`/`warning` (ngắt screen reader ngay), `role="status"` cho `info`/`success` (không ngắt).
- **Responsive**: `actions` xếp xuống dòng dưới thay vì cùng hàng dưới `sm`.
- **Usage Example**: Alert `warning` "Giờ sinh không chính xác có thể ảnh hưởng tới độ chính xác của Ascendant" dưới trường giờ sinh trong Birth Form.

#### Toast

- **Purpose**: Thông báo tạm thời, tự biến mất, không gắn trong luồng nội dung (nổi ở góc màn hình) — dùng cho kết quả hành động (Lưu chart thành công, Lỗi mạng).
- **Props**: `variant`, `title`, `description`, `duration` (ms, mặc định 4000, `Infinity` nếu cần hành động), `action` (1 Button phụ duy nhất, ví dụ "Hoàn tác").
- **Variants**: giống Alert (`info`/`success`/`warning`/`danger`).
- **Sizes**: 1 kích thước cố định, `max-width: 360px`.
- **States**: `entering`, `visible`, `exiting` (animation, mục 19).
- **Accessibility**: container Toast dùng `aria-live="polite"` (hoặc `assertive` cho `danger`), `role="status"`; Toast **không được** là nơi duy nhất chứa thông tin quan trọng — luôn có đường dẫn khác để xem lại (ví dụ lỗi lưu chart phải log cả trong Alert tại trang nếu cần).
- **Responsive**: vị trí `bottom-center` trên mobile (dễ với tới), `top-right` trên desktop.
- **Usage Example**: Toast `success` "Đã lưu biểu đồ" sau khi bấm Save trên Chart Detail.

---

### 9.5. Overlay (Positioning Layer)

> Tooltip, Popover, Dropdown, Modal, Drawer đều dùng chung 1 engine positioning nội bộ (dựa trên thư viện floating-UI hoặc tương đương) để đảm bảo nhất quán về collision detection (tự lật vị trí khi gần mép màn hình) và z-index layering (mục 16.4).

#### Tooltip

- **Purpose**: Giải thích ngắn (≤ 1 câu) khi hover/focus vào 1 phần tử, không chứa hành động.
- **Props**: `content`, `placement` (`top`|`right`|`bottom`|`left`, tự động lật nếu tràn viewport), `delay` (ms trước khi hiện, mặc định 300ms).
- **Variants**: chỉ 1 style hình ảnh (nền `ink-900`/`text trắng` bất kể theme, để luôn nổi bật).
- **Sizes**: `max-width: 240px`, tự động wrap text.
- **States**: `hidden`, `visible`.
- **Accessibility**: liên kết bằng `aria-describedby`; **phải** trigger được bằng `focus` (bàn phím), không chỉ `hover`; đóng bằng phím `Esc`.
- **Responsive**: **ẩn hoàn toàn trên touch device** (không có khái niệm hover) — nội dung quan trọng trong Tooltip phải có đường dẫn thay thế (ví dụ icon "i" mở Popover khi tap trên mobile) — xem quy tắc chi tiết ở Popover.
- **Usage Example**: Tooltip giải thích thuật ngữ "Orb" khi hover vào label cột trong AspectTable.

#### Popover

- **Purpose**: Nội dung phong phú hơn Tooltip (có thể chứa nhiều dòng, link, thậm chí form nhỏ), mở bằng click, đóng khi click ra ngoài.
- **Props**: `trigger` (element), `content`, `placement`, `closeOnClickOutside` (mặc định `true`), `showArrow`.
- **Variants**: `default` (nền `surface-raised` + shadow).
- **Sizes**: `max-width: 320px` mặc định, có thể override.
- **States**: `closed`, `open`.
- **Accessibility**: `role="dialog"` (non-modal), quản lý focus trap nhẹ (Tab không thoát khỏi Popover khi đang mở nhưng `Esc` đóng và trả focus về trigger).
- **Responsive**: dưới `sm`, Popover chuyển thành **bottom sheet** thay vì nổi cạnh trigger (tránh tràn màn hình nhỏ) — đây chính là giải pháp thay thế Tooltip trên mobile được nhắc ở trên.
- **Usage Example**: Icon "i" cạnh "Ascendant" trên Chart Detail mở Popover giải thích khái niệm kèm link "Tìm hiểu thêm".

#### Dropdown (Menu)

- **Purpose**: Danh sách hành động dạng menu, mở từ 1 trigger (nút "...", Avatar).
- **Props**: `trigger`, `items` (array `{ label, icon?, onClick, danger?, disabled? }`), `placement`.
- **Variants**: `default`; item có thể nhóm bằng `Divider` bên trong.
- **Sizes**: chiều rộng tự động theo nội dung item dài nhất, `min-width: 180px`.
- **States**: `closed`, `open`; từng item có `hover`/`focus`/`disabled`.
- **Accessibility**: tuân theo [ARIA Menu Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) — điều hướng bằng mũi tên lên/xuống, `Home`/`End`, chọn bằng `Enter`.
- **Responsive**: dưới `sm`, chuyển thành bottom sheet giống Popover.
- **Usage Example**: Menu Avatar ở Navbar ("Hồ sơ", "Cài đặt", "Đăng xuất").

#### Modal

- **Purpose**: Hộp thoại chặn tương tác (modal thật sự), dùng cho hành động quan trọng cần xác nhận hoặc form ngắn không đáng 1 trang riêng.
- **Props**: `isOpen`, `onClose`, `title`, `size`, `closeOnOverlayClick` (mặc định `true`, `false` cho hành động phá hủy dữ liệu), `footer` (slot chứa action buttons).
- **Variants**: `default`, `danger` (viền/tiêu đề nhấn màu `color-danger`, dùng cho xác nhận Xóa chart).
- **Sizes**: `sm` (400px), `md` (560px, mặc định), `lg` (720px), `fullscreen` (mobile luôn dùng biến thể gần fullscreen).
- **States**: `closed`, `open`, `closing` (exit animation).
- **Accessibility**: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` trỏ `title`; **focus trap đầy đủ** (Tab không thoát); focus tự động vào Modal khi mở, trả về trigger khi đóng; `Esc` đóng trừ khi `closeOnOverlayClick=false` kèm hành động phá hủy (vẫn cho `Esc` nhưng không cho click nền).
- **Responsive**: dưới `sm`, mọi Modal (trừ `sm`) tự động chuyển thành fullscreen (tránh Modal nhỏ nổi giữa màn hình bé).
- **Usage Example**: Xác nhận "Xóa biểu đồ này?" dùng `Modal variant="danger" size="sm" closeOnOverlayClick={false}`.

#### Drawer

- **Purpose**: Panel trượt từ cạnh màn hình, dùng cho Sidebar mobile, bộ lọc nâng cao, hoặc xem nhanh chi tiết mà không rời trang.
- **Props**: `isOpen`, `onClose`, `placement` (`left`|`right`|`bottom`), `size`.
- **Variants**: theo `placement`.
- **Sizes**: `sm` (280px width nếu left/right), `md` (360px, mặc định), `lg` (480px); với `placement="bottom"`, size tính theo % chiều cao viewport (`50%`/`80%`).
- **States**: `closed`, `open`, `closing`.
- **Accessibility**: giống Modal (`role="dialog"`, focus trap, `Esc` đóng) — khác biệt duy nhất là animation trượt cạnh thay vì fade giữa màn hình.
- **Responsive**: `placement="bottom"` ưu tiên trên mobile (dễ thao tác 1 tay hơn `left`/`right`).
- **Usage Example**: Sidebar navigation trên mobile mở dưới dạng `Drawer placement="left"`.

---

### 9.6. Navigation

#### Tabs

- **Purpose**: Chuyển đổi giữa các view liên quan trong cùng ngữ cảnh mà không rời trang (ví dụ Chart Detail: Tab "Tổng quan" / "Bảng hành tinh" / "Aspect" / "Pattern").
- **Props**: `items` (array `{ value, label, icon?, disabled? }`), `value`, `onChange`, `variant`.
- **Variants**: `underline` (mặc định, gạch chân accent khi active — phù hợp cảm giác "instrument", tối giản), `pill` (nền bo tròn, dùng trong không gian hẹp như Toolbar của bảng).
- **Sizes**: `sm`, `md` (mặc định).
- **States**: mỗi tab có `default`, `active`, `hover`, `focus-visible`, `disabled`.
- **Accessibility**: tuân theo [ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) đầy đủ (`role="tablist"/"tab"/"tabpanel"`, điều hướng mũi tên trái/phải, `aria-selected`).
- **Responsive**: dưới `sm`, nếu số tab > 3, chuyển thành **scrollable tab list ngang** (không wrap xuống dòng, không ẩn bớt tab).
- **Usage Example**: 4 tab trên trang Chart Detail như ví dụ trên.

#### Accordion

- **Purpose**: Ẩn/hiện nội dung theo nhóm để giảm mật độ hiển thị ban đầu (ví dụ FAQ, hoặc "Xem chi tiết kỹ thuật" trong Interpretation Card cho người mới).
- **Props**: `items` (array `{ value, trigger, content }`), `type` (`single`|`multiple` — 1 hoặc nhiều panel mở cùng lúc), `defaultValue`, `collapsible` (cho `type="single"`, cho phép đóng hết).
- **Variants**: `default` (có Divider giữa các item), `bordered` (mỗi item là 1 Card riêng).
- **Sizes**: không có size scale.
- **States**: mỗi item có `collapsed`, `expanded`, `focus-visible` trên trigger.
- **Accessibility**: trigger là `<button aria-expanded>` điều khiển panel qua `aria-controls`; panel có `role="region"` + `aria-labelledby`.
- **Responsive**: không đổi cấu trúc theo breakpoint, chỉ giảm padding.
- **Usage Example**: "Xem chi tiết kỹ thuật" trong `InterpretationCard` dùng Accordion `type="single" collapsible`, mặc định đóng cho persona "Người mới".

---

## 10. Authentication Screens

### 10.1. Nguyên tắc chung

- Backend đã chốt: Register **không** tự động phát JWT (xem Project Summary mục 16) → sau khi đăng ký, UI phải điều hướng người dùng sang màn hình Login (hoặc màn hình "Kiểm tra email" placeholder) thay vì vào thẳng Dashboard.
- Layout Auth dùng khung riêng (`AuthLayout`), **không** dùng `AppLayout` đầy đủ (không Navbar/Sidebar) — chỉ có logo AstroViet căn giữa phía trên form, nền `color-bg-canvas`, có thể có `Divider variant="ring"` trang trí phía sau form (rất mờ, `opacity 0.08`) để không đơn điệu mà vẫn tối giản.
- Form rộng tối đa `400px`, căn giữa màn hình theo cả chiều dọc và ngang trên desktop; full-width có padding trên mobile.

### 10.2. Màn hình: Đăng ký (Register)

| Thành phần | Chi tiết |
|---|---|
| Trường | Email (`Input type="email"`), Mật khẩu (`Input type="password"` với toggle hiện/ẩn), Xác nhận mật khẩu, Checkbox "Tôi đồng ý với Điều khoản sử dụng" |
| Validation | Real-time qua Zod schema dùng chung với backend contract; hiện `errorText` ngay dưới field khi blur, không đợi submit |
| CTA chính | `Button variant="primary" fullWidth` "Tạo tài khoản" |
| Trạng thái loading | Button `isLoading=true` trong lúc gọi API, disable toàn form |
| Thành công | Điều hướng tới màn hình "Xác thực email" (placeholder — hiện thông báo, chưa gửi email thật theo Project Summary mục 13) |
| Lỗi (email đã tồn tại — `ConflictError`) | `Alert variant="danger"` phía trên form, giữ nguyên dữ liệu đã nhập (trừ mật khẩu) |
| Link phụ | "Đã có tài khoản? Đăng nhập" ở dưới form |

### 10.3. Màn hình: Đăng nhập (Login)

| Thành phần | Chi tiết |
|---|---|
| Trường | Email, Mật khẩu, Checkbox "Ghi nhớ đăng nhập" |
| CTA chính | `Button variant="primary" fullWidth` "Đăng nhập" |
| Lỗi (sai email/mật khẩu — `AuthenticationError`) | `Alert variant="danger"` thông báo chung "Email hoặc mật khẩu không đúng" — **không** tiết lộ email có tồn tại hay không (best practice bảo mật) |
| Link phụ | "Quên mật khẩu?" (điều hướng tới placeholder — backend Sprint 1 chưa có Forgot Password, đánh dấu Open Question mục 25), "Chưa có tài khoản? Đăng ký" |
| Sau đăng nhập thành công | Access Token lưu trong bộ nhớ (memory, Zustand) — **không** `localStorage`; Refresh Token do backend set qua `HttpOnly Cookie` (giả định theo kiến trúc Refresh Token mục 13 Project Summary — cần xác nhận với Backend, xem mục 25) |

### 10.4. Trạng thái Guest vs Authenticated (ảnh hưởng toàn UI)

| | Guest | Authenticated |
|---|---|---|
| Xem Natal Chart | ✅ (không lưu được) | ✅ |
| Lưu chart | ❌ (CTA "Đăng nhập để lưu" thay cho nút Save) | ✅ |
| Xem Interpretation đầy đủ | ❌ (giới hạn preview + CTA đăng nhập) | ✅ |
| Navbar | Hiện "Đăng nhập" / "Đăng ký" | Hiện `Avatar` + Dropdown |

---

## 11. App Layout (Phase 2)

### 11.1. Navbar

- **Purpose**: Điều hướng chính, luôn hiển thị (sticky top), chứa logo, menu chính, action đăng nhập/avatar.
- **Cấu trúc (desktop, ≥ lg)**: `[Logo] [Nav links: Natal Chart | Transit | Synastry | Kiến thức] ... [Language Switcher] [Theme Toggle] [Avatar/Auth Buttons]`.
- **Cấu trúc (mobile, < lg)**: `[Hamburger] [Logo căn giữa] [Avatar/Auth Button thu gọn]` — Nav links chuyển vào `Drawer`.
- **States**: `default`, `scrolled` (thêm `box-shadow` nhẹ + `background` từ trong suốt/blur sang `surface` đặc khi cuộn xuống, dùng `backdrop-filter: blur(8px)` — chi tiết tinh tế phù hợp thẩm mỹ "instrument kính").
- **Accessibility**: `<nav aria-label="Điều hướng chính">`; trang hiện tại đánh dấu `aria-current="page"`.
- **Responsive**: đã mô tả ở trên.

### 11.2. Footer

- **Purpose**: Thông tin phụ (liên kết pháp lý, mạng xã hội, ngôn ngữ) — không phải khu vực điều hướng chính.
- **Cấu trúc**: 3 cột (desktop) — "Sản phẩm" (link tính năng), "Tài nguyên" (Kiến thức, Blog), "Công ty/Pháp lý" (Điều khoản, Bảo mật, Liên hệ) — xếp dọc trên mobile.
- **Style**: nền tương phản nhẹ với canvas (`color-bg-surface`), `text-body-sm`, `color-text-secondary`.
- **Accessibility**: `<footer>` với heading ẩn `aria-label` mỗi cột nếu không có heading hiển thị.

### 11.3. Sidebar

- **Purpose**: Điều hướng phụ trong khu vực đã đăng nhập (Dashboard) — "Chart của tôi", "Hồ sơ sinh đã lưu", "Cài đặt".
- **Hiển thị**: chỉ ở các trang thuộc khu vực tài khoản (`/app/*`), **không** hiện ở Landing Page hay trang xem Chart công khai (guest flow).
- **Breakpoint**: hiện cố định bên trái ở `lg+` (width 240px, collapsible còn 64px chỉ-icon nếu người dùng chọn thu gọn — trạng thái lưu trong `localStorage` UI preference, không phải server state); chuyển thành `Drawer placement="left"` dưới `lg`.
- **Accessibility**: `<nav aria-label="Điều hướng tài khoản">`.

### 11.4. Breadcrumb

- **Purpose**: Định vị người dùng trong cây điều hướng sâu (ví dụ `Chart của tôi / Natal Chart — 12/05/1995`).
- **Props**: `items` (array `{ label, href? }` — item cuối không có `href`, là trang hiện tại).
- **Accessibility**: `<nav aria-label="Breadcrumb">` + `<ol>`; item cuối có `aria-current="page"`.
- **Responsive**: dưới `sm`, chỉ hiện item liền trước (dạng "← Chart của tôi") thay vì toàn bộ chuỗi, tránh tràn dòng.
- **Ẩn khi**: chỉ 1 cấp (ví dụ ngay tại "Chart của tôi") — không hiện Breadcrumb 1 item vô nghĩa.

### 11.5. Page Header

- **Purpose**: Tiêu đề trang + mô tả ngắn + action chính, đặt ngay dưới Breadcrumb.
- **Props**: `title`, `description`, `actions` (slot Button, ví dụ "Tạo biểu đồ mới"), `tabs` (optional, gắn `Tabs` ngay dưới header cho trang có sub-view như Chart Detail).
- **Responsive**: `actions` xuống dòng dưới `title` khi < `sm`.

### 11.6. Content Container

- **Purpose**: Vùng nội dung chính (`<main>`), bọc `Container` (mục 8.1), đảm bảo `min-height` cho sticky footer.
- **Accessibility**: đúng 1 `<main>` mỗi trang; có `id="main-content"` để hỗ trợ "Skip to content" link (mục 17.5).

### 11.7. Loading / Empty / Error (App Shell level)

Xem đặc tả chi tiết dùng chung toàn hệ thống ở **mục 18** — mục này chỉ xác nhận rằng `Content Container` là nơi các state này render (không phải toàn `AppLayout` bị thay thế, Navbar/Sidebar luôn giữ nguyên khi Content đang loading/error).

---

## 12. Astrology Components (Phase 3)

> Nhóm component này build trên nền Design System (Phase 1) + Layout (Phase 2), nhưng gắn chặt với domain model đã chốt trong Astrology Domain Specification (Planets, Houses, Angles, Aspects, Patterns). Props tham chiếu trực tiếp tới kiểu dữ liệu trả về từ REST API — **không** định nghĩa lại cấu trúc dữ liệu riêng cho UI để tránh lệch pha với backend.

### 12.1. Birth Form

- **Purpose**: Thu thập `BirthData` (ngày/giờ/địa điểm sinh) để tạo Chart — điểm vào quan trọng nhất của toàn hệ thống.
- **Props**: `onSubmit(birthData)`, `defaultValues` (dùng khi sửa Birth Profile đã lưu), `mode` (`create`|`edit`).
- **States**: chia **2 bước** (Progress, mục 9.3): (1) Thông tin cơ bản (Tên hồ sơ, Ngày/Giờ sinh, "Không rõ giờ sinh" checkbox — ảnh hưởng tới việc tính House/Ascendant), (2) Nơi sinh (`Select searchable` tích hợp tìm kiếm địa điểm → tự động suy ra timezone lịch sử tại thời điểm sinh, bắt buộc vì tính chart cần offset chính xác).
- **Validation đặc thù domain**: cảnh báo (`Alert warning`, không chặn submit) khi giờ sinh bị bỏ trống — giải thích rõ Ascendant và House sẽ không chính xác, dùng Whole Sign làm fallback hiển thị theo Noon Chart quy ước.
- **Accessibility**: mỗi bước là 1 `fieldset` với `legend` mô tả; điều hướng Next/Back giữ focus hợp lý (focus vào field đầu tiên của bước mới).
- **Responsive**: 1 cột trên mobile; date/time picker dùng input native (`<input type="date">`/`type="time"`) trên mobile để tận dụng UI hệ điều hành, dùng custom `Select`/calendar popover trên desktop cho trải nghiệm nhất quán với Design System.
- **Loading**: submit button `isLoading`, disable toàn form.
- **Empty**: N/A (form không có trạng thái "rỗng", luôn có giá trị mặc định là ngày hôm nay/giờ hiện tại làm gợi ý placeholder, không phải giá trị đã điền sẵn).
- **Error**: lỗi field-level dùng `Input errorText`; lỗi tra cứu địa điểm thất bại (mất mạng) dùng `Alert danger` với action "Thử lại".

### 12.2. Planet Table

- **Purpose**: Bảng liệt kê vị trí toàn bộ Celestial Objects (10 hành tinh + Chiron + tùy chọn Lilith/Nodes) trong 1 chart: Cung, Độ, Nhà, có Retrograde hay không.
- **Props**: `planets` (array theo response API), `densityMode` (`comfortable`|`compact`, mục 6.2), `showOptionalBodies` (bật/tắt Lilith/Nodes theo cài đặt người dùng), `onRowClick` (mở chi tiết interpretation của riêng hành tinh đó).
- **Cấu trúc cột**: `PlanetBadge` | Cung (`SignBadge`) | Độ (mono, tabular, dạng `15°23'47"`) | Nhà (`HouseBadge`) | Retrograde (icon ℞ nhỏ nếu có).
- **States**: `default`, `row-hover`, `row-selected` (khi liên kết chéo với Chart Wheel — click hành tinh trên Wheel highlight row tương ứng, xem 12.5).
- **Accessibility**: `<table>` ngữ nghĩa thật (không phải div-grid) với `<caption>` mô tả ("Vị trí hành tinh — Natal Chart"), `scope="col"` cho header.
- **Responsive**: chuyển sang card-per-row dưới `sm` (mục 7.2) — mỗi card hiện `PlanetBadge` lớn + các thông tin còn lại dạng label:value xếp dọc.
- **Loading**: `SkeletonPlanetTable` (10–13 dòng skeleton khớp số lượng celestial object mặc định).
- **Empty**: không áp dụng trong luồng bình thường (chart luôn có ≥ 10 hành tinh); chỉ xuất hiện nếu API lỗi một phần — xem Error.
- **Error**: nếu API trả về thiếu dữ liệu 1 phần (ví dụ tính lỗi 1 hành tinh), hiện `Alert warning` phía trên bảng "Một số dữ liệu không thể tính toán", vẫn hiển thị các hàng có dữ liệu hợp lệ (graceful degradation, không chặn toàn bộ bảng).

### 12.3. House Table

- **Purpose**: Bảng liệt kê 12 nhà theo House System đã chọn (Placidus/Whole Sign), gồm Cung tại cusp và Độ.
- **Props**: `houses`, `houseSystem` (hiện dưới dạng `Badge` nhỏ ở tiêu đề bảng để luôn rõ đang xem hệ nào), `angles` (ASC/MC/DSC/IC highlight riêng vì là điểm đặc biệt, không phải cusp thường).
- **States/Responsive/Accessibility**: tương tự Planet Table (bảng ngữ nghĩa, chuyển card dưới `sm`).
- **Loading**: `Skeleton` 12 dòng.
- **Empty**: N/A.
- **Error**: giống Planet Table — graceful degradation.

### 12.4. Aspect Table

- **Purpose**: Bảng ma trận hoặc danh sách các Aspect (Conjunction/Opposition/Square/Trine/Sextile) giữa các cặp hành tinh, kèm Orb thực tế so với Orb tối đa cho phép (mục 9 Project Summary).
- **Props**: `aspects`, `layout` (`list`|`grid` — `grid` là ma trận tam giác cổ điển kiểu astro.com, `list` là danh sách dòng — mặc định `list` trên mobile, `grid` khả dụng từ `lg`), `filterByPlanet` (lọc nhanh theo 1 hành tinh khi click từ Planet Table).
- **Cấu trúc cột (layout `list`)**: Hành tinh A (`PlanetBadge`) | `AspectBadge` (biểu tượng góc chiếu) | Hành tinh B (`PlanetBadge`) | Orb (mono, ví dụ `2°14'`, càng gần 0° càng đậm màu — nhưng vẫn giữ nguyên tắc không dùng màu làm kênh thông tin duy nhất, kèm sắp xếp theo orb tăng dần).
- **States**: `default`, `filtered` (khi `filterByPlanet` active, hiện `Badge` "Đang lọc: Sao Kim ✕" phía trên bảng để xóa filter).
- **Accessibility**: layout `grid` (ma trận) đặc biệt khó cho screen reader — bắt buộc cung cấp toggle "Xem dạng danh sách" luôn khả dụng làm phương án đọc được, ma trận chỉ nên coi là chế độ xem trực quan bổ sung, không phải nguồn thông tin duy nhất.
- **Responsive**: `grid` tự ẩn dưới `lg`, chỉ còn `list`.
- **Loading**: `Skeleton` dạng danh sách, số dòng ước lượng theo trung bình aspect/chart (~15–20 dòng).
- **Empty**: trường hợp hiếm (chart không có aspect nào trong orb cho phép) → `EmptyState` "Không tìm thấy góc chiếu nào trong phạm vi orb hiện tại" kèm gợi ý mở Cài đặt nới orb.
- **Error**: graceful degradation giống Planet Table.

### 12.5. Chart Wheel

- **Purpose**: Hiển thị trực quan toàn bộ chart dạng bánh xe tròn cổ điển — thành phần phức tạp và quan trọng nhất về mặt kỹ thuật.
- **Props**: `chartData` (planets, houses, aspects, angles), `size` (px, responsive theo container), `houseSystem`, `showAspectLines` (boolean, có thể tắt để giảm rối mắt khi chart nhiều aspect), `interactive` (bật hover/click từng hành tinh), `secondaryChartData` (optional — dùng cho Synastry/Transit overlay 2 vòng tròn).
- **Cấu trúc trực quan**: vòng ngoài = 12 cung hoàng đạo (glyph, mục 5.1), vòng giữa = 12 nhà (số La Mã nhỏ hoặc số thường tùy Locale), vòng trong = vị trí hành tinh (glyph + line nối tới vị trí chính xác), tâm = các đường Aspect nối giữa hành tinh (màu theo nhóm Aspect: Harmonious dùng `indigo`, Tense dùng `brass` đậm hơn hoặc pattern nét đứt — **không dùng đỏ/xanh lá trực tiếp** để tránh nhầm với `danger`/`success` semantic, giữ nguyên tắc "màu mã hóa dữ liệu ≠ màu semantic UI").
- **Render engine**: SVG (không phải Canvas) — bắt buộc để có thể gắn `<title>`/`aria-label` cho từng phần tử tương tác và hỗ trợ zoom vector không vỡ hình.
- **States**: `default`, `hover-planet` (highlight hành tinh + tất cả aspect liên quan, làm mờ phần còn lại), `selected-planet` (đồng bộ 2 chiều với Planet Table row-selected, mục 12.2).
- **Accessibility**: đây là thành phần **khó tiếp cận nhất trong toàn hệ thống** — bắt buộc: (1) Chart Wheel có `role="img"` với `aria-label` tóm tắt tổng quan (ví dụ "Biểu đồ Natal với Mặt Trời tại Sư Tử nhà 5..."), (2) toàn bộ dữ liệu trong Wheel **phải** có mặt song song ở Planet Table/House Table/Aspect Table dạng bảng thật — Chart Wheel không bao giờ là nguồn thông tin duy nhất, (3) từng hành tinh trên Wheel là 1 phần tử focusable (`tabindex="0"`) khi `interactive=true`, di chuyển bằng Tab, Enter để "chọn" (đồng bộ Planet Table).
- **Responsive**: xem quy tắc riêng ở mục 7.2 (pinch-to-zoom trong container vuông cố định dưới `md`, không scale chữ dưới 10px).
- **Loading**: `SkeletonChartWheel` — vòng tròn xám với hiệu ứng shimmer dạng cung (đồng bộ hình dạng The Ring).
- **Empty**: không áp dụng trong luồng chuẩn.
- **Error**: nếu tính toán Swiss Ephemeris thất bại (dữ liệu ngày sinh ngoài phạm vi ephemeris hỗ trợ), thay Wheel bằng `EmptyState` kiểu error, không cố render Wheel rỗng/méo.

### 12.6. Interpretation Card

- **Purpose**: Hiển thị đoạn diễn giải văn bản theo đúng thứ tự đã chốt (Planet in Sign → Planet in House → Aspect → Pattern → Elements → Modalities → Summary, mục 11 Project Summary).
- **Props**: `subject` (đối tượng đang diễn giải: 1 hành tinh, 1 aspect, hoặc "summary" tổng), `source` (`human`|`ai` — hiện `Badge` nhỏ góc trên nếu `ai`, minh bạch nguồn nội dung theo đúng quyết định "Server tự quyết định, Client không chọn" — Client chỉ hiển thị, không có UI để người dùng chọn nguồn), `content` (rich text ngắn), `technicalDetail` (optional, nội dung kỹ thuật đặt trong `Accordion` collapsed mặc định — phục vụ persona "Người mới" mục 1.4).
- **States**: `default`, `expanded` (khi accordion kỹ thuật mở).
- **Accessibility**: nội dung văn bản dài phải đảm bảo contrast + line-height chuẩn (mục 4.4); Badge nguồn AI có `aria-label="Nội dung do AI tạo"` không chỉ dựa icon.
- **Responsive**: full-width trong Stack dọc trên mọi breakpoint (không có layout ngang riêng).
- **Loading**: `Skeleton variant="text" count={3}`.
- **Empty**: trường hợp chưa có interpretation cho 1 subject cụ thể (dữ liệu chưa author hết) → hiện text nhẹ "Nội dung diễn giải đang được cập nhật" thay vì Card trống trơn.
- **Error**: nếu API interpretation lỗi riêng (tách API với chart calculation) → không chặn phần Chart Wheel/Table đã tải được, chỉ Card này hiện lỗi cục bộ nhỏ với nút "Thử lại".

### 12.7. Pattern Card

- **Purpose**: Nêu bật 1 Pattern được phát hiện (Grand Trine, T-Square, Stellium, Yod, Mystic Rectangle, Kite, Grand Cross, Bucket, Locomotive, Splash, See-Saw).
- **Props**: `patternType`, `involvedPlanets` (array `PlanetBadge`), `description`, `diagram` (optional mini SVG preview highlight pattern đó trên hình dạng Wheel thu nhỏ).
- **Variants**: dùng `Card variant="outline-accent"` làm nền tảng (mục 9.3) — Pattern là phát hiện "đáng chú ý" nên luôn nổi bật hơn Interpretation Card thường.
- **States**: `default`, `hover` (nếu click để jump tới highlight pattern đó trên Chart Wheel chính, đồng bộ 12.5).
- **Accessibility**: `diagram` mini là trang trí bổ trợ, `aria-hidden="true"` — thông tin đầy đủ nằm ở `involvedPlanets` + `description` dạng text.
- **Responsive**: danh sách Pattern Card xếp trong `Grid columns={{ xs: 1, md: 2 }}`.
- **Loading**: `Skeleton` dạng Card (rectangle lớn).
- **Empty**: **rất phổ biến** (không phải mọi chart đều có pattern đặc biệt) → `EmptyState` nhẹ nhàng, giọng điệu trung tính "Không phát hiện pattern đặc biệt nào trong biểu đồ này" — **không** dùng giọng tiêu cực kiểu "Rất tiếc...".
- **Error**: Pattern Engine là tính năng "Có thể triển khai sau" theo Project Summary mục 10 — nếu module này chưa deploy ở giai đoạn đầu, section Pattern ẩn hoàn toàn thay vì hiện Error (feature-flag ở tầng routing/data, không phải lỗi thật).

### 12.8. Planet Badge

- **Purpose**: Hiển thị 1 hành tinh/celestial body bằng glyph + tên, dùng lặp lại trong Planet Table, Aspect Table, Chart Wheel legend.
- **Props**: `planet` (enum: Sun, Moon, Mercury...Chiron, Lilith, NorthNode, SouthNode), `showLabel` (boolean — chỉ glyph khi `false`, dùng trong bảng dày đặc), `retrograde` (boolean, thêm ký hiệu ℞), `size`.
- **States**: `default`, `selected` (đồng bộ Chart Wheel), `dimmed` (khi 1 hành tinh khác đang được highlight trong Chart Wheel, các Planet Badge khác mờ đi trong Legend).
- **Accessibility**: glyph luôn kèm text tên hành tinh trong `aria-label` đầy đủ (ví dụ "Sao Diêm Vương, nghịch hành") kể cả khi `showLabel=false`.
- **Responsive**: `showLabel` tự động `false` trong cột hẹp của bảng dưới `sm` nếu dùng dạng bảng gốc (dù mục 7.2 khuyến nghị chuyển card, đây là fallback).
- **Loading/Empty/Error**: không áp dụng (component thuần hiển thị, không tự fetch data).

### 12.9. Sign Badge

- **Purpose**: Hiển thị 1 cung hoàng đạo bằng glyph + tên, kèm mã màu Element (mục 3.5) dưới dạng dot nhỏ 8px bên cạnh (không tô màu toàn Badge — giữ nguyên tắc "ít màu").
- **Props**: `sign` (enum 12 cung), `showElement` (boolean, hiện dot màu), `size`.
- **Accessibility**: `aria-label` gồm cả tên cung và element (ví dụ "Sư Tử, thuộc nguyên tố Lửa") vì dot màu không đọc được bởi screen reader.
- **Loading/Empty/Error**: không áp dụng.

### 12.10. House Badge

- **Purpose**: Hiển thị số nhà (1–12) dạng số La Mã hoặc số thường (theo cấu hình Locale/preference), có thể kèm nhãn "Angular/Succedent/Cadent" khi cần chi tiết (dùng trong Interpretation, không phải trong bảng dày đặc).
- **Props**: `house` (1–12), `numeralStyle` (`roman`|`arabic`), `showCategory` (boolean).
- **Accessibility**: số La Mã phải có `aria-label` bằng số thường + "Nhà" (ví dụ số La Mã "V" → `aria-label="Nhà thứ 5"`) vì số La Mã khó với screen reader không hỗ trợ tốt.
- **Loading/Empty/Error**: không áp dụng.

### 12.11. Aspect Badge

- **Purpose**: Biểu tượng hình học chuẩn cho 1 loại Aspect (☌ Conjunction, ☍ Opposition, □ Square, △ Trine, ⚹ Sextile).
- **Props**: `aspectType`, `size`, `showLabel`.
- **Variants**: màu phân nhóm theo tính chất — **Harmonious** (Trine, Sextile) dùng `indigo`; **Tense** (Square, Opposition) dùng `brass` đậm; **Neutral** (Conjunction) dùng `slate` — đây là mã hóa dữ liệu chiêm tinh, tách biệt khỏi Semantic Colors mục 3.4 (không dùng danger/success vì Square/Opposition không "xấu" theo nghĩa tuyệt đối trong astrology, chỉ là "căng thẳng/cần chú ý").
- **Accessibility**: `aria-label` đầy đủ tên aspect bằng tiếng Việt (ví dụ "Vuông chiếu" cho Square).
- **Loading/Empty/Error**: không áp dụng.

### 12.12. Element Chart

- **Purpose**: Biểu đồ tổng hợp phân bố 4 nguyên tố (Lửa/Đất/Khí/Nước) trong toàn bộ chart — dùng Recharts (đã chốt trong stack).
- **Props**: `distribution` (`{ fire, earth, air, water }` — số lượng hoặc %), `chartType` (`donut`|`bar`).
- **Variants**: `donut` (mặc định, phù hợp hình tròn đồng điệu thẩm mỹ Chart Wheel), `bar` (dùng khi cần so sánh chính xác hơn, ví dụ trong Compact Mode).
- **Accessibility**: Recharts SVG output cần bổ sung `<title>`/`role="img"` thủ công + bảng dữ liệu ẩn (`sr-only`) liệt kê số liệu chính xác cho screen reader (chart trực quan không tự accessible).
- **Responsive**: `size` co theo container, tối thiểu `120px` để label không vỡ.
- **Loading**: `Skeleton variant="circle"`.
- **Empty**: không áp dụng (luôn có dữ liệu khi chart tồn tại).
- **Error**: ẩn component nếu dữ liệu element không tính được, không hiện chart rỗng gây hiểu lầm.

### 12.13. Modality Chart

- **Purpose**: Tương tự Element Chart nhưng cho 3 Modality (Cardinal/Fixed/Mutable).
- **Props/Variants/Accessibility/Responsive/Loading/Empty/Error**: kế thừa toàn bộ đặc tả từ Element Chart (12.12), chỉ khác tập dữ liệu 3 giá trị thay vì 4 và **không** dùng Element Colors (mục 3.5) — dùng 3 sắc độ của `indigo` (light/base/dark) vì Modality không có bảng màu quy ước riêng trong domain, tránh tạo thêm 1 bảng màu mới không cần thiết.

---

## 13. Page Specification

| # | Route | Trang | Layout | Guest | Auth | Component chính |
|---|---|---|---|---|---|---|
| 1 | `/` | Landing Page | `MarketingLayout` (Navbar + Footer, không Sidebar) | ✅ | ✅ | Hero, giới thiệu tính năng, CTA "Tạo biểu đồ miễn phí" |
| 2 | `/register` | Đăng ký | `AuthLayout` | ✅ | redirect `/app` nếu đã đăng nhập | Xem mục 10.2 |
| 3 | `/login` | Đăng nhập | `AuthLayout` | ✅ | redirect `/app` | Xem mục 10.3 |
| 4 | `/chart/new` | Tạo biểu đồ (Guest hoặc User) | `MarketingLayout` | ✅ (không lưu) | ✅ (có lưu) | `Birth Form` |
| 5 | `/chart/:chartId` | Chart Detail | `MarketingLayout` (nếu chart public/guest) hoặc `AppLayout` (nếu chart thuộc user đã đăng nhập) | ✅ (chart tạo bởi guest, session-based, xem 25) | ✅ | `Page Header` + `Tabs` (Tổng quan/Bảng hành tinh/Aspect/Pattern) + `Chart Wheel` + `Planet Table`/`House Table`/`Aspect Table`/`Pattern Card`/`Interpretation Card`/`Element Chart`/`Modality Chart` |
| 6 | `/app` (`/app/charts`) | Chart của tôi (Dashboard) | `AppLayout` (Navbar + Sidebar) | ❌ redirect `/login` | ✅ | `Grid` danh sách `Card` chart đã lưu, Empty State nếu chưa có chart nào |
| 7 | `/app/profiles` | Hồ sơ sinh đã lưu | `AppLayout` | ❌ | ✅ | Danh sách `BirthProfile` (mutable, khác Chart immutable — mục 5 Project Summary), CRUD |
| 8 | `/app/settings` | Cài đặt | `AppLayout` | ❌ | ✅ | House System mặc định, Theme, Ngôn ngữ, Hiện thuật ngữ kỹ thuật, Density Mode |
| 9 | `/knowledge` | Kiến thức Astrology | `MarketingLayout` | ✅ | ✅ | Danh sách bài viết (`Pagination`), phục vụ persona "Người mới" |
| 10 | `/knowledge/:slug` | Chi tiết bài viết | `MarketingLayout` | ✅ | ✅ | Nội dung markdown-rendered |
| 11 | `*` (404) | Không tìm thấy | `MarketingLayout` | ✅ | ✅ | `EmptyState` kiểu error, CTA về trang chủ |

> Các trang cho **Transit / Synastry / Composite / Progression / Solar Return** (Supported Chart, mục 7 Project Summary) dùng chung route pattern `/chart/:chartId` với `chartType` khác nhau trong response — Chart Wheel (12.5) đã hỗ trợ `secondaryChartData` sẵn cho Synastry/Transit overlay, không cần trang riêng biệt về mặt UI.

---

## 14. Routing Structure

### 14.1. Cây route (React Router v6+, khai báo dạng object route)

```
/                         MarketingLayout
├── /                     LandingPage
├── /register             AuthLayout > RegisterPage
├── /login                AuthLayout > LoginPage
├── /chart/new            BirthFormPage
├── /chart/:chartId       ChartDetailPage
├── /knowledge            KnowledgeListPage
├── /knowledge/:slug      KnowledgeDetailPage
├── /app                  AppLayout (route cha, bọc ProtectedRoute)
│   ├── /app                 → redirect /app/charts
│   ├── /app/charts          ChartsDashboardPage
│   ├── /app/profiles        BirthProfilesPage
│   └── /app/settings        SettingsPage
└── *                     NotFoundPage
```

### 14.2. Route Guard

- `ProtectedRoute` (bọc toàn bộ nhánh `/app/*`): kiểm tra trạng thái auth từ Zustand store; nếu chưa đăng nhập → redirect `/login?redirect=<current-path>` (giữ lại đường dẫn để quay lại sau khi login thành công).
- Không cần `GuestOnlyRoute` phức tạp cho `/login`/`/register` — chỉ cần check đơn giản trong component, redirect nếu đã có access token hợp lệ.

### 14.3. Code Splitting theo route

Mỗi Page component dùng `React.lazy()` + `Suspense` (fallback = Skeleton phù hợp trang đó, không phải Spinner chung chung) — chi tiết ngân sách bundle ở mục 20.

---

## 15. State Management

Nguyên tắc chốt: **phân loại state theo nguồn**, không dùng 1 công cụ cho mọi loại state.

| Loại state | Công cụ | Ví dụ |
|---|---|---|
| **Server State** (dữ liệu từ API — chart, planets, aspects, danh sách chart đã lưu...) | **TanStack Query** | `useQuery(['chart', chartId])`, cache, refetch, stale-while-revalidate |
| **Global UI State** (không đến từ server, cần chia sẻ nhiều nơi) | **Zustand** | Auth token (in-memory), Theme hiện tại, trạng thái mở/đóng Sidebar, Density Mode preference |
| **Local Component State** | `useState`/`useReducer` | Trạng thái mở Modal, giá trị input đang gõ trước khi submit |
| **Form State** | **React Hook Form** | Toàn bộ Birth Form, Auth Form — không đưa form state vào Zustand |
| **URL State** | React Router (`searchParams`) | Filter trong Aspect Table (`filterByPlanet`), trang hiện tại của Pagination — để có thể share link/refresh không mất trạng thái |

### 15.1. Quy tắc ranh giới quan trọng

- **Không** lưu dữ liệu chart (server state) vào Zustand — mọi thứ TanStack Query quản lý được thì để nó quản lý (tránh 2 nguồn sự thật).
- **Không** lưu Access Token vào `localStorage`/`sessionStorage` (rủi ro XSS) — chỉ lưu trong Zustand store (memory), mất khi refresh trang → dùng Refresh Token (HttpOnly Cookie, do backend set) để silent-refresh lại Access Token khi app khởi động (xem Open Question mục 25 về xác nhận cơ chế này với Backend).
- Density Mode, Theme preference, Sidebar collapsed: lưu Zustand **+ persist vào `localStorage`** (đây là UI preference thuần túy, không nhạy cảm) qua middleware `persist` của Zustand.

### 15.2. TanStack Query — quy ước

- Query key namespace theo domain: `['chart', chartId]`, `['chart', chartId, 'interpretation']`, `['profiles']`, `['profile', profileId]`.
- `staleTime` cho Chart data: **Infinity** — vì Chart là **immutable** (mục 5 Project Summary, đã snapshot khi tạo), không cần refetch trừ khi invalidate thủ công.
- `staleTime` cho `profiles` (BirthProfile, **mutable**): mặc định TanStack Query (0, refetch khi cần) vì có thể bị sửa.
- Mutation (Register, Login, Save Chart, Update Profile) dùng `useMutation` + `invalidateQueries` tương ứng sau khi thành công, kết hợp Toast (mục 9.4) báo kết quả.

---

## 16. Theme System

### 16.1. Cơ chế chuyển Light/Dark

- Toàn bộ Alias Token (mục 3.3) định nghĩa 2 lần trong CSS qua `[data-theme="light"]`/`[data-theme="dark"]` selector ở `:root` — component **không bao giờ** biết mình đang ở theme nào, chỉ dùng Alias Token.
- `data-theme` attribute đặt trên `<html>`, điều khiển bởi Zustand store (`theme: 'light' | 'dark' | 'system'`), persist `localStorage`.
- Mặc định `system`: đọc `prefers-color-scheme` lần đầu, sau đó nếu người dùng chọn thủ công thì ghi đè và không đổi theo hệ điều hành nữa.
- **Không** flash sai theme khi load trang (FOUC): đọc `localStorage` + set `data-theme` bằng inline script trong `<head>` trước khi React hydrate.

### 16.2. Dark Mode không phải "invert"

Theo nguyên tắc mục 1.2, `midnight-900` (`#10131F`) được thiết kế riêng — không phải `ink-900` bị đảo ngược. `brass-500` chuyển thành `brass-400` sáng hơn ở Dark Mode để đảm bảo contrast trên nền tối (mục 3.3) thay vì giữ nguyên giá trị.

### 16.3. Z-index Scale

| Token | Giá trị | Dùng cho |
|---|---|---|
| `z-dropdown` | 1000 | Dropdown, Select options |
| `z-sticky` | 1100 | Navbar sticky, sticky table header |
| `z-drawer` | 1200 | Drawer, Sidebar mobile |
| `z-modal-overlay` | 1300 | Nền mờ phía sau Modal |
| `z-modal` | 1310 | Modal content |
| `z-popover` | 1400 | Popover, Tooltip (luôn trên Modal nếu mở trong Modal) |
| `z-toast` | 1500 | Toast (luôn trên cùng) |

### 16.4. Theme Token cho Astrology-specific colors

Element Colors (3.5) và Aspect Badge colors (12.11) **giữ nguyên giá trị hex giữa Light/Dark** (không có cặp riêng) — chỉ nền/text UI đổi theo theme, vì đây là dữ liệu mã hóa cần nhất quán để người dùng nhận diện quen mắt bất kể theme (tương tự cách bản đồ giữ màu địa hình bất kể chế độ ngày/đêm).

---

## 17. Accessibility Guidelines

### 17.1. Chuẩn tuân thủ

**WCAG 2.1 Level AA** cho toàn bộ sản phẩm — đây là **yêu cầu bắt buộc**, không phải "nice-to-have", vì Chart Wheel (12.5) vốn dĩ là nội dung trực quan phức tạp cần đối trọng bằng dữ liệu dạng bảng có thể đọc được.

### 17.2. Nguyên tắc xuyên suốt

1. **Không có thông tin nào chỉ tồn tại dưới 1 dạng thức duy nhất** (màu, hình dạng trực quan như Chart Wheel) — luôn có phiên bản text/bảng song song.
2. **Điều hướng bàn phím đầy đủ** cho mọi thành phần tương tác — không có "chuột-only" component.
3. **Focus visible** rõ ràng: dùng `color-focus-ring` (mục 3.3), `box-shadow: 0 0 0 3px var(--color-focus-ring)`, không bao giờ `outline: none` mà không thay thế.
4. **Contrast**: tối thiểu 4.5:1 (text thường), 3:1 (text lớn/icon/thành phần đồ họa quan trọng như đường viền input).
5. **Skip to content link**: ẩn, hiện khi focus (phím Tab đầu tiên), trỏ tới `#main-content` (mục 11.6).
6. **Ngôn ngữ trang**: `<html lang="vi">` mặc định, đổi động theo i18next khi chuyển ngôn ngữ.
7. **Reduced Motion**: tôn trọng `prefers-reduced-motion: reduce` toàn cục (chi tiết mục 19).

### 17.3. Kiểm tra bắt buộc trước khi merge (Definition of Done cho mọi PR UI)

- [ ] Điều hướng toàn bộ flow bằng bàn phím (Tab/Shift+Tab/Enter/Esc/Arrow keys theo pattern).
- [ ] Chạy automated check (axe-core trong CI, xem mục 23) không có lỗi mức `critical`/`serious`.
- [ ] Test tối thiểu 1 screen reader (VoiceOver hoặc NVDA) cho component mới thuộc nhóm Astrology Components (12.x).
- [ ] Test ở `200% zoom` không vỡ layout.

---

## 18. Loading / Error / Empty States

### 18.1. Nguyên tắc chung

Ba trạng thái này được xem là **first-class UI**, thiết kế song song với Success state ngay từ đầu — không phải xử lý "thêm vào sau".

### 18.2. Loading

| Ngữ cảnh | Component |
|---|---|
| Toàn trang lần đầu load | `PageSkeleton` (composite riêng theo từng page, ví dụ `ChartDetailPageSkeleton` gồm `SkeletonChartWheel` + `Skeleton` bảng) |
| Vùng nội dung nhỏ trong trang đã load | `Skeleton` cục bộ tại đúng vị trí nội dung sẽ xuất hiện |
| Hành động submit (form, button) | `Button isLoading` — không dùng `Spinner` toàn trang cho hành động cục bộ |
| Chuyển trang (route lazy load) | `Spinner size="lg"` giữa màn hình, chỉ dùng khi không có Skeleton phù hợp (fallback cuối cùng) |

**Quy tắc**: Skeleton phải **giữ đúng layout** (kích thước/vị trí) của nội dung thật để tránh Cumulative Layout Shift khi data trả về.

### 18.3. Empty State

Component `EmptyState` dùng chung: `icon`/`illustration` (dùng The Ring làm watermark mờ phía sau — mục 1.3), `title`, `description`, `action` (Button CTA).

| Ngữ cảnh | Nội dung |
|---|---|
| Chưa có chart nào đã lưu | "Bạn chưa lưu biểu đồ nào" + CTA "Tạo biểu đồ đầu tiên" |
| Không có Pattern trong chart | Xem mục 12.7 — giọng điệu trung tính, không tiêu cực |
| Aspect Table rỗng theo orb hiện tại | Xem mục 12.4 |
| Kết quả tìm kiếm Knowledge Base rỗng | "Không tìm thấy bài viết phù hợp với '<query>'" + gợi ý xóa filter |

### 18.4. Error State

| Loại lỗi | Cách xử lý |
|---|---|
| Lỗi field-level (validation) | Inline trong `Input`/`Select` `errorText`, không dùng Toast |
| Lỗi hành động (submit thất bại — network, 4xx/5xx) | `Toast variant="danger"` + giữ nguyên dữ liệu form đã nhập (không mất input) |
| Lỗi tải dữ liệu 1 phần (graceful degradation) | `Alert warning` cục bộ, phần dữ liệu hợp lệ vẫn hiển thị (mục 12.2, 12.3) |
| Lỗi tải dữ liệu toàn phần (không thể render trang) | `PageErrorState` (full-page, tương tự EmptyState nhưng tone khác) + nút "Thử lại" + (nếu lỗi lặp lại) link liên hệ hỗ trợ |
| Lỗi hệ thống không xác định (React Error Boundary) | `ErrorBoundary` cấp `AppLayout` bắt lỗi render, hiện `PageErrorState` chung, log lỗi (Sentry hoặc tương đương — xem Open Question mục 25) |

---

## 19. Animation Guidelines

### 19.1. Nguyên tắc

Theo tinh thần "instrument chính xác", animation dùng **có chủ đích, không trang trí thừa** — mỗi animation phải trả lời được câu hỏi "nó giúp người dùng hiểu điều gì đang xảy ra?".

### 19.2. Thư viện

- **CSS Transition/Animation** cho mọi hiệu ứng đơn giản (hover, focus, fade, slide của Toast/Modal/Drawer/Dropdown) — ưu tiên vì nhẹ, không cần JS runtime.
- **Framer Motion** (đã chốt, "khi cần") **chỉ** dùng cho: (1) Chart Wheel — vẽ dần các đường Aspect khi chart load lần đầu (đúng tinh thần "vẽ bằng dụng cụ đo"), (2) The Ring draw-on reveal ở Hero, (3) transition giữa các Tab trong Chart Detail (crossfade nội dung, không phải slide).

### 19.3. Duration & Easing Token

| Token | Giá trị | Dùng cho |
|---|---|---|
| `duration-fast` | 120ms | Hover, focus state |
| `duration-base` | 200ms | Toast, Dropdown, Tooltip enter/exit |
| `duration-slow` | 320ms | Modal, Drawer |
| `duration-deliberate` | 600–900ms | Chart Wheel draw-on, The Ring reveal (chỉ dùng 1 lần khi trang load) |
| `ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Mặc định cho phần lớn transition |
| `ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Phần tử đi vào (enter) |
| `ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Phần tử đi ra (exit) |

### 19.4. `prefers-reduced-motion`

Khi bật, **toàn bộ** animation `duration-deliberate` bị tắt hoàn toàn (Chart Wheel/Ring hiện ngay lập tức, không vẽ dần); các animation UI cơ bản (`fast`/`base`) giảm còn cross-fade đơn giản thay vì transform/scale, theo đúng chuẩn accessibility (mục 17.2 điểm 7).

---

## 20. Performance Guidelines

### 20.1. Ngân sách hiệu năng (Performance Budget)

| Chỉ số | Ngân sách |
|---|---|
| Largest Contentful Paint (LCP) | < 2.5s trên 4G |
| Total JS bundle (initial route) | < 180KB gzip |
| Chart Wheel render (từ khi có data tới khi vẽ xong) | < 300ms cho chart chuẩn (~10 hành tinh, ~20 aspect) |

### 20.2. Kỹ thuật bắt buộc

- **Route-based code splitting** (mục 14.3) — mỗi Page là 1 chunk riêng.
- **Font**: self-host `.woff2`, `font-display: swap`, subset Vietnamese + Latin (loại bỏ glyph không dùng để giảm dung lượng, mục 4.1).
- **Recharts/Framer Motion**: import theo module cụ thể (tree-shakable), không `import * as`.
- **Ảnh** (nếu có, ví dụ ảnh minh họa Knowledge Base): dùng `<img loading="lazy">` ngoài viewport đầu tiên, format `webp` có fallback.
- **TanStack Query**: `staleTime` hợp lý (mục 15.2) để giảm request thừa, đặc biệt với Chart data immutable.
- **Chart Wheel SVG**: memoize phần tử tĩnh (vòng cung hoàng đạo, cung nhà) — chỉ re-render phần động (đường Aspect, vị trí hover) khi state đổi.

---

## 21. File Structure

```
frontend/
├── public/
│   └── fonts/                     # Newsreader, Inter, IBM Plex Mono (.woff2, self-hosted)
├── src/
│   ├── app/                       # App bootstrap: providers, router, App.tsx
│   ├── routes/                    # Page components theo route (mục 13, 14)
│   │   ├── landing/
│   │   ├── auth/                  # register/, login/
│   │   ├── chart/                 # new/, detail/
│   │   ├── app/                   # charts/, profiles/, settings/ (bọc ProtectedRoute)
│   │   └── knowledge/
│   ├── components/
│   │   ├── ui/                    # Phase 1 — Design System (Button, Input, Card...)
│   │   ├── layout/                # Phase 2 — Navbar, Footer, Sidebar, AppLayout, AuthLayout...
│   │   └── astrology/             # Phase 3 — PlanetTable, ChartWheel, PlanetBadge...
│   ├── hooks/                     # useAuth, useTheme, useChartQuery... (custom hooks, không phải component)
│   ├── stores/                    # Zustand stores: authStore, uiStore, themeStore
│   ├── api/                       # API client (axios/fetch wrapper) + TanStack Query hooks theo domain
│   │   ├── client.ts
│   │   ├── auth/
│   │   ├── chart/
│   │   └── profile/
│   ├── lib/                       # Tiện ích thuần (formatDegree, zodSchemas dùng chung FE/BE contract...)
│   ├── styles/                    # tokens.css (mục 2), tailwind base layer, font-face
│   ├── locales/                   # i18next: vi/, en/ (nếu mở rộng)
│   ├── types/                     # TypeScript types generate/đồng bộ từ OpenAPI spec backend
│   └── test/                      # test setup, mock server (MSW), test utils
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

> **Đồng bộ kiểu dữ liệu Backend ↔ Frontend**: `src/types/` nên được **generate tự động** từ OpenAPI spec của Backend (ví dụ `openapi-typescript`) thay vì viết tay, để tránh lệch khi Backend đổi contract — cần thêm vào CI pipeline (Open Question mục 25).

---

## 22. Naming Convention

| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| Component file | `PascalCase.tsx`, tên file = tên component | `PlanetTable.tsx` |
| Component thư mục (khi có sub-file: test, story) | `PascalCase/` chứa `index.tsx` + `ComponentName.test.tsx` | `PlanetTable/index.tsx` |
| Hook | `useCamelCase.ts`, luôn bắt đầu `use` | `useChartQuery.ts` |
| Zustand store | `camelCaseStore.ts` | `authStore.ts` |
| Type/Interface | `PascalCase`, không prefix `I` | `type PlanetPosition`, không `IPlanetPosition` |
| Enum domain (Sign, Aspect, House System...) | `PascalCase` cho tên enum, `PascalCase` cho member | `enum ZodiacSign { Aries, Taurus... }` |
| CSS/Design Token | `kebab-case`, prefix theo category (mục 2.2) | `--color-accent-primary` |
| Test file | trùng tên component + `.test.tsx` (unit/component), `.spec.ts` cho E2E | `PlanetTable.test.tsx`, `chart-detail.spec.ts` |
| Route path | `kebab-case` | `/chart/new`, không `/chart/New` |
| Boolean prop | prefix `is`/`has`/`show` | `isLoading`, `showLabel`, `hasError` |
| Event handler prop | prefix `on` | `onSubmit`, `onRowClick` |

---

## 23. Testing Strategy

### 23.1. Các tầng test

| Tầng | Công cụ | Phạm vi |
|---|---|---|
| **Unit Test** | Vitest | Hàm thuần trong `lib/` (ví dụ `formatDegree`, hàm tính Element distribution phía client nếu có) |
| **Component Test** | Vitest + React Testing Library | Từng component Phase 1/2/3 độc lập — test theo **behavior**, không test chi tiết implementation (query bằng role/label, không query bằng class CSS) |
| **API Mocking** | **MSW** (đã chốt trong roadmap mục 18 Project Summary) | Mock response theo đúng OpenAPI contract của Backend cho mọi Component/Integration Test |
| **Accessibility Test** | `axe-core` (`vitest-axe` hoặc tương đương), chạy trong CI | Bắt buộc cho mọi component mới trong `components/ui` và `components/astrology` |
| **E2E Test** | Playwright | Luồng chính: Register → Login, Tạo Birth Form → Xem Chart, Lưu Chart, Guest → Login redirect flow |

### 23.2. Ưu tiên test theo rủi ro

1. **Cao nhất**: `Birth Form` (validation phức tạp, ảnh hưởng trực tiếp độ chính xác chart), `Chart Wheel` accessibility (mục 17.3), Auth flow (Register/Login/redirect).
2. **Trung bình**: `PlanetTable`/`AspectTable` responsive behavior (chuyển table ↔ card), `ProtectedRoute` guard logic.
3. **Thấp hơn** (nhưng vẫn bắt buộc component test cơ bản): các UI primitive ít logic (`Divider`, `Avatar`, `Badge`).

### 23.3. Coverage target

Không đặt mục tiêu % coverage cứng nhắc toàn cục (dễ dẫn tới test vô nghĩa chỉ để đạt số) — thay vào đó bắt buộc: **mọi PR thêm component mới trong `ui/` hoặc `astrology/` phải có ít nhất 1 Component Test + 1 Accessibility Test** trước khi merge (Definition of Done, đồng bộ mục 17.3).

---

## 24. Future Extensibility

Tài liệu này thiết kế theo hướng **MVP trước, Scale sau** (đúng Coding Philosophy mục 21 Project Summary), nhưng các điểm sau được chừa sẵn chỗ mở rộng có chủ đích:

| Hướng mở rộng tương lai | Cách spec hiện tại đã chừa chỗ |
|---|---|
| **SaaS hóa** (gói trả phí, nhiều tier) | `Badge` variant đã có sẵn cho hiển thị tier (mục 9.3); `authStore` tách biệt rõ user info khỏi UI state, dễ thêm field `plan`/`tier` |
| **Đa ngôn ngữ ngoài Việt/Anh** | `i18next` + `locales/` theo mã ngôn ngữ chuẩn ISO, không hardcode string trong component; Type Scale (mục 4.4) đã tính tới yêu cầu line-height cho ngôn ngữ có dấu |
| **Theme tùy biến theo thương hiệu (white-label, nếu SaaS B2B)** | Kiến trúc 3 lớp token (mục 2.1) cho phép thêm 1 lớp theme thứ 3 (`brand`) mà không đổi component |
| **Thêm Chart Type mới** (ngoài 6 loại đã chốt) | Route pattern `/chart/:chartId` dùng chung, `Chart Wheel` đã hỗ trợ `secondaryChartData` cho overlay — chart type mới chỉ cần thêm xử lý dữ liệu, không đổi UI component |
| **Mobile App (React Native) trong tương lai xa** | Token layer (mục 2) tách biệt hoàn toàn khỏi component implementation — có thể tái sử dụng token cho design system RN riêng nếu cần |
| **Pattern Engine triển khai đầy đủ sau** | `PatternCard` (12.7) đã đặc tả sẵn, chỉ cần bật feature flag khi Backend hoàn thành (mục 10 Project Summary: "Có thể triển khai sau") |

---

## 25. Open Questions

Danh sách các điểm **chưa đủ thông tin để chốt** trong tài liệu này, cần xác nhận với Backend/Product trước hoặc trong Sprint 1 Frontend:

1. **Cơ chế lưu Refresh Token phía Client**: Project Summary (mục 13) xác nhận Refresh Token được "Lưu DB, Hash, Rotate" ở Backend, nhưng chưa rõ Backend trả Refresh Token qua `HttpOnly Cookie` hay qua response body (ảnh hưởng trực tiếp thiết kế `authStore` và luồng silent-refresh ở mục 15.1) — **cần xác nhận với Backend trước khi implement Auth flow**.
2. **Quên mật khẩu (Forgot Password)**: chưa thấy trong roadmap Backend Sprint 1 (chỉ có Register/Login/Refresh/Email Verification Placeholder) — mục 10.3 tạm để link trỏ tới placeholder, cần quyết định có đưa vào Sprint 1 Frontend hay hoãn.
3. **Runtime Module System**: Project Summary ghi backend dùng **CommonJS**, nhưng repo thực tế trên nhánh `dev` cấu hình **ESM** (`"type": "module"`) — không ảnh hưởng trực tiếp Frontend Spec này, nhưng nêu lại để đồng bộ tài liệu tổng.
4. **Chart của Guest**: mục 13 giả định Chart tạo bởi Guest có thể xem qua `/chart/:chartId` (session-based, không cần login) — cần Backend xác nhận Chart ID có tồn tại độc lập với User hay bắt buộc phải có `userId` (ảnh hưởng luồng "Guest xem Natal Chart" trong PRD).
5. **Error tracking / Observability phía Frontend**: mục 18.4 nhắc tới Sentry "hoặc tương đương" nhưng chưa có trong danh sách Infrastructure đã chốt (mục Project Summary chỉ có Docker/CI cho Backend) — cần quyết định công cụ trước khi implement `ErrorBoundary` cấp production.
6. **Generate type tự động từ OpenAPI**: mục 21 đề xuất dùng `openapi-typescript`, cần thêm bước này vào CI Frontend (song song CI Backend hiện có) — chưa có trong roadmap hiện tại.
7. **Ngưỡng chính xác giờ sinh không rõ (Unknown Birth Time)**: mục 12.1 giả định dùng "Noon Chart" làm quy ước khi thiếu giờ sinh — cần xác nhận đây có đúng là quy ước Backend/Astrology Engine đã implement hay không (ảnh hưởng cách hiển thị cảnh báo trong Birth Form).
8. **Density Mode và Compact Mode cho Chart Wheel**: mục 6.2 định nghĩa Density Mode cho bảng, nhưng chưa rõ Chart Wheel có cần biến thể "compact" riêng cho màn hình rất nhỏ hay chỉ dựa vào pinch-to-zoom (mục 7.2) — cần review với Design/UX trước khi bắt tay Phase 3.

---

*Hết tài liệu. Mọi thay đổi với spec này cần được review và cập nhật lại tài liệu trước khi áp dụng vào code, theo nguyên tắc "Single Source of Truth" ở đầu tài liệu.*
