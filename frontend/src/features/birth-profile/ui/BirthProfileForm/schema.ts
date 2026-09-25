import { z } from "zod";

const birthLocationSchema = z.object({
  placeName: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  historicalTimezoneId: z.string().min(1),
});

export const birthProfileFormSchema = z
  .object({
    label: z
      .string()
      .min(1, "Vui lòng nhập tên hồ sơ")
      .max(100, "Tên hồ sơ tối đa 100 ký tự"),
    fullName: z.string().nullable().optional(),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh không hợp lệ"),
    isBirthTimeKnown: z.boolean(),
    birthTime: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, "Giờ sinh không hợp lệ")
      .nullable(),
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
