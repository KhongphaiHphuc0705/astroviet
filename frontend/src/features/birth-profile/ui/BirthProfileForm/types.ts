export interface BirthProfileFormValues {
  label: string;
  fullName: string | null;
  birthDate: string;
  birthTime: string | null;
  isBirthTimeKnown: boolean;
  birthLocation: {
    placeName: string;
    latitude: number;
    longitude: number;
    historicalTimezoneId: string;
  } | null;
}
