# Food Truck Finder — Design Spec

**Date:** 2026-04-12
**Status:** Approved

---

## Overview

A single-page web app that detects the user's location, queries nearby food trucks via the Google Places API, caches results in MySQL, and displays them as markers on a Leaflet map. Built as a recruiter-ready portfolio MVP.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Vue 3 + Vite |
| Styling | TailwindCSS (npm, not CDN) |
| Map | Leaflet.js (npm) |
| Backend | Node.js + Express |
| Database | MySQL (running locally, DB to be created via setup.sql) |
| External API | Google Places Nearby Search |
| Dev tooling | concurrently (run Vite + Express together) |

---

## Repository Structure

```
truck_star/
├── server/
│   ├── index.js              # Express entry point, cors, routes
│   ├── db.js                 # MySQL2 connection pool
│   ├── routes/
│   │   └── foodTrucks.js     # GET /api/food-trucks?lat&lng
│   └── services/
│       └── places.js         # Google Places Nearby Search integration
├── src/
│   ├── App.vue               # Root layout, state owner
│   ├── components/
│   │   └── MapView.vue       # Leaflet map + markers (display only)
│   ├── main.js               # Vue entry point
│   └── style.css             # Tailwind directives (@tailwind base/components/utilities)
├── public/
├── .env                      # Secret keys and DB config (gitignored)
├── .env.example              # Committed template
├── setup.sql                 # MySQL schema creation script
├── package.json              # All frontend + backend dependencies
├── vite.config.js            # Vite config with /api/* proxy to Express
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-04-12-food-truck-finder-design.md
```

---

## Architecture

**Development:** Vite dev server (port 5173) proxies `/api/*` to Express (port 3001). Both run simultaneously via `concurrently` from a single `npm run dev` command. No CORS issues in dev.

**Production:** `vite build` produces `dist/`. Express serves `dist/` as static files and continues handling `/api/*` routes. Single server, single port.

---

## Data Flow

```
Browser
  │  navigator.geolocation → { lat, lng }
  │  GET /api/food-trucks?lat=X&lng=Y
  ▼
Vite Proxy (dev) / Express static middleware (prod)
  ▼
Express (port 3001)
  │  1. Call Google Places Nearby Search
  │       location=lat,lng  |  radius=5000m  |  keyword="food truck"
  │  2. For each result:
  │       INSERT INTO trucks (...) ON DUPLICATE KEY UPDATE
  │         latitude, longitude, last_seen_at
  │  3. Return normalized JSON array:
  │       [{ name, lat, lng, cuisine }]
  ▼
Vue — App.vue
  │  Passes trucks array as prop to MapView.vue
  ▼
MapView.vue
  │  Centers Leaflet map on user location
  │  Drops a marker per truck
  └─ Marker click → popup showing truck name
```

---

## Database Schema

```sql
-- setup.sql
CREATE DATABASE IF NOT EXISTS food_trucks;
USE food_trucks;

CREATE TABLE IF NOT EXISTS trucks (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL UNIQUE,
  latitude     DECIMAL(10, 7) NOT NULL,
  longitude    DECIMAL(10, 7) NOT NULL,
  cuisine      VARCHAR(255),
  source       VARCHAR(100) DEFAULT 'google_places',
  last_seen_at DATETIME     NOT NULL
);
```

`name` is the unique key for upserts. Repeat searches update `latitude`, `longitude`, and `last_seen_at` in place rather than inserting duplicates.

---

## Environment Variables

```
# .env (gitignored)
GOOGLE_API_KEY=your_key_here
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=food_trucks
PORT=3001
```

---

## Frontend Components

### `App.vue`
- Owns all state: `userLocation`, `trucks`, `loading`, `error`
- Layout: fixed header bar (title + Refresh button) + full-viewport map below
- On mount: calls geolocation, then fetches `/api/food-trucks`
- "Refresh Location" button: re-runs geolocation then re-fetches
- Passes `trucks` array and `userLocation` as props to `MapView.vue`

### `MapView.vue`
- Purely display — no state of its own
- Props: `trucks: Array`, `center: Object ({ lat, lng })`
- Initializes Leaflet map in `onMounted`
- `watch(trucks)` — clears all markers and re-adds them when the array changes
- Each marker binds a popup with the truck's `name`

---

## API

### `GET /api/food-trucks?lat={lat}&lng={lng}`

**Request params:**
- `lat` — float, required
- `lng` — float, required

**Response (200):**
```json
[
  { "name": "Taco Loco", "lat": 37.7749, "lng": -122.4194, "cuisine": "mexican_restaurant" },
  ...
]
```

**Response (400):** Missing or invalid lat/lng params.
**Response (502):** Google Places API call failed.
**Response (500):** Unexpected server error.

### Google Places Nearby Search

- Endpoint: `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
- Params: `location=lat,lng`, `radius=5000`, `keyword=food+truck`, `key=GOOGLE_API_KEY`
- `cuisine` is derived from the first entry in the result's `types` array when present; null otherwise.

---

## Error Handling

| Failure | Backend behavior | Frontend behavior |
|---|---|---|
| Geolocation denied | N/A | Show inline error in header; map renders centered on default coords (San Francisco) |
| Google Places API failure | Log error, return 502 | Show error message in header; keep existing markers if any |
| MySQL upsert failure | Log error, still return Places results | Transparent to user — cache miss is non-blocking |
| Missing lat/lng params | Return 400 | Show generic error message |

---

## Run Instructions

```bash
# 1. Install dependencies
npm install

# 2. Create MySQL database and table
mysql -u root -p < setup.sql

# 3. Configure environment
cp .env.example .env
# Edit .env: add GOOGLE_API_KEY and DB_PASSWORD

# 4. Start development servers
npm run dev
# Vite: http://localhost:5173
# Express: http://localhost:3001
```

---

## Out of Scope (MVP)

- Authentication / user accounts
- Admin truck submission form
- Distance sorting
- Cache freshness indicators
- Pagination or result limits beyond Google's default (20)
