# Review đề xuất UI/UX Fix (6 vấn đề) — đối chiếu với code thật trên `origin/dev`

**Ngày review**: 2026-09-30. Toàn bộ đối chiếu dưới đây đọc trực tiếp source code thật (`BirthProfileForm.tsx`, `schema.ts`, `formFields.ts`, `Checkbox/index.tsx`, `LocationSearchField.tsx`, `page.tsx`, `tokens.css`, `tailwind.config.ts`), không suy đoán. Kết luận chung: **3/6 đề xuất là đúng hướng nhưng cần điều chỉnh kỹ thuật để không phá vỡ invariant đã có (INV-BP2, backend contract)**, **1/6 phát hiện ra 1 bug khác nghiêm trọng hơn mô tả gốc**, **2/6 chẩn đoán không khớp với code hiện tại** (không phải "sai đề xuất", nhưng nguyên nhân bạn nêu không phải nguyên nhân thật).

---

## Vấn đề 5 (đổi thứ tự vì đây là bug nghiêm trọng nhất) — Checkbox "Tôi biết rõ giờ sinh" hiển thị sai trạng thái

**Xác nhận: đúng là bug thật, nhưng KHÔNG phải do default logic sai.** `BirthProfileForm.tsx` đã set đúng `isBirthTimeKnown: true` làm default, và `disabled={!isBirthTimeKnown}` đọc đúng giá trị này — nghĩa là **input giờ sinh ĐÃ enable đúng ngay từ đầu** (khớp chính xác điều bạn đề xuất). Vậy tại sao checkbox lại HIỂN THỊ như chưa tick?

**Root cause thật (đã trace chính xác)**: `getCheckboxFieldProps` chỉ trả về `form.register(name)` — tức `{name, onChange, onBlur, ref}`, **không có `checked`**. `Checkbox` (component dùng chung) chỉ dùng giá trị RHF khi được truyền `checked` tường minh (`isControlled = checked !== undefined`); nếu không, nó tự quản lý state nội bộ **luôn khởi tạo `false`**, bất kể RHF thật sự là `true`. Kết quả:
- Checkbox HIỂN THỊ chưa tick (state nội bộ = false) dù RHF `isBirthTimeKnown` thật sự = `true` → input vẫn enable (đúng RHF) → bạn gõ được giờ bình thường dù thấy checkbox chưa tick.
- Bấm 1 lần: chỉ đồng bộ lại hiển thị (nội bộ false→true), RHF không đổi (vẫn true) → không có gì thay đổi quan sát được.
- Bấm lần 2 (untick): RHF chuyển `false`, `birthTime` bị xóa, input mới thật sự disable → đúng như bạn mô tả "chỉ khi tick rồi bỏ tick mới disable".

**Đây không phải vấn đề "chọn sai default" — đây là 1 bug binding UI thật.** Sửa bằng cách thêm đúng 1 prop:
```tsx
<Checkbox
  id="isBirthTimeKnown-checkbox"
  checked={isBirthTimeKnown}   // ← dòng thiếu, isBirthTimeKnown đã có sẵn từ watch()
  {...checkboxProps}
  onChange={...}
/>
```
**Không cần đổi `defaultValues`** (đã đúng `true` từ trước) — đề xuất "mặc định TICK SẴN + ENABLE" của bạn **đã là hành vi RHF thật, chỉ là UI không phản ánh đúng**. Đây là fix 1 dòng, rủi ro thấp nhất trong 6 vấn đề, không đụng schema/backend/invariant nào.

---

## Vấn đề 1 — Field giờ sinh dùng `type="time"` gây nhầm 12h/24h

**Xác nhận đúng**: code hiện tại là `<Input type="time" step={1} .../>` — native picker, định dạng 12h/24h phụ thuộc locale trình duyệt/OS, không kiểm soát được từ HTML. Đề xuất của bạn (chuyển sang `type="text"` + mask số, ép 24h, bỏ field giây khỏi UI) là **hướng kỹ thuật đúng và là cách duy nhất đảm bảo nhất quán mọi trình duyệt** — không có thư viện mask nào có sẵn trong `package.json`, nên viết tay 1 formatter đơn giản (gõ số tự chèn `:`) thay vì thêm dependency mới, phù hợp với chủ trương "không thêm thư viện khi chưa có bằng chứng cần thiết" đã áp dụng xuyên suốt F3.

**Có đụng quyết định cũ không?** M3 Decision D4 chọn "dùng native input mọi kích thước màn hình" — nhưng lý do D4 đưa ra là **tránh phải xây `useMediaQuery` + logic khác nhau cho desktop/mobile** (theo UI Spec §802 yêu cầu 2 loại input tùy viewport). Đề xuất của bạn là **1 implementation duy nhất cho mọi kích thước màn hình** (không phân nhánh theo viewport) — nghĩa là **không vi phạm tinh thần D4**, chỉ thay đổi lựa chọn cụ thể "loại input nào" trong phạm vi D4 vẫn cho phép. Kết luận: **áp dụng được, không xung đột**.

**Điểm cần làm đúng để không vỡ backend contract**: backend yêu cầu chính xác `HH:mm:ss` (regex `^\d{2}:\d{2}:\d{2}$`, xác nhận từ `schema.ts`). Khi bỏ field giây khỏi UI, hàm submit (ở `BirthProfileForm` hoặc mapper tùy vị trí implement) phải tự nối `:00`, và **giá trị lưu trong RHF field `birthTime` vẫn phải đúng format đủ giây** (không chỉ lúc submit — vì `.superRefine`/regex validate cả field này khi người dùng rời khỏi input, mode `onBlur`). Cách an toàn nhất: input mask chỉ hiển thị `HH:mm`, nhưng `onChange` ghi vào RHF `${HH}:${mm}:00` luôn (không đợi tới submit mới nối) — tránh case validate lỗi giữa chừng vì thiếu giây.

---

## Vấn đề 3 — Dropdown gợi ý địa điểm tràn UI

**Phát hiện quan trọng: 3/4 phần đề xuất ĐÃ CÓ SẴN trong code**, chỉ thiếu đúng 1 thuộc tính. `LocationSearchField.tsx` dòng dropdown container:
```
className="max-h-60 flex flex-col overflow-hidden rounded-md border border-subtle bg-surface-raised py-1 shadow-level-3"
```
Đã có: `max-h-60` (đúng số bạn đề xuất), `border border-subtle` (viền), `shadow-level-3` (bóng đổ). **Chỉ thiếu/sai đúng 1 từ: `overflow-hidden` phải là `overflow-y-auto`.** Hiện tại nội dung vượt quá 240px bị **cắt/ẩn hoàn toàn** (không tràn ra ngoài đè lên UI khác như bạn mô tả, mà là mất luôn phần còn lại — không cuộn được để xem). Nếu bạn quan sát thấy "tràn UI đè lên thành phần khác" cụ thể, khả năng cao là bạn đang test bản build/deploy cũ hơn HEAD hiện tại của `dev` — **đề xuất xác nhận lại đúng phiên bản đang test trước khi merge fix**, để tránh sửa lại phần đã đúng.

**Fix thực tế**: đổi `overflow-hidden` → `overflow-y-auto` (1 từ). Không cần thêm border/shadow như đề xuất vì đã tồn tại.

---

## Vấn đề 4 — Text phụ quá tối trên nền Card tối

**Xác nhận đúng và nghiêm trọng hơn "hơi tối"** — đã tính chính xác tỷ lệ tương phản WCAG từ token màu thật (`tokens.css`):

| Class đang dùng | Token thật | Màu (dark mode) | Tương phản trên nền Card (`#161b2e`) | Chuẩn WCAG AA (văn bản thường: 4.5:1) |
|---|---|---|---|---|
| `text-subtle` (đang dùng cho Ngày sinh/Nơi sinh, `page.tsx` dòng ~92-104) | `--color-border-subtle` | `#2a3150` | **1.34:1** | ❌ Fail nặng — gần như vô hình |
| `text-muted` (đề xuất đổi sang) | `--color-text-muted` | `#9ca3af` (slate-400) | **6.72:1** | ✅ Pass thoải mái |
| `text-primary` (đang dùng đúng cho tên hồ sơ) | `--color-text-primary` | `#eef0f4` (paper-100) | 14.96:1 | ✅ Pass |

**Nguyên nhân gốc không phải "chọn màu hơi tối"** — mà là **dùng nhầm token**: `text-subtle` trong hệ thống design token của dự án thật ra map tới `--color-border-subtle` (màu dành cho **viền**, không phải chữ), không phải `--color-text-muted` như tên gọi "subtle" khiến người viết code lầm tưởng. Đây là lỗi dùng sai class, không phải thiếu 1 bậc màu.

**Fix chính xác**: đổi `text-subtle` → `text-muted` ở 2 dòng hiển thị Ngày sinh/Nơi sinh trong `page.tsx`. Tiêu đề chính (tên hồ sơ) đã đúng `text-primary` từ trước, không cần đổi.

**Về icon 📅/📍**: đây là **ký tự emoji thô**, không phải icon component (`lucide-react`) như `IdCard` đã dùng ở sidebar (M6). Emoji không nhận `color`/`className` để đổi màu theo design token — đề xuất "đổi màu icon primary/accent" **không áp dụng được trực tiếp** với emoji. Nếu muốn icon có màu nhất quán với design system, cần thay bằng icon component thật (`Calendar`, `MapPin` từ `lucide-react`, đã có sẵn trong dependency, cùng thư viện đang dùng cho `IdCard`) — đây là thay đổi lớn hơn 1 chút (đổi loại phần tử, không chỉ đổi màu), nên tách thành quyết định riêng nếu muốn làm, không bắt buộc để giải quyết vấn đề tương phản chính (2 dòng emoji hiện tại không phải nguồn gây khó đọc — chữ mới là vấn đề).

---

## Vấn đề 2 — "Tên hồ sơ" không nên bắt buộc; "Họ và tên" nên là định danh chính

**Đây là đề xuất có rủi ro thật nếu làm đúng như mô tả — vi phạm 1 invariant đã có ở tầng Backend.**

`label` (hiển thị UI là "Tên hồ sơ") có ràng buộc cứng **INV-BP2** tại tầng Backend: bắt buộc, 1–100 ký tự — validate ở CẢ domain entity LẪN Zod schema frontend (`label: z.string().min(1).max(100)`). `fullName` ("Họ và tên") thì **optional/nullable, KHÔNG có giới hạn ký tự** ở cả 2 tầng hiện tại.

**Nếu làm đúng y hệt đề xuất** ("bỏ field Tên hồ sơ, khi submit tự map `profileName = fullName`"):
- Nếu người dùng để trống "Họ và tên" (hiện đang optional, không có gì buộc họ điền) → `label` được map = `""`/`null` → **backend từ chối ngay với 422 `VALIDATION_ERROR`** (đã có message tiếng Việt từ M6: "Thông tin bạn nhập chưa hợp lệ") — người dùng sẽ gặp lỗi khó hiểu vì họ không còn thấy field nào tên "Tên hồ sơ" để biết cần sửa gì.
- Nếu "Họ và tên" dài hơn 100 ký tự (hiện không giới hạn ở UI) → map sang `label` → backend từ chối tương tự (vi phạm max 100 của INV-BP2).

**Đề xuất tối ưu hơn (đạt đúng mục tiêu UX của bạn — 1 field định danh chính, không cần người dùng hiểu khái niệm "tên hồ sơ" — mà không phá INV-BP2):**
1. **Đổi field "Họ và tên" (`fullName`) thành bắt buộc**, thêm validate `min(1)` và **`max(100)`** vào Zod schema (đồng bộ giới hạn với `label`).
2. Khi submit, map: `label = fullName.trim()` (không phải map ngược hay để trống) — tức "Họ và tên" người dùng nhập **trở thành cả `label` lẫn `fullName`** gửi lên backend (2 field backend vẫn nhận đủ, nhưng UI chỉ cho nhập 1 lần) — không có field nào bị bỏ trống/vi phạm invariant.
3. **Ẩn field "Tên hồ sơ" khỏi UI** đúng như đề xuất — người dùng không còn thấy khái niệm này nữa.
4. Card danh sách: đổi tiêu đề chính từ `profile.label` sang `profile.fullName` (đã có class `text-primary`/`text-heading-sm` đúng từ trước — chỉ đổi field, không đổi style).

Cách này giữ nguyên 100% hợp đồng API/backend (không cần Backend đổi gì, không vi phạm INV-BP2), chỉ thay đổi tầng UI + mapping — đúng đúng tinh thần "Submit Boundary" đã thiết lập từ M3 (mapping form→API là việc của tầng ngoài form, ở đây cụ thể là phép gán `label=fullName` ngay trước khi gọi mutation).

**Việc khác cần lưu ý**: `label` hiện đang dùng làm `aria-label` cho nút Sửa/Xóa (`aria-label="Sửa hồ sơ ${profile.label}"`, M4) — nếu đổi Card hiển thị chính sang `fullName`, nên đồng bộ luôn `aria-label` sang `fullName` để nhất quán trải nghiệm đọc màn hình, tránh 1 nơi nói "tên hồ sơ", 1 nơi nói "họ tên" cho cùng 1 khái niệm hiển thị.

---

## Vấn đề 6 — Phân trang: 16 hồ sơ vẫn nằm trên 1 trang

**Cả 2 tiền đề trong chẩn đoán của bạn đều không khớp với code hiện tại** (không có nghĩa đề xuất vô giá trị, nhưng nguyên nhân bạn nêu không phải nguyên nhân thật):

1. *"mặc định 10 items"* — **sai**, `pages/app/profiles/page.tsx` dòng 17: `const PAGE_SIZE = 20;` — đây là con số đã chốt có chủ đích ở M4 (khớp default `pageSize=20` của backend).
2. *"chưa gửi tường minh param limit"* — **sai**, dòng 40 đã gửi tường minh `pageSize: PAGE_SIZE` trong mọi request (`useBirthProfilesQuery({page, pageSize: PAGE_SIZE})`). Backend dùng tên tham số `page`/`pageSize`, không có `limit` (đã xác nhận từ OpenAPI thật ở M1) — nếu có chỗ nào đó gửi `limit` sẽ bị backend bỏ qua vì không khớp schema.

**16 hồ sơ nằm gọn 1 trang, không hiện nút phân trang, là hành vi ĐÚNG THIẾT KẾ**: `{data.total > PAGE_SIZE && (...)}` — vì `16 > 20` = false nên toàn bộ khối phân trang (kể cả 2 nút Trước/Sau) chủ động ẩn đi khi mọi thứ vừa 1 trang (quyết định UX từ M4, tránh hiện nút vô nghĩa). Đây không phải bug — bạn cần **>20 hồ sơ** để thấy trang thứ 2 xuất hiện, không phải 10.

**Nếu mục tiêu thật là "muốn dễ test phân trang hơn / 20 hồ sơ mỗi trang là nhiều với card layout"**: đây là 1 quyết định sản phẩm hợp lệ, không phải bug fix — chỉ cần đổi **1 dòng duy nhất** `const PAGE_SIZE = 20` → `10` (hằng số đã cô lập sẵn, không có chỗ nào khác cần sửa theo). Không cần "cập nhật lại hook/query để gửi tường minh" như đề xuất — hook đã gửi tường minh từ đầu, chỉ cần đổi giá trị hằng số.

**Về Grid layout**: `Grid columns={{xs:"1", md:"2", lg:"3"}}` — đây là **grid cột cố định theo breakpoint**, không phải "lưới tự động" như bạn mô tả. Nếu các hàng trông không đều, nguyên nhân nhiều khả năng là các `Card` có độ dài nội dung khác nhau (tên dài/ngắn, có/không "Họ và tên") khiến chiều cao card không đều — không phải do chọn sai loại grid. Fix khuyến nghị (nếu vẫn thấy lệch sau khi test lại): thêm `items-stretch` (đảm bảo Card trong cùng hàng cao bằng nhau) thay vì đổi cơ chế Grid.

---

## Tổng kết mức độ rủi ro nếu triển khai đúng đề xuất gốc (chưa điều chỉnh)

| # | Vấn đề | Đề xuất gốc có phá vỡ gì không? |
|---|---|---|
| 1 | Giờ sinh mask input | Không phá gì, cần đảm bảo RHF field luôn giữ đủ `:ss` (không chỉ lúc submit) |
| 2 | Bỏ "Tên hồ sơ" | **Có** — có thể tạo lỗi 422 khó hiểu nếu làm đúng y hệt (map rỗng/quá dài vào field bắt buộc `label`) — đã có phương án thay thế an toàn ở trên |
| 3 | Dropdown scroll | Không phá gì — 3/4 phần đã có sẵn, chỉ cần đổi 1 từ CSS |
| 4 | Tương phản màu | Không phá gì — nhưng phần "đổi màu icon" không áp dụng được cho emoji, cần tách quyết định riêng nếu muốn |
| 5 | Checkbox mặc định | Không phá gì — nhưng chẩn đoán "default sai" không đúng; root cause thật là thiếu `checked` prop, fix khác với đề xuất mô tả |
| 6 | Phân trang | Không phá gì nếu chỉ đổi `PAGE_SIZE`, nhưng 2 tiền đề chẩn đoán (10 items, chưa gửi limit) đều sai so với code thật |

Không có đề xuất nào đụng tới Backend, Chart module, hay các invariant M1-M2 (INV-BP1, query key namespace, ownership 403/404) — toàn bộ đều nằm gọn trong `features/birth-profile/ui/` và `pages/app/profiles/`, đúng ranh giới đã thiết lập xuyên suốt F3.
