import { describe, expect, it } from "vitest";

import { birthProfileFormSchema } from "./schema";

describe("birthProfileFormSchema", () => {
  const validBase = {
    label: "My Profile",
    fullName: "Phuc Hoang",
    birthDate: "1995-05-12",
    birthLocation: {
      placeName: "Ho Chi Minh",
      latitude: 10,
      longitude: 106,
      historicalTimezoneId: "Asia/Ho_Chi_Minh",
    },
  };

  it("passes with known birth time and valid time string", () => {
    const data = {
      ...validBase,
      isBirthTimeKnown: true,
      birthTime: "14:30:00",
    };
    const result = birthProfileFormSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("passes with unknown birth time and null birthTime", () => {
    const data = {
      ...validBase,
      isBirthTimeKnown: false,
      birthTime: null,
    };
    const result = birthProfileFormSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("fails if label is missing", () => {
    const data = {
      ...validBase,
      label: "",
      isBirthTimeKnown: true,
      birthTime: "14:30:00",
    };
    const result = birthProfileFormSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["label"]);
    }
  });

  it("fails if birthDate is invalid format", () => {
    const data = {
      ...validBase,
      birthDate: "1995-5-12",
      isBirthTimeKnown: true,
      birthTime: "14:30:00",
    };
    const result = birthProfileFormSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["birthDate"]);
    }
  });

  it("fails INV-BP1: known birth time but missing time", () => {
    const data = {
      ...validBase,
      isBirthTimeKnown: true,
      birthTime: null,
    };
    const result = birthProfileFormSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "birthTime")).toBe(
        true,
      );
      const issue = result.error.issues.find((i) => i.path[0] === "birthTime");
      expect(issue?.message).toBe("Vui lòng nhập giờ sinh");
    }
  });

  it("fails INV-BP1: unknown birth time but has time", () => {
    const data = {
      ...validBase,
      isBirthTimeKnown: false,
      birthTime: "14:30:00",
    };
    const result = birthProfileFormSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "birthTime")).toBe(
        true,
      );
      const issue = result.error.issues.find((i) => i.path[0] === "birthTime");
      expect(issue?.message).toBe(
        "Giờ sinh phải để trống khi chưa rõ giờ sinh",
      );
    }
  });

  it("fails if birthLocation is missing", () => {
    const data = {
      ...validBase,
      birthLocation: null,
      isBirthTimeKnown: true,
      birthTime: "14:30:00",
    };
    const result = birthProfileFormSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "birthLocation"),
      ).toBe(true);
      const issue = result.error.issues.find(
        (i) => i.path[0] === "birthLocation",
      );
      expect(issue?.message).toBe("Vui lòng chọn nơi sinh");
    }
  });
});
