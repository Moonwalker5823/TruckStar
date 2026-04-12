<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Navbar -->
    <header ref="headerRef" class="bg-gray-800 shadow-md">
      <div class="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 shrink-0">
          <img :src="logoUrl" alt="Truck Star" class="h-9 w-auto" />
          <h1 class="text-xl font-bold tracking-tight">Truck Star</h1>
        </div>
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <input
            v-model="searchQuery"
            @keyup.enter="searchLocation"
            type="text"
            placeholder="Search city, address, or zip code..."
            class="flex-1 min-w-0 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-orange-500"
          />
          <button
            @click="searchLocation"
            :disabled="loading || !searchQuery.trim()"
            class="shrink-0 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors"
          >
            Search
          </button>
        </div>
        <button
          @click="refresh"
          :disabled="loading"
          class="shrink-0 px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors"
        >
          {{ loading ? 'Searching...' : 'Use My Location' }}
        </button>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-6 py-6 space-y-5">
      <!-- Map + side panel -->
      <div class="flex gap-6">
        <div class="flex-1 h-[500px] rounded-xl overflow-hidden ring-1 ring-gray-700">
          <MapView :trucks="trucks" :center="userLocation" />
        </div>

        <!-- Right panel: detail view or cards list -->
        <div class="w-80 h-[500px]">
          <TruckDetail
            v-if="selectedTruck"
            :truck="selectedTruck"
            @close="selectedTruck = null"
            @show-on-map="loc => { userLocation = loc; selectedTruck = null; }"
          />
          <div v-else class="flex flex-col gap-3 overflow-y-auto h-full pr-1">
            <p v-if="trucks.length" class="text-xs text-gray-400 px-1 shrink-0">
              {{ trucks.length }} truck{{ trucks.length === 1 ? '' : 's' }} found nearby
            </p>
            <TruckCard
              v-for="truck in trucks"
              :key="truck.name"
              :truck="truck"
              @select="selectedTruck = truck"
            />
            <p v-if="!trucks.length && !loading" class="text-gray-500 text-sm text-center pt-10">
              Search a location or use your current location to find nearby food trucks.
            </p>
          </div>
        </div>
      </div>

      <!-- Error -->
      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

      <!-- Hot Spots -->
      <div>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Hot Spots — Top US Food Trucks
        </h2>
        <div class="grid grid-cols-5 gap-4">
          <HotSpotCard
            v-for="truck in POPULAR_TRUCKS"
            :key="truck.name"
            :truck="truck"
            @select="selectTruck(truck)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import MapView from './components/MapView.vue';
import TruckCard from './components/TruckCard.vue';
import TruckDetail from './components/TruckDetail.vue';
import HotSpotCard from './components/HotSpotCard.vue';
import logoUrl from './assets/TruckStar.png';

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };

const POPULAR_TRUCKS = [
  { name: 'Kogi BBQ', lat: 34.0522, lng: -118.2437, cuisine: 'Korean-Mexican', tagline: 'The food truck that started a revolution', city: 'Los Angeles, CA' },
  { name: 'The Halal Guys', lat: 40.7614, lng: -73.9776, cuisine: 'Halal', tagline: 'NYC street food icon since 1990', city: 'New York, NY' },
  { name: "Luke's Lobster", lat: 43.6591, lng: -70.2568, cuisine: 'Seafood', tagline: 'Sustainably sourced Maine lobster rolls', city: 'Portland, ME' },
  { name: 'Cousins Maine Lobster', lat: 33.7490, lng: -84.3880, cuisine: 'Seafood', tagline: 'As seen on Shark Tank', city: 'Nationwide' },
  { name: 'Coolhaus', lat: 34.0195, lng: -118.4912, cuisine: 'Dessert', tagline: 'Architecture-inspired ice cream sandwiches', city: 'Los Angeles, CA' },
];

const headerRef = ref(null);
const trucks = ref([]);
const userLocation = ref(DEFAULT_CENTER);
const searchQuery = ref('');
const loading = ref(false);
const error = ref(null);
const selectedTruck = ref(null);

function selectTruck(truck) {
  selectedTruck.value = truck;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

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

async function geocodeLocation(query) {
  const params = new URLSearchParams({ q: query, format: 'json', limit: '1' });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!response.ok) throw new Error('Geocoding service unavailable');
  const results = await response.json();
  if (!results.length) throw new Error(`No location found for "${query}"`);
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
}

async function refresh() {
  loading.value = true;
  error.value = null;
  try {
    const location = await getLocation();
    userLocation.value = location;            // move map immediately
    trucks.value = await fetchTrucks(location.lat, location.lng);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function searchLocation() {
  if (!searchQuery.value.trim()) return;
  loading.value = true;
  error.value = null;
  try {
    const location = await geocodeLocation(searchQuery.value.trim());
    userLocation.value = location;            // move map immediately after geocoding
    trucks.value = await fetchTrucks(location.lat, location.lng);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (headerRef.value) {
    document.documentElement.style.setProperty('--navbar-h', `${headerRef.value.offsetHeight}px`);
  }
  refresh();
});
</script>
