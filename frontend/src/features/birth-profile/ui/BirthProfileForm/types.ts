export interface BirthProfileFormValues {
  label: string;
  fullName: string;
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
