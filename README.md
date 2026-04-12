# Truck Star

A full-stack food truck finder for the United States. Detects your location (or lets you search any US city, address, or zip code), shows nearby food trucks on an interactive map, and displays rich truck details including photos, phone numbers, and website links.

---

## Features

- **Live geolocation** — detects your current location and searches nearby food trucks
- **Location search** — search any US city, address, or zip code; map flies to the result
- **Interactive map** — Leaflet markers for every found truck; click any card to fly the map to it
- **Rich truck cards** — Google Places photo, cuisine type, phone number, website/menu link, Google Maps link
- **Detail panel** — side-by-side with the map on desktop, stacked below on mobile
- **Hot Spots** — curated row of 5 top US food trucks always visible below the map
- **MySQL cache** — every API result is upserted to a local database
- **USA-only** — geolocation and search are restricted to the contiguous US, Alaska, and Hawaii
- **Fully responsive** — mobile, tablet, and desktop layouts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 (`<script setup>`), Vite, Tailwind CSS v3, Leaflet.js |
| Backend | Node.js, Express 4 |
| Database | MySQL 8 (mysql2 promise pool) |
| Places | Google Places Nearby Search + Details + Photo APIs |
| Geocoding | Nominatim (OpenStreetMap) — no key required |
| Testing | Vitest, @vue/test-utils, supertest |

---

## Prerequisites

- Node.js 18+
- MySQL 8 running locally
- A [Google Places API key](https://console.cloud.google.com/) with the **Places API** enabled (Nearby Search, Details, Photo)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
GOOGLE_API_KEY=your_google_places_api_key_here
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=food_trucks
PORT=3001
```

### 3. Create the database

```bash
mysql -u root -p < setup.sql
```

Safe to re-run — uses `IF NOT EXISTS` and `ALTER TABLE … IF NOT EXISTS` for any new columns.

### 4. Start the app

```bash
npm run dev
```

Starts Vite (port 5173) and Express (port 3001) concurrently. Open [http://localhost:5173](http://localhost:5173) and allow location access when prompted.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite + Express in watch mode |
| `npm test` | Run all Vitest tests (23 tests) |
| `npm run build` | Production Vite build |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/food-trucks?lat=&lng=` | Fetch nearby food trucks from Google Places and upsert to DB |
| `GET` | `/api/place-photo?ref=&maxwidth=` | Proxy a Google Places photo server-side (API key never exposed) |

---

## Project Structure

```
truck_star/
├── server/
│   ├── index.js               # Express entry point
│   ├── db.js                  # MySQL connection pool
│   ├── routes/
│   │   ├── foodTrucks.js      # GET /api/food-trucks
│   │   ├── foodTrucks.test.js
│   │   ├── placePhoto.js      # GET /api/place-photo (photo proxy)
│   │   └── placePhoto.test.js
│   └── services/
│       ├── places.js          # Google Places API client (Nearby Search + Details)
│       └── places.test.js
├── src/
│   ├── App.vue                # Root component — layout, state, geolocation, search
│   ├── App.test.js
│   ├── assets/
│   │   └── TruckStar.png
│   └── components/
│       ├── MapView.vue        # Leaflet map wrapper
│       ├── MapView.test.js
│       ├── TruckCard.vue      # Sidebar result card
│       ├── TruckDetail.vue    # Side panel detail view
│       └── HotSpotCard.vue    # Hot Spots section card
├── setup.sql                  # Database schema
├── .env.example               # Environment variable template
├── vite.config.js
├── tailwind.config.cjs
└── postcss.config.cjs
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GOOGLE_API_KEY` | — | Google Places API key (required) |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | — | MySQL password |
| `DB_NAME` | `food_trucks` | MySQL database name |
| `PORT` | `3001` | Express server port |
