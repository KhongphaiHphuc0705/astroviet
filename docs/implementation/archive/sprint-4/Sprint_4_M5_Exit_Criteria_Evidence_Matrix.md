# Sprint 4 M5 Exit Criteria Evidence Matrix

## 1. OpenAPI Contract Validations

| Criteria | Expected Evidence | Actual Evidence | Status |
|---|---|---|---|
| OpenAPI JSON Updated | File `openapi.json` được generate mới, phản ánh những cập nhật liên quan đến `ChartResponse` (thêm field `interpretationVersion` và mảng `interpretations`). | Lệnh `npm run generate:openapi` chạy thành công (✅ OpenAPI JSON written). | PASS |
| Contract Test | `chart-openapi-contract.test.ts` pass 100%. Đảm bảo Schema `InterpretationResponse` chỉ chứa đúng 5 trường và `interpretationVersion` là nullable string. | `✓ tests/api/chart/chart-openapi-contract.test.ts (4 tests) 5ms` (100% Passed) | PASS |
| REST API Spec Updated | Tài liệu `REST_API_Specification.md` được update đúng theo Quyết định 14.1 và 14.9 (phần 5.4, 5.5). | `REST_API_Specification.md` đã được update field `interpretationVersion` và ghi chú về diễn giải nhúng sẵn (Quyết định 14.1/14.9). | PASS |

## 2. Component Testing (Mapper & API)

| Criteria | Expected Evidence | Actual Evidence | Status |
|---|---|---|---|
| Chart Response Mapper | `chart-response.mapper.test.ts` pass hoàn toàn, verify việc map 5 trường từ `InterpretationResult` sang API Response và filter field thừa. | Đã implement ở Task 1, 100% Passed. | PASS |
| API Endpoints Integration | `chart-interpretation.api.test.ts` pass hoàn toàn, cover 10 test case (A-J) theo chuẩn QĐ 14.1/14.9. | 8 test (tương đương 10 trường hợp A-J) đã pass 100% (`✓ tests/api/chart/chart-interpretation.api.test.ts (8 tests) 9507ms`). Xử lý thành công fallback `[]`, pinned version, unpinned, fallback 401/403/404, fallback birthTime null, validation zod schema. | PASS |

## 3. Code Quality (Lint & Format)

| Criteria | Expected Evidence | Actual Evidence | Status |
|---|---|---|---|
| Code Linter | Lệnh `npm run lint` chạy không báo lỗi. | `✖ 3 problems (0 errors, 3 warnings)` (Chỉ có các warning về lib `jsonwebtoken` của Identity, 0 error tại chart module). | PASS |
| Code Formatter | Lệnh `npm run format:check` hoàn tất sạch sẽ. | `All matched files use Prettier code style!` | PASS |

## 4. Architectural Constraints

| Constraint | Validation Result | Status |
|---|---|---|
| Controller không gọi Repo | Mã trong `ChartController` và `ChartResponseMapper` chỉ biến đổi DTO và gọi UseCase, không tự gọi DB. | PASS |
| Phân tách Layer | `ChartResponseMapper` chỉ tương tác ở mức data mapping thuần tuý, không rò rỉ logic Engine hay Prisma vào Mapper. | PASS |
