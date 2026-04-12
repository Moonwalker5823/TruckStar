import { Router } from 'express';
import pool from '../db.js';
import { fetchNearbyFoodTrucks } from '../services/places.js';

const router = Router();

const UPSERT_SQL = `INSERT INTO trucks (name, latitude, longitude, cuisine, website, phone, photo_reference, source, last_seen_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'google_places', NOW())
  ON DUPLICATE KEY UPDATE
    latitude = VALUES(latitude),
    longitude = VALUES(longitude),
    website = VALUES(website),
    phone = VALUES(phone),
    photo_reference = VALUES(photo_reference),
    last_seen_at = NOW()`;

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
    console.error('Google Places error:', err);
    return res.status(502).json({ error: 'Failed to fetch nearby trucks' });
  }

  // Cache upsert is best-effort — never blocks the response
  try {
    const conn = await pool.getConnection();
    try {
      for (const truck of trucks) {
        try {
          await conn.execute(UPSERT_SQL, [truck.name, truck.lat, truck.lng, truck.cuisine ?? null, truck.website ?? null, truck.phone ?? null, truck.photo_reference ?? null]);
        } catch (err) {
          console.error(`MySQL upsert error for "${truck.name}":`, err.message);
        }
      }
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('MySQL connection error:', err.message);
  }

  res.json(trucks);
});

export default router;
