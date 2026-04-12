import { Router } from 'express';

const router = Router();
const PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo';

router.get('/', async (req, res) => {
  const { ref, maxwidth = '400' } = req.query;
  if (!ref) return res.status(400).json({ error: 'ref is required' });

  const params = new URLSearchParams({
    photo_reference: ref,
    maxwidth: String(maxwidth),
    key: process.env.GOOGLE_API_KEY,
  });

  try {
    const response = await fetch(`${PHOTO_URL}?${params}`);
    if (!response.ok) return res.status(502).end();

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch {
    res.status(502).end();
  }
});

export default router;
