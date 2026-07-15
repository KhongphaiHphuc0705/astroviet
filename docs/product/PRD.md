# Product Requirements Document (PRD)
## AstroViet — Nền tảng Chiêm tinh học phương Tây cho người Việt

| | |
|---|---|
| **Phiên bản** | 1.0 |
| **Ngày soạn** | 09/07/2026 |
| **Người soạn** | Lead Product Manager |
| **Trạng thái** | Draft — chờ review |
| **Đội ngũ** | 1 Developer (dự án cá nhân) |
| **Deadline dự kiến** | 3–4 tháng |

> **Ghi chú:** Tên sản phẩm "AstroViet" là tên tạm đặt để tiện tham chiếu xuyên suốt tài liệu. Bạn có thể thay bằng tên chính thức bất cứ lúc nào — chỉ cần tìm/thay thế trong file.

---

## 1. Tổng quan dự án (Project Overview)

### 1.1 Tóm tắt
AstroViet là một nền tảng web chuyên biệt về Chiêm tinh học phương Tây (Western Astrology), được thiết kế riêng cho người dùng Việt Nam. Sản phẩm cho phép người dùng tự lập bản đồ sao cá nhân (Natal Chart) và nhận được các báo cáo giải mã tự động, chi tiết, viết hoàn toàn bằng tiếng Việt — điều mà hầu hết các công cụ chiêm tinh phổ biến hiện nay (Co-Star, Astro.com, The Pattern...) chưa đáp ứng tốt.

### 1.2 Bối cảnh ra đời
Tại Việt Nam, nhu cầu tìm hiểu bản thân qua chiêm tinh học đang tăng nhanh trong nhóm Gen Z và Millennials, thể hiện qua sự phổ biến của các cộng đồng chiêm tinh trên mạng xã hội (Facebook, TikTok, Threads). Tuy nhiên, phần lớn công cụ lập lá số hiện có đều bằng tiếng Anh, giao diện phức tạp, hoặc diễn giải theo văn phong phương Tây khó tiếp cận với người mới. Đây là khoảng trống thị trường mà AstroViet hướng đến lấp đầy: **một công cụ chính xác về mặt kỹ thuật (tính toán thiên văn) nhưng thân thiện, dễ hiểu về mặt nội dung (diễn giải tiếng Việt)**.

### 1.3 Mục tiêu kinh doanh (Business Goals)

| Mục tiêu | Mô tả |
|---|---|
| **Xây dựng cộng đồng ban đầu** | Đạt lượng người dùng đăng ký ổn định trong 3 tháng đầu ra mắt, tạo nền tảng cho các vòng tăng trưởng tiếp theo |
| **Kiểm chứng mô hình sản phẩm** | Xác thực giả thuyết: người dùng Việt sẵn sàng trả phí / tương tác thường xuyên với nội dung chiêm tinh có bản địa hóa tốt |
| **Tạo tài sản nội dung** | Xây dựng thư viện kiến thức chiêm tinh tiếng Việt có giá trị SEO và giá trị cộng đồng lâu dài |
| **Đặt nền móng monetization** | Dù MVP có thể miễn phí, sản phẩm cần được thiết kế sẵn sàng cho các mô hình thu phí trong tương lai (freemium, gói dự báo chuyên sâu...) |

---

## 2. Khách hàng mục tiêu & Nỗi đau (Target Audience & Pain Points)

### 2.1 User Personas

**Persona 1 — "Linh, 24 tuổi, Nhân viên Marketing (Người khám phá bản thân)"**
- Thường xuyên làm trắc nghiệm tính cách (MBTI, Enneagram), tò mò về chiêm tinh nhưng chưa hiểu sâu.
- **Nỗi đau:** Các trang lập lá số nước ngoài dùng thuật ngữ tiếng Anh chuyên ngành, khó hiểu; không biết bắt đầu từ đâu.
- **Mong muốn:** Một bản giải mã "dễ nuốt", có thể áp dụng vào công việc, tình yêu, định hướng cá nhân.

**Persona 2 — "Nam, 27 tuổi, đang tìm hiểu một mối quan hệ mới"**
- Muốn xem độ hợp giữa mình và người yêu/crush trước khi tiến xa hơn.
- **Nỗi đau:** Các công cụ synastry miễn phí hiện có thường hời hợt, chỉ cho điểm số mà không giải thích lý do; công cụ chuyên sâu thì trả phí bằng USD, khó thanh toán.
- **Mong muốn:** Phân tích tương hợp có chiều sâu nhưng vẫn dễ hiểu, thanh toán bằng VNĐ.

**Persona 3 — "Thảo, 22 tuổi, sinh viên, người nghiên cứu nghiệp dư"**
- Đã tự học chiêm tinh qua sách và cộng đồng online, cần công cụ tính toán chính xác để thực hành.
- **Nỗi đau:** Astro.com giao diện lỗi thời, khó thao tác trên mobile; thiếu tài liệu tiếng Việt hệ thống để tra cứu song song.
- **Mong muốn:** Công cụ lập lá số nhanh, chính xác, có thư viện kiến thức đủ sâu để đối chiếu khi học.

**Persona 4 — "Chị Hương, 34 tuổi, quan tâm vận hạn hàng năm"**
- Có gia đình, công việc ổn định, quan tâm đến các giai đoạn thay đổi lớn trong đời (đổi việc, tài chính, sức khỏe).
- **Nỗi đau:** Các dự báo tử vi/chiêm tinh đại trà trên mạng quá chung chung, không dựa trên lá số cá nhân thật sự.
- **Mong muốn:** Dự báo transit cá nhân hóa, cụ thể theo thời điểm.

### 2.2 Tổng hợp nỗi đau chính
1. **Rào cản ngôn ngữ & thuật ngữ:** Công cụ tốt thường bằng tiếng Anh.
2. **Thiếu chiều sâu bản địa hóa:** Bản dịch máy móc không truyền tải đúng sắc thái diễn giải chiêm tinh.
3. **Trải nghiệm phân mảnh:** Phải dùng nhiều công cụ khác nhau cho natal, synastry, transit.
4. **Thanh toán khó khăn:** Dịch vụ nước ngoài không hỗ trợ VNĐ/thanh toán nội địa.

---

## 3. Phạm vi sản phẩm (Scope)

Với nguồn lực 1 developer và deadline 3–4 tháng, việc giới hạn phạm vi (scope) là yếu tố **sống còn**. Nguyên tắc: build "hẹp mà sâu" — 1-2 tính năng lõi hoàn thiện tốt hơn 4 tính năng dang dở.

### 3.1 In-scope (Có trong MVP)

| Nhóm | Tính năng |
|---|---|
| **Lõi** | Lập & giải mã Lá số cá nhân (Natal Chart) — đầy đủ hành tinh, nhà, góc chiếu |
| **Lõi** | Tài khoản người dùng (đăng ký/đăng nhập, lưu lá số) |
| **Lõi** | Thư viện kiến thức chiêm tinh (dạng bài viết tĩnh/CMS đơn giản) |
| **Mở rộng có điều kiện** | Phân tích tương hợp (Synastry) — bản rút gọn |

### 3.2 Out-of-scope (Không làm ở giai đoạn này)

| Tính năng | Lý do loại trừ |
|---|---|
| Dự báo hạn vận (Transit Chart) | Phức tạp về tính toán và diễn giải theo thời gian; nên làm sau khi Natal Chart đã ổn định và có dữ liệu người dùng thật để ưu tiên đúng |
| Composite Chart (lá số tổng hợp nâng cao, khác Synastry) | Là tính năng chuyên sâu, thị trường ngách hẹp hơn Synastry cơ bản |
| Ứng dụng di động (native app) | Web responsive là đủ cho MVP; app native tốn nguồn lực gấp nhiều lần |
| Thanh toán / gói Premium | Cần kiểm chứng nhu cầu người dùng trước khi đầu tư hạ tầng thanh toán |
| Cộng đồng / bình luận / forum | Không phải giá trị lõi ban đầu; có thể dùng mạng xã hội có sẵn thay thế |
| Chatbot AI tư vấn chiêm tinh real-time | Rủi ro kỹ thuật cao, chi phí AI API lớn, chưa cần thiết cho MVP |
| Đa ngôn ngữ (tiếng Anh) | Sản phẩm định vị "cho người Việt" — không phải ưu tiên launch |

> ⚠️ **Khuyến nghị PM:** Nên cân nhắc đưa Synastry sang giai đoạn v1.1 (ngay sau MVP) thay vì launch cùng lúc, để đảm bảo Natal Chart — tính năng lõi quyết định uy tín sản phẩm — đạt chất lượng cao nhất trước khi mở rộng.

---

## 4. Luồng người dùng & Thiết kế (User Flow & Wireframe Logic)

### 4.1 Luồng chính: Lập lá số cá nhân

```
[Trang chủ] 
   → Người dùng bấm "Lập lá số của bạn"
   → [Form nhập thông tin]
       - Họ tên (không bắt buộc, dùng để cá nhân hóa)
       - Ngày / Tháng / Năm sinh
       - Giờ sinh (có toggle "Không rõ giờ sinh" → dùng lá số Solar/không có nhà)
       - Nơi sinh (autocomplete địa danh → lấy tọa độ + múi giờ tự động)
   → Bấm "Xem lá số"
   → [Màn hình xử lý] (loading — tính toán thiên văn)
   → [Trang kết quả lá số]
       - Bản đồ sao dạng vòng tròn (visual chart wheel)
       - Bảng tóm tắt: vị trí các hành tinh theo cung hoàng đạo & nhà
       - Bảng góc chiếu (aspects)
   → Người dùng bấm vào từng hành tinh/góc chiếu
   → [Panel giải mã chi tiết] mở ra (accordion hoặc modal), nội dung tiếng Việt
   → [CTA]: "Lưu lá số này vào tài khoản" (nếu chưa đăng nhập → mời đăng ký)
```

### 4.2 Luồng phụ: Tài khoản & lưu trữ
```
[Đăng ký/Đăng nhập] → email + mật khẩu, hoặc Google OAuth
[Trang cá nhân "Lá số của tôi"] → danh sách lá số đã lưu (bản thân, người khác)
→ Bấm vào 1 lá số → quay lại [Trang kết quả lá số]
```

### 4.3 Luồng phụ: Thư viện kiến thức
```
[Menu] → "Kiến thức chiêm tinh"
→ [Trang danh sách bài viết] (lọc theo chủ đề: Hành tinh / Cung hoàng đạo / Nhà / Góc chiếu / Cơ bản)
→ [Trang chi tiết bài viết]
```

### 4.4 Yêu cầu cơ bản về giao diện (UI Requirements)
- **Phong cách hình ảnh:** Huyền bí nhưng hiện đại, tránh sến/rẻ tiền kiểu "tử vi mạng"; tham khảo hướng thẩm mỹ tối giản của Co-Star hoặc The Pattern nhưng có bản sắc riêng (gợi ý: tông màu đêm — navy/tím than kết hợp vàng đồng ánh sao).
- **Chart Wheel** là thành phần trực quan quan trọng nhất — cần được đầu tư thiết kế kỹ, hiển thị tốt trên cả mobile (không bị vỡ layout khi thu nhỏ).
- **Responsive-first:** Ưu tiên trải nghiệm mobile vì phần lớn người dùng mục tiêu (Gen Z) truy cập từ điện thoại.
- **Ngôn ngữ diễn giải:** Giọng văn gần gũi, như đang trò chuyện với một người bạn am hiểu chiêm tinh, không hàn lâm, không phán xét/mê tín hóa.

---

## 5. Yêu cầu chức năng (Functional Requirements)

### 5.1 Module: Lập lá số cá nhân (Natal Chart)

| ID | Yêu cầu | Chi tiết |
|---|---|---|
| FR-01 | Nhập thông tin sinh | Form thu thập ngày/giờ/nơi sinh; validate dữ liệu đầu vào (ngày hợp lệ, giờ 00:00–23:59) |
| FR-02 | Xử lý "không rõ giờ sinh" | Nếu người dùng không có giờ sinh, hệ thống mặc định 12:00 trưa và **hiển thị cảnh báo rõ ràng** rằng vị trí Mặt Trăng, các Nhà (Houses) và Cung Mọc (Ascendant) có thể không chính xác |
| FR-03 | Tính toán thiên văn | Tính vị trí 10 thiên thể (Mặt Trời, Mặt Trăng, Thủy, Kim, Hỏa, Mộc, Thổ, Thiên Vương, Hải Vương, Diêm Vương) theo hệ tọa độ hoàng đạo (ecliptic), tại đúng thời điểm/địa điểm sinh |
| FR-04 | Tính hệ thống Nhà (Houses) | Áp dụng một hệ thống Nhà chuẩn (khuyến nghị: Placidus, phổ biến nhất) |
| FR-05 | Tính góc chiếu (Aspects) | Tính toán các góc chiếu chính: Conjunction, Opposition, Trine, Square, Sextile, kèm độ orb cho phép |
| FR-06 | Vẽ bản đồ sao (Chart Wheel) | Hiển thị trực quan dạng vòng tròn chuẩn chiêm tinh: 12 cung, 12 nhà, vị trí hành tinh, đường nối góc chiếu |
| FR-07 | Giải mã tự động bằng tiếng Việt | Với mỗi vị trí hành tinh/nhà/góc chiếu, hệ thống ghép nối với đoạn diễn giải tương ứng từ ngân hàng nội dung đã biên soạn sẵn |
| FR-08 | Tổng hợp báo cáo | Tổng hợp các đoạn giải mã riêng lẻ thành một bản báo cáo có cấu trúc dễ đọc (ví dụ nhóm theo: Tính cách cốt lõi, Cảm xúc, Tình yêu, Sự nghiệp) |

### 5.2 Module: Tài khoản người dùng

| ID | Yêu cầu | Chi tiết |
|---|---|---|
| FR-09 | Đăng ký/Đăng nhập | Qua email/mật khẩu và/hoặc Google OAuth |
| FR-10 | Lưu lá số | Người dùng lưu nhiều lá số vào tài khoản (bản thân, người thân, bạn bè...) để tra cứu lại |
| FR-11 | Quản lý lá số đã lưu | Xem danh sách, đổi tên, xóa lá số đã lưu |

### 5.3 Module: Thư viện kiến thức

| ID | Yêu cầu | Chi tiết |
|---|---|---|
| FR-12 | Danh sách bài viết | Hiển thị bài viết theo danh mục (Hành tinh, Cung, Nhà, Góc chiếu, Khái niệm cơ bản) |
| FR-13 | Trang chi tiết bài viết | Nội dung dạng rich-text, có thể kèm hình minh họa |
| FR-14 | Quản trị nội dung (Admin) | Cần một cách để tự thêm/sửa bài viết (có thể đơn giản là CMS headless hoặc file markdown — do chỉ có 1 dev, ưu tiên giải pháp ít tốn công sức xây dựng nhất) |

### 5.4 Module: Phân tích tương hợp (Synastry) — *nếu đủ thời gian*

| ID | Yêu cầu | Chi tiết |
|---|---|---|
| FR-15 | Nhập lá số thứ 2 | Chọn từ lá số đã lưu hoặc nhập mới |
| FR-16 | Tính góc chiếu liên lá số | So sánh vị trí hành tinh giữa 2 lá số để tìm các góc chiếu tương hợp |
| FR-17 | Báo cáo tương hợp | Diễn giải các điểm hòa hợp/thử thách theo từng khía cạnh (tình cảm, giao tiếp, giá trị sống) |

---

## 6. Yêu cầu phi chức năng (Non-Functional Requirements)

| Hạng mục | Yêu cầu |
|---|---|
| **Hiệu suất** | Thời gian tải trang chủ < 3 giây trên kết nối 4G trung bình; thời gian tính toán + hiển thị lá số < 5 giây sau khi submit form |
| **Độ chính xác thiên văn** | Sử dụng thư viện/thuật toán ephemeris đã được kiểm chứng (khuyến nghị: Swiss Ephemeris hoặc tương đương) thay vì tự viết công thức thiên văn từ đầu — rủi ro sai số rất cao nếu tự làm |
| **Bảo mật** | Mã hóa mật khẩu (hashing chuẩn, ví dụ bcrypt); thông tin ngày/giờ/nơi sinh của người dùng cần được xem là dữ liệu cá nhân nhạy cảm, không public mặc định |
| **Khả năng mở rộng (Scalability)** | Kiến trúc cần cho phép thêm tính năng Transit/Composite ở giai đoạn sau mà không phải viết lại engine tính toán lá số |
| **Tương thích thiết bị** | Responsive tốt trên các kích thước màn hình phổ biến: mobile (360–428px), tablet, desktop |
| **Độ tin cậy dữ liệu địa danh** | Cần cơ sở dữ liệu địa danh (kèm tọa độ, múi giờ lịch sử — quan trọng vì Việt Nam từng đổi múi giờ trong quá khứ) đủ chính xác để tránh sai lệch giờ sinh |
| **Khả năng bảo trì (Maintainability)** | Vì chỉ có 1 dev, code cần được tổ chức rõ ràng, tách biệt phần "engine tính toán" và phần "nội dung diễn giải" để dễ cập nhật nội dung mà không đụng vào logic tính toán |

---

## 7. Tiêu chí thành công (Success Metrics & KPIs)

### 7.1 Metrics giai đoạn ra mắt (3 tháng đầu sau launch)

| Chỉ số | Mục tiêu tham khảo | Ý nghĩa |
|---|---|---|
| **Số lá số được tạo** | Chỉ số Bắc Sao (North Star) chính | Đo lường mức độ người dùng thực sự dùng tính năng lõi |
| **Tỷ lệ hoàn tất form nhập liệu** | > 70% | Đánh giá UX của form nhập ngày/giờ/nơi sinh có đủ dễ dùng không |
| **Tỷ lệ chuyển đổi Guest → Đăng ký tài khoản** | Theo dõi & tối ưu dần | Đo giá trị cảm nhận đủ lớn để người dùng muốn lưu lại |
| **DAU/MAU** | Theo dõi xu hướng tăng trưởng | Đo mức độ giữ chân & tần suất quay lại |
| **Thời gian trung bình trên trang kết quả lá số** | Càng cao càng tốt (trong ngưỡng hợp lý) | Đo mức độ người dùng thực sự đọc nội dung giải mã, không chỉ xem lướt |
| **Tỷ lệ quay lại sau 7 ngày (D7 Retention)** | Theo dõi & tối ưu dần | Đo giá trị lâu dài, không chỉ tò mò một lần |

### 7.2 Lưu ý về đo lường
Vì đây là dự án cá nhân với 1 dev, không cần đầu tư hệ thống phân tích phức tạp ngay từ đầu — công cụ analytics cơ bản (ví dụ Google Analytics/Plausible) kết hợp theo dõi số liệu database (số lá số tạo mới, số tài khoản mới) là đủ cho giai đoạn MVP.

---

## 8. Ưu tiên & Lộ trình (Priorities & Roadmap)

### 8.1 Nguyên tắc ưu tiên
Với 1 developer, lộ trình được chia theo triết lý: **Engine trước, Nội dung song song, Giao diện sau cùng khi logic đã ổn định.**

### 8.2 Roadmap đề xuất (16 tuần / ~4 tháng)

| Giai đoạn | Thời gian | Nội dung chính |
|---|---|---|
| **Giai đoạn 1 — Nền tảng & Engine tính toán** | Tuần 1–5 | Setup dự án, chọn & tích hợp thư viện ephemeris, xây dựng engine tính vị trí hành tinh/nhà/góc chiếu, viết test đối chiếu kết quả với công cụ uy tín (Astro.com) để đảm bảo độ chính xác |
| **Giai đoạn 2 — Biên soạn nội dung diễn giải** | Tuần 3–8 *(chạy song song GĐ1)* | Biên soạn ngân hàng nội dung tiếng Việt: hành tinh × cung, hành tinh × nhà, các góc chiếu chính. Đây là phần tốn thời gian nhất nếu tự viết — cân nhắc AI hỗ trợ soạn thảo rồi biên tập lại |
| **Giai đoạn 3 — Giao diện lập & hiển thị lá số** | Tuần 6–10 | Form nhập liệu, autocomplete địa danh, vẽ Chart Wheel, trang kết quả, panel giải mã chi tiết |
| **Giai đoạn 4 — Tài khoản & lưu trữ** | Tuần 9–11 | Đăng ký/đăng nhập, lưu & quản lý lá số |
| **Giai đoạn 5 — Thư viện kiến thức** | Tuần 10–13 | Trang danh sách/chi tiết bài viết, viết nội dung ban đầu (10–15 bài cốt lõi) |
| **Giai đoạn 6 — QA, tối ưu & Beta kín** | Tuần 13–15 | Kiểm thử toàn diện, mời nhóm nhỏ người dùng thật test, sửa lỗi UX |
| **Giai đoạn 7 — Launch chính thức** | Tuần 16 | Ra mắt công khai |

> 📌 **Tính năng Synastry (nếu còn thời gian)** nên được xếp **sau** Giai đoạn 7, như một bản cập nhật v1.1, thay vì cố nhồi vào MVP và làm chậm toàn bộ tiến độ.

### 8.3 Phân loại MoSCoW cho MVP

| Mức ưu tiên | Tính năng |
|---|---|
| **Must-have** | Natal Chart engine + giải mã tự động + Chart Wheel |
| **Should-have** | Tài khoản người dùng, lưu lá số |
| **Could-have** | Thư viện kiến thức (có thể launch với số lượng bài viết tối thiểu, bổ sung dần) |
| **Won't-have (MVP này)** | Synastry, Transit, thanh toán, app di động |

---

## 9. Rủi ro & Phụ thuộc (Risks & Dependencies)

| Rủi ro / Phụ thuộc | Mức độ | Giải pháp giảm thiểu |
|---|---|---|
| **Sai số tính toán thiên văn** | Cao | Bắt buộc dùng thư viện ephemeris đã kiểm chứng thay vì tự viết công thức; đối chiếu kết quả với Astro.com trên nhiều trường hợp mẫu trước khi launch |
| **Rủi ro về nguồn lực đơn (bus factor = 1)** | Cao | Vì chỉ 1 dev, cần code sạch, có tài liệu nội bộ (comment/README) để nếu tạm dừng dự án vẫn có thể quay lại dễ dàng; cân nhắc backup định kỳ |
| **Khối lượng nội dung diễn giải lớn** | Trung bình–Cao | Đây là điểm nghẽn dễ trễ deadline nhất. Nên bắt đầu biên soạn nội dung từ rất sớm (song song Giai đoạn 1), có thể dùng AI hỗ trợ viết nháp rồi biên tập, thay vì viết tay 100% |
| **Dữ liệu địa danh & múi giờ lịch sử Việt Nam** | Trung bình | Việt Nam từng thay đổi múi giờ trong lịch sử — cần cơ sở dữ liệu timezone lịch sử (ví dụ IANA tz database) chứ không chỉ dùng UTC+7 cố định, để tránh sai lệch giờ sinh thực tế |
| **Định kiến "mê tín" ảnh hưởng đến hình ảnh sản phẩm** | Thấp–Trung bình | Xây dựng giọng văn nội dung theo hướng "công cụ tự khám phá bản thân" mang tính tham khảo, không khẳng định tuyệt đối, tránh ngôn ngữ phán xét/hù dọa |
| **Phụ thuộc thư viện/API bên thứ ba (ephemeris, geocoding)** | Trung bình | Ưu tiên chọn thư viện mã nguồn mở, chạy được offline/tự host (giảm phụ thuộc uptime của bên thứ ba và tránh phát sinh chi phí API không kiểm soát được) |
| **Quá tải phạm vi (Scope creep)** | Cao | Bám sát nguyên tắc Out-of-scope ở Mục 3.2; mọi đề xuất tính năng mới trong quá trình build cần được đánh giá lại so với deadline trước khi thêm vào |

---

## Tóm tắt cho Stakeholder (Executive Summary)

AstroViet giải quyết một khoảng trống rõ ràng trên thị trường: **chiêm tinh học phương Tây chất lượng, chính xác, bằng tiếng Việt**. Với nguồn lực 1 dev và deadline 4 tháng, chiến lược sản phẩm là tập trung tuyệt đối vào việc làm cho **Natal Chart** — tính năng lõi — thực sự xuất sắc về độ chính xác và chất lượng diễn giải, trước khi mở rộng sang Synastry hay Transit. Rủi ro lớn nhất không nằm ở công nghệ mà ở **khối lượng nội dung cần biên soạn** và **rủi ro nguồn lực đơn** — hai yếu tố cần được quản lý chủ động ngay từ tuần đầu tiên.
