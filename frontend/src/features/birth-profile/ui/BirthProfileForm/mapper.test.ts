import { describe, expect, it } from "vitest";

import { type BirthProfile } from "../../api/types";

import { toFormValues } from "./mapper";

describe("mapper - toFormValues", () => {
  it("maps flat BirthProfile into nested BirthProfileFormValues", () => {
    const profile: BirthProfile = {
      id: "1",
      userId: "user-1",
      label: "My Profile",
      fullName: "John Doe",
      birthDate: "1990-01-01",
      birthTime: "12:30:00",
      isBirthTimeKnown: true,
      placeName: "Ho Chi Minh City",
      latitude: 10,
      longitude: 106,
      historicalTimezoneId: "Asia/Ho_Chi_Minh",
      warnings: [],
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    const formValues = toFormValues(profile);

    expect(formValues.label).toBe("My Profile");
    expect(formValues.fullName).toBe("John Doe");
    expect(formValues.birthDate).toBe("1990-01-01");
    expect(formValues.birthTime).toBe("12:30:00");
    expect(formValues.isBirthTimeKnown).toBe(true);
    expect(formValues.birthLocation).toBeDefined();
    expect(formValues.birthLocation?.placeName).toBe("Ho Chi Minh City");
    expect(formValues.birthLocation?.latitude).toBe(10);
    expect(formValues.birthLocation?.longitude).toBe(106);
    expect(formValues.birthLocation?.historicalTimezoneId).toBe(
      "Asia/Ho_Chi_Minh",
    );
  });

  it("handles null fullName and birthTime", () => {
    const profile: BirthProfile = {
      id: "2",
      userId: "user-2",
      label: "Unknown Time",
      fullName: null,
      birthDate: "1995-05-15",
      birthTime: null,
      isBirthTimeKnown: false,
      placeName: "Hanoi",
      latitude: 21,
      longitude: 105,
      historicalTimezoneId: "Asia/Bangkok",
      warnings: [],
      createdAt: "2023-02-01T00:00:00Z",
      updatedAt: "2023-02-01T00:00:00Z",
    };

    const formValues = toFormValues(profile);

    expect(formValues.fullName).toBeNull();
    expect(formValues.birthTime).toBeNull();
    expect(formValues.isBirthTimeKnown).toBe(false);
  });
});
