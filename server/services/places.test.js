import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchNearbyFoodTrucks } from './places.js';

describe('fetchNearbyFoodTrucks', () => {
  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalises Places API results with details into truck objects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(url => {
      if (url.includes('nearbysearch')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'OK',
            results: [{
              name: 'Taco Truck',
              place_id: 'abc123',
              geometry: { location: { lat: 37.77, lng: -122.41 } },
              types: ['food', 'point_of_interest'],
              photos: [{ photo_reference: 'ref_xyz' }],
            }],
          }),
        });
      }
      // Details call
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          result: {
            website: 'https://tacos.example.com',
            formatted_phone_number: '(555) 123-4567',
            url: 'https://maps.google.com/?cid=123',
          },
        }),
      });
    }));

    const trucks = await fetchNearbyFoodTrucks(37.77, -122.41);

    expect(trucks).toEqual([{
      name: 'Taco Truck',
      lat: 37.77,
      lng: -122.41,
      cuisine: 'food',
      photo_reference: 'ref_xyz',
      website: 'https://tacos.example.com',
      phone: '(555) 123-4567',
      maps_url: 'https://maps.google.com/?cid=123',
    }]);
  });

  it('returns empty array for ZERO_RESULTS status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ZERO_RESULTS', results: [] }),
    }));

    const trucks = await fetchNearbyFoodTrucks(0, 0);
    expect(trucks).toEqual([]);
  });

  it('throws when HTTP response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    await expect(fetchNearbyFoodTrucks(37.77, -122.41))
      .rejects.toThrow('Google Places API error: 503');
  });

  it('throws when Places API returns an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'REQUEST_DENIED', results: [] }),
    }));

    await expect(fetchNearbyFoodTrucks(37.77, -122.41))
      .rejects.toThrow('REQUEST_DENIED');
  });

  it('silently skips results with missing geometry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(url => {
      if (url.includes('nearbysearch')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'OK',
            results: [
              { name: 'No Geometry Truck', place_id: 'bad', geometry: null, types: ['food'] },
              { name: 'Valid Truck', place_id: 'good', geometry: { location: { lat: 37.77, lng: -122.41 } }, types: ['food'] },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result: {} }),
      });
    }));

    const trucks = await fetchNearbyFoodTrucks(37.77, -122.41);
    expect(trucks).toHaveLength(1);
    expect(trucks[0].name).toBe('Valid Truck');
  });

  it('returns null for optional fields when Details call fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(url => {
      if (url.includes('nearbysearch')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'OK',
            results: [{
              name: 'Mystery Truck',
              place_id: 'xyz',
              geometry: { location: { lat: 37.77, lng: -122.41 } },
              types: ['food'],
            }],
          }),
        });
      }
      // Details call fails
      return Promise.reject(new Error('Network error'));
    }));

    const trucks = await fetchNearbyFoodTrucks(37.77, -122.41);
    expect(trucks[0].website).toBeNull();
    expect(trucks[0].phone).toBeNull();
    expect(trucks[0].maps_url).toBeNull();
    expect(trucks[0].photo_reference).toBeNull();
  });
});
