# Astrology Engine Specification
## AstroViet Platform — Technical Design of the Calculation Engine

| | |
|---|---|
| **Loại tài liệu** | Technical Engineering Specification |
| **Phiên bản** | 1.0 |
| **Ngày soạn** | 10/07/2026 |
| **Tác giả** | Senior Software Architect (DDD) & Western Astrologer |
| **Tài liệu nguồn (Single Source of Truth)** | 1. Product Requirements Document (PRD) v1.0 <br> 2. Astrology Domain Specification v1.0 |
| **Nguyên tắc kế thừa** | Mọi entity, thuộc tính, business rule trong tài liệu này **kế thừa nguyên trạng** từ Domain Specification. Tài liệu này chỉ mô tả *cách* các entity đó được **tính toán ra**, không định nghĩa lại *chúng là gì* |

> **Lưu ý phạm vi:** Theo PRD, MVP chỉ triển khai **Natal Chart**. Tuy nhiên, Astrology Engine được **kiến trúc mở rộng ngay từ đầu** để hỗ trợ Transit, Synastry, Composite, Solar Return trong tương lai mà không cần viết lại lõi tính toán — đây là yêu cầu kỹ thuật cốt lõi của tài liệu này (xem Mục 9 — Extension Points).

---

## Mục lục

1. [Purpose & Scope](#1-purpose--scope)
2. [Design Principles](#2-design-principles)
3. [Overall Architecture](#3-overall-architecture)
4. [Input & Output Specification](#4-input--output-specification)
5. [Core Processing Pipeline](#5-core-processing-pipeline)
6. [Module Specifications](#6-module-specifications)
7. [Design Decisions](#7-design-decisions)
8. [Assumptions & Constraints](#8-assumptions--constraints)
9. [Extension Points](#9-extension-points)
10. [Appendix](#10-appendix)

---

## 1. Purpose & Scope

### 1.1 Mục tiêu của Astrology Engine

Astrology Engine là **thành phần lõi tính toán thuần túy (pure calculation core)** của nền tảng AstroViet. Nhiệm vụ duy nhất của nó là: nhận vào dữ liệu sinh (`BirthData`), thực hiện các phép tính thiên văn/chiêm tinh theo đúng quy tắc đã định nghĩa trong Domain Specification, và trả về một `Chart` hoàn chỉnh, chính xác, có thể tái lập (reproducible).

Engine được thiết kế để trở thành **"nguồn sự thật thiên văn học"** duy nhất trong toàn hệ thống — mọi API, mọi UI, mọi tính năng AI Interpretation đều tiêu thụ dữ liệu *từ* Engine, không có thành phần nào khác trong hệ thống được phép tự tính toán vị trí hành tinh.

### 1.2 Phạm vi (Scope)

Tài liệu này đặc tả **kiến trúc nội bộ và hành vi kỹ thuật** của Engine, bao gồm:

- Cấu trúc module và trách nhiệm từng module.
- Luồng dữ liệu (data pipeline) từ input đến output.
- Input/Output model ở mức kỹ thuật (không phải REST payload).
- Business rules thiên văn học áp dụng trong quá trình tính toán.
- Các điểm mở rộng (extension points) cho tương lai.

### 1.3 Những gì Engine KHÔNG xử lý (Out of Scope)

| Không thuộc trách nhiệm Engine | Thuộc về thành phần nào |
|---|---|
| Giao diện người dùng (UI/UX, Chart Wheel rendering) | Frontend layer |
| REST API endpoint, request/response HTTP | Backend API layer |
| Lưu trữ dữ liệu, schema database | Persistence layer / Repository |
| Xác thực người dùng, phân quyền, guest vs. premium | Application/Business layer (theo đúng phân loại "Website Business Rule" ở Domain Spec Mục 4) |
| Geocoding (chuyển địa danh → tọa độ) | External Geolocation Service — Engine chỉ **nhận** tọa độ đã được resolve, không tự tra cứu địa danh |
| Sinh nội dung diễn giải bằng AI (LLM prompting, gọi API AI) | AI Interpretation Service — Engine chỉ cung cấp **dữ liệu đầu vào có cấu trúc** cho các hệ thống đó, không tự sinh văn bản tự do |
| Việc lưu cache, rate limiting, billing | Application layer |

> **Nguyên tắc ranh giới cốt lõi:** Engine là một **"cỗ máy tính toán không trạng thái" (stateless calculator)** — đưa vào cùng một input, luôn nhận về cùng một output, không quan tâm ai đang gọi nó hay gọi để làm gì.

---

## 2. Design Principles

| Nguyên tắc | Áp dụng trong Engine như thế nào |
|---|---|
| **Stateless** | Engine không lưu trạng thái giữa các lần gọi. Mỗi lời gọi `calculate(BirthData)` là độc lập hoàn toàn, không phụ thuộc lịch sử gọi trước đó. Điều này cho phép scale ngang (horizontal scaling) dễ dàng và không có side-effect ẩn |
| **Deterministic** | Với cùng một `BirthData` và cùng một `engineVersion`, Engine luôn trả về **chính xác cùng một `Chart`**, không có yếu tố ngẫu nhiên. Đây là điều kiện tiên quyết để đảm bảo tính đúng đắn thiên văn học và khả năng kiểm thử (testable) |
| **Single Responsibility** | Mỗi module chỉ làm đúng một việc (ví dụ: `AspectCalculator` chỉ tính góc chiếu, không biết gì về House hay Interpretation) — xem chi tiết Mục 6 |
| **Dependency Inversion** | Các module cấp cao (ví dụ `ChartBuilder`) phụ thuộc vào **abstraction** (interface) của các module cấp thấp (ví dụ `IEphemerisProvider`), không phụ thuộc trực tiếp vào implementation cụ thể (Swiss Ephemeris). Nhờ vậy có thể thay thế thư viện ephemeris trong tương lai mà không ảnh hưởng logic nghiệp vụ |
| **Open/Closed** | Engine mở để mở rộng (thêm loại Chart mới, thêm House System mới, thêm Pattern mới) nhưng đóng để sửa đổi — thêm tính năng không được đòi hỏi sửa lại các module đã hoạt động ổn định |
| **Extensibility** | Kiến trúc pipeline dạng module hóa cho phép chèn thêm bước xử lý mới (ví dụ Fixed Stars, Arabic Parts) mà không phá vỡ luồng hiện có — xem Mục 9 |
| **Separation of Calculation & Interpretation** | Tách bạch tuyệt đối giữa "tính con số" (Calculation — deterministic, khách quan) và "diễn giải thành văn bản" (Interpretation — có thể thay đổi theo ngôn ngữ/văn phong/AI) — đúng theo nguyên tắc đã đặt ra ở Domain Spec |

---

## 3. Overall Architecture

### 3.1 Kiến trúc tổng thể

Engine được tổ chức theo mô hình **Pipeline kết hợp Layered Architecture**: dữ liệu chảy tuần tự qua các module tính toán (pipeline), trong khi mỗi module lại tuân theo nguyên tắc phân lớp — lớp domain logic không phụ thuộc lớp hạ tầng (infrastructure).

```
┌─────────────────────────────────────────────────────────────────┐
│                        ASTROLOGY ENGINE                          │
│                                                                    │
│   ┌───────────────┐                                              │
│   │  Entry Point   │   calculate(BirthData, ChartOptions) → Chart │
│   │  (Chart        │                                              │
│   │   Builder)     │                                              │
│   └───────┬────────┘                                              │
│           │                                                       │
│           ▼                                                       │
│   ┌───────────────┐                                              │
│   │  Validation    │  ← Domain-level validation rules            │
│   │  Module        │                                              │
│   └───────┬────────┘                                              │
│           │                                                       │
│           ▼                                                       │
│   ┌───────────────┐     ┌─────────────────────┐                  │
│   │  Timezone      │────▶│  External: Timezone  │                 │
│   │  Resolver      │     │  Database (IANA tzdb)│                 │
│   └───────┬────────┘     └─────────────────────┘                  │
│           │                                                       │
│           ▼                                                       │
│   ┌───────────────┐     ┌─────────────────────┐                  │
│   │  Swiss Adapter │────▶│  External: Swiss      │                 │
│   │  (IEphemeris-  │     │  Ephemeris Library     │                 │
│   │   Provider)    │     └─────────────────────┘                  │
│   └───────┬────────┘                                              │
│           │                                                       │
│           ▼                                                       │
│   ┌───────────────┐                                              │
│   │  Planet        │                                              │
│   │  Calculator    │                                              │
│   └───────┬────────┘                                              │
│           │                                                       │
│           ├──────────────┐                                        │
│           ▼              ▼                                        │
│   ┌───────────────┐  ┌───────────────┐                            │
│   │  House         │  │  Angle         │                           │
│   │  Calculator    │  │  Calculator    │                           │
│   └───────┬────────┘  └───────┬────────┘                          │
│           │                   │                                   │
│           └─────────┬─────────┘                                   │
│                      ▼                                             │
│              ┌───────────────┐                                    │
│              │  Aspect        │                                   │
│              │  Calculator    │                                   │
│              └───────┬────────┘                                    │
│                      ▼                                             │
│              ┌───────────────┐                                    │
│              │  Pattern       │                                   │
│              │  Calculator    │                                   │
│              └───────┬────────┘                                    │
│                      ▼                                             │
│      ┌───────────────┴────────────────┐                           │
│      ▼                                 ▼                           │
│┌───────────────┐               ┌───────────────┐                  │
││ Element        │               │ Modality       │                 │
││ Calculator     │               │ Calculator     │                 │
│└───────┬────────┘               └───────┬────────┘                 │
│        └────────────────┬───────────────┘                          │
│                          ▼                                          │
│                  ┌───────────────┐                                 │
│                  │  Chart         │  ← Aggregate Root được ráp      │
│                  │  Builder       │     lại tại đây                 │
│                  └───────┬────────┘                                 │
└──────────────────────────┼──────────────────────────────────────────┘
                            ▼
                    ┌───────────────┐        ┌──────────────────────┐
                    │  Chart Object  │───────▶│  Interpretation Engine│
                    │  (Output)      │        │  (module riêng, xem   │
                    └───────────────┘        │  Mục 6.11)             │
                                              └──────────────────────┘
```

### 3.2 Các Dependency

| Dependency | Loại | Vai trò |
|---|---|---|
| **Ephemeris Library** (ví dụ Swiss Ephemeris) | External, bắt buộc | Nguồn dữ liệu thiên văn nền tảng — tính vị trí thiên thể tại một thời điểm UT cho trước |
| **IANA Timezone Database** | External, bắt buộc | Quy đổi giờ địa phương + địa điểm sinh sang UT một cách chính xác lịch sử |
| **Interpretation Content Store** | External, chỉ dùng bởi Interpretation Engine | Kho nội dung diễn giải (không phải dependency của phần Calculation) |

> Engine **không** phụ thuộc vào: Database của ứng dụng, HTTP framework, Authentication service, hay bất kỳ thành phần nào thuộc tầng ứng dụng. Đây là điều kiện bắt buộc để giữ Engine "framework-independent" đúng như Domain Spec yêu cầu.

### 3.3 Luồng xử lý dữ liệu (tổng quan)

```
BirthData ──▶ [Validation] ──▶ [Timezone Resolution] ──▶ [Swiss Adapter]
   ──▶ [Planet Calculator] ──▶ [House Calculator] + [Angle Calculator]
   ──▶ [Aspect Calculator] ──▶ [Pattern Calculator]
   ──▶ [Element Calculator] + [Modality Calculator]
   ──▶ [Chart Builder] ──▶ Chart (Output)
```

### 3.4 Sequence Diagram

```
Client (Application Layer)      ChartBuilder      Validation      TimezoneResolver     SwissAdapter      Planet/House/Angle/Aspect/Pattern     ElementModality
        │                             │                │                  │                   │                        │                             │
        │  calculate(BirthData, opts) │                │                  │                   │                        │                             │
        ├────────────────────────────▶│                │                  │                   │                        │                             │
        │                             │  validate()    │                  │                   │                        │                             │
        │                             ├───────────────▶│                  │                   │                        │                             │
        │                             │◀───────────────┤ ValidationResult │                   │                        │                             │
        │                             │  (nếu invalid → throw DomainValidationError, dừng pipeline)                     │                             │
        │                             │                │                  │                   │                        │                             │
        │                             │ resolve(location, date, time)     │                   │                        │                             │
        │                             ├───────────────────────────────────▶│                   │                        │                             │
        │                             │◀───────────────────────────────────┤ UTC DateTime      │                        │                             │
        │                             │                │                  │                   │                        │                             │
        │                             │ getPlanetPositions(UTC, coords)   │                   │                        │                             │
        │                             ├────────────────────────────────────────────────────────▶│                        │                             │
        │                             │◀────────────────────────────────────────────────────────┤ raw ephemeris data     │                             │
        │                             │                │                  │                   │                        │                             │
        │                             │ calculatePlanets() → calculateHouses() → calculateAngles()                      │                             │
        │                             ├──────────────────────────────────────────────────────────────────────────────▶│                             │
        │                             │◀──────────────────────────────────────────────────────────────────────────────┤ Planet[], House[], Angle[]  │
        │                             │                │                  │                   │                        │                             │
        │                             │ calculateAspects(planets)                                                       │                             │
        │                             ├──────────────────────────────────────────────────────────────────────────────▶│                             │
        │                             │◀──────────────────────────────────────────────────────────────────────────────┤ Aspect[]                    │
        │                             │                │                  │                   │                        │                             │
        │                             │ detectPatterns(planets, aspects)                                                │                             │
        │                             ├──────────────────────────────────────────────────────────────────────────────▶│                             │
        │                             │◀──────────────────────────────────────────────────────────────────────────────┤ Pattern[]                   │
        │                             │                │                  │                   │                        │                             │
        │                             │ analyzeElementsAndModalities(planets)                                          │                             │
        │                             ├─────────────────────────────────────────────────────────────────────────────────────────────────────────────▶│
        │                             │◀─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ Summary
        │                             │                │                  │                   │                        │                             │
        │                             │  build Chart object (aggregate all results)            │                        │                             │
        │◀────────────────────────────┤ Chart          │                  │                   │                        │                             │
```

### 3.5 Component Diagram (ASCII)

```
┌────────────────────────────────────────────────────────────────────┐
│                         AstrologyEngine.Core                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ Validation │  │  Timezone  │  │   Planet   │  │   House    │    │
│  │  Module    │  │  Resolver  │  │ Calculator │  │ Calculator │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │   Angle    │  │   Aspect   │  │  Pattern   │  │  Element / │    │
│  │ Calculator │  │ Calculator │  │ Calculator │  │  Modality  │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │                      Chart Builder                          │    │
│  └───────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬───────────────────────────────────┘
                                │ implements
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                    AstrologyEngine.Adapters                         │
│  ┌────────────────────────┐   ┌──────────────────────────────┐     │
│  │  SwissEphemerisAdapter  │   │  IanaTimezoneAdapter          │     │
│  │  (implements             │   │  (implements                  │     │
│  │   IEphemerisProvider)   │   │   ITimezoneProvider)           │     │
│  └────────────────────────┘   └──────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│              External Libraries (không thuộc Engine)                │
│         Swiss Ephemeris SDK        │        IANA tzdb                │
└────────────────────────────────────────────────────────────────────┘

           ┌──────────────────────────────────────────┐
           │      AstrologyEngine.Interpretation        │  ← module riêng biệt,
           │      (Interpretation Engine)               │    tiêu thụ Chart Object
           └──────────────────────────────────────────┘    làm input, KHÔNG nằm
                                                             trong Core pipeline
```

---

## 4. Input & Output Specification

### 4.1 Input Model

Engine nhận một object đầu vào duy nhất, gọi là `EngineInput`, gồm hai phần: dữ liệu sinh và tùy chọn tính toán.

| Field | Kiểu | Bắt buộc | Nguồn gốc | Ghi chú |
|---|---|---|---|---|
| birthData | BirthData | ✔ | Domain Spec 5.1 | Đã được normalize **trước khi** vào Engine (xem Mục 8 — Assumptions) |
| chartOptions.houseSystem | HouseSystem.name | ✔ | Domain Spec 5.9 | Placidus hoặc WholeSign |
| chartOptions.includeOptionalPoints | list\<enum\> | ✘ | — | Chiron, Lilith, NorthNode, SouthNode — mặc định rỗng nếu không chỉ định |
| chartOptions.chartType | enum: Natal, Transit, Synastry, Composite, SolarReturn | ✔ | — | MVP hiện tại chỉ chấp nhận `Natal`; các loại khác sẽ throw `UnsupportedChartTypeError` cho đến khi được triển khai (xem Mục 9) |

> **Lưu ý quan trọng:** Engine **không** nhận `placeName` dạng chuỗi tự do. `BirthLocation` đưa vào Engine **phải đã có** `latitude`, `longitude`, `historicalTimezoneId` — việc geocoding từ tên địa danh diễn ra ở tầng ứng dụng, **trước khi** gọi Engine (đúng ranh giới đã nêu ở Mục 1.3).

### 4.2 Output Model

Engine trả về một object `Chart` đúng theo định nghĩa ở Domain Specification Mục 5.3, **không thêm, không bớt trường nào** ngoài những gì đã định nghĩa ở đó. Đây là nguyên tắc "Engine không được tự sáng tạo dữ liệu ngoài Domain Model".

```
EngineOutput = Chart {
  id, birthData, chartType, houseSystem,
  planets[], houses[], angles[], aspects[], patterns[],
  isHouseDataAvailable, calculatedAt, engineVersion
}
```

### 4.3 Validation Rules (áp dụng trước khi tính toán)

Engine tái sử dụng nguyên vẹn các Validation Rules đã định nghĩa trong Domain Specification Mục 7, cụ thể áp dụng ở bước đầu pipeline:

| Rule | Nguồn |
|---|---|
| Ngày sinh hợp lệ, không ở tương lai | Domain Spec 5.1 |
| Giờ sinh (nếu có) trong khoảng hợp lệ | Domain Spec 5.1 |
| Timezone là giá trị IANA hợp lệ | Domain Spec 5.1 |
| Latitude ∈ [-90,90], Longitude ∈ [-180,180] | Domain Spec 5.2 |
| houseSystem nằm trong danh sách hỗ trợ | Domain Spec 5.9 |

### 4.4 Error Cases

| Trường hợp lỗi | Loại lỗi | Hành vi Engine |
|---|---|---|
| BirthData thiếu trường bắt buộc | `MissingRequiredFieldError` | Dừng pipeline ngay ở bước Validation, không gọi Ephemeris |
| Ngày/giờ sinh không hợp lệ | `InvalidDateTimeError` | Dừng pipeline ở Validation |
| Tọa độ ngoài phạm vi hợp lệ | `InvalidCoordinateError` | Dừng pipeline ở Validation |
| Timezone không tồn tại trong IANA database | `UnresolvableTimezoneError` | Dừng pipeline ở Timezone Resolution |
| Placidus không hội tụ tại vĩ độ cực | `HouseSystemNotConvergingError` | **Không phải lỗi dừng toàn bộ** — Engine trả `houses = []`, `isHouseDataAvailable = false`, kèm `warning` trong metadata; quyết định fallback sang Whole Sign là **business rule của tầng ứng dụng**, không phải của Engine (Engine chỉ báo cáo trung thực, không tự ý quyết định thay) |
| Ephemeris Library trả lỗi/timeout | `EphemerisProviderError` | Dừng pipeline, propagate lỗi lên tầng gọi — Engine không tự phỏng đoán dữ liệu thiên văn |
| chartType chưa được hỗ trợ | `UnsupportedChartTypeError` | Dừng pipeline ngay từ đầu, không thực hiện bất kỳ tính toán nào |
| isBirthTimeKnown = false | *(Không phải lỗi)* | Engine tiếp tục pipeline bình thường nhưng **bỏ qua** House Calculator và Angle Calculator — xem Mục 5, bước 6–7 |

---

## 5. Core Processing Pipeline

Pipeline gồm 10 bước tuần tự, mỗi bước tương ứng với một module ở Mục 6:

```
 [1] BirthData
       │
       ▼
 [2] Validation ──────────────▶ (invalid → throw, dừng pipeline)
       │ valid
       ▼
 [3] Timezone Resolution ─────▶ quy đổi birthDate + birthTime + historicalTimezoneId → Universal Time (UT)
       │
       ▼
 [4] Swiss Ephemeris (Adapter) ▶ truy vấn vị trí thô (raw longitude/latitude/speed) của mọi thiên thể tại UT + tọa độ
       │
       ▼
 [5] Planet Calculation ──────▶ chuyển raw data → Planet objects (gán Sign, degreeInSign, isRetrograde)
       │
       ├──── isBirthTimeKnown? ────┐
       │           │ false          │ true
       │           ▼                ▼
       │     (bỏ qua bước 6–7,  [6] House Calculation ──▶ 12 House objects theo houseSystem đã chọn
       │      houses=[],            │
       │      angles=[])       [7] Angle Calculation ──▶ ASC, MC, DSC, IC
       │           │                │
       │           └───────┬────────┘
       ▼                   ▼
 [8] Aspect Calculation ───────────▶ so sánh mọi cặp Planet, tính exactAngle, orb, aspectType, nature
       │
       ▼
 [9] Pattern Detection ────────────▶ phân tích tập hợp Aspect để phát hiện Grand Trine, T-Square, Grand Cross, Yod...
       │
       ▼
[10] Element & Modality Analysis ─▶ tổng hợp phân bố Element/Modality dựa trên Sign của các Planet
       │
       ▼
[11] Chart Builder ────────────────▶ ráp toàn bộ kết quả thành 1 Chart object hoàn chỉnh (Aggregate Root)
       │
       ▼
    Chart (Output)
       │
       ▼ (optional, ngoài Core Pipeline)
[12] Interpretation Engine ───────▶ với Chart làm input, sinh ra Interpretation objects tương ứng
```

**Bảng tóm tắt input/output từng bước:**

| Bước | Module | Input | Output |
|---|---|---|---|
| 2 | Validation | BirthData thô | BirthData đã xác nhận hợp lệ (hoặc exception) |
| 3 | Timezone Resolver | birthDate, birthTime, historicalTimezoneId | UTC DateTime |
| 4 | Swiss Adapter | UTC DateTime, coordinates | Raw ephemeris data (longitude, latitude, speed thô cho từng thiên thể) |
| 5 | Planet Calculator | Raw ephemeris data | list\<Planet\> |
| 6 | House Calculator | UTC DateTime, coordinates, houseSystem | list\<House\> (hoặc rỗng) |
| 7 | Angle Calculator | UTC DateTime, coordinates | list\<Angle\> (hoặc rỗng) |
| 8 | Aspect Calculator | list\<Planet\> | list\<Aspect\> |
| 9 | Pattern Calculator | list\<Planet\>, list\<Aspect\> | list\<Pattern\> |
| 10 | Element/Modality Calculator | list\<Planet\> | ElementDistribution, ModalityDistribution |
| 11 | Chart Builder | Tất cả kết quả trên | Chart |
| 12 | Interpretation Engine | Chart | list\<Interpretation\> |

---

## 6. Module Specifications

### 6.1 Validation Module

| | |
|---|---|
| **Responsibility** | Đảm bảo `BirthData` đầu vào thỏa mãn toàn bộ Validation Rules ở Domain Spec Mục 7 trước khi bất kỳ tính toán nào diễn ra |
| **Public Interface** | `validate(birthData: BirthData): ValidationResult` |
| **Input** | BirthData thô |
| **Output** | `ValidationResult { isValid: boolean, errors: list<ValidationError> }` |
| **Dependency** | Không phụ thuộc thành phần bên ngoài — pure logic |
| **Business Rules** | Toàn bộ là Astrological/Domain rule kế thừa từ Domain Spec (ví dụ: latitude/longitude range, timezone hợp lệ) — **không chứa business rule sản phẩm** (ví dụ không kiểm tra quyền user ở đây) |
| **Error Handling** | Trả về danh sách lỗi đầy đủ (không dừng ở lỗi đầu tiên) để tầng gọi có thể hiển thị toàn bộ vấn đề cùng lúc cho người dùng |
| **Future Extension** | Có thể thêm rule validation riêng cho từng `chartType` mới (ví dụ Synastry cần validate 2 BirthData cùng lúc) mà không ảnh hưởng rule hiện tại |

### 6.2 Swiss Adapter (Ephemeris Adapter)

| | |
|---|---|
| **Responsibility** | Là lớp trung gian **duy nhất** giao tiếp với thư viện Ephemeris bên ngoài (Swiss Ephemeris), che giấu toàn bộ chi tiết kỹ thuật của thư viện đó khỏi phần còn lại của Engine |
| **Public Interface** | `getPlanetaryPositions(utcDateTime, coordinates): RawEphemerisData` |
| **Input** | UTC DateTime, tọa độ (latitude, longitude) |
| **Output** | `RawEphemerisData` — dữ liệu thô: longitude, latitude, speed cho từng thiên thể, chưa gán Sign/House |
| **Dependency** | Swiss Ephemeris SDK (external, bắt buộc) |
| **Business Rules** | Không chứa business rule chiêm tinh — chỉ là lớp kỹ thuật thuần túy truy vấn dữ liệu |
| **Error Handling** | Nếu thư viện Ephemeris trả lỗi/timeout → throw `EphemerisProviderError`, không tự bịa dữ liệu thay thế |
| **Future Extension** | Có thể thay thế bằng adapter khác (ví dụ Astronomy Engine, hoặc dịch vụ ephemeris tự host) miễn implement đúng interface `IEphemerisProvider` — đây chính là ứng dụng của nguyên tắc Dependency Inversion |

### 6.3 Planet Calculator

| | |
|---|---|
| **Responsibility** | Chuyển đổi `RawEphemerisData` thành các `Planet` object hoàn chỉnh theo đúng cấu trúc Domain Spec 5.4 — gán Sign, degreeInSign, xác định isRetrograde |
| **Public Interface** | `calculatePlanets(rawData: RawEphemerisData, includeOptionalPoints: list<enum>): list<Planet>` |
| **Input** | Raw ephemeris data, danh sách điểm tùy chọn cần tính (Chiron, Lilith...) |
| **Output** | `list<Planet>` — tối thiểu 10 hành tinh chuẩn |
| **Dependency** | Swiss Adapter (đã tính toán ở bước trước) |
| **Business Rules** | `isRetrograde = (speed < 0)`; Mặt Trời/Mặt Trăng không bao giờ retrograde (assertion bắt buộc — nếu vi phạm, đây là lỗi dữ liệu nghiêm trọng cần raise `DataIntegrityError`); Sign được suy ra từ longitude theo bảng cố định 12 cung (Domain Spec Appendix 9.1) |
| **Error Handling** | Nếu raw data thiếu thiên thể bắt buộc → throw `IncompletePlanetDataError` |
| **Future Extension** | Thêm điểm tính toán mới (Vertex, Part of Fortune...) chỉ cần mở rộng danh sách `includeOptionalPoints`, không sửa logic lõi |

### 6.4 House Calculator

| | |
|---|---|
| **Responsibility** | Tính 12 `House` object theo `houseSystem` được chỉ định (Placidus hoặc Whole Sign) |
| **Public Interface** | `calculateHouses(utcDateTime, coordinates, houseSystem): list<House>` |
| **Input** | UTC DateTime, coordinates, HouseSystem enum |
| **Output** | `list<House>` (12 phần tử) hoặc rỗng nếu không tính được |
| **Dependency** | Swiss Adapter (cần dữ liệu thiên văn nền để tính cusp) |
| **Business Rules** | Placidus không hội tụ ở vĩ độ ≥ 66.5° (Domain Spec 5.9) → trả `[]` kèm cảnh báo thay vì throw lỗi cứng; Whole Sign luôn tính được bất kể vĩ độ; ý nghĩa 12 Nhà (`lifeThemes`) là cố định, không tính lại mỗi lần — chỉ tính `cuspDegree` và `signOnCusp` |
| **Error Handling** | Ghi nhận `HouseSystemNotConvergingError` như một **kết quả hợp lệ có cảnh báo**, không phải exception chặn toàn bộ pipeline |
| **Future Extension** | Thêm hệ thống nhà mới (Koch, Equal, Campanus...) chỉ cần thêm 1 implementation mới tuân theo interface `IHouseSystemCalculator`, không sửa các hệ thống đã có (Open/Closed Principle) |

### 6.5 Angle Calculator

| | |
|---|---|
| **Responsibility** | Tính 4 `Angle`: Ascendant, Midheaven, Descendant, Imum Coeli |
| **Public Interface** | `calculateAngles(utcDateTime, coordinates): list<Angle>` |
| **Input** | UTC DateTime, coordinates |
| **Output** | `list<Angle>` (4 phần tử) hoặc rỗng |
| **Dependency** | Swiss Adapter |
| **Business Rules** | DSC = ASC + 180°; IC = MC + 180° (ràng buộc toán học bắt buộc, có thể dùng làm self-check); Angles chỉ tính khi có giờ sinh chính xác — không có "ước lượng gần đúng" hợp lệ (Domain Spec 5.10) |
| **Error Handling** | Nếu `isBirthTimeKnown = false`, module này **không được gọi** — đây là quyết định của Chart Builder (bước điều phối), không phải Angle Calculator tự kiểm tra điều kiện business |
| **Future Extension** | Có thể mở rộng thêm Vertex/Anti-Vertex như các "angle phụ" trong tương lai |

### 6.6 Aspect Calculator

| | |
|---|---|
| **Responsibility** | So sánh mọi cặp `Planet` để xác định các `Aspect` hợp lệ giữa chúng |
| **Public Interface** | `calculateAspects(planets: list<Planet>, orbConfig: OrbConfiguration): list<Aspect>` |
| **Input** | Danh sách Planet đã tính, bảng cấu hình orb (Domain Spec Appendix 9.4) |
| **Output** | `list<Aspect>` |
| **Dependency** | Không phụ thuộc external service — thuần toán học dựa trên longitude của các Planet |
| **Business Rules** | 5 loại góc chuẩn với góc lý tưởng cố định (0°/60°/90°/120°/180°); `orb` phải ≤ giá trị tối đa cho phép theo `aspectType` và loại hành tinh (cá nhân vs. ngoài); `isApplying` xác định dựa trên `speed` của 2 hành tinh; `nature` suy ra tự động (Trine/Sextile=Harmonious, Square/Opposition=Challenging, Conjunction=Neutral) |
| **Error Handling** | Không có error case đặc biệt — module thuần tính toán, luôn trả về kết quả (có thể là mảng rỗng nếu không hành tinh nào tạo góc hợp lệ) |
| **Future Extension** | Orb configuration được tách thành tham số đầu vào (`OrbConfiguration`) thay vì hard-code, cho phép A/B test hoặc tùy biến theo trường phái chiêm tinh khác nhau trong tương lai mà không sửa logic tính toán |

### 6.7 Pattern Calculator

| | |
|---|---|
| **Responsibility** | Phân tích tập hợp `Aspect` đã có để phát hiện các cấu hình hình học đặc biệt (Grand Trine, T-Square, Grand Cross, Yod...) |
| **Public Interface** | `detectPatterns(planets: list<Planet>, aspects: list<Aspect>): list<Pattern>` |
| **Input** | Danh sách Planet và Aspect đã tính ở các bước trước |
| **Output** | `list<Pattern>` (có thể rỗng) |
| **Dependency** | Aspect Calculator (chạy **sau**, không chạy song song — vì Pattern derived hoàn toàn từ Aspect, đúng theo Domain Spec 5.12) |
| **Business Rules** | Mỗi loại Pattern có định nghĩa hình học cố định theo truyền thống (ví dụ Grand Trine = 3 Trine khép kín); Pattern không bao giờ được tính độc lập với Aspect — đây là ràng buộc thiết kế bắt buộc |
| **Error Handling** | Không có error case đặc biệt — nếu không phát hiện pattern nào, trả về `[]`, không phải lỗi |
| **Future Extension** | Mỗi loại Pattern được implement như một "detector" độc lập tuân theo interface `IPatternDetector`, cho phép thêm loại Pattern mới (Kite, Mystic Rectangle...) mà không sửa các detector đã có |

### 6.8 Element Calculator

| | |
|---|---|
| **Responsibility** | Tổng hợp phân bố `Element` (Fire/Earth/Air/Water) dựa trên Sign của các hành tinh trong Chart |
| **Public Interface** | `analyzeElements(planets: list<Planet>): ElementDistribution` |
| **Input** | Danh sách Planet đã có Sign |
| **Output** | `ElementDistribution { fireCount, earthCount, airCount, waterCount, dominantElement }` |
| **Dependency** | Bảng ánh xạ Sign→Element cố định (Domain Spec Appendix 9.1) |
| **Business Rules** | Ánh xạ Sign→Element là dữ liệu tĩnh, không thay đổi; module chỉ đếm và tổng hợp, không tự định nghĩa lại quan hệ này |
| **Error Handling** | Không có error case — luôn tính được nếu có ≥1 Planet |
| **Future Extension** | Có thể thêm trọng số khác nhau cho từng hành tinh (ví dụ Sun/Moon/ASC có trọng số cao hơn hành tinh ngoài) — đây là tham số cấu hình, không phải thay đổi logic lõi |

### 6.9 Modality Calculator

| | |
|---|---|
| **Responsibility** | Tổng hợp phân bố `Modality` (Cardinal/Fixed/Mutable) dựa trên Sign của các hành tinh |
| **Public Interface** | `analyzeModalities(planets: list<Planet>): ModalityDistribution` |
| **Input** | Danh sách Planet đã có Sign |
| **Output** | `ModalityDistribution { cardinalCount, fixedCount, mutableCount, dominantModality }` |
| **Dependency** | Bảng ánh xạ Sign→Modality cố định |
| **Business Rules** | Tương tự Element Calculator — thuần thống kê dựa trên bảng cố định |
| **Error Handling** | Không có error case |
| **Future Extension** | Tương tự Element Calculator |

### 6.10 Chart Builder

| | |
|---|---|
| **Responsibility** | Điều phối (orchestrate) toàn bộ pipeline, quyết định thứ tự gọi các module, xử lý nhánh rẽ (`isBirthTimeKnown`), và ráp kết quả cuối cùng thành `Chart` — **đóng vai trò Aggregate Root và Orchestrator duy nhất** của Engine |
| **Public Interface** | `build(birthData: BirthData, options: ChartOptions): Chart` — đây chính là entry point công khai duy nhất mà tầng ứng dụng gọi vào Engine |
| **Input** | BirthData, ChartOptions |
| **Output** | `Chart` hoàn chỉnh |
| **Dependency** | Tất cả các module 6.1–6.9 (Chart Builder là module cấp cao nhất, phụ thuộc vào abstraction của tất cả các module khác — Dependency Inversion) |
| **Business Rules** | Quyết định **có gọi hay không** House Calculator/Angle Calculator dựa trên `isBirthTimeKnown` (đây là nơi duy nhất trong Engine chứa logic điều phối cross-cutting đã mô tả ở Domain Spec Mục 6); gán `isHouseDataAvailable` tương ứng; gán `engineVersion` và `calculatedAt` |
| **Error Handling** | Bắt và propagate lỗi từ các module con; đảm bảo pipeline dừng đúng chỗ khi có lỗi nghiêm trọng (Validation, Ephemeris), nhưng vẫn hoàn tất khi có "lỗi mềm" có thể xử lý được (House không hội tụ) |
| **Future Extension** | Khi thêm `chartType` mới (Transit, Synastry...), Chart Builder sẽ có thêm các "orchestration strategy" khác nhau theo loại chart — xem Mục 9 |

### 6.11 Interpretation Engine

> Module này **không nằm trong Core Pipeline** (bước 1–11) mà là một module riêng biệt, tiêu thụ `Chart` object làm input — tuân thủ nguyên tắc "Separation of Calculation & Interpretation" ở Mục 2.

| | |
|---|---|
| **Responsibility** | Nhận vào một `Chart` đã hoàn chỉnh, tra cứu/sinh ra các `Interpretation` object tương ứng cho từng Planet-in-Sign, Planet-in-House, Aspect, Pattern |
| **Public Interface** | `interpret(chart: Chart, language: Language, contentSource: enum): list<Interpretation>` |
| **Input** | Chart hoàn chỉnh, ngôn ngữ mong muốn, nguồn nội dung (Human/AI/Hybrid) |
| **Output** | `list<Interpretation>` |
| **Dependency** | Interpretation Content Store (kho nội dung đã biên soạn) và/hoặc AI Interpretation Service (external, tùy chọn) |
| **Business Rules** | Nếu `chart.isHouseDataAvailable = false`, **không được sinh** Interpretation cấp Planet-in-House hoặc Angle (đúng theo Domain Spec Mục 6); `subjectKey` tra cứu phải nhất quán với Chart data |
| **Error Handling** | Nếu không tìm thấy nội dung diễn giải cho một `subjectKey` cụ thể → trả về danh sách thiếu (partial result) kèm cảnh báo, không làm fail toàn bộ response |
| **Future Extension** | Đây chính là điểm nối để tích hợp AI Interpretation trong tương lai — xem Mục 9.6 |

---

## 7. Design Decisions

| Quyết định | Lý do |
|---|---|
| **Vì sao Swiss Adapter được tách riêng?** | Thư viện ephemeris là **external dependency duy nhất mang tính "black box"** trong Engine. Tách riêng thành Adapter tuân theo interface `IEphemerisProvider` giúp: (1) dễ unit test các module khác bằng mock data, (2) có thể thay thế thư viện ephemeris trong tương lai mà không đụng đến bất kỳ logic nghiệp vụ chiêm tinh nào, (3) cô lập rủi ro nếu thư viện bên thứ ba có breaking change |
| **Vì sao Pattern Calculator độc lập với Aspect Calculator?** | Về mặt nghiệp vụ, Pattern **luôn là dữ liệu phái sinh (derived)** từ Aspect — không có Pattern nào tồn tại độc lập với Aspect. Tách thành module riêng (thay vì gộp vào Aspect Calculator) tuân theo Single Responsibility: Aspect Calculator chỉ trả lời "2 hành tinh này có tạo góc không", còn Pattern Calculator trả lời câu hỏi ở tầng cao hơn "tập hợp góc này có tạo thành một cấu hình đặc biệt không". Tách riêng cũng giúp thêm loại Pattern mới mà không sờ vào logic tính Aspect vốn đã ổn định |
| **Vì sao Chart là Aggregate Root?** | `Chart` là điểm duy nhất mà mọi thành phần khác (Planet, House, Angle, Aspect, Pattern) có ý nghĩa **trong ngữ cảnh của nó** — một `Planet` đứng riêng lẻ không có ý nghĩa nghiệp vụ đầy đủ nếu tách khỏi Chart chứa nó (ví dụ Aspect giữa 2 Planet chỉ có ý nghĩa trong 1 Chart cụ thể). Coi Chart là Aggregate Root đảm bảo tính toàn vẹn: mọi thao tác đọc/ghi dữ liệu chiêm tinh đều đi qua Chart, tránh tình trạng dữ liệu con (Planet, Aspect...) bị thao túng độc lập, mất nhất quán với Chart cha |
| **Vì sao House/Angle Calculator tách biệt khỏi Planet Calculator dù cùng phụ thuộc Swiss Adapter?** | Về nghiệp vụ, đây là 3 khái niệm độc lập (Domain Spec: Planet, House, Angle là 3 entity riêng biệt) và có business rule khác nhau (ví dụ House có thể không hội tụ ở vĩ độ cực, Planet thì luôn tính được) — tách riêng giúp mỗi module có error handling phù hợp với đặc thù của chính nó |
| **Vì sao Interpretation Engine không nằm trong Core Pipeline?** | Calculation (khách quan, deterministic, không đổi theo ngôn ngữ) và Interpretation (chủ quan, có thể thay đổi theo văn phong/ngôn ngữ/nguồn AI) là hai mối quan tâm hoàn toàn khác nhau về bản chất thay đổi (rate of change) — Calculation gần như bất biến, Interpretation content lại được cập nhật liên tục. Tách rời giúp cập nhật nội dung diễn giải (kể cả tích hợp AI) mà **không bao giờ** có rủi ro ảnh hưởng đến độ chính xác thiên văn học |
| **Vì sao Engine là Stateless?** | Cho phép scale ngang dễ dàng (chạy nhiều instance song song không lo tranh chấp trạng thái) và đảm bảo tính Deterministic — yêu cầu bắt buộc để một Chart tính ra hôm nay và tính lại sau 1 năm (với cùng engineVersion) phải cho kết quả giống hệt nhau |

---

## 8. Assumptions & Constraints

### 8.1 Assumptions (Giả định)

| Giả định | Ghi chú |
|---|---|
| Swiss Ephemeris luôn trả dữ liệu hợp lệ cho mọi thời điểm trong phạm vi hỗ trợ của thư viện (thường ~ 5400 TCN – 5400 SCN) | Nếu vượt phạm vi, coi là `EphemerisProviderError`, không phải trách nhiệm Engine tự xử lý ngoại lệ lịch sử/thiên văn cực đoan |
| BirthData đưa vào Engine **đã được normalize** ở tầng ứng dụng (đã geocode xong, đã xác định `historicalTimezoneId`) | Engine không chịu trách nhiệm chuẩn hóa dữ liệu thô từ người dùng — đúng ranh giới Mục 1.3 |
| IANA Timezone Database luôn sẵn có và cập nhật đầy đủ dữ liệu lịch sử múi giờ (bao gồm các lần đổi múi giờ của Việt Nam) | Nếu Timezone Service không khả dụng, Engine coi đây là lỗi hạ tầng (`UnresolvableTimezoneError`), không tự suy đoán |
| Mỗi lời gọi Engine chỉ xử lý 1 `BirthData` tại một thời điểm (cho Natal Chart) | Với Synastry/Composite (tương lai), input sẽ mở rộng thành 2 BirthData — xem Mục 9 |
| Không có yêu cầu tính toán real-time với độ trễ dưới mili-giây | Engine ưu tiên tính đúng đắn hơn tốc độ cực hạn, dù vẫn cần đạt < 5 giây theo NFR trong PRD |

### 8.2 Constraints (Ràng buộc)

| Ràng buộc | Ảnh hưởng |
|---|---|
| Placidus không hội tụ tại vĩ độ ≥ 66.5° | Bắt buộc phải có cơ chế xử lý "kết quả rỗng có cảnh báo" thay vì lỗi cứng (đã mô tả ở 6.4) |
| Thư viện Ephemeris thường không phải mã nguồn mở hoàn toàn miễn phí cho mục đích thương mại (tùy license) | Ảnh hưởng đến việc chọn implementation cụ thể của `IEphemerisProvider` ở tầng hạ tầng, không ảnh hưởng thiết kế Engine |
| Độ chính xác giờ sinh (phút) ảnh hưởng trực tiếp đến độ chính xác Angle (~1° mỗi 4 phút) | Đây là giới hạn vật lý/thiên văn học, không phải giới hạn kỹ thuật — cần truyền tải rõ cho người dùng ở tầng UX (ngoài phạm vi Engine) |
| Engine phải deterministic tuyệt đối trong cùng 1 `engineVersion` | Ràng buộc thiết kế cấm mọi module sử dụng nguồn ngẫu nhiên (random), thời gian hệ thống hiện tại, hoặc bất kỳ input ẩn nào ngoài `EngineInput` |

---

## 9. Extension Points

Engine được thiết kế để các tính năng sau có thể được thêm vào **mà không cần viết lại Core Pipeline hiện có** — chỉ cần thêm module mới hoặc mở rộng `Chart Builder` với orchestration strategy mới.

### 9.1 Secondary Progression

**Cách mở rộng:** Thêm module `ProgressionCalculator` áp dụng công thức "1 ngày sau khi sinh = 1 năm cuộc đời" lên `BirthData` gốc để tạo ra một "ngày tính toán phái sinh" (progressed date), sau đó **tái sử dụng nguyên vẹn** Planet Calculator, Aspect Calculator hiện có với ngày phái sinh này. Không cần viết lại logic tính vị trí hành tinh.

### 9.2 Solar Arc

**Cách mở rộng:** Tương tự Secondary Progression nhưng dịch chuyển toàn bộ Chart gốc theo góc di chuyển của Mặt Trời — thêm module `SolarArcCalculator` nhận `Chart` gốc + số năm, trả về `Chart` đã dịch chuyển, tái sử dụng Aspect Calculator để so sánh với Chart gốc.

### 9.3 Harmonic Chart

**Cách mở rộng:** Thêm module `HarmonicCalculator` nhân longitude của mọi Planet trong Chart gốc với một hệ số harmonic (ví dụ x5, x7), tạo ra vị trí mới, sau đó tái sử dụng Aspect Calculator trên tập vị trí mới này.

### 9.4 Arabic Parts (Lots)

**Cách mở rộng:** Thêm module `ArabicPartsCalculator` tính toán các điểm bổ trợ (ví dụ Part of Fortune) dựa trên công thức cố định liên quan đến Sun/Moon/Ascendant — các điểm này sau khi tính ra có thể được xử lý như một `Planet`-like object (cùng cấu trúc dữ liệu: longitude, sign, house), cho phép tái sử dụng Aspect Calculator mà không cần thay đổi kiểu dữ liệu.

### 9.5 Fixed Stars

**Cách mở rộng:** Thêm `FixedStarProvider` (tương tự Swiss Adapter nhưng cho dữ liệu sao cố định thay vì hành tinh), và một `FixedStarCalculator` xác định các hành tinh/Angle nào đang hợp với sao cố định quan trọng — module này hoạt động song song, không ảnh hưởng pipeline chính.

### 9.6 AI Interpretation

**Cách mở rộng:** `Interpretation Engine` (Mục 6.11) đã được thiết kế sẵn với tham số `contentSource: AIGenerated`. Việc tích hợp AI chỉ đòi hỏi implement một `IInterpretationProvider` mới gọi đến LLM (sử dụng `Chart` object đã có làm structured input/prompt context), không cần sửa Core Pipeline hay bất kỳ Calculator nào — đúng theo ranh giới đã xác lập ở Mục 1.3 (Engine cung cấp dữ liệu, không tự sinh văn bản).

### 9.7 Transit / Synastry / Composite / Solar Return (theo Context ban đầu)

| Loại Chart | Cách tái sử dụng Core Pipeline |
|---|---|
| **Transit** | Tạo 1 "Chart hiện tại" bằng cách gọi Core Pipeline với `BirthData` = thời điểm hiện tại + vị trí bất kỳ (không gắn cá nhân), sau đó dùng Aspect Calculator để so sánh liên-Chart giữa Chart Transit và Chart Natal gốc — cần thêm `InterChartAspectCalculator` (biến thể mở rộng của Aspect Calculator hiện có, nhận vào 2 tập Planet thay vì 1) |
| **Synastry** | Chạy Core Pipeline độc lập cho 2 `BirthData` (2 Chart Natal riêng biệt), sau đó dùng `InterChartAspectCalculator` như trên |
| **Composite** | Thêm `MidpointCalculator` tính điểm giữa (midpoint) của từng cặp Planet tương ứng giữa 2 Chart, tạo ra một tập Planet mới, sau đó tái sử dụng House/Angle/Aspect Calculator hiện có trên tập Planet tổng hợp này |
| **Solar Return** | Thêm `SolarReturnResolver` tìm thời điểm chính xác trong năm mà Mặt Trời quay lại đúng vị trí longitude tại lúc sinh (dùng lại Swiss Adapter để dò góc Mặt Trời), sau đó chạy nguyên Core Pipeline với thời điểm mới tìm được như một `BirthData` phái sinh |

> **Kết luận thiết kế:** Tất cả 4 loại Chart mở rộng nêu trên **không đòi hỏi** thay đổi Planet Calculator, House Calculator, Angle Calculator, Aspect Calculator, hay Pattern Calculator hiện có — chúng chỉ cần thêm các module điều phối/biến đổi dữ liệu đầu vào (`InterChartAspectCalculator`, `MidpointCalculator`, `SolarReturnResolver`) đứng **trước hoặc sau** Core Pipeline. Đây chính là minh chứng cho nguyên tắc Open/Closed đặt ra ở Mục 2.

---

## 10. Appendix

### 10.1 Glossary

| Thuật ngữ | Giải thích |
|---|---|
| **Pipeline** | Chuỗi các bước xử lý tuần tự, output của bước trước là input của bước sau |
| **Adapter** | Lớp trung gian che giấu chi tiết kỹ thuật của một hệ thống bên ngoài, expose ra một interface nội bộ nhất quán |
| **Aggregate Root** | Entity trung tâm trong Domain-Driven Design mà các entity con phụ thuộc vào để đảm bảo tính toàn vẹn dữ liệu |
| **Deterministic** | Tính chất luôn trả về cùng một kết quả với cùng một input, không có yếu tố ngẫu nhiên |
| **Stateless** | Không lưu trạng thái giữa các lần gọi, mỗi lời gọi độc lập hoàn toàn |
| **Dependency Inversion** | Nguyên tắc thiết kế: module cấp cao phụ thuộc vào abstraction (interface), không phụ thuộc trực tiếp vào implementation cụ thể |
| **Open/Closed Principle** | Mở để mở rộng, đóng để sửa đổi — thêm tính năng mới không cần sửa code đã ổn định |
| **UT (Universal Time)** | Chuẩn thời gian toàn cầu dùng làm gốc tính toán trong mọi phần mềm thiên văn học |
| **Derived Data** | Dữ liệu được suy ra hoàn toàn từ dữ liệu khác đã có, không phải input độc lập (ví dụ: Pattern derived từ Aspect) |

### 10.2 Sequence Diagram

*(Xem chi tiết đầy đủ tại Mục 3.4)*

### 10.3 Component Diagram

*(Xem chi tiết đầy đủ tại Mục 3.5)*

### 10.4 Processing Flow (rút gọn để tham chiếu nhanh)

```
BirthData
   → Validation
   → Timezone Resolution
   → Swiss Ephemeris (Adapter)
   → Planet Calculation
   → [nếu isBirthTimeKnown] House Calculation
   → [nếu isBirthTimeKnown] Angle Calculation
   → Aspect Calculation
   → Pattern Detection
   → Element & Modality Analysis
   → Chart Builder
   → Chart Object (Core Pipeline kết thúc tại đây)
   → (module riêng) Interpretation Engine
```

### 10.5 Bảng đối chiếu Module ↔ Entity Domain Spec

| Module | Entity Domain Spec tương ứng |
|---|---|
| Validation Module | BirthData, BirthLocation (Mục 5.1, 5.2) |
| Swiss Adapter | *(không map trực tiếp — hạ tầng thuần túy)* |
| Planet Calculator | Planet (Mục 5.4) |
| House Calculator | House, HouseSystem (Mục 5.8, 5.9) |
| Angle Calculator | Angle (Mục 5.10) |
| Aspect Calculator | Aspect (Mục 5.11) |
| Pattern Calculator | Pattern (Mục 5.12) |
| Element Calculator | Element (Mục 5.6) |
| Modality Calculator | Modality (Mục 5.7) |
| Chart Builder | Chart (Mục 5.3) |
| Interpretation Engine | Interpretation, Language (Mục 5.13, 5.15) |

---

**Ghi chú kết thúc tài liệu:** Astrology Engine Specification này là tài liệu kỹ thuật **cấp thấp hơn** Domain Specification về mặt trừu tượng (mô tả *cách* tính, không phải *cái gì*), nhưng **cấp cao hơn** các tài liệu triển khai cụ thể sẽ ra đời sau này (Database Schema, REST API Spec, Code Implementation). Mọi tài liệu kỹ thuật tiếp theo trong dự án nên tham chiếu ngược lại cả ba tài liệu — PRD, Domain Specification, và Engine Specification — như một chuỗi Single Source of Truth nhất quán.
