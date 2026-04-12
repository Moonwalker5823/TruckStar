import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';

vi.mock('../services/places.js', () => ({
  fetchNearbyFoodTrucks: vi.fn(),
}));

vi.mock('../db.js', () => ({
  default: {
    getConnection: vi.fn(),
  },
}));

import { fetchNearbyFoodTrucks } from '../services/places.js';
import pool from '../db.js';
import router from './foodTrucks.js';

const app = express();
app.use('/api/food-trucks', router);
const request = supertest(app);

describe('GET /api/food-trucks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when lat is missing', async () => {
    const res = await request.get('/api/food-trucks?lng=-122.41');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when lng is missing', async () => {
    const res = await request.get('/api/food-trucks?lat=37.77');
    expect(res.status).toBe(400);
  });

  it('returns 400 when lat is not a number', async () => {
    const res = await request.get('/api/food-trucks?lat=abc&lng=-122.41');
    expect(res.status).toBe(400);
  });

  it('returns 502 when Places API throws', async () => {
    fetchNearbyFoodTrucks.mockRejectedValue(new Error('API unavailable'));

    const res = await request.get('/api/food-trucks?lat=37.77&lng=-122.41');
    expect(res.status).toBe(502);
    expect(res.body.error).toBe('Failed to fetch nearby trucks');
  });

  it('returns 200 with trucks even when DB upsert fails', async () => {
    const mockTrucks = [
      { name: 'Taco Truck', lat: 37.77, lng: -122.41, cuisine: 'food' },
    ];
    fetchNearbyFoodTrucks.mockResolvedValue(mockTrucks);
    pool.getConnection.mockRejectedValue(new Error('DB connection refused'));

    const res = await request.get('/api/food-trucks?lat=37.77&lng=-122.41');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockTrucks);
  });
});
