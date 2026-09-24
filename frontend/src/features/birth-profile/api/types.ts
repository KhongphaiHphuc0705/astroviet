export interface LocationSuggestion {
  placeName: string;
  latitude: number;
  longitude: number;
  historicalTimezoneId: string;
}

export type BirthLocationInput = LocationSuggestion;

export interface Warning {
  code: string;
  message: string;
  severity: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface BirthProfile {
  id: string;
  userId: string;
  label: string;
  fullName: string | null;
  birthDate: string;
  birthTime: string | null;
  isBirthTimeKnown: boolean;
  placeName: string;
  latitude: number;
  longitude: number;
  historicalTimezoneId: string;
  warnings: Warning[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBirthProfileInput {
  label: string;
  fullName?: string | null;
  birthDate: string;
  birthTime?: string | null;
  isBirthTimeKnown: boolean;
  birthLocation: BirthLocationInput;
}

export interface UpdateBirthProfileInput {
  label?: string;
  fullName?: string | null;
  birthDate?: string;
  birthTime?: string | null;
  isBirthTimeKnown?: boolean;
  birthLocation?: BirthLocationInput;
}

export interface ListBirthProfilesParams {
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "fullName";
  order?: "asc" | "desc";
}

export interface ListBirthProfilesResponse {
  items: BirthProfile[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SearchLocationsParams {
  q: string;
  date: string;
}
