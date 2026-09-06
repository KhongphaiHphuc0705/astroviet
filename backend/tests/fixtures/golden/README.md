# Golden Reference Data for Natal Chart Engine

Thư mục này chứa 5 Golden Chart Fixtures được sử dụng để xác minh **Adapter Integration** của AstroViet (SwissEphemerisAdapter + Astrology Engine) với nguồn thiên văn độc lập.

Mục tiêu: phát hiện lỗi tích hợp trong cách AstroViet gọi Swiss Ephemeris — không test lại business logic (đã có Unit Test riêng).

## 1. Nguồn Dữ Liệu (Provenance)

### Planet Longitude & Retrograde State

Nguồn: **NASA JPL Horizons DE441** (public domain — US government work)

- API endpoint: `https://ssd.jpl.nasa.gov/api/horizons.api`
- Parameters: `EPHEM_TYPE=OBSERVER`, `CENTER=500@399` (geocentric), `QUANTITIES=31` (apparent ecliptic longitude/latitude)
- Dữ liệu tra cứu ngày: **2026-09-05** (xem `planetSourceRetrievedAt` trong từng fixture)
- Dữ liệu thực tế (không bootstrap từ AstroViet output)

**Retrograde detection:** Tính từ dấu của $\Delta lon = lon(t+1min) - lon(t)$. Nếu âm → retrograde. Ghi rõ trong field `retrogradeNote` của từng planet.

**Bodies không có trong JPL Horizons (bị loại khỏi validation planet):**

- `NorthNode`, `SouthNode`: điểm quỹ đạo toán học, không phải thiên thể vật lý
- `Lilith (Mean Apogee)`: điểm toán học, JPL không có

### House Cusps & Angles

House cusps **không được validate** bởi nguồn độc lập vì không tồn tại calculator House System phổ biến nào hoàn toàn độc lập với Swiss Ephemeris. Trường `expectedHouses` và `expectedAngles` trong các fixture hiện tại là `null`.

Mục đích của field này trong tương lai (khi có nguồn độc lập):

- Verify AstroViet gọi Swiss Ephemeris với đúng house system code (`P` = Placidus, `W` = WholeSign)
- Verify lat/lon được truyền đúng (không bị flip cho Nam bán cầu)

## 2. Các Fixture và Mục Đích

| Fixture            | Mô Tả                          | UTC Query Time        | Coverage                   |
| ------------------ | ------------------------------ | --------------------- | -------------------------- |
| `fixture-001.json` | Hà Nội, giờ biết, Placidus     | 1990-Jun-15 05:00 UTC | Baseline                   |
| `fixture-002.json` | Sydney, Nam bán cầu, WholeSign | 2000-Jan-01 09:30 UTC | Negative latitude          |
| `fixture-003.json` | London UTC, Mercury retrograde | 2023-Dec-25 10:00 UTC | Real retrograde data       |
| `fixture-004.json` | New York, giờ không biết       | 1985-Nov-20 17:00 UTC | Unknown time (§9.3 anchor) |
| `fixture-005.json` | Paris DST, WholeSign           | 2022-Jul-15 13:00 UTC | DST handling               |

## 3. Quy Tắc Cập Nhật (Update Rules)

- **KHÔNG** tự ý sửa `longitude` hay `isRetrograde` trong fixture để làm test pass. Nếu test fail, phải tìm lỗi trong code AstroViet.
- Fixture mới phải được thu thập thật từ JPL Horizons API, **không bootstrap** từ AstroViet output.
- Mỗi fixture mới cần có: `planetSourceUrl` cụ thể (không phải homepage), `planetSourceRetrievedAt` thật, `utcQueryTime` rõ ràng.
- Khi thêm fixture, phải giải thích lý do tại sao fixture đó cover kịch bản mới (không trùng lặp).
