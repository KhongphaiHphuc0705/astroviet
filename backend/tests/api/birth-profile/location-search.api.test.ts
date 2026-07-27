import { Express } from 'express';

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi, afterEach } from 'vitest';

import { bootstrapApplication } from '../../../src/composition-root.js';
import { GeoNamesLocationSearchAdapter } from '../../../src/modules/birth-profile/infrastructure/adapters/geonames-location-search.adapter.js';
import { ExternalServiceError } from '../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../src/shared/errors/error-codes.js';

describe('Location Search API (E2E)', () => {
  let app: Express;

  beforeAll(async () => {
    const { app: expressApp } = await bootstrapApplication();
    app = expressApp; 
  });

  afterAll(() => {
    // Cleanup if necessary
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/v1/locations/search', () => {
    it('should return 200 OK with location suggestions for a valid query', async () => {
      // Mock the GeoNames fetch so we don't hit the real API in tests
      const mockSearch = vi
        .spyOn(GeoNamesLocationSearchAdapter.prototype, 'search')
        .mockResolvedValue([
          {
            placeName: 'Hanoi, Vietnam',
            latitude: 21.0285,
            longitude: 105.8542,
            historicalTimezoneId: 'Asia/Ho_Chi_Minh',
          },
        ]);

      const response = await request(app)
        .get('/api/v1/locations/search')
        .query({ q: 'Hanoi', date: '1990-01-01' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          placeName: 'Hanoi, Vietnam',
          latitude: 21.0285,
          longitude: 105.8542,
          historicalTimezoneId: 'Asia/Ho_Chi_Minh',
        },
      ]);

      expect(mockSearch).toHaveBeenCalledTimes(1);
      expect(mockSearch).toHaveBeenCalledWith('Hanoi', expect.any(Date));
    });

    it('should return 400 Bad Request when query "q" is missing', async () => {
      const response = await request(app)
        .get('/api/v1/locations/search')
        .query({ date: '1990-01-01' }); // missing q

      expect(response.status).toBe(400);
      expect(response.body.title).toBe('Malformed Request');
    });

    it('should return 400 Bad Request when query "date" is missing', async () => {
      const response = await request(app).get('/api/v1/locations/search').query({ q: 'Hanoi' }); // missing date

      expect(response.status).toBe(400);
      expect(response.body.title).toBe('Malformed Request');
    });

    it('should return 400 Bad Request when query "q" is too short', async () => {
      const response = await request(app)
        .get('/api/v1/locations/search')
        .query({ q: 'a', date: '1990-01-01' });

      expect(response.status).toBe(400);
      expect(response.body.title).toBe('Malformed Request');
    });

    it('should return 400 Bad Request when query "date" is invalid', async () => {
      const response = await request(app)
        .get('/api/v1/locations/search')
        .query({ q: 'Hanoi', date: 'invalid-date' });

      expect(response.status).toBe(400);
      expect(response.body.title).toBe('Malformed Request');
    });

    it('should return 500 Internal Server Error when external service throws ExternalServiceError', async () => {
      // Mock the adapter to throw an ExternalServiceError
      vi.spyOn(GeoNamesLocationSearchAdapter.prototype, 'search').mockRejectedValue(
        new ExternalServiceError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'Geonames API is down'),
      );

      const response = await request(app)
        .get('/api/v1/locations/search')
        .query({ q: 'Hanoi', date: '1990-01-01' });

      expect(response.status).toBe(500);
      expect(response.body.title).toBe('External Service Error');
      expect(response.body.detail).toBe('Geonames API is down');
    });
  });
});
