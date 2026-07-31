# Frontend Coding Standards — AstroViet

**Phiên bản:** 1.0
**Trạng thái:** Draft — dựa trên Frontend UI Specification (Frozen), Frontend Architecture Specification (Frozen), Design System Specification (Frozen), Backend Coding Standards (Frozen)
**Phạm vi:** Quy ước kỹ thuật **cấp dòng code/file** — cách viết, đặt tên, tổ chức test, review — không phải kiến trúc hệ thống hay đặc tả thiết kế

> Đây là tài liệu **thứ tư và cuối cùng** trong bộ tài liệu nền tảng Frontend. Ba tài liệu trước trả lời "trông ra sao" (UI Spec), "tổ chức thế nào" (Architecture Spec), "quản trị theo quy tắc gì" (Design System Spec) — tài liệu này trả lời **"mỗi dòng code cụ thể phải viết như thế nào"**. Nó không lặp lại quyết định kiến trúc (ví dụ: không giải thích lại vì sao dùng TanStack Query cho Server State — chỉ nêu quy ước viết code khi dùng TanStack Query). Khi cần biết *tại sao* 1 quyết định kiến trúc/thiết kế tồn tại, tài liệu này trỏ ngược lại 3 tài liệu trước thay vì giải thích lại.

---

## Mục lục

1. [Purpose](#1-purpose)
2. [General Principles](#2-general-principles)
3. [Project Structure Rules](#3-project-structure-rules)
4. [Naming Conventions](#4-naming-conventions)
5. [React Conventions](#5-react-conventions)
6. [TypeScript Standards](#6-typescript-standards)
7. [Styling Standards](#7-styling-standards)
8. [State Management Standards](#8-state-management-standards)
9. [API Integration Standards](#9-api-integration-standards)
10. [Error Handling](#10-error-handling)
11. [Accessibility Standards](#11-accessibility-standards)
12. [Performance Guidelines](#12-performance-guidelines)
13. [Testing Standards](#13-testing-standards)
14. [Import Rules](#14-import-rules)
15. [Code Review Checklist](#15-code-review-checklist)
16. [Technical Debt Policy](#16-technical-debt-policy)
17. [Git Standards](#17-git-standards)
18. [Documentation Standards](#18-documentation-standards)

---

## 1. Purpose

### 1.1. Mục tiêu

- Đảm bảo **bất kỳ ai đọc code AstroViet Frontend** (kể cả chính tác giả 6 tháng sau) có thể đoán đúng cách 1 đoạn code mới sẽ được viết như thế nào, chỉ bằng cách nhìn code hiện có — không cần hỏi lại.
- Giảm số quyết định phong cách phải đưa ra trong lúc code (đã quyết định sẵn ở đây) để dồn năng lượng cho quyết định nghiệp vụ/kiến trúc thực sự khó.
- Làm nền tảng khách quan cho Code Review (mục 15) — review dựa trên quy tắc đã thống nhất, không dựa trên gu cá nhân người review tại thời điểm đó.

### 1.2. Phạm vi

Tài liệu áp dụng cho **mọi file trong `frontend/src/`** (theo cấu trúc Architecture Spec §3) không phân biệt tầng (`app`/`pages`/`widgets`/`features`/`entities`/`shared`) — quy tắc là toàn cục, không có ngoại lệ "tầng này được viết khác". Không áp dụng cho file cấu hình build (`vite.config.ts`, `tailwind.config.ts`...) — các file đó theo convention riêng của công cụ tương ứng.

### 1.3. Đối tượng đọc

Bất kỳ ai viết code cho `frontend/` — ở quy mô hiện tại là 1 developer duy nhất (đúng bối cảnh dự án đã nêu ở Architecture Spec), nhưng tài liệu được viết **như thể** cho 1 team, để không cần viết lại khi team mở rộng (nhất quán với ngưỡng mở rộng đã đặt ở Architecture Spec §4.7/§16).

---

## 2. General Principles

> 6 nguyên tắc dưới đây là **kim chỉ nam khi 1 quy tắc cụ thể ở các mục sau không bao trùm hết 1 tình huống** — khi không chắc nên viết thế nào, quay về nguyên tắc gốc, không tự sáng tạo pattern mới.

### 2.1. Readability (Ưu tiên cao nhất)

Code được đọc nhiều lần hơn được viết. **Đọc được ngay, không cần suy luận** luôn thắng "ngắn gọn khéo léo" — ví dụ: đặt tên biến rõ ràng thắng viết tắt, tách 1 điều kiện phức tạp thành biến có tên trung gian thắng nhồi tất cả vào 1 dòng `if`. Không dùng kỹ thuật ngôn ngữ "khoe khéo" (nested ternary quá 1 cấp, chaining quá dài) chỉ để giảm số dòng.

### 2.2. Simplicity (KISS)

Giải pháp đơn giản nhất giải quyết đúng vấn đề hiện tại thắng giải pháp "tổng quát hóa phòng xa" — nối tiếp trực tiếp nguyên tắc YAGNI đã xuyên suốt cả 3 tài liệu trước. Không thêm abstraction (interface, factory, config injectable) cho 1 nhu cầu chưa xảy ra lần thứ 2.

### 2.3. DRY (Don't Repeat Yourself) — có giới hạn

Trùng lặp code **thực sự cùng 1 khái niệm nghiệp vụ** phải được rút gọn (đưa lên `shared`/`entities` theo đúng tầng, Architecture Spec §4). Nhưng **2 đoạn code trông giống nhau tình cờ, khác khái niệm nghiệp vụ, không nên gộp** — DRY áp dụng cho ý nghĩa, không áp dụng máy móc theo hình dạng code (rule kinh điển "Rule of Three": trùng lặp 1 lần chưa cần rút gọn, lặp lại lần thứ 3 mới chắc chắn là pattern cần rút gọn — trước đó dễ rút gọn nhầm 2 khái niệm khác nhau vào chung 1 abstraction sai).

### 2.4. SOLID (áp dụng phần liên quan tới Frontend/React)

| Nguyên tắc | Áp dụng cụ thể trong AstroViet Frontend |
|---|---|
| **S**ingle Responsibility | 1 component/hook chỉ nên có 1 lý do để thay đổi — component vừa fetch data vừa render vừa xử lý form validation là dấu hiệu cần tách (đã có ranh giới tầng ở Architecture Spec §9.2 hỗ trợ việc tách này) |
| **O**pen/Closed | Component mở rộng được qua props (variant/size/slot) mà không cần sửa code nội bộ của nó — nếu thêm 1 use-case mới luôn phải mở source code component ra sửa `if/else` nội bộ, component đó thiết kế API chưa tốt |
| **L**iskov Substitution | *(áp dụng hạn chế, vì không dùng kế thừa class)* — diễn giải sang React: 1 component cùng "họ" (ví dụ mọi variant của `Button`) phải giữ đúng hành vi/props tối thiểu như nhau, gọi component ở bất kỳ variant nào cũng không được gây bất ngờ hành vi |
| **I**nterface Segregation | Props interface không nhồi nhét prop không liên quan tới nhau vào 1 component — component cần nhiều nhóm cấu hình độc lập nên tách nhiều component nhỏ hơn tách props |
| **D**ependency Inversion | Component/hook phụ thuộc vào 1 abstraction (kiểu dữ liệu, interface hook) chứ không phụ thuộc trực tiếp implementation cụ thể — ví dụ Feature component gọi `useLogin()` (hook), không tự import thẳng Axios instance |

### 2.5. Composition over Inheritance

Không có class component, không HOC lồng nhau (đã chốt ở Architecture Spec §9.5) — quy tắc coding cụ thể hóa: khi 2 component có logic giống nhau, rút logic đó thành **custom hook** dùng chung, không tạo component cha "trừu tượng" để 2 component khác kế thừa.

### 2.6. Separation of Concerns

Mỗi file trả lời đúng 1 câu hỏi: file component trả lời "hiển thị gì", file hook trả lời "lấy/xử lý dữ liệu gì", file mapper trả lời "chuyển đổi dữ liệu ra sao". 1 file trả lời nhiều hơn 1 câu hỏi trong 3 câu trên là tín hiệu cần tách file (cụ thể hóa ranh giới tầng đã có ở Architecture Spec §9 xuống cấp độ "trong 1 feature, còn tách được nữa không").

---

## 3. Project Structure Rules

> Cấu trúc thư mục đầy đủ đã có ở Architecture Spec §3 — mục này chỉ nêu **quy tắc vận hành cụ thể** khi làm việc với cấu trúc đó hàng ngày.

### 3.1. Quy tắc "1 file, 1 export chính"

Mỗi file component chỉ có **1 export mặc định là component chính** của file đó — các sub-component thực sự riêng tư (không dùng ở nơi khác) có thể định nghĩa cùng file, nhưng không export ra ngoài `index.ts` của thư mục component (mục 4.2 quy ước barrel). Nếu 1 sub-component bắt đầu cần dùng lại ở nơi khác, đó là tín hiệu tách thành file/component riêng.

### 3.2. Giới hạn kích thước file — tín hiệu, không phải luật cứng

Không có con số dòng code cứng bắt buộc split file — nhưng 1 file **> 200 dòng** (không tính test) là tín hiệu bắt buộc tự hỏi: file có đang gánh nhiều hơn 1 trách nhiệm không (mục 2.6)? Nếu có, tách; nếu thực sự vẫn là 1 trách nhiệm duy nhất chỉ dài do bản chất nghiệp vụ (ví dụ 1 component có nhiều nhánh render theo state), giữ nguyên và không tách gượng ép chỉ để giảm số dòng.

### 3.3. Module Ownership — mỗi file thuộc đúng 1 tầng, không "mượn tạm"

Áp dụng nghiêm ranh giới tầng Architecture Spec §2.2/§4: khi viết code trong `features/birth-profile`, **không** viết thêm 1 hàm tiện ích "tạm dùng" ngay trong đó nếu hàm đó không liên quan gì tới nghiệp vụ Birth Profile — hàm thuần túy không gắn domain luôn viết vào `shared/lib` ngay từ đầu, không "để đó rồi refactor sau" (kinh nghiệm cho thấy "sau" hiếm khi tới, và util bị mắc kẹt sai tầng làm sai lệch ranh giới enforce ở Architecture Spec §4.7).

### 3.4. Thêm file mới vào feature — luôn theo đúng khuôn

Mọi feature mới tuân thủ đúng khuôn thư mục con đã chốt (`api/`, `hooks/`, `components/`, `model/`, `index.ts` — Architecture Spec §4.2) — không tự sáng tạo thêm thư mục con khác tên (`utils/`, `helpers/`, `services/`) cho cùng mục đích đã có tên chuẩn. Nếu thực sự phát sinh 1 mối quan tâm mới chưa có thư mục con tương ứng (hiếm), đây là thay đổi cấu trúc cần ghi nhận ngược lại Architecture Spec, không phải quyết định cục bộ trong 1 feature.

---

## 4. Naming Conventions

> UI Spec §22 đã định nghĩa naming cho **tài sản thiết kế** (tên file component, token CSS, route path, boolean/event prop). Mục này bổ sung naming cho **cấu trúc code TypeScript/React thuần túy** chưa được nói tới ở đó.

### 4.1. Bảng quy ước

| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| Context | `PascalCase` + hậu tố `Context` | `AuthContext` |
| Provider (component bọc Context) | Tên Context + hậu tố `Provider` | `AuthContextProvider` |
| Type alias | `PascalCase`, không tiền tố | `type BirthProfile` |
| Interface | `PascalCase`, không tiền tố `I` (đã chốt ở UI Spec §22) — dùng cho **Props component** và mọi object shape có khả năng được `extends` | `interface ButtonProps` |
| Type (khác Interface) | Dùng cho **union, intersection, mapped type, tuple** — bất cứ gì không phải "object shape đơn giản có thể mở rộng" | `type AsyncStatus = 'idle' \| 'loading' \| 'success' \| 'error'` |
| Enum | `PascalCase` tên enum, `PascalCase` member (đã chốt UI Spec §22) — **chỉ dùng cho tập giá trị cố định gắn domain** (ví dụ `ZodiacSign`); với cờ trạng thái đơn giản 2-3 giá trị, ưu tiên Union Type (mục 6.2) hơn Enum | `enum ZodiacSign { Aries, Taurus }` |
| Constant (giá trị đơn, không đổi) | `SCREAMING_SNAKE_CASE` | `const MAX_PAGE_SIZE = 100` |
| Constant object (nhóm giá trị liên quan, dùng thay Enum khi cần cả runtime lẫn type) | `PascalCase`, khai báo `as const` | `const HouseSystem = { Placidus: 'placidus', WholeSign: 'whole-sign' } as const` |
| Utility function (`shared/lib`) | `camelCase`, bắt đầu bằng **động từ** mô tả hành động thuần túy | `formatDegree()`, `parseIsoDate()` — không đặt tên danh từ (`degreeFormatter`) vì đây là hàm, không phải object |
| Generic type parameter | 1 chữ cái viết hoa (`T`, `K`, `V`) **chỉ khi** ý nghĩa hiển nhiên từ ngữ cảnh (ví dụ `Array<T>`); dùng tên mô tả đầy đủ khi có ≥ 2 type parameter hoặc ý nghĩa không hiển nhiên | `Pick<TResponse, TKey>` thay vì `Pick<T, K>` khi cần phân biệt rõ 2 khái niệm khác nhau |

### 4.2. Quy ước Barrel Export (`index.ts`)

Kế thừa nguyên tắc Architecture Spec §11.5 (chỉ re-export type + component, không re-export side-effect) — cụ thể hóa thành quy tắc viết code: mỗi dòng trong `index.ts` là **1 `export { X } from './x'` hoặc `export type { Y } from './y'` tường minh** — không dùng `export * from './x'` (wildcard export) ở bất kỳ barrel file nào, vì wildcard export che giấu chính xác cái gì đang được public hóa, gây khó review khi Public API của feature thay đổi (Architecture Spec §4.2).

---

## 5. React Conventions

### 5.1. Functional Components — không ngoại lệ

100% Function Component với Hooks — không viết Class Component trong bất kỳ trường hợp nào, kể cả khi 1 thư viện bên thứ 3 yêu cầu Class (ví dụ Error Boundary cần class theo React API cũ) — trường hợp đó dùng wrapper/thư viện đã đóng gói sẵn dưới dạng hook-friendly API, không tự viết thêm Class Component mới trong codebase.

### 5.2. Props

- Luôn định nghĩa qua `interface ComponentNameProps` (mục 4.1), không dùng `type` cho Props trừ khi Props thực sự là discriminated union (mục 6.4).
- Destructure Props ngay ở tham số hàm — không nhận `props` rồi truy cập `props.x` rải rác trong thân component.
- Giá trị mặc định của prop khai báo qua **default parameter** (`{ size = 'md' }`) — không dùng `defaultProps` (API cũ, không tương thích tốt với TypeScript inference cho Function Component).
- Props **không** bao giờ nhận nguyên 1 object phức tạp rồi component tự đào sâu vào bên trong để lấy 1-2 field — nhận đúng field cần dùng, giữ Props "phẳng" nhất có thể (hỗ trợ trực tiếp nguyên tắc Interface Segregation, mục 2.4).

### 5.3. Children

- Type `children` bằng `React.ReactNode` — không dùng `JSX.Element` (quá hẹp, chặn `null`/string/array hợp lệ).
- Component chỉ nhận `children` khi nó thực sự là **container tổng quát** (`Card`, `Stack`, `Modal`) — component có ý nghĩa cụ thể (`Badge`, `Avatar`) nhận `label`/`content` tường minh qua prop có tên, không lạm dụng `children` cho mọi thứ vì "tiện".

### 5.4. Composition

- Component lớn được lắp ráp từ component nhỏ hơn qua **composition trong JSX** (lồng thẻ), không qua việc 1 component "biết" và tự render component khác bằng cách import cứng khi mối quan hệ đó nên do tầng gọi (Page/Feature) quyết định — nhắc lại ranh giới tầng Architecture Spec §9.2 (Composite không tự quyết định feature nào gọi nó).
- Không dùng "prop drilling" quá 2 cấp cho cùng 1 giá trị (truyền prop qua 1 component trung gian chỉ để chuyển tiếp xuống component cháu) — 2 cấp trở lên là tín hiệu cần Context (phạm vi hẹp, Architecture Spec §7.2) hoặc composition lại cấu trúc component.

### 5.5. Memoization — quy tắc viết code cụ thể (rationale đầy đủ ở Architecture Spec §11.1)

- `React.memo`/`useMemo`/`useCallback` **không phải mặc định** khi viết component mới — chỉ thêm khi có lý do đo được cụ thể (danh sách lớn, tính toán nặng lặp lại — đã liệt kê điều kiện ở Architecture Spec §11.1).
- ESLint rule `react-hooks/exhaustive-deps` **luôn bật ở mức error**, không tắt bằng comment (`eslint-disable-next-line`) trừ khi có comment giải thích rõ lý do dependency thực sự cố ý bỏ qua — dependency array thiếu là nguồn bug phổ biến nhất với `useEffect`/`useMemo`/`useCallback`.

### 5.6. Custom Hooks

- Tên bắt đầu `use` (đã chốt UI Spec §22), và **1 hook chỉ giải quyết 1 mối quan tâm** — hook vừa fetch data vừa quản lý form state vừa xử lý navigation là dấu hiệu cần tách thành nhiều hook nhỏ, compose lại ở component gọi.
- Giá trị trả về: dùng **object có tên field** (`{ data, isLoading, error }`) khi trả về ≥ 2 giá trị không có thứ tự tự nhiên; dùng **array** (`[value, setValue]`) chỉ khi mô phỏng đúng pattern `useState` (cặp giá trị-setter có thứ tự quy ước rõ ràng). Không trộn lẫn 2 kiểu tùy hứng giữa các hook trong cùng codebase.

---

## 6. TypeScript Standards

### 6.1. Strict Mode — không thỏa hiệp

`tsconfig.json` bật `"strict": true` (bao gồm `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`...) ngay từ file đầu tiên của project — không bật `strict: false` "tạm thời để code nhanh hơn" rồi định bật lại sau (kinh nghiệm: bật lại sau luôn tốn công hơn nhiều lần so với strict ngay từ đầu). Bổ sung `noUncheckedIndexedAccess: true` — truy cập phần tử mảng/object qua index luôn trả kiểu `T | undefined`, buộc xử lý trường hợp không tồn tại tường minh thay vì giả định luôn có.

### 6.2. Type Alias vs Interface — quy tắc chọn, không phải sở thích

Đã nêu ở mục 4.1 — nhắc lại dưới dạng quy tắc quyết định nhanh: **"Đây có phải object shape, có thể cần được `extends` không? → `interface`. Đây có phải union/intersection/tuple/mapped type không? → `type`."** Không trộn lẫn tùy hứng trong cùng 1 file (ví dụ Props dùng `type`, model domain dùng `interface`, ngược lại quy tắc) — vi phạm quy tắc này là điều kiện chặn ở Code Review (mục 15).

### 6.3. Generics

Generic chỉ dùng khi thực sự cần **tái sử dụng cùng 1 logic cho nhiều kiểu dữ liệu khác nhau** — không dùng generic "phòng xa" cho 1 hàm hiện tại chỉ có 1 kiểu dữ liệu cụ thể (vi phạm Simplicity/YAGNI, mục 2.2). Đặt tên theo quy tắc mục 4.1.

### 6.4. Discriminated Unions — mẫu bắt buộc cho state có nhiều "hình dạng"

Bất kỳ state nào có **hình dạng dữ liệu khác nhau tùy trạng thái** (ví dụ kết quả async: khi `loading` không có `data`, khi `error` không có `data` mà có `message`, khi `success` có `data` mà không có `message`) **bắt buộc** mô hình hóa bằng discriminated union với 1 field phân biệt chung (`status`/`type`), **không** dùng 1 interface phẳng với nhiều field optional (`data?`, `error?`, `isLoading?` cùng tồn tại) — cách phẳng cho phép tồn tại trạng thái vô nghĩa (`isLoading: true` nhưng vẫn có `data`) mà TypeScript không bắt được, còn discriminated union loại trừ trạng thái vô nghĩa ngay ở tầng kiểu dữ liệu. Áp dụng bắt buộc cho: `ApiError` variant theo `errorCode` (Architecture Spec §10.1), state async cục bộ khi không dùng TanStack Query mặc định.

### 6.5. Utility Types — dùng built-in trước khi tự định nghĩa

Ưu tiên tuyệt đối `Pick`/`Omit`/`Partial`/`Required`/`Readonly`/`Record` của TypeScript trước khi viết lại thủ công 1 type tương đương. Type domain (`BirthProfile`, `Chart`...) định nghĩa **1 lần duy nhất** ở nguồn (generate từ OpenAPI theo Architecture Spec §8.1, hoặc `model/types.ts` cho Frontend Model) — mọi biến thể (`BirthProfileFormValues`, `BirthProfileSummary`...) đều **suy ra** từ type gốc bằng Utility Type, không định nghĩa lại từ đầu (tránh 2 nguồn sự thật lệch pha khi type gốc đổi).

---

## 7. Styling Standards

### 7.1. TailwindCSS — token là nguồn duy nhất

Mọi class Tailwind sử dụng **class đã map tới Design Token** (mở rộng theme trong cấu hình Tailwind từ token registry — Design System Spec §2–§7), **cấm dùng Arbitrary Value** (`w-[17px]`, `text-[#C08A3E]`) trừ 1 ngoại lệ duy nhất: giá trị **tính toán động lúc runtime** không thể biết trước (ví dụ vị trí SVG trong `ChartWheel` phụ thuộc dữ liệu chart) — trường hợp này bắt buộc có comment giải thích tại sao token không áp dụng được.

### 7.2. Utility Ordering

Thứ tự class Tailwind trong `className` được chuẩn hóa **tự động** bằng `prettier-plugin-tailwindcss` (chạy trong pre-commit hook, mục 17) — không sắp xếp thủ công, không tranh luận thứ tự trong Code Review vì đã được công cụ quyết định.

### 7.3. Conditional Classes

Luôn dùng helper `cn()` (`shared/lib`, tổ hợp `clsx` + `tailwind-merge` hoặc tương đương — Architecture Spec §3.1) để ghép class có điều kiện — **cấm** nối chuỗi thủ công (`` `btn ${isActive ? 'btn-active' : ''}` ``), vì cách này không loại trùng class Tailwind xung đột (ví dụ 2 class `padding` khác giá trị) như `cn()` xử lý được.

### 7.4. CSS Variables

Component **không** tự khai báo biến CSS mới (`--my-custom-color`) — mọi biến CSS đều bắt nguồn từ token registry (`app/styles/tokens.css`, UI Spec §2). Nếu 1 component cần 1 giá trị chưa có token tương ứng, đây là câu hỏi thuộc Design System Governance (Design System Spec §17), không phải quyết định tự phát trong lúc code 1 component.

### 7.5. Tránh Inline Style

`style={{ ... }}` **cấm** trong mọi trường hợp trừ giá trị hình học tính toán runtime không biểu diễn được bằng class tĩnh (vị trí/kích thước SVG trong `ChartWheel`, `ElementChart` — cùng ngoại lệ đã nêu ở mục 7.1). Mọi trường hợp còn lại (kể cả "chỉ 1 style nhỏ, viết class ra vẻ dài dòng") đều dùng class Tailwind — nhất quán giúp DevTools/Code Review luôn nhìn thấy toàn bộ style ở 1 chỗ (`className`), không phải tìm ở 2 nơi khác nhau.

---

## 8. State Management Standards

> Lựa chọn công cụ theo loại state đã chốt ở Architecture Spec §7 — mục này là quy tắc **viết code** khi dùng từng công cụ.

### 8.1. Server State (TanStack Query)

- **Cấm** gọi `fetch`/Axios trực tiếp trong component hoặc trong `useEffect` — mọi truy cập Server State đi qua hook trong `features/*/hooks` (Architecture Spec §7.1).
- Query key luôn qua **Query Key Factory** đã định nghĩa (`features/*/hooks/query-keys.ts`) — cấm viết string key thủ công (`['chart', id]` rải rác) ở nơi gọi `useQuery`.
- `select` option dùng để derive dữ liệu hiển thị từ cache thay vì tính toán lại trong component mỗi render, khi phép biến đổi tốn kém hoặc dùng lại ở nhiều component đọc cùng 1 query.

### 8.2. Local State

`useState` là mặc định; chuyển sang `useReducer` khi **≥ 3 field state liên quan cùng thay đổi theo 1 hành động** (tránh gọi 3 `setState` liên tiếp cho 1 sự kiện logic duy nhất — dễ gây render trung gian không nhất quán). Không dùng `useReducer` "vì trông chuyên nghiệp hơn" cho state đơn giản chỉ 1-2 field độc lập.

### 8.3. Context

Chỉ dùng cho state **không phải Server State**, phạm vi **hẹp, có chủ đích** (đúng hướng đã thống nhất ở Architecture Spec §7.2/OpenQuestion đã chốt — thử Context trước khi thêm Zustand store mới) — Context Provider đặt **càng gần** nơi cần dùng càng tốt (trong `ChartDetailPage`, không đẩy lên `app/providers` nếu chỉ 1 page cần). Không dùng Context để tránh prop drilling cho state chỉ 2 cấp component (mục 5.4 — 2 cấp vẫn chấp nhận truyền prop trực tiếp).

### 8.4. Zustand (hiện tại: `authStore`/`uiStore`/`preferenceStore`, Architecture Spec §7.3)

- Component đọc store qua **selector hẹp nhất có thể** (`useAuthStore((s) => s.status)`), không lấy nguyên object store rồi destructure trong component (cách này khiến component re-render mỗi khi *bất kỳ* field nào trong store đổi, kể cả field không dùng tới).
- Hành động ghi state (`login()`, `setTheme()`...) luôn là 1 hàm được định nghĩa **trong chính store**, không phải component tự gọi `setState` trực tiếp với object literal — giữ logic thay đổi state tập trung, dễ trace.
- **Không** tạo store thứ 4 trở lên mà không qua đúng quy trình đã thống nhất (thử Context trước, chỉ nâng cấp khi đo được re-render thừa — Architecture Spec §16 OQ5).

### 8.5. Form State (React Hook Form)

- Mọi form **≥ 2 field** dùng React Hook Form — form 1 field đơn giản (ví dụ ô tìm kiếm) có thể dùng `useState` thuần, không bắt buộc RHF.
- Validation schema (Zod) định nghĩa **1 lần** trong `features/*/model/schema.ts`, dùng chung cho cả `resolver` của RHF lẫn bất kỳ validate thủ công nào khác — không định nghĩa lại rule validation ở 2 nơi.
- Component chỉ dùng **Controlled Component** thông qua `Controller`/`register` của RHF — không tự quản lý `useState` song song cho cùng 1 field đã nằm trong RHF (2 nguồn sự thật cho cùng 1 giá trị).

---

## 9. API Integration Standards

### 9.1. Generated Types

File type generate từ OpenAPI (`shared/types/`, Architecture Spec §8.1) là **read-only theo quy ước** — không sửa tay bất kỳ dòng nào trong các file này, kể cả sửa tạm để qua lỗi type gấp. Nếu type generate sai/thiếu, sửa ở nguồn (OpenAPI Spec, phối hợp Backend) rồi regenerate — sửa tay sẽ mất khi chạy lại `openapi-typescript`.

### 9.2. DTO Mapping

- Hàm map (`model/mapper.ts`, Architecture Spec §8.4) là **pure function bắt buộc** — không side-effect (không gọi API khác, không đọc store) bên trong mapper.
- 1 hàm map = 1 hướng chuyển đổi rõ ràng, đặt tên thể hiện hướng: `toBirthProfileModel(dto)` (DTO → Model), không đặt tên mơ hồ như `transformProfile()`.
- Chỉ map field thực sự cần biến đổi hình dạng (Architecture Spec §8.4 nguyên tắc "chỉ map khi có lý do") — field giữ nguyên tên/kiểu copy thẳng, không viết lại từng field 1 cách máy móc "cho đủ bộ".

### 9.3. API Services (`features/*/api/`)

- 1 file = 1 resource (ví dụ `birth-profile.api.ts` chứa toàn bộ hàm CRUD cho `/birth-profiles`) — không gộp nhiều resource không liên quan vào 1 file "cho gọn".
- Hàm trong `api/` chỉ gọi HTTP client (`shared/api/client.ts`) và trả Promise DTO thô — **không** xử lý loading state, không catch lỗi để hiển thị UI (đó là việc của hook, mục 9.4) — giữ lớp này "câm" đúng như Architecture Spec §8.3 đã định.

### 9.4. Custom Hooks (`features/*/hooks/`)

Mỗi hook bọc đúng **1 query hoặc 1 mutation** — không viết 1 hook "tổng hợp" gọi nhiều query/mutation khác nhau bên trong rồi trả về gộp tất cả (khó test, khó biết hook đang gây bao nhiêu network request). Nếu 1 component thực sự cần nhiều nguồn dữ liệu, component đó gọi nhiều hook riêng biệt, tự phối hợp — không đẩy trách nhiệm phối hợp vào 1 "super hook".

### 9.5. Error Handling ở tầng API

Mọi hook bắt lỗi phải làm việc với `ApiError` đã chuẩn hóa (interceptor, Architecture Spec §10.1) — **cấm** try/catch bắt lỗi Axios thô (`error.response.data...`) ở bất kỳ đâu ngoài chính interceptor đó; nếu 1 hook cần xử lý lỗi khác hành vi mặc định, nó override `onError` nhận `ApiError` đã được chuẩn hóa sẵn, không tự parse lại response gốc.

---

## 10. Error Handling

### 10.1. RFC7807

Không code nào ngoài `shared/api/client.ts` (interceptor duy nhất, Architecture Spec §10.1) được phép đọc trực tiếp field thô của response lỗi (`error.response.data.detail`...) — mọi nơi khác chỉ thao tác với class `ApiError` đã chuẩn hóa. Vi phạm quy tắc này (bắt gặp `error.response` ở bất kỳ file nào ngoài interceptor) là lỗi chặn merge.

### 10.2. Error Boundaries

Chỉ đặt Error Boundary ở đúng 2 vị trí đã quy định (Root, Route-level — Architecture Spec §10.3) — **cấm** thêm Error Boundary tùy tiện quanh 1 component con bất kỳ "cho chắc". Nếu 1 component thực sự cần cô lập lỗi cục bộ (không muốn 1 lỗi nhỏ crash cả page), ưu tiên xử lý bằng trạng thái dữ liệu (`isError` từ TanStack Query) trước khi cân nhắc thêm 1 Error Boundary mới — thêm boundary mới là thay đổi kiến trúc, không phải quyết định cục bộ khi code 1 feature.

### 10.3. User-facing Errors

Thông báo lỗi hiển thị cho người dùng **luôn** tra qua từ điển `error-messages` (Architecture Spec §10.5) theo `errorCode` — **cấm** hiển thị trực tiếp field `detail`/`title` thô từ response (thường là tiếng Anh kỹ thuật, không phù hợp UX tiếng Việt, UI Spec §1.4). `errorCode` chưa có trong từ điển dùng message fallback chung, không throw crash vì thiếu bản dịch (Architecture Spec §10.5) — nhưng bắt buộc log lại `errorCode` lạ đó (qua `report-error.ts`, mục 10.4) để bổ sung dịch, không để âm thầm trôi qua.

### 10.4. Logging

- **Cấm `console.log` còn sót lại trong code merge vào `main`/`dev`** — ESLint rule `no-console` bật ở mức `error`, chỉ cho phép `console.warn`/`console.error` (và chỉ nên dùng khi chưa qua `report-error.ts`, tức là trường hợp cực hiếm).
- Mọi lỗi cần ghi nhận (không phải lỗi user-facing thông thường đã có Toast/Alert) đều qua `shared/lib/report-error.ts` (điểm cắm Sentry, Architecture Spec §10.6) — không gọi trực tiếp SDK Sentry rải rác trong code feature.

---

## 11. Accessibility Standards

### 11.1. Semantic HTML — luật ưu tiên số 1

Trước khi viết `<div>`/`<span>` + `onClick`, luôn tự hỏi: có phần tử HTML ngữ nghĩa gốc nào làm đúng việc này không (`<button>`, `<a>`, `<input>`...)? — chỉ dùng `<div>` tương tác khi thực sự không có phần tử gốc tương đương, và khi đó bắt buộc bổ sung `role`/`tabIndex`/keyboard handler tương đương đầy đủ (thực thi cụ thể "First Rule of ARIA" đã chốt ở Design System Spec §14.4).

### 11.2. Keyboard Support

- Mọi phần tử tương tác đạt được bằng `Tab` theo đúng thứ tự đọc tự nhiên của DOM — **cấm** `tabIndex` dương (`tabIndex={1}`, `{2}`...) vì phá vỡ thứ tự tự nhiên và cực khó bảo trì khi thêm phần tử mới; chỉ dùng `tabIndex={0}` (thêm vào focus order tự nhiên) hoặc `tabIndex={-1}` (loại khỏi Tab nhưng vẫn focus được bằng code, dùng khi quản lý focus thủ công).
- Mọi handler `onClick` trên phần tử không phải `<button>`/`<a>` gốc phải có `onKeyDown` xử lý tương đương `Enter`/`Space` đi kèm — không có ngoại lệ.

### 11.3. Focus Management

Sau bất kỳ hành động nào làm biến mất phần tử đang focus (đóng Modal, xóa item, chuyển route), code **bắt buộc chủ động** gọi `.focus()` vào phần tử kế tiếp hợp lý — không dựa vào hành vi mặc định của trình duyệt (thường đưa focus về `<body>`, mất hoàn toàn ngữ cảnh cho người dùng bàn phím/screen reader). Đây là dòng code review sẽ tìm kiếm cụ thể ở mọi PR có Modal/Drawer/danh sách xóa được (mục 15).

### 11.4. ARIA

- Không thêm `role`/`aria-*` lên phần tử HTML gốc **đã có role ngầm định đúng** (ví dụ không thêm `role="button"` lên `<button>` — thừa và có thể gây xung đột nếu trình duyệt/screen reader xử lý khác nhau).
- Khi implement 1 ARIA Pattern phức tạp (Tabs/Accordion/Menu/Combobox, UI Spec §9.5–9.6), bám sát đúng cấu trúc role/thuộc tính của [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) cho đúng pattern đó — không tự sáng tạo cấu trúc ARIA riêng dù "có vẻ" tương đương.

---

## 12. Performance Guidelines

### 12.1. Lazy Loading

Mọi component trong `pages/` bọc `React.lazy()` tại khai báo route (Architecture Spec §5.2) — **không** import tĩnh page component ở bất kỳ đâu khác ngoài `app/router.tsx` (import tĩnh 1 page ở nơi khác sẽ vô hiệu hóa code splitting của chính page đó dù route đã khai báo lazy).

### 12.2. Memoization

Xem mục 5.5 (đã nêu quy tắc viết code) — bổ sung 1 quy tắc review: PR thêm `useMemo`/`useCallback` **phải giải thích trong PR description lý do đo được** (hoặc rơi vào đúng 4 trường hợp đã liệt kê ở Architecture Spec §11.1) — memoization không có lý do rõ ràng bị coi là code thừa, không phải "phòng ngừa vô hại" (thêm dependency array sai còn nguy hiểm hơn không memo).

### 12.3. Code Splitting

Ngoài route-level (mục 12.1), component **> 40KB gzip ước tính** hoặc phụ thuộc thư viện nặng dùng không thường xuyên (ngưỡng đã đặt ở Architecture Spec §5.2) tách lazy độc lập bằng `React.lazy()` ngay tại nơi component đó được dùng lần đầu trong cây component, kèm `Suspense` fallback là `Skeleton` tương ứng (không phải `Spinner` chung chung, UI Spec §18.2).

### 12.4. Image Optimization

`<img>` luôn có `loading="lazy" decoding="async"` **mặc định**, trừ ảnh nằm trong viewport đầu tiên (above-the-fold, ví dụ ảnh hero Landing Page) — nơi dùng `loading="eager"` tường minh (không để mặc định trình duyệt tự quyết, ghi rõ ý định bằng attribute).

---

## 13. Testing Standards

### 13.1. Unit Test

- Áp dụng cho hàm thuần trong `shared/lib`, `features/*/lib`, `features/*/model/mapper.ts`.
- Cấu trúc **AAA** (Arrange — Act — Assert), mỗi `it()` chỉ assert **1 hành vi** — test kiểm nhiều hành vi không liên quan trong 1 `it()` khi fail không cho biết ngay hành vi nào hỏng.

### 13.2. Component Test

- Query phần tử theo **thứ tự ưu tiên chuẩn của Testing Library**: `getByRole` → `getByLabelText` → `getByText` → `getByTestId` (cuối cùng, chỉ khi 3 cách trên thực sự không khả thi) — ưu tiên `getByRole`/`getByLabelText` vì test theo cách này đồng thời xác nhận luôn component accessible (mục 11), không tách rời 2 mối quan tâm.
- Không test chi tiết implementation nội bộ (state, method riêng tư) — chỉ test **hành vi quan sát được từ bên ngoài** (render ra gì, gọi callback gì khi tương tác).

### 13.3. Mocking

Toàn bộ mock network qua **MSW**, đặt trong `features/*/api/mocks/handlers.ts` (Architecture Spec §14.4) — không mock trực tiếp hàm `api/*.ts` bằng `vi.mock()` cho Component/Integration Test (mock ở tầng HTTP thực tế hơn, phát hiện được cả lỗi tầng mapping/serialize mà mock hàm trực tiếp bỏ sót).

### 13.4. Test Naming

- Tên file: `ComponentName.test.tsx` / `useHookName.test.ts` (đã chốt UI Spec §22).
- `describe()` block = tên component/hook/hàm đang test, không mô tả thêm.
- `it()`/`test()` block viết dạng **"should [kết quả mong đợi] when [điều kiện]"** — ví dụ `it('should show error text when email is invalid')`, không viết mô tả chung chung như `it('works correctly')`.

### 13.5. Folder Structure

Co-located theo Architecture Spec §14.1 — test nằm cạnh code nó kiểm tra, ngoại lệ duy nhất là E2E (`e2e/` cấp root). Không tạo `__tests__/` song song bất kỳ đâu trong `src/`.

---

## 14. Import Rules

### 14.1. Absolute Imports — mặc định bắt buộc

Mọi import **giữa các tầng khác nhau** (`pages` gọi `features`, `features` gọi `shared`...) dùng path alias tuyệt đối (`@features/auth`, `@shared/ui`, đã cấu hình `tsconfig.json` — Architecture Spec §3.1) — **cấm** import tương đối xuyên tầng (`../../../shared/ui/Button`).

### 14.2. Relative Imports — chỉ trong phạm vi hẹp

Import tương đối (`./`, `../`) chỉ chấp nhận **trong cùng 1 component/feature folder**, tối đa 1 cấp `../` (ví dụ từ `components/LoginForm.tsx` import `../model/schema`) — cần đi sâu hơn 1 cấp `../` là dấu hiệu file đang import sai tầng, nên dùng alias tuyệt đối thay thế.

### 14.3. Barrel Exports

Xem mục 4.2 (wildcard export bị cấm). Bổ sung: import từ 1 feature/entity khác **luôn qua `index.ts` public API** của nó (`@features/auth` chứ không `@features/auth/hooks/useLogin` đào sâu vào nội bộ) — trừ khi chính code đó **ở trong** feature/entity đó (import nội bộ giữa các file cùng 1 feature không bắt buộc qua barrel, dùng path tương đối mục 14.2).

### 14.4. Dependency Direction — enforce bằng công cụ

Hướng phụ thuộc 1 chiều (`app → pages → widgets → features → entities → shared`, Architecture Spec §2.2) được enforce dần bằng ESLint (`eslint-plugin-boundaries`, kích hoạt theo ngưỡng Architecture Spec §4.7/§16) — cho tới khi kích hoạt, **mọi import vi phạm hướng này bị coi là lỗi Code Review nghiêm trọng** (mục 15), không đợi tooling mới xử lý.

### 14.5. Thứ tự Import trong 1 file

Nhóm theo thứ tự cố định, cách nhau 1 dòng trống, sort alphabet trong từng nhóm (tự động qua ESLint `import/order` + Prettier): (1) thư viện bên ngoài (`react`, `zod`...), (2) alias tuyệt đối nội bộ theo tầng xa→gần (`@shared` → `@entities` → `@features` → `@widgets`), (3) import tương đối cùng thư mục, (4) import type (`import type { ... }`, tách riêng khỏi import giá trị).

---

## 15. Code Review Checklist

> Checklist **bắt buộc** trước khi merge bất kỳ PR nào vào `dev`/`main`. Một mục không đạt = **không merge**, không có ngoại lệ "merge trước, sửa sau" trừ khi mục đó được ghi nhận tường minh thành Technical Debt (mục 16) kèm lý do chính đáng.

- [ ] **Build & Type-check**: `tsc --noEmit` sạch, không dùng `any`/`@ts-ignore` không giải thích (mục 6.1).
- [ ] **Lint**: 0 lỗi ESLint, bao gồm `no-console` (mục 10.4), `react-hooks/exhaustive-deps` (mục 5.5), `import/order` (mục 14.5).
- [ ] **Ranh giới tầng**: không import ngược hướng (mục 14.4), không import đào sâu qua barrel (mục 14.3).
- [ ] **Token compliance**: không hardcode màu/spacing/radius/shadow, không Tailwind Arbitrary Value ngoài ngoại lệ đã nêu (mục 7.1).
- [ ] **Naming**: đúng quy ước mục 4 và UI Spec §22 (kiểm bằng mắt, chưa có lint rule cho toàn bộ).
- [ ] **Accessibility**: đạt baseline mục 11 — test bàn phím thủ công cho bất kỳ phần tử tương tác mới nào; component mới trong `shared/ui`/`entities/astrology` có Accessibility Test (`vitest-axe`, Design System Spec §16.3).
- [ ] **Test**: có Unit/Component Test tương ứng thay đổi (mục 13); không giảm coverage hiện có mà không giải thích.
- [ ] **Error Handling**: lỗi API đi qua `ApiError` chuẩn hóa (mục 10.1), không hiển thị `detail` thô cho người dùng (mục 10.3).
- [ ] **Performance**: không thêm `useEffect` fetch data thủ công thay vì TanStack Query (mục 8.1); ảnh mới có `loading="lazy"` nếu không above-the-fold (mục 12.4).
- [ ] **Không còn code chết**: không `console.log` debug, không code comment-out để đó, không import không dùng.
- [ ] **Tài liệu liên quan cập nhật** nếu PR ảnh hưởng (mục 18).

---

## 16. Technical Debt Policy

### 16.1. `TODO`

Dùng khi có việc cần làm **nhưng không chặn merge hiện tại** (ví dụ tối ưu sau khi có số liệu thật). Định dạng bắt buộc: `// TODO(<tên>): <mô tả ngắn gọn việc cần làm>` — luôn gắn tên người ghi (dù hiện tại chỉ có 1 developer, giữ thói quen để không phải đổi convention khi có thêm người). Nếu việc đó đã có issue/task tracking, thêm tham chiếu: `// TODO(<tên>, #<issue>): ...`.

### 16.2. `FIXME`

Mức nghiêm trọng hơn `TODO` — đánh dấu code **biết là sai/chưa đúng nhưng tạm chấp nhận được**. Quy tắc khác biệt quan trọng: `FIXME` trong code **mới viết ở PR hiện tại** là lý do **chặn merge** (nếu biết sai, sửa luôn trước khi merge, không đẩy sang tương lai) — `FIXME` chỉ được để lại khi phát hiện trong code **đã tồn tại từ trước**, không thuộc phạm vi PR hiện tại, và việc sửa ngay sẽ làm PR phình to ngoài mục đích ban đầu.

### 16.3. Deprecated Code

Đánh dấu bằng JSDoc `@deprecated <lý do> — dùng <thay thế> thay vì` phía trên export bị deprecate — nhất quán với Migration Note đã yêu cầu ở Design System Spec §17.3 cho token/component. Code deprecated giữ hoạt động tối thiểu 1 chu kỳ `MINOR` (Design System Spec §16.5–16.6) trước khi xóa hẳn.

### 16.4. Refactoring Policy

- **Boy Scout Rule** (dọn dẹp nhỏ khi tiện tay sửa code gần đó) áp dụng cho thay đổi **cục bộ, không đổi hành vi** (đổi tên biến rõ nghĩa hơn, tách 1 hàm quá dài trong lúc đang sửa file đó vì lý do khác).
- Refactor **lớn** (đổi cấu trúc thư mục, đổi API public của 1 feature/component, đổi pattern xuyên nhiều file) **luôn tách PR riêng**, không gộp chung với PR tính năng — PR gộp cả 2 khiến review không thể tách bạch "thay đổi hành vi" khỏi "thay đổi hình thức", rủi ro bỏ sót bug thật trong đống diff refactor.

---

## 17. Git Standards

### 17.1. Kế thừa từ Backend Coding Standards

AstroViet đã có **1 quy ước Git áp dụng toàn dự án** (Backend Coding Standards, đã đóng băng) — Frontend **tuân thủ nguyên vẹn định dạng commit message** (`[tag] mô tả ngắn` — ví dụ `[feat] ...`, `[refactor] ...`, không phải Conventional Commits `feat: ...`) và quy ước đặt tên branch, không định nghĩa lại. Về mặt công cụ, repo **không phải 1 workspace monorepo thật** (không có `package.json`/`workspaces` ở root) — mỗi package (`backend/`, `frontend/`) có **Husky + lint-staged hoàn toàn độc lập** của riêng nó, không có hook nào ở root để "mở rộng". `frontend/.husky/pre-commit` chạy `lint-staged` riêng (ESLint + `prettier-plugin-tailwindcss`, mục 7.2) khi commit chạm file trong `frontend/`, độc lập hoàn toàn với `backend/.husky/`.

### 17.2. Yêu cầu bổ sung riêng cho Frontend

Ngoài quy ước dùng chung, Frontend có thêm 2 kỳ vọng không áp dụng cho Backend (do bản chất PR có thay đổi thị giác):

- **PR thay đổi UI có thể quan sát được** (component mới, đổi layout, đổi trạng thái hiển thị) đính kèm ảnh chụp màn hình hoặc GIF ngắn trong PR description — review thị giác không thể chỉ đọc diff code.
- **PR thêm/sửa component trong `shared/ui`/`entities/astrology`** ghi rõ trong description đã đối chiếu đủ 6 tiêu chí Component Lifecycle Review (Design System Spec §16.3) hay chưa — không bắt buộc phải paste toàn bộ checklist, chỉ cần xác nhận đã tự kiểm tra.

### 17.3. Kích thước PR

Giữ PR đủ nhỏ để review trong 1 lần ngồi (khuyến nghị thực tế, không phải luật cứng bằng số dòng) — 1 PR = 1 mối quan tâm hoàn chỉnh (1 component, 1 use-case của 1 feature), không gộp nhiều mối quan tâm không liên quan chỉ vì "tiện đang mở file".

---

## 18. Documentation Standards

### 18.1. README

Cập nhật `frontend/README.md` bất kỳ khi nào: thêm biến môi trường mới (`shared/config/env.ts`), đổi lệnh setup/chạy dự án, thêm dependency có ảnh hưởng cách người mới bắt đầu (ví dụ thêm bước generate type từ OpenAPI, Architecture Spec §8.5). README được coi là tài liệu **onboarding**, không phải nơi ghi chi tiết kỹ thuật (chi tiết thuộc 4 tài liệu nền tảng) — chỉ đủ để 1 người mới clone repo và chạy được project.

### 18.2. Storybook (tương lai)

Khi Storybook được thiết lập (roadmap đã có, theo tài liệu tổng dự án — sau khi Design System code hóa xong Phase 1): mọi component mới trong `shared/ui` **bắt buộc** có 1 Story tương ứng trước khi coi là hoàn thành (điều kiện bổ sung vào Component Lifecycle Review, Design System Spec §16.3, có hiệu lực từ khi Storybook sẵn sàng — hiện tại chưa bắt buộc vì công cụ chưa tồn tại).

### 18.3. Cập nhật ngược lại 4 tài liệu nền tảng

Bất kỳ PR nào phát sinh 1 quyết định **mâu thuẫn hoặc mở rộng** UI Spec / Architecture Spec / Design System Spec / chính tài liệu này — PR đó **phải cập nhật tài liệu tương ứng trong cùng PR**, không tách PR tài liệu riêng làm "sau" (nguyên tắc Single Source of Truth đã tuyên bố nhất quán ở cả 3 tài liệu trước) — cụ thể: thêm token mới → cập nhật UI Spec §2 + Design System Spec liên quan; đổi ranh giới tầng → cập nhật Architecture Spec §2–4; thêm quy ước code mới lặp lại ≥ 2 lần → cân nhắc bổ sung vào chính tài liệu Coding Standards này (qua cùng cơ chế versioning đã áp dụng cho token, Design System Spec §16.5).

---

*Hết tài liệu. Frontend Coding Standards này, cùng Frontend UI Specification, Frontend Architecture Specification, và Design System Specification, tạo thành bộ bốn tài liệu nền tảng đầy đủ của AstroViet Frontend — sẵn sàng cho giai đoạn bootstrap code.*
