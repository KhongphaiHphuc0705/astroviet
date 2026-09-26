# Sprint F3 — M3 Implementation Plan: Form Component & Validation

**Lập ngày:** 2026-09-25
**Trạng thái:** Implementation Plan only — chưa viết code

## 1. Objective

Xây `frontend/src/features/birth-profile/ui/BirthProfileForm/` — form dùng chung `create`/`edit`, validate client-side bằng Zod (bao gồm INV-BP1 qua `.superRefine`), tích hợp location search có debounce, map đúng giữa form state (nested) và API contract (nested request / flat response). Không chứa Chart domain logic, không tự mutate/navigate/toast — chỉ nhận `onSubmit` callback.

## 2. Current Repository Audit

### 2.1 Existing Birth Profile implementation (M1 + M2, đã CLOSED, xác nhận trên `origin/dev`)

- `features/birth-profile/api/types.ts`: `BirthProfile` (response, **flat** — có `label` bắt buộc + `fullName` optional/nullable, tách biệt nhau; địa điểm là 4 field phẳng `placeName/latitude/longitude/historicalTimezoneId`); `CreateBirthProfileInput`/`UpdateBirthProfileInput` (request, `birthLocation` **nested**, kiểu `BirthLocationInput = LocationSuggestion`); `LocationSuggestion` (không có `id`).
- `features/birth-profile/hooks/useLocationSearchQuery.ts`: nhận `{query, date, enabled?}`, tự debounce 300ms qua `shared/hooks/useDebounce`, `enabled` gate cứng theo `Boolean(date) && debouncedQuery.trim().length>=2`. **M3 tái dùng hook này y nguyên, không viết lại debounce/gating logic trong form.**
- Chưa có `features/birth-profile/ui/`, `model/`, `mocks/` (top-level) nào tồn tại — `find` xác nhận `features/birth-profile/` hiện chỉ có `api/` và `hooks/`.
- `useCreateBirthProfileMutation`/`useUpdateBirthProfileMutation` (M2) nhận input đúng khớp `CreateBirthProfileInput`/`{id, input: UpdateBirthProfileInput}` — **form không tự gọi các hook này** (đúng ranh giới Submit Boundary, mục 12 prompt gốc); trang/container (milestone sau) sẽ nối `onSubmit` với các mutation này.

### 2.2 Existing form infrastructure (F1/F2, xác nhận trực tiếp từ source)

- `useZodForm(schema, options?)` (`shared/hooks/useZodForm.ts`): wrapper mỏng quanh `useForm` của React Hook Form, cố định `resolver: zodResolver(schema)`, `mode: "onBlur"`, `reValidateMode: "onChange"`. **Không sửa file này** (đúng constraint mục 17).
- `formFields.ts` (`shared/lib/formFields.ts`):
  - `getInputFieldProps(name, form, registerOptions?)` → trả `{...register(name, registerOptions), error: string | undefined}` để spread thẳng vào `<Input>`. Tham số thứ 3 `registerOptions` là **passthrough nguyên vẹn của RHF `RegisterOptions`** — hỗ trợ cả `onChange` tùy biến chạy song song với cơ chế nội bộ của RHF (đã có tiền lệ dùng cho `setValueAs` ở form Register của F2). **M3 tận dụng chính extension point này** cho yêu cầu "đổi `birthDate` → xóa `birthLocation` đã chọn" (mục 7).
  - `getCheckboxFieldProps(name, form)` → chỉ trả `register(name)`, **không có `error`** — comment trong code xác nhận rõ: "Checkbox has no `error` prop — the form is responsible for rendering error text below the checkbox".
  - `useSelectField(name, control)` → wiring qua `useController` cho field có giá trị composite/không phải native DOM event (dùng cho `Select`). **Đây là pattern tham chiếu cho field `birthLocation`** (mục 5, 8) — vì `birthLocation` cũng là giá trị composite (object), không phải input text đơn thuần.
- `Input` (`shared/ui/Input`): prop lỗi tên là **`error?: string | boolean`**, KHÔNG PHẢI `errorText` — xem Decision Log 2.5.
- `Checkbox` (`shared/ui/Checkbox`): không có prop `error`/`helperText` (có TODO trong code xác nhận: "Thêm error/helperText prop cho Checkbox khi có >= 2 form thật cần dùng" — birth-profile sẽ là form thứ 2 nhưng M3 **không sửa Checkbox** để tránh phình phạm vi, xem mục 6).
- `Button`: có `isLoading` prop (đúng spec §12.1 dòng "Loading: submit button isLoading, disable toàn form").
- `usePosition(triggerRef, isOpen)` (`shared/hooks/usePosition.ts`): tiện ích positioning generic, đang được `Select` dùng cho dropdown của nó. **Tái dùng cho dropdown gợi ý địa điểm** — không viết positioning logic mới.
- **Không tồn tại** `Combobox`/`Autocomplete`/`Progress`/`Pagination` trong `shared/ui/` (đã liệt kê đầy đủ: Alert, Avatar, Badge, Button, Card, Checkbox, Container, Divider, Grid, Input, Label, Modal, Radio, Section, Select, Skeleton, SkipLink, Spinner, Stack, Switch, Textarea) — dù cả `Progress` lẫn `Pagination` **đã được đặc tả** ở UI Spec §9.3. Đây là gap kế thừa từ F1 (cùng loại với gap `useDebounce` đã phát hiện ở M2), không phải lỗi M3.
- **Chưa từng có tiền lệ `features/*/ui/` trong codebase.** `features/auth` không có thư mục `ui/` — form Login/Register nằm thẳng trong `pages/auth/login/page.tsx`/`pages/auth/register/page.tsx` (xác nhận `grep useZodForm` ra kết quả trực tiếp trong các file `page.tsx`, không có component form riêng nào tách ra). **M3 là component `features/*/ui/` đầu tiên của dự án** — không có convention thật để "theo", chỉ có kiến trúc 4 tầng đã spec ở Frontend Architecture Specification §9 làm căn cứ.

### 2.3 Existing API contract (M1, đối chiếu lại `openapi.json` — không suy diễn)

- `POST /api/v1/birth-profiles`: `birthLocation` **bắt buộc**, toàn bộ 4 field con bắt buộc.
- `PATCH /api/v1/birth-profiles/{id}`: mọi field top-level optional; `birthLocation` nếu có thì **toàn bộ 4 field con bắt buộc cùng lúc** (không partial được chính nó).
- `GET /api/v1/locations/search?q=&date=`: `q` tối thiểu 2 ký tự, `date` bắt buộc — khớp đúng gate đã cứng trong `useLocationSearchQuery` (mục 2.1).
- **INV-BP1**: `isBirthTimeKnown=false ⟺ birthTime=null`, backend chỉ tự null hóa `birthTime` khi PATCH **thiếu hẳn** field đó (đã xác nhận ở M1) — form không dựa vào hành vi này, luôn tự đảm bảo tính nhất quán trước khi gửi (mục 6).

### 2.4 Existing tests (tham chiếu style, không phải nguồn business logic)

- `pages/auth/register/page.test.tsx`: có sẵn pattern `vi.useFakeTimers({shouldAdvanceTime:true})` + `userEvent.setup({advanceTimers: vi.advanceTimersByTime})` — **M3 tái dùng đúng pattern này** cho test debounce của location search trong form (đã dùng lại y hệt ở M2 cho `useDebounce`/`useLocationSearchQuery`).
- Chưa có test nào cho `features/birth-profile/ui/` (thư mục chưa tồn tại).

### 2.5 Relevant architecture constraints & Decision Log (discrepancy đã phát hiện)

| # | Discrepancy | Nguồn xung đột | Quyết định |
|---|---|---|---|
| D1 | UI Spec §12.1 dòng Error ghi **"Input errorText"**; prompt M3 cũng lặp lại y hệt (AC9, §13) | Component `Input` thật có prop tên **`error`**, không phải `errorText` (xác nhận cả ở `InputProps` lẫn `getInputFieldProps`'s return type) | Theo **code thật** (ưu tiên cao hơn spec theo đúng nguyên tắc "code + frozen architecture + backend contract là evidence"). Toàn bộ plan dùng `error`, không dùng `errorText`. Ghi nhận đây là lỗi đánh máy kế thừa trong UI Spec, không sửa spec (ngoài phạm vi M3). |
| D2 | UI Spec §800 mô tả `Alert warning` bắt buộc khi giờ sinh trống, giải thích ảnh hưởng Ascendant/House | **OQ-1 đã được Phuc Hoang chốt tường minh**: "Form không chứa Chart-specific business logic hoặc Ascendant/House warning. Chart context sẽ cung cấp warning riêng khi Chart creation được triển khai." | Theo **quyết định OQ-1** (cụ thể hơn, mới hơn, do chính chủ dự án xác nhận trực tiếp — không phải suy diễn). M3 **không** implement Alert cảnh báo Ascendant/House. Spec §12.1 nên được cập nhật khi Chart module thật sự triển khai warning riêng của nó — ngoài phạm vi M3. |
| D3 | UI Spec §799 mô tả field "Nơi sinh" là `Select searchable`; §563 spec riêng 1 component `Progress` cho thanh tiến độ 2 bước | Không có `Combobox`/`SearchableSelect`/`Progress` nào tồn tại trong `shared/ui/` | M3 **không** tạo `shared/ui/Progress` hay `shared/ui/Combobox` mới (tránh premature abstraction — chỉ 1 nơi dùng). Xây 2 phần này là **composition cục bộ trong `BirthProfileForm/`**: dropdown gợi ý dùng `Input` + `usePosition` + `role="combobox"`/`role="listbox"` (theo đúng pattern ARIA `Select` đã có, tái dùng `usePosition` trực tiếp); chỉ báo bước dùng 1 dòng text "Bước X/2" + `fieldset`/`legend` (đã đủ đáp ứng yêu cầu accessibility §801), không dựng thanh progress bar đồ họa đầy đủ. Ghi nhận `shared/ui/Progress`/`Pagination` là gap Design System kế thừa, không thuộc M3. |
| D4 | UI Spec §802 yêu cầu input native (`type="date"`/`type="time"`) trên mobile, custom calendar/Select popover trên desktop | Không có `useMediaQuery` hay bất kỳ hook responsive-switching nào tồn tại (cùng loại gap với `useDebounce` trước khi M2 xây) | M3 dùng **native `<input type="date">`/`type="time"` cho mọi kích thước màn hình** (qua `Input` với `type` tương ứng) — bỏ qua nhánh "custom calendar popover desktop" để tránh biến M3 thành dự án xây thêm 1 hook responsive + 1 calendar component mới (đúng cảnh báo "M3 không biến thành mini-project" ở mục 25 prompt gốc). Đánh dấu **Decision Log**, không phải Open Question chặn — đây là quyết định chủ động ưu tiên phạm vi hẹp, có thể nâng cấp sau. |
| D5 | UI Spec §799 liệt kê field bước 1 là "Tên hồ sơ, Ngày/Giờ sinh, checkbox" — không nhắc `fullName` | Backend/M1 `CreateBirthProfileInput` có `fullName` optional/nullable, là field thật, tách biệt `label` | **Quyết định**: đưa `fullName` vào form như 1 input optional ở bước 1 (ngay dưới `label`) — không đưa vào coi là bỏ phí 1 field API thật đã có, rủi ro thấp vì optional/nullable, không ảnh hưởng luồng submit. Đây là quyết định chủ động (Pre-Implementation Decision), không chặn code. |

## 3. Scope

### In Scope
- `BirthProfileForm` component: 2 bước (Thông tin cơ bản → Nơi sinh), `mode: "create" | "edit"`, `defaultValues?`, `onSubmit(values)`.
- Zod schema riêng (`schema.ts`) với `.superRefine` cho INV-BP1.
- Mapper 2 chiều: `BirthProfile` (flat response) ↔ `BirthProfileFormValues` (nested) — chỉ dùng cho `edit` (khởi tạo `defaultValues`); chiều form→API do container/page gọi (form chỉ trả `BirthProfileFormValues` qua `onSubmit`, không tự gọi `createBirthProfile`/`updateBirthProfile`).
- Location search UI: input + dropdown gợi ý, dùng `useLocationSearchQuery` (M2) nguyên trạng.
- Toggle "Không rõ giờ sinh" (Case A/B, mục 7 prompt gốc).
- Birth date → location staleness (mục 10 prompt gốc / OQ-2 đã chốt).
- Component test đầy đủ theo ma trận mục 13.

### Out of Scope
- Chart/Swiss Ephemeris/Ascendant/House/Interpretation (không import, không tính toán, không cảnh báo domain).
- Mutation thật (`useCreateBirthProfileMutation`/`useUpdateBirthProfileMutation`) — form chỉ nhận `onSubmit` callback từ container.
- Navigation, toast, query invalidation.
- Trang `/app/profiles/new`, `/app/profiles/:id/edit` (milestone UI sau, theo master plan).
- `shared/ui/Progress`, `shared/ui/Combobox`, `useMediaQuery` (xem Decision Log D3/D4).
- Sửa `Checkbox` để thêm `error` prop (xem mục 6).
- E2E Playwright (đúng constraint mục 16 prompt gốc).

## 4. Architecture & Data Flow

```
UI (BirthProfileForm.tsx)
  ↓ useZodForm(birthProfileFormSchema)           ← RHF sở hữu local form state
  ↓ getInputFieldProps / getCheckboxFieldProps / useController(birthLocation)
Form State (BirthProfileFormValues, nested birthLocation)
  ↓ submit → zodResolver validate (đồng bộ .superRefine INV-BP1)
Submit Boundary
  ↓ onSubmit(values: BirthProfileFormValues)      ← form KHÔNG tự map sang API request
Container/Page (milestone sau)
  ↓ tự map BirthProfileFormValues → CreateBirthProfileInput/UpdateBirthProfileInput
  ↓ gọi useCreateBirthProfileMutation/useUpdateBirthProfileMutation (M2)
```

**Location search flow (nội bộ form, độc lập submit boundary):**
```
User gõ vào ô tìm kiếm địa điểm (local useState, KHÔNG phải RHF field)
  ↓ useLocationSearchQuery({query, date: watch("birthDate"), enabled: isBirthDateValid})
  ↓ debounce 300ms (nội bộ hook, M2) + gate theo birthDate hợp lệ (OQ-2)
  ↓ dropdown hiển thị LocationSuggestion[]
User chọn 1 suggestion
  ↓ field.onChange(suggestion) qua useController("birthLocation")   ← ghi vào RHF field thật
  ↓ đóng dropdown, hiển thị placeName đã chọn (read-only display)
User đổi lại birthDate (sau khi đã chọn location)
  ↓ onChange handler của birthDate (qua registerOptions.onChange, KHÔNG qua useEffect/useWatch)
  ↓ setValue("birthLocation", null, {shouldValidate: false})        ← xem mục 7/10, D-note dưới
```

**Lưu ý kỹ thuật quan trọng (tránh bug)**: cơ chế "đổi birthDate → xóa birthLocation" gắn vào `onChange` của chính field `birthDate` (qua `registerOptions` thứ 3 của `getInputFieldProps`, extension point có sẵn — mục 2.2), **không dùng `useEffect`/`useWatch`**. Lý do: `useEffect` theo dõi `birthDate` sẽ chạy cả khi `reset(defaultValues)` gọi lúc khởi tạo Edit mode, dẫn tới xóa nhầm `birthLocation` vừa load từ dữ liệu cũ ngay khi mở form sửa. Gắn trực tiếp vào `onChange` chỉ fire khi **người dùng thật sự gõ/đổi giá trị**, không fire khi `reset()` set giá trị ban đầu theo chương trình.

## 5. Form Data Model

```ts
// features/birth-profile/ui/BirthProfileForm/types.ts
export interface BirthProfileFormValues {
  label: string;
  fullName: string | null;      // Decision Log D5
  birthDate: string;             // "YYYY-MM-DD"
  birthTime: string | null;      // "HH:mm:ss" | null
  isBirthTimeKnown: boolean;
  birthLocation: {
    placeName: string;
    latitude: number;
    longitude: number;
    historicalTimezoneId: string;
  } | null;                      // null cho tới khi user chọn 1 suggestion
}
```

Không đồng nhất với `BirthProfile` (response, flat) — 2 type tách biệt hoàn toàn, đúng cảnh báo mục 5 prompt gốc. Mapping:

| | `label` | `fullName` | `birthDate` | `birthTime` | `isBirthTimeKnown` | Địa điểm |
|---|---|---|---|---|---|---|
| **Form → Create request** | 1:1 | 1:1 | 1:1 | 1:1 | 1:1 | `birthLocation` (nested, y nguyên, không null vì Zod đã chặn) |
| **Form → Update request** | 1:1 | 1:1 | 1:1 | 1:1 | 1:1 | `birthLocation` (nested, gửi **toàn bộ state hiện tại**, không diff — xem mục 9) |
| **Response → Edit defaultValues** | 1:1 | 1:1 | 1:1 | 1:1 | 1:1 | 4 field phẳng (`placeName/latitude/longitude/historicalTimezoneId`) → lồng lại thành `birthLocation: {...}` |

Mapper response→form (`mapper.ts`, chỉ 1 chiều — chiều form→request do container đảm nhiệm ở milestone sau, KHÔNG thuộc M3 theo Submit Boundary):
```ts
export function toFormValues(profile: BirthProfile): BirthProfileFormValues {
  return {
    label: profile.label,
    fullName: profile.fullName,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    isBirthTimeKnown: profile.isBirthTimeKnown,
    birthLocation: {
      placeName: profile.placeName,
      latitude: profile.latitude,
      longitude: profile.longitude,
      historicalTimezoneId: profile.historicalTimezoneId,
    },
  };
}
```

## 6. Validation Specification

```ts
// features/birth-profile/ui/BirthProfileForm/schema.ts
const birthLocationSchema = z.object({
  placeName: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  historicalTimezoneId: z.string().min(1),
});

export const birthProfileFormSchema = z
  .object({
    label: z.string().min(1, "Vui lòng nhập tên hồ sơ").max(100, "Tên hồ sơ tối đa 100 ký tự"),
    fullName: z.string().nullable().optional(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh không hợp lệ"),
    isBirthTimeKnown: z.boolean(),
    birthTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Giờ sinh không hợp lệ").nullable(),
    birthLocation: birthLocationSchema.nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.isBirthTimeKnown && !data.birthTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["birthTime"],
        message: "Vui lòng nhập giờ sinh",
      });
    }
    if (!data.isBirthTimeKnown && data.birthTime) {
      // Phòng thủ — UI đã tự clear qua toggle (mục 7), nhưng schema vẫn phải tự chặn
      // độc lập nếu submit bị gọi bằng chương trình với state không nhất quán (đúng
      // mục tiêu "defensive validation layer" prompt gốc).
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["birthTime"],
        message: "Giờ sinh phải để trống khi chưa rõ giờ sinh",
      });
    }
    if (!data.birthLocation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["birthLocation"],
        message: "Vui lòng chọn nơi sinh",
      });
    }
  });

export type BirthProfileFormSchemaType = z.infer<typeof birthProfileFormSchema>;
```

**Error path → React Hook Form**: `path: ["birthTime"]`/`["birthLocation"]` map thẳng vào `formState.errors.birthTime`/`formState.errors.birthLocation` (Zod `path` khớp tên field RHF theo chuẩn `zodResolver`). `birthTime` hiển thị qua `Input error={...}` bình thường (field có input thật). `birthLocation` **không có input `register()` trực tiếp** (giá trị composite qua `useController`) — hiển thị lỗi bằng cách đọc `fieldState.error?.message` từ chính `useController("birthLocation")` (giống hệt cách `useSelectField` đã làm), không cần render error system riêng.

**Không tạo schema riêng cho backend DTO** — `birthProfileFormSchema` độc lập hoàn toàn với các Zod schema phía backend (`create-birth-profile.schema.ts` không được import vào frontend), tránh coupling 2 layer khác nhau đúng cảnh báo mục 6 prompt gốc.

## 7. Birth Time State Machine

```
                    ┌─────────────┐
   toggle OFF       │   Known     │
  ┌────────────────►│ birthTime:  │
  │                  │ hợp lệ      │
  │                  └──────┬──────┘
  │                         │ toggle ON (Case B)
  │                         │ → giữ nguyên input trống,
  │                         │   KHÔNG tạo giá trị giả (không set 00:00:00)
  │                         ▼
  │                  ┌─────────────┐
  └──────────────────┤   Unknown   │
   Case A: toggle ON→OFF          │ birthTime: null
   → setValue("birthTime", null,  │ (input ẩn/disabled)
      {shouldValidate:true})      └─────────────┘
```

- **Case A (`true→false`)**: `onChange` của Checkbox (qua `getCheckboxFieldProps` + thêm `onChange` phụ tương tự cách làm ở `birthDate`) gọi `setValue("birthTime", null, {shouldValidate: true})`. Input giờ sinh chuyển sang `disabled` (không unmount, giữ layout ổn định) ngay khi `isBirthTimeKnown === false`.
- **Case B (`false→true`)**: chỉ enable lại input giờ sinh (trống, không giá trị mặc định) — user phải tự nhập, submit sẽ fail validation (`superRefine` bắt "Vui lòng nhập giờ sinh") nếu bỏ trống, đúng yêu cầu "không tạo birth time giả".
- Hành vi giống hệt ở cả `create` và `edit` (state machine không phụ thuộc `mode`).

## 8. Location Search Behavior

| Khía cạnh | Quyết định | Căn cứ |
|---|---|---|
| Ngưỡng ký tự tối thiểu | 2 (`q.trim().length >= 2`) | Đã cứng trong `useLocationSearchQuery` (M2), lấy từ backend Zod schema thật — form không tự đặt ngưỡng riêng |
| Debounce | 300ms | Đã có sẵn trong `useLocationSearchQuery`/`useDebounce` (M2) — form không tự debounce lần 2 |
| Enabled gate | `Boolean(watch("birthDate")) && /^\d{4}-\d{2}-\d{2}$/.test(watch("birthDate"))` | OQ-2 đã chốt: không fallback `today`, không gọi khi `birthDate` thiếu/không hợp lệ |
| Loading state | `isFetching` từ `useLocationSearchQuery` → hiển thị `Spinner size="xs"` trong dropdown | Tái dùng nguyên trạng component có sẵn |
| Empty state | `data?.length === 0 && !isFetching` → text "Không tìm thấy địa điểm phù hợp" trong dropdown | Không có spec cụ thể, dùng UX tối giản hợp lý |
| Error state | `isError` → `Alert variant="danger"` với nút "Thử lại" (`refetch()`) | Đúng UI Spec §805: "lỗi tra cứu địa điểm thất bại dùng Alert danger với action Thử lại" |
| Stale response/race condition | Không cần tự xử lý — TanStack Query v5 tự hủy/bỏ qua response cũ khi `queryKey` đổi (đã bao gồm `debouncedQuery`+`date` trong key ở M2) | Xác nhận từ thiết kế `useLocationSearchQuery` đã CLOSED |
| Clear behavior | Khi user xóa hết text tìm kiếm → đóng dropdown, **không** tự xóa `birthLocation` đã chọn trước đó (chỉ xóa khi đổi `birthDate`, mục 10) | Tránh mất lựa chọn hợp lệ chỉ vì UI local state bị xóa |
| Selection behavior | Click/Enter vào 1 suggestion → `field.onChange(suggestion)`, đóng dropdown, hiển thị `placeName` đã chọn dưới dạng text tĩnh (không phải input còn gõ được) kèm nút "Đổi địa điểm" để mở lại tìm kiếm | Tránh nhầm lẫn giữa "đang gõ tìm" và "đã chọn xong" |

## 9. Create/Edit Behavior

- **Create**: `defaultValues` không truyền hoặc `{label:"", fullName:null, birthDate:"", birthTime:null, isBirthTimeKnown:true, birthLocation:null}` — `isBirthTimeKnown` mặc định `true` (hợp lý hơn `false`, vì đa số user biết giờ sinh; nếu mặc định `false` thì input giờ bị disable ngay từ đầu gây khó hiểu). Trạng thái khởi tạo này **hợp lệ về type nhưng chưa pass validation** (label rỗng) — đúng yêu cầu "không hiển thị lỗi ngay khi mở form" vì `useZodForm` dùng `mode:"onBlur"` (chỉ validate sau khi user rời field, không validate ngay khi mount).
- **Edit**: `defaultValues = toFormValues(profile)` (mapper mục 5), gọi 1 lần lúc mount form (không re-map lại nếu `profile` prop đổi giữa chừng — ngoài phạm vi M3, container đảm bảo `key` React đúng nếu cần remount).
- **Submit payload**: form luôn gửi **toàn bộ `BirthProfileFormValues` hiện tại** qua `onSubmit` (không tự diff so với `defaultValues`) — kể cả ở `edit`. Lý do: (1) đơn giản, không rủi ro bug diff sai; (2) tránh kích hoạt nhánh "PATCH thiếu field tự null hóa `birthTime`" phát hiện ở M1 — vì form luôn gửi `birthTime` tường minh (giá trị thật hoặc `null`), không bao giờ "thiếu field" nữa, nên hành vi INV-BP1 hoàn toàn do chính `.superRefine` của form đảm bảo, không phụ thuộc hành vi ngầm của backend. Việc map `BirthProfileFormValues` → `UpdateBirthProfileInput` (loại field không đổi nếu cần tối ưu PATCH) là quyết định của **container/page** (milestone sau), không phải của `BirthProfileForm`.

## 10. Component Structure

```
features/birth-profile/ui/BirthProfileForm/
├── BirthProfileForm.tsx       # component chính, orchestration 2 bước
├── BirthProfileForm.test.tsx  # co-located, đúng convention F2 (mục 2.2)
├── schema.ts                  # birthProfileFormSchema (mục 6)
├── schema.test.ts             # test riêng cho .superRefine/INV-BP1 (độc lập UI)
├── types.ts                   # BirthProfileFormValues (mục 5)
├── mapper.ts                  # toFormValues (mục 5) — có lý do kiến trúc rõ: tách logic map ra khỏi component để test độc lập, không phải "best practice" chung chung
├── mapper.test.ts
├── LocationSearchField.tsx    # sub-component: input tìm kiếm + dropdown gợi ý (mục 8) — tách riêng vì độ phức tạp UI (debounce/loading/empty/error/dropdown) đủ lớn để không nhồi vào BirthProfileForm.tsx
├── LocationSearchField.test.tsx
└── index.ts                   # export BirthProfileForm, BirthProfileFormValues (barrel — hợp lý vì đây là public API đầu tiên của `features/birth-profile/ui/`)
```

Không tạo `formFields.ts` cục bộ (prompt gợi ý "nếu cần") — không có helper nào đặc thù cho birth-profile cần thiết ngoài `getInputFieldProps`/`getCheckboxFieldProps`/`useController` đã có sẵn ở `shared/lib/formFields.ts`.

## 11. File Change Matrix

| File | Action | Purpose |
|---|---|---|
| `features/birth-profile/ui/BirthProfileForm/types.ts` | Create | `BirthProfileFormValues` |
| `features/birth-profile/ui/BirthProfileForm/schema.ts` | Create | Zod schema + INV-BP1 |
| `features/birth-profile/ui/BirthProfileForm/schema.test.ts` | Create | Test schema độc lập |
| `features/birth-profile/ui/BirthProfileForm/mapper.ts` | Create | `toFormValues` |
| `features/birth-profile/ui/BirthProfileForm/mapper.test.ts` | Create | Test mapper |
| `features/birth-profile/ui/BirthProfileForm/LocationSearchField.tsx` | Create | Sub-component tìm kiếm địa điểm |
| `features/birth-profile/ui/BirthProfileForm/LocationSearchField.test.tsx` | Create | Test sub-component |
| `features/birth-profile/ui/BirthProfileForm/BirthProfileForm.tsx` | Create | Component chính |
| `features/birth-profile/ui/BirthProfileForm/BirthProfileForm.test.tsx` | Create | Test tích hợp form |
| `features/birth-profile/ui/BirthProfileForm/index.ts` | Create | Barrel export |

**Không sửa file nào đã tồn tại** (`useZodForm.ts`, `formFields.ts`, `Input`, `Checkbox`, `Button`, `useLocationSearchQuery.ts`, mọi thứ trong `api/` — tất cả dùng nguyên trạng).

## 12. Detailed Implementation Tasks

### T1 — Repository/Architecture Audit
Đã thực hiện trong plan này (mục 2). Không có task code.

### T2 — Form Model & Type Definition
- **Objective**: định nghĩa `BirthProfileFormValues` (mục 5).
- **Files**: `types.ts`.
- **Dependencies**: `BirthProfile`, `LocationSuggestion` từ `features/birth-profile/api/types.ts` (chỉ import type, không sửa).
- **Validation**: `npm run typecheck`.
- **Test**: không cần (thuần type, không có logic).
- **Risk**: nhầm field `label`/`fullName` (đã note rõ ở D5) — double-check khi viết.

### T3 — Zod Schema (mục 6)
- **Objective**: `birthProfileFormSchema` với `.superRefine` cho INV-BP1.
- **Files**: `schema.ts`, `schema.test.ts`.
- **Dependencies**: T2.
- **Test**: 4 case INV-BP1 (mục 13.3 prompt gốc) + required fields + format ngày/giờ + `birthLocation` null → fail.
- **Risk**: quên test case "known=true nhưng birthTime hợp lệ" (case pass) dẫn tới false positive coverage — đảm bảo có ít nhất 1 test case "valid" cho mỗi field.

### T4 — Birth Time / INV-BP1 UI Behavior (mục 7)
- **Objective**: wiring Checkbox↔Input giờ sinh trong `BirthProfileForm.tsx`, đúng Case A/B.
- **Files**: `BirthProfileForm.tsx` (một phần).
- **Dependencies**: T3.
- **Test**: toggle true→false tự clear + disable input; toggle false→true không set giá trị giả, input enable lại trống.
- **Risk**: dùng `useEffect`/`useWatch` thay vì `onChange` trực tiếp (mục 4 đã cảnh báo — gây bug re-trigger không mong muốn lúc `reset()`).

### T5 — Location Search Integration (mục 8)
- **Objective**: `LocationSearchField.tsx` — input tìm kiếm, dropdown, loading/empty/error state.
- **Files**: `LocationSearchField.tsx`, `LocationSearchField.test.tsx`.
- **Dependencies**: `useLocationSearchQuery` (M2, không sửa), `usePosition` (không sửa).
- **Test**: disabled khi `birthDate` invalid; enabled khi hợp lệ; debounce (fake timers, pattern đã có); suggestion render; chọn suggestion gọi đúng callback với đủ 4 field.
- **Risk**: quên `role="listbox"`/`role="option"` (accessibility parity với `Select`) — review lại ARIA trước khi coi xong.

### T6 — Create/Edit Default Value Mapping (mục 5, 9)
- **Objective**: `mapper.ts` (`toFormValues`), wiring `defaultValues` theo `mode`.
- **Files**: `mapper.ts`, `mapper.test.ts`.
- **Dependencies**: T2.
- **Test**: response flat đầy đủ → form values nested đúng, bao gồm cả case `fullName: null`/`birthTime: null`.
- **Risk**: quên `historicalTimezoneId` khi map (dễ bỏ sót vì tên dài) — assert riêng từng field trong test, không `toEqual` nguyên khối để lỗi dễ trace.

### T7 — UI Composition (`BirthProfileForm.tsx`)
- **Objective**: ghép 2 bước, `fieldset`/`legend`, nút Next/Back, submit button `isLoading`.
- **Files**: `BirthProfileForm.tsx`.
- **Dependencies**: T3–T6.
- **Test**: chuyển bước giữ giá trị đã nhập; submit ở bước 2 trigger validate toàn bộ form (không chỉ bước hiện tại).
- **Risk**: validate theo từng bước riêng lẻ (chỉ check field bước hiện tại) làm lọt INV-BP1 nếu lỗi nằm ở bước 1 nhưng user đã sang bước 2 — phải validate **toàn schema** khi submit cuối cùng, không phải per-step.

### T8 — Component Tests (mục 13, ma trận đầy đủ ở mục 13 dưới)
- **Objective**: hoàn thiện `BirthProfileForm.test.tsx` theo risk-based matrix.
- **Files**: `BirthProfileForm.test.tsx`.
- **Dependencies**: T1–T7.

### T9 — Quality Gates
- **Objective**: chạy đủ lệnh validation (mục 19).
- **Files**: không.
- **Dependencies**: T1–T8.

## 13. Testing Strategy

Component test (Vitest + Testing Library) là chủ đạo — không viết MSW integration test riêng (M3 không tự gọi API create/update; `useLocationSearchQuery` đã test đầy đủ ở M2, `BirthProfileForm` chỉ cần mock hook này qua `vi.mock` hoặc MSW ở mức tối thiểu cho phần dropdown, không lặp lại toàn bộ ma trận lỗi của M1/M2).

| # | Kịch bản | Cách verify |
|---|---|---|
| Valid submit | Điền đủ field hợp lệ (kể cả chọn location) → submit | `onSubmit` được gọi đúng 1 lần với `BirthProfileFormValues` đúng |
| Field-level error | Để trống `label`/`birthDate` sai format | `Input error` hiển thị đúng message qua `screen.getByText` |
| INV-BP1 case 1-4 | Đúng 4 case mục 13.3 prompt gốc | `.superRefine` chặn đúng case 1/4, pass đúng case 2/3 |
| Toggle Case A | true→false | `birthTime` bị `setValue(null)`, input disabled |
| Toggle Case B | false→true | input enable, giá trị vẫn rỗng (không phải `"00:00:00"`) |
| Location disabled/enabled | `birthDate` rỗng/sai format vs hợp lệ | `LocationSearchField` input có `disabled` đúng trạng thái |
| Debounce | gõ nhanh nhiều ký tự | dùng lại pattern fake timer đã có — chỉ 1 lần gọi `useLocationSearchQuery` với query cuối |
| Suggestion selection | click 1 suggestion | `birthLocation` field nhận đủ 4 giá trị (kể cả `latitude`/`longitude`/`historicalTimezoneId` — field ẩn không hiển thị nhưng phải verify qua `form.getValues()` hoặc submit payload) |
| BirthDate → stale location | chọn location → đổi `birthDate` | `birthLocation` bị `setValue(null)`, UI quay lại trạng thái "chưa chọn địa điểm" |
| Edit default values | truyền `defaultValues` từ `toFormValues(mockProfile)` | mọi field (kể cả 4 field địa điểm) hiển thị đúng giá trị ban đầu |

## 14. Edge Cases

| Edge case | Xử lý |
|---|---|
| Invalid date format | Zod regex reject, message "Ngày sinh không hợp lệ" |
| Invalid time format | Zod regex reject, message "Giờ sinh không hợp lệ" |
| Unknown birth time | Case A/B (mục 7) |
| Toggle back to known | Case B — không set giá trị giả |
| Location search before date | Input disabled hoàn toàn, không render dropdown |
| Empty search result | Text "Không tìm thấy địa điểm phù hợp" |
| Location API error | `Alert danger` + nút "Thử lại" (mục 8) |
| Stale search response/race condition | Do TanStack Query v5 tự xử lý qua queryKey (mục 8) — không cần code thêm |
| BirthDate đổi sau khi chọn location | `setValue("birthLocation", null)` qua `onChange` trực tiếp (mục 4/10) |
| Edit profile có location sẵn | `mapper.ts` lồng lại đúng 4 field phẳng → nested (mục 5, 6) |
| Malformed/default location data (ví dụ response thiếu field) | Ngoài phạm vi thực tế (M1's `BirthProfile` type đã đảm bảo đủ 4 field không optional ở response) — không cần defensive code thêm, TypeScript đã chặn ở compile-time |

## 15. Acceptance Criteria

Tương ứng 1:1 với AC1–AC10 prompt gốc — tất cả đã được thiết kế đáp ứng ở các mục 5–9 trên, riêng lưu ý AC9: dùng `Input error` (không phải `errorText`, xem D1).

## 16. Definition of Done

Theo đúng checklist mục 22 prompt gốc, cộng thêm:
- [ ] Không có file nào trong mục 11 bị bỏ sót hoặc thêm ngoài dự kiến không có lý do kiến trúc
- [ ] `npx vitest run --passWithNoTests` giữ nguyên toàn bộ test cũ (M1+M2) pass, cộng test mới của M3
- [ ] Không hook/component nào của M1/M2 bị sửa

## 17. Risks & Mitigations

| Rủi ro | Mitigation |
|---|---|
| Nhầm `onChange` phụ trợ (birthDate→clear location, checkbox→clear birthTime) bằng `useEffect`/`useWatch` | Bắt buộc dùng `registerOptions.onChange` (T4/mục 4) — review code trước khi coi task xong |
| Validate theo từng bước riêng lẻ làm lọt lỗi cross-step | Submit luôn validate toàn schema (T7) |
| `birthLocation` không có input `register()` trực tiếp dễ bị quên wiring `useController` đúng | Theo sát pattern `useSelectField` đã có sẵn (mục 2.2), không tự sáng tạo cách wiring mới |
| Model hóa `Progress`/`Combobox` đầy đủ theo spec → phình phạm vi | Đã chốt composition tối giản cục bộ (D3), không tạo `shared/ui/` mới |
| Xây responsive date/time picker đầy đủ theo spec §802 → cần `useMediaQuery` mới + calendar component mới | Đã chốt dùng native input mọi kích thước màn hình (D4) |

## 18. Implementation Order

```
T2 (types) → T3 (schema + test) → T6 (mapper + test, độc lập UI, có thể làm song song T4/T5)
         → T4 (birth time behavior) → T5 (location search field) → T7 (UI composition ghép tất cả)
         → T8 (test tổng hợp BirthProfileForm.test.tsx) → T9 (quality gates)
```

## 19. Final Verification Checklist

```bash
cd frontend
npm run typecheck
npx vitest run src/features/birth-profile/ui
npx vitest run --passWithNoTests
npm run lint
npm run format:check
npm run build
```

---

## Pre-Implementation Decisions

Toàn bộ quyết định dưới đây developer cần biết **trước dòng code đầu tiên** (đã giải thích chi tiết ở các mục tương ứng, liệt kê lại ở đây để tiện tra cứu nhanh):

1. Dùng prop `error` (không phải `errorText`) khi wiring `Input` — D1.
2. **Không** implement Alert cảnh báo Ascendant/House — theo OQ-1 đã chốt, ghi đè UI Spec §800 — D2.
3. Dropdown gợi ý địa điểm và chỉ báo bước là **composition cục bộ**, không tạo `shared/ui/Combobox`/`Progress` mới — D3.
4. Date/time input dùng **native `<input type="date/time">` cho mọi kích thước màn hình**, không xây responsive picker switching — D4.
5. Đưa `fullName` vào form như field optional ở bước 1, dù UI Spec không liệt kê tường minh — D5.
6. Cơ chế "birthDate đổi → xóa location" và "checkbox đổi → xóa birthTime" đều gắn qua `onChange` trực tiếp của field (dùng `registerOptions` sẵn có trong `getInputFieldProps`), **không** dùng `useEffect`/`useWatch`.
7. Submit luôn gửi **toàn bộ** `BirthProfileFormValues` hiện tại (không diff theo `dirtyFields`) — kể cả ở `edit`.
8. Form **không** tự gọi mutation/API — chỉ trả `BirthProfileFormValues` qua `onSubmit`; mapping sang `CreateBirthProfileInput`/`UpdateBirthProfileInput` là trách nhiệm của container/page ở milestone sau.

**No blocking decisions remain. M3 is implementation-ready.**
