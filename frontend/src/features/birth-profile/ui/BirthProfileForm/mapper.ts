import type { BirthProfile } from "../../api/types";

import type { BirthProfileFormValues } from "./types";

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
