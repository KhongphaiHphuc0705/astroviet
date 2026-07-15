# Database Design Specification
## AstroViet Platform — Tầng Lưu Trữ Dữ Liệu (PostgreSQL)

| | |
|---|---|
| **Loại tài liệu** | Database Design Specification |
| **Phiên bản** | 1.1 — đã cập nhật theo phản hồi Product Owner ngày 11/07/2026 (chốt 9 Open Questions, xem Mục 14) |
| **Ngày soạn** | 11/07/2026 (khởi tạo) — cập nhật 11/07/2026 |
| **Tác giả** | Senior Database Architect & Software Architect (PostgreSQL, DDD) |
| **Tài liệu nguồn (Single Source of Truth)** | 1. PRD v1.0 · 2. Astrology Domain Specification v1.0 · 3. Astrology Engine Specification v1.0 · 4. REST API Specification v1.1 |
| **Nguyên tắc kế thừa** | Không tự ý thay đổi Domain Model, REST API Contract, Business Rules, Engine Workflow. Mâu thuẫn/khoảng trống được ghi ở **Mục 14 — Open Questions & Inconsistencies**; toàn bộ mục trong lần cập nhật này đã được Product Owner chốt quyết định |

> **Phạm vi tài liệu:** Đây không chỉ là ERD — tài liệu đặc tả toàn bộ tầng lưu trữ: schema, bảng, cột, kiểu dữ liệu, index, JSONB, bảo mật, hiệu năng, migration, backup.

---

## Mục lục

1. [Overview](#1-overview)
2. [Database Technology](#2-database-technology)
3. [Database Architecture](#3-database-architecture)
4. [Entity Relationship Model](#4-entity-relationship-model)
5. [Table Specification](#5-table-specification)
6. [Relationships](#6-relationships)
7. [Index Strategy](#7-index-strategy)
8. [JSON Columns](#8-json-columns)
9. [Audit & History](#9-audit--history)
10. [Security](#10-security)
11. [Performance](#11-performance)
12. [Migration Strategy](#12-migration-strategy)
13. [Backup & Recovery](#13-backup--recovery)
14. [Open Questions & Inconsistencies](#14-open-questions--inconsistencies)
15. [Appendix](#15-appendix)

---

## 1. Overview

### 1.1 Purpose
Tài liệu này đặc tả tầng persistence của AstroViet — nơi hiện thực hóa các entity đã định nghĩa ở Domain Specification và các resource đã định nghĩa ở REST API Specification thành schema PostgreSQL cụ thể, có thể triển khai trực tiếp.

### 1.2 Scope
Bao gồm toàn bộ dữ liệu cần persist cho MVP: Identity (users, token), Astrology core (birth profiles, charts và toàn bộ thành phần con), Content (articles), Reference data (house systems, languages). **Không** bao gồm: cấu hình hạ tầng (Docker, CI/CD), hay chi tiết thuật toán tính toán (đã có ở Engine Spec).

### 1.3 Design Goals

| Mục tiêu | Diễn giải |
|---|---|
| **Trung thực với Domain Model** | Mỗi bảng ánh xạ rõ ràng về 1 entity ở Domain Spec — không tự sáng tạo field ngoài domain trừ khi có lý do kỹ thuật rõ ràng (ghi rõ trong Design Rationale) |
| **3NF làm mặc định, denormalize có chủ đích** | Dữ liệu giao dịch (users, birth_profiles) chuẩn hóa chặt; dữ liệu snapshot bất biến (Chart) được phép denormalize/JSONB vì lý do hiệu năng và tính bất biến — giải thích cụ thể ở từng bảng |
| **Migration-friendly** | Mọi thay đổi schema đi qua migration có version, không có thay đổi "ngầm" |
| **Audit-friendly** | Timestamp UTC nhất quán, soft delete ở nơi cần giữ lịch sử, `engineVersion` được lưu lại trên từng Chart |
| **Extensible** | Bảng reference (`house_systems`, `languages`) thay vì hard-code enum ở nơi Domain Spec đã nêu khả năng mở rộng (Engine Spec Mục 9) |
| **Bảo mật theo thiết kế** | PII (birth data) và credential được cô lập, không log, có kế hoạch mã hóa/RLS rõ ràng (Mục 10) |

---

## 2. Database Technology

### 2.1 Vì sao PostgreSQL
| Lý do | Chi tiết |
|---|---|
| Hỗ trợ JSONB mạnh | Cần thiết cho `warnings`, dữ liệu bán cấu trúc mở rộng (Mục 8) — tốt hơn RDBMS thuần hoặc phải dùng thêm NoSQL riêng |
| Ràng buộc dữ liệu chặt (CHECK, FK, ENUM-like) | Rất phù hợp để enforce trực tiếp trong DB các Validation Rule đã định nghĩa ở Domain Spec Mục 7 (ví dụ latitude range, house number 1–12) — giảm rủi ro dữ liệu sai ngay cả khi có bug ở tầng ứng dụng |
| Full Text Search built-in (`tsvector`) | Đủ dùng cho quy mô thư viện kiến thức MVP (hàng trăm–vài nghìn bài viết), không cần thêm Elasticsearch — quan trọng với ràng buộc 1 dev/hạ tầng tối giản |
| Mã nguồn mở, chi phí vận hành thấp | Phù hợp dự án cá nhân/MVP, dễ host trên hầu hết nền tảng (Supabase, RDS, Railway, self-host) |
| Hệ sinh thái ORM tốt (Prisma/TypeORM) | Khớp với yêu cầu "Backend Developer xây dựng ORM từ tài liệu này" |

### 2.2 Có cần Redis?
**Có — nhưng chỉ cho dữ liệu ephemeral, không phải nguồn sự thật (source of truth).**

| Use case | Lý do dùng Redis thay vì Postgres |
|---|---|
| Rate Limit counters (REST API Spec Mục 9 — Rate Limit Policy) | Cần đọc/ghi cực nhanh, dữ liệu có TTL tự nhiên (sliding window theo phút/ngày) — Postgres không tối ưu cho pattern increment-with-TTL tần suất cao |
| Cache kết quả `GET /locations/search` | Giảm số lần gọi Geocoding provider bên ngoài (tiết kiệm chi phí/rate limit của provider) — xem thêm Mục 14 về việc có cache bền (Postgres) hay cache tạm (Redis) |
| Cache `GET /articles` / `GET /house-systems` / `GET /languages` (reference data ít đổi) | Giảm tải Postgres cho endpoint đọc nhiều, ghi hiếm |

> **Nguyên tắc:** Redis không lưu trữ dữ liệu nghiệp vụ quan trọng (Chart, User, BirthProfile) — mất dữ liệu Redis không được gây mất dữ liệu người dùng, chỉ ảnh hưởng hiệu năng/rate limit tạm thời.

### 2.3 Có cần Object Storage?
**Không bắt buộc cho MVP**, nhưng nên dự trù:

| Use case tương lai | Ghi chú |
|---|---|
| Ảnh minh họa cho Article | PRD FR-13 chỉ nói "có thể kèm hình minh họa" — nếu ảnh do Admin upload trực tiếp (thay vì chèn URL ngoài), cần Object Storage (S3-compatible) để lưu file, DB chỉ lưu URL/path |
| Xuất Chart Wheel dạng ảnh/PDF | Không có trong PRD MVP scope, nhưng là hướng mở rộng hợp lý |

**MVP:** `articles.body` chỉ chấp nhận URL ảnh ngoài (nhúng trong markdown/rich-text), không cần Object Storage ngay.

### 2.4 Có cần Full Text Search chuyên dụng (Elasticsearch...)?
**Không cần cho MVP.** PostgreSQL native `tsvector`/`tsquery` đủ đáp ứng `GET /articles?search=` (REST API Spec Mục 4.5) ở quy mô dữ liệu dự kiến (Mục 11.1). Elasticsearch là over-engineering cho 1 dev/vài nghìn bài viết — cân nhắc lại nếu thư viện kiến thức mở rộng sang hàng chục nghìn bài hoặc cần tìm kiếm ngữ nghĩa (semantic search).

---

## 3. Database Architecture

### 3.1 Logical Database
Một (1) database logic duy nhất (`astroviet_db`), chia thành 3 **PostgreSQL schema** theo ranh giới domain — phản ánh đúng việc Identity, Astrology, và Content là 3 domain riêng biệt (đã xác nhận ở REST API Spec Mục 14.2/14.6):

```
astroviet_db
 ├── identity      (users, refresh_tokens, user_preferences)
 │                 [module độc lập — xem 3.3 và Mục 14.1]
 ├── astrology     (birth_profiles, charts, chart_*, house_systems, languages, interpretation_contents)
 └── content        (articles)
```

> **Quyết định 14.1:** `identity` được coi là **module độc lập ngay từ bây giờ**, không chỉ là "tạm thời cho đến khi có Identity Domain Spec". Điều này có nghĩa: schema `identity` phải luôn có thể tách thành 1 database/service riêng trong tương lai mà không đòi hỏi sửa lại schema `astrology`/`content` — 2 schema kia chỉ được phép tham chiếu tới `identity.users(id)` qua FK, không bao giờ phụ thuộc vào cấu trúc nội bộ của `identity` (ví dụ không JOIN trực tiếp vào `refresh_tokens` từ truy vấn nghiệp vụ chiêm tinh).

### 3.2 Physical Database
| Môi trường | Chiến lược |
|---|---|
| Production | 1 Postgres instance (managed service khuyến nghị: RDS/Supabase/Railway) — quy mô 1 dev không cần cluster phức tạp ở MVP |
| Staging | Instance riêng, schema giống hệt production, seed data giả lập |
| Local Dev | Docker Compose Postgres, cùng version với production |
| Replication | Chưa cần ở MVP; khi có Read Replica trong tương lai, tách read-heavy (Articles, reference data) sang replica trước tiên |

### 3.3 Module Dependency (ASCII)

```
┌─────────────────────────┐
│   schema: content         │
│   articles                │
│   (author_id → identity)  │
└─────────────┬─────────────┘
              │ FK (nullable)
              ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│   schema: identity        │◀────────│   schema: astrology       │
│   users                   │  FK     │   birth_profiles          │
│   refresh_tokens          │         │   charts                  │
│   user_preferences        │         │   chart_planets            │
│                              │         │   chart_houses             │
│   ── Mở rộng tương lai ──── │         │   chart_angles             │
│   (Quyết định 14.1, khi      │         │   chart_aspects            │
│    thêm Google OAuth):        │         │   chart_patterns           │
│   + oauth_accounts              │         │   chart_pattern_planets    │
│   + email_verification_tokens     │         │   interpretation_contents  │
│   + password_reset_tokens           │         │   house_systems             │
└─────────────────────────┘         │   languages                 │
                                     └─────────────────────────┘
```

**Nguyên tắc phụ thuộc:** `astrology` phụ thuộc `identity` (mọi BirthProfile/Chart thuộc về 1 User), `content` phụ thuộc `identity` (Article có `author_id`). **`identity` và `content` không phụ thuộc `astrology`** — đảm bảo domain chiêm tinh có thể được tách thành service riêng trong tương lai nếu cần (đúng tinh thần Engine Spec về tính độc lập).

**Kế hoạch mở rộng `identity` (Quyết định 14.1):** Khi triển khai Google OAuth và các luồng xác thực nâng cao (đã hoãn ở REST API Spec Mục 14.7), chỉ cần bổ sung 3 bảng mới **hoàn toàn nằm trong schema `identity`**:
- `oauth_accounts` (liên kết `user_id` ↔ provider OAuth như Google, lưu `provider`, `provider_account_id`, token nếu cần)
- `email_verification_tokens` (token xác thực email, liên kết `user_id`, `expires_at`)
- `password_reset_tokens` (token đặt lại mật khẩu, liên kết `user_id`, `expires_at`)

Cả 3 bảng này **không đòi hỏi bất kỳ thay đổi nào ở schema `astrology`** — đúng nguyên tắc tách biệt domain đã đặt ra, và là bằng chứng cụ thể cho việc `identity` đã được thiết kế đủ độc lập ngay từ vòng thiết kế đầu tiên này.

---

## 4. Entity Relationship Model

| Entity | Purpose | Aggregate Root? | Quan hệ chính | Lifecycle |
|---|---|---|---|---|
| **User** | Tài khoản định danh | ✔ (trong Identity domain) | 1–N BirthProfile, 1–N Chart, 1–1 UserPreferences, 1–N RefreshToken | Tạo khi đăng ký → soft-delete khi người dùng yêu cầu xóa tài khoản |
| **RefreshToken** | Phiên đăng nhập dài hạn | ✘ (child của User) | N–1 User | Tạo khi login → revoke khi logout/rotate → hết hạn tự nhiên (không cần xóa cứng, dọn định kỳ) |
| **UserPreferences** | Tùy chọn hiển thị cá nhân | ✘ (child của User, 1-1) | 1–1 User | Tạo cùng lúc với User (default), cập nhật qua `PUT /users/me/preferences` |
| **BirthProfile** | Hồ sơ sinh đã lưu | ✔ | N–1 User, 1–N Chart (tham chiếu lỏng) | Tạo qua `POST /birth-profiles` → soft-delete qua `DELETE` (Quyết định 14.8) |
| **Chart** | Kết quả tính toán lá số — **Aggregate Root trung tâm** | ✔ | N–1 User, N–0..1 BirthProfile (snapshot, không phụ thuộc runtime), 1–N Planet/House/Angle/Aspect/Pattern (con) | Tạo qua `POST /charts/natal` (immutable sau khi tạo — không có `PATCH`) → soft-delete qua `DELETE` |
| **Planet** (`chart_planets`) | Vị trí 1 thiên thể trong 1 Chart | ✘ (child của Chart) | N–1 Chart | Tạo cùng lúc với Chart, không sửa/xóa riêng lẻ |
| **House** (`chart_houses`) | 1 trong 12 Nhà của 1 Chart | ✘ (child của Chart) | N–1 Chart | Tạo cùng lúc với Chart (hoặc rỗng nếu `isHouseDataAvailable=false`) |
| **Angle** (`chart_angles`) | ASC/MC/DSC/IC của 1 Chart | ✘ (child của Chart) | N–1 Chart | Như House |
| **Aspect** (`chart_aspects`) | Góc chiếu giữa 2 hành tinh | ✘ (child của Chart) | N–1 Chart | Tạo cùng lúc với Chart |
| **Pattern** (`chart_patterns`) | Cấu hình đặc biệt (Grand Trine...) | ✘ (child của Chart) | N–1 Chart, N–M Planet (qua junction) | Tạo cùng lúc với Chart |
| **InterpretationContent** | Nội dung diễn giải tái sử dụng (content bank) | ✔ (độc lập, do Admin quản trị) | N–1 Language | Tạo/sửa qua `POST/PATCH /admin/articles`-tương-tự (CMS nội bộ, xem Mục 14.x) — **KHÔNG** thuộc về 1 Chart cụ thể nào (xem Design Rationale ở Mục 5.11) |
| **Article** | Bài viết thư viện kiến thức | ✔ | N–1 User (author, optional) | Tạo/sửa/xóa qua `/admin/articles` (soft-delete) |
| **HouseSystem** | Reference data hệ thống nhà | ✘ (lookup) | 1–N BirthProfile/Chart (referenced) | Seed data, hiếm khi thay đổi (thêm hệ thống mới = 1 migration) |
| **Language** | Reference data ngôn ngữ | ✘ (lookup) | 1–N InterpretationContent (referenced) | Seed data |

---

## 5. Table Specification

> Quy ước áp dụng cho **mọi bảng** trừ khi ghi chú khác: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, mọi timestamp là UTC (yêu cầu server Postgres set `timezone = 'UTC'`). Cần extension `pgcrypto` (cho `gen_random_uuid()`) — bật 1 lần: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`

### 5.1 `identity.users`

**Mục đích:** Tài khoản định danh — nền tảng cho auth và ownership của BirthProfile/Chart. *(Lưu ý: chi tiết đầy đủ của Identity domain sẽ do Identity/Account Domain Specification tương lai quy định — bảng này là phiên bản tối thiểu đủ dùng cho MVP, xem Mục 14.1)*

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| id | UUID | ✘ | `gen_random_uuid()` | PK | — |
| email | TEXT | ✘ | — | UNIQUE | Lowercase hóa ở tầng ứng dụng trước khi insert (tránh case-sensitivity gây trùng logic) |
| password_hash | TEXT | ✘ | — | — | bcrypt hash, không bao giờ lưu plaintext (Mục 10) |
| display_name | TEXT | ✔ | NULL | — | ≤100 ký tự (Business Constraint, enforce ở app + CHECK) |
| role | TEXT | ✘ | `'user'` | — | CHECK `role IN ('user','admin')` |
| email_verified_at | TIMESTAMPTZ | ✔ | NULL | — | Xác thực email (ngoài phạm vi PRD hiện tại, chuẩn bị sẵn cột) |
| created_at | TIMESTAMPTZ | ✘ | `now()` | — | — |
| updated_at | TIMESTAMPTZ | ✘ | `now()` | — | Cập nhật qua trigger (Mục 9) |
| deleted_at | TIMESTAMPTZ | ✔ | NULL | — | Soft delete — tài khoản bị vô hiệu hóa nhưng giữ lại (audit, tránh mất liên kết Chart lịch sử) |
| version | INTEGER | ✘ | `1` | — | Optimistic locking cho update đồng thời (ví dụ đổi `displayName` từ nhiều thiết bị) |

**Check Constraints:** `CHECK (length(display_name) <= 100)`, `CHECK (role IN ('user','admin'))`, `CHECK (position('@' in email) > 1)` (kiểm tra tối thiểu, validation đầy đủ ở tầng app theo RFC 5322).

**Business Constraint:** Email unique là ràng buộc **Website Business Rule** (Domain Spec Mục 4 phân loại) — không phải quy tắc chiêm tinh.

---

### 5.2 `identity.refresh_tokens`

**Mục đích:** Lưu vết refresh token đã cấp để hỗ trợ revoke và rotation (REST API Spec Mục 2.3).

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| id | UUID | ✘ | `gen_random_uuid()` | PK | — |
| user_id | UUID | ✘ | — | FK → `identity.users(id)` ON DELETE CASCADE | — |
| token_hash | TEXT | ✘ | — | UNIQUE | **Không lưu token thô** — chỉ lưu SHA-256 hash để so khớp (Mục 10) |
| issued_at | TIMESTAMPTZ | ✘ | `now()` | — | — |
| expires_at | TIMESTAMPTZ | ✘ | — | — | `issued_at + 30 ngày` (REST API Spec Mục 2.3) |
| revoked_at | TIMESTAMPTZ | ✔ | NULL | — | Set khi logout hoặc bị rotate |
| replaced_by_token_id | UUID | ✔ | NULL | FK → `identity.refresh_tokens(id)` ON DELETE SET NULL | Self-reference, dựng "chuỗi rotation" phục vụ audit/phát hiện replay attack |
| created_by_ip | TEXT | ✔ | NULL | — | Audit, hỗ trợ phát hiện bất thường |

**Business Constraint:** Một token đã `revoked_at IS NOT NULL` không bao giờ được chấp nhận lại (app-level check, không thể enforce thuần bằng CHECK vì phụ thuộc thời điểm truy vấn).

---

### 5.3 `identity.user_preferences`

**Mục đích:** Ánh xạ trực tiếp `UserPreferences` (Domain Spec 5.14).

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| user_id | UUID | ✘ | — | PK, FK → `identity.users(id)` ON DELETE CASCADE | Quan hệ 1-1 — dùng chính `user_id` làm PK thay vì `id` riêng |
| default_house_system | TEXT | ✘ | `'Placidus'` | FK → `astrology.house_systems(name)` | — |
| preferred_language | TEXT | ✘ | `'vi'` | FK → `astrology.languages(code)` | — |
| show_retrograde_warnings | BOOLEAN | ✘ | `true` | — | — |
| interpretation_tone | TEXT | ✔ | NULL | — | CHECK `interpretation_tone IN ('Neutral','Encouraging','Direct')` khi có giá trị |
| updated_at | TIMESTAMPTZ | ✘ | `now()` | — | — |

**Business Constraint (Domain Spec 5.14):** Bảng này **tuyệt đối không** được tham chiếu bởi bất kỳ quá trình tính toán Chart nào — chỉ dùng làm giá trị mặc định khi tạo request mới ở tầng ứng dụng.

---

### 5.4 `astrology.house_systems`

**Mục đích:** Reference data cho `HouseSystem` (Domain Spec 5.9) — bảng thay vì hard-code để hỗ trợ mở rộng (Engine Spec 6.4 Future Extension: Koch, Equal, Campanus...).

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| name | TEXT | ✘ | — | PK | `'Placidus'`, `'WholeSign'` (seed data, thêm hàng mới = migration) |
| requires_precise_birth_time | BOOLEAN | ✘ | — | — | — |
| supports_polar_latitudes | BOOLEAN | ✘ | — | — | — |
| is_active | BOOLEAN | ✘ | `true` | — | Cho phép "tắt" 1 hệ thống mà không xóa dữ liệu lịch sử tham chiếu đến nó |

---

### 5.5 `astrology.languages`

**Mục đích:** Reference data cho `Language` (Domain Spec 5.15).

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| code | TEXT | ✘ | — | PK | ISO 639-1, ví dụ `'vi'` |
| display_name | TEXT | ✘ | — | — | `'Tiếng Việt'` |
| is_default | BOOLEAN | ✘ | `false` | — | — |

**Check/Partial Unique Index:** Chỉ đúng 1 hàng có `is_default = true` — enforce bằng partial unique index (Mục 7): `CREATE UNIQUE INDEX ON astrology.languages (is_default) WHERE is_default = true;`

---

### 5.6 `astrology.birth_profiles`

**Mục đích:** Ánh xạ `BirthData` + `BirthLocation` đã lưu (Domain Spec 5.1, 5.2), tương ứng resource `BirthProfile` (REST API Spec Mục 4.3).

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| id | UUID | ✘ | `gen_random_uuid()` | PK | — |
| user_id | UUID | ✘ | — | FK → `identity.users(id)` ON DELETE CASCADE | — |
| label | TEXT | ✘ | — | — | 1–100 ký tự (CHECK) |
| full_name | TEXT | ✔ | NULL | — | — |
| birth_date | DATE | ✘ | — | — | — |
| birth_time | TIME | ✔ | NULL | — | — |
| is_birth_time_known | BOOLEAN | ✘ | `true` | — | — |
| place_name | TEXT | ✘ | — | — | — |
| latitude | NUMERIC(9,6) | ✘ | — | — | CHECK `-90 <= latitude <= 90` |
| longitude | NUMERIC(9,6) | ✘ | — | — | CHECK `-180 <= longitude <= 180` |
| historical_timezone_id | TEXT | ✘ | — | — | IANA timezone string, validate format ở app layer |
| created_at | TIMESTAMPTZ | ✘ | `now()` | — | — |
| updated_at | TIMESTAMPTZ | ✘ | `now()` | — | — |
| deleted_at | TIMESTAMPTZ | ✔ | NULL | — | Soft delete (Quyết định 14.8) |
| version | INTEGER | ✘ | `1` | — | Optimistic locking — tránh mất dữ liệu khi sửa từ 2 tab/thiết bị cùng lúc |

**Check Constraints:**
- `CHECK (is_birth_time_known = true OR birth_time IS NULL)` — ánh xạ trực tiếp Domain Spec 5.1 Validation Rule.
- `CHECK (length(label) BETWEEN 1 AND 100)`
- `CHECK (latitude BETWEEN -90 AND 90)`
- `CHECK (longitude BETWEEN -180 AND 180)`

---

### 5.7 `astrology.charts`

**Mục đích:** Ánh xạ `Chart` — **Aggregate Root trung tâm** (Domain Spec 5.3). Lưu ý quan trọng: bảng này chứa **snapshot** dữ liệu sinh tại thời điểm tính toán (không phải FK sống tới `birth_profiles`) — đúng Quyết định 14.8 (soft delete BirthProfile không ảnh hưởng Chart).

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| id | UUID | ✘ | `gen_random_uuid()` | PK | — |
| user_id | UUID | ✘ | — | FK → `identity.users(id)` ON DELETE CASCADE | Chart chỉ tồn tại trong DB nếu `save=true` → luôn có chủ sở hữu (Guest transient không bao giờ persist — REST API Spec Mục 4.4) |
| birth_profile_id | UUID | ✔ | NULL | FK → `astrology.birth_profiles(id)` ON DELETE SET NULL | NULL nếu Chart được tạo từ `birthData` inline (không qua BirthProfile đã lưu) — xem `CreateNatalChartRequest`, REST API Spec Mục 5.4. Đây chỉ là liên kết tham chiếu, **không phải nguồn dữ liệu** — dữ liệu thật nằm ở các cột `snapshot_*` bên dưới |
| chart_type | TEXT | ✘ | `'Natal'` | — | CHECK `chart_type IN ('Natal')` — mở rộng danh sách qua migration khi Transit/Synastry/Composite/Solar Return được triển khai (Engine Spec Mục 9) |
| house_system | TEXT | ✘ | — | FK → `astrology.house_systems(name)` | — |
| is_house_data_available | BOOLEAN | ✘ | — | — | — |
| engine_version | TEXT | ✘ | — | — | Semver string, ví dụ `'1.2.0'` — bắt buộc để biết Chart nào cần tính lại khi Engine sửa lỗi (Engine Spec Mục 7) |
| calculated_at | TIMESTAMPTZ | ✘ | `now()` | — | Thời điểm Engine tính toán — **khác** với `birth_date` (thời điểm sinh) |
| warnings | JSONB | ✘ | `'[]'::jsonb` | — | Mảng `Warning` object (REST API Spec Mục 5.8) — xem Mục 8 |
| snapshot_interpretation_version | TEXT | ✘ | — | FK → `astrology.interpretation_contents(version)` *(logic, không phải FK vật lý — xem ghi chú)* | **Quyết định 14.2:** Ghim Chart vào 1 phiên bản cụ thể của content bank tại thời điểm tính (ví dụ `'1.0'`). Khi build `ChartResponse`, JOIN `interpretation_contents` theo `(subject_type, subject_key, language, version = charts.snapshot_interpretation_version)` thay vì luôn lấy bản mới nhất |
| snapshot_full_name | TEXT | ✔ | NULL | — | Copy tại thời điểm tính, không đổi dù BirthProfile gốc đổi tên |
| snapshot_birth_date | DATE | ✘ | — | — | — |
| snapshot_birth_time | TIME | ✔ | NULL | — | — |
| snapshot_is_birth_time_known | BOOLEAN | ✘ | — | — | — |
| snapshot_place_name | TEXT | ✘ | — | — | — |
| snapshot_latitude | NUMERIC(9,6) | ✘ | — | — | — |
| snapshot_longitude | NUMERIC(9,6) | ✘ | — | — | — |
| snapshot_timezone_id | TEXT | ✘ | — | — | — |
| created_at | TIMESTAMPTZ | ✘ | `now()` | — | — |
| deleted_at | TIMESTAMPTZ | ✔ | NULL | — | Soft delete qua `DELETE /charts/{id}` |

**Design Rationale — vì sao snapshot thay vì chỉ giữ FK tới BirthProfile:** Nếu chỉ lưu `birth_profile_id` và đọc dữ liệu sinh qua JOIN runtime, việc sửa `BirthProfile` (ví dụ sửa giờ sinh do nhập nhầm) sẽ **âm thầm làm sai lệch** một Chart đã tính trước đó mà không ai biết — vi phạm tính chất Deterministic/Immutable của Chart (Engine Spec Mục 2). Snapshot đảm bảo 1 Chart đã tính luôn phản ánh đúng input đã dùng để tính ra nó, bất kể BirthProfile gốc sau này thay đổi hay bị xóa. **Cùng nguyên tắc này áp dụng cho `snapshot_interpretation_version` (Quyết định 14.2)** — xem Design Rationale đầy đủ ở Mục 5.13.

**Check Constraints:** `CHECK (chart_type IN ('Natal'))`, `CHECK (snapshot_is_birth_time_known = true OR snapshot_birth_time IS NULL)`.

**Ghi chú về FK của `snapshot_interpretation_version`:** Không khai báo `FOREIGN KEY` vật lý tới `interpretation_contents.version`, vì `version` trong bảng đó **không phải khóa duy nhất độc lập** (nhiều hàng khác `subject_key` có thể cùng `version`) — quan hệ này chỉ có ý nghĩa khi kết hợp với `subject_type`/`subject_key`/`language` tại thời điểm JOIN, không phải một quan hệ 1 cột → 1 cột đơn giản mà PostgreSQL FK hỗ trợ trực tiếp. Ràng buộc "version phải tồn tại ít nhất 1 bản ghi tương ứng trong content bank" được enforce ở tầng ứng dụng khi tạo Chart.

---

### 5.8 `astrology.chart_planets`

**Mục đích:** Ánh xạ `Planet` (Domain Spec 5.4), con của Chart.

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| id | UUID | ✘ | `gen_random_uuid()` | PK | — |
| chart_id | UUID | ✘ | — | FK → `astrology.charts(id)` ON DELETE CASCADE | Hard delete khi Chart bị hard-delete (hiếm — chỉ qua job dọn dữ liệu đã soft-delete lâu ngày, xem Mục 13) |
| name | TEXT | ✘ | — | — | CHECK trong danh sách 14 giá trị (Appendix 9.3 Domain Spec) |
| category | TEXT | ✘ | — | — | CHECK `category IN ('Personal','Social','Outer','Point')` |
| longitude | NUMERIC(6,3) | ✘ | — | — | CHECK `0 <= longitude < 360` |
| latitude | NUMERIC(6,3) | ✔ | NULL | — | — |
| speed | NUMERIC(9,5) | ✘ | — | — | — |
| is_retrograde | BOOLEAN | ✘ | — | — | CHECK: nếu `name IN ('Sun','Moon')` thì `is_retrograde = false` (Domain Spec 5.4 — ràng buộc thiên văn bất biến) |
| sign | TEXT | ✘ | — | — | CHECK trong 12 giá trị Sign |
| degree_in_sign | NUMERIC(5,2) | ✘ | — | — | CHECK `0 <= degree_in_sign < 30` |
| house_number | INTEGER | ✔ | NULL | Composite FK → `astrology.chart_houses(chart_id, number)` | NULL nếu `chart.is_house_data_available = false` |

**Unique Constraint:** `UNIQUE (chart_id, name)` — 1 hành tinh chỉ xuất hiện đúng 1 lần trong 1 Chart.

**Composite FK:** `FOREIGN KEY (chart_id, house_number) REFERENCES astrology.chart_houses(chart_id, number)` — đảm bảo `house_number` gán cho Planet luôn khớp với 1 House thật sự tồn tại **trong cùng Chart đó** (tránh trỏ nhầm sang House của Chart khác).

---

### 5.9 `astrology.chart_houses`

**Mục đích:** Ánh xạ `House` (Domain Spec 5.8).

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| id | UUID | ✘ | `gen_random_uuid()` | PK | — |
| chart_id | UUID | ✘ | — | FK → `astrology.charts(id)` ON DELETE CASCADE | — |
| number | INTEGER | ✘ | — | — | CHECK `number BETWEEN 1 AND 12` |
| cusp_degree | NUMERIC(6,3) | ✘ | — | — | CHECK `0 <= cusp_degree < 360` |
| sign_on_cusp | TEXT | ✘ | — | — | CHECK trong 12 giá trị Sign |

**Unique Constraint:** `UNIQUE (chart_id, number)` — **đồng thời là target của composite FK ở `chart_planets`**, nên cần thêm `UNIQUE (chart_id, number)` (không chỉ PK `id`) để composite FK hợp lệ về mặt PostgreSQL.

> **Ghi chú lifecycle:** Nếu `chart.is_house_data_available = false`, bảng này **không có hàng nào** cho `chart_id` đó — đúng theo Domain Spec 5.3 Validation Rule ("houses phải đúng 12 phần tử nếu có, hoặc rỗng nếu không").

---

### 5.10 `astrology.chart_angles`

**Mục đích:** Ánh xạ `Angle` (Domain Spec 5.10).

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| id | UUID | ✘ | `gen_random_uuid()` | PK | — |
| chart_id | UUID | ✘ | — | FK → `astrology.charts(id)` ON DELETE CASCADE | — |
| type | TEXT | ✘ | — | — | CHECK `type IN ('Ascendant','Midheaven','Descendant','ImumCoeli')` |
| longitude | NUMERIC(6,3) | ✘ | — | — | CHECK `0 <= longitude < 360` |
| sign | TEXT | ✘ | — | — | CHECK trong 12 giá trị Sign |
| degree_in_sign | NUMERIC(5,2) | ✘ | — | — | CHECK `0 <= degree_in_sign < 30` |

**Unique Constraint:** `UNIQUE (chart_id, type)`.

**Business Constraint (Domain Spec 5.10):** `DSC.longitude = (ASC.longitude + 180) mod 360`, `IC.longitude = (MC.longitude + 180) mod 360` — **không enforce bằng CHECK constraint đơn giản** (cần so sánh 2 hàng khác nhau) mà bằng: (a) test tự động phía Engine trước khi ghi, (b) tùy chọn `CONSTRAINT TRIGGER` nếu cần enforce cứng ở DB layer (xem Mục 14).

---

### 5.11 `astrology.chart_aspects`

**Mục đích:** Ánh xạ `Aspect` (Domain Spec 5.11).

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| id | UUID | ✘ | `gen_random_uuid()` | PK | — |
| chart_id | UUID | ✘ | — | FK → `astrology.charts(id)` ON DELETE CASCADE | — |
| planet_a | TEXT | ✘ | — | — | Tên hành tinh (không FK sang `chart_planets` vì cần composite key phức tạp không cần thiết — xem Design Rationale bên dưới) |
| planet_b | TEXT | ✘ | — | — | — |
| aspect_type | TEXT | ✘ | — | — | CHECK `aspect_type IN ('Conjunction','Sextile','Square','Trine','Opposition')` |
| exact_angle | NUMERIC(6,3) | ✘ | — | — | — |
| orb | NUMERIC(5,3) | ✘ | — | — | — |
| is_applying | BOOLEAN | ✘ | — | — | — |
| nature | TEXT | ✘ | — | — | CHECK `nature IN ('Harmonious','Challenging','Neutral')` |

**Check/Unique Constraints:**
- `CHECK (planet_a <> planet_b)` (Domain Spec 5.11).
- `CHECK (planet_a < planet_b)` — **Business Constraint bổ sung ở tầng DB** để đảm bảo thứ tự chính tắc (canonical ordering), tránh trường hợp `(Sun, Moon)` và `(Moon, Sun)` được coi là 2 hàng khác nhau dù cùng ý nghĩa. Tầng ứng dụng (Engine) phải sắp xếp `planet_a`/`planet_b` theo alphabet trước khi insert.
- `UNIQUE (chart_id, planet_a, planet_b)` — kết hợp với constraint trên đảm bảo không trùng lặp cặp aspect trong 1 Chart.

**Design Rationale — vì sao không FK `planet_a`/`planet_b` sang `chart_planets`:** Về mặt lý thuyết có thể FK `(chart_id, planet_a) → chart_planets(chart_id, name)`, nhưng vì `name` đã được validate chặt bằng CHECK constraint (chỉ 14 giá trị cố định) và luôn được ghi cùng lúc với `chart_planets` trong cùng 1 transaction khi Chart Builder ráp kết quả (Engine Spec Mục 6.10), rủi ro sai lệch gần như bằng 0 — thêm composite FK ở đây tăng độ phức tạp không tương xứng với lợi ích. Đây là một denormalization có chủ đích, chấp nhận được.

---

### 5.12 `astrology.chart_patterns` và `astrology.chart_pattern_planets`

**Mục đích:** Ánh xạ `Pattern` (Domain Spec 5.12), quan hệ N-M với Planet.

**`astrology.chart_patterns`**

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| id | UUID | ✘ | `gen_random_uuid()` | PK | — |
| chart_id | UUID | ✘ | — | FK → `astrology.charts(id)` ON DELETE CASCADE | — |
| pattern_type | TEXT | ✘ | — | — | **Không CHECK cứng danh sách đóng** — chỉ validate ở tầng ứng dụng (Engine). Lý do: Engine Spec 6.7 Future Extension cho phép thêm loại Pattern mới (Kite, Mystic Rectangle...) qua "detector" độc lập; hard-code CHECK ở DB sẽ đòi hỏi migration mỗi lần thêm loại Pattern — không phù hợp nguyên tắc Open/Closed |
| created_at | TIMESTAMPTZ | ✘ | `now()` | — | — |

**`astrology.chart_pattern_planets`** (junction table)

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| pattern_id | UUID | ✘ | — | PK (composite), FK → `astrology.chart_patterns(id)` ON DELETE CASCADE | — |
| planet_id | UUID | ✘ | — | PK (composite), FK → `astrology.chart_planets(id)` ON DELETE CASCADE | — |

**Business Constraint:** Mỗi Pattern phải có tối thiểu 3 `planet_id` liên kết (Domain Spec 5.12) — **không enforce được bằng CHECK constraint đơn giản** (cần đếm số hàng liên quan), enforce ở tầng ứng dụng khi insert trong 1 transaction; cân nhắc thêm `CONSTRAINT TRIGGER` nếu cần enforce cứng (xem Mục 14).

---

### 5.13 `astrology.interpretation_contents`

**Mục đích:** Ánh xạ `Interpretation` (Domain Spec 5.13) — nhưng đóng vai trò **content bank tái sử dụng, có version hóa**, không phải bản ghi gắn cứng với 1 Chart cụ thể.

> **Design Rationale (Quyết định 14.2 — kết hợp Content Bank + Version Pinning):** Domain Spec 5.13 nêu rõ `subjectKey` (ví dụ `"Venus_in_Leo"`) được thiết kế để **"tái sử dụng nội dung giữa hàng nghìn người dùng có cùng vị trí hành tinh — tránh sinh nội dung trùng lặp cho mỗi Chart"**. Vì vậy bảng này **không có `chart_id`** — nó là 1 "từ điển tra cứu" độc lập. Tuy nhiên, thay vì Chart luôn JOIN vào bản nội dung **mới nhất** (rủi ro: nội dung hiển thị cho 1 Chart cũ có thể đổi khác so với lúc người dùng xem lần đầu), mỗi Chart **ghim cứng** vào 1 `version` cụ thể của content bank qua cột `charts.snapshot_interpretation_version` (Mục 5.7):
> ```
> Chart.snapshot_interpretation_version = "1.0"
>              │
>              ▼  JOIN (subject_type, subject_key, language, version)
> interpretation_contents WHERE version = "1.0"
> ```
> Khi nội dung được cải tổ lớn (ví dụ viết lại toàn bộ văn phong), Admin **không sửa đè** các hàng `version = "1.0"` mà **thêm mới** các hàng `version = "2.0"`. Chart cũ (`snapshot_interpretation_version = "1.0"`) tiếp tục JOIN đúng nội dung cũ; Chart mới tạo sau thời điểm đó dùng `"2.0"` mặc định (giá trị `version` mới nhất có `status='Published'` tại thời điểm Chart được tính). Thiết kế này giữ được cả 2 lợi ích: **tái sử dụng nội dung giữa hàng nghìn user** (không nhân bản theo từng Chart) **và** **tính ổn định của Chart đã lưu theo thời gian** (không đổi nội dung sau lưng người dùng).

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| id | UUID | ✘ | `gen_random_uuid()` | PK | — |
| subject_type | TEXT | ✘ | — | — | CHECK `subject_type IN ('PlanetInSign','PlanetInHouse','Aspect','PatternType','SignSummary','HouseSummary')` |
| subject_key | TEXT | ✘ | — | — | Ví dụ `'Venus_in_Leo'`, `'Sun_Square_Moon'` |
| language | TEXT | ✘ | — | FK → `astrology.languages(code)` | — |
| content_source | TEXT | ✘ | `'HumanAuthored'` | — | CHECK `content_source IN ('HumanAuthored','AIGenerated','Hybrid')` — **lưu nội bộ** dù REST API v1 không expose field này ra response (Quyết định 14.1 của REST API Spec chỉ ẩn ở tầng API, không có nghĩa là xóa khỏi Domain Model) |
| tone | TEXT | ✔ | NULL | — | CHECK `tone IN ('Neutral','Encouraging','Direct')` khi có giá trị |
| body_text | TEXT | ✘ | — | — | — |
| status | TEXT | ✘ | `'Published'` | — | CHECK `status IN ('Draft','Published','Archived')` — chỉ nội dung `Published` được dùng khi build response |
| version | TEXT | ✘ | `'1.0'` | — | **Quyết định 14.2:** Không còn là "version tùy chọn cho A/B test" đơn thuần — đây là **cơ chế ghim phiên bản bắt buộc** giữa Chart và content bank. Mỗi lần cải tổ nội dung lớn, tạo 1 giá trị `version` mới (ví dụ `'2.0'`), không sửa đè hàng cũ |
| created_at | TIMESTAMPTZ | ✘ | `now()` | — | — |
| updated_at | TIMESTAMPTZ | ✘ | `now()` | — | — |

**Unique Constraint:** `UNIQUE (subject_type, subject_key, language, version, COALESCE(tone, ''))` — bổ sung `version` vào khóa duy nhất so với thiết kế ban đầu, vì giờ đây 1 tổ hợp `(subject_type, subject_key, language)` có thể tồn tại **nhiều hàng ở nhiều `version` khác nhau** cùng lúc (đây chính là điều làm cho version pinning hoạt động được).

**Business Constraint bổ sung (Quyết định 14.2):** Khi tạo 1 `version` content mới, **phải tồn tại bản ghi cho toàn bộ tổ hợp `subject_key` đang được dùng** (không được migrate nội dung nửa vời — nếu không, Chart mới sẽ JOIN ra thiếu Interpretation cho 1 số `subjectKey`). Ràng buộc này enforce ở tầng ứng dụng (CMS/Admin tool) khi publish 1 version mới, không khả thi để enforce bằng CHECK constraint đơn thuần ở DB.


---

### 5.14 `content.articles`

**Mục đích:** Ánh xạ `Article` (REST API Spec Mục 4.5/5.6) — resource ngoài Domain Spec cốt lõi (đã ghi nhận ở REST API Spec Mục 14.6).

| Cột | Kiểu dữ liệu | Nullable | Default | PK/Unique/FK | Ghi chú |
|---|---|---|---|---|---|
| id | UUID | ✘ | `gen_random_uuid()` | PK | — |
| slug | TEXT | ✘ | — | UNIQUE | SEO-friendly, ví dụ `'sao-kim-trong-cung-su-tu'` |
| title | TEXT | ✘ | — | — | 1–200 ký tự (CHECK) |
| category | TEXT | ✘ | — | — | CHECK `category IN ('Planet','Sign','House','Aspect','Basics')` |
| excerpt | TEXT | ✔ | NULL | — | — |
| body | TEXT | ✘ | — | — | Markdown/rich-text |
| search_vector | TSVECTOR | ✘ | *(generated column)* | — | `GENERATED ALWAYS AS (to_tsvector('simple', title \|\| ' ' \|\| coalesce(excerpt,'') \|\| ' ' \|\| body)) STORED` — dùng `'simple'` config cho **MVP** (Quyết định 14.4: không phải giải pháp dài hạn cho tiếng Việt, sẽ đánh giá lại khi thư viện kiến thức mở rộng — xem Mục 14.4) |
| author_id | UUID | ✔ | NULL | FK → `identity.users(id)` ON DELETE SET NULL | NULL nếu tác giả bị xóa tài khoản — không mất bài viết |
| published_at | TIMESTAMPTZ | ✔ | NULL | — | NULL = bản nháp, chưa public |
| created_at | TIMESTAMPTZ | ✘ | `now()` | — | — |
| updated_at | TIMESTAMPTZ | ✘ | `now()` | — | — |
| deleted_at | TIMESTAMPTZ | ✔ | NULL | — | Soft delete |
| version | INTEGER | ✘ | `1` | — | Optimistic locking — quan trọng vì nhiều Admin có thể sửa cùng 1 bài (dù MVP chỉ có 1 dev/admin, chuẩn bị sẵn cho tương lai) |

**Check Constraints:** `CHECK (length(title) BETWEEN 1 AND 200)`.

---

## 6. Relationships

| Quan hệ | Loại | Cascade Rule | Ghi chú |
|---|---|---|---|
| User → BirthProfile | 1–N | `ON DELETE CASCADE` | Xóa cứng User (hiếm, chỉ qua quy trình xóa tài khoản GDPR) kéo theo xóa cứng toàn bộ BirthProfile |
| User → Chart | 1–N | `ON DELETE CASCADE` | Tương tự |
| User → RefreshToken | 1–N | `ON DELETE CASCADE` | — |
| User → UserPreferences | 1–1 | `ON DELETE CASCADE` | — |
| User → Article (author) | 1–N | `ON DELETE SET NULL` | Xóa Admin không được xóa mất bài viết đã xuất bản |
| BirthProfile → Chart | 1–N (lỏng, qua snapshot) | `ON DELETE SET NULL` | Xóa cứng BirthProfile chỉ gỡ liên kết tham chiếu, **Chart giữ nguyên dữ liệu** nhờ cột `snapshot_*` (Quyết định 14.8) |
| Chart → Planet/House/Angle/Aspect/Pattern | 1–N | `ON DELETE CASCADE` | Các bảng con luôn "sống chết cùng" Chart cha — không có ý nghĩa tồn tại độc lập |
| Pattern ↔ Planet | N–M | `ON DELETE CASCADE` (cả 2 chiều qua junction) | Qua `chart_pattern_planets` |
| Chart → HouseSystem | N–1 | *(không cascade — reference data)* | Không cho phép xóa `house_systems` đang được Chart nào đó tham chiếu — dùng `ON DELETE RESTRICT` (mặc định) |
| UserPreferences → HouseSystem/Language | N–1 | `ON DELETE RESTRICT` | Tương tự |
| InterpretationContent → Language | N–1 | `ON DELETE RESTRICT` | — |

**Nguyên tắc chung về Cascade:** Chỉ dùng `ON DELETE CASCADE` cho quan hệ **compositional thật sự** (con không có ý nghĩa tồn tại độc lập với cha — ví dụ Planet không thể tồn tại ngoài 1 Chart). Với quan hệ **tham chiếu/snapshot** (Chart tham chiếu BirthProfile), dùng `ON DELETE SET NULL` để tránh mất dữ liệu ngoài ý muốn — nhất quán với Quyết định 14.8 ở REST API Spec.

---

## 7. Index Strategy

| Bảng | Index | Loại | Lý do |
|---|---|---|---|
| `users` | `PRIMARY KEY (id)` | B-tree (tự động) | — |
| `users` | `UNIQUE INDEX ON (email) WHERE deleted_at IS NULL` | Partial Unique | Cho phép email được tái sử dụng nếu tài khoản cũ đã soft-delete (tùy chính sách sản phẩm — xem Mục 14) |
| `refresh_tokens` | `INDEX ON (user_id)` | B-tree | Truy vấn "toàn bộ token của 1 user" khi logout-all-devices |
| `refresh_tokens` | `UNIQUE INDEX ON (token_hash)` | B-tree Unique | Tra cứu khi verify refresh — cần cực nhanh |
| `refresh_tokens` | `INDEX ON (expires_at) WHERE revoked_at IS NULL` | Partial | Hỗ trợ job dọn token hết hạn định kỳ (Mục 13) |
| `birth_profiles` | `INDEX ON (user_id) WHERE deleted_at IS NULL` | Partial | Query chính của `GET /birth-profiles` — loại bỏ dữ liệu đã soft-delete ngay ở index |
| `charts` | `INDEX ON (user_id, calculated_at DESC) WHERE deleted_at IS NULL` | Composite Partial | Query chính của `GET /charts` (list + sort theo `calculatedAt`, REST API Spec Mục 4.4) |
| `charts` | `INDEX ON (birth_profile_id) WHERE deleted_at IS NULL` | Partial | Hỗ trợ filter `?birthProfileId=` (REST API Spec Mục 4.4) |
| `chart_planets` | `INDEX ON (chart_id)` | B-tree | JOIN chính khi build `ChartResponse` |
| `chart_planets` | `UNIQUE INDEX ON (chart_id, name)` | Composite Unique | Ràng buộc nghiệp vụ + tăng tốc lookup theo tên hành tinh |
| `chart_houses` | `UNIQUE INDEX ON (chart_id, number)` | Composite Unique | Ràng buộc + là target của composite FK từ `chart_planets` |
| `chart_angles` | `UNIQUE INDEX ON (chart_id, type)` | Composite Unique | — |
| `chart_aspects` | `INDEX ON (chart_id)` | B-tree | — |
| `chart_patterns` | `INDEX ON (chart_id)` | B-tree | — |
| `chart_pattern_planets` | `INDEX ON (planet_id)` | B-tree | Hỗ trợ truy vấn ngược "hành tinh này thuộc pattern nào" |
| `interpretation_contents` | `UNIQUE INDEX ON (subject_type, subject_key, language, version, COALESCE(tone,''))` | Composite Expression Unique | Đảm bảo không trùng nội dung cho cùng 1 tổ hợp tra cứu **trong cùng 1 version** (Quyết định 14.2) |
| `interpretation_contents` | `INDEX ON (subject_type, subject_key, language, version) WHERE status = 'Published'` | Composite Partial | **Index quan trọng nhất của bảng này** — đây chính là truy vấn chạy nhiều lần nhất hệ thống (mỗi lần build `ChartResponse` phải JOIN theo key này, gồm cả `version = charts.snapshot_interpretation_version`, cho ~10+ hành tinh/nhà/góc/pattern mỗi Chart) |
| `articles` | `UNIQUE INDEX ON (slug) WHERE deleted_at IS NULL` | Partial Unique | — |
| `articles` | `INDEX ON (category, published_at DESC) WHERE deleted_at IS NULL AND published_at IS NOT NULL` | Composite Partial | Query chính của `GET /articles?category=` |
| `articles` | `GIN INDEX ON (search_vector)` | **GIN** | Bắt buộc cho Full Text Search hiệu quả (`GET /articles?search=`) — B-tree không phù hợp với `tsvector` |
| `languages` | `UNIQUE INDEX ON (is_default) WHERE is_default = true` | Partial Unique | Enforce "chỉ 1 ngôn ngữ mặc định" (Domain Spec 5.15 Validation Rule) |

**Nguyên tắc chung:**
- **Partial Index** được ưu tiên ở mọi bảng có soft-delete (`WHERE deleted_at IS NULL`) — vì hầu hết truy vấn thực tế chỉ quan tâm dữ liệu chưa xóa, partial index nhỏ hơn và nhanh hơn full index đáng kể.
- **GIN Index** chỉ dùng cho `tsvector` (Full Text Search) — không có JSONB nào trong hệ thống cần GIN ở MVP vì `warnings` (Mục 8) luôn được đọc nguyên khối theo `chart_id`, không cần query bên trong cấu trúc JSON.

---

## 8. JSON Columns

### 8.1 Tại sao dùng JSONB (và tại sao KHÔNG dùng ở phần lớn hệ thống)

**Nguyên tắc chủ đạo:** JSONB chỉ được dùng cho dữ liệu **thực sự bán cấu trúc, không cần query nội bộ, gắn 1-1 với 1 hàng cha, và ít khi thay đổi shape**. Toàn bộ dữ liệu tính toán chiêm tinh cốt lõi (Planet, House, Aspect, Pattern) được **chuẩn hóa thành bảng riêng** (Mục 5.8–5.12), **không** gộp thành 1 cột JSONB lớn trên `charts` — lý do:
1. Cho phép đánh index/CHECK constraint chặt (ví dụ `latitude BETWEEN -90 AND 90`) — JSONB không hỗ trợ CHECK constraint cho từng field bên trong.
2. Cho phép query phân tích trong tương lai (ví dụ "tìm tất cả Chart có Grand Trine" — Engine Spec Mục 9 gợi ý khả năng này) mà không cần parse JSON.
3. Nhất quán với nguyên tắc 3NF-làm-mặc-định đã đặt ra ở Mục 1.3.

**Trường hợp duy nhất dùng JSONB trong schema này: `charts.warnings`.**

### 8.2 Cấu trúc JSON — `charts.warnings`

Ánh xạ trực tiếp DTO `Warning` đã chốt ở REST API Spec Mục 5.8/14.12:

```json
[
  {
    "code": "HOUSE_SYSTEM_NOT_CONVERGING",
    "message": "Không thể tính Houses với hệ Placidus tại vĩ độ này.",
    "severity": "warning",
    "field": "houseSystem"
  },
  {
    "code": "HISTORICAL_DATE",
    "message": "Ngày sinh rất xa trong quá khứ...",
    "severity": "info",
    "field": "birthDate"
  }
]
```

### 8.3 Ưu điểm khi dùng JSONB cho `warnings`
- Số lượng cảnh báo trên 1 Chart rất nhỏ (0–3 phần tử thực tế), không đáng để tách bảng riêng (`chart_warnings`) — tránh 1 JOIN không cần thiết cho mọi lần đọc Chart.
- `warnings[].code` là tập giá trị **mở** theo thời gian (thêm loại cảnh báo mới không nên đòi hỏi migration schema) — JSONB linh hoạt hơn CHECK constraint cứng ở đây.
- Đọc nguyên khối cùng lúc với `charts` (không cần query riêng) — khớp đúng cách `ChartResponse` trả về (REST API Spec Mục 5.4: `warnings` là 1 field của Chart, không phải resource riêng).

### 8.4 Nhược điểm
- Không thể `WHERE warnings @> '[{"code": "..."}]'` hiệu quả nếu sau này cần thống kê "bao nhiêu % Chart bị cảnh báo House không hội tụ" ở quy mô lớn — nếu nhu cầu phân tích này phát sinh, cân nhắc tách `chart_warnings` thành bảng riêng (dễ migrate vì dữ liệu nhỏ).
- Không enforce được cấu trúc từng object bên trong ở tầng DB (ví dụ bắt buộc phải có `code`) — validation nằm hoàn toàn ở tầng ứng dụng (Engine/API), DB chỉ đảm bảo đây là JSON hợp lệ.

### 8.5 Khi nào NÊN query trực tiếp vào JSONB, khi nào KHÔNG
| Nên | Không nên |
|---|---|
| Đọc nguyên `warnings` để render cùng `ChartResponse` (không cần điều kiện lọc bên trong JSON) | Lọc/aggregate theo `warnings[].code` trên số lượng lớn Chart (nếu cần, tách bảng — xem 8.4) |
| Ghi `warnings` 1 lần khi Chart được tạo (immutable sau đó, giống toàn bộ Chart) | Update từng phần tử bên trong mảng JSONB (không có use case này — Chart bất biến sau khi tạo) |

---

## 9. Audit & History

| Cơ chế | Áp dụng cho bảng nào | Chi tiết |
|---|---|---|
| `created_at` | Mọi bảng | `TIMESTAMPTZ NOT NULL DEFAULT now()` — luôn UTC (yêu cầu Postgres server `timezone=UTC`, xem Mục 14) |
| `updated_at` | `users`, `birth_profiles`, `user_preferences`, `articles` (bảng có thể sửa) | Cập nhật tự động qua trigger PostgreSQL (`BEFORE UPDATE`), **không dựa vào ứng dụng tự set** để tránh sai sót |
| `deleted_at` | `users`, `birth_profiles`, `charts`, `articles` | Soft delete — riêng `chart_planets`/`chart_houses`/... (bảng con của Chart) **không cần cột riêng**, tính "đã xóa" được suy ra từ `charts.deleted_at` của cha (tránh trùng lặp trạng thái) |
| `version` (Optimistic Locking) | `users`, `birth_profiles`, `articles` | Tăng dần mỗi lần UPDATE (`version = version + 1` trong `UPDATE ... WHERE version = :expectedVersion`) — bảo vệ khỏi lost update khi 2 request sửa cùng lúc |
| `engine_version` | `charts` | Bắt buộc — cho phép xác định Chart nào cần tính lại khi Engine sửa lỗi/nâng cấp (Engine Spec Mục 7, Design Decision "Chart lưu engineVersion") |
| `calculated_at` | `charts` | Thời điểm tính toán (khác `snapshot_birth_date` — thời điểm *sinh*) |
| Trigger function chuẩn | — | ```sql\nCREATE OR REPLACE FUNCTION set_updated_at()\nRETURNS TRIGGER AS $$\nBEGIN\n  NEW.updated_at = now();\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;\n``` áp cho từng bảng qua `CREATE TRIGGER trg_<table>_updated_at BEFORE UPDATE ON <table> FOR EACH ROW EXECUTE FUNCTION set_updated_at();` |

**Nguyên tắc:** `Chart` và các bảng con của nó (Planet/House/Angle/Aspect/Pattern) **không có `updated_at`** — vì đây là dữ liệu **bất biến sau khi tạo** (Engine Spec: Deterministic, không có `PATCH /charts/{id}` trong REST API Spec). Có `updated_at` trên dữ liệu vốn không bao giờ update sẽ gây hiểu lầm.

---

## 10. Security

| Hạng mục | Biện pháp |
|---|---|
| **Password Hash** | bcrypt (cost factor ≥ 12), cột `password_hash TEXT`, **không bao giờ** lưu plaintext, không log giá trị này (kể cả ở mức DEBUG) |
| **Refresh Token** | Chỉ lưu `token_hash` (SHA-256 của token thô) — token thô chỉ tồn tại phía client (HttpOnly Cookie, theo Quyết định 14.4 REST API Spec) và trong bộ nhớ tạm phía server lúc xử lý request, không bao giờ persist |
| **PII (birth_date, birth_time, place_name, latitude, longitude)** | Xuất hiện ở `birth_profiles` và snapshot trong `charts` — Domain Spec Mục 6 NFR xác định đây là **dữ liệu cá nhân nhạy cảm**. Biện pháp: (1) không đưa các cột này vào access log/APM tracing, (2) cân nhắc mã hóa at-rest cấp cột (`pgcrypto` symmetric encryption) cho `birth_date`/`birth_time` nếu yêu cầu tuân thủ pháp lý tăng lên — xem Mục 14 |
| **Encryption in transit** | Bắt buộc kết nối DB qua TLS (`sslmode=require` trở lên) giữa Backend và Postgres |
| **Encryption at rest** | Khuyến nghị bật disk-level encryption của managed Postgres provider (RDS/Supabase đều hỗ trợ mặc định) — đủ cho MVP, không cần column-level encryption ngay (xem Mục 14 để cân nhắc thêm) |
| **Row Level Security (RLS)** | **Chưa bật ở MVP.** Lý do: Backend API là điểm truy cập DB duy nhất (không có client kết nối thẳng DB), authorization đã được enforce đầy đủ ở tầng ứng dụng (Permission Matrix, REST API Spec Mục 2.4). RLS đáng cân nhắc nếu trong tương lai có nhiều service/role kết nối trực tiếp DB (ví dụ Admin Dashboard riêng, BI tool) — xem Mục 14 |
| **SQL Injection** | Bắt buộc dùng parameterized query / ORM (Prisma, TypeORM) — không nối chuỗi SQL thủ công, đặc biệt với input tự do như `search`, `q` (location search) |
| **Least Privilege DB User** | Backend kết nối bằng 1 DB role riêng, **không phải** superuser/owner — chỉ có quyền `SELECT/INSERT/UPDATE/DELETE` trên 3 schema nghiệp vụ, không có quyền `DROP`/`ALTER` (việc đó dành cho migration tool chạy bằng role riêng khác, xem Mục 12) |

---

## 11. Performance

### 11.1 Expected Data Volume (ước tính năm đầu, dựa trên PRD 3-4 tháng MVP + tăng trưởng ban đầu)

| Bảng | Ước tính | Ghi chú |
|---|---|---|
| `users` | Hàng nghìn → hàng chục nghìn | Theo Success Metrics PRD Mục 7 |
| `birth_profiles` | ~1.5–3× số user (mỗi user lưu vài hồ sơ: bản thân, người thân) | — |
| `charts` | ~2–5× số `birth_profiles` (người dùng tính lại nhiều lần, thử nhiều House System) | **Bảng tăng trưởng nhanh nhất** |
| `chart_planets` | ~10–14× số `charts` (10 hành tinh chuẩn + optional points) | — |
| `chart_aspects` | ~10–20× số `charts` (trung bình mỗi Chart có nhiều cặp aspect) | — |
| `interpretation_contents` | Vài trăm → vài nghìn (content bank, **không tăng theo số user**) | Đây chính là lợi ích của thiết kế "content bank tái sử dụng" ở Mục 5.13 |
| `articles` | Hàng chục → vài trăm (PRD FR-12: "10-15 bài cốt lõi" ban đầu) | — |

### 11.2 Read/Write Pattern

| Bảng | Pattern | Hệ quả thiết kế |
|---|---|---|
| `charts` + bảng con | **Write-once, Read-many** | Không cần `updated_at` (Mục 9); index tối ưu cho `SELECT` (Mục 7), không cần lo tối ưu `UPDATE` |
| `interpretation_contents` | **Write-rare (Admin), Read-very-often** (JOIN mỗi lần build ChartResponse) | Ứng viên hàng đầu cho caching tầng ứng dụng (Redis) — nội dung ít đổi nhưng đọc liên tục |
| `birth_profiles` | Read-write cân bằng, tần suất thấp | — |
| `articles` | Write-rare, Read-often (đặc biệt bài phổ biến) | Cân nhắc cache CDN/Redis cho `GET /articles/{slug}` |
| `refresh_tokens` | Write-often (mỗi lần refresh tạo hàng mới), Read-often (mỗi request verify... **không**, verify chỉ đọc JWT, chỉ query DB lúc `/auth/refresh`) | Tần suất vừa phải — 1 lần/15 phút/user hoạt động |

### 11.3 Caching Strategy
| Dữ liệu | Nơi cache | TTL đề xuất |
|---|---|---|
| `interpretation_contents` (theo `subject_key`) | Redis (application-level cache) | Vài giờ – 1 ngày (invalidate khi Admin sửa nội dung) |
| `GET /house-systems`, `GET /languages` | Redis hoặc in-memory cache | Rất dài (vài ngày) — reference data gần như tĩnh |
| `GET /locations/search` results | Redis | Vài ngày (địa danh + timezone lịch sử hầu như không đổi) — xem Mục 14 về việc có cần cache bền (Postgres) thay vì chỉ Redis |
| Rate limit counters | Redis (bắt buộc, không phải "cache" mà là nguồn dữ liệu chính cho tính năng này) | Theo cửa sổ thời gian (1 phút/1 ngày) |

### 11.4 Connection Pool
- Khuyến nghị dùng **PgBouncer** (transaction pooling mode) giữa Backend và Postgres nếu deploy dạng serverless/nhiều instance ngắn hạn — tránh cạn kiệt connection limit của Postgres (thường 100 theo mặc định của nhiều managed provider).
- Với quy mô 1 dev/MVP chạy 1 backend instance dài hạn (không serverless), connection pool built-in của ORM (Prisma: mặc định 1 pool/instance) có thể đủ dùng ban đầu — PgBouncer là bước tối ưu khi scale.

### 11.5 Vacuum
- Bảng `refresh_tokens` có tỷ lệ INSERT/DELETE cao (rotation liên tục) → cân nhắc `autovacuum` tuning riêng (giảm `autovacuum_vacuum_scale_factor`) để tránh bloat.
- Bảng `charts` + con chủ yếu INSERT, ít UPDATE/DELETE → autovacuum mặc định đủ dùng.

### 11.6 Partitioning
**Chưa cần thiết ở MVP** (dữ liệu năm đầu ở quy mô hàng trăm nghìn hàng cho `charts`, chưa tới ngưỡng cần partition — thường >10-50 triệu hàng). Nếu tăng trưởng vượt kỳ vọng, ứng viên partition đầu tiên là `charts` (partition theo `calculated_at` range — theo tháng/quý), vì đây là bảng lớn nhất và truy vấn chủ yếu theo khoảng thời gian gần đây.

---

## 12. Migration Strategy

| Hạng mục | Quyết định/Khuyến nghị |
|---|---|
| **Công cụ đề xuất** | **Prisma Migrate** — vì REST API Spec đã định hướng Backend Developer "xây dựng ORM từ tài liệu" bằng Prisma/TypeORM (nêu ở phần đầu prompt gốc); Prisma Migrate tích hợp trực tiếp với Prisma Schema, giảm 1 tầng công cụ riêng biệt so với Flyway (vốn phù hợp hơn với stack Java) |
| **Versioning** | Mỗi migration là 1 file có timestamp prefix (chuẩn Prisma: `20260711_create_users_table/`) — không sửa migration đã chạy ở production, chỉ tạo migration mới để sửa lỗi (forward-only) |
| **Backward Compatibility** | Theo nguyên tắc "expand-contract": khi đổi kiểu dữ liệu/xóa cột, luôn qua 2 bước — (1) thêm cột mới + dual-write, (2) xóa cột cũ ở migration sau, cách nhau đủ thời gian để Backend đã deploy xong bản dùng cột mới |
| **Seed Data** | `house_systems`, `languages` cần seed script chạy sau migration đầu (2 hàng Placidus/WholeSign, `vi`/`en`) — tách biệt seed script khỏi schema migration |
| **Migration User** | Chạy bằng DB role riêng có quyền DDL (`CREATE`/`ALTER`/`DROP`), **khác** với role Backend dùng để query (chỉ DML) — đúng nguyên tắc Least Privilege (Mục 10) |
| **CI/CD Gate** | Migration chạy tự động trong pipeline deploy, **trước** khi deploy code Backend mới (đảm bảo schema sẵn sàng trước khi code kỳ vọng nó tồn tại) |

---

## 13. Backup & Recovery

| Hạng mục | Chính sách đề xuất |
|---|---|
| **Backup** | Automated daily full backup (hầu hết managed Postgres provider — RDS, Supabase — có sẵn tính năng này, chỉ cần bật) + **Point-in-Time Recovery (PITR)** qua WAL archiving nếu provider hỗ trợ (khuyến nghị bật ngay từ đầu, chi phí thấp so với rủi ro mất dữ liệu PII) |
| **Retention** | Tối thiểu 7 ngày daily backup, 30 ngày nếu chi phí cho phép — vì đây là dữ liệu cá nhân nhạy cảm (birth data), khả năng khôi phục là yêu cầu quan trọng hơn tốc độ với 1 dev/MVP không có đội ngũ SRE túc trực |
| **Restore Test** | Định kỳ (khuyến nghị hàng quý dù chỉ 1 dev) thử restore backup vào môi trường staging để xác nhận backup thực sự dùng được — backup chưa test = không đáng tin |
| **Xóa dữ liệu vĩnh viễn (Hard Delete/GDPR)** | Với soft-delete (`deleted_at`), cần 1 job định kỳ (ví dụ hàng ngày/hàng tuần) **hard-delete** các bản ghi đã soft-delete quá **Retention Period cấu hình được** (Quyết định 14.7): biến môi trường `DATA_RETENTION_DAYS`, **mặc định 30 ngày** — không hard-code 90 ngày như đề xuất ban đầu, cho phép Product Owner điều chỉnh mà không cần sửa code |
| **Dọn `refresh_tokens` hết hạn** | Job định kỳ (hàng ngày) **hard-delete** (không soft-delete — Quyết định 14.6) các hàng có `expires_at < now()` OR `revoked_at IS NOT NULL` quá lâu — bảng này không cần giữ lịch sử dài hạn như dữ liệu nghiệp vụ khác, hết hạn là xóa thẳng |

---

## 14. Open Questions & Inconsistencies

> **Cập nhật 11/07/2026:** Toàn bộ 9 mục dưới đây đã được Product Owner review và chốt quyết định. Tài liệu giữ lại "Vấn đề" và "Phương án đã cân nhắc" làm decision log tham chiếu, bổ sung **✅ Quyết định cuối cùng** cho mỗi mục. Các thay đổi tương ứng đã được áp dụng vào Mục 1–13 ở trên.

### 14.1 Identity Domain chưa tồn tại chính thức
**Vấn đề:** REST API Spec Mục 14.2 đã xác nhận sẽ có 1 Identity/Account Domain Specification riêng trong tương lai, nhưng tài liệu đó chưa tồn tại. Database Design Specification buộc phải tự định nghĩa `identity.users`/`refresh_tokens`/`user_preferences` ngay bây giờ.

**✅ Quyết định cuối cùng:** Ghi nhận đây là phiên bản MVP tạm thời **về nội dung**, nhưng **`identity` phải được coi là module độc lập về mặt kiến trúc ngay từ bây giờ** — không chỉ chờ tài liệu chính thức mới tách. Khi triển khai Google OAuth/xác thực nâng cao, chỉ cần bổ sung 3 bảng **hoàn toàn nằm trong schema `identity`**: `oauth_accounts`, `email_verification_tokens`, `password_reset_tokens` — **không cần thay đổi bất kỳ bảng nào thuộc `astrology`**. Đã áp dụng vào Mục 3.1/3.3 (sơ đồ module dependency cập nhật, liệt kê rõ 3 bảng mở rộng tương lai).

### 14.2 Content Bank vs. Snapshot cho Interpretation
**Vấn đề:** Cần chọn giữa JOIN động thuần túy (nội dung luôn là bản mới nhất) hay snapshot cứng (nội dung copy riêng cho từng Chart).

**Phương án đã cân nhắc:** (1) JOIN động theo `subjectKey`, luôn lấy bản mới nhất; (2) Snapshot toàn bộ `bodyText` vào bảng riêng cho từng Chart.

**✅ Quyết định cuối cùng:** **Phương án kết hợp (Version Pinning)** — không phải (1) thuần túy cũng không phải (2) thuần túy:
```
Chart.snapshot_interpretation_version = "1.0"
              │
              ▼  JOIN (subject_type, subject_key, language, version)
interpretation_contents WHERE version = "1.0"
```
Chart chỉ lưu 1 giá trị `snapshot_interpretation_version` (ví dụ `"1.0"`), không lưu toàn bộ `bodyText`. Khi content bank có cải tổ lớn, Admin publish `version = "2.0"` mới (không sửa đè `"1.0"`) — Chart cũ tiếp tục JOIN đúng `"1.0"`, Chart mới tạo sau đó dùng `"2.0"`. Kết hợp được cả lợi ích tái sử dụng nội dung (không nhân bản `bodyText` theo từng Chart) lẫn tính ổn định của Chart đã lưu theo thời gian. Đã áp dụng: thêm cột `charts.snapshot_interpretation_version` (Mục 5.7), cập nhật Unique Constraint và Design Rationale ở `interpretation_contents` (Mục 5.13) để bao gồm `version` trong khóa tra cứu.

### 14.3 Cache `GET /locations/search`
**✅ Quyết định cuối cùng:** Xác nhận — **chỉ cache bằng Redis (TTL)** cho MVP, **không** tạo bảng `location_cache` trong Postgres ở giai đoạn này. Bảng `astrology.location_cache` bền vững chỉ cân nhắc từ **v2 trở đi**, nếu chi phí/rate limit của Geocoding provider thực sự trở thành vấn đề. Không có thay đổi schema nào cần áp dụng ở Mục 5 (đúng như thiết kế ban đầu).

### 14.4 Full Text Search tiếng Việt
**✅ Quyết định cuối cùng:** Xác nhận dùng config `'simple'` cho MVP, nhưng **ghi nhận rõ đây không phải giải pháp dài hạn** cho tiếng Việt — sẽ đánh giá lại giải pháp tách từ tiếng Việt chuyên dụng (custom `tsvector` pipeline hoặc extension bên thứ ba) khi phạm vi thư viện kiến thức lớn hơn đáng kể so với MVP. Đã cập nhật ghi chú ở Mục 5.14 để phản ánh rõ tính chất "tạm thời cho MVP" thay vì ngụ ý đây là lựa chọn ổn định lâu dài.

### 14.5 Mã hóa cột PII
**✅ Quyết định cuối cùng:** Xác nhận — **chỉ disk-level encryption cho MVP**, không áp dụng column-level encryption ngay. Giữ nguyên như đề xuất ở Mục 10, không có thay đổi thêm.

### 14.6 Chính sách tái sử dụng email sau khi soft-delete
**✅ Quyết định cuối cùng:** Xác nhận dùng cơ chế `deleted_at` (partial unique index `WHERE deleted_at IS NULL`, cho phép tái sử dụng email sau khi tài khoản cũ bị soft-delete) như thiết kế ban đầu ở Mục 7 — **giữ nguyên, không thay đổi**. **Ngoại lệ rõ ràng cho `refresh_tokens`:** bảng này **không dùng soft-delete** (`deleted_at`) — token hết hạn hoặc bị revoke thì **hard-delete thẳng** qua job dọn định kỳ, vì không có giá trị audit/khôi phục nào cần giữ lại cho token đã chết. Đã cập nhật Mục 13 (Backup & Recovery) để nói rõ sự khác biệt này.

### 14.7 Số ngày giữ lại bản ghi soft-delete trước khi hard-delete
**Vấn đề:** Đề xuất ban đầu là con số cố định "90 ngày", chưa có cơ sở chính thức.

**✅ Quyết định cuối cùng:** **Không chấp nhận con số cố định 90 ngày.** Thay bằng khái niệm **Retention Period cấu hình được** qua biến môi trường: `DATA_RETENTION_DAYS`, **mặc định 30 ngày**. Đã áp dụng vào Mục 13 (Backup & Recovery) — nhất quán với cách tiếp cận "Policy cấu hình qua env var" đã dùng cho Rate Limiting ở REST API Spec (Quyết định 14.13 của tài liệu đó), giữ tinh thần thiết kế đồng bộ giữa 2 tài liệu.

### 14.8 Enforce cứng ràng buộc toán học bằng Trigger hay chỉ tầng ứng dụng?
**✅ Quyết định cuối cùng:** Xác nhận **Phương án 1 — chỉ enforce ở tầng ứng dụng (Engine), không dùng `CONSTRAINT TRIGGER`**. Lý do được Product Owner xác nhận rõ: đây là **business logic** (thuộc về cách Engine tính toán và ráp dữ liệu), **không phải persistence logic** (không phải quy tắc toàn vẹn dữ liệu thuần túy mà DB layer cần tự bảo vệ) — ranh giới trách nhiệm giữa Engine và Database Layer được giữ rõ ràng, đúng tinh thần "Separation of Concerns" đã đặt ra xuyên suốt cả 5 tài liệu. Không có thay đổi schema nào cần áp dụng.

### 14.9 Row Level Security (RLS)
**✅ Quyết định cuối cùng:** Xác nhận **chưa cần RLS cho MVP**, vì toàn bộ truy cập dữ liệu đều đi qua Backend API (không có client/service nào kết nối thẳng DB). Giữ nguyên như đề xuất ở Mục 10 — sẽ đánh giá lại nếu kiến trúc triển khai thực tế thay đổi (ví dụ có Admin Dashboard kết nối DB trực tiếp trong tương lai).

---

## 15. Appendix

### 15.1 ER Diagram (ASCII)

```
┌───────────────────┐        ┌──────────────────────┐
│  identity.users     │        │ identity.user_preferences│
│  id (PK)            │───1:1──│ user_id (PK, FK)         │
│  email               │        │ default_house_system     │
│  password_hash       │        │ preferred_language        │
│  role                 │        └──────────────────────┘
│  deleted_at            │
└──────────┬─────────┘
           │ 1:N
           ├──────────────────────────────────┐
           ▼                                    ▼
┌────────────────────────┐        ┌──────────────────────────┐
│ identity.refresh_tokens  │        │ astrology.birth_profiles    │
│ id (PK)                   │        │ id (PK)                      │
│ user_id (FK)               │        │ user_id (FK)                  │
│ token_hash                  │        │ birth_date / birth_time         │
│ expires_at, revoked_at        │        │ latitude / longitude              │
└────────────────────────┘        │ deleted_at (soft delete)            │
                                    └───────────┬──────────────────┘
                                                │ 1:N (loose ref, SET NULL)
                                                ▼
┌───────────────────┐   1:N    ┌──────────────────────────────────┐
│  identity.users     │─────────▶│  astrology.charts                    │
└───────────────────┘          │  id (PK)                              │
                                 │  user_id (FK)                          │
                                 │  birth_profile_id (FK, nullable)         │
                                 │  house_system (FK → house_systems)         │
                                 │  snapshot_* (birth data copy)                │
                                 │  warnings (JSONB)                              │
                                 │  engine_version, calculated_at                   │
                                 └───┬─────┬─────┬─────┬──────────────────────┘
                                     │1:N  │1:N  │1:N  │1:N
                        ┌────────────┘     │     │     └───────────────┐
                        ▼                  ▼     ▼                     ▼
        ┌──────────────────────┐ ┌────────────────┐ ┌────────────────────┐ ┌──────────────────┐
        │ astrology.chart_planets│ │astrology.chart_  │ │astrology.chart_     │ │astrology.chart_    │
        │ id (PK)                 │ │houses             │ │angles                │ │aspects               │
        │ chart_id (FK)             │ │id (PK)              │ │id (PK)                 │ │id (PK)                 │
        │ name, sign, house_number    │ │chart_id (FK)          │ │chart_id (FK)             │ │chart_id (FK)              │
        └──────────┬───────────┘ │number (1..12)        │ │type (ASC/MC/DSC/IC)       │ │planet_a, planet_b            │
                    │            └────────────────┘ └────────────────────┘ └──────────────────┘
                    │ N:M (qua junction)
                    ▼
        ┌──────────────────────────┐        ┌──────────────────────┐
        │ astrology.chart_pattern_planets│◀───────│ astrology.chart_patterns │
        │ pattern_id (FK), planet_id (FK) │        │ id (PK), chart_id (FK)     │
        └──────────────────────────┘        │ pattern_type                │
                                             └──────────────────────┘

┌──────────────────────────────┐        ┌──────────────────────┐        ┌────────────────────┐
│ astrology.interpretation_contents│───N:1──│ astrology.languages     │        │ astrology.house_systems│
│ id (PK)                            │        │ code (PK)                 │        │ name (PK)                │
│ subject_type, subject_key, language  │        │ is_default                  │        └────────────────────┘
│ version, body_text, content_source     │        └──────────────────────┘
│ (KHÔNG có chart_id — content bank        │
│  độc lập; charts.snapshot_interpretation_ │
│  version ghim JOIN theo version — 14.2)     │
└──────────────────────────────┘

┌───────────────────┐   N:1 (nullable) ┌──────────────────────┐
│  content.articles   │──────────────────▶│  identity.users (author) │
│  id (PK), slug        │                  └──────────────────────┘
│  search_vector (GIN)    │
│  deleted_at                │
└───────────────────┘
```

### 15.2 Relationship Matrix

| From ↓ / To → | users | birth_profiles | charts | chart_planets/houses/angles/aspects | chart_patterns | interpretation_contents | articles |
|---|---|---|---|---|---|---|---|
| **users** | — | 1:N | 1:N | — | — | — | 1:N (author, nullable) |
| **birth_profiles** | N:1 | — | 1:N (loose, SET NULL) | — | — | — | — |
| **charts** | N:1 | N:1 (nullable) | — | 1:N (CASCADE) | 1:N (CASCADE) | *(JOIN logic theo `snapshot_interpretation_version`, không FK vật lý)* | — |
| **chart_patterns** | — | — | N:1 | N:M (qua `chart_pattern_planets`) | — | — | — |
| **interpretation_contents** | — | — | *(JOIN theo version, không FK vật lý — Quyết định 14.2)* | — | — | — | — |
| **articles** | N:1 (author, nullable) | — | — | — | — | — | — |

### 15.3 Naming Convention

| Đối tượng | Quy tắc | Ví dụ |
|---|---|---|
| Schema | snake_case, số ít, theo tên domain | `identity`, `astrology`, `content` |
| Table | snake_case, số nhiều | `birth_profiles`, `chart_aspects` |
| Column | snake_case | `birth_date`, `is_retrograde` |
| Primary Key | luôn tên `id` (trừ bảng 1-1 dùng `user_id` làm PK, và junction table dùng composite PK) | `id UUID` |
| Foreign Key | `<referenced_table_singular>_id` | `user_id`, `chart_id`, `birth_profile_id` |
| Boolean column | tiền tố `is_`/`has_`/`show_` | `is_retrograde`, `is_house_data_available`, `show_retrograde_warnings` |
| Timestamp column | hậu tố `_at` | `created_at`, `calculated_at`, `deleted_at` |
| Junction table | `<table_a_singular>_<table_b_singular>` | `chart_pattern_planets` |
| Index | `idx_<table>_<column(s)>` | `idx_charts_user_id_calculated_at` |
| Unique constraint | `uq_<table>_<column(s)>` | `uq_chart_planets_chart_id_name` |
| Check constraint | `chk_<table>_<rule>` | `chk_birth_profiles_time_known` |
| Foreign key constraint | `fk_<table>_<referenced_table>` | `fk_charts_birth_profiles` |
| Trigger | `trg_<table>_<action>` | `trg_articles_updated_at` |

### 15.4 DDL Naming Rules — ví dụ áp dụng đầy đủ

```sql
CREATE TABLE astrology.birth_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    label TEXT NOT NULL,
    full_name TEXT,
    birth_date DATE NOT NULL,
    birth_time TIME,
    is_birth_time_known BOOLEAN NOT NULL DEFAULT true,
    place_name TEXT NOT NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    historical_timezone_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT fk_birth_profiles_users
        FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE CASCADE,
    CONSTRAINT chk_birth_profiles_time_known
        CHECK (is_birth_time_known = true OR birth_time IS NULL),
    CONSTRAINT chk_birth_profiles_label_length
        CHECK (length(label) BETWEEN 1 AND 100),
    CONSTRAINT chk_birth_profiles_latitude
        CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_birth_profiles_longitude
        CHECK (longitude BETWEEN -180 AND 180)
);

CREATE INDEX idx_birth_profiles_user_id
    ON astrology.birth_profiles (user_id)
    WHERE deleted_at IS NULL;

CREATE TRIGGER trg_birth_profiles_updated_at
    BEFORE UPDATE ON astrology.birth_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### 15.5 Glossary bổ sung (thuật ngữ riêng của tài liệu này)

| Thuật ngữ | Giải thích |
|---|---|
| **Content Bank** | Kho nội dung diễn giải tái sử dụng (`interpretation_contents`), tra cứu động theo `subjectKey`, không gắn cứng với 1 Chart cụ thể |
| **Snapshot** | Bản sao dữ liệu bất biến được lưu trực tiếp trên `charts` (tiền tố `snapshot_`) để đảm bảo Chart không bị ảnh hưởng khi BirthProfile gốc thay đổi/bị xóa |
| **Partial Index** | Index chỉ áp dụng cho tập con hàng thỏa điều kiện `WHERE` (ví dụ `WHERE deleted_at IS NULL`) — nhỏ hơn và nhanh hơn full index cho các truy vấn chỉ quan tâm dữ liệu "còn sống" |
| **Expand-Contract Migration** | Chiến lược migration an toàn: thêm cái mới trước (expand), xóa cái cũ sau (contract), tách rời theo thời gian để tránh downtime/breaking change |

---

**Ghi chú kết thúc tài liệu:** Database Design Specification này là tài liệu kỹ thuật cấp thấp nhất trong chuỗi Single Source of Truth (PRD → Domain Spec → Engine Spec → REST API Spec → Database Design). Mọi thay đổi ở 4 tài liệu trên trong tương lai cần được đối chiếu và cập nhật tương ứng vào tài liệu này, đặc biệt các Open Questions ở Mục 14 vốn phụ thuộc trực tiếp vào quyết định của Product Owner.

