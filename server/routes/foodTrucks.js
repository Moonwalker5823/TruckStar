import { Router } from 'express';
import pool from '../db.js';
import { fetchNearbyFoodTrucks } from '../services/places.js';

const router = Router();

router.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (!req.query.lat || !req.query.lng || isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'Valid lat and lng query params are required' });
  }

  let trucks;
  try {
    trucks = await fetchNearbyFoodTrucks(lat, lng);
  } catch (err) {
    console.error('Google Places error:', err.message);
    return res.status(502).json({ error: 'Failed to fetch nearby trucks' });
  }

  // Cache upsert is best-effort — never blocks the response
  try {
    const conn = await pool.getConnection();
    try {
      for (const truck of trucks) {
        await conn.execute(
          `INSERT INTO trucks (name, latitude, longitude, cuisine, source, last_seen_at)
           VALUES (?, ?, ?, ?, 'google_places', NOW())
           ON DUPLICATE KEY UPDATE
             latitude = VALUES(latitude),
             longitude = VALUES(longitude),
             last_seen_at = NOW()`,
          [truck.name, truck.lat, truck.lng, truck.cuisine ?? null],
        );
      }
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('MySQL upsert error:', err.message);
  }

  res.json(trucks);
});

export default router;
