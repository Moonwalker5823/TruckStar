import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchNearbyFoodTrucks } from './places.js';

describe('fetchNearbyFoodTrucks', () => {
  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalises Places API results into truck objects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        status: 'OK',
        results: [
          {
            name: 'Taco Truck',
            geometry: { location: { lat: 37.77, lng: -122.41 } },
            types: ['food', 'point_of_interest'],
          },
        ],
      }),
    }));

    const trucks = await fetchNearbyFoodTrucks(37.77, -122.41);

    expect(trucks).toEqual([
      { name: 'Taco Truck', lat: 37.77, lng: -122.41, cuisine: 'food' },
    ]);
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        status: 'OK',
        results: [
          { name: 'No Geometry Truck', geometry: null, types: ['food'] },
          {
            name: 'Valid Truck',
            geometry: { location: { lat: 37.77, lng: -122.41 } },
            types: ['food'],
          },
        ],
      }),
    }));

    const trucks = await fetchNearbyFoodTrucks(37.77, -122.41);
    expect(trucks).toHaveLength(1);
    expect(trucks[0].name).toBe('Valid Truck');
  });
});
