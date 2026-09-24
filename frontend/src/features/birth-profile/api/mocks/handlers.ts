import {
  http,
  HttpResponse,
  type HttpResponseResolver,
  type RequestHandler,
} from "msw";

import type { BirthProfile } from "../types";

export const mockCreateBirthProfile = (resolver: HttpResponseResolver) =>
  http.post("*/api/v1/birth-profiles", resolver);

export const mockListBirthProfiles = (resolver: HttpResponseResolver) =>
  http.get("*/api/v1/birth-profiles", resolver);

export const mockGetBirthProfile = (resolver: HttpResponseResolver) =>
  http.get("*/api/v1/birth-profiles/:id", resolver);

export const mockUpdateBirthProfile = (resolver: HttpResponseResolver) =>
  http.patch("*/api/v1/birth-profiles/:id", resolver);

export const mockDeleteBirthProfile = (resolver: HttpResponseResolver) =>
  http.delete("*/api/v1/birth-profiles/:id", resolver);

export const mockSearchLocations = (resolver: HttpResponseResolver) =>
  http.get("*/api/v1/locations/search", resolver);

export const mockBirthProfile = (
  overrides: Partial<BirthProfile> = {},
): BirthProfile => ({
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "user-123",
  label: "My Profile",
  fullName: "Phuc Hoang",
  birthDate: "1995-05-12",
  birthTime: "14:30:00",
  isBirthTimeKnown: true,
  placeName: "Hồ Chí Minh, Việt Nam",
  latitude: 10.7756,
  longitude: 106.7019,
  historicalTimezoneId: "Asia/Ho_Chi_Minh",
  warnings: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// RFC7807 helper, duplicated here intentionally as per plan
interface ProblemDetailsInput {
  status: number;
  errorCode: string;
  title: string;
  detail?: string;
  type?: string;
}

export const problemDetails = ({
  status,
  errorCode,
  title,
  detail,
  type,
}: ProblemDetailsInput) => {
  return HttpResponse.json(
    {
      type: type || "about:blank",
      title,
      status,
      errorCode,
      detail,
    },
    {
      status,
      headers: {
        "Content-Type": "application/problem+json",
      },
    },
  );
};

// Success Handlers
export const createBirthProfileSuccess = () =>
  mockCreateBirthProfile(() =>
    HttpResponse.json(mockBirthProfile(), { status: 201 }),
  );

export const getBirthProfileSuccess = () =>
  mockGetBirthProfile(() => HttpResponse.json(mockBirthProfile()));

export const listBirthProfilesSuccess = () =>
  mockListBirthProfiles(() =>
    HttpResponse.json({
      items: [mockBirthProfile()],
      total: 1,
      page: 1,
      pageSize: 20,
    }),
  );

export const updateBirthProfileSuccess = () =>
  mockUpdateBirthProfile(() => HttpResponse.json(mockBirthProfile()));

export const deleteBirthProfileSuccess = () =>
  mockDeleteBirthProfile(() => new HttpResponse(null, { status: 204 }));

export const searchLocationsSuccess = () =>
  mockSearchLocations(() =>
    HttpResponse.json([
      {
        placeName: "Hồ Chí Minh, Việt Nam",
        latitude: 10.7756,
        longitude: 106.7019,
        historicalTimezoneId: "Asia/Ho_Chi_Minh",
      },
    ]),
  );

// Error Handlers Factory
export const birthProfileNotFound = (
  endpointFactory: (resolver: HttpResponseResolver) => RequestHandler,
) =>
  endpointFactory(() =>
    problemDetails({
      status: 404,
      errorCode: "RESOURCE_NOT_FOUND",
      title: "Not Found",
    }),
  );

export const birthProfileForbidden = (
  endpointFactory: (resolver: HttpResponseResolver) => RequestHandler,
) =>
  endpointFactory(() =>
    problemDetails({
      status: 403,
      errorCode: "FORBIDDEN",
      title: "Forbidden",
    }),
  );

export const birthProfileValidationError = (
  endpointFactory: (resolver: HttpResponseResolver) => RequestHandler,
  errorCode = "INVALID_BIRTH_TIME_STATE",
) =>
  endpointFactory(() =>
    problemDetails({
      status: 422,
      errorCode,
      title: "Unprocessable Entity",
    }),
  );

export const birthProfileMalformedRequest = (
  endpointFactory: (resolver: HttpResponseResolver) => RequestHandler,
) =>
  endpointFactory(() =>
    problemDetails({
      status: 400,
      errorCode: "MALFORMED_REQUEST",
      title: "Bad Request",
    }),
  );
