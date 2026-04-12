import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import router from './placePhoto.js';

const app = express();
app.use('/api/place-photo', router);
const request = supertest(app);

describe('GET /api/place-photo', () => {
  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 400 when ref is missing', async () => {
    const res = await request.get('/api/place-photo');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('proxies the image from Google and returns it with correct headers', async () => {
    const fakeImage = Buffer.from('fake-image-data');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: key => key === 'content-type' ? 'image/jpeg' : null },
      arrayBuffer: () => Promise.resolve(fakeImage.buffer),
    }));

    const res = await request.get('/api/place-photo?ref=abc123');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/jpeg');
    expect(res.headers['cache-control']).toContain('max-age=86400');
  });

  it('returns 502 when Google fetch returns non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    const res = await request.get('/api/place-photo?ref=abc123');
    expect(res.status).toBe(502);
  });

  it('returns 502 when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const res = await request.get('/api/place-photo?ref=abc123');
    expect(res.status).toBe(502);
  });
});
