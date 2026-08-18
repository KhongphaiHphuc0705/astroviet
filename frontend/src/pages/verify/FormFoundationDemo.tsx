import { useState, useId } from "react";
import { z } from "zod";

import { useZodForm } from "@shared/hooks/useZodForm";
import {
  getCheckboxFieldProps,
  getInputFieldProps,
  useSelectField,
} from "@shared/lib/formFields";
import { Button } from "@shared/ui/Button";
import { Checkbox } from "@shared/ui/Checkbox";
import { Input } from "@shared/ui/Input";
import { Select } from "@shared/ui/Select";

// ── Schema (minh họa thuần túy — KHÔNG dùng làm schema thật cho bất kỳ form nghiệp vụ nào) ──
// Tên field cố ý trung lập, không gợi ý cấu trúc User/BirthProfile thật.
// (M7 Plan §1.3 & §8.2)

const demoSchema = z.object({
  displayName: z.string().min(2, "Tên hiển thị tối thiểu 2 ký tự"),
  contactEmail: z
    .string()
    .min(1, "Email là bắt buộc")
    .email("Định dạng email không hợp lệ"),
  country: z.string().min(1, "Vui lòng chọn một quốc gia"),
  agreeToTerms: z.literal(true, {
    error: "Bạn phải đồng ý với điều khoản để tiếp tục",
  }),
  referenceCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

type DemoFormValues = z.infer<typeof demoSchema>;

// FIELD_ORDER khai báo ngay cạnh schema (M7 Plan §4.4 — không tách xa).
// Thứ tự này quyết định field nào được focus khi submit có lỗi.
const FIELD_ORDER = [
  "displayName",
  "contactEmail",
  "country",
  "agreeToTerms",
  "referenceCode",
  "dateOfBirth",
] as const satisfies ReadonlyArray<keyof DemoFormValues>;

const COUNTRY_OPTIONS = [
  { value: "VN", label: "Việt Nam" },
  { value: "US", label: "Hoa Kỳ" },
  { value: "JP", label: "Nhật Bản" },
  { value: "KR", label: "Hàn Quốc" },
  { value: "SG", label: "Singapore" },
  { value: "TH", label: "Thái Lan" },
  { value: "AU", label: "Úc" },
  { value: "GB", label: "Vương quốc Anh" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function FormFoundationDemo() {
  const form = useZodForm(demoSchema, {
    defaultValues: {
      displayName: "",
      contactEmail: "",
      country: "",
      referenceCode: "REF-2024-001",
      dateOfBirth: "DD/MM/YYYY",
    },
  });

  const {
    handleSubmit,
    formState: { errors },
    setFocus,
    reset,
  } = form;

  // Connector for the Select field (must use Controller — M7 Plan §5.2)
  const countryField = useSelectField<DemoFormValues>("country", form.control);

  // agreeToTerms error — rendered manually because Checkbox has no error prop (M7 Plan §4.5)
  const agreeError = errors.agreeToTerms?.message;
  const agreeCheckboxId = useId();
  const agreeErrorId = `${agreeCheckboxId}-error`;

  // Store submitted data to display result (M7 Plan §8.4)
  const [submittedData, setSubmittedData] = useState<DemoFormValues | null>(
    null,
  );

  const onValid = (data: DemoFormValues) => {
    // In a real form, call an API here.
    // For demo: surface data to show disabled/readOnly payload difference.
    // NOT a recommended pattern for real forms — demo only. (M7 Plan §8.4)
    setSubmittedData(data);
  };

  const onInvalid = () => {
    // Focus the first field with an error, in DOM order (M7 Plan §4.4 / §6.4)
    for (const fieldName of FIELD_ORDER) {
      if (errors[fieldName]) {
        setFocus(fieldName);
        return;
      }
    }
  };

  const handleReset = () => {
    reset();
    setSubmittedData(null);
  };

  return (
    <div className="flex flex-col gap-6" data-testid="form-foundation-demo">
      <form
        onSubmit={handleSubmit(onValid, onInvalid)}
        noValidate
        aria-label="Form Foundation Demo"
        className="flex flex-col gap-5"
      >
        {/* ── 4 validated fields ── */}
        <Input
          label="Tên hiển thị"
          placeholder="Ví dụ: Nguyễn Văn An"
          required
          {...getInputFieldProps<DemoFormValues>("displayName", form)}
        />

        <Input
          label="Email liên hệ"
          type="email"
          placeholder="Ví dụ: email@example.com"
          required
          {...getInputFieldProps<DemoFormValues>("contactEmail", form)}
        />

        <Select
          label="Quốc gia"
          options={COUNTRY_OPTIONS}
          placeholder="Chọn quốc gia..."
          required
          {...countryField}
        />

        {/* Checkbox — error rendered manually (M7 Plan §4.5 / §6.3) */}
        <div className="flex flex-col gap-1.5">
          <Checkbox
            id={agreeCheckboxId}
            label="Tôi đồng ý với điều khoản sử dụng dịch vụ"
            aria-invalid={!!agreeError}
            aria-describedby={agreeError ? agreeErrorId : undefined}
            {...getCheckboxFieldProps<DemoFormValues>("agreeToTerms", form)}
          />
          {agreeError && (
            <p
              id={agreeErrorId}
              role="alert"
              className="text-body-sm text-danger"
            >
              {agreeError}
            </p>
          )}
        </div>

        {/* ── 2 state-only fields (visual demonstration — not registered with RHF) ── */}
        <div className="border-t border-subtle pt-5">
          <p className="mb-4 text-body-sm text-secondary">
            Các trường bên dưới minh họa trạng thái{" "}
            <code className="rounded bg-canvas px-1 py-1 text-body-sm">
              disabled
            </code>{" "}
            và{" "}
            <code className="rounded bg-canvas px-1 py-1 text-body-sm">
              readOnly
            </code>
            . Trường <strong>disabled</strong> không tương tác được và{" "}
            <strong>không xuất hiện trong payload</strong>. Trường{" "}
            <strong>readOnly</strong> không sửa được nhưng{" "}
            <strong>vẫn xuất hiện trong payload</strong> (nếu được register).
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* disabled — registered with RHF but automatically excluded from payload */}
            <Input
              label="Mã tham chiếu (disabled)"
              disabled
              {...getInputFieldProps<DemoFormValues>("referenceCode", form)}
            />
            {/* readOnly — registered with RHF and included in payload */}
            <Input
              label="Định dạng ngày (readOnly)"
              readOnly
              {...getInputFieldProps<DemoFormValues>("dateOfBirth", form)}
            />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-3 border-t border-subtle pt-5">
          <Button type="submit">Gửi biểu mẫu</Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Đặt lại
          </Button>
        </div>
      </form>

      {/* ── Submit result (M7 Plan §8.4) ── */}
      {submittedData && (
        <div
          className="border-success/40 bg-success/5 rounded-lg border p-4"
          data-testid="submit-result"
        >
          <p className="mb-2 text-body-sm font-medium text-success">
            ✓ Gửi thành công — Dữ liệu nhận được từ RHF:
          </p>
          {/* NOT a recommended pattern for real forms — demo only */}
          <pre className="overflow-auto rounded-md bg-canvas p-3 text-body-sm text-primary">
            {JSON.stringify(submittedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
