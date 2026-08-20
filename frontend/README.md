# AstroViet Frontend

## 1. Overview

AstroViet là một nền tảng chiêm tinh học trực tuyến, cung cấp tính năng vẽ và phân tích bản đồ sao cá nhân, bản đồ sao tương hợp, đồng thời đóng vai trò như một thư viện tri thức chiêm tinh.
Dự án frontend này đóng vai trò là giao diện người dùng chính (SPA) tiêu thụ REST API từ AstroViet Backend, mang lại trải nghiệm tương tác cao.

## 2. Features / Current Scope

**Current Status: Sprint F1 — Frontend Foundation (Complete)**
Sprint F1 chỉ tập trung vào việc thiết lập hạ tầng nền tảng (Foundation) bao gồm cấu trúc thư mục, hệ thống định tuyến, Design System (UI primitives), cấu hình CI/CD, Testing và các quy ước mã nguồn. Các tính năng nghiệp vụ như Authentication, Birth Profile, Chart Viewer **sẽ được phát triển ở các Sprint tiếp theo**.

## 3. Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Form & Validation**: React Hook Form, Zod
- **API Integration**: Axios
- **Testing**: Vitest (Unit/Component), Playwright (E2E), MSW (Mocking)

## 4. Prerequisites

- **Node.js**: `>= 22.18.0`
- **Package Manager**: npm

## 5. Installation

Để bắt đầu cài đặt, clone repository và chạy lệnh:

```bash
cd frontend
npm install
```

## 6. Environment Configuration

Copy file `.env.example` thành `.env` để sử dụng cấu hình môi trường mặc định:

```bash
cp .env.example .env
```

Biến quan trọng cần lưu ý:

- `VITE_API_BASE_URL`: Địa chỉ URL gốc của backend REST API (mặc định `/api` khi chạy qua proxy Vite hoặc `http://localhost:5173/api` cho MSW). Bắt buộc phải cấu hình đúng để gọi API.

## 7. Development

Bắt đầu Vite development server:

```bash
npm run dev
```

## 8. Testing

- `npm run test`: Chạy unit/component test một lần.
- `npm run test:watch`: Chạy test với chế độ tự động reload khi đổi file.
- `npm run test:coverage`: Chạy test và tạo báo cáo độ bao phủ mã nguồn.
- `npm run test:e2e`: Chạy Playwright E2E tests.

_Pipeline CI sẽ chạy toàn bộ các lệnh test này tự động trên mọi PR nhắm vào nhánh chính._

## 9. Linting

- `npm run lint`: Chạy ESLint để kiểm tra mã nguồn (CI sử dụng lệnh này).
- `npm run lint:fix`: Chạy ESLint và tự động sửa các lỗi có thể sửa.

## 10. Formatting

- `npm run format`: Chạy Prettier để định dạng toàn bộ mã nguồn.
- `npm run format:check`: Kiểm tra xem mã nguồn đã chuẩn định dạng chưa (sử dụng trên CI).

## 11. Production Build

- `npm run build`: Thực hiện Type-check (`tsc --noEmit`) sau đó build ra gói sản xuất.
- `npm run preview`: Chạy local server để kiểm tra gói build sản xuất.

## 12. Project Structure

Dự án được cấu trúc theo Feature-Sliced Design (FSD):

- `src/app`: Bootstrap tầng ứng dụng, cấu hình router, global styles.
- `src/pages`: Component tương ứng từng route (chỉ orchestration, không có business logic).
- `src/widgets`: Khối UI lớn kết hợp từ nhiều tính năng (VD: Navbar, Sidebar).
- `src/features`: Chứa business logic (module tính năng độc lập, cấu trúc bởi `api`, `hooks`, `components`, `model`).
- `src/entities`: Các object, model và giao diện dùng chung gắn liền với domain.
- `src/shared`: Utilities, hooks, design tokens, các API clients và UI primitives tái sử dụng trên toàn hệ thống.

_Lưu ý: Sau Sprint F1, `features/` và `entities/` chỉ chứa các file scaffold (`.gitkeep`, `README.md`) làm tiền đề cho Sprint F2._

## 13. Architecture Overview

Ứng dụng frontend tuân thủ kiến trúc "Feature-Sliced, Layered by Responsibility". Thay vì chia theo các lớp Domain như Backend, frontend chia nhỏ theo tính năng (features). Các layer (shared -> entities -> features -> widgets -> pages) tuân thủ quy tắc luồng phụ thuộc một chiều để đảm bảo maintainability và khả năng thay đổi.
Tham khảo `Frontend_Architecture_Specification.md` để biết thêm chi tiết.

## 14. Design System

Thiết kế Design System được cô lập trong `src/shared/ui`, sử dụng hệ thống token TailwindCSS map 1:1 với Figma.
Mọi UI primitive component được thiết kế tuân theo khả năng accessibility của WCAG, quản lý vòng đời chặt chẽ (Component Lifecycle Policy).

## 15. Component Development Guidelines

Quy ước đặt tên, kiểu dữ liệu Props (Interface), tách Component Container/Presentational được liệt kê đầy đủ tại `Frontend_Coding_Standards.md`. Bất kỳ PR UI nào cũng phải đảm bảo: (1) Tuân thủ Accessibility (2) Responsive Layout, (3) Không lạm dụng memoization khi chưa cần.

## 16. Future Development Guidance

Trong các Sprint tới, đặc biệt chú ý:

- Thực hiện nghiêm ngặt ranh giới (Boundaries) giữa các layer qua ESLint.
- Mọi logic giao tiếp Backend phải thông qua custom hooks (`useQuery`, `useMutation`), không dùng fetch trong component.
- API Error handling chỉ được xử lý qua `ApiError` format (RFC7807) chuẩn hóa, không parse response thô.

## 17. Known Limitations / Known Gaps Registry

Dưới đây là danh sách các khiếm khuyết được ghi nhận, có chủ đích hoặc cần khắc phục vào các Sprint kế tiếp:

1. `Checkbox` đang thiếu prop `error`/`helperText` (Chờ khi có thực tế ≥ 2 form sử dụng).
2. `QueryClientProvider` và `I18nextProvider` chưa được wrap quanh `AppProvider` và `renderWithProviders` (Kiến trúc §14.3 đã yêu cầu nhưng chưa triển khai vì chưa cần ở F1).
3. `uiStore.ts` chưa chứa trạng thái `activeModalId` như dự kiến tại Kiến trúc §7.3.
4. Cây định tuyến `router.tsx` hiện tại chỉ làm nền tảng, chưa ánh xạ các route của Phase 1/2/3 theo Frontend UI Specification.
5. Chưa kích hoạt `eslint-plugin-boundaries` vì quy mô codebase hiện tại quá nhỏ, đang phải dùng manual review.
