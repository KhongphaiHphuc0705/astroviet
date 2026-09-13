# Sprint 3 — Known Gaps Registry

**Trạng thái:** Biên soạn M10 (2026-09-13)
**Nguồn:** Tổng hợp từ Sprint 3 Summary + audit M10 (T-DOC/T-API/T-DB/T-ENG/T-LIC)
**Taxonomy:** Mọi gap đều có bằng chứng thực tế, không phát minh mới

---

## Phân loại Gap (Severity)

| Severity | Ý nghĩa |
|---|---|
| Cao | Blocking production launch hoặc blocking Sprint closure |
| Trung bình | Ảnh hưởng UX/product thật nhưng không block hiện tại |
| Thấp | Nợ kỹ thuật / tài liệu, không ảnh hưởng chức năng |

---

## Registry

### G-01 — Interpretation Engine chưa tồn tại

| Trường | Giá trị |
|---|---|
| **ID** | G-01 |
| **Mô tả** | `ChartResponse.interpretations` luôn trả mảng rỗng `[]`. Interpretation Engine chưa được xây dựng — chỉ có boundary interface `IInterpretationContentProvider`. |
| **Nguồn** | Sprint 3 Summary §2.1 (M7/M8) |
| **Impact** | Chart API trả kết quả thiếu nội dung diễn giải chiêm tinh — tính năng cốt lõi với người dùng cuối chưa hoạt động. |
| **Severity** | Trung bình |
| **Status** | OPEN — Deferred |
| **Owner** | Backend Team |
| **Follow-up Milestone** | Sprint 4 hoặc sprint riêng cho Interpretation Engine |
| **Blocks Sprint 3 closure?** | Không |
| **Blocks Production launch?** | Có — khi UI thật cần hiển thị nội dung diễn giải |

---

### G-02 — `birthProfileLabel` luôn null trong ChartSummaryResponse

| Trường | Giá trị |
|---|---|
| **ID** | G-02 |
| **Mô tả** | `ChartSummaryResponse.birthProfileLabel` luôn `null`. Label không được denormalize vào snapshot tại thời điểm tạo chart, và không có JOIN ngược về BirthProfile trong list query. Chưa có quyết định hướng giải quyết (denormalize thêm field vs live JOIN). |
| **Nguồn** | Sprint 3 Summary §2.2 (M7) |
| **Impact** | UI danh sách chart không hiển thị tên profile — giảm UX đáng kể khi user có nhiều profile. |
| **Severity** | Trung bình |
| **Status** | OPEN — Pending design decision |
| **Owner** | Backend Team |
| **Follow-up Milestone** | Sprint tiếp theo (cần quyết định kiến trúc trước khi implement) |
| **Blocks Sprint 3 closure?** | Không |
| **Blocks Production launch?** | Nên giải quyết trước khi UX list thật cần dùng |

---

### G-03 — House/Angle Golden Reference không có nguồn độc lập

| Trường | Giá trị |
|---|---|
| **ID** | G-03 |
| **Mô tả** | House cusps và Angles trong Golden Test fixtures không được validate bởi nguồn độc lập thật. Chỉ có thể dùng Astrodienst — "cùng họ engine" với Swiss Ephemeris, không thực sự độc lập. Field `expectedHouses`/`expectedAngles` trong tất cả fixtures hiện là `null`. |
| **Nguồn** | Sprint 3 Summary §2.3 (M8); `tests/fixtures/golden/README.md` |
| **Impact** | Không thể xác nhận độ chính xác House/Angle bằng nguồn thiên văn độc lập thật. Validation gap — không có bug đã biết, nhưng không có bằng chứng độc lập. |
| **Severity** | Thấp (đã risk-assessed tại M8 — chấp nhận được) |
| **Status** | OPEN — Accepted risk |
| **Owner** | Backend Team |
| **Follow-up Milestone** | Theo dõi dài hạn — thêm nguồn độc lập khi có |
| **Blocks Sprint 3 closure?** | Không |
| **Blocks Production launch?** | Theo dõi — không blocking nếu chấp nhận risk |

---

### G-04 — Documentation Reconciliation treo (3 điểm)

| Trường | Giá trị |
|---|---|
| **ID** | G-04 |
| **Mô tả** | Còn 2 điểm documentation drift chưa giải quyết sau M10: (a) Natal Chart Domain Spec §8 có thể chưa reflect đầy đủ `EngineInput` implementation; (b) Sprint 3 M4 Plan có thể có rule count không khớp thực tế. (Điểm §5.7 DB Design Spec đã giải quyết trong T-DB-01.) |
| **Nguồn** | Sprint 3 Summary §2.4 (M3/M4/M5) |
| **Impact** | Nợ tài liệu — developer đọc spec có thể bị sai lệch hiểu về một số chi tiết. |
| **Severity** | Trung bình |
| **Status** | PARTIAL — §5.7 RESOLVED (T-DB-01); 2 điểm còn lại OPEN |
| **Owner** | Backend Team |
| **Follow-up Milestone** | Follow-up Sprint hoặc doc-only PR |
| **Blocks Sprint 3 closure?** | Không |
| **Blocks Production launch?** | Không |

---

### G-05 — Rate Limiting chưa implement

| Trường | Giá trị |
|---|---|
| **ID** | G-05 |
| **Mô tả** | REST API Spec §9 yêu cầu Rate Limiting cho tất cả endpoints (đặc biệt `POST /charts/natal` — tính toán nặng). Chưa có middleware rate limiting nào trong codebase. |
| **Nguồn** | Sprint 3 Summary §2.5 (M7); REST API Spec §9 |
| **Impact** | Production readiness — không có protection chống abuse/DoS cho computation-heavy endpoint. |
| **Severity** | Thấp cho Sprint 3; Cao khi production |
| **Status** | OPEN — Deferred to production readiness sprint |
| **Owner** | Backend Team |
| **Follow-up Milestone** | Pre-production hardening sprint |
| **Blocks Sprint 3 closure?** | Không |
| **Blocks Production launch?** | **Có, trước production** |

---

### G-06 — Idempotency Key chưa thiết kế

| Trường | Giá trị |
|---|---|
| **ID** | G-06 |
| **Mô tả** | `POST /charts/natal` không có Idempotency Key mechanism. Nếu client retry sau network error, có thể tạo chart duplicate với cùng input. |
| **Nguồn** | Sprint 3 Summary §2.6 (M7) |
| **Impact** | Production reliability — duplicate chart records có thể xảy ra trong network retry scenarios. |
| **Severity** | Thấp |
| **Status** | OPEN — Deferred |
| **Owner** | Backend Team |
| **Follow-up Milestone** | Pre-production hardening sprint |
| **Blocks Sprint 3 closure?** | Không |
| **Blocks Production launch?** | Có, trước production |

---

### G-07 — CI thật chưa xác nhận chạy xanh end-to-end

| Trường | Giá trị |
|---|---|
| **ID** | G-07 |
| **Mô tả** | CI backend (`.github/workflows/backend-ci.yml`) chưa từng được verify chạy xanh end-to-end với network đầy đủ trong suốt quá trình review M1–M9. Toàn bộ audit M10 được thực hiện trong sandbox environment không có full network access — Prisma binary download bị chặn, khiến integration/API tests không thể verify. |
| **Nguồn** | Sprint 3 Summary §2.7; M10 Pre-Plan Audit 2026-09-13 |
| **Impact** | Verification gap nghiêm trọng — không thể xác nhận codebase hoạt động đúng trong môi trường CI thật. Exit Criterion #9 chưa có evidence. |
| **Severity** | **Cao** |
| **Status** | OPEN — UNVERIFIED (môi trường sandbox) |
| **Owner** | Backend Team |
| **Follow-up Milestone** | Phải trigger CI thật ít nhất 1 lần trước Sprint 3 CLOSED |
| **Blocks Sprint 3 closure?** | **Có — Exit Criterion #9 UNVERIFIED** |
| **Blocks Production launch?** | Không trực tiếp, nhưng rủi ro cao nếu bỏ qua |

---

### G-08 — Backend Coding Standards thiếu mục Coverage Philosophy

| Trường | Giá trị |
|---|---|
| **ID** | G-08 |
| **Mô tả** | `docs/development/Coding_Standards_And_Conventions.md` hiện không có mục §12.7 "Coverage Philosophy" bằng văn bản. Backend đã áp dụng risk-based coverage policy (không có ngưỡng %, 4 tiêu chí: TR coverage, critical branch, edge case, manual review) trong M9 nhưng policy này chưa được ghi thành văn bản chính thức trong Coding Standards. |
| **Nguồn** | Sprint 3 Plan §12.7 (tự ghi nhận); M9 implementation |
| **Impact** | Nợ tài liệu — developer mới không biết coverage policy là gì. |
| **Severity** | Thấp |
| **Status** | OPEN — Non-blocking documentation debt |
| **Owner** | Backend Team |
| **Follow-up Milestone** | Follow-up doc PR sau Sprint 3 CLOSED |
| **Blocks Sprint 3 closure?** | Không (đã xác định trước là non-blocking) |
| **Blocks Production launch?** | Không |

---

### G-09 — `package.json` version/description stale

| Trường | Giá trị |
|---|---|
| **ID** | G-09 |
| **Mô tả** | `backend/package.json` vẫn ghi `"version": "0.2.0"` và `"description": "AstroViet Platform — Backend (Sprint 2: Birth Profile Module)"` — chưa cập nhật lên Sprint 3. |
| **Nguồn** | Phát hiện độc lập trong Pre-Plan Audit M10 (2026-09-13) |
| **Impact** | Metadata drift — `npm --version` và package info không phản ánh đúng Sprint 3. |
| **Severity** | Thấp |
| **Status** | RESOLVED — Đã sửa trong T-VER-01 (M10) |
| **Owner** | Backend Team |
| **Follow-up Milestone** | N/A |
| **Blocks Sprint 3 closure?** | Không |
| **Blocks Production launch?** | Không |

---

### G-10 — CHANGELOG thiếu entry Sprint 3

| Trường | Giá trị |
|---|---|
| **ID** | G-10 |
| **Mô tả** | `backend/CHANGELOG.md` có entry cho Sprint 1 (`[0.1.0]`) và Sprint 2 (`[0.2.0]`), nhưng không có entry Sprint 3. |
| **Nguồn** | Phát hiện độc lập trong Pre-Plan Audit M10 (2026-09-13) |
| **Impact** | Nợ tài liệu — history của project không đầy đủ. |
| **Severity** | Thấp |
| **Status** | RESOLVED — Đã sửa trong T-CHANGE-01 (M10) |
| **Owner** | Backend Team |
| **Follow-up Milestone** | N/A |
| **Blocks Sprint 3 closure?** | Không |
| **Blocks Production launch?** | Không |

---

### G-11 — Mâu thuẫn Licensing: AGPL vs GPL-3.0-or-later

| Trường | Giá trị |
|---|---|
| **ID** | G-11 |
| **Mô tả** | Ba nguồn tài liệu ghi ba điều không nhất quán về licensing: (a) Sprint 3 Plan §13 ghi "AGPL/open-source đã RESOLVED"; (b) License Record kỹ thuật (từ tarball M2) xác nhận wrapper `swisseph-wasm` là `GPL-3.0-or-later` (không có Affero clause); (c) `backend/README.md` trước M10 ghi "Proprietary — Internal project". |
| **Nguồn** | Phát hiện độc lập trong Pre-Plan Audit M10; `docs/legal/swisseph-license-record.md` Field 8 |
| **Impact** | Compliance gap — không có xác nhận tường minh độc lập về intended project license. AGPL-3.0 là "proposed direction" theo Sprint 3 Plan, nhưng chưa có sign-off có thể kiểm chứng. |
| **Severity** | **Cao** |
| **Status** | ✅ RESOLVED — Chủ dự án xác nhận tường minh AGPL-3.0 là intended direction (conversation 2026-09-13, ID: `a4b870a4`) |
| **Owner** | Chủ dự án (business/legal decision) — sign-off đã nhận |
| **Follow-up Milestone** | Provenance audit trước production go-live |
| **Blocks Sprint 3 closure?** | Không — đã resolve |
| **Blocks Production launch?** | Có (provenance audit + publication vẫn cần trước go-live) |

---

### G-12 — README stale: Sprint 3 mô tả là "Sắp tới"

| Trường | Giá trị |
|---|---|
| **ID** | G-12 |
| **Mô tả** | `backend/README.md` trước M10 mô tả "Sprint 3: Natal Chart Module (Sắp tới) 🔜" và hoàn toàn không đề cập đến Chart Module đã hoàn chỉnh, Swiss Ephemeris integration, hay các endpoint chart. |
| **Nguồn** | Phát hiện độc lập trong Pre-Plan Audit M10 |
| **Impact** | Documentation drift nghiêm trọng — developer mới đọc README sẽ không biết Sprint 3 đã hoàn thành. |
| **Severity** | Trung bình |
| **Status** | RESOLVED — Đã sửa trong T-README-01 (M10) |
| **Owner** | Backend Team |
| **Follow-up Milestone** | N/A |
| **Blocks Sprint 3 closure?** | Không trực tiếp (Blocks M10 Acceptance Criteria #5) |
| **Blocks Production launch?** | Không trực tiếp |

---

### G-13 — Pattern Detection Algorithm chưa implement

| Trường | Giá trị |
|---|---|
| **ID** | G-13 |
| **Mô tả** | Domain Rule D-14: Pattern Detection (Grand Trine, T-Square, Grand Cross, Yod) đã được defer — `chart_patterns` luôn trả mảng rỗng `[]`. Entity/DB/API fields đã scaffold đầy đủ nhưng calculator luôn trả `[]`. |
| **Nguồn** | Sprint 3 Summary §3.3; Natal Chart Domain Spec D-14 (Deferred) |
| **Impact** | Feature gap — patterns không hiển thị trong chart response. |
| **Severity** | Thấp |
| **Status** | OPEN — Intentionally deferred (D-14 Confirmed) |
| **Owner** | Backend Team |
| **Follow-up Milestone** | Sprint 4+ |
| **Blocks Sprint 3 closure?** | Không |
| **Blocks Production launch?** | Không (đã được chấp nhận là deferred) |

---

### G-14 — Rủi ro bảo trì `swisseph-wasm`

| Trường | Giá trị |
|---|---|
| **ID** | G-14 |
| **Mô tả** | Package `swisseph-wasm` (v0.1.0) là wrapper non-official, có ít maintainer (chỉ 1 người: prolaxu). Không có SLA, không có guarantee của long-term maintenance. Nếu maintainer ngừng duy trì, AstroViet sẽ cần tự fork hoặc chuyển sang giải pháp khác. |
| **Nguồn** | Sprint 3 Summary §3.3; ghi nhận từ M2 Technical Spike |
| **Impact** | Technical debt dài hạn — dependency risk. |
| **Severity** | Thấp |
| **Status** | OPEN — Acknowledged risk, theo dõi dài hạn |
| **Owner** | Backend Team |
| **Follow-up Milestone** | Theo dõi dài hạn — review hàng năm |
| **Blocks Sprint 3 closure?** | Không |
| **Blocks Production launch?** | Không trực tiếp (theo dõi dài hạn) |

---

## Tóm tắt theo mức độ

| Severity | Gaps | Blocks Sprint 3 closure | Blocks Production |
|---|---|---|---|
| **Cao** | G-07, G-11 | G-07 (Exit #9 UNVERIFIED) | G-07 |
| **Trung bình** | G-01, G-02, G-04, G-12 | Không (G-12 RESOLVED) | G-01, G-02 |
| **Thấp** | G-03, G-05, G-06, G-08, G-09, G-10, G-13, G-14 | Không | G-05, G-06 |

## Trạng thái Resolution

| Status | Gaps |
|---|---|
| ✅ RESOLVED (trong M10) | G-09, G-10, G-11, G-12 |
| PARTIAL | G-04 |
| OPEN — UNVERIFIED (blocking) | G-07 |
| OPEN — Deferred/Accepted | G-01, G-02, G-03, G-05, G-06, G-08, G-13, G-14 |

---

*Registry này được đối chiếu chéo với toàn bộ audit task M10 (T-DOC-01..05, T-API-01/02, T-DB-01..03, T-ENG-01/02, T-LIC-01..03). Không có finding nào từ các task audit mà không xuất hiện ở đây.*
