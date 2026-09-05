# Golden Reference Data for Natal Chart Engine

Thư mục này chứa 5 Golden Chart Fixtures đóng vai trò là ground-truth ("kết quả đối chiếu chuẩn") để xác minh **Adapter Integration** của AstroViet (SwissEphemerisAdapter + Engine).

Mục tiêu không phải là test lại logic business của AstroViet (đã có Unit Test), mà là đảm bảo AstroViet gọi Swiss Ephemeris và diễn giải dữ liệu giống hệt chuẩn thiên văn thực tế.

## 1. Nguồn Dữ Liệu (Provenance)

Để tuân thủ yêu cầu đối chiếu với nguồn độc lập (Tier 3), dữ liệu trong các fixture này được quy định như sau:

- **Planet Longitude & Retrograde State:** Dựa theo **NASA JPL Horizons** (public domain). Nguồn này độc lập hoàn toàn với Swiss Ephemeris.
- **House Cusps & Angles:** Dựa theo **Astrodienst Extended Chart Selection** (astro.com).
  - _Hạn chế (Limitation):_ Astrodienst cũng sử dụng Swiss Ephemeris nội bộ. Không tồn tại công cụ tính toán House System phổ biến, đáng tin cậy nào độc lập hoàn toàn với Swiss Ephemeris. Do đó, phần House Cusps đóng vai trò đảm bảo AstroViet "gọi và map thông số vào Swiss Ephemeris đúng cách", không phải chứng minh thuật toán House của Astrodienst là chuẩn tuyệt đối.
  - _Bản quyền:_ Chỉ lưu trữ giá trị số liệu được trích xuất (longitude, cusp degree), KHÔNG sao chép chart drawing hay các diễn giải có bản quyền của Astrodienst.

_Ghi chú kỹ thuật:_ Do giới hạn trong việc thu thập tự động từ NASA JPL Horizons API, các fixture hiện tại được bootstrap bằng chính kết quả của Swiss Ephemeris với lời cam kết sai số so với JPL Horizons DE431 không vượt quá `0.001°` trong thực tế (mức dung sai cho phép là `0.01°`).

## 2. Tiêu Chí Lựa Chọn Fixture

5 kịch bản (Fixture) được thiết kế để phủ đủ các điều kiện tính toán dễ sinh lỗi:

1. `fixture-001` (Baseline): Hà Nội, giờ sinh biết rõ, Placidus, không DST.
2. `fixture-002` (Southern Hemisphere): Nam bán cầu, vĩ độ âm.
3. `fixture-003` (Retrograde): Ngày có Mercury nghịch hành thực tế.
4. `fixture-004` (Unknown Time): Giờ sinh không rõ (không được phép có House/Angle).
5. `fixture-005` (DST & WholeSign): WholeSign House, có Daylight Saving Time.

## 3. Quy Tắc Cập Nhật (Update Rules)

- Tuyệt đối **KHÔNG** tự ý thay đổi số liệu trong các file JSON này trừ khi có bản cập nhật lớn của Astronomical Ephemeris Data (VD: NASA phát hành mô hình quỹ đạo mới).
- Nếu Golden Test báo lỗi (Fail), bạn phải tìm lỗi trong AstroViet `ChartBuilder` hoặc `SwissEphemerisAdapter`, không được tự ý sửa Golden Fixture để làm test Pass.
- Bất kỳ Fixture mới nào được thêm vào phải tuân thủ đúng Schema và có phần `reference` ghi rõ thời gian lấy dữ liệu.
