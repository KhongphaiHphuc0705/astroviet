# M9.0 — Báo cáo đo bố cục Chart Viewer

**Ngày:** 2026-10-23 · **Repo/commit:** `dev` `84fc4b2` · **Phạm vi:** đo và nguyên mẫu, **không sửa mã sản phẩm** · Đặt đề xuất tại `docs/implementation/archive/sprint-f4/evidence/m9_0_layout_measurement.md`.

## 1. Môi trường và giới hạn (đọc trước)

| Hạng mục | Giá trị |
|---|---|
| Trình duyệt | **HeadlessChrome 153.0.8010.0** (Linux, gói npm `@sparticuz/chromium` + `puppeteer-core`), **không** phải Windows Chrome/Edge |
| Ứng dụng | `npm run build` từ `dev` `84fc4b2`, phục vụ bằng `vite preview` (cổng 4173) |
| Dữ liệu | mock mạng: `POST /auth/refresh` (user giả) và `GET /charts/:id` trả `fixture_full.json` (CAPTURED, 10 hành tinh, 9 aspect, có nhà) |
| Nguyên mẫu hai cột | **thao tác DOM tạm** + CSS thật (`container-type:inline-size`, `@container`, `@media(min-height)`, `position:sticky`) — **không phải** mã React cuối cùng |
| Phông | sandbox **không có phông glyph chiêm tinh/`℞`** ⇒ glyph hiện ô vuông; chiều cao hàng chữ có thể lệch vài px so với Windows/macOS |
| **Chưa kiểm** | Firefox, Safari, màn hình cảm ứng thật, cấu hình DPI/zoom hệ điều hành, chiều cao thật với phông hệ thống, sticky ngoài Chromium |

## 2. Đường cơ sở (mã hiện tại, một cột, sidebar mở/thu gọn)

| Viewport | Sidebar | `main` | `Container` trang | Shell | Card wheel (R×C) | SVG | padding `main`/trang | tràn ngang trang |
|---|---|---|---|---|---|---|---|---|
| 375x800 | - | 375 | 343 | **311** | 311×665 | 400 | 16px / 16px | không |
| 768x900 | - | 768 | 704 | **640** | 640×937 | 590 | 32px / 32px | không |
| 1023x900 | - | 1023 | 959 | **895** | 895×940 | 640 | 32px / 32px | không |
| 1024x900 | open | 784 | 720 | **656** | 656×925 | 606 | 32px / 32px | không |
| 1024x900 | collapsed | 960 | 896 | **832** | 832×940 | 640 | 32px / 32px | không |
| 1100x900 | open | 860 | 796 | **732** | 732×940 | 640 | 32px / 32px | không |
| 1100x900 | collapsed | 1036 | 972 | **908** | 908×940 | 640 | 32px / 32px | không |
| 1280x900 | open | 1040 | 976 | **912** | 912×940 | 640 | 32px / 32px | không |
| 1280x900 | collapsed | 1216 | 1152 | **1088** | 1088×940 | 640 | 32px / 32px | không |
| 1440x900 | open | 1200 | 1136 | **1072** | 1072×940 | 640 | 32px / 32px | không |
| 1440x900 | collapsed | 1376 | 1200 | **1136** | 1136×940 | 640 | 32px / 32px | không |

**Đối chiếu với `[calc]` của plan:** chiều rộng Shell đo được **khớp từng điểm** với công thức (375→311, 768→640, 1023→895, 1024 mở→656, 1024 thu gọn→832, 1280 mở→912, 1440 mở→1072). Padding lồng **được xác nhận** bằng computed style (`16px/16px` ở 375, `32px/32px` từ 768). `Container` mặc định bị chặn ở 1200 px (thấy ở 1440 thu gọn: 1200) ⇒ `size="wide"` (1440) có tác dụng từ viewport ≳ 1500. **Không có tràn ngang trang** ở bất kỳ viewport nào đã đo; ở 375 SVG 400 px nằm trong vùng cuộn 311 px.

## 3. Nguyên mẫu hai cột + sticky (ngưỡng thử `T = 1010 px`, `min-height = 1000 px`)

Mỗi biến thể dùng **trang mới** (script ban đầu để rò trạng thái padding giữa các biến thể ⇒ đã sửa và đo lại; bảng dưới là lần sạch).

| Viewport | Sidebar | Padding trang | Container | Bố cục | Cột trái (R×C) | Cột phải | Bảng tràn (px, 0 = không) | Sticky `top` sau cuộn 700 | Hai cột ở T=1010? |
|---|---|---|---|---|---|---|---|---|---|
| 1024x1100 | open | current | 656 | block | 656×925 | 656 | 0 | 88 | không |
| 1024x1100 | open | fixed | 720 | block | 720×940 | 720 | 0 | 88 | không |
| 1024x1100 | collapsed | current | 832 | block | 832×940 | 832 | 0 | 88 | không |
| 1024x1100 | collapsed | fixed | 896 | block | 896×940 | 896 | 0 | 88 | không |
| 1280x1100 | open | current | 912 | block | 912×940 | 912 | 0 | 88 | không |
| 1280x1100 | open | fixed | 976 | block | 976×940 | 976 | 0 | 88 | không |
| 1280x1100 | collapsed | current | 1088 | grid | 448×813 | 616 | 0 | 88 | CÓ |
| 1280x1100 | collapsed | fixed | 1152 | grid | 470×833 | 658 | 0 | 88 | CÓ |
| 1366x1100 | open | current | 998 | block | 998×940 | 998 | 0 | 88 | không |
| 1366x1100 | open | fixed | 1062 | grid | 448×813 | 590 | 0 | 88 | CÓ |
| 1366x1100 | collapsed | current | 1136 | grid | 463×826 | 649 | 0 | 88 | CÓ |
| 1366x1100 | collapsed | fixed | 1200 | grid | 490×834 | 686 | 0 | 88 | CÓ |
| 1440x1100 | open | current | 1072 | grid | 448×813 | 600 | 0 | 88 | CÓ |
| 1440x1100 | open | fixed | 1136 | grid | 463×826 | 649 | 0 | 88 | CÓ |
| 1440x1100 | collapsed | current | 1136 | grid | 463×826 | 649 | 0 | 88 | CÓ |
| 1440x1100 | collapsed | fixed | 1200 | grid | 490×834 | 686 | 0 | 88 | CÓ |

Lưu ý đọc bảng: ở các hàng `block` (một cột) cột trái rộng bằng container nên chiều cao (≈ 925–940) là của wheel 640 px; ở hàng `grid` cột trái 448–490 px nên cao 813–834. "Padding trang = fixed" mô phỏng `paddingX={false}` (gỡ `px-4 md:px-8` của `Container` trang).

## 4. Phép đo bổ sung

| Phép đo | Kết quả |
|---|---|
| **Bề rộng tối thiểu để không cuộn ngang** của bảng (đo ở cột phải 424/504 px) | **Aspect Table 532 px**; Planet Table 436 px; House Table + Các góc chính ≤ 424 px (vừa) |
| Chiều cao cột trái (`1280×1100`, sidebar mở, padding fixed, T=960) | chưa chọn **813**; chọn hành tinh **869**; chọn aspect **887** |
| Cột phải ở T=960 (right = 504) | Aspect Table vẫn cuộn ngang (532 > 504) — ảnh `m9_0_two_column_prototype_1280.png` cho thấy cột "Trạng thái" bị cắt |
| Sticky trong `container-type:inline-size` (Chromium 153) | **Hoạt động**: `top = 88` sau cuộn 700 ở mọi hàng; **không** có tổ tiên nào có `overflow` khác `visible` |
| Mobile 375 (đường cơ sở) | wheel ở 1× hiển thị ≈ 311/400 px bề rộng bản vẽ, cuộn bắt đầu từ trái ⇒ nửa phải (DSC) bị che cho tới khi cuộn — **bằng chứng ủng hộ việc căn giữa ban đầu** (A1) |

## 5. Ngưỡng tạm thời rút ra

| Tham số | Giá trị tạm | Căn cứ đo |
|---|---|---|
| Ngưỡng hai cột (container) | **1010 px** | cột trái tối thiểu 448 (Card `p-6` + wheel ≥ 400) + khe 24 + Aspect Table 532 = **1004** ⇒ làm tròn 1010; ở ngưỡng này không bảng nào cuộn ngang |
| Chặn sticky theo chiều cao | **`min-height: 1000px`** | cột trái cao tối đa đo được 887 + `top` 88 + lề đáy 24 = **999** |
| Padding trang chart | `Container size="wide" paddingX={false}` | +64 px container ở mọi viewport (ví dụ 1366 mở: 998 → 1062) |
| **Khoá cuối** | **M9.1**, trên mã React thật sau khi áp padding | owner: "ngưỡng cuối có bằng chứng từ kiểm tra giao diện" |

**Hệ quả cần biết (không tự quyết):**
1. Với padding đã bỏ và T=1010, hai cột xuất hiện từ khoảng **viewport 1314 (sidebar mở)** hoặc **1138 (thu gọn)**. Tại 1366×(sidebar mở): 998 → **một cột** nếu giữ padding hiện tại, **hai cột** nếu bỏ padding (1062) — chứng minh D-M9-06 có tác dụng thật. Trong khoảng `lg`–≈ 1313 (sidebar mở) Desktop dùng một cột giống Tablet.
2. **Sticky chỉ bật khi viewport cao ≥ 1000 px** (màn 1440p/4K, hoặc cửa sổ rất cao); phần lớn màn 1080p (viewport ≈ 940–970 px) sẽ **không dính** — an toàn nhưng giá trị thực tế thấp. Phương án giảm ngưỡng (ví dụ rút chiều cao cột trái ≈ 130 px bằng cách gọn legend/mô tả công tắc ⇒ ngưỡng ≈ 870) là **quyết định thiết kế riêng**, chưa áp dụng.
3. Không có bảng nào cần cuộn ngang ở cột phải khi T ≥ 1010 (đã đo 590–686 px).

## 6. Ảnh minh chứng

| Tệp | Nội dung |
|---|---|
| `m9_0_two_column_prototype_1280.png` | 1280×1100, sidebar mở, padding đã bỏ, T=960 (thử): cột trái dính, cột phải cuộn; Aspect Table bị cắt ở 504 px |
| `m9_0_1024_collapsed_right_col_424.png` | 1024, sidebar thu gọn, cột phải 424 px |
| `m9_0_mobile_375_baseline.png` | 375: Card wheel bị che nửa phải ở 1× |

## 7. Tái hiện

Gói `m9_0_measurement_scripts.zip` (`harness.mjs`, `m9_0_measure.mjs`, `baseline.mjs`): `cd frontend && npm run build && npx vite preview --port 4173 --strictPort`, rồi `CHROME_PATH=… node m9_0_measure.mjs "1024,1100;1366,1100"` (cần `npm i puppeteer-core`; nếu không có `CHROME_PATH` thì dùng `@sparticuz/chromium`). Đổi `T`/`H` bằng biến môi trường.
