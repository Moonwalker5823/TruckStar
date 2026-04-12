# Food Truck Finder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Food Truck Finder — Vue 3 + Leaflet frontend, Express + MySQL2 backend, Google Places API integration — as a single monorepo in `/Users/ehome/truck_star`.

**Architecture:** `server/` (Express, port 3001) and `src/` (Vue 3 + Vite, port 5173) coexist in one repo. In development, Vite proxies `/api/*` to Express. State lives in `App.vue`; `MapView.vue` is a pure display component that owns the Leaflet instance. The DB cache write is best-effort and never blocks the HTTP response.

**Tech Stack:** Vue 3, Vite 5, Tailwind CSS v4 (`@tailwindcss/vite`), Leaflet 1.x, Express 4, MySQL2, Google Places Nearby Search API, Vitest 2, `@vue/test-utils`, `happy-dom`, `supertest`, `concurrently`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Overwrite | All deps + `dev`, `test` scripts |
| `vite.config.js` | Overwrite | Tailwind plugin + `/api` proxy + Vitest env routing |
| `index.html` | Overwrite | HTML shell with correct title, no scaffold noise |
| `.gitignore` | Update | Add `.env` |
| `.env.example` | Create | Env var template |
| `setup.sql` | Create | MySQL schema (idempotent) |
| `server/index.js` | Create | Express entry — loads dotenv, mounts router |
| `server/db.js` | Create | MySQL2 connection pool |
| `server/services/places.js` | Create | Google Places fetch + result normalisation |
| `server/services/places.test.js` | Create | Unit tests for normalisation + error paths |
| `server/routes/foodTrucks.js` | Create | `GET /api/food-trucks?lat&lng` handler |
| `server/routes/foodTrucks.test.js` | Create | Route validation + error-path integration tests |
| `src/main.js` | Overwrite | Vue app mount (add style.css import) |
| `src/style.css` | Overwrite | Tailwind v4 `@import` |
| `src/App.vue` | Overwrite | Root layout, state, geolocation, fetch, error handling |
| `src/components/MapView.vue` | Create | Leaflet map init, marker add/clear |
| `src/components/MapView.test.js` | Create | Marker count + prop-change tests |
| `src/App.test.js` | Create | Loading, error, success state tests |
| `src/components/HelloWorld.vue` | Delete | Replaced by MapView.vue |

---

### Task 1: Project Configuration

**Files:**
- Overwrite: `package.json`
- Overwrite: `vite.config.js`
- Overwrite: `index.html`
- Update: `.gitignore`
- Create: `.env.example`
- Create: `setup.sql`

- [ ] **Step 1: Overwrite `package.json`**

```json
{
  "name": "truck_star",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"vite\" \"node --watch server/index.js\"",
    "dev:client": "vite",
    "dev:server": "node --watch server/index.js",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "leaflet": "^1.9.4",
    "mysql2": "^3.11.4",
    "vue": "^3.5.12"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@vitejs/plugin-vue": "^5.1.4",
    "@vue/test-utils": "^2.4.6",
    "concurrently": "^9.0.1",
    "happy-dom": "^15.7.4",
    "supertest": "^7.0.0",
    "tailwindcss": "^4.0.0",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: Overwrite `vite.config.js`**

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    environmentMatchGlobs: [
      ['src/**', 'happy-dom'],
      ['server/**', 'node'],
    ],
  },
});
```

- [ ] **Step 3: Overwrite `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Food Truck Finder</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Add `.env` to `.gitignore`**

Open `.gitignore` and add this line after the existing entries:

```
.env
```

- [ ] **Step 5: Create `.env.example`**

```
GOOGLE_API_KEY=your_google_places_api_key_here
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=food_trucks
PORT=3001
```

- [ ] **Step 6: Create `setup.sql`**

```sql
CREATE DATABASE IF NOT EXISTS food_trucks;
USE food_trucks;

CREATE TABLE IF NOT EXISTS trucks (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL UNIQUE,
  latitude     FLOAT        NOT NULL,
  longitude    FLOAT        NOT NULL,
  cuisine      VARCHAR(255),
  source       VARCHAR(100) DEFAULT 'google_places',
  last_seen_at DATETIME     NOT NULL
);
```

- [ ] **Step 7: Install dependencies**

```bash
npm install
```

Expected: `node_modules` updated, no errors.

- [ ] **Step 8: Commit**

```bash
git init  # only if not already a git repo
git add package.json package-lock.json vite.config.js index.html .gitignore .env.example setup.sql
git commit -m "chore: project configuration — add Express/MySQL/Tailwind/Vitest deps"
```

---

### Task 2: Database Module

**Files:**
- Create: `server/db.js`

- [ ] **Step 1: Create `server/db.js`**

```javascript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'food_trucks',
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
```

Note: env vars are loaded by `server/index.js` (`import 'dotenv/config'`) before this module is evaluated in production. Tests mock this module entirely, so env vars are irrelevant during testing.

- [ ] **Step 2: Commit**

```bash
git add server/db.js
git commit -m "feat: add MySQL2 connection pool"
```

---

### Task 3: Google Places Service + Tests

**Files:**
- Create: `server/services/places.js`
- Create: `server/services/places.test.js`

- [ ] **Step 1: Write the failing tests — create `server/services/places.test.js`**

```javascript
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
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- server/services/places.test.js
```

Expected: FAIL — `Cannot find module './places.js'`

- [ ] **Step 3: Implement `server/services/places.js`**

```javascript
const PLACES_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

export async function fetchNearbyFoodTrucks(lat, lng) {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: '5000',
    keyword: 'food truck',
    key: process.env.GOOGLE_API_KEY,
  });

  const response = await fetch(`${PLACES_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API returned status: ${data.status}`);
  }

  return (data.results || []).map(place => ({
    name: place.name,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    cuisine: place.types?.[0] ?? null,
  }));
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- server/services/places.test.js
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add server/services/places.js server/services/places.test.js
git commit -m "feat: add Google Places service with normalisation"
```

---

### Task 4: Food Trucks Route + Tests

**Files:**
- Create: `server/routes/foodTrucks.js`
- Create: `server/routes/foodTrucks.test.js`

- [ ] **Step 1: Write the failing tests — create `server/routes/foodTrucks.test.js`**

```javascript
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- server/routes/foodTrucks.test.js
```

Expected: FAIL — `Cannot find module './foodTrucks.js'`

- [ ] **Step 3: Implement `server/routes/foodTrucks.js`**

```javascript
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- server/routes/foodTrucks.test.js
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add server/routes/foodTrucks.js server/routes/foodTrucks.test.js
git commit -m "feat: add food trucks route with validation and best-effort DB cache"
```

---

### Task 5: Express Server Entry

**Files:**
- Create: `server/index.js`

- [ ] **Step 1: Create `server/index.js`**

```javascript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import foodTrucksRouter from './routes/foodTrucks.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api/food-trucks', foodTrucksRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 2: Create `.env` from the example**

```bash
cp .env.example .env
```

Then open `.env` and fill in `DB_PASSWORD` (and `GOOGLE_API_KEY` when you have it).

- [ ] **Step 3: Create the MySQL database**

```bash
mysql -u root -p < setup.sql
```

Expected: no errors. If prompted for password, enter your MySQL root password.

- [ ] **Step 4: Smoke-test the server**

```bash
node server/index.js &
curl "http://localhost:3001/api/food-trucks?lat=37.77&lng=-122.41"
kill %1
```

Expected (without a real API key): `{"error":"Failed to fetch nearby trucks"}` with status 502, OR a real response if the API key is set. Either way, the server starts and responds without crashing.

- [ ] **Step 5: Commit**

```bash
git add server/index.js
git commit -m "feat: add Express server entry with cors and dotenv"
```

---

### Task 6: Frontend Base

**Files:**
- Overwrite: `src/style.css`
- Overwrite: `src/main.js`
- Delete: `src/components/HelloWorld.vue`

- [ ] **Step 1: Overwrite `src/style.css`**

Replace the entire file with:

```css
@import "tailwindcss";
```

- [ ] **Step 2: Overwrite `src/main.js`**

```javascript
import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

createApp(App).mount('#app');
```

- [ ] **Step 3: Delete `src/components/HelloWorld.vue`**

```bash
rm src/components/HelloWorld.vue
```

- [ ] **Step 4: Commit**

```bash
git add src/style.css src/main.js
git rm src/components/HelloWorld.vue
git commit -m "chore: replace scaffold styles/components with Tailwind v4 base"
```

---

### Task 7: MapView Component + Tests

**Files:**
- Create: `src/components/MapView.vue`
- Create: `src/components/MapView.test.js`

- [ ] **Step 1: Write the failing tests — create `src/components/MapView.test.js`**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

// Must be declared before MapView is imported
vi.mock('leaflet', () => {
  const makeMarker = () => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  });
  const mapInstance = {
    setView: vi.fn().mockReturnThis(),
  };
  return {
    default: {
      map: vi.fn(() => mapInstance),
      tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
      marker: vi.fn(() => makeMarker()),
      Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
    },
  };
});

vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet/dist/images/marker-icon.png', () => ({ default: '' }));
vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({ default: '' }));
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: '' }));

import L from 'leaflet';
import MapView from './MapView.vue';

describe('MapView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls L.marker once per truck on mount', async () => {
    const trucks = [
      { name: 'Taco Truck', lat: 37.77, lng: -122.41, cuisine: 'food' },
      { name: 'Pizza Van', lat: 37.78, lng: -122.42, cuisine: 'pizza' },
    ];

    mount(MapView, {
      props: { trucks, center: { lat: 37.77, lng: -122.41 } },
    });
    await flushPromises();

    expect(L.marker).toHaveBeenCalledTimes(2);
    expect(L.marker).toHaveBeenCalledWith([37.77, -122.41]);
    expect(L.marker).toHaveBeenCalledWith([37.78, -122.42]);
  });

  it('clears old markers and adds new ones when trucks prop changes', async () => {
    const wrapper = mount(MapView, {
      props: {
        trucks: [{ name: 'Old Truck', lat: 37.77, lng: -122.41, cuisine: null }],
        center: { lat: 37.77, lng: -122.41 },
      },
    });
    await flushPromises();

    await wrapper.setProps({
      trucks: [
        { name: 'New A', lat: 37.78, lng: -122.42, cuisine: null },
        { name: 'New B', lat: 37.79, lng: -122.43, cuisine: null },
      ],
    });
    await flushPromises();

    // 1 on mount + 2 after prop change = 3 total
    expect(L.marker).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- src/components/MapView.test.js
```

Expected: FAIL — `Cannot find module './MapView.vue'`

- [ ] **Step 3: Implement `src/components/MapView.vue`**

```vue
<template>
  <div ref="mapContainer" class="w-full h-full" />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix broken marker icons in Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
});

const props = defineProps({
  trucks: { type: Array, default: () => [] },
  center: { type: Object, default: () => ({ lat: 37.7749, lng: -122.4194 }) },
});

const mapContainer = ref(null);
let map = null;
const markers = [];

function clearMarkers() {
  markers.forEach(m => m.remove());
  markers.length = 0;
}

function addMarkers(trucks) {
  trucks.forEach(truck => {
    const marker = L.marker([truck.lat, truck.lng])
      .addTo(map)
      .bindPopup(`<strong>${truck.name}</strong>`);
    markers.push(marker);
  });
}

onMounted(() => {
  map = L.map(mapContainer.value).setView(
    [props.center.lat, props.center.lng],
    14,
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  addMarkers(props.trucks);
});

watch(
  () => props.trucks,
  newTrucks => {
    if (!map) return;
    clearMarkers();
    addMarkers(newTrucks);
  },
  { deep: true },
);

watch(
  () => props.center,
  newCenter => {
    if (!map || !newCenter) return;
    map.setView([newCenter.lat, newCenter.lng], 14);
  },
);
</script>
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- src/components/MapView.test.js
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/MapView.vue src/components/MapView.test.js
git commit -m "feat: add MapView component with Leaflet marker management"
```

---

### Task 8: App.vue + Tests

**Files:**
- Create: `src/App.test.js`
- Overwrite: `src/App.vue`

- [ ] **Step 1: Write the failing tests — create `src/App.test.js`**

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('./components/MapView.vue', () => ({
  default: { name: 'MapView', template: '<div class="mock-map" />' },
}));

import App from './App.vue';

describe('App', () => {
  beforeEach(() => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((success) =>
          success({ coords: { latitude: 37.77, longitude: -122.41 } }),
        ),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows loading state while fetching', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))); // never resolves

    const wrapper = mount(App);

    // Loading is shown synchronously after geolocation resolves and fetch starts
    await vi.waitFor(() => expect(wrapper.text()).toContain('Searching...'));
  });

  it('passes fetched trucks to MapView', async () => {
    const mockTrucks = [
      { name: 'Taco Truck', lat: 37.77, lng: -122.41, cuisine: 'food' },
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTrucks),
    }));

    const wrapper = mount(App);
    await flushPromises();

    const mapView = wrapper.findComponent({ name: 'MapView' });
    expect(mapView.props('trucks')).toEqual(mockTrucks);
  });

  it('shows error when geolocation is denied', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((_, error) =>
          error(new Error('User denied geolocation')),
        ),
      },
      configurable: true,
    });

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('Location access required');
  });

  it('shows error when API fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to fetch nearby trucks' }),
    }));

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('Failed to fetch nearby trucks');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- src/App.test.js
```

Expected: FAIL — App.vue still has the scaffold template.

- [ ] **Step 3: Overwrite `src/App.vue`**

```vue
<template>
  <div class="flex flex-col h-screen bg-gray-900 text-white">
    <header class="flex items-center justify-between px-6 py-4 bg-gray-800 shadow-md shrink-0">
      <h1 class="text-2xl font-bold tracking-tight">Food Truck Finder</h1>
      <div class="flex items-center gap-4">
        <span v-if="error" class="text-sm text-red-400">{{ error }}</span>
        <span v-if="loading" class="text-sm text-gray-400">Searching...</span>
        <button
          @click="refresh"
          :disabled="loading"
          class="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors"
        >
          Refresh Location
        </button>
      </div>
    </header>
    <main class="flex-1 overflow-hidden">
      <MapView :trucks="trucks" :center="userLocation" />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import MapView from './components/MapView.vue';

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };

const trucks = ref([]);
const userLocation = ref(DEFAULT_CENTER);
const loading = ref(false);
const error = ref(null);

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Location access required. Please allow location in your browser.')),
    );
  });
}

async function fetchTrucks(lat, lng) {
  const response = await fetch(`/api/food-trucks?lat=${lat}&lng=${lng}`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch nearby trucks');
  }
  return response.json();
}

async function refresh() {
  loading.value = true;
  error.value = null;
  try {
    const location = await getLocation();
    userLocation.value = location;
    trucks.value = await fetchTrucks(location.lat, location.lng);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(refresh);
</script>
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- src/App.test.js
```

Expected: PASS — 4 tests

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: PASS — all 15 tests (4 places + 5 foodTrucks + 2 MapView + 4 App)

- [ ] **Step 6: Commit**

```bash
git add src/App.vue src/App.test.js
git commit -m "feat: add App.vue with geolocation, fetch, error handling, and map layout"
```

---

### Task 9: End-to-End Smoke Test

**Files:** None — manual verification only.

- [ ] **Step 1: Ensure `.env` is configured**

Open `.env` and confirm:
- `GOOGLE_API_KEY` is set to a valid Google Places API key
- `DB_PASSWORD` matches your MySQL root password
- All other values are correct

- [ ] **Step 2: Start both servers**

```bash
npm run dev
```

Expected output:
```
[0] VITE v5.x  ready in Xms  ➜  Local: http://localhost:5173/
[1] Server running on http://localhost:3001
```

- [ ] **Step 3: Verify the API endpoint directly**

```bash
curl "http://localhost:3001/api/food-trucks?lat=37.7749&lng=-122.4194"
```

Expected: JSON array of food truck objects (or `[]` if none nearby).

- [ ] **Step 4: Open the app in a browser**

Navigate to `http://localhost:5173`.

- Browser should prompt for location permission — click Allow.
- Map should appear centered on your location.
- Food truck markers should appear within ~5km.
- Click a marker — popup should show the truck name.
- Click "Refresh Location" — map should reload.

- [ ] **Step 5: Verify DB caching**

```bash
mysql -u root -p food_trucks -e "SELECT name, latitude, longitude, last_seen_at FROM trucks LIMIT 5;"
```

Expected: rows matching the trucks shown on the map.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: complete Food Truck Finder MVP"
```
